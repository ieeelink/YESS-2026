// The hall: an analytic ray-cast (planes, two arcs for the vault, one end wall), no geometry and no textures.
// Everything is in metres. Shared helpers (noise, fire(), finish()) are prepended from src/gl/common.ts.
export const HALL_FRAG = /* glsl */ `
uniform vec3 uRo, uFw, uLD;
uniform vec2 uShift, uSafe;
uniform float uF, uSun, uCasc, uFlash, uDoor, uFlood, uKey;
uniform vec3 uKeyT;       // where the shaft from the oculus lands

// the hall, in metres. Nave between two rows of piers, aisles beyond, tall slots in the right-hand aisle wall.
const float BAY = 6.0;     // pier to pier
const float PD = 1.7;      // pier depth along the hall
const float XP = 4.2;      // pier face
const float PW = 1.4;      // pier width
const float XW = 9.0;      // aisle wall
const float HS = 5.6;      // arcade springing
const float RISE = 3.2;
const float YS = 12.5;     // vault springing
const float ZEND = 96.0;   // the end wall and its portal
const float HA = 9.6;      // portal height
const float WA = 2.9;      // portal half width
#ifdef HIGH
#define VS 30
#else
#define VS 20
#endif

float archTop(float zc){
  float a = abs(2.0 * (zc - PD) / (BAY - PD) - 1.0);
  float k = a + 0.25;
  return HS + RISE * sqrt(max(1.5625 - k * k, 0.0)) / 1.2247;
}
// what one slot lets through: every bay is different, a few are shuttered
vec2 slot(float bi){ float h = hash11(bi * 7.13 + 2.0); return vec2(mix(0.5, 1.05, hash11(bi * 3.7 + 1.0)), step(0.2, h) * (0.35 + 0.65 * h)); }
float cascade(float z){
  float d = ZEND - z;
  return (1.0 - smoothstep(uCasc - 3.0, uCasc, d)) * (1.0 + 1.6 * exp(-abs(d - uCasc) / 5.0));
}
// direct light at a point: trace back to the slot it came through, then past the piers
float sunS(vec3 P, float e){
  if (P.z > ZEND || P.x > XW) return 0.0;
  vec3 W = P - uLD * ((XW - P.x) / -uLD.x);
  float bi = floor(W.z / BAY), zc = W.z - bi * BAY;
  vec2 sl = slot(bi);
  float w = smoothstep(sl.x + 0.14 + e, sl.x - 0.14 - e, abs(zc - (PD + BAY) * 0.5)) * smoothstep(2.2 - e, 2.8 + e, W.y) * (1.0 - smoothstep(9.6 - e, 10.4 + e, W.y));
  w *= sl.y * cascade(W.z);
  if (P.x < XP) {
    vec3 A = P - uLD * ((XP - P.x) / -uLD.x);
    float bz = mod(A.z, BAY);
    w *= smoothstep(PD - 0.02 - e, PD + 0.12 + e, bz) * (1.0 - smoothstep(BAY - 0.12 - e, BAY, bz)) * (1.0 - smoothstep(-0.2 - e, 0.2 + e, A.y - archTop(max(bz, PD))));
  }
  return w;
}
float sun(vec3 P){ return sunS(P, 0.0); }
vec3 shade(vec3 P, vec3 n, vec3 alb, float rim){
  float d = sun(P + n * 0.04) * max(dot(n, -uLD), 0.0) * uSun;
  float bounce = (0.10 + 0.9 * exp(-max(P.y, 0.0) * 0.22)) * min(uSun, 1.2);
  vec3 c = alb * (0.42 + 0.6 * (0.5 + 0.5 * n.y));
  c += alb * (FOREST * 11.0 + SIGNAL * 0.5) * bounce;
  c += (SIGNAL * 0.9 + 0.22) * d * (alb * 30.0 + 0.10);
  c += SIGNAL * rim * min(uSun, 1.3);
  c += (FOREST * 2.0 + SIGNAL * 0.5) * alb * 6.0 * uDoor * exp(-(ZEND - P.z) / 30.0) * max(-n.z, 0.15);   // light from the open doors
  return c;
}
float flutes(float u, float n){ return pow(abs(sin(u * 3.1416 * n)), 0.7); }
// horizontal mouldings shared by pier faces: plinth, astragal, capital
float mould(float y){
  float m = 1.0;
  m *= 1.0 - 0.45 * smoothstep(0.06, 0.0, abs(y - 0.85)) - 0.3 * smoothstep(0.05, 0.0, abs(y - 0.28));
  m *= 1.0 - 0.45 * smoothstep(0.06, 0.0, abs(y - (HS - 0.75))) - 0.45 * smoothstep(0.05, 0.0, abs(y - (HS - 0.2)));
  return m;
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 q = frag / uRes;
  vec2 uv = (frag - 0.5 * uRes) / uRes.y - uShift;
  vec3 rt = normalize(vec3(uFw.z, 0.0, -uFw.x));
  vec3 up = cross(uFw, rt);
  vec3 rd = normalize(uFw * uF + rt * uv.x + up * uv.y);
  vec3 ro = uRo;
  vec3 fogCol = vec3(0.004, 0.012, 0.008);
  vec3 col = fogCol; float T = 160.0; float emis = 0.0;

  float tF = rd.y < -1e-4 ? -ro.y / rd.y : 1e5;
  float tE = rd.z > 1e-4 ? (ZEND - ro.z) / rd.z : 1e5;
  float sx = rd.x >= 0.0 ? 1.0 : -1.0;
  float tS = abs(rd.x) > 1e-5 ? (sx * XP - ro.x) / rd.x : 1e5;
  float t0 = min(tF, tE);
  int what = 0;             // 1 floor, 2 end wall, 3 pier side, 4 upper wall, 5 pier front, 6 aisle wall, 7 vault
  vec3 P = ro + rd * t0;
  if (tS < t0) {
    vec3 S = ro + rd * tS;
    if (S.y > YS) {
      // vault: two arcs meeting at a ridge. The ray leaves the pointed section at the nearer of the two far roots.
      const float CV = 2.6; float R = XP + CV;
      float a = dot(rd.xy, rd.xy);
      vec2 o1 = ro.xy - vec2(-CV, YS), o2 = ro.xy - vec2(CV, YS);
      float b1 = dot(o1, rd.xy), b2 = dot(o2, rd.xy);
      float tV = min((-b1 + sqrt(max(b1 * b1 - a * (dot(o1, o1) - R * R), 0.0))) / a, (-b2 + sqrt(max(b2 * b2 - a * (dot(o2, o2) - R * R), 0.0))) / a);
      if (tV < tE) { what = 7; T = tV; P = ro + rd * tV; } else { what = 2; T = tE; P = ro + rd * tE; }
    } else {
      float bz = mod(S.z, BAY);
      if (bz < PD) { what = 3; T = tS; P = S; }
      else if (S.y > archTop(bz)) { what = 4; T = tS; P = S; }
      else {
        float zN = (floor(S.z / BAY) + 1.0) * BAY;
        float tZ = rd.z > 1e-4 ? (zN - ro.z) / rd.z : 1e5;
        vec3 Q = ro + rd * tZ;
        float tW = (sx * XW - ro.x) / rd.x;
        if (tZ < t0 && abs(Q.x) < XP + PW) { what = 5; T = tZ; P = Q; }
        else if (tW < t0) { what = 6; T = tW; P = ro + rd * tW; }
        else if (tF < tE) { what = 1; T = tF; } else { what = 2; T = tE; }
      }
    }
  } else if (tF < tE) { what = 1; T = tF; } else if (tE < 1e4) { what = 2; T = tE; }

  float soft = clamp(T * 0.004, 0.0, 0.12);                 // distant detail softens: cheap depth of field
  if (what == 1) {
    vec2 g = P.xz / vec2(1.6, 3.2); g.x += 0.5 * floor(g.y);
    vec2 gf = abs(fract(g) - 0.5);
    float joint = smoothstep(0.5, 0.5 - 0.02 - T * 0.002, max(gf.x, gf.y));
    float tone = 0.65 + 0.5 * hash21(floor(g)) * 0.6 + 0.2 * fbm3(P.xz * 1.9);
    col = shade(P, vec3(0.0, 1.0, 0.0), vec3(0.040, 0.050, 0.045) * tone, 0.0) * (0.45 + 0.55 * joint);
    float gapW = uDoor * WA + (ZEND - P.z) * 0.22;
    col += fire(uDoor * 1.1 * exp(-(ZEND - P.z) / 16.0) * smoothstep(gapW, gapW * 0.3, abs(P.x))) * (0.5 + 0.5 * joint);
    float kd = length((P.xz - uKeyT.xz) * vec2(1.0, 0.55));
    col += fire(uKey * 0.95 * smoothstep(3.0, 0.4, kd)) * (0.45 + 0.55 * joint) * tone;
  } else if (what == 3 || what == 5) {
    float u = what == 3 ? mod(P.z, BAY) / PD : (abs(P.x) - XP) / PW;
    vec3 n = what == 3 ? vec3(-sx, 0.0, 0.0) : vec3(0.0, 0.0, -1.0);
    float shaftZone = step(0.85, P.y) * step(P.y, HS - 0.75);
    float fl = mix(1.0, flutes(u, 5.0), shaftZone * (1.0 - soft * 6.0));
    // flutes turn the surface: bend the normal so light rakes across them
    float bend = cos(u * 3.1416 * 5.0) * shaftZone * 0.7;
    n = normalize(n + (what == 3 ? vec3(0.0, 0.0, bend) : vec3(bend, 0.0, 0.0)));
    float edge = smoothstep(0.10, 0.0, min(u, 1.0 - u));
    float tone = 0.7 + 0.3 * fbm3(vec2(u * 3.0 + floor(P.z / BAY) * 5.0, P.y * 1.3));
    vec3 alb = vec3(0.030, 0.036, 0.033) * tone * (0.5 + 0.5 * fl) * mould(P.y);
    float rim = edge * 0.07 * exp(-T * 0.03) * (0.4 + 0.6 * step(0.0, what == 3 ? sx : -1.0));
    col = shade(P, n, alb, rim + (1.0 - shaftZone) * 0.004);
  } else if (what == 4) {
    float bz = mod(P.z, BAY);
    float at = archTop(max(bz, PD));
    float tone = 0.7 + 0.3 * fbm3(vec2(P.z * 0.7, P.y * 0.9));
    float m = 1.0;
    m *= 1.0 - 0.5 * exp(-(P.y - at) / 0.18) * step(PD, bz);                                  // arch moulding
    m *= 1.0 + 0.6 * smoothstep(0.12, 0.0, abs(P.y - 9.35)) - 0.4 * smoothstep(0.08, 0.0, abs(P.y - 9.6));
    float tz = fract(bz / (BAY / 4.0)) - 0.5;                                                  // blind arcade above
    float rec = step(abs(tz), 0.34) * step(9.9, P.y) * step(P.y, 11.7 - tz * tz * 6.0);
    m *= 1.0 - 0.6 * rec;
    m *= 1.0 + 0.35 * step(bz, PD) * flutes(bz / PD, 3.0);                                     // the pier carries on up as a shaft
    col = shade(P, vec3(-sx, 0.0, 0.0), vec3(0.026, 0.031, 0.029) * tone * m, 0.0);
  } else if (what == 6) {
    float bi = floor(P.z / BAY), zc = P.z - bi * BAY;
    vec2 sl = slot(bi);
    float win = smoothstep(sl.x + 0.05, sl.x - 0.05, abs(zc - (PD + BAY) * 0.5)) * step(2.4, P.y) * step(P.y, 10.0) * step(0.0, sx);
    float glow = win * sl.y * cascade(P.z) * uSun;
    col = shade(P, vec3(-sx, 0.0, 0.0), vec3(0.022, 0.027, 0.025) * (0.7 + 0.3 * fbm3(P.zy * 0.8)), 0.0);
    col += fire(glow * 0.8 * smoothstep(0.05, 0.35, abs(rd.x)));        // seen edge-on a slot is only a sliver: let it fade
  } else if (what == 7) {
    float s = P.x / XP;
    float bz = mod(P.z, BAY);
    float rib = smoothstep(0.34, 0.26, abs(bz - 0.4));                                         // transverse rib over each pier
    float d1 = abs(fract(P.z / BAY + s * 0.5 - 0.07) - 0.5), d2 = abs(fract(P.z / BAY - s * 0.5 - 0.07) - 0.5);
    float diag = smoothstep(0.035 + soft, 0.02, min(d1, d2));
    float ridge = smoothstep(0.05, 0.02, abs(s));
    float r = max(rib, max(diag, ridge) * 0.7);
    vec3 n = normalize(vec3(-s * 0.8, -1.0, 0.0));
    col = shade(P, n, vec3(0.016, 0.020, 0.018) * (0.55 + 0.9 * r) * (0.7 + 0.3 * fbm3(P.xz * 0.5)), 0.0);
  } else if (what == 2) {
    vec2 p = P.xy;
    float s = p.y / HA + p.x * p.x / (WA * WA);                                               // < 1 inside the portal
    float g = uDoor * WA * 1.03;
    float ax = abs(p.x);
    vec3 n = vec3(0.0, 0.0, -1.0);
    if (s < 1.0 && ax < g) {
      float ray = 0.55 + 0.45 * fbm3(vec2(p.x * 1.3, p.y * 0.12 + uTime * 0.04));
      col = fire(0.85 + 0.45 * ray * exp(-ax / (g + 0.4))); emis = 1.0;
    } else if (s < 1.0) {
      // door leaves: forged plates, seams, studs, and lines cut into the metal
      float lx = ax - g;
      vec2 pc = vec2(lx / 0.98, p.y / 1.92), pf = fract(pc);
      float seam = max(smoothstep(0.035, 0.0, min(pf.x, 1.0 - pf.x) * 0.98), smoothstep(0.03, 0.0, min(pf.y, 1.0 - pf.y) * 1.92));
      float stud = smoothstep(0.07, 0.04, length((pf - vec2(0.12, 0.08)) * vec2(0.98, 1.92))) + smoothstep(0.07, 0.04, length((pf - vec2(0.88, 0.08)) * vec2(0.98, 1.92)));
      float row = p.y * 5.0, ri = floor(row);
      float runOn = step(0.45, hash21(vec2(ri, floor(lx * 1.6))));
      float cut = smoothstep(0.10, 0.03, abs(fract(row) - 0.5)) * runOn * step(0.12, pf.x) * step(pf.x, 0.88);
      float node = smoothstep(0.22, 0.14, length(vec2(fract(lx * 1.6) - 0.5, (fract(row) - 0.5) * 0.32) * vec2(1.0, 3.0))) * runOn;
      float tone = 0.6 + 0.4 * fbm3(p * 2.3 + 4.0);
      vec3 alb = vec3(0.011, 0.013, 0.013) * tone * (1.0 - 0.6 * seam) * (1.0 - 0.35 * cut) + vec3(0.02) * stud;
      col = shade(P, n, alb, 0.0);
      col += SIGNAL * max(cut, node) * (0.012 + 0.35 * uFlash + 0.25 * uDoor) * exp(-s * 0.5);
      col += fire(uDoor * 1.4 * exp(-lx / 0.22));                                             // the meeting edges catch what is behind them
      col *= 1.0 - 0.35 * smoothstep(0.92, 1.0, s);                                           // shadow where the leaf meets the reveal
    } else {
      float o = s - 1.0;
      if (o < 0.45) {
        // three stepped orders around the opening, each catching a line of light
        float f = fract(o / 0.15), band = floor(o / 0.15);
        vec3 alb = vec3(0.024, 0.029, 0.027) * (0.45 + 0.45 * band) * (0.35 + 0.65 * f) * (0.75 + 0.25 * fbm3(p * 1.5));
        col = shade(P, n, alb, smoothstep(0.12, 0.0, f) * (0.10 + 0.10 * band));
        col += fire(uDoor * 0.9 * exp(-o * 4.0));
      } else {
        vec2 g2 = p / vec2(2.4, 1.2); g2.x += 0.5 * floor(g2.y);
        vec2 gf = abs(fract(g2) - 0.5);
        float joint = smoothstep(0.5, 0.47, max(gf.x, gf.y));
        col = shade(P, n, vec3(0.022, 0.027, 0.025) * (0.7 + 0.3 * hash21(floor(g2))) * (0.6 + 0.4 * joint), 0.0);
        // oculus high in the gable: a ring and spokes, barely glowing
        vec2 oc = p - vec2(0.0, 16.3); float orr = length(oc);
        float ringm = smoothstep(0.12, 0.04, abs(orr - 1.45)) + smoothstep(0.1, 0.03, abs(orr - 0.5));
        float spoke = smoothstep(0.06, 0.02, abs(fract(atan(oc.y, oc.x) * 1.9099 + 0.5) - 0.5) * orr) * step(0.5, orr) * step(orr, 1.45);
        float glass = step(orr, 1.45) * (1.0 - max(ringm, spoke));
        col = mix(col, FOREST * (0.35 + 0.5 * min(uSun, 1.5)) * (0.6 + 0.4 * fbm3(oc * 3.0)) + fire(min(uKey, 1.2) * 0.95), glass);
        col = mix(col, vec3(0.012, 0.016, 0.014), max(ringm, spoke) * step(orr, 1.6));
      }
    }
  }

  // air: depth fog with a heavier layer lying on the floor
  if (emis < 0.5) {
    float fogA = 1.0 - exp(-T * 0.013 - T * 0.012 * exp(-max(P.y, 0.0) * 0.45));
    col = mix(col, fogCol + FOREST * 0.22 * min(uSun, 1.2), clamp(fogA, 0.0, 1.0));
  }
  // light standing in that air: march the ray, ask each point whether a slot can see it
  float acc = 0.0, door = 0.0, key = 0.0;
  vec3 K0 = vec3(0.0, 16.3, ZEND - 0.3), kax = normalize(uKeyT - K0);
  float tm = min(T, 64.0), dt = tm / float(VS), tt = dt;
#ifdef HIGH
  tt *= fract(52.9829189 * fract(dot(frag + mod(floor(uTime * 24.0), 8.0) * 5.3, vec2(0.06711056, 0.00583715))));
#else
  tt *= fract(52.9829189 * fract(dot(frag, vec2(0.06711056, 0.00583715))));
#endif
  for (int i = 0; i < VS; i++) {
    vec3 a = ro + rd * tt;
    float dens = (0.40 + 0.95 * vnoise(a.xz * 0.33 + vec2(uTime * 0.05, a.y * 0.55))) * (1.0 + 1.3 * exp(-max(a.y, 0.0) * 0.5));
    float fall = exp(-tt * 0.013);
    #ifdef HIGH
    acc += sunS(a, 0.8) * dens * dt * fall;
#else
    acc += sunS(a, 1.3) * dens * dt * fall;
#endif
    float al = dot(a - K0, kax); float kr = 0.7 + al * 0.085;
    key += smoothstep(kr, kr * 0.25, length(a - K0 - kax * al)) * step(0.0, al) * dens * dt * fall;
    float gw = uDoor * WA + (ZEND - a.z) * 0.30;
    door += uDoor * smoothstep(gw, gw * 0.2, abs(a.x)) * exp(-(ZEND - a.z) / 20.0) * step(a.y, HA * 1.1) * dens * dt * fall;
    tt += dt;
  }
  acc *= uSun;
  col += fire(acc * 0.20) + fire(door * 0.10);

  // dust: sharp motes that only show where they cross a beam, and a few soft discs close to the lens
  vec2 sc = frag / uRes.y;
  for (int i = 0; i < 2; i++) {
    float k = i == 0 ? 22.0 : 40.0;
    vec2 g = sc * k + vec2(uTime * 0.035, uTime * (0.05 + 0.03 * float(i))) + ro.xz * 0.3;
    vec2 id = floor(g); vec2 f = fract(g) - 0.5;
    vec2 o = (hash22(id + float(i) * 31.0) - 0.5) * 0.8;
    float keep = step(0.90, hash21(id * 1.7 + 5.0));
    float tw = 0.6 + 0.4 * sin(uTime * 2.0 + hash21(id) * 40.0);
    col += fire(exp(-dot(f - o, f - o) * (i == 0 ? 1300.0 : 2000.0)) * keep * tw * (0.10 + min(acc, 20.0) * 0.16));
  }
  {
    vec2 g = sc * 4.2 + vec2(uTime * 0.01, uTime * 0.016) + ro.xz * 0.12;
    vec2 id = floor(g); vec2 f = fract(g) - 0.5;
    vec2 o = (hash22(id + 3.0) - 0.5) * 0.6; float r = 0.10 + 0.12 * hash21(id + 2.0);
    col += FOREST * smoothstep(r, r * 0.8, length(f - o)) * step(0.86, hash21(id * 1.7 + 5.0)) * (0.05 + min(acc, 12.0) * 0.012);
  }

  col *= 1.0 + uFlash * 1.6;
  // the type column stays readable: the hall behind it drops a stop, the beams still pass through
  col *= mix(1.0, 0.55 + 0.45 * smoothstep(0.22, 0.50, q.x), uSafe.x);
  col *= mix(1.0, 0.14 + 0.86 * smoothstep(0.36, 0.58, q.y), uSafe.y);
  col += fire(key * mix(0.13, 0.22, uSafe.y) * uKey) * mix(1.0, 0.10 + 0.90 * smoothstep(0.36, 0.58, q.y), uSafe.y);                             // the oculus shaft is the one light allowed behind the lockup
  col = mix(col, fire(0.42 + 0.75 * fbm(uv * 1.3 + vec2(0.0, uTime * 0.06))), uFlood);
  gl_FragColor = vec4(finish(col, frag), 1.0);
}
`;
