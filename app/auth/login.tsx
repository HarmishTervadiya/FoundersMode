import { cx, theme } from '@/constants/theme.utils';
import { useAuthStore } from '@/store/authStore';
import * as WebBrowser from 'expo-web-browser';
import { Chrome, Zap } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Ensure WebBrowser can close properly (standard boilerplate)
WebBrowser.maybeCompleteAuthSession();

// Corner Decorations Component
const CornerDecorations = () => (
  <View className="absolute inset-0 pointer-events-none">
    <View className="absolute top-0 left-0">
      <View className={cx('w-4 h-4 absolute top-0 left-0', theme.accentBg)} />
      <View className={cx('w-12 h-0.5 absolute top-0 left-0', theme.accentBg, 'opacity-60')} />
      <View className={cx('w-0.5 h-12 absolute top-0 left-0', theme.accentBg, 'opacity-60')} />
    </View>
    <View className="absolute top-0 right-0">
      <View className={cx('w-4 h-4 absolute top-0 right-0', theme.accentBg)} />
      <View className={cx('w-12 h-0.5 absolute top-0 right-0', theme.accentBg, 'opacity-60')} />
      <View className={cx('w-0.5 h-12 absolute top-0 right-0', theme.accentBg, 'opacity-60')} />
    </View>
    <View className="absolute bottom-0 left-0">
      <View className={cx('w-4 h-4 absolute bottom-0 left-0', theme.accentBg)} />
      <View className={cx('w-12 h-0.5 absolute bottom-0 left-0', theme.accentBg, 'opacity-60')} />
      <View className={cx('w-0.5 h-12 absolute bottom-0 left-0', theme.accentBg, 'opacity-60')} />
    </View>
    <View className="absolute bottom-0 right-0">
      <View className={cx('w-4 h-4 absolute bottom-0 right-0', theme.accentBg)} />
      <View className={cx('w-12 h-0.5 absolute bottom-0 right-0', theme.accentBg, 'opacity-60')} />
      <View className={cx('w-0.5 h-12 absolute bottom-0 right-0', theme.accentBg, 'opacity-60')} />
    </View>
  </View>
);

export default function LoginScreen() {
  const { signInWithGoogle, isLoading: isAuthLoading } = useAuthStore();
  const [localLoading, setLocalLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLocalLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error("Google Sign-In Error:", error);
      }
    } catch (e) {
      console.error('Login exception', e);
    } finally {
      setLocalLoading(false);
    }
  };

  const isLoading = isAuthLoading || localLoading;

  return (
    <SafeAreaView className={cx('flex-1 relative', theme.bgClass)}>
      {/* Background Glow */}
      <View className={cx('absolute inset-0 opacity-5', theme.accentBg)} />

      <View className="flex-1 p-8 justify-center">
        {/* Header */}
        <View className="items-center mb-16">
          <View className={cx('w-24 h-24 border-2 items-center justify-center mb-8 relative', theme.borderClass, theme.glowClass)}>
            <CornerDecorations />
            <Zap size={48} color={theme.iconColor} />
          </View>
          <Text className={cx('text-3xl font-bold tracking-wider mb-3', theme.textClass)}>
            [ FOUNDERS MODE ]
          </Text>
          <Text className={cx('text-sm tracking-widest font-bold opacity-60', theme.textClass)}>
            SECURE AUTHENTICATION REQUIRED
          </Text>
        </View>

        {/* Google Sign In - Single Option */}
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={isLoading}
          activeOpacity={0.8}
          className={cx(
            'w-full py-5 items-center justify-center border-2 relative',
            theme.buttonBg,
            theme.buttonBorder,
            isLoading && 'opacity-50'
          )}
        >
          <CornerDecorations />
          {isLoading ? (
            <ActivityIndicator color={theme.iconColor} />
          ) : (
            <View className="flex-row items-center gap-3">
              <Chrome size={24} color={theme.iconColor} />
              <Text className={cx('font-bold tracking-wider uppercase', theme.textClass)}>
                Sign in with Google
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <View className="items-center mt-12">
          <Text className={cx('text-xs tracking-widest opacity-40', theme.textClass)}>
            SECURE • ENCRYPTED • FOUNDER-APPROVED
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
