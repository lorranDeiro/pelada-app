// =====================================================================
// player-odds.ts — Per-player decimal odds (Gol / Assist) com contexto de time
// =====================================================================
//
// Ideia:  P(jogar marca pelo menos 1 gol na partida) ≈ 1 - exp(-λ)
//         onde λ = expected goals do jogador NESTA composição de time.
//
// λ_gol     = playerGpm × multiplicadorPassadores
// λ_assist  = playerApm × multiplicadorArtilheiros
//
// Os multiplicadores capturam o contexto de time:
//   - jogador artilheiro num time com bons passadores → λ maior → odds menores
//   - artilheiro num time sem ninguém pra dar passe   → λ menor → odds maiores
//
// odds = 1 / P, clamped em [1.10, 50.0] pra evitar números absurdos.

import type { RankedPlayer } from './types';

export interface PlayerSeasonRow {
  player_id: string;
  goals: number;
  assists: number;
  matches_played: number;
}

export interface OddsContext {
  /** Stats por player_id (vindo de v_player_season_stats) */
  byPlayer: Map<string, PlayerSeasonRow>;
  /** Média de gols por partida na liga, por jogador */
  leagueGpm: number;
  /** Média de assistências por partida na liga, por jogador */
  leagueApm: number;
}

export interface PlayerOdds {
  goal: number;    // odds decimais (ex: 2.10)
  assist: number;
}

const MIN_ODDS = 1.10;
const MAX_ODDS = 50.0;

// Para rookies sem histórico, assumimos um nível "mediano" — evita rookies
// terem odds infinitas só porque ainda não jogaram.
const ROOKIE_GPM = 0.25;
const ROOKIE_APM = 0.20;

// Quão agressivo é o boost de contexto de time. 0.5 = até ±50% no λ
// dependendo da qualidade dos companheiros.
const TEAM_CONTEXT_WEIGHT = 0.5;
const TEAM_CONTEXT_FLOOR = -0.4;
const TEAM_CONTEXT_CEIL  =  0.6;

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

function safeDiv(num: number, den: number): number {
  return den > 0 ? num / den : 0;
}

export function buildOddsContext(rows: PlayerSeasonRow[]): OddsContext {
  const byPlayer = new Map(rows.map((r) => [r.player_id, r]));

  const active = rows.filter((r) => r.matches_played > 0);
  const leagueGpm =
    active.length > 0
      ? active.reduce((s, r) => s + safeDiv(r.goals, r.matches_played), 0) / active.length
      : 0.3;
  const leagueApm =
    active.length > 0
      ? active.reduce((s, r) => s + safeDiv(r.assists, r.matches_played), 0) / active.length
      : 0.2;

  return { byPlayer, leagueGpm, leagueApm };
}

function metricsFor(player: RankedPlayer, ctx: OddsContext): { gpm: number; apm: number } {
  const row = ctx.byPlayer.get(player.id);
  if (!row || row.matches_played === 0) {
    return { gpm: ROOKIE_GPM, apm: ROOKIE_APM };
  }
  return {
    gpm: safeDiv(row.goals, row.matches_played),
    apm: safeDiv(row.assists, row.matches_played),
  };
}

/**
 * Multiplicador de λ baseado em quão acima/abaixo da média o time
 * está num determinado quesito (média de gpm/apm dos companheiros).
 */
function teamMultiplier(teamMetric: number, leagueMetric: number): number {
  if (leagueMetric === 0) return 1;
  const ratio = (teamMetric - leagueMetric) / leagueMetric;
  return 1 + clamp(ratio, TEAM_CONTEXT_FLOOR, TEAM_CONTEXT_CEIL) * TEAM_CONTEXT_WEIGHT;
}

export function computePlayerOdds(
  player: RankedPlayer,
  teammates: RankedPlayer[], // mesmo time, sem o próprio jogador
  ctx: OddsContext
): PlayerOdds {
  const self = metricsFor(player, ctx);

  const teammateMetrics = teammates.map((t) => metricsFor(t, ctx));
  const teamApm =
    teammateMetrics.length > 0
      ? teammateMetrics.reduce((s, m) => s + m.apm, 0) / teammateMetrics.length
      : ctx.leagueApm;
  const teamGpm =
    teammateMetrics.length > 0
      ? teammateMetrics.reduce((s, m) => s + m.gpm, 0) / teammateMetrics.length
      : ctx.leagueGpm;

  // λ do jogador, contextualizado:
  //   - quanto melhor a média de assist do time, maior o λ_gol
  //   - quanto melhor a média de gol do time,    maior o λ_assist
  const lambdaGoal   = self.gpm * teamMultiplier(teamApm, ctx.leagueApm);
  const lambdaAssist = self.apm * teamMultiplier(teamGpm, ctx.leagueGpm);

  const probGoal   = 1 - Math.exp(-Math.max(lambdaGoal,   0.001));
  const probAssist = 1 - Math.exp(-Math.max(lambdaAssist, 0.001));

  return {
    goal:   clamp(1 / probGoal,   MIN_ODDS, MAX_ODDS),
    assist: clamp(1 / probAssist, MIN_ODDS, MAX_ODDS),
  };
}
