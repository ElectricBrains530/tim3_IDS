'use server';

import { revalidatePath } from 'next/cache';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '@kit/supabase/require-user';

import { createAvailabilityApi } from '@features/tim3/services';
import { AvailabilityEntry } from '@features/tim3/types';

export async function saveAvailabilityAction(entries: AvailabilityEntry[]) {
  const client = getSupabaseServerClient();
  const user = await requireUser(client);

  const api = createAvailabilityApi(client);

  await api.saveAvailability({
    userId: user.id,
    entries,
  });

  revalidatePath('/home/availability');
}
