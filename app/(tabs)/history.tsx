import { CornerDecorations } from '@/components/ui/CornerDecorations';
import { LogCard } from '@/components/ui/LogCard';
import { LogDetailsModal } from '@/components/ui/LogDetailsModal';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Log, useLogStore } from '@/store/logStore';
import { useUserStore } from '@/store/userStore';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { RefreshControl } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HistoryScreen() {
  const { key: themeKey } = useTheme();
  const { profile } = useUserStore();
  const { logs, fetchLogs, isLoading } = useLogStore();

  // Get dynamic accent color
  const accentColor = (Colors as any)[themeKey]?.accent || Colors.emerald.accent;

  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch logs only when screen focuses AND we have no cached data yet.
  // This avoids the spinner flash on every tab switch while pull-to-refresh
  // still allows manual data refresh.
  useFocusEffect(
    useCallback(() => {
      if (profile?.id && logs.length === 0) {
        fetchLogs(profile.id);
      }
    }, [profile?.id, logs.length])
  );

  const handleLogPress = (log: Log) => {
    setSelectedLog(log);
    setModalVisible(true);
  };

  const onRefresh = useCallback(async () => {
    if (profile?.id) {
      setRefreshing(true);
      await fetchLogs(profile.id);
      setRefreshing(false);
    }
  }, [profile?.id, fetchLogs]);

  const handleCloseModal = () => {
    setModalVisible(false);
    // Small delay to clear selection after animation
    setTimeout(() => setSelectedLog(null), 300);
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className={`flex-1 bg-bg-base theme-${themeKey}`}
    >
      <View className="flex-1 overflow-hidden px-6 pt-4">
        <CornerDecorations size="md" color={accentColor} />

        {/* Header */}
        <View className="mb-6 mt-6">
          <View className="mb-2 flex-row items-center">
            <View
              className="mr-2 h-2 w-2 animate-pulse rounded-full"
              style={{ backgroundColor: accentColor }}
            />
            <Text
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: accentColor, opacity: 0.8 }}
            >
              Secure Archive
            </Text>
          </View>
          <Text className="text-3xl font-black tracking-wider text-white">THE LEDGER</Text>
          <View
            className="mt-4 h-[1px] w-full"
            style={{ backgroundColor: accentColor, opacity: 0.2 }}
          />
        </View>

        {/* Content */}
        {isLoading && logs.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={accentColor} />
            <Text className="mt-4 text-xs tracking-widest text-gray-500">
              DECRYPTING RECORDS...
            </Text>
          </View>
        ) : (
          <FlashList
            data={logs}
            renderItem={({ item }) => (
              <LogCard log={item} onPress={handleLogPress} accentColor={accentColor} />
            )}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            maxItemsInRecyclePool={15}
            pagingEnabled
            contentContainerStyle={{ paddingBottom: 100 }}
            // onRefresh={onRefresh}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[accentColor]}
                progressBackgroundColor={'#020617'}
              />
            }
            refreshing={refreshing}
            ListEmptyComponent={() => (
              <View className="items-center justify-center py-20 opacity-50">
                <Text className="font-mono text-xs uppercase tracking-widest text-gray-600">
                  No records found in archive
                </Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Modal */}
      <LogDetailsModal
        visible={modalVisible}
        log={selectedLog}
        onClose={handleCloseModal}
        accentColor={accentColor}
      />
    </SafeAreaView>
  );
}
