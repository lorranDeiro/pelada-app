/**
 * API route to export ranking data as CSV
 * GET /api/export/ranking-csv
 */

import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

async function GET(): Promise<NextResponse> {
  try {
    // Fetch ranking data from view
    const { data, error } = await supabase
      .from('v_player_season_stats')
      .select('*')
      .order('rating', { ascending: false });

    if (error) {
      console.error('Erro ao buscar ranking:', error);
      return NextResponse.json(
        { error: 'Falha ao buscar dados de ranking' },
        { status: 500 }
      );
    }

    // Transform data for CSV export
    const exportData = data?.map((player, index) => ({
      Posição: index + 1,
      Jogador: player.name,
      Partidas: player.match_count,
      Pontos: player.total_rating_points,
      'Rating Médio': parseFloat(player.rating).toFixed(2),
      Gols: player.goals,
      Assistências: player.assists,
      Defesas: player.saves,
      Vitórias: player.wins,
      Empates: player.draws,
      Derrotas: player.losses,
      MVP: player.mvp_count,
    })) || [];

    return NextResponse.json({
      success: true,
      data: exportData,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao processar export:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar export' },
      { status: 500 }
    );
  }
}

export { GET };
