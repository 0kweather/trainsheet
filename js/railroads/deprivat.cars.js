// Germany's private regional railways, north and east and in Nordrhein-
// Westfalen (scripts/railroads/germany.py, agency "deprivat"): metronom and
// enno, erixx, EVB, NordWestBahn, Nordbahn, AKN, ODEG, NEB, the Erfurter
// Bahn and Süd-Thüringen-Bahn, Abellio, the Mitteldeutsche Regiobahn,
// eurobahn, National Express (RRX), WestfalenBahn, RheinRuhrBahn, cantus,
// Die Länderbahn's trilex and vogtlandbahn, and the small ones. Trainsheet's
// own side views at the shared scale (js/carart.js), from the builders'
// dimensions (de.wikipedia's articles on each type) and photographs
// (Wikimedia Commons, 2024-2026), each unit in the paint most of its fleet
// wears in autumn 2026; the lettering and marks are drawn here (no logo
// files).
//
// The timetable names no cars, so TYPICAL picks what runs each line (the
// railways' and de.wikipedia's fleet and line lists for the 2026
// timetable). FLEETS maps the units' numbers to their drawings, for the
// fleet pages.

import { C, rect, circle, path, line, lines, poly, truck, pantograph, slats, win } from "../carart.js?v=dev";
import { newId } from "../carmodels.js?v=dev";
import { mark, euroLoco, TYPES as CZ_TYPES, MODELS as CZ_MODELS } from "./czechia.cars.js?v=dev";
import { hvac, roofCover, lamp, RED_LAMP, wiper } from "./digitraffic.cars.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const F = 3.2808; // feet in a metre
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
const clip = (d, inner) => {
  const id = newId();
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`;
};
// A gradient as a fill (y up, feet): stops [[offset, color], ...] from
// (x0, y0) to (x1, y1); returns [defs, url].
function grad(x0, y0, x1, y1, stops) {
  const id = newId();
  return [`<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${n(x0)}" y1="${n(y0)}" x2="${n(x1)}" y2="${n(y1)}">` +
    stops.map(([o, col]) => `<stop offset="${o}" stop-color="${col}"/>`).join("") + `</linearGradient></defs>`, `url(#${id})`];
}
// Text in a mark() group (y down, centered at its origin).
const txt = (x, y, h, text, fill, { weight = 700, family = SANS, anchor = "middle", spacing = 0, style = "", extra = "" } = {}) =>
  `<text x="${n(x)}" y="${n(y + h * 0.36)}" font-size="${n(h)}" text-anchor="${anchor}" font-weight="${weight}" letter-spacing="${spacing}" font-family="${family}" fill="${fill}"${style ? ` font-style="${style}"` : ""}${extra ? " " + extra : ""}>${text}</text>`;
const letters = (c, x, y, h, text, fill, o) => mark(c, x, y, txt(0, 0, h, text, fill, o));
// A word fitted to its width w.
const fitted = (c, x, y, h, text, fill, w, o = {}) => letters(c, x, y, h, text, fill, { ...o, extra: `textLength="${n(w)}" lengthAdjust="spacingAndGlyphs"` });
// The body's shading (as carmodels.js's bodies): darker low, a sheen high.
function shade(lo, hi, L) {
  const id = newId();
  const stop = (o, color, v, fb) => `<stop offset="${o}" stop-color="${color}" stop-opacity="${fb}" style="stop-opacity:var(${v},${fb})"/>`;
  return `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${n(lo)}" x2="0" y2="${n(hi)}">` +
    stop(0, "#000", "--car-shade-low", 0.16) + '<stop offset="0.36" stop-color="#000" stop-opacity="0"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/>' +
    stop(0.8, "#fff", "--car-shade-high", 0.1) + '<stop offset="0.93" stop-color="#fff" stop-opacity="0"/>' + stop(1, "#000", "--car-shade-roof", 0.08) +
    `</linearGradient></defs><rect x="-2" y="${n(lo)}" width="${n(L + 4)}" height="${n(hi - lo)}" fill="url(#${id})"/>`;
}

// ---------- A car of a multiple unit ----------
// o: outline (points, y up, poly() style), base (the body color), paint(c)
// (clipped to the body), wins ([x0, x1, y0, y1, r] or {x0, x1, y0, y1, r,
// d} for a shaped one), doors, door(c, d), trucks ([x, wb, d(in), kind]),
// under(c), over(c) (clipped, on the windows), extra(c) (on top), gangway
// [floor, top], cab (no gangway at the left), lo/hi (the shading's span).
function sec(c, o) {
  const L = c.L, d = poly(o.outline);
  let s = (o.trucks || []).map(([x, wb, dia, kind = "car"]) => truck(x, { wb, d: dia, kind, top: o.truckTop ?? 2.9 })).join("");
  if (o.under) s += o.under(c);
  let liv = o.paint(c);
  liv += (o.wins || []).map((w) => (Array.isArray(w) ? glass(...w) : w.d ? shaped(w.d) : glass(w.x0, w.x1, w.y0, w.y1, w.r))).join("");
  if (o.over) liv += o.over(c);
  if (o.shade !== false) liv += shade(o.lo ?? 1, o.hi ?? 15, L);
  s += path(d, o.base) + clip(d, liv);
  if (o.door) s += (o.doors || []).map((dr) => o.door(c, dr)).join("");
  if (o.extra) s += o.extra(c);
  s += path(d, "none", 0.8);
  const [floor, top] = o.gangway || [1.6, 12.4];
  if (c.coupledL && !o.cab) s += bellows(0, -1, floor, top);
  if (c.coupledR && !o.cabR) s += bellows(L, 1, floor, top);
  return s;
}
// A window: dark glass with the sky's reflection high in it, a black frame.
function glass(x0, x1, y0, y1, r = 0.45, frame = "#15181b") {
  return rect(x0 - 0.12, y0 - 0.12, x1 - x0 + 0.24, y1 - y0 + 0.24, frame, 0, `rx="${n(r + 0.1)}"`) +
    rect(x0, y0, x1 - x0, y1 - y0, C.glass, 0, `rx="${n(r)}"`) +
    rect(x0 + 0.15, y0 + (y1 - y0) * 0.6, x1 - x0 - 0.3, (y1 - y0) * 0.3, C.glassLight, 0, `rx="${n(Math.min(r, 0.25))}" opacity="0.85"`);
}
// A shaped window (a path), framed.
const shaped = (d) => path(d, C.glass, 0, 'stroke="#15181b" stroke-width="0.24"');
// The bellows between two cars of a unit, from floor to top; side -1 at the
// left end, 1 at the right.
function bellows(xFace, side, floor, top, fill = "#24272b") {
  const w = 0.75, x = side < 0 ? xFace : xFace - w;
  return rect(x, floor, w, top - floor, fill, 0, 'rx="0.2"') + lines([[x + 0.25, floor + 0.3, x + 0.25, top - 0.3], [x + 0.5, floor + 0.3, x + 0.5, top - 0.3]], "#3c4046", 0.6);
}
// A body's outline: from x0 to x1, its underside at low (or the steps
// given in bottom, left to right), its roof at roof, rounded at the corners;
// nose: a cab's points from the roof down to the bottom (at the left).
function box(L, { roof, low, r = 0.6, nose = null, bottom = null, x0 = 0.3, x1 = L - 0.3, noseR = null }) {
  const pts = [nose ? nose[nose.length - 1] : [x0, low]];
  if (bottom) pts.push(...bottom);
  if (noseR) pts.push(...[...noseR].reverse().map(([x, y]) => [L - x, y]));
  else pts.push([x1, low], [x1, roof - r], ["q", x1, roof, x1 - r, roof]);
  if (nose) pts.push(...nose.slice(0, -1));
  else pts.push([x0 + r, roof], ["q", x0, roof, x0, roof - r]);
  return pts;
}
// The automatic coupler and its head under a nose at the left, and the
// dark buffer beam (the obstacle deflector) under the front.
function coupler(c, { x = 1.4, y = 2.9, defl = [0.9, 5.0, 1.0, 2.4], color = "#25282c" } = {}) {
  const [a, b, lo, hi] = defl;
  let s = path(poly([[a, hi], [b, hi], [b, lo + 0.3], [a + 0.6, lo]]), color);
  s += rect(0.3, y - 0.3, x + 0.4, 0.6, "currentColor", 0, 'opacity="0.9"') + rect(0, y - 0.7, 0.55, 1.4, "currentColor", 0, 'rx="0.15"') +
    rect(0.15, y + 0.75, 0.5, 0.35, C.steelDark, 0.3);
  return s;
}
// A plug door, two leaves, their windows; fill the leaves' color.
function plugDoor(c, d, fill, { glassTop = null, glassLow = null, seam = "rgba(0,0,0,0.45)", frame = "rgba(0,0,0,0.5)" } = {}) {
  const m = d.x + d.w / 2, lw = d.w / 2, h = d.y1 - d.y0;
  const gt = glassTop ?? d.y1 - h * 0.12, gl = glassLow ?? d.y0 + h * 0.3;
  let s = rect(d.x, d.y0, d.w, h, fill, 0, `rx="0.18" stroke="${frame}" stroke-width="0.1"`) + line(m, d.y0 + 0.1, m, d.y1 - 0.1, seam, 0.7);
  for (const a of [d.x + 0.35, m + 0.3]) s += rect(a, gl, lw - 0.65, gt - gl, "#15181b", 0, 'rx="0.3"') + rect(a + 0.1, gl + 0.12, lw - 0.85, gt - gl - 0.24, C.glass, 0, 'rx="0.25"') +
    rect(a + 0.15, gt - 1.4, lw - 0.95, 1.0, C.glassLight, 0, 'rx="0.2"');
  return s;
}
// Pictograms, h ft tall, centered at (x, y) (y up), in color col.
const PICTO = {
  // The wheelchair (ISO 7001).
  chair: (h, col) => `<circle cx="${n(h * 0.05)}" cy="${n(-h * 0.38)}" r="${n(h * 0.1)}" fill="${col}"/>` +
    `<path d="M${n(-h * 0.02)} ${n(-h * 0.24)}L${n(0)} ${n(h * 0.06)}L${n(h * 0.28)} ${n(h * 0.06)}L${n(h * 0.36)} ${n(h * 0.42)}" fill="none" stroke="${col}" stroke-width="${n(h * 0.09)}" stroke-linejoin="round"/>` +
    `<path d="M${n(-h * 0.14)} ${n(-h * 0.06)}A${n(h * 0.26)} ${n(h * 0.26)} 0 1 0 ${n(h * 0.22)} ${n(h * 0.28)}" fill="none" stroke="${col}" stroke-width="${n(h * 0.08)}"/>`,
  // The bicycle.
  bike: (h, col) => {
    const r = h * 0.27, sw = `fill="none" stroke="${col}" stroke-width="${n(h * 0.08)}"`;
    return `<circle cx="${n(-h * 0.42)}" cy="${n(h * 0.18)}" r="${n(r)}" ${sw}/><circle cx="${n(h * 0.42)}" cy="${n(h * 0.18)}" r="${n(r)}" ${sw}/>` +
      `<path d="M${n(-h * 0.42)} ${n(h * 0.18)}L${n(-h * 0.12)} ${n(-h * 0.2)}L${n(h * 0.28)} ${n(-h * 0.2)}L${n(h * 0.42)} ${n(h * 0.18)}M${n(-h * 0.12)} ${n(-h * 0.2)}L${n(h * 0.02)} ${n(h * 0.18)}L${n(h * 0.28)} ${n(-h * 0.2)}M${n(-h * 0.18)} ${n(-h * 0.32)}L${n(-h * 0.04)} ${n(-h * 0.32)}" ${sw}/>`;
  },
};
const picto = (c, kind, x, y, h, col) => mark(c, x, y, PICTO[kind](h, col));

// Roof-top wires and gear behind a pantograph.
const hvLine = (a, b, roof) => lines([[a, roof + 0.75, b, roof + 0.75]], "currentColor", 0.9) +
  [a, b].map((x) => rect(x - 0.15, roof - 0.05, 0.3, 0.8, "#b9874a", 0.3)).join("");

export const TYPES = {}, MODELS = {};
const M = (draw, len, oneEnd = false) => ({ draw, len: n(len), oneEnd });
const add = (key, type, model) => { TYPES[key] = type; MODELS[key] = model; };

// ===================== Siemens Desiro HC =====================
// Four (or six) cars: single-deck motor end cars, 26.23 m (27.43 m over the
// coupler), the floor low between their trucks, two double doors a side;
// double-deck trailers between, 25.2 m, a double door at each end of the
// low middle; 4.64 m tall (de.wikipedia "Siemens Desiro HC": 105.25 m over
// the couplers for four cars). The end car's layout, from the cab, measured
// off 462 075 at Köln Hbf (2025) and ODEG's 3462 005 (2023), rectified: the
// cab's narrow side window, a big window, door, four windows, door, two
// windows; the double-deck car's off 3462 005's: 6.1 m from each end to its
// doors (one window at the end, over the truck), doors 1.65 m, the low
// deck's four windows between and the upper deck's over them.
const HC = { end: 90.0, mid: 82.7, roof: 15.2, side: 12.0 };
const HC_NOSE = [[13.4, 15.2], ["q", 9.4, 15.2, 7.6, 14.1], [3.4, 9.8], ["q", 1.6, 7.6, 1.4, 5.4], [1.3, 3.0], [2.0, 2.4]];
// The windshield seen from the side, and the cab's door-less side window.
const HC_SCREEN = [[3.0, 9.6], [7.2, 13.7], ["q", 8.6, 14.6, 10.6, 14.75], [10.9, 14.0], ["q", 8.8, 13.5, 7.6, 12.2], [5.2, 9.2]];
const HC_END = {
  wins: [[22.6, 29.2, 6.3, 9.5, 0.6], [38.6, 42.8, 5.4, 8.5], [44.0, 50.6, 5.4, 8.5], [52.0, 58.6, 5.4, 8.5], [59.8, 63.8, 5.4, 8.5], [72.6, 78.8, 5.4, 8.5], [80.0, 85.8, 5.4, 8.5]],
  cabWin: "M17.4 9.3L17.4 12.2Q17.4 12.6 17.8 12.6L18.9 12.6Q19.3 12.6 19.3 12.2L19.3 9.7Q19.3 9.3 18.9 9.3Z",
  doors: [{ x: 31.8, w: 5.0, y0: 2.6, y1: 10.8 }, { x: 65.8, w: 5.0, y0: 2.6, y1: 10.8 }],
};
const HC_MID = {
  ends: [[3.2, 9.6, 6.4, 9.3]],
  low: [[26.6, 32.4], [33.6, 39.4], [43.3, 49.1], [50.3, 56.1]].map(([a, b]) => [a, b, 3.3, 6.1]),
  up: [[19.6, 26.0], [27.2, 33.6], [34.8, 41.2], [42.4, 48.8], [50.0, 56.4], [57.6, 63.0]].map(([a, b]) => [a, b, 10.2, 12.7]),
  doors: [{ x: 19.9, w: 5.4, y0: 1.9, y1: 9.4 }, { x: 57.4, w: 5.4, y0: 1.9, y1: 9.4 }],
};
const HC_MID_WINS = [...HC_MID.ends, ...HC_MID.ends.map(([a, b, y0, y1]) => [HC.mid - b, HC.mid - a, y0, y1]), ...HC_MID.low, ...HC_MID.up];
// A field of dots, as RRX's cars carry at each end: columns from x0 toward
// x1, the dots biggest at x0 and smaller away, some left out (a fixed,
// irregular pattern).
function dots(x0, x1, y0, y1, color, { pitch = 1.15, r0 = 0.5, r1 = 0.14, seed = 7 } = {}) {
  let s = "", k = seed;
  const dir = x1 > x0 ? 1 : -1, cols = Math.floor(Math.abs(x1 - x0) / pitch);
  for (let i = 0; i < cols; i++) {
    const f = i / Math.max(1, cols - 1), r = r0 + (r1 - r0) * f, x = x0 + dir * (i + 0.5) * pitch;
    for (let y = y0 + pitch / 2; y < y1; y += pitch) {
      k = (k * 1103515245 + 12345) % 2147483648;
      if ((k / 2147483648) < 0.18 + 0.55 * f) continue;
      s += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(r * 0.8)}" ry="${n(r)}" fill="${color}"/>`;
    }
  }
  return s;
}
// RRX's mark: "RR" in its squared letters and the orange "X" of two
// strokes, a trail of dots to the left (fading out), h the letters' height;
// sub: "RHEIN RUHR XPRESS" under it.
function rrxMark(c, x, y, h, ink, { sub = false, trail = ink } = {}) {
  const w = h * 0.78, sw = h * 0.2;
  const R = (ox) => `<path d="M${n(ox)} ${n(h / 2)}L${n(ox)} ${n(-h / 2)}L${n(ox + w * 0.8)} ${n(-h / 2)}Q${n(ox + w)} ${n(-h / 2)} ${n(ox + w)} ${n(-h * 0.3)}L${n(ox + w)} ${n(-h * 0.1)}Q${n(ox + w)} ${n(h * 0.08)} ${n(ox + w * 0.8)} ${n(h * 0.08)}L${n(ox + sw / 2)} ${n(h * 0.08)}M${n(ox + w * 0.45)} ${n(h * 0.08)}L${n(ox + w)} ${n(h / 2)}" fill="none" stroke="${ink}" stroke-width="${n(sw)}"/>`;
  let g = R(0) + R(w * 1.35);
  const xo = w * 2.75;
  g += `<path d="M${n(xo)} ${n(-h / 2)}L${n(xo + w * 1.05)} ${n(h / 2)}M${n(xo + w * 1.05)} ${n(-h / 2)}L${n(xo)} ${n(h / 2)}" stroke="#f08a1c" stroke-width="${n(sw * 1.25)}" stroke-linecap="round"/>`;
  for (let i = 1; i <= 14; i++) for (const dy of [-0.32, -0.1, 0.12, 0.34]) {
    if ((i * 7 + dy * 31) % 5 < 1.2 && i > 3) continue;
    g += `<circle cx="${n(-i * h * 0.24)}" cy="${n(dy * h)}" r="${n(h * (0.085 - i * 0.004))}" fill="${trail}"/>`;
  }
  if (sub) g += txt(w * 2.3, h * 0.95, h * 0.26, "RHEIN RUHR XPRESS", ink, { weight: 500, anchor: "middle", spacing: "0.05em" });
  return mark(c, x, y, g);
}
// The paints: base, end(c, L, first) and mid(c, L, kind) the paint under the
// windows; door(c, d, k) the leaves; endMarks / midMarks on top.
const HCP = {};
// RRX (National Express, the Rhein-Ruhr-Express's own design): warm gray,
// the cab white back through the big window; white dots at every car end;
// orange doors; "RRX" (white "RR", orange "X") high between the end car's
// doors, gray on the white cab with "RHEIN RUHR XPRESS"; "national express"
// low; white class numerals by the doors. The first-class end car (whose
// front is orange under the windshield): a row of orange dots along the
// top from the cab back past the first door, "1" by that door.
const RRX = { gray: "#86837d", roof: "#96938c", white: "#f3f4f3", orange: "#f08a1c", black: "#1d1f21" };
HCP.rrx = {
  base: RRX.gray,
  end: (c, L, first) => {
    let s = rect(-1, -1, L + 2, 20, RRX.gray) + rect(-1, HC.side, L + 2, 6, RRX.roof);
    s += path("M-1 -1L24.2 -1Q24.8 6.0 25.4 9.5Q26.0 13.0 27.0 16L-1 16Z", RRX.white);
    // The black of the front mask wrapping round onto the side, the cab's
    // window in it; the cab's seam; louvres high on the roof's side.
    s += path("M15.2 8.9Q15.9 11.4 17.4 13.0L19.9 13.0L19.9 8.9Z", RRX.black) + `<path d="M12.2 15.2Q14.6 9.0 16.0 2.4" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="0.12"/>`;
    for (const [a, w] of [[18.6, 2.4], [27.4, 2.6], [30.6, 2.6]]) s += slats(a, 12.9, w, 0.9, 0.3, "#1d1f21");
    if (first) s += path("M-1 4.6L1.4 4.6L2.9 9.0L-1 9.0Z", RRX.orange);
    s += dots(L - 0.4, L - 13.0, 2.4, 13.4, "#f4f4f2", { seed: 3, pitch: 1.3, r0: 0.6 });
    if (first) for (let i = 0; i < 34; i++) s += circle(13.6 + i * 1.12, 12.55, Math.max(0.12, 0.32 - i * 0.005), RRX.orange);
    return s;
  },
  mid: (c, L) => rect(-1, -1, L + 2, 20, RRX.gray) + rect(-1, 13.2, L + 2, 6, RRX.roof) +
    dots(0.4, 16.8, 2.6, 14.4, "#f4f4f2", { seed: 11, pitch: 1.3, r0: 0.6 }) + dots(L - 0.4, L - 16.8, 2.6, 14.4, "#f4f4f2", { seed: 5, pitch: 1.3, r0: 0.6 }),
  door: (c, d, k) => plugDoor(c, d, RRX.orange) + (k === "chair" ? rect(d.x + d.w * 0.6, d.y0 + 3.0, 1.3, 1.6, "#1d1f21", 0, 'rx="0.15"') + picto(c, "chair", d.x + d.w * 0.6 + 0.65, d.y0 + 3.8, 1.2, "#ffffff")
    : k === "bike" ? rect(d.x + d.w * 0.6, d.y0 + 3.0, 1.4, 1.4, "#1d1f21", 0, 'rx="0.15"') + picto(c, "bike", d.x + d.w * 0.6 + 0.7, d.y0 + 3.7, 1.0, "#ffffff") : ""),
  endMarks: (c, L, first) => rrxMark(c, 22.6, 4.6, 1.15, "#8a8781", { sub: true }) + rrxMark(c, 49.0, 10.9, 1.05, "#ffffff") +
    letters(c, 49.5, 4.2, 0.62, "national express", "#ffffff", { weight: 500 }) +
    letters(c, 38.0, 10.6, 0.95, first ? "1" : "2", "#ffffff", { weight: 600 }) + letters(c, 72.0, 10.6, 0.95, "2", "#ffffff", { weight: 600 }),
  midMarks: (c, L) => rrxMark(c, 40.0, 14.0, 0.9, "#ffffff") + letters(c, 41.4, 7.1, 0.6, "national express", "#ffffff", { weight: 500 }) +
    letters(c, 26.4, 8.4, 0.85, "2", "#ffffff", { weight: 600 }) + letters(c, 56.4, 8.4, 0.85, "2", "#ffffff", { weight: 600 }),
  doorKinds: { end: ["chair", "chair"], mid: ["bike", ""] },
};
// ODEG: white, the cab yellow, its yellow reaching back along the roof and
// in two fingers above and below the big window, rounded at their ends; a
// teal skirt the whole length; yellow doors; "ODEG" (teal, orange chevrons
// either side) high between the end car's doors, "odeg.de" on the skirt;
// a big bicycle outlined in teal by the bicycle doors.
const OD = { yellow: "#f4b000", teal: "#17675f", white: "#f3f4f3", amber: "#e9a22a", petrol: "#15697a", roof: "#d9dcdd" };
// ODEG's mark: "ODEG" in petrol-blue condensed capitals between two
// "wings" of three amber blades each, stacked and stepping inward
// downward (as on the cabs and the sides; 3462 511, 2024).
const odegMark = (c, x, y, h) => {
  const blade = (side, i) => {
    const yy = (-0.33 + i * 0.33) * h, inner = 1.32 * h + i * 0.04 * h, outer = (2.05 - i * 0.07) * h + i * 0.1 * h, t = 0.11 * h;
    const xi = side * inner, xo = side * (outer - i * 0.08 * h);
    return `<path d="M${n(xi)} ${n(yy - t)}L${n(xo - side * 0.25 * h)} ${n(yy - t)}Q${n(xo)} ${n(yy - t)} ${n(xo + side * 0.05 * h)} ${n(yy - t * 1.4)}Q${n(xo - side * 0.08 * h)} ${n(yy + t)} ${n(xo - side * 0.35 * h)} ${n(yy + t)}L${n(xi + side * 0.08 * h)} ${n(yy + t)}Z" fill="${OD.amber}"/>`;
  };
  let g = txt(0, 0.04 * h, h * 1.15, "ODEG", OD.petrol, { weight: 600, family: "DIN Alternate, DIN Condensed, Arial Narrow, Helvetica Neue, sans-serif", extra: `textLength="${n(h * 2.3)}" lengthAdjust="spacingAndGlyphs"` });
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) g += blade(side, i);
  return mark(c, x, y, g);
};
HCP.odeg = {
  base: OD.white,
  end: (c, L) => {
    let s = rect(-1, -1, L + 2, 20, OD.white) + rect(-1, -1, L + 2, 4.7, OD.teal);
    // The cab yellow to an arc behind the cab, white within it; the yellow
    // over the roof's edge and a finger at the windows' top reaching back
    // to the first door; the yellow under the big window rounding off.
    s += path("M-1 3.7L-1 16L21.6 16L21.6 12.6Q20.0 9.2 21.4 5.8Q26.9 5.9 27.2 3.7Z", OD.yellow);
    s += path("M20.9 9.8L32.2 9.8Q32.8 9.8 32.8 10.3Q32.8 10.8 32.2 10.8L21.0 10.8Z", OD.yellow) + path("M21.2 12.6L32.2 12.6Q33.2 12.8 33.2 14L33.2 16L21.2 16Z", OD.yellow);
    return s;
  },
  mid: (c, L) => rect(-1, -1, L + 2, 20, OD.white) + rect(-1, -1, L + 2, 4.0, OD.teal) + rect(-1, 13.2, L + 2, 6, OD.roof),
  door: (c, d) => plugDoor(c, d, OD.yellow),
  endMarks: (c, L) => odegMark(c, 50.0, 11.4, 1.3) + rect(48.4, 9.2, 3.2, 0.7, "#1b1d20", 0, 'rx="0.1"') + rect(48.7, 9.45, 2.6, 0.2, "#e98a2a") +
    letters(c, 50.0, 3.2, 0.55, "odeg.de", "#ffffff", { weight: 600 }) + circle(16.6, 12.4, 0.35, "#f2a900", 0.3),
  midMarks: (c, L) => mark(c, 14.0, 6.6, PICTO.bike(5.2, OD.teal).replace(/stroke-width="[\d.]+"/g, 'stroke-width="0.55"')),
  doorKinds: { end: ["", ""], mid: ["", ""] },
};
function hcEnd(c, pk, first = false) {
  const L = c.L, P = HCP[pk], lay = HC_END;
  return sec(c, {
    base: P.base, cab: true, truckTop: 3.0, lo: 1.5, hi: HC.roof,
    outline: box(L, { roof: HC.roof, low: 3.0, r: 1.6, nose: HC_NOSE, bottom: [[26.4, 2.4], ["q", 27.0, 2.4, 27.2, 1.6], [72.6, 1.6], ["q", 72.8, 2.4, 73.4, 2.4]] }),
    trucks: [[20.0, 8.2, 36, "car"], [79.4, 8.2, 33, "car"]],
    paint: (cc) => P.end(cc, L, first) + path(poly(HC_SCREEN), C.glass) + path(poly(HC_SCREEN), "none", 0, 'stroke="#15181b" stroke-width="0.3"') +
      path("M1.3 5.4L3.0 9.6L5.2 9.2L3.6 5.2Z", "#1b1d20") + shaped(lay.cabWin),
    wins: lay.wins,
    over: (cc) => P.endMarks(cc, L, first),
    doors: lay.doors, door: (cc, d) => P.door(cc, d, P.doorKinds.end[d.x < 40 ? 0 : 1]),
    under: () => rect(30.0, 1.0, 10.0, 0.7, "#3a3e44", 0.3) + rect(50.0, 1.0, 12.0, 0.7, "#3a3e44", 0.3),
    extra: (cc) => roofCover(19.0, HC.roof, 14.0, 0.5, "#9aa0a6", 3) + hvac(40.0, HC.roof, 10.0, 0.55, "#9aa0a6") + roofCover(56.0, HC.roof, 9.0, 0.5, "#9aa0a6", 2) +
      pantograph(70.0, HC.roof, { up: true, facing: -1 }) + hvLine(73.4, 77.0, HC.roof) +
      coupler(cc, { x: 1.6, y: 2.9, defl: [1.2, 5.6, 1.0, 2.4] }) + lamp(1.5, 5.8, 0.34, 0.45) + lamp(1.5, 5.2, 0.3, 0.3, RED_LAMP) + wiper(5.2, 10.8, 6.6, 12.8),
    gangway: [2.6, 13.4],
  });
}
function hcMid(c, pk) {
  const L = c.L, P = HCP[pk];
  return sec(c, {
    base: P.base, truckTop: 3.4, lo: 1.0, hi: HC.roof,
    outline: box(L, { roof: HC.roof, low: 3.4, r: 1.6, bottom: [[16.8, 3.4], ["q", 17.4, 3.4, 17.6, 1.0], [65.1, 1.0], ["q", 65.3, 3.4, 65.9, 3.4]] }),
    trucks: [[9.0, 8.5, 33, "car"], [L - 9.0, 8.5, 33, "car"]],
    paint: (cc) => P.mid(cc, L),
    wins: HC_MID_WINS,
    over: (cc) => P.midMarks(cc, L),
    doors: HC_MID.doors, door: (cc, d) => P.door(cc, d, P.doorKinds.mid[d.x < 40 ? 0 : 1]),
    under: () => rect(28.0, 0.35, 26.0, 0.6, "#3a3e44", 0.3),
    extra: () => roofCover(2.0, HC.roof, 9.0, 0.45, "#9aa0a6", 2) + roofCover(L - 11.0, HC.roof, 9.0, 0.45, "#9aa0a6", 2),
    gangway: [3.6, 13.6],
  });
}
for (const [pk, name] of [["rrx", "RRX"], ["odeg", "ODEG"]]) {
  const p = pk === "rrx" ? "rrx" : "odHc";
  add(`${p}EndA`, { name: `${name} Desiro HC end car, 1st and 2nd class`, kind: "emu", amenities: ["first"], pan: true }, M((c) => hcEnd(c, pk, true), HC.end, true));
  add(`${p}EndB`, { name: `${name} Desiro HC end car`, kind: "emu", pan: true }, M((c) => hcEnd(c, pk, false), HC.end, true));
  add(`${p}Mid`, { name: `${name} Desiro HC double-deck car`, kind: "bilevel", emu: true }, M((c) => hcMid(c, pk), HC.mid));
}

