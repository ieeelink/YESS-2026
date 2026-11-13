# IEEE YESS 2026: intro and hero analysis

13 Nov 2026, the day before launch. Analysis only: no code was changed. Captured from a production build (`npm run build`, `vite preview`), branch `main` at `7079529`.

## 1. Current state

### Captures

All in `docs/shots/intro-analysis/`.

- Intro frames every 0.5 s from load (`?intro=1`):
  - `1440-intro-0000ms.jpg` … `1440-intro-7000ms.jpg` (1440x900)
  - `390-intro-0000ms.jpg` … `390-intro-7000ms.jpg` (390x844 @2x)
- Settled hero (`?intro=0`, after 2.2 s):
  - `hero-1440x900.jpg`
  - `hero-1280x800.jpg`
  - `hero-1366x700.jpg`
  - `hero-820x1180.jpg`
  - `hero-390x844.jpg`

### Intro timeline (measured, both widths)

| t (ms) | Beat | How |
|---|---|---|
| 0–180 | Black | Nothing on screen except "Skip intro" bottom right |
| 180 | The cut: 1px emerald vertical line at 50% x | Flicker (steps), grows over 0.7 s, holds at 55% opacity |
| 520 | Card 1 "ONE DAY", centred, split by the line, ~108 px at 1440 | Hard cut on (display: block), static |
| 1440 | Card 2 "19 DECEMBER", full width (~223 px at 1440; two stacked lines on phones) | Hard cut, static |
| 2440 | Card 3 "THIRUVANANTHAPURAM", low left, hairline above | Hard cut, static |
| 3360 | Black, line goes to full opacity | 160 ms breath |
| 3520 | Logo, centred, line visible behind it | Opacity 0→1 over 0.8 s, scale 0.96→1 over 1.2 s |
| 4480 | Handoff: the black doors slide apart, the logo flies (FLIP) to its hero slot, the hero light turns on | 1.1 s, `cubic-bezier(.76,0,.24,1)` |
| ~5630 | Overlay removed; hero text, CTA and countdown rise in | ~0.9 s, `cubic-bezier(.16,1,.3,1)` |
| ~6500 | Settled hero | |

- **Duration:**
  - Total ≈ 6.5 s to a settled hero.
  - Scrolling is locked for the first ≈ 5.6 s.
  - The brief's limit was about 5 s.
- **Easing:**
  - Two curves only: the door/flight and the reveals.
  - Every card is a hard cut with no motion inside the shot.
- **Repeat visits:** plays once per **session** (`sessionStorage`), so every new tab or new in-app browser sees it again. That includes every tap on a WhatsApp or Instagram link.
- **Performance:**
  - The intro is pure CSS.
  - Headless Chrome at 390 @2x, frame intervals over the 6.5 s:
    - No CPU throttle: p95 16.7 ms, 0 frames over 33 ms.
    - 4x CPU throttle: p95 16.7 ms, 1 frame at 50 ms.
  - This does not measure a real phone GPU, but the intro is not a jank risk.
  - The cost is time, not frames: for first-time visitors the real content is hidden for about 5.6 s.

### Settled hero (measured boxes, x / y / w / h)

| Viewport | Logo | Date (font size) | Info line | Countdown | Light |
|---|---|---|---|---|---|
| 1440x900 | 72/282/432/166 | 72/489/744/91 (108 px) | wraps to 2 lines | 955/583/413/171 | vertical, x = 885 |
| 1280x800 | 64/242/384/148 | 96 px | wraps | 849/504 | x = 787 |
| 1366x700 | 68/187/350/135 | 102 px | wraps | 906/444 | x = 840 |
| 820x1180 | 41/389/400/154 | 106 px | wraps | below CTA | horizontal, y = 890 |
| 390x844 | 20/208/304/117 | 51 px | 2 lines | 20/599 | horizontal, y = 598 |

No horizontal overflow at any size.

## 2. Intro critique (blunt)

**Hook.**
- The first second is a black screen and a faint line at 55% opacity.
- The first word appears at about 0.5 s, and it is "ONE DAY", the weakest line in the sequence.
- On a slow phone, with the display font still loading, that first word may render in the fallback face and then swap.
- Nothing in the first second says "this is worth waiting for".

