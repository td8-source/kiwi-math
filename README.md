# Nature Maths

An Aotearoa nature quest that teaches maths to children aged 5 to 8, built as a native macOS app that also runs in any browser. The content covers **all six strands** of the New Zealand Curriculum (*Te Mātaiaho: Mathematics and Statistics*) for Years 1 to 4: Number, Algebra, Measurement, Geometry, Statistics and Probability.

Explorers travel through four regions, one per year level: Golden Beach (Te Tāhuna), Kauri Forest (Te Wao Nui), the Southern Alps (Kā Tiritiri o te Moana) and the Starry Skies (Te Rangi Whetū). Each region has ten trails (topics) with Bronze, Silver and Gold rounds that get progressively harder, and ends with a creature rescue: a mixed challenge that frees a native animal (kororā, kiwi, kea, kākāpō) and opens the next region. Correct answers earn feathers to spend in the backpack on hats, gear and trail buddies.

## Features

- **Four regions, 40 trails, 120 graded rounds** plus four rescue challenges, all generated from parameterised templates so no two rounds are the same. See [docs/curriculum-map.md](docs/curriculum-map.md) for the full mapping to curriculum outcomes by strand.
- **Hands-on visuals for every strand**: countable objects, dice and ten-frames, place-value blocks, number lines, hundred charts, arrays and fraction shapes; analogue clocks, NZ coins, rulers, balances, containers, thermometers, calendars and area grids; 2D and 3D shapes, symmetry lines, grid maps, coordinates, angles, turns and transformations; pictographs, tally charts, bar graphs, spinners and berry bags.
- **Voice narration**: every question can be read aloud using the Mac's built-in voices (or the browser's), with a speaker button to hear it again. Hints, answers and praise are spoken too. Can be switched off per child.
- **Te reo Māori**: numbers to 100 appear in te reo under the numerals, regions and trails carry te reo names, and praise mixes in "Ka pai!" and "Tino pai!". A one-tap toggle in the header turns it on or off.
- **Gentle scaffolding**: a wrong answer shows a hint and gives a second try; a second miss reveals the answer with an explanation. Stars and unlocks are based on first-try accuracy.
- **Multiple child profiles** on one Mac, each with their own explorer, progress, feathers and gear. A child's age picks their starting region.
- **Daily play timer**: parents set a per-child limit (off, or 10 to 60 minutes). When it is reached, Ruru the morepork shows a friendly "time to rest" screen. Parents can grant 10 bonus minutes from the dashboard.
- **PIN-protected parent and teacher dashboard** with accuracy by skill and by strand, curriculum-aligned progress tables, recent sessions, "needs practice" highlights, manual region unlocks, resets and settings.
- **Offline, private, no accounts.** Progress is stored locally in the app's data folder (or `localStorage` in the browser).

## Building the macOS app

The app is a [Tauri 2](https://tauri.app) shell around a TypeScript web UI.

Prerequisites on the Mac:

1. Xcode Command Line Tools: `xcode-select --install`
2. [Rust](https://rustup.rs): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
3. Node.js 22 or newer.

Then:

```bash
npm install
npm run app:dev     # run the app with live reload
npm run app:build   # produce Nature Maths.app and a .dmg
```

Bundles are written to `src-tauri/target/release/bundle/macos/` and `src-tauri/target/release/bundle/dmg/`.

The GitHub Actions workflow in `.github/workflows/build.yml` also builds a universal (Apple Silicon and Intel) `.dmg` on every push and attaches it to the run as an artifact, so you can download a build without setting up the toolchain. The app is unsigned, so the first launch needs a right-click, Open.

## Running in a browser

```bash
npm install
npm run dev           # http://localhost:1420
```

`.github/workflows/deploy-pages.yml` publishes the browser version to GitHub Pages on every push to `main`. Enable Pages with Source set to GitHub Actions in the repository settings if it is not already.

## Cloud sync: continue on other devices

By default progress stays on the device. Optional cloud sync lets a family continue on any device or browser. It uses a free [Supabase](https://supabase.com) project that you own, so the data is yours.

Two ways to link devices, chosen in the parent area under **Cloud**:

- **Parent account**: email and password, with password reset by email. Children never need a login; one parent account holds every explorer profile. Recommended.
- **Family code**: no email needed. The app generates a secret like `kiwi-fern-river-mist-123456`; enter it on another device to link them. Anyone with the code can see and change the progress, and a lost code cannot be recovered, so treat it like a password.

Sync is offline-first. Saves stay local and are merged with the cloud copy on start-up, after each round, and when you press Sync now. Stars, best scores, feathers and gear are combined so nothing earned is lost when two devices disagree; other settings take the newer copy.

### Setting it up (about 10 minutes, once)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the project's **SQL Editor**, paste and run `supabase/schema.sql`. This creates the tables, row-level security and the two family-code functions.
3. Optional: under **Authentication → Providers → Email**, turn off "Confirm email" if you would rather parents can sign in immediately without a confirmation link.
4. Under **Project Settings → API**, copy the **Project URL** and the **anon public** key. The anon key is meant to be public; row-level security protects each account's data.
5. Put both values in the committed `.env` file as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Every build (local, GitHub Pages and the macOS app) reads them from there. To point a CI build at a different project without editing the file, set repository **Variables** named `SUPABASE_URL` and `SUPABASE_ANON_KEY`, which take precedence.
6. For a private local override, copy `.env.example` to `.env.local`; that file is ignored by git.

The publishable (anon) key is safe to commit: it is embedded in the browser build anyway, and row-level security decides what it can read. Never commit the service-role key. Builds without any values still work; the Cloud tab just explains that sync is not set up.

What is stored in the cloud: each explorer's first name, age, avatar, settings and progress, plus the parent PIN so it applies on every device. Nothing else.

## Development

```bash
npm test              # generator, progression, timer and migration tests
npm run typecheck
npm run build && npm run screenshots   # headless walkthrough, images in ./screenshots

# Multi-device cloud sync check against a mocked Supabase (no project needed):
VITE_SUPABASE_URL=https://mock.supabase.co VITE_SUPABASE_ANON_KEY=mock-anon-key-0123456789abcdef npm run build
npm run cloud:check
```

## Project layout

```
src/curriculum/     question generators per region, curriculum metadata, scoring rules
src/app/            state model, persistence, progression, daily timer, speech, shop, sound
src/screens/        profile picker, map, region, play, backpack, parent dashboard, time-up
src/ui/             HTML helper, SVG art (creatures, explorers, regions, shapes), visual renderer
src/styles/         stylesheet
src-tauri/          Rust shell, Tauri config, icons
tests/              vitest suites
scripts/            Playwright screenshot walkthrough
docs/               generated curriculum map
```

## Licence

MIT
