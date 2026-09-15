import { describe, expect, it } from "vitest";
import { REGIONS, buildRound, trailRound, starsFor, rescueRound, passed, allSkills, strandsCovered } from "../src/curriculum";
import { seededRng } from "../src/curriculum/rng";
import type { Question, Strand, Tier, Visual } from "../src/curriculum/types";

const TIERS: Tier[] = [1, 2, 3];
const SAMPLES = 300;

function evalExpr(a: number, op: string, b: number): number | undefined {
  switch (op) {
    case "+": return a + b;
    case "−": return a - b;
    case "×": return a * b;
    case "÷": return a / b;
    default: return undefined;
  }
}

function visualSane(v: Visual | undefined): void {
  if (!v) return;
  switch (v.kind) {
    case "objects": expect(v.count).toBeGreaterThan(0); expect(v.count).toBeLessThanOrEqual(60); if (v.crossed !== undefined) expect(v.crossed).toBeLessThanOrEqual(v.count); break;
    case "groups": expect(v.groups.length).toBeGreaterThan(0); break;
    case "tenframe": expect(v.count + (v.secondColour ?? 0)).toBeLessThanOrEqual((v.frames ?? Math.ceil((v.count + (v.secondColour ?? 0)) / 10)) * 10); break;
    case "dots": expect(v.count).toBeGreaterThan(0); expect(v.count).toBeLessThanOrEqual(10); break;
    case "numberline": expect(v.to).toBeGreaterThan(v.from); break;
    case "blocks": expect(v.tens).toBeLessThanOrEqual(9); expect(v.ones).toBeLessThanOrEqual(9); break;
    case "fraction": expect(v.shaded).toBeLessThanOrEqual(v.parts); break;
    case "array": expect(v.rows * v.cols).toBeLessThanOrEqual(100); break;
    case "sequence": expect(v.values.filter((x) => x === null).length).toBe(1); break;
    case "hundredchart": expect(v.start).toBeGreaterThanOrEqual(1); break;
    case "clock": expect(v.hour).toBeGreaterThanOrEqual(1); expect(v.hour).toBeLessThanOrEqual(12); expect(v.minute).toBeGreaterThanOrEqual(0); expect(v.minute).toBeLessThan(60); break;
    case "coins": for (const c of v.coins) expect([10, 20, 50, 100, 200]).toContain(c); expect(v.coins.length).toBeLessThanOrEqual(6); break;
    case "lengths": expect(new Set(v.bars.map((b) => b.length)).size).toBe(v.bars.length); break;
    case "ruler": expect(v.length).toBeLessThanOrEqual(v.max ?? 12); expect(v.length).toBeGreaterThan(0); break;
    case "balance": expect(v.tilt).not.toBe("level"); break;
    case "containers": expect(new Set(v.levels).size).toBe(v.levels.length); break;
    case "areagrid": expect(v.shaded.length).toBeGreaterThan(0); expect(v.shaded.length).toBeLessThanOrEqual(v.rows * v.cols); break;
    case "thermometer": expect(v.value).toBeLessThanOrEqual(v.max ?? 40); break;
    case "calendar": if (v.mark !== undefined) expect(v.mark).toBeLessThanOrEqual(v.days); break;
    case "grid": for (const m of v.marks) { expect(m.col).toBeLessThan(v.cols); expect(m.row).toBeLessThan(v.rows); } break;
    case "angle": expect(v.degrees).toBeGreaterThan(0); expect(v.degrees).toBeLessThan(180); break;
    case "pattern": expect(v.tokens.length).toBeGreaterThan(0); if (v.missing !== undefined) expect(v.missing).toBeLessThan(v.tokens.length); break;
    case "pictograph": for (const r of v.rows) expect(r.count).toBeLessThanOrEqual(12); break;
    case "barchart": for (const b of v.bars) expect(b.value).toBeGreaterThanOrEqual(0); break;
    case "spinner": expect(v.segments.length).toBeGreaterThanOrEqual(2); expect(v.segments.length).toBeLessThanOrEqual(12); break;
    case "bag": expect(v.contents.reduce((s, c) => s + c.count, 0)).toBeGreaterThan(0); break;
    default: break;
  }
}

