import { CornerDecorations } from '@/components/ui/CornerDecorations';
import { LevelUpQueue } from '@/components/ui/LevelUpModal';
import { LogEntryModal } from '@/components/ui/LogEntryModal';
import { AttributeStatCard, StatBar } from '@/components/ui/StatBar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useLevelStore } from '@/store/levelStore';
import { useLogStore } from '@/store/logStore';
import { useUserStore } from '@/store/userStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { key: themeKey } = useTheme();
  const { signOut } = useAuthStore();
  const { profile, fetchProfile } = useUserStore();
  const { getLevelInfo, fetchAllLevels } = useLevelStore();
  const [refreshing, setRefreshing] = useState(false);
  const [logModalVisible, setLogModalVisible] = useState(false);

  // Get icon color from Colors constant
  const iconColor = (Colors as any)[themeKey]?.text || Colors.emerald.text;
  const accentColor = (Colors as any)[themeKey]?.accent || Colors.emerald.accent;

  // Level-up queue state
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(0);
  const [newLevel, setNewLevel] = useState(0);

  // Track previous profile level to detect changes
  const lastProfileLevel = useRef<number>(profile?.level || 1);

  // Initial Data Fetch
  useEffect(() => {
    fetchAllLevels();
    if (profile?.id) {
      fetchProfile(profile.id);
    }
  }, []);

  // Watch for Level Changes ( Real-time )
  useEffect(() => {
    if (profile?.level && profile.level > lastProfileLevel.current) {
      setPreviousLevel(lastProfileLevel.current);
      setNewLevel(profile.level);
      setShowLevelUp(true);
      lastProfileLevel.current = profile.level;
    } else if (profile?.level) {
      lastProfileLevel.current = profile.level;
    }
  }, [profile?.level]);

  // Check for level-up params from migration (Legacy/Fallback)
  useEffect(() => {
    if (params.levelsGained && parseInt(params.levelsGained as string) > 0) {
      const prev = parseInt(params.previousLevel as string);
      const next = parseInt(params.newLevel as string);



      setPreviousLevel(prev);
      setNewLevel(next);
      setShowLevelUp(true);

      // Refresh profile to get updated stats
      if (profile?.id) {
        fetchProfile(profile.id);
      }
    }
  }, [params.levelsGained]);

  const { fetchLogs } = useLogStore();

  const onRefresh = async () => {
    setRefreshing(true);
    if (profile?.id) {
      await Promise.all([
        fetchProfile(profile.id),
        fetchLogs(profile.id)
      ]);
    }
    setRefreshing(false);
  };

  const handleLevelUpComplete = () => {

    setShowLevelUp(false);
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

  // --- Derived Stats logic ---
  const levelInfo = profile?.level ? getLevelInfo(profile.level) : null;
  const currentLevelXp = profile?.lifetime_xp || 0;
  const minXp = levelInfo?.minXp || 0;
  const xpToNext = levelInfo?.xpToNext || 1000; // default to 1000 if unknown

  // Calculate relative XP for the bar
  const xpProgress = Math.max(0, currentLevelXp - minXp);

  // Vitals
  const mp = profile?.energy || 0;
  const maxMp = 100; // Standard Max Energy

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className={`flex-1 bg-bg-base theme-${themeKey}`} >
      {/* Level-Up Modals - Only show when log modal is closed */}
      {!logModalVisible && showLevelUp && previousLevel > 0 && newLevel > previousLevel && (
        <LevelUpQueue
          previousLevel={previousLevel}
          newLevel={newLevel}
          onComplete={handleLevelUpComplete}
        />
      )}

      {/* Log Entry Modal */}
      <LogEntryModal
        visible={logModalVisible}
        onClose={() => setLogModalVisible(false)}
        onSuccess={() => {
          // Optional: explicit refresh if modal doesn't handle it
          if (profile?.id) fetchProfile(profile.id);
        }}
      />

      {/* Background Glow */}
      <View className="absolute inset-0 opacity-5 bg-accent" />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[accentColor]} progressBackgroundColor={"#020617"} />}
      >
        <CornerDecorations color={accentColor} />

        {/* Header Status Section */}
        <View className="items-center mb-8 mt-4 relative">
          {/* Status Indicators Top Right */}
          <View className="absolute -top-4 -right-2 flex-row gap-2">
            <View className="w-4 h-4 rounded-full bg-accent animate-pulse" />
            <View className="w-4 h-4 rounded-full bg-accent/50" />
            <View className="w-4 h-4 rounded-full bg-accent/20" />
          </View>

          <Text className="text-xs font-bold tracking-[0.2em] text-text-dim mb-2 uppercase">Status</Text>

          <View className="items-center justify-center mb-2">
            <Text className="text-6xl font-bold text-accent shadow-lg shadow-accent/50"
              style={{ textShadowColor: accentColor, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 }}>
              {profile?.level || 1}
            </Text>
            <Text className="text-xs tracking-widest text-text-muted uppercase mt-1">Level</Text>
          </View>

          <View className="items-center gap-1 mt-2">
            <Text className="text-text-muted font-medium tracking-wide">
              JOB: <Text className="text-text-primary">Founder</Text>
            </Text>
            {/* Use profile.title if available, else standard fallback */}
            <Text className="text-text-muted font-medium tracking-wide">
              TITLE: <Text className="text-text-primary">{profile?.title || 'Initiate'}</Text>
            </Text>
          </View>
        </View>

        {/* <View className='mb-6 gap-2 flex-row justify-between items-center'> */}
        {/* Vitals Section */}
        <View className="mb-6 gap-2">
          <StatBar label="MP" value={mp} maxValue={maxMp} colorClass="bg-blue-500" />
        </View>

        {/* Experience Section */}
        <View className="mb-8 gap-2">
          <StatBar value={xpProgress} label='Expereince' maxValue={xpToNext} showValueText={true} heightClass="h-2" />
        </View>

        {/* Attributes Section */}
        <View className="border-t-2 border-accent/20 pt-8 relative">
          <View className="absolute -top-3 left-1/2 -ml-24 bg-bg-base px-4">
            <Text className="text-sm font-bold tracking-widest text-text-dim uppercase">Founder Attributes</Text>
          </View>

          <View className="flex-row flex-wrap justify-between mt-4 gap-y-4">

            <AttributeStatCard
              label="Engineering (STR)"
              value={profile?.str_builder || 0}
              colorClass="bg-blue-500"
            />

            {/* 2. INT */}
            <AttributeStatCard
              label="Product (INT)"
              value={profile?.int_architect || 0}
              colorClass="bg-purple-500"
            />

            {/* 3. CHA */}
            <AttributeStatCard
              label="Sales (CHA)"
              value={profile?.cha_hustler || 0}
              colorClass="bg-yellow-500"
            />

            {/* 4. WIS */}
            <AttributeStatCard
              label="Zen (WIS)"
              value={profile?.wis_zen || 0}
              colorClass="bg-cyan-500"
            />

            {/* 5. CON */}
            <AttributeStatCard
              label="Grit (CON)"
              value={profile?.con_grit || 0}
              colorClass="bg-red-500"
            />

            {/* 6. Streak (Special Style) */}
            <View className="w-[48%] bg-gray-900 border border-orange-500/30 rounded-xl p-4 justify-between relative overflow-hidden">
              <View className="absolute right-0 top-0 p-4" style={profile?.current_streak && profile.current_streak > 0 ? { opacity: 1 } : { opacity: 0.1 }}>
                {/* Background Decoration */}
                <Text className="text-4xl ">🔥</Text>
              </View>

              <View className="relative mb-2">
                <View className="absolute -left-5 top-1 w-1.5 h-1.5 rounded-full bg-orange-500" />
                <Text className="text-[10px] font-bold tracking-widest text-orange-400 uppercase">
                  Streak
                </Text>
              </View>
              <View className="flex-row items-end">
                <Text className="text-2xl font-black text-white tracking-wider mr-1">
                  {profile?.current_streak || 0}
                </Text>
                <Text className="text-xs text-gray-500 font-bold mb-1.5">DAYS</Text>
              </View>
            </View>

          </View>
        </View>
      </ScrollView>

      {/* FAB - Log Entry Trigger */}
      <View className="absolute bottom-24 right-6 z-50">
        <TouchableOpacity
          onPress={() => setLogModalVisible(true)}
          style={{
            shadowColor: accentColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
            elevation: 10
          }}
          className="w-14 h-14 bg-gray-900 border border-gray-700 items-center justify-center overflow-hidden"
        >
          <CornerDecorations size="sm" color={accentColor} />
          <IconSymbol name="plus" size={24} color={accentColor} />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}
