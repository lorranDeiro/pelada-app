'use client';

import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Match } from '@/lib/types';

interface Props {
  match: Match;
  showAdminEdit?: boolean;
}

export function MatchRow({ match, showAdminEdit }: Props) {
  const isLive = match.status === 'LIVE';
  const isFinished = match.status === 'FINISHED';
  const teamAWon = match.score_a > match.score_b;
  const teamBWon = match.score_b > match.score_a;

  return (
    <div
      className={cn(
        'group relative grid grid-cols-[64px_1fr_auto] items-stretch gap-3 border-b border-fs-border px-3 py-2 transition-colors',
        'hover:bg-fs-surface-2'
      )}
    >
      <Link
        href={`/partida/${match.id}`}
        className="absolute inset-0 z-0"
        aria-label={`Partida ${match.played_at}`}
      />

      <div className="z-10 flex flex-col justify-center gap-0.5 font-mono text-[11px] tabular-nums leading-tight">
        {isLive ? (
          <span className="flex items-center gap-1 font-semibold text-fs-live">
            <span className="size-1.5 animate-pulse rounded-full bg-fs-live" />
            LIVE
          </span>
        ) : (
          <>
            <span className="text-fs-text">{formatDate(match.played_at)}</span>
            <span className="text-[10px] uppercase tracking-wider text-fs-text-dim">
              {isFinished ? 'FT' : 'RASCUNHO'}
            </span>
          </>
        )}
      </div>

      <div className="z-10 flex flex-col justify-center gap-0.5 text-sm">
        <TeamLine
          name={match.team_a_name}
          faded={isFinished && teamBWon}
          bold={teamAWon}
        />
        <TeamLine
          name={match.team_b_name}
          faded={isFinished && teamAWon}
          bold={teamBWon}
        />
      </div>

      <div className="z-10 flex flex-col items-end justify-center gap-0.5 font-mono text-base tabular-nums leading-tight">
        <span
          className={cn(
            'min-w-[1.5ch] text-right',
            teamAWon ? 'font-bold text-fs-text' : 'text-fs-text-dim'
          )}
        >
          {match.score_a}
        </span>
        <span
          className={cn(
            'min-w-[1.5ch] text-right',
            teamBWon ? 'font-bold text-fs-text' : 'text-fs-text-dim'
          )}
        >
          {match.score_b}
        </span>
      </div>

      {showAdminEdit && isFinished && (
        <Link
          href={`/admin/partidas/${match.id}/edit`}
          className="z-20 absolute right-2 top-1/2 -translate-y-1/2 hidden items-center gap-1 rounded border border-fs-border bg-fs-surface px-2 py-1 text-[11px] font-medium text-fs-text-dim transition-colors hover:border-fs-accent hover:text-fs-accent group-hover:flex"
          onClick={(e) => e.stopPropagation()}
          title="Editar partida (VAR)"
        >
          <Pencil className="size-3" />
          Editar
        </Link>
      )}
    </div>
  );
}

function TeamLine({ name, faded, bold }: { name: string; faded?: boolean; bold?: boolean }) {
  return (
    <span
      className={cn(
        'truncate',
        bold && 'font-semibold text-fs-text',
        !bold && !faded && 'text-fs-text',
        faded && 'text-fs-text-dim'
      )}
    >
      {name}
    </span>
  );
}

function formatDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}.${m}`;
}
