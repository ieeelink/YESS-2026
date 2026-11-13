import { COMMON_GLSL } from "./common";
import { query, tier } from "../lib/env";

export interface Quad {
  gl: WebGLRenderingContext;
  U: Record<string, WebGLUniformLocation | null>;
  scale: number;
  w: number;
  h: number;
  draw(time: number): void;
}

/** A full-screen triangle and one fragment shader. Returns null when WebGL is missing or the shader fails. */
export function createQuad(canvas: HTMLCanvasElement, frag: string, uniforms: string[]): Quad | null {
  if (query.get("nogl")) return null;
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" });
  if (!gl) return null;
  const defs = `#define OCT ${tier === "high" ? 5 : 4}\n` + (tier === "high" ? "#define HIGH 1\n" : "");
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); return null; }
    return s;
  };
  const vs = compile(gl.VERTEX_SHADER, "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }");
  const fs = compile(gl.FRAGMENT_SHADER, defs + COMMON_GLSL + frag);
  if (!vs || !fs) return null;
  const prog = gl.createProgram()!; gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(prog)); return null; }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U: Quad["U"] = {};
  for (const n of ["uRes", "uTime", ...uniforms]) U[n] = gl.getUniformLocation(prog, n);

  const dpr = devicePixelRatio || 1;
  const q: Quad = {
    gl, U, w: 0, h: 0,
    // phones render fewer pixels to begin with; the loop lowers this again if frames run long
    scale: query.get("scale") ? Number(query.get("scale")) : tier === "low" ? Math.min(dpr, 1.6) * 0.5 : Math.min(dpr, 1.5),
    draw(time) {
      const w = Math.max(2, Math.round(canvas.clientWidth * q.scale)), h = Math.max(2, Math.round(canvas.clientHeight * q.scale));
      if (w !== q.w || h !== q.h) { canvas.width = q.w = w; canvas.height = q.h = h; gl.viewport(0, 0, w, h); }
      gl.uniform2f(U.uRes, q.w, q.h); gl.uniform1f(U.uTime, time); gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
  return q;
}

export interface LoopStats { fps: number; scale: number; tier: string; frozen: boolean }

/**
 * The frame loop. Pauses when the tab is hidden. Watches the frame rate: below 45fps it renders fewer
 * pixels; if it still cannot hold 22fps it stops and leaves the last frame up, so the page stays usable.
 * In the "still" tier it draws once and again on resize.
 */
export function runLoop(quad: Quad | null, frame: (t: number, dt: number) => void): LoopStats {
  const stats: LoopStats = { fps: 0, scale: quad?.scale ?? 0, tier, frozen: false };
  (window as unknown as { __stats: LoopStats }).__stats = stats;
  if (tier === "still") {
    frame(20, 0);
    addEventListener("resize", () => frame(20, 0));
    return stats;
  }
  let last = performance.now(), t = 0, acc = 0, n = 0, slow = 0, raf = 0, running = true;
  const tick = (now: number) => {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05); last = now; t += dt;
    frame(t, dt);
    acc += dt; n++;
    if (acc > 1) {
      stats.fps = Math.round(n / acc); acc = 0; n = 0;
      if (quad && !query.get("scale")) {
        if (stats.fps < 45 && quad.scale > 0.45) quad.scale = Math.max(0.45, quad.scale * 0.8);
        else if (stats.fps < 22 && ++slow >= 3) { stats.frozen = true; running = false; return; }
        stats.scale = +quad.scale.toFixed(2);
      }
    }
    raf = requestAnimationFrame(tick);
  };
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden && !stats.frozen;
    cancelAnimationFrame(raf);
    if (running) { last = performance.now(); raf = requestAnimationFrame(tick); }
  });
  raf = requestAnimationFrame(tick);
  return stats;
}
