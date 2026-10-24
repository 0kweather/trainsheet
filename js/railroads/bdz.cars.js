// БДЖ – Пътнически превози's cars (scripts/railroads/bdz.py). The feed's
// vehicle positions name the train ("Train 1611"), not the unit, so every
// train is drawn as what usually runs on it, labeled as typical: by its
// category, its ends and whether it runs under the wires all the way
// (OFF_WIRE, below). Trainsheet's own side views from published dimensions
// and photographs (Wikimedia Commons, the BDZ coach register
// bgvagoni.weebly.com and the railway press, 2018-2026), at the shared scale
// (js/carart.js), each in the paint most of its class wears in 2026,
// lettered here (no logo files). Bodies and parts from czechia.cars.js,
// digitraffic.cars.js and carmodels.js; the Electroputere body and the
// Coradia Stream's and Desiro's outlines as romania.cars.js draws them.

import { C, rect, circle, path, line, lines, poly, truck, pantograph, slats, underframe, win } from "../carart.js?v=dev";
import { mark, letters, buffers, hvac, hvLine, exhaust, tank, twinEnded, unit, euroLoco } from "./czechia.cars.js?v=dev";
import { roofCover, panGear, horns as dtHorns, lamp as dtLamp, RED_LAMP, wiper, emuFront, frames } from "./digitraffic.cars.js?v=dev";
import { bilevel, coachCar, newId } from "../carmodels.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 3, depth = 1.3) => underframe(a, b, top, { depth, boxes: k, tanks: false });
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
const COND = "'Arial Narrow', 'Roboto Condensed', 'Helvetica Neue', Helvetica, Arial, sans-serif";

// ---------- BDZ's marks ----------
// The winged emblem as the 2020s liveries carry it (the Smartrons' sides,
// the Coradia Streams' noses): two wings, each a stepped trapezoid in
// outline with three feathers inside joined at the wing's root, either side
// of a tall pointed shaft, outline with a bar inside; h tall, centered.
function wingsPath(h) {
  const k = h;
  const wing = (s) => {
    const X = (x) => n(s * x * k), Y = (y) => n(y * k);
    // The wing's outline: wide at the top, stepping in toward its foot.
    const outline = `M${X(0.11)} ${Y(-0.36)}L${X(0.62)} ${Y(-0.44)}L${X(0.56)} ${Y(-0.3)}L${X(0.5)} ${Y(-0.3)}L${X(0.42)} ${Y(-0.08)}L${X(0.36)} ${Y(-0.08)}` +
      `L${X(0.28)} ${Y(0.14)}L${X(0.22)} ${Y(0.14)}L${X(0.14)} ${Y(0.38)}L${X(0.11)} ${Y(0.38)}Z`;
    // Three feathers from the root, shortening downward, and the root bar.
    const feathers = [[-0.25, 0.47], [-0.04, 0.37], [0.17, 0.27]].map(([y, x1]) => `M${X(0.15)} ${Y(y)}L${X(x1)} ${Y(y)}L${X(x1 - 0.03)} ${Y(y + 0.09)}L${X(0.15)} ${Y(y + 0.09)}Z`).join("") +
      `M${X(0.15)} ${Y(-0.25)}L${X(0.2)} ${Y(-0.25)}L${X(0.2)} ${Y(0.3)}L${X(0.15)} ${Y(0.3)}Z`;
    return { outline, feathers };
  };
  const l = wing(-1), r = wing(1);
  const shaft = `M0 ${n(-0.52 * k)}L${n(0.06 * k)} ${n(-0.42 * k)}L${n(0.06 * k)} ${n(0.42 * k)}L0 ${n(0.52 * k)}L${n(-0.06 * k)} ${n(0.42 * k)}L${n(-0.06 * k)} ${n(-0.42 * k)}Z`;
  return { outlines: l.outline + r.outline + shaft, fills: l.feathers + r.feathers + `M${n(-0.02 * k)} ${n(-0.38 * k)}L${n(0.02 * k)} ${n(-0.38 * k)}L${n(0.02 * k)} ${n(0.38 * k)}L${n(-0.02 * k)} ${n(0.38 * k)}Z` };
}
const wings = (c, x, y, h, color) => {
  const w = wingsPath(h);
  return mark(c, x, y, `<path d="${w.outlines}" fill="none" stroke="${color}" stroke-width="${n(0.05 * h)}"/><path d="${w.fills}" fill="${color}"/>`);
};
// "БДЖ", the emblem, "BDZ", as on the Smartrons' and the Coradias' sides.
const bdzMark = (c, x, y, h, color) => wings(c, x, y, h, color) +
  letters(c, x - 1.0 * h, y + 0.04 * h, 0.44 * h, "БДЖ", color, { weight: 500, family: COND }) +
  letters(c, x + 1.0 * h, y + 0.04 * h, 0.44 * h, "BDZ", color, { weight: 500, family: COND });
// The emblem as the older stock carries it: "БДЖ" over a pair of swept
// wings, three lines each, either side of a round-topped "Д" plate; w wide.
const classicEmblem = (c, x, y, w, color) => {
  const k = w;
  const wingL = [-0.06, 0.02, 0.1].map((dy, i) => `M${n(-0.09 * k)} ${n(dy * k)}L${n((-0.5 + i * 0.05) * k)} ${n((dy - 0.05) * k)}L${n((-0.5 + i * 0.05) * k)} ${n((dy - 0.02) * k)}L${n(-0.09 * k)} ${n((dy + 0.035) * k)}Z`).join("");
  const wingR = wingL.replace(/(-?[\d.]+) (-?[\d.]+)/g, (m, a, b) => `${n(-Number(a))} ${b}`);
  const plate = `M${n(-0.09 * k)} ${n(0.16 * k)}L${n(-0.09 * k)} ${n(-0.08 * k)}Q${n(-0.09 * k)} ${n(-0.17 * k)} 0 ${n(-0.17 * k)}Q${n(0.09 * k)} ${n(-0.17 * k)} ${n(0.09 * k)} ${n(-0.08 * k)}L${n(0.09 * k)} ${n(0.16 * k)}Z`;
  return mark(c, x, y, `<path d="${wingL}${wingR}${plate}" fill="${color}"/>` +
    `<text x="0" y="${n(-0.2 * k)}" font-size="${n(0.16 * k)}" text-anchor="middle" font-weight="700" font-family="${SANS}" fill="${color}">БДЖ</text>`);
};

// ---------- Locomotives: shared parts ----------
const lampL = (x, y, w = 0.45, h = 0.45, color = "#fff4cf") => rect(x, y, w, h, color, 0.35, 'rx="0.15"');
const grab = (x, y0, y1) => line(x, y0, x, y1, "currentColor", 0.6);
// A four-axle locomotive with a cab at each end, drawn as its left half and
// that half mirrored (twinEnded). o: roof, sill, x0 (where the body begins
// behind the buffers), nose (points from the bottom up), screen ([p, q] of
// the windshield seen edge-on), doors (x, w; door window), rows (windows
// [{ xs, y, w, h }]), paint(c, L) the whole side's colors (drawn under each
// half, unmirrored unless symmetric: the cab end's paint at both ends), over(c, L) lettering drawn once, centers, wb,
// wheel, pans ([x...] pantograph positions, the trailing one up), roof(c,
// L) roof gear, under(c, L).
function cabLoco(c, o) {
  const L = c.L, { roof, sill, x0 } = o;
  const half = (cc) => bilevel({ ...cc, cabL: true, cabR: false }, {
    roof, sill, cornerR: o.cornerR ?? 1.0, end: x0, noTrucks: true, nose: o.nose, badge: false, cabLen: 0, base: o.base ?? "#888",
    paint: () => (cc.far && !o.symmetric ? `<g transform="matrix(-1 0 0 1 ${L} 0)">${o.paint(c, L)}</g>` : o.paint(c, L)),
    doors: (o.doors || []).map((d) => ({ x: d.x, w: d.w, y0: sill + (d.dy ?? 0.4), y1: d.top, glass: d.glass !== false, glassY: d.glassY ?? 0.58, glassH: d.glassH ?? 0.3, grabs: false, fill: "rgba(0,0,0,0.04)" })),
    rows: o.rows || [],
    extra: () => {
      let s = o.screen ? o.screen() : "";
      s += buffers(0, -1, { end: x0, sill, y: 3.45 });
      for (const d of o.doors || []) s += grab(d.x - 0.3, sill + 1.0, d.top - 1.2) + grab(d.x + d.w + 0.3, sill + 1.0, d.top - 1.2) + rect(d.x - 0.1, sill - 0.7, d.w + 0.2, 0.22, "currentColor");
      s += o.front ? o.front() : "";
      return s;
    },
  });
  const id = newId(), clip = `<clipPath id="${id}"><rect x="-5" y="-5" width="${n(L / 2 + 5.3)}" height="30"/></clipPath>`;
  let s = o.trucksBehind ? [-1, 1].map((k) => truck(L / 2 + (k * o.centers) / 2, { wb: o.wb, d: o.wheel, kind: "loco", top: o.sill, axles: o.axles ?? 2 })).join("") : "";
  s += clip + `<g clip-path="url(#${id})">${half({ ...c, coupledL: false, coupledR: false })}</g>` +
    `<g transform="matrix(-1 0 0 1 ${L} 0)"><g clip-path="url(#${id})">${half({ ...c, far: true, mirrored: !c.mirrored, coupledL: false, coupledR: false })}</g></g>`;
  if (!o.trucksBehind) for (const k of [-1, 1]) s += truck(L / 2 + (k * o.centers) / 2, { wb: o.wb, d: o.wheel, kind: "loco", top: sill, axles: o.axles ?? 2 });
  if (o.under) s += o.under(c, L);
  if (o.pans) o.pans.forEach((x, i) => (s += pantograph(x, roof + 0.55, { up: i === o.pans.length - 1, facing: i ? -1 : 1 })));
  if (o.roofGear) s += o.roofGear(c, L);
  if (o.over) s += o.over(c, L);
  return s;
}

// ---------- Siemens Smartron (class 80) ----------
// Siemens' Vectron-bodied single-system locomotive (25 kV), BDZ's 80 035-042,
// 044, 048, 049, 051-054 (2020-2021) and 80 070-079 (2024-2026): 18.98 m
// over the buffers, Bo'Bo' on 1250 mm wheels, bogies 9.5 m apart; the
// Vectron's flat, upright front under a short raked windshield, a crew door
// behind each cab, louvers high along the machine room, a pantograph at
// each end. Its "Green Force" paint, chosen by public vote in 2020
// (photographs, 80 035 at Sofia 2025, 80 049 at Burgas 2025, 80 071 at
// Sofia 2025): the cab's roof and upper face blue, a white swath sweeping
// down from the roof behind the cab to the nose, the machine room green
// over a lime and a sky-blue band that dip to a point under the emblem
// mid-side, a white line, blue along the bottom; "БДЖ", the winged emblem
// and "BDZ" in white, big, high in the middle.
const SM = { blue: "#2a62ae", sky: "#2fa9e1", lime: "#8cc63e", green: "#1ea24b", white: "#eef1ee", louver: "#4a5056", roof: "#5b6167" };
const NOSE_VECTRON = [[1.4, 4.1], [1.4, 7.3], ["q", 1.45, 8.3, 2.1, 9.0], [3.0, 12.3], ["q", 3.3, 12.9, 4.3, 12.9]];
function smPaint(c, L) {
  const m = L / 2;
  let s = bands(L, [[0, 20, SM.green], [11.75, 3, SM.roof], [5.55, 1.3, SM.sky], [6.85, 0.45, SM.lime], [0, 5.4, SM.blue], [5.4, 0.15, SM.white]]);
  // Mid-side the green comes down in a point to the white line, edged in
  // lime, cutting the sky-blue band in two.
  s += path(`M${n(m - 7)} 7.3Q${n(m - 1.6)} 7.3 ${n(m)} 5.55Q${n(m + 1.6)} 7.3 ${n(m + 7)} 7.3L${n(m + 7)} 6.85Q${n(m + 1.3)} 6.85 ${n(m)} 5.55Q${n(m - 1.3)} 6.85 ${n(m - 7)} 6.85Z`, SM.lime);
  s += path(`M${n(m - 7)} 7.3Q${n(m - 1.6)} 7.3 ${n(m)} 5.55Q${n(m + 1.6)} 7.3 ${n(m + 7)} 7.3L${n(m + 7)} 7.4L${n(m - 7)} 7.4Z`, SM.green);
  // The cab: blue over the roof and down the upper face, the white swath
  // sweeping down from behind the cab to the nose's foot, green under the
  // windshield and behind the swath.
  s += path("M-1 20L-1 9.0L1.6 9.0Q3.6 9.2 5.4 11.0L6.8 12.9L6.8 20Z", SM.blue);
  s += path("M5.0 12.9L7.0 12.9Q6.0 10.6 4.4 8.2Q3.0 6.4 2.6 5.55L1.0 5.55Q1.8 7.0 3.0 8.8Q4.2 10.9 5.0 12.9Z", SM.white);
  s += path("M7.0 12.9L9.9 12.9L9.9 11.0Q8.6 9.8 7.6 8.3L7.0 7.6Z", SM.white);
  s += path("M-1 5.55L1.0 5.55Q1.8 7.0 3.0 8.8L-1 8.8Z", SM.green) + rect(-1, 8.8, 3.4, 0.3, SM.white);
  return s;
}
const smOver = (c, L) => bdzMark(c, L / 2, 8.9, 2.4, SM.white) + letters(c, 7.6, 5.0, 0.42, "1", SM.white, { weight: 500 });
const smartron = (c) => euroLoco(c, { roof: 12.9, sill: 4.1, nose: NOSE_VECTRON, rake: [[2.1, 9.0], [3.0, 12.3]], centers: 31.2, door: 6.4,
  paint: smPaint, over: smOver, surround: "#16181b", grilles: [[-19.0, 10.0, 11.75, 12.65], [9.0, 10.0, 11.75, 12.65], [-4.0, 8.0, 11.75, 12.65]], grilleFill: "rgba(20,22,25,0.6)" });

