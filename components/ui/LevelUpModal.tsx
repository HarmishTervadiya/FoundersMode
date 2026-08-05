/**
 * LevelUpModal Components
 *
 * Two-tier level-up modal system:
 * 1. SimpleLevelUpModal - Minimal notification for all level-ups
 * 2. DetailedLevelUpModal - Full modal for milestone levels with titles
 *
 * Theme-aware using NativeWind tokens.
 */

import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useLevelStore } from '@/store/levelStore';
import { soundService } from '@/utils/soundService';
import { Award, ChevronUp, Sparkles, Star } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Text, TouchableOpacity, View } from 'react-native';
import { CornerDecorations } from './CornerDecorations';

// ============================================
// SIMPLE LEVEL-UP MODAL (Minimal notification)
// ============================================

interface SimpleLevelUpModalProps {
  visible: boolean;
  level: number;
  position?: number; // 0-4 for stacking multiple modals
  onDismiss: () => void;
  autoDissmissMs?: number;
}

export function SimpleLevelUpModal({
  visible,
  level,
  position = 0,
  onDismiss,
  autoDissmissMs = 1500,
}: SimpleLevelUpModalProps) {
  const { key: themeKey } = useTheme();
  const iconColor = (Colors as any)[themeKey]?.text || Colors.emerald.text;

  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Entrance animation - slide in from top
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
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
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      translateY.setValue(-100);
      onDismiss();
    });
  };

  if (!visible) return null;

  // Calculate vertical offset for stacking
  const topOffset = 60 + position * 70;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: topOffset,
        left: 20,
        right: 20,
        zIndex: 1000 + position,
        transform: [{ translateY }],
        opacity,
      }}
      className={`theme-${themeKey}`}
    >
      <View className="relative flex-row items-center justify-center rounded-sm border-none bg-bg-card px-6 py-4">
        <CornerDecorations size="sm" />
        <ChevronUp size={24} color={iconColor} />
        <View className="mx-3">
          <Text className="text-lg font-bold tracking-wider text-text-primary">LEVEL UP!</Text>
          <Text className="text-xs tracking-widest text-text-muted">REACHED LEVEL {level}</Text>
        </View>
        <View className="h-12 w-12 items-center justify-center rounded-full border-2 border-accent bg-accent/20">
          <Text className="text-xl font-bold text-text-primary">{level}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ============================================
// DETAILED LEVEL-UP MODAL (Milestone celebration)
// ============================================

interface DetailedLevelUpModalProps {
  visible: boolean;
  level: number;
  title?: string | null;
  onDismiss: () => void;
  autoDissmissMs?: number;
}

export function DetailedLevelUpModal({
  visible,
  level,
  title,
  onDismiss,
  autoDissmissMs = 4000,
}: DetailedLevelUpModalProps) {
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
    <Modal animationType="none" transparent={true} visible={visible} onRequestClose={handleDismiss}>
      <View className={`flex-1 items-center justify-center bg-bg-base/90 p-6 theme-${themeKey}`}>
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }}
          className="w-full max-w-xs"
        >
          <View className="relative items-center border-2 border-accent/50 bg-bg-card p-8">
            <CornerDecorations size="md" />

            {/* Stars decoration */}
            <View className="mb-4 flex-row gap-2">
              <Sparkles size={20} color={iconColor} />
              <Star size={24} color={iconColor} fill={iconColor} />
              <Sparkles size={20} color={iconColor} />
            </View>

            {/* Level Badge */}
            <View className="mb-6 h-24 w-24 items-center justify-center rounded-full border-4 border-accent bg-accent/20">
              <Text className="text-4xl font-bold text-text-primary">{level}</Text>
            </View>

            {/* Title - MILESTONE */}
            <Text className="mb-2 text-2xl font-bold tracking-widest text-text-primary">
              MILESTONE!
            </Text>

            {/* Level Title */}
            {title && (
              <Text className="mb-2 text-lg font-bold tracking-wider text-accent">"{title}"</Text>
            )}

            <Text className="mb-6 text-center text-text-muted">You've unlocked Level {level}</Text>

            {/* Award Icon */}
            <View className="mb-6 flex-row items-center gap-2">
              <Award size={20} color={iconColor} />
              <Text className="text-xs tracking-widest text-text-dim">FOUNDER ACHIEVEMENT</Text>
            </View>

            {/* Dismiss Button */}
            <TouchableOpacity
              onPress={handleDismiss}
              className="w-full items-center border border-accent/30 bg-accent/10 py-3"
            >
              <Text className="text-sm font-bold tracking-wider text-text-primary">CONTINUE</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Keep old export name for backwards compatibility
