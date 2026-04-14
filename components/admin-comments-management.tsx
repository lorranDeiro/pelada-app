'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, Check, AlertCircle, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { deleteMatchComment, verifyMatchComment, getPendingCommentsCount } from '@/lib/comments';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import type { MatchComment } from '@/lib/types';

export function AdminCommentsManagement() {
  const [comments, setComments] = useState<(MatchComment & { match_date?: string; match_status?: string })[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');

  useEffect(() => {
    loadComments();
    loadPendingCount();

    // Real-time subscription for comments
    const subscription = supabase
      .channel('match_comments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_comments',
        },
        () => {
          loadComments();
          loadPendingCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadComments() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('match_comments')
        .select(
          `
          *,
          matches:match_id (
            date,
            status,
            team_a_score,
            team_b_score
          )
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processed = data?.map((comment) => ({
        ...comment,
        match_date: comment.matches?.date,
        match_status: comment.matches?.status,
      })) || [];

      setComments(processed);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
      toast.error('Erro ao carregar comentários');
    } finally {
      setLoading(false);
    }
  }

  async function loadPendingCount() {
    const count = await getPendingCommentsCount();
    setPendingCount(count);
  }

  async function handleApprove(commentId: string) {
    try {
      const success = await verifyMatchComment(commentId);
      if (success) {
        toast.success('Comentário aprovado!');
        loadComments();
        loadPendingCount();
      } else {
        toast.error('Erro ao aprovar comentário');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao aprovar comentário');
    }
  }

  async function handleDelete(commentId: string, authorName: string) {
    if (!confirm(`Tem certeza que deseja deletar o comentário de ${authorName}?`)) {
      return;
    }

    try {
      const success = await deleteMatchComment(commentId);
      if (success) {
        toast.success('Comentário deletado!');
        loadComments();
        loadPendingCount();
      } else {
        toast.error('Erro ao deletar comentário');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao deletar comentário');
    }
  }

  const filteredComments = comments.filter((comment) => {
    if (filter === 'pending') return !comment.is_verified;
    if (filter === 'approved') return comment.is_verified;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Pendentes</p>
              <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">{pendingCount}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-amber-500" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-100">Aprovados</p>
              <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                {comments.filter((c) => c.is_verified).length}
              </p>
            </div>
            <Check className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Total</p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{comments.length}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
          className="gap-2"
        >
          <AlertCircle className="h-4 w-4" />
          Pendentes
        </Button>
        <Button
          variant={filter === 'approved' ? 'default' : 'outline'}
          onClick={() => setFilter('approved')}
          className="gap-2"
        >
          <Check className="h-4 w-4" />
          Aprovados
        </Button>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          Todos
        </Button>
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        {loading ? (
          <Card className="p-8 text-center text-gray-500">Carregando comentários...</Card>
        ) : filteredComments.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">Nenhum comentário encontrado</Card>
        ) : (
          filteredComments.map((comment) => (
            <Card key={comment.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{comment.author_name}</h3>
                    {comment.is_verified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                        <Check className="h-3 w-3" />
                        Aprovado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">
                        <AlertCircle className="h-3 w-3" />
                        Pendente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 break-words">{comment.content}</p>
                  {comment.author_email && (
                    <p className="text-xs text-gray-500 mt-2">Email: {comment.author_email}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  {!comment.is_verified && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApprove(comment.id)}
                      className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                    >
                      <Check className="h-4 w-4" />
                      Aprovar
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(comment.id, comment.author_name)}
                    className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                    Deletar
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
