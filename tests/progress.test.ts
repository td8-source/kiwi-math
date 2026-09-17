import { describe, expect, it } from "vitest";
import { REGIONS } from "../src/curriculum";
import { cleanName, createProfile, migrate, defaultState } from "../src/app/state";
import { trailUnlocked, regionUnlocked, recordRound, tierUnlocked, rescueUnlocked, rescuePassed, totalStars, rescuedCreatures, unlockAllOn, type AnswerRecord } from "../src/app/progress";
import { addPlayTime, allowedTodayMs, dayKey, grantBonusMinutes, playedTodayMs, remainingTodayMs, timeIsUp } from "../src/app/timer";

const answers = (correct: number, total = 10): AnswerRecord[] =>
  Array.from({ length: total }, (_, i) => ({ skill: "Y1.N.count10", firstTry: i < correct, correctEventually: true }));

describe("progression", () => {
  it("starts a 5 year old on region 1 with only the first trail open", () => {
    const p = createProfile("Kai", 5, { character: 0, colour: "#000" });
    const region = REGIONS[0]!;
    expect(regionUnlocked(p, 0)).toBe(true);
    expect(regionUnlocked(p, 1)).toBe(false);
    expect(trailUnlocked(p, region, 0)).toBe(true);
    expect(trailUnlocked(p, region, 1)).toBe(false);
    expect(tierUnlocked(p, region.trails[0]!.id, 2)).toBe(false);
  });

  it("starts an 8 year old with all regions open", () => {
    expect(regionUnlocked(createProfile("Mia", 8, { character: 1, colour: "#000" }), 3)).toBe(true);
  });

  it("passing bronze unlocks silver and the next trail, and logs play time", () => {
    const p = createProfile("Kai", 5, { character: 0, colour: "#000" });
    const region = REGIONS[0]!;
    const trail = region.trails[0]!;
    const out = recordRound(p, { region, trailId: trail.id, tier: 1, answers: answers(7), durationMs: 60_000 });
    expect(out.stars).toBe(1);
    expect(out.unlocked).toContain("Silver tier unlocked!");
    expect(out.unlocked).toContain(`${region.trails[1]!.name} is open!`);
    expect(tierUnlocked(p, trail.id, 2)).toBe(true);
    expect(p.feathers).toBeGreaterThan(0);
    expect(p.stats.skills["Y1.N.count10"]?.correct).toBe(7);
    expect(playedTodayMs(p)).toBe(60_000);
  });

  it("failing unlocks nothing but records the attempt", () => {
    const p = createProfile("Kai", 5, { character: 0, colour: "#000" });
    const region = REGIONS[0]!;
    const out = recordRound(p, { region, trailId: region.trails[0]!.id, tier: 1, answers: answers(4), durationMs: 1000 });
    expect(out.stars).toBe(0);
    expect(out.unlocked).toEqual([]);
    expect(p.progress[region.trails[0]!.id]?.tiers[1]?.attempts).toBe(1);
  });

  it("never lowers an earned star rating", () => {
    const p = createProfile("Kai", 5, { character: 0, colour: "#000" });
    const region = REGIONS[0]!;
    const id = region.trails[0]!.id;
    recordRound(p, { region, trailId: id, tier: 1, answers: answers(10), durationMs: 1 });
    recordRound(p, { region, trailId: id, tier: 1, answers: answers(7), durationMs: 1 });
    expect(p.progress[id]?.tiers[1]?.stars).toBe(3);
    expect(p.progress[id]?.tiers[1]?.attempts).toBe(2);
  });

  it("rescue opens after every bronze; passing it rescues the creature and opens the next region", () => {
    const p = createProfile("Kai", 5, { character: 0, colour: "#000" });
    const region = REGIONS[0]!;
    for (const trail of region.trails) {
      expect(rescueUnlocked(p, region)).toBe(false);
      recordRound(p, { region, trailId: trail.id, tier: 1, answers: answers(8), durationMs: 1 });
    }
    expect(rescueUnlocked(p, region)).toBe(true);
    const out = recordRound(p, { region, trailId: null, tier: 0, answers: answers(10, 12), durationMs: 1 });
    expect(out.stars).toBe(2);
    expect(out.rescued?.creature).toBe("penguin");
    expect(out.unlocked).toContain(`You can travel to ${REGIONS[1]!.name}!`);
    expect(regionUnlocked(p, 1)).toBe(true);
    expect(rescuedCreatures(p).map((r) => r.creature)).toEqual(["penguin"]);
    expect(totalStars(p)).toBe(region.trails.length * 2 + 2);
  });

  it("parents can unlock regions ahead of progress", () => {
    const p = createProfile("Kai", 5, { character: 0, colour: "#000" });
    p.parentUnlockedRegion = 2;
    expect(regionUnlocked(p, 2)).toBe(true);
    expect(regionUnlocked(p, 3)).toBe(false);
  });
});

