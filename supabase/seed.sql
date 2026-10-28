-- Notaría demo para el bot MVP. Se puede correr varias veces.
--
-- DATO DE PRUEBA: todos los datos de contacto son de prueba. Se tomaron de una búsqueda web
-- (28/10/2026) que cita el sitio propio de la notaría (notariaunicasantanderdequilichao.com.co),
-- pero no se pudo abrir el sitio para confirmarlos y otros directorios dan direcciones y
-- teléfonos distintos. Antes del piloto, la notaría debe confirmarlos.

INSERT INTO public.notarias (codigo, nombre)
VALUES ('SQ001', 'Notaría Única del Círculo de Santander de Quilichao')
ON CONFLICT (codigo) DO UPDATE SET nombre = excluded.nombre;

INSERT INTO public.notaria_perfil (
  notaria_id, nombre_publico, ciudad, direccion, telefono, correo, horario, mapa_url, politica_datos_url
)
SELECT
  n.id,
  'Notaría Única de Santander de Quilichao',
  'Santander de Quilichao, Cauca',
  'Calle 2A # 7-110, barrio El Rosario',                         -- DATO DE PRUEBA
  '(602) 849 6262 · 317 370 5249',                               -- DATO DE PRUEBA (sin confirmar cuál es WhatsApp)
  'unicasantanderdequilichao@supernotariado.gov.co',             -- DATO DE PRUEBA
  'Lunes a jueves de 8:00 a. m. a 5:00 p. m., jornada continua. '
    || 'Viernes de 8:00 a. m. a 4:00 p. m., jornada continua.',  -- DATO DE PRUEBA
  'https://www.google.com/maps/search/?api=1&query=Calle+2A+7-110+Santander+de+Quilichao', -- DATO DE PRUEBA
  NULL  -- URL pública de /privacidad: se llena en B4, cuando exista el dominio de Vercel
FROM public.notarias n
WHERE n.codigo = 'SQ001'
ON CONFLICT (notaria_id) DO UPDATE SET
  nombre_publico     = excluded.nombre_publico,
  ciudad             = excluded.ciudad,
  direccion          = excluded.direccion,
  telefono           = excluded.telefono,
  correo             = excluded.correo,
  horario            = excluded.horario,
  mapa_url           = excluded.mapa_url,
  actualizado_en     = now();
