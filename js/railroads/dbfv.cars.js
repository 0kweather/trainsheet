// DB Fernverkehr's trains (scripts/railroads/germany.py, railroad "dbfv"):
// the ICEs (ICE 1, ICE 2, ICE 3, ICE 3neo, ICE T, ICE 4, ICE L), the
// Intercitys (IC2 double-deck sets, the IC coaches with their class 101s and
// cab cars) and the EuroCity-Express trains DB runs with SBB. Trainsheet's own
// side views at the shared scale (js/carart.js), from published dimensions
// (de.wikipedia's pages on each class) and photographs of the trains as they
// run in 2024-2026 (Wikimedia Commons; the comparisons are in the scratch
// folder), each in DB's current paint, lettered here (no logo files).
//
// DB's paint on all of them: light grey-white (Lichtgrau), the traffic-red
// stripe (Verkehrsrot) along the side, the DB mark (red letters in a red-
// edged white box) in the stripe; "ICE" in big, gently leaning slate-grey capitals
// behind the cab of an ICE's end car, in a gap of the stripe; the class
// numeral in white on the black panel at the end of each window band; a
// yellow bar beside the doors of a first-class car (the "1" under it).

import { newId } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, poly, truck, pantograph, slats } from "../carart.js?v=dev";
import { letters, roofCover, panGear, lamp, RED_LAMP } from "./digitraffic.cars.js?v=dev";
import { euroLoco, buffers as uicBuffers } from "./czechia.cars.js?v=dev";
// The IC2's double-deck cars and the class 147.5, as chintl.cars.js draws
// them (the Gäubahn's ICs); guarded, so this file stands without them.
import { TYPES as CHI_TYPES, MODELS as CHI_MODELS } from "./chintl.cars.js?v=dev";
import { iceLogo } from "./icelogo.js?v=dev";

const r2 = (v) => Math.round(v * 100) / 100;
const FT = 3.2808; // feet in a metre
const m = (v) => v * FT;
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
// DB's own typeface (DB Head / DB Sans) where the viewer has it; the ICE
// lettering is a plain, upright, medium-weight grotesque.
const DBFONT = "DB Head, DB Sans, Helvetica Neue, Helvetica, Arial, sans-serif";

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
const M = ([x, y]) => `M${r2(x)} ${r2(y)}`;
const L_ = (pts) => pts.map(([x, y]) => `L${r2(x)} ${r2(y)}`).join("");
const closed = (pts) => M(pts[0]) + smooth(pts) + "Z";

// A body: its outline filled with the base color, the paint (drawn freely,
// clipped to the outline) shaded a little for depth as carmodels.js's bodies
// are, and the outline in the theme's ink.
function shell(d, base, paint) {
  const id = newId();
  const ys = d.match(/-?\d+(\.\d+)?/g).map(Number).filter((_, i) => i % 2 === 1);
  const lo = Math.min(...ys), hi = Math.max(...ys);
  const stop = (o, color, v, fallback) => `<stop offset="${o}" stop-color="${color}" stop-opacity="${fallback}" style="stop-opacity:var(${v},${fallback})"/>`;
  const shade = `<linearGradient id="${id}-s" gradientUnits="userSpaceOnUse" x1="0" y1="${lo}" x2="0" y2="${hi}">` +
    stop(0, "#000", "--car-shade-low", 0.16) + '<stop offset="0.36" stop-color="#000" stop-opacity="0"/>' +
    '<stop offset="0.55" stop-color="#fff" stop-opacity="0"/>' + stop(0.8, "#fff", "--car-shade-high", 0.1) +
    '<stop offset="0.93" stop-color="#fff" stop-opacity="0"/>' + stop(1, "#000", "--car-shade-roof", 0.08) + "</linearGradient>";
  return path(d, base) + `<clipPath id="${id}"><path d="${d}"/></clipPath><defs>${shade}</defs>` +
    `<g clip-path="url(#${id})">${paint}<rect x="-5" y="${lo}" width="240" height="${r2(hi - lo)}" fill="url(#${id}-s)"/></g>` + path(d, "none", 0.8);
}
// The rubber gangway cover between two cars, floor to top; side -1 at the
// left end, 1 at the right.
function gangway(xFace, side, floor, top, fill = C.rubber) {
  const w = 0.8, x = side < 0 ? xFace : xFace - w;
  return rect(x, floor, w, top - floor, fill, 0, 'rx="0.2"') + lines([[x + 0.27, floor + 0.3, x + 0.27, top - 0.3], [x + 0.54, floor + 0.3, x + 0.54, top - 0.3]], "#3a3f45", 0.6);
}
const ends = (c, floor, top, fill) => (c.coupledL ? gangway(0, -1, floor, top, fill) : "") + (c.coupledR ? gangway(c.L, 1, floor, top, fill) : "");
// A body bottom along y from a to b, rising into an arch over each truck
// (centers xs, half-width w, up to y1): points, left to right.
function bottom(a, b, y, xs, w, y1) {
  const pts = [[a, y]];
  for (const x of xs) pts.push([x - w, y], [x - w + 0.6, y1], [x + w - 0.6, y1], [x + w, y]);
  return [...pts, [b, y]];
}
// Glass from x0 to x1 (y0 to y1) in a black surround, divided by thin
// pillars every pitch ft, the sky's reflection in its upper part.
function band(x0, x1, y0, y1, { pitch = 0, fill = "#22262b", r = 0.3, from = x0 + pitch, glass = true, panes = 0 } = {}) {
  let s = rect(x0, y0, x1 - x0, y1 - y0, fill, 0, `rx="${r}"`);
  // Separate panes in the black band: pane wide, every pitch ft from "from".
  if (panes) {
    for (let x = from; x + panes <= x1 - 0.3; x += pitch)
      s += rect(x, y0 + 0.25, panes, y1 - y0 - 0.5, "#2c333b", 0, 'rx="0.35" stroke="#15181b" stroke-width="0.5" vector-effect="non-scaling-stroke"') +
        rect(x + 0.15, y0 + 0.25 + (y1 - y0 - 0.5) * 0.6, panes - 0.3, (y1 - y0 - 0.5) * 0.28, "#3d4752", 0, 'rx="0.15" opacity="0.6"');
    return s;
  }
  if (glass) s += rect(x0 + 0.15, y0 + (y1 - y0) * 0.58, x1 - x0 - 0.3, (y1 - y0) * 0.3, "#3b444e", 0, 'rx="0.12" opacity="0.65"');
  const segs = [];
  if (pitch) for (let x = from; x < x1 - 1.0; x += pitch) segs.push([x, y0 + 0.15, x, y1 - 0.15]);
  return s + lines(segs, "#4a525c", 0.5);
}
// A plug door: its outline in the body and the window in it.
function plugDoor(x, w, y0, y1, { win: [wy0, wy1] = [y0 + (y1 - y0) * 0.45, y1 - 0.6], ww = w * 0.5, ink = "rgba(0,0,0,0.38)", fill = "none", r = 0.25 } = {}) {
  return rect(x, y0, w, y1 - y0, fill, 0, `rx="${r}" stroke="${ink}" stroke-width="0.6" vector-effect="non-scaling-stroke"`) +
    rect(x + (w - ww) / 2, wy0, ww, wy1 - wy0, "#262b31", 0, 'rx="0.2"');
}
// A bicycle pictogram, h ft tall, centered at (x, y).
const bike = (x, y, h, color) => {
  const r = h * 0.28, s = `fill="none" stroke="${color}" stroke-width="${r2(h * 0.07)}"`;
  return `<g transform="translate(${r2(x)} ${r2(y)})"><circle cx="${r2(-h * 0.45)}" cy="${r2(-h * 0.2)}" r="${r2(r)}" ${s}/><circle cx="${r2(h * 0.45)}" cy="${r2(-h * 0.2)}" r="${r2(r)}" ${s}/>` +
    `<path d="M${r2(-h * 0.45)} ${r2(-h * 0.2)}L${r2(-h * 0.1)} ${r2(h * 0.25)}L${r2(h * 0.3)} ${r2(h * 0.25)}L${r2(h * 0.45)} ${r2(-h * 0.2)}M${r2(-h * 0.1)} ${r2(h * 0.25)}L${r2(h * 0.05)} ${r2(-h * 0.2)}L${r2(h * 0.3)} ${r2(h * 0.25)}" ${s}/></g>`;
};
// A car drawn turned end for end (a cab car at the right).
const mirror = (c, draw) => `<g transform="matrix(-1 0 0 1 ${r2(c.L)} 0)">${draw({ ...c, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: c.coupledL, cabL: c.cabR, cabR: c.cabL })}</g>`;

// ---------- DB's marks ----------
const DB = { white: "#eceef0", red: "#ec0016", band: "#22262b", ice: "#87929d", skirt: "#cfd3d7", seam: "rgba(0,0,0,0.26)", yellow: "#ffd200", roof: "#c4c9ce" };
// The DB mark: "DB" in red in a red-edged white rounded box, h ft tall.
export const dbMark = (c, x, y, h) => rect(x - h * 0.7, y - h / 2, h * 1.4, h, "#ffffff", 0, `rx="${r2(h * 0.16)}" stroke="${DB.red}" stroke-width="${r2(h * 0.1)}"`) +
  letters(c, x, y - h * 0.02, h * 0.72, "DB", DB.red, { weight: 800, spacing: -0.03 * h, family: SANS });
// "ICE" on the ICE 3s, 4s, Ts and Ls: the ICE logo (icelogo.js), caps h ft
// tall, centered at (x, y).
export const iceWord = (c, x, y, h, fill = DB.ice) => iceLogo(c, x, y, h, fill);
// The ICE 1 and 2 power cars (and the restaurant car's faded "ICE") still
// carry the older lettering: thin, narrow, upright capitals (401 578 at
// Leipzig 2025, 402 021 at Ostbahnhof 2025), not the leaning logo.
export const iceText = (c, x, y, h, fill, { weight = 400, stretch = 0.74, spacing = 0.06 } = {}) => {
  const fs = h / 0.72;
  return `<g transform="translate(${r2(x)} ${r2(y)}) scale(${r2((c.mirrored ? -1 : 1) * stretch)} -1)"><text y="${r2(fs * 0.36)}" font-size="${r2(fs)}" text-anchor="middle" ` +
    `font-weight="${weight}" letter-spacing="${r2(spacing * h)}" font-family="${DBFONT}" fill="${fill}">ICE</text></g>`;
};
// The class panel at the end of a window band: the black glass with the
// white numeral (and the small seat-number line under it).
const classPanel = (c, x, y0, y1, cls) => cls ? letters(c, x, y0 + (y1 - y0) * 0.66, (y1 - y0) * 0.38, cls, "#ffffff", { weight: 600, family: DBFONT }) +
  lines([[x - 0.35, y0 + (y1 - y0) * 0.24, x + 0.35, y0 + (y1 - y0) * 0.24], [x - 0.35, y0 + (y1 - y0) * 0.13, x + 0.35, y0 + (y1 - y0) * 0.13]], "rgba(255,255,255,0.5)", 0.5) : "";
// The first class's yellow bar beside a door, from y0 to y1.
const yellowBar = (x, y0, y1, w = 0.42) => rect(x, y0, w, y1 - y0, DB.yellow);

// ===================== ICE 4 (class 412) =====================
// Siemens ICE 4 (2017-2024): end cars 29.11 m over the couplers, the others
// 28.75 m, 4.1 m high, trucks 19.5 m apart (de.wikipedia "DB-Baureihe
// 412"); powered trucks (2.6 m wheelbase) under the powercars, trailing ones
// (2.3 m) under the rest, 920 mm wheels; a plug door at each end of each
// car. 50 twelve-car sets (Tz 9001-9050), 50 thirteen-car (9451-9500), 37
// seven-car (9201-9237).
// Paint (Berlin Südkreuz 2026-04-04, Tz 9022 side-on; Hamburg Hbf 2026-08-
// 15; Frankfurt Süd 2026): the stripe low on the side, sweeping down along
// the nose to its tip; one long black window band; behind the cab door a
// black window shape running forward to a point, "ICE" under it in the
// stripe's gap; the class panel at each end of the band (white "1" or "2");
// the yellow bar beside each first-class door, high up; the DB mark in the
// stripe mid-car and on the nose.
const I4 = { roof: 12.7, midRoof: 13.5, skirt: 1.8, arch: 3.25, bandLo: 6.9, bandHi: 9.45, redLo: 5.2, redHi: 6.0, doorLo: 3.05, doorHi: 11.25, doorW: 3.15, wheel: 36.2 };
const i4Stripe = (a, b, mark) => mark == null ? rect(a, I4.redLo, b - a, I4.redHi - I4.redLo, DB.red)
  : rect(a, I4.redLo, mark - 1.15 - a, I4.redHi - I4.redLo, DB.red) + rect(mark + 1.15, I4.redLo, b - mark - 1.15, I4.redHi - I4.redLo, DB.red);
// A door: a grey edge, its window; the first class's yellow bar on the
// side toward the seats (side -1 left of the door, 1 right).
// The first class's mark (München 2025, Südkreuz 2026): a yellow bar
// beside the door from its top down to the window band, the black "1" in
// its foot.
const i4Door = (c, x, first, side) => {
  const bx = side < 0 ? x - 0.62 : x + I4.doorW + 0.2;
  return plugDoor(x, I4.doorW, I4.doorLo, I4.doorHi, { win: [6.95, 10.45], ww: 1.6, ink: "rgba(30,33,37,0.85)" }) +
    (first ? yellowBar(bx, I4.bandHi - 0.35, I4.doorHi - 0.15, 0.48) + letters(c, bx + 0.24, I4.bandHi - 0.02, 0.42, "1", "#22262b", { weight: 700, family: DBFONT }) : "");
};
// The Ruhebereich's mark over a first-class end car's class panel: a
// finger to the lips and "Psst", in thin dark lines.
const psst = (c, x, y) => path(`M${r2(x - 0.55)} ${r2(y - 0.6)}L${r2(x - 0.55)} ${r2(y + 0.1)}Q${r2(x - 0.5)} ${r2(y + 0.45)} ${r2(x - 0.25)} ${r2(y + 0.45)}L${r2(x - 0.05)} ${r2(y + 0.45)}` +
  `M${r2(x - 0.3)} ${r2(y - 0.6)}L${r2(x - 0.3)} ${r2(y + 0.75)}M${r2(x - 0.55)} ${r2(y + 0.5)}Q${r2(x - 0.75)} ${r2(y + 0.85)} ${r2(x - 0.6)} ${r2(y + 1.1)}`, "none", 0,
  'stroke="#3a4047" stroke-width="0.7" stroke-linecap="round" vector-effect="non-scaling-stroke"') + letters(c, x + 0.35, y + 0.55, 0.42, "Psst", "#3a4047", { weight: 400, family: SANS });
