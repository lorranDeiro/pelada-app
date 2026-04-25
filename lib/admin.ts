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
 * Recalcula player_match_results para uma partida após edição.
 * Chama a RPC recompute_match_results e lança erro com mensagem real
 * do Postgres (em vez de retornar null e perder o motivo).
 */
export async function recomputeMatch(matchId: string): Promise<{ updated_count: number }> {
  const { data, error } = await supabase.rpc('recompute_match_results', {
    p_match_id: matchId,
  });

  if (error) {
    console.error('RPC recompute_match_results failed:', error);
    throw new Error(error.message || error.details || 'Falha no recomputo');
  }

  if (Array.isArray(data) && data.length > 0) {
    return { updated_count: data[0].updated_count };
  }

  throw new Error('Recomputo retornou sem dados');
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
