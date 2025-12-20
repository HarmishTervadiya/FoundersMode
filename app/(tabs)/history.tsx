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

    // Fetch logs when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (profile?.id) {
                fetchLogs(profile.id);
            }
        }, [profile?.id])
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
        <SafeAreaView edges={['top', 'left', 'right']} className={`flex-1 bg-bg-base theme-${themeKey}`}>
            <View className='flex-1 px-6 pt-4'>
                <CornerDecorations size='md' color={accentColor} />

                {/* Header */}
                <View className="mt-6 mb-6">
                    <View className="flex-row items-center mb-2">
                        <View className="w-2 h-2 rounded-full mr-2 animate-pulse" style={{ backgroundColor: accentColor }} />
                        <Text className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: accentColor, opacity: 0.8 }}>
                            Secure Archive
                        </Text>
                    </View>
                    <Text className="text-3xl font-black text-white tracking-wider">
                        THE LEDGER
                    </Text>
                    <View className="h-[1px] w-full mt-4" style={{ backgroundColor: accentColor, opacity: 0.2 }} />
                </View>

                {/* Content */}
                {isLoading && logs.length === 0 ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color={accentColor} />
                        <Text className="text-gray-500 text-xs mt-4 tracking-widest">DECRYPTING RECORDS...</Text>
                    </View>
                ) : (
                    <FlashList
                        data={logs}
                        renderItem={({ item }) => (
                            <LogCard log={item} onPress={handleLogPress} accentColor={accentColor} />
                        )}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        // onRefresh={onRefresh}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={[accentColor]}
                                progressBackgroundColor={"#020617"}
                            />
                        }
                        refreshing={refreshing}
                        ListEmptyComponent={() => (
                            <View className="items-center justify-center py-20 opacity-50">
                                <Text className="text-gray-600 font-mono text-xs tracking-widest uppercase">
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
