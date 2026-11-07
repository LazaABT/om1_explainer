// ---------- the scene: painted once as depth layers, each with its own blur stack ----------
const SW = 1800, SH = 1200, PAD = 110; // SW x SH is the frame at 35 mm. Longer lenses crop in.
const SCENE_F = 35, DOG_M = 3;
// where the finder's centre sits for each subject, as an offset from the middle of the scene
const EAR = [893, 582], FLOWER = [1236, 880], HOUSE = [1262, 676];
const PANS = {
  dog: [EAR[0] - 900, EAR[1] - 600], flower: [FLOWER[0] - 900, FLOWER[1] - 600], house: [HOUSE[0] - 900, HOUSE[1] - 600],
};

function newCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

function paintLayers() {
  const L = [];
  const layer = (dist, draw, card) => {
    const c = newCanvas(SW + PAD * 2, SH + PAD * 2), x = c.getContext('2d');
    x.translate(PAD, PAD); draw(x); L.push({ dist, card, src: c });
  };
  const blob = (x, pts, fill) => { // smooth closed curve
    x.fillStyle = fill; x.beginPath();
    const n = pts.length;
    x.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2);
    for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; x.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    x.closePath(); x.fill();
  };
  const hill = (x, y0, pts, fill) => {
    x.fillStyle = fill; x.beginPath(); x.moveTo(-PAD - 10, SH + PAD + 10); x.lineTo(-PAD - 10, y0);
    pts.forEach(p => x.quadraticCurveTo(p[0], p[1], p[2], p[3]));
    x.lineTo(SW + PAD + 10, SH + PAD + 10); x.closePath(); x.fill();
  };
  // 0: sky and sun
  layer(1e5, x => {
    const g = x.createLinearGradient(0, 0, 0, SH * .72);
    g.addColorStop(0, '#E7DFCF'); g.addColorStop(.62, '#F0DDBB'); g.addColorStop(1, '#F3C99A');
    x.fillStyle = g; x.fillRect(-PAD, -PAD, SW + PAD * 2, SH + PAD * 2);
    x.fillStyle = '#E5401A'; x.beginPath(); x.arc(1090, 330, 104, 0, 7); x.fill();
  }, 118);
  // 1: far ridge
  layer(900, x => {
    hill(x, 610, [[260, 500, 520, 590], [760, 660, 1010, 570], [1300, 470, 1560, 575], [1720, 630, SW + 120, 560]], '#CDB08F');
  }, 96);
  // 2: middle hill, one tree, one small house
  layer(60, x => {
    hill(x, 760, [[420, 620, 860, 700], [1250, 770, SW + 120, 640]], '#8C8A72');
    const tx = 540, ty = 680;
    x.fillStyle = '#3C4238'; x.fillRect(tx - 8, ty - 70, 16, 84);
    blob(x, [[tx - 96, ty - 80], [tx - 66, ty - 214], [tx + 62, ty - 226], [tx + 100, ty - 84], [tx, ty - 40]], '#3C4238');
    const hx = HOUSE[0], hy = HOUSE[1];
    x.fillStyle = '#EDE9E1'; x.fillRect(hx - 50, hy - 18, 100, 62);
    x.fillStyle = '#161514'; x.beginPath(); x.moveTo(hx - 64, hy - 16); x.lineTo(hx, hy - 66); x.lineTo(hx + 64, hy - 16); x.closePath(); x.fill();
    x.fillRect(hx - 12, hy + 6, 24, 38);
  }, 74);
  // 3: the near slope and the dog, a quiet sitting silhouette
  layer(DOG_M, x => {
    hill(x, 880, [[500, 800, 980, 846], [1420, 890, SW + 120, 820]], '#4A5444');
    const coat = '#B57A3C', shade = '#8F5B2B', ear = '#3B2A1C';
    // far legs, in shade
    x.fillStyle = shade; x.beginPath(); x.moveTo(900, 760); x.lineTo(902, 898); x.lineTo(948, 898); x.lineTo(946, 760); x.closePath(); x.fill();
    // body in one line: throat, chest, foreleg, belly, haunch, back, neck
    x.fillStyle = coat; x.beginPath();
    x.moveTo(858, 610);
    x.bezierCurveTo(838, 690, 852, 760, 866, 816);
    x.lineTo(864, 884); x.quadraticCurveTo(832, 888, 826, 908); x.lineTo(906, 908);
    x.quadraticCurveTo(910, 850, 926, 804);
    x.bezierCurveTo(936, 858, 976, 900, 1030, 906);
    x.lineTo(1160, 908);
    x.bezierCurveTo(1216, 900, 1216, 812, 1176, 748);
    x.bezierCurveTo(1130, 672, 1040, 628, 985, 596);
    x.bezierCurveTo(968, 584, 960, 560, 958, 530);
    x.lineTo(900, 500); x.closePath(); x.fill();
    // skull and upper muzzle; the lower jaw is its own piece, so it can open
    x.beginPath();
    x.moveTo(960, 560);
    x.bezierCurveTo(960, 508, 924, 474, 880, 472);
    x.bezierCurveTo(850, 472, 832, 498, 800, 508);
    x.quadraticCurveTo(762, 518, 748, 534);
    x.quadraticCurveTo(742, 552, 762, 556);
    x.lineTo(842, 566); x.lineTo(868, 610); x.lineTo(960, 620); x.closePath(); x.fill();
    // inside of the mouth, seen when the jaw drops
    x.fillStyle = '#4A1E16'; x.beginPath(); x.moveTo(775, 556); x.lineTo(846, 566); x.lineTo(858, 598); x.lineTo(800, 584); x.closePath(); x.fill();
    x.fillStyle = '#161514'; x.beginPath(); x.ellipse(754, 538, 13, 11, -.3, 0, 7); x.fill();
    x.beginPath(); x.arc(842, 518, 7.5, 0, 7); x.fill();
    // ear: a long, straight front edge. The split circle reads focus from this line.
    x.fillStyle = ear; x.beginPath();
    x.moveTo(EAR[0], 498); x.lineTo(EAR[0], 656);
    x.quadraticCurveTo(EAR[0] + 6, 680, 930, 678);
    x.bezierCurveTo(972, 668, 982, 590, 968, 540);
    x.bezierCurveTo(958, 505, 925, 488, EAR[0], 498); x.closePath(); x.fill();
    // collar
    x.strokeStyle = '#E5401A'; x.lineWidth = 15; x.lineCap = 'round'; x.beginPath(); x.moveTo(866, 646); x.quadraticCurveTo(920, 692, 978, 650); x.stroke();
  }, 26);
  // 4: foreground grass and flowers, right up close
  layer(1.05, x => {
    x.lineCap = 'round';
    const clump = (cx, n, spread, h, col) => {
      x.strokeStyle = col; x.lineWidth = 13;
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1) - .5, bx = cx + u * spread;
        x.beginPath(); x.moveTo(bx, SH + PAD); x.quadraticCurveTo(bx + u * 40, SH - h * .6, bx + u * 180, SH - h * (1 - u * u * 1.2)); x.stroke();
      }
    };
    clump(170, 13, 380, 430, '#232A22'); clump(1640, 13, 420, 380, '#232A22'); clump(1240, 8, 240, 300, '#232A22');
    const flower = (fx, fy, r, c) => {
      x.fillStyle = c;
      for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; x.beginPath(); x.ellipse(fx + Math.cos(a) * r * .8, fy + Math.sin(a) * r * .8, r * .62, r * .62, 0, 0, 7); x.fill(); }
      x.fillStyle = '#F3C99A'; x.beginPath(); x.arc(fx, fy, r * .5, 0, 7); x.fill();
    };
    flower(250, 800, 50, '#EDE9E1'); flower(95, 900, 40, '#E5401A'); flower(FLOWER[0], FLOWER[1], 56, '#EDE9E1'); flower(1640, 760, 40, '#E5401A');
  }, 13);
  return L;
}

