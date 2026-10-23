// SBB's long-distance trains (scripts/railroads/switzerland.py, railroad
// "sbb": its IC, IR and EC lines). The Train Formation Service names every
// vehicle of a train by its European Vehicle Number (FLEETS, below), so a
// train whose formation has come in is drawn car by car as it runs; any
// other is drawn as what usually runs its line (TYPICAL, from SBB's own
// 2026 annual formation plan), labeled as typical. Trainsheet's own side
// views from published dimensions, SBB's open fleet list and photographs
// (Wikimedia Commons, Railcolor News and Bombardier's data sheets,
// 2019-2026), at the shared scale (js/carart.js), each in the paint it
// carries now (all 119 Re 460s refitted by 2022, all IC2000 coaches
// modernised by summer 2025, the ICNs being refitted since 2024); SBB's
// symbol and lettering are drawn here (no logo files).
//
// SBB's markings, as photographed: the symbol (the Swiss cross between two
// arrows) white in a red box, "SBB CFF FFS" beside it in black; on each
// passenger door a blue panel at the top with the class numeral in white,
// a yellow band under it on first-class doors (no other first-class
// marking on the side); the restaurant cars lettered "Restaurant" in red.

import { C, rect, circle, path, line, lines, poly, truck, pantograph, slats, underframe, win, door } from "../carart.js?v=dev";
import { bilevel, newId } from "../carmodels.js?v=dev";
import { mark, hvac, hvLine, twinEnded } from "./czechia.cars.js?v=dev";
// Trenitalia's own ETR 610s, in its green "euroCity" paint, as drawn and
// checked in trenitalia.cars.js.
import { TYPES as TI_TYPES, MODELS as TI_MODELS, FACTS as TI_FACTS } from "./trenitalia.cars.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const M = 3.28084;                                 // feet in a metre
const m = (v) => v * M;
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const SANS = "'SBB Web', 'Helvetica Neue', Helvetica, Arial, sans-serif";

// SBB's colours (its design manual's red; the others as photographed).
export const SBB = { red: "#eb0000", white: "#f2f2f0", black: "#1c1e20", anth: "#34383b", roof: "#5f6468", grey: "#8d9297", blue: "#2d327d",
  yellow: "#f6c400", silver: "#c9cdd1", glass: "#22292f" };

// ---------- SBB's symbol and lettering ----------
// The symbol, height 1, centered on 0: the cross's upright, the bar through
// it running out to the two arrowheads, each arrowhead a chevron of even
// width. Its parts as [x0, x1] spans at height y (-0.5 top .. 0.5 bottom),
// for the striped version on the Re 460; as polygons for the solid one.
// Proportions from photographs of the coaches' boxes and the Re 460's
// striped symbol: 1.62 times as wide as tall, the arms a quarter of its
// height wide.
const SYM = { T: 0.81, arm: 0.25, top: 0.4, bar: 0.1, hb: 0.1 };
function symbolSpans(y) {
  const { T, arm, top, bar, hb } = SYM, a = Math.abs(y);
  if (a > 0.5) return [];
  if (a <= hb) return [[-T, T]];
  const out = -T + (T - top) * (a / 0.5);         // the arm's outer edge
  return [[out, out + arm], [-bar, bar], [-out - arm, -out]];
}
const symbolPath = (h) => {
  const { T, arm, top, bar, hb } = SYM, s = (v) => n(v * h);
  const chev = (k) => `M${s(-k * top)} ${s(-0.5)}L${s(-k * (top - arm))} ${s(-0.5)}L${s(-k * (T - arm))} 0L${s(-k * (top - arm))} ${s(0.5)}L${s(-k * top)} ${s(0.5)}L${s(-k * T)} 0Z`;
  return `M${s(-bar)} ${s(-0.5)}h${s(2 * bar)}v${s(1)}h${s(-2 * bar)}Z` + `M${s(-T + 0.15)} ${s(-hb)}h${s(2 * (T - 0.15))}v${s(2 * hb)}h${s(-2 * (T - 0.15))}Z` + chev(1) + chev(-1);
};
// "SBB CFF FFS" in SBB's own type (narrower than Helvetica: the name runs
// 6.7 times its cap height), cap tall, from x0 (y-down coordinates, the
// baseline at y).
const wordmark = (x0, y, cap, fill, weight = 700) =>
  `<text x="${n(x0)}" y="${n(y)}" font-size="${n(cap / 0.72)}" font-weight="${weight}" textLength="${n(6.7 * cap)}" lengthAdjust="spacingAndGlyphs" font-family="${SANS}" fill="${fill}">SBB CFF FFS</text>`;
// SBB's flag: the red box (h tall, twice as wide) with the white symbol
// toward its right end, "SBB CFF FFS" after it unless word is false; its
// left edge at x, centered on y. Mirrored as a whole on a car drawn
// mirrored, so it still reads left to right.
export function sbbLogo(c, x, y, h, { word = true, ink = SBB.black } = {}) {
  const w = 2.0 * h, cap = 0.55 * h, gap = 0.3 * h, sh = 0.52 * h;
  const total = w + (word ? gap + 6.7 * cap : 0);
  const inner = `<rect x="0" y="${n(-h / 2)}" width="${n(w)}" height="${n(h)}" fill="${SBB.red}"/>` +
    `<path transform="translate(${n(w - 0.11 * h - SYM.T * sh)} 0)" d="${symbolPath(sh)}" fill="#ffffff"/>` + (word ? wordmark(w + gap, cap / 2, cap, ink) : "");
  return c.mirrored ? `<g transform="translate(${n(x + total)} ${n(y)}) scale(-1 -1)">${inner}</g>`
    : `<g transform="translate(${n(x)} ${n(y)}) scale(1 -1)">${inner}</g>`;
}
// Lettering, h tall (cap height), centered on (x, y), reading left to right.
const say = (c, x, y, h, text, fill, { weight = 600, anchor = "middle", spacing = 0, family = SANS, italic = false } = {}) =>
  mark(c, x, y, `<text x="0" y="${n(h * 0.5)}" font-size="${n(h / 0.72)}" text-anchor="${anchor}" font-weight="${weight}" letter-spacing="${spacing}" font-family="${family}" fill="${fill}"${italic ? ' font-style="italic"' : ""}>${text}</text>`);

// A passenger door's class panel: blue across the door's top with the
// numeral in white at its right; on a first-class door a yellow band under
// it. x, w: the door; top: the door's top; ph: the panel's height.
function classPanel(c, x, w, top, cls, ph = 1.25, yh = 0.38) {
  let s = rect(x, top - ph, w, ph, SBB.blue);
  if (cls === "1") s += rect(x, top - ph - yh, w, yh, SBB.yellow);
  if (cls) s += say(c, c.mirrored ? x + 0.45 : x + w - 0.45, top - ph / 2, ph * 0.62, cls, "#ffffff", { weight: 700 });
  return s;
}
// A plug door, red, a tall narrow window in it.
const plugDoor = (x, w, y0, y1, { fill = SBB.red, glassY = 0.12, glassH = 0.62 } = {}) =>
  ({ x, w, y0, y1, leaves: 1, glassY, glassH, grabs: false, fill });

// Parts.
const grille = (x, y, w, h) => rect(x, y, w, h, "rgba(25,28,31,0.72)", 0.35, 'rx="0.08"') + hlines(x, y, w, h, 0.22);
const hlines = (x, y, w, h, gap = 0.3, color = "rgba(255,255,255,0.18)") => lines(seq(y + gap / 2, gap, Math.floor(h / gap)).map((yy) => [x + 0.1, yy, x + w - 0.1, yy]), color, 0.5);
const louvre = (x, y, w, h) => rect(x, y, w, h, "rgba(25,28,31,0.7)", 0.35, 'rx="0.08"') + hlines(x, y, w, h, 0.28);
const hatch = (x, y, w, h) => rect(x, y, w, h, "none", 0.45, 'rx="0.25" opacity="0.55"');
const ovalVent = (x, y, w, h) => rect(x, y, w, h, "#b9bcbf", 0.4, `rx="${n(w / 2)}"`) + lines(seq(x + 0.25, 0.22, Math.max(1, Math.floor((w - 0.4) / 0.22))).map((xx) => [xx, y + 0.35, xx, y + h - 0.35]), "rgba(0,0,0,0.35)", 0.45);
// Glass set flush in a black band: the pane a shade lighter, its frame.
const pane = (x, y, w, h, r = 0.45) => rect(x, y, w, h, "#2a3238", 0, `rx="${r}" stroke="#0e1012" stroke-width="0.5" vector-effect="non-scaling-stroke"`) +
  rect(x + 0.15, y + h * 0.6, w - 0.3, h * 0.3, "#39434c", 0, `rx="${Math.min(r, 0.2)}"`);
// UIC buffers and screw coupling at a coach end (side -1 left, 1 right).
function buffers(xFace, side, { y = 3.45, end = 0.6 } = {}) {
  const at = (v) => xFace - side * v, span = (a, b) => [Math.min(at(a), at(b)), Math.abs(b - a)];
  const [bx, bw] = span(0.32, end + 0.2), [fx] = span(0, 0.32);
  return rect(bx, y - 0.27, bw, 0.54, "currentColor", 0, 'opacity="0.8"') + rect(fx, y - 0.62, 0.32, 1.24, C.steelDark, 0.4, 'rx="0.12"') +
    path(`M${n(at(end + 0.4))} ${n(y - 0.5)}Q${n(at(end * 0.5))} ${n(y - 1.2)} ${n(at(0.15))} ${n(y - 0.9)}`, "none", 0, 'stroke="#2a2d31" stroke-width="0.9" vector-effect="non-scaling-stroke" stroke-linecap="round"');
}

// ---------- Re 460 (Lok 2000) ----------
// SLM and ABB's four-axle electric (1991-1996, 119 for SBB): 18.5 m over
// the buffers, 4.3 m tall, trucks 11.0 m apart (2.8 m wheelbase, 1110 mm
// wheels) behind full-depth skirts; a cab at each end behind a raked front
// with a wide windshield, a door behind each cab, the machine room between
// with ribbed (louvred) sides; the roof gray, its sides sloping, two
// pantographs. All refitted 2017-2022 (IGBT converters, LED lamps). SBB's
// paint (photographs, 460 117 at Brig 2022, 460 100 at Basel 2024, 460 085
// at Konstanz 2026): red, a dark anthracite band along the bottom over the
// skirts, the roof and the windshields' surround dark gray, the cab side
// window black; on the ribs toward one end SBB's symbol drawn in white
// stripes (one on each rib), "SBB CFF FFS" in white toward the other end.
// Locomotives in advertising wraps are drawn in the standard paint.
const R460 = { roof: 14.1, eave: 12.3, sill: 1.8, skirt: 3.3, centers: m(11.0), wb: m(2.8), d: 43.7 };
const NOSE_460 = [[1.25, R460.sill], [0.95, 3.3], [0.95, 5.0], ["q", 1.0, 7.2, 1.5, 8.7], [2.45, 11.95], ["q", 2.8, 12.6, 3.5, 12.8], ["q", 4.6, 14.1, 6.4, 14.1]];
function re460Half(c) {
  const { roof, eave, sill, skirt } = R460;
  return bilevel({ ...c, cabL: true, cabR: false }, {
    roof, sill, cornerR: 1.0, end: 0.9, noTrucks: true, nose: NOSE_460, badge: false, cabLen: 0, base: SBB.red,
    paint: (cc, g) => {
      let s = bands(g.L, [[0, skirt, SBB.anth], [eave, 4, SBB.roof]]);
      // The dark gray roof comes down over the cab to the windshield's top;
      // the windshield seen edge-on and the cab side window in black.
      s += path(`M0 ${eave}L0 15L8 15L8 ${eave}Q5.2 ${eave} 3.4 12.8Z`, SBB.roof);
      s += path(poly([[1.5, 8.7], [2.45, 11.95], [3.4, m(3.65)], [m(3.25), m(3.65)], [m(3.25), m(2.85)], [3.2, m(2.85)]]), SBB.black);
      return s;
    },
    rows: [{ xs: [m(1.45)], y: m(2.95), w: m(0.7), h: m(0.6), r: 0.35 }],
    doors: [{ x: m(2.3), w: m(0.9), y0: m(1.0), y1: m(3.5), glass: true, glassY: 0.76, glassH: 0.2, grabs: true, fill: "rgba(0,0,0,0.05)" }],
    extra: () => {
      // The windshield, edge-on; the lamps (two low, one in the roof cap);
      // the buffers, the coupling and the plow.
      let s = path(poly([[1.7, 9.0], [2.5, 11.75], [3.1, 11.75], [2.35, 9.0]]), C.glass);
      s += rect(0.9, 4.25, 0.45, 0.55, "#fff6d8", 0.3, 'rx="0.12"') + rect(0.92, 3.75, 0.4, 0.32, "#d8262c", 0.3, 'rx="0.1"') + rect(4.0, 13.75, 0.7, 0.3, "#fff6d8", 0.3, 'rx="0.1"');
      s += buffers(0, -1, { end: 0.95 }) + path(poly([[1.25, sill + 0.05], [3.8, sill + 0.05], [3.4, 0.55], [1.6, 0.55]]), C.black, 0, 'opacity="0.92"');
      s += rect(3.8, 13.95, 1.4, 0.3, "currentColor") + rect(4.0, 14.25, 0.3, 0.3, "currentColor");                     // horns
      return s;
    },
  });
}
// The ribs on the machine room's side, the striped symbol on them toward
// the No. 2 end, the lettering toward the No. 1 end.
function re460Side(c, L) {
  const a = m(4.6), b = L - m(4.6), y0 = m(1.42), pitch = 0.55, ribs = 14;
  let s = "";
  for (let k = 0; k < ribs; k++) {
    const y = y0 + k * pitch;
    s += rect(a, y, b - a, 0.17, "rgba(0,0,0,0.2)") + rect(a, y + 0.17, b - a, 0.07, "rgba(255,255,255,0.16)");
  }
  // The symbol: 13 stripes, one on each of the lower ribs, 2.0 m tall and
  // 3.25 m wide, its middle 6.3 m from the No. 2 end.
  const cx = L - m(6.3), h = 12 * pitch;
  let stripes = "";
  for (let k = 0; k < 13; k++) {
    const y = y0 + k * pitch, v = 0.5 - k / 12;                      // v: 0.5 at the top rib, -0.5 at the bottom
    for (const [p, q] of symbolSpans(v)) stripes += rect(cx + p * h, y + 0.02, (q - p) * h, 0.22, "#ffffff");
  }
  s += c.mirrored ? `<g transform="matrix(-1 0 0 1 ${n(2 * cx)} 0)">${stripes}</g>` : stripes;
  // "SBB CFF FFS" from the ribs' start, 0.35 m tall, on the lowest ribs.
  s += mark(c, a + m(1.15), m(1.55), wordmark(-m(1.15), 0, m(0.35), "#ffffff", 600));
  return s;
}
function re460(c) {
  const L = c.L, { roof, eave, sill } = R460;
  let s = twinEnded(c, re460Half);
  // The trucks behind the skirt: only the wheels' lower halves show.
  for (const k of [-1, 1]) s = truck(L / 2 + (k * R460.centers) / 2, { wb: R460.wb, d: R460.d, kind: "loco", top: 3.0 }) + s;
  s += re460Side(c, L);
  // Data lettering on the skirt; the side's lower edge.
  s += say(c, m(5.0), m(0.82), 0.32, "Re 460", "#ffffff", { anchor: "start", weight: 600 }) + say(c, m(5.0), m(0.68), 0.28, "91 85 4 460 0", "#ffffff", { anchor: "start", weight: 500 });
  // The roof: the sloping cooler panels along its sides, the pantographs
  // and the line between them, the main breaker.
  const ra = m(4.0), rb = L - m(4.0);
  s += path(poly([[ra, eave + 0.05], [rb, eave + 0.05], [rb - 0.6, 13.55], [ra + 0.6, 13.55]]), "#7a7f84", 0.35);
  s += lines(seq(ra + 1.5, 1.45, Math.floor((rb - ra - 2) / 1.45)).map((x) => [x, eave + 0.1, x + 0.15, 13.5]), "rgba(0,0,0,0.3)", 0.5);
  s += pantograph(m(3.6), roof - 0.05, { up: false }) + pantograph(L - m(3.6), roof - 0.05, { up: true, facing: -1 });
  s += hvLine(m(3.6) + 3.0, L / 2 - 2.0, roof - 0.05) + hvLine(L - m(3.6) - 3.0, L / 2 + 2.0, roof - 0.05);
  return s;
}

