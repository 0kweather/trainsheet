// Luxembourg's trains (scripts/railroads/cfl.py, railroad "cfl"): CFL's
// Stadler KISS (2300), Alstom Coradia Stream High Capacity (2400 and 2450),
// Coradia Duplex (2200, TER 2N NG) and the TRAXX (4000) with the Bombardier
// double-deck coaches ("Dosto"), and the SNCF units on the TER Grand Est to
// Metz. The feed names no vehicle, so each train is drawn as what usually
// runs on its line, labeled as typical. Trainsheet's own side views from
// published dimensions and photographs (Wikimedia Commons, 2022-2026), at
// the shared scale (js/carart.js), each in the paint it carries in 2026; the
// lettering and marks are drawn here (no logo files).

import { C, rect, circle, path, line, lines, poly, truck, pantograph, slats, win, coupledEnd } from "../carart.js?v=dev";
import { newId } from "../carmodels.js?v=dev";
import { mark, euroLoco } from "./czechia.cars.js?v=dev";
import { hvac, roofCover, lamp, RED_LAMP, wiper, panGear } from "./digitraffic.cars.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const FT = 3.2808;
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
const STROKE = 'stroke-linejoin="round" stroke-linecap="round"';
const stroke = (pts, color, w) => `<path d="${pts.map(([x, y], i) => `${i ? "L" : "M"}${n(x)} ${n(y)}`).join("")}" fill="none" stroke="${color}" stroke-width="${w}" ${STROKE}/>`;
const clip = (d, inner) => {
  const id = newId();
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`;
};
// Text in a mark() group (y down, centered at its origin).
const txt = (x, y, h, text, fill, { weight = 700, family = SANS, anchor = "middle", spacing = 0, style = "" } = {}) =>
  `<text x="${n(x)}" y="${n(y + h * 0.36)}" font-size="${n(h)}" text-anchor="${anchor}" font-weight="${weight}" letter-spacing="${spacing}" font-family="${family}" fill="${fill}"${style ? ` font-style="${style}"` : ""}>${text}</text>`;
const letters = (c, x, y, h, text, fill, o) => mark(c, x, y, txt(0, 0, h, text, fill, o));

// ---------- A section of a car ----------
// o: outline (points, y up, poly() style), base (the body color), paint(c,
// L) (clipped to the body), wins ([x0, x1, y0, y1, r]), doors (drawn by
// o.door), trucks ([x, wb, d(in)]), under(c, L) (behind the body), extra(c,
// L) (on top), gangway [floor, top] for the bellows at a coupled end.
function sec(c, o) {
  const L = c.L, d = poly(o.outline);
  let s = (o.trucks || []).map(([x, wb, dia, kind = "car"]) => truck(x, { wb, d: dia, kind, top: o.truckTop ?? 3.0 })).join("");
  if (o.under) s += o.under(c, L);
  let liv = o.paint(c, L);
  liv += (o.wins || []).map(([x0, x1, y0, y1, r = 0.42]) => win(x0, y0, x1 - x0, y1 - y0, r)).join("");
  if (o.over) liv += o.over(c, L);
  s += path(d, o.base) + clip(d, liv);
  if (o.door) s += (o.doors || []).map((dr) => o.door(c, dr)).join("");
  if (o.extra) s += o.extra(c, L);
  s += path(d, "none", 0.8);
  const [floor, top] = o.gangway || [1.6, 12.6];
  if (c.coupledL && !o.cab) s += coupledEnd(0, -1, { floor, top, coupler: 2.2 });
  if (c.coupledR) s += coupledEnd(L, 1, { floor, top, coupler: 2.2 });
  return s;
}
// An outline: from the nose's foot (or x0 at low) along the bottom (the
// steps given), up the right end to the roof, back along the roof (a well
// let into it: [a, b, y]) and down the nose (its points from the roof down).
function box(L, { roof, low, r = 0.5, nose = null, bottom = null, x0 = 0.3, x1 = L - 0.3, wells = [] }) {
  const pts = [nose ? nose[nose.length - 1] : [x0, low]];
  if (bottom) pts.push(...bottom);
  pts.push([x1, low], [x1, roof - r], ["q", x1, roof, x1 - r, roof]);
  for (const [a, b, y] of [...wells].sort((p, q) => q[0] - p[0])) pts.push([b, roof], [b, y + 0.4], ["q", b, y, b - 0.4, y], [a + 0.4, y], ["q", a, y, a, y + 0.4], [a, roof]);
  if (nose) pts.push(...nose.slice(0, -1));
  else pts.push([x0 + r, roof], ["q", x0, roof, x0, roof - r]);
  return pts;
}
// The automatic coupler and the deflector under a nose at the left.
function coupler(c, { x = 1.0, y = 3.1, defl = [1.2, 8.6, 1.9], color = "#2a2d31" } = {}) {
  if (c.coupledL) return "";
  let s = "";
  if (defl) s += path(poly([[defl[0] + 0.4, defl[2]], [defl[1], defl[2]], [defl[1] + 0.3, 0.85], [defl[0] + 1.6, 0.75]]), color);
  s += rect(0.3, y - 0.3, x + 0.4, 0.6, "currentColor", 0, 'opacity="0.9"') + rect(0, y - 0.7, 0.5, 1.4, "currentColor", 0, 'rx="0.15"') +
    rect(0.12, y + 0.75, 0.45, 0.35, C.steelDark, 0.3);
  return s;
}

// ===================== CFL's paint and marks =====================
// From photographs (2024-2026): the KISS silver-gray, CFL red (a red band
// along the roof's edge that runs down round the cab to the red along the
// bottom), the windows in one dark gray band on each deck, red doors, the
// bicycle area's doors in a green panel; the Coradias white, red below and
// along the roof edge, the cabs red with a black mask. Colors sampled from
// those photographs.
const CFL = { red: "#d0112b", redDark: "#b30f26", silver: "#d9dbdc", silverLow: "#c9cccd", roof: "#b5b9bc", band: "#5f6468", green: "#2aa84a", white: "#f3f3f1", yellow: "#f2b51c", black: "#17191b" };
// CFL's logo: "CFL" leaning, its strokes square-cut, the C's top bar over
// the F's short arm; on the units still in the 2000s paint (the 2200s)
// followed by the rails mark: a leaning block cut by two white lines that
// step down from left to right, three rails running out of it either side
// (photographs of 2305 in 2015, 2223 in 2023). The units painted since
// 2019 (KISS, Coradia, the TRAXX and the coaches as repainted, 2024-2026)
// carry the letters alone. x the logo's middle, y its middle, h its
// height; gap: the color showing between the rails.
export function cflLogo(c, x, y, h, fill = CFL.red, { rails = false, gap = CFL.silver } = {}) {
  const k = h, sl = 0.3; // the lean: x moves 0.3 h per h up
  const w = rails ? 4.45 : 2.42;
  const P = (pts) => "M" + pts.map(([a, b]) => `${n((a + (1 - b) * sl - w / 2) * k)} ${n((b - 0.5) * k)}`).join("L") + "Z";
  const t = 0.22; // stroke
  const C1 = P([[0.13, 0], [1.38, 0], [1.38 - 0.04, t], [0.2 + 0.05, t], [0.2, 0.25], [0.2, 1 - t], [0.66, 1 - t], [0.62, 1], [0.1, 1], [0, 0.9], [0, 0.12]]);
  const F = P([[0.86, 0.3], [1.34, 0.3], [1.3, 0.3 + t], [0.86 + t, 0.3 + t], [0.86 + t, 0.96], [0.86, 0.96], [0.86, 0.38]]);
  const L1 = P([[1.5, 0], [1.5 + t, 0], [1.5 + t, 1 - t], [2.12, 1 - t], [2.06, 1], [1.5, 1]]);
  let inner = `<path d="${C1}${F}${L1}" fill="${fill}"/>`;
  if (rails) {
    // The mark, from u = 0 (2.45 h in) to 1.85 h: the block, the two white
    // lines stepping down across it between 0.55 and 0.95, the rails.
    const m = 2.45, step = (y0, y1) => [[m - 0.05, y0], [m + 0.55, y0], [m + 0.95, y1], [m + 1.9, y1]];
    const line = (pts, col, sw) => `<path d="M${pts.map(([a, b]) => `${n((a + (1 - b) * sl - w / 2) * k)} ${n((b - 0.5) * k)}`).join("L")}" fill="none" stroke="${col}" stroke-width="${n(sw * k)}"/>`;
    inner += `<path d="${P([[m + 0.22, 0], [m + 1.85, 0], [m + 1.72, 1], [m + 0.22, 1]])}" fill="${fill}"/>` +
      line(step(0.275, 0.615), gap, 0.055) + line(step(0.385, 0.725), gap, 0.055) +
      line([[m - 0.02, 0.22], [m + 0.22, 0.22]], fill, 0.06) + line([[m - 0.02, 0.33], [m + 0.22, 0.33]], fill, 0.06) + line([[m - 0.02, 0.44], [m + 0.22, 0.44]], fill, 0.06) +
      line([[m + 1.8, 0.56], [m + 1.98, 0.56]], fill, 0.06) + line([[m + 1.76, 0.67], [m + 1.98, 0.67]], fill, 0.06) + line([[m + 1.74, 0.78], [m + 1.98, 0.78]], fill, 0.06);
  }
  return mark(c, x, y, inner);
}
// The class sign by a door: a tall white panel, the class's numeral(s)
// big in black, one over the other, and the pictograms (blue squares, two
// a row) under them; old: the 2000s signs (the 2200s), a tall green panel
// for second class, red for first, the numeral in white.
function classSign(c, x, y, k, { h = 2.2, w = 0.95, old = false, picto = 2, green = false } = {}) {
  const cls = String(k).split("");
  if (old) {
    const ph = h / cls.length;
    return cls.map((d, i) => rect(x - w / 2, y + h / 2 - ph * (i + 1), w, ph, d === "1" ? "#c4122c" : "#2f9a6a", 0, 'rx="0.05"') +
      letters(c, x, y + h / 2 - ph * (i + 0.22), Math.min(ph * 0.3, w * 1.05), d, "#ffffff", { weight: 600 })).join("");
  }
  // On the KISS's green panels the sign is the panel's green, outlined and
  // lettered in white; elsewhere white, lettered in black.
  const ink = green ? "#ffffff" : "#111214", icon = green ? "#ffffff" : "#1f2f5c";
  let s = rect(x - w / 2, y - h / 2, w, h, green ? CFL.green : "#f7f7f5", 0, `rx="0.06" stroke="${green ? "#ffffff" : "#8d9297"}" stroke-width="${green ? 0.07 : 0.04}"`);
  const pich = picto * (w * 0.36 + 0.06) + 0.12;
  const dh = Math.min(w * 1.4, (h - pich - 0.2) / cls.length);
  cls.forEach((d, i) => {
    const cy = y + h / 2 - 0.1 - dh * (i + 0.5);
    s += letters(c, x, cy, dh * 0.92, d, ink, { weight: 500 }) + rect(x - w * 0.36, cy - dh / 2 - 0.02, w * 0.72, 0.035, ink);
  });
  // The pictograms, two a row under the numerals.
  const q = w * 0.36, top = y + h / 2 - 0.1 - dh * cls.length - 0.1;
  for (let r = 0; r < picto; r++) for (const dx of [-0.4, 0.04]) {
    const px = x + dx * w, py = top - (r + 1) * (q + 0.06);
    s += rect(px, py, q, q, icon, 0, 'rx="0.03"') + rect(px + q * 0.3, py + q * 0.2, q * 0.4, q * 0.55, green ? CFL.green : "#f7f7f5", 0, 'rx="0.05"');
  }
  return s;
}
// A bicycle (the pictogram), white lines, centered at x, y, h tall.
function bike(x, y, h, color = "#ffffff") {
  const r = h * 0.3, lw = h * 0.085;
  const a = x - h * 0.55, b = x + h * 0.55, yw = y - h / 2 + r;
  const pedal = [x - h * 0.02, yw], seat = [x - h * 0.2, y + h * 0.28], head = [x + h * 0.36, y + h * 0.3];
  const sw = `fill="none" stroke="${color}" stroke-width="${n(lw)}" ${STROKE}`;
  return `<circle cx="${n(a)}" cy="${n(yw)}" r="${n(r)}" ${sw}/><circle cx="${n(b)}" cy="${n(yw)}" r="${n(r)}" ${sw}/>` +
    `<path d="M${n(a)} ${n(yw)}L${n(pedal[0])} ${n(pedal[1])}L${n(head[0] - h * 0.04)} ${n(y + h * 0.14)}L${n(seat[0] + h * 0.04)} ${n(y + h * 0.14)}L${n(a)} ${n(yw)}` +
    `M${n(pedal[0])} ${n(pedal[1])}L${n(seat[0])} ${n(seat[1])}M${n(seat[0] - h * 0.12)} ${n(seat[1])}L${n(seat[0] + h * 0.1)} ${n(seat[1])}` +
    `M${n(b)} ${n(yw)}L${n(head[0])} ${n(head[1])}L${n(head[0] - h * 0.12)} ${n(head[1] + h * 0.02)}" ${sw}/>`;
}
// A double plug door: two leaves in the door's color, a tall window in
// each, a dark seam between them.
function plugDoor(x, w, y0, y1, { fill = CFL.red, glass = [y0 + (y1 - y0) * 0.36, y1 - (y1 - y0) * 0.1], gw = 0.34, edge = "#3a1016" } = {}) {
  const m = x + w / 2, lw = w / 2;
  let s = rect(x, y0, w, y1 - y0, fill, 0, `rx="0.2" stroke="${edge}" stroke-width="0.5" vector-effect="non-scaling-stroke"`) + line(m, y0 + 0.05, m, y1 - 0.05, "#2a0c10", 0.7);
  for (const a of [x, m]) {
    const gx = a + lw * (1 - gw * 2) / 2 + (a === x ? 0.05 : -0.05);
    s += rect(gx, glass[0], lw * gw * 2, glass[1] - glass[0], C.glass, 0, `rx="0.3" stroke="#1b1d20" stroke-width="0.5" vector-effect="non-scaling-stroke"`) +
      rect(gx + 0.1, glass[0] + (glass[1] - glass[0]) * 0.62, lw * gw * 2 - 0.2, (glass[1] - glass[0]) * 0.3, C.glassLight, 0, 'rx="0.15"');
  }
  return s;
}

