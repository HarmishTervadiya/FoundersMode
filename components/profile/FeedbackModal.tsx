import { useFeedbackStore } from '@/store/feedbackStore';
import { useUserStore } from '@/store/userStore';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CornerDecorations } from '../ui/CornerDecorations';
import { SystemAlert } from '../ui/SystemAlert';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  accentColor: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ visible, onClose, accentColor }) => {
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
          message: 'Your system feedback has been uploaded to the mainframe.',
        });
        setContent('');
      } else {
        setAlertConfig({
          visible: true,
          type: 'error',
          title: 'Transmission Error',
          message: 'Failed to upload feedback.',
        });
      }
    } catch (e) {
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'System Malfunction',
        message: 'An unexpected error occurred during transmission.',
      });
    }
  };

  const handleAlertClose = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
    if (alertConfig.type === 'success') {
      onClose();
    }
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/80 px-4">
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
          onPress={onClose}
        />

        <View className="relative h-[400px] w-full overflow-hidden border border-gray-800 bg-gray-900 p-6">
          <CornerDecorations size="md" color={accentColor} />

          <Text className="mb-1 text-xl font-bold tracking-wider text-white">SYSTEM FEEDBACK</Text>
          <Text className="mb-6 text-xs uppercase tracking-widest text-gray-500">
            Report Anomalies / Suggest Upgrades
          </Text>

          <TextInput
            multiline
            textAlignVertical="top"
            value={content}
            onChangeText={setContent}
            placeholder="Initialize functionality request or bug report..."
            placeholderTextColor="#4b5563"
            className="mb-4 flex-1 rounded-lg border border-gray-700 bg-gray-800 p-4 font-medium text-white"
            style={{ textAlignVertical: 'top' }}
          />

          <View className="flex-row justify-end gap-3 space-x-3">
            <TouchableOpacity onPress={onClose} className="rounded-lg bg-gray-800 px-4 py-3">
              <Text className="font-bold text-gray-400">CANCEL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              className="rounded-lg px-6 py-3"
              style={{ backgroundColor: accentColor }}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="font-bold text-white">TRANSMIT</Text>
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
