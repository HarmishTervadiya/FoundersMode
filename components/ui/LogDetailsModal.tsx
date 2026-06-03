import { Log } from '@/store/logStore';
import { soundService } from '@/utils/soundService';
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

export const LogDetailsModal: React.FC<LogDetailsModalProps> = ({
  visible,
  log,
  onClose,
  accentColor,
}) => {
  React.useEffect(() => {
    // if (visible) {
    soundService.play('modal_open');
    // }
  }, [visible]);

  if (!log) return null;

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-center bg-black/80 px-4 py-8">
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
          onPress={onClose}
        />
        <View className="absolute inset-0 bg-accent opacity-5" />

        <View
          className="relative max-h-[80%] w-full overflow-hidden bg-gray-900 shadow-2xl"
          style={{ borderColor: `${accentColor}4D`, borderWidth: 1, shadowColor: accentColor }}
        >
          <CornerDecorations size="lg" color={accentColor} />

          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-gray-800 bg-gray-900/90 p-5">
            <View>
              <Text
                className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ color: accentColor }}
              >
                Log Analysis
              </Text>
              <Text className="text-lg font-bold text-white">Quest Results</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="rounded-full bg-gray-800 p-2">
              <X size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView className="p-5">
            {/* Main Content */}
            <Text className="mb-6 text-base font-medium leading-6 text-gray-300">
              {log.content?.replaceAll('\\n', '\n')}
            </Text>

            {/* AI Analysis Section */}
            {(log.analysis_report || log.strategic_insight) && (
              <View className="mb-6 rounded-lg border border-gray-700/50 bg-gray-800/30 p-4">
                <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-purple-400">
                  AI Insight
                </Text>
                {log.analysis_report && (
                  <Text className="mb-2 text-sm italic leading-5 text-gray-400">
                    "{log.analysis_report}"
                  </Text>
                )}
                {log.strategic_insight && (
                  <Text className="text-sm italic leading-5 text-gray-400">
                    Strategy: {log.strategic_insight}
                  </Text>
                )}
              </View>
            )}

            {/* XP Breakdown Grid */}
            {log.xp_breakdown && (
              <View>
                <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">
                  Stat Distribution
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {Object.entries(log.xp_breakdown).map(
                    ([stat, value]) =>
                      Number(value) > 0 && (
                        <View
                          key={stat}
                          className="flex-row items-center rounded-md border border-gray-700 bg-gray-800 px-3 py-2"
                        >
                          <Text className="mr-2 text-[10px] uppercase text-gray-400">
                            {stat.replace('_', ' ')}
                          </Text>
                          <Text className="text-sm font-bold" style={{ color: accentColor }}>
                            +{value}
                          </Text>
                        </View>
                      )
                  )}
                  {/* Total XP Badge */}
                  <View
                    className="flex-row items-center rounded-md border bg-transparent px-3 py-2"
                    style={{ borderColor: `${accentColor}4D`, backgroundColor: `${accentColor}1A` }}
                  >
                    <Text className="mr-2 text-[10px] uppercase" style={{ color: accentColor }}>
                      Total XP
                    </Text>
                    <Text className="text-sm font-bold text-white">+{log.total_xp_awarded}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Debuff Warning */}
            {log.debuff_applied && (
              <View className="mb-6 mt-4 flex-row items-center rounded-lg border border-red-500/30 bg-red-900/20 p-4">
                <View className="absolute bottom-0 left-0 top-0 mr-3 h-full w-1.5 rounded-full bg-red-500" />
                <View className="ml-2">
                  <Text className="mb-1 text-xs font-bold uppercase tracking-widest text-red-500">
                    Debuff Protocol Active
                  </Text>
                  <Text className="text-xs leading-4 text-red-400/80">
                    This log was recorded during state of exhaustion. Experience gain reduced by
                    50%.
                  </Text>
                </View>
              </View>
            )}

            {/* Spacer for bottom padding */}
            <View className="h-8" />
          </ScrollView>

          {/* Footer Decoration - Gradient fallback via Views since LinearGradient might be finicky with dynamic colors inline without full setup, but we'll try simple opacity text or view */}
          <View
            className="absolute bottom-0 h-1 w-full opacity-50"
            style={{ backgroundColor: accentColor }}
          />
        </View>
      </View>
    </Modal>
  );
};
