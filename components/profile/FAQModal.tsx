import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    LayoutAnimation,
    Modal,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    UIManager,
    View
} from 'react-native';
import { CornerDecorations } from '../ui/CornerDecorations';

if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQModalProps {
    visible: boolean;
    onClose: () => void;
    accentColor: string;
}

const FAQ_DATA: FAQItem[] = [
    {
    question: "What is Founder Mode?",
    answer: "Founder Mode is a text-based RPG that gamifies the invisible work of startups. Instead of checking off to-do lists, you log your daily actions, and our System converts them into XP and Stats. It rewards the *effort*, not just the outcome."
  },
  {
    question: "How do I earn XP?",
    answer: "Simple: Log your day. Open the log protocol, type what you did (e.g., 'Fixed auth bug', 'Sent 5 emails'), and submit. The AI analyzes the difficulty and category of your work to award XP. No manual checkboxes required."
  },
  {
    question: "What do the Stats (STR, CHA, etc.) mean?",
    answer: "Your logs categorize into 5 Founder Classes: \n\n• STR (Builder): Coding, Shipping, UI/UX.\n• CHA (Hustler): Marketing, Sales, Networking.\n• INT (Architect): Strategy, Learning, Planning.\n• CON (Grit): Failures, Bugs, Rejection (Resilience).\n• Zen (WIS): Rest, Sleep, Burnout Prevention."
  },
  {
    question: "What is the difference between FP and XP?",
    answer: "FP (Focus Points) is your Daily Score, capped at 100/day to prevent toxic overworking. XP (Experience) is your Lifetime Score that determines your Level. FP converts to XP at the end of the day."
  },
  {
    question: "How does the Mana(MP) / Energy system work?",
    answer: "Your Energy Bar tracks burnout resistance. High-intensity work drains it slowly. If it hits 0%, you enter a 'Burnout State' and receive a -50% XP Debuff for 3 days. To restore Energy (Mana), you must log restorative actions like 'Sleep', 'Walk', or 'Touched Grass', which grant ZEN XP and refill the bar."
  },
  {
    question: "What happens if I break a streak?",
    answer: "You lose the visual flame and the bragging rights. While there are no multiplier penalties yet, consistency is the primary way to level up fast."
  },
  {
    question: "Why do I get XP for failures?",
    answer: "Because in startups, failure is data. If you spend 6 hours debugging and don't fix it, you still did the work. The System awards 'Grit (CON)' XP for these moments to validate the struggle."
  },
  {
    question: "Is my data private?",
    answer: "Yes. Your logs are encrypted and stored securely in our cloud. We use them solely to calculate your game stats and do not sell your data to third parties."
  }
];

const AccordionItem = ({ item, isOpen, onPress, accentColor }: { item: FAQItem, isOpen: boolean, onPress: () => void, accentColor: string }) => {
    return (
        <View className="mb-3 border border-gray-800 bg-gray-900/50 rounded-lg overflow-hidden">
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={onPress}
                className="flex-row justify-between items-center p-4 bg-gray-900"
            >
                <Text className="text-gray-200 font-bold flex-1 mr-2">{item.question}</Text>
                <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={accentColor}
                />
            </TouchableOpacity>
            {isOpen && (
                <View className="p-4 border-t border-gray-800 bg-black/20">
                    <Text className="text-gray-400 leading-relaxed">{item.answer}</Text>
                </View>
            )}
        </View>
    );
};

export const FAQModal: React.FC<FAQModalProps> = ({
    visible,
    onClose,
    accentColor,
}) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const handlePress = (index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setOpenIndex(openIndex === index ? null : index);
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

                <View className="w-full bg-gray-950 border border-gray-800 overflow-hidden relative h-[80%] max-h-[600px] ">
                    <CornerDecorations size="md" color={accentColor} />

                    <View className="p-6 border-b border-gray-800">
                        <Text className="text-white text-xl font-bold mb-1 tracking-wider text-center">
                            SYSTEM MANUAL
                        </Text>
                        <Text className="text-gray-500 text-xs uppercase tracking-widest text-center">
                            Knowledge Base & FAQ
                        </Text>
                    </View>

                    <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
                        {FAQ_DATA.map((item, index) => (
                            <AccordionItem
                                key={index}
                                item={item}
                                isOpen={openIndex === index}
                                onPress={() => handlePress(index)}
                                accentColor={accentColor}
                            />
                        ))}

                        <View className="h-8" />
                    </ScrollView>

                    <View className="p-4 border-t border-gray-800 bg-gray-900/80">
                        <TouchableOpacity
                            onPress={onClose}
                            className="w-full py-3 rounded-lg items-center justify-center"
                            style={{ backgroundColor: `${accentColor}1A`, borderWidth: 1, borderColor: `${accentColor}4D` }}
                        >
                            <Text className="font-bold tracking-widest" style={{ color: accentColor }}>CLOSE MANUAL</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
