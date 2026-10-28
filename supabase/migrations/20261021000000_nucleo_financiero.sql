-- =====================================================================
-- NotariApp — Núcleo financiero corregido (v2)
-- Reemplaza las migraciones 001–003 del plan v1 para las tablas de dinero.
-- Principios: solo inserción en tablas financieras, escritura únicamente
-- por funciones (RPC), log con hash encadenado, días en hora de Bogotá.
-- =====================================================================

-- ---------- Tablas base (resumidas) ----------
CREATE TABLE public.notarias (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo  text NOT NULL UNIQUE,          -- ej. SQ001
  nombre  text NOT NULL
);

CREATE TABLE public.usuarios (
  id          uuid PRIMARY KEY,           -- = auth.users.id
  notaria_id  uuid NOT NULL REFERENCES public.notarias(id),
  nombre      text NOT NULL,
  rol         text NOT NULL CHECK (rol IN ('notario','cajero','empleado')),
  activo      boolean NOT NULL DEFAULT true
);

-- Helpers: identidad del que llama. search_path vacío = sin secuestro de nombres.
CREATE FUNCTION public.mi_notaria() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT notaria_id FROM public.usuarios WHERE id = auth.uid() AND activo
$$;

CREATE FUNCTION public.mi_rol() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT rol FROM public.usuarios WHERE id = auth.uid() AND activo
$$;

-- ---------- Consecutivos sin carreras ----------
CREATE TABLE public.consecutivos (
  notaria_id uuid NOT NULL REFERENCES public.notarias(id),
  anio       int  NOT NULL,
  ultimo     int  NOT NULL,
  PRIMARY KEY (notaria_id, anio)
);

CREATE FUNCTION public.siguiente_radicado(p_notaria uuid) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_anio int := extract(year FROM now() AT TIME ZONE 'America/Bogota');
  v_n int;
  v_codigo text;
BEGIN
  -- La fila queda bloqueada hasta el fin de la transacción: dos llamadas
  -- simultáneas nunca obtienen el mismo número.
  INSERT INTO public.consecutivos AS c (notaria_id, anio, ultimo)
  VALUES (p_notaria, v_anio, 1)
  ON CONFLICT (notaria_id, anio) DO UPDATE SET ultimo = c.ultimo + 1
  RETURNING ultimo INTO v_n;
  SELECT codigo INTO v_codigo FROM public.notarias WHERE id = p_notaria;
  RETURN v_codigo || '-' || v_anio || '-' || lpad(v_n::text, 6, '0');
END $$;

-- ---------- Trámites y liquidación ----------
CREATE TABLE public.tramites (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notaria_id       uuid NOT NULL REFERENCES public.notarias(id),
  radicado         text NOT NULL UNIQUE,
  -- Código que recibe el ciudadano para consultar: aleatorio, no adivinable.
  codigo_consulta  text NOT NULL UNIQUE
                   DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  tipo_tramite     text NOT NULL,
  empleado_id      uuid NOT NULL REFERENCES public.usuarios(id),
  estado           text NOT NULL DEFAULT 'radicado'
                   CHECK (estado IN ('radicado','en_proceso','pendiente_doc','listo','entregado','anulado')),
  fecha_operativa  date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Bogota')::date,
  creado_en        timestamptz NOT NULL DEFAULT now()
);

-- La liquidación la calcula el sistema desde el tarifario (función de S2);
-- el empleado nunca digita valores aquí.
CREATE TABLE public.liquidacion_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notaria_id  uuid NOT NULL REFERENCES public.notarias(id),
  tramite_id  uuid NOT NULL REFERENCES public.tramites(id),
  concepto    text NOT NULL,
  tipo        text NOT NULL CHECK (tipo IN ('derechos','iva','aporte','recaudo_tercero','otro')),
  valor       bigint NOT NULL CHECK (valor >= 0),      -- pesos, sin decimales
  creado_en   timestamptz NOT NULL DEFAULT now()
);

-- ---------- Caja: sesiones por cajero con arqueo ciego ----------
CREATE TABLE public.sesiones_caja (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notaria_id         uuid NOT NULL REFERENCES public.notarias(id),
  cajero_id          uuid NOT NULL REFERENCES public.usuarios(id),
  base_inicial       bigint NOT NULL DEFAULT 0 CHECK (base_inicial >= 0),
  abierta_en         timestamptz NOT NULL DEFAULT now(),
  cerrada_en         timestamptz,
  efectivo_contado   bigint,
  efectivo_esperado  bigint,
  diferencia         bigint GENERATED ALWAYS AS (efectivo_contado - efectivo_esperado) STORED,
  aprobada_por       uuid REFERENCES public.usuarios(id),
  aprobada_en        timestamptz,
  fecha_operativa    date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Bogota')::date
);
-- Un cajero no puede tener dos sesiones abiertas.
CREATE UNIQUE INDEX una_sesion_abierta ON public.sesiones_caja (cajero_id) WHERE cerrada_en IS NULL;

