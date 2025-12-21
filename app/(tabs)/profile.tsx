import { DevThemeToggle } from '@/components/profile/DevThemeToggle';
import { FAQModal } from '@/components/profile/FAQModal';
import { FeedbackModal } from '@/components/profile/FeedbackModal';
import { UsernameChangeModal } from '@/components/profile/UsernameChangeModal';
import { CornerDecorations } from '@/components/ui/CornerDecorations';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons'; // Using Expo Icons for consistent UI, Lucide is fine too but vector-icons has good coverage
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { RefreshControl } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
    const { key: themeKey } = useTheme();
    const accentColor = (Colors as any)[themeKey]?.accent || Colors.emerald.accent;

    const { profile, toggleDailyReminder } = useUserStore();
    const { signOut } = useAuthStore();

    const [usernameModalVisible, setUsernameModalVisible] = useState(false);
    const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
    const [faqModalVisible, setFaqModalVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        // We can re-fetch profile to ensure stats are up to date
        if (profile?.id) {
            await useUserStore.getState().fetchProfile(profile.id);
        }
        setRefreshing(false);
    }, [profile?.id]);

    const handleLogout = async () => {
        Alert.alert(
            "Terminate Session?",
            "Unsaved local data might be lost (though we sync often).",
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

    const SettingItem = ({
        label,
        value,
        icon,
        onPress,
        isToggle = false,
        toggleValue = false
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
            onPress={isToggle ? () => { } : onPress}
            className="flex-row items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-lg mb-3"
        >
            <View className="flex-row items-center">
                <View className="p-2 rounded-md mr-3" style={{ backgroundColor: `${accentColor}1A` }}>
                    <Ionicons name={icon} size={18} color={accentColor} />
                </View>
                <Text className="text-gray-200 font-medium">{label}</Text>
            </View>

            {isToggle ? (
                <Switch
                    trackColor={{ false: "#374151", true: `${accentColor}80` }}
                    thumbColor={toggleValue ? accentColor : "#9ca3af"}
                    ios_backgroundColor="#374151"
                    onValueChange={onPress}
                    value={toggleValue}
                />
            ) : (
                <View className="flex-row items-center">
                    {value && <Text className="text-gray-500 mr-2 text-xs">{value}</Text>}
                    <Ionicons name="chevron-forward" size={16} color="#4b5563" />
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView edges={['top', 'left', 'right']} className={`flex-1 bg-bg-base theme-${themeKey}`}>
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, padding: 24 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[accentColor]}
                        progressBackgroundColor={"#020617"}
                    />
                }
            >
                <CornerDecorations color={accentColor} />

                {/* Header Profile Section */}
                <View className="items-center mt-8 mb-8">
                    {/* Avatar Ring */}
                    <View className="p-1 rounded-full border-2 border-dashed mb-4 relative" style={{ borderColor: accentColor }}>
                        {/* Fallback to generic user icon from Ionicons if no image - but usually we want a placeholder image for "design" */}
                        <View className="w-24 h-24 rounded-full bg-gray-800 justify-center items-center overflow-hidden">
                            <Ionicons name="person" size={48} color="#4b5563" />
                        </View>
                        <View className="absolute bottom-0 right-0 bg-gray-900 rounded-full p-1 border border-gray-800">
                            <View className="w-4 h-4 rounded-full bg-green-500 border-2 border-gray-900" />
                        </View>
                    </View>

                    <Text className="text-2xl font-bold text-white tracking-wide mb-1">
                        {profile?.username || "Founder"}
                    </Text>
                    <Text className="text-xs font-mono text-gray-500 tracking-widest uppercase">
                        {profile?.title || "Level " + (profile?.level || 1)}
                    </Text>
                </View>

                {/* Quick Stats Row */}
                <View className="flex-row justify-between mb-8">
                    <View className="flex-1 bg-gray-900 border border-gray-800 rounded-lg p-3 mr-2 items-center">
                        <Text className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Lifetime XP</Text>
                        <Text className="text-white font-bold">
                            {profile?.lifetime_xp?.toLocaleString() || '0'}
                        </Text>
                    </View>
                    <View className="flex-1 bg-gray-900 border border-gray-800 rounded-lg p-3 ml-2 items-center">
                        <Text className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Streak</Text>
                        <View className="flex-row items-center">
                            <Ionicons name="flame" size={14} color="#f59e0b" className="mr-1" />
                            <Text className="text-white font-bold">{profile?.current_streak || 0} Days</Text>
                        </View>
                    </View>
                </View>

                {/* Settings Section */}
                <Text className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">
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
                <DevThemeToggle accentColor={accentColor} />

                {/* Logout */}
                <TouchableOpacity
                    onPress={handleLogout}
                    className="mt-8 mb-12 flex-row justify-center items-center py-4 border border-red-900/50 rounded-lg bg-red-500/5"
                >
                    <Ionicons name="power" size={18} color="#ef4444" style={{ marginRight: 8 }} />
                    <Text className="text-red-500 font-bold tracking-widest text-xs uppercase">
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

        </SafeAreaView>
    );
}
