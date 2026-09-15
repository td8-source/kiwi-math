import type { CreatureName, ItemKind, Option, Question, Rng, Visual } from "./types";
import { pick, randInt, shuffle } from "./rng";

export const ITEMS: ItemKind[] = ["shell", "feather", "berry", "leaf", "stone", "flower", "egg", "star", "fish", "acorn"];
/** Items that exist but are not used for random counting sets. */

export const ITEM_NAMES: Record<ItemKind, { one: string; many: string }> = {
  shell: { one: "shell", many: "shells" },
  feather: { one: "feather", many: "feathers" },
  berry: { one: "berry", many: "berries" },
  leaf: { one: "leaf", many: "leaves" },
  stone: { one: "stone", many: "stones" },
  flower: { one: "flower", many: "flowers" },
  egg: { one: "egg", many: "eggs" },
  star: { one: "star", many: "stars" },
  fish: { one: "fish", many: "fish" },
  acorn: { one: "acorn", many: "acorns" },
  cup: { one: "cup", many: "cups" },
};

export function itemName(item: ItemKind, n: number): string {
  return n === 1 ? ITEM_NAMES[item].one : ITEM_NAMES[item].many;
}

export function randomItem(rng: Rng): ItemKind {
  return pick(rng, ITEMS);
}

/** Te reo Māori numbers 0-20 and the tens; used for the optional reo labels. */
const REO_UNITS = ["kore", "tahi", "rua", "toru", "whā", "rima", "ono", "whitu", "waru", "iwa", "tekau"];

export function teReoNumber(n: number): string | undefined {
  if (!Number.isInteger(n) || n < 0 || n > 100) return undefined;
  if (n <= 10) return REO_UNITS[n];
  if (n < 20) return `tekau mā ${REO_UNITS[n - 10]}`;
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  const tensWord = tens === 10 ? "kotahi rau" : `${REO_UNITS[tens]} tekau`;
  return ones === 0 ? tensWord : `${tensWord} mā ${REO_UNITS[ones]}`;
}

/** Display names for creatures, with macrons. */
export const CREATURE_NAMES: Record<CreatureName, string> = {
  kiwi: "kiwi",
  tui: "tūī",
  fantail: "pīwakawaka",
  weta: "wētā",
  tuatara: "tuatara",
  kea: "kea",
  penguin: "kororā",
  pukeko: "pūkeko",
  kakapo: "kākāpō",
  dolphin: "dolphin",
  morepork: "ruru",
  gecko: "gecko",
};

export function creatureName(c: CreatureName): string {
  return CREATURE_NAMES[c];
}

export const NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
];

export function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

export function numericDistractors(
  rng: Rng,
  answer: number,
  count: number,
  opts: { min?: number; max?: number; spread?: number; candidates?: number[] } = {},
): number[] {
  const min = opts.min ?? 0;
  const max = opts.max ?? Math.max(answer + 10, 10);
  const spread = opts.spread ?? Math.max(3, Math.ceil(Math.abs(answer) * 0.3));
  const chosen = new Set<number>();
  const pool: number[] = [];
  for (const c of opts.candidates ?? []) if (c !== answer && c >= min && c <= max) pool.push(c);
  for (const d of [1, -1, 2, -2, 10, -10]) {
    const c = answer + d;
    if (c >= min && c <= max) pool.push(c);
  }
  let guard = 0;
  while (chosen.size < count && guard++ < 200) {
    let cand: number;
    if (pool.length > 0 && chosen.size < Math.min(count, 2) + (rng() < 0.5 ? 1 : 0)) {
      cand = pool.splice(Math.floor(rng() * pool.length), 1)[0] as number;
    } else {
      cand = answer + randInt(rng, -spread, spread);
    }
    if (cand === answer || cand < min || cand > max) continue;
    chosen.add(cand);
  }
  let fill = min;
  while (chosen.size < count && fill <= max) {
    if (fill !== answer) chosen.add(fill);
    fill++;
  }
  return [...chosen];
}

function numOption(v: number): Option {
  const reo = teReoNumber(v);
  return reo ? { value: String(v), label: String(v), reo } : { value: String(v), label: String(v) };
}

export function choiceOptions(rng: Rng, answer: number, distractors: number[]): Option[] {
  return shuffle(rng, [answer, ...distractors]).map(numOption);
}

export function numberChoice(
  rng: Rng,
  base: Omit<Question, "mode" | "options" | "answer">,
  answer: number,
  opts: { min?: number; max?: number; spread?: number; candidates?: number[]; count?: number } = {},
): Question {
  const distractors = numericDistractors(rng, answer, opts.count ?? 3, opts);
  return { ...base, mode: "choice", options: choiceOptions(rng, answer, distractors), answer: String(answer) };
}

export function numpad(base: Omit<Question, "mode" | "answer">, answer: number): Question {
  return { ...base, mode: "numpad", answer: String(answer) };
}

export function textChoice(
  rng: Rng,
  base: Omit<Question, "mode" | "options" | "answer">,
  answer: string,
  distractors: string[],
): Question {
  const unique = [...new Set(distractors.filter((d) => d !== answer))].slice(0, 3);
  const values = shuffle(rng, [answer, ...unique]);
  return { ...base, mode: "choice", options: values.map((v) => ({ value: v, label: v })), answer };
}

export function visualChoice(
  rng: Rng,
  base: Omit<Question, "mode" | "options" | "answer">,
  answer: string,
  options: Option[],
): Question {
  return { ...base, mode: "choice", options: shuffle(rng, options), answer };
}

export function trueFalse(base: Omit<Question, "mode" | "options" | "answer">, isTrue: boolean): Question {
  return {
    ...base,
    mode: "truefalse",
    options: [
      { value: "true", label: "True" },
      { value: "false", label: "False" },
    ],
    answer: isTrue ? "true" : "false",
  };
}

export function objects(item: ItemKind, count: number, crossed?: number): Visual {
  return crossed === undefined ? { kind: "objects", item, count } : { kind: "objects", item, count, crossed };
}

export const COLOURS: Record<string, string> = {
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#facc15",
  purple: "#a855f7",
  orange: "#f97316",
};
export const COLOUR_NAMES = Object.keys(COLOURS);

export function colourHex(name: string): string {
  return COLOURS[name] ?? "#94a3b8";
}

export function timeWords(hour: number, minute: number): string {
  const h12 = ((hour + 11) % 12) + 1;
  const next = (h12 % 12) + 1;
  if (minute === 0) return `${h12} o'clock`;
  if (minute === 30) return `half past ${h12}`;
  if (minute === 15) return `quarter past ${h12}`;
  if (minute === 45) return `quarter to ${next}`;
  if (minute < 30) return `${minute} past ${h12}`;
  return `${60 - minute} to ${next}`;
}

export function digitalTime(hour: number, minute: number): string {
  const h12 = ((hour + 11) % 12) + 1;
  return `${h12}:${String(minute).padStart(2, "0")}`;
}

export function money(cents: number): string {
  if (cents < 100) return `${cents}c`;
  if (cents % 100 === 0) return `$${cents / 100}`;
  return `$${(cents / 100).toFixed(2)}`;
}

export const NZ_COINS = [10, 20, 50, 100, 200];

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
