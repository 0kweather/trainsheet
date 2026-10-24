// Switzerland's other standard-gauge railways' cars (scripts/railroads/
// switzerland.py): BLS, the Südostbahn (SOB), Thurbo, RegionAlps, TPF and
// the smaller ones (chstdother: SZU, OeBB, transN, Travys). Trainsheet's own
// side views from published dimensions, the railways' type drawings (BLS's
// "Typenskizzen", 2024-2026) and photographs (Wikimedia Commons and the
// railways' own, 2023-2026), at the shared scale (js/carart.js), each in the
// paint the trains carry now; the lettering and marks are drawn here (no
// logo files).
//
// Formations (the Train Formation Service, a train a viewer opens) name
// each vehicle by its European Vehicle Number (12 digits, "94 85 K SSS NNN
// C": 94 a multiple unit, 85 Switzerland, K the car's place in its unit,
// SSS the series, NNN the unit, C the check digit). Units registered car by
// car (K = 1, 2 the end cars, 3-9 the cars between, as SBB numbers its own)
// map car by car; a unit registered as one vehicle (K = 0, or 7 as BLS and
// SOB letter theirs: "94 85 7 528 101") maps to the whole unit, drawn as
// one long figure. FLEETS below covers every series in every K.

import { C, rect, circle, path, line, lines, poly, truck, pantograph, slats, win, coupledEnd } from "../carart.js?v=dev";
import { newId } from "../carmodels.js?v=dev";
import { mark } from "./czechia.cars.js?v=dev";
import { hvac, roofCover, lamp, RED_LAMP, wiper, panGear } from "./digitraffic.cars.js?v=dev";
import { TYPES as NG_TYPES, MODELS as NG_MODELS, GPX_BLS, GPX_BLS_TOWARD_ZWEISIMMEN } from "./chnarrow.cars.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
const STROKE = 'stroke-linejoin="round" stroke-linecap="round"';
// A polyline as a stroke of width w (feet, scaling with the drawing).
const stroke = (pts, color, w) => `<path d="${pts.map(([x, y], i) => `${i ? "L" : "M"}${n(x)} ${n(y)}`).join("")}" fill="none" stroke="${color}" stroke-width="${w}" ${STROKE}/>`;
const clip = (d, inner) => {
  const id = newId();
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`;
};
// A vertical gradient (y up, feet) as a fill: stops [[y, color], ...].
function vgrad(y0, y1, stops) {
  const id = newId();
  return [`<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${n(y0)}" x2="0" y2="${n(y1)}">` +
    stops.map(([o, col]) => `<stop offset="${o}" stop-color="${col}"/>`).join("") + `</linearGradient></defs>`, `url(#${id})`];
}
// Text in a mark() group (y down, centered at its origin).
const txt = (x, y, h, text, fill, { weight = 700, family = SANS, anchor = "middle", spacing = 0, style = "" } = {}) =>
  `<text x="${n(x)}" y="${n(y + h * 0.36)}" font-size="${n(h)}" text-anchor="${anchor}" font-weight="${weight}" letter-spacing="${spacing}" font-family="${family}" fill="${fill}"${style ? ` font-style="${style}"` : ""}>${text}</text>`;
const letters = (c, x, y, h, text, fill, o) => mark(c, x, y, txt(0, 0, h, text, fill, o));

// ---------- A section of a multiple unit ----------
// o: roof, outline (points, y up, bottom-left first, poly() style), base
// (the body color), paint(c, L) (clipped to the body), wins ([x0, x1, y0,
// y1, r]), doors ([{ x, w, y0, y1, fill, leaf }]: drawn by o.door), trucks
// ([x, wb, d(in), kind]), under(c, L) (equipment under the floor, behind
// the body), extra(c, L) (on top: roof equipment, lettering, the cab's
// details), gangway [floor, top] for the bellows at a coupled end.
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
// A section's outline: a box from x0 to x1, its underside at low (or the
// steps given), its roof at roof with rounded corners. nose: a cab's points
// from the roof down to the bottom (drawn at the left).
function box(L, { roof, low, r = 0.5, nose = null, bottom = null, x0 = 0.3, x1 = L - 0.3, wells = [] }) {
  const pts = [nose ? nose[nose.length - 1] : [x0, low]];
  if (bottom) pts.push(...bottom);
  // Wells let into the roof (a pantograph's, the roof gear's): [a, b, y].
  const ws = [...wells].sort((p, q) => q[0] - p[0]);
  const right = ws.find(([, b]) => b >= x1 - 0.01), left = ws.find(([a]) => a <= x0 + 0.01);
  if (right) pts.push([x1, low], [x1, right[2]], [right[0] + 0.4, right[2]], ["q", right[0], right[2], right[0], right[2] + 0.4], [right[0], roof]);
  else pts.push([x1, low], [x1, roof - r], ["q", x1, roof, x1 - r, roof]);
  for (const [a, b, y] of ws) if (a > x0 + 0.01 && b < x1 - 0.01) pts.push([b, roof], [b, y + 0.4], ["q", b, y, b - 0.4, y], [a + 0.4, y], ["q", a, y, a, y + 0.4], [a, roof]);
  if (nose) pts.push(...nose.slice(0, -1));
  else if (left) pts.push([left[1], roof], [left[1], left[2] + 0.4], ["q", left[1], left[2], left[1] - 0.4, left[2]], [x0, left[2]]);
  else pts.push([x0 + r, roof], ["q", x0, roof, x0, roof - r]);
  return pts;
}
// The automatic coupler and the obstacle deflector under a nose at the left.
function coupler(c, { x = 1.0, y = 3.35, foot = 1.4, defl = [1.2, 8.6, 2.0], color = "#2a2d31" } = {}) {
  let s = "";
  if (defl) s += path(poly([[defl[0] + 3.4, defl[2]], [defl[1], defl[2]], [defl[1] + 0.3, 0.85], [defl[0] + 4.6, 0.75]]), color);
  s += rect(0.3, y - 0.3, x + 0.4, 0.6, "currentColor", 0, 'opacity="0.9"') + rect(0, y - 0.7, 0.5, 1.4, "currentColor", 0, 'rx="0.15"') +
    rect(0.12, y + 0.75, 0.45, 0.35, C.steelDark, 0.3);
  return s;
}

// ===================== BLS =====================
// BLS's paint since the MIKA (2021; the NINAs after their refit, 2015-2019,
// and the Lötschbergers being refitted, 2024-2027, carry it too): silver
// shaded darker toward the sill, a dark skirt; the roof gray, a lime line
// along its edge; the windows in one black band, lime doors; "bls" in BLS
// blue with its emblem; a yellow line over the band along first class.
// Colors from BLS's type drawings and photographs.
const BLS = { silver: "#d1d4d6", silverLow: "#a3a8ad", skirt: "#5b6169", roof: "#8c8f95", lime: "#b4d233", band: "#0d1318", blue: "#0070b6", yellow: "#ffc711", rail: "#7a7f86" };
// BLS's mark: the emblem (a winged wheel: a crossbar over a cup holding a
// ring) and "bls" in heavy lowercase; x the emblem's left edge, y the
// letters' middle, h the letters' height (b's ascender).
export function blsLogo(c, x, y, h, fill = BLS.blue, gap = BLS.silver) {
  const k = h / 1.15;
  const e = `<path d="M0 ${n(-0.42 * k)}L${n(1.53 * k)} ${n(-0.42 * k)}L${n(1.33 * k)} ${n(-0.14 * k)}L${n(1.36 * k)} ${n(-0.14 * k)}L${n(1.36 * k)} ${n(0.2 * k)}` +
    `A${n(0.58 * k)} ${n(0.58 * k)} 0 0 1 ${n(0.2 * k)} ${n(0.2 * k)}L${n(0.2 * k)} ${n(-0.14 * k)}L${n(0.23 * k)} ${n(-0.14 * k)}Z" fill="${fill}"/>` +
    `<circle cx="${n(0.78 * k)}" cy="${n(0.12 * k)}" r="${n(0.3 * k)}" fill="none" stroke="${gap}" stroke-width="${n(0.075 * k)}"/>` +
    `<circle cx="${n(0.78 * k)}" cy="${n(0.12 * k)}" r="${n(0.12 * k)}" fill="${gap}"/>`;
  return mark(c, x, y, e + txt(1.72 * k, 0.04 * k, 1.5 * k, "bls", fill, { anchor: "start", weight: 700, family: "Avenir Next, Futura, Helvetica Neue, Arial, sans-serif", spacing: "-0.02em" }));
}
// The class's numeral in the window band, white, with the pictograms under
// it (a yellow one and a white one).
const blsClass = (c, x, k, y = 8.15) => letters(c, x, y, 0.78, k, "#ffffff", { weight: 500 }) +
  rect(x - 0.42, y - 1.05, 0.32, 0.32, BLS.yellow, 0, 'rx="0.05"') + rect(x + 0.08, y - 1.05, 0.32, 0.32, "#e8eaec", 0, 'rx="0.05"');
// A double plug door, lime, its two leaves' windows tall and narrow; set
// in a black surround that drops from the window band to the floor.
function blsDoor(c, { x, w = 5.15, y0 = 1.8, y1 = 9.55, fill = BLS.lime, pict = null }) {
  const m = x + w / 2;
  let s = rect(x, y0, w, y1 - y0, fill, 0.5, 'rx="0.25"') + line(m, y0 + 0.1, m, y1 - 0.1, "#1d2328", 0.9);
  for (const a of [x + 0.62, m + 0.4]) s += rect(a, 4.55, 1.3, 4.05, "#141b20", 0, 'rx="0.45"') + rect(a + 0.15, 4.75, 1.0, 3.65, C.glass, 0, 'rx="0.35"') + rect(a + 0.22, 6.9, 0.86, 1.3, C.glassLight, 0, 'rx="0.25"');
  if (pict) s += letters(c, m + 1.05, 7.7, 0.55, pict, "#ffffff", { weight: 700 });
  return s;
}
// The black surround under a door (from the band down to the floor) and
// the door's rail over it.
const blsDoorWell = (x, w = 5.15) => path(poly([[x - 0.65, 0.9], [x + w + 0.65, 0.9], [x + w + 0.65, 4.0], ["q", x + w + 0.65, 4.45, x + w + 1.1, 4.45], [x - 1.1, 4.45], ["q", x - 0.65, 4.45, x - 0.65, 4.0]]), BLS.band);
const blsRail = (x, w = 5.15) => rect(x - 2.85, 10.15, w + 5.7, 0.22, BLS.rail, 0.3, 'rx="0.11"');
// The common paint: [defs, fill] for the silver's shading, the roof, the
// lime line, the skirt.
function blsSide(L, { roof = 13.3, eave = 11.25, low = 1.4 } = {}) {
  const [defs, fill] = vgrad(low, eave, [[0, "#9a9fa4"], [0.12, "#a7acb1"], [0.45, "#c6c9cc"], [0.8, BLS.silver], [0.93, "#e9eaeb"], [1, "#f2f2f2"]]);
  return defs + rect(-1, -1, L + 2, eave + 1, fill) + rect(-1, low - 1, L + 2, 1.65 + 0.3, BLS.skirt) + rect(-1, eave, L + 2, roof - eave + 2, BLS.roof) +
    rect(-1, eave - 0.4, L + 2, 0.4, BLS.lime);
}

// ---------- MIKA (RABe 528) ----------
// Stadler's FLIRT for BLS (2021-2025; 30 RE units 528 101-130 and 28 S-Bahn
// units 528 201-228; seven more RE units, 131-137, from 2025): six cars on
// seven trucks, 104.9 m, 4.26 m tall, low floor (600 mm) but over the motor
// trucks under the cabs; the end cars 21.2 m, the four between 15.6 m.
// From BLS's type drawings ("MIKA RE", "MIKA S-Bahn") and photographs
// (Kandersteg, Domodossola, St. German, 2022-2026): RE units a door a side
// on each car, first class in the second half of car 3 and all of car 4,
// the bistro corner in car 5; S-Bahn units two doors a car, first class
// either side of the joint between cars 3 and 4, the S-Bahn Bern "S" (a
// yellow S on blue) at each end car's inner end. One pantograph, on car 3
// at its end by car 4.
const MK = { roof: 13.3, low: 1.4, cab: 69.6, mid: 51.25, top: 8.92, foot: 4.42 };
const MK_NOSE = [[10.3, 13.3], [9.0, 13.0], [8.1, 12.5], [7.2, 12.0], [6.1, 11.0], [5.0, 10.0], [4.2, 9.3], [3.5, 8.6], [2.7, 7.8], [2.0, 7.0], [1.5, 6.0], [1.15, 5.0],
  [1.0, 4.3], [1.0, 2.6], [1.4, 2.0]];
// The cab car's underside: low at the nose, over the motor truck, then down
// to the low floor.
const MK_CAB_BOTTOM = [[8.6, 2.0], [9.4, 3.05], [23.0, 3.05], ["q", 24.6, 3.05, 25.6, 2.2], [26.4, 1.4]];
// Layouts: windows [x0, x1] (short ones over the raised floor), doors (left
// edges), the class numerals [x, class]; per car.
const MK_LAYOUT = {
  cabRe: { band: [18.0, 66.45], short: [[18.1, 19.6], [21.3, 25.1], [27.2, 31.0]], tall: [[38.8, 43.0], [44.7, 48.9], [50.5, 54.8], [56.3, 60.7], [62.5, 66.4]], doors: [32.45], nums: [[26.2, "2"], [43.9, "2"]] },
  cabS: { band: [17.5, 66.45], short: [[17.7, 19.4], [21.2, 24.9], [27.1, 30.8]], tall: [[38.8, 42.9], [44.7, 48.6], [56.3, 60.6], [62.6, 66.2]], doors: [32.25, 50.15], nums: [[26.0, "2"], [61.6, "2"]], s: true },
  re2: { tall: [[3.3, 6.9], [8.9, 13.0], [14.7, 18.9], [20.7, 24.7], [38.4, 42.4], [44.4, 48.2]], doors: [26.05], nums: [[19.8, "2"], [37.3, "2"]] },
  re3: { tall: [[3.3, 7.0], [8.9, 13.05], [14.7, 18.9], [21.2, 22.8], [31.1, 35.95], [37.6, 42.5], [44.4, 48.2]], doors: [24.6], nums: [[20.1, "2"], [36.7, "1"]], first: [29.75, 48.3] },
  re4: { tall: [[3.2, 6.9], [8.9, 13.8], [21.4, 23.1], [24.7, 29.5], [31.2, 36.0], [37.8, 42.6], [44.4, 48.2]], doors: [14.9], nums: [[7.9, "1"], [23.9, "1"]], first: [3.1, 48.3] },
  re5: { tall: [[3.1, 7.0], [8.9, 13.1], [15.4, 19.6], [37.6, 41.8], [44.4, 48.3]], doors: [21.7], nums: [[14.2, "2"], [43.1, "2"]], bistro: 32.0 },
  s2: { tall: [[3.1, 6.8], [8.8, 12.9], [26.5, 30.6], [38.3, 42.4], [44.4, 48.2]], doors: [14.2, 31.9], nums: [[7.8, "2"], [43.4, "2"]] },
  s3: { tall: [[3.1, 6.8], [8.8, 12.9], [20.6, 24.6], [26.5, 30.6], [38.3, 42.4], [44.4, 48.2]], doors: [14.2, 31.9], nums: [[7.8, "2"], [43.4, "1"]], first: [37.0, 48.3] },
  s4: { tall: [[3.1, 6.8], [8.8, 12.9], [20.6, 24.6], [26.5, 30.6], [38.3, 42.4], [44.4, 48.2]], doors: [14.2, 31.9], nums: [[7.8, "1"], [43.4, "2"]], first: [3.0, 14.2] },
  s5: { tall: [[3.1, 6.8], [8.8, 12.9], [20.6, 24.6], [26.5, 30.6], [38.3, 42.4], [44.4, 48.2]], doors: [14.2, 31.9], nums: [[7.8, "2"], [43.4, "2"]] },
};
// The S-Bahn Bern mark: a yellow S on a blue square.
const sbahnBern = (c, x, y, h) => rect(x, y - h / 2, h * 0.86, h, "#1d5aa8") + letters(c, x + h * 0.43, y, h * 0.86, "S", "#f7c600", { weight: 800, family: "Arial Black, Helvetica Neue, Arial" });
function mikaCar(c, key) {
  const L = c.L, cab = key.startsWith("cab"), lay = MK_LAYOUT[key];
  const band = lay.band || [3.0, L - 3.0];
  const doors = lay.doors.map((x) => ({ x }));
  return sec(c, {
    roof: MK.roof, base: BLS.silver, cab,
    outline: box(L, { roof: MK.roof, low: MK.low, nose: cab ? MK_NOSE : null, bottom: cab ? MK_CAB_BOTTOM : null,
      wells: key === "re3" || key === "s3" ? [[0, 3.9, 11.55], [L - 4.0, L, 11.55]] : [] }),
    trucks: [...(cab ? [[17.8, 8.5, 36, "car"]] : [[0, 8.5, 33]]), [L, 8.5, 33]],
    under: (cc) => (cab ? rect(10.0, 2.2, 3.0, 1.0, "#3a3e44", 0.4) + rect(23.6, 2.0, 1.4, 1.2, "#3a3e44", 0.4) : ""),
    paint: (cc) => {
      let s = blsSide(L);
      // The window band (rounded at its ends), the door surrounds.
      s += rect(band[0], MK.foot, band[1] - band[0], MK.top - MK.foot, BLS.band, 0, 'rx="0.55"');
      for (const d of doors) s += blsDoorWell(d.x);
      if (lay.first) s += rect(lay.first[0], MK.top, lay.first[1] - lay.first[0], 0.26, BLS.yellow);
      if (cab) {
        // The roof's gray over the nose, the lime line down its edge, the
        // windshield, the cab's seams.
        s += path(poly([[11.0, 11.25], [9.8, 11.25], [8.0, 10.85], [6.4, 10.15], [4.9, 9.45], [3.9, 8.75], [2.9, 7.75], [2.0, 6.45], [1.4, 5.1], [0.6, 5.1], [0.6, 14], [11.0, 14]]), BLS.roof);
        s += stroke([[12.0, 11.05], [9.9, 11.05], [8.0, 10.62], [6.4, 9.92], [4.95, 9.2], [3.95, 8.5], [3.0, 7.55], [2.15, 6.35], [1.55, 5.05], [1.3, 4.35]], BLS.lime, 0.42);
        s += path(poly([[3.65, 8.25], [5.0, 9.4], [7.75, 9.95], [7.3, 8.15], [4.5, 7.55], ["q", 3.9, 7.6, 3.65, 8.25]]), "#11171c");
        s += path(poly([[4.4, 8.25], [5.3, 9.0], [7.25, 9.4], [7.0, 8.45], [4.9, 8.0]]), C.glass);
        s += path("M10.2 13.3Q8.1 9.6 7.25 5.6L7.55 2.0", "none", 0, 'stroke="#4a5058" stroke-width="0.09"') + path("M1.05 4.35L7.15 4.6", "none", 0, 'stroke="#6a7077" stroke-width="0.07"');
        // The cab's side window.
        s += rect(9.35, 7.65, 2.1, 2.33, "#11171c", 0, 'rx="0.4"') + rect(9.55, 7.85, 1.7, 1.93, C.glass, 0, 'rx="0.3"') + rect(9.6, 9.0, 1.6, 0.7, C.glassLight, 0, 'rx="0.2"');
        if (lay.s) s += sbahnBern(cc, 66.8, 6.6, 2.2);
      }
      return s;
    },
    wins: [...(lay.short || []).map(([a, b]) => [a, b, 6.0, 8.72, 0.38]), ...lay.tall.map(([a, b]) => [a, b, 4.62, 8.72, 0.45])],
    over: (cc) => lay.nums.map(([x, k]) => blsClass(cc, x, k)).join("") +
      (lay.bistro ? letters(cc, lay.bistro - 1.0, 6.65, 0.62, "Bistro", "#ffffff", { weight: 500 }) + rect(lay.bistro + 0.75, 6.2, 0.12, 0.6, "#ffffff") + path(`M${n(lay.bistro + 0.5)} 7.05Q${n(lay.bistro + 0.81)} 6.75 ${n(lay.bistro + 1.12)} 7.05L${n(lay.bistro + 1.12)} 7.3L${n(lay.bistro + 0.5)} 7.3Z`, "#ffffff") +
        rect(lay.bistro + 1.35, 6.35, 0.55, 0.55, "#ffffff", 0, 'rx="0.12"') + rect(lay.bistro + 0.45, 6.15, 1.6, 0.05, "#ffffff") : "") +
      (!cab && lay.s !== false && key.startsWith("s") ? "" : ""),
    doors, door: (cc, d) => blsDoor(cc, d),
    extra: (cc) => {
      let s = doors.map((d) => blsRail(d.x)).join("");
      // "bls": on the cab behind the cab window; low at each end of the others.
      if (cab) s += blsLogo(cc, 13.35, 5.4, 1.2);
      else s += blsLogo(cc, 3.15, 3.15, 1.2) + blsLogo(cc, L - 7.25, 3.15, 1.2);
      // Roof: the cab's equipment (converter, air conditioning, the brake
      // resistor), an air conditioning unit on each car, the pantograph on
      // car 3 by car 4 and the high-voltage gear on car 3 by car 2.
      if (cab) s += roofCover(25.5, MK.roof, 9.5, 0.55, "#7d8187", 3) + hvac(37.0, MK.roof, 9.0, 0.6, "#8a8e94") + roofCover(48.5, MK.roof, 6.0, 0.35, "#7d8187", 1);
      else s += hvac(L / 2 - 6.0, MK.roof, 10.0, 0.55, "#8a8e94");
      // In the wells: the pantograph (raised) at car 3's end by car 4; its
      // breaker and insulators at the end by car 2.
      if (key === "re3" || key === "s3") s += pantograph(L - 3.0, 11.55, { up: true, facing: -1 }) +
        rect(0.9, 11.55, 0.3, 1.0, "#b9874a", 0.3) + rect(2.0, 11.55, 1.4, 0.85, C.steelDark, 0.3) + line(0.5, 12.25, 3.4, 12.25, "#5a6068", 0.8);
      if (cab) s += coupler(cc) + lamp(1.05, 4.6, 0.32, 0.45) + lamp(1.15, 3.95, 0.25, 0.3, RED_LAMP) + wiper(4.6, 8.15, 6.0, 9.3);
      return s;
    },
    gangway: [1.4, 13.0],
  });
}


