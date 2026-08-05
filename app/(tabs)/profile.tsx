import { DevThemeToggle } from '@/components/profile/DevThemeToggle';
import { FAQModal } from '@/components/profile/FAQModal';
import { FeedbackModal } from '@/components/profile/FeedbackModal';
import { UsernameChangeModal } from '@/components/profile/UsernameChangeModal';
import { CornerDecorations } from '@/components/ui/CornerDecorations';
import { SystemAlert } from '@/components/ui/SystemAlert';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useUserStore } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons'; // Using Expo Icons for consistent UI, Lucide is fine too but vector-icons has good coverage
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { RefreshControl } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

export default function ProfileScreen() {
  const { key: themeKey } = useTheme();
  const accentColor = (Colors as any)[themeKey]?.accent || Colors.emerald.accent;

  const { profile, toggleDailyReminder } = useUserStore();
  const { user, signOut } = useAuthStore();
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const { soundEnabled, toggleSound } = useSettingsStore();

  const [usernameModalVisible, setUsernameModalVisible] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [faqModalVisible, setFaqModalVisible] = useState(false);
  const [logoutAlertVisible, setLogoutAlertVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // We can re-fetch profile to ensure stats are up to date
    if (profile?.id) {
      await useUserStore.getState().fetchProfile(profile.id);
    }
    setRefreshing(false);
  }, [profile?.id]);

  const handleLogoutPress = () => {
    setLogoutAlertVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutAlertVisible(false);
    await signOut();
    router.replace('/auth/login');
  };

  const SettingItem = ({
    label,
    value,
    icon,
    onPress,
    isToggle = false,
    toggleValue = false,
  }: {
    label: string;
    value?: string;
    icon: any;
    onPress?: () => void;
    isToggle?: boolean;
    toggleValue?: boolean;
  }) => (
    <TouchableOpacity
      activeOpacity={isToggle ? 1 : 0.7}
      onPress={isToggle ? () => {} : onPress}
      className="mb-3 flex-row items-center justify-between rounded-lg border border-gray-800 bg-gray-900 p-4"
    >
      <View className="flex-row items-center">
        <View className="mr-3 rounded-md p-2" style={{ backgroundColor: `${accentColor}1A` }}>
          <Ionicons name={icon} size={18} color={accentColor} />
        </View>
        <Text className="font-medium text-gray-200">{label}</Text>
      </View>

      {isToggle ? (
        <Switch
          trackColor={{ false: '#374151', true: `${accentColor}80` }}
          thumbColor={toggleValue ? accentColor : '#9ca3af'}
          ios_backgroundColor="#374151"
          onValueChange={onPress}
          value={toggleValue}
        />
      ) : (
        <View className="flex-row items-center">
          {value && <Text className="mr-2 text-xs text-gray-500">{value}</Text>}
          <Ionicons name="chevron-forward" size={16} color="#4b5563" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className={`flex-1 bg-bg-base theme-${themeKey}`}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[accentColor]}
            progressBackgroundColor={'#020617'}
          />
        }
      >
        <CornerDecorations color={accentColor} />

        {/* Header Profile Section */}
        <View className="mb-8 mt-8 items-center">
          {/* Avatar Ring */}
          <View
            className="relative mb-4 rounded-full border-2 border-dashed p-1"
            style={{ borderColor: accentColor }}
          >
            <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gray-800">
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <Ionicons name="person" size={48} color="#4b5563" />
              )}
            </View>
            <View className="absolute bottom-0 right-0 rounded-full border border-gray-800 bg-gray-900 p-1">
              <View className="h-4 w-4 rounded-full border-2 border-gray-900 bg-green-500" />
            </View>
          </View>

          <Text className="mb-1 text-2xl font-bold tracking-wide text-white">
            {profile?.username || 'Founder'}
          </Text>
          <Text className="font-mono text-xs uppercase tracking-widest text-gray-500">
            {profile?.title || 'Level ' + (profile?.level || 1)}
          </Text>
        </View>

        {/* Quick Stats Row */}
        <View className="mb-8 flex-row justify-between">
          <View className="mr-2 flex-1 items-center rounded-lg border border-gray-800 bg-gray-900 p-3">
            <Text className="mb-1 text-[10px] uppercase tracking-widest text-gray-500">
              Lifetime XP
            </Text>
            <Text className="font-bold text-white">
              {profile?.lifetime_xp?.toLocaleString() || '0'}
            </Text>
          </View>
          <View className="ml-2 flex-1 items-center rounded-lg border border-gray-800 bg-gray-900 p-3">
            <Text className="mb-1 text-[10px] uppercase tracking-widest text-gray-500">Streak</Text>
            <View className="flex-row items-center">
              <Ionicons name="flame" size={14} color="#f59e0b" className="mr-1" />
              <Text className="font-bold text-white">{profile?.current_streak || 0} Days</Text>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <Text className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">
          System Configuration
        </Text>

        <SettingItem
          label="Identity Protocol"
          value="Update Alias"
          icon="finger-print"
          onPress={() => setUsernameModalVisible(true)}
        />

        <SettingItem
          label="Notification Uplink"
          icon="notifications"
          isToggle
          toggleValue={profile?.daily_reminder ?? false}
          onPress={() => toggleDailyReminder(!profile?.daily_reminder)}
        />

        <SettingItem
          label="Sound & Haptics"
          icon="musical-notes"
          isToggle
          toggleValue={soundEnabled}
          onPress={() => toggleSound(!soundEnabled)}
        />

        <SettingItem
          label="System Feedback"
          icon="chatbox-ellipses"
          onPress={() => setFeedbackModalVisible(true)}
        />

        <SettingItem
          label="System Help"
          icon="help-buoy"
          onPress={() => setFaqModalVisible(true)}
        />

        {/* Developer Mode Only */}
        {/* <DevThemeToggle accentColor={accentColor} /> */}

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogoutPress}
          className="mb-12 mt-8 flex-row items-center justify-center rounded-lg border border-red-900/50 bg-red-500/5 py-4"
        >
          <Ionicons name="power" size={18} color="#ef4444" style={{ marginRight: 8 }} />
          <Text className="text-xs font-bold uppercase tracking-widest text-red-500">
            TERMINATE SESSION
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modals */}
      <UsernameChangeModal
        visible={usernameModalVisible}
        onClose={() => setUsernameModalVisible(false)}
        accentColor={accentColor}
      />

      <FeedbackModal
        visible={feedbackModalVisible}
        onClose={() => setFeedbackModalVisible(false)}
        accentColor={accentColor}
      />

      <FAQModal
        visible={faqModalVisible}
        onClose={() => setFaqModalVisible(false)}
        accentColor={accentColor}
      />

      <SystemAlert
        visible={logoutAlertVisible}
        title="Terminate Session?"
        message="Disconnecting from the System. The market waits for no one. Are you sure you want to logout?"
        type="warning"
        onClose={() => setLogoutAlertVisible(false)}
        primaryLabel="TERMINATE"
        onPrimaryPress={confirmLogout}
        secondaryLabel="CANCEL"
        onSecondaryPress={() => setLogoutAlertVisible(false)}
        accentColor={accentColor}
      />
    </SafeAreaView>
  );
}
