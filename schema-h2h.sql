-- =====================================================================
-- H2H STATS FUNCTION
-- =====================================================================

create or replace function get_h2h_stats(p1_id uuid, p2_id uuid)
returns table (
  p1_wins bigint,
  p2_wins bigint,
  draws bigint,
  total bigint
) language plpgsql security definer as $$
begin
  return query
  with common_matches as (
    -- Partidas onde ambos jogaram
    select 
      ma1.match_id,
      ma1.team as team1,
      ma2.team as team2,
      m.score_a,
      m.score_b
    from match_attendances ma1
    join match_attendances ma2 on ma1.match_id = ma2.match_id
    join matches m on ma1.match_id = m.id
    where ma1.player_id = p1_id 
      and ma2.player_id = p2_id
      and m.status = 'FINISHED'
  ),
  outcomes as (
    select
      case 
        when score_a = score_b then 'DRAW'
        when (team1 = 1 and score_a > score_b) or (team1 = 2 and score_b > score_a) then 'P1_WIN'
        when (team2 = 1 and score_a > score_b) or (team2 = 2 and score_b > score_a) then 'P2_WIN'
        else 'OTHER' -- Casos onde estao no mesmo time (podemos filtrar se quiser H2H puro)
      end as outcome
    from common_matches
    where team1 != team2 -- Filtro para apenas quando sao adversarios
  )
  select 
    count(*) filter (where outcome = 'P1_WIN')::bigint,
    count(*) filter (where outcome = 'P2_WIN')::bigint,
    count(*) filter (where outcome = 'DRAW')::bigint,
    count(*)::bigint
  from outcomes;
end;
$$;
