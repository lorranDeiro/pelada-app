-- =====================================================================
-- Player photos — coluna photo_url + bucket Storage + policies
-- Rode após criar o bucket "player-photos" no Dashboard (Storage → New bucket,
-- public = true, allowed MIME = image/jpeg,image/png,image/webp, file size = 2MB).
-- =====================================================================

-- 1) Coluna na tabela players
ALTER TABLE players ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE players ADD COLUMN IF NOT EXISTS photo_updated_at timestamptz;

-- 2) Recriar a view v_player_season_stats incluindo p.photo_url
CREATE OR REPLACE VIEW v_player_season_stats AS
WITH season_league_avg AS (
  SELECT
    m.season_id,
    AVG(pmr.total_points)::numeric AS league_avg_points
  FROM player_match_results pmr
  JOIN matches m ON m.id = pmr.match_id
  GROUP BY m.season_id
)
SELECT
  p.id                                            AS player_id,
  p.name,
  p.position,
  p.photo_url,
  m.season_id,
  COUNT(DISTINCT pmr.match_id)                    AS matches_played,
  COALESCE(SUM(pmr.total_points), 0)              AS total_points,
  COALESCE(AVG(pmr.match_rating), 0)::numeric(3,1) AS avg_rating,
  COALESCE(SUM(pmr.goals), 0)                     AS goals,
  COALESCE(SUM(pmr.assists), 0)                   AS assists,
  COALESCE(SUM(pmr.saves), 0)                     AS saves,
  COUNT(*) FILTER (WHERE pmr.outcome = 'WIN')     AS wins,
  COUNT(*) FILTER (WHERE pmr.outcome = 'DRAW')    AS draws,
  COUNT(*) FILTER (WHERE pmr.outcome = 'LOSS')    AS losses,
  COUNT(*) FILTER (WHERE m.mvp_player_id = p.id)  AS mvp_count,
  (CASE
     WHEN COUNT(DISTINCT pmr.match_id) = 0 THEN 0.0::numeric
     ELSE GREATEST(
       0.0::numeric,
       LEAST(
         5.0::numeric,
         (
           COALESCE(AVG(pmr.match_rating), 0)::numeric
           + ((COALESCE(AVG(pmr.total_points), 0) - COALESCE(season_league_avg.league_avg_points, 0)) * 0.05::numeric)
           + LEAST((COUNT(DISTINCT pmr.match_id)::numeric / 20), 0.5::numeric)
           + LEAST((COUNT(*) FILTER (WHERE m.mvp_player_id = p.id)::numeric * 0.15::numeric), 0.5::numeric)
         )
       )
     )
   END)::numeric(3,1) AS dynamic_rating
FROM players p
LEFT JOIN player_match_results pmr ON pmr.player_id = p.id
LEFT JOIN matches m                 ON m.id = pmr.match_id
LEFT JOIN season_league_avg         ON season_league_avg.season_id = m.season_id
WHERE p.active
GROUP BY p.id, p.name, p.position, p.photo_url, m.season_id, season_league_avg.league_avg_points;

-- 3) Também libera photo_url e photo_updated_at no GRANT de update p/ PostgREST
--    (depois do hardening, authenticated só tem UPDATE nas colunas listadas)
GRANT UPDATE (name, position, skill_level, active, photo_url, photo_updated_at)
  ON players TO authenticated;

-- 4) Policies do bucket player-photos
--    Leitura pública já vem do bucket "public = true" — não precisa de policy de SELECT.

DROP POLICY IF EXISTS "player_photos_upload_admin" ON storage.objects;
DROP POLICY IF EXISTS "player_photos_update_admin" ON storage.objects;
DROP POLICY IF EXISTS "player_photos_delete_admin" ON storage.objects;

CREATE POLICY "player_photos_upload_admin" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'player-photos'
    AND is_current_user_admin()
  );

CREATE POLICY "player_photos_update_admin" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'player-photos'
    AND is_current_user_admin()
  );

CREATE POLICY "player_photos_delete_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'player-photos'
    AND is_current_user_admin()
  );
