// Emerald smoke renderer. Three passes on one WebGL2 context:
//   flow (low res, pointer physics) -> fog (reduced res) -> composite and embers (display res).
// createSmoke() returns null when the device can't run it; the page then shows the static fallback.

import { FULLSCREEN_VS, FLOW_FS, FOG_FS, COMPOSITE_FS, EMBER_VS, EMBER_FS } from './shaders.js';

const FLOW_WIDTH = 160;
const QUALITY = [
  { fogScale: 0.5, maxFog: 760 },
  { fogScale: 0.38, maxFog: 560 },
  { fogScale: 0.28, maxFog: 400 },
];
const SLOW_FRAME_MS = 24;
const SLOW_WINDOW_MS = 2000;

function compile(gl, vsSource, fsSource) {
  const program = gl.createProgram();
  for (const [type, source] of [[gl.VERTEX_SHADER, vsSource], [gl.FRAGMENT_SHADER, fsSource]]) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  return { program, uniforms: {} };
}

// Reading link status blocks the main thread until the driver finishes, so this runs
// only once the program is known to be done.
function finishProgram(gl, entry) {
  const { program } = entry;
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const logs = gl.getAttachedShaders(program).map((shader) => gl.getShaderInfoLog(shader)).join(' ');
    throw new Error(gl.getProgramInfoLog(program) || logs || 'program link failed');
  }
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const { name } = gl.getActiveUniform(program, i);
    entry.uniforms[name] = gl.getUniformLocation(program, name);
  }
}

function createTarget(gl, width, height, internalFormat, format, type) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { texture, framebuffer, width, height };
}

function destroyTarget(gl, target) {
  if (!target) return;
  gl.deleteTexture(target.texture);
  gl.deleteFramebuffer(target.framebuffer);
}

