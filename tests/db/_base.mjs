// Base común para las pruebas de base de datos: PostgreSQL embebido (PGlite),
// autenticación de Supabase simulada y todas las migraciones aplicadas en orden.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

export async function prepararBase() {
  const carpeta = fileURLToPath(new URL('../../supabase/migrations/', import.meta.url));
  const db = new PGlite();
  await db.exec(`
    CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('test.uid', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA auth TO anon, authenticated;
    GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
    GRANT USAGE ON SCHEMA public TO anon, authenticated;
  `);
  for (const archivo of readdirSync(carpeta).filter((f) => f.endsWith('.sql')).sort()) {
    await db.exec(readFileSync(join(carpeta, archivo), 'utf8'));
  }

  let pasaron = 0, fallaron = 0;
  const ok = (nombre, condicion, extra = '') => {
    condicion ? pasaron++ : fallaron++;
    console.log(`${condicion ? 'PASS' : 'FAIL'}  ${nombre} ${extra}`);
  };
  const esperaError = async (nombre, sql, params = [], patron) => {
    try { await db.query(sql, params); ok(nombre, false, '(no lanzó error)'); }
    catch (e) { ok(nombre, !patron || patron.test(e.message), `→ ${e.message}`); }
  };
  const como = async (uid) => { await db.exec(`RESET ROLE; SET test.uid = '${uid}'; SET ROLE authenticated;`); };
  const comoAnonimo = async () => { await db.exec(`RESET ROLE; SET test.uid = ''; SET ROLE anon;`); };
  // "Servidor" = webhook o tarea programada con service_role (sin RLS).
  const comoServidor = async () => { await db.exec(`RESET ROLE; SET test.uid = '';`); };
  const terminar = () => {
    console.log(`\n${pasaron} pruebas pasaron, ${fallaron} fallaron`);
    process.exit(fallaron ? 1 : 0);
  };
  return { db, ok, esperaError, como, comoAnonimo, comoServidor, terminar };
}
