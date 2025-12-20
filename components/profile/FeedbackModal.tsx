import { useFeedbackStore } from '@/store/feedbackStore';
import { useUserStore } from '@/store/userStore';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { CornerDecorations } from '../ui/CornerDecorations';
import { SystemAlert } from '../ui/SystemAlert';

interface FeedbackModalProps {
    visible: boolean;
    onClose: () => void;
    accentColor: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
    visible,
    onClose,
    accentColor,
}) => {
    const { profile } = useUserStore();
    const { submitFeedback, isSubmitting } = useFeedbackStore();
    const [content, setContent] = useState('');

    // Alert State
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        type: 'success' | 'error';
        title: string;
        message: string;
    }>({ visible: false, type: 'success', title: '', message: '' });

    const handleSubmit = async () => {
        if (!content.trim()) return;
        if (!profile) return;

        try {
            const success = await submitFeedback(profile.id, content);
            if (success) {
                setAlertConfig({
                    visible: true,
                    type: 'success',
                    title: 'Transmission Complete',
                    message: 'Your system feedback has been uploaded to the mainframe.'
                });
                setContent('');
            } else {
                setAlertConfig({
                    visible: true,
                    type: 'error',
                    title: 'Transmission Error',
                    message: 'Failed to upload feedback.'
                });
            }
        } catch (e) {
            setAlertConfig({
                visible: true,
                type: 'error',
                title: 'System Malfunction',
                message: 'An unexpected error occurred during transmission.'
            });
        }
    };

    const handleAlertClose = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        if (alertConfig.type === 'success') {
            onClose();
        }
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-center items-center bg-black/80 px-4">
                <TouchableOpacity
                    style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
                    onPress={onClose}
                />

                <View className="w-full bg-gray-900 border border-gray-800 overflow-hidden p-6 relative h-[400px]">
                    <CornerDecorations size="md" color={accentColor} />

                    <Text className="text-white text-xl font-bold mb-1 tracking-wider">
                        SYSTEM FEEDBACK
                    </Text>
                    <Text className="text-gray-500 text-xs mb-6 uppercase tracking-widest">
                        Report Anomalies / Suggest Upgrades
                    </Text>

                    <TextInput
                        multiline
                        textAlignVertical="top"
                        value={content}
                        onChangeText={setContent}
                        placeholder="Initialize functionality request or bug report..."
                        placeholderTextColor="#4b5563"
                        className="flex-1 bg-gray-800 text-white p-4 rounded-lg border border-gray-700 font-medium mb-4"
                        style={{ textAlignVertical: 'top' }}
                    />

                    <View className="flex-row justify-end space-x-3 gap-3">
                        <TouchableOpacity onPress={onClose} className="px-4 py-3 rounded-lg bg-gray-800">
                            <Text className="text-gray-400 font-bold">CANCEL</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleSubmit}
                            className="px-6 py-3 rounded-lg"
                            style={{ backgroundColor: accentColor }}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text className="text-white font-bold">TRANSMIT</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                <SystemAlert
                    visible={alertConfig.visible}
                    type={alertConfig.type}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    onClose={handleAlertClose}
                    accentColor={accentColor}
                />
            </View>
        </Modal>
    );
};
