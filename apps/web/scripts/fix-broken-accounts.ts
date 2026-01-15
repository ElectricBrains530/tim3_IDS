
import { createClient } from '@supabase/supabase-js';

// Re-implementing the logic from the SQL trigger in TypeScript
function getUserName(user: any) {
    let userName = user.user_metadata?.name;

    if (!userName && user.email) {
        userName = user.email.split('@')[0];
    }

    return userName || '';
}

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

    console.log(`Found ${users.length} users. Checking for missing accounts...`);

    for (const user of users) {
        // Check if account exists
        const { data: account, error: accountError } = await supabase
            .from('accounts')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

        if (accountError) {
            console.error(`Error checking account for user ${user.email}:`, accountError);
            continue;
        }

        if (!account) {
            console.log(`User ${user.email} (ID: ${user.id}) is missing an account. Creating one...`);

            const userName = getUserName(user);
            const pictureUrl = user.user_metadata?.avatar_url || null;

            const { error: insertError } = await supabase
                .from('accounts')
                .insert({
                    id: user.id,
                    name: userName,
                    email: user.email,
                    picture_url: pictureUrl,
                    public_data: {},
                });

            if (insertError) {
                console.error(`Failed to create account for ${user.email}:`, insertError);
            } else {
                console.log(`Successfully restored account for ${user.email}`);
            }
        } else {
            console.log(`User ${user.email} has an account. OK.`);
        }
    }
}

main().catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
