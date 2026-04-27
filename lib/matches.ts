import { supabase } from './supabase';
import type { Match, MatchEvent, Player } from './types';
import type { HistoryFilters } from '@/components/history-filters';
import { buildPlayerMatchResult, outcomeFor } from './scoring';

export async function finalizeMatch(
  match: Match,
  roster: Array<Player & { team: 1 | 2 }>,
  events: MatchEvent[],
  scoreA: number,
  scoreB: number,
  mvpId: string | null
): Promise<void> {
  // Update match status and scores
  const { error: updateErr } = await supabase
    .from('matches')
    .update({
      score_a: scoreA,
      score_b: scoreB,
      mvp_player_id: mvpId,
      status: 'FINISHED',
    })
    .eq('id', match.id);
  if (updateErr) throw updateErr;

  // Build player_match_results
  const eventsByPlayer = new Map<string, MatchEvent[]>();
  events.forEach((e) => {
    const list = eventsByPlayer.get(e.player_id) ?? [];
    list.push(e);
    eventsByPlayer.set(e.player_id, list);
  });

  const results = roster.map((p) => {
    const outcome = outcomeFor(p.team, scoreA, scoreB);
    return buildPlayerMatchResult({
      match_id: match.id,
      player_id: p.id,
      team: p.team,
      outcome,
      events: eventsByPlayer.get(p.id) ?? [],
      isMvp: mvpId === p.id,
    });
  });

  // Insert player_match_results
  const { error: insertErr } = await supabase
    .from('player_match_results')
    .insert(results);
  if (insertErr) throw insertErr;
}

export async function getFinishedMatches(filters?: HistoryFilters): Promise<Match[]> {
  let query = supabase
    .from('matches')
    .select('*')
    .eq('status', 'FINISHED')
    .order('played_at', { ascending: false });

  if (filters?.startDate) {
    query = query.gte('played_at', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('played_at', filters.endDate);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao buscar partidas:', error);
    return [];
  }

  let matches = (data ?? []) as Match[];

  if (filters?.playerId) {
    const { data: attendances } = await supabase
      .from('match_attendances')
      .select('match_id, team')
      .eq('player_id', filters.playerId);

    const teamByMatch = new Map<string, 1 | 2>(
      (attendances ?? []).map((a) => [a.match_id, a.team as 1 | 2])
    );
    matches = matches.filter((m) => teamByMatch.has(m.id));

    if (filters.team !== 'all') {
      const targetTeam: 1 | 2 = filters.team === 'escuros' ? 1 : 2;
      matches = matches.filter((m) => teamByMatch.get(m.id) === targetTeam);
    }
  }

  return matches;
}

export async function getPlayersForFilter(): Promise<Array<{ id: string; name: string }>> {
  const { data, error } = await supabase
    .from('players')
    .select('id, name')
    .eq('active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Erro ao buscar jogadores:', error);
    return [];
  }
  return data ?? [];
}

export async function getMatchDetails(matchId: string) {
  const { data, error } = await supabase
    .from('matches')
    .select(
      `
      *,
      match_attendances (
        id,
        player_id,
        team,
        player:player_id (id, name, position)
      ),
      match_events (*)
    `
    )
    .eq('id', matchId)
    .single();

  if (error) {
    console.error('Erro ao buscar detalhes da partida:', error);
    return null;
  }
  return data;
}
