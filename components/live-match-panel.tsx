'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flag, Minus, Plus, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PlayerActionSheet } from '@/components/player-action-sheet';
import { GkPickerDialog } from '@/components/gk-picker-dialog';
import {
  deleteEvent,
  fetchEvents,
  fetchOpenShifts,
  insertEvent,
  switchGk,
} from '@/lib/events';
import { supabase } from '@/lib/supabase';
import type { EventType, GkShift, Match, MatchEvent, Player } from '@/lib/types';

const EVENT_LABELS: Record<EventType, string> = {
  GOAL: '⚽ Gol',
  ASSIST: '🅰️ Assist',
  SAVE: '🧤 Defesa',
  PENALTY_SAVE: '🧤 Pênalti',
  TACKLE: '🛡️ Desarme',
  CREATION: '✨ Criação',
  MISTAKE_LEADING_GOAL: '😬 Erro no gol',
  OWN_GOAL: '🤦 Gol contra',
  GOAL_CONCEDED_GK: '😣 Sofreu gol',
};

export type RosterPlayer = Player & { team: 1 | 2 };

interface Props {
  match: Match;
  roster: RosterPlayer[];
}

export function LiveMatchPanel({ match: initialMatch, roster }: Props) {
  const router = useRouter();
  const [match, setMatch] = useState(initialMatch);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [openShifts, setOpenShifts] = useState<GkShift[]>([]);
  const [tappedPlayer, setTappedPlayer] = useState<RosterPlayer | null>(null);
  const [gkPickerTeam, setGkPickerTeam] = useState<1 | 2 | null>(null);

  const teamA = useMemo(() => roster.filter((r) => r.team === 1), [roster]);
  const teamB = useMemo(() => roster.filter((r) => r.team === 2), [roster]);
  const playersById = useMemo(
    () => new Map(roster.map((p) => [p.id, p])),
    [roster]
  );
  const gkByTeam = useMemo(() => {
    const map = new Map<1 | 2, string>();
    openShifts.forEach((s) => map.set(s.team, s.player_id));
    return map;
  }, [openShifts]);

  const refetch = useCallback(async () => {
    try {
      const [newEvents, newShifts] = await Promise.all([
        fetchEvents(match.id),
        fetchOpenShifts(match.id),
      ]);
      setEvents(newEvents);
      setOpenShifts(newShifts);
    } catch (e) {
      toast.error('Erro ao atualizar', { description: describeError(e) });
    }
  }, [match.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function handlePickAction(type: EventType) {
    if (!tappedPlayer) return;
    const player = tappedPlayer;
    setTappedPlayer(null);
    try {
      await insertEvent({
        match_id: match.id,
        player_id: player.id,
        team: player.team,
        event_type: type,
      });
      toast.success(`${EVENT_LABELS[type]} • ${player.name}`);
      refetch();
    } catch (e) {
      toast.error('Erro ao registrar evento', { description: describeError(e) });
    }
  }

  async function handleUndo(eventId: string) {
    try {
      await deleteEvent(eventId);
      refetch();
    } catch (e) {
      toast.error('Erro ao desfazer', { description: describeError(e) });
    }
  }

  async function handleScore(team: 1 | 2, delta: 1 | -1) {
    const field = team === 1 ? 'score_a' : 'score_b';
    const current = team === 1 ? match.score_a : match.score_b;
    const next = Math.max(0, current + delta);
    const optimistic = { ...match, [field]: next };
    setMatch(optimistic);
    const { error } = await supabase
      .from('matches')
      .update({ [field]: next })
      .eq('id', match.id);
    if (error) {
      setMatch(match);
      toast.error('Erro ao atualizar placar', { description: error.message });
    }
  }

  async function handleSwitchGk(team: 1 | 2, playerId: string) {
    setGkPickerTeam(null);
    try {
      await switchGk({ match_id: match.id, team, new_player_id: playerId });
      const player = playersById.get(playerId);
      toast.success(`🧤 Goleiro trocado: ${player?.name ?? ''}`);
      refetch();
    } catch (e) {
      toast.error('Erro ao trocar goleiro', { description: describeError(e) });
    }
  }

  const tappedIsOnGoal =
    tappedPlayer !== null && gkByTeam.get(tappedPlayer.team) === tappedPlayer.id;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-4 pb-24">
      <Scoreboard
        match={match}
        onChange={handleScore}
        currentGkA={gkByTeam.get(1) ? playersById.get(gkByTeam.get(1)!) : undefined}
        currentGkB={gkByTeam.get(2) ? playersById.get(gkByTeam.get(2)!) : undefined}
        onSwitchGkA={() => setGkPickerTeam(1)}
        onSwitchGkB={() => setGkPickerTeam(2)}
      />

      <div className="grid grid-cols-2 gap-2">
        <TeamColumn
          name={match.team_a_name}
          players={teamA}
          currentGkId={gkByTeam.get(1) ?? null}
          onTap={setTappedPlayer}
        />
        <TeamColumn
          name={match.team_b_name}
          players={teamB}
          currentGkId={gkByTeam.get(2) ?? null}
          onTap={setTappedPlayer}
        />
      </div>

      <EventFeed
        events={events}
        players={playersById}
        onUndo={handleUndo}
      />

      <div className="fixed inset-x-0 bottom-0 border-t bg-background p-3">
        <div className="mx-auto max-w-3xl">
          <Button
            className="w-full"
            size="lg"
            onClick={() => router.push(`/partida/${match.id}/fim`)}
          >
            <Flag className="size-4" /> Finalizar partida
          </Button>
        </div>
      </div>

      <PlayerActionSheet
        player={tappedPlayer}
        isOnGoal={tappedIsOnGoal}
        onClose={() => setTappedPlayer(null)}
        onPick={handlePickAction}
      />

      <GkPickerDialog
        open={gkPickerTeam !== null}
        teamName={gkPickerTeam === 1 ? match.team_a_name : match.team_b_name}
        players={gkPickerTeam === 1 ? teamA : teamB}
        currentGkId={gkPickerTeam ? gkByTeam.get(gkPickerTeam) ?? null : null}
        onClose={() => setGkPickerTeam(null)}
        onPick={(pid) => gkPickerTeam && handleSwitchGk(gkPickerTeam, pid)}
      />
    </main>
  );
}

function Scoreboard({
  match,
  onChange,
  currentGkA,
  currentGkB,
  onSwitchGkA,
  onSwitchGkB,
}: {
  match: Match;
  onChange: (team: 1 | 2, delta: 1 | -1) => void;
  currentGkA?: Player;
  currentGkB?: Player;
  onSwitchGkA: () => void;
  onSwitchGkB: () => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-3">
        <div className="flex items-center justify-between gap-2">
          <TeamScore
            name={match.team_a_name}
            score={match.score_a}
            onInc={() => onChange(1, 1)}
            onDec={() => onChange(1, -1)}
          />
          <span className="text-2xl text-muted-foreground">×</span>
          <TeamScore
            name={match.team_b_name}
            score={match.score_b}
            onInc={() => onChange(2, 1)}
            onDec={() => onChange(2, -1)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <GkStrip gk={currentGkA} onChange={onSwitchGkA} />
          <GkStrip gk={currentGkB} onChange={onSwitchGkB} />
        </div>
      </CardContent>
    </Card>
  );
}

function TeamScore({
  name,
  score,
  onInc,
  onDec,
}: {
  name: string;
  score: number;
  onInc: () => void;
  onDec: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <span className="text-xs text-muted-foreground">{name}</span>
      <div className="flex items-center gap-2">
        <Button size="icon" variant="ghost" onClick={onDec} aria-label="-1">
          <Minus className="size-4" />
        </Button>
        <span className="min-w-8 text-center text-3xl font-bold tabular-nums">
          {score}
        </span>
        <Button size="icon" variant="ghost" onClick={onInc} aria-label="+1">
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function GkStrip({ gk, onChange }: { gk?: Player; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between gap-1 rounded-md bg-muted px-2 py-1">
      <span className="flex min-w-0 items-center gap-1">
        <span>🧤</span>
        <span className="truncate">{gk?.name ?? 'Sem goleiro'}</span>
      </span>
      <Button size="sm" variant="ghost" className="h-6 px-2" onClick={onChange}>
        Trocar
      </Button>
    </div>
  );
}

function TeamColumn({
  name,
  players,
  currentGkId,
  onTap,
}: {
  name: string;
  players: RosterPlayer[];
  currentGkId: string | null;
  onTap: (player: RosterPlayer) => void;
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {name}
      </h2>
      <ul className="space-y-1">
        {players.map((p) => {
          const isGk = p.id === currentGkId;
          return (
            <li key={p.id}>
              <button
                onClick={() => onTap(p)}
                className="flex w-full items-center gap-2 rounded-md border bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-accent active:scale-[0.98]"
              >
                {isGk && <span>🧤</span>}
                <span className="truncate">{p.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function EventFeed({
  events,
  players,
  onUndo,
}: {
  events: MatchEvent[];
  players: Map<string, RosterPlayer>;
  onUndo: (id: string) => void;
}) {
  if (events.length === 0) return null;
  return (
    <Card>
      <CardContent className="p-3">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Últimos lances
        </h2>
        <ul className="space-y-1 text-sm">
          {events.slice(0, 12).map((e) => {
            const p = players.get(e.player_id);
            return (
              <li
                key={e.id}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1 hover:bg-accent"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Badge variant="outline">{EVENT_LABELS[e.event_type]}</Badge>
                  <span className="truncate">{p?.name ?? '?'}</span>
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onUndo(e.id)}
                  aria-label="Desfazer"
                  className="h-7 w-7"
                >
                  <Undo2 className="size-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

function describeError(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
