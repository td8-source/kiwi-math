import type { Question, Region, Rng, Strand, Tier, Trail } from "./types";
import { region1 } from "./regions/region1";
import { region2 } from "./regions/region2";
import { region3 } from "./regions/region3";
import { region4 } from "./regions/region4";
import { defaultRng, pick } from "./rng";

export const REGIONS: readonly Region[] = [region1, region2, region3, region4];

export const QUESTIONS_PER_ROUND = 10;
export const RESCUE_QUESTIONS = 12;
export const PASS_MARK = 7;

export const TIER_NAMES: Record<Tier, string> = { 1: "Bronze", 2: "Silver", 3: "Gold" };

export function findRegion(id: string): Region | undefined {
  return REGIONS.find((r) => r.id === id);
}

export function findTrail(id: string): { region: Region; trail: Trail } | undefined {
  for (const region of REGIONS) {
    const trail = region.trails.find((t) => t.id === id);
    if (trail) return { region, trail };
  }
  return undefined;
}

export function rescueId(region: Region): string {
  return `${region.id}:rescue`;
}

function questionKey(q: Question): string {
  return `${q.prompt}|${q.answer}|${JSON.stringify(q.visual ?? null)}`;
}

export function buildRound(generate: (rng: Rng) => Question, count: number, rng: Rng = defaultRng): Question[] {
  const out: Question[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < count && guard++ < count * 30) {
    const q = generate(rng);
    const key = questionKey(q);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(q);
  }
  while (out.length < count) out.push(generate(rng));
  return out;
}

export function trailRound(trail: Trail, tier: Tier, rng: Rng = defaultRng): Question[] {
  return buildRound((r) => trail.generate(tier, r), QUESTIONS_PER_ROUND, rng);
}

/** The region's rescue challenge mixes every trail at silver/gold difficulty. */
export function rescueRound(region: Region, rng: Rng = defaultRng): Question[] {
  const tiers: Tier[] = [2, 2, 3];
  return buildRound((r) => pick(r, region.trails).generate(pick(r, tiers), r), RESCUE_QUESTIONS, rng);
}

export function starsFor(correct: number, total: number): 0 | 1 | 2 | 3 {
  if (correct >= total) return 3;
  if (correct / total >= 0.8) return 2;
  if (correct >= Math.ceil(total * (PASS_MARK / QUESTIONS_PER_ROUND))) return 1;
  return 0;
}

export function passed(correct: number, total: number): boolean {
  return starsFor(correct, total) >= 1;
}

export function allSkills(): { region: Region; trail: Trail; skill: Trail["skills"][number] }[] {
  const out: { region: Region; trail: Trail; skill: Trail["skills"][number] }[] = [];
  for (const region of REGIONS) for (const trail of region.trails) for (const skill of trail.skills) out.push({ region, trail, skill });
  return out;
}

export function strandsCovered(region: Region): Strand[] {
  const set = new Set<Strand>();
  for (const t of region.trails) {
    set.add(t.strand);
    if (t.strand2) set.add(t.strand2);
  }
  return [...set];
}
