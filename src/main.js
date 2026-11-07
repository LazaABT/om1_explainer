// ---------- stage ----------
const $ = id => document.getElementById(id);
const glc = $('gl'), vfc = $('vf'), annc = $('ann');
let renderer, scene, camera, ambient, sun;
let W = 1, H = 1, DPR = 1, GDPR = 1;
const narrow = () => W < 820;
const rays = { pre: [], leg: [], fan: [] };
let slitMesh, ann, planeG, planeMat;
const LINE = {};

function fail() {
  document.body.classList.add('nogl');
  $('nogl').style.display = 'flex'; $('load').style.display = 'none';
  document.documentElement.classList.remove('loading');
}
const tick = p => { $('loadp').textContent = Math.round(p * 100) + '%'; return new Promise(r => setTimeout(r, 16)); };

async function init() {
  try { renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { return fail(); }
  renderer.localClippingEnabled = true; renderer.autoClear = false;
  renderer.setClearColor(0, 0);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(26, 1, .2, 900);
  ambient = new THREE.AmbientLight(0xffffff, 1.15); scene.add(ambient);
  sun = new THREE.DirectionalLight(0xffffff, 1.9); scene.add(sun); scene.add(sun.target);
  scene.add(ROOT); scene.add(RAYS);
  await tick(.05);
  vfInit(vfc);
  buildCamera();
  for (const k in PARTS) PARTS[k].home.copy(PARTS[k].g.position);
  PARTS.contact.g.visible = false;
  await tick(.12);

  for (let i = 0; i < 3; i++) { rays.pre.push(new Ribbon(4, i ? .05 : .075)); rays.leg.push(new Ribbon(9, i ? .05 : .075)); }
  for (let i = 0; i < 15; i++) rays.fan.push(new Ribbon(4, .045));
  rays.blurA = new Ribbon(2, .16); rays.blurB = new Ribbon(2, .16, COL.ink);

  // subject markers for the lens chapter: thin standee with a vermilion head
  const subj = () => {
    const g = new THREE.Group();
    const mat = c => new THREE.MeshBasicMaterial({ color: c });
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 4.4, 8), mat(COL.ink)));
    const a = new THREE.Mesh(new THREE.SphereGeometry(.26, 20, 14), mat(COL.vermilion)); a.position.y = 2.2; g.add(a);
    const b = new THREE.Mesh(new THREE.SphereGeometry(.26, 20, 14), mat(COL.ink)); b.position.y = -2.2; g.add(b);
    g.visible = false; scene.add(g); return g;
  };
  MODEL.subjA = subj(); MODEL.subjB = subj();

  // the section plane: a sheet you can see arrive and pass through the body
  planeG = new THREE.Group(); scene.add(planeG);
  planeMat = new THREE.MeshBasicMaterial({ color: COL.vermilion, transparent: true, opacity: .2, side: THREE.DoubleSide, depthWrite: false });
  const pg = new THREE.PlaneGeometry(20, 13).rotateY(Math.PI / 2);
  const pm = new THREE.Mesh(pg, planeMat); pm.position.set(0, 1.2, 1.4); planeG.add(pm);
  const pl = new THREE.LineSegments(new THREE.EdgesGeometry(pg), new THREE.LineBasicMaterial({ color: COL.vermilion, transparent: true }));
  pl.position.copy(pm.position); planeG.add(pl); planeG.userData.line = pl.material;

  ann = annc.getContext('2d');
  resize();
  await buildWorld(tick);
  grainInit();
  buildDiorama();
  buildFilm();
  buildLine();
  buildDom();
  await tick(.8);
  // pay for texture uploads and shader compiles now, not mid-scroll
  scene.traverse(o => { if (o.material && o.material.map) renderer.initTexture(o.material.map); });
  MODEL.dio.visible = true; slitMesh.visible = true;
  renderer.compile(scene, camera);
  await tick(.84);
  addEventListener('resize', resize);
  // walk the story once behind the spinner, so every shader and canvas is warm before you can scroll
  const stops = ['size', 'quote', 'section', 'dof1', 'point', 'eye', 'aids', 'fSplit1', 'bokeh', 'zTele', 'roll', 'expAp', 's4', 'spSlow', 'strokeB', 'cry', 'silver', 'roads2', 'neg', 'end'];
  // warming up is only an optimisation: a failure here must never leave the spinner up
  for (let i = 0; i < stops.length; i++) { const t = A(stops[i]); prevT = t; try { update(t, 0); } catch (e) { console.warn(e); } await tick(.84 + .15 * i / stops.length); }
  shotAt = flashAt = eyeStart = null; prevT = 0; G.notch = G.stopIdx = undefined;
  update(0, 0);
  const m = /t=([\d.]+)/.exec(location.hash);
  if (m) { window.__lock = true; seek(+m[1]); }
  window.READY = true;
  requestAnimationFrame(frame);
  await tick(1);
  document.documentElement.classList.remove('loading');
  $('load').classList.add('done'); setTimeout(() => $('load').remove(), 700);
  SC.ready = true;
}

// pop-up diorama: the same painted layers, standing in front of the lens in 3D.
// Each card is sized so the view from the eyepiece matches the finder image.
const DIO = [];
const SKIRT = { 1: [610, 560, 0xCDB08F], 2: [760, 640, 0x8C8A72], 3: [880, 820, 0x4A5444] };
function buildDiorama() {
  const g = new THREE.Group(); g.position.z = 6; scene.add(g); MODEL.dio = g;
  const tan = Math.tan(54.4 / 2 * Math.PI / 180) * 2;
  WORLD.layers.forEach((l, i) => {
    const D = l.card, wd = D * tan * (SW + PAD * 2) / SW * (i ? 1 : 2.6), ht = wd * (SH + PAD * 2) / (SW + PAD * 2);
    const tex = new THREE.CanvasTexture(l.src); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, alphaTest: .02 });
    const geo = new THREE.PlaneGeometry(wd, ht).translate(0, ht / 2, 0).rotateY(Math.PI);
    const mesh = new THREE.Mesh(geo, m);
    const hinge = new THREE.Group(); hinge.position.set(0, 3.1 - ht / 2, D); hinge.add(mesh); g.add(hinge);
    mesh.renderOrder = -10 - i;
    DIO.push({ hinge, m, n: i });
    const sk = SKIRT[i];
    if (sk) [[-1, sk[0]], [1, sk[1]]].forEach(([side, y]) => {
      const top = ht * (1 - (y + PAD) / (SH + PAD * 2)), span = 300;
      const pg = new THREE.PlaneGeometry(span, top).translate(side * -(wd / 2 + span / 2 - .02), top / 2, 0);
      const pm = new THREE.MeshBasicMaterial({ color: sk[2], transparent: true, side: THREE.DoubleSide });
      const p = new THREE.Mesh(pg, pm); p.renderOrder = -10 - i; hinge.add(p);
      DIO.push({ hinge, m: pm, n: i });
    });
  });
  const fm = new THREE.MeshBasicMaterial({ color: 0x4A5444, transparent: true });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(900, 500).rotateX(-Math.PI / 2), fm);
  floor.position.set(0, -3.02, 30); floor.renderOrder = -2; g.add(floor); MODEL.floor = fm;
}

function buildFilm() {
  // film: pale unexposed emulsion with perforations. Drawn once.
  const c = MODEL.filmTex.image, x = c.getContext('2d');
  x.clearRect(0, 0, c.width, c.height);
  x.fillStyle = '#A99F8C'; x.fillRect(0, 0, c.width, c.height);
  const per = 146;
  x.fillStyle = '#161514';
  for (let i = 0; i < 64; i++) {
    const px = i * (3.8 / 8) * per;
    [20, 472].forEach(y => { x.save(); x.translate(0, y); roundRect(x, px, 0, 34, 22, 5); x.fill(); x.restore(); });
  }
  x.strokeStyle = 'rgba(22,21,20,.3)'; x.lineWidth = 2;
  for (let i = 0; i < 4; i++) { const fx = i * 3.8 * per + 15; x.strokeRect(fx, 80, 3.6 * per, 352); }
  MODEL.filmTex.wrapS = THREE.RepeatWrapping; MODEL.filmTex.repeat.x = 10.3 / 14; MODEL.filmTex.needsUpdate = true;

  // the patch of light that passes the slit: an upside-down image on the film
  const tex = new THREE.CanvasTexture(WORLD.photo); tex.colorSpace = THREE.SRGBColorSpace;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(8), 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  slitMesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, depthTest: false, transparent: true }));
  slitMesh.frustumCulled = false; slitMesh.renderOrder = 8; scene.add(slitMesh);
}