// ---------- Škoda's class 44 and 45 ----------
// Škoda Plzeň's 73E and 74E (BDZ 44 001-089, 1975-1980, and 45 001-060,
// 1982-1983), the mainstay of BDZ's trains: 16.5 m over the buffers, Bo'Bo'
// on 1250 mm wheels, bogies 7.85 m apart; a cab at each end behind a nearly
// upright front with two windshields, the cab door with its window in the
// side; the machine room between, eight small windows high under the roof
// edge (three, two, three) over a long louvered grille; the body's red
// skirt deep, hiding the bogies' tops; a pantograph over each cab, the
// breaker and insulators between them, two vent hoods. BDZ red (as
// measured on 44 146 at Sofia, May 2024; 44 107 and 44 138 at Komunari
// 2025, 44 144 at Burgas 2024): the roof gray, a cream band at the
// grille's foot from each end to the grille, a yellow line along the body
// at the cab floor; the number and "BG-BDZPP" small in white behind the
// first cab, the plows striped yellow and black.
const S44 = { red: "#c42a2d", roof: "#8f8a80", cream: "#ebe5d2", yellow: "#f2c21a", frame: "#3a3c3f" };
const NOSE_44 = [[2.95, 2.6], [2.75, 4.6], [2.5, 6.0], [2.5, 9.6], [2.6, 11.0], ["q", 2.9, 12.6, 4.6, 12.6]];
const s44Paint = (c, L) => bands(L, [[0, 20, S44.red], [11.5, 3, S44.roof], [6.6, 0.42, S44.cream], [4.3, 0.18, S44.yellow]]);
// A plow's yellow and black warning stripes, clipped to it.
function hazard(x0, x1, y0, y1) {
  const id = newId();
  return `<clipPath id="${id}"><rect x="${n(x0)}" y="${n(y0)}" width="${n(x1 - x0)}" height="${n(y1 - y0)}"/></clipPath>` + rect(x0, y0, x1 - x0, y1 - y0, "#f2c21a", 0.4) +
    `<g clip-path="url(#${id})">${seq(x0 - (y1 - y0), 0.6, Math.ceil((x1 - x0 + y1 - y0) / 0.6) + 1).map((x) => path(poly([[x, y0], [x + 0.3, y0], [x + 0.3 + (y1 - y0), y1], [x + (y1 - y0), y1]]), "#17191c")).join("")}</g>`;
}
function s44Over(c, L) {
  // The grille, the machine room's windows (not symmetric about the middle,
  // so drawn here, not mirrored with the halves), the number.
  let s = rect(9.1, 6.4, 34.5, 2.9, "#4b4842", 0.4) + slats(9.1, 6.4, 34.5, 2.9, 0.16, "rgba(255,255,255,0.13)") + rect(9.1, 6.6, 34.5, 0.0, "none");
  for (const x of [9.1, 12.9, 16.8, 22.3, 26.2, 31.7, 35.7, 39.8]) s += rect(x, 9.7, 3.15, 1.0, C.glass, 0, `rx="0.28" stroke="${C.gasket}" stroke-width="0.6" vector-effect="non-scaling-stroke"`);
  s += letters(c, 12.1, 5.45, 0.46, "91 52 00 44 146-6  BG-BDZPP", "#f1ede2", { weight: 400 });
  return s;
}
const s44 = (c) => cabLoco(c, { roof: 12.6, sill: 2.6, x0: 2.95, nose: NOSE_44, centers: 25.75, wb: 10.2, wheel: 49, base: S44.red, paint: s44Paint, over: s44Over, trucksBehind: true,
  doors: [{ x: 4.7, w: 2.25, dy: 2.5, top: 10.8, glassY: 0.6, glassH: 0.36 }],
  screen: () => path(poly([[2.52, 8.2], [2.62, 10.9], [3.1, 10.9], [3.0, 8.2]]), C.glass) + lampL(2.3, 5.2, 0.4, 0.42) + rect(2.35, 4.6, 0.35, 0.3, "#d8262c", 0.3, 'rx="0.1"') +
    rect(3.4, 12.5, 2.4, 0.7, S44.roof, 0.4, 'rx="0.3"') + hazard(2.95, 3.9, 0.3, 2.6) + rect(5.0, 1.0, 0.25, 1.5, "currentColor") + lines([[4.6, 1.4, 5.6, 1.4], [4.6, 2.0, 5.6, 2.0]], "currentColor", 0.6),
  under: (cc, L) => underframe(L / 2 - 6.5, L / 2 + 6.5, 2.6, { depth: 0.9, boxes: 2, tanks: true }),
  pans: [14.0, 39.2],
  roofGear: (cc, L) => [[18.7, 21.5], [30.4, 32.9]].map(([a, b]) => path(poly([[a, 12.55], [a + 0.5, 13.6], [b - 0.5, 13.6], [b, 12.55]]), "#3c3e41", 0.4) + slats(a + 0.6, 12.7, b - a - 1.2, 0.8, 0.3, "rgba(255,255,255,0.2)")).join("") +
    hvLine(17.0, 18.6, 12.6) + hvLine(33.0, 36.0, 12.6) + [23.4, 24.6, 25.9, 27.2, 28.5].map((x) => rect(x - 0.2, 12.6, 0.4, 1.0, "#7a3b2e", 0.3)).join("") + line(23.0, 13.55, 33.0, 13.55, "#5a6068", 0.7) +
    rect(L - 6.0, 12.5, 2.4, 0.7, S44.roof, 0.4, 'rx="0.3"'),
});

// ---------- Electroputere LE 5100, rebuilt (class 46.2) ----------
// Electroputere Craiova's six-axle electric (BDZ 46 001-045, 1986-1987):
// 19.8 m over the buffers, Co'Co' on 1250 mm wheels, a cab at each end
// behind a flat front, round windows high in the machine room. Končar and
// BDZ-Končar rebuilt 18 as 46.2 (1999-2012), 6 of them running in 2026
// (46 205, 208, 211, 221, 229, 235). Their paint (photographs, 46 229 at
// Sofia, July 2025): blue, the roof's edge yellow, the cab end yellow back
// past the cab door with a blue band through it at the windshield's foot
// that ends in an arrowhead pointing at the cab, navy along the bottom;
// "БДЖ" big in yellow mid-side, the number in yellow before it.
const E46 = { blue: "#2c66c0", navy: "#2a3488", yellow: "#f2c71c", roof: "#3d4045" };
const EA = { roof: 12.9, sill: 4.3, x0: 2.1 };
const NOSE_EA = [[EA.x0, EA.sill], [EA.x0, 8.3], [EA.x0 + 0.5, 12.1], ["q", EA.x0 + 0.6, EA.roof, EA.x0 + 1.6, EA.roof]];
const ellipse = (cx, cy, rx, ry) => `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${C.glass}" stroke="currentColor" stroke-width="0.4" vector-effect="non-scaling-stroke"/>`;
function e46Paint(c, L) {
  let s = bands(L, [[0, 20, E46.blue], [12.45, 3, E46.roof], [11.95, 0.5, E46.yellow], [5.3, 0.2, E46.yellow], [0, 5.3, E46.navy]]);
  // The yellow cab end; the blue band at the windshield's foot runs back to
  // a point, where the blue of the side opens out from it like an arrowhead
  // aimed at the cab.
  s += path("M-1 5.3L10.4 5.3L8.4 8.9L10.4 12.45L-1 12.45Z", E46.yellow);
  s += path("M-1 8.0L7.6 8.0L8.4 8.9L7.6 9.75L-1 9.75Z", E46.blue);
  return s;
}
// "БДЖ" big in yellow nearer the cab, the number after it (46 229's side,
// Sofia, July 2025).
const e46Over = (c, L) => letters(c, 22.5, 8.6, 3.2, "БДЖ", E46.yellow, { weight: 400, family: COND }) + letters(c, 31.0, 8.3, 1.0, "46229.1", E46.yellow, { weight: 400, family: COND });
const e46 = (c) => cabLoco(c, { symmetric: true, roof: EA.roof, sill: EA.sill, x0: EA.x0, nose: NOSE_EA, centers: 33.8, wb: 14.3, wheel: 49, axles: 3, cornerR: 0.8, base: E46.blue,
  paint: e46Paint, over: e46Over,
  doors: [{ x: EA.x0 + 7.4, w: 2.3, top: EA.roof - 1.3, glass: true, glassY: 0.6, glassH: 0.28 }],
  rows: [{ xs: [EA.x0 + 1.2], y: 8.6, w: 2.4, h: 2.8, r: 0.3 }, { xs: [EA.x0 + 4.2], y: 8.4, w: 2.5, h: 3.0, r: 0.3 }],
  screen: () => path(poly([[EA.x0 + 0.1, 8.7], [EA.x0 + 0.45, 11.6], [EA.x0 + 0.62, 11.6], [EA.x0 + 0.28, 8.7]]), C.glass) +
    lampL(EA.x0 - 0.05, 6.0, 0.3, 0.75) + lampL(EA.x0 + 0.6, 12.4, 0.5, 0.45) + rect(EA.x0 - 0.1, EA.sill - 1.3, 2.6, 1.3, "currentColor", 0, 'opacity="0.85"') +
    path(poly([[EA.x0 + 0.1, 3.0], [EA.x0 + 3.8, 3.0], [EA.x0 + 3.4, 0.7], [EA.x0 + 0.6, 0.6]]), "#2a2c30", 0, 'opacity="0.9"'),
  under: (cc, L) => underframe(L / 2 - 8, L / 2 + 8, EA.sill, { depth: 1.6, boxes: 2, tanks: true }) + [18.6, 25.4, L - 25.4, L - 18.6].map((x) => ellipse(x, 10.7, 0.55, 0.8)).join(""),
  pans: [65 * 0.27, 65 * 0.73],
  roofGear: (cc, L) => rect(L * 0.27 - 3, EA.roof - 0.05, 6, 0.6, C.steelDark, 0.4, 'rx="0.2"') + rect(L * 0.73 - 3, EA.roof - 0.05, 6, 0.6, C.steelDark, 0.4, 'rx="0.2"') +
    hvLine(L * 0.27 + 3.2, L / 2 - 1.5, EA.roof + 0.55) + hvLine(L * 0.73 - 3.2, L / 2 + 1.5, EA.roof + 0.55) + hvac(L / 2 - 5, EA.roof, 10, 0.6),
});

