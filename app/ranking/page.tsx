'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import { Trophy, Download } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { SeasonStats } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataExport } from '@/components/data-export';
import { PlayerFifaCard } from '@/components/player-fifa-card';
import { RankingTable } from '@/components/ranking-table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PlayerRadarChart } from '@/components/charts/player-radar-chart';
import { PlayerProgressChart } from '@/components/charts/player-progress-chart';
import { SeasonOverviewChart } from '@/components/charts/season-overview-chart';
import { buildRadarData } from '@/lib/player-charts';
import { getPlayerBadges } from '@/lib/achievements';

export default function PublicRankingPage() {
  const [stats, setStats] = useState<SeasonStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [seasonName, setSeasonName] = useState('');
  const [seasonId, setSeasonId] = useState<string | null>(null);
  const [cardPlayerId, setCardPlayerId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const tableRef = useRef<HTMLDivElement | null>(null);

  const cardStats = useMemo(
    () => (cardPlayerId ? stats.find((s) => s.player_id === cardPlayerId) ?? null : null),
    [cardPlayerId, stats]
  );

  useEffect(() => {
    const loadRanking = async () => {
      setIsLoading(true);

      const { data: seasonData } = await supabase
        .from('seasons')
        .select('*')
        .eq('active', true)
        .single();

      if (seasonData) {
        setSeasonName(seasonData.name);
        setSeasonId(seasonData.id);
      }

      const { data: rankingData } = await supabase
        .from('v_player_season_stats')
        .select('*')
        .eq('season_id', seasonData?.id)
        .order('total_points', { ascending: false });

      setStats(rankingData || []);
      setIsLoading(false);
    };

    loadRanking();
  }, []);

  async function handleExportTable() {
    if (!tableRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(tableRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#0b0e1a',
        filter: (node) =>
          !(node instanceof HTMLElement && node.dataset.htmlToImageIgnore === 'true'),
      });
      const blob = await (await fetch(dataUrl)).blob();
      const safe = (seasonName || 'temporada').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      saveAs(blob, `ranking-${safe}.png`);
    } catch (err) {
      console.error('Erro ao exportar ranking:', err);
      toast.error('Não foi possível gerar a imagem');
    } finally {
      setExporting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-fs-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Trophy className="h-10 w-10 text-fs-accent" />
          </div>
          <p className="text-fs-text-dim text-sm">Carregando ranking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fs-bg text-fs-text">
      <header className="border-b border-fs-border bg-fs-surface">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-fs-accent/15 text-fs-accent">
              <Trophy className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Ranking</h1>
              <p className="text-xs text-fs-text-dim">Temporada {seasonName || 'Atual'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportTable}
              disabled={exporting || stats.length === 0}
              className="gap-2 border-fs-border bg-fs-surface text-fs-text hover:bg-fs-surface-2"
              data-html-to-image-ignore="true"
            >
              <Download className="size-4" />
              {exporting ? 'Gerando…' : 'PNG'}
            </Button>
            <div data-html-to-image-ignore="true">
              <DataExport exportType="ranking" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {stats.length === 0 ? (
          <div className="rounded-lg border border-fs-border bg-fs-surface p-8 text-center text-sm text-fs-text-dim">
            Ainda não há dados de ranking. Volte mais tarde!
          </div>
        ) : (
          <div ref={tableRef} className="rounded-lg bg-fs-bg p-2">
            <RankingTable stats={stats} onOpenCard={setCardPlayerId} />
          </div>
        )}

        {seasonId && stats.length > 0 && (
          <section
            className="mt-6 rounded-lg border border-fs-border bg-fs-surface p-4"
            data-html-to-image-ignore="true"
          >
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-fs-text">
                Visão geral da temporada
              </h2>
              <span className="text-[10px] uppercase tracking-wider text-fs-text-dim">
                Gols · Assist. · Decisões
              </span>
            </div>
            <SeasonOverviewChart seasonId={seasonId} />
          </section>
        )}

        <div className="mt-6 rounded-lg border border-fs-border bg-fs-surface px-4 py-3 text-xs text-fs-text-dim">
          <p>💡 Ranking público da temporada atual, atualizado em tempo real.</p>
        </div>
      </main>

      <Dialog open={cardPlayerId !== null} onOpenChange={(o) => !o && setCardPlayerId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>Detalhes do jogador</DialogTitle>
          </DialogHeader>
          {cardStats && (
            <Tabs defaultValue="card">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="card">Carta</TabsTrigger>
                <TabsTrigger value="radar">Radar</TabsTrigger>
                <TabsTrigger value="progress">Evolução</TabsTrigger>
              </TabsList>

              <TabsContent value="card">
                <PlayerFifaCard
                  stats={cardStats}
                  badges={getPlayerBadges(cardStats, stats)}
                />
              </TabsContent>

              <TabsContent value="radar">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Jogador vs média da liga, normalizado pelo líder de cada métrica.
                  </p>
                  <PlayerRadarChart data={buildRadarData(cardStats, stats)} />
                </div>
              </TabsContent>

              <TabsContent value="progress">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Últimas 10 partidas — pontos (barras) e rating (linha).
                  </p>
                  {seasonId && (
                    <PlayerProgressChart
                      playerId={cardStats.player_id}
                      seasonId={seasonId}
                    />
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