-- ---------- Pagos: solo inserción, correcciones por reverso ----------
CREATE TABLE public.pagos (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notaria_id       uuid NOT NULL REFERENCES public.notarias(id),
  tramite_id       uuid NOT NULL REFERENCES public.tramites(id),
  sesion_caja_id   uuid NOT NULL REFERENCES public.sesiones_caja(id),
  registrado_por   uuid NOT NULL REFERENCES public.usuarios(id),
  tipo             text NOT NULL CHECK (tipo IN ('pago','reverso')),
  monto            bigint NOT NULL,
  metodo           text NOT NULL CHECK (metodo IN ('efectivo','transferencia','tarjeta')),
  factura_sin      text,                                   -- número de factura del SIN
  reversa_de       uuid UNIQUE REFERENCES public.pagos(id), -- un pago se reversa una sola vez
  motivo           text,
  autorizado_por   uuid REFERENCES public.usuarios(id),
  fecha_operativa  date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Bogota')::date,
  creado_en        timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (tipo = 'pago'    AND monto > 0 AND reversa_de IS NULL AND factura_sin IS NOT NULL)
 OR (tipo = 'reverso' AND monto < 0 AND reversa_de IS NOT NULL
                      AND motivo IS NOT NULL AND autorizado_por IS NOT NULL)
  )
);

-- ---------- Audit log con hash encadenado ----------
CREATE TABLE public.audit_log (
  seq            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  notaria_id     uuid NOT NULL,
  usuario_id     uuid,
  tabla          text NOT NULL,
  accion         text NOT NULL,
  registro_id    uuid NOT NULL,
  antes          jsonb,
  despues        jsonb,
  creado_en      timestamptz NOT NULL,
  hash_anterior  text,
  hash           text NOT NULL
);