// A blur pyramid per layer. Sigma values are in source pixels.
const SIG = [0, 3, 6, 12, 24, 48, 90, 170], SCL = [1, .6, .42, .25, .14, .08, .05, .03];
const canFilter = (() => { const x = newCanvas(2, 2).getContext('2d'); return typeof x.filter === 'string'; })();
function blurStack(src) {
  return SIG.map((s, i) => {
    if (!i) return src;
    const k = SCL[i], c = newCanvas(Math.ceil(src.width * k), Math.ceil(src.height * k)), x = c.getContext('2d');
    if (canFilter) { x.filter = `blur(${s * k}px)`; x.drawImage(src, 0, 0, c.width, c.height); }
    else { // browsers without canvas filters: shrink hard, then soften by re-sampling
      const t = newCanvas(Math.max(2, c.width >> 2), Math.max(2, c.height >> 2));
      t.getContext('2d').drawImage(src, 0, 0, t.width, t.height);
      x.imageSmoothingQuality = 'high'; x.drawImage(t, 0, 0, c.width, c.height);
    }
    return c;
  });
}

const WORLD = { layers: [], tail: null, jaw: null, photo: null, bw: null, neg: null, ready: false };

// split in steps so the loading spinner keeps turning
async function buildWorld(tick) {
  WORLD.layers = paintLayers();
  await tick(.2);
  for (let i = 0; i < WORLD.layers.length; i++) { WORLD.layers[i].stack = blurStack(WORLD.layers[i].src); await tick(.2 + i * .08); }
  // tail and jaw are their own little layers, so they can move
  const t = newCanvas(300, 300), x = t.getContext('2d');
  x.strokeStyle = '#B57A3C'; x.lineWidth = 24; x.lineCap = 'round';
  x.beginPath(); x.moveTo(150, 150); x.quadraticCurveTo(232, 136, 262, 52); x.stroke();
  WORLD.tail = { src: t, stack: blurStack(t), x: 1185, y: 868 };
  const j = newCanvas(300, 300), y = j.getContext('2d'); // hinge at the canvas centre, snout to the left
  y.translate(150, 150);
  y.fillStyle = '#B57A3C'; y.beginPath(); y.moveTo(14, -10); y.lineTo(-66, -6); y.quadraticCurveTo(-90, -2, -88, 8); y.quadraticCurveTo(-60, 30, 26, 36); y.closePath(); y.fill();
  WORLD.jaw = { src: j, stack: blurStack(j), x: EAR[0] - 45, y: 572 };
  const tg = newCanvas(300, 300), y2 = tg.getContext('2d'); y2.translate(150, 150);
  y2.fillStyle = '#C8524A'; y2.beginPath(); y2.moveTo(4, -9); y2.lineTo(-62, -7); y2.quadraticCurveTo(-82, -2, -72, 4); y2.quadraticCurveTo(-30, 7, 8, 3); y2.closePath(); y2.fill();
  WORLD.tongue = { src: tg, stack: blurStack(tg), x: EAR[0] - 45, y: 572 };
  await tick(.68);
  // the frame we will actually take: 50 mm, f/5.6, focused on the dog, mouth open
  const P = newCanvas(1500, 1000);
  renderScene(P.getContext('2d'), 0, 0, 1500, 1000, { f: 50, N: 5.6, focus: DOG_M, wag: .2, jaw: 1 });
  WORLD.photo = P;
  const B = newCanvas(1500, 1000), N = newCanvas(1500, 1000);
  const bx = B.getContext('2d'), nx = N.getContext('2d');
  const d = P.getContext('2d').getImageData(0, 0, 1500, 1000), o = nx.createImageData(1500, 1000);
  const lum = new Float32Array(1500 * 1000);
  for (let i = 0, j2 = 0; i < d.data.length; i += 4, j2++) {
    let v = (.3 * d.data[i] + .59 * d.data[i + 1] + .11 * d.data[i + 2]) / 255;
    v = clamp((v - .5) * 1.22 + .52); lum[j2] = v;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v * 255;
    o.data[i] = o.data[i + 1] = o.data[i + 2] = 255 - v * 235; o.data[i + 3] = 255;
  }
  bx.putImageData(d, 0, 0); nx.putImageData(o, 0, 0);
  WORLD.bw = B; WORLD.neg = N; WORLD.lum = lum;
  WORLD.ready = true;
  await tick(.76);
}

