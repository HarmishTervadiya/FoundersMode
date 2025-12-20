import React from 'react';
import { Text, TextProps, View } from 'react-native';

interface TextRendererProps extends TextProps {
    children: string;
}

export const TextRenderer: React.FC<TextRendererProps> = ({ children, style, ...props }) => {
    if (!children) return null;

    // Split text by escaped newlines literals or actual newlines
    const lines = children.split(/\\n|\n/);

    return (
        <View>
            {lines.map((line, index) => (
                <Text key={index} style={style} {...props}>
                    {line.trim()}
                    {/* Add a small spacer if it's not the last line to simulate paragraph gap if needed, 
              or just rely on natural block text behavior. Here we just render line by line. */}
                </Text>
            ))}
        </View>
    );
};
