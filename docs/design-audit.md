# IEEE YESS 2026: design audit

Launch: 14 Nov 2026. Branch `fresh-build`. This file is the checklist the site is judged against, the issue list, and the record of what changed.

## A. AI-slop tells (checklist)

Sources: practitioner write-ups on generic AI-generated UI (925studios, noqta, Adrian Krebs' Show HN audit, prg.sh "same purple gradient website", Kosta Canatselis' "Spot the slop"). They overlap heavily, so treat them as consensus opinion, not data.

1. Purple/blue/neon gradients, gradient text, glow on everything; one accent washed over the whole page.
2. Glassmorphism, cards inside cards, every element in a rounded box with a soft shadow, a thick coloured border on one side of a card.
3. The default skeleton: centred hero, three icon cards, testimonial, CTA.
4. Inter/Roboto/system type at default sizes; flat hierarchy; one weight everywhere.
5. Emoji and stock icon sets as decoration; abstract blobs, orbs, particles.
6. Over-animation: everything fades up the same way, bouncy easing, motion with no purpose.
7. Filler copy and buzzwords ("unleash", "elevate"), invented stats, invented testimonials.
8. The same facts repeated in several sections.
9. Inconsistent buttons, spacing and alignment; things floating off the grid.
10. Cheap 3D: low-poly, a single colour tint, no real blacks, no depth.
11. Leftover scaffolding: "Prototype" labels, placeholder boxes, lorem ipsum, broken images, raw template tokens.
12. "Live" badges, pill-everything, oversized radii, glowing status dots, tracked uppercase eyebrows on every block.

## B. What premium event sites do (checklist)

Reference points: Next.js Conf (basement.studio, Awwwards SOTD), Spring I/O, Awwwards Event category winners.

1. Type carries the design: one display face used at extreme scale, a quiet text face, real contrast between them.
2. A visible, disciplined grid; edges that line up across sections.
3. Negative space used on purpose; one idea per screen.
4. Colour restraint: mostly neutral, the brand colour reserved for light and the few things that matter.
5. Real photography of real people, graded to sit in the world.
6. Motion with one easing family and one duration scale; it explains (reveals, hand-offs), it never decorates.
7. Small details finished: focus rings, hover and press states, loading states, empty states.
8. One memorable idea, executed fully, instead of five half-ideas.

## Direction

**One idea: the cut.** A single hairline of emerald light cuts through a near-black page, like light through a door left ajar. It opens the trailer, divides the hero, travels with you down the page as a faint fog, and closes the page at the final call. Everything else is black, white and type.

**3D decision: removed.** The ray-marched hall reads as a low-poly game and cannot reach film quality while staying smooth on mid-range phones by launch; the same mood comes from darkness, one light, fog and grain at a fraction of the cost.

## Audit of the site as it stood (13 Nov, before)

Screenshots: `docs/shots/before/` (1440 and 390).

### Critical
| # | Issue | Fix |
|---|---|---|
| C1 | Real-time 3D hall looks like an old video game: flat low-poly forms, one green tint over everything, no true blacks, the open door is a flat green slab. Also the heaviest thing on the page (WebGL ray-marching on phones). | Delete the WebGL hall entirely (`src/hero`, `src/gl`, stills). Replace with a CSS light/fog/grain layer. |
| C2 | Green everywhere: every section sits in a green radial glow, green progress bar, green nav underline. | Page is ~90% near-black and white. `#06FF67` only for the light, the primary button, focus and a few accents. `#033112` only as a deep tone in the fog. |
| C3 | Hero overloaded (~12 items): wordmark, logo, date, rule, When/Where grid, CTA, "Explore", credit, countdown, scroll hint, replay, sound. Reads like a form. | Hero = logo, date, one info line, one CTA, a large countdown, organizer marquee. Nothing else. |
| C4 | Rose window collides with the nav; the countdown floats small in the 3D scene. | Scene gone; countdown becomes a large typographic block on the grid. |
| C5 | Organizer logos are not visible in the hero at all; partners section shows them in boxed tiles. | Seamless organizer marquee in the hero using the real files, unaltered. |
| C6 | The running dev server on :5173 renders raw `{{TOKENS}}` (stale server started before the content plugin existed). The production build fills them correctly. | Verified with a fresh server and a production build; restart `npm run dev` after pulling. |