function drawLevel(ctx, stack, sigma, sx, sy, sw, sh, dx, dy, dw, dh) {
  let i = 0; while (i < SIG.length - 2 && SIG[i + 1] < sigma) i++;
  const a = clamp((sigma - SIG[i]) / (SIG[i + 1] - SIG[i]));
  const put = (k, al) => {
    if (al <= .002) return; const c = stack[k], s = SCL[k], ga = ctx.globalAlpha;
    ctx.globalAlpha = ga * al;
    ctx.drawImage(c, sx * s, sy * s, sw * s, sh * s, dx, dy, dw, dh);
    ctx.globalAlpha = ga;
  };
  if (a > .97) put(i + 1, 1); else { put(i, 1); put(i + 1, a); }
}

// Draws the view through the lens into a rectangle.
function renderScene(ctx, x, y, w, h, o) {
  const f = o.f, crop = o.crop || 1, srcW = SW * SCENE_F / f / crop, srcH = srcW * h / w;
  const sx = PAD + SW / 2 - srcW / 2 + (o.panX || 0), sy = PAD + SH / 2 - srcH / 2 + (o.panY || 0);
  const sigmaFor = dist => {
    const c = OPT.blur(f, o.N, o.focus, dist);          // disc on film, mm
    const s = c / 36 * (SW * SCENE_F / f) * .42;         // disc to gaussian sigma, source px
    return Math.hypot(s, (o.eye || 0) * 60);
  };
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = '#F0DDBB'; ctx.fillRect(x, y, w, h);
  const sprite = (t, sg, ang) => {
    const k = w / srcW;
    ctx.save();
    ctx.translate(x + (t.x + PAD - sx) * k, y + (t.y + PAD - sy) * k); ctx.rotate(ang);
    drawLevel(ctx, t.stack, sg, 0, 0, 300, 300, -150 * k, -150 * k, 300 * k, 300 * k);
    ctx.restore();
  };
  WORLD.layers.forEach((l, i) => {
    const sg = sigmaFor(l.dist);
    if (i === 3) sprite(WORLD.tail, sg, o.wag === undefined ? Math.sin((o.time || 0) * 2.4) * .1 : o.wag); // behind the dog
    drawLevel(ctx, l.stack, sg, sx, sy, srcW, srcH, x, y, w, h);
    if (i === 3) {
      sprite(WORLD.jaw, sg, -(o.jaw || 0) * .42);
      if (o.jaw > .02) { const ga = ctx.globalAlpha; ctx.globalAlpha = ga * ss(.05, .5, o.jaw); sprite(WORLD.tongue, sg, -(o.jaw || 0) * .42); ctx.globalAlpha = ga; }
    }
    if (i === 2 && o.sparkle > .002) drawSparkle(ctx, o, sx, sy, srcW, w, x, y);
  });
  ctx.restore();
  VF.map = { sx, sy, k: w / srcW };
}

