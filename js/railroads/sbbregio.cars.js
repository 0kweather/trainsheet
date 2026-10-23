// SBB's regional trains (scripts/railroads/switzerland.py, agency
// "sbbregio"): the RegioExpress, Regio and S-Bahn trains SBB runs itself
// (Zürich, Bern, Basel, Luzern/Zug, Aargau, St. Gallen, Vaud, Genève and
// the Léman Express, the Jura, Neuchâtel and Fribourg lines) and TILO's in
// Ticino and Lombardy. Trainsheet's own side views, at the shared scale
// (js/carart.js), from the builders' published dimensions and from
// photographs (Wikimedia Commons, 2018-2026) measured off rectified
// (perspective-corrected) side views; lettered here, no logo files.
//
// Each car of a unit is its own type, as SBB numbers them: the European
// Vehicle Number (EVN) of every car carries the unit's series and number
// and, in its fifth digit, the car's place in the unit (94 85 0 523 038-x
// is the unit, 94 85 2 523 038 its first-class end car). FLEETS maps
// every series and place SBB's own rolling-stock register lists
// (data.sbb.ch "rollmaterial", September 2025 extract) to its drawing.
// When the formation service names no cars, TYPICAL picks what SBB's 2026
// annual formation plan (data.sbb.ch "jahresformation", the timetable from
// 14 December 2025) runs on that train number, else on its line.

import { C, rect, circle, path, line, lines, poly, truck, pantograph, slats } from "../carart.js?v=dev";
// DB Regio's bwegt units on SBB's timetable into Basel (RE 7, RB 27, RE 27)
// are drawn in chintl.cars.js; their types are carried here too, so they
// draw when this file is the one loaded.
import { TYPES as INTL_TYPES, MODELS as INTL_MODELS } from "./chintl.cars.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const seq = (from, pitch, k) => Array.from({ length: Math.max(0, k) }, (_, i) => from + i * pitch);
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const STROKE = 'vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"';
let ids = 0;
const newId = () => `ts-clip-sbr${++ids}`;

// ===================== Paint =====================
// SBB's regional paint (2004 on): white; SBB red doors and a red line along
// the roof's edge; the windows in one black band; anthracite below the
// waist; the cab's face red round a black windshield. First class: a
// yellow line over the windows of its part of the car, a white "1" either
// side of its door and the door's blue plate reading "1" (photographed on
// RABe 523 019 and 038, 2022-2023).
export const SBB = {
  red: "#e1251f", redDeep: "#c91e1b", white: "#f7f7f5", band: "#18191d", skirt: "#363a43", roof: "#8f949c", roofDark: "#3c4048",
  yellow: "#f6c400", blue: "#24479a", glass: C.glass, black: "#141518", grey: "#c8ccd1", greyDark: "#5d636c",
};

// Text h ft tall centered at (x, y), reading left to right on a mirrored
// car too.
export function T(c, x, y, h, text, fill, { weight = 700, spacing = 0, italic = false, family = SANS, anchor = "middle", stretch = 1 } = {}) {
  return `<text transform="translate(${n(x)} ${n(y)}) scale(${n((c.mirrored ? -1 : 1) * stretch)} -1)" y="${n(h * 0.36)}" font-size="${n(h)}" text-anchor="${anchor}" ` +
    `font-weight="${weight}"${italic ? ' font-style="italic"' : ""} letter-spacing="${spacing}" font-family="${family}" fill="${fill}">${text}</text>`;
}
// A mark drawn y-down in a box centered at (x, y), h ft tall, unmirrored.
const markAt = (c, x, y, h, inner) => `<g transform="translate(${n(x)} ${n(y)}) scale(${n((c.mirrored ? -1 : 1) * h)} ${n(-h)})">${inner}</g>`;
// The SBB emblem (Hans Hartmann, 1972): a white cross whose arms end in
// arrowheads pointing left and right, on red; drawn in a unit square
// (-0.5..0.5).
const EMBLEM = "M0.16 -0.19L0.35 0L0.16 0.19M-0.16 -0.19L-0.35 0L-0.16 0.19M-0.3 0L0.3 0M0 -0.19L0 0.19";
export const sbbEmblem = (c, x, y, h, { square = true, fill = "#ffffff", bg = SBB.red } = {}) =>
  markAt(c, x, y, h, (square ? `<rect x="-0.5" y="-0.5" width="1" height="1" fill="${bg}"/>` : "") +
    `<path d="${EMBLEM}" fill="none" stroke="${fill}" stroke-width="0.105" stroke-linejoin="miter" stroke-linecap="butt"/>`);
// "SBB CFF FFS" with the emblem ahead of it, as on every car's side.
export const sbbName = (c, x, y, h, ink = SBB.black) => sbbEmblem(c, c.mirrored ? x + 5.6 * h : x, y, h * 1.25) +
  T(c, c.mirrored ? x + 4.85 * h : x + 0.85 * h, y - 0.02, h, "SBB CFF FFS", ink, { weight: 700, anchor: "start", spacing: "-0.01em" });

// ===================== Body =====================
// A car body seen from the side, its cab (if any) on the left: the
// outline from the nose's points (bottom to roof) or a plain end, the
// paint clipped to it and shaded like every other drawing (carmodels.js),
// then what stands proud of it. o: L, sill, roof, nose, x0 (left end when
// no nose), x1 (right end), endR (roof corner), bottom ([[x, y], ...]
// replacing the straight sill from left to right), paint(g), over(g)
// (after the outline: doors' edges, lettering), under(g) (trucks and
// underfloor, before the body), top(g) (roof gear, after), ends: [floor,
// top] of the gangway bellows at a coupled end.
function body(c, o) {
  const L = c.L, x0 = o.x0 ?? 0.35, x1 = o.x1 ?? L - 0.35, r = o.endR ?? 0.9, { sill, roof } = o;
  const pts = [];
  if (o.nose) pts.push(...o.nose.map((p) => [...p]));
  else pts.push([x0, sill], [x0, roof - r], ["q", x0, roof, x0 + r, roof]);
  const rearPts = [[x1 - r, roof], ["q", x1, roof, x1, roof - r], [x1, sill]];
  // From the nose's roof point along the roof to the right end, down and
  // back along the sill.
  let d = poly([...pts, ...rearPts, ...(o.bottom ? [...o.bottom].reverse() : []), pts[0][0] === "q" ? [pts[0][3], pts[0][4]] : pts[0]]);
  const id = newId(), g = { L, sill, roof, x0: o.nose ? o.nose[0][0] : x0, x1 };
  const ys = d.match(/-?\d+(\.\d+)?/g).map(Number).filter((_, i) => i % 2 === 1), lo = Math.min(...ys), hi = Math.max(...ys);
  const stop = (off, color, v, fb) => `<stop offset="${off}" stop-color="${color}" stop-opacity="${fb}" style="stop-opacity:var(${v},${fb})"/>`;
  const shade = `<linearGradient id="${id}-s" gradientUnits="userSpaceOnUse" x1="0" y1="${n(lo)}" x2="0" y2="${n(hi)}">` +
    stop(0, "#000", "--car-shade-low", 0.16) + '<stop offset="0.36" stop-color="#000" stop-opacity="0"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/>' +
    stop(0.8, "#fff", "--car-shade-high", 0.1) + '<stop offset="0.93" stop-color="#fff" stop-opacity="0"/>' + stop(1, "#000", "--car-shade-roof", 0.08) + "</linearGradient>";
  let s = o.under ? o.under(g) : "";
  // Gangway bellows at a coupled end, behind the body.
  const [ef, et] = o.ends || [sill + 0.6, roof - 1.4];
  if (c.coupledR && !o.cabR) s += rect(x1 - 0.2, ef, L - x1 + 0.2, et - ef, C.rubber) + lines([[x1 + 0.12, ef + 0.2, x1 + 0.12, et - 0.2]], "#3a3f45", 0.6);
  if (c.coupledL && !o.nose) s += rect(0, ef, x0 + 0.2, et - ef, C.rubber) + lines([[x0 - 0.12, ef + 0.2, x0 - 0.12, et - 0.2]], "#3a3f45", 0.6);
  s += `<path d="${d}" fill="${SBB.white}"/><clipPath id="${id}"><path d="${d}"/></clipPath><defs>${shade}</defs>` +
    `<g clip-path="url(#${id})">${o.paint(g)}<rect x="-5" y="${n(lo)}" width="${n(L + 10)}" height="${n(hi - lo)}" fill="url(#${id}-s)"/></g>`;
  s += o.over ? o.over(g) : "";
  s += `<path d="${d}" fill="none" stroke="currentColor" stroke-width="0.8" ${STROKE}/>`;
  return s + (o.top ? o.top(g) : "");
}

// A window: dark glass in a thin dark frame, the sky's reflection high in
// it; r: corner radius.
function pane(x, y, w, h, r = 0.35, frame = "#2a2d33") {
  return rect(x, y, w, h, C.glass, 0, `rx="${n(r)}" stroke="${frame}" stroke-width="0.7" ${STROKE}`) +
    rect(x + 0.15, y + h * 0.6, w - 0.3, h * 0.3, C.glassLight, 0, `rx="${n(Math.min(r, 0.2))}"`);
}
// A pair of sliding plug door leaves, x..x+w, y0..y1: their paint, the
// seam, a tall window in each, a step plate at the foot.
function leaves(x, w, y0, y1, fill, { glass = [0.18, 0.86], gw = 0.5, seam = "#2b2e33" } = {}) {
  const h = y1 - y0, lw = w / 2;
  let s = rect(x, y0, w, h, fill);
  for (const k of [0, 1]) s += pane(x + lw * k + lw * (1 - gw) / 2, y0 + h * glass[0], lw * gw, h * (glass[1] - glass[0]), lw * gw * 0.45, "#22252a");
  return s + line(x + lw, y0 + 0.05, x + lw, y1 - 0.05, seam, 0.6) + line(x, y0, x, y1, "rgba(0,0,0,0.35)", 0.5) + line(x + w, y0, x + w, y1, "rgba(0,0,0,0.35)", 0.5);
}

// ===================== Running gear =====================
// A Jakobs truck under the joint of two cars (each car draws its half); a
// motor truck under a cab; the automatic coupler at the front.
const jakobs = (x, top, d = 30) => truck(x, { wb: 8.86, d, top });
// A Scharfenberg coupler run out from the nose to the coupler face (x =
// 0), on its drawbar, the electric head beside it, the anticlimber over.
function autoCoupler(x1, y = 2.6) {
  return rect(0.35, y - 0.28, x1 - 0.2, 0.56, "#2a2d31") + rect(0, y - 0.62, 0.48, 1.24, "#3b3f45", 0.4, 'rx="0.14"') +
    rect(0.1, y - 0.14, 0.26, 0.28, "#1b1d20") + rect(0.55, y + 0.4, 0.8, 0.42, "#5a6068", 0.3, 'rx="0.08"');
}
// Two coupled units' noses meet: the couplers joined (drawn by the left one).
const coupledCouplers = (y = 2.6) => rect(-0.2, y - 0.28, 1.6, 0.56, "#2a2d31") + rect(-0.25, y - 0.55, 0.5, 1.1, "#3b3f45");

// Underfloor equipment: cases between a and b hung from the floor (top).
function cases(a, b, top, k = 2, depth = 1.0, fill = "#2c2f35") {
  if (b - a < 1) return "";
  const w = (b - a) / k;
  let s = "";
  for (let i = 0; i < k; i++) s += rect(a + i * w + 0.25, top - depth, w - 0.5, depth, fill, 0, 'rx="0.1"') + line(a + i * w + 0.5, top - depth + 0.25, a + (i + 1) * w - 0.5, top - depth + 0.25, "rgba(255,255,255,0.12)", 0.5);
  return s;
}
// Roof gear: a low fairing with its seams (air conditioning, converters).
function fairing(x, w, roof, h = 0.65, fill = "#9ca2aa") {
  return path(poly([[x, roof - 0.1], [x + 0.5, roof + h], [x + w - 0.5, roof + h], [x + w, roof - 0.1]]), fill, 0.4) +
    lines(seq(x + w / 3, w / 3, 2).map((v) => [v, roof + 0.05, v, roof + h - 0.08]), "rgba(0,0,0,0.25)", 0.4);
}
// A pantograph on its base with the main breaker and the roof line; dir
// -1: the knee toward the left.
function panGear(x, roof, { up = true, dir = -1, breaker = 4.0 } = {}) {
  return rect(x - 3.0, roof - 0.05, 6.0, 0.35, SBB.greyDark, 0.4, 'rx="0.12"') + pantograph(x, roof + 0.3, { up, facing: dir }) +
    rect(x + breaker * -dir - 0.6, roof - 0.05, 1.2, 0.9, "#b7bcc3", 0.4, 'rx="0.15"') + rect(x + breaker * -dir - 0.2, roof + 0.85, 0.4, 0.45, "#7d848c", 0.3);
}

// ===================== Orientation =====================
// Every unit's end cars face outward. Each end car is two types: its key
// (drawn with its cab on the left, leading its unit) and key + "R" (the
// same car turned round, closing its unit). FORMATION picks between them
// from the order of the cars in the real train; the typical sets name them.
function facingRight(c, draw) {
  const m = { ...c, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: c.coupledL };
  return `<g transform="matrix(-1 0 0 1 ${n(c.L)} 0)">${draw(m)}</g>`;
}

// ===================== Stadler FLIRT =====================
// RABe 521, 522, 523 and 524 (2004-2014): cars of 20.939 m from the coupler
// face to the middle of the Jakobs truck at the end cars, 16.1 m between
// truck centers in the middle; four cars 74.08 m, TILO's six 106.28 m
// (SBB register). Measured off rectified photographs of RABe 523 038
// (Pratteln? 2023), 524 113 (Locarno, 2021) and 521 008 (Basel Bad Bf,
// 2013), scaled by the doors (1.3 m clear, 1.7 m across the leaves) and
// the unit's height (4.185 m over the roof gear): body side from 0.45 m to
// the roof's crown at 4.0 m; floor 0.57 m at the doors. Each car has two
// double doors a side, TILO's six-car end cars one; big windows in a black
// band, short ones over the trucks; the cab's long, raked windshield; a
// motor truck under each cab, a Jakobs truck at each joint.
const F1 = { sill: 1.45, roof: 13.45, skirt: 2.75, bandLo: 5.55, bandHi: 9.35, winLo: 4.25, winHi: 9.25, hdr: 9.35, hdrTop: 9.85, drip: 10.05,
  stripeLo: 12.4, stripeHi: 12.95, doorW: 5.6 };
const NOSE_F1 = [[1.45, F1.sill], [0.8, 2.15], [0.75, 4.3], ["q", 0.85, 5.6, 1.45, 6.55], [5.05, 12.2], ["q", 5.8, F1.roof, 7.6, F1.roof]];
// Window layouts: [x0, x1, kind]: "m" short over the motor truck, "j"
// short over a Jakobs truck, "h" with a hopper light; doors' left edges.
const F1_LAYOUT = {
  // The four-car units' end cars (RABe 521, 523, 524 0xx): two doors; a
  // short window over the motor truck.
  cab4: { L: 68.7, hatch: [14.25, 17.6], band: 17.7, wins: [[19.5, 24.5, "m"], [25.25, 30.6], [37.6, 42.8], [43.4, 48.7], [55.6, 60.9, "h"], [61.5, 66.6, "j"]],
    doors: [31.3, 49.5], first: 43.1, numerals: 0 },
  // TILO's six-car end cars (524 1xx): one door, the TILO name ahead of it;
  // first class throughout.
  cab6: { L: 68.7, hatch: [13.2, 17.3], band: 22.8, wins: [[24.0, 30.0], [37.8, 43.0], [43.6, 48.9], [49.6, 54.8], [55.5, 60.6], [61.4, 66.2, "j"]],
    doors: [31.3], first: 68.7, numerals: 0 },
  mid: { L: 52.82, band: -1, wins: [[2.8, 8.1, "j"], [8.7, 14.0], [20.7, 26.0], [26.8, 32.1], [38.8, 44.1, "h"], [44.7, 50.0, "j"]], doors: [14.35, 32.85] },
};
// Paint schemes: stripe (the line along the roof's edge), door bottoms
// (the anthracite carried across the doors' foot, as on the Basel and TILO
// units), logo(c, g) at the cab.
const sbbStripe = (G, L, color) => rect(-1, G.stripeLo, L + 2, G.stripeHi - G.stripeLo, color);
function f1Window(G, [a, b, kind]) {
  const lo = kind === "m" ? G.winM : kind === "j" ? G.winJ : G.winLo;
  let s = pane(a, lo, b - a, G.winHi - lo, 0.45);
  if (kind === "h") s += line(a + 0.2, G.winHi - 1.05, b - 0.2, G.winHi - 1.05, "#2a2d33", 0.7);
  return s;
}
// A door: the leaves, the blue plate over it with its class, the drip
// rail; first class: the white "1" either side and the yellow over it.
function f1Door(G, c, x, { first = false, skirtFoot = false, w = G.doorW } = {}) {
  let s = leaves(x, w, G.sill + 0.05, G.hdr, SBB.red, { glass: [0.37, 0.98], gw: 0.52 });
  if (skirtFoot) s += rect(x, G.sill + 0.05, w, G.skirt - G.sill - 0.05, SBB.skirt) + line(x + w / 2, G.sill, x + w / 2, G.skirt, "#24272c", 0.6);
  if (first) s += rect(x, G.hdr - 0.45, w, 0.45, SBB.yellow) + line(x + w / 2, G.hdr - 0.45, x + w / 2, G.hdr, "#2b2e33", 0.6);
  s += rect(x, G.hdr, w, G.hdrTop - G.hdr, SBB.blue) + T(c, x + 0.45, (G.hdr + G.hdrTop) / 2, 0.42, first ? "1" : "2", "#ffffff") +
    T(c, x + w - 0.45, (G.hdr + G.hdrTop) / 2, 0.42, first ? "1" : "2", "#ffffff");
  s += line(x - 0.9, G.drip, x + w + 0.9, G.drip, "#d9dce0", 1.1) + line(x - 0.9, G.drip - 0.07, x + w + 0.9, G.drip - 0.07, "rgba(0,0,0,0.25)", 0.4);
  if (first && G.numerals !== false) s += T(c, x - 0.55, 7.25, 1.15, "1", "#ffffff", { weight: 500 }) + T(c, x + w + 0.55, 7.25, 1.15, "1", "#ffffff", { weight: 500 });
  return s;
}
// The cab of a first-generation FLIRT seen from the side: the black
// windshield along the raked face, the cab's side window (a pointed pane
// and an opening one behind it), the mirror, the headlight in its black
// pod, the white bumper over the anthracite skirt, the coupler.
function f1CabSide(G, c, sweep, dx = 0) {
  const at = (inner) => (dx ? `<g transform="translate(${dx} 0)">${inner}</g>` : inner);
  // Windshield seen edge-on, and the black roof cap over it.
  let s = at(path(poly([[1.3, 6.4], [1.75, 6.55], [5.4, 12.2], ["q", 6.3, 13.2, 8.2, 13.25], [8.2, 14], [-1, 14]]), SBB.black));
  s += sweep;
  // The side window: a pointed pane ahead, the opening light behind.
  let w = path(poly([[2.65, 6.5], ["q", 3.0, 6.12, 3.9, 6.1], [9.55, 6.1], [9.55, 9.5], ["q", 9.55, 9.72, 9.3, 9.72], [4.75, 9.7]]), SBB.black);
  w += path(poly([[3.2, 6.55], ["q", 3.4, 6.35, 3.95, 6.33], [7.0, 6.33], [7.0, 9.45], [4.85, 9.45]]), C.glass) +
    path(poly([[3.9, 7.9], [7.0, 8.0], [7.0, 9.45], [4.85, 9.45]]), C.glassLight);
  w += pane(7.3, 6.33, 2.0, 3.12, 0.3, "#0d0e10");
  // Headlight pod and lamp.
  w += path(poly([[0.85, 5.55], [3.6, 5.62], ["q", 4.4, 5.85, 3.6, 6.25], [1.0, 6.3], ["q", 0.8, 5.95, 0.85, 5.55]]), SBB.black) +
    circle(1.55, 5.93, 0.3, "#f3ead0", 0, 'stroke="#3a3d42" stroke-width="0.5" vector-effect="non-scaling-stroke"') + circle(2.45, 5.93, 0.2, "#4a4e55");
  return s + at(w);
}
function f1Cab(c, o) {
  const G = o.G || F1, lay = G.layout[o.layout], L = c.L, liv = o.liv;
  const paint = () => {
    let s = rect(-1, 0, L + 2, 20, SBB.white) + rect(-1, G.stripeHi, L + 2, 4, G.roofColor || SBB.roof) + sbbStripe(G, L, liv.stripe);
    s += liv.base ? liv.base(c, L, G) : "";
    s += rect(lay.band, G.bandLo, L + 1 - lay.band, G.bandHi - G.bandLo, SBB.band) + rect(-1, 0, L + 2, G.skirt, SBB.skirt);
    if (o.first) s += rect(lay.band, G.bandHi - 0.45, Math.min(lay.first, L + 1) - lay.band, 0.45, SBB.yellow);
    s += lay.wins.map((w) => f1Window(G, w)).join("");
    s += lay.doors.map((x, i) => f1Door(G, c, x, { first: o.first && (i === 0 || lay.first > x + G.doorW), skirtFoot: liv.doorFoot })).join("");
    // Roof-edge covers over the converters (four, their seams slanted).
    s += liv.cabRoof ? liv.cabRoof(c, L, G) : "";
    s += G.cabSide(G, c, liv.sweep(c, L, G));
    s += G.front ? G.front(G, c) : "";
    // The hatch behind the cab: a rounded panel with its grilles.
    const [h0, h1] = lay.hatch;
    if (!liv.noHatch) s += rect(h0, G.hatchY, h1 - h0, 3.55, "none", 0, `rx="0.55" stroke="#9aa0a7" stroke-width="0.6" ${STROKE}`) + rect(h0 + 0.85, G.hatchY + 2.3, h1 - h0 - 1.7, 0.5, "none", 0, `stroke="#a4a9b0" stroke-width="0.5" ${STROKE}`) +
      (liv.hatchGrille ? rect(h0 + 0.6, G.hatchY + 0.6, h1 - h0 - 1.2, 1.1, "#d3d6da", 0, `stroke="#a4a9b0" stroke-width="0.5" ${STROKE}`) + slats(h0 + 0.7, G.hatchY + 0.65, h1 - h0 - 1.4, 1.0, 0.18, "rgba(0,0,0,0.25)") : "");
    // The cab module's seam, a socket on the bumper.
    s += line(G.seam, G.skirt + 0.1, G.seam, G.stripeLo - 0.05, "rgba(0,0,0,0.22)", 0.5) + circle(G.seam - 0.4, 4.7, 0.28, "none", 0, `stroke="#9aa0a7" stroke-width="0.5" ${STROKE}`);
    s += liv.logo ? liv.logo(c, L, lay) : "";
    // SBB's name by the rear joint; the car's number on the skirt.
    s += sbbName(c, L - 7.6, 3.95, 0.48);
    return s;
  };
  return body(c, { sill: G.sill, roof: G.roof, nose: G.nose, ends: [G.sill + 0.4, G.roof - 1.2],
    paint,
    under: () => truck(G.motor, { wb: G.motorWb ?? 8.86, d: 34, top: G.sill + 0.2 }) + jakobs(L, G.sill + 0.2) + (c.coupledL ? coupledCouplers() : autoCoupler(G.nose[0][0] + 0.2)) +
      path(poly([[G.nose[0][0] - 0.2, G.sill + 0.1], [G.nose[0][0] + 5.0, G.sill + 0.1], [G.nose[0][0] + 4.4, 0.75], [G.nose[0][0] + 0.5, 0.65]]), "#2a2d31") + (G.buffers && !c.coupledL ? G.buffers(G) : ""),
    top: () => G.cabTop(G, L) + (o.pan ? panGear(L - 5.2, G.roof, { dir: -1 }) : ""),
  });
}
// A middle car; pan: the pantograph's end ("L" or "R") or none.
function f1Mid(c, o) {
  const G = o.G || F1, lay = G.layout.mid, L = c.L, liv = o.liv;
  const paint = () => {
    let s = rect(-1, 0, L + 2, 20, SBB.white) + rect(-1, G.stripeHi, L + 2, 4, G.roofColor || SBB.roof) + sbbStripe(G, L, liv.stripe);
    s += liv.midBase ? liv.midBase(c, L, G) : "";
    s += rect(-1, G.bandLo, L + 2, G.bandHi - G.bandLo, SBB.band) + rect(-1, 0, L + 2, G.skirt, SBB.skirt);
    s += lay.wins.map((w) => f1Window(G, w)).join("") + lay.doors.map((x) => f1Door(G, c, x, { skirtFoot: liv.doorFoot })).join("");
    // The air-conditioning's intake grille in the roof's edge.
    s += G.midEdge ? G.midEdge(G, L) : "";
    s += o.logo ? o.logo(c, L) : "";
    return s + sbbName(c, L - 7.6, 3.95, 0.48);
  };
  return body(c, { sill: G.sill, roof: G.roof, x0: 0.35, ends: [G.sill + 0.4, G.roof - 1.2], paint,
    under: () => jakobs(0, G.sill + 0.2) + jakobs(L, G.sill + 0.2),
    top: () => G.midTop(G, L) + (o.pan === "L" ? panGear(9.0, G.roof, { dir: 1 }) : o.pan === "R" ? panGear(L - 9.0, G.roof, { dir: -1 }) : ""),
  });
}
// SBB's red sweep from the headlight up the cab's corner into the line
// along the roof's edge (measured off RABe 523 038).
const sbbSweep = (stripe) => (c, L, G = F1) => path(`M1.25 6.0C2.0 6.7 3.3 8.4 4.4 10.0C5.2 11.2 6.0 12.0 7.6 12.25Q8.6 ${G.stripeLo} 10.2 ${G.stripeLo}` +
  `L${L + 1} ${G.stripeLo}L${L + 1} ${G.stripeHi}L8.2 ${G.stripeHi}Q6.2 12.9 4.9 11.9C3.7 10.6 2.6 9.1 1.25 6.95Z`, stripe);
