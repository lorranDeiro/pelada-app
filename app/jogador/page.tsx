'use client';

import Link from 'next/link';
import { ArrowLeft, Calendar, Trophy, User, Sparkles } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { ThemeToggle } from '@/components/theme-toggle';

export default function PlayerMenuPage() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-background text-text-primary">
      <header className="sticky top-0 z-10 border-b border-surface-border/40 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary transition hover:text-accent-bright"
          >
            <ArrowLeft className="size-4" /> Trocar perfil
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {!user && (
              <Link
                href="/login"
                className="text-sm text-text-secondary transition hover:text-accent-bright"
              >
                Entrar →
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-4 py-12 space-y-10">
        <header className="space-y-3 text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-accent/10 text-accent">
            <User className="size-10" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">Olá, jogador 👋</h1>
            <p className="text-text-secondary">O que você quer ver hoje?</p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MenuCard
            href="/ranking"
            icon={<Trophy className="size-8 text-accent" />}
            title="Ranking"
            description="Stats da Liga"
          />
          <MenuCard
            href="/historico-publico"
            icon={<Calendar className="size-8 text-accent-secondary" />}
            title="Histórico"
            description="Resultados"
          />
          <MenuCard
            href="/simulador"
            icon={<Sparkles className="size-8 text-amber-500" />}
            title="Simulador"
            description="Pré-jogo Pro"
          />
        </div>

        <footer className="pt-10 text-center text-xs text-text-muted">
          Acompanhe o desempenho da liga em tempo real.
        </footer>
      </div>
    </main>
  );
}

function MenuCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-surface-border bg-surface p-6 transition hover:scale-[1.02] hover:border-accent hover:shadow-premium"
    >
      <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-background/60 transition group-hover:scale-110">
        {icon}
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-bold leading-tight">{title}</h2>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
    </Link>
  );
}
