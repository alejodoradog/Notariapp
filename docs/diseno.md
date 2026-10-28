# Diseño del panel

> Para la fase de plataforma (`docs/fase-plataforma.md`). En el bot MVP no se construye; sirvió de base para el prototipo navegable de la reunión con Cano.

Quién lo usa: empleados de ventanilla y caja, muchos no nativos digitales, en PC con Windows y Chrome, ocho horas al día; y el notario, que necesita entender su notaría de un vistazo.
Qué debe lograr: que cada tarea frecuente salga en tres pasos o menos, sin dudas, y que todo se sienta tan confiable como un documento notarial.

## Idea visual
El panel toma su lenguaje del protocolo notarial: papel de seguridad, tinta de firma y sello. Es sobrio y ordenado, con un solo gesto memorable: **cuando un trámite cambia de estado, la ficha se "sella"**. El sello del nuevo estado aparece con un golpe corto, como un sello húmedo sobre el papel. Es la única animación del panel y responde a una acción de la persona. Todo lo demás es quieto.

## Paleta
| Nombre | Hex | Uso |
| --- | --- | --- |
| Papel | `#F5F7F2` | Fondo general: blanco con un leve verde, como el papel de seguridad notarial |
| Folio | `#FFFFFF` | Superficies de trabajo (listas, ficha, chat) |
| Tinta | `#1C2B3A` | Texto principal: azul muy oscuro, como la tinta de firma |
| Tinta suave | `#4F5D6B` | Texto secundario |
| Sello | `#0F5B4E` | Acciones principales, foco del teclado, elemento activo del menú |
| Línea | `#D5DBD0` | Bordes y separadores |

Colores de estado: siempre acompañados de su nombre escrito, nunca solos.
| Estado (como se muestra) | Color del sello | Valor en la base |
| --- | --- | --- |
| Radicado | Tinta `#1C2B3A` | `radicado` |
| En proceso | Azul `#1F5FA8` | `en_proceso` |
| Falta un documento | Ámbar `#9A5B00` | `pendiente_doc` |
| Listo para entregar | Sello `#0F5B4E` | `listo` |
| Entregado | Gris `#5F6B66` | `entregado` |
| Anulado | Lacre `#A3302A` | `anulado` |

Todas las combinaciones de texto cumplen contraste AA sobre Papel y Folio. Sin modo oscuro en el MVP.

## Tipografía
- **Atkinson Hyperlegible Next** para todo. La diseñó el Braille Institute para máxima legibilidad: distingue bien `1 l I` y `0 O`, algo clave en cédulas, radicados y valores. Cárgala con `next/font/google`; si la versión instalada no la trae, usa los archivos de `@fontsource`.
- Cifras tabulares (`font-variant-numeric: tabular-nums`) en valores, radicados y horas, para que las columnas alineen.
- Escala: texto base **17 px**, interlineado 1,5. Secundario 15 px. Títulos de sección 22 px en peso semibold. Radicado en la ficha 32 px.
- Mayúscula solo al inicio de la frase. Nada en mayúsculas sostenidas, ni siquiera etiquetas.

## Forma
- Esquinas de 6 px en controles y 10 px en superficies; los sellos de estado tienen borde doble de 1,5 px y esquinas de 4 px.
- Sin sombras de tarjeta: las superficies se separan con borde Línea y fondo Folio sobre Papel.
- Botones de 48 px de alto mínimo. Una sola acción principal por pantalla (fondo Sello, texto blanco); las demás con borde.
- Foco del teclado: anillo de 3 px color Sello, siempre visible.
- Listas como filas, no como tarjetas: se leen de un vistazo y caben más.

## Navegación
Menú lateral fijo de 220 px, con texto (no solo íconos):
- **Solicitudes**, con contador de nuevas
- **Conversaciones**, con contador de las que esperan una persona
- **Trámites**
- **Tablero** (solo notario)

Arriba a la derecha: nombre, rol y "Cerrar sesión". Buscador global: tecla `/` o clic, acepta radicado, nombre o celular.

## Pantallas

### Solicitudes (la bandeja)
```
┌ Solicitudes ─────────────────────────────────────────────────────────────┐
│ Nuevas (6)   Contactadas (3)   Todas                                     │
├──────────────────────────────────────┬───────────────────────────────────┤
│ ● Ana Pérez     Poder       hace 4 min│ Ana Pérez                         │
│   Juan Mora     Matrimonio hace 22 min│ Quiere hacer: Poder               │
│   Rosa Díaz     Cita         hace 1 h │ Celular: 300 111 2233             │
│   ...                                │ Prefiere: martes en la mañana     │
│                                      │ Llegó: hoy 9:42 a. m. por WhatsApp│
│                                      │                                   │
│                                      │ [ Radicar ]  [ Marcar como contactada ]   │
│                                      │ [ Ver conversación ] [ Descartar ]│
└──────────────────────────────────────┴───────────────────────────────────┘
```
- Lista a la izquierda, detalle a la derecha: se trabaja sin cambiar de página.
- Flechas arriba y abajo para moverse, `Enter` para la acción principal ("Radicar" si es un trámite; "Marcar como contactada" si es cita o llamada).
- Al radicar: el radicado aparece en grande y la ficha se abre con el sello "Radicado".
- Vacía: "No hay solicitudes nuevas. Las que lleguen por WhatsApp aparecerán aquí al instante."

