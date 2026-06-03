/**
 * CornerDecorations Component
 *
 * Triangular corner decorations with glow effect for themed cards and buttons.
 * Using inline styles to avoid NativeWind className + inline style conflicts.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

export type CornerSize = 'sm' | 'md' | 'lg';

interface CornerDecorationsProps {
  size?: CornerSize;
}

// Removed static ACCENT_COLOR constants in favor of dynamic prop

const SIZES = {
  sm: {
    corner: { width: 8, height: 8 },
    lineH: { width: 14, height: 2 },
    lineV: { width: 2, height: 24 },
  },
  md: {
    corner: { width: 12, height: 12 },
    lineH: { width: 40, height: 2 },
    lineV: { width: 2, height: 40 },
  },
  lg: {
    corner: { width: 16, height: 16 },
    lineH: { width: 35, height: 2 },
    lineV: { width: 2, height: 35 },
  },
};

export function CornerDecorations({
  size = 'md',
  color = 'rgba(16, 185, 129, 1)',
}: CornerDecorationsProps & { color?: string }) {
  const s = SIZES[size];
  const offset = s.corner.width / 2;
  const lineStyle = { backgroundColor: color, opacity: 0.6 };
  const cornerStyle = { backgroundColor: color };

  return (
    <>
      {/* Top Left */}
      <View style={[styles.cornerContainer, { top: 0, left: 0 }]}>
        <View
          style={[
            s.corner,
            styles.cornerBase,
            cornerStyle,
            {
              top: -offset,
              left: -offset,
              transform: [{ rotate: '45deg' }],
            },
          ]}
        />
        <View style={[s.lineH, styles.lineBase, lineStyle, { top: 0, left: offset }]} />
        <View style={[s.lineV, styles.lineBase, lineStyle, { top: offset, left: 0 }]} />
      </View>

      {/* Top Right */}
      <View style={[styles.cornerContainer, { top: 0, right: 0 }]}>
        <View
          style={[
            s.corner,
            styles.cornerBase,
            cornerStyle,
            {
              top: -offset,
              right: -offset,
              transform: [{ rotate: '45deg' }],
            },
          ]}
        />
        <View style={[s.lineH, styles.lineBase, lineStyle, { top: 0, right: offset }]} />
        <View style={[s.lineV, styles.lineBase, lineStyle, { top: offset, right: 0 }]} />
      </View>

      {/* Bottom Left */}
      <View style={[styles.cornerContainer, { bottom: 0, left: 0 }]}>
        <View
          style={[
            s.corner,
            styles.cornerBase,
            cornerStyle,
            {
              bottom: -offset,
              left: -offset,
              transform: [{ rotate: '45deg' }],
            },
          ]}
        />
        <View style={[s.lineH, styles.lineBase, lineStyle, { bottom: 0, left: offset }]} />
        <View style={[s.lineV, styles.lineBase, lineStyle, { bottom: offset, left: 0 }]} />
      </View>

      {/* Bottom Right */}
      <View style={[styles.cornerContainer, { bottom: 0, right: 0 }]}>
        <View
          style={[
            s.corner,
            styles.cornerBase,
            cornerStyle,
            {
              bottom: -offset,
              right: -offset,
              transform: [{ rotate: '45deg' }],
            },
          ]}
        />
        <View style={[s.lineH, styles.lineBase, lineStyle, { bottom: 0, right: offset }]} />
        <View style={[s.lineV, styles.lineBase, lineStyle, { bottom: offset, right: 0 }]} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  cornerContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  cornerBase: {
    position: 'absolute',
  },
  lineBase: {
    position: 'absolute',
  },
});