// ===================== Bombardier Talent 2 =====================
// Articulated, on Jakobs trucks: end cars 20.05 m from the coupler to the
// joint, cars between 16.1 m (three cars 56.2 m, five 88.4 m); 4.26 m
// tall; the floor 695 mm, a high floor (1250 mm) over the motor truck under
// the cab; one double door a side on each car, 1.3 m (de.wikipedia
// "Bombardier Talent 2"). The end car, from the cab: the cab's door, three
// windows over the high floor, the door, three windows; a middle car: a
// window, the door, five windows. Measured off National Express's
// 9442 153/653 at Köln (2025) and 853 at Hamm (2026), Abellio's 9442 305 at
// Leipzig (2023).
const T2 = { end: 65.8, mid: 52.8, roof: 13.98, side: 10.6 };
const T2_NOSE = [[11.2, 13.98], ["q", 7.4, 13.98, 6.2, 12.9], [2.8, 8.2], ["q", 1.1, 6.6, 0.9, 4.8], [0.95, 2.9], [1.8, 2.1]];
const T2_SCREEN = [[2.9, 8.0], [6.2, 12.6], ["q", 7.0, 13.4, 8.4, 13.5], [8.6, 12.7], ["q", 7.6, 12.4, 7.0, 11.6], [4.6, 8.0]];
const T2_END = {
  wins: [[14.0, 19.0, 5.2, 8.9], [20.6, 25.8, 5.2, 8.9], [27.2, 32.4, 5.2, 8.9], [44.0, 49.0, 5.0, 8.7], [50.6, 55.8, 5.0, 8.7], [57.4, 63.2, 5.0, 8.7]],
  cabDoor: { x: 9.2, w: 2.4 }, door: { x: 37.0, w: 4.3, y0: 2.3, y1: 9.2 },
};
const T2_MID = { wins: [[2.2, 9.0], [17.4, 22.6], [24.2, 29.4], [31.0, 36.2], [37.8, 43.0], [44.6, 50.6]].map(([a, b]) => [a, b, 5.0, 8.7]), door: { x: 11.4, w: 4.3, y0: 2.3, y1: 9.2 } };
const T2P = {};
// National Express (NRW, 2015): white; NX blue over the windshield and
// back over the cab's roof, "national express" on the nose; the cars from
// the end car's door back blue from the windows' top down, a white line
// under the windows; thin blue lines slanting over the high floor, each
// ending in a dot; a red line along the top of the side with "national
// express" over it; white doors.
const NX = { blue: "#1f4b9c", white: "#f1f2f0", red: "#d4202c", skirt: "#3a3e44" };
T2P.nx = {
  base: NX.white,
  end: (c, L) => {
    let s = rect(-1, -1, L + 2, 20, NX.white);
    s += path(`M33.0 8.95L${L + 1} 8.95L${L + 1} -1L35.0 -1Q33.6 3.0 33.0 5.0Z`, NX.blue) + rect(33.4, 4.55, L - 32.4, 0.32, NX.white);
    s += path("M-1 13.98L7.6 13.98Q8.6 11.0 6.0 8.6L3.4 6.2L2.4 6.6L5.6 9.8Q7.4 11.9 6.2 13.98Z", NX.blue);
    for (let i = 0; i < 12; i++) {
      const xt = 14.4 + i * 1.55, yb = 2.9 + (i % 4) * 0.5, xb = xt - (10.6 - yb) * 0.3;
      s += line(xt, 10.6, xb, yb, NX.blue, 1.0) + circle(xb, yb, 0.22, NX.blue);
    }
    s += rect(36.0, 9.6, L - 35.0, 0.12, NX.red);
    return s;
  },
  mid: (c, L) => rect(-1, -1, L + 2, 20, NX.white) + rect(-1, -1, L + 2, 9.95, NX.blue) + rect(-1, 4.55, L + 2, 0.32, NX.white) + rect(-1, 9.6, L + 2, 0.12, NX.red),
  door: (c, d) => plugDoor(c, d, "#eef0ef", { frame: "#9aa1a8" }),
  endMarks: (c, L) => letters(c, 3.6, 7.0, 0.5, "national", "#ffffff", { weight: 600 }) + letters(c, 51.0, 10.25, 0.8, "national express", "#6f7fa6", { weight: 400, style: "italic" }) +
    letters(c, 34.6, 8.3, 0.8, "2", "#ffffff", { weight: 600 }),
  midMarks: (c, L) => letters(c, 30.0, 10.25, 0.8, "national express", "#6f7fa6", { weight: 400, style: "italic" }) + letters(c, 16.6, 8.3, 0.8, "2", "#ffffff", { weight: 600 }),
};
// Abellio (Saale-Thüringen-Südharz, 2015): silver, an anthracite band
// through the windows its front edge raked, a red wedge at that edge; a red
// line on the band's top from the door forward to "abellio" in red; red
// doors; first class (white "1") over the high floor behind the cab.
const AB = { silver: "#c9ccce", dark: "#33373b", red: "#e2231a", roof: "#aeb2b5" };
const abellioWord = (c, x, y, h, col = AB.red) => mark(c, x, y, txt(0, 0, h, "abellio", col, { weight: 500, style: "italic", spacing: "-0.01em" }) +
  `<path d="M${n(h * 1.75)} ${n(-h * 0.62)}q${n(h * 0.12)} ${n(-h * 0.14)} ${n(h * 0.26)} 0t${n(h * 0.26)} 0M${n(h * 1.75)} ${n(-h * 0.45)}q${n(h * 0.12)} ${n(-h * 0.14)} ${n(h * 0.26)} 0t${n(h * 0.26)} 0" fill="none" stroke="${col}" stroke-width="${n(h * 0.07)}"/>`);
T2P.abellio = {
  base: AB.silver,
  end: (c, L) => rect(-1, -1, L + 2, 20, AB.silver) + rect(-1, T2.side, L + 2, 6, AB.roof) + path(`M13.6 4.6L${L + 1} 4.6L${L + 1} 10.4L12.4 10.4Z`, AB.dark) +
    path("M12.4 10.4L12.9 10.4L14.6 4.6L13.6 4.6Z", AB.red) + rect(17.6, 10.4, 19.6, 0.5, AB.red),
  mid: (c, L) => rect(-1, -1, L + 2, 20, AB.silver) + rect(-1, T2.side, L + 2, 6, AB.roof) + rect(-1, 4.6, L + 2, 5.8, AB.dark),
  door: (c, d) => plugDoor(c, d, AB.red),
  endMarks: (c, L, first) => abellioWord(c, 14.4, 11.3, 1.25) + (first ? letters(c, 26.0, 8.0, 0.7, "1", "#ffffff", { weight: 600 }) + letters(c, 33.0, 8.0, 0.7, "1", "#ffffff", { weight: 600 }) : "") +
    letters(c, 42.6, 8.0, 0.7, "2", "#ffffff", { weight: 600 }),
  midMarks: (c, L) => letters(c, 17.0, 8.0, 0.7, "2", "#ffffff", { weight: 600 }),
};
function t2End(c, pk, first = false) {
  const L = c.L, P = T2P[pk], lay = T2_END, cd = lay.cabDoor;
  return sec(c, {
    base: P.base, cab: true, truckTop: 2.9, lo: 1.4, hi: T2.roof,
    outline: box(L, { roof: T2.roof, low: 2.6, r: 1.4, nose: T2_NOSE, bottom: [[33.6, 2.1], ["q", 34.2, 2.1, 34.4, 1.5], [L - 0.3, 1.5]] }),
    trucks: [[18.0, 7.5, 33, "car"], [L, 9.2, 30, "car"]],
    paint: (cc) => P.end(cc, L, first) + path(poly(T2_SCREEN), C.glass) + path(poly(T2_SCREEN), "none", 0, 'stroke="#15181b" stroke-width="0.3"') +
      rect(cd.x, 2.8, cd.w, 7.2, "none", 0, 'rx="0.3" stroke="rgba(0,0,0,0.4)" stroke-width="0.1"') + glass(cd.x + 0.6, cd.x + cd.w - 0.6, 6.6, 9.2, 0.3),
    wins: lay.wins.map(([a, b, y0, y1]) => [a, b, y0, y1, 0.5]),
    over: (cc) => P.endMarks(cc, L, first),
    doors: [lay.door], door: (cc, d) => P.door(cc, d),
    under: () => rect(13.6, 1.2, 16.0, 1.1, "#3a3e44", 0.3) + rect(44.0, 0.9, 14.0, 0.7, "#3a3e44", 0.3),
    extra: (cc) => roofCover(9.6, T2.roof, 12.0, 0.9, "#9aa0a6", 3) + roofCover(24.0, T2.roof, 14.0, 0.8, "#9aa0a6", 3) + hvac(46.0, T2.roof, 10.0, 0.6, "#9aa0a6") +
      (first ? pantograph(40.0, T2.roof + 0.8, { up: true, facing: -1 }) : "") +
      coupler(cc, { x: 1.4, y: 2.7, defl: [1.0, 5.2, 0.9, 2.1] }) + lamp(1.1, 5.0, 0.32, 0.45) + lamp(1.1, 4.4, 0.28, 0.3, RED_LAMP) + wiper(4.0, 9.0, 5.6, 11.4),
    gangway: [2.2, 11.6],
  });
}
function t2Mid(c, pk) {
  const L = c.L, P = T2P[pk];
  return sec(c, {
    base: P.base, truckTop: 2.9, lo: 1.4, hi: T2.roof,
    outline: box(L, { roof: T2.roof, low: 1.5, r: 1.4 }),
    trucks: [[L, 9.2, 30, "car"]],
    paint: (cc) => P.mid(cc, L), wins: T2_MID.wins.map(([a, b, y0, y1]) => [a, b, y0, y1, 0.5]),
    over: (cc) => P.midMarks(cc, L), doors: [T2_MID.door], door: (cc, d) => P.door(cc, d),
    under: () => rect(20.0, 0.9, 16.0, 0.6, "#3a3e44", 0.3),
    extra: () => roofCover(20.0, T2.roof, 14.0, 0.7, "#9aa0a6", 3),
    gangway: [2.2, 11.6],
  });
}
for (const [pk, name, p] of [["nx", "National Express", "nx"], ["abellio", "Abellio", "ab"]]) {
  add(`${p}T2EndA`, { name: `${name} Talent 2 end car${pk === "abellio" ? ", 1st and 2nd class" : ""}`, kind: "emu", pan: true, ...(pk === "abellio" ? { amenities: ["first"] } : {}) }, M((c) => t2End(c, pk, true), T2.end, true));
  add(`${p}T2EndB`, { name: `${name} Talent 2 end car`, kind: "emu" }, M((c) => t2End(c, pk, false), T2.end, true));
  add(`${p}T2Mid`, { name: `${name} Talent 2 middle car`, kind: "emu" }, M((c) => t2Mid(c, pk), T2.mid));
}

// ===================== Alstom Coradia LINT =====================
// LINT 41: two cars on a Jakobs truck, 41.81 m, the body 4.0 m high (4.34 m
// over the roof gear), a diesel engine under each car's raised end, the low
// floor (600 or 780 mm) round the one double door a side on each car (the
// geometry of nlregio.cars.js's LINT, from broadside photographs). LINT 54:
// two cars on their own trucks, 54.27 m, 4.31 m tall, the newer crash-proof
// cab (also on LINT 41s built since 2013, class 1648/2648): measured off
// EVB's 554 001 at Cuxhaven (2025, a broadside): the cab's glass wrapping
// back 2.5 m, three big windows over the high floor, the first door 11.2 m
// from the coupler; then a window, the second door, four windows (622 717
// near Braunschweig, 622 716 at Hannover, 2025-2026).
const LT = { car41: 68.7, roof41: 13.1, low41: 1.6, car54: 89.0, roof54: 14.1 };
const LT_NOSE41 = [[7.4, 13.1], [5.6, 12.9], [4.2, 12.3], [3.1, 11.2], [2.3, 9.8], [1.75, 8.2], [1.4, 6.4], [1.25, 4.6], [1.3, 3.0], [1.9, 2.4]];
const LT_SCREEN41 = [[1.75, 8.0], [2.25, 9.6], [3.0, 10.9], [4.1, 11.95], [5.5, 12.5], [6.6, 12.6], [6.6, 8.2]];
const LT_NOSE54 = [[10.6, 14.1], ["q", 8.6, 14.1, 7.4, 13.3], [4.6, 10.4], [2.4, 7.6], ["q", 1.3, 6.2, 1.25, 4.8], [1.3, 2.6], [2.4, 1.5]];
const LT_SCREEN54 = [[2.3, 7.1], [4.5, 10.3], [6.6, 12.3], ["q", 7.6, 12.9, 8.4, 12.7], [8.4, 6.0], [3.2, 6.0]];
const LT_LAY = {
  // LINT 41 (both cars alike): the cab's small window, three windows over
  // the high floor, the door, five.
  41: { wins: [[8.4, 10.8, 6.6, 10.4], [13.6, 18.8], [19.8, 24.6], [25.6, 29.4], [38.8, 43.6], [44.6, 49.4], [50.4, 55.2], [56.2, 61.0], [62.0, 66.4]].map(([a, b, y0 = 5.6, y1 = 10.4]) => [a, b, y0, y1, 0.3]),
    doors: [{ x: 31.4, w: 4.3, y0: 1.9, y1: 10.6 }] },
  // LINT 54 (each car).
  54: { wins: [[13.6, 20.1], [22.1, 28.8], [30.8, 35.4], [43.0, 48.6], [56.4, 63.0], [64.0, 70.6], [71.6, 78.2], [79.2, 85.6]].map(([a, b]) => [a, b, 6.2, 11.6, 0.45]),
    doors: [{ x: 36.7, w: 4.4, y0: 2.6, y1: 10.2 }, { x: 50.4, w: 4.4, y0: 2.6, y1: 10.2 }] },
};
// Paints: body(c, L, k) under the windows, door fill, marks(c, L, k, part)
// on top; k: "41", "41n" (the new cab), "54".
const LTP = {};
// The LNVG's pool (Niedersachsen) as NordWestBahn, erixx and EVB run them:
// a cream cab and roof edge, royal blue sides, a thin yellow line under the
// cream over the windows, a broad yellow band low from behind the cab back,
// a gray skirt; yellow doors. NordWestBahn's: "NWB NordWest Bahn" and "Wir
// sind transdev" on the cab; erixx's: the white "erixx" with its yellow
// horse behind the cab and "#deinelieblingsbahn".
const LN = { cream: "#ece9df", blue: "#24409a", yellow: "#f2c500", skirt: "#8f969c" };
const lnvgBody = (top, low, cabX) => (c, L) => {
  let s = rect(-1, -1, L + 2, 20, LN.blue) + rect(-1, top + 0.45, L + 2, 6, LN.cream) + rect(-1, top + 0.2, L + 2, 0.25, LN.yellow);
  s += path(`M${cabX + 4} 2.6L${L + 1} 2.6L${L + 1} ${low + 0.2}L${cabX + 14} ${low + 0.2}Q${cabX + 8} ${low} ${cabX + 4} 2.6Z`, LN.yellow) + rect(-1, -1, L + 2, 3.2, LN.skirt);
  s += path(`M-1 4.7L-1 20L${cabX + 2.2} 20Q${cabX + 0.4} ${top - 0.5} ${cabX - 1.6} 7.6Q${cabX - 2.8} 5.2 ${cabX - 5.0} 4.7Z`, LN.cream);
  return s;
};
LTP.nwb = { body: { 41: lnvgBody(10.9, 5.1, 9.0), "41n": lnvgBody(11.7, 5.6, 11.2), 54: lnvgBody(12.1, 5.8, 11.4) }, door: LN.yellow,
  marks: (c, L, k) => mark(c, 3.4, 5.2, txt(-0.9, 0, 0.75, "NWB", LN.blue, { weight: 800, style: "italic", anchor: "middle" }) + txt(0.2, -0.2, 0.3, "NordWest", LN.blue, { weight: 500, anchor: "start" }) + txt(0.2, 0.15, 0.3, "Bahn", LN.blue, { weight: 500, anchor: "start" })) +
    letters(c, 3.4, 4.3, 0.28, "Wir sind transdev", "#d4202c", { weight: 500 }) };
const erixxWord = (c, x, y, h, col = "#ffffff") => mark(c, x, y, txt(0, 0, h, "erixx", col, { weight: 500, style: "italic", family: "Georgia, Times New Roman, serif" }) +
  `<path d="M${n(-h * 0.2)} ${n(-h * 0.95)}l${n(h * 0.25)} ${n(-h * 0.35)}l${n(h * 0.3)} ${n(h * 0.05)}l${n(h * 0.2)} ${n(-h * 0.2)}l${n(h * 0.05)} ${n(h * 0.25)}l${n(-h * 0.2)} ${n(h * 0.15)}l${n(-h * 0.1)} ${n(h * 0.3)}l${n(-h * 0.08)} ${n(-h * 0.25)}l${n(-h * 0.25)} ${n(h * 0.25)}Z" fill="${LN.yellow}"/>` +
  `<path d="M${n(-h * 1.1)} ${n(h * 0.62)}Q${n(-h * 0.2)} ${n(h * 0.42)} ${n(h * 0.9)} ${n(h * 0.55)}" fill="none" stroke="${LN.yellow}" stroke-width="${n(h * 0.1)}"/>`);
LTP.erixx = { body: LTP.nwb.body, door: LN.yellow,
  marks: (c, L, k) => erixxWord(c, 13.0, 9.0, 1.3) + letters(c, 18.0, 4.4, 0.5, "#deinelieblingsbahn", "#ffffff", { weight: 500 }) };

// RheinRuhrBahn (Transdev; the former NordWestBahn units of the Niers-
// Rhein-Emscher and Emscher-Münsterland lines): NordWestBahn's paint kept,
// "RheinRuhrBahn" with its arrows on the yellow by the door (648 428 at
// Duisburg, 2024).
LTP.rrb = { body: LTP.nwb.body, door: LN.yellow,
  marks: (c, L, k) => letters(c, 46.0, 4.1, 0.85, "RheinRuhrBahn", LN.blue, { weight: 700 }) +
    mark(c, 53.6, 4.1, [0, 0.9, 1.8].map((dx) => `<path d="M${n(dx)} -0.4L${n(dx + 0.45)} 0L${n(dx)} 0.4" fill="none" stroke="${LN.blue}" stroke-width="0.22"/>`).join("")) };
// AKN (LINT 54, 2015): pale silver, the cab blue and the blue carried back
// over the windows' top half the car's length with "AKN" big in white;
// a red band along the floor, a thin red line under it; red doors; the
// gray skirt; "AKN" blue over a red line on the cab's white face.
const AK = { blue: "#2c5ea8", silver: "#e3e6e8", red: "#e2083a", skirt: "#9ba1a6" };
LTP.akn = { body: { 54: (c, L) => rect(-1, -1, L + 2, 20, AK.silver) + rect(-1, 3.6, L + 2, 0.75, AK.red) + rect(-1, 3.0, L + 2, 0.18, AK.red) + rect(-1, -1, L + 2, 2.6, AK.skirt) +
      path("M-1 2.6L-1 20L46 20L42 11.2L13.6 11.2Q12.4 7.0 9.0 4.4L4.0 3.0L-1 3.0Z", AK.blue) },
  door: AK.red,
  marks: (c, L, k) => mark(c, 30.0, 12.6, txt(0, 0, 2.0, "AKN", "#ffffff", { weight: 800, style: "italic", spacing: "0.04em" })) + mark(c, 21.0, 12.6, [0, 0.55, 1.1, 1.65, 2.2].map((dx, i) => `<rect x="${n(dx - 0.12)}" y="${n(-0.7 + (i % 2) * 0.2)}" width="0.24" height="${n(1.2 - (i % 2) * 0.4)}" fill="#ffffff"/>`).join("")) +
    mark(c, 3.6, 5.0, txt(0, 0, 0.6, "AKN", AK.blue, { weight: 800 }) + `<rect x="-0.6" y="0.38" width="1.2" height="0.1" fill="${AK.red}"/>`) };
// ODEG (LINT 54, class 1622, 2023): the cab and the side forward of the
// first door yellow, the rest white, the teal skirt; yellow doors; ODEG's
// mark on the cab.
LTP.odeg = { body: { 54: (c, L) => rect(-1, -1, L + 2, 20, OD.white) + path("M-1 -1L-1 20L36.2 20L36.2 3.9L-1 3.9Z", OD.yellow) + rect(-1, -1, L + 2, 3.9, OD.teal) + rect(-1, 12.3, L + 2, 6, OD.roof) +
      path("M-1 12.3L-1 20L36.2 20L36.2 12.3Z", OD.yellow) },
  door: OD.yellow, marks: (c, L, k) => odegMark(c, 3.9, 5.2, 0.42) + odegMark(c, 47.0, 12.8, 0.9) };
// Rurtalbahn (LINT 54, 2018): silver-white, a blue band low with a thin
// line over it, the blue round the cab's foot; "Rurtalbahn" (Rur and bahn
// blue, tal red) on the cab and by the doors.
const RT = { white: "#eef0f1", blue: "#1f4f9e", red: "#d7262e" };
const rurtalWord = (c, x, y, h) => mark(c, x, y, `<text x="0" y="${n(h * 0.36)}" font-size="${n(h)}" text-anchor="middle" font-weight="700" font-style="italic" font-family="${SANS}" fill="${RT.blue}">Rur<tspan fill="${RT.red}" font-size="${n(h * 0.8)}">tal</tspan>bahn</text>`);
LTP.rurtal = { body: { 54: (c, L) => rect(-1, -1, L + 2, 20, RT.white) + rect(-1, -1, L + 2, 4.4, RT.blue) + rect(-1, 4.7, L + 2, 0.15, RT.blue) + rect(-1, 12.3, L + 2, 6, "#d5d9dc") },
  door: "#dfe3e6", marks: (c, L, k) => rurtalWord(c, 4.2, 5.4, 0.55) + rurtalWord(c, 46.0, 12.9, 1.0) };
// Erfurter Bahn (the Elster Saale Bahn, LINT 41s bought from the
// Bayerische Regiobahn): green over the windows and low on the side, the
// windows in a white band; the cab green round the windshield, white
// under it; red doors; "ELSTER SAALE BAHN" with its wave and "EB" in green
// and red behind the cab (VT 210, Bad Klosterlausnitz, 2025).
const EB = { green: "#57b947", white: "#f2f4f2", red: "#d22f2a", skirt: "#3e7f39" };
const ebMark = (c, x, y, h) => mark(c, x, y, txt(0, 0, h, "E", EB.green, { weight: 900 }) + txt(h * 0.62, 0, h, "B", EB.red, { weight: 900 }));
LTP.eb = { body: { 41: (c, L) => rect(-1, -1, L + 2, 20, EB.white) + rect(-1, 10.6, L + 2, 6, EB.green) + rect(-1, -1, L + 2, 4.5, EB.green) +
      path("M-1 4.5L-1 10.6L4.0 10.6Q2.4 7.4 2.0 4.5Z", EB.green) },
  door: EB.red, marks: (c, L, k) => ebMark(c, 8.0, 7.6, 1.0) + letters(c, 16.4, 4.9, 0.55, "ELSTER SAALE BAHN", "#1f4f9e", { weight: 600, spacing: "0.04em" }) };

// EVB (Elbe-Weser, the LNVG's pool: the iLints since 2022 and the LINT 41s):
// royal blue, a cream band over the windows to the roof's edge, the cab
// cream; a yellow bar by first class ("1" over it); "evb" big in white low
// on the side; Niedersachsen's horse (554 001 at Cuxhaven, 2025).
LTP.evb = { base: "#1f4fb8", door: "#1f4fb8",
  body: { 54: (c, L) => rect(-1, -1, L + 2, 20, "#1f4fb8") + rect(-1, 11.5, L + 2, 6, "#f3f1e6") + path("M-1 -1L-1 20L10.0 20Q7.6 12.0 6.0 9.0L3.6 4.4L2.4 2.0Z", "#f3f1e6") + rect(L - 4.0, 6.0, 0.9, 7.0, "#f2cf3a"),
    41: (c, L) => rect(-1, -1, L + 2, 20, "#1f4fb8") + rect(-1, 10.9, L + 2, 6, "#f3f1e6") + path("M-1 -1L-1 20L8.0 20Q5.6 12.0 4.0 8.6L2.4 4.4L1.6 2.0Z", "#f3f1e6") },
  marks: (c, L, k) => mark(c, 26.0, 3.4, txt(0, 0, 2.0, "evb", "#ffffff", { weight: 900, style: "italic" })) + nds(c, 12.0, 3.4, 0.9) };

