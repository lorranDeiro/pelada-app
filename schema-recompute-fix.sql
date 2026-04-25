-- =====================================================================
-- Fix: recompute_match_results roda como SECURITY DEFINER, com check
-- de admin explícito no início. Resolve 400 causado por RLS bloqueando
-- o DELETE/INSERT interno quando chamado via PostgREST.
--
-- Também renomeia a coluna OUT match_id → out_match_id (e adiciona
-- #variable_conflict use_column) pra remover ambiguidade contra a
-- coluna match_id de player_match_results no DELETE/WHERE interno.
-- =====================================================================

-- DROP necessário porque mudamos a assinatura de retorno (TABLE columns).
-- CREATE OR REPLACE não aceita mudança de return type.
DROP FUNCTION IF EXISTS recompute_match_results(uuid);

CREATE OR REPLACE FUNCTION recompute_match_results(p_match_id uuid)
RETURNS TABLE(out_match_id uuid, updated_count int) AS $$
#variable_conflict use_column
DECLARE
  v_match_id uuid := p_match_id;
  v_season_id uuid;
  v_score_a int;
  v_score_b int;
  v_mvp_player_id uuid;
  v_updated_count int := 0;
BEGIN
  -- Guard: como rodamos SECURITY DEFINER (bypassa RLS), precisamos
  -- checar admin manualmente para não virar backdoor.
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Permission denied: admin only';
  END IF;

  SELECT m.season_id, m.score_a, m.score_b, m.mvp_player_id
  INTO v_season_id, v_score_a, v_score_b, v_mvp_player_id
  FROM matches m
  WHERE m.id = v_match_id;

  IF v_season_id IS NULL THEN
    RAISE EXCEPTION 'Match not found: %', v_match_id;
  END IF;

  DELETE FROM player_match_results pmr WHERE pmr.match_id = v_match_id;

  WITH team_players AS (
    SELECT ma.player_id, ma.team, ma.match_id
    FROM match_attendances ma
    WHERE ma.match_id = v_match_id
  ),
  player_events AS (
    SELECT
      tp.player_id,
      tp.team,
      SUM(me.points) AS event_points,
      COUNT(*) FILTER (WHERE me.event_type IN ('GOAL', 'WINNING_GOAL')) AS goals,
      COUNT(*) FILTER (WHERE me.event_type = 'ASSIST') AS assists,
      COUNT(*) FILTER (WHERE me.event_type IN ('SAVE', 'PENALTY_SAVE')) AS saves
    FROM team_players tp
    LEFT JOIN match_events me ON me.player_id = tp.player_id AND me.match_id = tp.match_id
    GROUP BY tp.player_id, tp.team
  )
  INSERT INTO player_match_results (
    match_id, player_id, team, outcome, outcome_points,
    event_points, mvp_bonus, total_points, match_rating,
    goals, assists, saves
  )
  SELECT
    v_match_id,
    pe.player_id,
    pe.team,
    CASE
      WHEN v_score_a = v_score_b THEN 'DRAW'::text
      WHEN (pe.team = 1 AND v_score_a > v_score_b) OR (pe.team = 2 AND v_score_b > v_score_a) THEN 'WIN'::text
      ELSE 'LOSS'::text
    END AS outcome,
    CASE
      WHEN v_score_a = v_score_b THEN 1.5::numeric
      WHEN (pe.team = 1 AND v_score_a > v_score_b) OR (pe.team = 2 AND v_score_b > v_score_a) THEN 5.0::numeric
      ELSE -1.0::numeric
    END AS outcome_points,
    COALESCE(pe.event_points, 0)::numeric(5,2) AS event_points,
    CASE WHEN v_mvp_player_id = pe.player_id THEN 4.0::numeric ELSE 0::numeric END AS mvp_bonus,
    (
      CASE
        WHEN v_score_a = v_score_b THEN 1.5::numeric
        WHEN (pe.team = 1 AND v_score_a > v_score_b) OR (pe.team = 2 AND v_score_b > v_score_a) THEN 5.0::numeric
        ELSE -1.0::numeric
      END
      + COALESCE(pe.event_points, 0)::numeric
      + CASE WHEN v_mvp_player_id = pe.player_id THEN 4.0::numeric ELSE 0::numeric END
    )::numeric(5,2) AS total_points,
    GREATEST(0.0::numeric, LEAST(5.0::numeric,
      (
        CASE
          WHEN v_score_a = v_score_b THEN 1.5::numeric
          WHEN (pe.team = 1 AND v_score_a > v_score_b) OR (pe.team = 2 AND v_score_b > v_score_a) THEN 5.0::numeric
          ELSE -1.0::numeric
        END
        + COALESCE(pe.event_points, 0)::numeric
        + CASE WHEN v_mvp_player_id = pe.player_id THEN 4.0::numeric ELSE 0::numeric END
      ) * 0.2::numeric
    )) AS match_rating,
    COALESCE(pe.goals, 0)::int,
    COALESCE(pe.assists, 0)::int,
    COALESCE(pe.saves, 0)::int
  FROM player_events pe;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN QUERY SELECT v_match_id, v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
