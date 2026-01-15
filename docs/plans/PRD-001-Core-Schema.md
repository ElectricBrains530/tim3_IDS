# PRD-001: Core Schema & Domain Models

**Status**: Draft
**Phase**: Foundation
**Owner**: Antigravity

## 1. Objective

Initialize the "Business Layer" of the tim3 database schema. This decouples business logic (`employees`, `programs`) from the existing SaaS logic (`memberships`, `accounts`).

## 2. Functional Requirements

### 2.1 Database Migrations

**Context**: Supabase PostgreSQL.
**Requirement**: Create a single idempotent migration file.

#### 2.1.1 Table: `programs`

* **Action**: Create table `programs`.
* **Columns**:
  * `id` (UUID, PK, default `gen_random_uuid()`)
  * `account_id` (UUID, FK `accounts.id`, Not Null)
  * `program_group_id` (UUID, FK `program_groups.id`, Nullable)
  * `name` (Text, Not Null)
  * `metadata` (JSONB, default `{}`)
* **RLS Policy**:
  * Select: `auth.uid()` in `memberships` (account_id match).
  * Insert/Update/Delete: `memberships.role` in ('owner', 'manager').

#### 2.1.2 Table: `program_groups`

* **Action**: Create table `program_groups`.
* **Columns**: `id`, `account_id`, `name`.
* **RLS**: Same as `programs`.

#### 2.1.3 Table: `employees`

* **Action**: Create table `employees`.
* **Columns**:
  * `id` (UUID, PK, FK `auth.users.id`, Not Null - 1:1 relationship)
  * `account_id` (UUID, FK `accounts.id`)
  * `job_title` (Text)
  * `employment_status` (Text, Check: 'Full-time', 'Part-time', 'Casual')
  * `seniority_hours` (Numeric, default 0)
  * `seniority_start_date` (Date, Nullable)
  * `contact_primary` (Text)
* **RLS Policy**:
  * Select: `auth.uid()` in `memberships` OR `id` = `auth.uid()`.
  * Update: `id` = `auth.uid()` (Self-service contact info) OR `memberships.role` in ('owner', 'manager').

#### 2.1.4 Table: `program_assignments`

* **Action**: Create table `program_assignments`.
* **Columns**: `employee_id`, `program_id`, `assignment_type` (Check: 'Primary', 'Alternate').
* **RLS**: Admin managed.

#### 2.1.5 Table: `availability_entries`

* **Action**: Create table `availability_entries` for Temporal Versioning.
* **Columns**:
  * `id` (UUID, PK)
  * `user_id` (UUID, FK `employees.id`)
  * `date` (Date, Not Null)
  * `status_code` (Text, Not Null)
  * `is_late_submission` (Boolean, default false)
  * `effective_start` (Timestamptz, default `now()`)
  * `effective_end` (Timestamptz, default `infinity`)
* **Index**: `(user_id, date, effective_end)` for fast "current version" lookup.

#### 2.1.6 Table: `availability_locks`

* **Action**: Create table `availability_locks`.
* **Columns**: `account_id`, `month_date` (Date), `is_locked` (Boolean).

### 2.2 TypeScript Domain Models

**Context**: `packages/features/tim3/src/types.ts`
**Requirement**: Export interfaces matching the schema.

* `interface Employee { ... }`
* `interface Program { ... }`
* `interface AvailabilityEntry { ... }`

### 2.3 Seed Data

**Context**: `packages/supabase/seed.ts`
**Requirement**:

* Create 1 Admin User.
* Create 1 Program Group ("Main Region").
* Create 2 Programs ("Home A", "Home B").
* Create 3 Employees (1 FT, 1 PT, 1 Casual) linked to auth users.

## 3. Acceptance Criteria (Verifiable)

1. **Migration Success**: `npx supabase migration up` executes without error.
2. **Schema Check**: Querying `information_schema.tables` shows all 6 new tables in `public`.
3. **RLS Check**:
    * As "Member": Cannot DELETE from `programs`.
    * As "Owner": Can INSERT into `programs`.
4. **Seed Verification**: Running `seed.ts` results in `Select count(*) from employees` returning > 0.
