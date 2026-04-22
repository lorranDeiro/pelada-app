import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const seasonIdParam = searchParams.get('season_id');

  // Get active season or specified season
  let seasonQuery = supabase
    .from('seasons')
    .select('id, name');
  
  if (seasonIdParam) {
    seasonQuery = seasonQuery.eq('id', seasonIdParam);
  } else {
    seasonQuery = seasonQuery.eq('active', true);
  }

  const { data: activeSeason, error: seasonErr } = await seasonQuery.single();

  if (seasonErr || !activeSeason) {
    return new NextResponse('Nenhuma temporada encontrada', { status: 404 });
  }

  const { data, error } = await supabase
    .from('v_player_season_stats')
    .select('*')
    .eq('season_id', activeSeason.id)
    .order('total_points', { ascending: false });

  if (error) {
    return new NextResponse('Falha ao buscar dados de ranking', { status: 500 });
  }

  // Build CSV rows with proper escaping
  const headers = ['Posição', 'Jogador', 'Nível', 'Partidas', 'Pontos', 'Nota Média', 'Gols', 'Assistências', 'Defesas', 'Vitórias', 'Empates', 'Derrotas', 'MVP'];
  
  const rows = (data ?? []).map((player, index) => [
    String(index + 1),
    player.name || '',
    String(Number(player.dynamic_rating || 3.0).toFixed(1)),
    String(player.matches_played || 0),
    Number(player.total_points || 0).toFixed(1),
    Number(player.avg_rating || 0).toFixed(1),
    String(player.goals || 0),
    String(player.assists || 0),
    String(player.saves || 0),
    String(player.wins || 0),
    String(player.draws || 0),
    String(player.losses || 0),
    String(player.mvp_count || 0),
  ]);

  // Escape CSV field (handle semicolons, quotes, line breaks)
  function escapeCSVField(field: string): string {
    if (field.includes(';') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  // Build CSV content with BOM for UTF-8 compatibility in Excel pt-BR
  const csvContent = [
    '\uFEFF' + headers.map(escapeCSVField).join(';'),
    ...rows.map(row => row.map(escapeCSVField).join(';')),
  ].join('\n');

  const filename = `ranking-${activeSeason.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv;charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
