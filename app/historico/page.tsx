'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AppNav } from '@/components/app-nav';
import { RequireAuth } from '@/components/require-auth';
import { MatchRow } from '@/components/match-row';
import { supabase } from '@/lib/supabase';
import { isAdmin } from '@/lib/admin';
import type { Match } from '@/lib/types';

export default function HistoricoPage() {
  return (
    <RequireAuth>
      <AppNav />
      <HistoricoContent />
    </RequireAuth>
  );
}

function HistoricoContent() {
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user?.id) {
        setAdmin(await isAdmin(auth.user.id));
      }

      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('played_at', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) {
        toast.error('Erro ao carregar histórico', { description: error.message });
        return;
      }
      setMatches((data ?? []) as Match[]);
    })();
  }, []);

  const handleClearHistory = async () => {
    if (!confirm(`Tem certeza que quer deletar ${matches?.length || 0} partidas? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setIsClearing(true);
    try {
      if (!matches || matches.length === 0) {
        toast.info('Não há partidas a deletar');
        setIsClearing(false);
        return;
      }

      const matchIds = matches.map(m => m.id);
      let deletedCount = 0;
      let errorOccurred = false;

      for (const matchId of matchIds) {
        const { error } = await supabase
          .from('matches')
          .delete()
          .eq('id', matchId);

        if (error) {
          console.error(`Error deleting match ${matchId}:`, error);
          errorOccurred = true;
        } else {
          deletedCount++;
        }
      }

      if (errorOccurred) {
        toast.error(`Deletadas ${deletedCount}/${matchIds.length} partidas. Houve erros para algumas partidas.`);
      } else {
        setMatches([]);
        toast.success(`${deletedCount} partidas deletadas com sucesso`);
      }
    } catch (err) {
      console.error('Error clearing history:', err);
      toast.error('Erro ao limpar histórico');
    } finally {
      setIsClearing(false);
    }
  };

  if (!matches) {
    return <main className="p-4 text-sm text-muted-foreground">Carregando…</main>;
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Histórico</h1>
        {matches.length > 0 && admin && (
          <button
            onClick={handleClearHistory}
            disabled={isClearing}
            className="px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isClearing ? 'Limpando...' : 'Limpar'}
          </button>
        )}
      </div>

      {matches.length === 0 ? (
        <div className="rounded-lg border border-fs-border bg-fs-surface py-8 text-center text-sm text-fs-text-dim">
          Nenhuma partida ainda.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-fs-border bg-fs-surface">
          {matches.map((m) => (
            <MatchRow key={m.id} match={m} showAdminEdit={admin} />
          ))}
        </div>
      )}
    </main>
  );
}
