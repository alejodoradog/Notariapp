# Hoja de ruta

Fase actual: **Bot MVP** (para la primera reunión con Cano)

| Fase | Duración estimada | Contenido | Compuerta para avanzar |
| --- | --- | --- | --- |
| **Bot MVP** | 3–5 semanas | Chatbot de WhatsApp con conocimiento verificado, solicitudes y alertas por correo a la notaría, resumen diario. Para la reunión: prototipo navegable de la plataforma (ya hecho, no se programa) | Cano prueba el bot en su celular, ve el prototipo y acepta un piloto |
| Piloto del bot | 2–4 semanas | Requisitos y tarifas validados por la notaría, número real de WhatsApp verificado, discovery de la operación (SIN, caja, roles) | El bot atiende ciudadanos reales sin errores de información |
| Plataforma de gestión | 4–6 semanas | Panel de solicitudes y conversaciones, ficha del trámite con estados y avisos, tablero del notario (`docs/fase-plataforma.md`). El bot gana "¿cómo va mi trámite?" | La notaría gestiona sus trámites en el panel |
| Núcleo del dinero | 4–5 semanas | Liquidación desde el tarifario, cobro con factura del SIN, arqueo ciego, reversos, comprobante al ciudadano | Un día real cuadra contra el SIN y la caja física |
| Control en paralelo | 4 semanas | Conciliación con el SIN, anomalías, sello diario | Dos semanas sin diferencias sin explicar |

## Backlog del bot MVP (una sesión de Claude Code por ítem)
- [ ] B1 Proyecto base: Next.js 16, base de datos en Supabase, catálogo cargado, notaría demo, página de privacidad
- [ ] B2 Base de conocimiento: cotejar tarifas con la resolución oficial y ampliar a los trámites más frecuentes, todo con fuentes
- [ ] B3 Conocimiento del bot: búsqueda de trámites y calculadora de costos, con los casos de `docs/chatbot.md` como pruebas
- [ ] B4 Conexión con WhatsApp: webhook en Vercel con el número de prueba de Meta
- [ ] B5 Cerebro del bot: Claude con sus herramientas y el prompt; `npm run eval:bot` en verde
- [ ] B6 Correos a la notaría: solicitud nueva, ciudadano que pide una persona y resumen diario con métricas
- [ ] B7 Ensayo general: guion de la demo, celular de Cano registrado en Meta

## Ya construido y probado (no hay que rehacerlo)
| Migración | Contenido | Pruebas | La usa |
| --- | --- | --- | --- |
| `…_nucleo_financiero.sql` | Usuarios y roles, trámites, caja, pagos, reversos, auditoría con hash encadenado | 28 | Núcleo del dinero |
| `…_chatbot_y_panel.sql` | Perfil de la notaría, catálogo de trámites, conversaciones, mensajes, solicitudes | 26 | **Bot MVP** y plataforma |
| `…_tramites_conectados.sql` | Personas del trámite, historial, cambio de estado, cola de avisos, consulta por celular | 28 | Plataforma |

Las tres se aplican desde B1: las tablas que el bot no usa todavía no estorban, y así la plataforma llega sin migrar datos.
