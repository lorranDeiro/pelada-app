'use client';

import { useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { SeasonStats } from '@/lib/types';

interface Props {
  stats: SeasonStats;
  allStats: SeasonStats[];
}

/**
 * Gráfico Radar com Percentis realísticos
 * Mostra a posição do jogador em cada métrica comparado com a liga
 * Inspirado em: FBref, Football Manager, Sofascore
 */
export function PercentileRadarChart({ stats, allStats }: Props) {
  const radarData = useMemo(() => {
    // 6 dimensões principais de desempenho
    const dimensions = [
      { key: 'goals', label: 'Gols', weight: 1 },
      { key: 'assists', label: 'Assistências', weight: 1 },
      { key: 'saves', label: 'Defesas', weight: stats.position === 'GOLEIRO_FIXO' ? 2 : 0.5 },
      { key: 'avg_rating', label: 'Rating Médio', weight: 1.5 },
      { key: 'wins', label: 'Vitórias', weight: 1 },
      { key: 'mvp_count', label: 'MVPs', weight: 0.8 },
    ] as const;

    return dimensions
      .filter((d) => d.weight > 0) // Filtra por posição (goleiros não têm gols/assists altos)
      .map((dim) => {
        const values = allStats.map((s) => s[dim.key as keyof SeasonStats] as number);
        if (values.length === 0) return { name: dim.label, jogador: 0, media: 0 };

        const sortedValues = values.sort((a, b) => a - b);
        const playerValue = stats[dim.key as keyof SeasonStats] as number;
        const percentile = (sortedValues.filter((v) => v <= playerValue).length / values.length) * 100;
        const mediaLiga = values.reduce((a, b) => a + b, 0) / values.length;

        return {
          name: dim.label,
          jogador: Math.min(100, percentile), // Normalizado para 0-100
          media: Math.min(100, (mediaLiga / Math.max(...values)) * 100), // Normalizado
        };
      });
  }, [stats, allStats]);

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={radarData} margin={{ top: 30, right: 30, left: 30, bottom: 30 }}>
          <defs>
            <linearGradient id="radarGradientPlayer" x1="0" y1="0" x2="100%" y2="0">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.8} />
            </linearGradient>
          </defs>

          <PolarGrid stroke="#374151" strokeDasharray="3 3" />
          <PolarAngleAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            stroke="#6b7280"
            style={{ fontSize: '10px' }}
          />

          <Radar
            name="Sua Performance"
            dataKey="jogador"
            stroke="#3b82f6"
            fill="url(#radarGradientPlayer)"
            fillOpacity={0.6}
          />
          <Radar
            name="Média da Liga"
            dataKey="media"
            stroke="#6b7280"
            fill="none"
            strokeDasharray="5 5"
            strokeWidth={2}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#f3f4f6' }}
            formatter={(value) => {
              const n = typeof value === 'number' ? value : Number(value);
              return [`${n.toFixed(1)}º percentil`, ''];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            iconType="circle"
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Legend e interpretação */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded bg-blue-900/20 border border-blue-900/40">
          <p className="text-blue-300 font-semibold">Seu Performance</p>
          <p className="text-blue-200">Percentil em cada métrica</p>
        </div>
        <div className="p-2 rounded bg-gray-700/20 border border-gray-700/40">
          <p className="text-gray-300 font-semibold">Média da Liga</p>
          <p className="text-gray-400">Comparativo de referência</p>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="p-3 bg-gray-800 rounded-lg space-y-2">
        <p className="text-xs font-semibold text-gray-300">📊 Resumo de Performance</p>
        <div className="space-y-1">
          {radarData.map((metric) => {
            const diferenca = metric.jogador - metric.media;
            const status =
              diferenca > 10
                ? '🟢 Acima da Média'
                : diferenca > 0
                  ? '🟡 Na Média'
                  : '🔴 Abaixo da Média';

            return (
              <div key={metric.name} className="flex justify-between text-xs">
                <span className="text-gray-400">{metric.name}:</span>
                <span className="text-gray-200">
                  {metric.jogador.toFixed(0)}% {status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
