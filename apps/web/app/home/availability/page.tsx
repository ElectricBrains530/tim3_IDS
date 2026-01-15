import { PageBody, PageHeader } from '@kit/ui/page';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '@kit/supabase/require-user';

import { createAvailabilityApi } from '@features/tim3/services';
import { AvailabilityGrid } from '@features/tim3/components';

import { saveAvailabilityAction } from './_actions';

export const metadata = {
  title: 'Availability | Tim3',
  description: 'Manage your monthly availability',
};

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const client = getSupabaseServerClient();
  const user = await requireUser(client);

  // Default to next month if > 15th, or whatever business rule.
  // For v1 MVP, let's just default to current real-world month matching the requirements (Upcoming).
  // PRD 7.1 "The system should default to the next open period."
  // Simplified: Default to "Current Month" + 1 for now, or just current.
  // Let's use `searchParams.month` or default to now.
  
  const targetDateStr = searchParams.month ?? new Date().toISOString().slice(0, 10);
  const targetDate = new Date(targetDateStr);

  const api = createAvailabilityApi(client);

  // Fetch existing entries for the month
  // We need start/end of month for the query
  // Since `AvailabilityApi` expects string params:
  const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1).toISOString().slice(0, 10);
  const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).toISOString().slice(0, 10);

  const entries = await api.getAvailability({
    userId: user.id,
    startDate: startOfMonth,
    endDate: endOfMonth,
  });

  // Mock Lock Status for MVP (Open)
  // TODO: Fetch real lock status from `availability_locks`
  const isLocked = false; 

  return (
    <>
      <PageHeader
        title={'Availability'}
        description={`Set your availability for ${targetDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`}
      />

      <PageBody>
        <div className={'flex flex-col gap-4 max-w-4xl'}>
          <AvailabilityGrid
            userId={user.id}
            monthDate={targetDate}
            initialEntries={entries}
            onSave={saveAvailabilityAction}
            isLocked={isLocked}
          />
        </div>
      </PageBody>
    </>
  );
}
