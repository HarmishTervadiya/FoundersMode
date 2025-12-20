import { Colors } from '@/constants/theme';
import { THEME_NAMES, ThemeKey } from '@/constants/theme.config';
import { usePreferenceStore } from '@/store/preferenceStore';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface DevThemeToggleProps {
    accentColor: string;
}

export const DevThemeToggle: React.FC<DevThemeToggleProps> = ({ accentColor }) => {
    // Only show in DEV mode
    if (!__DEV__) return null;

    const { devTheme, setDevTheme } = usePreferenceStore();

    return (
        <View className="mt-6 mb-4 p-4 border border-dashed border-gray-700 rounded-lg">
            <Text className="text-gray-500 text-[10px] font-mono mb-3 uppercase tracking-widest text-center">
                [DEV_MODE] :: THEME_OVERRIDE
            </Text>

            <View className="flex-row justify-center gap-2">
                {(Object.keys(THEME_NAMES) as ThemeKey[]).map((themeKey) => {
                    const isActive = devTheme === themeKey || (!devTheme && themeKey === 'emerald'); // 'emerald' is default
                    const themeColor = (Colors as any)[themeKey].accent;

                    return (
                        <TouchableOpacity
                            key={themeKey}
                            onPress={() => setDevTheme(themeKey)}
                            activeOpacity={0.8}
                            className={`px-3 py-2 rounded border ${isActive ? 'bg-gray-800' : 'bg-transparent'}`}
                            style={{ borderColor: isActive ? themeColor : 'transparent' }}
                        >
                            <View className="flex-row items-center">
                                <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: themeColor }} />
                                <Text className={`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-500'}`}>
                                    {THEME_NAMES[themeKey]}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};
