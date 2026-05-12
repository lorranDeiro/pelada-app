'use client';

import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EVENT_WEIGHTS } from '@/lib/scoring';
import type { EventType, Player } from '@/lib/types';

// Eventos onde "quantidade > 1" não faz sentido (no máximo um por partida).
// Para esses, o passo de quantidade é pulado.
const SINGLE_USE: Set<EventType> = new Set(['WINNING_GOAL']);

interface Props {
  player: Player | null;
  isOnGoal: boolean;
  onClose: () => void;
  onPick: (event: EventType, quantity: number) => void;
}

const BASE_ACTIONS: { type: EventType; label: string; tone?: 'danger' }[] = [
  { type: 'GOAL', label: '⚽ Gol' },
  { type: 'WINNING_GOAL', label: '🔥 Gol Decisivo' },
  { type: 'ASSIST', label: '🅰️ Assistência' },
  { type: 'TACKLE', label: '🛡️ Desarme' },
  { type: 'CREATION', label: '✨ Criação' },
  { type: 'MISTAKE_LEADING_GOAL', label: '😬 Erro que virou gol', tone: 'danger' },
  { type: 'OWN_GOAL', label: '🤦 Gol contra', tone: 'danger' },
];

const GK_ACTIONS: { type: EventType; label: string; tone?: 'danger' }[] = [
  { type: 'SAVE', label: '🧤 Defesa' },
  { type: 'PENALTY_SAVE', label: '🧤 Pênalti defendido' },
  { type: 'GOAL_CONCEDED_GK', label: '😣 Sofreu gol', tone: 'danger' },
];

export function PlayerActionSheet({ player, isOnGoal, onClose, onPick }: Props) {
  const [selectedAction, setSelectedAction] = useState<{ type: EventType; label: string; tone?: 'danger' } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const open = player !== null;
  const actions = isOnGoal ? [...GK_ACTIONS, ...BASE_ACTIONS] : BASE_ACTIONS;

  // Reseta estado interno sempre que o sheet fecha (player === null),
  // pra próxima abertura não herdar a ação/quantidade da anterior.
  useEffect(() => {
    if (!player) {
      setSelectedAction(null);
      setQuantity(1);
    }
  }, [player]);

  function handleClose() {
    setSelectedAction(null);
    setQuantity(1);
    onClose();
  }

  function handleActionTap(a: { type: EventType; label: string; tone?: 'danger' }) {
    if (SINGLE_USE.has(a.type)) {
      // Eventos únicos por partida (ex.: Gol Decisivo) não precisam do
      // passo de quantidade — dispara direto.
      onPick(a.type, 1);
      handleClose();
      return;
    }
    setSelectedAction(a);
    setQuantity(1);
  }

  function handleConfirm() {
    if (selectedAction) {
      onPick(selectedAction.type, quantity);
      handleClose();
    }
  }

  const previewPoints = selectedAction
    ? EVENT_WEIGHTS[selectedAction.type] * quantity
    : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {player ? (
              <span className="flex items-center gap-2">
                {isOnGoal && <span>🧤</span>}
                {player.name}
              </span>
            ) : null}
          </DialogTitle>
          <DialogDescription>
            {selectedAction ? 'Quantidade' : 'Selecione uma ação para registrar'}
          </DialogDescription>
        </DialogHeader>

        {!selectedAction ? (
          <div className="grid grid-cols-2 gap-2">
            {actions.map((a) => {
              const points = EVENT_WEIGHTS[a.type];
              return (
                <Button
                  key={a.type}
                  variant={a.tone === 'danger' ? 'outline' : 'default'}
                  className="h-auto flex-col gap-1 py-3"
                  onClick={() => handleActionTap(a)}
                >
                  <span className="text-sm">{a.label}</span>
                  <span className="text-xs opacity-70">
                    {points > 0 ? `+${points}` : points}
                  </span>
                </Button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-6 py-4">
            <div className="flex flex-col items-center justify-center gap-4">
              <span className="text-lg font-medium">{selectedAction.label}</span>
              <div className="flex items-center gap-6">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  aria-label="Diminuir"
                >
                  <Minus className="size-5" />
                </Button>
                <span className="text-4xl font-bold tabular-nums w-12 text-center">{quantity}</span>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setQuantity(quantity + 1)}
                  aria-label="Aumentar"
                >
                  <Plus className="size-5" />
                </Button>
              </div>
              <span className="text-xs tabular-nums text-muted-foreground">
                Total: {previewPoints > 0 ? `+${previewPoints.toFixed(1)}` : previewPoints.toFixed(1)} pts
              </span>
            </div>
            
            <div className="flex gap-2 w-full mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedAction(null)}>
                Voltar
              </Button>
              <Button 
                variant={selectedAction.tone === 'danger' ? 'destructive' : 'default'} 
                className="flex-1" 
                onClick={handleConfirm}
              >
                Confirmar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
