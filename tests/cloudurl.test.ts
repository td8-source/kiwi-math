import { describe, expect, it } from "vitest";

// Mirrors projectUrl() in src/app/cloud.ts, which is private to that module.
const projectUrl = (raw: string | undefined): string => (raw ?? "").trim().replace(/\/(rest|auth|storage|realtime|functions)\/v1\/?$/, "").replace(/\/+$/, "");

describe("project URL normalisation", () => {
  it("strips pasted API paths and trailing slashes", () => {
    expect(projectUrl("https://xtzwfetogrgtltwjfhkp.supabase.co/rest/v1/")).toBe("https://xtzwfetogrgtltwjfhkp.supabase.co");
    expect(projectUrl("https://ref.supabase.co/auth/v1")).toBe("https://ref.supabase.co");
    expect(projectUrl(" https://ref.supabase.co/ ")).toBe("https://ref.supabase.co");
    expect(projectUrl(undefined)).toBe("");
  });
});