// The converters' covers along the roof's edge of the end cars: four
// dark panels, the red line running on between them in slanted strips.
const sbbCabRoof = (stripe) => (c, L, G = F1) => {
  let s = rect(18.6, G.stripeLo - 0.15, 18.2, 1.3, "#4b5058");
  for (const x of [23.6, 28.0, 32.4]) s += path(poly([[x, G.stripeLo - 0.15], [x + 0.9, G.stripeLo - 0.15], [x + 1.5, G.stripeHi + 0.4], [x + 0.6, G.stripeHi + 0.4]]), stripe) +
    line(x + 1.0, G.stripeLo - 0.15, x + 1.6, G.stripeHi + 0.4, "#ffffff", 0.6);
  return s + rect(45.0, G.stripeLo - 0.1, 6.8, G.stripeHi - G.stripeLo + 0.35, "#2b2e33") + slats(45.2, G.stripeLo, 6.4, 0.65, 0.3, "rgba(255,255,255,0.35)");
};

Object.assign(F1, { nose: NOSE_F1, layout: F1_LAYOUT, cabSide: f1CabSide, hatchY: 4.35, seam: 10.8, motor: 14.0, winM: 6.1, winJ: F1.bandLo + 0.05,
  cabTop: (G, L) => fairing(18.5, 18.5, G.roof, 0.3, "#7d838b") + fairing(43.0, 12.0, G.roof, 0.3) + rect(8.6, G.roof - 0.05, 2.2, 0.35, "#4a4e55", 0.4, 'rx="0.1"') +
    line(9.6, G.roof + 0.3, 9.9, G.roof + 0.95, "#3a3f45", 0.6),
  midTop: (G, L) => fairing(19.5, 13.5, G.roof, 0.3),
  midEdge: (G, L) => rect(27.0, G.stripeLo - 0.1, 6.5, G.stripeHi - G.stripeLo + 0.35, "#2b2e33") + slats(27.2, G.stripeLo, 6.1, 0.65, 0.3, "rgba(255,255,255,0.35)") });

// ---------- FLIRT liveries ----------
const LIV_SBB = { stripe: SBB.red, sweep: sbbSweep(SBB.red), cabRoof: sbbCabRoof(SBB.red), doorFoot: false };
// RER Vaud (RABe 523 013-031 and 101-114): the network's green disc with
// "rer" in white, "VAUD" under it, on the cab's side ahead of the hatch
// (RABe 523 019 and 024, 2022-2024).
const rerVaud = (c) => circle(12.55, 7.75, 0.95, "#8dc63f") + T(c, 12.55, 7.85, 0.62, "rer", "#ffffff", { weight: 700, spacing: "-0.02em" }) +
  T(c, 12.55, 6.45, 0.22, "VAUD", "#6d7278", { weight: 600, spacing: "0.06em" });
const LIV_VAUD = { ...LIV_SBB, logo: rerVaud };
// The trinational S-Bahn Basel (RABe 521 0xx since 2019): its heart drawn
// in one thick line, red with the Swiss cross on its right lobe, black,
// gold and blue down its left side and point (RABe 521 013, 018, 028,
// 2023-2025), on the cab's side between the cab and the hatch.
function baselHeart(c) {
  const H = (s) => `<g transform="translate(12.8 7.3) scale(${c.mirrored ? -1.3 : 1.3} 1.3)">${s}</g>`;
  const outline = "M0 1.15C-0.35 2.35 -1.75 2.35 -1.75 1.0C-1.75 -0.3 -0.6 -1.0 0.35 -2.15C1.3 -1.0 2.1 -0.2 2.1 1.0C2.1 2.35 0.5 2.4 0 1.15";
  const st = (d, color, extra = "") => `<path d="${d}" fill="none" stroke="${color}" stroke-width="0.34" stroke-linecap="butt" ${extra}/>`;
  return H(st(outline, "#e3001b") + st("M-1.62 1.9C-1.8 1.2 -1.72 0.6 -1.55 0.3", "#1d1d1b") + st("M-1.55 0.3C-1.2 -0.45 -0.6 -1.0 -0.1 -1.6", "#f6c100") +
    st("M-0.1 -1.6L0.35 -2.15C0.9 -1.5 1.4 -1.0 1.75 -0.5", "#0b4fa3") + `<path d="M1.18 1.62h0.16v0.18h0.18v0.16h-0.18v0.18h-0.16v-0.18h-0.18v-0.16h0.18z" fill="#ffffff"/>`);
}
const LIV_BASEL = { ...LIV_SBB, logo: baselHeart };
// Stadtbahn Zug (RABe 523 001-012): the line along the roof blue, "ein
// sympathischer zug." under it behind the cab, the "stadtbahnzug" plate
// by the hatch (RABe 523 001, Muttenz, 2023).
const ZUG_BLUE = "#2459a8";
const zugText = (c, x) => T(c, x, 11.2, 1.3, "ein sympathischer zug.", ZUG_BLUE, { weight: 400, italic: true, spacing: "-0.01em" });
const zugLogo = (c) => rect(14.6, 6.0, 2.6, 1.7, ZUG_BLUE) + T(c, 15.9, 6.85, 0.36, "stadtbahn<tspan font-weight=\"800\">zug</tspan>", "#ffffff", { weight: 400, spacing: "-0.02em" }) + zugText(c, 27.0);
// The blue cap along the roof's edge, from the cab back over every car.
const zugCap = (c, L, G) => rect(-1, G.stripeLo, L + 2, 3, ZUG_BLUE);
const LIV_ZUG = { stripe: ZUG_BLUE, sweep: (c, L, G = F1) => zugCap(c, L, G) + sbbSweep(SBB.red)(c, 11.0, G) + path(`M0 14L9.4 14L10.6 ${G.stripeLo}L0 ${G.stripeLo}Z`, SBB.red),
  midBase: (c, L, G) => zugCap(c, L, G) + zugText(c, L / 2), cabRoof: null, doorFoot: false, logo: zugLogo };
// TILO (since 2019 on every TILO FLIRT, the first ones repainted): white;
// at each cab a red sweep up the cab's corner from the red face, under it
// a blue one round the cab's side window, and a green one swept up from
// under the window that runs on as the line along every car's roof edge;
// TILO's name ahead of the first door, "ETR 524" low behind the cab
// (RABe 524 113, Locarno, 2021; 524 204, Bellinzona, 2026).
const TILO = { red: "#e3262b", blue: "#2563c9", green: "#36a93b", black: "#1a1a1a" };
const tiloSweep = (c, L) => {
  const top = F1.roof + 0.1;
  let s = path(`M1.25 5.7C1.9 6.4 2.5 7.3 3.0 8.0C3.6 8.9 4.0 9.4 4.6 9.95C5.4 10.8 5.9 11.4 6.6 11.75C7.5 12.25 8.3 12.6 9.2 12.75C10.6 13.0 11.8 13.15 12.8 ${top}L5 14L0 14Z`, TILO.red);
  s += path(`M0.9 5.3C1.6 5.45 2.3 5.5 3.0 5.55C3.7 5.6 4.3 5.68 4.8 5.75L9.6 9.75C9.9 10.2 10.2 10.6 10.6 11.0C11.1 11.5 11.5 11.75 12.0 11.95C12.8 12.3 13.6 12.5 14.5 12.65C15.5 12.8 16.5 12.95 17.5 ${top}` +
    `L12.8 ${top}C11.8 13.15 10.6 13.0 9.2 12.75C8.3 12.6 7.5 12.25 6.6 11.75C5.9 11.4 5.4 10.8 4.6 9.95C4.0 9.4 3.6 8.9 3.0 8.0C2.5 7.3 1.9 6.4 1.25 5.7Z`, TILO.blue);
  s += path(`M2.3 4.95C3.4 5.05 4.5 5.15 5.5 5.3C6.6 5.5 7.6 5.9 8.2 6.4C9.0 7.1 9.5 7.8 9.9 8.6C10.3 9.4 10.6 9.9 10.9 10.3C11.5 11.0 12.0 11.3 12.6 11.5` +
    `C13.6 11.85 14.6 12.05 15.5 12.2C16.7 12.4 17.8 ${F1.stripeHi} 19.0 ${F1.stripeHi}L${L + 1} ${F1.stripeHi}L${L + 1} ${F1.stripeLo}L20.0 ${F1.stripeLo}` +
    `C18.6 ${F1.stripeLo} 17.6 12.2 16.5 12.0C15.4 11.8 14.3 11.55 13.4 11.3C12.6 11.0 12.1 10.6 11.6 10.0C11.2 9.5 10.9 9.1 10.6 8.6C10.2 7.9 9.9 7.3 9.5 6.8` +
    `C9.0 6.2 8.5 5.8 7.8 5.5C6.9 5.1 6.0 4.95 5.0 4.85C4.1 4.8 3.2 4.85 2.3 4.95Z`, TILO.green);
  return s;
};
// TILO's name: the T's red bar over a blue and a green stem, "ILO" black,
// heavy and leaning.
const tiloName = (c, x, y, h) => markAt(c, x, y, h,
  `<path d="M-0.95 -0.5L0.05 -0.5L0.0 -0.36L-1.0 -0.36Z" fill="${TILO.red}"/><path d="M-0.62 -0.3L-0.44 -0.3L-0.62 0.5L-0.8 0.5Z" fill="${TILO.blue}"/>` +
  `<path d="M-0.36 -0.3L-0.18 -0.3L-0.36 0.5L-0.54 0.5Z" fill="${TILO.green}"/>` +
  `<text x="-0.1" y="0.5" font-size="0.82" font-weight="900" font-style="italic" font-family="${SANS}" fill="${TILO.black}" letter-spacing="-0.02em">ILO</text>`);
const tiloLogo = (c, L, lay) => tiloName(c, lay && lay.band > 20 ? 20.4 : 19.9, 9.35, 2.0) + T(c, 13.2, 3.35, 0.9, "ETR 524", TILO.black, { weight: 400, spacing: "0.01em" });
const tiloCabRoof = () => rect(21.0, F1.stripeLo - 0.15, 14.5, 1.3, "#7c828a") + lines([[25.8, F1.stripeLo - 0.15, 26.4, F1.stripeHi + 0.4], [30.6, F1.stripeLo - 0.15, 31.2, F1.stripeHi + 0.4]], "#5a6068", 0.6);
const LIV_TILO = { stripe: TILO.green, sweep: tiloSweep, cabRoof: tiloCabRoof, doorFoot: true, hatchGrille: true, logo: tiloLogo };

// ---------- FLIRT 3 ----------
// RABe 523 101-114 (RER Vaud, 2020-21), 523 501-514 (2022) and TILO's
// six-car 524 301-305 (2020): Stadler's third FLIRT, its crash-proof cab
// longer and blunter, the windshield in one sweep up to the roof, the
// headlights low in the face; cars of 21.05 m (end, to the Jakobs truck's
// middle) and 15.7 m (SBB register: four cars 73.5 m, six 104.9 m). Two
// double doors a side in every car; the windows shorter than the first
// FLIRT's, set higher. Measured off rectified photographs of RABe 524 303
// (Milano Centrale, 2024) and 524 305 (on test, 2020), heights scaled from
// Stadler's FLIRT 160 drawing (FLIRT data sheet) to the SBB floor (0.57 m).
// First class: the yellow line over its windows up to the second door and
// the door's plate "1 1"; no numerals on the body (524 303, 305).
const F3 = { sill: 1.35, roof: 13.5, skirt: 2.55, bandLo: 5.35, bandHi: 9.85, winLo: 5.75, winHi: 9.5, hdr: 10.2, hdrTop: 10.75, drip: 10.95,
  stripeLo: 12.25, stripeHi: 12.85, doorW: 5.3 };
const NOSE_F3 = [[1.1, F3.sill], [0.5, 2.1], [0.4, 5.3], ["q", 0.45, 6.5, 1.05, 7.15], [3.85, 12.2], ["q", 4.7, F3.roof, 6.7, F3.roof]];
function f3CabSide(G, c, sweep) {
  let s = path(poly([[0.95, 6.95], [1.4, 7.2], [4.2, 12.25], ["q", 5.0, 13.25, 7.0, 13.3], [7.0, 14], [-1, 14]]), SBB.black);
  s += sweep;
  // The side windows in their black surround: the pointed fixed pane, the
  // sliding one behind it.
  s += path(poly([[3.0, 8.3], ["q", 3.3, 7.95, 4.1, 7.95], [9.75, 7.95], [9.75, 10.95], ["q", 9.75, 11.2, 9.5, 11.2], [5.2, 11.2]]), SBB.black);
  s += path(poly([[3.6, 8.35], ["q", 3.8, 8.15, 4.3, 8.15], [6.5, 8.15], [6.5, 10.95], [5.35, 10.95]]), C.glass) + path(poly([[4.6, 9.7], [6.5, 9.75], [6.5, 10.95], [5.35, 10.95]]), C.glassLight);
  s += pane(6.85, 8.15, 2.7, 2.8, 0.3, "#0d0e10");
  // Headlights low in the face, the tail light between.
  s += path(poly([[0.42, 5.35], [2.0, 5.4], ["q", 2.6, 5.9, 2.0, 6.45], [0.55, 6.5]]), SBB.black) + circle(1.1, 5.92, 0.26, "#f3ead0", 0, 'stroke="#3a3d42" stroke-width="0.5" vector-effect="non-scaling-stroke"');
  // The cab module's door-like seam, the grab handle, the Stadler plate.
  return s + T(c, 12.4, 2.75, 0.32, "STADLER", "#2b3a7a", { weight: 700, spacing: "0.06em" });
}
const F3_LAYOUT = {
  cab4: { L: 69.06, hatch: [10.6, 13.8], band: 17.6, wins: [[19.6, 23.7], [25.6, 29.7], [37.8, 42.2], [44.0, 48.5], [56.3, 60.5], [62.5, 66.7]], doors: [31.2, 49.7], first: 49.7, numerals: false },
  mid: { L: 51.51, wins: [[2.5, 6.5], [8.3, 13.2], [21.5, 26.3], [27.4, 32.3], [39.2, 44.1], [45.4, 49.5]], doors: [14.8, 33.0] },
};
Object.assign(F3, { roofColor: "#3d4249", nose: NOSE_F3, layout: F3_LAYOUT, cabSide: f3CabSide, hatchY: 4.8, seam: 7.0, motor: 16.0, winM: F3.winLo, winJ: F3.winLo, numerals: false,
  cabTop: (G, L) => rect(7.0, G.roof - 0.1, 12.0, 0.75, "#3d4249", 0.4, 'rx="0.2"') + rect(24.0, G.roof - 0.1, 16.0, 0.85, "#3d4249", 0.4, 'rx="0.2"') +
    slats(25.0, G.roof + 0.05, 14, 0.6, 0.45, "rgba(255,255,255,0.18)") + fairing(45.0, 12.0, G.roof, 0.55, "#4a4f57"),
  midTop: (G, L) => fairing(18.0, 15.0, G.roof, 0.6, "#4a4f57"),
  midEdge: null });
// SBB's FLIRT 3: the red face and a red band up the edge of the
// windshield into the red line along the roof's edge (RABe 523 109, 111;
// 2024-2026).
const sbbSweep3 = (c, L, G) => path(`M0 4.9L1.2 5.0Q2.3 5.3 2.6 6.4L4.9 11.0Q5.6 ${G.stripeLo} 7.4 ${G.stripeLo}L${L + 1} ${G.stripeLo}L${L + 1} ${G.stripeHi}` +
  `L6.6 ${G.stripeHi}Q4.4 ${G.stripeHi} 3.6 11.4L1.6 7.4L0 7.4Z`, SBB.red);
const LIV3_SBB = { stripe: SBB.red, sweep: sbbSweep3, doorFoot: false, cabRoof: (c, L, G) => rect(7.0, G.stripeHi, L - 7, 2, "#3d4249") };
const rerVaud3 = (c) => circle(11.6, 9.6, 0.85, "#8dc63f") + T(c, 11.6, 9.7, 0.56, "rer", "#ffffff", { weight: 700, spacing: "-0.02em" }) +
  T(c, 11.6, 8.4, 0.2, "VAUD", "#6d7278", { weight: 600, spacing: "0.06em" });
const LIV3_VAUD = { ...LIV3_SBB, logo: rerVaud3 };
// TILO's FLIRT 3 (524 301-305): the red, blue and green sweeps fitted to
// the new cab, TILO's name high behind it, "ETR 524" low.
const tiloSweep3 = (c, L, G) => {
  const top = G.roof + 0.1;
  let s = path(`M-1 4.9L0.5 5.0C1.3 6.8 2.0 8.4 2.8 9.9C3.6 11.3 4.6 12.5 6.4 ${top}L-1 ${top}Z`, TILO.red);
  s += path(`M0.5 5.0L1.0 5.0C3.0 5.1 4.8 5.6 6.2 6.6C7.0 7.3 7.4 8.4 7.8 9.6C8.2 10.8 8.8 11.7 9.8 12.3C10.4 12.7 11.0 13.0 11.6 ${top}L6.4 ${top}` +
    `C4.6 12.5 3.6 11.3 2.8 9.9C2.0 8.4 1.3 6.8 0.5 5.0Z`, TILO.blue);
  s += path(`M1.0 5.0C3.0 5.05 5.0 5.5 6.4 6.4C7.4 7.2 7.8 8.2 8.2 9.4C8.6 10.6 9.1 11.4 10.0 11.9C10.9 12.2 12.0 ${G.stripeLo} 13.6 ${G.stripeLo}L${L + 1} ${G.stripeLo}` +
    `L${L + 1} ${G.stripeHi}L11.4 ${G.stripeHi}C10.4 12.7 9.6 12.3 9.0 11.7C8.3 11.0 7.9 10.1 7.6 9.1C7.3 8.1 6.9 7.3 6.1 6.7C4.8 5.8 3.0 5.25 1.0 5.0Z`, TILO.green);
  return s;
};
const LIV3_TILO = { stripe: TILO.green, sweep: tiloSweep3, doorFoot: true, noHatch: true, cabRoof: (c, L, G) => rect(7.0, G.stripeHi, L - 7, 2, "#3d4249"),
  logo: (c) => tiloName(c, 14.6, 9.75, 1.95) + T(c, 9.0, 4.6, 1.08, "ETR 524", TILO.black, { weight: 400, spacing: "0.01em" }) };

// ---------- RABe 522 ("FLIRT France") ----------
// RABe 522 201-232 (2011-2019), built for France as well: four cars of
// 75.0 m, the end cars 21.4 m (SBB register); a longer crash-proof nose
// carrying side buffers under the face (522 211, Pontarlier, 2024), the
// cab's window further back. Otherwise the first FLIRT's body. Measured off
// a rectified photograph of a Léman Express unit (La Roche-sur-Foron,
// 2025).
// The RABe 522's cab side: its big window, pointed ahead and rounded over
// the top, a sliding light at its back (522 211, 2024; the Léman Express
// units, 2025).
function f522CabSide(G, c, sweep) {
  let s = path(poly([[3.75, 6.4], [4.2, 6.55], [7.8, 12.2], ["q", 8.7, 13.2, 10.6, 13.25], [10.6, 14], [1.5, 14]]), SBB.black) + sweep;
  s += path(poly([[5.0, 6.35], ["q", 5.6, 6.05, 6.6, 6.05], [13.35, 6.05], [13.35, 10.2], ["q", 13.35, 10.45, 13.1, 10.45], [9.6, 10.45], ["q", 7.6, 10.4, 5.0, 6.35]]), SBB.black);
  s += path(poly([[5.6, 6.4], ["q", 6.0, 6.25, 6.8, 6.25], [10.6, 6.25], [10.6, 10.2], [9.7, 10.2], ["q", 7.9, 10.1, 5.6, 6.4]]), C.glass) +
    path(poly([[7.6, 8.4], [10.6, 8.5], [10.6, 10.2], [9.7, 10.2], ["q", 8.6, 10.15, 7.6, 8.4]]), C.glassLight);
  s += pane(10.9, 6.25, 2.25, 3.95, 0.3, "#0d0e10");
  s += path(poly([[3.3, 5.55], [6.0, 5.62], ["q", 6.8, 5.85, 6.0, 6.25], [3.45, 6.3], ["q", 3.25, 5.95, 3.3, 5.55]]), SBB.black) +
    circle(4.0, 5.93, 0.3, "#f3ead0", 0, 'stroke="#3a3d42" stroke-width="0.5" vector-effect="non-scaling-stroke"') + circle(4.9, 5.93, 0.2, "#4a4e55");
  return s;
}
// The RABe 522's end-car roof edge: the red line unbroken, the converter
// covers white above it, the intake grille in it near the joint.
const roof522 = (c, L, G) => rect(49.5, G.stripeLo - 0.1, 6.0, G.stripeHi - G.stripeLo + 0.35, "#2b2e33") + slats(49.7, G.stripeLo, 5.6, 0.65, 0.3, "rgba(255,255,255,0.35)");
const F522 = { ...F1, nose: [[3.85, F1.sill], [3.25, 2.15], [3.15, 4.3], ["q", 3.25, 5.6, 3.85, 6.55], [7.35, 12.2], ["q", 8.1, F1.roof, 9.9, F1.roof]],
  cabSide: f522CabSide, seam: 14.9, motor: 16.6,
  layout: { cab4: { L: 70.2, hatch: [15.4, 18.4], band: 22.3, wins: [[23.9, 28.9], [38.0, 42.6], [43.6, 48.2], [56.6, 61.6, "h"], [62.4, 67.4, "j"]], doors: [31.4, 50.5], first: 50.5 },
    mid: F1_LAYOUT.mid },
  // A side buffer (one seen) and the headstock under the face.
  buffers: (G) => rect(0.55, 2.75, 3.0, 1.0, "#2f3338", 0.4, 'rx="0.15"') + rect(0.2, 2.55, 0.45, 1.4, "#3b3f45", 0.4, 'rx="0.12"') +
    lines([[1.2, 2.85, 1.2, 3.65], [1.7, 2.85, 1.7, 3.65], [2.2, 2.85, 2.2, 3.65]], "rgba(255,255,255,0.35)", 0.5) };
