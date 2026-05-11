'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getCardTier, type Badge as BadgeType } from '@/lib/achievements';
import type { SeasonStats } from '@/lib/types';

interface PlayerFifaCardProps {
  stats: SeasonStats;
  badges: BadgeType[];
  hideDownload?: boolean;
}

type Tier = 'bronze' | 'silver' | 'gold' | 'legend';

interface TierTheme {
  /** Multi-stop gradient for the metallic outer border */
  border: string;
  /** Background of the inner card area */
  inner: string;
  /** Color for OVR, position, name, stat values */
  text: string;
  /** Secondary color for labels and accents */
  accent: string;
  /** Glow shadow */
  glow: string;
  /** Pattern overlay opacity */
  patternOpacity: number;
  /** Pretty label for the rarity tag */
  label: string;
}

const TIERS: Record<Tier, TierTheme> = {
  bronze: {
    border:
      'linear-gradient(135deg, #a16207 0%, #f59e0b 25%, #78350f 50%, #f59e0b 75%, #92400e 100%)',
    inner: 'linear-gradient(180deg, #3f2b13 0%, #1a0e04 60%, #0a0502 100%)',
    text: '#fde68a',
    accent: '#fbbf24',
    glow: '0 25px 60px -20px rgba(180, 83, 9, 0.6)',
    patternOpacity: 0.08,
    label: 'BRONZE',
  },
  silver: {
    border:
      'linear-gradient(135deg, #94a3b8 0%, #f1f5f9 25%, #64748b 50%, #f1f5f9 75%, #cbd5e1 100%)',
    inner: 'linear-gradient(180deg, #1e293b 0%, #0f172a 60%, #020617 100%)',
    text: '#f1f5f9',
    accent: '#cbd5e1',
    glow: '0 25px 60px -20px rgba(148, 163, 184, 0.55)',
    patternOpacity: 0.08,
    label: 'PRATA',
  },
  gold: {
    border:
      'linear-gradient(135deg, #b45309 0%, #fbbf24 20%, #fde68a 35%, #f59e0b 50%, #fde68a 65%, #fbbf24 80%, #b45309 100%)',
    inner: 'linear-gradient(180deg, #1c1303 0%, #0a0701 60%, #050300 100%)',
    text: '#fde68a',
    accent: '#fbbf24',
    glow: '0 25px 60px -20px rgba(250, 204, 21, 0.65)',
    patternOpacity: 0.1,
    label: 'OURO',
  },
  legend: {
    border:
      'linear-gradient(135deg, #c026d3 0%, #f0abfc 20%, #a855f7 40%, #f0abfc 60%, #ec4899 80%, #c026d3 100%)',
    inner: 'linear-gradient(180deg, #1e1b4b 0%, #0a0420 60%, #030014 100%)',
    text: '#fdf4ff',
    accent: '#f0abfc',
    glow: '0 0 50px rgba(192, 132, 252, 0.7), 0 25px 60px -20px rgba(192, 132, 252, 0.5)',
    patternOpacity: 0.12,
    label: 'LENDA',
  },
};

/** Shield-ish silhouette: flat top with widely curved bottom point */
const SHIELD_CLIP =
  'polygon(8% 0%, 92% 0%, 100% 8%, 100% 70%, 95% 80%, 80% 92%, 50% 100%, 20% 92%, 5% 80%, 0% 70%, 0% 8%)';

