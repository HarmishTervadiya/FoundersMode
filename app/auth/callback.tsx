import { colors } from '@/constants/theme.utils';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');
const MATRIX_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';

// Matrix rain column component
function MatrixColumn({ delay, speed }: { delay: number; speed: number }) {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animate = () => {
            translateY.setValue(-100);
            opacity.setValue(1);

            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: 200,
                    duration: speed,
                    delay,
                    useNativeDriver: true,
                }),
                Animated.sequence([
                    Animated.delay(delay + speed * 0.7),
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: speed * 0.3,
                        useNativeDriver: true,
                    }),
                ]),
            ]).start(() => animate());
        };
        animate();
    }, []);

    const chars = Array(6).fill(0).map(() =>
        MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
    );

    return (
        <Animated.View style={[styles.matrixColumn, { transform: [{ translateY }], opacity }]}>
            {chars.map((char, i) => (
                <Text key={i} style={[styles.matrixChar, { opacity: 1 - i * 0.15 }]}>
                    {char}
                </Text>
            ))}
        </Animated.View>
    );
}

// Progress bar component
function ProgressBar({ progress, label }: { progress: number; label: string }) {
    const animatedWidth = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(animatedWidth, {
            toValue: progress,
            duration: 500,
            useNativeDriver: false,
        }).start();
    }, [progress]);

    return (
        <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>{label}</Text>
            <View style={styles.progressTrack}>
                <Animated.View
                    style={[
                        styles.progressFill,
                        {
                            width: animatedWidth.interpolate({
                                inputRange: [0, 100],
                                outputRange: ['0%', '100%'],
                            }),
                        },
                    ]}
                />
            </View>
            <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
        </View>
    );
}