// ---------- FAUR LDH 125 (class 55) ----------
// FAUR Bucharest's four-axle diesel-hydraulic (BDZ 55 001-160, 1969-1979):
// 13.7 m over the buffers, B'B' on 1000 mm wheels, a hood unit: the cab a
// little off center, the long hood (engine, radiator at its end) and the
// short one either side, walkways along the frame with handrails. BDZ's
// paint on the passenger ones (photographs, 55 057 and 55 174 at Sofia,
// 2024-2025): red hoods and cab, two white lines along the whole side that
// form a chevron on each end, the frame light gray, the buffer beams
// striped yellow and black.
const D55 = { red: "#b52a2f", white: "#ece8e0", frame: "#9ea2a3", roof: "#6f2230" };
function ldh55(c) {
  const L = c.L, deck = 4.4, hood = 11.3, cabTop = 13.6, cab0 = 25.6, cab1 = 33.2;
  let s = buffers(0, -1, { end: 1.4, sill: deck, y: 3.45 }) + buffers(L, 1, { end: 1.4, sill: deck, y: 3.45 });
  // The frame and its walkway; the buffer beams' warning stripes.
  s += rect(1.3, deck - 0.9, L - 2.6, 0.9, D55.frame, 0.5);
  for (const x of [1.3, L - 2.5]) s += rect(x, 2.5, 1.2, 1.0, "#f2c21a", 0.4) + lines([[x, 2.6, x + 0.6, 3.5], [x + 0.6, 2.6, x + 1.2, 3.5]], "#17191c", 1.4);
  // The long hood to the left, the cab, the short hood to the right.
  s += path(poly([[2.2, deck], [2.2, hood - 0.6], ["q", 2.2, hood, 2.8, hood], [cab0, hood], [cab0, deck]]), D55.red, 0.5);
  s += path(poly([[cab0, deck], [cab0, cabTop - 0.7], ["q", cab0, cabTop, cab0 + 0.8, cabTop], [cab1 - 0.8, cabTop], ["q", cab1, cabTop, cab1, cabTop - 0.7], [cab1, deck]]), D55.red, 0.5);
  s += path(poly([[cab1, deck], [cab1, hood - 0.4], [L - 2.8, hood - 0.4], ["q", L - 2.2, hood - 0.4, L - 2.2, hood - 1.0], [L - 2.2, deck]]), D55.red, 0.5);
  // The white lines, sweeping down into a chevron at each hood end.
  // Two white lines along the whole side, hoods and cab (55 057 and 55 174
  // at Sofia, 2024-2025).
  s += rect(2.2, 9.35, L - 4.4, 0.22, D55.white) + rect(2.2, 8.85, L - 4.4, 0.22, D55.white);
  // Hood doors and louvers, the radiator at the long hood's end, the cab
  // windows and door, handrails.
  for (const x of seq(7.6, 3.0, 6)) s += rect(x, 5.0, 2.6, 3.4, "none", 0.45);
  s += rect(3.0, 5.0, 3.6, 5.3, "rgba(20,22,25,0.35)", 0.4) + slats(3.0, 5.0, 3.6, 5.3, 0.3, "rgba(255,255,255,0.2)");
  for (const x of [8.0, 14.0, 20.0]) s += rect(x, 9.9, 2.2, 0.8, "rgba(20,22,25,0.45)", 0.3);
  s += rect(cab0 + 0.7, 9.6, 2.5, 2.6, C.glass, 0.5, 'rx="0.25"') + rect(cab1 - 3.2, 9.6, 2.5, 2.6, C.glass, 0.5, 'rx="0.25"') + rect(cab0 + 3.6, 5.0, 0.4, 6.8, "none", 0.5);
  s += lines([[2.4, deck + 2.2, cab0 - 0.6, deck + 2.2], [cab1 + 0.6, deck + 2.2, L - 2.4, deck + 2.2]], "#c9cdd0", 0.7);
  s += exhaust(cab0 - 6.5, hood) + rect(4.0, hood - 0.05, 4.4, 0.45, "#5a2028", 0.4, 'rx="0.2"');
  // The end boxes over the buffer beams, below the hood tops; the battery
  // and tool boxes on the walkway beside the cab.
  s += rect(1.3, deck, 1.6, 3.4, D55.red, 0.45) + rect(L - 2.9, deck, 1.6, 3.4, D55.red, 0.45) +
    rect(cab0 - 3.2, deck, 3.0, 2.4, D55.red, 0.45) + rect(cab1 + 0.2, deck, 4.2, 1.6, D55.red, 0.45);
  s += lampL(2.0, 9.6, 0.35, 0.6) + lampL(L - 2.35, 9.0, 0.35, 0.6);
  s += tank(L / 2 - 4.5, L / 2 + 3.0, deck - 0.9, 1.5);
  for (const x of [10.0, L - 10.0]) s += truck(x, { wb: 7.2, d: 39, kind: "loco", top: deck - 0.9 });
  return s;
}

// ---------- Luhanskteplovoz TE109 (class 07) ----------
// Luhansk's Co'Co' diesel-electric (BDZ 07 001-091, 1971-1978; DR's 131 and
// 132 are its sisters): 20.62 m over the buffers, 1050 mm wheels, a cab at
// each end behind a short sloping nose. On the lines without wires:
// Varna-Dobrich-Kardam, to Silistra, to Podkova. Measured off 07 069 at
// Plovdiv (Commons, September 2012) rectified, and 07 124 at Donchevo
// (October 2018): BDZ red, the frame and running gear dark gray, the roof
// gray with the radiator fans' raised housing in its middle. From the
// No. 1 cab: its two side windows, a third window, the door; three pairs of
// mesh grilles over the radiators, a louver, two pairs of small windows;
// "БДЖ" big in white toward the No. 2 cab, whose side shows one window and
// its door; "БДЖ" small, the number and a little grille mid-side.
const T07 = { red: "#c3292d", roof: "#6d7073", frame: "#2f3235", white: "#f1efe9" };
const NOSE_07 = [[1.8, 4.75], [1.5, 7.6], [1.65, 9.4], [2.6, 12.0], ["q", 3.0, 13.2, 4.4, 13.2]];
function t07Over(c, L) {
  const W = (x, y, w, h) => rect(x, y, w, h, C.glass, 0, `rx="0.3" stroke="${C.gasket}" stroke-width="0.6" vector-effect="non-scaling-stroke"`);
  const mesh = (x, y, w, h) => { const id = newId(); let m = `<pattern id="${id}" width="0.45" height="0.45" patternUnits="userSpaceOnUse"><circle cx="0.22" cy="0.22" r="0.15" fill="#1c1d1f"/></pattern>`;
    return m + rect(x, y, w, h, T07.red, 0.4) + rect(x, y, w, h, `url(#${id})`); };
  let s = W(2.65, 9.6, 2.6, 2.15) + W(5.65, 9.6, 4.0, 2.15) + W(11.85, 9.6, 3.0, 1.8);
  s += rect(16.45, 5.2, 2.2, 6.2, "rgba(0,0,0,0.04)", 0.6, 'rx="0.2"') + W(16.85, 9.2, 1.4, 1.9);
  for (const x of [20.15, 23.85, 27.45]) s += mesh(x, 8.75, 3.2, 2.5) + mesh(x, 5.6, 3.2, 2.4);
  s += rect(31.45, 9.25, 2.6, 1.5, "rgba(20,22,25,0.35)", 0.4) + slats(31.45, 9.25, 2.6, 1.5, 0.3, "rgba(255,255,255,0.2)");
  for (const x of [35.25, 38.25, 45.05, 48.05]) s += W(x, 8.9, 2.3, 1.7);
  s += mesh(41.3, 5.6, 2.5, 1.0) + letters(c, 42.6, 9.9, 0.5, "БДЖ", T07.white, { weight: 700 }) + letters(c, 42.6, 7.6, 0.55, "07 069.8", T07.white, { weight: 500 });
  s += letters(c, 55.8, 7.65, 4.6, "БДЖ", T07.white, { weight: 700, family: COND });
  s += rect(60.85, 5.2, 1.3, 6.2, "rgba(0,0,0,0.04)", 0.6, 'rx="0.2"') + W(62.65, 9.4, 2.4, 2.0);
  // The roof: the radiators' raised housing, its fan louvers.
  s += path(poly([[19.6, 13.15], [20.6, 13.75], [59.6, 13.75], [60.6, 13.15]]), "#5f6266", 0.4) + rect(37.6, 13.25, 16.0, 0.45, "#222427", 0.3) + slats(37.6, 13.25, 16.0, 0.45, 0.6, "rgba(255,255,255,0.25)");
  return s;
}
const t07 = (c) => cabLoco(c, { roof: 13.2, sill: 4.1, x0: 1.8, nose: NOSE_07, centers: 37.0, wb: 13.8, wheel: 41, axles: 3, base: T07.red, symmetric: true,
  paint: (cc, L) => bands(L, [[0, 20, T07.red], [12.75, 3, T07.roof], [0, 4.75, T07.frame]]),
  screen: () => path(poly([[1.7, 9.5], [2.55, 11.9], [3.1, 11.9], [2.25, 9.5]]), C.glass) + lampL(1.35, 6.6, 0.4, 0.55) + rect(1.4, 5.8, 0.35, 0.32, "#d8262c", 0.3, 'rx="0.1"') +
    hazard(1.8, 3.4, 2.6, 4.1),
  under: (cc, L) => tank(L / 2 - 8, L / 2 + 8, 4.1, 1.6), over: t07Over,
});

// ---------- Siemens Desiro Classic (class 10, class 30 and 31) ----------
// Siemens' Desiro Classic, BDZ's 25 two-car diesel units (class 10, 2005;
// DB's 642) and its electric units built on the same cars (2007-2008): 15
// three-car (class 30, 57.66 m) and 10 four-car (class 31, 73.50 m). The
// end cars 20.85 m (41.7 m a pair), articulated on Jakobs bogies, a motor
// bogie under each cab; the electric units' middle cars 15.9 m; a rounded
// nose under a big raked windshield, a double plug door a side in each
// end car toward its inner end, tall windows; low floors between the
// bogies. The diesel units' paint (photographs, 10 046 at Dimitrovgrad
// 2012, 10 029 at Kyustendil 2018, 10 023 at Pleven 2025): white, the cab
// face and roof edge silver-gray, the windows in a dark gray band; low
// behind the cab a red panel ending in a slant, red slashes trailing off it,
// green along the bottom of the rest of the car; BDZ's emblem in red. The
// first-class end (car B, 12 seats behind the cab) carries a short yellow
// stripe over its first windows and a "1". The electric units' (30 015 at
// Sofia 2016, 31 004 and 30 0xx at Sofia 2024, 30 027 at Dupnitsa and
// 31 017 at Sofia 2025): the cab red from the nose over the roof's front, a
// red band along the roof edge the whole length over a thin white line, the
// windows in a dark band, pale gray below, a green band at floor height;
// the emblem in red on the gray by the cab.
const DES = { white: "#eceeef", silver: "#a9afb5", band: "#959ca3", red: "#d8302f", green: "#5bb54a", skirt: "#2b2e33", yellow: "#f2c714", gray: "#d6d9dc", dark: "#2e3236" };
const NOSE_DES = [[1.2, 2.6], [0.9, 4.4], ["q", 0.8, 6.4, 1.6, 7.6], [4.6, 12.4], ["q", 5.6, 13.8, 7.6, 13.8]];
const desDoor = (x) => ({ x, w: 4.3, y0: 2.6, y1: 11.0, leaves: 2, glassY: 0.42, glassH: 0.5, grabs: false, fill: "#c9cfd6" });
const DES_ROWS_END = [{ xs: [7.0], y: 7.6, w: 1.8, h: 3.4, r: 0.3 }, { xs: [10.6], y: 7.6, w: 2.0, h: 4.4, r: 0.35 }, { xs: seq(14.0, 5.0, 3), y: 7.6, w: 4.2, h: 4.4, r: 0.35 },
  { xs: [29.0], y: 7.6, w: 2.6, h: 4.4, r: 0.3 }, { xs: seq(42.0, 5.0, 4), y: 7.6, w: 4.2, h: 4.4, r: 0.35 }, { xs: [62.2], y: 7.6, w: 2.4, h: 4.4, r: 0.3 }];
