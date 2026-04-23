// =====================================================================
// mvp-voting.ts — MVP Voting system (5-min window post-match)
// =====================================================================

import { supabase } from './supabase';

/**
 * Register or update a vote for MVP in a match.
 * Each user can vote once; subsequent votes replace the previous one.
 */
export async function registerMvpVote({
  matchId,
  votingUserId,
  votePlayerId,
}: {
  matchId: string;
  votingUserId: string;
  votePlayerId: string;
}): Promise<void> {
  const { error } = await supabase
    .from('mvp_votes')
    .upsert(
      {
        match_id: matchId,
        voting_user_id: votingUserId,
        vote_player_id: votePlayerId,
      },
      {
        onConflict: 'match_id,voting_user_id',
      }
    );

  if (error) {
    throw new Error(`Failed to register MVP vote: ${error.message}`);
  }
}

/**
 * Fetch current MVP vote results for a match.
 * Returns vote counts by player_id.
 */
export async function fetchMvpVoteResults(matchId: string): Promise<
  {
    player_id: string;
    vote_count: number;
  }[]
> {
  const { data, error } = await supabase
    .from('mvp_votes')
    .select('vote_player_id')
    .eq('match_id', matchId);

  if (error) {
    throw new Error(`Failed to fetch MVP votes: ${error.message}`);
  }

  // Count votes by player_id
  const voteCounts = new Map<string, number>();
  (data ?? []).forEach((v) => {
    const count = voteCounts.get(v.vote_player_id) ?? 0;
    voteCounts.set(v.vote_player_id, count + 1);
  });

  return Array.from(voteCounts.entries()).map(([player_id, vote_count]) => ({
    player_id,
    vote_count,
  }));
}

/**
 * Check if MVP voting is still open for a match.
 * Voting closes 5 minutes after match finalization.
 */
export async function isMvpVotingOpen(matchId: string): Promise<boolean> {
  const { data: match, error } = await supabase
    .from('matches')
    .select('status, created_at')
    .eq('id', matchId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch match: ${error.message}`);
  }

  // Voting only available for FINISHED matches
  if (match.status !== 'FINISHED') {
    return false;
  }

  // Check if voting window (5 minutes) is still open
  const finishedAt = new Date(match.created_at);
  const now = new Date();
  const elapsedMs = now.getTime() - finishedAt.getTime();
  const votingWindowMs = 5 * 60 * 1000; // 5 minutes

  return elapsedMs < votingWindowMs;
}

/**
 * Get the next MVP winner based on vote counts.
 * Returns the player_id with the most votes.
 * In case of tie, returns null (requires manual selection).
 */
export async function determineMvpWinner(
  matchId: string
): Promise<string | null> {
  const results = await fetchMvpVoteResults(matchId);

  if (results.length === 0) {
    return null; // No votes
  }

  // Sort by vote count descending
  results.sort((a, b) => b.vote_count - a.vote_count);

  // Check for tie at top
  if (results.length > 1 && results[0].vote_count === results[1].vote_count) {
    return null; // Tie: requires admin decision
  }

  return results[0].player_id;
}

/**
 * Get the current vote for a user in a match.
 */
export async function getUserMvpVote(
  matchId: string,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('mvp_votes')
    .select('vote_player_id')
    .eq('match_id', matchId)
    .eq('voting_user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch user MVP vote: ${error.message}`);
  }

  return data?.vote_player_id ?? null;
}
