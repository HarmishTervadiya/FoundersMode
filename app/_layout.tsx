import '@/global.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Network from 'expo-network';
import { Slot, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Text, View } from 'react-native';
import 'react-native-reanimated';

import { SoundManager } from '@/components/SoundManager';
import { SystemAlert } from '@/components/ui/SystemAlert';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppVersionCheck } from '@/hooks/useAppVersionCheck';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useUserStore } from '@/store/userStore';
import { Linking } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// This is the default configuration
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});
export const unstable_settings = {
  anchor: '(tabs)',
};

// Separate component for Network Check - runs BEFORE VersionGate
function NetworkGate({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(true);
  const { key: themeKey } = useTheme();
  const accentColor = (Colors as any)[themeKey]?.accent || Colors.emerald.accent;
  const backgroundColor = (Colors as any)[themeKey]?.background || Colors.emerald.background;

  const checkNetwork = async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      setIsConnected(state.isConnected ?? false);
    } catch (e) {
      console.error('Network check failed', e);
      setIsConnected(true); // Fail open
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      checkNetwork();
      interval = setInterval(checkNetwork, 10000);
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    startPolling();
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        startPolling();
      } else {
        stopPolling();
      }
    });

    return () => {
      stopPolling();
      subscription.remove();
    };
  }, []);

  if (!isConnected) {
    return (
      <View className={`flex-1 theme-${themeKey}`} style={{ backgroundColor: backgroundColor }}>
        <SystemAlert
          visible={true}
          type="error"
          title="NO CONNECTION"
          message="Unable to connect to the Core Network. Check your internet connection."
          onClose={() => {}} // Blocking
          accentColor={accentColor}
          primaryLabel="RETRY CONNECTION"
          onPrimaryPress={() => {
            // Trigger a manual check
            Network.getNetworkStateAsync().then((state) => {
              setIsConnected(state.isConnected ?? false);
            });
          }}
        />
      </View>
    );
  }

  return <>{children}</>;
}

// Separate component for Version Check - runs BEFORE AuthGate
function VersionGate({ children }: { children: React.ReactNode }) {
  const { isOutdated, storeUrl, loading, error, checkVersion } = useAppVersionCheck();
  const { key: themeKey } = useTheme();
  const accentColor = (Colors as any)[themeKey]?.accent || Colors.emerald.accent;
  const backgroundColor = (Colors as any)[themeKey]?.background || Colors.emerald.background;

  if (loading) {
    return (
      <View
        className={`flex-1 items-center justify-center p-8 theme-${themeKey}`}
        style={{ backgroundColor: backgroundColor }}
      >
        <ActivityIndicator size="large" color={accentColor} />
        <Text className="mt-4 text-center font-mono font-bold tracking-widest text-text-primary">
          VERIFYING NEURAL LINK...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className={`flex-1 theme-${themeKey}`} style={{ backgroundColor: backgroundColor }}>
        <SystemAlert
          visible={true}
          type="error"
          title="CONNECTION INSTABILITY"
          message="Failed to verify system integrity. The neural link is unstable."
          onClose={() => {}} // Blocking
          accentColor={accentColor}
          primaryLabel="RETRY CONNECTION"
          onPrimaryPress={() => checkVersion()}
        />
      </View>
    );
  }

  if (isOutdated) {
    return (
      <View className={`flex-1 theme-${themeKey}`} style={{ backgroundColor: backgroundColor }}>
        <SystemAlert
          visible={true}
          type="error"
          title="SYSTEM OUTDATED"
          message="Your Neural Link is incompatible with the Core Network. Update required to access the system."
          onClose={() => {}} // Blocking, no close
          accentColor={accentColor}
          primaryLabel="UPDATE SYSTEM"
          onPrimaryPress={() => {
            if (storeUrl) {
              Linking.openURL(storeUrl);
            }
          }}
        />
      </View>
    );
  }

  return <>{children}</>;
}

