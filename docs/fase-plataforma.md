# Fase plataforma de gestión

**No se construye todavía.** Este documento guarda el plan para cuando Cano apruebe el piloto. La base de datos que necesita ya existe y está probada (`…_tramites_conectados.sql`, 28 pruebas). El diseño de pantallas está en `docs/diseno.md` y el prototipo navegable que se mostró a Cano está en https://claude.ai/artifact/K81iX84y6yc3sF4jcAXAHS: úsalo como referencia visual de cada pantalla.

Antes de empezar esta fase, actualiza este documento con lo aprendido en la reunión y en el piloto: cómo radican, quién atiende el WhatsApp, qué estados usan de verdad, qué quiere ver Cano en su tablero.

## Qué gana el bot al activar la plataforma
- "¿Cómo va mi trámite?" con el estado real (herramienta `mis_tramites`).
- Avisos de documento faltante y de "listo para recoger".
- Atención humana dentro del mismo chat de WhatsApp.

Se activa con `PLATAFORMA_ACTIVA=true` y agregando a `npm run eval:bot` los casos marcados "con plataforma" en `docs/chatbot.md`.

## Requisitos previos
- [ ] Plantillas de WhatsApp aprobadas por Meta para "documento faltante" y "trámite listo" (variables `WHATSAPP_PLANTILLA_PENDIENTE_DOC` y `WHATSAPP_PLANTILLA_LISTO`).
- [ ] Usuarios reales del personal definidos con Cano (quién es empleado, quién notario).
- [ ] Planes pagos: Vercel Pro y Supabase Pro antes de guardar datos de trámites reales.

## Sesiones

### P1 — Acceso del personal y diseño base
```
Lee CLAUDE.md, docs/fase-plataforma.md y docs/diseno.md. Vamos con P1. Crea la rama p1-acceso.

1. Configura shadcn/ui y aplica la paleta, la tipografía y la forma de docs/diseno.md como variables CSS.
2. Clientes de Supabase para navegador y servidor según la documentación actual de @supabase/ssr;
   protege todas las rutas bajo /panel.
3. Inicio de sesión con correo y contraseña, y el menú lateral de docs/diseno.md (Solicitudes,
   Conversaciones, Trámites, y Tablero solo para el notario), con el rol leído de la tabla usuarios.
4. Actualiza CLAUDE.md: la fase actual pasa a ser la plataforma.

Primero muéstrame el plan.
```

### P2 — Solicitudes y conversaciones
```
Vamos con P2. Crea la rama p2-bandeja. Lee docs/diseno.md (Solicitudes y Conversaciones).

1. Pantalla Solicitudes exactamente como docs/diseno.md: lista y detalle lado a lado, navegación con
   flechas y Enter, acciones con atender_solicitud y convertir_solicitud. Al radicar, muestra el
   radicado en grande y abre la ficha del trámite (por ahora una página simple; se completa en P3).
2. Pantalla Conversaciones: lista (primero las que esperan una persona) y chat con globos tipo WhatsApp.
   "Atender yo" (tomar_conversacion), respuesta (registrar_respuesta_empleado y luego envío con
   src/servidor/whatsapp.ts), "Devolver al bot". Respeta la ventana de 24 horas.
3. Activa PLATAFORMA_ACTIVA=true en desarrollo: pasar_a_humano cambia la conversación a estado humano.
4. Todo se actualiza solo, sin recargar (Supabase Realtime o consulta periódica: elige y explica).
5. Pruebas con Playwright: llega una solicitud → "Marcar como contactada" → "Radicar".

Primero muéstrame el plan.
```

### P3 — Ficha del trámite y avisos
```
Vamos con P3. Crea la rama p3-ficha. Lee docs/diseno.md (Ficha del trámite y Trámites) y la sección
"Conexión con la plataforma de gestión" de docs/chatbot.md.

1. Ficha del trámite exactamente como docs/diseno.md: encabezado con radicado y SelloEstado, una sola
   acción principal según el estado, Personas (agregar_parte, cédula enmascarada) e Historial
   (tramite_eventos, más agregar_nota).
2. Cambios de estado con cambiar_estado; "Falta un documento" pide qué falta con sugerencias del
   catálogo; "Anular" solo para el notario y con motivo. Animación del sello según docs/diseno.md,
   respetando movimiento reducido.
3. Envío de avisos según "Envío de avisos" de docs/chatbot.md.
4. Activa la herramienta mis_tramites del bot y agrega sus casos a npm run eval:bot.
5. Pantalla Trámites: filtros por estado, buscador y tabla de filas.
6. Pruebas con Playwright: radicado → en proceso → falta un documento → aviso encolado y enviado.

Primero muéstrame el plan.
```

### P4 — Tablero del notario
```
Vamos con P4. Crea la rama p4-tablero. Lee docs/diseno.md (Tablero).

Pantalla /panel/tablero, solo para el notario:
1. Resumen del día en una frase con comparación contra ayer: conversaciones, solicitudes, trámites
   radicados y trámites esperando un documento.
2. Trámites por estado, lo que más preguntan los ciudadanos y horas de más mensajes.
3. Indicador de integridad con verificar_cadena (desde el servidor).
4. El bloque de caja solo aparece cuando exista la fase del dinero; mientras tanto, no se muestra.

Debe entenderse en 10 segundos. Primero muéstrame el plan.
```

### P5 — Paso a producción de la plataforma
```
Vamos con P5. Lee docs/fase-plataforma.md (Requisitos previos).
1. Revisa conmigo cada requisito previo y ayúdame a cumplirlo.
2. Proyecto de Supabase de producción (plan Pro), migraciones aplicadas por CI, variables en Vercel.
3. Crea los usuarios reales del personal y verifica con cada uno lo que ve.
4. Corre todas las pruebas y la evaluación del bot en modo plataforma.
```
