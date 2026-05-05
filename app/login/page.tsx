'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role'); // 'admin' | null

  // Quando o usuário já está autenticado e cai aqui (ex: clicou em "Entrar"
  // estando logado), manda direto pro menu certo.
  useEffect(() => {
    if (!loading && user) {
      router.replace(role === 'admin' && isAdmin ? '/admin/home' : '/jogador');
    }
  }, [loading, user, isAdmin, role, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-premium p-4 text-text-primary">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-text-secondary transition hover:text-accent-bright"
          >
            <ArrowLeft className="size-3.5" /> Voltar
          </Link>
          <CardTitle className="text-xl">
            ⚽ Pelada App
            {role === 'admin' && (
              <span className="ml-2 rounded-full bg-accent-secondary/20 px-2 py-0.5 text-xs font-semibold text-accent-secondary">
                Admin
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <SignInForm />
            </TabsContent>

            <TabsContent value="signup">
              <SignUpForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}

function SignInForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      toast.error('Falha no login', { description: error });
      return;
    }
    // O effect no LoginPageContent cuida do redirect quando user/isAdmin
    // são resolvidos.
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <Input
          id="signin-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signin-password">Senha</Label>
        <Input
          id="signin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!playerName.trim()) return;
    setSubmitting(true);
    const { error } = await signUp({
      email: email.trim(),
      password,
      playerName: playerName.trim(),
    });
    setSubmitting(false);

    if (error) {
      toast.error('Não foi possível cadastrar', { description: error });
      return;
    }

    toast.success('Cadastro feito! Bem-vindo.');
    router.replace('/jogador');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Seu nome</Label>
        <Input
          id="signup-name"
          autoComplete="name"
          required
          placeholder="Como aparece na lista do admin"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
        <p className="text-[11px] text-text-secondary">
          O nome precisa estar previamente cadastrado pelo administrador.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Senha</Label>
        <Input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Criando conta…' : 'Cadastrar'}
      </Button>
    </form>
  );
}
