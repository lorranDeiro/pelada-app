'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Settings, Trophy } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { RequireAuth } from '@/components/require-auth';

export default function AdminHomePage() {
  return (
    <RequireAuth>
      <AdminHomeContent />
    </RequireAuth>
  );
}

function AdminHomeContent() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) router.replace('/jogador');
  }, [loading, isAdmin, router]);

  if (loading || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-text-secondary">
        Carregando…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-premium text-text-primary">
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-text-secondary transition hover:text-accent-bright"
        >
          <ArrowLeft className="size-4" /> Trocar perfil
        </Link>

        <header className="mb-10 space-y-2 text-center">
          <h1 className="text-3xl font-bold">Painel do Administrador 🛡️</h1>
          <p className="text-text-secondary">
            Acesso completo ao gerenciamento das peladas
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MenuCard
            href="/ranking"
            icon={<Trophy className="size-10 text-accent" />}
            title="Ranking da Liga"
            description="Estatísticas e posições"
            accent="hover:border-accent"
          />
          <MenuCard
            href="/historico-publico"
            icon={<Calendar className="size-10 text-accent-secondary" />}
            title="Histórico das Partidas"
            description="Resultados e detalhes"
            accent="hover:border-accent-secondary"
          />
          <MenuCard
            href="/admin"
            icon={<Settings className="size-10 text-accent-bright" />}
            title="Painel de Administração"
            description="Elenco, partidas, comentários"
            accent="hover:border-accent-bright"
          />
        </div>
      </div>
    </main>
  );
}

interface MenuCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
}

function MenuCard({ href, icon, title, description, accent }: MenuCardProps) {
  return (
    <Link
      href={href}
      className={`group flex flex-col gap-3 rounded-2xl border border-surface-border bg-surface p-6 transition hover:scale-[1.02] hover:shadow-2xl ${accent}`}
    >
      <div className="flex size-16 items-center justify-center rounded-xl bg-background/60 transition group-hover:scale-105">
        {icon}
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-sm text-text-secondary">{description}</p>
    </Link>
  );
}
