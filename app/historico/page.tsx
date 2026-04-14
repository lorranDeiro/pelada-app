'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { AppNav } from '@/components/app-nav';
import { RequireAuth } from '@/components/require-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
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

  useEffect(() => {
    (async () => {
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
      const { error } = await supabase
        .from('matches')
        .delete()
        .neq('id', '');
      
      if (error) {
        toast.error('Erro ao limpar histórico', { description: error.message });
        return;
      }

      setMatches([]);
      toast.success('Histórico limpo com sucesso');
    } catch (err) {
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
        {matches.length > 0 && (
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
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma partida ainda.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {matches.map((m) => (
            <li key={m.id}>
              <Link href={`/partida/${m.id}`} className="block">
                <Card className="transition-colors hover:bg-accent">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="flex-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {formatDate(m.played_at)}
                        </span>
                        <Badge variant={statusVariant(m.status)}>{m.status}</Badge>
                      </div>
                      <div className="mt-0.5 tabular-nums text-muted-foreground">
                        {m.team_a_name} {m.score_a} × {m.score_b} {m.team_b_name}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function statusVariant(status: Match['status']): 'default' | 'secondary' | 'outline' {
  if (status === 'FINISHED') return 'secondary';
  if (status === 'LIVE') return 'default';
  return 'outline';
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