// ===================== KISS (CFL 2300) =====================
// Stadler's KISS for CFL (2014-2018 and 2021; 2301-2321): three cars, 79.84
// m, 4.63 m tall, two trucks a car (the end cars' motor trucks under the
// cabs), multi-system for Trier and Koblenz. Each car's double deck between
// two doors a side, an intermediate level over each truck. From photographs
// (2319 on the Pulvermühle viaduct 2022, 2316 at Oetrange, 2318 at Mertert,
// 2321 at Betzdorf, 2313 at Luxembourg, 2025-2026), measured on the
// broadside one: the end cars 26.85 m, the middle car 26.14 m. The paint
// since the 2020s: silver-gray, the red roof-edge band running down round
// the nose into the red along the bottom, each deck's windows in a dark
// gray band, red doors; the first door of every car (the bicycle area) in a
// green panel with a bicycle; first class (29 seats) upstairs in the middle
// car, a yellow line under its window band; "CFL" and the unit's number in
// red on the cab section.
const KZ = { roof: 15.15, end: 88.1, mid: 85.8, upper: [11.0, 13.1], lower: [3.65, 6.3] };
const KZ_NOSE = [[9.6, 15.15], [8.0, 14.9], [6.7, 14.35], [5.3, 13.4], [4.0, 12.2], [3.0, 10.8], [2.4, 9.3], [1.9, 7.6], [1.45, 5.6], [1.05, 3.6], [1.1, 2.5], [1.6, 2.0]];
// Per car: the double deck's span [x0, x1] (upper band, lower band), the
// windows (upper deck, lower deck), the doors' left edges, the end
// sections' windows [x0, x1, y0, y1], the green panel, the class signs.
const KZ_LAYOUT = {
  cab: {
    upper: [27.7, 65.2], lower: [31.9, 60.9],
    up: [[28.0, 30.0], [33.1, 37.2], [38.7, 42.8], [44.4, 48.4], [50.1, 54.1], [55.7, 59.7], [62.8, 64.8]],
    lo: [[33.2, 37.2], [38.7, 42.8], [44.4, 48.4], [50.1, 54.1], [55.7, 59.7]],
    doors: [26.3, 61.0], ends: [[15.2, 19.0, 6.7, 9.25], [71.5, 75.0, 6.7, 9.25]], green: [23.9, 42.5], signs: [[25.4, "2"], [67.5, "2"]], loSigns: [[37.95, "2"], [54.9, "2"]],
  },
  mid: {
    upper: [21.5, 64.3], lower: [25.8, 60.0],
    up: [[21.9, 23.9], [26.7, 30.6], [32.3, 36.2], [37.9, 41.8], [43.5, 47.4], [49.1, 53.0], [54.7, 58.6], [61.9, 63.9]],
    lo: [[26.8, 30.7], [32.3, 36.2], [37.8, 41.7], [43.7, 47.6], [49.1, 52.7]],
    doors: [20.2, 60.3], ends: [[3.1, 7.1, 6.7, 9.25], [8.8, 12.8, 6.7, 9.25], [73.0, 77.0, 6.7, 9.25], [78.7, 82.7, 6.7, 9.25]], green: [17.7, 36.6], first: true,
    signs: [[19.1, "12"], [66.7, "12"]], loSigns: [[31.55, "2"], [53.5, "2"]],
  },
};
function kissPaint(c, L, cab, lay) {
  // The silver body; the roof gray above the red band; the red along the
  // bottom; the windows' bands.
  let s = rect(-1, -1, L + 2, 20, CFL.silver) + rect(-1, 14.0, L + 2, 3, CFL.roof) + rect(-1, 12.2, L + 2, 1.8, CFL.red) + rect(-1, -1, L + 2, 3.3, CFL.red);
  // The green panel round the bicycle area's door.
  const [g0, g1] = lay.green;
  s += rect(g0, 2.3, g1 - g0, 7.6, CFL.green);
  // The light strip under the lower band, over the red.
  s += rect(lay.lower[0], 2.6, lay.lower[1] - lay.lower[0], 0.85, "#e6e7e7");
  s += rect(lay.upper[0], 10.6, lay.upper[1] - lay.upper[0], 2.9, CFL.band, 0, 'rx="0.5"') + rect(lay.lower[0], 3.4, lay.lower[1] - lay.lower[0], 3.2, CFL.band, 0, 'rx="0.35"');
  if (lay.first) s += rect(lay.upper[0] + 0.3, 10.3, lay.upper[1] - lay.upper[0] - 0.6, 0.26, CFL.yellow);
  if (cab) {
    // The red band down the nose's edge into the red skirt; the cab's
    // dark windshield and side window.
    s += path(poly([[-1, 15.5], [10.0, 15.5], [11.6, 14.0], [10.8, 14.0], [10.8, 12.2], [8.6, 12.2], [6.6, 11.6], [5.0, 10.6], [3.9, 9.2], [3.2, 7.4], [2.9, 5.6], [2.8, 3.8], [2.9, 3.0], [3.1, 2.6], [-1, 2.6]]), CFL.red);
    s += path(poly([[2.0, 7.8], [2.5, 9.0], [3.3, 9.9], [4.5, 10.5], [9.6, 10.5], ["q", 10.2, 10.5, 10.2, 9.9], [10.2, 7.8], ["q", 10.2, 7.2, 9.6, 7.2], [2.7, 7.2], ["q", 1.9, 7.25, 2.0, 7.8]]), "#1a1d20");
    s += path(poly([[2.7, 7.6], [3.1, 8.8], [3.9, 9.7], [5.0, 10.1], [6.7, 10.1], [6.7, 7.6]]), C.glass) + rect(7.3, 7.6, 2.45, 2.5, C.glass, 0, 'rx="0.3"') + rect(7.4, 8.9, 2.25, 0.95, C.glassLight, 0, 'rx="0.2"');
    // The hatch over the equipment behind the cab.
    s += rect(10.8, 4.8, 3.0, 4.2, "none", 0, 'rx="0.35" stroke="#9a9ea2" stroke-width="0.09"') + slats(11.7, 8.1, 1.2, 0.5, 0.2, "rgba(60,64,68,0.5)");
  }
  return s;
}
function kissCar(c, kind) {
  const L = c.L, cab = kind === "cab", lay = KZ_LAYOUT[cab ? "cab" : "mid"];
  const bottom = cab ? [[9.6, 2.0], [10.4, 3.1], [21.2, 3.1], ["q", 22.2, 3.1, 22.7, 2.2], [23.2, 1.05], [69.2, 1.05], [70.0, 2.4], [71.0, 3.1]]
    : [[13.8, 3.1], [14.6, 1.05], [L - 14.6, 1.05], [L - 13.8, 3.1]];
  const outline = box(L, { roof: KZ.roof, low: 3.1, nose: cab ? KZ_NOSE : null, bottom, wells: cab ? [[L - 12.5, L - 4.0, 14.55]] : [] });
  const doors = lay.doors.map((x) => ({ x, w: 5.4, y0: 1.2, y1: 9.0 }));
  return sec(c, {
    base: CFL.silver, cab, truckTop: 3.1, outline,
    trucks: cab ? [[15.6, 8.7, 36], [L - 11.1, 8.7, 36]] : [[10.8, 8.7, 36], [L - 10.8, 8.7, 36]],
    paint: (cc) => kissPaint(cc, L, cab, lay),
    wins: [...lay.up.map(([a, b]) => [a, b, KZ.upper[0], KZ.upper[1], 0.55]), ...lay.lo.map(([a, b]) => [a, b, KZ.lower[0], KZ.lower[1], 0.4]),
      ...lay.ends.map(([a, b, y0, y1]) => [a, b, y0, y1, 0.4])],
    over: (cc) => {
      let s = bike((lay.green[1] + lay.doors[0] + 5.4) / 2 + 0.2, 8.0, 1.9) + lay.signs.map(([x, k], i) => classSign(cc, x, 6.95 - (String(k).length - 1) * 0.45, k, { h: 2.3 + (String(k).length - 1) * 0.9, w: 0.9, green: i === 0 })).join("") +
        lay.loSigns.map(([x, k]) => classSign(cc, x, 4.75, k, { h: 2.6, w: 0.85 })).join("");
      if (cab) s += letters(cc, 7.45, 5.0, 0.8, "2316", CFL.red, { weight: 500 }) + cflLogo(cc, 17.1, 5.1, 1.0);
      else s += cflLogo(cc, 10.9, 5.1, 1.0);
      return s;
    },
    doors, door: (cc, d) => plugDoor(d.x, d.w, d.y0, d.y1) + (d.x === lay.doors[0] ? bike(d.x + d.w * 0.75, 2.1, 1.0) : ""),
    extra: (cc) => {
      let s = "";
      // Roof: the cab section's air conditioning and the brake resistor; the
      // pantograph over the inner truck of each end car (the leading one's
      // raised); the air conditioning over the middle car's ends.
      if (cab) {
        s += roofCover(12.0, KZ.roof, 5.0, 0.3, "#9da2a6", 1) + hvac(19.0, KZ.roof, 6.0, 0.5, "#a9adb1");
        s += pantograph(L - 8.2, 14.55, { up: !!cc.lead, facing: -1 }) + panGear(L - 8.2, 14.55, -1);
        s += coupler(cc, { defl: [1.4, 9.6, 2.0] }) + lamp(1.15, 4.0, 0.32, 0.45) + lamp(1.05, 3.2, 0.25, 0.3, RED_LAMP) + wiper(3.6, 9.4, 5.6, 11.5);
      } else s += hvac(3.0, KZ.roof, 8.5, 0.45, "#a9adb1") + hvac(L - 11.5, KZ.roof, 8.5, 0.45, "#a9adb1");
      return s;
    },
    gangway: [3.4, 12.8],
  });
}

