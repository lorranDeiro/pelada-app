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
  border: string;
  inner: string;
  innerColor: string; // solid color para mask gradient
  text: string;
  accent: string;
  glow: string;
  patternOpacity: number;
  label: string;
}

const TIERS: Record<Tier, TierTheme> = {
  bronze: {
    border:
      'linear-gradient(135deg, #a16207 0%, #f59e0b 25%, #78350f 50%, #f59e0b 75%, #92400e 100%)',
    inner: 'linear-gradient(180deg, #3f2b13 0%, #1a0e04 60%, #0a0502 100%)',
    innerColor: '#0a0502',
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
    innerColor: '#020617',
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
    innerColor: '#050300',
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
    innerColor: '#030014',
    text: '#fdf4ff',
    accent: '#f0abfc',
    glow: '0 0 50px rgba(192, 132, 252, 0.7), 0 25px 60px -20px rgba(192, 132, 252, 0.5)',
    patternOpacity: 0.12,
    label: 'LENDA',
  },
};

/**
 * Shield mais "gentil": taper só nos últimos ~18% da altura.
 * Acima disso, o shape é praticamente um retângulo com cantos chanfrados,
 * deixando uma área interna muito mais utilizável pro conteúdo.
 */
const SHIELD_CLIP =
  'polygon(8% 0%, 92% 0%, 100% 6%, 100% 82%, 92% 94%, 50% 100%, 8% 94%, 0% 82%, 0% 6%)';

export function PlayerFifaCard({ stats, badges, hideDownload }: PlayerFifaCardProps) {
  const tier = getCardTier(stats.dynamic_rating);
  const theme = TIERS[tier];
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [downloading, setDownloading] = useState(false);

  const ovr = Math.min(99, Math.round((stats.dynamic_rating ?? 0) * 20));
  const positionLabel = stats.position === 'GOLEIRO_FIXO' ? 'GOL' : 'ATA';
  const photoUrl = resolvePhotoUrl(stats.photo_url);

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

        {/* Inner card */}
        <div
          className="absolute inset-[3px] overflow-hidden"
          style={{ background: theme.inner, clipPath: SHIELD_CLIP }}
        >
          {/* Geometric pattern */}
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
            className="pointer-events-none absolute -inset-y-1/2 -right-1/3 w-2/3 rotate-12 opacity-20"
            style={{
              background: `linear-gradient(90deg, transparent, ${theme.text}, transparent)`,
              filter: 'blur(40px)',
            }}
          />

          {/* Player photo hero: fills upper ~58% edge-to-edge */}
          {photoUrl && (
            <div
              className="pointer-events-none absolute"
              style={{ top: 0, left: 0, right: 0, bottom: '42%' }}
            >
              <Image
                src={photoUrl}
                alt={stats.name}
                fill
                sizes="340px"
                className="object-cover"
                style={{ objectPosition: '50% 18%' }}
                unoptimized
              />
              {/* Feather bottom of photo into card */}
              <div
                className="absolute inset-x-0 bottom-0 h-1/3"
                style={{
                  background: `linear-gradient(to bottom, transparent 0%, ${theme.innerColor} 100%)`,
                }}
              />
              {/* Subtle dark gradient on top-left for OVR legibility */}
              <div
                className="absolute inset-y-0 left-0 w-1/3"
                style={{
                  background:
                    'linear-gradient(to right, rgba(0,0,0,0.55) 0%, transparent 100%)',
                }}
              />
            </div>
          )}

          {/* OVR + POS column, top-left overlay */}
          <div className="absolute left-5 top-5 z-10 flex flex-col items-center leading-none">
            <span
              className="text-[56px] font-black leading-none tabular-nums drop-shadow-lg"
              style={{ color: theme.text, letterSpacing: '-0.04em' }}
            >
              {ovr}
            </span>
            <span
              className="mt-1 text-sm font-extrabold uppercase tracking-[0.18em] drop-shadow-md"
              style={{ color: theme.text }}
            >
              {positionLabel}
            </span>
            <div
              className="mt-2 h-px w-8"
              style={{ background: theme.accent, opacity: 0.6 }}
            />
            <span className="mt-1 text-base drop-shadow" aria-hidden>
              👟
            </span>
          </div>

          {/* Bottom content block: name + stats + badges + tier */}
          <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-12">
            {/* Name */}
            <div
              className="border-b text-center pb-1.5 mb-2.5"
              style={{ borderColor: theme.accent, color: theme.text }}
            >
              <h2
                className="truncate text-2xl font-black uppercase"
                style={{ letterSpacing: '-0.01em' }}
              >
                {stats.name}
              </h2>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-6 gap-x-1">
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

            {/* Badges */}
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
          </div>

          {/* Tier label, absolute at very bottom inside the taper */}
          <div
            className="absolute inset-x-0 z-10 text-center text-[10px] font-bold tracking-[0.3em]"
            style={{
              color: theme.accent,
              opacity: 0.7,
              bottom: '3.5%',
            }}
          >
            {theme.label} · {stats.matches_played} PJ
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

function resolvePhotoUrl(photoUrl?: string | null): string | null {
  if (!photoUrl) return null;
  if (photoUrl.includes('/') || photoUrl.startsWith('http')) return photoUrl;
  return `/players/${photoUrl}`;
}
