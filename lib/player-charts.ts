// =====================================================================
// player-charts.ts — Data shapes for the player chart tabs
// =====================================================================

import { supabase } from './supabase';
import type { SeasonStats } from './types';

// ---------- Radar (jogador vs liga) ----------

export interface RadarPoint {
  metric: string;
  player: number;  // 0..100
  league: number;  // 0..100
  fullMark: 100;
}

/**
 * Normaliza tudo para 0..100 contra o líder da liga em cada métrica
 * (e contra o teto absoluto, no caso de win-rate e dynamic_rating).
 *
 *   - Gols/partida, Assist./partida, Defesas/partida → escala pelo líder
 *   - Win %                                          → já é 0..100
 *   - Rating dinâmico (0..5)                         → ×20 → 0..100
 *
 * Garante divisão por algo > 0 mesmo em ligas vazias.
 */
export function buildRadarData(
  player: SeasonStats,
  allStats: SeasonStats[]
): RadarPoint[] {
  const perMatch = (s: SeasonStats, k: 'goals' | 'assists' | 'saves') =>
    s.matches_played > 0 ? Number(s[k]) / s.matches_played : 0;

  const maxGpm = Math.max(0.001, ...allStats.map((s) => perMatch(s, 'goals')));
  const maxApm = Math.max(0.001, ...allStats.map((s) => perMatch(s, 'assists')));
  const maxSpm = Math.max(0.001, ...allStats.map((s) => perMatch(s, 'saves')));

  const winRate = (s: SeasonStats) =>
    s.matches_played > 0 ? (s.wins / s.matches_played) * 100 : 0;

  const leagueAvg = (fn: (s: SeasonStats) => number) => {
    const vals = allStats.filter((s) => s.matches_played > 0).map(fn);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  const rating = (s: SeasonStats) => Number(s.dynamic_rating ?? 0);

  return [
    {
      metric: 'Gols',
      player: Math.round((perMatch(player, 'goals') / maxGpm) * 100),
      league: Math.round((leagueAvg((s) => perMatch(s, 'goals')) / maxGpm) * 100),
      fullMark: 100,
    },
    {
      metric: 'Assist.',
      player: Math.round((perMatch(player, 'assists') / maxApm) * 100),
      league: Math.round((leagueAvg((s) => perMatch(s, 'assists')) / maxApm) * 100),
      fullMark: 100,
    },
    {
      metric: 'Defesas',
      player: Math.round((perMatch(player, 'saves') / maxSpm) * 100),
      league: Math.round((leagueAvg((s) => perMatch(s, 'saves')) / maxSpm) * 100),
      fullMark: 100,
    },
    {
      metric: 'Win %',
      player: Math.round(winRate(player)),
      league: Math.round(leagueAvg(winRate)),
      fullMark: 100,
    },
    {
      metric: 'Rating',
      player: Math.round((rating(player) / 5) * 100),
      league: Math.round((leagueAvg(rating) / 5) * 100),
      fullMark: 100,
    },
  ];
}

// ---------- Progresso (últimas N partidas) ----------

export interface ProgressPoint {
  match: string;   // dd/mm
  rating: number;  // 0..5
  points: number;  // total_points
}

/**
 * Pega as últimas N partidas do jogador. Se `seasonId` for undefined,
 * agrega TODAS as temporadas (modo all-time, usado pelo ranking Global).
 *
 * NOTA: só inclui partidas reais (player_match_results). Temporadas
 * importadas via CSV não têm dados granulares por partida e não aparecem
 * aqui — fica como limitação conhecida do modo all-time.
 */
export async function fetchPlayerProgress(
  playerId: string,
  seasonId?: string,
  limit = 10
): Promise<ProgressPoint[]> {
  let query = supabase
    .from('player_match_results')
    .select('match_rating,total_points,matches!inner(played_at,season_id)')
    .eq('player_id', playerId)
    .order('played_at', { referencedTable: 'matches', ascending: false })
    .limit(limit);

  if (seasonId) {
    query = query.eq('matches.season_id', seasonId);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Supabase tipa joins via FK como array, mas em runtime um match_id ->
  // matches é to-one e retorna objeto. Cast via unknown para evitar o
  // overlap-warning do TS sem mascarar bugs com `any`.
  const rows = (data ?? []) as unknown as Array<{
    match_rating: number;
    total_points: number;
    matches: { played_at: string; season_id: string };
  }>;

  return rows
    .map((r) => ({
      match: new Date(r.matches.played_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
      rating: Number(r.match_rating),
      points: Number(r.total_points),
    }))
    .reverse(); // do mais antigo pro mais recente, p/ a linha cronológica
}
