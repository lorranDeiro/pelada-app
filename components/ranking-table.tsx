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
    <>
      {/* Mobile: lista vertical em cards */}
      <ul className="rounded-lg border border-fs-border bg-fs-surface sm:hidden">
        {stats.map((p, i) => {
          const tier = getCardTier(p.dynamic_rating);
          return (
            <li key={p.player_id}>
              <button
                onClick={() => onOpenCard(p.player_id)}
                className="flex w-full items-center gap-3 border-b border-fs-border/50 px-3 py-3 text-left transition-colors last:border-0 hover:bg-fs-surface-2 active:bg-fs-surface-2"
              >
                <div className="w-7 shrink-0 text-center">
                  <RankBadge rank={i + 1} />
                </div>
                <PlayerAvatar
                  name={p.name}
                  photoUrl={p.photo_url}
                  size={36}
                  className="shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-medium text-fs-text">{p.name}</span>
                    <span className={cn('size-1.5 shrink-0 rounded-full', TIER_DOT[tier])} />
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-fs-text-dim">
                    <span>{p.matches_played} PJ</span>
                    <span>·</span>
                    <span className="font-mono tabular-nums">
                      {p.goals}G {p.assists}A {p.saves}D
                    </span>
                    {p.mvp_count > 0 && (
                      <span className="text-fs-accent">⭐ {p.mvp_count}</span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-base font-bold tabular-nums text-fs-accent">
                    {p.total_points.toFixed(0)}
                  </div>
                  <div className="font-mono text-[10px] tabular-nums text-fs-text-dim">
                    ★ {(p.dynamic_rating ?? 0).toFixed(1)}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Desktop: tabela completa */}
      <div className="hidden overflow-x-auto rounded-lg border border-fs-border bg-fs-surface sm:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="sticky top-0 bg-fs-surface text-[10px] uppercase tracking-wider text-fs-text-dim">
            <tr className="border-b border-fs-border">
              <th className="w-10 px-2 py-2 text-center">#</th>
              <th className="px-2 py-2 text-left">Jogador</th>
              <th className="w-10 px-1 py-2 text-right">PJ</th>
              <th className="w-10 px-1 py-2 text-right">G</th>
              <th className="w-10 px-1 py-2 text-right">A</th>
              <th className="w-12 px-1 py-2 text-right">DEF</th>
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
                  <td className="px-1 py-2 text-right text-fs-text">{p.goals}</td>
                  <td className="px-1 py-2 text-right text-fs-text">{p.assists}</td>
                  <td className="px-1 py-2 text-right text-fs-text">{p.saves}</td>
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
    </>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-base">🥇</span>;
  if (rank === 2) return <span className="text-base">🥈</span>;
  if (rank === 3) return <span className="text-base">🥉</span>;
  return <span className="text-fs-text-dim">{rank}</span>;
}