// Bentheimer Eisenbahn (LINT 41 with the new cab, 2019): the cab silver-
// white, the side white over the windows, sky blue below with darker blue
// sweeps; white doors; "BENTHEIMER
// EISENBAHN" on the cab's side (VT 115, Quendorf).
LTP.beb = { base: "#2a9ae0", door: "#f2f4f5",
  body: { "41n": (c, L) => rect(-1, -1, L + 2, 20, "#2a9ae0") + rect(-1, 11.0, L + 2, 6, "#eef0f1") + rect(-1, -1, L + 2, 2.8, "#9aa1a6") +
    path("M-1 3.0Q14 6.0 22 3.0L22 5.0Q14 8.0 -1 5.0Z", "#1f6fc0") + path("M-1 -1L-1 20L9.4 20L9.4 11.0Q8.0 6.0 8.6 2.4L8.6 -1Z", "#eef0f1") + rect(-1, -1, 10, 2.8, "#9aa1a6") },
  marks: (c, L, k) => letters(c, 15.5, 4.2, 0.5, "BENTHEIMER EISENBAHN", "#ffffff", { weight: 700 }) };
function lintCar(c, k, pk, { first = false } = {}) {
  const L = c.L, P = LTP[pk], lay = LT_LAY[k === "54" ? 54 : 41], is54 = k === "54", newCab = k !== "41";
  const roof = is54 ? LT.roof54 : LT.roof41;
  const nose = newCab ? LT_NOSE54.map(([a, b, cc, d, e]) => (a === "q" ? ["q", b, Math.min(cc, roof), d, Math.min(e, roof)] : [a, Math.min(b, roof)])) : LT_NOSE41;
  const screen = newCab ? LT_SCREEN54 : LT_SCREEN41;
  const bottom = is54 ? [[2.4, 1.5], [L - 0.3, 1.5]] : [[2.4, 2.5], [21.0, 2.5], ["q", 22.0, 2.5, 22.4, 1.6], [56.0, 1.6], ["q", 57.0, 1.6, 57.4, 2.5]];
  const wins = newCab && !is54 ? lay.wins.slice(1) : is54 ? lay.wins : lay.wins;
  return sec(c, {
    base: P.base || LN.blue, cab: true, truckTop: 2.9, lo: 1.2, hi: roof,
    outline: box(L, { roof, low: is54 ? 1.5 : 2.5, r: 0.8, nose, bottom: is54 ? null : bottom.slice(1) }),
    trucks: is54 ? [[13.6, 6.2, 30.3, "car"], [L - 9.0, 6.2, 30.3, "car"]] : [[13.0, 6.2, 30.3, "car"], [L, 8.86, 30.3, "car"]],
    paint: (cc) => P.body[k](cc, L) + path(poly(screen.map(([a, b, d, e, f]) => (a === "q" ? ["q", b - 0.25, d + 0.2, e - 0.25, f + 0.2] : [a - 0.25, b + (b > 11 ? 0.25 : -0.3)]))), "#16191c") + path(poly(screen), C.glass),
    wins, over: (cc) => P.marks(cc, L, k) + (lay.doors.map((d) => letters(cc, d.x - 1.0, 11.0, 0.8, "2", "#ffffff", { weight: 600 })).join("")),
    doors: lay.doors, door: (cc, d) => plugDoor(cc, d, P.door),
    under: () => (is54 ? rect(20.0, 0.9, 12.0, 0.8, "#3a3e44", 0.3) + rect(58.0, 0.9, 14.0, 0.8, "#3a3e44", 0.3) : rect(5.0, 1.4, 5.5, 1.0, "#3a3e44", 0.4) + rect(58.0, 1.6, 7.0, 1.0, "#3a3e44", 0.4)),
    extra: (cc) => roofCover(4.5, roof, 8.0, 0.8, "#a9aeb3", 2) + hvac(is54 ? 30.0 : 22.0, roof, 9.0, 0.7, "#9aa0a6") + roofCover(is54 ? 72.0 : 56.0, roof, 9.0, 0.8, "#a9aeb3", 2) +
      rect(is54 ? 68.5 : 52.5, roof, 0.5, 1.2, "#5a4a3a") + coupler(cc, { x: 1.4, y: 3.0, defl: [1.0, 5.6, 1.0, 2.4] }) + lamp(1.3, 5.2, 0.32, 0.45) + lamp(1.3, 4.5, 0.26, 0.3, RED_LAMP) +
      wiper(newCab ? 3.4 : 2.2, newCab ? 8.6 : 9.0, newCab ? 4.8 : 3.2, newCab ? 10.6 : 10.8),
    gangway: [1.6, 12.3],
  });
}
const LINT_UNITS = [["nwb", "41", "NordWestBahn"], ["nwb", "41n", "NordWestBahn"], ["erixx", "54", "erixx"], ["rrb", "41", "RheinRuhrBahn"], ["akn", "54", "AKN"], ["odeg", "54", "ODEG"], ["rurtal", "54", "Rurtalbahn"], ["eb", "41", "Erfurter Bahn"], ["evb", "54", "EVB Coradia iLint (554)"], ["evb", "41", "EVB"], ["beb", "41n", "Bentheimer Eisenbahn"]];
for (const [pk, k, name] of LINT_UNITS) {
  const len = k === "54" ? LT.car54 : LT.car41, label = k === "54" ? "LINT 54" : k === "41n" ? "LINT 41 (new cab)" : "LINT 41";
  add(`${pk}Lint${k}`, { name: `${name} ${label} car`, kind: "emu" }, M((c) => lintCar(c, k, pk), len, true));
}

// ===================== Bombardier Talent (class 643) =====================
// Three cars on Jakobs trucks, 48.4-52.2 m (de.wikipedia "Bombardier
// Talent"): end cars about 17.3 m from the coupler to the joint, the middle
// car 13.8 m; diesel-hydraulic, the motor truck under the high-floored cab
// end, the floor low (590 mm) round the doors: one double door a side on
// each end car, near the joint, and one at each end of the middle car.
// Layout off NordWestBahn's 643 317 (Altenbeken, 2026) and eurobahn's
// VT 2.05 (Bielefeld, 2023).
const TA = { end: 56.8, mid: 45.2, roof: 12.6 };
const TA_NOSE = [[7.4, 12.6], ["q", 4.8, 12.6, 3.8, 11.0], [1.9, 8.4], ["q", 0.7, 6.6, 0.65, 4.6], [0.65, 3.2], [1.2, 2.2], [2.4, 1.9]];
const TA_SCREEN = [[2.1, 8.2], [3.7, 10.6], ["q", 4.6, 11.8, 6.2, 12.0], [6.6, 11.3], ["q", 5.4, 11.0, 4.9, 10.0], [3.6, 7.7]];
const TA_END = { wins: [[20.6, 26.8], [28.0, 34.2], [35.4, 40.6], [47.8, 55.2]].map(([a, b]) => [a, b, 6.4, 10.4, 0.4]), door: { x: 42.0, w: 4.3, y0: 2.0, y1: 9.8 } };
const TA_MID = { wins: [[7.6, 13.6], [14.8, 20.8], [24.4, 30.4], [31.6, 37.6]].map(([a, b]) => [a, b, 6.4, 10.4, 0.4]), doors: [{ x: 1.8, w: 4.3, y0: 2.0, y1: 9.8 }, { x: 39.1, w: 4.3, y0: 2.0, y1: 9.8 }] };
const TAP = {};
// NordWestBahn: blue, the windows in a black band, a white band over the
// roof's edge sweeping down round the windshield to the nose's foot, the
// nose blue ahead of it; yellow doors;
// "NordWestBahn" big in white low on the end cars (643 317, 2026).
// RheinRuhrBahn's ex-NordWestBahn Talents: the same, "RheinRuhrBahn".
const taBody = (lo, band, top, sweep, stripe = null) => (c, L, cab) => {
  let s = rect(-1, -1, L + 2, 20, lo) + rect(-1, 6.1, L + 2, 4.8, band) + rect(-1, 10.9, L + 2, 6, top) + (stripe ? rect(-1, 10.9, L + 2, 0.75, stripe) : "");
  // The cab: the body color ahead of a band (sweep) that runs from the
  // roof's edge down round the windshield to the nose's foot; the side's
  // dark window band starts behind it.
  if (cab) s += path("M-1 -1L-1 20L16 20L16 11.8L8.2 11.8Q3.0 9.8 1.0 3.4L1.0 -1Z", lo) +
    path("M1.0 3.4Q3.0 9.8 8.2 11.8L16 11.8L16 10.9L10.0 10.9Q4.8 9.4 3.0 3.4Z", sweep);
  return s;
};
TAP.nwb = { base: LN.blue, body: taBody(LN.blue, "#23272d", "#e9ebec", "#e9ebec"), door: LN.yellow,
  marks: (c, L, cab) => (cab ? letters(c, 34.0, 4.7, 1.25, "NordWestBahn", "#ffffff", { weight: 700, spacing: "-0.02em" }) : "") };
TAP.rrb = { ...TAP.nwb, marks: (c, L, cab) => (cab ? letters(c, 34.0, 4.7, 1.1, "RheinRuhrBahn", "#ffffff", { weight: 700 }) : "") };
// eurobahn: silver, the windows in a black band, an amber band over the
// roof's edge sweeping down round the windshield; amber doors; "eurobahn"
// in blue over two teal lines behind the cab (VT 2.05, Bielefeld, 2023).
const EBn = { silver: "#c8cbcd", black: "#23242a", amber: "#f2a51c", blue: "#203a7a", teal: "#1fa59a" };
const eurobahnWord = (c, x, y, h) => mark(c, x, y, txt(0, 0, h, "eurobahn", EBn.blue, { weight: 500 }) +
  `<rect x="${n(-h * 2.0)}" y="${n(h * 0.62)}" width="${n(h * 4.0)}" height="${n(h * 0.1)}" fill="${EBn.teal}"/><rect x="${n(-h * 1.95)}" y="${n(h * 0.85)}" width="${n(h * 3.9)}" height="${n(h * 0.1)}" fill="${EBn.teal}"/>`);
TAP.eurobahn = { base: EBn.silver, body: taBody(EBn.silver, EBn.black, "#c4c7c9", EBn.amber, EBn.amber), door: EBn.amber,
  marks: (c, L, cab) => (cab ? eurobahnWord(c, 16.0, 4.6, 1.45) : "") };
// MRB (Transdev, Leipzig-Grimma-Döbeln): silver, the windows in a dark gray
// band, ochre doors; "MRB Mitteldeutsche Regiobahn" and "Wir sind transdev"
// behind the cab (VT 0012, Leipzig, 2024).
TAP.mrb = { base: "#c9ccce", body: (c, L, cab) => rect(-1, -1, L + 2, 20, "#c9ccce") + rect(-1, 6.1, L + 2, 4.8, "#5a5f64") + rect(-1, 10.9, L + 2, 6, "#d5d8da"), door: "#e8b21c",
  marks: (c, L, cab) => (cab ? mark(c, 14.0, 4.8, txt(-1.6, 0, 1.1, "MRB", "#1f4f9e", { weight: 800 }) + `<rect x="-3.2" y="0.55" width="3.2" height="0.12" fill="#d4202c"/>` +
    txt(0.4, -0.2, 0.36, "Mitteldeutsche", "#1f4f9e", { weight: 500, anchor: "start" }) + txt(0.4, 0.25, 0.36, "Regiobahn", "#1f4f9e", { weight: 500, anchor: "start" })) +
    letters(c, 14.0, 3.3, 0.36, "Wir sind transdev", "#d4202c", { weight: 500 }) : "") };
function talentCar(c, pk, part) {
  const L = c.L, P = TAP[pk], cab = part === "end", lay = cab ? TA_END : TA_MID;
  return sec(c, {
    base: P.base, cab, truckTop: 2.6, lo: 1.2, hi: TA.roof,
    outline: box(L, { roof: TA.roof, low: cab ? 2.6 : 1.9, r: 1.0, nose: cab ? TA_NOSE : null, bottom: cab ? [[19.0, 2.6], ["q", 19.6, 2.6, 19.8, 1.9], [L - 0.3, 1.9]] : null }),
    trucks: cab ? [[11.8, 8.2, 30, "car"], [L, 8.9, 27, "car"]] : [[L, 8.9, 27, "car"]],
    paint: (cc) => P.body(cc, L, cab) + (cab ? path(poly(TA_SCREEN), C.glass) + path(poly(TA_SCREEN), "none", 0, 'stroke="#15181b" stroke-width="0.3"') : ""),
    wins: lay.wins, over: (cc) => P.marks(cc, L, cab) + letters(cc, cab ? 41.0 : 22.6, 9.6, 0.75, "2", "#ffffff", { weight: 600 }),
    doors: cab ? [lay.door] : lay.doors, door: (cc, d) => plugDoor(cc, d, P.door),
    under: () => (cab ? rect(4.0, 1.4, 4.0, 1.0, "#3a3e44", 0.3) + rect(15.0, 1.6, 4.0, 1.0, "#3a3e44", 0.3) : rect(12.0, 1.0, 20.0, 0.9, "#3a3e44", 0.3)),
    extra: (cc) => (cab ? roofCover(9.0, TA.roof, 10.0, 0.7, "#9aa0a6", 2) + rect(15.5, TA.roof, 0.5, 1.1, "#5a4a3a") + coupler(cc, { x: 1.2, y: 2.8, defl: [0.8, 4.4, 0.9, 2.0] }) +
      lamp(0.9, 4.6, 0.3, 0.4) + lamp(0.9, 4.0, 0.26, 0.28, RED_LAMP) + wiper(2.8, 8.6, 4.2, 10.4) : hvac(16.0, TA.roof, 12.0, 0.6, "#9aa0a6")),
    gangway: [1.9, 11.4],
  });
}
for (const [pk, name] of [["nwb", "NordWestBahn"], ["rrb", "RheinRuhrBahn"], ["eurobahn", "eurobahn"], ["mrb", "MRB"]]) {
  add(`${pk}TalEnd`, { name: `${name} Talent (643) end car`, kind: "emu" }, M((c) => talentCar(c, pk, "end"), TA.end, true));
  add(`${pk}TalMid`, { name: `${name} Talent (643) middle car`, kind: "emu" }, M((c) => talentCar(c, pk, "mid"), TA.mid));
}

// ===================== Stadler FLIRT (first generation) =====================
// The geometry of sbbregio.cars.js's FLIRT (measured there off rectified
// photographs): end cars 20.94 m from the coupler to the Jakobs truck's
// middle, the cars between 16.1 m (three cars 57.9 m, four 74.1 m, five
// 90.2 m); 4.1 m tall; floor 0.57 m at the doors. The German units'
// layouts (eurobahn's ET 5.22 at Nienburg, 2026; cantus's 427 051 at
// Göttingen, 2024): the end car's hatch behind the cab, two windows, its
// one door, four windows; a middle car's one door in its middle.
const FL1 = { end: 68.7, mid: 52.82, sill: 1.45, roof: 13.45, skirt: 2.75, bandLo: 5.55, bandHi: 9.35, winLo: 4.25, winHi: 9.25, stripeLo: 12.4, stripeHi: 12.95 };
const FL1_NOSE = [[7.6, 13.45], ["q", 5.8, 13.45, 5.05, 12.2], [1.45, 6.55], ["q", 0.85, 5.6, 0.75, 4.3], [0.8, 2.15], [1.45, 1.45]];
const FL1_END = { hatch: [13.2, 17.3], wins: [[19.5, 24.5, 6.1], [25.25, 30.6], [37.6, 42.8], [43.4, 48.7], [49.3, 54.6], [55.2, 60.5], [61.4, 66.2, FL1.bandLo + 0.05]], door: 31.3 };
const FL1_MID = { wins: [[2.8, 8.1, FL1.bandLo + 0.05], [8.7, 14.0], [14.6, 19.9], [20.4, 23.4]].flatMap((w) => [w, [FL1.mid - w[1], FL1.mid - w[0], w[2]]]), door: 23.6 };
const FL1P = {};
// eurobahn (ET 5.xx-7.xx): light silver, the windows in a black band with
// an amber line along its top, an amber band along the roof's edge that
// sweeps down the cab's corner round the windshield to the lamp; amber
// doors; "eurobahn" (blue, two teal lines) behind the cab; first class
// ("1") between the end car's door and the cab.
FL1P.eurobahn = { base: "#d9dbdb",
  paint: (c, L, cab) => {
    let s = rect(-1, -1, L + 2, 20, "#d9dbdb") + rect(-1, FL1.stripeHi, L + 2, 4, "#c3c6c8") + rect(-1, FL1.stripeLo, L + 2, FL1.stripeHi - FL1.stripeLo, EBn.amber);
    // The first-class windows (behind the cab, to the door) in a black band
    // with an amber line on it; the others separate.
    if (cab) s += rect(18.6, FL1.bandLo - 1.1, 12.4, FL1.bandHi - FL1.bandLo + 1.1, "#25262b") + rect(18.6, FL1.bandHi, 12.4, 0.35, EBn.amber);
    if (cab) s += path(`M1.0 5.4Q2.4 6.0 3.4 7.8L5.0 10.8Q6.0 12.3 8.2 ${FL1.stripeLo}L14 ${FL1.stripeLo}L14 ${FL1.stripeHi}L7.8 ${FL1.stripeHi}Q5.2 12.9 4.2 11.2L2.4 8.0Q1.6 6.6 0.9 6.4Z`, EBn.amber);
    return s;
  },
  door: EBn.amber, marks: (c, L, cab, first) => (cab ? eurobahnWord(c, 14.6, 10.2, 1.1) + letters(c, 30.0, 8.6, 0.8, first ? "1" : "2", "#ffffff", { weight: 600 }) + letters(c, 37.6, 8.6, 0.8, "2", "#1d1f22", { weight: 600 }) : "") };
// The WestfalenBahn's paint (eurobahn's ET 8.xx and 9.xx, ex-WestfalenBahn,
// relettered): light blue, the cab lime green back past its side window,
// a white panel behind it with "eurobahn"; light blue doors; an amber
// "1. Klasse" band under the first-class windows (ET 9.05, Nienburg, 2026).
FL1P.wfbe = { base: "#2c9fd8",
  paint: (c, L, cab) => {
    let s = rect(-1, -1, L + 2, 20, "#2c9fd8") + rect(-1, FL1.stripeHi, L + 2, 4, "#bfc4c8");
    if (cab) s += path("M-1 -1L-1 20L15.2 20L15.2 3.0Q14.4 1.6 13.0 1.4L-1 1.4Z", "#d6e45a") + path("M15.2 9.6L22.0 9.6Q23.0 9.6 23.2 10.6L23.2 13.2L15.2 13.2Z", "#f4f6f6") + rect(19.5, 3.6, 11.0, 0.9, "#f0a53a");
    return s;
  },
  door: "#2c9fd8", marks: (c, L, cab) => (cab ? eurobahnWord(c, 19.0, 11.6, 0.8) + letters(c, 25.0, 4.05, 0.55, "1. Klasse", "#ffffff", { weight: 600 }) : "") };
// cantus: royal blue, a silver band through the windows, an orange line
// over it carried round the cab's corner and up over the windshield; blue
// doors; "cantus" in gray behind the cab (427 051, 427 056, 2024).
FL1P.cantus = { base: "#1f3f9a",
  paint: (c, L, cab) => {
    const top = 11.4, lo = 3.2, OR = "#f08a24";
    let s = rect(-1, -1, L + 2, 20, "#1f3f9a");
    if (cab) {
      // The silver panel from behind the hatch, its front edge a big
      // curve outlined in orange; the orange sweeping from over the cab's
      // door down the windshield's edge to the nose under it.
      s += path(`M${L + 1} ${top}L16.0 ${top}Q12.4 ${top} 12.0 7.4Q11.8 4.2 13.6 ${lo}L${L + 1} ${lo}Z`, OR);
      s += path(`M${L + 1} ${top - 0.45}L16.0 ${top - 0.45}Q12.9 ${top - 0.45} 12.5 7.4Q12.3 4.4 14.0 ${lo}L${L + 1} ${lo}Z`, "#cfd3d6");
      s += path(`M10.0 13.45L13.6 13.45Q8.8 13.2 6.2 10.6L3.4 7.0Q2.6 5.6 2.8 4.0L1.0 3.6L0.8 5.6Q1.6 7.2 2.6 8.4L5.0 11.6Q7.0 13.45 10.0 13.45Z`, OR);
    } else s += rect(-1, lo, L + 2, top - lo, OR) + rect(-1, lo, L + 2, top - 0.45 - lo, "#cfd3d6");
    return s;
  },
  door: "#2a4aa6", marks: (c, L, cab) => (cab ? mark(c, 23.4, 5.0, txt(0, 0, 1.0, "cantus", "#5c6f8f", { weight: 500 }) + txt(0.3, 0.75, 0.3, "Verkehrsgesellschaft", "#5c6f8f", { weight: 500 })) : "") };
function flirt1Car(c, pk, part, { first = false, pan = false } = {}) {
  const L = c.L, P = FL1P[pk], cab = part === "end", lay = cab ? FL1_END : FL1_MID;
  const wins = lay.wins.map(([a, b, lo = FL1.winLo]) => [a, b, lo, FL1.winHi, 0.45]);
  return sec(c, {
    base: P.base, cab, truckTop: FL1.sill + 0.2, lo: 1.0, hi: FL1.roof,
    outline: box(L, { roof: FL1.roof, low: FL1.sill, r: 0.9, nose: cab ? FL1_NOSE : null }),
    trucks: cab ? [[14.0, 8.86, 34, "car"], [L, 8.86, 30, "car"]] : [[L, 8.86, 30, "car"]],
    paint: (cc) => {
      let s = P.paint(cc, L, cab) + rect(-1, -1, L + 2, FL1.skirt, "#55595e");
      if (cab) s += path(poly([[1.3, 6.4], [1.75, 6.55], [5.4, 12.2], ["q", 6.3, 13.2, 8.2, 13.25], [8.2, 14], [-1, 14]]), "#1b1d20") +
        path(poly([[2.65, 6.5], ["q", 3.0, 6.12, 3.9, 6.1], [9.55, 6.1], [9.55, 9.5], ["q", 9.55, 9.72, 9.3, 9.72], [4.75, 9.7]]), "#1b1d20") +
        path(poly([[3.2, 6.55], ["q", 3.4, 6.35, 3.95, 6.33], [7.0, 6.33], [7.0, 9.45], [4.85, 9.45]]), C.glass) + glass(7.3, 9.3, 6.33, 9.45, 0.3) +
        rect(lay.hatch[0], 4.35, lay.hatch[1] - lay.hatch[0], 3.55, "none", 0, 'rx="0.55" stroke="#9aa0a7" stroke-width="0.12"');
      return s;
    },
    wins, over: (cc) => P.marks(cc, L, cab, first),
    doors: [{ x: lay.door, w: 5.6, y0: FL1.sill + 0.05, y1: FL1.bandHi }], door: (cc, d) => plugDoor(cc, d, P.door),
    extra: (cc) => roofCover(cab ? 18.5 : 19.5, FL1.roof, cab ? 18.5 : 13.5, 0.4, "#9aa0a6", 3) + (cab ? hvac(43.0, FL1.roof, 12.0, 0.5, "#9aa0a6") : "") +
      (pan ? pantograph(L - 9.0, FL1.roof, { up: true, facing: -1 }) : "") +
      (cab ? coupler(cc, { x: 1.2, y: 2.6, defl: [1.1, 5.4, 0.7, 1.45] }) + lamp(1.1, 5.4, 0.36, 0.42) + lamp(0.9, 4.8, 0.3, 0.28, RED_LAMP) + wiper(2.4, 8.0, 3.6, 10.4) : ""),
    gangway: [1.6, 12.4],
  });
}
for (const [pk, name] of [["eurobahn", "eurobahn"], ["wfbe", "eurobahn (WestfalenBahn paint)"], ["cantus", "cantus"]]) {
  add(`${pk}F1EndA`, { name: `${name} FLIRT end car, 1st and 2nd class`, kind: "emu", amenities: ["first"] }, M((c) => flirt1Car(c, pk, "end", { first: true }), FL1.end, true));
  add(`${pk}F1EndB`, { name: `${name} FLIRT end car`, kind: "emu" }, M((c) => flirt1Car(c, pk, "end"), FL1.end, true));
  add(`${pk}F1Mid`, { name: `${name} FLIRT middle car`, kind: "emu" }, M((c) => flirt1Car(c, pk, "mid"), FL1.mid));
  add(`${pk}F1MidP`, { name: `${name} FLIRT middle car with the pantograph`, kind: "emu", pan: true }, M((c) => flirt1Car(c, pk, "mid", { pan: true }), FL1.mid));
}

// ===================== Alstom Coradia Continental (class 1440) =====================
// The crash-proof cab (EN 15227) of the 1440s: end cars 20.25 m from the
// coupler to the Jakobs truck's middle, the cars between 16.4 m (three
// cars 56.9 m, four 73.3 m, five 89.7 m; de.wikipedia "Alstom Coradia
// Continental"); 4.28 m tall; floor 730 mm, 610 mm at the doors. The end
// car, from the cab: the cab's door (two windows), a hatch, two windows,
// the passenger door, four windows; a middle car three windows, the door,
// four. Off enno's 1440 108 (Hannover, 2025) and MRB's 1440 4xx (Leipzig,
// 2026).
const CC = { end: 66.4, mid: 53.8, roof: 13.9, low: 1.6 };
const CC_NOSE = [[12.4, 13.9], ["q", 9.2, 13.9, 7.6, 12.6], [4.2, 9.2], ["q", 2.2, 7.4, 1.5, 5.4], [1.3, 3.0], [2.2, 1.6]];
const CC_SCREEN = [[3.6, 9.0], [6.8, 12.0], ["q", 7.9, 13.0, 9.4, 13.1], [9.6, 12.4], ["q", 8.2, 11.9, 7.4, 10.8], [5.0, 8.4]];
const CC_END = { wins: [[19.4, 24.8], [25.8, 31.2], [39.8, 45.2], [46.2, 51.6], [52.6, 58.0], [59.0, 64.4]].map(([a, b]) => [a, b, 5.3, 9.9, 0.45]), door: { x: 32.8, w: 5.2, y0: 2.0, y1: 10.4 } };
const CC_MID = { wins: [[1.8, 7.2], [8.2, 13.6], [14.6, 20.0], [28.6, 34.0], [35.0, 40.4], [41.4, 46.8], [47.8, 52.2]].map(([a, b]) => [a, b, 5.3, 9.9, 0.45]), door: { x: 21.6, w: 5.2, y0: 2.0, y1: 10.4 } };
const CCP = {};
// enno (Metronom, Großraum Braunschweig's pool, 2015-2026): graphite gray,
// a white band along the roof's edge running down over the cab's nose;
// traffic purple from roof to skirt round the reservation compartment
// behind the cab (a white "R" in a ring) and the bicycle area of a middle
// car; light gray doors; "enno" (its n's in circles) on the nose and low on
// the cars, "von metronom"; Niedersachsen's horse on the cab.
const EN = { graphite: "#454a53", purple: "#a3368f", white: "#eef0f1", door: "#d5d9dc" };
const ennoWord = (c, x, y, h, ink = "#3a3f47") => mark(c, x, y, [["e", -1.35], ["n", -0.45], ["n", 0.45], ["o", 1.35]].map(([ch, dx], i) =>
  `<circle cx="${n(dx * h)}" cy="0" r="${n(h * 0.46)}" fill="${i === 2 ? EN.purple : i === 1 ? "#8a2b77" : "#ffffff"}" stroke="${ink}" stroke-width="${n(h * 0.04)}"/>` + txt(dx * h, -0.04 * h, h * 0.75, ch, i === 1 || i === 2 ? "#ffffff" : ink, { weight: 600 })).join("") +
  txt(0.7 * h, 0.85 * h, 0.25 * h, "von metronom", "#ffffff", { weight: 500 }));
