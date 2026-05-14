'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import { ArrowLeft, Trophy, Download, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { SeasonStats, Season } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataExport } from '@/components/data-export';
import { PlayerFifaCard } from '@/components/player-fifa-card';
import { PlayerComparison } from '@/components/player-comparison';
import { RankingTable } from '@/components/ranking-table';
import { RankingPodium } from '@/components/ranking-podium';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PercentileRadarChart } from '@/components/charts/percentile-radar-chart';
import { PlayerPerformanceChart } from '@/components/charts/player-performance-chart';
import { PlayerProgressChart } from '@/components/charts/player-progress-chart';
import { SeasonOverviewChart } from '@/components/charts/season-overview-chart';
import { getPlayerBadges } from '@/lib/achievements';
import { cn } from '@/lib/utils';

interface SeasonWithStats {
  season: Season;
  stats: SeasonStats[];
}

export default function PublicRankingPage() {
  const router = useRouter();
  const [seasons, setSeasons] = useState<SeasonWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
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
  const filteredStats = useMemo(() => {
    if (!searchQuery) return displayStats;
    const q = searchQuery.toLowerCase();
    return displayStats.filter((s) => s.name.toLowerCase().includes(q));
  }, [displayStats, searchQuery]);

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
    <div className="min-h-screen bg-background text-text-primary">
      <header className="sticky top-0 z-10 border-b border-surface-border/40 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.back()}
            className="gap-1 text-text-secondary hover:text-accent-bright"
            aria-label="Voltar"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Voltar</span>
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportTable}
              disabled={exporting || displayStats.length === 0}
              className="gap-2 border-surface-border bg-surface text-text-primary hover:bg-surface-hover"
              data-html-to-image-ignore="true"
            >
              <Download className="size-4" />
              <span className="hidden xs:inline">{exporting ? 'Gerando…' : 'Exportar PNG'}</span>
            </Button>
            <div data-html-to-image-ignore="true" className="hidden xs:block">
              <DataExport exportType="ranking" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-10">
        {/* Hero Header */}
        <section>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="space-y-1">
              <h2 className="text-sm font-bold uppercase tracking-widest text-accent">LEADERBOARD</h2>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl uppercase italic">Classificação</h1>
              <p className="text-text-secondary text-lg">Métricas de precisão para cada membro do elenco.</p>
            </div>
            
            {/* Search Bar */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-muted" />
              <Input
                type="text"
                placeholder="Buscar jogador..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-surface border-surface-border focus:ring-accent/20 rounded-xl"
              />
            </div>
          </div>

          {/* Custom Tabs */}
          {seasons.length > 0 && (
            <div className="flex bg-surface-container rounded-2xl p-1.5 border border-surface-border">
              {seasons.map((sw) => (
                <button
                  key={sw.season.id}
                  onClick={() => setSelectedTab(sw.season.id)}
                  className={cn(
                    "flex-1 py-2.5 px-4 font-bold text-[10px] sm:text-xs uppercase tracking-widest rounded-xl transition-all",
                    selectedTab === sw.season.id
                      ? "bg-surface text-accent shadow-premium"
                      : "text-text-muted hover:text-text-primary hover:bg-surface/50"
                  )}
                >
                  {sw.season.name}
                </button>
              ))}
              <button
                onClick={() => setSelectedTab('global')}
                className={cn(
                  "flex-1 py-2.5 px-4 font-bold text-[10px] sm:text-xs uppercase tracking-widest rounded-xl transition-all",
                  selectedTab === 'global'
                    ? "bg-surface text-accent shadow-premium"
                    : "text-text-muted hover:text-text-primary hover:bg-surface/50"
                )}
              >
                🌍 Global
              </button>
            </div>
          )}
        </section>

        {/* Top 3 Podium */}
        {!searchQuery && (
          <RankingPodium stats={displayStats} onOpenCard={setCardPlayerId} />
        )}

        {/* Main List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-text-secondary">
              Tabela de Performance
            </h2>
            <span className="text-[10px] text-text-muted font-medium">
              {filteredStats.length} Jogadores registrados
            </span>
          </div>

          {filteredStats.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-surface-border bg-surface/30 p-12 text-center text-sm text-text-muted">
              Nenhum jogador encontrado com "{searchQuery}".
            </div>
          ) : (
            <div ref={tableRef} className="rounded-2xl bg-surface border border-surface-border overflow-hidden shadow-sm">
              <RankingTable stats={filteredStats} onOpenCard={setCardPlayerId} />
              
              <div className="bg-background/40 p-4 text-center border-t border-surface-border/60">
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-tighter">
                  Role para ver todos • Atualizado em tempo real
                </p>
              </div>
            </div>
          )}
        </section>

        {currentSeasonData?.season.id && displayStats.length > 0 && selectedTab !== 'global' && !searchQuery && (
          <section
            className="rounded-2xl border border-surface-border bg-surface p-6 shadow-sm"
            data-html-to-image-ignore="true"
          >
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary">
                Visão Geral da Temporada
              </h2>
              <span className="text-[10px] uppercase tracking-tighter text-text-muted font-bold">
                Gols · Assistências · Decisões
              </span>
            </div>
            <SeasonOverviewChart seasonId={currentSeasonData.season.id} />
          </section>
        )}

        <div className="rounded-2xl border border-surface-border bg-surface p-4 text-[10px] sm:text-xs text-text-muted flex items-center gap-3">
          <Trophy className="size-4 text-accent shrink-0" />
          <p>
            {selectedTab === 'global'
              ? 'O Ranking Global acumula todos os pontos conquistados pelo jogador em todas as temporadas registradas.'
              : 'O Ranking da Temporada é baseado nos critérios de pontuação vigentes para o período selecionado.'}
          </p>
        </div>
      </main>

      <Dialog open={cardPlayerId !== null} onOpenChange={(o) => !o && setCardPlayerId(null)}>
        <DialogContent className="sm:max-w-2xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Detalhes do jogador</DialogTitle>
          </DialogHeader>
          {cardStats && (
            <Tabs defaultValue="card">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="card">Carta</TabsTrigger>
                <TabsTrigger value="radar">Radar</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
                <TabsTrigger value="progress">Evolução</TabsTrigger>
                <TabsTrigger value="compare">🥊 Comparar</TabsTrigger>
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

              <TabsContent value="compare">
                <PlayerComparison player1={cardStats} allStats={displayStats} />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
