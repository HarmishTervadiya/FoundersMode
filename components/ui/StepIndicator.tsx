/**
 * StepIndicator Component
 * 
 * Progress bar indicator for onboarding steps with glowing active state.
 */

import React from 'react';
import { View } from 'react-native';

interface StepIndicatorProps {
    currentStep: number;
    totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
    return (
        <View className="flex-row gap-2">
            {Array.from({ length: totalSteps }, (_, idx) => {
                const isActive = idx === currentStep;
                const isCompleted = idx < currentStep;

                return (
                    <View
                        key={idx}
                        className={`flex-1 h-1 rounded-sm ${isActive
                                ? 'bg-accent'
                                : isCompleted
                                    ? 'bg-accent/40'
                                    : 'bg-bg-elevated'
                            }`}
                    />
                );
            })}
        </View>
    );
}
