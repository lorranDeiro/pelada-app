'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { AppNav } from '@/components/app-nav';
import { RequireAuth } from '@/components/require-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getOrCreateActiveSeason } from '@/lib/season';
import { supabase } from '@/lib/supabase';
import type { Season, SeasonStats } from '@/lib/types';

export default function Home() {
  return (
    <RequireAuth>
      <AppNav />
      <HomeContent />
    </RequireAuth>
  );
}

function HomeContent() {
  const [season, setSeason] = useState<Season | null>(null);
  const [stats, setStats] = useState<SeasonStats[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const activeSeason = await getOrCreateActiveSeason();
        setSeason(activeSeason);
        const { data, error } = await supabase
          .from('v_player_season_stats')
          .select('*')
          .eq('season_id', activeSeason.id)
          .order('total_points', { ascending: false });
        if (error) throw error;
        setStats((data ?? []) as SeasonStats[]);
      } catch (e) {
        toast.error('Erro ao carregar ranking', {
          description: e instanceof Error ? e.message : String(e),
        });
        setStats([]);
      }
    })();
  }, []);

  if (!stats) {
    return <main className="p-4 text-sm text-muted-foreground">Carregando…</main>;
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-4">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-semibold">Ranking</h1>
        {season && <Badge variant="outline">Temporada {season.name}</Badge>}
      </div>

      {stats.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ainda sem partidas finalizadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Cadastre jogadores no{' '}
              <Link href="/elenco" className="font-medium text-foreground underline">
                Elenco
              </Link>{' '}
              e registre a primeira em{' '}
              <Link
                href="/partida/nova"
                className="font-medium text-foreground underline"
              >
                Nova partida
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      ) : (
        <RankingTable stats={stats} />
      )}
    </main>
  );
}

function RankingTable({ stats }: { stats: SeasonStats[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-2 py-2 text-left">Jogador</th>
              <th className="px-2 py-2 text-right">J</th>
              <th className="px-2 py-2 text-right">Nota</th>
              <th className="px-3 py-2 text-right">Pts</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s, i) => (
              <tr key={s.player_id} className="border-b last:border-0">
                <td className="px-3 py-2 text-muted-foreground tabular-nums">
                  {i + 1}
                </td>
                <td className="max-w-0 px-2 py-2">
                  <div className="flex items-center gap-1.5">
                    {s.position === 'GOLEIRO_FIXO' && <span>🧤</span>}
                    <span className="truncate font-medium">{s.name}</span>
                    {s.mvp_count > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        🏆 {s.mvp_count}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {s.wins}V {s.draws}E {s.losses}D · {s.goals}G {s.assists}A{' '}
                    {s.saves}D
                  </div>
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {s.matches_played}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {Number(s.avg_rating).toFixed(1)}
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">
                  {Number(s.total_points).toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
