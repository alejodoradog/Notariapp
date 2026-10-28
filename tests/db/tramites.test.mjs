// Pruebas del ciclo de vida del trámite y su conexión con el ciudadano.
import { prepararBase } from './_base.mjs';

const { db, ok, esperaError, como, comoAnonimo, comoServidor, terminar } = await prepararBase();

const U = {
  notarioA:  '00000000-0000-0000-0000-0000000000a1',
  empleadoA: '00000000-0000-0000-0000-0000000000a2',
  empleadoB: '00000000-0000-0000-0000-0000000000b1',
};
const CEL = '573001112233';          // celular de la ciudadana, como lo entrega Meta
const OTRO_CEL = '573009998877';

// ---------- Datos: dos notarías y una solicitud llegada por WhatsApp ----------
await comoServidor();
const { rows: [A] } = await db.query(`INSERT INTO notarias (codigo, nombre) VALUES ('SQ001','Notaría demo') RETURNING id`);
const { rows: [B] } = await db.query(`INSERT INTO notarias (codigo, nombre) VALUES ('PO002','Otra notaría') RETURNING id`);
await db.query(`INSERT INTO usuarios VALUES ($1,$2,'Cano','notario',true),($3,$2,'Ventanilla','empleado',true),($4,$5,'Ventanilla B','empleado',true)`,
  [U.notarioA, A.id, U.empleadoA, U.empleadoB, B.id]);
await db.query(`INSERT INTO catalogo_tramites (notaria_id, codigo, nombre, descripcion, requisitos, tarifa, vigencia_desde)
  VALUES (NULL,'poder','Poder (especial o general)','x',ARRAY['x'],'{"tipo":"consultar"}','2026-02-01')`);
const { rows: [conv] } = await db.query(`INSERT INTO conversaciones (notaria_id, telefono) VALUES ($1,$2) RETURNING id`, [A.id, CEL]);
const { rows: [sol] } = await db.query(`INSERT INTO solicitudes (notaria_id, conversacion_id, tipo, tramite_codigo, nombre, telefono, autoriza_datos)
  VALUES ($1,$2,'tramite','poder','Ana Pérez',$3,true) RETURNING id, codigo_seguimiento`, [A.id, conv.id, CEL]);

// ---------- Del bot al trámite ----------
await como(U.empleadoA);
const { rows: [{ convertir_solicitud: t1 }] } = await db.query(`SELECT convertir_solicitud($1)`, [sol.id]);
const { rows: partes } = await db.query(`SELECT nombre, telefono, rol, recibe_avisos FROM tramite_partes WHERE tramite_id = $1`, [t1]);
ok('Al radicar la solicitud, la ciudadana queda como persona del trámite con avisos', partes.length === 1 && partes[0].telefono === CEL && partes[0].rol === 'solicitante' && partes[0].recibe_avisos);
const { rows: ev1 } = await db.query(`SELECT tipo, detalle, visible_ciudadano FROM tramite_eventos WHERE tramite_id = $1 ORDER BY creado_en`, [t1]);
ok('El historial registra la radicación y el origen en WhatsApp', ev1.length === 2 && ev1[0].tipo === 'radicado' && ev1[0].visible_ciudadano && ev1[1].detalle.includes(sol.codigo_seguimiento), ev1.map((e) => e.tipo).join(' → '));

// ---------- Personas del trámite ----------
await esperaError('Sin autorización no se activan avisos', `SELECT agregar_parte($1,'Luis Gómez','apoderado','CC','12345',$2,false,true)`, [t1, OTRO_CEL], /autorización de datos/);
await db.query(`SELECT agregar_parte($1,'Ana Pérez (otro registro)','otorgante','CC','1061000111','300 111 2233',true,true)`, [t1]);
const { rows: [{ telefono: telNorm }] } = await db.query(`SELECT telefono FROM tramite_partes WHERE nombre LIKE '%otro registro%'`);
ok('El celular escrito "300 111 2233" se guarda normalizado', telNorm === CEL, telNorm);
await db.query(`SELECT agregar_parte($1,'Luis Gómez','apoderado','CC','12345',$2,true,false)`, [t1, OTRO_CEL]);

