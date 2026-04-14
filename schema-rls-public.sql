-- =====================================================================
-- PELADA APP — RLS Policies for Public Ranking & History Access
-- =====================================================================
-- Este script permite que QUALQUER PESSOA veja:
--   • Ranking da temporada (players + stats)
--   • Histórico de partidas
--   • Detalhes de eventos das partidas
-- Mas SÓ USUÁRIOS AUTENTICADOS podem criar/editar/deletar.
-- =====================================================================

-- =====================================================================
-- 1. PLAYERS — Públicos (leitura), autenticados (escrita)
-- =====================================================================

-- Remover política antiga (se existir)
drop policy if exists "auth_all_players" on players;

-- SELECT público: qualquer um pode ver jogadores
create policy "read_public_players" on players
  for select
  using (active = true);  -- Só mostra jogadores ativos

-- Inserção/atualização/deletação: apenas autenticados
create policy "write_authenticated_players" on players
  for insert
  to authenticated
  with check (true);

create policy "update_authenticated_players" on players
  for update
  to authenticated
  using (true)
  with check (true);

create policy "delete_authenticated_players" on players
  for delete
  to authenticated
  using (true);

-- =====================================================================
-- 2. SEASONS — Públicas (leitura), autenticadas (escrita)
-- =====================================================================

drop policy if exists "auth_all_seasons" on seasons;

-- SELECT público: ver temporadas ativas
create policy "read_public_seasons" on seasons
  for select
  using (active = true);

-- Operações de escrita: autenticados
create policy "write_authenticated_seasons" on seasons
  for insert
  to authenticated
  with check (true);

create policy "update_authenticated_seasons" on seasons
  for update
  to authenticated
  using (true)
  with check (true);

create policy "delete_authenticated_seasons" on seasons
  for delete
  to authenticated
  using (true);

-- =====================================================================
-- 3. MATCHES — Públicas (leitura), autenticadas (escrita)
-- =====================================================================

drop policy if exists "auth_all_matches" on matches;

-- SELECT público: ver partidas finalizadas
create policy "read_public_matches" on matches
  for select
  using (status = 'FINISHED');

-- SELECT autenticados: ver todas as partidas
create policy "read_authenticated_matches" on matches
  for select
  to authenticated
  using (true);

-- Operações de escrita: autenticados
create policy "write_authenticated_matches" on matches
  for insert
  to authenticated
  with check (true);

create policy "update_authenticated_matches" on matches
  for update
  to authenticated
  using (true)
  with check (true);

create policy "delete_authenticated_matches" on matches
  for delete
  to authenticated
  using (true);

-- =====================================================================
-- 4. MATCH_ATTENDANCES — Públicas (leitura), autenticadas (escrita)
-- =====================================================================

drop policy if exists "auth_all_match_attendances" on match_attendances;

-- SELECT público: ver quem jogou (apenas partidas finalizadas)
create policy "read_public_attendances" on match_attendances
  for select
  using (
    match_id in (
      select id from matches where status = 'FINISHED'
    )
  );

-- SELECT autenticados: ver todas as participações
create policy "read_authenticated_attendances" on match_attendances
  for select
  to authenticated
  using (true);

-- Operações de escrita: autenticados
create policy "write_authenticated_attendances" on match_attendances
  for insert
  to authenticated
  with check (true);

create policy "update_authenticated_attendances" on match_attendances
  for update
  to authenticated
  using (true)
  with check (true);

create policy "delete_authenticated_attendances" on match_attendances
  for delete
  to authenticated
  using (true);

-- =====================================================================
-- 5. GK_SHIFTS — Públicas (leitura), autenticadas (escrita)
-- =====================================================================

drop policy if exists "auth_all_gk_shifts" on gk_shifts;

-- SELECT público: ver goleiros (apenas partidas finalizadas)
create policy "read_public_gk_shifts" on gk_shifts
  for select
  using (
    match_id in (
      select id from matches where status = 'FINISHED'
    )
  );

-- SELECT autenticados: ver todos
create policy "read_authenticated_gk_shifts" on gk_shifts
  for select
  to authenticated
  using (true);

-- Operações de escrita: autenticados
create policy "write_authenticated_gk_shifts" on gk_shifts
  for insert
  to authenticated
  with check (true);

create policy "update_authenticated_gk_shifts" on gk_shifts
  for update
  to authenticated
  using (true)
  with check (true);

create policy "delete_authenticated_gk_shifts" on gk_shifts
  for delete
  to authenticated
  using (true);

-- =====================================================================
-- 6. MATCH_EVENTS — Públicas (leitura), autenticadas (escrita)
-- =====================================================================

drop policy if exists "auth_all_match_events" on match_events;

-- SELECT público: ver eventos (apenas partidas finalizadas)
create policy "read_public_match_events" on match_events
  for select
  using (
    match_id in (
      select id from matches where status = 'FINISHED'
    )
  );

-- SELECT autenticados: ver todos
create policy "read_authenticated_match_events" on match_events
  for select
  to authenticated
  using (true);

-- Operações de escrita: autenticados
create policy "write_authenticated_match_events" on match_events
  for insert
  to authenticated
  with check (true);

create policy "update_authenticated_match_events" on match_events
  for update
  to authenticated
  using (true)
  with check (true);

create policy "delete_authenticated_match_events" on match_events
  for delete
  to authenticated
  using (true);

-- =====================================================================
-- 7. PLAYER_MATCH_RESULTS — Públicas (leitura), autenticadas (escrita)
-- =====================================================================

drop policy if exists "auth_all_player_match_results" on player_match_results;

-- SELECT público: ver resultados (apenas partidas finalizadas)
create policy "read_public_pmr" on player_match_results
  for select
  using (
    match_id in (
      select id from matches where status = 'FINISHED'
    )
  );

-- SELECT autenticados: ver todos
create policy "read_authenticated_pmr" on player_match_results
  for select
  to authenticated
  using (true);

-- Operações de escrita: autenticados
create policy "write_authenticated_pmr" on player_match_results
  for insert
  to authenticated
  with check (true);

create policy "update_authenticated_pmr" on player_match_results
  for update
  to authenticated
  using (true)
  with check (true);

create policy "delete_authenticated_pmr" on player_match_results
  for delete
  to authenticated
  using (true);

-- =====================================================================
-- 8. Grant Permissions on Views (v_player_season_stats)
-- =====================================================================
-- A view usa dados das tabelas com RLS, então herdará as restrições.
-- Grant explícito para garantir:

grant select on public.v_player_season_stats to anon, authenticated, public;

-- =====================================================================
-- RESUMO DAS POLÍTICAS:
-- =====================================================================
-- 📖 Públicos (não autenticados) podem:
--    ✓ SELECT em dados de partidas FINALIZADAS
--    ✓ Ver histórico completo
--    ✓ Ver ranking (via view)
--
-- 🔒 Apenas AUTENTICADOS podem:
--    ✓ Ver dados em DRAFT / LIVE
--    ✓ Criar, atualizar, deletar qualquer coisa
--
-- ✅ A segurança está mantida:
--    • Dados sensíveis (em progresso) não são exibidos
--    • Apenas jogadores ativos aparecem
--    • Histórico é imutável para públicos
-- =====================================================================
