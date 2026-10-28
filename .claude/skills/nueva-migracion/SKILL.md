---
name: nueva-migracion
description: Crear una migración de base de datos nueva para NotariApp con su prueba. Usar siempre que haya que cambiar tablas, funciones, políticas o permisos en Supabase.
---

# Nueva migración

1. Nunca edites un archivo existente en `supabase/migrations/`. Crea uno nuevo llamado
   `AAAAMMDDHHMMSS_descripcion_corta.sql` (fecha y hora actuales, minúsculas y guiones bajos).
2. Escribe el SQL respetando las reglas de `CLAUDE.md`:
   - tablas nuevas con `notaria_id`, RLS activado y políticas `FOR SELECT` explícitas;
   - tablas de dinero sin permisos de INSERT/UPDATE/DELETE para `authenticated`;
   - Supabase da permisos por defecto a `anon` y `authenticated` sobre tablas y funciones nuevas:
     revócalos explícitamente (`REVOKE ALL ON public.tabla FROM anon, authenticated;`) y concede solo lo necesario;
   - funciones `SECURITY DEFINER` con `SET search_path = ''` (usa la skill `/nueva-rpc`).
3. Agrega o amplía una prueba en `tests/db/` que demuestre:
   - lo que el cambio permite hacer, con el rol correcto;
   - lo que impide: otro rol, otra notaría, escritura directa.
4. Corre `npm run test:db`. No termines hasta que pase.
5. Si la migración ya debe ir a Supabase de desarrollo: `npx supabase db push` y luego
   regenera tipos con `npx supabase gen types typescript --linked > src/tipos/database.ts`.
6. Resume en lenguaje simple qué cambia para los usuarios de la notaría.
