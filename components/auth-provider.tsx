'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Verificar sessão atual e configurar listener
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!error && data.session) {
          setSession(data.session);
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setLoading(false);
      }
    })();

    // Listener para mudanças de autenticação
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        
        // Se token expirou, fazer logout
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          if (!newSession) {
            router.push('/login');
          }
        }
      }
    );

    return () => {
      subscription?.subscription.unsubscribe();
    };
  }, [router]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{ user: session?.user ?? null, loading, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
