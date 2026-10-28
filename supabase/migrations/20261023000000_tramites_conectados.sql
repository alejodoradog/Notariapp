-- =====================================================================
-- NotariApp — Trámites conectados con el ciudadano
-- Depende de: nucleo_financiero y chatbot_y_panel.
-- Agrega: personas del trámite (con celular y autorización para avisos),
-- historial legible, cambio de estado con transiciones válidas, cola de
-- avisos por WhatsApp y la consulta de trámites por el celular del ciudadano.
-- =====================================================================

-- ---------- Personas del trámite ----------
CREATE TABLE public.tramite_partes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notaria_id      uuid NOT NULL REFERENCES public.notarias(id),
  tramite_id      uuid NOT NULL REFERENCES public.tramites(id),
  nombre          text NOT NULL CHECK (length(trim(nombre)) >= 3),
  tipo_documento  text NOT NULL DEFAULT 'CC' CHECK (tipo_documento IN ('CC','CE','PA','TI','NIT','PPT')),
  documento       text,               -- completo para el personal; las listas lo muestran enmascarado
  telefono        text CHECK (telefono IS NULL OR telefono ~ '^[0-9]{10,15}$'),  -- 57 + celular, sin '+'
  rol             text NOT NULL CHECK (rol IN ('solicitante','otorgante','comprador','vendedor',
                                               'contrayente','heredero','apoderado','otro')),
  autoriza_datos  boolean NOT NULL DEFAULT false,
  recibe_avisos   boolean NOT NULL DEFAULT false,
  creado_por      uuid REFERENCES public.usuarios(id),
  creado_en       timestamptz NOT NULL DEFAULT now(),
  -- Ley 1581: sin celular y autorización no hay avisos.
  CHECK (NOT recibe_avisos OR (telefono IS NOT NULL AND autoriza_datos))
);
CREATE INDEX partes_por_tramite  ON public.tramite_partes (tramite_id);
CREATE INDEX partes_por_telefono ON public.tramite_partes (notaria_id, telefono);

