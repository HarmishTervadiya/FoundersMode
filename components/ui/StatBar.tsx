import clsx from 'clsx';
import React from 'react';
import { Text, View } from 'react-native';

interface StatBarProps {
  label?: string;
  value: number;
  maxValue: number;
  colorClass?: string;
  showValueText?: boolean;
  showBar?: boolean;
  heightClass?: string;
  className?: string;
  labelClassName?: string;
}

export const StatBar: React.FC<StatBarProps> = ({
  label,
  value,
  maxValue = 100,
  colorClass = 'bg-green-500',
  showValueText = true,
  showBar = true,
  heightClass = 'h-3', // Default height
  className,
  labelClassName,
}) => {
  // Ensure percentage is between 0 and 100
  const safeMax = maxValue || 100;
  const percentage = Math.min(Math.max((value / safeMax) * 100, 0), 100);

  return (
    <View className={clsx('mb-3 w-full', className)}>
      <View className="mb-1 flex-row items-end justify-between">
        {label && (
          <View className="relative ml-3">
            <Text
              className={clsx(
                'text-[10px] font-bold uppercase tracking-widest text-gray-400',
                labelClassName
              )}
            >
              {label}
            </Text>
            {/* Decoration dot that matches the bar color */}
            <View
              className={clsx(
                'absolute -left-3 top-1 h-1.5 w-1.5 rounded-full opacity-80',
                colorClass
              )}
            />
          </View>
        )}

        {showValueText && (
          <Text className="text-xs font-bold tracking-widest text-white">
            {value} <Text className="text-[10px] text-gray-600">/ {maxValue}</Text>
          </Text>
        )}
      </View>

      {showBar && (
        <View
          className={clsx(
            'relative w-full justify-center overflow-hidden rounded-full border border-gray-800 bg-gray-900',
            heightClass
          )}
        >
          {/* The Progress Bar */}
          <View
            className={clsx('h-full rounded-full opacity-90', colorClass)}
            style={{ width: `${percentage}%` }}
          />

          {/* Subtle Scanline/Gloss effect overlay */}
          <View className="absolute inset-0 bg-white/5" />
        </View>
      )}
    </View>
  );
};

export const AttributeStatCard = ({
  label,
  value,
  colorClass = 'bg-green-500',
}: {
  label: string;
  value: number;
  colorClass?: string;
}) => (
  <View className="w-[48%] justify-between rounded-xl border border-gray-800 bg-gray-900 p-4">
    <View className="relative mb-2">
      <View className={`absolute -left-5 top-1 h-1.5 w-1.5 rounded-full ${colorClass}`} />
      <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</Text>
    </View>
    <Text className="text-2xl font-black tracking-wider text-white">{value || 0}</Text>
  </View>
);