// ---------- IC2000 double-deck coaches ----------
// Schindler/SIG and Adtranz/Bombardier (1997-2004, 341 coaches): 26.8 m,
// 4.75 m tall; a mid-level section over each truck (2.5 m wheelbase, 920 mm
// wheels), the two decks between; a single plug door a side at each end of
// the lower deck, its centre 8.7 m from one end and 4.9 m from the other
// (photographs rectified: A at Zürich HB, AD at Brig, WRB at Zürich, the
// family Bt at Lausanne). Modernised 2019-2025 (photographs, the first sets
// at Olten 2019, Lausanne 2023, Konstanz and Zürich 2026): white; a thin red
// line along the roof's edge; the upper deck's windows in one black band,
// the lower deck's in another; black along the bottom; the roof gray; red
// doors with the blue class panel (a yellow band under it in first class);
// SBB's flag and name between the decks near one end. The restaurant car
// (WRB, photographed at Weinfelden, May 2026): the lower deck's band red,
// "Restaurant" large in red over it, in light capitals and lower case. The
// bistro car's (BR) modernised markings have not been photographed: drawn
// as the second-class coach's body without them. The family cars (all the
// Bt cab cars since 2012) carry Globi and the zoo's animals on their lower
// side.
const IC = { L: m(26.8), roof: m(4.75), eave: m(4.25), sill: 3.6, low: 1.15, truck: m(3.0), wb: m(2.5), d: 36.2,
  upY: m(3.0), upH: m(1.08), upW: m(1.5), upP: m(2.06), loY: m(0.98), loH: m(0.82), loW: m(1.25), doorY0: m(0.5), doorTop: m(2.55), doorW: m(1.4) };
// Each kind's layout, metres from the left end: d (door centres; the AD's
// second is its luggage door), lo (the lower deck's windows: first, pitch,
// count), up (the upper deck's band from, to), and the ends' hatches.
const IC_LAYOUT = {
  A: { d: [8.7, -4.9], lo: [10.5, 1.95, 4], up: [1.3, -1.3] },
  B: { d: [8.7, -4.9], lo: [10.3, 1.62, 5], up: [1.3, -1.3] },
  AD: { d: [4.9], lug: 17.4, lo: [6.6, 1.75, 4], up: [1.3, 15.2], biz: 21.6 },
  WRB: { d: [10.9], lo: [5.2, 1.75, 3], up: [1.3, -1.3] },
  BR: { d: [10.9], lo: [5.2, 1.75, 3], up: [1.3, -1.3] },
  Bt: { d: [8.0, -5.8], lo: [13.5, 1.45, 4], up: [9.0, -1.3] },
};
const at = (L, v) => (v < 0 ? L + m(v) : m(v));
// The door (photographed on a first-class A at Zürich HB, May 2026): red,
// its top a blue panel with the class numeral in white at the right and
// two small white pictograms at the left; on first class a yellow band
// under the blue; the tall window starting just under the panel.
const IC_PH = m(0.34), IC_YH = m(0.23);
function icDoor(c, x, cls) {
  const y0 = IC.doorY0, top = IC.doorTop, w = IC.doorW, k = c.mirrored ? -1 : 1;
  const wt = top - IC_PH - (cls === "1" ? m(0.1) : m(0.06));
  let s = rect(x, y0, w, top - y0, SBB.red, 0.6) + classPanel(c, x, w, top, cls, IC_PH, IC_YH);
  s += win(x + w / 2 - m(0.33), wt - m(1.3), m(0.48), m(1.3), 0.6) + rect(x + (k > 0 ? w - 0.35 : 0.23), y0 + m(0.9), 0.12, 0.6, "#3a3d40");
  const px = k > 0 ? x + 0.2 : x + w - 0.55;
  return s + rect(px, top - IC_PH * 0.45, 0.35, 0.35, "none", 0, 'stroke="#ffffff" stroke-width="0.35" vector-effect="non-scaling-stroke"') +
    rect(px, top - IC_PH * 0.92, 0.35, 0.35, "none", 0, 'stroke="#ffffff" stroke-width="0.35" vector-effect="non-scaling-stroke"');
}
function icCoach(c, kind) {
  const L = c.L, { roof, eave, sill, low } = IC, lay = IC_LAYOUT[kind];
  const cab = kind === "Bt" && c.cabL;
  const cls = kind === "A" || kind === "AD" ? "1" : "2";
  const upBand = SBB.black, loBand = kind === "WRB" ? SBB.red : SBB.black;
  const doors = lay.d.map((v) => at(L, v) - IC.doorW / 2);
  const upA = at(L, lay.up[0]), upB = at(L, lay.up[1]);
  const ups = (() => { const k = Math.floor((upB - upA - m(0.5) - IC.upW) / IC.upP) + 1, x0 = (upA + upB - (k - 1) * IC.upP - IC.upW) / 2; return seq(x0, IC.upP, k); })();
  const lows = seq(m(lay.lo[0]), m(lay.lo[1]), lay.lo[2]);
  const loA = lows[0] - m(0.3), loB = lows[lows.length - 1] + IC.loW + m(0.3);
  const drop = { a: m(4.6), b: L - m(4.2), y: low };
  return bilevel(c, {
    roof, sill, cornerR: 1.6, end: 0.6, noTrucks: true, drop, badge: false, base: SBB.white,
    nose: cab ? NOSE_BT : null, cabLen: cab ? 6 : 0,
    paint: () => {
      let s = bands(L, [[eave + 0.3, 6, SBB.roof], [eave + 0.05, 0.2, SBB.red], [0, m(0.75), SBB.black]]);
      s += rect(-1, sill - 0.2, drop.a + 1.5, 0.8, SBB.black) + rect(drop.b - 0.5, sill - 0.2, L - drop.b + 1.5, 0.8, SBB.black);
      s += rect(upA, IC.upY - 0.25, upB - upA, IC.upH + 0.5, upBand, 0, 'rx="0.6"');
      s += rect(loA, IC.loY - 0.2, loB - loA, IC.loH + 0.4, loBand, 0, 'rx="0.45"');
      for (const x of ups) s += pane(x, IC.upY, IC.upW, IC.upH, 0.75);
      for (const x of lows) s += pane(x, IC.loY, IC.loW, IC.loH, 0.45);
      if (lay.biz) s += pane(m(lay.biz), m(1.95), m(1.6), m(0.65), 0.45);
      if (cab) s += icCabPaint();
      return s;
    },
    rows: [], doors: [], diaphragm: [sill + 0.3, roof - 1.4],
    extra: (cc) => {
      let s = truck(IC.truck, { wb: IC.wb, d: IC.d, top: sill }) + truck(L - IC.truck, { wb: IC.wb, d: IC.d, top: sill });
      s += underframe(drop.a + 2.5, drop.b - 2.5, low + 0.05, { depth: 0.55, boxes: 4, tanks: false });
      for (const x of doors) s += icDoor(cc, x, cls);
      // The AD's luggage door: wide, white, a window in it.
      if (lay.lug) { const x = m(lay.lug); s += rect(x, m(0.55), m(2.0), m(1.85), SBB.white, 0.6) + line(x + m(1.0), m(0.55), x + m(1.0), m(2.4), "currentColor", 0.5) + win(x + m(0.35), m(1.55), m(1.3), m(0.6), 0.4); }
      // The ends: an oval vent high at each (the cab car's before its upper
      // deck), hatches and a grille on the lower deck's ends.
      s += ovalVent(cab ? upA - m(0.75) : m(0.4), m(3.2), m(0.4), m(0.9)) + ovalVent(L - m(0.8), m(3.2), m(0.4), m(0.9));
      s += hatch(L - m(4.0), m(0.85), m(2.7), m(1.2)) + grille(L - m(2.2), m(1.1), m(0.5), m(0.6));
      if (!cab && !lay.biz && kind !== "WRB" && kind !== "BR") s += hatch(m(0.6), m(0.85), m(5.4), m(1.2)) + grille(m(4.4), m(1.0), m(0.45), m(0.65));
      if (kind === "WRB" || kind === "BR") s += hatch(at(L, lay.d[0]) + m(1.3), m(0.85), m(7.5), m(1.25)) + grille(at(L, lay.d[0]) + m(5.0), m(1.0), m(1.0), m(0.75)) + hatch(m(0.6), m(0.85), m(3.6), m(1.2));
      if (kind === "WRB") s += say(cc, (loA + loB) / 2 + m(0.4), IC.loY + IC.loH + m(0.5), m(0.42), "Restaurant", SBB.red, { weight: 400 });
      s += cab ? sbbLogo(cc, m(23.2), m(2.62), m(0.36)) + familyArt(cc, L) : sbbLogo(cc, m(1.5), m(2.62), m(0.36));
      if (!c.coupledL && !cab) s += buffers(0, -1);
      if (!c.coupledR) s += buffers(L, 1);
      return s;
    },
    cab: cab ? (cc) => icCabDetails(cc) : null,
  });
}
// The Bt's cab (photographs, Lausanne 2023, Bern 2024): the Re 460's front
// grown to the double-deck height; red around the front, running back as
// the roof edge's line; the windshield in a dark surround, the cap above it
// gray; behind the cab a side window, then a hatch with two grilles before
// the first door.
const NOSE_BT = [[1.2, IC.sill], [0.95, 4.2], [0.9, 6.2], ["q", 0.95, 7.4, 1.35, 7.9], [2.65, 11.65], ["q", 3.0, 12.5, 3.7, 13.0], ["q", 4.9, 15.45, 7.2, 15.58]];
const icCabPaint = () => path(`M-1 2L${n(m(1.6))} 2L${n(m(1.6))} ${n(m(2.25))}Q${n(m(1.42))} ${n(m(3.1))} ${n(m(1.62))} ${n(m(3.75))}L${n(m(1.95))} ${n(m(4.3))}L-1 ${n(m(4.3))}Z`, SBB.red) +
  path(poly([[1.25, 7.55], [2.55, 11.9], [3.9, 11.9], [m(1.25), 7.55]]), SBB.anth) +
  path(`M-1 ${n(m(3.62))}L3.6 ${n(m(3.62))}Q${n(m(1.55))} ${n(m(4.05))} ${n(m(2.35))} 16L-1 16Z`, SBB.roof);
const icCabDetails = (c) => path(poly([[1.55, 8.05], [2.75, 11.6], [3.5, 11.6], [2.3, 8.05]]), C.glass) +
  win(m(1.75), m(2.55), m(1.05), m(0.8), 0.35) + line(m(1.62), m(0.6), m(1.62), m(3.6), "rgba(0,0,0,0.25)", 0.5) +
  hatch(m(5.3), m(0.75), m(1.5), m(2.0)) + grille(m(5.65), m(0.95), m(0.75), m(0.6)) + grille(m(5.65), m(1.75), m(0.75), m(0.6)) +
  rect(0.88, 4.6, 0.45, 0.55, "#fff6d8", 0.3, 'rx="0.12"') + rect(0.9, 4.1, 0.4, 0.3, "#d8262c", 0.3, 'rx="0.1"') +
  buffers(0, -1, { end: 0.95 }) + path(poly([[1.2, IC.sill + 0.05], [3.6, IC.sill + 0.05], [3.3, 0.6], [1.5, 0.6]]), C.black, 0, 'opacity="0.92"');
// The family car's pictures, as on every family car photographed since
// 2023 (Lausanne 2023 and 2024, Bern 2024, near Zürich 2025; SBB's "Ticki
// Park"): a blue gorilla with a yellow snake round his head, leaning back
// and pulling a yellow rope chequered in green; on the rope a red-brown
// monkey holding the "Ticki Park" sign; a knot in green and orange where
// the rope turns into a red and blue snake; two parrots, a small blue and
// red one and a red macaw with blue and yellow wings, over it; at the far
// end, beyond the second door, an orange tiger with black stripes pulling
// the snake. Simplified flat shapes in their colours, x in metres from the
// cab's end, the rope just above the lower deck's windows.
function familyArt(c, L) {
  const X = (v) => (c.mirrored ? L - m(v) : m(v));
  const P = (pts) => pts.map(([x, y], i) => `${i ? "L" : "M"}${n(X(x))} ${n(m(y))}`).join("") + "Z";
  const ell = (x, y, rx, ry, fill) => `<ellipse cx="${n(X(x))}" cy="${n(m(y))}" rx="${n(m(rx))}" ry="${n(m(ry))}" fill="${fill}"/>`;
  const rope = (a, b, y, h, fill) => rect(Math.min(X(a), X(b)), m(y - h / 2), Math.abs(X(b) - X(a)), m(h), fill);
  let s = "";
  // The rope, its chequer, the knot, the snake to the tiger.
  s += rope(12.5, 17.1, 1.95, 0.09, "#e8cf3a") + lines(seq(12.7, 0.3, 15).map((x) => [X(x), m(1.91), X(x + 0.15), m(1.99)]), "#6aa64a", 0.8);
  s += ell(17.3, 1.95, 0.22, 0.13, "#3f9a46") + ell(17.45, 1.98, 0.12, 0.08, "#f08a24");
  s += rope(17.5, 21.95, 1.97, 0.08, "#2c58b8") + lines(seq(17.7, 0.4, 11).map((x) => [X(x), m(1.93), X(x + 0.12), m(2.01)]), "#d8302a", 1.2);
  // The gorilla: legs braced, body leaning back, arms out to the rope.
  s += path(P([[9.8, 0.5], [10.4, 0.5], [10.6, 1.0], [11.0, 1.3], [11.3, 0.55], [11.9, 0.55], [11.6, 1.5], [12.6, 1.9], [12.6, 2.05], [11.7, 2.1],
    [11.4, 2.6], [10.9, 3.0], [10.1, 2.95], [9.7, 2.5], [9.8, 1.6], [10.2, 1.1]]), "#2f3d9a");
  s += ell(10.55, 2.6, 0.55, 0.42, "#2f3d9a") + ell(10.85, 2.5, 0.38, 0.27, "#6577c8") + ell(10.45, 1.6, 0.6, 0.65, "#283487");   // the head, the face, the belly
  s += path(P([[10.95, 2.55], [11.45, 2.45], [11.0, 2.35]]), "#ffffff");                                            // the grin
  s += path(P([[9.95, 2.9], [10.3, 3.25], [10.9, 3.15], [11.25, 2.95], [10.85, 3.0], [10.4, 3.05]]), "#f2c400");  // the snake on his head
  s += ell(12.55, 1.97, 0.16, 0.12, "#2f3d9a");                                                                      // the fists
  // The monkey on the rope with its sign.
  s += path(P([[13.7, 2.05], [15.0, 2.0], [15.05, 2.45], [13.75, 2.5]]), "#d9cf7c") +
    mark(c, X(14.37), m(2.25), `<text x="0" y="0.25" font-size="0.62" text-anchor="middle" font-family="${SANS}" font-weight="600" fill="#2f5f2a">Ticki Park</text>`);
  s += ell(15.45, 2.8, 0.22, 0.2, "#b9462e") + ell(15.52, 2.77, 0.13, 0.11, "#e7b48a") + ell(15.4, 2.33, 0.2, 0.28, "#b9462e");
  s += path(P([[15.55, 2.15], [16.2, 2.05], [16.35, 2.2], [15.6, 2.3]]), "#b9462e") + path(P([[15.2, 2.5], [15.0, 2.35], [15.1, 2.3], [15.3, 2.4]]), "#b9462e");   // a leg, the arm to the sign
  s += path(`M${n(X(15.2))} ${n(m(2.15))}Q${n(X(14.9))} ${n(m(2.9))} ${n(X(15.15))} ${n(m(3.05))}`, "none", 0, 'stroke="#b9462e" stroke-width="1.2" vector-effect="non-scaling-stroke"');   // the curled tail
  // The parrots.
  s += path(P([[16.9, 2.05], [17.3, 2.35], [17.7, 2.3], [17.4, 2.1]]), "#2c58b8") + ell(17.6, 2.33, 0.1, 0.08, "#d8302a");
  s += path(P([[17.9, 2.45], [18.5, 2.8], [19.2, 2.75], [18.8, 2.55], [18.3, 2.4]]), "#d8302a") + path(P([[18.4, 2.62], [18.9, 2.95], [19.0, 2.75]]), "#2f6fd0") +
    path(P([[18.5, 2.55], [18.85, 2.6], [18.6, 2.47]]), "#f2c400") + path(P([[19.15, 2.78], [19.35, 2.72], [19.15, 2.66]]), "#f2e6c8");
  // The tiger, upright, pulling; its stripes.
  s += path(P([[22.1, 0.35], [22.45, 0.35], [22.5, 1.0], [22.75, 0.35], [23.05, 0.35], [22.9, 1.3], [23.0, 2.2], [22.8, 2.75], [22.35, 2.95],
    [22.05, 2.6], [22.0, 2.05], [21.9, 1.9], [22.2, 1.4]]), "#e46a1e");
  s += path(P([[22.15, 2.55], [22.35, 2.85], [22.75, 2.75], [22.7, 2.45]]), "#f3e2c4");                            // the face
  s += lines([[22.15, 1.0], [22.25, 1.4], [22.15, 1.8], [22.3, 2.2], [22.6, 0.8], [22.55, 1.6]].map(([x, y]) => [X(x), m(y), X(x + 0.35), m(y + 0.06)]), "#1b1c1f", 1.1);
  return s;
}
// ---------- FV-Dosto (RABe 502 / RABDe 502, Bombardier Twindexx Swiss Express) ----------
// Bombardier's double-deck long-distance units (2017-2022, 62 for SBB):
// IC 200 (RABDe 502 001-023) and IR 200 (RABe 502 201-230), eight cars,
// 200.6 m; IR 100 (RABe 502 401-409), four cars, 101 m; the end cars
// 25.6 m, the others 24.9 m; 4.59 m tall; each car on two trucks of its
// own (920 mm wheels), the end cars and four of the middle ones powered.
// Two single doors a side on every car (16 a side), entered at platform
// height. The layout from Bombardier's data sheet elevations (2020) and
// SBB's fleet list (which cars are which: At, ADt, A, WRB, B, Bt); the
// paint from photographs (502 217 at Dresden 2025, 502 229 at Tecknau 2024,
// IC 1 at Zürich HB 2026): white; black along the bottom and above the
// upper deck's windows; the nose red, a broad black swoosh sweeping down
// from the roof behind it to the bottom ahead of the first door, the red
// running back above it along the roof; red doors with the blue class panel
// (the yellow band under it in first class); the restaurant car's upper
// deck in a red band, "Restaurant" in red.
const FV = { roof: m(4.59), top: m(4.02), sill: m(1.25), low: m(0.38), upY: m(3.27), upH: m(0.68), upW: m(1.28), loY: m(1.22), loH: m(0.65), loW: m(1.33),
  doorW: m(1.55), doorY0: m(0.45), doorTop: m(2.83), d: 36.2, wb: m(2.5) };
