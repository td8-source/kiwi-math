/**
 * Tiny synthesised sound effects (no audio files needed, works offline).
 * Everything is wrapped in try/catch so a missing AudioContext never breaks gameplay.
 */
let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

function context(): AudioContext | null {
  if (!enabled) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, duration: number, type: OscillatorType = "sine", gain = 0.12): void {
  const c = context();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + start);
  g.gain.setValueAtTime(0.0001, c.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + duration);
  osc.connect(g).connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + duration + 0.05);
}

export const sfx = {
  tap() { tone(600, 0, 0.06, "triangle", 0.06); },
  correct() { tone(523, 0, 0.12); tone(659, 0.1, 0.12); tone(784, 0.2, 0.2); },
  wrong() { tone(220, 0, 0.18, "square", 0.05); tone(180, 0.15, 0.25, "square", 0.05); },
  coin() { tone(988, 0, 0.08, "square", 0.05); tone(1319, 0.08, 0.16, "square", 0.05); },
  fanfare() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.25, "triangle", 0.1)); tone(1047, 0.5, 0.5, "triangle", 0.1); },
  unlock() { [392, 523, 659].forEach((f, i) => tone(f, i * 0.08, 0.3, "sine", 0.08)); },
};
