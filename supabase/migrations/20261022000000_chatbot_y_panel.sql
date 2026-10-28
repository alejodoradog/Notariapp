-- =====================================================================
-- NotariApp — Chatbot de WhatsApp y panel de atención (Demo 1)
-- Depende de: 20261021000000_nucleo_financiero.sql
-- Escrituras del bot: las hace el webhook en el servidor con service_role,
-- después de validar la firma de Meta. Escrituras del personal: solo por RPC.
-- =====================================================================

-- ---------- Datos públicos de la notaría ----------
CREATE TABLE public.notaria_perfil (
  notaria_id          uuid PRIMARY KEY REFERENCES public.notarias(id),
  nombre_publico      text NOT NULL,
  ciudad              text NOT NULL,
  direccion           text,
  telefono            text,
  correo              text,
  horario             text,            -- texto legible: "Lunes a viernes 8:00 a. m. a 12:00 m. y 2:00 a 5:00 p. m."
  mapa_url            text,
  politica_datos_url  text,
  actualizado_en      timestamptz NOT NULL DEFAULT now()
);

-- ---------- Catálogo de trámites ----------
-- notaria_id NULL = catálogo base (fuentes públicas). Una fila con notaria_id
-- sobrescribe la base para esa notaría (por ejemplo, cuando Cano valida un trámite).
CREATE TABLE public.catalogo_tramites (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notaria_id            uuid REFERENCES public.notarias(id),
  codigo                text NOT NULL,
  nombre                text NOT NULL,
  sinonimos             text[] NOT NULL DEFAULT '{}',
  descripcion           text NOT NULL,
  requisitos            text[] NOT NULL,
  casos_especiales      text[] NOT NULL DEFAULT '{}',
  notas                 text[] NOT NULL DEFAULT '{}',
  tarifa                jsonb NOT NULL,
  fuentes               text[] NOT NULL DEFAULT '{}',
  validado_por_notaria  boolean NOT NULL DEFAULT false,
  activo                boolean NOT NULL DEFAULT true,
  vigencia_desde        date NOT NULL,
  UNIQUE NULLS NOT DISTINCT (notaria_id, codigo)
);

-- ---------- Conversaciones y mensajes ----------
CREATE TABLE public.conversaciones (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notaria_id        uuid NOT NULL REFERENCES public.notarias(id),
  telefono          text NOT NULL,      -- formato E.164 sin '+', como lo entrega Meta
  nombre_perfil     text,               -- nombre del perfil de WhatsApp, si lo comparte
  estado            text NOT NULL DEFAULT 'bot' CHECK (estado IN ('bot','humano','cerrada')),
  atendida_por      uuid REFERENCES public.usuarios(id),
  iniciada_en       timestamptz NOT NULL DEFAULT now(),
  ultima_actividad  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (notaria_id, telefono)
);

CREATE TABLE public.mensajes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notaria_id       uuid NOT NULL REFERENCES public.notarias(id),
  conversacion_id  uuid NOT NULL REFERENCES public.conversaciones(id),
  direccion        text NOT NULL CHECK (direccion IN ('entrante','saliente')),
  autor            text NOT NULL CHECK (autor IN ('ciudadano','bot','empleado')),
  empleado_id      uuid REFERENCES public.usuarios(id),
  wa_message_id    text UNIQUE,         -- deduplica los reintentos de Meta
  tipo             text NOT NULL DEFAULT 'texto',
  contenido        text,
  intencion        text,                -- ej. requisitos, costo, horario, solicitud, humano, fuera_de_tema
  tramite_codigo   text,
  herramientas     jsonb,               -- herramientas usadas por el bot en esta respuesta
  creado_en        timestamptz NOT NULL DEFAULT now(),
  fecha_operativa  date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Bogota')::date,
  CHECK ((autor = 'ciudadano') = (direccion = 'entrante')),
  CHECK ((autor = 'empleado') = (empleado_id IS NOT NULL))
);
CREATE INDEX mensajes_por_conversacion ON public.mensajes (conversacion_id, creado_en);
CREATE INDEX mensajes_por_dia ON public.mensajes (notaria_id, fecha_operativa);

