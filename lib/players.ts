import { supabase } from './supabase';
import type { Player, RankedPlayer } from './types';
import type { PlayerSeasonRow } from './player-odds';

export async function fetchActivePlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('active', true)
    .order('name');
  if (error) throw error;
  return (data ?? []) as Player[];
}

export async function fetchRankedPlayers(
  seasonId: string,
  playerIds: string[]
): Promise<RankedPlayer[]> {
  if (playerIds.length === 0) return [];

  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('*')
    .in('id', playerIds);
  if (playersError) throw playersError;

  const { data: stats, error: statsError } = await supabase
    .from('v_player_season_stats_full')
    .select('player_id, total_points, matches_played')
    .eq('season_id', seasonId)
    .in('player_id', playerIds);
  if (statsError) throw statsError;

  const statsByPlayer = new Map(
    (stats ?? []).map((s) => [
      s.player_id as string,
      {
        season_points: Number(s.total_points ?? 0),
        matches_played_season: Number(s.matches_played ?? 0),
      },
    ])
  );

  return (players as Player[]).map((p) => ({
    ...p,
    season_points: statsByPlayer.get(p.id)?.season_points ?? 0,
    matches_played_season: statsByPlayer.get(p.id)?.matches_played_season ?? 0,
  }));
}

/**
 * Variante "all-time": agrega ranking de TODAS as temporadas (computadas
 * + importadas via CSV) em um único RankedPlayer por jogador. Usado pelo
 * sorteio quando o admin escolhe "Ranking Global" como base de dados.
 */
export async function fetchAllTimeRankedPlayers(
  playerIds: string[]
): Promise<RankedPlayer[]> {
  if (playerIds.length === 0) return [];

  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('*')
    .in('id', playerIds);
  if (playersError) throw playersError;

  // Soma total_points e matches_played sobre todas as temporadas, via view
  // unificada. Imports históricos entram automaticamente.
  const { data: stats, error: statsError } = await supabase
    .from('v_player_season_stats_full')
    .select('player_id, total_points, matches_played')
    .in('player_id', playerIds);
  if (statsError) throw statsError;

  const byPlayer = new Map<string, { season_points: number; matches_played_season: number }>();
  for (const row of stats ?? []) {
    const acc =
      byPlayer.get(row.player_id as string) ??
      { season_points: 0, matches_played_season: 0 };
    acc.season_points += Number(row.total_points ?? 0);
    acc.matches_played_season += Number(row.matches_played ?? 0);
    byPlayer.set(row.player_id as string, acc);
  }

  return (players as Player[]).map((p) => ({
    ...p,
    season_points: byPlayer.get(p.id)?.season_points ?? 0,
    matches_played_season: byPlayer.get(p.id)?.matches_played_season ?? 0,
  }));
}

/**
 * Stats agregados (gols, assistências, partidas) pra construir o contexto
 * de odds. Usa a mesma view do ranking, mas só os campos necessários.
 */
export async function fetchPlayerSeasonStatsRows(
  seasonId: string,
  playerIds: string[]
): Promise<PlayerSeasonRow[]> {
  if (playerIds.length === 0) return [];

  const { data, error } = await supabase
    .from('v_player_season_stats_full')
    .select('player_id, goals, assists, matches_played')
    .eq('season_id', seasonId)
    .in('player_id', playerIds);

  if (error) throw error;

  return (data ?? []).map((r) => ({
    player_id: r.player_id as string,
    goals: Number(r.goals ?? 0),
    assists: Number(r.assists ?? 0),
    matches_played: Number(r.matches_played ?? 0),
  }));
}