// The Wi-Fi mark on the band between two windows.
const wifi = (x, y, h) => [0.9, 0.6, 0.3].map((k) => path(`M${r2(x - h * k * 0.6)} ${r2(y + h * k * 0.35)}Q${r2(x)} ${r2(y + h * k * 0.95)} ${r2(x + h * k * 0.6)} ${r2(y + h * k * 0.35)}`, "none", 0,
  `stroke="#8b939c" stroke-width="0.8" stroke-linecap="round" vector-effect="non-scaling-stroke"`)).join("") + circle(x, y, h * 0.08, "#8b939c");
// The lower side: a light grey skirt with its panel joints.
const i4Skirt = (L, xs) => rect(-1, 0, L + 2, 3.45, DB.skirt) + line(-1, 3.45, L + 1, 3.45, "rgba(0,0,0,0.16)", 0.5) +
  lines(xs.map((x) => [x, 0.5, x, 3.4]), "rgba(0,0,0,0.14)", 0.5);
const i4Trucks = (list) => list.map(([x, p]) => truck(x, { wb: p ? 8.53 : 7.55, d: I4.wheel, top: I4.arch })).join("");
// The pantograph on a powercar's roof, in a shallow well between fairings.
const i4Pan = (x, R, up) => roofCover(x - 9.5, R, 5.2, 0.32, DB.roof, 1) + roofCover(x + 4.3, R, 5.2, 0.32, DB.roof, 1) +
  rect(x - 4.3, R - 0.05, 8.6, 0.2, "#9aa1a9", 0.3) + pantograph(x, R + 0.1, { up, facing: -1 }) + panGear(x, R + 0.1, 1);

// A middle car, 28.75 m. o.cls "1"/"2"; o.pan; o.power (powered trucks);
// o.bistro (the restaurant: no numeral at its restaurant end); o.bikes.
function ice4Mid(c, o) {
  const L = c.L, b1 = 15.15, b2 = L - 15.15, x0 = 0.4, x1 = L - 0.4, R = I4.midRoof;
  const d = M([x0, I4.skirt]) + L_(bottom(x0, x1, I4.skirt, [b1, b2], 5.8, I4.arch).slice(1)) +
    `L${r2(x1)} ${r2(R - 1.1)}Q${r2(x1)} ${R} ${r2(x1 - 1.1)} ${R}L${r2(x0 + 1.1)} ${R}Q${r2(x0)} ${R} ${r2(x0)} ${r2(R - 1.1)}Z`;
  const first = o.cls === "1";
  const paint = rect(-1, 0, L + 2, 20, DB.white) + i4Skirt(L, [24, 40, 56, 72]) + i4Stripe(-1, L + 1, 48.6) + line(-1, R - 0.55, L + 1, R - 0.55, "rgba(0,0,0,0.1)", 0.5);
  let s = shell(d, DB.white, paint);
  s += band(10.2, 84.1, I4.bandLo, I4.bandHi, { pitch: 6.23, from: 12.4, panes: 4.6 });
  s += i4Door(c, 2.9, first, 1) + i4Door(c, L - 2.9 - I4.doorW, first, -1);
  s += dbMark(c, 48.6, (I4.redLo + I4.redHi) / 2, 1.0);
  s += classPanel(c, 11.3, I4.bandLo, I4.bandHi, o.bistro ? "" : o.cls) + classPanel(c, 83.0, I4.bandLo, I4.bandHi, o.cls) + wifi(17.8, 7.9, 1.0);
  s += roofCover(3.0, R, 3.6, 0.22, DB.roof, 1) + roofCover(L - 6.6, R, 3.6, 0.22, DB.roof, 1);
  s += o.pan != null ? i4Pan(L / 2 + 6, R, o.pan) : roofCover(37.0, R, 27.0, 0.2, DB.roof, 4);
  s += i4Trucks([[b1, o.power], [b2, o.power]]);
  return s + ends(c, 2.4, R - 0.4);
}
// An end car, 29.11 m, the nose at the left. The nose's side profile: the
// tip about 1 m up, the top rising in one long curve to the full roof
// about 7 m back; the windshield in a black visor along its top.
const I4_TOP = [[0, 3.04], [0.3, 4.33], [1.0, 5.33], [2.5, 6.28], [5.0, 7.75], [7.5, 8.99], [10.0, 10.13], [12.5, 11.18], [15.0, 11.99], [17.5, 12.46], [20.0, 12.65], [23.6, 12.7]];
const I4_LOW = [[0, 3.04], [0.4, 2.24], [1.3, 1.76], [3.3, 1.66]];
// The height of a nose profile at x (straight lines between its points).
const at = (pts, x) => {
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [a, ya] = pts[i - 1], [b, yb] = pts[i]; return ya + ((yb - ya) * (x - a)) / (b - a); }
  return pts.at(-1)[1];
};
// The windshield seen from the side: a black visor following the nose's top
// from about 4 to 16 ft back, the glass in it (Südkreuz 2026).
const visor = (prof, x0, x1, depth, inset = 0.15) => {
  const xs = Array.from({ length: 9 }, (_, i) => x0 + ((x1 - x0) * i) / 8);
  const taper = (x) => Math.min(1, (x - x0) / 2.2, (x1 - x) / 1.6);
  const up = xs.map((x) => [x, at(prof, x) - inset]), low = xs.map((x) => [x, at(prof, x) - inset - depth * Math.max(0.05, taper(x))]).reverse();
  return M(up[0]) + smooth(up) + L_([low[0]]) + smooth(low) + "Z";
};
function ice4End(c, o) {
  const L = c.L, b1 = 16.4, b2 = L - 15.1, x1 = L - 0.4, R = I4.roof;
  const top = [...I4_TOP].reverse();
  const d = M([3.3, 1.75]) + L_(bottom(3.3, x1, I4.skirt, [b1, b2], 5.8, I4.arch).slice(1)) +
    `L${r2(x1)} ${r2(R - 1.1)}Q${r2(x1)} ${R} ${r2(x1 - 1.1)} ${R}L${r2(top[0][0])} ${r2(top[0][1])}` + smooth(top) + smooth([...I4_LOW]) + "Z";
  const first = o.cls === "1";
  // The stripe: thin at the nose's tip, rising and widening along the nose
  // to the side's level (Südkreuz 2026: about 21 ft back), then broken by
  // "ICE" and running on along the side.
  const lowE = [[-0.5, 2.57], [5.4, 2.76], [9.9, 3.66], [15.0, 4.71], [19.0, I4.redLo], [21.0, I4.redLo]];
  const upE = [[21.0, I4.redHi], [19.0, I4.redHi], [15.0, 5.66], [9.9, 4.42], [5.4, 3.42], [-0.5, 3.09]];
  const nose = path(M(lowE[0]) + smooth(lowE) + L_([upE[0]]) + smooth(upE) + "Z", DB.red);
  const paint = rect(-1, 0, L + 2, 20, DB.white) + i4Skirt(L, [26, 42, 58, 74]) + nose + i4Stripe(25.3, L + 1, 50.7) +
    path(visor(I4_TOP, 3.6, 15.8, 2.0), "#1d2126") + path(visor(I4_TOP, 5.4, 14.6, 1.28, 0.38), "#34404c") +
    // The cab module's seam, from the roof down to the skirt.
    path(`M22.0 ${R}` + smooth([[22.0, R], [19.6, 9.9], [16.6, 7.13], [14.2, 4.75], [12.6, 1.9]]), "none", 0, 'stroke="rgba(22,24,27,0.8)" stroke-width="0.9" vector-effect="non-scaling-stroke"') +
    rect(9.0, 4.28, 2.0, 2.28, "none", 0, `rx="0.4" stroke="${DB.seam}" stroke-width="0.6" vector-effect="non-scaling-stroke"`);
  let s = shell(d, DB.white, paint);
  // The black window shape behind the cab, running forward to a point; a
  // window in it at each end.
  s += path(M([27.0, I4.bandHi]) + L_([[14.6, I4.bandHi], [12.4, 7.42], [13.5, 6.23], [21.0, I4.bandLo], [27.0, I4.bandLo]]) + "Z", DB.band) +
    rect(23.0, I4.bandLo + 0.2, 3.7, 2.4, "#2d333a", 0, 'rx="0.3" stroke="#0f1113" stroke-width="0.5" vector-effect="non-scaling-stroke"') +
    rect(15.6, 7.45, 1.5, 1.62, "#2d333a", 0, 'rx="0.2" stroke="#0f1113" stroke-width="0.5" vector-effect="non-scaling-stroke"');
  s += band(33.4, 87.3, I4.bandLo, I4.bandHi, { pitch: 6.23, from: 35.6, panes: 4.6 });
  s += i4Door(c, 27.6, first, 1) + i4Door(c, L - 2.9 - I4.doorW, first, -1);
  s += iceWord(c, 23.25, I4.redHi - 1.06, 2.12);
  s += dbMark(c, 50.7, (I4.redLo + I4.redHi) / 2, 1.0) + dbMark(c, 2.3, 5.28, 0.6);
  s += classPanel(c, 34.5, I4.bandLo, I4.bandHi, o.cls) + classPanel(c, 86.2, I4.bandLo, I4.bandHi, o.cls) + wifi(41.0, 7.9, 1.0);
  if (first) s += psst(c, 34.5, 10.55);
  s += roofCover(L - 22, R, 12.5, 0.3, DB.roof, 3) + roofCover(L - 6.6, R, 3.6, 0.22, DB.roof, 1);
  s += i4Trucks([[b1, false], [b2, false]]);
  return s + ends({ ...c, coupledL: false }, 2.4, R - 0.4);
}

// ===================== ICE 3: Velaro (403, 406, 407, 408) =====================
// Eight cars on bogies, every car its own body: end cars about 25.7 m, the
// middle ones 24.78 m, 3.89 m high (2.95 m wide), trucks 17.375 m apart,
// 920 mm wheels; one plug door a side on each car (two on the restaurant
// car), at the end next to the door-less end of its neighbour (de.wikipedia
// "DB-Baureihe 403", "DB-Baureihe 407", "DB-Baureihe 408"; Commons' side
// diagram of the 407, "Deutsche Bahn Class 407 w-pantograph.png").
// The 403 and 406 (1999-2004) keep the first ICE 3's rounded nose and the
// lounge behind the cab, its big window running back from the windshield;
// the 407 (Velaro D, 2011-2024) and 408 (ICE 3neo, 2022 on) share the newer
// Velaro nose with a cab side window at the front of a black window shape.
// Paint (403 at Karlsruhe Hbf May 2025; 407 at Paris-Est March 2025; 408
// 8047 at Oostende 2026): the stripe low along the side, sweeping down the
// nose to its tip; "ICE" under the black shape behind the cab in the
// stripe's gap; the windows as separate panes in a black band, the class
// panel at each end; the DB mark mid-car and on the nose.
const VE = { roof: 12.75, skirt: 1.85, arch: 3.3, bandLo: 6.45, bandHi: 9.0, redLo: 5.0, redHi: 5.6, doorLo: 3.1, doorHi: 11.35, doorW: 3.3, wheel: 36.2, mid: m(24.775), centers: m(17.375) };
const veDoor = (c, x, first, side) => plugDoor(x, VE.doorW, VE.doorLo, VE.doorHi, { win: [6.7, 10.2], ww: 1.5, ink: "rgba(30,33,37,0.8)" }) +
  (first ? yellowBar(side < 0 ? x - 0.62 : x + VE.doorW + 0.2, 9.65, 11.2) + letters(c, side < 0 ? x - 0.41 : x + VE.doorW + 0.41, 9.27, 0.4, "1", "#2b3036", { weight: 700, family: DBFONT }) : "");
