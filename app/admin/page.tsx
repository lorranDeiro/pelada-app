'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare, Swords, Users, Upload } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { RequireAuth } from '@/components/require-auth';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AdminHubPage() {
  return (
    <RequireAuth>
      <AdminHubContent />
    </RequireAuth>
  );
}

function AdminHubContent() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) router.replace('/jogador');
  }, [loading, isAdmin, router]);

  if (loading || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-text-secondary">
        Carregando…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-text-primary">
      <header className="sticky top-0 z-10 border-b border-surface-border/40 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <Link
            href="/admin/home"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary transition hover:text-accent-bright"
          >
            <ArrowLeft className="size-4" /> Menu Principal
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-4 py-12 space-y-10">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Administração</h1>
          <p className="text-text-secondary">
            Gerencie elenco, partidas, comentários e dados
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <HubCard
            href="/elenco"
            icon={<Users className="size-8 text-accent" />}
            title="Elenco"
            description="Jogadores e níveis"
          />
          <HubCard
            href="/admin/partidas"
            icon={<Swords className="size-8 text-accent-secondary" />}
            title="Partidas"
            description="Editar resultados"
          />
          <HubCard
            href="/admin/comentarios"
            icon={<MessageSquare className="size-8 text-accent-bright" />}
            title="Comentários"
            description="Moderar painel"
          />
          <HubCard
            href="/admin/importar"
            icon={<Upload className="size-8 text-amber-500" />}
            title="Importar CSV"
            description="Dados históricos"
          />
        </div>
      </div>
    </main>
  );
}

function HubCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-2xl border border-surface-border bg-surface p-6 transition hover:scale-[1.02] hover:border-accent hover:shadow-premium"
    >
      <div className="flex size-14 items-center justify-center rounded-xl bg-background/60 transition group-hover:scale-110">
        {icon}
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-bold leading-tight">{title}</h2>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
    </Link>
  );
}
