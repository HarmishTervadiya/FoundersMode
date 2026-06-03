import { CornerDecorations } from '@/components/ui/CornerDecorations';
import { AlertType, SystemAlert } from '@/components/ui/SystemAlert';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { useVaultStore } from '@/store/vaultStore';
import { soundService } from '@/utils/soundService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, Key, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// const CornerDecorations = () => {
//     return (
//         <View className="absolute inset-0 pointer-events-none">
//             <View className="absolute top-0 left-0">
//                 <View className="w-4 h-4 absolute top-0 left-0 bg-accent" />
//                 <View className="w-12 h-0.5 absolute top-0 left-0 bg-accent opacity-60" />
//                 <View className="w-0.5 h-12 absolute top-0 left-0 bg-accent opacity-60" />
//             </View>
//             <View className="absolute top-0 right-0">
//                 <View className="w-4 h-4 absolute top-0 right-0 bg-accent" />
//                 <View className="w-12 h-0.5 absolute top-0 right-0 bg-accent opacity-60" />
//                 <View className="w-0.5 h-12 absolute top-0 right-0 bg-accent opacity-60" />
//             </View>
//             <View className="absolute bottom-0 left-0">
//                 <View className="w-4 h-4 absolute bottom-0 left-0 bg-accent" />
//                 <View className="w-12 h-0.5 absolute bottom-0 left-0 bg-accent opacity-60" />
//                 <View className="w-0.5 h-12 absolute bottom-0 left-0 bg-accent opacity-60" />
//             </View>
//             <View className="absolute bottom-0 right-0">
//                 <View className="w-4 h-4 absolute bottom-0 right-0 bg-accent" />
//                 <View className="w-12 h-0.5 absolute bottom-0 right-0 bg-accent opacity-60" />
//                 <View className="w-0.5 h-12 absolute bottom-0 right-0 bg-accent opacity-60" />
//             </View>
//         </View>
//     );
// };

