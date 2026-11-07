// ---------- the 3D camera ----------
// Units: 1 = 10 mm. Lens axis is the z axis (y=0, x=0), lens points +z, film at z=-2.
// So: flange at z=2.6 (46 mm), mirror crosses the axis at z=0.1, screen at y=2.1:
// the same 21 mm from the mirror as the film, which is the whole trick of an SLR.
const FILM_Z = -2, SCREEN_Y = 2.1, MIRROR_Z = .1;
const CUT = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 100);
const ROLL_POS = [0, 1.2, -26], ASA_MARKS = [25, 32, 40, 50, 64, 80, 100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 1250, 1600];
let CAPN = 0;

const gradTex = (() => {
  const d = new Uint8Array([150, 150, 150, 255, 215, 215, 215, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
})();

const hullUniforms = { uRes: { value: new THREE.Vector2(1, 1) } };
function hullMaterial(width, color) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, clipping: true, clippingPlanes: [CUT],
    uniforms: { uW: { value: width }, uRes: hullUniforms.uRes, uC: { value: new THREE.Color(color) }, uA: { value: 1 } },
    vertexShader: `
      #include <clipping_planes_pars_vertex>
      uniform float uW; uniform vec2 uRes;
      void main(){
        #include <begin_vertex>
        #include <project_vertex>
        #include <clipping_planes_vertex>
        vec3 n = normalize(normalMatrix*normal);
        vec2 nc = (projectionMatrix*vec4(n,0.)).xy;
        nc = nc/(length(nc)+1e-5);
        gl_Position.xy += nc*uW*gl_Position.w/uRes*2.;
      }`,
    fragmentShader: `
      #include <clipping_planes_pars_fragment>
      uniform vec3 uC; uniform float uA;
      void main(){
        #include <clipping_planes_fragment>
        gl_FragColor = vec4(uC,uA);
      }`,
  });
}

// A named assembly. Remembers its materials so it can be ghosted and recoloured.
class Part {
  constructor(name, parent) {
    this.name = name; this.g = new THREE.Group(); this.g.name = name;
    (parent || ROOT).add(this.g);
    this.mats = []; this.lines = []; this.hulls = []; this.caps = []; this.home = new THREE.Vector3();
    PARTS[name] = this;
  }
  mesh(geo, color, o = {}) {
    const clip = o.clip !== false;
    const m = new THREE.MeshToonMaterial({
      color, gradientMap: gradTex, side: o.side || THREE.FrontSide,
      transparent: !!o.opacity, opacity: o.opacity || 1, depthWrite: !o.opacity,
      clippingPlanes: clip ? [CUT] : [], clipShadows: false, map: o.map || null,
    });
    const mesh = new THREE.Mesh(geo, m);
    (o.parent || this.g).add(mesh);
    this.mats.push({ m, base: new THREE.Color(color), op: o.opacity || 1 });
    if (o.hull !== false && !o.opacity) {
      const hm = hullMaterial(o.hullW || 1.15, COL.ink);
      if (!clip) hm.clippingPlanes = [];
      const h = new THREE.Mesh(geo, hm); mesh.add(h); this.hulls.push(hm);
    }
    if (o.edges !== false) {
      const eg = new THREE.EdgesGeometry(geo, o.thr || 32);
      const lm = new THREE.LineBasicMaterial({ color: COL.ink, transparent: true, clippingPlanes: clip ? [CUT] : [] });
      const l = new THREE.LineSegments(eg, lm); mesh.add(l); this.lines.push(lm);
    }
    return mesh;
  }
  // section-cut face drawn in the x=0 plane. pts are [z, y].
  cap(pts, color = COL.ink, holes = [], parent) {
    const s = new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1])));
    holes.forEach(h => s.holes.push(new THREE.Path(h.map(p => new THREE.Vector2(p[0], p[1])))));
    const g = new THREE.ShapeGeometry(s); g.rotateY(-Math.PI / 2);
    const m = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0 });
    const mesh = new THREE.Mesh(g, m); mesh.position.x = .004 + (CAPN++) * .0022; mesh.renderOrder = 3;
    (parent || this.g).add(mesh);
    this.caps.push({ m, base: new THREE.Color(color) });
    return mesh;
  }
  // solid of revolution round the lens axis, with an automatic section cap.
  lathe(profile, color, o = {}) {
    const pts = profile.map(p => new THREE.Vector2(p[0], p[1]));
    const closed = pts.concat([pts[0].clone()]);
    const g = new THREE.LatheGeometry(closed, o.seg || 72); g.rotateX(Math.PI / 2);
    const mesh = this.mesh(g, color, Object.assign({ side: THREE.DoubleSide, thr: 28 }, o));
    if (o.capc !== null) {
      const c = o.capc === undefined ? COL.ink : o.capc;
      const up = this.cap(profile.map(p => [p[1], p[0]]), c, [], o.parent);
      const dn = this.cap(profile.map(p => [p[1], -p[0]]), c, [], o.parent);
      mesh.userData.caps = [up, dn];
    }
    return mesh;
  }
  ring(r1, r2, z1, z2, color, o) { return this.lathe([[r1, z1], [r2, z1], [r2, z2], [r1, z2]], color, o); }
  setGhost(k, bg, lineC) {
    const key = k + '|' + bg.getHex() + '|' + lineC;
    if (key === this.gKey) return; this.gKey = key;
    const on = k > .01;
    this.mats.forEach(e => {
      e.m.color.copy(e.base).lerp(bg, k * .55);
      const tr = on || e.op < 1;
      if (e.m.transparent !== tr) { e.m.transparent = tr; e.m.needsUpdate = true; }
      e.m.opacity = e.op * (1 - k * .93); e.m.depthWrite = !on && e.op === 1;
    });
    this.hulls.forEach(h => { h.uniforms.uC.value.set(lineC); h.uniforms.uA.value = 1 - k; h.transparent = on; });
    this.lines.forEach(l => { l.color.set(lineC); l.opacity = 1 - k * .72; });
  }
  setCaps(a) { if (a === this.capA) return; this.capA = a; this.caps.forEach(c => { c.m.opacity = a; }); }
}

const ROOT = new THREE.Group();
const PARTS = {};
const MODEL = {};

