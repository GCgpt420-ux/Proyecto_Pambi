/**
 * Supabase API Client Wrapper
 * 
 * Centraliza la lógica de acceso a Supabase para mejor mantenibilidad.
 * El código existente en lib/supabase/ sigue funcionando.
 */

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';

/**
 * Cliente base para operaciones en el browser
 */
export function getSupabaseClient() {
  return createBrowserClient();
}

/**
 * Cliente base para operaciones en el servidor
 */
export async function getSupabaseServerClient() {
  return await createServerClient();
}

/**
 * Helper para obtener el usuario actual
 */
export async function getCurrentUser() {
  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  
  return user;
}

/**
 * Helper para verificar autenticación
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}