// ---------- MUTZ (RABe 515) ----------
// Stadler's KISS double-deck unit for BLS (2012-2014; 515 001-039), four
// cars (100.4 m) for the Bern S-Bahn; eight lengthened to six (515 032-039,
// 150 m, 2021) for the InterRegios Bern-Olten (IR 17) and Bern-Biel (IR
// 65). End cars 25.4 m, the cars between 24.8 m; 4.6 m tall; two trucks a
// car. Each car: the double deck between two doors a side, an intermediate
// level over each truck; the end car's cab as tall as the upper deck. From
// BLS's type drawings and photographs (Thun, Bern, Gümligen, Sargans,
// 2021-2023): silver, the upper deck's windows in a black band on a white
// band shading down, a lime line under the dark gray roof, lime doors,
// "bls" low at each end. First class: the whole upper deck of car 3 (and
// car 4 of the six-car units) and part of its lower deck, a yellow line
// under the upper deck's band and over the lower deck's along it.
const MZ = { roof: 15.0, end: 83.2, mid: 81.45 };
const MZ_NOSE = [[10.4, 15.0], [8.6, 14.75], [7.0, 14.0], [5.4, 12.8], [4.0, 11.4], [2.9, 10.0], [2.0, 8.6], [1.4, 7.4], [1.05, 6.2], [0.95, 4.6], [1.0, 3.0], [1.4, 2.0]];
function mutzPaint(c, L, { cab, first }) {
  const [defs, fill] = vgrad(1.0, 13.4, [[0, "#8f9499"], [0.08, "#a8adb1"], [0.3, "#bec2c5"], [0.75, "#c5c8cb"], [0.78, "#dfe1e2"], [0.97, "#f7f7f7"], [1, "#ffffff"]]);
  const [rd, rf] = vgrad(13.7, 15.0, [[0, "#6d7176"], [1, "#3e4247"]]);
  let s = defs + rd + rect(-1, -1, L + 2, 14.5, fill) + rect(-1, 13.65, L + 2, 2, rf) + rect(-1, 13.35, L + 2, 0.32, BLS.lime) + rect(-1, 0, L + 2, 1.75, BLS.skirt) +
    rect(-1, 10.5, L + 2, 0.14, "#8c9196");
  return s;
}
function mutzCar(c, kind) {
  const L = c.L, cab = kind === "cab";
  const flip = kind === "abR";                  // first class in the lower deck at the right
  // Doors (left edges), the double-deck part between, the bands.
  const doors = cab ? [27.1, 59.0] : [19.0, L - 25.5];
  const dd = cab ? [34.4, 58.2] : [25.9, L - 26.5];
  const upper = cab ? [[29.2, 31.2], [34.5, 38.4], [39.8, 43.8], [44.7, 47.4], [48.4, 52.3], [54.0, 57.9], [60.9, 63.0]]
    : [[20.8, 23.0], [25.9, 30.6], [32.3, 36.8], [38.9, 41.4], [43.2, 47.9], [49.5, 54.5], [57.6, 59.7]];
  const lower = cab ? [[34.6, 38.3], [38.9, 42.6], [43.1, 46.8], [48.4, 52.2], [54.2, 57.9]]
    : [[26.3, 31.0], [32.8, 37.3], [39.4, 43.7], [45.0, 48.6], [50.2, 54.3]];
  const ends = cab ? [[69.0, 72.3]] : [[3.4, 7.6], [7.9, 12.8], [L - 12.8, L - 7.9], [L - 7.6, L - 3.4]];
  const first = kind === "ab" ? [dd[0] + 0.3, dd[0] + 12.6] : flip ? [dd[1] - 12.6, dd[1] - 0.3] : null;
  const nums = cab ? [[36.9, "2"], [53.1, "2"]] : [[31.8, kind === "ab" ? "1" : "2"], [49.4, flip ? "1" : "2"]];
  const bottom = cab ? [[10.4, 2.0], [11.0, 3.1], [22.6, 3.1], ["q", 23.6, 3.1, 24.2, 2.2], [24.9, 1.0], [66.0, 1.0], [66.8, 2.6]]
    : [[14.6, 2.6], [15.6, 1.0], [L - 15.6, 1.0], [L - 14.6, 2.6]];
  // The roof: the end sections lower (13.9) than the double deck (15.0).
  const roofPts = cab ? [[L - 0.3, 2.6], [L - 0.3, 13.4], ["q", L - 0.3, 13.9, L - 0.8, 13.9], [68.4, 13.9], [66.8, 15.0], ...MZ_NOSE]
    : [[L - 0.3, 2.6], [L - 0.3, 13.4], ["q", L - 0.3, 13.9, L - 0.8, 13.9], [L - 14.0, 13.9], [L - 15.6, 15.0], [15.6, 15.0], [14.0, 13.9], [0.8, 13.9], ["q", 0.3, 13.9, 0.3, 13.4], [0.3, 2.6]];
  const outline = cab ? [[1.4, 2.0], ...bottom, ...roofPts.slice(0, -1)] : [[0.3, 2.6], ...bottom, ...roofPts.slice(0, -1)];
  return sec(c, {
    base: "#c2c6c9", cab, truckTop: 2.9,
    outline,
    trucks: cab ? [[16.8, 8.6, 37, "car"], [L - 8.6, 8.6, 37]] : [[9.6, 8.6, 37], [L - 9.6, 8.6, 37]],
    under: () => (cab ? "" : ""),
    paint: (cc) => {
      let s = mutzPaint(cc, L, { cab, first });
      // The upper deck's band and the lower deck's; the end sections'.
      s += rect(dd[0] - 0.1, 10.95, dd[1] - dd[0] + 0.2, 2.35, BLS.band, 0, 'rx="0.4"') + rect(dd[0] - 0.1, 4.2, dd[1] - dd[0] + 0.2, 2.55, BLS.band, 0, 'rx="0.4"');
      for (const [a, b] of ends) s += rect(a - 0.15, 7.0, b - a + 0.3, 2.4, BLS.band, 0, 'rx="0.45"');
      if (first) s += rect(dd[0], 10.72, dd[1] - dd[0], 0.22, BLS.yellow) + rect(first[0], 6.75, first[1] - first[0], 0.22, BLS.yellow);
      if (cab) {
        // The cab: the roof's gray over the nose, the lime line down its
        // edge, the windshield and the side window, the grille.
        s += path(poly([[11.2, 13.65], [9.6, 13.6], [7.6, 13.0], [6.0, 12.0], [4.6, 10.8], [3.5, 9.6], [2.6, 8.3], [1.0, 8.3], [0.6, 16], [11.2, 16]]), "#a4a9ae");
        s += stroke([[12.0, 13.5], [9.7, 13.45], [7.7, 12.8], [6.1, 11.8], [4.7, 10.6], [3.6, 9.4], [2.7, 8.1], [2.05, 6.9], [1.6, 5.6]], BLS.lime, 0.36);
        s += path(poly([[3.2, 8.0], [4.2, 9.6], [5.8, 10.6], [8.4, 10.6], [11.3, 10.3], [11.3, 7.6], [5.0, 7.6], ["q", 3.6, 7.5, 3.2, 8.0]]), "#11171c");
        s += path(poly([[4.0, 8.2], [4.9, 9.5], [6.4, 10.2], [7.6, 10.2], [7.6, 7.95], [4.6, 7.95]]), C.glass) + rect(8.1, 7.95, 2.9, 2.25, C.glass, 0, 'rx="0.3"') + rect(8.2, 9.2, 2.7, 0.8, C.glassLight, 0, 'rx="0.2"');
        s += rect(12.7, 4.8, 3.1, 4.0, "#24292e", 0.4, 'rx="0.35"') + slats(12.9, 4.95, 2.7, 3.7, 0.38, "rgba(255,255,255,0.35)");
        s += rect(17.0, 8.0, 2.0, 0.9, "none", 0, 'rx="0.42" stroke="#22272c" stroke-width="0.14"') + rect(20.3, 7.2, 2.0, 2.1, "#11171c", 0, 'rx="0.3"') + rect(20.45, 7.35, 1.7, 1.8, C.glass, 0, 'rx="0.25"');
        s += rect(L - 5.3, 4.8, 3.1, 4.8, "none", 0, 'rx="0.4" stroke="#22272c" stroke-width="0.12"');
        s += path("M10.3 15.0Q8.5 9.0 7.6 2.1", "none", 0, 'stroke="#4a5058" stroke-width="0.09"');
      }
      return s;
    },
    wins: [...upper.map(([a, b]) => [a, b, 11.15, 13.1, 0.35]), ...lower.map(([a, b]) => [a, b, 4.38, 6.6, 0.35]), ...ends.map(([a, b]) => [a, b, 7.18, 9.25, 0.35])],
    over: (cc) => {
      const k = first ? "1" : "2";
      let s = "";
      for (const d of doors) s += blsDoorWell2(d);
      s += nums.map(([x, k]) => blsClass(cc, x, k, 6.2)).join("");
      return s;
    },
    doors: doors.map((x) => ({ x, w: 6.0, y0: 1.2, y1: 9.15 })), door: (cc, d) => blsDoor(cc, d),
    extra: (cc) => {
      let s = doors.map((x) => rect(x - 2.4, 9.35, 10.8, 0.2, BLS.rail, 0.3, 'rx="0.1"')).join("");
      if (cab) s += blsLogo(cc, 16.8, 4.65, 0.95) + blsLogo(cc, L - 13.5, 4.65, 0.95);
      else s += blsLogo(cc, 9.1, 4.65, 0.95) + blsLogo(cc, L - 14.0, 4.65, 0.95);
      // Roof: the cab car's pantograph over its inner truck; air
      // conditioning on the end sections.
      if (cab) s += pantograph(L - 6.5, 13.9, { up: true, facing: -1 }) + panGear(L - 6.5, 13.9, -1) + roofCover(17.2, 15.0, 4.0, 0.3, "#4c5055", 1) + hvac(60.5, 15.0, 5.5, 0.4, "#6d7176");
      else s += hvac(2.5, 13.9, 9.5, 0.55, "#6d7176") + hvac(L - 12.0, 13.9, 9.5, 0.55, "#6d7176");
      if (cab) s += coupler(cc, { defl: [1.3, 10.4, 2.0] }) + lamp(1.0, 4.4, 0.3, 0.5) + lamp(1.1, 3.6, 0.25, 0.32, RED_LAMP) + wiper(4.6, 8.3, 6.6, 9.9);
      return s;
    },
    gangway: [2.0, 13.4],
  });
}
// The black surround of a MUTZ door, from its foot to the lower band.
const blsDoorWell2 = (x, w = 6.0) => rect(x - 0.35, 0.95, w + 0.7, 8.4, BLS.band, 0, 'rx="0.3"');


// ---------- NINA (RABe 525) and Lötschberger (RABe 535) ----------
// Vevey Technologies' (later Bombardier's) low-floor units on Jakobs
// trucks, a motor truck under each cab: the NINA (2003-2009) three cars,
// 47.74 m (525 001-014, 028-041), or four, 61.9 m (015-027, lengthened
// 2007); the Lötschberger (2008-2012; 535 101-125) four cars, 62.71 m. One
// door a side on each car, a blunt cab under a sloping windshield, 4.32 m
// tall. From BLS's type drawings and photographs (Bern, Wylerfeld, Thun,
// Martigny, Orsières, 2020-2025; the first refitted Lötschberger, 2024):
// BLS's NINAs (all refitted, 2015-2019) silver, a broad lime band along
// the top of the side, the windows in dark frames, lime doors, the S-Bahn
// "S" at each end car's inner end, "bls" in blue low on the side and on
// the lime front. The Lötschbergers being refitted (2024-2027) in the
// MIKA's scheme: silver, the windows in one black band, a lime line under
// the roof, lime doors, first class under a yellow line. RegionAlps's
// (525 038-041): white, a red window band and a red line under the light
// gray roof, red doors, the cab red; Valais's stars where the band meets
// the cab, "RegionAlps" by the cab, TMR's and SBB's marks.
const NI = { roof: 13.45, low: 2.0 };
const NI_NOSE = [[7.4, 13.45], [6.0, 13.3], [5.0, 12.7], [4.0, 11.6], [3.2, 10.2], [2.5, 8.4], [2.0, 6.6], [1.7, 5.0], [1.65, 4.3], [2.05, 3.2], [2.1, 2.4]];
const NI_CAB_BOTTOM = [[6.2, 2.4], [6.6, 2.75], [17.6, 2.75], ["q", 18.6, 2.75, 19.2, 2.0]];
// Per car: length, windows [x0, x1] (the cab's crew door window apart),
// the door's left edge, numerals, first class's span, the S's place.
const NI_LAYOUT = {
  ninaCab: { L: 55.4, wins: [[11.6, 16.3], [16.6, 21.3], [29.4, 33.9], [34.2, 38.7], [39.0, 43.5], [43.8, 48.3]], door: 24.3, nums: [[16.45, "2"], [38.85, "2"]], s: [50.6, 52.4] },
  ninaA: { L: 45.75, wins: [[2.2, 6.6], [6.9, 11.3], [12.6, 17.0], [17.3, 21.7], [27.4, 31.6], [31.9, 36.1], [37.2, 41.4], [41.7, 45.9 - 2.2]], door: 22.4, nums: [[11.95, "1"], [36.65, "2"]], first: [1.6, 22.0] },
  ninaB: { L: 46.6, wins: [[2.2, 6.6], [6.9, 11.3], [12.6, 17.0], [17.3, 21.7], [28.3, 32.5], [32.8, 37.0], [38.1, 42.3], [42.6, 44.4]], door: 23.0, nums: [[11.95, "2"], [37.55, "2"]] },
  lbCab: { L: 52.6, wins: [[14.4, 19.0], [19.3, 23.9], [30.6, 35.2], [35.5, 40.1], [41.6, 46.2], [46.5, 51.0]], door: 25.9, nums: [[19.15, "2"], [35.35, "2"]] },
  lbB: { L: 50.25, wins: [[2.2, 7.0], [7.3, 12.1], [13.6, 18.2], [18.5, 23.1], [29.8, 34.4], [34.7, 39.3], [40.8, 45.4], [45.7, 48.6]], door: 24.4, nums: [[12.85, "2"], [39.95, "2"]] },
  lbA: { L: 50.25, wins: [[2.2, 7.0], [7.3, 12.1], [13.6, 18.2], [18.5, 23.1], [29.8, 34.4], [34.7, 39.3], [40.8, 45.4], [45.7, 48.6]], door: 23.4, nums: [[12.85, "1"], [39.95, "1"]], first: [0.3, 49.95] },
};
// The liveries: NINA in BLS's paint, Lötschberger refitted, RegionAlps.
const RA = { red: "#e3241b", white: "#f3f3f1", roof: "#c8ccd0", skirt: "#4d5156", grey: "#3e4247" };
// A five-pointed star's outline, centered at (x, y), r its points' radius
// (y down, for mark()).
const starPath = (x, y, r) => poly(Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.42 : r; return [x + rr * Math.cos(a), y + rr * Math.sin(a)]; }));
// Valais's thirteen stars, in a slanting cluster (white on red, red on white).
function stars(x, y, k) {
  const star = (cx, cy, r, col) => path(poly(Array.from({ length: 10 }, (_, i) => { const a = Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.42 : r; return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)]; })), col);
  const pts = [[0, 3.4], [0.9, 3.1], [0.2, 2.5], [1.1, 2.2], [0.4, 1.6], [1.3, 1.3], [0.6, 0.7], [1.5, 0.4], [0.9, -0.2], [1.8, -0.5], [1.2, -1.1], [2.0, -1.4], [1.6, -2.0]];
  return pts.map(([a, b], i) => star(x + a * k, y + b * k, 0.32 * k, b * k + y > 5.6 ? "#ffffff" : RA.red)).join("");
}
function ninaPaint(c, L, lay, cab, scheme) {
  let s = "";
  if (scheme === "regionalps") {
    s += rect(-1, -1, L + 2, 20, RA.white) + rect(-1, 12.15, L + 2, 4, RA.roof) + rect(-1, 11.35, L + 2, 0.42, RA.red) + rect(-1, 5.55, L + 2, 4.25, RA.red) +
      rect(-1, -1, L + 2, 2.95, RA.skirt);
    if (cab) s += stars(10.0, 7.4, 1.25);
    return s;
  }
  const [defs, fill] = vgrad(1.4, 11.9, [[0, "#9fa4a9"], [0.3, "#bfc3c6"], [0.8, BLS.silver], [1, "#e4e5e6"]]);
  s += defs + rect(-1, -1, L + 2, 20, fill) + rect(-1, 12.05, L + 2, 4, BLS.roof) + rect(-1, -1, L + 2, 2.6, BLS.skirt);
  if (scheme === "lb") {
    s += rect(-1, 11.7, L + 2, 0.36, BLS.lime) + rect(lay.wins[0][0] - 0.4, 4.85, lay.wins[lay.wins.length - 1][1] - lay.wins[0][0] + 0.8, 4.7, BLS.band, 0, 'rx="0.6"');
    if (lay.first) s += rect(lay.first[0], 9.55, lay.first[1] - lay.first[0], 0.26, BLS.yellow);
    if (cab) s += path(poly([[-1, 12.05], [7.4, 12.05], [7.4, 9.8], [3.0, 9.8], [-1, 9.8]]), "#6d7176") + path(poly([[-1, 3.2], [2.3, 3.2], [2.0, 6.5], [-1, 6.5]]), BLS.lime);
    return s;
  }
  // NINA: the broad lime band, the window groups' dark surrounds.
  s += rect(-1, 10.55, L + 2, 1.5, BLS.lime);
  if (cab) s += path(poly([[-1, 3.2], [2.3, 3.2], [2.0, 6.5], [-1, 6.5]]), BLS.lime);
  if (lay.first) s += rect(lay.first[0], 9.65, lay.first[1] - lay.first[0], 0.3, BLS.yellow);
  return s;
}
function ninaCar(c, key, scheme) {
  const L = c.L, lay = NI_LAYOUT[key], cab = key.endsWith("Cab");
  const ra = scheme === "regionalps", lb = scheme === "lb";
  const doorFill = ra ? RA.red : BLS.lime;
  return sec(c, {
    base: ra ? RA.white : BLS.silver, cab, truckTop: 2.75,
    outline: box(L, { roof: NI.roof, low: NI.low, nose: cab ? NI_NOSE : null, bottom: cab ? NI_CAB_BOTTOM : null }),
    trucks: [...(cab ? [[12.6, 8.2, 33, "car"]] : [[0, 8.2, 30]]), [L, 8.2, 30]],
    paint: (cc) => {
      let s = ninaPaint(cc, L, lay, cab, scheme);
      // The windows' dark surrounds (groups between the doors), the S.
      if (scheme === "nina") for (const grp of [lay.wins.filter(([a]) => a < lay.door), lay.wins.filter(([a]) => a > lay.door)]) {
        if (!grp.length) continue;
        s += rect(grp[0][0] - 0.3, 5.75, grp[grp.length - 1][1] - grp[0][0] + 0.6, 3.95, ra ? "#2a2c2f" : "#33383d", 0, 'rx="0.45"');
      }
      if (lay.s && scheme === "nina") {
        const [a, b] = key === "ninaB" ? [L - 1.9, L - 0.6] : lay.s;
        s += rect(a, 5.75, b - a, 3.95, "#1d4fa8") + letters(cc, (a + b) / 2, 7.7, 2.2, "S", "#f7c600", { weight: 800, family: "Arial Black, Helvetica Neue, Arial" });
      }
      if (cab) {
        // The cab: the windshield's dark surround seen from the side, the
        // side window, the crew door.
        s += path(poly([[1.7, 4.4], [2.0, 6.6], [2.5, 8.4], [3.2, 10.2], [4.0, 11.6], [5.0, 12.7], [6.0, 13.3], [7.4, 13.45], [7.4, 15], [0, 15], [0, 4.4]]), ra ? RA.red : lb ? "#6d7176" : "#aeb2b6");
        s += path(poly([[3.0, 6.25], [6.4, 6.35], [6.4, 9.55], [4.4, 9.55], ["q", 3.8, 9.5, 3.6, 9.0], [2.8, 6.6]]), "#1d2024") + path(poly([[3.3, 6.5], [6.15, 6.55], [6.15, 9.3], [4.5, 9.3], [3.2, 6.8]]), C.glass) + rect(5.3, 6.55, 0.85, 2.75, C.glassLight, 0, 'opacity="0.6"');
        s += rect(7.9, 5.9, 1.1, 3.55, "#1d2024", 0, 'rx="0.45"') + rect(8.05, 6.05, 0.8, 3.25, C.glass, 0, 'rx="0.35"');
        s += line(7.4, 3.0, 7.4, 13.45, "#2a2d31", 0.6) + line(10.0, 3.0, 10.0, 10.3, "#2a2d31", 0.4);
      }
      return s;
    },
    wins: lay.wins.map(([a, b]) => [a, b, 5.95, 9.5, 0.45]),
    over: (cc) => lay.nums.map(([x, k]) => (ra ? letters(cc, x, 9.95, 0.42, k, "#ffffff", { weight: 700 }) : letters(cc, x, 8.7, 1.05, k, "#ffffff", { weight: 600 }) +
      rect(x - 0.18, 7.35, 0.36, 0.36, BLS.yellow, 0, 'rx="0.05"') + rect(x - 0.18, 6.85, 0.36, 0.36, "#e8eaec", 0, 'rx="0.05"'))).join(""),
    doors: [{ x: lay.door, w: 4.3, y0: 1.75, y1: 9.75, fill: doorFill }],
    door: (cc, d) => (lb || scheme === "nina" ? rect(d.x - 0.35, 1.6, d.w + 0.7, 8.3, BLS.band, 0, 'rx="0.2"') : "") + blsDoor(cc, d),
    extra: (cc) => {
      let s = "";
      if (ra) {
        // "Region" in dark gray, "Alps" in red, a red star over the n.
        if (cab) s += mark(cc, 16.4, 3.85, `<path d="${starPath(-0.15, -1.45, 0.62)}" fill="${RA.red}"/>` +
          txt(0, 0, 1.45, "Region", "#2b2c2e", { weight: 600, anchor: "end", spacing: "-0.02em" }) + txt(0.05, 0, 1.45, "Alps", RA.red, { weight: 600, anchor: "start", spacing: "-0.02em" }));
        s += letters(cc, cab ? L - 9.5 : L * 0.68, 4.0, 0.75, "TMR", RA.red, { weight: 300, spacing: "0.05em" });
        if (!cab) s += rect(L * 0.3 - 1.5, 3.65, 0.55, 0.55, RA.red) + letters(cc, L * 0.3 + 0.35, 3.92, 0.4, "SBB CFF FFS", "#3a3c3f", { weight: 500, anchor: "start" });
      } else if (cab) s += blsLogo(cc, lb ? 11.4 : 13.6, 3.7, 1.2);
      else s += blsLogo(cc, lay.door - 5.4, 3.7, 1.0) + blsLogo(cc, lay.door + 6.3, 3.7, 1.0);
      // Roof: the cab car's converter and air conditioning; the pantograph
      // on the cab car by the joint (the second car of a four-car NINA has
      // its own).
      s += roofCover(cab ? 9.0 : 3.0, NI.roof, cab ? 16.0 : 12.0, 0.6, ra ? "#b8bcc1" : "#7d8187", 4);
      if (cab) s += pantograph(L - 9.0, NI.roof + 0.3, { up: true, facing: -1 }) + rect(L - 12.0, NI.roof - 0.05, 6.0, 0.35, C.steelDark, 0.3) + hvac(31.0, NI.roof, 9.0, 0.55, ra ? "#b8bcc1" : "#8a8e94");
      else s += hvac(L - 18.0, NI.roof, 9.0, 0.55, ra ? "#b8bcc1" : "#8a8e94");
      if (cab) s += coupler(cc, { x: 1.7, y: 3.6, defl: [0.0, 6.2, 2.4] }) + lamp(1.75, 4.7, 0.3, 0.45) + rect(5.6, NI.roof, 1.4, 0.3, "currentColor");
      return s;
    },
    gangway: [2.0, 12.0],
  });
}


