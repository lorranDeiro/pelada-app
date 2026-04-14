'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Dice5, Users } from 'lucide-react';
import { toast } from 'sonner';
import { AppNav } from '@/components/app-nav';
import { RequireAuth } from '@/components/require-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { fetchActivePlayers, fetchRankedPlayers } from '@/lib/players';
import { getOrCreateActiveSeason } from '@/lib/season';
import { supabase } from '@/lib/supabase';
import { balanceTeams, type BalancedTeams } from '@/lib/team-balancer';
import type { Player, RankedPlayer } from '@/lib/types';

type Step = 'checkin' | 'sorteio';

export default function NovaPartidaPage() {
  return (
    <RequireAuth>
      <AppNav />
      <NovaPartidaContent />
    </RequireAuth>
  );
}

function NovaPartidaContent() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<Step>('checkin');
  const [teams, setTeams] = useState<BalancedTeams | null>(null);
  const [seed, setSeed] = useState(42);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetchActivePlayers()
      .then(setPlayers)
      .catch((e) => toast.error('Erro ao carregar jogadores', { description: e.message }));
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function sortear(newSeed = seed) {
    try {
      const season = await getOrCreateActiveSeason();
      const ranked = await fetchRankedPlayers(season.id, Array.from(selected));
      const result = balanceTeams(ranked, { seed: newSeed });
      setTeams(result);
      setSeed(newSeed);
      setStep('sorteio');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido';
      toast.error('Erro no sorteio', { description: msg });
    }
  }

  async function confirmar() {
    if (!teams) return;
    setConfirming(true);
    try {
      const season = await getOrCreateActiveSeason();

      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({
          season_id: season.id,
          played_at: new Date().toISOString().slice(0, 10),
          status: 'DRAFT',
        })
        .select()
        .single();
      if (matchError || !match) throw matchError ?? new Error('Falha ao criar partida');

      const attendances = [
        ...teams.teamA.map((p) => ({ match_id: match.id, player_id: p.id, team: 1 })),
        ...teams.teamB.map((p) => ({ match_id: match.id, player_id: p.id, team: 2 })),
      ];
      const { error: attErr } = await supabase.from('match_attendances').insert(attendances);
      if (attErr) throw attErr;

      const gkShifts = [
        ...teams.teamA
          .filter((p) => p.position === 'GOLEIRO_FIXO')
          .map((p) => ({ match_id: match.id, team: 1, player_id: p.id })),
        ...teams.teamB
          .filter((p) => p.position === 'GOLEIRO_FIXO')
          .map((p) => ({ match_id: match.id, team: 2, player_id: p.id })),
      ];
      if (gkShifts.length > 0) {
        const { error: gkErr } = await supabase.from('gk_shifts').insert(gkShifts);
        if (gkErr) throw gkErr;
      }

      toast.success('Partida criada!');
      router.push(`/partida/${match.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido';
      toast.error('Erro ao confirmar', { description: msg });
    } finally {
      setConfirming(false);
    }
  }

  if (players === null) {
    return (
      <main className="p-4 text-sm text-muted-foreground">Carregando jogadores…</main>
    );
  }

  if (players.length < 4) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-4">
        <Card>
          <CardContent className="py-8 text-center text-sm">
            <p className="mb-3">
              Você precisa de pelo menos 4 jogadores ativos para sortear times.
            </p>
            <Link href="/elenco" className="underline">
              Ir para o Elenco →
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (step === 'sorteio' && teams) {
    return (
      <TeamsPreview
        teams={teams}
        onBack={() => setStep('checkin')}
        onReshuffle={() => sortear(seed + 1)}
        onConfirm={confirmar}
        confirming={confirming}
      />
    );
  }

  return (
    <CheckIn
      players={players}
      selected={selected}
      onToggle={toggle}
      onSortear={() => sortear(seed)}
    />
  );
}

function CheckIn({
  players,
  selected,
  onToggle,
  onSortear,
}: {
  players: Player[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSortear: () => void;
}) {
  const canSort = selected.size >= 4;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Check-in</h1>
        <Badge variant={canSort ? 'default' : 'outline'}>
          <Users className="mr-1 size-3" />
          {selected.size} presentes
        </Badge>
      </div>

      <ul className="space-y-2">
        {players.map((p) => {
          const on = selected.has(p.id);
          return (
            <li key={p.id}>
              <label className="block cursor-pointer">
                <Card className={on ? 'border-foreground' : ''}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <Checkbox checked={on} onCheckedChange={() => onToggle(p.id)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{p.name}</span>
                        {p.position === 'GOLEIRO_FIXO' && (
                          <Badge variant="secondary">🧤</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {'★'.repeat(p.skill_level) + '☆'.repeat(5 - p.skill_level)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="fixed inset-x-0 bottom-0 border-t bg-background p-3">
        <div className="mx-auto max-w-3xl">
          <Button className="w-full" size="lg" disabled={!canSort} onClick={onSortear}>
            <Dice5 className="size-4" /> Sortear times ({selected.size})
          </Button>
        </div>
      </div>
    </main>
  );
}

function TeamsPreview({
  teams,
  onBack,
  onReshuffle,
  onConfirm,
  confirming,
}: {
  teams: BalancedTeams;
  onBack: () => void;
  onReshuffle: () => void;
  onConfirm: () => void;
  confirming: boolean;
}) {
  const gap = useMemo(
    () => Math.abs(teams.debug.strengthA - teams.debug.strengthB),
    [teams]
  );

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} disabled={confirming}>
          <ArrowLeft className="size-4" /> Voltar
        </Button>
        <Badge variant="outline">gap {gap.toFixed(2)}</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <TeamCard name="Brancos" players={teams.teamA} strength={teams.debug.strengthA} />
        <TeamCard
          name="Coloridos"
          players={teams.teamB}
          strength={teams.debug.strengthB}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t bg-background p-3">
        <div className="mx-auto flex max-w-3xl gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onReshuffle}
            disabled={confirming}
          >
            <Dice5 className="size-4" /> Re-sortear
          </Button>
          <Button className="flex-1" onClick={onConfirm} disabled={confirming}>
            {confirming ? 'Criando…' : 'Confirmar'}
          </Button>
        </div>
      </div>
    </main>
  );
}

function TeamCard({
  name,
  players,
  strength,
}: {
  name: string;
  players: RankedPlayer[];
  strength: number;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">{name}</h2>
          <span className="text-xs text-muted-foreground">
            força {strength.toFixed(1)}
          </span>
        </div>
        <ul className="space-y-1 text-sm">
          {players.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                {p.position === 'GOLEIRO_FIXO' && <span>🧤</span>}
                <span className="truncate">{p.name}</span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {'★'.repeat(p.skill_level)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
