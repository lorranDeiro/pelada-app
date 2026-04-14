/**
 * API route to export matches data for PDF
 * GET /api/export/matches-pdf
 */

import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

async function GET(): Promise<NextResponse> {
  try {
    // Fetch matches data
    const { data, error } = await supabase
      .from('matches')
      .select(
        `
        id,
        date,
        status,
        team_a_score,
        team_b_score,
        duration_minutes,
        notes,
        created_at
      `
      )
      .eq('status', 'FINISHED')
      .order('date', { ascending: false });

    if (error) {
      console.error('Erro ao buscar partidas:', error);
      return NextResponse.json(
        { error: 'Falha ao buscar dados de partidas' },
        { status: 500 }
      );
    }

    // Transform data for PDF display
    const exportData = data?.map((match) => ({
      date: new Date(match.date).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      team_a_score: match.team_a_score,
      team_b_score: match.team_b_score,
      duration_minutes: match.duration_minutes,
      status: match.status,
      notes: match.notes || '-',
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
