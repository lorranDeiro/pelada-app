'use client';

import { useState, useEffect, useRef } from 'react';
import { PlayerFifaCard } from '@/components/player-fifa-card';
import { PlayerSelector } from '@/components/player-selector';
import { ComparisonStatsBars } from '@/components/comparison-stats-bars';
import { WinProbabilityBar } from '@/components/win-probability-bar';
import { getPlayerBadges } from '@/lib/achievements';
import { supabase } from '@/lib/supabase';
import { SwatchBook, Share2, Download, TrendingUp, Zap } from 'lucide-react';
import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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
  const [exporting, setExporting] = useState(false);
  const comparisonRef = useRef<HTMLDivElement | null>(null);

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

  async function handleExport() {
    if (!comparisonRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(comparisonRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#0b0e1a',
      });
      const blob = await (await fetch(dataUrl)).blob();
      saveAs(blob, `confronto-${player1.name}-vs-${player2?.name}.png`);
    } catch (err) {
      console.error('Erro ao exportar confronto:', err);
      toast.error('Não foi possível gerar a imagem');
    } finally {
      setExporting(false);
    }
  }

  const analysis = useMemo(() => {
    if (!player2) return null;
    const p1 = player1.total_points;
    const p2 = player2.total_points;
    const diff = Math.abs(p1 - p2);
    const lead = p1 > p2 ? player1.name : player2.name;
    
    if (diff < 50) return `Equilíbrio quase absoluto. Ambos os jogadores possuem métricas muito similares nesta temporada.`;
    if (p1 > p2) {
      return `${player1.name} lidera em consistência e volume de jogo, enquanto ${player2.name} busca reduzir a vantagem estatística no confronto direto.`;
    }
    return `${player2.name} apresenta um desempenho superior em termos de pontos acumulados, sendo o favorito estatístico para este duelo.`;
  }, [player1, player2]);

  return (
    <div className="space-y-8" ref={comparisonRef}>
      {/* Comparison Header */}
      <div className="text-center mb-8">
        <span className="inline-block bg-accent/10 text-accent px-4 py-1 rounded-full font-bold text-[10px] uppercase tracking-widest mb-2 border border-accent/20">
          Versus Mode
        </span>
        <h2 className="text-2xl font-black text-text-primary uppercase italic tracking-tight">Comparação Técnica</h2>
      </div>

      <div className="relative flex flex-col md:flex-row items-stretch justify-center gap-6 md:gap-12">
        {/* VS Badge */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center size-20 bg-gradient-to-br from-accent to-accent-secondary rounded-full border-4 border-background shadow-glow ring-4 ring-accent/10">
          <span className="font-black text-black italic text-2xl">VS</span>
        </div>

        {/* Mobile VS Badge */}
        <div className="md:hidden flex items-center justify-center py-2">
          <div className="bg-gradient-to-r from-accent to-accent-secondary px-8 py-2 rounded-full border-2 border-surface shadow-md">
            <span className="font-black text-black italic">VS</span>
          </div>
        </div>

        {/* Card 1 */}
        <div className="flex-1 flex justify-center">
          <PlayerFifaCard
            stats={player1}
            badges={getPlayerBadges(player1, allStats)}
            hideDownload
          />
        </div>

        {/* Selector + Card 2 */}
        <div className="flex-1 space-y-4">
          <div data-html-to-image-ignore="true">
            <PlayerSelector
              allStats={allStats}
              selectedId={player2?.player_id}
              excludeId={player1.player_id}
              onSelect={setPlayer2}
            />
          </div>

          {player2 ? (
            <div className="flex justify-center animate-in fade-in slide-in-from-right-4 duration-500">
              <PlayerFifaCard
                stats={player2}
                badges={getPlayerBadges(player2, allStats)}
                hideDownload
              />
            </div>
          ) : (
            <div className="flex h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-fs-border bg-fs-surface/30 p-8 text-center" data-html-to-image-ignore="true">
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

          {/* Asymmetric Summary/CTA */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8 bg-accent text-black p-6 rounded-2xl flex items-center justify-between shadow-glow">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">Pro Analysis</p>
                <p className="font-bold text-sm leading-relaxed max-w-md italic">{analysis}</p>
              </div>
              <div className="hidden md:block">
                <TrendingUp className="size-12 opacity-20" />
              </div>
            </div>
            
            <button
              onClick={handleExport}
              disabled={exporting}
              data-html-to-image-ignore="true"
              className="md:col-span-4 bg-surface border border-surface-border text-text-primary p-6 rounded-2xl flex flex-col justify-center items-center text-center shadow-sm hover:border-accent transition-all active:scale-95 group"
            >
              <div className="mb-2 rounded-full bg-accent/10 p-3 group-hover:bg-accent group-hover:text-black transition-colors">
                <Share2 className="size-5" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">{exporting ? 'Gerando...' : 'Exportar Duelo'}</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
