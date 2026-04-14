import { supabase } from './supabase';
import type { MatchComment } from './types';

/**
 * Fetch comments for a specific match (public - só comentários verificados)
 */
export async function getMatchComments(matchId: string): Promise<MatchComment[]> {
  try {
    const { data, error } = await supabase
      .from('match_comments')
      .select('*')
      .eq('match_id', matchId)
      .eq('is_verified', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar comentários:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar comentários:', error);
    return [];
  }
}

/**
 * Fetch all comments for a match (admin only)
 */
export async function getAllMatchComments(matchId: string): Promise<MatchComment[]> {
  try {
    const { data, error } = await supabase
      .from('match_comments')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar todos os comentários:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar todos os comentários:', error);
    return [];
  }
}

/**
 * Create a new comment (público - sem autenticação)
 */
export async function createMatchComment(
  matchId: string,
  authorName: string,
  content: string,
  authorEmail?: string
): Promise<MatchComment | null> {
  try {
    const { data, error } = await supabase
      .from('match_comments')
      .insert([
        {
          match_id: matchId,
          author_name: authorName.trim(),
          author_email: authorEmail?.trim() || null,
          content: content.trim(),
          is_verified: false, // Comentários públicos precisam de verificação
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar comentário:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao criar comentário:', error);
    return null;
  }
}

/**
 * Verify/approve a comment (admin only)
 */
export async function verifyMatchComment(commentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('match_comments')
      .update({ is_verified: true })
      .eq('id', commentId);

    if (error) {
      console.error('Erro ao verificar comentário:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao verificar comentário:', error);
    return false;
  }
}

/**
 * Delete a comment (admin only)
 */
export async function deleteMatchComment(commentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('match_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Erro ao deletar comentário:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao deletar comentário:', error);
    return false;
  }
}

/**
 * Get pending comments count (admin dashboard)
 */
export async function getPendingCommentsCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('match_comments')
      .select('id', { count: 'exact', head: true })
      .eq('is_verified', false);

    if (error) {
      console.error('Erro ao contar comentários pendentes:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Erro ao contar comentários pendentes:', error);
    return 0;
  }
}