const veSkirt = (L, xs) => rect(-1, 0, L + 2, 3.05, DB.skirt) + line(-1, 3.05, L + 1, 3.05, "rgba(0,0,0,0.16)", 0.5) + lines(xs.map((x) => [x, 0.5, x, 3.0]), "rgba(0,0,0,0.14)", 0.5);
const veStripe = (a, b, mark) => rect(a, VE.redLo, mark - 1.05 - a, VE.redHi - VE.redLo, DB.red) + rect(mark + 1.05, VE.redLo, b - mark - 1.05, VE.redHi - VE.redLo, DB.red);
const veTrucks = (xs, power) => xs.map((x) => truck(x, { wb: 8.2, d: VE.wheel, top: VE.arch })).join("") + (power ? "" : "");
// A middle car. o.cls; o.door "L" or "R" (the end its door is at) or "LR"
// (the restaurant car); o.pan (a pantograph on the transformer car); o.bistro.
function velaroMid(c, o) {
  const L = c.L, R = VE.roof, x0 = 0.4, x1 = L - 0.4, t0 = (L - VE.centers) / 2, t1 = L - t0;
  const d = M([x0, VE.skirt]) + L_(bottom(x0, x1, VE.skirt, [t0, t1], 5.4, VE.arch).slice(1)) +
    `L${r2(x1)} ${r2(R - 1.2)}Q${r2(x1)} ${R} ${r2(x1 - 1.2)} ${R}L${r2(x0 + 1.2)} ${R}Q${r2(x0)} ${R} ${r2(x0)} ${r2(R - 1.2)}Z`;
  const first = o.cls === "1", dl = /L/.test(o.door), dr = /R/.test(o.door);
  let s = shell(d, DB.white, rect(-1, 0, L + 2, 20, DB.white) + veSkirt(L, [20, 34, 47, 61]) + veStripe(-1, L + 1, L * 0.52) + line(-1, R - 0.5, L + 1, R - 0.5, "rgba(0,0,0,0.1)", 0.5));
  const a = dl ? 12.0 : 4.3, b = dr ? L - 12.0 : L - 4.3, n = Math.floor((b - a - 2.2) / 6.75), from = a + 1.25 + ((b - a - 2.5) - (n * 6.75 - 1.95)) / 2;
  s += band(a, b, VE.bandLo, VE.bandHi, { pitch: 6.75, from, panes: 4.8 });
  if (dl) s += veDoor(c, 1.3, first, 1);
  if (dr) s += veDoor(c, L - 1.3 - VE.doorW, first, -1);
  s += classPanel(c, a + 0.62, VE.bandLo, VE.bandHi, o.bistro && dl ? "" : o.cls) + classPanel(c, b - 0.62, VE.bandLo, VE.bandHi, o.bistro && dr ? "" : o.cls);
  s += dbMark(c, L * 0.52, (VE.redLo + VE.redHi) / 2, 0.9);
  s += roofCover(2.0, R, 3.4, 0.22, DB.roof, 1) + roofCover(L - 5.4, R, 3.4, 0.22, DB.roof, 1);
  s += o.pan != null ? roofCover(L / 2 - 14, R, 8.0, 0.3, DB.roof, 1) + rect(L / 2 - 5.6, R - 0.05, 8.2, 0.2, "#9aa1a9", 0.3) + pantograph(L / 2 - 1.5, R + 0.1, { up: o.pan, facing: -1 }) + panGear(L / 2 - 1.5, R + 0.1, 1)
    : roofCover(L / 2 - 13, R, 26, 0.22, DB.roof, 4);
  s += veTrucks([t0, t1]);
  return s + ends(c, 2.3, R - 0.4);
}
// The noses, side profiles from the tip (x 0) back to the full roof.
const NOSE_407 = [[0, 3.55], [0.35, 4.7], [1.0, 5.35], [2.5, 6.55], [5.0, 8.25], [7.5, 9.55], [10.0, 10.6], [12.5, 11.45], [15.0, 12.1], [18.0, 12.55], [21.0, 12.75]];
const NOSE_407_LOW = [[0, 3.55], [0.3, 2.5], [1.2, 1.95], [3.2, 1.85]];
const NOSE_403 = [[0, 3.75], [0.3, 5.0], [1.0, 6.0], [2.5, 7.3], [5.0, 8.95], [7.5, 10.25], [10.0, 11.25], [12.5, 11.95], [15.0, 12.4], [18.0, 12.7], [21.0, 12.75]];
const NOSE_403_LOW = [[0, 3.75], [0.3, 2.55], [1.2, 1.95], [3.2, 1.85]];
// An end car, the nose at the left. o.nose "407" (407 and 408) or "403"
// (403 and 406, the lounge behind the cab); o.cls.
function velaroEnd(c, o) {
  const L = c.L, R = VE.roof, x1 = L - 0.4, old = o.nose === "403";
  const prof = old ? NOSE_403 : NOSE_407, low = old ? NOSE_403_LOW : NOSE_407_LOW;
  const t0 = 16.0, t1 = t0 + VE.centers;
  const top = [...prof].reverse();
  const d = M(low.at(-1)) + L_(bottom(low.at(-1)[0], x1, VE.skirt, [t0, t1], 5.4, VE.arch).slice(1)) +
    `L${r2(x1)} ${r2(R - 1.2)}Q${r2(x1)} ${R} ${r2(x1 - 1.2)} ${R}L${r2(top[0][0])} ${r2(top[0][1])}` + smooth(top) + smooth(low) + "Z";
  const first = o.cls === "1", tip = prof[0][1];
  // The stripe from the nose's tip, rising along the nose to the side's
  // level at "ICE"; on along the side behind it.
  const iceX = old ? 18.3 : 17.2, gap0 = iceX - 2.15, gap1 = iceX + 2.15;
  const lowE = [[-0.5, tip - 0.32], [4.5, tip - 0.22], [9.0, (tip + VE.redLo) / 2 - 0.15], [13.0, VE.redLo - 0.05], [gap0, VE.redLo]];
  const upE = [[gap0, VE.redHi], [13.0, VE.redHi - 0.05], [9.0, (tip + VE.redHi) / 2 + 0.1], [4.5, tip + 0.28], [-0.5, tip + 0.2]];
  const paint = rect(-1, 0, L + 2, 20, DB.white) + veSkirt(L, [24, 37, 50, 63]) + path(M(lowE[0]) + smooth(lowE) + L_([upE[0]]) + smooth(upE) + "Z", DB.red) +
    veStripe(gap1, L + 1, 49.5) + path(visor(prof, old ? 2.6 : 3.0, old ? 13.4 : 13.6, old ? 2.6 : 2.1), "#1d2126") +
    path(visor(prof, old ? 3.8 : 4.6, old ? 12.6 : 12.6, old ? 1.85 : 1.35, 0.38), "#34404c") +
    // The cab module's seam.
    path(`M${old ? 21.0 : 22.5} ${R}` + smooth([[old ? 21.0 : 22.5, R], [old ? 20.6 : 22.0, 9.0], [old ? 20.2 : 21.6, 5.0], [old ? 19.8 : 21.2, 2.0]]), "none", 0, `stroke="${DB.seam}" stroke-width="0.6" vector-effect="non-scaling-stroke"`);
  let s = shell(d, DB.white, paint);
  if (old) {
    // The lounge's window: from just behind the windshield back to the cab
    // module's end, its front end cut on the slant, pillars in it.
    s += path(M([22.8, VE.bandHi + 0.35]) + L_([[11.6, VE.bandHi + 0.35], [9.4, 8.2], [10.6, VE.bandLo], [22.8, VE.bandLo]]) + "Z", DB.band) +
      lines([[15.0, VE.bandLo + 0.15, 15.0, VE.bandHi + 0.2], [19.0, VE.bandLo + 0.15, 19.0, VE.bandHi + 0.2]], "#4a525c", 0.6) +
      rect(11.0, VE.bandLo + 1.55, 11.6, 0.75, "#3b444e", 0, 'opacity="0.6"');
  } else {
    // The black shape behind the cab; the cab's side window at its front.
    s += path(M([23.4, VE.bandHi]) + L_([[12.0, VE.bandHi], [10.3, 7.9], [11.6, VE.bandLo - 0.3], [23.4, VE.bandLo]]) + "Z", DB.band) +
      path(M([11.0, 7.9]) + L_([[12.2, 8.75], [14.0, 8.75], [14.0, 6.6], [12.0, 6.55]]) + "Z", "#2d333a", 0, 'stroke="#0f1113" stroke-width="0.5" vector-effect="non-scaling-stroke"');
  }
  const dx = old ? 24.0 : 25.4;
  s += veDoor(c, dx, first, 1);
  const a = dx + VE.doorW + 1.6, b = L - 5.0, n = Math.floor((b - a - 2.2) / 6.75);
  s += band(a, b, VE.bandLo, VE.bandHi, { pitch: 6.75, from: a + 1.3 + ((b - a - 2.6) - (n * 6.75 - 1.95)) / 2, panes: 4.8 });
  s += classPanel(c, a + 0.62, VE.bandLo, VE.bandHi, o.cls) + classPanel(c, b - 0.62, VE.bandLo, VE.bandHi, o.cls);
  s += iceWord(c, iceX, 4.6, 1.95) + dbMark(c, 49.5, (VE.redLo + VE.redHi) / 2, 0.9) + dbMark(c, 2.1, tip + 1.45, 0.55);
  s += roofCover(L - 5.4, R, 3.4, 0.22, DB.roof, 1) + roofCover(L - 30, R, 18, 0.25, DB.roof, 3);
  s += veTrucks([t0, t1]);
  return s + ends({ ...c, coupledL: false }, 2.3, R - 0.4);
}

// ===================== ICE 1 (401) and ICE 2 (402, 808) =====================
// Power cars 20.56 m, 3.84 m high, bogies 11.46 m apart on 1040 mm wheels;
// the middle cars 26.40 m on bogies 19 m apart (920 mm wheels), one door a
// side at one end, with its oval window; the ICE 1's restaurant car (804)
// under its raised roof, 4.295 m high, with windows in the raised part
// (de.wikipedia "DB-Baureihe 401", "DB-Baureihe 402"). The ICE 1 runs since
// its second redesign (2019-2026) as nine middle cars between its power cars
// (five second-class, the service car, the restaurant, two first-class); an
// ICE 2 is a power car, six middle cars and the driving trailer (808), often
// two coupled.
// Paint (ICE 1 401 578 at Leipzig Hbf November 2025, its restaurant car at
// Frankfurt 2024, cars at Hamburg Hbf 2022; ICE 2 402 021 at Berlin
// Ostbahnhof November 2025, 808 at Hannover): the stripe wide, along the
// cars under the windows, falling along the power car to the nose and
// across its front; "ICE" in big light-grey capitals on the power car and
// the ICE 2's cab car, above the stripe; "Bordrestaurant" in red on the
// restaurant car; the yellow bar beside a first-class door.
const IC1 = { roof: 12.6, skirt: 2.2, arch: 3.6, winLo: 7.0, winHi: 10.0, redLo: 4.75, redHi: 5.85, doorLo: 3.5, doorHi: 11.4, doorW: 2.95, ice: "#b3b9bf" };
const ic1Stripe = (a, b, mark) => rect(a, IC1.redLo, mark - 1.2 - a, IC1.redHi - IC1.redLo, DB.red) + rect(mark + 1.2, IC1.redLo, b - mark - 1.2, IC1.redHi - IC1.redLo, DB.red);
// A door with its oval window; the first class's yellow bar on the seats' side.
const ic1Door = (c, x, first, side) => rect(x, IC1.doorLo, IC1.doorW, IC1.doorHi - IC1.doorLo, "none", 0, 'rx="0.3" stroke="rgba(30,33,37,0.75)" stroke-width="0.6" vector-effect="non-scaling-stroke"') +
  rect(x + IC1.doorW / 2 - 0.7, 7.3, 1.4, 2.9, "#262b31", 0, 'rx="0.7" ry="0.9" stroke="#e6e8ea" stroke-width="0.6" vector-effect="non-scaling-stroke"') +
  (first ? yellowBar(side < 0 ? x - 0.6 : x + IC1.doorW + 0.2, 9.9, 11.3) + letters(c, side < 0 ? x - 0.39 : x + IC1.doorW + 0.41, 9.5, 0.4, "1", "#2b3036", { weight: 700, family: DBFONT }) : "");
const ic1Skirt = (L, xs) => rect(-1, 0, L + 2, 3.3, DB.skirt) + line(-1, 3.3, L + 1, 3.3, "rgba(0,0,0,0.16)", 0.5) + lines(xs.map((x) => [x, 0.5, x, 3.25]), "rgba(0,0,0,0.14)", 0.5);
// Separate windows in black frames from a to b, pitch p, pane w.
function ic1Windows(a, b, p, w, y0 = IC1.winLo, y1 = IC1.winHi) {
  let s = "";
  for (let x = a; x + w <= b + 0.01; x += p)
    s += rect(x - 0.2, y0 - 0.2, w + 0.4, y1 - y0 + 0.4, "#1b1e22", 0, 'rx="0.45"') + rect(x, y0, w, y1 - y0, "#2c333b", 0, 'rx="0.35"') +
      rect(x + 0.15, y0 + (y1 - y0) * 0.6, w - 0.3, (y1 - y0) * 0.28, "#3d4752", 0, 'rx="0.15" opacity="0.6"');
  return s;
}
// The cars' windows: one band of glass in a black frame, thin pillars
// between the panes.
const ic1Band = (a, b, from, p, y0 = IC1.winLo, y1 = IC1.winHi) => rect(a - 0.2, y0 - 0.2, b - a + 0.4, y1 - y0 + 0.4, "#1b1e22", 0, 'rx="0.5"') +
  band(a, b, y0, y1, { pitch: p, from, fill: "#2a3037" });
