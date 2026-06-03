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
    <View className="mb-4 mt-6 rounded-lg border border-dashed border-gray-700 p-4">
      <Text className="mb-3 text-center font-mono text-[10px] uppercase tracking-widest text-gray-500">
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
              className={`rounded border px-3 py-2 ${isActive ? 'bg-gray-800' : 'bg-transparent'}`}
              style={{ borderColor: isActive ? themeColor : 'transparent' }}
            >
              <View className="flex-row items-center">
                <View
                  className="mr-2 h-3 w-3 rounded-full"
                  style={{ backgroundColor: themeColor }}
                />
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
