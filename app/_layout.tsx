import { businessAITheme } from "@/constants/theme";
import { AlertProvider } from "@/context/AlertContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import "react-native-reanimated";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AuthLoadingScreen from "@/components/auth/AuthLoadingScreen";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useUserStore } from "@/store/useUserStore";

// Configure QueryClient with offline-first defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});

// Setup AsyncStorage persister for offline support
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

// Persist query cache to AsyncStorage
persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
});

export const unstable_settings = {
  initialRouteName: "(auth)",
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { hasCompletedOnboarding } = useUserStore();
  const { user, isLoading: authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure store is hydrated
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady || authLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inLoginOrSignup = segments[1] === "login" || segments[1] === "signup";

    // If not authenticated, go to login
    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (!user && inAuthGroup && !inLoginOrSignup) {
      router.replace("/(auth)/login");
    }
    // If authenticated but not onboarded, go to onboarding
    else if (user && !hasCompletedOnboarding && segments[1] !== "onboarding") {
      router.replace("/(auth)/onboarding");
    }
    // If authenticated and onboarded, go to main app
    else if (user && hasCompletedOnboarding && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, hasCompletedOnboarding, isReady, authLoading, segments]);

  if (!isReady || authLoading) {
    return <AuthLoadingScreen />;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        <Stack.Screen
          name="agent/[id]"
          options={{ presentation: "card", title: "Agent Details" }}
        />
        <Stack.Screen
          name="scanner"
          options={{ presentation: "fullScreenModal", headerShown: false }}
        />
        <Stack.Screen
          name="voice-modal"
          options={{ presentation: "transparentModal", headerShown: false }}
        />
        <Stack.Screen
          name="ask-ai"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="create"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="customers"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LanguageProvider>
            <AlertProvider>
              <PaperProvider theme={businessAITheme}>
                <RootLayoutNav />
              </PaperProvider>
            </AlertProvider>
          </LanguageProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
