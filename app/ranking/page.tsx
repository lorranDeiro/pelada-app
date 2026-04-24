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
import { getPlayerBadges } from '@/lib/achievements';

export default function PublicRankingPage() {
  const [stats, setStats] = useState<SeasonStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [seasonName, setSeasonName] = useState('');
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

      if (seasonData) setSeasonName(seasonData.name);

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

        <div className="mt-6 rounded-lg border border-fs-border bg-fs-surface px-4 py-3 text-xs text-fs-text-dim">
          <p>💡 Ranking público da temporada atual, atualizado em tempo real.</p>
        </div>
      </main>

      <Dialog open={cardPlayerId !== null} onOpenChange={(o) => !o && setCardPlayerId(null)}>
        <DialogContent className="bg-transparent p-0 ring-0 sm:max-w-sm">
          <DialogHeader className="sr-only">
            <DialogTitle>Carta do jogador</DialogTitle>
          </DialogHeader>
          {cardStats && (
            <PlayerFifaCard stats={cardStats} badges={getPlayerBadges(cardStats, stats)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
