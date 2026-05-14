'use client';

import { Trophy, Star, TrendingUp } from 'lucide-react';
import { PlayerAvatar } from '@/components/player-avatar';
import { cn } from '@/lib/utils';
import type { SeasonStats } from '@/lib/types';

interface Props {
  stats: SeasonStats[];
  onOpenCard: (playerId: string) => void;
}

export function RankingPodium({ stats, onOpenCard }: Props) {
  if (stats.length < 1) return null;

  const top3 = stats.slice(0, 3);
  // Reorder for visual podium: [2, 1, 3]
  const podium = [
    top3[1], // 2nd
    top3[0], // 1st
    top3[2], // 3rd
  ].filter(Boolean);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mb-12 mt-4">
      {podium.map((p, idx) => {
        const isFirst = p.player_id === top3[0].player_id;
        const rank = stats.findIndex(s => s.player_id === p.player_id) + 1;
        
        return (
          <div
            key={p.player_id}
            onClick={() => onOpenCard(p.player_id)}
            className={cn(
              "relative group cursor-pointer transition-all duration-300 active:scale-95",
              isFirst ? "order-1 md:order-2 z-10" : idx === 0 ? "order-2 md:order-1" : "order-3"
            )}
          >
            <div className={cn(
              "rounded-2xl p-6 border-l-4 shadow-xl flex flex-col items-center",
              isFirst 
                ? "bg-accent/10 border-accent shadow-glow md:scale-110" 
                : "bg-surface border-surface-border"
            )}>
              {/* Rank Badge */}
              <div className={cn(
                "absolute -top-3 flex items-center justify-center rounded-full font-bold shadow-lg border-4 border-background",
                isFirst ? "size-12 bg-accent text-black -top-4" : "size-8 bg-surface-border text-text-primary",
                idx === 0 && !isFirst ? "left-3" : isFirst ? "left-1/2 -translate-x-1/2" : "right-3"
              )}>
                {isFirst ? <Trophy className="size-6" /> : rank}
              </div>

              <div className={cn(
                "rounded-full overflow-hidden border-4 mb-4 transition-transform group-hover:scale-105",
                isFirst ? "size-24 md:size-28 border-accent" : "size-20 border-surface-border"
              )}>
                <PlayerAvatar name={p.name} photoUrl={p.photo_url} size={isFirst ? 112 : 80} />
              </div>

              <div className="text-center mb-6">
                <h3 className={cn(
                  "font-bold uppercase tracking-tight truncate w-full px-2",
                  isFirst ? "text-xl text-text-primary" : "text-lg text-text-secondary"
                )}>
                  {p.name}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                  {p.matches_played} Partidas • {p.mvp_count} MVP
                </span>
              </div>

              <div className="w-full flex justify-between border-t border-surface-border/20 pt-4">
                <div className="text-left">
                  <p className="text-[10px] text-text-muted uppercase font-bold tracking-tighter">Pontos</p>
                  <p className={cn("font-black tabular-nums", isFirst ? "text-2xl text-accent" : "text-xl text-text-primary")}>
                    {p.total_points.toFixed(0)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-text-muted uppercase font-bold tracking-tighter">Win Rate</p>
                  <p className={cn("font-black tabular-nums", isFirst ? "text-2xl text-accent" : "text-xl text-text-primary")}>
                    {((p.wins / (p.matches_played || 1)) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
