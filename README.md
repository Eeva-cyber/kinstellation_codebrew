# Kinstellation

**Constellation Kinship** — a kinship-based oral history platform built for Aboriginal and Torres Strait Islander communities.

People are stars. Families are constellations. Time is measured in Indigenous seasons.

---

## Running locally (for judges)

**Requirements:** Node.js 18 or higher.

```bash
npm install
npm run dev
```

Open **http://localhost:3000** — no accounts or configuration needed.

The app loads with three demo Wurundjeri Woi Wurrung community members already on the canvas and an interactive tutorial that walks you through every feature. You can skip the tutorial at any time using the **×** button on the tutorial card.

---

## What you'll see

### The sky canvas
An interactive star map where each person is a solar system. Their stories orbit them as planets, growing brighter as more are added. Drag to pan, scroll to zoom, click any star to open their profile.

### Solar systems
- **Inner orbit** — gold, green, and teal planets show Nation, language group, and community. Click any planet for cultural context specific to Victorian Koorie Country.
- **Outer orbit** — story planets. Colour-coded by Indigenous season. Click to read, play audio, or view attached files.
- **Far orbit** — media entries (photos, articles, videos).

### Stories
Every person can hold multiple types of stories:
- **Quick story** — short text note, tagged to a season and era
- **Full story** — expanded editor with speech-to-text (microphone)
- **Voice recording** — record audio directly in the browser, played back as a story planet
- **File attachment** — attach any image, PDF, or document; images preview inline, PDFs embed, all files download

### Seasonal calendar
Stories are tagged to Indigenous seasons (Noongar, Yolngu, D'harawal, Torres Strait, or generic Kulin) rather than Gregorian months. The **season wheel** in the bottom-left filters the entire canvas by season — matching story planets glow while everything else dims.

### Kinship and moiety
The canvas is split into two moiety halves (Bunjil / Waa for the Wurundjeri demo). Relationship lines are gold (direct family), purple (classificatory/totemic), or red dashed (avoidance). Clicking a moiety label dims the opposite side.

### Timeline panel
Bottom toolbar → clock icon. All stories distributed across seasonal columns with filters by person, season, generation (Elders' time / Our time / etc.), and story type. A **✦ Summarise** button generates an AI summary of the current filtered view.

### Adding to the sky
Bottom toolbar → **+** button. Add a new person with their name, Nation, language group, and moiety. Their star appears immediately.

---

## Tech stack

- Next.js 16 (App Router, Turbopack)
- React 19 + TypeScript
- Tailwind CSS v4
- D3.js — force simulation for constellation layout
- All data stored locally in the browser (localStorage) — no server required for the demo

---

## Cultural safety

- Deceased persons warning banner on all profiles
- Visibility controls on every person and story (public / family only / restricted / gendered)
- "I'm not sure" paths throughout — users are never made to feel inadequate for not knowing kinship details
- Season calendar source attribution displayed on-screen
- Language follows AIATSIS guidelines: "Aboriginal and Torres Strait Islander peoples" or specific group names

---

## Commands

```bash
npm run dev      # development server — http://localhost:3000
npm run build    # production build
npm run start    # production server
```