function plan(w, d, r) { // rounded rectangle in (x, -z)
  const s = new THREE.Shape(), x = w / 2, z = d / 2;
  s.moveTo(-x + r, -z); s.lineTo(x - r, -z); s.absarc(x - r, -z + r, r, -Math.PI / 2, 0);
  s.lineTo(x, z - r); s.absarc(x - r, z - r, r, 0, Math.PI / 2);
  s.lineTo(-x + r, z); s.absarc(-x + r, z - r, r, Math.PI / 2, Math.PI);
  s.lineTo(-x, -z + r); s.absarc(-x + r, -z + r, r, Math.PI, Math.PI * 1.5);
  return s;
}
function extrudeY(shape, y0, y1, seg = 16) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: false, curveSegments: seg });
  g.rotateX(-Math.PI / 2); g.translate(0, y0, 0); return g;
}
function extrudeZ(shape, z0, z1) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: z1 - z0, bevelEnabled: false, curveSegments: 24 });
  g.translate(0, 0, z0); return g;
}
function polyShape(pts) { return new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1]))); }
// extrude a (z,y) section along x, centred, optional taper toward the top
function extrudeX(pts, half, taper = 0, y0 = 0) {
  const g = new THREE.ExtrudeGeometry(polyShape(pts), { depth: half * 2, bevelEnabled: false });
  g.translate(0, 0, -half); g.rotateY(-Math.PI / 2);
  if (taper) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) * (1 - taper * Math.max(0, p.getY(i) - y0)));
    g.computeVertexNormals();
  }
  return g;
}
function gearShape(teeth, r, depth = .14, hole = .1) {
  const s = new THREE.Shape(), n = teeth * 4;
  for (let i = 0; i <= n; i++) {
    const a = i / n * Math.PI * 2, k = i % 4, rr = (k === 0 || k === 1) ? r : r - depth;
    i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  if (hole) { const h = new THREE.Path(); h.absarc(0, 0, hole, 0, Math.PI * 2, true); s.holes.push(h); }
  return s;
}
function decalTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace; return t;
}
function ticks(part, r, z, n, len, parent) { // engraved lines around a ring
  const p = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, x = Math.cos(a) * r, y = Math.sin(a) * r;
    p.push(x, y, z, x, y, z + len);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  const m = new THREE.LineBasicMaterial({ color: COL.ink, transparent: true, clippingPlanes: [CUT] });
  (parent || part.g).add(new THREE.LineSegments(g, m)); part.lines.push(m);
}
// printed scale wrapped on a cylinder facing outwards
function ringDecal(part, r, z1, z2, labels, parent, opts = {}) {
  const tex = decalTex(2048, 96, (c, w, h) => {
    c.clearRect(0, 0, w, h); c.fillStyle = opts.color || '#f2efe8';
    c.font = '500 46px "DM Mono", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
    labels.forEach((l, i) => {
      const x = (i + .5) / labels.length * w * (opts.span || 1);
      c.save(); c.translate(x, h / 2); c.scale(-1, 1); c.fillText(l, 0, 0); c.restore();
    });
  });
  const g = new THREE.CylinderGeometry(r, r, z2 - z1, 96, 1, true); g.rotateX(Math.PI / 2); g.translate(0, 0, (z1 + z2) / 2);
  const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.BackSide, depthWrite: false, clippingPlanes: [CUT] });
  const mesh = new THREE.Mesh(g, m); (parent || part.g).add(mesh); return mesh;
}

// plan of the body, measured from reference photos. The lens axis sits about 5 mm
// towards the rewind side of the body centre, and the body itself is only ~33 mm deep:
// everything in front of z=.85 is the mount housing.
const PL = [[-6.6, .85], [5.6, .85], [6.15, .45], [6.3, -.3], [6.3, -1.8], [5.85, -2.45], [-6.85, -2.45], [-7.3, -1.8], [-7.3, -.3], [-7.15, .45]];
const planShape = () => polyShape(PL.map(([x, z]) => [x, -z]));
const Y_TOP = 3.4, Y_DECK = 2.2, Y_LEA = -2.7, Y_BOT = -3.2;

function solid(verts, faces) { // flat-shaded polyhedron from polygon faces
  const p = [];
  faces.forEach(f => { for (let i = 1; i < f.length - 1; i++) [f[0], f[i], f[i + 1]].forEach(k => p.push(...verts[k])); });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.computeVertexNormals(); return g;
}
function pebbleTex() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#d4d4d4'; x.fillRect(0, 0, 256, 256);
  let s = 11; const r = () => (s = s * 16807 % 2147483647) / 2147483647;
  for (let i = 0; i < 2600; i++) { const v = 170 + r() * 85 | 0; x.fillStyle = `rgb(${v},${v},${v})`; x.beginPath(); x.ellipse(r() * 256, r() * 256, 1.5 + r() * 3.2, 1.5 + r() * 2.6, r() * 3, 0, 7); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(.42, .42); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// diamond knurl or straight ribbing, wrapped on a cylinder
function knurl(part, r, z1, z2, parent, o = {}) {
  const n = o.n || 150, tex = decalTex(2048, 64, (c, w, h) => {
    c.clearRect(0, 0, w, h); c.strokeStyle = o.color || 'rgba(120,118,112,.9)'; c.lineWidth = o.lw || 2.2;
    const step = w / n;
    for (let i = -8; i < n + 8; i++) {
      c.beginPath();
      if (o.straight) { c.moveTo(i * step, 0); c.lineTo(i * step, h); }
      else { c.moveTo(i * step, 0); c.lineTo(i * step + h, h); c.moveTo(i * step + h, 0); c.lineTo(i * step, h); }
      c.stroke();
    }
  });
  const g = new THREE.CylinderGeometry(r, r, z2 - z1, 96, 1, true); g.rotateX(Math.PI / 2); g.translate(0, 0, (z1 + z2) / 2);
  const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.FrontSide, depthWrite: false, clippingPlanes: [CUT] });
  const mesh = new THREE.Mesh(g, m); (parent || part.g).add(mesh); part.mats.push({ m, base: new THREE.Color(0xffffff), op: .999 }); return mesh;
}
function faceText(part, rOut, z, text, parent) { // lettering round the front of the lens
  const t = decalTex(1024, 1024, (c, w, h) => {
    c.clearRect(0, 0, w, h); c.translate(w / 2, h / 2); c.fillStyle = '#EDE9E1'; c.font = '500 54px "DM Mono",monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const R = 405, L = text.length; for (let i = 0; i < L; i++) { c.save(); c.rotate((i - L / 2) / L * 5.6); c.translate(0, -R); c.fillText(text[i], 0, 0); c.restore(); }
  });
  const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, clippingPlanes: [CUT] });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(rOut * 2.26, rOut * 2.26), m); mesh.position.z = z; (parent || part.g).add(mesh);
  part.mats.push({ m, base: new THREE.Color(0xffffff), op: .999 }); return mesh;
}
function plateText(part, w, h, text, font, color, pos, rot, parent) {
  const t = decalTex(1024, Math.round(1024 * h / w), (c, W, H) => { c.fillStyle = color; c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, W / 2, H / 2); });
  const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, clippingPlanes: [CUT] });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); mesh.position.set(...pos); mesh.rotation.set(...rot);
  (parent || part.g).add(mesh); part.mats.push({ m, base: new THREE.Color(0xffffff), op: .999 }); return mesh;
}
// a 35 mm cassette, standing on the y axis. Shared by the camera and the close-up.
function cassette(part, parent, clip) {
  const o = { parent, clip, thr: 40 };
  const label = decalTex(1024, 512, (c, w, h) => {
    c.fillStyle = '#EDE9E1'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#E5401A'; c.fillRect(0, 0, w, 96); c.fillRect(0, h - 96, w, 96);
    c.fillStyle = '#161514'; c.textAlign = 'center'; c.textBaseline = 'middle';
    [256, 768].forEach(x => {
      c.save(); c.translate(x, h / 2);
      c.font = '400 170px "Instrument Serif",serif'; c.fillText('100', 0, -22);
      c.font = '500 40px "DM Mono",monospace'; c.fillText('ASA · 36 EXP', 0, 92); c.restore();
    });
  });
  part.mesh(new THREE.CylinderGeometry(1.25, 1.25, 3.7, 48, 1, true), 0xffffff, { ...o, map: label, side: THREE.DoubleSide, edges: false });
  [1.85, -1.85].forEach(y => part.mesh(new THREE.CylinderGeometry(1.27, 1.27, .12, 48).translate(0, y, 0), COL.chrome2, o));
  part.mesh(new THREE.CylinderGeometry(.42, .42, .55, 28).translate(0, 2.15, 0), COL.leather, o);
  part.mesh(new THREE.CylinderGeometry(.42, .42, .22, 28).translate(0, -2, 0), COL.leather, o);
  // the velvet light trap where the film comes out
  part.mesh(new THREE.BoxGeometry(.5, 3.6, .22).translate(.72, 0, -1.2), COL.leather, o);
}

