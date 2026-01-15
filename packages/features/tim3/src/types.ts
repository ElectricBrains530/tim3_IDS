export type EmploymentStatus = 'Full-time' | 'Part-time' | 'Casual';
export type AssignmentType = 'Primary' | 'Alternate';
export type AvailabilityStatus = 'A' | 'D' | 'E' | 'NA'; // Available, Day, Evening, Not Available

export interface ProgramGroup {
    id: string;
    account_id: string;
    name: string;
    created_at: string;
}

export interface Program {
    id: string;
    account_id: string;
    program_group_id: string | null;
    name: string;
    metadata: Record<string, unknown>;
    created_at: string;
}

export interface Employee {
    id: string; // References auth.users(id)
    account_id: string;
    job_title: string | null;
    employment_status: EmploymentStatus | null;
    seniority_hours: number;
    seniority_start_date: string | null; // ISO Date String
    contact_primary: string | null;
    is_driver: boolean;
    created_at: string;
    updated_at: string;
}

export interface ProgramAssignment {
    id: string;
    employee_id: string;
    program_id: string;
    assignment_type: AssignmentType;
    created_at: string;
}

export interface AvailabilityEntry {
    id: string;
    user_id: string;
    date: string; // ISO Date String (YYYY-MM-DD)
    status_code: AvailabilityStatus;
    is_late_submission: boolean;
    effective_start: string; // ISO Timestamp
    effective_end: string;   // ISO Timestamp
    created_by: string | null;
    created_at: string;
}

export interface AvailabilityLock {
    id: string;
    account_id: string;
    month_date: string; // YYYY-MM-01
    is_locked: boolean;
    locked_at: string | null;
}
