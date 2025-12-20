import { colors } from '@/constants/theme.utils';
import "@/global.css";
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Slot, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useUserStore } from '@/store/userStore';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Colors } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Separate component for Auth Logic - runs AFTER RootLayout mounts
function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, initialize, isLoading: authLoading } = useAuthStore();
  const { profile, fetchProfile, updateLastLogin } = useUserStore();
  const { hasSeenOnboarding } = useOnboardingStore();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [isRouting, setIsRouting] = useState(false);

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
    if (!isNavigationReady || authLoading || isRouting) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isNavigationReady, authLoading, isRouting]);

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

  // Main routing logic - onboarding first, then auth
  useEffect(() => {
    if (!isNavigationReady || authLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    // Check if on onboarding screen (auth/index or just auth/)
    const isOnOnboarding = inAuthGroup && segments[1] === undefined;

    // Priority 1: Show onboarding if not seen
    if (!hasSeenOnboarding) {
      if (!isOnOnboarding) {
        router.replace('/auth' as any);
      }
      return;
    }

    // Priority 2: Unauthenticated users go to login
    if (!session && !inAuthGroup) {
      router.replace('/auth/login');
      return;
    }

    // Priority 3: Authenticated users - handle profile setup
    if (session) {
      const handleAuthenticatedRouting = async () => {
        setIsRouting(true); // Start routing lock
        try {
          let currentProfile = profile;
          if (!currentProfile && session.user) {
            await fetchProfile(session.user.id);
            currentProfile = useUserStore.getState().profile;
          }

          if (inAuthGroup) {
            // Skip if on callback or migration - let them handle their own routing
            if (segments[1] === 'callback' || segments[1] === 'migration') {
              setIsRouting(false);
              return;
            }

            if (currentProfile?.username) {
              updateLastLogin();
              router.replace('/(tabs)');
            } else {
              const onVaultScreen = segments[1] === 'vaultKey';
              if (!onVaultScreen) {
                router.replace('/auth/vaultKey');
              } else {
                // If we are settled on a screen (dashboard or vault), update last login
                updateLastLogin();
                setIsRouting(false); // Stay on vaultKey
              }
            }
          } else {
            // Priority 4: If already in app (e.g. rebooted on index), also update last login
            // But we should only do this once session is settled.
            updateLastLogin();
            setIsRouting(false); // Already in app, no routing needed
          }
        } catch (e) {
          console.error("Routing error:", e);
          setIsRouting(false);
        }
      };
      handleAuthenticatedRouting();
    }
  }, [session, segments, authLoading, isNavigationReady, hasSeenOnboarding]);

  const { key: themeKey } = useTheme();
  const accentColor = (Colors as any)[themeKey]?.accent || Colors.emerald.accent;

  // Show loading while auth initializes (AFTER navigation is ready)
  if (!isNavigationReady || authLoading || isRouting) {
    return (
      <View className={`flex-1 bg-bg-base items-center justify-center theme-${themeKey}`}>
        <ActivityIndicator size="large" color={accentColor} />
        <Text className="text-text-primary mt-5 font-mono font-bold tracking-widest">
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
  const { key: themeKey } = useTheme();

  return (
    <GestureHandlerRootView className={`flex-1 theme-${themeKey}`}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthGate>
          <Slot />
        </AuthGate>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
