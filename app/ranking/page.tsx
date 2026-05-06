'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import { ArrowLeft, Trophy, Download } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { SeasonStats, Season } from '@/lib/types';
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
import { PercentileRadarChart } from '@/components/charts/percentile-radar-chart';
import { PlayerPerformanceChart } from '@/components/charts/player-performance-chart';
import { PlayerProgressChart } from '@/components/charts/player-progress-chart';
import { SeasonOverviewChart } from '@/components/charts/season-overview-chart';
import { getPlayerBadges } from '@/lib/achievements';

interface SeasonWithStats {
  season: Season;
  stats: SeasonStats[];
}

export default function PublicRankingPage() {
  const router = useRouter();
  const [seasons, setSeasons] = useState<SeasonWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<string>('');
  const [cardPlayerId, setCardPlayerId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const tableRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadRankings = async () => {
      setIsLoading(true);
      try {
        // Buscar todas as temporadas (ativa + inativas)
        const { data: seasonsData } = await supabase
          .from('seasons')
          .select('*')
          .order('created_at', { ascending: false });

        if (!seasonsData || seasonsData.length === 0) {
          setIsLoading(false);
          return;
        }

        // Buscar stats para cada season
        const seasonsWithStats: SeasonWithStats[] = await Promise.all(
          seasonsData.map(async (season) => {
            // Usa a view unificada (auto-computada + importada via CSV)
            const { data: statsData } = await supabase
              .from('v_player_season_stats_full')
              .select('*')
              .eq('season_id', season.id)
              .order('total_points', { ascending: false });

            return {
              season,
              stats: statsData || [],
            };
          })
        );

        setSeasons(seasonsWithStats);

        // Set initial tab
        const activeTab = seasonsWithStats.find((s) => s.season.active);
        if (activeTab) {
          setSelectedTab(activeTab.season.id);
        } else if (seasonsWithStats.length > 0) {
          setSelectedTab(seasonsWithStats[0].season.id);
        }
      } catch (err) {
        console.error('Erro ao carregar rankings:', err);
        toast.error('Erro ao carregar ranking');
      } finally {
        setIsLoading(false);
      }
    };

    loadRankings();
  }, []);

  const currentSeasonData = useMemo(
    () => seasons.find((s) => s.season.id === selectedTab),
    [seasons, selectedTab]
  );

  const stats = currentSeasonData?.stats || [];

  // Ranking Global: agrupa todos os jogadores sem filtro de season
  const globalStats = useMemo(
    () => {
      if (selectedTab !== 'global') return [];

      const grouped = new Map<string, SeasonStats>();

      seasons.forEach(({ stats: seasonStats }) => {
        seasonStats.forEach((s) => {
          const existing = grouped.get(s.player_id);
          if (existing) {
            grouped.set(s.player_id, {
              ...existing,
              matches_played: existing.matches_played + s.matches_played,
              total_points: existing.total_points + s.total_points,
              goals: existing.goals + s.goals,
              assists: existing.assists + s.assists,
              saves: existing.saves + s.saves,
              wins: existing.wins + s.wins,
              draws: existing.draws + s.draws,
              losses: existing.losses + s.losses,
              mvp_count: existing.mvp_count + s.mvp_count,
              avg_rating:
                (existing.avg_rating * existing.matches_played +
                  s.avg_rating * s.matches_played) /
                (existing.matches_played + s.matches_played),
              dynamic_rating:
                existing.dynamic_rating && s.dynamic_rating
                  ? (existing.dynamic_rating + s.dynamic_rating) / 2
                  : existing.dynamic_rating || s.dynamic_rating,
            });
          } else {
            grouped.set(s.player_id, s);
          }
        });
      });

      return Array.from(grouped.values()).sort(
        (a, b) => b.total_points - a.total_points
      );
    },
    [seasons, selectedTab]
  );

  const displayStats = selectedTab === 'global' ? globalStats : stats;
  const displaySeason =
    selectedTab === 'global'
      ? { name: 'Ranking Global (All-Time)', id: 'global' }
      : currentSeasonData?.season || { name: 'Temporada', id: selectedTab };

  // Lookup precisa olhar pra displayStats (não stats), porque no modo
  // Global currentSeasonData fica undefined e stats vira []. Era esse
  // o bug do "card não carrega no Global".
  const cardStats = useMemo(
    () =>
      cardPlayerId
        ? displayStats.find((s) => s.player_id === cardPlayerId) ?? null
        : null,
    [cardPlayerId, displayStats]
  );

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
      const safe = (displaySeason.name || 'temporada').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
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
          <p className="text-fs-text-dim text-sm">Carregando rankings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fs-bg text-fs-text">
      <header className="border-b border-fs-border bg-fs-surface">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => router.back()}
              className="gap-1 text-fs-text-dim hover:bg-fs-surface-2 hover:text-fs-text"
              aria-label="Voltar"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
            <div className="flex size-9 items-center justify-center rounded-full bg-fs-accent/15 text-fs-accent">
              <Trophy className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Ranking</h1>
              <p className="text-xs text-fs-text-dim">{displaySeason.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportTable}
              disabled={exporting || displayStats.length === 0}
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
        {/* Season Tabs */}
        {seasons.length > 0 && (
          <div className="mb-6 overflow-x-auto">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="inline-flex gap-1 bg-transparent">
                {seasons.map((sw) => (
                  <TabsTrigger
                    key={sw.season.id}
                    value={sw.season.id}
                    className="rounded-lg border border-fs-border bg-fs-surface data-[state=active]:border-fs-accent data-[state=active]:bg-fs-surface-2"
                  >
                    {sw.season.name}
                  </TabsTrigger>
                ))}
                <TabsTrigger
                  value="global"
                  className="rounded-lg border border-fs-border bg-fs-surface data-[state=active]:border-fs-accent data-[state=active]:bg-fs-surface-2"
                >
                  🌍 Global
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        {displayStats.length === 0 ? (
          <div className="rounded-lg border border-fs-border bg-fs-surface p-8 text-center text-sm text-fs-text-dim">
            Ainda não há dados para este período.
          </div>
        ) : (
          <div ref={tableRef} className="rounded-lg bg-fs-bg p-2">
            <RankingTable stats={displayStats} onOpenCard={setCardPlayerId} />
          </div>
        )}

        {currentSeasonData?.season.id && displayStats.length > 0 && selectedTab !== 'global' && (
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
            <SeasonOverviewChart seasonId={currentSeasonData.season.id} />
          </section>
        )}

        <div className="mt-6 rounded-lg border border-fs-border bg-fs-surface px-4 py-3 text-xs text-fs-text-dim">
          <p>
            💡 {selectedTab === 'global'
              ? 'Ranking acumulado de todas as temporadas.'
              : 'Ranking público da temporada, atualizado em tempo real.'}
          </p>
        </div>
      </main>

      <Dialog open={cardPlayerId !== null} onOpenChange={(o) => !o && setCardPlayerId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>Detalhes do jogador</DialogTitle>
          </DialogHeader>
          {cardStats && (
            <Tabs defaultValue="card">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="card">Carta</TabsTrigger>
                <TabsTrigger value="radar">Radar</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
                <TabsTrigger value="progress">Evolução</TabsTrigger>
              </TabsList>

              <TabsContent value="card">
                <PlayerFifaCard
                  stats={cardStats}
                  badges={getPlayerBadges(cardStats, displayStats)}
                />
              </TabsContent>

              <TabsContent value="radar">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Percentil do jogador em cada métrica vs todos os atletas da liga.
                  </p>
                  <PercentileRadarChart stats={cardStats} allStats={displayStats} />
                </div>
              </TabsContent>

              <TabsContent value="stats">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Métricas absolutas com cor por percentil (verde &gt; azul &gt; âmbar &gt; vermelho).
                  </p>
                  <PlayerPerformanceChart stats={cardStats} allStats={displayStats} />
                </div>
              </TabsContent>

              <TabsContent value="progress">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {selectedTab === 'global'
                      ? 'Últimas 10 partidas reais (todas as temporadas).'
                      : 'Últimas 10 partidas — pontos (barras) e rating (linha).'}
                  </p>
                  <PlayerProgressChart
                    playerId={cardStats.player_id}
                    seasonId={
                      selectedTab === 'global'
                        ? undefined
                        : currentSeasonData?.season.id
                    }
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