// A middle car, 26.40 m. o.cls; o.door "L"/"R"; o.rest (the ICE 1's
// restaurant car under its raised roof); o.bistro (the ICE 2's restaurant).
function ic1Car(c, o) {
  const L = c.L, x0 = 0.4, x1 = L - 0.4, t0 = (L - m(19.0)) / 2, t1 = L - t0, first = o.cls === "1";
  const R = IC1.roof, RR = o.rest ? m(4.295) : R, ra = 15.0, rb = L - 15.0;
  const roofLine = o.rest ? `L${r2(x1)} ${r2(R - 1.2)}Q${r2(x1)} ${R} ${r2(x1 - 1.2)} ${R}L${r2(rb + 1.6)} ${R}Q${r2(rb + 0.4)} ${R} ${r2(rb)} ${r2(RR - 0.5)}Q${r2(rb - 0.2)} ${r2(RR)} ${r2(rb - 1.0)} ${r2(RR)}` +
    `L${r2(ra + 1.0)} ${r2(RR)}Q${r2(ra + 0.2)} ${r2(RR)} ${r2(ra)} ${r2(RR - 0.5)}Q${r2(ra - 0.4)} ${R} ${r2(ra - 1.6)} ${R}L${r2(x0 + 1.2)} ${R}Q${r2(x0)} ${R} ${r2(x0)} ${r2(R - 1.2)}Z`
    : `L${r2(x1)} ${r2(R - 1.2)}Q${r2(x1)} ${R} ${r2(x1 - 1.2)} ${R}L${r2(x0 + 1.2)} ${R}Q${r2(x0)} ${R} ${r2(x0)} ${r2(R - 1.2)}Z`;
  const d = M([x0, IC1.skirt]) + L_(bottom(x0, x1, IC1.skirt, [t0, t1], 5.6, IC1.arch).slice(1)) + roofLine;
  const markX = o.rest ? (o.door === "L" ? L * 0.71 : L * 0.29) : L / 2;
  let s = shell(d, DB.white, rect(-1, 0, L + 2, 20, DB.white) + ic1Skirt(L, [22, 38, 49, 65]) + ic1Stripe(-1, L + 1, markX) +
    (o.rest ? rect(ra - 0.5, R - 0.1, rb - ra + 1, RR - R + 0.2, "#e2e5e8") + line(ra, R - 0.05, rb, R - 0.05, "rgba(0,0,0,0.18)", 0.5) : ""));
  const dl = o.door === "L";
  const dx = o.rest ? (dl ? L * 0.19 : L * 0.81 - IC1.doorW) : dl ? 1.5 : L - 1.5 - IC1.doorW;
  s += ic1Door(c, dx, first, dl ? 1 : -1);
  if (o.rest) {
    // The raised roof's windows; the dining room's windows at the door-less
    // end, the kitchen's two small ones; "Bordrestaurant" over the dining room.
    for (let k = 0; k < 6; k++) s += rect(ra + 2.0 + k * ((rb - ra - 6) / 5.4), R + 0.25, 3.0, RR - R - 0.65, "#2c333b", 0, 'rx="0.3" stroke="#1b1e22" stroke-width="0.5" vector-effect="non-scaling-stroke"');
    // (Frankfurt 2024, 804 059): the dining room's big window low over the
    // stripe at the door-less end, "Bordrestaurant" big in red between it
    // and the door, over the faint pale-grey "ICE" the car still carries;
    // the kitchen's window beyond the door. (Drawn door at the right; the
    // car is mirrored for the other side.)
    const f = (v) => (dl ? L - v * L : v * L);
    const span = (u, v) => [Math.min(f(u), f(v)), Math.max(f(u), f(v))];
    const [d0, d1] = span(0.17, 0.48), [k0, k1] = span(0.83, 0.975);
    s += ic1Band(d0, d1, d0 + (d1 - d0) / 3, (d1 - d0) / 3, 6.95, 9.95) + ic1Band(k0, k1, 0, 0, 7.25, 9.6);
    s += iceText(c, f(0.645), 8.75, 4.6, "#d9dcdf", { weight: 500, stretch: 0.55 });
    s += letters(c, f(0.645), 9.0, 2.6, "Bordrestaurant", DB.red, { weight: 500, family: DBFONT, stretch: 0.8 });
  } else if (o.bistro) {
    const a = dl ? 7.5 : 5.0, b = dl ? L - 5.0 : L - 7.5;
    s += ic1Band(a, a + 31, a + 6.3, 6.3) + ic1Band(b - 31, b, b - 31 + 6.3, 6.3);
  } else {
    const a = dl ? 6.5 : 4.4, b = dl ? L - 4.4 : L - 6.5, p = first ? 7.0 : 6.25, w = first ? 5.6 : 5.0;
    const n = Math.floor((b - a - w) / p) + 1, from = a + (b - a - (n - 1) * p - w) / 2;
    s += ic1Band(from - 0.5, from + (n - 1) * p + w + 0.5, from + w + (p - w) / 2, p);
    s += letters(c, dl ? from - 1.1 : from + (n - 1) * p + w + 1.1, IC1.winLo + 2.2, 1.2, o.cls, "#2b3036", { weight: 600, family: DBFONT });
  }
  s += dbMark(c, markX, (IC1.redLo + IC1.redHi) / 2, 0.95);
  s += o.rest ? "" : roofCover(L / 2 - 12, R, 24, 0.25, DB.roof, 3);
  s += [t0, t1].map((x) => truck(x, { wb: 8.2, d: 36.2, top: IC1.arch })).join("");
  return s + ends(c, 2.6, R - 0.4);
}
// The power car's (and the 808's) nose, from the tip back to the roof:
// the ICE 1's blunt, nearly upright front; the ICE 2's longer, lower one.
const NOSE_401 = [[0, 3.6], [0.25, 5.4], [0.7, 7.0], [1.5, 8.6], [2.6, 10.0], [4.0, 11.2], [6.0, 12.0], [9.0, 12.45], [12.0, 12.6]];
const NOSE_401_LOW = [[0, 3.6], [0.2, 2.0], [0.8, 1.1], [3.0, 0.95]];
const NOSE_402 = [[0, 3.3], [0.4, 5.0], [1.2, 6.1], [3.7, 7.7], [6.9, 9.55], [10.2, 11.0], [13.4, 12.0], [16.3, 12.4], [19.5, 12.6]];
const NOSE_402_LOW = [[0, 3.3], [0.25, 2.0], [0.9, 1.1], [3.0, 0.95]];
// o.kind "401" or "402" (power cars) or "808" (the ICE 2's driving trailer,
// passenger windows behind its door).
function ic1Head(c, o) {
  const L = c.L, R = IC1.roof, x1 = L - 0.4, k = o.kind, i1 = k === "401";
  const prof = i1 ? NOSE_401 : NOSE_402, low = i1 ? NOSE_401_LOW : NOSE_402_LOW, tip = prof[0][1];
  const trailer = k === "808";
  const t0 = trailer ? 14.5 : 14.9, t1 = trailer ? t0 + m(19.0) : t0 + m(11.46);
  const top = [...prof].reverse();
  const d = M(low.at(-1)) + L_(bottom(low.at(-1)[0], x1, IC1.skirt, [t0, t1], 5.8, IC1.arch).slice(1)) +
    `L${r2(x1)} ${r2(R - 1.2)}Q${r2(x1)} ${R} ${r2(x1 - 1.2)} ${R}L${r2(top[0][0])} ${r2(top[0][1])}` + smooth(top) + smooth(low) + "Z";
  // The stripe: across the front low, rising gently back along the head
  // to the cars' level.
  const back = trailer ? 44 : L - 6;
  const lowE = [[-0.5, tip - 0.45], [6, tip - 0.25], [16, 3.85], [30, 4.45], [back, IC1.redLo]];
  const upE = [[back, IC1.redHi], [30, 5.55], [16, 4.95], [6, tip + 0.75], [-0.5, tip + 0.6]];
  const ws = i1 ? [1.4, 6.2, 2.3] : [4.6, 12.6, 2.3];
  let paint = rect(-1, 0, L + 2, 20, DB.white) + ic1Skirt(L, [20, 34, 48]) + path(M(lowE[0]) + smooth(lowE) + L_([upE[0]]) + smooth(upE) + "Z", DB.red) +
    rect(back - 0.3, IC1.redLo, L + 1 - back, IC1.redHi - IC1.redLo, DB.red) + path(visor(prof, ws[0] - 0.5, ws[1], ws[2] + 0.5, 0.15), "#1d2126") + path(visor(prof, ws[0], ws[1] - 0.6, ws[2], 0.4), "#34404c");
  let s = shell(d, DB.white, paint);
  // The cab's side window, its front edge on the slant.
  const cw = i1 ? 8.3 : 13.0;
  s += path(M([cw, 8.0]) + L_([[cw + 0.9, 10.3], [cw + 3.0, 10.3], [cw + 3.0, 8.0]]) + "Z", "#262b31", 0, 'stroke="#111417" stroke-width="0.5" vector-effect="non-scaling-stroke"');
  if (trailer) {
    // The 808: "ICE" behind the cab, the door, the passenger windows.
    s += iceText(c, 27.6, 7.9, 4.0, IC1.ice, { weight: 400, stretch: 0.74 });
    s += ic1Door(c, 33.5, false, 1);
    s += ic1Band(39.0, L - 4.5, 44.6, 6.25);
    s += letters(c, 37.8, IC1.winLo + 2.2, 1.2, "2", "#2b3036", { weight: 600, family: DBFONT });
  } else {
    // Machine-room windows, the cab door, "ICE", a small window at the back.
    const g0 = i1 ? 12.8 : 17.6;
    s += rect(g0, 7.4, 2.4, 3.7, "#262b31", 0, 'rx="0.2"') + rect(g0 + 2.6, 7.4, 2.4, 3.7, "#262b31", 0, 'rx="0.2"');
    const dx = g0 + 6.8;
    s += rect(dx, 3.7, 2.4, 8.0, "none", 0, 'rx="0.25" stroke="rgba(30,33,37,0.7)" stroke-width="0.6" vector-effect="non-scaling-stroke"') + line(dx + 2.6, 5.2, dx + 2.6, 10.6, "#9aa1a8", 1.0) + line(dx - 0.2, 5.2, dx - 0.2, 10.6, "#9aa1a8", 1.0);
    s += iceText(c, dx + 1.2 + 0.47 * (L - dx - 1.2), 8.9, 3.8, IC1.ice, { weight: 400, stretch: 0.74 });
    s += rect(L - 9.6, 8.2, 1.7, 2.6, "#262b31", 0, 'rx="0.2"') + rect(L - 7.7, 8.2, 1.7, 2.6, "#262b31", 0, 'rx="0.2"');
    s += dbMark(c, L - 12.5, (IC1.redLo + IC1.redHi) / 2, 0.95);
    // Roof: the pantographs (the ICE 1's two, the ICE 2's one) and the
    // equipment covers.
    s += roofCover(20, R, 14, 0.35, DB.roof, 3) + pantograph(L - 22, R + 0.05, { up: !!c.pan || true, facing: -1 }) + panGear(L - 22, R + 0.05, 1);
  }
  if (trailer) s += roofCover(L / 2 - 12, R, 24, 0.25, DB.roof, 3);
  s += dbMark(c, 1.0, tip + 0.15, 0.55);
  s += [t0, t1].map((x) => truck(x, { wb: trailer ? 8.2 : 9.85, d: trailer ? 36.2 : 41, top: IC1.arch, kind: trailer ? "car" : "loco" })).join("");
  return s + ends({ ...c, coupledL: false }, 2.6, R - 0.4);
}

// ===================== ICE T (411, 415) =====================
// Siemens/Alstom tilting train (1999-2006): end cars 27.45 m, middle cars
// 25.90 m, 3.84 m high and narrowing above the windows for the tilt; bogies
// 19.0 m apart, 890 mm wheels; one plug door with an oval window at one end
// of each car (two on the restaurant car). Class 411 seven cars (Tz 1101-
// 1184), class 415 five (Tz 1501-1506, 1520-1524), the end cars with a
// lounge behind the cab (de.wikipedia "DB-Baureihe 411").
// Paint (Erfurt Hbf July 2026; München Hbf October 2026, Tz 1166 and a
// first-class car close up): the stripe straight along the side at mid-
// skirt height, stopping short of the nose; "ICE" in its gap under the
// lounge window; the windows separate in a black band; the yellow bar by a
// first-class door; the class numeral big and white in the band.
const IT = { roof: 12.6, skirt: 1.6, arch: 3.1, bandLo: 6.1, bandHi: 9.0, redLo: 4.2, redHi: 5.45, doorLo: 2.9, doorHi: 10.75, doorW: 2.8, wheel: 35.0, centers: m(19.0) };
const itDoor = (c, x, first, side) => rect(x, IT.doorLo, IT.doorW, IT.doorHi - IT.doorLo, "none", 0, 'rx="0.3" stroke="rgba(30,33,37,0.75)" stroke-width="0.6" vector-effect="non-scaling-stroke"') +
  rect(x + IT.doorW / 2 - 0.65, 6.3, 1.3, 3.3, "#262b31", 0, 'rx="0.65" ry="0.9" stroke="#e6e8ea" stroke-width="0.6" vector-effect="non-scaling-stroke"') +
  (first ? yellowBar(side < 0 ? x - 0.55 : x + IT.doorW + 0.15, 8.6, 10.6) + letters(c, side < 0 ? x - 0.34 : x + IT.doorW + 0.36, 8.25, 0.4, "1", "#2b3036", { weight: 700, family: DBFONT }) : "");
const itSkirt = (L, xs) => rect(-1, 0, L + 2, 2.9, DB.skirt) + line(-1, 2.9, L + 1, 2.9, "rgba(0,0,0,0.16)", 0.5) + lines(xs.map((x) => [x, 0.5, x, 2.85]), "rgba(0,0,0,0.14)", 0.5);
const itStripe = (a, b, mark) => rect(a, IT.redLo, mark - 1.25 - a, IT.redHi - IT.redLo, DB.red) + rect(mark + 1.25, IT.redLo, b - mark - 1.25, IT.redHi - IT.redLo, DB.red);
// The body: the sides tucking in under the floor and above the windows.
function itBody(c, x0, x1, t0, t1, noseTop, noseLow) {
  const R = IT.roof;
  if (!noseTop) return M([x0, IT.skirt]) + L_(bottom(x0, x1, IT.skirt, [t0, t1], 5.4, IT.arch).slice(1)) +
    `L${r2(x1)} ${r2(R - 1.6)}Q${r2(x1)} ${R} ${r2(x1 - 1.6)} ${R}L${r2(x0 + 1.6)} ${R}Q${r2(x0)} ${R} ${r2(x0)} ${r2(R - 1.6)}Z`;
  const top = [...noseTop].reverse();
  return M(noseLow.at(-1)) + L_(bottom(noseLow.at(-1)[0], x1, IT.skirt, [t0, t1], 5.4, IT.arch).slice(1)) +
    `L${r2(x1)} ${r2(R - 1.6)}Q${r2(x1)} ${R} ${r2(x1 - 1.6)} ${R}L${r2(top[0][0])} ${r2(top[0][1])}` + smooth(top) + smooth(noseLow) + "Z";
}
// A middle car: o.cls, o.door "L"/"R"/"LR", o.pan, o.bistro.
function iceTMid(c, o) {
  const L = c.L, R = IT.roof, t0 = (L - IT.centers) / 2, t1 = L - t0, first = o.cls === "1", dl = /L/.test(o.door), dr = /R/.test(o.door);
  let s = shell(itBody(c, 0.4, L - 0.4, t0, t1), DB.white, rect(-1, 0, L + 2, 20, DB.white) + itSkirt(L, [22, 36, 50, 64]) + itStripe(-1, L + 1, L * 0.55) + line(-1, R - 0.7, L + 1, R - 0.7, "rgba(0,0,0,0.1)", 0.5));
  const a = dl ? 6.0 : 3.8, b = dr ? L - 6.0 : L - 3.8, p = first ? 7.6 : 6.6, w = first ? 6.0 : 5.0;
  const n = Math.floor((b - a - 2.6 - w) / p) + 1, from = a + 1.6 + (b - a - 2.6 - (n - 1) * p - w) / 2;
  s += band(a, b, IT.bandLo, IT.bandHi, { pitch: p, from, panes: w });
  if (dl) s += itDoor(c, 1.6, first, 1);
  if (dr) s += itDoor(c, L - 1.6 - IT.doorW, first, -1);
  if (o.cls) s += letters(c, dl ? b - 0.85 : a + 0.85, (IT.bandLo + IT.bandHi) / 2 + 0.2, 1.4, o.cls, "#ffffff", { weight: 600, family: DBFONT });
  s += dbMark(c, L * 0.55, (IT.redLo + IT.redHi) / 2, 1.05);
  s += o.pan != null ? roofCover(L / 2 - 14, R, 8.0, 0.3, DB.roof, 1) + pantograph(L / 2 - 1.5, R + 0.1, { up: o.pan, facing: -1 }) + panGear(L / 2 - 1.5, R + 0.1, 1)
    : roofCover(L / 2 - 12, R, 24, 0.22, DB.roof, 3);
  s += [t0, t1].map((x) => truck(x, { wb: 8.2, d: IT.wheel, top: IT.arch })).join("");
  return s + ends(c, 2.4, R - 0.5);
}
const NOSE_T = [[0, 2.5], [0.3, 4.4], [0.9, 5.8], [2.1, 7.3], [3.5, 8.8], [5.2, 10.3], [8.2, 11.8], [11.2, 12.4], [14.5, 12.6]];
const NOSE_T_LOW = [[0, 2.5], [0.2, 1.75], [0.8, 1.4], [3.0, 1.35]];
// An end car, the nose at the left, the lounge behind the cab.
function iceTEnd(c, o) {
  const L = c.L, R = IT.roof, t0 = 13.0, t1 = t0 + IT.centers, first = o.cls === "1";
  const paint = rect(-1, 0, L + 2, 20, DB.white) + itSkirt(L, [22, 36, 50, 64]) + rect(3.2, IT.redLo, 12.1, IT.redHi - IT.redLo, DB.red) + itStripe(20.0, L + 1, 52) +
    path(visor(NOSE_T, 1.4, 11.0, 2.3, 0.15), "#1d2126") + path(visor(NOSE_T, 2.2, 10.2, 1.6, 0.4), "#34404c") +
    path(`M3.0 ${R}` + smooth([[2.0, 9.5], [1.4, 6.0], [1.2, 1.6]]), "none", 0, `stroke="${DB.seam}" stroke-width="0.6" vector-effect="non-scaling-stroke"`);
  let s = shell(itBody(c, 0, L - 0.4, t0, t1, NOSE_T, NOSE_T_LOW), DB.white, paint);
  // The lounge's window, pointed at its front, divided in two.
  s += path(M([22.0, IT.bandHi]) + L_([[9.6, IT.bandHi], [7.8, 7.6], [9.0, IT.bandLo], [22.0, IT.bandLo]]) + "Z", DB.band) +
    rect(16.2, IT.bandLo + 0.25, 5.4, IT.bandHi - IT.bandLo - 0.5, "#2c333b", 0, 'rx="0.35" stroke="#15181b" stroke-width="0.5" vector-effect="non-scaling-stroke"') +
    lines([[13.6, IT.bandLo + 0.1, 13.6, IT.bandHi - 0.1]], "#4a525c", 0.6) + rect(9.2, IT.bandLo + 1.7, 6.6, 0.75, "#3b444e", 0, 'opacity="0.6"');
  s += iceWord(c, 17.7, 4.5, 2.0);
  s += itDoor(c, 22.9, first, 1);
  const a = 27.2, b = L - 3.8, p = first ? 7.6 : 6.6, w = first ? 6.0 : 5.0, n = Math.floor((b - a - 2.6 - w) / p) + 1;
  s += band(a, b, IT.bandLo, IT.bandHi, { pitch: p, from: a + 1.6 + (b - a - 2.6 - (n - 1) * p - w) / 2, panes: w });
  s += letters(c, a + 0.85, (IT.bandLo + IT.bandHi) / 2 + 0.2, 1.4, o.cls, "#ffffff", { weight: 600, family: DBFONT });
  s += dbMark(c, 52, (IT.redLo + IT.redHi) / 2, 1.05) + dbMark(c, 1.0, 4.9, 0.55);
  s += roofCover(L - 30, R, 18, 0.25, DB.roof, 3);
  s += [t0, t1].map((x) => truck(x, { wb: 8.2, d: IT.wheel, top: IT.arch })).join("");
  return s + ends({ ...c, coupledL: false }, 2.4, R - 0.5);
}