// Niedersachsen's mark: the white leaping horse (the Sachsenross) on a red
// shield, "Niedersachsen" beside it; h the shield's height.
const ROSS = "M-0.3 0.38L-0.2 0.08L-0.32 -0.06L-0.18 -0.12L0.0 -0.02L0.16 -0.22L0.1 -0.36L0.26 -0.3L0.3 -0.12L0.2 0.06L0.3 0.2L0.2 0.24L0.08 0.08L-0.06 0.1L-0.14 0.38Z";
const nds = (c, x, y, h) => mark(c, x, y, `<path d="M0 ${n(-h / 2)}L${n(h * 0.8)} ${n(-h / 2)}L${n(h * 0.8)} ${n(h * 0.15)}Q${n(h * 0.8)} ${n(h / 2)} ${n(h * 0.4)} ${n(h / 2)}Q0 ${n(h / 2)} 0 ${n(h * 0.15)}Z" fill="#d7262e"/>` +
  `<path d="${ROSS}" transform="translate(${n(h * 0.4)} 0) scale(${n(h)})" fill="#ffffff"/>` + txt(h * 1.0, 0, h * 0.62, "Niedersachsen", "#ffffff", { weight: 500, anchor: "start" }));
CCP.enno = { base: EN.graphite,
  paint: (c, L, cab) => {
    let s = rect(-1, -1, L + 2, 20, EN.graphite) + rect(-1, 12.0, L + 2, 6, EN.white);
    if (cab) s += path("M-1 3.0L-1 20L13.0 20Q9.6 12.0 7.6 9.0Q6.0 6.6 5.0 4.6L3.4 3.0Z", EN.white) + path("M-1 2.2L-1 5.6Q2.4 5.0 4.6 4.2L3.0 2.2Z", EN.graphite) + rect(18.0, 1.6, 14.4, 10.4, EN.purple);
    else s += rect(8.0, 1.6, 12.8, 10.4, EN.purple);
    return s;
  },
  door: EN.door,
  marks: (c, L, cab) => (cab ? ennoWord(c, 3.6, 6.0, 1.0) + nds(c, 11.0, 3.4, 1.1) + mark(c, 23.6, 10.6, `<circle cx="0" cy="0" r="1.45" fill="none" stroke="#ffffff" stroke-width="0.16"/>` + txt(0, 0.02, 1.7, "R", "#ffffff", { weight: 400 })) +
    ennoWord(c, 44.0, 4.2, 1.5) : picto(c, "bike", 14.4, 3.8, 2.6, "#ffffff") + ennoWord(c, 36.0, 4.2, 1.5)) };
// MRB (Transdev, the Mittelsachsen pool's EMUs and the battery units of
// Leipzig-Chemnitz): silver, the windows framed singly, the first-class
// windows outlined in yellow; green doors; "MRB Mitteldeutsche Regiobahn"
// and "Wir sind transdev" low behind the cab.
CCP.mrb = { base: "#cdd1d4",
  // The windows in one dark band; the first class's with a yellow line on
  // its top.
  paint: (c, L, cab) => rect(-1, -1, L + 2, 20, "#cdd1d4") + rect(-1, 12.0, L + 2, 6, "#dfe2e4") + rect(-1, -1, L + 2, 2.6, "#3a3e44") +
    rect(cab ? 18.8 : -1, 4.9, L + 2, 5.4, "#2a2d31") + (cab ? path("M-1 3.0L-1 20L11.6 20Q9.0 13.0 7.2 9.6Q5.6 6.8 4.6 4.6L3.4 3.0Z", "#e6e8e9") + (c.second ? "" : rect(18.8, 10.3, 13.6, 0.35, "#f2c500")) : ""),
  door: "#2f9e4f",
  marks: (c, L, cab) => (cab ? mark(c, 13.6, 4.0, txt(-1.6, 0, 1.1, "MRB", "#1f4f9e", { weight: 800 }) + `<rect x="-3.2" y="0.55" width="3.2" height="0.12" fill="#d4202c"/>` +
    txt(0.4, -0.2, 0.36, "Mitteldeutsche", "#1f4f9e", { weight: 500, anchor: "start" }) + txt(0.4, 0.25, 0.36, "Regiobahn", "#1f4f9e", { weight: 500, anchor: "start" })) +
    letters(c, 13.6, 2.95, 0.34, "Wir sind transdev", "#d4202c", { weight: 500 }) + letters(c, 26.0, 9.2, 0.75, "1", "#1d1f22", { weight: 600 }) : "") };
function ccCar(c, pk, part, { pan = false, battery = false, second = false } = {}) {
  const L = c.L, P = CCP[pk], cab = part === "end", lay = cab ? CC_END : CC_MID;
  return sec(c, {
    base: P.base, cab, truckTop: 2.4, lo: 1.0, hi: CC.roof,
    outline: box(L, { roof: CC.roof, low: CC.low, r: 1.0, nose: cab ? CC_NOSE : null }),
    trucks: cab ? [[13.6, 8.0, 33, "car"], [L, 8.86, 30, "car"]] : [[L, 8.86, 30, "car"]],
    paint: (cc) => P.paint({ ...cc, second }, L, cab) + (cab ? path(poly(CC_SCREEN), C.glass) + path(poly(CC_SCREEN), "none", 0, 'stroke="#15181b" stroke-width="0.3"') +
      rect(9.8, 2.4, 2.6, 8.4, "none", 0, 'rx="0.3" stroke="rgba(0,0,0,0.45)" stroke-width="0.1"') + glass(10.4, 11.8, 7.8, 10.0, 0.4) + glass(10.4, 11.8, 4.6, 6.8, 0.4) +
      rect(14.0, 5.6, 3.0, 2.0, "none", 0, 'rx="0.2" stroke="rgba(0,0,0,0.35)" stroke-width="0.08"') : ""),
    wins: lay.wins, over: (cc) => P.marks(cc, L, cab),
    doors: [lay.door], door: (cc, d) => plugDoor(cc, d, P.door),
    under: () => (cab ? rect(20.0, 0.8, 10.0, 0.8, "#3a3e44", 0.3) + rect(40.0, 0.8, 14.0, 0.8, "#3a3e44", 0.3) : rect(10.0, 0.8, 30.0, 0.7, "#3a3e44", 0.3)),
    extra: (cc) => (cab ? roofCover(14.0, CC.roof, 14.0, 0.6, "#9aa0a6", 3) + hvac(40.0, CC.roof, 11.0, 0.6, "#9aa0a6") +
      (battery ? roofCover(28.5, CC.roof, 11.0, 0.8, "#7d838b", 3) : "") + coupler(cc, { x: 1.6, y: 2.7, defl: [1.2, 5.4, 0.8, 1.7] }) + lamp(1.3, 5.3, 0.36, 0.42) + lamp(1.4, 4.7, 0.3, 0.28, RED_LAMP) + wiper(4.8, 9.6, 6.4, 11.6)
      : hvac(18.0, CC.roof, 11.0, 0.6, "#9aa0a6") + (pan ? pantograph(L - 10.0, CC.roof, { up: true, facing: -1 }) + hvLine(L - 6.6, L - 3.0, CC.roof) : "")),
    gangway: [1.8, 12.4],
  });
}
add("ennoCcEndA", { name: "enno Coradia Continental (1440) end car, 1st and 2nd class", kind: "emu", amenities: ["first"] }, M((c) => ccCar(c, "enno", "end"), CC.end, true));
add("ennoCcEnd", { name: "enno Coradia Continental (1440) end car", kind: "emu" }, M((c) => ccCar(c, "enno", "end"), CC.end, true));
add("ennoCcMid", { name: "enno Coradia Continental (1441) middle car", kind: "emu", pan: true }, M((c) => ccCar(c, "enno", "mid", { pan: true }), CC.mid));
add("ennoCcMid2", { name: "enno Coradia Continental (1441) middle car", kind: "emu" }, M((c) => ccCar(c, "enno", "mid"), CC.mid));
add("mrbCcEndA", { name: "MRB Coradia Continental (1440) end car, 1st and 2nd class", kind: "emu", amenities: ["first"] }, M((c) => ccCar(c, "mrb", "end"), CC.end, true));
add("mrbCcEnd", { name: "MRB Coradia Continental (1440) end car", kind: "emu" }, M((c) => ccCar(c, "mrb", "end", { second: true }), CC.end, true));
add("mrbCcMid", { name: "MRB Coradia Continental (1441) middle car", kind: "emu", pan: true }, M((c) => ccCar(c, "mrb", "mid", { pan: true }), CC.mid));
add("mrbCcMid2", { name: "MRB Coradia Continental (1841) middle car", kind: "emu" }, M((c) => ccCar(c, "mrb", "mid"), CC.mid));
add("mrbBemuEndA", { name: "MRB Coradia Continental BEMU (1440.4) end car, 1st and 2nd class", kind: "emu", amenities: ["first"] }, M((c) => ccCar(c, "mrb", "end", { battery: true }), CC.end, true));

// ===================== metronom: TRAXX and double-deck coaches =====================
// The LNVG's pool: Bombardier TRAXX P160 AC (class 146.1/146.2, 18.9 m)
// and Görlitz double-deck coaches of the fourth generation (26.8 m, the
// driving trailers 27.27 m; 4.63 m tall), in the colors the LNVG gave them
// at their 2019-2025 refit: pale yellow, a light gray roof down to the
// upper windows, a blue skirt along the bottom; blue doors. The coaches'
// doors are high-entry, over the trucks at each end, a gray-framed panel
// with Niedersachsen's horse beside each (146 508, 517 2025; coaches at
// Tostedt 2026, the driving trailer at Hannover 2025). A train: the
// locomotive at the Hannover/Bremen end, the driving trailer (first class
// upstairs) at Hamburg.
const ME = { yellow: "#eee27a", blue: "#24409a", gray: "#d8dbdc", white: "#f1f2f1" };
const NOSE_TRAXX = [[1.2, 4.1], [1.0, 7.7], ["q", 1.05, 8.6, 1.7, 9.1], [2.5, 12.2], ["q", 2.8, 12.9, 3.9, 12.9]];
const metronomWord = (c, x, y, h, ink = ME.blue) => mark(c, x, y, txt(0, 0, h, "metronom", ink, { weight: 700, spacing: "-0.01em", family: "Arial Rounded MT Bold, Helvetica Neue, Arial, sans-serif" }));
const meTraxx = (c) => euroLoco(c, {
  roof: 12.9, sill: 4.1, nose: NOSE_TRAXX, rake: [[1.7, 9.1], [2.5, 12.2]], centers: 34.25, door: 5.4, wheel: 49, surround: "#1d2024",
  // The fronts white, the blue wrapping round onto the cab's sides (a
  // thin yellow line at its edge) and along the bottom; the side between
  // the cabs pale yellow, plain, the refitted units without the old
  // "metronom" logo (146 508 near Lüneburg, 2025, zoomed).
  paint: (cc, L) => {
    let s = rect(-1, 0, L + 2, 20, ME.blue) + rect(-1, 11.9, L + 2, 3, "#9aa0a6");
    s += path(`M9.6 6.2L${L - 9.6} 6.2L${L - 9.6} 11.6L9.6 11.6Z`, ME.yellow);
    // The front's white wrapping round the cab corner, a yellow line behind it.
    s += path("M-1 4.4L2.6 4.4Q2.5 7.6 2.8 9.0L3.8 12.4L4.6 13.0L-1 13.0Z", "#ede56a") + path("M-1 4.4L1.9 4.4Q1.8 7.6 2.1 9.0L3.1 12.4L3.9 13.0L-1 13.0Z", ME.white);
    return s;
  },
  paintR: (cc, L) => {
    let s = rect(-1, 0, L + 2, 20, ME.blue) + rect(-1, 11.9, L + 2, 3, "#9aa0a6");
    s += path(`M9.6 6.2L${L - 9.6} 6.2L${L - 9.6} 11.6L9.6 11.6Z`, ME.yellow);
    // The front's white wrapping round the cab corner, a yellow line behind it.
    s += path("M-1 4.4L2.6 4.4Q2.5 7.6 2.8 9.0L3.8 12.4L4.6 13.0L-1 13.0Z", "#ede56a") + path("M-1 4.4L1.9 4.4Q1.8 7.6 2.1 9.0L3.1 12.4L3.9 13.0L-1 13.0Z", ME.white);
    return s;
  },
  // The side carries only its vehicle number on the blue under the yellow,
  // the "1" by cab 1 and Niedersachsen's horse by the far cab.
  over: (cc, L) => letters(cc, L / 2 + 6.0, 5.3, 0.5, "91 80 6146 508-7 D-AMS", "#ffffff", { weight: 600 }) + letters(cc, 4.4, 5.6, 0.55, "1", "#ffffff", { weight: 600 }) +
    nds(cc, L - 11.6, 6.4, 0.5),
  grilles: [],
});
add("meTraxx", { name: "metronom TRAXX (146)", kind: "electric", pan: true }, M(meTraxx, 18.9 * F, true));
const DD = { roof: 15.2, mid: 87.9, cab: 89.5, low: 1.2 };
const DD_NOSE = [[9.8, 15.2], [7.6, 15.05], [5.9, 14.55], [4.4, 13.6], [3.0, 12.2], [1.9, 10.4], [1.25, 8.4], [0.95, 6.0], [0.85, 4.2], [1.0, 3.6]];
function meDosto(c, kind) {
  const L = c.L, cab = kind === "cab", bike = kind === "bike";
  // High-entry doors over the trucks (the bicycle cars' low, beside them).
  const doors = bike ? [{ x: 9.4, w: 4.6, y0: 1.3, y1: 9.0 }, { x: L - 14.0, w: 4.6, y0: 1.3, y1: 9.0 }]
    : cab ? [{ x: 12.6, w: 4.6, y0: 3.9, y1: 12.2 }, { x: L - 8.4, w: 4.6, y0: 3.9, y1: 12.2 }] : [{ x: 3.8, w: 4.6, y0: 3.9, y1: 12.2 }, { x: L - 8.4, w: 4.6, y0: 3.9, y1: 12.2 }];
  const a = bike ? 14.6 : cab ? 21.6 : 12.6, b = bike ? L - 14.6 : L - 12.6;
  const up = [], lo = [];
  const nU = Math.floor((b - a) / 4.6), pU = (b - a) / nU;
  for (let i = 0; i < nU; i++) up.push([a + i * pU + 0.3, a + (i + 1) * pU - 0.3, 10.5, 13.0, 0.6]);
  const nL = Math.floor((b - a - 2) / 4.0), pL = (b - a - 2) / nL;
  for (let i = 0; i < nL; i++) lo.push([a + 1 + i * pL + 0.3, a + 1 + (i + 1) * pL - 0.3, 3.5, 6.6, 0.3]);
  const bottom = [[a - 1.2, 3.6], [a - 0.6, DD.low], [b + 0.6, DD.low], [b + 1.2, 3.6]];
  return sec(c, {
    base: ME.yellow, cab, truckTop: 3.6, lo: 1, hi: DD.roof,
    outline: cab ? box(L, { roof: DD.roof, low: 3.6, nose: DD_NOSE, bottom }) : box(L, { roof: DD.roof, low: 3.6, bottom, r: 1.0 }),
    trucks: [[cab ? 13.2 : 6.4, 8.2, 36], [L - 6.4, 8.2, 36]],
    paint: (cc) => {
      let s = rect(-1, -1, L + 2, 20, ME.yellow) + rect(-1, 13.3, L + 2, 4, ME.gray) + rect(-1, -1, L + 2, 3.6, ME.blue) + rect(a - 1, -1, b - a + 2, 3.0, ME.blue);
      // The panel beside each high door, Niedersachsen's horse on it.
      if (!bike) for (const x of cab ? [L - 3.4] : [0.4, L - 3.4]) s += rect(x, 4.4, 3.0, 7.4, "none", 0, 'rx="0.2" stroke="#9a9a7a" stroke-width="0.1"') + rect(x + 0.4, 8.0, 2.2, 0.8, "#22252a");
      if (cab) {
        // The front white, a yellow line round the windshield, blue under it.
        s += path(poly([[-1, 16], [10.6, 16], [9.4, 15.0], [7.8, 14.3], [6.6, 13.4], [5.8, 12.0], [5.3, 10.0], [5.1, 7.6], [5.0, 5.4], [-1, 5.4]]), ME.white) + rect(-1, -1, 7.0, 6.4, ME.blue);
        s += path(poly([[1.6, 9.2], [2.2, 11.0], [3.1, 12.6], [4.3, 13.6], [4.9, 13.6], [4.9, 9.2]]), "#16181a") + path(poly([[2.0, 9.6], [2.5, 11.0], [3.3, 12.4], [4.4, 13.25], [4.6, 13.25], [4.6, 9.6]]), C.glass);
        s += path("M1.4 8.8L5.2 8.8L5.2 14.0L4.4 14.0L1.9 11.4Z", "none", 0, 'stroke="#e8c900" stroke-width="0.3"');
        s += rect(7.0, 8.6, 3.4, 3.5, "#16181a", 0, 'rx="0.4"') + rect(7.25, 8.85, 2.9, 3.0, C.glass, 0, 'rx="0.3"');
      }
      return s;
    },
    wins: [...up, ...lo, ...(bike ? [] : cab ? [] : [])],
    over: (cc) => (cab ? metronomWord(cc, 44.0, 8.6, 1.0) + letters(cc, 23.5, 11.8, 0.9, "1", "#1d1f22", { weight: 600 }) : "") +
      letters(cc, cab ? 23.5 : a + 1.0, 7.6, 0.9, "2", "#1d1f22", { weight: 600 }) + (bike ? picto(cc, "bike", L / 2, 8.6, 1.8, ME.blue) : ""),
    doors, door: (cc, d) => plugDoor(cc, d, ME.blue),
    extra: (cc) => hvac(cab ? 24.0 : 14.0, DD.roof, 8.0, 0.45, "#a9aeb3") + hvac(L - 22.0, DD.roof, 8.0, 0.45, "#a9aeb3") +
      (cab ? lamp(0.95, 5.0, 0.3, 0.45) + lamp(1.0, 4.3, 0.25, 0.3, RED_LAMP) : "") +
      [[0, -1], [L, 1]].filter(([x, sd]) => !(cab && sd < 0)).map(([x, sd]) => rect(sd < 0 ? x : x - 1.0, 2.9, 1.0, 0.55, "currentColor", 0, 'opacity="0.85"') + rect(sd < 0 ? x : x - 0.32, 2.55, 0.32, 1.25, C.steelDark, 0.4, 'rx="0.12"')).join(""),
    gangway: [3.8, 12.6],
  });
}
add("meDostoCab", { name: "metronom double-deck driving trailer (1st and 2nd class)", kind: "coach", cab: true, amenities: ["first"] }, M((c) => meDosto(c, "cab"), DD.cab, true));
add("meDosto", { name: "metronom double-deck coach", kind: "coach" }, M((c) => meDosto(c, "mid"), DD.mid));
add("meDostoBike", { name: "metronom double-deck bicycle coach (low entry)", kind: "coach", amenities: ["bikes"] }, M((c) => meDosto(c, "bike"), DD.mid));

// ===================== Stadler Regio-Shuttle RS1 (class 650) =====================
// One car, 25.5 m over the couplers, 3.7 m tall over the roof's edge, the
// trucks 17.1 m apart (de.wikipedia "Stadler Regio-Shuttle RS1"); cabs at
// both ends, a double door a side 14.5 ft either side of the middle, the
// floor low (600 mm) between the trucks, high (1000 mm) over them. Off the
// Süd-Thüringen-Bahn's VT 107 broadside (Schmalkalden, 2024) and the
// Erfurter Bahn's, ODEG's, City-Bahn's and Rurtalbahn's (2024-2026).
const RS = { len: 83.66, roof: 12.4, low: 2.0 };
const RS_NOSE = [[6.6, 12.4], [5.2, 12.3], [4.0, 11.9], [3.2, 11.2], [1.6, 8.4], [1.1, 7.3], [0.9, 6.2], [0.85, 5.0], [0.85, 3.4], [1.4, 2.4]];
const RS_SCREEN = [[1.6, 8.0], [3.1, 10.8], ["q", 3.8, 11.9, 5.2, 12.0], [5.4, 11.3], ["q", 4.6, 11.0, 4.2, 10.2], [3.0, 7.8]];
const RS_WINS = [[6.6, 13.0], [13.6, 20.2], [32.8, 37.6], [38.2, 42.4], [43.0, 47.4], [48.0, 52.6], [63.4, 70.0], [70.6, 77.0]].map(([a, b]) => [a, b, 4.1, 9.4, 0.4]);
const RS_DOORS = [{ x: 24.6, w: 5.6, y0: 2.3, y1: 9.9 }, { x: 53.5, w: 5.6, y0: 2.3, y1: 9.9 }];
const RSP = {};
// Erfurter Bahn (Elster Saale Bahn, 2024-): the cab sections white; from
// just ahead of each door back to the middle the car is green from the
// skirt to the roof, its front edge a curve rising from the skirt to the
// roof, a white tongue reaching into it over the windows (where "ELSTER
// SAALE BAHN" is lettered in green) and a white panel under the middle
// windows ("Ein Netz der ErfurterBahn"); a green skirt the whole length;
// dull red doors in white frames with green "2"s; the sun mark behind
// the cab, "EB" on the cab side (VT 332, Bad Köstritz, 2026).
RSP.eb = { base: "#f2f4f2", door: "#b4474a",
  paint: (c, L) => {
    const W = "#f2f4f2", G = EB.green, x0 = RS_DOORS[0].x - 3.0, x1 = RS_DOORS[1].x + RS_DOORS[1].w + 3.0;
    let s = rect(-1, -1, L + 2, 20, W) + rect(-1, -1, L + 2, 3.8, G);
    // The green, its ends curving from the skirt up to the roof.
    s += path(`M${x0 - 2.0} 3.0Q${x0 + 0.6} 3.4 ${x0} 8.0Q${x0 - 0.4} 12.0 ${x0 + 2.0} 13.0L${x1 - 2.0} 13.0Q${x1 + 0.4} 12.0 ${x1} 8.0Q${x1 - 0.6} 3.4 ${x1 + 2.0} 3.0Z`, G);
    // The white tongue over the windows from each door toward the middle.
    s += path(`M${RS_DOORS[0].x + 5.6} 9.7L${RS_DOORS[1].x - 4.0} 9.7Q${RS_DOORS[1].x - 2.0} 9.7 ${RS_DOORS[1].x - 2.0} 11.0Q${RS_DOORS[1].x - 2.0} 12.4 ${RS_DOORS[1].x - 4.0} 12.4L${RS_DOORS[0].x + 5.6} 12.4Z`, W);
    s += rect(38.0, 3.0, 13.0, 1.0, W, 0, 'rx="0.3"');
    for (const d of RS_DOORS) s += rect(d.x - 1.2, 2.3, d.w + 2.4, 7.9, W);
    return s;
  },
  marks: (c, L) => ebMark(c, 4.0, 4.6, 0.9) + mark(c, 12.4, 10.6, `<path d="M-0.9 0.3Q-1.2 -0.6 -0.2 -0.5Q0.6 -0.2 0.1 0.4Q-0.6 0.9 -1.1 0.6" fill="none" stroke="${EB.green}" stroke-width="0.18"/><path d="M-0.2 0.5Q0.8 0.9 1.2 0.2" fill="none" stroke="#1f4f9e" stroke-width="0.16"/>` +
    [0, 1, 2].map((i) => `<path d="M${n(-0.2 + i * 0.4)} -0.6L${n(-0.4 + i * 0.45)} -1.2L${n(0.0 + i * 0.4)} -1.1Z" fill="#f2b11c"/>`).join("")) +
    letters(c, 41.0, 11.0, 0.6, "ELSTER SAALE BAHN", EB.green, { weight: 700 }) + letters(c, 44.5, 3.5, 0.5, "ErfurterBahn", "#2d6f2a", { weight: 700 }) +
    RS_DOORS.map((d) => letters(c, d.x - 0.6, 8.6, 0.8, "2", EB.green, { weight: 700 }) + letters(c, d.x + d.w + 0.6, 8.6, 0.8, "2", EB.green, { weight: 700 })).join("") };
// Süd-Thüringen-Bahn (since 2017): green, white over the windows behind
// each cab with "Süd-Thüringen-Bahn" and its blue wave; the windows in a
// dark band; white panels round the red doors with green "2"s.
RSP.stb = { base: "#3fae49", door: "#d8262e",
  paint: (c, L) => {
    let s = rect(-1, -1, L + 2, 20, "#3fae49") + rect(5.6, 3.9, L - 11.2, 5.7, "#1d2125");
    for (const x0 of [-1, L - 21.6]) s += rect(x0, 9.6, 22.6, 4, "#f4f5f4");
    s += rect(-1, 2.4, 6.0, 7.2, "#f4f5f4") + rect(L - 5.0, 2.4, 6.0, 7.2, "#f4f5f4");
    for (const d of RS_DOORS) s += rect(d.x - 1.2, 2.3, d.w + 2.4, 7.8, "#f4f5f4");
    return s;
  },
  marks: (c, L) => letters(c, 11.0, 10.8, 0.7, "Süd-Thüringen-Bahn", "#1f3f8a", { weight: 700, style: "italic" }) + letters(c, L - 11.0, 10.8, 0.7, "Süd-Thüringen-Bahn", "#1f3f8a", { weight: 700, style: "italic" }) +
    RS_DOORS.map((d) => letters(c, d.x - 0.6, 8.6, 0.8, "2", "#3fae49", { weight: 700 }) + letters(c, d.x + d.w + 0.6, 8.6, 0.8, "2", "#3fae49", { weight: 700 })).join("") };
