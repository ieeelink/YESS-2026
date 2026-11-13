/** Optional sound, off until asked for: a low drone, and a hit on every cut and when the doors part. */
let ac: AudioContext | null = null;
let master: GainNode | null = null;

export function hit(strength = 1) {
  if (!ac || !master || ac.state !== "running") return;
  const t = ac.currentTime;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = "sine"; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(34, t + 0.5);
  g.gain.setValueAtTime(0.9 * strength, t); g.gain.exponentialRampToValueAtTime(0.001, t + 1.3);
  o.connect(g).connect(master); o.start(t); o.stop(t + 1.4);
  const buf = ac.createBuffer(1, ac.sampleRate * 0.4, ac.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
  const n = ac.createBufferSource(), f = ac.createBiquadFilter(), ng = ac.createGain();
  f.type = "lowpass"; f.frequency.value = 900; ng.gain.value = 0.35 * strength;
  n.buffer = buf; n.connect(f).connect(ng).connect(master); n.start(t);
}

export function bindSoundToggle(btn: HTMLButtonElement) {
  btn.addEventListener("click", () => {
    const on = btn.getAttribute("aria-pressed") !== "true";
    btn.setAttribute("aria-pressed", String(on));
    btn.querySelector("b")!.textContent = on ? "on" : "off";
    if (on && !ac) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ac = new AC(); master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination);
      const lp = ac.createBiquadFilter(), dg = ac.createGain();
      lp.type = "lowpass"; lp.frequency.value = 160; dg.gain.value = 0.22; lp.connect(dg).connect(master);
      for (const fr of [55, 55.6, 82.4]) { const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = fr; o.connect(lp); o.start(); }
    }
    if (ac) void (on ? ac.resume() : ac.suspend());
  });
}
