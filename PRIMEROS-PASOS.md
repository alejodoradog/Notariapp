# Primeros pasos: bot MVP

**Qué vas a construir ahora:** el chatbot de WhatsApp de la notaría. Responde requisitos, costos y horarios con datos verificados, recibe solicitudes de trámites y avisa a la notaría por correo. Estimado: 3 a 5 semanas.

**Qué NO vas a construir todavía:** la plataforma de gestión interna. Está diseñada (`docs/diseno.md`), su base de datos ya está hecha y probada, y su plan está en `docs/fase-plataforma.md`. Se construye cuando Cano la apruebe. Para la reunión tienes el prototipo navegable: https://claude.ai/artifact/K81iX84y6yc3sF4jcAXAHS

**Qué ya está hecho en esta carpeta:**

| Archivo | Para qué sirve |
| --- | --- |
| `CLAUDE.md` | Reglas que Claude Code lee solo al abrir el proyecto |
| `docs/hoja-de-ruta.md` | Las 7 sesiones del bot y las fases siguientes |
| `docs/chatbot.md` | Diseño del bot: herramientas, correos, costos de referencia y evaluación |
| `docs/guion-demo.md` | Cómo llevar la reunión con Cano, minuto a minuto |
| `docs/contexto-negocio.md` | El negocio notarial y el circuito del dinero |
| `docs/diseno.md`, `docs/fase-plataforma.md` | El diseño y el plan de la plataforma, para después |
| `datos/tramites.json` | 12 trámites con requisitos y tarifas 2026, cada uno con su fuente |
| `datos/prompt-sistema.md` | Las instrucciones del bot |
| `supabase/migrations/` | Toda la base de datos, ya probada |
| `tests/db/` | 82 pruebas de seguridad que corren con un solo comando |
| `.claude/` | Barrera contra edición de migraciones y dos recetas (`/nueva-migracion`, `/nueva-rpc`) |

---

## Paso 1. Prepara tu computador (una vez, unos 30 minutos)
- [ ] **Node.js LTS** — nodejs.org
- [ ] **Git para Windows** — git-scm.com (Claude Code lo necesita en Windows)
- [ ] **Visual Studio Code** — para ver lo que Claude Code va creando
- [ ] **Claude Code** — guía oficial en docs.claude.com (sección Claude Code)

## Paso 2. Crea las cuentas
| Cuenta | Para qué | Desde |
| --- | --- | --- |
| GitHub | Guardar el código (repositorio privado `notariapp`) | B1 |
| Supabase | Base de datos (proyecto `notariapp-dev`, región São Paulo, solo desarrollo) | B1 |
| Vercel | Publicar el bot en internet | B4 |
| Meta for Developers | WhatsApp con número de prueba gratis | B4 |
| Anthropic Console | Clave de API del bot, **con límite de gasto**. Es distinta de tu suscripción a Claude | B5 |
| Resend | Correos a la notaría. Para la demo basta con enviarlos a tu propio correo | B6 |

Los planes gratuitos sirven para la demo. Antes del piloto con ciudadanos reales hay que pasar a planes pagos (Vercel no permite uso comercial en su plan gratuito).

## Paso 3. Reúne los datos públicos de la notaría
De Google Maps o de su página web: nombre exacto, dirección, teléfono, WhatsApp si tiene, y horario de atención. Lo que falte se marca como `DATO DE PRUEBA`.

## Paso 4. Pon el kit en su carpeta
Descomprime en una ruta simple, por ejemplo `C:\Proyectos\notariapp`. Evita el Escritorio y Documentos si están sincronizados con OneDrive.

## Paso 5. Primera sesión: orientación (sin código)
Abre la carpeta en VS Code, abre la terminal (menú Terminal → Nueva terminal), escribe `claude` y pega:
```
Lee CLAUDE.md, PRIMEROS-PASOS.md y todo lo que hay en docs/ y datos/.
No escribas código todavía.

1. Explícame en pocas líneas qué vamos a construir en esta fase y qué queda para después.
2. Revisa si tengo instalados Node.js (LTS reciente) y Git, y dime qué me falta.
3. Dime qué cuentas y claves necesitaré y en qué sesión.
4. Si algo de los documentos te parece contradictorio o poco claro, dímelo.
```
Si te responde que ahora va solo el bot y que la plataforma queda para después de Cano, el contexto quedó bien cargado. Cierra la sesión y abre una nueva para B1.

---

## Tu rutina en cada sesión
1. Sesión nueva de Claude Code, una tarea a la vez.
2. Pega el prompt de la tarea (están abajo).
3. Lee el plan antes de aprobarlo. Recházalo si:
   - construye pantallas del panel, login de personal o tablero (eso es de la fase siguiente);
   - cambia la base de datos sin crear una migración nueva;
   - usa `service_role` fuera de `src/servidor/admin.ts`;
   - pone requisitos o precios dentro del código o del prompt.
