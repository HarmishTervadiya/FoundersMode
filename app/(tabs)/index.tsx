import { cx, theme } from '@/constants/theme.utils';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'expo-router';
import { LogOut, User, Zap } from 'lucide-react-native';
import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const { signOut } = useAuthStore();
  const { profile } = useUserStore();

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to exit the facility?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace('/auth/login');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className={cx('flex-1', theme.bgClass)}>
      {/* Background Glow */}
      <View className={cx('absolute inset-0 opacity-5', theme.accentBg)} />

      <View className="flex-1 p-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-8">
          <View className="flex-row items-center gap-3">
            <View className={cx('w-12 h-12 items-center justify-center border-2', theme.borderClass, theme.glowClass)}>
              <Zap size={24} color={theme.iconColor} />
            </View>
            <View>
              <Text className={cx('text-xs tracking-widest font-bold', theme.textDimClass)}>FOUNDERS MODE</Text>
              <Text className={cx('text-lg font-bold tracking-wide', theme.textClass)}>
                {profile?.username || 'Founder'}
              </Text>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            className={cx('p-3 border', theme.dangerBg, theme.dangerBorder)}
          >
            <LogOut size={20} color="#f87171" />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View className="flex-1 items-center justify-center">
          <View className={cx('w-24 h-24 items-center justify-center border-2 mb-6', theme.borderClass, theme.glowClass)}>
            <User size={48} color={theme.iconColor} />
          </View>
          <Text className={cx('text-2xl font-bold tracking-wider mb-2', theme.textClass)}>
            WELCOME, FOUNDER
          </Text>
          <Text className={cx('text-center opacity-80', theme.mutedTextClass)}>
            Your journey begins here. Track your progress, level up, and build your legacy.
          </Text>

          {/* Stats Placeholder */}
          <View className="flex-row gap-4 mt-8">
            <View className={cx('p-4 border items-center', theme.borderClass, theme.glowClass)}>
              <Text className={cx('text-2xl font-bold', theme.textClass)}>{profile?.level || 1}</Text>
              <Text className={cx('text-xs tracking-widest', theme.textDimClass)}>LEVEL</Text>
            </View>
            <View className={cx('p-4 border items-center', theme.borderClass, theme.glowClass)}>
              <Text className={cx('text-2xl font-bold', theme.textClass)}>{profile?.lifetime_xp || 0}</Text>
              <Text className={cx('text-xs tracking-widest', theme.textDimClass)}>XP</Text>
            </View>
            <View className={cx('p-4 border items-center', theme.borderClass, theme.glowClass)}>
              <Text className={cx('text-2xl font-bold', theme.textClass)}>{profile?.current_streak || 0}</Text>
              <Text className={cx('text-xs tracking-widest', theme.textDimClass)}>STREAK</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View className="items-center py-4">
          <Text className={cx('text-xs tracking-widest opacity-40', theme.textClass)}>
            [ SYSTEM ONLINE ]
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
