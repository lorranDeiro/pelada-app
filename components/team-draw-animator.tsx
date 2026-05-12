'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlayerAvatar } from '@/components/player-avatar';
import { OddsBadge } from '@/components/odds-badge';
import { WinProbabilityBar } from '@/components/win-probability-bar';
import { computePlayerOdds, type OddsContext } from '@/lib/player-odds';
import type { RankedPlayer } from '@/lib/types';
import type { BalancedTeams } from '@/lib/team-balancer';

// Timings (ms). Tempo total por jogador = ENTER + HOLD + SLIDE.
// Em 16 jogadores: ~24s do começo ao fim. Com botão "Pular" sempre acessível.
const ENTER_MS = 350;
const HOLD_MS = 350;
const SLIDE_MS = 700;
const PER_PLAYER_MS = ENTER_MS + HOLD_MS + SLIDE_MS;

type Phase = 'enter' | 'hold' | 'slide';

interface Props {
  teams: BalancedTeams;
  oddsCtx: OddsContext;
  onComplete: () => void;
}

export function TeamDrawAnimator({ teams, oddsCtx, onComplete }: Props) {
  // Sequência intercalada A, B, A, B, …
  const sequence = useMemo(() => {
    const out: { player: RankedPlayer; team: 1 | 2 }[] = [];
    const n = Math.max(teams.teamA.length, teams.teamB.length);
    for (let i = 0; i < n; i++) {
      if (teams.teamA[i]) out.push({ player: teams.teamA[i], team: 1 });
      if (teams.teamB[i]) out.push({ player: teams.teamB[i], team: 2 });
    }
    return out;
  }, [teams]);

  const total = sequence.length;
  const [index, setIndex] = useState(-1);
  const [phase, setPhase] = useState<Phase>('enter');
  const [skipped, setSkipped] = useState(false);

  // Orquestração de fases.
  useEffect(() => {
    if (skipped) {
      setIndex(total);
      const t = setTimeout(onComplete, 400);
      return () => clearTimeout(t);
    }
    if (index >= total) {
      const t = setTimeout(onComplete, 600);
      return () => clearTimeout(t);
    }
    if (index === -1) {
      const t = setTimeout(() => setIndex(0), 200);
      return () => clearTimeout(t);
    }

    setPhase('enter');
    const toHold = setTimeout(() => setPhase('hold'), ENTER_MS);
    const toSlide = setTimeout(() => setPhase('slide'), ENTER_MS + HOLD_MS);
    const toNext = setTimeout(() => setIndex((i) => i + 1), PER_PLAYER_MS);
    return () => {
      clearTimeout(toHold);
      clearTimeout(toSlide);
      clearTimeout(toNext);
    };
  }, [index, total, skipped, onComplete]);

  // Quem já aterrissou em cada lane (todos os índices < index, OU tudo se skipped).
  const { placedA, placedB } = useMemo(() => {
    const a: RankedPlayer[] = [];
    const b: RankedPlayer[] = [];
    const limit = skipped ? total : Math.max(0, index);
    for (let i = 0; i < limit; i++) {
      const s = sequence[i];
      if (s.team === 1) a.push(s.player);
      else b.push(s.player);
    }
    return { placedA: a, placedB: b };
  }, [sequence, index, skipped, total]);

  const current =
    !skipped && index >= 0 && index < total ? sequence[index] : null;
  const showCenter = current !== null && phase !== 'slide';
  const slideDir = current?.team === 1 ? 'left' : 'right';

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-3 p-4 pb-24">
      <header className="flex items-center justify-between">
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          Sorteando {Math.min(index + 1, total)} / {total}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSkipped(true)}
          disabled={skipped || index >= total}
          className="text-xs"
        >
          Pular animação →
        </Button>
      </header>

      {/* Top: Lane esquerda | Card central | Lane direita */}
      <div className="relative grid grid-cols-[1fr_auto_1fr] items-start gap-2 sm:gap-4">
        <Lane align="right" players={placedA} accent="slate" label="Escuros" />

        <div className="relative h-44 w-32 shrink-0 sm:h-52 sm:w-40">
          {current && (
            <CenterCard
              key={`${current.player.id}-${index}`}
              player={current.player}
              team={current.team}
              phase={phase}
              show={showCenter}
              slideDir={slideDir}
            />
          )}
        </div>

        <Lane align="left" players={placedB} accent="pink" label="Coloridos" />
      </div>

      <WinProbabilityBar
        strengthA={teams.debug.strengthA}
        strengthB={teams.debug.strengthB}
      />

      {/* Detalhes embaixo — colunas existentes, mas só com jogadores já placed */}
      <div className="grid gap-3 sm:grid-cols-2">
        <DetailColumn
          name="Escuros"
          accent="slate"
          allPlayers={teams.teamA}
          placedPlayers={placedA}
          oddsCtx={oddsCtx}
        />
        <DetailColumn
          name="Coloridos"
          accent="pink"
          allPlayers={teams.teamB}
          placedPlayers={placedB}
          oddsCtx={oddsCtx}
        />
      </div>
    </main>
  );
}

/* ============================================================ */
/* Lane: linha horizontal de escudos pequenos                   */
/* ============================================================ */

interface LaneProps {
  align: 'left' | 'right';
  players: RankedPlayer[];
  accent: 'slate' | 'pink';
  label: string;
}

