// GLSL shared by every scene: hashes, value noise, the brand colour ramp and the film finish.
export const COMMON_GLSL = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
const vec3 FOREST = vec3(0.012, 0.192, 0.071);
const vec3 SIGNAL = vec3(0.024, 1.0, 0.404);
float hash11(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), u.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p){
  float a = 0.5, s = 0.0; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < OCT; i++) { s += a * vnoise(p); p = m * p + 7.3; a *= 0.5; }
  return s;
}
float fbm3(vec2 p){
  float a = 0.5, s = 0.0; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 3; i++) { s += a * vnoise(p); p = m * p + 3.1; a *= 0.5; }
  return s;
}
vec3 fire(float x){
  x = max(x, 0.0);
  vec3 c = FOREST * 1.6 * smoothstep(0.0, 0.35, x);
  c = mix(c, SIGNAL, smoothstep(0.25, 1.0, x));
  c = mix(c, vec3(1.0), smoothstep(1.15, 2.4, x));
  return c * min(x * 1.4, 1.6);
}
vec3 finish(vec3 col, vec2 frag){
  vec2 q = frag / uRes;
  col *= 0.55 + 0.45 * pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.22);
  col = col / (1.0 + col * 0.35);
  col = pow(col, vec3(0.92));
  col += (hash21(frag + fract(uTime) * 91.0) - 0.5) * 0.022;
  return max(col, 0.0);
}
`;
