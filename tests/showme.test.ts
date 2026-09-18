/**
 * Worked examples must never mislead a child. These run the builder over thousands
 * of real generated questions and check that every walkthrough it offers ends on
 * the question's own answer, counts to it truthfully, and stays short enough to sit
 * through.
 */
import { describe, expect, it } from "vitest";
import { REGIONS } from "../src/curriculum";
import { seededRng } from "../src/curriculum/rng";
import type { Question, Tier, Visual } from "../src/curriculum/types";
import { workedExample, type ShowStep } from "../src/app/showme";

/** Every question the curriculum can make, across each trail, tier and many seeds. */
function everyQuestion(): Question[] {
  const out: Question[] = [];
  for (const region of REGIONS) {
    for (const trail of region.trails) {
      for (const tier of [1, 2, 3] as Tier[]) {
        for (let seed = 1; seed <= 60; seed++) out.push(trail.generate(tier, seededRng(seed * 7919 + tier)));
      }
    }
  }
  return out;
}

const QUESTIONS = everyQuestion();
const WITH_EXAMPLE = QUESTIONS.map((q) => ({ q, steps: workedExample(q) })).filter((x): x is { q: Question; steps: ShowStep[] } => x.steps !== null);

/** The number of things the final visual shows as counted, where that applies. */
function counted(v: Visual | undefined): number | null {
  if (!v) return null;
  if (v.kind === "objects" || v.kind === "array") return v.counted ?? null;
  if (v.kind === "tenframe") return v.secondColour ?? null;
  return null;
}

