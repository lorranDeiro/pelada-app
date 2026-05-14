'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Users, 
  Dices, 
  Play, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { balanceTeams, type BalancedTeams } from '@/lib/team-balancer';
import { simulateMatch, type MatchSimulation } from '@/lib/match-simulation';
import { MatchSimulatorUI } from '@/components/match-simulator-ui';
import { PlayerAvatar } from '@/components/player-avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import type { Player, SeasonStats, RankedPlayer } from '@/lib/types';

export default function PublicSimulatorPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<RankedPlayer[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<BalancedTeams | null>(null);
  const [simulation, setSimulation] = useState<MatchSimulation | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      // Get active season
      const { data: season } = await supabase.from('seasons').select('id').eq('active', true).maybeSingle();
      
      // Get all active players
      const { data: playersData } = await supabase.from('players').select('*').eq('active', true).order('name');
      
      // Get stats for enrichment
      const { data: stats } = season 
        ? await supabase.from('v_player_season_stats_full').select('*').eq('season_id', season.id)
        : { data: [] };

      const enriched: RankedPlayer[] = (playersData || []).map(p => {
        const s = stats?.find(st => st.player_id === p.id);
        return {
          ...p,
          season_points: s?.total_points || 0,
          matches_played_season: s?.matches_played || 0,
          avg_rating: s?.avg_rating || p.skill_level || 3
        } as RankedPlayer;
      });

      setPlayers(enriched);
      setLoading(false);
    }
    load();
  }, []);

  const togglePlayer = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDrawAndSimulate = () => {
    const selectedPlayers = players.filter(p => selectedIds.has(p.id));
    if (selectedPlayers.length < 4) return;

    const drawn = balanceTeams(selectedPlayers);
    setTeams(drawn);
    
    const sim = simulateMatch(drawn.teamA, drawn.teamB);
    setSimulation(sim);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Dices className="size-12 text-accent animate-bounce mx-auto" />
          <p className="text-text-secondary font-bold uppercase tracking-widest animate-pulse">Iniciando Simulador...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary pb-24">
      <header className="sticky top-0 z-10 border-b border-surface-border/40 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => simulation ? setSimulation(null) : router.back()}
            className="gap-1 text-text-secondary hover:text-accent-bright"
          >
            <ArrowLeft className="size-4" />
            {simulation ? 'Nova Seleção' : 'Voltar'}
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="font-black text-xs uppercase tracking-widest text-accent/60 italic">Squad Select Simulator</h1>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {!simulation ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="text-center space-y-2">
              <span className="inline-block bg-accent/10 text-accent px-4 py-1 rounded-full font-bold text-[10px] uppercase tracking-widest mb-2 border border-accent/20">
                Setup Simulation
              </span>
              <h2 className="text-3xl font-black text-text-primary uppercase italic tracking-tight">Quem vai pro jogo?</h2>
              <p className="text-text-secondary text-sm max-w-md mx-auto">Selecione os jogadores para gerar os times equilibrados e simular o resultado.</p>
            </header>

            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              <Badge variant="outline" className="rounded-full px-4 py-1 bg-surface border-surface-border text-text-secondary font-bold">
                {selectedIds.size} Jogadores Selecionados
              </Badge>
              {selectedIds.size < 4 && (
                <span className="text-[10px] font-bold text-amber-500 uppercase flex items-center gap-1">
                  <AlertCircle className="size-3" /> Mínimo 4 para simular
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {players.map((p) => {
                const isSelected = selectedIds.has(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlayer(p.id)}
                    className={cn(
                      "relative group p-3 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-3",
                      isSelected 
                        ? "bg-accent/5 border-accent shadow-premium" 
                        : "bg-surface border-surface-border hover:border-text-muted/30"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 z-10 bg-accent text-black rounded-full p-0.5 shadow-lg">
                        <CheckCircle2 className="size-3.5" />
                      </div>
                    )}
                    <div className={cn(
                      "size-14 rounded-full overflow-hidden border-2 transition-transform duration-300",
                      isSelected ? "border-accent scale-110" : "border-surface-border group-hover:scale-105"
                    )}>
                      <PlayerAvatar name={p.name} photoUrl={p.photo_url} size={56} />
                    </div>
                    <div className="text-center min-w-0 w-full">
                      <p className={cn(
                        "text-xs font-bold truncate",
                        isSelected ? "text-text-primary" : "text-text-secondary"
                      )}>{p.name}</p>
                      <p className="text-[9px] font-bold text-text-muted uppercase tracking-tighter">
                        {p.position === 'GOLEIRO_FIXO' ? '🧤 Goleiro' : '⭐ ' + (p.avg_rating?.toFixed(1) || p.skill_level)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedIds.size >= 4 && (
              <div className="fixed bottom-6 inset-x-0 px-4 flex justify-center z-50">
                <Button 
                  onClick={handleDrawAndSimulate}
                  className="bg-accent hover:bg-accent-bright text-black font-black text-lg py-7 px-12 rounded-2xl shadow-glow active:scale-95 transition-all w-full max-w-md gap-3"
                >
                  <Dices className="size-6" />
                  SORTEAR E SIMULAR
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-4 duration-700">
            <MatchSimulatorUI 
              simulation={simulation}
              teamAName="Equipa Escurecidos"
              teamBName="Equipa Coloridos"
              onResimulate={handleDrawAndSimulate}
            />
            
            <div className="mt-12 flex flex-col items-center gap-4">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Gostou da simulação?</p>
              <Button 
                variant="outline"
                onClick={() => setSimulation(null)}
                className="rounded-xl border-accent text-accent hover:bg-accent/10"
              >
                Tentar outra combinação
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