// ===================== ICE L (Talgo 230) and its Vectrons =====================
// Talgo 230 (DB's ICE L, in service since 14 December 2025): seventeen cars,
// the middle ones 13.3 m and 3.6 m high on Talgo's single-axle running gear
// between the cars (880 mm wheels), the floor 76 cm up; at one end the end
// car (Bpdz, 18.3 m, 3.8 m high, on a bogie at its outer end) for the
// locomotive, at the other the first-class cab car (Apzf, 18.3 m); car 1
// the end car (bicycles), 2-12 second class, 13 the barrier-free car, 14
// the bistro, 15-16 first class, 17 the cab car (de.wikipedia "ICE L").
// Hauled by DB's Vectrons (193, Siemens Vectron MS, 200 km/h) under the
// wires, by Vectron Dual Mode (248) to Westerland and Oberstdorf; Talgo's
// own class 105 isn't in service yet.
// Paint (Lichtenberg 2026-09, 193 440; Westerland 2026-10-17, 248 515;
// Warschauer Straße 2025-11; Köln Hbf 2026; Nienburg 2024): the cars light
// grey-white, the stripe low along the side, stepping down from the end
// car's and the cab car's higher sides to the low middle cars' level; each
// middle car one black-framed door and three windows in a black band; the
// cab's front black over the windshield, the DB mark under it.
const TL = { roof: m(3.6), endRoof: m(3.8), skirt: 1.7, winLo: 6.35, winHi: 9.4, redLo: 3.75, redHi: 4.45, endLo: 4.15, endHi: 4.85, doorLo: 2.55, doorHi: 10.4, doorW: 2.9, wheel: 34.6 };
const tlDoor = (c, x, first, side, lo = TL.doorLo) => rect(x - 0.35, lo - 0.2, TL.doorW + 0.7, TL.doorHi - lo + 0.55, "#1e2125", 0, 'rx="0.45"') + rect(x, lo, TL.doorW, TL.doorHi - lo, DB.white, 0, 'rx="0.3"') +
  rect(x + 0.6, 6.0, TL.doorW - 1.2, 3.6, "#262b31", 0, 'rx="0.2"') +
  (first ? yellowBar(side < 0 ? x - 0.95 : x + TL.doorW + 0.55, 8.4, 10.2) + letters(c, side < 0 ? x - 0.74 : x + TL.doorW + 0.76, 8.05, 0.4, "1", "#2b3036", { weight: 700, family: DBFONT }) : "");
// The single axle under a car's end, its wheel half under each car.
const talgoAxle = (x) => truck(x, { wb: 0.01, d: TL.wheel, top: 2.4, axles: 1 }).replace(/<path[^>]*\/>/, "");
// A middle car, 13.3 m: its door at the left (o.flip at the right), three
// windows; o.cls; o.bistro (the bistro's windows, no numeral).
function tlMid(c, o) {
  const L = c.L, R = TL.roof, x0 = 0.3, x1 = L - 0.3, first = o.cls === "1";
  const d = M([x0, TL.skirt]) + L_([[x1, TL.skirt], [x1, R - 1.3]]) + `Q${r2(x1)} ${r2(R)} ${r2(x1 - 1.3)} ${r2(R)}L${r2(x0 + 1.3)} ${r2(R)}Q${r2(x0)} ${r2(R)} ${r2(x0)} ${r2(R - 1.3)}Z`;
  let s = shell(d, DB.white, rect(-1, 0, L + 2, 20, DB.white) + rect(-1, 0, L + 2, 2.6, DB.skirt) + rect(-1, TL.redLo, L + 2, TL.redHi - TL.redLo, DB.red));
  const dx = 1.2;
  s += tlDoor(c, dx, first, 1);
  s += band(6.5, L - 2.4, TL.winLo, TL.winHi, { pitch: 11.6, from: 7.0, panes: 10.6 });
  if (!o.bistro) s += letters(c, dx + TL.doorW + 1.25, TL.winHi - 0.4, 0.75, o.cls, "#2b3036", { weight: 600, family: DBFONT });
  if (o.dbm) s += dbMark(c, L - 8, (TL.redLo + TL.redHi) / 2, 0.75);
  // The air-conditioning hood over the door end.
  s += path(`M1.0 ${r2(R - 0.05)}L1.6 ${r2(R + 0.75)}L12.6 ${r2(R + 0.75)}L14.2 ${r2(R - 0.05)}Z`, DB.roof, 0.4) + slats(3.0, R + 0.15, 7.5, 0.45, 0.5, "rgba(0,0,0,0.3)");
  s += talgoAxle(1.4) + (c.coupledR ? "" : talgoAxle(L - 1.4));
  return s + ends(c, 2.3, R - 0.4);
}
// The end car for the locomotive (o.cab false; its end round, grey, with
// the coupling) or the first-class cab car (o.cab), the end at the left.
function tlEnd(c, o) {
  const L = c.L, R = TL.endRoof, x1 = L - 0.3, cab = !!o.cab;
  const CAB = [[0, 3.6], [0, 5.9], [0.5, 8.3], [1.8, 10.2], [3.7, 11.6], [5.4, 12.25], [7.2, R]];
  const body = cab
    ? M([0.2, 2.3]) + L_([[x1, 2.3], [x1, TL.roof - 1.3]]) + `Q${r2(x1)} ${r2(TL.roof)} ${r2(x1 - 1.3)} ${r2(TL.roof)}L${r2(L - 6.5)} ${r2(TL.roof)}Q${r2(L - 9)} ${r2(TL.roof)} ${r2(L - 10)} ${r2(R)}` +
      L_([[7.2, R]]) + smooth([...CAB].reverse()) + L_([[0.2, 2.3]]) + "Z"
    : M([0.5, 2.3]) + L_([[x1, 2.3], [x1, TL.roof - 1.3]]) + `Q${r2(x1)} ${r2(TL.roof)} ${r2(x1 - 1.3)} ${r2(TL.roof)}L${r2(L - 6.5)} ${r2(TL.roof)}Q${r2(L - 9)} ${r2(TL.roof)} ${r2(L - 10)} ${r2(R)}L2.0 ${r2(R)}Q0.5 ${r2(R)} 0.5 ${r2(R - 1.6)}Z`;
  // The stripe: at the end section's height, then curving down behind the
  // door to the middle cars' level (Oebisfelde 2024; the cab car's side 2023).
  const st = cab ? 12.6 : L - 13.0;
  const stripe = path(M([-1, TL.endLo]) + L_([[st, TL.endLo]]) + smooth([[st, TL.endLo], [st + 4, TL.redLo + 0.1], [st + 8, TL.redLo]]) + L_([[L + 1, TL.redLo], [L + 1, TL.redHi], [st + 8, TL.redHi]]) +
    smooth([[st + 8, TL.redHi], [st + 4, TL.redHi + 0.1], [st, TL.endHi]]) + L_([[-1, TL.endHi]]) + "Z", DB.red);
  let paint = rect(-1, 0, L + 2, 20, DB.white) + rect(-1, 0, L + 2, 2.9, DB.skirt) + stripe;
  if (cab) paint += path(visor(CAB, 0.0, 3.6, 2.3, 0.05), "#1d2126") + path(`M3.7 11.6` + smooth([[3.7, 11.6], [2.9, 9.0], [2.6, 6.0], [2.7, 3.2]]), "none", 0, `stroke="${DB.seam}" stroke-width="0.6" vector-effect="non-scaling-stroke"`);
  else paint += rect(-1, 2.0, 1.35, R, "#7d848c") + rect(-1, 2.0, 0.9, R, "#6c737b");
  let s = shell(body, DB.white, paint);
  if (cab) {
    // The cab's side window and door (handrails beside it), the first-class
    // windows, the passenger door at the car's inner end.
    s += rect(4.8, 8.2, 1.6, 1.8, "#262b31", 0, 'rx="0.45" stroke="#111417" stroke-width="0.5" vector-effect="non-scaling-stroke"');
    s += rect(8.5, 4.15, 2.0, 6.55, "none", 0, 'rx="0.3" stroke="rgba(30,33,37,0.75)" stroke-width="0.6" vector-effect="non-scaling-stroke"') + line(7.9, 4.3, 7.9, 9.3, "#9aa1a8", 1.0) + line(11.1, 4.3, 11.1, 9.3, "#9aa1a8", 1.0);
    s += band(14.1, L - 6.2, TL.winLo, TL.winHi, { pitch: 11.6, from: 14.6, panes: 10.6 }) + tlDoor(c, L - 1.2 - TL.doorW, true, -1);
    s += letters(c, 15.6, TL.winHi + 0.55, 0.75, "1", "#2b3036", { weight: 600, family: DBFONT });
    s += dbMark(c, 0.55, 7.0, 0.6) + uicBuffers(0, -1, { sill: 3.55, beam: 1.9, end: 0.6 }) + lamp(0.15, 5.3, 0.4, 0.5) + lamp(0.15, 4.6, 0.36, 0.32, RED_LAMP);
  } else {
    // The window behind the end, the door, the second-class windows beyond
    // it, the bicycles' pictogram.
    // Its windows from behind the end to the door at its inner end; a
    // grille low near the end; the bicycles' pictogram by the door.
    const dx = L - 1.2 - TL.doorW;
    s += tlDoor(c, dx, false, -1);
    s += band(10.5, L - 8.0, TL.winLo + 0.3, TL.winHi + 0.3, { pitch: 9.6, from: 11.0, panes: 9.1 });
    s += letters(c, L - 6.6, TL.winHi + 0.55, 0.75, "2", "#2b3036", { weight: 600, family: DBFONT }) + bike(L - 6.6, 11.3, 1.0, "#7d848b");
    s += rect(4.6, 4.2, 3.4, 2.6, "none", 0, `rx="0.3" stroke="${DB.seam}" stroke-width="0.6" vector-effect="non-scaling-stroke"`) + slats(5.2, 5.6, 2.2, 0.8, 0.25, "rgba(0,0,0,0.3)");
    s += dbMark(c, L - 18, (TL.endLo + TL.endHi) / 2, 0.75) + uicBuffers(0, -1, { sill: 3.55, beam: 1.9 });
  }
  s += roofCover(cab ? 7.6 : 2.0, R, 9.0, 0.3, DB.roof, 2);
  s += truck(cab ? 6.9 : 13.0, { wb: 7.9, d: TL.wheel, top: 2.9 });
  // The single axle at its inner end: the next car draws it, unless this
  // car is the last of the train (drawn turned round) or stands alone.
  s += c.mirrored || !c.coupledR ? talgoAxle(L - 1.4) : "";
  return s + (c.coupledR ? gangway(L, 1, 2.3, TL.roof - 0.4) : "");
}
// The Vectrons in DB's ICE paint: white, the stripe and the DB mark low
// along the side, the frame grey, the cab's black windshield surround.
const NOSE_VECTRON = [[1.4, 4.1], [1.4, 7.3], ["q", 1.45, 8.3, 2.1, 9.0], [3.0, 12.3], ["q", 3.3, 12.9, 4.3, 12.9]];
const vecDB = (c, L) => rect(-1, 0, L + 2, 20, "#eef0f1") + rect(-1, 11.75, L + 2, 3, "#9aa1a8") + rect(-1, 0, L + 2, 4.75, "#3e4144") + rect(-1, 5.85, L + 2, 0.9, DB.red);
const v193 = (c) => euroLoco(c, {
  roof: 12.9, sill: 4.1, nose: NOSE_VECTRON, rake: [[2.1, 9.0], [3.0, 12.3]], centers: 32.5, door: 5.6, surround: "#1d2024",
  paint: vecDB, over: (cc, L) => rect(L / 2 - 1.1, 5.7, 2.2, 1.2, "#eef0f1") + dbMark(cc, L / 2, 6.3, 0.9), grilles: [],
});
// The Dual Mode (248): the diesel's big grilles behind one cab, the
// cooler's two at the other end, the roof's dark hoods.
const v248 = (c) => euroLoco(c, {
  roof: 12.9, sill: 4.1, nose: NOSE_VECTRON, rake: [[2.1, 9.0], [3.0, 12.3]], centers: 32.5, door: 5.6, surround: "#1d2024",
  paint: (cc, L) => vecDB(cc, L) + rect(-1, 11.2, L + 2, 3.5, "#4a4f55"),
  over: (cc, L) => rect(L / 2 - 1.1, 5.7, 2.2, 1.2, "#eef0f1") + dbMark(cc, L / 2, 6.3, 0.9) +
    rect(10.6, 8.3, 7.2, 2.6, "#2a2e33", 0, 'rx="0.2"') + lines([[10.8, 8.5, 17.6, 10.7], [10.8, 10.7, 17.6, 8.5]], "#cfd3d7", 1.6) +
    rect(L - 17.6, 4.9, 3.3, 6.0, "#55595f") + slats(L - 17.6, 4.9, 3.3, 6.0, 0.3, "rgba(255,255,255,0.18)") + rect(L - 13.9, 4.9, 3.3, 6.0, "#55595f") + slats(L - 13.9, 4.9, 3.3, 6.0, 0.3, "rgba(255,255,255,0.18)"),
  grilles: [], pans: true,
});

