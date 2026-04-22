'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Player } from '@/lib/types';

interface Props {
  open: boolean;
  teamName: string;
  players: Player[];
  currentGkId: string | null;
  onClose: () => void;
  onPick: (playerId: string) => void;
}

export function GkPickerDialog({
  open,
  teamName,
  players,
  currentGkId,
  onClose,
  onPick,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Trocar goleiro • {teamName}</DialogTitle>
          <DialogDescription>Selecione um jogador para ser o goleiro</DialogDescription>
        </DialogHeader>
        <ul className="space-y-1">
          {players.map((p) => {
            const isCurrent = p.id === currentGkId;
            return (
              <li key={p.id}>
                <Button
                  variant={isCurrent ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => !isCurrent && onPick(p.id)}
                  disabled={isCurrent}
                >
                  {isCurrent && <span>🧤</span>}
                  <span className="truncate">{p.name}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