// ODEG's Regio-Shuttles (the Westmecklenburg and Lausitz lines): the older
// paint, yellow cabs and roof's edge, cream sides with green stripes low,
// a green skirt; yellow doors; "ODEG" on the cab (VT 650.88, 2024).
RSP.odeg = { base: "#f1eedc", door: OD.yellow,
  paint: (c, L) => {
    let s = rect(-1, -1, L + 2, 20, "#f1eedc") + rect(-1, 10.0, L + 2, 4, OD.yellow) + rect(-1, -1, L + 2, 3.0, "#17675f");
    for (const y of [3.4, 4.2, 5.0]) s += rect(-1, y, L + 2, 0.35, "#17675f");
    s += path("M-1 -1L-1 20L8.6 20L8.6 2.2Q6.0 2.0 3.0 3.0Z", OD.yellow) + path(`M${L + 1} -1L${L + 1} 20L${L - 8.6} 20L${L - 8.6} 2.2Q${L - 6.0} 2.0 ${L - 3.0} 3.0Z`, OD.yellow);
    return s;
  },
  marks: (c, L) => letters(c, 4.8, 6.4, 0.7, "ODEG", "#17675f", { weight: 800 }) };
// City-Bahn Chemnitz: cream cab ends, red from behind them over the rest
// of the side, a cream band through the windows; red skirt; "City-Bahn
// Chemnitz" in cream over the windows, its mark on the cab (VT 514,
// Chemnitz Hbf, 2025).
RSP.cb = { base: "#efe8d8", door: "#d7262e",
  paint: (c, L) => rect(-1, -1, L + 2, 20, "#d7262e") + path("M-1 -1L-1 20L11.6 20Q10.0 10 12.6 3.0L12.6 -1Z", "#efe8d8") + path(`M${L + 1} -1L${L + 1} 20L${L - 11.6} 20Q${L - 10.0} 10 ${L - 12.6} 3.0L${L - 12.6} -1Z`, "#efe8d8") +
    rect(13.0, 4.6, L - 26.0, 5.6, "#efe8d8") + rect(-1, -1, L + 2, 2.6, "#d7262e"),
  marks: (c, L) => letters(c, 41.8, 11.0, 0.75, "City-Bahn Chemnitz", "#efe8d8", { weight: 700, style: "italic" }) + letters(c, 4.0, 6.0, 0.55, "CB", "#1f4f9e", { weight: 800, style: "italic" }) };
// Rurtalbahn: silver-white, the bottom quarter solid dark blue the whole
// length and round the cab's foot under the lights; "Rurtalbahn" on the
// cab and the side (VT 747, Düren, 2025).
RSP.rurtal = { base: RT.white, door: "#dfe3e6",
  paint: (c, L) => rect(-1, -1, L + 2, 20, RT.white) + rect(-1, -1, L + 2, 4.9, "#1d3f8a"),
  marks: (c, L) => rurtalWord(c, 4.4, 6.2, 0.55) + rurtalWord(c, 41.8, 11.0, 0.9) };
// vogtlandbahn (Die Länderbahn): white, a green band low the whole length
// over a gray skirt, green over the roof's edge by the doors; yellow
// doors; "vogtlandbahn.de" in black, the green bars on the cab (VT 150,
// Greiz, 2025).
RSP.vogtland = { base: "#f1f2f3", door: "#f2b51c",
  paint: (c, L) => rect(-1, -1, L + 2, 20, "#f1f2f3") + rect(-1, -1, L + 2, 2.4, "#55595e") + rect(-1, 2.4, L + 2, 1.5, "#1f8f4a") +
    RS_DOORS.map((d) => rect(d.x - 3.2, 10.6, d.w + 6.4, 3, "#1f8f4a")).join(""),
  marks: (c, L) => letters(c, 15.0, 4.8, 0.55, "vogtlandbahn.de", "#1d1f22", { weight: 600 }) + letters(c, L - 15.0, 4.8, 0.55, "vogtlandbahn.de", "#1d1f22", { weight: 600 }) +
    mark(c, 4.0, 6.0, [0, 0.3, 0.6].map((dy) => `<path d="M-0.5 ${n(dy - 0.3)}L0.6 ${n(dy - 0.3)}L0.5 ${n(dy - 0.12)}L-0.6 ${n(dy - 0.12)}Z" fill="#1f8f4a"/>`).join("")) };
// trilex's ex-ODEG units keep ODEG's yellow and green, relettered.
RSP.trilex = { ...RSP.odeg, marks: (c, L) => letters(c, 4.8, 6.4, 0.7, "trilex", "#17675f", { weight: 800 }) };
// Freiberger Eisenbahn: white sides, the cabs and the roof's edge blue,
// a gray skirt; yellow doors (650 056, Holzhau).
RSP.feg = { base: "#f1f2f3", door: "#f2c500",
  paint: (c, L) => rect(-1, -1, L + 2, 20, "#f1f2f3") + rect(-1, 10.6, L + 2, 4, "#1f4fb0") + rect(-1, -1, L + 2, 2.6, "#5a5f64") +
    path("M-1 2.6L-1 20L7.0 20L7.0 10.6Q4.0 10.4 3.0 7.4L2.4 2.6Z", "#1f4fb0") + path(`M${L + 1} 2.6L${L + 1} 20L${L - 7.0} 20L${L - 7.0} 10.6Q${L - 4.0} 10.4 ${L - 3.0} 7.4L${L - 2.4} 2.6Z`, "#1f4fb0"),
  marks: () => "" };
// Pressnitztalbahn on Rügen (the "Zu(g)bringer"): cream above, dark green
// below the windows, a gold line between, Mecklenburg-Vorpommern's name by
// the cab (650 032, Bergen auf Rügen).
RSP.press = { base: "#ece4c8", door: "#ece4c8",
  paint: (c, L) => rect(-1, -1, L + 2, 20, "#ece4c8") + rect(-1, -1, L + 2, 4.4, "#1f5a46") + rect(-1, 4.4, L + 2, 0.2, "#c9a24a"),
  marks: (c, L) => letters(c, 9.8, 7.0, 0.42, "Mecklenburg-Vorpommern", "#1f5a46", { weight: 600 }) };
function rs1Car(c, pk) {
  const L = c.L, P = RSP[pk];
  const noseR = RS_NOSE.map((p) => [...p]);
  return sec(c, {
    base: P.base, cab: true, cabR: true, truckTop: 2.4, lo: 1.0, hi: RS.roof,
    outline: box(L, { roof: RS.roof, low: 2.4, r: 1.0, nose: RS_NOSE, noseR, bottom: [[13.4, 2.4], ["q", 14.0, 2.4, 14.2, 2.0], [L - 14.2, 2.0], ["q", L - 14.0, 2.4, L - 13.4, 2.4]] }),
    trucks: [[L / 2 - 28.05, 6.6, 30, "car"], [L / 2 + 28.05, 6.6, 30, "car"]],
    paint: (cc) => {
      let s = P.paint(cc, L);
      for (const k of [0, 1]) {
        const g = path(poly(RS_SCREEN), C.glass) + path(poly(RS_SCREEN), "none", 0, 'stroke="#15181b" stroke-width="0.3"');
        s += k ? `<g transform="matrix(-1 0 0 1 ${L} 0)">${g}</g>` : g;
      }
      return s;
    },
    wins: RS_WINS, over: (cc) => P.marks(cc, L),
    doors: RS_DOORS, door: (cc, d) => plugDoor(cc, d, P.door),
    under: () => rect(30.0, 1.0, 9.0, 1.0, "#3a3e44", 0.3) + rect(44.0, 1.0, 9.0, 1.0, "#3a3e44", 0.3),
    extra: (cc) => roofCover(10.0, RS.roof, 10.0, 0.7, "#9aa0a6", 2) + roofCover(L - 20.0, RS.roof, 10.0, 0.7, "#9aa0a6", 2) + hvac(L / 2 - 5, RS.roof, 10.0, 0.6, "#9aa0a6") +
      rect(L / 2 + 7, RS.roof, 0.5, 1.1, "#5a4a3a") + coupler(cc, { x: 1.0, y: 2.9, defl: [0.8, 4.0, 1.0, 2.2] }) + lamp(0.9, 4.8, 0.3, 0.4) + lamp(0.9, 4.2, 0.26, 0.28, RED_LAMP) +
      `<g transform="matrix(-1 0 0 1 ${L} 0)">${coupler(cc, { x: 1.0, y: 2.9, defl: [0.8, 4.0, 1.0, 2.2] }) + lamp(0.9, 4.8, 0.3, 0.4) + lamp(0.9, 4.2, 0.26, 0.28, RED_LAMP)}</g>`,
  });
}
for (const [pk, name] of [["eb", "Erfurter Bahn"], ["stb", "Süd-Thüringen-Bahn"], ["odeg", "ODEG"], ["cb", "City-Bahn Chemnitz"], ["rurtal", "Rurtalbahn"], ["vogtland", "vogtlandbahn"], ["trilex", "trilex"], ["feg", "Freiberger Eisenbahn"], ["press", "Pressnitztalbahn"]])
  add(`${pk}Rs1`, { name: `${name} Regio-Shuttle RS1 (650)`, kind: "emu" }, M((c) => rs1Car(c, pk), RS.len));

// ===================== Stadler FLIRT 3 =====================
// End cars 22.85 m from the coupler to the Jakobs truck's middle (the motor
// truck under the cab), cars between 17.5 m (four cars 80.7 m, five 98.2
// m, six 115.7 m); 4.12 m tall; double plug doors 1.3 m; the crash-proof
// front (the geometry measured for nlregio.cars.js's FLIRT 3s). The FLIRT
// Akku (Schleswig-Holstein's battery units, 2023): two cars of the same
// end-car pattern, 46.6 m. Each car: a door at a quarter of its length from
// its inner end (the end car's behind three windows).
const F3 = { end: 75.0, mid: 57.4, roof: 13.5, low: 1.35 };
const F3_NOSE = [[9.8, 13.5], [7.6, 13.36], [5.8, 12.85], [4.5, 12.0], [3.6, 10.9], [2.95, 9.5], [2.45, 7.7], [2.05, 5.9], [1.9, 4.0], [1.95, 2.4], [2.7, 1.9]];
const F3_BOTTOM = [[3.0, 2.6], [22.2, 2.6], ["q", 23.2, 2.6, 23.6, 1.35]];
const F3_SCREEN = [[2.55, 7.9], [3.05, 9.7], [3.75, 11.05], [4.75, 12.05], [6.0, 12.65], [7.3, 12.8], [7.3, 8.3]];
const F3_END = { wins: [[15.6, 19.4], [20.4, 24.2], [31.6, 35.4], [36.8, 40.6], [42.0, 45.8], [47.2, 51.0], [52.4, 56.2], [57.6, 61.4], [62.8, 66.6], [68.0, 71.8]], door: 25.6 };
const F3_MID = { wins: [[2.4, 6.2], [7.6, 11.4], [19.2, 23.0], [24.4, 28.2], [29.6, 33.4], [34.8, 38.6], [40.0, 43.8], [45.2, 49.0], [50.4, 54.2]], door: 13.2 };
const F3P = {};
// WestfalenBahn (2015/2017, the same paint on its KISS): light blue over
// lime green, the boundary sweeping up from low at the cab to the roof's
// edge at the inner end; the white leaping horse ("Westfalen-Niedersachsen-
// Ross") and "WestfalenBahn" on the lime; light blue doors.
const WF = { blue: "#22a4dc", lime: "#d4e157", white: "#f4f6f6" };
F3P.wfb = { base: WF.blue, door: WF.blue,
  paint: (c, L, cab) => rect(-1, -1, L + 2, 20, WF.blue) + (cab ? path(`M-1 -1L-1 14L9.0 14Q16 10.5 22 7.0Q32 3.0 ${L + 1} 2.6L${L + 1} -1Z`, WF.lime) : rect(-1, -1, L + 2, 3.6, WF.lime)),
  marks: (c, L, cab) => (cab ? mark(c, 11.6, 5.0, txt(0, 0, 0.75, "WestfalenBahn", "#1f5aa8", { weight: 700 })) + mark(c, 11.6, 7.2, `<path d="M-1 0.8L-0.4 0L0.2 0.2L1.0 -0.8L0.8 0.2L0.2 0.8Z" fill="#ffffff"/>`) : "") };
// Nordbahn's FLIRT 3s (NAH.SH's design for the Hamburg lines): a dark
// slate side; the cab lime green back past its door, the lime's edge
// sweeping from high behind the cab door down and forward to the skirt;
// "nordbahn" with its chevron white high behind the lime, NAH.SH's mark on
// the lime; lime doors; a yellow bar under first class (ET 5.05, Hamburg
// Hbf, 2025).
const NB = { slate: "#45545e", lime: "#c6e033" };
const nbWord = (c, x, y, h, col = "#ffffff") => mark(c, x, y, txt(0, 0, h, "nordbahn", col, { weight: 700, anchor: "middle" }) +
  [0, 0.28, 0.56].map((d) => `<path d="M${n(h * (2.25 + d))} ${n(-h * 0.45)}L${n(h * (2.45 + d))} ${n(-h * 0.1)}L${n(h * (2.65 + d))} ${n(-h * 0.45)}" fill="none" stroke="${col}" stroke-width="${n(h * 0.1)}"/>`).join(""));
F3P.nordbahn = { base: NB.slate, door: NB.lime,
  paint: (c, L, cab) => rect(-1, -1, L + 2, 20, NB.slate) + rect(-1, 12.6, L + 2, 4, "#6f7d86") + (cab ? path("M-1 -1L-1 20L19.0 20Q17.6 12.0 15.0 6.0Q13.8 2.6 13.6 -1Z", NB.lime) + rect(31.6, 4.1, 9.0, 0.45, "#f2d21c") : ""),
  marks: (c, L, cab) => (cab ? nbWord(c, 24.0, 11.3, 0.95) + letters(c, 16.4, 6.6, 0.6, "NAH.SH", "#3a4a54", { weight: 700 }) + nbWord(c, 3.6, 5.2, 0.6) : "") };
// eurobahn's FLIRT 3 (ET 4.01-4.08, the RB 61 to Hengelo): turquoise, a
// white panel on the end car with "eurobahn" in blue (ET 406, 2026).
F3P.eb4 = { base: "#2ea7c7", door: "#2ea7c7",
  paint: (c, L, cab) => rect(-1, -1, L + 2, 20, "#2ea7c7") + rect(-1, 12.6, L + 2, 4, "#9fb4bb") + (cab ? path("M16.0 1.4L36.0 1.4L34.0 12.0L18.0 12.0Z", "#f2f4f4") : ""),
  marks: (c, L, cab) => (cab ? eurobahnWord(c, 26.0, 8.0, 1.2) : "") };
// NAH.SH's battery FLIRTs (erixx Holstein, Nordbahn): blue fading to teal
// along the car, the cab dark blue; the operator's name white on the nose.
const AK2 = { navy: "#1d3c7a", teal: "#1aa3a8" };
F3P.nahsh = { base: AK2.navy, door: AK2.teal,
  paint: (c, L, cab) => {
    const [d, f] = grad(cab ? 10 : 0, 0, L, 0, [[0, AK2.navy], [1, AK2.teal]]);
    return d + rect(-1, -1, L + 2, 20, f) + rect(-1, 12.6, L + 2, 4, "#8d9aa2");
  },
  marks: (c, L, cab) => (cab ? letters(c, 4.0, 5.4, 0.62, c.agency === "nordbahnAkku" ? "nordbahn" : "erixx", "#ffffff", { weight: 700, style: "italic" }) + letters(c, 40.0, 11.4, 0.8, "NAH.SH", "#ffffff", { weight: 700 }) : "") };
function f3Car(c, pk, part, { pan = false, op = "" } = {}) {
  const L = c.L, P = F3P[pk], cab = part === "end", lay = cab ? F3_END : F3_MID;
  return sec(c, {
    base: P.base, cab, truckTop: 2.9, lo: 1.0, hi: F3.roof,
    outline: box(L, { roof: F3.roof, low: F3.low, nose: cab ? F3_NOSE : null, bottom: cab ? F3_BOTTOM : null }),
    trucks: [...(cab ? [[17.2, 8.2, 36, "car"]] : []), [L, 8.86, 30, "car"]],
    paint: (cc) => P.paint({ ...cc, agency: op }, L, cab) + (cab ? path(poly(F3_SCREEN.map(([x, y]) => [x - 0.3, y + (y > 12 ? 0.25 : -0.4)])), "#16191c") + path(poly(F3_SCREEN), C.glass) +
      rect(8.6, 8.2, 2.4, 3.3, "#16191c", 0, 'rx="0.4"') + rect(8.8, 8.4, 2.0, 2.9, C.glass, 0, 'rx="0.3"') : ""),
    wins: lay.wins.map(([a, b]) => [a, b, 4.7, 10.3, 0.45]), over: (cc) => P.marks({ ...cc, agency: op }, L, cab),
    doors: [{ x: lay.door, w: 4.3, y0: 1.75, y1: 10.4 }], door: (cc, d) => plugDoor(cc, d, P.door),
    under: () => (cab ? rect(9.0, 1.9, 4.0, 0.9, "#3a3e44", 0.4) + rect(30.0, 0.9, 10.0, 0.6, "#3a3e44", 0.3) : rect(18.0, 0.9, 12.0, 0.6, "#3a3e44", 0.3)),
    extra: (cc) => hvac(cab ? 24.0 : L / 2 - 6, F3.roof, 11.0, 0.65, "#9aa0a6") + (cab ? roofCover(13.0, F3.roof, 8.5, 0.55, "#9aa0a6", 2) : "") +
      (pan ? pantograph(L - 9.0, F3.roof, { up: true, facing: -1 }) + hvLine(L - 5.6, L - 2.0, F3.roof) : "") +
      (cab ? coupler(cc, { x: 1.9, y: 2.9, defl: [1.3, 6.4, 1.0, 2.0] }) + lamp(2.0, 4.6, 0.36, 0.5) + lamp(2.0, 3.9, 0.3, 0.32, RED_LAMP) + wiper(3.1, 9.0, 3.9, 11.0) : ""),
    gangway: [1.4, 12.6],
  });
}
for (const [pk, name] of [["wfb", "WestfalenBahn"], ["nordbahn", "Nordbahn"], ["eb4", "eurobahn"]]) {
  add(`${pk}F3End`, { name: `${name} FLIRT 3 end car, 1st and 2nd class`, kind: "emu", amenities: ["first"] }, M((c) => f3Car(c, pk, "end"), F3.end, true));
  add(`${pk}F3Mid`, { name: `${name} FLIRT 3 middle car`, kind: "emu" }, M((c) => f3Car(c, pk, "mid"), F3.mid));
  add(`${pk}F3MidP`, { name: `${name} FLIRT 3 middle car with the pantograph`, kind: "emu", pan: true }, M((c) => f3Car(c, pk, "mid", { pan: true }), F3.mid));
}
add("erixxAkku", { name: "erixx Holstein FLIRT Akku car", kind: "emu", pan: true }, M((c) => f3Car(c, "nahsh", "end", { pan: true, op: "erixx" }), 76.4, true));
add("nordbahnAkku", { name: "Nordbahn FLIRT Akku car", kind: "emu", pan: true }, M((c) => f3Car(c, "nahsh", "end", { pan: true, op: "nordbahnAkku" }), 76.4, true));

// ===================== Stadler KISS =====================
// Double-deck: end cars 26.85 m, middle cars 26.1 m, 4.63 m tall (the
// geometry measured for cfl.cars.js's KISS); each car's double deck
// between two doors, an intermediate level over each truck. ODEG's four-
// car 445.1s (RE 8, RB 10) and WestfalenBahn's six-car units (RE 60, RE 70).
const KZ = { roof: 15.15, end: 88.1, mid: 85.8, upper: [11.0, 13.1], lower: [3.65, 6.3] };
const KZ_NOSE = [[9.6, 15.15], [8.0, 14.9], [6.7, 14.35], [5.3, 13.4], [4.0, 12.2], [3.0, 10.8], [2.4, 9.3], [1.9, 7.6], [1.45, 5.6], [1.05, 3.6], [1.1, 2.5], [1.6, 2.0]];
const KZ_LAY = {
  cab: { up: [[28.0, 30.0], [33.1, 37.2], [38.7, 42.8], [44.4, 48.4], [50.1, 54.1], [55.7, 59.7], [62.8, 64.8]], lo: [[33.2, 37.2], [38.7, 42.8], [44.4, 48.4], [50.1, 54.1], [55.7, 59.7]],
    doors: [26.3, 61.0], ends: [[15.2, 19.0, 6.7, 9.25], [71.5, 75.0, 6.7, 9.25]] },
  mid: { up: [[21.9, 23.9], [26.7, 30.6], [32.3, 36.2], [37.9, 41.8], [43.5, 47.4], [49.1, 53.0], [54.7, 58.6], [61.9, 63.9]], lo: [[26.8, 30.7], [32.3, 36.2], [37.8, 41.7], [43.7, 47.6], [49.1, 52.7]],
    doors: [20.2, 60.3], ends: [[3.1, 7.1, 6.7, 9.25], [8.8, 12.8, 6.7, 9.25], [73.0, 77.0, 6.7, 9.25], [78.7, 82.7, 6.7, 9.25]] },
};
const KP = {};
// ODEG (2012, refitted 2022-): white, a gray roof; the cab module yellow,
// two yellow fingers reaching back from it with a white tongue between
// (the upper to the first door, the lower short of it), rounded at their
// ends; teal along the foot, rising behind the cab to the lower windows'
// sills; the upper deck's windows in a teal band; yellow doors; ODEG's
// mark and a big outlined bicycle by the bicycle door (ET 445 101, Berlin
// Ostbahnhof, 2025).
KP.odeg = { base: OD.white, door: OD.yellow,
  paint: (c, L, cab) => {
    let s = rect(-1, -1, L + 2, 20, OD.white) + rect(-1, 14.0, L + 2, 3, OD.roof);
    s += path(cab ? `M-1 -1L-1 2.6L20 2.6Q26 2.8 29.0 3.6L${L + 1} 3.6L${L + 1} -1Z` : `M-1 -1L-1 3.6L${L + 1} 3.6L${L + 1} -1Z`, OD.teal);
    s += rect(cab ? 27.2 : 21.2, 10.5, L - (cab ? 27.2 : 21.2) - 0.5, 3.0, OD.teal, 0, 'rx="0.6"');
    if (cab) s += path("M-1 2.6L-1 14.0L24.6 14.0Q25.8 14.0 25.8 12.8L25.8 10.4Q25.8 9.2 24.6 9.2L19.6 9.2L19.6 6.8L23.0 6.8Q24.2 6.8 24.2 5.6L24.2 2.7L20 2.6Z", OD.yellow);
    return s;
  },
  marks: (c, L, cab) => (cab ? odegMark(c, 37.0, 9.4, 0.7) + mark(c, 37.0, 5.4, PICTO.bike(4.6, OD.teal).replace(/stroke-width="[\d.]+"/g, 'stroke-width="0.45"')) : "") };
// WestfalenBahn: its FLIRT's paint, light blue over lime.
KP.wfb = { base: WF.blue, door: WF.blue,
  paint: (c, L, cab) => rect(-1, -1, L + 2, 20, WF.blue) + (cab ? path(`M-1 -1L-1 15.5L9.0 15.5Q20 11 30 7.0Q45 3.6 ${L + 1} 3.2L${L + 1} -1Z`, WF.lime) : rect(-1, -1, L + 2, 3.2, WF.lime)),
  marks: (c, L, cab) => (cab ? letters(c, 16.0, 4.6, 0.8, "WestfalenBahn", "#1f5aa8", { weight: 700 }) : "") };
function kissCar(c, pk, kind, { pan = false } = {}) {
  const L = c.L, cab = kind === "cab", lay = KZ_LAY[cab ? "cab" : "mid"], P = KP[pk];
  const bottom = cab ? [[9.6, 2.0], [10.4, 3.1], [21.2, 3.1], ["q", 22.2, 3.1, 22.7, 2.2], [23.2, 1.05], [69.2, 1.05], [70.0, 2.4], [71.0, 3.1]]
    : [[13.8, 3.1], [14.6, 1.05], [L - 14.6, 1.05], [L - 13.8, 3.1]];
  return sec(c, {
    base: P.base, cab, truckTop: 3.1, lo: 1, hi: KZ.roof,
    outline: box(L, { roof: KZ.roof, low: 3.1, nose: cab ? KZ_NOSE : null, bottom }),
    trucks: cab ? [[15.6, 8.7, 36], [L - 11.1, 8.7, 36]] : [[10.8, 8.7, 36], [L - 10.8, 8.7, 36]],
    paint: (cc) => P.paint(cc, L, cab) + (cab ? path(poly([[2.0, 7.8], [2.5, 9.0], [3.3, 9.9], [4.5, 10.5], [9.6, 10.5], ["q", 10.2, 10.5, 10.2, 9.9], [10.2, 7.8], ["q", 10.2, 7.2, 9.6, 7.2], [2.7, 7.2], ["q", 1.9, 7.25, 2.0, 7.8]]), "#1a1d20") +
      path(poly([[2.7, 7.6], [3.1, 8.8], [3.9, 9.7], [5.0, 10.1], [6.7, 10.1], [6.7, 7.6]]), C.glass) + rect(7.3, 7.6, 2.45, 2.5, C.glass, 0, 'rx="0.3"') : ""),
    wins: [...lay.up.map(([a, b]) => [a, b, KZ.upper[0], KZ.upper[1], 0.55]), ...lay.lo.map(([a, b]) => [a, b, KZ.lower[0], KZ.lower[1], 0.4]), ...lay.ends.map(([a, b, y0, y1]) => [a, b, y0, y1, 0.4])],
    over: (cc) => P.marks(cc, L, cab),
    doors: lay.doors.map((x) => ({ x, w: 5.4, y0: 1.2, y1: 9.0 })), door: (cc, d) => plugDoor(cc, d, P.door),
    extra: (cc) => (cab ? hvac(19.0, KZ.roof, 6.0, 0.5, "#a9adb1") + pantograph(L - 8.2, 14.55, { up: true, facing: -1 }) + coupler(cc, { x: 1.0, y: 3.1, defl: [1.4, 9.6, 1.0, 2.0] }) +
      lamp(1.15, 4.0, 0.32, 0.45) + lamp(1.05, 3.2, 0.25, 0.3, RED_LAMP) + wiper(3.6, 9.4, 5.6, 11.5) : hvac(3.0, KZ.roof, 8.5, 0.45, "#a9adb1") + hvac(L - 11.5, KZ.roof, 8.5, 0.45, "#a9adb1")),
    gangway: [3.4, 12.8],
  });
}
for (const [pk, name] of [["odeg", "ODEG"], ["wfb", "WestfalenBahn"]]) {
  add(`${pk}KissEnd`, { name: `${name} KISS end car`, kind: "bilevel", emu: true, pan: true }, M((c) => kissCar(c, pk, "cab"), KZ.end, true));
  add(`${pk}KissMid`, { name: `${name} KISS middle car`, kind: "bilevel", emu: true }, M((c) => kissCar(c, pk, "mid"), KZ.mid));
  add(`${pk}KissMidA`, { name: `${name} KISS middle car, 1st class upstairs`, kind: "bilevel", emu: true, amenities: ["first"] }, M((c) => kissCar(c, pk, "mid"), KZ.mid));
}

