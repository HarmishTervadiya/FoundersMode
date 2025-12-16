import { LevelUpQueue } from '@/components/ui/LevelUpModal';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LogOut, User, Zap } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { key: themeKey } = useTheme();
  const { signOut } = useAuthStore();
  const { profile, fetchProfile } = useUserStore();

  // Get icon color from Colors constant
  const iconColor = (Colors as any)[themeKey]?.text || Colors.emerald.text;

  // Level-up queue state
  const [levelsToShow, setLevelsToShow] = useState<number[]>([1,2,3,4,5,6]);
  const [showLevelUp, setShowLevelUp] = useState(true);

  // Check for level-up params from migration
  useEffect(() => {
    if (params.levelsGained && parseInt(params.levelsGained as string) > 0) {
      const gained = parseInt(params.levelsGained as string);
      const newLevel = parseInt(params.newLevel as string);
      const previousLevel = parseInt(params.previousLevel as string);

      // Generate array of levels to show (max 3)
      const levels: number[] = [];
      const maxToShow = Math.min(gained, 3);
      for (let i = 0; i < maxToShow; i++) {
        levels.push(previousLevel + i + 1);
      }

      setLevelsToShow(levels);
      setShowLevelUp(true);

      // Refresh profile to get updated stats
      if (profile?.id) {
        fetchProfile(profile.id);
      }
    }
  }, [params.levelsGained]);

  const handleLevelUpComplete = () => {
    setShowLevelUp(false);
    setLevelsToShow([]);
  };

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
    <SafeAreaView className={`flex-1 bg-bg-base theme-${themeKey}`}>
      {/* Level-Up Modals */}
      {showLevelUp && levelsToShow.length > 0 && (
        <LevelUpQueue
          levelsToShow={levelsToShow}
          onComplete={handleLevelUpComplete}
        />
      )}

      {/* Background Glow */}
      <View className="absolute inset-0 opacity-5 bg-accent" />

      <View className="flex-1 p-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-8">
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 items-center justify-center border-2 border-accent/30 bg-accent/10">
              <Zap size={24} color={iconColor} />
            </View>
            <View>
              <Text className="text-xs tracking-widest font-bold text-text-dim">FOUNDERS MODE</Text>
              <Text className="text-lg font-bold tracking-wide text-text-primary">
                {profile?.username || 'Founder'}
              </Text>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            className="p-3 border bg-red-500/20 border-red-500/50"
          >
            <LogOut size={20} color="#f87171" />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View className="flex-1 items-center justify-center">
          <View className="w-24 h-24 items-center justify-center border-2 mb-6 border-accent/30 bg-accent/10">
            <User size={48} color={iconColor} />
          </View>
          <Text className="text-2xl font-bold tracking-wider mb-2 text-text-primary">
            WELCOME, FOUNDER
          </Text>
          <Text className="text-center opacity-80 text-text-muted">
            Your journey begins here. Track your progress, level up, and build your legacy.
          </Text>

          {/* Stats */}
          <View className="flex-row gap-4 mt-8">
            <View className="p-4 border items-center border-accent/30 bg-accent/10">
              <Text className="text-2xl font-bold text-text-primary">{profile?.level || 1}</Text>
              <Text className="text-xs tracking-widest text-text-dim">LEVEL</Text>
            </View>
            <View className="p-4 border items-center border-accent/30 bg-accent/10">
              <Text className="text-2xl font-bold text-text-primary">{profile?.lifetime_xp || 0}</Text>
              <Text className="text-xs tracking-widest text-text-dim">XP</Text>
            </View>
            <View className="p-4 border items-center border-accent/30 bg-accent/10">
              <Text className="text-2xl font-bold text-text-primary">{profile?.current_streak || 0}</Text>
              <Text className="text-xs tracking-widest text-text-dim">STREAK</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View className="items-center py-4">
          <Text className="text-xs tracking-widest opacity-40 text-text-primary">
            [ SYSTEM ONLINE ]
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