-- ---------- Historial legible del trámite ----------
CREATE TABLE public.tramite_eventos (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notaria_id         uuid NOT NULL REFERENCES public.notarias(id),
  tramite_id         uuid NOT NULL REFERENCES public.tramites(id),
  tipo               text NOT NULL CHECK (tipo IN ('radicado','cambio_estado','nota')),
  estado_anterior    text,
  estado_nuevo       text,
  detalle            text,
  visible_ciudadano  boolean NOT NULL DEFAULT false,
  autor_id           uuid REFERENCES public.usuarios(id),
  creado_en          timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX eventos_por_tramite ON public.tramite_eventos (tramite_id, creado_en);

-- ---------- Cola de avisos por WhatsApp ----------
-- La base de datos solo encola. Un proceso del servidor envía cada aviso:
-- texto libre si el ciudadano escribió en las últimas 24 horas; si no, una
-- plantilla aprobada por Meta; si no hay plantilla, queda 'omitida'.
CREATE TABLE public.notificaciones (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notaria_id     uuid NOT NULL REFERENCES public.notarias(id),
  tramite_id     uuid NOT NULL REFERENCES public.tramites(id),
  evento_id      uuid NOT NULL REFERENCES public.tramite_eventos(id),
  parte_id       uuid NOT NULL REFERENCES public.tramite_partes(id),
  telefono       text NOT NULL,
  motivo         text NOT NULL CHECK (motivo IN ('pendiente_doc','listo')),
  detalle        text,
  estado         text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','enviada','fallida','omitida')),
  intentos       int  NOT NULL DEFAULT 0,
  wa_message_id  text,
  error          text,
  creado_en      timestamptz NOT NULL DEFAULT now(),
  procesada_en   timestamptz,
  UNIQUE (evento_id, telefono)
);
CREATE INDEX notificaciones_pendientes ON public.notificaciones (creado_en) WHERE estado = 'pendiente';

-- ---------- Utilidad: celular colombiano normalizado ----------
CREATE FUNCTION public.normalizar_telefono(p text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT CASE
    WHEN regexp_replace(coalesce(p, ''), '\D', '', 'g') = '' THEN NULL
    WHEN length(regexp_replace(p, '\D', '', 'g')) = 10 THEN '57' || regexp_replace(p, '\D', '', 'g')
    ELSE regexp_replace(p, '\D', '', 'g')
  END
$$;

-- ---------- Todo trámite nuevo deja su primer evento ----------
CREATE FUNCTION public.fn_evento_radicado() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.tramite_eventos (notaria_id, tramite_id, tipo, estado_nuevo, detalle, visible_ciudadano, autor_id)
  VALUES (NEW.notaria_id, NEW.id, 'radicado', NEW.estado,
          'Trámite radicado con el número ' || NEW.radicado, true, auth.uid());
  RETURN NULL;
END $$;
CREATE TRIGGER evento_radicado AFTER INSERT ON public.tramites
  FOR EACH ROW EXECUTE FUNCTION public.fn_evento_radicado();

CREATE TRIGGER audit_partes AFTER INSERT OR UPDATE OR DELETE ON public.tramite_partes
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit();

-- ---------- RPC del personal ----------
CREATE FUNCTION public.agregar_parte(
  p_tramite uuid, p_nombre text, p_rol text,
  p_tipo_documento text DEFAULT 'CC', p_documento text DEFAULT NULL, p_telefono text DEFAULT NULL,
  p_autoriza_datos boolean DEFAULT false, p_recibe_avisos boolean DEFAULT false
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_notaria uuid := public.mi_notaria();
  v_estado text;
  v_tel text := public.normalizar_telefono(p_telefono);
  v_id uuid;
BEGIN
  IF public.mi_rol() NOT IN ('empleado','notario') THEN RAISE EXCEPTION 'usuario no autorizado'; END IF;
  SELECT estado INTO v_estado FROM public.tramites WHERE id = p_tramite AND notaria_id = v_notaria;
  IF NOT FOUND THEN RAISE EXCEPTION 'trámite no encontrado'; END IF;
  IF v_estado IN ('entregado','anulado') THEN
    RAISE EXCEPTION 'el trámite está %: ya no se pueden agregar personas', v_estado;
  END IF;
  IF p_recibe_avisos AND (v_tel IS NULL OR NOT p_autoriza_datos) THEN
    RAISE EXCEPTION 'para enviar avisos se necesita el celular y la autorización de datos';
  END IF;
  INSERT INTO public.tramite_partes (notaria_id, tramite_id, nombre, tipo_documento, documento, telefono,
                                     rol, autoriza_datos, recibe_avisos, creado_por)
  VALUES (v_notaria, p_tramite, trim(p_nombre), p_tipo_documento, nullif(trim(coalesce(p_documento, '')), ''),
          v_tel, p_rol, p_autoriza_datos, p_recibe_avisos, auth.uid())
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

-- Cambia el estado, deja el evento en el historial y encola los avisos.
-- Anular no devuelve dinero: los pagos se reversan aparte (reversar_pago).
CREATE FUNCTION public.cambiar_estado(p_tramite uuid, p_estado text, p_detalle text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_notaria uuid := public.mi_notaria();
  v_actual  text;
  v_detalle text := nullif(trim(coalesce(p_detalle, '')), '');
  v_evento  uuid;
BEGIN
  IF public.mi_rol() NOT IN ('empleado','notario') THEN RAISE EXCEPTION 'usuario no autorizado'; END IF;
  SELECT estado INTO v_actual FROM public.tramites
   WHERE id = p_tramite AND notaria_id = v_notaria FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'trámite no encontrado'; END IF;

  IF NOT ((v_actual = 'radicado'      AND p_estado IN ('en_proceso','anulado'))
       OR (v_actual = 'en_proceso'    AND p_estado IN ('pendiente_doc','listo','anulado'))
       OR (v_actual = 'pendiente_doc' AND p_estado IN ('en_proceso','anulado'))
       OR (v_actual = 'listo'         AND p_estado IN ('entregado','anulado'))) THEN
    RAISE EXCEPTION 'no se puede pasar de % a %', v_actual, p_estado;
  END IF;
  IF p_estado = 'anulado' AND public.mi_rol() <> 'notario' THEN
    RAISE EXCEPTION 'solo el notario puede anular un trámite';
  END IF;
  IF p_estado = 'pendiente_doc' AND v_detalle IS NULL THEN RAISE EXCEPTION 'indique qué documento falta'; END IF;
  IF p_estado = 'anulado' AND v_detalle IS NULL THEN RAISE EXCEPTION 'indique el motivo de la anulación'; END IF;

  UPDATE public.tramites SET estado = p_estado WHERE id = p_tramite;

  INSERT INTO public.tramite_eventos (notaria_id, tramite_id, tipo, estado_anterior, estado_nuevo,
                                      detalle, visible_ciudadano, autor_id)
  VALUES (v_notaria, p_tramite, 'cambio_estado', v_actual, p_estado, v_detalle, p_estado <> 'anulado', auth.uid())
  RETURNING id INTO v_evento;

  IF p_estado IN ('pendiente_doc','listo') THEN
    INSERT INTO public.notificaciones (notaria_id, tramite_id, evento_id, parte_id, telefono, motivo, detalle)
    SELECT DISTINCT ON (p.telefono) v_notaria, p_tramite, v_evento, p.id, p.telefono, p_estado, v_detalle
      FROM public.tramite_partes p
     WHERE p.tramite_id = p_tramite AND p.recibe_avisos
     ORDER BY p.telefono, p.creado_en;
  END IF;
  RETURN v_evento;
END $$;

CREATE FUNCTION public.agregar_nota(p_tramite uuid, p_texto text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_notaria uuid := public.mi_notaria(); v_id uuid;
BEGIN
  IF public.mi_rol() IS NULL THEN RAISE EXCEPTION 'usuario no autorizado'; END IF;
  IF length(trim(coalesce(p_texto, ''))) = 0 THEN RAISE EXCEPTION 'la nota está vacía'; END IF;
  PERFORM 1 FROM public.tramites WHERE id = p_tramite AND notaria_id = v_notaria;
  IF NOT FOUND THEN RAISE EXCEPTION 'trámite no encontrado'; END IF;
  INSERT INTO public.tramite_eventos (notaria_id, tramite_id, tipo, detalle, autor_id)
  VALUES (v_notaria, p_tramite, 'nota', trim(p_texto), auth.uid())
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

-- Reemplaza la versión anterior (no se edita la migración vieja):
-- ahora también crea al solicitante como persona del trámite, con avisos.
CREATE OR REPLACE FUNCTION public.convertir_solicitud(p_solicitud uuid) RETURNS uuid
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

  INSERT INTO public.tramite_partes (notaria_id, tramite_id, nombre, telefono, rol,
                                     autoriza_datos, recibe_avisos, creado_por)
  VALUES (s.notaria_id, v_tramite, s.nombre, public.normalizar_telefono(s.telefono), 'solicitante',
          true, true, auth.uid());
  INSERT INTO public.tramite_eventos (notaria_id, tramite_id, tipo, detalle, autor_id)
  VALUES (s.notaria_id, v_tramite, 'nota',
          'Creado desde la solicitud ' || s.codigo_seguimiento || ' recibida por WhatsApp', auth.uid());

  UPDATE public.solicitudes SET estado = 'convertida', tramite_id = v_tramite WHERE id = s.id;
  RETURN v_tramite;
END $$;

-- ---------- Consulta del ciudadano (solo la llama el servidor del bot) ----------
-- El celular viene del webhook de Meta, cuya firma ya se validó: es la
-- identidad del ciudadano. Solo devuelve trámites donde ese celular es una
-- persona del trámite que autorizó sus datos. Nunca revela otros trámites.
CREATE FUNCTION public.tramites_del_telefono(p_notaria uuid, p_telefono text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT coalesce(jsonb_agg(x.datos ORDER BY x.creado_en DESC), '[]'::jsonb)
  FROM (
    SELECT t.creado_en,
      jsonb_build_object(
        'radicado',    t.radicado,
        'tramite',     t.tipo_tramite,
        'estado',      t.estado,
        'radicado_el', t.fecha_operativa,
        'ultima_novedad', (
          SELECT jsonb_build_object('fecha', (e.creado_en AT TIME ZONE 'America/Bogota')::date,
                                    'estado', e.estado_nuevo, 'detalle', e.detalle)
            FROM public.tramite_eventos e
           WHERE e.tramite_id = t.id AND e.visible_ciudadano
           ORDER BY e.creado_en DESC LIMIT 1),
        'saldo_pendiente', greatest(
            coalesce((SELECT sum(li.valor) FROM public.liquidacion_items li WHERE li.tramite_id = t.id), 0)
          - coalesce((SELECT sum(pg.monto) FROM public.pagos pg WHERE pg.tramite_id = t.id), 0), 0)
      ) AS datos
    FROM public.tramites t
    WHERE t.notaria_id = p_notaria
      AND EXISTS (SELECT 1 FROM public.tramite_partes p
                   WHERE p.tramite_id = t.id AND p.autoriza_datos
                     AND p.telefono = public.normalizar_telefono(p_telefono))
    ORDER BY t.creado_en DESC
    LIMIT 5
  ) x
$$;

-- ---------- Permisos ----------
ALTER TABLE public.tramite_partes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tramite_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.tramite_partes, public.tramite_eventos, public.notificaciones FROM anon, authenticated;
GRANT SELECT ON public.tramite_partes, public.tramite_eventos, public.notificaciones TO authenticated;

CREATE POLICY lectura_partes ON public.tramite_partes FOR SELECT TO authenticated
  USING (notaria_id = (SELECT public.mi_notaria()));
CREATE POLICY lectura_eventos ON public.tramite_eventos FOR SELECT TO authenticated
  USING (notaria_id = (SELECT public.mi_notaria()));
CREATE POLICY lectura_notificaciones ON public.notificaciones FOR SELECT TO authenticated
  USING (notaria_id = (SELECT public.mi_notaria()));

REVOKE EXECUTE ON FUNCTION
  public.normalizar_telefono(text), public.fn_evento_radicado(),
  public.agregar_parte(uuid, text, text, text, text, text, boolean, boolean),
  public.cambiar_estado(uuid, text, text), public.agregar_nota(uuid, text),
  public.tramites_del_telefono(uuid, text)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION
  public.agregar_parte(uuid, text, text, text, text, text, boolean, boolean),
  public.cambiar_estado(uuid, text, text), public.agregar_nota(uuid, text)
TO authenticated;
-- tramites_del_telefono: solo el servidor del bot (service_role).
