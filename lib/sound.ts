let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let muted = false;
const loops: Record<string, { stop: () => void }> = {};

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.55;
    master.connect(ctx.destination);
    const len = ctx.sampleRate * 1.2;
    noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function osc(type: OscillatorType, freq: number, dur: number, gain = 0.12, slideTo?: number, when = 0) {
  const c = ensure();
  if (!c || !master) return;
  const t = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(dur: number, gain = 0.1, filterFreq = 800, filterType: BiquadFilterType = "lowpass", when = 0) {
  const c = ensure();
  if (!c || !master || !noiseBuffer) return;
  const t = c.currentTime + when;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;
  const f = c.createBiquadFilter();
  f.type = filterType;
  f.frequency.value = filterFreq;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t);
  src.stop(t + dur + 0.05);
}

function startLoop(name: string, build: () => { src: AudioBufferSourceNode; gain: GainNode } | null) {
  const c = ensure();
  if (!c || !master) return;
  stopLoop(name);
  const built = build();
  if (!built) return;
  built.src.connect(built.gain).connect(master);
  built.src.start();
  loops[name] = { stop: () => { try { built.src.stop(); } catch { /* noop */ } built.gain.disconnect(); built.src.disconnect(); } };
}

export function stopLoop(name: string) {
  loops[name]?.stop();
  delete loops[name];
}

export function stopAllLoops() {
  for (const name of Object.keys(loops)) stopLoop(name);
}

function safe(fn: () => void): () => void {
  return () => {
    try {
      fn();
    } catch {
      /* audio failure must never break the game flow */
    }
  };
}

const soundImpl = {
  unlock() {
    ensure();
  },
  setMuted(m: boolean) {
    muted = m;
    if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.55, ctx.currentTime, 0.02);
  },
  isMuted() {
    return muted;
  },
  click() {
    osc("square", 1800, 0.06, 0.05, 1200);
  },
  select() {
    osc("square", 640, 0.07, 0.06, 940);
    osc("square", 1280, 0.08, 0.05, 1400, 0.03);
  },
  cancel() {
    osc("square", 480, 0.08, 0.05, 240);
  },
  whoosh() {
    noise(0.5, 0.09, 2200, "bandpass");
    osc("sine", 180, 0.45, 0.05, 320);
  },
  thump() {
    osc("sine", 90, 0.35, 0.35, 38);
    noise(0.18, 0.12, 400, "lowpass");
  },
  heavyThump() {
    osc("sine", 60, 0.6, 0.5, 30);
    noise(0.4, 0.16, 300, "lowpass");
  },
  boot() {
    osc("sine", 220, 0.09, 0.08);
    osc("sine", 440, 0.1, 0.07, undefined, 0.09);
    osc("sine", 880, 0.16, 0.06, undefined, 0.18);
  },
  beep() {
    osc("square", 1320, 0.06, 0.04);
  },
  scanner() {
    noise(0.14, 0.05, 2600, "bandpass");
    osc("sine", 980, 0.12, 0.03, 1100);
  },
  shutter() {
    noise(0.35, 0.16, 500, "lowpass");
    osc("square", 120, 0.3, 0.12, 60);
    osc("square", 90, 0.3, 0.1, 45, 0.06);
  },
  flicker() {
    noise(0.22, 0.1, 4000, "highpass");
    osc("sine", 150, 0.2, 0.06, 90);
  },
  reveal() {
    osc("sine", 196, 0.5, 0.08, 196);
    osc("sine", 294, 0.5, 0.07, 294, 0.12);
    osc("sine", 392, 0.7, 0.08, 392, 0.24);
    osc("sine", 523, 0.9, 0.06, 523, 0.36);
  },
  engineStart() {
    osc("sawtooth", 40, 1.1, 0.12, 92);
    osc("square", 30, 1.1, 0.07, 60);
    noise(0.8, 0.05, 1200, "bandpass");
  },
  engineLoop(strength = 0.6) {
    const c = ensure();
    if (!c || !master) return;
    const base = 70 + strength * 40;
    startLoop("engine", () => {
      const o1 = c.createOscillator();
      o1.type = "sawtooth";
      o1.frequency.value = base;
      const o2 = c.createOscillator();
      o2.type = "square";
      o2.frequency.value = base / 2;
      const f = c.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 700;
      const g = c.createGain();
      g.gain.value = 0.035 * strength;
      o1.connect(f);
      o2.connect(f);
      f.connect(g);
      return { src: o1 as unknown as AudioBufferSourceNode, gain: g } as never;
    });
    if (strength > 0) {
      startLoop("engineSub", () => {
        const o = c.createOscillator();
        o.type = "sine";
        o.frequency.value = base * 1.02;
        const g = c.createGain();
        g.gain.value = 0.05 * strength;
        o.connect(g);
        return { src: o as unknown as AudioBufferSourceNode, gain: g } as never;
      });
    }
  },
  roadLoop(speed = 0.5) {
    const c = ensure();
    if (!c || !master || !noiseBuffer) return;
    startLoop("road", () => {
      const src = c.createBufferSource();
      src.buffer = noiseBuffer;
      src.loop = true;
      src.playbackRate.value = 0.5 + speed;
      const f = c.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 900;
      const g = c.createGain();
      g.gain.value = 0.05 + speed * 0.05;
      src.connect(f);
      f.connect(g);
      return { src, gain: g };
    });
  },
  sirenLoop() {
    const c = ensure();
    if (!c || !master) return;
    const freq = () => (Math.sin(ctx!.currentTime * 2.2) > 0 ? 620 : 480);
    startLoop("siren", () => {
      const o = c.createOscillator();
      o.type = "sawtooth";
      const g = c.createGain();
      g.gain.value = 0.016;
      o.frequency.setValueAtTime(620, c.currentTime);
      o.frequency.linearRampToValueAtTime(480, c.currentTime + 0.45);
      o.frequency.linearRampToValueAtTime(620, c.currentTime + 0.9);
      o.connect(g);
      return { src: o as unknown as AudioBufferSourceNode, gain: g } as never;
    });
    void freq;
  },
  windLoop() {
    const c = ensure();
    if (!c || !master || !noiseBuffer) return;
    startLoop("wind", () => {
      const src = c.createBufferSource();
      src.buffer = noiseBuffer;
      src.loop = true;
      const f = c.createBiquadFilter();
      f.type = "highpass";
      f.frequency.value = 4000;
      const g = c.createGain();
      g.gain.value = 0.02;
      src.connect(f);
      f.connect(g);
      return { src, gain: g };
    });
  },
  stop(name: string) {
    stopLoop(name);
  },
  stopAll() {
    stopAllLoops();
  },
  engineOff() {
    stopLoop("engine");
    stopLoop("engineSub");
  },
};

export const sound = Object.fromEntries(
  Object.entries(soundImpl).map(([k, v]) => [k, safe(v as () => void)])
) as unknown as typeof soundImpl;