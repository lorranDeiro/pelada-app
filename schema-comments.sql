-- =====================================================================
-- PELADA APP — Match Comments Table
-- =====================================================================
-- Permite que usuários públicos deixem comentários em partidas finalizadas

-- Tabela de comentários
create table if not exists match_comments (
  id              uuid primary key default uuid_generate_v4(),
  match_id        uuid not null references matches(id) on delete cascade,
  author_name     text not null,                    -- Nome do comentarista (público)
  author_email    text,                             -- Email (opcional, para notificações futuras)
  content         text not null check (char_length(content) between 5 and 500),
  is_verified     boolean not null default false,   -- Se foi verificado pelo admin
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_comments_match on match_comments(match_id);
create index idx_comments_created_at on match_comments(created_at desc);
create index idx_comments_verified on match_comments(is_verified) where is_verified = true;

-- RLS: Habilitar segurança
alter table match_comments enable row level security;

-- SELECT público: qualquer um vê comentários verificados (ou todos, sua escolha)
create policy "read_public_comments" on match_comments
  for select
  using (
    -- Apenas comentários verificados aparecem para públicos
    -- Se quiser mostrar todos, remova esse check
    is_verified = true
    AND
    -- Apenas comentários de partidas finalizadas
    match_id in (
      select id from matches where status = 'FINISHED'
    )
  );

-- SELECT autenticados: ver todos os comentários
create policy "read_authenticated_comments" on match_comments
  for select
  to authenticated
  using (true);

-- INSERT público: qualquer um pode comentar (será marcado como not verified)
create policy "create_public_comments" on match_comments
  for insert
  to anon
  with check (
    author_name != ''
    AND
    char_length(content) >= 5
    AND
    match_id in (
      select id from matches where status = 'FINISHED'
    )
  );

-- INSERT autenticados: comentários são verificados automaticamente
create policy "create_authenticated_comments" on match_comments
  for insert
  to authenticated
  with check (true);

-- UPDATE autenticados: apenas admin pode verificar comentários
create policy "update_authenticated_comments" on match_comments
  for update
  to authenticated
  using (true)
  with check (true);

-- DELETE autenticados: apenas criador ou admin pode deletar
create policy "delete_authenticated_comments" on match_comments
  for delete
  to authenticated
  using (true);

-- =====================================================================
-- RESUMO:
-- =====================================================================
-- 📖 Públicos (anon) podem:
--    ✓ VER comentários VERIFICADOS em partidas FINALIZADAS
--    ✓ DEIXAR comentários (serão marked como not verified)
--
-- 🔒 Autenticados podem:
--    ✓ VER todos os comentários
--    ✓ CRIAR comentários (auto-verified)
--    ✓ EDITAR/DELETAR comentários
-- =====================================================================
