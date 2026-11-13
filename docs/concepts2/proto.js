/* Shared runtime for the live hero prototypes: quality tier, WebGL quad, frame loop, countdown. */
(function () {
  const q = new URLSearchParams(location.search);
  const coarse = matchMedia("(pointer: coarse)").matches;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mem = navigator.deviceMemory || 8, cores = navigator.hardwareConcurrency || 8;

  // tier: "high" laptops/desktops, "low" phones and weak machines, "still" = one frame, no loop
  let tier = coarse || mem <= 4 || cores <= 4 ? "low" : "high";
  if (reduced) tier = "still";
  if (q.get("tier")) tier = q.get("tier");

  const COMMON = `
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

  function createGL(canvas, frag, uniformNames) {
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" });
    if (!gl || q.get("nogl")) return null;
    const defs = `#define OCT ${tier === "high" ? 5 : 4}\n` + (tier === "high" ? "#define HIGH 1\n" : "");
    const sh = (type, s) => {
      const o = gl.createShader(type); gl.shaderSource(o, s); gl.compileShader(o);
      if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(o)); document.title = "SHADER ERROR"; return null; }
      return o;
    };
    const vs = sh(gl.VERTEX_SHADER, "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }");
    const fs = sh(gl.FRAGMENT_SHADER, defs + COMMON + frag);
    if (!vs || !fs) return null;
    const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog); gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {}; ["uRes", "uTime", ...uniformNames].forEach(n => (U[n] = gl.getUniformLocation(prog, n)));

    // resolution: phones render fewer pixels; if frames run long the scale drops again
    let scale = tier === "high" ? Math.min(devicePixelRatio || 1, 1.5) : Math.min(devicePixelRatio || 1, 1.6) * 0.5;
    if (q.get("scale")) scale = +q.get("scale");
    const api = {
      gl, U, tier, w: 0, h: 0, scale,
      resize() {
        const w = Math.max(2, Math.round(canvas.clientWidth * api.scale)), h = Math.max(2, Math.round(canvas.clientHeight * api.scale));
        if (w !== api.w || h !== api.h) { canvas.width = api.w = w; canvas.height = api.h = h; gl.viewport(0, 0, w, h); }
      },
      texture(unit, source, opts = {}) {
        const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return { update(src) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); } };
      },
      draw(time) { api.resize(); gl.uniform2f(U.uRes, api.w, api.h); gl.uniform1f(U.uTime, time); gl.drawArrays(gl.TRIANGLES, 0, 3); },
    };
    api.resize();
    return api;
  }

  // frame loop: pauses when the tab is hidden, adapts resolution, exposes fps for testing
  function loop(api, frame) {
    let last = performance.now(), t = 0, acc = 0, n = 0, raf = 0, running = true, slow = 0;
    const stats = (window.__stats = { fps: 0, scale: api ? api.scale : 0, tier });
    function tick(now) {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.05); last = now; t += dt;
      frame(t, dt);
      acc += dt; n++;
      if (acc > 1) {
        stats.fps = Math.round(n / acc);
        if (api && !q.get("scale")) {
          if (stats.fps < 45 && api.scale > 0.45) api.scale = Math.max(0.45, api.scale * 0.8);
          else if (stats.fps < 22 && ++slow >= 3) { stats.frozen = true; running = false; return; }   // last resort: hold the frame, keep the page usable
          stats.scale = +api.scale.toFixed(2);
        }
        acc = 0; n = 0;
      }
      raf = requestAnimationFrame(tick);
    }
    document.addEventListener("visibilitychange", () => {
      running = !document.hidden && !stats.frozen;
      if (running) { last = performance.now(); raf = requestAnimationFrame(tick); } else cancelAnimationFrame(raf);
    });
    if (tier === "still") { frame(q.get("t") ? +q.get("t") : 20, 0); addEventListener("resize", () => frame(20, 0)); return; }
    raf = requestAnimationFrame(tick);
  }

  // countdown to doors: 19 Dec 2026 09:00 IST; event ends 17:00 IST (provisional)
  const START = Date.parse("2026-12-19T09:00:00+05:30"), END = Date.parse("2026-12-19T17:00:00+05:30");
  function countdown(root) {
    const cells = {}; root.querySelectorAll("[data-cd]").forEach(el => (cells[el.dataset.cd] = el));
    const pad = v => String(v).padStart(2, "0");
    function tick() {
      const now = Date.now();
      if (now >= START) {
        root.innerHTML = `<p class="count__msg">${now < END ? "Happening now" : "YESS 2026 has concluded"}</p>`;
        return;
      }
      let s = Math.floor((START - now) / 1000);
      const d = Math.floor(s / 86400); s -= d * 86400; const h = Math.floor(s / 3600); s -= h * 3600; const m = Math.floor(s / 60); s -= m * 60;
      const v = { d: pad(d), h: pad(h), m: pad(m), s: pad(s) };
      for (const k in v) if (cells[k] && cells[k].textContent !== v[k]) cells[k].textContent = v[k];
      setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    }
    tick();
  }

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const scrollProgress = el => clamp(-el.getBoundingClientRect().top / Math.max(1, el.offsetHeight - innerHeight));

  window.Proto = { tier, coarse, reduced, createGL, loop, countdown, clamp, smooth, scrollProgress, q };
})();
