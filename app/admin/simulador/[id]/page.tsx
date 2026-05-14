'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Swords, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { simulateMatch, type MatchSimulation } from '@/lib/match-simulation';
import { MatchSimulatorUI } from '@/components/match-simulator-ui';
import { RequireAuth } from '@/components/require-auth';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import type { Match, RankedPlayer, MatchAttendance, Player } from '@/lib/types';

interface Props {
  params: Promise<{ id: string }>;
}

export default function AdminSimulatorPage({ params }: Props) {
  const { id } = use(params);
  return (
    <RequireAuth>
      <AdminSimulatorLoader matchId={id} />
    </RequireAuth>
  );
}

function AdminSimulatorLoader({ matchId }: { matchId: string }) {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  const [match, setMatch] = useState<Match | null>(null);
  const [teams, setTeams] = useState<{ teamA: any[], teamB: any[] } | null>(null);
  const [simulation, setSimulation] = useState<MatchSimulation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/simulador');
      return;
    }

    async function load() {
      setLoading(true);
      const { data: matchData } = await supabase.from('matches').select('*').eq('id', matchId).single();
      if (!matchData) {
        router.back();
        return;
      }
      setMatch(matchData as Match);

      const { data: attendances } = await supabase
        .from('match_attendances')
        .select('team, player_id, players(*)')
        .eq('match_id', matchId);

      // Get current season stats for enrichment
      const { data: stats } = await supabase
        .from('v_player_season_stats_full')
        .select('*')
        .eq('season_id', matchData.season_id);

      const players = (attendances || []).map((a: any) => {
        const p = a.players as Player;
        const s = stats?.find(st => st.player_id === p.id);
        return {
          ...p,
          season_points: s?.total_points || 0,
          matches_played_season: s?.matches_played || 0,
          avg_rating: s?.avg_rating || p.skill_level || 3,
          team: a.team
        };
      });

      const teamA = players.filter(p => p.team === 1);
      const teamB = players.filter(p => p.team === 2);

      setTeams({ teamA, teamB });
      setSimulation(simulateMatch(teamA as any, teamB as any));
      setLoading(false);
    }

    if (isAdmin) load();
  }, [matchId, isAdmin, authLoading, router]);

  const handleResimulate = () => {
    if (!teams) return;
    setSimulation(simulateMatch(teams.teamA as any, teams.teamB as any));
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-10 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary pb-24">
      <header className="sticky top-0 z-10 border-b border-surface-border/40 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.back()}
            className="gap-1 text-text-secondary hover:text-accent-bright"
          >
            <ArrowLeft className="size-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="font-black text-xs uppercase tracking-widest text-accent/60 italic">Admin Pro Simulator</h1>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {simulation && match && (
          <MatchSimulatorUI 
            simulation={simulation}
            teamAName={match.team_a_name}
            teamBName={match.team_b_name}
            onResimulate={handleResimulate}
          />
        )}
      </main>
    </div>
  );
}
