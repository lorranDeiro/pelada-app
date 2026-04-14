'use client';

import { use, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AppNav } from '@/components/app-nav';
import { RequireAuth } from '@/components/require-auth';
import { LiveMatchPanel, type RosterPlayer } from '@/components/live-match-panel';
import { supabase } from '@/lib/supabase';
import type { Match, MatchAttendance, Player } from '@/lib/types';

interface Props {
  params: Promise<{ id: string }>;
}

export default function PartidaPage({ params }: Props) {
  const { id } = use(params);
  return (
    <RequireAuth>
      <AppNav />
      <PartidaLoader matchId={id} />
    </RequireAuth>
  );
}

function PartidaLoader({ matchId }: { matchId: string }) {
  const [match, setMatch] = useState<Match | null>(null);
  const [roster, setRoster] = useState<RosterPlayer[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data: matchData, error: matchErr } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();
      if (matchErr || !matchData) {
        toast.error('Partida não encontrada');
        return;
      }
      setMatch(matchData as Match);

      const { data: attendances, error: attErr } = await supabase
        .from('match_attendances')
        .select('team, player_id, players(*)')
        .eq('match_id', matchId);
      if (attErr) {
        toast.error('Erro ao carregar elenco', { description: attErr.message });
        return;
      }

      const rows = (attendances ?? []).map((a) => {
        const rel = a as unknown as MatchAttendance & { players: Player };
        return { ...rel.players, team: rel.team };
      });
      setRoster(rows);
    })();
  }, [matchId]);

  if (!match || !roster) {
    return <main className="p-4 text-sm text-muted-foreground">Carregando…</main>;
  }

  return <LiveMatchPanel match={match} roster={roster} />;
}
