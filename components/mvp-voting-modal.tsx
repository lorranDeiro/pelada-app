'use client';

import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  registerMvpVote,
  fetchMvpVoteResults,
  getUserMvpVote,
} from '@/lib/mvp-voting';
import { supabase } from '@/lib/supabase';
import type { Player } from '@/lib/types';

interface MvpVotingModalProps {
  open: boolean;
  matchId: string;
  candidates: Player[];
}

export function MvpVotingModal({ open, matchId, candidates }: MvpVotingModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [votes, setVotes] = useState<Map<string, number>>(new Map());
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (!open) return;

    (async () => {
      try {
        // Fetch current votes
        const results = await fetchMvpVoteResults(matchId);
        const voteMap = new Map(results.map((r) => [r.player_id, r.vote_count]));
        setVotes(voteMap);

        // Check if current user already voted
        const { data: user } = await supabase.auth.getUser();
        if (user.user?.id) {
          const userVote = await getUserMvpVote(matchId, user.user.id);
          if (userVote) {
            setSelectedId(userVote);
            setHasVoted(true);
          }
        }
      } catch (e) {
        toast.error('Erro ao carregar votos', {
          description: e instanceof Error ? e.message : String(e),
        });
      }
    })();
  }, [open, matchId]);

  async function handleVote() {
    if (!selectedId) {
      toast.error('Selecione um jogador para votar');
      return;
    }

    setSubmitting(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.id) throw new Error('Usuário não autenticado');

      await registerMvpVote({
        matchId,
        votingUserId: user.user.id,
        votePlayerId: selectedId,
      });

      toast.success('Voto registrado!');
      setHasVoted(true);

      // Refresh vote counts
      const results = await fetchMvpVoteResults(matchId);
      const voteMap = new Map(results.map((r) => [r.player_id, r.vote_count]));
      setVotes(voteMap);
    } catch (e) {
      toast.error('Erro ao registrar voto', {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="size-5 text-yellow-500" /> MVP da Partida
          </DialogTitle>
          <DialogDescription>
            Votação aberta por 5 minutos. Escolha o melhor jogador!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {candidates.map((player) => {
            const voteCount = votes.get(player.id) ?? 0;
            const isSelected = selectedId === player.id;

            return (
              <Button
                key={player.id}
                variant={isSelected ? 'default' : 'outline'}
                className="h-auto w-full flex-col items-start justify-start gap-1 py-3 text-left"
                onClick={() => setSelectedId(player.id)}
                disabled={submitting}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-medium">{player.name}</span>
                  {voteCount > 0 && (
                    <Badge variant="secondary">
                      {voteCount} {voteCount === 1 ? 'voto' : 'votos'}
                    </Badge>
                  )}
                </div>
              </Button>
            );
          })}
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            disabled={submitting}
            onClick={() => setSelectedId(null)}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={handleVote}
            disabled={!selectedId || submitting}
          >
            {submitting ? 'Votando…' : hasVoted ? 'Mudar voto' : 'Votar'}
          </Button>
        </div>

        {hasVoted && (
          <p className="text-center text-xs text-muted-foreground">
            Seu voto em {candidates.find((p) => p.id === selectedId)?.name} foi registrado.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
