import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useProductsRealtime(userId: string | null | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    console.log('[Real-time] Setting up products subscription for user:', userId);

    const channel: RealtimeChannel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Real-time] Product change detected:', payload);

          // Invalidate queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['products', userId] });

          // Optionally, you can handle specific events differently:
          // if (payload.eventType === 'INSERT') {
          //   // Handle new product
          // } else if (payload.eventType === 'UPDATE') {
          //   // Handle product update
          // } else if (payload.eventType === 'DELETE') {
          //   // Handle product deletion
          // }
        }
      )
      .subscribe((status) => {
        console.log('[Real-time] Subscription status:', status);
      });

    return () => {
      console.log('[Real-time] Cleaning up products subscription');
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