export function createSmoke(canvas, { focus = null, grain = 0.045, reveal = 1, onFail } = {}) {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
  });
  if (!gl) return null;

  // RGBA16F render targets keep the flow field precise; without them the fog still
  // drifts on its own, it just can't react to the pointer.
  const hasFloatTargets = !!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'));

  const programs = {
    flow: hasFloatTargets ? compile(gl, FULLSCREEN_VS, FLOW_FS) : null,
    fog: compile(gl, FULLSCREEN_VS, FOG_FS),
    composite: compile(gl, FULLSCREEN_VS, COMPOSITE_FS),
    ember: compile(gl, EMBER_VS, EMBER_FS),
  };
  const parallelCompile = gl.getExtension('KHR_parallel_shader_compile');
  const pending = Object.values(programs).filter(Boolean);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const isMobile = matchMedia('(pointer: coarse)').matches || innerWidth < 820;
  const emberCount = isMobile ? 34 : 90;
  const maxDpr = 1.5;

  let quality = isMobile ? 1 : 0;
  let fogTarget = null;
  let flowA = null;
  let flowB = null;
  let aspect = 1;
  let dpr = 1;
  let logoUniform = [0, 0, 0.25, 0.1];

  let compiled = false;
  let running = false;
  let raf = 0;
  let last = 0;
  let time = 41;  // start partway through the drift, so the first frame is already developed

  // Everything the page drives: the scroll director and the preloader tween these directly.
  const state = { density: 0.55, arch: 1, dim: 1, reveal };

  let firstFrame = false;
  let onFirstFrame;
  const ready = new Promise((resolve) => { onFirstFrame = resolve; });

  const pointer = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5, prevX: 0.5, prevY: 0.5, active: false };
  let slowTime = 0;
  let windowTime = 0;
  let frames = 0;
  const stats = { fps: 0, fogWidth: 0, fogHeight: 0, width: 0, height: 0, quality, hasFloatTargets };

  function createFog() {
    const preset = QUALITY[quality];
    const cssW = canvas.clientWidth || innerWidth;
    const cssH = canvas.clientHeight || innerHeight;
    // Phones have few CSS pixels, so they keep a larger share of them.
    const scale = Math.min(preset.fogScale * (isMobile ? 1.6 : 1), preset.maxFog / Math.max(cssW, cssH));
    const w = Math.max(2, Math.round(cssW * scale));
    const h = Math.max(2, Math.round(cssH * scale));
    destroyTarget(gl, fogTarget);
    fogTarget = hasFloatTargets
      ? createTarget(gl, w, h, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT)
      : createTarget(gl, w, h, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE);
    stats.fogWidth = w;
    stats.fogHeight = h;
  }

  function createFlow() {
    if (!hasFloatTargets) return;
    const w = FLOW_WIDTH;
    const h = Math.max(2, Math.round(FLOW_WIDTH / aspect));
    destroyTarget(gl, flowA);
    destroyTarget(gl, flowB);
    flowA = createTarget(gl, w, h, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT);
    flowB = createTarget(gl, w, h, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT);
  }

  function measureFocus() {
    if (!focus) return;
    const box = focus.getBoundingClientRect();
    const cssH = canvas.clientHeight || innerHeight;
    const cssW = canvas.clientWidth || innerWidth;
    logoUniform = [
      (box.left + box.width / 2 - cssW / 2) / cssH,
      -(box.top + box.height / 2 - cssH / 2) / cssH,
      box.width / 2 / cssH,
      box.height / 2 / cssH,
    ];
  }

  function resize() {
    const cssW = canvas.clientWidth || innerWidth;
    const cssH = canvas.clientHeight || innerHeight;
    dpr = Math.min(devicePixelRatio || 1, maxDpr);
    const w = Math.max(2, Math.round(cssW * dpr));
    const h = Math.max(2, Math.round(cssH * dpr));
    const oldAspect = aspect;
    aspect = cssW / cssH;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    stats.width = w;
    stats.height = h;
    createFog();
    if (!flowA || Math.abs(oldAspect - aspect) > 0.01) createFlow();
    measureFocus();
  }

  function onPointerMove(event) {
    const cssW = canvas.clientWidth || innerWidth;
    const cssH = canvas.clientHeight || innerHeight;
    pointer.targetX = event.clientX / cssW;
    pointer.targetY = 1 - event.clientY / cssH;
    if (!pointer.active) {
      pointer.x = pointer.prevX = pointer.targetX;
      pointer.y = pointer.prevY = pointer.targetY;
      pointer.active = true;
    }
  }

  function bindTexture(unit, texture, location) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(location, unit);
  }

  function stepFlow(dt) {
    if (!hasFloatTargets) return;
    pointer.prevX = pointer.x;
    pointer.prevY = pointer.y;
    const follow = 1 - Math.exp(-dt * 22);
    pointer.x += (pointer.targetX - pointer.x) * follow;
    pointer.y += (pointer.targetY - pointer.y) * follow;

    let vx = ((pointer.x - pointer.prevX) * aspect) / dt;
    let vy = (pointer.y - pointer.prevY) / dt;
    const speed = Math.hypot(vx, vy);
    if (speed > 3) {
      vx *= 3 / speed;
      vy *= 3 / speed;
    }

    const { program, uniforms: u } = programs.flow;
    gl.useProgram(program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, flowB.framebuffer);
    gl.viewport(0, 0, flowB.width, flowB.height);
    bindTexture(0, flowA.texture, u.uPrev);
    gl.uniform2f(u.uTexel, 1 / flowA.width, 1 / flowA.height);
    gl.uniform2f(u.uPointer, pointer.x, pointer.y);
    gl.uniform2f(u.uPointerV, vx, vy);
    gl.uniform1f(u.uAspect, aspect);
    gl.uniform1f(u.uDt, dt);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    [flowA, flowB] = [flowB, flowA];
  }

  function drawFog() {
    const { program, uniforms: u } = programs.fog;
    gl.useProgram(program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fogTarget.framebuffer);
    gl.viewport(0, 0, fogTarget.width, fogTarget.height);
    if (flowA) bindTexture(0, flowA.texture, u.uFlow);
    gl.uniform1f(u.uTime, time);
    gl.uniform1f(u.uAspect, aspect);
    gl.uniform1f(u.uDensity, state.density);
    gl.uniform1f(u.uArch, state.arch);
    gl.uniform1f(u.uDim, state.dim);
    gl.uniform4f(u.uLogo, ...logoUniform);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function drawScreen() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);

    const composite = programs.composite;
    gl.useProgram(composite.program);
    bindTexture(0, fogTarget.texture, composite.uniforms.uFog);
    gl.uniform1f(composite.uniforms.uTime, time);
    gl.uniform1f(composite.uniforms.uAspect, aspect);
    gl.uniform1f(composite.uniforms.uGrain, grain);
    gl.uniform1f(composite.uniforms.uReveal, state.reveal);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (state.reveal < 1) return;
    const ember = programs.ember;
    gl.useProgram(ember.program);
    if (flowA) bindTexture(0, flowA.texture, ember.uniforms.uFlow);
    gl.uniform1f(ember.uniforms.uTime, time);
    gl.uniform1f(ember.uniforms.uAspect, aspect);
    gl.uniform1f(ember.uniforms.uPx, dpr);
    gl.uniform4f(ember.uniforms.uLogo, ...logoUniform);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.drawArrays(gl.POINTS, 0, emberCount);
    gl.disable(gl.BLEND);
  }

  function watchFrameRate(deltaMs) {
    frames++;
    windowTime += deltaMs;
    if (deltaMs > SLOW_FRAME_MS) slowTime += deltaMs;
    if (windowTime < SLOW_WINDOW_MS) return;
    stats.fps = Math.round((frames * 1000) / windowTime);
    if (slowTime > windowTime * 0.5 && quality < QUALITY.length - 1) {
      quality++;
      stats.quality = quality;
      createFog();
    }
    frames = 0;
    windowTime = 0;
    slowTime = 0;
  }

  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const deltaMs = Math.min(now - last, 250);
    last = now;
    const dt = Math.min(Math.max(deltaMs / 1000, 0.001), 1 / 30);
    time += dt;
    measureFocus();  // the focus element moves with the page
    stepFlow(dt);
    drawFog();
    drawScreen();
    if (!firstFrame) {
      firstFrame = true;
      onFirstFrame();
    }
    watchFrameRate(deltaMs);
  }

  function start() {
    if (running || !compiled) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  // Pause while the tab is hidden, or while the canvas is scrolled out of view.
  let onScreen = true;
  let covered = false;
  const sync = () => (document.hidden || !onScreen || covered ? stop() : start());
  const visibility = new IntersectionObserver((entries) => {
    onScreen = entries[entries.length - 1].isIntersecting;
    sync();
  });
  visibility.observe(canvas);

  const resizeObserver = new ResizeObserver(() => { if (compiled) resize(); });
  resizeObserver.observe(canvas);

  const lost = (event) => {
    event.preventDefault();
    stop();
    onFail?.();
  };

  document.addEventListener('visibilitychange', sync);
  addEventListener('pointermove', onPointerMove, { passive: true });
  canvas.addEventListener('webglcontextlost', lost);

  // Wait for the driver in the background where the browser allows it, then start drawing.
  function whenCompiled() {
    const done = !parallelCompile
      || pending.every(({ program }) => gl.getProgramParameter(program, parallelCompile.COMPLETION_STATUS_KHR));
    if (!done) {
      requestAnimationFrame(whenCompiled);
      return;
    }
    try {
      pending.forEach((entry) => finishProgram(gl, entry));
    } catch (error) {
      console.warn('[smoke]', error.message);
      onFail?.();
      return;
    }
    compiled = true;
    resize();
    sync();
  }
  requestAnimationFrame(whenCompiled);

  return {
    stats,
    state,
    ready,
    setFocus(element) { focus = element; },
    // True while an opaque panel fills the screen: nothing is visible, so don't render.
    setCovered(value) {
      if (covered === value) return;
      covered = value;
      sync();
    },
    destroy() {
      stop();
      visibility.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', sync);
      removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('webglcontextlost', lost);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
