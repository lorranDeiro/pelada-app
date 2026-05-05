'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface OddsBadgeProps {
  label: string;
  value: number;
  /** Tom da pulse: 'goal' (rosa) ou 'assist' (lilás) */
  tone?: 'goal' | 'assist' | 'neutral';
}

export function OddsBadge({ label, value, tone = 'neutral' }: OddsBadgeProps) {
  const prevRef = useRef(value);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (prevRef.current !== value) {
      setFlashing(true);
      prevRef.current = value;
      const t = setTimeout(() => setFlashing(false), 600);
      return () => clearTimeout(t);
    }
  }, [value]);

  const flashColor =
    tone === 'goal'
      ? 'bg-pink-500/30 text-pink-200'
      : tone === 'assist'
      ? 'bg-purple-500/30 text-purple-200'
      : 'bg-accent/30 text-accent';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-mono tabular-nums transition-colors duration-500',
        flashing ? flashColor : 'bg-muted/40 text-muted-foreground'
      )}
    >
      <span className="font-semibold uppercase tracking-wide">{label}</span>
      <span className="font-bold">{value.toFixed(2)}</span>
    </span>
  );
}