function Lane({ align, players, accent, label }: LaneProps) {
  const ring = accent === 'slate' ? 'ring-slate-500' : 'ring-pink-500';
  const dot = accent === 'slate' ? 'bg-slate-500' : 'bg-pink-500';

  return (
    <div
      className={cn(
        'flex min-h-[112px] flex-wrap items-start gap-2 rounded-lg p-2',
        align === 'right' ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'flex w-full items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground',
          align === 'right' ? 'justify-end' : 'justify-start'
        )}
      >
        <span className={cn('inline-block size-1.5 rounded-full', dot)} />
        {label} · {players.length}
      </div>
      {players.map((p) => (
        <div
          key={p.id}
          className="flex animate-in fade-in zoom-in-50 flex-col items-center gap-1 duration-300"
        >
          <div className={cn('rounded-full ring-2 ring-offset-1 ring-offset-background', ring)}>
            <PlayerAvatar name={p.name} photoUrl={p.photo_url} size={36} />
          </div>
          <span className="max-w-[60px] truncate text-center text-[10px] text-muted-foreground">
            {p.name.split(' ')[0]}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ============================================================ */
/* CenterCard: o "escudo grande" que aparece e desliza          */
/* ============================================================ */

interface CenterCardProps {
  player: RankedPlayer;
  team: 1 | 2;
  phase: Phase;
  show: boolean;
  slideDir: 'left' | 'right';
}

function CenterCard({ player, team, phase, show, slideDir }: CenterCardProps) {
  const teamRing = team === 1 ? 'ring-slate-500' : 'ring-pink-500';
  const teamBorder = team === 1 ? 'border-slate-500/60' : 'border-pink-500/60';
  const teamGlow =
    team === 1
      ? 'shadow-[0_0_30px_rgba(100,116,139,0.5)]'
      : 'shadow-[0_0_30px_rgba(236,72,153,0.5)]';

  // 3 estados visuais:
  // - enter: vem do tamanho zero pro 100% (scale-in + fade-in)
  // - hold:  parado no centro, com glow forte
  // - slide: translada pra fora pro lado da team (esquerda ou direita) e some
  const enterStyles = 'translate-x-0 scale-100 opacity-100 duration-300 ease-out';
  const holdStyles = 'translate-x-0 scale-105 opacity-100 duration-200 ease-in-out';
  const slideStyles = cn(
    slideDir === 'left' ? '-translate-x-[180%]' : 'translate-x-[180%]',
    'scale-50 opacity-0 duration-500 ease-in'
  );

  const phaseStyles =
    phase === 'enter' ? enterStyles : phase === 'hold' ? holdStyles : slideStyles;

  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-xl border-2 bg-card p-2 transition-all',
        teamBorder,
        teamGlow,
        show ? phaseStyles : 'opacity-0',
        !show && 'pointer-events-none'
      )}
    >
      <div className={cn('rounded-full ring-4', teamRing)}>
        <PlayerAvatar name={player.name} photoUrl={player.photo_url} size={64} />
      </div>
      <h2 className="w-full truncate px-1 text-center text-sm font-bold sm:text-base">
        {player.name}
      </h2>
      <div className="text-xs text-muted-foreground">
        {'★'.repeat(player.skill_level)}
        {'☆'.repeat(5 - player.skill_level)}
      </div>
      <div
        className={cn(
          'text-[10px] font-bold uppercase tracking-widest',
          team === 1 ? 'text-slate-400' : 'text-pink-400'
        )}
      >
        {team === 1 ? '← Escuros' : 'Coloridos →'}
      </div>
    </div>
  );
}

/* ============================================================ */
/* DetailColumn: colunas embaixo, populadas conforme jogadores  */
/* aterrissam nas lanes. Mantém o look antigo de "card preview".*/
/* ============================================================ */

interface DetailColumnProps {
  name: string;
  accent: 'slate' | 'pink';
  allPlayers: RankedPlayer[];
  placedPlayers: RankedPlayer[];
  oddsCtx: OddsContext;
}

function DetailColumn({
  name,
  accent,
  allPlayers,
  placedPlayers,
  oddsCtx,
}: DetailColumnProps) {
  const dot = accent === 'slate' ? 'bg-slate-700' : 'bg-pink-500';
  const placedIds = new Set(placedPlayers.map((p) => p.id));

  return (
    <Card>
      <CardContent className="p-3">
        <div className="mb-3 flex items-center gap-2">
          <span className={cn('size-3 rounded-full', dot)} />
          <h2 className="font-semibold">{name}</h2>
          <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
            {placedPlayers.length}/{allPlayers.length}
          </span>
        </div>
        <ul className="space-y-2">
          {allPlayers.map((p) => {
            const placed = placedIds.has(p.id);
            const others = allPlayers.filter((x) => x.id !== p.id);
            const odds = computePlayerOdds(p, others, oddsCtx);
            return (
              <li
                key={p.id}
                className={cn(
                  'flex items-center gap-2 rounded-lg border bg-card px-2 py-2 transition-all duration-300',
                  placed
                    ? 'translate-y-0 opacity-100'
                    : 'pointer-events-none -translate-y-1 opacity-0'
                )}
              >
                <PlayerAvatar
                  name={p.name}
                  photoUrl={p.photo_url}
                  size={32}
                  className="shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    {p.position === 'GOLEIRO_FIXO' && <span>🧤</span>}
                    <span className="truncate text-sm font-medium">{p.name}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {'★'.repeat(p.skill_level)}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <OddsBadge label="Gol" value={odds.goal} tone="goal" />
                    <OddsBadge label="Ass" value={odds.assist} tone="assist" />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
