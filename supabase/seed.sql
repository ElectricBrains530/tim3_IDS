-- Tim3 v1 Seed Data
-- Creates Users, Organization, Memberships, Programs, and Employees

-- 1. Create Users (Password: password123)
-- We use fixed UUIDs to make the seed deterministic and referencable
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES
-- Admin User
(
    '00000000-0000-0000-0000-000000000000',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'authenticated',
    'authenticated',
    'admin@tim3.ai',
    '$2a$10$w8.3.2.1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0', -- Dummy hash
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Tim Administrator"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
),
-- Manager User
(
    '00000000-0000-0000-0000-000000000000',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
    'authenticated',
    'authenticated',
    'manager@tim3.ai',
    '$2a$10$w8.3.2.1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0',
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Molly Manager"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
),
-- RCW User
(
    '00000000-0000-0000-0000-000000000000',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
    'authenticated',
    'authenticated',
    'rcw@tim3.ai',
    '$2a$10$w8.3.2.1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0',
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Rick Worker"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES
(
    gen_random_uuid(),
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '{"sub": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "email": "admin@tim3.ai"}',
    'email',
    'admin@tim3.ai',
    now(),
    now(),
    now()
),
(
    gen_random_uuid(),
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
    '{"sub": "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22", "email": "manager@tim3.ai"}',
    'email',
    'manager@tim3.ai',
    now(),
    now(),
    now()
),
(
    gen_random_uuid(),
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
    '{"sub": "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33", "email": "rcw@tim3.ai"}',
    'email',
    'rcw@tim3.ai',
    now(),
    now(),
    now()
)
ON CONFLICT DO NOTHING;

-- 2. Create Organization (Account)
-- Removed 'slug' column
-- Changed email to avoid unique constraint conflict with Personal Account
INSERT INTO public.accounts (id, name, email) 
VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    'Tim3 Demo Org',
    'contact@tim3.ai' -- Changed from admin@tim3.ai to avoid collision
)
ON CONFLICT (id) DO NOTHING;

-- 3. Create Memberships (SaaS Layer Authorization)
INSERT INTO public.memberships (account_id, user_id, role)
VALUES
('11111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'owner'),
('11111111-1111-1111-1111-111111111111', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'manager'),
('11111111-1111-1111-1111-111111111111', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'employee')
ON CONFLICT (account_id, user_id) DO NOTHING;

-- 4. Create Program Groups
INSERT INTO public.program_groups (id, account_id, name)
VALUES
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Residential Services')
ON CONFLICT (id) DO NOTHING;

-- 5. Create Programs
INSERT INTO public.programs (id, account_id, program_group_id, name)
VALUES
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Maplewood House'),
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Oak Street Home')
ON CONFLICT (id) DO NOTHING;

-- 6. Create Employees (Business Layer Profile)
INSERT INTO public.employees (
    id, 
    account_id, 
    job_title, 
    employment_status, 
    seniority_hours, 
    seniority_start_date, 
    contact_primary, 
    is_driver
)
VALUES
-- Admin as Admin
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '11111111-1111-1111-1111-111111111111', 'Administrator', 'Full-time', 9999, '2020-01-01', '555-0001', true),
-- Manager as Program Manager
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', '11111111-1111-1111-1111-111111111111', 'Program Manager', 'Full-time', 5000, '2021-01-01', '555-0002', true),
-- RCW as Casual
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', '11111111-1111-1111-1111-111111111111', 'Residential Care Worker', 'Casual', 1200, '2022-06-01', '555-0003', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Assign Employees to Programs
INSERT INTO public.program_assignments (employee_id, program_id, assignment_type)
VALUES
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', '33333333-3333-3333-3333-333333333333', 'Primary'), -- RCW -> Maplewood
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', '44444444-4444-4444-4444-444444444444', 'Alternate') -- RCW -> Oak Street (Trained)
ON CONFLICT DO NOTHING;
