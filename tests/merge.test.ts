import { describe, expect, it } from "vitest";
import { createProfile, defaultState, type AppState } from "../src/app/state";
import { mergeStates, toCloudState } from "../src/app/merge";
import { recordRound } from "../src/app/progress";
import { REGIONS } from "../src/curriculum";
import { generateFamilyCode, normaliseFamilyCode, isValidFamilyCode } from "../src/app/familycode";

const region = REGIONS[0]!;
const answers = (n: number) => Array.from({ length: 10 }, (_, i) => ({ skill: "Y1.N.count10", firstTry: i < n, correctEventually: true }));

function stateWith(...profiles: ReturnType<typeof createProfile>[]): AppState {
  const s = defaultState();
  s.profiles = profiles;
  return s;
}

describe("merge", () => {
  it("keeps profiles that exist on only one side", () => {
    const a = createProfile("Kai", 5, { character: 0, colour: "#000" });
    const b = createProfile("Mia", 7, { character: 1, colour: "#000" });
    const merged = mergeStates(stateWith(a), toCloudState(stateWith(b)));
    expect(merged.profiles.map((p) => p.name).sort()).toEqual(["Kai", "Mia"]);
  });

  it("never loses stars, feathers or owned gear from either side", () => {
    const base = createProfile("Kai", 5, { character: 0, colour: "#000" });
    const local = JSON.parse(JSON.stringify(base)) as typeof base;
    const remote = JSON.parse(JSON.stringify(base)) as typeof base;
    recordRound(local, { region, trailId: region.trails[0]!.id, tier: 1, answers: answers(10), durationMs: 1000 });
    local.shop.owned.push("hat-sun");
    recordRound(remote, { region, trailId: region.trails[1]!.id, tier: 1, answers: answers(8), durationMs: 2000 });
    remote.shop.owned.push("boots-red");
    remote.updatedAt = local.updatedAt + 5000;
    remote.name = "Kai R";
    const merged = mergeStates(stateWith(local), toCloudState(stateWith(remote)));
    const p = merged.profiles[0]!;
    expect(p.name).toBe("Kai R");
    expect(p.progress[region.trails[0]!.id]?.tiers[1]?.stars).toBe(3);
    expect(p.progress[region.trails[1]!.id]?.tiers[1]?.stars).toBe(2);
    expect(p.feathers).toBe(Math.max(local.feathers, remote.feathers));
    expect(p.shop.owned.sort()).toEqual(["boots-red", "hat-sun"]);
    expect(p.stats.sessions).toHaveLength(2);
  });

  it("is symmetric", () => {
    const a = createProfile("Kai", 5, { character: 0, colour: "#000" });
    const b = JSON.parse(JSON.stringify(a)) as typeof a;
    recordRound(a, { region, trailId: region.trails[0]!.id, tier: 1, answers: answers(9), durationMs: 1 });
    recordRound(b, { region, trailId: region.trails[0]!.id, tier: 1, answers: answers(7), durationMs: 1 });
    b.updatedAt = a.updatedAt + 1;
    const ab = mergeStates(stateWith(a), toCloudState(stateWith(b))).profiles[0]!;
    const ba = mergeStates(stateWith(b), toCloudState(stateWith(a))).profiles[0]!;
    expect(ab.progress).toEqual(ba.progress);
    expect(ab.feathers).toBe(ba.feathers);
  });

  it("propagates deletions that are newer than the other copy", () => {
    const a = createProfile("Kai", 5, { character: 0, colour: "#000" });
    const local = stateWith();
    local.deleted[a.id] = a.updatedAt + 1000;
    const merged = mergeStates(local, toCloudState(stateWith(a)));
    expect(merged.profiles).toHaveLength(0);
    // But a profile edited after the deletion comes back.
    a.updatedAt = local.deleted[a.id]! + 1;
    expect(mergeStates(local, toCloudState(stateWith(a))).profiles).toHaveLength(1);
  });

  it("takes the newer parent PIN and keeps device-only sync settings", () => {
    const local = defaultState();
    local.parentPin = "1111";
    local.parentPinUpdatedAt = 10;
    local.sync = { mode: "family", familyCode: "kiwi-fern-river-mist-123456" };
    const remote = defaultState();
    remote.parentPin = "2222";
    remote.parentPinUpdatedAt = 20;
    const merged = mergeStates(local, toCloudState(remote));
    expect(merged.parentPin).toBe("2222");
    expect(merged.sync.familyCode).toBe("kiwi-fern-river-mist-123456");
    expect((toCloudState(local) as Partial<AppState>).sync).toBeUndefined();
  });

  it("carries a rename and the testing unlock to other devices", () => {
    const here = createProfile("Kai", 5, { character: 0, colour: "#000" });
    const there = JSON.parse(JSON.stringify(here)) as typeof here;

    // This device renames the explorer and turns on the testing unlock.
    here.name = "Kaia";
    here.settings.unlockAll = true;
    here.updatedAt = there.updatedAt + 1000;

    const merged = mergeStates(stateWith(there), toCloudState(stateWith(here))).profiles[0]!;
    expect(merged.name).toBe("Kaia");
    expect(merged.settings.unlockAll).toBe(true);

    // Switching it off on the newer device wins too, and the rename sticks.
    here.settings.unlockAll = false;
    here.updatedAt += 1000;
    const off = mergeStates(stateWith(there), toCloudState(stateWith(here))).profiles[0]!;
    expect(off.name).toBe("Kaia");
    expect(off.settings.unlockAll).toBe(false);
  });

  it("survives garbage from the cloud", () => {
    const local = stateWith(createProfile("Kai", 5, { character: 0, colour: "#000" }));
    expect(mergeStates(local, null).profiles).toHaveLength(1);
    expect(mergeStates(local, { profiles: "nope" }).profiles).toHaveLength(1);
  });
});

describe("family codes", () => {
  it("generates readable, valid codes", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateFamilyCode();
      expect(code).toMatch(/^[a-z]+-[a-z]+-[a-z]+-[a-z]+-\d{6}$/);
      expect(isValidFamilyCode(code)).toBe(true);
    }
    expect(new Set(Array.from({ length: 50 }, generateFamilyCode)).size).toBe(50);
  });

  it("normalises spacing and case", () => {
    expect(normaliseFamilyCode("  Kiwi Fern  RIVER mist 123456 ")).toBe("kiwi-fern-river-mist-123456");
    expect(isValidFamilyCode("kiwi-fern")).toBe(false);
  });
});
