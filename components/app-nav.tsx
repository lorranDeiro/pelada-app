'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/components/auth-provider';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'Ranking' },
  { href: '/elenco', label: 'Elenco' },
  { href: '/partida/nova', label: 'Nova partida' },
  { href: '/historico', label: 'Histórico' },
];

export function AppNav() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          <span className="mr-3 font-semibold">⚽ Pelada</span>
          {links.map((l) => {
            const active = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button size="sm" variant="ghost" onClick={signOut} aria-label="Sair">
            <LogOut className="size-4" />
          </Button>
        </div>
      </nav>
    </header>
  );
}