export default function VaultKeyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { key: themeKey } = useTheme();
  const { upsertProfile, checkUsernameUnique, profile } = useUserStore();
  const { user } = useAuthStore();
  const { validateVaultKey, isValidating } = useVaultStore();

  // Get icon color from Colors constant
  const iconColor = (Colors as any)[themeKey]?.text || Colors.emerald.text;

  // State
  const [step, setStep] = useState<'CHOICE' | 'LEGACY_INPUT' | 'FRESH_SETUP'>('CHOICE');
  const [legacyKey, setLegacyKey] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [keyError, setKeyError] = useState('');

  // Alert State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: AlertType;
    title: string;
    message: string;
    primaryLabel?: string;
    onPrimaryPress?: () => void;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showAlert = (
    type: AlertType,
    title: string,
    message: string,
    primaryLabel?: string,
    onPrimaryPress?: () => void
  ) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      primaryLabel,
      onPrimaryPress: onPrimaryPress
        ? () => {
            onPrimaryPress();
            setAlertConfig((prev) => ({ ...prev, visible: false }));
          }
        : undefined,
    });
  };

  // Check for error from migration screen
  useEffect(() => {
    if (params.error) {
      setKeyError(params.error as string);
      setStep('LEGACY_INPUT');
    }
  }, [params.error]);

  // Play sound when username modal opens
  useEffect(() => {
    if (showUsernameModal) {
      soundService.play('modal_open');
    }
  }, [showUsernameModal]);

  // Validate username format
  const validateUsername = (name: string): string | null => {
    const trimmed = name.trim();
    if (trimmed.length < 3) return 'Username must be at least 3 characters';
    if (trimmed.length > 20) return 'Username must be 20 characters or less';
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return 'Only letters, numbers, and underscores allowed';
    return null;
  };

  // New User - Submit with Vault Key (uses it as username prefix)
  const handleCustomKeySubmit = async () => {
    if (!user) {
      showAlert('error', 'Error', 'No authenticated user found.');
      return;
    }

    const derivedUsername = `VK_${customKey.trim().toUpperCase()}`;

    setIsLoading(true);
    try {
      await upsertProfile(user.id, { username: derivedUsername });
      showAlert(
        'success',
        'Vault Key Created',
        `Your key ${customKey} has been registered!`,
        'Enter Facility',
        () => {
          soundService.play('level_up');
          router.replace('/(tabs)');
        }
      );
    } catch (e) {
      console.error(e);
      showAlert('error', 'Error', 'Failed to create vault key.');
    } finally {
      setIsLoading(false);
    }
  };

  // Skip Vault Key -> Show Username Modal
  const handleSkipKey = () => {
    setShowUsernameModal(true);
  };

  // Username Modal Submit
  const handleUsernameSubmit = async () => {
    const trimmedUsername = username.trim();

    // Format validation
    const formatError = validateUsername(trimmedUsername);
    if (formatError) {
      setUsernameError(formatError);
      return;
    }

    if (!user) {
      showAlert('error', 'Error', 'No authenticated user.');
      return;
    }

    setIsLoading(true);
    setUsernameError('');

    try {
      // Check uniqueness
      const isUnique = await checkUsernameUnique(trimmedUsername);
      if (!isUnique) {
        setUsernameError('Username is already taken');
        setIsLoading(false);
        return;
      }

      // Save to profile
      await upsertProfile(user.id, { username: trimmedUsername });

      setShowUsernameModal(false);
      showAlert(
        'success',
        'Identity Confirmed',
        `Welcome, ${trimmedUsername}!`,
        'Enter Facility',
        () => {
          soundService.play('level_up');
          router.replace('/(tabs)');
        }
      );
    } catch (e) {
      console.error(e);
      setUsernameError('Failed to create identity. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Legacy Key Submit (for returning users)
  const handleLegacySubmit = async () => {
    if (!user) {
      showAlert('error', 'Error', 'No authenticated user found.');
      return;
    }

    setKeyError('');
    setIsLoading(true);

    try {
      // Step 1: Validate vault key
      console.log('[VaultKey] Submitting legacy key:', legacyKey);
      console.log('[VaultKey] Key length:', legacyKey.length);
      const validation = await validateVaultKey(legacyKey);
      console.log('[VaultKey] Validation result:', validation);

      if (!validation.exists) {
        setKeyError('Invalid vault key. Please check and try again.');
        setIsLoading(false);
        return;
      }

      if (validation.isClaimed) {
        setKeyError('This vault key has already been claimed by another user.');
        setIsLoading(false);
        return;
      }

      // Step 2: Navigate to migration screen
      router.replace({
        pathname: '/auth/migration',
        params: {
          secretKey: legacyKey.toUpperCase().trim(),
          userId: user.id,
          currentLevel: (profile?.level || 1).toString(),
        },
      });
    } catch (e) {
      console.error(e);
      setKeyError('Failed to validate vault key. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className={`relative flex-1 bg-bg-base theme-${themeKey}`}>
      {/* ScrollView to handle keyboard interactions smoothly */}
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 32 }}>
        <View className="pb-4 pt-4">
          <Text className="mb-6 text-left text-xs font-bold tracking-[4px] text-text-primary">
            ◢ SECURE FACILITY // LEGACY MIGRATION ◣
          </Text>
        </View>

        <View className="flex-1 justify-center">
          {/* Header Icon & Text */}
          <View className="mb-12 items-center">
            <View className="relative mb-6 h-20 w-20 items-center justify-center border-2 border-accent/30 bg-accent/10">
              <CornerDecorations size="sm" color={iconColor} />
              <Key size={40} color={iconColor} strokeWidth={2} />
            </View>
            <Text className="mb-3 text-center text-3xl font-bold tracking-wider text-text-primary">
              {step === 'CHOICE'
                ? 'WELCOME BACK?'
                : step === 'LEGACY_INPUT'
                  ? 'LEGACY ACCESS'
                  : 'NEW PROTOCOL'}
            </Text>
            <Text className="text-center text-lg tracking-wide text-text-muted">
              {step === 'CHOICE'
                ? "Did you bank your XP in the Founder's Vault?"
                : step === 'LEGACY_INPUT'
                  ? 'Enter your existing vault key.'
                  : 'Create a vault key or proceed with identity.'}
            </Text>
          </View>

          {/* STEP: CHOICE */}
          {step === 'CHOICE' && (
            <View className="gap-y-3">
              <TouchableOpacity
                onPress={() => setStep('LEGACY_INPUT')}
                activeOpacity={0.9}
                className="relative w-full items-center justify-center border border-accent/50 bg-accent/20 py-5"
              >
                <CornerDecorations size="sm" color={iconColor} />
                <Text className="font-semibold uppercase tracking-wider text-text-primary">
                  [ YES, I HAVE A LEGACY KEY ]
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSkipKey}
                activeOpacity={0.9}
                className="relative w-full items-center justify-center border-2 border-accent/30 bg-bg-card/50 py-5"
              >
                <CornerDecorations size="sm" color={iconColor} />
                <Text className="font-semibold uppercase tracking-wider text-text-primary">
                  [ NO, I'M STARTING FRESH ]
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP: LEGACY INPUT */}
          {step === 'LEGACY_INPUT' && (
            <View className="gap-y-6">
              <View>
                <Text className="mb-3 text-center text-sm font-medium tracking-wider text-text-primary">
                  [ ENTER YOUR LEGACY KEY ]
                </Text>
                <TextInput
                  value={legacyKey}
                  onChangeText={(text) => {
                    setLegacyKey(text.toUpperCase());
                    setKeyError(''); // Clear error on input change
                  }}
                  placeholder="1BIZ-HR"
                  placeholderTextColor={iconColor}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  className="w-full border-2 border-accent/30 bg-bg-card/50 py-5 text-center font-mono text-2xl tracking-wider text-text-primary"
                  maxLength={10}
                />
                {/* Error Display */}
                {keyError ? (
                  <View className="mt-3 flex-row items-center justify-center gap-2">
                    <AlertCircle size={16} color="#f87171" />
                    <Text className="font-mono text-sm text-red-400">{keyError}</Text>
                  </View>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={handleLegacySubmit}
                disabled={legacyKey.length < 3 || isLoading || isValidating}
                className={`relative w-full items-center justify-center border border-accent/50 bg-accent/20 py-5 ${legacyKey.length < 3 || isLoading || isValidating ? 'opacity-50' : ''}`}
              >
                <CornerDecorations size="sm" color={iconColor} />
                {isLoading || isValidating ? (
                  <ActivityIndicator color={iconColor} />
                ) : (
                  <Text className="font-semibold uppercase tracking-wider text-text-primary">
                    [[ CLAIM MY PROGRESS ]]
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep('CHOICE')} className="items-center py-3">
                <Text className="font-medium tracking-wider text-text-dim">[ Go Back ]</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* USERNAME MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showUsernameModal}
        onRequestClose={() => {}} // Blocking, cannot close via back button
      >
        <View className="flex-1 items-center justify-center bg-bg-base/90 p-6">
          <View className="relative w-full border-2 border-accent/30 bg-bg-card p-8">
            <CornerDecorations size="md" color={iconColor} />

            <View className="mb-8 items-center">
              <User size={48} color={iconColor} />
              <Text className="mt-4 text-2xl font-bold tracking-widest text-text-primary">
                CREATE IDENTITY
              </Text>
              <Text className="mt-2 text-center text-text-muted opacity-80">
                Choose your unique founder identity to begin.
              </Text>
            </View>

            <View className="mb-8">
              <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-text-dim">
                Username
              </Text>
              <TextInput
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  setUsernameError('');
                }}
                placeholder="PlayerOne"
                placeholderTextColor={iconColor}
                className={`w-full border border-accent/30 bg-bg-base p-4 font-mono text-lg text-text-primary ${usernameError ? 'border-red-500' : ''}`}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
              />
              {usernameError ? (
                <Text className="mt-2 text-xs text-red-400">{usernameError}</Text>
              ) : (
                <Text className="mt-2 text-xs text-slate-500">
                  3-20 characters. Letters, numbers, underscores only.
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={handleUsernameSubmit}
              disabled={username.length < 3 || isLoading}
              className={`relative w-full items-center justify-center border border-accent/50 bg-accent/20 py-4 ${username.length < 3 || isLoading ? 'opacity-50' : ''}`}
            >
              {isLoading ? (
                <ActivityIndicator color={iconColor} />
              ) : (
                <Text className="font-bold tracking-widest text-text-primary">
                  CONFIRM IDENTITY
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* System Alert */}
      <SystemAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
        primaryLabel={alertConfig.primaryLabel}
        onPrimaryPress={alertConfig.onPrimaryPress}
        accentColor={iconColor}
      />
    </SafeAreaView>
  );
}