// the ending: a washing line, two pegs, the print, and the strip it came from
function buildLine() {
  const p = new Part('line'); p.g.visible = false;
  const Y = 21, Z = -9;
  const pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40 * 2 - 1; pts.push(new THREE.Vector3(u * 90, Y - (1 - u * u) * 1.2, Z)); }
  p.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, .06, 6), COL.ink, { clip: false, edges: false, hull: false });
  const peg = (parent, x, y) => {
    const g = new THREE.Group(); g.position.set(x, y, .12); parent.add(g);
    const wood = 0xC9A674;
    [-.11, .11].forEach(s => p.mesh(new THREE.BoxGeometry(.3, 3.1, .15).translate(0, .25, s), wood, { clip: false, parent: g, hullW: .8 }));
    p.mesh(new THREE.TorusGeometry(.2, .035, 6, 18).rotateY(Math.PI / 2).translate(0, .35, 0), COL.chrome2, { clip: false, parent: g, hullW: .6 });
    g.rotation.z = .04; return g;
  };
  // print
  const pc = newCanvas(1200, 880), px = pc.getContext('2d');
  px.fillStyle = '#F7F4EE'; px.fillRect(0, 0, 1200, 880);
  px.drawImage(WORLD.bw, 60, 60, 1080, 720);
  px.fillStyle = '#161514'; px.font = '500 22px "DM Mono",monospace'; px.fillText('Frame 1  ·  f/5.6  ·  1/250', 60, 830);
  const ptex = new THREE.CanvasTexture(pc); ptex.colorSpace = THREE.SRGBColorSpace; ptex.anisotropy = 8;
  LINE.print = new THREE.Group(); LINE.print.position.set(40, Y - .9, Z); p.g.add(LINE.print);
  const pm = new THREE.MeshBasicMaterial({ map: ptex, side: THREE.DoubleSide });
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(16, 11.73, 12, 1).translate(0, -5.6, 0), pm); LINE.print.add(sheet);
  sheet.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(16, 11.73).translate(0, -5.6, 0)), new THREE.LineBasicMaterial({ color: COL.ink })));
  peg(LINE.print, -6.4, .3); peg(LINE.print, 6.4, .3);
  // negative strip, hanging beside it
  const nc = newCanvas(300, 1000), nx = nc.getContext('2d');
  nx.fillStyle = '#E6E0D2'; nx.fillRect(0, 0, 300, 1000);
  [0, 1, 2].forEach(i => { nx.save(); nx.translate(150, 170 + i * 330); nx.rotate(Math.PI / 2); nx.drawImage(WORLD.neg, -150, -115, 300, 230); nx.restore(); });
  nx.fillStyle = '#161514'; for (let i = 0; i < 26; i++) [10, 268].forEach(xx => { roundRect(nx, xx, i * 39 + 6, 22, 24, 4); nx.fill(); });
  const ntex = new THREE.CanvasTexture(nc); ntex.colorSpace = THREE.SRGBColorSpace;
  LINE.neg = new THREE.Group(); LINE.neg.position.set(-40, Y - .9, Z); p.g.add(LINE.neg);
  const nm = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 14).translate(0, -7, 0), new THREE.MeshBasicMaterial({ map: ntex, side: THREE.DoubleSide })); LINE.neg.add(nm);
  peg(LINE.neg, 0, .3);
}

function buildDom() {
  const host = $('cards');
  CARDS.forEach(c => {
    const e = document.createElement('section'); e.className = 'card ' + c.pos;
    if (c.kind === 'clock') {
      e.innerHTML = `<h2 class="clockh">1/250 s,<br>slowed right down.</h2><div class="clock"><span id="ms">0</span><i>ms</i></div><ol id="steps">${CLOCK_STEPS.map(s => `<li>${s[1]}</li>`).join('')}</ol><small>Order is real. Milliseconds are illustrative.</small>`;
    } else {
      e.innerHTML = (c.k ? `<b class="kick">${c.k}</b>` : '') + (c.h ? `<h2>${c.h}</h2>` : '') + (c.p ? `<p>${c.p}</p>` : '') + (c.m ? `<small>${c.m}</small>` : '') + (c.photo ? `<figure class="real"><img alt="" src="${PHOTOS[c.photo[0]]}"><figcaption>${c.photo[1]}</figcaption></figure>` : '');
    }
    host.appendChild(e); c.el = e;
  });
  const nav = $('nav');
  CHAPTERS.forEach(([t, name], i) => {
    const b = document.createElement('button'); b.title = name; b.setAttribute('aria-label', name);
    b.onclick = () => flyTo(t, clamp(Math.abs(t - tS) * 34, 900, 1900));
    nav.appendChild(b); CHAPTERS[i].btn = b;
  });
  const snd = () => { const on = Sound.toggle(); document.body.classList.toggle('sound', on); if (on) Sound.click(); };
  $('snd').onclick = snd; $('snd2').onclick = snd;
  $('again').onclick = () => flyTo(0, 2400, eio);
  measure();
}

let PANEL = { x: 0, y: 0, w: 0, h: 0 };
function layout() {
  const nar = narrow();
  const pw = nar ? W - 32 : Math.min(W * .46, H * .54 * 1.5), ph = pw / 1.5;
  PANEL = { x: nar ? 16 : W * .045, y: nar ? 70 : Math.max(62, H * .085), w: pw, h: ph, r: 8 };
  document.documentElement.style.setProperty('--bl-top', (PANEL.y + PANEL.h + 34) + 'px');
  document.documentElement.style.setProperty('--bl-w', PANEL.w + 'px');
  document.documentElement.style.setProperty('--bl-y', PANEL.y + 'px');
}
function resize() {
  W = innerWidth; H = innerHeight; DPR = Math.min(devicePixelRatio || 1, 2); GDPR = Math.min(DPR, QSTEPS[QUALITY.level][0]);
  renderer.setPixelRatio(GDPR); renderer.setSize(W, H, false);
  hullUniforms.uRes.value.set(W, H);
  camera.aspect = W / H; camera.updateProjectionMatrix();
  const vd = Math.min(DPR, 1.25);
  vfc.width = W * vd; vfc.height = H * vd; vfc.dataset.d = vd;
  annc.width = W * DPR; annc.height = H * DPR;
  layout();
  if (SC.segs.length) { const t = yToT(SC.y); measure(); SC.y = SC.goal = tToY(t); }
}

// Drop resolution step by step if this machine cannot hold a smooth frame rate.
const QUALITY = { level: 0, vfMax: 1280, acc: 0, n: 0, cool: 0 };
const QSTEPS = [[1.75, 1280], [1.25, 1000], [1, 860], [.8, 760]];
function applyQuality() {
  const [g, v] = QSTEPS[QUALITY.level];
  GDPR = Math.min(DPR, g); QUALITY.vfMax = v;
  renderer.setPixelRatio(GDPR); renderer.setSize(W, H, false);
}
function watchFrames(ms) {
  if (ms > 250) return; // tab was away, not slow
  QUALITY.acc += ms; QUALITY.n++;
  if (QUALITY.n < 30) return;
  const avg = QUALITY.acc / QUALITY.n; QUALITY.acc = QUALITY.n = 0;
  // two slow windows in a row, so one hitch never costs sharpness for the whole visit
  QUALITY.cool = avg > 36 ? QUALITY.cool + 1 : 0;
  if (QUALITY.cool >= 2 && QUALITY.level < QSTEPS.length - 1) { QUALITY.cool = 0; QUALITY.level++; applyQuality(); }
}

