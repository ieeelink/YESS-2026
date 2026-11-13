/**
 * IEEE YESS 2026: every fact the site states, in one place.
 *
 * Anything marked TODO is not confirmed yet. While a value is `null` the site shows a designed
 * fallback (for example "Registration opens soon") instead of a dead link. Fill the value in and
 * rebuild: nothing else needs to change.
 */
export const CONFIG = {
  EVENT_NAME: "IEEE YESS 2026",
  EVENT_FULL_NAME: "Yearly Engineering Students Summit",

  /** Provisional: one day, 9:00 AM to 5:00 PM IST. The countdown runs to START. */
  START: "2026-12-19T09:00:00+05:30",
  END: "2026-12-19T17:00:00+05:30",
  DATE_DAY_MONTH: "19 December",
  DATE_YEAR: "2026",
  HOURS_LABEL: "9:00 AM – 5:00 PM IST",
  /** The same hours, short, for the hero's info line. */
  HOURS_SHORT: "9 AM – 5 PM IST",

  VENUE_NAME: "Mar Baselios College of Engineering and Technology (Autonomous)",
  /** The hero line and the final call use the short name; the venue section sets it in two lines. */
  VENUE_SHORT: "Mar Baselios College of Engineering and Technology",
  VENUE_LINES: ["Mar Baselios College of", "Engineering and Technology"],
  VENUE_CITY: "Thiruvananthapuram",
  ORGANIZED_BY: "Organized by IEEE LINK under the IEEE Kerala Section",

  /**
   * TODO-confirm: a one-line "what", set under the About statement (it crowded the hero). Edit the
   * wording, or set it to null to remove the line entirely (nothing else changes).
   */
  WHAT_LINE: "A one-day IEEE summit for engineering students across Kerala." as string | null,

  ABOUT:
    "IEEE YESS is the Yearly Engineering Students Summit, an annual IEEE gathering for engineering students. It is a space to learn, connect and build alongside fellow students.",

  /** TODO: registration link. While null the primary action reads "Registration opens soon". */
  REGISTER_URL: null as string | null,
  /** TODO: contact email. */
  CONTACT_EMAIL: null as string | null,
  /**
   * TODO: endpoint the footer form ("Still have questions?") posts to: any form service that accepts
   * POST with an "email" field (Formspree, Getform, Basin...). If it stays null but CONTACT_EMAIL is set,
   * the form opens the visitor's mail app addressed to CONTACT_EMAIL instead. With neither, the footer
   * shows a visible TODO.
   */
  NOTIFY_ENDPOINT: null as string | null,
  /** TODO: 2026 social handles (full URLs). Hidden while null. */
  SOCIALS: {
    instagram: null as string | null,
    linkedin: null as string | null,
    youtube: null as string | null,
    whatsapp: null as string | null,
  },
  /** TODO: final site URL, no trailing slash (used for canonical and Open Graph tags). */
  SITE_URL: null as string | null,

  /** Verified on last year's site (yess.ieee-link.org) and in assets/reference/CONTENT.md. */
  LINKS: {
    ieee: "https://www.ieee.org/",
    ieeeKerala: "https://ieeekerala.org/",
    ieeeLink: "https://ieee-link.org/",
    /** Last year's site, linked from the earlier YESS build. If the 2026 site is deployed to this same domain, change it. */
    yess25: "https://yess.ieee-link.org/",
  },
  /**
   * The organizer marquee in the hero. Real files from assets/partners, used exactly as supplied.
   * Native sizes: ieee-kerala-section.png 216x53, ieee-link.png 314x76, ieee.png 1192x348.
   * `hh` is the displayed height in CSS px on desktop, chosen for equal visual weight rather than equal
   * boxes: the IEEE mark's letters fill its whole box, the Kerala Section flag carries small type.
   * Never above half the native height, so nothing is upscaled on 2x screens.
   */
  ORGANIZERS: [
    { name: "IEEE Kerala Section", file: "ieee-kerala-section.png", w: 216, h: 53, hh: 26 },
    { name: "IEEE LINK", file: "ieee-link.png", w: 314, h: 76, hh: 27 },
    { name: "IEEE", file: "ieee.png", w: 1192, h: 348, hh: 21 },
  ],
} as const;

/** Directions are a Google Maps search for the venue name: no street address is confirmed. */
export const directionsUrl = () =>
  "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`${CONFIG.VENUE_NAME}, ${CONFIG.VENUE_CITY}`);
