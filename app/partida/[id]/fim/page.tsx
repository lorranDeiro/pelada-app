'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { AppNav } from '@/components/app-nav';
import { RequireAuth } from '@/components/require-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MatchEditBanner } from '@/components/match-edit-banner';
import { MvpVotingModal } from '@/components/mvp-voting-modal';
import { fetchEvents } from '@/lib/events';
import { buildPlayerMatchResult, outcomeFor } from '@/lib/scoring';
import { finalizeMatch } from '@/lib/matches';
import { isAdmin, recomputeMatch, logMatchEdit } from '@/lib/admin';
import { supabase } from '@/lib/supabase';
import type { Match, MatchAttendance, MatchEvent, Player } from '@/lib/types';

interface Props {
  params: Promise<{ id: string }>;
}

type RosterPlayer = Player & { team: 1 | 2 };

export default function FimPage({ params }: Props) {
  const { id } = use(params);
  return (
    <RequireAuth>
      <AppNav />
      <FimLoader matchId={id} />
    </RequireAuth>
  );
}

function FimLoader({ matchId }: { matchId: string }) {
  const [match, setMatch] = useState<Match | null>(null);
  const [roster, setRoster] = useState<RosterPlayer[] | null>(null);
  const [events, setEvents] = useState<MatchEvent[] | null>(null);
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  const checkAdmin = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (user.user?.id) {
      const admin = await isAdmin(user.user.id);
      setUserIsAdmin(admin);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { data: matchData, error: matchErr } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();
      if (matchErr || !matchData) {
        toast.error('Partida não encontrada');
        return;
      }
      setMatch(matchData as Match);

      const { data: attendances, error: attErr } = await supabase
        .from('match_attendances')
        .select('team, player_id, players(*)')
        .eq('match_id', matchId);
      if (attErr) {
        toast.error('Erro ao carregar elenco', { description: attErr.message });
        return;
      }
      const rows = (attendances ?? []).map((a) => {
        const rel = a as unknown as MatchAttendance & { players: Player };
        return { ...rel.players, team: rel.team };
      });
      setRoster(rows);

      try {
        setEvents(await fetchEvents(matchId));
      } catch (e) {
        toast.error('Erro ao carregar eventos', {
          description: e instanceof Error ? e.message : String(e),
        });
      }

      await checkAdmin();
    })();
  }, [matchId, checkAdmin]);

  if (!match || !roster || !events) {
    return <main className="p-4 text-sm text-muted-foreground">Carregando…</main>;
  }

  if (match.status === 'FINISHED') {
    return <AlreadyFinished match={match} roster={roster} userIsAdmin={userIsAdmin} />;
  }

  return <FimForm match={match} roster={roster} events={events} />;
}

