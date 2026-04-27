'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import type { RadarPoint } from '@/lib/player-charts';

export function PlayerRadarChart({ data }: { data: RadarPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="rgb(148 163 184 / 0.3)" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fontSize: 11, fill: 'rgb(148 163 184)' }}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid rgb(148 163 184 / 0.3)',
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Radar
            name="Liga (média)"
            dataKey="league"
            stroke="#94a3b8"
            fill="#94a3b8"
            fillOpacity={0.25}
          />
          <Radar
            name="Jogador"
            dataKey="player"
            stroke="#ec4899"
            fill="#ec4899"
            fillOpacity={0.45}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
