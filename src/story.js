// ---------- the script ----------
// The film is a list of scenes. Each has a travel in (scrolled or auto-played) and a hold,
// where the scroll wheel sticks and the text can be read. Everything below is timed off them.
const T = {}, HOLDS = [], SCENES = [];
let _t = 0;
function S(name, trans, o = {}) {
  const a = _t + trans, b = a + 1;
  T[name] = [a, b]; HOLDS.push({ name, in: _t, a, b, w: o.w || 1 });
  SCENES.push({ name, a, b, p: o.p, swoop: o.swoop || 0, drift: o.drift === undefined ? 1 : o.drift });
  _t = b;
}
const A = n => T[n][0], B = n => T[n][1], I = n => HOLDS.find(h => h.name === n).in;

// pose: target x,y,z, azimuth, elevation, distance, screen offset x,y, roll
const BOKEH_PAN = [260, 130];
const SIDE = [0, 1.1, 1, 90, 2, 34, -.17, 0, 0], LENS = [0, .5, 7, 90, 0, 36, 0, -.17, 0], SPLIT = [0, 1.1, 1.6, 90, 1, 31, .26, .03, 0];
const REAR = [0, .6, -1.8, 180, 2, 30, .2, 0, 0];

S('hero', 0, { p: [0, 1.2, .8, -26, 12, 54, 0, -.1, 0] });
S('size', 1.7, { p: [-.5, 1.3, .4, -50, 18, 44, .2, 0, -2], swoop: .1 });
S('rings', 1.9, { p: [0, .4, 3.2, 34, 10, 27, -.22, 0, 2.5], swoop: .14 });
S('deck', 1.9, { p: [-.6, 3.2, -.5, 8, 66, 40, .16, 0, 0], w: 1.2 });
S('cell', 2.1, { p: [-5.2, -3.6, -.6, -34, -44, 20, .22, 0, -3], swoop: .12 });
S('quote', 2.3, { p: [0, 1, 0, -62, 16, 90, 0, .06, 0], swoop: .05 });
S('uLens', 1.5, { p: [0, 0, 12.5, -50, 12, 26, -.2, 0, 2] });
S('uBox', 1.5, { p: [0, 0, 5, 44, 14, 26, .2, 0, -2], swoop: .1 });
S('uPrism', 1.5, { p: [0, 8.2, 0, -44, 16, 25, -.2, 0, 2], swoop: .1 });
S('uShutter', 1.7, { p: [0, 0, -6, 146, 12, 25, .2, 0, -2], swoop: .1 });
S('uFilm', 1.3, { p: [-.55, 0, -9, 212, 10, 32, -.2, 0, 2] });
S('whole', 2.5, { p: [0, 1.2, .6, 62, 18, 44, .2, 0, 0], swoop: .08 });
S('planeIn', 1.5, { p: [0, 1.2, .6, 54, 22, 40, .2, 0, 0] });
S('section', 2.6, { p: SIDE, w: 1.2 });
S('mirrorUp', 1.5, { p: [0, 1.1, 1, 90, 2, 32, -.17, 0, 0], w: 1.2 });
S('bend', 1.7, { p: LENS });
S('upside', 1.5, { p: [0, .5, 7.4, 90, 0, 37, 0, -.17, 0] });
S('near1', 1.4, { p: [0, .5, 6.4, 90, 0, 33, 0, -.17, 0] });
S('near2', 1.3, { p: [0, .5, 6, 90, 0, 31, 0, -.17, 0] });
S('ap1', 1.3, { p: [0, .5, 6.6, 90, 0, 34, 0, -.17, 0] });
S('ap2', 1.8, { p: [0, .5, 6.6, 90, 0, 34, 0, -.17, 0] });
S('dof1', 1.5, { p: [0, .5, 8.2, 90, 0, 38, 0, -.17, 0] });
S('dof2', 1.5, { p: [0, .5, 8.2, 90, 0, 38, 0, -.17, 0] });
S('close', 2.2, { p: [0, 1.6, .6, 128, 14, 42, 0, .02, 0] });
S('point', 2.2, { p: [5.2, 6.2, -2, 172, 5, 35, -.13, .06, 0], w: 1.1 });
S('layers', 1.3, { p: [4.4, 5.6, -2, 170, 4, 31, -.12, .06, 0], w: 1.1 });
S('eye', 3, { p: [0, 3.2, -2.3, 180, 0, 2.4, 0, 0, 0], drift: 0, w: 1.4 });
S('aids', 1.5, { w: 1.3, drift: 0 });
S('fIntro', 2, { p: SPLIT, drift: .3 });
S('fNear', 1.5, { drift: .3 });
S('fFar', 1.7, { drift: .3 });
S('fSplit1', 1.7, { w: 1.2, drift: .3 });
S('fSplit2', 1.4, { w: 1.2, drift: .3 });
S('dofThin', 1.5, { w: 1.3, drift: .3 });
S('bokeh', 2, { w: 1.3, drift: .3 });
S('bokehHex', 1.5, { w: 1.2, drift: .3 });
S('dofDeep', 1.9, { w: 1.2, drift: .3 });
S('zSwap', 2.2, { drift: .3 });
S('zWide', 1.5, { drift: .3 });
S('zTele', 1.5, { drift: .3 });
S('zBack', 2.2, { drift: .3 });
S('needle', 1.4, { w: 1.3, drift: .3 });
S('roll', 2.3, { p: [ROLL_POS[0] + 1.2, ROLL_POS[1], ROLL_POS[2], 48, 14, 15, .2, 0, -3], swoop: .12, w: 1.2 });
S('asa', 2.2, { p: [-2.8, 3.7, -.72, 58, 50, 9, -.2, 0, 0], swoop: .12 });
S('expAp', 2.1, { p: SPLIT, w: 1.3, drift: .3 });
S('expSh', 1.7, { w: 1.3, drift: .3 });
S('preview', 1.6, { w: 1.2, drift: .3 });
S('ready', 1.8, { w: 1.2, drift: 0 });
S('mouth', 1.3, { w: 1.1, drift: 0 });
S('shot', 1, { drift: 0 });
S('s0', 1.9, { p: [0, 1.1, -.2, 90, 2, 32, .2, 0, 0], drift: .3 });
S('s1', 1.3, { drift: .3 });
S('s2', 1.3, { drift: .3 });
S('s3', 1.8, { p: REAR, drift: .3 });
S('s4', 1, { drift: .3 });
S('s5', 1, { drift: .3 });
S('s6', 1.8, { p: [0, 1.1, -.2, 90, 2, 32, .2, 0, 0], drift: .3 });
S('sp1000', 1.9, { p: REAR, drift: .3, w: 1.2 });
S('sp250', 1.2, { drift: .3 });
S('sp60', 1.2, { drift: .3 });
S('spSlow', 1.8, { p: [0, -3.4, -1, 180, 26, 34, .22, 0, 0], w: 1.2 });
S('flashOn', 2.4, { p: [0, 3, .4, 28, 10, 44, -.2, 0, 2], swoop: .1 });
S('sync', 1.9, { p: [0, 3, .4, 36, 12, 44, -.2, 0, 0], w: 1.2 });
S('strokeA', 2.3, { p: [-1.6, 1.4, -1, 204, 34, 31, .25, 0, 0], swoop: .08 });
S('strokeB', 3, { p: [-1.6, 1.4, -1, 196, 30, 29, .25, 0, 0], w: 1.3 });
S('filmQ', 2, { p: [0, 0, -1.5, 176, 6, 30, .2, 0, 0] });
S('cry', 2, { p: [0, 0, -2.2, 180, 0, 3.6, 0, 0, 0], drift: 0, w: 1.2 });
S('lat', 1.7, { drift: 0, w: 1.2 });
S('devIn', 1.7, { drift: 0 });
S('silver', 2.4, { drift: 0, w: 1.2 });
S('roads', 1.7, { drift: 0, w: 1.3 });
S('roads2', 2.2, { drift: 0, w: 1.3 });
S('spread', 3.2, { drift: 0, w: 1.1 });
S('neg', 1.5, { drift: 0, w: 1.2 });
S('end', 3.4, { p: [9.5, 14, -8, -15, -5, 46, .1, 0, -1.5], w: 1 });
const T_END = _t;
const EYE_T = A('eye') - .25, SHOT_T = A('shot') - .3, FLASH_T = A('sync') - .35;

