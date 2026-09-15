import type { Tier } from "../curriculum/types";

export const STATE_VERSION = 1;

export interface TierResult {
  stars: 0 | 1 | 2 | 3;
  best: number;
  attempts: number;
  lastPlayed: number;
}

export interface TrailProgress {
  tiers: Partial<Record<Tier, TierResult>>;
}

export interface SkillStat {
  correct: number;
  total: number;
}

export interface SessionSummary {
  at: number;
  trailId: string;
  tier: Tier | 0;
  correct: number;
  total: number;
  durationMs: number;
}

export interface Avatar {
  character: number;
  colour: string;
}

export interface ProfileSettings {
  /** Show te reo Māori number words alongside numerals. */
  teReo: boolean;
  /** Read questions aloud. */
  narration: boolean;
}

export interface Profile {
  id: string;
  name: string;
  /** Last local change, used to merge cloud saves. */
  updatedAt: number;
  age: 5 | 6 | 7 | 8;
  avatar: Avatar;
  createdAt: number;
  feathers: number;
  parentUnlockedRegion: number;
  progress: Record<string, TrailProgress>;
  /** Rescue challenge results keyed by region id. */
  rescues: Record<string, TierResult>;
  settings: ProfileSettings;
  /** Daily play limit in minutes; 0 means no limit. */
  dailyLimitMin: number;
  /** Milliseconds played per calendar day, keyed YYYY-MM-DD. Only recent days are kept. */
  playLog: Record<string, number>;
  /** Extra minutes a parent granted today, keyed by day. */
  bonusLog: Record<string, number>;
  stats: {
    timePlayedMs: number;
    questionsAnswered: number;
    questionsCorrect: number;
    skills: Record<string, SkillStat>;
    sessions: SessionSummary[];
  };
  shop: {
    owned: string[];
    equipped: Record<string, string>;
  };
}

export type SyncMode = "none" | "account" | "family";

export interface SyncSettings {
  mode: SyncMode;
  /** Family code, kept only on this device. */
  familyCode?: string;
  /** Signed-in parent email, for display. */
  email?: string;
  lastSyncedAt?: number;
  lastError?: string;
}

export interface AppState {
  version: number;
  profiles: Profile[];
  /** Profiles deleted on this device, so the deletion wins over older cloud copies. */
  deleted: Record<string, number>;
  currentProfileId: string | null;
  parentPin: string | null;
  /** When the PIN was last changed, for merging. */
  parentPinUpdatedAt: number;
  settings: {
    sound: boolean;
  };
  /** Device-only cloud settings; never uploaded. */
  sync: SyncSettings;
}

export function defaultState(): AppState {
  return { version: STATE_VERSION, profiles: [], deleted: {}, currentProfileId: null, parentPin: null, parentPinUpdatedAt: 0, settings: { sound: true }, sync: { mode: "none" } };
}

export const AVATAR_COLOURS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#0ea5e9", "#8b5cf6", "#ec4899", "#14b8a6"];
export const AVATAR_CHARACTERS = 6;

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createProfile(name: string, age: 5 | 6 | 7 | 8, avatar: Avatar): Profile {
  return {
    id: newId(),
    name: name.trim().slice(0, 16) || "Explorer",
    updatedAt: Date.now(),
    age,
    avatar,
    createdAt: Date.now(),
    feathers: 0,
    parentUnlockedRegion: Math.max(0, Math.min(3, age - 5)),
    progress: {},
    rescues: {},
    settings: { teReo: true, narration: true },
    dailyLimitMin: 0,
    playLog: {},
    bonusLog: {},
    stats: { timePlayedMs: 0, questionsAnswered: 0, questionsCorrect: 0, skills: {}, sessions: [] },
    shop: { owned: [], equipped: {} },
  };
}

export function migrate(raw: unknown): AppState {
  if (!raw || typeof raw !== "object") return defaultState();
  const s = raw as Partial<AppState>;
  const state = defaultState();
  state.profiles = Array.isArray(s.profiles) ? s.profiles.filter((p) => p && typeof p.id === "string") : [];
  for (const p of state.profiles) {
    p.updatedAt ??= p.createdAt ?? 0;
    p.progress ??= {};
    p.rescues ??= {};
    p.feathers ??= 0;
    p.parentUnlockedRegion ??= Math.max(0, Math.min(3, (p.age ?? 5) - 5));
    p.settings ??= { teReo: true, narration: true };
    p.settings.teReo ??= true;
    p.settings.narration ??= true;
    p.dailyLimitMin ??= 0;
    p.playLog ??= {};
    p.bonusLog ??= {};
    p.stats ??= { timePlayedMs: 0, questionsAnswered: 0, questionsCorrect: 0, skills: {}, sessions: [] };
    p.stats.skills ??= {};
    p.stats.sessions ??= [];
    p.shop ??= { owned: [], equipped: {} };
    p.shop.owned ??= [];
    p.shop.equipped ??= {};
  }
  state.currentProfileId = typeof s.currentProfileId === "string" && state.profiles.some((p) => p.id === s.currentProfileId) ? s.currentProfileId : null;
  state.parentPin = typeof s.parentPin === "string" && /^\d{4}$/.test(s.parentPin) ? s.parentPin : null;
  state.parentPinUpdatedAt = typeof s.parentPinUpdatedAt === "number" ? s.parentPinUpdatedAt : 0;
  state.deleted = s.deleted && typeof s.deleted === "object" ? s.deleted : {};
  state.settings = { sound: s.settings?.sound ?? true };
  const mode = s.sync?.mode;
  state.sync = { mode: mode === "account" || mode === "family" ? mode : "none" };
  if (typeof s.sync?.familyCode === "string") state.sync.familyCode = s.sync.familyCode;
  if (typeof s.sync?.email === "string") state.sync.email = s.sync.email;
  if (typeof s.sync?.lastSyncedAt === "number") state.sync.lastSyncedAt = s.sync.lastSyncedAt;
  return state;
}

/** Mark a profile as changed so cloud merges prefer this copy. */
export function touch(profile: Profile): void {
  profile.updatedAt = Date.now();
}
