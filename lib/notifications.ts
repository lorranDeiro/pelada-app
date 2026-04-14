/**
 * Notifications system for Pelada App
 * Handles email and in-app toast notifications
 */

import { toast } from 'sonner';
import type { MatchComment } from './types';

/**
 * Enviar email de notificação para admin quando há novo comentário
 * Usa edge function do Supabase
 */
export async function notifyAdminNewComment(comment: MatchComment, matchDate?: string) {
  try {
    const response = await fetch('/api/notify-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        commentId: comment.id,
        authorName: comment.author_name,
        authorEmail: comment.author_email,
        content: comment.content,
        matchId: comment.match_id,
        matchDate,
        createdAt: comment.created_at,
      }),
    });

    if (!response.ok) {
      console.error('Erro ao enviar notificação de email');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return false;
  }
}

/**
 * Show toast notification with custom styling
 */
export function showCommentNotification(type: 'created' | 'approved' | 'deleted', message?: string) {
  const defaultMessages = {
    created: 'Comentário enviado! Obrigado 🎉',
    approved: 'Comentário aprovado! ✅',
    deleted: 'Comentário removido',
  };

  const finalMessage = message || defaultMessages[type];

  switch (type) {
    case 'created':
      toast.success(finalMessage, {
        description: 'Seu comentário está aguardando aprovação',
      });
      break;
    case 'approved':
      toast.success(finalMessage);
      break;
    case 'deleted':
      toast.info(finalMessage);
      break;
  }
}

/**
 * Show error notification
 */
export function showErrorNotification(title: string, description?: string) {
  toast.error(title, {
    description,
  });
}

