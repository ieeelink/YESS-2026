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
  KICKER: "IEEE YESS 2026 · Yearly Engineering Students Summit",

  /** Provisional: one day, 9:00 AM to 5:00 PM IST. The countdown runs to START. */
  START: "2026-12-19T09:00:00+05:30",
  END: "2026-12-19T17:00:00+05:30",
  DATE_DAY_MONTH: "19 December",
  DATE_YEAR: "2026",
  HOURS_LABEL: "One day · 9:00 AM to 5:00 PM IST",

  VENUE_NAME: "Mar Baselios College of Engineering and Technology (Autonomous)",
  VENUE_CITY: "Thiruvananthapuram",
  ORGANIZED_BY: "Organized by IEEE LINK, IEEE Kerala Section",

  ABOUT:
    "IEEE YESS is the Yearly Engineering Students Summit, an annual IEEE gathering for engineering students. It is a space to learn, connect and build alongside fellow students.",

  /** TODO: registration link. While null the primary action reads "Registration opens soon". */
  REGISTER_URL: null as string | null,
  /** TODO: contact email. */
  CONTACT_EMAIL: null as string | null,
  /** TODO: endpoint the "Get notified" form posts to. */
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
  },
} as const;

/** Directions are a Google Maps search for the venue name: no street address is confirmed. */
export const directionsUrl = () =>
  "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`${CONFIG.VENUE_NAME}, ${CONFIG.VENUE_CITY}`);
