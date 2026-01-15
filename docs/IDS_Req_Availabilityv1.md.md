# Consolidated Solution Requirements

## Table of Contents

- [1. Problem Statement](#1-problem-statement)
- [2. Scope (v1)](#2-scope-v1)
- [3. Core Business Rules](#3-core-business-rules)
  - [3.1 Availability Submission](#31-availability-submission)
  - [3.2 Monthly Availability Window](#32-monthly-availability-window)
  - [3.3 Post-Lock Behavior](#33-post-lock-behavior)
- [4. Eligibility, Programs, Program Groups, and Training](#4-eligibility-programs-program-groups-and-training)
  - [4.1 Programs](#41-programs)
  - [4.2 Program Groups](#42-program-groups)
  - [4.3 Employee Eligibility](#43-employee-eligibility)
  - [4.4 Training](#44-training)
- [5. Employee Classification & Ranking](#5-employee-classification-ranking)
  - [5.1 Employment Classes](#51-employment-classes)
  - [5.2 Seniority](#52-seniority)
  - [5.3 Ranking Rules (per list)](#53-ranking-rules-per-list)
- [6. Inclusion Rules (Who Appears on Lists)](#6-inclusion-rules-who-appears-on-lists)
- [7. Employee User Experience (UX)](#7-employee-user-experience-ux)
  - [7.1 Employee Design Goals](#71-employee-design-goals)
  - [7.1.5 Speed Features](#715-speed-features)
  - [7.1.6 Month Selector](#716-month-selector)
  - [7.1.7 Lock Awareness](#717-lock-awareness)
  - [7.2 Administrator Settings](#72-administrator-settings)
- [8. Manager & Admin Capabilities](#8-manager-admin-capabilities)
  - [8.1 Submission Monitoring](#81-submission-monitoring)
  - [8.2 Corrections & Overrides](#82-corrections-overrides)
- [9. Live On-Screen Availability View](#9-live-on-screen-availability-view)
  - [9.1 Purpose](#91-purpose)
  - [9.2 Behavior](#92-behavior)
  - [9.3 Layout](#93-layout)
- [10. Excel Export Requirements](#10-excel-export-requirements)
  - [10.1 Purpose](#101-purpose)
  - [10.2 Behavior](#102-behavior)
  - [10.3 Formatting](#103-formatting)
  - [10.4 Reprints](#104-reprints)
- [11. Audit & Compliance](#11-audit-compliance)
  - [11.1 Audit Logging](#111-audit-logging)
  - [11.2 Lock Enforcement](#112-lock-enforcement)
- [12. Automation & Lifecycle](#12-automation-lifecycle)
  - [12.1 Scheduled Events](#121-scheduled-events)
  - [12.2 Versioning](#122-versioning)
- [13. Summary](#13-summary)
- [14. Security](#14-security)

Consolidated Solution Requirements

Availability & Schedule Planning System

Business Requirements – v1.6 January 14th, 2026

## 1. Problem Statement

The organization currently collects monthly employee availability via a SharePoint (ShareVision) form. Administrative staff manually consolidate responses into Excel spreadsheets for multiple staffed homes and associated programs. This process is:

Labor-intensive

Error-prone

Difficult to audit

Hard to update mid-month

Not visible in real time to managers

The goal is to replace this workflow with a low-friction, web-based availability capture system that:

Enforces union rules

Reduces administrative effort

Produces equivalent Excel outputs

Provides live, on-screen visibility for managers

Supports auditability and controlled corrections

## 2. Scope (v1)

In scope

Monthly availability capture (system-wide, per employee)

Program Assignment, alternate program assignment and orientation training.

Seniority-based ordering

Availability closes at 23:59 local time on the 15th; lock/snapshot executes at 00:00 on the 16th.

Controlled post-lock corrections with audit

Excel export per PROGRAM GROUP

PROGRAM GROUPS included one or more programs that share staff availability.

Live on-screen availability views

Submission monitoring dashboards

Confirmation of understanding section

Administrator ability to update text for understanding confirmation

Ability for employees to confirm agreement with a checkbox (on availability form)

Log of employees confirmation of understanding

Automated email reminders to complete availability for upcoming month.

Secure sign-on

Out of scope (v1)

Automatic callout workflows

SMS/voice automation

Partial-day time ranges

“Call me only if no one else available” (future v2)

Overtime calculation logic

## 3. Core Business Rules

### 3.1 Availability Submission

Employees submit system-wide availability for the succeeding month.

Availability closes at 23:59 local time on the 15th; lock executes at 00:00 on the 16th.

Availability is entered once per month, not per program.

Availability options per day:

A = Available for all shifts

Any combination of D, E, OS, ON

N/A = Not Available

If A is selected, no other shift codes are required.

Any unmarked days are set to N/A when saved. The employee can also tick N/A, which removes all other options if ticked.

Multiple shift codes (D, E, OS, ON) per day are allowed.

Employees who did not declare availability may only be contacted after all eligible employees who declared availability (including those marked unavailable) have been exhausted.

### 3.2 Monthly Availability Window

Employees can enter availability for the next 12 months.

Availability closes at 23:59 local time on the 15th; lock executes at 00:00 on the 16th.

Use temporal tables to determine availability on the 16th (Effective Date Versioning)

Temporal Tables (Effective Date Versioning)

This is the "Gold Standard" for applications where seniority and audit trails are critical. Instead of overwriting a row, you treat data as a series of time-bound records.

How it works: You add two columns to your availability table: effective_start and effective_end.

The Logic: When a user updates their availability, you don't UPDATE the row. You SET effective_end = now() on the old row and INSERT a new row with the new availability.

Snapshotting: To see what the schedule looked like on the 15th, you simply query: SELECT * FROM availability WHERE '2026-01-15' BETWEEN effective_start AND effective_end;

### 3.3 Post-Lock Behavior

After lock (Effective Date Versioning):

Employees may submit availability for the month, but it will be considered a resubmission, overriding the previous on time submissions.

A warning dialog box must be presented to the users.

The submission should be flagged for manager review.

Such submissions are marked late (if not approved) and place the employee at the bottom of the list.

Persist both

Only ranking uses the latest state

The bottom of the list is sort by submission date not seniority.

Eligibility approval determines list inclusion only; availability approval alone determines whether an employee may regain seniority-based ranking.

A manager may approve a late submission:

Manager can Approve/Deny re-instatement with a reason code and comment and the managers assessment is time stamped with user_id and logged.

Reason codes:

Reason Code		Database Slug	Impact on Seniority	Required Proof

Technical Error	TECH_ERR		Full Restoration	IT Ticket # or Screenshot

Human Rights	HR_ACCOM		Full Restoration	Confidential

Medical/Family Note

Compassionate	EXT_CIRC		Full Restoration	Manager Note

Operational		OP_NECESS		Shift-Specific		Staffing Gap Report

Mutual Agreement	UNION_WAIV		Full Restoration	Steward Name & Date

Once approved, the employee immediately regains normal ranking.

Availability lock applies only to availability entries, not eligibility.

## 4. Eligibility, Programs, Program Groups, and Training

### 4.1 Programs

“Programs” represent:

Staffed homes

Day programs

The manager/administrator needs the ability to create programs

Employees are assigned to primary programs.

Employees are assigned to secondary programs.

Employees assigned to secondary programs with current training appear on the Availability List On-screen or Exported/Printed in the section called “Staff Also Trained”

### 4.2 Program Groups

Program Groups are the unit of printing and operational use.

Program Groups consist of 1 or more programs that share a list of available staff.

The manager/administrator needs the ability to Program Groups

The manager/administrator needs the ability to assign Programs toProgram Groups

A Program Group defines:

A shared pool of eligible employees

### 4.3 Employee Eligibility

Eligibility is admin managed.

Employees can be eligible in multiple Program Groups for the availability lists.

Eligibility is effective dated (day resolution).

Eligibility changes may occur mid-month:

Must include an audit note if after availability lock.

Take effect immediately for exports and live views.

If an employee becomes eligible mid-month and has submitted availability:

They appear with normal seniority ranking (not bottom) if approved by manager.

### 4.4 Training

Training is tracked per employee per program.

Training/skills includes:

Training name

Training description

Status (trained / restricted / not trained)

Date of last training

Training affects eligibility, not availability entry.

Add checkbox for Current Drivers License to employee record.

Add checkbox for Current Class 4 Drivers License to employee record.

## 5. Employee Classification & Ranking

### 5.1 Employment Classes

Employees belong to one of:

Part-time

Casual

Trained (external pool requiring approval at callout time)

Full-time (generally excluded from availability lists)

### 5.2 Seniority

Seniority is stored as hours worked on the employee record.

Seniority is also stored as start-date for Full-time employees.

Updated administratively every 6 months.

Previous seniority values are not retained.

### 5.3 Ranking Rules (per list)

Employees are ordered by:

Employment class:

Full-time (If Full-time employees are configured to appear, they rank above Part-time. This is added here for a v2.)

Part-time

Casual

Seniority (hours worked) when submission states are:

On-time submissions

Or Late submissions have been manager-approved.

Submission date if:
Late submissions (unapproved) → and display at the bottom.

Seniority hours (descending)

Name (tie-breaker)

If an employee is Part-time in a Program Group, they will be designated Casual in all other Program Groups (This can be set when managers/administrators add employees to programs.)

## 6. Inclusion Rules (Who Appears on Lists)

An employee appears on a program’s availability list if:

They are linked to a Program within a Program Group with a designation of Part-time, Casual, or Trained.

They have submitted availability for the month (even if late) and even if completely unavailable.

Employees who never submitted availability do not appear and are considered unavailable.

Full-time employees do not appear unless explicitly configured.

## 7. Employee User Experience (UX)

### 7.1 Employee Design Goals

Mobile-first

60–120 seconds to complete

Minimal cognitive load

Users need to be able at the start to choose a period to update for availability.

The system should default to the current period if the user has not yet set availability.

The system should default to the next open period.

Users can update up to 12 months in advance.

The page for users to declare availability should display:

Employee name (Read Only):

Contact phone number(s): (Ability to add and update)

Specify primary or alternate

Specify ability to accept text messages

Specify type: Mobile, Home, Other

Confirm Drivers License and willingness to drive

Confirm Class 4 Drivers License

Assigned programs:

< Program Name > < Primary >

< Program Name > < Primary >

Additional programs oriented at:

< Program Name > < Primary >

< Program Name > < Primary >

“Availability Legend” should display

A = Available

D = Day

E = Evening

OS = Overnight Sleep

OA = Overnight Awake

N/A = Not Available

Each day of the selected month in a vertical list.

The day’s date.

The date format <day of the week, month date, year>

If the date is a statutory holiday in the organizations location it should follow the date clearly offset by color.

Checkboxes to set availability.

Confirmation of Understanding Section

“I have read & understand Policy 8.24 Casual Availability” (Checkbox), add record of acceptance, with user_id, date.

“I understand that not returning phone calls for a shift will be considered” (Checkbox), add record of acceptance, with user_id, date.

“I understand that it is my responsibility to tell Program Managers of instance where accepting casual hours will result in overtime rate of pay.” (Checkbox), add record of acceptance, with user_id, date.

“I want to be scheduled up to 6 days in a week to pick up additional hours to a maximum of 8 hours per day or 40 hours per week.”, add record of acceptance, with user_id, date.

When the page is saved:

Any unmarked days are set to N/A = Not Available.

Confirmation of Understanding Sections are logged. (No need to log, before save.)

Example:

Hi Dave,

Please confirm your program, availability and contact information for February 2026.

David Fincher

Contact numbers:

Primary Mobile +1 555-555-5555 	Text Messages

Alternate Home +1 555-555-5556 	Text Messages

Alternate Other +1 555-555-5557 	Text Messages

I have a valid drivers license and am willing to drive

I have a class 4 diver’s license 

Assigned programs:

< Program Name > < Assigned >

< Program Name > < Assigned >

< Program Name > < Assigned >

< Program Name > < Assigned >

Additional programs oriented at:

< Program Name > < Additional >

< Program Name > < Additional >

Please set your availability for January 2026. Availability will automatically lock after December 15th for January schedule planning and availability lists.

<Choose Month to enter availability>

Set for month

A  	D  	E 	OS  	OA  	N/A

Thursday, January 1st, 2026 New Years Day

A  	D  	E 	OS  	OA 	N/A

Friday, January 2nd, 2026

A  	D  	E 	OS  	OA 	N/A

Saturday, January 3rd, 2026

A  	D  	E 	OS  	OA 	N/A

Sunday, January 4th, 2026

A  	D  	E 	OS  	OA 	N/A

Monday, January 5th, 2026

A  	D  	E 	OS  	OA 	N/A

Tuesday, January 6th, 2026

A  	D  	E 	OS  	OA 	N/A

Wednesday, January 7th, 2026

A  	D  	E 	OS  	OA 	N/A

Button < Repeat Last 7 Days >

Help Text: "Copies the entries from the previous 7 days and applies them to all remaining dates in the current month."

Thursday, January 8th, 2026

A  	D  	E 	OS  	OA 	N/A

Friday, January 9th, 2026

A  	D  	E 	OS  	OA 	N/A

…

Saturday, January 31st, 2026

A  	D  	E 	OS  	OA  N/A

“I have read & understand Policy 8.24 Casual Availability” (Checkbox), add record of acceptance, with user_id, date. (Need link or<Save> ability to show Policy 8.24 Casual Availability)

“I understand that not returning phone calls for a shift will be considered” (Checkbox), add record of acceptance, with user_id, date.

“I understand that it is my responsibility to tell Program Managers of instance where accepting casual hours will result in overtime rate of pay.” (Checkbox), add record of acceptance, with user_id, date.

“I want to be scheduled up to 6 days in a week to pick up additional hours to a maximum of 8 hours per day or 40 hours per week.”, add record of acceptance, with user_id, date.

<Submit button>

### 7.1.5 Speed Features

After the first 7 days of the month place a button asking the user if they would like to repeat the pattern. (Maybe this unlocks a button at the top of the list.)

Multi-select days and apply availability in one action.

Manual per-day editing.

### 7.1.6 Month Selector

Month selector must show:

Open

Locked

Late-submission state

Disable bulk actions across locked boundaries

### 7.1.7 Lock Awareness

Clear indication of:

Submission deadline

Locked state

Late submission consequences

### 7.2 Administrator Settings

Update/Insert Acceptance Text

“I have read & understand Policy 8.24 Casual Availability” (Checkbox), add record of acceptance, with user_id, date.

“I understand that not returning phone calls for a shift will be considered” (Checkbox), add record of acceptance, with user_id, date.

“I understand that it is my responsibility to tell Program Managers of instance where accepting casual hours will result in overtime rate of pay.” (Checkbox), add record of acceptance, with user_id, date.

“I want to be scheduled up to 6 days in a week to pick up additional hours to a maximum of 8 hours per day or 40 hours per week.”, add record of acceptance, with user_id, date.

Set address for organisation (Statutory Holiday’s by State Province could be set by API based on location.)

Set time zone for organisation (Lock will be local time, not server)

Storage = org timezone

Display = org timezone (recommended)

## 8. Manager & Admin Capabilities

### 8.1 Submission Monitoring

Managers need dashboards to view:

Submission status by:

Month

Employee

Program

Availability List Group

States include:

Not submitted

Submitted on time

Submitted late (approved/unapproved)

### 8.2 Corrections & Overrides

Managers/admins may:

Approve late availability submissions

Correct eligibility or training

All post-lock changes require:

Mandatory audit note

Immediate effect on views and exports

## 9. Live On-Screen Availability View

### 9.1 Purpose

Provide a real-time planning view that replaces ad-hoc spreadsheet viewing.

### 9.2 Behavior

Not constrained to Excel layout.

No column wrapping.

Default view:

Starts at today

Displays a rolling horizon (e.g., 31 days)

Horizontal scrolling across days.

Automatically rolls in the next month if past the 15th.

Optional month selector dropdown.

Cell values:

A or comma-separated shift codes (D, E, OS, OA).

N/A if no availability is declared for the day, or user chose N/A (and it removes other shift codes.)

### 9.3 Layout

Rows grouped by:

Part-time

Casual

Staff also Trained

Late Submissions

Not Submitted

This section, with employees listed, can appear for managers. (On-screen only)

Sticky employee names and seniority.

Read-only for all staff and managers in this view.

## 10. Excel Export Requirements

### 10.1 Purpose

Maintain continuity with current operational workflows.

### 10.2 Behavior

Exports/Prints are by Program Group.

Uses the Program Group Availability List to determine eligible employees.

Matches current spreadsheet semantics.

### 10.3 Formatting

Days 1–15 in first block.

Days 16–end of month in second block.

Employee list repeated for printability.

Cell values:

A or comma-separated shift codes (D, E, OS, OA).

N/A is no availability; it is declared for the day if the employee has not declared availability or the employee chooses the N/A checkbox.

### 10.4 Reprints

Any export reflects:

Current eligibility

Current approval state

Current seniority

Reprinting mid-month is expected and supported.

## 11. Audit & Compliance

### 11.1 Audit Logging

Audit records must capture:

Who made the change

When (Temporal Tables)

What changed (before/after)

Required note for:

Late approvals

Post-lock eligibility changes

Training corrections

Log acceptance, but do not bind it to text version.

Use acceptance_text_id or hash

Never overwrite historical text

### 11.2 Lock Enforcement

Availability lock is enforced system-side.

Late submissions are explicitly flagged.

Eligibility changes remain allowed with audit.

## 12. Automation & Lifecycle

### 12.1 Scheduled Events

7th email a reminder to employees to update their availability

15th email a reminder to employees the schedule locks at the end of the day.

16th at 00:00 the availability for the succeeding month is snapshotted and locked.

### 12.2 Versioning

Eligibility is effective dated.

Rows are immutable

New rows allowed with late/override flags

Snapshot queries always use effective date + state filter

12.3

Live view shows forecast availability

Export shows locked month only

Next month staff = last locked month submitters only

Questions answered by BA

The following questions must be validated before final implementation:

Rolling Horizon

How many days forward should the live view display by default (30 / 45 / 60)? 31

Late Approval Authority

Manager & Administrator are approved to authorize late submissions.

Export Retention (Override previous assumptions)

Do printed/exported lists need to be archived for audit purposes? No.

The data in the system needs to be store for a minimum of 6 months.

## 13. Summary

This v1 system:

Preserves union rules

Reduces administrative overhead

Improves visibility and fairness

Supports real-world mid-month corrections

Creates a clean foundation for future callout automation

## 14. Security

Roles:

Employee was used previously in the document to referred to non-managers. This role in security should be defined as:

Residential Care Worker (RCW) & Vocational Trainer

Access to their own employee record

No visibility in this system to other employees, employee record.

For v1 Managers and Administrators have full access to the system.
