'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare, Swords, Users } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { RequireAuth } from '@/components/require-auth';

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
    <main className="min-h-screen bg-gradient-premium text-text-primary">
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <Link
          href="/admin/home"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-text-secondary transition hover:text-accent-bright"
        >
          <ArrowLeft className="size-4" /> Voltar ao menu
        </Link>

        <header className="mb-10 space-y-2 text-center">
          <h1 className="text-3xl font-bold">Painel de Administração</h1>
          <p className="text-text-secondary">
            Gerencie elenco, partidas e comentários
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <HubCard
            href="/elenco"
            icon={<Users className="size-10 text-accent" />}
            title="Elenco"
            description="Cadastrar e editar jogadores"
          />
          <HubCard
            href="/admin/partidas"
            icon={<Swords className="size-10 text-accent-secondary" />}
            title="Partidas"
            description="Editar partidas finalizadas"
          />
          <HubCard
            href="/admin/comentarios"
            icon={<MessageSquare className="size-10 text-accent-bright" />}
            title="Comentários"
            description="Moderar comentários públicos"
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
      className="group flex flex-col gap-3 rounded-2xl border border-surface-border bg-surface p-6 transition hover:scale-[1.02] hover:border-accent hover:shadow-2xl"
    >
      <div className="flex size-16 items-center justify-center rounded-xl bg-background/60 transition group-hover:scale-105">
        {icon}
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-sm text-text-secondary">{description}</p>
    </Link>
  );
}
