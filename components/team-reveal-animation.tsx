'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayerAvatar } from '@/components/player-avatar';
import { OddsBadge } from '@/components/odds-badge';
import { WinProbabilityBar } from '@/components/win-probability-bar';
import { computePlayerOdds, type OddsContext } from '@/lib/player-odds';
import type { RankedPlayer } from '@/lib/types';
import type { BalancedTeams } from '@/lib/team-balancer';

const STAGGER_MS = 280;

interface Props {
  teams: BalancedTeams;
  oddsCtx: OddsContext;
  onComplete: () => void;
}

export function TeamRevealAnimation({ teams, oddsCtx, onComplete }: Props) {
  // Sequência intercalada A, B, A, B, …
  const sequence = useMemo(() => {
    const out: { player: RankedPlayer; team: 1 | 2; orderIdx: number }[] = [];
    const n = Math.max(teams.teamA.length, teams.teamB.length);
    for (let i = 0; i < n; i++) {
      if (teams.teamA[i]) {
        out.push({ player: teams.teamA[i], team: 1, orderIdx: out.length });
      }
      if (teams.teamB[i]) {
        out.push({ player: teams.teamB[i], team: 2, orderIdx: out.length });
      }
    }
    return out;
  }, [teams]);

  const total = sequence.length;
  const [revealed, setRevealed] = useState(0);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (skipped) {
      setRevealed(total);
      const t = setTimeout(onComplete, 200);
      return () => clearTimeout(t);
    }
    if (revealed >= total) {
      const t = setTimeout(onComplete, 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setRevealed((r) => r + 1), STAGGER_MS);
    return () => clearTimeout(t);
  }, [revealed, total, skipped, onComplete]);

  const orderOf = useMemo(() => {
    const m = new Map<string, number>();
    sequence.forEach((s) => m.set(s.player.id, s.orderIdx));
    return m;
  }, [sequence]);

  const isRevealed = (id: string) => (orderOf.get(id) ?? -1) < revealed;
  const isCurrent = (id: string) => (orderOf.get(id) ?? -1) === revealed - 1;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-3 p-4 pb-24">
      <div className="flex items-center justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSkipped(true)}
          disabled={skipped || revealed >= total}
          className="text-xs"
        >
          Pular animação →
        </Button>
      </div>

      <WinProbabilityBar
        strengthA={teams.debug.strengthA}
        strengthB={teams.debug.strengthB}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <RevealColumn
          name="Escuros"
          color="bg-slate-700"
          players={teams.teamA}
          oddsCtx={oddsCtx}
          isRevealed={isRevealed}
          isCurrent={isCurrent}
        />
        <RevealColumn
          name="Coloridos"
          color="bg-pink-500"
          players={teams.teamB}
          oddsCtx={oddsCtx}
          isRevealed={isRevealed}
          isCurrent={isCurrent}
        />
      </div>
    </main>
  );
}

interface RevealColumnProps {
  name: string;
  color: string;
  players: RankedPlayer[];
  oddsCtx: OddsContext;
  isRevealed: (id: string) => boolean;
  isCurrent: (id: string) => boolean;
}

function RevealColumn({
  name,
  color,
  players,
  oddsCtx,
  isRevealed,
  isCurrent,
}: RevealColumnProps) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="mb-3 flex items-center gap-2">
          <span className={cn('size-3 rounded-full', color)} />
          <h2 className="font-semibold">{name}</h2>
        </div>
        <ul className="space-y-2">
          {players.map((p) => {
            const others = players.filter((x) => x.id !== p.id);
            const odds = computePlayerOdds(p, others, oddsCtx);
            const revealed = isRevealed(p.id);
            const current = isCurrent(p.id);
            return (
              <li
                key={p.id}
                className={cn(
                  'flex items-center gap-2 rounded-lg border bg-card px-2 py-2 transition-all duration-500',
                  revealed
                    ? 'translate-y-0 scale-100 opacity-100 border-border'
                    : 'pointer-events-none translate-y-3 scale-50 opacity-0 border-transparent',
                  current && 'border-accent shadow-2xl shadow-accent/40 ring-2 ring-accent'
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
