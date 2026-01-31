import { create } from "zustand";
import { Product } from "./useInventoryStore";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  decreaseQuantity: (productId: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getTotalCost: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addToCart: (product) => {
    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          ),
        };
      }
      return { items: [...state.items, { product, quantity: 1 }] };
    });
  },

  removeFromCart: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.product.id !== productId),
    }));
  },

  decreaseQuantity: (productId) => {
    set((state) => {
      const existing = state.items.find((i) => i.product.id === productId);
      if (existing && existing.quantity > 1) {
        return {
          items: state.items.map((i) =>
            i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i,
          ),
        };
      } else {
        return {
          items: state.items.filter((i) => i.product.id !== productId),
        };
      }
    });
  },

  clearCart: () => set({ items: [] }),

  getTotal: () => {
    return get().items.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0,
    );
  },

  getTotalCost: () => {
    return get().items.reduce(
      (acc, item) => acc + item.product.costPrice * item.quantity,
      0,
    );
  },
}));