**Where attention drops.**
- **Around 2.5 s:** by card 3 the viewer has worked out the pattern (word, cut, word, cut) and starts looking for the skip button.
- **At 3.4 s:** an empty black beat.
- **3.5–4.5 s:** a static centred logo, which is the most template-like moment.
- **5.0–5.6 s:** the hero is empty apart from the logo and the light.
- So there are two dead frames, plus a hold.

**Pacing.**
- The three cards last 920, 1000 and 920 ms. That is a metronome, not a trailer.
- Scale does vary (centred small, full width, low left), but:
  - every card uses the same face, weight, case and colour;
  - every card is static, on the same black, entering the same way.
- The result reads as a slideshow of three slides.

**Content.**
- The trailer says only "one day / 19 December / Thiruvananthapuram".
- The hero repeats exactly that a second later.
- The viewer waits 6.5 s to learn nothing the hero does not tell them in 1 s.
- This is the core problem, more than any styling.

**AI-slop tells present:**
1. A logo fade with a 0.96→1 scale-up, centred on black: the default "brand reveal".
2. Everything centred (cards 1 and 2, the logo). Only card 3 breaks the axis.
3. A uniform rhythm: same-length shots, same treatment.
4. A uniform light: the line is a constant 1 px at 55% then 100% opacity, with no flare, no spill and no change in intensity tied to the cuts. It is a divider, not light.
5. Filler copy: "ONE DAY" carries no information.
6. A payoff that is a fade: the hero content fades up after the logo lands.
7. Scroll locked behind an overlay.

**Credit where due:**
- Hard cuts rather than cross-fades.
- One accent colour.
- No smoke in the intro itself.
- Skip visible from the first frame.
- Escape skips.
- Reduced motion never sees it.

**Handoff.** This is the biggest craft bug.
- The cut sits at 50% of the width (x = 720 at 1440), but the hero light lives at column 8 (x = 885).
- When the doors part, both lines are on screen at once, a second light appears 165 px to the right, and the doors reveal a hard-edged lighter rectangle (`1440-intro-5000ms.jpg`).
- On phones it is worse: the vertical cut gives way to a horizontal hero light (`390-intro-5000ms.jpg`).
- The one idea, "the light becomes the hero", is broken at the exact moment it should pay off.
- The logo lands in an empty room, and the content arrives ~0.6 s later.
- **Logo rule risk:** the cut runs behind the logo during the logo shot, showing through the gaps at 390. It is behind it rather than on it, but it reads as an effect crossing the mark.

**Skip.**
- "Skip intro": 14 px text, 72% white, bottom right, 44 px tall.
- It is always visible but easy to miss.
- Escape works; click, tap, scroll and other keys do nothing.
- Scroll is locked, so a phone user swiping up gets no response. That is the most annoying behaviour on mobile.

**Mobile.**
- The cards fit: card 2 is stacked, card 3 is at 10.6 vw.
- The axis change of the light at handoff is jarring.
- Same 6.5 s, and it replays in each new in-app browser session.

## 3. Hero critique

**Three-second test**

| Question | Answer from the hero | Verdict |
|---|---|---|
| What | The logo's tagline "Yearly Engineering Students Summit 2026", about 22 px | ~ (no plain line saying who it is for or what happens) |
| When | Date at 108 px, the biggest thing on screen | Pass |
| Where | A 20 px grey line that wraps mid-name ("…Engineering and / Technology, Thiruvananthapuram") at 1440, 1366 and 820 | Weak |
| Do | "Registration opens soon · Get notified": the first half says you can't, the action is the second half | ~ |

**Hierarchy.**
- The logo (432 px wide, "YESS" ≈ 100 px cap height) and the date (108 px) are stacked 40 px apart and carry nearly the same weight.
- Two headlines, no clear lead, and no real scale contrast: everything on the left is "large".

**Composition.**
- The light divides the page 60/40, but the right 40% holds only the countdown in its bottom corner.
- At 1440 that leaves ~450 px of empty green fog above it, and the left column is dense.
- It reads as a two-pane template rather than one composition.
- At 820 the top third is empty (the logo starts at y = 389), and the tablet looks like a stretched phone.
- At 390 there is ~200 px of empty space at the top, and the hero is a stacked list.

