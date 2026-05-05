-- =====================================================================
-- Auth link: vincula auth.users a players via auth_user_id
-- =====================================================================
-- Rode UMA VEZ no Supabase SQL Editor APÓS schema-rls-hardening.sql.
-- Idempotente (IF NOT EXISTS / OR REPLACE).
--
-- Em vez de assumir players.id = auth.uid() (frágil — quebraria FKs
-- históricas de events/attendances/pmr), introduzimos uma coluna
-- canônica players.auth_user_id que aponta para auth.users(id).
--
-- O fluxo de registro fica:
--   1) Front chama RPC check_player_name_can_register(name)
--      → retorna true/false (anon-callable)
--   2) Se true, front faz supabase.auth.signUp(email, password)
--   3) Após session válida, front chama link_player_account(name)
--      → SECURITY DEFINER, vincula players.auth_user_id = auth.uid()
-- =====================================================================
--
-- ⚠️ Antes de testar o cadastro: confirme em Supabase Dashboard
--    > Auth > Providers > Email > "Confirm email" = OFF.
--    Se confirm-email estiver ON, signUp não cria session imediata e o
--    link_player_account vai falhar.
-- =====================================================================

-- 1) Coluna canônica + índice de unicidade
alter table players
  add column if not exists auth_user_id uuid
    references auth.users(id) on delete set null;

create unique index if not exists uniq_players_auth_user_id
  on players(auth_user_id) where auth_user_id is not null;

-- 2) Whitelist de UPDATE para authenticated (idempotente).
--    is_admin e auth_user_id ficam fora — só service_role e a RPC
--    SECURITY DEFINER abaixo conseguem mexer.
revoke update on players from authenticated;
grant  update (name, position, skill_level, active) on players to authenticated;

-- 3) is_current_user_admin agora consulta auth_user_id
create or replace function is_current_user_admin() returns boolean as $$
  select exists (
    select 1 from players
    where auth_user_id = auth.uid() and is_admin = true
  );
$$ language sql stable security definer;

-- 4) Pre-flight: nome está disponível para registro?
--    Anon-callable (chamada na tela de cadastro antes do signUp).
create or replace function check_player_name_can_register(p_name text)
returns boolean as $$
  select exists (
    select 1 from players
    where lower(name) = lower(trim(p_name))
      and active = true
      and auth_user_id is null
  );
$$ language sql stable security definer;

grant execute on function check_player_name_can_register(text) to anon, authenticated;

-- 5) Vincula auth.uid() ao players row pelo nome (chamada após signUp).
--    Idempotente: se já estiver linkado, retorna a row sem erro.
--    SECURITY DEFINER pra contornar a RLS de UPDATE em players.
--    NÃO toca em is_admin — registro comum não pode promover.
create or replace function link_player_account(p_player_name text)
returns players as $$
declare
  v_player players%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_player from players where auth_user_id = auth.uid();
  if found then
    return v_player;
  end if;

  select * into v_player
  from players
  where lower(name) = lower(trim(p_player_name))
    and active = true
    and auth_user_id is null
  limit 1;

  if not found then
    raise exception 'Seu nome não foi encontrado na lista de jogadores. Por favor, aguarde até que o administrador o adicione para realizar seu registro.';
  end if;

  update players
     set auth_user_id = auth.uid()
   where id = v_player.id
   returning * into v_player;

  return v_player;
end;
$$ language plpgsql security definer;

grant execute on function link_player_account(text) to authenticated;

-- =====================================================================
-- Backfill: depois de aplicar, vincule seu(s) admin(s) já existente(s):
--
--   UPDATE players
--      SET auth_user_id = (SELECT id FROM auth.users WHERE email = 'seu@email.com')
--    WHERE id = '<UUID do seu players.id>';
--
-- Para conferir:
--   SELECT p.name, p.is_admin, u.email
--     FROM players p LEFT JOIN auth.users u ON u.id = p.auth_user_id
--    WHERE p.is_admin = true;
-- =====================================================================
