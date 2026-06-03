import { useAudioPlayer } from 'expo-audio';

// Map of sound names to their require paths
const SOUND_FILES = {
  log_submitted: require('@/assets/sounds/log_submitted.mp3'),
  xp_gained: require('@/assets/sounds/xp_gained.mp3'),
  debuff_applied: require('@/assets/sounds/debuff_applied.mp3'),
  level_up: require('@/assets/sounds/level_up.mp3'),
  modal_open: require('@/assets/sounds/modal_open.mp3'),
};

export type SoundName = keyof typeof SOUND_FILES;

export const useSound = () => {
  const players = {
    log_submitted: useAudioPlayer(SOUND_FILES.log_submitted),
    xp_gained: useAudioPlayer(SOUND_FILES.xp_gained),
    debuff_applied: useAudioPlayer(SOUND_FILES.debuff_applied),
    level_up: useAudioPlayer(SOUND_FILES.level_up),
    modal_open: useAudioPlayer(SOUND_FILES.modal_open),
  };

  const playSound = (name: SoundName) => {
    try {
      const player = players[name];
      if (player) {
        player.seekTo(0);
        player.play();
      }
    } catch (error) {
      console.warn(`Failed to play sound ${name}:`, error);
    }
  };

  return { playSound };
};
