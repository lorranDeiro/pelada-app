// =====================================================================
// types.ts — Domain types mirroring the Supabase schema
// =====================================================================

export type PlayerPosition = 'GOLEIRO_FIXO' | 'JOGADOR';

export type MatchOutcome = 'WIN' | 'DRAW' | 'LOSS';

export type MatchStatus = 'DRAFT' | 'LIVE' | 'FINISHED';

export type EventType =
  | 'GOAL'
  | 'WINNING_GOAL'
  | 'ASSIST'
  | 'SAVE'
  | 'PENALTY_SAVE'
  | 'TACKLE'
  | 'CREATION'
  | 'MISTAKE_LEADING_GOAL'
  | 'OWN_GOAL'
  | 'GOAL_CONCEDED_GK';

export interface Player {
  id: string;
  name: string;
  position: PlayerPosition;
  skill_level: 1 | 2 | 3 | 4 | 5;
  active: boolean;
  photo_url: string | null;
  photo_updated_at: string | null;
  created_at: string;
}

export interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  active: boolean;
}

export interface Match {
  id: string;
  season_id: string;
  played_at: string;
  team_a_name: string;
  team_b_name: string;
  score_a: number;
  score_b: number;
  status: MatchStatus;
  mvp_player_id: string | null;
  notes: string | null;
}

export interface MatchAttendance {
  id: string;
  match_id: string;
  player_id: string;
  team: 1 | 2;
}

export interface GkShift {
  id: string;
  match_id: string;
  team: 1 | 2;
  player_id: string;
  started_at: string;
  ended_at: string | null;
}

export interface MatchEvent {
  id: string;
  match_id: string;
  player_id: string;
  event_type: EventType;
  points: number;
  in_gk_turn: boolean;
  event_timestamp: string;
}

export interface PlayerMatchResult {
  id: string;
  match_id: string;
  player_id: string;
  team: 1 | 2;
  outcome: MatchOutcome;
  outcome_points: number;
  event_points: number;
  mvp_bonus: number;
  total_points: number;
  match_rating: number;
  goals: number;
  assists: number;
  saves: number;
}

export interface SeasonStats {
  player_id: string;
  name: string;
  position: PlayerPosition;
  photo_url: string | null;
  season_id: string;
  matches_played: number;
  total_points: number;
  avg_rating: number;
  goals: number;
  assists: number;
  saves: number;
  wins: number;
  draws: number;
  losses: number;
  mvp_count: number;
  dynamic_rating?: number;
}

/** Player enriched with current season performance, used by the balancer. */
export interface RankedPlayer extends Player {
  season_points: number;
  matches_played_season: number;
  avg_rating?: number;
}

export interface MatchComment {
  id: string;
  match_id: string;
  author_name: string;
  author_email: string | null;
  content: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}
