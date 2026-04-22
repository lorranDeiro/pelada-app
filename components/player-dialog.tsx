'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import type { Player, PlayerPosition } from '@/lib/types';

interface Props {
  player?: Player | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

type SkillLevel = 1 | 2 | 3 | 4 | 5;

export function PlayerDialog({ player, open, onOpenChange, onSaved }: Props) {
  const [name, setName] = useState('');
  const [position, setPosition] = useState<PlayerPosition>('JOGADOR');
  const [skill, setSkill] = useState<SkillLevel>(3);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(player?.name ?? '');
      setPosition(player?.position ?? 'JOGADOR');
      setSkill((player?.skill_level ?? 3) as SkillLevel);
    }
  }, [open, player]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const payload = {
      name: name.trim(),
      position,
      skill_level: skill,
    };
    const { error } = player
      ? await supabase.from('players').update(payload).eq('id', player.id)
      : await supabase.from('players').insert(payload);
    setSaving(false);
    if (error) {
      toast.error('Erro ao salvar', { description: error.message });
      return;
    }
    toast.success(player ? 'Jogador atualizado' : 'Jogador adicionado');
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{player ? 'Editar jogador' : 'Novo jogador'}</DialogTitle>
          <DialogDescription>
            {player ? 'Atualize as informações do jogador' : 'Adicione um novo jogador ao elenco'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Posição</Label>
            <Select
              value={position}
              onValueChange={(v) => setPosition(v as PlayerPosition)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="JOGADOR">Jogador de linha</SelectItem>
                <SelectItem value="GOLEIRO_FIXO">🧤 Goleiro fixo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nível técnico (1–5)</Label>
            <Select
              value={String(skill)}
              onValueChange={(v) => setSkill(Number(v) as SkillLevel)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {'★'.repeat(n) + '☆'.repeat(5 - n)} ({n})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Usado no sorteio enquanto não há histórico. Vai sendo substituído pela
              nota real da temporada.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
