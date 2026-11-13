# IEEE YESS 2026 — design brief

Status (13 Nov 2026): **hero direction locked: F, "The Cut"** (see `docs/concepts2/`; it replaced the three concepts pitched in section 4). The hero and a first About chamber are built in the production codebase and waiting for approval; the remaining chambers come next. Stack as built: Vite + vanilla TypeScript, raw WebGL, no runtime dependencies so far; static output in `dist/`.

---

## 1. Asset audit (`assets/`, read-only)

| Asset | What it is | Verdict |
|---|---|---|
| `YESS_Logo.svg` (1202×463) | White vector wordmark + tagline, leaf mark is an embedded 1249×603 PNG | Usable. Shown only as `<img>`. Raster leaf limits it to ~2400px rendered. Tagline is legible from ~320px wide. |
| `yess-loading-mark.png` (245×238) | Leaf mark on transparent, ghosted outline | Favicon only, as-is, **temporary**. Too small for a 512px PWA icon or a preloader hero. |
| `fonts/big-shoulders-display…woff2`, `fonts/hanken-grotesk…woff2` | OFL variable fonts | **Thomson and Glasser are not in the repo.** These are the stand-ins named in `CONTENT.md`. Both are OFL, fine for web. See §9. |
| `partners/ieee.png` (1192×348) | White IEEE master brand | Good. White-on-transparent, so it sits on a dark neutral tile. |
| `partners/ieee-kerala-section.png` (216×53) | White | **Low-res.** Max display ≈ 108px wide at 2× without upscaling. Need a larger file. |
| `partners/ieee-link.png` (314×76) | White | **Low-res.** Max ≈ 157px wide at 2×. Need a larger file. |
| `yess25/01–07` (1800px wide) | Audience, group photo, concert, felicitation, lamp lighting | Good. Full-size gallery frames. |
| `yess25/08–11` (705–820px wide) | Two podium speakers, two stage performances | **Small.** Shown at ≤ 410px CSS width (2× safe) as the "small format" tier of the gallery, never stretched. |
| `host/host-campus-1024.webp` (+640) | Mar Baselios main building, cut out on a flat green field | Usable for the venue section at ≤ 512px CSS width at 2×; the flat green backdrop must be masked into the scene, not shown as a rectangle. |
| `venue/` | README only | **Missing.** No venue photos, hall name, address or map. Directions = Google Maps search link from the venue name. |
| `reference/CONTENT.md` | Content sheet | Partly **stale**: it still says "Coming soon" and "Date to be announced". The brief's confirmed facts override it. Links for IEEE / Kerala Section / LINK come from here and match last year's footer. |
| `reference/old-index.html` | Previous build | Content and structure only. All "coming soon" copy retired. |
| `reference/brand-card.png`, `footer-reference.png` | Palette card; footer direction (links left, question + email right, one-line wordmark on a rule, legal row) | Used as direction for the footer structure only. |

