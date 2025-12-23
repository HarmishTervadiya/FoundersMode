import { SystemAlert } from '@/components/ui/SystemAlert';
import { useUserStore } from '@/store/userStore';
import { soundService } from '@/utils/soundService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View
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

                <View className="w-full bg-gray-900 border border-gray-800 overflow-hidden p-6 relative">
                    <CornerDecorations size="md" color={accentColor} />

                    <Text className="text-white text-xl font-bold mb-1 tracking-wider">
                        IDENTITY PROTOCOL
                    </Text>
                    <Text className="text-gray-500 text-xs mb-6 uppercase tracking-widest">
                        Update System Alias
                    </Text>

                    {daysRemaining > 0 && !systemAlertVisible ? (
                        <View className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg items-center mb-6">
                            <Ionicons name="lock-closed" size={24} color="#ef4444" className="mb-2" />
                            <Text className="text-red-400 font-bold text-center">
                                PROTOCOL LOCKED
                            </Text>
                            <Text className="text-gray-400 text-center text-xs mt-1">
                                Next modification available in {daysRemaining} days.
                            </Text>
                        </View>
                    ) : (
                        <>
                            <View className="mb-4">
                                <Text className="text-gray-400 text-xs mb-2 ml-1">NEW ALIAS</Text>
                                <TextInput
                                    value={newUsername}
                                    onChangeText={(text) => {
                                        setNewUsername(text);
                                        setError(null);
                                    }}
                                    placeholder="Enter Player Name"
                                    placeholderTextColor="#4b5563"
                                    className="bg-gray-800 text-white p-4 rounded-lg border border-gray-700 font-medium"
                                    autoCapitalize="none"
                                />
                            </View>

                            {error && (
                                <Text className="text-red-400 text-xs mb-4 ml-1">
                                    {error}
                                </Text>
                            )}
                        </>
                    )}

                    <View className="flex-row justify-end space-x-3 gap-3 mt-2">
                        <TouchableOpacity onPress={onClose} className="px-4 py-3 rounded-lg bg-gray-800">
                            <Text className="text-gray-400 font-bold">CANCEL</Text>
                        </TouchableOpacity>

                        {!daysRemaining && (
                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={isChecking}
                                className="px-6 py-3 rounded-lg"
                                style={{ backgroundColor: accentColor }}
                            >
                                {isChecking ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text className="text-white font-bold">UPDATE</Text>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <SystemAlert
                    visible={systemAlertVisible}
                    onClose={() => {
                    }}
                    title="IDENTITY UPDATED"
                    message={`Your system alias has been changed to ${newUsername}.`}
                    type="success"
                    accentColor={accentColor}

                />
            </View>
        </Modal>
    );
};