const CHAPTERS = [
  ['hero', 'OM-1'], ['size', 'Size'], ['rings', 'Controls'], ['quote', 'Units'], ['whole', 'Light path'], ['bend', 'The lens'],
  ['point', 'Viewfinder'], ['fIntro', 'Focus'], ['zSwap', 'Zoom'], ['needle', 'Exposure'], ['ready', 'The click'], ['s0', 'Slow motion'], ['sp1000', 'Shutter'],
  ['flashOn', 'Flash'], ['strokeA', 'One stroke'], ['filmQ', 'Film'], ['end', 'End'],
].map(([s, name]) => [A(s), name]);

// pos: l, r, c (hero), tl (over diagrams), bl (under the finder panel), b (on the finder)
const CARDS = [
  { s: 'size', pos: 'l', h: 'Serious cameras<br>were bricks.', p: 'Yoshihisa Maitani set himself a target: 20% smaller than a Nikon F in every dimension, and half the weight.', m: '136 × 83 × 50 mm &nbsp;·&nbsp; 510 g' },
  { s: 'rings', pos: 'r', h: 'Three rings,<br>one hand.', p: 'Aperture at the very front of the lens, focus behind it, shutter speed around the mount. All of it sits under the left hand, so your eye never leaves the finder.' },
  { s: 'deck', pos: 'l', h: 'Which keeps<br>the deck clear.', p: 'With no speed dial on top, the plate is left for the wind lever, the release, the film speed and the rewind.' },
  { s: 'cell', pos: 'l', h: 'One battery.', p: 'A single 1.35 V cell under the base plate. It moves the meter needle and does nothing else. If it dies, the camera keeps shooting.' },
  { s: 'quote', pos: 'c2', h: '“I try to take apart the camera into units by each function.”', m: 'Yoshihisa Maitani' },
  { s: 'uLens', pos: 'r', k: 'Unit 1', h: 'Lens', p: 'Six elements in five groups. Its one job is to form a sharp image on the film, 46 mm behind the mount.' },
  { s: 'uBox', pos: 'l', k: 'Unit 2', h: 'Mirror box', p: 'An oversize mirror on a pivot. Beside it, an air damper: a small cylinder that breathes in and out to soften the landing.' },
  { s: 'uPrism', pos: 'r', k: 'Unit 3', h: 'Pentaprism', p: 'Glass that turns the image the right way round. Two CdS cells sit on either side of the eyepiece and read the light.' },
  { s: 'uShutter', pos: 'l', k: 'Unit 4', h: 'Shutter', p: 'Two cloth curtains on lightweight drums. More than twenty shock absorbers keep the sound down.', photo: ['shutter', 'A real OM-1, back open: the cloth curtain in its gate.'] },
  { s: 'uFilm', pos: 'r', k: 'Unit 5', h: 'Film', p: 'Thirty-six frames, 24 × 36 mm each. Everything else in the camera exists to serve this strip.' },
  { s: 'whole', pos: 'l', h: 'To see how light moves through it, cut it in half.' },
  { s: 'planeIn', pos: 'l', h: 'Straight down<br>the middle.', p: 'Lens, mirror, prism and film all sit on this one plane. Lift away the near half and they are all in view.' },
  { s: 'section', pos: 'r', h: 'One lens,<br>two destinations.', p: 'A 45° mirror throws the light up to a screen exactly as far away as the film. What is sharp here will be sharp there.', photo: ['mirror', 'A real OM-1 through the empty mount: the mirror, down.'] },
  { s: 'mirrorUp', pos: 'r', h: 'Then it gets<br>out of the way.', p: 'The mirror swings up, and the same light carries straight on to the film. For that moment, you see nothing.' },
  { s: 'bend', pos: 'tl', h: 'Glass bends light.', p: 'A convex lens gathers parallel rays to a single point. On this lens, that point is 50 mm behind the glass.' },
  { s: 'upside', pos: 'tl', h: 'Every photo starts upside down.', p: 'Rays from the top of the subject land at the bottom of the frame. The mirror and prism undo this for your eye.' },
  { s: 'near1', pos: 'tl', h: 'Bring the subject closer…', p: 'Now its rays want to meet behind the film. Where they land, each point has become a small disc: a blur.' },
  { s: 'near2', pos: 'tl', h: '…and the lens moves forward.', p: 'Focus is only distance. The ring screws the glass out until the rays meet on the film again. From infinity to 45 cm, it travels about 6 mm.' },
  { s: 'ap1', pos: 'tl', h: 'The aperture is a hole that changes size.', p: 'Six blades. Wide open at f/1.8 the opening is 28 mm across.' },
  { s: 'ap2', pos: 'tl', h: 'Each stop halves the light.', p: 'At f/16 the blades leave a hole about 3 mm wide, and only a thin cone of rays gets through.' },
  { s: 'dof1', pos: 'tl', h: 'Depth of field.', p: 'A subject out of focus lands as a disc, not a dot. With the lens wide open, that disc is large.' },
  { s: 'dof2', pos: 'tl', h: 'Narrow the cone, shrink the disc.', p: 'Stop down and the same subject lands as a much smaller disc, so more of the scene looks sharp.' },
  { s: 'point', pos: 'tl', h: 'Let’s actually point<br>it at something.' },
  { s: 'layers', pos: 'tl', p: 'A flower at arm’s length. A dog at three metres. A tree and a house across the field. Every one of them a different distance from the film.' },
  { s: 'eye', pos: 'b', h: 'Now look through it.' },
  { s: 'aids', pos: 'b', p: 'A bright, upright 97% of the frame, at 0.92× life size. Everything you need, and nothing electronic.' },
  { s: 'fIntro', pos: 'bl', h: 'Focus.', p: 'In the centre circle the image splits in two when it is out of focus. Turn the ring until the halves line up.', photo: ['screen', 'A real split-image screen, out of focus. Look at the bottle.'] },
  { s: 'fNear', pos: 'bl', h: 'On the flower, 1 metre.', p: 'Swing the circle onto the flower. The lens racks out and everything behind melts away.' },
  { s: 'fFar', pos: 'bl', h: 'On the house, 60 metres.', p: 'The lens racks back in. The house and tree are crisp, and now the foreground is the blur.' },
  { s: 'fSplit1', pos: 'bl', h: 'Now the dog. Lean in on the ear.', p: 'Its front edge is one straight vertical line, ideal for the split circle. Out of focus, the top half of the line and the bottom half do not meet.' },
  { s: 'fSplit2', pos: 'bl', h: 'One unbroken line: in focus.', p: 'Turn the ring and the halves slide towards each other. When the edge runs straight through the circle, the dog is exactly 3 metres away, and sharp.' },
  { s: 'dofThin', pos: 'bl', h: 'Wide open, focus is a thin slice.', p: 'At f/1.8 and 3 metres, only about 40 cm of the world is sharp: a thin sheet standing in the field. The dog is inside it. Everything else falls away.' },
  { s: 'bokeh', pos: 'bl', h: 'Bokeh: blur you can see.', p: 'Focus close and sun glinting off the far field stops being points. Each one lands on the film as a disc of light, the out-of-focus disc from earlier, and the discs overlap and melt together.' },
  { s: 'bokehHex', pos: 'bl', h: 'Each disc is a picture of the iris.', p: 'Every disc takes the shape of the hole the light came through. Stop down and they shrink and show their six sides.' },
  { s: 'dofDeep', pos: 'bl', h: 'Stopped right down, the slice is deep.', p: 'At f/16 the sharp zone runs from about 2 to 7 metres. Narrow cones make small discs, so more of the scene passes as sharp. It costs light.' },
  { s: 'zSwap', pos: 'bl', h: 'Zooming needs another lens.', p: 'The 50 mm is a fixed lens. A later S Zuiko 35–70 mm twists on in its place.' },
  { s: 'zWide', pos: 'bl', h: '35 mm: more of the scene.', p: 'Groups of glass slide inside the barrel, changing the focal length.' },
  { s: 'zTele', pos: 'bl', h: '70 mm: less, but larger.', p: 'The front tube slides out, and a smaller part of the scene fills the frame.' },
  { s: 'zBack', pos: 'bl', h: 'Back to the 50.', p: 'The framing was right all along.' },
  { s: 'needle', pos: 'bl', h: 'The needle.', p: 'Light reaches two CdS cells, and their resistance falls as it gets brighter. The battery pushes a current through them, and that swings the needle.' },
  { s: 'roll', pos: 'l', h: 'What is it aiming for? The film.', p: 'Every film needs a set amount of light, no more and no less. This roll is rated ASA 100. A faster film would need less.' },
  { s: 'asa', pos: 'r', h: 'So tell the camera.', p: 'The ASA dial is set to match the roll. That fixes the target the needle has to reach: its centre mark.' },
  { s: 'expAp', pos: 'bl', h: 'Aperture: less light gets through.', p: 'From f/1.8 to f/5.6 the blades pass about a tenth of the light. The lens stays open to meter, so a tab on it pulls a cord to tell the needle.' },
  { s: 'expSh', pos: 'bl', h: 'Shutter speed: less time.', p: 'From 1/60 to 1/250 is a quarter of the time. The ring pulls the same cord, which physically turns the meter in its housing. Needle centred: exposure correct.' },
  { s: 'preview', pos: 'bl', h: 'Why the finder stayed bright.', p: 'The lens stays wide open while you compose. Press the preview button and it stops down: darker, but this is the true depth of field.' },
  { s: 'ready', pos: 'b', h: 'Everything is set.', p: 'Sharp, framed, needle centred. Now wait for the moment.' },
  { s: 'mouth', pos: 'b', h: 'There.' },
  { s: 'shot', pos: 'b', p: 'That black blink was the mirror going up. In that instant, the picture was taken.' },
  { from: 's0', to: 's6', pos: 'l', dark: true, kind: 'clock' },
  { s: 'sp1000', pos: 'l', dark: true, h: 'Exposure is a slit.', p: 'The curtains always cross at the same speed. At 1/1000 the second chases right behind the first, and a thin slit sweeps the film.' },
  { s: 'sp250', pos: 'l', dark: true, h: '1/250: a wider slit.', p: 'The second curtain leaves later, so every part of the film sees the light for longer.' },
  { s: 'sp60', pos: 'l', dark: true, h: '1/60: the whole frame.', p: 'The first curtain finishes before the second begins. For an instant the film is fully uncovered.' },
  { s: 'spSlow', pos: 'l', dark: true, h: 'Time, by clockwork.', p: 'Below 1/60 the second curtain must wait. A spring runs a gear train, held back by a rocking anchor. It is a small, fast clock.', m: 'Layout simplified' },
  { s: 'flashOn', pos: 'r', h: 'Flash needs the whole frame.', p: 'A flash is over in a tiny fraction of a second, so the frame must be fully uncovered when it fires.' },
  { s: 'sync', pos: 'r', h: 'A contact, not a clock.', p: 'A contact closes as the first curtain lands, and fires the flash. Fastest full opening: 1/60.' },
  { s: 'strokeA', pos: 'l', h: 'One stroke.', p: 'A single pull of the lever does all of the resetting. With the shell turned to glass, here is what it moves.' },
  { s: 'strokeB', pos: 'l', h: 'Ready again.', p: '150° of the lever: the sprocket pulls the film on, the take-up spool collects it, both curtains roll back, the mirror spring is set and the counter ticks.' },
  { s: 'filmQ', pos: 'l', h: 'And the film?', p: 'Nothing to see. Light has changed it, but no eye could tell.' },
  { s: 'cry', pos: 'lp', h: 'Crystals in gelatin.', p: 'Up close, the emulsion is a layer of silver halide crystals. Each is a separate tiny light detector.' },
  { s: 'lat', pos: 'lp', h: 'A latent image.', p: 'Where light struck, a few atoms of silver form a speck on the crystal. Just a handful of atoms, invisible. The rest are untouched.' },
  { s: 'devIn', pos: 'lp', h: 'Into the developer.', p: 'Later, in the dark, the film goes into a bath. Only crystals that carry a speck will react.' },
  { s: 'silver', pos: 'lp', h: 'The speck spreads.', p: 'Developer turns a crystal to metallic silver, starting from the speck. It grows until the whole crystal is a black clump.' },
  { s: 'roads', pos: 'c3', h: 'Now there are two roads.', p: 'Either way, a second bath removes whatever you do not want to keep.' },
  { s: 'roads2', pos: 'c3', p: 'Negative film dissolves the unused crystals. Slide film instead bleaches the silver away, then develops the crystals that were left: a positive.' },
  { s: 'spread', pos: 'lp', h: 'Every crystal, all at once.', p: 'From this one corner, the same thing is happening across millions of crystals, and the picture appears.' },
  { s: 'neg', pos: 'lp', h: 'A negative.', p: 'Bright in the world, dark on film. Still upside down. Print it, and the tones flip back.' },
].map(c => {
  const a = c.s || c.from, b = c.s || c.to;
  return Object.assign(c, { t: [A(a) - .55, B(b) + .5] });
});

