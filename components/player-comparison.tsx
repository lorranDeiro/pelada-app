'use client';

import { useState } from 'react';
import { PlayerFifaCard } from '@/components/player-fifa-card';
import { PlayerSelector } from '@/components/player-selector';
import { ComparisonStatsBars } from '@/components/comparison-stats-bars';
import { WinProbabilityBar } from '@/components/win-probability-bar';
import { getPlayerBadges } from '@/lib/achievements';
import type { SeasonStats } from '@/lib/types';

interface Props {
  player1: SeasonStats;
  allStats: SeasonStats[];
}

export function PlayerComparison({ player1, allStats }: Props) {
  const [player2, setPlayer2] = useState<SeasonStats | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <span className="text-xl" aria-hidden>🥊</span>
        <h3 className="text-sm font-semibold text-fs-text">
          Comparação de jogadores
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Card 1 */}
        <div className="flex justify-center">
          <PlayerFifaCard
            stats={player1}
            badges={getPlayerBadges(player1, allStats)}
            hideDownload
          />
        </div>

        {/* Selector + Card 2 */}
        <div className="space-y-4">
          <PlayerSelector
            allStats={allStats}
            selectedId={player2?.player_id}
            excludeId={player1.player_id}
            onSelect={setPlayer2}
          />

          {player2 ? (
            <div className="flex justify-center animate-fade-in">
              <PlayerFifaCard
                stats={player2}
                badges={getPlayerBadges(player2, allStats)}
                hideDownload
              />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-fs-border bg-fs-surface/50 p-6 text-center text-xs text-fs-text-dim">
              Selecione um adversário acima pra ver a carta dele aqui.
            </div>
          )}
        </div>
      </div>

      {player2 && (
        <>
          <div className="animate-fade-in">
            <ComparisonStatsBars player1={player1} player2={player2} />
          </div>

          <div className="animate-fade-in rounded-lg border border-fs-border bg-fs-surface p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-base" aria-hidden>⚡</span>
              <h4 className="text-sm font-semibold text-fs-text">Quem vence?</h4>
            </div>
            <p className="mb-3 text-center text-xs text-fs-text-dim">
              {player1.name} ({player1.avg_rating.toFixed(1)}) vs{' '}
              {player2.name} ({player2.avg_rating.toFixed(1)})
            </p>
            <WinProbabilityBar
              strengthA={player1.avg_rating}
              strengthB={player2.avg_rating}
              labelA={player1.name}
              labelB={player2.name}
            />
          </div>
        </>
      )}
    </div>
  );
}