4. Si no entiendes algo: "explícame este paso como si no fuera programador".
5. Al terminar, **pruébalo tú**, idealmente desde tu celular. Si no lo viste funcionar, no está terminado.
6. "Haz commit, sube la rama y abre el pull request"; cuando esté bien, "haz merge".
7. Marca la tarea en `docs/hoja-de-ruta.md`.

---

## Los prompts de cada sesión

### B1 — Proyecto base y base de datos
```
Lee CLAUDE.md y docs/hoja-de-ruta.md. Vamos con B1.

Esta carpeta ya tiene archivos. Crea el proyecto Next.js 16 (TypeScript, App Router, carpeta src)
en una carpeta temporal y mueve su contenido aquí sin sobrescribir CLAUDE.md, PRIMEROS-PASOS.md,
docs/, datos/, supabase/, tests/ ni .claude/.

1. Inicializa git, haz un primer commit con el kit original y crea la rama b1-base.
2. Instala @supabase/supabase-js y zod; @electric-sql/pglite y vitest como dependencias de desarrollo.
3. Scripts: "test:db": "node tests/db/correr-todas.mjs", "test": "vitest run", "typecheck": "tsc --noEmit".
   Corre npm run test:db: deben pasar los 3 archivos de prueba.
4. Ya puse en .env.local la URL, la anon key y la service_role key de mi proyecto notariapp-dev.
   Guíame para enlazar la CLI (npx supabase login y link) y aplica las 3 migraciones con npx supabase db push.
5. Genera los tipos en src/tipos/database.ts y crea src/servidor/admin.ts (cliente con service_role, solo servidor).
6. Crea scripts/cargar-catalogo.mjs, que carga datos/tramites.json en catalogo_tramites como catálogo base,
   y supabase/seed.sql con la notaría demo (código SQ001) y su perfil con los datos de abajo
   (lo que falte, como DATO DE PRUEBA).
7. Página pública /privacidad con un borrador de política de tratamiento de datos para el bot, marcado
   visiblemente "BORRADOR: debe revisarlo un abogado antes de atender ciudadanos reales".
8. Deja .env.example con todas las variables del proyecto (Supabase, Anthropic, Meta, Resend,
   CORREO_NOTARIA, PLATAFORMA_ACTIVA=false).

Datos públicos de la notaría: [pega aquí nombre, dirección, teléfono, WhatsApp y horario]

Primero muéstrame el plan.
```
**Listo cuando:** `npm run test:db` está en verde y en Supabase ves los 12 trámites y el perfil de la notaría.

### B2 — Base de conocimiento
Antes de la sesión, descarga de supernotariado.gov.co la resolución de tarifas notariales 2026 (Resolución 2026-000964-6) y guárdala en `datos/fuentes/`. Si no la encuentras, pídele a Claude Code que te ayude a buscarla.
```
Vamos con B2. Crea la rama b2-conocimiento. Lee docs/chatbot.md y datos/tramites.json.

1. Coteja cada valor de tarifas en datos/tramites.json contra la resolución oficial que dejé en
   datos/fuentes/. Muéstrame una tabla con: valor actual, valor en la resolución, artículo, y si coinciden.
   No cambies nada hasta que yo apruebe la tabla.
2. Propón hasta 8 trámites notariales frecuentes que falten (por ejemplo unión marital de hecho,
   reconocimiento de hijo, testamento, patrimonio de familia, hipoteca, liquidación de sociedad conyugal).
   Para cada uno busca requisitos en fuentes oficiales o confiables y muéstramelos con sus enlaces antes
   de agregarlos. Nada sin fuente; todo con validado_por_notaria: false.
3. Crea npm run validar:catalogo: revisa que cada trámite tenga nombre, sinónimos, requisitos, tarifa
   con tipo válido y al menos una fuente, y que no haya códigos repetidos.
4. Recarga el catálogo en Supabase con scripts/cargar-catalogo.mjs.

Primero muéstrame el plan.
```
**Listo cuando:** apruebas la tabla de cotejo, el catálogo tiene los trámites nuevos con sus fuentes y `npm run validar:catalogo` pasa.

### B3 — Conocimiento del bot
```
Vamos con B3. Crea la rama b3-funciones. Lee docs/chatbot.md.

En src/dominios/chatbot/conocimiento/ crea:
1. buscarTramite(consulta): hasta 3 trámites por nombre o sinónimo, tolerante a tildes, mayúsculas
   y errores comunes ("q necesito pa casarme" → matrimonio_civil).
2. obtenerTramite(codigo): la versión de la notaría si existe; si no, la del catálogo base.
3. calcularCosto(codigo, cuantia?): aplica tarifas.reglas de datos/tramites.json.
   Si el trámite es por cuantía y no hay cuantía, devuelve { faltaCuantia: true }.

Primero las pruebas con Vitest: TODOS los casos de la tabla "Cálculo de costos" de docs/chatbot.md
deben dar exactamente esos valores (si en B2 cambió alguna tarifa, actualiza la tabla primero y
muéstramelo), y al menos 15 frases reales de ciudadanos para la búsqueda. Luego el código.

Primero muéstrame el plan.
```
**Listo cuando:** `npm run test` pasa, incluido "compraventa de $ 150.000.000 → $ 571.319".