// ===================== Coradia Stream High Capacity (CFL 2400 and 2450) =====================
// Alstom's double-deck Coradia for CFL (2024-2026; 2401-2422 three cars,
// 82 m; 2451-2462 six cars, 160 m): double-deck cab cars, each on a
// trailer truck under the cab and a motor truck under its inner end, and a
// single-deck motor car between them with the roof full of the traction
// gear and the pantograph; the six-car units are two three-car halves with
// double-deck cars in place of the inner cabs. CFL publishes no car
// lengths: from photographs (2410 at Zwickau 2025, 2409 at Dudelange-Usines,
// 2410 and 2414 at Walferdange, 2411 at Luxembourg, 2454 at Luxembourg
// 2026) corrected for perspective and fitted to 82 m: the cab cars 29 m,
// the middle car 24 m, the six-car units' inner double-deck cars 27 m. The
// paint: white, CFL red along the bottom and along the top of the side
// under a white roof, the windows in black bands, red doors; the cab red
// under a black mask that runs back past the crew door and fades into the
// white, a white sweep under it carrying "CFL"; the unit's number in white
// on the nose and on the side; first class upstairs in one cab car, its
// window band ringed in yellow; the middle car's bicycle area in green.
const CM = { roof: 15.0, wall: 11.3, cab: 95.1, mid: 78.7, dd: 88.6, midRoof: 11.6, upper: [9.5, 12.3], lower: [3.5, 6.6] };
const CM_NOSE = [[10.8, 15.0], [9.2, 14.75], [7.4, 13.9], [5.6, 12.4], [4.0, 10.6], [2.7, 8.8], [1.6, 7.3], [0.8, 6.0], [0.45, 4.6], [0.4, 3.0], [0.8, 1.6]];
// The double-deck part of a cab car (or of a 2450's inner car), from x0:
// the door, the double deck's two window bands, the second door, the end
// section's windows.
const CM_DD = { door1: 29.2, dd: [37.0, 68.6], up: [[37.8, 43.9], [45.6, 52.2], [53.6, 60.1], [61.6, 68.0]], door2: 71.5, ends: [[79.8, 85.6], [86.6, 92.3]] };
function coradiaPaint(c, L, { cab, first, ox = 0 }) {
  const dd = CM_DD.dd.map((x) => x + ox);
  let s = rect(-1, -1, L + 2, 25, CFL.white);
  // The white roof over the red top of the side; the red bottom.
  s += rect(-1, 10.1, L + 2, 1.2, CFL.red) + rect(-1, 11.3, L + 2, 6, "#eceeee") + rect(-1, -1, L + 2, 4.3, CFL.red);
  // The window bands: upstairs rising into the roof's curve, downstairs
  // over the red.
  if (first) s += rect(dd[0] - 0.45, 8.75, dd[1] - dd[0] + 0.9, 4.3, CFL.yellow, 0, 'rx="1.1"');
  s += rect(dd[0] - 0.1, 9.1, dd[1] - dd[0] + 0.2, 3.6, CFL.black, 0, 'rx="0.9"') + rect(dd[0] - 0.1, 3.2, dd[1] - dd[0] + 0.2, 3.75, CFL.black, 0, 'rx="0.7"');
  // The end section's windows in black.
  for (const [a, b] of CM_DD.ends) s += rect(a + ox - 0.3, 6.1, b - a + 0.6, 3.4, CFL.black, 0, 'rx="0.6"');
  if (cab) {
    // The cab red from the nose back past the crew door; behind it a black
    // panel at the window's height fading into the white, the red bottom
    // rising toward the cab under a white sweep (with "CFL").
    s += path(poly([[-1, 0], [-1, 15.4], [18.0, 15.4], [18.0, 11.3], [17.2, 10.1], [17.2, 6.9], [18.9, 6.9], ["q", 19.6, 4.0, 22.6, 3.6], [30.4, 3.6], [30.4, 0]]), CFL.red);
    const [gd, gf] = grad(17.2, 28.5, [[0, CFL.black], [0.45, CFL.black], [1, "rgba(0,0,0,0)"]]);
    s += gd + path(poly([[17.2, 6.9], ["q", 22.0, 6.75, 28.5, 6.6], [28.5, 9.8], [17.2, 9.8]]), gf);
    // The black mask round the windshield, back along the cab's side to
    // the crew door.
    s += path(poly([[1.5, 6.9], [2.6, 8.7], [3.9, 10.5], [5.5, 12.3], [7.2, 13.7], [9.0, 14.45], [11.0, 14.6], [12.9, 14.6], [12.9, 7.3], [9.5, 7.0]]), CFL.black);
    s += path(poly([[2.6, 7.9], [3.9, 9.9], [5.6, 11.9], [7.4, 13.3], [9.1, 14.0], [10.6, 14.15], [11.9, 14.15], [11.9, 11.5], [8.2, 9.6], ["q", 5.0, 7.9, 2.6, 7.9]]), C.glass) +
      path(poly([[6.4, 12.6], [7.4, 13.3], [9.1, 14.0], [10.6, 14.15], [11.9, 14.15], [11.9, 12.6]]), C.glassLight);
    // The headlight cluster, black, low on the nose.
    s += path(poly([[0.35, 5.0], [0.8, 6.2], [4.2, 6.5], ["q", 5.3, 6.4, 5.1, 5.6], [4.4, 4.95], ["q", 2.0, 4.6, 0.35, 5.0]]), CFL.black) + circle(3.3, 5.7, 0.45, "#d9dcdf") + circle(3.3, 5.7, 0.22, "#f5f3e6");
    // The side's destination display, in the black.
    s += rect(22.6, 8.0, 2.8, 0.55, "#2a2f33", 0, 'rx="0.25"');
  }
  return s;
}
// A vertical-run gradient across x (left to right): [defs, fill].
function grad(x0, x1, stops) {
  const id = newId();
  return [`<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${n(x0)}" y1="0" x2="${n(x1)}" y2="0">` +
    stops.map(([o, col]) => `<stop offset="${o}" stop-color="${col.startsWith("rgba") ? "#17191b" : col}"${col.startsWith("rgba") ? ' stop-opacity="0"' : ""}/>`).join("") + `</linearGradient></defs>`, `url(#${id})`];
}
// A double-deck car: "cab" (with first class: "cabA"), or "inner" (the
// six-car units' double-deck cars without a cab).
function coradiaDD(c, kind) {
  const L = c.L, cab = kind.startsWith("cab"), first = kind === "cabA";
  const ox = cab ? 0 : -6.5;
  const d1 = CM_DD.door1 + ox, d2 = CM_DD.door2 + ox, dd = CM_DD.dd.map((x) => x + ox);
  const bottom = [[cab ? 10.2 : 0.3, 3.0], [24.6 + ox, 3.0], [25.6 + ox, 1.0], [dd[1] + 2.6, 1.0], [dd[1] + 3.6, 3.0]];
  const outline = cab ? box(L, { roof: CM.roof, low: 3.0, nose: CM_NOSE, bottom: [[0.8, 1.6], [9.6, 1.6], ...bottom] })
    : box(L, { roof: CM.roof, low: 3.0, bottom: bottom.slice(1), r: 0.9 });
  return sec(c, {
    base: CFL.white, cab, truckTop: 3.0, outline,
    trucks: [[cab ? 18.7 : 10.0, 8.5, 33], [L - 13.4, 8.5, 33]],
    paint: (cc) => coradiaPaint(cc, L, { cab, first, ox }) + (!cab ? rect(3.0, 6.1, 10.0, 3.4, CFL.black, 0, 'rx="0.6"') : ""),
    wins: [...CM_DD.up.map(([a, b]) => [a + ox, b + ox, CM.upper[0], CM.upper[1], 0.8]), ...CM_DD.up.map(([a, b]) => [a + ox, b + ox, CM.lower[0], CM.lower[1], 0.6]),
      ...CM_DD.ends.map(([a, b]) => [a + ox, b + ox, 6.4, 9.2, 0.45]), ...(cab ? [] : [[3.3, 7.6, 6.4, 9.2, 0.45], [8.4, 12.7, 6.4, 9.2, 0.45]])],
    over: (cc) => {
      const k = first ? "12" : "2", sh = first ? 2.95 : 2.15;
      let s = classSign(cc, d1 - 0.95, 7.8 - sh / 2, k, { h: sh, w: 0.9 }) + classSign(cc, d2 + 5.85, 7.8 - sh / 2, k, { h: sh, w: 0.9 });
      if (cab) s += letters(cc, 18.1, 5.0, 0.95, "2410", "#ffffff", { weight: 700 }) + cflLogo(cc, 24.6, 5.05, 1.1) + letters(cc, 15.0, 7.6, 0.75, first ? "1" : "2", "#ffffff", { weight: 700 });
      return s;
    },
    doors: [{ x: d1, w: 4.9, y0: 1.3, y1: 9.0 }, { x: d2, w: 4.9, y0: 1.3, y1: 9.0 }],
    door: (cc, d) => plugDoor(d.x, d.w, d.y0, d.y1, { glass: [2.9, 8.2], gw: 0.33 }) + rect(d.x - 0.35, d.y1, d.w + 0.7, 0.14, "#c9cccd"),
    extra: (cc) => {
      let s = "";
      if (cab) {
        // The crew door (red, its window high), the roof's equipment over
        // the cab section, the coupler.
        s += rect(13.4, 2.4, 3.0, 8.4, "none", 0, 'rx="0.25" stroke="#7a0d18" stroke-width="0.12"') + rect(14.0, 8.8, 1.8, 1.7, C.glass, 0, 'rx="0.3"') +
          line(13.15, 3.2, 13.15, 10.2, "#e8e8e8", 0.5) + line(16.65, 3.2, 16.65, 10.2, "#e8e8e8", 0.5);
        s += roofCover(14.0, CM.roof, 9.0, 1.1, "#c4c8cb", 3) + hvac(24.0, CM.roof, 6.0, 0.9, "#b5babe");
        s += coupler(cc, { y: 3.0, defl: [0.9, 9.0, 1.7] }) + lamp(0.55, 3.9, 0.3, 0.4, RED_LAMP);
      } else s += hvac(2.0, CM.roof, 8.0, 0.8, "#b5babe");
      return s + hvac(L - 11.0, CM.roof, 8.0, 0.8, "#b5babe");
    },
    gangway: [3.4, 10.6],
  });
}
// The single-deck motor car between: windows high at each end over the
// trucks, two doors, a black window band low between them, the bicycle
// area by the second door in a green panel; the pantograph, the
// transformer's cooling, the converters and the breaker on the roof.
function coradiaMid(c) {
  const L = c.L, R = CM.midRoof;
  const outline = box(L, { roof: R, low: 3.0, r: 0.8, bottom: [[0.3, 3.0], [14.6, 3.0], [15.4, 2.0], [L - 21.0, 2.0], [L - 20.2, 3.0]] });
  return sec(c, {
    base: CFL.white, truckTop: 3.0, outline,
    trucks: [[8.6, 8.5, 33], [L - 10.2, 8.5, 33]],
    paint: (cc) => {
      let s = rect(-1, -1, L + 2, 20, CFL.white) + rect(-1, 10.3, L + 2, 3, CFL.red) + rect(-1, -1, L + 2, 4.1, CFL.red);
      s += rect(43.5, 2.4, 7.4, 7.7, CFL.green) + bike(44.9, 9.0, 1.1) + rect(40.6, 8.3, 1.6, 1.4, CFL.black, 0, 'rx="0.15"');
      s += rect(22.0, 3.9, 27.8, 4.0, CFL.black, 0, 'rx="0.5"') + rect(1.0, 5.5, 13.6, 3.7, CFL.black, 0, 'rx="0.5"') + rect(59.1, 5.4, 16.0, 4.2, CFL.black, 0, 'rx="0.5"');
      return s;
    },
    wins: [[1.3, 7.4, 5.8, 8.9, 0.45], [8.6, 14.3, 5.8, 8.9, 0.45], [29.2, 34.7, 4.3, 7.55, 0.45], [36.3, 42.1, 4.3, 7.55, 0.45], [43.9, 49.5, 4.3, 7.55, 0.45],
      [59.4, 66.5, 5.7, 9.3, 0.5], [67.6, 74.8, 5.7, 9.3, 0.5]],
    over: (cc) => cflLogo(cc, 63.0, 4.7, 1.0) + classSign(cc, 22.2, 7.0, "2", { h: 2.6, w: 0.9, picto: 3 }) + classSign(cc, 57.5, 7.0, "2", { h: 2.6, w: 0.9, picto: 3 }),
    doors: [{ x: 16.1, w: 4.9, y0: 2.1, y1: 9.1 }, { x: 51.3, w: 4.9, y0: 2.1, y1: 9.1 }],
    door: (cc, d) => plugDoor(d.x, d.w, d.y0, d.y1, { glass: [3.6, 8.4], gw: 0.33 }),
    // Roof: the traction gear the length of the car, the pantograph and
    // breaker toward the second door's end.
    extra: () => roofCover(2.0, R, 18.0, 1.6, "#5e646a", 4) + roofCover(21.0, R, 16.0, 2.0, "#4a5056", 4) + roofCover(38.5, R, 14.0, 1.7, "#5e646a", 3) +
      rect(53.5, R, 4.0, 1.4, "#6b7177", 0.4) + pantograph(64.0, R + 0.9, { up: true, facing: -1 }) + rect(60.0, R, 8.0, 0.9, "#4a5056", 0.4) +
      rect(69.5, R, 0.6, 1.6, "#b9874a", 0.3) + rect(71.0, R, 5.5, 1.2, "#5e646a", 0.4),
    gangway: [3.4, 10.6],
  });
}

