---
name: nueva-rpc
description: Crear una función RPC de PostgreSQL para NotariApp, la única vía para escribir datos de dinero o de estado. Usar al crear o cambiar cualquier operación que escriba en la base de datos.
---

# Nueva RPC

Toda RPC sigue esta plantilla (ver ejemplos reales en la migración del núcleo financiero):

```sql
CREATE FUNCTION public.nombre_en_espanol(p_param tipo) RETURNS tipo
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_notaria uuid := public.mi_notaria();
BEGIN
  -- 1. Quién llama: rol permitido
  IF public.mi_rol() NOT IN ('rol_permitido') THEN RAISE EXCEPTION 'mensaje claro en español'; END IF;
  -- 2. Sobre qué: el registro pertenece a v_notaria (si no, "no encontrado", sin revelar que existe)
  -- 3. Reglas del negocio: montos desde la liquidación, transiciones válidas, etc.
  -- 4. Escritura: solo INSERT en tablas de dinero; nunca UPDATE/DELETE de pagos
  RETURN ...;
END $$;

REVOKE EXECUTE ON FUNCTION public.nombre_en_espanol(tipo) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nombre_en_espanol(tipo) TO authenticated;
```

Reglas:
- Nombres de tablas siempre calificados: `public.pagos`, nunca `pagos`.
- Mensajes de error en español, que digan qué hacer ("abra su caja antes de cobrar").
- Los montos nunca vienen del usuario salvo abonos parciales, y se validan contra el saldo.
- La auditoría la escribe el trigger; la función no escribe en `audit_log`.
- Desde Next.js se llama con `supabase.rpc('nombre_en_espanol', {...})` usando la sesión del usuario, nunca con `service_role`.
- Va dentro de una migración nueva (skill `/nueva-migracion`) con su prueba en `tests/db/`.