// ===================== Stadler FLIRT family =====================
// One builder for the FLIRTs here: low-floor sections on Jakobs trucks, a
// motor truck under each cab's raised floor. nose: "f1" (the first FLIRT,
// 2004-2014: a big rounded windshield over a bulbous lower nose), "f3"
// (FLIRT 3, 2016-: the raked windshield in a black V-shaped mask over a
// chin, the headlights in slits), "evo" (FLIRT Evo, 2024-: upright, the
// windshield in a black mask, lamps in square housings low on the nose).
// lay: { wins: [[x0, x1], ...], doors: [x, ...] (left edges), w (door
// width), nums: [[x, class], ...] }; k: the paint, { base, paint(c, L,
// cab, lay), door(c, d), over(c, L, cab, lay), roof }.
const FNOSE = {
  f1: { roof: 13.73, pts: [[8.6, 13.73], [6.9, 13.55], [5.5, 13.0], [4.3, 12.0], [3.1, 10.5], [2.15, 8.7], [1.5, 6.9], [1.15, 5.3], [1.15, 3.4], [1.7, 2.3]],
    glass: [[2.3, 8.2], [3.4, 10.6], [4.6, 12.1], [6.2, 12.8], [5.6, 10.6], [4.6, 8.6]], side: [[5.2, 8.4], [6.6, 11.2], [9.9, 11.4], [9.9, 7.9]], lamp: [1.2, 5.0], door: 10.6 },
  f3: { roof: 13.5, pts: [[10.4, 13.5], [8.6, 13.4], [7.1, 12.9], [5.7, 11.9], [4.1, 10.2], [2.7, 8.4], [1.6, 7.0], [0.95, 6.0], [0.75, 4.9], [0.8, 3.3], [1.5, 2.2]],
    glass: [[2.7, 8.5], [4.3, 10.4], [5.9, 12.0], [7.4, 12.85], [8.4, 12.95], [8.4, 11.7], [6.2, 9.4], [4.4, 7.6]], side: [[8.9, 9.1], [9.5, 10.9], [11.6, 10.9], [11.6, 8.5]], lamp: [0.9, 5.5], mask: 1 },
  evo: { roof: 13.9, pts: [[8.6, 13.9], [6.3, 13.7], [4.7, 13.2], [3.5, 12.2], [2.5, 10.6], [1.7, 8.6], [1.25, 6.8], [1.05, 4.8], [1.05, 3.0], [1.6, 2.2]],
    glass: [[2.2, 9.7], [2.9, 11.2], [3.9, 12.6], [5.6, 13.25], [7.0, 13.4], [7.0, 9.9]], side: [[8.9, 8.3], [8.9, 11.7], [10.6, 11.7], [10.6, 8.3]], lamp: [1.1, 5.4] },
};
const FL_BOTTOM = (cab) => (cab ? [[8.2, 2.2], [8.9, 3.0], [22.5, 3.0], ["q", 23.8, 3.0, 24.5, 2.1], [25.3, 1.35]] : null);
function flirtSec(c, key, nose, lay, k) {
  const L = c.L, cab = key === "cab", N = FNOSE[nose], roof = N.roof;
  const w = lay.w ?? 4.3;
  const doors = lay.doors.map((x) => ({ x, w, y0: 1.65, y1: 9.85 }));
  return sec(c, {
    base: k.base, cab, truckTop: 3.0,
    outline: box(L, { roof, low: 1.35, nose: cab ? N.pts : null, bottom: FL_BOTTOM(cab), wells: lay.wells || [] }),
    trucks: [...(cab ? [[16.6, 8.5, 34, "car"]] : [[0, 8.86, 30]]), [L, 8.86, 30]],
    under: () => (cab ? rect(9.6, 2.3, 3.6, 0.9, "#3a3e44", 0.4) : ""),
    paint: (cc) => {
      let s = k.paint(cc, L, cab, lay);
      if (cab) {
        s += path(poly([...N.glass.map(([x, y]) => [x - 0.25, y + (y > 12 ? 0.2 : -0.3)])]), k.mask ?? "#15181b");
        s += path(poly(N.glass), C.glass) + path(poly(N.side), "#15181b") + path(poly(N.side.map(([x, y], i) => [x + (i < 2 ? 0.2 : -0.2), y + (i % 3 ? -0.2 : 0.2)])), C.glass);
      }
      return s;
    },
    wins: lay.wins.map(([a, b, y0 = lay.y0 ?? 5.0, y1 = lay.y1 ?? 9.1]) => [a, b, y0, y1, 0.5]),
    over: (cc) => (k.over ? k.over(cc, L, cab, lay) : ""),
    doors, door: (cc, d) => k.door(cc, d),
    extra: (cc) => {
      let s = "";
      // Roof: air conditioning on each section, the cab's converter, the
      // pantograph where the unit has it.
      s += hvac(cab ? 25.0 : L / 2 - 6, roof, 11.0, 0.6, k.roof ?? "#9aa0a6") + (cab ? roofCover(40.0, roof, 10.0, 0.5, k.roof ?? "#9aa0a6", 2) : "");
      if (lay.pan) s += pantograph(lay.pan, roof, { up: true, facing: -1 }) + panGear(lay.pan, roof, -1);
      if (cab) s += coupler(cc, { x: 1.0, y: 3.2, defl: [0.4, 8.2, 2.2] }) + lamp(N.lamp[0], N.lamp[1], 0.35, 0.5) + lamp(N.lamp[0] + 0.05, N.lamp[1] - 0.75, 0.28, 0.35, RED_LAMP) +
        line(N.glass[0][0] + 0.6, N.glass[0][1] + 0.2, N.glass[0][0] + 1.8, N.glass[0][1] + 2.0, "#0d0f11", 0.8) +
        rect(N.door ?? N.side[0][0] + 2.6, 3.4, 2.0, 7.9, "none", 0, 'rx="0.3" stroke="rgba(0,0,0,0.35)" stroke-width="0.08"') +
        (N.door ? rect(N.door + 0.55, 8.0, 0.9, 2.6, "#15181b", 0, 'rx="0.3"') + rect(15.4, 4.2, 3.0, 4.2, "none", 0, 'rx="0.4" stroke="rgba(0,0,0,0.3)" stroke-width="0.08"') : "");
      if (k.extra) s += k.extra(cc, L, cab, lay);
      return s;
    },
    gangway: [1.4, roof - 0.9],
  });
}
// A FLIRT door: a double plug door, its leaves' windows.
function flDoor(c, d, fill, edge = null) {
  const m = d.x + d.w / 2;
  let s = rect(d.x, d.y0, d.w, d.y1 - d.y0, fill, 0.5, 'rx="0.2"') + line(m, d.y0 + 0.1, m, d.y1 - 0.1, "rgba(0,0,0,0.45)", 0.7);
  for (const a of [d.x + 0.45, m + 0.35]) s += rect(a, 4.6, d.w / 2 - 0.8, 4.4, "#15181b", 0, 'rx="0.35"') + rect(a + 0.12, 4.75, d.w / 2 - 1.04, 4.1, C.glass, 0, 'rx="0.28"') + rect(a + 0.17, 7.1, d.w / 2 - 1.14, 1.5, C.glassLight, 0, 'rx="0.2"');
  if (edge) s += rect(d.x, d.y1 - 0.35, d.w, 0.35, edge);
  return s;
}


// SOB's logo (since 2008): "SOB" in heavy red geometric capitals, the O a
// ring, the B's upright shared with the O's right side, the S's ends cut
// level (photographs of the noses: 526 105, 208, 050). x, y its middle, h
// the letters' height; drawn as one group (reads left to right either side).
function sobLogo(c, x, y, h, fill = "#e3262e") {
  const w = 0.2;
  const g = `<g transform="scale(${n(h)}) translate(-1.17 -0.5)" fill="none" stroke="${fill}" stroke-width="${w}">` +
    `<path d="M0.66 0.16Q0.56 0.1 0.36 0.1Q0.1 0.1 0.1 0.29Q0.1 0.46 0.36 0.5Q0.62 0.54 0.62 0.71Q0.62 0.9 0.34 0.9Q0.12 0.9 0.02 0.82"/>` +
    `<circle cx="1.13" cy="0.5" r="0.4"/>` +
    `<path d="M1.53 0.1H1.9Q2.16 0.1 2.16 0.3Q2.16 0.5 1.9 0.5H1.6M1.9 0.5Q2.24 0.5 2.24 0.7Q2.24 0.9 1.92 0.9H1.53" stroke-linejoin="round"/></g>`;
  return mark(c, x, y, g);
}
// "SÜDOSTBAHN" in white capitals with a small red SOB logo before it, low on
// the copper by a door (photographs at Kreuzlingen and Sargans, 2019-2025).
// (The little logo stands on the side toward the car's cab end: before the
// name with the cab to the left, after it with the cab to the right.)
function sobWordmark(c, x, y, h) {
  const logo = (lx) => `<g transform="translate(${n(lx)} 0) scale(${n(h * 0.7)}) translate(-1.17 -0.5)" fill="none" stroke="#e3262e" stroke-width="0.2">` +
    `<path d="M0.66 0.16Q0.56 0.1 0.36 0.1Q0.1 0.1 0.1 0.29Q0.1 0.46 0.36 0.5Q0.62 0.54 0.62 0.71Q0.62 0.9 0.34 0.9Q0.12 0.9 0.02 0.82"/><circle cx="1.13" cy="0.5" r="0.4"/>` +
    `<path d="M1.53 0.1H1.9Q2.16 0.1 2.16 0.3Q2.16 0.5 1.9 0.5H1.6M1.9 0.5Q2.24 0.5 2.24 0.7Q2.24 0.9 1.92 0.9H1.53"/></g>`;
  const after = !!c.mirrored;
  return mark(c, x, y, txt(after ? -0.9 * h : 0.9 * h, 0, h, "SÜDOSTBAHN", "#ffffff", { weight: 600, anchor: "middle", spacing: "0.04em" }) +
    logo(after ? 3.75 * h : -3.75 * h));
}
// The Traverso's panel on the black band behind each cab and at the inner
// end car's coupled end: "TRAVERSO" with its six-pointed star toward the
// cab end, a white rule, the lines it runs in small capitals on the far
// side of the rule, set against it (photographs: 105 in 2019 without the
// star and with three lines; 212, 208 in 2024-2026 with the star and
// ALPENRHEIN-EXPRESS). x: the rule's place; toward: -1 if the cab (or the
// panel's star end) is to the left as drawn. Mirrored, the whole panel
// mirrors with the car, its words still reading left to right.
function tvPanel(c, x, y, toward = -1) {
  const vis = c.mirrored ? -toward : toward;           // on screen: -1 the star is left of the rule
  const lines = ["VORALPEN-EXPRESS", "TRENO GOTTARDO", "AARE LINTH", "ALPENRHEIN-EXPRESS"];
  const star = (sx) => `<path d="M${n(sx)} -0.42V0.42M${n(sx - 0.36)} -0.21L${n(sx + 0.36)} 0.21M${n(sx - 0.36)} 0.21L${n(sx + 0.36)} -0.21" stroke="#ffffff" stroke-width="0.11" stroke-linecap="round"/>`;
  let g = `<rect x="-0.02" y="-0.78" width="0.05" height="1.56" fill="#ffffff"/>`;
  if (vis < 0) g += txt(-0.3, 0, 0.72, "TRAVERSO", "#ffffff", { weight: 400, anchor: "end", spacing: "0.08em" }) + star(-5.45) +
    lines.map((t, i) => txt(0.25, -0.55 + i * 0.37, 0.25, t, "#ffffff", { weight: 500, anchor: "start", spacing: "0.03em" })).join("");
  else g += txt(0.3, 0, 0.72, "TRAVERSO", "#ffffff", { weight: 400, anchor: "start", spacing: "0.08em" }) + star(5.45) +
    lines.map((t, i) => txt(-0.25, -0.55 + i * 0.37, 0.25, t, "#ffffff", { weight: 500, anchor: "end", spacing: "0.03em" })).join("");
  return mark(c, x, y, g);
}

// ---------- SOB: Traverso and the FLIRT 3 ----------
// The Traverso (RABe 526 101-130, 2019-2025): eight cars, two four-car
// halves (526 1xx and 2xx) close-coupled, 150.2 m, 4.12 m tall; end cars
// 21.75 m, the cars between 15.8 m; one door a side on each car. Copper
// all over, a black window band framed in red (it opens at the cab car in
// a broad red slant), light gray doors; "TRAVERSO" and its star with the
// lines it runs ("VORALPEN-EXPRESS, TRENO GOTTARDO, AARE LINTH,
// ALPENRHEIN-EXPRESS") in white on the black behind the cab; "SOB" in red
// on the nose, the unit's number white low on it; "SÜDOSTBAHN" and the SBB
// mark small under the band. First class at the 1xx end: a "1" by the
// windows and a yellow line over the door. The four-car FLIRT 3s (526
// 001-013) the same in silver. Photographs at Kreuzlingen, Bollingen,
// Sargans, St. Gallen, Zürich (2019-2026).
const SOB = { copper: "#c98552", copperHi: "#dda06e", copperLo: "#a86a3f", silver: "#c6cacd", silverHi: "#e4e6e8", red: "#e8332a", black: "#1a1c1e", door: "#a8adb2", roofCopper: "#b77a4c" };
const TV = { cab: 71.4, mid: 51.8 };
const TV_LAYOUT = {
  cab: { wins: [[31.0, 34.6], [35.4, 39.2], [40.6, 44.4], [52.6, 56.4], [57.8, 61.6], [63.0, 66.8]], doors: [46.3], nums: [[45.4, null]], panel: 21.0, w: 4.3 },
  mid1: { wins: [[2.6, 6.4], [7.8, 11.6], [13.0, 16.8], [18.2, 22.0], [23.4, 27.2], [28.6, 32.4], [41.8, 45.6], [47.0, 49.8]], doors: [35.3], nums: [[40.8, null]], pan: null },
  mid2: { wins: [[2.0, 4.8], [6.2, 10.0], [19.4, 23.2], [24.6, 28.4], [29.8, 33.6], [35.0, 38.8], [40.2, 44.0], [45.4, 49.2]], doors: [12.2], nums: [[18.4, "2"]], pan: 46.0 },
  mid3: { wins: [[2.0, 4.8], [16.6, 20.4], [22.2, 26.0], [27.8, 31.6]], doors: [10.3], nums: [[16.0, "2"]], lines: 36.0 },
};
function sobPaint(scheme) {
  const tv = scheme === "traverso";
  const body = tv ? SOB.copper : SOB.silver;
  return {
    base: body, roof: tv ? SOB.roofCopper : "#a9aeb3", mask: "#16191c",
    paint: (c, L, cab, lay) => {
      const [defs, fill] = vgrad(1.0, 13.6, tv ? [[0, SOB.copperLo], [0.35, SOB.copper], [0.75, SOB.copperHi], [0.9, SOB.copper], [1, SOB.copperLo]]
        : [[0, "#a7acb1"], [0.35, SOB.silver], [0.75, SOB.silverHi], [1, "#b4b9be"]]);
      let s = defs + rect(-1, -1, L + 2, 16, fill) + rect(-1, -1, L + 2, 2.2, tv ? "#5b4434" : "#55595e");
      const a = cab ? lay.panel : -1;
      // The red frame and the black band.
      s += rect(a, 4.1, L + 1 - a, 6.25, SOB.red) + rect(cab ? a + 1.1 : -1, 4.55, L + 1 - (cab ? a + 1.1 : -1), 5.3, SOB.black);
      if (cab) s += path(poly([[a - 3.6, 4.1], [a, 4.1], [a, 10.35], [a - 0.8, 10.35]]), SOB.red) + path(poly([[a - 2.3, 4.55], [a + 1.2, 4.55], [a + 1.2, 9.85], [a - 0.4, 9.85]]), SOB.black);
      return s;
    },
    door: (c, d) => flDoor(c, d, SOB.door, c.first && !d.no1 ? null : null) + (c.first ? rect(d.x, d.y1 - 0.3, d.w, 0.3, "#f2c200") : ""),
    over: (c, L, cab, lay) => {
      let s = "";
      for (const [x, k] of lay.nums) { const kk = k ?? (c.first ? "1" : "2"); s += letters(c, x, 8.55, 0.95, kk, "#ffffff", { weight: 600 }) + rect(x - 0.17, 7.35, 0.34, 0.34, "#f2c200", 0, 'rx="0.05"'); }
      if (cab && tv) s += tvPanel(c, lay.panel + 6.0, 5.9, -1);
      if (lay.lines && tv) s += tvPanel(c, L - 8.6, 5.9, 1);
      // Low on the copper: "SÜDOSTBAHN" by the door (SBB's mark on the
      // pantograph cars instead).
      const d0 = lay.doors[0];
      if (lay.pan) s += sbbMark(c, d0 + 5.6, 3.0, 0.48);
      else s += sobWordmark(c, cab ? d0 - 5.4 : d0 + 9.0, 3.0, 0.5);
      return s;
    },
    extra: (c, L, cab) => (cab ? sobLogo(c, 3.2, 6.1, 1.0) : ""),
  };
}
const SOB_K = { traverso: sobPaint("traverso"), f3: sobPaint("f3") };
const tvCar = (part, scheme, first = false) => (c) => flirtSec({ ...c, first }, part === "cab" ? "cab" : "mid", "f3", TV_LAYOUT[part], SOB_K[scheme]);