// ===================== TRAXX (CFL 4000) and the double-deck coaches =====================
// Bombardier's TRAXX F140 AC (CFL 4001-4020, 2004-2005, DB class 185's
// sister): 18.9 m over the buffers, Bo'Bo', the trucks 10.44 m apart on
// 1,250 mm wheels. CFL's paint (photographs of 4015 at Luxembourg 2024,
// 4017 at Schifflange 2025, 4011 side view): light gray, the cabs red to
// a curve just ahead of the crew door, a red band along the roof and along
// the frame; the number in red behind the No. 1 cab, "CFL" low toward the
// No. 2 cab; many carry advertising over the gray (not drawn).
const NOSE_4000 = [[1.2, 4.1], [1.0, 7.6], ["q", 1.05, 8.5, 1.6, 9.0], [2.6, 12.2], ["q", 2.9, 12.9, 4.0, 12.9]];
const LOCO = { gray: "#c9cdd0" };
function paint4000(c, L) {
  let s = rect(-1, 0, L + 2, 20, LOCO.gray) + rect(-1, 11.55, L + 2, 3, CFL.red) + rect(-1, 0, L + 2, 5.6, CFL.red);
  // The cab's red front, the gray side from just ahead of the side window.
  s += path(poly([[-1, 0], [1.9, 0], [1.9, 5.6], ["q", 2.2, 9.0, 3.0, 11.55], [3.0, 14], [-1, 14]]), CFL.red);
  // The louvers along the roof band.
  for (const [a, b] of [[L / 2 - 21.7, L / 2 - 13.2], [L / 2 + 11.7, L / 2 + 20.6], [L / 2 + 4.6, L / 2 + 6.0]]) s += rect(a, 11.75, b - a, 0.85, "#a50f22", 0, 'rx="0.1"') + slats(a + 0.1, 11.8, b - a - 0.2, 0.75, 0.25, "rgba(40,10,14,0.5)");
  return s;
}
const over4000 = (c, L) => letters(c, 12.0, 6.2, 1.0, "4015", CFL.red, { weight: 700 }) + cflLogo(c, L - 14.0, 6.3, 1.1) +
  letters(c, 5.0, 6.0, 0.5, "1", "#1b1d1f", { weight: 600 }) + letters(c, L - 5.0, 6.0, 0.5, "2", "#1b1d1f", { weight: 600 });
