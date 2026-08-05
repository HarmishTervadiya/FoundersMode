import { SystemAlert } from '@/components/ui/SystemAlert';
import { useUserStore } from '@/store/userStore';
import { soundService } from '@/utils/soundService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CornerDecorations } from '../ui/CornerDecorations';

interface UsernameChangeModalProps {
  visible: boolean;
  onClose: () => void;
  accentColor: string;
}

export const UsernameChangeModal: React.FC<UsernameChangeModalProps> = ({
  visible,
  onClose,
  accentColor,
}) => {
  const { profile, updateUsername, checkUsernameUnique, isLoading } = useUserStore();
  const [newUsername, setNewUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const [systemAlertVisible, setSystemAlertVisible] = useState(false);

  useEffect(() => {
    if (visible && profile?.username) {
      soundService.play('modal_open'); // Play open sound
      setNewUsername(profile.username);
      setError(null);

      // Calculate remaining days
      if (profile.last_username_change) {
        const lastChange = new Date(profile.last_username_change);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastChange.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 30) {
          setDaysRemaining(30 - diffDays);
        } else {
          setDaysRemaining(0);
        }
      } else {
        setDaysRemaining(0);
      }
    }
  }, [visible, profile]);

  const handleSave = async () => {
    const trimmed = newUsername.trim();
    if (trimmed.length < 3) {
      setError('Player Name must be at least 3 characters.');
      return;
    }

    if (daysRemaining > 0) return;

    if (trimmed === profile?.username) {
      onClose();
      return;
    }

    setIsChecking(true);
    try {
      const isUnique = await checkUsernameUnique(trimmed);
      if (!isUnique) {
        setError('Player Name is already unavailable.');
        setIsChecking(false);
        return;
      }

      await updateUsername(trimmed);
      setSystemAlertVisible(true);

      // Close modal after alert works its magic - actually SystemAlert usually auto-hides or we might want to show it BEFORE closing?
      // If SystemAlert is inside the modal, we need to keep modal open.
      // If SystemAlert is global, we can close modal.
      // Based on typical usage, let's show it, wait a sec, then close.
      setTimeout(() => {
        setSystemAlertVisible(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update Player Name.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View className="flex-1 items-center justify-center bg-black/80 px-4">
          <TouchableOpacity
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
            onPress={onClose}
          />

          <View className="relative w-full overflow-hidden border border-gray-800 bg-gray-900 p-6">
            <CornerDecorations size="md" color={accentColor} />

            <Text className="mb-1 text-xl font-bold tracking-wider text-white">
              IDENTITY PROTOCOL
            </Text>
            <Text className="mb-6 text-xs uppercase tracking-widest text-gray-500">
              Update System Alias
            </Text>

            {daysRemaining > 0 && !systemAlertVisible ? (
              <View className="mb-6 items-center rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                <Ionicons name="lock-closed" size={24} color="#ef4444" className="mb-2" />
                <Text className="text-center font-bold text-red-400">PROTOCOL LOCKED</Text>
                <Text className="mt-1 text-center text-xs text-gray-400">
                  Next modification available in {daysRemaining} days.
                </Text>
              </View>
            ) : (
              <>
                <View className="mb-4">
                  <Text className="mb-2 ml-1 text-xs text-gray-400">NEW ALIAS</Text>
                  <TextInput
                    value={newUsername}
                    onChangeText={(text) => {
                      setNewUsername(text);
                      setError(null);
                    }}
                    placeholder="Enter Player Name"
                    placeholderTextColor="#4b5563"
                    className="rounded-lg border border-gray-700 bg-gray-800 p-4 font-medium text-white"
                    autoCapitalize="none"
                  />
                </View>

                {error && <Text className="mb-4 ml-1 text-xs text-red-400">{error}</Text>}
              </>
            )}

            <View className="mt-2 flex-row justify-end gap-3 space-x-3">
              <TouchableOpacity onPress={onClose} className="rounded-lg bg-gray-800 px-4 py-3">
                <Text className="font-bold text-gray-400">CANCEL</Text>
              </TouchableOpacity>

              {!daysRemaining && (
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={isChecking}
                  className="rounded-lg px-6 py-3"
                  style={{ backgroundColor: accentColor }}
                >
                  {isChecking ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="font-bold text-white">UPDATE</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          <SystemAlert
            visible={systemAlertVisible}
            onClose={() => {}}
            title="IDENTITY UPDATED"
            message={`Your system alias has been changed to ${newUsername}.`}
            type="success"
            accentColor={accentColor}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