// ---------- scrolling: sticky holds, natural stops, eased journeys ----------
// A wheel notch is about 100 px, so a hold of 230 px takes two or three notches to push through.
const HOLD_PX = 230, TR_PX = 180;
const SC = { y: 0, goal: 0, set: -1, dir: 1, auto: null, segs: [], total: 1, lastInput: 0, catchUntil: 0, catchMax: 0, touching: false, ready: false };
function measure() {
  let y = 0; SC.segs = [];
  HOLDS.forEach(h => {
    const tr = h.a - h.in;
    if (tr > 0) { SC.segs.push({ hold: false, y0: y, y1: y + tr * TR_PX, t0: h.in, t1: h.a }); y += tr * TR_PX; }
    SC.segs.push({ hold: true, y0: y, y1: y + HOLD_PX * h.w, t0: h.a, t1: h.b }); y += HOLD_PX * h.w;
  });
  SC.total = y; $('spacer').style.height = (y + innerHeight) + 'px';
}
const segAt = y => { for (const s of SC.segs) if (y < s.y1) return s; return SC.segs[SC.segs.length - 1]; };
function yToT(y) { const s = segAt(y); return lerp(s.t0, s.t1, clamp((y - s.y0) / (s.y1 - s.y0))); }
function tToY(t) { for (const s of SC.segs) if (t < s.t1) return lerp(s.y0, s.y1, clamp((t - s.t0) / (s.t1 - s.t0))); return SC.total; }
function seek(t) { const y = tToY(t); SC.y = SC.goal = y; SC.auto = null; scrollTo(0, y); SC.set = y; tS = t; prevT = t; }
window.__seek = seek;
window.__show = t => { window.__lock = true; seek(t); update(t, performance.now() / 1000); return t; };

const easeJourney = x => x < .5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
function flyTo(t, ms, ease = easeJourney) {
  SC.catchUntil = 0; SC.auto = { from: yToT(SC.y), to: t, t0: performance.now(), ms, ease };
}
function holdFrom(y, dir) { // the next natural stop, in the direction of travel
  if (dir > 0) { for (const s of SC.segs) if (s.hold && s.y0 >= y - .5) return s; }
  else for (let i = SC.segs.length - 1; i >= 0; i--) { const s = SC.segs[i]; if (s.hold && s.y1 <= y + .5) return s; }
  return null;
}
function settle() { // stopped in the middle of a move: carry on to the next hold
  const s = segAt(SC.y); if (s.hold) return;
  const h = holdFrom(SC.y, SC.dir) || holdFrom(SC.y, -SC.dir); if (!h) return;
  const fwd = h.y0 >= SC.y, t = fwd ? h.t0 + .002 : h.t1 - .002;
  flyTo(t, clamp(Math.abs(t - yToT(SC.y)) * 620, 500, 2300), eio);
}
function step(d) { // keyboard: one hold at a time
  const cur = segAt(SC.y), y = cur.hold ? (d > 0 ? cur.y1 + 1 : cur.y0 - 1) : SC.y;
  const h = holdFrom(y, d); if (!h) return;
  const t = d > 0 ? h.t0 + .002 : h.t1 - .002;
  SC.dir = d; flyTo(t, clamp(Math.abs(t - yToT(SC.y)) * 620, 500, 2300), eio);
}
addEventListener('wheel', e => {
  if (e.ctrlKey) return;
  e.preventDefault();
  if (!SC.ready || window.__lock) return;
  const now = performance.now();
  let d = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? innerHeight : 1);
  d = clamp(d, -220, 220); if (!d) return;
  SC.auto = null; SC.lastInput = now; SC.dir = Math.sign(d);
  if (now < SC.catchUntil) { SC.catchUntil = Math.min(SC.catchMax, now + 190); return; } // the rest of the flick is spent
  const prev = SC.goal, next = clamp(prev + d, 0, SC.total), inHold = segAt(prev).hold;
  let goal = next;
  for (const s of SC.segs) { // a big flick stops at the first hold it reaches
    if (!s.hold) continue;
    if (d > 0 && s.y0 > prev && s.y0 <= next) { goal = s.y0 + 1; caught(now); break; }
    if (d < 0 && s.y1 < prev && s.y1 >= next) { goal = s.y1 - 1; caught(now); }
  }
  SC.goal = goal;
}, { passive: false });
function caught(now) { SC.catchUntil = now + 240; SC.catchMax = now + 620; }
addEventListener('touchstart', () => { SC.touching = true; SC.auto = null; }, { passive: true });
addEventListener('touchend', () => { SC.touching = false; SC.lastInput = performance.now(); }, { passive: true });
addEventListener('keydown', e => {
  if (!SC.ready) { e.preventDefault(); return; }
  if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); step(1); }
  if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); step(-1); }
  if (e.key === 'Home') { e.preventDefault(); flyTo(0, 2000); }
  if (e.key === 'End') { e.preventDefault(); flyTo(T_END, 2000); }
});
addEventListener('scroll', () => { // scrollbar, touch: anything we did not do ourselves
  if (!SC.ready || window.__lock || Math.abs(scrollY - SC.set) < 2) return;
  SC.dir = Math.sign(scrollY - SC.y) || SC.dir; SC.y = SC.goal = SC.set = scrollY; SC.auto = null; SC.lastInput = performance.now();
}, { passive: true });
function scrollStep(dt, ms) {
  if (SC.auto) {
    const a = SC.auto, k = clamp((ms - a.t0) / a.ms);
    SC.y = SC.goal = tToY(lerp(a.from, a.to, a.ease(k)));
    if (k >= 1) { SC.auto = null; SC.lastInput = ms; }
  } else {
    SC.y += (SC.goal - SC.y) * (1 - Math.exp(-dt * 13));
    if (Math.abs(SC.goal - SC.y) < .4) SC.y = SC.goal;
    if (!SC.touching && ms - SC.lastInput > 170 && SC.y === SC.goal) settle();
  }
  if (Math.abs(SC.y - SC.set) > .2) { SC.set = SC.y; scrollTo(0, SC.y); }
  const s = segAt(SC.y), p = s.hold ? clamp((SC.y - s.y0) / (s.y1 - s.y0)) : 0;
  const key = Math.round(p * 60);
  if (key !== G.dw) { G.dw = key; $('dwelli').style.transform = `scaleX(${p})`; $('dwell').style.opacity = p > .03 && p < .985 ? 1 : 0; }
}

// ---------- pose ----------
function poseAt(t) {
  const P = POSES; let a = P[0], b = P[0], k = 0, hump = 0;
  if (t >= P[P.length - 1].t) a = b = P[P.length - 1];
  else if (t > P[0].t) for (let i = 1; i < P.length; i++) if (t <= P[i].t) {
    a = P[i - 1]; b = P[i]; const u = (t - a.t) / (b.t - a.t || 1);
    if (i % 2) k = u; else { k = eio(u); hump = Math.sin(Math.PI * k) * b.swoop; }
    break;
  }
  const o = []; for (let i = 0; i < 9; i++) o.push(lerp(a.v[i], b.v[i], k));
  o[4] += hump * 60; o[5] *= 1 + hump;
  return o;
}
const v3 = new THREE.Vector3(), tgt = new THREE.Vector3();
function applyPose(t, now) {
  const [tx, ty, tz, az0, el0, d0, ox0, oy, roll] = poseAt(t);
  const az = az0 * Math.PI / 180, el = el0 * Math.PI / 180;
  const nar = narrow(), ox = nar ? 0 : ox0;
  // keep wide subjects in frame on portrait screens
  const fit = W / H < 1.2 ? 1.2 / (W / H) * .9 : 1;
  const d = d0 > 6 ? d0 * fit : d0;
  tgt.set(tx, ty, tz);
  camera.position.set(tx + d * Math.sin(az) * Math.cos(el), ty + d * Math.sin(el), tz + d * Math.cos(az) * Math.cos(el));
  camera.up.set(0, 1, 0); camera.lookAt(tgt); camera.rotateZ(roll * Math.PI / 180);
  camera.near = clamp(d * .1, .2, 6); camera.updateProjectionMatrix();
  camera.setViewOffset(W, H, -ox * W, (nar ? lerp(.14, -.1, trk.split(t)) : oy) * H, W, H);
  camera.updateMatrixWorld();
  sun.position.copy(camera.position).add(v3.set(-14, 22, 0)); sun.target.position.copy(tgt);
}

