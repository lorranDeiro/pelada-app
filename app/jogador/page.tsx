'use client';

import Link from 'next/link';
import { ArrowLeft, Calendar, Trophy } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';

export default function PlayerMenuPage() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-gradient-premium text-text-primary">
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary transition hover:text-accent-bright"
          >
            <ArrowLeft className="size-4" /> Trocar perfil
          </Link>
          {!user && (
            <Link
              href="/login"
              className="text-sm text-text-secondary transition hover:text-accent-bright"
            >
              Entrar →
            </Link>
          )}
        </div>

        <header className="mb-10 space-y-2 text-center">
          <h1 className="text-3xl font-bold">Olá, jogador 👋</h1>
          <p className="text-text-secondary">O que você quer ver hoje?</p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MenuCard
            href="/ranking"
            icon={<Trophy className="size-10 text-accent" />}
            title="Ranking da Liga"
            description="Sua posição e estatísticas da temporada"
            accent="hover:border-accent"
          />
          <MenuCard
            href="/historico-publico"
            icon={<Calendar className="size-10 text-accent-secondary" />}
            title="Histórico das Partidas"
            description="Resultados, MVPs e estatísticas de cada partida"
            accent="hover:border-accent-secondary"
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
