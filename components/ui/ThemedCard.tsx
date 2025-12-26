/**
 * ThemedCard Component
 * 
 * Card container with accent border and corner decorations.
 */

import React from 'react';
import { View, type ViewProps } from 'react-native';
import { CornerDecorations, type CornerSize } from './CornerDecorations';

interface ThemedCardProps extends ViewProps {
    children: React.ReactNode;
    cornerSize?: CornerSize;
    padding?: 'sm' | 'md' | 'lg';
}

const PADDING_STYLES = {
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8',
};

import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export function ThemedCard({
    children,
    cornerSize = 'md',
    padding = 'md',
    className,
    ...props
}: ThemedCardProps) {
    const { key: themeKey } = useTheme();
    const accentColor = (Colors as any)[themeKey]?.text || Colors.emerald.text;

    return (
        <View
            {...props}
            className={`relative bg-bg-card/90 border-2 border-accent/30 overflow-hidden ${PADDING_STYLES[padding]} ${className ?? ''}`}
        >
            <CornerDecorations size={cornerSize} color={accentColor} />
            {children}
        </View>
    );
}