// ===================== Intercity: locomotives and IC coaches =====================
// The class 146.5 (Bombardier TRAXX P160 AC2, 2013-2015, 146 551-577, 18.9
// m) heads the first IC2 sets (146 556 at Bad Zwischenahn 2026, 146 560 at
// Leipzig 2026): light grey, the stripe along the side at mid height with
// the DB mark in it, the frame dark grey, the roof grey. The class 147.5
// and the IC2's double-deck cars are chintl.cars.js's (checked against
// Wiesbaden-Biebrich 2026 and Rostock 2026).
const NOSE_TRAXX = [[1.2, 4.1], [1.0, 7.7], ["q", 1.05, 8.6, 1.7, 9.1], [2.5, 12.2], ["q", 2.8, 12.9, 3.9, 12.9]];
const l146 = (c) => euroLoco(c, {
  roof: 12.9, sill: 4.1, nose: NOSE_TRAXX, rake: [[1.7, 9.1], [2.5, 12.2]], centers: 34.25, door: 5.4, wheel: 49, surround: "#25282c",
  paint: (cc, L) => rect(-1, 0, L + 2, 20, "#e3e5e6") + rect(-1, 11.6, L + 2, 3, "#9aa1a8") + rect(-1, 0, L + 2, 5.3, "#4d5258") + rect(-1, 7.6, L + 2, 0.85, DB.red),
  over: (cc, L) => rect(L * 0.3 - 1.1, 7.5, 2.2, 1.05, "#e3e5e6") + dbMark(cc, L * 0.3, 8.02, 0.9), grilles: [],
});
// The class 101 (Adtranz, 1996-1999, 19.1 m): Verkehrsrot, the frame and
// skirt dark grey, the roof grey; a small DB mark on the side (101 019 at
// München 2026, 101 056 at Appelhülsen 2019).
const NOSE_101 = [[1.3, 4.2], [1.0, 7.4], ["q", 1.05, 8.3, 1.8, 8.9], [3.2, 12.3], ["q", 3.6, 12.95, 4.8, 12.95]];
const l101 = (c) => euroLoco(c, {
  roof: 12.95, sill: 4.2, nose: NOSE_101, rake: [[1.8, 8.9], [3.2, 12.3]], centers: 32.5, door: 6.4, wheel: 49, surround: "#25282c",
  paint: (cc, L) => rect(-1, 0, L + 2, 20, DB.red) + rect(-1, 11.9, L + 2, 3, "#8f969d") + rect(-1, 0, L + 2, 5.6, "#4d5258"),
  over: (cc, L) => dbMark(cc, L * 0.62, 9.6, 0.85), grilles: [],
});
// IC coaches (UIC-Z, 26.4 m, 4.05 m high, bogies 19 m apart): light grey,
// the stripe under the windows, the windows separate, a folding door at
// each end (the class numeral beside it); the Bpmbdzf cab car (Bitterfeld
// 2024, Binz 2022): its cab's front grey, "IC" in grey letters behind the
// cab, the bicycles behind the door. The bistro car (ARkimbz): first class
// at one end, the bistro's windows at the other.
const ICC = { roof: 13.3, sill: 3.9, winLo: 7.25, winHi: 10.25, redLo: 5.85, redHi: 6.75 };
function icCoach(c, o) {
  const L = c.L, R = ICC.roof, x0 = 0.4, x1 = L - 0.4, t0 = (L - m(19.0)) / 2 + (o.cab ? 1.2 : 0), t1 = t0 + m(19.0);
  const cabL = o.cab;
  const body = cabL
    ? M([1.4, ICC.sill]) + L_([[x1, ICC.sill], [x1, R - 1.2]]) + `Q${r2(x1)} ${R} ${r2(x1 - 1.2)} ${R}L5.0 ${R}` + smooth([[5.0, R], [3.0, 12.5], [1.7, 10.6], [1.2, 8.6], [1.1, 6.0], [1.4, ICC.sill]]) + "Z"
    : M([x0, ICC.sill]) + L_([[x1, ICC.sill], [x1, R - 1.2]]) + `Q${r2(x1)} ${R} ${r2(x1 - 1.2)} ${R}L${r2(x0 + 1.2)} ${R}Q${r2(x0)} ${R} ${r2(x0)} ${r2(R - 1.2)}Z`;
  let paint = rect(-1, 0, L + 2, 20, "#e8eaec") + rect(-1, ICC.redLo, L + 2, ICC.redHi - ICC.redLo, DB.red) + rect(-1, R - 0.6, L + 2, 1, "#c9ced3");
  if (cabL) paint += path(M([-1, ICC.sill]) + L_([[3.0, ICC.sill], [3.4, 8.8], [4.2, 11.2], [6.2, R + 1], [-1, R + 1]]) + "Z", "#8d949b") + rect(-1, 8.6, 5.6, 2.3, "#22262b");
  let s = shell(body, "#e8eaec", paint);
  const door = (x) => rect(x, ICC.sill + 0.25, 2.6, 7.0, "none", 0, 'rx="0.25" stroke="rgba(30,33,37,0.7)" stroke-width="0.6" vector-effect="non-scaling-stroke"') + rect(x + 0.6, 7.3, 1.4, 2.6, "#262b31", 0, 'rx="0.2"');
  const dA = cabL ? 13.2 : 1.6, dB = L - 4.2;
  s += door(dA) + door(dB);
  const a = cabL ? 17.4 : 6.0, b = L - 6.0, p = o.cls === "1" ? 7.3 : 6.45, w = o.cls === "1" ? 5.4 : 4.7;
  const n = Math.floor((b - a - w) / p) + 1, from = a + (b - a - (n - 1) * p - w) / 2;
  for (let k = 0; k < n; k++) {
    if (o.bistro && k >= n - 3 && k < n - 1) continue;
    s += rect(from + k * p - 0.18, ICC.winLo - 0.18, w + 0.36, ICC.winHi - ICC.winLo + 0.36, "#1b1e22", 0, 'rx="0.5"') + rect(from + k * p, ICC.winLo, w, ICC.winHi - ICC.winLo, "#2c333b", 0, 'rx="0.4"') +
      rect(from + k * p + 0.15, ICC.winLo + 1.8, w - 0.3, 0.8, "#3d4752", 0, 'rx="0.15" opacity="0.6"');
  }
  // "IC" tall and narrow in slate grey at window height behind the cab
  // (Binz 2022).
  if (cabL) s += letters(c, 10.0, 8.9, 2.6, "IC", "#4f5a66", { weight: 600, family: DBFONT, stretch: 0.62 });
  if (o.cls) s += letters(c, dA + (cabL ? -0.9 : 3.5), 9.6, 1.0, o.cls, "#2b3036", { weight: 700, family: DBFONT }) + letters(c, dB - 0.9, 9.6, 1.0, o.cls, "#2b3036", { weight: 700, family: DBFONT });
  s += dbMark(c, L / 2, (ICC.redLo + ICC.redHi) / 2, 0.85);
  if (cabL) s += dbMark(c, 1.25, 7.0, 0.55) + lamp(1.2, 5.0, 0.4, 0.5) + lamp(1.2, 4.4, 0.36, 0.3, RED_LAMP);
  s += roofCover(L / 2 - 7, R, 14, 0.5, "#a9b0b7", 3);
  s += [t0, t1].map((x) => truck(x, { wb: 8.2, d: 36.2, top: ICC.sill })).join("");
  s += uicBuffers(L, 1, { sill: ICC.sill + 0.2 }) + uicBuffers(0, -1, { sill: ICC.sill + 0.2, end: cabL ? 0.9 : 0.6 });
  return s + (c.coupledL && !cabL ? gangway(0, -1, 4.2, 11.8) : "") + (c.coupledR ? gangway(L, 1, 4.2, 11.8) : "");
}

// ===================== Types, models =====================

export const TYPES = {}, MODELS = {};
const Mo = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
function add(key, type, draw, len, oneEnd = false) { TYPES[key] = type; MODELS[key] = Mo(draw, len, oneEnd); }
// A car with a cab or a one-sided layout: key (cab at the left) and key +
// "R" (turned round, for the middle of two coupled sets).
function addR(key, type, draw, len) { add(key, type, draw, len, true); add(`${key}R`, type, (c) => mirror(c, draw), len); }
const FIRST = { amenities: ["first"] };
const emu = (name, extra = {}) => ({ name, kind: "emu", ...extra });
const coach = (name, extra = {}) => ({ name, kind: "coach", ...extra });

// ICE 4
addR("ice4End1", emu("ICE 4 end car, first class", FIRST), (c) => ice4End(c, { cls: "1" }), m(29.106));
addR("ice4End2", emu("ICE 4 end car, second class, bicycles", { amenities: ["bikes"] }), (c) => ice4End(c, { cls: "2", bikes: true }), m(29.106));
add("ice4First", emu("ICE 4 first-class car", FIRST), (c) => ice4Mid(c, { cls: "1" }), m(28.75));
add("ice4FirstP", emu("ICE 4 first-class powercar", FIRST), (c) => ice4Mid(c, { cls: "1", power: true }), m(28.75));
add("ice4Bistro", emu("ICE 4 restaurant car (Bordrestaurant, first class beyond it)", { amenities: ["first", "dining"] }), (c) => ice4Mid(c, { cls: "1", bistro: true }), m(28.75));
add("ice4Service", emu("ICE 4 service powercar (family area, wheelchair places), pantograph", { pan: true }), (c) => ice4Mid(c, { cls: "2", power: true, pan: !!c.pan }), m(28.75));
add("ice4Second", emu("ICE 4 second-class car"), (c) => ice4Mid(c, { cls: "2" }), m(28.75));
add("ice4SecondP", emu("ICE 4 second-class powercar"), (c) => ice4Mid(c, { cls: "2", power: true }), m(28.75));
add("ice4Pan", emu("ICE 4 second-class car with pantograph", { pan: true }), (c) => ice4Mid(c, { cls: "2", pan: !!c.pan }), m(28.75));
// ICE 3: 403/406 (the old nose), 407 and 408 (the Velaro nose).
for (const [k, nose, endLen, label] of [["ice403", "403", m(25.835), "ICE 3 (403/406)"], ["ice407", "407", m(25.535), "ICE 3 (407, Velaro D)"], ["ice408", "407", m(25.675), "ICE 3neo (408)"]]) {
  addR(`${k}End1`, emu(`${label} end car, first class${nose === "403" ? ", lounge" : ""}`, FIRST), (c) => velaroEnd(c, { nose, cls: "1" }), endLen);
  addR(`${k}End2`, emu(`${label} end car, second class${nose === "403" ? ", lounge" : ""}`), (c) => velaroEnd(c, { nose, cls: "2" }), endLen);
  add(`${k}FirstPan`, emu(`${label} first-class car with pantograph (transformer car)`, { ...FIRST, pan: true }), (c) => velaroMid(c, { cls: "1", door: "L", pan: !!c.pan }), VE.mid);
  add(`${k}First`, emu(`${label} first-class car`, FIRST), (c) => velaroMid(c, { cls: "1", door: "R" }), VE.mid);
  add(`${k}Bistro`, emu(`${label} restaurant car`, { amenities: ["dining"] }), (c) => velaroMid(c, { cls: "2", door: "LR", bistro: true }), VE.mid);
  add(`${k}Second`, emu(`${label} second-class car`), (c) => velaroMid(c, { cls: "2", door: "L" }), VE.mid);
  add(`${k}SecondR`, emu(`${label} second-class car`), (c) => velaroMid(c, { cls: "2", door: "R" }), VE.mid);
  add(`${k}SecondPan`, emu(`${label} second-class car with pantograph (transformer car)`, { pan: true }), (c) => velaroMid(c, { cls: "2", door: "R", pan: !!c.pan }), VE.mid);
}
// ICE T
addR("iceTEnd1", emu("ICE T end car, first class, lounge", FIRST), (c) => iceTEnd(c, { cls: "1" }), m(27.45));
addR("iceTEnd2", emu("ICE T end car, second class, lounge"), (c) => iceTEnd(c, { cls: "2" }), m(27.45));
add("iceTFirst", emu("ICE T first-class car", FIRST), (c) => iceTMid(c, { cls: "1", door: "L" }), m(25.9));
add("iceTPan", emu("ICE T second-class car with pantograph (transformer car)", { pan: true }), (c) => iceTMid(c, { cls: "2", door: "R", pan: !!c.pan }), m(25.9));
add("iceTBistro", emu("ICE T bistro car (BordBistro)", { amenities: ["cafe"] }), (c) => iceTMid(c, { cls: "", door: "LR" }), m(25.9));
add("iceTSecond", emu("ICE T second-class car"), (c) => iceTMid(c, { cls: "2", door: "L" }), m(25.9));
// ICE 1 and ICE 2
add("ice1Power", { name: "ICE 1 power car (401)", kind: "electric", pan: true }, (c) => ic1Head(c, { kind: "401" }), m(20.56), true);
add("ice1First", coach("ICE 1 first-class car (801)", FIRST), (c) => ic1Car(c, { cls: "1", door: "R" }), m(26.4));
add("ice1Second", coach("ICE 1 second-class car (802)"), (c) => ic1Car(c, { cls: "2", door: "L" }), m(26.4));
add("ice1Service", coach("ICE 1 service car (803: second class, the crew's office, wheelchair places)"), (c) => ic1Car(c, { cls: "2", door: "R" }), m(26.4));
add("ice1Rest", coach("ICE 1 restaurant car (804, Bordrestaurant, raised roof)", { amenities: ["dining"] }), (c) => ic1Car(c, { cls: "", door: "R", rest: true }), m(26.4));
add("ice2Power", { name: "ICE 2 power car (402)", kind: "electric", pan: true }, (c) => ic1Head(c, { kind: "402" }), m(20.56), true);
add("ice2PowerR", { name: "ICE 2 power car (402)", kind: "electric", pan: true }, (c) => mirror(c, (h) => ic1Head(h, { kind: "402" })), m(20.56));
add("ice2First", coach("ICE 2 first-class car (805)", FIRST), (c) => ic1Car(c, { cls: "1", door: "R" }), m(26.4));
add("ice2Bistro", coach("ICE 2 service car with the Bordrestaurant (807)", { amenities: ["dining"] }), (c) => ic1Car(c, { cls: "", door: "L", bistro: true }), m(26.4));
add("ice2Second", coach("ICE 2 second-class car (806)"), (c) => ic1Car(c, { cls: "2", door: "L" }), m(26.4));
addR("ice2Cab", coach("ICE 2 driving trailer (808), second class", { cab: true }), (c) => ic1Head(c, { kind: "808" }), m(26.4) + 6);
// ICE L and its locomotives
add("iceLEnd", coach("ICE L end car for the locomotive (Bpdz), second class, bicycles", { amenities: ["bikes"] }), (c) => tlEnd(c, {}), m(18.3), true);
add("iceLSecond", coach("ICE L second-class car (Bpz)"), (c) => tlMid(c, { cls: "2" }), m(13.3));
add("iceLAccess", coach("ICE L barrier-free car (Bpbsz: wheelchair places)"), (c) => tlMid(c, { cls: "2", dbm: true }), m(13.3));
add("iceLBistro", coach("ICE L bistro car (WRz)", { amenities: ["cafe"] }), (c) => tlMid(c, { cls: "", bistro: true }), m(13.3));
add("iceLFirst", coach("ICE L first-class car (Apz)", FIRST), (c) => tlMid(c, { cls: "1" }), m(13.3));
add("iceLCab", coach("ICE L cab car (Apzf), first class", { cab: true, ...FIRST }), (c) => tlEnd(c, { cab: true }), m(18.3), true);
add("de193", { name: "Siemens Vectron (193) in DB's ICE L paint", kind: "electric", pan: true }, v193, m(18.98));
add("de248", { name: "Siemens Vectron Dual Mode (248) in DB's ICE L paint", kind: "electric", pan: true }, v248, m(19.98));
// Intercity
add("de146", { name: "DB class 146.5 (TRAXX P160 AC2) electric locomotive", kind: "electric", pan: true }, l146, m(18.9));
add("de101", { name: "DB class 101 electric locomotive", kind: "electric", pan: true }, l101, m(19.1));
add("icFirst", coach("IC first-class coach (Apmz)", FIRST), (c) => icCoach(c, { cls: "1" }), m(26.4));
add("icBistro", coach("IC bistro car (ARkimbz: first class and the bistro)", { amenities: ["first", "cafe"] }), (c) => icCoach(c, { cls: "1", bistro: true }), m(26.4));
add("icSecond", coach("IC second-class coach (Bpmz)"), (c) => icCoach(c, { cls: "2" }), m(26.4));
add("icCab", coach("IC cab car (Bpmbdzf: second class, bicycles)", { cab: true, amenities: ["bikes"] }), (c) => icCoach(c, { cls: "2", cab: true }), m(26.8), true);
for (const k of ["de147", "deIc2First", "deIc2Second", "deIc2Cab"]) if (CHI_TYPES?.[k] && CHI_MODELS?.[k]) { TYPES[k] = CHI_TYPES[k]; MODELS[k] = CHI_MODELS[k]; }

