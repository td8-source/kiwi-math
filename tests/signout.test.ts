/**
 * The parent area's sign-in and sign-out handlers, with the cloud and the sync loop
 * mocked. These cover the rule that one family's explorers never follow the device
 * into another parent's account.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Ctx } from "../src/app/context";
import { accountOwner, createProfile, defaultState, familyOwner, type AppState } from "../src/app/state";

const cloud = {
  signOut: vi.fn(async () => {}),
  signIn: vi.fn(async (email: string, _password: string) => ({ ok: true as const, value: { id: "user-b", email } })),
  syncError: null as string | null,
};

vi.mock("../src/app/cloud", () => ({
  cloudConfigured: () => true,
  currentUser: async () => ({ id: "user-b", email: "b@example.com" }),
  passwordRecoveryPending: async () => false,
  pullFamily: async () => ({ ok: true, value: {} }),
  requestPasswordReset: async () => ({ ok: true, value: undefined }),
  signIn: (email: string, password: string) => cloud.signIn(email, password),
  signOut: () => cloud.signOut(),
  signUp: async () => ({ ok: true, value: { needsConfirmation: false, user: { id: "user-b", email: "b@example.com" } } }),
  updatePassword: async () => ({ ok: true, value: undefined }),
}));

vi.mock("../src/app/sync", () => ({
  syncStatus: () => "idle",
  syncNow: vi.fn(async () => {
    state.sync.lastError = cloud.syncError ?? undefined;
  }),
}));

const { cloudHandlers, initialCloudUi } = await import("../src/screens/cloudtab");

let state: AppState;

function setup(sync: AppState["sync"], ...names: string[]) {
  state = defaultState();
  state.profiles = names.map((n) => createProfile(n, 6, { character: 0, colour: "#000" }));
  state.currentProfileId = state.profiles[0]?.id ?? null;
  state.parentPin = "1234";
  state.parentPinUpdatedAt = 1;
  state.sync = sync;
  const ctx = {
    state,
    root: document.createElement("div"),
    route: { name: "parent" },
    currentProfile: () => state.profiles.find((p) => p.id === state.currentProfileId) ?? null,
    profile: () => state.profiles[0]!,
    save: vi.fn(),
    go: vi.fn(),
  } as unknown as Ctx;
  const ui = initialCloudUi();
  const root = document.createElement("div");
  root.innerHTML = `<input name="email" value="b@example.com" /><input name="password" value="kiwi-pass-123" />`;
  document.body.append(root);
  return { ctx, ui, handlers: cloudHandlers(ctx, ui, root, () => {}) };
}

const settle = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  cloud.syncError = null;
  cloud.signOut.mockClear();
  document.body.replaceChildren();
});

describe("signing out of a parent account", () => {
  it("takes the explorers off the device once they are safely in the account", async () => {
    const { handlers } = setup({ mode: "account", email: "a@example.com", owner: accountOwner("user-a") }, "Aroha", "Tama");
    handlers["cloud-signout"]!(document.createElement("div"));
    await settle();
    expect(cloud.signOut).toHaveBeenCalled();
    expect(state.sync).toEqual({ mode: "none" });
    expect(state.profiles).toEqual([]);
    expect(state.currentProfileId).toBeNull();
    expect(state.parentPin).toBeNull();
  });

  it("keeps the explorers when the last sync failed, so nothing unsaved is lost", async () => {
    cloud.syncError = "Could not reach the cloud.";
    const { ui, handlers } = setup({ mode: "account", email: "a@example.com", owner: accountOwner("user-a") }, "Aroha");
    handlers["cloud-signout"]!(document.createElement("div"));
    await settle();
    expect(state.profiles).toHaveLength(1);
    // The owner survives, so signing in as somebody else still clears the device.
    expect(state.sync).toEqual({ mode: "none", owner: accountOwner("user-a") });
    expect(ui.error).toContain("still on this device");
  });

  it("keeps the explorers when unlinking a family code, which cannot be recovered", async () => {
    const code = "kiwi-fern-river-mist-123456";
    const { handlers } = setup({ mode: "family", familyCode: code, owner: familyOwner(code) }, "Aroha");
    handlers["cloud-signout"]!(document.createElement("div"));
    await settle();
    expect(cloud.signOut).not.toHaveBeenCalled();
    expect(state.profiles).toHaveLength(1);
    expect(state.sync.owner).toBe(familyOwner(code));
  });
});

describe("signing in on a device that belonged to somebody else", () => {
  it("clears the previous parent's explorers instead of merging them in", async () => {
    const { handlers } = setup({ mode: "none", owner: accountOwner("user-a") }, "Aroha", "Tama");
    handlers["cloud-signin"]!(document.createElement("div"));
    await settle();
    expect(state.profiles).toEqual([]);
    expect(state.parentPin).toBeNull();
    expect(state.sync).toEqual({ mode: "account", owner: accountOwner("user-b"), email: "b@example.com" });
  });

  it("keeps explorers made on this device when nobody owns them yet", async () => {
    const { handlers } = setup({ mode: "none" }, "Aroha");
    handlers["cloud-signin"]!(document.createElement("div"));
    await settle();
    expect(state.profiles.map((p) => p.name)).toEqual(["Aroha"]);
    expect(state.sync.owner).toBe(accountOwner("user-b"));
  });

  it("keeps the explorers when the same parent signs back in", async () => {
    const { handlers } = setup({ mode: "none", owner: accountOwner("user-b") }, "Aroha");
    handlers["cloud-signin"]!(document.createElement("div"));
    await settle();
    expect(state.profiles.map((p) => p.name)).toEqual(["Aroha"]);
  });
});
