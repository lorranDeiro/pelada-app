// =====================================================================
// achievements.ts — Badge/Achievement logic based on seasonal stats
// =====================================================================

import type { SeasonStats } from './types';

export interface Badge {
  label: string;
  icon: string;
  tooltip?: string;
}

/**
 * Determine which badges a player has earned based on their season stats
 * compared to all other players in the same season.
 *
 * Badges:
 * - "Artilheiro" (⚽): Leader or tied in goals (min 1)
 * - "Garçom" (🎩): Leader or tied in assists (min 1)
 * - "Paredão" (🧱): Leader or tied in saves (min 1)
 * - "MVP" (⭐): Has 1+ MVP selections
 * - "Açougueiro" (🔪): Lowest avg_rating among players with 5+ matches
 *   (the seasoned player the team prefers not to face)
 */
export function getPlayerBadges(
  playerStats: SeasonStats,
  allStats: SeasonStats[]
): Badge[] {
  const badges: Badge[] = [];

  if (!playerStats || allStats.length === 0) {
    return badges;
  }

  const maxGoals = Math.max(...allStats.map((s) => s.goals), 0);
  const maxAssists = Math.max(...allStats.map((s) => s.assists), 0);
  const maxSaves = Math.max(...allStats.map((s) => s.saves), 0);

  if (playerStats.goals > 0 && playerStats.goals === maxGoals) {
    badges.push({
      label: 'Artilheiro',
      icon: '⚽',
      tooltip: `Líder em gols (${playerStats.goals})`,
    });
  }

  if (playerStats.assists > 0 && playerStats.assists === maxAssists) {
    badges.push({
      label: 'Garçom',
      icon: '🎩',
      tooltip: `Líder em assistências (${playerStats.assists})`,
    });
  }

  if (playerStats.saves > 0 && playerStats.saves === maxSaves) {
    badges.push({
      label: 'Paredão',
      icon: '🧱',
      tooltip: `Líder em defesas (${playerStats.saves})`,
    });
  }

  if ((playerStats.mvp_count ?? 0) > 0) {
    badges.push({
      label: 'MVP',
      icon: '⭐',
      tooltip: `${playerStats.mvp_count} ${playerStats.mvp_count === 1 ? 'MVP' : 'MVPs'}`,
    });
  }

  // === AÇOUGUEIRO ===
  // Lowest avg_rating among players with more than 5 matches.
  const experienced = allStats.filter((s) => s.matches_played > 5);
  if (experienced.length > 0 && playerStats.matches_played > 5) {
    const minRating = Math.min(...experienced.map((s) => s.avg_rating ?? 0));
    if ((playerStats.avg_rating ?? 0) === minRating) {
      badges.push({
        label: 'Açougueiro',
        icon: '🔪',
        tooltip: `Menor média (${(playerStats.avg_rating ?? 0).toFixed(1)}) com ${playerStats.matches_played} partidas`,
      });
    }
  }

  return badges;
}

/**
 * Determine the tier/rarity of a player card based on dynamic_rating.
 * Tiers:
 * - bronze:  0.0 – 1.5
 * - silver:  1.6 – 3.0
 * - gold:    3.1 – 4.4
 * - legend:  4.5 – 5.0
 */
export function getCardTier(dynamicRating: number | undefined): 'bronze' | 'silver' | 'gold' | 'legend' {
  const rating = dynamicRating ?? 0;
  if (rating >= 4.5) return 'legend';
  if (rating >= 3.1) return 'gold';
  if (rating >= 1.6) return 'silver';
  return 'bronze';
}
