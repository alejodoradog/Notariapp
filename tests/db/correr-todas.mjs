// Corre cada archivo *.test.mjs de esta carpeta y falla si alguno falla.
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const carpeta = fileURLToPath(new URL('.', import.meta.url));
const archivos = readdirSync(carpeta).filter((f) => f.endsWith('.test.mjs')).sort();
let fallidos = 0;
for (const archivo of archivos) {
  console.log(`\n=== ${archivo} ===`);
  const r = spawnSync(process.execPath, [join(carpeta, archivo)], { stdio: 'inherit' });
  if (r.status !== 0) fallidos++;
}
console.log(`\n${archivos.length - fallidos} de ${archivos.length} archivos de prueba en verde`);
process.exit(fallidos ? 1 : 0);