export function PlayerFifaCard({ stats, badges, hideDownload }: PlayerFifaCardProps) {
  const tier = getCardTier(stats.dynamic_rating);
  const theme = TIERS[tier];
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [downloading, setDownloading] = useState(false);

  // FUT-style OVR: rating 0–5 mapeado para 0–99
  const ovr = Math.min(99, Math.round((stats.dynamic_rating ?? 0) * 20));
  const positionLabel = stats.position === 'GOLEIRO_FIXO' ? 'GOL' : 'ATA';
  const photoUrl = resolvePhotoUrl(stats.photo_url);

  // Stats no formato FUT (6 slots)
  const statCells: Array<{ label: string; value: string }> = [
    { label: 'GOL', value: String(stats.goals) },
    { label: 'AST', value: String(stats.assists) },
    { label: 'DEF', value: String(stats.saves) },
    { label: 'V', value: String(stats.wins) },
    { label: 'NOTA', value: (stats.avg_rating ?? 0).toFixed(1) },
    { label: 'MVP', value: String(stats.mvp_count) },
  ];

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
        className="relative w-full max-w-[340px]"
        style={{
          aspectRatio: '5 / 7',
          filter: `drop-shadow(${theme.glow})`,
        }}
      >
        {/* Outer metallic frame */}
        <div
          className="absolute inset-0"
          style={{ background: theme.border, clipPath: SHIELD_CLIP }}
        />

        {/* Inner card content area */}
        <div
          className="absolute inset-[3px] overflow-hidden"
          style={{ background: theme.inner, clipPath: SHIELD_CLIP }}
        >
          {/* Geometric pattern overlay */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              opacity: theme.patternOpacity,
              backgroundImage:
                'repeating-linear-gradient(60deg, transparent 0 8px, currentColor 8px 9px), repeating-linear-gradient(-60deg, transparent 0 8px, currentColor 8px 9px)',
              color: theme.accent,
            }}
          />

          {/* Light streak */}
          <div
            className="pointer-events-none absolute -inset-y-1/2 -right-1/2 w-full rotate-12 opacity-20"
            style={{
              background: `linear-gradient(90deg, transparent, ${theme.text}, transparent)`,
              filter: 'blur(40px)',
            }}
          />

          {/* Player photo, anchored to fill upper area */}
          {photoUrl && (
            <div
              className="pointer-events-none absolute"
              style={{
                top: '6%',
                left: '20%',
                right: '20%',
                bottom: '38%',
              }}
            >
              <Image
                src={photoUrl}
                alt={stats.name}
                fill
                sizes="340px"
                className="object-contain"
                unoptimized
              />
            </div>
          )}

          {/* Content overlay */}
          <div className="relative flex h-full flex-col px-5 pb-7 pt-6">
            {/* Top: OVR + Position */}
            <div className="flex items-start">
              <div className="flex flex-col items-center leading-none">
                <span
                  className="text-[56px] font-black leading-none tabular-nums"
                  style={{ color: theme.text, letterSpacing: '-0.04em' }}
                >
                  {ovr}
                </span>
                <span
                  className="mt-1 text-sm font-extrabold uppercase tracking-[0.18em]"
                  style={{ color: theme.text }}
                >
                  {positionLabel}
                </span>
                <div
                  className="mt-2 h-px w-8"
                  style={{ background: theme.accent, opacity: 0.6 }}
                />
                <span className="mt-1 text-base" aria-hidden>👟</span>
              </div>
            </div>

            {/* Spacer pushes name+stats to bottom */}
            <div className="flex-1" />

            {/* Player name */}
            <div
              className="text-center"
              style={{
                color: theme.text,
                borderBottom: `1px solid ${theme.accent}`,
                paddingBottom: '6px',
                opacity: 0.95,
              }}
            >
              <h2
                className="truncate text-2xl font-black uppercase tracking-tight"
                style={{ letterSpacing: '-0.02em' }}
              >
                {stats.name}
              </h2>
            </div>

            {/* Stats grid — labels on top, values below (FUT layout) */}
            <div className="mt-2 grid grid-cols-6 gap-x-1">
              {statCells.map((s) => (
                <div key={s.label} className="flex flex-col items-center">
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider"
                    style={{ color: theme.accent, opacity: 0.85 }}
                  >
                    {s.label}
                  </span>
                  <span
                    className="text-base font-black tabular-nums leading-none"
                    style={{ color: theme.text }}
                  >
                    {s.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Badges row */}
            {badges.length > 0 && (
              <div className="mt-2 flex flex-wrap justify-center gap-1">
                {badges.map((badge) => (
                  <span
                    key={badge.label}
                    title={badge.tooltip}
                    className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                    style={{
                      color: theme.text,
                      background: 'rgba(0,0,0,0.35)',
                      border: `1px solid ${theme.accent}`,
                    }}
                  >
                    {badge.icon} {badge.label}
                  </span>
                ))}
              </div>
            )}

            {/* Tier label, bottom-center */}
            <div
              className="mt-2 text-center text-[10px] font-bold tracking-[0.35em]"
              style={{ color: theme.accent, opacity: 0.7 }}
            >
              {theme.label} · {stats.matches_played} PJ
            </div>
          </div>
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

/**
 * Resolve photo URL the same way PlayerAvatar does — bare filename means
 * local /players/<filename>. Keeps card and avatar consistent.
 */
function resolvePhotoUrl(photoUrl?: string | null): string | null {
  if (!photoUrl) return null;
  if (photoUrl.includes('/') || photoUrl.startsWith('http')) return photoUrl;
  return `/players/${photoUrl}`;
}