const loco4000 = (c) => euroLoco(c, { roof: 12.9, sill: 4.1, nose: NOSE_4000, rake: [[1.6, 9.0], [2.6, 12.2]], centers: 34.25, door: 5.6, doorW: 2.3, doorGlass: false, wheel: 49,
  paint: paint4000, over: over4000, surround: "#141518", grilles: [] });

// Bombardier's double-deck coaches for CFL (Görlitz, 2003-2006, "Dosto"):
// 26.8 m (the driving trailers 27.27 m), 4.63 m tall, the doors in the low
// floor beside each truck, the ends over the trucks at the intermediate
// level. From photographs (driving trailer 012 at Pétange 2025, 016 at
// Lorentzweiler, 007 and its coaches on the Pfaffenthal viaduct 2026,
// coaches at Howald 2025): light gray, the whole roof red down to the top
// of the upper windows, red along the bottom, the lower deck's windows in
// a gray band; light gray doors; the driving trailer's cab red at its
// edge, its two doors in green bicycle panels, first class upstairs under
// a yellow line.
const DO = { roof: 15.2, cab: 89.5, mid: 87.9, gray: "#d5d8da", band: "#6a6f74" };
const DO_NOSE = [[9.8, 15.2], [7.6, 15.05], [5.9, 14.55], [4.4, 13.6], [3.0, 12.2], [1.9, 10.4], [1.25, 8.4], [0.95, 6.0], [0.85, 4.2], [1.0, 3.6]];
function dostoCar(c, kind) {
  const L = c.L, cab = kind === "cab";
  // The double deck between the doors; its windows; the end sections'.
  const d1 = cab ? 31.9 : 9.4, d2 = L - (cab ? 16.5 : 13.8), dw = 4.6;
  const dd = [d1 + dw + 0.4, d2 - 0.4];
  const up = [], lo = [];
  const n = cab ? 11 : 14, x0 = cab ? 31.4 : 14.6, p = ((cab ? 76.8 : d2 - 0.6) - x0) / n;
  for (let i = 0; i < n; i++) { const x = x0 + i * p; up.push([x + 0.25, x + p - 0.3]); }
  if (cab) lo.push([39.2, 43.2], [44.0, 47.9], [48.5, 50.8], [56.4, 59.6], [62.0, 65.7], [66.2, 69.3], [69.6, 71.8]);
  else for (let x = dd[0] + 0.5; x + 3.6 <= dd[1] - 0.3; x += 4.35) lo.push([x, x + 3.8]);
  const ends = cab ? [[L - 10.1, L - 8.0], [L - 7.6, L - 5.0]] : [[2.3, 4.5], [4.9, 7.4], [L - 7.4, L - 4.9], [L - 4.5, L - 2.3]];
  const bottom = cab ? [[1.0, 3.6], [d1 - 0.6, 3.6], [d1 - 0.1, 1.2], [d2 + dw + 0.1, 1.2], [d2 + dw + 0.6, 3.6]] : [[d1 - 0.6, 3.6], [d1 - 0.1, 1.2], [d2 + dw + 0.1, 1.2], [d2 + dw + 0.6, 3.6]];
  const outline = cab ? box(L, { roof: DO.roof, low: 3.6, nose: DO_NOSE, bottom }) : box(L, { roof: DO.roof, low: 3.6, bottom, r: 1.0 });
  return sec(c, {
    base: DO.gray, cab, truckTop: 3.6, outline,
    trucks: cab ? [[13.2, 8.2, 36], [L - 8.6, 8.2, 36]] : [[4.8, 8.2, 36], [L - 4.8, 8.2, 36]],
    paint: (cc) => {
      let s = rect(-1, -1, L + 2, 20, DO.gray) + rect(-1, 13.05, L + 2, 4, CFL.red) + rect(-1, -1, L + 2, 2.9, CFL.red);
      s += rect(dd[0], 3.0, dd[1] - dd[0], 3.65, DO.band, 0, 'rx="0.3"');
      if (cab) {
        // The bicycle areas' green panels round both doors; the yellow line
        // under first class upstairs.
        s += rect(d1 - 1.3, 2.9, 17.0, 7.3, CFL.green) + rect(d2 - 8.6, 2.9, 14.0, 7.3, CFL.green) + rect(dd[0] - 0.4, 3.0, dd[1] - dd[0] + 0.8, 3.65, DO.band, 0, 'rx="0.3"') +
          rect(d1 - 1.3, 10.1, d2 + dw - d1 + 2.4, 0.3, CFL.yellow);
        // The red at the cab's edge, round the front.
        s += path(poly([[-1, 16], [11.0, 16], [9.8, 15.0], [8.2, 14.4], [7.0, 13.5], [6.2, 12.2], [5.7, 10.6], [5.5, 8.6], [5.4, 6.2], [5.4, 3.6], [-1, 2.0]]), CFL.red);
        s += path(poly([[1.6, 9.2], [2.2, 11.0], [3.1, 12.6], [4.3, 13.6], [4.9, 13.6], [4.9, 9.2]]), "#16181a") + path(poly([[2.0, 9.6], [2.5, 11.0], [3.3, 12.4], [4.4, 13.25], [4.6, 13.25], [4.6, 9.6]]), C.glass);
        s += rect(7.0, 8.6, 3.4, 3.5, "#16181a", 0, 'rx="0.4"') + rect(7.25, 8.85, 2.9, 3.0, C.glass, 0, 'rx="0.3"') + rect(7.35, 10.7, 2.7, 0.9, C.glassLight, 0, 'rx="0.2"');
        s += rect(19.6, 10.8, 2.2, 2.0, "none", 0, 'stroke="#9a9ea2" stroke-width="0.08"') + slats(19.75, 11.0, 1.9, 1.6, 0.22, "rgba(60,64,68,0.45)");
      }
      return s;
    },
    wins: [...up.map(([a, b]) => [a, b, 10.55, 12.75, 0.45]), ...lo.map(([a, b]) => [a, b, 3.35, 6.3, 0.3]),
      ...ends.map(([a, b]) => [a, b, 7.6, 10.2, 0.3]), ...(cab ? [[24.6, 28.9, 7.6, 10.3, 0.35]] : [])],
    over: (cc) => {
      let s = "";
      if (cab) {
        s += letters(cc, 20.6, 5.6, 0.9, "012", "#5a5f64", { weight: 500 }) + rect(23.5, 3.95, 5.6, 1.5, "#e8e9ea", 0, 'rx="0.1"') + cflLogo(cc, 26.3, 4.7, 0.95) +
          bike(d1 + 9.4, 8.4, 1.9) + bike(d2 - 4.4, 8.4, 1.9) + classSign(cc, d1 + dw + 0.75, 8.6, "1", { h: 1.6, w: 0.75 }) + classSign(cc, d1 + dw + 0.75, 5.0, "2", { h: 1.7, w: 0.75 }) +
          classSign(cc, d2 - 0.75, 8.6, "1", { h: 1.6, w: 0.75 }) + classSign(cc, d2 - 0.75, 5.0, "2", { h: 1.7, w: 0.75 });
      } else s += classSign(cc, d1 + dw + 0.75, 5.0, "2", { h: 1.7, w: 0.75 }) + classSign(cc, d2 - 0.75, 5.0, "2", { h: 1.7, w: 0.75 }) + rect(L - 7.6, 4.75, 5.2, 1.3, "#e8e9ea", 0, 'rx="0.1"') + cflLogo(cc, L - 5.0, 5.4, 0.85);
      return s;
    },
    doors: [{ x: d1, w: dw }, { x: d2, w: dw }],
    door: (cc, d) => plugDoor(d.x, d.w, 1.25, 8.9, { fill: "#dfe1e3", edge: "#7c8186", glass: [3.7, 8.2], gw: 0.3 }) + rect(d.x - 0.3, 8.9, d.w + 0.6, 0.14, "#9a9ea2"),
    extra: (cc) => {
      let s = hvac(cab ? 22.0 : 10.0, DO.roof, 8.0, 0.45, "#b3383f") + hvac(L - 18.0, DO.roof, 8.0, 0.45, "#b3383f");
      if (cab) s += lamp(0.95, 5.0, 0.3, 0.45) + lamp(1.0, 4.3, 0.25, 0.3, RED_LAMP) + uicEnd(0, -1, 3.6) + uicEnd(L, 1, 3.6);
      else s += uicEnd(0, -1, 3.6) + uicEnd(L, 1, 3.6);
      return s;
    },
    gangway: [3.8, 12.6],
  });
}
// Buffers and the screw coupling's hook at a coach's end.
function uicEnd(x, side, sill) {
  const a = side < 0 ? x : x - 1.0;
  return rect(a, 2.9, 1.0, 0.55, "currentColor", 0, 'opacity="0.85"') + rect(side < 0 ? x : x - 0.32, 2.55, 0.32, 1.25, C.steelDark, 0.4, 'rx="0.12"');
}

