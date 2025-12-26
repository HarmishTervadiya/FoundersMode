import { CornerDecorations } from '@/components/ui/CornerDecorations';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import * as WebBrowser from 'expo-web-browser';
import { Chrome, Zap } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
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
    <SafeAreaView className={`flex-1 relative bg-bg-base theme-${themeKey}`}>
      {/* Background Glow */}
      <View className="absolute inset-0 opacity-5 bg-accent" />

      <View className="flex-1 p-8 justify-center">
        {/* Header */}
        <View className="items-center mb-16">
          <View className="w-24 h-24 border-2 border-accent/30 bg-accent/10 items-center justify-center mb-8 relative">
            <CornerDecorations size='sm' color={iconColor} />
            <Zap size={48} color={iconColor} />
          </View>
          <Text className="text-3xl font-bold tracking-wider mb-3 text-text-primary">
            [ FOUNDERS MODE ]
          </Text>
          <Text className="text-sm tracking-widest font-bold opacity-60 text-text-primary">
            SECURE AUTHENTICATION REQUIRED
          </Text>
        </View>

        {/* Google Sign In - Single Option */}
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={isLoading}
          activeOpacity={0.8}
          className={`w-full py-5 items-center justify-center border-2 relative bg-accent/20 border-accent/50 ${isLoading ? 'opacity-50' : ''}`}
        >
          <CornerDecorations size='md' color={iconColor} />
          {isLoading ? (
            <ActivityIndicator color={iconColor} />
          ) : (
            <View className="flex-row items-center gap-3">
              <Chrome size={24} color={iconColor} />
              <Text className="font-bold tracking-wider uppercase text-text-primary">
                Sign in with Google
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <View className="items-center mt-12">
          <Text className="text-xs tracking-widest opacity-40 text-text-primary">
            SECURE • ENCRYPTED • FOUNDER-APPROVED
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
