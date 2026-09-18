/**
 * The sync loop must refuse to upload when the save on this device belongs to a
 * different parent than the one whose session is active.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { accountOwner, createProfile, defaultState, type AppState } from "../src/app/state";

const pushAccount = vi.fn(async (_userId: string, _state: unknown) => ({ ok: true as const, value: undefined }));
const pullAccount = vi.fn(async () => ({ ok: true as const, value: null }));

vi.mock("../src/app/cloud", () => ({
  cloudConfigured: () => true,
  currentUser: async () => ({ id: "user-b", email: "b@example.com" }),
  pullAccount: () => pullAccount(),
  pushAccount: (id: string, s: unknown) => pushAccount(id, s),
  pullFamily: async () => ({ ok: true, value: null }),
  pushFamily: async () => ({ ok: true, value: undefined }),
}));

const { initSync, syncNow } = await import("../src/app/sync");

function start(owner: string | undefined): AppState {
  const state = defaultState();
  state.profiles = [createProfile("Aroha", 6, { character: 0, colour: "#000" })];
  state.sync = { mode: "account", email: "b@example.com", ...(owner ? { owner } : {}) };
  initSync({ getState: () => state, setState: () => {}, onStatus: () => {} });
  return state;
}

beforeEach(() => {
  pushAccount.mockClear();
  pullAccount.mockClear();
});

describe("sync owner guard", () => {
  it("refuses to upload another parent's explorers into the signed-in account", async () => {
    const state = start(accountOwner("user-a"));
    await syncNow();
    expect(pullAccount).not.toHaveBeenCalled();
    expect(pushAccount).not.toHaveBeenCalled();
    expect(state.sync.lastError).toContain("different parent");
  });

  it("syncs normally when the save belongs to the signed-in account", async () => {
    const state = start(accountOwner("user-b"));
    await syncNow();
    expect(pushAccount).toHaveBeenCalledWith("user-b", expect.anything());
    expect(state.sync.lastError).toBeUndefined();
  });

  it("adopts the signed-in account for saves made before owners were recorded", async () => {
    const state = start(undefined);
    await syncNow();
    expect(state.sync.owner).toBe(accountOwner("user-b"));
    expect(pushAccount).toHaveBeenCalled();
  });
});
