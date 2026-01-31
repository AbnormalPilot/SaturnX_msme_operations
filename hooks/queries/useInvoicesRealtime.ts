import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useInvoicesRealtime(userId: string | null | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    console.log('[Real-time] Setting up invoices subscription for user:', userId);

    const channel: RealtimeChannel = supabase
      .channel('invoices-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Real-time] Invoice change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['invoices', userId] });
          queryClient.invalidateQueries({ queryKey: ['sales-stats'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoice_items',
        },
        (payload) => {
          console.log('[Real-time] Invoice item change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['invoices'] });
        }
      )
      .subscribe((status) => {
        console.log('[Real-time] Invoices subscription status:', status);
      });

    return () => {
      console.log('[Real-time] Cleaning up invoices subscription');
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
