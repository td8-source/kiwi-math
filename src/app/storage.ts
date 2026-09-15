import { defaultState, migrate, type AppState } from "./state";

const KEY = "nature-maths-state";
const FILE = "nature-maths.json";

interface Backend {
  load(): Promise<unknown>;
  save(state: AppState): Promise<void>;
}

const isTauri = (): boolean => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

const localBackend: Backend = {
  async load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  async save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (err) {
      console.warn("Could not save progress to localStorage", err);
    }
  },
};

/**
 * In the packaged macOS app, progress is saved as JSON in the app's data folder
 * (~/Library/Application Support/nz.naturemaths.app/) via tauri-plugin-store.
 * The plugin is imported lazily so the same bundle also runs in a plain browser.
 */
async function tauriBackend(): Promise<Backend> {
  const { load } = await import("@tauri-apps/plugin-store");
  const store = await load(FILE, { autoSave: false, defaults: {} });
  return {
    async load() {
      return (await store.get<unknown>("state")) ?? null;
    },
    async save(state) {
      await store.set("state", state);
      await store.save();
    },
  };
}

let backend: Backend | null = null;

async function getBackend(): Promise<Backend> {
  if (backend) return backend;
  if (isTauri()) {
    try {
      backend = await tauriBackend();
      return backend;
    } catch (err) {
      console.warn("Tauri store unavailable, falling back to localStorage", err);
    }
  }
  backend = localBackend;
  return backend;
}

export async function loadState(): Promise<AppState> {
  const b = await getBackend();
  const raw = await b.load();
  return raw ? migrate(raw) : defaultState();
}

let pending: Promise<void> = Promise.resolve();

/** Serialise saves so a rapid burst never writes out of order. */
export function saveState(state: AppState): Promise<void> {
  const snapshot = JSON.parse(JSON.stringify(state)) as AppState;
  pending = pending.then(async () => {
    const b = await getBackend();
    await b.save(snapshot);
  });
  return pending;
}
