'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setState({ user: null, loading: false, error: error.message });
          return;
        }
        
        setState({ user: session?.user ?? null, loading: false, error: null });
      } catch {
        setState({ user: null, loading: false, error: 'Erro ao verificar autenticação' });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setState({ user: session?.user ?? null, loading: false, error: null });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }));
        return { error };
      }
      
      setState({ user: data.user, loading: false, error: null });
      return { data };
    } catch {
      const errorMessage = 'Erro inesperado ao fazer login';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { error: { message: errorMessage } };
    }
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      
      if (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }));
        return { error };
      }
      
      setState({ user: data.user, loading: false, error: null });
      return { data };
    } catch {
      const errorMessage = 'Erro inesperado ao criar conta';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { error: { message: errorMessage } };
    }
  };

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }));
        return { error };
      }
      
      setState({ user: null, loading: false, error: null });
      return { error: null };
    } catch {
      const errorMessage = 'Erro inesperado ao fazer logout';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { error: { message: errorMessage } };
    }
  };

  const resetPassword = async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }));
        return { error };
      }
      
      setState(prev => ({ ...prev, loading: false, error: null }));
      return { error: null };
    } catch {
      const errorMessage = 'Erro inesperado ao resetar senha';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { error: { message: errorMessage } };
    }
  };

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isAuthenticated: !!state.user
  };
}