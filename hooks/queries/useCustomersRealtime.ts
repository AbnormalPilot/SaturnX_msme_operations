import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useCustomersRealtime(userId: string | null | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    console.log('[Real-time] Setting up customers subscription for user:', userId);

    const channel: RealtimeChannel = supabase
      .channel('customers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Real-time] Customer change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['customers', userId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_transactions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Real-time] Customer transaction change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['customer-transactions'] });
          queryClient.invalidateQueries({ queryKey: ['customers', userId] });
        }
      )
      .subscribe((status) => {
        console.log('[Real-time] Customers subscription status:', status);
      });

    return () => {
      console.log('[Real-time] Cleaning up customers subscription');
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
