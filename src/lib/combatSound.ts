type CombatSound = 'shot' | 'impact' | 'damage';

let audioContext: AudioContext | null = null;

export function playCombatSound(kind: CombatSound, volume = 0.16) {
  try {
    audioContext ??= new AudioContext();
    const context = audioContext;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    const duration = kind === 'impact' ? 0.13 : kind === 'damage' ? 0.2 : 0.09;

    oscillator.type = kind === 'shot' ? 'square' : kind === 'impact' ? 'sawtooth' : 'triangle';
    oscillator.frequency.setValueAtTime(kind === 'shot' ? 420 : kind === 'impact' ? 150 : 95, now);
    oscillator.frequency.exponentialRampToValueAtTime(kind === 'shot' ? 130 : kind === 'impact' ? 55 : 40, now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  } catch {
    // Звук — улучшение, игра продолжает работать, если браузер его блокирует.
  }
}