// ---------- rays ----------
const LENS_REF = 3.0; // thin-lens plane with the helicoid home, 50 mm ahead of the film
const MP = { z: -.96, y: 1.06 };
// where a ray from the rim of the lens, heading for the film centre, meets the mirror
function mirrorHit(h, mir) {
  const phi = Math.PI / 4 * (1 - mir), T = Math.tan(phi), c = Math.cos(phi), s = Math.sin(phi);
  const u = clamp((h - MP.y + T * (LENS_REF - MP.z)) / (h + 5 * T + 1e-4), 0, 1);
  const z = LENS_REF - 5 * u, y = h * (1 - u), L = Math.hypot(5, h);
  let vx = -5 / L, vy = -h / L; const dot = vx * c - vy * s;
  const rz = 2 * dot * c - vx, ry = -2 * dot * s - vy;
  return { z, y, rz, ry, arc: 12 + u * L, full: 12 + L };
}
function legPts(h, mir, hit) {
  const o = h * .1, k = ss(0, .3, mir);
  const up = Math.max(.2, (SCREEN_Y - hit.y) / Math.max(.05, hit.ry)), sz = hit.z + hit.rz * up;
  if (k <= 0) return [[hit.z, hit.y], [sz, SCREEN_Y], [.1 - o * .8, 4.6 + o * .3], [1.2 - o * .4, 3.2 + o * .8], [-1.5, 3.2 + o * .3], [-2.2, 3.2], [-5, 3.2 - o * 1.2]];
  return [[hit.z, hit.y], [sz, SCREEN_Y]];
}
function lightPath(i, h, a, rp, mir, filmK, now) {
  const hit = mirrorHit(h, mir), pre = rays.pre[i], leg = rays.leg[i];
  pre.set([[15, h], [LENS_REF, h], [FILM_Z, 0], [FILM_Z, 0]]);
  const clipArc = lerp(Math.min(rp, 1) * hit.arc, hit.full, ss(.15, .9, filmK));
  pre.style(a, 1, now, COL.vermilion); pre.clip(clipArc);
  leg.set(legPts(h, mir, hit));
  leg.style(a * (1 - ss(0, .4, filmK)), clamp(rp - 1), now, COL.vermilion);
}
const fanPts = (zo, yo, zl, di, h) => {
  const zi = zl - di, yi = -yo * di / Math.max(.1, zo - zl), sl = (yi - h) / (zi - zl), yf = h + sl * (FILM_Z - zl);
  return { pts: [[zo, yo], [zl, h], [FILM_Z, yf], [FILM_Z, yf]], yf };
};
const diOf = dist => 5 + .625 * clamp((19 - dist) / 9.5);
function updateRays(t, now, ext, N, mir, st) {
  // light through the body, then on to the film. One set of rays, all the way.
  const hs = [0, 1.15, -1.15];
  const a = trk.rayA(t), rp = trk.ray(t), fk = trk.rayFilm(t);
  const meterRay = trk.meterA(t), apK = clamp(2.5 / st.irisN / 1.39);
  const on = Math.max(a, meterRay);
  for (let i = 0; i < 3; i++) {
    if (on > .004) lightPath(i, a > meterRay ? hs[i] : hs[i] * apK, (a > meterRay ? on : on * .55) * (i ? .7 : 1), a > meterRay ? rp : 2, a > meterRay ? mir : 0, a > meterRay ? fk : 0, now);
    else { rays.pre[i].style(0); rays.leg[i].style(0); }
  }
  // the lens chapter: a single diagram that never cuts. Subjects slide in, the lens racks, the cone narrows
  const zl = LENS_REF + ext, fanA = trk.fan(t), R = rays.fan; let n = 0;
  const A2 = MODEL.subjA, B2 = MODEL.subjB;
  A2.visible = B2.visible = false; rays.blurA.style(0); rays.blurB.style(0);
  if (fanA > .003) {
    const aEdge = Math.min(2.5 / N, 1.38), five = [aEdge, aEdge * .5, 0, -aEdge * .5, -aEdge];
    const dist = trk.objZ(t), yo = trk.objY(t), zo = zl + dist, di = diOf(dist);
    const fan = (z, y, d, color, alpha) => {
      let lo = 1e9, hi = -1e9;
      five.forEach(h => { const r = R[n++], { pts, yf } = fanPts(z, y, zl, d, h); r.set(pts); r.style(alpha, 1, now, color); lo = Math.min(lo, yf); hi = Math.max(hi, yf); });
      return [lo, hi];
    };
    const fa = fan(zo, yo, di, COL.vermilion, fanA);
    fan(zo, -yo, di, COL.ink, fanA * clamp(yo / 2.2));
    if (dist < 60) { A2.visible = true; A2.position.set(0, 0, zo); A2.scale.y = Math.max(.02, yo / 2.2); }
    if (fa[1] - fa[0] > .02) { rays.blurA.set([[FILM_Z, fa[0]], [FILM_Z, fa[1]]]); rays.blurA.style(fanA, 1, now, COL.vermilion); rays.blurA.mat.uniforms.uFlow.value = 0; }
    const bk = trk.subjB(t); G.disc = null;
    if (bk > .003) {
      const distB = lerp(40, 16, bk), zb = zl + distB, fb = fan(zb, 2.2, diOf(distB), COL.ink, fanA * bk * .85);
      B2.visible = true; B2.position.set(0, 0, zb);
      G.disc = [fa[1] - fa[0], fb[1] - fb[0]];
      rays.blurB.set([[FILM_Z, fb[0]], [FILM_Z, fb[1]]]); rays.blurB.style(fanA * bk, 1, now, COL.ink); rays.blurB.mat.uniforms.uFlow.value = 0;
    }
  }
  for (; n < R.length; n++) R[n].style(0);
}

// ---------- state ----------
let tS = 0, prevT = 0, last = 0, eyeStart = null, shotAt = null, flashAt = null;
const lensStops = [1.8, 2.8, 4, 5.6, 8, 11, 16];
const G = {};
const calmMotion = matchMedia('(prefers-reduced-motion: reduce)');
const TRAVEL = 16.7;
const RUNS = [['sp1000', 1, '1/1000'], ['sp250', 4, '1/250'], ['sp60', TRAVEL, '1/60']].map(([s, exp, name]) => ({
  s, exp, name, a: I(s) + .15, b: B(s) + .7, p: track([[I(s) + .15, 0], [A(s), .46], [B(s), .54], [B(s) + .7, 1]], x => x),
}));
const OVER = [A('s3') - .6, B('s6') + .2];

function frame(ms) {
  requestAnimationFrame(frame);
  const now = ms / 1000, dt = Math.min(.1, now - last);
  if (last && !window.__lock) watchFrames((now - last) * 1000);
  last = now;
  if (!window.__lock) {
    if (SC.ready) scrollStep(dt, performance.now());
    const raw = yToT(SC.y);
    tS += (raw - tS) * (1 - Math.exp(-dt * 24));
    if (Math.abs(raw - tS) < .0008) tS = raw;
  }
  update(tS, now);
  prevT = tS;
}

function renderAll(open) {
  renderer.clear();
  if (open <= .0005) { CUT.normal.set(-1, 0, 0); CUT.constant = 100; renderer.render(scene, camera); return; }
  CUT.normal.set(-1, 0, 0); CUT.constant = 0;
  renderer.render(scene, camera);
  if (open >= .9995) return;
  // the near half, lifted out as one piece: a step towards you, then up and away
  const ox = 3.6 * ss(0, .3, open), oy = 30 * ss(.24, 1, open);
  ROOT.position.set(ox, oy, 0); CUT.normal.set(1, 0, 0); CUT.constant = -ox;
  const vis = [RAYS, planeG, MODEL.dio, slitMesh, MODEL.subjA, MODEL.subjB].map(o => { const v = o.visible; o.visible = false; return [o, v]; });
  renderer.render(scene, camera);
  vis.forEach(([o, v]) => { o.visible = v; });
  ROOT.position.set(0, 0, 0); CUT.normal.set(-1, 0, 0); CUT.constant = 0;
}

