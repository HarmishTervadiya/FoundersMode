import React from 'react';
import { Text, TextProps, View } from 'react-native';

interface TextRendererProps extends TextProps {
  children: string;
}

export const TextRenderer: React.FC<TextRendererProps> = ({ children, style, ...props }) => {
  if (!children) return null;

  // Normalize: convert literal escaped '\n' (two chars: backslash + n) that Supabase
  // returns when content was concatenated and stored, into real newline characters.
  // Then split on real newlines.
  const normalized = children.replace(/\\n/g, '\n');
  const lines = normalized.split('\n');

  return (
    <View>
      {lines.map((line, index) =>
        line.trim() === '' ? (
          // Empty line → render a small vertical gap instead of invisible nothing
          <View key={index} style={{ height: 6 }} />
        ) : (
          <Text key={index} style={style} {...props}>
            {line}
          </Text>
        )
      )}
    </View>
  );
};