// The nose (from the coupler face, bottom up), its line from the data
// sheet and photographs: a low red lip over the coupler, the windshield
// raked back in one long slope to the roof.
const NOSE_FV = [[m(1.0), FV.low], [m(0.25), m(0.75)], [m(0.05), m(1.15)], ["q", m(0.0), m(1.55), m(0.3), m(1.85)], [m(1.0), m(2.4)],
  [m(2.7), m(3.75)], ["q", m(3.6), m(4.45), m(5.0), m(4.55)], [m(6.6), FV.roof]];
// Layouts, metres from the car's left end (the end car's from its nose):
// doors (left edges; "L" a luggage door), upper and lower windows [x, w].
const FV_UP_END = [[8.95, 1.28], [10.75, 1.28], [12.55, 1.28], [14.3, 1.28], [16.1, 1.28], [17.85, 1.28], [19.45, 1.05], [20.85, 1.28], [22.6, 1.28]];
const FV_UP_MID = [[1.55, 1.28], [3.35, 1.28], [5.2, 0.85], [6.55, 0.85], [7.95, 1.28], [9.75, 1.28], [11.5, 1.28], [13.3, 1.28], [15.1, 1.28], [16.9, 0.8], [17.9, 0.9], [19.55, 1.28], [21.3, 1.28]];
const FV_LAYOUT = {
  Bt: { doors: [8.65, 18.1], up: FV_UP_END, lo: [[11.05, 1.33], [12.85, 1.33], [14.6, 0.64]], cls: "2" },
  At: { doors: [8.65, 18.1], up: FV_UP_END, lo: [[11.05, 1.33], [12.85, 1.33], [14.6, 0.64]], cls: "1" },
  ABt: { doors: [8.65, 18.1], up: FV_UP_END, lo: [[11.05, 1.33], [12.85, 1.33], [14.6, 0.64]], cls: ["1", "2"] },
  ADt: { doors: [["L", 7.1, 1.8], 18.6], up: FV_UP_END, lo: [[10.4, 1.33], [12.2, 1.33], [14.0, 1.33]], cls: "1" },
  B: { doors: [5.6, 17.05], up: FV_UP_MID, lo: [[8.3, 1.33], [10.1, 1.33], [11.9, 1.33], [13.7, 0.64]], cls: "2" },
  A: { doors: [5.6, 17.05], up: FV_UP_MID, lo: [[8.5, 1.33], [10.6, 1.33], [12.7, 1.33]], cls: "1" },
  WRB: { doors: [["L", 3.6, 1.35], 17.05], up: FV_UP_MID, lo: [[8.3, 1.33], [10.1, 1.33], [11.9, 1.33], [13.7, 0.64]], cls: "2", wr: true },
};
function fvCar(c, kind) {
  const L = c.L, lay = FV_LAYOUT[kind], end = /t$/.test(kind), cab = end && c.cabL;
  const { roof, top, sill, low } = FV;
  // Trucks: the end car's 4.8 m from the nose and 3.6 m from its inner
  // end; the middle cars' 2.4 m and 3.6 m from their ends.
  const trucks = end ? [m(4.8), L - m(3.6)] : [m(2.4), L - m(3.6)];
  const drop = { a: trucks[0] + m(1.75), b: trucks[1] - m(1.75), y: low };
  const xs = (list) => list.map(([x, w]) => [m(x), m(w)]);
  const ups = xs(lay.up), los = xs(lay.lo);
  return bilevel(c, {
    roof, sill, cornerR: 1.4, end: 0.6, noTrucks: true, drop, badge: false, base: SBB.white,
    nose: cab ? NOSE_FV : null, cabLen: 0,
    paint: () => {
      let s = bands(L, [[top, 6, SBB.black], [0, m(0.93), SBB.black]]);
      if (lay.wr) s += rect(-1, FV.upY - 0.4, L + 2, top - FV.upY + 0.4, SBB.red);
      for (const [x, w] of ups) s += pane(x, FV.upY, w, FV.upH, 0.6);
      for (const [x, w] of los) s += pane(x, FV.loY, w, FV.loH, 0.45);
      if (cab) s += fvCabPaint();
      return s;
    },
    rows: [], doors: [], diaphragm: [sill + 0.3, roof - 1.6],
    extra: (cc) => {
      let s = trucks.map((x) => truck(x, { wb: FV.wb, d: FV.d, top: sill })).join("");
      s += underframe(drop.a + 1.5, drop.b - 1.5, low + 0.05, { depth: 0.5, boxes: 4, tanks: false });
      lay.doors.forEach((d, i) => {
        if (Array.isArray(d)) {     // a luggage or catering door: white, flush
          const x = m(d[1]), w = m(d[2]);
          s += rect(x, FV.doorY0 + 0.3, w, m(2.0), SBB.white, 0.6, 'rx="0.2"') + win(x + w / 2 - m(0.25), m(1.55), m(0.5), m(0.6), 0.3);
          return;
        }
        const x = m(d), y1 = FV.doorTop - 1.1, cls = Array.isArray(lay.cls) ? lay.cls[i] : lay.cls;
        s += rect(x, FV.doorY0, FV.doorW, y1 - FV.doorY0, SBB.red, 0.6) + win(x + FV.doorW / 2 - m(0.2), FV.doorY0 + m(0.75), m(0.4), m(1.15), 0.6);
        s += classPanel(cc, x, FV.doorW, FV.doorTop, cls, 1.1);
      });
      // The middle cars' ends: grilles low on the mid-level section.
      if (!end) s += grille(m(0.5), m(1.25), m(0.5), m(1.0)) + grille(L - m(1.0), m(1.25), m(0.5), m(1.0));
      else s += grille(L - m(1.1), m(1.25), m(0.5), m(1.0)) + (cab || !c.cabL ? hatch(m(7.0), m(0.95), m(0.65), m(2.2)) + win(m(7.1), m(1.65), m(0.45), m(0.5), 0.2) + hatch(m(7.75), m(2.25), m(0.7), m(0.6)) : "");
      if (lay.wr) s += say(cc, m(5.5), m(2.7), m(0.42), "Restaurant", SBB.red, { weight: 500, spacing: "0.12em" });
      s += sbbLogo(cc, end ? m(11.1) : lay.wr ? m(9.6) : m(8.3), m(2.62), m(0.3));
      // Roof: the end cars' pantograph (the leading one down), the
      // others' air conditioning.
      if (end) s += pantograph(m(5.9), roof - 0.05, { up: !cc.lead, facing: -1 }) + hvLine(m(5.9) + 3.0, m(5.9) + 9.0, roof - 0.05);
      s += hvac(L / 2 - 6, roof - 0.05, 12, 0.6);
      return s;
    },
    cab: cab ? () => fvCabDetails() : null,
  });
}
// The nose's paint: red over the front and back along the roof above the
// swoosh; the swoosh black, from the roof 6.6-7.8 m back down to the
// bottom 2.0-3.4 m back; white behind it; the windshield's dark surround.
const fvCabPaint = () => path(`M-1 ${n(m(0.6))}L${n(m(8.2))} ${n(m(0.6))}L${n(m(8.2))} 20L-1 20Z`, SBB.red) +
  path(`M${n(m(2.25))} ${n(m(0.93))}Q${n(m(3.7))} ${n(m(3.2))} ${n(m(5.6))} ${n(m(4.1))}L${n(m(7.45))} ${n(m(4.1))}Q${n(m(4.4))} ${n(m(3.0))} ${n(m(2.95))} ${n(m(0.93))}Z`, SBB.black) +
  path(`M${n(m(2.95))} ${n(m(0.93))}Q${n(m(4.4))} ${n(m(3.0))} ${n(m(7.45))} ${n(m(4.1))}L${n(m(8.3))} ${n(m(4.02))}L${n(m(8.3))} ${n(m(0.9))}Z`, SBB.white) +
  rect(m(1.3), -1, m(7.5), m(0.93) + 1, SBB.black) + path(poly([[m(0.85), m(2.3)], [m(2.55), m(3.7)], [m(3.3), m(3.7)], [m(1.7), m(2.3)]]), SBB.black);
const fvCabDetails = () => path(poly([[m(1.05), m(2.42)], [m(2.6), m(3.6)], [m(3.05), m(3.6)], [m(1.55), m(2.42)]]), C.glass) +
  win(m(4.5), m(2.6), m(0.95), m(0.8), 0.5) + rect(m(0.25), m(1.6), 0.6, 0.45, "#fff6d8", 0.3, 'rx="0.15"') + rect(m(0.2), m(1.4), 0.5, 0.3, "#d8262c", 0.3, 'rx="0.1"') +
  rect(0.1, 2.55, m(1.0), 0.6, "currentColor", 0, 'opacity="0.85"');

// ---------- Giruno (RABe 501, Stadler SMILE) ----------
// Stadler's eleven-car high-speed unit for the Gotthard and Italy
// (2017-2026, 41 for SBB): 202 m, 4.26 m tall; end cars 22.25 m, the nine
// between 17.5 m; the cars share Jakobs trucks (2.75 m wheelbase), a
// running truck under each nose; low floors at the doors. One door a side
// in every car (at 760 mm), two more at 550 mm beside the restaurant car;
// four pantographs, on cars B, D, F and H. Its cars, from the second-class
// end: Bt1, B11, B10, B9, B8 (family zone), B7, WR6 (restaurant), A5, A4,
// A3 (business), At2 (SBB's fleet list; the formation service's order).
// The paint (photographs, 501 017 near Schübelbach 2021, 501 030 and 501
// 029 at Zürich HB 2022-2026, 501 023 at Brescia 2024): white; the windows
// in one black band; a thin red line along the roof's edge, running down
// round the windshield to the nose's red upper lip; the roof dark gray;
// black along the bottom; red doors, a blue strip with the class numeral
// beside each; in first class a yellow bar over the door (photographed
// at Brescia, July 2024);
// the restaurant car's band red over its dining room (the first-class
// half), "Restaurant" in red above it; SBB's flag
// under the band near each car's end.
const GI = { roof: m(4.26), side: m(3.62), sill: m(1.05), low: m(0.4), bandY: m(1.72), bandH: m(1.24), winY: m(1.86), winH: m(0.98), winW: m(1.15), pitch: m(1.9),
  doorW: m(1.15), doorY0: m(0.62), doorTop: m(2.78), d: 36.2 };
const NOSE_GI = [[m(1.6), GI.low], [m(0.55), m(0.62)], [m(0.1), m(0.95)], ["q", m(-0.05), m(1.35), m(0.35), m(1.55)], [m(1.1), m(1.78)],
  ["q", m(1.6), m(2.05), m(2.0), m(2.5)], [m(3.3), m(3.45)], ["q", m(4.3), m(4.15), m(5.6), m(4.23)], [m(6.6), GI.roof]];
