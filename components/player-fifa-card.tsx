'use client';

import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCardTier, type Badge as BadgeType } from '@/lib/achievements';
import type { SeasonStats } from '@/lib/types';

interface PlayerFifaCardProps {
  stats: SeasonStats;
  badges: BadgeType[];
  /** If true, hides the download button (useful inside a capture) */
  hideDownload?: boolean;
}

export function PlayerFifaCard({ stats, badges, hideDownload }: PlayerFifaCardProps) {
  const tier = getCardTier(stats.dynamic_rating);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [downloading, setDownloading] = useState(false);

  const tierStyles = {
    bronze: {
      gradient: 'from-amber-700 via-amber-800 to-amber-900',
      textColor: 'text-white',
      borderColor: 'border-amber-900',
      accentColor: 'text-amber-200',
    },
    silver: {
      gradient: 'from-slate-200 via-slate-300 to-slate-400',
      textColor: 'text-slate-900',
      borderColor: 'border-slate-400',
      accentColor: 'text-slate-700',
    },
    gold: {
      gradient: 'from-yellow-300 via-yellow-400 to-yellow-500',
      textColor: 'text-amber-950',
      borderColor: 'border-yellow-500',
      accentColor: 'text-amber-800',
    },
    legend: {
      gradient: 'from-purple-500 via-fuchsia-500 to-purple-600',
      textColor: 'text-white',
      borderColor: 'border-fuchsia-300 shadow-[0_0_40px_rgba(192,132,252,0.7)]',
      accentColor: 'text-fuchsia-100',
    },
  };

  const style = tierStyles[tier];

  async function handleDownload() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: 'transparent',
      });
      const blob = await (await fetch(dataUrl)).blob();
      const safeName = stats.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      saveAs(blob, `carta-${safeName}.png`);
    } catch (err) {
      console.error('Erro ao gerar PNG:', err);
      toast.error('Não foi possível gerar a imagem');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={cardRef}
        className={`relative w-full max-w-xs overflow-hidden rounded-xl border-2 ${style.borderColor} bg-gradient-to-b ${style.gradient} p-4 shadow-2xl`}
      >
        <div className="flex items-start justify-between">
          <div className="flex flex-col items-start">
            <div className={`text-4xl font-black ${style.accentColor}`}>
              {(stats.dynamic_rating ?? 0).toFixed(1)}
            </div>
            <div className={`text-xs font-semibold uppercase tracking-wide ${style.accentColor}`}>
              {stats.position === 'GOLEIRO_FIXO' ? 'GK' : 'ST'}
            </div>
          </div>
        </div>

        <div className="my-4 text-center">
          <h2 className={`text-xl font-black ${style.textColor} truncate`}>
            {stats.name}
          </h2>
          <p className={`text-xs ${style.accentColor} font-semibold`}>
            {stats.matches_played} {stats.matches_played === 1 ? 'Partida' : 'Partidas'}
          </p>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          <StatBox label="GOL" value={stats.goals} textColor={style.textColor} accentColor={style.accentColor} />
          <StatBox label="ASS" value={stats.assists} textColor={style.textColor} accentColor={style.accentColor} />
          <StatBox label="DEF" value={stats.saves} textColor={style.textColor} accentColor={style.accentColor} />
        </div>

        <div className={`mb-3 flex justify-between gap-2 rounded bg-black/20 px-2 py-1 text-xs ${style.textColor}`}>
          <div className="text-center">
            <div className="font-semibold">{stats.wins}V</div>
            <div className={`text-[10px] ${style.accentColor}`}>Vitórias</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">{stats.draws}E</div>
            <div className={`text-[10px] ${style.accentColor}`}>Empates</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">{stats.losses}D</div>
            <div className={`text-[10px] ${style.accentColor}`}>Derrotas</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">{stats.total_points.toFixed(0)}</div>
            <div className={`text-[10px] ${style.accentColor}`}>Pts</div>
          </div>
        </div>

        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1 pb-6">
            {badges.map((badge) => (
              <Badge
                key={badge.label}
                variant="outline"
                className={`border-current ${style.textColor} bg-black/30 text-xs`}
                title={badge.tooltip}
              >
                {badge.icon} {badge.label}
              </Badge>
            ))}
          </div>
        )}

        <div
          className={`absolute bottom-2 right-2 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${style.accentColor} bg-black/40`}
        >
          {tier === 'legend' && '⚡ Lenda'}
          {tier === 'gold' && '✨ Ouro'}
          {tier === 'silver' && '◆ Prata'}
          {tier === 'bronze' && '■ Bronze'}
        </div>
      </div>

      {!hideDownload && (
        <Button
          size="sm"
          variant="secondary"
          onClick={handleDownload}
          disabled={downloading}
          className="gap-2"
        >
          <Download className="size-4" />
          {downloading ? 'Gerando…' : 'Baixar Carta (PNG)'}
        </Button>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  textColor,
  accentColor,
}: {
  label: string;
  value: number;
  textColor: string;
  accentColor: string;
}) {
  return (
    <div className="flex flex-col items-center rounded bg-black/30 py-1">
      <div className={`text-lg font-black ${accentColor}`}>{value}</div>
      <div className={`text-[10px] font-semibold uppercase ${textColor} opacity-80`}>
        {label}
      </div>
    </div>
  );
}