const sbbSweep522 = (c, L, G) => `<g transform="translate(2.45 0)">${sbbSweep(SBB.red)(c, L, G)}</g>`;
const LIV522_SBB = { ...LIV_SBB, sweep: sbbSweep522, cabRoof: roof522 };
// The Léman Express (since 2019 on the 23 RABe 522 2xx it uses): white,
// SBB's red line along the roof running on over the cab to the top of the
// face; a pale blue and a deep blue band down the face's edge; two deep
// blue bands slanting across each end car behind the cab, and on each
// middle car a deep blue wave under the roof; the network's emblem (waves
// under an arch) on the hatch and LÉMAN EXPRESS under it.
const LEX = { blue: "#21489b", pale: "#86aee0", slate: "#4b5b84" };
const lexSweep = (c, L, G) => {
  const lo = G.stripeLo, hi = G.stripeHi;
  return path(`M${L + 1} ${lo}L12.2 ${lo}Q9.9 ${lo} 8.8 10.9L7.4 8.9L5.6 8.9L5.6 14L11.0 14Q11.4 ${hi} 12.4 ${hi}L${L + 1} ${hi}Z`, SBB.red) +
    path(`M7.4 13.6C6.0 11.6 5.0 8.4 4.0 2.3L6.6 2.3C7.5 7.9 9.0 11.4 11.6 13.6Z`, LEX.pale) +
    path(`M14.2 13.6C11.8 11.4 9.4 7.6 7.6 2.2L9.8 2.2C11.5 7.2 13.8 10.9 16.8 13.6Z`, LEX.blue);
};
const lexBase = (c, L, G) => path(poly([[18.3, 13.4], [20.5, 13.4], [26.8, 2.0], [24.6, 2.0]]), LEX.blue) + path(poly([[21.2, 13.4], [23.5, 13.4], [30.1, 2.0], [27.8, 2.0]]), LEX.blue);
const lexWave = (c, L, G) => path(`M${0.11 * L} 11.2C${0.2 * L} 11.7 ${0.28 * L} 12.15 ${0.35 * L} 12.2C${0.41 * L} 12.2 ${0.45 * L} 11.2 ${0.48 * L} ${G.bandHi - 0.1}` +
  `L${0.455 * L} ${G.bandHi - 0.1}C${0.43 * L} 10.6 ${0.4 * L} 11.25 ${0.35 * L} 11.3C${0.28 * L} 11.35 ${0.2 * L} 11.3 ${0.11 * L} 11.2Z`, LEX.blue);
// The Léman Express emblem: two waves under an arch, in slate blue.
const lexEmblem = (c, x, y, h) => markAt(c, x, y, h, `<path d="M-0.5 0.15Q0 -0.75 0.5 0.15" fill="none" stroke="${LEX.slate}" stroke-width="0.07"/>` +
  `<path d="M-0.45 0.2Q-0.22 0.05 0 0.2Q0.22 0.35 0.45 0.2M-0.45 0.38Q-0.22 0.23 0 0.38Q0.22 0.53 0.45 0.38" fill="none" stroke="${LEX.blue}" stroke-width="0.08"/>`);
const LIV522_LEX = { stripe: SBB.red, sweep: lexSweep, base: lexBase, midBase: lexWave, cabRoof: roof522, doorFoot: false,
  logo: (c) => lexEmblem(c, 16.9, 6.7, 1.6) + T(c, 16.9, 4.15, 0.85, "LÉMAN EXPRESS", LEX.slate, { weight: 600, spacing: "0.05em" }) };

// ===================== Stadler KISS (RABe 511, RABe 512) =====================
// Six double-deck cars, each on its own two trucks: end cars 25.36 m (511)
// or 26.3 m (512) with a motor truck under the cab, middle cars 24.82 m
// (SBB register; 150.0 and 151.9 m a unit); 4.595 m tall. Every car: a
// short end section over each truck (an intermediate floor, a small
// window), a door at each end of the double-deck middle, its lower deck
// sunk between the trucks. Measured off a rectified photograph of RABe
// 512 001's end car (Stadler Altenrhein, 2022) and scaled to the 511s by
// their lengths; the 511's cab, paint and first class off RABe 511 036,
// 048, 065 and 112 (2022-2025). Heights from the rail in feet.
const KS = { roof: 15.1, edge: 14.3, sill: 1.45, endSill: 3.15, upLo: 11.0, upHi: 13.45, loLo: 3.9, loHi: 6.5, doorTop: 9.1, doorW: 5.3,
  stepRoof: 13.85 };
// The cab: KISS 1 (511) and the 512's newer, blunter one.
const NOSE_K1 = [[1.0, 1.9], [0.45, 2.6], [0.4, 6.0], ["q", 0.45, 7.2, 1.1, 8.2], [4.3, 13.9], ["q", 5.2, KS.roof, 7.4, KS.roof]];
const NOSE_K2 = [[1.0, 1.9], [0.75, 2.6], [0.9, 5.4], ["q", 1.0, 7.2, 1.6, 8.6], [4.4, 13.0], ["q", 6.5, 14.85, 10.0, KS.roof]];
// Window rows across the double-deck part a..b: upper windows (pitch
// about 5.9 ft) and lower ones between the trucks.
function kissDeck(a, b, lowA, lowB) {
  const ups = spreadIn(a + 0.4, b - 0.4, 4.1, 5.85), los = spreadIn(lowA, lowB, 3.85, 6.0);
  return { ups, los };
}
function spreadIn(a, b, w, pitch) {
  const k = Math.max(1, Math.floor((b - a - w) / pitch) + 1), x0 = a + (b - a - ((k - 1) * pitch + w)) / 2;
  return seq(x0, pitch, k);
}
// Paint: base (white), skirt (below the lower windows), waist (the line
// between the decks), crown (the band over the upper windows), stripe
// (the 512's red line along the roof's edge), doorPanel (the 511s' red
// panel from the door to the roof), deep (the cab's sweep).
// The Zürich S-Bahn's 511s (RABe 511 048, 065; 2022-2025): ZVV's navy
// from the foot up through the lower windows and in a band at the waist,
// carrying the doors' plates; the doors' red panels up to the roof with
// the upper deck's class on a navy band; the S-Bahn's colourful sticker on
// each door leaf. The others (511 036, 112): anthracite low and a thin
// anthracite waist line, the plates SBB blue.
const ZVV = "#25306f";
const KISS_SBZ = { skirt: ZVV, skirtTop: 4.6, waist: [8.6, 9.4, ZVV], crown: ZVV, crownLo: 12.2, doorPanel: true, plate: ZVV, gen: 1, sticker: true, lo: [4.05, 6.75] };
const KISS_GREY = { skirt: "#3a3e45", skirtTop: 3.4, waist: [8.95, 9.25, "#3a3e45"], crown: "#2c2f35", doorPanel: true, plate: SBB.blue, gen: 1, lo: [4.05, 6.75] };
const KISS_512 = { skirt: "#3a3e45", skirtTop: 1.85, waist: null, crown: null, stripe: SBB.red, doorPanel: false, plate: SBB.blue, gen: 2, lo: [3.9, 6.5] };
// A KISS car. o: liv, cab (an end car, cab on the left), first: "none",
// "half" (the AB's first class at its left end), "full"; pan: a
// pantograph over the right end section ("up" raised).
function kiss(c, o) {
  const L = c.L, liv = o.liv, k2 = liv.gen === 2, cab = !!o.cab;
  // Sections (measured on 512 001's end car): the cab section and motor
  // truck (28.9 ft to the first door on a 512, 3 ft less on a 511) or an
  // end section, the doors, the double deck, the rear end section 19.8 ft.
  const x0 = cab ? 1.0 : 0.65, x1 = L - 0.65, front = cab ? (k2 ? 28.9 : 25.9) : x0 + 19.8, rearDoor = x1 - 19.8 - KS.doorW, rear = rearDoor + KS.doorW;
  const doors = [front, rearDoor];
  const tA = cab ? front - 10.5 : x0 + 9.4, tB = x1 - 9.4;
  // The upper deck reaches over both doors; the lower deck between the
  // trucks.
  const upA = cab ? front + 1.1 : front, upB = rear - (cab ? 1.5 : -0.4);
  const ups = k2 ? spreadIn(upA + 0.2, upB - 0.2, 4.0, 5.9) : spreadIn(upA + 0.2, upB - 0.2, 4.0, 5.9);
  const los = k2 ? spreadIn(front + KS.doorW + 1.9, rearDoor - 1.9, 3.9, 6.05) : spreadIn(front + KS.doorW + 1.4, rearDoor - 1.4, 4.4, 5.6);
  const bottom = [[x0, cab ? 1.9 : KS.endSill], [tA - 5.4, cab ? 1.9 : KS.endSill], [tA - 5.4, KS.endSill], [tA + 5.4, KS.endSill],
    [tA + 5.9, KS.sill], [tB - 5.9, KS.sill], [tB - 5.4, KS.endSill], [x1, KS.endSill]];
  const isFirst = (x) => o.first === "full" || (o.first === "half" && x < (front + rear) / 2);
  const paint = () => {
    let s = rect(-1, 0, L + 2, 20, SBB.white);
    if (liv.skirt) s += rect(-1, 0, L + 2, liv.skirtTop, liv.skirt);
    if (liv.waist) s += rect(-1, liv.waist[0], L + 2, liv.waist[1] - liv.waist[0], liv.waist[2]);
    if (liv.crown) s += rect(-1, liv.crownLo ?? 13.55, L + 2, 6, liv.crown);
    if (liv.stripe) s += rect(cab ? 9 : -1, KS.edge - 0.3, L + 2, 0.3, liv.stripe);
    s += rect(-1, KS.edge, L + 2, 4, "#2c2f35");
    // The 512's window bands; the windows.
    if (k2) s += rect(upA, 10.9, upB - upA, 2.7, SBB.band, 0, 'rx="0.5"') + rect(los[0] - 0.25, 3.75, los[los.length - 1] - los[0] + 4.4, 2.95, SBB.band, 0, 'rx="0.4"');
    // First class on the 511s: a yellow line under the upper deck's
    // windows over the first-class part (RABe 511, Zürich, 2024).
    // First class on the 511s (RABe 511 at Zürich Altstetten, 2024): a
    // yellow band behind the upper windows' foot and the lower windows'
    // over the first-class half.
    if (o.first !== "none" && !k2) s += rect(upA, KS.upLo, upB - upA, 1.1, SBB.yellow) + rect(front + KS.doorW, liv.lo[0] + 0.55, rearDoor - front - KS.doorW, 0.55, SBB.yellow);
    if (liv.doorPanel) for (const x of doors) s += rect(x - 0.15, KS.sill, KS.doorW + 0.3, 13.55 - KS.sill, SBB.red);
    for (const x of ups) s += pane(x, KS.upLo, 4.0, KS.upHi - KS.upLo, 0.55);
    for (const x of los) s += pane(x, liv.lo[0], k2 ? 3.9 : 4.4, liv.lo[1] - liv.lo[0], 0.5);
    // The end sections' windows at the intermediate floor.
    if (!cab) s += k2 ? pane(x0 + 3.6, 6.9, 2.8, 2.7, 0.45) : pane(x0 + 2.0, 6.9, 2.6, 2.7, 0.45) + pane(x0 + 5.6, 6.9, 2.6, 2.7, 0.45);
    s += pane(rear + 5.1, 6.9, 2.8, 2.7, 0.45);
    // The doors: red leaves, the blue plate with the class.
    for (const [di, x] of doors.entries()) {
      const cls = k2 ? (isFirst(x) ? "1" : "2") : o.first !== "none" ? (di === 1 ? "1" : "2") : "2";
      if (liv.doorPanel) s += rect(x - 0.15, 10.4, KS.doorW + 0.3, 0.8, liv.plate) + T(c, di === 0 ? x + KS.doorW - 0.5 : x + 0.5, 10.8, 0.6, o.first !== "none" ? "1" : "2", "#ffffff") +
        line(x + 0.4, 9.85, x + KS.doorW - 0.4, 9.85, "#f2f2f2", 0.9);
      const top = liv.gen === 1 ? 8.55 : KS.doorTop - 0.55, ph = liv.gen === 1 ? 0.8 : 0.55;
      s += leaves(x, KS.doorW, KS.sill, top, SBB.red, { glass: [0.38, 0.95], gw: 0.55 }) + rect(x - (liv.gen === 1 ? 0.15 : 0), top, KS.doorW + (liv.gen === 1 ? 0.3 : 0), ph, liv.plate) +
        T(c, x + 0.5, top + ph / 2, ph * 0.75, cls, "#ffffff") + T(c, x + KS.doorW - 0.5, top + ph / 2, ph * 0.75, k2 ? cls : "2", "#ffffff");
      if (liv.sticker) for (const k of [0, 1]) {
        const sx = x + 0.25 + k * KS.doorW / 2, sy = KS.sill + 1.1;
        s += rect(sx, sy, 1.0, 1.0, "#e2007a") + path(poly([[sx, sy], [sx + 1.0, sy], [sx + 1.0, sy + 0.45]]), "#f39200") + path(poly([[sx, sy + 1.0], [sx + 0.6, sy + 1.0], [sx, sy + 0.35]]), "#009fe3") +
          path(poly([[sx + 1.0, sy + 1.0], [sx + 0.55, sy + 1.0], [sx + 1.0, sy + 0.55]]), "#95c11f");
      }
    }
    // The vents over the lower deck's end windows (512).
    if (!k2) for (const x of [los[Math.floor(los.length / 2) - 1], los[Math.floor(los.length / 2)]]) s += rect(x + 0.6, 7.4, 2.4, 0.5, SBB.band, 0, 'rx="0.08" stroke="#c9ccd0" stroke-width="0.6" vector-effect="non-scaling-stroke"');
    // The rear end section's hatch; the skirt line.
    s += rect(x1 - 5.0, 4.6, 2.6, 4.9, "none", 0, `rx="0.4" stroke="#a9aeb5" stroke-width="0.5" ${STROKE}`);
    if (cab) s += kissCab(c, liv);
    // SBB's name: between the decks on a 512; on a 511 high on the cab
    // section or on the end section's side.
    s += k2 ? sbbName(c, front + KS.doorW + 2.3, 9.25, 1.1) : cab ? sbbName(c, 13.4, 12.0, 0.95) : sbbName(c, x0 + 1.6, 11.7, 0.85);
    return s;
  };
  const top = () => rect(rear + 1.8, KS.stepRoof - 0.05, 8.0, 0.55, "#4a4f57", 0.4, 'rx="0.2"') + (cab || o.pan ? "" : rect(x0 + 1.4, KS.stepRoof - 0.05, 8.0, 0.55, "#4a4f57", 0.4, 'rx="0.2"')) +
    (o.pan ? panGear(x0 + 8.4, KS.stepRoof + 0.5, { dir: 1, up: o.pan === "up" }) : "");
  return kissBody(c, { L, x0, x1, cab, k2, bottom, paint, top, step: { rearX: rear + 3.4, frontX: cab ? null : front - 3.4 },
    under: () => truck(tA, { wb: 8.9, d: 36, top: KS.endSill }) + truck(tB, { wb: 8.7, d: 36, top: KS.endSill }) + cases(tA + 6.5, tB - 6.5, KS.sill + 0.05, 3, 0.4) +
      (cab ? (c.coupledL ? coupledCouplers() : autoCoupler(1.4)) + path(poly([[0.9, 1.95], [6.5, 1.95], [6.0, 0.8], [1.6, 0.7]]), "#2a2d31") : "") });
}
// The KISS body outline: the nose or a plain end, the roof (full height
// over the double deck, stepped down over the end sections), the bottom.
function kissBody(c, o) {
  const L = c.L, { x0, x1 } = o, r = 0.9, { rearX, frontX } = o.step;
  const pts = [];
  if (o.cab) pts.push(...(o.k2 ? NOSE_K2 : NOSE_K1).map((p) => [...p]));
  else pts.push([x0, KS.endSill], [x0, KS.stepRoof - r], ["q", x0, KS.stepRoof, x0 + r, KS.stepRoof], [frontX - 1.6, KS.stepRoof],
    ["q", frontX - 0.4, KS.stepRoof, frontX, KS.stepRoof + 0.6], ["q", frontX + 0.4, KS.roof, frontX + 1.6, KS.roof]);
  pts.push([rearX - 1.6, KS.roof], ["q", rearX - 0.4, KS.roof, rearX, KS.stepRoof + 0.6], ["q", rearX + 0.4, KS.stepRoof, rearX + 1.6, KS.stepRoof],
    [x1 - r, KS.stepRoof], ["q", x1, KS.stepRoof, x1, KS.stepRoof - r]);
  const bottom = [...o.bottom].reverse();
  const d = poly([...pts, ...bottom.map((p) => [p[0], p[1]])]);
  const id = newId();
  const ys = [0, KS.roof];
  const stop = (off, color, v, fb) => `<stop offset="${off}" stop-color="${color}" stop-opacity="${fb}" style="stop-opacity:var(${v},${fb})"/>`;
  const shade = `<linearGradient id="${id}-s" gradientUnits="userSpaceOnUse" x1="0" y1="1" x2="0" y2="${KS.roof}">` +
    stop(0, "#000", "--car-shade-low", 0.16) + '<stop offset="0.36" stop-color="#000" stop-opacity="0"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/>' +
    stop(0.8, "#fff", "--car-shade-high", 0.1) + '<stop offset="0.93" stop-color="#fff" stop-opacity="0"/>' + stop(1, "#000", "--car-shade-roof", 0.08) + "</linearGradient>";
  let s = o.under();
  if (c.coupledR) s += rect(x1 - 0.2, 4.0, L - x1 + 0.2, 8.5, C.rubber) + rect(x1 - 0.2, 2.3, L - x1 + 0.2, 0.6, "#2a2d31");
  if (c.coupledL && !o.cab) s += rect(0, 4.0, x0 + 0.2, 8.5, C.rubber) + rect(0, 2.3, x0 + 0.2, 0.6, "#2a2d31");
  s += `<path d="${d}" fill="${SBB.white}"/><clipPath id="${id}"><path d="${d}"/></clipPath><defs>${shade}</defs>` +
    `<g clip-path="url(#${id})">${o.paint()}<rect x="-5" y="0" width="${n(L + 10)}" height="20" fill="url(#${id}-s)"/></g>`;
  s += `<path d="${d}" fill="none" stroke="currentColor" stroke-width="0.8" ${STROKE}/>`;
  return s + o.top();
}
// The cab seen from the side: the windshield black round to the side,
// the red sweep, the cab's side window, the headlights, the equipment
// panel and the small window behind.
function kissCab(c, liv) {
  let s = "";
  if (liv.gen === 2) {
    // 512: the red face from the windshield's foot to the lamps, and a red
    // band round the windshield up to the roof's edge.
    s += path(poly([[1.0, 5.3], [3.4, 5.5], [3.2, 7.6], [2.9, 8.6], [5.9, 12.6], ["q", 7.6, 14.0, 10.5, KS.edge - 0.3], [10.5, KS.edge], ["q", 7.6, 14.6, 5.6, 13.6], [1.7, 8.4], [0.9, 7.0]]), SBB.red);
    s += path(poly([[1.7, 8.4], [5.6, 13.6], ["q", 7.6, 14.6, 10.5, KS.edge + 0.05], [10.5, 16], [-1, 16], [-1, 8.4]]), SBB.black);
    s += path(poly([[6.4, 7.7], ["q", 6.7, 7.4, 7.6, 7.4], [13.0, 7.4], [13.0, 10.5], ["q", 13.0, 10.8, 12.7, 10.8], [9.4, 10.8], ["q", 7.6, 10.4, 6.4, 7.7]]), SBB.black) +
      path(poly([[7.1, 7.7], [9.6, 7.7], [9.6, 10.5], ["q", 8.0, 10.2, 7.1, 7.7]]), C.glass) + pane(9.9, 7.7, 2.8, 2.8, 0.3, "#0d0e10");
    s += rect(1.0, 5.4, 2.4, 0.75, SBB.black, 0, 'rx="0.3"') + circle(1.7, 5.78, 0.25, "#f3ead0") + rect(2.2, 5.55, 1.0, 0.45, "#e8a33a", 0, 'rx="0.1"');
    s += rect(14.4, 4.85, 2.9, 4.75, "#f1f2f3", 0, `rx="0.35" stroke="#a9aeb5" stroke-width="0.5" ${STROKE}`) + slats(14.7, 5.2, 2.3, 4.0, 0.22, "rgba(0,0,0,0.25)") +
      rect(18.6, 8.4, 1.9, 1.2, "none", 0, `rx="0.35" stroke="#a9aeb5" stroke-width="0.5" ${STROKE}`) + pane(22.3, 7.1, 1.8, 2.7, 0.45) +
      line(9.2, 2.0, 9.2, 7.3, "rgba(0,0,0,0.22)", 0.5) + T(c, 11.6, 2.75, 0.3, "STADLER", "#2b3a7a", { weight: 700, spacing: "0.06em" });
    return s;
  }
  // 511 (KISS 1): the windshield black down to the face; the red sweep
  // from under it up the cab's corner into the band over the windows.
  s += path(poly([[0.5, 7.4], [1.3, 8.4], [4.6, 13.9], ["q", 5.5, 15.0, 7.5, 15.05], [7.5, 16], [-1, 16], [-1, 7.4]]), SBB.black);
  s += path(`M0.4 5.2L2.6 5.3C3.4 7.8 4.6 10.6 6.2 12.4C7.2 13.4 8.6 13.55 10.4 13.55L10.4 14.4L7.4 14.4C5.4 14.3 4.0 13.2 3.2 11.8L1.3 8.4L0.5 7.4Z`, SBB.red);
  s += path(poly([[3.4, 8.2], ["q", 3.9, 7.4, 5.0, 7.3], [9.6, 7.3], [9.6, 11.0], ["q", 9.6, 11.3, 9.3, 11.3], [6.8, 11.3], ["q", 4.8, 10.6, 3.4, 8.2]]), SBB.black) +
    path(poly([[4.2, 8.2], ["q", 4.5, 7.6, 5.3, 7.55], [7.2, 7.55], [7.2, 11.0], [6.9, 11.0], ["q", 5.2, 10.4, 4.2, 8.2]]), C.glass) + pane(7.5, 7.55, 1.9, 3.4, 0.3, "#0d0e10");
  s += rect(0.45, 5.35, 2.5, 0.75, SBB.black, 0, 'rx="0.3"') + circle(1.1, 5.72, 0.27, "#f3ead0") + circle(2.0, 5.72, 0.2, "#4a4e55");
  s += rect(12.0, 4.3, 2.0, 6.7, "#eef0f1", 0, `rx="0.3" stroke="#a9aeb5" stroke-width="0.5" ${STROKE}`) + slats(12.25, 4.6, 1.5, 6.1, 0.2, "rgba(0,0,0,0.22)") +
    pane(16.0, 7.3, 1.6, 3.4, 0.5) + line(10.6, 3.3, 10.6, 13.5, "rgba(0,0,0,0.2)", 0.5);
  return s;
}

