import { useCallback } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';

export function usePersonalAccountData(
  userId: string,
  partialAccount?: {
    id: string | null;
    name: string | null;
    picture_url: string | null;
  },
) {
  const client = useSupabase();
  const queryKey = ['account:data', userId];

  const queryFn = async () => {
    if (!userId) {
      return null;
    }

    const response = await client
      .from('accounts')
      .select(
        `
        id,
        name,
        picture_url
    `,
      )
      .eq('id', userId)
      .maybeSingle();

    if (response.error) {
      throw response.error;
    }

    if (!response.data) {
      throw new Error('Account not found (Row is missing in public.accounts). Please contact support or try signing up again.');
    }

    return response.data;
  };

  return useQuery({
    queryKey,
    queryFn,
    enabled: !!userId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    initialData: partialAccount?.id
      ? {
        id: partialAccount.id,
        name: partialAccount.name,
        picture_url: partialAccount.picture_url,
      }
      : undefined,
  });
}

export function useRevalidatePersonalAccountDataQuery() {
  const queryClient = useQueryClient();

  return useCallback(
    (userId: string) =>
      queryClient.invalidateQueries({
        queryKey: ['account:data', userId],
      }),
    [queryClient],
  );
}
