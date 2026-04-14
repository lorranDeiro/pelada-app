'use client';

import { useEffect, useState } from 'react';
import { getMatchComments } from '@/lib/comments';
import type { MatchComment } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle } from 'lucide-react';

interface CommentsListProps {
  matchId: string;
  refreshTrigger?: number;
}

export function CommentsList({ matchId, refreshTrigger }: CommentsListProps) {
  const [comments, setComments] = useState<MatchComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadComments = async () => {
      setIsLoading(true);
      const data = await getMatchComments(matchId);
      setComments(data);
      setIsLoading(false);
    };

    loadComments();
  }, [matchId, refreshTrigger]);

  if (isLoading) {
    return <div className="text-center py-4 text-gray-500">Carregando comentários...</div>;
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="p-3 bg-white border rounded-lg space-y-1 hover:shadow-sm transition"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-sm">{comment.author_name}</p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-800 leading-relaxed">{comment.content}</p>
        </div>
      ))}
    </div>
  );
}
