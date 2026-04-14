import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  const { data, error } = await supabase
    .from('matches')
    .select('id, played_at, status, team_a_name, team_b_name, score_a, score_b, notes')
    .eq('status', 'FINISHED')
    .order('played_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: 'Falha ao buscar dados de partidas', details: error.message },
      { status: 500 }
    );
  }

  const exportData = (data ?? []).map((m) => ({
    id: m.id,
    played_at: m.played_at,
    date_label: new Date(`${m.played_at}T00:00:00`).toLocaleDateString('pt-BR'),
    team_a_name: m.team_a_name,
    team_b_name: m.team_b_name,
    score_a: m.score_a,
    score_b: m.score_b,
    status: m.status,
    notes: m.notes ?? '',
  }));

  return NextResponse.json({
    success: true,
    data: exportData,
    generatedAt: new Date().toISOString(),
  });
}
