// Simple sound effects using Web Audio API

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

let soundEnabled = true;

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', vol = 0.15) {
  if (!soundEnabled) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

export function playDiscovery() {
  playTone(523, 0.1, 'sine', 0.12);
  setTimeout(() => playTone(659, 0.1, 'sine', 0.12), 80);
  setTimeout(() => playTone(784, 0.15, 'sine', 0.1), 160);
}

export function playCorrect() {
  playTone(660, 0.12, 'sine', 0.1);
  setTimeout(() => playTone(880, 0.2, 'sine', 0.1), 100);
}

export function playIncorrect() {
  playTone(330, 0.15, 'triangle', 0.1);
  setTimeout(() => playTone(280, 0.2, 'triangle', 0.1), 120);
}

export function playStep() {
  playTone(180 + Math.random() * 40, 0.04, 'triangle', 0.03);
}

export function playUIClick() {
  playTone(440, 0.05, 'sine', 0.06);
}

export function playCompletion() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.2, 'sine', 0.1), i * 120);
  });
}
