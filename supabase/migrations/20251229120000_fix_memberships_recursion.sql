
-- Fix infinite recursion in memberships policy
-- The issue is that the policy "Members can view other members of the same account" queries public.memberships directly,
-- which triggers the policy again, leading to infinite recursion.

-- 1. Create a security definer function to get the current user's account IDs.
-- This bypasses RLS, safely returning the account IDs the user belongs to.
create or replace function kit.get_user_account_ids()
returns setof uuid
language sql
security definer
stable
set search_path = ''
as $$
    select account_id from public.memberships
    where user_id = auth.uid();
$$;

-- Grant execute permission to authenticated users
grant execute on function kit.get_user_account_ids to authenticated, service_role;

-- 2. Drop the recursive policy
drop policy if exists "Members can view other members of the same account" on public.memberships;

-- 3. Re-create the policy using the security definer function
create policy "Members can view other members of the same account"
    on public.memberships
    for select
    to authenticated
    using (
        kit.is_super_admin() OR
        account_id in (
            select kit.get_user_account_ids()
        )
    );
