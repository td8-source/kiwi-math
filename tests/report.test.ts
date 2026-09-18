/**
 * Bug reports must be safe to paste into a public issue: plenty of context about the
 * app, nothing that identifies a child or a parent.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createProfile, defaultState, type AppState } from "../src/app/state";
import { collectDiagnostics, noteError, noteScreen, resetDiagnostics, screenLabel } from "../src/app/diagnostics";
import { buildReport, issueUrl, reportBody, submitReport, SUMMARY_MAX } from "../src/app/report";

const sendReport = vi.fn(async (_row: Record<string, unknown>) => ({ ok: true as const, value: undefined }));
vi.mock("../src/app/cloud", () => ({
  cloudConfigured: () => true,
  sendReport: (row: Record<string, unknown>) => sendReport(row),
}));

const SECRETS = ["Aroha", "parent@example.com", "kiwi-fern-river-mist-123456"];

function stateWithSecrets(): AppState {
  const s = defaultState();
  const p = createProfile("Aroha", 7, { character: 0, colour: "#000" });
  p.feathers = 42;
  s.profiles = [p, createProfile("Tama", 5, { character: 1, colour: "#000" })];
  s.currentProfileId = p.id;
  s.parentPin = "1234";
  s.sync = { mode: "family", familyCode: "kiwi-fern-river-mist-123456", email: "parent@example.com" };
  return s;
}

beforeEach(() => {
  resetDiagnostics();
  sendReport.mockClear();
  localStorage.clear();
});

describe("what a report carries", () => {
  it("never carries names, emails, family codes, PINs or progress", () => {
    const state = stateWithSecrets();
    const report = buildReport(state, { name: "play", regionId: "r1", trailId: "y1-count", tier: 2 }, "Stars did not save", "It happened twice");
    const text = `${JSON.stringify(report.diagnostics)}\n${reportBody(report)}\n${issueUrl(report)}`;
    for (const secret of [...SECRETS, "1234", state.currentProfileId!]) expect(text).not.toContain(secret);
    expect(text).toContain("family"); // the sync mode is useful, the code is not
  });

  it("says which screen the problem happened on and how the child got there", () => {
    const state = stateWithSecrets();
    noteScreen({ name: "profiles" });
    noteScreen({ name: "map" });
    noteScreen({ name: "region", regionId: "r1" });
    const report = buildReport(state, { name: "play", regionId: "r1", trailId: "y1-count", tier: 2 }, "Stuck", "");
    const body = reportBody(report);
    expect(report.diagnostics.screen).toBe("play:r1/y1-count/tier2");
    expect(report.diagnostics.recentScreens).toHaveLength(3);
    expect(body).toContain("region:r1");
    expect(body).toContain("age 7");
    expect(body).toContain("Explorers on the device: 2");
  });

  it("carries the errors the app caught, with their stacks", () => {
    noteError("error", "Cannot read properties of null", "index-abc.js:12:5", "at renderPlay (index-abc.js:12:5)");
    const report = buildReport(defaultState(), { name: "map" }, "It went white", "");
    expect(report.diagnostics.errors).toHaveLength(1);
    expect(reportBody(report)).toContain("Cannot read properties of null");
    expect(reportBody(report)).toContain("at renderPlay");
  });

  it("keeps the last few errors and screens, not the whole session", () => {
    for (let i = 0; i < 30; i++) {
      noteScreen({ name: "region", regionId: `r${i}` });
      noteError("promise", `boom ${i}`);
    }
    const d = collectDiagnostics(defaultState(), { name: "map" });
    expect(d.recentScreens.length).toBeLessThanOrEqual(12);
    expect(d.errors.length).toBeLessThanOrEqual(5);
    expect(d.errors.at(-1)?.message).toBe("boom 29");
  });

  it("labels rescues and plain screens too", () => {
    expect(screenLabel({ name: "play", regionId: "r2", trailId: null, tier: 0 })).toBe("play:r2/rescue/tier0");
    expect(screenLabel({ name: "parent" })).toBe("parent");
  });
});

describe("sending a report", () => {
  it("sends the summary, the description and the rendered issue body", async () => {
    const report = buildReport(defaultState(), { name: "map" }, "  The  map   froze ", "Tapped the kea");
    expect(await submitReport(report)).toEqual({ ok: true });
    const row = sendReport.mock.calls[0]?.[0] as Record<string, string>;
    expect(row.summary).toBe("The map froze");
    expect(row.details).toBe("Tapped the kea");
    expect(row.body).toContain("### What happened");
  });

  it("refuses an empty report", async () => {
    const r = await submitReport(buildReport(defaultState(), { name: "map" }, "   ", "only details"));
    expect(r.ok).toBe(false);
    expect(sendReport).not.toHaveBeenCalled();
  });

  it("allows one report a minute, so a stuck button cannot flood the table", async () => {
    const report = buildReport(defaultState(), { name: "map" }, "One", "");
    expect(await submitReport(report, 1_000_000)).toEqual({ ok: true });
    const second = await submitReport(buildReport(defaultState(), { name: "map" }, "Two", ""), 1_030_000);
    expect(second).toEqual({ ok: false, error: expect.stringContaining("wait a minute") });
    expect(await submitReport(buildReport(defaultState(), { name: "map" }, "Three", ""), 1_070_000)).toEqual({ ok: true });
    expect(sendReport).toHaveBeenCalledTimes(2);
  });

  it("trims a very long summary instead of failing", () => {
    const report = buildReport(defaultState(), { name: "map" }, "x".repeat(400), "");
    expect(report.summary).toHaveLength(SUMMARY_MAX);
  });

  it("builds a prefilled GitHub issue link as the fallback", () => {
    const report = buildReport(defaultState(), { name: "map" }, "The map froze", "Tapped the kea");
    const url = new URL(issueUrl(report));
    expect(url.origin + url.pathname).toBe("https://github.com/td8-source/kiwi-math/issues/new");
    expect(url.searchParams.get("title")).toBe("The map froze");
    expect(url.searchParams.get("labels")).toBe("bug,from-app");
    expect(url.searchParams.get("body")).toContain("Tapped the kea");
  });
});