-- ---------- Solicitudes (gestión temprana de trámites) ----------
CREATE TABLE public.solicitudes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notaria_id          uuid NOT NULL REFERENCES public.notarias(id),
  conversacion_id     uuid REFERENCES public.conversaciones(id),
  tipo                text NOT NULL CHECK (tipo IN ('tramite','cita','llamada')),
  tramite_codigo      text,
  nombre              text NOT NULL,
  telefono            text NOT NULL,
  detalle             text,
  preferencia_horario text,
  -- Ley 1581 de 2012: sin autorización no se guarda la solicitud.
  autoriza_datos      boolean NOT NULL CHECK (autoriza_datos),
  autorizado_en       timestamptz NOT NULL DEFAULT now(),
  codigo_seguimiento  text NOT NULL UNIQUE
                      DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  estado              text NOT NULL DEFAULT 'nueva'
                      CHECK (estado IN ('nueva','contactada','convertida','descartada')),
  nota_interna        text,
  tramite_id          uuid UNIQUE REFERENCES public.tramites(id),
  creado_en           timestamptz NOT NULL DEFAULT now(),
  fecha_operativa     date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Bogota')::date
);

CREATE TRIGGER audit_solicitudes AFTER INSERT OR UPDATE OR DELETE ON public.solicitudes
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit();
CREATE TRIGGER audit_conversaciones AFTER UPDATE ON public.conversaciones
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit();

