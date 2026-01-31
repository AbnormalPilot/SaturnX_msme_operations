import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  phone?: string;
  type: 'customer' | 'supplier';
  balance: number; // Positive = Receivable, Negative = Payable
  status: 'active' | 'settled';
  created_at: string;
  updated_at?: string;
}

export interface CustomerTransaction {
  id: string;
  user_id: string;
  customer_id: string;
  amount: number;
  type: 'gave' | 'got'; // gave = You Gave (Udhari), got = You Got (Bhugtan)
  date: string;
  description?: string;
  created_at?: string;
}

export interface CustomerFilters {
  type?: 'customer' | 'supplier';
  status?: 'active' | 'settled';
  search?: string;
}

async function fetchCustomers(userId: string, filters?: CustomerFilters): Promise<Customer[]> {
  let query = supabase
    .from('customers')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters?.type) {
    query = query.eq('type', filters.type);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

async function fetchCustomerTransactions(customerId: string): Promise<CustomerTransaction[]> {
  const { data, error } = await supabase
    .from('customer_transactions')
    .select('*')
    .eq('customer_id', customerId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function getSessionUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id || null;
}

export function useCustomers(filters?: CustomerFilters) {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const customersQuery = useQuery({
    queryKey: ['customers', sessionQuery.data?.user.id, filters],
    queryFn: () => fetchCustomers(sessionQuery.data!.user.id, filters),
    enabled: !!sessionQuery.data?.user.id,
  });

  return {
    ...customersQuery,
    userId: sessionQuery.data?.user.id,
  };
}

export function useCustomerTransactions(customerId: string) {
  return useQuery({
    queryKey: ['customer-transactions', customerId],
    queryFn: () => fetchCustomerTransactions(customerId),
    enabled: !!customerId,
  });
}

export function useCustomerMutations() {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const createCustomer = useMutation({
    mutationFn: async (customer: {
      name: string;
      type: 'customer' | 'supplier';
      phone?: string;
      initialBalance?: number;
      balanceType?: 'to_receive' | 'to_pay';
    }) => {
      const userId = await getSessionUserId();
      if (!userId) throw new Error('User not authenticated');

      // Calculate initial balance
      const balance = customer.initialBalance
        ? customer.balanceType === 'to_receive'
          ? Math.abs(customer.initialBalance)
          : -Math.abs(customer.initialBalance)
        : 0;

      const { data, error } = await supabase
        .from('customers')
        .insert({
          user_id: userId,
          name: customer.name,
          type: customer.type,
          phone: customer.phone,
          balance,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (newCustomer) => {
      await queryClient.cancelQueries({ queryKey: ['customers'] });

      const previousCustomers = queryClient.getQueryData<Customer[]>(['customers', sessionQuery.data?.user.id]);

      if (sessionQuery.data?.user.id) {
        queryClient.setQueryData<Customer[]>(
          ['customers', sessionQuery.data.user.id],
          (old = []) => [
            {
              id: 'temp-' + Date.now(),
              user_id: sessionQuery.data.user.id,
              name: newCustomer.name,
              type: newCustomer.type,
              phone: newCustomer.phone,
              balance: newCustomer.initialBalance || 0,
              status: 'active',
              created_at: new Date().toISOString(),
            } as Customer,
            ...old,
          ]
        );
      }

      return { previousCustomers };
    },
    onError: (err, newCustomer, context) => {
      if (context?.previousCustomers && sessionQuery.data?.user.id) {
        queryClient.setQueryData(
          ['customers', sessionQuery.data.user.id],
          context.previousCustomers
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const updateCustomer = useMutation({
    mutationFn: async ({ customerId, updates }: {
      customerId: string;
      updates: Partial<Omit<Customer, 'id' | 'user_id' | 'created_at'>>
    }) => {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', customerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const deleteCustomer = useMutation({
    mutationFn: async (customerId: string) => {
      // Delete customer transactions first
      await supabase
        .from('customer_transactions')
        .delete()
        .eq('customer_id', customerId);

      // Then delete customer
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;
      return customerId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer-transactions'] });
    },
  });

  const toggleCustomerStatus = useMutation({
    mutationFn: async (customerId: string) => {
      // Fetch current status
      const { data: customer } = await supabase
        .from('customers')
        .select('status')
        .eq('id', customerId)
        .single();

      const newStatus = customer?.status === 'active' ? 'settled' : 'active';

      const { data, error } = await supabase
        .from('customers')
        .update({ status: newStatus })
        .eq('id', customerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const addTransaction = useMutation({
    mutationFn: async (transaction: {
      customerId: string;
      amount: number;
      type: 'gave' | 'got';
      description?: string;
    }) => {
      const userId = await getSessionUserId();
      if (!userId) throw new Error('User not authenticated');

      // Create transaction
      const { data: txnData, error: txnError } = await supabase
        .from('customer_transactions')
        .insert({
          user_id: userId,
          customer_id: transaction.customerId,
          amount: transaction.amount,
          type: transaction.type,
          description: transaction.description,
          date: new Date().toISOString(),
        })
        .select()
        .single();

      if (txnError) throw txnError;

      // Update customer balance
      const { data: customer } = await supabase
        .from('customers')
        .select('balance')
        .eq('id', transaction.customerId)
        .single();

      const change = transaction.type === 'gave' ? transaction.amount : -transaction.amount;
      const newBalance = (customer?.balance || 0) + change;

      const { error: balanceError } = await supabase
        .from('customers')
        .update({ balance: newBalance })
        .eq('id', transaction.customerId);

      if (balanceError) throw balanceError;

      return txnData;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer-transactions', variables.customerId] });
    },
  });

  return {
    createCustomer,
    updateCustomer,
    deleteCustomer,
    toggleCustomerStatus,
    addTransaction,
  };
}
