// GLSL for the emerald smoke. Colours derive only from the brand palette:
// #033112 forest, #06FF67 signal, #000000, #FFFFFF, on a #0b0b0b ground.

const HEADER = `#version 300 es
precision highp float;
`;

export const FULLSCREEN_VS = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

// Flow field: R = stream function, G = clearing, BA = accumulated displacement.
// Velocity is the curl of the stream function, so it is always divergence-free:
// a moving pointer pushes smoke ahead of it and rolls it back around both sides.
export const FLOW_FS = HEADER + `
in vec2 vUv;
out vec4 o;
uniform sampler2D uPrev;
uniform vec2 uTexel;
uniform vec2 uPointer;   // uv
uniform vec2 uPointerV;  // height units per second
uniform float uAspect;
uniform float uDt;

vec2 velocity(vec2 uv) {
  float dx = texture(uPrev, uv + vec2(uTexel.x, 0.0)).r - texture(uPrev, uv - vec2(uTexel.x, 0.0)).r;
  float dy = texture(uPrev, uv + vec2(0.0, uTexel.y)).r - texture(uPrev, uv - vec2(0.0, uTexel.y)).r;
  return vec2(dy / (2.0 * uTexel.y), -dx / (2.0 * uTexel.x * uAspect));
}

void main() {
  vec2 v = velocity(vUv);
  float vLen = length(v);
  if (vLen > 0.9) v *= 0.9 / vLen;

  vec2 back = vUv - v * uDt * vec2(1.0 / uAspect, 1.0);
  vec4 s = texture(uPrev, back);

  // A little diffusion keeps the field smooth: fog noise amplifies any roughness in it.
  vec4 around = texture(uPrev, back + vec2(uTexel.x, 0.0)) + texture(uPrev, back - vec2(uTexel.x, 0.0))
              + texture(uPrev, back + vec2(0.0, uTexel.y)) + texture(uPrev, back - vec2(0.0, uTexel.y));
  s = mix(s, around * 0.25, 0.22);

  s.r *= exp(-uDt * 1.1);
  s.g *= exp(-uDt * 0.55);
  s.ba = (s.ba + v * uDt) * exp(-uDt * 0.34);
  float reach = length(s.ba);
  if (reach > 0.2) s.ba *= 0.2 / reach;

  vec2 d = (vUv - uPointer) * vec2(uAspect, 1.0);
  float speed = length(uPointerV);
  float g = exp(-dot(d, d) / (0.12 * 0.12));
  vec2 perp = vec2(-uPointerV.y, uPointerV.x);
  s.r += dot(perp, d) * g * uDt * 5.5;
  s.g = min(s.g + g * min(speed, 1.2) * uDt * 2.6, 1.0);

  o = s;
}`;

