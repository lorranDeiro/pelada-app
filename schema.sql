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
  'WINNING_GOAL',           -- +7.0 (Gol Decisivo - Fator Clutch)
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
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  position         player_position not null default 'JOGADOR',
  skill_level      int  not null check (skill_level between 1 and 5),
  is_admin         boolean not null default false,
  active           boolean not null default true,
  photo_url        text,
  photo_updated_at timestamptz,
  created_at       timestamptz not null default now()
);

create index idx_players_active on players(active) where active;
create index idx_players_admin on players(is_admin) where is_admin;

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
-- Ranking público filtra por season + status = FINISHED o tempo todo
create index idx_matches_season_status on matches(season_id, status) where status = 'FINISHED';

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
create index idx_attendances_player on match_attendances(player_id);

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
-- Lookups frequentes: eventos por tipo dentro da partida, e eventos
-- cronológicos do jogador
create index idx_events_match_type on match_events(match_id, event_type);
create index idx_events_player_time on match_events(player_id, event_timestamp desc);

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
with season_league_avg as (
  -- Calcula a média de pontos por partida para cada temporada
  select
    m.season_id,
    avg(pmr.total_points)::numeric as league_avg_points
  from player_match_results pmr
  join matches m on m.id = pmr.match_id
  group by m.season_id
)
select
  p.id                      as player_id,
  p.name,
  p.position,
  p.photo_url,
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
  count(*) filter (where m.mvp_player_id = p.id) as mvp_count,
  -- Dynamic rating calculation (0.0–5.0 scale)
  -- Anchored on the player's average match rating (already 0–5),
  -- then nudged by league-relative performance, experience, and MVPs.
  (case
     when count(distinct pmr.match_id) = 0 then 0.0::numeric
     else greatest(
       0.0::numeric,
       least(
         5.0::numeric,
         (
           coalesce(avg(pmr.match_rating), 0)::numeric
           + ((coalesce(avg(pmr.total_points), 0) - coalesce(season_league_avg.league_avg_points, 0)) * 0.05::numeric)
           + least((count(distinct pmr.match_id)::numeric / 20), 0.5::numeric)
           + least((count(*) filter (where m.mvp_player_id = p.id)::numeric * 0.15::numeric), 0.5::numeric)
         )
       )
     )
   end)::numeric(3,1) as dynamic_rating
from players p
left join player_match_results pmr on pmr.player_id = p.id
left join matches m                 on m.id = pmr.match_id
left join season_league_avg         on season_league_avg.season_id = m.season_id
where p.active
group by p.id, p.name, p.position, p.photo_url, m.season_id, season_league_avg.league_avg_points;

-- ---------- match_edit_log ----------
-- Audit trail para mudanças em partidas finalizadas
create table match_edit_log (
  id              uuid primary key default uuid_generate_v4(),
  match_id        uuid not null references matches(id) on delete cascade,
  admin_id        uuid,  -- user_id do admin que editou
  action          text not null,  -- 'score_changed', 'mvp_changed', 'event_added', 'event_removed'
  payload_before  jsonb,
  payload_after   jsonb,
  created_at      timestamptz not null default now()
);

create index idx_edit_log_match on match_edit_log(match_id);
create index idx_edit_log_admin on match_edit_log(admin_id);

