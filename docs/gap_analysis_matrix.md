# Gap Analysis Matrix: tim3 v1 on MakerKit

## 1. Data Model Gaps

| Requirement Entity | MakerKit Status | Gap Severity | Proposed Solution |
| :--- | :--- | :--- | :--- |
| **Organization** | `accounts` Table | None | Use existing `accounts` table. |
| **Programs** | `locations` Table | Medium | **Rename** `locations` table to `programs`. Adapt metadata for program attributes. |
| **Program Groups** | **Missing** | **High** | **Create new table `program_groups`**. Groups multiple Programs. |
| **Employees** | `memberships` Table | **Critical** | **Create new table `employees`** (One-to-One with User/Membership). **Move business logic here.** |
| **Employee Roles** | `memberships` Table | High | `memberships` handles SaaS permissions. **New `employees` table** stores Business Roles: `Residential Care Worker`, `Program Manager`, `Administrator`. |
| **Job Title** | **Missing** | Medium | **Add column `job_title`** to new `employees` table. |
| **Assignments** | `location_assignments` | High | **Create new table `program_assignments`**. Links Employee <-> Program. Includes `assignment_type`: 'Primary' or 'Alternate'. |
| **Seniority** | **Missing** | **High** | **Add columns to `employees` table**: `seniority_hours` (decimal) and `seniority_start_date` (date). Updated semi-annually. |
| **Availability** | **Missing** | **Critical** | **Create new temporal table `availability_entries`**. Fields: `user_id`, `date`, `status_code` (A, D, E, OS, ON, NA), `effective_start`, `effective_end`. |
| **Availability Locks** | **Missing** | **High** | **Create new table `availability_locks`**. Tracks lock state per Month + Organization. |

## 2. Functional Gaps

| Requirement Feature | MakerKit Capability | Gap Severity | Work Required |
| :--- | :--- | :--- | :--- |
| **Availability Entry** | None | **Critical** | **Build `Availability_Entry` Component** (Mobile-First). Mass-input form for monthly availability (Section 7). |
| **Smart Defaults** | None | Low | Frontend logic to auto-fill "N/A" on save. |
| **Locking Logic** | None | **High** | Backend Edge Function (Cron) to insert Lock records at 00:00 on the 16th. |
| **Post-Lock Override** | None | **High** | "Effective Date Versioning" logic. Warning UI Dialogs. |
| **Seniority Ranking** | basic sorting | **High** | Custom sorting logic: Group by Role -> Seniority -> Submission Date. |
| **Excel Export** | Basic CSV | Medium | Custom `ExcelJS` generation. **Must match sample `docs/IDS_Avail_Export_Sample.xlsx`**. |

## 3. UX/UI Analysis

| Component | MakerKit/Shadcn Status | Gap Severity | Notes |
| :--- | :--- | :--- | :--- |
| **Manager Line View** | `TanStack Table` | Medium | Need custom **Timeline/Grid View** (virtualized) for Manager Dashboard planning. |
| **Mobile Entry** | Responsive | Low | `Availability_Entry` component must be optimized for mobile touch interaction (large touch targets). |

## 4. Schema Design Strategy

**Objective**: Decouple "SaaS Layer" (MakerKit) from "Business Layer" (tim3).

1. **SaaS Layer (Keep as-is):**
    * `accounts` (Organizations)
    * `memberships` (Access Control: owner/manager/member)
    * `users` (Auth)

2. **Business Layer (New/Renamed):**
    * `programs` (was `locations`)
    * `program_groups` (New)
    * `employees` (New, linked to `users.id`)
        * Cols: `job_title`, `role_type` (RCW/PM/Admin), `seniority_hours`, `seniority_start_date`.
    * `program_assignments` (New)
        * Cols: `employee_id`, `program_id`, `assignment_type` (Primary/Alternate).
    * `availability_entries` (New, Temporal)
    * `availability_locks` (New)