function update(t, now) {
  const dark = trk.dark(t);
  const bg = mixHex(COL.paper, COL.night, dark);
  const lineC = dark > .5 ? 0x8B8780 : COL.ink;
  const bgc = new THREE.Color(bg);
  if (bg !== G.bg) {
    G.bg = bg;
    document.documentElement.style.setProperty('--bg', hex(bg));
    document.documentElement.style.setProperty('--fg', hex(mixHex(COL.ink, COL.white, dark)));
  }

  applyPose(t, now);

  // explode
  const e = trk.ex(t), E = (n, x, y, z) => PARTS[n].g.position.set(x * e, y * e, z * e);
  E('lens', 0, 0, 12); E('mount', 0, 0, 8); E('box', 0, 0, 5); E('prism', 0, 7.4, 0); E('top', 0, 12, 0); E('lever', 0, 12, 0);
  E('bottom', 0, -6, 0); E('shutter', 0, 0, -4.6); E('film', 0, 0, -7.6); E('back', 0, 0, -12);

  // ghosts: everyone but the part in focus fades back
  const focusK = {};
  FOCUS_STEPS.forEach(([s, names]) => { const w = win(t, A(s) - .5, B(s) + .5, .45); for (const k in PARTS) { const on = names.includes(k); focusK[k] = Math.max(focusK[k] || 0, on ? 0 : w); } });
  const gearK = trk.gears(t), meterA = trk.meterA(t), sg = trk.strokeGhost(t);
  const glass = { shell: 1, top: 1, bottom: 1, back: 1, lens: .9, mount: .9, box: .8, prism: 1 };
  for (const k in PARTS) {
    let g = focusK[k] || 0;
    if (k !== 'gears' && gearK > 0) g = Math.max(g, gearK * .8);
    if (glass[k]) g = Math.max(g, sg * .9 * glass[k]);
    PARTS[k].setGhost(g, bgc, lineC);
  }

  // section
  const open = trk.open(t), capA = open > .001 ? 1 : 0;
  for (const k in PARTS) PARTS[k].setCaps(capA);
  const pa = trk.planeA(t);
  planeG.visible = pa > .005;
  if (planeG.visible) { planeG.position.x = trk.planeX(t); planeMat.opacity = pa * .24; planeG.userData.line.opacity = pa; }

  const doorGone = trk.doorGone(t), doorOpen = trk.doorOpen(t);
  PARTS.back.g.visible = doorGone < .98;
  if (doorGone > 0) PARTS.back.g.position.z = -doorGone * 14;
  MODEL.door.rotation.y = doorOpen * 1.9;

  // mirror
  const mir = trk.mirror(t), clockMs = trk.clock(t);
  MODEL.mirror.rotation.x = Math.PI / 4 * (1 - mir);

  // focus, aperture, speed
  const composing = t >= I('fIntro');
  const f = trk.f(t), focus = trk.focus(t), speed = trk.speed(t), asa = trk.asa(t);
  let ringN = composing ? trk.ringN(t) : trk.ringLens(t);
  const dofN = trk.dofN(t), dofOn = t > B('fFar') && t < B('dofDeep') + 1.3;
  const ext = composing ? clamp((OPT.imageDist(50, Math.min(focus, 80)) - 50) / 10, 0, .7) : trk.lensExt(t);
  MODEL.helicoid.position.z = ext;
  // aperture ring and speed ring rotate with their values
  const dialN = dofOn ? dofN : ringN;
  MODEL.apRing.rotation.z = -Math.log2(dialN / 1.8) * .22;
  MODEL.speedRing.rotation.z = Math.log2(speed / 60) * .26;
  MODEL.asa.rotation.y = Math.log2(asa / 25) * 3 / ASA_MARKS.length * 6.283 - Math.PI;

  // swapping lenses: one lifts off forward and away, the other arrives
  const sw = trk.swap(t), zoomK = (f - 35) / 35;
  if (sw > 0) {
    PARTS.lens.g.position.z += ss(0, .4, sw) * 7; PARTS.lens.g.position.y += ss(.28, .6, sw) * 24;
  }
  PARTS.zoomL.g.visible = sw > .4;
  if (sw > .4) { PARTS.zoomL.g.position.set(0, (1 - ss(.45, .78, sw)) * 24, (1 - ss(.72, 1, sw)) * 7); MODEL.zTube.position.z = zoomK * 1.2; MODEL.zRear.position.z = zoomK * .5; }
  PARTS.lens.g.visible = sw < .62;

  // the battery compartment opens
  const ck = trk.cell(t);
  PARTS.cell.g.visible = ck > .01;
  MODEL.batCap.position.set(-5.6 - ss(.35, 1, ck) * 1.7, Y_BOT - ss(0, .4, ck) * .55 - ss(.35, 1, ck) * .7, -.8 + ss(.35, 1, ck) * .9);
  MODEL.batCap.rotation.y = ss(0, .4, ck) * 2.4;
  MODEL.cell.position.y = Y_BOT + .35 - ss(.3, 1, ck) * 1.45;

  // shot and timed events
  const blackHold = .45;
  if (t < SHOT_T - .05) shotAt = null;
  if (prevT < SHOT_T && t >= SHOT_T && !shotAt) { shotAt = now; Sound.shutter(); }
  const blackout = shotAt && now - shotAt < blackHold ? 1 - ss(blackHold - .14, blackHold, now - shotAt) : 0;

  // the iris: open unless something closes it
  const prev = trk.prev(t), inClock = t > A('s0') - .5 && t < B('s6') + .5;
  let irisN;
  if (!composing) irisN = ringN;
  else if (inClock) irisN = lerp(1.8, ringN, ss(0, 8, clockMs) * (1 - ss(62, 90, clockMs)));
  else if (dofOn) irisN = dofN;
  else irisN = lerp(1.8, ringN, Math.max(prev, trk.iris(t)));
  const irisR = F_MM / irisN / 2 / 10 * .96;
  if (G.irisR !== irisR) { setIris(irisR); G.irisR = irisR; }

  // detent clicks as ring values cross click-stops
  const stopIdx = lensStops.findIndex(n => dialN <= n * 1.01);
  if (G.stopIdx !== undefined && stopIdx !== G.stopIdx && t > prevT) Sound.click();
  G.stopIdx = stopIdx;

  // curtains
  let e1 = 1.95, e2 = 1.95, slitOn = 0, slowHold = 0, label = null;
  const sweep = (tau, exposure) => { // tau, exposure in ms
    const a = clamp(tau / TRAVEL), b = clamp((tau - exposure) / TRAVEL);
    return [1.95 - a * 3.9, 1.95 - b * 3.9];
  };
  const shO = trk.shOpen(t), stroke = trk.stroke(t);
  if (shO > 0) e1 = lerp(1.95, -1.95, shO);
  if (t > OVER[0]) { e1 = e2 = lerp(-1.95, 1.95, stroke); }
  if (t > OVER[0] && t < OVER[1]) {
    if (clockMs < 38) { e1 = e2 = 1.95; }
    else if (clockMs < 60) { [e1, e2] = sweep(clockMs - 38, 4); slitOn = 1; }
    else e1 = e2 = -1.95;
  }
  for (const r of RUNS) if (t >= r.a && t <= r.b) { [e1, e2] = sweep(r.p(t) * (TRAVEL + r.exp), r.exp); slitOn = 1; label = r.name; }
  if (t > B('sp60') + .7 && t < B('spSlow') + .8) { // 1/8 s: fully open, and the clockwork holds it there
    const o = ss(B('sp60') + .7, A('spSlow') - .2, t), c = ss(B('spSlow'), B('spSlow') + .7, t);
    e1 = lerp(1.95, -1.95, o); e2 = lerp(1.95, -1.95, c); label = '1/8';
    slowHold = t > A('spSlow') - .1 && t < B('spSlow') ? 1 : 0;
  }
  setCurtains(e1, e2);
  MODEL.drums.forEach((d, i) => { d.rotation.y = (i ? e2 : e1) * 1.6; });

  // light on the film through the slit: upside down, only within the gap
  const lo = Math.max(-1.8, Math.min(e1, e2)), hi = Math.min(1.8, Math.max(e1, e2));
  slitMesh.visible = slitOn > 0 && hi > lo + .005 && open < .01;
  if (slitMesh.visible) setSlit(lo, hi);

  // clockwork
  PARTS.gears.g.visible = gearK > .01;
  PARTS.gears.g.position.y = -gearK * 3.6;
  PARTS.gears.g.scale.setScalar(1 + gearK * .55);
  const run = (G.gearRun = (G.gearRun || 0) + (slowHold ? .05 : 0));
  MODEL.gearset.forEach(e2_ => { e2_.g.rotation.y = run * e2_.s * .5 + t * e2_.s * .02; });
  MODEL.anchor.rotation.y = Math.sin(run * 15) * .17;
  if (slowHold !== G.slow) { Sound.buzz(!!slowHold); G.slow = slowHold; }

  // flash
  const fl = trk.flash(t);
  PARTS.flash.g.visible = fl > .01;
  PARTS.flash.g.position.y = (1 - fl) * 9;
  if (t < FLASH_T - .05) flashAt = null;
  if (prevT < FLASH_T && t >= FLASH_T && !flashAt) { flashAt = now; Sound.shutter(); Sound.flash(); }
  const pop = flashAt ? clamp(1 - (now - flashAt) / .32) : 0;
  if (pop !== G.pop) { G.pop = pop; $('pop').style.opacity = pop * pop * (calmMotion.matches ? .3 : .95); }

  // meter: the cord runs from the rings, over the pulleys, and turns the meter in its housing
  PARTS.meter.g.visible = meterA > .01;
  const cordPos = Math.log2(speed / 60) + Math.log2(ringN / 1.8);
  MODEL.cordTex.offset.x = cordPos * .9;
  MODEL.pulleys.forEach((p, i) => { p.rotation.x = cordPos * (i ? 1.1 : -1.1); });
  const target = 12.96 + Math.log2(asa / 100), needle = clamp(target - OPT.ev(ringN, speed), -3.2, 3.2);
  MODEL.galvoG.rotation.x = needle * .12;

  // film: fades back when we look through it, and winds on
  const fa = trk.filmFade(t);
  MODEL.filmMat.opacity = fa * (1 - (focusK.film || 0) * .92);
  const sb = trk.strokeBack(t), wound = stroke;
  MODEL.filmTex.offset.x = wound * 3.8 / 14;
  MODEL.sprocket.rotation.y = wound * 6.28;
  MODEL.spool.rotation.y = wound * 4;
  MODEL.advance.rotation.y = (stroke - sb) * 150 * Math.PI / 180;
  MODEL.counter.rotation.y = -wound * .33;
  PARTS.wind.g.visible = sg > .02;
  MODEL.windGears.forEach(w => { w.g.rotation.y = wound * 5 * w.s; });
  const notch = Math.floor(stroke * 18);
  if (G.notch !== undefined && notch > G.notch && t > prevT) Sound.ratchet();
  G.notch = notch;

  // ghost of the heavier camera
  MODEL.ghostMat.opacity = trk.ghost(t) * .9;
  MODEL.ghost.visible = MODEL.ghostMat.opacity > .01;
  MODEL.ghost.scale.setScalar(trk.ghostS(t));

  // the roll, on its own
  PARTS.roll.g.visible = t > B('needle') - .1 && t < A('expAp');
  if (PARTS.roll.g.visible) MODEL.roll.rotation.y = 2.1 + (t - A('roll')) * .16;

  updateRays(t, now, ext, composing ? 1.8 : ringN, mir, { irisN });

  // diorama folds up, card by card
  const wv = trk.world(t);
  MODEL.dio.visible = wv > .001;
  DIO.forEach(d => {
    const k = ss(d.n * .11, d.n * .11 + .55, wv);
    d.hinge.rotation.x = (1 - k) * (Math.PI / 2);
    d.m.opacity = clamp(k * 3);
  });
  MODEL.floor.opacity = clamp(wv * 2.5);

  // the drying line: comes in from the side, overshoots a little, and swings to rest
  const pr = trk.print(t);
  PARTS.line.g.visible = pr > .001;
  if (pr > .001) {
    const q = clamp(pr * 1.25), back = 1 + 2.2 * Math.pow(q - 1, 3) + 1.2 * Math.pow(q - 1, 2);
    const q2 = clamp(pr * 1.25 - .25), back2 = 1 + 2.2 * Math.pow(q2 - 1, 3) + 1.2 * Math.pow(q2 - 1, 2);
    const hop = Math.abs(Math.sin(q * Math.PI * 3)) * (1 - q) * 3.4;
    LINE.print.position.x = lerp(58, 10, back); LINE.print.position.y = 20.1 + hop;
    LINE.print.rotation.z = Math.sin(q * 15) * (1 - q) * .3;
    LINE.print.rotation.y = -.1;
    LINE.neg.position.x = lerp(74, 23.5, back2); LINE.neg.rotation.z = Math.sin(q2 * 14) * (1 - q2) * .26;
  }

  // ---- viewfinder state ----
  if (t < EYE_T - .05) eyeStart = null;
  if (t >= EYE_T && !eyeStart) eyeStart = now;
  const eyeK = t >= B('eye') ? 1 : eyeStart ? Math.max(ss(A('eye'), B('eye'), t), clamp((now - eyeStart) / 2.2)) : 0;
  const sp = trk.split(t), vfA = trk.vf(t), tunnel = trk.tunnel(t), panelA = trk.panel(t);
  const vfOn = vfA > .001 || tunnel > .001;
  const hF = Math.min(H * .74, W * .9 / 1.5), wF = hF * 1.5;
  const full = { x: (W - wF) / 2, y: H * .045, w: wF, h: hF, r: 14 };
  const k = sp, P = PANEL;
  const rect = { x: lerp(full.x, P.x, k), y: lerp(full.y, P.y, k), w: lerp(full.w, P.w, k), h: lerp(full.h, P.h, k), r: lerp(full.r, P.r, k) };

  const viewN = dofOn ? dofN : lerp(1.8, ringN, prev);
  const S = {
    vfRect: rect, tunnel, f, focus, subject: trk.subject(t), viewN, eye: Math.pow(1 - eyeK, 2) * 3.2, aids: trk.aids(t),
    light: vfA > 0 ? Math.max(trk.lightIn(t), ss(0, .3, eyeK)) : 0, frame: eyeK >= 1 ? 1 : ss(.3, 1, eyeK), chaos: 1 - ss(.08, .8, eyeK),
    vfDim: prev * .55, vfBlack: blackout, vfFrame: k * .9, panX: trk.panX(t), panY: trk.panY(t), lean: trk.lean(t), jaw: trk.jaw(t), sparkle: trk.sparkle(t), needle,
  };

  const vc = VF.ctx, vd = +vfc.dataset.d;
  const grainA = trk.grainA(t);
  const show = vfOn || grainA > 0;
  if (show !== G.vfShow) { G.vfShow = show; vfc.style.display = show ? 'block' : 'none'; }
  const po = t > B('needle') && t < A('expAp') + .2 ? panelA : 1;
  if (po !== G.po) { G.po = po; vfc.style.opacity = po; }
  if (show) {
    vc.clearRect(0, 0, vfc.width, vfc.height);
    if (vfOn) drawFinder(S, vfc.width, vfc.height, vd, now);
    if (grainA > 0) {
      S.grain = { alpha: grainA, cell: trk.grainCell(t) * Math.min(1, W / 1280 * (narrow() ? 1.7 : 1), H / 720), speck: trk.speck(t), sub: trk.sub(t), front: trk.front(t), mix: trk.roadMix(t), div: Math.min(1, trk.roadDiv(t)), wave: trk.wave(t), cx: trk.grainCx(t), sx: narrow() ? .5 : .68 };
      drawGrain(S, vfc.width, vfc.height, vd, now);
    }
  }

  // ---- text ----
  CARDS.forEach(c => {
    const a = win(t, c.t[0], c.t[1], .5);
    if (a === c.a) return; c.a = a;
    c.el.style.opacity = a;
    c.el.style.visibility = a < .01 ? 'hidden' : 'visible';
    c.el.style.transform = `translateY(calc(var(--ty,0px) + ${(1 - a) * (t < (c.t[0] + c.t[1]) / 2 ? 18 : -18)}px))`;
  });
  const hero = 1 - ss(B('hero') - .1, B('hero') + 1.1, t);
  if (hero !== G.hero) {
    G.hero = hero;
    $('hero').style.opacity = hero; $('hero').style.visibility = hero < .01 ? 'hidden' : 'visible';
    $('hero').style.transform = `translateY(${-(1 - hero) * 26}px)`;
  }
  const fin = ss(A('end') - .9, A('end') - .1, t);
  if (fin !== G.fin) { G.fin = fin; $('end').style.opacity = fin; $('end').style.visibility = fin < .01 ? 'hidden' : 'visible'; }

  // clock card
  if (inClock) {
    const mt = clockMs.toFixed(clockMs < 10 ? 1 : 0);
    if (mt !== G.mt) { G.mt = mt; $('ms').textContent = mt; }
    const li = $('steps').children;
    let act = -1; CLOCK_STEPS.forEach(([s], i) => { if (t >= A(s) - .25) act = i; });
    if (act !== G.act) { G.act = act; for (let i = 0; i < li.length; i++) li[i].className = i === act ? 'on' : i < act ? 'done' : ''; }
  }

  // hud: exposure counter
  const frameNo = Math.round(t / T_END * 36);
  const cnt = frameNo < 1 ? 'S' : t > T_END - .6 ? 'E' : frameNo;
  if (cnt !== G.cnt) { G.cnt = cnt; $('count').textContent = cnt; }
  let chap = 0; CHAPTERS.forEach((c, i) => { if (t >= c[0] - .01) chap = i; });
  if (chap !== G.chap) { $('chap').textContent = CHAPTERS[chap][1]; CHAPTERS.forEach((c, i) => c.btn.classList.toggle('on', i === chap)); G.chap = chap; }
  const dh = dark > .5 || (tunnel > .5 && sp < .5);
  if (dh !== G.dh) { G.dh = dh; document.body.classList.toggle('darkhud', dh); }

  const covered = (tunnel >= 1 && sp <= 0) || grainA >= 1;
  ROOT.visible = !covered; RAYS.visible = !covered;
  if (!covered) renderAll(open);
  drawAnn(t, now, { label, dark, ringN, speed, asa, S, tunnel, sp, needle, viewN, dofOn, panelA, irisN, grainA });
}