-- ---------- mvp_votes ----------
-- Sistema de votação: janela de 5 minutos após match FINISHED
-- 1 voto por user por match (último voto sobrescreve)
create table mvp_votes (
  id              uuid primary key default uuid_generate_v4(),
  match_id        uuid not null references matches(id) on delete cascade,
  voting_user_id  uuid not null,  -- user_id do votante (via Supabase auth)
  vote_player_id  uuid not null references players(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique(match_id, voting_user_id)  -- 1 voto por user por match
);

create index idx_mvp_votes_match on mvp_votes(match_id);
create index idx_mvp_votes_user on mvp_votes(voting_user_id);

-- ---------- Row Level Security ----------
-- single-scorer: seu usuário autenticado tem acesso total.
alter table players               enable row level security;
alter table seasons               enable row level security;
alter table matches               enable row level security;
alter table match_attendances     enable row level security;
alter table gk_shifts             enable row level security;
alter table match_events          enable row level security;
alter table player_match_results  enable row level security;
alter table match_edit_log        enable row level security;
alter table mvp_votes             enable row level security;

-- Políticas granulares para multi-admin.
-- Princípio: leitura autenticada ampla; escrita restrita a admin; dados
-- de voto/auditoria são pessoais e append-only.

-- Helper: é admin?
create or replace function is_current_user_admin() returns boolean as $$
  select exists (
    select 1 from players
    where id = auth.uid() and is_admin = true
  );
$$ language sql stable security definer;

-- ----- players -----
create policy "players_read"   on players for select to authenticated using (true);
create policy "players_insert" on players for insert to authenticated
  with check (is_current_user_admin());
create policy "players_update" on players for update to authenticated
  using (is_current_user_admin()) with check (true);
create policy "players_delete" on players for delete to authenticated
  using (is_current_user_admin());

-- Blindagem contra auto-promoção: is_admin só pode ser alterado via
-- service_role (SQL editor, migrações). PostgREST (JS client) fica barrado.
revoke update on players from authenticated;
grant  update (name, position, skill_level, active) on players to authenticated;

-- ----- seasons -----
create policy "seasons_read"  on seasons for select to authenticated using (true);
create policy "seasons_write" on seasons for all    to authenticated
  using (is_current_user_admin()) with check (is_current_user_admin());

-- ----- matches -----
create policy "matches_read"   on matches for select to authenticated using (true);
create policy "matches_insert" on matches for insert to authenticated
  with check (is_current_user_admin());
create policy "matches_update" on matches for update to authenticated
  using (is_current_user_admin()) with check (true);
create policy "matches_delete" on matches for delete to authenticated
  using (is_current_user_admin());

-- ----- match_attendances -----
create policy "attendances_read"  on match_attendances for select to authenticated using (true);
create policy "attendances_write" on match_attendances for all    to authenticated
  using (is_current_user_admin()) with check (is_current_user_admin());

-- ----- gk_shifts -----
create policy "gk_shifts_read"  on gk_shifts for select to authenticated using (true);
create policy "gk_shifts_write" on gk_shifts for all    to authenticated
  using (is_current_user_admin()) with check (is_current_user_admin());

-- ----- match_events -----
create policy "events_read"  on match_events for select to authenticated using (true);
create policy "events_write" on match_events for all    to authenticated
  using (is_current_user_admin()) with check (is_current_user_admin());

-- ----- player_match_results -----
create policy "pmr_read"  on player_match_results for select to authenticated using (true);
create policy "pmr_write" on player_match_results for all    to authenticated
  using (is_current_user_admin()) with check (is_current_user_admin());

-- ----- match_edit_log -----
-- Admin lê, admin insere como si mesmo. Ninguém atualiza ou deleta.
create policy "edit_log_read"   on match_edit_log for select to authenticated
  using (is_current_user_admin());
create policy "edit_log_insert" on match_edit_log for insert to authenticated
  with check (is_current_user_admin() and admin_id = auth.uid());

-- ----- mvp_votes -----
-- Qualquer autenticado lê (pros resultados serem públicos para o grupo),
-- mas cada um só escreve o próprio voto.
create policy "mvp_votes_read"   on mvp_votes for select to authenticated using (true);
create policy "mvp_votes_insert" on mvp_votes for insert to authenticated
  with check (voting_user_id = auth.uid());
create policy "mvp_votes_update" on mvp_votes for update to authenticated
  using (voting_user_id = auth.uid()) with check (voting_user_id = auth.uid());
create policy "mvp_votes_delete" on mvp_votes for delete to authenticated
  using (voting_user_id = auth.uid());

-- ---------- HELPER FUNCTIONS ----------

-- Recalcula player_match_results para uma partida (usado après edit)
-- Deleta PMR antigas e insere novas baseado em match_events
create or replace function recompute_match_results(p_match_id uuid)
returns table(match_id uuid, updated_count int) as $$
declare
  v_match_id uuid := p_match_id;
  v_season_id uuid;
  v_score_a int;
  v_score_b int;
  v_mvp_player_id uuid;
  v_team_a_players uuid[];
  v_team_b_players uuid[];
  v_updated_count int := 0;
begin
  -- Fetch match details
  select m.season_id, m.score_a, m.score_b, m.mvp_player_id
  into v_season_id, v_score_a, v_score_b, v_mvp_player_id
  from matches m
  where m.id = v_match_id;

  if v_season_id is null then
    raise exception 'Match not found: %', v_match_id;
  end if;

  -- Delete existing player_match_results for this match
  delete from player_match_results where match_id = v_match_id;
  
  -- Re-insert player_match_results based on match_events
  -- (This is a simplified version — in production, you'd use the buildPlayerMatchResult logic)
  with team_players as (
    select
      ma.player_id,
      ma.team,
      ma.match_id
    from match_attendances ma
    where ma.match_id = v_match_id
  ),
  player_events as (
    select
      tp.player_id,
      tp.team,
      sum(me.points) as event_points,
      count(*) filter (where me.event_type in ('GOAL', 'WINNING_GOAL')) as goals,
      count(*) filter (where me.event_type = 'ASSIST') as assists,
      count(*) filter (where me.event_type in ('SAVE', 'PENALTY_SAVE')) as saves
    from team_players tp
    left join match_events me on me.player_id = tp.player_id and me.match_id = tp.match_id
    group by tp.player_id, tp.team
  )
  insert into player_match_results (
    match_id, player_id, team, outcome, outcome_points,
    event_points, mvp_bonus, total_points, match_rating,
    goals, assists, saves
  )
  select
    v_match_id,
    pe.player_id,
    pe.team,
    case
      when v_score_a = v_score_b then 'DRAW'::text
      when (pe.team = 1 and v_score_a > v_score_b) or (pe.team = 2 and v_score_b > v_score_a) then 'WIN'::text
      else 'LOSS'::text
    end as outcome,
    case
      when v_score_a = v_score_b then 1.5::numeric
      when (pe.team = 1 and v_score_a > v_score_b) or (pe.team = 2 and v_score_b > v_score_a) then 5.0::numeric
      else -1.0::numeric
    end as outcome_points,
    coalesce(pe.event_points, 0)::numeric(5,2) as event_points,
    case when v_mvp_player_id = pe.player_id then 4.0::numeric else 0::numeric end as mvp_bonus,
    (
      case
        when v_score_a = v_score_b then 1.5::numeric
        when (pe.team = 1 and v_score_a > v_score_b) or (pe.team = 2 and v_score_b > v_score_a) then 5.0::numeric
        else -1.0::numeric
      end
      + coalesce(pe.event_points, 0)::numeric
      + case when v_mvp_player_id = pe.player_id then 4.0::numeric else 0::numeric end
    )::numeric(5,2) as total_points,
    greatest(0.0::numeric, least(5.0::numeric,
      (
        case
          when v_score_a = v_score_b then 1.5::numeric
          when (pe.team = 1 and v_score_a > v_score_b) or (pe.team = 2 and v_score_b > v_score_a) then 5.0::numeric
          else -1.0::numeric
        end
        + coalesce(pe.event_points, 0)::numeric
        + case when v_mvp_player_id = pe.player_id then 4.0::numeric else 0::numeric end
      ) * 0.2::numeric
    )) as match_rating,
    coalesce(pe.goals, 0)::int,
    coalesce(pe.assists, 0)::int,
    coalesce(pe.saves, 0)::int
  from player_events pe;

  get diagnostics v_updated_count = row_count;

  return query select v_match_id, v_updated_count;
end;
$$ language plpgsql;