// ===================== Siemens DTZ (RABe 514) =====================
// The Zürich S-Bahn's Desiro Double Deck (2006-2009, 61 units): four cars
// of 25.0 m, 100 m a unit, every truck motored on the end cars; first
// class in one end car (RAe), its upper windows over the doors set in
// yellow panels and "1" on its doors' plates. ZVV's paint: white, navy
// from the foot up to the lower windows' sills and a navy line at the
// waist carrying the doors' plates; the red front, its edge sweeping up
// round the windshield onto the roof. Measured off a rectified photograph
// of RABe 514 033 (2022); its middle cars' layout from photographs at an
// angle (514 031, 2025; Zürich Wiedikon, 2019), less certain.
const DT = { roof: 15.4, edge: 14.4, sill: 1.8, endSill: 3.7, navy: 4.7, waist: [8.85, 9.5], upLo: 11.55, upHi: 14.1, loLo: 4.3, loHi: 7.3, doorW: 6.0 };
const NOSE_DT = [[1.0, 2.0], [0.6, 2.6], [0.65, 8.3], ["q", 0.8, 9.6, 1.4, 10.8], [3.4, 14.2], ["q", 4.6, DT.roof, 7.0, DT.roof]];
function dtz(c, o) {
  const L = c.L, cab = !!o.cab, x0 = cab ? 0.6 : 0.4, x1 = L - 0.4;
  const doors = cab ? [27.2, 58.3] : [16.0, L - 16.0 - DT.doorW];
  const tA = cab ? 15.0 : 11.0, tB = x1 - 13.3;
  const ups = cab ? seq(26.4, 6.07, 6) : seq(doors[0] - 0.4, 6.0, 8), los = cab ? seq(34.6, 6.1, 4) : seq(doors[0] + 8.2, 6.1, 5);
  const first = o.first;
  const bottom = [[x0, cab ? 2.0 : DT.endSill], [tA + 5.2, cab ? 2.0 : DT.endSill], [tA + 5.6, DT.sill], [tB - 5.6, DT.sill], [tB - 5.2, DT.endSill], [x1, DT.endSill]];
  const paint = () => {
    let s = rect(-1, 0, L + 2, 20, SBB.white) + rect(-1, 0, L + 2, DT.navy, ZVV) + rect(cab ? 14.5 : -1, DT.waist[0], L + 2, DT.waist[1] - DT.waist[0], ZVV) +
      rect(-1, DT.edge, L + 2, 4, "#9aa0a8");
    // First class: the yellow panels round the upper windows over its doors.
    if (first) for (const x of doors) s += rect(x - 0.3, DT.waist[1], DT.doorW + 0.4, DT.edge - DT.waist[1] - 0.05, SBB.yellow);
    for (const x of ups) s += path(poly([[x, DT.upHi], [x + 5.2, DT.upHi], [x + 5.2, DT.upLo + 0.6], ["q", x + 5.2, DT.upLo, x + 4.5, DT.upLo], [x + 0.7, DT.upLo], ["q", x, DT.upLo, x, DT.upLo + 0.6]]), C.glass, 0,
      'stroke="#202328" stroke-width="0.7" vector-effect="non-scaling-stroke"') + rect(x + 0.2, DT.upHi - 0.95, 4.8, 0.7, C.glassLight);
    for (const x of los) s += pane(x, DT.loLo, 4.1, DT.loHi - DT.loLo, 0.45);
    // The side destination display over the first lower window.
    s += rect(los[1] ?? los[0], 7.95, 3.1, 0.5, "#16181b") + rect((los[1] ?? los[0]) + 0.3, 8.1, 1.6, 0.2, "#f39a26", 0, 'opacity="0.85"');
    for (const x of doors) {
      const cls = first ? "1" : "2";
      s += leaves(x, DT.doorW, DT.sill, DT.waist[0], SBB.red, { glass: [0.27, 0.92], gw: 0.55 }) + rect(x, DT.waist[0], DT.doorW, DT.waist[1] - DT.waist[0], ZVV) +
        T(c, x + 0.45, 9.17, 0.55, cls, "#ffffff") + T(c, x + DT.doorW - 0.45, 9.17, 0.55, cls, "#ffffff") +
        rect(x + 0.2, 2.7, 2.5, 0.75, "#f4f4f4") + rect(x + DT.doorW / 2 + 0.25, 2.7, 1.5, 1.0, "#f4f4f4") + circle(x + DT.doorW / 2 + 0.8, 3.2, 0.25, "none", 0, `stroke="${ZVV}" stroke-width="0.5" vector-effect="non-scaling-stroke"`);
    }
    // End sections: an intermediate-floor window, louvres.
    s += pane(x1 - 13.2, 7.3, 2.9, 2.9, 0.4) + rect(x1 - 8.1, 11.9, 3.5, 0.9, "#a9aeb5") + rect(x1 - 8.1, 8.1, 3.5, 2.0, "#a9aeb5") + rect(x1 - 8.1, 5.6, 3.5, 1.2, "#a9aeb5");
    if (!cab) s += pane(x0 + 2.0, 7.3, 2.9, 2.9, 0.4) + rect(x0 + 6.6, 8.1, 3.5, 2.0, "#a9aeb5");
    if (cab) s += dtzCab(c);
    s += sbbName(c, (cab ? 34.2 : doors[0] + 8.0), 11.05, 1.0);
    return s;
  };
  // Outline: no roof step; the nose or a plain end.
  const pts = cab ? NOSE_DT.map((p) => [...p]) : [[x0, DT.endSill], [x0, DT.roof - 1.2], ["q", x0, DT.roof, x0 + 1.2, DT.roof]];
  const d = poly([...pts, [x1 - 1.2, DT.roof], ["q", x1, DT.roof, x1, DT.roof - 1.2], ...[...bottom].reverse()]);
  return outlineBody(c, d, paint, () => truck(tA, { wb: 8.2, d: 36, top: cab ? 2.0 : DT.endSill }) + truck(tB, { wb: 8.2, d: 36, top: DT.endSill }) + cases(tA + 6, tB - 6, DT.sill + 0.05, 3, 0.4) +
    (cab ? (c.coupledL ? coupledCouplers() : autoCoupler(1.4)) + path(poly([[0.9, 2.05], [6.0, 2.05], [5.5, 0.8], [1.5, 0.7]]), "#2a2d31") : ""),
    () => rect(x1 - 16, DT.roof - 0.1, 9, 0.6, "#8d939b", 0.4, 'rx="0.2"') + (o.pan ? panGear(cab ? 22 : L / 2, DT.roof, { dir: -1, up: o.pan === "up" }) : ""), cab);
}
// The DTZ's cab side: the red front and its sweep, the windshield, the
// cab's side window, the big hatch behind.
function dtzCab(c) {
  let s = path(`M-1 4.7L2.6 4.7L2.6 8.4L-1 8.4Z`, SBB.red);
  s += path(`M8.2 4.7C8.3 7.4 8.5 10.0 9.2 12.0C9.7 13.4 10.4 14.5 11.6 ${DT.roof + 0.2}L10.0 ${DT.roof + 0.2}C9.0 14.5 8.4 13.4 7.9 12.0C7.2 10.0 6.9 7.6 6.8 4.7Z`, SBB.red);
  s += path(`M1.2 8.4L6.9 8.4C7.1 10.2 7.4 11.6 7.9 12.6C8.4 13.6 9.0 14.6 10.0 ${DT.roof + 0.2}L-1 ${DT.roof + 0.2}L-1 8.4Z`, SBB.black);
  s += path(`M2.6 4.7L6.8 4.7C6.85 6.2 6.9 7.4 6.9 8.4L2.6 8.4Z`, "#f4f4f2");
  s += path(poly([[10.7, 8.4], [14.5, 8.4], [14.5, 12.0], [13.3, 12.0], ["q", 11.4, 10.8, 10.7, 8.4]]), SBB.black) + path(poly([[11.4, 8.6], [13.0, 8.6], [13.0, 11.6], ["q", 11.8, 10.7, 11.4, 8.6]]), C.glass);
  s += rect(14.5, 4.0, 4.8, 8.2, "none", 0, `stroke="#aeb3b9" stroke-width="0.6" ${STROKE}`) + rect(16.3, 12.6, 2.2, 0.8, "#2a2d31");
  s += T(c, 1.3, 6.9, 0.5, "SBB CFF FFS", "#ffffff", { weight: 700, anchor: "start" });
  return s;
}
// A body from its outline d: paint clipped to it and shaded, the gear
// under it, the outline, the roof gear.
function outlineBody(c, d, paint, under, top, cab) {
  const L = c.L, id = newId();
  const stop = (off, color, v, fb) => `<stop offset="${off}" stop-color="${color}" stop-opacity="${fb}" style="stop-opacity:var(${v},${fb})"/>`;
  const shade = `<linearGradient id="${id}-s" gradientUnits="userSpaceOnUse" x1="0" y1="1" x2="0" y2="16">` +
    stop(0, "#000", "--car-shade-low", 0.16) + '<stop offset="0.36" stop-color="#000" stop-opacity="0"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/>' +
    stop(0.8, "#fff", "--car-shade-high", 0.1) + '<stop offset="0.93" stop-color="#fff" stop-opacity="0"/>' + stop(1, "#000", "--car-shade-roof", 0.08) + "</linearGradient>";
  let s = under();
  if (c.coupledR) s += rect(L - 0.6, 4.2, 0.6, 8.5, C.rubber) + rect(L - 0.6, 2.3, 0.6, 0.6, "#2a2d31");
  if (c.coupledL && !cab) s += rect(0, 4.2, 0.6, 8.5, C.rubber) + rect(0, 2.3, 0.6, 0.6, "#2a2d31");
  s += `<path d="${d}" fill="${SBB.white}"/><clipPath id="${id}"><path d="${d}"/></clipPath><defs>${shade}</defs>` +
    `<g clip-path="url(#${id})">${paint()}<rect x="-5" y="0" width="${n(L + 10)}" height="20" fill="url(#${id}-s)"/></g>`;
  return s + `<path d="${d}" fill="none" stroke="currentColor" stroke-width="0.8" ${STROKE}/>` + top();
}

// ===================== Zürich S-Bahn push-pull: Re 450 and DPZplus =====================
// The first generation's double-deck push-pull trains (1989-1997), all
// rebuilt as DPZplus (2012-2018): a Re 450 locomotive, a low-floor B
// (B-NDW, 2011-2016), the AB and the Bt cab car, each coach 26.8 m. ZVV's
// navy all over, a white band between the decks, red doors; first class
// in the AB, yellow lines over its lower and under its upper windows.
// Measured off rectified photographs of AB 50 85 36-33 (Ziegelbrücke,
// 2023) and Re 450 012 (Balsthal, 2024); the B-NDW and the Bt off
// photographs at an angle (Ziegelbrücke 2023, 2025), less certain.
const DP = { roof: 15.0, edge: 14.0, band: [7.85, 11.0], sill: 3.2, endSill: 3.9, upLo: 11.3, upHi: 13.5, loLo: 5.2, loHi: 7.7, doorLo: 4.7, doorHi: 11.0 };
const ZVVN = "#1f2a6b";
// A DPZ door: red leaves, the navy plate with the classes, ZVV's sticker.
function dpzDoor(c, x, w, cls) {
  let s = leaves(x, w, DP.doorLo, DP.doorHi - 0.45, SBB.red, { glass: [0.35, 0.92], gw: 0.42 }) + rect(x, DP.doorHi - 0.45, w, 0.45, ZVVN) +
    T(c, x + 0.4, DP.doorHi - 0.22, 0.38, cls[0], "#ffffff") + T(c, x + w - 0.4, DP.doorHi - 0.22, 0.38, cls[1], "#ffffff");
  return s + rect(x + 0.15, 5.0, w / 2 - 0.3, 0.6, "#f2f2f2") + rect(x + w / 2 + 0.15, 5.0, 1.3, 0.6, "#f2f2f2") + rect(x + w / 2 - 0.25, 7.2, 0.5, 0.8, SBB.yellow);
}
// A DPZ coach (AB or the Bt with its cab on the left); first: the AB.
function dpzCoach(c, o) {
  const L = c.L, cab = !!o.cab, x0 = cab ? 0.8 : 0.6, x1 = L - 0.6;
  const d1 = cab ? 9.6 : 7.3, d2 = 73.4, dw = 7.2;
  const lows = [20.3, 27.2, 33.8, 40.5, 47.2, 53.6, 60.2], ups = [20.5, 27.25, 34.1, 40.7, 47.4, 53.8, 60.3];
  const tA = 11.8, tB = L - 11.8;
  const paint = () => {
    let s = rect(-1, 0, L + 2, 20, ZVVN) + rect(cab ? d1 + dw : -1, DP.band[0], (cab ? d2 - d1 - dw : L + 2), DP.band[1] - DP.band[0], "#f4f4f2") +
      rect(-1, DP.edge, L + 2, 4, "#8f959d") + rect(-1, 0, L + 2, 3.0, "#20242a");
    if (!cab) s += rect(d2, DP.band[0], 30, DP.band[1] - DP.band[0], "#f4f4f2");
    if (o.first) s += rect(d1 + dw, 7.15, d2 - d1 - dw, 0.25, SBB.yellow) + rect(46.0, 11.75, d2 - 46.0, 0.25, SBB.yellow);
    for (const x of ups) s += pane(x, DP.upLo, 4.6, DP.upHi - DP.upLo, 0.5);
    s += pane(65.7, DP.upLo, 2.6, DP.upHi - DP.upLo, 0.5);
    for (const x of lows) s += pane(x, DP.loLo, 4.1, DP.loHi - DP.loLo, 0.35);
    s += pane(65.5, DP.loLo, 2.5, DP.loHi - DP.loLo, 0.35);
    if (!cab) s += pane(1.8, 8.3, 4.2, 2.5, 0.4) + T(c, 3.9, 9.5, 1.0, "&#x1F6B2;", "#ffffff", { weight: 400 });
    s += pane(81.6, 8.3, 4.2, 2.5, 0.4);
    s += dpzDoor(c, d1, dw, o.first ? ["2", "1"] : ["2", "2"]) + dpzDoor(c, d2, dw, o.first ? ["1", "1"] : ["2", "2"]);
    s += rect(46.0, 9.35, 3.6, 0.55, "#16181b") + rect(46.3, 9.5, 1.8, 0.25, "#f39a26", 0, 'opacity="0.85"');
    s += sbbName(c, 30.0, 9.6, 0.95);
    if (cab) s += dpzCabSide(c);
    return s;
  };
  const nose = [[0.9, 2.6], [0.6, 3.4], [0.6, 7.6], [1.8, 11.8], ["q", 2.3, 13.2, 3.4, 14.2], ["q", 4.4, DP.roof, 6.6, DP.roof]];
  const pts = cab ? nose : [[x0, DP.endSill], [x0, DP.roof - 1.2], ["q", x0, DP.roof, x0 + 1.2, DP.roof]];
  const bottom = [[x0, cab ? 2.6 : DP.endSill], [tA + 5.6, cab ? 2.6 : DP.endSill], [tA + 6.0, DP.sill], [tB - 6.0, DP.sill], [tB - 5.6, DP.endSill], [x1, DP.endSill]];
  const d = poly([...pts, [x1 - 1.2, DP.roof], ["q", x1, DP.roof, x1, DP.roof - 1.2], ...[...bottom].reverse()]);
  return outlineBody(c, d, paint, () => truck(tA, { wb: 8.2, d: 36, top: DP.endSill }) + truck(tB, { wb: 8.2, d: 36, top: DP.endSill }) + cases(tA + 6.5, tB - 6.5, DP.sill + 0.05, 3, 0.5) +
    (cab ? (c.coupledL ? coupledCouplers() : rect(0.2, 2.1, 1.2, 1.1, "#2a2d31") + autoCoupler(1.2, 2.6)) : ""),
    () => rect(1.5, DP.roof - 0.1, 4.0, 0.4, "#6d737b", 0.4, 'rx="0.15"') + rect(L - 5.5, DP.roof - 0.1, 4.0, 0.4, "#6d737b", 0.4, 'rx="0.15"'), cab);
}
// The Bt's cab: red front from the bumper to the roof, the windshield
// raked back, the side window.
function dpzCabSide(c) {
  let s = path(`M-1 2.5L4.6 2.5L4.6 13.2Q5.2 14.2 7.4 14.6L7.4 16L-1 16Z`, SBB.red);
  s += path(poly([[1.9, 11.4], [3.0, 14.0], [4.0, 14.0], [4.0, 11.4]]), C.glass) + rect(0.7, 4.3, 1.4, 0.6, "#f3ead0", 0.3, 'rx="0.2"');
  s += pane(5.2, 8.6, 3.0, 2.2, 0.35) + line(4.7, 3.0, 4.7, 13.0, "rgba(0,0,0,0.25)", 0.5);
  return s;
}
// The B-NDW (2011-2016): low floor between its doors, set further in;
// three windows in the white band over the left end, two over the right.
function dpzNdw(c) {
  const L = c.L, x0 = 0.6, x1 = L - 0.6, d1 = 17.0, d2 = 54.4, dw = 5.4, tA = 11.8, tB = L - 11.8;
  const paint = () => {
    let s = rect(-1, 0, L + 2, 20, ZVVN) + rect(-1, DP.band[0], L + 2, DP.band[1] - DP.band[0], "#f4f4f2") + rect(-1, DP.edge, L + 2, 4, "#8f959d") + rect(-1, 0, L + 2, 2.6, "#20242a");
    for (const x of [4.0, 7.4, 10.8]) s += pane(x, 8.4, 2.3, 2.3, 0.35);
    for (const x of [68.0, 72.6]) s += pane(x, 8.2, 3.6, 2.6, 0.4);
    for (const x of seq(23.6, 5.0, 6)) s += pane(x, 4.2, 4.0, 3.2, 0.35);
    for (const x of seq(18.6, 5.4, 9)) s += pane(x, DP.upLo, 4.4, DP.upHi - DP.upLo, 0.5);
    for (const x of [d1, d2]) s += leaves(x, dw, 2.2, DP.doorHi - 0.45, SBB.red, { glass: [0.35, 0.92], gw: 0.42 }) + rect(x, DP.doorHi - 0.45, dw, 0.45, ZVVN) +
      T(c, x + 0.4, DP.doorHi - 0.22, 0.38, "2", "#ffffff") + T(c, x + dw - 0.4, DP.doorHi - 0.22, 0.38, "2", "#ffffff") + rect(x + 0.15, 2.9, dw / 2 - 0.3, 0.55, "#f2f2f2");
    s += rect(36.0, 9.35, 3.4, 0.55, "#16181b") + rect(41.0, 9.35, 3.4, 0.55, "#16181b");
    return s + sbbName(c, 24.5, 9.55, 0.9);
  };
  const bottom = [[x0, DP.endSill], [tA + 5.0, DP.endSill], [tA + 5.6, 2.1], [tB - 5.6, 2.1], [tB - 5.0, DP.endSill], [x1, DP.endSill]];
  const d = poly([[x0, DP.endSill], [x0, DP.roof - 1.2], ["q", x0, DP.roof, x0 + 1.2, DP.roof], [x1 - 1.2, DP.roof], ["q", x1, DP.roof, x1, DP.roof - 1.2], ...[...bottom].reverse()]);
  return outlineBody(c, d, paint, () => truck(tA, { wb: 8.2, d: 33, top: DP.endSill }) + truck(tB, { wb: 8.2, d: 33, top: DP.endSill }) + cases(tA + 6, d1 - 0.5, 2.15, 1, 0.4),
    () => rect(2.0, DP.roof - 0.1, 9.0, 0.5, "#6d737b", 0.4, 'rx="0.15"'), false);
}
// Re 450 (SLM, ABB, SWP; 1989-1997, 113 built): 18.4 m, one full cab (the
// red front), a small auxiliary cab at the coaches' end; navy, fluted
// sides, a row of roof-light grilles; two pantographs.
function re450(c) {
  const L = c.L;
  const paint = () => {
    let s = rect(-1, 0, L + 2, 20, ZVVN) + rect(-1, 13.45, L + 2, 4, "#8f959d") + rect(-1, 0, L + 2, 3.5, "#202329");
    s += path(`M-1 2.5L6.4 2.5L6.4 13.5Q6.5 14.0 7.1 14.1L7.1 16L-1 16Z`, SBB.red);
    s += path(poly([[2.5, 8.6], [4.4, 13.0], [5.9, 13.0], [5.9, 8.6]]), C.glass) + rect(1.0, 5.0, 1.0, 0.6, "#f3ead0", 0.3, 'rx="0.2"');
    s += pane(7.2, 8.6, 4.4, 2.0, 0.3) + rect(12.6, 4.6, 2.0, 6.2, "none", 0, `stroke="#14193f" stroke-width="0.6" ${STROKE}`) + pane(13.05, 7.5, 1.1, 2.9, 0.3);
    s += lines(seq(5.0, 0.62, 10).map((y) => [16.3, y, 51.5, y]), "#2c397f", 0.6);
    s += lines(seq(16.6, 4.4, 8).map((x) => [x, 11.55, x + 4.0, 11.55]), "#2a2f4a", 0.6);
    for (const x of seq(16.6, 4.4, 8)) s += rect(x, 11.55, 4.0, 1.1, "#9ba1a9", 0, 'rx="0.12"') + slats(x + 0.1, 11.6, 3.8, 1.0, 0.25, "rgba(0,0,0,0.18)");
    s += pane(54.3, 8.6, 2.2, 1.8, 0.25) + rect(52.6, 4.6, 1.3, 6.0, "none", 0, `stroke="#14193f" stroke-width="0.6" ${STROKE}`);
    return s + sbbName(c, 37.5, 5.6, 0.95, "#ffffff");
  };
  const d = poly([[1.2, 2.5], [0.8, 3.2], [0.8, 6.6], [3.0, 12.6], ["q", 3.5, 13.9, 5.0, 13.95], [L - 1.4, 13.95], ["q", L - 0.6, 13.95, L - 0.6, 13.0], [L - 0.6, 3.0], [1.2, 3.0]]);
  return outlineBody(c, d, paint, () => truck(L / 2 - 16.4, { wb: 9.2, d: 43, kind: "loco", top: 3.4 }) + truck(L / 2 + 16.4, { wb: 9.2, d: 43, kind: "loco", top: 3.4 }) +
    cases(L / 2 - 10.5, L / 2 + 10.5, 3.05, 2, 1.0) + (c.coupledL ? "" : rect(0.0, 2.2, 1.6, 1.0, "#2a2d31") + rect(0, 1.6, 0.6, 2.4, "#3b3f45")),
    () => panGear(17.0, 13.95, { dir: 1, up: false }) + panGear(L - 13.0, 13.95, { dir: -1, up: true }) + rect(26, 13.9, 14, 0.5, "#6d737b", 0.4, 'rx="0.15"'), true);
}
// Re 420 "LION" (Re 4/4 II, 1964-1985; the 30 rebuilt 2012-2015 for the
// Zürich S-Bahn's rush-hour trains, 420 201-230): 15.4 m over the
// buffers, a cab at each end. Paint (RABe 420 226, Schaffhausen, 2014; 420
// 221 and 228, 2022, the latest photographs found): SBB red, the window
// band's frames and the roof black, the side's foot anthracite; a big white
// SBB emblem drawn in stripes toward one end, "SBB CFF FFS" white, the
// Swiss shield on the front. Measured off a rectified photograph of 420
// 226.
function re420(c) {
  const L = c.L;
  const paint = () => {
    let s = rect(-1, 0, L + 2, 20, "#d8262c") + rect(-1, 12.3, L + 2, 4, "#3a3d42") + rect(-1, 0, L + 2, 4.6, "#2f3237");
    // The cab's windows in their black frame: the front corner glass, the
    // side window, the crew door's.
    s += rect(1.0, 8.0, 15.0, 3.6, SBB.black, 0, 'rx="0.4"') + pane(1.4, 8.3, 2.0, 3.0, 0.3) + pane(4.2, 8.3, 4.6, 3.0, 0.3) + pane(9.4, 8.3, 2.0, 3.0, 0.3) +
      pane(12.8, 8.3, 2.5, 3.0, 0.3);
    s += rect(12.4, 4.8, 3.3, 6.9, "none", 0, `stroke="#7d1510" stroke-width="0.6" ${STROKE}`);
    // The louvred panel behind the cab, the machine room's windows, the
    // other cab's window and door.
    s += rect(17.6, 4.9, 2.5, 5.2, "none", 0, `stroke="#7d1510" stroke-width="0.6" ${STROKE}`) + rect(17.9, 8.9, 1.9, 0.9, "#9b1a14") + slats(17.9, 8.9, 1.9, 0.9, 0.2, "rgba(0,0,0,0.35)") +
      rect(17.9, 5.3, 1.9, 2.6, "#9b1a14") + slats(17.9, 5.3, 1.9, 2.6, 0.2, "rgba(0,0,0,0.35)");
    s += pane(22.2, 9.4, 4.2, 2.6, 0.35) + pane(32.0, 9.4, 3.6, 2.6, 0.35) + rect(L - 3.0, 9.2, 2.3, 3.0, SBB.black, 0, 'rx="0.3"') + pane(L - 2.8, 9.4, 1.9, 2.6, 0.3) +
      rect(L - 3.4, 4.8, 2.6, 6.9, "none", 0, `stroke="#7d1510" stroke-width="0.6" ${STROKE}`);
    // The striped emblem: the SBB arrows and cross in white bands.
    s += lionEmblem(c, 42.6, 8.3, 8.0);
    s += T(c, 23.9, 6.6, 1.0, "SBB CFF FFS", "#ffffff", { weight: 700 });
    // Front: the Swiss shield, lamps.
    s += rect(0.3, 6.9, 0.9, 1.0, "#d8262c") + rect(0.6, 5.5, 0.5, 0.5, "#f3ead0", 0.3, 'rx="0.15"');
    return s;
  };
  const d = poly([[0.8, 4.0], [0.8, 11.4], ["q", 0.9, 12.3, 1.8, 12.4], [3.0, 13.3], [L - 3.0, 13.3], [L - 1.8, 12.4], ["q", L - 0.9, 12.3, L - 0.8, 11.4], [L - 0.8, 4.0]]);
  return outlineBody(c, d, paint, () => truck(L / 2 - 12.95, { wb: 8.8, d: 49, kind: "loco", top: 4.0 }) + truck(L / 2 + 12.95, { wb: 8.8, d: 49, kind: "loco", top: 4.0 }) +
    cases(L / 2 - 6, L / 2 + 6, 4.0, 2, 1.0) + (c.coupledL ? "" : buffersAt(0, -1)) + (c.coupledR ? "" : buffersAt(L, 1)),
    () => rect(5, 13.25, L - 10, 0.5, "#4a4f57", 0.4, 'rx="0.15"') + lines(seq(6, 4.6, 9).map((x) => [x, 13.3, x + 3.8, 13.3]), "#9aa0a8", 0.8) +
      panGear(L / 2 - 8.5, 13.5, { dir: 1, up: false }) + panGear(L / 2 + 8.5, 13.5, { dir: -1, up: true }), true);
}
// Side buffers and the headstock at an end (x: the buffers' faces).
const buffersAt = (x, side) => rect(side < 0 ? x : x - 0.9, 3.1, 0.9, 0.8, "#2a2d31") + rect(side < 0 ? x : x - 0.25, 2.8, 0.25, 1.4, "#3b3f45") + rect(side < 0 ? x + 0.4 : x - 1.6, 2.3, 1.2, 1.9, "#2a2d31", 0, 'opacity="0.9"');
// The LION locomotives' emblem: a hexagon of white bands with the cross
// and its arrows left open.
function lionEmblem(c, cx, cy, w) {
  // White bands filling a flat hexagon; the window and a "T" left open in
  // red in its middle (420 226, 2014).
  const h = w * 0.62, rows = 21, bh = h / rows;
  let s = "";
  for (let k = 0; k < rows; k++) {
    if (k % 2) continue;
    const y = cy - h / 2 + k * bh, t = Math.abs(y + bh / 2 - cy) / (h / 2), half = (w / 2) * (1 - 0.45 * t);
    s += rect(cx - half, y, half * 2, bh, "#ffffff");
  }
  s += rect(cx - w * 0.17, cy + h * 0.06, w * 0.34, h * 0.42, "#d8262c") + rect(cx - w * 0.03, cy - h / 2, w * 0.06, h * 0.4, "#d8262c");
  return s + pane(cx - w * 0.15, cy + h * 0.1, w * 0.3, h * 0.34, 0.3);
}

