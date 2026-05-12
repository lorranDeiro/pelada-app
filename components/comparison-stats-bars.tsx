'use client';

import { Goal, Hand, Shield, Trophy, Star, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SeasonStats } from '@/lib/types';

interface Metric {
  key: keyof Pick<
    SeasonStats,
    'goals' | 'assists' | 'saves' | 'wins' | 'avg_rating' | 'mvp_count'
  >;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  format: (v: number) => string;
}

const METRICS: Metric[] = [
  { key: 'goals',      label: 'GOLS',          icon: Goal,    format: (v) => String(v) },
  { key: 'assists',    label: 'ASSISTÊNCIAS',  icon: Hand,    format: (v) => String(v) },
  { key: 'saves',      label: 'DEFESAS',       icon: Shield,  format: (v) => String(v) },
  { key: 'wins',       label: 'VITÓRIAS',      icon: Trophy,  format: (v) => String(v) },
  { key: 'avg_rating', label: 'RATING MÉDIO',  icon: Star,    format: (v) => v.toFixed(1) },
  { key: 'mvp_count',  label: 'MVPs',          icon: Crown,   format: (v) => String(v) },
];

interface Props {
  player1: SeasonStats;
  player2: SeasonStats;
}

export function ComparisonStatsBars({ player1, player2 }: Props) {
  return (
    <div className="rounded-lg border border-fs-border bg-fs-surface p-4">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-base" aria-hidden>📊</span>
        <h3 className="text-sm font-semibold text-fs-text">Estatísticas comparativas</h3>
      </div>

      <div className="space-y-4">
        {METRICS.map((m) => (
          <Row
            key={m.key}
            metric={m}
            v1={player1[m.key] as number}
            v2={player2[m.key] as number}
            name1={player1.name}
            name2={player2.name}
          />
        ))}
      </div>
    </div>
  );
}

function Row({
  metric,
  v1,
  v2,
  name1,
  name2,
}: {
  metric: Metric;
  v1: number;
  v2: number;
  name1: string;
  name2: string;
}) {
  const max = Math.max(v1, v2, 1); // evita divisão por zero
  const pct1 = (v1 / max) * 50;    // cada lado ocupa até 50% da barra
  const pct2 = (v2 / max) * 50;
  const wins1 = v1 > v2;
  const wins2 = v2 > v1;

  const Icon = metric.icon;

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <Icon className="size-3.5 text-fs-text-dim" aria-hidden />
        <span className="text-[10px] font-bold uppercase tracking-wider text-fs-text-dim">
          {metric.label}
        </span>
      </div>

      {/* Barra: centro fixo, player1 cresce à esquerda, player2 à direita */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-fs-surface-2">
        <div
          className={cn(
            'absolute inset-y-0 transition-[width] duration-500',
            wins1
              ? 'bg-gradient-to-l from-accent-bright to-accent'
              : 'bg-gradient-to-l from-slate-500 to-slate-600'
          )}
          style={{ right: '50%', width: `${pct1}%` }}
          aria-label={`${name1} ${metric.format(v1)}`}
        />
        <div
          className={cn(
            'absolute inset-y-0 transition-[width] duration-500',
            wins2
              ? 'bg-gradient-to-r from-pink-500 to-pink-700'
              : 'bg-gradient-to-r from-pink-300 to-pink-400'
          )}
          style={{ left: '50%', width: `${pct2}%` }}
          aria-label={`${name2} ${metric.format(v2)}`}
        />
        {/* Marca central */}
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-fs-border" />
      </div>

      <div className="mt-1 flex items-center justify-between font-mono text-xs tabular-nums">
        <span
          className={cn(
            'truncate font-medium',
            wins1 ? 'text-accent-bright' : 'text-slate-400'
          )}
        >
          <span className="truncate">{name1}</span>{' '}
          <span className="text-fs-text-dim">({metric.format(v1)})</span>
        </span>
        <span
          className={cn(
            'truncate text-right font-medium',
            wins2 ? 'text-pink-400' : 'text-pink-300'
          )}
        >
          <span className="text-fs-text-dim">({metric.format(v2)})</span>{' '}
          <span className="truncate">{name2}</span>
        </span>
      </div>
    </div>
  );
}
