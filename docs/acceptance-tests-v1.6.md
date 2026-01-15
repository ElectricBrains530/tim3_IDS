
# Acceptance Tests — Availability & Schedule Planning System (v1.6)

This document defines **formal acceptance tests** derived from Sections **3, 5, 6, and 9** of the Business Requirements v1.6.
Tests are written in **Given / When / Then** format and are intended for BA validation, QA execution, and UAT sign-off.

---

## Section 3 — Core Business Rules (Availability & Locking)

### AT-3.1 — On-Time Availability Submission
**Given** an employee is within the open submission window  
**When** the employee submits availability before 23:59 on the 15th  
**Then** the submission is recorded as *On-Time*  
**And** the employee is ranked by seniority within their employment class  

---

### AT-3.2 — Automatic N/A Assignment
**Given** an employee submits availability  
**When** one or more days are left unmarked  
**Then** those days are automatically stored as `N/A`  
**And** no blank day states exist after save  

---

### AT-3.3 — Lock Enforcement
**Given** the system time is 00:00 on the 16th (org timezone)  
**When** availability data is queried  
**Then** the locked snapshot for the succeeding month is used  
**And** availability rows are immutable  

---

### AT-3.4 — Late Availability Resubmission
**Given** availability is locked  
**When** an employee submits availability for the locked month  
**Then** the submission is flagged as *Late*  
**And** a warning dialog is shown  
**And** the submission is marked for manager review  

---

### AT-3.5 — Late Submission Ranking (Unapproved)
**Given** an employee has a late, unapproved submission  
**When** availability lists are generated  
**Then** the employee appears at the bottom of the list  
**And** ordering is by submission timestamp, not seniority  

---

### AT-3.6 — Late Submission Approval
**Given** an employee has a late submission  
**When** a manager approves the submission with a reason code  
**Then** the employee immediately regains seniority-based ranking  
**And** the approval is audit-logged with user, timestamp, and reason  

---

### AT-3.7 — Exhaustion Callout Rule
**Given** all employees who declared availability have been contacted  
**When** additional staff are required  
**Then** managers may contact employees who did not submit availability  
**And** these employees never appear in exports  

---

## Section 5 — Employee Classification & Ranking

### AT-5.1 — Employment Class Ordering
**Given** an availability list is generated  
**When** employees are ranked  
**Then** ordering is applied by employment class  
**And** Part-time appears above Casual  
**And** Full-time appears only if explicitly configured  

---

### AT-5.2 — Seniority Ranking
**Given** multiple employees share the same class and submission state  
**When** the list is sorted  
**Then** employees are ordered by seniority hours (descending)  
**And** name is used as the final tie-breaker  

---

### AT-5.3 — Cross-Program Designation
**Given** an employee is Part-time in one Program Group  
**When** they appear in other Program Groups  
**Then** they are designated Casual in those groups  

---

## Section 6 — Inclusion Rules

### AT-6.1 — Inclusion with Submission
**Given** an employee submitted availability  
**When** availability lists are generated  
**Then** the employee appears even if all days are `N/A`  

---

### AT-6.2 — Exclusion without Submission
**Given** an employee did not submit availability  
**When** availability lists are generated  
**Then** the employee does not appear  
**And** they are considered unavailable  

---

### AT-6.3 — Eligibility Gate
**Given** an employee is not eligible for a Program Group  
**When** availability lists are generated  
**Then** the employee does not appear regardless of submission state  

---

### AT-6.4 — Mid-Month Eligibility Change
**Given** an employee becomes eligible mid-month  
**And** they previously submitted availability  
**When** lists are refreshed  
**Then** the employee appears immediately  
**And** normal seniority ranking applies if availability is approved  

---

## Section 9 — Live On-Screen Availability View

### AT-9.1 — Default Live View Horizon
**Given** a manager opens the live availability view  
**When** no filters are applied  
**Then** the view starts at today  
**And** displays a rolling 31-day horizon  

---

### AT-9.2 — Forecast vs Locked Month
**Given** the current date is after the 15th  
**When** the live view crosses into the next month  
**Then** forecast availability is shown  
**And** only employees who submitted in the last locked month appear  

---

### AT-9.3 — Cell Display Rules
**Given** availability data is displayed  
**When** a day has availability  
**Then** the cell shows `A` or comma-separated shift codes  
**And** shows `N/A` if unavailable  

---

### AT-9.4 — Manager-Only States
**Given** a manager is viewing the live availability list  
**When** employees are grouped  
**Then** sections for *Late Submissions* and *Not Submitted* are visible  
**And** these sections are never shown in exports  

---

### AT-9.5 — Read-Only Enforcement
**Given** any user is viewing the live availability view  
**When** they attempt to edit availability  
**Then** the system prevents modification  

---

## End of Acceptance Tests
