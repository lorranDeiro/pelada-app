'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
  id?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  className,
  id,
  'aria-label': ariaLabel,
}: SwitchProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'relative inline-flex cursor-pointer items-center',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <input
        id={id}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange(e.target.checked)}
        aria-label={ariaLabel}
      />
      <div
        className={cn(
          'h-6 w-11 rounded-full bg-surface-active transition-colors',
          'peer-checked:bg-accent',
          "after:absolute after:left-0.5 after:top-0.5 after:size-5",
          'after:rounded-full after:bg-white after:shadow after:transition-transform',
          'after:content-[\'\'] peer-checked:after:translate-x-5'
        )}
      />
    </label>
  );
}
