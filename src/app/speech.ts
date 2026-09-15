/**
 * Reads questions aloud with the Web Speech API. On macOS this uses the
 * system voices inside the Tauri WebView; in Chrome it uses the browser's.
 * Everything is guarded so a missing API never breaks gameplay.
 */
let enabled = true;
let voice: SpeechSynthesisVoice | null | undefined;

export function setNarrationEnabled(on: boolean): void {
  enabled = on;
  if (!on) cancelSpeech();
}

export function narrationAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (voice !== undefined) return voice;
  try {
    const voices = window.speechSynthesis.getVoices();
    const prefer = ["en-NZ", "en-AU", "en-GB", "en-US", "en"];
    for (const lang of prefer) {
      const v = voices.find((x) => x.lang.replace("_", "-").toLowerCase().startsWith(lang.toLowerCase()));
      if (v) {
        voice = v;
        return v;
      }
    }
    voice = voices[0] ?? null;
  } catch {
    voice = null;
  }
  return voice;
}

if (narrationAvailable()) {
  try {
    window.speechSynthesis.addEventListener("voiceschanged", () => {
      voice = undefined;
    });
  } catch {
    /* ignore */
  }
}

/** Turn maths notation into words a voice can say. */
export function spokenForm(text: string): string {
  return text
    .replace(/☐/g, "box")
    .replace(/(\d+)\/(\d+)/g, (_, n: string, d: string) => fractionWords(Number(n), Number(d)))
    .replace(/×/g, " times ")
    .replace(/÷/g, " divided by ")
    .replace(/−/g, " minus ")
    .replace(/\+/g, " plus ")
    .replace(/=\s*\?/g, " equals what?")
    .replace(/=/g, " equals ")
    .replace(/≈/g, " is about ")
    .replace(/\$(\d+)\.(\d\d)/g, "$1 dollars $2 cents")
    .replace(/\$(\d+)/g, "$1 dollars")
    .replace(/(\d+)c\b/g, "$1 cents")
    .replace(/(\d+)\s*cm\b/g, "$1 centimetres")
    .replace(/(\d+)\s*mm\b/g, "$1 millimetres")
    .replace(/(\d+)\s*km\b/g, "$1 kilometres")
    .replace(/(\d+)\s*m\b/g, "$1 metres")
    .replace(/(\d+)\s*kg\b/g, "$1 kilograms")
    .replace(/(\d+)\s*mL\b/g, "$1 millilitres")
    .replace(/(\d+)\s*L\b/g, "$1 litres")
    .replace(/(\d+)\s*°C/g, "$1 degrees")
    .replace(/(\d+)°/g, "$1 degrees")
    .replace(/\s+/g, " ")
    .trim();
}

function fractionWords(n: number, d: number): string {
  const names: Record<number, [string, string]> = {
    2: ["half", "halves"],
    3: ["third", "thirds"],
    4: ["quarter", "quarters"],
    5: ["fifth", "fifths"],
    6: ["sixth", "sixths"],
    8: ["eighth", "eighths"],
    10: ["tenth", "tenths"],
    100: ["hundredth", "hundredths"],
  };
  const pair = names[d];
  if (!pair) return `${n} over ${d}`;
  return `${n} ${n === 1 ? pair[0] : pair[1]}`;
}

export function speak(text: string, opts: { interrupt?: boolean; rate?: number } = {}): void {
  if (!enabled || !narrationAvailable()) return;
  try {
    if (opts.interrupt !== false) window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(spokenForm(text));
    const v = pickVoice();
    if (v) u.voice = v;
    u.lang = v?.lang ?? "en-NZ";
    u.rate = opts.rate ?? 0.95;
    u.pitch = 1.05;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

export function cancelSpeech(): void {
  if (!narrationAvailable()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}
