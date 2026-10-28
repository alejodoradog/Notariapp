# Contexto del negocio

> Fase actual: bot MVP (ver `docs/chatbot.md`). La plataforma de gestión (`docs/fase-plataforma.md`) y el circuito del dinero de este documento se construyen después de la reunión con Cano.

## La notaría
Empresa privada que ejerce una función pública. El notario es el dueño y responde por todo lo que pasa en ella.
Las tarifas (derechos notariales) las fija cada año la Superintendencia de Notariado y Registro (SNR); en 2026 rigen desde el 1 de febrero. Sobre los derechos se cobra IVA.
Las notarías ya facturan electrónicamente, casi todas con el aplicativo **SIN** de la SNR. NotariApp **no factura**: registra el número de factura del SIN y concilia.

## Roles
| Rol | Qué hace | Qué NO puede hacer |
| --- | --- | --- |
| Empleado (ventanilla) | Radica trámites, registra comparecientes | Cobrar, editar valores, ver auditoría |
| Cajero | Abre su caja, cobra con número de factura del SIN, cierra con arqueo ciego | Ver el esperado antes de declarar, reversar pagos, editar su arqueo |
| Notario | Ve todo su negocio, aprueba arqueos, autoriza reversos y descuentos | — |
| Ciudadano | Consulta por WhatsApp los trámites donde su celular está registrado; recibe avisos y comprobantes. El código de consulta queda para la futura consulta web | Ver datos de otros trámites |

## Circuito del dinero
1. **Radicación** (empleado): crea el trámite → estado `radicado`. El sistema asigna radicado (`SQ001-2026-000001`) y un código de consulta aleatorio para el ciudadano.
2. **Liquidación** (sistema): calcula conceptos desde el tarifario vigente (derechos, IVA, aportes, recaudos para terceros). El empleado solo indica actos y cuantía; nunca digita valores.
3. **Cobro** (cajero, con caja abierta): recibe el dinero, factura en el SIN, registra el pago con el número de factura. El monto lo pone el sistema (saldo de la liquidación).
4. **Comprobante** (sistema): el ciudadano recibe al instante valor, conceptos y número de factura. Es el control antifraude principal: el ciudadano no tiene incentivo para ocultar un cobro.
5. **Arqueo ciego** (cajero): al cerrar su turno cuenta el efectivo y lo declara sin ver el esperado. El sistema calcula la diferencia.
6. **Aprobación** (notario): revisa diferencias y anomalías, aprueba el día. Recibe el sello diario por correo.
7. **Conciliación** (sistema, diaria): facturas del SIN contra pagos. Alerta por factura sin pago, pago sin factura, factura anulada, salto de consecutivo.

Ningún error se corrige borrando: se crea un evento nuevo (reverso, corrección) con autor, motivo y aprobación.

## Estados del trámite
- `radicado` → `en_proceso`, `anulado`
- `en_proceso` → `pendiente_doc`, `listo`, `anulado`
- `pendiente_doc` → `en_proceso`, `anulado`
- `listo` → `entregado`, `anulado`
- `entregado`, `anulado`: finales

## Inmutabilidad
- Tablas de dinero: solo inserción. Escritura únicamente por funciones RPC.
- `audit_log` con hash encadenado: cada evento incluye el hash del anterior.
- Sello diario: el hash del último evento del día se envía al correo del notario. Si alguien altera el pasado, deja de coincidir.

## Glosario
- **Radicado**: número interno legible del trámite.
- **Código de consulta**: código aleatorio que recibe el ciudadano para ver su trámite.
- **Liquidación**: desglose de lo que se cobra por un trámite.
- **Arqueo ciego**: conteo de caja sin conocer el valor esperado.
- **Reverso**: pago negativo que anula otro, autorizado por el notario.
- **SIN**: aplicativo de la SNR con el que las notarías facturan.

## Lo que aún no sabemos (se resuelve en el discovery)
- Qué exporta el SIN de esta notaría y en qué formato.
- Si quien radica también cobra, y cuántas cajas hay.
- Cómo se manejan los anticipos de escrituras.
- Qué cobros no se facturan hoy.
- Los 10 trámites más frecuentes con su tarifa y requisitos reales.
