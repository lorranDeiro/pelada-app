/**
 * team-selector.ts — Funções para seleção manual de equipas
 * Persistência e validação de formações manuais
 */

import { supabase } from './supabase';
import type { RankedPlayer, MatchAttendance } from './types';

interface TeamAssignmentResult {
  success: boolean;
  message: string;
  matchId?: string;
  errors?: string[];
}

/**
 * Atualiza match_attendances com as atribuições manuais de equipas
 * @param matchId - ID da partida
 * @param teamA - Jogadores atribuídos à Equipa A
 * @param teamB - Jogadores atribuídos à Equipa B
 */
export async function assignTeamsManually(
  matchId: string,
  teamA: RankedPlayer[],
  teamB: RankedPlayer[]
): Promise<TeamAssignmentResult> {
  try {
    // Validação básica
    if (!matchId) {
      return { success: false, message: 'Match ID é obrigatório' };
    }

    if (teamA.length === 0 || teamB.length === 0) {
      return { success: false, message: 'Ambas as equipas devem ter pelo menos um jogador' };
    }

    const totalPlayers = teamA.length + teamB.length;

    // Preparar dados para atualização
    const updates: Array<{
      match_id: string;
      player_id: string;
      team: 1 | 2;
    }> = [];

    // Equipa A (team = 1)
    teamA.forEach((player) => {
      updates.push({
        match_id: matchId,
        player_id: player.id,
        team: 1,
      });
    });

    // Equipa B (team = 2)
    teamB.forEach((player) => {
      updates.push({
        match_id: matchId,
        player_id: player.id,
        team: 2,
      });
    });

    // Buscar attendances atuais
    const { data: currentAttendances, error: fetchError } = await supabase
      .from('match_attendances')
      .select('id, player_id')
      .eq('match_id', matchId);

    if (fetchError) throw fetchError;

    if (!currentAttendances || currentAttendances.length !== totalPlayers) {
      return {
        success: false,
        message: `Número de jogadores não corresponde. Esperado: ${totalPlayers}, Encontrado: ${currentAttendances?.length || 0}`,
      };
    }

    // Atualizar each attendance com new team
    const errors: string[] = [];

    for (const update of updates) {
      const attendance = currentAttendances.find((a) => a.player_id === update.player_id);
      if (!attendance) {
        errors.push(`Jogador ${update.player_id} não encontrado na presença`);
        continue;
      }

      const { error: updateError } = await supabase
        .from('match_attendances')
        .update({ team: update.team })
        .eq('id', attendance.id);

      if (updateError) {
        errors.push(`Erro ao atualizar jogador: ${updateError.message}`);
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        message: `Erros ao atualizar ${errors.length} jogador(es)`,
        errors,
      };
    }

    // Atualizar status da partida para LIVE se as equipas estiverem prontas
    const { error: matchError } = await supabase
      .from('matches')
      .update({ status: 'LIVE' })
      .eq('id', matchId)
      .eq('status', 'DRAFT');

    if (matchError && matchError.code !== 'PGRST116') {
      // Ignora erro 416 que é "no rows updated"
      throw matchError;
    }

    return {
      success: true,
      message: `Formação salva! ${teamA.length} vs ${teamB.length}`,
      matchId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return {
      success: false,
      message: `Erro ao salvar formação: ${message}`,
    };
  }
}

/**
 * Permite trocar um único jogador de equipa (ajustes de última hora)
 * Útil para permitir ao admin fazer ajustes rápidos após a montagem inicial
 * @param matchId - ID da partida
 * @param playerId - ID do jogador a trocar
 * @param newTeam - Nova equipa (1 ou 2)
 */
export async function swapPlayerTeam(
  matchId: string,
  playerId: string,
  newTeam: 1 | 2
): Promise<TeamAssignmentResult> {
  try {
    const { error } = await supabase
      .from('match_attendances')
      .update({ team: newTeam })
      .eq('match_id', matchId)
      .eq('player_id', playerId);

    if (error) throw error;

    return {
      success: true,
      message: `Jogador trocado para Equipa ${newTeam === 1 ? 'A' : 'B'}`,
      matchId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return {
      success: false,
      message: `Erro ao trocar jogador: ${message}`,
    };
  }
}

/**
 * Valida se uma formação é válida
 * Verifica:
 * - Ambas as equipas têm jogadores
 * - Todos os jogadores presentes foram atribuídos
 * - Goleiros fixos estão distribuídos apropriadamente
 */
export async function validateTeamFormation(
  matchId: string
): Promise<{ valid: boolean; errors: string[] }> {
  try {
    const { data, error } = await supabase
      .from('match_attendances')
      .select(
        `
        team,
        players!inner (position)
      `
      )
      .eq('match_id', matchId);

    if (error) throw error;

    const errors: string[] = [];

    if (!data || data.length === 0) {
      errors.push('Nenhum jogador foi atribuído');
      return { valid: false, errors };
    }

    const team1Count = data.filter((a: any) => a.team === 1).length;
    const team2Count = data.filter((a: any) => a.team === 2).length;

    if (team1Count === 0) {
      errors.push('Equipa A está vazia');
    }

    if (team2Count === 0) {
      errors.push('Equipa B está vazia');
    }

    // Validação opcional: distribuição de goleiros
    const team1Gk = data.filter((a: any) => a.team === 1 && a.players?.position === 'GOLEIRO_FIXO').length;
    const team2Gk = data.filter((a: any) => a.team === 2 && a.players?.position === 'GOLEIRO_FIXO').length;

    if (team1Gk === 0 && team2Gk === 0) {
      errors.push('Aviso: Nenhuma equipa tem um goleiro fixo. Considere reatribuir.');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : [],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return {
      valid: false,
      errors: [message],
    };
  }
}

/**
 * Obtém a formação atual de uma partida
 */
export async function getCurrentFormation(
  matchId: string
): Promise<{
  teamA: RankedPlayer[];
  teamB: RankedPlayer[];
} | null> {
  try {
    const { data, error } = await supabase
      .from('match_attendances')
      .select(
        `
        team,
        players:player_id (
          id,
          name,
          position,
          skill_level
        )
      `
      )
      .eq('match_id', matchId);

    if (error) throw error;

    if (!data) return null;

    // TypeScript não consegue inferir o tipo aninhado, então fazemos type assertion
    const teamA: RankedPlayer[] = [];
    const teamB: RankedPlayer[] = [];

    (data as any[]).forEach((attendance: any) => {
      const player = attendance.players as RankedPlayer;
      if (attendance.team === 1) {
        teamA.push(player);
      } else {
        teamB.push(player);
      }
    });

    return { teamA, teamB };
  } catch (err) {
    console.error('Error fetching current formation:', err);
    return null;
  }
}
