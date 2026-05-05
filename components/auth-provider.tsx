'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface SignUpParams {
  email: string;
  password: string;
  playerName: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (params: SignUpParams) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!error && data.session) setSession(data.session);
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setLoading(false);
      }
    })();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          if (!newSession) router.push('/login');
        }
      }
    );

    return () => {
      subscription?.subscription.unsubscribe();
    };
  }, [router]);

  // Resolve isAdmin via players.auth_user_id sempre que a sessão mudar.
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from('players')
        .select('is_admin')
        .eq('auth_user_id', userId)
        .maybeSingle();
      if (alive) setIsAdmin(data?.is_admin === true);
    })();
    return () => {
      alive = false;
    };
  }, [session?.user?.id]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async ({ email, password, playerName }: SignUpParams) => {
    // Pre-flight: o nome existe e está disponível?
    const preflight = await supabase.rpc('check_player_name_can_register', {
      p_name: playerName,
    });
    if (preflight.error) {
      return { error: preflight.error.message };
    }
    if (preflight.data !== true) {
      return {
        error:
          'Seu nome não foi encontrado na lista de jogadores. Por favor, aguarde até que o administrador o adicione para realizar seu registro.',
      };
    }

    // Cria conta em auth.users
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpError) return { error: signUpError.message };

    // Sem session significa que email-confirmation está ON no Supabase.
    if (!signUpData.session) {
      return {
        error:
          'Conta criada. Verifique seu email para confirmar e depois entre — o vínculo com o jogador é feito no primeiro login.',
      };
    }

    // Linka auth.uid() ao players row
    const { error: linkError } = await supabase.rpc('link_player_account', {
      p_player_name: playerName,
    });
    if (linkError) {
      // Cleanup ideal: deletar o auth user. Não dá via JS (precisa
      // service_role). Mensagem clara para o usuário e segue o jogo.
      return { error: linkError.message };
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        loading,
        isAdmin,
        signIn,
        signUp,
        signOut,
      }}
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
