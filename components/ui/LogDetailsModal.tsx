import { Log } from '@/store/logStore';
import { X } from 'lucide-react-native';
import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { CornerDecorations } from './CornerDecorations';

interface LogDetailsModalProps {
    visible: boolean;
    log: Log | null;
    onClose: () => void;
    accentColor: string;
}

export const LogDetailsModal: React.FC<LogDetailsModalProps> = ({ visible, log, onClose, accentColor }) => {
    if (!log) return null;

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/80 justify-center px-4 py-8">

                <TouchableOpacity
                    style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
                    onPress={onClose}
                />
                <View className="absolute inset-0 opacity-5 bg-accent" />

                <View className="bg-gray-900 w-full max-h-[80%] overflow-hidden relative shadow-2xl" style={{ borderColor: `${accentColor}4D`, borderWidth: 1, shadowColor: accentColor }}>

                    <CornerDecorations size='lg' color={accentColor} />

                    {/* Header */}
                    <View className="p-5 border-b border-gray-800 flex-row justify-between items-center bg-gray-900/90">
                        <View>
                            <Text className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: accentColor }}>
                                Log Analysis
                            </Text>
                            <Text className="text-white font-bold text-lg">
                                Quest Results
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} className="p-2 bg-gray-800 rounded-full">
                            <X size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="p-5">
                        {/* Main Content */}
                        <Text className="text-gray-300 text-base leading-6 mb-6 font-medium">
                            {log.content?.replaceAll("\\n", "\n")}
                        </Text>

                        {/* AI Analysis Section */}
                        {(log.analysis_report || log.strategic_insight) && (
                            <View className="mb-6 bg-gray-800/30 p-4 rounded-lg border border-gray-700/50">
                                <Text className="text-purple-400 text-xs font-bold tracking-widest uppercase mb-3">
                                    AI Insight
                                </Text>
                                {log.analysis_report && (
                                    <Text className="text-gray-400 text-sm italic leading-5 mb-2">
                                        "{log.analysis_report}"
                                    </Text>
                                )}
                                {log.strategic_insight && (
                                    <Text className="text-gray-400 text-sm italic leading-5">
                                        Strategy: {log.strategic_insight}
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* XP Breakdown Grid */}
                        {log.xp_breakdown && (
                            <View>
                                <Text className="text-gray-500 text-xs font-bold tracking-widest uppercase mb-3">
                                    Stat Distribution
                                </Text>
                                <View className="flex-row flex-wrap gap-2">
                                    {Object.entries(log.xp_breakdown).map(([stat, value]) => (
                                        Number(value) > 0 && (
                                            <View key={stat} className="bg-gray-800 px-3 py-2 rounded-md border border-gray-700 flex-row items-center">
                                                <Text className="text-gray-400 text-[10px] uppercase mr-2">{stat.replace('_', ' ')}</Text>
                                                <Text className="font-bold text-sm" style={{ color: accentColor }}>+{value}</Text>
                                            </View>
                                        )
                                    ))}
                                    {/* Total XP Badge */}
                                    <View className="bg-transparent px-3 py-2 rounded-md border flex-row items-center" style={{ borderColor: `${accentColor}4D`, backgroundColor: `${accentColor}1A` }}>
                                        <Text className="text-[10px] uppercase mr-2" style={{ color: accentColor }}>Total XP</Text>
                                        <Text className="text-white font-bold text-sm">+{log.total_xp_awarded}</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Spacer for bottom padding */}
                        <View className="h-8" />
                    </ScrollView>

                    {/* Footer Decoration - Gradient fallback via Views since LinearGradient might be finicky with dynamic colors inline without full setup, but we'll try simple opacity text or view */}
                    <View className="h-1 w-full absolute bottom-0 opacity-50" style={{ backgroundColor: accentColor }} />
                </View>
            </View>
        </Modal>
    );
};
