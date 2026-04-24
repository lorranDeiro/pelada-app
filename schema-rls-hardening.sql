-- =====================================================================
-- RLS hardening + performance indexes
-- Rode este arquivo UMA VEZ no Supabase SQL Editor.
-- É idempotente (usa IF NOT EXISTS / DROP POLICY IF EXISTS).
-- =====================================================================

-- -------------------------------------------------------------------
-- 0) Pré-requisitos — colunas e tabelas que podem não ter sido
--    aplicadas em bancos antigos (o CREATE TABLE original em schema.sql
--    já incluía estas, mas bancos pré-existentes não ganharam via ALTER).
-- -------------------------------------------------------------------
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_players_admin
  ON players(is_admin) WHERE is_admin;

CREATE TABLE IF NOT EXISTS match_edit_log (
  id              uuid primary key default uuid_generate_v4(),
  match_id        uuid not null references matches(id) on delete cascade,
  admin_id        uuid,
  action          text not null,
  payload_before  jsonb,
  payload_after   jsonb,
  created_at      timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS idx_edit_log_match ON match_edit_log(match_id);
CREATE INDEX IF NOT EXISTS idx_edit_log_admin ON match_edit_log(admin_id);
ALTER TABLE match_edit_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS mvp_votes (
  id              uuid primary key default uuid_generate_v4(),
  match_id        uuid not null references matches(id) on delete cascade,
  voting_user_id  uuid not null,
  vote_player_id  uuid not null references players(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique(match_id, voting_user_id)
);
CREATE INDEX IF NOT EXISTS idx_mvp_votes_match ON mvp_votes(match_id);
CREATE INDEX IF NOT EXISTS idx_mvp_votes_user  ON mvp_votes(voting_user_id);
ALTER TABLE mvp_votes ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------
-- 1) Novos índices
-- -------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_events_match_type
  ON match_events(match_id, event_type);

CREATE INDEX IF NOT EXISTS idx_events_player_time
  ON match_events(player_id, event_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_matches_season_status
  ON matches(season_id, status)
  WHERE status = 'FINISHED';

CREATE INDEX IF NOT EXISTS idx_attendances_player
  ON match_attendances(player_id);

-- -------------------------------------------------------------------
-- 2) Helper function: é admin?
-- -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_current_user_admin() RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM players
    WHERE id = auth.uid() AND is_admin = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- -------------------------------------------------------------------
-- 3) Drop das políticas antigas blanket
-- -------------------------------------------------------------------
DROP POLICY IF EXISTS "auth_all_players"               ON players;
DROP POLICY IF EXISTS "auth_all_seasons"               ON seasons;
DROP POLICY IF EXISTS "auth_all_matches"               ON matches;
DROP POLICY IF EXISTS "auth_all_match_attendances"     ON match_attendances;
DROP POLICY IF EXISTS "auth_all_gk_shifts"             ON gk_shifts;
DROP POLICY IF EXISTS "auth_all_match_events"          ON match_events;
DROP POLICY IF EXISTS "auth_all_player_match_results"  ON player_match_results;
DROP POLICY IF EXISTS "auth_all_match_edit_log"        ON match_edit_log;
DROP POLICY IF EXISTS "auth_all_mvp_votes"             ON mvp_votes;
DROP POLICY IF EXISTS "admin_update_finished_match"    ON matches;

-- -------------------------------------------------------------------
-- 4) players — leitura livre, escrita só admin; is_admin blindado
-- -------------------------------------------------------------------
DROP POLICY IF EXISTS "players_read"   ON players;
DROP POLICY IF EXISTS "players_insert" ON players;
DROP POLICY IF EXISTS "players_update" ON players;
DROP POLICY IF EXISTS "players_delete" ON players;

CREATE POLICY "players_read"   ON players FOR SELECT TO authenticated USING (true);
CREATE POLICY "players_insert" ON players FOR INSERT TO authenticated
  WITH CHECK (is_current_user_admin());
CREATE POLICY "players_update" ON players FOR UPDATE TO authenticated
  USING (is_current_user_admin()) WITH CHECK (true);
CREATE POLICY "players_delete" ON players FOR DELETE TO authenticated
  USING (is_current_user_admin());

-- PostgREST (JS client) NÃO pode mexer em is_admin.
-- Só service_role (Supabase Studio / migrações) consegue.
REVOKE UPDATE ON players FROM authenticated;
GRANT  UPDATE (name, position, skill_level, active) ON players TO authenticated;

-- -------------------------------------------------------------------
-- 5) seasons, matches, attendances, gk_shifts, events, pmr
--    Leitura aberta p/ autenticados; escrita só admin
-- -------------------------------------------------------------------
DROP POLICY IF EXISTS "seasons_read"  ON seasons;
DROP POLICY IF EXISTS "seasons_write" ON seasons;
CREATE POLICY "seasons_read"  ON seasons FOR SELECT TO authenticated USING (true);
CREATE POLICY "seasons_write" ON seasons FOR ALL    TO authenticated
  USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());

