/**
 * The programme. NOT CONFIRMED YET, so this list is empty and the site shows the sealed
 * "Programme to be announced" state between the opening and closing hours from CONFIG.
 *
 * To publish the programme, add sessions here and rebuild. Nothing else needs to change.
 * Times are local to the venue (IST), 24-hour "HH:MM".
 *
 *   { start: "09:30", end: "10:15", title: "Session title", by: "Speaker name, role", track: "Main hall" }
 */
export interface Session {
  start: string;
  end: string;
  title: string;
  by?: string;
  track?: string;
}

export const PROGRAMME: Session[] = [];
