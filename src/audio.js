// ---------- synthesised sound: no audio files ----------
const Sound = (() => {
  let ctx = null, master = null, on = false, noiseBuf = null, buzz = null;
  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = .85;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  // a short filtered noise burst plus a damped body resonance: one mechanical "tick"
  function tick(at, { freq = 3000, q = 2, dur = .02, gain = .5, body = 0, bodyGain = 0 } = {}) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(gain, at + .0008);
    g.gain.exponentialRampToValueAtTime(.0001, at + dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(at, Math.random() * .8); s.stop(at + dur + .02);
    if (body) {
      const o = ctx.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(body, at); o.frequency.exponentialRampToValueAtTime(body * .6, at + dur * 2);
      const og = ctx.createGain();
      og.gain.setValueAtTime(bodyGain, at); og.gain.exponentialRampToValueAtTime(.0001, at + dur * 2.5);
      o.connect(og); og.connect(master); o.start(at); o.stop(at + dur * 3);
    }
  }
  const ready = () => on && ctx;
  return {
    get enabled() { return on; },
    toggle(v) {
      on = v === undefined ? !on : v;
      if (on) { init(); ctx.resume(); }
      if (!on) this.buzz(false);
      return on;
    },
    // mirror up, first curtain, second curtain, mirror return, a soft mechanical settle
    shutter() {
      if (!ready()) return; const t = ctx.currentTime + .005;
      tick(t, { freq: 1500, q: .9, dur: .035, gain: .55, body: 190, bodyGain: .42 });
      tick(t + .022, { freq: 4200, q: 1.5, dur: .018, gain: .5 });
      tick(t + .045, { freq: 5200, q: 2, dur: .016, gain: .55 });
      tick(t + .075, { freq: 1100, q: .8, dur: .05, gain: .6, body: 150, bodyGain: .5 });
      tick(t + .105, { freq: 2400, q: 1.2, dur: .03, gain: .18 });
    },
    click() { if (ready()) tick(ctx.currentTime + .002, { freq: 3600, q: 3, dur: .012, gain: .2 }); },
    ratchet() { if (ready()) tick(ctx.currentTime + .002, { freq: 2800 + Math.random() * 500, q: 2.5, dur: .014, gain: .22, body: 420, bodyGain: .05 }); },
    flash() {
      if (!ready()) return; const t = ctx.currentTime;
      tick(t, { freq: 6000, q: .7, dur: .05, gain: .4, body: 260, bodyGain: .2 });
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(1800, t + .1); o.frequency.exponentialRampToValueAtTime(8200, t + 1.4);
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t + .1);
      g.gain.linearRampToValueAtTime(.022, t + .3); g.gain.linearRampToValueAtTime(0, t + 1.4);
      o.connect(g); g.connect(master); o.start(t + .1); o.stop(t + 1.5);
    },
    // the escapement: a fast square-ish whirr while the clockwork runs
    buzz(v) {
      if (!ctx) return;
      if (v && on && !buzz) {
        const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 118;
        const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = 2;
        const g = ctx.createGain(); g.gain.value = 0; g.gain.linearRampToValueAtTime(.05, ctx.currentTime + .06);
        o.connect(f); f.connect(g); g.connect(master); o.start();
        buzz = { o, g };
      } else if (!v && buzz) {
        buzz.g.gain.linearRampToValueAtTime(0, ctx.currentTime + .06);
        buzz.o.stop(ctx.currentTime + .1); buzz = null;
      }
    },
  };
})();
