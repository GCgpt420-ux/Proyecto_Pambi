/**
 * Auth API Module
 * 
 * Centraliza todas las operaciones de autenticación con Supabase.
 */

import { getSupabaseClient } from './client';

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Registrar nuevo usuario
 */
export async function signUp(data: SignUpData) {
  const supabase = getSupabaseClient();
  
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return authData;
}

/**
 * Iniciar sesión
 */
export async function signIn(data: SignInData) {
  const supabase = getSupabaseClient();
  
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return authData;
}

/**
 * Cerrar sesión
 */
export async function signOut() {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Solicitar reset de contraseña
 */
export async function resetPassword(email: string) {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/update-password`,
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Actualizar contraseña
 */
export async function updatePassword(newPassword: string) {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new Error(error.message);
  }
}