// Separate component for Auth Logic - runs AFTER RootLayout mounts

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, initialize, isLoading: authLoading, signOut } = useAuthStore();
  const { profile, fetchProfile, updateLastLogin, setWelcomeMessagePending } = useUserStore();
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
    const isOnOnboarding = inAuthGroup && segments[1] === undefined;

    // Helper function to handle auth checks
    const runAuthChecks = async () => {
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
        try {
          // Re-fetch profile to ensure latest data (vital for resume)
          // Note: fetchProfile updates the store, so 'profile' in store is updated
          const fetchedProfile = await fetchProfile(session.user.id);
          const currentProfile = fetchedProfile || profile; // Fallback to store if fetch checks pass

          if (currentProfile) {
            const { LOCAL_LAST_LOGIN_KEY } = await import('@/store/authStore');
            const AsyncStorage = (await import('@react-native-async-storage/async-storage'))
              .default;

            let lastLogDateStr = await AsyncStorage.getItem(LOCAL_LAST_LOGIN_KEY);

            // Loop Prevention: NEVER check DB for blocking session expiry.
            // If local storage is missing (new install/cleared data), assume active session
            // and initialize the local tracker to NOW.
            if (!lastLogDateStr) {
              lastLogDateStr = new Date().toISOString();
              await AsyncStorage.setItem(LOCAL_LAST_LOGIN_KEY, lastLogDateStr);
            }

            if (lastLogDateStr) {
              const lastLog = new Date(lastLogDateStr);
              const now = new Date();
              const diffTime = Math.abs(now.getTime() - lastLog.getTime());
              const diffDays = diffTime / (1000 * 60 * 60 * 24);

              if (diffDays > 15) {
                console.log('Session expired due to inactivity (>15 days). Signing out.');
                await signOut();
                router.replace('/auth/login');
                // Ensure we stop routing logic here
                setIsRouting(false);
                return;
              }
            }

            // Inactivity Recovery Check (Before updating last_log_date)
            // Note: Recovery Logic in userStore still uses profile.last_log_date which is fine
            // because we want to reward based on server truth, but loop prevention needed local.
            const recoveryResult = await useUserStore.getState().checkInactivityRecovery();
            if (recoveryResult && recoveryResult.welcomeBack) {
              setWelcomeMessagePending(true);
            }
          }

          // Routing / Navigation Logic (Only run if we are actually launching/routing, not just checking in background)
          // Ideally we just update last login here if we are staying put.

          if (inAuthGroup) {
            // Skip if on callback or migration
            if (segments[1] === 'callback' || segments[1] === 'migration') {
              setIsRouting(false);
              return;
            }

            if (currentProfile?.username) {
              await updateLastLogin();
              router.replace('/(tabs)');
            } else {
              const onVaultScreen = segments[1] === 'vaultKey';
              if (!onVaultScreen) {
                router.replace('/auth/vaultKey');
              } else {
                await updateLastLogin();
                setIsRouting(false);
              }
            }
          } else {
            // Already in app
            await updateLastLogin();
            setIsRouting(false);
          }
        } catch (e) {
          console.error('Routing error:', e);
          setIsRouting(false);
        }
      }
    };

    runAuthChecks();

    // AppState Listener for Resume — lightweight session refresh only.
    // Full profile re-fetch and inactivity checks only run on initial load (above).
    // On resume, just re-run the routing logic if the session changes.
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('App resumed - checking network connectivity...');
        // The NetworkGate handles connectivity. AuthGate only needs to
        // re-evaluate routing if the session expired while backgrounded.
        // Supabase auto-refreshes the token, so we just need to check segment routing.
        const inAuthGroup = segments[0] === 'auth';
        if (!session && !inAuthGroup) {
          router.replace('/auth/login');
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [session, segments, authLoading, isNavigationReady, hasSeenOnboarding]);

  const { key: themeKey } = useTheme();
  const accentColor = (Colors as any)[themeKey]?.accent || Colors.emerald.accent;

  // Show loading while auth initializes (AFTER navigation is ready)
  if (!isNavigationReady || authLoading || isRouting) {
    return (
      <View className={`flex-1 items-center justify-center bg-bg-base theme-${themeKey}`}>
        <ActivityIndicator size="large" color={accentColor} />
        <Text className="mt-5 font-mono font-bold tracking-widest text-text-primary">
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

  usePushNotifications();

  const CustomTheme = {
    ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(colorScheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: '#050505',
    },
  };

  return (
    <GestureHandlerRootView className={`flex-1 theme-${themeKey}`}>
      <ThemeProvider value={CustomTheme}>
        <NetworkGate>
          <VersionGate>
            <AuthGate>
              <SoundManager />
              <Slot />
            </AuthGate>
          </VersionGate>
        </NetworkGate>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
