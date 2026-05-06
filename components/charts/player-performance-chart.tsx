'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { SeasonStats } from '@/lib/types';

interface Props {
  stats: SeasonStats;
  allStats: SeasonStats[];
}

/**
 * Gráfico de desempenho com barras coloridas por percentil
 * Mostra: Gols, Assistências, Defesas, Vitórias (métricas principais)
 * Cores baseadas em percentil (verde acima da média, vermelho abaixo)
 */
export function PlayerPerformanceChart({ stats, allStats }: Props) {
  const chartData = useMemo(() => {
    // Calcular percentis de cada métrica
    const metrics = ['goals', 'assists', 'saves', 'wins'] as const;
    const percentiles: Record<(typeof metrics)[number], number> = {
      goals: 0,
      assists: 0,
      saves: 0,
      wins: 0,
    };

    metrics.forEach((metric) => {
      const values = allStats.map((s) => s[metric]).filter((v) => v > 0);
      if (values.length === 0) return;

      const playerValue = stats[metric];
      const sortedValues = values.sort((a, b) => a - b);
      const percentile =
        (sortedValues.filter((v) => v <= playerValue).length / values.length) * 100;

      percentiles[metric] = percentile;
    });

    return [
      {
        name: 'Gols',
        valor: stats.goals,
        percentil: percentiles.goals,
      },
      {
        name: 'Assistências',
        valor: stats.assists,
        percentil: percentiles.assists,
      },
      {
        name: 'Defesas',
        valor: stats.saves,
        percentil: percentiles.saves,
      },
      {
        name: 'Vitórias',
        valor: stats.wins,
        percentil: percentiles.wins,
      },
    ];
  }, [stats, allStats]);

  const getColor = (percentil: number): string => {
    if (percentil >= 75) return '#10b981'; // Emerald - Excelente
    if (percentil >= 50) return '#3b82f6'; // Blue - Bom
    if (percentil >= 25) return '#f59e0b'; // Amber - Normal
    return '#ef4444'; // Red - Abaixo da média
  };

  const getGradientId = (index: number) => `gradient-${index}`;

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
          <defs>
            {chartData.map((_, i) => (
              <linearGradient key={i} id={getGradientId(i)} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={getColor(chartData[i].percentil)}
                  stopOpacity={0.8}
                />
                <stop
                  offset="100%"
                  stopColor={getColor(chartData[i].percentil)}
                  stopOpacity={0.4}
                />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="name"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '6px',
            }}
            labelStyle={{ color: '#f3f4f6' }}
            formatter={(value, name) => {
              const n = typeof value === 'number' ? value : Number(value);
              if (name === 'valor') return [n, 'Estatística'];
              if (name === 'percentil') return [`${n.toFixed(0)}º percentil`, 'Ranking'];
              return [n, name];
            }}
          />

          <Bar dataKey="valor" fill="#3b82f6" name="Estatística" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`url(#${getGradientId(index)})`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {chartData.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between p-2 rounded bg-gray-800"
          >
            <span className="text-gray-300">{item.name}</span>
            <div className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getColor(item.percentil) }}
              />
              <span className="font-semibold text-gray-100">
                {item.percentil.toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
