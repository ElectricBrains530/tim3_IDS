import { SupabaseClient } from '@supabase/supabase-js';

// We need to import Database from @kit/supabase/database to get proper typing
// However, since we haven't generated the types for our new tables yet in the main package,
// we might have to cast or use 'any' temporarily for the new tables until `npm run codegen` is run.
// For now, we'll try to use the generic client but strictly type our inputs/outputs.
import { Database } from '@kit/supabase/database';

import { AvailabilityEntry } from '../types';

export class AvailabilityApi {
  constructor(private readonly client: SupabaseClient<Database>) {}

  /**
   * Fetches availability entries for a specific user within a date range.
   */
  async getAvailability(params: {
    userId: string;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
  }): Promise<AvailabilityEntry[]> {
    const { data, error } = await this.client
      .from('availability_entries')
      .select('*')
      .eq('user_id', params.userId)
      .gte('date', params.startDate)
      .lte('date', params.endDate)
      // Only get current versions
      .eq('effective_end', 'infinity');

    if (error) {
      throw error;
    }

    return (data as unknown) as AvailabilityEntry[];
  }

  /**
   * Saves availability entries.
   * Logic:
   * 1. Check for existing entries on these dates for this user.
   * 2. Update them if they exist (or set effective_end if strict temporal).
   * 3. Insert new ones if they don't.
   *
   * For v1 MVP: We will use a naive "Upsert by Date" strategy.
   * Since we don't have a unique constraint on (user_id, date) in the schema yet (just an index),
   * strictly speaking `upsert` might fail or duplicate.
   *
   * SAFE STRATEGY: Fetch existing -> Update IDs / Insert New.
    */
  async saveAvailability(params: {
    userId: string;
    entries: Partial<AvailabilityEntry>[];
  }) {
    // 1. Get dates we are trying to save
    const dates = params.entries.map((e) => e.date).filter(Boolean) as string[];

    if (dates.length === 0) return;

    // 2. Find existing entries for these dates
    const { data: existingData, error: fetchError } = await this.client
        .from('availability_entries')
        .select('id, date')
        .eq('user_id', params.userId)
        .in('date', dates)
        .eq('effective_end', 'infinity');

    if (fetchError) throw fetchError;

    const existingMap = new Map<string, string>(); // Date -> ID
    existingData?.forEach((row: { id: string, date: string }) => {
        existingMap.set(row.date, row.id);
    });

    const toInsert = [];
    const toUpdate = [];

    for (const entry of params.entries) {
        if (!entry.date) continue;

        const existingId = existingMap.get(entry.date);

        if (existingId) {
            toUpdate.push({
                ...entry,
                id: existingId,
                updated_at: new Date().toISOString(), // Assuming we want to track update time
            });
        } else {
             // Clean up entry for insert (remove undefined ID)
             const { id, ...rest } = entry;
             toInsert.push({
                 ...rest,
                 user_id: params.userId,
                 effective_start: new Date().toISOString(),
                 effective_end: 'infinity'
             });
        }
    }

    // Execute Operations
    const operations = [];

    if (toInsert.length > 0) {
        operations.push(this.client.from('availability_entries').insert(toInsert));
    }

    if (toUpdate.length > 0) {
        // Supabase upsert requires primary key match.
        operations.push(this.client.from('availability_entries').upsert(toUpdate));
    }

    await Promise.all(operations);
  }
}

export function createAvailabilityApi(client: SupabaseClient<Database>) {
  return new AvailabilityApi(client);
}
