'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RankedPlayer } from '@/lib/types';

interface ManualTeamSelectorProps {
  players: RankedPlayer[];
  teamA?: RankedPlayer[];
  teamB?: RankedPlayer[];
  onSave: (teamA: RankedPlayer[], teamB: RankedPlayer[]) => Promise<void>;
  isLoading?: boolean;
}

export function ManualTeamSelector({
  players,
  teamA: initialTeamA,
  teamB: initialTeamB,
  onSave,
  isLoading = false,
}: ManualTeamSelectorProps) {
  const [teamA, setTeamA] = useState<RankedPlayer[]>(initialTeamA || []);
  const [teamB, setTeamB] = useState<RankedPlayer[]>(initialTeamB || []);
  const [unassigned, setUnassigned] = useState<RankedPlayer[]>(
    players.filter(
      (p) =>
        !initialTeamA?.some((t) => t.id === p.id) &&
        !initialTeamB?.some((t) => t.id === p.id)
    )
  );
  const [saving, setSaving] = useState(false);

  const moveToTeamA = (player: RankedPlayer) => {
    setUnassigned((prev) => prev.filter((p) => p.id !== player.id));
    setTeamB((prev) => prev.filter((p) => p.id !== player.id));
    setTeamA((prev) => [...prev, player]);
  };

  const moveToTeamB = (player: RankedPlayer) => {
    setUnassigned((prev) => prev.filter((p) => p.id !== player.id));
    setTeamA((prev) => prev.filter((p) => p.id !== player.id));
    setTeamB((prev) => [...prev, player]);
  };

  const moveToUnassigned = (player: RankedPlayer, from: 'A' | 'B') => {
    if (from === 'A') {
      setTeamA((prev) => prev.filter((p) => p.id !== player.id));
    } else {
      setTeamB((prev) => prev.filter((p) => p.id !== player.id));
    }
    setUnassigned((prev) => [...prev, player]);
  };

  const swapTeam = (player: RankedPlayer, from: 'A' | 'B') => {
    if (from === 'A') {
      setTeamA((prev) => prev.filter((p) => p.id !== player.id));
      setTeamB((prev) => [...prev, player]);
    } else {
      setTeamB((prev) => prev.filter((p) => p.id !== player.id));
      setTeamA((prev) => [...prev, player]);
    }
  };

  const isValid = teamA.length > 0 && teamB.length > 0 && unassigned.length === 0;
  const totalPlayers = players.length;
  const assignedPlayers = teamA.length + teamB.length;

  const handleSave = async () => {
    if (!isValid) {
      toast.error('Formação inválida', {
        description: 'Todos os jogadores devem ser atribuídos a uma equipa',
      });
      return;
    }

    setSaving(true);
    try {
      await onSave(teamA, teamB);
      toast.success('Formação salva com sucesso');
    } catch (err) {
      toast.error('Erro ao salvar formação', {
        description: err instanceof Error ? err.message : 'Erro desconhecido',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="space-y-3">
        <h2 className="text-3xl font-bold text-text-primary">Montar Equipas</h2>
        <p className="text-text-secondary">
          Arraste os jogadores ou use os botões para definir manualmente as equipas.
        </p>
      </div>

      {/* Progress */}
      <div className="bg-surface border border-surface-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text-primary">
            Progresso: {assignedPlayers}/{totalPlayers} jogadores atribuídos
          </span>
          <span className="text-sm text-text-secondary">{Math.round((assignedPlayers / totalPlayers) * 100)}%</span>
        </div>
        <div className="w-full bg-surface-hover rounded-full h-2">
          <div
            className="bg-gradient-to-r from-accent to-accent-bright h-2 rounded-full transition-all duration-300"
            style={{ width: `${(assignedPlayers / totalPlayers) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Equipa A - Brancos */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-text-primary">⚪ Equipa A</h3>
            <Badge variant="outline" className="bg-white/5 text-white">
              {teamA.length}
            </Badge>
          </div>

          <div className="bg-surface border-2 border-surface-border rounded-xl p-4 min-h-96 space-y-2">
            {teamA.length === 0 ? (
              <div className="flex items-center justify-center h-80 text-text-secondary text-sm">
                Nenhum jogador atribuído
              </div>
            ) : (
              teamA.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  team="A"
                  onMove={() => moveToUnassigned(player, 'A')}
                  onSwap={() => swapTeam(player, 'A')}
                  moveLabel="🔄"
                  swapLabel="⬅️"
                />
              ))
            )}
          </div>
        </div>

        {/* Center - Unassigned & Controls */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-text-primary">⬇️ Não Atribuídos</h3>

          <div className="bg-surface border-2 border-accent/30 rounded-xl p-4 min-h-96 space-y-3">
            {unassigned.length === 0 ? (
              <div className="flex items-center justify-center h-80 text-accent text-sm font-medium">
                Todos os jogadores foram atribuídos! ✅
              </div>
            ) : (
              unassigned.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 p-3 bg-surface-hover border border-surface-border rounded-lg hover:border-accent/50 transition group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">{player.name}</p>
                    <p className="text-xs text-text-secondary">⭐ {player.skill_level}/5</p>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => moveToTeamA(player)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-accent/20 text-accent transition-colors"
                      title="Mover para Equipa A"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveToTeamB(player)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-accent/20 text-accent transition-colors"
                      title="Mover para Equipa B"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Equipa B - Coloridos */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-text-primary">🔵 Equipa B</h3>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400">
              {teamB.length}
            </Badge>
          </div>

          <div className="bg-surface border-2 border-surface-border rounded-xl p-4 min-h-96 space-y-2">
            {teamB.length === 0 ? (
              <div className="flex items-center justify-center h-80 text-text-secondary text-sm">
                Nenhum jogador atribuído
              </div>
            ) : (
              teamB.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  team="B"
                  onMove={() => moveToUnassigned(player, 'B')}
                  onSwap={() => swapTeam(player, 'B')}
                  moveLabel="🔄"
                  swapLabel="➡️"
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Validation Alert */}
      {!isValid && unassigned.length > 0 && (
        <Card className="border-accent/50 bg-accent/5">
          <CardContent className="pt-4 flex items-gap-3">
            <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-accent">
                {unassigned.length} jogador{unassigned.length > 1 ? 'es' : ''} ainda não atribuído
                {unassigned.length > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-accent/80 mt-1">
                Atribua todos os jogadores a uma equipa antes de continuar.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer Actions */}
      <div className="flex gap-3 justify-end pt-4">
        <Button
          variant="outline"
          disabled={saving || isLoading}
          className="border-surface-border hover:bg-surface"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={!isValid || saving || isLoading}
          className="bg-gradient-to-r from-accent to-accent-bright hover:from-accent-bright hover:to-accent text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving || isLoading ? 'Salvando...' : 'Salvar Formação'}
        </Button>
      </div>
    </div>
  );
}

interface PlayerCardProps {
  player: RankedPlayer;
  team: 'A' | 'B';
  onMove: () => void;
  onSwap: () => void;
  moveLabel: string;
  swapLabel: string;
}

function PlayerCard({ player, team, onMove, onSwap, moveLabel, swapLabel }: PlayerCardProps) {
  const isGK = player.position === 'GOLEIRO_FIXO';

  return (
    <div className="flex items-center gap-2 p-3 bg-surface-hover border border-surface-border rounded-lg hover:border-accent/50 transition group">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary truncate">
          {isGK ? '🧤 ' : ''} {player.name}
        </p>
        <p className="text-xs text-text-secondary">⭐ {player.skill_level}/5</p>
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onMove}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-destructive/20 text-destructive transition-colors"
          title="Remover da equipa"
        >
          {moveLabel}
        </button>
        <button
          onClick={onSwap}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-accent-secondary/20 text-accent-secondary transition-colors"
          title="Trocar com outra equipa"
        >
          {swapLabel}
        </button>
      </div>
    </div>
  );
}
