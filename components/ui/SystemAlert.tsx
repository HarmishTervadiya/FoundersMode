import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { CornerDecorations } from './CornerDecorations';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

interface SystemAlertProps {
  visible: boolean;
  type?: AlertType;
  title: string;
  message: string;
  onClose: () => void;
  accentColor: string;
  primaryLabel?: string;
  onPrimaryPress?: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
}

export const SystemAlert: React.FC<SystemAlertProps> = ({
  visible,
  type = 'info',
  title,
  message,
  onClose,
  accentColor,
  primaryLabel = 'ACKNOWLEDGE',
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      default:
        return 'information-circle';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success':
        return accentColor; // emerald-500
      case 'error':
        return '#ef4444'; // red-500
      case 'warning':
        return '#f59e0b'; // amber-500
      default:
        return accentColor;
    }
  };

  const themeColor = getColor();

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/80 px-6">
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
          onPress={onClose}
        />

        <View className="relative w-full max-w-sm overflow-hidden border border-gray-800 bg-gray-900 p-6">
          <CornerDecorations size="sm" color={themeColor} />

          <View className="mb-4 items-center">
            <View
              className="mb-3 rounded-full bg-opacity-10 p-3"
              style={{ backgroundColor: `${themeColor}20` }}
            >
              <Ionicons name={getIcon()} size={32} color={themeColor} />
            </View>
            <Text className="text-center text-lg font-bold uppercase tracking-wider text-white">
              {title}
            </Text>
          </View>

          <Text className="mb-6 text-center text-sm leading-5 text-gray-400">{message}</Text>

          <View className="gap-3">
            {secondaryLabel && (
              <TouchableOpacity
                onPress={onSecondaryPress || onClose}
                className="w-full rounded-md border border-gray-700 bg-gray-800 py-3"
              >
                <Text className="text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                  {secondaryLabel}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={onPrimaryPress || onClose}
              className="w-full rounded-md py-3"
              style={{ backgroundColor: themeColor }}
            >
              <Text className="text-center text-xs font-bold uppercase tracking-widest text-white">
                {primaryLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
