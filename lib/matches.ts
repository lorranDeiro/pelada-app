/**
 * Match filtering and retrieval functions
 */

import { supabase } from './supabase';
import type { HistoryFilters } from '@/components/history-filters';

interface Match {
  id: string;
  date: string;
  status: string;
  team_a_score: number;
  team_b_score: number;
  duration_minutes: number;
  notes?: string;
  created_at: string;
}

/**
 * Fetch all finished matches with optional filters
 */
export async function getFinishedMatches(filters?: HistoryFilters): Promise<Match[]> {
  try {
    let query = supabase
      .from('matches')
      .select('*')
      .eq('status', 'FINISHED')
      .order('date', { ascending: false });

    // Apply date filters
    if (filters?.startDate) {
      query = query.gte('date', `${filters.startDate}T00:00:00`);
    }

    if (filters?.endDate) {
      query = query.lte('date', `${filters.endDate}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar partidas:', error);
      return [];
    }

    // Client-side filtering for player (requires fetching attendances)
    if (filters?.playerId) {
      const { data: attendances, error: attendanceError } = await supabase
        .from('match_attendances')
        .select('match_id')
        .eq('player_id', filters.playerId);

      if (!attendanceError && attendances) {
        const playerMatchIds = new Set(attendances.map((a) => a.match_id));
        return (data || []).filter((match) => playerMatchIds.has(match.id));
      }
    }

    // Filter by team (requires match_attendances to know team composition)
    if (filters?.team !== 'all') {
      // This would require joining with match_attendances
      // For now, we'll skip this filter on the backend
      // You can implement team filtering by checking player teams
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar partidas com filtros:', error);
    return [];
  }
}

/**
 * Fetch player list for filter dropdown
 */
export async function getPlayersForFilter(): Promise<Array<{ id: string; name: string }>> {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('id, name')
      .eq('active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar jogadores:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar jogadores:', error);
    return [];
  }
}

/**
 * Get match details with all attendees and stats
 */
export async function getMatchDetails(matchId: string) {
  try {
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(
        `
        *,
        match_attendances (
          id,
          player_id,
          team,
          gk_shift_id,
          player:player_id (id, name, position)
        ),
        match_events (
          *
        )
      `
      )
      .eq('id', matchId)
      .single();

    if (matchError) {
      console.error('Erro ao buscar detalhes da partida:', matchError);
      return null;
    }

    return match;
  } catch (error) {
    console.error('Erro ao buscar detalhes da partida:', error);
    return null;
  }
}
