@AGENTS.md

# Kinstellation

Kinstellation (Constellation Kinship) is a kinship-based oral history platform built for Aboriginal and Torres Strait Islander communities. People are stars, families are constellations, and time is measured in Indigenous seasons — not the Gregorian calendar.

## Three structural pillars

These are not separate features. They are the same system viewed from different angles.

1. **Kinship structure** — Region selector loads the appropriate moiety/section/subsection/clan-totem model. The sky canvas is divided into two moiety halves (warm amber vs cool blue).
2. **Stories** — Multimedia oral histories attached to person nodes (stars). Stars grow brighter and larger as stories are added; dim stars have no stories yet. The Milky Way band across the canvas is the "river of stories."
3. **Seasonal calendar** — All stories are tagged to Indigenous seasons, not months. The canvas ambient color shifts with the current season. Five calendar systems are supported: Noongar, Yolngu, D'harawal, Torres Strait, and a generic fallback.

## Key design principles

- **Solar systems = people.** Each person is a sun with orbiting planets representing their attributes (nation, language group, community, stories, media). Sun brightness and size scale with story count AND connection count. Unstudied stars fade (decay mechanic based on `lastUpdated`). Planets are **static** (no orbital motion) — each slowly rotates on its own axis via SVG `animateTransform` on the specular highlight with a distinct spin duration (8s–14s). Planet labels are positioned radially outward from the star center to prevent overlap; text-anchor switches between `start`/`middle`/`end` based on which quadrant the planet sits in. Clicking an attribute planet (inner orbit: nation/language/community) opens `PlanetInfoPopup` with region-specific cultural context.
- **Galaxies = families.** Connected solar systems form a galaxy. Relationship lines are organic and non-hierarchical, not Western top-down trees. Line style encodes relationship type (solid = direct, dashed = classificatory, dotted red = avoidance).
- **Moieties = sky regions.** Canvas is split into two halves reflecting the moiety system. D3 force simulation pushes nodes toward their moiety's region.
- **Milky Way = river of stories.** A luminous diagonal band across the canvas. Clicking it opens the Stories River panel showing all stories.
- **Dark constellations (negative space).** Empty areas represent missing knowledge. Solar systems with no stories or connections show dashed orbit rings — knowledge waiting to be discovered. Essential sensitivity for Stolen Generations families.
- **Zoom-reveal detail.** Zooming in (≥1.3x) reveals planet labels (skin name, story titles, media count, connection count). Zooming out hides them for a clean overview. Scroll wheel zooms, drag pans.
- **Season picker, not date picker.** Story creation uses season pill buttons (driven from `state.seasonalCalendar.seasons`) — not a dropdown picker. Each pill shows a colour swatch and the season's English name. The "When did this happen?" era selector uses a `<select>` dropdown with six ERA_OPTIONS (Not sure · Country's making · Elders' time · Parents' time · Our time · Time unknown). Both controls appear in StoryPanel, PersonPanel quick-story form, and StoryPopup edit mode.
- **Season wheel filter.** A circular season wheel in the bottom-left corner lets users filter the canvas by season. When active: two-pass rendering — the whole solar system node dims to near-invisible (5–10% opacity), then matching story dots + their connecting dashed lines render in a separate highlight layer at full brightness with glow halos. Stars with no matching stories dim to 5%, stars with matching stories dim to 10% with their relevant dots glowing on top. Constellation lines (ConstellationLine) also dim to near-invisible when season filter is active. Moiety filter still dims non-matching stars via the `dimmed` prop. Info card appears **above** the wheel on hover or when a filter is active — displays season name, English gloss, description, and a clear-filter button. `SeasonIndicator` (old bottom-left tab) is removed.
- **Story-to-sun lines.** Each story planet (outer orbit) has a dashed connecting line back to the central sun. Lines use the story's season color and follow the star when dragged.
- **Speech-to-text.** The story text box in StoryPanel, the quick-story textarea in PersonPanel, and the edit textarea in StoryPopup all have a mic button (Web Speech API). Each mic includes a language toggle (EN·AU / EN·US / EN·GB) shown as a small pill badge. Tap to start, tap again to stop — transcribed text appends to the story content.
- **Voice story recording.** `AudioRecorderModal` (`components/ui/AudioRecorderModal.tsx`) is a full-screen modal for recording a story as audio. It records via the MediaRecorder API, shows a live elapsed timer, lets the user play back the recording before saving, and attaches the audio blob as a `Story` with `type: 'audio'`. Saves with title, season tag, era, and visibility. An `InlineAudioRecorder` sub-component is embedded directly inside StoryPanel's content area for in-panel recording. A microphone/record button in PersonPanel's quick-story form and StoryPanel opens `AudioRecorderModal`. Permissions errors (denied microphone) are surfaced inline.
- **File attachment.** An inline "Attach a file" form in PersonPanel's stories section (below "Record a yarn") follows the same pattern as voice recording. Any file type is supported — images, PDFs, documents. The file is read via `FileReader.readAsDataURL()` and saved as a `Story` with `type: 'file'` and the base64 data URL as `content`. Includes season pill buttons and era dropdown identical to the voice recording flow. Size warning at 5 MB, hard block at 10 MB (localStorage limit). `StoryPopup` renders file stories: image files show an inline preview, PDFs embed in an iframe, all files include a download link. `StoryType` includes `'file'` as a valid value.
- **Story generation picker.** StoryPanel (full story), PersonPanel quick-story form, and StoryPopup (edit mode) all include a "When did this happen?" `<select>` dropdown with six ERA_OPTIONS: Not sure · Country's making · Elders' time · Parents' time · Our time · Time unknown. Selection maps to a representative `year` value stored on the Story, which feeds directly into the Timeline Generation filter.
- **Timeline panel.** A bottom-slide panel shows all stories distributed across seasonal columns.
- **"I'm not sure" path.** Never make users feel inadequate. Onboarding offers a generic fallback for both kinship and seasonal knowledge.

