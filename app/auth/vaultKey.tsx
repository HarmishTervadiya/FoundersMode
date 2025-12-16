import { cx, theme } from '@/constants/theme.utils';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'expo-router';
import { Key, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CornerDecorations = () => {
    return (
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
};

export default function VaultKeyScreen() {
    const router = useRouter();
    const { upsertProfile, checkUsernameUnique } = useUserStore();
    const { user } = useAuthStore();

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
        if (!customKey.trim()) return;
        if (!user) {
            Alert.alert("Error", "No authenticated user found.");
            return;
        }

        // Use vault key as part of username
        const generatedUsername = `VK_${customKey.trim().toUpperCase()}`;

        setIsLoading(true);
        try {
            // Check if this vault-key-based username is unique
            const isUnique = await checkUsernameUnique(generatedUsername);
            if (!isUnique) {
                Alert.alert("Error", "This vault key is already taken. Try another.");
                return;
            }

            await upsertProfile(user.id, { username: generatedUsername });
            router.replace('/(tabs)');
        } catch (e) {
            console.error("Custom key failed", e);
            Alert.alert("Error", "Could not save vault key. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Skip Key -> Username Modal
    const handleSkipKey = () => {
        setUsernameError('');
        setShowUsernameModal(true);
    };

    // Submit Username
    const handleUsernameSubmit = async () => {
        const validationError = validateUsername(username);
        if (validationError) {
            setUsernameError(validationError);
            return;
        }

        if (!user) {
            Alert.alert("Error", "No authenticated user found.");
            return;
        }

        setIsLoading(true);
        setUsernameError('');

        try {
            // Check uniqueness
            const isUnique = await checkUsernameUnique(username.trim());
            if (!isUnique) {
                setUsernameError('This username is already taken');
                setIsLoading(false);
                return;
            }

            // Update username in profile
            await upsertProfile(user.id, { username: username.trim() });
            setShowUsernameModal(false);
            router.replace('/(tabs)');
        } catch (e) {
            console.error("Username set failed", e);
            setUsernameError('Could not set username. Please try again.');
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
        <SafeAreaView className={cx('flex-1 relative', theme.bgClass)}>

            {/* ScrollView to handle keyboard interactions smoothly */}
            <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 32 }}>

                <View className="pt-4 pb-4">
                    <Text className={cx('text-xs tracking-[4px] mb-6 font-bold text-center', theme.textClass)}>
                        ◢ SECURE FACILITY // LEGACY MIGRATION ◣
                    </Text>
                </View>

                <View className="flex-1 justify-center">

                    {/* Header Icon & Text */}
                    <View className="mb-12 items-center">
                        <View className={cx('items-center justify-center w-20 h-20 border-2 mb-6 relative', theme.glowClass, theme.borderClass)}>
                            <CornerDecorations />
                            <Key size={40} color={theme.iconColor} strokeWidth={2} />
                        </View>
                        <Text className={cx('text-3xl font-bold mb-3 tracking-wider text-center', theme.textClass)}>
                            {step === 'CHOICE' ? 'WELCOME BACK?' : step === 'LEGACY_INPUT' ? 'LEGACY ACCESS' : 'NEW PROTOCOL'}
                        </Text>
                        <Text className={cx('text-lg tracking-wide text-center', theme.mutedTextClass)}>
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
                                className={cx('w-full py-5 items-center justify-center border relative', theme.buttonSolidClass)}
                            >
                                <CornerDecorations />
                                <Text className={cx('font-semibold uppercase tracking-wider', theme.buttonTextClass)}>[ YES, I HAVE A LEGACY KEY ]</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleSkipKey}
                                activeOpacity={0.9}
                                className={cx('w-full border-2 py-5 items-center justify-center bg-slate-900/50 relative', theme.borderClass)}
                            >
                                <CornerDecorations />
                                <Text className={cx('font-semibold uppercase tracking-wider', theme.textClass)}>[ NO, I'M STARTING FRESH ]</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* STEP: LEGACY INPUT */}
                    {step === 'LEGACY_INPUT' && (
                        <View className="gap-y-6">
                            <View>
                                <Text className={cx('text-sm font-medium mb-3 tracking-wider text-center', theme.textClass)}>[ ENTER YOUR LEGACY KEY ]</Text>
                                <TextInput
                                    value={legacyKey}
                                    onChangeText={(text) => setLegacyKey(text.toUpperCase())}
                                    placeholder="K8X-29L"
                                    placeholderTextColor={theme.textDimClass.split(' ')[0] ? theme.placeholder : '#555'}
                                    className={cx('w-full border-2 text-center text-2xl font-mono tracking-wider py-5 bg-slate-900/50', theme.borderClass, theme.textClass)}
                                    maxLength={7}
                                />
                            </View>
                            <TouchableOpacity
                                onPress={handleLegacySubmit}
                                disabled={legacyKey.length < 3 || isLoading}
                                className={cx('w-full py-5 items-center justify-center border relative', theme.buttonSolidClass, (legacyKey.length < 3 || isLoading) && 'opacity-50')}
                            >
                                <CornerDecorations />
                                {isLoading ? <ActivityIndicator color={theme.placeholder} /> : <Text className={cx('font-semibold uppercase tracking-wider', theme.buttonTextClass)}>[[ CLAIM MY PROGRESS ]]</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setStep('CHOICE')} className="items-center py-3">
                                <Text className={cx('font-medium tracking-wider', theme.textDimClass)}>[ Go Back ]</Text>
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
                <View className="flex-1 bg-slate-950/90 items-center justify-center p-6">
                    <View className={cx('w-full bg-slate-900 border-2 p-8 relative', theme.borderClass)}>
                        <CornerDecorations />

                        <View className="items-center mb-8">
                            <User size={48} color={theme.placeholder} />
                            <Text className={cx('text-2xl font-bold mt-4 tracking-widest', theme.textClass)}>CREATE IDENTITY</Text>
                            <Text className={cx('text-center mt-2 opacity-80', theme.mutedTextClass)}>Choose your unique founder identity to begin.</Text>
                        </View>

                        <View className="mb-8">
                            <Text className={cx('text-xs font-bold mb-2 tracking-widest uppercase', theme.textDimClass)}>Username</Text>
                            <TextInput
                                value={username}
                                onChangeText={(text) => {
                                    setUsername(text);
                                    setUsernameError('');
                                }}
                                placeholder="PlayerOne"
                                placeholderTextColor={theme.textDimClass.split(' ')[0] ? theme.placeholder : '#555'}
                                className={cx('w-full border p-4 font-mono text-lg bg-slate-950', theme.borderClass, theme.textClass, usernameError && 'border-red-500')}
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
                            className={cx('w-full py-4 items-center justify-center border relative', theme.buttonSolidClass, (username.length < 3 || isLoading) && 'opacity-50')}
                        >
                            {isLoading ? <ActivityIndicator color={theme.placeholder} /> : <Text className={cx('font-bold tracking-widest', theme.buttonTextClass)}>CONFIRM IDENTITY</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}
