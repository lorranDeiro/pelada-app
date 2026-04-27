'use client';

import { useEffect, useState } from 'react';
import {
  Bar,
  ComposedChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { fetchPlayerProgress, type ProgressPoint } from '@/lib/player-charts';

interface Props {
  playerId: string;
  seasonId: string;
  limit?: number;
}

export function PlayerProgressChart({ playerId, seasonId, limit = 10 }: Props) {
  const [data, setData] = useState<ProgressPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setData(null);
    setError(null);
    fetchPlayerProgress(playerId, seasonId, limit)
      .then((rows) => {
        if (alive) setData(rows);
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : 'Erro ao carregar');
      });
    return () => {
      alive = false;
    };
  }, [playerId, seasonId, limit]);

  if (error) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-72 w-full animate-pulse rounded-md bg-muted/40" />
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-md border border-fs-border bg-fs-surface p-6 text-center text-sm text-fs-text-dim">
        Sem partidas registradas nessa temporada.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
          <CartesianGrid stroke="rgb(148 163 184 / 0.2)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="match" tick={{ fontSize: 11, fill: 'rgb(148 163 184)' }} />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: 'rgb(148 163 184)' }}
            domain={[0, 'auto']}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: 'rgb(148 163 184)' }}
            domain={[0, 5]}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid rgb(148 163 184 / 0.3)',
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar
            yAxisId="left"
            dataKey="points"
            name="Pontos"
            fill="#a78bfa"
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="right"
            dataKey="rating"
            name="Rating"
            stroke="#ec4899"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
