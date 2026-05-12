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
  insertEventBatch,
  switchGk,
} from '@/lib/events';
import { supabase } from '@/lib/supabase';
import type { EventType, GkShift, Match, MatchEvent, Player } from '@/lib/types';

const EVENT_LABELS: Record<EventType, string> = {
  GOAL: '⚽ Gol',
  WINNING_GOAL: '🔥 Gol Decisivo',
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

  const goalsByTeam = useMemo(() => {
    const teamA: Record<string, number> = {};
    const teamB: Record<string, number> = {};
    
    events.forEach(e => {
      if (e.event_type === 'GOAL' || e.event_type === 'WINNING_GOAL') {
        const p = playersById.get(e.player_id);
        if (p) {
          const map = p.team === 1 ? teamA : teamB;
          map[p.name] = (map[p.name] || 0) + 1;
        }
      } else if (e.event_type === 'OWN_GOAL') {
        const p = playersById.get(e.player_id);
        if (p) {
          const map = p.team === 1 ? teamB : teamA;
          const name = `${p.name} (GC)`;
          map[name] = (map[name] || 0) + 1;
        }
      }
    });

    const formatScorers = (map: Record<string, number>) =>
      Object.entries(map)
        .map(([name, goals]) => ({ name, goals }))
        .sort((a, b) => b.goals - a.goals);

    return {
      teamA: formatScorers(teamA),
      teamB: formatScorers(teamB),
    };
  }, [events, playersById]);

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

  async function handlePickAction(type: EventType, quantity: number = 1) {
    if (!tappedPlayer) return;
    const player = tappedPlayer;
    setTappedPlayer(null);
    try {
      await insertEventBatch({
        match_id: match.id,
        player_id: player.id,
        team: player.team,
        event_type: type,
        quantity,
      });

      if (type === 'GOAL' || type === 'WINNING_GOAL') {
        await handleScore(player.team, quantity);
      } else if (type === 'OWN_GOAL') {
        await handleScore(player.team === 1 ? 2 : 1, quantity);
      }

      toast.success(`${quantity > 1 ? `${quantity}x ` : ''}${EVENT_LABELS[type]} • ${player.name}`);
      refetch();
    } catch (e) {
      toast.error('Erro ao registrar evento', { description: describeError(e) });
    }
  }

  async function handleUndo(eventId: string) {
    const eventToUndo = events.find(e => e.id === eventId);
    try {
      await deleteEvent(eventId);
      
      if (eventToUndo) {
        const player = playersById.get(eventToUndo.player_id);
        if (player) {
          if (eventToUndo.event_type === 'GOAL' || eventToUndo.event_type === 'WINNING_GOAL') {
            await handleScore(player.team, -1);
          } else if (eventToUndo.event_type === 'OWN_GOAL') {
            await handleScore(player.team === 1 ? 2 : 1, -1);
          }
        }
      }

      refetch();
    } catch (e) {
      toast.error('Erro ao desfazer', { description: describeError(e) });
    }
  }

  async function handleScore(team: 1 | 2, delta: number) {
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
        teamAGoals={goalsByTeam.teamA}
        teamBGoals={goalsByTeam.teamB}
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
  teamAGoals = [],
  teamBGoals = [],
}: {
  match: Match;
  onChange: (team: 1 | 2, delta: number) => void;
  currentGkA?: Player;
  currentGkB?: Player;
  onSwitchGkA: () => void;
  onSwitchGkB: () => void;
  teamAGoals?: { name: string; goals: number }[];
  teamBGoals?: { name: string; goals: number }[];
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-3">
        <div className="flex items-start justify-between gap-2">
          <TeamScore
            name={match.team_a_name}
            score={match.score_a}
            onInc={() => onChange(1, 1)}
            onDec={() => onChange(1, -1)}
            scorers={teamAGoals}
          />
          <span className="text-2xl text-muted-foreground mt-6">×</span>
          <TeamScore
            name={match.team_b_name}
            score={match.score_b}
            onInc={() => onChange(2, 1)}
            onDec={() => onChange(2, -1)}
            scorers={teamBGoals}
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
  scorers = [],
}: {
  name: string;
  score: number;
  onInc: () => void;
  onDec: () => void;
  scorers?: { name: string; goals: number }[];
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
      {scorers.length > 0 && (
        <div className="flex flex-col items-center text-[10px] text-muted-foreground mt-1">
          {scorers.map((s, i) => (
            <span key={i}>
              {s.name} {'⚽'.repeat(s.goals)}
            </span>
          ))}
        </div>
      )}
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