// ===================== NPZ "Domino" (RBDe 560 DO, B, ABt) =====================
// The regional push-pull units of 1984-1996, rebuilt 2009-2014 as
// "Domino": the RBDe 560 motor car, a low-floor B added in the middle (or
// two, or none), the ABt cab car with first class at its cab end; cars of
// about 25 m. SBB's regional paint: white, a black window band, anthracite
// low, red doors and a red line along the roof's edge; the flat red cab
// face. Measured off a rectified photograph of an ABt (Dietikon? 2025, a
// four-car S 29); the RBDe's side and the B's off the same photograph at
// an angle, less certain.
const NP = { roof: 12.9, sill: 2.9, skirt: 3.4, bandLo: 6.2, bandHi: 9.0, stripe: [11.35, 11.75], doorLo: 2.6, doorHi: 9.8 };
function npzDoor(c, x, w, cls, lo = NP.doorLo) {
  return leaves(x, w, lo, NP.doorHi - 0.4, SBB.red, { glass: [0.35, 0.95], gw: 0.45 }) + rect(x, NP.doorHi - 0.4, w, 0.4, SBB.blue) +
    T(c, x + 0.35, NP.doorHi - 0.2, 0.32, cls, "#ffffff") + T(c, x + w - 0.35, NP.doorHi - 0.2, 0.32, cls, "#ffffff");
}
// The flat cab face seen from the side: red from the buffer beam to the
// roof, the windscreen's edge, the cab door and window.
function npzCab(c, x1) {
  let s = rect(-1, NP.sill, x1 + 1, 11, SBB.red) + rect(-1, 8.4, 1.6, 2.5, SBB.black) + rect(0.4, 5.0, 0.9, 0.55, "#f3ead0", 0.3, 'rx="0.2"');
  s += rect(x1 - 0.2, NP.doorLo + 0.3, 2.4, NP.doorHi - NP.doorLo - 0.2, "none", 0, `stroke="#9aa0a7" stroke-width="0.6" ${STROKE}`) + pane(x1 + 0.35, 7.0, 1.3, 2.2, 0.25);
  return s;
}
function npzCar(c, o) {
  const L = c.L, x0 = 0.5, x1 = L - 0.5, kind = o.kind;
  const paint = () => {
    let s = rect(-1, 0, L + 2, 20, SBB.white) + rect(-1, 0, L + 2, NP.skirt, SBB.skirt) + rect(-1, NP.stripe[0], L + 2, NP.stripe[1] - NP.stripe[0], SBB.red) + rect(-1, NP.stripe[1], L + 2, 3, "#8f959d");
    if (kind === "ABt") {
      s += rect(-1, NP.bandLo, 76, NP.bandHi - NP.bandLo, SBB.band) + rect(41.6, NP.bandHi, 33.4, 0.4, SBB.yellow);
      for (const [a, b] of [[5.7, 10.0], [11.4, 15.7], [17.1, 21.3], [30.5, 34.8], [36.4, 40.7], [42.4, 46.8], [48.4, 52.6], [62.9, 67.3], [69.1, 73.7]]) s += pane(a, NP.bandLo + 0.2, b - a, 2.4, 0.4);
      s += npzDoor(c, 23.4, 5.0, "2") + npzDoor(c, 55.2, 5.0, "1") + T(c, 53.9, 7.7, 0.9, "1", "#ffffff", { weight: 500 }) + T(c, 61.6, 7.7, 0.9, "1", "#ffffff", { weight: 500 });
      s += sbbName(c, 35.0, 4.9, 0.75);
      s += `<g transform="matrix(-1 0 0 1 ${n(L)} 0)">${npzCab(c, 5.4)}</g>`;
    } else if (kind === "B") {
      // The low-floor middle car: its floor dropped between the doors,
      // tall windows there; three windows over each truck.
      s += rect(-1, NP.bandLo, L + 2, NP.bandHi - NP.bandLo, SBB.band) + rect(25.6, 4.2, 30.0, 2.2, SBB.band);
      for (const x of [2.6, 8.2, 13.8, 62.4, 68.0, 73.6]) s += pane(x, NP.bandLo + 0.2, 4.4, 2.4, 0.4);
      for (const x of [26.4, 33.6, 40.8, 48.0]) s += pane(x, 4.5, 4.4, 4.3, 0.45);
      s += npzDoor(c, 20.0, 5.0, "2", 1.6) + npzDoor(c, 56.0, 5.0, "2", 1.6);
      s += sbbName(c, 3.0, 4.7, 0.7);
    } else {
      // RBDe 560: the cab, a luggage room behind it (its wide door), the
      // passenger saloon, a door at each end of it.
      s += rect(15.0, NP.bandLo, 62.0, NP.bandHi - NP.bandLo, SBB.band);
      for (const x of [16.2, 21.8, 33.9, 39.5, 45.1, 50.7, 56.3, 68.6]) s += pane(x, NP.bandLo + 0.2, 4.4, 2.4, 0.4);
      s += rect(8.2, NP.doorLo + 0.3, 5.2, NP.doorHi - NP.doorLo - 0.4, "none", 0, `stroke="#9aa0a7" stroke-width="0.6" ${STROKE}`) + pane(9.4, 7.0, 2.8, 1.8, 0.3);
      s += npzDoor(c, 27.0, 5.0, "2") + npzDoor(c, 61.8, 5.0, "2") + sbbName(c, 41.0, 4.9, 0.75);
      s += npzCab(c, 5.4);
    }
    return s;
  };
  const front = kind !== "B";
  const bottomY = kind === "B" ? 1.5 : NP.sill;
  const tA = 11.6, tB = L - 11.6;
  const d = kind === "B"
    ? poly([[x0, NP.sill], [x0, NP.roof - 1], ["q", x0, NP.roof, x0 + 1, NP.roof], [x1 - 1, NP.roof], ["q", x1, NP.roof, x1, NP.roof - 1], [x1, NP.sill], [tB - 5.2, NP.sill], [tB - 5.8, 1.5], [tA + 5.8, 1.5], [tA + 5.2, NP.sill]])
    : poly([[x0, NP.sill], [x0, NP.roof - 0.6], ["q", x0, NP.roof, x0 + 0.6, NP.roof], [x1 - 1, NP.roof], ["q", x1, NP.roof, x1, NP.roof - 1], [x1, NP.sill]]);
  const cabLeft = kind === "RBDe", cabRight = kind === "ABt";
  return outlineBody({ ...c, coupledL: c.coupledL && !cabLeft, coupledR: c.coupledR && !cabRight }, d, paint,
    () => truck(tA, { wb: 8.5, d: kind === "RBDe" ? 40 : 33, kind: kind === "RBDe" ? "loco" : "car", top: NP.sill }) + truck(tB, { wb: 8.5, d: kind === "RBDe" ? 40 : 33, kind: kind === "RBDe" ? "loco" : "car", top: NP.sill }) +
      (kind === "B" ? "" : cases(tA + 6, tB - 6, NP.sill + 0.05, 3, 1.1)) +
      (cabLeft && !c.coupledL ? rect(0, 2.7, 0.8, 1.2, "#2a2d31") + rect(0, 2.1, 1.5, 0.5, "#3b3f45") : "") + (cabRight && !c.coupledR ? rect(L - 0.8, 2.7, 0.8, 1.2, "#2a2d31") + rect(L - 1.5, 2.1, 1.5, 0.5, "#3b3f45") : ""),
    () => kind === "RBDe" ? rect(9.0, NP.roof - 0.1, 14.0, 1.0, "#4a4f57", 0.4, 'rx="0.25"') + panGear(30.0, NP.roof + 0.15, { dir: -1, up: true }) + rect(40, NP.roof - 0.1, 22, 0.9, "#4a4f57", 0.4, 'rx="0.25"')
      : rect(L / 2 - 8, NP.roof - 0.1, 16, 0.6, "#6d737b", 0.4, 'rx="0.2"'), false);
}

// ===================== Stadler GTW 2/8 (RABe 520) =====================
// The Seetal line's narrow articulated units (2002, 15 left; to be
// replaced in 2029): two end cars (Bt, ABt) of 17.0 m, a 15.0 m middle
// car and a 4.45 m power module between the middle car and the ABt, on
// Jakobs trucks; low floor, 2.65 m wide. SBB's regional paint with the red
// sweep round the cab and up along the roof's edge. Off photographs of
// RABe 520 005 and 006 at an angle (Ballwil, 2023; Ermensee, 2024): door
// and window positions approximate.
const GT = { roof: 12.6, sill: 1.6, skirt: 2.4, winLo: 4.4, winHi: 9.2, doorHi: 9.9, edge: 11.4 };
function gtwCar(c, o) {
  const L = c.L, cab = !!o.cab, x0 = cab ? 0.8 : 0.3, x1 = L - 0.3;
  const wins = cab ? [[11.4, 15.2], [15.6, 19.4], [26.6, 30.4], [30.8, 34.4], [41.0, 44.8], [45.2, 49.0], [49.4, 53.0]] : [[2.0, 5.8], [6.2, 10.0], [19.6, 23.4], [23.8, 27.6], [28.0, 31.8], [42.0, 45.8]];
  const doors = cab ? [20.4, 35.0] : [11.0, 33.0];
  const paint = () => {
    // The GTW's windows in one black band; its roof SBB red (Ballwil, 2023).
    let s = rect(-1, 0, L + 2, 20, SBB.white) + rect(-1, 0, L + 2, GT.skirt, SBB.skirt) + rect(-1, GT.edge, L + 2, 3, SBB.red) +
      rect(cab ? 10.6 : -1, GT.winLo - 0.25, L + 2, GT.winHi - GT.winLo + 0.5, SBB.band);
    if (o.first) s += rect(wins[0][0], GT.winHi + 0.2, doors[0] - wins[0][0] + 5, 0.35, SBB.yellow);
    for (const [a, b] of wins) s += pane(a, GT.winLo, b - a, GT.winHi - GT.winLo, 0.3);
    for (const [i, x] of doors.entries()) {
      const cls = o.first && i === 0 ? "1" : "2";
      s += leaves(x, 4.4, GT.sill, GT.doorHi - 0.4, SBB.red, { glass: [0.3, 0.95], gw: 0.5 }) + rect(x, GT.doorHi - 0.4, 4.4, 0.45, SBB.blue) +
        T(c, x + 1.6, GT.doorHi - 0.18, 0.35, cls, "#ffffff") + T(c, x + 2.8, GT.doorHi - 0.18, 0.35, cls, "#ffffff");
    }
    if (cab) {
      s += path(`M-1 3.0L2.5 3.0C3.2 5.5 4.6 8.8 6.2 10.4C7.2 11.3 8.6 ${GT.edge} 10.6 ${GT.edge}L10.6 ${GT.edge + 0.5}L-1 ${GT.edge + 0.5}Z`, SBB.red);
      s += path(`M0.9 6.2C1.6 8.4 2.7 10.4 4.2 11.3L5.6 11.3C4.6 10.0 3.9 8.0 3.6 6.2Z`, SBB.black) + pane(6.4, 6.0, 3.6, 3.4, 0.6) + rect(1.0, 4.6, 1.2, 0.5, "#f3ead0", 0.3, 'rx="0.2"');
      s += sbbName(c, 26.5, 3.4, 1.1);
    } else s += sbbName(c, 39.5, 3.5, 0.75);
    return s;
  };
  const pts = cab ? [[1.2, 1.6], [0.8, 2.4], [0.9, 6.0], ["q", 1.6, 9.4, 4.0, 11.6], ["q", 5.6, GT.roof, 8.0, GT.roof]] : [[x0, GT.sill], [x0, GT.roof - 0.8], ["q", x0, GT.roof, x0 + 0.8, GT.roof]];
  const d = poly([...pts, [x1 - 0.8, GT.roof], ["q", x1, GT.roof, x1, GT.roof - 0.8], [x1, GT.sill]]);
  return outlineBody(c, d, paint, () => (cab ? truck(8.5, { wb: 7.2, d: 28, top: GT.sill + 0.6 }) + (c.coupledL ? coupledCouplers(2.4) : autoCoupler(1.2, 2.4)) : truck(0, { wb: 7.2, d: 28, top: GT.sill + 0.6 })) +
    truck(L, { wb: 7.2, d: 28, top: GT.sill + 0.6 }) + cases(cab ? 14 : 6, L - 6, GT.sill + 0.05, 2, 0.5),
    () => rect(L / 2 - 6, GT.roof - 0.1, 9, 0.6, "#9aa0a8", 0.4, 'rx="0.2"'), cab);
}
// The power module: a short, tall box over its own truck, louvres either
// side of the corridor, the pantograph on top.
function gtwPack(c) {
  const L = c.L;
  const paint = () => {
    let s = rect(-1, 0, L + 2, 20, SBB.white) + rect(-1, 0, L + 2, 3.4, SBB.skirt) + rect(-1, 11.6, L + 2, 0.45, SBB.red) + rect(-1, 12.05, L + 2, 3, "#8f959d");
    for (const x of [1.0, L - 5.0]) s += rect(x, 5.0, 4.0, 5.4, "rgba(20,22,25,0.6)", 0, 'rx="0.2"') + slats(x + 0.2, 5.2, 3.6, 5.0, 0.32, "rgba(255,255,255,0.2)");
    return s + pane(L / 2 - 1.0, 6.5, 2.0, 3.0, 0.3);
  };
  const d = poly([[0.3, 3.4], [0.3, 12.8], [L - 0.3, 12.8], [L - 0.3, 3.4]]);
  return outlineBody(c, d, paint, () => truck(L / 2, { wb: 7.2, d: 33, kind: "loco", top: 3.4 }) + rect(1.0, 1.6, L - 2, 1.0, "#2a2d31", 0, 'rx="0.4"'),
    () => rect(0.8, 12.75, L - 1.6, 0.7, "#6d737b", 0.4, 'rx="0.2"') + pantograph(L / 2, 13.45, { up: true, facing: -1 }), false);
}

// ===================== SNCF Régiolis Z 31500 (Léman Express) =====================
// Alstom's Régiolis for the Léman Express (Auvergne-Rhône-Alpes region,
// SNCF Voyageurs; 2018-2019, 27 units since 2019's order): four cars on
// Jakobs trucks, 71.8 m, 2.85 m wide; the end cars about 20.4 m to the
// truck's middle, the middle ones 15.5 m; two double doors a side in each
// car; first class in a part of the AB (car 2), marked by a yellow line at
// the windows' top and the doors' yellow-and-blue plates "1 | 2".
// Measured off a rectified photograph of Z 31519/20 (Chambésy, 2021) and
// one of a unit at Genthod-Bellevue (2025); its first paint (most units in
// 2025-2026): light grey, the cab and a band along the roof's edge red,
// broad blue and pale blue bands slanting across each car, red doors.
const RG = { roof: 12.3, sill: 1.7, skirt: 3.0, winLo: 4.2, winHi: 8.5, doorLo: 1.9, doorHi: 8.95, edgeLo: 9.75, edgeHi: 11.0, grey: "#d9dcdf", red: "#e2343b",
  blue: "#2b62ad", pale: "#62a9dc", navy: "#1e3b74" };
const NOSE_RG = [[1.2, 1.6], [0.5, 2.6], [0.45, 4.6], ["q", 0.6, 6.4, 1.8, 7.6], [5.6, 11.2], ["q", 7.4, RG.roof, 10.0, RG.roof]];
function rgDoor(c, x, cls = ["2", "2"], first = false) {
  let s = leaves(x, 5.4, RG.doorLo, RG.doorHi, SBB.red, { glass: [0.45, 0.85], gw: 0.45 }) + rect(x, RG.doorHi - 0.65, 5.4, 0.65, RG.navy) +
    (first ? rect(x, RG.doorHi - 0.65, 2.7, 0.65, SBB.yellow) : "");
  s += T(c, x - 0.45, 6.8, 0.75, cls[0], first ? SBB.black : "#ffffff", { weight: 500 }) + T(c, x + 5.85, 6.8, 0.75, cls[1], "#ffffff", { weight: 500 });
  return s + rect(x - 0.6, RG.edgeLo - 0.55, 6.6, 0.6, "#c9cdd2", 0.3, 'rx="0.25"');
}
// The slanting bands over a car: a broad blue one and a pale one beside
// it, from the roof's edge down across the windows (x: where the pair
// meets the roof's edge).
const rgBands = (x) => path(poly([[x, RG.edgeLo], [x + 3.2, RG.edgeLo], [x + 9.0, RG.skirt], [x + 5.8, RG.skirt]]), RG.blue) +
  path(poly([[x + 4.4, RG.edgeLo], [x + 6.4, RG.edgeLo], [x + 12.2, RG.skirt], [x + 10.2, RG.skirt]]), RG.pale);
