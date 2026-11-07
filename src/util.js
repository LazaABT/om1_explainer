// ---------- small helpers ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, x) => { x = clamp((x - a) / (b - a)); return x * x * (3 - 2 * x); };
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const win = (x, a, b, f = .4) => ss(a, a + f, x) * (1 - ss(b - f, b, x)); // 0 > 1 > 0 window

// piecewise track: keys = [[t, value], ...], eased between neighbours
function track(keys, ease = eio) {
  return t => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) {
        const a = keys[i - 1], b = keys[i];
        return lerp(a[1], b[1], ease((t - a[0]) / (b[0] - a[0] || 1)));
      }
    }
    return keys[keys.length - 1][1];
  };
}
// log-space track, for f-numbers, distances, shutter speeds
function ltrack(keys, ease = eio) {
  const f = track(keys.map(k => [k[0], Math.log(k[1])]), ease);
  return t => Math.exp(f(t));
}

const COL = {
  paper: 0xEDE9E1, ink: 0x161514, night: 0x0E0E0D, vermilion: 0xE5401A,
  chrome: 0xDAD7D0, chrome2: 0xB9B6AF, leather: 0x23211F, metal: 0x3A3835,
  glass: 0xA9C7CC, white: 0xF7F4EE,
};
const hex = c => '#' + c.toString(16).padStart(6, '0');
function mixHex(a, b, t) {
  const r = lerp(a >> 16 & 255, b >> 16 & 255, t), g = lerp(a >> 8 & 255, b >> 8 & 255, t), l = lerp(a & 255, b & 255, t);
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(l);
}

// ---------- optics: every view reads these ----------
const F_MM = 50;
const OPT = {
  // image distance (mm) for a lens of focal length f focused at d metres
  imageDist: (fmm, dm) => 1 / (1 / fmm - 1 / (dm * 1000)),
  // blur disc on film (mm) for a subject at d metres while focused at s metres
  blur(fmm, N, s, d) {
    const A = fmm / N, S = s * 1000, D = d * 1000;
    return A * Math.abs(D - S) / D * fmm / Math.max(1, S - fmm);
  },
  ev: (N, speed) => Math.log2(N * N * speed), // speed is 1/t
  // near and far limits of acceptable sharpness, metres
  dof(fmm, N, s, coc = .03) {
    const Hf = fmm * fmm / (N * coc) + fmm, S = s * 1000;
    return [S * (Hf - fmm) / (Hf + S - 2 * fmm) / 1000, Hf > S ? S * (Hf - fmm) / (Hf - S) / 1000 : Infinity];
  },
};