DROP POLICY IF EXISTS "matches_read"   ON matches;
DROP POLICY IF EXISTS "matches_insert" ON matches;
DROP POLICY IF EXISTS "matches_update" ON matches;
DROP POLICY IF EXISTS "matches_delete" ON matches;
CREATE POLICY "matches_read"   ON matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "matches_insert" ON matches FOR INSERT TO authenticated
  WITH CHECK (is_current_user_admin());
CREATE POLICY "matches_update" ON matches FOR UPDATE TO authenticated
  USING (is_current_user_admin()) WITH CHECK (true);
CREATE POLICY "matches_delete" ON matches FOR DELETE TO authenticated
  USING (is_current_user_admin());

DROP POLICY IF EXISTS "attendances_read"  ON match_attendances;
DROP POLICY IF EXISTS "attendances_write" ON match_attendances;
CREATE POLICY "attendances_read"  ON match_attendances FOR SELECT TO authenticated USING (true);
CREATE POLICY "attendances_write" ON match_attendances FOR ALL    TO authenticated
  USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());

DROP POLICY IF EXISTS "gk_shifts_read"  ON gk_shifts;
DROP POLICY IF EXISTS "gk_shifts_write" ON gk_shifts;
CREATE POLICY "gk_shifts_read"  ON gk_shifts FOR SELECT TO authenticated USING (true);
CREATE POLICY "gk_shifts_write" ON gk_shifts FOR ALL    TO authenticated
  USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());

DROP POLICY IF EXISTS "events_read"  ON match_events;
DROP POLICY IF EXISTS "events_write" ON match_events;
CREATE POLICY "events_read"  ON match_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "events_write" ON match_events FOR ALL    TO authenticated
  USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());

DROP POLICY IF EXISTS "pmr_read"  ON player_match_results;
DROP POLICY IF EXISTS "pmr_write" ON player_match_results;
CREATE POLICY "pmr_read"  ON player_match_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "pmr_write" ON player_match_results FOR ALL    TO authenticated
  USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());

-- -------------------------------------------------------------------
-- 6) match_edit_log — admin lê, admin insere como si mesmo, nada mais
-- -------------------------------------------------------------------
DROP POLICY IF EXISTS "edit_log_read"   ON match_edit_log;
DROP POLICY IF EXISTS "edit_log_insert" ON match_edit_log;
CREATE POLICY "edit_log_read"   ON match_edit_log FOR SELECT TO authenticated
  USING (is_current_user_admin());
CREATE POLICY "edit_log_insert" ON match_edit_log FOR INSERT TO authenticated
  WITH CHECK (is_current_user_admin() AND admin_id = auth.uid());

-- -------------------------------------------------------------------
-- 7) mvp_votes — cada um só mexe no próprio voto
-- -------------------------------------------------------------------
DROP POLICY IF EXISTS "mvp_votes_read"   ON mvp_votes;
DROP POLICY IF EXISTS "mvp_votes_insert" ON mvp_votes;
DROP POLICY IF EXISTS "mvp_votes_update" ON mvp_votes;
DROP POLICY IF EXISTS "mvp_votes_delete" ON mvp_votes;
CREATE POLICY "mvp_votes_read"   ON mvp_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "mvp_votes_insert" ON mvp_votes FOR INSERT TO authenticated
  WITH CHECK (voting_user_id = auth.uid());
CREATE POLICY "mvp_votes_update" ON mvp_votes FOR UPDATE TO authenticated
  USING (voting_user_id = auth.uid()) WITH CHECK (voting_user_id = auth.uid());
CREATE POLICY "mvp_votes_delete" ON mvp_votes FOR DELETE TO authenticated
  USING (voting_user_id = auth.uid());

-- -------------------------------------------------------------------
-- 8) ATENÇÃO: promova-se a admin
-- -------------------------------------------------------------------
-- Se a coluna is_admin foi criada agora, todos jogadores estão com
-- is_admin = false (default). Descomente a linha abaixo e troque o
-- UUID pelo seu (o mesmo id do seu registro em auth.users E em players
-- — se a convenção do app for players.id = auth.uid()).
--
--   UPDATE players SET is_admin = true WHERE id = 'SEU_UUID_AQUI';
--
-- Para descobrir seu auth user id:
--   SELECT id, email FROM auth.users WHERE email = 'seu@email.com';

-- -------------------------------------------------------------------
-- Verificação: lista políticas ativas por tabela
-- -------------------------------------------------------------------
-- SELECT schemaname, tablename, policyname FROM pg_policies
-- WHERE schemaname = 'public' ORDER BY tablename, policyname;