// The diesel units' side.
function dmuPaint(first) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, DES.white], [13.1, 3, DES.silver], [7.3, 5.15, DES.band], [0, 2.45, DES.skirt]]);
    s += path("M-1 0L-1 20L9.6 20L9.6 13.1Q8.4 10.0 5.4 4.2L4.8 2.45L-1 2.45Z", DES.silver);
    // The red panel behind the cab, its slanted end, the slashes trailing it.
    s += path("M3.6 2.45L22.6 2.45L26.4 7.3L5.2 7.3Q4.4 5.6 3.6 3.6Z", DES.red);
    for (let k = 0; k < 9; k++) {
      const x = 23.4 + k * 0.85, w = 0.42 - k * 0.03;
      s += path(`M${n(x)} 2.45L${n(x + w)} 2.45L${n(x + w + 3.8)} 7.3L${n(x + 3.8)} 7.3Z`, DES.red);
    }
    s += rect(30.6, 2.45, L - 30.0, 1.25, DES.green);
    if (first) s += rect(13.8, 12.25, 9.2, 0.55, DES.yellow);
    return s;
  };
}
// The electric units' side; part: "cab" or "mid".
function emuPaint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, DES.gray], [13.1, 3, "#a9afb5"], [12.35, 0.85, DES.red], [12.15, 0.2, "#f4f4f2"], [7.3, 4.85, DES.dark], [3.0, 1.05, DES.green], [2.8, 0.2, "#f4f4f2"], [0, 2.45, DES.skirt]]);
    // The red nose (31 004 at Sofia, May 2024): over the roof's front back
    // to behind the cab's side window, its back edge one long curve down to
    // the nose's foot; the window band runs on into it round the cab's side
    // window, the green band under it to the nose.
    if (cab) s += path("M-1 2.45L-1 20L12.4 20L12.4 13.2Q10.8 12.6 9.6 11.2Q6.6 7.6 5.0 4.2Q4.5 3.1 4.2 2.45Z", DES.red) +
      path("M7.6 7.3L11.2 7.3L11.2 12.15L9.4 12.15Q8.6 11.0 7.6 9.4Z", DES.dark);
    return s;
  };
}
const dmuMarks = (cc, first) => classicEmblem(cc, 33.0, 6.0, 2.2, DES.red) + letters(cc, 33.0, 4.4, 0.45, first ? "9552 10 046.4" : "9552 10 045.6", "#2b2e33", { weight: 500 }) +
  letters(cc, 25.0, 10.6, 1.0, first ? "1" : "2", "#e9ecef", { weight: 500 });
function desiroEnd(c, o) {
  const L = c.L;
  return unit(c, { roof: 13.8, sill: 3.4, drop: { a: 18, b: L - 2, y: 2.6 }, nose: NOSE_DES, rake: [[1.6, 7.6], [4.6, 12.4]], depth: 3.6, cabLen: 9, lampY: 4.6,
    rows: DES_ROWS_END, doors: [desDoor(35.6)], trucks: [10.8, "end"], paint: o.paint, surround: "#16181b",
    extra: (cc, g) => (o.diesel ? exhaust(24, 13.8) + tank(20, 30, 3.4, 1.6) + hvac(14, 13.8, 8, 0.6) : roofCover(13, 13.8, 12, 0.85, "#a9afb5", 3)) + hvac(45, 13.8, 10, 0.6) +
      boxes(42, 60, 2.6, 2, 0.4) + (o.marks ? o.marks(cc) : "") });
}
// The electric units' middle car: no cab, a door near one end, the
// pantograph and its breaker on the car next to the A end.
function desiroMid(c) {
  const L = c.L;
  return unit(c, { roof: 13.8, sill: 3.4, drop: { a: 2, b: L - 2, y: 2.6 },
    rows: [{ xs: seq(3.0, 5.0, 4), y: 7.6, w: 4.2, h: 4.4, r: 0.35 }, { xs: seq(30.0, 5.0, 4), y: 7.6, w: 4.2, h: 4.4, r: 0.35 }],
    doors: [desDoor(23.6)], trucks: c.index === c.count - 2 ? [] : ["end"], paint: emuPaint(false),
    extra: (cc, g) => (c.index === 1 ? pantograph(14, 13.8, { up: true, facing: -1 }) + panGear(14, 13.8, 1) : roofCover(8, 13.8, 14, 0.85, "#a9afb5", 3)) + boxes(4, L - 4, 2.6, 2, 0.4) });
}

// ---------- Škoda RegioPanter 18Ev2 (class 34) ----------
// Škoda's four-car electric units for BDZ (34 001-040, 2025-2026, 20 sets
// named after mountains; 5 more ordered): 105.9 m, every car on its own
// bogies, 4.26 m tall, 160 km/h, 333 seats, one class; partly low-floor,
// the doors at the low floor. A rounded nose under a big windshield in a
// black mask, the coupler under a deflector; behind the cab a door-less
// side with the cab's own window, then the passenger windows; one double
// door a side in each end car, two in each middle car. Their paint
// (photographs, 34 001 at Plzeň, November 2025, and Sofia, March and
// September 2026): the nose lime green, a lime band along the roof edge
// the whole length; behind the cab a white swath sweeping down from the
// roof to the nose's foot, blue beyond it fading darker toward a deep blue
// band along the bottom; the doors green; ŠKODA small in the white.
const RP34 = { lime: "#a6d42f", limeDark: "#8fbd25", blue: "#3a9ee2", blueDeep: "#1d5fb4", navy: "#183f8e", white: "#eef1f3", door: "#3aad45", mask: "#16181b", roof: "#8d949c" };
const RP = { roof: 14.0, sill: 4.0, cornerR: 1.1, end: 0.6, trucks: { centers: 60.0, wb: 8.9, d: 33 }, diaphragm: [4.3, 12.6], badge: false };
const rpDoor = (x) => ({ x, w: 4.6, y0: 2.2, y1: 11.3, leaves: 2, glassY: 0.4, glassH: 0.45, fill: RP34.door });
const rpWins = (xs, w = 4.4) => ({ xs, y: 7.2, w, h: 3.4, r: 0.45 });
function rpSide(L, doors, rows) {
  const g = newId();
  return `<defs><linearGradient id="${g}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${RP34.blueDeep}"/><stop offset="1" stop-color="${RP34.blue}"/></linearGradient></defs>` +
    rect(-1, 0, L + 2, 17, `url(#${g})`) + rect(-1, 11.6, L + 2, 4, RP34.lime) + rect(-1, 13.3, L + 2, 2, RP34.roof) + rect(-1, 0, L + 2, 4.6, RP34.navy) +
    doors.map((x) => rect(x - 0.15, 2.1, 4.9, 9.3, RP34.door)).join("") + rows.map((r) => frames(r.xs, r.y, r.w, r.h, 0.15)).join("");
}
function rp34(c, cab) {
  const L = c.L;
  if (cab) {
    // Behind the cab: its side window in the white, one window, the door,
    // then the saloon's windows (34 001, Plzeň, November 2025).
    const rows = [rpWins([10.0], 3.0), rpWins([16.4]), rpWins(seq(29.6, 5.6, 9))];
    return bilevel({ ...c, cabL: true }, { ...RP, drop: { a: 21.4, b: 29.0, y: 2.1 },
      nose: [[1.5, 4.0], [1.0, 6.2], ["q", 0.9, 8.4, 1.9, 9.6], [3.8, 12.8], ["q", 4.5, 14.0, 6.6, 14.0]], cabLen: 8, rows, doors: [rpDoor(22.6)],
      paint: (cc, g) => rpSide(L, [22.6], rows) +
        // The lime nose and cab side, the white swath behind them.
        path("M-1 0L-1 20L13.0 20L13.0 13.3Q9.6 8.2 7.6 4.6L7.0 0Z", RP34.lime) + path("M13.0 13.3Q9.6 8.2 7.6 4.6L7.0 0L9.6 0L10.4 4.6Q12.4 8.4 15.2 12.4L15.2 13.3Z", RP34.white) +
        path(poly([[1.6, 9.4], [3.7, 12.95], [7.6, 12.95], [7.6, 9.4]]), RP34.mask) + path(poly([[1.2, 4.6], [1.0, 6.4], [2.6, 6.4], [2.6, 4.6]]), RP34.mask),
      extra: (cc, g) => hvac(20, g.roof, 12) + roofCover(56, g.roof, 12, 0.5) + rect(9.5, g.roof - 0.05, 4.0, 0.45, C.steelDark, 0.4, 'rx="0.15"') +
        truck(12.0, { wb: 8.9, d: 33, top: 4.0 }) + truck(L - 9.0, { wb: 8.9, d: 33, top: 4.0 }) + boxes(30, L - 15, 4.0, 4, 1.0) +
        letters(cc, 12.6, 6.4, 0.45, "ŠKODA", "#4a5059", { weight: 700 }),
      cab: () => path(poly([[2.0, 9.9], [3.9, 12.6], [7.2, 12.6], [7.2, 9.9]]), C.glass) + path(poly([[2.4, 10.15], [3.4, 11.7], [4.1, 11.7], [3.1, 10.15]]), C.glassLight) +
        wiper(2.6, 10.0, 3.7, 12.0) + dtLamp(1.0, 6.5, 0.55, 0.45) + dtLamp(1.05, 5.7, 0.4, 0.3, RED_LAMP) + dtLamp(5.0, 13.6, 0.7, 0.28) +
        rect(5.2, 12.65, 1.9, 0.3, "#f4a321", 0, 'rx="0.08"') + dtHorns(7.6, 14.15) + emuFront(1.5, 4.0, { coupler: 3.4 }),
      noTrucks: true,
    });
  }
  const rows = [rpWins([2.6]), rpWins(seq(16.0, 5.6, 9)), rpWins([L - 7.0])];
  const doorsX = [8.4, L - 13.6];
  return bilevel({ ...c, cabL: false, cabR: false }, { ...RP, rows, doors: doorsX.map(rpDoor), noTrucks: true,
    paint: (cc, g) => rpSide(L, doorsX, rows),
    extra: (cc, g) => truck(9.0, { wb: 8.9, d: 33, top: 4.0 }) + truck(L - 9.0, { wb: 8.9, d: 33, top: 4.0 }) + hvac(c.pan ? 50 : 18, g.roof, 12) + boxes(18, L - 18, g.sill, 4, 1.2) +
      (c.index === 1 || c.index === 2 ? pantograph(L / 2 - 8, g.roof, { up: c.index === 2, facing: -1 }) + panGear(L / 2 - 8, g.roof, 1) : roofCover(52, g.roof, 12, 0.5)),
  });
}

