'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Minus, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AppNav } from '@/components/app-nav';
import { RequireAuth } from '@/components/require-auth';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { isAdmin, logMatchEdit, recomputeMatch } from '@/lib/admin';
import { deleteEvent, fetchEvents, insertEvent } from '@/lib/events';
import type {
  EventType,
  Match,
  MatchAttendance,
  MatchEvent,
  Player,
} from '@/lib/types';

const EVENT_LABELS: Record<EventType, string> = {
  GOAL: '⚽ Gol',
  WINNING_GOAL: '🔥 Gol Decisivo',
  ASSIST: '🅰️ Assistência',
  SAVE: '🧤 Defesa',
  PENALTY_SAVE: '🧤 Defesa de pênalti',
  TACKLE: '🛡️ Desarme',
  CREATION: '✨ Criação',
  MISTAKE_LEADING_GOAL: '😬 Erro no gol',
  OWN_GOAL: '🤦 Gol contra',
  GOAL_CONCEDED_GK: '😣 Sofreu gol',
};

type RosterPlayer = Player & { team: 1 | 2 };

interface Props {
  params: Promise<{ id: string }>;
}

export default function AdminEditMatchPage({ params }: Props) {
  const { id } = use(params);
  return (
    <RequireAuth>
      <AppNav />
      <AdminGate matchId={id} />
    </RequireAuth>
  );
}

function AdminGate({ matchId }: { matchId: string }) {
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (loading) return;
    (async () => {
      const ok = await isAdmin(user?.id);
      setAllowed(ok);
      setChecking(false);
    })();
  }, [user?.id, loading]);

  if (loading || checking) {
    return <main className="p-4 text-sm text-muted-foreground">Verificando permissões…</main>;
  }
  if (!allowed) {
    return (
      <main className="mx-auto w-full max-w-3xl p-4">
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Acesso restrito a administradores.
          </CardContent>
        </Card>
      </main>
    );
  }
  return <EditMatch matchId={matchId} adminId={user?.id ?? null} />;
}

