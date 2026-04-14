import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  const { data: activeSeason, error: seasonErr } = await supabase
    .from('seasons')
    .select('id, name')
    .eq('active', true)
    .single();

  if (seasonErr || !activeSeason) {
    return NextResponse.json(
      { error: 'Nenhuma temporada ativa encontrada' },
      { status: 404 }
    );
  }

  const { data, error } = await supabase
    .from('v_player_season_stats')
    .select('*')
    .eq('season_id', activeSeason.id)
    .order('total_points', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: 'Falha ao buscar dados de ranking', details: error.message },
      { status: 500 }
    );
  }

  const exportData = (data ?? []).map((player, index) => ({
    Posição: index + 1,
    Jogador: player.name,
    Partidas: player.matches_played,
    Pontos: Number(player.total_points).toFixed(1),
    'Nota Média': Number(player.avg_rating).toFixed(1),
    Gols: player.goals,
    Assistências: player.assists,
    Defesas: player.saves,
    Vitórias: player.wins,
    Empates: player.draws,
    Derrotas: player.losses,
    MVP: player.mvp_count,
  }));

  return NextResponse.json({
    success: true,
    season: activeSeason.name,
    data: exportData,
    generatedAt: new Date().toISOString(),
  });
}