// ---------- Alstom Coradia Stream (class 35) ----------
// Alstom's six-car low-floor units for BDZ (35 001-, "BG-IR035", 35 sets
// ordered 2024, 12 delivered by August 2026, in service from 1 September
// 2026, four by late September, named after rivers: Дунав, Марица, Искър,
// Струма), the same body as ARF's RE-IR in Romania (romania.cars.js):
// 121 m, articulated on Jakobs bogies, a motor bogie under each cab, 325
// seats in two classes. Their paint (photographs at Sofia, 4 September
// 2026, and BDZ's of 31 August): white; the nose's cap and the windshield's
// surround blue and navy, a green band across the nose under the windshield
// with BDZ's emblem on it; along the side a light blue band at the roof
// edge, the windows in a navy band, blue below, these cut off in slants at
// each door by white; the doors green; "ВАГОН COACH" and the car's number
// on the white over the windows by the door; BDZ's mark in gray low on the
// white. First class: car 1's end behind the cab (its seats in blue, the
// second class's in gray); no outside marking of it has been photographed,
// so none is drawn.
const CS35 = { white: "#f1f2f0", sky: "#2f8fd6", navy: "#1f2a48", blue: "#2a6fc3", green: "#30b24b", cap: "#1e64b4", roof: "#c4c8cc" };
const CS = { roof: 13.9, sill: 3.6, low: 2.6, winY: 6.15, winH: 3.8, doorTop: 11.2 };
const NOSE_CS = [[1.6, 3.6], [0.9, 5.4], ["q", 0.7, 7.2, 1.8, 8.4], [5.6, 12.6], ["q", 6.8, 13.9, 9.2, 13.9]];
const csWin = (xs, w = 5.0) => [{ xs, y: CS.winY, w, h: CS.winH, r: 0.5 }];
const CS_CAB = { cabWin: 13.8, wins: [18.6, 24.8], door: 31.0, back: seq(37.6, 6.45, 5) };
const CS_MID = { wins: [3.4, 22.5, 30.4, 38.4, 55.3], doors: [14.3, 46.4] };
// The side's bands, as photographed at Sofia (4 September 2026): sky blue
// along the roof's edge, a white band above the windows, the windows in a
// navy band, blue below; just ahead of each door a white wedge cuts the
// navy, its point toward the car's end, "БДЖ BDZ" small in gray in it.
const csBands = (x0, x1) => [[12.0, 13.2, CS35.sky], [9.95, 12.0, CS35.white], [5.95, 9.95, CS35.navy], [-1, 5.95, CS35.blue]]
  .map(([y0, y1, f]) => rect(x0, y0, x1 - x0, y1 - y0, f)).join("");
const csWedge = (door) => path(`M${n(door - 12.5)} 12.0L${n(door - 4.6)} 12.0L${n(door - 0.6)} 8.1L${n(door - 4.6)} 6.6L${n(door - 12.5)} 6.6Z`, CS35.white);
const csWedgeMark = (c, door) => wings(c, door - 5.2, 7.35, 0.6, "#8d9399") + letters(c, door - 6.6, 7.4, 0.42, "БДЖ", "#8d9399", { weight: 500 }) + letters(c, door - 3.8, 7.4, 0.42, "BDZ", "#8d9399", { weight: 500 });
function cs35Paint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, CS35.white], [13.0, 3, CS35.roof]]);
    if (cab) {
      // The cab car: white from the nose back to its door, the bands from
      // there on; the nose's blue cap and green band.
      s += csBands(CS_CAB.door + 4.8, L + 2);
      s += path("M-1 20L-1 8.4L8.6 13.0L13.6 13.9L13.6 20Z", CS35.cap) + path("M-1 5.6L-1 8.4Q4 8.6 8.6 11.6Q11.2 12.8 14.6 12.6L13.6 11.2Q10.6 11.0 8.4 9.4Q5.0 7.0 -1 6.6Z", CS35.green);
    } else s += csBands(-1, L + 2) + CS_MID.doors.map(csWedge).join("");
    return s;
  };
}
const csDoor = (x) => ({ x, w: 4.8, y0: CS.low, y1: CS.doorTop, leaves: 2, glassY: 0.38, glassH: 0.48, grabs: false, fill: CS35.green });
function cs35Cab(c) {
  return unit(c, { roof: CS.roof, sill: CS.sill, drop: { a: 22, b: c.L - 3, y: CS.low }, nose: NOSE_CS, rake: [[1.8, 8.4], [5.6, 12.6]], depth: 3.4, cabLen: 12, lampY: 5.0,
    rows: [{ xs: [CS_CAB.cabWin], y: 7.6, w: 1.6, h: 2.6, r: 0.3 }, ...csWin(CS_CAB.wins, 4.6), ...csWin(CS_CAB.back)], doors: [csDoor(CS_CAB.door)],
    trucks: [9.5, "end"], paint: cs35Paint(true), surround: "#141821",
    extra: (cc, g) => rect(12, CS.roof - 0.05, 20, 1.3, "#2a2c30", 0.4, 'rx="0.2"') + hvac(34, CS.roof, 12, 0.9) + boxes(24, g.L - 6, CS.low, 3, 0.4) +
      wings(cc, 3.0, 7.1, 0.75, "#f1f2f0") + letters(cc, 20.3, 4.4, 0.45, "БДЖ BDZ", "#8d9399", { weight: 500 }) });
}
function cs35Mid(c) {
  const L = c.L, pan = c.index === 1 || c.index === 4;
  return unit(c, { roof: CS.roof, sill: CS.sill, drop: { a: 5.5, b: L - 5.5, y: CS.low },
    rows: csWin(CS_MID.wins), doors: CS_MID.doors.map(csDoor), trucks: ["end"], paint: cs35Paint(false),
    extra: (cc, g) => (pan ? pantograph(L - 12, CS.roof + 0.4, { up: c.index === 1, facing: -1 }) + hvLine(L - 9, L - 3, CS.roof + 0.4) : hvac(L - 18, CS.roof, 10, 0.9)) +
      hvac(8, CS.roof, 14, 0.9) + boxes(7, g.L - 7, CS.low, 3, 0.4) +
      CS_MID.doors.map((d) => csWedgeMark(cc, d)).join("") +
      letters(cc, CS_MID.doors[1] + 6.4, 11.75, 0.34, "ВАГОН", "#1f2a48", { weight: 700 }) + letters(cc, CS_MID.doors[1] + 6.4, 11.35, 0.34, "COACH", "#1f2a48", { weight: 700 }) +
      letters(cc, CS_MID.doors[1] + 6.4, 10.55, 0.95, String(Math.min(6, (c.index ?? 0) + 1)), "#1f2a48", { weight: 700 }) });
}

// ---------- Coaches ----------
// The coaches BDZ runs on its fast trains (the register of BDZ's passenger
// cars, bgvagoni.weebly.com, with dated photographs, 2024-2026):
//  - Ex-DB InterCity open coaches (Bpmmz, now series 22-97): 76 bought in
//    2024, 35 more delivered June 2026; 26.4 m, air-conditioned, 80 seats;
//    in DB's paint, light gray with the red band under the windows, the DB
//    mark taken off (a few carry blue film with Bulgarian landmarks: not
//    drawn). The bistro cars (ARkimmbz, series 85-97, 10 bought) carry the
//    trains' first class: two compartments and an open section, and the
//    bistro.
//  - BDZ's own coaches (series 21-50, 29-74, 21-43, 25-63; first class
//    10-50 and 19-40): UIC compartment and open coaches, most in BDZ's
//    dark red over cream, the class numeral in yellow on red by the doors;
//    the first-class ones with a yellow line along the roof edge.
//  - The night trains' couchettes (series 50-80, Bcm) in the red and cream
//    and sleeping cars (series 70-71, WLABmz): pale gray, a red line along
//    the roof edge and one under the windows, the doors red, "СПАЛЕН ВАГОН"
//    and "SCHLAFWAGEN" in yellow on the upper line.
const COACH = { roof: 13.3, sill: 3.9 };
function uicCoach(c, o) {
  const L = c.L, { roof, sill } = COACH, dx = o.door ?? 1.6, dw = o.doorW ?? 2.6;
  const doorXs = o.oneDoor ? [dx] : [dx, L - dx - dw];
  const wins = (o.wins || []).map(([x, w, y, h]) => win(x, y, w, h, 0.45)).join("");
  return coachCar(c, {
    roof, sill, end: 0.6, endR: 1.2, base: o.base, badge: false, under: true,
    trucks: { centers: o.centers ?? 62.3, wb: 8.2, d: 36 }, diaphragm: [4.25, 11.8], rows: o.rows,
    doors: doorXs.map((x) => ({ x, w: dw, h: 7.4, glassY: 0.55, glassH: 0.3 })),
    livery: () => o.paint(c, L) + (o.doorFill ? doorXs.map((x) => rect(x, sill + 0.15, dw, 7.4, o.doorFill)).join("") : ""),
    extra: (cc) => {
      let s = (o.roofGear ? o.roofGear(L) : hvac(L / 2 - 7, roof, 14, 0.7)) + [12, 24, L - 24, L - 12].map((x) => path(`M${x - 1.1} ${roof - 0.05}Q${x} ${roof + 0.7} ${x + 1.1} ${roof - 0.05}Z`, C.steelDark, 0.4)).join("");
      s += buffers(0, -1, { sill }) + buffers(L, 1, { sill });
      return s + wins + (o.marks ? o.marks(cc, L) : "");
    },
  });
}
// BDZ's red and cream (21-43 at Burgas 2026, 29-74 at Sofia 2019-2026,
// 25-63 at Sofia 2026, 19-40 at Ruse 2022): the red from just under the
// windows to the roof, cream below, the doors painted with the side; the
// class numeral by the door, white in a thin white square on second class,
// yellow on first class, which carries a yellow line along the roof edge;
// "BG-BDZPP/БДЖПП" and the number small in red on the cream mid-car.
const BC = { red: "#b4232c", cream: "#ebe3cc", roof: "#a3a6a5", yellow: "#f2c21a" };
const bdzRedPaint = (first) => (c, L) => bands(L, [[0, 20, BC.red], [12.5, 3, BC.roof], [0, 7.4, BC.cream]]) + (first ? rect(-1, 12.25, L + 2, 0.32, BC.yellow) : "");
const classSquare = (c, x, y, cls) => {
  const col = cls === "1" ? BC.yellow : "#f4f2ec";
  return rect(x - 0.55, y - 1.25, 1.1, 2.1, "none", 0, `stroke="${col}" stroke-width="0.6" vector-effect="non-scaling-stroke"`) + letters(c, x, y + 0.15, 1.05, cls, col, { weight: 400 }) +
    rect(x - 0.4, y - 1.1, 0.8, 0.35, "none", 0, `stroke="${col}" stroke-width="0.4" vector-effect="non-scaling-stroke"`);
};
// Second class (29-74, Bm, and 21-50, Bmz): after the door a window, the
// numeral, then ten windows; a small window at the far end by the toilet.
const ROWS_B = [{ a: 13.0, b: 79.0, y: 8.5, w: 4.6, h: 3.5, pitch: 6.5, r: 0.5 }];
const WINS_B = [[5.0, 3.6, 8.5, 3.5]];
// First class (19-40, Ame): its compartments' windows wider apart.
const ROWS_A = [{ a: 13.0, b: 76.0, y: 8.6, w: 4.0, h: 3.3, pitch: 6.6, r: 0.5 }];
const WINS_A = [[5.0, 3.6, 8.5, 3.5], [78.8, 2.6, 8.5, 3.5]];
const bdzMarks = (cls) => (c, L) => classSquare(c, 10.8, 10.4, cls) + (cls === "1" ? classSquare(c, L - 9.5, 10.4, cls) : "") +
  letters(c, L * 0.42, 6.3, 0.42, "BG-BDZPP/БДЖПП", BC.red, { weight: 500 });
const bdz2 = (c) => uicCoach(c, { rows: ROWS_B, wins: WINS_B, base: BC.red, paint: bdzRedPaint(false), marks: bdzMarks("2"), doorFill: BC.red });
const bdz1 = (c) => uicCoach(c, { rows: ROWS_A, wins: WINS_A, base: BC.red, paint: bdzRedPaint(true), marks: bdzMarks("1"), doorFill: BC.red });
// The couchette (50-80, Bcm; at Gorna Oryahovitsa, December 2025): the
// same paint, ten compartment windows with a transom bar.
const COUCH_X = [5.0, ...seq(14.0, 6.75, 10)];
const couchette = (c) => uicCoach(c, { rows: [], wins: COUCH_X.map((x, i) => [x, i ? 4.6 : 3.6, 8.4, 3.6]), base: BC.red, paint: bdzRedPaint(false), doorFill: BC.red,
  marks: (cc, L) => letters(cc, 11.3, 11.0, 1.1, "2", BC.yellow, { weight: 400 }) + rect(11.0, 9.3, 0.6, 0.6, "none", 0, `stroke="${BC.yellow}" stroke-width="0.4" vector-effect="non-scaling-stroke"`) +
    letters(cc, L * 0.36, 6.4, 0.75, "LIEGEWAGEN", BC.red, { weight: 400, spacing: 0.12 }) +
    lines(COUCH_X.map((x, i) => [x + 0.1, 10.4, x + (i ? 4.5 : 3.5), 10.4]), "#4a5058", 0.6) });