// Each car: its door (centre, metres from the left end, the unit drawn
// with its second-class end on the left), the low-floor door, the class,
// the pantograph.
const GI_CARS = {
  Bt1: { door: -4.6, cls: "2", cab: true }, B11: { door: -7.65, cls: "2", pan: true }, B10: { door: -7.65, cls: "2" }, B9: { door: -7.65, cls: "2", pan: true },
  B8: { door: -7.65, cls: "2" }, B7: { door: -7.65, low: -1.4, cls: "2", pan: true }, WR6: { cls: null, wr: true },
  A5: { door: 7.65, low: 1.4, cls: "1", pan: true }, A4: { door: 7.65, cls: "1" }, A3: { door: 7.65, cls: "1" }, At2: { door: -4.6, cls: "1", cab: true },
};
function giCar(c, kind) {
  const L = c.L, o = GI_CARS[kind], cab = o.cab && c.cabL, { roof, side, sill, low } = GI;
  const doors = [o.door, o.low].filter((v) => v != null).map((v) => (v < 0 ? L + m(v) : m(v)) - GI.doorW / 2);
  const bandA = cab ? m(7.2) : m(0.6), bandB = L - m(0.6);
  // Windows at an even pitch, clear of the doors.
  const wins = [];
  for (let x = bandA + m(0.45); x + GI.winW <= bandB - m(0.3); x += GI.pitch) {
    if (doors.some((d) => x + GI.winW > d - m(0.35) && x < d + GI.doorW + m(0.35))) continue;
    wins.push(x);
  }
  const drop = { a: cab ? m(4.8) : m(2.0), b: L - m(2.0), y: low };
  return bilevel(c, {
    roof, sill, cornerR: 1.2, end: 0.3, noTrucks: true, drop, badge: false, base: SBB.white,
    nose: cab ? NOSE_GI : null, cabLen: 0,
    paint: () => {
      let s = bands(L, [[side + 0.4, 6, SBB.roof], [side, 0.4, SBB.red], [0, m(0.95), SBB.black]]);
      s += rect(bandA, GI.bandY, bandB - bandA, GI.bandH, SBB.black);
      if (o.wr) s += rect(L - m(9.6), GI.bandY, m(9.0), GI.bandH, SBB.red);
      for (const x of wins) s += pane(x, GI.winY, GI.winW, GI.winH, 0.5);
      if (cab) s += giCabPaint();
      return s;
    },
    rows: [], doors: [], diaphragm: [sill + 0.2, side - 0.3],
    extra: (cc) => {
      // Jakobs trucks, half in each car; the end car's running truck.
      let s = truck(L, { wb: m(2.75), d: GI.d, top: sill }) + (cab ? truck(m(3.6), { wb: m(2.7), d: GI.d, top: sill }) : truck(0, { wb: m(2.75), d: GI.d, top: sill }));
      s += underframe(drop.a + 1.2, drop.b - 1.2, low + 0.05, { depth: 0.45, boxes: 3, tanks: false });
      for (const x of doors) {
        s += rect(x, GI.doorY0, GI.doorW, GI.doorTop - GI.doorY0, SBB.red, 0.6) + win(x + GI.doorW / 2 - m(0.17), GI.doorY0 + m(0.85), m(0.34), m(1.05), 0.5);
        if (o.cls === "2") { const sx = x - m(0.24); s += rect(sx, GI.doorTop - m(0.55), m(0.2), m(0.55), SBB.blue) + say(cc, sx + m(0.1), GI.doorTop - m(0.27), m(0.17), "2", "#ffffff", { weight: 700 }); }
        if (o.cls === "1") s += rect(x - m(0.04), GI.doorTop + m(0.02), GI.doorW + m(0.14), m(0.13), SBB.yellow);
      }
      if (o.wr) s += say(cc, L - m(5.1), GI.bandY + GI.bandH + m(0.32), m(0.3), "Restaurant", SBB.red, { weight: 500, spacing: "0.03em" });
      s += sbbLogo(cc, cab ? m(7.3) : (o.door ?? -1) < 0 ? m(0.9) : L - m(3.2), m(1.4), m(0.26));
      if (o.pan) s += pantograph(L / 2, roof - 0.05, { up: kind === "B7", facing: -1 }) + hvLine(L / 2 + 3.0, L / 2 + 9.0, roof - 0.05);
      else s += hvac(L / 2 - 5, roof - 0.05, 10, 0.55);
      return s;
    },
    cab: cab ? () => giCabDetails() : null,
  });
}
// The nose: white, its upper lip red (from below the windshield round the
// front and up its sides, the red line leaving it along the roof's edge);
// the windshield in black; black sweeping up from the bottom under the nose
// to the skirt's top behind the running truck; behind the cab its side
// window and the crew door.
const giCabPaint = () => path(`M-1 ${n(m(1.22))}L${n(m(1.0))} ${n(m(1.3))}Q${n(m(2.2))} ${n(m(1.45))} ${n(m(2.9))} ${n(m(2.0))}L${n(m(4.4))} ${n(m(3.3))}` +
  `Q${n(m(5.0))} ${n(m(3.62))} ${n(m(6.8))} ${n(m(3.62))}L${n(m(6.8))} ${n(GI.side + 0.4)}L-1 ${n(GI.side + 0.4)}Z`, SBB.red) +
  path(poly([[m(0.5), m(1.92)], [m(1.4), m(2.0)], [m(3.0), m(3.32)], [m(5.0), m(3.75)], [m(5.0), m(4.3)], [m(0.5), m(4.3)]]), SBB.black) +
  path(`M-1 0L${n(m(7.5))} 0L${n(m(7.5))} ${n(m(0.95))}L${n(m(2.6))} ${n(m(0.95))}Q${n(m(1.4))} ${n(m(0.7))} ${n(m(1.2))} ${n(m(0.3))}Z`, SBB.black);
const giCabDetails = () => path(poly([[m(1.5), m(2.08)], [m(3.05), m(3.38)], [m(3.7), m(3.5)], [m(2.1), m(2.08)]]), C.glass) + rect(m(0.55), m(1.55), m(0.75), m(0.22), "#2a2d31", 0.3, 'rx="0.2"') +
  win(m(5.0), m(2.5), m(0.42), m(0.62), 0.25) + rect(m(5.7), m(0.95), m(0.75), m(2.15), "none", 0.5, 'rx="0.3"') +
  line(m(5.62), m(1.3), m(5.62), m(2.6), "currentColor", 0.6) + line(m(6.53), m(1.3), m(6.53), m(2.6), "currentColor", 0.6) +
  rect(m(0.35), m(1.3), 0.7, 0.35, "#fff6d8", 0.3, 'rx="0.15"') + rect(0.1, 2.55, m(1.2), 0.6, "currentColor", 0, 'opacity="0.85"');

// ---------- Single-deck bodies (ICN, Astoro, EW IV) ----------
// A car body drawn by bilevel with no low floor: o.roof, o.sill, o.nose (a
// cab end), o.paint(L), o.extra(c, L), o.trucks [x...], o.d (wheel, in).
function single(c, o) {
  const L = c.L;
  return bilevel(c, {
    roof: o.roof, sill: o.sill, cornerR: o.cornerR ?? 1.1, end: o.end ?? 0.5, noTrucks: true, badge: false, base: o.base ?? SBB.white,
    nose: c.cabL && o.nose ? o.nose : null, cabLen: 0, rows: [], doors: [], diaphragm: [o.sill + 0.3, o.roof - 1.4],
    paint: () => o.paint(L),
    extra: (cc) => o.trucks.map((x) => truck(x, { wb: o.wb ?? m(2.5), d: o.d ?? 36, top: o.sill, kind: o.kind ?? "car" })).join("") +
      underframe(o.trucks[0] + m(2.3), o.trucks[o.trucks.length - 1] - m(2.3), o.sill, { depth: 1.0, boxes: 4, tanks: false }) + o.extra(cc, L),
    cab: c.cabL && o.cab ? () => o.cab() : null,
  });
}
// The bicycle pictogram, white, about 1.4 ft wide, drawn in a mark().
const BIKE = `<g transform="scale(0.55)"><path d="M-0.6 0.5a0.42 0.42 0 1 0 0.01 0M0.6 0.5a0.42 0.42 0 1 0 0.01 0M-0.6 0.5L-0.1 -0.3L0.6 0.5M-0.1 -0.3L0.35 -0.3" fill="none" stroke="#ffffff" stroke-width="0.14"/></g>`;
// Windows from a to b at a pitch, w wide, clear of the [x, w] spans in
// skip.
const winsFrom = (a, b, w, pitch, skip = []) => {
  const out = [];
  for (let x = a; x + w <= b + 0.01; x += pitch) if (!skip.some(([sx, sw]) => x + w > sx - 0.4 && x < sx + sw + 0.4)) out.push(x);
  return out;
};

// ---------- ICN (RABDe 500) ----------
// SIG/Fiat and ABB/Adtranz's tilting InterCity units (1999-2005, 44): seven
// cars, 188.8 m; end cars 27.19 m, the five between 26.86 m; 3.95 m tall,
// the narrow body leaning in toward the roof; each car on two trucks
// (2.7 m wheelbase, 820 mm wheels); a single door a side at each end of
// every car. Its cars, from end to end (SBB's fleet list): Bt1, B7, AD6,
// A5, WRA4 (restaurant and first class), B3, Bt2. The paint, as refitted
// since 2024 (photographs, IC 51 at Riedes-Dessus, August 2026, Renens
// 2026, Neuchâtel 2024): white; the windows in one black band; the nose
// red from the roof down round the black windshield to below the lamps,
// a white chin, black under it; black along the bottom; white doors with
// the blue class strip, a red panel with the bicycle beside the end cars'
// first doors; SBB's flag on the side under the band.
const ICN = { roof: m(3.95), sill: m(1.15), bandY: m(1.62), bandH: m(1.05), winY: m(1.72), winH: m(0.86), winW: m(1.2), pitch: m(1.47), doorW: m(0.86), d: 32.3 };
const NOSE_ICN = [[m(0.9), m(0.45)], [m(0.2), m(0.6)], [m(0.02), m(1.0)], ["q", m(0.0), m(1.6), m(0.18), m(1.95)], [m(1.25), m(3.3)],
  ["q", m(1.8), m(3.92), m(3.0), m(3.95)]];
const ICN_CARS = {
  Bt1: { cls: "2", cab: true }, B7: { cls: "2" }, AD6: { cls: "1", luggage: true }, A5: { cls: "1" }, WRA4: { cls: "1", wr: true }, B3: { cls: "2" }, Bt2: { cls: "2", cab: true },
};
function icnCar(c, kind) {
  const L = c.L, o = ICN_CARS[kind], cab = o.cab && c.cabL;
  const doors = [cab ? m(4.9) : m(1.05), L - m(1.05) - ICN.doorW];
  const bandA = cab ? m(6.7) : doors[0] + ICN.doorW + m(0.3), bandB = doors[1] - m(0.3);
  const skip = o.luggage ? [[L - m(7.0), m(2.6)]] : o.wr ? [[m(13.0), m(0.8)]] : [];
  const wins = winsFrom(bandA + (cab ? m(1.7) : m(0.35)), bandB - m(0.3), ICN.winW, ICN.pitch, skip);
  return single(c, {
    roof: ICN.roof, sill: ICN.sill, nose: NOSE_ICN, d: ICN.d, wb: m(2.7), trucks: cab ? [m(4.3), L - m(3.4)] : [m(3.4), L - m(3.4)],
    paint: (L) => {
      let s = bands(L, [[ICN.roof - m(0.35), 6, "#b4b9be"], [0, m(1.28), SBB.black]]);
      s += rect(bandA, ICN.bandY, bandB - bandA, ICN.bandH, o.wr ? SBB.red : SBB.black);
      for (const x of wins) s += pane(x, ICN.winY, ICN.winW, ICN.winH, 0.35);
      // The end cars' red strip with the bicycle behind the first door.
      if (cab) s += rect(bandA, ICN.bandY - 0.02, m(0.55), ICN.bandH + 0.04, SBB.red);
      // The nose: red from below the lamps up round the windshield to the
      // roof, its edge on the side curving back; black chin; the
      // windshield's black mask and the black cap over it.
      if (cab) s += path(`M-1 ${n(m(1.02))}L${n(m(2.0))} ${n(m(1.02))}Q${n(m(2.55))} ${n(m(2.2))} ${n(m(3.0))} ${n(m(3.3))}Q${n(m(3.3))} ${n(m(3.8))} ${n(m(3.9))} 16L-1 16Z`, SBB.red) +
        path(`M-1 0L${n(m(2.6))} 0L${n(m(2.6))} ${n(m(0.85))}Q${n(m(1.4))} ${n(m(0.95))} -1 ${n(m(0.95))}Z`, SBB.black) +
        path(`M${n(m(0.1))} ${n(m(1.8))}Q${n(m(1.3))} ${n(m(1.75))} ${n(m(2.05))} ${n(m(2.4))}Q${n(m(2.45))} ${n(m(2.9))} ${n(m(2.6))} ${n(m(3.45))}L${n(m(2.75))} 16L-1 16Z`, SBB.black);
      return s;
    },
    cab: () => path(poly([[m(0.35), m(2.1)], [m(1.2), m(3.15)], [m(1.75), m(3.15)], [m(1.4), m(2.55)], [m(0.95), m(2.1)]]), C.glass) +
      path(`M${n(m(3.25))} ${n(m(1.95))}L${n(m(3.95))} ${n(m(3.0))}Q${n(m(4.05))} ${n(m(2.2))} ${n(m(3.9))} ${n(m(1.95))}Z`, SBB.black) +
      rect(m(0.12), m(1.3), 0.6, 0.55, "#fff6d8", 0.3, 'rx="0.2"') + rect(0.05, 2.5, m(0.9), 0.6, "currentColor", 0, 'opacity="0.85"'),
    extra: (cc, L) => {
      let s = "";
      for (const x of doors) {
        s += rect(x, m(0.62), ICN.doorW, m(2.2), SBB.white, 0.6, 'rx="0.15"') + win(x + ICN.doorW / 2 - m(0.17), m(1.5), m(0.34), m(1.0), 0.5);
        s += rect(x + ICN.doorW + 0.05, m(1.85), m(0.18), m(0.8), SBB.blue) + say(cc, x + ICN.doorW + 0.05 + m(0.09), m(2.5), m(0.14), o.cls, "#ffffff", { weight: 700 });
      }
      if (cab) s += mark(cc, m(6.7) + m(0.27), m(2.15), BIKE);
      if (o.luggage) s += rect(L - m(7.0), m(0.7), m(2.6), m(2.05), SBB.white, 0.6, 'rx="0.15"') + line(L - m(5.7), m(0.7), L - m(5.7), m(2.75), "currentColor", 0.5);
      if (o.wr) s += say(cc, m(9.5), ICN.bandY + ICN.bandH + m(0.25), m(0.24), "Restaurant", SBB.red, { weight: 500 });
      s += sbbLogo(cc, cab ? m(8.4) : m(3.0), m(1.45), m(0.22));
      if (kind === "B7" || kind === "B3") s += pantograph(L / 2, ICN.roof - 0.05, { up: kind === "B3", facing: -1 }) + hvLine(L / 2 + 3, L / 2 + 8, ICN.roof - 0.05);
      return s + hvac(m(4.5), ICN.roof - 0.05, 9, 0.5) + hvac(L - m(4.5) - 9, ICN.roof - 0.05, 9, 0.5);
    },
  });
}

// ---------- Astoro (RABe 503, Alstom ETR 610) ----------
// Alstom's tilting New Pendolino in SBB's paint (2007-2016; SBB's twelve:
// 503 011-022 after Trenitalia took over seven of the first series): seven
// cars, 187.4 m; end cars 28.2 m, the others 26.2 m; 4.1 m tall; a single
// plug door a side at the inner end of each car. Its cars (SBB's fleet
// list): At1, A7, WRA6 (bistro and first class), B5, B4, B3, Bt2. The
// paint (photographs, 503 015 at Bregenz 2025, München 2025, Wil 2024):
// pale gray-white; a thin red line along the roof's edge, from the nose's
// red; the nose red over its upper lip round the lamps, the windshield
// black; the windows in a black band; dark gray along the bottom; SBB's
// flag under the band by the doors.
const AS = { roof: m(4.1), sill: m(1.15), bandY: m(1.72), bandH: m(1.02), winY: m(1.8), winH: m(0.86), winW: m(1.1), pitch: m(1.33), doorW: m(0.92), d: 35.4,
  pearl: "#e3e1dc" };
const NOSE_AS = [[m(1.4), m(0.45)], [m(0.35), m(0.65)], [m(0.05), m(1.05)], ["q", m(0.0), m(1.45), m(0.55), m(1.6)], [m(1.6), m(2.0)],
  [m(3.5), m(3.3)], ["q", m(4.6), m(4.05), m(6.0), m(4.1)]];