function AlreadyFinished({
  match,
  roster,
  userIsAdmin,
}: {
  match: Match;
  roster: RosterPlayer[];
  userIsAdmin: boolean;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showVotingModal, setShowVotingModal] = useState(true);
  const [votingOpen, setVotingOpen] = useState(false);

  useEffect(() => {
    // Check if voting window is still open (5 minutes)
    const checkVotingWindow = async () => {
      try {
        const { data: matchData } = await supabase
          .from('matches')
          .select('status, created_at')
          .eq('id', match.id)
          .single();

        if (!matchData) return;

        const finishedAt = new Date(matchData.created_at);
        const now = new Date();
        const elapsedMs = now.getTime() - finishedAt.getTime();
        const votingWindowMs = 5 * 60 * 1000;

        setVotingOpen(elapsedMs < votingWindowMs);
      } catch (e) {
        // Silently fail
      }
    };

    checkVotingWindow();
  }, [match.id]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="size-5" /> Partida finalizada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Placar final: <strong>{match.team_a_name}</strong> {match.score_a} ×{' '}
            {match.score_b} <strong>{match.team_b_name}</strong>
          </p>

          {votingOpen && (
            <div className="rounded-md bg-amber-50 p-3 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
              <p className="text-xs font-medium">
                🗳️ A votação de MVP está aberta por 5 minutos!
              </p>
            </div>
          )}

          {userIsAdmin && (
            <div className="flex gap-2 pt-2">
              <Button asChild>
                <Link href="/">Ver ranking</Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                Editar partida
              </Button>
            </div>
          )}

          {!userIsAdmin && (
            <Button asChild>
              <Link href="/">Ver ranking</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Modal/Dialog para edição */}
      {isEditing && userIsAdmin && (
        <EditMatchDialog
          match={match}
          onClose={() => setIsEditing(false)}
          onSaved={() => {
            setIsEditing(false);
            router.refresh();
          }}
        />
      )}

      {votingOpen && showVotingModal && (
        <MvpVotingModal open={true} matchId={match.id} candidates={roster} />
      )}
    </main>
  );
}

interface EditMatchDialogProps {
  match: Match;
  onClose: () => void;
  onSaved: () => void;
}

function EditMatchDialog({ match, onClose, onSaved }: EditMatchDialogProps) {
  const router = useRouter();
  const [scoreA, setScoreA] = useState(match.score_a);
  const [scoreB, setScoreB] = useState(match.score_b);
  const [submitting, setSubmitting] = useState(false);

  async function saveChanges() {
    setSubmitting(true);
    try {
      const { data: user } = await supabase.auth.getUser();

      // Log before state
      await logMatchEdit(
        match.id,
        user.user?.id || null,
        'score_changed',
        { score_a: match.score_a, score_b: match.score_b },
        { score_a: scoreA, score_b: scoreB }
      );

      // Update match
      const { error: updateErr } = await supabase
        .from('matches')
        .update({
          score_a: scoreA,
          score_b: scoreB,
        })
        .eq('id', match.id);
      if (updateErr) throw updateErr;

      // Recalculate player results
      const result = await recomputeMatch(match.id);
      if (result) {
        toast.success(`Partida recalculada — ${result.updated_count} jogadores atualizados`);
      } else {
        toast.warning('Recálculo completado com aviso');
      }

      onSaved();
    } catch (e) {
      toast.error('Erro ao salvar alterações', {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="fixed inset-4 z-50 max-w-sm mx-auto my-auto overflow-y-auto">
      <CardHeader>
        <CardTitle>Editar placar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <MatchEditBanner isEditing={true} />

        <div>
          <label className="text-sm font-medium">{match.team_a_name}</label>
          <input
            type="number"
            min="0"
            value={scoreA}
            onChange={(e) => setScoreA(parseInt(e.target.value) || 0)}
            className="mt-1 w-full rounded border px-2 py-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium">{match.team_b_name}</label>
          <input
            type="number"
            min="0"
            value={scoreB}
            onChange={(e) => setScoreB(parseInt(e.target.value) || 0)}
            className="mt-1 w-full rounded border px-2 py-1"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={saveChanges}
            disabled={submitting}
          >
            {submitting ? 'Salvando…' : 'Salvar alterações'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FimForm({
  match,
  roster,
  events,
}: {
  match: Match;
  roster: RosterPlayer[];
  events: MatchEvent[];
}) {
  const router = useRouter();
  const [scoreA, setScoreA] = useState(match.score_a);
  const [scoreB, setScoreB] = useState(match.score_b);
  const [mvpId, setMvpId] = useState<string | null>(match.mvp_player_id);
  const [submitting, setSubmitting] = useState(false);

  const isDraw = scoreA === scoreB;
  const winningTeam: 1 | 2 | null = scoreA > scoreB ? 1 : scoreB > scoreA ? 2 : null;
  const mvpCandidates = useMemo(
    () => (winningTeam ? roster.filter((p) => p.team === winningTeam) : roster),
    [roster, winningTeam]
  );

  useEffect(() => {
    if (mvpId && !mvpCandidates.some((p) => p.id === mvpId)) {
      setMvpId(null);
    }
  }, [mvpId, mvpCandidates]);

  async function finalize() {
    setSubmitting(true);
    try {
      await finalizeMatch(match, roster, events, scoreA, scoreB, mvpId);
      toast.success('Partida finalizada!');
      router.push('/');
    } catch (e) {
      toast.error('Erro ao finalizar', {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-4 pb-24">
      <h1 className="text-2xl font-semibold">Finalizar partida</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Placar final</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2">
            <ScoreEditor
              name={match.team_a_name}
              value={scoreA}
              onChange={setScoreA}
            />
            <span className="text-2xl text-muted-foreground">×</span>
            <ScoreEditor
              name={match.team_b_name}
              value={scoreB}
              onChange={setScoreB}
            />
          </div>
          {isDraw && (
            <p className="mt-3 text-center text-sm text-muted-foreground">
              Empate — sem MVP obrigatório
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="size-4" /> MVP
            {!isDraw && (
              <Badge variant="outline" className="ml-auto">
                {winningTeam === 1 ? match.team_a_name : match.team_b_name}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            <li>
              <Button
                variant={mvpId === null ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setMvpId(null)}
              >
                Sem MVP
              </Button>
            </li>
            {mvpCandidates.map((p) => (
              <li key={p.id}>
                <Button
                  variant={mvpId === p.id ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setMvpId(p.id)}
                >
                  {mvpId === p.id && <Trophy className="size-4" />}
                  <span className="truncate">{p.name}</span>
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="fixed inset-x-0 bottom-0 border-t bg-background p-3">
        <div className="mx-auto flex max-w-3xl gap-2">
          <Button variant="outline" className="flex-1" asChild disabled={submitting}>
            <Link href={`/partida/${match.id}`}>← Voltar</Link>
          </Button>
          <Button className="flex-1" onClick={finalize} disabled={submitting}>
            {submitting ? 'Gravando…' : 'Confirmar e finalizar'}
          </Button>
        </div>
      </div>
    </main>
  );
}

function ScoreEditor({
  name,
  value,
  onChange,
}: {
  name: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <span className="text-xs text-muted-foreground">{name}</span>
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label="-1"
        >
          <Minus className="size-4" />
        </Button>
        <span className="min-w-8 text-center text-3xl font-bold tabular-nums">
          {value}
        </span>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onChange(value + 1)}
          aria-label="+1"
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}