// ---------- The first FLIRTs: SOB, TPF, transN ----------
// Stadler's FLIRT as built for SBB and the private railways (2004-2014):
// four cars, 74.08 m, 4.19 m tall, the end cars 21.3 m and the two between
// 15.7 m; one double door a side on each car, the pantograph on car 2.
// Photographs (Buchs SG 2023, Bern 2020, Neuchâtel 2016-2019): SOB's
// (526 041-063) silver, a red sweep along the window band rising to a
// point behind the cab, "SOB" in red on the nose; TPF's (527 191-198)
// white, the nose's front red, a row of red dots low along the side,
// growing toward the cab, a yellow line over first class, the "rer" disc
// behind the cab; transN's (527 331-333, 523 074-077) white over a
// lime-green skirt that sweeps up the nose, the windows in a dark band,
// green doors, the transN ring on the side.
const F1 = { cab: 70.0, mid: 51.5 };
const F1_LAYOUT = {
  cab: { wins: [[20.2, 24.6], [25.6, 30.0], [31.0, 35.4], [36.4, 40.8], [50.4, 54.8], [55.8, 60.2], [61.2, 65.6]], doors: [44.2], nums: [[42.7, "2"]], y0: 4.9, y1: 9.4 },
  cabA: { wins: [[20.2, 24.6], [25.6, 30.0], [31.0, 35.4], [36.4, 40.8], [50.4, 54.8], [55.8, 60.2], [61.2, 65.6]], doors: [44.2], nums: [[42.7, "2"], [49.6, "1"]], first: [49.0, 70.0], y0: 4.9, y1: 9.4 },
  mid: { wins: [[2.2, 6.6], [7.6, 12.0], [20.6, 25.0], [26.0, 30.4], [31.4, 35.8], [36.8, 41.2], [42.2, 46.6], [47.4, 49.8]], doors: [14.6], nums: [[19.9, "2"]], pan: 30.0, y0: 4.9, y1: 9.4 },
  mid2: { wins: [[2.2, 6.6], [7.6, 12.0], [20.6, 25.0], [26.0, 30.4], [31.4, 35.8], [36.8, 41.2], [42.2, 46.6], [47.4, 49.8]], doors: [14.6], nums: [[19.9, "2"]], y0: 4.9, y1: 9.4 },
};
const F1K = {
  sob: {
    base: SOB.silver, roof: "#a9aeb3",
    paint: (c, L, cab) => {
      const [defs, fill] = vgrad(1.0, 13.7, [[0, "#a7acb1"], [0.35, SOB.silver], [0.75, SOB.silverHi], [1, "#b4b9be"]]);
      let s = defs + rect(-1, -1, L + 2, 16, fill) + rect(-1, -1, L + 2, 2.2, "#55595e");
      // The red sweep: the window band's height and a little more, its
      // front a point behind the cab door.
      if (cab) s += path(`M${L + 1} 3.4L24.0 3.4Q15.0 3.4 13.0 6.6Q15.0 9.9 24.0 10.2L${L + 1} 10.2Z`, "#e3262e");
      else s += rect(-1, 3.4, L + 2, 6.8, "#e3262e");
      return s;
    },
    door: (c, d) => flDoor(c, d, "#b9bec2"),
    over: (c, L, cab, lay) => lay.nums.map(([x, k]) => letters(c, x, 8.6, 0.8, k, "#ffffff", { weight: 600 }) + (k === "1" ? rect(x - 0.17, 7.4, 0.34, 0.34, "#f2c200", 0, 'rx="0.05"') : "")).join(""),
    extra: (c, L, cab) => (cab ? sobLogo(c, 3.2, 6.0, 0.8) : ""),
  },
  tpf: {
    base: "#f3f4f4", roof: "#b9bdc1",
    paint: (c, L, cab, lay) => {
      let s = rect(-1, -1, L + 2, 16, "#f3f4f4") + rect(-1, 12.6, L + 2, 2, "#d9dcde") + rect(-1, -1, L + 2, 2.2, "#5d6166");
      if (cab) s += path("M-1 2.2L3.6 2.2Q3.3 5.0 3.4 7.6Q3.8 10.6 5.6 12.6Q6.6 13.5 7.6 13.8L-1 14Z", "#d4134d");
      if (lay.first) s += rect(lay.first[0], 9.75, Math.min(L, lay.first[1]) - lay.first[0], 0.24, "#f2c200");
      // The row of red dots, growing toward the cab.
      for (let x = cab ? 66.5 : L - 2.5; x > (cab ? 7 : 1); x -= cab && x < 30 ? 2.6 : 2.1) {
        const r = cab ? 0.2 + Math.max(0, (34 - x) / 26) * 0.55 : 0.2;
        if (!lay.doors.some((d) => x > d - 0.6 && x < d + 4.9)) s += circle(x, cab && x < 30 ? 3.3 - (34 - x) * 0.02 : 3.5, r, "#c8173f");
      }
      return s;
    },
    door: (c, d) => flDoor(c, d, "#e9ebec"),
    over: (c, L, cab, lay) => lay.nums.map(([x, k]) => letters(c, x, 8.6, 0.8, k, "#2b2c2e", { weight: 600 })).join(""),
    extra: (c, L, cab) => (cab ? mark(c, 14.2, 7.9, `<circle r="1.25" fill="#1d1d1f"/>` + txt(0, -0.08, 0.85, "rer", "#ffffff", { weight: 600 }) + txt(0, 1.75, 0.2, "FRIBOURG | FREIBURG", "#2b2c2e", { weight: 500 })) +
      letters(c, 27.0, 4.5, 0.6, "tpf", "#3a3c3f", { weight: 600 }) : ""),
  },
  transn: {
    base: "#f3f4f4", roof: "#b9bdc1",
    paint: (c, L, cab, lay) => {
      let s = rect(-1, -1, L + 2, 16, "#f3f4f4") + rect(-1, 12.6, L + 2, 2, "#d3d6d9") + rect(-1, 4.7, L + 2, 5.0, "#2a2d30") + rect(-1, -1, L + 2, 3.9, "#8cc63f");
      if (cab) s += rect(-1, 4.7, 11.4, 5.0, "#f3f4f4") + path("M-1 3.8L16.0 3.8Q9.0 3.9 6.0 4.7Q3.4 5.5 2.6 6.3L-1 6.3Z", "#8cc63f") +
        path("M10.4 4.7L14.6 4.7Q12.0 6.6 11.6 9.7L10.4 9.7Z", "#2a2d30") + path("M5.0 9.7L11.6 9.7L11.6 11.0Q8.0 11.0 5.0 9.7Z", "#2a2d30");
      return s;
    },
    door: (c, d) => flDoor(c, d, "#8cc63f"),
    over: (c, L, cab, lay) => lay.nums.map(([x, k]) => letters(c, x, 8.6, 0.8, k, "#ffffff", { weight: 600 })).join(""),
    extra: (c, L, cab, lay) => (cab ? letters(c, 4.6, 5.6, 0.7, "transN", "#5f9f2f", { weight: 700, style: "italic" }) : "") +
      (cab ? mark(c, lay.doors[0] - 3.2, 6.6, `<circle r="2.7" fill="none" stroke="#8cc63f" stroke-width="0.2"/>` + txt(0, 0, 0.75, "transN", "#8cc63f", { weight: 500, style: "italic" })) : ""),
  },
};
const f1Car = (part, scheme) => (c) => flirtSec(c, part.startsWith("cab") ? "cab" : "mid", "f1", F1_LAYOUT[part], F1K[scheme]);

// ---------- Thurbo: FLIRT Evo (RABe 533 5xx, 531 4xx, 533 3xx) ----------
// Stadler's FLIRT Evo (2024-): four cars, 73.5 m (533 501-519; two doors a
// side on each car), or three, 57.8 m (531 401-430, 533 301-358; one door
// a car); end cars 21.05 m, the cars between 15.7 m. Thurbo's (in service
// on the S 26 since July 2026; photographs at Rüti ZH and Bettwiesen,
// 2026): white, the cab red, the red running back over the cab car's roof
// and fading to pink along the train's roof; the windows in one black band;
// every door a different bright color, its class numbers on blue over it;
// the white Thurbo "t" on the red nose, the "thurbo" mark in its colors low
// on each car with "Die Regionalbahn." under it, SBB's mark by it.
const EVO = { cab: 69.06, mid: 51.5 };
const EVO_DOORS = ["#e2231a", "#5aaee0", "#9b3fa0", "#f2c300", "#76c043", "#e95a9c", "#2e66b3"];
const EVO_LAYOUT = {
  cab4: { wins: [[9.4, 10.8, 6.4, 9.3], [16.7, 20.6, 5.1, 9.6], [21.8, 25.7], [27.0, 30.9], [32.2, 36.1], [45.4, 49.3], [50.5, 54.4], [64.5, 67.6]], doors: [38.0, 57.3], y0: 5.1, y1: 9.6 },
  mid4: { wins: [[1.8, 5.2], [6.4, 10.3], [11.5, 15.4], [22.8, 26.7], [27.9, 31.8], [40.8, 44.7], [45.9, 49.8]], doors: [17.0, 34.0], y0: 5.1, y1: 9.6, pan: null, first: [38.3, 52.0], labels: ["2  2", "2  1"] },
  mid4p: { wins: [[1.8, 5.2], [6.4, 10.3], [11.5, 15.4], [22.8, 26.7], [27.9, 31.8], [40.8, 44.7], [45.9, 49.8]], doors: [17.0, 34.0], y0: 5.1, y1: 9.6, pan: 46.0, first: [-1, 17.0], labels: ["1  2", "2  2"] },
  cab3: { wins: [[9.4, 10.8, 6.4, 9.3], [16.7, 20.6, 5.1, 9.6], [21.8, 25.7], [27.0, 30.9], [32.2, 36.1], [37.4, 41.3], [50.5, 54.4], [55.6, 59.5], [60.7, 64.6]], doors: [43.6], y0: 5.1, y1: 9.6 },
  mid3: { wins: [[1.8, 5.2], [6.4, 10.3], [11.5, 15.4], [16.6, 20.5], [31.0, 34.9], [36.1, 40.0], [41.2, 45.1], [46.3, 49.8]], doors: [23.6], y0: 5.1, y1: 9.6, pan: 46.0 },
};
const EVOK = {
  base: "#f4f5f5", roof: "#c9b0b6", mask: "#141619",
  paint: (c, L, cab, lay) => {
    const [d1, pinkFill] = vgrad(12.2, 14.0, [[0, "#e9a3ae"], [1, "#efbcc4"]]);
    let s = d1 + rect(-1, -1, L + 2, 16, "#f4f5f5") + rect(-1, -1, L + 2, 1.85, "#4a4e53") + rect(-1, 12.35, L + 2, 3, pinkFill);
    if (cab) {
      const id = newId();
      s += `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="10" y1="0" x2="${L}" y2="0"><stop offset="0" stop-color="#e2001a"/><stop offset="0.35" stop-color="#e2475a"/><stop offset="1" stop-color="#e9a3ae"/></linearGradient></defs>` +
        rect(-1, 12.35, L + 2, 3, `url(#${id})`) + path("M-1 4.4L2.6 4.4Q2.4 7.6 3.4 10.2Q4.6 12.0 7.4 12.35L-1 12.35Z", "#e2001a");
    }
    s += rect(cab ? 15.9 : -1, 4.85, L + (cab ? -15.9 : 2), 5.05, "#141619");
    if (lay.first) s += rect(lay.first[0], 9.9, lay.first[1] - lay.first[0], 0.28, "#f2c300");
    return s;
  },
  door: (c, d) => flDoor(c, d, d.fill) + rect(d.x, d.y1 - 0.75, d.w, 0.6, "#2e4a9a") + letters(c, d.x + d.w / 2, d.y1 - 0.45, 0.45, d.label || "2  2", "#ffffff", { weight: 600 }),
  over: () => "",
  extra: (c, L, cab, lay) => {
    let s = "";
    const lx = cab ? lay.doors[0] - 9.0 : lay.doors[0] + 6.5;
    s += thurboMark(c, lx - 1.6, 4.0, 1.2) + sbbMark(c, lx + 3.4, 3.5, 0.62);
    // Thurbo's "t" on the red nose: a short upright, a long crossbar
    // reaching back, the upright's foot turning back.
    if (cab) s += mark(c, 3.3, 6.2, `<path d="M-0.15 -0.75V0.35Q-0.15 0.6 0.15 0.6H0.6M-0.5 -0.3H0.95" fill="none" stroke="#ffffff" stroke-width="0.32"/>`);
    return s;
  },
};
function evoCar(part) {
  return (c) => {
    const lay = EVO_LAYOUT[part];
    const doors = lay.doors.map((x, i) => x);
    const k = { ...EVOK, door: (cc, d) => EVOK.door(cc, { ...d, fill: EVO_DOORS[(Math.round(d.x) + (cc.index || 0) * 3) % EVO_DOORS.length], label: lay.labels?.[lay.doors.indexOf(d.x)] }) };
    return flirtSec(c, part.startsWith("cab") ? "cab" : "mid", "evo", { ...lay, doors }, k);
  };
}


// ---------- SBB's mark (the Swiss railways' double arrow in a red square) ----------
// Small, on the regional companies' trains (Thurbo, RegionAlps), with
// "SBB CFF FFS" beside it. x the square's left edge, y its middle, h its side.
// SBB's mark: the red flag (a little wider than tall) with the white
// symbol (a horizontal bar ending in arrowheads both ways, crossed by two
// short uprights), "SBB CFF FFS" in black condensed capitals beside it.
// x: the group's left edge (as drawn unmirrored), y its middle, h the flag's
// height; drawn as one group, so it reads flag-then-name on either side.
const SBB_SYM = "M-0.38 0L-0.17 -0.27L-0.17 -0.33L-0.08 -0.33L-0.08 -0.07L0.08 -0.07L0.08 -0.33L0.17 -0.33L0.17 -0.27L0.38 0L0.17 0.27L0.17 0.33L0.08 0.33L0.08 0.07L-0.08 0.07L-0.08 0.33L-0.17 0.33L-0.17 0.27Z" +
  "M-0.27 0L-0.17 -0.13L-0.17 -0.05L-0.08 -0.05L-0.08 0.05L-0.17 0.05L-0.17 0.13Z M0.27 0L0.17 -0.13L0.17 -0.05L0.08 -0.05L0.08 0.05L0.17 0.05L0.17 0.13Z";
function sbbMark(c, x, y, h, word = true) {
  const fw = h * 1.2, tw = word ? h * 4.3 : 0, W = fw + (word ? h * 0.25 : 0) + tw;
  const flag = `<rect x="${n(-W / 2)}" y="${n(-h / 2)}" width="${n(fw)}" height="${n(h)}" fill="#e2001a"/>` +
    `<path d="${SBB_SYM}" fill="#ffffff" fill-rule="evenodd" transform="translate(${n(-W / 2 + fw / 2)} 0) scale(${n(h)})"/>`;
  const name = word ? `<text x="${n(-W / 2 + fw + h * 0.25)}" y="${n(h * 0.33)}" font-size="${n(h * 0.9)}" font-weight="700" font-family="Arial Narrow, Helvetica Neue, Arial, sans-serif" ` +
    `fill="#1c1e20" textLength="${n(tw)}" lengthAdjust="spacingAndGlyphs">SBB CFF FFS</text>` : "";
  return mark(c, x + W / 2, y, flag + name);
}