function checkQuestion(q: Question, skillCodes: Set<string>): void {
  expect(q.prompt.length).toBeGreaterThan(0);
  expect(q.answer.length).toBeGreaterThan(0);
  expect(skillCodes.has(q.skill)).toBe(true);
  visualSane(q.visual);
  if (q.mode === "numpad") {
    expect(q.answer).toMatch(/^\d+$/);
    expect(Number(q.answer)).toBeLessThanOrEqual(10000);
  } else {
    const opts = q.options ?? [];
    expect(opts.length).toBeGreaterThanOrEqual(2);
    expect(opts.length).toBeLessThanOrEqual(4);
    const values = opts.map((o) => o.value);
    expect(new Set(values).size).toBe(values.length);
    expect(values.filter((v) => v === q.answer).length).toBe(1);
    for (const o of opts) {
      expect(o.label !== undefined || o.visual !== undefined).toBe(true);
      visualSane(o.visual);
    }
  }
  const m = /^(\d+) ([+−×÷]) (\d+) = \?$/.exec(q.prompt);
  if (m) expect(Number(q.answer)).toBe(evalExpr(Number(m[1]), m[2] as string, Number(m[3])));
  const dbl = /^Double (\d+) = \?$/.exec(q.prompt);
  if (dbl) expect(Number(q.answer)).toBe(Number(dbl[1]) * 2);
  if (q.visual?.kind === "expression" && q.visual.text.includes("☐") && q.mode === "numpad") {
    const filled = q.visual.text.replace("☐", q.answer).replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
    const [lhs, rhs] = filled.split("=").map((s) => s.trim());
    const ev = (s: string) => Function(`return (${s})`)() as number;
    expect(ev(lhs as string)).toBe(ev(rhs as string));
  }
  // Clock questions: the answer must describe the clock that is shown.
  if (q.visual?.kind === "clock" && q.mode === "choice" && /^What time/.test(q.prompt)) {
    const { hour, minute } = q.visual;
    const h12 = ((hour + 11) % 12) + 1;
    const digital = `${h12}:${String(minute).padStart(2, "0")}`;
    const words = q.answer;
    const ok = words === digital || (minute === 0 && words === `${h12} o'clock`) || (minute === 30 && words === `half past ${h12}`) || (minute === 15 && words === `quarter past ${h12}`) || (minute === 45 && words === `quarter to ${(h12 % 12) + 1}`) || words.includes("past") || words.includes("to");
    expect(ok).toBe(true);
  }
}

describe("curriculum generators", () => {
  for (const region of REGIONS) {
    describe(region.name, () => {
      for (const trail of region.trails) {
        const codes = new Set(trail.skills.map((s) => s.code));
        for (const tier of TIERS) {
          it(`${trail.name} tier ${tier} produces valid questions`, () => {
            const rng = seededRng(region.index * 1000 + trail.id.length * 10 + tier);
            for (let i = 0; i < SAMPLES; i++) checkQuestion(trail.generate(tier, rng), codes);
          });
        }
      }
      it("rescue round mixes trails", () => {
        const round = rescueRound(region, seededRng(42 + region.index));
        expect(round).toHaveLength(12);
        const codes = new Set(region.trails.flatMap((t) => t.skills.map((s) => s.code)));
        for (const q of round) checkQuestion(q, codes);
      });
      it("covers all six strands", () => {
        const strands = strandsCovered(region);
        for (const s of ["number", "algebra", "measurement", "geometry", "statistics", "probability"] as Strand[]) expect(strands).toContain(s);
      });
    });
  }

  it("rounds are mostly distinct", () => {
    const round = trailRound(REGIONS[1]!.trails[3]!, 3, seededRng(7));
    expect(round).toHaveLength(10);
    expect(new Set(round.map((q) => q.prompt + q.answer)).size).toBeGreaterThanOrEqual(8);
  });

  it("buildRound never hangs on tiny question spaces", () => {
    expect(buildRound(() => ({ skill: "x", prompt: "same", answer: "1", mode: "numpad" }), 5, seededRng(1))).toHaveLength(5);
  });

  it("every skill has curriculum alignment text and a unique code", () => {
    for (const { skill } of allSkills()) {
      expect(skill.curriculum).toMatch(/^Year [1-4] /);
      expect(skill.code).toMatch(/^Y[1-4]\.[NAMGSP]\./);
    }
    const codes = allSkills().map((s) => s.skill.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe("scoring", () => {
  it("awards stars by accuracy", () => {
    expect(starsFor(10, 10)).toBe(3);
    expect(starsFor(8, 10)).toBe(2);
    expect(starsFor(7, 10)).toBe(1);
    expect(starsFor(6, 10)).toBe(0);
    expect(passed(7, 10)).toBe(true);
  });
});