function setCurtains(e1, e2) {
  const L = -2.95, R = 2.95;
  const c1 = MODEL.c1, c2 = MODEL.c2;
  c1.position.x = L; c1.scale.x = Math.max(.001, e1 - L);
  c2.position.x = e2; c2.scale.x = Math.max(.001, R - e2);
  MODEL.e1.position.x = e1; MODEL.e2.position.x = e2;
}
function setSlit(lo, hi) {
  const p = slitMesh.geometry.attributes.position, u = slitMesh.geometry.attributes.uv, z = FILM_Z + .02, y = 1.2;
  p.setXYZ(0, lo, -y, z); p.setXYZ(1, hi, -y, z); p.setXYZ(2, hi, y, z); p.setXYZ(3, lo, y, z);
  // seen from behind: upside down, not mirrored
  const uu = x => (1.8 - x) / 3.6;
  u.setXY(0, uu(lo), 1); u.setXY(1, uu(hi), 1); u.setXY(2, uu(hi), 0); u.setXY(3, uu(lo), 0);
  p.needsUpdate = u.needsUpdate = true;
}

// ---------- annotation layer ----------
const pv = new THREE.Vector3();
function toScreen(p) { pv.copy(p).project(camera); return [(pv.x + 1) / 2 * W, (1 - pv.y) / 2 * H, pv.z]; }
function drawAnn(t, now, X) {
  const c = ann;
  c.setTransform(DPR, 0, 0, DPR, 0, 0); c.clearRect(0, 0, W, H);
  const lightOnDark = X.dark > .5 || (X.tunnel > .6 && X.sp < .5);
  const fg = lightOnDark ? '#F7F4EE' : '#161514', chip = lightOnDark ? 'rgba(14,14,13,.86)' : 'rgba(237,233,225,.94)';
  c.font = '500 12px "DM Mono",monospace'; c.textBaseline = 'middle';
  // every label sits on a small chip of paper, so nothing behind it can swallow the text
  const tag = (x, y, text, a, align = 'left', col = fg, bgc = chip) => {
    x = Math.round(x); y = Math.round(y);
    c.font = '500 12px "DM Mono",monospace'; const w = c.measureText(text).width + 12, x0 = align === 'left' ? x - 6 : align === 'right' ? x - w + 6 : x - w / 2;
    c.globalAlpha = a; c.fillStyle = bgc; roundRect(c, x0, y - 11, w, 22, 4); c.fill();
    c.fillStyle = col; c.textAlign = align; c.fillText(text, x, y + .5); c.globalAlpha = 1;
  };
  const line = (x, y, dx, dy, text, a) => {
    c.globalAlpha = a; c.strokeStyle = fg; c.lineWidth = 1;
    x = Math.round(x) + .5; y = Math.round(y) + .5;
    const ex = Math.round(x + dx) + .5, ey = Math.round(y + dy) + .5, right = dx >= 0;
    c.beginPath(); c.moveTo(x, y); c.lineTo(ex, ey); c.lineTo(ex + (right ? 18 : -18), ey); c.stroke();
    c.fillStyle = '#E5401A'; c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); c.globalAlpha = 1;
    tag(ex + (right ? 24 : -24), ey, text.toUpperCase(), a, right ? 'left' : 'right');
  };
  const sc = narrow() ? .55 : 1;
  LABELS.forEach(l => {
    const a = win(t, l.t[0], l.t[1], .25); if (a < .01) return;
    pv.set(...l.w);
    if (l.part) { const g = PARTS[l.part].g; g.updateMatrixWorld(); pv.applyMatrix4(g.matrixWorld); }
    const p = toScreen(pv.clone());
    line(p[0], p[1], l.dx * sc, l.dy * sc, l.text, a);
  });

  // the plane gets its name while it is on stage
  const pa = win(t, A('whole') + .3, B('planeIn') + .4, .4);
  if (pa > .01) { const p = toScreen(tgt.clone().set(planeG.position.x, 7.7, 11.4)); tag(p[0], p[1] - 12, 'SECTION PLANE', pa, 'center', '#E5401A'); }

  // the finder's own markings
  const P = VF.pts, R = X.S.vfRect, m = VF.map, vd = +vfc.dataset.d, sc2 = (VF.mapScale || 1) / vd;
  const toPanel = (px, py) => m ? [R.x + (px + PAD - m.sx) * m.k * sc2, R.y + (py + PAD - m.sy) * m.k * sc2, m.k * sc2] : [0, 0, 1];
  if (P) {
    const a = win(t, A('aids') - .3, B('aids') + .3, .3);
    if (a > .01) {
      line(P.cx - P.r1 * .4, P.cy - P.r1 * .4, -R.w * .24, -R.h * .22, 'Split image', a);
      line(P.cx + P.r2 * .75, P.cy + P.r2 * .55, R.w * .13, R.h * .24, 'Microprism collar', a);
      line(R.x + R.w * .22, R.y + R.h * .78, -R.w * .1, R.h * .1, 'Matte field', a);
      line(P.mx, P.ny, -R.w * .08, -R.h * .2, 'Meter needle', a);
    }
    // the split circle, on the edge of the ear
    const a1 = win(t, A('fSplit1') - .2, B('fSplit1') + .2, .25), a2 = win(t, A('fSplit2') - .15, B('fSplit2') + .2, .25);
    if (a1 > .01) { line(P.cx + P.dx, P.cy - P.r1 * .6, 40, -P.r1 * .32, 'Upper half', a1); line(P.cx - P.dx, P.cy + P.r1 * .6, 40, P.r1 * .32, 'Lower half', a1); }
    if (a2 > .01) line(P.cx, P.cy - P.r1 * .55, 46, -P.r1 * .34, 'One straight line', a2);
    if (t > A('fIntro') - .2 && t < B('preview') && !narrow() && X.panelA > .5) { // live readout under the panel
      const fnum = X.viewN < 2 ? X.viewN.toFixed(1) : X.viewN.toFixed(1).replace('.0', '');
      const sd = X.S.focus > 50 ? '∞' : X.S.focus.toFixed(1) + ' m';
      c.globalAlpha = X.sp * X.panelA; c.fillStyle = '#161514'; c.textAlign = 'left'; c.font = '500 12px "DM Mono",monospace';
      c.fillText(`${Math.round(X.S.f)} MM   F/${fnum}   1/${Math.round(X.speed)}   ${sd}   ASA ${Math.round(X.asa)}`, R.x, R.y + R.h + 16);
      c.globalAlpha = 1;
    }
  }
  // "focused here"
  FOCUS_MARKS.forEach(fm => {
    const a = win(t, A(fm.s) - .15, B(fm.s) + .2, .25); if (a < .01) return;
    const src = fm.at === 'flower' ? FLOWER : HOUSE, [x, y, k] = toPanel(src[0], src[1]);
    c.globalAlpha = a; c.strokeStyle = '#E5401A'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, fm.r * k, 0, 7); c.stroke(); c.globalAlpha = 1;
    tag(x, y - fm.r * k - 16, fm.text.toUpperCase(), a, 'center', '#F7F4EE', 'rgba(229,64,26,.95)');
  });
  // how deep is the sharp zone? a live ruler from 1 m to the horizon
  const db = trk.dofBar(t);
  if (db > .01) drawDofRuler(c, R, X.viewN, X.S.focus, db, tag);

  // the meter's target, and how far off you are
  const ga = t > I('needle') && t < B('expSh') + .6 ? X.panelA * win(t, A('needle') - .3, B('expSh') + .5, .35) : 0;
  if (ga > .01) drawGauge(c, X.needle, X.asa, ga, tag);

  // face-on view of the iris
  const ia = Math.max(win(t, A('ap1') - .6, B('dof2') + .3, .4), win(t, A('expAp') - .3, B('expAp') + .3, .3), win(t, A('dofThin') - .3, B('dofDeep') + .3, .3));
  if (ia > .01) {
    const nar = narrow(), inComp = t > I('fIntro');
    drawIrisInset(c, nar ? W - 62 : W - 150, inComp ? (nar ? H * .62 : H - 150) : (nar ? 112 : 130), nar ? 38 : inComp ? 60 : 80, X.irisN, ia, fg);
  }

  // depth of field, magnified: what each subject makes on the film
  const da = win(t, A('dof1') - .1, B('dof2') + .1, .3);
  if (da > .01 && G.disc) {
    const x = W - (narrow() ? 74 : 150), y = narrow() ? 245 : 340;
    c.save(); c.globalAlpha = da; c.textAlign = 'center';
    c.fillStyle = fg; c.font = '500 11px "DM Mono",monospace'; c.fillText('ON THE FILM', x, y - 52);
    c.fillStyle = '#E5401A'; c.beginPath(); c.arc(x - 44, y, 3.5, 0, 7); c.fill();
    c.fillStyle = 'rgba(22,21,20,.82)'; c.beginPath(); c.arc(x + 26, y, Math.max(3.5, G.disc[1] * 72), 0, 7); c.fill();
    c.restore();
  }

  // shutter speed name
  if (X.label && t >= I('sp1000') && t < B('spSlow') + .5) {
    c.font = '400 44px "Instrument Serif",serif'; c.fillStyle = '#F7F4EE'; c.textAlign = 'center'; c.globalAlpha = .95;
    const up = X.label === '1/8', p = toScreen(tgt.clone().set(0, up ? 3.1 : -3.1, FILM_Z));
    c.fillText(X.label + ' s', p[0], p[1] + (up ? 12 : 40)); c.globalAlpha = 1;
  }

  // flash: the two frames that explain sync
  const fa = win(t, A('sync') - .2, B('sync') + .3, .3);
  if (fa > .01 && WORLD.bw) {
    const nar = narrow(), w = nar ? W * .4 : Math.min(190, W * .13), h = w / 1.5, g = 22;
    const x0 = nar ? W / 2 - w - g / 2 : W * .59, y0 = nar ? H * .1 : H * .69;
    c.globalAlpha = fa;
    [[0, '1/60'], [1, '1/250']].forEach(([i, nm]) => {
      const x = x0 + i * (w + g);
      c.drawImage(WORLD.bw, x, y0, w, h);
      if (i) { c.fillStyle = 'rgba(14,13,12,.9)'; c.fillRect(x, y0, w * .34, h); c.fillRect(x + w * .66, y0, w * .34, h); }
      c.strokeStyle = '#161514'; c.strokeRect(x + .5, y0 + .5, w, h);
      c.fillStyle = '#161514'; c.textAlign = 'left'; c.font = '500 12px "DM Mono",monospace'; c.fillText(nm + (i ? '  ONLY THE SLIT' : '  FULL FRAME'), x, y0 + h + 16);
    });
    c.globalAlpha = 1;
  }
}