## Tech stack

- Next.js 16.2.3 (App Router, Turbopack)
- React 19.2.4
- TypeScript
- Tailwind CSS v4
- D3.js (force simulation for constellation layout — physics only, React renders SVG)
- Supabase (auth + Postgres database)
- `@supabase/ssr` for server-side auth in middleware

## Architecture

```
app/
  page.tsx                    — Renders SplashScreen (landing page: "Begin your constellation" + "Sign in")
  onboarding/page.tsx         — 5-step Victorian Indigenous profile form (RegionSelector) + account creation overlay at the end
  canvas/page.tsx             — Main sky canvas
  login/page.tsx              — Redirects to / (auth is handled inline by SignInModal)
  auth/callback/route.ts      — Exchanges Supabase auth code, redirects to ?next= (defaults /)
  api/
    analyze-story/route.ts    — AI story impact scoring (1–10)
    summarize-stories/route.ts — AI story summariser; POST {personName, stories[]} → {summary}; uses Claude Haiku; graceful fallback if no API key
    invite/create/route.ts    — POST: creates invitation row, returns token (7-day expiry)
    invite/accept/route.ts    — POST: validates token, creates user_connections row
  invite/[token]/page.tsx     — Invite landing page; unauthenticated → login CTA, authenticated → connect

proxy.ts (middleware)         — Route protection: only /canvas requires auth; /onboarding is open (account
                                creation happens there). Unauthenticated canvas visitors redirect to /.
                                /login redirects to /. /invite/* always allowed. DEV_SKIP_AUTH bypass.

lib/
  types.ts            — All TypeScript types (Person has isGuest?: boolean for connected users)
  data/               — Seasonal calendars, kinship templates, region configs (static JSON)
  data/demo-nodes.ts  — Three demo persons (Elder Thomas/Bunjil, Aunty June/Waa, Young Sarah/Bunjil)
                         + three relationships; all Wurundjeri Woi Wurrung (Victorian Kulin Nation);
                         moiety: 'Bunjil' or 'Waa' (Aboriginal names only, no English gloss); language: Woiwurrung;
                         communities: Healesville, Fitzroy, Melbourne; no skin names (not a Kulin practice);
                         stories grounded in Victorian history (Coranderrk, Birrarung/Yarra River, Naarm/
                         Melbourne, Koorie Heritage Trust, Woiwurrung language revival); season tags use
                         generic calendar (cold_season, harvest_season, rain_season, flower_season, fire_season).
                         Always loaded on cold page load.
  store/AppContext.tsx — React Context + useReducer; localStorage-first persistence;
                         DEMO MODE: on every cold load clears kinstellation_data, forces kinstellation_region
                         to 'wurundjeri' (loads Bunjil/Waa Kulin moiety template + generic seasonal calendar
                         automatically), sets kinstellation_tutorial_pending='true' so tutorial shows every
                         cold load; reseeds from DEMO_PERSONS/DEMO_RELATIONSHIPS; data added during a session
                         persists within that session via auto-save but is wiped on next load;
                         Supabase auth listener for user state; signOut clears all localStorage keys
  utils/season.ts     — Season detection, star radius/opacity calculations
  supabase.ts         — Supabase client (browser)
  supabase-server.ts  — Supabase client (server/SSR)

supabase/
  migrations/001_invitations_and_connections.sql — invitations + user_connections tables

components/
  splash/             — SplashScreen (landing page: galaxy aesthetic, two CTAs)
  auth/               — SignInModal (username+password + Google OAuth + magic link; "Create one" → /onboarding)
                        NOTE: Account creation in AccountCreationOverlay bypasses Supabase auth entirely
                        (no synthetic email); credentials stored in localStorage only as kinstellation_account
                        {username, created}. Supabase signUp/signIn are deferred to backend wiring phase.
  canvas/             — SkyCanvas (zoom/pan/D3 force + tutorial + save prompt + invite overlay;
                        manages `activePlanetInfo` state for PlanetInfoPopup),
                        SolarSystemNode (sun + static orbit planets; inner orbit shows nation/language/community
                        as colour-coded attribute planets — gold=nation, green=language, teal=community;
                        planets have axis-spin only (no orbital rotation); labels positioned radially outward
                        via `radialLabel()` helper with dynamic text-anchor; clicking attribute planets fires
                        `onAttributeClick(AttributeClickInfo)`; isGuest dims to 55% opacity),
                        PlanetInfoPopup (modal popup shown when an attribute planet is clicked; looks up the
                        clicked value in the regions database; shows Victoria/NSW-specific cultural context for
                        nations, language groups, and communities including Koorie/Koori; "View full profile →"
                        opens PersonPanel; exports `AttributeClickInfo` interface),
                        ConstellationLine (gold/purple colour scheme with glow halos),
                        MilkyWay, MoietyRegions, SeasonalAmbient,
                        SeasonIndicator, SeasonWheel, StarFieldBg, GalaxyShapes,
                        TutorialOverlay (11-step cohesive tutorial written at elementary school level;
                        AUDIO GUIDE: before step 0 a prompt screen asks "Would you like a voice guide?"
                        — choosing yes sets audioEnabled=true; each step auto-speaks its script via
                        Web Speech API (window.speechSynthesis); prefers a male en-AU voice, falls back
                        to en-GB then any English; audio script is a plain-English narration per step
                        stored in AUDIO_SCRIPTS[]; mute/unmute button visible on every step card when
                        audio is enabled; speakText() cancels any in-progress utterance before starting;
                        effective step −1 while audio prompt is showing (reported to parent via onStepChange);
                        steps 0–3 use DarkBackdrop (z-[59], rgba(2,1,8,0.68)) — full canvas dim so card
                        "brightens" by contrast; steps 4–10 use SoftBackdrop (rgba(2,1,8,0.38)) so open
                        panels remain visible through the overlay;
                        CARD_POSITION is dynamic: step 3 → bottom-6 left-6 (avoids PersonPanel on right),
                        step 8 → top-4 left-6 (avoids TimelinePanel at bottom), step 9 → top-20 right-6
                        (avoids QuickAddModal centre), otherwise → top-20 left-6;
                        step 0: mouse controls (scroll=zoom, drag=pan, click=open);
                        step 1: welcome (3 Wurundjeri demo people, Aunty June's star pulses/enlarges);
                        step 2: click a star / "Open Aunty June for me" → opens PersonPanel;
                        step 3: (PersonPanel open) dashboard explained — quick story (gold) + full story (purple) icon preview, tabs glow via tutorialHighlightTabs prop;
                        step 4: Bunjil and Waa moiety + relationship lines, moiety filter cleared on exit;
                        step 5: attribute planets (gold=nation/green=language/teal=community) + tap for info, tutorialHighlightPlanets prop on SolarSystemNode;
                        step 6: Season Wheel standalone step — donut-arc SVG diagram, three bullet points explaining filter/clear/colour;
                        step 7: opens Timeline via onOpenTimeline prop, introduces concept, tutorialTimelineGlow;
                        step 8: (Timeline open) explains columns/filters/✦Summarise, tutorialTimelinePanelGlow;
                        step 9: (QuickAddModal open via onOpenAddStar) explains all form fields, tutorialAddStarGlow;
                        step 10: save icon — "Enter the sky ✦" completes tutorial, tutorialSaveGlow;
                        SKIP BUTTON: every card (including the audio prompt) shows a × close button in the top-right of the DotRow that calls onComplete() immediately, stopping speech and dismissing the tutorial without completing all steps;
                        dashboard brightening: filter:brightness(1.22) + gold border tint applied to
                        open panel containers when their relevant tutorialHighlight* prop is true;
                        individual interactive elements (buttons, filter rows) use animate-tutorial-box-glow;
                        SeasonWheel gets z-[61] + animate-tutorial-spotlight at step 6;
                        no skip-on-interaction — all advances are manual via the tutorial card button;
                        props: onOpenPersonById, onOpenTimeline, onOpenAddStar, onClosePanel, onComplete,
                        onStepChange (useCallback in SkyCanvas to prevent infinite loop), advanceRef,
                        activePanel),
                        SavePrompt (upsell for unauthenticated users with data; renders as a toolbar button — permanent, no dismiss — positioned below the Add a star button; tutorialHighlight prop → z-[61] + animate-tutorial-box-glow on button)
  panels/             — PersonPanel (profile/stories/connections/media tabs; stories tab is first-class
                        with quick-story form using season pill buttons + era dropdown + mic button +
                        language toggle (EN·AU/EN·US/EN·GB) and full story list; "✦ Summarise stories"
                        button (gold pill, shown when person has ≥1 story) calls /api/summarize-stories
                        and displays Claude-generated summary in a dismissable gold-bordered card above
                        the story list; connections tab shows invite link for self-star only; profile
                        Save button persists to localStorage + shows "Saved ✓" feedback; no duplicate
                        delete section; inactive tab colour rgba(139,92,246,0.65) purple; close × button
                        purple rgba(139,92,246,0.5) → hover gold rgba(212,164,84,0.75); + Add connection
                        purple → hover gold; tutorialHighlightTabs prop → filter:brightness(1.22) + gold border),
                        QuickAddModal (name + nation searchable dropdown (regions data, scrollable) +
                        language + community searchable dropdowns + moiety; clan removed; all fields blank
                        on open (no pre-fill); × close button; onboarding visual style;
                        tutorialHighlight prop → filter:brightness(1.22) + gold border),
                        StoryPanel (season pill buttons + era `<select>` dropdown + mic button with
                        language toggle EN·AU/EN·US/EN·GB; InlineAudioRecorder sub-component embedded
                        in the content area — record → playback → attach audio blob as Story type:audio),
                        AddConnectionPanel (purple/gold restyle),
                        TimelinePanel (4 filters: person, season, generation, voice; "✦ Summarise N stories"
                        button in header — always visible when stories are displayed, one click calls
                        /api/summarize-stories with the current filtered set; summary renders in a gold-bordered
                        banner between header and filters, dismissable with ×; summary auto-clears when any
                        filter changes; Milky Way click also opens this panel; panel height 58vh;
                        tutorialHighlight prop → filter:brightness(1.22) + gold borderTop on container,
                        animate-tutorial-box-glow on filter row + Summarise button)
  onboarding/         — RegionSelector (5-step Victorian Indigenous profile: name → nation → language
                        group → community → moiety; clan + skin name removed; moiety inferred from
                        nation/community; language group distinct from Nation name (one Nation may hold
                        several languages); pentagonal 5-star constellation progress indicator;
                        AccountCreationOverlay after completion)
  ui/                 — SeasonPicker (used in media entries only; story forms use inline pill buttons instead),
                        StoryPopup (view/edit story — pen icon toggle, mic + language toggle
                        (EN·AU/EN·US/EN·GB) in edit mode, season pill buttons + era `<select>` dropdown in
                        edit mode, single × close, no cultural weight bar),
                        AudioRecorderModal (full-screen modal; MediaRecorder API; live elapsed timer;
                        playback before save; saves Story type:audio with title/season/era/visibility;
                        inline permission error display; opened from PersonPanel quick-story form and
                        StoryPanel record button),
                        WordTooltip
```