// ---------- Thurbo: Stadler GTW (RABe 526 7xx) ----------
// Stadler's articulated railcar, third generation (2003-2010): two end cars
// hung from a short power module that carries the motor truck, the
// pantograph and the transformer (GTW 2/6, 39.4 m: 526 701-751), or with a
// middle car between one end car and the module (GTW 2/8, 54.45 m: 526
// 752-805, and 260-286 ex-RM). End cars about 17.2 m with a truck under the
// cab, the middle car 15.05 m, the module about 5 m; low floor (585 mm)
// between the trucks; one double door a side on each car. Thurbo's paint
// (photographs at Kreuzlingen and Sargans, 2025-2026): silver-white, the
// windows in a black band from the cab back, the cab's front black round
// the windshield; each door a bright color (red, blue, green, purple); a
// yellow line over first class (the ABt end car); "SBB CFF FFS" and the
// "thurbo" mark low on the side. The formation names the cars ABt526 (end
// car, 1st and 2nd), B526 (middle car), Re526 (the module) and Bt526.
const GTW = { cab: 56.4, mid: 49.4, pm: 16.4, roof: 12.95 };
const GTW_NOSE = [[6.4, 12.95], [5.0, 12.8], [4.1, 12.2], [3.0, 10.6], [2.0, 8.6], [1.35, 6.8], [1.05, 5.4], [1.0, 3.6], [1.4, 2.6]];
const GTW_DOORS = ["#e2231a", "#3a8fd9", "#4cae3b", "#8e44a5"];
function gtwPaint(c, L, { cab, first, a = cab ? 11.4 : -1 }) {
  const [defs, fill] = vgrad(1.4, 12.9, [[0, "#b9bdc1"], [0.25, "#dfe2e4"], [0.8, "#eef0f1"], [1, "#d5d8db"]]);
  let s = defs + rect(-1, -1, L + 2, 15, fill) + rect(-1, 12.0, L + 2, 2, "#c7cbcf") + rect(-1, -1, L + 2, 2.4, "#4a4e53");
  s += rect(a, 4.7, L + 1 - a, 4.95, "#16181b", 0, cab ? 'rx="0.5"' : "");
  if (first) s += rect(first[0], 9.95, first[1] - first[0], 0.3, "#f2c300");
  if (cab) s += path("M-1 4.4L1.6 4.4Q2.6 7.6 3.6 9.4Q5.0 11.6 6.6 12.6L-1 12.6Z", "#16181b");
  return s;
}
function gtwCar(c, kind) {
  const L = c.L, cab = kind === "cabA" || kind === "cabB" || kind === "cabAJ" || kind === "cabBJ";
  const firstCar = kind === "cabA" || kind === "cabAJ", jakobs = kind.endsWith("J");
  const door = cab ? 22.0 : 7.6;
  const wins = cab ? [[7.0, 10.6, 5.6, 9.3], [12.2, 16.6], [17.2, 21.0], [27.8, 32.4], [33.4, 38.0], [39.0, 43.6], [44.6, 49.2], [50.2, 54.8]]
    : [[1.6, 6.2], [13.0, 18.4], [19.4, 24.8], [25.8, 31.2], [32.2, 37.6], [38.6, 44.0], [45.0, 47.8]];
  const dcol = GTW_DOORS[((c.index || 0) + (cab ? 0 : 1)) % GTW_DOORS.length];
  return sec(c, {
    base: "#eef0f1", cab, truckTop: 2.6,
    outline: box(L, { roof: GTW.roof, low: 1.45, nose: cab ? GTW_NOSE : null, bottom: cab ? [[6.6, 2.6], [7.0, 3.0], [12.6, 3.0], ["q", 13.6, 3.0, 14.2, 2.2], [14.8, 1.45]] : null,
      x1: L - 0.3 }),
    trucks: [...(cab ? [[9.6, 6.9, 30]] : [[0, 6.9, 28]]), ...(jakobs ? [[L, 6.9, 28]] : [])],
    paint: (cc) => gtwPaint(cc, L, { cab, first: firstCar ? [11.4, door] : null }) + (cab ? gtwSweep(16.6, 12.0) : ""),
    wins: wins.map(([a, b, y0 = 5.0, y1 = 9.3]) => [a, b, y0, y1, 0.45]),
    over: (cc) => (firstCar ? letters(cc, door - 0.8, 8.6, 0.75, "1", "#ffffff", { weight: 600 }) : "") +
      letters(cc, door + 5.2, 8.6, 0.75, "2", "#ffffff", { weight: 600 }),
    doors: [{ x: door, w: 4.3, y0: 1.6, y1: 9.75 }], door: (cc, d) => flDoor(cc, d, dcol) + doorMarks(cc, d),
    extra: (cc) => {
      let s = hvac(cab ? 18.0 : L / 2 - 6, GTW.roof, 10.0, 0.55, "#b9bdc1");
      // Under the windows between the cab and the door: on one side the
      // "thurbo" mark, on the other SBB's, big, its flag by the door
      // (photographs: 526 766 and 748, Sargans and Kreuzlingen, 2025-2026).
      // The middle car: SBB's small by its door, "thurbo" at its far end.
      if (cab) s += cc.mirrored ? sbbMark(cc, door - 7.6, 3.0, 1.05) : thurboMark(cc, 12.0, 3.4, 1.15);
      else s += sbbMark(cc, 1.6, 3.2, 0.5) + thurboMark(cc, L - 6.4, 3.5, 0.9);
      if (cab) s += coupler(cc, { x: 1.0, y: 3.1, defl: [0.3, 6.4, 2.6] }) + lamp(1.05, 5.0, 0.32, 0.45) + lamp(1.1, 4.3, 0.26, 0.32, RED_LAMP) + wiper(2.2, 8.6, 3.4, 10.6);
      return s;
    },
    gangway: [1.6, 12.0],
  });
}
// The "thurbo" mark (photographs at Sargans and Kreuzlingen, 2025-2026):
// tall, narrow lowercase letters, each its own color (t red, its crossbar a
// red block reaching out to the left; h green, u orange, r and b purple, o
// light blue), "Die Regionalbahn." in gray under it. x: its left edge as
// drawn unmirrored, y the letters' middle, h their height (ascenders).
function thurboMark(c, x, y, h) {
  const k = h, W = 2.25 * k;
  const cols = ["#d1322e", "#6db33f", "#efa128", "#6c3b8e", "#6c3b8e", "#3d9fd8"];
  let g = `<rect x="${n(-W / 2 - 0.12 * k)}" y="${n(-0.2 * k)}" width="${n(0.42 * k)}" height="${n(0.16 * k)}" fill="${cols[0]}"/>`;
  g += `<text x="${n(-W / 2)}" y="${n(0.5 * k)}" font-size="${n(1.25 * k)}" font-weight="700" font-family="Arial Narrow, Helvetica Neue, Arial, sans-serif" ` +
    `textLength="${n(W)}" lengthAdjust="spacingAndGlyphs" letter-spacing="-0.02em">` + [..."thurbo"].map((ch, i) => `<tspan fill="${cols[i]}">${ch}</tspan>`).join("") + `</text>`;
  g += txt(-W / 2 + 0.05 * k, 0.95 * k, 0.24 * k, "Die Regionalbahn.", "#55595e", { weight: 600, anchor: "start" });
  return mark(c, x + W / 2, y, g);
}
// The small marks low on every door: ZVV's ring with its name on one leaf,
// the Ostwind tariff's pinwheel on the other (white on the door's color).
function doorMarks(c, d) {
  const m = d.x + d.w / 2, y = d.y0 + 1.3;
  return mark(c, d.x + d.w * 0.27, y, `<circle cx="-0.18" cy="0" r="0.28" fill="none" stroke="#ffffff" stroke-width="0.06"/>` + txt(0.22, 0, 0.26, "ZVV", "#ffffff", { weight: 700 })) +
    mark(c, m + d.w * 0.23, y, [0, 90, 180, 270].map((a) => `<path d="M0 0Q0.1 -0.28 0.04 -0.34Q-0.12 -0.2 0 0Z" fill="#ffffff" transform="rotate(${a})"/>`).join("") +
      `<rect x="-0.2" y="0.42" width="0.4" height="0.32" fill="none" stroke="#ffffff" stroke-width="0.04"/>`);
}
// The two gray lines sweeping up across a GTW end car's side behind the
// cab, from low by the door to the roof's edge over the cab's windows.
const gtwSweep = (a, b) => [0, 0.55].map((k) => `<path d="M${n(a + k)} 1.4C${n(a + k - 0.4)} 6.0 ${n(b + k + 0.6)} 10.4 ${n(b + k)} 13.0" fill="none" stroke="#8e98a3" stroke-width="0.26"/>`).join("");
// The power module: a short, tall box on the motor truck, the gangway
// through it, its sides louvered round a band of windows at the top; the
// pantograph, the transformer's cooler and the brake resistors on the roof.
function gtwPower(c) {
  const L = c.L, roof = 13.4;
  return sec(c, {
    base: "#dfe2e4", truckTop: 3.4,
    outline: box(L, { roof, low: 2.6, x0: 0.4, x1: L - 0.4, r: 0.4 }),
    trucks: [[L / 2, 7.2, 37, "loco"]],
    paint: (cc) => gtwPaint(cc, L, { cab: false }) + rect(1.4, 4.4, L - 2.8, 4.0, "#3c4045", 0.3, 'rx="0.2"') + slats(1.6, 4.6, L - 3.2, 3.6, 0.35, "rgba(255,255,255,0.22)"),
    wins: [[1.6, L - 1.6, 9.9, 11.5, 0.3]],
    extra: () => pantograph(L / 2, roof, { up: true, facing: -1 }) + roofCover(0.8, roof, 2.4, 0.5, "#9aa0a6", 1) + roofCover(L - 3.2, roof, 2.4, 0.5, "#9aa0a6", 1) +
      rect(L / 2 - 2.0, 1.2, 4.0, 1.3, "#3a3e44", 0.4, 'rx="0.15"'),
    gangway: [2.6, 12.0],
  });
}

// ---------- NPZ "Domino" (RBDe 560, B, ABt) ----------
// SBB's regional push-pull trains of 1984-1996, rebuilt 2008-2014 as the
// "Domino": the RBDe 560 motor car (25.0 m, a cab, the luggage room behind
// it, the pantograph on a raised roof section over the cab), a new low-floor
// middle car (B, 24.7 m, its doors near the middle) and the ABt driving
// trailer (25.0 m, first class behind the cab), high floor elsewhere; a flat
// cab front, raked a little. Run in threes (or with two middle cars), often
// two sets coupled. RegionAlps's (photographs at St-Maurice and Martigny,
// 2023): white, the cab and the roof's edge red, the windows in a red band,
// red doors, a yellow line over first class; "RegionAlps" with its star and
// the "rer" disc on the side. TPF's (2026): white, the cab red, the red dots
// low along the side. Travys's (Le Brassus, 2022): cream, the cabs magenta,
// the windows in magenta panels, magenta doors, a yellow line over first
// class, "travys" and "Lac de Joux" on the cab car. OeBB's (SBB's sets): SBB's
// white, the cab red, a black window band, red doors.
const NPZ = { L: 82.0, Lb: 81.0, roof: 12.75 };
const NPZ_NOSE = [[1.9, 12.75], [1.1, 12.2], [0.8, 11.4], [0.6, 5.4], [0.6, 3.3]];
const NPZ_K = {
  regionalps: { body: "#f1f1ef", cab: "#e3241b", band: "#e3241b", door: "#e3241b", roof: "#bfc3c7", edge: "#e3241b", gray: "#4d5156" },
  tpf: { body: "#f3f4f4", cab: "#d4134d", band: null, door: "#e9ebec", roof: "#bfc3c7", edge: null, gray: "#4d5156" },
  travys: { body: "#f1ece0", cab: "#c8155a", band: "#c8155a", door: "#c8155a", roof: "#b8bcc0", edge: null, gray: "#4d5156" },
  sbb: { body: "#f1f1ef", cab: "#e3241b", band: "#1a1c1e", door: "#e3241b", roof: "#9aa0a6", edge: "#e3241b", gray: "#4d5156" },
};
function npzCar(c, part, scheme) {
  const L = c.L, k = NPZ_K[scheme], cab = part !== "b", motor = part === "rbde";
  const doors = part === "rbde" ? [{ x: L - 9.5, w: 4.2 }] : part === "abt" ? [{ x: 21.5, w: 4.2 }, { x: L - 9.5, w: 4.2 }] : [{ x: L / 2 - 2.1, w: 4.2 }];
  const wins = part === "rbde" ? [[17.4, 20.6, 6.0, 9.6], [23.2, 28.4], [29.4, 34.6], [35.6, 40.8], [41.8, 47.0], [48.0, 53.2], [54.2, 59.4], [60.4, 65.6], [76.4, 80.0]]
    : part === "abt" ? [[11.0, 15.0, 6.0, 9.6], [16.0, 20.2], [27.6, 32.8], [33.8, 39.0], [39.9, 45.1], [46.0, 51.2], [52.1, 57.3], [58.2, 63.4], [64.3, 69.5], [76.4, 80.0]]
    : [[2.0, 6.8], [7.8, 12.6], [13.6, 18.4], [19.4, 24.2], [25.2, 30.0], [30.9, 35.7], [45.2, 50.0], [51.0, 55.8], [56.8, 61.6], [62.6, 67.4], [68.4, 73.2], [74.2, 79.0]];
  const first = part === "abt" ? [7.6, 21.2] : null;
  const roof = NPZ.roof;
  return sec(c, {
    base: k.body, cab, truckTop: 3.6,
    outline: box(L, { roof, low: 3.1, nose: cab ? NPZ_NOSE : null, bottom: part === "b" ? [[13.0, 3.1], [13.8, 1.6], [L - 13.8, 1.6], [L - 13.0, 3.1]] : null }),
    trucks: [[8.6, 8.2, 37, motor ? "loco" : "car"], [L - 8.6, 8.2, motor ? 37 : 33, motor ? "loco" : "car"]],
    paint: (cc) => {
      let s = rect(-1, -1, L + 2, 15, k.body) + rect(-1, 12.05, L + 2, 2, k.roof) + rect(-1, -1, L + 2, 3.9, k.gray);
      if (k.edge) s += rect(-1, 11.75, L + 2, 0.3, k.edge);
      if (k.band) {
        const a = cab ? (part === "abt" ? 10.4 : 16.8) : 1.4;
        s += rect(a, 5.6, L - 1.4 - a, 4.6, k.band, 0, 'rx="0.4"');
      }
      if (first) s += rect(first[0] + 2.8, 10.3, first[1] - first[0] - 2.8, 0.32, "#f2c300");
      if (cab) s += path(`M-1 3.9L${scheme === "travys" ? 13.5 : 6.8} 3.9L${scheme === "travys" ? 10.0 : 6.8} 12.05L-1 12.05Z`, k.cab) +
        rect(-1, 3.9, 9.0, 0.5, "#1d1f22");
      // TPF: the row of red dots low on the side.
      if (scheme === "tpf") for (let x = cab ? 10.5 : 3.0; x < L - 2; x += 2.3) if (!doors.some((d) => x > d.x - 0.6 && x < d.x + d.w + 0.6)) s += circle(x, 4.7, 0.42, "#c8173f");
      return s;
    },
    wins: wins.map(([a, b, y0 = 6.0, y1 = 9.6]) => [a, b, y0, y1, 0.4]),
    over: (cc) => (cab ? path(poly([[1.0, 8.2], [1.2, 11.6], [1.8, 11.9], [3.6, 11.9], [3.6, 8.2]]), "#16181b") : "") +
      (first ? letters(cc, 21.0, 8.6, 0.85, "1", "#ffffff", { weight: 600 }) : ""),
    doors, door: (cc, d) => flDoor(cc, { ...d, y0: 2.2, y1: 10.2 }, k.door),
    extra: (cc) => {
      let s = "";
      if (cab) s += rect(7.4, 3.6, 2.1, 8.0, "none", 0, 'rx="0.25" stroke="rgba(0,0,0,0.4)" stroke-width="0.08"') + rect(7.85, 8.0, 1.2, 2.6, "#16181b", 0, 'rx="0.25"') +
        coupler(cc, { x: 0.6, y: 3.5, defl: null }) + rect(0, 2.9, 0.5, 1.1, "currentColor", 0, 'rx="0.12"') + lamp(0.7, 5.0, 0.3, 0.5) + lamp(0.7, 4.3, 0.25, 0.32, RED_LAMP);
      if (motor) s += rect(4.0, roof - 0.05, 17.0, 1.4, "#5d6268", 0.4, 'rx="0.3"') + pantograph(13.0, roof + 1.35, { up: true, facing: -1 }) + roofCover(22.0, roof, 14.0, 0.7, "#7d8288", 4) + hvac(52, roof, 12, 0.6);
      else s += hvac(L / 2 - 6, roof, 12, 0.6);
      if (part === "b" && scheme === "travys") s += "";
      if (cab && scheme === "regionalps") s += mark(cc, part === "abt" ? 30.5 : 37.0, 4.6, `<path d="${starPath(0.35, -1.05, 0.55)}" fill="#e3241b"/>` +
        txt(0, 0, 1.25, "Region", "#2b2c2e", { weight: 600, anchor: "end" }) + txt(0.05, 0, 1.25, "Alps", "#e3241b", { weight: 600, anchor: "start" }));
      if (cab && scheme === "travys") s += mark(cc, 22.5, 4.6, txt(0.4, 0, 1.5, "travys", "#3a3c3f", { weight: 500, anchor: "start", spacing: "0.06em" }) +
        `<path d="M-0.4 -0.9Q0.6 -1.1 0.9 -0.4Q0.6 0.9 0.2 0.9Q0.5 0 -0.4 -0.3Z" fill="${k.cab}"/>`);
      if (scheme === "sbb" || scheme === "regionalps") s += sbbMark(cc, cab ? 36.0 : L * 0.3, 4.6, 0.85);
      if (scheme === "tpf" && cab) s += mark(cc, 14.0, 7.0, `<circle r="1.1" fill="#1d1d1f"/>` + txt(0, -0.08, 0.75, "rer", "#ffffff", { weight: 600 })) + letters(cc, 30.0, 5.5, 0.6, "tpf", "#3a3c3f", { weight: 600 });
      return s;
    },
    gangway: [3.6, 11.8],
  });
}

// ---------- SZU: Uetliberg's Be 552 (Be 510) and the Sihltal's double-deckers ----------
// Be 552 (Stadler, 2013 and 2022; 511-516, 571-575): three cars, 50 m, 3.75
// m tall, a GTW-like body; the middle car on the two motor trucks carries
// both end cars, which have a trailer truck under the cab; low floor
// between the trucks; a double door a side on each car. SZU red, white
// doors, "UETLIBERG BAHN" in white on the end car and SZU's star emblem;
// photographs at Ringlikon and Uetliberg (2024). Usually two coupled.
const BE5 = { cab: 57.4, mid: 49.2, roof: 12.3 };
const BE5_NOSE = [[6.2, 12.3], [4.9, 12.1], [3.9, 11.4], [2.9, 9.8], [2.0, 8.0], [1.4, 6.4], [1.1, 5.0], [1.05, 3.6], [1.4, 2.6]];
const SZU = { red: "#e2231a", redLo: "#c41c15", roof: "#9aa0a6" };
// SZU's emblem: a winged arrow in a ring (drawn as a ring with an arrow
// through it) and "SZU".
// SZU's emblem (on the Re 450's and Be 552's fronts, big on the Be 552's
// middle car): a rhombus outline, a horizontal bar through it reaching out
// both sides, the gap in the bar at the rhombus's middle; "SZU" beside it
// in heavy capitals. h: the rhombus's height.
const SZU_EMB = (h, fill) => `<path d="M0 ${n(-0.5 * h)}L${n(0.62 * h)} 0L0 ${n(0.5 * h)}L${n(-0.62 * h)} 0Z" fill="none" stroke="${fill}" stroke-width="${n(0.12 * h)}"/>` +
  `<path d="M${n(-1.25 * h)} ${n(-0.04 * h)}H${n(-0.2 * h)}M${n(0.2 * h)} ${n(-0.04 * h)}H${n(1.25 * h)}M${n(-1.25 * h)} ${n(0.1 * h)}H${n(-0.2 * h)}M${n(0.2 * h)} ${n(0.1 * h)}H${n(1.25 * h)}" stroke="${fill}" stroke-width="${n(0.08 * h)}"/>`;
