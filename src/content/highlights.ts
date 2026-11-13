/**
 * Highlights of YESS 25: the eleven photographs in assets/yess25, with their native pixel size.
 * A frame is never drawn larger than its file (see `maxW` in src/render/sections.ts), so the four
 * small files (08 to 11) are shown as smaller plates, not stretched.
 */
export interface Photo { file: string; w: number; h: number; alt: string }

export const HIGHLIGHTS: Photo[] = [
  { file: "yess25-01.webp", w: 1800, h: 1200, alt: "Students seated at wooden desks listening closely to a session, one resting his chin on his hand." },
  { file: "yess25-02.webp", w: 1800, h: 1200, alt: "Students gathered around a laptop covered in stickers, one of them pointing at the screen." },
  { file: "yess25-03.webp", w: 1800, h: 1200, alt: "A full lecture hall of students at their desks, several of them smiling." },
  { file: "yess25-04.webp", w: 1800, h: 1200, alt: "A large group of participants posing together and cheering in front of the stage." },
  { file: "yess25-05.webp", w: 1800, h: 1013, alt: "The evening concert seen from the back: a crowd facing a stage crossed by beams of light." },
  { file: "yess25-06.webp", w: 1800, h: 1200, alt: "Guests on stage presenting a framed memento during the felicitation." },
  { file: "yess25-07.webp", w: 1800, h: 1200, alt: "Guests lighting a traditional lamp on stage to open the event." },
  { file: "yess25-08.webp", w: 820, h: 461, alt: "A speaker in a dark jacket addressing the audience from a wooden lectern." },
  { file: "yess25-09.webp", w: 741, h: 470, alt: "A speaker in a white shirt and dark waistcoat speaking from the lectern." },
  { file: "yess25-10.webp", w: 705, h: 430, alt: "Performers on stage under coloured lights: singers with raised arms and a bass guitarist." },
  { file: "yess25-11.webp", w: 706, h: 465, alt: "A vocalist singing on stage with two dancers beside her and a bassist to the right." },
];
