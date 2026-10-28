// Cliente de Supabase con la clave service_role: salta RLS.
// Solo lo usan el webhook de WhatsApp (después de validar la firma) y las tareas programadas.
// `server-only` hace fallar el build si algún componente de cliente lo importa.
import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from '@/tipos/database';

const entorno = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

let cliente: SupabaseClient<Database> | undefined;

export function clienteAdmin(): SupabaseClient<Database> {
  if (!cliente) {
    const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = entorno.parse(process.env);
    cliente = createClient<Database>(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return cliente;
}
