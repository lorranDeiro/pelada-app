'use client';

import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PlayerAvatar } from '@/components/player-avatar';
import { getCardTier } from '@/lib/achievements';
import type { SeasonStats } from '@/lib/types';

const TIER_DOT: Record<'bronze' | 'silver' | 'gold' | 'legend', string> = {
  bronze: 'bg-amber-800',
  silver: 'bg-slate-400',
  gold:   'bg-yellow-500',
  legend: 'bg-fuchsia-400',
};

interface Props {
  stats: SeasonStats[];
  onOpenCard: (playerId: string) => void;
}

export function RankingTable({ stats, onOpenCard }: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border border-fs-border bg-fs-surface">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="sticky top-0 bg-fs-surface text-[10px] uppercase tracking-wider text-fs-text-dim">
          <tr className="border-b border-fs-border">
            <th className="w-10 px-2 py-2 text-center">#</th>
            <th className="px-2 py-2 text-left">Jogador</th>
            <th className="w-10 px-1 py-2 text-right">PJ</th>
            <th className="hidden w-10 px-1 py-2 text-right sm:table-cell">G</th>
            <th className="hidden w-10 px-1 py-2 text-right sm:table-cell">A</th>
            <th className="hidden w-12 px-1 py-2 text-right sm:table-cell">DEF</th>
            <th className="w-12 px-1 py-2 text-right">Nota</th>
            <th className="w-14 px-2 py-2 text-right">Pts</th>
            <th className="w-10 px-1 py-2 text-right">★</th>
            <th
              className="w-10 px-1 py-2"
              data-html-to-image-ignore="true"
              aria-label="Ações"
            />
          </tr>
        </thead>
        <tbody className="font-mono tabular-nums">
          {stats.map((p, i) => {
            const tier = getCardTier(p.dynamic_rating);
            const rank = i + 1;
            return (
              <tr
                key={p.player_id}
                className="border-b border-fs-border/50 last:border-0 transition-colors hover:bg-fs-surface-2"
              >
                <td className="px-2 py-2 text-center">
                  <RankBadge rank={rank} />
                </td>

                <td className="px-2 py-2">
                  <div className="flex items-center gap-2 font-sans">
                    <PlayerAvatar
                      name={p.name}
                      photoUrl={p.photo_url}
                      size={28}
                      className="shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-medium text-fs-text">{p.name}</span>
                        <span className={cn('size-1.5 shrink-0 rounded-full', TIER_DOT[tier])} />
                      </div>
                      {p.mvp_count > 0 && (
                        <span className="text-[10px] text-fs-accent">
                          ⭐ {p.mvp_count}× MVP
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-1 py-2 text-right text-fs-text-dim">{p.matches_played}</td>
                <td className="hidden px-1 py-2 text-right text-fs-text sm:table-cell">{p.goals}</td>
                <td className="hidden px-1 py-2 text-right text-fs-text sm:table-cell">{p.assists}</td>
                <td className="hidden px-1 py-2 text-right text-fs-text sm:table-cell">{p.saves}</td>
                <td className="px-1 py-2 text-right text-fs-text">{p.avg_rating.toFixed(1)}</td>
                <td className="px-2 py-2 text-right font-bold text-fs-accent">
                  {p.total_points.toFixed(0)}
                </td>
                <td className="px-1 py-2 text-right font-semibold text-fs-text">
                  {(p.dynamic_rating ?? 0).toFixed(1)}
                </td>
                <td className="px-1 py-2 text-right" data-html-to-image-ignore="true">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => onOpenCard(p.player_id)}
                    className="text-fs-text-dim hover:bg-fs-surface-2 hover:text-fs-text"
                    aria-label="Ver carta"
                    title="Ver carta"
                  >
                    <Eye className="size-4" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-base">🥇</span>;
  if (rank === 2) return <span className="text-base">🥈</span>;
  if (rank === 3) return <span className="text-base">🥉</span>;
  return <span className="text-fs-text-dim">{rank}</span>;
}
