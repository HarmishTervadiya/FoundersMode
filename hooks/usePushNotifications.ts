import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useUserStore } from '../store/userStore';

// 1. Configure how notifications appear when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.HIGH,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>(undefined);
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(
    undefined
  );
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  // Access user store to sync token
  const { profile, updateProfile } = useUserStore();

  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      // Get Project ID from Expo Config (Required for EAS Build)
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

      /* 
       * [FIREBASE DEPENDENCY COMMENTED OUT]
       * Remote push notifications on Android require Firebase (FCM) to be set up.
       * Since we are only using Local Notifications (Daily Reminders), we don't 
       * need a Push Token. Uncomment this block and add google-services.json to 
       * app.json if you want to send remote notifications from your server later.
       *
      try {
        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;
        console.log('Expo Push Token:', token);
      } catch (e) {
        console.error('Error getting push token:', e);
      }
      */
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  // Schedule a daily reminder at 8 PM in the user's LOCAL timezone.
  // In __DEV__ mode, fires after 10 seconds so you can test without waiting.
  async function scheduleDailyReminder() {
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (__DEV__) {
      // TEST MODE: fires in 10 seconds
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '[ SYSTEM ALERT ] Daily Log Pending',
          body: "The grind doesn't stop. Bank your XP before midnight, founder.",
          sound: true,
          data: { url: '/(tabs)' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 10,
          repeats: true, // Keep firing every 10s so you can test multiple times
        },
      });
      console.log('[Notifications] DEV: Test notification scheduled in 10 seconds');
    } else {
      // PRODUCTION: fires every day at 8 PM local time
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '[ SYSTEM ALERT ] Daily Log Pending',
          body: "The grind doesn't stop. Bank your XP before midnight, founder.",
          sound: true,
          data: { url: '/(tabs)' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 20,
          minute: 0,
        },
      });
      console.log('[Notifications] Daily reminder scheduled: 8 PM local time');
    }
  }

  async function cancelDailyReminder() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[Notifications] Daily reminder cancelled');
  }

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      setExpoPushToken(token);

      // Sync with Supabase ONLY if user is logged in, has a profile, and token changed
      if (token && profile?.id && profile.expo_push_token !== token) {
        console.log('Syncing Push Token to Supabase...');
        updateProfile({ expo_push_token: token });
      }
    });

    // Schedule or cancel reminder based on user preference
    if (profile?.daily_reminder) {
      scheduleDailyReminder();
    } else {
      cancelDailyReminder();
    }

    // Listen for incoming notifications while app is open
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    // Listen for user tapping a notification — navigate to home tab
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification Tapped:', response);
      const url = response.notification.request.content.data?.url;
      if (url) {
        router.push(url as any);
      } else {
        router.push('/(tabs)');
      }
    });

    return () => {
      notificationListener.current && notificationListener.current.remove();
      responseListener.current && responseListener.current.remove();
    };
  }, [profile?.id, profile?.daily_reminder]); // Re-run if reminder preference changes

  return {
    expoPushToken,
    notification,
  };
}
