# Guion de la reunión con Cano (unos 30 minutos)

Objetivo: que Cano pruebe el bot en su propio celular, vea en el prototipo cómo sería controlar su notaría, y acepte un piloto. De paso, conseguir las respuestas del discovery.

Lo que llevas:
- **El bot, funcionando de verdad**, en el número de prueba de WhatsApp.
- **El prototipo navegable de la plataforma** ([abrir](https://claude.ai/artifact/K81iX84y6yc3sF4jcAXAHS)), abierto en tu portátil. Son pantallas de muestra con datos de ejemplo: no está conectado al bot. Dilo así, sin rodeos.

## Antes de la reunión
- [ ] El celular de Cano está registrado como destinatario en la consola de Meta, y ya le llegó un mensaje de prueba.
- [ ] El token de acceso de Meta es permanente (el temporal vence en horas).
- [ ] El correo de alertas (`CORREO_NOTARIA`) apunta a un correo que puedas abrir en el celular durante la reunión.
- [ ] `npm run eval:bot` en verde el mismo día.
- [ ] Probaste el guion completo dos veces, con los datos móviles del celular (no el wifi de la notaría).
- [ ] El prototipo abre sin internet lento (ábrelo antes de llegar y déjalo cargado).
- [ ] Llevas impresa la lista de trámites del bot, para que Cano marque cuáles valida.

## 1. Apertura (2 min)
"Le traigo algo para que lo pruebe usted mismo, en su celular. No le voy a mostrar diapositivas."

## 2. Cano usa el bot (8 min)
Pídele que escriba como lo haría un ciudadano. Sugerencias si se queda en blanco:
- "Qué necesito para casarme" → requisitos completos y el edicto de 5 días.
- "Cuánto cuesta escriturar una casa de 150 millones" → $ 571.319 con IVA, aclarando lo que no incluye.
- "Me puedo casar con 16 si mis papás firman" → no, desde la ley de 2025.
- Algo raro, que no esté en la base → el bot no inventa y ofrece el contacto de la notaría. **Señala esto:** la prudencia es la mitad del valor.

## 3. El bot trabaja para la notaría (4 min)
- Cano escribe "quiero hacer un poder" y autoriza sus datos. El bot le da un código de seguimiento.
- En tu celular, **llega al instante el correo** con su nombre, el trámite y un botón para escribirle por WhatsApp.
- Muéstrale el resumen diario de ayer: cuántas conversaciones, qué preguntaron, a qué horas.
- La idea que debe quedar: "Cada pregunta que el bot responde es una llamada que su equipo no tuvo que contestar, y cada solicitud queda registrada."

## 4. Lo que viene: el prototipo de la plataforma (8 min)
Presenta el prototipo como lo que es: "Así se vería por dentro. Todavía no lo he construido: primero quiero entender cómo trabajan ustedes."
- **Solicitudes:** lo que hoy llega por correo, aquí llegaría a una bandeja que su equipo atiende en tres clics.
- **Ficha del trámite:** el estado con su sello, quién hizo cada cambio y a qué hora, y el aviso que le llega al ciudadano cuando falta un documento o cuando ya puede recoger. Nadie puede borrar ese historial.
- **Tablero:** el día de la notaría en una frase, y el bloque de caja: ingresos por cajero y diferencias de arqueo.
- **Integridad:** activa la alerta en el prototipo. La frase clave: *"Ni yo, que hice el sistema, puedo cambiar un pago sin que usted se entere."* Aclara que esto ya está construido y probado en la base de datos; lo que falta son las pantallas.

## 5. Preguntas para Cano (6 min)
Anota las respuestas: definen la siguiente fase.
- ¿Con qué programa facturan? ¿Es el SIN? ¿Puede sacar un reporte diario de facturas?
- ¿Quién recibe el dinero? ¿Cuántas cajas hay? ¿Cómo cierran caja hoy?
- ¿Cuáles son los 10 trámites más frecuentes? ¿Me valida los requisitos de la lista impresa?
- ¿Qué le preocupa más del manejo del dinero hoy?
- ¿Tiene un número de WhatsApp para la notaría? ¿Quién lo atiende?
- De lo que vio en el prototipo, ¿qué le serviría primero?

## 6. Cierre: propuesta de piloto
"Le propongo dos a cuatro semanas con el bot atendiendo en el WhatsApp de la notaría, con los requisitos que usted valide. Mientras tanto, entiendo cómo trabajan para construir la plataforma sobre su operación real, empezando por lo que usted me dijo que necesita primero."

## Lo que NO hacer
- No presentar el prototipo como si funcionara: es una muestra con datos de ejemplo.
- No prometer fechas de la plataforma ni de la caja antes de entender el SIN y la operación.
- No dejar que la demo dependa del wifi de la notaría.
