'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { AppNav } from '@/components/app-nav';
import { RequireAuth } from '@/components/require-auth';
import { PlayerDialog } from '@/components/player-dialog';
import { PlayerFifaCard } from '@/components/player-fifa-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
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
  const [quickName, setQuickName] = useState('');
  const [quickSaving, setQuickSaving] = useState(false);

  const allStatsArray = useMemo(() => Array.from(seasonStats.values()), [seasonStats]);
  const cardStats = cardPlayerId ? seasonStats.get(cardPlayerId) ?? null : null;

  const load = useCallback(async () => {
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

  async function quickAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = quickName.trim();
    if (!name || quickSaving) return;
    setQuickSaving(true);
    const { error } = await supabase
      .from('players')
      .insert({ name, position: 'JOGADOR', skill_level: 3 });
    setQuickSaving(false);
    if (error) {
      toast.error('Erro ao adicionar', { description: error.message });
      return;
    }
    toast.success(`${name} adicionado`);
    setQuickName('');
    load();
  }

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

  const activeCount = (players ?? []).filter((p) => p.active).length;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-5 p-4 pb-12">
      <section className="space-y-3">
        <label
          htmlFor="quick-add-name"
          className="block text-xs font-semibold uppercase tracking-widest text-accent"
        >
          Adicionar jogador
        </label>
        <form onSubmit={quickAdd} className="relative">
          <input
            id="quick-add-name"
            type="text"
            value={quickName}
            onChange={(e) => setQuickName(e.target.value)}
            placeholder="Nome do jogador…"
            className="h-14 w-full rounded-xl border border-surface-border bg-surface px-4 pr-16 text-base outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
          <button
            type="submit"
            disabled={!quickName.trim() || quickSaving}
            aria-label="Adicionar"
            className="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg bg-gradient-to-r from-accent to-accent-bright text-black shadow-accent transition active:scale-90 disabled:opacity-40"
          >
            <UserPlus className="size-5" />
          </button>
        </form>
        <p className="text-xs text-text-secondary">
          Cadastro rápido: nível 3 ⭐ e posição Jogador. Edite depois para refinar.
        </p>
      </section>

      <section className="flex items-center justify-between pt-1">
        <h1 className="text-2xl font-semibold">
          Elenco{' '}
          <span className="text-base font-normal text-text-secondary">
            ({activeCount} ativos)
          </span>
        </h1>
        <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
          <Plus className="size-4" /> Completo
        </Button>
      </section>

      {players === null ? (
        <p className="text-sm text-text-secondary">Carregando…</p>
      ) : players.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-border bg-surface/40 p-8 text-center">
          <p className="text-sm text-text-secondary">
            Nenhum jogador ainda. Use o campo acima para começar.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {players.map((p) => {
            const stats = seasonStats.get(p.id);
            const dynamic = stats?.matches_played ? stats.dynamic_rating : undefined;
            return (
              <li key={p.id}>
                <PlayerCard
                  player={p}
                  dynamicRating={dynamic}
                  onView={
                    stats && stats.matches_played > 0
                      ? () => setCardPlayerId(p.id)
                      : undefined
                  }
                  onEdit={() => setEditing(p)}
                  onRemove={() => remove(p)}
                  onToggleActive={() => toggleActive(p)}
                />
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

function PlayerCard({
  player,
  dynamicRating,
  onView,
  onEdit,
  onRemove,
  onToggleActive,
}: {
  player: Player;
  dynamicRating?: number;
  onView?: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onToggleActive: () => void;
}) {
  const isGoalkeeper = player.position === 'GOLEIRO_FIXO';
  const borderTone = player.active
    ? isGoalkeeper
      ? 'border-l-accent-secondary'
      : 'border-l-accent'
    : 'border-l-surface-border';

  return (
    <div
      className={`rounded-2xl border border-surface-border border-l-4 bg-surface p-4 shadow-sm transition hover:shadow-premium ${borderTone} ${
        player.active ? '' : 'opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-lg font-semibold">{player.name}</span>
            {isGoalkeeper && <Badge variant="secondary">🧤 Goleiro</Badge>}
            {!player.active && <Badge variant="outline">Inativo</Badge>}
          </div>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <span className="w-24 shrink-0">Nível inicial:</span>
              <StarRating value={player.skill_level} size="sm" showValue={false} />
            </div>
            {dynamicRating !== undefined && (
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <span className="w-24 shrink-0">Temporada:</span>
                <StarRating value={dynamicRating} size="sm" showValue />
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onRemove}
          aria-label="Remover"
          className="text-surface-border transition hover:text-accent-danger"
        >
          <Trash2 className="size-5" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-surface-border/60 pt-3">
        <div className="flex items-center gap-2.5">
          <Switch
            id={`active-${player.id}`}
            checked={player.active}
            onCheckedChange={onToggleActive}
            aria-label={player.active ? 'Inativar' : 'Ativar'}
          />
          <span className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
            {player.active ? 'Ativo' : 'Inativo'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onView && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onView}
              aria-label="Ver carta"
              title="Ver carta"
            >
              <Eye className="size-4" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={onEdit}
            aria-label="Editar"
            title="Editar"
          >
            <Pencil className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
