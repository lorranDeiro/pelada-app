'use client';

import Link from 'next/link';
import { AppNav } from '@/components/app-nav';
import { RequireAuth } from '@/components/require-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <RequireAuth>
      <AppNav />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-4">
        <h1 className="text-2xl font-semibold">Ranking da temporada</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ainda sem partidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Cadastre os jogadores no{' '}
              <Link href="/elenco" className="font-medium text-foreground underline">
                Elenco
              </Link>{' '}
              e registre a primeira partida em{' '}
              <Link
                href="/partida/nova"
                className="font-medium text-foreground underline"
              >
                Nova partida
              </Link>
              .
            </p>
            <p>O ranking aparece aqui assim que a primeira partida for finalizada.</p>
          </CardContent>
        </Card>
      </main>
    </RequireAuth>
  );
}
