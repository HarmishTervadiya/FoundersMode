/**
 * Migration Screen
 * 
 * Full-screen animation for legacy vault key migration.
 * Non-skippable, theme-aware, callback-style animation.
 */

import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useVaultStore } from '@/store/vaultStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');
const MATRIX_CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミ';

// Matrix rain column component
function MatrixColumn({ delay, speed, color }: { delay: number; speed: number; color: string }) {
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

    const chars = Array(8).fill(0).map(() =>
        MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
    );

    return (
        <Animated.View style={[{ alignItems: 'center' }, { transform: [{ translateY }], opacity }]}>
            {chars.map((char, i) => (
                <Text key={i} style={{ color, fontSize: 14, fontFamily: 'monospace', marginVertical: 2, opacity: 1 - i * 0.12 }}>
                    {char}
                </Text>
            ))}
        </Animated.View>
    );
}

// Progress bar component
function MigrationProgressBar({ progress, color }: { progress: number; color: string }) {
    const animatedWidth = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(animatedWidth, {
            toValue: progress,
            duration: 400,
            useNativeDriver: false,
        }).start();
    }, [progress]);

    return (
        <View style={{ width: '100%', maxWidth: 300 }}>
            <View style={{
                height: 8,
                backgroundColor: `${color}20`,
                borderRadius: 4,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: `${color}40`,
            }}>
                <Animated.View
                    style={[
                        { height: '100%', backgroundColor: color, borderRadius: 3 },
                        {
                            width: animatedWidth.interpolate({
                                inputRange: [0, 100],
                                outputRange: ['0%', '100%'],
                            }),
                        },
                    ]}
                />
            </View>
            <Text style={{
                color,
                fontSize: 12,
                fontFamily: 'monospace',
                marginTop: 8,
                textAlign: 'right',
            }}>
                {Math.round(progress)}%
            </Text>
        </View>
    );
}

