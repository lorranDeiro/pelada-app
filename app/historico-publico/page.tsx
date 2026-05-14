'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Match, Player } from '@/lib/types';
import { ArrowLeft, Calendar, Trophy, Users, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CommentForm } from '@/components/comment-form';
import { CommentsList } from '@/components/comments-list';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { HistoryFiltersComponent, type HistoryFilters } from '@/components/history-filters';
import { getPlayersForFilter } from '@/lib/matches';
import { DataExport } from '@/components/data-export';
import { MatchHistoryCarousel } from '@/components/match-history-carousel';
import { MatchStatsGrid } from '@/components/match-stats-grid';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

interface MatchWithDetails extends Match {
  mvp?: Player | null;
}

export default function PublicHistoryPage() {
  const router = useRouter();
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
      <div className="flex min-h-screen items-center justify-center bg-background text-text-primary">
        <div className="text-center">
          <Calendar className="mx-auto mb-4 h-12 w-12 animate-bounce text-accent" />
          <p className="text-text-secondary">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <header className="sticky top-0 z-10 border-b border-surface-border/40 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.back()}
            className="gap-1 text-text-secondary hover:text-accent-bright"
          >
            <ArrowLeft className="size-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <DataExport exportType="both" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Histórico de Partidas</h1>
          <p className="text-text-secondary">Explore resultados, estatísticas e comentários.</p>
        </header>

        {/* Carousel: Ultimas Partidas (Destaque) */}
        <MatchHistoryCarousel matches={matches.slice(0, 5)} />

        {/* Filters */}
        {matches.length > 0 && (
          <HistoryFiltersComponent 
            players={players}
            onFilterChange={handleFilterChange}
          />
        )}

        {/* Matches List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-text-secondary">
              Todos os Jogos
            </h2>
            <span className="text-xs text-text-muted">
              {filteredMatches.length} partidas encontradas
            </span>
          </div>

          {filteredMatches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-surface-border bg-surface/40 p-12 text-center">
              <p className="text-text-secondary">
                Nenhum resultado para os filtros aplicados.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMatches.map((match) => (
                <MatchHistoryItem
                  key={match.id}
                  match={match}
                  isExpanded={selectedMatch === match.id}
                  onToggle={() => setSelectedMatch(selectedMatch === match.id ? null : match.id)}
                  refreshComments={refreshComments}
                  onCommentAdded={() => setRefreshComments((prev) => prev + 1)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function MatchHistoryItem({
  match,
  isExpanded,
  onToggle,
  refreshComments,
  onCommentAdded,
}: {
  match: MatchWithDetails;
  isExpanded: boolean;
  onToggle: () => void;
  refreshComments: number;
  onCommentAdded: () => void;
}) {
  const isDraw = match.score_a === match.score_b;
  const dateStr = format(new Date(match.played_at), 'dd MMM yyyy', { locale: ptBR });

  return (
    <Card
      className={cn(
        'overflow-hidden border-surface-border bg-surface transition-all duration-300',
        isExpanded ? 'ring-2 ring-accent/20' : 'hover:border-accent/40'
      )}
    >
      {/* Header Item */}
      <div
        className="cursor-pointer p-4 sm:p-5"
        onClick={onToggle}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-secondary">
            <Calendar className="size-3.5" />
            {dateStr}
          </div>
          <Badge variant={isDraw ? 'outline' : 'secondary'} className={isDraw ? '' : 'bg-accent/10 text-accent border-accent/20'}>
            {isDraw ? 'Empate' : 'Finalizado'}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-center sm:text-right">
            <div className="text-sm font-black uppercase tracking-tighter text-text-secondary sm:text-base">
              {match.team_a_name}
            </div>
            <div className="text-3xl font-black text-text-primary sm:text-4xl">
              {match.score_a}
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-xl font-black text-text-muted">VS</span>
            {isExpanded ? <ChevronUp className="size-4 text-text-muted" /> : <ChevronDown className="size-4 text-text-muted" />}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="text-sm font-black uppercase tracking-tighter text-text-secondary sm:text-base">
              {match.team_b_name}
            </div>
            <div className="text-3xl font-black text-text-primary sm:text-4xl">
              {match.score_b}
            </div>
          </div>
        </div>

        {match.mvp && !isExpanded && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-full bg-yellow-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-yellow-500 border border-yellow-500/20">
            <Trophy className="size-3" />
            MVP: {match.mvp.name}
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-surface-border bg-background/40 p-4 sm:p-6 space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Notes */}
          {match.notes && (
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent">
                <MapPin className="size-3.5" />
                Local & Observações
              </h4>
              <div className="rounded-xl border border-surface-border bg-surface p-4 text-sm text-text-secondary leading-relaxed shadow-sm">
                {match.notes}
              </div>
            </div>
          )}

          {/* Detailed Stats */}
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent">
              <Trophy className="size-3.5" />
              Estatísticas da Partida
            </h4>
            <MatchStatsGrid
              matchId={match.id}
              teamAName={match.team_a_name}
              teamBName={match.team_b_name}
              scoreA={match.score_a}
              scoreB={match.score_b}
              mvpId={match.mvp_player_id}
            />
          </div>

          {/* Comments Section */}
          <div className="space-y-6 pt-4 border-t border-surface-border/60">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent">
              <Users className="size-3.5" />
              Comentários ({refreshComments >= 0 ? 'Resenha' : ''})
            </h4>

            <div className="space-y-6">
              <CommentsList
                matchId={match.id}
                refreshTrigger={refreshComments}
              />

              <div className="rounded-2xl border border-surface-border bg-surface p-4 sm:p-6 shadow-sm">
                <CommentForm
                  matchId={match.id}
                  onCommentAdded={onCommentAdded}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
