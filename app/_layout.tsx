import { colors } from '@/constants/theme.utils';
import "@/global.css";
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Slot, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { GestureHandlerRootView } from "react-native-gesture-handler";

export const unstable_settings = {
  anchor: '(tabs)',
};

// Separate component for Auth Logic - runs AFTER RootLayout mounts
function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, initialize, isLoading: authLoading } = useAuthStore();
  const { profile, fetchProfile } = useUserStore();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // Rotating loading messages for better UX
  const loadingMessages = [
    'INITIALIZING SECURE SYSTEM...',
    'ESTABLISHING CONNECTION...',
    'LOADING PROTOCOLS...',
    'VERIFYING ACCESS...',
    'SYNCING DATA...',
  ];

  // Cycle through loading messages
  useEffect(() => {
    if (!isNavigationReady || authLoading) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isNavigationReady, authLoading]);

  // Track when navigation becomes ready
  useEffect(() => {
    if (rootNavigationState?.key) {
      setIsNavigationReady(true);
    }
  }, [rootNavigationState?.key]);

  // Initialize Auth
  useEffect(() => {
    initialize();
  }, []);

  // Auth Guard & Routing - only runs when navigation is ready
  useEffect(() => {
    if (!isNavigationReady || authLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!session && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (session) {
      const handleAuthenticatedRouting = async () => {
        let currentProfile = profile;
        if (!currentProfile && session.user) {
          await fetchProfile(session.user.id);
          currentProfile = useUserStore.getState().profile;
        }

        if (inAuthGroup) {
          // Skip if on callback - let it handle its own routing
          if (segments[1] === 'callback') return;

          if (currentProfile?.username) {
            router.replace('/(tabs)');
          } else {
            const onVaultScreen = segments[1] === 'vaultKey';
            if (!onVaultScreen) {
              router.replace('/auth/vaultKey');
            }
          }
        }
      };
      handleAuthenticatedRouting();
    }
  }, [session, segments, authLoading, isNavigationReady]);

  // Show loading while auth initializes (AFTER navigation is ready)
  if (!isNavigationReady || authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.primary, marginTop: 20, fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: 2 }}>
          {loadingMessages[loadingMessageIndex]}
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

// RootLayout - ALWAYS mounts the navigator first
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthGate>
          <Slot />
        </AuthGate>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
