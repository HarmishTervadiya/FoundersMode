import { CornerDecorations } from '@/components/ui/CornerDecorations';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import * as WebBrowser from 'expo-web-browser';
import { Chrome, Zap } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Linking, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Ensure WebBrowser can close properly (standard boilerplate)
WebBrowser.maybeCompleteAuthSession();

// Corner Decorations Component
// const CornerDecorations = () => (
//   <View className="absolute inset-0 pointer-events-none">
//     <View className="absolute top-0 left-0">
//       <View className="w-4 h-4 absolute top-0 left-0 bg-accent" />
//       <View className="w-12 h-0.5 absolute top-0 left-0 bg-accent opacity-60" />
//       <View className="w-0.5 h-12 absolute top-0 left-0 bg-accent opacity-60" />
//     </View>
//     <View className="absolute top-0 right-0">
//       <View className="w-4 h-4 absolute top-0 right-0 bg-accent" />
//       <View className="w-12 h-0.5 absolute top-0 right-0 bg-accent opacity-60" />
//       <View className="w-0.5 h-12 absolute top-0 right-0 bg-accent opacity-60" />
//     </View>
//     <View className="absolute bottom-0 left-0">
//       <View className="w-4 h-4 absolute bottom-0 left-0 bg-accent" />
//       <View className="w-12 h-0.5 absolute bottom-0 left-0 bg-accent opacity-60" />
//       <View className="w-0.5 h-12 absolute bottom-0 left-0 bg-accent opacity-60" />
//     </View>
//     <View className="absolute bottom-0 right-0">
//       <View className="w-4 h-4 absolute bottom-0 right-0 bg-accent" />
//       <View className="w-12 h-0.5 absolute bottom-0 right-0 bg-accent opacity-60" />
//       <View className="w-0.5 h-12 absolute bottom-0 right-0 bg-accent opacity-60" />
//     </View>
//   </View>
// );

export default function LoginScreen() {
  const { key: themeKey } = useTheme();
  const { signInWithGoogle, isLoading: isAuthLoading } = useAuthStore();
  const [localLoading, setLocalLoading] = useState(false);

  // Get icon color from Colors constant
  const iconColor = (Colors as any)[themeKey]?.text || Colors.emerald.text;

  const handleGoogleSignIn = async () => {
    setLocalLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('Google Sign-In Error:', error);
      }
    } catch (e) {
      console.error('Login exception', e);
    } finally {
      setLocalLoading(false);
    }
  };

  const isLoading = isAuthLoading || localLoading;

  return (
    <SafeAreaView className={`relative flex-1 bg-bg-base theme-${themeKey}`}>
      {/* Background Glow */}
      <View className="absolute inset-0 bg-accent opacity-5" />

      <View className="flex-1 justify-center p-8">
        {/* Header */}
        <View className="mb-16 items-center">
          <View className="relative mb-8 h-24 w-24 items-center justify-center border-2 border-accent/30 bg-accent/10">
            <CornerDecorations size="sm" color={iconColor} />
            <Zap size={48} color={iconColor} />
          </View>
          <Text className="mb-3 text-3xl font-bold tracking-wider text-text-primary">
            [ FOUNDERS MODE ]
          </Text>
          <Text className="text-sm font-bold tracking-widest text-text-primary opacity-60">
            SECURE AUTHENTICATION REQUIRED
          </Text>
        </View>

        {/* Google Sign In - Single Option */}
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={isLoading}
          activeOpacity={0.8}
          className={`relative w-full items-center justify-center border-2 border-accent/50 bg-accent/20 py-5 ${isLoading ? 'opacity-50' : ''}`}
        >
          <CornerDecorations size="md" color={iconColor} />
          {isLoading ? (
            <ActivityIndicator color={iconColor} />
          ) : (
            <View className="flex-row items-center gap-3">
              <Chrome size={24} color={iconColor} />
              <Text className="font-bold uppercase tracking-wider text-text-primary">
                Sign in with Google
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Consent Text */}
        <View className="mt-6 items-center px-4">
          <Text className="text-center font-mono text-xs text-text-dim/50">
            {'By continuing, you agree to our '}
            <Text
              className="font-mono text-xs text-text-primary"
              onPress={() => Linking.openURL('https://foundersmode.harmistervadiya.dev/privacy')}
            >
              Privacy Policy
            </Text>
            {' and '}
            <Text
              className="font-mono text-xs text-text-primary"
              onPress={() => Linking.openURL('https://foundersmode.harmistervadiya.dev/terms')}
            >
              Terms of Service
            </Text>
            {'.'}
          </Text>
        </View>

        {/* Footer */}
        <View className="mt-12 items-center">
          <Text className="text-xs tracking-widest text-text-primary opacity-40">
            SECURE • ENCRYPTED • FOUNDER-APPROVED
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