## User flow

```
/ (SplashScreen)
  ├── "Begin your constellation" → /onboarding
  │     └── 5-step Victorian Indigenous profile form (RegionSelector)
  │           └── AccountCreationOverlay (username + password — no email, no Supabase call)
  │                 ├── Create account → localStorage kinstellation_account + tutorial_pending → /canvas
  │                 │     └── TutorialOverlay (11-step interactive, clears flag on complete)
  │                 └── "Skip for now" → /canvas (no tutorial)
  └── "Sign in" → SignInModal
        ├── Sign in with credentials → /canvas (no tutorial)
        └── "Create one" → /onboarding
```

## Auth & data flow

- **Account creation**: `/onboarding` → `RegionSelector` 5-step profile → `AccountCreationOverlay` → stores `{ username, pwd: btoa(password), created }` in localStorage (`kinstellation_account`). No Supabase call. "Skip for now" goes directly to `/canvas` with no account saved.
- **Sign in**: `SignInModal` → reads `kinstellation_account` from localStorage, validates username + password locally. No Supabase call. Google OAuth and magic-link are still available as alternatives for users who prefer them.
- **Route protection**: `proxy.ts` middleware no longer guards `/canvas` — all routes are open, matching local dev behaviour. Supabase session is not required to access any page.
- **Self-person**: Created by `RegionSelector.handleFinish()` → saved to localStorage (`kinstellation_profile`, `kinstellation_self_id`). `SkyCanvas` reads these on mount and creates the `Person` node if missing.
- **Tutorial flag**: Set to `'true'` in localStorage (`kinstellation_tutorial_pending`) after successful account creation. `SkyCanvas` reads it on mount; `TutorialOverlay` clears it on completion.
- **Demo data**: `AppContext` seeds `DEMO_PERSONS` + `DEMO_RELATIONSHIPS` only when both `kinstellation_data` and `kinstellation_self_id` are absent (brand-new browser session).
- **Data persistence**: localStorage-first (`kinstellation_data`). No Supabase table reads/writes during frontend prototyping phase.
- **Invite system**: Bottom-right toolbar link icon → `/api/invite/create` (POST) → returns a 7-day token → invite URL displayed. Recipient visits `/invite/[token]`, logs in if needed, then `/api/invite/accept` creates a `user_connections` row linking both users' self-persons.

