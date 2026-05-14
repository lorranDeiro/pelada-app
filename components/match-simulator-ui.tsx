'use client';

import { 
  BarChart3, 
  Bolt, 
  RotateCcw, 
  Shield, 
  Target, 
  Swords, 
  TrendingUp, 
  Zap,
  ChevronRight,
  Timer
} from 'lucide-react';
import { PlayerAvatar } from '@/components/player-avatar';
import { cn } from '@/lib/utils';
import type { MatchSimulation } from '@/lib/match-simulation';

interface Props {
  simulation: MatchSimulation;
  teamAName: string;
  teamBName: string;
  onResimulate?: () => void;
}

export function MatchSimulatorUI({ 
  simulation, 
  teamAName, 
  teamBName,
  onResimulate 
}: Props) {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Hero Simulation Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-text-primary uppercase italic tracking-tight">Simulador de Partida</h2>
            <span className="bg-accent text-black px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-widest shadow-glow">Pro Beta</span>
          </div>
          <p className="text-text-secondary text-sm">Análise algorítmica avançada baseada na força atual do elenco.</p>
        </div>
        {onResimulate && (
          <button 
            onClick={onResimulate}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-muted hover:text-accent transition-colors group"
          >
            <RotateCcw className="size-4 group-active:rotate-180 transition-transform duration-500" />
            Recalcular Dados
          </button>
        )}
      </section>

      {/* Score & Probability Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Team Comparison Card */}
        <section className="lg:col-span-8 bg-surface rounded-2xl shadow-xl overflow-hidden border-l-4 border-accent p-6 relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="size-32" />
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            {/* Team Alpha */}
            <div className="text-center space-y-3 flex-1">
              <div className="size-20 mx-auto bg-accent/10 rounded-full flex items-center justify-center border-2 border-accent/30 shadow-glow">
                <span className="text-2xl font-black text-accent italic">A</span>
              </div>
              <h3 className="font-bold text-text-primary uppercase tracking-tight">{teamAName}</h3>
              <div className="text-5xl font-black text-accent italic">{simulation.winProbA}<span className="text-xl">%</span></div>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Prob. Vitória</p>
            </div>

            {/* Score Projection */}
            <div className="flex flex-col items-center flex-1 py-4 px-6 bg-background/40 rounded-3xl border border-surface-border/40">
              <div className="text-[10px] font-black text-accent bg-accent/10 px-4 py-1 rounded-full mb-4 uppercase tracking-tighter">Placar Projetado</div>
              <div className="flex items-center gap-6">
                <span className="text-6xl font-black text-text-primary italic">{simulation.scoreA}</span>
                <span className="text-4xl font-black text-text-muted italic opacity-30">-</span>
                <span className="text-6xl font-black text-text-secondary italic">{simulation.scoreB}</span>
              </div>
              <div className="mt-6 px-4 py-2 bg-surface flex items-center gap-2 rounded-xl border border-surface-border shadow-sm">
                <Bolt className="size-4 text-accent animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-text-primary">Alta Intensidade Esperada</span>
              </div>
            </div>

            {/* Team Bravo */}
            <div className="text-center space-y-3 flex-1">
              <div className="size-20 mx-auto bg-accent-secondary/10 rounded-full flex items-center justify-center border-2 border-accent-secondary/30">
                <span className="text-2xl font-black text-accent-secondary italic">B</span>
              </div>
              <h3 className="font-bold text-text-secondary uppercase tracking-tight">{teamBName}</h3>
              <div className="text-5xl font-black text-text-secondary italic">{simulation.winProbB}<span className="text-xl">%</span></div>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Prob. Vitória</p>
            </div>
          </div>
        </section>

        {/* Tactical Edge Progress Bars */}
        <section className="lg:col-span-4 bg-background border border-surface-border rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-5 text-accent" />
            <h4 className="text-sm font-black uppercase tracking-tight italic text-text-primary">Equilíbrio Tático</h4>
          </div>
          
          <div className="space-y-5">
            <SectorBar 
              label="Ataque" 
              valA={simulation.sectorsA.attack} 
              valB={simulation.sectorsB.attack} 
              color="bg-accent" 
            />
            <SectorBar 
              label="Defesa" 
              valA={simulation.sectorsA.defense} 
              valB={simulation.sectorsB.defense} 
              color="bg-accent-secondary" 
            />
            <SectorBar 
              label="Fôlego" 
              valA={simulation.sectorsA.stamina} 
              valB={simulation.sectorsB.stamina} 
              color="bg-amber-500" 
            />
          </div>

          <div className="pt-4 border-t border-surface-border">
            <p className="text-xs text-text-secondary leading-relaxed italic">
              "A simulação sugere que a eficiência ofensiva de <strong>{teamAName}</strong> pode ser o diferencial nos minutos finais."
            </p>
          </div>
        </section>
      </div>

      {/* Key Battle Spotlight */}
      <section className="bg-surface rounded-2xl p-6 shadow-sm border border-surface-border group overflow-hidden relative">
        <div className="absolute -left-12 -bottom-12 size-48 bg-accent/5 rounded-full blur-3xl" />
        
        <div className="flex items-center gap-2 mb-8">
          <Swords className="size-5 text-accent" />
          <h4 className="text-sm font-black uppercase italic tracking-tight text-text-primary">Confronto em Destaque</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
          {/* Vertical Divider */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-surface-border/60"></div>
          
          {/* Alpha Star */}
          <div className="flex items-center gap-4 group/p1">
            <div className="relative">
              <div className="size-20 rounded-2xl overflow-hidden border-2 border-accent/20 group-hover/p1:border-accent transition-colors">
                <PlayerAvatar name={simulation.keyBattle.playerA.name} photoUrl={simulation.keyBattle.playerA.photo_url} size={80} />
              </div>
              <div className="absolute -bottom-2 -right-2 size-8 bg-accent text-black rounded-full flex items-center justify-center font-black text-xs border-2 border-surface shadow-lg">
                {(simulation.keyBattle.playerA as any).skill_level || 5}
              </div>
            </div>
            <div>
              <h5 className="font-black text-text-primary uppercase tracking-tight">{simulation.keyBattle.playerA.name}</h5>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{simulation.keyBattle.labelA}</p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-0.5 bg-accent/10 text-accent text-[9px] font-black rounded uppercase">XG: 0.85</span>
                <span className="px-2 py-0.5 bg-surface-hover text-text-secondary text-[9px] font-black rounded uppercase">Rating: {simulation.keyBattle.playerA.avg_rating?.toFixed(1) || '—'}</span>
              </div>
            </div>
          </div>

          {/* Bravo Star */}
          <div className="flex flex-row-reverse md:flex-row items-center gap-4 justify-end md:justify-start group/p2">
            <div className="text-right md:text-left">
              <h5 className="font-black text-text-secondary uppercase tracking-tight">{simulation.keyBattle.playerB.name}</h5>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{simulation.keyBattle.labelB}</p>
              <div className="flex gap-2 mt-2 justify-end md:justify-start">
                <span className="px-2 py-0.5 bg-accent-secondary/10 text-accent-secondary text-[9px] font-black rounded uppercase">XP: +12</span>
                <span className="px-2 py-0.5 bg-surface-hover text-text-secondary text-[9px] font-black rounded uppercase">Rating: {simulation.keyBattle.playerB.avg_rating?.toFixed(1) || '—'}</span>
              </div>
            </div>
            <div className="relative">
              <div className="size-20 rounded-2xl overflow-hidden border-2 border-accent-secondary/20 group-hover/p2:border-accent-secondary transition-colors">
                <PlayerAvatar name={simulation.keyBattle.playerB.name} photoUrl={simulation.keyBattle.playerB.photo_url} size={80} />
              </div>
              <div className="absolute -bottom-2 -left-2 size-8 bg-accent-secondary text-white rounded-full flex items-center justify-center font-black text-xs border-2 border-surface shadow-lg">
                {(simulation.keyBattle.playerB as any).skill_level || 5}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simulation Timeline */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="size-5 text-accent" />
            <h4 className="text-sm font-black uppercase italic tracking-tight text-text-primary">Linha do Tempo (Simulada)</h4>
          </div>
          <span className="text-[10px] font-black text-accent bg-accent/10 px-3 py-1 rounded-full uppercase">Fluxo em Tempo Real</span>
        </div>

        <div className="relative space-y-4 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-surface-border">
          {simulation.timeline.map((moment, idx) => (
            <div key={idx} className="relative pl-12 flex items-center gap-4 group">
              <div className={cn(
                "absolute left-0 top-1 size-10 rounded-full flex items-center justify-center border-4 border-background z-10 font-black text-xs transition-transform group-hover:scale-110",
                moment.type === 'GOAL' ? "bg-accent text-black" : "bg-surface-hover text-text-secondary"
              )}>
                {moment.minute}'
              </div>
              <div className="flex-1 bg-surface p-4 rounded-2xl border border-surface-border flex items-center gap-4 shadow-sm group-hover:border-accent/40 transition-colors">
                <div className={cn(
                  "p-2 rounded-xl",
                  moment.type === 'GOAL' ? "bg-accent/10 text-accent" : "bg-text-muted/10 text-text-muted"
                )}>
                  {moment.type === 'GOAL' ? <Target className="size-4" /> : moment.type === 'SAVE' ? <Shield className="size-4" /> : <Bolt className="size-4" />}
                </div>
                <div>
                  <p className="font-bold text-sm text-text-primary">
                    {moment.type === 'GOAL' ? `Golo: ${moment.player_name}` : moment.type === 'SAVE' ? `Defesa Crítica: ${moment.player_name}` : moment.description}
                  </p>
                  {moment.type !== 'TACTICAL' && (
                    <p className="text-[10px] text-text-muted font-medium mt-0.5">{moment.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectorBar({ label, valA, valB, color }: { label: string, valA: number, valB: number, color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{label}</span>
        <span className="text-[10px] font-black text-text-primary">{valA}% vs {valB}%</span>
      </div>
      <div className="h-2 w-full bg-surface-border rounded-full overflow-hidden flex gap-1 p-0.5">
        <div className={cn("h-full rounded-full transition-all duration-1000 delay-300", color)} style={{ width: `${valA}%` }} />
        <div className={cn("h-full rounded-full transition-all duration-1000 delay-500 opacity-30", color)} style={{ width: `${valB}%` }} />
      </div>
    </div>
  );
}
