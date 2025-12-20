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
}

export const SystemAlert: React.FC<SystemAlertProps> = ({
    visible,
    type = 'info',
    title,
    message,
    onClose,
    accentColor,
}) => {
    const getIcon = () => {
        switch (type) {
            case 'success': return 'checkmark-circle';
            case 'error': return 'alert-circle';
            case 'warning': return 'warning';
            default: return 'information-circle';
        }
    };

    const getColor = () => {
        switch (type) {
            case 'success': return '#10b981'; // emerald-500
            case 'error': return '#ef4444'; // red-500
            case 'warning': return '#f59e0b'; // amber-500
            default: return accentColor;
        }
    };

    const themeColor = getColor();

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-center items-center bg-black/80 px-6">
                <TouchableOpacity
                    style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
                    onPress={onClose}
                />

                <View className="w-full bg-gray-900 border border-gray-800 rounded-lg overflow-hidden p-6 relative max-w-sm">
                    <CornerDecorations size="sm" color={themeColor} />

                    <View className="items-center mb-4">
                        <View className="mb-3 p-3 rounded-full bg-opacity-10" style={{ backgroundColor: `${themeColor}20` }}>
                            <Ionicons name={getIcon()} size={32} color={themeColor} />
                        </View>
                        <Text className="text-white text-lg font-bold tracking-wider text-center uppercase">
                            {title}
                        </Text>
                    </View>

                    <Text className="text-gray-400 text-sm text-center mb-6 leading-5">
                        {message}
                    </Text>

                    <TouchableOpacity
                        onPress={onClose}
                        className="w-full py-3 rounded-md"
                        style={{ backgroundColor: themeColor }}
                    >
                        <Text className="text-white font-bold text-center uppercase text-xs tracking-widest">
                            Acknowledge
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};
