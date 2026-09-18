/**
 * Keeps the local save and the cloud copy in step.
 * Pull-merge-push on start-up and on demand; debounced pushes after local changes.
 */
import type { AppState } from "./state";
import { accountOwner, familyOwner } from "./state";
import { mergeStates, toCloudState } from "./merge";
import { cloudConfigured, currentUser, pullAccount, pullFamily, pushAccount, pushFamily, type CloudUser } from "./cloud";

const SIGNED_OUT = "Signed out. Sign in again in the parent area to keep syncing.";
const WRONG_ACCOUNT = "This device is signed in as a different parent. Sign out and sign in again to keep syncing.";

export type SyncStatus = "off" | "idle" | "syncing" | "error" | "offline";

interface Hooks {
  getState(): AppState;
  /** Replace the in-memory state after a merge and persist it. */
  setState(next: AppState): void;
  onStatus(status: SyncStatus): void;
}

let hooks: Hooks | null = null;
let status: SyncStatus = "off";
let pushTimer: number | undefined;
let inFlight: Promise<void> | null = null;

export function initSync(h: Hooks): void {
  hooks = h;
  setStatus(cloudConfigured() && h.getState().sync.mode !== "none" ? "idle" : "off");
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => void syncNow());
  }
}

export function syncStatus(): SyncStatus {
  return status;
}

function setStatus(s: SyncStatus): void {
  status = s;
  hooks?.onStatus(s);
}

export function syncEnabled(): boolean {
  return !!hooks && cloudConfigured() && hooks.getState().sync.mode !== "none";
}

/** Push soon after a local change; repeated calls collapse into one upload. */
export function schedulePush(delayMs = 2500): void {
  if (!syncEnabled()) return;
  if (pushTimer) window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    pushTimer = undefined;
    void pushOnly();
  }, delayMs);
}

async function pushOnly(): Promise<void> {
  if (!hooks || !syncEnabled()) return;
  const state = hooks.getState();
  setStatus("syncing");
  const result = state.sync.mode === "account" ? await pushWithAccount(state) : await pushFamily(state.sync.familyCode ?? "", toCloudState(state));
  finish(state, result.ok ? undefined : result.error);
}

async function pushWithAccount(state: AppState) {
  const user = await currentUser();
  if (!user) return { ok: false as const, error: SIGNED_OUT };
  if (wrongAccount(state, user)) return { ok: false as const, error: WRONG_ACCOUNT };
  return pushAccount(user.id, toCloudState(state));
}

/**
 * True when this device holds another parent's explorers. Uploading then would copy
 * one family's children into another family's account, so every sync stops here
 * until the parent area is used to sign out and back in.
 */
function wrongAccount(state: AppState, user: CloudUser): boolean {
  const owner = state.sync.owner;
  return !!owner && owner !== accountOwner(user.id);
}

function finish(state: AppState, error?: string): void {
  if (error) {
    state.sync.lastError = error;
    setStatus(typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "error");
  } else {
    state.sync.lastError = undefined;
    state.sync.lastSyncedAt = Date.now();
    setStatus("idle");
  }
  hooks?.setState(state);
}

/** Full sync: pull the cloud copy, merge it in, push the result. */
export function syncNow(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    if (!hooks || !syncEnabled()) return;
    if (pushTimer) {
      window.clearTimeout(pushTimer);
      pushTimer = undefined;
    }
    const state = hooks.getState();
    setStatus("syncing");
    let pulled: { ok: true; value: unknown | null } | { ok: false; error: string };
    let userId: string | null = null;
    if (state.sync.mode === "account") {
      const user = await currentUser();
      if (!user) return finish(state, SIGNED_OUT);
      if (wrongAccount(state, user)) return finish(state, WRONG_ACCOUNT);
      userId = user.id;
      // Saves made before owners were recorded belong to whoever is signed in now.
      state.sync.owner ??= accountOwner(user.id);
      pulled = await pullAccount();
    } else {
      state.sync.owner ??= familyOwner(state.sync.familyCode ?? "");
      pulled = await pullFamily(state.sync.familyCode ?? "");
    }
    if (!pulled.ok) return finish(state, pulled.error);
    const merged = pulled.value ? mergeStates(state, pulled.value) : state;
    hooks.setState(merged);
    const pushed = state.sync.mode === "account" ? await pushAccount(userId as string, toCloudState(merged)) : await pushFamily(merged.sync.familyCode ?? "", toCloudState(merged));
    finish(merged, pushed.ok ? undefined : pushed.error);
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}
