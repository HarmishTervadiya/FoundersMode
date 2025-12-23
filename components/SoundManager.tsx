import { useSettingsStore } from '@/store/settingsStore';
import { SoundName, soundService } from '@/utils/soundService';
import { useAudioPlayer } from 'expo-audio';
import { useEffect } from 'react';

// Safely require assets. If they don't exist, we might crash if we don't catch it, 
// but require paths must be static. 
// We accept that we need the files.
// For now, I will assume the paths are correct as per plan.
const SOUND_FILES: Record<SoundName, any> = {
    log_submitted: require('@/assets/sounds/log_submitted.wav'),
    xp_gained: require('@/assets/sounds/xp_gained.wav'),
    debuff_applied: require('@/assets/sounds/debuff_applied.wav'),
    level_up: require('@/assets/sounds/level_up.wav'),
    modal_open: require('@/assets/sounds/modal_open.wav'),
    onboarding_click: require('@/assets/sounds/onboarding.wav'),
};

export const SoundManager = () => {
    // Initialize players for each sound
    // Note: useAudioPlayer might take options. Assuming default is fine.
    const logSubmittedPlayer = useAudioPlayer(SOUND_FILES.log_submitted);
    const xpGainedPlayer = useAudioPlayer(SOUND_FILES.xp_gained);
    const debuffAppliedPlayer = useAudioPlayer(SOUND_FILES.debuff_applied);
    const levelUpPlayer = useAudioPlayer(SOUND_FILES.level_up);
    const modalOpenPlayer = useAudioPlayer(SOUND_FILES.modal_open);
    const onboardingClickPlayer = useAudioPlayer(SOUND_FILES.onboarding_click);

    const players = {
        log_submitted: logSubmittedPlayer,
        xp_gained: xpGainedPlayer,
        debuff_applied: debuffAppliedPlayer,
        level_up: levelUpPlayer,
        modal_open: modalOpenPlayer,
        onboarding_click: onboardingClickPlayer,
    };

    const { initialize, soundEnabled } = useSettingsStore();

    useEffect(() => {
        initialize();
    }, []);

    useEffect(() => {
        const unsubscribe = soundService.subscribe((name) => {
            // Double check store state, though soundService.play() should block it too.
            // But since this listener triggers the actual audio player, we can be extra safe 
            // or just rely on soundService.

            // Actually, soundService.play() blocks calling listeners if disabled.
            // So we just need to respond to the event.

            const player = players[name];
            if (player) {
                try {
                    player.seekTo(0);
                    player.play();
                } catch (e) {
                    console.warn(`Error playing sound ${name}:`, e);
                }
            }
        });

        return unsubscribe;
    }, [players]);

    return null;
};
