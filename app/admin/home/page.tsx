'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  MessageSquare,
  Settings,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { RequireAuth } from '@/components/require-auth';
import { ThemeToggle } from '@/components/theme-toggle';
import { supabase } from '@/lib/supabase';
import type { Match } from '@/lib/types';

interface LastMatchSummary {
  match: Match;
  date: string;
}

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
  const [activePlayers, setActivePlayers] = useState<number | null>(null);
  const [topNames, setTopNames] = useState<string[]>([]);
  const [lastMatch, setLastMatch] = useState<LastMatchSummary | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) router.replace('/jogador');
  }, [loading, isAdmin, router]);

  useEffect(() => {
    if (loading || !isAdmin) return;

    (async () => {
      const { data: players } = await supabase
        .from('players')
        .select('name')
        .eq('active', true)
        .order('name');

      setActivePlayers(players?.length ?? 0);
      setTopNames((players ?? []).slice(0, 5).map((p) => p.name));

      const { data: match } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'FINISHED')
        .order('played_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (match) {
        setLastMatch({
          match: match as Match,
          date: new Date(match.played_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
          }),
        });
      }
    })();
  }, [loading, isAdmin]);

  if (loading || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-text-secondary">
        Carregando…
      </main>
    );
  }

  const canStartMatch = (activePlayers ?? 0) >= 4;

  return (
    <main className="min-h-screen bg-background text-text-primary">
      <header className="sticky top-0 z-10 border-b border-surface-border/40 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary transition hover:text-accent-bright"
          >
            <ArrowLeft className="size-4" /> Trocar perfil
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl px-4 py-6 space-y-6">
        <section className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            Painel do Administrador
          </p>
          <h1 className="text-3xl font-bold">Pronto para o apito? 🛡️</h1>
        </section>

        <HeroNovaPartida
          activePlayers={activePlayers}
          canStart={canStartMatch}
        />

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Elenco ativo"
            value={activePlayers !== null ? `${activePlayers}` : '…'}
            sublabel="jogadores"
            icon={<Users className="size-5" />}
          />
          <StatCard
            label="Última partida"
            value={lastMatch ? `${lastMatch.match.score_a} × ${lastMatch.match.score_b}` : '—'}
            sublabel={lastMatch ? lastMatch.date : 'Nenhuma ainda'}
            icon={<Trophy className="size-5" />}
          />
          <StatCard
            label="Status"
            value={canStartMatch ? 'OK' : '—'}
            sublabel={canStartMatch ? 'Pronto p/ sortear' : 'Mínimo 4'}
            icon={<Sparkles className="size-5" />}
            tone={canStartMatch ? 'accent' : 'muted'}
          />
          <StatCard
            label="Hoje"
            value={new Date().toLocaleDateString('pt-BR', { day: '2-digit' })}
            sublabel={new Date().toLocaleDateString('pt-BR', { month: 'short' })}
            icon={<Calendar className="size-5" />}
          />
        </section>

        {topNames.length > 0 && (
          <section className="rounded-2xl border border-surface-border bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-text-secondary">
                Elenco em destaque
              </h2>
              <Link
                href="/elenco"
                className="text-xs font-semibold text-accent transition hover:text-accent-bright"
              >
                Ver todos →
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {topNames.map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-surface-border bg-background/60 px-3 py-1 text-xs font-medium"
                >
                  {name}
                </span>
              ))}
              {(activePlayers ?? 0) > topNames.length && (
                <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                  +{(activePlayers ?? 0) - topNames.length} mais
                </span>
              )}
            </div>
          </section>
        )}

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MenuCard
            href="/ranking"
            icon={<Trophy className="size-7 text-accent" />}
            title="Ranking"
            description="Líderes"
          />
          <MenuCard
            href="/historico-publico"
            icon={<Calendar className="size-7 text-accent-secondary" />}
            title="Histórico"
            description="Resultados"
          />
          <MenuCard
            href="/simulador"
            icon={<Sparkles className="size-7 text-amber-500" />}
            title="Simulador"
            description="Pré-jogo"
          />
          <MenuCard
            href="/admin"
            icon={<Settings className="size-7 text-text-muted" />}
            title="Ajustes"
            description="Painel Pro"
          />
        </section>
      </div>
    </main>
  );
}

function HeroNovaPartida({
  activePlayers,
  canStart,
}: {
  activePlayers: number | null;
  canStart: boolean;
}) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/15 via-surface to-accent-secondary/10 p-6 shadow-accent"
    >
      <div className="absolute -right-12 -top-12 size-40 rounded-full bg-accent/20 blur-3xl" />
      <div className="absolute -bottom-12 -left-12 size-40 rounded-full bg-accent-secondary/20 blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
            <Sparkles className="size-3.5" /> Pelada de hoje
          </span>
          <h2 className="text-2xl font-bold sm:text-3xl">Nova Partida</h2>
          <p className="text-sm text-text-secondary">
            {canStart
              ? 'Check-in dos jogadores e sorteio em segundos.'
              : 'Cadastre pelo menos 4 jogadores ativos para começar.'}
          </p>
        </div>

        {canStart ? (
          <Link
            href="/partida/nova"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-bright px-6 py-3 font-bold text-black shadow-accent transition hover:scale-[1.02] hover:shadow-lg active:scale-95"
          >
            Começar
            <ArrowRight className="size-5" />
          </Link>
        ) : (
          <Link
            href="/elenco"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-accent/40 bg-surface/60 px-6 py-3 font-bold text-text-primary transition hover:border-accent active:scale-95"
          >
            <Users className="size-5" /> Ir ao Elenco
          </Link>
        )}
      </div>

      {activePlayers !== null && (
        <p className="relative mt-4 text-xs font-medium uppercase tracking-widest text-text-secondary">
          {activePlayers} jogador{activePlayers === 1 ? '' : 'es'} ativo
          {activePlayers === 1 ? '' : 's'}
        </p>
      )}
    </section>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  icon,
  tone = 'default',
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon: React.ReactNode;
  tone?: 'default' | 'accent' | 'muted';
}) {
  const toneClasses =
    tone === 'accent'
      ? 'border-accent/40 bg-accent/5'
      : tone === 'muted'
        ? 'border-surface-border bg-surface/40 opacity-70'
        : 'border-surface-border bg-surface';

  return (
    <div className={`rounded-2xl border p-3 transition ${toneClasses}`}>
      <div className="mb-1.5 flex items-center justify-between text-text-secondary">
        <span className="text-[10px] font-semibold uppercase tracking-widest">
          {label}
        </span>
        {icon}
      </div>
      <div className="text-xl font-bold leading-tight">{value}</div>
      {sublabel && (
        <div className="mt-0.5 text-xs text-text-secondary">{sublabel}</div>
      )}
    </div>
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
      className="group flex items-center gap-3 rounded-2xl border border-surface-border bg-surface p-4 transition hover:scale-[1.02] hover:border-accent hover:shadow-premium"
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-background/60 transition group-hover:scale-105">
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold leading-tight">{title}</h3>
        <p className="truncate text-xs text-text-secondary">{description}</p>
      </div>
    </Link>
  );
}
