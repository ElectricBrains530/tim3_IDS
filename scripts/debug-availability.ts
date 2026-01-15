
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { AvailabilityApi } from '../packages/features/tim3/src/services/availability';

dotenv.config({ path: 'apps/web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key');
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseKey);

async function validUUID(uuid: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

async function main() {
  console.log('Testing Availability API...');
  
  // 1. Get a user
  const { data: { users }, error } = await client.auth.admin.listUsers();
  if (error || !users || users.length === 0) {
    console.error('No users found', error);
    return;
  }
  
  const user = users[0];
  console.log('Testing with user:', user.id, user.email);
  
  if (!validUUID(user.id)) {
      console.error('User ID is NOT a UUID:', user.id);
  }

  const api = new AvailabilityApi(client);
  
  const startDate = '2026-02-01';
  const endDate = '2026-02-28';
  
  try {
    const entries = await api.getAvailability({
      userId: user.id,
      startDate,
      endDate
    });
    console.log('Entries:', entries);
  } catch (e: any) {
    console.error('Error fetching availability:', e);
    console.error('Error details:', e.message, e.details, e.hint);
  }
}

main();
