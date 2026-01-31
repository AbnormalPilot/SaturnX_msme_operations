import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';

export interface Product {
  id: string;
  user_id: string;
  name: string;
  hindi_name: string;
  category: string;
  price: number;
  cost_price: number;
  mrp: number;
  quantity: number;
  low_stock_threshold: number;
  image: string;
  barcode?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  low_stock_only?: boolean;
}

async function fetchProducts(userId: string, filters?: ProductFilters): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,hindi_name.ilike.%${filters.search}%`);
  }

  if (filters?.low_stock_only) {
    query = query.lt('quantity', supabase.raw('low_stock_threshold'));
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

async function getSessionUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id || null;
}

export function useProducts(filters?: ProductFilters) {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const productsQuery = useQuery({
    queryKey: ['products', sessionQuery.data?.user.id, filters],
    queryFn: () => fetchProducts(sessionQuery.data!.user.id, filters),
    enabled: !!sessionQuery.data?.user.id,
  });

  return {
    ...productsQuery,
    userId: sessionQuery.data?.user.id,
  };
}

export function useProductMutations() {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const createProduct = useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const userId = await getSessionUserId();
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('products')
        .insert({
          ...product,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (newProduct) => {
      await queryClient.cancelQueries({ queryKey: ['products'] });

      const previousProducts = queryClient.getQueryData<Product[]>(['products', sessionQuery.data?.user.id]);

      if (sessionQuery.data?.user.id) {
        queryClient.setQueryData<Product[]>(
          ['products', sessionQuery.data.user.id],
          (old = []) => [
            {
              ...newProduct,
              id: 'temp-' + Date.now(),
              user_id: sessionQuery.data.user.id
            } as Product,
            ...old,
          ]
        );
      }

      return { previousProducts };
    },
    onError: (err, newProduct, context) => {
      if (context?.previousProducts && sessionQuery.data?.user.id) {
        queryClient.setQueryData(
          ['products', sessionQuery.data.user.id],
          context.previousProducts
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ productId, updates }: {
      productId: string;
      updates: Partial<Omit<Product, 'id' | 'user_id' | 'created_at'>>
    }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ productId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['products'] });

      const previousProducts = queryClient.getQueryData<Product[]>(['products', sessionQuery.data?.user.id]);

      if (sessionQuery.data?.user.id) {
        queryClient.setQueryData<Product[]>(
          ['products', sessionQuery.data.user.id],
          (old = []) => old.map(p => p.id === productId ? { ...p, ...updates } : p)
        );
      }

      return { previousProducts };
    },
    onError: (err, variables, context) => {
      if (context?.previousProducts && sessionQuery.data?.user.id) {
        queryClient.setQueryData(
          ['products', sessionQuery.data.user.id],
          context.previousProducts
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const updateStock = useMutation({
    mutationFn: async ({
      productId,
      quantity,
      operation = 'set'
    }: {
      productId: string;
      quantity: number;
      operation?: 'add' | 'subtract' | 'set';
    }) => {
      const { data: product } = await supabase
        .from('products')
        .select('quantity')
        .eq('id', productId)
        .single();

      let newQuantity = quantity;
      if (operation === 'add') {
        newQuantity = (product?.quantity || 0) + quantity;
      } else if (operation === 'subtract') {
        newQuantity = Math.max(0, (product?.quantity || 0) - quantity);
      }

      const { data, error } = await supabase
        .from('products')
        .update({ quantity: newQuantity })
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ productId, quantity, operation }) => {
      await queryClient.cancelQueries({ queryKey: ['products'] });

      const previousProducts = queryClient.getQueryData<Product[]>(['products', sessionQuery.data?.user.id]);

      if (sessionQuery.data?.user.id) {
        queryClient.setQueryData<Product[]>(
          ['products', sessionQuery.data.user.id],
          (old = []) => old.map(p => {
            if (p.id === productId) {
              let newQuantity = quantity;
              if (operation === 'add') {
                newQuantity = p.quantity + quantity;
              } else if (operation === 'subtract') {
                newQuantity = Math.max(0, p.quantity - quantity);
              }
              return { ...p, quantity: newQuantity };
            }
            return p;
          })
        );
      }

      return { previousProducts };
    },
    onError: (err, variables, context) => {
      if (context?.previousProducts && sessionQuery.data?.user.id) {
        queryClient.setQueryData(
          ['products', sessionQuery.data.user.id],
          context.previousProducts
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      return productId;
    },
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ['products'] });

      const previousProducts = queryClient.getQueryData<Product[]>(['products', sessionQuery.data?.user.id]);

      if (sessionQuery.data?.user.id) {
        queryClient.setQueryData<Product[]>(
          ['products', sessionQuery.data.user.id],
          (old = []) => old.filter(p => p.id !== productId)
        );
      }

      return { previousProducts };
    },
    onError: (err, productId, context) => {
      if (context?.previousProducts && sessionQuery.data?.user.id) {
        queryClient.setQueryData(
          ['products', sessionQuery.data.user.id],
          context.previousProducts
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return {
    createProduct,
    updateProduct,
    updateStock,
    deleteProduct,
  };
}
