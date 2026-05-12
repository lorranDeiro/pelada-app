'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Dice5, Users, Hand } from 'lucide-react';
import { toast } from 'sonner';
import { AppNav } from '@/components/app-nav';
import { RequireAuth } from '@/components/require-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ManualTeamSelector } from '@/components/manual-team-selector';
import {
  fetchActivePlayers,
  fetchAllTimeRankedPlayers,
  fetchPlayerSeasonStatsRows,
  fetchRankedPlayers,
} from '@/lib/players';
import { getOrCreateActiveSeason } from '@/lib/season';
import { supabase } from '@/lib/supabase';
import { balanceTeams, type BalancedTeams } from '@/lib/team-balancer';
import { WinProbabilityBar } from '@/components/win-probability-bar';
import { OddsBadge } from '@/components/odds-badge';
import { DraftLoadingOverlay } from '@/components/draft-loading-overlay';
import { TeamDrawAnimator } from '@/components/team-draw-animator';
import { buildOddsContext, computePlayerOdds, type OddsContext } from '@/lib/player-odds';
import type { Player, RankedPlayer } from '@/lib/types';

type Step =
  | 'checkin'
  | 'modo-selecao'
  | 'formacao-manual'
  | 'draft-loading'
  | 'reveal'
  | 'sorteio';

export default function NovaPartidaPage() {
  return (
    <RequireAuth>
      <AppNav />
      <NovaPartidaContent />
    </RequireAuth>
  );
}

