-- =====================================================================
-- Imported season stats: tabela para dados históricos via CSV
-- =====================================================================
-- Rode UMA VEZ no Supabase SQL Editor.
--
-- A view v_player_season_stats agrega de player_match_results, que só tem
-- partidas reais lançadas no app. Para temporadas anteriores ao app, não
-- temos PMR — só o agregado vindo de uma planilha. Essa tabela guarda
-- esse agregado importado, e o ranking faz UNION das duas fontes.
--
-- Convenção: cada linha = um jogador em uma temporada. UNIQUE
-- (player_id, season_id) permite UPSERT na reimportação.
-- =====================================================================

create table if not exists player_season_stats (
  id              uuid primary key default uuid_generate_v4(),
  player_id       uuid not null references players(id) on delete cascade,
  season_id       uuid not null references seasons(id) on delete cascade,
  matches_played  int  not null default 0,
  goals           int  not null default 0,
  assists         int  not null default 0,
  saves           int  not null default 0,
  wins            int  not null default 0,
  draws           int  not null default 0,
  losses          int  not null default 0,
  total_points    numeric(7,2) not null default 0,
  avg_rating      numeric(3,1) not null default 0,
  mvp_count       int  not null default 0,
  imported_at     timestamptz not null default now(),
  unique (player_id, season_id)
);

create index if not exists idx_pss_player on player_season_stats(player_id);
create index if not exists idx_pss_season on player_season_stats(season_id);

-- RLS: leitura aberta pra autenticados, escrita só admin (igual o resto)
alter table player_season_stats enable row level security;

drop policy if exists "pss_read"  on player_season_stats;
drop policy if exists "pss_write" on player_season_stats;

create policy "pss_read"  on player_season_stats for select to authenticated using (true);
create policy "pss_write" on player_season_stats for all    to authenticated
  using (is_current_user_admin()) with check (is_current_user_admin());

-- Anon também precisa ler pro ranking público funcionar sem login
grant select on player_season_stats to anon;

-- =====================================================================
-- View unificada: v_player_season_stats_full
-- =====================================================================
-- Faz UNION da view auto-computada (partidas reais) com a tabela
-- importada. Quando há sobreposição (mesmo player_id+season_id), a
-- importada vence (admin é fonte da verdade pro histórico).
-- =====================================================================

create or replace view v_player_season_stats_full as
with imported as (
  select
    p.id as player_id,
    p.name,
    p.position,
    p.photo_url,
    pss.season_id,
    pss.matches_played,
    pss.total_points,
    pss.avg_rating,
    pss.goals,
    pss.assists,
    pss.saves,
    pss.wins,
    pss.draws,
    pss.losses,
    pss.mvp_count,
    -- Importado não calcula dynamic_rating; usamos o avg_rating direto
    pss.avg_rating::numeric(3,1) as dynamic_rating,
    'imported'::text as source
  from player_season_stats pss
  join players p on p.id = pss.player_id
  where p.active
),
computed as (
  select
    v.player_id,
    v.name,
    v.position,
    v.photo_url,
    v.season_id,
    v.matches_played,
    v.total_points,
    v.avg_rating,
    v.goals,
    v.assists,
    v.saves,
    v.wins,
    v.draws,
    v.losses,
    v.mvp_count,
    v.dynamic_rating,
    'computed'::text as source
  from v_player_season_stats v
  -- Excluí pares já presentes na importada (importada vence)
  where not exists (
    select 1 from imported i
    where i.player_id = v.player_id
      and (i.season_id = v.season_id or (i.season_id is null and v.season_id is null))
  )
)
select * from imported
union all
select * from computed;

-- Permissões
grant select on v_player_season_stats_full to anon, authenticated;
