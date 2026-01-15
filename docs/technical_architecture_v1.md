# Technical Architecture: tim3 v1

## 1. High-Level Overview

**tim3** is a web-based Availability & Shift Management system built on the **MakerKit SaaS Boilerplate**. It leverages a "Serverless Monolith" architecture using Next.js for the full-stack application and Supabase for the database, authentication, and background automation.

### Core Stack

* **Framework**: Next.js 14+ (App Router)
* **Database**: PostgreSQL (Supabase)
* **Auth**: Supabase Auth (Email/Password)
* **Styling**: Tailwind CSS + Shadcn UI
* **State Management**: React Query (Server Context) + Zustand (Client Context)
* **Hosting**: Vercel (recommended) or Docker

---

## 2. Architecture Layers

### 2.1 The "Two-Layer" Database Strategy

To adapt MakerKit (a generic SaaS starter) for tim3 (a complex business app), we employ a strict layer separation in Postgres:

1. **SaaS Layer (`public` schema - standard)**
    * **Responsibility**: Multi-tenancy, Billing, User Accounts.
    * **Tables**: `accounts`, `memberships`, `users`.
    * **Logic**: Standard MakerKit RLS policies.
    * **Change Policy**: Avoid modification to minimize upgrade conflicts.

2. **Business Layer (`public` schema - custom)**
    * **Responsibility**: Core tim3 logic (Scheduling, Availability, Employees).
    * **Tables**: `employees`, `programs`, `availability_entries`, `availability_locks`.
    * **Logic**: Custom RLS policies based on `memberships.role` + `employees` data.
    * **Change Policy**: Fully owned by tim3 development.

### 2.2 Frontend Architecture (`apps/web`)

The frontend is built Mobile-First for the "Employee" persona and Desktop-Optimized for the "Manager" persona.

#### Component Hierarchy

* **App Shell**: MakerKit Sidebar/Header (SaaS Context).
* **Feature Modules**:
  * `features/tim3/availability-grid`: Mobile-optimized grid for data entry.
    * *State*: Local undo/redo buffer before "Save".
  * `features/tim3/manager-timeline`: Virtualized Desktop view.
    * *Lib*: `@fullcalendar/react` (Resource Timeline view).
    * *Data*: Fetched via `useAvailabilityQuery` (React Query).

#### Data Fetching Strategy

* **Server Components (RSC)**: Fetch initial data (Employee Profile, Program Groups) directly from Supabase.
* **Client Components**: Fetch dyanmic data (Timeline Events) via Supabase Client SDK $\rightarrow$ React Query.

### 2.3 Backend Architecture (Supabase)

#### Edge Functions

* **`scheduled-lock`**:
  * **Trigger**: Cron schedule (16th of month @ 00:00).
  * **Action**: Inserts rows into `availability_locks` for all active Accounts.
* **`export-availability`**:
  * **Trigger**: HTTPS Request (Manager clicks "Export").
  * **Action**: Streams an Excel file generated via `exceljs`.

#### Database Logic (Triggers vs App Logic)

* **Triggers**: Minimal. Used only for `updated_at` timestamps.
* **App Logic**: Complex validations (Transition Guards) are handled in the Application Layer (Next.js API Routes/Server Actions) to ensure proper error feedback to users.

---

## 3. Data Flow Diagrams

### 3.1 Availability Submission Flow

1. **User**: Toggles "Available" on `AvailabilityGrid`.
2. **Client**: Batches changes in local state.
3. **Action**: User clicks "Save".
4. **API**: `POST /api/tim3/availability`
    * **Check 1**: Is Month Locked? (Query `availability_locks`)
    * **Check 2**: Is User Eligible? (True by default if they have account)
5. **DB Transaction**:
    * *If Locked*: Insert with `is_late_submission = true`.
    * *If Open*: `UPDATE` existing temporal row `effective_end = now()`, `INSERT` new row.
6. **Response**: Updated Grid State.

### 3.2 Reporting Flow

1. **Manager**: Selects "Program Group" + "Month".
2. **API**: `GET /api/tim3/report?group=X&month=Y`
3. **Query**:
    * Join `programs` $\rightarrow$ `assignments` $\rightarrow$ `employees`.
    * Join `availability_entries` (Filtered by `effective_date` ranges).
    * Apply **Ranking Algorithm** (Sort by Role $\rightarrow$ Seniority).
4. **Render**: `@fullcalendar` receives JSON array of Resources (Employees) and Events (Shifts).

---

## 4. Security & Permissions

### 4.1 Row Level Security (RLS)

We use a "Cascading Trust" model:

1. **SaaS Check**: `auth.uid()` MUST exist in `memberships` for the target `account_id`.
2. **Role Check**:
    * **Read**: `memberships.role` IN ('owner', 'manager') OR `employees.id` = `auth.uid()`.
    * **Write**: `employees.id` = `auth.uid()` (Own Data) OR `memberships.role` IN ('owner', 'manager') (Overrides).

### 4.2 Application Role Separation

* **SaaS Roles** (`memberships.role`) control **Feature Access** (e.g., "Can I see the Settings page?").
* **Business Roles** (`employees.job_title`) control **Business Logic** (e.g., "Do I appear as an RCW on the schedule?").

---

## 5. Infrastructure Compliance

* **Timezones**: All dates stored in UTC. Display logic respects `accounts.timezone` setting.
* **Audit**: `availability_entries` is append-only (Temporal). Every change serves as its own audit log.
