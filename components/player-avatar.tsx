import Image from 'next/image';
import { cn } from '@/lib/utils';

interface Props {
  name: string;
  photoUrl?: string | null;
  size?: number;
  className?: string;
  /** Tailwind ring color class, e.g. "ring-yellow-500" */
  ringClass?: string;
}

/** 
 * Resolve photo URL: if it's a plain filename (no slashes or http),
 * treat it as a local file in /players/filename.png
 */
function resolvePhotoUrl(photoUrl?: string | null): string | null {
  if (!photoUrl) return null;
  
  // If it already has a slash or http, use as-is (external or full path)
  if (photoUrl.includes('/') || photoUrl.startsWith('http')) {
    return photoUrl;
  }
  
  // Otherwise, treat as a filename in public/players/
  return `/players/${photoUrl}`;
}

export function PlayerAvatar({
  name,
  photoUrl,
  size = 64,
  className,
  ringClass,
}: Props) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  const resolvedUrl = resolvePhotoUrl(photoUrl);

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-slate-700 to-slate-900',
        ringClass && `ring-2 ring-offset-2 ring-offset-transparent ${ringClass}`,
        className
      )}
      style={{ width: size, height: size }}
    >
      {resolvedUrl ? (
        <Image
          src={resolvedUrl}
          alt={name}
          fill
          sizes={`${size}px`}
          className="object-cover"
          unoptimized
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center font-bold text-white"
          style={{ fontSize: size * 0.4 }}
        >
          {initials || '?'}
        </span>
      )}
    </div>
  );
}