function drawDofRuler(c, R, N, focus, a, tag) {
  const x0 = R.x + 22, x1 = R.x + R.w - 22, y = R.y + R.h - 34;
  const px = m => lerp(x0, x1, clamp(Math.log(Math.min(m, 100)) / Math.log(100)));
  const [near, far] = OPT.dof(50, N, focus);
  c.save(); c.globalAlpha = a;
  c.fillStyle = 'rgba(14,13,12,.72)'; roundRect(c, R.x + 8, y - 22, R.w - 16, 46, 6); c.fill();
  c.strokeStyle = '#F7F4EE'; c.lineWidth = 1; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
  c.fillStyle = '#E5401A'; c.fillRect(px(near), y - 5, Math.max(3, px(far) - px(near)), 10);
  c.font = '500 11px "DM Mono",monospace'; c.fillStyle = '#F7F4EE'; c.textBaseline = 'middle'; c.textAlign = 'center';
  [[1, '1 M'], [3, 'DOG'], [10, '10'], [60, 'HOUSE'], [100, '∞']].forEach(([m, s]) => { c.fillRect(px(m), y - 3, 1, 6); c.fillText(s, px(m), y + 13); });
  c.textAlign = 'left';
  const txt = far === Infinity ? `SHARP FROM ${near.toFixed(1)} M TO ∞` : `SHARP FROM ${near.toFixed(1)} TO ${far.toFixed(1)} M`;
  c.fillText(txt, x0, y - 13);
  c.restore();
}
function drawGauge(c, needle, asa, a, tag) {
  const nar = narrow(), x0 = nar ? 26 : PANEL.x + PANEL.w + 50, x1 = nar ? W - 26 : W - 90, y = nar ? PANEL.y + PANEL.h + 26 : PANEL.y + 40, cx = (x0 + x1) / 2, half = (x1 - x0) / 2;
  c.save(); c.globalAlpha = a; c.strokeStyle = '#161514'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
  for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(cx + i / 3 * half, y - (i ? 4 : 10)); c.lineTo(cx + i / 3 * half, y + (i ? 4 : 10)); c.stroke(); }
  c.fillStyle = '#161514'; c.font = '500 11px "DM Mono",monospace'; c.textBaseline = 'middle';
  c.textAlign = 'left'; c.fillText('TOO DARK', x0, y + 22);
  c.textAlign = 'right'; c.fillText('TOO BRIGHT', x1, y + 22);
  c.textAlign = 'center'; c.fillText(`TARGET FOR ASA ${Math.round(asa)}`, cx, y - 22);
  const nx = cx + clamp(needle / 3.2, -1, 1) * half;
  c.fillStyle = '#E5401A'; c.beginPath(); c.moveTo(nx, y + 1); c.lineTo(nx - 8, y + 14); c.lineTo(nx + 8, y + 14); c.closePath(); c.fill();
  c.fillRect(nx - 1, y - 12, 2, 14);
  c.restore();
}

