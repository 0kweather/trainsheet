// Belgium's trains (scripts/railroads/sncb.py, railroad "sncb"): SNCB/NMBS's
// Desiros, its older units, the M6 and M7 double-deck coaches with their
// locomotives and motor cars, the I10 and I11 coaches, the AR41 diesels, and
// the foreign railways' trains in SNCB's timetable (Eurostar, DB's ICE, SNCF's
// TGV, NS's ICNG, ÖBB's Nightjet). Trainsheet's own side views, from
// published dimensions and recent photographs (Wikimedia Commons, 2024-2026),
// at the shared scale (js/carart.js), each in its railroad's current paint,
// lettered here (no logo files).
//
// SNCB's paint, as photographed 2024-2026: the double-deck coaches (M7 and
// the M6s renovated since 2022) white, the lower deck's windows in one grey
// band, a thin navy line along the low floor, red doors, the class as big
// grey numerals at the ends ("1" over "2" on a car with both), first class
// on the upper deck marked by a yellow line under its windows, and the SNCB
// mark (a B in an oval, Henry van de Velde's 1936 design) outlined in grey
// mid-car; the cab ends yellow. The Desiro AM08: pale grey, a blue band at
// the sill, red doors, the yellow nose with a grey sweep behind it, a yellow
// line over first class. The older units in the grey "New Look" (2009-2020)
// with the blue skirt and yellow ends; the locomotives pale grey with yellow
// cab ends.

import { newId } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, poly, truck, pantograph, slats } from "../carart.js?v=dev";
import { roofCover, panGear, lamp, RED_LAMP, wiper, boxes } from "./digitraffic.cars.js?v=dev";
// ÖBB's classic Nightjet cars, as chintl.cars.js draws them (the
// Brussels-Wien Nightjet), and CFL's Coradia Duplex, as cfl.cars.js draws
// it (the CFL-run trains Luxembourg-Athus in SNCB's timetable).
import { TYPES as CHI_TYPES, MODELS as CHI_MODELS } from "./chintl.cars.js?v=dev";
import { TYPES as CFL_TYPES, MODELS as CFL_MODELS, SETS as CFL_SETS } from "./cfl.cars.js?v=dev";

const r2 = (v) => Math.round(v * 100) / 100;
const FT = 3.2808; // feet in a metre
const m = (v) => v * FT;
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
const DIN = "DIN Next, DIN Alternate, DIN, Roboto, Helvetica Neue, Arial, sans-serif";
const M_ = ([x, y]) => `M${r2(x)} ${r2(y)}`;
const L_ = (pts) => pts.map(([x, y]) => `L${r2(x)} ${r2(y)}`).join("");

// ---------- Shared parts ----------