## localStorage keys

| Key | Purpose |
|-----|---------|
| `kinstellation_data` | Persons + relationships JSON |
| `kinstellation_profile` | Onboarding profile (name, nation, community, moiety, language) |
| `kinstellation_self_id` | UUID of the user's own Person node |
| `kinstellation_region` | Selected region ID |
| `kinstellation_tutorial_pending` | `'true'` while tutorial hasn't been completed |
| `kinstellation_account` | `{ username, pwd: btoa(password), created }` — local-only account record (no Supabase) |

## Onboarding profile fields (RegionSelector)

The 5 steps collect: `name`, `nation` (NationSearch), `language` (LanguageSearch — at step 2, immediately after nation, since language is tied to Country), `community` (CommunitySearch — filtered by nation), `moiety`. Clan and skin name removed. Moiety is inferred from nation/community where documented; free-text fallback otherwise. All data is scoped to Victorian Indigenous communities.

On completion, `saveProfileAndPerson()` creates **anchor stars** on the canvas for the user's nation and community (if provided), placed around the self-star. These serve as starting points for the constellation.

## Data model

- **Person** — id, displayName, indigenousName, skinName, moiety, nation, clan, community, countryLanguageGroup, stories[], mediaEntries[], visibility, lastUpdated, position (x/y), isGuest?
- **Relationship** — fromPersonId, toPersonId, relationshipType (12 types including classificatory), isAvoidance
- **Story** — title, type (text/photo/audio/video), content, seasonTag (required), year (optional), seasonalContext, visibility
- **SeasonalCalendar** — seasons[] each with name, approximateMonths, colorPalette, celestialIndicators
- **KinshipTemplate** — templateType, moietyNames, sectionNames, genderedPrefixes