// ---------- Fleets ----------
// [first, last, type] over the 12-digit European Vehicle Number, from the
// vehicles' lettering in the photographs and the classes' Wikipedia pages:
// ICE 4 "93 80 5812 022-3" (the class in the four digits: 0812 the first-
// class end car, 5812 the other, 1412 a first-class powercar...), ICE 1
// "93 80 5804 055-2" (801 first class, 802 second, 803 service, 804
// restaurant; the power cars 5401), ICE 2 402 021 "93 80 5402 021-0" (805-
// 808 its cars), ICE 3neo Tz 8047, the 193 "91 80 6193 440-5", the 248
// "90 80 2248 515-9", the 146.5 "91 80 6146 556-6", the 101 "91 80 6101".
const evn = (prefix8) => [Number(`${prefix8}0000`), Number(`${prefix8}9999`)];
const R = (prefix8, key) => [...evn(prefix8), key];
export const FLEETS = {
  dbfv: [
    R("93800812", "ice4End1"), R("93806812", "ice4End1"), R("93805812", "ice4End2"), R("93807812", "ice4End2"), R("93801812", "ice4First"), R("93801412", "ice4FirstP"),
    R("93808812", "ice4Bistro"), R("93806412", "ice4Service"), R("93807412", "ice4Service"), R("93809812", "ice4Second"), R("93802412", "ice4SecondP"),
    R("93803412", "ice4SecondP"), R("93804812", "ice4Pan"), R("93803812", "ice4Pan"),
    R("93805401", "ice1Power"), R("93805801", "ice1First"), R("93805802", "ice1Second"), R("93805803", "ice1Service"), R("93805804", "ice1Rest"),
    R("93805402", "ice2Power"), R("93805805", "ice2First"), R("93805806", "ice2Second"), R("93805807", "ice2Bistro"), R("93805808", "ice2Cab"),
    R("91806193", "de193"), R("90802248", "de248"), R("91806146", "de146"), R("91806101", "de101"), R("91806147", "de147"),
  ],
};

// ---------- Typical trains ----------
// No formations are published for DB's trains (RIS::Transports is for
// railways only), so each train is drawn as what usually runs on it: the
// class by the line in DB's 2026 timetable (de.wikipedia "Liste der ICE-
// Linien" and "Liste der Intercity-Linien", October 2026), told apart by the
// train's stops and its ends.
const set = (label, ...units) => ({ label, units });
const turn = (s, label = s.label) => ({ label, units: [...s.units].reverse().map(([k, n]) => [/End\d?$|Cab$/.test(k) ? `${k}R` : /End\dR$|CabR$/.test(k) ? k.slice(0, -1) : k, n]) });
const ICE4_13 = set("ICE 4, thirteen cars (first class and the restaurant at one end, the bicycles in the end car at the other; some trains twelve cars)",
  ["ice4End2", 1], ["ice4SecondP", 3], ["ice4Pan", 1], ["ice4SecondP", 2], ["ice4Second", 1], ["ice4Service", 1], ["ice4Bistro", 1], ["ice4FirstP", 1], ["ice4First", 1], ["ice4End1", 1]);
const ICE4_12 = set("ICE 4, twelve cars (first class and the restaurant at one end, the bicycles in the end car at the other; some trains thirteen)",
  ["ice4End2", 1], ["ice4SecondP", 2], ["ice4Pan", 1], ["ice4SecondP", 2], ["ice4Second", 1], ["ice4Service", 1], ["ice4Bistro", 1], ["ice4FirstP", 1], ["ice4First", 1], ["ice4End1", 1]);
const ICE4_7 = set("ICE 4, seven cars (often two coupled)", ["ice4End2", 1], ["ice4SecondP", 1], ["ice4Pan", 1], ["ice4SecondP", 1], ["ice4Service", 1], ["ice4Bistro", 1], ["ice4End1", 1]);
const v8 = (k, label) => set(label, [`${k}End1`, 1], [`${k}FirstPan`, 1], [`${k}First`, 1], [`${k}Bistro`, 1], [`${k}Second`, 1], [`${k}SecondR`, 1], [`${k}SecondPan`, 1], [`${k}End2`, 1]);
const ICE403 = v8("ice403", "ICE 3 (class 403 or 406), eight cars: first class and the lounge at one end (some trains two sets coupled)");
const ICE407 = v8("ice407", "ICE 3 (class 407, Velaro D), eight cars: first class at one end");
const ICE408 = v8("ice408", "ICE 3neo (class 408), eight cars: first class at one end (some trains two sets coupled)");
const ICE408_2 = set("ICE 3neo (class 408), two sets coupled", ...ICE408.units, ...turn(ICE408).units);
const ICET7 = set("ICE T (class 411), seven cars: first class and a lounge at one end (often two coupled)",
  ["iceTEnd1", 1], ["iceTFirst", 1], ["iceTPan", 1], ["iceTBistro", 1], ["iceTSecond", 1], ["iceTPan", 1], ["iceTEnd2", 1]);
const ICET5 = set("ICE T (class 415), five cars", ["iceTEnd1", 1], ["iceTPan", 1], ["iceTBistro", 1], ["iceTSecond", 1], ["iceTEnd2", 1]);
const ICE1 = set("ICE 1 (class 401): two power cars and nine cars since its redesign (first class at one end, the restaurant under its raised roof)",
  ["ice1Power", 1], ["ice1First", 2], ["ice1Rest", 1], ["ice1Service", 1], ["ice1Second", 5], ["ice1Power", 1]);
const ice2Half = [["ice2Power", 1], ["ice2First", 2], ["ice2Bistro", 1], ["ice2Second", 3], ["ice2CabR", 1]];
const ICE2 = set("ICE 2 (class 402): a power car, six cars and the driving trailer", ...ice2Half.slice(0, 4), ["ice2Second", 3], ["ice2CabR", 1]);
const ICE2_2 = set("ICE 2 (class 402), two sets coupled cab car to cab car (split on the way)",
  ...ice2Half, ["ice2Cab", 1], ["ice2Second", 3], ["ice2Bistro", 1], ["ice2First", 2], ["ice2Power", 1]);
const iceL = (loco, label) => set(label, [loco, 1], ["iceLEnd", 1], ["iceLSecond", 11], ["iceLAccess", 1], ["iceLBistro", 1], ["iceLFirst", 2], ["iceLCab", 1]);
const ICEL = iceL("de193", "ICE L (Talgo 230): a Vectron and seventeen cars, first class and the cab car at the far end");
const ICEL_DM = iceL("de248", "ICE L (Talgo 230): a Vectron Dual Mode (diesel off the wires) and seventeen cars");
const ICE407P = set("Paris train (ICE 95xx, run with SNCF as Alleo): DB's ICE 3 (class 407), or SNCF's TGV Duplex on some trains",
  ...ICE407.units);
const IC2_147 = set("Intercity 2 (Twindexx): a class 147.5, first class next to it, three second-class cars and the cab car (some trains with more cars or two sets)",
  ["de147", 1], ["deIc2First", 1], ["deIc2Second", 3], ["deIc2Cab", 1]);
const IC2_146 = set("Intercity 2 (Twindexx): a class 146.5, first class next to it, three second-class cars and the cab car (some trains with more cars)",
  ["de146", 1], ["deIc2First", 1], ["deIc2Second", 3], ["deIc2Cab", 1]);
const ICL1 = set("Intercity: a class 101 with IC coaches (first class, the bistro, second class) and the cab car at the other end",
  ["de101", 1], ["icFirst", 1], ["icBistro", 1], ["icSecond", 5], ["icCab", 1]);
const SETS = { ICE407P, ICE4_13, ICE4_12, ICE4_7, ICE403, ICE407, ICE408, ICE408_2, ICET7, ICET5, ICE1, ICE2, ICE2_2, ICEL, ICEL_DM, IC2_147, IC2_146, IC: ICL1 };
export const SAMPLE_SETS = SETS;
const num = (t) => Number(String(t.number || "").replace(/\D/g, "")) || 0;
// A car shown alone (a fleet page's sample): the set it runs in.
const setOf = (key) => Object.values(SETS).find((x) => x.units.some(([k]) => k.replace(/R$/, "") === String(key).replace(/R$/, ""))) || null;
// The ICE L's own trains in its first year (de.wikipedia "ICE L": ICE 1548,
// 1055, 1540, 1148 Berlin-Köln; 872, 1704 Berlin-Hamburg; 2013 Köln-
// Oberstdorf; 2374 Hamburg-Westerland), and every ICE to Westerland or
// Oberstdorf (lines 33 and the Allgäu, where only the ICE L runs).
const ICEL_NUMBERS = new Set([1548, 1055, 1540, 1148, 1549, 1054, 1541, 1149, 872, 873, 1704, 1705, 2013, 2012, 2374, 2375]);
export const TYPICAL = {
  dbfv: (t, reported) => {
    const r = String(t.route || "").toUpperCase(), n = num(t);
    if (!r && reported) return setOf(reported);
    const stops = (t.stops || []).map((x) => x.name || "").join("|");
    const ends = `${t.origin || ""}|${t.destination || ""}`;
    const all = `${stops}|${ends}`;
    const has = (re) => re.test(all), end = (re) => re.test(ends);
    if (r === "EC" && n >= 9550 && n < 9600) return ICE407P;
    if (r === "IC" || r === "EC") {
      // DB's ICs in 2026 are its Twindexx sets (de.wikipedia "Liste der
      // Intercity-Linien", October 2026; the 101-hauled IC 51 ended on 20
      // September 2026): 146.5s on the Norddeich-Emden-Bremen/Oldenburg-
      // Hannover-Leipzig sets (IC 56), 147.5s elsewhere (IC 17, 18, 35, 55,
      // 57, 61, 87).
      if (has(/Norddeich|Emden|Oldenburg|Bremen/) && !has(/Münster|Rheine|Köln/)) return IC2_146;
      return IC2_147;
    }
    if (r !== "ICE" && r !== "ICE SPRINTER" && !/^ICE/.test(r)) return reported ? setOf(reported) : null;
    // The ICE L: its trains, Westerland, Oberstdorf (off the wires: the
    // Dual Mode Vectron).
    if (end(/Westerland|Oberstdorf/) || has(/Westerland|Oberstdorf|Niebüll|Husum|Kempten|Immenstadt/)) return ICEL_DM;
    if (ICEL_NUMBERS.has(n) && has(/Berlin|Hamburg/)) return ICEL;
    // Line 91's ICE Ts (ICE 20-29, 90-99: Dortmund/Hamburg-Wien, shown
    // in Germany as far as the border).
    if (n >= 20 && n < 30 || n >= 90 && n < 100) return ICET7;
    // Abroad: Amsterdam, Brussels (3neo); Paris (407); Switzerland (ICE 4);
    // Wien via Passau (ICE T); Innsbruck and Bregenz (ICE 4 per line 62).
    if (has(/Amsterdam|Utrecht|Arnhem|Bruxelles|Brussel|Liège|Luik|Antwerpen|Aachen Hbf\|Liège/)) return ICE408;
    if (has(/Paris/)) return ICE407;
    if (has(/Basel|Zürich|Chur|Interlaken|Brig|Bern\b/)) return has(/Ulm|München/) && !has(/Mannheim|Frankfurt/) ? ICE403 : ICE4_13;
    if (has(/Passau|Linz|Wien/)) return ICET7;
    if (has(/Innsbruck|Bregenz|Salzburg|Kufstein|Wörgl/)) return has(/Kufstein|Wörgl/) ? ICE1 : ICE4_12;
    // Line 47 (Dortmund-Köln Messe/Deutz-Frankfurt Flughafen-Stuttgart-
    // München) and Norddeich-Stuttgart: ICE 3neo.
    if (has(/Norddeich/) || has(/Köln Messe\/Deutz|Köln Messe/) && has(/Stuttgart/) && !has(/Frankfurt \(Main\) Hbf|Hamburg|Bremen/)) return ICE408;
    // Lines 41, 45, 49 (Köln-Frankfurt high-speed line to Frankfurt,
    // Nürnberg-München, Wiesbaden-Stuttgart), line 60 (Basel/Karlsruhe-
    // Stuttgart-München), the Berlin-Nürnberg-München sprinter (29) and the
    // Berlin-Stuttgart sprinter: ICE 3.
    if (has(/Montabaur|Limburg Süd|Siegburg\/Bonn/)) return has(/Hamburg|Bremen/) ? ICE4_12 : ICE403;
    if (has(/Ulm/) && has(/Karlsruhe/) && !has(/Mannheim|Frankfurt/)) return ICE403;
    if (has(/Berlin/) && has(/Erfurt/) && has(/München/) && !has(/Leipzig|Coburg|Bamberg|Augsburg/)) return ICE403;
    if (has(/Berlin/) && has(/Stuttgart/) && has(/Nürnberg/)) return ICE403;
    // Line 11 (Berlin-Leipzig-Erfurt-Frankfurt-Stuttgart-München), 12 and
    // 20 (to Basel), 22 partly, 25 (Hamburg-Würzburg-Nürnberg-München), 28
    // (Berlin-Leipzig-Erfurt-Coburg-Nürnberg-München), 42, 43, 62: ICE 4.
    if (has(/Erfurt/) && has(/Frankfurt/) && has(/Stuttgart|Augsburg/)) return ICE4_13;
    if (has(/Hamburg|Bremen/) && has(/Münster/) && has(/Köln/) && has(/Stuttgart|München|Mannheim|Karlsruhe|Basel/)) return ICE4_13;
    if (has(/Hamburg/) && has(/Würzburg/) && has(/Nürnberg/) && has(/München/)) return ICE4_13;
    if (has(/Coburg/)) return ICE4_13;
    if (has(/Frankfurt/) && has(/Heidelberg|Stuttgart/) && has(/München/) && !has(/Hamburg|Berlin|Köln/)) return ICE4_12;
    // Line 18 (Hamburg-Berlin-Halle-Erfurt-Nürnberg-München), 13 (Berlin-
    // Kassel-Frankfurt Süd/Flughafen), 15 (Binz/Berlin-Erfurt-Frankfurt-
    // Saarbrücken), 22 (Kiel-Hamburg-Frankfurt-Stuttgart), 24 (Hamburg-
    // Würzburg-Augsburg-München), 26 (Bremen-Kassel-Frankfurt-Karlsruhe),
    // 33 (Westerland/Binz-Hamburg-Bremen-Köln): ICE 1.
    if (has(/Halle/) && has(/Erfurt/) && has(/Nürnberg|Frankfurt|Saarbrücken/)) return ICE1;
    if (has(/Binz|Stralsund|Greifswald/)) return has(/Köln|Bremen/) ? ICEL : ICE1;
    if (has(/Kiel/) || has(/Braunschweig/) && has(/Kassel/)) return ICE1;
    if (has(/Donauwörth|Ansbach/)) return ICE1;
    if (has(/Oldenburg|Bremen/) && has(/Kassel|Frankfurt|Karlsruhe/)) return ICE1;
    // Line 50 (Dresden-Leipzig-Erfurt-Frankfurt-Wiesbaden), 51 (Leipzig-
    // Kassel-Dortmund-Köln), 28's Jena branch: ICE T.
    if (has(/Dresden/) && has(/Erfurt/) || has(/Jena/) || has(/Paderborn/) && has(/Erfurt|Kassel/)) return ICET7;
    // Line 10 (Berlin-Hannover-Hamm-Ruhr-Köln, split at Hamm) and 19:
    // ICE 2s coupled, or the seven-car ICE 4s; line 14 (Berlin-Köln-Aachen):
    // ICE T; line 16 (Berlin-Hannover-Bremen): ICE 1.
    if (has(/Berlin/) && has(/Hannover|Hamm|Bielefeld/) && has(/Köln|Düsseldorf|Essen|Dortmund|Bonn|Koblenz/))
      return has(/Aachen|Mönchengladbach|Krefeld|Osnabrück/) ? ICET7 : has(/Hagen|Wuppertal/) ? ICE4_7 : ICE2_2;
    if (has(/Berlin/) && has(/Bremen/)) return ICE1;
    // The sprinters and the rest: Hamburg-Köln (ICE 1), Berlin-Frankfurt
    // (ICE 1), Hamburg-Hannover-Frankfurt (ICE 4), Berlin-Hamburg (ICE 4).
    if (has(/Hamburg/) && has(/Frankfurt/)) return ICE4_12;
    if (has(/Hamburg/) && has(/Berlin/)) return ICE4_12;
    if (has(/Hamburg/) && has(/Köln|Düsseldorf/)) return ICE1;
    if (has(/Berlin/) && has(/Frankfurt/)) return ICE1;
    if (has(/Köln|Düsseldorf|Dortmund|Essen/) && has(/Frankfurt|Nürnberg|München/)) return ICE403;
    if (reported) return setOf(reported);
    return ICE4_12;
  },
};