// sun glinting off the far field. Each glint is a point of light at 60 m, so out of focus it
// draws the real blur disc, and that disc has the shape of the iris
const GLINTS = (() => { let s = 5; const r = () => (s = s * 16807 % 2147483647) / 2147483647, g = []; for (let i = 0; i < 46; i++) g.push([820 + r() * 860, 560 + r() * 250, .55 + r() * .45]); return g; })();
function drawSparkle(ctx, o, sx, sy, srcW, w, x, y) {
  const k = w / srcW, disc = OPT.blur(o.f, o.N, o.focus, 60) / 36 * (SW * SCENE_F / o.f) * k / 2; // radius, px
  const R = Math.max(1.6 * k * 2, disc), hex = ss(2.2, 4.5, o.N), a = o.sparkle * clamp(.95 * Math.pow(2.5 * k * 2 / R, .55), .34, 1);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#FFE9C8';
  GLINTS.forEach(([gx, gy, b]) => {
    const px = x + (gx + PAD - sx) * k, py = y + (gy + PAD - sy) * k;
    ctx.globalAlpha = a * b; ctx.beginPath();
    for (let i = 0; i <= 36; i++) {
      const q = i / 36 * 6.283, m = ((q + .35) % 1.047) - .5236, rr = R * lerp(1, .866 / Math.cos(m), hex);
      i ? ctx.lineTo(px + Math.cos(q) * rr, py + Math.sin(q) * rr) : ctx.moveTo(px + Math.cos(q) * rr, py + Math.sin(q) * rr);
    }
    ctx.closePath(); ctx.fill();
    if (R > 5) { ctx.globalAlpha = a * b * .55; ctx.strokeStyle = '#FFF4E0'; ctx.lineWidth = Math.max(1, R * .09); ctx.stroke(); } // real discs have a brighter rim
  });
  ctx.restore();
}

// ---------- the viewfinder ----------
const VF = { canvas: null, ctx: null, buf: null, layer: null, map: null, rect: { x: 0, y: 0, w: 0, h: 0 }, cells: null };

