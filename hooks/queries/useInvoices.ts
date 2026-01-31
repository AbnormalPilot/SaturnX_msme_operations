import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  cost_price: number;
  gst_rate?: number;
  total: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  invoice_number: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  items: InvoiceItem[];
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  payment_method: 'Cash' | 'UPI' | 'Credit' | 'Card';
  notes?: string;
  status: 'draft' | 'paid' | 'pending';
  created_at: string;
  updated_at?: string;
}

export interface InvoiceFilters {
  status?: 'draft' | 'paid' | 'pending';
  customer_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

async function fetchInvoices(userId: string, filters?: InvoiceFilters): Promise<Invoice[]> {
  let query = supabase
    .from('invoices')
    .select(`
      *,
      invoice_items (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.customer_id) {
    query = query.eq('customer_id', filters.customer_id);
  }

  if (filters?.date_from) {
    query = query.gte('created_at', filters.date_from);
  }

  if (filters?.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  if (filters?.search) {
    query = query.or(`invoice_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Transform nested items
  return (data || []).map((invoice: any) => ({
    ...invoice,
    items: invoice.invoice_items || [],
  }));
}

async function fetchInvoice(invoiceId: string): Promise<Invoice> {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      invoice_items (*)
    `)
    .eq('id', invoiceId)
    .single();

  if (error) throw error;

  return {
    ...data,
    items: data.invoice_items || [],
  };
}

async function getSessionUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id || null;
}

async function generateInvoiceNumber(userId: string): Promise<string> {
  // Get the count of invoices for this user
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const invoiceCount = (count || 0) + 1;
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);

  return `INV-${year}${month}-${String(invoiceCount).padStart(4, '0')}`;
}

export function useInvoices(filters?: InvoiceFilters) {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const invoicesQuery = useQuery({
    queryKey: ['invoices', sessionQuery.data?.user.id, filters],
    queryFn: () => fetchInvoices(sessionQuery.data!.user.id, filters),
    enabled: !!sessionQuery.data?.user.id,
  });

  return {
    ...invoicesQuery,
    userId: sessionQuery.data?.user.id,
  };
}

export function useInvoice(invoiceId: string) {
  return useQuery({
    queryKey: ['invoices', invoiceId],
    queryFn: () => fetchInvoice(invoiceId),
    enabled: !!invoiceId,
  });
}

export function useInvoiceMutations() {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const createInvoice = useMutation({
    mutationFn: async (invoice: {
      customer_id?: string;
      customer_name?: string;
      customer_phone?: string;
      items: InvoiceItem[];
      payment_method: 'Cash' | 'UPI' | 'Credit' | 'Card';
      notes?: string;
      status?: 'draft' | 'paid' | 'pending';
    }) => {
      const userId = await getSessionUserId();
      if (!userId) throw new Error('User not authenticated');

      // Generate invoice number
      const invoiceNumber = await generateInvoiceNumber(userId);

      // Calculate totals
      const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
      const gstAmount = invoice.items.reduce((sum, item) => {
        const gstRate = item.gst_rate || 0;
        return sum + (item.total * gstRate) / 100;
      }, 0);
      const totalAmount = subtotal + gstAmount;

      // Create invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: userId,
          invoice_number: invoiceNumber,
          customer_id: invoice.customer_id,
          customer_name: invoice.customer_name,
          customer_phone: invoice.customer_phone,
          subtotal,
          gst_amount: gstAmount,
          total_amount: totalAmount,
          payment_method: invoice.payment_method,
          notes: invoice.notes,
          status: invoice.status || 'paid',
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const itemsToInsert = invoice.items.map((item) => ({
        invoice_id: invoiceData.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        cost_price: item.cost_price,
        gst_rate: item.gst_rate,
        total: item.total,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Update product stock for each item
      for (const item of invoice.items) {
        const { data: product } = await supabase
          .from('products')
          .select('quantity')
          .eq('id', item.product_id)
          .single();

        if (product) {
          await supabase
            .from('products')
            .update({ quantity: product.quantity - item.quantity })
            .eq('id', item.product_id);
        }
      }

      // Invalidate products cache
      queryClient.invalidateQueries({ queryKey: ['products'] });

      return {
        ...invoiceData,
        items: invoice.items,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const updateInvoice = useMutation({
    mutationFn: async ({ invoiceId, updates }: {
      invoiceId: string;
      updates: Partial<Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'items'>>
    }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const deleteInvoice = useMutation({
    mutationFn: async (invoiceId: string) => {
      // Fetch invoice items to restore stock
      const { data: invoice } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_items (*)
        `)
        .eq('id', invoiceId)
        .single();

      // Restore stock
      if (invoice?.invoice_items) {
        for (const item of invoice.invoice_items) {
          const { data: product } = await supabase
            .from('products')
            .select('quantity')
            .eq('id', item.product_id)
            .single();

          if (product) {
            await supabase
              .from('products')
              .update({ quantity: product.quantity + item.quantity })
              .eq('id', item.product_id);
          }
        }
      }

      // Delete invoice items first
      await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId);

      // Then delete invoice
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;
      return invoiceId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return {
    createInvoice,
    updateInvoice,
    deleteInvoice,
  };
}

// Hook to get sales statistics
export function useSalesStats(period: 'today' | 'yesterday' | 'month') {
  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  return useQuery({
    queryKey: ['sales-stats', sessionQuery.data?.user.id, period],
    queryFn: async () => {
      if (!sessionQuery.data?.user.id) throw new Error('User not authenticated');

      const now = new Date();
      let dateFrom: Date;

      if (period === 'today') {
        dateFrom = new Date(now.setHours(0, 0, 0, 0));
      } else if (period === 'yesterday') {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        dateFrom = new Date(yesterday.setHours(0, 0, 0, 0));
      } else {
        // month
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          total_amount,
          invoice_items (
            cost_price,
            quantity
          )
        `)
        .eq('user_id', sessionQuery.data.user.id)
        .eq('status', 'paid')
        .gte('created_at', dateFrom.toISOString());

      if (error) throw error;

      const revenue = data.reduce((sum, invoice) => sum + invoice.total_amount, 0);
      const cost = data.reduce((sum, invoice) => {
        const invoiceCost = (invoice.invoice_items || []).reduce(
          (itemSum: number, item: any) => itemSum + (item.cost_price * item.quantity),
          0
        );
        return sum + invoiceCost;
      }, 0);

      return {
        revenue,
        profit: revenue - cost,
        cost,
      };
    },
    enabled: !!sessionQuery.data?.user.id,
  });
}
