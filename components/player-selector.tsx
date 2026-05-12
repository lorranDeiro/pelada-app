'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlayerAvatar } from '@/components/player-avatar';
import { getCardTier } from '@/lib/achievements';
import type { SeasonStats } from '@/lib/types';

const TIER_DOT: Record<'bronze' | 'silver' | 'gold' | 'legend', string> = {
  bronze: 'bg-amber-700',
  silver: 'bg-slate-400',
  gold: 'bg-yellow-500',
  legend: 'bg-fuchsia-400',
};

interface Props {
  allStats: SeasonStats[];
  selectedId?: string;
  excludeId: string;
  onSelect: (player: SeasonStats) => void;
}

export function PlayerSelector({ allStats, selectedId, excludeId, onSelect }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const norm = (s: string) =>
      s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    const q = norm(query.trim());
    return allStats
      .filter((p) => p.player_id !== excludeId)
      .filter((p) => (q.length === 0 ? true : norm(p.name).includes(q)))
      .sort((a, b) => (b.dynamic_rating ?? 0) - (a.dynamic_rating ?? 0));
  }, [allStats, excludeId, query]);

  return (
    <div className="rounded-lg border border-fs-border bg-fs-surface p-3">
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-fs-text-dim">
        Selecionar adversário
      </label>

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-fs-text-dim" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar jogador…"
          className="w-full rounded border border-fs-border bg-fs-surface-2 px-8 py-2 text-sm text-fs-text placeholder:text-fs-text-dim focus:border-fs-accent focus:outline-none focus:ring-2 focus:ring-fs-accent/30"
        />
      </div>

      <ul className="max-h-[300px] overflow-y-auto">
        {filtered.length === 0 ? (
          <li className="py-6 text-center text-xs text-fs-text-dim">
            Nenhum jogador encontrado.
          </li>
        ) : (
          filtered.map((p) => {
            const tier = getCardTier(p.dynamic_rating);
            const ovr = Math.min(99, Math.round((p.dynamic_rating ?? 0) * 20));
            const isSelected = p.player_id === selectedId;
            return (
              <li key={p.player_id}>
                <button
                  type="button"
                  onClick={() => onSelect(p)}
                  className={cn(
                    'flex w-full items-center gap-3 border-l-2 border-transparent px-2 py-2 text-left transition-colors',
                    'hover:border-fs-text-dim hover:bg-fs-surface-2',
                    isSelected && 'border-fs-accent bg-fs-surface-2'
                  )}
                >
                  <PlayerAvatar
                    name={p.name}
                    photoUrl={p.photo_url}
                    size={32}
                    className="shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-fs-text">
                        {p.name}
                      </span>
                      <span className={cn('size-1.5 shrink-0 rounded-full', TIER_DOT[tier])} />
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] tabular-nums text-fs-text-dim">
                      <span>OVR {ovr}</span>
                      <span>·</span>
                      <span>{p.position === 'GOLEIRO_FIXO' ? 'GOL' : 'ATA'}</span>
                      <span>·</span>
                      <span>{p.matches_played} PJ</span>
                    </div>
                  </div>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
