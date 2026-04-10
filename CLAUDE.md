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
- localStorage for data persistence (no backend for MVP)

## Architecture

```
app/
  page.tsx            — Client redirect: /onboarding (no region) or /canvas (initialized)
  onboarding/page.tsx — Region selector → loads kinship template + seasonal calendar
  canvas/page.tsx     — Main sky canvas

lib/
  types.ts            — All TypeScript types (Person, Relationship, Story with optional year, etc.)
  data/               — Seasonal calendars, kinship templates, region configs (static JSON)
  store/AppContext.tsx — React Context + useReducer, persists to localStorage
  utils/season.ts     — Season detection, star radius/opacity calculations

components/
  canvas/             — SkyCanvas (zoom/pan/D3 force), SolarSystemNode (sun + orbit planets),
                        ConstellationLine, MilkyWay, MoietyRegions, SeasonalAmbient,
                        SeasonIndicator, SeasonWheel, StarFieldBg
  panels/             — PersonPanel (collapsible sections, inline quick-story form),
                        QuickAddModal (2-field centered add), StoryPanel, AddConnectionPanel,
                        StoriesRiverPanel, TimelinePanel (season-column story distribution)
  onboarding/         — RegionSelector
  ui/                 — SeasonPicker
```

## Data model

- **Person** — id, displayName, indigenousName, skinName, moiety, stories[], visibility, lastUpdated, position (x/y)
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
