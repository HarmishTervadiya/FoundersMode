import { CornerDecorations } from '@/components/ui/CornerDecorations';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'expo-router';
import { Key, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
    const { key: themeKey } = useTheme();
    const { upsertProfile, checkUsernameUnique } = useUserStore();
    const { user } = useAuthStore();

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
            Alert.alert("Error", "No authenticated user found.");
            return;
        }

        const derivedUsername = `VK_${customKey.trim().toUpperCase()}`;

        setIsLoading(true);
        try {
            await upsertProfile(user.id, { username: derivedUsername });
            Alert.alert(
                "Vault Key Created",
                `Your key ${customKey} has been registered!`,
                [{ text: "Enter Facility", onPress: () => router.replace('/(tabs)') }]
            );
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to create vault key.");
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
            Alert.alert("Error", "No authenticated user.");
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
            Alert.alert(
                "Identity Confirmed",
                `Welcome, ${trimmedUsername}!`,
                [{ text: "Enter Facility", onPress: () => router.replace('/(tabs)') }]
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
            Alert.alert("Error", "No authenticated user found.");
            return;
        }

        // Legacy key acts as username lookup
        const legacyUsername = `VK_${legacyKey.trim().toUpperCase()}`;

        setIsLoading(true);
        try {
            // For legacy keys, we just set the username directly
            await upsertProfile(user.id, { username: legacyUsername });

            Alert.alert(
                "Legacy Key Accepted",
                `Your vault key ${legacyKey} has been linked.`,
                [{ text: "Enter Facility", onPress: () => router.replace('/(tabs)') }]
            );
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to link legacy key.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView className={`flex-1 relative bg-bg-base theme-${themeKey}`}>

            {/* ScrollView to handle keyboard interactions smoothly */}
            <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 32 }}>

                <View className="pt-4 pb-4">
                    <Text className="text-xs tracking-[4px] mb-6 font-bold text-left text-text-primary">
                        ◢ SECURE FACILITY // LEGACY MIGRATION ◣
                    </Text>
                </View>

                <View className="flex-1 justify-center">

                    {/* Header Icon & Text */}
                    <View className="mb-12 items-center">
                        <View className="items-center justify-center w-20 h-20 border-2 mb-6 relative bg-accent/10 border-accent/30">
                            <CornerDecorations size='sm' color={iconColor} />
                            <Key size={40} color={iconColor} strokeWidth={2} />
                        </View>
                        <Text className="text-3xl font-bold mb-3 tracking-wider text-center text-text-primary">
                            {step === 'CHOICE' ? 'WELCOME BACK?' : step === 'LEGACY_INPUT' ? 'LEGACY ACCESS' : 'NEW PROTOCOL'}
                        </Text>
                        <Text className="text-lg tracking-wide text-center text-text-muted">
                            {step === 'CHOICE' ? "Did you bank your XP in the Founder's Vault?" :
                                step === 'LEGACY_INPUT' ? "Enter your existing vault key." :
                                    "Create a vault key or proceed with identity."}
                        </Text>
                    </View>


                    {/* STEP: CHOICE */}
                    {step === 'CHOICE' && (
                        <View className="gap-y-3">
                            <TouchableOpacity
                                onPress={() => setStep('LEGACY_INPUT')}
                                activeOpacity={0.9}
                                className="w-full py-5 items-center justify-center border relative bg-accent/20 border-accent/50"
                            >
                                <CornerDecorations size='sm' color={iconColor} />
                                <Text className="font-semibold uppercase tracking-wider text-text-primary">[ YES, I HAVE A LEGACY KEY ]</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleSkipKey}
                                activeOpacity={0.9}
                                className="w-full border-2 py-5 items-center justify-center bg-bg-card/50 relative border-accent/30"
                            >
                                <CornerDecorations size='sm' color={iconColor} />
                                <Text className="font-semibold uppercase tracking-wider text-text-primary">[ NO, I'M STARTING FRESH ]</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* STEP: LEGACY INPUT */}
                    {step === 'LEGACY_INPUT' && (
                        <View className="gap-y-6">
                            <View>
                                <Text className="text-sm font-medium mb-3 tracking-wider text-center text-text-primary">[ ENTER YOUR LEGACY KEY ]</Text>
                                <TextInput
                                    value={legacyKey}
                                    onChangeText={(text) => setLegacyKey(text.toUpperCase())}
                                    placeholder="K8X-29L"
                                    placeholderTextColor={iconColor}
                                    className="w-full border-2 text-center text-2xl font-mono tracking-wider py-5 bg-bg-card/50 border-accent/30 text-text-primary"
                                    maxLength={7}
                                />
                            </View>
                            <TouchableOpacity
                                onPress={handleLegacySubmit}
                                disabled={legacyKey.length < 3 || isLoading}
                                className={`w-full py-5 items-center justify-center border relative bg-accent/20 border-accent/50 ${(legacyKey.length < 3 || isLoading) ? 'opacity-50' : ''}`}
                            >
                                <CornerDecorations size='sm' color={iconColor} />
                                {isLoading ? <ActivityIndicator color={iconColor} /> : <Text className="font-semibold uppercase tracking-wider text-text-primary">[[ CLAIM MY PROGRESS ]]</Text>}
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
                onRequestClose={() => { }} // Blocking, cannot close via back button
            >
                <View className="flex-1 bg-bg-base/90 items-center justify-center p-6">
                    <View className="w-full bg-bg-card border-2 p-8 relative border-accent/30">
                        <CornerDecorations size='md' color={iconColor} />

                        <View className="items-center mb-8">
                            <User size={48} color={iconColor} />
                            <Text className="text-2xl font-bold mt-4 tracking-widest text-text-primary">CREATE IDENTITY</Text>
                            <Text className="text-center mt-2 opacity-80 text-text-muted">Choose your unique founder identity to begin.</Text>
                        </View>

                        <View className="mb-8">
                            <Text className="text-xs font-bold mb-2 tracking-widest uppercase text-text-dim">Username</Text>
                            <TextInput
                                value={username}
                                onChangeText={(text) => {
                                    setUsername(text);
                                    setUsernameError('');
                                }}
                                placeholder="PlayerOne"
                                placeholderTextColor={iconColor}
                                className={`w-full border p-4 font-mono text-lg bg-bg-base border-accent/30 text-text-primary ${usernameError ? 'border-red-500' : ''}`}
                                autoCapitalize="none"
                                autoCorrect={false}
                                maxLength={20}
                            />
                            {usernameError ? (
                                <Text className="text-xs text-red-400 mt-2">{usernameError}</Text>
                            ) : (
                                <Text className="text-xs text-slate-500 mt-2">3-20 characters. Letters, numbers, underscores only.</Text>
                            )}
                        </View>

                        <TouchableOpacity
                            onPress={handleUsernameSubmit}
                            disabled={username.length < 3 || isLoading}
                            className={`w-full py-4 items-center justify-center border relative bg-accent/20 border-accent/50 ${(username.length < 3 || isLoading) ? 'opacity-50' : ''}`}
                        >
                            {isLoading ? <ActivityIndicator color={iconColor} /> : <Text className="font-bold tracking-widest text-text-primary">CONFIRM IDENTITY</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}
