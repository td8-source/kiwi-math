import { REGIONS, PASS_MARK, QUESTIONS_PER_ROUND, starsFor } from "../curriculum";
import type { Region, Tier } from "../curriculum/types";
import type { Profile, TierResult } from "./state";
import { addPlayTime } from "./timer";

export function trailResult(profile: Profile, trailId: string, tier: Tier): TierResult | undefined {
  return profile.progress[trailId]?.tiers[tier];
}

export function trailStars(profile: Profile, trailId: string): number {
  const p = profile.progress[trailId];
  if (!p) return 0;
  return ([1, 2, 3] as Tier[]).reduce((sum, t) => sum + (p.tiers[t]?.stars ?? 0), 0);
}

export function tierPassed(profile: Profile, trailId: string, tier: Tier): boolean {
  return (trailResult(profile, trailId, tier)?.stars ?? 0) >= 1;
}

export function tierUnlocked(profile: Profile, trailId: string, tier: Tier): boolean {
  if (tier === 1) return true;
  return tierPassed(profile, trailId, (tier - 1) as Tier);
}

/** The first trail is open; each later trail opens once the previous trail's bronze is passed. */
export function trailUnlocked(profile: Profile, region: Region, trailIndex: number): boolean {
  if (!regionUnlocked(profile, region.index)) return false;
  if (trailIndex === 0) return true;
  const prev = region.trails[trailIndex - 1];
  return prev ? tierPassed(profile, prev.id, 1) : false;
}

export function rescueUnlocked(profile: Profile, region: Region): boolean {
  return regionUnlocked(profile, region.index) && region.trails.every((t) => tierPassed(profile, t.id, 1));
}

export function rescuePassed(profile: Profile, region: Region): boolean {
  return (profile.rescues[region.id]?.stars ?? 0) >= 1;
}

export function regionUnlocked(profile: Profile, index: number): boolean {
  if (index <= profile.parentUnlockedRegion) return true;
  const prev = REGIONS[index - 1];
  return prev ? rescuePassed(profile, prev) : false;
}

export function regionComplete(profile: Profile, region: Region): boolean {
  return region.trails.every((t) => tierPassed(profile, t.id, 3)) && rescuePassed(profile, region);
}

export function regionStars(profile: Profile, region: Region): { earned: number; total: number } {
  const earned = region.trails.reduce((s, t) => s + trailStars(profile, t.id), 0) + (profile.rescues[region.id]?.stars ?? 0);
  return { earned, total: region.trails.length * 9 + 3 };
}

export function totalStars(profile: Profile): number {
  return REGIONS.reduce((s, r) => s + regionStars(profile, r).earned, 0);
}

export function rescuedCreatures(profile: Profile): Region["rescue"][] {
  return REGIONS.filter((r) => rescuePassed(profile, r)).map((r) => r.rescue);
}

export interface RoundOutcome {
  correct: number;
  total: number;
  stars: 0 | 1 | 2 | 3;
  feathersEarned: number;
  newStars: number;
  unlocked: string[];
  rescued?: Region["rescue"];
}

export interface AnswerRecord {
  skill: string;
  firstTry: boolean;
  correctEventually: boolean;
}

function feathersFor(stars: number, correct: number, firstTime: boolean): number {
  let f = correct + stars * 5;
  if (stars === 3) f += 5;
  if (firstTime && stars > 0) f += 10;
  return f;
}

export function recordRound(
  profile: Profile,
  opts: { region: Region; trailId: string | null; tier: Tier | 0; answers: AnswerRecord[]; durationMs: number },
): RoundOutcome {
  const { region, trailId, tier, answers, durationMs } = opts;
  const total = answers.length;
  const correct = answers.filter((a) => a.firstTry).length;
  const stars = starsFor(correct, total);
  const unlocked: string[] = [];

  const wasRescueUnlocked = rescueUnlocked(profile, region);
  const wasRescued = rescuePassed(profile, region);
  const nextRegion = REGIONS[region.index + 1];
  const wasNextRegionUnlocked = nextRegion ? regionUnlocked(profile, nextRegion.index) : true;
  const trailIndex = trailId ? region.trails.findIndex((t) => t.id === trailId) : -1;
  const nextTrail = trailIndex >= 0 ? region.trails[trailIndex + 1] : undefined;
  const wasNextTrailUnlocked = nextTrail ? trailUnlocked(profile, region, trailIndex + 1) : true;
  const wasTierUnlocked = trailId && tier > 0 && tier < 3 ? tierUnlocked(profile, trailId, (tier + 1) as Tier) : true;

  let target: TierResult | undefined;
  if (tier === 0) target = profile.rescues[region.id];
  else if (trailId) {
    profile.progress[trailId] ??= { tiers: {} };
    target = profile.progress[trailId].tiers[tier];
  }
  const firstTime = !target;
  const prevStars = target?.stars ?? 0;
  const updated: TierResult = {
    stars: Math.max(prevStars, stars) as 0 | 1 | 2 | 3,
    best: Math.max(target?.best ?? 0, correct),
    attempts: (target?.attempts ?? 0) + 1,
    lastPlayed: Date.now(),
  };
  if (tier === 0) profile.rescues[region.id] = updated;
  else if (trailId) (profile.progress[trailId] as { tiers: Partial<Record<Tier, TierResult>> }).tiers[tier] = updated;

  const feathersEarned = feathersFor(stars, correct, firstTime);
  profile.feathers += feathersEarned;

  profile.stats.timePlayedMs += durationMs;
  addPlayTime(profile, durationMs);
  profile.stats.questionsAnswered += total;
  profile.stats.questionsCorrect += correct;
  for (const a of answers) {
    const s = (profile.stats.skills[a.skill] ??= { correct: 0, total: 0 });
    s.total += 1;
    if (a.firstTry) s.correct += 1;
  }
  profile.stats.sessions.unshift({ at: Date.now(), trailId: trailId ?? `${region.id}:rescue`, tier, correct, total, durationMs });
  profile.stats.sessions = profile.stats.sessions.slice(0, 60);

  if (trailId && tier > 0 && tier < 3 && !wasTierUnlocked && tierUnlocked(profile, trailId, (tier + 1) as Tier)) unlocked.push(`${tier === 1 ? "Silver" : "Gold"} tier unlocked!`);
  if (nextTrail && !wasNextTrailUnlocked && trailUnlocked(profile, region, trailIndex + 1)) unlocked.push(`${nextTrail.name} is open!`);
  if (!wasRescueUnlocked && rescueUnlocked(profile, region)) unlocked.push(`${region.rescue.name} rescue unlocked!`);
  const rescued = !wasRescued && rescuePassed(profile, region) ? region.rescue : undefined;
  if (nextRegion && !wasNextRegionUnlocked && regionUnlocked(profile, nextRegion.index)) unlocked.push(`You can travel to ${nextRegion.name}!`);

  return { correct, total, stars, feathersEarned, newStars: Math.max(0, stars - prevStars), unlocked, rescued };
}

export function accuracy(stat: { correct: number; total: number } | undefined): number | null {
  if (!stat || stat.total === 0) return null;
  return Math.round((stat.correct / stat.total) * 100);
}

export { PASS_MARK, QUESTIONS_PER_ROUND };