// ---------- Estados y avisos ----------
await esperaError('No se salta de "radicado" a "listo"', `SELECT cambiar_estado($1,'listo')`, [t1], /no se puede pasar de radicado a listo/);
await db.query(`SELECT cambiar_estado($1,'en_proceso')`, [t1]);
await esperaError('"Pendiente de documento" exige decir qué falta', `SELECT cambiar_estado($1,'pendiente_doc')`, [t1], /qué documento falta/);
await db.query(`SELECT cambiar_estado($1,'pendiente_doc','Falta la copia de la cédula del apoderado')`, [t1]);
const { rows: av1 } = await db.query(`SELECT telefono, motivo, detalle, estado FROM notificaciones WHERE tramite_id = $1`, [t1]);
ok('Se encola UN aviso por celular (sin duplicar a la misma persona)', av1.length === 1 && av1[0].telefono === CEL && av1[0].motivo === 'pendiente_doc' && av1[0].estado === 'pendiente', `${av1.length} aviso(s)`);
ok('Quien no pidió avisos no los recibe', !av1.some((a) => a.telefono === OTRO_CEL));
await db.query(`SELECT cambiar_estado($1,'en_proceso')`, [t1]);
await db.query(`SELECT cambiar_estado($1,'listo')`, [t1]);
const { rows: [{ n: avisosListo }] } = await db.query(`SELECT count(*)::int n FROM notificaciones WHERE tramite_id = $1 AND motivo = 'listo'`, [t1]);
ok('Al quedar "listo" se encola el aviso de recoger', avisosListo === 1);
await db.query(`SELECT agregar_nota($1,'La ciudadana llamó para confirmar la hora')`, [t1]);
const { rows: [{ v: notaVisible }] } = await db.query(`SELECT visible_ciudadano v FROM tramite_eventos WHERE tipo = 'nota' AND detalle LIKE 'La ciudadana%'`);
ok('Las notas internas no son visibles para el ciudadano', notaVisible === false);
await esperaError('Un empleado no puede anular', `SELECT cambiar_estado($1,'anulado','error')`, [t1], /solo el notario/);
await db.query(`SELECT cambiar_estado($1,'entregado')`, [t1]);
await esperaError('"Entregado" es un estado final', `SELECT cambiar_estado($1,'en_proceso')`, [t1], /no se puede pasar/);
await esperaError('A un trámite entregado no se le agregan personas', `SELECT agregar_parte($1,'Pedro Ruiz','otro')`, [t1], /ya no se pueden agregar/);

const { rows: [{ radicar_tramite: t2 }] } = await db.query(`SELECT radicar_tramite('Autenticación')`);
await como(U.notarioA);
await esperaError('Anular exige motivo', `SELECT cambiar_estado($1,'anulado')`, [t2], /motivo de la anulación/);
await db.query(`SELECT cambiar_estado($1,'anulado','Radicado por error')`, [t2]);
ok('El notario puede anular con motivo', true);

// ---------- Escritura directa bloqueada y aislamiento entre notarías ----------
await como(U.empleadoA);
await esperaError('Nadie cambia el estado sin pasar por la función', `UPDATE tramites SET estado = 'listo' WHERE id = $1`, [t1], /permission denied/);
await esperaError('Nadie fabrica avisos', `INSERT INTO notificaciones (notaria_id, tramite_id, evento_id, parte_id, telefono, motivo) SELECT notaria_id, tramite_id, evento_id, parte_id, '573000000000', 'listo' FROM notificaciones LIMIT 1`, [], /permission denied/);
await esperaError('Nadie borra el historial', `DELETE FROM tramite_eventos`, [], /permission denied/);
await como(U.empleadoB);
const { rows: [{ n: visB }] } = await db.query(`SELECT (SELECT count(*) FROM tramite_partes) + (SELECT count(*) FROM tramite_eventos) + (SELECT count(*) FROM notificaciones) AS n`);
ok('La notaría B no ve personas, historial ni avisos de la A', Number(visB) === 0);
await esperaError('La notaría B no puede cambiar estados de la A', `SELECT cambiar_estado($1,'en_proceso')`, [t2], /no encontrado/);

// ---------- Consulta del ciudadano por WhatsApp ----------
await esperaError('Un usuario del panel no puede usar la consulta del bot', `SELECT tramites_del_telefono($1,$2)`, [A.id, CEL], /permission denied/);
await comoAnonimo();
await esperaError('Un visitante anónimo tampoco', `SELECT tramites_del_telefono($1,$2)`, [A.id, CEL], /permission denied/);
await comoServidor();
await db.query(`INSERT INTO liquidacion_items (notaria_id, tramite_id, concepto, tipo, valor) VALUES ($1,$2,'Derechos','derechos',90600)`, [A.id, t1]);
const { rows: [{ tramites_del_telefono: mios }] } = await db.query(`SELECT tramites_del_telefono($1,$2)`, [A.id, CEL]);
ok('La ciudadana ve su trámite con estado, última novedad y saldo', mios.length === 1 && mios[0].estado === 'entregado' && mios[0].saldo_pendiente === 90600 && mios[0].ultima_novedad?.estado === 'entregado', JSON.stringify({ radicado: mios[0]?.radicado, estado: mios[0]?.estado, saldo: mios[0]?.saldo_pendiente }));
const { rows: [{ tramites_del_telefono: ajenos }] } = await db.query(`SELECT tramites_del_telefono($1,'573005550000')`, [A.id]);
ok('Otro celular no ve nada', ajenos.length === 0);
const { rows: [{ tramites_del_telefono: otraNotaria }] } = await db.query(`SELECT tramites_del_telefono($1,$2)`, [B.id, CEL]);
ok('En otra notaría, el mismo celular no ve nada', otraNotaria.length === 0);
const { rows: [{ tramites_del_telefono: apoderado }] } = await db.query(`SELECT tramites_del_telefono($1,$2)`, [A.id, OTRO_CEL]);
ok('El apoderado con datos autorizados también puede consultar', apoderado.length === 1);

// ---------- Auditoría ----------
const { rows: [{ n: cambios }] } = await db.query(`SELECT count(*)::int n FROM audit_log WHERE tabla = 'tramites' AND accion = 'UPDATE' AND usuario_id = $1`, [U.empleadoA]);
ok('Cada cambio de estado queda auditado con su autor', cambios === 5, `${cambios} cambios`);
const { rows: [{ verificar_cadena: rota }] } = await db.query(`SELECT verificar_cadena($1)`, [A.id]);
ok('La cadena de auditoría sigue íntegra', rota === null);

terminar();
