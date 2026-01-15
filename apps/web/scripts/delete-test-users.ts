
/**
 * Run this script to delete the test users from the database.
 * 
 * Usage:
 * pnpm --filter web db:reset-test-users
 */
import { createClient } from '@supabase/supabase-js';

const EMAILS_TO_DELETE = [
    'warraklightbringer@gmail.com',
    'dev@electricbrains.ai',
    'des@electricbrains.ai',
];

async function main() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
        console.error('Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
        process.exit(1);
    }

    console.log('Initializing Supabase Admin Client...');
    const supabase = createClient(url, serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    });

    console.log('Listing users...');
    const { data: { users }, error } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
    });

    if (error) {
        console.error('Error listing users:', error);
        process.exit(1);
    }

    console.log(`Found ${users.length} users.`);

    for (const email of EMAILS_TO_DELETE) {
        const user = users.find((u: any) => u.email === email);

        if (user) {
            console.log(`Deleting user: ${email} (ID: ${user.id})`);
            const { error: deleteError } = await supabase.auth.admin.deleteUser(
                user.id
            );

            if (deleteError) {
                console.error(`Failed to delete user ${email}:`, deleteError);
            } else {
                console.log(`Successfully deleted user: ${email}`);
            }
        } else {
            console.log(`User not found: ${email}`);
        }
    }
}

main().catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
