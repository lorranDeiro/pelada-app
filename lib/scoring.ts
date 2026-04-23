// =====================================================================
// scoring.ts — Weights, rating calculation, and result aggregation
// =====================================================================

import type { EventType, MatchEvent, MatchOutcome } from './types';

/** Points awarded per event. Tune these to adjust the "feel" of the ranking. */
export const EVENT_WEIGHTS: Record<EventType, number> = {
  GOAL:                 5.0,
  WINNING_GOAL:         7.0,  // Fator Clutch: Gol Decisivo
  ASSIST:               3.5,
  SAVE:                 3.0,
  PENALTY_SAVE:         5.0,
  TACKLE:               2.0,
  CREATION:             1.0,
  MISTAKE_LEADING_GOAL: -3.0,
  OWN_GOAL:             -4.0,
  GOAL_CONCEDED_GK:     -1.5,
};

export const OUTCOME_WEIGHTS: Record<MatchOutcome, number> = {
  WIN:  5.0,
  DRAW: 1.5,
  LOSS: -1.0,
};

export const MVP_BONUS = 4.0;

// --- Match rating (Sofascore-style, 4.0 to 10.0) ---
export const RATING_BASE = 6.0;
export const RATING_MULTIPLIER = 0.25;  // each point moves rating by 0.25
export const RATING_MIN = 4.0;
export const RATING_MAX = 10.0;

/** Sum of raw event points for a player in one match. */
export function sumEventPoints(events: MatchEvent[]): number {
  return events.reduce((acc, e) => acc + Number(e.points), 0);
}

/**
 * Convert a bag of match points into a Sofascore-style rating.
 * Starts at 6.0, each point moves rating by RATING_MULTIPLIER, clamped.
 */
export function computeMatchRating(matchPoints: number): number {
  const raw = RATING_BASE + matchPoints * RATING_MULTIPLIER;
  const clamped = Math.max(RATING_MIN, Math.min(RATING_MAX, raw));
  return Math.round(clamped * 10) / 10;
}

/** Produce the final per-player summary line for a finished match. */
export function buildPlayerMatchResult(params: {
  match_id: string;
  player_id: string;
  team: 1 | 2;
  outcome: MatchOutcome;
  events: MatchEvent[];
  isMvp: boolean;
}) {
  const { match_id, player_id, team, outcome, events, isMvp } = params;

  const event_points = sumEventPoints(events);
  const outcome_points = OUTCOME_WEIGHTS[outcome];
  const mvp_bonus = isMvp ? MVP_BONUS : 0;
  const total_points = event_points + outcome_points + mvp_bonus;
  const match_rating = computeMatchRating(total_points);

  const goals = events.filter(e => e.event_type === 'GOAL' || e.event_type === 'WINNING_GOAL').length;
  const assists = events.filter(e => e.event_type === 'ASSIST').length;
  const saves = events.filter(
    e => e.event_type === 'SAVE' || e.event_type === 'PENALTY_SAVE'
  ).length;

  return {
    match_id,
    player_id,
    team,
    outcome,
    outcome_points,
    event_points: Math.round(event_points * 100) / 100,
    mvp_bonus,
    total_points: Math.round(total_points * 100) / 100,
    match_rating,
    goals,
    assists,
    saves,
  };
}

/** Derive outcome (WIN/DRAW/LOSS) for a given team given final scores. */
export function outcomeFor(team: 1 | 2, scoreA: number, scoreB: number): MatchOutcome {
  if (scoreA === scoreB) return 'DRAW';
  const teamAWon = scoreA > scoreB;
  if (team === 1) return teamAWon ? 'WIN' : 'LOSS';
  return teamAWon ? 'LOSS' : 'WIN';
}
