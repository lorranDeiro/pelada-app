// =====================================================================
// team-balancer.ts — Team draw algorithm for pelada 5v5 (10–14 players)
// =====================================================================
//
// Strategy: brute force.
// C(12, 6) = 924 combinations. C(14, 7) = 3432. All run in <5ms.
// For each possible split into two teams, compute a "cost" based on:
//   1. Difference in composite strength between teams (lower = better)
//   2. Penalty if goalkeepers are poorly distributed
//   3. Penalty if a goalkeeper-less team has no capable rotating keepers
// Return the split with the lowest cost.
//
// The composite strength of a player weights season ranking more as more
// matches are played — the first matches of a season rely on manual
// skill_level, later matches rely on actual performance.

import type { RankedPlayer, PlayerPosition } from './types';

export interface BalancedTeams {
  teamA: RankedPlayer[];
  teamB: RankedPlayer[];
  cost: number;
  debug: {
    strengthA: number;
    strengthB: number;
    gkA: number;
    gkB: number;
  };
}

export interface BalancerOptions {
  /** 0..1 — how much the ranking dominates over manual skill_level. */
  rankingWeight?: number;
  /** Force a specific split size. Defaults to floor(n/2) vs ceil(n/2). */
  teamASize?: number;
  /** Random tiebreak seed for re-sortear. */
  seed?: number;
}

// ---------- helpers ----------

function compositeStrength(p: RankedPlayer, rankingWeight: number): number {
  const avgSeasonPoints =
    p.matches_played_season > 0
      ? p.season_points / p.matches_played_season
      : 0;

  // How much we trust the ranking vs. the manual skill. Ramps up over
  // the first 5 matches of the season.
  const trust = Math.min(p.matches_played_season / 5, 1) * rankingWeight;

  // Skill 1..5 mapped roughly onto the same scale as avg match points.
  const skillPoints = p.skill_level * 2;

  return trust * avgSeasonPoints + (1 - trust) * skillPoints;
}

function teamStrength(team: RankedPlayer[], rankingWeight: number): number {
  return team.reduce((s, p) => s + compositeStrength(p, rankingWeight), 0);
}

function countPosition(team: RankedPlayer[], pos: PlayerPosition): number {
  return team.filter(p => p.position === pos).length;
}

/** All combinations of size k from arr, yielded as arrays. */
function* combinations<T>(arr: T[], k: number): Generator<T[]> {
  const n = arr.length;
  if (k > n) return;
  const indices = Array.from({ length: k }, (_, i) => i);
  while (true) {
    yield indices.map(i => arr[i]);
    let i = k - 1;
    while (i >= 0 && indices[i] === i + n - k) i--;
    if (i < 0) return;
    indices[i]++;
    for (let j = i + 1; j < k; j++) indices[j] = indices[j - 1] + 1;
  }
}

// simple deterministic PRNG for tiebreaks
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- cost function ----------

function scoreDivision(
  teamA: RankedPlayer[],
  teamB: RankedPlayer[],
  rankingWeight: number
): { cost: number; strengthA: number; strengthB: number } {
  const strengthA = teamStrength(teamA, rankingWeight);
  const strengthB = teamStrength(teamB, rankingWeight);

  // base cost: how unbalanced the two teams are in raw strength
  let cost = Math.abs(strengthA - strengthB);

  const gkA = countPosition(teamA, 'GOLEIRO_FIXO');
  const gkB = countPosition(teamB, 'GOLEIRO_FIXO');

  // Goalkeeper distribution rules (big penalties — dominate the cost)
  //   both teams with 0 GKs  -> fine (organic rotation)
  //   both with 1 GK         -> ideal
  //   one with 1, other 0    -> unfair, penalize hard
  //   any team with 2+ GKs   -> forbidden in practice, penalize harder
  if (gkA === 1 && gkB === 0) cost += 50;
  if (gkB === 1 && gkA === 0) cost += 50;
  if (gkA >= 2) cost += 100;
  if (gkB >= 2) cost += 100;

  // If a team has no fixed GK, it needs at least 2 capable rotating GKs
  // (skill_level >= 3) to avoid suffering in the shared-goal scheme.
  if (gkA === 0) {
    const capable = teamA.filter(p => p.skill_level >= 3).length;
    if (capable < 2) cost += 30;
  }
  if (gkB === 0) {
    const capable = teamB.filter(p => p.skill_level >= 3).length;
    if (capable < 2) cost += 30;
  }

  return { cost, strengthA, strengthB };
}

// ---------- public API ----------

/**
 * Balance a pool of present players into two teams.
 *
 * @param players  all players attending this match (usually 10–14)
 * @param options  balancer knobs
 */
export function balanceTeams(
  players: RankedPlayer[],
  options: BalancerOptions = {}
): BalancedTeams {
  const { rankingWeight = 0.7, seed = 42 } = options;
  const n = players.length;
  if (n < 4) {
    throw new Error(`Need at least 4 players, got ${n}`);
  }

  const teamASize = options.teamASize ?? Math.floor(n / 2);
  const rng = mulberry32(seed);

  let best: BalancedTeams | null = null;

  for (const teamA of combinations(players, teamASize)) {
    const aIds = new Set(teamA.map(p => p.id));
    const teamB = players.filter(p => !aIds.has(p.id));

    const { cost, strengthA, strengthB } = scoreDivision(
      teamA,
      teamB,
      rankingWeight
    );

    const gkA = countPosition(teamA, 'GOLEIRO_FIXO');
    const gkB = countPosition(teamB, 'GOLEIRO_FIXO');

    // tiebreak: stable randomness so identical costs alternate
    const jitter = rng() * 0.001;
    const finalCost = cost + jitter;

    if (!best || finalCost < best.cost) {
      best = {
        teamA,
        teamB,
        cost: finalCost,
        debug: { strengthA, strengthB, gkA, gkB },
      };
    }
  }

  return best!;
}