### Conversaciones
- Igual división: lista a la izquierda (primero las que esperan una persona, marcadas "Pidió hablar con alguien"), chat a la derecha con globos como WhatsApp: ciudadano a la izquierda, bot y funcionario a la derecha, con el autor bajo cada globo.
- Barra superior del chat: "Atiende el bot" o "Atiende usted", con el botón "Atender yo" o "Devolver al bot".
- La caja de respuesta solo se activa al atender. `Enter` envía; `Shift+Enter` agrega una línea.
- Si pasaron más de 24 horas desde el último mensaje del ciudadano: "No se puede escribir libremente: el ciudadano no ha escrito en 24 horas."

### Ficha del trámite (la pantalla más importante)
```
┌──────────────────────────────────────────────────────────────────────────┐
│ SQ001-2026-000014                                     ╔══════════════╗   │
│ Poder (especial o general)                            ║ Falta un     ║   │
│ Radicado el 23 oct. 2026 por Ventanilla 1             ║ documento    ║   │
│                                                       ╚══════════════╝   │
│ Falta: copia de la cédula del apoderado                                  │
│ [ Marcar en proceso ]   Más acciones ▾                                   │
├────────────────────────────────┬─────────────────────────────────────────┤
│ Personas                       │ Historial                               │
│ Ana Pérez, solicitante         │ 10:31  Falta un documento — Ventanilla 1│
│ CC ***0111   Cel. 300 111 2233 │        Copia de la cédula del apoderado │
│ Recibe avisos por WhatsApp ✓   │        Aviso enviado por WhatsApp ✓     │
│                                │ 09:58  En proceso — Ventanilla 1        │
│ Luis Gómez, apoderado          │ 09:42  Radicado — Ventanilla 1          │
│ CC ***2345   Sin avisos        │        Creado desde la solicitud 7F3A…  │
│ [ Agregar persona ]            │ [ Agregar nota ]                        │
└────────────────────────────────┴─────────────────────────────────────────┘
```
- El sello de estado arriba a la derecha es el elemento memorable: borde doble, color del estado y nombre escrito.
- **Una sola acción principal, la que sigue según el estado**: Radicado → "Empezar"; En proceso → "Marcar listo para entregar" (y en "Más acciones": "Falta un documento"); Falta un documento → "Marcar en proceso"; Listo → "Marcar entregado". "Anular" solo aparece para el notario, en "Más acciones", y pide el motivo.
- "Falta un documento" abre un campo corto: "¿Qué documento falta?" con sugerencias del catálogo de requisitos del trámite.
- Al confirmar un cambio: el sello nuevo se estampa (animación de 180 ms: escala de 1,15 a 1 y opacidad de 0 a 1; con movimiento reducido, solo opacidad), se agrega la línea al historial y debajo se ve el estado del aviso: "Aviso enviado por WhatsApp a Ana Pérez" o "Aviso no enviado: …".
- Cédulas siempre enmascaradas (`***0111`); "Mostrar" revela el número completo y queda registrado.
- El historial es una línea de tiempo real (del más reciente al más antiguo), con hora, quién y qué. No tiene botones de editar ni borrar.

### Trámites (lista)
Filtros por estado (con sus sellos), buscador y una tabla de filas: radicado, trámite, persona principal, estado, última novedad. `Enter` abre la ficha.

### Tablero (notario)
- Arriba, el resumen del día **en una frase**, en 22 px: "Hoy: 23 conversaciones, 6 solicitudes y 4 trámites radicados. 2 trámites esperan un documento." Cada cifra lleva debajo, en pequeño, su comparación con ayer.
- Si hay algo que atender, va antes que todo, en una franja de color Lacre con texto: "Se detectó una alteración en los registros del 22 oct. en pagos" o "Arqueo de Caja 1 con faltante de $ 9.500".
- Debajo: trámites por estado (barras horizontales con los colores de los sellos), lo que más preguntan los ciudadanos, horas de más mensajes.
- Bloque de caja con la etiqueta fija "Vista previa: datos de ejemplo" mientras no esté conectada la caja real.
- Indicador de integridad: "Registros íntegros, verificado hoy 7:00 a. m." con el sello en verde, o la alerta en Lacre.

## Textos de la interfaz
- La misma palabra en todo el flujo: el botón "Radicar" produce "Radicado SQ001-2026-000014"; "Atender yo" produce "Usted está atendiendo esta conversación".
- Español claro, de usted, sin términos técnicos: "conversación", no "chat session"; "aviso", no "notificación push".
- Errores que dicen qué hacer: "Indique qué documento falta", "Tome la conversación antes de responder". Los mensajes de las funciones de la base ya vienen así: muéstralos tal cual.
- Fechas y horas en formato colombiano: "23 oct. 2026", "9:42 a. m.". Valores: "$ 309.500".

## Implementación
- Tokens como variables CSS en `src/app/globals.css` y en el tema de Tailwind; el tema de shadcn/ui se ajusta a esta paleta, no al revés.
- Componentes propios en `src/componentes/`: `SelloEstado`, `FilaLista`, `LineaHistorial`, `GloboMensaje`, `ResumenDelDia`.
- Comprobar cada pantalla a 1366 × 768 (la resolución más común en PC de oficina) y con zoom del navegador al 125 %.
