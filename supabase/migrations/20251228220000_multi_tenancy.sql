/*
 * Multi-Tenancy Migration
 * Implements Super Admin, Organizations, Locations, and Review Requests.
 */

-- 1. Super Admins
create table if not exists public.super_admins (
    id uuid references auth.users on delete cascade not null primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.super_admins enable row level security;

-- Function to check if user is super admin (Security Definer to access table securely)
create or replace function kit.is_super_admin() returns boolean
    language sql
    security definer
    stable
    set search_path = ''
as $$
    select exists (
        select 1 from public.super_admins where id = auth.uid()
    );
$$;

grant execute on function kit.is_super_admin to authenticated, service_role;

-- Policy: Only super admins can view the super admin list (or themselves)
create policy "Super admins can view themselves"
    on public.super_admins
    for select
    to authenticated
    using (auth.uid() = id);

-- 2. Memberships (Org/Account Roles)
create type public.membership_role as enum ('owner', 'manager', 'employee');

create table if not exists public.memberships (
    account_id uuid references public.accounts on delete cascade not null,
    user_id uuid references auth.users on delete cascade not null,
    role public.membership_role not null default 'employee',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (account_id, user_id)
);

alter table public.memberships enable row level security;

-- Helper to check if user is an owner of an account
create or replace function kit.is_account_owner(account_id uuid) returns boolean
    language sql
    security definer
    stable
    set search_path = ''
as $$
    select exists (
        select 1 from public.memberships m
        where m.account_id = $1
          and m.user_id = auth.uid()
          and m.role = 'owner'
    );
$$;

-- RLS for Memberships
-- Select: Super Admin OR User is member of the account
create policy "Members can view other members of the same account"
    on public.memberships
    for select
    to authenticated
    using (
        kit.is_super_admin() OR
        account_id in (
            select m.account_id from public.memberships m where m.user_id = auth.uid()
        )
    );

-- Insert/Update/Delete: Super Admin OR Owner
create policy "Owners can manage memberships"
    on public.memberships
    for all
    to authenticated
    using (
        kit.is_super_admin() OR
        kit.is_account_owner(account_id)
    );

-- 3. Locations
create table if not exists public.locations (
    id uuid default extensions.uuid_generate_v4() primary key,
    account_id uuid references public.accounts on delete cascade not null,
    name text not null,
    address text,
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.locations enable row level security;

-- 4. Location Assignments (Roles at specific locations)
create table if not exists public.location_assignments (
    location_id uuid references public.locations on delete cascade not null,
    user_id uuid references auth.users on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (location_id, user_id)
);

alter table public.location_assignments enable row level security;

-- Helper to check if user is an owner or manager (Org Admin)
-- Managers are considered Org Admins for this context, but we might refine this.
-- Actually, strict requirement: Managers can access assigned locations. Owners can access all.
create or replace function kit.has_location_access(location_id uuid) returns boolean
    language sql
    security definer
    stable
    set search_path = ''
as $$
    select exists (
        select 1 from public.locations l
        where l.id = $1
        and (
             -- User is Super Admin (handled by policy usually, but good to have here if needed)
             exists (select 1 from public.super_admins where id = auth.uid())
             OR
             -- User is Account Owner
             exists (
                select 1 from public.memberships m 
                where m.account_id = l.account_id 
                and m.user_id = auth.uid() 
                and m.role = 'owner'
             )
             OR
             -- User is Assigned to this Location
             exists (
                select 1 from public.location_assignments la 
                where la.location_id = l.id 
                and la.user_id = auth.uid()
             )
        )
    );
$$;

-- RLS for Locations
-- Select: Super Admin OR Account Owner OR Assigned User
create policy "Visible to Admin, Owner, or Assigned User"
    on public.locations
    for select
    to authenticated
    using (
        kit.is_super_admin() OR
        kit.is_account_owner(account_id) OR
        exists (
            select 1 from public.location_assignments la
            where la.location_id = public.locations.id
              and la.user_id = auth.uid()
        )
    );

-- Insert/Update/Delete: Super Admin OR Account Owner. 
-- Managers generally should NOT create locations unless specified. Let's restrict to Owner for now.
create policy "Manageable by Admin or Owner"
    on public.locations
    for all
    to authenticated
    using (
        kit.is_super_admin() OR
        kit.is_account_owner(account_id)
    );

-- RLS for Location Assignments
-- Manageable by Owners.
create policy "Assignments Manageable by Admin or Owner"
    on public.location_assignments
    for all
    to authenticated
    using (
        kit.is_super_admin() OR
        exists (
            select 1 from public.locations l
            where l.id = location_id
              and kit.is_account_owner(l.account_id)
        )
    );
    
create policy "Assignments Viewable by assigned user"
    on public.location_assignments
    for select
    to authenticated
    using (user_id = auth.uid());


-- 5. Review Requests
create table if not exists public.review_requests (
    id uuid default extensions.uuid_generate_v4() primary key,
    location_id uuid references public.locations on delete cascade not null,
    created_by uuid references auth.users on delete set null,
    customer_email text not null,
    customer_name text,
    status text not null default 'pending', -- pending, sent, clicked, completed
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.review_requests enable row level security;

-- Select: Viewable by anyone with access to the location
create policy "Review Requests Viewable by Location Access"
    on public.review_requests
    for select
    to authenticated
    using (
       kit.has_location_access(location_id)
    );

-- Insert: Createable by anyone with access to the location (Employees included)
create policy "Review Requests Createable by Location Access"
    on public.review_requests
    for insert
    to authenticated
    with check (
       kit.has_location_access(location_id)
    );

-- Update: Check access
create policy "Review Requests Updateable by House"
    on public.review_requests
    for update
    to authenticated
    using ( kit.has_location_access(location_id) );


-- 6. Update Accounts RLS to respect Memberships/Super Admin
-- We need to ensure new policies don't conflict with existing ones if they exist.
-- Assuming clean slate or compatible logic.

-- Allow Super Admin full access to accounts
create policy "Super Admin full access accounts"
    on public.accounts
    for all
    to authenticated
    using (kit.is_super_admin());

-- Update 'read' policy for accounts to include members
drop policy if exists accounts_read on public.accounts;
create policy accounts_read on public.accounts for select to authenticated using (
    kit.is_super_admin() OR
    (select auth.uid()) = id OR -- Keep legacy personal account access if needed
    exists (select 1 from public.memberships m where m.account_id = id and m.user_id = auth.uid())
);

-- Update 'update' policy for accounts to include owners (not just personal id match)
drop policy if exists accounts_update on public.accounts;
create policy accounts_update on public.accounts for update to authenticated using (
    kit.is_super_admin() OR
    (select auth.uid()) = id OR
    exists (select 1 from public.memberships m where m.account_id = id and m.user_id = auth.uid() and m.role = 'owner')
);