function drawIrisInset(c, x, y, r, N, a, fg) {
  c.save(); c.globalAlpha = a;
  c.fillStyle = '#161514'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  const ir = r * (50 / N / 28) * .94, spin = (1 - ir / r) * 1.1;
  // blade edges run from each corner of the hole out to the rim
  c.fillStyle = '#EDE9E1'; c.beginPath();
  const pts = [];
  for (let i = 0; i < 6; i++) { const q = i / 6 * 6.283 + spin; pts.push([x + Math.cos(q) * ir, y + Math.sin(q) * ir]); }
  pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(237,233,225,.35)'; c.lineWidth = 1;
  pts.forEach((p, i) => {
    const n = pts[(i + 1) % 6], dx = n[0] - p[0], dy = n[1] - p[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    const b = ux * (p[0] - x) + uy * (p[1] - y), cc = (p[0] - x) ** 2 + (p[1] - y) ** 2 - r * r, s = -b + Math.sqrt(Math.max(0, b * b - cc));
    c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0] + ux * s, p[1] + uy * s); c.stroke();
  });
  c.fillStyle = fg || '#161514'; c.textAlign = 'center'; c.font = '400 28px "Instrument Serif",serif';
  c.fillText('f/' + (N < 10 ? (Math.round(N * 10) / 10) : Math.round(N)), x, y + r + 24);
  c.restore();
}

history.scrollRestoration = 'manual'; scrollTo(0, 0);
Promise.all(['500 20px "DM Mono"', '400 20px "Instrument Serif"', '700 20px "DM Sans"', '400 20px "DM Sans"'].map(f => document.fonts.load(f))).then(init, init);