const AS_CARS = { At1: { cls: "1", cab: true }, A7: { cls: "1" }, WRA6: { cls: "1", wr: true }, B5: { cls: "2" }, B4: { cls: "2" }, B3: { cls: "2" }, Bt2: { cls: "2", cab: true } };
function asCar(c, kind) {
  const L = c.L, o = AS_CARS[kind], cab = o.cab && c.cabL;
  const doors = cab ? [m(6.5), L - m(1.2) - AS.doorW] : [L - m(1.2) - AS.doorW];
  const bandA = cab ? m(7.9) : m(1.0), bandB = L - m(2.6);
  const wins = winsFrom(bandA + m(0.3), bandB - m(0.25), AS.winW, AS.pitch, o.wr ? [[m(9.0), m(3.0)]] : []);
  return single(c, {
    roof: AS.roof, sill: AS.sill, nose: NOSE_AS, d: AS.d, wb: m(2.7), base: AS.pearl, trucks: cab ? [m(5.3), L - m(3.3)] : [m(3.3), L - m(3.3)],
    paint: (L) => {
      let s = bands(L, [[AS.roof - m(0.4), 6, "#55595e"], [AS.roof - m(0.48), 0.28, SBB.red], [0, m(1.3), "#3c4045"]]);
      s += rect(bandA, AS.bandY, bandB - bandA, AS.bandH, SBB.black, 0, 'rx="0.4"');
      for (const x of wins) s += pane(x, AS.winY, AS.winW, AS.winH, 0.35);
      if (cab) s += path(`M-1 ${n(m(1.0))}L${n(m(1.3))} ${n(m(1.1))}Q${n(m(2.4))} ${n(m(1.25))} ${n(m(2.9))} ${n(m(1.75))}L${n(m(4.2))} ${n(m(3.4))}Q${n(m(4.8))} ${n(m(3.62))} ${n(m(7.0))} ${n(AS.roof - m(0.4))}L${n(m(7.0))} ${n(AS.roof - m(0.48))}Q${n(m(4.6))} ${n(m(3.45))} ${n(m(4.4))} ${n(m(3.2))}L${n(m(3.6))} 15L-1 15Z`, SBB.red) +
        path(poly([[m(1.2), m(1.85)], [m(3.2), m(3.25)], [m(5.4), m(3.9)], [m(5.4), 15], [-1, 15], [-1, m(1.75)]]), SBB.black) +
        path(`M-1 0L${n(m(4.0))} 0L${n(m(4.0))} ${n(m(1.4))}Q${n(m(1.6))} ${n(m(0.9))} -1 ${n(m(1.0))}Z`, AS.pearl);
      return s;
    },
    cab: () => path(poly([[m(1.45), m(1.95)], [m(3.15), m(3.15)], [m(3.7), m(3.15)], [m(2.05), m(1.95)]]), C.glass) + path(poly([[m(4.6), m(2.25)], [m(5.6), m(3.25)], [m(5.6), m(2.25)]]), SBB.black) +
      rect(m(0.45), m(1.3), 0.8, 0.45, "#fff6d8", 0.3, 'rx="0.2"') + rect(0.05, 2.5, m(1.3), 0.6, "currentColor", 0, 'opacity="0.85"'),
    extra: (cc, L) => {
      let s = "";
      for (const x of doors) s += rect(x, m(0.62), AS.doorW, m(2.3), AS.pearl, 0.6, 'rx="0.15"') + win(x + AS.doorW / 2 - m(0.18), m(1.6), m(0.36), m(0.95), 0.5) +
        rect(x - m(0.25), m(2.05), m(0.18), m(0.7), SBB.blue) + say(cc, x - m(0.16), m(2.6), m(0.14), o.cls, "#ffffff", { weight: 700 });
      s += sbbLogo(cc, cab ? m(8.2) : m(1.2), m(1.52), m(0.24));
      if (kind === "B4" || kind === "A7") s += pantograph(m(8.0), AS.roof - 0.05, { up: kind === "B4", facing: -1 }) + hvLine(m(8.0) + 3, m(8.0) + 9, AS.roof - 0.05);
      return s + hvac(L - m(6.5), AS.roof - 0.05, 10, 0.5);
    },
  });
}

// ---------- EW IV coaches ----------
// SIG/Schindler's Einheitswagen IV (1981-1991; refitted 2018-2023): 26.4 m,
// 4.05 m tall, trucks 19 m apart (2.5 m wheelbase); a single plug door a
// side at each end. As refitted (photographs, A 10-95 031 and B 21-95 149,
// September 2024; Bt 28-94 910 at Lausanne 2024): pale gray; the windows
// in a black band; the roof dark gray; dark gray along the bottom; red
// doors, the class numeral on a blue strip beside each; first class (A) a
// red line along the roof's edge and a yellow bar over the door; the cab
// car (Bt) the Re 460's red front, a red panel with the bicycle behind the
// cab; SBB's flag under the band. The restaurant car (WRm) is drawn in the
// same paint, the band red, without lettering (none photographed).
const EW = { roof: m(4.05), sill: m(1.0), bandY: m(1.78), bandH: m(1.15), winY: m(1.86), winH: m(0.99), doorW: m(0.85), grey: "#d6d5cf", d: 36.2 };
const NOSE_EWBT = [[m(0.35), EW.sill], [m(0.28), m(1.6)], ["q", m(0.3), m(2.25), m(0.45), m(2.45)], [m(0.8), m(3.55)], ["q", m(1.0), m(4.05), m(2.0), m(4.05)]];
function ewCar(c, kind) {
  const L = c.L, cab = kind === "Bt" && c.cabL;
  const cls = kind === "A" ? "1" : kind === "WR" ? null : "2";
  const doors = [cab ? m(5.6) : m(0.9), L - m(0.9) - EW.doorW];
  const bandA = cab ? m(6.8) : doors[0] + EW.doorW + m(0.25), bandB = doors[1] - m(0.25);
  const w = m(2.25), pitch = m(2.85);
  const k = Math.floor((bandB - bandA - m(0.4) - w) / pitch) + 1, x0 = (bandA + bandB - (k - 1) * pitch - w) / 2;
  const wins = seq(x0, pitch, k);
  return single(c, {
    roof: EW.roof, sill: EW.sill, nose: NOSE_EWBT, base: EW.grey, trucks: [L / 2 - m(9.5), L / 2 + m(9.5)], end: 0.6,
    paint: (L) => {
      let s = bands(L, [[EW.roof - m(0.45), 6, "#5c6166"], [0, m(1.28), "#3d4247"]]);
      if (kind === "A") s += rect(-1, EW.roof - m(0.62), L + 2, m(0.15), SBB.red);
      s += rect(bandA, EW.bandY, bandB - bandA, EW.bandH, kind === "WR" ? SBB.red : SBB.black);
      for (const x of wins) s += pane(x, EW.winY, w, EW.winH, 0.4);
      if (cab) s += path(`M-1 0L${n(m(2.5))} 0L${n(m(2.5))} ${n(m(3.62))}L-1 ${n(m(3.62))}Z`, SBB.red) + path(poly([[m(0.4), m(2.5)], [m(0.8), m(3.5)], [m(2.6), m(3.5)], [m(2.6), m(2.5)]]), SBB.black) +
        rect(-1, m(3.62), m(3.6), 4, "#5c6166") + rect(m(2.7), m(2.35), m(0.75), m(1.05), SBB.black, 0, 'rx="0.3"') + rect(m(4.0), m(1.85), m(1.6), m(1.1), SBB.red);
      return s;
    },
    cab: () => path(poly([[m(0.5), m(2.6)], [m(0.85), m(3.4)], [m(1.4), m(3.4)], [m(1.4), m(2.6)]]), C.glass) + win(m(2.8), m(2.45), m(0.55), m(0.85), 0.3) +
      rect(m(0.25), m(1.4), 0.7, 0.4, "#fff6d8", 0.3, 'rx="0.12"') + buffers(0, -1, { end: 0.9 }) +
      mark(c, m(5.6) + EW.doorW / 2, m(2.2), BIKE),
    extra: (cc, L) => {
      let s = "";
      for (const x of doors) {
        s += rect(x, m(0.7), EW.doorW, m(2.2), cab && x === doors[0] ? EW.grey : SBB.red, 0.6, 'rx="0.12"') + win(x + EW.doorW / 2 - m(0.17), m(1.75), m(0.34), m(0.85), 0.4);
        if (cls) { const sx = x === doors[0] && !cab ? x - m(0.22) - 0.05 : x + EW.doorW + 0.05; s += rect(sx, m(2.05), m(0.22), m(0.8), SBB.blue) + say(cc, sx + m(0.11), m(2.62), m(0.15), cls, "#ffffff", { weight: 700 }); }
        if (cls === "1") s += rect(x - m(0.05), EW.bandY + EW.bandH + m(0.05), EW.doorW + m(0.1), m(0.08), SBB.yellow);
      }
      s += sbbLogo(cc, cab ? m(7.4) : m(3.2), m(1.5), m(0.36)) + hatch(L - m(4.6), m(1.3), m(0.95), m(0.3));
      if (!c.coupledL && !cab) s += buffers(0, -1);
      if (!c.coupledR) s += buffers(L, 1);
      return s + hvac(L / 2 - 6, EW.roof - 0.05, 12, 0.55);
    },
  });
}

// ---------- EC coaches (Apm 61, Bpm 61, WRm 61) ----------
// SBB's EuroCity coaches (1989-1991, refitted): 26.4 m on the EW IV's
// trucks, a single plug door a side at each end. Their paint (photographs,
// Apm 61 85 10-90 241 and Bpm 61 85 20-90 232 at Singen, 2024): white; the
// windows in a black band; at each end a red block from the band's top to
// its foot over the door and the end window; the class numeral in white on
// a blue strip at the car's end; first class a yellow band over the red;
// dark gray along the bottom. The restaurant car (WRm 61): no recent
// photograph found, drawn in the same paint without the red blocks' class
// strips.
const EC = { roof: m(4.05), sill: m(1.0), bandY: m(1.72), bandH: m(1.2), winY: m(1.84), winH: m(0.98), doorW: m(0.85) };
function ecCar(c, kind) {
  const L = c.L, cls = kind === "A" ? "1" : kind === "B" ? "2" : null;
  const doors = [m(0.95), L - m(0.95) - EC.doorW];
  const w = kind === "A" ? m(1.65) : m(1.2), pitch = kind === "A" ? m(2.05) : m(1.45);
  const a = m(3.3), bb = L - m(3.3);
  const k = Math.floor((bb - a - w) / pitch) + 1, x0 = (a + bb - (k - 1) * pitch - w) / 2, wins = seq(x0, pitch, k);
  return single(c, {
    roof: EC.roof, sill: EC.sill, base: SBB.white, trucks: [L / 2 - m(9.5), L / 2 + m(9.5)], end: 0.6,
    paint: (L) => {
      let s = bands(L, [[EC.roof - m(0.45), 6, "#5c6166"], [0, m(1.28), "#3d4247"]]);
      s += rect(a - m(0.2), EC.bandY, bb - a + m(0.4), EC.bandH, SBB.black);
      for (const x of wins) s += pane(x, EC.winY, w, EC.winH, 0.4);
      if (cls) for (const x of [m(0.6), L - m(3.4)]) {
        s += rect(x, EC.bandY - 0.1, m(2.8), EC.bandH + m(0.3), SBB.red) + pane(x + (x < L / 2 ? m(1.45) : m(0.35)), EC.winY, m(0.8), EC.winH, 0.35);
        if (cls === "1") s += rect(x, EC.bandY + EC.bandH + m(0.2), m(2.8), m(0.22), SBB.yellow);
      }
      return s;
    },
    extra: (cc, L) => {
      let s = "";
      for (const x of doors) {
        s += rect(x, m(0.62), EC.doorW, m(2.3), "none", 0.6, 'rx="0.12"') + win(x + EC.doorW / 2 - m(0.17), m(1.85), m(0.34), m(0.8), 0.4);
        if (cls) { const sx = x < L / 2 ? m(0.35) : L - m(0.57); s += rect(sx, m(1.7), m(0.22), m(1.25), SBB.blue) + say(cc, sx + m(0.11), m(2.62), m(0.18), cls, "#ffffff", { weight: 700 }); }
      }
      s += sbbLogo(cc, m(4.0), m(1.5), m(0.3)) + hatch(L / 2 - m(0.5), m(1.28), m(0.75), m(0.35));
      if (!c.coupledL) s += buffers(0, -1);
      if (!c.coupledR) s += buffers(L, 1);
      return s + hvac(L / 2 - 6, EC.roof - 0.05, 12, 0.55);
    },
  });
}

// ---------- IR-Dosto (RABe 512) and Regio-Dosto (RABe 511) ----------
// Stadler's KISS double-deck units for SBB: the RABe 512 IR-Dosto (2021-
// 2026, six cars, 151.9 m; its cars Bt2, B3, AB4, A5, B6, Bt1, as the
// formation service lists them) and the RABe 511 Regio-Dosto (2012-2018,
// six cars Bt, AB, B, B, AB, Bt; four-car RABe 511.1 for long distance);
// 4.6 m tall; each car on two trucks, the low lower deck between them;
// double sliding doors at each end of the lower deck. The paint (photographs,
// 512 032 at Sargans 2025, IR-Dosto at speed 2025): light gray-white; the
// nose red from the roof down round the black windshield to the coupler,
// the cab side white; each window black-framed on its own; red doors with
// the blue class plate above them; SBB's flag between the decks. Drawn
// alike (the 511's nose is rounder; not separately photographed here).
const KS = { roof: m(4.6), sill: m(1.25), low: m(0.4), upY: m(3.15), upH: m(0.78), upW: m(1.15), upP: m(1.55), loY: m(1.15), loH: m(0.85), loW: m(1.2), loP: m(1.6), doorW: m(1.3), grey: "#e4e5e3" };
const NOSE_KS = [[m(0.75), m(0.45)], [m(0.15), m(0.7)], [m(0.05), m(1.3)], [m(0.25), m(2.3)], [m(1.35), m(3.95)], ["q", m(1.75), m(4.55), m(2.6), m(4.6)]];
const KS_CARS = { Bt: { cab: true, cls: "2" }, B: { cls: "2" }, AB: { cls: "12" }, A: { cls: "1" } };
function ksCar(c, kind) {
  const L = c.L, o = KS_CARS[kind], cab = o.cab && c.cabL;
  const trucks = cab ? [m(3.6), L - m(2.6)] : [m(2.6), L - m(2.6)];
  const d1 = cab ? m(5.6) : m(4.6), d2 = cab ? m(14.6) : L - m(4.6) - KS.doorW;
  const drop = { a: d1 - m(0.3), b: d2 + KS.doorW + m(0.3), y: KS.low };
  const lows = winsFrom(d1 + KS.doorW + m(0.45), d2 - m(0.35), KS.loW, KS.loP);
  const ups = winsFrom(d1 - m(0.4), d2 + KS.doorW + m(0.4), KS.upW, KS.upP);
  const ends = cab ? [[m(17.2), m(0.55)], [m(18.3), m(0.55)], [L - m(3.0), m(0.9)]] : [[m(1.2), m(0.9)], [L - m(2.1), m(0.9)]];
  return bilevel(c, {
    roof: KS.roof, sill: KS.sill, cornerR: 1.3, end: 0.5, noTrucks: true, drop, badge: false, base: KS.grey,
    nose: cab ? NOSE_KS : null, cabLen: 0, rows: [], doors: [], diaphragm: [KS.sill + 0.3, KS.roof - 1.6],
    paint: () => {
      let s = bands(L, [[KS.roof - m(0.3), 6, "#9aa0a6"], [0, m(1.35), "#55595e"]]);
      for (const x of ups) s += pane(x, KS.upY, KS.upW, KS.upH, 0.45);
      for (const x of lows) s += pane(x, KS.loY, KS.loW, KS.loH, 0.45);
      for (const [x, w] of ends) s += pane(x, m(2.35), w, m(0.75), 0.35);
      if (cab) s += path(`M-1 0L${n(m(1.6))} 0L${n(m(1.6))} ${n(m(1.3))}Q${n(m(2.1))} ${n(m(1.6))} ${n(m(2.2))} ${n(m(2.4))}L${n(m(2.45))} ${n(m(4.2))}L${n(m(3.0))} 16L-1 16Z`, SBB.red) +
        path(poly([[m(0.22), m(2.2)], [m(1.3), m(3.95)], [m(2.15), m(4.0)], [m(2.0), m(2.25)]]), SBB.black) + rect(m(3.0), m(2.45), m(0.95), m(1.25), SBB.black, 0, 'rx="0.5"');
      return s;
    },
    extra: (cc) => {
      let s = trucks.map((x) => truck(x, { wb: m(2.5), d: 36.2, top: KS.sill })).join("") + underframe(drop.a + 1.5, drop.b - 1.5, KS.low + 0.05, { depth: 0.5, boxes: 3, tanks: false });
      for (const x of [d1, d2]) {
        s += rect(x, m(0.42), KS.doorW, m(2.2), SBB.red, 0.6) + line(x + KS.doorW / 2, m(0.42), x + KS.doorW / 2, m(2.62), "currentColor", 0.5) +
          win(x + m(0.15), m(1.1), m(0.32), m(1.15), 0.4) + win(x + KS.doorW - m(0.47), m(1.1), m(0.32), m(1.15), 0.4);
        s += rect(x, m(2.66), KS.doorW, m(0.22), SBB.blue);
        const lab = o.cls === "12" ? (x === d1 ? "1" : "2") : o.cls;
        s += say(cc, x + KS.doorW * 0.3, m(2.77), m(0.14), lab, "#ffffff", { weight: 700 }) + say(cc, x + KS.doorW * 0.7, m(2.77), m(0.14), lab, "#ffffff", { weight: 700 });
      }
      if (cab) s += path(poly([[m(0.4), m(2.35)], [m(1.35), m(3.85)], [m(1.95), m(3.85)], [m(1.85), m(2.35)]]), C.glass) + win(m(3.1), m(2.6), m(0.75), m(0.95), 0.4) + rect(m(0.12), m(1.35), 0.6, 0.45, "#fff6d8", 0.3, 'rx="0.15"') +
        rect(0.05, 2.5, m(0.8), 0.6, "currentColor", 0, 'opacity="0.85"') + hatch(m(20.5), m(0.75), m(1.6), m(1.4)) + grille(m(20.8), m(0.95), m(0.5), m(0.8));
      s += sbbLogo(cc, cab ? m(7.1) : m(6.0), m(2.95), m(0.28));
      if (kind === "Bt" || kind === "AB") s += pantograph(L / 2, KS.roof - 0.05, { up: !cc.lead, facing: -1 }) + hvLine(L / 2 + 3, L / 2 + 8, KS.roof - 0.05);
      return s + hvac(m(1.2), KS.roof - 0.05, 8, 0.5);
    },
    cab: null,
  });
}

