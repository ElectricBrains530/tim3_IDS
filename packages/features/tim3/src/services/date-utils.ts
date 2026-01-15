import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  startOfMonth,
  addDays,
  isSameMonth,
  parseISO
} from 'date-fns';

import { AvailabilityEntry, AvailabilityStatus } from '../types';

/**
 * Returns an array of Date objects for the entire month containing the given date.
 */
export function getMonthDays(date: Date | string): Date[] {
  const targetDate = typeof date === 'string' ? parseISO(date) : date;
  const start = startOfMonth(targetDate);
  const end = endOfMonth(targetDate);

  return eachDayOfInterval({ start, end });
}

/**
 * Helper to identify if a date is a weekend (0=Sun, 6=Sat)
 */
export function isWeekend(date: Date): boolean {
  const day = getDay(date);
  return day === 0 || day === 6;
}

/**
 * Patterns for "Copy Previous Week".
 *
 * Logic:
 * 1. Identify the first 7 days of the month (Days 1-7).
 * 2. Create a map of { DayOfWeek (0-6) -> AvailabilityStatus }.
 * 3. Iterate through Day 8 to EndOfMonth.
 * 4. Apply the status from the map corresponding to the day of the week.
 *
 * @param entries Existing entries for the month (should contain at least first 7 days)
 * @param monthDate The month we are operating on
 * @param userId The user ID to assign to new entries
 */
export function generateCopyWeekEntries(
  entries: AvailabilityEntry[],
  monthDate: Date,
  userId: string
): AvailabilityEntry[] {
  const allDays = getMonthDays(monthDate);
  const firstWeek = allDays.slice(0, 7);

  // Map DayOfWeek (0=Sun, 1=Mon...) to Status
  const patternMap = new Map<number, AvailabilityStatus>();

  firstWeek.forEach((day, index) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const entry = entries.find((e) => e.date === dayStr);
    const dayOfWeek = getDay(day);

    // Default to 'NA' if not set in the first week, or use the set value
    patternMap.set(dayOfWeek, entry ? entry.status_code : 'NA');
  });

  const newEntries: AvailabilityEntry[] = [];

  // Apply to rest of month (starting from index 7, i.e., Day 8)
  for (let i = 7; i < allDays.length; i++) {
    const currentDay = allDays[i];
    const dayOfWeek = getDay(currentDay);
    const status = patternMap.get(dayOfWeek) || 'NA';
    const dateStr = format(currentDay, 'yyyy-MM-dd');

    // Create new entry
    newEntries.push({
      id: `generated-${dateStr}`, // Placeholder ID, will be handled by backend/upsert
      user_id: userId,
      date: dateStr,
      status_code: status,
      is_late_submission: false,
      effective_start: new Date().toISOString(),
      effective_end: 'infinity',
      created_by: userId,
      created_at: new Date().toISOString(),
    });
  }

  return newEntries;
}
