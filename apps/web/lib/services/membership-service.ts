import { SupabaseClient } from '@supabase/supabase-js';

export type MembershipRole = 'owner' | 'manager' | 'employee';

// Table names
const MEMBERSHIPS_TABLE = 'memberships';
const LOCATION_ASSIGNMENTS_TABLE = 'location_assignments';

/**
 * Gets the membership role for a user in an account.
 * @param client SupabaseClient
 * @param accountId string
 * @param userId string
 * @returns Promise<MembershipRole | null>
 */
export async function getMembershipRole(
    client: SupabaseClient,
    accountId: string,
    userId: string
): Promise<MembershipRole | null> {
    const { data, error } = await client
        .from(MEMBERSHIPS_TABLE)
        .select('role')
        .eq('account_id', accountId)
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
        console.error('Error fetching membership role:', error);
        return null;
    }

    return data?.role as MembershipRole | null;
}

/**
 * Assigns a user to a specific location.
 * @param client SupabaseClient
 * @param locationId string
 * @param userId string
 * @returns Promise<{ success: boolean; error?: any }>
 */
export async function assignUserToLocation(
    client: SupabaseClient,
    locationId: string,
    userId: string
) {
    const { error } = await client
        .from(LOCATION_ASSIGNMENTS_TABLE)
        .insert({ location_id: locationId, user_id: userId });

    if (error) {
        console.error('Error assigning user to location:', error);
        return { success: false, error };
    }

    return { success: true };
}

/**
 * Removes a user from a specific location.
 * @param client SupabaseClient
 * @param locationId string
 * @param userId string
 * @returns Promise<{ success: boolean; error?: any }>
 */
export async function removeUserFromLocation(
    client: SupabaseClient,
    locationId: string,
    userId: string
) {
    const { error } = await client
        .from(LOCATION_ASSIGNMENTS_TABLE)
        .delete()
        .eq('location_id', locationId)
        .eq('user_id', userId);

    if (error) {
        console.error('Error removing user from location:', error);
        return { success: false, error };
    }

    return { success: true };
}
