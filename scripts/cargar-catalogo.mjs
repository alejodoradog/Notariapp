// Carga datos/tramites.json en catalogo_tramites como catálogo base (notaria_id NULL).
// Se puede correr varias veces: actualiza por código sin duplicar.
// Uso: npm run cargar:catalogo   (lee .env.local)
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const entorno = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  })
  .parse(process.env);

const texto = z.string().trim().min(1);
const tramite = z.object({
  codigo: z.string().regex(/^[a-z0-9_]+$/),
  nombre: texto,
  sinonimos: z.array(texto),
  descripcion: texto,
  requisitos: z.array(texto).min(1),
  casos_especiales: z.array(texto).default([]),
  notas: z.array(texto).default([]),
  tarifa: z.object({ tipo: z.enum(['fija', 'cuantia', 'opciones', 'gratuito', 'consultar']) }).passthrough(),
  // Regla del proyecto: sin fuente no entra.
  fuentes: z.array(z.url()).min(1),
  validado_por_notaria: z.boolean(),
});
const catalogo = z.object({
  tarifas: z.object({ vigencia_desde: z.iso.date() }).passthrough(),
  tramites: z.array(tramite).min(1),
});

const ruta = new URL('../datos/tramites.json', import.meta.url);
const datos = catalogo.parse(JSON.parse(readFileSync(ruta, 'utf8')));

const codigos = datos.tramites.map((t) => t.codigo);
const repetidos = codigos.filter((c, i) => codigos.indexOf(c) !== i);
if (repetidos.length) throw new Error(`Códigos repetidos en tramites.json: ${repetidos.join(', ')}`);

const filas = datos.tramites.map((t) => ({
  notaria_id: null,
  codigo: t.codigo,
  nombre: t.nombre,
  sinonimos: t.sinonimos,
  descripcion: t.descripcion,
  requisitos: t.requisitos,
  casos_especiales: t.casos_especiales,
  notas: t.notas,
  tarifa: t.tarifa,
  fuentes: t.fuentes,
  validado_por_notaria: t.validado_por_notaria,
  activo: true,
  vigencia_desde: datos.tarifas.vigencia_desde,
}));

const supabase = createClient(entorno.NEXT_PUBLIC_SUPABASE_URL, entorno.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase
  .from('catalogo_tramites')
  .upsert(filas, { onConflict: 'notaria_id,codigo' })
  .select('codigo');
if (error) {
  console.error('No se pudo cargar el catálogo:', error.message);
  process.exit(1);
}
console.log(`Catálogo base cargado: ${data.length} trámites (${data.map((t) => t.codigo).join(', ')})`);
