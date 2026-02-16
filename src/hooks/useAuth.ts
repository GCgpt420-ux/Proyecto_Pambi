/**
 * useAuth Hook
 * 
 * Hook para manejar autenticación de forma centralizada.
 * Ejemplo de uso futuro, no reemplaza el código actual todavía.
 */

'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/src/lib/api/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();

    // Obtener usuario inicial
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Suscribirse a cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
  };
}