## Cultural safety

- Deceased persons warning banner
- Visibility controls on every person and story (public / family / restricted / gendered)
- Seasonal calendar source attribution
- Reconnection-sensitive "I'm not sure" paths throughout
- Language: "Aboriginal and Torres Strait Islander peoples" or specific group names

## Commands

- `npm run dev` — Start dev server (Turbopack, http://localhost:3000)
- `npm run build` — Production build
- `npm run start` — Start production server

## Current development status (as of April 2026)

**Phase: Frontend prototyping.** The UI and interactions are being built out first. Backend/database wiring will be done in one pass once the frontend data requirements are stable. Do not over-engineer backend integrations during this phase.

### Local dev setup for teammates

**Step 1 — Get the `.env.local` file from the project lead.** It is gitignored and never committed. It must contain:
```
NEXT_PUBLIC_SUPABASE_URL=https://cgkwxvjvocvcjtvucjcj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<get from project lead>
DEV_SKIP_AUTH=true
```
Place it at the project root (same level as `package.json`).

**Step 2 — Run the dev server:**
```
npm install
npm run dev
```
Visit `http://localhost:3000`. You can access `/canvas` and `/onboarding` directly without logging in.

### What `DEV_SKIP_AUTH=true` does

The middleware in `proxy.ts` normally protects `/canvas` — unauthenticated users are redirected to `/`. Setting `DEV_SKIP_AUTH=true` in `.env.local` short-circuits this check so all routes are open. This is the default teammate mode for UI development.

**With bypass ON (`DEV_SKIP_AUTH=true`):**
- All pages accessible without login
- Canvas, onboarding, all visual/UI features work
- SeasonWheel loads from localStorage if a region was previously selected
- Adding persons, stories, relationships works (data stored in localStorage)

**With bypass OFF (`DEV_SKIP_AUTH=false` or key removed):**
- `/canvas` requires a real Supabase session; unauthenticated visitors are redirected to `/`
- `/onboarding` is open without auth (account creation happens there)
- Invite link generation, and data persistence to Supabase all require this mode

### Testing the full auth flow (landing → sign up → onboarding → canvas)

Only do this when you need to test auth specifically. Normal UI work should use the bypass.

1. Set `DEV_SKIP_AUTH=false` in `.env.local` (or comment the line out)
2. Open a **private/incognito browser window** — avoids stale session cookies.
3. Visit `http://localhost:3000`
4. Click **"Begin your constellation"** → `/onboarding`
5. Complete the 5-step Victorian profile form → account creation overlay appears
6. Enter username + password → "Create account & enter the sky" → `/canvas` with tutorial
7. Complete the tutorial or dismiss it
8. Sign out → returns to `/`
9. Click **"Sign in"** → `SignInModal` → enter credentials → `/canvas` (no tutorial)
10. When done testing, re-enable `DEV_SKIP_AUTH=true`.

To clear an existing session without incognito: DevTools → Application → Cookies → delete all `sb-*` cookies for `localhost:3000`. Also clear localStorage to reset demo data.

### Supabase project
- Project URL: `https://cgkwxvjvocvcjtvucjcj.supabase.co`
- Auth → Settings: **"Email confirmation"** must be **OFF** for `signUp` to return a session immediately (username→synthetic email pattern).
- Auth → Settings: **"Skip nonce checks"** is ON (permissive, for dev). Turn it OFF before production.
- Auth → URL Configuration: `http://localhost:3000/**` must be in Additional Redirect URLs for magic links to work on localhost.
- Google OAuth callback URL registered in Google Cloud Console: `https://cgkwxvjvocvcjtvucjcj.supabase.co/auth/v1/callback`
- Database migration (`supabase/migrations/001_invitations_and_connections.sql`) has **not yet been run** — invite/connection features require this to be applied in the Supabase SQL Editor before they will work.

### Before submitting to judges / deploying
- Remove `DEV_SKIP_AUTH` from `.env.local` entirely (or set to `false`)
- Turn OFF "Skip nonce checks" in Supabase Auth settings
- Run the database migration in Supabase SQL Editor

### Styling
- Purple/gold colour palette throughout: `rgba(88,28,135,*)` purple, `rgba(212,164,84,*)` gold, dark space backgrounds `rgba(4,3,10,*)`.
- Bottom-right toolbar is a vertical stack: Story timeline → Invite someone → Add a star.
- Constellation lines: gold for direct family, purple for classificatory/totemic, red for avoidance — all with soft glow halos.
- AddConnectionPanel has live relationship type swatches previewing the actual line style.
