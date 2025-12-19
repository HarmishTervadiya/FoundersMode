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
    <View className={clsx("w-full mb-3", className)}>
      <View className="flex-row justify-between items-end mb-1">
        {label && (
          <View className="relative ml-3">
            <Text className={clsx("text-[10px] font-bold tracking-widest text-gray-400 uppercase", labelClassName)}>
              {label}
            </Text>
            {/* Decoration dot that matches the bar color */}
            <View className={clsx("absolute -left-3 top-1 w-1.5 h-1.5 rounded-full opacity-80", colorClass)} />
          </View>
        )}
        
        {showValueText && (
          <Text className="text-xs font-bold text-white tracking-widest">
            {value} <Text className="text-gray-600 text-[10px]">/ {maxValue}</Text>
          </Text>
        )}
      </View>

      {showBar && (
        <View className={clsx("w-full bg-gray-900 rounded-full border border-gray-800 relative overflow-hidden justify-center", heightClass)}>
          {/* The Progress Bar */}
          <View
            className={clsx("h-full opacity-90 rounded-full", colorClass)}
            style={{ width: `${percentage}%` }}
          />
          
          {/* Subtle Scanline/Gloss effect overlay */}
          <View className="absolute inset-0 bg-white/5" />
        </View>
      )}
    </View>
  );
};

export const AttributeStatCard = ({ label, value, colorClass = "bg-green-500" }: { label: string, value: number, colorClass?: string }) => (
  <View className="w-[48%] bg-gray-900 border border-gray-800 rounded-xl p-4 justify-between">
    <View className="relative mb-2">
      <View className={`absolute -left-5 top-1 w-1.5 h-1.5 rounded-full ${colorClass}`} />
      <Text className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
        {label}
      </Text>
    </View>
    <Text className="text-2xl font-black text-white tracking-wider">
      {value || 0}
    </Text>
  </View>
);