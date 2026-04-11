@AGENTS.md

# Kinstellation

Kinstellation (Constellation Kinship) is a kinship-based oral history platform built for Aboriginal and Torres Strait Islander communities. People are stars, families are constellations, and time is measured in Indigenous seasons — not the Gregorian calendar.

## Three structural pillars

These are not separate features. They are the same system viewed from different angles.

1. **Kinship structure** — Region selector loads the appropriate moiety/section/subsection/clan-totem model. The sky canvas is divided into two moiety halves (warm amber vs cool blue).
2. **Stories** — Multimedia oral histories attached to person nodes (stars). Stars grow brighter and larger as stories are added; dim stars have no stories yet. The Milky Way band across the canvas is the "river of stories."
3. **Seasonal calendar** — All stories are tagged to Indigenous seasons, not months. The canvas ambient color shifts with the current season. Five calendar systems are supported: Noongar, Yolngu, D'harawal, Torres Strait, and a generic fallback.

## Key design principles

- **Solar systems = people.** Each person is a sun with orbiting planets representing their attributes (skin name, birth, stories, media). Sun brightness and size scale with story count AND connection count. Unstudied stars fade (decay mechanic based on `lastUpdated`).
- **Galaxies = families.** Connected solar systems form a galaxy. Relationship lines are organic and non-hierarchical, not Western top-down trees. Line style encodes relationship type (solid = direct, dashed = classificatory, dotted red = avoidance).
- **Moieties = sky regions.** Canvas is split into two halves reflecting the moiety system. D3 force simulation pushes nodes toward their moiety's region.
- **Milky Way = river of stories.** A luminous diagonal band across the canvas. Clicking it opens the Stories River panel showing all stories.
- **Dark constellations (negative space).** Empty areas represent missing knowledge. Solar systems with no stories or connections show dashed orbit rings — knowledge waiting to be discovered. Essential sensitivity for Stolen Generations families.
- **Zoom-reveal detail.** Zooming in (≥1.3x) reveals planet labels (skin name, story titles, media count, connection count). Zooming out hides them for a clean overview. Scroll wheel zooms, drag pans.
- **Season picker, not date picker.** Story creation uses a season-based temporal input. Users can select "unsure" and assign later.
- **Season wheel filter.** A circular season wheel in the bottom-left corner lets users filter the canvas by season — non-matching solar systems dim.
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
  page.tsx                    — Renders LandingPage (hero + feature sections + CTA)
  onboarding/page.tsx         — 4-step wizard: name → country → mob → skin name → /canvas
  canvas/page.tsx             — Main sky canvas
  login/page.tsx              — Magic link OTP + Google OAuth login; passes ?next= to callback
  auth/callback/route.ts      — Exchanges Supabase auth code, redirects to ?next= (defaults /)
  api/
    analyze-story/route.ts    — AI story impact scoring (1–10)
    invite/create/route.ts    — POST: creates invitation row, returns token (7-day expiry)
    invite/accept/route.ts    — POST: validates token, creates user_connections row
  invite/[token]/page.tsx     — Invite landing page; unauthenticated → login CTA, authenticated → connect

