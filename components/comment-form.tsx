'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { createMatchComment } from '@/lib/comments';
import { notifyAdminNewComment } from '@/lib/notifications';
import { toast } from 'sonner';

interface CommentFormProps {
  matchId: string;
  onCommentAdded?: () => void;
}

export function CommentForm({ matchId, onCommentAdded }: CommentFormProps) {
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authorName.trim()) {
      toast.error('Digite seu nome');
      return;
    }

    if (!content.trim()) {
      toast.error('Digite um comentário');
      return;
    }

    if (content.trim().length < 5) {
      toast.error('Comentário deve ter pelo menos 5 caracteres');
      return;
    }

    if (content.trim().length > 500) {
      toast.error('Comentário não pode ultrapassar 500 caracteres');
      return;
    }

    setIsLoading(true);

    const result = await createMatchComment(
      matchId,
      authorName,
      content,
      authorEmail || undefined
    );

    setIsLoading(false);

    if (result) {
      toast.success('Comentário enviado! Aguardando aprovação...');
      
      // Send notification to admin (async, non-blocking)
      notifyAdminNewComment(result).catch(error => {
        console.error('Erro ao enviar notificação:', error);
      });
      
      setAuthorName('');
      setContent('');
      setAuthorEmail('');
      onCommentAdded?.();
    } else {
      toast.error('Erro ao enviar comentário. Tente novamente.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      onClick={(e) => e.stopPropagation()}
      className="space-y-3 p-4 bg-gray-50 rounded-lg border"
    >
      <div className="space-y-2">
        <label className="block text-sm font-medium">Seu nome *</label>
        <Input
          type="text"
          placeholder="Ex: João Silva"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          disabled={isLoading}
          maxLength={50}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Email (opcional)</label>
        <Input
          type="email"
          placeholder="seu.email@example.com"
          value={authorEmail}
          onChange={(e) => setAuthorEmail(e.target.value)}
          disabled={isLoading}
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Comentário *</label>
        <textarea
          placeholder="Deixe seu comentário sobre esta partida..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isLoading}
          maxLength={500}
          rows={3}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
        <div className="text-xs text-gray-500 text-right">
          {content.length}/500 caracteres
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 gap-2"
        >
          <Send className="h-4 w-4" />
          {isLoading ? 'Enviando...' : 'Enviar Comentário'}
        </Button>
        <p className="text-xs text-gray-500 self-center">
          Comentários são verificados antes de aparecer
        </p>
      </div>
    </form>
  );
}
