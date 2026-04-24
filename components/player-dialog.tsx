'use client';

import { useEffect, useRef, useState } from 'react';
import { Trash2, Upload } from 'lucide-react';
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
import { deletePlayerPhoto, uploadPlayerPhoto } from '@/lib/photos';
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
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setName(player?.name ?? '');
      setPosition(player?.position ?? 'JOGADOR');
      setSkill((player?.skill_level ?? 3) as SkillLevel);
      setPhotoUrl(player?.photo_url ?? null);
    }
  }, [open, player]);

  async function handlePhotoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !player) return;
    setUploading(true);
    try {
      const url = await uploadPlayerPhoto(player.id, file);
      setPhotoUrl(url);
      toast.success('Foto atualizada');
    } catch (err) {
      toast.error('Erro ao enviar foto', {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setUploading(false);
    }
  }

  async function handlePhotoRemove() {
    if (!player || !photoUrl) return;
    if (!confirm('Remover a foto do jogador?')) return;
    setUploading(true);
    try {
      await deletePlayerPhoto(player.id, photoUrl);
      setPhotoUrl(null);
      toast.success('Foto removida');
    } catch (err) {
      toast.error('Erro ao remover', {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setUploading(false);
    }
  }

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
          {player && (
            <div className="flex items-center gap-3">
              <PlayerAvatar name={name || player.name} photoUrl={photoUrl} size={64} />
              <div className="flex flex-col gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoPick}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="gap-1"
                >
                  <Upload className="size-3.5" />
                  {uploading ? 'Enviando…' : photoUrl ? 'Trocar foto' : 'Enviar foto'}
                </Button>
                {photoUrl && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handlePhotoRemove}
                    disabled={uploading}
                    className="gap-1 text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                    Remover
                  </Button>
                )}
              </div>
            </div>
          )}

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
