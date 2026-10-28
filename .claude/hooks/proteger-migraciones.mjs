// Bloquea cualquier edición de una migración que ya existe.
// Las migraciones aplicadas son historia: los cambios van en una migración nueva.
import { existsSync } from 'node:fs';

let entrada = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (parte) => { entrada += parte; });
process.stdin.on('end', () => {
  let ruta = '';
  try {
    const datos = JSON.parse(entrada || '{}');
    ruta = datos?.tool_input?.file_path ?? '';
  } catch {
    process.exit(0); // Entrada inesperada: no bloquear por un error del propio hook.
  }
  const normalizada = ruta.replace(/\\/g, '/');
  if (/\/supabase\/migrations\/[^/]+\.sql$/i.test(normalizada) && existsSync(ruta)) {
    console.error(
      `Bloqueado: ${ruta} es una migración existente y no se edita. ` +
      'Crea una migración nueva con la skill /nueva-migracion.'
    );
    process.exit(2);
  }
  process.exit(0);
});
