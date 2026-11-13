import { clamp, easeIO, easeOut, smooth, stacked } from "../lib/env";

export type V3 = [number, number, number];
export interface Cam { ro: V3; fw: V3; shift: [number, number]; sun: number; casc: number }

// the hall, in metres (must match the constants in hall.frag.ts)
export const ZEND = 96, HA = 9.6, WA = 2.9, FOCAL = 1.25;

// the cut: black frames, the beat every cut lands on, and the final beat
export const CUTS: [number, number][] = [[0, 0.12], [1.72, 1.9], [3.42, 3.6], [5.22, 5.4]];
export const BEATS = [0.12, 1.9, 3.6, 5.4, 7.0];
export const T_LOGO = 7.0, T_OPEN = 7.15, T_END = 7.6;

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const norm = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; };
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const dir = (yaw: number, pitch: number): V3 => [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];

/** Where the camera rests once the intro is over: facing the arch, with the lens shifted so the arch sits right of the lockup. */
export function heroFrame() {
  const asp = innerWidth / innerHeight;
  return stacked()
    ? { ro: [0, 2.0, ZEND - 33] as V3, ta: [0, 5.2, ZEND] as V3, shift: [0, 0.215] as [number, number], key: [-1.2, 0, ZEND - 9] as V3 }
    : { ro: [-0.6, 1.85, ZEND - 30] as V3, ta: [0, 5.6, ZEND] as V3, shift: [Math.min(0.17 * asp, 0.34), -0.03] as [number, number], key: [-3.2, 0, ZEND - 17] as V3 };
}

/**
 * The whole shot list as a function of time.
 * c = seconds on the intro clock, t = wall time (for drift), p = scroll progress through the hero (0..1),
 * mx/my = where the viewer is leaning (-1..1).
 */
export function shot(c: number, t: number, p: number, mx: number, my: number): Cam {
  let ro: V3, fw: V3, shift: [number, number] = [0, 0], sun = 1, casc = 999;
  if (c < 1.9) {
    // 1: already moving, low and fast. The light slams on at 0.12s.
    const k = clamp((c - 0.12) / 1.6);
    ro = [-1.7, 1.15, 8 + k * 17]; fw = dir(0.10 - 0.05 * k, 0.11);
    sun = 1 + 1.2 * Math.exp(-Math.max(c - 0.12, 0) / 0.25);
  } else if (c < 3.6) {
    // 2: high under the vault; the light walks down the hall toward us
    const k = clamp((c - 1.9) / 1.52);
    ro = [1.3, 11.2 - 0.7 * k, 20 + 5 * k]; fw = dir(-0.07, -0.30 + 0.03 * k); casc = 14 + k * 150;
  } else if (c < 5.4) {
    // 3: a sideways truck across the nave
    const k = clamp((c - 3.6) / 1.62);
    ro = [-3.1 + 5.9 * k, 1.5, 44 + 2 * k]; fw = dir(-0.10 + 0.20 * k, 0.13);
  } else {
    // 4: the push to the arch. It never cuts again: this shot becomes the hero, and scrolling carries it through the doors.
    const h = heroFrame(), k = easeOut((c - 5.4) / 3.6);
    const s = easeIO((c - 6.0) / 2.6), push = easeIO((p - 0.10) / 0.74), un = 1 - easeIO(p / 0.5);
    ro = mix(mix([1.2, 3.6, ZEND - 56], h.ro, k), [0, 2.6, ZEND - 0.7], push);
    const ta = mix(mix([0, 6.5, ZEND], h.ta, k), [0, 3.4, ZEND + 30], push);
    shift = [h.shift[0] * s * un, h.shift[1] * s * un];
    // the side light is already on for the approach; the final beat belongs to the shaft from the oculus
    sun = c < T_LOGO ? 0.9 : 1 + 0.7 * Math.exp(-(c - T_LOGO) / 0.4);
    fw = norm(sub(ta, ro));
    const live = smooth(T_END, T_END + 1.5, c) * (1 - push);
    fw = norm([fw[0] + (Math.sin(t * 0.21) * 0.006 + mx * 0.018) * live, fw[1] + (Math.sin(t * 0.17 + 1) * 0.004 - my * 0.010) * live, fw[2]]);
    ro = [ro[0] + mx * 0.25 * live, ro[1], ro[2] + Math.sin(t * 0.13) * 0.15 * live];
  }
  return { ro, fw, shift, sun, casc };
}

/** World point -> CSS pixels, with the same lens as the shader. z is the distance in front of the camera. */
export function project(P: V3, cam: Cam): [number, number, number] {
  const rt = norm([cam.fw[2], 0, -cam.fw[0]]), up = cross(cam.fw, rt), v = sub(P, cam.ro), z = dot(v, cam.fw);
  return [((dot(v, rt) / z) * FOCAL + cam.shift[0]) * innerHeight + innerWidth / 2, innerHeight / 2 - ((dot(v, up) / z) * FOCAL + cam.shift[1]) * innerHeight, z];
}
