/**
 * Onboarding Screen
 *
 * 3-step onboarding flow with themed UI, animations, and store integration.
 * Uses SafeAreaView from react-native-safe-area-context (not deprecated RN version).
 */

import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, Pressable, Text, View } from 'react-native';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StepIndicator } from '@/components/ui/StepIndicator';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { Colors } from '@/constants/theme';
import { ONBOARDING_STEPS } from '@/constants/theme.config';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingStore } from '@/store/onboardingStore';
import { soundService } from '@/utils/soundService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Animated particle component
// Animated particle component
function Particle({
  delay,
  startX,
  startY,
  color,
}: {
  delay: number;
  startX: number;
  startY: number;
  color: string;
}) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(-20, { duration: 3000 + Math.random() * 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    translateX.value = withRepeat(
      withTiming(10, { duration: 3000 + Math.random() * 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    opacity.value = withRepeat(
      withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: startX,
          top: startY,
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

// Generate random particles
function ParticlesBackground({ color }: { color: string }) {
  const particles = React.useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT,
      delay: Math.random() * 2000,
    }));
  }, []);

  return (
    <View className="absolute inset-0 opacity-30">
      {particles.map((p) => (
        <Particle key={p.id} delay={p.delay} startX={p.x} startY={p.y} color={color} />
      ))}
    </View>
  );
}

// Terminal text typing animation hook
function useTypingAnimation(text: string, speed: number = 40) {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    setDisplayText('');
    let i = 0;
    const timer = setInterval(() => {
      if (i <= text.length) {
        setDisplayText(text.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return displayText;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { themeClass, key: themeKey } = useTheme();
  const { currentStep, totalSteps, setStep, completeOnboarding } = useOnboardingStore();
  const [isVisible, setIsVisible] = useState(true);

  // Sound on mount
  useEffect(() => {
    soundService.play('modal_open');
  }, []);

  // Dynamic accent color
  const accentColor = (Colors as any)[themeKey]?.text || Colors.emerald.text;

  const step = ONBOARDING_STEPS[currentStep];
  const Icon = step.icon;
  const terminalText = useTypingAnimation(step.terminal);

  const changeStep = useCallback(
    (direction: number) => {
      const nextStep = currentStep + direction;
      if (nextStep >= 0 && nextStep < totalSteps) {
        setIsVisible(false);
        setTimeout(() => {
          soundService.play('onboarding_click');
          setStep(nextStep);
          setIsVisible(true);
        }, 300); // Wait for FadeOut
      } else if (nextStep >= totalSteps) {
        // Complete if going past last step
        completeOnboarding();
        router.replace('/auth/login');
      }
    },
    [currentStep, totalSteps, setStep, completeOnboarding, router]
  );

  const handleNext = () => changeStep(1);
  const handleBack = () => changeStep(-1); // Not explicitly requested but good for swipe

  const handleSkip = useCallback(() => {
    completeOnboarding();
    router.replace('/auth/login');
  }, [completeOnboarding, router]);

  // Gestures
  const flingLeft = Gesture.Fling()
    .direction(Directions.LEFT)
    .onEnd(() => {
      runOnJS(changeStep)(1);
    });

  const flingRight = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onEnd(() => {
      if (currentStep > 0) {
        runOnJS(changeStep)(-1);
      }
    });

  const gestures = Gesture.Race(flingLeft, flingRight);

  const isLastStep = currentStep === totalSteps - 1;

  return (
    <GestureDetector gesture={gestures}>
      <SafeAreaView className={`flex-1 bg-bg-base ${themeClass}`}>
        {/* Animated particles background */}
        <ParticlesBackground color={accentColor} />

        {/* Top System Bar */}
        <View className="z-10 px-6 pb-4 pt-4">
          <Text className="mb-4 text-xs font-bold tracking-widest text-text-primary">
            ◢ SECURE FACILITY // ONBOARDING PROTOCOL ◣
          </Text>
          <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
        </View>

        {/* Main Content */}
        {isVisible ? (
          <Animated.View
            entering={FadeIn.duration(300).easing(Easing.out(Easing.cubic))}
            exiting={FadeOut.duration(300).easing(Easing.in(Easing.cubic))}
            className="z-10 flex-1 items-center justify-center px-6"
          >
            {/* Terminal Status */}
            <View className="mb-8 items-center">
              <Text className="mb-1 text-sm font-bold tracking-wider text-text-dim/40">
                [ SYSTEM STATUS ]
              </Text>
              <Text className="font-mono text-lg font-bold tracking-wide text-text-primary">
                {terminalText}
                <Text className="opacity-50">_</Text>
              </Text>
            </View>

            {/* Icon with glow effect */}
            <View className="relative mb-10">
              <ThemedCard padding="lg" cornerSize="lg">
                <Icon
                  size={64}
                  className="text-text-primary"
                  stroke={accentColor}
                  strokeWidth={2}
                />
              </ThemedCard>
            </View>

            {/* Title */}
            <Text className="mb-4 text-center text-2xl font-bold leading-tight tracking-wider text-text-primary">
              {step.title}
            </Text>

            {/* Subtitle */}
            <Text className="mb-6 max-w-xs text-center text-base leading-relaxed text-text-muted/80">
              {step.subtitle}
            </Text>

            {/* Highlight Comment */}

            <View
              className="relative w-2/3 overflow-hidden border-2 border-accent/30 bg-bg-card/70 px-7 py-3"
              style={{ borderTopLeftRadius: 15, borderBottomRightRadius: 15 }}
            >
              <View className="absolute left-0 top-0 h-3 w-3 bg-accent" />
              <View className="absolute bottom-0 right-0 h-3 w-3 bg-accent" />
              <Text className="mx-3 text-nowrap font-mono text-sm tracking-normal  text-text-primary">
                {step.highlight}
              </Text>
            </View>
          </Animated.View>
        ) : (
          // Placeholder to keep layout size or just empty view
          // If empty, bottom actions might jump?
          // Use flex-1 to keep spacing
          <View className="flex-1" />
        )}

        {/* Bottom Actions */}
        <View className="z-10 gap-3 p-6">
          {!isLastStep ? (
            <>
              <ThemedButton
                onPress={handleNext}
                variant="primary"
                cornerSize="lg"
                icon={<ChevronRight size={20} className="text-text-primary" />}
              >
                [ Continue Protocol ]
              </ThemedButton>

              <Pressable onPress={handleSkip} className="py-4">
                <Text className="text-center text-sm tracking-wider text-text-dim/40">
                  [ Skip Sequence ]
                </Text>
              </Pressable>
            </>
          ) : (
            <ThemedButton onPress={handleNext} variant="primary">
              [[ Initialize Vault ]]
            </ThemedButton>
          )}
        </View>
      </SafeAreaView>
    </GestureDetector>
  );
}