### B4 — Conexión con WhatsApp
```
Vamos con B4. Crea la rama b4-webhook. Lee la sección "Flujo de un mensaje" de docs/chatbot.md.

1. Guíame paso a paso para crear la app en Meta for Developers con el producto WhatsApp, obtener el
   número de prueba, registrar mi celular como destinatario y conseguir los valores para .env.local
   (token, phone number id, app secret, verify token). Explícame cómo obtener un token que no venza.
2. Crea src/app/api/whatsapp/route.ts:
   - GET: verificación del webhook.
   - POST: valida X-Hub-Signature-256, responde 200 de inmediato y con after() guarda la conversación
     y el mensaje (deduplicando por wa_message_id) y responde un eco: "Recibí: <texto>".
3. Crea src/servidor/whatsapp.ts con la función para enviar mensajes.
4. Pruebas de la validación de firma y de la deduplicación.
5. Despliega en Vercel con las variables de entorno y guíame para registrar la URL del webhook en Meta.

Termina cuando yo le escriba al número de prueba desde mi WhatsApp y reciba el eco.
Primero muéstrame el plan.
```
**Listo cuando:** escribes "hola" desde tu celular y te llega "Recibí: hola".

### B5 — Cerebro del bot
```
Vamos con B5. Crea la rama b5-cerebro. Lee docs/chatbot.md completo y datos/prompt-sistema.md.

1. Reemplaza el eco por el cerebro: Claude (modelo de ANTHROPIC_MODEL) con el prompt de sistema
   (rellenando los datos de notaria_perfil) y las herramientas de docs/chatbot.md según
   PLATAFORMA_ACTIVA=false: mis_tramites NO se ofrece al modelo, y pasar_a_humano devuelve los datos
   de contacto de la notaría (el correo de alerta se conecta en B6; por ahora déjalo registrado en el log).
   Máximo 5 vueltas de herramientas.
2. Guarda cada respuesta con su intención y las herramientas usadas.
3. Audios, imágenes y documentos: respuesta amable de que por ahora solo lee texto.
4. Crea npm run eval:bot con TODOS los casos del bot MVP de la tabla "Evaluación del bot". Cada caso
   verifica qué herramientas se usaron y que la respuesta contenga (o no) lo esperado. Debe pasar completo.

Primero muéstrame el plan.
```
**Listo cuando:** `npm run eval:bot` pasa completo y, desde tu celular, el bot te responde bien "qué necesito para casarme".

### B6 — Correos a la notaría
```
Vamos con B6. Crea la rama b6-correos. Lee la sección "Correos a la notaría" de docs/chatbot.md.

1. Guíame para crear la cuenta de Resend y obtener la clave. Para la demo, los correos van a mi propio
   correo (CORREO_NOTARIA).
2. Crea src/servidor/correo.ts y las tres plantillas de correo de docs/chatbot.md, en español claro,
   con el diseño más simple posible (texto, el nombre de la notaría y un botón para escribir por WhatsApp).
3. Conecta: registrar_solicitud → correo de solicitud nueva; pasar_a_humano → correo de alerta.
   Ambos con after(), sin demorar la respuesta del bot. Si el correo falla, queda registrado.
4. Resumen diario: ruta /api/tareas/resumen-diario protegida con CRON_SECRET, programada en Vercel
   a las 6:00 p. m. hora de Bogotá, con las métricas de docs/chatbot.md.
5. Pruebas: el resumen calcula bien las métricas con datos de ejemplo, y un correo fallido no rompe al bot.

Primero muéstrame el plan.
```
**Listo cuando:** dejas una solicitud desde tu celular y el correo te llega en segundos; y al llamar la ruta del resumen te llega el resumen del día.

### B7 — Ensayo general
```
Vamos con B7. Lee docs/guion-demo.md completo.
1. Repasa conmigo la lista "Antes de la reunión" y ayúdame a cumplir cada punto, incluido registrar
   el celular de Cano en Meta.
2. Corre npm run test:db, npm run test, npm run validar:catalogo y npm run eval:bot. Todo en verde.
3. Hagamos juntos el recorrido de las secciones 2 y 3 del guion desde mi celular y anota cualquier
   respuesta del bot que no haya sido clara.
```
**Listo cuando:** recorres el guion completo dos veces, con los datos móviles del celular, sin tropiezos.

---

## Si algo sale mal
- **Claude Code se enreda o da vueltas:** dile "detente, resume qué intentaste y qué falló". Si sigue, cierra la sesión y abre una nueva con el mismo prompt más lo que aprendiste.
- **Una prueba falla después de un cambio:** no la borres ni la cambies para que pase. Pide "explícame por qué falla esta prueba antes de tocar nada".
- **El bot responde algo incorrecto:** agrega esa pregunta como caso nuevo de `npm run eval:bot`, y luego corrige el catálogo o el prompt hasta que pase.
- **Dudas de arquitectura o de negocio:** vuelve al proyecto "Sistema notarial" en Claude y pregunta ahí.