function NovaPartidaContent() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<Step>('checkin');
  const [teams, setTeams] = useState<BalancedTeams | null>(null);
  const [rankedPlayers, setRankedPlayers] = useState<RankedPlayer[] | null>(null);
  const [oddsCtx, setOddsCtx] = useState<OddsContext | null>(null);
  const [seed, setSeed] = useState(42);
  const [confirming, setConfirming] = useState(false);
  const [dataSource, setDataSource] = useState<'current-season' | 'all-time'>('current-season');

  useEffect(() => {
    fetchActivePlayers()
      .then(setPlayers)
      .catch((e) => toast.error('Erro ao carregar jogadores', { description: e.message }));
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function proceedToModeSelection() {
    try {
      const season = await getOrCreateActiveSeason();
      const ids = Array.from(selected);
      const [ranked, statsRows] = await Promise.all([
        fetchRankedPlayers(season.id, ids),
        fetchPlayerSeasonStatsRows(season.id, ids),
      ]);
      setRankedPlayers(ranked);
      setOddsCtx(buildOddsContext(statsRows));
      setStep('modo-selecao');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido';
      toast.error('Erro ao carregar', { description: msg });
    }
  }

  async function sortear(newSeed = seed) {
    if (!rankedPlayers) return;
    try {
      // Quando o admin escolhe "Ranking Global", buscamos os mesmos
      // jogadores agregados sobre TODAS as temporadas (via view unificada).
      const playersForBalance =
        dataSource === 'all-time'
          ? await fetchAllTimeRankedPlayers(rankedPlayers.map((p) => p.id))
          : rankedPlayers;
      const result = balanceTeams(playersForBalance, { seed: newSeed });
      setTeams(result);
      setSeed(newSeed);
      // Loading hype primeiro, reveal depois, preview interativo no fim.
      setStep('draft-loading');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido';
      toast.error('Erro no sorteio', { description: msg });
    }
  }

  async function confirmarSorteio() {
    if (!teams) return;
    setConfirming(true);
    try {
      const season = await getOrCreateActiveSeason();

      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({
          season_id: season.id,
          played_at: new Date().toISOString().slice(0, 10),
          status: 'DRAFT',
        })
        .select()
        .single();
      if (matchError || !match) throw matchError ?? new Error('Falha ao criar partida');

      const attendances = [
        ...teams.teamA.map((p) => ({ match_id: match.id, player_id: p.id, team: 1 })),
        ...teams.teamB.map((p) => ({ match_id: match.id, player_id: p.id, team: 2 })),
      ];
      const { error: attErr } = await supabase.from('match_attendances').insert(attendances);
      if (attErr) throw attErr;

      const gkShifts = [
        ...teams.teamA
          .filter((p) => p.position === 'GOLEIRO_FIXO')
          .map((p) => ({ match_id: match.id, team: 1, player_id: p.id })),
        ...teams.teamB
          .filter((p) => p.position === 'GOLEIRO_FIXO')
          .map((p) => ({ match_id: match.id, team: 2, player_id: p.id })),
      ];
      if (gkShifts.length > 0) {
        const { error: gkErr } = await supabase.from('gk_shifts').insert(gkShifts);
        if (gkErr) throw gkErr;
      }

      toast.success('Partida criada!');
      router.push(`/partida/${match.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido';
      toast.error('Erro ao confirmar', { description: msg });
    } finally {
      setConfirming(false);
    }
  }

  async function confirmarManual(teamA: RankedPlayer[], teamB: RankedPlayer[]) {
    setConfirming(true);
    try {
      const season = await getOrCreateActiveSeason();

      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({
          season_id: season.id,
          played_at: new Date().toISOString().slice(0, 10),
          status: 'DRAFT',
        })
        .select()
        .single();
      if (matchError || !match) throw matchError ?? new Error('Falha ao criar partida');

      const attendances = [
        ...teamA.map((p) => ({ match_id: match.id, player_id: p.id, team: 1 })),
        ...teamB.map((p) => ({ match_id: match.id, player_id: p.id, team: 2 })),
      ];
      const { error: attErr } = await supabase.from('match_attendances').insert(attendances);
      if (attErr) throw attErr;

      const gkShifts = [
        ...teamA
          .filter((p) => p.position === 'GOLEIRO_FIXO')
          .map((p) => ({ match_id: match.id, team: 1, player_id: p.id })),
        ...teamB
          .filter((p) => p.position === 'GOLEIRO_FIXO')
          .map((p) => ({ match_id: match.id, team: 2, player_id: p.id })),
      ];
      if (gkShifts.length > 0) {
        const { error: gkErr } = await supabase.from('gk_shifts').insert(gkShifts);
        if (gkErr) throw gkErr;
      }

      toast.success('Partida criada com montagem manual!');
      router.push(`/partida/${match.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido';
      toast.error('Erro ao confirmar', { description: msg });
    } finally {
      setConfirming(false);
    }
  }

  if (players === null) {
    return (
      <main className="p-4 text-sm text-muted-foreground">Carregando jogadores…</main>
    );
  }

  if (players.length < 4) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-4">
        <Card>
          <CardContent className="py-8 text-center text-sm">
            <p className="mb-3">
              Você precisa de pelo menos 4 jogadores ativos para sortear times.
            </p>
            <Link href="/elenco" className="underline">
              Ir para o Elenco →
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (step === 'modo-selecao') {
    return (
      <ModeSelection
        playerCount={selected.size}
        dataSource={dataSource}
        onDataSourceChange={setDataSource}
        onManual={() => setStep('formacao-manual')}
        onAutomatic={() => sortear(seed)}
        onBack={() => setStep('checkin')}
      />
    );
  }

  if (step === 'draft-loading') {
    return <DraftLoadingOverlay onDone={() => setStep('reveal')} />;
  }

  if (step === 'reveal' && teams && oddsCtx) {
    return (
      <TeamDrawAnimator
        teams={teams}
        oddsCtx={oddsCtx}
        onComplete={() => setStep('sorteio')}
      />
    );
  }

  if (step === 'sorteio' && teams) {
    return (
      <TeamsPreview
        teams={teams}
        oddsCtx={oddsCtx}
        onBack={() => setStep('modo-selecao')}
        onReshuffle={() => sortear(seed + 1)}
        onConfirm={confirmarSorteio}
        confirming={confirming}
      />
    );
  }

  if (step === 'formacao-manual' && rankedPlayers) {
    return (
      <main className="mx-auto w-full max-w-7xl flex-1 p-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep('modo-selecao')}
            disabled={confirming}
            className="mb-4"
          >
            <ArrowLeft className="size-4" /> Voltar
          </Button>
        </div>
        <ManualTeamSelector
          players={rankedPlayers}
          oddsCtx={oddsCtx ?? undefined}
          onSave={confirmarManual}
          isLoading={confirming}
        />
      </main>
    );
  }

  return (
    <CheckIn
      players={players}
      selected={selected}
      onToggle={toggle}
      onProceed={() => proceedToModeSelection()}
    />
  );
}

function CheckIn({
  players,
  selected,
  onToggle,
  onProceed,
}: {
  players: Player[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onProceed: () => void;
}) {
  const canProceed = selected.size >= 4;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Check-in</h1>
        <Badge variant={canProceed ? 'default' : 'outline'}>
          <Users className="mr-1 size-3" />
          {selected.size} presentes
        </Badge>
      </div>

      <ul className="space-y-2">
        {players.map((p) => {
          const on = selected.has(p.id);
          return (
            <li key={p.id}>
              <label className="block cursor-pointer">
                <Card className={on ? 'border-foreground' : ''}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <Checkbox checked={on} onCheckedChange={() => onToggle(p.id)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{p.name}</span>
                        {p.position === 'GOLEIRO_FIXO' && (
                          <Badge variant="secondary">🧤</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {'★'.repeat(p.skill_level) + '☆'.repeat(5 - p.skill_level)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="fixed inset-x-0 bottom-0 border-t bg-background p-3">
        <div className="mx-auto max-w-3xl">
          <Button className="w-full" size="lg" disabled={!canProceed} onClick={onProceed}>
            <Users className="size-4" /> Continuar ({selected.size})
          </Button>
        </div>
      </div>
    </main>
  );
}

function ModeSelection({
  playerCount,
  dataSource,
  onDataSourceChange,
  onManual,
  onAutomatic,
  onBack,
}: {
  playerCount: number;
  dataSource: 'current-season' | 'all-time';
  onDataSourceChange: (source: 'current-season' | 'all-time') => void;
  onManual: () => void;
  onAutomatic: () => void;
  onBack: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
        <ArrowLeft className="size-4" /> Voltar
      </Button>

      <div className="space-y-3">
        <h2 className="text-3xl font-bold text-text-primary">Como montar as equipas?</h2>
        <p className="text-text-secondary">
          Escolha entre sorteio automático balanceado ou montagem manual.
        </p>
      </div>

      {/* Data Source Toggle */}
      <Card className="p-4 bg-accent/5 border-accent/20">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-text-primary flex items-center gap-2">
            📊 Base de dados para balanceamento
          </label>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={dataSource === 'current-season' ? 'default' : 'outline'}
              onClick={() => onDataSourceChange('current-season')}
              className="flex-1"
            >
              ⏱️ Temporada Atual
            </Button>
            <Button
              size="sm"
              variant={dataSource === 'all-time' ? 'default' : 'outline'}
              onClick={() => onDataSourceChange('all-time')}
              className="flex-1"
            >
              🌍 Ranking Global
            </Button>
          </div>
          <p className="text-xs text-text-secondary">
            {dataSource === 'current-season'
              ? 'Usando notas da temporada atual (mais recente)'
              : 'Usando dados acumulados de todas as temporadas'}
          </p>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Sorteio Automático */}
        <Card className="group cursor-pointer border-surface-border hover:border-accent/50 hover:bg-surface-hover transition">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <Dice5 className="w-5 h-5 text-accent" />
                  Sorteio Automático
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  Algoritmo balanceado por força
                </p>
              </div>
              <Badge variant="outline" className="bg-accent/10">⚡ Rápido</Badge>
            </div>

            <div className="space-y-2 text-sm text-text-secondary">
              <p>✓ Equipas equilibradas</p>
              <p>✓ Distribui goleiros</p>
              <p>✓ Reshuffle ilimitado</p>
            </div>

            <Button
              onClick={onAutomatic}
              className="w-full bg-gradient-to-r from-accent to-accent-bright hover:from-accent-bright hover:to-accent text-black font-bold"
            >
              Sortear ({playerCount})
            </Button>
          </CardContent>
        </Card>

        {/* Montagem Manual */}
        <Card className="group cursor-pointer border-surface-border hover:border-accent-secondary/50 hover:bg-surface-hover transition">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <Hand className="w-5 h-5 text-accent-secondary" />
                  Montagem Manual
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  Controle total da formação
                </p>
              </div>
              <Badge variant="outline" className="bg-accent-secondary/10">🎯 Preciso</Badge>
            </div>

            <div className="space-y-2 text-sm text-text-secondary">
              <p>✓ Arraste os jogadores</p>
              <p>✓ Trocar entre equipas</p>
              <p>✓ Ajustes de última hora</p>
            </div>

            <Button
              onClick={onManual}
              variant="outline"
              className="w-full border-accent-secondary text-accent-secondary hover:bg-accent-secondary/10"
            >
              Montar ({playerCount})
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function TeamsPreview({
  teams,
  oddsCtx,
  onBack,
  onReshuffle,
  onConfirm,
  confirming,
}: {
  teams: BalancedTeams;
  oddsCtx: OddsContext | null;
  onBack: () => void;
  onReshuffle: () => void;
  onConfirm: () => void;
  confirming: boolean;
}) {
  const gap = useMemo(
    () => Math.abs(teams.debug.strengthA - teams.debug.strengthB),
    [teams]
  );

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} disabled={confirming}>
          <ArrowLeft className="size-4" /> Voltar
        </Button>
        <Badge variant="outline">gap {gap.toFixed(2)}</Badge>
      </div>

      <WinProbabilityBar
        strengthA={teams.debug.strengthA}
        strengthB={teams.debug.strengthB}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <TeamCard
          name="Escuros"
          players={teams.teamA}
          strength={teams.debug.strengthA}
          oddsCtx={oddsCtx}
        />
        <TeamCard
          name="Coloridos"
          players={teams.teamB}
          strength={teams.debug.strengthB}
          oddsCtx={oddsCtx}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t bg-background p-3">
        <div className="mx-auto flex max-w-3xl gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onReshuffle}
            disabled={confirming}
          >
            <Dice5 className="size-4" /> Re-sortear
          </Button>
          <Button className="flex-1" onClick={onConfirm} disabled={confirming}>
            {confirming ? 'Criando…' : 'Confirmar'}
          </Button>
        </div>
      </div>
    </main>
  );
}

function TeamCard({
  name,
  players,
  strength,
  oddsCtx,
}: {
  name: string;
  players: RankedPlayer[];
  strength: number;
  oddsCtx: OddsContext | null;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">{name}</h2>
          <span className="text-xs text-muted-foreground">
            força {strength.toFixed(1)}
          </span>
        </div>
        <ul className="space-y-2 text-sm">
          {players.map((p) => {
            const odds = oddsCtx
              ? computePlayerOdds(
                  p,
                  players.filter((x) => x.id !== p.id),
                  oddsCtx
                )
              : null;
            return (
              <li key={p.id} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    {p.position === 'GOLEIRO_FIXO' && <span>🧤</span>}
                    <span className="truncate">{p.name}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {'★'.repeat(p.skill_level)}
                  </span>
                </div>
                {odds && (
                  <div className="flex flex-wrap gap-1">
                    <OddsBadge label="Gol" value={odds.goal} tone="goal" />
                    <OddsBadge label="Ass" value={odds.assist} tone="assist" />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
