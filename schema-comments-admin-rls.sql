-- =====================================================================
-- PELADA APP — RLS Policies for Admin Comments Management
-- =====================================================================
-- Execute these policies in your Supabase SQL Editor after schema-comments.sql

-- Note: The existing RLS policies in schema-comments.sql should already handle:
-- - Public read: Only verified comments on finished matches
-- - Public insert: Create comments (not verified by default)
-- - Authenticated read: All comments visible to logged-in users
-- - Authenticated update/delete: Can manage comments

-- If you need to add an admin-specific role (recommended for security):
-- 1. Create a custom role in auth.users or use a admin flag in your users table
-- 2. Modify the policies below to restrict to admin role only

-- Example: If you have an 'is_admin' column in users table
-- You would need to join match_comments with a users table

-- For now, authenticated users can manage all comments
-- To restrict to admin only, modify existing policies:

-- UPDATE to admin only example (if you have users.is_admin):
/*
drop policy if exists "update_authenticated_comments" on match_comments;
create policy "update_authenticated_comments" on match_comments
  for update
  to authenticated
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.user_metadata->>'is_admin' = 'true'
    )
  )
  with check (true);
*/

-- DELETE to admin only example:
/*
drop policy if exists "delete_authenticated_comments" on match_comments;
create policy "delete_authenticated_comments" on match_comments
  for delete
  to authenticated
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.user_metadata->>'is_admin' = 'true'
    )
  );
*/

-- =====================================================================
-- IMPORTANT: Admin Access Control Strategy
-- =====================================================================
-- Option 1: Set is_admin in user metadata during signup
--   - In your NextJS auth handler, set: user_metadata: { is_admin: true }
--   - Then use the policies above

-- Option 2: Create a separate 'admins' table
--   - CREATE TABLE admins (user_id uuid PRIMARY KEY REFERENCES auth.users);
--   - Check membership in policy: WHERE EXISTS (SELECT 1 FROM admins ...)

-- Option 3: Use Supabase custom claims
--   - Set claims via JWT or custom auth function
--   - Reference in policies via auth.jwt()

-- For production, we recommend Option 1 or 2 for simplicity