// A smooth curve through points (Catmull-Rom as cubic Béziers): the path's
// "C" segments after its first point.
function smooth(pts) {
  let d = "";
  for (let i = 0; i + 1 < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${r2(c1[0])} ${r2(c1[1])} ${r2(c2[0])} ${r2(c2[1])} ${r2(p2[0])} ${r2(p2[1])}`;
  }
  return d;
}
// A body: its outline filled with the base color, the paint (drawn freely,
// clipped to the outline) shaded a little for depth as carmodels.js's
// bodies are, and the outline in the theme's ink.
function shell(d, base, paint, { lo = 0, hi = 16 } = {}) {
  const id = newId();
  const stop = (o, color, v, fallback) => `<stop offset="${o}" stop-color="${color}" stop-opacity="${fallback}" style="stop-opacity:var(${v},${fallback})"/>`;
  const shade = `<linearGradient id="${id}-s" gradientUnits="userSpaceOnUse" x1="0" y1="${lo}" x2="0" y2="${hi}">` +
    stop(0, "#000", "--car-shade-low", 0.16) + '<stop offset="0.36" stop-color="#000" stop-opacity="0"/>' +
    '<stop offset="0.55" stop-color="#fff" stop-opacity="0"/>' + stop(0.8, "#fff", "--car-shade-high", 0.1) +
    '<stop offset="0.93" stop-color="#fff" stop-opacity="0"/>' + stop(1, "#000", "--car-shade-roof", 0.08) + "</linearGradient>";
  return path(d, base) + `<clipPath id="${id}"><path d="${d}"/></clipPath><defs>${shade}</defs>` +
    `<g clip-path="url(#${id})">${paint}<rect x="-5" y="${lo}" width="240" height="${r2(hi - lo)}" fill="url(#${id}-s)"/></g>` + path(d, "none", 0.8);
}
// Drawn turned round: the same car with its left end on the right.
const turned = (c, draw) => `<g transform="matrix(-1 0 0 1 ${r2(c.L)} 0)">${draw({ ...c, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: c.coupledL })}</g>`;
// Lettering h ft tall centered at (x, y), reading left to right on a
// turned car too.
function T(c, x, y, h, text, fill, { weight = 400, family = SANS, italic = false, anchor = "middle", stretch = 1, spacing = 0, extra = "" } = {}) {
  return `<text transform="translate(${r2(x)} ${r2(y)}) scale(${r2((c.mirrored ? -1 : 1) * stretch)} -1)" y="${r2(h * 0.36)}" font-size="${r2(h)}" text-anchor="${anchor}" ` +
    `font-weight="${weight}"${italic ? ' font-style="italic"' : ""} letter-spacing="${spacing}" font-family="${family}" fill="${fill}"${extra ? " " + extra : ""}>${text}</text>`;
}
// SNCB's mark: a capital B in a horizontal oval, h ft tall (the oval), as
// an outline (fill "none": the cars' sides) or solid.
function bMark(c, x, y, h, ink, { solid = false, ground = "none" } = {}) {
  const rx = h * 0.78, ry = h * 0.5, sw = h * 0.085;
  const oval = `<ellipse cx="${r2(x)}" cy="${r2(y)}" rx="${r2(rx - sw / 2)}" ry="${r2(ry - sw / 2)}" fill="${solid ? ink : ground}" stroke="${ink}" stroke-width="${r2(sw)}"/>`;
  return oval + T(c, x, y - h * 0.01, h * 0.78, "B", solid ? ground : ink, { weight: 700, family: "Futura, Century Gothic, Avenir Next, Helvetica Neue, Arial, sans-serif", stretch: 1.04 });
}
// A double plug door w ft wide from y0 to y1: two leaves, each with a tall
// narrow window rounded at its ends (the M6's, M7's and Desiro's doors).
function redDoor(x, w, y0, y1, { fill = SN.red, leaves = 2, win = [0.42, 0.88], ww = 0.3, frame = "rgba(0,0,0,0.35)" } = {}) {
  let s = rect(x, y0, w, y1 - y0, fill, 0, `rx="0.2" stroke="${frame}" stroke-width="0.6" vector-effect="non-scaling-stroke"`);
  const lw = w / leaves, h = y1 - y0;
  for (let k = 0; k < leaves; k++) {
    const gw = lw * ww, gx = x + lw * k + (lw - gw) / 2;
    s += rect(gx, y0 + h * win[0], gw, h * (win[1] - win[0]), "#262b31", 0, `rx="${r2(gw / 2)}"`);
    if (k) s += line(x + lw * k, y0 + 0.1, x + lw * k, y1 - 0.1, "rgba(0,0,0,0.45)", 0.5);
  }
  return s;
}
// A window with a dark frame: glass with the sky's reflection above.
function glass(x, y, w, h, { r = 0.35, frame = "#3c4146", pad = 0.12 } = {}) {
  return rect(x - pad, y - pad, w + 2 * pad, h + 2 * pad, frame, 0, `rx="${r2(r + pad)}"`) + rect(x, y, w, h, C.glass, 0, `rx="${r}"`) +
    rect(x + 0.1, y + h * 0.58, w - 0.2, h * 0.32, C.glassLight, 0, `rx="${r2(Math.min(r, 0.2))}" opacity="0.8"`);
}
// The rubber gangway cover between two cars, from floor to top; side -1 at
// the left end, 1 at the right.
function gangway(xFace, side, floor, top) {
  const w = 0.8, x = side < 0 ? xFace : xFace - w;
  return rect(x, floor, w, top - floor, C.rubber, 0, 'rx="0.2"') + lines([[x + 0.27, floor + 0.3, x + 0.27, top - 0.3], [x + 0.54, floor + 0.3, x + 0.54, top - 0.3]], "#3a3f45", 0.6);
}
// UIC side buffers and the screw coupling's hook at a coach's end.
function uicEnd(xFace, side, { y = 3.48, beam = 4.0 } = {}) {
  const a = side < 0 ? xFace + 0.35 : xFace - 1.75, b = side < 0 ? xFace : xFace - 0.35;
  return rect(a, y - 0.3, 1.4, 0.6, C.steelDark, 0.4) + rect(b, y - 0.65, 0.35, 1.3, "currentColor", 0, 'rx="0.12"') +
    rect(side < 0 ? xFace + 1.5 : xFace - 2.3, y - 0.7, 0.8, Math.max(1.4, beam - y + 0.7), "#2a2d31");
}
// A row of underfloor boxes between a and b, hung from top.
const under = (a, b, top, n = 3, depth = 1.2) => boxes(a, b, top, n, depth);
// A bicycle pictogram, h ft tall, centered at (x, y).
const bike = (x, y, h, color) => {
  const r = h * 0.28, s = `fill="none" stroke="${color}" stroke-width="${r2(h * 0.08)}"`;
  return `<g transform="translate(${r2(x)} ${r2(y)})"><circle cx="${r2(-h * 0.45)}" cy="${r2(-h * 0.2)}" r="${r2(r)}" ${s}/><circle cx="${r2(h * 0.45)}" cy="${r2(-h * 0.2)}" r="${r2(r)}" ${s}/>` +
    `<path d="M${r2(-h * 0.45)} ${r2(-h * 0.2)}L${r2(-h * 0.1)} ${r2(h * 0.25)}L${r2(h * 0.3)} ${r2(h * 0.25)}L${r2(h * 0.45)} ${r2(-h * 0.2)}M${r2(-h * 0.1)} ${r2(h * 0.25)}L${r2(h * 0.05)} ${r2(-h * 0.2)}L${r2(h * 0.3)} ${r2(h * 0.25)}" ${s}/></g>`;
};
// Ventilation louvers in a roof cap: dark slots in a grey panel.
const louvers = (x, y, w, h, n) => {
  let s = rect(x, y, w, h, "#8d9296", 0, 'rx="0.15"');
  for (let k = 0; k < n; k++) s += rect(x + 0.2 + k * ((w - 0.4) / n), y + 0.15, (w - 0.4) / n - 0.25, h - 0.3, "#55595e", 0, 'rx="0.08"');
  return s;
};

// SNCB's colors (photographs 2024-2026).
const SN = {
  white: "#f1f2f0", grey: "#e2e3e0", pale: "#d9dbd9", red: "#e2302b", yellow: "#f6d20f", first: "#e2b51a", navy: "#1f2b62", blue: "#2c3c95",
  numeral: "#74787c", roof: "#b5b9bc", band: "#9b9fa3", sweep: "#a7abaf", black: "#1c1e21", skirt: "#5a5f64",
};

// ===================== Double-deck coaches: M6 and M7 =====================
// The M6 (Alstom and Bombardier, 2002-2012; 492 cars) and M7 (Alstom,
// 2020-2026; 747 cars), both 26.80 m over the buffers, 2.83 m wide, about
// 4.6 m tall (nl.wikipedia "M7 (spoorwegrijtuig)", "M6 (spoorwegrijtuig)");
// the M7's motor car (Bmx) 24.19 m. A single-deck vestibule over each truck
// with a double door, the double deck between them on a floor dropped low
// between the trucks. Measured from photographs taken side on (M7 AB 73007
// and B 72017 at Bruxelles-Nord 2024; M7 BD 79002 at Bruxelles-Midi 2025;
// M6 Bx 65042 renovated at Bruxelles-Midi 2025): the doors 2.1 m wide,
// 2.2 m from the car's ends; the lower deck's windows in a grey band
// 1.25-2.05 m up, the upper deck's 3.15-3.97 m; the roof over each
// vestibule a grey cap with louvers (the air conditioning).
const DD = { L: m(26.8), R: m(4.63), sill: m(0.8), drop: m(0.52), vest: m(5.6), doorLo: m(0.82), doorHi: m(3.16), doorW: m(2.1), doorX: m(2.2),
  upLo: m(3.16), upHi: m(3.97), lowLo: m(1.36), lowHi: m(1.94), bandLo: m(1.24), bandHi: m(2.05), cap: m(3.85), wheel: 36.2, truckIn: m(3.35) };
// A double-deck body's outline from x0 to x1, its floor dropped between a
// and b (b null: no drop at the right end); nose: a cab's profile at the
// left ({ top: points from the front's foot up and back to the roof, low:
// points from the front's foot back under the cab }).
function ddOutline(x0, x1, a, b, { nose = null, R = DD.R, sillR = DD.sill } = {}) {
  const bot = [[a - 0.9, DD.sill], [a, DD.drop], ...(b == null ? [[x1, DD.drop]] : [[b, DD.drop], [b + 0.9, sillR], [x1, sillR]])];
  const head = nose ? M_(nose.top[0]) + L_(nose.low) + L_([[nose.low.at(-1)[0], DD.sill]]) : M_([x0, DD.sill]);
  const tail = nose ? L_([nose.top.at(-1)]) + smooth([...nose.top].reverse()) + "Z" : L_([[x0 + 1.0, R]]) + `Q${r2(x0)} ${r2(R)} ${r2(x0)} ${r2(R - 1.0)}Z`;
  return head + L_(bot) + L_([[x1, R - 1.0]]) + `Q${r2(x1)} ${r2(R)} ${r2(x1 - 1.0)} ${r2(R)}` + tail;
}
// The upper deck's windows ([x, w] in ft), the lower deck's in their grey
// band from a to b.
const upper = (list) => list.map(([x, w]) => glass(x, DD.upLo, w, DD.upHi - DD.upLo, { r: 0.4, frame: "#5a5f64", pad: 0.12 })).join("");
const lower = (a, b, list) => rect(a, DD.bandLo, b - a, DD.bandHi - DD.bandLo, SN.band, 0, 'rx="0.3"') +
  list.map(([x, w]) => glass(x, DD.lowLo, w, DD.lowHi - DD.lowLo, { r: 0.25, frame: "#7a7e82", pad: 0.08 })).join("");
// n windows w m wide, pitch p m, the first at x m (all converted to ft).
const run = (x, n, w, p) => Array.from({ length: n }, (_, k) => [m(x + k * p), m(w)]);
const one = (x, w) => [m(x), m(w)];
// A vestibule's roof: grey over its length, the air conditioning's louvered
// cap on it.
const cap = (a, b, R = DD.R) => rect(a, DD.cap, b - a, R - DD.cap + 0.5, "#b0b4b7") + line(a, DD.cap, b, DD.cap, "rgba(0,0,0,0.22)", 0.5) +
  louvers(a + (b - a) * 0.12, DD.cap + 0.75, (b - a) * 0.32, 0.9, 5) + louvers(a + (b - a) * 0.5, DD.cap + 0.75, (b - a) * 0.3, 0.9, 5);
// The class numerals: big grey figures (the glyphs' height h m).
const fig = (c, x, y, h, text) => T(c, x, m(y), m(h) / 0.72, text, SN.numeral, { family: DIN, weight: 400 });
const numerals = (c, x, cls, side = 1) => cls === "12"
  ? fig(c, x, 3.55, 1.12, "1") + fig(c, x + side * m(0.35), 2.3, 1.26, "2")
  : fig(c, x, 2.35, 1.26, cls);
const ddTrucks = (xs, wb = 8.2) => xs.map((x) => truck(x, { wb, d: DD.wheel, top: DD.sill + 0.3 })).join("");
const ddGangway = (c) => (c.coupledL ? gangway(0, -1, m(1.1), m(3.3)) : "") + (c.coupledR ? gangway(c.L, 1, m(1.1), m(3.3)) : "");
// The navy line along the low floor, from a to b.
const navy = (a, b) => rect(a, DD.drop - 0.1, b - a, m(0.17) + 0.1, SN.navy);
// The blue panel by the multi-purpose door: bicycles and wheelchair, white.
const mpPanel = (x, w, y) => rect(x, y, w, m(0.42), SN.blue) + bike(x + w * 0.25, y + m(0.25), m(0.3), "#ffffff") + bike(x + w * 0.55, y + m(0.25), m(0.3), "#ffffff");

// A coach: o.cls "2", "12" (first class upstairs, the yellow line under
// its windows, "1" over "2") or "1" (the M6 A); o.bd the multi-purpose car
// (the M7 BD: one vestibule, a step-free door into the lower deck midway,
// the other end single-deck over its truck, no door; the M6 BD keeps both
// vestibules, its lower deck the bicycle room).
function ddCoach(c, o) {
  const L = c.L, x0 = 0.35, x1 = L - 0.35, v = DD.vest, a = v, mpz = o.bd === "m7";
  const b = mpz ? m(15.6) : L - v;
  const d = ddOutline(x0, x1, a, b, {});
  const paint = rect(-1, 0, L + 2, 20, SN.white) + rect(-1, DD.R - 0.6, L + 2, 1.2, SN.roof) + cap(-1, a + 0.3) +
    (mpz ? cap(m(16.4), L + 1) : cap(b - 0.3, L + 1)) + navy(a - 0.6, b + 0.6);
  let s = shell(d, SN.white, paint, { hi: DD.R });
  const first = o.cls === "12" || o.cls === "1";
  if (mpz) {
    // The M7 BD (79002, 79009): eight upper windows, the lower deck's six and
    // a narrow one; the multi-purpose door; beyond it three windows in the
    // single-deck end.
    s += upper([one(5.95, 0.42), ...run(6.65, 8, 1.0, 1.08)]);
    s += lower(m(6.2), m(14.7), [one(6.35, 0.35), ...run(6.95, 6, 1.05, 1.27)]);
    s += mpPanel(m(11.9), m(2.2), m(2.58)) + bike(m(8.2), m(2.82), m(0.5), SN.numeral);
    s += redDoor(m(14.75), m(1.2), DD.drop + 0.4, DD.doorHi, { leaves: 1, win: [0.2, 0.82], ww: 0.4 });
    s += fig(c, m(16.6), 2.35, 1.26, "2") + fig(c, m(6.0), 2.35, 1.26, "2");
    s += glass(m(17.6), m(1.95), m(0.75), m(0.95), { r: 0.25, frame: "#7a7e82" }) + glass(m(19.0), m(1.85), m(2.2), m(1.0), { r: 0.25, frame: "#7a7e82" }) +
      glass(m(22.3), m(1.85), m(2.95), m(1.0), { r: 0.25, frame: "#7a7e82" });
    s += bMark(c, m(10.0), m(2.62), m(0.7), SN.numeral);
  } else if (first) {
    // AB (73007): seven wide windows upstairs (first class), seven below and
    // a narrow one.
    s += upper([one(5.6, 0.45), ...run(6.6, 7, 1.5, 2.0)]);
    s += lower(m(6.4), m(21.2), [...run(6.55, 7, 1.48, 2.03), one(20.75, 0.45)]);
    s += rect(m(5.6), DD.upLo - m(0.13), m(14.6), m(0.06), SN.first);
    s += o.cls === "1" ? fig(c, m(5.55), 2.35, 1.26, "1") + fig(c, m(21.3), 2.35, 1.26, "1") : numerals(c, m(5.5), "12", 0) + numerals(c, m(20.75), "12", 1);
    s += bMark(c, L / 2 + m(0.35), m(2.62), m(0.72), SN.numeral);
  } else {
    // B (72017): eight upstairs and a narrow one; a narrow one and seven
    // below.
    s += upper([...run(5.78, 8, 1.26, 1.73), one(19.65, 0.5)]);
    s += lower(m(6.4), m(21.1), [one(6.5, 0.48), ...run(7.35, 7, 1.17, 1.74)]);
    if (o.bd) s += bike(m(9.0), m(2.85), m(0.5), SN.numeral) + bike(m(10.0), m(2.85), m(0.5), SN.numeral);
    s += fig(c, m(5.75), 2.35, 1.26, "2") + fig(c, m(21.6), 2.35, 1.26, "2");
    s += bMark(c, L / 2, m(2.62), m(0.72), SN.numeral);
  }
  s += redDoor(DD.doorX, DD.doorW, DD.doorLo, DD.doorHi);
  if (!mpz) s += redDoor(L - DD.doorX - DD.doorW, DD.doorW, DD.doorLo, DD.doorHi);
  // The window in one vestibule's outer end.
  s += glass(m(0.7), m(2.0), m(1.2), m(0.62), { r: 0.15, frame: "#6a6e72", pad: 0.1 });
  s += ddTrucks([DD.truckIn, L - DD.truckIn]);
  return s + ddGangway(c) + uicEnd(0, -1) + uicEnd(L, 1);
}

// ---------- Cab ends ----------
// The M7's cab (driving trailers BDx and BVx, the motor car Bmx), from
// photographs (BDx 75016 at Knokke 2025, BVx 75106 and Bmx 76069 at
// Bruxelles-Midi 2025): the front upright to the headlights, the
// windshield raked back to the roof in a black visor; yellow over the nose
// and back along the side to a curve from the roof down past the
// headlights' grey pods; grey below the buffer beam. Points in metres from
// the buffers' face.
const M7NOSE = { top: [[0.6, 1.05], [0.6, 1.9], [0.66, 2.4], [0.85, 2.95], [1.15, 3.45], [1.6, 3.95], [2.15, 4.35], [2.8, 4.58], [3.4, 4.63]].map(([x, y]) => [m(x), m(y)]),
  low: [[0.6, 0.6], [0.95, 0.42], [1.7, 0.42]].map(([x, y]) => [m(x), m(y)]) };
const M7YELLOW = [[1.8, 0.3], [1.85, 1.6], [2.1, 2.25], [2.8, 3.0], [3.5, 3.7], [4.0, 4.3], [4.3, 4.8]].map(([x, y]) => [m(x), m(y)]);
function m7Cab(c) {
  const y = [[-1, -1], ...M7YELLOW, [-1, 20]];
  const visorOut = [[0.68, 2.55], [0.85, 2.95], [1.15, 3.45], [1.6, 3.95], [2.15, 4.35], [2.8, 4.6], [3.3, 4.7]].map(([x, yy]) => [m(x), m(yy)]);
  const visorIn = [[3.1, 4.38], [2.6, 4.2], [2.05, 3.95], [1.6, 3.55], [1.3, 3.1], [1.05, 2.65], [0.95, 2.45]].map(([x, yy]) => [m(x), m(yy)]);
  return path(M_(y[0]) + smooth(y.slice(1, -1)).replace(/^/, `L${r2(y[1][0])} ${r2(y[1][1])}`) + L_([y.at(-1)]) + "Z", SN.yellow) + rect(-1, -1, m(1.8) + 1, m(1.05) + 1, "#8f9498") +
    path(M_(visorOut[0]) + smooth(visorOut) + L_([visorIn[0]]) + smooth(visorIn) + "Z", SN.black);
}
// The cab's details over the paint: the headlights' pod, the buffers and
// the automatic coupler, the cab's side window.
const m7CabOver = (c) => path(`M${r2(m(1.55))} ${r2(m(1.7))}Q${r2(m(2.05))} ${r2(m(1.55))} ${r2(m(2.2))} ${r2(m(1.95))}Q${r2(m(2.1))} ${r2(m(2.35))} ${r2(m(1.65))} ${r2(m(2.25))}Z`, "#c9cdd0", 0.4) +
  lamp(m(1.72), m(1.85), 0.75, 0.55) + glass(m(4.0), m(2.75), m(0.68), m(0.62), { r: 0.15, frame: "#3c4146" }) +
  path(`M${r2(m(3.55))} ${r2(m(3.75))}Q${r2(m(3.35))} ${r2(m(3.4))} ${r2(m(3.35))} ${r2(m(3.0))}L${r2(m(3.35))} ${r2(m(0.9))}`, "none", 0, 'stroke="rgba(0,0,0,0.45)" stroke-width="0.6" vector-effect="non-scaling-stroke"') +
  uicEnd(0, -1, { y: m(1.06), beam: m(1.3) }) + rect(0.2, m(0.72), m(0.5), m(0.3), "currentColor", 0, 'rx="0.2"');

// M7 driving trailers: o.kind "BDx" (75001-75065: the step-free door
// behind the cab into the lower deck, its bicycle room, four windows below)
// or "BVx" (75066 on: the door by the cab, the double deck all seats).
function m7CabCar(c, o) {
  const L = c.L, x1 = L - 0.35, bdx = o.kind === "BDx";
  const a = bdx ? m(6.35) : m(6.4), b = L - DD.vest;
  const nose = M7NOSE;
  const d = ddOutline(0, x1, a, b, { nose });
  const paint = rect(-1, 0, L + 2, 20, SN.white) + rect(-1, DD.R - 0.6, L + 2, 1.2, SN.roof) + cap(m(3.6), a + 0.3) + cap(b - 0.3, L + 1) +
    m7Cab(c) + navy(a - 0.6, b + 0.6);
  let s = shell(d, SN.white, paint, { hi: DD.R });
  if (bdx) {
    s += glass(m(4.9), m(2.2), m(0.4), m(0.8), { r: 0.15, frame: "#6a6e72" });
    s += redDoor(m(6.55), m(1.2), DD.drop + 0.4, DD.doorHi, { leaves: 1, win: [0.2, 0.82], ww: 0.4 });
    s += upper([one(8.15, 0.42), ...run(8.85, 9, 1.0, 1.15)]);
    s += lower(m(15.1), m(21.2), run(15.3, 4, 1.05, 1.5)) + bike(m(10.3), m(1.65), m(0.5), SN.numeral) + bike(m(11.6), m(1.65), m(0.5), SN.numeral);
    s += fig(c, m(5.95), 2.35, 1.26, "2") + fig(c, m(21.6), 2.35, 1.26, "2") + bMark(c, m(14.8), m(2.62), m(0.72), SN.numeral);
  } else {
    s += redDoor(m(4.75), m(1.15), DD.doorLo, DD.doorHi, { leaves: 1, win: [0.2, 0.82], ww: 0.4 });
    s += mpPanel(m(3.6), m(1.0), m(2.5));
    s += upper([...run(6.9, 8, 1.2, 1.7), one(20.75, 0.42)]);
    s += lower(m(7.1), m(21.0), run(7.3, 8, 1.15, 1.7));
    s += fig(c, m(6.55), 2.35, 1.26, "2") + fig(c, m(21.6), 2.35, 1.26, "2") + bike(m(7.4), m(2.85), m(0.5), SN.numeral) + bMark(c, m(14.2), m(2.62), m(0.72), SN.numeral);
  }
  s += redDoor(L - DD.doorX - DD.doorW, DD.doorW, DD.doorLo, DD.doorHi);
  s += m7CabOver(c) + ddTrucks([m(3.6), L - DD.truckIn]);
  return s + (c.coupledR ? gangway(L, 1, m(1.1), m(3.3)) : "") + uicEnd(L, 1);
}

// The M7 motor car (Bmx, 76001 on; 24.19 m): the cab, a machine room
// behind it, a single door, a short double deck (three windows a deck), a
// single door, and the rear vestibule under the pantograph (Bmx 76001 at
// Knokke 2025, 76069 at Bruxelles-Midi 2025).
function m7Bmx(c) {
  const L = c.L, x1 = L - 0.35, a = m(8.45), b = m(16.6), R = DD.R;
  const d = ddOutline(0, x1, a, b, { nose: M7NOSE });
  const paint = rect(-1, 0, L + 2, 20, SN.white) + rect(-1, R - 0.6, L + 2, 1.2, SN.roof) + rect(m(3.4), DD.cap, m(4.7), R - DD.cap + 0.5, "#a9adb1") +
    louvers(m(4.0), DD.cap + 0.75, m(1.6), 0.9, 5) + louvers(m(5.9), DD.cap + 0.75, m(1.6), 0.9, 5) + cap(b + 0.3, L + 1) + m7Cab(c) + navy(a - 0.6, b + 0.6) +
    // The machine room's panels.
    lines([[m(4.6), m(1.0), m(4.6), m(3.6)], [m(6.0), m(1.0), m(6.0), m(3.6)], [m(4.6), m(3.6), m(7.2), m(3.6)]], "rgba(0,0,0,0.22)", 0.5);
  let s = shell(d, SN.white, paint, { hi: R });
  s += redDoor(m(7.15), m(1.1), DD.doorLo, DD.doorHi, { leaves: 1, win: [0.2, 0.82], ww: 0.4 });
  s += redDoor(m(16.85), m(1.1), DD.doorLo, DD.doorHi, { leaves: 1, win: [0.2, 0.82], ww: 0.4 });
  s += upper(run(9.55, 3, 1.25, 1.75)) + lower(m(9.4), m(15.2), run(9.55, 3, 1.25, 1.75));
  s += fig(c, m(8.85), 2.35, 1.26, "2") + fig(c, m(16.1), 2.35, 1.26, "2") + bMark(c, m(12.7), m(2.62), m(0.65), SN.numeral);
  // The rear vestibule's roof: the pantograph and its breaker.
  s += pantograph(m(20.4), R + 0.1, { up: c.wires !== false, facing: -1 }) + panGear(m(20.4), R + 0.1, -1);
  s += m7CabOver(c) + ddTrucks([m(3.7), L - m(3.1)], 8.5);
  s += under(m(4.5), m(7.2), DD.sill + 0.2, 2, 1.1);
  return s + (c.coupledR ? gangway(L, 1, m(1.1), m(3.3)) : "") + uicEnd(L, 1);
}

// The M6 driving trailer (Bx, 65001-65064), renovated (65042 at
// Bruxelles-Midi 2025): a wedge nose, the yellow over its sloping top; a
// single door behind the cab.
const M6NOSE = { top: [[0.3, 0.8], [0.3, 1.75], [0.28, 1.95], [0.55, 2.35], [1.0, 2.95], [1.45, 3.5], [1.8, 3.95], [2.15, 4.35], [2.7, 4.6], [3.2, 4.63]].map(([x, y]) => [m(x), m(y)]),
  low: [[0.3, 0.55], [1.2, 0.45], [1.7, 0.45]].map(([x, y]) => [m(x), m(y)]) };
function m6Bx(c) {
  const L = c.L, x1 = L - 0.35, a = m(6.1), b = L - DD.vest;
  const d = ddOutline(0, x1, a, b, { nose: M6NOSE });
  const yo = [[0.1, 1.75], [0.55, 2.35], [1.0, 2.95], [1.45, 3.5], [1.8, 3.95], [2.15, 4.35], [2.6, 4.75]].map(([x, y]) => [m(x), m(y)]);
  const yi = [[2.45, 4.05], [2.1, 3.62], [1.75, 3.15], [1.3, 2.55], [0.9, 2.0], [0.55, 1.62]].map(([x, y]) => [m(x), m(y)]);
  const paint = rect(-1, 0, L + 2, 20, SN.white) + rect(-1, DD.R - 0.6, L + 2, 1.2, SN.roof) + cap(m(1.9), a + 0.3) + cap(b - 0.3, L + 1) +
    path(M_(yo[0]) + smooth(yo) + L_([yi[0]]) + smooth(yi) + "Z", SN.yellow) + rect(-1, -1, m(1.5), m(1.0), "#8f9498") + navy(a - 0.6, b + 0.6) +
    line(m(0.45), m(1.85), m(2.0), m(0.95), "rgba(0,0,0,0.2)", 0.5);
  let s = shell(d, SN.white, paint, { hi: DD.R });
  s += rect(m(0.5), m(1.5), m(0.12), m(0.35), SN.yellow, 0.3);
  s += glass(m(2.45), m(1.8), m(0.8), m(1.25), { r: 0.1, frame: "#2a2e33", pad: 0.08 });
  s += redDoor(m(3.85), m(1.2), DD.doorLo, DD.doorHi, { leaves: 1, win: [0.2, 0.82], ww: 0.4 });
  s += upper([...run(7.3, 8, 1.2, 1.72), one(20.95, 0.45)]) + lower(m(7.2), m(20.6), run(7.3, 8, 1.18, 1.72));
  s += fig(c, m(5.65), 2.35, 1.26, "2") + fig(c, m(21.6), 2.35, 1.26, "2") + bMark(c, m(14.1), m(2.62), m(0.72), SN.numeral);
  s += redDoor(L - DD.doorX - DD.doorW, DD.doorW, DD.doorLo, DD.doorHi);
  s += uicEnd(0, -1, { y: m(1.06), beam: m(1.3) }) + lamp(m(0.25), m(1.2), 0.3, 0.45) + ddTrucks([m(3.4), L - DD.truckIn]);
  return s + (c.coupledR ? gangway(L, 1, m(1.1), m(3.3)) : "") + uicEnd(L, 1);
}

// An M6 coach, renovated (since 2022, the M7's paint; photographs of A
// 61014, B 62179 and BD 69062 renovated, 2025): o.kind "A" (first class on
// both decks: "1" at each end, the yellow line the car's whole length under
// the upper windows), "B", or "BD" (both vestibules; a single step-free
// door beside one into the lower deck, its bicycle room, a blue bicycle
// panel over it).
function m6Coach(c, o) {
  const L = c.L, x0 = 0.35, x1 = L - 0.35, v = DD.vest, a = v, b = L - v;
  const d = ddOutline(x0, x1, a, b, {});
  const paint = rect(-1, 0, L + 2, 20, SN.white) + rect(-1, DD.R - 0.6, L + 2, 1.2, SN.roof) + cap(-1, a + 0.3) + cap(b - 0.3, L + 1) + navy(a - 0.6, b + 0.6) +
    (o.kind === "A" ? rect(-1, DD.upLo - m(0.13), L + 2, m(0.06), SN.first) : "");
  let s = shell(d, SN.white, paint, { hi: DD.R });
  if (o.kind === "A") {
    s += upper([...run(6.4, 7, 1.35, 1.9), one(19.8, 0.42)]) + lower(m(6.3), m(20.4), run(6.5, 7, 1.35, 2.0));
    s += fig(c, m(5.75), 2.35, 1.26, "1") + fig(c, m(21.3), 2.35, 1.26, "1") + bMark(c, L / 2, m(2.62), m(0.72), SN.numeral);
  } else if (o.kind === "BD") {
    s += upper([...run(5.9, 8, 1.2, 1.72), one(19.7, 0.45)]);
    s += redDoor(m(6.0), m(1.1), DD.drop + 0.4, DD.doorHi, { leaves: 1, win: [0.2, 0.82], ww: 0.4 }) + fig(c, m(7.6), 2.35, 1.26, "2");
    s += mpPanel(m(8.35), m(2.3), m(2.6)) + lower(m(8.3), m(15.6), run(8.6, 4, 1.2, 1.75)) + bike(m(16.5), m(1.65), m(0.5), SN.numeral) + bike(m(17.6), m(1.65), m(0.5), SN.numeral);
    s += fig(c, m(21.6), 2.35, 1.26, "2") + bMark(c, m(13.5), m(2.62), m(0.72), SN.numeral);
  } else {
    s += upper([...run(5.9, 8, 1.2, 1.72), one(19.7, 0.45)]) + lower(m(6.3), m(20.5), run(6.5, 8, 1.18, 1.72));
    s += fig(c, m(5.7), 2.35, 1.26, "2") + fig(c, m(21.6), 2.35, 1.26, "2") + bMark(c, L / 2, m(2.62), m(0.72), SN.numeral);
  }
  s += redDoor(DD.doorX, DD.doorW, DD.doorLo, DD.doorHi) + redDoor(L - DD.doorX - DD.doorW, DD.doorW, DD.doorLo, DD.doorHi);
  s += glass(m(0.7), m(2.0), m(1.2), m(0.62), { r: 0.15, frame: "#6a6e72", pad: 0.1 });
  s += ddTrucks([DD.truckIn, L - DD.truckIn]);
  return s + ddGangway(c) + uicEnd(0, -1) + uicEnd(L, 1);
}

// ===================== Locomotives =====================
// SNCB's electric locomotives in their grey paint (photographs: HLE 1833
// and 1356 at Bruxelles-Midi 2025): pale grey, the machine room's side a
// dark band between the cabs' doors with a red line over it and a navy one
// under it, yellow cab ends; the number in dark grey near one end, the B
// outlined in grey near the other.
// A locomotive body, both ends alike: o.nose(top points front to roof,
// low points under the nose), in metres from the buffers' face.
function locoBody(c, o) {
  const L = c.L, R = m(o.roof), S = m(o.sill);
  const top = o.nose.top.map(([x, y]) => [m(x), m(y)]), low = o.nose.low.map(([x, y]) => [m(x), m(y)]);
  const mir = (pts) => pts.map(([x, y]) => [L - x, y]);
  const d = M_(low.at(-1)) + L_([...[...low].reverse().slice(1)]) + smooth(top).replace(/^/, "") + L_(mir([top.at(-1)])) + smooth(mir([...top].reverse())) +
    L_(mir(low.slice(1))) + "Z";
  return { d, R, S, top, low };
}
const LOCO = { grey: "#cfd2d3", band: "#2a2e36", grille: "#3a3f47", red: "#d42b2a", navy: "#26306d", skirt: "#8e9397", ink: "#4d5257" };
// Doors in a locomotive's side: [x m, w m]; windows likewise.
const locoDoor = (x, w, y0, y1) => rect(m(x), m(y0), m(w), m(y1 - y0), "none", 0, 'rx="0.25" stroke="rgba(0,0,0,0.4)" stroke-width="0.6" vector-effect="non-scaling-stroke"') +
  rect(m(x + w * 0.22), m(y1 - 0.75), m(w * 0.56), m(0.5), "#262b31", 0, 'rx="0.15"') + line(m(x) - 0.25, m(y0 + 0.3), m(x) - 0.25, m(y0 + 1.2), "currentColor", 0.6);

// HLE 18 and 19 (Siemens Eurosprinter ES60U3, 2009-2012; 120 built):
// 19.58 m over the buffers, trucks 9.90 m apart, 3.0 m wheelbase, 1150 mm
// wheels (nl.wikipedia "HLE 18 en 19"). The nose rounded, its windshield
// framed in yellow, the yellow running down the front's edge.
const ES60 = { roof: 4.12, sill: 1.15, nose: { top: [[0.62, 1.15], [0.64, 1.9], [0.72, 2.35], [0.95, 2.9], [1.25, 3.45], [1.6, 3.9], [2.05, 4.1], [2.4, 4.12]], low: [[0.62, 1.15], [0.62, 0.62], [1.5, 0.62], [2.3, 0.95]] } };
function hle18(c) {
  const L = c.L, b = locoBody(c, ES60), R = b.R;
  const yel = (s) => {
    const o = [[0.6, 1.6], [0.66, 2.35], [0.9, 2.9], [1.22, 3.45], [1.58, 3.92], [2.0, 4.2]];
    const i = [[2.25, 4.2], [2.15, 3.8], [1.85, 3.35], [1.5, 2.85], [1.15, 2.25], [0.98, 1.6]];
    const pts = (p) => p.map(([x, y]) => [s < 0 ? m(x) : L - m(x), m(y)]);
    return path(M_(pts(o)[0]) + smooth(pts(o)) + L_([pts(i)[0]]) + smooth(pts(i)) + "Z", SN.yellow);
  };
  const glassSide = (s) => {
    const p = [[0.98, 2.5], [1.3, 3.05], [1.62, 3.55], [1.95, 3.7], [2.0, 3.0], [1.75, 2.45]].map(([x, y]) => [s < 0 ? m(x) : L - m(x), m(y)]);
    return path(M_(p[0]) + L_(p.slice(1)) + "Z", "#23272c");
  };
  const paint = rect(-1, 0, L + 2, 20, LOCO.grey) + rect(m(3.55), m(2.45), L - m(7.1), m(1.15), LOCO.band) + rect(m(3.55), m(3.6), L - m(7.1), m(0.07), LOCO.red) +
    rect(m(3.55), m(2.38), L - m(7.1), m(0.07), "#2f5fb0") + rect(-1, -1, L + 2, m(1.55) + 1, "#a7acb0") + yel(-1) + yel(1) + glassSide(-1) + glassSide(1);
  let s = shell(b.d, LOCO.grey, paint, { lo: 0, hi: R });
  // Cab doors and the cab's side window, at each end.
  for (const [x0, w] of [[2.75, 0.75], [L / FT - 3.5, 0.75]]) s += locoDoor(x0, w, 1.35, 3.6);
  s += glass(m(2.12), m(2.75), m(0.4), m(0.6), { r: 0.1, frame: "#3c4146" }) + glass(L - m(2.52), m(2.75), m(0.4), m(0.6), { r: 0.1, frame: "#3c4146" });
  s += T(c, m(4.6), m(1.9), m(0.42) / 0.72, c.number || "1833", LOCO.ink, { family: DIN, weight: 500 }) + bMark(c, L - m(4.55), m(1.85), m(0.62), "#8b9094");
  // Roof: a pantograph at each end (the trailing one raised), the roof line
  // and breakers between them.
  const up = c.wires !== false;
  s += pantograph(m(5.2), R + 0.1, { up: false, facing: 1 }) + pantograph(L - m(5.2), R + 0.1, { up, facing: -1 }) + roofCover(m(7.2), R, L - m(14.4), 0.45, "#a9aeb2", 3);
  for (const x of [L / 2 - m(4.95), L / 2 + m(4.95)]) s += truck(x, { wb: m(3.0), d: 45.3, kind: "loco", top: m(1.15) });
  s += rect(L / 2 - m(2.6), m(0.55), m(5.2), m(0.55), "#3a3e44", 0, 'rx="0.2"');
  s += lamp(m(0.66), m(1.55), 0.35, 0.4) + lamp(L - m(0.66) - 0.35, m(1.55), 0.35, 0.4, RED_LAMP);
  return s + uicEnd(0, -1, { y: m(1.06), beam: m(1.3) }) + uicEnd(L, 1, { y: m(1.06), beam: m(1.3) });
}

// HLE 13 (Alstom, 1997-2001; 60 built): 19.11 m over the buffers, trucks
// 10.40 m apart, 1160 mm wheels (nl.wikipedia "HLE 13"); the angled front
// in a yellow frame; the machine room's grilles dark between the doors.
const HLE13 = { roof: 4.1, sill: 1.15, nose: { top: [[0.62, 1.15], [0.62, 2.15], [0.75, 2.45], [1.25, 3.55], [1.55, 3.95], [2.0, 4.1], [2.3, 4.1]], low: [[0.62, 1.15], [0.62, 0.62], [1.5, 0.62], [2.2, 0.95]] } };
function hle13(c) {
  const L = c.L, b = locoBody(c, HLE13), R = b.R;
  const end = (s) => {
    const X = (x) => (s < 0 ? m(x) : L - m(x));
    const yel = [[0.5, 1.75], [0.62, 2.15], [0.75, 2.45], [1.25, 3.55], [1.55, 3.95], [2.0, 4.2], [2.45, 4.2], [2.3, 3.4], [1.75, 2.35], [1.5, 1.75]].map(([x, y]) => [X(x), m(y)]);
    const gl = [[0.95, 2.75], [1.3, 3.5], [1.55, 3.8], [1.85, 3.8], [1.75, 3.1], [1.5, 2.75]].map(([x, y]) => [X(x), m(y)]);
    return path(M_(yel[0]) + L_(yel.slice(1)) + "Z", SN.yellow) + path(M_(gl[0]) + L_(gl.slice(1)) + "Z", "#23272c");
  };
  const paint = rect(-1, 0, L + 2, 20, LOCO.grey) + rect(m(2.4), m(2.5), L - m(4.8), m(1.25), LOCO.band) + rect(m(2.4), m(3.75), L - m(4.8), m(0.07), LOCO.red) +
    rect(m(2.4), m(2.36), L - m(4.8), m(0.08), LOCO.navy) + slats(m(6.5), m(2.55), m(6.3), m(1.15), 0.32, "rgba(255,255,255,0.12)") +
    slats(m(14.05), m(2.55), m(2.55), m(1.15), 0.32, "rgba(255,255,255,0.12)") + rect(-1, -1, L + 2, m(1.5) + 1, "#a7acb0") + end(-1) + end(1);
  let s = shell(b.d, LOCO.grey, paint, { lo: 0, hi: R });
  s += locoDoor(5.6, 0.62, 1.35, 3.7) + locoDoor(L / FT - 6.2, 0.62, 1.35, 3.7);
  s += glass(m(2.55), m(2.85), m(0.4), m(0.5), { r: 0.1, frame: "#3c4146" }) + glass(L - m(2.95), m(2.85), m(0.45), m(0.55), { r: 0.1, frame: "#3c4146" });
  s += T(c, m(4.1), m(1.95), m(0.45) / 0.72, c.number || "1356", LOCO.ink, { family: DIN, weight: 500 }) + bMark(c, L - m(6.95), m(1.95), m(0.62), "#8b9094");
  const up = c.wires !== false;
  s += pantograph(m(5.4), R + 0.1, { up: false, facing: 1 }) + pantograph(L - m(5.4), R + 0.1, { up, facing: -1 }) + roofCover(m(7.4), R, L - m(14.8), 0.45, "#a9aeb2", 3);
  for (const x of [L / 2 - m(5.2), L / 2 + m(5.2)]) s += truck(x, { wb: m(2.9), d: 45.7, kind: "loco", top: m(1.15) });
  s += rect(L / 2 - m(2.6), m(0.55), m(5.2), m(0.55), "#3a3e44", 0, 'rx="0.2"');
  s += lamp(m(0.66), m(1.55), 0.35, 0.4) + lamp(L - m(0.66) - 0.35, m(1.55), 0.35, 0.4, RED_LAMP);
  return s + uicEnd(0, -1, { y: m(1.06), beam: m(1.3) }) + uicEnd(L, 1, { y: m(1.06), beam: m(1.3) });
}

// ===================== Desiro ML: AM08 =====================
// Siemens Desiro ML for SNCB (AM08, 2011-2016; 305 units: 08001-08210
// for 3 kV, 08501-08595 also for 25 kV): three cars, 79.9 m, trucks 18.62
// m apart, the floor 0.8 m up (de.wikipedia "NMBS/SNCB-Reihe AM 08"),
// Bo'Bo'+2'2'+Bo'Bo'; two double doors a side in each car; first class
// (16 seats) behind each cab. The paint (08509 and 08593 at Bruxelles-Midi
// 2025, 08049 Mechelen 2023): pale grey, the blue band along the sill, red
// doors, a yellow nose with a grey sweep behind it, the B outlined large
// behind the sweep over the unit's number, a thin yellow line over the
// first-class windows, small class numerals at the doors.
const AM8 = { R: m(4.2), sill: m(0.85), winLo: m(1.97), winHi: m(3.17), doorLo: m(0.88), doorHi: m(3.38), doorW: m(1.4), blue: m(1.2), wheel: 33.5 };
const AM8C = { body: "#e0e1de", sweep: "#a3a7ab", blue: "#2b3a8f", yellow: "#f4cf14", ink: "#6f7377" };
const am8Nose = { top: [[0.45, 0.95], [0.5, 1.5], [0.62, 1.95], [0.85, 2.4], [1.25, 3.0], [1.75, 3.6], [2.3, 4.0], [2.9, 4.17], [3.3, 4.2]].map(([x, y]) => [m(x), m(y)]),
  low: [[0.45, 0.6], [1.2, 0.48], [2.0, 0.5]].map(([x, y]) => [m(x), m(y)]) };
// A Desiro window: wide, a dark frame, rounded.
const dwin = (x, w, n = 1) => {
  let s = glass(m(x), AM8.winLo, m(w), AM8.winHi - AM8.winLo, { r: 0.45, frame: "#3f4449", pad: 0.15 });
  for (let k = 1; k < n; k++) s += rect(m(x + (w * k) / n) - 0.15, AM8.winLo, 0.3, AM8.winHi - AM8.winLo, "#3f4449");
  return s;
};
const dnum = (c, x, text) => T(c, m(x), m(2.75), m(0.3) / 0.72, text, AM8C.ink, { family: DIN });
function am8Body(c, cab) {
  const L = c.L, R = AM8.R, S = AM8.sill;
  if (!cab) return M_([0.3, S]) + L_([[L - 0.3, S], [L - 0.3, R - 1.0]]) + `Q${r2(L - 0.3)} ${r2(R)} ${r2(L - 1.3)} ${r2(R)}` + L_([[1.3, R]]) + `Q0.3 ${r2(R)} 0.3 ${r2(R - 1.0)}Z`;
  const t = am8Nose.top, lo = am8Nose.low;
  return M_(t[0]) + L_(lo) + L_([[lo.at(-1)[0], S], [L - 0.3, S], [L - 0.3, R - 1.0]]) + `Q${r2(L - 0.3)} ${r2(R)} ${r2(L - 1.3)} ${r2(R)}` + L_([t.at(-1)]) + smooth([...t].reverse()) + "Z";
}
// An end car (cab on the left): o.bikes the "c" car.
function am8End(c, o = {}) {
  const L = c.L, R = AM8.R;
  const P = (pts) => pts.map(([x, y]) => [m(x), m(y)]);
  const sweepOut = P([[1.9, -0.5], [2.15, 0.9], [2.6, 2.0], [3.3, 3.0], [4.2, 3.8], [5.0, 4.5]]);
  const yellowEdge = P([[1.05, -0.5], [1.15, 1.0], [1.5, 2.0], [2.2, 3.0], [3.0, 3.75], [3.6, 4.5]]);
  const paint = rect(-1, 0, L + 2, 20, AM8C.body) +
    path(M_([-1, -1]) + L_(sweepOut) + L_([[-1, 20]]) + "Z", AM8C.sweep) + path(M_([-1, -1]) + L_(yellowEdge) + L_([[-1, 20]]) + "Z", AM8C.yellow) +
    // The blue band, rising a little to the nose.
    path(M_([m(1.75), m(0.4)]) + L_([[m(2.0), m(1.05)], [m(2.6), AM8.blue], [L + 1, AM8.blue], [L + 1, 0], [m(1.75), 0]]) + "Z", AM8C.blue) +
    // The windshield in its black surround over the nose.
    path(M_([m(0.85), m(2.38)]) + smooth(P([[0.85, 2.38], [1.25, 2.98], [1.75, 3.58], [2.25, 3.97]])) + L_(P([[2.4, 3.6], [2.05, 3.05], [1.55, 2.5]])) + "Z", "#1f2327") +
    rect(-1, R - 0.45, L + 2, 1, "#c2c5c8");
  let s = shell(am8Body(c, true), AM8C.body, paint, { hi: R });
  // The cab's side window in the sweep; the B and the number behind it;
  // first class (one window) under the yellow line; the doors; second class.
  s += glass(m(3.05), m(2.5), m(0.45), m(0.62), { r: 0.15, frame: "#2a2e33" });
  s += bMark(c, m(4.45), m(2.15), m(0.95), "#8f9397") + T(c, m(4.55), m(1.38), m(0.3) / 0.72, c.number || "08509", "#8f9397", { family: DIN, weight: 500 });
  s += dwin(5.55, 1.95) + rect(m(3.9), AM8.winHi + m(0.3), m(3.95), m(0.06), AM8C.yellow);
  s += dnum(c, 7.8, "1") + redDoor(m(8.05), AM8.doorW, AM8.doorLo, AM8.doorHi, { win: [0.4, 0.9], ww: 0.34 }) + dnum(c, 9.7, "2");
  s += dwin(10.0, 3.6, 2) + dwin(13.95, 3.6, 2);
  s += dnum(c, 17.95, "2") + redDoor(m(18.2), AM8.doorW, AM8.doorLo, AM8.doorHi, { win: [0.4, 0.9], ww: 0.34 }) + dnum(c, 19.85, "2");
  s += dwin(20.15, 3.6, 2) + dwin(24.1, 2.4, 1);
  if (o.bikes) s += bike(m(22.0), m(1.6), m(0.4), AM8C.ink);
  // Roof: the traction converter and air conditioning covers.
  s += roofCover(m(5.5), R, m(5.5), 0.6, "#b9bdc0", 3) + roofCover(m(14.0), R, m(7.0), 0.75, "#b9bdc0", 4);
  s += truck(m(4.15), { wb: m(2.5), d: AM8.wheel, top: AM8.sill + 0.1 }) + truck(L - m(4.0), { wb: m(2.5), d: AM8.wheel, top: AM8.sill + 0.1 });
  s += under(m(6.5), m(21.0), AM8.sill + 0.05, 4, 1.1);
  // The automatic coupler and its deflector.
  s += rect(0, m(0.95), m(1.2), m(0.22), "currentColor", 0, 'opacity="0.9"') + rect(0, m(0.82), 0.5, m(0.48), "currentColor", 0, 'rx="0.15"') +
    lamp(m(0.5), m(1.25), 0.35, 0.4) + rect(m(0.5), m(0.3), m(1.4), m(0.2), "#2a2d31");
  return s + (c.coupledR ? gangway(L, 1, AM8.sill + 0.4, m(3.3)) : "");
}
// The middle car: the pantograph at one end.
function am8Mid(c) {
  const L = c.L, R = AM8.R;
  const paint = rect(-1, 0, L + 2, 20, AM8C.body) + rect(-1, 0, L + 2, AM8.blue, AM8C.blue) + rect(-1, R - 0.45, L + 2, 1, "#c2c5c8");
  let s = shell(am8Body(c, false), AM8C.body, paint, { hi: R });
  s += dwin(0.8, 3.0, 1) + dnum(c, 4.25, "2") + redDoor(m(4.5), AM8.doorW, AM8.doorLo, AM8.doorHi, { win: [0.4, 0.9], ww: 0.34 }) + dnum(c, 6.15, "2");
  s += dwin(6.45, 3.6, 2) + dwin(10.4, 3.6, 2) + dwin(14.35, 1.9, 1);
  s += dnum(c, 16.55, "2") + redDoor(m(16.8), AM8.doorW, AM8.doorLo, AM8.doorHi, { win: [0.4, 0.9], ww: 0.34 }) + dnum(c, 18.45, "2") + dwin(18.75, 3.6, 2) + dwin(22.7, 2.0, 1);
  s += pantograph(L - m(5.2), R + 0.1, { up: c.wires !== false, facing: -1 }) + panGear(L - m(5.2), R + 0.1, -1) + roofCover(m(4.0), R, m(9.0), 0.55, "#b9bdc0", 3);
  s += truck(m(3.44), { wb: m(2.5), d: AM8.wheel, top: AM8.sill + 0.1 }) + truck(L - m(3.44), { wb: m(2.5), d: AM8.wheel, top: AM8.sill + 0.1 });
  s += under(m(6.0), m(19.0), AM8.sill + 0.05, 3, 1.0);
  return s + (c.coupledL ? gangway(0, -1, AM8.sill + 0.4, m(3.3)) : "") + (c.coupledR ? gangway(L, 1, AM8.sill + 0.4, m(3.3)) : "");
}

// ===================== Single-deck coaches: I10 and I11 =====================
// I11 (BN, 1995-1997; 163 cars: A 11801-11836, B 12801-12906, BDx
// 19801-19821) and I10 (BN, 1987-1989): 26.40 m over the buffers, 4.05 m
// tall, a single plug door at each end (nl.wikipedia "I11 (spoorwegrijtuig)",
// "I10"). As photographed in October 2024 (IC 514 Oostende-Eupen at
// Bruxelles-Nord, side on: I11 B 12805, I10 B 12760): pale grey, the I11's
// windows in one dark band, a navy line along the sill, red doors, the
// class small by the doors, the B outlined under the windows; first class
// a yellow line along the top of the side (A 11822, 2025). The I10s still
// running (IC 01, with their bicycles) carry a navy band low along the side
// with the bicycle panels at its ends, their windows separate.
const I11 = { L: m(26.4), R: m(4.05), sill: m(1.05), bandLo: m(2.35), bandHi: m(3.58), doorW: m(1.0), wheel: 36.2, truckIn: m(3.35) };
const I1C = { body: "#d9dad7", roof: "#bfc2c4", navy: "#25306a", ink: "#6d7175" };
function iBody(L, R, S) {
  return M_([0.35, S]) + L_([[L - 0.35, S], [L - 0.35, R - 1.2]]) + `Q${r2(L - 0.35)} ${r2(R)} ${r2(L - 1.6)} ${r2(R)}` + L_([[1.6, R]]) + `Q0.35 ${r2(R)} 0.35 ${r2(R - 1.2)}Z`;
}
const iDoor = (x) => redDoor(x, I11.doorW, m(0.6), m(3.6), { leaves: 1, win: [0.48, 0.85], ww: 0.42 });
function i11Coach(c, o) {
  const L = c.L, R = I11.R;
  const paint = rect(-1, 0, L + 2, 20, I1C.body) + rect(-1, R - 0.75, L + 2, 1.5, I1C.roof) + rect(-1, I11.sill - 0.2, L + 2, m(0.22) + 0.2, I1C.navy) +
    (o.cls === "1" ? rect(-1, m(3.68), L + 2, m(0.07), SN.yellow) : "");
  let s = shell(iBody(L, R, I11.sill), I1C.body, paint, { hi: R });
  // The windows in their band, divided every 2.0 m.
  const a = m(3.2), b = m(23.0);
  s += rect(a, I11.bandLo, b - a, I11.bandHi - I11.bandLo, "#2b3035", 0, 'rx="0.5"') + rect(a + 0.2, I11.bandLo + m(0.7), b - a - 0.4, m(0.35), C.glassLight, 0, 'rx="0.2" opacity="0.7"');
  const segs = [];
  for (let x = a + m(2.0); x < b - 1; x += m(1.98)) segs.push([x, I11.bandLo + 0.1, x, I11.bandHi - 0.1]);
  s += lines(segs, "#5d646c", 0.9);
  s += iDoor(m(1.2)) + iDoor(L - m(1.2) - I11.doorW);
  s += T(c, m(2.75), m(3.0), m(0.28) / 0.72, o.cls, I1C.ink, { family: DIN }) + T(c, L - m(2.75), m(3.0), m(0.28) / 0.72, o.cls, I1C.ink, { family: DIN });
  s += bMark(c, m(10.9), m(2.0), m(0.55), "#8a8e92");
  s += rect(L / 2 + m(1.5), m(1.75), m(1.0), m(0.28), "none", 0, 'stroke="rgba(0,0,0,0.3)" stroke-width="0.5" vector-effect="non-scaling-stroke"');
  s += truck(I11.truckIn, { wb: m(2.56), d: I11.wheel, top: I11.sill + 0.1 }) + truck(L - I11.truckIn, { wb: m(2.56), d: I11.wheel, top: I11.sill + 0.1 });
  s += under(m(7.0), m(19.5), I11.sill, 3, 1.0);
  return s + (c.coupledL ? gangway(0, -1, m(1.2), m(3.5)) : "") + (c.coupledR ? gangway(L, 1, m(1.2), m(3.5)) : "") + uicEnd(0, -1) + uicEnd(L, 1);
}
// The I10 bicycle car (B "vélos", 12760-12775).
function i10Bike(c) {
  const L = c.L, R = I11.R;
  const paint = rect(-1, 0, L + 2, 20, I1C.body) + rect(-1, R - 0.75, L + 2, 1.5, I1C.roof) + rect(-1, I11.sill - 0.2, L + 2, m(0.2) + 0.2, I1C.navy);
  let s = shell(iBody(L, R, I11.sill), I1C.body, paint, { hi: R });
  for (let k = 0; k < 11; k++) s += glass(m(2.65 + k * 2.06), m(2.3), m(1.3), m(1.05), { r: 0.35, frame: "#b9a98e", pad: 0.12 });
  // The bicycle panels: a darker blue box, white arrows and a bicycle.
  for (const [x, w] of [[1.1, 2.9], [21.4, 4.6]]) s += rect(m(x), m(1.5), m(w), m(0.68), I1C.navy, 0, 'rx="0.1"') + bike(m(x + w / 2 + 0.3), m(1.84), m(0.5), "#ffffff") +
    T(c, m(x + w / 2 - 0.7), m(1.82), m(0.6), x < 10 ? "«" : "»", "#ffffff", { weight: 300 });
  s += bMark(c, m(18.9), m(1.85), m(0.5), "#8a8e92");
  s += iDoor(m(0.35)) + iDoor(L - m(0.35) - I11.doorW);
  s += T(c, m(2.2), m(2.75), m(0.28) / 0.72, "2", I1C.ink, { family: DIN }) + T(c, L - m(2.2), m(2.75), m(0.28) / 0.72, "2", I1C.ink, { family: DIN });
  s += truck(I11.truckIn, { wb: m(2.56), d: I11.wheel, top: I11.sill + 0.1 }) + truck(L - I11.truckIn, { wb: m(2.56), d: I11.wheel, top: I11.sill + 0.1 });
  s += under(m(7.0), m(19.5), I11.sill, 3, 1.0);
  return s + (c.coupledL ? gangway(0, -1, m(1.2), m(3.5)) : "") + (c.coupledR ? gangway(L, 1, m(1.2), m(3.5)) : "") + uicEnd(0, -1) + uicEnd(L, 1);
}

// The I11's driving trailer (BDx, 19801-19821): the HLE 13's angled cab in
// its yellow frame (19805 on the S41 Liège-Aachen, 2025).
function i11BDx(c) {
  const L = c.L, R = I11.R, S = I11.sill;
  const top = [[0.62, 1.15], [0.62, 2.15], [0.75, 2.45], [1.25, 3.55], [1.55, 3.95], [2.0, 4.05], [2.3, 4.05]].map(([x, y]) => [m(x), m(y)]);
  const d = M_(top[0]) + L_([[top[0][0], S], [L - 0.35, S], [L - 0.35, R - 1.2]]) + `Q${r2(L - 0.35)} ${r2(R)} ${r2(L - 1.6)} ${r2(R)}` + L_([...top].reverse()) + "Z";
  const yel = [[0.5, 1.75], [0.62, 2.15], [0.75, 2.45], [1.25, 3.55], [1.55, 3.95], [2.0, 4.2], [2.45, 4.2], [2.3, 3.4], [1.75, 2.35], [1.5, 1.75]].map(([x, y]) => [m(x), m(y)]);
  const gl = [[0.95, 2.75], [1.3, 3.5], [1.55, 3.8], [1.85, 3.8], [1.75, 3.1], [1.5, 2.75]].map(([x, y]) => [m(x), m(y)]);
  const paint = rect(-1, 0, L + 2, 20, I1C.body) + rect(-1, R - 0.75, L + 2, 1.5, I1C.roof) + rect(-1, I11.sill - 0.2, L + 2, m(0.22) + 0.2, I1C.navy) +
    path(M_(yel[0]) + L_(yel.slice(1)) + "Z", SN.yellow) + path(M_(gl[0]) + L_(gl.slice(1)) + "Z", "#23272c") + rect(-1, -1, m(1.8), m(1.5) + 1, "#a7acb0");
  let s = shell(d, I1C.body, paint, { hi: R });
  const a = m(5.6), b = m(23.0);
  s += rect(a, I11.bandLo, b - a, I11.bandHi - I11.bandLo, "#2b3035", 0, 'rx="0.5"') + rect(a + 0.2, I11.bandLo + m(0.7), b - a - 0.4, m(0.35), C.glassLight, 0, 'rx="0.2" opacity="0.7"');
  const segs = [];
  for (let x = a + m(1.98); x < b - 1; x += m(1.98)) segs.push([x, I11.bandLo + 0.1, x, I11.bandHi - 0.1]);
  s += lines(segs, "#5d646c", 0.9);
  // The luggage room's door behind the cab, the cab's side window.
  s += glass(m(2.5), m(2.6), m(0.55), m(0.8), { r: 0.1, frame: "#3c4146" }) + redDoor(m(3.4), I11.doorW, m(0.6), m(3.6), { fill: "#c9cbca", leaves: 1, win: [0.48, 0.85], ww: 0.42 }) + iDoor(L - m(1.2) - I11.doorW);
  s += T(c, m(5.2), m(3.0), m(0.28) / 0.72, "2", I1C.ink, { family: DIN }) + T(c, L - m(2.75), m(3.0), m(0.28) / 0.72, "2", I1C.ink, { family: DIN });
  s += bMark(c, m(14.0), m(2.0), m(0.55), "#8a8e92") + lamp(m(0.66), m(1.55), 0.35, 0.4);
  s += truck(I11.truckIn, { wb: m(2.56), d: I11.wheel, top: S + 0.1 }) + truck(L - I11.truckIn, { wb: m(2.56), d: I11.wheel, top: S + 0.1 });
  s += under(m(7.0), m(19.5), S, 3, 1.0);
  return s + (c.coupledR ? gangway(L, 1, m(1.2), m(3.5)) : "") + uicEnd(0, -1, { y: m(1.06), beam: m(1.3) }) + uicEnd(L, 1);
}
// The I11s SNCB leases to SNCF for OUIGO Train Classique Paris-Brussels
// (since December 2024; 11833 and 12888 at Bruxelles-Midi, April 2025):
// OUIGO's magenta, the doors light blue with SNCB's B and SNCF Voyageurs'
// mark in white, a light blue and a pale pink disc under the windows at one
// end beside "ouigo" in white, the navy line at the sill; the first-class
// cars (A) OUIGO XL, its seat pictogram by the door.
const OUI = { pink: "#e3177d", blue: "#55b4e6", pale: "#f08bc0" };
function i11Ouigo(c, o) {
  const L = c.L, R = I11.R;
  const paint = rect(-1, 0, L + 2, 20, OUI.pink) + rect(-1, R - 0.75, L + 2, 1.5, "#b6babd") + rect(-1, I11.sill - 0.2, L + 2, m(0.3) + 0.2, "#26306a") +
    circle(m(5.2), m(1.95), m(1.15), OUI.blue) + circle(m(7.1), m(1.95), m(1.15), OUI.pale);
  let s = shell(iBody(L, R, I11.sill), OUI.pink, paint, { hi: R });
  const a = m(3.2), b = m(23.0);
  s += rect(a, I11.bandLo, b - a, I11.bandHi - I11.bandLo, "#2b3035", 0, 'rx="0.5"') + rect(a + 0.2, I11.bandLo + m(0.7), b - a - 0.4, m(0.35), C.glassLight, 0, 'rx="0.2" opacity="0.7"');
  const segs = [];
  for (let x = a + m(2.0); x < b - 1; x += m(1.98)) segs.push([x, I11.bandLo + 0.1, x, I11.bandHi - 0.1]);
  s += lines(segs, "#5d646c", 0.9);
  s += T(c, m(10.2), m(1.75), m(0.42) / 0.72, "ouigo", "#ffffff", { family: "Avenir Next, Century Gothic, Helvetica Neue, Arial, sans-serif", weight: 600 });
  for (const x of [m(1.2), L - m(1.2) - I11.doorW]) {
    s += redDoor(x, I11.doorW, m(0.6), m(3.6), { fill: OUI.blue, leaves: 1, win: [0.48, 0.85], ww: 0.42 });
    s += bMark(c, x + I11.doorW * 0.3, m(0.9), m(0.3), "#ffffff");
  }
  if (o.cls === "1") s += circle(m(0.25) + m(2.75), m(2.4), m(0.45), "none", 0, 'stroke="#ffffff" stroke-width="0.25"') + T(c, m(3.0), m(2.55), m(0.28), "XL", "#ffffff", { weight: 600 });
  s += T(c, m(5.0), m(2.35), m(0.22) / 0.72, o.cls, "#ffffff", { family: DIN });
  s += truck(I11.truckIn, { wb: m(2.56), d: I11.wheel, top: I11.sill + 0.1 }) + truck(L - I11.truckIn, { wb: m(2.56), d: I11.wheel, top: I11.sill + 0.1 });
  s += under(m(7.0), m(19.5), I11.sill, 3, 1.0);
  return s + (c.coupledL ? gangway(0, -1, m(1.2), m(3.5)) : "") + (c.coupledR ? gangway(L, 1, m(1.2), m(3.5)) : "") + uicEnd(0, -1) + uicEnd(L, 1);
}

// ===================== The older units: AM96, AM80, AM86, AR41 =====================
// All in SNCB's grey paint with red doors, as photographed 2024-2025 (AM96
// 479 at Lille-Flandres 2025, AM80 424 at Mechelen 2024, AM86 925 at
// Saint-Job 2024, AR41 4127 at Mol 2022). A car body (spec in metres):
// len, roof, sill, the cab's front at the left (cab: "am96" the black
// gangway surround of the "pig snout", "am80" the flat front, "am86" the
// "diving goggles", "ar41" the yellow front), doors [x, w, leaves], windows
// [x, w] or a band [a, b], the class figures [x, text], the first-class
// yellow line [a, b], the pantograph's x.
const CL = { body: "#dcddda", roof: "#bcc0c3", blue: "#2c3a8e", navy: "#25306a", skirt: "#b9bdc0", ink: "#6d7175", frame: "#3e4348" };
function classic(c, sp) {
  const L = c.L, R = m(sp.roof), S = m(sp.sill), cab = sp.cab;
  const fr = cab ? m(sp.front ?? 0.35) : 0.35;
  const nose = sp.nose ? sp.nose.map(([x, y]) => [m(x), m(y)]) : null;
  const d = nose ? M_(nose[0]) + L_([[nose[0][0], S], [L - 0.35, S], [L - 0.35, R - 1.2]]) + `Q${r2(L - 0.35)} ${r2(R)} ${r2(L - 1.6)} ${r2(R)}` + L_([...nose].reverse()) + "Z"
    : M_([fr, S]) + L_([[L - 0.35, S], [L - 0.35, R - 1.2]]) + `Q${r2(L - 0.35)} ${r2(R)} ${r2(L - 1.6)} ${r2(R)}` +
    L_([[fr + (cab ? m(0.6) : 1.2), R]]) + `Q${r2(fr)} ${r2(R)} ${r2(fr)} ${r2(R - (cab ? m(0.6) : 1.2))}Z`;
  let paint = rect(-1, 0, L + 2, 20, CL.body) + rect(-1, R - 0.7, L + 2, 1.4, CL.roof);
  for (const [y0, y1, fill] of sp.bands || []) paint += rect(-1, m(y0), L + 2, m(y1 - y0), fill);
  if (sp.firstLine) paint += rect(m(sp.firstLine[0]), m(sp.firstLine[2] ?? (sp.winHi + 0.18)), m(sp.firstLine[1] - sp.firstLine[0]), m(0.07), SN.yellow);
  if (cab) paint += sp.cabPaint(L);
  let s = shell(d, CL.body, paint, { hi: R });
  if (sp.band) {
    const [a, b] = sp.band;
    s += rect(m(a), m(sp.winLo), m(b - a), m(sp.winHi - sp.winLo), "#2b3035", 0, 'rx="0.4"') + rect(m(a) + 0.2, m(sp.winLo + 0.55), m(b - a) - 0.4, m(0.3), C.glassLight, 0, 'rx="0.2" opacity="0.7"');
    const segs = [];
    for (let x = a + (sp.pitch || 1.9); x < b - 0.4; x += sp.pitch || 1.9) segs.push([m(x), m(sp.winLo) + 0.1, m(x), m(sp.winHi) - 0.1]);
    s += lines(segs, "#5d646c", 0.9);
  }
  for (const [x, w] of sp.windows || []) s += glass(m(x + (sp.narrow ? (w - Math.min(w, sp.narrow)) / 2 : 0)), m(sp.winLo), m(sp.narrow ? Math.min(w, sp.narrow) : w), m(sp.winHi - sp.winLo), { r: 0.3, frame: sp.frame || CL.frame, pad: 0.13 });
  for (const [x, w, leaves = 2] of sp.doors) s += redDoor(m(x), m(w), m(sp.doorLo ?? sp.sill - 0.25), m(sp.doorHi), { leaves, win: [0.42, 0.88], ww: leaves === 1 ? 0.42 : 0.36 });
  for (const [x, t] of sp.figs || []) s += T(c, m(x), m(sp.winHi - 0.2), m(0.3) / 0.72, t, CL.ink, { family: DIN });
  if (sp.logo) s += bMark(c, m(sp.logo[0]), m(sp.logo[1]), m(0.5), "#8a8e92");
  if (sp.pan != null) s += pantograph(m(sp.pan), R + 0.1, { up: c.wires !== false, facing: -1 }) + panGear(m(sp.pan), R + 0.1, -1);
  if (sp.roofGear) s += sp.roofGear(L, R);
  if (cab) s += sp.cabOver(c, L);
  const [t1, t2] = sp.trucks;
  s += truck(m(t1), { wb: m(sp.wb || 2.5), d: sp.wheel || 36.2, top: S + 0.1 }) + truck(m(t2), { wb: m(sp.wb || 2.5), d: sp.wheel || 36.2, top: S + 0.1 });
  s += under(m(t1 + 3.2), m(t2 - 3.2), S, 3, 1.1);
  return s + (c.coupledL && !cab ? gangway(0, -1, S + 0.3, R - 1.8) : "") + (c.coupledR ? gangway(L, 1, S + 0.3, R - 1.8) : "");
}
// The automatic coupler under a unit's front.
const autoCoupler = (S) => rect(0, m(0.95), m(1.0), m(0.24), "currentColor", 0, 'opacity="0.9"') + rect(0, m(0.82), 0.5, m(0.5), "currentColor", 0, 'rx="0.15"') + rect(m(0.4), m(0.35), m(1.0), m(0.2), "#2a2d31");

// AM96 (BN/ACEC, 1996-1999; 120 units: 441-490 two-voltage, 501-570): three
// cars of 26.4 m, 79.2 m (nl.wikipedia "MS96"); the front a gangway door in
// a black rubber surround, the "pig snout"; first class in the end car "c"
// (yellow line along its top), the pantograph on the middle car.
const am96Cab = { cab: "am96", front: 0.35,
  cabPaint: () => path(`M0 0L${r2(m(1.45))} 0L${r2(m(1.45))} ${r2(m(3.5))}Q${r2(m(1.45))} ${r2(m(4.05))} ${r2(m(0.9))} ${r2(m(4.05))}L0 ${r2(m(4.05))}Z`, "#1d1f22"),
  cabOver: (c) => autoCoupler() + lamp(m(0.45), m(1.4), 0.35, 0.45) + glass(m(1.8), m(2.4), m(0.45), m(0.75), { r: 0.15, frame: "#2a2e33" }) };
const AM96S = { roof: 4.05, sill: 1.12, winLo: 2.15, winHi: 3.1, doorHi: 3.45, bands: [[0, 1.15, CL.skirt], [1.15, 1.32, CL.blue]], trucks: [3.4, 23.0], wheel: 36.2 };
const am96End = (c, first) => classic(c, { ...AM96S, ...am96Cab, windows: [[2.55, 1.2]], band: [5.9, 22.6], pitch: 1.66, doors: [[4.4, 1.05, 1], [23.5, 1.05, 1]],
  figs: first ? [[3.9, "1"], [5.65, "1"], [23.1, "1"]] : [[5.65, "2"], [23.1, "2"]], firstLine: first ? [1.45, 26.1, 3.65] : null, logo: [14.0, 1.75], trucks: [3.6, 23.0] });
const am96Mid = (c) => classic(c, { ...AM96S, band: [3.6, 22.8], pitch: 1.92, doors: [[1.7, 1.05, 1], [23.7, 1.05, 1]], figs: [[3.25, "2"], [23.3, "2"]], logo: [13.2, 1.75], pan: 18.5 });

// AM80 "Break" (BN, 1981-1985; 139 units, three cars since 2017-2021): cars
// of 25 m (iRail), 75.81 m (nl.wikipedia "MS80"); the flat front with its
// two windshields, the yellow band under them and navy below; the cab's
// door; double red doors; first class between the end car's doors under a
// yellow line; the New Look grey (2009-2020).
const am80Cab = { cab: "am80", front: 0.35,
  cabPaint: () => rect(-1, -1, m(0.75), m(1.45), CL.navy) + rect(-1, m(1.45), m(0.75), m(0.7), SN.yellow),
  cabOver: (c) => autoCoupler() + lamp(m(0.4), m(1.6), 0.3, 0.45) + glass(m(1.0), m(2.25), m(0.45), m(0.85), { r: 0.15, frame: "#2a2e33" }) +
    rect(m(1.65), m(1.2), m(0.75), m(2.25), "none", 0, 'rx="0.2" stroke="rgba(0,0,0,0.4)" stroke-width="0.6" vector-effect="non-scaling-stroke"') +
    rect(m(1.75), m(2.3), m(0.22), m(0.8), "#262b31", 0, 'rx="0.1"') + rect(m(2.08), m(2.3), m(0.22), m(0.8), "#262b31", 0, 'rx="0.1"') };
const AM80S = { roof: 3.95, sill: 1.15, winLo: 1.95, winHi: 3.2, doorHi: 3.35, bands: [[0, 1.4, CL.navy]], wheel: 38.4 };
const am80End = (c, first) => classic(c, { ...AM80S, ...am80Cab, trucks: [3.4, 21.6],
  windows: [[2.75, 1.0], [4.1, 1.0], ...(first ? [[8.0, 1.0], [9.35, 1.0], [10.7, 1.0], [12.05, 1.0]] : [[8.0, 1.0], [9.35, 1.0], [10.7, 1.0], [12.05, 1.0]]), [15.3, 1.0], [16.65, 1.0], [18.0, 1.0], [19.35, 1.0], [20.7, 1.0], [22.05, 1.0], [23.4, 1.0]],
  doors: [[5.95, 1.3], [13.55, 1.3]], figs: first ? [[5.6, "2"], [7.6, "1"], [13.2, "1"], [15.1, "2"]] : [[5.6, "2"], [7.6, "2"], [13.2, "2"], [15.1, "2"]],
  firstLine: first ? [7.35, 13.45, 3.45] : null, logo: [14.3, 1.7], narrow: 0.85 });
const am80Mid = (c) => classic(c, { ...AM80S, trucks: [3.4, 21.6], windows: [[0.9, 1.0], [2.25, 1.0], [3.6, 1.0], [7.1, 1.0], [8.45, 1.0], [9.8, 1.0], [11.15, 1.0], [12.5, 1.0], [13.85, 1.0], [15.2, 1.0], [16.55, 1.0], [20.05, 1.0], [21.4, 1.0], [22.75, 1.0]],
  doors: [[5.0, 1.3], [17.95, 1.3]], figs: [[4.7, "2"], [6.65, "2"], [17.65, "2"], [19.6, "2"]], pan: 12.5, logo: [10.6, 1.7], narrow: 0.85 });

// AM86 (BN, 1986-1988; 52 units, two cars of 26.4 m, 52.8 m; trucks 19.125
// m apart; nl.wikipedia "MS86"): the "diving goggles" front, yellow over
// a grey lamp band, yellow and blue below; navy low along the side; tall
// windows; double red doors.
const am86Cab = { cab: "am86", front: 0.4,
  cabPaint: () => path(`M-1 ${r2(m(2.2))}L${r2(m(0.95))} ${r2(m(2.2))}L${r2(m(1.2))} ${r2(m(4.3))}L-1 ${r2(m(4.3))}Z`, SN.yellow) + rect(-1, m(1.62), m(1.0), m(0.58), "#9a9fa3") +
    rect(-1, m(1.3), m(1.0), m(0.32), SN.yellow),
  cabOver: (c) => autoCoupler() + glass(m(1.45), m(2.35), m(0.5), m(0.95), { r: 0.15, frame: "#2a2e33" }) };
const AM86S = { roof: 4.0, sill: 1.1, winLo: 2.0, winHi: 3.25, doorHi: 3.4, bands: [[0, 1.55, CL.blue]], trucks: [3.65, 22.8], wheel: 39.8 };
const am86Car = (c, first) => classic(c, { ...AM86S, ...am86Cab, windows: [[2.25, 0.85], [3.35, 0.85], [6.65, 0.85], [7.75, 0.85], [8.85, 0.85], [9.95, 0.85], [11.05, 0.85], [12.15, 0.85], [13.25, 0.85], [14.35, 0.85], [15.45, 0.85], [16.55, 0.85], [17.65, 0.85], [21.2, 0.85], [22.3, 0.85], [23.4, 0.85], [24.5, 0.85]],
  doors: [[4.55, 1.5], [19.0, 1.5]], figs: [[4.25, first ? "1" : "2"], [6.35, "2"], [18.7, "2"], [20.85, "2"]], logo: [10.5, 1.82], pan: first ? null : 13.0 });

// AR41 (Alstom/Fiat, 2000-2003; 96 units, two cars, 49.6 m; nl.wikipedia
// "MW41"): the yellow front, a door by each cab; the windows in one band;
// a thin navy line low on the side; first class (12 seats) behind car "a"'s
// door, a yellow line over it; the diesel's exhausts on the roof.
const ar41Cab = { cab: "ar41", front: 0.4,
  cabPaint: () => path(`M-1 ${r2(m(0.6))}L${r2(m(1.15))} ${r2(m(0.6))}L${r2(m(1.15))} ${r2(m(4.0))}L-1 ${r2(m(4.0))}Z`, SN.yellow) + rect(-1, -1, m(1.15) + 1, m(1.6), "#8f9498"),
  cabOver: (c) => autoCoupler() + lamp(m(0.45), m(1.65), 0.35, 0.45) + glass(m(1.4), m(2.35), m(0.55), m(0.8), { r: 0.15, frame: "#2a2e33" }) };
const AR41S = { roof: 4.0, sill: 1.15, winLo: 2.15, winHi: 3.15, doorHi: 3.4, bands: [[0, 1.15, CL.skirt], [1.15, 1.3, CL.navy]], trucks: [3.7, 21.3], wheel: 33.5 };
const ar41Car = (c, first) => classic(c, { ...AR41S, ...ar41Cab, doors: [[2.15, 1.05, 1]], band: [3.75, 23.7], pitch: 1.8, figs: [[3.55, first ? "1" : "2"]],
  firstLine: first ? [2.0, 9.5, 3.45] : null, logo: [12.5, 1.75],
  roofGear: (L, R) => rect(m(12.0), R - 0.05, m(1.3), 0.7, C.steelDark, 0.4, 'rx="0.2"') + rect(m(12.3), R + 0.6, 0.5, 0.6, "currentColor") + roofCover(m(5.0), R, m(5.5), 0.5, "#b9bdc0", 2) });

// AM75 (BN, 1975-1979; 44 four-car units 801-844, still on the S32
// Antwerpen-Roosendaal in 2026): cars of 25 m (iRail), the sloping front
// with yellow over its lower half, the windshields raked back; a deep
// navy band along the side's foot; double red doors; framed windows (838
// at Essen and 806 at Nispen, 2025).
const am75Cab = { cab: "am75", nose: [[0.35, 1.1], [0.38, 1.95], [0.55, 2.35], [1.35, 3.6], [1.75, 3.98], [2.1, 4.0]],
  cabPaint: () => path(`M-1 -1L${r2(m(1.6))} -1L${r2(m(1.6))} ${r2(m(1.65))}L${r2(m(0.95))} ${r2(m(2.45))}L-1 ${r2(m(2.45))}Z`, SN.yellow) +
    path(`M${r2(m(0.6))} ${r2(m(2.55))}L${r2(m(1.3))} ${r2(m(3.55))}L${r2(m(1.8))} ${r2(m(3.55))}L${r2(m(1.65))} ${r2(m(2.55))}Z`, "#23272c") + rect(-1, -1, m(2.0), m(1.05) + 1, CL.navy),
  cabOver: (c) => autoCoupler() + lamp(m(0.45), m(1.55), 0.4, 0.45) + glass(m(2.35), m(2.4), m(0.8), m(0.95), { r: 0.25, frame: "#9a9a96" }) +
    T(c, m(4.2), m(1.9), m(0.3) / 0.72, c.number || "838", CL.ink, { family: DIN, weight: 500 }) };
const AM75S = { roof: 4.0, sill: 1.15, winLo: 2.0, winHi: 3.05, doorHi: 3.35, bands: [[0, 1.6, CL.navy]], trucks: [3.4, 21.6], wheel: 39.4 };
const am75w = (xs) => xs.map((x) => [x, 1.05]);
const am75End = (c, first) => classic(c, { ...AM75S, ...am75Cab, windows: [[5.3, 1.3], [6.9, 1.3], [8.5, 1.3], [10.1, 1.3], [14.0, 1.2], [15.5, 1.2], [17.0, 1.2], [18.5, 1.2], [20.0, 1.2], [23.6, 1.0]],
  doors: [[11.85, 1.5], [21.6, 1.5]], figs: first ? [[11.55, "1"], [13.6, "1"]] : [[11.55, "2"], [13.6, "2"], [21.3, "2"]], firstLine: first ? [5.2, 11.7] : null, frame: "#a9a9a4" });
const am75Mid = (c, pan) => classic(c, { ...AM75S, frame: "#a9a9a4", windows: am75w([0.8, 2.25, 3.7, 5.15, 6.6, 8.05, 14.6, 16.05, 17.5, 18.95, 20.4, 21.85, 23.3]),
  doors: [[10.6, 1.5]], figs: [[10.3, "2"], [12.35, "2"]], pan: pan ? 6.0 : null, logo: pan ? null : [5.0, 1.82] });

// ===================== The foreign railways' trains =====================

// ---------- DB: ICE 3neo (class 408) ----------
// Siemens Velaro MS for DB (class 408, "ICE 3neo", 2022 on): eight cars,
// 200.7 m: end cars 25.68 m, the others 24.78 m, trucks 17.38 m apart,
// bodies 3.89 m tall (de.wikipedia "DB-Baureihe 408"). On Frankfurt-
// Brussels since 2024 (8016 and 8035 at Bruxelles-Midi, April 2025): light
// grey-white, the traffic-red stripe low along the side, rising and then
// curving down the nose to its tip; "ICE" in big grey capitals behind the
// cab, breaking the stripe; the DB mark in the stripe and on the nose;
// the windows in a dark band; one door a car side; the first-class cars'
// "1" by their doors.
const VEL = { white: "#e9ebec", red: "#ec0016", grey: "#9aa0a6", band: "#252a30", R: m(3.89), sill: m(0.45), stripe: [m(1.1), m(1.42)], winLo: m(1.72), winHi: m(2.62) };
const dbMark = (c, x, y, h) => rect(x - h * 0.72, y - h / 2, h * 1.44, h, "#ffffff", 0, `rx="${r2(h * 0.18)}" stroke="${VEL.red}" stroke-width="${r2(h * 0.11)}"`) +
  T(c, x, y - h * 0.02, h * 0.74, "DB", VEL.red, { weight: 800 });
const VNOSE = [[0.0, 0.95], [0.25, 1.35], [0.75, 1.68], [1.6, 2.05], [2.7, 2.48], [3.8, 2.92], [5.0, 3.38], [6.2, 3.72], [7.4, 3.88], [8.2, 3.89]].map(([x, y]) => [m(x), m(y)]);
const VLOW = [[0.0, 0.95], [0.3, 0.55], [1.0, 0.38], [2.0, 0.36]].map(([x, y]) => [m(x), m(y)]);
function velaroBody(L, cab) {
  const R = VEL.R, S = VEL.sill;
  if (!cab) return M_([0.4, S]) + L_([[L - 0.4, S], [L - 0.4, R - 1.2]]) + `Q${r2(L - 0.4)} ${r2(R)} ${r2(L - 1.6)} ${r2(R)}` + L_([[1.6, R]]) + `Q0.4 ${r2(R)} 0.4 ${r2(R - 1.2)}Z`;
  return M_(VNOSE[0]) + L_(VLOW.slice(1)) + L_([[VLOW.at(-1)[0], S], [L - 0.4, S], [L - 0.4, R - 1.2]]) + `Q${r2(L - 0.4)} ${r2(R)} ${r2(L - 1.6)} ${r2(R)}` +
    L_([VNOSE.at(-1)]) + smooth([...VNOSE].reverse()) + "Z";
}
const vDoor = (x) => rect(x, m(0.5), m(0.95), m(2.55), "none", 0, 'rx="0.25" stroke="rgba(60,66,72,0.6)" stroke-width="0.6" vector-effect="non-scaling-stroke"') +
  rect(x + m(0.25), m(1.65), m(0.45), m(1.0), "#2a2f35", 0, 'rx="0.2"');
const vWindows = (a, b, pitch) => {
  let s = rect(a, VEL.winLo, b - a, VEL.winHi - VEL.winLo, VEL.band, 0, 'rx="0.5"') + rect(a + 0.2, VEL.winLo + m(0.55), b - a - 0.4, m(0.25), C.glassLight, 0, 'rx="0.2" opacity="0.7"');
  const segs = [];
  for (let x = a + pitch; x < b - 1; x += pitch) segs.push([x, VEL.winLo + 0.1, x, VEL.winHi - 0.1]);
  return s + lines(segs, "#4a525c", 0.7);
};
const vTrucks = (L, b1, b2) => truck(b1, { wb: m(2.5), d: 36.2, top: VEL.sill + 0.6 }) + truck(b2, { wb: m(2.5), d: 36.2, top: VEL.sill + 0.6 });
// An end car (cab on the left): o.cls "1" or "2".
function ice3neoEnd(c, o) {
  const L = c.L, R = VEL.R, [s0, s1] = VEL.stripe;
  const sweep = [[0.05, 1.02], [1.2, 1.12], [2.6, 1.15], [4.2, 1.2], [5.6, 1.3], [6.8, 1.45], [7.6, 1.6]].map(([x, y]) => [m(x), m(y)]);
  const sweepUp = [[7.6, 1.9], [6.8, 1.75], [5.6, 1.58], [4.2, 1.46], [2.6, 1.38], [1.2, 1.3], [0.05, 1.2]].map(([x, y]) => [m(x), m(y)]);
  const paint = rect(-1, 0, L + 2, 20, VEL.white) + path(M_(sweep[0]) + smooth(sweep) + L_([sweepUp[0]]) + smooth(sweepUp) + "Z", VEL.red) +
    rect(m(10.6), s0, L - m(10.6) + 1, s1 - s0, VEL.red) + rect(-1, 0, L + 2, m(0.7), "#c9cdd1") +
    path(M_([m(1.1), m(2.1)]) + smooth([[m(1.1), m(2.1)], [m(2.5), m(2.6)], [m(4.0), m(3.1)], [m(5.4), m(3.5)], [m(6.4), m(3.7)]]) +
      L_([[m(6.8), m(3.2)], [m(5.6), m(2.95)], [m(4.0), m(2.55)], [m(2.6), m(2.2)]]) + "Z", "#1f242a");
  let s = shell(velaroBody(L, true), VEL.white, paint, { hi: R });
  s += path(M_([m(7.0), m(1.85)]) + L_([[m(7.6), m(2.75)], [m(10.0), m(2.75)], [m(10.0), m(1.85)]]) + "Z", VEL.band);
  s += T(c, m(9.0), m(1.3), m(0.85) / 0.72, "ICE", VEL.grey, { weight: 500, family: "DB Head, Helvetica Neue, Arial, sans-serif", stretch: 0.92 });
  s += vDoor(m(10.65)) + vWindows(m(12.0), L - m(1.6), m(1.78)) + dbMark(c, m(14.5), (s0 + s1) / 2, m(0.26)) + dbMark(c, m(1.15), m(1.5), m(0.24));
  if (o.cls === "1") s += T(c, m(11.95), m(2.4), m(0.32) / 0.72, "1", "#ffffff", { weight: 700 }) + rect(m(11.62), m(2.0), m(0.06), m(0.55), "#f6c400");
  s += roofCover(m(9.0), R, m(8.0), 0.35, "#c3c8cd", 3) + vTrucks(L, m(4.6), L - m(3.7));
  return s + (c.coupledR ? gangway(L, 1, m(0.9), m(3.0)) : "");
}
// A middle car: o.cls, o.pan (a pantograph car), o.bistro.
function ice3neoMid(c, o) {
  const L = c.L, R = VEL.R, [s0, s1] = VEL.stripe;
  const paint = rect(-1, 0, L + 2, 20, VEL.white) + rect(-1, s0, L + 2, s1 - s0, VEL.red) + rect(-1, 0, L + 2, m(0.7), "#c9cdd1");
  let s = shell(velaroBody(L, false), VEL.white, paint, { hi: R });
  s += vDoor(m(1.0)) + vWindows(m(2.4), L - m(1.4), m(1.78)) + dbMark(c, L / 2, (s0 + s1) / 2, m(0.26));
  if (o.cls === "1") s += T(c, m(2.35), m(2.4), m(0.32) / 0.72, "1", "#ffffff", { weight: 700 }) + rect(m(2.0), m(2.0), m(0.06), m(0.55), "#f6c400");
  if (o.pan) s += pantograph(L / 2, R + 0.1, { up: c.wires !== false, facing: -1 }) + roofCover(L / 2 - m(4.5), R, m(2.0), 0.35, "#c3c8cd", 1);
  else s += roofCover(m(4.0), R, L - m(8.0), 0.3, "#c3c8cd", 4);
  s += vTrucks(L, m(3.7), L - m(3.7));
  return s + (c.coupledL ? gangway(0, -1, m(0.9), m(3.0)) : "") + (c.coupledR ? gangway(L, 1, m(0.9), m(3.0)) : "");
}

// ---------- NS: ICNG (EuroCity Brussels-Rotterdam) ----------
// Alstom Coradia Stream for NS, the two-voltage ICNG-B (3301 on) on the
// EuroCity Brussels-Antwerpen-Rotterdam since 2025: eight cars, about 200
// m (iRail gives 25 m a car), 4.25 m tall. NS's paint as photographed
// (3315 at Roosendaal 2026, 3318 at Brussel-Zuid 2025): yellow, blue over
// the windows to the roof and round the windshield, blue doors, a thin blue
// line at the sill, the NS mark big in white on the end car's side behind
// the door and small in blue on the nose.
const NSC = { yellow: "#ffc917", blue: "#003082", mid: "#2a5fc0", R: m(4.25), sill: m(0.75), winLo: m(1.6), winHi: m(2.9) };
const ICNOSE = [[0.35, 0.65], [0.38, 1.45], [0.6, 1.95], [1.1, 2.6], [1.8, 3.4], [2.5, 3.95], [3.3, 4.22], [3.9, 4.25]].map(([x, y]) => [m(x), m(y)]);
const ICLOW = [[0.35, 0.45], [1.2, 0.4], [2.0, 0.42]].map(([x, y]) => [m(x), m(y)]);
// The NS mark: two arrows round a pair of bars, h ft tall, centered at (x, y).
const nsMark = (c, x, y, h, color, sw = 0.14) => {
  const u = h / 2, w = `stroke="${color}" stroke-width="${r2(h * sw)}" fill="none" stroke-linejoin="round"`;
  return `<g transform="translate(${r2(x)} ${r2(y)}) scale(${c.mirrored ? -1 : 1} 1)"><path d="M${r2(-1.55 * u)} 0L${r2(-0.8 * u)} ${r2(0.75 * u)}L${r2(0.9 * u)} ${r2(0.75 * u)}M${r2(-1.55 * u)} 0L${r2(-0.8 * u)} ${r2(-0.75 * u)}L${r2(-0.2 * u)} ${r2(-0.75 * u)}` +
    `M${r2(1.55 * u)} 0L${r2(0.8 * u)} ${r2(-0.75 * u)}L${r2(-0.9 * u)} ${r2(-0.75 * u)}M${r2(1.55 * u)} 0L${r2(0.8 * u)} ${r2(0.75 * u)}L${r2(0.2 * u)} ${r2(0.75 * u)}` +
    `M${r2(-0.6 * u)} ${r2(0.28 * u)}L${r2(0.6 * u)} ${r2(0.28 * u)}M${r2(-0.6 * u)} ${r2(-0.28 * u)}L${r2(0.6 * u)} ${r2(-0.28 * u)}" ${w}/></g>`;
};
function icngCar(c, o) {
  const L = c.L, R = NSC.R, S = NSC.sill, cab = o.cab;
  const d = cab ? M_(ICNOSE[0]) + L_(ICLOW.slice(1)) + L_([[ICLOW.at(-1)[0], S], [L - 0.4, S], [L - 0.4, R - 1.2]]) + `Q${r2(L - 0.4)} ${r2(R)} ${r2(L - 1.6)} ${r2(R)}` +
    L_([ICNOSE.at(-1)]) + smooth([...ICNOSE].reverse()) + "Z"
    : M_([0.4, S]) + L_([[L - 0.4, S], [L - 0.4, R - 1.2]]) + `Q${r2(L - 0.4)} ${r2(R)} ${r2(L - 1.6)} ${r2(R)}` + L_([[1.6, R]]) + `Q0.4 ${r2(R)} 0.4 ${r2(R - 1.2)}Z`;
  let paint = rect(-1, 0, L + 2, 20, NSC.yellow) + rect(-1, NSC.winHi + m(0.12), L + 2, 10, NSC.blue) + rect(-1, S - 0.2, L + 2, m(0.12) + 0.2, NSC.blue);
  if (cab) paint += path(M_([m(0.55), m(1.85)]) + L_([[m(1.6), m(1.95)], [m(3.4), m(3.0)], [m(4.4), m(3.0)], [m(4.4), m(5.0)], [m(0.5), m(5.0)]]) + "Z", NSC.blue) +
    path(M_([m(0.75), m(2.05)]) + L_([[m(1.35), m(2.05)], [m(2.9), m(3.35)], [m(3.3), m(4.05)], [m(2.5), m(4.0)], [m(1.4), m(3.15)]]) + "Z", "#1c2229");
  let s = shell(d, NSC.yellow, paint, { hi: R });
  const doors = cab ? [m(4.7)] : [m(1.2), L - m(2.5)];
  for (const x of doors) s += redDoor(x, m(1.3), m(0.78), m(3.0), { fill: NSC.mid, win: [0.38, 0.85], ww: 0.34 });
  const a = cab ? m(6.3) : m(2.8), b = cab ? L - m(1.2) : L - m(2.9);
  for (let x = cab ? a + m(4.2) : a; x + m(0.9) < b; x += m(1.7)) s += glass(x, NSC.winLo, m(0.95), NSC.winHi - NSC.winLo, { r: 0.3, frame: "#14181c", pad: 0.12 });
  if (cab) s += nsMark(c, m(8.4), m(2.35), m(2.3), "#ffffff", 0.13) + lamp(m(0.65), m(1.3), 0.6, 0.35) + nsMark(c, m(0.9), m(1.05), m(0.22), NSC.blue);
  if (o.cls === "1") s += T(c, cab ? m(6.0) : m(2.55), m(2.4), m(0.32) / 0.72, "1", NSC.blue, { weight: 700 });
  if (o.pan) s += pantograph(L / 2, R + 0.1, { up: c.wires !== false, facing: -1 }) + panGear(L / 2, R + 0.1, -1);
  s += roofCover(m(3.5), R, m(5.0), 0.4, "#7d8a9e", 2);
  s += truck(cab ? m(3.6) : m(3.2), { wb: m(2.6), d: 33.5, top: S + 0.1 }) + truck(L - m(3.2), { wb: m(2.6), d: 33.5, top: S + 0.1 }) + under(m(7.5), L - m(7.0), S, 3, 1.0);
  return s + (c.coupledL && !cab ? gangway(0, -1, S + 0.4, m(3.3)) : "") + (c.coupledR ? gangway(L, 1, S + 0.4, m(3.3)) : "");
}

// ===================== Types, models =====================
export const TYPES = {}, MODELS = {};
const Mo = (draw, len) => ({ draw, len, oneEnd: false, variant: (c) => `${c.index}/${c.count}` });
function add(key, name, draw, len, extra = {}) {
  TYPES[key] = { name, kind: "coach", ...extra };
  MODELS[key] = Mo(draw, len);
}
// A car with a cab or a one-sided layout: key (as drawn, cab on the left)
// and key + "R" (turned round).
function addR(key, name, draw, len, extra = {}) {
  add(key, name, draw, len, extra);
  add(`${key}R`, name, (c) => turned(c, draw), len, extra);
}
const FIRST = { amenities: ["first"] };
addR("m7B", "M7 double-deck coach, second class (B)", (c) => ddCoach(c, { cls: "2" }), DD.L);
addR("m7AB", "M7 double-deck coach, first class upstairs (AB)", (c) => ddCoach(c, { cls: "12" }), DD.L, FIRST);
addR("m7BD", "M7 multi-purpose coach (BD): bicycles, wheelchair places", (c) => ddCoach(c, { cls: "2", bd: "m7" }), DD.L, { amenities: ["bikes"] });
addR("m7BDx", "M7 driving trailer (BDx): bicycles, wheelchair places", (c) => m7CabCar(c, { kind: "BDx" }), DD.L, { cab: true, amenities: ["bikes"] });
addR("m7BVx", "M7 driving trailer (BVx)", (c) => m7CabCar(c, { kind: "BVx" }), DD.L, { cab: true, amenities: ["bikes"] });
addR("m7Bmx", "M7 motor car (Bmx)", m7Bmx, m(24.19), { cab: true, pan: true, kind: "emu" });
addR("m6Bx", "M6 driving trailer (Bx)", m6Bx, DD.L, { cab: true });
add("hle18", "HLE 18 locomotive (Siemens Eurosprinter)", hle18, m(19.58), { kind: "electric", pan: true });
add("hle13", "HLE 13 locomotive (Alstom)", hle13, m(19.11), { kind: "electric", pan: true });
addR("am08a", "Desiro AM08 end car, first and second class", (c) => am8End(c), m(27.2), { kind: "emu", amenities: ["first"] });
addR("am08c", "Desiro AM08 end car, first and second class, bicycles", (c) => am8End(c, { bikes: true }), m(27.2), { kind: "emu", amenities: ["first", "bikes"] });
add("am08b", "Desiro AM08 middle car (pantograph)", am8Mid, m(25.5), { kind: "emu", pan: true });
addR("m6A", "M6 double-deck coach, first class (A)", (c) => m6Coach(c, { kind: "A" }), DD.L, FIRST);
addR("m6B", "M6 double-deck coach, second class (B)", (c) => m6Coach(c, { kind: "B" }), DD.L);
addR("m6BD", "M6 multi-purpose coach (BD): bicycles, wheelchair places", (c) => m6Coach(c, { kind: "BD" }), DD.L, { amenities: ["bikes"] });
add("i11A", "I11 coach, first class (A)", (c) => i11Coach(c, { cls: "1" }), I11.L, FIRST);
add("i11B", "I11 coach, second class (B)", (c) => i11Coach(c, { cls: "2" }), I11.L);
add("i10B", "I10 coach with bicycle places (B)", i10Bike, I11.L, { amenities: ["bikes"] });
addR("am96c", "AM96 end car, first class (c)", (c) => am96End(c, true), m(26.4), { kind: "emu", amenities: ["first", "bikes"] });
addR("am96a", "AM96 end car, second class (a)", (c) => am96End(c, false), m(26.4), { kind: "emu" });
add("am96b", "AM96 middle car (b), pantograph", am96Mid, m(26.4), { kind: "emu", pan: true });
addR("am80c", "AM80 \"Break\" end car, first and second class (c)", (c) => am80End(c, true), m(25.0), { kind: "emu", amenities: ["first"] });
addR("am80a", "AM80 \"Break\" end car, second class (a)", (c) => am80End(c, false), m(25.0), { kind: "emu" });
add("am80b", "AM80 \"Break\" middle car (b), pantograph", am80Mid, m(25.0), { kind: "emu", pan: true, amenities: ["bikes"] });
addR("am86a", "AM86 car with first class", (c) => am86Car(c, true), m(26.4), { kind: "emu", amenities: ["first"] });
addR("am86b", "AM86 car, pantograph", (c) => am86Car(c, false), m(26.4), { kind: "emu", pan: true });
addR("ar41a", "AR41 diesel car with first class (a)", (c) => ar41Car(c, true), m(24.8), { kind: "emu", amenities: ["first", "bikes"] });
addR("ar41b", "AR41 diesel car (b)", (c) => ar41Car(c, false), m(24.8), { kind: "emu" });
addR("am75a", "AM75 end car, first class (a)", (c) => am75End(c, true), m(25.0), { kind: "emu", amenities: ["first"] });
addR("am75d", "AM75 end car, second class (d)", (c) => am75End(c, false), m(25.0), { kind: "emu" });
addR("am75b", "AM75 middle car (b), pantograph", (c) => am75Mid(c, true), m(25.0), { kind: "emu", pan: true });
addR("am75c", "AM75 middle car (c), bicycles", (c) => am75Mid(c, false), m(25.0), { kind: "emu", amenities: ["bikes"] });
addR("i11BDx", "I11 driving trailer (BDx)", i11BDx, I11.L, { cab: true, amenities: ["bikes"] });
add("i11OuigoA", "I11 coach in OUIGO paint, OUIGO XL (first class)", (c) => i11Ouigo(c, { cls: "1" }), I11.L, FIRST);
add("i11OuigoB", "I11 coach in OUIGO paint", (c) => i11Ouigo(c, { cls: "2" }), I11.L);
add("hle19", "HLE 19 locomotive (Siemens Eurosprinter)", (c) => hle18({ ...c, number: c.number || "1903" }), m(19.58), { kind: "electric", pan: true });
addR("ice3neoEnd1", "ICE 3neo end car, first class", (c) => ice3neoEnd(c, { cls: "1" }), m(25.68), { kind: "emu", amenities: ["first"] });
addR("ice3neoEnd2", "ICE 3neo end car, second class", (c) => ice3neoEnd(c, { cls: "2" }), m(25.68), { kind: "emu" });
add("ice3neoFirst", "ICE 3neo first-class car", (c) => ice3neoMid(c, { cls: "1" }), m(24.78), { kind: "emu", amenities: ["first"] });
add("ice3neoBistro", "ICE 3neo car with the bistro", (c) => ice3neoMid(c, { cls: "2", pan: true }), m(24.78), { kind: "emu", amenities: ["cafe"] });
add("ice3neoSecond", "ICE 3neo second-class car", (c) => ice3neoMid(c, { cls: "2" }), m(24.78), { kind: "emu" });
add("ice3neoPan", "ICE 3neo second-class car with pantograph", (c) => ice3neoMid(c, { cls: "2", pan: true }), m(24.78), { kind: "emu" });
addR("icngEnd", "ICNG (NS) end car", (c) => icngCar(c, { cab: true, cls: "2" }), m(27.4), { kind: "emu" });
addR("icngEnd1", "ICNG (NS) end car with first class", (c) => icngCar(c, { cab: true, cls: "1" }), m(27.4), { kind: "emu", amenities: ["first"] });
add("icngMid", "ICNG (NS) middle car", (c) => icngCar(c, { cls: "2" }), m(24.2), { kind: "emu" });
add("icngMidP", "ICNG (NS) middle car with pantograph", (c) => icngCar(c, { cls: "2", pan: true }), m(24.2), { kind: "emu" });
add("icngMid1", "ICNG (NS) first-class car", (c) => icngCar(c, { cls: "1" }), m(24.2), { kind: "emu", amenities: ["first"] });
// The borrowed drawings: ÖBB's classic Nightjet cars, CFL's Coradia Duplex.
for (const k of ["atNjoSleeper", "atNjoCouchette", "atNjoCoach"]) if (CHI_TYPES[k] && CHI_MODELS[k]) { TYPES[k] = CHI_TYPES[k]; MODELS[k] = CHI_MODELS[k]; }
for (const [k] of CFL_SETS?.TN3?.units || []) {
  const base = k.replace(/R$/, "");
  if (CFL_TYPES[base] && CFL_MODELS[k]) { TYPES[k] = { ...CFL_TYPES[base] }; MODELS[k] = CFL_MODELS[k]; }
}

// ===================== A reported formation =====================
// iRail's composition (sncb.py: cars.models the vehicle's
// materialSubTypeName, "AM08P_c", "M7BUH", "HLE18"; cars.sides its
// orientation, LEFT or RIGHT) names each vehicle's drawing: the class and
// the vehicle's place in its unit. A cab car faces out of its unit: the
// first cab car of the train ahead, the next back, and so on (two units,
// two sets coupled: their cabs meet in the middle), the train's last
// vehicle back; iRail's own orientation, unreliable for the M7's motor
// cars (two coupled back to back both "RIGHT"), is used only for the
// coaches (a coach "RIGHT" is drawn turned round), when consist.js passes
// it (car.side; it passes number, cls, model, order today).
const CAB = /^(AM08[MP]?[AC]|AM96[MP]?[AC]|AM80M?[AC]|AM75[AD]|AM86[AB]|AR41[AB]|M7BMX|M7BDXH|M7BXH|M6BX|I11BDX|HLE)/;
function modelKey(model, number) {
  const x = String(model || "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/UNKNOWN/g, "");
  let k;
  if ((k = x.match(/^AM08[MP]?([ABC])$/))) return k[1] === "B" ? "am08b" : `am08${k[1].toLowerCase()}`;
  if ((k = x.match(/^AM96[MP]?([ABC])$/))) return k[1] === "B" ? "am96b" : `am96${k[1].toLowerCase()}`;
  if ((k = x.match(/^AM8[023]M?([ABC])$/))) return k[1] === "B" ? "am80b" : `am80${k[1].toLowerCase()}`;
  if ((k = x.match(/^AM75([ABCD])$/))) return `am75${k[1].toLowerCase()}`;
  if ((k = x.match(/^AM86([AB])$/))) return `am86${k[1].toLowerCase()}`;
  if ((k = x.match(/^AR41([AB])$/))) return `ar41${k[1].toLowerCase()}`;
  if (/^M7BMX/.test(x)) return "m7Bmx";
  if (/^M7BDX/.test(x)) return "m7BDx";
  if (/^M7BX/.test(x)) return Number(number) && Number(number) < 75066 ? "m7BDx" : "m7BVx";
  if (/^M7AB/.test(x)) return "m7AB";
  if (/^M7BD/.test(x)) return "m7BD";
  if (/^M7B/.test(x)) return "m7B";
  if (/^M6BX/.test(x)) return "m6Bx";
  if (/^M6A/.test(x)) return "m6A";
  if (/^M6BD/.test(x)) return "m6BD";
  if (/^M6B/.test(x)) return "m6B";
  if (/^I10/.test(x)) return "i10B";
  if (/^I11BDX/.test(x)) return "i11BDx";
  if (/^I11A/.test(x)) return "i11A";
  if (/^I11B/.test(x)) return "i11B";
  if (/^HLE1[89]/.test(x)) return x.startsWith("HLE19") ? "hle19" : "hle18";
  if (/^HLE13/.test(x)) return "hle13";
  return null;
}
const normModel = (model) => String(model || "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/UNKNOWN/g, "");
const turnable = (key) => TYPES[`${key}R`] != null;
// The key for vehicle i; side "LEFT"/"RIGHT" when known.
function vehicleKey(cars, i) {
  const car = cars[i], key = modelKey(car.model, car.number), x = normModel(car.model);
  if (!key || !turnable(key)) return key;
  if (CAB.test(x)) {
    if (i === cars.length - 1 && i > 0) return `${key}R`;
    let p = 0;
    for (let j = 0; j < i; j++) if (CAB.test(normModel(cars[j].model)) && !/^HLE/.test(normModel(cars[j].model))) p++;
    return i > 0 && p % 2 === 1 ? `${key}R` : key;
  }
  return String(car.side || "").toUpperCase() === "RIGHT" ? `${key}R` : key;
}
const formation = (car, i, cars) => vehicleKey(cars, i);
export const FORMATION = { sncb: formation, beintl: formation };

// ===================== What usually runs =====================

// iRail's compositions of SNCB's trains, sampled 24 October 2026 (a
// Saturday): each formation as iRail gives it (materialSubTypeName, ":R"
// for a vehicle facing RIGHT), then each sampled train's number and its
// formation's index.
const SAMPLED_FORMS = [
  "AM08MA AM08MB AM08MC:R",
  "AM96PA AM96PB AM96PC:R",
  "AM96PC AM96PB AM96PA:R",
  "AM08MC AM08MB AM08MA:R",
  "AM08PA AM08PB AM08PC:R",
  "AM08PC AM08PB AM08PA:R",
  "AM96PC AM96PB AM96PA:R AM96PC AM96PB AM96PA:R",
  "AM96PA AM96PB AM96PC:R AM96PA AM96PB AM96PC:R",
  "AM08MA AM08MB AM08MC:R AM08MC AM08MB AM08MA:R",
  "AM80MC AM80MB AM80MA:R AM80MC AM80MB AM80MA:R",
  "M7BXH M7ABUH M7BDH:R M7BMX:R M7BMX:R M7ABUH M7BDH M7BXH:R",
  "AM80MC AM80MB AM80MA:R AM80MC AM80MB AM80MA:R AM80MC AM80MB AM80MA:R",
  "M7BMX M7BUH M7BDH M7ABUH M7ABUH M7BXH:R",
  "M7BMX M7BDH M7ABUH M7BXH:R M7BXH M7ABUH M7ABUH M7BDH M7BUH:R M7BMX:R",
  "M7BXH M7BDH M7ABUH:R M7BMX:R M7BMX:R M7BDH M7ABUH M7BXH:R",
  "AM08PC AM08PB AM08PA:R AM08PC AM08PB AM08PA:R",
  "M6BXCT M6BU M6BU M6AU M6BDYU M6BU M6BU:R HLE18:R",
  "M6BXCT M6BU M6BU M6AU M6BDU M6BU M6BU:R HLE18:R",
  "AR41B AR41A:R",
  "AR41A AR41B:R",
  "M6BU M6BU M6AU M6AU M6BDU M6BU M6BU M6BXCT:R HLE18:R",
  "HLE18 M6BU M6BU M6AU M6BU M6AU M6BDU M6BU M6BXCT:R",
  "HLE19 M6BU M6BYU M6BU M6BDU M6AU M6BU M6BYU M6BXCT:R",
  "HLE18 M6AU M6AU M6BU M6BU M6BU M6BU M6BDU M6BXCT:R",
  "M6BXCT M6BU M6BDU M6AU M6BU M6AU M6BU M6BU:R HLE18:R",
  "AM96PC AM96PB AM96PA:R AM96MA AM96MB AM96MC:R",
  "HLE18 M6BXAA M6BU M6BU M6AU M6BDU M6BYU M6BU M6BU:R",
  "HLE18 M6BU M6BU M6AU M6BDU M6BDU M6BU M6BXCT:R",
  "AM96MC AM96MB AM96MA:R AM96PA AM96PB AM96PC:R",
  "HLE13 M7BUH M7ABUH M7BUH M7ABUH M7BDXH:R",
  "HLE13 M7ABUH M7BUH M7ABUH M7BUH M7BDXH:R",
  "HLE13 M7BUH M7ABUH M7ABUH M7BUH M7BXH:R",
  "HLE18 M7BUH M7BUH M6BDU M6AUH M6AYU M6BU M6BU M7BXH:R",
  "AM80MC AM80MB AM80MA:R AM80MA AM80MB AM80MC:R",
  "HLE18 M6BU M6BU M6AU M6AU M6BDU M7BUH M7BUH M7BXH:R",
  "M7BXH M6BU M6BU M6AYU M6AUH M6BDU M7BUH M7BUH:R HLE18:R",
  "HLE18 M6BU M6BU M6AUH M6AU M6BDU M7BUH M7BUH M6BXCT:R",
  "AM80MA AM80MB AM80MC:R AM80MC AM80MB AM80MA:R",
  "AM80MA AM80MB AM80MC:R AM80MA AM80MB AM80MC:R AM80MA AM80MB AM80MC:R",
  "AM80MC AM80MB AM80MA:R",
  "M6BXCT M7BUH M7BUH M6BDU M6AU M6AUH M6BU M6BU:R HLE18:R",
  "AM08PA AM08PB AM08PC:R AM08PA AM08PB AM08PC:R",
  "AM08PC AM08PB AM08PA:R AM08MA AM08MB AM08MC:R",
  "AM08MA AM08MB AM08MC:R AM08PA AM08PB AM08PC:R",
  "AM08MC AM08MB AM08MA:R AM08PA AM08PB AM08PC:R",
  "AM08PC AM08PB AM08PA:R AM08MC AM08MB AM08MA:R",
  "AM75A AM75B AM75C AM75D:R AM75D AM75C AM75B AM75A:R",
  "AM75A AM75B AM75C AM75D:R AM75A AM75B AM75C AM75D:R",
  "AM80MA AM80MB AM80MC:R AM80MA AM80MB AM80MC:R",
  "AM96MC AM96MB AM96MA:R AM96MC AM96MB AM96MA:R",
  "AM08MA AM08MB AM08MC:R AM08MA AM08MB AM08MC:R",
  "M6BXAA M6BYU M6BU M6BU M6AYU M6BDYU M6BU M6BYU:R HLE19:R",
  "HLE18 M6BYU M6BU M6BDU M6AYU M6BYU M6BU M6BU M6BXCT:R",
  "M6BXAA M6BYU M6BYU M6BU M6BDU M6AU M6BU M6BYU:R HLE19:R",
  "AM08PC AM08PB AM08PA:R AM08PC AM08PB AM08PA:R AM08PC AM08PB AM08PA:R",
  "AM08MC AM08MB AM08MA:R AM08MC AM08MB AM08MA:R",
  "HLE19 M6BYU M6BU M6BDYU M6AYU M6BU M6BU M6BYU M6BXAA:R",
  "M6BXCT M6BU M6BU M6BYU M6AYU M6BDU M6BU M6BYU:R HLE18:R",
  "HLE19 M6BYU M6BU M6AU M6BDU M6BU M6BYU M6BYU M6BXAA:R",
  "M6BXAA M6BDU M6AU M6BU M6BU M6BU M6BU:R HLE18:R",
  "HLE18 M6BU M6BU M6BU M6BDU M6AU M6BU M6BU M6BXCT:R",
  "HLE18 M6BU M6BU M6BU M6BU M6AU M6BDU M6BXAA:R",
  "AM86B AM86A:R",
  "AM86B AM86A:R AM86A AM86B:R",
  "AM08MC AM08MB AM08MA:R AM08MA AM08MB AM08MC:R",
  "AM96PC AM96PB AM96PA:R AM96PA AM96PB AM96PC:R",
  "AM80MA AM80MB AM80MC:R AM80MC AM80MB AM80MA:R AM80MC AM80MB AM80MA:R",
  "AM96MA AM96MB AM96MC:R AM96MA AM96MB AM96MC:R",
  "AM80MA AM80MB AM80MC:R AM80MA AM80MB AM80MC:R AM80MC AM80MB AM80MA:R",
  "M6BU M6BU M6BYU M6BDU M6AU M6BU M6BU M6BXAA:R HLE18:R",
  "HLE19 M6BU M6BU M6BDU M6AU M6BU M6BU M6BU M6BXAA:R",
  "M6BXCT M6BU M6BDU M6BDU M6AU M6BU M6BU:R HLE18:R",
  "AM96MC AM96MB AM96MA:R AM96MA AM96MB AM96MC:R",
  "AM96MA AM96MB AM96MC:R AM96MC AM96MB AM96MA:R",
  "AR41B AR41A:R AR41B AR41A:R",
  "AR41A AR41B:R AR41A AR41B:R",
  "AM75D AM75C AM75B AM75A:R AM75A AM75B AM75C AM75D:R",
  "M7BDXH M7ABUH M7BUH M7ABUH M7BUH:R HLE13:R",
  "AM80MA AM80MB AM80MC:R",
  "I11BDXH I11BUH I11AUH I11AUH:R HLE18:R",
  "HLE18 I11AUH I11AUH I11BUH I11BDXH:R",
  "HLE18 I10BUH M7BUH M7BUH M7ABUH M7ABUH M7BDH M7ABUH M7BUH M7BUH:R HLE18:R",
  "HLE18 I10BUH M7BUH M7BUH M7ABUH M7BDH M7ABUH M7ABUH M7BUH M7BUH:R HLE18:R",
  "AM08PA AM08PB AM08PC:R AM08PC AM08PB AM08PA:R",
  "HLE13 M7BUH M7ABUH M7ABUH M7BUH M7BDXH:R",
  "? ? ? ? ? ? ? ?:R",
];
const SAMPLED = Object.fromEntries((
  "504:81,527:82,554:3,573:0,656:0,677:3,705:65,727:6,757:19,778:19,807:39,827:78,855:39,876:78,1455:3,1464:3,1472:8,1505:9,1509:10,1513:11,1517:10," +
  "1521:11,1526:12,1527:13,1531:11,1535:14,1539:11,1543:14,1757:5,1779:0,1806:16,1826:17,1857:18,1876:19,1903:20,1907:21,1911:22,1915:23,1919:24,1922:25," +
  "1927:26,1931:25,1935:27,1939:26,1943:28,1950:5,1977:0,2056:3,2075:0,2106:29,2110:4,2114:29,2118:4,2122:3,2126:15,2128:30,2132:31,2136:30,2140:31," +
  "2144:5,2156:3,2177:3,2204:9,2208:9,2212:9,2216:11,2220:9,2227:32,2229:33,2233:9,2237:34,2241:11,2256:3,2276:3,2302:35,2306:36,2310:37,2314:33,2318:11," +
  "2321:11,2328:38,2332:35,2336:39,2340:40,2344:33,2356:0,2377:3,2505:41,2509:42,2513:43,2517:41,2521:42,2526:44,2528:15,2532:44,2536:45,2540:15,2555:46," +
  "2572:47,2604:9,2626:48,2757:3,2777:3,2855:48,2859:48,2863:48,2867:48,2871:48,2877:49,2879:9,2883:9,2887:9,2891:9,2956:3,2976:0,3056:50,3072:3,3105:51," +
  "3109:52,3113:50,3117:53,3121:54,3126:55,3128:56,3132:57,3136:55,3140:58,3144:54,3206:0,3225:3,3305:59,3309:59,3313:59,3317:59,3321:59,3327:60,3329:61," +
  "3333:61,3337:61,3341:61,3357:62,3379:63,3405:64,3427:55,3604:65,3608:49,3612:49,3616:66,3620:38,3628:49,3631:65,3635:67,3639:67,3643:68,3656:3,3678:0," +
  "3704:69,3708:25,3712:27,3716:26,3720:28,3726:70,3727:28,3731:71,3735:69,3739:25,3743:27,3755:0,3773:3,3804:72,3805:73,3809:72,3813:72,3817:73,3821:72," +
  "3827:73,3830:72,3834:72,3838:73,3842:72,3857:3,3873:0,3908:74,3927:75,4003:0,4022:5,4107:3,4127:3,4206:76,4228:76,4257:3,4278:3,4306:37,4325:37,4358:3," +
  "4376:3,4406:37,4409:33,4412:9,4415:54,4418:9,4429:39,4432:39,4435:39,4438:5,4441:39,4555:41,4576:0,4603:77,4657:3,4677:0,4856:3,4877:3,4906:37,4926:37," +
  "4956:4,4960:5,4964:5,4968:5,4977:39,4981:39,4985:78,4989:78,5005:79,5025:80,5156:3,5160:0,5164:0,5168:0,5177:78,5181:78,5185:78,5189:78,5306:4,5327:5," +
  "5356:78,5360:78,5364:78,5368:39,5372:39,5373:78,5378:39,5382:39,5386:78,5390:39,5457:78,5477:78,5557:5,5579:4,5656:0,5673:3,5705:0,5725:3,5756:5," +
  "5777:4,5857:83,5877:5,5943:84,5971:5,6055:4,6077:5,6156:83,6172:4,6256:5,6277:4,6357:0,6373:0,6555:3,6577:3,6857:78,6877:39,9211:85,9243:85,13000:0," +
  "13035:1,13039:2,13043:2,13047:2,13051:2,13053:2,13055:2,13059:2,13063:2,13067:2,13074:0,13081:0,13088:3,13095:3,13100:0,13104:0,13110:3,13127:0," +
  "13202:4,13220:5,13750:2,13770:1,13806:6,13823:7,18021:15,18024:15,19702:1,19907:1,19943:1"
).split(",").map((x) => x.split(":").map(Number)));
const set = (label, ...units) => ({ label, units });
const one1 = (...keys) => keys.map((k) => [k, 1]);
// A sampled formation's cars ("AM08PC AM08PB AM08PA:R"), turned end for end
// for a train the other way.
function sampledUnits(code, reverse) {
  let cars = code.split(" ").map((tok) => { const [model, s] = tok.split(":"); return { model, side: s === "R" ? "RIGHT" : "LEFT" }; });
  if (reverse) cars = cars.reverse().map((c) => ({ ...c, side: c.side === "RIGHT" ? "LEFT" : "RIGHT" }));
  const keys = cars.map((_, i) => vehicleKey(cars, i));
  return keys.some((k) => !k || !TYPES[k]) ? null : keys.map((k) => [k, 1]);
}
// What a formation is, in words.
const FAMILY = [[/^am08/, "Desiro (AM08)", 3], [/^am96/, "AM96", 3], [/^am80/, "AM80 \"Break\"", 3], [/^am75/, "AM75", 4], [/^am86/, "AM86", 2], [/^ar41/, "AR41 diesel", 2],
  [/^icng/, "ICNG (NS)", 8]];
const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const word = (n) => WORDS[n] || String(n);
function describe(units) {
  const keys = units.flatMap(([k, n]) => Array(n).fill(k));
  for (const [re, name, size] of FAMILY) if (keys.every((k) => re.test(k))) {
    const u = Math.max(1, Math.round(keys.length / size));
    return `${name}: ${u === 1 ? "one unit" : `${word(u)} units coupled`}, ${word(keys.length)} cars`;
  }
  const isLoco = (k) => /^hle/.test(k), locos = keys.filter(isLoco), cls = [...new Set(locos.map((k) => `HLE ${k.slice(3)}`))].join(" and ");
  const bmx = keys.some((k) => /^m7Bmx/.test(k)), cab = keys.some((k) => /^(m6Bx|m7BDx|m7BVx|i11BDx)/.test(k));
  const fam = (re) => keys.some((k) => !/^m7Bmx/.test(k) && re.test(k));
  const dd = [fam(/^m7/) && "M7", fam(/^m6/) && "M6"].filter(Boolean);
  const coaches = [dd.length && `${dd.join(" and ")} double-deck coaches`, fam(/^i11/) && "I11 coaches", fam(/^i10/) && "an I10 bicycle car"].filter(Boolean);
  const head = bmx ? "An M7 motor car (Bmx)" : locos.length >= 2 && isLoco(keys[0]) && isLoco(keys.at(-1)) ? `${cls} locomotives at both ends`
    : locos.length >= 2 ? `${word(locos.length)} ${cls} locomotives` : locos.length ? `An ${cls} locomotive` : "";
  const list = coaches.join(", ").replace(/, ([^,]*)$/, " and $1");
  const s = `${head}${head ? " with " : ""}${list}${cab ? " and a driving trailer" : ""}`;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
const fromSample = (code, reverse) => { const u = sampledUnits(code, reverse); return u ? set(describe(u), ...u) : null; };
// Each kind as a typical set, for a series no sampled train covers and for
// a car shown alone (a fleet page's sample).
const U = {
  am08: one1("am08c", "am08b", "am08aR"), am96: one1("am96c", "am96b", "am96aR"), am80: one1("am80c", "am80b", "am80aR"), am75: one1("am75a", "am75b", "am75c", "am75dR"),
  am86: one1("am86b", "am86aR"), ar41: one1("ar41a", "ar41bR"),
};
const times = (u, k) => Array.from({ length: k }, () => u).flat();
const S = {
  AM08: set("Desiro (AM08): one unit, three cars (often two coupled)", ...U.am08), AM08x2: set("Desiro (AM08): two units coupled, six cars", ...times(U.am08, 2)),
  AM96: set("AM96: two units coupled, six cars", ...times(U.am96, 2)), AM80: set("AM80 \"Break\": two units coupled, six cars", ...times(U.am80, 2)),
  AM75: set("AM75: two units coupled, eight cars", ...times(U.am75, 2)), AM86: set("AM86: two units coupled, four cars", ...times(U.am86, 2)),
  AR41: set("AR41 diesel: one unit, two cars (some trains two)", ...U.ar41),
  M6PP: set("An HLE 18 locomotive with M6 double-deck coaches and a driving trailer at the other end", ...one1("m6Bx", "m6B", "m6B", "m6A", "m6BD", "m6B", "m6BR", "hle18")),
  M6PP19: set("An HLE 19 locomotive with M6 double-deck coaches and a driving trailer at the other end", ...one1("m6Bx", "m6B", "m6B", "m6A", "m6BD", "m6B", "m6BR", "hle19")),
  M6IC4: set("HLE 18 locomotives at both ends with M6 double-deck coaches (and an I11 first-class coach)",
    ...one1("hle18", "m6B", "m6B", "m6BD", "m6A", "i11A", "m6B", "m6BR", "hle18")),
  M7X: set("An M7 motor car (Bmx) with M7 double-deck coaches and a driving trailer", ...one1("m7Bmx", "m7B", "m7BD", "m7AB", "m7AB", "m7BVxR")),
  M7XD: set("An M7 motor car (Bmx) with M7 double-deck coaches and a driving trailer (BDx)", ...one1("m7Bmx", "m7B", "m7AB", "m7AB", "m7BD", "m7BDxR")),
  M7IC1: set("HLE 18 locomotives at both ends with M7 double-deck coaches and an I10 bicycle car",
    ...one1("hle18", "i10B", "m7B", "m7B", "m7AB", "m7AB", "m7BD", "m7AB", "m7B", "m7BR", "hle18")),
  M7LUX: set("An HLE 13 locomotive with M7 double-deck coaches and a driving trailer", ...one1("hle13", "m7B", "m7AB", "m7B", "m7AB", "m7BDxR")),
  I11: set("An HLE 18 locomotive with I11 coaches and a driving trailer", ...one1("hle18", "i11A", "i11A", "i11B", "i11BDxR")),
  ICNG: set("ICNG (NS, Alstom Coradia Stream): eight cars", ...one1("icngEnd1", "icngMid1", "icngMidP", "icngMid", "icngMid", "icngMidP", "icngMid", "icngEndR")),
  ICE: set("ICE 3neo (DB class 408): eight cars, first class at the Frankfurt end", ...one1("ice3neoEnd1", "ice3neoFirst", "ice3neoBistro", "ice3neoSecond", "ice3neoPan", "ice3neoSecond", "ice3neoSecond", "ice3neoEnd2R")),
  OUIGO: set("OUIGO Train Classique: an SNCB HLE 18 with eight I11 coaches in OUIGO's paint (two OUIGO XL)",
    ...one1("hle18", "i11OuigoA", "i11OuigoA"), ["i11OuigoB", 6]),
  NJ: set("Nightjet (ÖBB's classic cars: a seat car, couchettes, sleeping cars); the locomotive not shown", ["atNjoCoach", 1], ["atNjoCouchette", 2], ["atNjoSleeper", 2]),
};
if (CFL_SETS?.TN3 && CFL_SETS.TN3.units.every(([k]) => TYPES[k])) S.CFL = set("A CFL Coradia Duplex (2200): three double-deck cars (often two coupled)", ...CFL_SETS.TN3.units);
const ICE_BACK = { ...S.ICE, units: [...S.ICE.units].reverse().map(([k, n]) => [/^ice3neoEnd/.test(k) ? (k.endsWith("R") ? k.slice(0, -1) : `${k}R`) : k, n]) };
const SETS_ALL = [S.I11, S.AM08, ...Object.values(S)];
const setOf = (key) => SETS_ALL.find((x) => x.units.some(([k]) => k.replace(/R$/, "") === key.replace(/R$/, ""))) || (TYPES[key] ? set(TYPES[key].name, [key, 1]) : null);
// The series no sample covers (weekday trains), from the trains' own
// photographs (2024-2026) and the lines' stock: IC 4xx Kortrijk-Welkenraedt
// (HLE 18s with M6s and an I11, IC 436 at Bruxelles-Midi 2025), the M7
// motor-car sets on IC 17xx, 24xx and 28xx (Bmx 76006 on IC 1737, 75074
// on IC 2417, 76001 and BDx 75016 on IC Knokke-Liège, 2025), the M6 push-
// pull sets Antwerpen-Charleroi (IC 20xx, 45xx).
const SERIES = { IC: { 4: S.M6IC4, 5: S.M7IC1, 9: S.AM96, 17: S.M7X, 20: S.M6PP, 24: S.M7X, 28: S.M7XD, 29: S.AM80, 30: S.AM96, 45: S.M6PP, 46: S.M7LUX, 51: S.AM96, 124: S.AM96 },
  L: { 47: S.CFL, 50: S.CFL }, S5: { 33: S.AM86, 35: S.AM86 }, S7: { 31: S.AM86, 34: S.AM86 }, S9: { 32: S.AM86 }, S51: { 7: S.AR41 }, S52: { 18: S.AR41 }, S64: { 39: S.AR41 } };
const num = (t) => Number(String(t.number || "").replace(/\D/g, "")) || 0;
// The sampled train nearest t's number in its hundred: the same parity
// (the same direction) if any, else the other way, turned round.
function nearestSample(n) {
  const h = Math.floor(n / 100);
  let best = null;
  for (let k = h * 100; k < h * 100 + 100; k++) {
    if (SAMPLED[k] == null) continue;
    const same = (k - n) % 2 === 0, score = Math.abs(k - n) + (same ? 0 : 1000);
    if (!best || score < best.score) best = { k, score, same };
  }
  return best;
}
export const TYPICAL = {
  sncb: (t, reported) => {
    const r = String(t.route || ""), n = num(t);
    if (reported && (!r || t.fleet || !n)) return setOf(reported);
    if (r === "EC") return S.ICNG;
    if (SAMPLED[n] != null) return fromSample(SAMPLED_FORMS[SAMPLED[n]], false) || null;
    const fixed = SERIES[r]?.[Math.floor(n / 100)];
    if (fixed) return fixed;
    const near = nearestSample(n);
    if (near) return fromSample(SAMPLED_FORMS[SAMPLED[near.k]], !near.same);
    if (reported) return setOf(reported);
    if (/^S(5|7|9)$/.test(r)) return S.AM86;
    if (/^S(51|52|64)$/.test(r)) return S.AR41;
    if (r === "P" || r === "EXT" || r === "T") return S.AM08x2;
    return S.AM08;
  },
  beintl: (t, reported) => {
    const r = String(t.route || "");
    if (reported && (!r || t.fleet)) return setOf(reported);
    if (r === "ICE") return /Bruxelles|Brussel/.test(t.destination || "") ? ICE_BACK : S.ICE;
    if (r === "OTC") return S.OUIGO;
    if (r === "NJ" || r === "EN") return S.NJ;
    return reported ? setOf(reported) : null;
  },
};
// Every set, for the fleet page.
export const SAMPLE_SETS = S;

// ---------- Fleets ----------
// [first, last, type] over the number iRail gives each vehicle (a unit's
// number for every car of a multiple unit; a coach's or locomotive's own),
// from the fleet lists (nl.wikipedia, 2026): the type drawn for a number
// alone, and each type's sample for the fleet page.
export const FLEETS = {
  sncb: [
    [8001, 8210, "am08c"], [8501, 8595, "am08c"], [441, 490, "am96c"], [501, 570, "am96c"], [301, 440, "am80c"], [801, 844, "am75a"], [901, 952, "am86b"],
    [4101, 4196, "ar41a"], [1801, 1896, "hle18"], [1901, 1924, "hle19"], [1301, 1360, "hle13"],
    [72001, 72157, "m7B"], [73001, 73225, "m7AB"], [79001, 79127, "m7BD"], [75001, 75065, "m7BDx"], [75066, 75126, "m7BVx"], [76001, 76112, "m7Bmx"],
    [61001, 61076, "m6A"], [62001, 62276, "m6B"], [69001, 69076, "m6BD"], [65001, 65064, "m6Bx"],
    [11801, 11836, "i11A"], [12801, 12906, "i11B"], [19801, 19821, "i11BDx"], [12701, 12780, "i10B"], [3301, 3320, "icngEnd1"],
  ],
  beintl: [[8001, 8090, "ice3neoEnd1"], [11833, 11836, "i11OuigoA"], [12880, 12906, "i11OuigoB"], [618072900000, 618072909999, "atNjoSleeper"]],
};

// ---------- Fact sheets ----------
const NLWP = "https://nl.wikipedia.org/wiki/";
const kmh = (v) => Math.round(v / 1.609);
const ft = (v) => Math.round(v * FT * 10) / 10;
const M7F = { model: "Alstom M7 double-deck coach", type: "Double-deck coach", builder: "Alstom (Valenciennes, Santa Perpètua)", built: "2020–2026", fleet: "747 cars",
  topSpeedMph: kmh(200), lengthFt: ft(26.8), source: `${NLWP}M7_(spoorwegrijtuig)` };
const M6F = { model: "M6 double-deck coach (renovated)", type: "Double-deck coach", builder: "Alstom and Bombardier", built: "2002–2012, renovated 2022–2029", fleet: "492 cars",
  topSpeedMph: kmh(160), lengthFt: ft(26.8), source: `${NLWP}M6_(spoorwegrijtuig)` };
const I11F = { model: "I11 coach", type: "Passenger coach", builder: "BN (Bombardier), Brugge", built: "1995–1997", fleet: "163 cars", topSpeedMph: kmh(200), lengthFt: ft(26.4),
  source: `${NLWP}I11_(spoorwegrijtuig)` };
const AM08F = { model: "Siemens Desiro ML (AM08)", type: "Electric multiple unit", builder: "Siemens Mobility", built: "2011–2016", fleet: "305 three-car units (08001–08210, 08501–08595)",
  topSpeedMph: kmh(160), source: `${NLWP}MR08` };
const AM96F = { model: "AM96", type: "Electric multiple unit", builder: "BN and ACEC (Bombardier, Alstom)", built: "1996–1999", fleet: "120 three-car units (441–490 two-voltage, 501–570)",
  topSpeedMph: kmh(160), lengthFt: ft(26.4), source: `${NLWP}MS96` };
const AM80F = { model: "AM80 \"Break\"", type: "Electric multiple unit", builder: "La Brugeoise et Nivelles", built: "1981–1985 (three cars since 2017–2021)", fleet: "139 units",
  topSpeedMph: kmh(160), lengthFt: ft(25.0), source: `${NLWP}MS80` };
const AM75F = { model: "AM75", type: "Electric multiple unit", builder: "BN (La Brugeoise et Nivelles)", built: "1975–1979", fleet: "44 four-car units (801–844)", topSpeedMph: kmh(140),
  lengthFt: ft(25.0), source: "https://commons.wikimedia.org/wiki/Category:SNCB_Class_AM75" };
const AM86F = { model: "AM86", type: "Electric multiple unit", builder: "BN and ACEC", built: "1986–1988", fleet: "52 two-car units (51 in service; to go by 2033)", topSpeedMph: kmh(120),
  lengthFt: ft(26.4), source: `${NLWP}MS86` };
const AR41F = { model: "Alstom/Fiat AR41 (MW41)", type: "Diesel multiple unit", builder: "Alstom and Fiat Ferroviaria", built: "2000–2003", fleet: "96 two-car units (4101–4196)",
  topSpeedMph: kmh(120), lengthFt: ft(24.8), source: `${NLWP}MW41` };
const ICEF = { model: "Siemens Velaro MS (DB class 408, ICE 3neo)", type: "High-speed electric multiple unit", builder: "Siemens Mobility", built: "2022 on", fleet: "90 eight-car sets ordered",
  topSpeedMph: kmh(320), source: "https://de.wikipedia.org/wiki/DB-Baureihe_408" };
const ICNGF = { model: "Alstom Coradia Stream (NS ICNG-B)", type: "Electric multiple unit", builder: "Alstom", built: "2021–2025", topSpeedMph: kmh(200),
  source: "https://nl.wikipedia.org/wiki/Intercity_Nieuwe_Generatie" };
export const FACTS = {
  m7B: { ...M7F, about: "A second-class M7 coach (B), 140 seats. M7s run SNCB's busiest InterCity lines, pushed and pulled by HLE 18s and 13s or by their own motor cars." },
  m7AB: { ...M7F, about: "An M7 coach with first class upstairs (58 seats; 74 second-class below), marked by the yellow line under the upper windows." },
  m7BD: { ...M7F, about: "The multi-purpose M7 (BD, in service since 2025): a step-free door into the lower deck, room for bicycles and wheelchairs." },
  m7BDx: { ...M7F, about: "An M7 driving trailer (BDx 75001–75065), its multi-purpose room behind the cab." },
  m7BVx: { ...M7F, about: "An M7 driving trailer (BVx, 75066 on), with 16 bicycle places." },
  m7Bmx: { ...M7F, type: "Double-deck motor car", lengthFt: ft(24.19), about: "The M7's motor car (Bmx 76001 on): a cab, the traction gear, and 52 seats. It hauls and pushes its set alone, or with an HLE 18 at the other end." },
  m6A: { ...M6F, about: "A first-class M6 (A, 124 seats), in the M7's paint since its renovation." },
  m6B: { ...M6F, about: "A second-class M6 (B, 140 seats)." },
  m6BD: { ...M6F, about: "The M6's multi-purpose car (BD): bicycles and wheelchairs on the lower deck, by its step-free door." },
  m6Bx: { ...M6F, about: "The M6's driving trailer (Bx, 65001–65064), at the other end of its set from the locomotive." },
  i11A: { ...I11F, about: "A first-class I11 (A), on the S41 to Aachen and the IC 4xx." },
  i11B: { ...I11F, about: "A second-class I11 (B)." },
  i11BDx: { ...I11F, about: "The I11's driving trailer (BDx, 19801–19821), with the luggage room behind the cab." },
  i10B: { model: "I10 coach", type: "Passenger coach", builder: "BN", built: "1987–1989", topSpeedMph: kmh(160), lengthFt: ft(26.4), source: `${NLWP}I10_(spoorwegrijtuig)`,
    about: "An I10 with bicycle places, still running on IC 01 Oostende–Eupen in 2026 (some others went to GoVolta)." },
  i11OuigoA: { ...I11F, about: "An I11 leased to SNCF for OUIGO Train Classique Paris–Brussels (since December 2024): OUIGO XL, first class." },
  i11OuigoB: { ...I11F, about: "An I11 in OUIGO's paint, on OUIGO Train Classique Paris–Brussels." },
  hle18: { model: "Siemens Eurosprinter ES60U3 (HLE 18)", type: "Electric locomotive", builder: "Siemens Mobility", built: "2009–2012", fleet: "96 (1801–1896)", topSpeedMph: kmh(200),
    powerHp: 8000, lengthFt: ft(19.58), source: `${NLWP}HLE_18_en_19`, about: "SNCB's main passenger locomotive: M6, M7 and I11 trains, push-pull with their driving trailers." },
  hle19: { model: "Siemens Eurosprinter ES60U3 (HLE 19)", type: "Electric locomotive", builder: "Siemens Mobility", built: "2012", fleet: "24 (1901–1924)", topSpeedMph: kmh(200),
    lengthFt: ft(19.58), source: `${NLWP}HLE_18_en_19`, about: "The HLE 18 with an automatic coupler at one end, for M6 sets." },
  hle13: { model: "Alstom HLE 13", type: "Electric locomotive", builder: "Alstom and ACEC", built: "1997–2001", fleet: "60 (1301–1360)", topSpeedMph: kmh(200), lengthFt: ft(19.11),
    source: `${NLWP}HLE_13`, about: "Two-voltage (3 kV and 25 kV): it hauls the M7 trains Brussels–Namur–Luxembourg." },
  am08a: { ...AM08F, lengthFt: ft(27.2), about: "A Desiro's end car (a), first class (16 seats) behind the cab. The AM08s run most of SNCB's S and L trains and many ICs." },
  am08c: { ...AM08F, lengthFt: ft(27.2), about: "A Desiro's end car (c), first class behind the cab and the bicycle places." },
  am08b: { ...AM08F, lengthFt: ft(25.5), about: "The Desiro's middle car, with the pantograph." },
  am96a: { ...AM96F, about: "An AM96 end car (a), second class; the gangway in its front lets two units be walked through." },
  am96c: { ...AM96F, about: "An AM96 end car (c), first class, with the bicycle room." },
  am96b: { ...AM96F, about: "The AM96's middle car, with the pantograph." },
  am80a: { ...AM80F, about: "An AM80 \"Break\" end car (a), second class." },
  am80c: { ...AM80F, about: "An AM80 \"Break\" end car (c), with first class (32 seats) between its doors." },
  am80b: { ...AM80F, about: "The middle car added to the Breaks in 2017–2021, with the bicycle places." },
  am75a: { ...AM75F, about: "An AM75 end car (a), first class; the AM75s run the S32 Antwerpen–Roosendaal and IC Antwerpen–Turnhout in 2026." },
  am75d: { ...AM75F, about: "An AM75 end car (d)." },
  am75b: { ...AM75F, about: "An AM75 middle car (b), with the pantograph." },
  am75c: { ...AM75F, about: "An AM75 middle car (c), with the bicycle places." },
  am86a: { ...AM86F, about: "An AM86 car with first class (24 seats); the AM86s run Brussels' S5, S7 and S9 (not in summer: no air conditioning)." },
  am86b: { ...AM86F, about: "An AM86 car, with the pantograph." },
  ar41a: { ...AR41F, about: "An AR41 car with first class (12 seats): SNCB's last diesels, on the lines round Ghent (S51, S52) and Charleroi–Couvin (S64)." },
  ar41b: { ...AR41F, about: "An AR41 car, second class." },
  ice3neoEnd1: { ...ICEF, lengthFt: ft(25.68), about: "The first-class end car of DB's ICE 3neo, on the ICE Frankfurt–Köln–Liège–Brussels since 2024." },
  ice3neoEnd2: { ...ICEF, lengthFt: ft(25.68), about: "The second-class end car of the ICE 3neo." },
  ice3neoFirst: { ...ICEF, lengthFt: ft(24.78), about: "A first-class car of the ICE 3neo." },
  ice3neoBistro: { ...ICEF, lengthFt: ft(24.78), about: "The ICE 3neo's car with the bistro." },
  ice3neoSecond: { ...ICEF, lengthFt: ft(24.78), about: "A second-class car of the ICE 3neo." },
  ice3neoPan: { ...ICEF, lengthFt: ft(24.78), about: "A second-class car with one of the train's pantographs." },
  icngEnd: { ...ICNGF, lengthFt: ft(27.4), about: "An end car of NS's ICNG, on the EuroCity Brussels–Antwerpen–Rotterdam (SNCB and NS) since 2025." },
  icngEnd1: { ...ICNGF, lengthFt: ft(27.4), about: "An ICNG end car with first class." },
  icngMid: { ...ICNGF, lengthFt: ft(24.2), about: "A middle car of the ICNG." },
  icngMidP: { ...ICNGF, lengthFt: ft(24.2), about: "A middle car of the ICNG, with a pantograph." },
  icngMid1: { ...ICNGF, lengthFt: ft(24.2), about: "A first-class middle car of the ICNG." },
};
for (const k of Object.keys(FACTS)) if (TYPES[`${k}R`]) FACTS[`${k}R`] = FACTS[k];