function vfInit(c) {
  VF.canvas = c; VF.ctx = c.getContext('2d'); VF.buf = newCanvas(16, 16); VF.layer = newCanvas(16, 16);
  const cells = [];
  const NC = 15;
  for (let r = -NC; r <= NC; r++) for (let q = -NC; q <= NC; q++) {
    if (q * q + r * r > NC * NC * 1.05) continue;
    cells.push({ x: (q + (r & 1) * .5) / NC, y: r * .87 / NC, s: (((q + 40) * 7 + (r + 40) * 13) % 5) - 2, u: (((q + 40) * 3 + (r + 40) * 5) % 7) - 3 });
  }
  VF.cells = cells;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// slow, shapeless patches of the scene's own colours: what the eye gets before it settles
const BLOBS = [['#F3C99A', .3, .34, .5], ['#E5401A', .62, .3, .3], ['#8C8A72', .42, .68, .55], ['#B57A3C', .58, .62, .36], ['#E7DFCF', .22, .2, .46], ['#4A5444', .72, .78, .5], ['#CDB08F', .8, .42, .42]];
function drawChaos(c, x, y, w, h, a, now) {
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.globalCompositeOperation = 'screen';
  BLOBS.forEach(([col, bx, by, br], i) => {
    const px = x + (bx + Math.sin(now * .5 + i * 1.7) * .1) * w, py = y + (by + Math.cos(now * .42 + i * 2.1) * .09) * h, r = br * w * (1 + Math.sin(now * .7 + i) * .12);
    const g = c.createRadialGradient(px, py, 0, px, py, r);
    const rgb = parseInt(col.slice(1), 16), s = `${rgb >> 16},${rgb >> 8 & 255},${rgb & 255}`;
    g.addColorStop(0, `rgba(${s},${.9 * a})`); g.addColorStop(.6, `rgba(${s},${.42 * a})`); g.addColorStop(1, `rgba(${s},0)`);
    c.fillStyle = g; c.fillRect(x, y, w, h);
  });
  c.restore();
}

function drawAids(c, S, x, y, w, h, dpr, bw) {
  const cx = x + w / 2, cy = y + h / 2, lean = S.lean || 0;
  const r1 = h * lerp(.068, .34, lean), r2 = h * lerp(.125, .47, lean), r3 = h * lerp(.3, .9, lean);
  // signed focus error drives both focusing aids
  const err = (1 / S.focus - 1 / S.subject) * 3;
  const dx = Math.tanh(err * 1.1) * h * lerp(.05, .17, lean);
  // the big faint circle marks the metering area
  c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = Math.max(1, dpr * .7); c.beginPath(); c.arc(cx, cy, r3, 0, 7); c.stroke();
  // microprism collar: hundreds of tiny prisms, each throwing its patch sideways
  c.save(); c.beginPath(); c.arc(cx, cy, r2, 0, 7); c.arc(cx, cy, r1, 0, 7, true); c.clip();
  const cs = r2 / 15 * 1.06, sc = bw / w, mag = Math.min(1, Math.abs(err) * 1.5) * (1 - lean * .8);
  if (mag > .02) {
    // hundreds of tiny copies are costly, so the collar is rebuilt every third frame. It shimmers anyway.
    const D = Math.ceil(r2 * 2) + 2;
    if (!VF.mp) VF.mp = newCanvas(D, D);
    const mp = VF.mp, resized = mp.width !== D;
    VF.mpTick = (VF.mpTick || 0) + 1;
    if (resized || VF.mpTick % 3 === 0) {
      if (resized) mp.width = mp.height = D;
      const m = mp.getContext('2d'), ox0 = cx - D / 2, oy0 = cy - D / 2;
      VF.cells.forEach(e => {
        const px = cx + e.x * r2, py = cy + e.y * r2, ox = e.s * cs * 1.5 * mag, oy = e.u * cs * 1.1 * mag;
        m.drawImage(VF.buf, (px - x + ox - cs / 2) * sc, (py - y + oy - cs / 2) * sc, cs * sc, cs * sc, px - ox0 - cs / 2, py - oy0 - cs / 2, cs + .6, cs + .6);
      });
    }
    c.globalAlpha = Math.min(1, mag * 6) * c.globalAlpha;
    c.drawImage(mp, cx - D / 2, cy - D / 2);
  }
  c.restore();
  // split image: the two halves shear apart when out of focus
  [[-1, dx], [1, -dx]].forEach(([half, off]) => {
    c.save(); c.beginPath();
    c.arc(cx, cy, r1, half < 0 ? Math.PI : 0, half < 0 ? Math.PI * 2 : Math.PI); c.closePath(); c.clip();
    c.drawImage(VF.buf, x + off, y, w, h);
    c.restore();
  });
  c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = Math.max(1, dpr * .8);
  c.beginPath(); c.arc(cx, cy, r1, 0, 7); c.stroke();
  c.beginPath(); c.arc(cx, cy, r2, 0, 7); c.stroke();
  c.strokeStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.moveTo(cx - r1, cy); c.lineTo(cx + r1, cy); c.stroke();
  // meter: fixed index, swinging needle, on the right of the frame
  const mx = x + w * .955, top = y + h * .24, bot = y + h * .76, my = (top + bot) / 2;
  c.fillStyle = 'rgba(14,13,12,.9)'; c.fillRect(mx - w * .018, top - h * .04, w * .036, bot - top + h * .08);
  c.strokeStyle = 'rgba(247,244,238,.9)'; c.lineWidth = 1.2 * dpr;
  c.strokeRect(mx - w * .012, my - h * .022, w * .024, h * .044);
  c.fillStyle = 'rgba(247,244,238,.9)'; c.font = `500 ${Math.round(h * .03)}px "DM Mono",monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('+', mx, top - h * .015); c.fillText('−', mx, bot + h * .015);
  const ny = my - clamp(S.needle / 3, -1, 1) * (bot - top) * .46;
  c.strokeStyle = '#E5401A'; c.lineWidth = 2.2 * dpr; c.beginPath();
  c.moveTo(mx - w * .016, ny); c.lineTo(mx + w * .016, ny); c.stroke();
  VF.pts = { cx: cx / dpr, cy: cy / dpr, r1: r1 / dpr, r2: r2 / dpr, dx: dx / dpr, mx: mx / dpr, my: my / dpr, ny: ny / dpr };
}

function drawFinder(S, W, H, dpr, now) {
  const c = VF.ctx, r = S.vfRect, aid = S.aids;
  const x = r.x * dpr, y = r.y * dpr, w = r.w * dpr, h = r.h * dpr, rad = r.r * dpr;
  c.save();
  // darkness closes in softly from the edges, and never has a hard rim
  if (S.tunnel > 0) {
    if (S.tunnel >= 1) { c.fillStyle = '#0A0A09'; c.fillRect(0, 0, W, H); }
    else {
      const R = Math.hypot(W, H) * .62, inner = R * (1 - S.tunnel) * 1.15, outer = inner + R * .6;
      const g = c.createRadialGradient(W / 2, H / 2, inner, W / 2, H / 2, outer);
      g.addColorStop(0, 'rgba(10,10,9,0)'); g.addColorStop(1, `rgba(10,10,9,${Math.min(1, S.tunnel * 1.6)})`);
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.fillStyle = `rgba(10,10,9,${S.tunnel * S.tunnel * S.tunnel})`; c.fillRect(0, 0, W, H);
    }
  }
  if (S.light > .002) {
    // the scene is soft by nature, so it can be composed smaller than the screen
    const bs = Math.min(1, QUALITY.vfMax / w), bw = Math.round(w * bs), bh = Math.round(h * bs);
    if (VF.buf.width !== bw || VF.buf.height !== bh) { VF.buf.width = bw; VF.buf.height = bh; }
    const b = VF.buf.getContext('2d');
    renderScene(b, 0, 0, bw, bh, { f: S.f, N: S.viewN, focus: S.focus, eye: S.eye, time: now, panX: S.panX, panY: S.panY, crop: lerp(1, 3.1, S.lean || 0), jaw: S.jaw, sparkle: S.sparkle });
    if (S.vfDim > 0) { b.fillStyle = `rgba(14,13,12,${S.vfDim})`; b.fillRect(0, 0, bw, bh); }
    VF.mapScale = w / bw;

    if (S.frame >= 1) { // settled: a crisp frame
      c.save(); roundRect(c, x, y, w, h, rad); c.clip();
      c.drawImage(VF.buf, x, y, w, h);
      if (aid > 0) {
        if (aid >= 1 || !canFilter) { c.globalAlpha = aid; drawAids(c, S, x, y, w, h, dpr, bw); c.globalAlpha = 1; }
        else { // the markings focus in along with everything else
          const L = VF.layer; if (L.width !== W || L.height !== H) { L.width = W; L.height = H; }
          const l = L.getContext('2d'); l.clearRect(0, 0, W, H);
          drawAids(l, S, x, y, w, h, dpr, bw);
          c.globalAlpha = aid; c.filter = `blur(${(1 - aid) * 16 * dpr}px)`; c.drawImage(L, 0, 0); c.filter = 'none'; c.globalAlpha = 1;
        }
      }
      if (S.vfBlack > 0) { c.fillStyle = `rgba(0,0,0,${S.vfBlack})`; c.fillRect(x, y, w, h); }
      c.restore();
    } else { // still forming: light with no edges, drifting and gathering into a picture
      // everything here is soft, so it can be composed at a third of the size
      const q = 1 / 3, lw = Math.ceil(W * q), lh = Math.ceil(H * q);
      if (!VF.soft) VF.soft = newCanvas(lw, lh);
      const L = VF.soft; if (L.width !== lw || L.height !== lh) { L.width = lw; L.height = lh; }
      const l = L.getContext('2d'); l.globalCompositeOperation = 'source-over'; l.clearRect(0, 0, lw, lh);
      l.globalAlpha = 1 - S.chaos * .9; if (canFilter && S.chaos > .05) l.filter = `blur(${S.chaos * 40}px)`; l.drawImage(VF.buf, x * q, y * q, w * q, h * q); l.filter = 'none'; l.globalAlpha = 1;
      if (S.chaos > .01) drawChaos(l, 0, 0, lw, lh, S.chaos, now);
      // feathered mask: the frame's edge sharpens last, and at first there is no edge at all
      l.globalCompositeOperation = 'destination-in';
      const fe = (1 - S.frame) * Math.min(w, h) * q * .42;
      if (canFilter) l.filter = `blur(${fe}px)`;
      const ins = fe * (1 - S.chaos * 2.4);
      l.fillStyle = '#000'; roundRect(l, x * q + ins, y * q + ins, w * q - ins * 2, h * q - ins * 2, rad * q); l.fill();
      l.filter = 'none'; l.globalCompositeOperation = 'source-over';
      c.globalAlpha = S.light; c.imageSmoothingQuality = 'high'; c.drawImage(L, 0, 0, W, H); c.globalAlpha = 1;
    }
  }
  c.restore();
  if (S.vfFrame > 0) { // hairline around the panel in split view
    c.strokeStyle = `rgba(22,21,20,${S.vfFrame})`; c.lineWidth = dpr; roundRect(c, x, y, w, h, rad); c.stroke();
  }
}

// ---------- crystals: a very close look at the emulsion ----------
const GRAIN = { list: null, CORNER: [9, 90], mask: null };
function grainInit() {
  const cols = 150, rows = 100, list = [];
  let seed = 7; const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  const [c0, r0] = GRAIN.CORNER;
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
    const jx = q + (rnd() - .5) * .5, jy = r + (rnd() - .5) * .5, d = Math.hypot(jx - c0, jy - r0);
    // rotated 180 degrees: the lens inverts the image on the film
    const v = WORLD.lum[(999 - Math.min(999, Math.floor((r + .5) * 10))) * 1500 + 1499 - Math.min(1499, Math.floor((q + .5) * 10))];
    // close to the corner we look at, keep an even mix so the story reads
    const p = d < 24 ? .46 : Math.pow(v, 1.5) * 1.15;
    const a = rnd() * 6.28, sz = .34 + rnd() * .15, sides = 5 + (rnd() * 3 | 0), order = rnd(), sa = rnd() * 6.28;
    list.push({ x: jx, y: jy, d, hit: rnd() < p, order, a, sz, sides, sx: Math.cos(sa) * sz * .5, sy: Math.sin(sa) * sz * .5 });
  }
  GRAIN.list = list; GRAIN.cols = cols; GRAIN.rows = rows;
}
const INK = '#161514';
function polyPath(c, e, px, py, r) {
  c.beginPath();
  for (let i = 0; i < e.sides; i++) {
    const a = e.a + i / e.sides * 6.283, k = 1 + Math.sin(i * 2.3 + e.order * 9) * .12, xx = px + Math.cos(a) * r * k, yy = py + Math.sin(a) * r * k;
    i ? c.lineTo(xx, yy) : c.moveTo(xx, yy);
  }
  c.closePath();
}
// one crystal, close up. grow: silver spreading from the speck. gone: dissolved away
function crystal(c, e, px, py, cell, grow, gone, silverA, speck, photon) {
  const r = e.sz * cell;
  if (grow >= 1 && silverA >= 1) { polyPath(c, e, px, py, r * 1.02); c.fillStyle = INK; c.fill(); return; }
  if (gone >= 1 && grow <= 0) return;
  if (cell < 26) { // too small to see the growth in detail
    polyPath(c, e, px, py, r);
    if (grow > .5 && silverA > .5) { c.fillStyle = INK; c.fill(); }
    else { c.fillStyle = '#FBF7EE'; c.globalAlpha = 1 - gone; c.fill(); c.globalAlpha = 1; }
    return;
  }
  if (gone < 1) {
    const rr = r * (1 - gone * .35);
    polyPath(c, e, px, py, rr);
    c.globalAlpha = 1 - gone;
    c.fillStyle = '#FBF7EE'; c.fill();
    c.strokeStyle = 'rgba(22,21,20,.5)'; c.lineWidth = Math.max(.7, cell * .018); c.stroke();
    c.globalAlpha = 1;
  }
  const sx = px + e.sx * cell, sy = py + e.sy * cell;
  if (grow > 0 && silverA > .01) { // black spreads outward from the speck and fills the crystal
    c.save(); polyPath(c, e, px, py, r * 1.02); c.clip();
    c.globalAlpha = silverA; c.fillStyle = INK;
    const R = r * 2.1 * grow;
    c.beginPath(); c.arc(sx, sy, Math.max(.8, R), 0, 7);
    for (let i = 0; i < 5; i++) { const a = e.a * 3 + i * 1.26, q = R * (.55 + .2 * Math.sin(i * 3 + e.order * 7)); c.moveTo(sx + Math.cos(a) * q + R * .5, sy + Math.sin(a) * q); c.arc(sx + Math.cos(a) * q, sy + Math.sin(a) * q, R * .5, 0, 7); }
    c.fill(); c.restore(); c.globalAlpha = 1;
  }
  if (speck > 0 && grow <= .02) { // the latent image: a few atoms of silver. Black.
    const q = Math.max(1.2, cell * .04) * speck;
    c.fillStyle = INK;
    c.beginPath(); c.arc(sx, sy, q, 0, 7); c.moveTo(sx + q * 2.2, sy + q * .6); c.arc(sx + q * 1.5, sy + q * .6, q * .7, 0, 7); c.moveTo(sx - q * .3, sy + q * 1.8); c.arc(sx - q * .9, sy + q * 1.3, q * .6, 0, 7); c.fill();
  }
  if (photon > 0 && photon < 1) { // light arriving
    const yy = lerp(py - cell * 3.2, sy, photon);
    c.strokeStyle = '#E5401A'; c.lineWidth = Math.max(1.2, cell * .025); c.beginPath(); c.moveTo(sx, yy - cell * .5); c.lineTo(sx, yy); c.stroke();
  }
}
function drawLiquid(c, W, H, level, tint, now, dpr) {
  if (level <= .001) return;
  const y0 = H * (1 - level * 1.1), amp = H * .012;
  c.beginPath(); c.moveTo(0, H);
  for (let x = 0; x <= W; x += 24 * dpr) c.lineTo(x, y0 + Math.sin(x / (90 * dpr) + now * 1.8) * amp + Math.sin(x / (37 * dpr) - now * 2.6) * amp * .4);
  c.lineTo(W, H); c.closePath();
  c.fillStyle = tint; c.fill();
  c.strokeStyle = 'rgba(247,244,238,.8)'; c.lineWidth = 2 * dpr;
  c.beginPath();
  for (let x = 0; x <= W; x += 24 * dpr) { const yy = y0 + Math.sin(x / (90 * dpr) + now * 1.8) * amp + Math.sin(x / (37 * dpr) - now * 2.6) * amp * .4; x ? c.lineTo(x, yy) : c.moveTo(x, yy); }
  c.stroke();
  c.strokeStyle = 'rgba(247,244,238,.55)'; c.lineWidth = 1.2 * dpr;
  for (let i = 0; i < 16; i++) { // bubbles rising through it
    const bx = (i * 137 % 100) / 100 * W + Math.sin(now * 1.3 + i) * 12 * dpr, by = H - ((now * (32 + i * 5) * dpr + i * 97) % (H + 40));
    if (by < y0 + 8 * dpr) continue;
    c.beginPath(); c.arc(bx, by, (3 + i % 4 * 2) * dpr, 0, 7); c.stroke();
  }
}
function drawGrain(S, W, H, dpr, now) {
  const c = VF.ctx, g = S.grain;
  const cell = g.cell * dpr;
  const [c0, r0] = GRAIN.CORNER, fx = lerp(c0, 75, g.cx), fy = lerp(r0, 50, g.cx);
  const ox = W * g.sx - fx * cell, oy = H / 2 - fy * cell;
  const wob = g.sub > .02 ? cell * .035 * g.sub : 0;
  const fixed = clamp(g.wave / 190);
  c.save(); c.globalAlpha = g.alpha;
  c.fillStyle = '#E5DDCD'; c.fillRect(0, 0, W, H);
  const fw = GRAIN.cols * cell, fh = GRAIN.rows * cell;
  const divX = W * g.div;
  if (cell > 11) {
    const pass = (slide) => {
      for (const e of GRAIN.list) {
        const px = ox + e.x * cell + (wob ? Math.sin(e.y * .7 + now * 1.7) * wob : 0), py = oy + e.y * cell + (wob ? Math.cos(e.x * .6 + now * 1.4) * wob : 0);
        if (px < -cell || py < -cell * 4 || px > W + cell || py > H + cell) continue;
        const front = Math.max(g.front, g.wave);
        const raw = (front - e.d - e.order * 5) / 7;
        let grow = e.hit ? ss(0, 1, raw) : 0, gone = 0, silverA = 1;
        const photon = e.hit ? clamp(g.speck * 1.8 - e.order * .8) : 0;
        const speck = e.hit && photon >= 1 ? 1 : 0;
        if (!slide) { // negative road: fixer takes away the crystals that were never exposed
          const fixFront = Math.max(g.mix * 44, g.wave);
          if (!e.hit) gone = ss(0, 1, (fixFront - e.d - e.order * 5) / 7);
        } else { // slide road: bleach removes the silver, then the leftovers are developed
          if (e.hit) { silverA = 1 - ss(0, .5, g.mix); gone = ss(0, .5, g.mix); }
          else { grow = ss(.45, 1, g.mix); }
        }
        crystal(c, e, px, py, cell, grow, gone, silverA, speck, g.speck < 1 && e.hit ? photon : 0);
      }
    };
    if (g.div >= 1) pass(false);
    else {
      c.save(); c.beginPath(); c.rect(0, 0, divX, H); c.clip(); pass(false); c.restore();
      c.save(); c.beginPath(); c.rect(divX, 0, W - divX, H); c.clip(); pass(true); c.restore();
      c.fillStyle = '#F7F4EE'; c.fillRect(divX - 1.5 * dpr, 0, 3 * dpr, H);
      c.fillStyle = 'rgba(22,21,20,.82)'; c.font = `500 ${13 * dpr}px "DM Mono",monospace`; c.textBaseline = 'middle';
      const yL = H - 34 * dpr, a = clamp((1.15 - g.div) * 3) * clamp(g.div * 3 - .5);
      c.globalAlpha = g.alpha * a;
      c.textAlign = 'right'; c.fillText('NEGATIVE FILM · FIXER', divX - 20 * dpr, yL);
      c.textAlign = 'left'; c.fillText('SLIDE FILM · BLEACH, THEN DEVELOP', divX + 20 * dpr, yL);
      c.globalAlpha = g.alpha;
    }
  } else if (cell > 6) { // small enough that a crystal is just a dot
    c.fillStyle = INK;
    for (const e of GRAIN.list) {
      if (!e.hit || (Math.max(g.front, g.wave) - e.d - e.order * 5) < 3) continue;
      const px = ox + e.x * cell, py = oy + e.y * cell;
      if (px < -cell || py < -cell || px > W + cell || py > H + cell) continue;
      c.fillRect(px - cell * .5, py - cell * .5, cell, cell);
    }
  }
  const imgA = 1 - ss(5.2, 11, g.cell);
  if (imgA > .002) { // resolves into the frame itself, rotated by the lens, spreading from the corner
    if (!GRAIN.mask) GRAIN.mask = newCanvas(750, 500);
    const m = GRAIN.mask.getContext('2d'); m.globalCompositeOperation = 'source-over'; m.clearRect(0, 0, 750, 500);
    m.save(); m.translate(375, 250); m.rotate(Math.PI); m.drawImage(WORLD.neg, -375, -250, 750, 500); m.restore();
    const R = g.wave / 150 * 750, cxm = c0 / 150 * 750, cym = r0 / 100 * 500;
    const gr = m.createRadialGradient(cxm, cym, Math.max(0, R - 90), cxm, cym, R + 10);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    m.globalCompositeOperation = 'destination-in'; m.fillStyle = gr; m.fillRect(0, 0, 750, 500);
    c.globalAlpha = g.alpha * imgA; c.drawImage(GRAIN.mask, ox, oy, fw, fh);
    // the strip around the frame: clear film and its perforations
    c.strokeStyle = INK; c.lineWidth = dpr; c.strokeRect(ox - .5, oy - .5, fw + 1, fh + 1);
    const pitch = fw / 8, ph = fh * .07;
    c.fillStyle = INK;
    for (let i = -6; i < 15; i++) [oy - fh * .13, oy + fh * 1.06].forEach(yy => { roundRect(c, ox + i * pitch + pitch * .2, yy, pitch * .52, ph, 3 * dpr); c.fill(); });
    c.globalAlpha = g.alpha;
  }
  c.restore();
  c.save(); c.globalAlpha = g.alpha;
  drawLiquid(c, W, H, g.sub, 'rgba(120,160,170,.3)', now, dpr);
  c.restore();
}