// ===================== Siemens Desiro Classic (class 642) =====================
// Two cars on a Jakobs truck, 41.7 m, 3.89 m tall over the roof's edge; a
// diesel engine under each car's raised end; one double door a side on
// each car, in the low floor ahead of the joint (de.wikipedia "Siemens
// Desiro Classic"; trilex's 642 315 at Zittau, ODEG's 642 912 at
// Hagenwerder, 2025).
const DC = { car: 68.4, roof: 12.8, low: 1.8 };
const DC_NOSE = [[7.6, 12.8], ["q", 4.8, 12.8, 3.8, 11.6], [1.9, 8.4], ["q", 1.0, 6.8, 0.9, 5.0], [0.9, 3.2], [1.6, 2.4]];
const DC_SCREEN = [[1.9, 8.2], [3.6, 11.1], ["q", 4.4, 12.2, 5.8, 12.3], [6.0, 11.6], ["q", 5.0, 11.3, 4.6, 10.5], [3.4, 7.9]];
const DC_WINS = [[7.4, 10.4, 7.0, 10.6], [12.8, 18.0], [18.6, 23.8], [24.4, 29.6], [36.6, 41.4], [42.0, 46.8], [47.4, 52.2], [52.8, 57.6], [58.2, 63.0], [63.6, 66.8]].map(([a, b, y0 = 5.3, y1 = 10.6]) => [a, b, y0, y1, 0.35]);
const DCP = {};
// trilex (Die Länderbahn, the 2020-2023 redesign): silver, dark gray below,
// an orange line along the side's foot rising round the cab's edge and
// over the cab's windows; orange doors; "trilex" behind the cab, its
// orange stripes on the nose.
DCP.trilex = { base: "#c6cacd", door: "#e9731c",
  paint: (c, L) => rect(-1, -1, L + 2, 20, "#c6cacd") + rect(-1, -1, L + 2, 3.4, "#34383d") + rect(-1, 3.4, L + 2, 0.55, "#e9731c") + rect(-1, 11.4, L + 2, 4, "#b4b8bb") +
    path("M5.8 3.4L7.0 3.4Q6.2 7.4 8.0 11.4L6.8 11.4Q5.0 7.4 5.8 3.4Z", "#e9731c") + rect(-1, 11.0, 9.4, 0.5, "#e9731c"),
  marks: (c, L) => mark(c, 14.0, 6.6, `<rect x="-1.6" y="-0.4" width="0.9" height="0.18" fill="#e9731c"/><rect x="-1.6" y="-0.1" width="0.9" height="0.18" fill="#e9731c"/><rect x="-1.6" y="0.2" width="0.9" height="0.18" fill="#e9731c"/>` + txt(0.2, 0, 0.9, "trilex", "#4a4f55", { weight: 500 })) };
// ODEG's (Lausitz, the older paint): yellow over a teal skirt with a white
// line; teal-green doors; "ODEG" on the nose.
DCP.odeg = { base: OD.yellow, door: "#2d8a6e",
  paint: (c, L) => rect(-1, -1, L + 2, 20, OD.yellow) + rect(-1, -1, L + 2, 3.9, OD.teal) + rect(-1, 3.9, L + 2, 0.3, "#f3f4f3") + rect(-1, 11.4, L + 2, 4, "#c9ccce"),
  marks: (c, L) => letters(c, 4.0, 5.6, 0.6, "ODEG", OD.teal, { weight: 800 }) };
function desiroClassic(c, pk) {
  const L = c.L, P = DCP[pk];
  return sec(c, {
    base: P.base, cab: true, truckTop: 2.6, lo: 1, hi: DC.roof,
    outline: box(L, { roof: DC.roof, low: 2.6, r: 0.9, nose: DC_NOSE, bottom: [[30.6, 2.6], ["q", 31.2, 2.6, 31.4, 1.8], [L - 0.3, 1.8]] }),
    trucks: [[12.6, 6.2, 30, "car"], [L, 8.86, 30, "car"]],
    paint: (cc) => P.paint(cc, L) + path(poly(DC_SCREEN), C.glass) + path(poly(DC_SCREEN), "none", 0, 'stroke="#15181b" stroke-width="0.3"'),
    wins: DC_WINS, over: (cc) => P.marks(cc, L),
    doors: [{ x: 30.6, w: 4.6, y0: 2.2, y1: 10.2 }], door: (cc, d) => plugDoor(cc, d, P.door),
    under: () => rect(4.0, 1.4, 5.0, 1.2, "#3a3e44", 0.3) + rect(18.0, 1.6, 9.0, 1.0, "#3a3e44", 0.3),
    extra: (cc) => roofCover(6.0, DC.roof, 12.0, 0.7, "#9aa0a6", 2) + hvac(36.0, DC.roof, 10.0, 0.6, "#9aa0a6") + rect(20.0, DC.roof, 0.5, 1.1, "#5a4a3a") +
      coupler(cc, { x: 1.0, y: 2.9, defl: [0.8, 4.4, 1.0, 2.4] }) + lamp(0.95, 5.0, 0.3, 0.4) + lamp(0.95, 4.4, 0.26, 0.28, RED_LAMP) + wiper(2.6, 8.8, 4.0, 10.8),
    gangway: [1.8, 11.6],
  });
}
add("trilexDc", { name: "trilex Desiro Classic (642) car", kind: "emu" }, M((c) => desiroClassic(c, "trilex"), DC.car, true));
add("odegDc", { name: "ODEG Desiro Classic (642) car", kind: "emu" }, M((c) => desiroClassic(c, "odeg"), DC.car, true));

// ===================== Siemens Desiro ML (ODEG, Mecklenburg-Vorpommern) =====================
// Cars on their own trucks, end cars 24.2 m, middle cars 21.6 m (three cars
// 70 m), 4.2 m tall; two double doors a side on each car. ODEG's (2012,
// four cars since 2021, the fourth with first class): white, Mecklenburg-
// Vorpommern's blue in a broad diagonal over the cars, blue doors, a dark
// skirt; ODEG's mark on the nose (Mönchhagen, Pantelitz, 2023-2025).
const ML = { end: 79.4, mid: 70.9, roof: 13.8 };
const ML_NOSE = [[10.2, 13.8], ["q", 7.6, 13.8, 6.4, 12.6], [3.2, 8.6], ["q", 1.6, 7.0, 1.4, 5.0], [1.3, 3.0], [2.0, 2.0]];
const ML_SCREEN = [[3.0, 8.2], [6.0, 11.9], ["q", 6.9, 12.9, 8.4, 13.0], [8.6, 12.3], ["q", 7.4, 11.8, 6.9, 10.9], [4.6, 7.9]];
function desiroML(c, part) {
  const L = c.L, cab = part === "end";
  const doors = cab ? [26.0, 60.0] : [12.0, L - 17.0];
  const wins = (cab ? [[14.0, 19.0], [19.8, 24.8], [32.0, 37.0], [37.8, 42.8], [43.6, 48.6], [49.4, 54.4], [66.0, 71.0], [71.8, 76.8]]
    : [[2.0, 6.6], [7.2, 11.0], [18.0, 23.0], [23.8, 28.8], [29.6, 34.6], [35.4, 40.4], [41.2, 46.2], [47.0, 52.0], [59.8, 64.0], [64.6, 69.0]]).map(([a, b]) => [a, b, 5.2, 10.2, 0.4]);
  return sec(c, {
    base: "#f1f3f4", cab, truckTop: 2.9, lo: 1, hi: ML.roof,
    outline: box(L, { roof: ML.roof, low: 2.0, r: 1.0, nose: cab ? ML_NOSE : null }),
    trucks: cab ? [[12.0, 8.2, 33, "car"], [L - 8.6, 8.2, 33, "car"]] : [[8.6, 8.2, 33, "car"], [L - 8.6, 8.2, 33, "car"]],
    paint: (cc) => {
      let s = rect(-1, -1, L + 2, 20, "#f1f3f4") + rect(-1, -1, L + 2, 3.0, "#2a2e33") + rect(-1, 12.6, L + 2, 4, "#c9cdd0");
      const x0 = cab ? 30 : 10;
      s += path(`M${x0} 3.0L${x0 + 18} 3.0L${x0 + 34} 12.6L${x0 + 16} 12.6Z`, "#1f8fd6");
      if (cab) s += path(poly(ML_SCREEN), C.glass) + path(poly(ML_SCREEN), "none", 0, 'stroke="#15181b" stroke-width="0.3"');
      return s;
    },
    wins, over: (cc) => (cab ? odegMark(cc, 5.0, 5.4, 0.42) : picto(cc, "bike", 30.0, 7.6, 2.4, "#ffffff")),
    doors: doors.map((x) => ({ x, w: 4.6, y0: 2.2, y1: 10.4 })), door: (cc, d) => plugDoor(cc, d, "#1f6fb8"),
    extra: (cc) => hvac(cab ? 30.0 : 20.0, ML.roof, 11.0, 0.6, "#9aa0a6") + (cab ? pantograph(L - 16.0, ML.roof, { up: true, facing: -1 }) + coupler(cc, { x: 1.6, y: 2.8, defl: [1.2, 5.6, 1.0, 2.0] }) +
      lamp(1.4, 4.8, 0.34, 0.42) + lamp(1.4, 4.2, 0.3, 0.28, RED_LAMP) + wiper(4.4, 9.6, 6.0, 11.6) : ""),
    gangway: [2.0, 12.6],
  });
}
add("odMlEnd", { name: "ODEG Desiro ML end car", kind: "emu", pan: true }, M((c) => desiroML(c, "end"), ML.end, true));
add("odMlMid", { name: "ODEG Desiro ML middle car", kind: "emu" }, M((c) => desiroML(c, "mid"), ML.mid));
add("odMlMidA", { name: "ODEG Desiro ML middle car with 1st class", kind: "emu", amenities: ["first"] }, M((c) => desiroML(c, "mid"), ML.mid));

// ===================== Siemens Mireo Plus B/H (NEB) =====================
// Two cars on a Jakobs truck, 46.7 m, the batteries (or hydrogen tanks and
// fuel cells) on the roof; one double door a side on each car. NEB's
// (2024-2025): silver-white above, navy below, the navy rising round the
// doors and the windows nearest them; yellow doors; "NIEDERBARNIMER
// EISENBAHN" in navy over the windows; a big navy bicycle on the window of
// the bicycle area (Strausberg 2025).
const MR = { car: 76.6, roof: 13.3 };
const MR_NOSE = [[8.0, 13.3], ["q", 5.6, 13.3, 4.6, 12.4], [1.6, 8.6], ["q", 0.5, 6.4, 0.7, 3.8], [1.4, 2.3]];
function mireoNeb(c, h2 = false) {
  const L = c.L;
  return sec(c, {
    base: "#e4e6e7", cab: true, truckTop: 2.3, lo: 1, hi: MR.roof,
    outline: box(L, { roof: MR.roof, low: 2.3, r: 0.9, nose: MR_NOSE }),
    trucks: [[10.0, 8.2, 33, "car"], [L, 8.86, 30, "car"]],
    paint: (cc) => rect(-1, -1, L + 2, 20, "#e4e6e7") + rect(-1, -1, L + 2, 5.0, "#1f2f6e") + path("M38.0 5.0L38.0 11.2L52.0 11.2L52.0 5.0Z", "#1f2f6e") + rect(-1, 12.4, L + 2, 4, "#c3c7ca") +
      path("M-1 2.3L-1 13.3L5.0 13.3L1.6 8.6Q0.6 6.4 0.8 3.6Z", "#1f2f6e") + path("M1.6 8.6L4.6 12.4L8.0 13.0L8.0 8.4Z", "#14181c"),
    wins: [[11.0, 14.0, 6.6, 9.8], [18.0, 26.0], [27.0, 34.0], [53.0, 58.0], [59.0, 64.0], [65.0, 70.0], [71.0, 75.0]].map(([a, b, y0 = 5.2, y1 = 10.2]) => [a, b, y0, y1, 0.45]),
    over: (cc) => letters(cc, 28.0, 11.4, 0.6, h2 ? "Heidekrautbahn" : "NIEDERBARNIMER EISENBAHN", "#1f2f6e", { weight: 700, style: h2 ? "italic" : "" }) +
      mark(cc, 22.0, 7.4, PICTO.bike(3.2, "#1f2f6e").replace(/stroke-width="[\d.]+"/g, 'stroke-width="0.35"')),
    doors: [{ x: 41.6, w: 4.4, y0: 2.0, y1: 10.2 }], door: (cc, d) => plugDoor(cc, d, "#f2b800"),
    extra: (cc) => roofCover(12.0, MR.roof, 20.0, 0.8, "#7d838b", 4) + roofCover(40.0, MR.roof, 20.0, 0.8, "#7d838b", 4) +
      coupler(cc, { x: 1.4, y: 2.6, defl: [1.0, 5.0, 0.8, 2.0] }) + lamp(0.9, 4.6, 0.3, 0.42) + lamp(0.9, 4.0, 0.26, 0.28, RED_LAMP) + wiper(2.8, 9.2, 4.2, 11.2),
    gangway: [2.0, 12.0],
  });
}
add("nebMireoB", { name: "NEB Mireo Plus B (563) car", kind: "emu" }, M((c) => mireoNeb(c), MR.car, true));
add("nebMireoH", { name: "NEB Mireo Plus H (563) car", kind: "emu" }, M((c) => mireoNeb(c, true), MR.car, true));

// ===================== AKN VTA =====================
// LHB's two-car diesel-electric units (1993), each car about 20 m (from
// photographs, over the couplers 40.4 m for the pair), flat-fronted: white
// below, red from the windows' foot to the roof's edge, the roof white;
// red doors; "AKN" with its blue-red stripes on the front
// (VT 2.66, 2.68, 2023). Two doors a side on each car.
const VTA = { car: 66.3, roof: 12.6 };
function aknVta(c) {
  const L = c.L;
  return sec(c, {
    base: "#f2f3f3", cab: true, truckTop: 3.4, lo: 1.5, hi: VTA.roof,
    outline: [[0.6, 3.4], [L - 0.3, 3.4], [L - 0.3, VTA.roof - 0.6], ["q", L - 0.3, VTA.roof, L - 0.9, VTA.roof], [1.6, VTA.roof], ["q", 0.6, VTA.roof, 0.6, VTA.roof - 1.0]],
    trucks: [[8.4, 7.4, 33, "car"], [L - 8.4, 7.4, 33, "car"]],
    paint: (cc) => rect(-1, -1, L + 2, 20, "#f2f3f3") + rect(-1, 6.6, L + 2, 5.6, "#d9262e") + rect(-1, 3.4, L + 2, 0.9, "#9aa0a5"),
    wins: [[3.0, 4.6], [9.6, 13.2], [14.2, 17.8], [18.8, 22.4], [23.4, 27.0], [34.2, 37.8], [38.8, 42.4], [43.4, 47.0], [55.4, 59.0], [60.0, 63.6]].map(([a, b]) => [a, b, 7.0, 10.6, 0.3]),
    over: (cc) => "",
    doors: [{ x: 5.4, w: 3.6, y0: 3.6, y1: 11.0 }, { x: 49.6, w: 3.6, y0: 3.6, y1: 11.0 }], door: (cc, d) => plugDoor(cc, d, "#d9262e"),
    // The flat front seen nearly edge-on: white below the windshield with
    // the lamps, "AKN" in blue over a red line and the red-and-blue flag
    // stripes, red above (VT 2.66, 2023).
    extra: (cc) => roofCover(14.0, VTA.roof, 14.0, 0.6, "#a9aeb3", 3) + rect(0.2, 2.6, 1.0, 0.8, "#2a2d31") +
      rect(0.0, 3.4, 1.6, 3.4, "#f2f3f3", 0, 'stroke="rgba(0,0,0,0.3)" stroke-width="0.08"') + rect(0.0, 10.4, 1.6, 2.2, "#d9262e") + rect(0.15, 6.8, 1.3, 3.6, "#16191c") +
      mark(cc, 0.8, 5.6, `<text x="0" y="0.2" font-size="0.75" text-anchor="middle" font-weight="800" font-family="${SANS}" fill="#1f3f9a" textLength="1.3" lengthAdjust="spacingAndGlyphs">AKN</text><rect x="-0.65" y="0.32" width="1.3" height="0.1" fill="#d9262e"/>`) +
      [0, 1, 2].map((i) => rect(0.2, 4.0 + i * 0.22, 1.2, 0.1, i % 2 ? "#d9262e" : "#1f3f9a")).join("") + lamp(0.25, 4.7, 0.28, 0.32) + lamp(1.05, 4.7, 0.28, 0.32, RED_LAMP),
    gangway: [3.6, 11.4],
  });
}
add("aknVta", { name: "AKN VTA car", kind: "emu" }, M(aknVta, VTA.car, true));

// ===================== Pesa Link (NEB, class 632) =====================
// Two cars on their own trucks, 43.73 m (de.wikipedia "Pesa Link": Link
// II), so 21.9 m a car; a big raked nose; a crew door behind the cab, the
// passenger door at the car's inner end. NEB's: blue roof and skirt, a
// white band over the windows and a broad white one under them, the
// windows in navy; yellow doors; "NEB" in navy by the cab door (VT 632.011
// at Britz, 2024; 632 530 at Potsdam, 2023).
const LK = { car: 71.7, roof: 13.5 };
const LK_NOSE = [[11.0, 13.5], ["q", 7.6, 13.5, 6.0, 12.0], [2.6, 7.6], ["q", 1.2, 5.6, 1.1, 3.6], [1.2, 2.2], [2.4, 1.4]];
function linkNeb(c) {
  const L = c.L;
  return sec(c, {
    base: "#2547a6", cab: true, truckTop: 3.2, lo: 1, hi: LK.roof,
    outline: box(L, { roof: LK.roof, low: 3.0, r: 1.0, nose: LK_NOSE, bottom: [[2.4, 1.4], [6.4, 1.4], ["q", 7.0, 3.0, 8.0, 3.0]] }),
    trucks: [[12.6, 8.2, 33, "car"], [L - 8.4, 8.2, 33, "car"]],
    paint: (cc) => rect(-1, -1, L + 2, 20, "#2547a6") + rect(12.0, 9.8, L - 12.0, 1.0, "#eef0f1") + rect(12.0, 5.0, L - 12.0, 4.8, "#1d2a52") + rect(9.0, 2.9, L - 9.0, 2.1, "#eef0f1") +
      path("M3.0 4.4Q8.0 4.0 12.0 5.0L12.0 2.9L2.6 2.9Z", "#eef0f1") + path("M2.8 7.8L6.4 11.8Q8.0 12.8 9.6 12.6L9.6 8.0Z", "#16191c"),
    wins: [[14.0, 16.0, 6.4, 9.4], [20.0, 27.6], [28.4, 36.0], [42.0, 49.6], [50.4, 58.0]].map(([a, b, y0 = 5.6, y1 = 9.4]) => [a, b, y0, y1, 0.5]),
    over: (cc) => letters(cc, 13.6, 3.7, 0.9, "NEB", "#1d2a52", { weight: 800 }) + letters(cc, 37.4, 8.0, 0.8, "2", "#1d1f22", { weight: 700 }),
    doors: [{ x: 10.2, w: 2.2, y0: 3.0, y1: 10.4 }, { x: L - 6.8, w: 4.4, y0: 2.0, y1: 10.6 }], door: (cc, d) => plugDoor(cc, d, d.w < 3 ? "#1d2a52" : "#f2b800"),
    under: () => rect(20.0, 1.6, 20.0, 1.4, "#3a3e44", 0.3) + rect(42.0, 1.6, 10.0, 1.2, "#3a3e44", 0.3),
    extra: (cc) => roofCover(16.0, LK.roof, 18.0, 0.8, "#9aa0a6", 3) + hvac(40.0, LK.roof, 9.0, 0.6, "#9aa0a6") + coupler(cc, { x: 1.4, y: 2.8, defl: [1.0, 5.4, 1.2, 2.6] }) +
      lamp(1.2, 5.0, 0.34, 0.42) + lamp(1.2, 4.4, 0.3, 0.28, RED_LAMP) + wiper(4.0, 9.2, 5.6, 11.2),
    gangway: [3.0, 12.4],
  });
}
add("nebLink", { name: "NEB Pesa Link (632) car", kind: "emu" }, M(linkNeb, LK.car, true));

// ===================== Hanseatische Eisenbahn: LVT/S and LINT 27 =====================
// DWA's LVT/S (classes 504/672): a two-axle railbus, 16.54 m over the
// buffers, 3.5 m tall, the axles 9.0 m apart (de.wikipedia "DWA LVT/S"),
// a cab at each end, one double door a side. HANS's: red, a gray window
// band, a white band over it to the roof's edge, a white line along the
// skirt; the door light gray; HANS's mark, the bicycle and wheelchair in
// white (672 906 at Pritzwalk, 2025; 672 914 at Lauterbach, 2024).
const LV = { len: 54.3, roof: 11.5 };
function lvts(c) {
  const L = c.L;
  const nose = [[5.0, 11.5], [3.4, 11.4], [2.4, 10.8], [2.0, 10.2], [1.0, 5.6], [1.0, 3.0], [1.6, 2.6]];
  return sec(c, {
    base: "#c8202c", cab: true, cabR: true, truckTop: 3.0, lo: 1, hi: LV.roof,
    outline: box(L, { roof: LV.roof, low: 3.0, r: 0.8, nose, noseR: nose.map((p) => [...p]) }),
    trucks: [],
    under: () => [L / 2 - 14.76, L / 2 + 14.76].map((x) => circle(x, 1.5, 1.5, "#2a2d31", 0.4) + circle(x, 1.5, 0.5, C.steelDark) + rect(x - 2.0, 2.4, 4.0, 0.6, "currentColor")).join("") +
      rect(L / 2 - 8, 1.4, 16, 1.4, "#3a3e44", 0.3),
    paint: (cc) => rect(-1, -1, L + 2, 20, "#c8202c") + rect(-1, 6.2, L + 2, 3.6, "#7c8186") + rect(-1, 9.8, L + 2, 1.0, "#eef0f1") + rect(-1, 3.4, L + 2, 0.25, "#eef0f1") +
      [0, 1].map((k) => { const g = path("M1.6 6.0L3.4 10.4L5.2 10.6L5.2 6.0Z", "#16191c"); return k ? `<g transform="matrix(-1 0 0 1 ${L} 0)">${g}</g>` : g; }).join(""),
    wins: [[7.0, 11.4], [12.0, 16.4], [20.6, 24.6], [25.2, 29.2], [37.4, 41.4], [42.0, 46.4], [47.0, 49.0]].map(([a, b]) => [a, b, 6.4, 9.6, 0.35]),
    over: (cc) => picto(cc, "bike", 23.0, 4.8, 1.8, "#ffffff") + picto(cc, "chair", 15.0, 4.8, 1.6, "#ffffff") +
      mark(cc, 37.0, 4.8, `<circle cx="0" cy="0" r="0.7" fill="#ffffff"/>` + txt(0, 0.02, 0.5, "HANS", "#c8202c", { weight: 800 }) + txt(1.0, -0.2, 0.32, "HANSEATISCHE", "#ffffff", { weight: 600, anchor: "start" }) + txt(1.0, 0.22, 0.32, "EISENBAHN GMBH", "#ffffff", { weight: 600, anchor: "start" })),
    doors: [{ x: 31.0, w: 3.8, y0: 2.4, y1: 10.4 }], door: (cc, d) => plugDoor(cc, d, "#d9dcdf"),
    extra: (cc) => roofCover(20.0, LV.roof, 14.0, 0.6, "#9aa0a6", 2) + lamp(0.9, 4.4, 0.3, 0.4) + `<g transform="matrix(-1 0 0 1 ${L} 0)">${lamp(0.9, 4.4, 0.3, 0.4)}</g>` +
      [0, L].map((x) => rect(x === 0 ? -0.4 : L - 0.6, 2.6, 1.0, 0.55, "currentColor")).join(""),
  });
}
add("hansLvt", { name: "Hanseatische Eisenbahn LVT/S (672) railbus", kind: "emu" }, M(lvts, LV.len));
// LINT 27 (class 640): one car, 27.4 m, the LINT 41's cab and a door
// behind the middle; ex-HEX, in HANS's red and silver-white: the cab red
// round a white face, red along the bottom, a white sweep rising from the
// skirt over the cab's side (640 121, Tangermünde 2026).
function lint27(c) {
  const L = c.L;
  const nose = [[7.4, 13.1], [5.6, 12.9], [4.2, 12.3], [3.1, 11.2], [2.3, 9.8], [1.75, 8.2], [1.4, 6.4], [1.25, 4.6], [1.3, 3.0], [1.9, 2.4]];
  return sec(c, {
    base: "#e6e8ea", cab: true, cabR: true, truckTop: 2.9, lo: 1.2, hi: 13.1,
    outline: box(L, { roof: 13.1, low: 2.4, r: 0.8, nose, noseR: nose.map((p) => [...p]) }),
    trucks: [[12.6, 6.2, 30.3, "car"], [L - 12.6, 6.2, 30.3, "car"]],
    paint: (cc) => {
      let g = path("M-1 -1L-1 20L10.0 20Q8.6 12.4 7.6 9.0L5.6 4.0L5.6 -1Z", "#b81d2c") + path("M5.4 3.0Q8.6 5.0 10.8 12.0L12.0 12.0Q10.0 5.0 6.4 3.0Z", "#f2f3f4") + path(poly([[1.75, 8.0], [2.25, 9.6], [3.0, 10.9], [4.1, 11.95], [5.5, 12.5], [6.6, 12.6], [6.6, 8.2]]), C.glass);
      return rect(-1, -1, L + 2, 20, "#e6e8ea") + rect(-1, -1, L + 2, 4.4, "#b81d2c") + rect(-1, 12.4, L + 2, 4, "#c7cacd") + g + `<g transform="matrix(-1 0 0 1 ${L} 0)">${g}</g>`;
    },
    wins: [[13.0, 17.6], [18.2, 22.8], [23.4, 28.0], [34.0, 38.6], [39.2, 43.8], [44.4, 49.0], [49.6, 54.2], [54.8, 59.4], [60.0, 64.6], [65.2, 69.8], [70.4, 75.0]].map(([a, b]) => [a, b, 5.6, 10.4, 0.3]),
    over: (cc) => mark(cc, 16.0, 4.2, `<circle cx="0" cy="0" r="0.6" fill="#b81d2c"/>` + txt(0, 0.02, 0.42, "HANS", "#ffffff", { weight: 800 })),
    doors: [{ x: 28.8, w: 4.3, y0: 1.9, y1: 10.6 }], door: (cc, d) => plugDoor(cc, d, "#e6e8ea"),
    extra: (cc) => roofCover(4.5, 13.1, 8.0, 0.8, "#a9aeb3", 2) + hvac(36.0, 13.1, 9.0, 0.7, "#9aa0a6") + roofCover(L - 12.5, 13.1, 8.0, 0.8, "#a9aeb3", 2) +
      coupler(cc, { x: 1.4, y: 3.1, defl: [1.0, 5.6, 1.1, 2.4] }) + lamp(1.3, 5.2, 0.32, 0.45) + `<g transform="matrix(-1 0 0 1 ${L} 0)">${coupler(cc, { x: 1.4, y: 3.1, defl: [1.0, 5.6, 1.1, 2.4] }) + lamp(1.3, 5.2, 0.32, 0.45)}</g>`,
  });
}
add("hansLint27", { name: "Hanseatische Eisenbahn LINT 27 (640)", kind: "emu" }, M(lint27, 89.9));

