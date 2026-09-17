import { describe, expect, it } from "vitest";
import { accountOwner, clearAccountData, createProfile, defaultState, familyOwner, migrate } from "../src/app/state";

const explorer = (name: string) => createProfile(name, 6, { character: 0, colour: "#000" });

describe("account data on this device", () => {
  it("clears explorers, the open profile and the parent PIN, but keeps device settings", () => {
    const s = defaultState();
    s.profiles = [explorer("Aroha")];
    s.currentProfileId = s.profiles[0]!.id;
    s.deleted = { old: 123 };
    s.parentPin = "1234";
    s.parentPinUpdatedAt = 999;
    s.settings.sound = false;
    s.sync = { mode: "account", email: "a@example.com", owner: accountOwner("user-a") };

    clearAccountData(s);

    expect(s.profiles).toEqual([]);
    expect(s.currentProfileId).toBeNull();
    expect(s.deleted).toEqual({});
    expect(s.parentPin).toBeNull();
    expect(s.parentPinUpdatedAt).toBe(0);
    expect(s.settings.sound).toBe(false);
    expect(s.sync.mode).toBe("account");
  });

  it("keeps the owner across a reload so a later sign-in can tell the device changed hands", () => {
    const s = defaultState();
    s.sync = { mode: "none", owner: accountOwner("user-a") };
    expect(migrate(JSON.parse(JSON.stringify(s))).sync.owner).toBe("account:user-a");
  });

  it("gives accounts and family codes owners that never collide", () => {
    expect(accountOwner("user-a")).not.toBe(accountOwner("user-b"));
    expect(familyOwner("kiwi-fern-river-mist-123456")).not.toBe(familyOwner("kiwi-fern-river-mist-123457"));
    expect(accountOwner("x")).not.toBe(familyOwner("x"));
  });

  it("never uploads the owner: it is device-only", async () => {
    const { toCloudState } = await import("../src/app/merge");
    const s = defaultState();
    s.sync = { mode: "account", owner: accountOwner("user-a") };
    expect(JSON.stringify(toCloudState(s))).not.toContain("user-a");
  });
});