// ===================== Types, models, fleets =====================
// Each type: [key, name, kind, draw, length (m), end car?, amenities].
// An end car (a cab at one end) also gets a "...R" twin drawn facing the
// other way, for the trailing end of a unit or set inside a train (two
// FV-Dostos coupled, cab to cab; a set's cab car behind which another set
// runs); at the train's last place consist.js turns the plain one round.
const LIST = [
  ["chsbbRe460", "Re 460 locomotive", "electric", re460, 18.5],
  ["chsbbIcAD", "IC2000 first-class coach with business zone (AD)", "coach", (c) => icCoach(c, "AD"), 26.8, false, ["first"]],
  ["chsbbIcA", "IC2000 first-class coach (A)", "coach", (c) => icCoach(c, "A"), 26.8, false, ["first"]],
  ["chsbbIcWRB", "IC2000 restaurant car (WRB)", "coach", (c) => icCoach(c, "WRB"), 26.8, false, ["dining"]],
  ["chsbbIcBR", "IC2000 bistro car (BR)", "coach", (c) => icCoach(c, "BR"), 26.8, false, ["dining"]],
  ["chsbbIcB", "IC2000 second-class coach (B)", "coach", (c) => icCoach(c, "B"), 26.8],
  ["chsbbIcBt", "IC2000 family cab car (Bt)", "coach", (c) => icCoach(c, "Bt"), 26.8, true],
  ["chsbbEwA", "EW IV first-class coach (A)", "coach", (c) => ewCar(c, "A"), 26.4, false, ["first"]],
  ["chsbbEwB", "EW IV second-class coach (B)", "coach", (c) => ewCar(c, "B"), 26.4],
  ["chsbbEwBt", "EW IV cab car (Bt)", "coach", (c) => ewCar(c, "Bt"), 26.4, true],
  ["chsbbEcA", "EC first-class coach (Apm)", "coach", (c) => ecCar(c, "A"), 26.4, false, ["first"]],
  ["chsbbEcB", "EC second-class coach (Bpm)", "coach", (c) => ecCar(c, "B"), 26.4],
  ["chsbbEcWR", "EC restaurant car (WRm)", "coach", (c) => ecCar(c, "WR"), 26.4, false, ["dining"]],
  ["chsbbFvADt", "FV-Dosto end car, first class and luggage (ADt)", "emu", (c) => fvCar(c, "ADt"), 25.6, true, ["first"]],
  ["chsbbFvAt", "FV-Dosto first-class end car (At)", "emu", (c) => fvCar(c, "At"), 25.6, true, ["first"]],
  ["chsbbFvABt", "FV-Dosto end car, first and second class (At)", "emu", (c) => fvCar(c, "ABt"), 25.6, true, ["first"]],
  ["chsbbFvA", "FV-Dosto first-class car (A)", "emu", (c) => fvCar(c, "A"), 24.9, false, ["first"]],
  ["chsbbFvWRB", "FV-Dosto restaurant car (WRB)", "emu", (c) => fvCar(c, "WRB"), 24.9, false, ["dining"]],
  ["chsbbFvB", "FV-Dosto second-class car (B)", "emu", (c) => fvCar(c, "B"), 24.9],
  ["chsbbFvBt", "FV-Dosto second-class end car (Bt)", "emu", (c) => fvCar(c, "Bt"), 25.6, true],
  ["chsbbFvBtFam", "FV-Dosto second-class end car with family zone (Bt)", "emu", (c) => fvCar(c, "Bt"), 25.6, true],
  ...Object.keys(GI_CARS).map((k) => [`chsbbGi${k}`, `Giruno ${{ Bt1: "second-class end car (Bt)", B8: "second-class car with family zone (B)", WR6: "restaurant car (WR)", A3: "first-class car with business zone (A)", At2: "first-class end car (At)" }[k] || (GI_CARS[k].cls === "1" ? "first-class car (A)" : "second-class car (B)")}`,
    "emu", (c) => giCar(c, k), GI_CARS[k].cab ? 22.25 : 17.5, !!GI_CARS[k].cab, GI_CARS[k].cls === "1" ? ["first"] : GI_CARS[k].wr ? ["dining"] : undefined]),
  ...Object.keys(ICN_CARS).map((k) => [`chsbbIcn${k}`, `ICN ${{ Bt1: "second-class end car (Bt)", Bt2: "second-class end car (Bt)", B7: "second-class car (B)", B3: "second-class car (B)", AD6: "first-class car with luggage room (AD)", A5: "first-class car (A)", WRA4: "restaurant car with first class (WRA)" }[k]}`,
    "emu", (c) => icnCar(c, k), ICN_CARS[k].cab ? 27.19 : 26.86, !!ICN_CARS[k].cab, ICN_CARS[k].cls === "1" ? (ICN_CARS[k].wr ? ["first", "dining"] : ["first"]) : undefined]),
  ...Object.keys(AS_CARS).map((k) => [`chsbbAs${k}`, `Astoro ${{ At1: "first-class end car (At)", A7: "first-class car (A)", WRA6: "bistro car with first class (WRA)", B5: "second-class car (B)", B4: "second-class car (B)", B3: "second-class car (B)", Bt2: "second-class end car (Bt)" }[k]}`,
    "emu", (c) => asCar(c, k), AS_CARS[k].cab ? 28.2 : 26.2, !!AS_CARS[k].cab, AS_CARS[k].cls === "1" ? (AS_CARS[k].wr ? ["first", "dining"] : ["first"]) : undefined]),
  ["chsbbKsBt", "IR-Dosto (RABe 512) end car (Bt)", "emu", (c) => ksCar(c, "Bt"), 26.25, true],
  ["chsbbKsB", "IR-Dosto (RABe 512) second-class car (B)", "emu", (c) => ksCar(c, "B"), 24.85],
  ["chsbbKsAB", "IR-Dosto (RABe 512) car with first and second class (AB)", "emu", (c) => ksCar(c, "AB"), 24.85, false, ["first"]],
  ["chsbbKsA", "IR-Dosto (RABe 512) first-class car (A)", "emu", (c) => ksCar(c, "A"), 24.85, false, ["first"]],
  ["chsbbRdBt", "Regio-Dosto (RABe 511) end car (Bt)", "emu", (c) => ksCar(c, "Bt"), 26.25, true],
  ["chsbbRdB", "Regio-Dosto (RABe 511) second-class car (B)", "emu", (c) => ksCar(c, "B"), 24.85],
  ["chsbbRdAB", "Regio-Dosto (RABe 511) car with first and second class (AB)", "emu", (c) => ksCar(c, "AB"), 24.85, false, ["first"]],
];
const TI610 = ["itEtr610Cab1", "itEtr610First", "itEtr610Rest", "itEtr610Second", "itEtr610Cab2"];
const END = new Set([...LIST.filter((x) => x[5]).map((x) => x[0]), "itEtr610Cab1", "itEtr610Cab2"]);
export const TYPES = {}, MODELS = {};
// Trenitalia's ETR 610 cars under trenitalia.cars.js's own keys (the same
// drawings whichever file registers them first); its end cars with their
// cab wherever they run, and turned round ("R") as the others.
for (const key of TI610) {
  const model = TI_MODELS[key], end = key.endsWith("Cab1") || key.endsWith("Cab2");
  TYPES[key] = { ...TI_TYPES[key] };
  MODELS[key] = end ? { ...model, draw: (c) => model.draw({ ...c, cabL: true }) } : model;
  if (end) {
    TYPES[`${key}R`] = { ...TI_TYPES[key] };
    MODELS[`${key}R`] = { len: model.len, oneEnd: false, variant: null,
      draw: (c) => `<g transform="matrix(-1 0 0 1 ${n(c.L)} 0)">${model.draw({ ...c, cabL: true, cabR: false, lead: false, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: c.coupledL })}</g>` };
  }
}
for (const [key, name, kind, draw, len, end, amenities] of LIST) {
  const type = { name, kind, ...(amenities ? { amenities } : {}), ...(kind === "coach" && end ? { cab: true } : {}) };
  // An end car always has its cab, wherever it runs (consist.js gives a
  // multiple unit's cab only at the train's ends).
  const drawn = end ? (c) => draw({ ...c, cabL: true }) : draw;
  TYPES[key] = type;
  MODELS[key] = { draw: drawn, len: m(len), oneEnd: !!end, variant: null };
  if (end) {
    TYPES[`${key}R`] = { ...type };
    MODELS[`${key}R`] = { len: m(len), oneEnd: false, variant: null,
      draw: (c) => `<g transform="matrix(-1 0 0 1 ${n(c.L)} 0)">${draw({ ...c, cabL: true, cabR: false, lead: false, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: c.coupledL })}</g>` };
  }
}

// ---------- Vehicles by number ----------
// The European Vehicle Numbers, from SBB's own register (data.sbb.ch
// "rollmaterial", July 2026), as 12-digit numbers. Coaches and locomotives
// by their series' ranges; a multiple unit's cars carry the unit's series
// and number with the car's place in the fifth digit (94 85 1 502 017-0 is
// unit 502 017's car 1; the unit itself is 94 85 0 502 017), so each place
// gets its own range.
const R = (from, to, key) => [Number(from), Number(to), key];
// [series prefix (digits 1-4), series (6-8), [place: key], serial ranges].
const MU = [
  // RABDe 502 IC 200 (001-023): ADt, Bt (the family car), B, B, B, WRB, A, A.
  ["9485", "502", { 1: "chsbbFvADt", 2: "chsbbFvBtFam", 3: "chsbbFvB", 4: "chsbbFvB", 5: "chsbbFvB", 6: "chsbbFvWRB", 7: "chsbbFvA", 8: "chsbbFvA" }, [[1, 99]]],
  // RABe 502 IR 200 (201-230): At, Bt, B x4, A, A.
  ["9485", "502", { 1: "chsbbFvAt", 2: "chsbbFvBt", 3: "chsbbFvB", 4: "chsbbFvB", 5: "chsbbFvB", 6: "chsbbFvB", 7: "chsbbFvA", 8: "chsbbFvA" }, [[200, 299]]],
  // RABe 502 IR 100 (401-409): At (first and second class), Bt, B, B.
  ["9485", "502", { 1: "chsbbFvABt", 2: "chsbbFvBt", 3: "chsbbFvB", 4: "chsbbFvB" }, [[400, 499]]],
  // RABe 501 Giruno: 0xx the second-class half, 2xx the first-class half.
  ["9385", "501", { 1: "chsbbGiBt1", 2: "chsbbGiB11", 3: "chsbbGiB10", 4: "chsbbGiB9", 5: "chsbbGiB8" }, [[0, 199]]],
  ["9385", "501", { 1: "chsbbGiAt2", 2: "chsbbGiA3", 3: "chsbbGiA4", 4: "chsbbGiA5", 5: "chsbbGiWR6", 6: "chsbbGiB7" }, [[200, 299]]],
  // RABDe 500 ICN (000-043): Bt1, Bt2, B3, WRA4, A5, AD6, B7.
  ["9485", "500", { 1: "chsbbIcnBt1", 2: "chsbbIcnBt2", 3: "chsbbIcnB3", 4: "chsbbIcnWRA4", 5: "chsbbIcnA5", 6: "chsbbIcnAD6", 7: "chsbbIcnB7" }, [[0, 99]]],
  // RABe 503 Astoro (011-022): At1, Bt2, B3, B4, B5, WRA6, A7.
  ["9385", "503", { 1: "chsbbAsAt1", 2: "chsbbAsBt2", 3: "chsbbAsB3", 4: "chsbbAsB4", 5: "chsbbAsB5", 6: "chsbbAsWRA6", 7: "chsbbAsA7" }, [[0, 99]]],
  // RABe 512 IR-Dosto: Bt1, Bt2, B3, AB4, A5, B6.
  ["9485", "512", { 1: "chsbbKsBt", 2: "chsbbKsBt", 3: "chsbbKsB", 4: "chsbbKsAB", 5: "chsbbKsA", 6: "chsbbKsB" }, [[0, 999]]],
  // RABe 511 Regio-Dosto (six cars): Bt1, AB2, B3, B4, AB5, Bt6.
  ["9485", "511", { 1: "chsbbRdBt", 2: "chsbbRdAB", 3: "chsbbRdB", 4: "chsbbRdB", 5: "chsbbRdAB", 6: "chsbbRdBt" }, [[0, 999]]],
];
// The ETR 610s still numbered as such (93 85 5 610 PNN-C: P the car, NN the
// unit): Apmt, Apm, WRAm, Bpm, Bpm, Bpm, Bpmt, drawn as the Astoro's cars.
// SBB's own (units 05, 06, 07, 09, 10, 13, 14 in its register) are drawn
// as Astoros; the others of the series (01-04, 08, 11, 12) are
// Trenitalia's, which the Formation Service names "Apmt-TI(610)" and so
// on (EC 10 and 19, 23 October 2026), drawn in Trenitalia's euroCity
// paint; Trenitalia's Italian-registered second series (93 83 ...) too,
// numbered, it is assumed here, alike (93 83 P 610 ...; no sample seen).
const ETR610 = { 1: "chsbbAsAt1", 2: "chsbbAsA7", 3: "chsbbAsWRA6", 4: "chsbbAsB5", 5: "chsbbAsB4", 6: "chsbbAsB3", 7: "chsbbAsBt2" };
const ETR610_TI = { 1: "itEtr610Cab1", 2: "itEtr610First", 3: "itEtr610Rest", 4: "itEtr610Second", 5: "itEtr610Second", 6: "itEtr610Second", 7: "itEtr610Cab2" };
const SBB610 = [5, 6, 7, 9, 10, 13, 14];
export const FLEETS = {
  sbb: [
    R(918544600000, 918544601189, "chsbbRe460"),                                  // Re 460 000-118
    R(508516940000, 508516941859, "chsbbIcA"),                                    // IC2000 A 16-94 000-084, AS 154-185
    R(508586940000, 508586940399, "chsbbIcAD"),                                   // IC2000 AD 86-94 000-039
    R(508526940000, 508526941489, "chsbbIcB"),                                    // IC2000 B 26-94 000-148
    R(508526949000, 508526949399, "chsbbIcBt"),                                   // IC2000 Bt 26-94 900-939
    R(508588940000, 508588940159, "chsbbIcWRB"),                                  // IC2000 WRB 88-94 000-015
    R(508566940000, 508566940259, "chsbbIcBR"),                                   // IC2000 BR 66-94 016-025
    R(508510750000, 508510752189, "chsbbEwA"), R(508510950000, 508510952189, "chsbbEwA"), // EW IV A 10-75/10-95
    R(508581950000, 508581950359, "chsbbEwA"),                                    // EW IV AS 81-95
    R(508521750000, 508521753359, "chsbbEwB"), R(508521950000, 508521953359, "chsbbEwB"), R(508520956000, 508520956399, "chsbbEwB"), // EW IV B
    R(508528949000, 508528949899, "chsbbEwBt"),                                   // EW IV Bt 28-94 900-989
    R(618510902000, 618510902699, "chsbbEcA"),                                    // Apm 61 85 10-90 200-269
    R(618520902000, 618520903549, "chsbbEcB"),                                    // Bpm 61 85 20-90 200-354
    R(618588940000, 618588942019, "chsbbEcWR"),                                   // WRm 61 85 88-94
    ...MU.flatMap(([pre, ser, cars, serials]) => Object.entries(cars).flatMap(([x, key]) =>
      serials.map(([a, b]) => R(`${pre}${x}${ser}${String(a).padStart(3, "0")}0`, `${pre}${x}${ser}${String(b).padStart(3, "0")}9`, key)))),
    ...Object.entries(ETR610).flatMap(([p, key]) => Array.from({ length: 15 }, (_, u) => R(`93855610${p}${String(u).padStart(2, "0")}0`, `93855610${p}${String(u).padStart(2, "0")}9`, SBB610.includes(u) ? key : ETR610_TI[p]))),
    ...Object.entries(ETR610_TI).map(([p, key]) => R(`9383${p}610000`, `9383${p}610999`, key)),
  ],
};