// ===================== neg: the 628 =====================
// neg's two-car 628.4 (VT 505, with its 928 control car): each car 22.2 m
// (44.35 m over the buffers for the pair; de.wikipedia "DB-Baureihe 628"),
// a cab at each outer end, a door behind each cab and one at the control
// car's inner end. neg's paint: cream below, a gray window band, red over
// the roof's edge and along the skirt, the cab red round a cream face;
// "neg" with its stripes on the nose (Dagebüll Mole, 2023).
const N6 = { car: 72.8, roof: 12.9 };
function neg628(c, ctrl = false) {
  const L = c.L;
  const nose = [[4.4, 12.9], ["q", 2.2, 12.9, 1.8, 11.2], [1.2, 6.0], [1.2, 3.6], [1.6, 3.2]];
  return sec(c, {
    base: "#ede7d6", cab: true, truckTop: 3.6, lo: 1.4, hi: N6.roof,
    outline: box(L, { roof: N6.roof, low: 3.4, r: 0.8, nose }),
    trucks: [[9.6, 8.2, 30, "car"], [L - 8.8, 8.2, 30, "car"]],
    paint: (cc) => rect(-1, -1, L + 2, 20, "#ede7d6") + rect(-1, -1, L + 2, 4.6, "#c0283a") + rect(-1, 6.6, L + 2, 4.0, "#8b9094") + rect(-1, 10.6, L + 2, 4, "#c0283a") +
      rect(-1, 10.6, L + 2, 0.5, "#ede7d6") + path("M-1 -1L-1 20L4.6 20L4.6 -1Z", "#c0283a") + path("M1.4 6.4L2.0 10.6L4.4 10.6L4.4 6.4Z", "#16191c"),
    wins: [[7.6, 9.4, 6.8, 10.2], [12.4, 15.6], [16.8, 20.0], [21.2, 24.4], [25.6, 28.8], [30.0, 33.2], [34.4, 37.6], [38.8, 42.0], [43.2, 46.4], [47.6, 50.8], [52.0, 55.2], [56.4, 59.6]].map(([a, b, y0 = 6.9, y1 = 10.2]) => [a, b, y0, y1, 0.35]),
    over: (cc) => letters(cc, 2.6, 5.2, 0.55, "neg", "#c0283a", { weight: 800, style: "italic" }) + letters(cc, 13.8, 9.0, 0.7, "2", "#d9dcdf", { weight: 600 }),
    doors: [{ x: 5.6, w: 1.8, y0: 3.6, y1: 10.6 }, ...(ctrl ? [{ x: L - 9.6, w: 3.0, y0: 3.6, y1: 10.6 }] : [])], door: (cc, d) => plugDoor(cc, d, "#ede7d6"),
    under: () => rect(20.0, 2.0, 30.0, 1.4, "#3a3e44", 0.3),
    extra: (cc) => (ctrl ? "" : rect(24.0, N6.roof, 2.0, 0.9, "#5a5f64") + rect(26.0, N6.roof + 0.6, 0.5, 0.6, "#3a3d40")) + hvac(40.0, N6.roof, 8.0, 0.5, "#a9aeb3") +
      lamp(1.1, 4.4, 0.3, 0.4) + lamp(1.1, 3.9, 0.26, 0.28, RED_LAMP) + rect(-0.2, 3.0, 1.2, 0.55, "currentColor"),
    gangway: [3.6, 11.6],
  });
}
add("neg628", { name: "neg 628 (VT 505) power car", kind: "emu" }, M((c) => neg628(c), N6.car, true));
add("neg928", { name: "neg 928 control car", kind: "emu" }, M((c) => neg628(c, true), N6.car, true));

// ===================== Regiobahn RE 47: Mireo Plus B (Smart Train Lease) =====================
// Three two-car battery Mireos leased from Smart Train Lease (Siemens) for
// the Düssel-Wupper-Express since July 2026, in the lessor's paint: white,
// black slants either side of the doors, a yellow line looping along the
// side, yellow doors, "Smart Train Lease" with its mark (3464 004 at
// InnoTrans 2024, the Ahrtal unit at Mainz 2026). The geometry is NEB's
// Mireo Plus B's.
function mireoStl(c) {
  const L = c.L;
  return sec(c, {
    base: "#f3f4f4", cab: true, truckTop: 2.3, lo: 1, hi: MR.roof,
    outline: box(L, { roof: MR.roof, low: 2.3, r: 0.9, nose: MR_NOSE }),
    trucks: [[10.0, 8.2, 33, "car"], [L, 8.86, 30, "car"]],
    paint: (cc) => rect(-1, -1, L + 2, 20, "#f3f4f4") + rect(-1, 12.4, L + 2, 4, "#c9cdd0") + rect(-1, -1, L + 2, 2.6, "#2a2d31") +
      path("M14.4 2.6L17.2 2.6L19.6 12.4L16.8 12.4Z", "#2a2d31") + path("M48.0 2.6L51.4 2.6L53.6 12.4L50.2 12.4Z", "#2a2d31") + path("M54.2 2.6L55.4 2.6L57.6 12.4L56.4 12.4Z", "#2a2d31") +
      `<path d="M12.4 12.4Q14.6 6.0 16.4 6.6Q18.4 7.4 17.6 4.6Q17.0 3.2 20.0 3.2L44.0 3.2Q48.2 3.2 49.0 7.6Q49.8 12.0 52.0 12.4" fill="none" stroke="#f2c500" stroke-width="0.28"/>` +
      path("M1.6 8.6L4.6 12.4L8.0 13.0L8.0 8.4Z", "#14181c"),
    wins: [[11.0, 14.0, 6.6, 9.8], [20.6, 27.0], [27.8, 34.2], [55.0, 60.0], [61.0, 66.0], [67.0, 71.0]].map(([a, b, y0 = 5.4, y1 = 10.2]) => [a, b, y0, y1, 0.45]),
    over: (cc) => mark(cc, 40.0, 5.2, `<rect x="-2.6" y="-0.5" width="0.9" height="1.0" rx="0.2" fill="none" stroke="#1d1f22" stroke-width="0.12"/>` +
      txt(-1.4, -0.2, 0.42, "Smart", "#1d1f22", { weight: 500, anchor: "start" }) + txt(-1.4, 0.28, 0.42, "Train Lease", "#1d1f22", { weight: 500, anchor: "start" })),
    doors: [{ x: 42.0, w: 4.4, y0: 2.0, y1: 10.2 }], door: (cc, d) => plugDoor(cc, d, "#f2c500"),
    extra: (cc) => roofCover(12.0, MR.roof, 20.0, 0.8, "#2e3236", 4) + roofCover(40.0, MR.roof, 20.0, 0.8, "#2e3236", 4) +
      coupler(cc, { x: 1.4, y: 2.6, defl: [1.0, 5.0, 0.8, 2.0] }) + lamp(0.9, 4.6, 0.3, 0.42) + lamp(0.9, 4.0, 0.26, 0.28, RED_LAMP) + wiper(2.8, 9.2, 4.2, 11.2),
    gangway: [2.0, 12.0],
  });
}
add("rbMireo", { name: "Regiobahn Mireo Plus B (Smart Train Lease) car", kind: "emu" }, M(mireoStl, MR.car, true));

// ===================== TRI: a 111 and n-coaches (RB 37, RE 100) =====================
// TRI Train Rental runs the RB 37 Neuss-Krefeld for the VRR (2024-2027) with
// a hired class 111 and three "Silberling" n-coaches (26.4 m) in TRI's
// cream and blue with a red line under the windows (111 158, Bösinghoven,
// May 2025). The 111 (16.75 m): traffic red, a light gray skirt, the white
// band on the nose with the DB mark, "Miete oder kaufe mich" (it is a
// DB rental unit).
const NOSE_111 = [[1.2, 4.1], [1.0, 8.0], ["q", 1.0, 8.6, 1.4, 9.4], [1.6, 12.2], ["q", 1.8, 12.9, 3.0, 12.9]];
const tri111 = (c) => euroLoco(c, {
  roof: 12.9, sill: 4.1, nose: NOSE_111, rake: [[1.4, 9.4], [1.6, 12.2]], centers: 26.2, door: 5.0, wheel: 49, surround: "#1d2024",
  paint: (cc, L) => rect(-1, 0, L + 2, 20, "#e2231a") + rect(-1, 0, L + 2, 5.6, "#8f969c") + rect(-1, 11.9, L + 2, 3, "#c9cdd0"),
  over: (cc, L) => letters(cc, L / 2 + 4.0, 8.4, 0.75, "Miete oder kaufe mich.", "#ffffff", { weight: 600, style: "italic" }) +
    letters(cc, L / 2 + 4.0, 7.2, 0.45, "db-gebrauchtzug.de", "#ffffff", { weight: 500 }),
  grilles: [[-12.5, 7.0, 7.4, 10.6]], grilleFill: "rgba(20,22,25,0.45)",
});
add("tri111", { name: "TRI's hired class 111 locomotive", kind: "electric", pan: true }, M(tri111, 16.75 * F, true));
function nCoach(c, cab = false) {
  const L = c.L, R = 13.0;
  const pts = cab ? [[0.4, 3.9], [L - 0.4, 3.9], [L - 0.4, R - 1.1], ["q", L - 0.4, R, L - 1.6, R], [2.4, R], ["q", 0.6, R, 0.5, R - 2.0], [0.4, 6.0]]
    : [[0.4, 3.9], [L - 0.4, 3.9], [L - 0.4, R - 1.1], ["q", L - 0.4, R, L - 1.6, R], [1.6, R], ["q", 0.4, R, 0.4, R - 1.1]];
  return sec(c, {
    base: "#efece2", cab, truckTop: 3.9, lo: 3.9, hi: R,
    outline: pts, trucks: [[11.4, 8.2, 36, "car"], [L - 11.4, 8.2, 36, "car"]],
    paint: (cc) => rect(-1, -1, L + 2, 20, "#efece2") + rect(-1, 7.0, L + 2, 4.2, "#1f2f6e") + rect(-1, 11.2, L + 2, 4, "#a3aab8") + rect(-1, 6.3, L + 2, 0.35, "#d4202c") +
      (cab ? path("M0.4 7.0L0.8 11.0L3.0 11.0L3.0 7.0Z", "#16191c") : ""),
    wins: Array.from({ length: 11 }, (_, i) => [17.2 + i * 4.85, 20.9 + i * 4.85, 7.4, 10.8, 0.4]).filter(([a]) => a < L - 14),
    over: (cc) => letters(cc, 30.0, 5.4, 0.7, "2", "#1f2f6e", { weight: 700 }),
    doors: [{ x: 9.6, w: 4.4, y0: 4.0, y1: 10.8 }, { x: L - 14.0, w: 4.4, y0: 4.0, y1: 10.8 }], door: (cc, d) => plugDoor(cc, d, "#efece2"),
    under: () => rect(20.0, 2.8, 40.0, 1.0, "#3a3e44", 0.3),
    extra: (cc) => [[0, -1], [L, 1]].filter(([x, sd]) => !(cab && sd < 0)).map(([x, sd]) => rect(sd < 0 ? x : x - 1.0, 2.9, 1.0, 0.55, "currentColor", 0, 'opacity="0.85"') + rect(sd < 0 ? x : x - 0.32, 2.55, 0.32, 1.25, C.steelDark, 0.4, 'rx="0.12"')).join("") +
      (cab ? lamp(0.6, 5.2, 0.3, 0.4) + lamp(0.6, 4.6, 0.26, 0.28, RED_LAMP) : ""),
    gangway: [4.2, 11.8],
  });
}
add("triN", { name: "TRI n-coach (\"Silberling\")", kind: "coach" }, M((c) => nCoach(c), 26.4 * F));
add("triNCab", { name: "TRI n-coach driving trailer", kind: "coach", cab: true }, M((c) => nCoach(c, true), 26.4 * F, true));
// The alex Munich-Prague train's border section (RE 25 Furth im Wald-
// Domažlice under Die Länderbahn's name): czechia.cars.js's drawings
// (Die Länderbahn's ER20 diesel, ČD's and alex's coaches), borrowed.
for (const k of ["deEr20", "czCoach", "deAlexCoach"]) if (CZ_MODELS[k]) { TYPES[k] = { ...CZ_TYPES[k] }; MODELS[k] = CZ_MODELS[k]; }
// Every car drawn the other way round (its cab, if any, at the right): the
// key with "R" added, for a unit's trailing half and a second unit coupled.
for (const key of Object.keys(MODELS)) {
  const m = MODELS[key];
  MODELS[key + "R"] = { len: m.len, oneEnd: false,
    draw: (c) => `<g transform="matrix(-1 0 0 1 ${c.L} 0)">${m.draw({ ...c, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: c.coupledL, cabL: c.cabR, cabR: c.cabL })}</g>` };
  TYPES[key + "R"] = { ...TYPES[key] };
}
// ---------- Units ----------
const set = (label, ...units) => ({ label, units: units.flat() });
const unitOf = (...keys) => keys.map((k) => [k, 1]);
const U = {
  rrx: unitOf("rrxEndA", "rrxMid", "rrxMid", "rrxEndBR"),
  nx5: unitOf("nxT2EndA", "nxT2Mid", "nxT2Mid", "nxT2Mid", "nxT2EndBR"), nx3: unitOf("nxT2EndA", "nxT2Mid", "nxT2EndBR"),
  ab5: unitOf("abT2EndA", "abT2Mid", "abT2Mid", "abT2Mid", "abT2EndBR"), ab3: unitOf("abT2EndA", "abT2Mid", "abT2EndBR"),
  odHc6: unitOf("odHcEndA", "odHcMid", "odHcMid", "odHcMid", "odHcMid", "odHcEndBR"),
  odKiss: unitOf("odegKissEnd", "odegKissMidA", "odegKissMid", "odegKissEndR"),
  wfKiss: unitOf("wfbKissEnd", "wfbKissMid", "wfbKissMidA", "wfbKissMid", "wfbKissMid", "wfbKissEndR"),
  wfF3: unitOf("wfbF3End", "wfbF3Mid", "wfbF3MidP", "wfbF3EndR"),
  nbF3: unitOf("nordbahnF3End", "nordbahnF3Mid", "nordbahnF3MidP", "nordbahnF3Mid", "nordbahnF3EndR"),
  eb4: unitOf("eb4F3End", "eb4F3MidP", "eb4F3Mid", "eb4F3Mid", "eb4F3EndR"),
  eb5: unitOf("eurobahnF1EndA", "eurobahnF1Mid", "eurobahnF1MidP", "eurobahnF1Mid", "eurobahnF1EndBR"),
  eb4c: unitOf("eurobahnF1EndA", "eurobahnF1Mid", "eurobahnF1MidP", "eurobahnF1EndBR"),
  eb3: unitOf("wfbeF1EndA", "wfbeF1MidP", "wfbeF1EndBR"),
  can3: unitOf("cantusF1EndB", "cantusF1MidP", "cantusF1EndBR"),
  erAkku: unitOf("erixxAkku", "erixxAkkuR"), nbAkku: unitOf("nordbahnAkku", "nordbahnAkkuR"),
  enno: unitOf("ennoCcEndA", "ennoCcMid", "ennoCcMid2", "ennoCcEndR"),
  mrb5: unitOf("mrbCcEndA", "mrbCcMid", "mrbCcMid2", "mrbCcMid", "mrbCcEndR"), mrb3: unitOf("mrbCcEndA", "mrbCcMid", "mrbCcEndR"),
  bemu: unitOf("mrbBemuEndA", "mrbCcMid", "mrbBemuEndAR"),
  odMl: unitOf("odMlEnd", "odMlMidA", "odMlMid", "odMlEndR"),
  me7: unitOf("meDostoCab", "meDostoBike", "meDosto", "meDosto", "meDosto", "meDosto", "meDosto", "meTraxx"),
  me6: unitOf("meDostoCab", "meDostoBike", "meDosto", "meDosto", "meDosto", "meDosto", "meTraxx"),
  neb: unitOf("nebMireoB", "nebMireoBR"), nebH: unitOf("nebMireoH", "nebMireoHR"),
  trDc: unitOf("trilexDc", "trilexDcR"), odDc: unitOf("odegDc", "odegDcR"),
  vta: unitOf("aknVta", "aknVtaR"),
  link: unitOf("nebLink", "nebLinkR"), neg: unitOf("neg628", "neg928R"), rbm: unitOf("rbMireo", "rbMireoR"),
  tri: unitOf("tri111", "triN", "triN", "triNCabR"),
};
const TRI = () => set("TRI: a class 111 and three n-coaches", U.tri);
const lint = (p, k) => unitOf(`${p}Lint${k}`, `${p}Lint${k}R`);
const tal = (p) => unitOf(`${p}TalEnd`, `${p}TalMid`, `${p}TalEndR`);
const rs1 = (p) => unitOf(`${p}Rs1`);
// What a unit of each drawing runs in (a fleet page's sample, a reported
// number): the whole set.
const BY_KEY = {
  rrxEndA: () => set("RRX Desiro HC, four cars", U.rrx), nxT2EndA: () => set("National Express Talent 2, five cars", U.nx5), abT2EndA: () => set("Abellio Talent 2, five cars", U.ab5),
  odHcEndA: () => set("ODEG Desiro HC, six cars", U.odHc6), odegKissEnd: () => set("ODEG KISS, four cars", U.odKiss), wfbKissEnd: () => set("WestfalenBahn KISS, six cars", U.wfKiss),
  wfbF3End: () => set("WestfalenBahn FLIRT 3, four cars", U.wfF3), nordbahnF3End: () => set("Nordbahn FLIRT 3, five cars", U.nbF3), eb4F3End: () => set("eurobahn FLIRT 3 (ET 4), five cars", U.eb4),
  eurobahnF1EndA: () => set("eurobahn FLIRT, four cars", U.eb4c), wfbeF1EndA: () => set("eurobahn FLIRT (ex-WestfalenBahn), three cars", U.eb3), cantusF1EndB: () => set("cantus FLIRT, three cars", U.can3),
  erixxAkku: () => set("erixx Holstein FLIRT Akku", U.erAkku), nordbahnAkku: () => set("Nordbahn FLIRT Akku", U.nbAkku), ennoCcEndA: () => set("enno Coradia Continental, four cars", U.enno),
  mrbCcEndA: () => set("MRB Coradia Continental, five cars", U.mrb5), mrbBemuEndA: () => set("MRB Coradia Continental BEMU, three cars", U.bemu), odMlEnd: () => set("ODEG Desiro ML, four cars", U.odMl),
  meDostoCab: () => set("metronom: TRAXX and seven double-deck coaches", U.me7), nebMireoB: () => set("NEB Mireo Plus B", U.neb), nebMireoH: () => set("NEB Mireo Plus H", U.nebH),
  trilexDc: () => set("trilex Desiro Classic", U.trDc), nebLink: () => set("NEB Pesa Link", U.link), neg628: () => set("neg 628 (VT 505)", U.neg), rbMireo: () => set("Regiobahn Mireo Plus B", U.rbm),
  tri111: () => TRI(), hansLvt: () => set("Hanseatische Eisenbahn LVT/S", unitOf("hansLvt")), hansLint27: () => set("Hanseatische Eisenbahn LINT 27", unitOf("hansLint27")), odegDc: () => set("ODEG Desiro Classic", U.odDc), aknVta: () => set("AKN VTA", U.vta),
  nwbTalEnd: () => set("NordWestBahn Talent", tal("nwb")), rrbTalEnd: () => set("RheinRuhrBahn Talent", tal("rrb")), eurobahnTalEnd: () => set("eurobahn Talent", tal("eurobahn")), mrbTalEnd: () => set("MRB Talent", tal("mrb")),
};
for (const [p, k, name] of LINT_UNITS) BY_KEY[`${p}Lint${k}`] = () => set(`${name} ${k === "54" ? "LINT 54" : "LINT 41"}`, lint(p, k));
for (const p of ["eb", "stb", "odeg", "cb", "rurtal", "vogtland", "trilex", "feg", "press"]) BY_KEY[`${p}Rs1`] = () => set(TYPES[`${p}Rs1`].name, rs1(p));

