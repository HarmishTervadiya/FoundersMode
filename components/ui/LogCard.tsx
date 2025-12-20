import { Log } from '@/store/logStore';
import { ChevronDown } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface LogCardProps {
    log: Log;
    onPress: (log: Log) => void;
    accentColor: string;
}

export const LogCard: React.FC<LogCardProps> = ({ log, onPress, accentColor }) => {
    // Determine primary category from XP breakdown
    const category = useMemo(() => {
        if (!log.xp_breakdown) return 'GENERAL';

        let maxStat = 'GENERAL';
        let maxValue = -1;

        // Map internal stat keys to display names
        const statMap: Record<string, string> = {
            str_builder: 'ENGINEERING',
            int_architect: 'PRODUCT',
            cha_hustler: 'SALES',
            wis_zen: 'EXECUTIVE',
            con_grit: 'OPERATIONS'
        };

        Object.entries(log.xp_breakdown).forEach(([key, value]) => {
            const numValue = Number(value);
            if (numValue > maxValue) {
                maxValue = numValue;
                maxStat = statMap[key] || key.toUpperCase();
            }
        });

        return maxStat;
    }, [log.xp_breakdown]);

    // Format date
    const dateStr = new Date(log.created_at).toISOString().split('T')[0];

    return (
        <TouchableOpacity
            onPress={() => onPress(log)}
            activeOpacity={0.7}
            className="mb-3 bg-gray-900 border border-gray-800 overflow-hidden relative"
        >
            {/* Tech decoration corners - Dynamic Color */}
            <View className="absolute top-0 left-0 w-2 h-2 border-t border-l rounded-tl-sm" style={{ borderColor: accentColor, opacity: 0.5 }} />
            <View className="absolute bottom-0 right-0 w-2 h-2 border-b border-r rounded-br-sm" style={{ borderColor: accentColor, opacity: 0.5 }} />

            <View className="p-4">
                {/* Header Row: Date and XP */}
                <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-gray-500 text-[10px] font-mono tracking-widest">
                        {dateStr}
                    </Text>
                    <View className="flex-row items-center">
                        <Text className="font-bold text-lg mr-1" style={{ color: accentColor }}>
                            +{log.total_xp_awarded || 0}
                        </Text>
                        <ChevronDown size={14} color={accentColor} className="opacity-50" />
                    </View>
                </View>

                {/* Content Preview */}
                <Text
                    numberOfLines={2}
                    className="text-gray-300 font-medium text-sm leading-5 mb-3"
                >
                    {log.content}
                </Text>

                {/* Footer: Category Tag */}
                <View className="self-start bg-gray-800/50 px-2 py-1 rounded border border-gray-700">
                    <Text className="text-[10px] font-bold tracking-widest uppercase" style={{ color: accentColor, opacity: 0.8 }}>
                        {category}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};