function buildCamera() {
  const P = n => new Part(n);
  const leather = 0x2E2B28, LM = pebbleTex();

  // --- shell: leatherette, with the door as a separate piece ---
  const shell = P('shell');
  {
    const fr = polyShape([[-6.6, Y_LEA], [5.6, Y_LEA], [5.6, Y_DECK], [-6.6, Y_DECK]]);
    fr.holes.push(new THREE.Path([[-2.45, -2.6], [-2.45, 2.15], [2.45, 2.15], [2.45, -2.6]].map(p => new THREE.Vector2(p[0], p[1]))));
    shell.mesh(extrudeZ(fr, .71, .85), leather, { edges: false, map: LM });
    const side = (ch, sgn) => {
      const inn = ch.map(([x, z]) => [x - sgn * .14, z - (z > 0 ? .14 : -.1)]).reverse();
      shell.mesh(extrudeY(polyShape(ch.concat(inn).map(([x, z]) => [x, -z])), Y_LEA, Y_DECK), leather, { side: THREE.DoubleSide, edges: false, map: LM });
    };
    side([[5, .85], [5.6, .85], [6.15, .45], [6.3, -.3], [6.3, -1.8], [6.12, -2.1]], 1);
    side([[-6, .85], [-6.6, .85], [-7.15, .45], [-7.3, -.3], [-7.3, -1.8], [-7.12, -2.1]], -1);
    shell.cap([[.71, Y_LEA], [.85, Y_LEA], [.85, -2.6], [.71, -2.6]]);
    shell.cap([[.71, 2.15], [.85, 2.15], [.85, Y_DECK], [.71, Y_DECK]]);
    // chrome housing that carries the mount forward of the body
    const out = [[-2.5, 3.4], [2.5, 3.4], [2.72, 2.2], [2.9, .4], [2.82, -1.6], [2.32, -2.95], [-2.32, -2.95], [-2.82, -1.6], [-2.9, .4], [-2.72, 2.2]];
    const fp = polyShape(out); const hole = new THREE.Path(); hole.absarc(0, 0, 2.45, 0, Math.PI * 2, true); fp.holes.push(hole);
    shell.mesh(extrudeZ(fp, 1.76, 2.02), COL.chrome);
    const ring = polyShape(out); ring.holes.push(new THREE.Path(out.map(([x, y]) => new THREE.Vector2(x * .95, y > 0 ? y - .12 : y + .12))));
    shell.mesh(extrudeZ(ring, .85, 1.76), COL.chrome, { edges: false });
    shell.cap([[.85, 3.28], [1.76, 3.28], [1.76, 3.4], [.85, 3.4]]);
    shell.cap([[1.76, 2.45], [2.02, 2.45], [2.02, 3.4], [1.76, 3.4]]);
    shell.cap([[.85, -2.95], [1.76, -2.95], [1.76, -2.83], [.85, -2.83]]);
    shell.cap([[1.76, -2.95], [2.02, -2.95], [2.02, -2.45], [1.76, -2.45]]);
    // strap lugs
    [-7.28, 6.28].forEach(x => {
      shell.mesh(new THREE.TorusGeometry(.42, .05, 8, 28).translate(x + .02, 1.5, -.7), COL.chrome, { thr: 60, hullW: .7 });
      shell.mesh(new THREE.CylinderGeometry(.13, .13, .22, 12).rotateZ(Math.PI / 2).translate(x, 1.86, -.7), COL.chrome2, { hullW: .7 });
    });
    // self-timer lever on its round base
    const st = new THREE.Group(); st.position.set(-3.95, -1.1, .85); shell.g.add(st);
    shell.mesh(new THREE.CylinderGeometry(.6, .6, .1, 32).rotateX(Math.PI / 2).translate(0, 0, .05), COL.leather, { parent: st, thr: 40 });
    shell.mesh(new THREE.CylinderGeometry(.4, .4, .14, 32).rotateX(Math.PI / 2).translate(0, 0, .12), COL.chrome, { parent: st, thr: 40 });
    shell.mesh(new THREE.BoxGeometry(.24, 1.7, .14).translate(0, .95, .12), COL.leather, { parent: st });
    // the two small knobs either side of the housing
    shell.mesh(new THREE.CylinderGeometry(.24, .24, .5, 16).rotateZ(.4).translate(3.05, 1.55, 1.1), COL.chrome, { thr: 50 });
    shell.mesh(new THREE.CylinderGeometry(.2, .2, .4, 16).rotateZ(-.4).translate(-3.05, 1.55, 1.1), COL.chrome2, { thr: 50 });
  }

  // --- bottom plate, battery chamber, tripod socket ---
  const bottom = P('bottom');
  bottom.mesh(extrudeY(planShape(), Y_BOT, Y_LEA), COL.chrome);
  bottom.cap([[-2.45, Y_BOT], [.85, Y_BOT], [.85, Y_LEA], [-2.45, Y_LEA]]);
  bottom.mesh(new THREE.CylinderGeometry(.24, .24, .05, 20).translate(0, Y_BOT - .02, -.8), COL.chrome2, { thr: 40 });
  MODEL.batCap = new THREE.Group(); MODEL.batCap.position.set(-5.6, Y_BOT, -.8); bottom.g.add(MODEL.batCap);
  bottom.mesh(new THREE.CylinderGeometry(.95, .95, .08, 44).translate(0, -.03, 0), COL.chrome2, { parent: MODEL.batCap, thr: 40 });
  bottom.mesh(new THREE.BoxGeometry(1.15, .03, .1).translate(0, -.075, 0), COL.ink, { parent: MODEL.batCap, hull: false, edges: false });

  // --- top plate, hump, controls ---
  const top = P('top');
  {
    const s = planShape();
    s.holes.push(new THREE.Path([[-2, 2.2], [2, 2.2], [2, -.75], [-2, -.75]].map(p => new THREE.Vector2(p[0], p[1]))));
    top.mesh(extrudeY(s, Y_DECK, Y_TOP), COL.chrome);
    top.cap([[-2.45, Y_DECK], [-2.2, Y_DECK], [-2.2, Y_TOP], [-2.45, Y_TOP]]);
    top.cap([[.75, Y_DECK], [.85, Y_DECK], [.85, Y_TOP], [.75, Y_TOP]]);
    // the hump is a faceted pyramid: front band, sloped roof, narrow rear
    const V = [], pair = (x, y, z) => { V.push([-x, y, z], [x, y, z]); return V.length - 2; };
    const bf = pair(2.5, Y_TOP, 1.76), tf = pair(2.2, 4.0, 1.64), af = pair(.8, 5.3, .55), rr = pair(.62, 4.78, -1.35), et = pair(1.02, 4.05, -2.3), br = pair(1.75, Y_TOP, -2.3);
    const q = (a, b) => [a, a + 1, b + 1, b];
    const faces = [q(bf, tf), q(tf, af), q(af, rr), q(rr, et), q(et, br),
      [bf + 1, br + 1, et + 1, rr + 1, af + 1, tf + 1], [bf, tf, af, rr, et, br]];
    top.mesh(solid(V, faces), COL.chrome, { side: THREE.DoubleSide, thr: 12 });
    const outer = [[-2.3, Y_TOP], [1.76, Y_TOP], [1.64, 4.0], [.55, 5.3], [-1.35, 4.78], [-2.3, 4.05]];
    const inner = [[-2.17, Y_TOP], [1.62, Y_TOP], [1.51, 3.95], [.52, 5.14], [-1.31, 4.65], [-2.17, 4.0]];
    top.cap(outer, COL.ink, [inner]);
    plateText(top, 3.6, .56, 'OLYMPUS', '700 150px "DM Sans",sans-serif', '#161514', [0, 3.7, 1.725], [-.2, 0, 0]);
    plateText(top, 1.3, .32, 'OM-1', 'italic 700 170px "DM Sans",sans-serif', '#161514', [3.15, Y_TOP + .012, .35], [-Math.PI / 2, 0, 0]);
    // rectangular eyepiece, the shoe screw, and the little R collar on the front
    top.mesh(new THREE.BoxGeometry(1.72, 1.3, .32).translate(0, 3.2, -2.46), COL.leather);
    top.mesh(new THREE.BoxGeometry(1.2, .82, .02).translate(0, 3.2, -2.63), 0x7E97A2, { hull: false, edges: false });
    top.mesh(new THREE.CylinderGeometry(.18, .18, .05, 18).rotateX(-.42).translate(0, 4.52, -1.82), COL.chrome2, { thr: 40, hullW: .7 });
    top.mesh(new THREE.CylinderGeometry(.42, .42, .22, 28).rotateX(Math.PI / 2).translate(-3.55, 2.72, .95), COL.chrome, { thr: 40 });
    top.mesh(new THREE.BoxGeometry(.72, .07, .06).translate(-3.55, 2.72, 1.07), COL.chrome2, { hull: false, edges: false });
    // winding side
    const lever = P('lever'); MODEL.advance = new THREE.Group(); MODEL.advance.position.set(-5.8, Y_TOP, -1.0); lever.g.add(MODEL.advance);
    lever.mesh(new THREE.CylinderGeometry(.86, .86, .1, 44).translate(0, .05, 0), COL.chrome2, { parent: MODEL.advance, thr: 40 });
    lever.mesh(new THREE.CylinderGeometry(.74, .74, .3, 44).translate(0, .25, 0), COL.chrome, { parent: MODEL.advance, thr: 40 });
    lever.mesh(new THREE.CylinderGeometry(.62, .62, .03, 44).translate(0, .41, 0), COL.leather, { parent: MODEL.advance, thr: 40 });
    const lev = new THREE.Shape(); lev.moveTo(0, -.2); lev.lineTo(2.3, -.14); lev.lineTo(2.3, .14); lev.lineTo(0, .2); lev.closePath();
    const lg2 = extrudeY(lev, .1, .17); lg2.rotateY(.46);
    lever.mesh(lg2, COL.chrome2, { parent: MODEL.advance });
    const tip = extrudeY(plan(1.2, .34, .12), .08, .26); tip.translate(2.8, 0, 0); tip.rotateY(.46);
    lever.mesh(tip, COL.leather, { parent: MODEL.advance });
    // film counter window at the very end of the plate
    MODEL.counter = top.mesh(new THREE.CylinderGeometry(.3, .3, .03, 24), 0xEDE9E1, { hull: false, edges: false, thr: 40 });
    MODEL.counter.position.set(-6.75, Y_TOP + .012, -.75);
    top.mesh(new THREE.BoxGeometry(.04, .02, .24), COL.ink, { hull: false, edges: false, parent: MODEL.counter }).position.y = .02;
    MODEL.shutterBtn = new THREE.Group(); MODEL.shutterBtn.position.set(-4.45, Y_TOP, -.25); top.g.add(MODEL.shutterBtn);
    top.mesh(new THREE.CylinderGeometry(.6, .66, .16, 36).translate(0, .08, 0), COL.leather, { parent: MODEL.shutterBtn, thr: 40 });
    top.mesh(new THREE.CylinderGeometry(.42, .46, .14, 36).translate(0, .23, 0), COL.chrome, { parent: MODEL.shutterBtn, thr: 40 });
    top.mesh(new THREE.CylinderGeometry(.13, .13, .03, 16).translate(0, .31, 0), COL.ink, { parent: MODEL.shutterBtn, hull: false, edges: false });
    // ASA dial: knurled, with its own printed scale
    MODEL.asa = new THREE.Group(); MODEL.asa.position.set(-2.8, Y_TOP, -.72); top.g.add(MODEL.asa);
    top.mesh(new THREE.CylinderGeometry(1.1, 1.1, .3, 56).translate(0, .15, 0), COL.chrome2, { parent: MODEL.asa, thr: 60 });
    const asaT = decalTex(512, 512, c => {
      c.fillStyle = '#161514'; c.beginPath(); c.arc(256, 256, 250, 0, 7); c.fill();
      c.font = '500 34px "DM Mono",monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
      ASA_MARKS.forEach((n, i) => { c.save(); c.translate(256, 256); c.rotate(i / ASA_MARKS.length * 6.283); c.fillStyle = i % 2 ? '#F7F4EE' : '#E8B23C'; c.fillText(n, 0, -196); c.restore(); });
      c.fillStyle = '#2b2927'; c.beginPath(); c.arc(256, 256, 120, 0, 7); c.fill();
    });
    const am = new THREE.MeshBasicMaterial({ map: asaT, transparent: true, clippingPlanes: [CUT] });
    const ad = new THREE.Mesh(new THREE.CircleGeometry(1.02, 48).rotateX(-Math.PI / 2), am); ad.position.y = .305; MODEL.asa.add(ad);
    top.mats.push({ m: am, base: new THREE.Color(0xffffff), op: .999 });
    { // ribbing on the dial edge
      const n = 72, p = []; for (let i = 0; i < n; i++) { const a = i / n * 6.283, x = Math.cos(a) * 1.11, z = Math.sin(a) * 1.11; p.push(x, .02, z, x, .28, z); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
      const m = new THREE.LineBasicMaterial({ color: COL.ink, transparent: true, clippingPlanes: [CUT] }); MODEL.asa.add(new THREE.LineSegments(g, m)); top.lines.push(m);
    }
    // the index mark the dial is read against
    top.mesh(new THREE.BoxGeometry(.06, .02, .2).translate(-2.8, Y_TOP + .01, .5), COL.vermilion, { hull: false, edges: false });
    // rewind side: knob with the folded crank, and the meter switch
    top.mesh(new THREE.CylinderGeometry(1.14, 1.14, .1, 48).translate(4.6, Y_TOP + .05, -.75), COL.leather, { thr: 40 });
    MODEL.rewind = top.mesh(new THREE.CylinderGeometry(1, 1.02, .42, 48).translate(4.6, Y_TOP + .31, -.75), COL.chrome, { thr: 40 });
    top.mesh(new THREE.CylinderGeometry(.96, .96, .03, 48).translate(4.6, Y_TOP + .535, -.75), COL.chrome2, { thr: 40 });
    top.mesh(new THREE.BoxGeometry(1.86, .03, .08).rotateY(.8).translate(4.6, Y_TOP + .555, -.75), COL.ink, { hull: false, edges: false });
    top.mesh(new THREE.BoxGeometry(.5, .05, .34).rotateY(.8).translate(4.3, Y_TOP + .57, -.45), COL.chrome, { hullW: .6 });
    top.mesh(new THREE.CylinderGeometry(.42, .42, .1, 28).translate(2.7, Y_TOP + .05, -.62), COL.leather, { thr: 40 });
    MODEL.meterSw = top.mesh(new THREE.BoxGeometry(.22, .14, 1.1).translate(2.7, Y_TOP + .17, -.62), COL.leather);
    top.mesh(new THREE.BoxGeometry(.08, .02, .9).translate(2.7, Y_TOP + .25, -.62), 0xEDE9E1, { hull: false, edges: false });
  }

  // --- speed ring and bayonet mount: the OM-1's signature ---
  const mount = P('mount');
  mount.ring(2.4, 2.62, 2.02, 2.62, COL.chrome2);
  MODEL.speedRing = new THREE.Group(); mount.g.add(MODEL.speedRing);
  mount.ring(2.62, 3.3, 2.02, 2.6, COL.chrome, { parent: MODEL.speedRing, capc: COL.ink });
  ringDecal(mount, 3.31, 2.2, 2.46, ['B', '1', '2', '4', '8', '15', '30', '60', '125', '250', '500', '1000'], MODEL.speedRing, { color: '#161514', span: .5 });
  [-1, 1].forEach(s => { // the two knurled wings you turn it by
    mount.mesh(new THREE.BoxGeometry(.34, 1.1, .5).translate(s * 3.4, 0, 2.31), COL.chrome2, { parent: MODEL.speedRing });
  });

  // --- lens: from the body outwards, chrome base, focus ring, then aperture ring at the very front ---
  const lens = P('lens');
  lens.ring(2.25, 2.86, 2.62, 3.05, COL.chrome);
  lens.ring(2.25, 2.74, 3.05, 3.28, COL.leather);
  ringDecal(lens, 2.75, 3.08, 3.24, ['∞', '10', '5', '3', '2', '1.5', '1', '.7', '.45'], null, { span: .5 });
  MODEL.helicoid = new THREE.Group(); lens.g.add(MODEL.helicoid);
  lens.lathe([[2.3, 3.28], [2.88, 3.28], [2.9, 3.36], [2.9, 4.42], [2.72, 4.5], [2.72, 4.56], [2.3, 4.56]], COL.leather, { parent: MODEL.helicoid });
  knurl(lens, 2.91, 3.4, 4.38, MODEL.helicoid);
  lens.ring(2.02, 2.3, 2.72, 4.56, COL.leather, { parent: MODEL.helicoid });
  MODEL.apRing = new THREE.Group(); MODEL.helicoid.add(MODEL.apRing);
  lens.ring(2.2, 2.68, 4.56, 5.08, COL.leather, { parent: MODEL.apRing });
  knurl(lens, 2.69, 4.58, 4.76, MODEL.apRing, { straight: true, n: 220, lw: 2 });
  ringDecal(lens, 2.69, 4.8, 5.02, ['16', '11', '8', '5.6', '4', '2.8', '1.8'], MODEL.apRing, { span: .45 });
  // front rim with a recessed cone down to the glass
  lens.lathe([[2.2, 5.08], [2.55, 5.08], [2.55, 5.46], [2.42, 5.46], [1.92, 5.1], [1.9, 4.75], [2.2, 4.56]], COL.leather, { parent: MODEL.helicoid });
  faceText(lens, 2.42, 5.3, 'ZUIKO AUTO-S  1:1.8  f=50mm  M-SYSTEM', MODEL.helicoid);
  // six elements in five groups, a double-Gauss shape
  MODEL.glass = new THREE.Group(); MODEL.helicoid.add(MODEL.glass);
  const el = (zf, zb, r, cf, cb, grp, p2 = lens) => { // element from sag at front and rear
    const p = [], n = 14;
    for (let i = 0; i <= n; i++) { const u = i / n; p.push([r * u, zf + cf * (1 - u * u)]); }
    for (let i = n; i >= 0; i--) { const u = i / n; p.push([r * u, zb - cb * (1 - u * u)]); }
    return p2.lathe(p, COL.glass, { parent: grp || MODEL.glass, opacity: .34, capc: 0x8FB6BD, edges: false, side: THREE.DoubleSide });
  };
  el(5.05, 4.85, 1.72, .14, -.03);
  el(4.72, 4.3, 1.5, .18, -.1);
  el(4.28, 4.14, 1.28, -.04, -.16);
  el(3.42, 3.3, 1.28, -.16, -.03);
  el(3.28, 2.9, 1.42, -.1, .14);
  el(2.86, 2.72, 1.5, .06, .1);
  { // a soft crescent of reflected sky on the front element
    const s = new THREE.Shape(); s.absarc(0, 0, 1.5, .35, 2.5, false); s.absarc(.16, -.2, 1.5, 2.5, .35, true);
    const m = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: .55, depthWrite: false, clippingPlanes: [CUT] });
    const g = new THREE.Mesh(new THREE.ShapeGeometry(s, 24), m); g.position.z = 5.24; MODEL.helicoid.add(g);
    lens.mats.push({ m, base: new THREE.Color(0xFFFFFF), op: .55 });
  }
  // iris: rebuilt each frame from the f-number
  MODEL.iris = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: COL.ink, side: THREE.DoubleSide, clippingPlanes: [CUT] }));
  MODEL.iris.position.z = 3.72; MODEL.glass.add(MODEL.iris); lens.mats.push({ m: MODEL.iris.material, base: new THREE.Color(COL.ink), op: 1 });
  MODEL.irisCapA = lens.cap([[3.7, 0], [3.74, 0], [3.74, 1], [3.7, 1]], COL.ink, [], MODEL.glass);
  MODEL.irisCapB = lens.cap([[3.7, 0], [3.74, 0], [3.74, -1], [3.7, -1]], COL.ink, [], MODEL.glass);

  // --- the zoom: its own lens, with a barrel that really extends. Swapped on for one beat. ---
  const zl = P('zoomL');
  {
    zl.ring(2.25, 2.86, 2.62, 3.05, COL.chrome);
    zl.lathe([[2.3, 3.05], [2.95, 3.05], [2.95, 4.5], [2.78, 4.56], [2.78, 5.4], [2.62, 5.46], [2.3, 5.46]], COL.leather);
    knurl(zl, 2.96, 3.12, 4.44, null);
    knurl(zl, 2.79, 4.62, 5.34, null, { straight: true, n: 220, lw: 2 });
    MODEL.zTube = new THREE.Group(); zl.g.add(MODEL.zTube); // slides out of the barrel
    zl.lathe([[2.05, 4.7], [2.3, 4.7], [2.3, 6.5], [2.52, 6.56], [2.52, 6.98], [2.38, 6.98], [1.98, 6.62], [1.96, 6.2], [2.05, 6.0]], COL.leather, { parent: MODEL.zTube });
    faceText(zl, 2.38, 6.8, 'S ZUIKO AUTO-ZOOM  35-70mm', MODEL.zTube);
    el(6.6, 6.35, 1.86, .16, -.04, MODEL.zTube, zl);
    el(6.1, 5.82, 1.62, -.03, -.12, MODEL.zTube, zl);
    MODEL.zRear = new THREE.Group(); zl.g.add(MODEL.zRear); // moves a little, always clear of the mirror
    el(4.25, 3.95, 1.3, .1, -.06, MODEL.zRear, zl);
    el(3.8, 3.6, 1.2, -.04, -.1, MODEL.zRear, zl);
    el(3.42, 3.18, 1.28, .1, .06, MODEL.zRear, zl);
    zl.g.visible = false;
  }

  // --- mirror box ---
  const box = P('box');
  {
    const wall = (w, h, d, x, y, z) => box.mesh(new THREE.BoxGeometry(w, h, d).translate(x, y, z), 0xCFCAC0, { side: THREE.DoubleSide });
    wall(.08, 3.9, 3.76, -2.05, -.1, .06);
    wall(.08, 3.9, 3.76, 2.05, -.1, .06);
    wall(4.18, .08, 3.76, 0, -2.08, .06);
    box.cap([[-1.82, -2.12], [1.94, -2.12], [1.94, -2.04], [-1.82, -2.04]]);
    // mirror on its pivot
    MODEL.mirror = new THREE.Group(); MODEL.mirror.position.set(0, 1.06, -.96); box.g.add(MODEL.mirror);
    const mg = new THREE.BoxGeometry(3.5, .05, 3.0).translate(0, 0, 1.5);
    box.mesh(mg, 0xEAF0EF, { parent: MODEL.mirror, clip: true });
    box.mesh(new THREE.BoxGeometry(3.7, .1, 3.1).translate(0, .08, 1.5), COL.metal, { parent: MODEL.mirror });
    box.cap([[0, .02], [3, .02], [3, .13], [0, .13]], COL.ink, [], MODEL.mirror);
    box.cap([[0, -.05], [3, -.05], [3, .02], [0, .02]], 0x7FA7AE, [], MODEL.mirror);
    // the air damper: a little cylinder and piston on the mirror box wall
    MODEL.dampBody = box.mesh(new THREE.CylinderGeometry(.2, .2, .95, 24).rotateX(.35).translate(-1.86, -1.3, -1.25), COL.chrome2, { thr: 40 });
    MODEL.dampRod = box.mesh(new THREE.CylinderGeometry(.06, .06, 1.2, 12).rotateX(.35).translate(-1.86, -.75, -1.06), COL.chrome, { thr: 40 });
    // focusing screen
    box.mesh(new THREE.BoxGeometry(3.7, .05, 2.5).translate(0, SCREEN_Y, MIRROR_Z), 0xEDF2EE);
    box.cap([[-1.15, 2.075], [1.35, 2.075], [1.35, 2.125], [-1.15, 2.125]], 0xE5401A);
  }

  // --- pentaprism and meter cells ---
  const prism = P('prism');
  {
    const sec = [[-1.5, 2.15], [1.3, 2.15], [1.44, 3.9], [.5, 4.98], [-1.5, 4.04]];
    prism.mesh(extrudeX(sec, 1.5, .2, 2.15), COL.glass, { opacity: .5, side: THREE.DoubleSide, edges: true, thr: 30 });
    prism.cap(sec, 0xC6DBDD);
    const eye = new THREE.CylinderGeometry(.46, .46, .3, 32).rotateX(Math.PI / 2).translate(0, 3.2, -2.1);
    prism.mesh(eye, COL.glass, { opacity: .6, side: THREE.DoubleSide, thr: 50 });
    prism.cap([[-2.24, 2.74], [-1.94, 2.74], [-1.94, 3.66], [-2.24, 3.66]], 0x8FB6BD);
    MODEL.cds = [-.92, .92].map(x => prism.mesh(new THREE.BoxGeometry(.34, .34, .3).translate(x, 3.86, -1.74), COL.vermilion));
  }

  // --- shutter: gate, film rails, two curtains, drums ---
  const shutter = P('shutter');
  {
    const s = polyShape([[-3.5, -2.3], [3.5, -2.3], [3.5, 2.0], [-3.5, 2.0]]);
    s.holes.push(new THREE.Path([[-1.8, -1.2], [-1.8, 1.2], [1.8, 1.2], [1.8, -1.2]].map(p => new THREE.Vector2(p[0], p[1]))));
    shutter.mesh(extrudeZ(s, -1.93, -1.86), COL.metal);
    shutter.cap([[-1.93, 1.2], [-1.86, 1.2], [-1.86, 2], [-1.93, 2]]);
    shutter.cap([[-1.93, -2.3], [-1.86, -2.3], [-1.86, -1.2], [-1.93, -1.2]]);
    [1.3, -1.3, 1.72, -1.72].forEach(y => shutter.mesh(new THREE.BoxGeometry(6.5, .07, .03).translate(0, y, -1.95), COL.chrome, { hull: false, edges: false }));
    const curtain = (color) => {
      const g = new THREE.PlaneGeometry(1, 2.9).translate(.5, 0, 0);
      const m = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, clippingPlanes: [CUT] });
      const mesh = new THREE.Mesh(g, m); shutter.g.add(mesh); shutter.mats.push({ m, base: new THREE.Color(color), op: 1 }); return mesh;
    };
    MODEL.c1 = curtain(0x1B1A19); MODEL.c1.position.z = -1.8;
    MODEL.c2 = curtain(0x35322E); MODEL.c2.position.z = -1.76;
    const edge = (color) => {
      const m = new THREE.MeshBasicMaterial({ color, clippingPlanes: [CUT] });
      const e = new THREE.Mesh(new THREE.BoxGeometry(.05, 2.92, .04), m); shutter.g.add(e); shutter.mats.push({ m, base: new THREE.Color(color), op: 1 }); return e;
    };
    MODEL.e1 = edge(COL.chrome); MODEL.e2 = edge(COL.chrome);
    MODEL.e1.position.z = -1.8; MODEL.e2.position.z = -1.76;
    MODEL.drums = [-2.95, 2.95].map(x => {
      const d = new THREE.Group(); d.position.set(x, 0, -1.45); shutter.g.add(d);
      shutter.mesh(new THREE.CylinderGeometry(.36, .36, 3.1, 28), COL.chrome2, { thr: 40, parent: d });
      shutter.mesh(new THREE.BoxGeometry(.05, 3.12, .73), COL.ink, { parent: d, hull: false, edges: false });
      return d;
    });
  }

  // --- film path: cassette on the rewind side, sprocket and take-up spool on the other ---
  const film = P('film');
  {
    MODEL.filmTex = decalTex(2048, 512, () => {});
    const fm = new THREE.MeshBasicMaterial({ map: MODEL.filmTex, side: THREE.DoubleSide, transparent: true, clippingPlanes: [CUT] });
    MODEL.filmMat = fm;
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(10.3, 3.5), fm); strip.position.set(-.55, 0, FILM_Z); film.g.add(strip); MODEL.strip = strip;
    const cg = new THREE.Group(); cg.position.set(4.6, -.1, -.75); film.g.add(cg); cassette(film, cg, true);
    MODEL.spool = new THREE.Group(); MODEL.spool.position.set(-5.7, 0, -.9); film.g.add(MODEL.spool);
    film.mesh(new THREE.CylinderGeometry(.95, .95, 3.9, 36), COL.leather, { parent: MODEL.spool, thr: 40 });
    [0, 1, 2].forEach(i => film.mesh(new THREE.BoxGeometry(.1, 3.5, .34).rotateY(i * 2.09).translate(Math.cos(i * 2.09) * .86, 0, -Math.sin(i * 2.09) * .86), COL.metal, { parent: MODEL.spool, hull: false }));
    MODEL.sprocket = new THREE.Group(); MODEL.sprocket.position.set(-4.07, 0, -1.65); film.g.add(MODEL.sprocket);
    [-1.72, 1.72].forEach(y => film.mesh(extrudeY(gearShape(8, .52, .12, .12), y - .14, y + .14), COL.chrome, { parent: MODEL.sprocket, thr: 50 }));
    film.mesh(new THREE.CylinderGeometry(.36, .36, 3.4, 20), COL.metal, { parent: MODEL.sprocket, thr: 40 });
  }

  // --- back door, hinged on the take-up side as on the real camera ---
  const back = P('back');
  MODEL.door = new THREE.Group(); MODEL.door.position.set(-7.22, 0, -2.2); back.g.add(MODEL.door);
  {
    const outer = [[6.12, -2.1], [5.85, -2.45], [-6.85, -2.45], [-7.12, -2.1]];
    const inner = [[-6.95, -2.05], [-6.75, -2.31], [5.75, -2.31], [5.95, -2.05]];
    const sh = polyShape(outer.concat(inner).map(([x, z]) => [x, -z]));
    const g = extrudeY(sh, Y_LEA, Y_DECK); g.translate(7.22, 0, 2.2);
    back.mesh(g, leather, { edges: false, side: THREE.DoubleSide, parent: MODEL.door, map: LM });
    back.mesh(new THREE.BoxGeometry(6.6, 3, .06).translate(6.7, -.1, .02), COL.chrome, { parent: MODEL.door });
    MODEL.doorCap = back.cap([[-2.45, Y_LEA], [-2.31, Y_LEA], [-2.31, Y_DECK], [-2.45, Y_DECK]], COL.ink, []);
  }

  // --- the PX625 cell, drops out of the base plate ---
  const cell = P('cell');
  {
    MODEL.cell = new THREE.Group(); MODEL.cell.position.set(-5.6, Y_BOT + .35, -.8); cell.g.add(MODEL.cell);
    const prof = [[0, .3], [.56, .3], [.6, .24], [.6, .02], [.78, .02], [.78, -.26], [.74, -.3], [0, -.3]].map(p => new THREE.Vector2(p[0], p[1]));
    cell.mesh(new THREE.LatheGeometry(prof, 56), COL.chrome, { parent: MODEL.cell, thr: 40, side: THREE.DoubleSide, clip: false });
    const t = decalTex(512, 512, c => {
      c.fillStyle = '#C8C5BE'; c.beginPath(); c.arc(256, 256, 250, 0, 7); c.fill();
      c.fillStyle = '#161514'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = '700 120px "DM Sans",sans-serif'; c.fillText('+', 256, 120);
      c.font = '500 74px "DM Mono",monospace'; c.fillText('PX625', 256, 262);
      c.font = '500 56px "DM Mono",monospace'; c.fillText('1.35 V', 256, 362);
    });
    const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide });
    const d = new THREE.Mesh(new THREE.CircleGeometry(.73, 44).rotateX(Math.PI / 2), m); d.position.y = -.302; MODEL.cell.add(d);
    cell.mats.push({ m, base: new THREE.Color(0xffffff), op: .999 });
    cell.g.visible = false;
  }

  // --- meter: galvanometer, wires, and the cord that the rings pull ---
  const meter = P('meter');
  {
    const xray = (mesh, order = 15) => { mesh.material.depthTest = false; mesh.material.transparent = true; mesh.renderOrder = order; return mesh; };
    const tube = (pts, r = .035, c = COL.vermilion) => {
      const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'catmullrom', .2);
      return xray(meter.mesh(new THREE.TubeGeometry(curve, 60, r, 6), c, { clip: false, edges: false, hull: false }));
    };
    MODEL.battery = xray(meter.mesh(new THREE.CylinderGeometry(.78, .78, .6, 32).translate(-5.6, -2.85, -.8), COL.chrome, { clip: false, thr: 40, hull: false }));
    MODEL.galvoG = new THREE.Group(); MODEL.galvoG.position.set(-2.75, 2.72, .3); meter.g.add(MODEL.galvoG);
    MODEL.galvo = xray(meter.mesh(new THREE.CylinderGeometry(.5, .5, .4, 24).rotateZ(Math.PI / 2), COL.metal, { clip: false, thr: 40, hull: false, parent: MODEL.galvoG }), 16);
    MODEL.galvoArm = xray(meter.mesh(new THREE.BoxGeometry(.04, .07, 1).translate(0, 0, -.62), COL.chrome, { clip: false, edges: false, hull: false, parent: MODEL.galvoG }), 16);
    MODEL.wires = [
      tube([[-.92, 3.7, -1.72], [-1.5, 2.9, -1.5], [-2.4, 2.75, -.1]]),
      tube([[0, 3.3, -1.9], [-3.4, 2.1, -1.6], [-5.2, -.5, -1.0], [-5.6, -2.5, -.8]]),
      tube([[-2.9, 2.3, .3], [-3.8, 0, -.2], [-5.1, -2.4, -.5]]),
    ];
    // cord: from the sensing ring in the mount, over two pulleys, to the meter body
    const pts = [[-.8, 2.74, 2.2], [-1.75, 2.9, 1.6], [-1.9, 3.1, .9], [-2.5, 3.2, .6]];
    const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'catmullrom', .3);
    MODEL.cordTex = decalTex(256, 16, (c, w, h) => { c.fillStyle = '#F7F4EE'; c.fillRect(0, 0, w, h); c.fillStyle = '#E5401A'; c.fillRect(0, 0, w / 2, h); });
    MODEL.cordTex.wrapS = THREE.RepeatWrapping; MODEL.cordTex.repeat.x = 9;
    const cm = new THREE.MeshBasicMaterial({ map: MODEL.cordTex, transparent: true, depthTest: false });
    MODEL.cord = new THREE.Mesh(new THREE.TubeGeometry(curve, 60, .055, 6), cm); MODEL.cord.renderOrder = 16; meter.g.add(MODEL.cord);
    meter.mats.push({ m: cm, base: new THREE.Color(0xffffff), op: .999 });
    MODEL.pulleys = [[-1.75, 2.9, 1.6], [-1.9, 3.1, .9]].map(p => {
      const g = new THREE.Group(); g.position.set(...p); meter.g.add(g);
      xray(meter.mesh(new THREE.CylinderGeometry(.2, .2, .08, 20).rotateZ(Math.PI / 2), COL.chrome, { clip: false, parent: g, hull: false, thr: 40 }), 17);
      xray(meter.mesh(new THREE.BoxGeometry(.1, .32, .05), COL.ink, { clip: false, parent: g, hull: false, edges: false }), 18);
      return g;
    });
  }

  // --- clockwork, normally hidden under the mirror box ---
  const gears = P('gears');
  {
    const add = (teeth, r, x, z, c) => {
      const grp = new THREE.Group(); grp.position.set(x, -2.3, z); gears.g.add(grp);
      const sh = gearShape(teeth, r, r * .16, .09);
      const g = extrudeY(sh, 0, .08);
      gears.mesh(g, c, { parent: grp, thr: 50, hullW: .8 });
      return grp;
    };
    const BRASS = 0xC2A25A;
    MODEL.gearset = [
      { g: add(34, 1.25, -1.45, .35, COL.chrome), s: 1 },
      { g: add(10, .46, .22, -.2, COL.chrome2), s: -2.6 },
      { g: add(20, .88, 1.54, -.2, BRASS), s: -2.6 * -1 * .9 },
    ];
    { // brass cam on the big gear, and the timing plate that carries the train
      const cam = extrudeY(gearShape(3, .62, .2, .1), .08, .22); gears.mesh(cam, BRASS, { parent: MODEL.gearset[0].g, thr: 40, hullW: .8 });
      const pl = polyShape([[-.2, -1.5], [2.7, -1.5], [2.9, -.5], [2.3, .4], [1.1, .7], [.2, .2], [-.2, -.6]]);
      pl.holes.push(new THREE.Path([[1.2, -1.2], [1.9, -1.2], [1.9, -.7], [1.2, -.7]].map(p => new THREE.Vector2(p[0], p[1]))));
      gears.mesh(extrudeY(pl, -2.14, -2.1), BRASS, { thr: 40, hullW: .7, opacity: .5, edges: true });
    }
    const esc = add(15, .62, 2.0, 1.2, COL.vermilion);
    MODEL.gearset.push({ g: esc, s: -7 });
    // pallet anchor, rocks with the escape wheel
    const a = new THREE.Shape(); a.moveTo(-.9, -.1); a.lineTo(.9, -.1); a.lineTo(.95, -.42); a.lineTo(.72, -.42); a.lineTo(.68, .12); a.lineTo(.12, .3); a.lineTo(-.12, .3); a.lineTo(-.68, .12); a.lineTo(-.72, -.42); a.lineTo(-.95, -.42); a.closePath();
    MODEL.anchor = new THREE.Group(); MODEL.anchor.position.set(2.0, -2.2, 2.3); gears.g.add(MODEL.anchor);
    gears.mesh(extrudeY(a, 0, .08), COL.ink, { parent: MODEL.anchor, thr: 50 });
  }

  // --- the wind train: lever shaft down to sprocket and shutter. Only seen in the one-stroke beat ---
  const wind = P('wind');
  {
    wind.mesh(new THREE.CylinderGeometry(.1, .1, 1.35, 16).translate(-5.8, 2.72, -1.0), COL.chrome, { thr: 40, hullW: .7 });
    MODEL.windGears = [[-5.8, -1.0, 1.0, 22, 1], [-4.07, -1.65, .6, 13, -1.7], [-2.95, -1.45, .46, 10, 2.2]].map(([x, z, r, n, s]) => {
      const g = new THREE.Group(); g.position.set(x, 2.08, z); wind.g.add(g);
      wind.mesh(extrudeY(gearShape(n, r, r * .18, .08), 0, .08), s === 1 ? COL.vermilion : COL.chrome, { parent: g, thr: 50, hullW: .8 });
      return { g, s };
    });
    wind.g.visible = false;
  }

  // --- flash ---
  const flash = P('flash');
  {
    flash.mesh(new THREE.BoxGeometry(2, .12, 1.5).translate(0, 5.3, -.4), COL.leather);
    flash.mesh(new THREE.BoxGeometry(1.2, .22, 1.3).translate(0, 5.46, -.4), COL.metal);
    flash.mesh(new THREE.BoxGeometry(2.7, 2.5, 1.55).translate(0, 6.8, -.4), COL.leather);
    flash.mesh(new THREE.BoxGeometry(2.7, 1.1, 1.75).translate(0, 8.6, -.28), COL.chrome);
    const w = new THREE.PlaneGeometry(2.3, .86);
    const wm = new THREE.MeshBasicMaterial({ color: 0xF7F4EE, clippingPlanes: [CUT] });
    MODEL.flashWin = new THREE.Mesh(w, wm); MODEL.flashWin.position.set(0, 8.6, .61); flash.g.add(MODEL.flashWin);
    flash.mats.push({ m: wm, base: new THREE.Color(0xF7F4EE), op: 1 });
  }

  // X-sync contact: two tiny leaves near the end of curtain travel
  const contact = P('contact');
  MODEL.leafA = contact.mesh(new THREE.BoxGeometry(.06, .7, .06).translate(-2.45, 1.75, -1.7), COL.vermilion, { hullW: .6, clip: false });
  MODEL.leafB = contact.mesh(new THREE.BoxGeometry(.06, .7, .06).translate(-2.25, 1.75, -1.7), COL.vermilion, { hullW: .6, clip: false });

  // the roll of film, on its own for the close-up
  const roll = P('roll');
  {
    MODEL.roll = new THREE.Group(); MODEL.roll.position.set(...ROLL_POS); roll.g.add(MODEL.roll);
    cassette(roll, MODEL.roll, false);
    // leader: tongue of film with perforations, curling out of the light trap
    const t = decalTex(1024, 256, (c, w, h) => {
      c.fillStyle = '#6B5A48'; c.fillRect(0, 0, w, h); c.fillStyle = '#EDE9E1';
      for (let i = 0; i < 26; i++) { roundRect(c, i * 40 + 8, 12, 20, 20, 4); c.fill(); roundRect(c, i * 40 + 8, h - 32, 20, 20, 4); c.fill(); }
    });
    const lg = new THREE.PlaneGeometry(7, 3.4, 40, 1); const p = lg.attributes.position;
    for (let i = 0; i < p.count; i++) { const u = (p.getX(i) + 3.5) / 7; p.setX(i, .9 + u * 6.4); p.setZ(i, -1.25 + Math.sin(u * 2.4) * .9 - u * u * .4); }
    lg.computeVertexNormals();
    const m = new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, transparent: true });
    MODEL.roll.add(new THREE.Mesh(lg, m)); roll.mats.push({ m, base: new THREE.Color(0xffffff), op: .999 });
    roll.g.visible = false;
  }

  // ghost of a bigger, heavier SLR for the "brick" chapter
  const gb = new THREE.Group(); ROOT.add(gb); MODEL.ghost = gb;
  {
    const lm = new THREE.LineBasicMaterial({ color: COL.vermilion, transparent: true, opacity: 0 });
    const add = g => gb.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 28), lm));
    add(new THREE.BoxGeometry(16, 7.1, 4).translate(-.5, .1, -.4));
    add(new THREE.BoxGeometry(5, 2.6, 4.4).translate(0, 4.8, -.3));
    add(new THREE.CylinderGeometry(3.2, 3.2, 4.2, 48).rotateX(Math.PI / 2).translate(0, 0, 3.9));
    MODEL.ghostMat = lm;
  }
}

