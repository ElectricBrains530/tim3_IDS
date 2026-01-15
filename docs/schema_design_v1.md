# Database Schema Design: tim3 v1

This document details the complete database schema required to support the tim3 Availability & Shift Management system. It is derived from `IDS_Req_Availabilityv1.md` and the `gap_analysis_matrix.md`.

## 1. Core SaaS Tables (Existing - Reference Only)

These tables exist in the MakerKit boilerplate and govern multi-tenancy and authentication.

### `auth.users` (Supabase Built-in)

* Standard Supabase auth table.
* **Key Fields**: `id` (UUID), `email`, `created_at`.

### `public.accounts` (Organizations)

* **Purpose**: Represents the Tenant/Organization (e.g., "Main Organization", "Regional Branch").
* **Key Fields**:
  * `id` (UUID, PK)
  * `name` (String)
  * `primary_owner_user_id` (UUID)

### `public.memberships` (SaaS Access Control)

* **Purpose**: Links Users to Accounts with *SaaS Permissions*.
* **Key Fields**:
  * `account_id` (UUID, FK -> accounts)
  * `user_id` (UUID, FK -> auth.users)
  * `role` (Enum: `owner` | `manager` | `employee`)
    * *Mapping*: Owner=Admin, Manager=Program Manager, Employee=RCW.

---

## 2. Business Logic Tables (New)

### `public.employees`

**Purpose**: Stores business-specific employee data, decoupled from SaaS permissions. One-to-one with `auth.users`.

| Column Name | Type | Constraints | Description | Source Requirement |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PK, FK -> auth.users | Matches Auth User ID. | |
| `account_id` | UUID | FK -> accounts | Multi-tenancy scope. | |
| `employement_status` | Enum | `Full-time`, `Part-time`, `Casual` | Core classification. | Sec 5.1 |
| `job_title` | String | | e.g. "Residential Care Worker". | User Request |
| `seniority_hours` | Decimal(10,2) | Default 0 | Total hours worked. | Sec 5.2 |
| `seniority_start_date`| Date | Nullable | Start date (used for FT ranking). | Sec 5.2 |
| `contact_primary` | String | | Primary phone number. | Sec 7.1 |
| `contact_secondary` | String | | Secondary phone number. | Sec 7.1 |
| `is_driver` | Boolean | Default False | Valid Driver's License? | Sec 4.4 |
| `has_class4` | Boolean | Default False | Class 4 License? | Sec 4.4 |
| `created_at` | Timestamptz | | | |
| `updated_at` | Timestamptz | | | |

### `public.programs` (Renamed from `locations`)

**Purpose**: Represents Staffed Homes or Day Programs.

| Column Name | Type | Constraints | Description | Source Requirement |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PK | | |
| `account_id` | UUID | FK -> accounts | | |
| `name` | String | Not Null | Program Name. | Sec 4.1 |
| `program_group_id` | UUID | FK -> program_groups | Link to printing group. | Sec 4.2 |
| `metadata` | JSONB | | Flexible attributes. | |

### `public.program_groups`

**Purpose**: Groups programs for printing/exporting.

| Column Name | Type | Constraints | Description | Source Requirement |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PK | | |
| `account_id` | UUID | FK -> accounts | | |
| `name` | String | Not Null | e.g. "North Region Homes". | Sec 4.2 |

### `public.program_assignments`

**Purpose**: Links Employees to Programs with a specific assignment type.

| Column Name | Type | Constraints | Description | Source Requirement |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PK | | |
| `employee_id` | UUID | FK -> employees | | |
| `program_id` | UUID | FK -> programs | | |
| `assignment_type` | Enum | `Primary`, `Alternate` | "Alternate" = Staff also Trained. | Sec 4.1 |

### `public.availability_entries` (Temporal)

**Purpose**: Stores availability declarations. Uses Effective Date Versioning (Temporal).

| Column Name | Type | Constraints | Description | Source Requirement |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PK | | |
| `user_id` | UUID | FK -> employees | | Sec 3.1 |
| `date` | Date | Not Null | The specific calendar day. | Sec 3.1 |
| `status_code` | Enum/String | `A`, `D`, `E`, `OS`, `ON`, `NA` | Comma-separated or Enum array. | Sec 3.1 |
| `is_late_submission` | Boolean | Default False | Flagged if submitted after lock. | Sec 3.3 |
| `effective_start` | Timestamptz | Default Now() | Start of validity. | Sec 3.2 |
| `effective_end` | Timestamptz | Default Infinity | End of validity (Infinity = Active). | Sec 3.2 |
| `created_by` | UUID | FK -> auth.users | Audit: Who made the entry. | Sec 11.1 |

**Logic**: To update, `UPDATE` old row `effective_end = Now()` AND `INSERT` new row.

### `public.availability_locks`

**Purpose**: Controls the "Locked" state of a month.

| Column Name | Type | Constraints | Description | Source Requirement |
| :--- | :--- | :--- | :--- | :--- |
| `account_id` | UUID | FK -> accounts | | |
| `month_date` | Date | | e.g. '2026-02-01' (1st of month). | Sec 3.2 |
| `is_locked` | Boolean | Default True | | |
| `locked_at` | Timestamptz | | When the lock occurred. | |

### `public.user_agreements`

**Purpose**: Logs the details of checkbox confirmations.

| Column Name | Type | Constraints | Description | Source Requirement |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PK | | |
| `user_id` | UUID | FK -> employees | | |
| `agreement_type` | String | | e.g. 'policy_8_24', 'overtime_ack'. | Sec 7.1 |
| `agreed_at` | Timestamptz | Default Now() | Timestamp of click. | Sec 7.1 |
| `agreement_text_snapshot` | String | | Copy of text at time of agreement. | Sec 11.1 |

---

## 3. Enums & Types

### `employment_status`

* `full_time`
* `part_time`
* `casual`

### `assignment_type`

* `primary`
* `alternate`

### `availability_status` (Can be stored as array of strings)

* `A` (Available All)
* `D` (Day)
* `E` (Evening)
* `OS` (Overnight Sleep)
* `ON` (Overnight Awake)
* `NA` (Not Available)

---

## 4. Foreign Key Relationships Diagram (Conceptual)

`auth.users` (1) <-> (1) `employees` (1) <-> (M) `availability_entries`
`accounts` (1) <-> (M) `programs` (M) <-> (M) `program_assignments` <-> (1) `employees`
`accounts` (1) <-> (M) `program_groups` (1) <-> (M) `programs`