// ---------- Typical trains ----------
// What usually runs each line, autumn 2026 (de.wikipedia's operator
// articles and each state's "Liste der SPNV-Linien", the railways' pages).
// Several railways share line numbers ("RB 33" is EVB's at Cuxhaven, the
// Hanseatische Eisenbahn's at Stendal and ODEG's at Potsdam), so a line is
// told apart by its end stations.
const at = (t, re) => re.test(`${t.origin || ""}|${t.destination || ""}`);
const NRW_RRX = /Aachen|Hamm|Dortmund|Düsseldorf|Köln|Koblenz|Wesel|Dinslaken|Minden|Kassel|Oberhausen|Bonn|Duisburg/;
const ME7 = () => set("metronom: TRAXX and seven double-deck coaches", U.me7);
const ME6 = () => set("metronom: TRAXX and six double-deck coaches", U.me6);
function typicalRE(t, n) {
  switch (n) {
    case 1: return at(t, /Görlitz|Dresden|Zgorzelec/) ? set("trilex Desiro Classic, two coupled", U.trDc, U.trDc)
      : at(t, NRW_RRX) ? set("RRX Desiro HC, two four-car units", U.rrx, U.rrx) : set("ODEG Desiro HC, six cars", U.odHc6);
    case 2: return set("trilex Desiro Classic, two coupled", U.trDc, U.trDc);
    case 3: return at(t, /Hamburg|Uelzen|Hannover|Lüneburg|Celle/) ? ME7()
      : at(t, /Hamm|Düsseldorf|Dortmund|Oberhausen|Duisburg/) ? set("eurobahn FLIRT, five cars (often two units)", U.eb5)
      : at(t, /Stralsund|Greifswald|Pasewalk/) ? set("ODEG Desiro ML, four cars", U.odMl) : set("MRB Coradia Continental, five cars", U.mrb5);
    case 4: return at(t, /Bremen|Hamburg/) ? ME7() : set("RRX Desiro HC, two four-car units", U.rrx, U.rrx);
    case 5: return at(t, /Kassel|Hersfeld|Melsungen|Bebra/) ? set("cantus FLIRT, three cars (some trains a Talent 2)", U.can3) : set("RRX Desiro HC, two four-car units", U.rrx, U.rrx);
    case 6: return at(t, /Leipzig|Chemnitz|Geithain/) ? set("MRB Coradia Continental BEMU (battery), often two", U.bemu) : set("RRX Desiro HC, two four-car units", U.rrx, U.rrx);
    case 7: return set("National Express Talent 2, two five-car units", U.nx5, U.nx5);
    case 8: return at(t, /Kassel|Leinefelde|Eichenberg|Halle|Nordhausen|Sangerhausen/) ? set("Abellio Talent 2, five cars", U.ab5) : set("ODEG KISS, four cars (some trains a Desiro HC)", U.odKiss);
    case 9: return at(t, /Rostock|Stralsund|Sassnitz|Binz|Bergen|Lietzow|Martensdorf/) ? set("ODEG Desiro ML, four cars", U.odMl) : set("Abellio Talent 2, five cars", U.ab5);
    case 10: return at(t, /Hannover|Harzburg|Hildesheim|Goslar/) ? set("erixx LINT 54 (often two)", lint("erixx", "54")) : set("RheinRuhrBahn LINT 41, two coupled", lint("rrb", "41"), lint("rrb", "41"));
    case 11: return set("RRX Desiro HC, two four-car units (one beyond Hamm)", U.rrx, U.rrx);
    case 12: return set("Erfurter Bahn Regio-Shuttles, two coupled", rs1("eb"), rs1("eb"));
    case 13: return set("eurobahn FLIRT, five cars", U.eb5);
    case 14: return set("RheinRuhrBahn Talent (often two)", tal("rrb"));
    case 15: return at(t, /Leipzig|Saalfeld|Jena|Naumburg/) ? set("Abellio Talent 2, five cars", U.ab5) : set("WestfalenBahn FLIRT 3, two four-car units", U.wfF3, U.wfF3);
    case 16: return set("Abellio Talent 2, five cars", U.ab5);
    case 47: return set("Regiobahn Mireo Plus B (Smart Train Lease)", U.rbm);
    case 25: return CZ_MODELS.deEr20 ? set("alex: Die Länderbahn's ER20 with ČD and alex coaches", [["deEr20", 1], ["czCoach", 2], ["deAlexCoach", 2]]) : null;
    case 59: return TRI();
    case 100: return TRI();
    case 18: return set("NordWestBahn LINT 41, two coupled", lint("nwb", "41"), lint("nwb", "41"));
    case 30: return set("enno Coradia Continental, four cars", U.enno);
    case 44: return set("RheinRuhrBahn LINT 41 (stand-in trains also run)", lint("rrb", "41"));
    case 45: return set("Süd-Thüringen-Bahn Regio-Shuttle", rs1("stb"));
    case 50: return at(t, /Rostock|Waren|Güstrow|Neustrelitz/) ? set("ODEG Desiro ML, four cars", U.odMl) : set("enno Coradia Continental, four cars", U.enno);
    case 60: case 70: return set("WestfalenBahn KISS, six cars", U.wfKiss);
    case 72: case 74: return set("Nordbahn FLIRT Akku (often two)", U.nbAkku);
    case 78: return set("eurobahn FLIRT (ex-WestfalenBahn), three cars", U.eb3);
    case 82: return set("eurobahn Talent", tal("eurobahn"));
    case 83: return set("erixx Holstein FLIRT Akku (often two)", U.erAkku);
    default: return null;
  }
}
function typicalRB(t, n) {
  switch (n) {
    case 1: case 2: case 4: return set("vogtlandbahn Regio-Shuttle", rs1("vogtland"));
    case 5: return at(t, /Kassel|Fulda|Hersfeld|Bebra/) ? set("cantus FLIRT, three cars", U.can3) : set("vogtlandbahn Regio-Shuttle", rs1("vogtland"));
    case 6: case 83: case 87: return at(t, /Holzhau|Freiberg/) ? set("Freiberger Eisenbahn Regio-Shuttle", rs1("feg")) : set("cantus FLIRT, three cars", U.can3);
    case 10: case 18: return set("ODEG KISS, four cars (some trains a Desiro HC)", U.odKiss);
    case 12: case 35: case 54: return set("NEB Mireo Plus B (often two)", U.neb);
    case 25: return at(t, /Halle|Saalfeld|Jena|Naumburg/) ? set("Abellio Talent 2, five cars", U.ab5) : set("NEB Mireo Plus B (often two)", U.neb);
    case 36: return at(t, /Duisburg|Oberhausen/) ? set("RheinRuhrBahn LINT 41", lint("rrb", "41")) : set("NEB Mireo Plus B (often two)", U.neb);
    case 60: return at(t, /Dresden|Görlitz/) ? set("trilex Desiro Classic", U.trDc) : at(t, /Elmshorn|Altona|Hamburg/) ? set("Nordbahn FLIRT 3, five cars", U.nbF3) : set("NEB Mireo Plus B", U.neb);
    case 61: return at(t, /Dresden|Zittau/) ? set("trilex Desiro Classic", U.trDc) : at(t, /Itzehoe|Altona|Hamburg|Elmshorn/) ? set("Nordbahn FLIRT 3, five cars", U.nbF3)
      : at(t, /Bielefeld|Osnabrück|Rheine|Hengelo|Bentheim/) ? set("eurobahn FLIRT 3 (ET 4), five cars", U.eb4) : set("NEB Mireo Plus B", U.neb);
    case 63: return at(t, /Neumünster|Heide|Büsum|Hohenwestedt/) ? set("Nordbahn FLIRT Akku", U.nbAkku) : set("NEB Mireo Plus B", U.neb);
    case 13: case 14: case 15: return at(t, /Gera|Hof|Weida|Zeulenroda/) ? set("Erfurter Bahn Regio-Shuttle", rs1("eb")) : set("ODEG Regio-Shuttle (battery FLIRTs to come)", rs1("odeg"));
    case 20: return set("Abellio Talent 2, five cars", U.ab5);
    case 21: return at(t, /Linnich|Jülich/) ? set("Rurtalbahn LINT 54", lint("rurtal", "54")) : at(t, /Heimbach|Untermaubach|Düren/) ? set("Rurtalbahn Regio-Shuttles, two coupled", rs1("rurtal"), rs1("rurtal"))
      : set("Erfurter Bahn LINT 41 (or Regio-Shuttles)", lint("eb", "41"));
    case 50: return at(t, /Münster|Dortmund|Lünen/) ? set("eurobahn FLIRT, four cars", U.eb4c) : set("Erfurter Bahn Regio-Shuttle", rs1("eb"));
    case 22: case 23: case 40: return set("Erfurter Bahn Regio-Shuttles, two coupled", rs1("eb"), rs1("eb"));
    case 26: return at(t, /Weimar|Kranichfeld/) ? set("Erfurter Bahn Regio-Shuttle", rs1("eb")) : at(t, /Lauterbach|Bergen|Putbus/) ? set("Pressnitztalbahn Regio-Shuttle (Zu(g)bringer)", rs1("press"))
      : set("NEB Pesa Link, two coupled", U.link, U.link);
    case 27: return at(t, /Sömmerda|Buttstädt/) ? set("Erfurter Bahn Regio-Shuttle", rs1("eb")) : set("NEB Mireo Plus H (hydrogen)", U.nebH);
    case 28: return at(t, /Euskirchen|Düren/) ? set("Rurtalbahn Regio-Shuttle", rs1("rurtal")) : set("Erfurter Bahn Regio-Shuttle", rs1("eb"));
    case 30: return set("MRB Coradia Continental, five cars", U.mrb5);
    case 31: return at(t, /Hamburg|Lüneburg|Winsen|Uelzen/) ? ME6() : set("RheinRuhrBahn LINT 41", lint("rrb", "41"));
    case 32: return at(t, /Dannenberg|Lüneburg/) ? set("erixx LINT 54", lint("erixx", "54")) : at(t, /Saalfeld|Blankenstein/) ? set("Erfurter Bahn Regio-Shuttle", rs1("eb")) : null;
    case 33: return at(t, /Cuxhaven|Bremerhaven|Buxtehude|Bremervörde/) ? set("EVB Coradia iLint (LINT 41s while hydrogen is short)", lint("evb", "54"))
      : at(t, /Potsdam|Jüterbog|Beelitz/) ? set("ODEG LINT 54", lint("odeg", "54")) : set("Hanseatische Eisenbahn LINT 27", unitOf("hansLint27"));
    case 37: return at(t, /Wannsee|Beelitz/) ? set("ODEG LINT 54", lint("odeg", "54")) : at(t, /Glauchau|Gößnitz/) ? set("City-Bahn Chemnitz Regio-Shuttle", rs1("cb")) : TRI();
    case 41: return at(t, /Bremen|Hamburg/) ? ME6() : set("Süd-Thüringen-Bahn Regio-Shuttle", rs1("stb"));
    case 42: case 47: return set("erixx LINT 54", lint("erixx", "54"));
    case 43: return at(t, /Goslar|Braunschweig|Vienenburg/) ? set("erixx LINT 54", lint("erixx", "54")) : set("Süd-Thüringen-Bahn Regio-Shuttle", rs1("stb"));
    case 44: return set("Süd-Thüringen-Bahn Regio-Shuttles, two coupled", rs1("stb"), rs1("stb"));
    case 45: return set("MRB Coradia Continental, three cars", U.mrb3);
    case 46: return at(t, /Cottbus|Forst/) ? set("ODEG Desiro Classic", U.odDc) : set("Süd-Thüringen-Bahn Regio-Shuttle", rs1("stb"));
    case 48: return at(t, /Wuppertal|Köln|Bonn|Solingen/) ? set("National Express Talent 2, five cars", U.nx5) : set("Süd-Thüringen-Bahn Regio-Shuttle", rs1("stb"));
    case 51: return set("ODEG LINT 54", lint("odeg", "54"));
    case 57: return set("Abellio Talent 2, three cars", U.ab3);
    case 58: return set("NordWestBahn LINT 41 (often two)", lint("nwb", "41"));
    case 59: return at(t, /Erfurt|Artern|Sangerhausen/) ? set("Abellio Talent 2, three cars", U.ab3) : at(t, /Wilhelmshaven|Esens|Jever/) ? set("NordWestBahn LINT 41", lint("nwb", "41"))
      : set("eurobahn FLIRT, four cars", U.eb4c);
    case 64: return at(t, /Husum|Peter-Ording|Tönning/) ? set("Nordbahn FLIRT Akku", U.nbAkku) : set("ODEG Regio-Shuttle", rs1("odeg"));
    case 65: return at(t, /Münster|Rheine/) ? set("eurobahn FLIRT, four cars", U.eb4c) : at(t, /Cottbus|Zittau|Görlitz/) ? set("ODEG Desiro Classic", U.odDc) : set("neg 628 (VT 505)", U.neg);
    case 66: return at(t, /Münster|Osnabrück|Lengerich/) ? set("eurobahn FLIRT, four cars", U.eb4c) : set("neg 628 (VT 505)", U.neg);
    case 67: return set("eurobahn Talent", tal("eurobahn"));
    case 69: case 89: return set("eurobahn FLIRT, four cars", U.eb4c);
    case 71: return at(t, /Wrist|Altona|Hamburg|Elmshorn/) ? set("Nordbahn FLIRT 3, five cars", U.nbF3) : set("eurobahn Talent", tal("eurobahn"));
    case 72: return set("eurobahn FLIRT (ex-WestfalenBahn), three cars", U.eb3);
    case 73: return at(t, /Lemgo|Bielefeld/) ? set("eurobahn Talent", tal("eurobahn")) : at(t, /Kiel|Eckernförde|Rieseby/) ? set("Nordbahn FLIRT Akku", U.nbAkku) : set("Hanseatische Eisenbahn LVT/S railbus", unitOf("hansLvt"));
    case 74: return at(t, /Paderborn|Bielefeld/) ? set("NordWestBahn Talent", tal("nwb")) : set("Hanseatische Eisenbahn LVT/S railbus", unitOf("hansLvt"));
    case 16: return set("Hanseatische Eisenbahn LVT/S railbus (for ODEG)", unitOf("hansLvt"));
    case 56: return set("Bentheimer Eisenbahn LINT 41", lint("beb", "41n"));
    case 75: return at(t, /Osnabrück|Bielefeld|Halle/) ? set("NordWestBahn Talent", tal("nwb")) : set("Nordbahn FLIRT Akku", U.nbAkku);
    case 76: return at(t, /Kiel|Schönkirchen|Schönberg/) ? set("erixx Holstein FLIRT Akku", U.erAkku) : set("Erfurter Bahn Regio-Shuttle", rs1("eb"));
    case 82: return set("Nordbahn FLIRT Akku", U.nbAkku);
    case 84: return at(t, /Kiel|Lübeck|Plön|Eutin/) ? set("erixx Holstein FLIRT Akku", U.erAkku) : set("NordWestBahn Talent (two, splitting at Ottbergen)", tal("nwb"));
    case 85: return set("NordWestBahn Talent", tal("nwb"));
    case 92: return set("City-Bahn Chemnitz Regio-Shuttle", rs1("cb"));
    case 110: return set("MRB Talent (often two)", tal("mrb"));
    default: return null;
  }
}
function typical(t) {
  const r = String(t.route || "").replace(/\s+/g, " ").trim();
  const m = r.match(/^([A-Z]+) ?(\d+)$/), cat = m ? m[1] : r, n = m ? Number(m[2]) : 0;
  if (cat === "A") return n === 1 ? set("AKN VTA, two coupled", U.vta, U.vta) : n === 2 ? set("AKN LINT 54", lint("akn", "54"))
    : set("AKN VTA (some trains a LINT 41 from Nordbahn)", U.vta);
  if (cat === "L" || cat === "T") return at(t, /Liberec|Seifhennersdorf|Zittau|Varnsdorf|Mikul/) ? set("trilex Desiro Classic", U.trDc)
    : at(t, /Cranzahl|Krimov|Vejprty|Chomutov/) ? set("Die Länderbahn CZ Regio-Shuttle (ex-ODEG, trilex)", rs1("trilex")) : null;
  if (cat === "RE") return typicalRE(t, n);
  if (cat === "RB") return typicalRB(t, n);
  return null;
}
export const FLEETS = {
  deprivat: [
    [462001, 462085, "rrxEndA"], [9442301, 9442335, "nxT2EndA"], [9442101, 9442120, "abT2EndA"], [3462101, 3462121, "odHcEndA"], [3462501, 3462521, "odHcEndA"],
    [445101, 445116, "odegKissEnd"], [445001, 445013, "wfbKissEnd"], [1428101, 1428115, "wfbF3End"], [1429501, 1429508, "nordbahnF3End"], [2429011, 2429018, "eb4F3End"],
    [428100, 428128, "eurobahnF1EndA"], [427109, 427122, "wfbeF1EndA"], [427001, 427057, "cantusF1EndB"], [2526001, 2526028, "erixxAkku"], [2526029, 2526055, "nordbahnAkku"],
    [1440101, 1440129, "ennoCcEndA"], [1440401, 1440411, "mrbBemuEndA"], [1440701, 1440729, "mrbCcEndA"], [4746001, 4746009, "odMlEnd"], [146501, 146542, "meDostoCab"],
    [563031, 563061, "nebMireoB"], [563003, 563009, "nebMireoH"], [642301, 642336, "trilexDc"], [642901, 642920, "odegDc"],
    [622701, 622728, "erixxLint54"], [622151, 622164, "aknLint54"], [1622001, 1622008, "odegLint54"], [554001, 554014, "evbLint54"], [622211, 622213, "rurtalLint54"],
    [648001, 648099, "nwbLint41"], [648420, 648447, "rrbLint41"], [648194, 648198, "evbLint41"], [1648801, 1648806, "nwbLint41n"],
    [643301, 643399, "nwbTalEnd"], [643101, 643199, "rrbTalEnd"], [643001, 643014, "eurobahnTalEnd"], [643601, 643620, "mrbTalEnd"],
    [650501, 650532, "stbRs1"], [650301, 650340, "ebRs1"], [650850, 650899, "odegRs1"], [650513, 650518, "cbRs1"], [650740, 650747, "rurtalRs1"], [650601, 650625, "vogtlandRs1"],
    [650056, 650058, "fegRs1"], [650032, 650034, "pressRs1"], [650069, 650079, "trilexRs1"], [251, 268, "aknVta"], [632530, 632540, "nebLink"], [628505, 628506, "neg628"], [3464005, 3464007, "rbMireo"], [111054, 111227, "tri111"], [672901, 672920, "hansLvt"], [640121, 640125, "hansLint27"], [1648111, 1648115, "bebLint41n"],
  ],
};
export const TYPICAL = {
  deprivat: (t, reported) => {
    if (reported && BY_KEY[reported.replace(/R$/, "")]) return BY_KEY[reported.replace(/R$/, "")]();
    return typical(t);
  },
};
// ---------- Fact sheets ----------
const DEWP = "https://de.wikipedia.org/wiki/";
const fam = {
  hc: { model: "Siemens Desiro HC", type: "Electric multiple unit (single-deck end cars, double-deck middle cars)", builder: "Siemens Mobility", topSpeedMph: 99, source: `${DEWP}Siemens_Desiro_HC` },
  t2: { model: "Bombardier Talent 2", type: "Articulated electric multiple unit", builder: "Bombardier Transportation", topSpeedMph: 99, source: `${DEWP}Bombardier_Talent_2` },
  lint: { model: "Alstom Coradia LINT", type: "Diesel multiple unit", builder: "Alstom (LHB)", source: `${DEWP}Alstom_Coradia_LINT` },
  tal: { model: "Bombardier Talent (643)", type: "Articulated diesel multiple unit", builder: "Bombardier (Talbot)", topSpeedMph: 75, source: `${DEWP}Bombardier_Talent` },
  f1: { model: "Stadler FLIRT", type: "Articulated electric multiple unit", builder: "Stadler Rail", topSpeedMph: 99, source: `${DEWP}Stadler_Flirt` },
  f3: { model: "Stadler FLIRT 3", type: "Articulated electric multiple unit", builder: "Stadler Rail", topSpeedMph: 99, source: `${DEWP}Stadler_Flirt` },
  kiss: { model: "Stadler KISS", type: "Double-deck electric multiple unit", builder: "Stadler Rail", topSpeedMph: 99, source: `${DEWP}Stadler_KISS` },
  cc: { model: "Alstom Coradia Continental (1440)", type: "Articulated electric multiple unit", builder: "Alstom", topSpeedMph: 99, source: `${DEWP}Alstom_Coradia_Continental` },
  rs1: { model: "Stadler Regio-Shuttle RS1 (650)", type: "Diesel railcar", builder: "Stadler (Adtranz)", lengthFt: 84, topSpeedMph: 75, source: `${DEWP}Stadler_Regio-Shuttle_RS1` },
  dc: { model: "Siemens Desiro Classic (642)", type: "Articulated diesel multiple unit", builder: "Siemens", topSpeedMph: 75, source: `${DEWP}Siemens_Desiro_Classic` },
  ml: { model: "Siemens Desiro ML", type: "Electric multiple unit", builder: "Siemens", topSpeedMph: 99, source: `${DEWP}Ostdeutsche_Eisenbahn` },
  mireo: { model: "Siemens Mireo Plus B / H (563)", type: "Battery (or hydrogen) multiple unit", builder: "Siemens Mobility", built: "2024–2025", topSpeedMph: 87, source: `${DEWP}Niederbarnimer_Eisenbahn` },
  me: { model: "Bombardier double-deck coach (Görlitz, 4th generation)", type: "Double-deck coach", builder: "Bombardier (Görlitz)", built: "2003–2010; refitted 2019–2025", topSpeedMph: 99, source: `${DEWP}Metronom_Eisenbahngesellschaft` },
};
const f = (b, about, extra = {}) => ({ ...b, ...extra, about });
const facts = {
  rrxEndA: f(fam.hc, "The Rhein-Ruhr-Express's four-car units (462 001–085), run by National Express on RE 1, 4, 5, 6 and 11, usually two coupled; first class in this end car.", { built: "2017–2021", fleet: "84 four-car units" }),
  rrxEndB: f(fam.hc, "The other end car: the multi-purpose area and the accessible toilet."), rrxMid: f(fam.hc, "A double-deck trailer: two doors a side into the low floor between its trucks."),
  nxT2EndA: f(fam.t2, "National Express's Talent 2s (2015) on RE 7 and RB 48: 10 three-car and 25 five-car units.", { built: "2015", fleet: "35 units" }),
  nxT2EndB: f(fam.t2, "An end car."), nxT2Mid: f(fam.t2, "A middle car on Jakobs trucks."),
  abT2EndA: f(fam.t2, "Abellio Rail Mitteldeutschland's Saale-Thüringen-Südharz network (since 2015): 20 three-car and 15 five-car units, silver with red doors.", { built: "2014–2015", fleet: "35 units" }),
  abT2EndB: f(fam.t2, "An end car."), abT2Mid: f(fam.t2, "A middle car."),
  odHcEndA: f(fam.hc, "ODEG's RE 1 (Magdeburg–Berlin–Frankfurt (Oder)) since December 2022: six-car units and four-car ones, white with the yellow cab and teal skirt.", { built: "2021–2022", fleet: "15 six-car, 14 four-car units" }),
  odHcEndB: f(fam.hc, "The other end car."), odHcMid: f(fam.hc, "A double-deck trailer."),
  odegKissEnd: f(fam.kiss, "ODEG's four-car KISS (445.101–116) on RE 8 and RB 10; first class moved upstairs in a middle car in the 2022 refit.", { built: "2012", fleet: "16" }),
  odegKissMid: f(fam.kiss, "A middle car."), odegKissMidA: f(fam.kiss, "The middle car with first class upstairs."),
  wfbKissEnd: f(fam.kiss, "WestfalenBahn's six-car KISS (ET 601–613) on RE 60 and RE 70, Braunschweig–Hannover–Rheine/Bielefeld.", { built: "2015", fleet: "13" }),
  wfbKissMid: f(fam.kiss, "A middle car."), wfbKissMidA: f(fam.kiss, "The middle car with first class upstairs."),
  wfbF3End: f(fam.f3, "WestfalenBahn's four-car FLIRT 3s (ET 401–415) on the Emsland-Express RE 15, usually two coupled.", { built: "2015", fleet: "15" }),
  wfbF3Mid: f(fam.f3, "A middle car."), wfbF3MidP: f(fam.f3, "The middle car with the pantograph."),
  nordbahnF3End: f(fam.f3, "Nordbahn's FLIRT 3s on Hamburg–Elmshorn–Itzehoe/Wrist (RB 61, RB 71), in NAH.SH's paint.", { fleet: "5-car ET 5.01–5.08, 6-car ET 6.01–6.08" }),
  nordbahnF3Mid: f(fam.f3, "A middle car."), nordbahnF3MidP: f(fam.f3, "The middle car with the pantograph."),
  eb4F3End: f(fam.f3, "eurobahn's multi-system FLIRT 3s (ET 4.01–4.08) for Bielefeld–Osnabrück–Hengelo (RB 61).", { fleet: "8" }),
  eb4F3Mid: f(fam.f3, "A middle car."), eb4F3MidP: f(fam.f3, "The middle car with the pantograph."),
  eurobahnF1EndA: f(fam.f1, "eurobahn's FLIRTs on the Hellweg network and RE 3/RE 13 (ET 5.xx–7.xx, four and five cars); first class behind the cab.", { built: "2007–2009" }),
  eurobahnF1EndB: f(fam.f1, "An end car."), eurobahnF1Mid: f(fam.f1, "A middle car."), eurobahnF1MidP: f(fam.f1, "The middle car with the pantograph."),
  wfbeF1EndA: f(fam.f1, "The ex-WestfalenBahn FLIRTs (ET 8.xx, 9.xx) eurobahn runs on RB 72 and RE 78, still in WestfalenBahn's blue and lime with eurobahn's name."),
  wfbeF1EndB: f(fam.f1, "An end car."), wfbeF1Mid: f(fam.f1, "A middle car."), wfbeF1MidP: f(fam.f1, "The middle car with the pantograph."),
  cantusF1EndB: f(fam.f1, "cantus's three- and four-car FLIRTs (2006–2007) around Kassel, Göttingen, Fulda and Eisenach; second class only.", { fleet: "14 three-car, 7 four-car" }),
  cantusF1EndA: f(fam.f1, "An end car."), cantusF1Mid: f(fam.f1, "A middle car."), cantusF1MidP: f(fam.f1, "The middle car with the pantograph."),
  erixxAkku: f({ ...fam.f3, model: "Stadler FLIRT Akku (2526)", type: "Battery electric multiple unit" }, "erixx Holstein's battery FLIRTs (Kiel–Lübeck–Lüneburg, Kiel–Schönberger Strand), NAH.SH's pool.", { built: "2022–2023", fleet: "26" }),
  nordbahnAkku: f({ ...fam.f3, model: "Stadler FLIRT Akku (2526)", type: "Battery electric multiple unit" }, "Nordbahn's battery FLIRTs on the Kiel, Husum, Büsum and Bad Oldesloe lines since 2024.", { fleet: "29" }),
  ennoCcEndA: f(fam.cc, "enno (metronom) for the Großraum Braunschweig: Hannover–Wolfsburg (RE 30), Hildesheim–Braunschweig–Wolfsburg (RE 50); graphite and traffic purple.", { built: "2015–2026", fleet: "29 four-car units (1440 101–129)" }),
  ennoCcEnd: f(fam.cc, "The end car with the reservation compartment (the R)."), ennoCcMid: f(fam.cc, "A middle car with the pantograph."), ennoCcMid2: f(fam.cc, "A middle car with the bicycle area."),
  mrbCcEndA: f(fam.cc, "The Elektronetz Mittelsachsen's units (VMS-owned), run by the Mitteldeutsche Regiobahn (Transdev) on RE 3, RB 30, RB 45.", { fleet: "13 three-car, 16 five-car" }),
  mrbCcEnd: f(fam.cc, "An end car."), mrbCcMid: f(fam.cc, "A middle car with the pantograph."), mrbCcMid2: f(fam.cc, "A middle car."),
  mrbBemuEndA: f({ ...fam.cc, type: "Battery electric multiple unit" }, "The battery Coradias (1440 401–411, 840 kWh on the roof) on Leipzig–Chemnitz (RE 6) since 2 February 2026.", { fleet: "11" }),
  odMlEnd: f(fam.ml, "ODEG's Desiro MLs (4746, leased) on the Baltic coast lines RE 9 and RE 50, four cars since 2021."), odMlMid: f(fam.ml, "A middle car."), odMlMidA: f(fam.ml, "The middle car with first class."),
  meTraxx: { model: "Bombardier TRAXX P160 AC (146)", type: "Electric locomotive", builder: "Bombardier", built: "2003–2013", topSpeedMph: 99, lengthFt: 62, source: `${DEWP}Metronom_Eisenbahngesellschaft`,
    about: "The LNVG's TRAXX for metronom's push-pull trains (Hamburg–Bremen, Hamburg–Uelzen–Hannover), at the Hannover/Bremen end." },
  meDostoCab: f(fam.me, "The driving trailer at the Hamburg end: first class upstairs, the multi-purpose area and ramp downstairs."), meDosto: f(fam.me, "A second-class coach."),
  meDostoBike: f(fam.me, "The bicycle coach, with low entrances (DBpdza)."),
  nebMireoB: f(fam.mireo, "The Niederbarnimer Eisenbahn's battery Mireos on the Ostbrandenburg lines since December 2024.", { fleet: "31 (563 031–061)" }),
  nebMireoH: f(fam.mireo, "The hydrogen Mireos of the Heidekrautbahn (RB 27).", { fleet: "7 (563 003–009)" }),
  trilexDc: f(fam.dc, "trilex (Die Länderbahn) Dresden–Görlitz/Zittau–Liberec, in the 2020–2023 silver and orange.", { fleet: "36" }),
  odegDc: f(fam.dc, "ODEG's Lausitz units (Cottbus–Görlitz–Zittau, Cottbus–Forst).", { fleet: "6" }),
  aknVta: { model: "LHB VTA", type: "Diesel-electric multiple unit", builder: "LHB", built: "1993", topSpeedMph: 62, source: `${DEWP}AKN_Eisenbahn`, about: "AKN's two-car units on the A 1 and A 3, usually two coupled." },
  meTraxxR: null,
  nebLink: { model: "Pesa Link II (632)", type: "Diesel multiple unit", builder: "Pesa Bydgoszcz", built: "2015–2016", fleet: "11 two-car units (VT 73x)", lengthFt: 143, topSpeedMph: 75,
    source: `${DEWP}Pesa_Link`, about: "NEB's last diesels, on Berlin–Kostrzyn (RB 26), often two coupled." },
  hansLvt: { model: "DWA LVT/S (504/672)", type: "Two-axle diesel railbus", builder: "DWA", built: "1996–2001", fleet: "14", lengthFt: 54, topSpeedMph: 62, source: `${DEWP}DWA_LVT/S`,
    about: "The Hanseatische Eisenbahn's railbuses in the Prignitz (RB 73, RB 74) and on the Kleinseenbahn (RB 16)." },
  hansLint27: { ...fam.lint, model: "Alstom Coradia LINT 27 (640)", type: "Diesel railcar", fleet: "3 (640 121, 122, 125)", lengthFt: 90, about: "Ex-HEX single cars on Wittenberge–Stendal–Tangermünde (RB 33)." },
  neg628: { model: "DB class 628/928", type: "Diesel multiple unit", builder: "Duewag/LHB", built: "1986–1996", source: `${DEWP}DB-Baureihe_628`, lengthFt: 146,
    about: "neg's two-car set (VT 505 with its control car) on Niebüll–Dagebüll Mole and Niebüll–Tønder." },
  neg928: { model: "DB class 928 control car", type: "Diesel multiple unit (control car)", builder: "Duewag/LHB", source: `${DEWP}DB-Baureihe_628`, about: "The 628's unpowered half, with its own cab." },
  rbMireo: { ...fam.mireo, model: "Siemens Mireo Plus B (Smart Train Lease)", built: "2024–2026", fleet: "3 leased", source: `${DEWP}Siemens_Mireo`,
    about: "Regiobahn's battery trains for the Düssel-Wupper-Express (RE 47) since July 2026, in the lessor's white." },
  tri111: { model: "DB class 111", type: "Electric locomotive", builder: "Krauss-Maffei, Krupp, Henschel", built: "1974–1984", topSpeedMph: 99, lengthFt: 55, source: `${DEWP}TRI_Train_Rental`,
    about: "TRI Train Rental runs the VRR's RB 37 Neuss–Krefeld (2024–2027) with a hired 111 and n-coaches; other TRI locomotives (110, 111, E 10) stand in." },
  triN: { model: "n-coach (\"Silberling\")", type: "Passenger coach", builder: "Various", lengthFt: 87, source: `${DEWP}TRI_Train_Rental`, about: "TRI's n-coaches in its cream and blue." },
  triNCab: { model: "n-coach driving trailer", type: "Passenger coach with cab", builder: "Various", lengthFt: 87, source: `${DEWP}TRI_Train_Rental`, about: "The push-pull end." },
};
for (const [p, k, name] of LINT_UNITS) facts[`${p}Lint${k}`] = f(fam.lint, `${name}'s ${k === "54" ? "LINT 54 (two cars, 54.3 m)" : "LINT 41 (two cars on a Jakobs truck, 41.8 m)"}.`, { lengthFt: k === "54" ? 178 : 137 });
facts.evbLint54 = f({ ...fam.lint, model: "Alstom Coradia iLint (554)", type: "Hydrogen fuel-cell multiple unit" }, "EVB's hydrogen trains on Cuxhaven–Bremerhaven–Buxtehude (RB 33) since 2022; LINT 41 diesels stand in while hydrogen is short.", { fleet: "14" });
for (const p of ["nwb", "rrb", "eurobahn", "mrb"]) { facts[`${p}TalEnd`] = f(fam.tal, `${TYPES[`${p}TalEnd`].name.replace(" end car", "")}: three cars on Jakobs trucks.`); facts[`${p}TalMid`] = facts[`${p}TalEnd`]; }
for (const p of ["eb", "stb", "odeg", "cb", "rurtal", "vogtland", "trilex", "feg", "press"]) facts[`${p}Rs1`] = f(fam.rs1, `${TYPES[`${p}Rs1`].name}: one car, a cab at each end, often two or more coupled.`);
export const FACTS = {};
for (const [k, v] of Object.entries(facts)) if (v) { FACTS[k] = v; FACTS[k + "R"] = v; }
