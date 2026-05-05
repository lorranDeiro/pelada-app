'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface Props {
  onDone: () => void;
  /** Duração default do hype em ms. */
  durationMs?: number;
}

export function DraftLoadingOverlay({ onDone, durationMs = 1500 }: Props) {
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (skipped) {
      onDone();
      return;
    }
    const t = setTimeout(onDone, durationMs);
    return () => clearTimeout(t);
  }, [skipped, durationMs, onDone]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative size-32">
        {/* Anel externo girando */}
        <div
          className="absolute inset-0 animate-spin rounded-2xl border-2 border-accent border-t-transparent"
          style={{ animationDuration: '1.2s' }}
        />
        {/* Anel interno girando ao contrário */}
        <div
          className="absolute inset-3 animate-spin rounded-2xl border-2 border-accent-secondary border-b-transparent"
          style={{ animationDuration: '1.6s', animationDirection: 'reverse' }}
        />
        <Sparkles className="absolute inset-0 m-auto size-12 text-accent animate-pulse" />
      </div>

      <div className="mt-8 max-w-md space-y-2 px-4 text-center">
        <h2 className="text-xl font-bold text-text-primary animate-in fade-in slide-in-from-bottom-2 duration-500 sm:text-2xl">
          Avaliando 924 combinações
        </h2>
        <p className="text-sm text-text-secondary animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
          Para garantir o equilíbrio estatístico…
        </p>
      </div>

      <button
        onClick={() => setSkipped(true)}
        className="mt-10 text-xs text-text-secondary transition hover:text-accent-bright"
      >
        Pular animação →
      </button>
    </div>
  );
}
