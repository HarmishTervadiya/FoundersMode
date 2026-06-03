import { Log } from '@/store/logStore';
import { ChevronDown } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { toLocalYMD } from '@/utils/dateHelpers';

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
      con_grit: 'OPERATIONS',
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
  const dateStr = toLocalYMD(log.created_at);

  return (
    <TouchableOpacity
      onPress={() => onPress(log)}
      activeOpacity={0.7}
      className="relative mb-3 overflow-hidden border border-gray-800 bg-gray-900"
    >
      {/* Tech decoration corners - Dynamic Color */}
      <View
        className="absolute left-0 top-0 h-2 w-2 rounded-tl-sm border-l border-t"
        style={{ borderColor: accentColor, opacity: 0.5 }}
      />
      <View
        className="absolute bottom-0 right-0 h-2 w-2 rounded-br-sm border-b border-r"
        style={{ borderColor: accentColor, opacity: 0.5 }}
      />

      <View className="p-4">
        {/* Header Row: Date and XP */}
        <View className="mb-2 flex-row items-start justify-between">
          <Text className="font-mono text-[10px] tracking-widest text-gray-500">{dateStr}</Text>
          <View className="flex-row items-center">
            <Text className="mr-1 text-lg font-bold" style={{ color: accentColor }}>
              +{log.total_xp_awarded || 0}
            </Text>
            <ChevronDown size={14} color={accentColor} className="opacity-50" />
          </View>
        </View>

        {/* Content Preview */}
        <Text numberOfLines={2} className="mb-3 text-sm font-medium leading-5 text-gray-300">
          {log.content?.replace(/\\n|\n/g, ' ')}
        </Text>

        {/* Footer: Category Tag */}
        <View className="flex-row gap-2">
          <View className="self-start rounded border border-gray-700 bg-gray-800/50 px-2 py-1">
            <Text
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: accentColor, opacity: 0.8 }}
            >
              {category}
            </Text>
          </View>
          {log.debuff_applied && (
            <View className="self-start rounded border border-red-500/50 bg-red-900/30 px-2 py-1">
              <Text className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                DEBUFFED
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};