function EditMatch({ matchId, adminId }: { matchId: string; adminId: string | null }) {
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [originalMatch, setOriginalMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [saving, setSaving] = useState(false);
  const [addPlayerId, setAddPlayerId] = useState<string>('');
  const [addEventType, setAddEventType] = useState<EventType>('GOAL');

  const playersById = useMemo(
    () => new Map(roster.map((p) => [p.id, p])),
    [roster]
  );

  const load = useCallback(async () => {
    const { data: matchData, error: matchErr } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();
    if (matchErr || !matchData) {
      toast.error('Partida não encontrada');
      return;
    }
    if (matchData.status !== 'FINISHED') {
      toast.error('Esta partida ainda não foi finalizada');
      router.replace(`/partida/${matchId}`);
      return;
    }
    setMatch(matchData as Match);
    setOriginalMatch(matchData as Match);

    const { data: attendances } = await supabase
      .from('match_attendances')
      .select('team, player_id, players(*)')
      .eq('match_id', matchId);

    const rosterRows = (attendances ?? []).map((a) => {
      const rel = a as unknown as MatchAttendance & { players: Player };
      return { ...rel.players, team: rel.team };
    });
    setRoster(rosterRows);
    if (rosterRows.length > 0) setAddPlayerId(rosterRows[0].id);

    try {
      const evs = await fetchEvents(matchId);
      setEvents(evs);
    } catch (e) {
      toast.error('Erro ao carregar eventos', {
        description: e instanceof Error ? e.message : String(e),
      });
    }
  }, [matchId, router]);

  useEffect(() => {
    load();
  }, [load]);

  function changeScore(team: 1 | 2, delta: 1 | -1) {
    if (!match) return;
    const field = team === 1 ? 'score_a' : 'score_b';
    const current = team === 1 ? match.score_a : match.score_b;
    const next = Math.max(0, current + delta);
    setMatch({ ...match, [field]: next });
  }

  async function handleAddEvent() {
    if (!addPlayerId) return;
    const player = playersById.get(addPlayerId);
    if (!player) return;
    try {
      const newEvent = await insertEvent({
        match_id: matchId,
        player_id: player.id,
        team: player.team,
        event_type: addEventType,
      });
      setEvents((prev) => [newEvent, ...prev]);
      await logMatchEdit(matchId, adminId, 'event_added', null, newEvent);
      toast.success(`${EVENT_LABELS[addEventType]} • ${player.name}`);
    } catch (e) {
      toast.error('Erro ao adicionar evento', {
        description: e instanceof Error ? e.message : String(e),
      });
    }
  }

  async function handleDeleteEvent(ev: MatchEvent) {
    if (!confirm('Remover este evento?')) return;
    try {
      await deleteEvent(ev.id);
      setEvents((prev) => prev.filter((e) => e.id !== ev.id));
      await logMatchEdit(matchId, adminId, 'event_removed', ev, null);
    } catch (e) {
      toast.error('Erro ao remover evento', {
        description: e instanceof Error ? e.message : String(e),
      });
    }
  }

  async function handleSave() {
    if (!match || !originalMatch) return;
    setSaving(true);
    try {
      const scoreChanged =
        match.score_a !== originalMatch.score_a ||
        match.score_b !== originalMatch.score_b;

      if (scoreChanged) {
        const { error } = await supabase
          .from('matches')
          .update({ score_a: match.score_a, score_b: match.score_b })
          .eq('id', matchId);
        if (error) throw error;
        await logMatchEdit(
          matchId,
          adminId,
          'score_changed',
          { score_a: originalMatch.score_a, score_b: originalMatch.score_b },
          { score_a: match.score_a, score_b: match.score_b }
        );
      }

      const result = await recomputeMatch(matchId);
      if (!result) {
        throw new Error('Falha no recomputo dos resultados');
      }

      setOriginalMatch(match);
      toast.success('Alterações salvas', {
        description: `${result.updated_count} resultado(s) recalculados`,
      });
    } catch (e) {
      toast.error('Erro ao salvar', {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSaving(false);
    }
  }

  if (!match) {
    return <main className="p-4 text-sm text-muted-foreground">Carregando…</main>;
  }

  const scoreDirty =
    originalMatch !== null &&
    (match.score_a !== originalMatch.score_a || match.score_b !== originalMatch.score_b);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => router.back()}
            aria-label="Voltar"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Editar Partida (VAR)</h1>
            <p className="text-xs text-muted-foreground">{formatDate(match.played_at)}</p>
          </div>
        </div>
        <Badge variant="secondary">FINISHED</Badge>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <h2 className="text-sm font-semibold text-muted-foreground">Placar</h2>
          <div className="grid grid-cols-2 gap-4">
            <ScoreEditor
              team={match.team_a_name}
              value={match.score_a}
              onInc={() => changeScore(1, 1)}
              onDec={() => changeScore(1, -1)}
            />
            <ScoreEditor
              team={match.team_b_name}
              value={match.score_b}
              onInc={() => changeScore(2, 1)}
              onDec={() => changeScore(2, -1)}
            />
          </div>
          {scoreDirty && (
            <p className="text-xs text-amber-600">
              Placar alterado. Clique em <strong>Salvar</strong> para aplicar e recalcular o
              ranking.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          <h2 className="text-sm font-semibold text-muted-foreground">Adicionar evento</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={addPlayerId} onValueChange={setAddPlayerId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Jogador" />
              </SelectTrigger>
              <SelectContent>
                {roster.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.team === 1 ? match.team_a_name : match.team_b_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={addEventType}
              onValueChange={(v) => setAddEventType(v as EventType)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Evento" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(EVENT_LABELS) as EventType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {EVENT_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddEvent} disabled={!addPlayerId}>
              <Plus className="size-4" /> Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 p-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Eventos ({events.length})
          </h2>
          {events.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Nenhum evento registrado.
            </p>
          ) : (
            <ul className="space-y-1">
              {events.map((ev) => {
                const player = playersById.get(ev.player_id);
                return (
                  <li
                    key={ev.id}
                    className="flex items-center justify-between rounded border px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">{player?.name ?? '—'}</span>
                      <span className="ml-2 text-muted-foreground">
                        {EVENT_LABELS[ev.event_type]}
                      </span>
                      <span className="ml-2 tabular-nums text-xs text-muted-foreground">
                        ({Number(ev.points).toFixed(1)} pts)
                      </span>
                    </div>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => handleDeleteEvent(ev)}
                      aria-label="Remover"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2 shadow-lg">
          <Save className="size-4" />
          {saving ? 'Salvando…' : 'Salvar e recalcular'}
        </Button>
      </div>
    </main>
  );
}

function ScoreEditor({
  team,
  value,
  onInc,
  onDec,
}: {
  team: string;
  value: number;
  onInc: () => void;
  onDec: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border p-3">
      <div className="text-xs font-medium text-muted-foreground">{team}</div>
      <div className="flex items-center gap-3">
        <Button size="icon" variant="outline" onClick={onDec} aria-label="Diminuir">
          <Minus className="size-4" />
        </Button>
        <span className="w-10 text-center text-3xl font-bold tabular-nums">{value}</span>
        <Button size="icon" variant="outline" onClick={onInc} aria-label="Aumentar">
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