const szuMark = (c, x, y, h, fill = "#ffffff") => mark(c, x, y, `<g transform="translate(${n(1.0 * h)} 0)">${SZU_EMB(h, fill)}</g>` + txt(-0.35 * h, 0, h * 0.9, "SZU", fill, { weight: 800, anchor: "end" }));
function be552(c, kind) {
  const L = c.L, cab = kind === "cab";
  const door = cab ? 25.5 : 20.0;
  const wins = cab ? [[7.0, 10.0, 6.0, 9.2], [12.2, 16.4], [17.4, 21.6], [31.2, 35.4], [36.4, 40.6], [41.6, 45.8], [46.8, 51.0], [52.0, 55.6]]
    : [[2.0, 6.2], [7.2, 11.4], [12.4, 16.6], [26.0, 30.2], [31.2, 35.4], [36.4, 40.6], [41.6, 45.8]];
  return sec(c, {
    base: SZU.red, cab, truckTop: 2.8,
    outline: box(L, { roof: BE5.roof, low: 1.45, nose: cab ? BE5_NOSE : null, bottom: cab ? [[6.6, 2.6], [7.0, 2.9], [13.6, 2.9], ["q", 14.6, 2.9, 15.2, 2.1], [15.8, 1.45]] : [[1.0, 2.9], [11.0, 2.9], [11.8, 1.45], [L - 11.8, 1.45], [L - 11.0, 2.9]] }),
    trucks: cab ? [[10.0, 6.9, 30]] : [[5.6, 7.2, 33, "car"], [L - 5.6, 7.2, 33, "car"]],
    paint: (cc) => {
      const [defs, fill] = vgrad(1.4, 12.2, [[0, SZU.redLo], [0.6, SZU.red], [1, "#ea4038"]]);
      let s = defs + rect(-1, -1, L + 2, 14, fill) + rect(-1, 11.4, L + 2, 2, "#c9cdd1") + rect(-1, -1, L + 2, 2.3, "#3a3d41");
      if (cab) s += path("M-1 7.4L2.0 7.4Q3.2 9.8 4.4 11.4L-1 11.4Z", "#16181b") + path("M-1 11.4L4.4 11.4Q5.6 12.4 8.0 12.4L-1 12.4Z", "#c9cdd1");
      return s;
    },
    wins: wins.map(([a, b, y0 = 5.2, y1 = 9.4]) => [a, b, y0, y1, 0.4]),
    doors: [{ x: door, w: 4.2, y0: 1.6, y1: 9.7 }], door: (cc, d) => flDoor(cc, d, "#f1f2f3"),
    extra: (cc) => {
      let s = hvac(cab ? 18.5 : 15.0, BE5.roof, 10.0, 0.5, "#b0b5ba");
      if (!cab) s += pantograph(L - 9.0, BE5.roof, { up: true, facing: -1 }) + roofCover(3.0, BE5.roof, 9.0, 0.6, "#8d949b", 3);
      if (cab) s += letters(cc, 37.0, 4.2, 1.15, "UETLIBERG", "#ffffff", { weight: 700, spacing: "0.02em" }) + letters(cc, 44.3, 3.75, 0.4, "BAHN", "#ffffff", { weight: 600 }) +
        szuMark(cc, 4.3, 5.6, 0.75) + coupler(cc, { x: 1.0, y: 3.2, defl: [0.3, 6.6, 2.6] }) + lamp(1.1, 4.4, 0.3, 0.45) + wiper(2.4, 8.4, 3.6, 10.4);
      else s += mark(cc, 23.0, 3.9, `<g transform="rotate(90)">${SZU_EMB(2.3, "#ffffff")}</g>`);
      return s;
    },
    gangway: [1.6, 11.4],
  });
}
// The Sihltal line (S 4): a Re 450 (SLM, ABB, 1989-1997; two of SZU's,
// 551-552, ex-SBB) pushing or pulling SBB-built double-deck coaches (DPZ,
// Schindler, 1989-1997; 26.8 m), all in SZU's red with "SIHLTAL BAHN".
// The Re 450 (18.4 m, Bo'Bo', one cab: the other end is the coupled end):
// its sides ribbed, a row of windows and grilles high along the
// machine room; the coaches: two decks between the trucks, the doors in
// the low middle section, the end sections over the trucks at an
// intermediate level; the driving trailer's cab end raked.
function re450(c) {
  const L = c.L, roof = 14.2, sill = 4.1;
  // An upright cab front, its big windshield in a rounded frame.
  const nose = [[4.0, roof], [2.2, 14.0], [1.3, 13.2], [1.0, 11.8], [0.85, 7.0], [0.85, 3.6]];
  return sec(c, {
    base: SZU.red, cab: true, truckTop: sill,
    outline: box(L, { roof, low: 3.1, nose, x1: L - 0.6, r: 1.6 }),
    trucks: [[L / 2 - 16.4, 9.2, 41, "loco"], [L / 2 + 16.4, 9.2, 41, "loco"]],
    under: () => rect(L / 2 - 11, 2.2, 22, 1.4, "#55595e", 0.4, 'rx="0.2"'),
    paint: (cc) => {
      const [defs, fill] = vgrad(3.0, 14.0, [[0, SZU.redLo], [0.6, SZU.red], [1, "#ee4a40"]]);
      let s = defs + rect(-1, -1, L + 2, 16, fill) + rect(-1, 13.2, L + 2, 2, "#9aa0a6") + rect(-1, -1, L + 2, 4.0, "#55595e");
      // The machine room's ribs, and the louvered panels high along it.
      for (let y = 5.6; y < 11.0; y += 0.62) s += line(14.0, y, L - 4.0, y, "rgba(255,255,255,0.32)", 0.35) + line(14.0, y - 0.08, L - 4.0, y - 0.08, "rgba(0,0,0,0.18)", 0.35);
      for (let x = 15.0; x < L - 8; x += 3.6) s += rect(x, 11.4, 3.2, 1.5, "#8f8682", 0.3, 'rx="0.15"');
      // The windshield (seen from the side, a sliver) and the cab's side window.
      s += path(poly([[1.05, 9.6], [1.3, 12.6], [2.6, 13.4], [3.4, 13.4], [3.4, 9.6]]), "#16181b");
      s += rect(8.6, 8.4, 2.6, 3.3, "#16181b", 0, 'rx="0.35"') + rect(8.8, 8.6, 2.2, 2.9, C.glass, 0, 'rx="0.3"') + rect(L - 3.6, 8.6, 1.0, 2.4, "#16181b", 0, 'rx="0.2"');
      return s;
    },
    doors: [{ x: 11.6, w: 1.9, y0: 4.3, y1: 11.4 }], door: (cc, d) => rect(d.x, d.y0, d.w, d.y1 - d.y0, "rgba(0,0,0,0.05)", 0.5, 'rx="0.2"') + line(d.x - 0.3, 5.0, d.x - 0.3, 10.4, "currentColor", 0.5),
    extra: (cc) => pantograph(L - 15.0, roof, { up: true, facing: -1 }) + roofCover(20.0, roof, 18.0, 0.7, "#8d949b", 4) +
      letters(cc, L * 0.55, 4.6, 0.85, "SIHLTAL", "#ffffff", { weight: 400, spacing: "0.45em" }) + letters(cc, L * 0.55 + 6.4, 4.45, 0.32, "BAHN", "#ffffff", { weight: 500, spacing: "0.2em" }) +
      rect(0, 3.0, 0.5, 1.2, "currentColor", 0, 'rx="0.12"') + rect(L - 0.6, 3.0, 0.6, 1.2, "currentColor", 0, 'rx="0.12"') + lamp(0.9, 5.4, 0.3, 0.45) + rect(3.0, roof, 1.0, 0.5, "currentColor"),
    gangway: [4.1, 12.0],
  });
}
function dpz(c, kind) {
  const L = c.L, cab = kind === "bt", roof = 14.9, dropA = 17.6, dropB = L - 17.6;
  const nose = [[5.0, roof], [3.6, 14.6], [2.6, 13.6], [1.6, 11.0], [1.1, 7.6], [1.0, 4.2]];
  const ups = [[18.6, 22.6], [23.6, 27.6], [28.6, 32.6], [33.6, 37.6], [38.6, 42.6], [50.0, 54.0], [55.0, 59.0], [60.0, 64.0], [65.0, 69.0]];
  return sec(c, {
    base: SZU.red, cab, truckTop: 3.9,
    outline: box(L, { roof, low: 3.4, nose: cab ? nose : null, bottom: [[dropA - 1.0, 3.4], [dropA, 1.2], [dropB, 1.2], [dropB + 1.0, 3.4]], r: 1.0 }),
    trucks: [[8.6, 8.2, 36], [L - 8.6, 8.2, 36]],
    paint: (cc) => rect(-1, -1, L + 2, 16, SZU.red) + rect(-1, 14.1, L + 2, 2, "#c4c8cc") + rect(-1, -1, L + 2, 1.9, "#2a2d31") +
      (cab ? path(poly([[1.6, 9.8], [2.6, 13.3], [4.4, 13.9], [6.0, 13.9], [6.0, 9.8]]), "#16181b") + path(poly([[1.9, 10.1], [2.8, 13.0], [5.7, 13.5], [5.7, 10.1]]), C.glass) : ""),
    wins: [...ups.map(([a, b]) => [a, b, 10.5, 13.0, 0.4]), ...ups.map(([a, b]) => [a, b, 4.2, 6.9, 0.4]), ...(cab ? [] : [[2.4, 6.4, 7.6, 10.4, 0.4]]), [L - 6.4, L - 2.4, 7.6, 10.4, 0.4], [9.4, 12.6, 7.6, 10.4, 0.4]],
    doors: [{ x: 44.0, w: 4.4, y0: 1.4, y1: 9.4 }], door: (cc, d) => flDoor(cc, d, "#f1f2f3"),
    extra: (cc) => hvac(L / 2 - 6, roof, 12, 0.5, "#b0b5ba") + letters(cc, 30.0, 8.6, 0.6, "SIHLTAL", "#ffffff", { weight: 500, spacing: "0.3em" }) +
      (cab ? coupler(cc, { x: 0.6, y: 3.5, defl: null }) + lamp(1.1, 5.0, 0.3, 0.45) + szuMark(cc, 3.2, 6.2, 0.5) : ""),
    gangway: [3.4, 13.4],
  });
}


// ---------- TPF's metre-gauge Stadler units (S 50, S 51, R Bulle–Montbovon) ----------
// Stadler, 2015-2016 (101-106) and 2023-2024 (107-110): three cars, the
// ABe 2/4 and Be 2/4 motor cars at the ends (a motor truck under each cab),
// a B between, on Jakobs trucks at the joints; about 51 m, low floor;
// one double door a side on each car. TPF's paint (photographs at Bulle,
// Montbovon and Châtel-St-Denis, 2020-2024): white, the nose red, the
// windshield and the cab's side window in one black teardrop; the red dots
// low along the side, big by the cab and shrinking; a yellow line over
// first class behind the ABe's cab; the "rer" disc and "tpf" by it; light
// gray doors. Metre gauge, a lower body (3.65 m).
const TMG = { cab: 57.5, mid: 46.0, roof: 11.98 };
const TMG_NOSE = [[7.2, 11.98], [5.6, 11.8], [4.4, 11.1], [3.2, 9.6], [2.2, 7.6], [1.5, 5.8], [1.2, 4.4], [1.2, 3.0], [1.6, 2.3]];
function tpfMg(c, kind) {
  const L = c.L, cab = kind !== "mid", first = kind === "abe";
  const door = cab ? 27.0 : 21.0;
  const wins = cab ? [[14.4, 19.0], [20.0, 24.8], [33.4, 37.8], [38.8, 43.2], [44.2, 48.6], [49.6, 54.0]] : [[2.0, 5.8], [6.8, 10.6], [11.6, 15.4], [28.6, 32.4], [33.4, 37.2], [38.2, 42.0]];
  return sec(c, {
    base: "#f3f4f4", cab, truckTop: 2.5,
    outline: box(L, { roof: TMG.roof, low: 1.3, nose: cab ? TMG_NOSE : null, bottom: cab ? [[7.0, 2.3], [7.4, 2.7], [13.0, 2.7], ["q", 14.0, 2.7, 14.6, 2.0], [15.2, 1.3]] : null }),
    trucks: cab ? [[10.0, 6.2, 28, "car"], [L, 6.2, 24]] : [[0, 6.2, 24], [L, 6.2, 24]],
    paint: (cc) => {
      let s = rect(-1, -1, L + 2, 14, "#f3f4f4") + rect(-1, 11.2, L + 2, 2, "#d5d8db") + rect(-1, -1, L + 2, 2.0, "#4d5156");
      if (cab) s += path("M-1 2.0L2.6 2.0Q2.2 5.0 2.3 7.2L-1 7.2Z", "#d4134d") + path("M-1 7.2L2.3 7.2Q3.0 10.0 4.6 11.4L-1 11.6Z", "#16181b") +
        // The cab's side window: a black teardrop, its front edge curving back.
        path("M10.4 6.2L7.4 6.2Q6.8 6.2 6.9 6.9Q7.6 9.6 10.4 11.0Z", "#16181b") + path("M10.1 6.5L7.6 6.5Q7.2 6.6 7.3 7.0Q8.0 9.3 10.1 10.5Z", C.glass);
      if (first) s += rect(13.8, 9.85, door - 14.2, 0.32, "#f2c300");
      for (let x = cab ? 13.5 : 2.0; x < L - 1.5; x += 2.2) {
        if (x > door - 0.6 && x < door + 4.6) continue;
        const r = cab ? 0.2 + Math.max(0, (36 - x) / 24) * 0.42 : 0.2;
        s += circle(x, cab ? 3.0 + Math.max(0, (36 - x) / 24) * 0.2 : 3.0, r, "#c8173f");
      }
      return s;
    },
    wins: wins.map(([a, b]) => [a, b, 4.8, 8.9, 0.45]),
    over: (cc) => (cab ? mark(cc, 11.6, 6.4, `<circle r="0.95" fill="#1d1d1f"/>` + txt(0, -0.06, 0.62, "rer", "#ffffff", { weight: 600 })) + letters(cc, 13.6, 3.9, 0.5, "tpf", "#3a3c3f", { weight: 600 }) : "") +
      (first ? letters(cc, door - 0.8, 8.3, 0.7, "1", "#3a3c3f", { weight: 600 }) : ""),
    doors: [{ x: door, w: 3.9, y0: 1.5, y1: 9.3 }], door: (cc, d) => flDoor(cc, d, "#d9dcde"),
    extra: (cc) => hvac(cab ? 17.0 : L / 2 - 5, TMG.roof, 9.0, 0.5, "#b9bdc1") + (cab ? pantograph(31.0, TMG.roof, { up: true, facing: -1 }) + panGear(31.0, TMG.roof, 1) +
      coupler(cc, { x: 1.2, y: 2.9, defl: [0.4, 7.0, 2.3] }) + lamp(1.25, 4.6, 0.3, 0.45) : ""),
    gangway: [1.4, 11.0],
  });
}

// ===================== Tables =====================