export default function AuthCallback() {
    const router = useRouter();
    const { session, user } = useAuthStore();
    const { createOrFetchProfile, profile } = useUserStore();

    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('Establishing secure connection...');
    const [playerName, setPlayerName] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    // Generate matrix columns
    const matrixColumns = Array(12).fill(0).map((_, i) => ({
        delay: i * 150,
        speed: 2000 + Math.random() * 1000,
        left: (i / 12) * 100 + '%',
    }));

    useEffect(() => {
        console.log('[Callback] useEffect triggered');
        console.log('[Callback] session:', session);
        console.log('[Callback] session?.user:', session?.user);
        console.log('[Callback] user from store:', user);

        const initializePlayer = async () => {
            console.log('[Callback] initializePlayer called');

            if (!session?.user) {
                console.log('[Callback] No session.user yet, waiting...');
                // No session yet - wait or redirect to login
                setStatusText('Waiting for authentication...');
                setProgress(10);

                // Don't redirect immediately - the session might still be loading
                // The useEffect will re-trigger when session changes
                return;
            }

            console.log('[Callback] Session found! User ID:', session.user.id);

            try {
                // Step 1: Secure Connection
                setStatusText('Secure connection established...');
                setProgress(20);
                await new Promise(r => setTimeout(r, 500));

                // Step 2: Fetch/Create Profile
                setStatusText('Accessing player database...');
                setProgress(40);

                const { profile: fetchedProfile, isNew } = await createOrFetchProfile(session.user.id);

                if (!fetchedProfile) {
                    setStatusText('Error accessing player data. Retrying...');
                    await new Promise(r => setTimeout(r, 2000));
                    router.replace('/auth/login');
                    return;
                }

                // Step 3: Load Player Data
                setStatusText('Loading player profile...');
                setProgress(60);
                await new Promise(r => setTimeout(r, 500));

                const displayName = fetchedProfile.username || session.user.email?.split('@')[0] || 'Founder';
                setPlayerName(displayName);

                // Step 4: Initialize Systems
                setStatusText(`Starting the System for Player ${displayName}...`);
                setProgress(80);
                await new Promise(r => setTimeout(r, 800));

                // Step 5: Complete
                setStatusText('System initialized. Welcome, Founder.');
                setProgress(100);
                setIsComplete(true);

                await new Promise(r => setTimeout(r, 1000));

                // Navigate based on profile state
                if (fetchedProfile.username) {
                    // Existing user with complete profile -> Home
                    router.replace('/(tabs)');
                } else {
                    // New user or incomplete profile -> Vault Key setup
                    router.replace('/auth/vaultKey');
                }

            } catch (error) {
                console.error('Callback initialization error:', error);
                setStatusText('System error. Redirecting...');
                await new Promise(r => setTimeout(r, 1500));
                router.replace('/auth/login');
            }
        };

        initializePlayer();
    }, [session?.user?.id]);

    // Fallback timeout - check store state directly
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const currentSession = useAuthStore.getState().session;
            console.log('[Callback] Timeout check - session:', currentSession ? 'exists' : 'null');
            if (!currentSession?.user) {
                console.log('[Callback] Timeout: No session after 10s, redirecting to login');
                router.replace('/auth/login');
            }
        }, 10000);

        return () => clearTimeout(timeoutId);
    }, []);

    return (
        <View style={styles.container}>
            {/* Matrix Rain Background */}
            <View style={styles.matrixContainer}>
                {matrixColumns.map((col, i) => (
                    <View key={i} style={[styles.columnWrapper, { left: col.left as any }]}>
                        <MatrixColumn delay={col.delay} speed={col.speed} />
                    </View>
                ))}
            </View>

            {/* Content Overlay */}
            <View style={styles.overlay}>
                {/* Logo/Icon */}
                <View style={styles.logoContainer}>
                    <View style={styles.logo}>
                        <Text style={styles.logoText}>◢ FM ◣</Text>
                    </View>
                </View>

                {/* Player Name (if available) */}
                {playerName && (
                    <Text style={styles.playerName}>
                        {isComplete ? `Welcome, ${playerName}` : `Player: ${playerName}`}
                    </Text>
                )}

                {/* Status Text */}
                <Text style={styles.statusText}>{statusText}</Text>

                {/* Progress Bar */}
                <ProgressBar progress={progress} label="SYSTEM INITIALIZATION" />

                {/* Decorative Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>[ FOUNDERS MODE v1.0 ]</Text>
                    <Text style={styles.footerSubtext}>Secure Authentication Protocol</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617',
    },
    matrixContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
    },
    columnWrapper: {
        position: 'absolute',
        top: 0,
    },
    matrixColumn: {
        alignItems: 'center',
    },
    matrixChar: {
        color: colors.primary,
        fontSize: 14,
        fontFamily: 'monospace',
        marginVertical: 2,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    logoContainer: {
        marginBottom: 40,
    },
    logo: {
        width: 100,
        height: 100,
        borderWidth: 2,
        borderColor: colors.primary,
        backgroundColor: colors.primaryBg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoText: {
        color: colors.primary,
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'monospace',
        letterSpacing: 2,
    },
    playerName: {
        color: colors.primary,
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'monospace',
        letterSpacing: 3,
        marginBottom: 16,
        textTransform: 'uppercase',
    },
    statusText: {
        color: colors.secondary,
        fontSize: 14,
        fontFamily: 'monospace',
        letterSpacing: 1,
        marginBottom: 32,
        textAlign: 'center',
    },
    progressContainer: {
        width: '100%',
        maxWidth: 300,
    },
    progressLabel: {
        color: colors.primaryDim,
        fontSize: 10,
        fontFamily: 'monospace',
        letterSpacing: 2,
        marginBottom: 8,
    },
    progressTrack: {
        height: 8,
        backgroundColor: colors.primaryBg,
        borderRadius: 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.primaryBorder,
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 3,
    },
    progressPercent: {
        color: colors.primary,
        fontSize: 12,
        fontFamily: 'monospace',
        marginTop: 8,
        textAlign: 'right',
    },
    footer: {
        position: 'absolute',
        bottom: 60,
        alignItems: 'center',
    },
    footerText: {
        color: colors.primary,
        fontSize: 12,
        fontFamily: 'monospace',
        letterSpacing: 3,
        marginBottom: 4,
    },
    footerSubtext: {
        color: colors.primaryDim,
        fontSize: 10,
        fontFamily: 'monospace',
        letterSpacing: 1,
    },
});