-- Fórmula del hash en un solo lugar: la usan el trigger y la verificación.
CREATE FUNCTION public.calcular_hash(
  p_prev text, p_tabla text, p_accion text, p_registro uuid, p_usuario uuid,
  p_antes jsonb, p_despues jsonb, p_creado timestamptz
) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT encode(sha256(convert_to(
    coalesce(p_prev, '') || '|' || p_tabla || '|' || p_accion || '|' || p_registro::text || '|' ||
    coalesce(p_usuario::text, '') || '|' || coalesce(p_antes::text, '') || '|' ||
    coalesce(p_despues::text, '') || '|' ||
    to_char(p_creado AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US'),
  'UTF8')), 'hex')
$$;

CREATE FUNCTION public.fn_audit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_antes   jsonb := CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END;
  v_despues jsonb := CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END;
  v_fila    jsonb := coalesce(v_despues, v_antes);
  v_notaria uuid  := (v_fila->>'notaria_id')::uuid;
  v_ahora   timestamptz := clock_timestamp();
  v_prev    text;
BEGIN
  -- Serializa la cadena de cada notaría para que no se bifurque.
  PERFORM pg_advisory_xact_lock(hashtext(v_notaria::text));
  SELECT hash INTO v_prev FROM public.audit_log
   WHERE notaria_id = v_notaria ORDER BY seq DESC LIMIT 1;
  INSERT INTO public.audit_log
    (notaria_id, usuario_id, tabla, accion, registro_id, antes, despues, creado_en, hash_anterior, hash)
  VALUES
    (v_notaria, auth.uid(), TG_TABLE_NAME, TG_OP, (v_fila->>'id')::uuid, v_antes, v_despues, v_ahora, v_prev,
     public.calcular_hash(v_prev, TG_TABLE_NAME, TG_OP, (v_fila->>'id')::uuid, auth.uid(), v_antes, v_despues, v_ahora));
  RETURN NULL;
END $$;

CREATE TRIGGER audit_tramites AFTER INSERT OR UPDATE OR DELETE ON public.tramites
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit();
CREATE TRIGGER audit_liquidacion AFTER INSERT OR UPDATE OR DELETE ON public.liquidacion_items
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit();
CREATE TRIGGER audit_pagos AFTER INSERT OR UPDATE OR DELETE ON public.pagos
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit();
CREATE TRIGGER audit_sesiones AFTER INSERT OR UPDATE OR DELETE ON public.sesiones_caja
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit();

-- Devuelve el primer eslabón roto de la cadena de una notaría (NULL = íntegra).
CREATE FUNCTION public.verificar_cadena(p_notaria uuid) RETURNS bigint
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE r record; v_prev text;
BEGIN
  FOR r IN SELECT * FROM public.audit_log WHERE notaria_id = p_notaria ORDER BY seq LOOP
    IF r.hash_anterior IS DISTINCT FROM v_prev
       OR r.hash <> public.calcular_hash(v_prev, r.tabla, r.accion, r.registro_id, r.usuario_id,
                                         r.antes, r.despues, r.creado_en) THEN
      RETURN r.seq;
    END IF;
    v_prev := r.hash;
  END LOOP;
  RETURN NULL;
END $$;

-- Sello del día: hash del último eslabón de esa fecha (se envía al correo del notario).
CREATE FUNCTION public.sello_del_dia(p_notaria uuid, p_fecha date) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT hash FROM public.audit_log
   WHERE notaria_id = p_notaria
     AND (creado_en AT TIME ZONE 'America/Bogota')::date <= p_fecha
   ORDER BY seq DESC LIMIT 1
$$;

-- ---------- RPC: la única puerta de escritura ----------
CREATE FUNCTION public.radicar_tramite(p_tipo text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_notaria uuid := public.mi_notaria(); v_id uuid;
BEGIN
  IF v_notaria IS NULL THEN RAISE EXCEPTION 'usuario no autorizado'; END IF;
  INSERT INTO public.tramites (notaria_id, radicado, tipo_tramite, empleado_id)
  VALUES (v_notaria, public.siguiente_radicado(v_notaria), p_tipo, auth.uid())
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE FUNCTION public.abrir_caja(p_base bigint DEFAULT 0) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_id uuid;
BEGIN
  IF public.mi_rol() NOT IN ('cajero','notario') THEN RAISE EXCEPTION 'solo cajeros abren caja'; END IF;
  INSERT INTO public.sesiones_caja (notaria_id, cajero_id, base_inicial)
  VALUES (public.mi_notaria(), auth.uid(), p_base) RETURNING id INTO v_id;
  RETURN v_id;
END $$;

-- El monto sale del saldo de la liquidación; p_monto solo sirve para abonos parciales.
CREATE FUNCTION public.registrar_pago(
  p_tramite uuid, p_metodo text, p_factura_sin text, p_monto bigint DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_notaria uuid := public.mi_notaria();
  v_sesion uuid; v_saldo bigint; v_monto bigint; v_id uuid;
BEGIN
  SELECT id INTO v_sesion FROM public.sesiones_caja
   WHERE cajero_id = auth.uid() AND cerrada_en IS NULL;
  IF v_sesion IS NULL THEN RAISE EXCEPTION 'abra su caja antes de cobrar'; END IF;

  PERFORM 1 FROM public.tramites
   WHERE id = p_tramite AND notaria_id = v_notaria AND estado <> 'anulado' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'trámite no encontrado'; END IF;

  SELECT coalesce((SELECT sum(valor) FROM public.liquidacion_items WHERE tramite_id = p_tramite), 0)
       - coalesce((SELECT sum(monto) FROM public.pagos WHERE tramite_id = p_tramite), 0)
    INTO v_saldo;
  IF v_saldo <= 0 THEN RAISE EXCEPTION 'el trámite no tiene saldo por cobrar'; END IF;

  v_monto := coalesce(p_monto, v_saldo);
  IF v_monto <= 0 OR v_monto > v_saldo THEN
    RAISE EXCEPTION 'monto inválido: el saldo es %', v_saldo;
  END IF;

  INSERT INTO public.pagos (notaria_id, tramite_id, sesion_caja_id, registrado_por, tipo, monto, metodo, factura_sin)
  VALUES (v_notaria, p_tramite, v_sesion, auth.uid(), 'pago', v_monto, p_metodo, p_factura_sin)
  RETURNING id INTO v_id;
  -- Aquí la app dispara el comprobante al ciudadano (WhatsApp/SMS/correo).
  RETURN v_id;
END $$;

-- Solo el notario autoriza un reverso; el original queda intacto.
CREATE FUNCTION public.reversar_pago(p_pago uuid, p_motivo text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE o public.pagos%ROWTYPE; v_sesion uuid; v_id uuid;
BEGIN
  IF public.mi_rol() <> 'notario' THEN RAISE EXCEPTION 'solo el notario autoriza reversos'; END IF;
  SELECT * INTO o FROM public.pagos
   WHERE id = p_pago AND notaria_id = public.mi_notaria() AND tipo = 'pago';
  IF NOT FOUND THEN RAISE EXCEPTION 'pago no encontrado'; END IF;
  -- El reverso se asienta en la sesión abierta del cajero original, o en la del pago si ya cerró.
  SELECT id INTO v_sesion FROM public.sesiones_caja
   WHERE cajero_id = o.registrado_por AND cerrada_en IS NULL;
  INSERT INTO public.pagos (notaria_id, tramite_id, sesion_caja_id, registrado_por, tipo, monto,
                            metodo, reversa_de, motivo, autorizado_por)
  VALUES (o.notaria_id, o.tramite_id, coalesce(v_sesion, o.sesion_caja_id), auth.uid(), 'reverso',
          -o.monto, o.metodo, o.id, p_motivo, auth.uid())
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

-- Arqueo ciego: el cajero declara lo contado; el esperado se calcula después.
CREATE FUNCTION public.cerrar_caja(p_contado bigint) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_sesion public.sesiones_caja%ROWTYPE;
BEGIN
  SELECT * INTO v_sesion FROM public.sesiones_caja
   WHERE cajero_id = auth.uid() AND cerrada_en IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'no tiene una caja abierta'; END IF;
  UPDATE public.sesiones_caja SET
    cerrada_en = now(),
    efectivo_contado = p_contado,
    efectivo_esperado = v_sesion.base_inicial + coalesce((
      SELECT sum(monto) FROM public.pagos
       WHERE sesion_caja_id = v_sesion.id AND metodo = 'efectivo'), 0)
  WHERE id = v_sesion.id;
END $$;

CREATE FUNCTION public.aprobar_sesion(p_sesion uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF public.mi_rol() <> 'notario' THEN RAISE EXCEPTION 'solo el notario aprueba'; END IF;
  UPDATE public.sesiones_caja SET aprobada_por = auth.uid(), aprobada_en = now()
   WHERE id = p_sesion AND notaria_id = public.mi_notaria()
     AND cerrada_en IS NOT NULL AND aprobada_por IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'sesión no encontrada, abierta o ya aprobada'; END IF;
END $$;

-- ---------- Permisos: lectura por RLS, escritura solo por RPC ----------
ALTER TABLE public.notarias          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consecutivos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tramites          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidacion_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones_caja     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log         ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
GRANT SELECT ON public.tramites, public.liquidacion_items, public.pagos,
                public.sesiones_caja, public.audit_log, public.usuarios TO authenticated;

CREATE POLICY lectura_tramites ON public.tramites FOR SELECT TO authenticated
  USING (notaria_id = (SELECT public.mi_notaria()));
CREATE POLICY lectura_liquidacion ON public.liquidacion_items FOR SELECT TO authenticated
  USING (notaria_id = (SELECT public.mi_notaria()));
CREATE POLICY lectura_pagos ON public.pagos FOR SELECT TO authenticated
  USING (notaria_id = (SELECT public.mi_notaria()));
CREATE POLICY lectura_usuarios ON public.usuarios FOR SELECT TO authenticated
  USING (notaria_id = (SELECT public.mi_notaria()));
-- El cajero ve solo sus sesiones; el notario, todas las de su notaría.
CREATE POLICY lectura_sesiones ON public.sesiones_caja FOR SELECT TO authenticated
  USING (notaria_id = (SELECT public.mi_notaria())
         AND (cajero_id = auth.uid() OR (SELECT public.mi_rol()) = 'notario'));
CREATE POLICY lectura_auditoria ON public.audit_log FOR SELECT TO authenticated
  USING (notaria_id = (SELECT public.mi_notaria()) AND (SELECT public.mi_rol()) = 'notario');

-- Ninguna función es invocable por defecto; se habilitan solo las RPC.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION
  public.mi_notaria(), public.mi_rol(),
  public.radicar_tramite(text), public.abrir_caja(bigint),
  public.registrar_pago(uuid, text, text, bigint), public.reversar_pago(uuid, text),
  public.cerrar_caja(bigint), public.aprobar_sesion(uuid)
TO authenticated;
-- verificar_cadena y sello_del_dia los ejecuta solo un proceso programado del servidor.
