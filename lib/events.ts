import { supabase } from './supabase';
import { EVENT_WEIGHTS } from './scoring';
import type { EventType, GkShift, MatchEvent } from './types';

export async function fetchEvents(matchId: string): Promise<MatchEvent[]> {
  const { data, error } = await supabase
    .from('match_events')
    .select('*')
    .eq('match_id', matchId)
    .order('event_timestamp', { ascending: false });
  if (error) throw error;
  return (data ?? []) as MatchEvent[];
}

export async function fetchOpenShifts(matchId: string): Promise<GkShift[]> {
  const { data, error } = await supabase
    .from('gk_shifts')
    .select('*')
    .eq('match_id', matchId)
    .is('ended_at', null);
  if (error) throw error;
  return (data ?? []) as GkShift[];
}

export async function insertEvent(params: {
  match_id: string;
  player_id: string;
  team: 1 | 2;
  event_type: EventType;
}): Promise<MatchEvent> {
  const [event] = await insertEventBatch({ ...params, quantity: 1 });
  return event;
}

export async function insertEventBatch(params: {
  match_id: string;
  player_id: string;
  team: 1 | 2;
  event_type: EventType;
  quantity: number;
}): Promise<MatchEvent[]> {
  const openShifts = await fetchOpenShifts(params.match_id);
  const in_gk_turn = openShifts.some(
    (s) => s.team === params.team && s.player_id === params.player_id
  );

  const eventsToInsert = Array.from({ length: params.quantity }).map(() => ({
    match_id: params.match_id,
    player_id: params.player_id,
    event_type: params.event_type,
    points: EVENT_WEIGHTS[params.event_type],
    in_gk_turn,
  }));

  const { data, error } = await supabase
    .from('match_events')
    .insert(eventsToInsert)
    .select();
  if (error) throw error;
  return data as MatchEvent[];
}

export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabase.from('match_events').delete().eq('id', eventId);
  if (error) throw error;
}

export async function switchGk(params: {
  match_id: string;
  team: 1 | 2;
  new_player_id: string;
}): Promise<void> {
  const { error: closeErr } = await supabase
    .from('gk_shifts')
    .update({ ended_at: new Date().toISOString() })
    .eq('match_id', params.match_id)
    .eq('team', params.team)
    .is('ended_at', null);
  if (closeErr) throw closeErr;

  const { error: openErr } = await supabase.from('gk_shifts').insert({
    match_id: params.match_id,
    team: params.team,
    player_id: params.new_player_id,
  });
  if (openErr) throw openErr;
}
