import { supabase } from './supabase';
import type { Season } from './types';

export async function getOrCreateActiveSeason(): Promise<Season> {
  const { data: existing, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('active', true)
    .maybeSingle();

  if (error) throw error;
  if (existing) return existing as Season;

  const now = new Date();
  const year = now.getFullYear();
  const half = now.getMonth() < 6 ? 1 : 2;
  const name = `${year}/${half}`;
  const start = new Date(year, half === 1 ? 0 : 6, 1).toISOString().slice(0, 10);
  const end = new Date(year, half === 1 ? 5 : 11, half === 1 ? 30 : 31)
    .toISOString()
    .slice(0, 10);

  const { data, error: insertError } = await supabase
    .from('seasons')
    .insert({ name, start_date: start, end_date: end, active: true })
    .select()
    .single();

  if (insertError) throw insertError;
  return data as Season;
}
