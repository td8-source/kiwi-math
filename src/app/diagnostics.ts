/**
 * Context for bug reports: where the app was, what it was doing and what went wrong.
 *
 * Everything here is gathered by allowlist, never by copying the save. A report is
 * meant to be readable in a public GitHub issue, so nothing that could identify a
 * child or a parent is collected: no explorer names, no email, no family code, no
 * progress. Only the ages and counts a bug needs to be reproduced.
 */
import type { AppState } from "./state";
import type { Route } from "./context";

export const APP_VERSION = __APP_VERSION__;
export const BUILD_SHA = __BUILD_SHA__;

const MAX_STEPS = 12;
const MAX_ERRORS = 5;
const STACK_CHARS = 600;

export interface LoggedError {
  at: number;
  kind: "error" | "promise";
  message: string;
  where?: string;
  stack?: string;
}

export interface Step {
  at: number;
  screen: string;
}

const steps: Step[] = [];
const errors: LoggedError[] = [];
let started = Date.now();

/** A short, stable description of a screen: the route name plus the ids a bug needs. */
export function screenLabel(route: Route): string {
  switch (route.name) {
    case "region": return `region:${route.regionId}`;
    case "play": return `play:${route.regionId}/${route.trailId ?? "rescue"}/tier${route.tier}`;
    default: return route.name;
  }
}

export function noteScreen(route: Route): void {
  const screen = screenLabel(route);
  if (steps[steps.length - 1]?.screen === screen) return;
  steps.push({ at: Date.now(), screen });
  if (steps.length > MAX_STEPS) steps.shift();
}

export function noteError(kind: LoggedError["kind"], message: string, where?: string, stack?: string): void {
  errors.push({
    at: Date.now(),
    kind,
    message: String(message).slice(0, 300),
    ...(where ? { where: where.slice(0, 200) } : {}),
    ...(stack ? { stack: stack.slice(0, STACK_CHARS) } : {}),
  });
  if (errors.length > MAX_ERRORS) errors.shift();
}

/** Start recording crashes. Safe to call once at boot; later calls are ignored. */
let listening = false;
export function initDiagnostics(): void {
  if (listening || typeof window === "undefined") return;
  listening = true;
  started = Date.now();
  window.addEventListener("error", (ev) => {
    const where = ev.filename ? `${fileName(ev.filename)}:${ev.lineno}:${ev.colno}` : undefined;
    noteError("error", ev.message || "Unknown error", where, ev.error instanceof Error ? ev.error.stack : undefined);
  });
  window.addEventListener("unhandledrejection", (ev) => {
    const r = ev.reason;
    noteError("promise", r instanceof Error ? r.message : String(r), undefined, r instanceof Error ? r.stack : undefined);
  });
}

/** Keep the file name but drop the origin, which is noise and can be a local path. */
function fileName(url: string): string {
  return url.split(/[\\/]/).pop() ?? url;
}

export interface Diagnostics {
  reportedAt: string;
  app: { version: string; build: string; shell: "browser" | "desktop app"; sessionMin: number };
  screen: string;
  recentScreens: string[];
  explorer: { age: number; unlockAll: boolean; dailyLimitMin: number } | null;
  explorersOnDevice: number;
  sync: { mode: AppState["sync"]["mode"]; lastSyncMin: number | null; lastError?: string };
  device: { userAgent: string; language: string; viewport: string; online: boolean; timeZone: string };
  errors: LoggedError[];
}

const minutesSince = (ts: number | undefined): number | null => (ts ? Math.round((Date.now() - ts) / 60000) : null);
const ago = (ts: number): string => `-${Math.round((Date.now() - ts) / 1000)}s`;

/**
 * Build the context attached to a report. `state` is read but never copied: each
 * field below is chosen on purpose.
 */
export function collectDiagnostics(state: AppState, route: Route): Diagnostics {
  const p = state.profiles.find((x) => x.id === state.currentProfileId) ?? null;
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  return {
    reportedAt: new Date().toISOString(),
    app: {
      version: APP_VERSION,
      build: BUILD_SHA,
      shell: typeof window !== "undefined" && "__TAURI_INTERNALS__" in window ? "desktop app" : "browser",
      sessionMin: Math.round((Date.now() - started) / 60000),
    },
    screen: screenLabel(route),
    recentScreens: steps.map((s) => `${s.screen} (${ago(s.at)})`),
    explorer: p ? { age: p.age, unlockAll: p.settings.unlockAll, dailyLimitMin: p.dailyLimitMin } : null,
    explorersOnDevice: state.profiles.length,
    sync: {
      mode: state.sync.mode,
      lastSyncMin: minutesSince(state.sync.lastSyncedAt),
      ...(state.sync.lastError ? { lastError: state.sync.lastError } : {}),
    },
    device: {
      userAgent: (nav?.userAgent ?? "unknown").slice(0, 300),
      language: nav?.language ?? "unknown",
      viewport: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio ?? 1}x` : "unknown",
      online: nav?.onLine ?? true,
      timeZone: (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return "unknown"; } })(),
    },
    errors: [...errors],
  };
}

/** Reset between tests. */
export function resetDiagnostics(): void {
  steps.length = 0;
  errors.length = 0;
  started = Date.now();
}