function regiolis(c, o) {
  const L = c.L, cab = !!o.cab, x1 = L - 0.25;
  const doors = cab ? [28.7, 47.6] : [15.0, 33.1];
  const wins = cab ? [[16.0, 27.9], [35.0, 46.8], [53.9, 65.6]] : [[1.2, 14.2], [21.1, 32.4], [39.3, 50.4]];
  const paint = () => {
    let s = rect(-1, 0, L + 2, 20, RG.grey) + rect(-1, 0, L + 2, RG.skirt, "#8a9097") + rect(-1, RG.edgeLo, L + 2, RG.edgeHi - RG.edgeLo, RG.red) + rect(-1, RG.edgeHi, L + 2, 3, "#5d636b");
    s += cab ? rgBands(13.0) + rgBands(40.0) : rgBands(2.0) + rgBands(37.0);
    for (const [a, b] of wins) s += rect(a, RG.winLo, b - a, RG.winHi - RG.winLo, "#2d3036", 0, 'rx="0.7"') + pane(a + 0.3, RG.winLo + 0.3, (b - a) / 2 - 0.45, RG.winHi - RG.winLo - 0.9, 0.35, "#1c1e22") +
      pane(a + (b - a) / 2 + 0.15, RG.winLo + 0.3, (b - a) / 2 - 0.45, RG.winHi - RG.winLo - 0.9, 0.35, "#1c1e22");
    // First class (the AB): a yellow line along the windows' top over its
    // first-class end.
    if (o.first) s += rect(wins[2][0] - 1.2, RG.winHi, L - wins[2][0] + 2, 0.4, SBB.yellow);
    s += doors.map((x, i) => rgDoor(c, x, o.first && i === 1 ? ["1", "2"] : ["2", "2"], o.first && i === 1)).join("");
    if (cab) {
      // The cab: red from the nose up over the roof, a pale and a blue band
      // sweeping down its side; the black windshield; the crew door.
      s += path(`M-1 6.5C1.5 8.5 3.6 9.8 6.0 ${RG.edgeLo}L14 ${RG.edgeLo}L14 14L-1 14Z`, RG.red);
      s += path(`M5.0 9.6C4.0 7.4 3.6 5.0 4.2 ${RG.skirt}L5.4 ${RG.skirt}C5.0 5.0 5.4 7.4 6.2 9.4Z`, RG.pale) +
        path(`M3.6 9.0C2.6 7.0 2.3 5.0 2.8 ${RG.skirt}L4.0 ${RG.skirt}C3.5 5.0 3.8 7.2 4.8 9.6Z`, RG.blue);
      s += path(poly([[1.4, 7.9], [5.6, 11.3], ["q", 7.4, 12.3, 10.0, 12.35], [10.0, 14], [-1, 14], [-1, 7.9]]), SBB.black);
      s += rect(6.6, RG.doorLo + 0.6, 2.0, RG.doorHi - RG.doorLo, "none", 0, `stroke="#9aa0a7" stroke-width="0.6" ${STROKE}`) + rect(7.2, 6.4, 0.7, 2.4, C.glass, 0, 'rx="0.15"');
      s += rect(0.7, 3.9, 1.9, 0.9, SBB.black, 0, 'rx="0.4"') + circle(1.4, 4.35, 0.32, "#f3ead0") + circle(2.1, 4.35, 0.25, "#f3ead0");
      // SNCF's mark on the cab side; the network's waves and LÉMAN EXPRESS.
      s += rect(2.3, 6.0, 1.5, 1.3, SBB.red, 0, 'rx="0.25"') + T(c, 3.05, 6.65, 0.45, "SNCF", "#ffffff", { weight: 800, italic: true, spacing: "-0.03em" });
      s += lexEmblem(c, 12.0, 8.4, 1.3) + T(c, 12.0, 7.0, 0.72, "LÉMAN EXPRESS", RG.navy, { weight: 500, spacing: "0.03em" });
    } else if (o.first) s += T(c, 46.0, 3.6, 0.42, "La Région Auvergne-Rhône-Alpes", "#3d4249", { weight: 600 });
    return s;
  };
  const pts = cab ? NOSE_RG : [[0.25, RG.sill], [0.25, RG.roof - 0.7], ["q", 0.25, RG.roof, 0.95, RG.roof]];
  const d = poly([...pts, [x1 - 0.7, RG.roof], ["q", x1, RG.roof, x1, RG.roof - 0.7], [x1, RG.sill]]);
  return outlineBody(c, d, paint, () => (cab ? truck(16.5, { wb: 8.5, d: 34, top: RG.sill + 0.3 }) + (c.coupledL ? coupledCouplers(2.6) : autoCoupler(1.3, 2.6)) +
      path(poly([[0.8, RG.sill + 0.1], [6.0, RG.sill + 0.1], [5.4, 0.8], [1.4, 0.7]]), "#2a2d31") : jakobs(0, RG.sill + 0.3, 33)) + jakobs(L, RG.sill + 0.3, 33) +
    cases(cab ? 23 : 6, L - 6, RG.sill + 0.05, 2, 0.6),
    () => rect(cab ? 14 : 2, RG.roof - 0.1, L - (cab ? 18 : 6), 1.0, "#4a4f57", 0.4, 'rx="0.25"') + slats(cab ? 15 : 3, RG.roof + 0.1, L - (cab ? 20 : 8), 0.7, 0.6, "rgba(255,255,255,0.18)") +
      (o.pan ? panGear(L - 12, RG.roof + 0.9, { dir: -1 }) : ""), cab);
}

// ===================== Tables =====================
const M = (draw, len) => ({ draw, len, oneEnd: false, variant: (c) => `${c.index}/${c.count}` });
export const TYPES = {}, MODELS = {};
function add(key, name, draw, len, extra = {}) {
  TYPES[key] = { name, kind: "emu", ...extra };
  MODELS[key] = M(draw, len);
}
// An end car: key leads its unit (cab on the left), key + "R" closes it.
const CABS = new Set();
function addCab(key, name, draw, len, extra = {}) {
  add(key, name, draw, len, extra);
  add(`${key}R`, name, (c) => facingRight(c, draw), len, extra);
  CABS.add(key);
}
const FIRST = { amenities: ["first"] };
// A four-car FLIRT: its end cars (Bt: second class; ABt: first class
// behind the cab, and the pantograph over its rear truck, as photographed
// on RABe 523 019, 524 305) and its middle cars (B).
function flirtSet(k, name, G, liv, size, { lenCab, lenMid, layout = "cab4", panBoth = false } = {}) {
  addCab(`${k}Bt`, `${name} end car`, (c) => f1Cab(c, { G, layout, liv, pan: panBoth }), lenCab);
  addCab(`${k}ABt`, `${name} end car with first class`, (c) => f1Cab(c, { G, layout, liv, first: true, pan: true }), lenCab, FIRST);
  add(`${k}B`, `${name} middle car`, (c) => f1Mid(c, { G, liv }), lenMid);
}
const F1L = { lenCab: 68.7, lenMid: 52.82 }, F3L = { lenCab: 69.06, lenMid: 51.51 }, F522L = { lenCab: 70.2, lenMid: 52.82 };
flirtSet("sbbr523", "FLIRT (RABe 523)", F1, LIV_SBB, 4, F1L);
flirtSet("sbbr523v", "FLIRT (RABe 523, RER Vaud)", F1, LIV_VAUD, 4, F1L);
flirtSet("sbbr523z", "FLIRT (RABe 523, Stadtbahn Zug)", F1, LIV_ZUG, 4, F1L);
flirtSet("sbbr521", "FLIRT (RABe 521, S-Bahn Basel)", F1, LIV_BASEL, 4, F1L);
flirtSet("sbbr524", "TILO FLIRT (RABe 524)", F1, LIV_TILO, 4, F1L);
flirtSet("sbbr522", "FLIRT (RABe 522)", F522, LIV522_SBB, 4, F522L);
flirtSet("sbbr522x", "Léman Express FLIRT (RABe 522)", F522, LIV522_LEX, 4, F522L);
flirtSet("sbbr523n", "FLIRT 3 (RABe 523 1xx, RER Vaud)", F3, LIV3_VAUD, 4, F3L);
flirtSet("sbbr523f", "FLIRT 3 (RABe 523 5xx)", F3, LIV3_SBB, 4, F3L);
// TILO's six-car FLIRTs (RABe 524 101-117, and the FLIRT 3s 524 301-305):
// first class at both ends, a pantograph at each.
addCab("sbbr524lABt", "TILO FLIRT (RABe 524, six cars) end car with first class", (c) => f1Cab(c, { G: F1, layout: "cab6", liv: LIV_TILO, first: true, pan: true }), 68.7, FIRST);
add("sbbr524lB", "TILO FLIRT (RABe 524, six cars) middle car", (c) => f1Mid(c, { G: F1, liv: LIV_TILO }), 52.82);
addCab("sbbr524nABt", "TILO FLIRT 3 (RABe 524 3xx) end car with first class", (c) => f1Cab(c, { G: F3, layout: "cab4", liv: LIV3_TILO, first: true, pan: true }), 69.06, FIRST);
add("sbbr524nB", "TILO FLIRT 3 (RABe 524 3xx) middle car", (c) => f1Mid(c, { G: F3, liv: LIV3_TILO }), 51.51);
// KISS: Bt (end car), AB (first class at one end), B; the 512's A (all
// first class).
for (const [k, name, liv, lenCab] of [["sbbr511z", "KISS (RABe 511, Zürich S-Bahn)", KISS_SBZ, 83.2], ["sbbr511", "KISS (RABe 511)", KISS_GREY, 83.2], ["sbbr512", "KISS (RABe 512)", KISS_512, 86.3]]) {
  addCab(`${k}Bt`, `${name} end car`, (c) => kiss(c, { liv, cab: true, first: "none" }), lenCab);
  add(`${k}B`, `${name} middle car`, (c) => kiss(c, { liv, first: "none" }), 81.4);
  // The pantograph: on the AB cars' outer end section (photograph, Zürich
  // Altstetten 2024), next to the end car.
  addCab(`${k}AB`, `${name} car with first class`, (c) => kiss(c, { liv, first: "half", pan: "up" }), 81.4, FIRST);
}
// DTZ: the RAe (first class) and RBe end cars, two B middle cars, one
// with the pantograph.
addCab("sbbr514A", "DTZ (RABe 514) end car, first class", (c) => dtz(c, { cab: true, first: true }), 82.0, FIRST);
addCab("sbbr514B", "DTZ (RABe 514) end car", (c) => dtz(c, { cab: true }), 82.0);
add("sbbr514M", "DTZ (RABe 514) middle car", (c) => dtz(c, { pan: "up" }), 82.0);
// The Zürich push-pull trains: Re 450, B-NDW, AB, Bt; the rush-hour
// trains' Re 420 and their unrebuilt coaches (drawn as the DPZplus's).
add("sbbr450", "Re 450 locomotive", (c) => re450(c), 60.4, { kind: "electric" });
add("sbbr450R", "Re 450 locomotive", (c) => facingRight(c, re450), 60.4, { kind: "electric" });
add("sbbrDpzB", "DPZplus low-floor coach (B-NDW)", dpzNdw, 87.9, { kind: "coach" });
add("sbbrDpzAB", "DPZplus double-deck coach with first class (AB)", (c) => dpzCoach(c, { first: true }), 87.9, { kind: "coach", amenities: ["first"] });
add("sbbrDpzABR", "DPZplus double-deck coach with first class (AB)", (c) => facingRight(c, (cc) => dpzCoach(cc, { first: true })), 87.9, { kind: "coach", amenities: ["first"] });
add("sbbrDpzBt", "DPZplus double-deck cab car (Bt)", (c) => dpzCoach(c, { cab: true }), 87.9, { kind: "coach", cab: true });
add("sbbrDpzBtR", "DPZplus double-deck cab car (Bt)", (c) => facingRight(c, (cc) => dpzCoach(cc, { cab: true })), 87.9, { kind: "coach", cab: true });
add("sbbrDpzB2", "Double-deck coach (B, DPZ/HVZ)", (c) => dpzCoach(c, { first: false }), 87.9, { kind: "coach" });
add("sbbr420", "Re 420 locomotive", re420, 50.5, { kind: "electric" });
add("sbbr420R", "Re 420 locomotive", (c) => facingRight(c, re420), 50.5, { kind: "electric" });
// Domino: the RBDe 560 motor car (cab on the left), the low-floor B, the
// ABt (cab on the right as drawn; R: turned round).
add("sbbrDomRBDe", "Domino motor car (RBDe 560)", (c) => npzCar(c, { kind: "RBDe" }), 82.0, { kind: "emu" });
add("sbbrDomRBDeR", "Domino motor car (RBDe 560)", (c) => facingRight(c, (cc) => npzCar(cc, { kind: "RBDe" })), 82.0, { kind: "emu" });
add("sbbrDomB", "Domino low-floor middle car (B)", (c) => npzCar(c, { kind: "B" }), 81.0, { kind: "emu" });
add("sbbrDomABt", "Domino cab car with first class (ABt)", (c) => npzCar(c, { kind: "ABt" }), 82.0, { kind: "emu", amenities: ["first"] });
add("sbbrDomABtR", "Domino cab car with first class (ABt)", (c) => facingRight(c, (cc) => npzCar(cc, { kind: "ABt" })), 82.0, { kind: "emu", amenities: ["first"] });
// GTW 520: the Bt (cab left), B, the power module, the ABt.
addCab("sbbr520Bt", "GTW (RABe 520) end car", (c) => gtwCar(c, { cab: true }), 55.8);
addCab("sbbr520ABt", "GTW (RABe 520) end car with first class", (c) => gtwCar(c, { cab: true, first: true }), 55.8, FIRST);
add("sbbr520B", "GTW (RABe 520) middle car", (c) => gtwCar(c, {}), 49.0);
add("sbbr520Re", "GTW (RABe 520) power module", gtwPack, 14.6, { kind: "module" });
for (const k of ["de462End", "de462Mid", "de463End", "de463Mid"]) if (INTL_TYPES[k] && INTL_MODELS[k]) { TYPES[k] = INTL_TYPES[k]; MODELS[k] = INTL_MODELS[k]; }
// Régiolis Z 31500 (Léman Express, SNCF): Bt end cars, the AB (first class
// at its right end as drawn; R: turned round) with the pantograph, a B.
addCab("sbbrZ31Bt", "Régiolis (Z 31500, Léman Express) end car", (c) => regiolis(c, { cab: true }), 67.0);
add("sbbrZ31AB", "Régiolis (Z 31500, Léman Express) car with first class", (c) => regiolis(c, { first: true, pan: true }), 51.0, FIRST);
add("sbbrZ31ABR", "Régiolis (Z 31500, Léman Express) car with first class", (c) => facingRight(c, (cc) => regiolis(cc, { first: true, pan: true })), 51.0, FIRST);
add("sbbrZ31B", "Régiolis (Z 31500, Léman Express) middle car", (c) => regiolis(c, {}), 51.0);
add("sbbr512A", "KISS (RABe 512) first-class car", (c) => kiss(c, { liv: KISS_512, first: "full" }), 81.4, FIRST);

// ===================== Car numbers =====================
// SBB's European Vehicle Numbers, as its register lists them (data.sbb.ch
// "rollmaterial", September 2025): a multiple unit's cars share the unit's
// series and number, the fifth digit giving the car's place, e.g. RABe 523
// 038 = 94 85 1 523 038 (Bt) ... 94 85 4 523 038 (B). Coaches and
// locomotives: their own UIC numbers (Re 450 91 85 4 450 xxx, Re 420 91 85
// 4 420 xxx, DPZplus AB 50 85 36-33, B-NDW 50 85 26-73, Bt 50 85 86-33,
// Domino ABt 50 85 39-43 8xx/9xx, B 50 85 20/29-43, RBDe 560 94 85 7 560).
// [place digit, series, first unit, last unit, key]
const UNIT_CARS = [
  // KISS RABe 511 (Bt1 AB2 B3 B4 AB5 Bt6; the four-car 1xx Bt1 AB2 B4 Bt6):
  // 001-013, 031-035, 039-069 the Zürich S-Bahn's, the rest grey.
  ...[[1, 13, "sbbr511z"], [14, 30, "sbbr511"], [31, 35, "sbbr511z"], [36, 38, "sbbr511"], [39, 69, "sbbr511z"], [101, 124, "sbbr511"]]
    .flatMap(([a, b, k]) => [[1, 511, a, b, `${k}Bt`], [2, 511, a, b, `${k}AB`], [3, 511, a, b, `${k}B`], [4, 511, a, b, `${k}B`], [5, 511, a, b, `${k}AB`], [6, 511, a, b, `${k}Bt`]]),
  // KISS RABe 512 (2022-2026): Bt1, Bt2, B3, AB4, A5, B6.
  [1, 512, 1, 60, "sbbr512Bt"], [2, 512, 1, 60, "sbbr512Bt"], [3, 512, 1, 60, "sbbr512B"], [4, 512, 1, 60, "sbbr512AB"], [5, 512, 1, 60, "sbbr512A"], [6, 512, 1, 60, "sbbr512B"],
  // DTZ RABe 514: At1 (RAe, first class), B2, B3, Bt4 (RBe).
  [1, 514, 1, 61, "sbbr514A"], [2, 514, 1, 61, "sbbr514M"], [3, 514, 1, 61, "sbbr514M"], [4, 514, 1, 61, "sbbr514B"],
  // GTW RABe 520: Bt1, ABt2, power module 3, B4.
  [1, 520, 0, 16, "sbbr520Bt"], [2, 520, 0, 16, "sbbr520ABt"], [3, 520, 0, 16, "sbbr520Re"], [4, 520, 0, 16, "sbbr520B"],
  // FLIRT (Bt1, ABt2, B3, B4; TILO's six-car ABt1, ABt2, B3-B6).
  ...flirtRanges(521, [[1, 30, "sbbr521"], [201, 209, "sbbr523"]]),
  ...flirtRanges(522, [[201, 202, "sbbr522x"], [203, 211, "sbbr522"], [212, 232, "sbbr522x"]]),
  ...flirtRanges(523, [[1, 12, "sbbr523z"], [13, 31, "sbbr523v"], [32, 73, "sbbr523"], [101, 114, "sbbr523n"], [501, 514, "sbbr523f"]]),
  ...flirtRanges(524, [[1, 19, "sbbr524"]]),
  [1, 524, 101, 117, "sbbr524lABt"], [2, 524, 101, 117, "sbbr524lABt"], ...[3, 4, 5, 6].map((k) => [k, 524, 101, 117, "sbbr524lB"]),
  [1, 524, 301, 305, "sbbr524nABt"], [2, 524, 301, 305, "sbbr524nABt"], ...[3, 4, 5, 6].map((k) => [k, 524, 301, 305, "sbbr524nB"]),
];
function flirtRanges(series, groups) {
  return groups.flatMap(([a, b, k]) => [[1, series, a, b, `${k}Bt`], [2, series, a, b, `${k}ABt`], [3, series, a, b, `${k}B`], [4, series, a, b, `${k}B`]]);
}
// As number ranges over the 12-digit EVN (check digit 0-9).
const evn = (place, series, unit, check) => Number(`9485${place}${series}${String(unit).padStart(3, "0")}${check}`);
export const FLEETS = {
  sbbregio: [
    ...UNIT_CARS.map(([pl, se, a, b, k]) => [evn(pl, se, a, 0), evn(pl, se, b, 9), k]),
    [948575600000, 948575609999, "sbbrDomRBDe"], [948575620000, 948575629999, "sbbrDomRBDe"],
    [508539430000, 508539439999, "sbbrDomABt"], [508520430000, 508520439999, "sbbrDomB"], [508529430000, 508529439999, "sbbrDomB"],
    [918544500000, 918544509999, "sbbr450"], [918544200000, 918544209999, "sbbr420"],
    [508536330000, 508536331499, "sbbrDpzAB"], [508536331500, 508536331999, "sbbrDpzAB"], [508526730000, 508526739999, "sbbrDpzB"],
    [508526330000, 508526339999, "sbbrDpzB2"], [508586330000, 508586339999, "sbbrDpzBt"],
    // SNCF's Régiolis on the Léman Express: end cars 94 87 0 031 5xx, the
    // middle cars 94 87 0 311 5xx (B and AB alike by number; the model
    // string tells them apart).
    [948700315000, 948700315999, "sbbrZ31Bt"], [948703115000, 948703115999, "sbbrZ31B"],
  ],
};