// ===================== Coradia Duplex (CFL 2200, TER 2N NG) =====================
// Alstom's (with Bombardier) double-deck units shared with the SNCF (Z
// 24500; CFL 2201-2223, 2004-2006, 21 in service): three cars, 81.1 m
// (the cab cars 27.55 m, the trailer 26.0 m), 4.32 m tall; a single-deck
// section over the cab's motor truck, a door at each end of the double
// deck. From photographs (2223 at Luxembourg 2023, 2216 at Pétange 2025,
// 2223 at Luxembourg 2026, 2214 at Belval 2025). Most of the fleet still
// wears CFL's 2000s paint in 2026: dark gray, the cab red, a red line
// along the bottom of the lower deck's windows and one along the roof's
// edge, first class (upstairs and down by the inner door of one cab car)
// under short yellow bars; the pantograph on the middle car's end by that
// cab car; the units being refitted at Saint-Pierre-des-
// Corps since 2022 come back in the Coradias' red and white (not drawn).
const TN = { roof: 14.2, cab: 90.4, mid: 85.3, gray: "#6f7478", grayLow: "#62676b", red: "#c4122c" };
const TN_NOSE = [[12.4, 14.2], [10.4, 14.05], [8.4, 13.4], [6.6, 12.2], [5.0, 10.6], [3.6, 8.7], [2.4, 6.6], [1.6, 4.8], [1.3, 3.4], [1.5, 2.4], [2.0, 2.0]];
const TN_LAY = {
  cab: { door1: 32.3, door2: 70.3, dd: [38.7, 67.9], up: 6, lo: 5, ends: [[76.6, 79.4], [79.9, 83.3]], high: [[23.5, 25.5], [26.6, 30.8]] },
  mid: { door1: 9.6, door2: 71.4, dd: [15.6, 69.6], up: 11, lo: 9, ends: [[2.6, 5.4], [5.9, 8.8], [76.6, 79.4], [79.9, 82.7]], high: [] },
};
function tnCar(c, kind) {
  const L = c.L, cab = kind.startsWith("cab"), first = kind === "cabA", lay = TN_LAY[cab ? "cab" : "mid"];
  const dw = 4.3, [a, b] = lay.dd;
  const up = Array.from({ length: lay.up }, (_, i) => { const p = (b - a) / lay.up, x = a + i * p; return [x + 0.35, x + p - 0.35]; });
  const lo = Array.from({ length: lay.lo }, (_, i) => { const p = (b - a - 2.5) / lay.lo, x = a + 2.5 + i * p; return [x + 0.35, x + p - 0.35]; });
  const bottom = [[cab ? 10.0 : 0.3, 3.2], [lay.door1 - 1.0, 3.2], [lay.door1 - 0.3, 1.4], [lay.door2 + dw + 0.3, 1.4], [lay.door2 + dw + 1.0, 3.2]];
  const outline = cab ? box(L, { roof: TN.roof, low: 3.2, nose: TN_NOSE, bottom: [[2.0, 2.0], [9.4, 2.0], ...bottom] }) : box(L, { roof: TN.roof, low: 3.2, bottom: bottom.slice(1), r: 0.9 });
  return sec(c, {
    base: TN.gray, cab, truckTop: 3.2, outline,
    trucks: cab ? [[15.0, 8.9, 36], [L - 9.0, 8.5, 33]] : [[5.9, 8.5, 33], [L - 5.9, 8.5, 33]],
    paint: (cc) => {
      let s = rect(-1, -1, L + 2, 20, TN.gray) + rect(-1, 12.5, L + 2, 3, TN.red) + rect(-1, 2.55, L + 2, 0.55, TN.red) + rect(-1, -1, L + 2, 1.9, TN.grayLow) + rect(a - 0.3, 3.15, b - a + 0.6, 3.55, "#4d5256", 0, 'rx="0.3"');
      if (first) s += rect(58.6, 8.3, 9.2, 0.38, CFL.yellow) + rect(58.6, 6.75, 9.2, 0.38, CFL.yellow);
      if (!cab) s += rect(lay.door2 - 6.2, 3.1, 5.6, 6.4, CFL.green) + bike(lay.door2 - 3.4, 8.2, 1.6);
      if (cab) {
        // The red cab, its back edge a slant ahead of the crew door.
        s += path(poly([[-1, -1], [18.0, -1], [18.0, 2.55], [17.4, 3.1], [16.6, 14.5], [-1, 14.5]]), TN.red);
        s += path(poly([[3.9, 8.9], [5.2, 10.6], [6.8, 12.1], [8.6, 13.2], [11.4, 13.5], [11.4, 9.1], [5.0, 8.4], ["q", 3.8, 8.3, 3.9, 8.9]]), "#1a1c1e") +
          path(poly([[4.8, 9.2], [6.0, 10.6], [7.4, 11.9], [8.9, 12.85], [10.8, 13.05], [10.8, 9.5]]), C.glass);
        s += rect(12.6, 8.6, 2.6, 2.8, "#1a1c1e", 0, 'rx="0.35"') + rect(12.8, 8.8, 2.2, 2.4, C.glass, 0, 'rx="0.3"');
        // The crew door (gray, a window high) behind the red.
        s += rect(18.1, 3.0, 2.0, 7.6, "none", 0, 'rx="0.15" stroke="#3e4245" stroke-width="0.1"') + rect(18.5, 7.6, 1.2, 2.4, C.glass, 0, 'rx="0.3"');
      }
      return s;
    },
    wins: [...up.map(([x0, x1]) => [x0, x1, 8.9, 11.6, 0.35]), ...lo.map(([x0, x1]) => [x0, x1, 3.4, 6.4, 0.35]), ...lay.ends.map(([x0, x1]) => [x0, x1, 6.4, 9.6, 0.35]),
      ...lay.high.map(([x0, x1]) => [x0, x1, 6.6, 10.0, 0.35])],
    over: (cc) => {
      let s = classSign(cc, lay.door1 - 0.6, 6.9, "2", { h: 3.6, w: 0.7, old: true }) + classSign(cc, lay.door2 + dw + 0.6, 6.9, first ? "12" : "2", { h: 3.6, w: 0.7, old: true });
      if (cab) s += letters(cc, 22.3, 5.3, 0.95, "2223", TN.red, { weight: 600 }) + cflLogo(cc, 28.6, 5.5, 1.15, TN.red, { rails: true, gap: TN.gray });
      return s;
    },
    doors: [{ x: lay.door1, w: dw }, { x: lay.door2, w: dw }],
    door: (cc, d) => plugDoor(d.x, d.w, 1.5, 8.6, { fill: "#7a7f83", edge: "#35393c", glass: [4.2, 8.0], gw: 0.3 }),
    extra: (cc) => {
      let s = hvac(cab ? 24.0 : 3.0, TN.roof, 7.5, 0.5, "#9da2a6") + hvac(L - 11.0, TN.roof, 7.5, 0.5, "#9da2a6");
      if (!cab) s += pantograph(9.0, TN.roof, { up: true, facing: 1 }) + panGear(9.0, TN.roof, 1);
      if (cab) s += coupler(cc, { y: 2.9, defl: [1.4, 9.6, 1.9] }) + lamp(1.45, 4.3, 0.3, 0.45) + lamp(1.4, 3.6, 0.25, 0.3, RED_LAMP);
      return s;
    },
    gangway: [3.6, 11.8],
  });
}

