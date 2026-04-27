'use client';

import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { supabase } from '@/lib/supabase';

interface MatchPoint {
  match: string;
  goals: number;
  assists: number;
  decided: number; // 1 se houve vencedor, 0 se empate
}

interface PmrRow {
  goals: number | null;
  assists: number | null;
}

interface MatchRow {
  played_at: string;
  score_a: number;
  score_b: number;
  player_match_results: PmrRow[] | null;
}

interface Props {
  seasonId: string;
}

export function SeasonOverviewChart({ seasonId }: Props) {
  const [data, setData] = useState<MatchPoint[] | null>(null);

  useEffect(() => {
    let alive = true;
    setData(null);

    (async () => {
      const { data: rows, error } = await supabase
        .from('matches')
        .select(
          'played_at,score_a,score_b,player_match_results(goals,assists)'
        )
        .eq('season_id', seasonId)
        .eq('status', 'FINISHED')
        .order('played_at', { ascending: true });

      if (!alive) return;
      if (error) {
        setData([]);
        return;
      }

      const points: MatchPoint[] = ((rows ?? []) as MatchRow[]).map((m) => {
        const pmr = m.player_match_results ?? [];
        return {
          match: new Date(m.played_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
          }),
          goals: pmr.reduce((s, r) => s + (r.goals ?? 0), 0),
          assists: pmr.reduce((s, r) => s + (r.assists ?? 0), 0),
          decided: m.score_a === m.score_b ? 0 : 1,
        };
      });

      setData(points);
    })();

    return () => {
      alive = false;
    };
  }, [seasonId]);

  if (!data) {
    return <div className="h-72 w-full animate-pulse rounded-md bg-muted/40" />;
  }

  if (data.length === 0) {
    return (
      <div className="rounded-md border border-fs-border bg-fs-surface p-6 text-center text-sm text-fs-text-dim">
        Nenhuma partida finalizada nessa temporada ainda.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
          <CartesianGrid stroke="rgb(148 163 184 / 0.2)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="match" tick={{ fontSize: 11, fill: 'rgb(148 163 184)' }} />
          <YAxis tick={{ fontSize: 11, fill: 'rgb(148 163 184)' }} />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid rgb(148 163 184 / 0.3)',
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="goals"   name="Gols"          fill="#ec4899" radius={[4, 4, 0, 0]} />
          <Bar dataKey="assists" name="Assistências"  fill="#a78bfa" radius={[4, 4, 0, 0]} />
          <Bar dataKey="decided" name="Decisões"      fill="#fbbf24" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
