'use client';

import { computeWinProbability } from '@/lib/win-probability';

interface Props {
  strengthA: number;
  strengthB: number;
  labelA?: string;
  labelB?: string;
}

export function WinProbabilityBar({
  strengthA,
  strengthB,
  labelA = 'Escuros',
  labelB = 'Coloridos',
}: Props) {
  const { pA, pB, draw } = computeWinProbability(strengthA, strengthB);

  return (
    <div className="rounded-lg border border-fs-border bg-fs-surface p-3">
      <div className="mb-2 flex items-baseline justify-between text-xs">
        <span className="font-semibold text-fs-text">{labelA}</span>
        <span className="uppercase tracking-wider text-fs-text-dim">
          Probabilidade de vitória
        </span>
        <span className="font-semibold text-fs-text">{labelB}</span>
      </div>

      <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 bg-slate-700 transition-[width] duration-700 ease-out dark:bg-slate-600"
          style={{ width: `${pA}%` }}
          aria-label={`${labelA} ${pA}%`}
        />
        <div
          className="absolute inset-y-0 bg-amber-400/80"
          style={{ left: `${pA}%`, width: `${draw}%` }}
          aria-label={`Empate ${draw}%`}
          title={`Empate ${draw}%`}
        />
        <div
          className="absolute inset-y-0 right-0 bg-pink-500 transition-[width] duration-700 ease-out"
          style={{ width: `${pB}%` }}
          aria-label={`${labelB} ${pB}%`}
        />
      </div>

      <div className="mt-2 flex items-center justify-between font-mono text-sm tabular-nums">
        <span className="font-bold text-slate-700 dark:text-slate-300">{pA}%</span>
        <span className="text-xs text-amber-500">empate {draw}%</span>
        <span className="font-bold text-pink-500">{pB}%</span>
      </div>
    </div>
  );
}
