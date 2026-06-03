/**
 * ThemedButton Component
 *
 * Styled button with corner decorations and theme-aware colors.
 */

import React from 'react';
import { Pressable, Text, View, type PressableProps } from 'react-native';
import { CornerDecorations, type CornerSize } from './CornerDecorations';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ThemedButtonProps extends Omit<PressableProps, 'children'> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  cornerSize?: CornerSize;
  icon?: React.ReactNode;
}

const VARIANT_STYLES = {
  primary: {
    container: 'bg-accent/20 border border-accent/50',
    text: 'text-text-primary',
  },
  secondary: {
    container: 'bg-bg-card/50 border-2 border-accent/30',
    text: 'text-text-primary',
  },
  ghost: {
    container: 'bg-transparent',
    text: 'text-text-dim/40',
  },
};

import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export function ThemedButton({
  children,
  variant = 'primary',
  cornerSize = 'lg',
  icon,
  ...props
}: ThemedButtonProps) {
  const { key: themeKey } = useTheme();
  const accentColor = (Colors as any)[themeKey]?.text || Colors.emerald.text;
  const styles = VARIANT_STYLES[variant];

  return (
    <Pressable
      {...props}
      className={`relative overflow-hidden ${styles.container} ${props.disabled ? 'opacity-30' : ''}`}
    >
      {({ pressed }) => (
        <>
          {variant !== 'ghost' && (
            <View className="pointer-events-none absolute inset-0">
              <CornerDecorations size={cornerSize} color={accentColor} />
            </View>
          )}
          <View
            className={`px-6 py-5 ${pressed ? 'opacity-80' : ''} flex-row items-center justify-center gap-2`}
          >
            {icon}
            <Text className={`text-sm font-bold uppercase tracking-widest ${styles.text}`}>
              {children}
            </Text>
          </View>
        </>
      )}
    </Pressable>
  );
}
