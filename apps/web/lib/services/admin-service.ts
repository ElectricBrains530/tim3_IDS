import { SupabaseClient } from '@supabase/supabase-js';

// Define the table name
const SUPER_ADMINS_TABLE = 'super_admins';

/**
 * Checks if a user is a super admin.
 * @param client SupabaseClient
 * @param userId string
 * @returns Promise<boolean>
 */
export async function isSuperAdmin(
    client: SupabaseClient,
    userId: string
): Promise<boolean> {
    const { data, error } = await client
        .from(SUPER_ADMINS_TABLE)
        .select('id')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        console.error('Error checking super admin status:', error);
        return false;
    }

    return !!data;
}

/**
 * Lists all super admins.
 * @param client SupabaseClient
 * @returns Promise<string[]> Array of user IDs
 */
export async function getSuperAdmins(client: SupabaseClient): Promise<string[]> {
    const { data, error } = await client.from(SUPER_ADMINS_TABLE).select('id');

    if (error) {
        console.error('Error fetching super admins:', error);
        return [];
    }

    return data.map((admin) => admin.id);
}
