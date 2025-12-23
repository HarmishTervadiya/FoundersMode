export const SOUND_NAMES = [
  "log_submitted",
  "xp_gained",
  "debuff_applied",
  "level_up",
  "modal_open",
  "onboarding_click",
] as const;

export type SoundName = (typeof SOUND_NAMES)[number];

type Listener = (name: SoundName) => void;

class SoundService {
  private listeners: Listener[] = [];
  private enabled: boolean = true;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  play(name: SoundName) {
    if (!this.enabled) return;
    this.listeners.forEach((listener) => listener(name));
  }

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}

export const soundService = new SoundService();