const CLOCK_STEPS = [
  ['s0', 'Press the release'],
  ['s1', 'Lens stops down to f/5.6'],
  ['s2', 'Mirror swings up'],
  ['s3', 'First curtain runs'],
  ['s4', 'Second curtain follows'],
  ['s5', 'Exposure ends'],
  ['s6', 'Mirror returns, lens reopens'],
];
const CLOCK_MS = { s0: 0, s1: 8, s2: 34, s3: 40, s4: 46, s5: 58, s6: 100 };

const POSES = (() => { // two keys per scene: arrive, then drift slowly through the hold
  const P = []; let cur = SCENES[0].p, n = 0;
  SCENES.forEach(s => {
    if (s.p) cur = s.p;
    const a = cur.slice(), b = cur.slice(), sgn = n++ % 2 ? 1 : -1;
    b[3] += sgn * 2.4 * s.drift; b[4] += .5 * s.drift; b[5] *= 1 - .022 * s.drift;
    P.push({ t: s.a, v: a, swoop: s.swoop }, { t: s.b, v: b, swoop: 0 });
    cur = b.slice(); if (s.drift < 1) cur = a.slice();
    if (s.p) { /* next scene without a pose carries on from here */ }
  });
  return P;
})();

const seq = (...k) => track(k);
const trk = {
  ex: seq([I('quote'), 0], [A('quote'), 1], [B('uFilm'), 1], [A('whole') - .3, 0]),
  // the section: near half lifted away in one piece
  open: seq([B('planeIn'), 0], [B('planeIn') + 1.8, 1], [I('close') + .6, 1], [A('close') - .1, 0], [B('aids'), 0], [B('aids') + .1, 1], [B('s2'), 1], [A('s3') - .5, 0], [B('s5'), 0], [A('s6') - .4, 1], [B('s6'), 1], [A('sp1000') - .3, 0]),
  planeX: seq([B('whole') - .1, 9], [A('planeIn'), 0]),
  planeA: seq([A('whole') + .2, 0], [A('whole') + .7, .85], [B('planeIn') + .2, .85], [B('planeIn') + 1.2, 0]),
  mirror: seq([B('section'), 0], [A('mirrorUp') - .1, 1], [I('close') + .4, 1], [A('close') - .3, 0], [B('s1'), 0], [A('s2'), 1], [B('s5'), 1], [A('s6'), 0]),
  shOpen: seq([B('section') + .4, 0], [A('mirrorUp'), 1], [I('close') + .2, 1], [A('close') - .5, 0]),
  ghost: seq([A('size') - .9, 0], [A('size') - .2, 1], [B('size'), 1], [B('size') + .9, 0]),
  ghostS: seq([A('size') - .9, 1.2], [A('size') - .2, 1.2], [B('size'), 1.2], [B('size') + .9, 1]),
  cell: seq([A('cell') - 1, 0], [A('cell'), 1], [B('cell'), 1], [B('cell') + .9, 0]),
  // light through the section
  ray: track([[A('section') - 1.4, 0], [A('section') + .2, 2]], x => x),
  rayA: seq([A('section') - 1.5, 0], [A('section') - 1.2, 1], [B('bend') - .4, 1], [B('bend'), 0]),
  rayFilm: seq([B('section'), 0], [A('mirrorUp'), 1]),
  // lens chapter: one continuous diagram
  fan: seq([I('bend') + .6, 0], [A('bend') - .1, 1], [B('dof2') + .2, 1], [B('dof2') + 1, 0]),
  objZ: ltrack([[A('bend'), 900], [B('bend'), 900], [A('upside'), 19], [B('upside'), 19], [A('near1'), 9.5]]),
  objY: seq([B('bend') + .2, 0], [A('upside'), 2.2]),
  lensExt: seq([B('near1'), 0], [A('near2'), .625], [B('dof2'), .625], [B('dof2') + 1, 0]),
  ringLens: ltrack([[B('near2'), 1.8], [A('ap1'), 1.8], [B('ap1'), 1.8], [A('ap2'), 16], [B('ap2'), 16], [A('dof1'), 1.8], [B('dof1'), 1.8], [A('dof2'), 11], [B('dof2'), 11], [B('dof2') + 1, 1.8]]),
  subjB: seq([B('ap2') + .3, 0], [A('dof1'), 1], [B('dof2'), 1], [B('dof2') + .8, 0]),
  world: seq([I('point') + .3, 0], [A('point') - .1, 1], [B('aids'), 1], [B('aids') + .1, 0]),
  // arriving in the eyepiece
  tunnel: seq([A('eye') - 1.25, 0], [A('eye') - .3, 1], [B('aids'), 1], [A('fIntro') - .1, 0], [B('preview'), 0], [A('ready') - .1, 1], [B('shot'), 1], [A('s0') - .2, 0]),
  lightIn: seq([A('eye') - .55, 0], [A('eye') + .1, .8], [B('eye'), 1]),
  frame: seq([A('eye') - .4, 0], [B('eye'), 1]),
  vf: seq([A('eye') - .6, 0], [A('eye') - .3, 1], [B('shot'), 1], [A('s0') - .2, 0]),
  aids: seq([B('eye') - .1, 0], [A('aids'), 1], [B('shot'), 1]),
  split: seq([B('aids'), 0], [A('fIntro') - .05, 1], [B('preview'), 1], [A('ready') - .05, 0]),
  panel: seq([B('needle'), 1], [B('needle') + .5, 0], [A('expAp') - .5, 0], [A('expAp') + .1, 1]),
  // what the finder is doing
  focus: ltrack([[A('eye'), 1.7], [A('fIntro'), 1.7], [B('fIntro'), 1.7], [A('fNear'), 1.05], [B('fNear'), 1.05], [A('fFar'), 60], [B('fFar'), 60], [A('fSplit1'), 2.1], [B('fSplit1'), 2.1], [A('fSplit2'), DOG_M], [B('dofThin'), DOG_M], [A('bokeh'), 1.05], [B('bokehHex'), 1.05], [A('dofDeep'), DOG_M]]),
  subject: ltrack([[B('fIntro'), DOG_M], [B('fIntro') + .6, 1.05], [B('fNear'), 1.05], [B('fNear') + .7, 60], [B('fFar'), 60], [B('fFar') + .6, DOG_M], [B('dofThin'), DOG_M], [B('dofThin') + .9, 1.05], [B('bokehHex'), 1.05], [B('bokehHex') + .9, DOG_M]]),
  panX: seq([B('fIntro'), PANS.dog[0]], [B('fIntro') + .8, PANS.flower[0]], [B('fNear'), PANS.flower[0]], [B('fNear') + 1, PANS.house[0]], [B('fFar'), PANS.house[0]], [B('fFar') + .9, PANS.dog[0]], [B('fSplit2'), PANS.dog[0]], [A('dofThin'), 0], [B('dofThin'), 0], [A('bokeh'), BOKEH_PAN[0]], [B('bokehHex'), BOKEH_PAN[0]], [A('dofDeep'), 0]),
  panY: seq([B('fIntro'), PANS.dog[1]], [B('fIntro') + .8, PANS.flower[1]], [B('fNear'), PANS.flower[1]], [B('fNear') + 1, PANS.house[1]], [B('fFar'), PANS.house[1]], [B('fFar') + .9, PANS.dog[1]], [B('fSplit2'), PANS.dog[1]], [A('dofThin'), 0], [B('dofThin'), 0], [A('bokeh'), BOKEH_PAN[1]], [B('bokehHex'), BOKEH_PAN[1]], [A('dofDeep'), 0]),
  lean: seq([B('fFar') + .5, 0], [A('fSplit1'), 1], [B('fSplit2'), 1], [A('dofThin') - .2, 0]),
  dofN: ltrack([[B('fFar'), 1.8], [A('bokehHex') - .9, 1.8], [A('bokehHex'), 5.6], [B('bokehHex'), 5.6], [A('dofDeep'), 16], [B('dofDeep'), 16], [B('dofDeep') + 1.2, 1.8]]),
  dofBar: seq([B('fSplit2') + .4, 0], [A('dofThin'), 1], [B('dofThin'), 1], [B('dofThin') + .6, 0], [A('dofDeep') - .5, 0], [A('dofDeep'), 1], [B('dofDeep'), 1], [B('dofDeep') + .5, 0]),
  sparkle: seq([B('dofThin') + .1, 0], [B('dofThin') + 1, 1], [B('bokehHex'), 1], [B('bokehHex') + 1, 0]),
  f: ltrack([[A('zSwap'), 50], [A('zWide'), 35], [B('zWide'), 35], [A('zTele'), 70], [B('zTele'), 70], [A('zBack') - .9, 50]]),
  swap: seq([I('zSwap') + .2, 0], [A('zSwap') - .1, 1], [B('zTele'), 1], [A('zBack') - .1, 0]),
  ringN: ltrack([[0, 1.8], [A('expAp') - .5, 1.8], [A('expAp') + .35, 5.6]]),
  prev: seq([I('preview') + .5, 0], [A('preview'), 1], [B('preview'), 1], [B('preview') + .6, 0]),
  speed: ltrack([[0, 60], [A('expSh') - .9, 60], [A('expSh') + .1, 250]]),
  asa: ltrack([[0, 400], [I('asa') + 1.4, 400], [A('asa') + .4, 100]]),
  iris: seq([A('expAp') - .5, 0], [A('expAp') + .35, 1], [B('expAp'), 1], [B('expAp') + .9, 0]),
  meterA: seq([I('needle') + .3, 0], [A('needle'), 1], [B('needle'), 1], [B('needle') + .4, 0], [A('expAp') - .4, 0], [A('expAp'), 1], [B('expSh'), 1], [B('expSh') + .5, 0]),
  jaw: seq([B('ready') + .1, 0], [A('mouth'), 1], [B('shot'), 1]),
  // slow motion, milliseconds. Each step has a small creep through its hold
  clock: track(Object.keys(CLOCK_MS).flatMap(k => [[A(k), CLOCK_MS[k]], [B(k), CLOCK_MS[k] + (k === 's6' ? 0 : .4)]]), x => x),
  dark: seq([B('shot') + .1, 0], [A('s0') - .4, 1], [B('spSlow'), 1], [B('spSlow') + 1.2, 0]),
  doorGone: seq([B('s2') + .3, 0], [A('s3') - .3, 1], [B('s5'), 1], [A('s6') - .5, 0], [B('s6') + .3, 0], [A('sp1000') - .4, 1], [B('sp60'), 1], [B('sp60') + 1, 0]),
  filmFade: seq([B('s2') + .3, 1], [A('s3') - .3, .22], [B('s5'), .22], [A('s6') - .5, 1], [B('s6') + .3, 1], [A('sp1000') - .4, .22], [B('sp60'), .22], [B('sp60') + 1, 1]),
  gears: seq([B('sp60') + .3, 0], [A('spSlow'), 1], [B('spSlow'), 1], [B('spSlow') + .9, 0]),
  flash: seq([B('spSlow') + .9, 0], [A('flashOn') - .1, 1], [B('sync'), 1], [B('sync') + .9, 0]),
  // one stroke: the shell goes to glass so everything that moves can be seen
  strokeGhost: seq([I('strokeA') + .8, 0], [A('strokeA'), 1], [B('strokeB'), 1], [B('strokeB') + 1, 0]),
  stroke: track([[B('strokeA') + .1, 0], [A('strokeB') - .5, 1]], x => x),
  strokeBack: seq([A('strokeB') - .5, 0], [A('strokeB'), 1]),
  doorOpen: seq([B('strokeB') + .4, 0], [A('filmQ'), 1], [B('filmQ') + 1.4, 1], [A('cry'), 0]),
  // the emulsion. One moving front does the developing, near and far
  grainA: seq([B('filmQ') + .9, 0], [A('cry') - .1, 1], [B('neg'), 1], [B('neg') + 1, 0]),
  grainCell: ltrack([[I('cry') + .8, 34], [A('cry'), 96], [A('roads'), 96], [B('roads2'), 96], [B('roads2') + .6, 96], [A('spread') + .1, 4.6], [B('neg'), 4.4]]),
  speck: track([[B('cry'), 0], [A('lat'), 1]], x => x),
  sub: seq([B('lat') + .1, 0], [A('devIn') - .2, 1], [B('silver'), 1], [B('silver') + .9, 0]),
  front: track([[B('devIn'), -6], [B('silver') - .1, 20]], x => x),
  roadMix: track([[B('roads') + .1, 0], [A('roads2'), 1]], x => x),
  roadDiv: seq([B('silver') + .5, 1.2], [A('roads') - .1, .5], [B('roads2'), .5], [B('roads2') + 1.1, 1.2]),
  wave: track([[B('roads2') + 1.1, 0], [A('spread'), 190]], x => x),
  grainCx: seq([B('roads2') + 1.1, 0], [A('spread'), 1]),
  print: track([[B('neg') + 1.6, 0], [A('end') - .1, 1]], x => x),
};
// who is in focus during the exploded tour: others turn to ghosts
const FOCUS_STEPS = [['uLens', ['lens']], ['uBox', ['box']], ['uPrism', ['prism', 'top']], ['uShutter', ['shutter']], ['uFilm', ['film']]];