// Fog: two domain-warped fbm layers, lit from below, wrapped around a dark arch.
export const FOG_FS = HEADER + `
in vec2 vUv;
out vec4 o;
uniform sampler2D uFlow;
uniform float uTime;
uniform float uAspect;
uniform float uDensity;
uniform float uArch;      // 0 = open smoke, 1 = arch and quiet pocket around the focus
uniform float uDim;       // overall smoke brightness, lowered under reading text
uniform vec4 uLogo;      // centre xy, half size zw, in height units from screen centre

const vec3 GROUND = vec3(0.0431);                  // #0b0b0b
const vec3 FOREST = vec3(0.0118, 0.1922, 0.0706);  // #033112
const vec3 SIGNAL = vec3(0.0235, 1.0, 0.4039);     // #06FF67
const mat2 ROT = mat2(0.8, 0.6, -0.6, 0.8);

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm3(vec2 p) {
  float s = 0.5 * noise(p);
  p = ROT * p * 2.03 + 11.7;
  s += 0.25 * noise(p);
  p = ROT * p * 2.01 + 5.3;
  return (s + 0.125 * noise(p)) / 0.875;
}

float fbm5(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) {
    s += a * noise(p);
    p = ROT * p * 2.02 + 7.1;
    a *= 0.5;
  }
  return s / 0.96875;
}

// Warp twice, so ridges fold into curling filaments instead of round clouds.
float wisps(vec2 p, float t, float seed) {
  vec2 q = vec2(fbm3(p + vec2(seed, t * 0.70)),
                fbm3(p + vec2(5.2 + seed, 1.3 - t * 0.55)));
  vec2 r = vec2(fbm3(p + 3.1 * q + vec2(1.7 + t * 0.40, 9.2)),
                fbm3(p + 3.1 * q + vec2(8.3, 2.8 - t * 0.30)));
  float n = fbm5(p + 3.3 * r);
  float ridge = 1.0 - abs(2.0 * fbm3(p * 1.3 + 1.7 * r + seed) - 1.0);
  return mix(n, n * (0.55 + 0.75 * ridge * ridge), 0.65);
}

// Signed distance to a pointed arch, from its half width, spring line and apex height.
// The arcs' radius is solved from those three, so it fits any screen shape.
float archSdf(vec2 p, float halfWidth, float spring, float apex) {
  if (p.y < spring) return abs(p.x) - halfWidth;
  float h = apex - spring;
  float radius = (h * h + halfWidth * halfWidth) / (2.0 * halfWidth);
  float c = radius - halfWidth;
  return max(length(p - vec2(-c, spring)) - radius, length(p - vec2(c, spring)) - radius);
}

void main() {
  vec2 P = (vUv - 0.5) * vec2(uAspect, 1.0);
  vec4 flow = texture(uFlow, vUv);
  vec2 p = P - flow.ba;
  float t = uTime;

  float back  = wisps(p * 1.05 + vec2(t * 0.005, -t * 0.009), t * 0.011, 3.1);
  float front = wisps(p * 1.95 + vec2(-t * 0.007, -t * 0.019), t * 0.016, 7.7);

  // Light travels up and in from the base of the arch.
  vec2 toLight = normalize(vec2(-P.x * 0.6, -0.5 - P.y) + 1e-4);
  float frontLit = wisps((p + toLight * 0.022) * 1.95 + vec2(-t * 0.007, -t * 0.019), t * 0.016, 7.7);
  float edge = clamp((front - frontLit) * 7.5 + 0.12, 0.0, 1.0);

  // Composition: smoke pools low and at the flanks, thins toward the crown.
  float low = smoothstep(0.78, 0.02, vUv.y);
  float flank = smoothstep(0.18, 0.95, abs(P.x) / max(uAspect * 0.5, 0.42));
  float envelope = 0.38 + 0.62 * clamp(low * 0.95 + flank * 0.6, 0.0, 1.0);

  float amount = mix(0.62, 1.32, uDensity) * mix(0.58, 1.0, smoothstep(0.55, 1.25, uAspect));
  float body = smoothstep(0.30, 0.74, back) * envelope * amount;
  float wisp = smoothstep(0.34, 0.68, front) * envelope * amount;

  // The arch: smoke presses against it from outside, with an uneven worn edge.
  vec2 aP = P - vec2(uLogo.x, 0.0);
  aP += (vec2(fbm3(p * 2.4 + t * 0.012), fbm3(p * 2.4 + 9.0 - t * 0.012)) - 0.5) * 0.11;
  float archHalf = min(max(uLogo.z * 1.4, 0.30), uAspect * 0.5 - 0.012);
  float arch = archSdf(aP, archHalf, uLogo.y - 0.62 * archHalf, 0.44);
  float inside = (1.0 - smoothstep(-0.14, 0.04, arch)) * uArch;
  float rim = exp(-max(arch, 0.0) * 7.5) * smoothstep(-0.05, 0.015, arch) * uArch;

  // Floor fog rolls in through the base of the arch.
  float floorFog = smoothstep(-0.20, -0.46, P.y);
  inside *= 1.0 - floorFog * 0.85;

  // Keep a quiet pocket around the lockup, so it stays crisp.
  vec2 lq = (P - uLogo.xy) / max(uLogo.zw * vec2(1.55, 2.1), vec2(0.001));
  float pocket = mix(1.0, smoothstep(0.55, 1.35, length(lq)), uArch);

  float clearing = 1.0 - 0.86 * smoothstep(0.0, 0.85, flow.g);
  float hush = mix(0.22, 1.0, 1.0 - inside) * mix(0.10, 1.0, pocket) * clearing;

  float height = smoothstep(1.05, -0.05, vUv.y);
  float glow = (0.32 + 0.68 * height) * (0.42 + 1.05 * rim);

  vec3 col = FOREST * (body * 1.15 + wisp * 0.85) * hush * 1.15;
  col += mix(FOREST, SIGNAL, 0.46) * wisp * wisp * edge * glow * hush * 1.05;
  col += SIGNAL * pow(wisp, 3.0) * edge * edge * rim * hush * 0.85;
  col += FOREST * rim * (1.0 - inside) * (0.34 + 0.8 * back) * clearing * 1.25;
  col += mix(FOREST, SIGNAL, 0.3) * pow(rim, 3.0) * smoothstep(0.34, 0.62, back) * clearing * 0.34;

  col = GROUND * (0.72 + 0.28 * pocket) + col * uDim;
  col = 1.0 - exp(-col * 1.25);
  o = vec4(sqrt(col), 1.0);  // stored in sqrt space to keep the shadows free of bands
}`;