// ===================== A real formation, car by car =====================
// The Train Formation Service names each car's model ("Bt511-SBZ",
// "AB4(512)", "RBe514", "ABt523(F/ETCS)", "B522-x", "Re450+", "B-NDW",
// "AB+", "Bt+", "Re420-HVZ", "AB-HVZ(3G)", "RBDe(AK/3G)", "B-CH(W/F)",
// "ABt-TN"), its class and usually its EVN (October 2026). Which way an
// end car faces follows from its order among the train's end cars: the
// first leads its unit (cab ahead), the next closes it, and so on.
const unitOf = (num) => (/^\d{12}$/.test(num || "") && num.startsWith("9485") ? { place: +num[4], series: +num.slice(5, 8), unit: +num.slice(8, 11) } : null);
function family(model, num) {
  const m = model || "", u = unitOf(num), se = u?.series ?? +(m.match(/(5\d\d)/)?.[1] || 0), unit = u?.unit;
  const pick = (groups, dflt) => (unit == null ? dflt : groups.find(([a, b]) => unit >= a && unit <= b)?.[2] ?? dflt);
  switch (se) {
    case 511: return /SBZ/.test(m) ? "sbbr511z" : pick([[1, 13, "sbbr511z"], [31, 35, "sbbr511z"], [39, 69, "sbbr511z"]], "sbbr511");
    case 512: return "sbbr512";
    case 514: return "sbbr514";
    case 520: return "sbbr520";
    case 521: return pick([[201, 299, "sbbr523"]], "sbbr521");
    case 522: return pick([[203, 211, "sbbr522"]], /-x|E1/.test(m) ? "sbbr522x" : unit == null ? "sbbr522" : "sbbr522x");
    case 523: return /TRN/.test(m) ? "sbbr523" : pick([[1, 12, "sbbr523z"], [13, 31, "sbbr523v"], [101, 114, "sbbr523n"], [501, 599, "sbbr523f"]], "sbbr523");
    case 524: return pick([[101, 199, "sbbr524l"], [301, 399, "sbbr524n"]], "sbbr524");
    default: return null;
  }
}
// What a car is: { key, end } (end: a car that ends its unit, with a cab
// or a locomotive's), or null.
function carKind(car) {
  const m = (car.model || "").replace(/\s+/g, ""), num = car.number || "";
  if (/^Re450/.test(m) || num.startsWith("9185445")) return { key: "sbbr450", end: true };
  if (/^Re420/.test(m) || num.startsWith("9185442")) return { key: "sbbr420", end: true };
  if (/^Bt\+/.test(m) || num.startsWith("50858633")) return { key: "sbbrDpzBt", end: true };
  if (/^AB(\+|-HVZ)/.test(m) || num.startsWith("50853633")) return { key: "sbbrDpzAB", mid: "dpz" };
  if (/^B-NDW/.test(m) || num.startsWith("50852673")) return { key: "sbbrDpzB" };
  if (/^B-HVZ/.test(m) || num.startsWith("50852633")) return { key: "sbbrDpzB2" };
  if (/^RBDe/.test(m) || num.startsWith("948575")) return { key: "sbbrDomRBDe", end: true, npz: "left" };
  if (/^ABt(\(|-TN|$)/.test(m) || num.startsWith("50853943")) return { key: "sbbrDomABt", end: true, npz: "right" };
  if (/^B-CH/.test(m) || /^5085(20|29)43/.test(num)) return { key: "sbbrDomB" };
  // SNCF's Régiolis (Z 31500) on the Léman Express: "Bt31500-(ETCS)",
  // "AB31500-x", "B31500-x" (EVN 94 87 0 031 5xx / 94 87 0 311 5xx).
  if (/31500/.test(m) || /^948700(31|311)5/.test(num)) return /^Bt/.test(m) ? { key: "sbbrZ31Bt", end: true } : /^AB/.test(m) ? { key: "sbbrZ31AB", mid: "z31" } : { key: "sbbrZ31B" };
  const f = family(m, num);
  if (!f) return null;
  const head = m.match(/^(R?[AB]{0,2}[Dt]?e?|Re)\d?/)?.[0] || "";
  if (f === "sbbr514") return /^RAe|^At/.test(m) ? { key: "sbbr514A", end: true } : /^RBe|^Bt/.test(m) ? { key: "sbbr514B", end: true } : { key: "sbbr514M" };
  if (f === "sbbr520") return /^Re/.test(m) ? { key: "sbbr520Re" } : /^ABt/.test(m) ? { key: "sbbr520ABt", end: true } : /^Bt/.test(m) ? { key: "sbbr520Bt", end: true } : { key: "sbbr520B" };
  if (f === "sbbr511z" || f === "sbbr511" || f === "sbbr512") {
    if (/^Bt/.test(m)) return { key: `${f}Bt`, end: true };
    if (/^AB/.test(m)) return { key: `${f}AB`, mid: f === "sbbr512" ? "kiss2" : "kiss1" };
    if (/^A\d?\(|^A\d/.test(m)) return { key: "sbbr512A" };
    return { key: `${f}B` };
  }
  // FLIRTs.
  if (/^ABt/.test(m)) return { key: f === "sbbr524l" || f === "sbbr524n" ? `${f}ABt` : `${f}ABt`, end: true };
  if (/^Bt/.test(m)) return { key: f === "sbbr524l" || f === "sbbr524n" ? `${f}ABt` : `${f}Bt`, end: true };
  return head || m ? { key: `${f}B` } : null;
}
export const FORMATION = {
  sbbregio: (car, i, cars) => {
    const kinds = cars.map(carKind), k = kinds[i];
    if (!k || !TYPES[k.key]) return null;
    const ends = kinds.map((x, j) => (x?.end ? j : -1)).filter((j) => j >= 0);
    if (k.end) {
      // Cab ahead for the 1st, 3rd ... end car; turned round for the 2nd, 4th ...
      const leads = ends.indexOf(i) % 2 === 0;
      if (k.npz === "right") return leads ? `${k.key}R` : k.key;     // the ABt is drawn cab on the right
      return leads ? k.key : `${k.key}R`;
    }
    // A coach with first class at one end: toward its unit's end car (511),
    // toward the A car (512), toward the Bt (DPZplus).
    if (k.mid) {
      const prev = ends.filter((j) => j < i).pop(), next = ends.find((j) => j > i);
      let left;
      if (k.mid === "kiss2") left = kinds[i - 1]?.key === "sbbr512A";
      else if (k.mid === "dpz") left = next != null && kinds[next].key === "sbbrDpzBt";
      else if (k.mid === "z31") left = kinds[i + 1]?.key === "sbbrZ31B";
      else left = prev != null && (next == null || i - prev <= next - i);
      return left ? k.key : `${k.key}R`;
    }
    return k.key;
  },
};

// ===================== What usually runs =====================
// SBB's 2026 annual formation plan (data.sbb.ch "jahresformation", the
// timetable from 14 December 2025) for every train number SBB runs in
// this railroad's timetable, as on 23 October 2026 (Monday to Thursday):
// the units it plans and how many, coded as below; consecutive train
// numbers with the same plan run together. Each entry: the step from the
// last range's end (base 36), the range's length (base 36), the code.
// Built October 2026; the plan's Mondays to Thursdays, its longest
// section.
const BY_NUMBER = "kl.0.b1 1.0.d1 2.0.b1 11b.3.d1 d2.0.e1 14.7.p2 ql.f.b1 b.1.q1 1p.0.h1 2.2.h2 1.1.h1 1.0.h2 1.0.h1 1.0.h2 1.d.h1 1.0.h2 1.0.h1 1.3.h2 1.0.h1 1.0.h2 2.0.h1 7l.4.p1 1.0.p2 1.d.p1 1.0.p2 1.3.p1 1.1.p2 1.a.p1 34.n.h1 al.l.a1 c.0.d1 g.z.m1 33.0.l1 1.t.a1 1.1.l1 1.0.a1 1.0.p1 1.1.l1 1.0.p1 1.0.i1 1.0.l1 c.10.a1 e.0.d1 1.0.b1d1 1.1.d2 1.0.b1d1 1.1.d1 1.0.b1 1.9.d1 1.0.b1 1.1.d1 1.0.b1d1 1.1.d1 1.0.b1d1 1.0.b1 1.9.d1 1u.12.a1 2.0.b1 ns.5c.m1 a.u.h1 2.0.m1 1.c.h1 3.0.m1 1.7.h1 1.0.m1 3.1.h1 3.0.p1 1.7.h1 1.0.p1 2.0.h1 1.0.m1 1.0.h1 2.6b.p1 1.2.p2 1.z.p1 1.3.p2 1.gl.p1 1.3.p2 1.j.p1 3k.0.h2 1.0.h1 1.0.h2 1.0.h1 2.0.h2 1.i.h1 1.2.h2 1.21.h1 1.0.h2 1.1.h1 1.0.h2 1.k.h1 1.0.h2 1.4v.h1 1.0.i1 3.1.h1 3.0.i1 1.3.h1 1.0.m1 3.1.h1 7.0.m1 1.3.h1 1.0.m1 b.4.h1 1.0.m1 3.5.h1 3.0.m1 1.0.h1 3x.q.p1 1.1.p2 1.l.p1 1.1.p2 1.0.p1 1.0.m1 1.f.p1 1.1.p2 1.0.p1 1.0.m1 1.5.p1 1.1.m1 1.1i.p1 24.21.h1 ek.1.p1 1.0.l1 2.4.p1 1.0.l1 1.18.p1 1.0.l1 1.j.p1 1.0.h1 1.2j.p1 g.d.h1 5.2.p1 1.0.p2 1.4.p1 1.0.p2 1.0.p1 1.0.p2 1.s.p1 1.0.p2 1.0.p1 1.0.p2 1.3.p1 1.1.p2 1.0.p1 1.0.p2 1.t.p1 f.0.h2 4.0.h1 3.5.h2 3.1.h1 3.0.h2 1.0.h1 3.0.h2 1.n.h1 1.0.h2 3.0.h1 1.0.h2 3.1.h1 3.0.h2 1.0.h1 3.0.h2 1.38.h1 i.0.p1 2.0.i1 2.0.h1j1 1.9.i1 1.1.h1j1 1.9.i1 1.1.h1j1 1.9.i1 1.1.h1j1 1.9.i1 1.1.h1j1 1.9.i1 1.1.h1j1 1.7.i1 1.1.h1j1 1.5.i1 1.0.h1j1 1.0.p1 1.0.i1 2.0.h1 2.0.p1 3mn.0.a1 2.0.e1 3.0.a1 2.0.e1 1.1b.a1 3.9.e1 1.0.a1 1.1.f1 1.1.a1 1.1.f1 1.0.a1 3.7.e1 3.7.f1 e.1.p1 1.1.p2 1.1.p1 2.0.p2 c.6.q1 1.0.d1 1.1.q1 1.0.d1 1.4.q1 1.0.q2 1.2.q1 cm.4.h1 1.0.h2 1.1.h1 1.0.h2 1.0.h1 1.1.h2 1.0.h1 1.0.h2 1.0.h1 1.2.h2 1.1.h1 1.0.h2 1.1.h1 1.0.h2 1.4.h1 1.0.h2 1.5.h1 3.0.h2 1.0.h1 1.0.h2 1.0.h1 1.0.h2 1.0.h1 2.0.h2 3.0.h1 2.4.h2 1.0.h1 3.5.h2 1.0.h1 1.5.h2 1.2.h1 1.0.h2 1.5.h1 1.0.h2 1.d.h1 4.27.q1 3.0.q2 1.c.q1 1xk.8.p1 2.d.l1 8.c.i1 9.x.l1 a.0.i1 2.i.p1 1.0.p3 1.0.p1 1.0.p2 1.0.p3 1.b.p2 1.v.p1 1.3.p2 1.o.p1 m.4.i1 3.0.p1 1.3.p3 1.3.p2 1.r.p1 1.3.p2 1.7.p1 1.3.p2 1.k.p1 h.0.l1 1.0.i1 1.0.l2 1.0.l1 1.0.l2 1.2.l1 1.3.l2 1.1.l1 1.1.l2 1.t.l1 1.1.l2 1.1.l1 1.3.l2 1.2.l1 1.1.l2 1.0.l3 1.p.l1 3.2p.q1 k.1p.i1 c1.0.a1 1.0.f2 1.0.e1 2.0.f2 2.1y.e1 6.0.f1 t.7.m1 2j.0.e2 1.0.e1 1.1.e2 1.0.a1 1.1.e2 1.1.e1 1.3.e2 1.0.a1 1.5.e1 1.0.a1 1.7.e1 1.0.a1 1.5.e1 1.0.a1 1.2.e1 1.0.e2 1.3.e1 1.0.a1 1.0.e2 1.1.e1 1.0.e2 1.1.e1 1.0.a1 1.7.e1 1.0.a1 1.9.e1 q.1.f2 1.0.f1 1.1.f2 1.0.f1 1.1.f2 1.0.f1 1.1.f2 1.1.f1 1.1.f2 1.1.f1 1.0.f2 1.l.f1 1.0.f2 1.1.f1 1.1.f2 1.1.f1 1.1.f2 1.1.f1 1.0.f2 1.1.f1 1.0.f2 1.1.f1 1.1.f2 1.1.f1 1.0.f2 1.e.f1 7.0.d1 1.0.b1 1.1.b2 1.1.d1 1.1.d2 1.0.b2 1.0.d1 1.1.b2 1.0.d1 1.0.b2 1.0.d2 1.2.d1 1.0.b2 1.0.d1 1.0.b1 1.0.b2 1.0.d1 1.0.b2 1.0.d1 1.0.d2 1.0.d1 1.0.d2 1.0.b2 1.0.d1 1.1.b2 1.0.d2 1.0.b2 1.0.d2 1.1.d1 1.0.d2 1.0.b1 1.0.d2 1.0.d1 1.0.b1 1.0.d1 1.0.b1 1.1.d1 1.0.b1 2.0.d1 2.0.b1 2.0.d2 2.0.b2 2.1.b1 1.2.d1 1.0.b1 1.0.d1 1.0.d2 1.0.b1 1.0.b2 1.1.b1 1.3.d1 1.0.d2 1.0.d1 1.3.b2 1.1.d1 1.3.d2 1.0.b1 1.0.b2 1.0.d1 1.0.b1 1.0.d1 1.0.d2 2.0.d1 2.0.b1 1.4.d1 j.0.a1 1.0.f1 1.3.a1 1.0.a2 1.3.a1 1.0.a2 1.0.a1 1.0.a2 1.1u.a1 i.0.f1 2.0.e2 2.0.e1 1.0.e2 1.0.e1 1.0.e2 1.1.e1 1.0.e2 1.0.e1 1.0.e2 1.1.e1 1.0.e2 1.0.e1 1.0.e2 1.q.e1 1.0.e2 1.3.e1 1.0.e2 1.3.e1 1.0.e2 1.m.e1 p.7.a1 1.0.a2 1.13.a1 1.0.a2 1.3.a1 1.0.a2 1.m.a1 l.0.e1 1.0.a1 1.0.e1 1.0.a1 1.0.e1 1.0.a1 1.3.e1 1.0.e3 1.1.e1 1.0.e2 1.2.e1 1.0.e2 1.p.e1 1.0.e2 1.0.e1 1.0.e2 1.1.e1 1.0.e2 1.0.e1 1.0.e2 1.0.e1 1.0.e2 1.1.e1 1.0.a1 1.0.e1 1.0.e2 1.g.e1 1.1.a1 2.0.e1 l.0.f3 1.3.f2 1.0.f1 1.0.f2 1.0.f3 1.0.f2 1.0.f3 1.0.f1 1.0.f2 1.0.f3 1.0.f2 1.0.f3 1.2.f2 1.n.f1 1.1.f2 1.0.f1 1.0.f3 1.2.f2 1.0.f1 1.0.f3 1.1.f2 1.2.f1 1.0.f2 1.l.f1 g.0.e2 2.0.a1 4.0.e1 6.8.g1 3.n.h2 5.8.g1 o.0.a1 3d.0.e1 1.26.a1 3f.0.f2 1.1.f1 1.1.f2 1.0.f3 1.0.f1 1.1.f2 1.0.f1 1.0.f3 1.1.f2 1.v.f1 1.1.f2 1.0.f1 1.2.f2 1.1.f1 1.2.f2 1.0.f1 1.0.f2 1.3.f1 1.0.f2 1.0.f1 1.0.f2 1.d.f1 m.5.a1 1.0.a2 1.0.a1 1.0.a2 1.0.a1 1.0.a2 1.1.a1 1.0.a2 1.0.a1 1.0.a2 1.1p.a1 n.0.e1 1.0.a1 1.0.e1 1.1.e2 1.0.e1 1.1.e2 1.0.e1 1.1.e2 1.0.a1 1.0.e2 1.0.e1 1.0.a1 1.1.e1 1.0.e2 1.0.e1 1.0.e2 1.6.e1 1.0.a1 1.1.e1 1.0.a1 1.b.e1 1.0.a1 1.1.e1 1.0.a1 1.0.e2 1.1.e1 1.0.e2 1.1.e1 1.0.e2 1.4.e1 1.0.a1 1.1.e1 1.0.a1 1.e.e1 1.0.a2 2.0.a1 69.0.g1 1.0.a1 1.9.g1 1.0.f1 1.0.g1 1.h.f1 1.0.g1 1.1.f1 1.1.g1 1.0.f1 1.1x.g1 2.0.f1 x.4.g1 1j.0.e1 1.1.f1 1.1.e1 1.0.f1 2.x.e1 2.0.f1 1.1.e1 1.1.f1 1.1.e1 1.0.f1 43.23.a1 n.0.e1 1.1.f1 1.1.e1 1.1.f1 1.1.e1 1.0.f1 1.0.f2 1.1.e1 1.0.f2 1.0.f1 1.1.e1 1.1.f1 1.1.e1 1.1.f1 1.1.e1 1.1.f1 1.1.e1 1.1.f1 1.1.e1 1.1.f1 1.1.e1 1.1.f1 1.1.e1 1.1.f1 1.1.e1 1.1.f1 1.0.e2 1.0.e1 1.1.f1 1.0.e1 1.0.e2 1.1.f2 1.1.e1 1.1.f1 1.1.e1 1.1.f1 1.1.e1 1.1.f1 1.2.e1 1.0.a1 1.0.f1 1.1.e1 1.0.f1 1.0.a1 1.0.f1 1.1.e1 1.5z.f1 2.0.h1 2.0.f1 2.0.h2 2.0.f1 2.0.h2 1.1.f1 1.1.h1 1.1.f1 1.0.h2 1.0.h1 1.1.f1 1.0.h2 1.0.h1 1.1.f1 1.1.h1 1.1.f1 1.1.h1 1.1.f1 1.1.h1 1.1.f1 1.1.h1 1.1.f1 1.1.h1 1.1.f1 1.0.h1 1.0.h2 1.1.f1 1.0.h1 1.0.h2 1.1.f1 1.1.h1 1.1.f1 1.1.h2 1.1.f1 1.0.h2 1.0.h1 1.1.f1 1.1.h1 1.1.f1 1.0.h2 1.0.h1 1.0.f1 2.1.h1 1.0.f1 2.0.h1 2.0.f1 2.4.h1 65.2i.p1 1.0.i1 1.2.p1 1.0.p2 1.3.p1 1.1.p2 1.2.p1 1.0.p2 1.11.p1 1.0.p2 1.1.p1 1.0.p2 1.0.p1 1.0.p2 1.3.p1 1.0.p2 1.i.p1 1.0.i1 1.3j.p1 2.8.i1 1.3.k1 1.3.i1 1.3.p1 1.3.i1 1.3.p1 1.3.i1 1.3.p1 1.k.i1 2.0.p1 1.1.i1 1.1.p1 1.1.i1 1.1.p1 1.1.i1 1.1.p1 1.0.i1 1.2.p1 ed.0.k1 2.0.k2 3.2.k1 1.0.k2 1.1.k1 1.0.k2 1.0.k1 1.0.k2 1.2.k1 1.0.k2 1.x.k1 1.0.k2 1.7.k1 1.0.k2 1.d.k1 1.0.k2 1.8.k1 37.15.p1 1.0.p2 1.0.p1 1.1.p2 1.0.p1 1.0.p2 1.f.p1 lt.v.k1 9.j.n1 1.0.n2 1.0.n1 1.0.n2 1.0.n1 1.1.n2 1.0.n1 1.1.n2 1.1.n1 1.1.n2 1.1r.n1 3.0.n2 2.c.n1 2.0.o1 1.0.n2 1.0.o2 1.0.n1 1.0.o1 2.0.n1 1.3.o1 1.2.o2 1.0.n1 1.0.o2 3.0.n1 1.0.o2 3.1.n1 1.0.o1 2.1.n1 1.0.o2 2.1.n1 1.0.o1 2.1.n1 1.0.o2 1.0.o1 1.1.n1 1.2.o2 1.0.n1 3.0.o2 1.3.o1 1.0.n1 1.0.o2 2.0.n1 1.0.o1 3.0.n1 1.2.o1 1.13.n1 1.0.n2 1.0.n1 1.4.n2 1.0.n1 2.4.n2 1.9.n1 2.0.n2 1.2.n1 1.1.n2 1.6.n1 1.2.n2 1.0.n1 1.0.n2 1.1.n1 1.8.n2 1.4.n1 1.0.o1 2.0.n2 1.a.n1 n.2.o2 2.0.o1 2.0.o2 2.0.o1 2.0.o2 2.0.o1 4.t.o2 2.4.o1 2.0.o2 2.0.o1 2.e.o2 2.0.o1 p.0.n1 1.0.n2 1.0.n1 1.1.n2 1.0.n1 1.0.n2 1.0.n1 1.1.n2 1.0.n1 1.0.n2 1.5.n1 1.0.n2 1.1.n1 1.3.n2 1.0.n1 1.2.n2 1.4.n1 d.0.o1 2.0.o2 2.4.o1 2.2.o2 2.0.o1 7.0.o2 2.6.o1 2.0.o2 2.0.o1 q.27.n1 e4.5f.d1 5.f.q2 3.0.q1 1.0.q2 3.l.q1 3.0.q2 3.0.q1 3.b.q2 3.0.q1 3.0.q2 3.s.q1 4.2j.q2 3.0.h1 4.4.h2 1.0.h1 3.1.h2 3.0.h1 1.0.h2 3.0.h1 1.0.h2 3.0.h1 1.0.h2 3.a.h1 3.0.h2 3.0.h1 1.3.h2 3.0.h1 3.0.h2 1.0.h1 3.0.h2 3.0.h1 3.1.h2 3.0.h1 3.0.h2 3.9.h1 3.0.h2 1.4.h1 4.k.h2 3.0.h1 1.0.h2 3.0.h1 1.3.h2 1.0.h1 5.0.h2 1.e.h1 5.0.h2 1.0.h1 3.0.h2 1.5.h1 1.0.h2 3.0.h1 1.0.h2 5.0.h1 1.0.h2 3.0.h1 1.0.h2 3.1.h1 3.0.h2 1.0.h1 3.0.h2 1.2c.h1 3.0.q1 1.0.h1 3.8.q1 1.0.h1 3.a.q1 4.d.q2 3.0.q1 1.0.q2 3.1.q1 5.1.q2 3.6.q1 1.4.q2 5.0.q4 1.4.q3 5.1.q2 3.0.q3 1.0.q4 5.1.q3 3.1.q2 3.0.q1 1.0.q3 3.0.q1 1.0.q3 3.0.q1 1.0.q2 4.4.q1 5.2.q2 1.7.q4 1.3.q2 1.3.q3 1.3.q4 1.3.q3 3.3.q2 1.3.q3 3.3.q4 1.3.q3 3.0.q2 3.4.q3 3.4.q4 3.3.q3 3.4.q2 1.7.q3 1.0.q2 3.0.q3 1.0.q2 4.4.q3 2t.1.u1 3.0.v1 2.0.u2 1.0.u1v2 1.0.v2 1.0.u2v1 1.0.u1v2 1.0.u1v1 1.0.u2v1 1.0.u1v2 1.1.u1v1 1.0.u1v2 1.0.u2 1.1.u1v1 1.0.u2 1.3.u1v1 1.0.u2 1.0.u1v1 1.0.v2 1.0.u2 1.0.u1v2 1.0.v2 1.1.u1v2 1.0.u3 1.0.u1v2 1.0.u1v1 1.0.u3 1.0.u1v2 1.0.u1v1 1.0.u2v1 1.0.u1v2 1.0.u3 1.0.u2v1 1.0.u1v2 1.0.t1u3 1.0.u1v2 1.0.t1u1 1.0.v2 2.0.t1u1 3.0.u1 2.0.u2 1.1.u1 1.0.u2 1.0.u1v1 1.3.u1 1.5.u2 1.1.u1v1 1.4.u2 1.0.u1 1.5.u2 1.1.u3 1.5.u2 1.1.u3 3.53.u1 1.0.u2 2.f.u1 a.1.u1v1 1.r.u1 h.0.v1 1.u.u1 h.0.v3 2.8.v2 1.1.v3 1.7.v2 1.1.v3 1.7.v2 1.1.v3 1.3.v2 1.1.v1 1.0.v2 2.0.v3 1.0.t1v1 1.2.v2 5.2.v1 1.1.u1v1 1.2.v1 1.1.u1v1 1.3.v1 1.0.u1v1 1.2.v2 1.1.v1 1.0.v2 1.0.u1v1 1.1.v2 1.1.v1 1.0.u1 1.2.v2 1.0.v1 1.b.v2 2.2.v1 4.1.v2 f.0.t2v1 1.0.u3 1.0.u1v1 1.0.t2v1 1.0.u2v1 1.0.u1v1 1.0.u1v2 1.0.u1v1 1.1.u2v1 1.0.t2v1 1.2.u2v1 1.0.u1v1 1.0.t2v1 1.1.u2v1 1.0.u1v1 1.0.u1 1.2.u2v1 1.0.u1 1.1.u2v1 1.0.t2v1 1.2.u2v1 1.0.v1 1.0.t2v1 1.1.u2v1 1.1.v1 1.2.u2v1 1.0.v1 1.1.u2v1 1.0.t2v1 1.2.u2v1 1.0.v1 1.0.t2v1 1.1.u2v1 1.1.u1v1 1.2.u2v1 1.0.v1 1.1.u2v1 1.0.t2v1 1.0.u1v2 1.0.u2v1 1.1.u1v1 1.0.t2v1 1.0.u1v1 1.0.u2v1 1.0.v1 1.0.u1v1 1.0.u2v1 1.0.u1v1 1.0.t2v1 1.0.v1 1.0.u1v1 1.0.u2v1 1.0.u1v1 1.0.t2v1 1.0.u2v1 1.0.u1v1 1.0.v3 1.0.u1v1 1.0.v1 1.0.v2 1.0.t1v1 5.1.v1 2.0.u1v1 2.0.v1 2.0.u1 j.2.v1 2.0.t1 l.0.u2v1 1.0.u1v1 1.0.u1v2 1.0.u2v1 1.0.u1v1 1.0.u2v1 1.2.u1v1 1.5.u2v1 1.1.u1v2 1.9.u2v1 1.0.u1v1 1.0.u2v1 1.0.u1v2 1.8.u2v1 c.0.t2v1 2.2.u1v1 1.0.t2v1 1.0.u2v1 1.0.u1v1 1.0.t2v1 1.0.u2v1 1.0.v1 1.0.t2v1 1.1.v1 1.0.u2v1 1.0.v1 1.0.t2v1 1.0.u2v1 1.0.v1 1.0.t2v1 1.0.u1v1 1.0.v1 1.0.u2v1 1.0.v1 1.0.t2v1 1.0.u2v1 1.0.u1v1 1.0.t2v1 1.0.v1 1.0.u1v1 1.0.t2v1 1.0.v1 1.0.u1v1 1.0.u1v2 1.0.v1 1.0.t2v1 2.0.u1v1 2.0.v1 1q.0.v2 2.0.t1v1 1.0.t1 2.0.u1v1 1.0.u1 1.0.t1v1 1.0.t1 1.0.u1 1.0.u1v1 1.0.t1 1.0.t1v1 1.0.u1v1 1.0.u1 1.0.t1v1 1.0.t1 1.0.u1 1.0.u1v1 1.0.t1 1.0.t1v1 1.0.u1v1 1.0.u1 1.0.t1v1 1.0.t1 1.1.u1 1.1.t1v1 1.0.t1u1 1.0.u1 1.1.t1v1 1.0.u1 1.1.t1u1 1.1.t1v1 1.e.u1 1.1.t1 1.1.u1v1 1.1.t1v1 1.1.u1 1.1.t1 1.1.u1v1 1.1.t1v1 1.1.u1 1.1.t1 1.1.u1v1 1.1.t1v1 1.1.u1 1.1.t1v1 1.1.t1u1 1.1.t1v1 1.1.u1 1.1.t1u1 2.0.t1v1 1ikh.0.n2 6.0.n4 1.s.n1 3.0.n3 2.0.n2 1.0.n1 1.0.n3 2.1.n2 1.0.n4 1.1.n2 1.0.n1 1.0.n4 1.1.n3 1.2.n2";
// By line and region when the number isn't in the plan (most often what
// the plan runs on that line there).
const BY_ROUTE = "L1|GE=o2 L2|GE=n1 L3|GE=o1 L4|GE=n1 L5|GE=n1 L6|GE=n2 L7|GE=n1 R11|BS=m1 R13|MI=h1 R13|VD=h1 R16|MI=h1 R1|BS=m1 R1|VD=d1 R20|MI=p1 R22|BS=m1 R23|MI=p1 R2|BS=m1 R2|VD=d1 R3|VD=q1 R41|MI=h1 R42|MI=h1 R4|VD=q2 R7|VD=h1 R8|VD=q2 R9|VD=q3 RE12|MI=a1 RE24|LU=a1 RE24|MI=a1 RE33|GE=d1 RE33|VD=d1 RE36|BS=d1 RE36|ZH=d1 RE37|MI=d1 RE37|ZH=d1 RE48|ZH=a1 RE4|MI=h1 RE55|MI=d1 RE56|BS=m1 RE56|MI=m1 RE6|MI=p1 RE80|TI=v2 RE9|MI=m1 RE9|VD=m1 REN1|VD=b1 REN5|MI=q1 REN5|VD=q1 REN7|LU=p2 REN7|ZH=p2 REN9|MI=d1 REN9|VD=d1 RE|BS=m1 RE|GE=b1 RE|LU=e1 RE|MI=h1 RE|TI=u1 RE|VD=h1 RE|ZH=a1 R|BS=m1 S10|LU=u2v1 S10|TI=u2 S12|MI=a1 S12|ZH=a1 S14|ZH=f1 S15|ZH=a1 S16|ZH=e1 S19|MI=g1 S19|ZH=g1 S1|BS=p1 S1|LU=p1 S1|MI=p1 S20|LU=u2v1 S20|MI=p1 S20|TI=u2v1 S20|ZH=g1 S21|MI=h1 S21|ZH=e1 S22|MI=p1 S23|MI=p1 S23|ZH=g1 S24|LU=e1 S24|ZH=f1 S25|LU=f1 S25|MI=p1 S25|ZH=f1 S26|LU=p1 S26|MI=p1 S27|MI=h1 S28|MI=h1 S29|MI=i1 S2|LU=p1 S2|ZH=e1 S30|TI=u1 S30|VD=h1 S31|BS=l1 S32|BS=i1 S33|BS=i1 S33|ZH=a1 S3|BS=l1 S3|LU=i1 S3|MI=l1 S3|ZH=f1 S40|TI=u1 S40|VD=h1 S41|VD=h1 S42|MI=h2 S42|ZH=h2 S50|TI=v2 S5|BS=l1 S5|LU=a1 S5|ZH=a1 S62|MI=w1 S62|ZH=w1 S64|MI=w1 S64|ZH=w1 S6|BS=l1 S6|MI=e1 S6|ZH=e1 S7|ZH=a1 S8|LU=a1 S8|ZH=e1 S90|TI=t1v1 S99|LU=k1 S9|BS=p1 S9|LU=k1 S9|MI=k1 S9|ZH=f1 SN11|MI=a1 SN11|ZH=a1 SN1|LU=p1 SN1|MI=a1 SN1|ZH=a1 SN5|ZH=a1 SN6|BS=l1 SN6|ZH=e1 SN7|ZH=a1 SN8|LU=e1 SN8|ZH=e1 SN9|ZH=f1 SN|VD=q1 S|LU=e1 S|TI=u2 S|ZH=a1";
let numbers = null, routes = null;
function plan(number) {
  if (!numbers) {
    numbers = [];
    let prev = 0;
    for (const tok of BY_NUMBER.split(" ")) {
      const [a, l, code] = tok.split(".");
      const start = prev + parseInt(a, 36), end = start + parseInt(l, 36);
      numbers.push([start, end, code]);
      prev = end;
    }
  }
  const z = Number(String(number || "").split("~")[0]);
  if (!Number.isFinite(z)) return null;
  let lo = 0, hi = numbers.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1, [a, b, code] = numbers[mid];
    if (z < a) hi = mid - 1; else if (z > b) lo = mid + 1; else return code;
  }
  return null;
}
function region(lat, lon) {
  if (lat == null || lon == null) return null;
  if (lon < 6.6 && lat < 46.45) return "GE";
  if (lat < 46.2 && lon > 8.4) return "TI";
  if (lat < 46.95 && lon < 7.2) return "VD";
  if (lat > 47.35 && lon < 7.9) return "BS";
  if (lon > 8.35 && lat > 47.2) return "ZH";
  if (lon > 8.1 && lat < 47.25) return "LU";
  return "MI";
}
function byRoute(route, lat, lon) {
  if (!routes) routes = Object.fromEntries(BY_ROUTE.split(" ").map((x) => x.split("=")));
  const r = String(route || "").replace(/\s+/g, ""), reg = region(lat, lon);
  if (reg && routes[`${r}|${reg}`]) return routes[`${r}|${reg}`];
  return Object.entries(routes).find(([k]) => k.split("|")[0] === r)?.[1] || null;
}
// The units by code.
const U = (k) => [[`${k}Bt`, 1], [`${k}B`, 2], [`${k}ABtR`, 1]];
const UNITS = {
  a: { name: "KISS (RABe 511), six double-deck cars", cars: [["sbbr511zBt", 1], ["sbbr511zAB", 1], ["sbbr511zB", 2], ["sbbr511zABR", 1], ["sbbr511zBtR", 1]] },
  b: { name: "KISS (RABe 511), six double-deck cars", cars: [["sbbr511Bt", 1], ["sbbr511AB", 1], ["sbbr511B", 2], ["sbbr511ABR", 1], ["sbbr511BtR", 1]] },
  d: { name: "KISS (RABe 512), six double-deck cars", cars: [["sbbr512Bt", 1], ["sbbr512B", 1], ["sbbr512A", 1], ["sbbr512AB", 1], ["sbbr512B", 1], ["sbbr512BtR", 1]] },
  e: { name: "DTZ (RABe 514), four double-deck cars", cars: [["sbbr514B", 1], ["sbbr514M", 2], ["sbbr514AR", 1]] },
  f: { name: "Re 450 with DPZplus double-deck coaches", cars: [["sbbr450", 1], ["sbbrDpzB", 1], ["sbbrDpzAB", 1], ["sbbrDpzBtR", 1]] },
  g: { name: "Re 420 with double-deck coaches (rush-hour train)", cars: [["sbbr420", 1], ["sbbrDpzB2", 1], ["sbbrDpzAB", 1], ["sbbrDpzB2", 1]], tail: [["sbbr420R", 1]] },
  h: { name: "Domino (RBDe 560, B, ABt)", cars: [["sbbrDomRBDe", 1], ["sbbrDomB", 1], ["sbbrDomABt", 1]] },
  i: { name: "Domino (RBDe 560, two B, ABt)", cars: [["sbbrDomRBDe", 1], ["sbbrDomB", 2], ["sbbrDomABt", 1]] },
  j: { name: "Domino (RBDe 560, ABt)", cars: [["sbbrDomRBDe", 1], ["sbbrDomABt", 1]] },
  k: { name: "GTW (RABe 520)", cars: [["sbbr520Bt", 1], ["sbbr520B", 1], ["sbbr520Re", 1], ["sbbr520ABtR", 1]] },
  l: { name: "FLIRT (RABe 521), four cars", cars: U("sbbr521") },
  m: { name: "FLIRT (RABe 522), four cars", cars: U("sbbr522") },
  n: { name: "Léman Express FLIRT (RABe 522), four cars", cars: U("sbbr522x") },
  p: { name: "FLIRT (RABe 523), four cars", cars: U("sbbr523") },
  q: { name: "FLIRT (RABe 523, RER Vaud), four cars", cars: U("sbbr523v") },
  t: { name: "FLIRT 3 (RABe 523 5xx), four cars", cars: U("sbbr523f") },
  u: { name: "TILO FLIRT (RABe 524), four cars", cars: U("sbbr524") },
  v: { name: "TILO FLIRT (RABe 524), six cars", cars: [["sbbr524lABt", 1], ["sbbr524lB", 4], ["sbbr524lABtR", 1]] },
  w: { name: "FLIRT (RABe 521 2xx, the Seehas), four cars", cars: U("sbbr523") },
  o: { name: "SNCF Régiolis (Z 31500, Léman Express), four cars", cars: [["sbbrZ31Bt", 1], ["sbbrZ31AB", 1], ["sbbrZ31B", 1], ["sbbrZ31BtR", 1]] },
};
// A train of the coded units: each unit whole, as they couple; the Domino
// and rush-hour trains' second unit turned round, cab cars outward.
function setOf(code) {
  const parts = [...String(code).matchAll(/([a-z])(\d)/g)].map(([, k, n]) => [k, +n]).filter(([k]) => UNITS[k]);
  if (!parts.length) return null;
  const units = [], names = [];
  for (const [k, count] of parts) {
    names.push(count > 1 ? `${count} × ${UNITS[k].name}` : UNITS[k].name);
    for (let c = 0; c < count; c++) {
      let cars = UNITS[k].cars;
      if ((k === "h" || k === "i" || k === "j") && c % 2 === 1) cars = [...cars].reverse().map(([key, n2]) => [key === "sbbrDomB" ? key : key.endsWith("R") ? key.slice(0, -1) : `${key}R`, n2]);
      if (k === "g" && c > 0) cars = [...UNITS.g.cars].reverse().map(([key, n2]) => [key === "sbbr420" ? "sbbr420R" : key === "sbbrDpzAB" ? "sbbrDpzABR" : key, n2]);
      units.push(...cars);
    }
    if (k === "g" && count === 1) units.push(...UNITS.g.tail);
  }
  return { label: names.join(" + "), units };
}
// A unit a reported car belongs to: its whole unit.
const BY_KEY = { sbbr511zBt: "a1", sbbr511Bt: "b1", sbbr512Bt: "d1", sbbr514A: "e1", sbbr514B: "e1", sbbr450: "f1", sbbr420: "g1", sbbrDomRBDe: "h1", sbbrDomABt: "h1",
  sbbr520Bt: "k1", sbbr521Bt: "l1", sbbr522Bt: "m1", sbbr522xBt: "n1", sbbr523Bt: "p1", sbbr523vBt: "q1", sbbr523fBt: "t1", sbbr524Bt: "u1", sbbr524lABt: "v1" };
// Any car of a unit (a middle car or coach shown alone, on the fleet page):
// the first unit it runs in.
const BY_CAR = {};
for (const [k, u] of Object.entries(UNITS)) for (const [key] of [...u.cars, ...(u.tail || [])]) BY_CAR[key.replace(/R$/, "")] ??= `${k}1`;
export const TYPICAL = {
  sbbregio: (t, reported) => {
    const r = String(t.route || "").replace(/\s+/g, "");
    if (reported) { const base = reported.replace(/R$/, "").replace(/ABt$/, "Bt"); if (BY_KEY[base] || BY_KEY[reported]) return labelled(setOf(BY_KEY[base] || BY_KEY[reported]), "the unit reported"); }
    if (reported && !t.route && BY_CAR[reported.replace(/R$/, "")]) return labelled(setOf(BY_CAR[reported.replace(/R$/, "")]), "the unit reported");
    // DB Regio's bwegt trains on SBB's timetable into Basel Bad Bf: RE 7 a
    // Desiro HC, RB 27 and RE 27 a Mireo (as chintl.cars.js draws them).
    if (r === "RE7") return { label: "Desiro HC (bwegt, DB Regio): four cars, single-deck end cars and two double-deck cars between", units: [["de462End", 1], ["de462Mid", 2], ["de462End", 1]] };
    if (r === "RB27" || r === "RE27") return { label: "Mireo (bwegt, DB Regio): three cars", units: [["de463End", 1], ["de463Mid", 1], ["de463End", 1]] };
    // Extra trains: no plan.
    if (r === "EXT") return null;
    const code = plan(t.number) || byRoute(r, t.lat, t.lon) || (/^S|^R/.test(r) ? "p1" : null);
    if (!code) return null;
    return labelled(setOf(code), plan(t.number) ? "SBB's 2026 formation plan for this train" : "what SBB's 2026 plan runs on this line");
  },
};
function labelled(set, how) {
  return set ? { ...set, label: `${set.label} (${how})` } : null;
}

// ===================== Fact sheets =====================
const WIKI = (p) => `https://de.wikipedia.org/wiki/${p}`;
const REG = "https://data.sbb.ch/explore/dataset/rollmaterial/";
const flirtF = { model: "Stadler FLIRT", type: "Electric multiple unit", builder: "Stadler Rail", topSpeedMph: 99, source: WIKI("Stadler_Flirt") };
const kissF = { model: "Stadler KISS (RABe 511)", type: "Double-deck electric multiple unit", builder: "Stadler Rail", built: "2011–2018", fleet: "69 six-car units (and 24 four-car)",
  topSpeedMph: 99, seats: 535, lengthFt: 492.1, source: "https://www.sbb.ch/de/reiseinformationen/services-im-zug/unsere-zuege/regio-dosto.html" };
const kiss2F = { model: "Stadler KISS (RABe 512, \"IR-Dosto\")", type: "Double-deck electric multiple unit", builder: "Stadler Rail", built: "2022–2026", fleet: "60 six-car units",
  topSpeedMph: 99, seats: 466, lengthFt: 498.3, source: "https://www.sbb.ch/de/reiseinformationen/services-im-zug/unsere-zuege/neuer-ir-dosto.html" };
const dtzF = { model: "Siemens Desiro Double Deck (RABe 514, DTZ)", type: "Double-deck electric multiple unit", builder: "Siemens", built: "2006–2009", fleet: "61 four-car units",
  topSpeedMph: 87, seats: 360, lengthFt: 328.1, source: WIKI("SBB_RABe_514") };
const dpzF = { model: "DPZplus (Re 450 and double-deck coaches)", type: "Double-deck push-pull train", builder: "SLM, ABB, SWP, Schindler; rebuilt by SBB 2012–2018",
  built: "1989–1997 (B-NDW 2011–2016)", fleet: "113 sets", topSpeedMph: 81, source: WIKI("SBB_Re_450") };
const npzF = { model: "NPZ \"Domino\" (RBDe 560)", type: "Electric push-pull unit", builder: "SIG, SWS, Schindler, BBC; rebuilt 2009–2014", built: "1984–1996",
  fleet: "88 motor cars", topSpeedMph: 87, source: WIKI("SBB_RBDe_560") };
export const FACTS = {
  sbbr523Bt: { ...flirtF, built: "2004–2017", fleet: "73 RABe 523 (four cars)", about: "SBB's FLIRT: the end car with only second class. They run the S-Bahns of Zug, Luzern, Aargau, Basel and Vaud and the Neuchâtel lines." },
  sbbr523ABt: { ...flirtF, built: "2004–2017", fleet: "73 RABe 523 (four cars)", about: "The end car with first class behind the cab, marked by a yellow line over its windows and a \"1\" by its first door; the pantograph over its rear truck." },
  sbbr523B: { ...flirtF, about: "A middle car; all four cars share Jakobs trucks at the joints." },
  sbbr523vBt: { ...flirtF, built: "2009–2010", fleet: "RABe 523 013–031", about: "The RER Vaud's FLIRTs, the network's green disc on the cab." },
  sbbr523vABt: { ...flirtF, built: "2009–2010", fleet: "RABe 523 013–031", about: "RER Vaud: the end car with first class." },
  sbbr523zBt: { ...flirtF, built: "2004–2005", fleet: "RABe 523 001–012", about: "The first FLIRTs, built for the Stadtbahn Zug, still in its blue and \"ein sympathischer zug.\"" },
  sbbr523zABt: { ...flirtF, built: "2004–2005", fleet: "RABe 523 001–012", about: "Stadtbahn Zug: the end car with first class." },
  sbbr521Bt: { ...flirtF, built: "2004–2006", fleet: "30 RABe 521 0xx, 9 RABe 521 2xx", about: "The FLIRTs for Basel's trinational S-Bahn (into Germany), with its heart on the cab." },
  sbbr521ABt: { ...flirtF, built: "2004–2006", fleet: "RABe 521 001–030", about: "S-Bahn Basel: the end car with first class." },
  sbbr522Bt: { ...flirtF, built: "2011–2012", fleet: "RABe 522 201–214 (two-system, for France)", lengthFt: 246.1, about: "The FLIRT for France as well: a longer crash-proof nose with side buffers; the Jura and the Neuchâtel–Pontarlier line." },
  sbbr522ABt: { ...flirtF, built: "2011–2012", fleet: "RABe 522 201–214", about: "RABe 522: the end car with first class." },
  sbbr522xBt: { ...flirtF, built: "2011–2019", fleet: "23 RABe 522 in the Léman Express's paint", lengthFt: 246.1, about: "SBB's units for the Léman Express (Genève–Annemasse–Haute-Savoie, since December 2019)." },
  sbbr522xABt: { ...flirtF, built: "2011–2019", fleet: "23 RABe 522", about: "Léman Express: the end car with first class." },
  sbbr523nBt: { ...flirtF, model: "Stadler FLIRT 3", built: "2020–2021", fleet: "RABe 523 101–114", lengthFt: 241.1, about: "The third FLIRT for the RER Vaud: a blunter crash-proof cab." },
  sbbr523nABt: { ...flirtF, model: "Stadler FLIRT 3", built: "2020–2021", fleet: "RABe 523 101–114", about: "FLIRT 3: the end car with first class." },
  sbbr523fBt: { ...flirtF, model: "Stadler FLIRT 3", built: "2022", fleet: "RABe 523 501–514", about: "FLIRT 3s run with TILO's units in Ticino (S 10, S 20, S 90, RE 80)." },
  sbbr523fABt: { ...flirtF, model: "Stadler FLIRT 3", built: "2022", fleet: "RABe 523 501–514", about: "FLIRT 3: the end car with first class." },
  sbbr524Bt: { ...flirtF, built: "2007–2008", fleet: "RABe 524 001–019 (four cars)", about: "TILO's FLIRTs (Treni Regionali Ticino Lombardia), its red, blue and green." },
  sbbr524ABt: { ...flirtF, built: "2007–2008", fleet: "RABe 524 001–019", about: "TILO: the end car with first class." },
  sbbr524lABt: { ...flirtF, built: "2010–2014", fleet: "RABe 524 101–117 (six cars)", lengthFt: 348.7, about: "TILO's six-car FLIRT: first class at both ends, one door a side in each end car." },
  sbbr524lB: { ...flirtF, built: "2010–2014", fleet: "RABe 524 101–117", about: "A middle car of TILO's six-car FLIRT." },
  sbbr524nABt: { ...flirtF, model: "Stadler FLIRT 3", built: "2020", fleet: "RABe 524 301–305 (six cars)", about: "TILO's FLIRT 3, six cars, for the Ceneri base tunnel's services." },
  sbbr511zBt: { ...kissF, about: "The Zürich S-Bahn's Regio-Dosto in ZVV's navy and white: the end car, its cab and motor truck." },
  sbbr511zAB: { ...kissF, about: "The car with first class (the two decks between its doors, a yellow band at the windows), the pantograph over its outer end." },
  sbbr511zB: { ...kissF, about: "A second-class double-deck car." },
  sbbr511Bt: { ...kissF, about: "A KISS outside Zürich (Genève RE, Wettingen–Olten–Luzern), anthracite low." },
  sbbr511AB: { ...kissF, about: "The car with first class." },
  sbbr512Bt: { ...kiss2F, about: "SBB's newest double-decker, run on IR, RE 33 (Annemasse–Genève–St-Maurice) and the RER Vaud's R 1/R 2." },
  sbbr512A: { ...kiss2F, about: "The all-first-class car, in the middle of the unit." },
  sbbr512AB: { ...kiss2F, about: "First class beside the A car, second class beyond." },
  sbbr512B: { ...kiss2F, about: "A second-class car." },
  sbbr514A: { ...dtzF, about: "The end car with first class (RAe): the yellow panels round its upper windows over the doors." },
  sbbr514B: { ...dtzF, about: "The second-class end car (RBe)." },
  sbbr514M: { ...dtzF, about: "A middle car (B)." },
  sbbr450: { ...dpzF, model: "Re 450", type: "Electric locomotive", lengthFt: 60.4, powerHp: 4300, about: "The Zürich S-Bahn's own locomotive, pushing or pulling its double-deck coaches; a full cab at one end." },
  sbbrDpzAB: { ...dpzF, model: "DPZplus AB", type: "Double-deck coach", lengthFt: 87.9, about: "First class on both decks between its doors, marked with yellow lines." },
  sbbrDpzB: { ...dpzF, model: "B-NDW", type: "Low-floor double-deck coach", built: "2011–2016", lengthFt: 87.9, about: "The low-floor coach added to every set when they were rebuilt." },
  sbbrDpzBt: { ...dpzF, model: "DPZplus Bt", type: "Double-deck driving trailer", lengthFt: 87.9, about: "The cab car at the other end." },
  sbbrDpzB2: { ...dpzF, model: "Double-deck coach (HVZ)", type: "Double-deck coach", lengthFt: 87.9, about: "The rush-hour trains' (HVZ-D) coaches, between two Re 420s, drawn as the DPZplus's." },
  sbbr420: { model: "Re 420 LION (Re 4/4 II)", type: "Electric locomotive", builder: "SLM, BBC, MFO, SAAS; rebuilt by SBB 2012–2015", built: "1964–1985", fleet: "30 rebuilt (420 201–230)",
    topSpeedMph: 87, lengthFt: 50.5, source: WIKI("SBB_Re_420"),
    about: "At each end of the Zürich S-Bahn's rush-hour double-deck trains (S 19, S 20, S 23). Drawn in the LION paint photographed on 420 226 (2014) and 420 221/228 (2022); no photograph from 2023–2026 was found." },
  sbbrDomRBDe: { ...npzF, about: "The motor car, cab ahead, its luggage space behind the cab." },
  sbbrDomB: { ...npzF, model: "Domino low-floor middle car", built: "2009–2014", about: "The low-floor car added in the middle." },
  sbbrDomABt: { ...npzF, model: "Domino cab car (ABt)", about: "The cab car, first class at its cab end (the yellow line, a \"1\" by its door)." },
  sbbr520Bt: { model: "Stadler GTW 2/8 (RABe 520)", type: "Articulated electric multiple unit", builder: "Stadler Rail", built: "2002", fleet: "15", topSpeedMph: 71, lengthFt: 175.3,
    source: WIKI("SBB_RABe_520"), about: "Narrow units for the Seetal line (Luzern–Lenzburg), to be replaced in 2029." },
  sbbr520ABt: { model: "Stadler GTW 2/8 (RABe 520)", type: "Articulated electric multiple unit", builder: "Stadler Rail", built: "2002", fleet: "15", source: WIKI("SBB_RABe_520"),
    about: "The end car with first class." },
  sbbr520Re: { model: "Stadler GTW power module", type: "Power module", builder: "Stadler Rail", source: WIKI("SBB_RABe_520"), about: "The short car between two passenger cars that carries the traction gear and the pantograph." },
};
// The turned-round end cars share their fact sheets; the liveries' middle
// cars the plain FLIRT's.
for (const k of Object.keys(TYPES)) {
  if (FACTS[k]) continue;
  const base = k.endsWith("R") && FACTS[k.slice(0, -1)] ? k.slice(0, -1) : /^sbbr52\d[a-z]?B$/.test(k) ? "sbbr523B" : null;
  if (base) FACTS[k] = FACTS[base];
}
