'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { SeasonStats } from '@/lib/types';
import { Trophy, Zap, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui-patterns';
import { DataExport } from '@/components/data-export';

export default function PublicRankingPage() {
  const [stats, setStats] = useState<SeasonStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [seasonName, setSeasonName] = useState('');

  useEffect(() => {
    const loadRanking = async () => {
      setIsLoading(true);

      // Buscar temporada ativa
      const { data: seasonData } = await supabase
        .from('seasons')
        .select('*')
        .eq('active', true)
        .single();

      if (seasonData) {
        setSeasonName(seasonData.name);
      }

      // Buscar ranking da temporada ativa
      const { data: rankingData } = await supabase
        .from('v_player_season_stats')
        .select('*')
        .eq('season_id', seasonData?.id)
        .order('total_points', { ascending: false });

      setStats(rankingData || []);
      setIsLoading(false);
    };

    loadRanking();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Trophy className="h-12 w-12 text-green-500" />
          </div>
          <p className="text-gray-300">Carregando ranking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 py-8 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8" />
              <h1 className="text-3xl font-bold">Ranking de Jogadores</h1>
            </div>
            <DataExport exportType="ranking" />
          </div>
          <p className="text-green-100">Temporada {seasonName || 'Atual'}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {stats.length === 0 ? (
          <Card className="p-8 text-center bg-gray-800 border-gray-700">
            <p className="text-gray-400">Ainda não há dados de ranking. Volte mais tarde!</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {stats.map((player, index) => (
              <div
                key={player.player_id}
                className="group relative bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-lg p-4 hover:shadow-lg hover:border-green-500 transition"
              >
                {/* Posição */}
                <div className="absolute -left-3 -top-3">
                  <div className="bg-green-600 text-white rounded-full h-10 w-10 flex items-center justify-center font-bold text-lg shadow-lg">
                    {index + 1}
                  </div>
                </div>

                <div className="ml-8 space-y-2">
                  {/* Nome + MVP */}
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">{player.name}</h3>
                    {player.mvp_count > 0 && (
                      <Badge className="bg-yellow-500 text-black text-xs">
                        🌟 {player.mvp_count}x MVP
                      </Badge>
                    )}
                  </div>

                  {/* Stats em grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                    {/* Pontos */}
                    <div className="bg-gray-900/50 rounded p-2">
                      <div className="text-xs text-gray-400">Pontos</div>
                      <div className="text-xl font-bold text-green-400">
                        {player.total_points.toFixed(1)}
                      </div>
                    </div>

                    {/* Nível Dinâmico */}
                    <div className="bg-gray-900/50 rounded p-2">
                      <div className="text-xs text-gray-400">Nível</div>
                      <div className="flex items-center">
                        <StarRating
                          value={player.dynamic_rating}
                          size="sm"
                          showValue={true}
                        />
                      </div>
                    </div>

                    {/* Partidas */}
                    <div className="bg-gray-900/50 rounded p-2">
                      <div className="text-xs text-gray-400">Partidas</div>
                      <div className="text-xl font-bold">{player.matches_played}</div>
                    </div>

                    {/* Nota Média */}
                    <div className="bg-gray-900/50 rounded p-2">
                      <div className="text-xs text-gray-400">Nota Média</div>
                      <div className="text-xl font-bold text-blue-400">
                        {player.avg_rating.toFixed(1)}
                      </div>
                    </div>

                    {/* Aproveitamento */}
                    <div className="bg-gray-900/50 rounded p-2">
                      <div className="text-xs text-gray-400">Wins</div>
                      <div className="text-xl font-bold text-emerald-400">{player.wins}W</div>
                    </div>
                  </div>

                  {/* Detalhes */}
                  <div className="flex flex-wrap gap-3 text-sm pt-2 border-t border-gray-600">
                    <div className="flex items-center gap-1 text-gray-300">
                      <Target className="h-4 w-4 text-red-500" />
                      {player.goals} gols
                    </div>
                    <div className="flex items-center gap-1 text-gray-300">
                      <Zap className="h-4 w-4 text-blue-400" />
                      {player.assists} assistências
                    </div>
                    {player.position === 'GOLEIRO_FIXO' && (
                      <div className="flex items-center gap-1 text-gray-300">
                        <Trophy className="h-4 w-4 text-yellow-400" />
                        {player.saves} defesas
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-400">
          <p>💡 Este é o ranking público da temporada atual.</p>
          <p className="mt-2">Atualizado em tempo real com base nas partidas finalizadas.</p>
        </div>
      </div>
    </div>
  );
}