// ===================== Tables =====================
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const TYPES = {
  cfl2300Cab: { name: "KISS (CFL 2300) end car", kind: "emu" },
  cfl2300Mid: { name: "KISS (CFL 2300) middle car, 1st and 2nd class", kind: "emu", amenities: ["first"] },
  cfl2400CabA: { name: "Coradia (CFL 2400/2450) cab car, 1st and 2nd class", kind: "emu", amenities: ["first"] },
  cfl2400CabB: { name: "Coradia (CFL 2400/2450) cab car", kind: "emu" },
  cfl2400Mid: { name: "Coradia (CFL 2400/2450) motor car", kind: "emu" },
  cfl2450Dd: { name: "Coradia (CFL 2450) double-deck car", kind: "emu" },
  cfl4000: { name: "TRAXX (CFL 4000) electric locomotive", kind: "electric", pan: true },
  cflDostoCab: { name: "Double-deck driving trailer, 1st and 2nd class", kind: "coach", cab: true, amenities: ["first"] },
  cflDosto: { name: "Double-deck coach", kind: "coach" },
  cfl2200CabA: { name: "Coradia Duplex (CFL 2200) cab car, 1st and 2nd class", kind: "emu", amenities: ["first"] },
  cfl2200CabB: { name: "Coradia Duplex (CFL 2200) cab car", kind: "emu" },
  cfl2200Mid: { name: "Coradia Duplex (CFL 2200) middle car", kind: "emu" },
};
export const MODELS = {
  cfl2300Cab: M((c) => kissCar(c, "cab"), KZ.end, true),
  cfl2300Mid: M((c) => kissCar(c, "mid"), KZ.mid),
  cfl2400CabA: M((c) => coradiaDD(c, "cabA"), CM.cab, true),
  cfl2400CabB: M((c) => coradiaDD(c, "cabB"), CM.cab, true),
  cfl2400Mid: M(coradiaMid, CM.mid),
  cfl2450Dd: M((c) => coradiaDD(c, "inner"), CM.dd),
  cfl4000: M(loco4000, 62.0),
  cflDostoCab: M((c) => dostoCar(c, "cab"), DO.cab, true),
  cflDosto: M((c) => dostoCar(c, "mid"), DO.mid),
  cfl2200CabA: M((c) => tnCar(c, "cabA"), TN.cab, true),
  cfl2200CabB: M((c) => tnCar(c, "cabB"), TN.cab, true),
  cfl2200Mid: M((c) => tnCar(c, "mid"), TN.mid),
};
// Every car drawn the other way round (its cab, if any, at the right): the
// key with "R" added.
for (const key of Object.keys(MODELS)) {
  const m = MODELS[key];
  MODELS[key + "R"] = { len: m.len, oneEnd: false, variant: m.variant,
    draw: (c) => `<g transform="matrix(-1 0 0 1 ${c.L} 0)">${m.draw({ ...c, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: c.coupledL, cabL: c.cabR, cabR: c.cabL })}</g>` };
  TYPES[key + "R"] = { ...TYPES[key] };
}