describe("unlock everything (parent testing override)", () => {
  const tester = (): ReturnType<typeof createProfile> => {
    const p = createProfile("Beta", 5, { character: 0, colour: "#000" });
    p.settings.unlockAll = true;
    return p;
  };

  it("is off for a new explorer", () => {
    expect(unlockAllOn(createProfile("Kai", 5, { character: 0, colour: "#000" }))).toBe(false);
  });

  it("opens every region, trail, tier and rescue at once", () => {
    const p = tester();
    for (const region of REGIONS) {
      expect(regionUnlocked(p, region.index)).toBe(true);
      expect(rescueUnlocked(p, region)).toBe(true);
      region.trails.forEach((trail, i) => {
        expect(trailUnlocked(p, region, i)).toBe(true);
        for (const tier of [1, 2, 3] as const) expect(tierUnlocked(p, trail.id, tier)).toBe(true);
      });
    }
  });

  it("changes nothing that was earned, so turning it off restores the normal path", () => {
    const p = tester();
    const region = REGIONS[3]!;
    const trail = region.trails[5]!;
    recordRound(p, { region, trailId: trail.id, tier: 3, answers: answers(10), durationMs: 30_000 });

    expect(totalStars(p)).toBe(3);
    expect(p.feathers).toBeGreaterThan(0);
    expect(p.stats.questionsAnswered).toBe(10);
    expect(rescuePassed(p, REGIONS[0]!)).toBe(false);
    expect(rescuedCreatures(p)).toEqual([]);

    p.settings.unlockAll = false;
    expect(regionUnlocked(p, 3)).toBe(false);
    expect(trailUnlocked(p, region, 5)).toBe(false);
    // The gold round played during testing is still on record.
    expect(totalStars(p)).toBe(3);
  });

  it("does not announce unlocks that were already open", () => {
    const p = tester();
    const region = REGIONS[0]!;
    const out = recordRound(p, { region, trailId: region.trails[0]!.id, tier: 1, answers: answers(10), durationMs: 10_000 });
    expect(out.unlocked).toEqual([]);
  });

  it("still frees a creature when the rescue is passed during testing", () => {
    const p = tester();
    const region = REGIONS[2]!;
    const out = recordRound(p, { region, trailId: null, tier: 0, answers: answers(10), durationMs: 20_000 });
    expect(out.rescued).toEqual(region.rescue);
    expect(rescuePassed(p, region)).toBe(true);
  });
});

describe("renaming an explorer", () => {
  it("trims, collapses spaces and caps the length", () => {
    expect(cleanName("  Kai  ")).toBe("Kai");
    expect(cleanName("Te  Ana")).toBe("Te Ana");
    expect(cleanName("Pōhutukawa Explorer")).toBe("Pōhutukawa Explo");
    expect(cleanName("   ")).toBe("");
  });

  it("falls back to Explorer only when creating, never hiding an empty rename", () => {
    expect(createProfile("   ", 5, { character: 0, colour: "#000" }).name).toBe("Explorer");
    expect(cleanName("")).toBe("");
  });
});

describe("daily timer", () => {
  it("has no limit by default", () => {
    const p = createProfile("Kai", 5, { character: 0, colour: "#000" });
    expect(allowedTodayMs(p)).toBeNull();
    expect(remainingTodayMs(p)).toBeNull();
    expect(timeIsUp(p)).toBe(false);
  });

  it("enforces the limit and parent bonus minutes", () => {
    const p = createProfile("Kai", 5, { character: 0, colour: "#000" });
    p.dailyLimitMin = 10;
    addPlayTime(p, 4 * 60_000);
    expect(remainingTodayMs(p)).toBe(6 * 60_000);
    addPlayTime(p, 7 * 60_000);
    expect(timeIsUp(p)).toBe(true);
    grantBonusMinutes(p, 5);
    expect(timeIsUp(p)).toBe(false);
    expect(remainingTodayMs(p)).toBe(4 * 60_000);
  });

  it("resets each day and prunes old days", () => {
    const p = createProfile("Kai", 5, { character: 0, colour: "#000" });
    p.dailyLimitMin = 5;
    const yesterday = new Date(2026, 0, 1);
    const today = new Date(2026, 0, 2);
    addPlayTime(p, 10 * 60_000, yesterday);
    expect(timeIsUp(p, yesterday)).toBe(true);
    expect(timeIsUp(p, today)).toBe(false);
    for (let d = 3; d < 25; d++) addPlayTime(p, 1000, new Date(2026, 0, d));
    expect(Object.keys(p.playLog).length).toBeLessThanOrEqual(14);
    expect(p.playLog[dayKey(yesterday)]).toBeUndefined();
  });
});

describe("state migration", () => {
  it("returns defaults for garbage input", () => {
    expect(migrate(null)).toEqual(defaultState());
    expect(migrate({ profiles: "bad" }).profiles).toEqual([]);
  });

  it("fills in missing fields on old profiles", () => {
    const s = migrate({ profiles: [{ id: "a", name: "Old", age: 7 }], currentProfileId: "a", parentPin: "12" });
    const p = s.profiles[0]!;
    expect(p.feathers).toBe(0);
    expect(p.parentUnlockedRegion).toBe(2);
    expect(p.settings.teReo).toBe(true);
    expect(p.settings.unlockAll).toBe(false);
    expect(p.dailyLimitMin).toBe(0);
    expect(p.playLog).toEqual({});
    expect(s.parentPin).toBeNull();
  });
});
