import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { LogAnalysisResult } from '@/services/ai';
import { useLogStore } from '@/store/logStore';
import { useUserStore } from '@/store/userStore';
import { soundService } from '@/utils/soundService';
import { AlertTriangle, Brain, Lock, X } from 'lucide-react-native';
import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CornerDecorations } from './CornerDecorations';

import { toLocalYMD } from '@/utils/dateHelpers';

interface LogEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void; // Trigger for level up check etc
}

type ModalPhase = 'INPUT' | 'PROCESSING' | 'RESULTS';

export function LogEntryModal({ visible, onClose, onSuccess }: LogEntryModalProps) {
  const { key: themeKey } = useTheme();
  const accentColor = (Colors as any)[themeKey]?.accent || Colors.emerald.accent;
  const { addLog, isLoading: storeLoading, logs } = useLogStore();
  const { profile } = useUserStore();

  const [phase, setPhase] = useState<ModalPhase>('INPUT');
  const [logContent, setLogContent] = useState('');
  const [result, setResult] = useState<LogAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculate today's FP — single store subscription, memoized
  const todayStr = toLocalYMD(new Date());
  const todayFP = useMemo(
    () =>
      logs
        .filter((l) => toLocalYMD(l.created_at) === todayStr)
        .reduce((sum, l) => sum + (l.total_fp_awarded || 0), 0),
    [logs, todayStr]
  );
  const isLocked = todayFP >= 100;

  // Fade animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setPhase('INPUT');
      setLogContent('');
      setResult(null);
      setError(null);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleProcess = async () => {
    if (!logContent.trim() || !profile?.id) return;
    if (logContent.trim().length < 20) {
      setError('Entry too short — add more detail for accurate analysis (min 20 characters).');
      return;
    }

    setPhase('PROCESSING');
    setError(null);

    try {
      const analysis = await addLog(profile.id, logContent);
      if (analysis) {
        setResult(analysis);
        setPhase('RESULTS');
        soundService.play('xp_gained');
      } else {
        // If null returned without error, generic error
        throw new Error('Analysis failed to produce results.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process log.');
      setPhase('INPUT'); // Go back to input to retry
    }
  };

  const handleClose = () => {
    if (phase === 'PROCESSING') return; // Prevent closing while processing
    onClose();
    if (phase === 'RESULTS') {
      onSuccess();
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View className={`flex-1 items-center justify-center bg-black/90 p-4 theme-${themeKey}`}>
          <Animated.View
            style={{ opacity: fadeAnim }}
            className="relative w-full max-w-md overflow-hidden border border-gray-800 bg-bg-card"
          >
            <CornerDecorations size="md" color={accentColor} />

            {/* Header */}
            <View className="flex-row items-center justify-between border-b border-gray-800 p-4">
              <Text className="font-bold uppercase tracking-widest text-text-primary">
                {isLocked && phase === 'INPUT' ? (
                  'ACCESS DENIED'
                ) : (
                  <>
                    {phase === 'INPUT' && 'New Log Entry'}
                    {phase === 'PROCESSING' && 'Neural Link Active'}
                    {phase === 'RESULTS' && 'Quest Results'}
                  </>
                )}
              </Text>
              <TouchableOpacity onPress={handleClose} disabled={phase === 'PROCESSING'}>
                <X size={20} color={phase === 'PROCESSING' ? '#333' : '#666'} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View className="p-6">
              {/* PROTOCOL LOCKED STATE (Only block 'INPUT'. Allow PROCESSING/RESULTS to finish) */}
              {isLocked && phase === 'INPUT' ? (
                <View className="items-center justify-center py-8">
                  <View className="w-full items-center rounded-lg border border-red-500/20 bg-red-500/10 p-6">
                    <Lock size={32} color="#ef4444" className="mb-3" />
                    <Text className="mb-1 text-center text-lg font-bold tracking-widest text-red-400">
                      PROTOCOL LOCKED
                    </Text>
                    <Text className="text-center text-xs uppercase tracking-wider text-gray-400">
                      Daily Focus Limit Reached (100/100)
                    </Text>
                    {/* <View className="mt-6 w-full h-1 bg-gray-800 rounded-full overflow-hidden"> */}
                    {/* <View className="h-full bg-red-500 w-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" /> */}
                    {/* </View> */}
                    <Text className="mt-2 animate-pulse text-[10px] font-bold uppercase tracking-[0.2em] text-red-500/50">
                      System Cooling Down
                    </Text>
                  </View>
                </View>
              ) : (
                /* NORMAL PHASES */
                <>
                  {/* INPUT PHASE */}
                  {phase === 'INPUT' && (
                    <>
                      <View className="mb-4">
                        <Text className="mb-2 text-xs uppercase tracking-wide text-text-dim">
                          Log Protocol: Dump what you did today.
                        </Text>
                        <TextInput
                          multiline
                          maxLength={500}
                          value={logContent}
                          onChangeText={(text) => {
                            setLogContent(text);
                            if (error) setError(null);
                          }}
                          placeholder="Deploying new features, closing deals, fixing bugs..."
                          placeholderTextColor="#4b5563"
                          className="min-h-[150px] rounded-md border border-gray-700 bg-bg-base p-4 text-base text-text-primary"
                          textAlignVertical="top"
                        />
                        <View className="mt-2 flex-row justify-end">
                          <Text
                            className={`text-xs font-medium ${logContent.length > 450 ? 'text-red-500' : 'text-text-dim'}`}
                          >
                            {logContent.length} / 500
                          </Text>
                        </View>
                      </View>
                      {error && <Text className="mb-4 text-xs text-red-500">{error}</Text>}
                      <TouchableOpacity
                        onPress={handleProcess}
                        style={{
                          backgroundColor: accentColor,
                          opacity: !logContent.trim() ? 0.5 : 1,
                        }}
                        disabled={!logContent.trim()}
                        className="items-center rounded-md p-4 shadow-lg shadow-accent/20"
                      >
                        <Text className="font-bold uppercase tracking-wider text-bg-base">
                          Initiate Analysis
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* PROCESSING PHASE */}
                  {phase === 'PROCESSING' && (
                    <View className="items-center justify-center py-12">
                      <ActivityIndicator size="large" color={accentColor} className="mb-6" />
                      <Text className="mb-2 animate-pulse text-center text-lg font-bold tracking-widest text-accent">
                        ANALYZING DATA PATTERNS
                      </Text>
                      <Text className="text-xs uppercase text-text-dim">
                        Consulting The Game Engine...
                      </Text>
                    </View>
                  )}

                  {/* RESULTS PHASE */}
                  {phase === 'RESULTS' && result && (
                    <ScrollView showsVerticalScrollIndicator={false}>
                      {/* High Input Alert */}
                      {result.total_fp > 79 && (
                        <View className="mb-4 flex-row items-center gap-3 rounded border border-red-500/30 bg-red-500/10 p-3">
                          <AlertTriangle size={24} color="#ef4444" />
                          <View className="flex-1">
                            <Text className="font-bold uppercase tracking-wide text-red-400">
                              High Input Warning
                            </Text>
                            <Text className="text-xs text-red-400/80">
                              Overclocking detected. Energy reduced significantly. Rest required.
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* Main Stats */}
                      <View className="mb-6 flex-row gap-4">
                        <View className="flex-1 items-center rounded border border-gray-800 bg-bg-base p-4">
                          <Text className="text-2xl font-bold text-accent">{result.total_fp}</Text>
                          <Text className="text-[10px] uppercase tracking-wider text-text-dim">
                            Focus Points
                          </Text>
                        </View>
                        <View className="flex-1 items-center rounded border border-gray-800 bg-bg-base p-4">
                          <Text className="text-2xl font-bold text-white">{result.total_xp}</Text>
                          <Text className="text-[10px] uppercase tracking-wider text-text-dim">
                            XP Gained
                          </Text>
                        </View>
                      </View>

                      {/* Insight */}
                      <View className="mb-6">
                        <View className="mb-2 flex-row items-center gap-2">
                          <Brain size={16} color={accentColor} />
                          <Text className="text-xs uppercase tracking-widest text-text-dim">
                            Strategic Insight
                          </Text>
                        </View>
                        <Text className="border-l-2 border-accent pl-3 italic leading-6 text-text-primary">
                          "{result.insight}"
                        </Text>
                      </View>

                      {/* XP Breakdown */}
                      <View className="mb-6">
                        <Text className="mb-3 text-xs uppercase tracking-widest text-text-dim">
                          XP Allocation
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                          {Object.entries(result.xp_breakdown).map(([stat, val]) => (
                            <View
                              key={stat}
                              className="flex-row items-center gap-2 rounded-full bg-gray-800 px-3 py-1"
                            >
                              <Text className="text-xs font-bold text-gray-400">{stat}</Text>
                              <Text className="text-xs font-bold text-white">+{val}</Text>
                            </View>
                          ))}
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={handleClose}
                        style={{ borderColor: accentColor }}
                        className="items-center rounded-md border p-4"
                      >
                        <Text
                          style={{ color: accentColor }}
                          className="font-bold uppercase tracking-wider"
                        >
                          Confirm & Close
                        </Text>
                      </TouchableOpacity>
                    </ScrollView>
                  )}
                </>
              )}
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
