/**
 * PLACEHOLDER CONTENT. Everything in this file is a stand-in, flagged `placeholder: true`.
 * It exists so the Partners and FAQ sections can be designed and reviewed before the real
 * content is confirmed. Nothing here is a real sponsor, a real commitment or a real policy.
 *
 * HOW TO REPLACE
 * - Sponsors: replace each item's `name` with the organisation's name, add `logo` (a path under
 *   assets/, used exactly as supplied) and `url`, then delete `placeholder: true`. Add or remove
 *   items and tiers freely; the grid adapts. An empty tier is not shown.
 * - FAQ: replace `q` and `a` with the confirmed wording and delete `placeholder: true`.
 *   Answers may contain plain text only.
 * When no item is flagged any more, delete this notice.
 */
import { CONFIG } from "./config";

export interface Sponsor { name: string; logo?: string; url?: string; placeholder?: true }
export interface SponsorTier { tier: string; size: "l" | "m" | "s"; items: Sponsor[] }

export const SPONSOR_TIERS: SponsorTier[] = [
  { tier: "Title partner", size: "l", items: [{ name: "Title partner", placeholder: true }] },
  { tier: "Gold partners", size: "m", items: [
    { name: "Gold partner 01", placeholder: true },
    { name: "Gold partner 02", placeholder: true },
    { name: "Gold partner 03", placeholder: true },
  ] },
  { tier: "Silver partners", size: "s", items: [
    { name: "Silver partner 01", placeholder: true },
    { name: "Silver partner 02", placeholder: true },
    { name: "Silver partner 03", placeholder: true },
    { name: "Silver partner 04", placeholder: true },
  ] },
];

export interface Faq { q: string; a: string; placeholder?: true }

const when = `${CONFIG.DATE_DAY_MONTH} ${CONFIG.DATE_YEAR}`;

/** Answers use only confirmed facts (date, hours, venue, organisers) or say that details will be announced. */
export const FAQ: Faq[] = [
  { placeholder: true, q: "When and where is IEEE YESS 2026?",
    a: `${when}, at ${CONFIG.VENUE_NAME}, ${CONFIG.VENUE_CITY}. It is a single-day event, planned for 9:00 AM to 5:00 PM IST. The hours are provisional and will be confirmed here.` },
  { placeholder: true, q: "Who organizes it?",
    a: "IEEE YESS 2026 is organized by the IEEE LINK team under the IEEE Kerala Section." },
  { placeholder: true, q: "How do I register?",
    a: "Registration is not open yet. When it opens, the Register button on this page will take you to it." },
  { placeholder: true, q: "Who can attend?",
    a: "IEEE YESS is an annual IEEE gathering for engineering students. Who can register, and how, will be announced with registration." },
  { placeholder: true, q: "Is there a registration fee?",
    a: "Fee details will be announced when registration opens." },
  { placeholder: true, q: "What is on the programme?",
    a: "The programme, speakers and sessions will be announced on this page. The day runs from 9:00 AM to 5:00 PM IST." },
  { placeholder: true, q: "How do I get to the venue?",
    a: `The venue is ${CONFIG.VENUE_NAME}, ${CONFIG.VENUE_CITY}. Use the Get directions link in the Venue section. Travel details will be announced.` },
  { placeholder: true, q: "Who do I contact with a question?",
    a: "Contact details will be announced here." },
];
