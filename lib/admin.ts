import { supabase } from './supabase';

/**
 * Verifica se um usuário é admin
 * Retorna false se houver erro ou usuário não for admin
 */
export async function isAdmin(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;

  try {
    const { data, error } = await supabase
      .from('players')
      .select('is_admin', { count: 'exact' })
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      // Log para debugging — erros de autenticação/RLS não são críticos para admin check
      console.warn('isAdmin query error (non-critical):', error.message);
      return false;
    }
    
    // Se não encontrou o usuário, não é admin
    if (!data) return false;
    
    return data.is_admin === true;
  } catch (e) {
    console.error('isAdmin exception:', e);
    return false;
  }
}

/**
 * Recalcula player_match_results para uma partida após edição
 * Chama a RPC no Supabase que deleta e reinsere os resultados
 */
export async function recomputeMatch(matchId: string): Promise<{ updated_count: number } | null> {
  try {
    const { data, error } = await supabase.rpc('recompute_match_results', {
      p_match_id: matchId,
    });

    if (error) {
      console.error('RPC recompute_match_results failed:', error);
      return null;
    }

    // data é um array com um objeto {match_id, updated_count}
    if (Array.isArray(data) && data.length > 0) {
      return { updated_count: data[0].updated_count };
    }

    return null;
  } catch (e) {
    console.error('Error calling recompute_match_results:', e);
    return null;
  }
}

/**
 * Registra mudança em partida finalizada no audit log
 */
export async function logMatchEdit(
  matchId: string,
  adminId: string | null,
  action: string,
  payloadBefore: any,
  payloadAfter: any
): Promise<void> {
  try {
    await supabase.from('match_edit_log').insert({
      match_id: matchId,
      admin_id: adminId,
      action,
      payload_before: payloadBefore,
      payload_after: payloadAfter,
    });
  } catch (e) {
    console.error('Error logging match edit:', e);
  }
}
