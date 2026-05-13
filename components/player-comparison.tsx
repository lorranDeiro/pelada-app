'use client';

import { useState, useEffect } from 'react';
import { PlayerFifaCard } from '@/components/player-fifa-card';
import { PlayerSelector } from '@/components/player-selector';
import { ComparisonStatsBars } from '@/components/comparison-stats-bars';
import { WinProbabilityBar } from '@/components/win-probability-bar';
import { getPlayerBadges } from '@/lib/achievements';
import { supabase } from '@/lib/supabase';
import { SwatchBook } from 'lucide-react';
import type { SeasonStats } from '@/lib/types';

interface Props {
  player1: SeasonStats;
  allStats: SeasonStats[];
}

interface H2HStats {
  p1Wins: number;
  p2Wins: number;
  draws: number;
  total: number;
}

export function PlayerComparison({ player1, allStats }: Props) {
  const [player2, setPlayer2] = useState<SeasonStats | null>(null);
  const [h2h, setH2h] = useState<H2HStats | null>(null);
  const [loadingH2h, setLoadingH2h] = useState(false);

  useEffect(() => {
    // Verificamos explicitamente se player2 existe antes de disparar a busca
    if (!player2) {
      setH2h(null);
      return;
    }

    async function fetchH2H() {
      // Garantimos ao TypeScript que player2 não é nulo dentro deste escopo
      if (!player2) return;

      setLoadingH2h(true);
      try {
        // Busca partidas onde ambos estiveram presentes
        const { data, error } = await supabase
          .rpc('get_h2h_stats', { 
            p1_id: player1.player_id, 
            p2_id: player2.player_id 
          });

        if (!error && data) {
          setH2h(data[0] || { p1Wins: 0, p2Wins: 0, draws: 0, total: 0 });
        }
      } catch (e) {
        console.error('Erro H2H:', e);
      } finally {
        setLoadingH2h(false);
      }
    }

    fetchH2H();
  }, [player1.player_id, player2]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-xl" aria-hidden>🤺</span>
        <h3 className="text-sm font-semibold text-fs-text">
          Comparação de jogadores
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
            <div className="flex justify-center animate-in fade-in slide-in-from-right-4 duration-500">
              <PlayerFifaCard
                stats={player2}
                badges={getPlayerBadges(player2, allStats)}
                hideDownload
              />
            </div>
          ) : (
            <div className="flex h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-fs-border bg-fs-surface/30 p-8 text-center">
              <div className="mb-4 rounded-full bg-fs-surface-2 p-4">
                <SwatchBook className="size-8 text-fs-text-dim opacity-20" />
              </div>
              <p className="text-sm font-medium text-fs-text-dim">
                Selecione um adversário para iniciar o duelo
              </p>
            </div>
          )}
        </div>
      </div>

      {player2 && (
        <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* H2H Scoreboard */}
          <div className="rounded-2xl border border-fs-border bg-fs-surface overflow-hidden shadow-xl">
            <div className="bg-fs-surface-2 px-4 py-2 border-b border-fs-border flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-fs-text-dim">Confronto Direto (H2H)</span>
              {loadingH2h && <div className="size-3 rounded-full bg-fs-accent animate-pulse" />}
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-center flex-1">
                  <div className="text-3xl font-black text-fs-text">{h2h?.p1Wins ?? 0}</div>
                  <div className="text-[10px] font-bold text-fs-text-dim uppercase">Vitórias</div>
                </div>
                <div className="px-4 text-center">
                  <div className="text-sm font-bold text-fs-text-dim uppercase bg-fs-surface-2 px-3 py-1 rounded-full">Vs</div>
                </div>
                <div className="text-center flex-1">
                  <div className="text-3xl font-black text-fs-text">{h2h?.p2Wins ?? 0}</div>
                  <div className="text-[10px] font-bold text-fs-text-dim uppercase">Vitórias</div>
                </div>
              </div>
              <div className="relative h-2 w-full rounded-full bg-fs-surface-2 overflow-hidden flex">
                <div 
                  className="h-full bg-slate-600 transition-all duration-1000" 
                  style={{ width: `${h2h ? (h2h.p1Wins / (h2h.total || 1)) * 100 : 0}%` }}
                />
                <div 
                  className="h-full bg-amber-500/30 transition-all duration-1000" 
                  style={{ width: `${h2h ? (h2h.draws / (h2h.total || 1)) * 100 : 0}%` }}
                />
                <div 
                  className="h-full bg-pink-500 transition-all duration-1000" 
                  style={{ width: `${h2h ? (h2h.p2Wins / (h2h.total || 1)) * 100 : 0}%` }}
                />
              </div>
              <div className="mt-3 text-center text-[10px] text-fs-text-dim font-medium uppercase tracking-tighter">
                {h2h?.total ?? 0} Partidas disputadas • {h2h?.draws ?? 0} Empates
              </div>
            </div>
          </div>

          <ComparisonStatsBars player1={player1} player2={player2} />

          <div className="rounded-2xl border border-fs-border bg-fs-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-base" aria-hidden>⚡</span>
              <h4 className="text-sm font-semibold text-fs-text">Probabilidade Estatística</h4>
            </div>
            <WinProbabilityBar
              strengthA={player1.avg_rating}
              strengthB={player2.avg_rating}
              labelA={player1.name}
              labelB={player2.name}
            />
          </div>
        </div>
      )}
    </div>
  );
}
