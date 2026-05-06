'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface MatchPerformance {
  matchNumber: number;
  points: number;
  rating: number;
  cumulative: number;
}

interface Props {
  playerId: string;
  matchPerformances: MatchPerformance[];
}

/**
 * Gráfico de Área mostrando evolução do jogador ao longo da temporada
 * Mostra: Pontos por partida (barras) e Rating acumulado (linha)
 */
export function SeasonEvaluationChart({
  playerId,
  matchPerformances,
}: Props) {
  const chartData = useMemo(() => {
    let cumulativePoints = 0;

    return matchPerformances.map((m) => {
      cumulativePoints += m.points;
      return {
        matchNum: `PJ${m.matchNumber}`,
        points: m.points,
        rating: m.rating,
        cumulative: cumulativePoints,
      };
    });
  }, [matchPerformances]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Sem dados de desempenho para este jogador
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 20 }}>
          <defs>
            <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis
            dataKey="matchNum"
            stroke="#6b7280"
            style={{ fontSize: '11px' }}
            tick={{ dy: 5 }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '10px' }}
            yAxisId="left"
          />
          <YAxis
            orientation="right"
            stroke="#6b7280"
            style={{ fontSize: '10px' }}
            yAxisId="right"
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '6px',
            }}
            labelStyle={{ color: '#f3f4f6' }}
            formatter={(value: number, name: string) => {
              if (name === 'points') return [value.toFixed(1), 'Pontos'];
              if (name === 'cumulative')
                return [value.toFixed(0), 'Total Acumulado'];
              return value;
            }}
          />

          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            iconType="line"
          />

          <Area
            yAxisId="left"
            type="monotone"
            dataKey="points"
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#colorPoints)"
            name="Pontos por Partida"
            isAnimationActive={false}
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="cumulative"
            stroke="#f59e0b"
            fillOpacity={1}
            fill="url(#colorCumulative)"
            name="Pontos Acumulados"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="p-2 rounded bg-green-900/20 border border-green-900/40">
          <p className="text-green-400 font-semibold">Melhor Partida</p>
          <p className="text-green-300">
            {Math.max(...chartData.map((c) => c.points)).toFixed(1)} pts
          </p>
        </div>
        <div className="p-2 rounded bg-amber-900/20 border border-amber-900/40">
          <p className="text-amber-400 font-semibold">Média</p>
          <p className="text-amber-300">
            {(
              chartData.reduce((sum, c) => sum + c.points, 0) / chartData.length
            ).toFixed(1)}{' '}
            pts/PJ
          </p>
        </div>
        <div className="p-2 rounded bg-blue-900/20 border border-blue-900/40">
          <p className="text-blue-400 font-semibold">Total</p>
          <p className="text-blue-300">
            {chartData[chartData.length - 1].cumulative.toFixed(0)} pts
          </p>
        </div>
      </div>
    </div>
  );
}
