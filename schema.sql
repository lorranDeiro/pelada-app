-- =====================================================================
-- PELADA APP — Supabase schema
-- 5v5, single-scorer, season-based ranking with MVP voting
-- =====================================================================

-- ---------- Extensions ----------
create extension if not exists "uuid-ossp";

-- ---------- Enums ----------
create type player_position as enum ('GOLEIRO_FIXO', 'JOGADOR');

create type event_type as enum (
  'GOAL',                   -- +5.0
  'ASSIST',                 -- +3.5
  'SAVE',                   -- +3.0 (goleiro ou jogador no turno de gol)
  'PENALTY_SAVE',           -- +5.0
  'TACKLE',                 -- +2.0
  'CREATION',               -- +1.0
  'MISTAKE_LEADING_GOAL',   -- -3.0
  'OWN_GOAL',               -- -4.0
  'GOAL_CONCEDED_GK'        -- -1.5 (automatico p/ quem estava no gol)
);

create type match_status as enum ('DRAFT', 'LIVE', 'FINISHED');

-- ---------- players ----------
create table players (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  position    player_position not null default 'JOGADOR',
  skill_level int  not null check (skill_level between 1 and 5),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create index idx_players_active on players(active) where active;

-- ---------- seasons ----------
create table seasons (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,                -- "2026/1"
  start_date date not null,
  end_date   date not null,
  active     boolean not null default false,
  created_at timestamptz not null default now()
);

-- garante no máximo uma temporada ativa
create unique index one_active_season on seasons(active) where active;

-- ---------- matches ----------
-- 1 partida por dia. Pontuação acumula por partida.
create table matches (
  id            uuid primary key default uuid_generate_v4(),
  season_id     uuid not null references seasons(id) on delete cascade,
  played_at     date not null,
  team_a_name   text not null default 'Brancos',
  team_b_name   text not null default 'Coloridos',
  score_a       int  not null default 0,
  score_b       int  not null default 0,
  status        match_status not null default 'DRAFT',
  mvp_player_id uuid references players(id) on delete set null,
  notes         text,
  created_at    timestamptz not null default now()
);

create index idx_matches_season on matches(season_id);
create index idx_matches_played_at on matches(played_at desc);

-- ---------- match_attendances ----------
-- quem apareceu e em qual time (1 = Brancos, 2 = Coloridos)
create table match_attendances (
  id         uuid primary key default uuid_generate_v4(),
  match_id   uuid not null references matches(id) on delete cascade,
  player_id  uuid not null references players(id) on delete restrict,
  team       int  not null check (team in (1, 2)),
  created_at timestamptz not null default now(),
  unique (match_id, player_id)
);

create index idx_attendances_match on match_attendances(match_id);

-- ---------- gk_shifts ----------
-- Rastreia quem estava no gol em cada momento. Revezamento orgânico:
-- quando o goleiro troca, encerra-se o shift anterior e abre-se um novo.
create table gk_shifts (
  id         uuid primary key default uuid_generate_v4(),
  match_id   uuid not null references matches(id) on delete cascade,
  team       int  not null check (team in (1, 2)),
  player_id  uuid not null references players(id) on delete restrict,
  started_at timestamptz not null default now(),
  ended_at   timestamptz
);

create index idx_gk_shifts_match on gk_shifts(match_id);
create index idx_gk_shifts_open on gk_shifts(match_id, team) where ended_at is null;

-- ---------- match_events ----------
-- O coração do sistema. Cada ação vira um evento com pontos já calculados.
create table match_events (
  id              uuid primary key default uuid_generate_v4(),
  match_id        uuid not null references matches(id) on delete cascade,
  player_id       uuid not null references players(id) on delete restrict,
  event_type      event_type not null,
  points          numeric(4,2) not null,
  in_gk_turn      boolean not null default false,
  event_timestamp timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create index idx_events_match on match_events(match_id);
create index idx_events_player on match_events(player_id);

-- ---------- player_match_results ----------
-- Linha-resumo por jogador por partida: soma dos eventos + vitória/empate/derrota
-- + nota da partida (6.0–10.0). Populada ao finalizar a partida.
create table player_match_results (
  id              uuid primary key default uuid_generate_v4(),
  match_id        uuid not null references matches(id) on delete cascade,
  player_id       uuid not null references players(id) on delete restrict,
  team            int  not null check (team in (1, 2)),
  outcome         text not null check (outcome in ('WIN','DRAW','LOSS')),
  outcome_points  numeric(4,2) not null,   -- +5 / +1.5 / -1
  event_points    numeric(5,2) not null,   -- soma de match_events
  mvp_bonus       numeric(4,2) not null default 0,  -- +4 se MVP
  total_points    numeric(5,2) not null,   -- outcome + event + mvp
  match_rating    numeric(3,1) not null,   -- 4.0..10.0
  goals           int not null default 0,
  assists         int not null default 0,
  saves           int not null default 0,
  created_at      timestamptz not null default now(),
  unique (match_id, player_id)
);

create index idx_pmr_player on player_match_results(player_id);
create index idx_pmr_match on player_match_results(match_id);

-- ---------- View: ranking da temporada ----------
create or replace view v_player_season_stats as
select
  p.id                      as player_id,
  p.name,
  p.position,
  m.season_id,
  count(distinct pmr.match_id)           as matches_played,
  coalesce(sum(pmr.total_points), 0)     as total_points,
  coalesce(avg(pmr.match_rating), 0)::numeric(3,1) as avg_rating,
  coalesce(sum(pmr.goals), 0)            as goals,
  coalesce(sum(pmr.assists), 0)          as assists,
  coalesce(sum(pmr.saves), 0)            as saves,
  count(*) filter (where pmr.outcome = 'WIN')  as wins,
  count(*) filter (where pmr.outcome = 'DRAW') as draws,
  count(*) filter (where pmr.outcome = 'LOSS') as losses,
  count(*) filter (where m.mvp_player_id = p.id) as mvp_count
from players p
left join player_match_results pmr on pmr.player_id = p.id
left join matches m                 on m.id = pmr.match_id
where p.active
group by p.id, p.name, p.position, m.season_id;

-- ---------- Row Level Security ----------
-- single-scorer: seu usuário autenticado tem acesso total.
alter table players               enable row level security;
alter table seasons               enable row level security;
alter table matches               enable row level security;
alter table match_attendances     enable row level security;
alter table gk_shifts             enable row level security;
alter table match_events          enable row level security;
alter table player_match_results  enable row level security;

-- Política simples: qualquer authenticated user pode tudo.
-- (Se quiser abrir leitura pública pro grupo ver o ranking, crie
-- políticas separadas de SELECT com `to anon` ou `to public`.)
do $$
declare t text;
begin
  for t in
    select unnest(array[
      'players','seasons','matches','match_attendances',
      'gk_shifts','match_events','player_match_results'
    ])
  loop
    execute format(
      'create policy "auth_all_%1$s" on %1$s for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;