// labels drawn on the overlay. s: the hold they belong to
const LABELS = [
  { s: 'rings', w: [0, 2.72, 4.9], dx: -130, dy: -130, text: 'Aperture ring' },
  { s: 'rings', w: [2.4, -1.6, 3.9], dx: 50, dy: 120, text: 'Focus ring' },
  { s: 'rings', w: [1.2, 3.1, 2.3], dx: 90, dy: -120, text: 'Shutter speed ring' },
  { s: 'deck', w: [-5.8, 3.85, -1], dx: -30, dy: -130, text: 'Film advance' },
  { s: 'deck', w: [-4.45, 3.7, -.25], dx: 10, dy: -160, text: 'Release' },
  { s: 'deck', w: [-2.8, 3.7, -.72], dx: 60, dy: -200, text: 'ASA' },
  { s: 'deck', w: [2.7, 3.7, -.62], dx: 10, dy: -150, text: 'Meter switch' },
  { s: 'deck', w: [4.6, 3.9, -.75], dx: 70, dy: -120, text: 'Rewind' },
  { s: 'cell', w: [-5.6, -4.6, -.8], dx: 140, dy: 120, text: 'PX625 mercury cell' },
  { s: 'cell', w: [-7.3, -4.5, .1], dx: -120, dy: 150, text: 'Coin-slot cap' },
  { s: 'uBox', part: 'box', w: [-1.86, -.2, -1.1], dx: -130, dy: 150, text: 'Air damper' },
  { s: 'uPrism', part: 'prism', w: [.92, 3.86, -1.74], dx: 210, dy: 80, text: 'CdS cell' },
  { s: 'uShutter', part: 'shutter', w: [-2.95, 1.2, -1.45], dx: -130, dy: -140, text: 'Curtain drum' },
  { s: 'section', w: [0, -.3, .4], dx: 60, dy: 170, text: 'Mirror, 45°' },
  { s: 'section', w: [0, SCREEN_Y, -1], dx: -40, dy: -260, text: 'Focusing screen' },
  { s: 'section', w: [0, 4.2, 1.1], dx: -130, dy: -90, text: 'Pentaprism' },
  { s: 'mirrorUp', w: [0, 0, FILM_Z], dx: 110, dy: 170, text: 'Film' },
  { s: 'mirrorUp', w: [0, 1.06, .6], dx: -120, dy: -190, text: 'Mirror up' },
  { s: 'needle', w: [-.92, 3.86, -1.74], dx: 70, dy: -60, text: 'CdS cell' },
  { s: 'needle', w: [-5.6, -2.85, -.8], dx: 100, dy: 40, text: '1.35 V cell' },
  { s: 'needle', w: [-2.75, 2.72, .3], dx: -120, dy: -90, text: 'Meter' },
  { s: 'expAp', w: [-1.75, 2.9, 1.6], dx: -110, dy: -100, text: 'Cord to meter' },
  { s: 'expSh', w: [-1.75, 2.9, 1.6], dx: -110, dy: -100, text: 'Same cord' },
  { s: 'expSh', w: [0, 3.31, 2.3], dx: -60, dy: 240, text: 'Speed ring' },
  { s: 'spSlow', part: 'gears', w: [2, -2.25, 2.3], dx: 170, dy: 120, text: 'Anchor' },
  { s: 'spSlow', part: 'gears', w: [2, -2.25, 1.2], dx: 190, dy: -100, text: 'Escape wheel' },
  { s: 'strokeB', w: [-4.07, -1.4, -1.65], dx: 30, dy: 130, text: 'Sprocket' },
  { s: 'strokeB', w: [-5.7, 1.2, -.9], dx: -30, dy: -240, text: 'Take-up spool' },
  { s: 'strokeB', w: [2.95, -1.2, -1.45], dx: -110, dy: 150, text: 'Curtains re-cocked' },
  { s: 'strokeB', w: [-6.75, 3.42, -.75], dx: -20, dy: -110, text: 'Counter' },
];
LABELS.forEach(l => { l.t = [A(l.s) - .35, B(l.s) + .35]; });

// the circle that says "focused here", in scene pixels
const FOCUS_MARKS = [
  { s: 'fNear', at: 'flower', r: 112, text: 'In focus · 1 m' },
  { s: 'fFar', at: 'house', r: 98, text: 'In focus · 60 m' },
];
