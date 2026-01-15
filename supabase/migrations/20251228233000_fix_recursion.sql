-- Fix recursion in RLS policies by breaking the loop between locations and assignments

-- Helper: Check if user owns the location's account (Bypasses RLS due to security definer)
create or replace function kit.is_location_owner(location_id uuid) returns boolean
    language sql
    security definer
    stable
    set search_path = ''
as $$
    select exists (
        select 1 from public.locations l
        join public.memberships m on m.account_id = l.account_id
        where l.id = $1
          and m.user_id = auth.uid()
          and m.role = 'owner'
    );
$$;

grant execute on function kit.is_location_owner to authenticated, service_role;

-- Drop the problematice recursive policy
drop policy "Assignments Manageable by Admin or Owner" on public.location_assignments;

-- Recreate it using the safe function
create policy "Assignments Manageable by Admin or Owner"
    on public.location_assignments
    for all
    to authenticated
    using (
        kit.is_super_admin() OR
        kit.is_location_owner(location_id)
    );
