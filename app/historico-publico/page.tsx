'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Match, Player, SeasonStats } from '@/lib/types';
import { Calendar, Trophy, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CommentForm } from '@/components/comment-form';
import { CommentsList } from '@/components/comments-list';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MatchWithDetails extends Match {
  mvp?: Player | null;
  playerStats?: Record<string, any>[];
}

export default function PublicHistoryPage() {
  const [matches, setMatches] = useState<MatchWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [refreshComments, setRefreshComments] = useState(0);

  useEffect(() => {
    const loadMatches = async () => {
      setIsLoading(true);

      // Buscar temporada ativa
      const { data: seasonData } = await supabase
        .from('seasons')
        .select('*')
        .eq('active', true)
        .single();

      if (!seasonData) {
        setIsLoading(false);
        return;
      }

      // Buscar partidas finalizadas da temporada
      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .eq('season_id', seasonData.id)
        .eq('status', 'FINISHED')
        .order('played_at', { ascending: false });

      if (matchesData) {
        // Buscar MVP de cada partida
        const matchesWithMvp = await Promise.all(
          matchesData.map(async (match) => {
            if (match.mvp_player_id) {
              const { data: mvpData } = await supabase
                .from('players')
                .select('*')
                .eq('id', match.mvp_player_id)
                .single();
              return { ...match, mvp: mvpData };
            }
            return { ...match, mvp: null };
          })
        );

        setMatches(matchesWithMvp);
      }

      setIsLoading(false);
    };

    loadMatches();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Calendar className="h-12 w-12 text-green-500" />
          </div>
          <p className="text-gray-300">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-8 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Histórico de Partidas</h1>
          </div>
          <p className="text-blue-100">Veja os resultados e deixe seus comentários</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {matches.length === 0 ? (
          <Card className="p-8 text-center bg-gray-800 border-gray-700">
            <p className="text-gray-400">Nenhuma partida registrada ainda.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {matches.map((match) => {
              const isExpanded = selectedMatch === match.id;

              const winnerTeam =
                match.score_a > match.score_b
                  ? {name: match.team_a_name, score: match.score_a}
                  : {name: match.team_b_name, score: match.score_b};
              
              const loserTeam = 
                match.score_a < match.score_b
                  ? {name: match.team_a_name, score: match.score_a}
                  : {name: match.team_b_name, score: match.score_b};

              return (
                <Card
                  key={match.id}
                  className="bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600 overflow-hidden cursor-pointer hover:border-green-500 transition"
                  onClick={() =>
                    setSelectedMatch(isExpanded ? null : match.id)
                  }
                >
                  {/* Match Header - Click to expand */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-400">
                        {format(new Date(match.played_at), 'dd MMM yyyy', {
                          locale: ptBR,
                        })}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        match.score_a === match.score_b
                          ? 'bg-gray-600 text-gray-200'
                          : 'bg-green-600 text-white'
                      }`}>
                        {match.score_a === match.score_b ? 'Empate' : 'Finalizado'}
                      </div>
                    </div>

                    {/* Score Display */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 text-right space-y-1">
                        <div className="text-xl font-bold">{match.team_a_name}</div>
                        <div className="text-3xl font-bold text-green-400">
                          {match.score_a}
                        </div>
                      </div>

                      <div className="text-gray-500 font-bold">×</div>

                      <div className="flex-1 text-left space-y-1">
                        <div className="text-xl font-bold">{match.team_b_name}</div>
                        <div className="text-3xl font-bold text-blue-400">
                          {match.score_b}
                        </div>
                      </div>
                    </div>

                    {/* MVP Badge */}
                    {match.mvp && (
                      <div className="flex items-center gap-2 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded text-yellow-300 text-sm">
                        <Trophy className="h-4 w-4" />
                        <span>
                          <strong>MVP:</strong> {match.mvp.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-600 p-4 space-y-6 bg-gray-900/50">
                      {/* Notas do Admin */}
                      {match.notes && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm text-gray-300">
                            Anotações
                          </h4>
                          <p className="text-sm text-gray-300 bg-gray-800 p-3 rounded">
                            {match.notes}
                          </p>
                        </div>
                      )}

                      {/* Comments Section */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm text-gray-300 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Comentários
                        </h4>

                        <CommentsList
                          matchId={match.id}
                          refreshTrigger={refreshComments}
                        />

                        <CommentForm
                          matchId={match.id}
                          onCommentAdded={() =>
                            setRefreshComments((prev) => prev + 1)
                          }
                        />
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-400">
          <p>💬 Clique em uma partida para ver mais detalhes e deixar comentários.</p>
          <p className="mt-2">
            Os comentários são verificados antes de aparecer para manter a qualidade.
          </p>
        </div>
      </div>
    </div>
  );
}
