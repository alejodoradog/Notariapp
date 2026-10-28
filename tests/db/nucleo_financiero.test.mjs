// Pruebas del núcleo financiero. Corren con `npm run test:db`, sin Docker:
// levantan un PostgreSQL embebido (PGlite), simulan la autenticación de Supabase
// y aplican TODAS las migraciones de supabase/migrations en orden.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const carpeta = fileURLToPath(new URL('../../supabase/migrations/', import.meta.url));
const migraciones = readdirSync(carpeta).filter((f) => f.endsWith('.sql')).sort();
const db = new PGlite();
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${extra}`); };
const expectError = async (name, q, params = [], pattern) => {
  try { await db.query(q, params); ok(name, false, '(no lanzó error)'); }
  catch (e) { ok(name, !pattern || pattern.test(e.message), `→ ${e.message}`); }
};

// --- Simulación mínima de Supabase ---
await db.exec(`
  CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;
  CREATE SCHEMA auth;
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
    $$ SELECT nullif(current_setting('test.uid', true), '')::uuid $$;
  GRANT USAGE ON SCHEMA auth TO anon, authenticated;
  GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
  GRANT USAGE ON SCHEMA public TO anon, authenticated;
`);
for (const archivo of migraciones) {
  await db.exec(readFileSync(join(carpeta, archivo), 'utf8'));
}
console.log(`${migraciones.length} migración(es) aplicada(s) sin errores\n`);

// --- Datos: notaría A (notario, cajero, empleado) y notaría B (cajero) ---
const U = {
  notarioA: '00000000-0000-0000-0000-00000000000a',
  cajeroA:  '00000000-0000-0000-0000-00000000000b',
  emplA:    '00000000-0000-0000-0000-00000000000c',
  cajeroB:  '00000000-0000-0000-0000-00000000000d',
};
const { rows: [A] } = await db.query(`INSERT INTO notarias (codigo, nombre) VALUES ('SQ001','Notaría Santander') RETURNING id`);
const { rows: [B] } = await db.query(`INSERT INTO notarias (codigo, nombre) VALUES ('PO002','Otra notaría') RETURNING id`);
await db.query(`INSERT INTO usuarios VALUES ($1,$2,'Cano','notario',true),($3,$2,'Caja 1','cajero',true),($4,$2,'Ventanilla','empleado',true),($5,$6,'Caja B','cajero',true)`,
  [U.notarioA, A.id, U.cajeroA, U.emplA, U.cajeroB, B.id]);

const as = async (uid) => { await db.exec(`RESET ROLE; SET test.uid = '${uid}'; SET ROLE authenticated;`); };
const asAdmin = async () => { await db.exec(`RESET ROLE; SET test.uid = '';`); };

// 1. Radicación y consecutivos
await as(U.emplA);
const { rows: [{ radicar_tramite: t1 }] } = await db.query(`SELECT radicar_tramite('Escritura compraventa')`);
const { rows: [{ radicar_tramite: t2 }] } = await db.query(`SELECT radicar_tramite('Autenticación')`);
const { rows: rads } = await db.query(`SELECT radicado, codigo_consulta FROM tramites ORDER BY radicado`);
ok('Radicados consecutivos y únicos', rads[0].radicado.endsWith('-000001') && rads[1].radicado.endsWith('-000002'), rads.map(r => r.radicado).join(', '));
ok('Código de consulta aleatorio de 10 caracteres', rads[0].codigo_consulta.length === 10 && rads[0].codigo_consulta !== rads[1].codigo_consulta);

// Liquidación (la calcularía el sistema desde el tarifario; aquí la siembra el administrador)
await asAdmin();
await db.query(`INSERT INTO liquidacion_items (notaria_id, tramite_id, concepto, tipo, valor) VALUES
  ($1,$2,'Derechos notariales','derechos',250000),($1,$2,'IVA 19%','iva',47500),($1,$2,'Aporte','aporte',12000)`, [A.id, t1]);

// 2. Escritura directa bloqueada para todos los roles de la app
await as(U.cajeroA);
await expectError('Cajero NO puede insertar pagos directo', `INSERT INTO pagos (notaria_id,tramite_id,sesion_caja_id,registrado_por,tipo,monto,metodo,factura_sin) VALUES ($1,$2,gen_random_uuid(),$3,'pago',1,'efectivo','X')`, [A.id, t1, U.cajeroA], /permission denied/);
await expectError('Cajero NO puede insertar liquidación directo', `INSERT INTO liquidacion_items (notaria_id,tramite_id,concepto,tipo,valor) VALUES ($1,$2,'x','otro',1)`, [A.id, t1], /permission denied/);

// 3. Cobro sin caja abierta
await expectError('No se cobra sin caja abierta', `SELECT registrar_pago($1,'efectivo','SETT-1001')`, [t1], /abra su caja/);

// 4. Flujo normal
await db.query(`SELECT abrir_caja(100000)`);
await expectError('Monto mayor al saldo rechazado', `SELECT registrar_pago($1,'efectivo','SETT-1001', 999999999)`, [t1], /monto inválido/);
const { rows: [{ registrar_pago: p1 }] } = await db.query(`SELECT registrar_pago($1,'efectivo','SETT-1001')`, [t1]);
const { rows: [pago] } = await db.query(`SELECT monto FROM pagos WHERE id = $1`, [p1]);
ok('El monto sale de la liquidación, no del cajero', Number(pago.monto) === 309500, `monto=${pago.monto}`);
await expectError('Trámite sin saldo no se cobra dos veces', `SELECT registrar_pago($1,'efectivo','SETT-1002')`, [t1], /no tiene saldo/);
await expectError('Cobro sin liquidación rechazado', `SELECT registrar_pago($1,'efectivo','SETT-1003')`, [t2], /no tiene saldo/);

// 5. Inmutabilidad vía API
await expectError('Cajero NO puede editar un pago', `UPDATE pagos SET monto = 1 WHERE id = $1`, [p1], /permission denied/);
await expectError('Cajero NO puede borrar un pago', `DELETE FROM pagos WHERE id = $1`, [p1], /permission denied/);
await expectError('Cajero NO puede tocar el audit log', `DELETE FROM audit_log`, [], /permission denied/);
await expectError('Cajero NO puede reversar', `SELECT reversar_pago($1,'error')`, [p1], /solo el notario/);
await expectError('Cajero NO puede llamar funciones internas', `SELECT siguiente_radicado($1)`, [A.id], /permission denied/);

// 6. Visibilidad por rol y por notaría
const { rows: logCajero } = await db.query(`SELECT count(*)::int n FROM audit_log`);
ok('Cajero no ve el audit log', logCajero[0].n === 0);
await as(U.cajeroB);
const { rows: [{ n: pagosB }] } = await db.query(`SELECT count(*)::int n FROM pagos`);
ok('Notaría B no ve pagos de la notaría A', pagosB === 0);
await db.query(`SELECT abrir_caja(0)`);
await expectError('Notaría B no puede cobrar trámites de A', `SELECT registrar_pago($1,'efectivo','X-1')`, [t1], /no encontrado/);
await as(U.notarioA);
const { rows: [{ n: logNotario }] } = await db.query(`SELECT count(*)::int n FROM audit_log`);
ok('Notario sí ve el audit log', logNotario > 0, `${logNotario} eventos`);

// 7. Reverso autorizado
const { rows: [{ reversar_pago: r1 }] } = await db.query(`SELECT reversar_pago($1,'Cobro duplicado por error')`, [p1]);
await expectError('Un pago no se reversa dos veces', `SELECT reversar_pago($1,'otra vez')`, [p1], /duplicate key|unique/);
await as(U.cajeroA);
const { rows: [{ registrar_pago: p2 }] } = await db.query(`SELECT registrar_pago($1,'efectivo','SETT-1004')`, [t1]);
ok('Tras el reverso el saldo vuelve a cobrarse', !!p2);

// 8. Arqueo ciego
await db.query(`SELECT cerrar_caja(400000)`);   // base 100.000 + 309.500 − 309.500 + 309.500 = 409.500 esperado
const { rows: [s] } = await db.query(`SELECT efectivo_esperado, efectivo_contado, diferencia FROM sesiones_caja WHERE cajero_id = $1`, [U.cajeroA]);
ok('Arqueo calcula esperado y diferencia en el servidor', Number(s.efectivo_esperado) === 409500 && Number(s.diferencia) === -9500, `esperado=${s.efectivo_esperado} diferencia=${s.diferencia}`);
await expectError('Cajero NO puede editar su arqueo', `UPDATE sesiones_caja SET efectivo_contado = 409500`, [], /permission denied/);
await expectError('Cajero NO puede aprobar', `SELECT aprobar_sesion(gen_random_uuid())`, [], /solo el notario/);

// 9. Cadena de hash
await asAdmin();
const { rows: [{ verificar_cadena: v1 }] } = await db.query(`SELECT verificar_cadena($1)`, [A.id]);
ok('Cadena íntegra antes de manipular', v1 === null);
const { rows: [{ sello_del_dia: sello }] } = await db.query(`SELECT sello_del_dia($1, (now() AT TIME ZONE 'America/Bogota')::date)`, [A.id]);
ok('Sello del día disponible', /^[0-9a-f]{64}$/.test(sello), sello.slice(0, 16) + '…');
// Un administrador con acceso total altera un evento pasado...
await db.query(`UPDATE audit_log SET despues = jsonb_set(despues, '{monto}', '1') WHERE seq = (SELECT min(seq) FROM audit_log WHERE tabla = 'pagos' AND notaria_id = $1)`, [A.id]);
const { rows: [{ verificar_cadena: v2 }] } = await db.query(`SELECT verificar_cadena($1)`, [A.id]);
ok('Manipulación del log detectada', v2 !== null, `eslabón roto en seq ${v2}`);
// ...y aunque recalcule los hashes de toda la cadena, el sello que ya está en el correo de Cano no coincide.
await db.exec(`
  DO $$ DECLARE r record; v_prev text; BEGIN
    FOR r IN SELECT * FROM public.audit_log WHERE notaria_id = '${A.id}' ORDER BY seq LOOP
      UPDATE public.audit_log SET hash_anterior = v_prev,
        hash = public.calcular_hash(v_prev, r.tabla, r.accion, r.registro_id, r.usuario_id, r.antes, r.despues, r.creado_en)
       WHERE seq = r.seq RETURNING hash INTO v_prev;
    END LOOP; END $$;`);
const { rows: [{ sello_del_dia: sello2 }] } = await db.query(`SELECT sello_del_dia($1, (now() AT TIME ZONE 'America/Bogota')::date)`, [A.id]);
ok('Reescribir toda la cadena cambia el sello enviado', sello2 !== sello);

// 10. Zona horaria
const { rows: [{ d }] } = await db.query(`SELECT (('2026-10-21 01:30:00+00'::timestamptz) AT TIME ZONE 'America/Bogota')::date::text AS d`);
ok('Un pago a las 8:30 p. m. de Bogotá cuenta para ese día', d === '2026-10-20', d);

console.log(`\n${pass} pruebas pasaron, ${fail} fallaron`);
process.exit(fail ? 1 : 0);