-- ---------- RPC del personal ----------
-- Atender una solicitud: nueva → contactada | descartada; contactada → descartada.
-- La conversión a trámite tiene su propia función.
CREATE FUNCTION public.atender_solicitud(p_solicitud uuid, p_estado text, p_nota text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_actual text;
BEGIN
  IF public.mi_rol() NOT IN ('empleado','notario','cajero') THEN RAISE EXCEPTION 'usuario no autorizado'; END IF;
  SELECT estado INTO v_actual FROM public.solicitudes
   WHERE id = p_solicitud AND notaria_id = public.mi_notaria() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'solicitud no encontrada'; END IF;
  IF NOT ((v_actual = 'nueva' AND p_estado IN ('contactada','descartada'))
       OR (v_actual = 'contactada' AND p_estado = 'descartada')) THEN
    RAISE EXCEPTION 'no se puede pasar de % a %', v_actual, p_estado;
  END IF;
  UPDATE public.solicitudes
     SET estado = p_estado, nota_interna = coalesce(p_nota, nota_interna)
   WHERE id = p_solicitud;
END $$;

-- Convertir una solicitud de trámite en un trámite radicado.
CREATE FUNCTION public.convertir_solicitud(p_solicitud uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE s public.solicitudes%ROWTYPE; v_tramite uuid; v_nombre text;
BEGIN
  IF public.mi_rol() NOT IN ('empleado','notario') THEN RAISE EXCEPTION 'usuario no autorizado'; END IF;
  SELECT * INTO s FROM public.solicitudes
   WHERE id = p_solicitud AND notaria_id = public.mi_notaria() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'solicitud no encontrada'; END IF;
  IF s.estado NOT IN ('nueva','contactada') THEN RAISE EXCEPTION 'la solicitud ya fue %', s.estado; END IF;
  IF s.tipo <> 'tramite' OR s.tramite_codigo IS NULL THEN
    RAISE EXCEPTION 'solo las solicitudes de trámite se pueden radicar';
  END IF;
  SELECT nombre INTO v_nombre FROM public.catalogo_tramites
   WHERE codigo = s.tramite_codigo AND (notaria_id = s.notaria_id OR notaria_id IS NULL)
   ORDER BY notaria_id NULLS LAST LIMIT 1;
  v_tramite := public.radicar_tramite(coalesce(v_nombre, s.tramite_codigo));
  UPDATE public.solicitudes SET estado = 'convertida', tramite_id = v_tramite WHERE id = s.id;
  RETURN v_tramite;
END $$;

-- Un funcionario toma la conversación: el bot deja de responder.
CREATE FUNCTION public.tomar_conversacion(p_conversacion uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF public.mi_rol() IS NULL THEN RAISE EXCEPTION 'usuario no autorizado'; END IF;
  UPDATE public.conversaciones SET estado = 'humano', atendida_por = auth.uid()
   WHERE id = p_conversacion AND notaria_id = public.mi_notaria() AND estado <> 'cerrada';
  IF NOT FOUND THEN RAISE EXCEPTION 'conversación no encontrada o cerrada'; END IF;
END $$;

CREATE FUNCTION public.devolver_al_bot(p_conversacion uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF public.mi_rol() IS NULL THEN RAISE EXCEPTION 'usuario no autorizado'; END IF;
  UPDATE public.conversaciones SET estado = 'bot', atendida_por = NULL
   WHERE id = p_conversacion AND notaria_id = public.mi_notaria() AND estado = 'humano';
  IF NOT FOUND THEN RAISE EXCEPTION 'la conversación no está en atención humana'; END IF;
END $$;

-- Registra la respuesta de un funcionario. El servidor la envía por WhatsApp
-- después de que esta función confirma que el funcionario tiene la conversación.
CREATE FUNCTION public.registrar_respuesta_empleado(p_conversacion uuid, p_texto text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_id uuid;
BEGIN
  IF length(trim(coalesce(p_texto, ''))) = 0 THEN RAISE EXCEPTION 'el mensaje está vacío'; END IF;
  PERFORM 1 FROM public.conversaciones
   WHERE id = p_conversacion AND notaria_id = public.mi_notaria()
     AND estado = 'humano' AND atendida_por = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'tome la conversación antes de responder'; END IF;
  INSERT INTO public.mensajes (notaria_id, conversacion_id, direccion, autor, empleado_id, contenido)
  VALUES (public.mi_notaria(), p_conversacion, 'saliente', 'empleado', auth.uid(), p_texto)
  RETURNING id INTO v_id;
  UPDATE public.conversaciones SET ultima_actividad = now() WHERE id = p_conversacion;
  RETURN v_id;
END $$;

-- ---------- Permisos ----------
ALTER TABLE public.notaria_perfil    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_tramites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversaciones    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes       ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.notaria_perfil, public.catalogo_tramites, public.conversaciones,
              public.mensajes, public.solicitudes FROM anon, authenticated;
GRANT SELECT ON public.notaria_perfil, public.catalogo_tramites, public.conversaciones,
                public.mensajes, public.solicitudes TO authenticated;

CREATE POLICY lectura_perfil ON public.notaria_perfil FOR SELECT TO authenticated
  USING (notaria_id = (SELECT public.mi_notaria()));
CREATE POLICY lectura_catalogo ON public.catalogo_tramites FOR SELECT TO authenticated
  USING (notaria_id IS NULL OR notaria_id = (SELECT public.mi_notaria()));
CREATE POLICY lectura_conversaciones ON public.conversaciones FOR SELECT TO authenticated
  USING (notaria_id = (SELECT public.mi_notaria()));
CREATE POLICY lectura_mensajes ON public.mensajes FOR SELECT TO authenticated
  USING (notaria_id = (SELECT public.mi_notaria()));
CREATE POLICY lectura_solicitudes ON public.solicitudes FOR SELECT TO authenticated
  USING (notaria_id = (SELECT public.mi_notaria()));

REVOKE EXECUTE ON FUNCTION
  public.atender_solicitud(uuid, text, text), public.convertir_solicitud(uuid),
  public.tomar_conversacion(uuid), public.devolver_al_bot(uuid),
  public.registrar_respuesta_empleado(uuid, text)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION
  public.atender_solicitud(uuid, text, text), public.convertir_solicitud(uuid),
  public.tomar_conversacion(uuid), public.devolver_al_bot(uuid),
  public.registrar_respuesta_empleado(uuid, text)
TO authenticated;