**Countdown.**
- Good size and tabular.
- The seconds are green and tick every second. It is the only moving thing besides the marquee, and in the accent colour it pulls the eye away from the date and the CTA 60 times a minute.
- The spacing looks uneven ("35 15 ‿ 58 58"): the column is fixed, but the glyph widths differ.

**Marquee.**
- Three organizer logos repeated, so at 1440 each appears twice on screen. That reads as filler, the opposite of "official".
- The faded left edge clips "Kerala Section" right next to the "Organized by" label, which looks broken.
- Combined with the ticking seconds, the hero never stops moving.

**Atmosphere.**
- Mostly dark, but the fog washes the right half and the bottom in grey-green. There is no true black anywhere in the hero, so contrast and depth suffer.
- The "cut of light" is a 1 px line with a faint glow. It does not light anything: nothing on the type, the floor or the countdown reacts to it. The signature idea is under-delivered.

**What looks templated:** the left stack (logo, date, line, CTA), the split column, perpetual motion in two places, and a static hero with no response to the user.

**What works:**
- Real logo, untouched.
- One CTA.
- Strong date type.
- The chamfered button has character.
- Restraint with the green.
- Fits 1366x700 and 375x667.
- Lighthouse 99–100.

## 4. Research

### References

Read today: Iventions case study, Vercel Ship post, xfive study, basement case study. From prior knowledge (the Art of the Title pages returned 403 to automated fetch): Psycho, Se7en, Enter the Void, OFFF.

1. **Iventions** (event agency; SERIOUS.BUSINESS + Hon Tran; Awwwards SOTD 4 Nov 2025)
   - Links: https://iventions.com, case study https://www.hontran.dev/blog/iventions-award-winning-events-website-case-study
   - The hero is a "spotlight" concept with bold type.
   - Every transition is one timeline with overlapping beats so "the eye never hits a dead frame" (expo.inOut 0.9 s, 0.04 s stagger).
   - Only transform and opacity are animated; reduced motion is honoured.
   - **Borrow:** overlap the beats. Our intro has exactly the dead frames they design out (3.4 s black, the empty hero at 5.0–5.6 s).
2. **Vercel Ship 2025** (Vercel and basement.studio)
   - Link: https://vercel.com/blog/designing-and-building-the-vercel-ship-conference-platform
   - One material lit by one light source, pushed "darker, sleeker" after an honest pivot (they cut a direction that tested badly).
   - **Borrow:** one light that actually lights things. Spill and falloff, not just a line.
3. **Next.js Conf 2024** (basement.studio; Awwwards SOTD and Developer Award)
   - Links: https://basement.studio/showcase/nextjs-conf-raising-the-bar-again, https://www.awwwards.com/sites/next-js-conf-1
   - One identity carried across the web, stage, motion and collaterals.
   - **Borrow:** the cut of light should be the same motif on the site, the OG image, the stage screens and the countdown posts.
4. **Psycho (1960) titles, Saul Bass**
   - Link: https://www.artofthetitle.com/title/psycho/
   - Grey bars slide in and slice the credits into fragments, which then reassemble.
   - **Borrow:** let the cut slice the type. The date splits along the light and snaps together, instead of a word simply appearing next to a line.
5. **Se7en (1995) titles, Kyle Cooper**
   - Link: https://www.artofthetitle.com/title/se7en/
   - Jittery, irregular editing; light leaking into the gate; overexposed flash frames.
   - **Borrow:** irregular rhythm, plus a 1–2 frame flare of the cut on each hard cut.
6. **Enter the Void (2009) titles, Tom Kan**
   - Link: https://www.artofthetitle.com/title/enter-the-void/
   - Hard-cut typography that accelerates until it strobes.
   - **Borrow:** accelerate the cards (e.g. 450 → 300 → 180 ms) instead of 1 s each. That is tension, not a slideshow. Keep it well under any flashing threshold: no full-screen white flashes.
7. **OFFF Barcelona main titles**
   - Link: https://offf.barcelona
   - Each edition opens with a commissioned title sequence that works as the festival's identity, not a loader.
   - **Borrow:** the trailer as a shareable piece (the OG video or social cut), not something that gates the site.
