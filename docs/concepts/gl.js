/* Renders one static frame of a fragment shader. Pitch keyframes only. */
(function () {
  const COMMON = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec4 uA;   // per-concept: usually centre.xy (px) + radius (px)
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
  for (int i = 0; i < 6; i++) { s += a * vnoise(p); p = m * p + 7.3; a *= 0.5; }
  return s;
}
float fbm3(vec2 p){
  float a = 0.5, s = 0.0; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 3; i++) { s += a * vnoise(p); p = m * p + 3.1; a *= 0.5; }
  return s;
}
// light intensity -> brand colour: forest in the shadows, signal in the mids, white only at the core
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
  col += (hash21(frag + 17.0) - 0.5) * 0.022;
  return max(col, 0.0);
}
`;
  const canvas = document.getElementById("gl");
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
  const src = document.getElementById("fs").textContent;
  function sh(type, s) {
    const o = gl.createShader(type); gl.shaderSource(o, s); gl.compileShader(o);
    if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(o)); document.title = "SHADER ERROR"; }
    return o;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }"));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, COMMON + src));
  gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.bindAttribLocation(prog, 0, "p");
  gl.vertexAttribPointer(gl.getAttribLocation(prog, "p"), 2, gl.FLOAT, false, 0, 0);

  function draw() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr);
    canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h);
    const a = window.sceneParams ? window.sceneParams(innerWidth, innerHeight) : [0, 0, 0, 0];
    gl.uniform2f(gl.getUniformLocation(prog, "uRes"), w, h);
    gl.uniform1f(gl.getUniformLocation(prog, "uTime"), 12.0);
    gl.uniform4f(gl.getUniformLocation(prog, "uA"), a[0] * dpr, (innerHeight - a[1]) * dpr, a[2] * dpr, a[3]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  window.addEventListener("resize", draw);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { draw(); document.documentElement.dataset.ready = "1"; });
})();
