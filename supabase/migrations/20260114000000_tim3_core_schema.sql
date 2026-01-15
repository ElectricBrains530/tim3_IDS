-- 20260114000000_tim3_core_schema.sql

-- Enable RLS on all new tables automatically
-- (Supabase default, but good to be explicit if we weren't using the platform)

-- 1. Program Groups (Printing/Export grouping)
CREATE TABLE public.program_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.program_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View Program Groups" ON public.program_groups
    FOR SELECT
    USING (
        (auth.uid() IN (
            SELECT user_id FROM public.memberships WHERE account_id = program_groups.account_id
        ))
    );

CREATE POLICY "Manage Program Groups" ON public.program_groups
    FOR ALL
    USING (
        (auth.uid() IN (
            SELECT user_id FROM public.memberships 
            WHERE account_id = program_groups.account_id 
            AND role IN ('owner', 'manager')
        ))
    );

-- 2. Programs (Renamed from Locations concept)
CREATE TABLE public.programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    program_group_id UUID REFERENCES public.program_groups(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View Programs" ON public.programs
    FOR SELECT
    USING (
        (auth.uid() IN (
            SELECT user_id FROM public.memberships WHERE account_id = programs.account_id
        ))
    );

CREATE POLICY "Manage Programs" ON public.programs
    FOR ALL
    USING (
        (auth.uid() IN (
            SELECT user_id FROM public.memberships 
            WHERE account_id = programs.account_id 
            AND role IN ('owner', 'manager')
        ))
    );

-- 3. Employees (Business Logic User Profile)
CREATE TABLE public.employees (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    job_title TEXT,
    employment_status TEXT CHECK (employment_status IN ('Full-time', 'Part-time', 'Casual')),
    seniority_hours NUMERIC(10, 2) DEFAULT 0,
    seniority_start_date DATE,
    contact_primary TEXT,
    contact_secondary TEXT,
    is_driver BOOLEAN DEFAULT false,
    has_class4 BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View Employees" ON public.employees
    FOR SELECT
    USING (
        -- Can view if in same account OR is self
        (auth.uid() IN (
            SELECT user_id FROM public.memberships WHERE account_id = employees.account_id
        ))
        OR
        (id = auth.uid())
    );

CREATE POLICY "Update Self" ON public.employees
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid()); -- Allow self-update of contact info

CREATE POLICY "Manage Employees" ON public.employees
    FOR ALL
    USING (
        (auth.uid() IN (
            SELECT user_id FROM public.memberships 
            WHERE account_id = employees.account_id 
            AND role IN ('owner', 'manager')
        ))
    );

-- 4. Program Assignments (Employee <-> Program)
CREATE TABLE public.program_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    assignment_type TEXT CHECK (assignment_type IN ('Primary', 'Alternate')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.program_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View Assignments" ON public.program_assignments
    FOR SELECT
    USING (true); -- Publicly viewable within authenticated app context usually, or restricted to account members via join. 
    -- Simplified for v1: if you can see employee and program, you can see assignment.

CREATE POLICY "Manage Assignments" ON public.program_assignments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.programs p
            JOIN public.memberships m ON m.account_id = p.account_id
            WHERE p.id = program_assignments.program_id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'manager')
        )
    );

-- 5. Availability Entries (Temporal Versioning)
CREATE TABLE public.availability_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status_code TEXT NOT NULL, -- "A", "D,E", "NA"
    is_late_submission BOOLEAN DEFAULT false,
    effective_start TIMESTAMPTZ DEFAULT now() NOT NULL,
    effective_end TIMESTAMPTZ DEFAULT 'infinity'::timestamptz NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.availability_entries ENABLE ROW LEVEL SECURITY;

-- Index for temporal lookups
CREATE INDEX idx_availability_current ON public.availability_entries (user_id, date) WHERE effective_end = 'infinity'::timestamptz;

CREATE POLICY "View Availability" ON public.availability_entries
    FOR SELECT
    USING (
        -- Users see their own
        (user_id = auth.uid())
        OR
        -- Managers see all in their account (Need Join)
        EXISTS (
            SELECT 1 FROM public.employees e
            JOIN public.memberships m ON m.account_id = e.account_id
            WHERE e.id = availability_entries.user_id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'manager')
        )
    );

CREATE POLICY "Insert Availability" ON public.availability_entries
    FOR INSERT
    WITH CHECK (
        -- Users can insert for themselves
        (user_id = auth.uid())
        OR
        -- Managers can override
        EXISTS (
            SELECT 1 FROM public.employees e
            JOIN public.memberships m ON m.account_id = e.account_id
            WHERE e.id = availability_entries.user_id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'manager')
        )
    );

CREATE POLICY "Update Availability (Temporal Close)" ON public.availability_entries
    FOR UPDATE
    USING (
        -- Same as insert logic
        (user_id = auth.uid())
        OR
        EXISTS (
            SELECT 1 FROM public.employees e
            JOIN public.memberships m ON m.account_id = e.account_id
            WHERE e.id = availability_entries.user_id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'manager')
        )
    );

-- 6. Availability Locks
CREATE TABLE public.availability_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    month_date DATE NOT NULL, -- "2026-02-01"
    is_locked BOOLEAN DEFAULT true,
    locked_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(account_id, month_date)
);
ALTER TABLE public.availability_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View Locks" ON public.availability_locks
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.memberships WHERE account_id = availability_locks.account_id
        )
    );