// Composite at display resolution: vignette, dither and film grain.
export const COMPOSITE_FS = HEADER + `
in vec2 vUv;
out vec4 o;
uniform sampler2D uFog;
uniform float uTime;
uniform float uAspect;
uniform float uGrain;
uniform float uReveal;    // preloader wipe: 0 = black curtain, 1 = fully open

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float tatters(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) {
    vec2 f = fract(p), i2 = floor(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    s += a * mix(mix(hash(i2), hash(i2 + vec2(1.0, 0.0)), u.x),
                 mix(hash(i2 + vec2(0.0, 1.0)), hash(i2 + vec2(1.0, 1.0)), u.x), u.y);
    p = p * 2.03 + 3.7;
    a *= 0.5;
  }
  return s;
}

void main() {
  vec3 c = texture(uFog, vUv).rgb;
  c *= c;

  // The curtain is eaten outward from the centre along a torn noise edge.
  if (uReveal < 1.0) {
    vec2 r = (vUv - 0.5) * vec2(uAspect, 1.0);
    float reach = uReveal * (length(vec2(uAspect, 1.0)) * 0.5 + 0.5);
    float torn = length(r) + (tatters(r * 3.2 + 4.0) - 0.47) * 0.42;
    c *= smoothstep(0.0, 0.16, reach - torn);
  }

  vec2 q = (vUv - 0.5) * vec2(min(uAspect, 1.6) / 1.6, 1.0) * 2.0;
  float vignette = smoothstep(1.55, 0.35, length(q * vec2(0.92, 1.02)));
  c *= mix(0.05, 1.0, vignette * vignette);

  vec2 fc = gl_FragCoord.xy + floor(uTime * 18.0) * vec2(37.0, 17.0);
  float n = hash(fc) - 0.5;
  c = sqrt(max(c, 0.0));                       // grain and dither read best in sqrt space
  c += n * (uGrain * (0.55 + 0.9 * c.g) + 1.5 / 255.0);
  o = vec4(c * c, 1.0);
}`;

// Embers and dust: rising points, pushed by the same flow field as the smoke.
export const EMBER_VS = `#version 300 es
precision highp float;
uniform sampler2D uFlow;
uniform float uTime;
uniform float uAspect;
uniform float uPx;
uniform vec4 uLogo;
out float vAlpha;
out float vHot;

float h(float n) { return fract(sin(n) * 43758.5453); }

void main() {
  float id = float(gl_VertexID);
  float s1 = h(id * 1.13 + 0.1), s2 = h(id * 2.37 + 0.2), s3 = h(id * 3.91 + 0.3), s4 = h(id * 5.71 + 0.4);
  float hot = pow(s2, 7.0);

  float life = fract(uTime * mix(0.010, 0.034, s4) + s1);
  vec2 uv = vec2(s3 + 0.028 * sin(uTime * (0.09 + 0.2 * s4) + id) + 0.011 * sin(uTime * 0.41 + id * 2.0),
                 life * 1.12 - 0.06);
  uv += texture(uFlow, clamp(uv, 0.0, 1.0)).ba * vec2(1.0 / uAspect, 1.0) * 1.3;

  vec2 P = (uv - 0.5) * vec2(uAspect, 1.0);
  vec2 lq = (P - uLogo.xy) / max(uLogo.zw * vec2(1.25, 1.7), vec2(0.001));
  float clearOfLogo = smoothstep(0.75, 1.2, length(lq));

  float fade = smoothstep(0.0, 0.14, life) * smoothstep(1.0, 0.62, life);
  float flicker = 0.62 + 0.38 * sin(uTime * (0.55 + 1.9 * s1) + id * 3.0);

  vAlpha = fade * flicker * clearOfLogo * mix(0.20, 1.0, hot);
  vHot = hot;
  gl_PointSize = uPx * mix(1.15, 3.4, hot);
  gl_Position = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
}`;

export const EMBER_FS = HEADER + `
in float vAlpha;
in float vHot;
out vec4 o;
const vec3 SIGNAL = vec3(0.0235, 1.0, 0.4039);
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float disc = smoothstep(1.0, 0.15, r);
  vec3 col = mix(mix(vec3(0.0118, 0.1922, 0.0706), SIGNAL, 0.55), mix(SIGNAL, vec3(1.0), 0.28), vHot);
  o = vec4(col * disc * vAlpha, 1.0);
}`;
