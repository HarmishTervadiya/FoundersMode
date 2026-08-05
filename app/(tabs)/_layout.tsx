import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Tabs } from 'expo-router';
import { LayoutDashboard, ScrollText, User } from 'lucide-react-native';
import React from 'react';
import { Platform, View } from 'react-native';

export default function TabLayout() {
  const { key: themeKey } = useTheme();
  const themeColors = Colors[themeKey];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Solid scene background eliminates white flash during any tab switch.
        // bg-bg-base = #151718 across all themes.
        sceneStyle: { backgroundColor: themeColors.background },
        // 1. The HUD Container
        tabBarStyle: {
          backgroundColor: themeColors.navBar,
          borderTopWidth: 1,
          borderTopColor: '#1f2937', // border-gray-800 - Keeping this static or could use a darker shade of accent
          height: 120,
          paddingTop: 10,
          elevation: 0, // Remove Android shadow
        },
        // 2. Neon Accents
        tabBarActiveTintColor: themeColors.accent,
        tabBarInactiveTintColor: themeColors.tabIconDefault,
        // 3. Typography (Monospace for RPG feel)
        tabBarLabelStyle: {
          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
          fontSize: 10,
          fontWeight: 'bold',
          marginTop: 4,
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
      }}
      backBehavior="history"
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'System',
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`items-center justify-center ${focused ? 'opacity-100' : 'opacity-50'}`}
            >
              <LayoutDashboard size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
              {/* Active Indicator Dot */}
              {focused && (
                <View
                  className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full shadow-sm"
                  style={{ backgroundColor: themeColors.accent, shadowColor: themeColors.accent }}
                />
              )}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: 'Logs',
          tabBarIcon: ({ color, focused }) => (
            <ScrollText
              size={24}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
              style={focused ? { opacity: 1 } : { opacity: 0.8 }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Identity',
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`items-center justify-center ${focused ? 'opacity-100' : 'opacity-50'}`}
            >
              <User size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