// ---------- A real formation, car by car ----------
// The Train Formation Service names each vehicle's type as SBB's register
// does ("Re460", "AD(2E)", "WRB(2E)", "Bt(2E)Fam", "A4(LBT/hp)", "B4(LBT)-K",
// "Bt4(GBT/Velo)", "Bpm61(ERA)", "WRm61", "ADt1(502)", "WRB6(502)",
// "Bt2(502)Fam", "Bt1(501)", "WR6(501)", "AD(ICN/GBT)", "WRA(ICN/GBT)",
// "Apmt(610)", "WRA6(503)", "AB4(512)", "Bt511"; samples of 23 October
// 2026) and its EVN. The model string says what kind of car it is; the
// EVN which car of a unit; which way an end car faces follows from its
// neighbours: its own unit's cars (the same unit number) on one side.
const digits = (v) => String(v || "").replace(/\D/g, "");
function byNumber(num) {
  const v = Number(num);
  if (!num || num.length !== 12) return null;
  const hit = FLEETS.sbb.find(([a, b]) => v >= a && v <= b);
  return hit ? hit[2] : null;
}
function byModel(model, num) {
  const md = (model || "").replace(/\s/g, "");
  if (/^Re460/.test(md)) return "chsbbRe460";
  if (/\(2E/.test(md)) {
    const k = md.match(/^[A-Za-z]+/)[0];
    return { AD: "chsbbIcAD", A: "chsbbIcA", AS: "chsbbIcA", WRB: "chsbbIcWRB", BR: "chsbbIcBR", B: "chsbbIcB", Bt: "chsbbIcBt" }[k] || null;
  }
  if (/\(502\)/.test(md)) {
    const k = md.match(/^[A-Za-z]+/)[0], unit = Number(num.slice(8, 11));
    if (k === "Bt") return /Fam/.test(md) ? "chsbbFvBtFam" : "chsbbFvBt";
    if (k === "At" && unit >= 400) return "chsbbFvABt";
    return { ADt: "chsbbFvADt", At: "chsbbFvAt", A: "chsbbFvA", WRB: "chsbbFvWRB", B: "chsbbFvB" }[k] || null;
  }
  const mu = md.match(/^([A-Za-z]+)(\d*)\((501|503)\)/);
  if (mu) { const key = `chsbb${mu[3] === "501" ? "Gi" : "As"}${mu[1]}${mu[2]}`; return TYPES[key] ? key : null; }
  if (/\(610\)/.test(md) && (/-TI/.test(md) || /^9383/.test(num))) return { Apmt: "itEtr610Cab1", Apm: "itEtr610First", WRAm: "itEtr610Rest", Bpmt: "itEtr610Cab2" }[md.match(/^[A-Za-z]+/)[0]] || "itEtr610Second";
  if (/\(610\)/.test(md)) return { Apmt: "chsbbAsAt1", Apm: "chsbbAsA7", WRAm: "chsbbAsWRA6", Bpmt: "chsbbAsBt2", Bpm4: "chsbbAsB5", Bpm5: "chsbbAsB4", Bpm6: "chsbbAsB3" }[md.match(/^[A-Za-z]+\d?/)[0]] || "chsbbAsB4";
  if (/ICN/.test(md)) {
    // The ICN's names leave the place out ("B(ICN/GBT)"): the EVN gives it.
    const key = byNumber(num);
    if (key) return key;
    return { Bt: "chsbbIcnBt1", B: "chsbbIcnB3", AD: "chsbbIcnAD6", A: "chsbbIcnA5", WRA: "chsbbIcnWRA4" }[md.match(/^[A-Za-z]+/)[0]] || null;
  }
  if (/\(512\)/.test(md)) return { Bt: "chsbbKsBt", B: "chsbbKsB", AB: "chsbbKsAB", A: "chsbbKsA" }[md.match(/^[A-Za-z]+/)[0]] || null;
  if (/^[A-Za-z]+511/.test(md)) return { Bt: "chsbbRdBt", B: "chsbbRdB", AB: "chsbbRdAB" }[md.match(/^[A-Za-z]+/)[0]] || null;
  if (/^Bt4/.test(md)) return "chsbbEwBt";
  if (/^A4|^AS4/.test(md)) return "chsbbEwA";
  if (/^B4/.test(md)) return "chsbbEwB";
  if (/^Apm61/.test(md) && !/Pano/.test(md)) return "chsbbEcA";
  if (/^Bpm61/.test(md)) return "chsbbEcB";
  if (/^WRm/.test(md)) return "chsbbEcWR";
  return null;
}
// A multiple unit's own number (its series and serial; a Giruno's two
// halves, 0xx and 2xx, are one unit), or null for a loco-hauled vehicle.
function unitOf(num) {
  if (num.length !== 12 || !/^9[34]8[35]/.test(num)) return null;
  if (num.slice(5, 8) === "610") return `610-${num.slice(2, 4)}-${num.slice(9, 11)}`;
  const ser = num.slice(5, 8), serial = Number(num.slice(8, 11));
  return `${ser}-${ser === "501" ? serial % 200 : serial}`;
}
const LOCO = (key) => key === "chsbbRe460";
export const FORMATION = {
  sbb: (car, i, cars) => {
    const num = digits(car.number);
    const key = byModel(car.model, num) || byNumber(num);
    if (!key || !END.has(key)) return key;
    const prev = cars[i - 1], next = cars[i + 1];
    if (!prev) return key;                       // the front: its cab leads
    if (!next) return key;                       // the back: consist.js turns it round
    const unit = unitOf(num);
    if (unit) return unitOf(digits(next.number)) === unit ? key : `${key}R`;
    // A cab car of a loco-hauled set: its set is on the side where the
    // next locomotive or cab car is nearer.
    const kinds = cars.map((c) => byModel(c.model, digits(c.number)) || byNumber(digits(c.number)));
    let l = 0, r = 0;
    for (let j = i - 1; j >= 0 && !(LOCO(kinds[j]) || END.has(kinds[j])); j--) l++;
    for (let j = i + 1; j < cars.length && !(LOCO(kinds[j]) || END.has(kinds[j])); j++) r++;
    return l <= r ? `${key}R` : key;
  },
};

// ---------- What usually runs ----------
// SBB's annual formation plan for the 2026 timetable (data.sbb.ch
// "jahresformation", the timetable from 14 December 2025): for each train
// number the blocks of vehicles planned on its longest section. Here as
// codes: a multiple unit by letter (G Giruno, F FV-Dosto IC 200, f IR 200,
// h IR 100, A Astoro, T Trenitalia's ETR 610 (its euroCity paint), N ICN, K RABe 512, S RABe 511,
// s four-car RABe 511), a loco-hauled set car by car (L Re 460; IC2000: d
// AD, a A, w WRB, r BR, b B, t Bt; EW IV: e A, u B, v Bt; EC coaches: p Apm,
// q Bpm), space-separated parts in their planned order. Where the plan
// lists several kinds of unit for a train (alternatives on different days),
// the one planned most; at most two units, two loco-hauled sets and two
// add-on groups of coaches.
const PLAN_SETS = ["N N", "K K", "f", "K", "G G", "F", "f f", "f h", "Ldaabbbbbt", "S S", "G", "N", "A A", "A", "Ldaarbbbt", "Laabuuuv", "Lepppquuuv", "Ldaawbbbbt", "Ldabbbbt Ldabbbbt", "Lbaequuuuv", "Ldaawbbbbt euu", "Lbaequuuuv Ldabbbbt", "T", "Ldaawbbbt", "F f", "S", "Laabuuuv uv", "Laabuuuv pqv", "Ldaawbbbt quv", "Leepquuuuv", "Lbaequuuuv uv", "Ldaarbbbt quv", "Ldarbbbt", "F h", "Leepquuuuv Leepquuuuv", "F F", "Ldaawbbbbt pppu", "Ldabbbbt Ldabbbbt equuv equuv", "T T", "Leequuuuv", "Leewuuuv euq", "Ldaawbbbt uv", "h", "Lbaequuuuv Lbaequuuuv e uv", "Ldabbbbt Lbaequuuuv", "Ldabbbbt Ldabbbbt euu", "Laabuuuv uv uv", "Ldarbbbt eeqv", "Ldaabbbbbt uv", "Ldaawbbbt p quv", "Leepquuuuv quv", "Ldaawbbbbt euu euu", "Ldaawbbbbt euq euu", "Ldaawbbbbt pppu euu", "Laabuuuv Laabuuuv", "Ldabbbbt equuv", "s s", "Ldaabbbbbt uv uv", "Ldaawbbbt quv quv", "Ldaarbbbt quuv", "Ldaarbbbt Ldaawbbbt", "Ldaarbbbt Ldaarbbbt", "Lepppquuuv Laabuuuv", "h h", "Ldaawbbbt Ldaawbbbt quv", "Ldaawbbbt Ldaawbbbt quv uv", "Ldaawbbbbt euq", "Ldarbbbt Ldaarbbbt", "Ldaarbbbt quv uv", "Ldabbbbt equuv equuv", "Ldabbbbt Ldabbbbt equuv euu", "Lbaequuuuv Ldabbbbt equuv", "Ldabbbbt Lbaequuuuv equuv", "Lbaequuuuv Ldabbbbt uv", "Lbaequuuuv u uv", "Lbaequuuuv uv uv", "Laabuuuv Laabuuuv pqv", "Leppqquuuv", "Leppqquuuv Leppqquuuv", "Laabuuuv Laabuuuv uv", "Ldaawbbbt Leewuuuv euq quv", "Ldaawbbbt Leewuuuv euq", "Ldaawbbbt Ldaawbbbt quv quv", "Leepquuuuv Leepquuuuv quv", "Ldaarbbbt quv quuv", "Ldarbbbt e quuv", "Leepquuuuv Leepquuuuv quuv", "Ldaawbbbbt equuv equuv", "Ldaawbbbt quv uv", "Ldaarbbbt Lepppquuuv", "Ldaawbbbt Ldaawbbbt", "Ldaawbbbbt euu pppu", "Leppqquuuv Laabuuuv", "Ldaarbbbt euv quv", "Ldaarbbbt e quuv", "Ldaarbbbt Ldaarbbbt quuv", "Ldabbbbt", "Lbaequuuuv Lbaequuuuv", "Ldabbbbt Ldabbbbt equuv", "Lbaequuuuv e uv", "Ldaabbbbbt Ldaabbbbbt", "Laabuuuv Lepppquuuv", "Ldaarbbbt euv uu", "Ldaarbbbt eeqv euv", "Laabuuuv Laabuuuv uv uv", "Leepquuuuv Leepquuuuv uv quv", "Leepquuuuv Lepppquuuv", "Leepquuuuv Ldaarbbbt quuv", "s", "Ldaarbbbt euv quuv", "Laabuuuv Laabuuuv pqv pqv"];
const PLAN = "04040104030401040112010a010a01040104010401040312011201040104010a01040104010a0104010a0112010a0104010a0104030a0104030d010m010m010m010m010d010m010m0d0c010c010c010c010c010c010c010c0r0d010d010d010c010d010c0o0403040g0m010m010m020d0404010a0m0405040b13010c010d010c010d010d010d010d010c010d010c2j0d0b0405044w130m00010001000100010001000100010001000100010001000100010001000100010001000100010001000100010001000100010001000100010001000100010001000100010001000100010001000100080d020a0404010n011d010e010s0104010x011d0114010s010s010x011d01140128010s011m010n010x0129010s011m0104010x0114010n012a010401000114010s0200020d0603070t020t010n011n020c010v010n011e020e010v010c010y010e010e020c010v010e010y012b010v012c012d030v012e010w012z020c012f010c011p011o010t010h010e021p0215010t0a0404040104030401040304010a03040504030a010403040104030a01040404050o0105010o010501020105010301050105010501050105010501050105010301050105010z010z0105010501050105010501050105010501050105010z010o01050105010501050105010o0102011q060g031r080b010n020x010n010001040100010s030n01000104020s012g021s01000300011t010e011s0400011t012h013001030116012i010p010d01030303040k011u010h010h0110010k0110011f011g010k0110010k010h010h011h0110011f011g010k011h010h010h011g0110010k012j011f011h010k010h010h011u010h010h010h010h010k010h0101011i01060102012k010102080e040104030o010a0304010403040104030401040304010403040104030401040304010a010a05050105010501050105010501050105010o01021a0t011v010e022l012m030e010e010e010v0315010e010e010e031w0115011n0131030n011w012n010e020t010e0115011v010y010k010k010e2k132n13240a010a190g010g120g030f011q010g1q0g020g01020i0g020g0o02070a04040104070a050a030a050403020h0b03000100030b010b030b0100030b010003000100030001000300190g0p00010002000100010001000100010001000100010001000100010001000100010001000100010001000100010b0100010b0100010001000100010001000100010b0100010001000100010001000200060b010b010b0100040b0d0b0200010b020b0100010b0o0l020l010i011x010j0117010u0118010i010j011y011z0111010l010i011j010j0117010u0120010i010u01190121010i010l0111012o0122012p01230118010i010j0119010l010i021j020l020j0b01010301030101010101010103010301030103010101030101010301010101010101010101010101010101010101010101010101010101010101010101010101010101021k02010b0i0118011y010j0111010l010i010l010j011x010u0117010i01180119010j010i011z0111010l0122011j01230117010i01200119010u01110121012q010l012r010i010u010u010j010101011m06020o020j06020j0j0e0z020z0b010101010101010101010101010101010101030103010301030103010303030103010301030101010101010101010101010101010101010103010101010101010101030101010102011o0302030101010101030101010301030101010301010103010301030103010301030103010301010103010101030103010101030101010301030103010302030i08010q0108010801080108010q010f012s01080108010q010f010f01080108010q0108010f01080108010q0108010801080108010q02080108010801080108010801080f070209010r010r010r010q010f010r010f010r0102010f010f010f010f01020102010f011a010f010r01020124011a011a010r010r0124011i010f010f010r012t011i013201010101011k01091m03020p020201020101010q010p010p0101010201010101010a010a0101010101010101010a010a01020101011a0101010p010p01010102010f010f010p010p01060102010d010f01010101010a0e071202050203030103010101010101010g010301030201010301030103010301030203010301030103010301030103010301030103010301010101011k0116010301030103010301160101010101070103010101030103040101011l2u010w0102010701070102010201020102010w01020102010201020102010201020102010w0102010701020102010701020107011b0102010201070102011b011r012v01020102020e0a02010201020107010201070102011b0102010601020102010701020107010w010w0107010601020102010701020102011b01070107010201020106010701020102010701070102010201020107010201060j06021c011c0125012601250126011c011c04080108041l011l011l050q0127010801080127012w010801010216031o0b07010o010o01070107010601070109010901070102010601060109010901020102010901090107010701060106010601060106010601090109010201020109010901060106010602060f0b0p0b020b900t020g010g011e052x021e010g010g030y010y022y630901020102010p01060107010901090102010201090106010201090109010201020109010601020109010901020102010901060106010901060102010601090109010601090106010701060109010502090106";
let plan = null;
function planned(number) {
  if (!plan) {
    plan = new Map();
    for (let i = 0, z = 0; i < PLAN.length;) {
      if (PLAN[i] === "~") { z += parseInt(PLAN.slice(i + 1, i + 5), 36); i += 5; } else { z += parseInt(PLAN.slice(i, i + 2), 36); i += 2; }
      plan.set(z, PLAN_SETS[parseInt(PLAN.slice(i, i + 2), 36)]); i += 2;
    }
  }
  return plan.get(Number(number)) || null;
}
const UNITS = {
  G: ["chsbbGiBt1", "chsbbGiB11", "chsbbGiB10", "chsbbGiB9", "chsbbGiB8", "chsbbGiB7", "chsbbGiWR6", "chsbbGiA5", "chsbbGiA4", "chsbbGiA3", "chsbbGiAt2"],
  F: ["chsbbFvADt", "chsbbFvA", "chsbbFvA", "chsbbFvWRB", "chsbbFvB", "chsbbFvB", "chsbbFvB", "chsbbFvBtFam"],
  f: ["chsbbFvAt", "chsbbFvA", "chsbbFvA", "chsbbFvB", "chsbbFvB", "chsbbFvB", "chsbbFvB", "chsbbFvBt"],
  h: ["chsbbFvABt", "chsbbFvB", "chsbbFvB", "chsbbFvBt"],
  A: ["chsbbAsAt1", "chsbbAsA7", "chsbbAsWRA6", "chsbbAsB5", "chsbbAsB4", "chsbbAsB3", "chsbbAsBt2"],
  T: ["itEtr610Cab1", "itEtr610First", "itEtr610Rest", "itEtr610Second", "itEtr610Second", "itEtr610Second", "itEtr610Cab2"],
  N: ["chsbbIcnBt1", "chsbbIcnB7", "chsbbIcnAD6", "chsbbIcnA5", "chsbbIcnWRA4", "chsbbIcnB3", "chsbbIcnBt2"],
  K: ["chsbbKsBt", "chsbbKsB", "chsbbKsAB", "chsbbKsA", "chsbbKsB", "chsbbKsBt"],
  S: ["chsbbRdBt", "chsbbRdAB", "chsbbRdB", "chsbbRdB", "chsbbRdAB", "chsbbRdBt"],
  s: ["chsbbRdBt", "chsbbRdAB", "chsbbRdB", "chsbbRdBt"],
};
const CAR = { L: "chsbbRe460", d: "chsbbIcAD", a: "chsbbIcA", w: "chsbbIcWRB", r: "chsbbIcBR", b: "chsbbIcB", t: "chsbbIcBt", e: "chsbbEwA", u: "chsbbEwB", v: "chsbbEwBt", p: "chsbbEcA", q: "chsbbEcB" };
const NAME = { G: "Giruno", F: "FV-Dosto (IC 200)", f: "FV-Dosto (IR 200)", h: "FV-Dosto (IR 100)", A: "Astoro", T: "Trenitalia's ETR 610", N: "ICN", K: "IR-Dosto (RABe 512)", S: "Regio-Dosto (RABe 511)", s: "IR-Dosto (RABe 511.1)" };
// A set from its plan codes: units and sets in order, each one's last car
// turned round where another follows.
function fromCodes(codes) {
  const parts = codes.split(" ").map((p) => (UNITS[p] ? [...UNITS[p]] : [...p].map((ch) => CAR[ch]).filter(Boolean)));
  const keys = [];
  parts.forEach((part, k) => {
    part.forEach((key, j) => keys.push(j === part.length - 1 && END.has(key) && k < parts.length - 1 ? `${key}R` : key));
  });
  const units = codes.split(" ").filter((p) => UNITS[p]);
  const counted = (list) => [...new Set(list)].map((x) => (list.filter((y) => y === x).length > 1 ? `${list.filter((y) => y === x).length} × ${NAME[x]}` : NAME[x])).join(" + ");
  let label;
  if (units.length) label = counted(units);
  else {
    const all = codes.replace(/ /g, "");
    const ic = /[dawrbt]/.test(all), ew = /[euvpq]/.test(all);
    label = `Re 460 and ${ic && ew ? "IC2000 double-deck and EW IV single-deck coaches" : ic ? "IC2000 double-deck coaches" : "EW IV and EC coaches"}` +
      (/w/.test(all) ? ", restaurant car" : /r/.test(all) ? ", bistro car" : "");
  }
  return { label: `${label} (SBB's 2026 plan for this train)`, units: keys.map((k) => [k, 1]) };
}
// By line, for a train the plan doesn't name: what the plan gives most of
// that line's trains.
const LINE = { "IC 1": "F", "IC 2": "G G", "IC 21": "G G", "IC 3": "Ldaawbbbt", "IC 5": "N N", "IC 51": "N N", "IC 6": "Ldaarbbbt", "IC 61": "Ldaarbbbt",
  "IC 8": "Ldaawbbbbt", "IC 81": "Ldaawbbbbt", "IR 13": "S S", "IR 15": "f", "IR 16": "Laabuuuv", "IR 17": "K K", "IR 26": "f h", "IR 27": "f", "IR 35": "K",
  "IR 36": "K", "IR 37": "K K", "IR 46": "N", "IR 55": "K K", "IR 57": "N", "IR 70": "f f", "IR 75": "Ldaabbbbbt", "IR 90": "Lbaequuuuv", "IR 95": "Lbaequuuuv" };
const BY_KEY = Object.fromEntries(Object.entries(UNITS).filter(([k]) => k !== "T").flatMap(([code, keys]) => keys.map((key) => [key, code])));
export const TYPICAL = {
  sbb: (t, reported) => {
    const p = planned(t.number);
    if (p) return fromCodes(p);
    // A car reported: its unit, or (a coach or locomotive shown alone, on
    // the fleet page) a planned set it runs in.
    if (reported && BY_KEY[reported.replace(/R$/, "")]) return fromCodes(BY_KEY[reported.replace(/R$/, "")]);
    if (reported && !t.route) {
      const key = reported.replace(/R$/, "");
      if (UNITS.T.includes(key)) return fromCodes("T");
      const plan = Object.values(LINE).find((codes) => fromCodes(codes).units.some(([k]) => k.replace(/R$/, "") === key));
      if (plan) return fromCodes(plan);
    }
    const r = t.route || "", ends = `${t.origin || ""} ${t.destination || ""}`;
    if (LINE[r]) { const s = fromCodes(LINE[r]); return { ...s, label: s.label.replace("this train", `line ${r}`) }; }
    if (r === "EC") return /München|Bregenz|Lindau|Domodossola|Brig|Genève/.test(ends) ? { ...fromCodes("A"), label: "Usually an Astoro (RABe 503)" } : { ...fromCodes("G"), label: "Usually a Giruno (RABe 501)" };
    if (/^IC/.test(r) && /Lugano|Chiasso|Bellinzona|Locarno/.test(ends)) return { ...fromCodes("G"), label: "Usually a Giruno (RABe 501)" };
    if (/^IC/.test(r) && /Brig|Interlaken/.test(ends)) return { ...fromCodes("Ldaawbbbbt"), label: "Usually a Re 460 and IC2000 double-deck coaches" };
    if (/^IC/.test(r)) return { ...fromCodes("F"), label: "Usually a FV-Dosto (IC 200)" };
    if (/^IR/.test(r)) return { ...fromCodes("f"), label: "Usually a FV-Dosto (IR 200)" };
    return null;
  },
};
// The sets for the drawing harness.
export const SAMPLE_SETS = Object.fromEntries(["G G", "F f", "h f", "A", "N N", "K", "S", "Ldaawbbbbt", "Ldaarbbbt", "Ldaabbbbbt", "Lbaequuuuv", "Laabuuuv pqv", "Lepppquuuv", "Ldabbbbt Ldabbbbt"].map((c) => [c, fromCodes(c)]));

// ---------- Fact sheets ----------
const WP = "https://de.wikipedia.org/wiki/";
const FLEET = "https://data.sbb.ch/explore/dataset/rollmaterial/";
const F_GI = { model: "Stadler SMILE (RABe 501 \"Giruno\")", type: "Electric multiple unit", builder: "Stadler Rail", built: "2017–2026", fleet: "41 for SBB", topSpeedMph: 155, seats: 405, lengthFt: 662.7, source: `${WP}SBB_RABe_501`,
  about: "Eleven-car units for the Gotthard base tunnel and Italy, on the IC 2 and IC 21 to Lugano, the ECs to Milano and beyond, Frankfurt–Milano and, since December 2025, Basel–Hamburg. First class in the four cars at one end, the restaurant car next to them." };
const F_FV = { model: "Bombardier Twindexx Swiss Express (RABDe/RABe 502, \"FV-Dosto\")", type: "Double-deck electric multiple unit", builder: "Bombardier (Alstom)", built: "2017–2022", fleet: "62 (23 IC 200, 30 IR 200, 9 IR 100)", topSpeedMph: 124, lengthFt: 658.1, source: `${WP}SBB_RABe_502`,
  about: "SBB's double-deck long-distance units: the IC 200 (with a restaurant car and family car) on the IC 1 Genève–St. Gallen, the IR 200 and IR 100 on the IR 13, 15, 27 and 70 and on the Gotthard. First class at the end with the A cars." };
const F_ICN = { model: "RABDe 500 (ICN)", type: "Tilting electric multiple unit", builder: "SIG/Fiat, ABB/Adtranz", built: "1999–2005", fleet: "44", topSpeedMph: 124, seats: 447, lengthFt: 619.4, source: `${WP}SBB_RABDe_500`,
  about: "SBB's tilting InterCity trains, the whole of the IC 5 Lausanne–Biel–Zürich–St. Gallen and IC 51 Basel–Biel–Lausanne, usually two or three coupled; being refitted at Yverdon since 2024." };
const F_AS = { model: "Alstom ETR 610 (RABe 503 \"Astoro\")", type: "Tilting electric multiple unit", builder: "Alstom (Savigliano)", built: "2007–2016", fleet: "12 with SBB", topSpeedMph: 155, seats: 430, lengthFt: 614.8, source: "https://en.wikipedia.org/wiki/ETR_610",
  about: "SBB's New Pendolinos, on the EuroCity trains Basel/Genève–Milano over the Simplon and Zürich–München." };
const F_IC = { type: "Double-deck coach", builder: "Schindler/SIG, Adtranz/Bombardier", built: "1997–2004, modernised 2019–2025", topSpeedMph: 124, lengthFt: 87.9, source: `${WP}IC2000` };
const F_EW = { type: "Passenger coach", builder: "SIG, Schindler, FFA", built: "1981–1991, refitted 2018–2023", topSpeedMph: 124, lengthFt: 86.6, source: `${WP}Einheitswagen_(Schweiz,_Normalspur)` };
const F_KS = { model: "Stadler KISS (RABe 512 \"IR-Dosto\")", type: "Double-deck electric multiple unit", builder: "Stadler Rail", built: "2021–2026", topSpeedMph: 99, lengthFt: 498.3, source: `${WP}SBB_RABe_512`,
  about: "Six-car double-deck units on the IR 35, 36, 37 and 55." };
export const FACTS = {
  chsbbRe460: { model: "Re 460 (Lok 2000)", type: "Electric locomotive", builder: "SLM, ABB", built: "1991–1996, refitted 2017–2022", fleet: "119", topSpeedMph: 124, powerHp: 8180, lengthFt: 60.7, source: `${WP}SBB_Re_460`,
    about: "SBB's standard electric locomotive, hauling the IC2000 double-deck and EW IV coaches on the IC 3, 6, 61, 8, 81 and the IR 16, 75, 90 and 95." },
  chsbbIcA: { ...F_IC, model: "IC2000 first-class coach (A)", seats: 86, about: "Upper and lower deck in first class; the modernised cars' doors carry the yellow band." },
  chsbbIcAD: { ...F_IC, model: "IC2000 first-class coach with business zone (AD)", about: "First class with the business zone and a luggage room, next to the locomotive." },
  chsbbIcB: { ...F_IC, model: "IC2000 second-class coach (B)", seats: 126 },
  chsbbIcBt: { ...F_IC, model: "IC2000 family cab car (Bt)", about: "The driving trailer at the end of every IC2000 set, its lower deck a play area since 2012, Globi and the zoo's animals painted on its side." },
  chsbbIcWRB: { ...F_IC, model: "IC2000 restaurant car (WRB)", about: "Restaurant upstairs, bistro below; on the IC 3, IC 8 and IC 81 sets." },
  chsbbIcBR: { ...F_IC, model: "IC2000 bistro car (BR)", about: "Second class upstairs with a bistro below; most IC 6 and IC 61 sets." },
  chsbbEwA: { ...F_EW, model: "EW IV first-class coach (A)", seats: 60 },
  chsbbEwB: { ...F_EW, model: "EW IV second-class coach (B)" },
  chsbbEwBt: { ...F_EW, model: "EW IV cab car (Bt)" },
  chsbbEcA: { ...F_EW, model: "EC first-class coach (Apm 61)", built: "1989–1991" },
  chsbbEcB: { ...F_EW, model: "EC second-class coach (Bpm 61)", built: "1989–1991" },
  chsbbEcWR: { ...F_EW, model: "EW IV restaurant car (WRm 61)", built: "1983–1988" },
  chsbbKsBt: F_KS,
  chsbbRdBt: { ...F_KS, model: "Stadler KISS (RABe 511 \"Regio-Dosto\")", built: "2012–2018", source: `${WP}SBB_RABe_511`, about: "SBB's regional double-deck units, also on the IR 13 and IR 70 with the FV-Dostos." },
};
for (const [key] of LIST) {
  const base = key.startsWith("chsbbGi") ? F_GI : key.startsWith("chsbbFv") ? F_FV : key.startsWith("chsbbIcn") ? F_ICN : key.startsWith("chsbbAs") ? F_AS :
    key.startsWith("chsbbKs") ? F_KS : key.startsWith("chsbbRd") ? FACTS.chsbbRdBt : null;
  if (base && !FACTS[key]) FACTS[key] = { ...base, model: `${base.model}, ${TYPES[key].name.replace(/^[^ ]+( \([^)]*\))? /, "")}` };
}
for (const key of TI610) if (TI_FACTS[key]) FACTS[key] = TI_FACTS[key];
for (const key of Object.keys(TYPES)) if (key.endsWith("R") && FACTS[key.slice(0, -1)]) FACTS[key] = FACTS[key.slice(0, -1)];