// The sleeping car (70-71, WLABmz; 70-71 030 at Burgas and Varna, 2026):
// pale gray, a red line under the roof edge and a broader one under the
// windows, the doors red; "СПАЛЕН ВАГОН" (on the other side
// "SCHLAFWAGEN") in yellow on the upper line toward one end; nine windows.
const SL = { gray: "#e3e5e3", red: "#d42a2f", yellow: "#f0b81c", roof: "#b9bdc0" };
const sleeper = (c) => uicCoach(c, { rows: [{ a: 9.0, b: 79.0, y: 8.3, w: 3.9, h: 3.1, pitch: 6.4, r: 0.5 }], base: SL.gray,
  paint: (cc, L) => bands(L, [[0, 20, SL.gray], [12.5, 3, SL.roof], [11.75, 0.75, SL.red], [6.6, 1.0, SL.red], [0, 4.3, "#c9ccce"]]), doorFill: SL.red, door: 1.3, doorW: 2.8,
  marks: (cc, L) => letters(cc, L * 0.75, 12.12, 0.5, "СПАЛЕН ВАГОН", SL.yellow, { weight: 700 }) + letters(cc, L * 0.42, 5.7, 0.42, "BG-BDZPP/БДЖПП", "#2b2e33", { weight: 500 }) });
// The ex-DB InterCity cars (22-97 088 at Sofia, September 2026; 22-97 019
// and 035, 2026; the bistro 85-97 015, 2025): DB's light gray, a red band a
// little under the windows, a gray skirt; big windows; a plug door at
// each end, a frosted toilet window and the black "2" by the one at the B
// end. The bistro car: one door, at the first-class end, "1" by it, two
// compartment windows, then the bistro's smaller windows to the kitchen
// end; "БИСТРО" in white on the band.
const ICP = { gray: "#e6e7e2", red: "#e0262e", roof: "#a9aeb1", skirt: "#c4c7c8" };
const icPaint = (c, L) => bands(L, [[0, 20, ICP.gray], [12.55, 3, ICP.roof], [6.0, 1.0, ICP.red], [0, 4.8, ICP.skirt]]);
const icNum = (cc, x, cls) => rect(x - 0.6, 8.9, 1.2, 2.4, "#eeefea", 0.35) + letters(cc, x, 10.6, 1.1, cls, "#2b2e33", { weight: 500 });
const IC_Y = 8.2, IC_H = 3.3;
const ic2 = (c) => uicCoach(c, { rows: [{ a: 4.6, b: 73.6, y: IC_Y, w: 4.4, h: IC_H, pitch: 5.7, r: 0.5 }], base: ICP.gray, paint: icPaint, doorFill: ICP.gray, door: 1.0,
  wins: [[78.4, 3.6, IC_Y, IC_H]], marks: (cc) => icNum(cc, 75.9, "2") });
const icBistro = (c) => uicCoach(c, { oneDoor: true, door: 1.0, rows: [{ a: 25.6, b: 83.0, y: IC_Y + 0.2, w: 3.4, h: IC_H - 0.3, pitch: 4.95, r: 0.45 }],
  wins: [[5.6, 4.6, IC_Y, IC_H], [13.4, 4.6, IC_Y, IC_H], [20.2, 4.4, IC_Y, IC_H]], base: ICP.gray, paint: icPaint, doorFill: ICP.gray,
  marks: (cc, L) => icNum(cc, 11.5, "1") + line(20.2, IC_Y + IC_H * 0.55, 24.6, IC_Y + IC_H * 0.55, "#8a9096", 0.6) +
    letters(cc, L * 0.7, 6.5, 0.55, "БИСТРО", "#ffffff", { weight: 700 }) + letters(cc, L * 0.9, 6.5, 0.45, "БДЖ", "#ffffff", { weight: 700 }) });

// ---------- The Rhodope narrow gauge (760 mm) ----------
// Septemvri-Velingrad-Dobrinishte, BDZ's last narrow-gauge line. Henschel's
// diesel-hydraulics (class 75, 1965-1966; 75 004-006, 008 and 009 running)
// work its trains with the Romanian class 77s: 13.04 m, B'B' on 900 mm
// wheels, 3.52 m tall; a cab at each end behind two windshields under a
// round-topped roof with the headlight on it, the side's cab window and
// door, windows and louvers along the machine room. BDZ red (75 009 at
// Velingrad, March 2026): cream lines sweeping back from the nose and
// along the side, the frame dark gray. The coaches (Dryanovo, 1968-1974,
// copies of the Ganz railcars' bodies): 12.4 m, a door at each end, nine
// tall windows in pale frames, teal green, a white "2" by the door.
const NG = { red: "#a52b33", cream: "#e8e0c8", frame: "#3b3e42", roof: "#8a8c8a", green: "#256b63", ngRoof: "#a88d6e" };
// Its side isn't the same both ways (75 009 at Velingrad, March 2026):
// from the No. 1 cab, the cab's side window, the door, a window, the big
// radiator grille, a window, a small grille over a lower one, two windows;
// the cream lines: a diagonal from the nose's foot up to the cab, an arc
// from under the cab window down to the frame, two lines along the side
// broken by the grilles; the number on a black plate and "92 52 06 75
// 009-1 BG-BDZPP" in cream; the frame and skirt dark gray.
function ng75Over(c, L) {
  const W = (x, y, w, h) => rect(x, y, w, h, C.glass, 0, `rx="0.35" stroke="${C.gasket}" stroke-width="0.6" vector-effect="non-scaling-stroke"`);
  const grille = (x, y, w, h) => rect(x, y, w, h, "#6e2a2f", 0.5, 'rx="0.2"') + slats(x, y, w, h, 0.28, "rgba(0,0,0,0.35)");
  let s = W(4.6, 7.2, 2.4, 3.3) + rect(7.4, 3.4, 2.6, 7.4, "rgba(0,0,0,0.04)", 0.6) + W(8.0, 7.5, 1.5, 2.6) + W(10.8, 6.9, 2.6, 3.0);
  s += grille(14.4, 6.6, 6.8, 2.6) + W(24.4, 6.2, 1.8, 2.6) + grille(27.0, 6.3, 2.5, 2.3) + grille(27.0, 3.6, 2.5, 2.3) + W(30.6, 6.2, 1.6, 2.4) + W(34.2, 6.1, 1.6, 2.4);
  const cream = NG.cream;
  s += path("M1.8 6.0L4.6 7.25L4.9 7.0L2.2 5.6Z", cream);
  s += path("M6.6 3.2Q6.4 6.6 8.6 7.0L9.0 6.75Q7.0 6.3 7.1 3.2Z", cream);
  s += rect(9.2, 6.55, 11.6, 0.3, cream) + rect(9.2, 5.95, 8.6, 0.3, cream) + rect(31.8, 5.5, 9.4, 0.25, cream) + rect(33.6, 5.0, 7.6, 0.25, cream);
  s += rect(30.0, 5.2, 1.6, 0.65, "#17191c") + letters(c, 30.8, 5.5, 0.45, "75009-1", cream, { weight: 700 }) +
    letters(c, 18.5, 4.6, 0.4, "92 52 06 75 009-1 BG-BDZPP", cream, { weight: 400 }) + circle(3.0, 11.85, 0.5, "#e9e6da", 0.4);
  return s;
}
const ng75 = (c) => cabLoco(c, { roof: 11.55, sill: 3.2, x0: 1.4, symmetric: true, cornerR: 1.4, base: NG.red,
  nose: [[1.4, 3.2], [1.2, 6.2], [1.7, 8.4], [2.6, 10.6], ["q", 3.0, 11.55, 4.4, 11.55]], centers: 22.4, wb: 6.2, wheel: 35,
  paint: (cc, L) => bands(L, [[0, 20, NG.red], [11.0, 3, NG.roof], [0, 3.4, NG.frame]]),
  screen: () => path(poly([[1.55, 7.0], [2.15, 9.9], [2.75, 9.9], [2.1, 7.0]]), C.glass) + lampL(1.15, 4.4, 0.4, 0.6),
  under: (cc, L) => underframe(L / 2 - 5, L / 2 + 5, 3.2, { depth: 1.0, boxes: 2, tanks: false }), over: ng75Over,
});
function ngCoach(c) {
  const L = c.L, roof = 11.2, sill = 3.0;
  return coachCar(c, {
    roof, sill, end: 0.5, endR: 1.0, base: NG.green, badge: false, under: true,
    trucks: { centers: 27.5, wb: 5.6, d: 26 }, diaphragm: [3.4, 9.8],
    rows: [{ a: 5.4, b: L - 5.4, y: 5.9, w: 2.0, h: 3.8, pitch: 3.15, r: 0.45 }],
    doors: [{ x: 1.4, w: 2.2, h: 6.6, glassY: 0.55, glassH: 0.3 }, { x: L - 3.6, w: 2.2, h: 6.6, glassY: 0.55, glassH: 0.3 }],
    // The windows' pale frames (Velingrad and Dolene, March 2026).
    livery: () => bands(L, [[0, 20, NG.green], [10.4, 3, NG.ngRoof]]) + seq(5.4 + ((L - 10.8 - 2.0) % 3.15) / 2, 3.15, Math.floor((L - 10.8 - 2.0) / 3.15) + 1).map((x) => rect(x - 0.25, 5.65, 2.5, 4.3, "#d9dcd6", 0, 'rx="0.6"')).join(""),
    extra: (cc) => letters(cc, 4.6, 8.0, 1.0, "2", "#eceee9", { weight: 400 }) + letters(cc, L - 4.6, 8.0, 1.0, "2", "#eceee9", { weight: 400 }) +
      buffers(0, -1, { sill, y: 2.4, beam: 1.6 }) + buffers(L, 1, { sill, y: 2.4, beam: 1.6 }),
  });
}

