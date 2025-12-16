/**
 * LevelUpModal Component
 * 
 * Reusable modal for displaying level-up celebrations.
 * Theme-aware using NativeWind tokens.
 * Sequential display support (max 3 at once).
 */

import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Award, Sparkles, Star } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Text, TouchableOpacity, View } from 'react-native';
import { CornerDecorations } from './CornerDecorations';

interface LevelUpModalProps {
    visible: boolean;
    level: number;
    onDismiss: () => void;
    autoDissmissMs?: number;
}

export function LevelUpModal({
    visible,
    level,
    onDismiss,
    autoDissmissMs = 3000,
}: LevelUpModalProps) {
    const { key: themeKey } = useTheme();
    const iconColor = (Colors as any)[themeKey]?.text || Colors.emerald.text;

    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Entrance animation
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 4,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto-dismiss timer
            const timer = setTimeout(() => {
                handleDismiss();
            }, autoDissmissMs);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    const handleDismiss = () => {
        // Exit animation
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 0.8,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start(() => {
            scaleAnim.setValue(0.5);
            onDismiss();
        });
    };

    if (!visible) return null;

    return (
        <Modal
            animationType="none"
            transparent={true}
            visible={visible}
            onRequestClose={handleDismiss}
        >
            <View className={`flex-1 bg-bg-base/90 items-center justify-center p-6 theme-${themeKey}`}>
                <Animated.View
                    style={{
                        transform: [{ scale: scaleAnim }],
                        opacity: opacityAnim,
                    }}
                    className="w-full max-w-xs"
                >
                    <View className="bg-bg-card border-2 border-accent/50 p-8 relative items-center">
                        <CornerDecorations size="md" />

                        {/* Stars decoration */}
                        <View className="flex-row gap-2 mb-4">
                            <Sparkles size={20} color={iconColor} />
                            <Star size={24} color={iconColor} fill={iconColor} />
                            <Sparkles size={20} color={iconColor} />
                        </View>

                        {/* Level Badge */}
                        <View className="w-24 h-24 rounded-full border-4 border-accent bg-accent/20 items-center justify-center mb-6">
                            <Text className="text-4xl font-bold text-text-primary">{level}</Text>
                        </View>

                        {/* Title */}
                        <Text className="text-2xl font-bold tracking-widest text-text-primary mb-2">
                            LEVEL UP!
                        </Text>

                        <Text className="text-center text-text-muted mb-6">
                            You've reached Level {level}
                        </Text>

                        {/* Award Icon */}
                        <View className="flex-row items-center gap-2 mb-6">
                            <Award size={20} color={iconColor} />
                            <Text className="text-xs tracking-widest text-text-dim">
                                FOUNDER PROGRESSION
                            </Text>
                        </View>

                        {/* Dismiss Button */}
                        <TouchableOpacity
                            onPress={handleDismiss}
                            className="w-full py-3 items-center border border-accent/30 bg-accent/10"
                        >
                            <Text className="text-sm font-bold tracking-wider text-text-primary">
                                CONTINUE
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

/**
 * LevelUpQueue Component
 * 
 * Manages sequential display of multiple level-up modals.
 * Shows max 3 at once, then dismisses sequentially.
 */

interface LevelUpQueueProps {
    levelsToShow: number[];
    onComplete: () => void;
}

export function LevelUpQueue({ levelsToShow, onComplete }: LevelUpQueueProps) {
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const maxModals = 3;

    // Only show first 3 levels
    const displayLevels = levelsToShow.slice(0, maxModals);

    const handleDismiss = () => {
        if (currentIndex < displayLevels.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            onComplete();
        }
    };

    if (displayLevels.length === 0) return null;

    const currentLevel = displayLevels[currentIndex];

    return (
        <LevelUpModal
            visible={true}
            level={currentLevel}
            onDismiss={handleDismiss}
            autoDissmissMs={2500}
        />
    );
}
