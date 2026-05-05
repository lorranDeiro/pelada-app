'use client';

import { useEffect, useState } from 'react';
import { fetchEvents } from '@/lib/events';
import { supabase } from '@/lib/supabase';
import { PlayerAvatar } from '@/components/player-avatar';
import type { EventType } from '@/lib/types';

interface Props {
  matchId: string;
  teamAName: string;
  teamBName: string;
}

interface PlayerRow {
  player_id: string;
  name: string;
  photo_url: string | null;
  team: 1 | 2;
  goals: number;
  assists: number;
  saves: number;
  tackles: number;
  creations: number;
  negatives: number; // erros + own goals
}

interface AttendanceRow {
  player_id: string;
  team: 1 | 2;
  players: { name: string; photo_url: string | null } | null;
}

function blankRow(
  player_id: string,
  team: 1 | 2,
  name: string,
  photo_url: string | null
): PlayerRow {
  return {
    player_id,
    team,
    name,
    photo_url,
    goals: 0,
    assists: 0,
    saves: 0,
    tackles: 0,
    creations: 0,
    negatives: 0,
  };
}

export function MatchStatsTable({ matchId, teamAName, teamBName }: Props) {
  const [rows, setRows] = useState<PlayerRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setRows(null);
    setError(null);

    (async () => {
      try {
        const [events, attRes] = await Promise.all([
          fetchEvents(matchId),
          supabase
            .from('match_attendances')
            .select('player_id, team, players(name, photo_url)')
            .eq('match_id', matchId),
        ]);
        if (!alive) return;
        if (attRes.error) throw attRes.error;

        const byPlayer = new Map<string, PlayerRow>();
        // Supabase tipa o join como array; em runtime FK to-one é objeto.
        const att = (attRes.data ?? []) as unknown as AttendanceRow[];
        for (const a of att) {
          byPlayer.set(
            a.player_id,
            blankRow(
              a.player_id,
              a.team,
              a.players?.name ?? '—',
              a.players?.photo_url ?? null
            )
          );
        }

        for (const e of events) {
          const row = byPlayer.get(e.player_id);
          if (!row) continue;
          const t = e.event_type as EventType;
          if (t === 'GOAL' || t === 'WINNING_GOAL') row.goals += 1;
          else if (t === 'ASSIST') row.assists += 1;
          else if (t === 'SAVE' || t === 'PENALTY_SAVE') row.saves += 1;
          else if (t === 'TACKLE') row.tackles += 1;
          else if (t === 'CREATION') row.creations += 1;
          else if (t === 'MISTAKE_LEADING_GOAL' || t === 'OWN_GOAL') row.negatives += 1;
        }

        const sorted = [...byPlayer.values()].sort((a, b) => {
          if (a.team !== b.team) return a.team - b.team;
          if (b.goals !== a.goals) return b.goals - a.goals;
          if (b.assists !== a.assists) return b.assists - a.assists;
          return a.name.localeCompare(b.name);
        });

        setRows(sorted);
      } catch (e: unknown) {
        if (alive) {
          setError(e instanceof Error ? e.message : 'Erro ao carregar estatísticas');
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [matchId]);

  if (error) {
    return (
      <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
        {error}
      </div>
    );
  }
  if (!rows) {
    return <div className="h-32 w-full animate-pulse rounded-md bg-gray-800/50" />;
  }
  if (rows.length === 0) {
    return (
      <p className="text-xs text-gray-400">
        Sem eventos registrados nessa partida.
      </p>
    );
  }

  const teamA = rows.filter((r) => r.team === 1);
  const teamB = rows.filter((r) => r.team === 2);

  return (
    <div className="space-y-3">
      {teamA.length > 0 && (
        <TeamStatsTable name={teamAName} accent="bg-slate-700" players={teamA} />
      )}
      {teamB.length > 0 && (
        <TeamStatsTable name={teamBName} accent="bg-pink-500" players={teamB} />
      )}
    </div>
  );
}

function TeamStatsTable({
  name,
  accent,
  players,
}: {
  name: string;
  accent: string;
  players: PlayerRow[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-900/60">
      <div className="flex items-center gap-2 border-b border-gray-700 px-3 py-2">
        <span className={`size-3 shrink-0 rounded-full ${accent}`} />
        <h5 className="text-sm font-semibold text-gray-200">{name}</h5>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-gray-400">
          {players.length} jogador{players.length === 1 ? '' : 'es'}
        </span>
      </div>
      <table className="w-full text-xs">
        <thead className="bg-gray-800/50 text-[10px] uppercase tracking-wider text-gray-400">
          <tr>
            <th className="px-2 py-1.5 text-left">Jogador</th>
            <th className="px-1.5 py-1.5 text-right" title="Gols">⚽</th>
            <th className="px-1.5 py-1.5 text-right" title="Assistências">🅰️</th>
            <th className="px-1.5 py-1.5 text-right" title="Defesas">🛡️</th>
            <th className="hidden px-1.5 py-1.5 text-right sm:table-cell" title="Desarmes">🎯</th>
            <th className="hidden px-1.5 py-1.5 text-right sm:table-cell" title="Criação">💡</th>
            <th className="px-1.5 py-1.5 text-right" title="Erros / Gol contra">❌</th>
          </tr>
        </thead>
        <tbody className="font-mono tabular-nums text-gray-200">
          {players.map((p) => (
            <tr key={p.player_id} className="border-t border-gray-800/60">
              <td className="px-2 py-1.5">
                <div className="flex min-w-0 items-center gap-2 font-sans">
                  <PlayerAvatar
                    name={p.name}
                    photoUrl={p.photo_url}
                    size={22}
                    className="shrink-0"
                  />
                  <span className="truncate text-gray-100">{p.name}</span>
                </div>
              </td>
              <Cell value={p.goals} />
              <Cell value={p.assists} />
              <Cell value={p.saves} />
              <Cell value={p.tackles} hiddenOnMobile />
              <Cell value={p.creations} hiddenOnMobile />
              <Cell value={p.negatives} negative />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cell({
  value,
  hiddenOnMobile,
  negative,
}: {
  value: number;
  hiddenOnMobile?: boolean;
  negative?: boolean;
}) {
  return (
    <td
      className={[
        'px-1.5 py-1.5 text-right',
        hiddenOnMobile ? 'hidden sm:table-cell' : '',
        negative ? 'text-red-400/80' : '',
      ].join(' ')}
    >
      {value || <span className="text-gray-600">·</span>}
    </td>
  );
}
