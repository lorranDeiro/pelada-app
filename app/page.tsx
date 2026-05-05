'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';

export default function LandingPage() {
  const { user, isAdmin, loading, signOut } = useAuth();

  // Card do administrador é "smart": se já está logado e é admin, vai
  // direto pro menu admin; caso contrário cai no /login.
  const adminHref = !loading && user && isAdmin ? '/admin/home' : '/login?role=admin';

  return (
    <main className="min-h-screen bg-gradient-premium text-text-primary">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚽</span>
            <span className="text-lg font-bold">Pelada App</span>
          </div>
          {user ? (
            <button
              onClick={() => signOut()}
              className="text-sm text-text-secondary transition hover:text-accent-bright"
            >
              Sair
            </button>
          ) : (
            <Link
              href="/login"
              className="text-sm text-text-secondary transition hover:text-accent-bright"
            >
              Entrar →
            </Link>
          )}
        </header>

        <div className="mb-10 space-y-3 text-center sm:mb-16">
          <h1 className="text-3xl font-bold sm:text-4xl">Quem está acessando?</h1>
          <p className="text-text-secondary">
            Escolha seu perfil para continuar.
          </p>
        </div>

        <div className="mx-auto grid w-full max-w-3xl flex-1 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          <ProfileCard
            href="/jogador"
            label="Jogador"
            description="Veja o ranking da liga e o histórico de partidas"
            icon={<User className="size-16 text-accent" strokeWidth={1.5} />}
            ringColor="ring-accent/30 hover:ring-accent"
            glowColor="from-accent/20 to-accent/5"
          />
          <ProfileCard
            href={adminHref}
            label="Administrador"
            description="Gerencie elenco, partidas e o painel completo"
            icon={
              <ShieldCheck className="size-16 text-accent-secondary" strokeWidth={1.5} />
            }
            ringColor="ring-accent-secondary/30 hover:ring-accent-secondary"
            glowColor="from-accent-secondary/20 to-accent-secondary/5"
          />
        </div>

        <footer className="mt-16 text-center text-xs text-text-secondary">
          ⚡ Gestão inteligente das suas peladas
        </footer>
      </div>
    </main>
  );
}

interface ProfileCardProps {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  ringColor: string;
  glowColor: string;
}

function ProfileCard({
  href,
  label,
  description,
  icon,
  ringColor,
  glowColor,
}: ProfileCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col items-center gap-5 overflow-hidden rounded-2xl border border-surface-border bg-surface p-8 transition hover:scale-[1.02] hover:shadow-2xl"
    >
      <div
        className={`absolute inset-0 -z-10 bg-gradient-to-b ${glowColor} opacity-50 transition group-hover:opacity-100`}
      />
      <div
        className={`flex size-28 items-center justify-center rounded-full bg-background/60 ring-2 transition ${ringColor}`}
      >
        {/* PLACEHOLDER: trocar pelo SVG de silhueta real, se desejar.
            Caminho sugerido: /public/icons/silhouette-{player|admin}.svg */}
        {icon}
      </div>
      <div className="space-y-1 text-center">
        <h2 className="text-2xl font-bold">{label}</h2>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
      <div className="mt-2 flex items-center gap-1 text-sm font-semibold text-text-primary">
        Continuar
        <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