Photos 01–11 were taken at NIT Calicut (last year's host). Captions and alt text describe what is visible and do not name people.

---

## 2. References studied (real browser, headless Chrome 1440×900, scrolled and captured)

| Site | What I measured / saw | What I take | What I do differently |
|---|---|---|---|
| **neoleaf.bytetown.agency** | Next 15 + Three, 3 canvases, intro video. Preloader is the wordmark filling with a % counter, then the *same* wordmark scales away into the hero. Sections arrive as rounded dark sheets sliding over light ones. Footer: one-line wordmark sitting on a hairline. | The preloader **hands off** an object instead of fading out. Sheets overlapping on scroll. Footer wordmark on a rule. | Their preloader is a wordmark; ours hands off **light** (the logo is never animated internally). No video dependency. |
| **nextjs.org/conf** | Now serves the 2025 edition (the 2024 basement build is no longer live; I read basement's case page for it). Geist + Geist Mono, sessions as a **two-column ledger** (title / speakers), sponsors as a **ruled tier grid** with mono tier labels. Transitions 150–200ms, almost no decoration. | The ledger. Tier labels as small tabs on ruled cells. Information first. | We have no sessions yet, so the ledger is built as a sealed state that real rows drop into. Much more atmosphere. |
| **basement.studio case page** | IRL + web as one identity; the site, stage and collateral share one object language. | One object language across every section. | — |
| **iventions.com** (live site, plus hontran.dev case study) | Lenis + Three + GSAP. Easing is two curves only: `cubic-bezier(0.165,0.84,0.44,1)` (196 uses) and `cubic-bezier(0.76,0,0.24,1)` (30), durations 0.4 / 0.6 / 0.8 / 1.2s. A spotlight cone is the single motif: it opens the page, wipes sections, lights the footer wordmark. Case study rule: effects go *around* imagery, never through it. | Two curves, four durations, one motif used everywhere. Treat navigation as one timeline. | Their motif is flat and graphic; ours is volumetric and dark. |
| **2025.springio.net** (Awwwards page was blocked to automation; studied the live site) | Dates in a strip pinned to the hero's bottom edge; a ticket drawn as an actual ticket; "sold out" as a designed state; last year's photos as a mosaic with CTA tiles mixed in. | Unavailable states get designed, not hidden. Facts strip on the hero edge. | Tone: theirs is playful paper-craft; ours is the opposite. |
| **Shopify Editions Summer '24** | Black field, one huge word with orbiting objects, then a dense index with a sticky side list. | Density after spectacle is fine if it is ruled and indexed. | No giant single word as hero (rejected last time). |
| **lusion.co**, **activetheory.net**, **unseen.co** | Lusion: `cubic-bezier(0.4,0,0.1,1)` / `(0.35,0,0,1)`, 0.4–0.5s, one persistent canvas behind all DOM. Active Theory: KTX2 textures, a whole room. | A **single persistent canvas** whose state is driven by scroll, so light and smoke carry between sections for free. | No GLB/KTX2 payload. Everything procedural, so the scene costs kilobytes. |
| **Immersive Garden — Aten7 "Toom Archives"** | Colossal curved architecture in haze, tiny scale cues, light through pillars. | Scale comes from haze layers and tiny cues, not detail. | Ours is procedural and must run on a mid-range phone. |
| **Codrops, "The Sleepers" (Jul 2026)** | Fog as a colour trick on materials rather than true volumetrics; a noise-threshold post pass for the intro. | Cheap fog. A threshold wipe for the preloader handoff. | — |
| **yess.ieee-link.org** | Content only: hero facts, highlights, updates, speakers, sponsors, collaborators, about, host, footer. Verified footer URLs: ieee.org, ieeekerala.org, ieee-link.org. Socials exist for YESS'25 accounts. | Section inventory and the three organiser links. | Its socials are last year's handles; they stay `TODO` in `CONFIG` until confirmed for 2026. |

**Not studied directly:** EDOLUS (the Awwwards listing returns 403 to automation and I did not find the live URL). I won't claim anything from it.

---

## 3. Concept and mood

**An appointment that cannot be moved.** The page treats 19 December 2026 the way a film treats a date on a title card: something enormous is already in motion and the page is the last quiet moment before it. Regal, cold, heavy; emerald light used the way fire is used, in one or two places at a time.

Vocabulary (all original): obsidian and forged-metal surfaces, haze in layers, light that arrives before the thing it lights, circuit traces cut into stone like inscriptions, embers, slow push-ins, title cards. No characters, no masks, no film typography.

Tone guardrail: an engineering summit run by IEEE volunteers. Menace comes from scale and patience, never from horror, skulls, glitch or gaming chrome.

---

## 4. Hero pitch — three worlds

Keyframes: `docs/concepts/shots/`. Source: `docs/concepts/*.html` (static frames, no animation).

### A. The Nave — interior
A colossal stone hall in one-point perspective; light falls in from tall openings on one side and hangs in the haze.
1. 0.0s black. A hairline of haze drifts; the loader counts in the corner.
2. 0.8s the first shaft of light lands on the floor far away, then the next one nearer, then nearer: light walks toward the viewer.
3. 1.6s the shafts reach the foreground; piers resolve out of darkness; inscriptions on the nearest piers catch the light.
4. 2.0s the logo rises as one object on the centre axis; date and venue follow as masked lines.
5. 3–10s a very slow push-in; embers cross the shafts; cursor carries a second, small light that wakes inscriptions on whichever pier it passes.
6. Scroll: the camera walks the nave. Each section is a bay.
**Signature:** light walking down the hall toward you.

### B. Totality — celestial
A black disc sits in front of emerald fire. The date is an eclipse: it happens whether you come or not.
1. 0.0s black. A thin arc of green on the right edge: the disc has not covered the light yet.
2. 0.7s the disc slides the last few degrees; the arc thins to a single bead.
3. 1.4s the bead flares white-green (the one bright frame on the page), then the corona unfurls around the disc.
4. 1.9s the flare lights the left column for an instant: logo first, then date, venue and action as masked lines.
5. 3–10s the corona breathes; streamers lean toward the cursor; the tick ring around the disc counts real seconds down to 09:00 IST on the 19th.
6. Scroll: the camera pushes into the disc until the screen is black, and the next section is written inside it.
**Signature:** the flare at totality, and a countdown that is the rim of the object itself.

### C. The Citadel — exterior
A terraced mass, half building and half mountain, backlit by a green dawn, seen across layers of fog.
1. 0.0s black. Fog layers fade up from the bottom.
2. 0.8s a flash inside the cloud (first of the green flashes): for six frames the whole citadel is visible, then gone.
3. 1.5s the backlight rises behind it and stays. Ridges separate by depth.
4. 2.0s logo, date and venue set bottom-left, anchored like a film's end-card.
5. 3–10s layers drift at different speeds with the cursor; lights come on along the terraces one by one; smoke leans with the wind.
6. Scroll: a crane move down through the fog bank into the next section.
**Signature:** the flash that shows you the scale before the light comes up.

### Recommendation: **B, Totality**
- It is the only one where the **date is the image**. The brief says the fixed date is a gift; here the countdown is not a widget beside the scene, it is the scene's rim.
- It has the cleanest hierarchy. The disc is a huge dark field on purpose, the lockup sits in real darkness on the grid, and the single bright object pulls the eye after the facts are read.
- It is the cheapest to render well: one full-screen fragment shader, no geometry, no textures. That is what makes 60fps on a mid-range phone realistic, and the no-WebGL fallback is one pre-rendered still that looks nearly identical.
- It is furthest from the rejected attempt (no line, no gate, no floor, no poster type) and from any film key art.
- Risk: an eclipse can read "space wallpaper". Mitigation: no stars, no planet texture; the disc is a forged object with cut traces on its face, and the smoke is close and physical.

A is the most architectural and would make the best scroll journey, but it is a raymarch: heavier on phones and the centre-axis lockup competes with the vanishing point. C has the best sense of place but is the closest to a matte painting, and leans hardest on parallax tricks.

---

## 5. Information hierarchy of the hero (any concept)

1. **Logo** as the masthead of the lockup, on the grid (≥ 360px desktop, ≥ 220px phone), plain `<img>` above the canvas.
2. **Date**: `19 December 2026`, the only display-size type in the hero.
3. **Venue + hours**: one line each, body size, full venue name.
4. **Action**: registration state (designed "opens soon" while `REGISTER_URL` is null) + "Explore the summit".
5. **Countdown**.
6. Kicker, nav, scroll cue.

`<h1>` is "IEEE YESS 2026" (visually carried by the logo, present for assistive tech and SEO). The date is not a heading.

---

## 6. System

**Type.** Two families, defined once as `--font-display` / `--font-text`.
- Display (Thomson; stand-in Big Shoulders Display 800): uppercase only, sizes ≥ 40px, tracking −0.01em, line-height 0.9. Digits and `·` verified per glyph; anything missing falls back to the text face via `unicode-range`.
- Text (Glasser; stand-in Hanken Grotesk): body 17/28, small 14/20, label 12/16 uppercase +0.14em. Numerals tabular everywhere they change.
- Scale (fluid, clamp): 12 · 14 · 17 · 22 · 32 · 48 · 72 · 112 · 176. Ratio alternates ~1.3 / ~1.5 so adjacent steps never look like a mistake.

**Grid.** 12 columns desktop, 8 tablet, 4 phone. Margin `clamp(20px, 5vw, 96px)`, gutter `clamp(12px, 1.6vw, 24px)`. Max content 1680px; beyond that the scene keeps growing and the grid stays centred (ultrawide). Baseline 8px.

**Space.** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 72 · 112 · 176. Section rhythm uses only the last three.

**Colour.** Only derivations of the four brand values.
- `--black #000`, `--ground #030705` (black + 4% forest), `--forest #033112`, `--signal #06FF67`, `--white #fff`.
- Neutrals are white at fixed alphas over ground: 92 / 64 / 40 / 16 / 8%.
- Signal covers < 3% of any viewport at rest. It marks: the light source, the live countdown digit, one focus/hover state.
- Body text is white 92% or 64% on ground: ≥ 9:1 and ≥ 7:1.

**Motion language.**
- Two curves: `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)` (arrivals) and `--ease-io: cubic-bezier(0.76, 0, 0.24, 1)` (moves and wipes). Nothing bounces.
- Durations: 0.2 (state) · 0.4 (small) · 0.8 (reveal) · 1.6 (scene) · 3.2s (camera). Exits take half the arrival.
- Rules: light arrives before content; type comes out of a mask line by line (60ms stagger), never fades in place; one thing moves at a time per region; scroll-linked values are scrubbed with 0.6s lag, never snapped.
- Reduced motion: the scene is a still, reveals become 0.2s opacity, scroll is native, the countdown still ticks.

**Transition system.** One page, one persistent fixed canvas behind all sections. Each section declares a scene state (camera distance, light angle, smoke density, exposure); scroll interpolates between them, so light and smoke carry across without cuts. On top of that, three authored devices: (1) the hero exit is a camera move *into* the scene to black; (2) content sections arrive as obsidian sheets that overlap the previous one with a lit top edge; (3) the countdown is a shared element that leaves the hero and docks into the section header rail.

**Section art direction (order).** Hero → About (statement set large, three facts as an inscription) → Countdown (full-bleed, the object returns) → Highlights (drag strip with inertia, two size tiers so small photos stay sharp) → Venue (campus photo masked into the scene, directions) → Programme (sealed ledger, "to be announced") → Partners (organiser marquee + ruled tier grid of placeholders) → FAQ (ruled index) → Footer (links, notify form, one-line Thomson wordmark on a rule).

---

## 7. Technical plan

- **Vite + vanilla TypeScript**, static output (`npm install && npm run build` → `dist/`). No framework: one page, and every kilobyte of runtime competes with the shader.
- **GSAP** (ScrollTrigger, SplitText, Draggable, InertiaPlugin; all free since 3.13) for choreography; **Lenis** for smooth scroll on desktop, native scroll on touch.
- **Raw WebGL** (no Three.js): the scene is a full-screen fragment shader. Tiers: high (DPR ≤ 2, full octaves), mid (DPR ≤ 1.5, half-res buffer), low (DPR 1, fewer octaves, 30fps), none (pre-rendered WebP still). Tier picked from `deviceMemory`, `hardwareConcurrency` and a 20-frame timing probe; rendering pauses when the tab or the canvas is hidden.
- **Content** in `src/content/`: `config.ts` (dates, URLs, contact, with `TODO`s), `programme.ts` (empty array → sealed state), `placeholders.ts` (partners + FAQ, each `placeholder: true`).
- Images copied from `assets/` at build and re-encoded to AVIF/WebP at their native size or smaller. Never larger.
- Verification: Playwright screenshots at 1440 / 1280 / 820 / 390, short and ultrawide; reduced-motion, no-WebGL, keyboard; Lighthouse mobile + desktop.

---

## 8. Open items for the client

- Thomson and Glasser font files (and their web licences).
- Larger IEEE Kerala Section and IEEE LINK logos.
- Venue photos, hall name, map pin.
- Registration URL, contact email, 2026 social handles, form endpoint.

## 9. Font licence note

`assets/fonts/` holds Big Shoulders Display and Hanken Grotesk, both SIL Open Font License: safe to self-host. They are stand-ins. When Thomson and Glasser arrive I will check that the licence covers web embedding and whether the files are full or demo cuts, and report before shipping them.