export default function MigrationScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { key: themeKey } = useTheme();

    const {
        isMigrating,
        migrationProgress,
        migrationMessage,
        error,
        migratedStats,
        claimVaultKey,
        resetState,
    } = useVaultStore();

    // Get params
    const secretKey = params.secretKey as string;
    const userId = params.userId as string;
    const currentLevel = parseInt(params.currentLevel as string) || 1;

    // Theme colors
    const themeColor = (Colors as any)[themeKey]?.text || Colors.emerald.text;

    // Matrix columns
    const matrixColumns = useMemo(() =>
        Array(14).fill(0).map((_, i) => ({
            delay: i * 120,
            speed: 2500 + Math.random() * 1000,
            left: (i / 14) * 100 + '%',
        })), []);

    // Status messages for decoration
    const [decorativeMessage, setDecorativeMessage] = useState('INITIALIZING SECURE TUNNEL...');
    const [hasStarted, setHasStarted] = useState(false);
    const [hasCompleted, setHasCompleted] = useState(false);

    const decorativeMessages = [
        'INITIALIZING SECURE TUNNEL...',
        'ESTABLISHING ENCRYPTED CONNECTION...',
        'BYPASSING LEGACY FIREWALL...',
        'ACCESSING VAULT ARCHIVES...',
        'PARSING FOUNDER DATA STREAMS...',
        'RECONSTRUCTING NEURAL PATHWAYS...',
    ];

    useEffect(() => {
        // Rotate decorative messages
        const interval = setInterval(() => {
            setDecorativeMessage(decorativeMessages[Math.floor(Math.random() * decorativeMessages.length)]);
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    // Start migration on mount - only once
    useEffect(() => {
        console.log('[Migration] Mount check - secretKey:', secretKey, 'userId:', userId, 'hasStarted:', hasStarted);
        if (secretKey && userId && !hasStarted) {
            console.log('[Migration] Starting migration for key:', secretKey);
            console.log('[Migration] User ID:', userId);
            console.log('[Migration] Current Level:', currentLevel);
            setHasStarted(true);
            claimVaultKey(secretKey, userId, currentLevel);
        } else if (!secretKey || !userId) {
            console.log('[Migration] Missing params - redirecting back');
            router.replace('/auth/vaultKey');
        }
    }, [secretKey, userId]);

    // Handle completion - only once
    useEffect(() => {
        console.log('[Migration] Completion check - migratedStats:', !!migratedStats, 'isMigrating:', isMigrating, 'hasCompleted:', hasCompleted);
        if (migratedStats && !isMigrating && !hasCompleted) {
            console.log('[Migration] Migration completed successfully:', migratedStats);
            setHasCompleted(true);
            // Success - navigate to home with level-up data
            console.log('[Migration] Navigating to home in 1.5s...');
            setTimeout(() => {
                console.log('[Migration] Executing navigation to /(tabs)');
                router.replace({
                    pathname: '/(tabs)',
                    params: {
                        levelsGained: migratedStats.levelsGained.toString(),
                        newLevel: migratedStats.newLevel.toString(),
                        previousLevel: migratedStats.previousLevel.toString(),
                    },
                });
                resetState();
            }, 1500);
        }
    }, [migratedStats, isMigrating, hasCompleted]);

    // Handle error - only once
    useEffect(() => {
        console.log('[Migration] Error check - error:', error, 'isMigrating:', isMigrating, 'hasStarted:', hasStarted, 'hasCompleted:', hasCompleted);
        if (error && !isMigrating && hasStarted && !hasCompleted) {
            console.log('[Migration] Migration error:', error);
            setHasCompleted(true);
            setTimeout(() => {
                router.replace({
                    pathname: '/auth/vaultKey',
                    params: { error },
                });
                resetState();
            }, 2500);
        }
    }, [error, isMigrating, hasStarted, hasCompleted]);

    return (
        <View style={styles.container} className={`theme-${themeKey}`}>
            {/* Matrix Rain Background */}
            <View style={styles.matrixContainer}>
                {matrixColumns.map((col, i) => (
                    <View key={i} style={[styles.columnWrapper, { left: col.left as any }]}>
                        <MatrixColumn delay={col.delay} speed={col.speed} color={themeColor} />
                    </View>
                ))}
            </View>

            {/* Content Overlay */}
            <View style={styles.overlay}>
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <View style={[styles.logo, { borderColor: themeColor, backgroundColor: `${themeColor}15` }]}>
                        <Text style={[styles.logoText, { color: themeColor }]}>◢ VAULT ◣</Text>
                    </View>
                </View>

                {/* Main Message */}
                <Text style={[styles.mainMessage, { color: themeColor }]}>
                    {migrationMessage || 'DECRYPTING LEGACY DATA...'}
                </Text>

                {/* Decorative Sub-message */}
                <Text style={[styles.subMessage, { color: `${themeColor}80` }]}>
                    {decorativeMessage}
                </Text>

                {/* Progress Bar */}
                <View style={{ marginTop: 24, width: '100%', maxWidth: 300 }}>
                    <MigrationProgressBar progress={migrationProgress} color={themeColor} />
                </View>

                {/* Error Display */}
                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>⚠ {error}</Text>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: themeColor }]}>[ LEGACY MIGRATION v1.0 ]</Text>
                    <Text style={[styles.footerSubtext, { color: `${themeColor}60` }]}>
                        Do not close this screen
                    </Text>
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
        width: 120,
        height: 80,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoText: {
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'monospace',
        letterSpacing: 3,
    },
    mainMessage: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'monospace',
        letterSpacing: 2,
        textAlign: 'center',
        marginBottom: 12,
    },
    subMessage: {
        fontSize: 11,
        fontFamily: 'monospace',
        letterSpacing: 1,
        textAlign: 'center',
    },
    errorContainer: {
        marginTop: 24,
        padding: 16,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.5)',
        borderRadius: 4,
    },
    errorText: {
        color: '#f87171',
        fontSize: 12,
        fontFamily: 'monospace',
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 60,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        fontFamily: 'monospace',
        letterSpacing: 3,
        marginBottom: 4,
    },
    footerSubtext: {
        fontSize: 10,
        fontFamily: 'monospace',
        letterSpacing: 1,
    },
});