export const TYPES = {
  tpfMgABe: { name: "ABe 2/4 motor car (metre gauge), 1st and 2nd class", kind: "emu", amenities: ["first"] },
  tpfMgB: { name: "B middle car (metre gauge)", kind: "emu" },
  tpfMgBe: { name: "Be 2/4 motor car (metre gauge)", kind: "emu" },
  sobTvMidA: { name: "Traverso car 2, 1st class", kind: "emu", amenities: ["first"] },
  sobF3CabA: { name: "FLIRT 3 (RABe 526 0xx) end car, 1st and 2nd class", kind: "emu", amenities: ["first"] },
  sobF1CabA: { name: "FLIRT (RABe 526 041-063) end car, 1st and 2nd class", kind: "emu", amenities: ["first"] },
  thbGtwCabA: { name: "GTW (RABe 526) end car, 1st and 2nd class", kind: "emu", amenities: ["first"] },
  thbGtwCabB: { name: "GTW (RABe 526) end car", kind: "emu" },
  thbGtwCabAJ: { name: "GTW (RABe 526) end car, 1st and 2nd class", kind: "emu", amenities: ["first"] },
  thbGtwCabBJ: { name: "GTW (RABe 526) end car", kind: "emu" },
  thbGtwMid: { name: "GTW middle car", kind: "emu" },
  thbGtwPower: { name: "GTW power module", kind: "module" },
  raDomRBDe: { name: "Domino motor car (RBDe 560)", kind: "emu" },
  raDomB: { name: "Domino middle car", kind: "emu" },
  raDomABt: { name: "Domino driving trailer (ABt), 1st and 2nd class", kind: "emu", amenities: ["first"] },
  tpfDomRBDe: { name: "Domino motor car (RBDe 560)", kind: "emu" },
  tpfDomB: { name: "Domino middle car", kind: "emu" },
  tpfDomABt: { name: "Domino driving trailer (ABt), 1st and 2nd class", kind: "emu", amenities: ["first"] },
  trvDomRBDe: { name: "Domino motor car (RBDe 560)", kind: "emu" },
  trvDomB: { name: "Domino middle car", kind: "emu" },
  trvDomABt: { name: "Domino driving trailer (ABt), 1st and 2nd class", kind: "emu", amenities: ["first"] },
  sbbDomRBDe: { name: "Domino motor car (RBDe 560)", kind: "emu" },
  sbbDomB: { name: "Domino middle car", kind: "emu" },
  sbbDomABt: { name: "Domino driving trailer (ABt), 1st and 2nd class", kind: "emu", amenities: ["first"] },
  szuBe552Cab: { name: "Be 552 (Uetlibergbahn) end car", kind: "emu" },
  szuBe552Mid: { name: "Be 552 motor car", kind: "emu" },
  szuRe450: { name: "Re 450 electric locomotive", kind: "electric", pan: true },
  szuDpzB: { name: "Double-deck coach (DPZ)", kind: "coach" },
  szuDpzBt: { name: "Double-deck driving trailer (DPZ)", kind: "coach", cab: true },
  sobF1Cab: { name: "FLIRT (RABe 526 041-063) end car", kind: "emu" },
  sobF1Mid: { name: "FLIRT car with pantograph", kind: "emu" },
  sobF1Mid2: { name: "FLIRT car", kind: "emu" },
  tpfF1Cab: { name: "FLIRT (RABe 527) end car", kind: "emu" },
  tpfF1CabA: { name: "FLIRT (RABe 527) end car, 1st and 2nd class", kind: "emu", amenities: ["first"] },
  tpfF1Mid: { name: "FLIRT car with pantograph", kind: "emu" },
  tpfF1Mid2: { name: "FLIRT car", kind: "emu" },
  trnF1Cab: { name: "FLIRT (transN) end car", kind: "emu" },
  trnF1Mid: { name: "FLIRT (transN) car with pantograph", kind: "emu" },
  trnF1Mid2: { name: "FLIRT (transN) car", kind: "emu" },
  thbEvoCab4: { name: "FLIRT Evo (RABe 533 5xx) end car", kind: "emu" },
  thbEvoMid4: { name: "FLIRT Evo car", kind: "emu" },
  thbEvoMid4p: { name: "FLIRT Evo car with pantograph", kind: "emu" },
  thbEvoCab3: { name: "FLIRT Evo (three cars) end car", kind: "emu" },
  thbEvoMid3: { name: "FLIRT Evo (three cars) middle car", kind: "emu" },
  sobTvCab1: { name: "Traverso (RABe 526) end car, 1st class", kind: "emu", amenities: ["first"] },
  sobTvCab2: { name: "Traverso (RABe 526) end car", kind: "emu" },
  sobTvMid1: { name: "Traverso car", kind: "emu" },
  sobTvMid2: { name: "Traverso car with pantograph", kind: "emu" },
  sobTvMid3: { name: "Traverso inner end car", kind: "emu" },
  sobF3Cab: { name: "FLIRT 3 (RABe 526 0xx) end car", kind: "emu" },
  sobF3Mid1: { name: "FLIRT 3 car", kind: "emu" },
  sobF3Mid2: { name: "FLIRT 3 car with pantograph", kind: "emu" },
  blsNinaCab: { name: "NINA (RABe 525) end car", kind: "emu" },
  blsNinaA: { name: "NINA middle car, 1st and 2nd class", kind: "emu", amenities: ["first"] },
  blsNinaB: { name: "NINA middle car, 2nd class", kind: "emu" },
  blsLbCab: { name: "Lötschberger (RABe 535) end car", kind: "emu" },
  blsLbB: { name: "Lötschberger car 2, 2nd class", kind: "emu" },
  blsLbA: { name: "Lötschberger car 3, 1st class", kind: "emu", amenities: ["first"] },
  raNinaCab: { name: "NINA (RABe 525) end car", kind: "emu" },
  raNinaA: { name: "NINA middle car, 1st and 2nd class", kind: "emu", amenities: ["first"] },
  blsMutzCab: { name: "MUTZ (RABe 515) end car", kind: "emu" },
  blsMutzB: { name: "MUTZ car, 2nd class", kind: "emu" },
  blsMutzAB: { name: "MUTZ car, 1st and 2nd class", kind: "emu", amenities: ["first"] },
  blsMutzABr: { name: "MUTZ car, 1st and 2nd class", kind: "emu", amenities: ["first"] },
  blsMikaCabRe: { name: "MIKA (RABe 528, RE) end car", kind: "emu" },
  blsMikaRe2: { name: "MIKA (RE) car 2", kind: "emu" },
  blsMikaRe3: { name: "MIKA (RE) car 3, 2nd and 1st class", kind: "emu", amenities: ["first"] },
  blsMikaRe4: { name: "MIKA (RE) car 4, 1st class", kind: "emu", amenities: ["first"] },
  blsMikaRe5: { name: "MIKA (RE) car 5, bistro corner", kind: "emu", amenities: ["cafe"] },
  blsMikaCabS: { name: "MIKA (RABe 528, S-Bahn) end car", kind: "emu" },
  blsMikaS2: { name: "MIKA (S-Bahn) car 2", kind: "emu" },
  blsMikaS3: { name: "MIKA (S-Bahn) car 3, 2nd and 1st class", kind: "emu", amenities: ["first"] },
  blsMikaS4: { name: "MIKA (S-Bahn) car 4, 1st and 2nd class", kind: "emu", amenities: ["first"] },
  blsMikaS5: { name: "MIKA (S-Bahn) car 5", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  tpfMgABe: M((c) => tpfMg(c, "abe"), TMG.cab, true),
  tpfMgB: M((c) => tpfMg(c, "mid"), TMG.mid),
  tpfMgBe: M((c) => tpfMg(c, "be"), TMG.cab, true),
  sobTvMidA: M(tvCar("mid1", "traverso", true), TV.mid),
  sobF3CabA: M(tvCar("cab", "f3", true), TV.cab, true),
  sobF1CabA: M(f1Car("cabA", "sob"), F1.cab, true),
  thbGtwCabA: M((c) => gtwCar(c, "cabA"), GTW.cab, true),
  thbGtwCabB: M((c) => gtwCar(c, "cabB"), GTW.cab, true),
  thbGtwCabAJ: M((c) => gtwCar(c, "cabAJ"), GTW.cab, true),
  thbGtwCabBJ: M((c) => gtwCar(c, "cabBJ"), GTW.cab, true),
  thbGtwMid: M((c) => gtwCar(c, "mid"), GTW.mid, false, (ctx) => ctx.index),
  thbGtwPower: M(gtwPower, GTW.pm),
  raDomRBDe: M((c) => npzCar(c, "rbde", "regionalps"), NPZ.L, true),
  raDomB: M((c) => npzCar(c, "b", "regionalps"), NPZ.Lb),
  raDomABt: M((c) => npzCar(c, "abt", "regionalps"), NPZ.L, true),
  tpfDomRBDe: M((c) => npzCar(c, "rbde", "tpf"), NPZ.L, true),
  tpfDomB: M((c) => npzCar(c, "b", "tpf"), NPZ.Lb),
  tpfDomABt: M((c) => npzCar(c, "abt", "tpf"), NPZ.L, true),
  trvDomRBDe: M((c) => npzCar(c, "rbde", "travys"), NPZ.L, true),
  trvDomB: M((c) => npzCar(c, "b", "travys"), NPZ.Lb),
  trvDomABt: M((c) => npzCar(c, "abt", "travys"), NPZ.L, true),
  sbbDomRBDe: M((c) => npzCar(c, "rbde", "sbb"), NPZ.L, true),
  sbbDomB: M((c) => npzCar(c, "b", "sbb"), NPZ.Lb),
  sbbDomABt: M((c) => npzCar(c, "abt", "sbb"), NPZ.L, true),
  szuBe552Cab: M((c) => be552(c, "cab"), BE5.cab, true),
  szuBe552Mid: M((c) => be552(c, "mid"), BE5.mid),
  szuRe450: M(re450, 60.4, true),
  szuDpzB: M((c) => dpz(c, "b"), 87.9),
  szuDpzBt: M((c) => dpz(c, "bt"), 87.9, true),
  sobF1Cab: M(f1Car("cab", "sob"), F1.cab, true),
  sobF1Mid: M(f1Car("mid", "sob"), F1.mid),
  sobF1Mid2: M(f1Car("mid2", "sob"), F1.mid),
  tpfF1Cab: M(f1Car("cab", "tpf"), F1.cab, true),
  tpfF1CabA: M(f1Car("cabA", "tpf"), F1.cab, true),
  tpfF1Mid: M(f1Car("mid", "tpf"), F1.mid),
  tpfF1Mid2: M(f1Car("mid2", "tpf"), F1.mid),
  trnF1Cab: M(f1Car("cab", "transn"), F1.cab, true),
  trnF1Mid: M(f1Car("mid", "transn"), F1.mid),
  trnF1Mid2: M(f1Car("mid2", "transn"), F1.mid),
  thbEvoCab4: M(evoCar("cab4"), EVO.cab, true),
  thbEvoMid4: M(evoCar("mid4"), EVO.mid, false, (ctx) => ctx.index),
  thbEvoMid4p: M(evoCar("mid4p"), EVO.mid, false, (ctx) => ctx.index),
  thbEvoCab3: M(evoCar("cab3"), EVO.cab, true),
  thbEvoMid3: M(evoCar("mid3"), EVO.mid, false, (ctx) => ctx.index),
  sobTvCab1: M(tvCar("cab", "traverso", true), TV.cab, true),
  sobTvCab2: M(tvCar("cab", "traverso"), TV.cab, true),
  sobTvMid1: M(tvCar("mid1", "traverso"), TV.mid),
  sobTvMid2: M(tvCar("mid2", "traverso"), TV.mid),
  sobTvMid3: M(tvCar("mid3", "traverso"), TV.mid),
  sobF3Cab: M(tvCar("cab", "f3"), TV.cab, true),
  sobF3Mid1: M(tvCar("mid1", "f3"), TV.mid),
  sobF3Mid2: M(tvCar("mid2", "f3"), TV.mid),
  blsNinaCab: M((c) => ninaCar(c, "ninaCab", "nina"), NI_LAYOUT.ninaCab.L, true),
  blsNinaA: M((c) => ninaCar(c, "ninaA", "nina"), NI_LAYOUT.ninaA.L),
  blsNinaB: M((c) => ninaCar(c, "ninaB", "nina"), NI_LAYOUT.ninaB.L),
  blsLbCab: M((c) => ninaCar(c, "lbCab", "lb"), NI_LAYOUT.lbCab.L, true),
  blsLbB: M((c) => ninaCar(c, "lbB", "lb"), NI_LAYOUT.lbB.L),
  blsLbA: M((c) => ninaCar(c, "lbA", "lb"), NI_LAYOUT.lbA.L),
  raNinaCab: M((c) => ninaCar(c, "ninaCab", "regionalps"), NI_LAYOUT.ninaCab.L, true),
  raNinaA: M((c) => ninaCar(c, "ninaA", "regionalps"), NI_LAYOUT.ninaA.L),
  blsMutzCab: M((c) => mutzCar(c, "cab"), MZ.end, true),
  blsMutzB: M((c) => mutzCar(c, "b"), MZ.mid),
  blsMutzAB: M((c) => mutzCar(c, "ab"), MZ.mid),
  blsMutzABr: M((c) => mutzCar(c, "abR"), MZ.mid),
  blsMikaCabRe: M((c) => mikaCar(c, "cabRe"), MK.cab, true),
  blsMikaRe2: M((c) => mikaCar(c, "re2"), MK.mid),
  blsMikaRe3: M((c) => mikaCar(c, "re3"), MK.mid),
  blsMikaRe4: M((c) => mikaCar(c, "re4"), MK.mid),
  blsMikaRe5: M((c) => mikaCar(c, "re5"), MK.mid),
  blsMikaCabS: M((c) => mikaCar(c, "cabS"), MK.cab, true),
  blsMikaS2: M((c) => mikaCar(c, "s2"), MK.mid),
  blsMikaS3: M((c) => mikaCar(c, "s3"), MK.mid),
  blsMikaS4: M((c) => mikaCar(c, "s4"), MK.mid),
  blsMikaS5: M((c) => mikaCar(c, "s5"), MK.mid),
};
// The GoldenPass Express's cars, from chnarrow.cars.js, carried here so
// BLS's trains draw them whichever file loaded first.
for (const [k] of [...GPX_BLS.units, ...GPX_BLS_TOWARD_ZWEISIMMEN.units]) { TYPES[k] ??= NG_TYPES[k]; MODELS[k] ??= NG_MODELS[k]; }
// Every car drawn the other way round (its cab, if any, at the right): the
// key with "R" added. A formation's units face either way, and so does
// the second unit of two coupled; the last car of a train is mirrored by
// consist.js already, which an "R" car is not (it is drawn mirrored here).
for (const key of Object.keys(MODELS)) {
  const m = MODELS[key];
  MODELS[key + "R"] = { len: m.len, oneEnd: false, variant: m.variant,
    draw: (c) => `<g transform="matrix(-1 0 0 1 ${c.L} 0)">${m.draw({ ...c, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: c.coupledL, cabL: c.cabR, cabR: c.cabL })}</g>` };
  TYPES[key + "R"] = { ...TYPES[key] };
}

// ---------- Fleets: EVN ranges ----------
// European Vehicle Numbers as 12-digit numbers. The Train Formation Service
// gives BLS's, SOB's, Thurbo's GTWs and TPF's motor cars one EVN per unit
// (94 85 7 SSS NNN C, the same on every car of the unit); SBB-built series
// (FLIRT Evo, RABe 531/533) one per car (94 85 K SSS NNN C, K the car in the
// unit, 1-2 the end cars). A range per series covers every K (0-9). Loco-
// hauled stock (the Domino's B and ABt, 50 85 29-43 / 39-43) by its own
// numbers. A unit's number maps to its first end car; the formation's
// model names (FORMATION below) say which car each one is.
// [series, first unit, last unit, key, K digits]
const mu = (series, a, b, key, ks = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) =>
  ks.map((k) => [Number(`9485${k}${series}${String(a).padStart(3, "0")}0`), Number(`9485${k}${series}${String(b).padStart(3, "0")}9`), key]);
export const FLEETS = {
  // BLS (its fleet list, 2026): MUTZ 515 001-039, NINA 525 001-037, MIKA
  // RE 528 101-137, MIKA S 528 201-228, Lötschberger 535 101-125.
  bls: [...mu(515, 1, 39, "blsMutzCab"), ...mu(525, 1, 37, "blsNinaCab"), ...mu(528, 101, 137, "blsMikaCabRe"), ...mu(528, 201, 228, "blsMikaCabS"),
    ...mu(535, 101, 125, "blsLbCab")],
  // SOB: FLIRT 3 526 001-013, FLIRT 526 041-063, Traverso 526 101-130 and
  // 201-230 (the two halves).
  sob: [...mu(526, 1, 13, "sobF3Cab"), ...mu(526, 41, 63, "sobF1Cab"), ...mu(526, 101, 130, "sobTvCab1"), ...mu(526, 201, 230, "sobTvCab2")],
  // Thurbo: GTW 526 680-805 (and ex-RM 260-286); FLIRT Evo 531 401-430,
  // 533 301-358 (three cars) and 533 501-519 (four cars): end cars K 1-2,
  // middle cars K 3-4.
  thurbo: [...mu(526, 680, 805, "thbGtwCabA"), ...mu(526, 260, 286, "thbGtwCabA"),
    ...mu(533, 501, 519, "thbEvoCab4", [0, 1, 2, 7]), ...mu(533, 501, 519, "thbEvoMid4", [3, 4]),
    ...mu(531, 401, 430, "thbEvoCab3", [0, 1, 2, 7]), ...mu(531, 401, 430, "thbEvoMid3", [3, 4, 5]),
    ...mu(533, 301, 358, "thbEvoCab3", [0, 1, 2, 7]), ...mu(533, 301, 358, "thbEvoMid3", [3, 4, 5])],
  // RegionAlps: NINA 525 038-041, Domino RBDe 560 401-416 and ABt 39-43
  // 941-956, FLIRT Evo 533 701-724.
  regionalps: [...mu(525, 38, 41, "raNinaCab"), ...mu(560, 401, 416, "raDomRBDe"), [508539439410, 508539439569, "raDomABt"],
    ...mu(533, 701, 724, "thbEvoCab4", [0, 1, 2, 7]), ...mu(533, 701, 724, "thbEvoMid4", [3, 4])],
  // TPF: FLIRT 527 191-198; Domino RBDe 560 235-247 with B 29-43 and ABt
  // 39-43 (the ranges its formations show).
  tpf: [...mu(527, 191, 198, "tpfF1Cab"), ...mu(242, 101, 110, "tpfMgABe"), ...mu(560, 235, 247, "tpfDomRBDe"), [508529431000, 508529431999, "tpfDomB"], [508539438000, 508539438999, "tpfDomABt"]],
  // transN: FLIRT 527 331-333 and 523 074-077; SZU: Be 552 (510) 511-516,
  // 571-575, Re 450 551-552; Travys: RBDe 560 384-385.
  chstdother: [...mu(527, 331, 333, "trnF1Cab"), ...mu(523, 74, 77, "trnF1Cab"), ...mu(552, 511, 575, "szuBe552Cab"), ...mu(510, 511, 575, "szuBe552Cab"),
    [918544505510, 918544505529, "szuRe450"], ...mu(560, 384, 385, "trvDomRBDe")],
};

// ---------- Formations: each car by its model name ----------
// What the Train Formation Service names each vehicle (typeCodeName), as
// read from its answers (October 2026): BLS "RABe528_RE_3", "RABe528_S_4",
// "RABe515_2", "RABe515_6_3", "RABe525_3_2", "RABe525_4_1", "RABe535_3" (the
// car's place in its unit last; class "1" or "12" where first class is);
// SOB "At526", "A526", "B526", "Bt526" (a Traverso, eight cars) or "Bt526",
// "B526-C", "B526-D", "ABt526" (a FLIRT, four); Thurbo "ABt526 AKL(F)",
// "B526 AKL", "Re526 AKL" (a GTW's power module), "Bt526" and "Bt1_533",
// "AB4_533", "AB3_533", "Bt2_533" (FLIRT Evo); TPF "RBDe-TPF", "B-TPF(W)",
// "ABt-TPF" (Domino) and "Bt527-TPF", "B527-TPF", "ABt527-TPF" (FLIRT). The
// cars come in running order; each unit faces either way. A unit is a run of
// cars with one EVN, or (no EVN, or one per car) a run from one end car to
// the next. Its cars are drawn in their own order, its leading cab facing
// left, the trailing one right.
function units(cars, cabOf) {
  const out = [];
  let cur = [], cabs = 0;
  cars.forEach((car, i) => {
    const prev = cars[i - 1];
    const newEvn = prev && car.number && prev.number && car.number !== prev.number && car.number.slice(0, 4) === "9485" && prev.number.slice(0, 4) === "9485" &&
      car.number.slice(5, 11) !== prev.number.slice(5, 11);
    if (cur.length && (newEvn || cabs >= 2)) { out.push(cur); cur = []; cabs = 0; }
    cur.push(i);
    if (cabOf(car)) cabs++;
  });
  if (cur.length) out.push(cur);
  return out;
}
// The key for car i of a formation, through a per-railway table: name(car,
// k, unit) gives the car's key in its unit's own (drawn) order (k: its
// index there, unit: its cars), and order(unit) says whether the unit runs
// as drawn (true) or reversed (false).
function viaUnits(cabOf, name, forward) {
  return (car, i, cars) => {
    const us = units(cars, cabOf);
    const u = us.find((x) => x.includes(i));
    const members = u.map((j) => cars[j]);
    const fwd = forward(members);
    const ordered = fwd ? members : [...members].reverse();
    const k = ordered.indexOf(car);
    const key = name(car, k, ordered);
    if (!key) return null;
    const pos = u.indexOf(i);
    // A cab: at the unit's front, as drawn (nose left); at its back, "R".
    if (MODELS[key]?.oneEnd) return pos === 0 ? key : key + "R";
    return fwd ? key : key + "R";
  };
}
const idx = (m) => Number((/_(\d)$/.exec(m || "") || [])[1] || 0);
// BLS: the unit's own car number in the model's last digit.
const blsByIndex = (key) => (car, k, unit) => {
  const m = car.model || "", n = unit.length;
  if (/528_RE/.test(m)) return ["blsMikaCabRe", "blsMikaRe2", "blsMikaRe3", "blsMikaRe4", "blsMikaRe5", "blsMikaCabRe"][k] || null;
  if (/528_S/.test(m)) return ["blsMikaCabS", "blsMikaS2", "blsMikaS3", "blsMikaS4", "blsMikaS5", "blsMikaCabS"][k] || null;
  if (/515/.test(m)) return n >= 6 ? ["blsMutzCab", "blsMutzAB", "blsMutzABr", "blsMutzB", "blsMutzB", "blsMutzCab"][k] || null : ["blsMutzCab", "blsMutzAB", "blsMutzB", "blsMutzCab"][k] || null;
  if (/535/.test(m)) return ["blsLbCab", "blsLbB", "blsLbA", "blsLbCab"][k] || null;
  if (/525/.test(m)) return k === 0 || k === n - 1 ? "blsNinaCab" : /1/.test(car.cls || "") ? "blsNinaA" : "blsNinaB";
  return null;
};
// MIKA: the model's car 1 is the drawing's car 6 (first class in the
// model's cars 3-4 = the drawing's 4-3), so a unit listed 6..1 runs as drawn.
const blsForward = (unit) => {
  const a = idx(unit[0].model), b = idx(unit[unit.length - 1].model);
  return /528/.test(unit[0].model || "") ? a > b : a <= b;
};
const blsCab = (car) => { const m = car.model || "", k = idx(m); return k === 1 || (/528/.test(m) ? k === 6 : /515_6/.test(m) ? k === 6 : /515/.test(m) ? k === 4 : /535/.test(m) ? k === 4 : /525_(\d)/.test(m) ? k === Number(/525_(\d)/.exec(m)[1]) : false); };
// SOB.
const sobCab = (car) => /^(A?Bt|At)/.test(car.model || "");
const sobName = (car, k, unit) => {
  const m = car.model || "", unitNo = Number((car.number || "").slice(8, 11)) || 0;
  if (unit.length >= 7 || unitNo >= 100) {
    // The Traverso: At, A, B, B | B, B, B, Bt.
    return ["sobTvCab1", "sobTvMidA", "sobTvMid2", "sobTvMid3", "sobTvMid3R", "sobTvMid2R", "sobTvMid1R", "sobTvCab2R"][k] ?? null;
  }
  const f1 = unitNo >= 41 || /-[CD]$/.test(m);
  if (/^ABt/.test(m)) return f1 ? "sobF1CabA" : "sobF3CabA";
  if (/^Bt/.test(m)) return f1 ? "sobF1Cab" : "sobF3Cab";
  return f1 ? (k === 1 ? "sobF1Mid" : "sobF1Mid2") : (k === 1 ? "sobF3Mid1" : "sobF3Mid2");
};
// The Traverso is drawn At first; the FLIRTs Bt first.
const sobForward = (unit) => (unit.length >= 7 ? /^At/.test(unit[0].model || "") : /^Bt/.test(unit[0].model || ""));
// The trailing end car of a Traverso is named "...R" in the table already.
function sobFormation(car, i, cars) {
  const us = units(cars, sobCab), u = us.find((x) => x.includes(i)), members = u.map((j) => cars[j]);
  if (members.length >= 7) {
    const fwd = sobForward(members), ordered = fwd ? members : [...members].reverse();
    const key = sobName(ordered[ordered.indexOf(car)], ordered.indexOf(car), ordered);
    if (!key) return null;
    if (fwd) return key;
    return key.endsWith("R") ? key.slice(0, -1) : key + "R";
  }
  return viaUnits(sobCab, sobName, sobForward)(car, i, cars);
}
// Thurbo.
const thbCab = (car) => /^(A?Bt|Bt\d)/.test(car.model || "");
const thbName = (car, k, unit) => {
  const m = car.model || "";
  if (/533|531/.test(m)) {
    const four = unit.length >= 4;
    if (/^Bt/.test(m)) return four ? "thbEvoCab4" : "thbEvoCab3";
    return four ? (/AB4|B4/.test(m) ? "thbEvoMid4" : "thbEvoMid4p") : "thbEvoMid3";
  }
  if (/^Re/.test(m)) return "thbGtwPower";
  const nextB = unit[k + 1] && /^B526/.test(unit[k + 1].model || "") || unit[k - 1] && /^B526/.test(unit[k - 1].model || "");
  if (/^ABt/.test(m)) return nextB ? "thbGtwCabAJ" : "thbGtwCabA";
  if (/^Bt/.test(m)) return nextB ? "thbGtwCabBJ" : "thbGtwCabB";
  if (/^B/.test(m)) return "thbGtwMid";
  return null;
};
// Drawn order: GTW 2/6 ABt, Re, Bt; 2/8 ABt, B, Re, Bt (the middle car's
// Jakobs truck at its left); Evo Bt1, AB4, AB3, Bt2.
const thbForward = (unit) => {
  const m0 = unit[0].model || "";
  return /533|531/.test(m0) ? /Bt1/.test(m0) : /^ABt/.test(m0);
};
const tpfCab = (car) => /^(RBDe|A?Bt|A?Be)/.test(car.model || "");
const tpfName = (car, k, unit) => {
  const m = car.model || "";
  if (/^ABe/.test(m)) return "tpfMgABe";
  if (/^Be/.test(m)) return "tpfMgBe";
  if (/^B/.test(m) && unit.some((x) => /^A?Be/.test(x.model || ""))) return "tpfMgB";
  if (/527/.test(m)) return /^ABt/.test(m) ? "tpfF1CabA" : /^Bt/.test(m) ? "tpfF1Cab" : k === 1 ? "tpfF1Mid" : "tpfF1Mid2";
  if (/^RBDe/.test(m)) return "tpfDomRBDe";
  if (/^ABt/.test(m)) return "tpfDomABt";
  if (/^B/.test(m)) return "tpfDomB";
  return null;
};
const tpfForward = (unit) => /^(RBDe|Bt|ABe)/.test(unit[0].model || "");
const otherName = (car, k, unit) => {
  const m = car.model || "";
  if (/52[37]/.test(m)) return /^A?Bt|_1$/.test(m) || k === 0 || k === unit.length - 1 ? "trnF1Cab" : k === 1 ? "trnF1Mid" : "trnF1Mid2";
  if (/^RBDe/.test(m)) return "sbbDomRBDe";
  if (/^ABt/.test(m)) return "sbbDomABt";
  if (/^B/.test(m)) return "sbbDomB";
  return null;
};
const raName = (car, k, unit) => {
  const m = car.model || "";
  if (/525/.test(m)) return k === 0 || k === unit.length - 1 ? "raNinaCab" : "raNinaA";
  if (/533/.test(m)) return thbName(car, k, unit);
  if (/^RBDe/.test(m)) return "raDomRBDe";
  if (/^ABt/.test(m)) return "raDomABt";
  if (/^B/.test(m)) return "raDomB";
  return null;
};
const anyCab = (car) => /^(RBDe|A?Bt|At|Bt\d)/.test(car.model || "") || /_1$/.test(car.model || "");
export const FORMATION = {
  bls: viaUnits(blsCab, blsByIndex(), blsForward),
  sob: sobFormation,
  thurbo: viaUnits(thbCab, thbName, thbForward),
  tpf: viaUnits(tpfCab, tpfName, tpfForward),
  regionalps: viaUnits(anyCab, raName, (u) => /^(RBDe|Bt|At)|_1$/.test(u[0].model || "")),
  chstdother: viaUnits(anyCab, otherName, (u) => /^(RBDe|Bt)|_1$/.test(u[0].model || "")),
};

// ---------- Typical trains ----------
const set = (label, ...units) => ({ label, units });
// A unit's cars, drawn as it runs: its trailing cars in "R".
const unitOf = (...keys) => keys.map((k) => [k, 1]);
const two = (a, b) => [...a, ...b.map(([k, n]) => [k.endsWith("R") ? k.slice(0, -1) : k + "R", n]).reverse()];
const MIKA_RE = unitOf("blsMikaCabRe", "blsMikaRe2", "blsMikaRe3", "blsMikaRe4", "blsMikaRe5", "blsMikaCabReR");
const MIKA_S = unitOf("blsMikaCabS", "blsMikaS2", "blsMikaS3", "blsMikaS4", "blsMikaS5", "blsMikaCabSR");
const MUTZ4 = unitOf("blsMutzCab", "blsMutzAB", "blsMutzB", "blsMutzCabR");
const MUTZ6 = unitOf("blsMutzCab", "blsMutzAB", "blsMutzABr", "blsMutzB", "blsMutzB", "blsMutzCabR");
const NINA3 = unitOf("blsNinaCab", "blsNinaA", "blsNinaCabR");
const NINA4 = unitOf("blsNinaCab", "blsNinaA", "blsNinaB", "blsNinaCabR");
const LB = unitOf("blsLbCab", "blsLbB", "blsLbA", "blsLbCabR");
const TRAVERSO = unitOf("sobTvCab1", "sobTvMidA", "sobTvMid2", "sobTvMid3", "sobTvMid3R", "sobTvMid2R", "sobTvMid1R", "sobTvCab2R");
const SOB_F1 = unitOf("sobF1Cab", "sobF1Mid", "sobF1Mid2", "sobF1CabAR");
const SOB_F3 = unitOf("sobF3Cab", "sobF3Mid1", "sobF3Mid2", "sobF3CabAR");
const GTW26 = unitOf("thbGtwCabA", "thbGtwPower", "thbGtwCabBR");
const GTW28 = unitOf("thbGtwCabAJ", "thbGtwMid", "thbGtwPower", "thbGtwCabBR");
const EVO4 = unitOf("thbEvoCab4", "thbEvoMid4", "thbEvoMid4p", "thbEvoCab4R");
const DOM = (p) => unitOf(`${p}DomRBDe`, `${p}DomB`, `${p}DomABtR`);
const RA_NINA = unitOf("raNinaCab", "raNinaA", "raNinaCabR");
const TPF_F = unitOf("tpfF1Cab", "tpfF1Mid", "tpfF1Mid2", "tpfF1CabAR");
const TRN_F = unitOf("trnF1Cab", "trnF1Mid", "trnF1Mid2", "trnF1CabR");
const BE552 = unitOf("szuBe552Cab", "szuBe552Mid", "szuBe552CabR");
const SIHLTAL = [["szuRe450", 1], ["szuDpzB", 3], ["szuDpzBtR", 1]];
const lineNo = (t) => (String(t.route || "").match(/^([A-Z]+)\s*(\d*)/) || []).slice(1).join(" ").trim();
const plain = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const ends = (t) => `${plain(t.origin)}|${plain(t.destination)}`;
// What usually runs each line (BLS's fleet pages and the Train Formation
// Service's answers for the lines' trains, October 2026; Wikipedia).
export const TYPICAL = {
  // BLS: the MIKA RE on the RE and IR lines (RE 1, 7, 11, IR 56, 66; IC 51
  // and IC 61's BLS legs), the Spiez–Zweisimmen R 11 too; MUTZ on S 1, S 3,
  // S 31 and, six cars, on IR 17 and IR 65; NINA on S 5, S 52, S 35, S 36,
  // S 11 and S 22; the MIKA S on S 2, S 4, S 6, S 7 and S 77; Lötschbergers
  // on S 21, S 41, S 42, S 44, S 45 and the Lötschberg's and Simmental's
  // regional trains (R 12, RE 8, RE 9, RE 12).
  bls: (t) => {
    const r = lineNo(t);
    // The GoldenPass Express's standard-gauge leg: MOB's Prestige coaches
    // behind a BLS Re 465 (both drawn in chnarrow.cars.js), the Re 465
    // leading toward Interlaken.
    if (/GoldenPass/i.test(t.route || "")) return /Interlaken/.test(t.destination || "") ? GPX_BLS : GPX_BLS_TOWARD_ZWEISIMMEN;
    if (/^IR (17|65)$/.test(r)) return set("MUTZ (RABe 515): a six-car double-deck unit (often two)", ...MUTZ6);
    if (/^S (1|3|31)$/.test(r)) return set("MUTZ (RABe 515): a four-car double-deck unit, usually two coupled", ...two(MUTZ4, MUTZ4));
    if (/^S (5|52|35|36|11|22|46)$/.test(r)) return set("NINA (RABe 525): three- or four-car low-floor units, often two coupled", ...two(NINA3, NINA4));
    if (/^S (2|4|6|7|77)$/.test(r)) return set("MIKA S-Bahn (RABe 528.2): a six-car FLIRT", ...MIKA_S);
    if (/^S (21|41|42|44|45)$/.test(r) || /^(R 12|RE 8|RE 9|RE 12|R)$/.test(r)) return set("Lötschberger (RABe 535): a four-car low-floor unit (often two or three coupled)", ...LB);
    if (/^S/.test(r)) return set("NINA (RABe 525): a three-car low-floor unit", ...NINA3);
    return set("MIKA (RABe 528.1): a six-car FLIRT, one door a side on each car (often two)", ...MIKA_RE);
  },
  // SOB: the Traverso on its long-distance lines (Voralpen-Express, Treno
  // Gottardo IR 26/46, Aare Linth IR 35, Alpenrhein-Express IR 13, IR 17's
  // SOB trains); its FLIRTs on the S-Bahn lines (the FLIRT 3s on S 13 and S
  // 40, the first FLIRTs on S 4, S 6, S 17, S 81 and the rest).
  sob: (t) => {
    const r = lineNo(t);
    if (/^(IR|VAE|PE|EXT|RE)/.test(r) || /Voralpen|Gottardo|Linth|Alpenrhein/i.test(t.route || "")) return set("Traverso (RABe 526 1xx/2xx): eight cars, first class in cars 1-2", ...TRAVERSO);
    if (/^S (13|40|31|42)$/.test(r) || /^SN/.test(r)) return set("FLIRT 3 (RABe 526 0xx): a four-car unit (often two)", ...SOB_F3);
    return set("FLIRT (RABe 526 041-063): a four-car unit (often two)", ...SOB_F1);
  },
  // Thurbo: GTWs everywhere; the FLIRT Evo on the S 26 (Winterthur–Rüti)
  // since July 2026.
  thurbo: (t) => {
    const r = lineNo(t);
    if (r === "S 26") return set("FLIRT Evo (RABe 533 5xx): a four-car unit (some trains still a GTW)", ...EVO4);
    if (/^(RE|IR|SN)/.test(r) || /^S (1|10|12|14|30|35|41|7|5)$/.test(r)) return set("GTW (RABe 526): a four-section unit (2/8), often two", ...GTW28);
    return set("GTW (RABe 526): a three- or four-section unit", ...GTW26);
  },
  // RegionAlps: Dominos on the R 91 (Brig–St-Gingolph), NINAs on the
  // Martigny–Orsières/Le Châble lines; FLIRT Evos arriving during 2026.
  regionalps: (t) => {
    const e = ends(t);
    if (/Orsieres|Chable|Sembrancher|Martigny-(Bourg|Croix|Expo)/.test(e)) return set("NINA (RABe 525): a three-car low-floor unit", ...RA_NINA);
    return set("Domino: RBDe 560 motor car, middle car and driving trailer (often two)", ...DOM("ra"));
  },
  // TPF: FLIRTs on the RER Fribourg S 20/S 21; Dominos (two coupled) on the
  // RE 2 and RE 3 Bulle/Broc–Fribourg–Bern.
  tpf: (t) => {
    const r = lineNo(t);
    if (/^S (50|51|60)$/.test(r) || r === "R") return set("Stadler ABe 2/4 – B – Be 2/4 (metre gauge): a three-car unit", ...unitOf("tpfMgABe", "tpfMgB", "tpfMgBeR"));
    if (/^S (20|21)$/.test(r)) return set("FLIRT (RABe 527): a four-car unit", ...TPF_F);
    return set("Domino: two three-car sets, RBDe 560, middle car, ABt", ...two(DOM("tpf"), DOM("tpf")));
  },
  // The smaller railways: SZU's Uetliberg line (S 10, two Be 552 coupled)
  // and Sihltal line (S 4, a Re 450 with double-deck coaches); transN's
  // FLIRTs (R 21 Buttes–Neuchâtel); OeBB's S 22 an SBB Domino; Travys's
  // Vallée de Joux trains its Dominos.
  chstdother: (t) => {
    const r = lineNo(t), e = ends(t);
    if (/Uetliberg|Triemli|Ringlikon/.test(e) || r === "S 10") return set("Be 552 (Uetlibergbahn): two three-car units", ...two(BE552, BE552));
    if (/Sihl|Langnau-Gattikon|Selnau|Saalsporthalle/.test(e) || r === "S 4" || r === "SN 4") return set("Re 450 with double-deck coaches (SZU's Sihltal trains)", ...SIHLTAL);
    if (/Oensingen|Balsthal/.test(e)) return set("Domino (SBB's): RBDe 560, middle car, ABt", ...DOM("sbb"));
    if (/Brassus|Le Pont|Vallorbe/.test(e)) return set("Domino (Travys): RBDe 560, middle car, ABt", ...DOM("trv"));
    return set("FLIRT (transN): a four-car unit", ...TRN_F);
  },
};

// ---------- Fact sheets ----------
const WP = "https://de.wikipedia.org/wiki/";
const mika = { model: "BLS RABe 528 \"MIKA\" (Stadler FLIRT)", type: "Electric multiple unit", builder: "Stadler Rail", built: "2020–2025", fleet: "30 RE (528 101–130, 7 more from 2025) and 28 S-Bahn units (528 201–228)",
  topSpeedMph: 99, lengthFt: 344, source: `${WP}BLS_RABe_528` };
const mutz = { model: "BLS RABe 515 \"MUTZ\" (Stadler KISS)", type: "Double-deck electric multiple unit", builder: "Stadler Rail", built: "2012–2014; eight lengthened to six cars 2021", fleet: "39 (515 001–039)",
  topSpeedMph: 99, source: "https://www.bls.ch/de/freizeit-und-ferien/charter/flotte-rabe-515-mutz" };
const nina = { model: "RABe 525 \"NINA\"", type: "Low-floor electric multiple unit", builder: "Vevey Technologies (Bombardier)", built: "2003–2009; refitted 2015–2019", fleet: "37 with BLS, 4 with RegionAlps",
  topSpeedMph: 87, source: `${WP}BLS_RABe_525` };
const lb = { model: "BLS RABe 535 \"Lötschberger\"", type: "Low-floor electric multiple unit", builder: "Bombardier (Vevey)", built: "2008–2012; refitted 2024–2027", fleet: "25 (535 101–125)",
  topSpeedMph: 99, seats: 150, lengthFt: 206, source: "https://www.bls.ch/en/unternehmen/ueber-uns/flotte/flotte-rabe-535-loetschberger" };
const tv = { model: "SOB RABe 526 \"Traverso\" (Stadler FLIRT 3)", type: "Electric multiple unit", builder: "Stadler Rail", built: "2018–2025", fleet: "30 eight-car units (526 101/201–130/230)",
  topSpeedMph: 99, seats: 359, lengthFt: 493, source: `${WP}SOB_Traverso` };
const sobf = { model: "SOB RABe 526 (Stadler FLIRT)", type: "Electric multiple unit", builder: "Stadler Rail", built: "2007–2013 (041–063); FLIRT 3 2019–2024 (001–013)", fleet: "23 + 13 four-car units",
  topSpeedMph: 99, source: `${WP}Stadler_Flirt` };
const gtw = { model: "Thurbo RABe 526 (Stadler GTW)", type: "Articulated electric multiple unit", builder: "Stadler Rail", built: "2003–2013", fleet: "About 108 (GTW 2/6 and 2/8)",
  topSpeedMph: 87, source: `${WP}Stadler_GTW_3._Generation` };
const evo = { model: "Stadler FLIRT Evo (RABe 531/533)", type: "Electric multiple unit", builder: "Stadler Rail", built: "2024–", fleet: "107 ordered by Thurbo, 24 by RegionAlps",
  topSpeedMph: 99, source: `${WP}Stadler_Flirt` };
const dom = { model: "NPZ \"Domino\" (RBDe 560, B, ABt)", type: "Electric push-pull set", builder: "SIG, SWS, Schindler; ABB/BBC (rebuilt 2008–2014, new middle cars by Bombardier)", built: "1984–1996",
  topSpeedMph: 87, source: `${WP}SBB_RBDe_4/4` };
const flirt1 = { model: "Stadler FLIRT", type: "Electric multiple unit", builder: "Stadler Rail", topSpeedMph: 99, source: `${WP}Stadler_Flirt` };
const part = (f, about) => ({ ...f, about });
export const FACTS = {
  blsMikaCabRe: part(mika, "An end car of the RE version (one door a side on each car). First class fills car 4 and half of car 3 (the cars counted from this end), the bistro corner with snack and coffee machines is in car 5."),
  blsMikaRe2: part(mika, "A second-class car."), blsMikaRe3: part(mika, "Second class and, behind the yellow line, first class."),
  blsMikaRe4: part(mika, "First class throughout."), blsMikaRe5: part(mika, "Second class with the bistro corner."),
  blsMikaCabS: part(mika, "An end car of the S-Bahn version (two doors a side on each car, the S-Bahn Bern sign at the inner end)."),
  blsMikaS2: part(mika, "Second class."), blsMikaS3: part(mika, "Second class, first class at the end by car 4; the pantograph on its roof."),
  blsMikaS4: part(mika, "First class at the end by car 3, then second class."), blsMikaS5: part(mika, "Second class."),
  blsMutzCab: part(mutz, "An end car: the cab, then the double deck between two doors."), blsMutzAB: part(mutz, "First class upstairs (and part of the lower deck), the yellow line along it."),
  blsMutzABr: part(mutz, "The six-car units' second car with first class."), blsMutzB: part(mutz, "Second class on both decks."),
  blsNinaCab: part(nina, "An end car; the S-Bahn Bern sign at its inner end."), blsNinaA: part(nina, "First class (the yellow line) and second class."), blsNinaB: part(nina, "The four-car units' extra car, second class."),
  blsLbCab: part(lb, "An end car; the first refitted units carry the MIKA's colors."), blsLbB: part(lb, "Second class."), blsLbA: part(lb, "First class throughout."),
  sobTvCab1: part(tv, "Car 1: the cab and first class. The copper paint stands for SOB's history (SOB)."), sobTvMidA: part(tv, "Car 2: first class."),
  sobTvMid1: part(tv, "Second class."), sobTvMid2: part(tv, "Second class; a pantograph on its roof."), sobTvMid3: part(tv, "Where the two halves meet: the lines the Traverso runs on its side."),
  sobTvCab2: part(tv, "Car 8: the cab and second class."),
  sobF1Cab: part(sobf, "The first FLIRTs (2007, 2013), silver with SOB's red, on the S-Bahn lines."), sobF1CabA: part(sobf, "The end car with first class."), sobF1Mid: part(sobf, "The pantograph car."), sobF1Mid2: part(sobf, "Second class."),
  sobF3Cab: part(sobf, "The FLIRT 3s, painted like the Traverso but silver."), sobF3CabA: part(sobf, "The end car with first class."), sobF3Mid1: part(sobf, "Second class."), sobF3Mid2: part(sobf, "The pantograph car."),
  thbGtwCabA: part(gtw, "The end car with first class (the yellow line)."), thbGtwCabB: part(gtw, "An end car, second class."), thbGtwMid: part(gtw, "The GTW 2/8's middle car."),
  thbGtwPower: part(gtw, "The power module: the motor truck, transformer and pantograph, the gangway through it. 93 GTWs go back to Stadler from 2026 for MÁV in Hungary."),
  thbEvoCab4: part(evo, "Thurbo's first FLIRT Evos entered service on the S 26 (Winterthur–Rüti) on 6 July 2026; every door a different color."),
  thbEvoMid4: part(evo, "First class at the end by car 3."), thbEvoMid4p: part(evo, "First class at the end by car 2; the pantograph."), thbEvoCab3: part(evo, "The three-car version."), thbEvoMid3: part(evo, "The three-car version's middle car."),
  raDomRBDe: part(dom, "RegionAlps's Dominos (RBDe 560 401–416) on the R 91 Brig–St-Gingolph."), raDomB: part(dom, "The low-floor middle car."), raDomABt: part(dom, "The driving trailer with first class."),
  raNinaCab: part(nina, "RegionAlps's four NINAs (525 038–041) on the Martigny–Orsières and Le Châble lines."), raNinaA: part(nina, "First and second class."),
  tpfDomRBDe: part(dom, "TPF's Dominos (RBDe 560 235–247), two sets coupled, on the RE Bulle–Fribourg–Bern; to be replaced by FLIRT Evos from 2028."), tpfDomB: part(dom, "The middle car."), tpfDomABt: part(dom, "The driving trailer with first class."),
  tpfF1Cab: part({ ...flirt1, built: "2011–2014", fleet: "8 (RABe 527 191–198)" }, "TPF's FLIRTs, on the RER Fribourg's S 20 and S 21."), tpfF1CabA: part({ ...flirt1, fleet: "8 (RABe 527 191–198)" }, "The end car with first class."),
  tpfMgABe: { model: "TPF ABe 2/4 – B – Be 2/4", type: "Metre-gauge electric multiple unit", builder: "Stadler Rail", built: "2015–2016, 2023–2024", fleet: "10 (101–110)", source: `${WP}Transports_publics_fribourgeois`,
    about: "TPF's metre-gauge units on the S 50, S 51 and Bulle–Montbovon lines; first class behind this cab." },
  tpfMgB: { model: "TPF ABe 2/4 – B – Be 2/4", type: "Metre-gauge electric multiple unit", builder: "Stadler Rail", source: `${WP}Transports_publics_fribourgeois`, about: "The middle car." },
  tpfMgBe: { model: "TPF ABe 2/4 – B – Be 2/4", type: "Metre-gauge electric multiple unit", builder: "Stadler Rail", source: `${WP}Transports_publics_fribourgeois`, about: "The second motor car, second class." },
  tpfF1Mid: part(flirt1, "The pantograph car."), tpfF1Mid2: part(flirt1, "Second class."),
  trnF1Cab: part({ ...flirt1, fleet: "3 (RABe 527 331–333) and 4 (523 074–077)" }, "transN's FLIRTs, on the Val-de-Travers line (R 21) and around Neuchâtel."), trnF1Mid: part(flirt1, "The pantograph car."), trnF1Mid2: part(flirt1, "Second class."),
  sbbDomRBDe: part(dom, "SBB's Dominos, as OeBB runs them on the S 22 Oensingen–Balsthal."), sbbDomB: part(dom, "The middle car."), sbbDomABt: part(dom, "The driving trailer."),
  trvDomRBDe: part(dom, "Travys's Dominos (RBDe 560 384–385) on the Vallée de Joux line."), trvDomB: part(dom, "The middle car."), trvDomABt: part(dom, "The driving trailer with first class."),
  szuBe552Cab: { model: "SZU Be 552 (Be 510)", type: "Electric multiple unit", builder: "Stadler Rail", built: "2013, 2022", fleet: "11 (511–516, 571–575)", lengthFt: 164, source: `${WP}SZU_Be_552`,
    about: "The Uetliberg line's three-car units (15 kV since 2022), usually two coupled; the middle car carries both motor trucks." },
  szuBe552Mid: { model: "SZU Be 552 (Be 510)", type: "Electric multiple unit", builder: "Stadler Rail", source: `${WP}SZU_Be_552`, about: "The motor car in the middle." },
  szuRe450: { model: "Re 450 (SZU)", type: "Electric locomotive", builder: "SLM, ABB", built: "1989–1997", fleet: "2 with SZU (551–552)", lengthFt: 60.4, source: `${WP}SBB_Re_450`,
    about: "One cab: it stays at the Zürich end of the Sihltal's double-deck trains. Stadler's new units replace them from 2028." },
  szuDpzB: { model: "Double-deck coach (DPZ)", type: "Passenger coach", builder: "Schindler", built: "1989–1997", lengthFt: 87.9, source: `${WP}Sihltal-Zürich-Uetliberg-Bahn`, about: "SZU's red double-deck coaches on the S 4." },
  szuDpzBt: { model: "Double-deck driving trailer (DPZ)", type: "Driving trailer", builder: "Schindler", built: "1989–1997", lengthFt: 87.9, source: `${WP}Sihltal-Zürich-Uetliberg-Bahn`, about: "At the Langnau-Gattikon end." },
};
FACTS.thbGtwCabAJ = FACTS.thbGtwCabA;
FACTS.thbGtwCabBJ = FACTS.thbGtwCabB;
for (const k of Object.keys(FACTS)) FACTS[k + "R"] = FACTS[k];
