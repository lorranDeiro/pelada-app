'use client';

import { useEffect, useState } from 'react';
import { Minus, Plus, Zap, Trophy, Goal, Hand } from 'lucide-react';
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

const SINGLE_USE: Set<EventType> = new Set(['WINNING_GOAL']);

interface Props {
  player: Player | null;
  isOnGoal: boolean;
  onClose: () => void;
  onPick: (event: EventType, quantity: number) => void;
}

const BASE_ACTIONS: { type: EventType; label: string; icon?: React.ReactNode; tone?: 'danger' }[] = [
  { type: 'GOAL', label: 'âš½ Gol', icon: <Goal className="size-4" /> },
  { type: 'WINNING_GOAL', label: 'ðŸ”¥ Gol Decisivo', icon: <Zap className="size-4 text-amber-400" /> },
  { type: 'ASSIST', label: 'ðŸ…°ï¸ AssistÃªncia', icon: <Hand className="size-4" /> },
  { type: 'TACKLE', label: 'ðŸ›¡ï¸ Desarme' },
  { type: 'CREATION', label: 'âœ¨ CriaÃ§Ã£o' },
  { type: 'MISTAKE_LEADING_GOAL', label: 'ðŸ˜¬ Erro que virou gol', tone: 'danger' },
  { type: 'OWN_GOAL', label: 'ðŸ¤¦ Gol contra', tone: 'danger' },
];

const GK_ACTIONS: { type: EventType; label: string; icon?: React.ReactNode; tone?: 'danger' }[] = [
  { type: 'SAVE', label: 'ðŸ§¤ Defesa', icon: <Trophy className="size-4 text-emerald-400" /> },
  { type: 'PENALTY_SAVE', label: 'ðŸ§¤ PÃªnalti defendido' },
  { type: 'GOAL_CONCEDED_GK', label: 'ðŸ˜£ Sofreu gol', tone: 'danger' },
];

export function PlayerActionSheet({ player, isOnGoal, onClose, onPick }: Props) {
  const [selectedAction, setSelectedAction] = useState<{ type: EventType; label: string; tone?: 'danger' } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const open = player !== null;
  const actions = isOnGoal ? [...GK_ACTIONS, ...BASE_ACTIONS] : BASE_ACTIONS;

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
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none bg-transparent shadow-none ring-0">
        <div className="bg-popover rounded-t-3xl p-6 pb-8 animate-in slide-in-from-bottom-full duration-300">
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted-foreground/20" />
          
          <DialogHeader className="mb-6">
            <DialogTitle className="text-center text-xl">
              {player ? (
                <span className="flex items-center justify-center gap-2">
                  {isOnGoal && <span className="text-emerald-500">ðŸ§¤</span>}
                  {player.name}
                </span>
              ) : null}
            </DialogTitle>
            <DialogDescription className="text-center">
              {selectedAction ? 'Defina a quantidade' : 'Registrar evento'}
            </DialogDescription>
          </DialogHeader>

          {!selectedAction ? (
            <div className="grid grid-cols-2 gap-3">
              {actions.map((a) => {
                const points = EVENT_WEIGHTS[a.type];
                return (
                  <Button
                    key={a.type}
                    variant={a.tone === 'danger' ? 'outline' : 'secondary'}
                    className="h-auto flex-col gap-2 py-4 rounded-2xl border-2 border-transparent active:border-primary/20 active:scale-95 transition-all"
                    onClick={() => handleActionTap(a)}
                  >
                    <div className="flex items-center gap-2">
                      {a.icon}
                      <span className="font-semibold">{a.label}</span>
                    </div>
                    <span className="text-xs font-mono opacity-60 tabular-nums">
                      {points > 0 ? `+${points.toFixed(1)}` : points.toFixed(1)} pts
                    </span>
                  </Button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-8 py-4">
              <div className="flex flex-col items-center justify-center gap-6">
                <span className="text-xl font-bold text-primary">{selectedAction.label}</span>
                <div className="flex items-center gap-8">
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-14 rounded-full border-2"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="size-6" />
                  </Button>
                  <span className="text-6xl font-black tabular-nums min-w-[5rem] text-center tracking-tighter">{quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-14 rounded-full border-2 border-primary/20 bg-primary/5"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="size-6 text-primary" />
                  </Button>
                </div>
                <div className="rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-muted-foreground">
                  Valor total: <span className="text-primary tabular-nums">{previewPoints > 0 ? `+${previewPoints.toFixed(1)}` : previewPoints.toFixed(1)}</span>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <Button variant="ghost" className="h-14 flex-1 rounded-2xl font-semibold" onClick={() => setSelectedAction(null)}>
                  Voltar
                </Button>
                <Button
                  variant={selectedAction.tone === 'danger' ? 'destructive' : 'default'}
                  className="h-14 flex-1 rounded-2xl font-bold text-base shadow-lg shadow-primary/20"
                  onClick={handleConfirm}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
