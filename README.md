# Kinstellation

A kinship-based oral history platform for Aboriginal and Torres Strait Islander communities. People are stars, families are constellations, and time is measured in Indigenous seasons.

## What it is

Kinstellation lets communities map their kinship networks as a living star map. Each person is a solar system — their stories orbit them as planets, growing brighter as more stories are recorded. Families form constellations connected by relationship lines. The sky is divided by moiety. Stories are tagged to Indigenous seasons, not Gregorian months.

Built specifically for Victorian Indigenous communities, with support for Kulin nation moiety systems (Bunjil/Waa), skin names, clan groups, and seasonal calendars (Noongar, Yolngu, D'harawal, Torres Strait, and generic).

## Getting started (dev)

**Prerequisites:** Node.js 18+, a `.env.local` file from the project lead.

```
NEXT_PUBLIC_SUPABASE_URL=https://cgkwxvjvocvcjtvucjcj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<get from project lead>
DEV_SKIP_AUTH=true
```

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). With `DEV_SKIP_AUTH=true`, all pages are accessible without a Supabase account — canvas, onboarding, and all UI features work via localStorage.

## User flow

1. **Landing page** (`/`) — "Begin your constellation" or "Sign in"
2. **Onboarding** (`/onboarding`) — 6-step Victorian Indigenous profile: name → nation → clan → community → skin name → moiety (auto-inferred from nation/clan/community)
3. **Account creation** — username + password overlay at the end of onboarding (creates a Supabase account with synthetic email `username@kinstellation.app`)
4. **Canvas** (`/canvas`) — interactive star map; new users see a 4-step tutorial
5. **Returning users** — sign in via SignInModal on the landing page → canvas directly, no tutorial

## Tech stack

- Next.js 16.2.3 (App Router, Turbopack)
- React 19.2.4 + TypeScript
- Tailwind CSS v4
- D3.js (force simulation for star layout)
- Supabase (auth + Postgres)

## Key features

- **D3 force simulation** — stars repel/attract based on relationships; drag stars to rearrange
- **Zoom-reveal** — zooming in reveals planet labels (skin name, story titles, media count)
- **Moiety canvas split** — two halves reflecting the moiety system; clicking a moiety name dims unrelated stars
- **Season wheel** — filter the canvas by Indigenous season; ambient sky colour shifts with the current season
- **Stories River** — click the Milky Way band to see all stories across the constellation
- **Timeline panel** — stories distributed across seasonal columns
- **Relationship lines** — gold (direct family), purple (classificatory), red (avoidance); all with glow halos
- **Interactive tutorial** — new users guided through adding their first family member
- **Invite system** — share a 7-day link to connect another user's star to yours

## Commands

```bash
npm run dev      # dev server with Turbopack (http://localhost:3000)
npm run build    # production build
npm run start    # production server
```

## Cultural safety

This platform is built with cultural sensitivity in mind:
- Deceased persons warning banner
- Visibility controls on every person and story (public / family / restricted / gendered)
- "I'm not sure" paths throughout — users are never made to feel inadequate
- Seasonal calendar source attribution
- Language follows AIATSIS guidelines