export const LevelUpModal = DetailedLevelUpModal;

// ============================================
// LEVEL-UP QUEUE (Orchestrates both modal types)
// ============================================

interface LevelUpQueueProps {
  previousLevel: number;
  newLevel: number;
  onComplete: () => void;
}

type QueuePhase = 'simple' | 'detailed' | 'complete';

export function LevelUpQueue({ previousLevel, newLevel, onComplete }: LevelUpQueueProps) {
  const { fetchLevelData, getLevelTitle } = useLevelStore();
  const [phase, setPhase] = useState<QueuePhase>('simple');

  // Store IDs of currently visible simple modals
  const [visibleSimpleLevels, setVisibleSimpleLevels] = useState<number[]>([]);

  // State for the detailed modal
  const [showDetailed, setShowDetailed] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  // Track if we've successfully initialized and populated the queue
  const [hasPopulated, setHasPopulated] = useState(false);

  // Generate array of levels gained
  const levelsGained = newLevel - previousLevel;
  const levelNumbers = React.useMemo(() => {
    const levels: number[] = [];
    for (let i = 1; i <= levelsGained; i++) {
      levels.push(previousLevel + i);
    }
    return levels;
  }, [previousLevel, levelsGained]);

  // Fetch level data and initialize on mount
  useEffect(() => {
    const init = async () => {
      if (levelNumbers.length > 0) {
        await fetchLevelData(levelNumbers);

        const finalTitle = getLevelTitle(newLevel);
        setMilestoneTitle(finalTitle);

        // Show all simple modals simultaneously
        setVisibleSimpleLevels(levelNumbers);
        setHasPopulated(true);
        setIsReady(true);
        soundService.play('level_up');
      } else {
        onComplete();
      }
    };
    init();
  }, []);

  // Effect to handle transition after all simple modals are dismissed
  useEffect(() => {
    if (isReady && hasPopulated && visibleSimpleLevels.length === 0 && phase === 'simple') {
      if (milestoneTitle) {
        // Show detailed modal for milestone

        setPhase('detailed');
        setShowDetailed(true);
      } else {
        // No milestone, complete

        setPhase('complete');
        onComplete();
      }
    }
  }, [visibleSimpleLevels, phase, isReady, hasPopulated, milestoneTitle]);

  // Handle simple modal dismiss for a specific level
  const handleSimpleDismiss = (level: number) => {
    setVisibleSimpleLevels((prev) => prev.filter((l) => l !== level));
  };

  // Handle detailed modal dismiss
  const handleDetailedDismiss = () => {
    setShowDetailed(false);
    setPhase('complete');
    onComplete();
  };

  if (!isReady || levelNumbers.length === 0) return null;

  return (
    <>
      {/* Simple Level-Up Modals - Stacked Simultaneously */}
      {phase === 'simple' &&
        visibleSimpleLevels.map((level, index) => (
          <SimpleLevelUpModal
            key={level}
            visible={true}
            level={level}
            // Calculate position based on original index to maintain stack order
            // regardless of dismissal order.
            // We find the index in original levelNumbers to keep position stable.
            position={levelNumbers.indexOf(level)}
            onDismiss={() => handleSimpleDismiss(level)}
            // Stagger auto-dismiss slightly for visual effect
            autoDissmissMs={2000 + index * 500}
          />
        ))}

      {/* Detailed Milestone Modal */}
      {phase === 'detailed' && (
        <DetailedLevelUpModal
          visible={showDetailed}
          level={newLevel}
          title={milestoneTitle}
          onDismiss={handleDetailedDismiss}
          autoDissmissMs={4000}
        />
      )}
    </>
  );
}
