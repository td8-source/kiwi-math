import type { Profile } from "./state";

export function dayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function playedTodayMs(profile: Profile, now = new Date()): number {
  return profile.playLog[dayKey(now)] ?? 0;
}

/** Milliseconds allowed today, or null when no limit is set. */
export function allowedTodayMs(profile: Profile, now = new Date()): number | null {
  if (!profile.dailyLimitMin) return null;
  const bonus = profile.bonusLog[dayKey(now)] ?? 0;
  return (profile.dailyLimitMin + bonus) * 60_000;
}

export function remainingTodayMs(profile: Profile, now = new Date()): number | null {
  const allowed = allowedTodayMs(profile, now);
  if (allowed === null) return null;
  return Math.max(0, allowed - playedTodayMs(profile, now));
}

export function timeIsUp(profile: Profile, now = new Date()): boolean {
  const remaining = remainingTodayMs(profile, now);
  return remaining !== null && remaining <= 0;
}

/** Record play time and prune the log to the last 14 days. */
export function addPlayTime(profile: Profile, ms: number, now = new Date()): void {
  const key = dayKey(now);
  profile.playLog[key] = (profile.playLog[key] ?? 0) + ms;
  const keys = Object.keys(profile.playLog).sort();
  while (keys.length > 14) delete profile.playLog[keys.shift() as string];
  const bonusKeys = Object.keys(profile.bonusLog).sort();
  while (bonusKeys.length > 14) delete profile.bonusLog[bonusKeys.shift() as string];
}

export function grantBonusMinutes(profile: Profile, minutes: number, now = new Date()): void {
  const key = dayKey(now);
  profile.bonusLog[key] = (profile.bonusLog[key] ?? 0) + minutes;
}
