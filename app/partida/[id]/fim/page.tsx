'use client';

import { use } from 'react';
import Link from 'next/link';
import { AppNav } from '@/components/app-nav';
import { RequireAuth } from '@/components/require-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
  params: Promise<{ id: string }>;
}

export default function FimPage({ params }: Props) {
  const { id } = use(params);
  return (
    <RequireAuth>
      <AppNav />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Finalizar partida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Esta tela ainda será construída. Será aqui que você:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Confirma o placar final</li>
              <li>Vota no MVP (jogadores perdedores escolhem do time vencedor)</li>
              <li>Grava os resultados por jogador</li>
            </ul>
            <Button variant="outline" asChild>
              <Link href={`/partida/${id}`}>← Voltar ao painel</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </RequireAuth>
  );
}
