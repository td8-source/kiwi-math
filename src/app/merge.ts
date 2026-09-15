/**
 * Merges two copies of the app state (this device and the cloud) without losing progress.
 * Rules: a profile's newer copy wins for settings and stats, but stars, best scores,
 * attempts, owned gear and play time are combined so nothing earned disappears. Deleted
 * profiles stay deleted if the deletion is newer than the other copy's last change.
 */
import type { AppState, Profile, TierResult, TrailProgress } from "./state";
import { migrate } from "./state";

/** The part of the state that is uploaded: everything except device-only settings. */
export type CloudState = Omit<AppState, "sync" | "currentProfileId">;

export function toCloudState(state: AppState): CloudState {
  const { sync: _sync, currentProfileId: _current, ...rest } = state;
  return JSON.parse(JSON.stringify(rest)) as CloudState;
}

function mergeTier(a: TierResult | undefined, b: TierResult | undefined): TierResult | undefined {
  if (!a) return b;
  if (!b) return a;
  return {
    stars: Math.max(a.stars, b.stars) as TierResult["stars"],
    best: Math.max(a.best, b.best),
    attempts: Math.max(a.attempts, b.attempts),
    lastPlayed: Math.max(a.lastPlayed, b.lastPlayed),
  };
}

function mergeProgress(a: Record<string, TrailProgress>, b: Record<string, TrailProgress>): Record<string, TrailProgress> {
  const out: Record<string, TrailProgress> = {};
  for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const tiers: TrailProgress["tiers"] = {};
    for (const t of [1, 2, 3] as const) {
      const m = mergeTier(a[id]?.tiers[t], b[id]?.tiers[t]);
      if (m) tiers[t] = m;
    }
    out[id] = { tiers };
  }
  return out;
}

function maxByKey(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out[k] = Math.max(a[k] ?? 0, b[k] ?? 0);
  return out;
}

export function mergeProfile(a: Profile, b: Profile): Profile {
  const [newer, older] = a.updatedAt >= b.updatedAt ? [a, b] : [b, a];
  const rescues: Profile["rescues"] = {};
  for (const id of new Set([...Object.keys(a.rescues), ...Object.keys(b.rescues)])) {
    const m = mergeTier(a.rescues[id], b.rescues[id]);
    if (m) rescues[id] = m;
  }
  const skills: Profile["stats"]["skills"] = {};
  for (const code of new Set([...Object.keys(a.stats.skills), ...Object.keys(b.stats.skills)])) {
    const x = a.stats.skills[code];
    const y = b.stats.skills[code];
    // Skill tallies come from the copy with more answers; they cannot be summed without double counting.
    skills[code] = (x?.total ?? 0) >= (y?.total ?? 0) ? (x as NonNullable<typeof x>) : (y as NonNullable<typeof y>);
  }
  const sessions = [...a.stats.sessions, ...b.stats.sessions]
    .filter((s, i, arr) => arr.findIndex((o) => o.at === s.at && o.trailId === s.trailId) === i)
    .sort((x, y) => y.at - x.at)
    .slice(0, 60);
  return {
    ...JSON.parse(JSON.stringify(newer)),
    createdAt: Math.min(a.createdAt, b.createdAt),
    feathers: Math.max(a.feathers, b.feathers),
    parentUnlockedRegion: Math.max(a.parentUnlockedRegion, b.parentUnlockedRegion),
    progress: mergeProgress(a.progress, b.progress),
    rescues,
    playLog: maxByKey(a.playLog, b.playLog),
    bonusLog: maxByKey(a.bonusLog, b.bonusLog),
    stats: {
      timePlayedMs: Math.max(a.stats.timePlayedMs, b.stats.timePlayedMs),
      questionsAnswered: Math.max(a.stats.questionsAnswered, b.stats.questionsAnswered),
      questionsCorrect: Math.max(a.stats.questionsCorrect, b.stats.questionsCorrect),
      skills,
      sessions,
    },
    shop: {
      owned: [...new Set([...a.shop.owned, ...b.shop.owned])],
      equipped: { ...older.shop.equipped, ...newer.shop.equipped },
    },
  };
}

/** Merge the cloud copy into the local state. Returns a new state; the local `sync` and current profile are kept. */
export function mergeStates(local: AppState, remoteRaw: unknown): AppState {
  const remote = migrate(remoteRaw);
  const deleted = maxByKey(local.deleted, remote.deleted);
  const byId = new Map<string, Profile>();
  for (const p of [...local.profiles, ...remote.profiles]) {
    const existing = byId.get(p.id);
    byId.set(p.id, existing ? mergeProfile(existing, p) : p);
  }
  const profiles = [...byId.values()].filter((p) => !(deleted[p.id] && (deleted[p.id] as number) > p.updatedAt)).sort((x, y) => x.createdAt - y.createdAt);
  const pinFromRemote = remote.parentPinUpdatedAt > local.parentPinUpdatedAt;
  return {
    ...local,
    profiles,
    deleted,
    parentPin: pinFromRemote ? remote.parentPin : local.parentPin,
    parentPinUpdatedAt: Math.max(local.parentPinUpdatedAt, remote.parentPinUpdatedAt),
    currentProfileId: profiles.some((p) => p.id === local.currentProfileId) ? local.currentProfileId : null,
  };
}
