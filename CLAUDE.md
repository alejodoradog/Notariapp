# NotariApp

SaaS multi-notaría para Colombia. Primer cliente: la notaría de Santander de Quilichao (el notario es "Cano").

## Fase actual: bot MVP
Construimos **solo el chatbot de WhatsApp**: responde requisitos, costos y horarios con datos verificables, recibe solicitudes y avisa a la notaría por correo. La plataforma de gestión interna **está diseñada pero no se construye todavía**: llega cuando Cano la apruebe.

Todo lo que hagas debe dejar lista la llegada de la plataforma sin rehacer nada:
- La base de datos ya está completa y probada (3 migraciones). Se aplica entera aunque el bot use solo una parte.
- Todo se guarda desde el primer mensaje: conversaciones, mensajes y solicitudes, con su notaría.
- Las funciones que dependen de la plataforma quedan detrás de `PLATAFORMA_ACTIVA=false` (ver `docs/chatbot.md`).
- No construyas pantallas del panel, login de personal ni tablero. Si una tarea parece necesitarlos, avísame.

Lee antes de trabajar:
- `docs/hoja-de-ruta.md` — qué toca ahora y en qué orden.
- `docs/chatbot.md` — diseño del bot, herramientas, correos, costos de referencia y evaluación.
- `docs/contexto-negocio.md` — el negocio notarial.
- `docs/diseno.md` y `docs/fase-plataforma.md` — solo como referencia de lo que viene; no se construyen en esta fase.

## Stack
- Next.js 16 (App Router) + TypeScript estricto, desplegado en Vercel
- Supabase (PostgreSQL)
- Claude API con el SDK oficial de TypeScript (`@anthropic-ai/sdk`); modelo en `ANTHROPIC_MODEL`
- API de WhatsApp Cloud de Meta
- Resend para los correos a la notaría
- Zod para validar toda entrada
- Pruebas: `tests/db/` (PostgreSQL embebido con PGlite, sin Docker) y Vitest

## Comandos
- `npm run dev` — servidor local
- `npm run test:db` — pruebas de base de datos (`node tests/db/correr-todas.mjs`)
- `npm run test` — pruebas unitarias (Vitest)
- `npm run eval:bot` — evaluación del bot con los casos de `docs/chatbot.md`
- `npm run validar:catalogo` — revisa que cada trámite de `datos/tramites.json` esté completo y con fuentes
- `npm run typecheck` y `npm run lint`
(Si un comando no existe todavía, créalo en `package.json` y avísame.)

## Estructura
- `src/dominios/chatbot/` — conocimiento (búsqueda, costos), cerebro (Claude y herramientas), correos.
- `src/servidor/` — lo que solo corre en el servidor: cliente admin de Supabase, envío por WhatsApp, envío de correos.
- `src/app/api/` — webhook de WhatsApp y tareas programadas. `src/app/privacidad/` — política de datos.
- `datos/` — catálogo de trámites y prompt del bot. `scripts/` — carga del catálogo y utilidades.

## Reglas que nunca se rompen
- **Datos del bot:** requisitos, costos y horarios salen de herramientas que leen la base de datos. Nunca se escriben en el prompt ni en el código.
- **Nunca inventes** tarifas, requisitos ni reglas notariales. Cada dato de `datos/tramites.json` lleva su fuente; si no hay fuente, no entra. Los datos de prueba se marcan como `DATO DE PRUEBA`.
- **Webhook de WhatsApp:** validar la firma `X-Hub-Signature-256` antes de cualquier cosa; responder 200 de inmediato y procesar después con `after()`; deduplicar por `wa_message_id`.
- **Clave `service_role`:** solo en `src/servidor/admin.ts`, y solo la usan el webhook (después de validar la firma), las tareas programadas y los scripts.
- **Datos personales (Ley 1581 de 2012):** sin `autoriza_datos = true` no se guarda una solicitud. Nunca pedir cédula completa ni fotos de documentos por el chat. Los correos a la notaría solo llevan lo necesario para contactar al ciudadano.
- Nunca editar una migración existente en `supabase/migrations/`. Se crea una nueva con `/nueva-migracion`.
- Toda función `SECURITY DEFINER` lleva `SET search_path = ''`, nombres calificados y valida rol y notaría. Usa `/nueva-rpc`.
- "Hoy" siempre en `America/Bogota` (columna `fecha_operativa`). Montos en pesos como enteros; en texto: `$ 309.500`.
- Secretos solo en variables de entorno. Nunca en el código ni en mensajes de commit.
- Todo cambio en la base de datos llega con su prueba en `tests/db/`. Todo cambio al prompt, a las herramientas o al catálogo pasa `npm run eval:bot`.
- Terminado = pruebas en verde + `typecheck` limpio + probado a mano desde un celular.

## Forma de trabajar
1. Una tarea por sesión y por rama de git. Nunca trabajar directo en `main`.
2. Antes de escribir código, presenta un plan corto y espera aprobación.
3. Para cálculos de costo, permisos y datos personales: primero la prueba que falla, luego el código.
4. No agregues dependencias sin explicar por qué en una línea.
5. Al terminar: corre las pruebas, resume qué cambió en lenguaje simple y sugiere el mensaje de commit.
