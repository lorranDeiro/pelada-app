'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AppNav } from '@/components/app-nav';
import { RequireAuth } from '@/components/require-auth';
import { PlayerDialog } from '@/components/player-dialog';
import { PlayerFifaCard } from '@/components/player-fifa-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StarRating } from '@/components/ui-patterns';
import { getPlayerBadges } from '@/lib/achievements';
import { supabase } from '@/lib/supabase';
import type { Player, SeasonStats } from '@/lib/types';

export default function ElencoPage() {
  return (
    <RequireAuth>
      <AppNav />
      <ElencoContent />
    </RequireAuth>
  );
}

function ElencoContent() {
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [seasonStats, setSeasonStats] = useState<Map<string, SeasonStats>>(new Map());
  const [editing, setEditing] = useState<Player | null>(null);
  const [creating, setCreating] = useState(false);
  const [cardPlayerId, setCardPlayerId] = useState<string | null>(null);

  const allStatsArray = useMemo(() => Array.from(seasonStats.values()), [seasonStats]);
  const cardStats = cardPlayerId ? seasonStats.get(cardPlayerId) ?? null : null;

  const load = useCallback(async () => {
    // Fetch players
    const { data: playersData, error: playersError } = await supabase
      .from('players')
      .select('*')
      .order('active', { ascending: false })
      .order('name');
    if (playersError) {
      toast.error('Erro ao carregar jogadores', { description: playersError.message });
      return;
    }
    setPlayers(playersData ?? []);

    // Fetch active season stats
    const { data: seasonData } = await supabase
      .from('seasons')
      .select('*')
      .eq('active', true)
      .single();

    if (seasonData) {
      const { data: statsData } = await supabase
        .from('v_player_season_stats')
        .select('*')
        .eq('season_id', seasonData.id);

      const statsMap = new Map<string, SeasonStats>();
      (statsData ?? []).forEach((stat) => {
        statsMap.set(stat.player_id, stat);
      });
      setSeasonStats(statsMap);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(player: Player) {
    const { error } = await supabase
      .from('players')
      .update({ active: !player.active })
      .eq('id', player.id);
    if (error) {
      toast.error('Erro ao atualizar', { description: error.message });
      return;
    }
    load();
  }

  async function remove(player: Player) {
    if (!confirm(`Remover ${player.name}?`)) return;
    const { error } = await supabase.from('players').delete().eq('id', player.id);
    if (error) {
      toast.error('Não foi possível remover', {
        description:
          'Jogador já participou de partidas. Use o botão "Inativar" em vez de remover.',
      });
      return;
    }
    toast.success('Jogador removido');
    load();
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Elenco</h1>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="size-4" /> Novo
        </Button>
      </div>

      {players === null ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : players.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhum jogador ainda. Clique em <strong>Novo</strong> pra começar.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {players.map((p) => {
            const stats = seasonStats.get(p.id);
            return (
              <li key={p.id}>
                <Card className={p.active ? '' : 'opacity-50'}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{p.name}</span>
                        {p.position === 'GOLEIRO_FIXO' && (
                          <Badge variant="secondary">🧤 Goleiro</Badge>
                        )}
                        {!p.active && <Badge variant="outline">Inativo</Badge>}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <span>Nível Inicial:</span>
                          {renderStars(p.skill_level)}
                        </div>
                        {stats && stats.matches_played > 0 && (
                          <div className="flex items-center gap-2">
                            <span>Nível Temporada:</span>
                            <StarRating
                              value={stats.dynamic_rating}
                              size="xs"
                              showValue={true}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setCardPlayerId(p.id)}
                        disabled={!stats || stats.matches_played === 0}
                        aria-label="Ver carta"
                        title={
                          !stats || stats.matches_played === 0
                            ? 'Sem partidas na temporada'
                            : 'Ver carta'
                        }
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleActive(p)}
                        title={p.active ? 'Inativar' : 'Ativar'}
                      >
                        {p.active ? 'Inativar' : 'Ativar'}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditing(p)}
                        aria-label="Editar"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => remove(p)}
                        aria-label="Remover"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <PlayerDialog
        open={creating}
        onOpenChange={(o) => !o && setCreating(false)}
        onSaved={() => {
          setCreating(false);
          load();
        }}
      />
      <PlayerDialog
        player={editing}
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />

      <Dialog
        open={cardPlayerId !== null}
        onOpenChange={(o) => !o && setCardPlayerId(null)}
      >
        <DialogContent className="bg-transparent p-0 ring-0 sm:max-w-xs">
          <DialogHeader className="sr-only">
            <DialogTitle>Carta do jogador</DialogTitle>
          </DialogHeader>
          {cardStats && (
            <PlayerFifaCard
              stats={cardStats}
              badges={getPlayerBadges(cardStats, allStatsArray)}
            />
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function renderStars(level: number) {
  return '★'.repeat(level) + '☆'.repeat(5 - level);
}
