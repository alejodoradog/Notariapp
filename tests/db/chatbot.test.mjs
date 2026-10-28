// Pruebas del chatbot y del panel de atención.
import { readFileSync } from 'node:fs';
import { prepararBase } from './_base.mjs';

const { db, ok, esperaError, como, comoAnonimo, comoServidor, terminar } = await prepararBase();

const U = {
  notarioA:  '00000000-0000-0000-0000-0000000000a1',
  empleadoA: '00000000-0000-0000-0000-0000000000a2',
  empleadoA2:'00000000-0000-0000-0000-0000000000a3',
  empleadoB: '00000000-0000-0000-0000-0000000000b1',
};

// ---------- Datos: dos notarías, catálogo base desde datos/tramites.json ----------
await comoServidor();
const { rows: [A] } = await db.query(`INSERT INTO notarias (codigo, nombre) VALUES ('SQ001','Notaría demo') RETURNING id`);
const { rows: [B] } = await db.query(`INSERT INTO notarias (codigo, nombre) VALUES ('PO002','Otra notaría') RETURNING id`);
await db.query(`INSERT INTO usuarios VALUES ($1,$2,'Cano','notario',true),($3,$2,'Ventanilla 1','empleado',true),($4,$2,'Ventanilla 2','empleado',true),($5,$6,'Ventanilla B','empleado',true)`,
  [U.notarioA, A.id, U.empleadoA, U.empleadoA2, U.empleadoB, B.id]);
await db.query(`INSERT INTO notaria_perfil (notaria_id, nombre_publico, ciudad, horario) VALUES ($1,'Notaría demo','Santander de Quilichao','DATO DE PRUEBA')`, [A.id]);

