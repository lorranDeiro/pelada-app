'use client';

import { useEffect, useState } from 'react';
import { Trash2, Info } from 'lucide-react';
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
import { PlayerAvatar } from '@/components/player-avatar';
import { supabase } from '@/lib/supabase';
import type { Player, PlayerPosition } from '@/lib/types';

interface Props {
  player?: Player | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

type SkillLevel = 1 | 2 | 3 | 4 | 5;

interface PlayerUpdatePayload {
  name: string;
  position: PlayerPosition;
  skill_level: SkillLevel;
  photo_url?: string | null;
}

export function PlayerDialog({ player, open, onOpenChange, onSaved }: Props) {
  const [name, setName] = useState('');
  const [position, setPosition] = useState<PlayerPosition>('JOGADOR');
  const [skill, setSkill] = useState<SkillLevel>(3);
  const [saving, setSaving] = useState(false);
  const [photoFilename, setPhotoFilename] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(player?.name ?? '');
      setPosition(player?.position ?? 'JOGADOR');
      setSkill((player?.skill_level ?? 3) as SkillLevel);
      setPhotoFilename(player?.photo_url ?? null);
    }
  }, [open, player]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    const payload: PlayerUpdatePayload = {
      name: name.trim(),
      position,
      skill_level: skill,
    };

    // photo_url só vai no UPDATE — Insert respeita o default da coluna
    if (player) {
      payload.photo_url = photoFilename || null;
    }

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
            {player
              ? 'Atualize as informações do jogador'
              : 'Adicione um novo jogador ao elenco'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {player && (
            <div className="flex items-center gap-3">
              <PlayerAvatar
                name={name || player.name}
                photoUrl={photoFilename}
                size={64}
              />
              <div className="flex flex-col gap-2 flex-1">
                <div className="space-y-1">
                  <Label htmlFor="photoFilename" className="text-xs">
                    Arquivo de Foto (ex: neymar.png)
                  </Label>
                  <Input
                    id="photoFilename"
                    placeholder="neymar.png"
                    value={photoFilename || ''}
                    onChange={(e) => setPhotoFilename(e.target.value || null)}
                    className="text-sm"
                  />
                  <p className="text-xs text-text-secondary">
                    Coloque a imagem em <code className="bg-gray-100 px-1 rounded">public/players/</code>
                  </p>
                </div>
                {photoFilename && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setPhotoFilename(null)}
                    className="gap-1 text-destructive justify-start"
                  >
                    <Trash2 className="size-3.5" />
                    Remover foto
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
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
                <SelectItem value="JOGADOR">Jogador</SelectItem>
                <SelectItem value="GOLEIRO_FIXO">Goleiro Fixo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nível de Habilidade</Label>
            <Select
              value={skill.toString()}
              onValueChange={(v) => setSkill(parseInt(v) as SkillLevel)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((s) => (
                  <SelectItem key={s} value={s.toString()}>
                    {'⭐'.repeat(s)} {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-1">
            <div className="flex gap-2">
              <Info className="size-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900">
                <p className="font-semibold mb-1">💡 Como adicionar fotos:</p>
                <ol className="space-y-1 list-decimal list-inside">
                  <li>Salve a imagem em <code className="bg-white px-1">public/players/neymar.png</code></li>
                  <li>Digite o nome do arquivo acima (ex: <code className="bg-white px-1">neymar.png</code>)</li>
                  <li>Salve o jogador</li>
                </ol>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