### High
| # | Issue | Fix |
|---|---|---|
| H1 | Text wordmark "IEEE YESS 2026" top-left above the real logo (redundant). | Removed. The real logo appears small in the nav only after the hero has scrolled away. |
| H2 | After the hero the world disappears: About is a black page with an unbalanced wall of text and a lot of dead space. | A fixed fog/light layer runs under the whole page and shifts with scroll; About is a large, line-revealed statement on the grid. |
| H3 | Date, venue and organizers repeated three times (hero, About facts, final call; plus FAQ). | Facts only in the hero and the final call. About facts list removed; FAQ "when and where" removed. |
| H4 | Buttons inconsistent: outline "Get notified", solid "Get directions", square arrow buttons, text links. | One system: primary solid `#06FF67` with black text, secondary 1px white outline. Same height, radius, padding. |
| H5 | Venue name wraps to four heavy lines; arch mask jagged; warm photo clashes. | Name set in two lines; arch drawn with `border-radius` (anti-aliased), photo at native density, graded down. |
| H6 | Organizer logos rendered as tiles/placeholder boxes in Partners. | Partners section holds sponsor tiers only; organizers live in the hero marquee and footer. |
| H7 | Final call repeats the hero countdown at 200px. | Final call = closing line, date and venue, CTA, with the light returning. No second countdown. |
| H8 | Mobile hero: countdown at the top, logo and date pushed below it, CTA in the bottom strip. | Single flow column on phones; everything fits in the first viewport down to 667px tall. |
| H9 | 404 in the console at 1440 (a missing still referenced by the old hero). | Old hero and its assets removed. |

### Polish
| # | Issue | Fix |
|---|---|---|
| P1 | Filler copy: "A look back at the people, ideas and moments that brought us together." | Removed. Headings carry it. |
| P2 | Top progress bar in green adds noise. | Removed. |
| P3 | Gallery counter set in the display face at 64px competes with the title. | Small counter `01 / 11` in the text face with tabular numerals. |
| P4 | Footer column titled "Still have questions?" holds a notify form. | Retitled "Get notified"; the form posts to `CONFIG.NOTIFY_ENDPOINT`. |
| P5 | Giant footer wordmark is heavier than anything above it. | One line, fitted to the container, dark forest tone so it closes the page without shouting. |
| P6 | Replay / Sound controls. | Removed (no sound, no 3D). The intro plays once per session; `?intro=1` forces it. |

## Fixes made (13 Nov)

Screenshots after: `docs/shots/after/` (1440, 820, 390; hero also at 1280x620 and 375x667).