const base = JSON.parse(readFileSync(new URL('../../datos/tramites.json', import.meta.url), 'utf8'));
for (const t of base.tramites) {
  await db.query(
    `INSERT INTO catalogo_tramites (notaria_id, codigo, nombre, sinonimos, descripcion, requisitos, casos_especiales, notas, tarifa, fuentes, validado_por_notaria, vigencia_desde)
     VALUES (NULL,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [t.codigo, t.nombre, t.sinonimos, t.descripcion, t.requisitos, t.casos_especiales, t.notas, JSON.stringify(t.tarifa), t.fuentes, t.validado_por_notaria, base.tarifas.vigencia_desde]);
}
const { rows: [{ n: nCat }] } = await db.query(`SELECT count(*)::int n FROM catalogo_tramites`);
ok('El catálogo de datos/tramites.json carga completo', nCat === base.tramites.length, `${nCat} trámites`);
// La notaría B tiene su propia versión validada de un trámite.
await db.query(`INSERT INTO catalogo_tramites (notaria_id, codigo, nombre, descripcion, requisitos, tarifa, validado_por_notaria, vigencia_desde)
  VALUES ($1,'autenticacion','Autenticación (B)','x',ARRAY['x'],'{"tipo":"fija","valor":2800}',true,'2026-02-01')`, [B.id]);
await esperaError('No se duplica un código en el catálogo base',
  `INSERT INTO catalogo_tramites (notaria_id, codigo, nombre, descripcion, requisitos, tarifa, vigencia_desde) VALUES (NULL,'autenticacion','x','x',ARRAY['x'],'{}','2026-02-01')`, [], /duplicate key/);

// ---------- El webhook (servidor) registra una conversación ----------
const { rows: [conv] } = await db.query(`INSERT INTO conversaciones (notaria_id, telefono, nombre_perfil) VALUES ($1,'573001234567','Ciudadana') RETURNING id`, [A.id]);
await db.query(`INSERT INTO mensajes (notaria_id, conversacion_id, direccion, autor, wa_message_id, contenido, intencion, tramite_codigo)
  VALUES ($1,$2,'entrante','ciudadano','wamid.001','q necesito pa casarme','requisitos','matrimonio_civil')`, [A.id, conv.id]);
await esperaError('Un reintento de Meta (mismo wa_message_id) no duplica el mensaje',
  `INSERT INTO mensajes (notaria_id, conversacion_id, direccion, autor, wa_message_id, contenido) VALUES ($1,$2,'entrante','ciudadano','wamid.001','repetido')`, [A.id, conv.id], /duplicate key/);
await esperaError('Un mensaje del bot no puede marcarse como entrante',
  `INSERT INTO mensajes (notaria_id, conversacion_id, direccion, autor, contenido) VALUES ($1,$2,'entrante','bot','x')`, [A.id, conv.id], /check constraint/);
await esperaError('Sin autorización de datos no se guarda la solicitud',
  `INSERT INTO solicitudes (notaria_id, conversacion_id, tipo, tramite_codigo, nombre, telefono, autoriza_datos) VALUES ($1,$2,'tramite','sucesion','Ana','573001234567',false)`, [A.id, conv.id], /check constraint/);
const { rows: [sol] } = await db.query(`INSERT INTO solicitudes (notaria_id, conversacion_id, tipo, tramite_codigo, nombre, telefono, autoriza_datos)
  VALUES ($1,$2,'tramite','matrimonio_civil','Ana Pérez','573001234567',true) RETURNING id, codigo_seguimiento`, [A.id, conv.id]);
ok('La solicitud recibe un código de seguimiento de 8 caracteres', sol.codigo_seguimiento.length === 8, sol.codigo_seguimiento);
const { rows: [solCita] } = await db.query(`INSERT INTO solicitudes (notaria_id, conversacion_id, tipo, nombre, telefono, autoriza_datos, preferencia_horario)
  VALUES ($1,$2,'cita','Ana Pérez','573001234567',true,'martes en la mañana') RETURNING id`, [A.id, conv.id]);

// ---------- Visibilidad ----------
await comoAnonimo();
await esperaError('Un visitante anónimo no puede leer solicitudes', `SELECT * FROM solicitudes`, [], /permission denied/);
await esperaError('Un visitante anónimo no puede leer mensajes', `SELECT * FROM mensajes`, [], /permission denied/);
await como(U.empleadoB);
const { rows: [{ n: solB }] } = await db.query(`SELECT count(*)::int n FROM solicitudes`);
ok('La notaría B no ve las solicitudes de la A', solB === 0);
const { rows: [{ n: msgB }] } = await db.query(`SELECT count(*)::int n FROM mensajes`);
ok('La notaría B no ve los mensajes de la A', msgB === 0);
const { rows: catB } = await db.query(`SELECT nombre FROM catalogo_tramites WHERE codigo = 'autenticacion' ORDER BY notaria_id NULLS LAST`);
ok('La notaría B ve su versión del trámite y la base', catB.length === 2 && catB[0].nombre === 'Autenticación (B)');
await como(U.empleadoA);
const { rows: catA } = await db.query(`SELECT nombre FROM catalogo_tramites WHERE codigo = 'autenticacion'`);
ok('La notaría A no ve la versión de la B', catA.length === 1 && !catA[0].nombre.includes('(B)'));
const { rows: [{ n: solA }] } = await db.query(`SELECT count(*)::int n FROM solicitudes`);
ok('La notaría A ve sus solicitudes', solA === 2);

// ---------- Atención de solicitudes ----------
await esperaError('El empleado no puede editar solicitudes directamente', `UPDATE solicitudes SET estado = 'convertida'`, [], /permission denied/);
await esperaError('El empleado no puede borrar mensajes', `DELETE FROM mensajes`, [], /permission denied/);
await db.query(`SELECT atender_solicitud($1, 'contactada', 'Le escribí por WhatsApp')`, [sol.id]);
await esperaError('Transición inválida rechazada', `SELECT atender_solicitud($1, 'nueva')`, [sol.id], /no se puede pasar/);
await esperaError('Una cita no se radica como trámite', `SELECT convertir_solicitud($1)`, [solCita.id], /solo las solicitudes de trámite/);
const { rows: [{ convertir_solicitud: tramiteId }] } = await db.query(`SELECT convertir_solicitud($1)`, [sol.id]);
const { rows: [tr] } = await db.query(`SELECT t.radicado, t.tipo_tramite, s.estado FROM tramites t JOIN solicitudes s ON s.tramite_id = t.id WHERE t.id = $1`, [tramiteId]);
ok('La solicitud se convierte en un trámite radicado y enlazado', tr.radicado === 'SQ001-2026-000001' && tr.estado === 'convertida' && tr.tipo_tramite === 'Matrimonio civil', `${tr.radicado} · ${tr.tipo_tramite}`);
await esperaError('No se convierte dos veces', `SELECT convertir_solicitud($1)`, [sol.id], /ya fue convertida/);
await como(U.empleadoB);
await esperaError('Otra notaría no puede atender la solicitud', `SELECT atender_solicitud($1, 'descartada')`, [solCita.id], /no encontrada/);

// ---------- Atención humana de la conversación ----------
await como(U.empleadoA);
await esperaError('No se responde sin tomar la conversación', `SELECT registrar_respuesta_empleado($1, 'Hola')`, [conv.id], /tome la conversación/);
await db.query(`SELECT tomar_conversacion($1)`, [conv.id]);
const { rows: [{ registrar_respuesta_empleado: msgId }] } = await db.query(`SELECT registrar_respuesta_empleado($1, 'Buenas tardes, le habla la notaría')`, [conv.id]);
ok('El funcionario que tomó la conversación puede responder', !!msgId);
await como(U.empleadoA2);
await esperaError('Otro funcionario no responde una conversación ajena', `SELECT registrar_respuesta_empleado($1, 'Hola')`, [conv.id], /tome la conversación/);
await como(U.empleadoA);
await db.query(`SELECT devolver_al_bot($1)`, [conv.id]);
const { rows: [c2] } = await db.query(`SELECT estado, atendida_por FROM conversaciones WHERE id = $1`, [conv.id]);
ok('La conversación vuelve al bot', c2.estado === 'bot' && c2.atendida_por === null);

// ---------- Auditoría ----------
await como(U.notarioA);
const { rows: eventos } = await db.query(`SELECT tabla, accion, usuario_id FROM audit_log WHERE tabla IN ('solicitudes','conversaciones') ORDER BY seq`);
const cambioEstado = eventos.find((e) => e.tabla === 'solicitudes' && e.accion === 'UPDATE' && e.usuario_id === U.empleadoA);
ok('El cambio de estado de la solicitud queda auditado con su autor', !!cambioEstado, `${eventos.length} eventos`);
await comoServidor();
const { rows: [{ verificar_cadena: rota }] } = await db.query(`SELECT verificar_cadena($1)`, [A.id]);
ok('La cadena de auditoría sigue íntegra', rota === null);

terminar();
