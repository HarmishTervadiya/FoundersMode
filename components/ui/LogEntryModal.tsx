import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { LogAnalysisResult } from '@/services/ai';
import { useLogStore } from '@/store/logStore';
import { useUserStore } from '@/store/userStore';
import { AlertTriangle, Brain, Lock, X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Animated, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CornerDecorations } from './CornerDecorations';

interface LogEntryModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void; // Trigger for level up check etc
}

type ModalPhase = 'INPUT' | 'PROCESSING' | 'RESULTS';

export function LogEntryModal({ visible, onClose, onSuccess }: LogEntryModalProps) {
    const { key: themeKey } = useTheme();
    const accentColor = (Colors as any)[themeKey]?.accent || Colors.emerald.accent;
    const { addLog, isLoading: storeLoading } = useLogStore();
    const { profile } = useUserStore();

    const [phase, setPhase] = useState<ModalPhase>('INPUT');
    const [logContent, setLogContent] = useState('');
    const [result, setResult] = useState<LogAnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Calculate today's FP
    const today = new Date().toISOString().split('T')[0];
    const { logs } = useLogStore();
    const todayFP = logs
        .filter(l => l.created_at.startsWith(today))
        .reduce((sum, l) => sum + (l.total_fp_awarded || 0), 0);
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

        setPhase('PROCESSING');
        setError(null);

        try {
            const analysis = await addLog(profile.id, logContent);
            if (analysis) {
                setResult(analysis);
                setPhase('RESULTS');
            } else {
                // If null returned without error, generic error
                throw new Error("Analysis failed to produce results.");
            }
        } catch (err: any) {
            setError(err.message || "Failed to process log.");
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
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View className={`flex-1 justify-center items-center bg-black/90 p-4 theme-${themeKey}`}>
                <Animated.View
                    style={{ opacity: fadeAnim }}
                    className="w-full max-w-md bg-bg-card border border-gray-800 overflow-hidden relative"
                >
                    <CornerDecorations size="md" color={accentColor} />

                    {/* Header */}
                    <View className="p-4 border-b border-gray-800 flex-row justify-between items-center">
                        <Text className="text-text-primary font-bold tracking-widest uppercase">
                            {isLocked ? "ACCESS DENIED" : (
                                <>
                                    {phase === 'INPUT' && "New Log Entry"}
                                    {phase === 'PROCESSING' && "Neural Link Active"}
                                    {phase === 'RESULTS' && "Analysis Complete"}
                                </>
                            )}
                        </Text>
                        <TouchableOpacity onPress={handleClose} disabled={phase === 'PROCESSING'}>
                            <X size={20} color={phase === 'PROCESSING' ? '#333' : '#666'} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View className="p-6">
                        {/* PROTOCOL LOCKED STATE (Overrides phases) */}
                        {isLocked ? (
                            <View className="items-center justify-center py-8">
                                <View className="bg-red-500/10 border border-red-500/20 p-6 rounded-lg items-center w-full">
                                    <Lock size={32} color="#ef4444" className="mb-3" />
                                    <Text className="text-red-400 font-bold text-center text-lg tracking-widest mb-1">
                                        PROTOCOL LOCKED
                                    </Text>
                                    <Text className="text-gray-400 text-center text-xs uppercase tracking-wider">
                                        Daily Focus Limit Reached (100/100)
                                    </Text>
                                    {/* <View className="mt-6 w-full h-1 bg-gray-800 rounded-full overflow-hidden"> */}
                                    {/* <View className="h-full bg-red-500 w-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" /> */}
                                    {/* </View> */}
                                    <Text className="text-red-500/50 text-[10px] uppercase mt-2 font-bold tracking-[0.2em] animate-pulse">
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
                                            <Text className="text-xs text-text-dim mb-2 uppercase tracking-wide">
                                                Log Protocol: Dump what you did today.
                                            </Text>
                                            <TextInput
                                                multiline
                                                numberOfLines={6}
                                                maxLength={300}
                                                value={logContent}
                                                onChangeText={setLogContent}
                                                placeholder="Deploying new features, closing deals, fixing bugs..."
                                                placeholderTextColor="#4b5563"
                                                className="bg-bg-base text-text-primary p-4 rounded-md border border-gray-700 min-h-[150px] text-base"
                                                textAlignVertical="top"
                                            />
                                            <View className="flex-row justify-end mt-2">
                                                <Text className={`text-xs font-medium ${logContent.length > 280 ? 'text-red-500' : 'text-text-dim'}`}>
                                                    {logContent.length} / 300
                                                </Text>
                                            </View>
                                        </View>
                                        {error && (
                                            <Text className="text-red-500 text-xs mb-4">{error}</Text>
                                        )}
                                        <TouchableOpacity
                                            onPress={handleProcess}
                                            style={{ backgroundColor: accentColor, opacity: (!logContent.trim()) ? 0.5 : 1 }}
                                            disabled={!logContent.trim()}
                                            className="p-4 rounded-md items-center shadow-lg shadow-accent/20"
                                        >
                                            <Text className="text-bg-base font-bold tracking-wider uppercase">
                                                Initiate Analysis
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                )}

                                {/* PROCESSING PHASE */}
                                {phase === 'PROCESSING' && (
                                    <View className="py-12 items-center justify-center">
                                        <ActivityIndicator size="large" color={accentColor} className="mb-6" />
                                        <Text className="text-accent font-bold tracking-widest animate-pulse text-lg mb-2">
                                            ANALYZING DATA PATTERNS
                                        </Text>
                                        <Text className="text-text-dim text-xs uppercase">
                                            Consulting The Game Engine...
                                        </Text>
                                    </View>
                                )}

                                {/* RESULTS PHASE */}
                                {phase === 'RESULTS' && result && (
                                    <ScrollView showsVerticalScrollIndicator={false}>
                                        {/* High Input Alert */}
                                        {(result.total_fp > 79) && (
                                            <View className="bg-red-500/10 border border-red-500/30 p-3 rounded mb-4 flex-row items-center gap-3">
                                                <AlertTriangle size={24} color="#ef4444" />
                                                <View className="flex-1">
                                                    <Text className="text-red-400 font-bold uppercase tracking-wide">High Input Warning</Text>
                                                    <Text className="text-red-400/80 text-xs">
                                                        Overclocking detected. Energy reduced significantly. Rest required.
                                                    </Text>
                                                </View>
                                            </View>
                                        )}

                                        {/* Main Stats */}
                                        <View className="flex-row gap-4 mb-6">
                                            <View className="flex-1 bg-bg-base border border-gray-800 p-4 rounded items-center">
                                                <Text className="text-2xl font-bold text-accent">{result.total_fp}</Text>
                                                <Text className="text-[10px] text-text-dim uppercase tracking-wider">Focus Points</Text>
                                            </View>
                                            <View className="flex-1 bg-bg-base border border-gray-800 p-4 rounded items-center">
                                                <Text className="text-2xl font-bold text-white">{result.total_xp}</Text>
                                                <Text className="text-[10px] text-text-dim uppercase tracking-wider">XP Gained</Text>
                                            </View>
                                        </View>

                                        {/* Insight */}
                                        <View className="mb-6">
                                            <View className="flex-row items-center gap-2 mb-2">
                                                <Brain size={16} color={accentColor} />
                                                <Text className="text-xs text-text-dim uppercase tracking-widest">Strategic Insight</Text>
                                            </View>
                                            <Text className="text-text-primary italic leading-6 border-l-2 border-accent pl-3">
                                                "{result.insight}"
                                            </Text>
                                        </View>

                                        {/* XP Breakdown */}
                                        <View className="mb-6">
                                            <Text className="text-xs text-text-dim uppercase tracking-widest mb-3">XP Allocation</Text>
                                            <View className="flex-row flex-wrap gap-2">
                                                {Object.entries(result.xp_breakdown).map(([stat, val]) => (
                                                    <View key={stat} className="bg-gray-800 px-3 py-1 rounded-full flex-row items-center gap-2">
                                                        <Text className="text-xs text-gray-400 font-bold">{stat}</Text>
                                                        <Text className="text-xs text-white font-bold">+{val}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>

                                        <TouchableOpacity
                                            onPress={handleClose}
                                            style={{ borderColor: accentColor }}
                                            className="border p-4 rounded-md items-center"
                                        >
                                            <Text style={{ color: accentColor }} className="font-bold tracking-wider uppercase">
                                                Confirm & Close
                                            </Text>
                                        </TouchableOpacity>
                                    </ScrollView>
                                )}
                            </>
                        )}

                    </View>
                </Animated.View >
            </View >
        </Modal >
    );
}