8. **xfive, "Do intro animations affect perceived performance?"**
   - Link: https://www.xfive.co/blog/intro-animations-perceived-performance
   - Measured Speed Index:
     - No animation: 869.
     - 3 s partial fade: 1031.
     - Loader then fade: 1140.
     - On full-viewport pages: 1192 vs 2564 vs 2910.
   - "Do not delay displaying important parts."
   - **Borrow:** the logo, date and CTA should never sit behind the intro.

### What makes an intro good vs annoying (consensus; no controlled study gives an exact number)

- **Duration:**
  - Under ~2 s for something that may be seen again.
  - About 4–5 s at most for a once-only piece, and only if it pays off.
  - Match it to real load time where possible.
- **First-second hook:** something meaningful by ~300 ms: a strong image, a sound, a striking type crop. Not an empty black frame.
- **Skip:**
  - Visible from frame 1.
  - Any input skips it (click, tap, scroll, any key).
  - Never lock scroll.
- **Sound:** off by default (browsers block autoplay audio anyway). Not needed here.
- **Payoff:**
  - The last frame of the intro is the first frame of the page (a match cut).
  - The best intros end with the site already in place, not a fade-up after the fact.
- **Repeat visits:** once per device for days, not once per session. Returning visitors came for information.
- Reduced motion always skips it.
- Sources: the xfive study above; NN/g's long-standing "skip intro" guidance (Nielsen, quoted in NZ Herald); Framer's preloader guidelines (https://www.framer.com/help/articles/preloader-guidelines-for-templates).

### What makes a hero memorable

- **One signature idea, fully executed.** Ours is the cut of light. It exists, but it is not executed: it lights nothing and does nothing.
- **Real scale contrast:** one element 3–5x everything else, everything else quiet.
- **One response to the user:** pointer, scroll or time. It shows the page is alive without perpetual decoration.
- **Restraint:** one moving thing at a time.

## 5. Recommendations

### Intro options

**A. Minimal fix of the current intro.** Effort 2 h. Risk low.

Storyboard:
1. 0.0 s: the cut snaps on at the exact position of the hero light, with a 2-frame flare.
2. 0.25 s: "19" cut-on huge, cropped by the left edge. 0.6 s: "DECEMBER". 0.85 s: "THIRUVANANTHAPURAM" small, low left. Accelerating cuts, flare on each.
3. 1.3 s: the logo, placed off-centre on the hero's left grid column (not centred), with the light no longer behind it.
4. 1.9 s: the doors part along the same line; the hero is already composed underneath (text in place, no fade-up).
5. 3.0 s: done.

Changes needed:
- Any input skips, and scroll is not locked.
- Suppress replays with `localStorage` for 7 days.
- On phones, either make the cut horizontal at the hero light's y position, or keep the hero light vertical.

Feel: tighter and actually a trailer, but still a gate. Fixes the bugs without changing the idea.

**B. Stronger redesign: "the cut opens".** Effort 4–6 h. Risk medium (the match cut must line up at every breakpoint, and font load timing matters).

Storyboard:
1. 0.0–0.3 s: black. The cut snaps on at the hero light's position and flares once.
2. 0.3–1.2 s: the date is sliced by the cut, Psycho-style. The left half "19 DECEMBER" and the right half "2026" slide in from opposite sides at different speeds and lock together on the line.
3. 1.2–1.6 s: the venue name cuts in tiny beneath it; the cut's glow intensifies as the pressure builds.
4. 1.6–2.6 s: the doors open along the cut. The date is already exactly where the hero date sits (a match cut). The logo, countdown and CTA are revealed in place.
5. 2.6–3.0 s: countdown digits settle; the organizer row appears. This is the hero, with no fade-up.

Constraints:
- The logo is never part of the film; it is simply there when the doors open.
- Same skip and repeat rules as A.

Feel: a real title sequence with a payoff. The best "wow", but the most that can go wrong tonight.

**C. No intro: a 1.2–1.6 s reveal straight into a stronger hero.** Effort 1–2 h. Risk low.

Storyboard:
1. 0.0 s: the page loads as black with the hero laid out underneath.
2. 0.1–0.4 s: the cut of light draws down at the hero light's position, with a single flare.
3. 0.4–1.2 s: two black doors part from the cut (ease-in-out). The hero is revealed, already composed.
4. 0.6–1.4 s: the date and line rise from their masks in a short stagger. The logo is simply visible: untouched, never animated internally.
5. 1.4 s: done; the countdown ticks and the page is live. Plays on every first load per session, with no skip needed.

Feel: confident and fast. The signature idea lands every visit, and no one waits.

### Hero enhancements, ranked

| # | What | Why | Effort | Risk | Safe for tomorrow |
|---|---|---|---|---|---|
| 1 | Make the intro's cut and the hero light the same line (same x on desktop, same axis on phones) | Fixes the broken payoff; the one idea finally reads | S | Low | Yes |
| 2 | Make one element lead: logo down to ~300 px at 1440 (still sharp, untouched), date up to ~140–150 px, or the reverse if you prefer the brand to lead | Real scale contrast; ends the two-headline stack | S | Low | Yes |
| 3 | Rebalance the right column: countdown numerals at date size, baseline aligned with the date, top-aligned "Doors open in" | The right half stops being a hole with a widget in the corner; the date and the countdown become a pair across the light | M | Low–med | Yes, if re-shot at all sizes |
| 4 | Seconds in white; green only for the light, the CTA and focus | Removes the 1 Hz attention theft; a cleaner palette | S | None | Yes |
| 5 | Organizers as a static row of three on desktop (keep the marquee only if needed on phones) | Three logos repeated read as filler; static reads official; fixes the clipped-logo edge | S | Low | Yes |
| 6 | Let the light light: a soft emerald falloff from the cut onto the floor and the date's edge, a faint bloom at its base, and ~40% less fog elsewhere for truer blacks. Never on the logo | Depth and contrast; the signature finally feels like light, not a rule | S–M | Low | Yes |
| 7 | Set the info line deliberately: hours on one line, the full venue name on the next (no mid-name wrap) | Readable "where" in one glance | S | None | Yes |
| 8 | Tablet and phone: remove the empty top space, give the date two lines on phones ("19 DECEMBER" / "2026") at a larger size; use the desktop composition from ~820 | Mobile gets real scale instead of a list | S–M | Low | Yes |
| 9 | Pointer response on desktop: the cut's glow brightens and the fog shifts a few px toward the pointer (transform/opacity only, off for touch and reduced motion) | One quiet sign of life without perpetual motion | S | Low | Yes |
| 10 | Scroll-open: as you leave the hero, the cut widens into a door gap that reveals About | The memorable idea, carried into the page | M–L | Medium | Post-launch |
| 11 | Plain "what" line under the logo, e.g. who it is for (only if the copy is confirmed; no invented facts) | Passes the 3-second "what" test | S | Content risk | Only with approved copy |

### Recommended plan for today, in priority order

1. **Replace the trailer with option C** (1.5–2 h). The cut draws down at the hero light's exact position, the doors part, and the hero is already in place. No scroll lock, so no skip button is needed, and it runs in ≈1.4 s. Keep the current trailer code in git history; it can return later as the social video (the OFFF idea) rather than as a gate.
2. **Hero hierarchy and balance** (1.5 h): enhancements 2, 3, 4 and 7.
3. **Make the light light** (1 h): enhancements 1 and 6, plus 9 if time allows.
4. **Static organizer row on desktop** (20 min): enhancement 5.
5. **Phone and tablet pass** (1 h): enhancement 8. Check 375x667, 390x844 and 820x1180.
6. **Verify** (45 min):
   - `npm run shots` at 1440, 1366x700, 820 and 390.
   - Reduced motion.
   - Lighthouse mobile.
   - One real mid-range Android over 4G.

Total ≈ 6–7 h. Option B and enhancement 10 are the post-launch upgrade, once launch-day pressure is off.

All recommendations keep:
- the supplied logo exactly as is, never animated internally or crossed by effects;
- Thomson for display and Glasser for text;
- the brand palette, with green as light and accent only;
- no Marvel IP;
- transform and opacity animation only, for mid-range phones.