// ---------- Fact sheets ----------
const DEWP = "https://de.wikipedia.org/wiki/";
const ICE4F = { model: "Siemens ICE 4 (DB class 412)", type: "High-speed electric multiple unit", builder: "Siemens Mobility (Bombardier car bodies)", built: "2017–2024",
  fleet: "137 sets: 50 of 12 cars, 50 of 13, 37 of 7", topSpeedMph: 165, lengthFt: 94.3, source: `${DEWP}DB-Baureihe_412` };
const V403F = { model: "Siemens ICE 3 (DB classes 403 and 406)", type: "High-speed electric multiple unit", builder: "Siemens and Adtranz", built: "1999–2004", topSpeedMph: 186, lengthFt: 81.3, source: `${DEWP}DB-Baureihe_403` };
const V407F = { model: "Siemens Velaro D (DB class 407)", type: "High-speed electric multiple unit", builder: "Siemens Mobility", built: "2011–2024", fleet: "17 sets", topSpeedMph: 199, lengthFt: 81.3, source: `${DEWP}DB-Baureihe_407` };
const V408F = { model: "Siemens Velaro MS (DB class 408, ICE 3neo)", type: "High-speed electric multiple unit", builder: "Siemens Mobility", built: "2022 on", fleet: "90 sets ordered", topSpeedMph: 199, lengthFt: 81.3, source: `${DEWP}DB-Baureihe_408` };
const ITF = { model: "ICE T (DB classes 411 and 415)", type: "Tilting electric multiple unit", builder: "Siemens, Alstom (LHB), Bombardier (DWA)", built: "1999–2006", fleet: "60 seven-car and 11 five-car sets",
  topSpeedMph: 143, lengthFt: 85.0, source: `${DEWP}DB-Baureihe_411` };
const I1F = { model: "ICE 1 (DB class 401)", type: "High-speed train", builder: "Krauss-Maffei, Krupp, Thyssen-Henschel (power cars); Duewag, LHB, MAN, Waggon-Union (cars)", built: "1989–1993",
  fleet: "58 sets, nine cars each since the second redesign", topSpeedMph: 174, lengthFt: 86.6, source: `${DEWP}DB-Baureihe_401` };
const I2F = { model: "ICE 2 (DB class 402)", type: "High-speed train (power car, six cars, driving trailer)", builder: "Siemens, Krupp, Krauss-Maffei; Duewag, LHB", built: "1995–1997",
  fleet: "44 half-sets built, 26 in service (2026)", topSpeedMph: 174, lengthFt: 86.6, source: `${DEWP}DB-Baureihe_402` };
const ILF = { model: "Talgo 230 (DB ICE L)", type: "Articulated passenger train", builder: "Talgo", built: "2023 on", fleet: "79 seventeen-car sets ordered", topSpeedMph: 143, source: `${DEWP}ICE_L` };
const ICCF = { model: "IC coach (UIC-Z)", type: "Passenger coach", builder: "Various (DB's IC fleet, rebuilt)", lengthFt: 86.6, topSpeedMph: 124, source: `${DEWP}Intercity_(Deutsche_Bahn)` };
export const FACTS = {
  ice4End1: { ...ICE4F, lengthFt: 95.5, about: "The ICE 4's first-class end car, with the cab. ICE 4s run DB's busiest lines: Hamburg–Frankfurt–Basel and on to Switzerland, Berlin–Erfurt–München, Hamburg–Köln–Stuttgart." },
  ice4End2: { ...ICE4F, lengthFt: 95.5, about: "The second-class end car, where the ICE 4 carries its eight bicycles." },
  ice4First: { ...ICE4F, about: "A first-class car of the ICE 4." },
  ice4FirstP: { ...ICE4F, about: "A first-class powercar: its own traction gear under the floor, as half the ICE 4's cars have." },
  ice4Bistro: { ...ICE4F, about: "The Bordrestaurant, with first-class seats beyond it." },
  ice4Service: { ...ICE4F, about: "The service car: the family area, the small children's compartment, the wheelchair places and a pantograph." },
  ice4Second: { ...ICE4F, about: "A second-class car of the ICE 4." },
  ice4SecondP: { ...ICE4F, about: "A second-class powercar of the ICE 4." },
  ice4Pan: { ...ICE4F, about: "A second-class car with the transformer and one of the train's two pantographs." },
  ice403End1: { ...V403F, lengthFt: 84.8, about: "The first-class end car of the first ICE 3s, with the lounge: passengers see the line through the glass behind the driver. The 403s and 406s run Köln–Frankfurt–Nürnberg–München, Wiesbaden–Stuttgart and Basel–Stuttgart–München." },
  ice403End2: { ...V403F, lengthFt: 84.8, about: "The second-class end car, with its lounge behind the cab." },
  ice407End1: { ...V407F, lengthFt: 83.8, about: "The Velaro D's first-class end car. The 407s run Frankfurt and Stuttgart–Paris with SNCF." },
  ice407End2: { ...V407F, lengthFt: 83.8, about: "The Velaro D's second-class end car." },
  ice408End1: { ...V408F, lengthFt: 84.2, about: "The ICE 3neo's first-class end car. The 3neos run Amsterdam and Brussels to Köln and Frankfurt, Amsterdam–Berlin and Dortmund–Köln–Frankfurt Flughafen–München." },
  ice408End2: { ...V408F, lengthFt: 84.2, about: "The ICE 3neo's second-class end car." },
  iceTEnd1: { ...ITF, lengthFt: 90.1, about: "The ICE T's first-class end car with the lounge behind the cab. ICE Ts tilt through the curves of Dresden–Leipzig–Frankfurt, Leipzig–Köln and Dortmund–Nürnberg–Wien." },
  iceTEnd2: { ...ITF, lengthFt: 90.1, about: "The ICE T's second-class end car, with its own lounge." },
  iceTFirst: { ...ITF, about: "A first-class car of the ICE T." },
  iceTPan: { ...ITF, about: "A second-class car with a transformer and pantograph." },
  iceTBistro: { ...ITF, about: "The BordBistro car." },
  iceTSecond: { ...ITF, about: "A second-class car of the ICE T." },
  ice1Power: { ...I1F, type: "High-speed power car", lengthFt: 67.5, powerHp: 6464, about: "The first ICE's power car, at each end of the train. ICE 1s run Hamburg–Berlin–München, Berlin–Frankfurt, Kiel–Hamburg–Frankfurt–Stuttgart and more." },
  ice1First: { ...I1F, about: "A first-class car of the ICE 1." },
  ice1Second: { ...I1F, about: "A second-class car of the ICE 1." },
  ice1Service: { ...I1F, about: "The service car: the crew's office, the wheelchair places and second-class seats." },
  ice1Rest: { ...I1F, about: "The Bordrestaurant, under the raised roof the ICE 1 is known by, with windows up into it." },
  ice2Power: { ...I2F, type: "High-speed power car", lengthFt: 67.5, powerHp: 6464, about: "The ICE 2's single power car; the driving trailer is at the train's other end, and two sets often run coupled, split on the way (Berlin–Hamm–Köln)." },
  ice2PowerR: { ...I2F, type: "High-speed power car", lengthFt: 67.5, about: "The ICE 2's power car." },
  ice2First: { ...I2F, about: "A first-class car of the ICE 2." },
  ice2Bistro: { ...I2F, about: "The service car with the Bordrestaurant." },
  ice2Second: { ...I2F, about: "A second-class car of the ICE 2." },
  ice2Cab: { ...I2F, lengthFt: 92.6, about: "The ICE 2's driving trailer: second class behind a cab shaped like the power car's nose." },
  iceLEnd: { ...ILF, lengthFt: 60.0, about: "Car 1, behind the locomotive: second class and the bicycles. The ICE L runs since December 2025: Berlin–Köln, Berlin and Hamburg–Westerland, Köln and Dortmund–Oberstdorf." },
  iceLSecond: { ...ILF, lengthFt: 43.6, about: "A short second-class car on Talgo's single axles, its floor level with the platforms (76 cm)." },
  iceLAccess: { ...ILF, lengthFt: 43.6, about: "Car 13, barrier-free: three wheelchair places." },
  iceLBistro: { ...ILF, lengthFt: 43.6, about: "Car 14, the bistro." },
  iceLFirst: { ...ILF, lengthFt: 43.6, about: "A first-class car (15, 16)." },
  iceLCab: { ...ILF, lengthFt: 60.0, about: "Car 17, the cab car, first class; the locomotive pushes from the other end." },
  de193: { model: "Siemens Vectron MS (193)", type: "Electric locomotive", builder: "Siemens Mobility", built: "2010s on", topSpeedMph: 124, lengthFt: 62.3, source: `${DEWP}ICE_L`,
    about: "DB's Vectrons in the ICE L's white, hauling it at up to 200 km/h until Talgo's own locomotives arrive." },
  de248: { model: "Siemens Vectron Dual Mode (248)", type: "Electric and diesel locomotive", builder: "Siemens Mobility", topSpeedMph: 99, lengthFt: 65.6, source: `${DEWP}ICE_L`,
    about: "Electric under the wires, diesel beyond them: it takes the ICE L to Westerland and Oberstdorf (since April 2026)." },
  de146: { model: "Bombardier TRAXX P160 AC2 (DB class 146.5)", type: "Electric locomotive", builder: "Bombardier (now Alstom)", built: "2013–2015", fleet: "27, 146 551–577", topSpeedMph: 99, lengthFt: 62.0,
    source: `${DEWP}DB-Baureihe_146`, about: "The first Intercity 2 sets' locomotive, on Norddeich–Bremen–Hannover–Leipzig." },
  de101: { model: "Adtranz class 101", type: "Electric locomotive", builder: "Adtranz", built: "1996–1999", fleet: "145 built", topSpeedMph: 137, lengthFt: 62.7, source: `${DEWP}DB-Baureihe_101`,
    about: "The locomotive of DB's classic Intercitys with their IC coaches, fewer every year." },
  icFirst: { ...ICCF, about: "A first-class IC coach (Apmz), open saloon and compartments." },
  icBistro: { ...ICCF, about: "The bistro car (ARkimbz): first class at one end, the bistro counter at the other." },
  icSecond: { ...ICCF, about: "A second-class IC coach (Bpmz)." },
  icCab: { ...ICCF, lengthFt: 87.9, about: "The cab car (Bpmbdzf) at the other end from the locomotive: second class and the bicycles behind the cab." },
};
for (const k of ["ice403", "ice407", "ice408"]) {
  const F = { ice403: V403F, ice407: V407F, ice408: V408F }[k];
  Object.assign(FACTS, {
    [`${k}FirstPan`]: { ...F, about: "A first-class car with a transformer and pantograph." },
    [`${k}First`]: { ...F, about: "A first-class car." },
    [`${k}Bistro`]: { ...F, about: "The restaurant car, a door at each end." },
    [`${k}Second`]: { ...F, about: "A second-class car." },
    [`${k}SecondR`]: { ...F, about: "A second-class car." },
    [`${k}SecondPan`]: { ...F, about: "A second-class car with a transformer and pantograph." },
  });
}
for (const k of Object.keys(FACTS)) if (TYPES[`${k}R`] && !FACTS[`${k}R`]) FACTS[`${k}R`] = FACTS[k];
