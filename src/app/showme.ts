/**
 * "Show me how": worked examples that walk a child through the strategy after they
 * have already seen the answer.
 *
 * A worked example is data, not animation code: each step is an existing `Visual`
 * plus a short caption, so every step renders through ui/visuals.ts exactly as a
 * question does. Steps that count along carry a `hold`, so the app advances them
 * on a rhythm the way a teacher points and counts out loud; the last step always
 * waits for the child.
 *
 * Every builder below checks the strategy against the question's own answer before
 * offering anything. A question we cannot explain truthfully gets no walkthrough,
 * and the authored `hint` and `explain` stand on their own.
 */
import type { Question, Visual } from "../curriculum/types";
import { itemName } from "../curriculum/helpers";

export interface ShowStep {
  /** Shown under the visual. One short sentence or a single number. */
  caption: string;
  /** Spoken version, when it should differ from the caption. */
  say?: string;
  visual?: Visual;
  /** Auto-advance after this many ms. The final step never has one. */
  hold?: number;
}

/** How long each counted item stays up. Slow enough to count along with. */
const COUNT_MS = 750;
/** Counting past this many one at a time is tedious, so bigger sets go up in fives. */
const COUNT_ONE_BY_ONE = 12;

/** The tallies to stop on when counting up to n. */
function countStops(n: number): number[] {
  if (n <= COUNT_ONE_BY_ONE) return Array.from({ length: n }, (_, i) => i + 1);
  const stops: number[] = [];
  for (let k = 5; k < n; k += 5) stops.push(k);
  stops.push(n);
  return stops;
}

const num = (v: string): number => Number(v);
const isNum = (v: string): boolean => /^-?\d+$/.test(v.trim());

/**
 * The steps that explain a question, or null when none of the strategies below
 * fits it. Pure, so tests can run it over every question the curriculum makes.
 */
export function workedExample(q: Question): ShowStep[] | null {
  if (!q.visual || !isNum(q.answer)) return null;
  const answer = num(q.answer);
  switch (q.visual.kind) {
    case "objects": return q.visual.crossed ? takeAway(q.visual, answer) : countObjects(q.visual, answer);
    case "groups": return joinGroups(q.visual, answer);
    case "tenframe": return tenFrame(q.visual, answer);
    case "array": return countArray(q.visual, answer);
    case "sequence": return fillSequence(q.visual, answer);
    case "numberline": return stepAlongLine(q, q.visual, answer);
    default: return null;
  }
}

/** Count each one, then say the total. */
function countObjects(v: Extract<Visual, { kind: "objects" }>, answer: number): ShowStep[] | null {
  if (answer !== v.count || v.count < 1) return null;
  return [
    ...countSteps(v.count, (counted) => ({ ...v, counted })),
    { caption: `${v.count} altogether!`, say: `There are ${v.count} ${itemName(v.item, v.count)}.`, visual: { ...v, counted: v.count } },
  ];
}

/** Start with the whole group, cross some off, count what is left. */
function takeAway(v: Extract<Visual, { kind: "objects" }>, answer: number): ShowStep[] | null {
  const gone = v.crossed ?? 0;
  const left = v.count - gone;
  if (answer !== left || left < 0) return null;
  return [
    { caption: `We start with ${v.count}.`, visual: { kind: "objects", item: v.item, count: v.count }, hold: 1400 },
    { caption: `Take away ${gone}.`, say: `Take away ${gone}. Cross them off.`, visual: v, hold: 1600 },
    ...countSteps(left, (counted) => ({ ...v, counted }), "Now count what is left."),
    { caption: `${v.count} take away ${gone} leaves ${left}.`, visual: { ...v, counted: left } },
  ];
}

/** Put two groups together and count on from the first. */
function joinGroups(v: Extract<Visual, { kind: "groups" }>, answer: number): ShowStep[] | null {
  if (v.groups.length !== 2) return null;
  const [a, b] = v.groups as [number, number];
  const op = v.operator ?? "+";
  if (op === "+") {
    if (answer !== a + b || a < 0 || b < 0) return null;
    const all = (counted: number): Visual => ({ kind: "objects", item: v.item, count: a + b, counted });
    return [
      { caption: `Put them together.`, visual: v, hold: 1600 },
      { caption: `We already have ${a}.`, say: `We already have ${a}. Now count on.`, visual: all(a), hold: 1500 },
      ...countOn(a, a + b, all),
      { caption: `${a} + ${b} = ${a + b}.`, visual: all(a + b) },
    ];
  }
  if (op === "-") {
    if (answer !== a - b || b > a) return null;
    const objs = (counted?: number): Visual => ({ kind: "objects", item: v.item, count: a, crossed: b, ...(counted === undefined ? {} : { counted }) });
    return [
      { caption: `We start with ${a}.`, visual: { kind: "objects", item: v.item, count: a }, hold: 1400 },
      { caption: `Take away ${b}.`, visual: objs(), hold: 1600 },
      ...countSteps(a - b, (counted) => objs(counted), "Now count what is left."),
      { caption: `${a} − ${b} = ${a - b}.`, visual: objs(a - b) },
    ];
  }
  return null;
}

