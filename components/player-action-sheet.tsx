'use client';

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

interface Props {
  player: Player | null;
  isOnGoal: boolean;
  onClose: () => void;
  onPick: (event: EventType) => void;
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
  const open = player !== null;
  const actions = isOnGoal ? [...GK_ACTIONS, ...BASE_ACTIONS] : BASE_ACTIONS;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
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
          <DialogDescription>Selecione uma ação para registrar</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((a) => {
            const points = EVENT_WEIGHTS[a.type];
            return (
              <Button
                key={a.type}
                variant={a.tone === 'danger' ? 'outline' : 'default'}
                className="h-auto flex-col gap-1 py-3"
                onClick={() => onPick(a.type)}
              >
                <span className="text-sm">{a.label}</span>
                <span className="text-xs opacity-70">
                  {points > 0 ? `+${points}` : points}
                </span>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
