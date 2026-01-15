# PRD-002: Employee Availability Grid (Mobile First)

## 1. Goal

Implement the core **Employee Availability Entry** interface, focusing on a mobile-first user experience. This feature allows employees to view their schedule, toggle availability (A, D, E, OS, NA), and submit their data for the upcoming month. It must enforce the "15th of the month" lock rule and support "Copy Previous Week" for speed.

## 2. Requirements (from v1.6 Spec)

* **Mobile First**: Large tap targets, vertical scrolling list for days.
* **Month Selection**: Users can select current or future months (up to 12 months ahead).
* **Availability Codes**: `A` (Available), `D` (Day), `E` (Evening), `OS` (Overnight Sleep), `NA` (Not Available).
* **Default State**: System defaults to `NA` (Not Available) for unmarked days.
* **Speed Features**: "Copy Previous 7 Days" button.
* **Locking**:
  * **Open**: Editable until 15th @ 23:59.
  * **Locked**: Read-only (or triggers "Late Submission" flow - v1 MVP will just block editing for simplicity first, then add Late Warning).
* **Persistence**: Data saved to `availability_entries` table.

## 3. User Stories

1. **Select Month**: As an Employee, I want to choose which month I am setting availability for, so I can plan ahead.
2. **Toggle Availability**: As an Employee, I want to tap a day to mark it as "Available" (A) or specific shifts (D, E), so managers know when I can work.
3. **Copy Week**: As an Employee, I want to copy my schedule from the first week to the rest of the month, so I can save time.
4. **Save/Submit**: As an Employee, I want to save my changes, so they are recorded.
5. **View Locked**: As an Employee, I want to see a read-only view of past/locked months, so I can verify what I submitted.

## 4. Technical Design

### 4.1 Component Architecture (`apps/web/app/home/availability`)

* **`page.tsx`**: Server Component. Fetches `AvailabilityLock` status and current `AvailabilityEntries` for the user.
* **`components/MonthSelector.tsx`**: Dropdown/Tabs to switch months.
* **`components/AvailabilityGrid.tsx`**:
  * Client Component.
  * State: `localEntries` (Optimistic UI).
  * Layout: Vertical list of `DayRow` components.
* **`components/DayRow.tsx`**:
  * Displays Date (e.g., "Mon, Feb 1").
  * Highlights Holidays (prop).
  * Input: Segmented Control or Multi-select chips for [A, D, E, OS, NA].
  * Logic: Selecting `A` unselects others. Selecting `NA` unselects others.

### 4.2 State Management

* Use `React Hook Form` or simple local `useState` given the structured nature.
* **Service**: `submitAvailability(month, entries)` in `@features/tim3`.

### 4.3 Database Interactions

* **Fetch**: `SELECT * FROM availability_entries WHERE user_id = ? AND date BETWEEN ? AND ?`
* **Upsert**: The submission logic should probably use a Supabase RPC or a transaction to clear/overwrite functionality, OR intelligent upsert on the client side.
  * *Decision*: Use `upsert` on `id` if tracking individual entry IDs, or `delete` + `insert` for the month range to ensure clean state. **Strategy**: `upsert` on `(user_id, date)` unique constraint if we added one, otherwise logic to find existing entry ID.
  * *Refinement*: `availability_entries` has `id`. We should probably fetch existing IDs to update them, or allow `delete` + `insert` strategy for simplicity in v1. *Actually*, `schema-v1` has a conceptual uniqueness on `user_id, date, effective_end`.
  * *Service Logic*:
        1. Get existing entries for month.
        2. Diff changes.
        3. Bulk `upsert` via Supabase client.

## 5. Atomic Tasks (for TASKS.jsonl)

1. **Setup Page**: Create `apps/web/app/home/availability/page.tsx` and basic layout shell.
2. **Date Logic Service**: Create `packages/features/tim3/src/services/date-utils.ts` to generate "Month Days" and handle "Copy Week" logic.
3. **Availability Service**: Implement `fetchAvailability` and `saveAvailability` in `packages/features/tim3/src/services/availability.ts`.
4. **UI Component - DayRow**: Build the mobile-friendly row component with proper `shadcn/ui` toggles.
5. **UI Component - Grid**: Assemble the full month view with "Copy" button.
6. **Integration**: Connect Page -> Service -> Supabase.
7. **Verification**: Test flow as "RCW" user.

## 6. Verification Plan

* **Manual**: Log in as `rcw@tim3.ai`. Go to `/home/availability`. specific days. Click Save. reload page. Verify persistence.
* **Automated**: Jest test for `date-utils.ts` (Copy Week logic).
