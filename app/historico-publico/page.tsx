'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Match, Player } from '@/lib/types';
import { Calendar, Trophy, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CommentForm } from '@/components/comment-form';
import { CommentsList } from '@/components/comments-list';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { HistoryFiltersComponent, type HistoryFilters } from '@/components/history-filters';
import { getPlayersForFilter } from '@/lib/matches';
import { DataExport } from '@/components/data-export';
import { MatchStatsTable } from '@/components/match-stats-table';

interface MatchWithDetails extends Match {
  mvp?: Player | null;
  playerStats?: Record<string, any>[];
}

export default function PublicHistoryPage() {
  const [matches, setMatches] = useState<MatchWithDetails[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<MatchWithDetails[]>([]);
  const [teamByMatch, setTeamByMatch] = useState<Map<string, Map<string, 1 | 2>>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [refreshComments, setRefreshComments] = useState(0);
  const [players, setPlayers] = useState<Array<{ id: string; name: string }>>([]);
  const [filters, setFilters] = useState<HistoryFilters>({
    playerId: null,
    team: 'all',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      const playersData = await getPlayersForFilter();
      setPlayers(playersData);

      const { data: seasonData } = await supabase
        .from('seasons')
        .select('*')
        .eq('active', true)
        .single();

      if (!seasonData) {
        setIsLoading(false);
        return;
      }

      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .eq('season_id', seasonData.id)
        .eq('status', 'FINISHED')
        .order('played_at', { ascending: false });

      if (!matchesData || matchesData.length === 0) {
        setIsLoading(false);
        return;
      }

      const matchIds = matchesData.map((m) => m.id);
      const mvpIds = matchesData.map((m) => m.mvp_player_id).filter(Boolean) as string[];

      const [mvpRes, attendanceRes] = await Promise.all([
        mvpIds.length
          ? supabase.from('players').select('*').in('id', mvpIds)
          : Promise.resolve({ data: [] as Player[] }),
        supabase
          .from('match_attendances')
          .select('match_id, player_id, team')
          .in('match_id', matchIds),
      ]);

      const mvpById = new Map((mvpRes.data ?? []).map((p) => [p.id, p as Player]));
      const matchesWithMvp: MatchWithDetails[] = matchesData.map((m) => ({
        ...m,
        mvp: m.mvp_player_id ? mvpById.get(m.mvp_player_id) ?? null : null,
      }));

      const rosterByMatch = new Map<string, Map<string, 1 | 2>>();
      (attendanceRes.data ?? []).forEach((a) => {
        if (!rosterByMatch.has(a.match_id)) {
          rosterByMatch.set(a.match_id, new Map());
        }
        rosterByMatch.get(a.match_id)!.set(a.player_id, a.team as 1 | 2);
      });

      setMatches(matchesWithMvp);
      setFilteredMatches(matchesWithMvp);
      setTeamByMatch(rosterByMatch);
      setIsLoading(false);
    };

    loadData();
  }, []);

  const handleFilterChange = (newFilters: HistoryFilters) => {
    setFilters(newFilters);

    let filtered = matches;

    if (newFilters.startDate) {
      const startDate = new Date(`${newFilters.startDate}T00:00:00`);
      filtered = filtered.filter((m) => new Date(m.played_at) >= startDate);
    }

    if (newFilters.endDate) {
      const endDate = new Date(`${newFilters.endDate}T23:59:59`);
      filtered = filtered.filter((m) => new Date(m.played_at) <= endDate);
    }

    if (newFilters.playerId) {
      const pid = newFilters.playerId;
      filtered = filtered.filter((m) => teamByMatch.get(m.id)?.has(pid));

      if (newFilters.team !== 'all') {
        const targetTeam: 1 | 2 = newFilters.team === 'escuros' ? 1 : 2;
        filtered = filtered.filter(
          (m) => teamByMatch.get(m.id)?.get(pid) === targetTeam
        );
      }
    }

    setFilteredMatches(filtered);
  };

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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8" />
              <h1 className="text-3xl font-bold">Histórico de Partidas</h1>
            </div>
            <DataExport exportType="both" />
          </div>
          <p className="text-blue-100">Veja os resultados, deixe comentários e exporte dados</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Filters */}
        {matches.length > 0 && (
          <HistoryFiltersComponent 
            players={players}
            onFilterChange={handleFilterChange}
          />
        )}

        {/* Matches */}
        {filteredMatches.length === 0 ? (
          <Card className="p-8 text-center bg-gray-800 border-gray-700">
            <p className="text-gray-400">
              {matches.length === 0
                ? 'Nenhuma partida registrada ainda.'
                : 'Nenhuma partida encontrada com os filtros aplicados.'}
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            <p className="text-sm text-gray-400">
              Mostrando <strong>{filteredMatches.length}</strong> de{' '}
              <strong>{matches.length}</strong> partida
              {matches.length !== 1 ? 's' : ''}
            </p>

            {filteredMatches.map((match) => {
              const isExpanded = selectedMatch === match.id;

              const winnerTeam =
                match.score_a > match.score_b
                  ? { name: match.team_a_name, score: match.score_a }
                  : { name: match.team_b_name, score: match.score_b };

              const loserTeam =
                match.score_a < match.score_b
                  ? { name: match.team_a_name, score: match.score_a }
                  : { name: match.team_b_name, score: match.score_b };

              return (
                <Card
                  key={match.id}
                  className="bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600 overflow-hidden cursor-pointer hover:border-green-500 transition"
                  onClick={() => setSelectedMatch(isExpanded ? null : match.id)}
                >
                  {/* Match Header - Click to expand */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-400">
                        {format(new Date(match.played_at), 'dd MMM yyyy', {
                          locale: ptBR,
                        })}
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          match.score_a === match.score_b
                            ? 'bg-gray-600 text-gray-200'
                            : 'bg-green-600 text-white'
                        }`}
                      >
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

                      {/* Stats por jogador (estilo FIFA) */}
                      <div className="space-y-2">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                          <Trophy className="h-4 w-4" />
                          Estatísticas dos jogadores
                        </h4>
                        <MatchStatsTable
                          matchId={match.id}
                          teamAName={match.team_a_name}
                          teamBName={match.team_b_name}
                        />
                      </div>

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
        <div className="mt-8 p-4 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-400 space-y-2">
          <p>💬 Clique em uma partida para ver mais detalhes e deixar comentários.</p>
          <p>Os comentários são verificados antes de aparecer para manter a qualidade.</p>
          <p>📊 Use os filtros acima para buscar partidas específicas ou exporte todos os dados.</p>
        </div>
      </div>
    </div>
  );
}
