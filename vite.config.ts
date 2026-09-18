import { readFileSync } from "node:fs";
import { defineConfig } from "vite";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string };

// Tauri expects a fixed port and no HMR overlay stealing focus from the game.
// When built for GitHub Pages the app is served from a subpath
// (https://<user>.github.io/<repo>/), so assets need that prefix baked in.
// Locally and in the Tauri build it stays "/".
const base = process.env.GH_PAGES === "true" ? "/kiwi-math/" : "/";

// CI passes the Supabase settings through env; when they are unset there they arrive as
// empty strings, which must not shadow values from a local .env file.
for (const key of ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"]) {
  if (process.env[key] === "") delete process.env[key];
}

export default defineConfig({
  base,
  clearScreen: false,
  // Bug reports say which build they came from; GITHUB_SHA is set by CI.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_SHA__: JSON.stringify((process.env.GITHUB_SHA ?? "local").slice(0, 7)),
  },
  server: {
    port: 1420,
    strictPort: true,
    host: "127.0.0.1",
  },
  build: {
    target: ["es2022", "safari15"],
    minify: true,
    sourcemap: false,
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
  },
});
