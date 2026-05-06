'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { RequireAuth } from '@/components/require-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import type { Match, Player } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MatchWithMVP extends Match {
  mvp?: Player | null;
}

export default function AdminMatchesPage() {
  return (
    <RequireAuth>
      <AdminMatchesContent />
    </RequireAuth>
  );
}

function AdminMatchesContent() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<MatchWithMVP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/jogador');
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;

    const loadMatches = async () => {
      setIsLoading(true);
      try {
        // Busca season ativa
        const { data: seasonData } = await supabase
          .from('seasons')
          .select('*')
          .eq('active', true)
          .single();

        if (!seasonData) {
          setIsLoading(false);
          return;
        }

        // Busca partidas finalizadas
        const { data: matchesData, error } = await supabase
          .from('matches')
          .select('*')
          .eq('season_id', seasonData.id)
          .eq('status', 'FINISHED')
          .order('played_at', { ascending: false });

        if (error) throw error;

        // Busca MVPs
        const mvpIds = (matchesData || [])
          .map((m) => m.mvp_player_id)
          .filter(Boolean) as string[];

        let mvpsByIdMap = new Map<string, Player>();

        if (mvpIds.length > 0) {
          const { data: mvpPlayers } = await supabase
            .from('players')
            .select('*')
            .in('id', mvpIds);

          if (mvpPlayers) {
            mvpsByIdMap = new Map(mvpPlayers.map((p) => [p.id, p as Player]));
          }
        }

        const matchesWithMvp: MatchWithMVP[] = (matchesData || []).map((m) => ({
          ...m,
          mvp: m.mvp_player_id ? mvpsByIdMap.get(m.mvp_player_id) : null,
        }));

        setMatches(matchesWithMvp);
      } catch (err) {
        console.error('Erro ao carregar partidas:', err);
        toast.error('Erro ao carregar partidas');
      } finally {
        setIsLoading(false);
      }
    };

    loadMatches();
  }, [isAdmin]);

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Tem certeza que quer deletar esta partida?')) return;

    setDeleting(matchId);
    try {
      // Deleta em cascata: events, attendances, gk_shifts, pmr
      await Promise.all([
        supabase.from('match_events').delete().eq('match_id', matchId),
        supabase.from('match_attendances').delete().eq('match_id', matchId),
        supabase.from('gk_shifts').delete().eq('match_id', matchId),
        supabase
          .from('player_match_results')
          .delete()
          .eq('match_id', matchId),
        supabase.from('matches').delete().eq('id', matchId),
      ]);

      setMatches((prev) => prev.filter((m) => m.id !== matchId));
      toast.success('Partida deletada');
    } catch (err) {
      console.error('Erro ao deletar:', err);
      toast.error('Erro ao deletar partida');
    } finally {
      setDeleting(null);
    }
  };

  if (loading || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-text-secondary">
        Carregando…
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-premium text-text-primary">
        <div className="mx-auto w-full max-w-4xl px-4 py-8">
          <Link
            href="/admin"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-text-secondary transition hover:text-accent-bright"
          >
            <ArrowLeft className="size-4" /> Voltar
          </Link>
          <div className="flex items-center justify-center py-8">
            <p className="text-text-secondary">Carregando partidas…</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-premium text-text-primary">
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        {/* Header */}
        <Link
          href="/admin"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-text-secondary transition hover:text-accent-bright"
        >
          <ArrowLeft className="size-4" /> Voltar ao painel
        </Link>

        <header className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold">Gerenciar Partidas</h1>
          <p className="text-text-secondary">
            Edite ou delete partidas finalizadas. Clique em uma partida para mais opções.
          </p>
        </header>

        {/* Matches List */}
        {matches.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-text-secondary">
              Nenhuma partida finalizada nesta temporada.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => (
              <Card
                key={match.id}
                className="p-4 hover:shadow-md transition space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Score */}
                  <div className="flex-1 space-y-2">
                    <div className="text-sm text-text-secondary">
                      {format(new Date(match.played_at), 'dd MMM yyyy HH:mm', {
                        locale: ptBR,
                      })}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 text-right">
                        <div className="font-semibold text-text-primary">
                          {match.team_a_name}
                        </div>
                        <div className="text-2xl font-bold text-accent">
                          {match.score_a}
                        </div>
                      </div>
                      <div className="text-text-secondary">×</div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-text-primary">
                          {match.team_b_name}
                        </div>
                        <div className="text-2xl font-bold text-accent-secondary">
                          {match.score_b}
                        </div>
                      </div>
                    </div>

                    {/* MVP */}
                    {match.mvp && (
                      <div className="inline-flex items-center gap-1.5 text-xs bg-accent/10 px-2 py-1 rounded text-accent-bright">
                        ⭐ MVP: {match.mvp.name}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/admin/partidas/${match.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                      >
                        <Edit2 className="size-4" />
                        Editar
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteMatch(match.id)}
                      disabled={deleting === match.id}
                      className="gap-2"
                    >
                      <Trash2 className="size-4" />
                      {deleting === match.id ? 'Deletando…' : 'Deletar'}
                    </Button>
                  </div>
                </div>

                {/* Notes */}
                {match.notes && (
                  <div className="border-t border-fs-border pt-3">
                    <p className="text-xs text-text-secondary mb-1">Anotações:</p>
                    <p className="text-sm text-text-primary">{match.notes}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
