-- =====================================================================
-- Migration: Rename historical "Brancos" team to "Escuros"
-- =====================================================================
-- Run once on the live database. Safe to re-run (idempotent).

update matches
   set team_a_name = 'Escuros'
 where team_a_name = 'Brancos';

alter table matches
  alter column team_a_name set default 'Escuros';