- **3D hall removed** (`src/hero`, `src/gl`, stills, render scripts). The mood is now a fixed CSS layer: two pre-blurred forest-green fog fields that drift with scroll (transform only), static SVG grain, and one emerald "cut" of light. No WebGL, no canvas; JS is 8 KB.
- **Trailer** (`src/intro.ts`): 4.5 s of hard cuts on black. The cut of light flickers on, then three cards: ONE · DAY split by the light, 19 DECEMBER at full width, THIRUVANANTHAPURAM set low-left. The logo arrives, the doors part along the cut, and the logo travels (whole-object transform) to its place in the hero. Skip button always visible, Escape skips, plays once per session, never with reduced motion, `?intro=1` forces it, failsafe after 7 s.
- **Hero**: logo (tagline readable), `19 DECEMBER 2026`, one line, one CTA, a large countdown, organizer marquee on the floor line. The light divides the two halves on desktop and lies horizontal over the countdown on phones. Fits 375x667 including the marquee.
- **Marquee**: the three real files, unaltered, 28 px tall on desktop and 24 px on phones, aspect kept, seamless (two identical halves, −50% loop), 64 s per loop, faded edges, pauses on hover, static row for reduced motion. Only the first set is exposed to screen readers.
- **One system**: tokens for type scale, spacing, grid (12 columns, label in 1–3, content from 4), one radius (2 px), one easing family and four durations. One primary button (solid green, black text, white on hover) and one secondary (1 px outline).
- **Facts** appear only in the hero and the final call (plus the venue's own section and the meta tags). About facts list, FAQ "when and where" and the second countdown are gone.
- **About**: the statement at 28–50 px, split into masked lines that rise in sequence.
- **Highlights**: draggable strip with inertia, keyboard arrows, prev/next, `01 / 11` counter; the photo in focus comes up to full light, the rest sit dimmed; light grade (saturation 0.82). 900 px variants added in `src/img/yess25` (generated; `assets/` untouched) so phones and 1x screens don't download 1800 px files.
- **Programme**: data-driven from `src/content/programme.ts`; while empty, nine sealed hourly slots from 9:00 AM to the 5:00 PM close, with one sweep of light across them on entry.
- **Venue**: name set in exactly two lines, city, "Get directions" (Google Maps search). Photo drawn as a clean rectangle at no more than 512 px (sharp at 2x), lightly graded, with the cut of light on its left edge. The arch mask is gone, and with it the jagged edge.
- **Partners**: sponsor tiers only, every slot a quiet "To be announced" tile from `src/content/placeholders.ts`.
- **FAQ**: native `<details>` accordion (keyboard and screen-reader correct), animated height where the browser supports it.
- **Final call**: "Be in the room." The light draws down from the top as the section arrives, followed by date, hours, venue and the CTA.
- **Footer**: logo, notify form (posts to `CONFIG.NOTIFY_ENDPOINT`; honest "list opens shortly" message while it is empty), section links, organizer links, socials when set, legal line.
- **Meta**: title, description, OG and Twitter tags, a new OG image rendered from the real hero without the live countdown (`npm run og`), favicon, theme-color.

### Self-critique, pass 1 (1440 / 390)
- Date overran its column into the light → date scale reduced to fit seven columns.
- A 140vw light spill widened the mobile layout viewport (Menu button off-screen) → hero clips its overflow.
- Venue name rendered as a raw `{{VENUE_L1}}` → token regex now accepts digits.
- Fog read too green on the left of Partners/FAQ → both fog fields reduced by about a third.
- Notify input collapsed to 21 px in the stacked phone layout; "Back to top" was a 25 px target → fixed (48 px and 44 px).
- Trailer: `html.intro` matched the `.intro {display:none}` rule and hid the whole page → flag renamed `has-intro`. The "19 December" card was off-centre and overflowed on phones; hero text faded in under the flying logo → content now lands after the logo.

### Self-critique, pass 2 (1440 / 820 / 390)
- Venue name touched the right edge on phones → smaller phone size. Photo's forest overlay turned the sky green → removed, grade lightened. Photo exceeded native density at 820 → capped at 512 px.
- The OG image froze a live countdown and a button → both removed from the share render.
- Lighthouse flagged `aria-label` on a `<p>` (line splitter) and the forest-on-black wordmark contrast (1.45:1) → splitter uses a hidden text copy instead.
- The giant footer wordmark, at any readable contrast, became the loudest element in the footer and repeated the logo directly above it → removed. The footer now ends on the logo, the form and the legal line.

### Ship checklist (production build, `vite preview`)
- `npm run build`: passes (tsc + vite), static output in `dist/`, no console errors or warnings at 1440 / 820 / 390, no template tokens or prototype labels in the output.
- No horizontal overflow at 1440 / 820 / 390 / 375; touch targets ≥ 44 px on phones; mobile menu opens, closes on link and Escape.
- Lighthouse mobile: Performance 99, Accessibility 100, Best practices 100, SEO 100 (LCP 2.0 s, CLS 0). Desktop: 100 / 100 / 100 / 100.
- The logo is the same `assets/YESS_Logo.svg` everywhere as a plain `<img>`; no filters, masks or overlays touch it. Organizer logos are the supplied PNGs.

## Footer rebuild and button system (13 Nov, second request)

- **Footer** restyled to the earlier build's shape: a #0b0b0b panel with only the top corners rounded (44 px desktop, 28 px phones), pulled up by its radius over the final call, which now fades from the page black into a #13291a tint so the curve reads. The faint smoke still from the earlier build (`src/img/smoke-*.webp`) sits at 20% opacity, masked away at the top.
- Top row: logo on the left; "Still have questions?" with the email form on the right, top-aligned. Two link columns under the logo (current sections; IEEE, IEEE Kerala Section, IEEE LINK, YESS 2025 at yess.ieee-link.org as used by the earlier build). Thin green underline on hover and focus.
- Form: posts to `CONFIG.NOTIFY_ENDPOINT`; without one, opens a mail to `CONFIG.CONTACT_EMAIL`; with neither, shows a visible yellow TODO note (and the build warns).
- Wordmark "IEEE YESS" is back on request: one line, white, fitted in JS to 70% of the content width, letters rise once and end sharp.
- Legal line centred under a hairline, "IEEE LINK" underlined as a link.
- **Primary button** is now the two-part chamfered style everywhere (hero, final call, footer): a label block with its top-left corner cut at 45° and a separate arrow block with its bottom-right corner cut, 4 px apart; hover lightens both and nudges the arrow. Secondary stays a 1 px outline.
- Build passes; Lighthouse mobile 99 / 100 / 100 / 100 after the change.
