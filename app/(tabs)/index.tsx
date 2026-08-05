import { CornerDecorations } from '@/components/ui/CornerDecorations';
import { LevelUpQueue } from '@/components/ui/LevelUpModal';
import { LogEntryModal } from '@/components/ui/LogEntryModal';
import { AttributeStatCard, StatBar } from '@/components/ui/StatBar';
import { SystemAlert } from '@/components/ui/SystemAlert';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useLevelStore } from '@/store/levelStore';
import { useLogStore } from '@/store/logStore';
import { useUserStore } from '@/store/userStore';
import { soundService } from '@/utils/soundService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
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

  // System Alert State for Welcome Back
  const [systemAlertVisible, setSystemAlertVisible] = useState(false);
  const [systemAlertConfig, setSystemAlertConfig] = useState<{
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    primaryLabel?: string;
    onPrimaryPress?: () => void;
    secondaryLabel?: string;
    onSecondaryPress?: () => void;
  }>({
    title: '',
    message: '',
    type: 'info',
  });

  // Get icon color from Colors constant
  const iconColor = (Colors as any)[themeKey]?.text || Colors.emerald.text;
  const accentColor = (Colors as any)[themeKey]?.accent || Colors.emerald.accent;

  // Level-up queue state
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(0);
  const [newLevel, setNewLevel] = useState(0);

  // Track previous profile level to detect changes
  const lastProfileLevel = useRef<number>(profile?.level || 1);

  // Initial Data Fetch — only fetch profile if not already loaded.
  // AuthGate already fetches on boot; this avoids the triple-fetch chain.
  useEffect(() => {
    fetchAllLevels();

    // Check for welcome back message regardless (set by AuthGate before navigation)
    const pending = useUserStore.getState().welcomeMessagePending;
    if (pending) {
      setSystemAlertConfig({
        title: 'System Online',
        message: `Welcome back, Player\nAll systems are ready. Energy reserves have been partially restored.`,
        type: 'success',
      });
      setSystemAlertVisible(true);
      useUserStore.getState().setWelcomeMessagePending(false);
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
      await Promise.all([fetchProfile(profile.id), fetchLogs(profile.id)]);
    }
    setRefreshing(false);
  };

  const handleLevelUpComplete = () => {
    setShowLevelUp(false);
  };

  const handleLogout = () => {
    setSystemAlertConfig({
      title: 'Logout',
      message: 'Are you sure you want to exit the facility?',
      type: 'warning',
      primaryLabel: 'LOGOUT',
      onPrimaryPress: async () => {
        await signOut();
        router.replace('/auth/login');
      },
      secondaryLabel: 'CANCEL',
      onSecondaryPress: () => setSystemAlertVisible(false),
    });
    setSystemAlertVisible(true);
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
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className={`flex-1 bg-bg-base theme-${themeKey}`}
    >
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
          // logStore.addLog() already calls fetchProfile internally.
          // Read updated profile directly from store state — no extra network call needed.
          const updatedProfile = useUserStore.getState().profile;
          if (updatedProfile && (updatedProfile.energy || 0) <= 0) {
            setSystemAlertConfig({
              title: 'SYSTEM CRITICAL',
              message:
                'Energy depleted. Paradox psychosis imminent. XP gain reduced by 50%. Rest immediately.',
              type: 'error',
              primaryLabel: 'ACKNOWLEDGE',
              onPrimaryPress: () => {},
            });
            setSystemAlertVisible(true);
            setTimeout(() => {
              soundService.play('debuff_applied');
            }, 300);
          }
        }}
      />

      {/* System Alert for Welcome Back */}
      <SystemAlert
        visible={systemAlertVisible}
        title={systemAlertConfig.title}
        message={systemAlertConfig.message}
        type={systemAlertConfig.type}
        onClose={() => setSystemAlertVisible(false)}
        accentColor={accentColor}
        primaryLabel={systemAlertConfig.primaryLabel}
        onPrimaryPress={
          systemAlertConfig.onPrimaryPress
            ? () => {
                systemAlertConfig.onPrimaryPress?.();
                setSystemAlertVisible(false); // Ensure it closes after action if not handled inside
              }
            : undefined
        }
        secondaryLabel={systemAlertConfig.secondaryLabel}
        onSecondaryPress={
          systemAlertConfig.onSecondaryPress
            ? () => {
                systemAlertConfig.onSecondaryPress?.();
                setSystemAlertVisible(false);
              }
            : undefined
        }
      />

      {/* Background Glow */}
      <View className="absolute inset-0 bg-accent opacity-5" />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24, paddingBottom: 50 }}
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

        {/* Header Status Section */}
        <View className="relative mb-8 mt-4 items-center">
          {/* Status Indicators Top Right */}
          <View className="absolute -right-2 -top-4 flex-row gap-2">
            <View className="h-4 w-4 animate-pulse rounded-full bg-accent" />
            <View className="h-4 w-4 rounded-full bg-accent/50" />
            <View className="h-4 w-4 rounded-full bg-accent/20" />
          </View>

          <Text className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-text-dim">
            Status
          </Text>

          <View className="mb-2 items-center justify-center">
            <Text
              className="text-6xl font-bold text-accent shadow-lg shadow-accent/50"
              style={{
                textShadowColor: accentColor,
                textShadowOffset: { width: 1, height: 2 },
                textShadowRadius: 12,
              }}
            >
              {profile?.level || 1}
            </Text>
            <Text className="mt-1 text-xs uppercase tracking-widest text-text-muted">Level</Text>
          </View>

          <View className="mt-2 items-center gap-1">
            <Text className="font-medium tracking-wide text-text-muted">
              JOB: <Text className="text-text-primary">Founder</Text>
            </Text>
            {/* Use profile.title if available, else standard fallback */}
            {profile?.title && (
              <Text className="font-medium tracking-wide text-text-muted">
                TITLE: <Text className="text-text-primary">{profile?.title}</Text>
              </Text>
            )}
            {/* <Text className="text-text-muted font-medium tracking-wide">
              TITLE: <Text className="text-text-primary">{profile?.title || 'Initiate'}</Text>
            </Text> */}

            {mp <= 0 && (
              <View className="mt-1 rounded border border-red-500/50 bg-red-500/10 px-3 py-1">
                <Text className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                  DEBUFF ACTIVE: XP -50%
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* <View className='mb-6 gap-2 flex-row justify-between items-center'> */}
        {/* Vitals Section */}
        <View className="mb-6 gap-2">
          <StatBar label="MP" value={mp} maxValue={maxMp} colorClass="bg-blue-500" />
          {mp < 10 && mp > 0 && (
            <Text className="text-center text-[10px] font-bold uppercase tracking-widest text-red-400">
              Burnout symptoms detected — rest needed
            </Text>
          )}
        </View>

        {/* Experience Section */}
        <View className="mb-8 gap-2">
          <StatBar
            value={xpProgress}
            label="Experience"
            maxValue={xpToNext}
            showValueText={true}
            heightClass="h-2"
          />
        </View>

        {/* Attributes Section */}
        <View className="relative border-t-2 border-accent/20 pt-8">
          <View className="absolute -top-3 left-1/2 -ml-24 bg-bg-base px-4">
            <Text className="text-sm font-bold uppercase tracking-widest text-text-dim">
              Founder Attributes
            </Text>
          </View>

          <View className="mt-4 flex-row flex-wrap justify-between gap-y-4">
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
            <View className="relative w-[48%] justify-between overflow-hidden rounded-xl border border-orange-500/30 bg-gray-900 p-4">
              <View
                className="absolute right-0 top-0 p-4"
                style={
                  profile?.current_streak && profile.current_streak > 0
                    ? { opacity: 1 }
                    : { opacity: 0.1 }
                }
              >
                {/* Background Decoration */}
                <Text className="text-4xl ">🔥</Text>
              </View>

              <View className="relative mb-2">
                <View className="absolute -left-5 top-1 h-1.5 w-1.5 rounded-full bg-orange-500" />
                <Text className="text-[10px] font-bold uppercase tracking-widest text-orange-400">
                  Streak
                </Text>
              </View>
              <View className="flex-row items-end">
                <Text className="mr-1 text-2xl font-black tracking-wider text-white">
                  {profile?.current_streak || 0}
                </Text>
                <Text className="mb-1.5 text-xs font-bold text-gray-500">DAYS</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FAB - Log Entry Trigger */}
      <View className="absolute bottom-8 right-6 z-50">
        <TouchableOpacity
          onPress={() => setLogModalVisible(true)}
          style={{
            shadowColor: accentColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
            elevation: 10,
          }}
          className="h-14 w-14 items-center justify-center overflow-hidden border border-gray-700 bg-gray-900"
        >
          <CornerDecorations size="sm" color={accentColor} />
          <IconSymbol name="plus" size={24} color={accentColor} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