proxy.ts (middleware)         — Route protection: /canvas + /onboarding require auth; redirects to
                                /login?next=<path>. /invite/* allowed unauthenticated. Auth users
                                visiting /login are redirected to /canvas.

lib/
  types.ts            — All TypeScript types (Person has isGuest?: boolean for connected users)
  data/               — Seasonal calendars, kinship templates, region configs (static JSON)
  store/AppContext.tsx — React Context + useReducer; syncs to Supabase (persons, stories, relationships);
                         auto-creates self-person for new users from auth metadata;
                         loads guest stars from user_connections table; signOut clears localStorage
  utils/season.ts     — Season detection, star radius/opacity calculations
  supabase.ts         — Supabase client (browser)
  supabase-server.ts  — Supabase client (server/SSR)

supabase/
  migrations/001_invitations_and_connections.sql — invitations + user_connections tables

components/
  canvas/             — SkyCanvas (zoom/pan/D3 force + invite overlay in bottom toolbar),
                        SolarSystemNode (sun + orbit planets; isGuest dims to 55% opacity),
                        ConstellationLine, MilkyWay, MoietyRegions, SeasonalAmbient,
                        SeasonIndicator, SeasonWheel, StarFieldBg, GalaxyShapes
  panels/             — PersonPanel (collapsible sections, inline quick-story form;
                        isSelf prop shows invite link UI),
                        QuickAddModal, StoryPanel, AddConnectionPanel,
                        StoriesRiverPanel, TimelinePanel
  onboarding/         — RegionSelector (single dropdown, simplified)
  ui/                 — SeasonPicker, StoryPopup, WordTooltip
```

## Auth & data flow

- **Login**: `/login` → Supabase `signInWithOtp` (magic link) or `signInWithOAuth` (Google). Both pass `?next=` to the callback so users land on `/canvas`.
- **Session**: `proxy.ts` (Next.js middleware) calls `supabase.auth.getUser()` on every request to refresh the session cookie and enforce route protection.
- **Self-person**: On first load, `AppContext` auto-creates a `Person` row in Supabase using the auth user's display name / email. The person ID is stored in `localStorage` as `kinstellation_self_id`. On subsequent loads the ID is read from localStorage; for existing users without the key, `AppContext` matches by display name and sets it.
- **Guest stars**: Connected users' stars are loaded from the `user_connections` table and rendered with `isGuest: true` (55% opacity, no edit controls).
- **Invite system**: Bottom-right toolbar link icon → `/api/invite/create` (POST) → returns a 7-day token → invite URL displayed. Recipient visits `/invite/[token]`, logs in if needed, then `/api/invite/accept` creates a `user_connections` row linking both users' self-persons.

## Data model

- **Person** — id, displayName, indigenousName, skinName, moiety, stories[], visibility, lastUpdated, position (x/y), isGuest?
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

The middleware in `proxy.ts` normally protects `/canvas` and `/onboarding` — unauthenticated users are redirected to `/login`. Setting `DEV_SKIP_AUTH=true` in `.env.local` short-circuits this check so all routes are open. This is the default teammate mode for UI development.

**With bypass ON (`DEV_SKIP_AUTH=true`):**
- All pages accessible without login
- Canvas, onboarding, all visual/UI features work
- SeasonWheel loads from localStorage if a region was previously selected
- Adding persons, stories, relationships works (data stored locally / in Supabase if you happen to be logged in)

**With bypass OFF (`DEV_SKIP_AUTH=false` or key removed):**
- `/canvas` and `/onboarding` require a real Supabase session
- Unauthenticated users are redirected to `/login?next=<path>`
- Invite link generation, guest star loading, and data persistence to Supabase all require this mode

### Testing the full auth flow (landing → sign up → onboarding → canvas)

Only do this when you need to test auth specifically. Normal UI work should use the bypass.

1. Set `DEV_SKIP_AUTH=false` in `.env.local` (or comment the line out)
2. Open a **private/incognito browser window** — this avoids stale session cookies from previous test runs. (If you use your normal window and have a valid session, visiting `/login` will immediately redirect you to `/canvas`, skipping the login form entirely.)
3. Visit `http://localhost:3000`
4. Scroll to the bottom CTA → click **"Weave your constellation"** → middleware redirects you to `/login?next=%2Fonboarding`
5. Enter your email → "Send sign-in link"
6. Check your inbox → click the magic link → lands on `/onboarding`
7. Complete the 4 steps (name → country → mob → skin name) → **"Enter the sky →"** → `/canvas`
8. When done testing, re-enable `DEV_SKIP_AUTH=true` so teammates are not blocked.

To clear an existing session without incognito: DevTools → Application → Cookies → delete all `sb-*` cookies for `localhost:3000`.

### Supabase project
- Project URL: `https://cgkwxvjvocvcjtvucjcj.supabase.co`
- Auth → Settings: **"Skip nonce checks"** is ON (permissive, for dev). Turn it OFF before production.
- Auth → URL Configuration: `http://localhost:3000/**` must be in Additional Redirect URLs for magic links to work on localhost.
- Google OAuth callback URL registered in Google Cloud Console: `https://cgkwxvjvocvcjtvucjcj.supabase.co/auth/v1/callback`
- Database migration (`supabase/migrations/001_invitations_and_connections.sql`) has **not yet been run** — invite/connection features require this to be applied in the Supabase SQL Editor before they will work.

### Before submitting to judges / deploying
- Remove `DEV_SKIP_AUTH` from `.env.local` entirely (or set to `false`)
- Turn OFF "Skip nonce checks" in Supabase Auth settings
- Run the database migration in Supabase SQL Editor

### Styling
- Miguel's `96ccf10` "UI Polish" commit was cherry-picked onto `main`. His styling takes priority for aesthetics (larger purple/gold toolbar buttons, new SeasonWheel, StarFieldBg). Functional additions (invite overlay, auth) were merged on top.
- Bottom-right toolbar is a vertical stack: Story timeline → Invite someone → Add a star.
