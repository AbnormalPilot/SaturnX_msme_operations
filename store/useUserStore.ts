import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface UserState {
  // Onboarding
  hasCompletedOnboarding: boolean;

  // Profile fields (synced from Supabase)
  name: string;
  email: string;
  shopName: string;
  upiId: string;
  avatarUri: string | null;
  showCP: boolean; // Toggle for Cost Price visibility in inventory
  language: 'en' | 'hi' | 'hi-en'; // en = English, hi = Hindi, hi-en = Hinglish

  // Actions
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setShopName: (shopName: string) => void;
  setUpiId: (upiId: string) => void;
  setAvatarUri: (uri: string | null) => void;
  setLanguage: (language: 'en' | 'hi' | 'hi-en') => void;
  toggleShowCP: () => void;
  completeOnboarding: (name: string) => void;
  resetOnboarding: () => void;

  // Sync from Supabase user
  syncFromSupabase: (user: {
    email?: string;
    user_metadata?: {
      full_name?: string;
      name?: string;
      avatar_url?: string;
      picture?: string;
      shop_name?: string;
    };
  }) => void;
}

const initialState = {
  hasCompletedOnboarding: false,
  name: "",
  email: "",
  shopName: "",
  upiId: "",
  avatarUri: null as string | null,
  showCP: false,
  language: 'hi-en' as 'en' | 'hi' | 'hi-en', // Default to Hinglish for Indian users
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setName: (name) => set({ name }),
      setEmail: (email) => set({ email }),
      setShopName: (shopName) => set({ shopName }),
      setUpiId: (upiId) => set({ upiId }),
      setAvatarUri: (avatarUri) => set({ avatarUri }),
      setLanguage: (language) => set({ language }),
      toggleShowCP: () => set((state) => ({ showCP: !state.showCP })),
      completeOnboarding: (name) =>
        set({
          hasCompletedOnboarding: true,
          name,
        }),
      resetOnboarding: () => set(initialState),
      syncFromSupabase: (user) => {
        const currentState = get();
        const updates: Partial<UserState> = {};

        // Sync email from Supabase
        if (user.email && !currentState.email) {
          updates.email = user.email;
        }

        // Sync name from user metadata (Google OAuth provides this)
        const fullName =
          user.user_metadata?.full_name || user.user_metadata?.name;
        if (fullName && !currentState.name) {
          updates.name = fullName;
          // If we got a name from Google, skip onboarding
          updates.hasCompletedOnboarding = true;
        }

        // Sync avatar from Google OAuth
        const avatarUrl =
          user.user_metadata?.avatar_url || user.user_metadata?.picture;
        if (avatarUrl && !currentState.avatarUri) {
          updates.avatarUri = avatarUrl;
        }

        // Sync shop name if provided
        if (user.user_metadata?.shop_name && !currentState.shopName) {
          updates.shopName = user.user_metadata.shop_name;
          // If we got both name and shop name, definitely done
          updates.hasCompletedOnboarding = true;
        }

        if (Object.keys(updates).length > 0) {
          set(updates);
        }
      },
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