// ---------- Tables ----------
// Each car a type; first class its own type in its real place (the
// Desiro's car B, the Coradia Stream's car 1, the InterCity bistro car,
// BDZ's first-class coach next to the locomotive).
export const TYPES = {
  bg80: { name: "Smartron (class 80) electric locomotive", kind: "electric", pan: true },
  bg44: { name: "Class 44 electric locomotive", kind: "electric", pan: true },
  bg46: { name: "Class 46.2 electric locomotive", kind: "electric", pan: true },
  bg07: { name: "Class 07 diesel locomotive", kind: "diesel" },
  bg55: { name: "Class 55 diesel locomotive", kind: "diesel" },
  bg10A: { name: "Desiro (class 10) car A", kind: "emu" },
  bg10B: { name: "Desiro (class 10) car B with first class", kind: "emu", amenities: ["first"] },
  bg30Cab: { name: "Desiro (class 30) end car", kind: "emu" },
  bg30Mid: { name: "Desiro (class 30/31) middle car", kind: "emu", pan: true },
  bg31Cab: { name: "Desiro (class 31) end car", kind: "emu" },
  bg34Cab: { name: "RegioPanter (class 34) end car", kind: "emu" },
  bg34Mid: { name: "RegioPanter (class 34) middle car", kind: "emu", pan: true },
  bg35First: { name: "Coradia Stream (class 35) end car with first class", kind: "emu", amenities: ["first"] },
  bg35Mid: { name: "Coradia Stream (class 35) middle car", kind: "emu", pan: true },
  bg35Cab: { name: "Coradia Stream (class 35) end car", kind: "emu" },
  bgIc2: { name: "Ex-DB InterCity coach (series 22-97)", kind: "coach" },
  bgIcBistro: { name: "Ex-DB InterCity bistro car with first class (series 85-97)", kind: "coach", amenities: ["first", "cafe"] },
  bgCoach2: { name: "BDZ second-class coach", kind: "coach" },
  bgCoach1: { name: "BDZ first-class coach", kind: "coach", amenities: ["first"] },
  bgCouchette: { name: "Couchette car (series 50-80)", kind: "coach", amenities: ["sleeper"] },
  bgSleeper: { name: "Sleeping car (series 70-71)", kind: "coach", amenities: ["sleeper"] },
  bg75: { name: "Class 75 narrow-gauge diesel locomotive", kind: "diesel" },
  bgNgCoach: { name: "Narrow-gauge coach", kind: "coach" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
const byPlace = (ctx) => `${ctx.index}/${ctx.count}`;
export const MODELS = {
  bg80: M(smartron, 62.27),
  bg44: M(s44, 54.13),
  bg46: M(e46, 64.96),
  bg07: M(t07, 67.65),
  bg55: M(ldh55, 44.95),
  bg10A: M((c) => desiroEnd(c, { diesel: true, paint: dmuPaint(false), marks: (cc) => dmuMarks(cc, false) }), 68.4, true),
  bg10B: M((c) => desiroEnd(c, { diesel: true, paint: dmuPaint(true), marks: (cc) => dmuMarks(cc, true) }), 68.4, true),
  bg30Cab: M((c) => desiroEnd(c, { paint: emuPaint(true), marks: (cc) => classicEmblem(cc, 14.6, 5.4, 2.0, DES.red) + letters(cc, 20.0, 3.55, 0.5, "9452 30 015.6", "#f4f4f2", { weight: 500 }) }), 68.4, true),
  bg31Cab: M((c) => desiroEnd(c, { paint: emuPaint(true), marks: (cc) => classicEmblem(cc, 14.6, 5.4, 2.0, DES.red) + letters(cc, 20.0, 3.55, 0.5, "9452 31 004.9", "#f4f4f2", { weight: 500 }) }), 68.4, true),
  bg30Mid: M(desiroMid, 52.2, false, byPlace),
  bg34Cab: M((c) => rp34(c, true), 88.6, true),
  bg34Mid: M((c) => rp34(c, false), 85.1, false, byIndex),
  bg35First: M(cs35Cab, 70.5, true),
  bg35Mid: M(cs35Mid, 63.9, false, byIndex),
  bg35Cab: M(cs35Cab, 70.5, true),
  bgIc2: M(ic2, 86.6),
  bgIcBistro: M(icBistro, 86.6),
  bgCoach2: M(bdz2, 86.6),
  bgCoach1: M(bdz1, 86.6),
  bgCouchette: M(couchette, 86.6),
  bgSleeper: M(sleeper, 86.6),
  bg75: M(ng75, 42.78),
  bgNgCoach: M(ngCoach, 42.6),
};

// Units by number, for the fleet pages (the feed names none): locomotives
// and units by series and serial run together (80 049 is 80049, 07 124 is
// 7124, the Desiro 10 046 is 10046), coaches by their 12-digit UIC numbers
// (61 52 22-97 013-4 is 615222970134).
export const FLEETS = {
  bdz: [[80035, 80079, "bg80"], [44001, 44199, "bg44"], [45001, 45199, "bg44"], [46201, 46245, "bg46"], [7001, 7199, "bg07"], [55001, 55260, "bg55"],
    [10001, 10050, "bg10B"], [30001, 30030, "bg30Cab"], [31001, 31020, "bg31Cab"], [34001, 34050, "bg34Cab"], [35001, 35070, "bg35First"], [75001, 75010, "bg75"],
    [615222970000, 615222979999, "bgIc2"], [615285970000, 615285979999, "bgIcBistro"], [505221500000, 505221509999, "bgCoach2"], [505210500000, 505210509999, "bgCoach1"],
    [515250800000, 515250809999, "bgCouchette"], [615270710000, 615270719999, "bgSleeper"]],
};

// ---------- Where a train runs ----------
// The stations off the wires: every station BDZ's timetable stops at that
// lies more than 150 m from track OpenStreetMap marks electrified (contact
// line), by its code in the timetable; built October 2026. The branches
// to Peshtera, Cherkvitsa, Troyan, Svishtov, Dobrich and Kardam, Podkova
// (Kardzhali, Haskovo), Kyustendil and Gyueshevo, Panagyurishte and
// Silistra. (The narrow gauge goes by its line's name.)
const OFF_WIRE = new Set([165019, 165027, 165035, 165043, 165050, 165100,
  272021, 272039, 272047, 272054, 272062, 272070, 272088, 272096, 272104, 272112,
  273011, 273029, 273045, 273052, 273060, 273078, 273086, 273094, 273102, 273110, 273128, 273136, 273144, 273151, 273169, 273177, 273185, 273193, 273201,
  274043, 274050, 274068, 274100,
  297028, 297036, 297044, 297051, 297069, 297077, 297085, 297093, 297101, 297119, 297143, 297150, 297168,
  440008, 440016, 440024, 440032, 440040, 440057, 440065, 440107, 440115, 440123, 440131, 440149, 440156, 440164, 440206, 440214, 440222, 440230, 440248, 440255,
  440305, 440313, 440339, 440347,
  650010, 650028, 650036, 650044, 650051, 650069, 650101, 650119, 650127, 650135, 650143, 650200, 650218, 650226, 650234, 650242, 650259, 650267, 650275, 650283,
  650291, 650309,
  811018, 811026, 811034, 811042, 811059, 811067, 811075, 811083, 811091, 811109,
  941013, 941021, 941039, 941047, 941054, 941104, 941112, 941120, 941138, 941146, 941153, 941203, 941211, 941229, 941252, 941260, 941278, 941302]);
// The same branches' ends, for a train whose stops aren't in.
const OFF_WIRE_ENDS = /Добрич|Кардам|Силистра|Исперих|Дулово|Подкова|Кърджали|Хасково|Кюстендил|Гюешево|Троян|Ловеч|Свищов|Черквица|Панагюрище|Пещера|Брацигово/;
// true: every stop under the wires; false: some not.
function runsElectric(t) {
  const ids = (t._progress?.stops || []).map((s) => Number(s.stopId)).filter(Number.isFinite);
  if (ids.length) return !ids.some((id) => OFF_WIRE.has(id));
  return !OFF_WIRE_ENDS.test(`${t.origin || ""} ${t.destination || ""}`);
}

const set = (label, ...units) => ({ label, units });
// What runs (BDZ's announcements and press, August-September 2026, and the
// photographs on the coach register, 2024-2026). The new units are drawn
// only on the trains BDZ has named for them; on the other runs of their
// lines (which BDZ hasn't published) what those lines still mostly run:
//  - Coradia Stream: 10141 Plovdiv-Svilengrad (its first run, 1 September),
//    3625/3620 Sofia-Burgas via Karlovo and 7624/7621 Sofia-Vidin (from
//    26-28 September); BDZ names Plovdiv-Svilengrad, Plovdiv-Asenovgrad,
//    Svilengrad-Sofia and Sofia-Pernik as its first lines.
//  - RegioPanter: 1621 Sofia-Plovdiv, 10249 Plovdiv-Dimitrovgrad, 10112
//    Dimitrovgrad-Sofia (13 August), 5617/5621 Sofia-Blagoevgrad, 5620
//    Blagoevgrad-Sofia and 5616 Petrich-Sofia (19 August), and the first
//    two runs of 14 August, 50111 Sofia 05:20-Blagoevgrad and 10221 Sofia
//    12:00-Kostenets. (7624/7621 went over to the Coradias.)
//  - The Desiro electric units: line 5 (Sofia-Pernik-Radomir-Dupnitsa-
//    Blagoevgrad-Kulata/Petrich), the four-car class 31 Sofia-Karlovo; the
//    Desiro diesel units on the branches off the wires.
//  - The fast trains under the wires: a Smartron or a class 44/45 with ex-
//    DB InterCity coaches on the trains the register shows them on (Sofia-
//    Burgas, -Varna, -Ruse, -Plovdiv, Plovdiv-Varna, Ruse-Plovdiv), BDZ's
//    own coaches on the others; the night trains a couchette and a sleeper.
//  - The other stopping and suburban trains under the wires: a class 44/45
//    with BDZ's coaches (21-43, 25-63 on the register's 2025-2026 runs).
//  - Off the wires: the class 07 with BDZ coaches on the fast trains to
//    Dobrich, Silistra and Podkova, the Desiro diesel units on the rest.
//  - The narrow gauge: a class 75 (or 77) diesel and its coaches.
const SMARTRON_IC = set("Usually a Smartron (class 80) with ex-DB InterCity coaches, first class in the bistro car", ["bg80", 1], ["bgIcBistro", 1], ["bgIc2", 4]);
const S44_IC = set("Usually a class 44/45 with ex-DB InterCity coaches, first class in the bistro car", ["bg44", 1], ["bgIcBistro", 1], ["bgIc2", 3]);
const S44_BV = set("Usually a class 44/45 with BDZ coaches, first class next to the locomotive", ["bg44", 1], ["bgCoach1", 1], ["bgCoach2", 3]);
const NIGHT = set("Usually a Smartron (class 80) with BDZ coaches, a couchette and a sleeping car", ["bg80", 1], ["bgCoach1", 1], ["bgCoach2", 2], ["bgCouchette", 1], ["bgSleeper", 1]);
const D07_BV = set("Usually a class 07 diesel with BDZ coaches", ["bg07", 1], ["bgCoach1", 1], ["bgCoach2", 2]);
const D07_NIGHT = set("Usually a class 07 diesel (a class 44 under the wires) with BDZ coaches and a couchette", ["bg07", 1], ["bgCoach1", 1], ["bgCoach2", 2], ["bgCouchette", 1]);
const S44_PV = set("Usually a class 44/45 with BDZ coaches", ["bg44", 1], ["bgCoach2", 3]);
const S46 = set("A class 46.2 with BDZ coaches", ["bg46", 1], ["bgCoach1", 1], ["bgCoach2", 4]);
const LDH55 = set("A class 55 diesel with BDZ coaches (some branch and shunting turns)", ["bg55", 1], ["bgCoach2", 2]);
const CORADIA = set("Coradia Stream (class 35): six cars, first class at one end", ["bg35First", 1], ["bg35Mid", 4], ["bg35Cab", 1]);
const REGIOPANTER = set("RegioPanter (class 34): four cars, one class", ["bg34Cab", 1], ["bg34Mid", 2], ["bg34Cab", 1]);
const DESIRO30 = set("Usually a Desiro (class 30): three cars, one class", ["bg30Cab", 1], ["bg30Mid", 1], ["bg30Cab", 1]);
const DESIRO31 = set("Usually a Desiro (class 31): four cars, one class", ["bg31Cab", 1], ["bg30Mid", 2], ["bg31Cab", 1]);
const DESIRO10 = set("Usually a Desiro (class 10): two cars, first class behind one cab", ["bg10B", 1], ["bg10A", 1]);
const NARROW = set("A class 75 (or 77) diesel with the narrow gauge's coaches", ["bg75", 1], ["bgNgCoach", 3]);
// A car seen alone (a fleet page's sample, a feed that names one car)
// draws the whole set it runs in.
const BY_MODEL = { bg80: SMARTRON_IC, bg44: S44_BV, bg46: S46, bg07: D07_BV, bg55: LDH55, bg10A: DESIRO10, bg10B: DESIRO10, bg30Cab: DESIRO30, bg30Mid: DESIRO30, bg31Cab: DESIRO31,
  bg34Cab: REGIOPANTER, bg34Mid: REGIOPANTER, bg35First: CORADIA, bg35Mid: CORADIA, bg35Cab: CORADIA, bgIc2: S44_IC, bgIcBistro: S44_IC, bgCoach2: S44_BV, bgCoach1: S44_BV,
  bgCouchette: NIGHT, bgSleeper: NIGHT, bg75: NARROW, bgNgCoach: NARROW };
const CORADIA_TRAINS = new Set([10141, 3620, 3625, 7621, 7624]);
const REGIOPANTER_TRAINS = new Set([1621, 10249, 10112, 5616, 5617, 5620, 5621, 50111, 10221]);
const NIGHT_TRAINS = new Set([2626, 2627, 8626, 8627, 8656, 8657]);
const IC_TRAINS = new Set([1613, 1620, 1622, 2610, 2612, 2613, 2614, 2615, 2617, 2640, 2641, 3621, 3622, 3623, 3624, 4610, 4611, 4631, 4632, 8610, 8611, 8612, 8613,
  8631, 8632, 8650, 8651, 493]);
// The lines BDZ names for the new units, for the label of their other runs.
const NEW_ON = [[/Асеновград|Свиленград/, "BDZ's Coradia Streams also work some of this line's runs since September 2026"],
  [/Перник/, "BDZ's Coradia Streams also work some Sofia–Pernik runs since September 2026"],
  [/Благоевград|Петрич|Костенец|Димитровград|Септември/, "BDZ's RegioPanters also work some of this line's runs since August 2026"]];
const ends = (t) => `${t.origin || ""} | ${t.destination || ""}`;
const SOFIA = /София|Подуяне|Искър|Надежда|Сливница|Казичене|Горна баня|Волуяк/;
const LINE5 = /Перник|Радомир|Дупница|Благоевград|Кулата|Петрич|Генерал Тодоров|Сандански|Земен|Батановци/;
const LINE31 = /Карлово|Копривщица|Клисура|Пирдоп|Златица/;
const noted = (base, e) => {
  const hit = NEW_ON.find(([re]) => re.test(e));
  return hit ? { ...base, label: `${base.label} (${hit[1]})` } : base;
};
export const TYPICAL = {
  bdz: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    const r = t.route || "", k = Number(t.number), e = ends(t);
    if (r === "Родопска теснолинейка") return NARROW;
    if (CORADIA_TRAINS.has(k)) return CORADIA;
    if (REGIOPANTER_TRAINS.has(k)) return REGIOPANTER;
    // A line's page, with no train: what most of BDZ's trains are.
    if (!t.origin && !t.destination) return r === "Родопска теснолинейка" ? NARROW : r === "Бърз влак" || r === "Международен бърз влак" ? S44_BV : S44_PV;
    const electric = runsElectric(t);
    if (r === "Бърз влак" || r === "Международен бърз влак") {
      if (!electric) {
        if (/Кюстендил/.test(e)) return DESIRO10;
        return k === 9646 || k === 9647 ? D07_NIGHT : D07_BV;
      }
      if (NIGHT_TRAINS.has(k)) return NIGHT;
      if (IC_TRAINS.has(k)) return /Бургас|Варна/.test(e) ? SMARTRON_IC : S44_IC;
      if (LINE5.test(e) && SOFIA.test(e)) return noted(DESIRO30, e);
      return noted(S44_BV, e);
    }
    // Stopping and suburban trains.
    if (!electric) return DESIRO10;
    if (LINE5.test(e)) return noted(DESIRO30, e);
    if (LINE31.test(e) && SOFIA.test(e)) return DESIRO31;
    return noted(S44_PV, e);
  },
};

const BG_WP = "https://bg.wikipedia.org/wiki/";
const BGV = "https://bgvagoni.weebly.com/passenger-wagons-bdz.html";
const desiroFacts = { model: "Siemens Desiro Classic (class 10)", type: "Diesel multiple unit", builder: "Siemens", built: "2005", fleet: "25 two-car units, 10 001-10 050",
  topSpeedMph: 75, powerHp: 738, seats: 123, lengthFt: 136.8, source: `${BG_WP}Дизелов_мотрисен_влак_БДЖ_серия_10.00` };
const desiroEmu = { model: "Siemens Desiro (class 30 and 31)", type: "Electric multiple unit", builder: "Siemens", built: "2007–2008",
  fleet: "15 three-car (30) and 10 four-car (31) units", topSpeedMph: 87, seats: 143, source: `${BG_WP}Електрически_мотрисен_влак_БДЖ_серии_30_и_31` };
const rpFacts = { model: "Škoda RegioPanter 18Ev2 (class 34)", type: "Electric multiple unit", builder: "Škoda Group", built: "2025–2026", fleet: "20 four-car units (5 more ordered)",
  topSpeedMph: 99, seats: 333, source: `${BG_WP}Електрически_мотрисен_влак_БДЖ_серия_34.000` };
const csFacts = { model: "Alstom Coradia Stream (class 35)", type: "Electric multiple unit", builder: "Alstom (Bautzen)", built: "2025–2027", fleet: "35 six-car units ordered, 12 delivered by August 2026",
  topSpeedMph: 99, seats: 325, source: "https://www.bta.bg/en/news/bulgaria/1212211-two-more-alstom-electric-trains-begin-operating-in-bulgaria" };
const icFacts = { type: "Passenger coach", builder: "Waggon Union and others for DB (InterCity, 1970s-1980s), rebuilt 2018-2022", lengthFt: 86.6, source: BGV };
export const FACTS = {
  bg80: { model: "Siemens Smartron (class 80)", type: "Electric locomotive", builder: "Siemens Mobility", built: "2020–2026", fleet: "25, 80 035-080 079",
    topSpeedMph: 99, powerHp: 7510, lengthFt: 62.3, source: `${BG_WP}Локомотиви_БДЖ_серия_80.000`,
    about: "Vectron-bodied single-system locomotives, each named after a ruler or a hero of Bulgaria's history (80 035 \"Хан Аспарух\", 80 076 \"Васил Левски\"), in the green, blue and white chosen by public vote in 2020. They haul the main fast trains out of Sofia, to Burgas and Varna above all." },
  bg44: { model: "Škoda 73E and 74E (classes 44 and 45)", type: "Electric locomotive", builder: "Škoda Plzeň", built: "1975–1983", fleet: "89 class 44, 60 class 45 built",
    topSpeedMph: 81, powerHp: 4210, lengthFt: 54.1, source: `${BG_WP}Локомотиви_БДЖ_серии_44_и_45`,
    about: "BDZ's standard electric locomotive for half a century: most of its fast and stopping trains under the wires still run behind one, in red with the cream band." },
  bg46: { model: "Electroputere LE 5100, rebuilt (class 46.2)", type: "Electric locomotive", builder: "Electroputere Craiova; rebuilt by Končar and BDZ-Končar", built: "1986–1987, rebuilt 1999–2012",
    topSpeedMph: 93, powerHp: 6840, lengthFt: 65.0, source: `${BG_WP}Локомотиви_БДЖ_серия_46.000`,
    about: "Six-axle Romanian electrics, the most powerful BDZ has had; eighteen were rebuilt as 46.2, six of them running in 2026 (46 205, 208, 211, 221, 229 and 235), in blue and yellow." },
  bg07: { model: "Luhanskteplovoz TE109 (class 07)", type: "Diesel-electric locomotive", builder: "Luhanskteplovoz", built: "1971–1978", fleet: "91 built",
    topSpeedMph: 62, powerHp: 3000, lengthFt: 67.7, source: `${BG_WP}Локомотиви_БДЖ_серия_07.000`,
    about: "The Soviet six-axle diesel of DR's classes 131 and 132; BDZ's haul its trains off the wires, to Dobrich and Kardam, Silistra and Podkova." },
  bg55: { model: "FAUR LDH 125 (class 55)", type: "Diesel-hydraulic locomotive", builder: "FAUR (23 August), Bucharest", built: "1969–1979", fleet: "160 built",
    topSpeedMph: 62, powerHp: 1250, lengthFt: 45.0, source: `${BG_WP}Локомотиви_БДЖ_серия_55.000`,
    about: "A hood-unit diesel for branch lines and shunting; a few work passenger trains, in wine red with the white chevrons." },
  bg10A: { ...desiroFacts, about: "Two-car diesel units, DB's 642 built for Bulgaria: they work the branches off the wires (Kyustendil, Cherkvitsa, Troyan, Svishtov, Panagyurishte, Peshtera, Dobrich, Podkova). Car A has the toilet and luggage space." },
  bg10B: { ...desiroFacts, about: "Car B has the unit's twelve first-class seats behind its cab, the yellow stripe over their windows." },
  bg31Cab: { ...desiroEmu, about: "The four-car class 31, with two middle cars; on the trains to Karlovo and Koprivshtitsa and on line 5." },
  bg30Cab: { ...desiroEmu, about: "Electric units built on the Desiro's cars for line 5 (Sofia–Pernik–Blagoevgrad–Kulata/Petrich) and the trains to Karlovo and Koprivshtitsa; the cab cars carry the bogie under the cab, the middle cars the pantograph." },
  bg30Mid: { ...desiroEmu, about: "A middle car (C or D): 15.9 m, on Jakobs bogies shared with its neighbours." },
  bg34Cab: { ...rpFacts, about: "Škoda's RegioPanters, the first new trains BDZ has had in twenty years, each named after a mountain; in passenger service from 14 August 2026 on shorter routes out of Sofia and Plovdiv (to Blagoevgrad and Petrich, Kostenets, Plovdiv, Dimitrovgrad)." },
  bg34Mid: { ...rpFacts, about: "One of the unit's two middle cars; one carries the pantograph." },
  bg35First: { ...csFacts, about: "Car 1, with the unit's first class. The Coradia Streams, each named after a river, entered service on 1 September 2026 (Sofia–Svilengrad, Plovdiv–Asenovgrad, Sofia–Pernik), from 26 September also Sofia–Burgas and Sofia–Vidin." },
  bg35Mid: { ...csFacts, about: "A middle car; the articulated cars share their bogies." },
  bg35Cab: { ...csFacts, about: "Car 6, second class." },
  bgIc2: { ...icFacts, model: "Ex-DB InterCity open coach (Bpmmz, series 22-97)", fleet: "66 bought in 2024, 35 more in 2026", seats: 80,
    about: "Second-hand DB InterCity coaches, in service from June 2024 on Sofia–Burgas, then on most of the main fast trains; air-conditioned, still in DB's light gray with the red band." },
  bgIcBistro: { ...icFacts, model: "Ex-DB InterCity bistro car (ARkimmbz, series 85-97)", fleet: "10", seats: 18,
    about: "The InterCity sets' bistro car, with the train's first class: two four-seat compartments and an open section, and the counter." },
  bgCoach2: { model: "BDZ second-class coach (series 21-50, 29-74 and others)", type: "Passenger coach", builder: "Various (UIC types)", lengthFt: 86.6, source: BGV,
    about: "BDZ's own compartment and open coaches, without air conditioning; most in its dark red over cream, the yellow class numeral by the doors." },
  bgCoach1: { model: "BDZ first-class coach (series 10-50, 19-40)", type: "Passenger coach", builder: "Various (UIC types)", lengthFt: 86.6, source: BGV,
    about: "First-class compartment coaches, in BDZ's red and cream with a yellow line along the roof edge." },
  bgCouchette: { model: "Couchette car (Bcm, series 50-80)", type: "Couchette car", lengthFt: 86.6, source: "https://bgvagoni.weebly.com/vagon-51-52-50-80-732-5.html",
    about: "Ex-DB couchette cars of the night trains (to Silistra, Burgas and Varna), in BDZ's red and cream." },
  bgSleeper: { model: "Sleeping car (WLABmz, series 70-71)", type: "Sleeping car", seats: 30, lengthFt: 86.6, source: "https://bgvagoni.weebly.com/vagon-61-52-70-71-030-9.html",
    about: "The night trains Sofia–Varna (2626/2627, 8656/8657) and Sofia–Burgas (8626/8627) carry them: pale gray with red lines, \"СПАЛЕН ВАГОН\" in yellow." },
  bg75: { model: "Henschel DH 1100 BB (class 75)", type: "Narrow-gauge diesel-hydraulic locomotive", builder: "Henschel, Kassel", built: "1965–1966", fleet: "10 built, 5 running",
    topSpeedMph: 43, powerHp: 1100, lengthFt: 42.8, source: `${BG_WP}Локомотиви_БДЖ_серия_75.000`,
    about: "Built for the 760 mm Rhodope line Septemvri–Velingrad–Dobrinishte, the most powerful narrow-gauge diesels in the world in their day; with the Romanian class 77 they still work all its trains." },
  bgNgCoach: { model: "Narrow-gauge coach", type: "Passenger coach (760 mm)", builder: "Vagonen zavod Dryanovo", built: "1968–1974", lengthFt: 42.6,
    source: `${BG_WP}Подвижен_състав_по_теснолинейката_Септември_-_Добринище`, about: "Second-class coaches copied from the Ganz railcars' bodies, 48 seats, in dark green." },
};