/**
 * Ten frames do two jobs: counting what is in the frame, and finding how many more
 * fill it. The answer says which one this question is asking for.
 */
function tenFrame(v: Extract<Visual, { kind: "tenframe" }>, answer: number): ShowStep[] | null {
  const frames = v.frames ?? 1;
  if (answer === v.count && v.count > 0) {
    return [
      { caption: `A full row is 5.`, say: `A full row is 5. Count them.`, visual: v, hold: 1600 },
      ...countSteps(v.count, (counted) => ({ ...v, count: counted })),
      { caption: `${v.count} in the frame.`, visual: v },
    ];
  }
  const total = v.count + answer;
  if (answer <= 0 || total > frames * 10) return null;
  return [
    { caption: `The frame holds ${frames * 10}.`, visual: { ...v, count: 0, secondColour: 0 }, hold: 1500 },
    { caption: `${v.count} are already filled.`, visual: { ...v, secondColour: 0 }, hold: 1500 },
    ...countSteps(answer, (counted) => ({ ...v, secondColour: counted }), "Fill the empty spaces."),
    { caption: `${v.count} and ${answer} more makes ${total}.`, visual: { ...v, secondColour: answer } },
  ];
}

/** Count an array a row at a time, which is what skip counting looks like. */
function countArray(v: Extract<Visual, { kind: "array" }>, answer: number): ShowStep[] | null {
  if (answer !== v.rows * v.cols || v.rows < 1 || v.cols < 1) return null;
  const rows: ShowStep[] = Array.from({ length: v.rows }, (_, i) => ({
    caption: `${(i + 1) * v.cols}`,
    say: `${(i + 1) * v.cols}`,
    visual: { ...v, counted: (i + 1) * v.cols },
    hold: COUNT_MS + 250,
  }));
  return [
    { caption: `${v.rows} rows of ${v.cols}. Count one row at a time.`, visual: { ...v, counted: 0 }, hold: 2000 },
    ...rows,
    { caption: `${v.rows} rows of ${v.cols} is ${answer}.`, visual: { ...v, counted: answer } },
  ];
}

/** Show the size of the jump, then drop the missing number in. */
function fillSequence(v: Extract<Visual, { kind: "sequence" }>, answer: number): ShowStep[] | null {
  const gap = v.values.indexOf(null);
  if (gap === -1 || v.values.lastIndexOf(null) !== gap) return null;
  const filled = v.values.map((n, i) => (i === gap ? answer : n)) as number[];
  if (filled.some((n) => typeof n !== "number")) return null;
  const step = (filled[1] as number) - (filled[0] as number);
  if (!Number.isFinite(step) || step === 0) return null;
  // Only explain a sequence that really does step evenly, or the jump story is a lie.
  for (let i = 1; i < filled.length; i++) if ((filled[i] as number) - (filled[i - 1] as number) !== step) return null;
  const size = Math.abs(step);
  const dir = step > 0 ? "up" : "down";
  return [
    { caption: `Look at the jumps.`, say: `Look at the jumps between the numbers.`, visual: v, hold: 1800 },
    { caption: `Each jump goes ${dir} by ${size}.`, visual: v, hold: 2000 },
    { caption: `So the missing one is ${answer}.`, say: `So the missing number is ${answer}.`, visual: { kind: "sequence", values: filled } },
  ];
}

/**
 * One hop along the line, and only for a question that really is asking what comes
 * next to a number. Rounding questions also draw a number line and can land one away
 * from the answer, but "count back one" is the wrong strategy for them, so the prompt
 * has to say so before this offers anything.
 */
function stepAlongLine(q: Question, v: Extract<Visual, { kind: "numberline" }>, answer: number): ShowStep[] | null {
  const asks = /\bcomes? just (before|after)\b/i.exec(q.prompt);
  if (!asks) return null;
  if (v.mark === undefined || (v.step ?? 1) !== 1) return null;
  if (Math.abs(answer - v.mark) !== 1 || answer < v.from || answer > v.to) return null;
  const back = asks[1]?.toLowerCase() === "before";
  if (back !== answer < v.mark) return null;
  return [
    { caption: `We are at ${v.mark}.`, visual: v, hold: 1600 },
    { caption: `Count ${back ? "back" : "on"} one.`, visual: { ...v, mark: answer }, hold: 1600 },
    { caption: `${answer} comes just ${back ? "before" : "after"} ${v.mark}.`, visual: { ...v, mark: answer } },
  ];
}

/** Count 1, 2, 3 … up to n, showing more of the visual each time. */
function countSteps(n: number, visual: (counted: number) => Visual, lead?: string): ShowStep[] {
  const stops = countStops(n);
  return stops.map((k, i) => ({
    caption: i === 0 && lead ? lead : `${k}`,
    say: `${k}`,
    visual: visual(k),
    hold: COUNT_MS,
  }));
}

/** Count on from `from` to `to` without starting again at one. */
function countOn(from: number, to: number, visual: (counted: number) => Visual): ShowStep[] {
  const steps: ShowStep[] = [];
  for (let k = from + 1; k <= to; k++) steps.push({ caption: `${k}`, say: `${k}`, visual: visual(k), hold: COUNT_MS });
  return steps;
}
