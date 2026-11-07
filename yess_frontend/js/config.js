// Everything the team needs to fill in lives here.
export const CONFIG = {
  // ISO string, e.g. "2026-12-31T09:00:00+05:30". null shows "Date to be announced". Never invent a date.
  LAUNCH_DATE: null,

  // Social links, e.g. { href: "https://…", label: "Instagram", short: "Instagram" }.
  // The row stays hidden while this is empty.
  SOCIAL: [],

  // TODO(team): set ONE of these so the "Still have questions?" form can send.
  // CONTACT_ENDPOINT receives a JSON POST of { email }. CONTACT_EMAIL opens a mailto draft instead.
  // While both are null, the form tells visitors that contact details are coming.
  CONTACT_ENDPOINT: null,
  CONTACT_EMAIL: null,

  // The "Meet our host" section. Edit any of this text freely.
  HOST: {
    KICKER: 'THE HOST CAMPUS',
    TITLE: 'Meet our host',
    NAME: 'Mar Baselios College of Engineering and Technology',
    // TODO(team): replace once the venue, hall and address are confirmed.
    NOTE: 'YESS 2026 gathers here. Venue details will be announced soon.',
    PHOTO_ALT: 'The main building of Mar Baselios College of Engineering and Technology, with a statue of Christ above the entrance arch.',
    // TODO(team): add the host's official site, e.g. { href: "https://…", label: "Visit the campus site" }.
    // The link stays hidden while this is null.
    LINK: null,
  },
};