describe("worked examples", () => {
  it("runs over every question the curriculum generates without throwing", () => {
    expect(QUESTIONS.length).toBeGreaterThan(1000);
    for (const q of QUESTIONS) expect(() => workedExample(q)).not.toThrow();
  });

  it("covers the counting and early number questions children get stuck on", () => {
    const share = WITH_EXAMPLE.length / QUESTIONS.length;
    // A walkthrough is offered only where a strategy can be checked against the answer.
    expect(WITH_EXAMPLE.length).toBeGreaterThan(100);
    expect(share).toBeLessThan(1);
  });

  it("always finishes on the question's own answer", () => {
    for (const { q, steps } of WITH_EXAMPLE) {
      const last = steps[steps.length - 1]!;
      const shown = counted(last.visual);
      const inCaption = last.caption.includes(q.answer);
      expect(shown === null ? inCaption : shown === Number(q.answer) || inCaption).toBe(true);
    }
  });

  it("never counts past the answer", () => {
    for (const { q, steps } of WITH_EXAMPLE) {
      for (const s of steps) {
        const c = counted(s.visual);
        if (c !== null) expect(c).toBeLessThanOrEqual(Math.max(Number(q.answer), totalShown(s.visual)));
      }
    }
  });

  it("keeps every walkthrough short enough to sit through", () => {
    for (const { steps } of WITH_EXAMPLE) {
      expect(steps.length).toBeGreaterThan(0);
      expect(steps.length).toBeLessThanOrEqual(16);
      for (const s of steps) expect(s.caption.length).toBeLessThanOrEqual(60);
    }
  });

  it("lets the last step wait for the child, and auto-advances the rest", () => {
    for (const { steps } of WITH_EXAMPLE) {
      expect(steps[steps.length - 1]!.hold).toBeUndefined();
      for (const s of steps.slice(0, -1)) expect(s.hold).toBeGreaterThan(0);
    }
  });

  it("offers nothing when the answer is not a number it can count to", () => {
    expect(workedExample({ skill: "x", prompt: "Which shape is a circle?", mode: "choice", answer: "circle", visual: { kind: "shape", shape: "circle" } })).toBeNull();
    expect(workedExample({ skill: "x", prompt: "How many?", mode: "numpad", answer: "4" })).toBeNull();
  });

  it("refuses a walkthrough whose strategy would not reach the given answer", () => {
    const wrong: Question = { skill: "x", prompt: "How many shells?", mode: "numpad", answer: "9", visual: { kind: "objects", item: "shell", count: 6 } };
    expect(workedExample(wrong)).toBeNull();
    const right: Question = { ...wrong, answer: "6" };
    expect(workedExample(right)).not.toBeNull();
  });

  it("does not teach rounding as counting back one", () => {
    // A rounding question draws a number line too, and 41 really is one before 40's
    // neighbour - but "count back one" is the wrong strategy for rounding.
    const rounding: Question = { skill: "Y3.N.round", prompt: "Round 41 to the nearest 10.", mode: "numpad", answer: "40", visual: { kind: "numberline", from: 40, to: 50, mark: 41 } };
    expect(workedExample(rounding)).toBeNull();
    const before: Question = { skill: "Y1.N.sequence", prompt: "What number comes just before 41?", mode: "numpad", answer: "40", visual: { kind: "numberline", from: 37, to: 45, mark: 41 } };
    expect(workedExample(before)?.map((s) => s.caption)).toEqual(["We are at 41.", "Count back one.", "40 comes just before 41."]);
  });

  it("does not say 'before' when the question asked for 'after'", () => {
    const mismatched: Question = { skill: "x", prompt: "What number comes just after 41?", mode: "numpad", answer: "40", visual: { kind: "numberline", from: 37, to: 45, mark: 41 } };
    expect(workedExample(mismatched)).toBeNull();
  });

  it("fills a ten frame as the child counts it, not just twice", () => {
    const steps = workedExample({ skill: "Y1.N.subitise", prompt: "How many did you see?", mode: "numpad", answer: "8", visual: { kind: "tenframe", count: 8 } })!;
    expect(steps.map((s) => s.caption)).toEqual(["A full row is 5.", "1", "2", "3", "4", "5", "6", "7", "8", "8 in the frame."]);
    const counts = steps.slice(1, -1).map((s) => (s.visual?.kind === "tenframe" ? s.visual.count : -1));
    expect(counts).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("refuses a sequence that does not step evenly", () => {
    const uneven: Question = { skill: "x", prompt: "What is missing?", mode: "numpad", answer: "7", visual: { kind: "sequence", values: [2, 4, null, 11] } };
    expect(workedExample(uneven)).toBeNull();
  });

  it("counts a small set one at a time and a big set in fives", () => {
    const small = workedExample({ skill: "x", prompt: "How many?", mode: "numpad", answer: "6", visual: { kind: "objects", item: "shell", count: 6 } })!;
    expect(small.map((s) => s.caption)).toEqual(["1", "2", "3", "4", "5", "6", "6 altogether!"]);
    const big = workedExample({ skill: "x", prompt: "How many?", mode: "numpad", answer: "18", visual: { kind: "objects", item: "shell", count: 18 } })!;
    expect(big.map((s) => s.caption)).toEqual(["5", "10", "15", "18", "18 altogether!"]);
  });

  it("counts on from the first group instead of starting again at one", () => {
    const steps = workedExample({ skill: "x", prompt: "7 + 3 = ?", mode: "numpad", answer: "10", visual: { kind: "groups", item: "shell", groups: [7, 3], operator: "+" } })!;
    expect(steps.map((s) => s.caption)).toEqual(["Put them together.", "We already have 7.", "8", "9", "10", "7 + 3 = 10."]);
  });

  it("crosses off and recounts for a take away", () => {
    const steps = workedExample({ skill: "x", prompt: "9 − 4 = ?", mode: "numpad", answer: "5", visual: { kind: "objects", item: "shell", count: 9, crossed: 4 } })!;
    expect(steps[0]!.caption).toBe("We start with 9.");
    expect(steps[1]!.caption).toBe("Take away 4.");
    expect(steps[steps.length - 1]!.caption).toBe("9 take away 4 leaves 5.");
  });
});

function totalShown(v: Visual | undefined): number {
  if (!v) return 0;
  if (v.kind === "objects") return v.count;
  if (v.kind === "array") return v.rows * v.cols;
  if (v.kind === "tenframe") return (v.frames ?? 1) * 10;
  return 0;
}