// iris outline: six straight-ish blades closing a hole of radius r (units)
function setIris(r) {
  const R = 1.95, s = new THREE.Shape();
  s.absarc(0, 0, R, 0, Math.PI * 2, false);
  const h = new THREE.Path(), spin = (1 - r / 1.4) * .9;
  for (let i = 0; i < 6; i++) {
    for (let k = 0; k < 5; k++) { // blades are gently curved, so the hole stays roundish
      const a = (i + k / 5) / 6 * Math.PI * 2 + spin;
      const p = new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r);
      i || k ? h.lineTo(p.x, p.y) : h.moveTo(p.x, p.y);
    }
  }
  h.closePath(); s.holes.push(h);
  MODEL.iris.geometry.dispose();
  MODEL.iris.geometry = new THREE.ShapeGeometry(s, 40);
  // section: two blade tips reaching in toward the axis
  MODEL.irisCapA.scale.set(1, (1.95 - r), 1); MODEL.irisCapA.position.y = r;
  MODEL.irisCapB.scale.set(1, (1.95 - r), 1); MODEL.irisCapB.position.y = -r;
}

// ---------- rays: a dynamic flat ribbon with a flowing pulse ----------
class Ribbon {
  constructor(maxPts = 12, width = .05, color = COL.vermilion) {
    this.n = maxPts; this.w = width;
    this.pos = new Float32Array(maxPts * 2 * 3); this.arc = new Float32Array(maxPts * 2);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('aS', new THREE.BufferAttribute(this.arc, 1));
    const idx = [];
    for (let i = 0; i < maxPts - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    g.setIndex(idx);
    this.mat = new THREE.ShaderMaterial({
      transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uC: { value: new THREE.Color(color) }, uP: { value: 1e4 }, uT: { value: 0 }, uA: { value: 1 }, uFlow: { value: 1 } },
      vertexShader: `attribute float aS; varying float vS; void main(){ vS=aS; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `uniform vec3 uC; uniform float uP,uT,uA,uFlow; varying float vS;
        void main(){ if(vS>uP) discard;
          float pulse = .9+.1*sin(vS*1.3-uT*1.4)*uFlow;
          gl_FragColor=vec4(uC,uA*pulse); }`,
    });
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = 20;
    RAYS.add(this.mesh);
  }
  // pts: [[z,y],...] drawn in the x=0.02 plane
  set(pts) {
    let s = 0; const n = this.n, w = this.w / 2;
    for (let i = 0; i < n; i++) {
      const p = pts[Math.min(i, pts.length - 1)], q = pts[Math.min(i + 1, pts.length - 1)], o = pts[Math.max(Math.min(i, pts.length - 1) - 1, 0)];
      let dz = q[0] - o[0], dy = q[1] - o[1]; const L = Math.hypot(dz, dy) || 1; dz /= L; dy /= L;
      if (i && i < pts.length) s += Math.hypot(p[0] - o[0], p[1] - o[1]);
      const k = i * 6;
      this.pos[k] = .02; this.pos[k + 1] = p[1] + dz * w; this.pos[k + 2] = p[0] - dy * w;
      this.pos[k + 3] = .02; this.pos[k + 4] = p[1] - dz * w; this.pos[k + 5] = p[0] + dy * w;
      this.arc[i * 2] = this.arc[i * 2 + 1] = s;
    }
    this.len = s;
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.attributes.aS.needsUpdate = true;
  }
  clip(arc) { this.mat.uniforms.uP.value = arc; }
  style(alpha, prog = 1, time = 0, color) {
    this.mat.uniforms.uA.value = alpha; this.mat.uniforms.uP.value = prog * (this.len || 0) + .001;
    this.mat.uniforms.uT.value = time; this.mesh.visible = alpha > .003;
    if (color !== undefined) this.mat.uniforms.uC.value.set(color);
  }
}
const RAYS = new THREE.Group();
