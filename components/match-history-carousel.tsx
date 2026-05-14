'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Match } from '@/lib/types';

interface Props {
  matches: Match[];
}

export function MatchHistoryCarousel({ matches }: Props) {
  if (matches.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent">
        Últimas Partidas
      </h2>
      <div className="hide-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-4">
        {matches.map((m, idx) => (
          <CarouselCard key={m.id} match={m} active={idx === 0} />
        ))}
      </div>
    </section>
  );
}

function CarouselCard({ match, active }: { match: Match; active?: boolean }) {
  const date = format(new Date(match.played_at), 'dd MMM, yyyy', { locale: ptBR });
  
  return (
    <div
      className={cn(
        'flex-shrink-0 w-72 rounded-2xl p-5 transition-transform active:scale-95 border-l-4',
        active 
          ? 'bg-accent/10 border-accent shadow-glow' 
          : 'bg-surface border-surface-border shadow-sm'
      )}
    >
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
        {date}
      </p>
      
      <div className="mb-4 flex items-center justify-between">
        <div className="text-center">
          <span className="block text-2xl font-bold text-text-primary">{match.score_a}</span>
          <span className="text-[10px] font-bold uppercase tracking-tighter text-text-secondary opacity-70">
            {match.team_a_name.split(' ')[0]}
          </span>
        </div>
        
        <span className="text-sm font-bold text-text-muted">VS</span>
        
        <div className="text-center">
          <span className="block text-2xl font-bold text-text-primary">{match.score_b}</span>
          <span className="text-[10px] font-bold uppercase tracking-tighter text-text-secondary opacity-70">
            {match.team_b_name.split(' ')[0]}
          </span>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-1 text-text-muted">
        <MapPin className="size-3" />
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {match.notes?.split('\n')[0].substring(0, 20) || 'Arena Central'}
        </span>
      </div>
    </div>
  );
}