const set = (label, ...units) => ({ label, units });
const unitOf = (...keys) => keys.map((k) => [k, 1]);
const flip = (k) => (k.endsWith("R") ? k.slice(0, -1) : k + "R");
// Each unit drawn as it runs: its trailing cab mirrored.
const KISS = unitOf("cfl2300Cab", "cfl2300Mid", "cfl2300CabR");
const COR3 = unitOf("cfl2400CabA", "cfl2400Mid", "cfl2400CabBR");
const COR6 = unitOf("cfl2400CabA", "cfl2400Mid", "cfl2450DdR", "cfl2450Dd", "cfl2400MidR", "cfl2400CabBR");
const TN3 = unitOf("cfl2200CabA", "cfl2200Mid", "cfl2200CabBR");
const DOSTO = [["cfl4000", 1], ["cflDosto", 3], ["cflDostoCabR", 1]];
export const SETS = {
  KISS: set("KISS (CFL 2300): a three-car double-deck unit (often two coupled)", ...KISS),
  KISS2: set("KISS (CFL 2300): two three-car double-deck units", ...KISS, ...KISS),
  COR3: set("Coradia (CFL 2400): a three-car double-deck unit, a single-deck motor car between the cab cars", ...COR3),
  COR6: set("Coradia (CFL 2450): a six-car double-deck unit", ...COR6),
  TN3: set("Coradia Duplex (CFL 2200): a three-car double-deck unit (often two coupled; some trains a KISS)", ...TN3),
  TER: set("Coradia Duplex: CFL's 2200 (drawn) or the SNCF's identical Z 24500 in TER Grand Est paint, often two coupled", ...TN3),
  DOSTO: set("TRAXX (CFL 4000) with double-deck coaches and a driving trailer (three to five coaches)", ...DOSTO),
};
const BY_KEY = { cfl2300Cab: SETS.KISS, cfl2300Mid: SETS.KISS, cfl2400CabA: SETS.COR3, cfl2400CabB: SETS.COR3, cfl2400Mid: SETS.COR3, cfl2450Dd: SETS.COR6,
  cfl2200CabA: SETS.TN3, cfl2200CabB: SETS.TN3, cfl2200Mid: SETS.TN3, cfl4000: SETS.DOSTO, cflDosto: SETS.DOSTO, cflDostoCab: SETS.DOSTO };
// Unit numbers (the fleet lists): KISS 2301-2321, Coradia 2401-2422 and
// 2451-2462, Coradia Duplex 2201-2223, TRAXX 4001-4020, the double-deck
// driving trailers 001-030 (as numbered on their cabs).
export const FLEETS = { cfl: [[2301, 2321, "cfl2300Cab"], [2401, 2422, "cfl2400CabA"], [2451, 2462, "cfl2450Dd"], [2201, 2223, "cfl2200CabA"], [4001, 4020, "cfl4000"], [1, 30, "cflDostoCab"]] };
const plain = (v) => String(v || "").normalize("NFD").replace(/[̀-ͯ]/g, "");
// CFL's lines by the stations a train calls at (as cfl.py tells them).
const LINE_AT = [
  ["90", /Thionville|Metz|Hettange/],
  ["10", /Troisvierges|Ettelbruck|Mersch|Diekirch|Wiltz|Kautenbach|Clervaux|Walferdange|Lintgen|Lorentzweiler|Heisdorf|Dommeldange|Schieren|Colmar-Berg|Cruchten|Michelau|Goebelsmuhle|Drauffelt|Wilwerwiltz|Merkholtz|Paradiso|Pfaffenthal/],
  ["30", /Wasserbillig|Trier|Igel|Mertert|Manternach|Wecker|Betzdorf|Roodt|Munsbach|Oetrange|Sandweiler|Cents-Hamm/],
  ["50", /Kleinbettingen|Capellen|Mamer|Bertrange/],
  ["70", /Hollerich|Leudelange|Dippach|Schouweiler|Bascharage|Longwy/],
];
const namesOf = (t) => [t.origin, t.destination, ...(t.stops || []).map((x) => x?.name || x?.stop || "")].map(plain);
const hasLine = (t, line) => { const re = LINE_AT.find(([l]) => l === line)[1]; return namesOf(t).some((x) => re.test(x)); };
// What usually runs (2026; CFL's own news on the Coradias' lines, Wikipedia
// "CFL Class 2400 and 2450", photographs of each line's trains 2025-2026):
// the KISS on line 30 to Trier (alone in Germany); the double-deck push-
// pull sets on line 10's RegionalExpresses to Troisvierges and on line 70
// by Leudelange to Pétange, Rodange and Longwy; the Coradias on the
// branches (Diekirch, Wiltz, Rumelange, Volmerange, Dudelange, Audun-le-
// Tiche), line 50 to Kleinbettingen and line 30's stopping trains; the
// Coradia Duplex on line 60 by Esch and the TER to Thionville and Metz.
export const TYPICAL = {
  cfl: (t, reported) => {
    if (reported && BY_KEY[reported.replace(/R$/, "")]) return BY_KEY[reported.replace(/R$/, "")];
    const r = String(t.route || "").toUpperCase(), e = `${plain(t.origin)}|${plain(t.destination)}`;
    if (r === "TGV") return null; // SNCF's TGV INOUI (drawn by France's car file)
    if (r === "TER" || hasLine(t, "90")) return SETS.TER;
    if (/Trier|Igel/.test(e)) return SETS.KISS;
    if (/Wiltz|Diekirch|Rumelange|Noertzange|Volmerange|Dudelange|Audun|Kleinbettingen/.test(e)) return SETS.COR3;
    if (/Troisvierges|Mersch/.test(e)) return SETS.DOSTO;
    if (/Ettelbruck/.test(e)) return r === "RE" ? SETS.DOSTO : SETS.COR3;
    if (/Wasserbillig/.test(e)) return SETS.COR3;
    if (/Longwy/.test(e) || hasLine(t, "70")) return SETS.DOSTO;
    if (/Petange|Rodange|Esch|Bettembourg/.test(e)) return SETS.TN3;
    return SETS.TN3;
  },
};
// ---------- Fact sheets ----------
const kmh = (v) => Math.round(v / 1.609);
const kw = (v) => Math.round(v * 1.341);
const part = (base, about) => ({ ...base, about });
const kiss = { model: "Stadler KISS (CFL 2300)", type: "Double-deck electric multiple unit", builder: "Stadler Rail", built: "2014–2021", fleet: "21 three-car units (2301–2321)",
  topSpeedMph: kmh(160), seats: 284, lengthFt: 262, source: "https://en.wikipedia.org/wiki/CFL_Class_2300" };
const cor = { model: "Alstom Coradia Stream High Capacity (CFL 2400/2450)", type: "Double-deck electric multiple unit", builder: "Alstom", built: "2023–2026",
  fleet: "22 three-car units (2401–2422) and 12 six-car units (2451–2462)", topSpeedMph: kmh(160), seats: 334, lengthFt: 269, source: "https://en.wikipedia.org/wiki/CFL_Class_2400_and_2450" };
const tn = { model: "Alstom Coradia Duplex, TER 2N NG (CFL 2200)", type: "Double-deck electric multiple unit", builder: "Alstom and Bombardier", built: "2004–2006",
  fleet: "23 three-car units (2201–2223), 21 in service", topSpeedMph: kmh(160), lengthFt: 266, source: "https://en.wikipedia.org/wiki/CFL_Class_2200" };
const dosto = { model: "Bombardier double-deck coach (CFL \"Dosto\")", type: "Double-deck coach", builder: "Bombardier (Görlitz)", built: "2003–2006", topSpeedMph: kmh(160),
  lengthFt: 88, source: "https://fr.wikipedia.org/wiki/Société_nationale_des_chemins_de_fer_luxembourgeois" };
export const FACTS = {
  cfl2300Cab: part(kiss, "An end car: the cab and its motor truck, the bicycle area by the first door, the double deck between the doors."),
  cfl2300Mid: part(kiss, "The middle car: first class upstairs (29 seats) under the yellow line, second class downstairs."),
  cfl2400CabA: part(cor, "A cab car: first class upstairs, the window band ringed in yellow."),
  cfl2400CabB: part(cor, "A cab car: second class on both decks."),
  cfl2400Mid: part(cor, "The single-deck motor car between the cab cars: the pantograph and the traction gear on its roof, the bicycle area by its second door."),
  cfl2450Dd: part(cor, "One of the six-car units' two inner double-deck cars, where the three-car units have a cab."),
  cfl2200CabA: part(tn, "A cab car with first class upstairs and down by its inner door (the yellow bars), in CFL's 2000s paint."),
  cfl2200CabB: part(tn, "A cab car, second class, in CFL's 2000s paint."),
  cfl2200Mid: part(tn, "The middle car, with the bicycle area and the pantograph."),
  cfl4000: { model: "Bombardier TRAXX F140 AC (CFL 4000)", type: "Electric locomotive", builder: "Bombardier", built: "2004–2005", fleet: "20 (4001–4020)",
    topSpeedMph: kmh(140), powerHp: kw(5600), lengthFt: 62, source: "https://fr.wikipedia.org/wiki/Matériel_moteur_des_chemins_de_fer_luxembourgeois",
    about: "Pushes and pulls the double-deck coaches; shared with CFL Cargo." },
  cflDostoCab: part(dosto, "The driving trailer: the cab, two bicycle areas, first class upstairs under the yellow line."),
  cflDosto: part(dosto, "A second-class coach."),
};
for (const k of Object.keys(FACTS)) FACTS[k + "R"] ??= FACTS[k];
