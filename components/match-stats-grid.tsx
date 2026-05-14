'use client';

import { useEffect, useState } from 'react';
import { fetchEvents } from '@/lib/events';
import { supabase } from '@/lib/supabase';
import { PlayerAvatar } from '@/components/player-avatar';
import { StarRating } from '@/components/ui-patterns';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Shield, Zap } from 'lucide-react';
import { buildPlayerMatchResult, outcomeFor } from '@/lib/scoring';
import type { EventType, MatchEvent, MatchOutcome } from '@/lib/types';

interface Props {
  matchId: string;
  teamAName: string;
  teamBName: string;
  scoreA: number;
  scoreB: number;
  mvpId?: string | null;
}

interface PlayerStats {
  player_id: string;
  name: string;
  photo_url: string | null;
  team: 1 | 2;
  goals: number;
  assists: number;
  saves: number;
  total_points: number;
  match_rating: number;
  isMvp: boolean;
  outcome: MatchOutcome;
}

export function MatchStatsGrid({
  matchId,
  teamAName,
  teamBName,
  scoreA,
  scoreB,
  mvpId,
}: Props) {
  const [players, setPlayers] = useState<PlayerStats[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [eventsRes, attRes] = await Promise.all([
        fetchEvents(matchId),
        supabase
          .from('match_attendances')
          .select('player_id, team, players(name, photo_url)')
          .eq('match_id', matchId),
      ]);

      if (attRes.data) {
        const events = (eventsRes || []) as MatchEvent[];
        const attendance = attRes.data as any[];

        const stats: PlayerStats[] = attendance.map((a) => {
          const playerEvents = events.filter((e) => e.player_id === a.player_id);
          const outcome = outcomeFor(a.team as 1 | 2, scoreA, scoreB);
          const isMvp = mvpId === a.player_id;

          const result = buildPlayerMatchResult({
            match_id: matchId,
            player_id: a.player_id,
            team: a.team as 1 | 2,
            outcome,
            events: playerEvents,
            isMvp,
          });

          return {
            player_id: a.player_id,
            name: a.players?.name || '—',
            photo_url: a.players?.photo_url || null,
            team: a.team as 1 | 2,
            goals: result.goals,
            assists: result.assists,
            saves: result.saves,
            total_points: result.total_points,
            match_rating: result.match_rating,
            isMvp,
            outcome,
          };
        });

        // Sort by team, then rating
        setPlayers(
          stats.sort((a, b) => {
            if (a.team !== b.team) return a.team - b.team;
            return b.match_rating - a.match_rating;
          })
        );
      }
      setLoading(false);
    })();
  }, [matchId, scoreA, scoreB, mvpId]);

  if (loading) {
    return <div className="h-48 w-full animate-pulse rounded-2xl bg-surface/50" />;
  }

  if (!players || players.length === 0) return null;

  const teamA = players.filter((p) => p.team === 1);
  const teamB = players.filter((p) => p.team === 2);

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <TeamColumn
        name={teamAName}
        players={teamA}
        colorClass="bg-accent"
        isWinner={scoreA > scoreB}
      />
      <TeamColumn
        name={teamBName}
        players={teamB}
        colorClass="bg-accent-secondary"
        isWinner={scoreB > scoreA}
      />
    </div>
  );
}

function TeamColumn({
  name,
  players,
  colorClass,
  isWinner,
}: {
  name: string;
  players: PlayerStats[];
  colorClass: string;
  isWinner: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-surface-border pb-2">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-text-primary">
          <span className={`h-4 w-1 rounded-full ${colorClass}`} />
          {name}
        </h3>
        {isWinner && (
          <Badge className="bg-accent text-black hover:bg-accent-bright">VENCEDOR</Badge>
        )}
      </div>

      <div className="space-y-3">
        {players.map((p) => (
          <PlayerMatchCard key={p.player_id} player={p} />
        ))}
      </div>
    </div>
  );
}

function PlayerMatchCard({ player }: { player: PlayerStats }) {
  return (
    <div className="group relative rounded-2xl border border-surface-border bg-surface p-4 transition hover:border-accent/40 hover:shadow-premium">
      {player.isMvp && (
        <div className="absolute -right-2 -top-2 z-10 flex size-8 items-center justify-center rounded-full bg-yellow-500 shadow-lg ring-4 ring-background">
          <Trophy className="size-4 text-black" />
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <PlayerAvatar
            name={player.name}
            photoUrl={player.photo_url}
            size={48}
            className="ring-2 ring-background group-hover:ring-accent/20"
          />
          <div className="min-w-0">
            <h4 className="truncate font-bold text-text-primary">{player.name}</h4>
            <div className="mt-1">
              <StarRating value={player.match_rating} size="xs" showValue={false} />
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="block text-xl font-black text-accent">
            {player.total_points > 0 ? `+${player.total_points.toFixed(0)}` : player.total_points.toFixed(0)}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-tighter text-text-secondary">
            Rank Pts
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {player.goals > 0 && (
          <StatBadge icon={<Target className="size-3" />} label={`${player.goals} Gols`} />
        )}
        {player.assists > 0 && (
          <StatBadge icon={<Zap className="size-3" />} label={`${player.assists} Assists`} />
        )}
        {player.saves > 0 && (
          <StatBadge icon={<Shield className="size-3" />} label={`${player.saves} Defesas`} />
        )}
      </div>
    </div>
  );
}

function StatBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-background/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
      {icon}
      {label}
    </div>
  );
}
