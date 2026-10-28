// The foreign railways' trains in Switzerland (scripts/railroads/switzerland.py,
// railroad "chintl"): DB's ICE 4s, TGV Lyria, ÖBB's railjets and Nightjets,
// and the other trains that cross the border. Trainsheet's own side views,
// from published dimensions and recent photographs (Wikimedia Commons,
// 2024-2026), at the shared scale (js/carart.js), each in its railroad's
// current paint, lettered here (no logo files).

import { newId } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, poly, truck, pantograph, slats } from "../carart.js?v=dev";
import { letters, roofCover, panGear, lamp, RED_LAMP, wiper, buffers, boxes } from "./digitraffic.cars.js?v=dev";
import { euroLoco, unit, taurus, twinEnded, buffers as uicBuffers, hvac as czHvac } from "./czechia.cars.js?v=dev";
// SBB's Re 460 and its EC coach, as drawn in sbb.cars.js (the Transalpin's
// Swiss end).
import { TYPES as SBB_TYPES, MODELS as SBB_MODELS } from "./sbb.cars.js?v=dev";
// DB's ICE logo (from DB's own ICE-Logo.svg).
import { iceLogo } from "./icelogo.js?v=dev";

const r2 = (v) => Math.round(v * 100) / 100;
const FT = 3.2808; // feet in a metre
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
const NARROW = "Roboto Condensed, Arial Narrow, Helvetica Neue Condensed, Helvetica Neue, Arial, sans-serif";

// ---------- Shared parts ----------

// A smooth curve through points (Catmull-Rom as cubic Béziers), for the
// streamlined noses: the path's "C" segments after its first point.
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

// A body: its outline filled with the base color, the paint (drawn freely,
// clipped to the outline) shaded a little for depth as carmodels.js's
// bodies are, and the outline in the theme's ink.
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
    `<g clip-path="url(#${id})">${paint}<rect x="-5" y="${lo}" width="220" height="${r2(hi - lo)}" fill="url(#${id}-s)"/></g>` + path(d, "none", 0.8);
}
// The rubber gangway cover between two cars of a train, from floor to top,
// and the coupler under it; side -1 at the left end, 1 at the right.
function gangway(xFace, side, floor, top, fill = C.rubber) {
  const w = 0.8, x = side < 0 ? xFace : xFace - w;
  return rect(x, floor, w, top - floor, fill, 0, 'rx="0.2"') + lines([[x + 0.27, floor + 0.3, x + 0.27, top - 0.3], [x + 0.54, floor + 0.3, x + 0.54, top - 0.3]], "#3a3f45", 0.6);
}
const ends = (c, floor, top, fill) => (c.coupledL ? gangway(0, -1, floor, top, fill) : "") + (c.coupledR ? gangway(c.L, 1, floor, top, fill) : "");
// A body bottom running along at y between a and b, rising into an arch
// over each truck (centers xs, half-width w, up to y1): points, left to right.
function bottom(a, b, y, xs, w, y1) {
  const pts = [[a, y]];
  for (const x of xs) pts.push([x - w, y], [x - w + 0.6, y1], [x + w - 0.6, y1], [x + w, y]);
  return [...pts, [b, y]];
}
// A dark window band from x0 to x1 (y0 to y1), the glass divided by thin
// pillars every pitch ft, the sky's reflection in the upper part.
function band(x0, x1, y0, y1, { pitch = 0, fill = "#252a30", r = 0.3, from = x0 + pitch } = {}) {
  let s = rect(x0, y0, x1 - x0, y1 - y0, fill, 0, `rx="${r}"`) + rect(x0 + 0.15, y0 + (y1 - y0) * 0.6, x1 - x0 - 0.3, (y1 - y0) * 0.3, "#3b444e", 0, 'rx="0.12" opacity="0.7"');
  const segs = [];
  if (pitch) for (let x = from; x < x1 - 1.0; x += pitch) segs.push([x, y0 + 0.15, x, y1 - 0.15]);
  return s + lines(segs, "#4a525c", 0.5);
}
// A plug door: its outline in the body, the window in it.
function plugDoor(x, w, y0, y1, { win: [wy0, wy1] = [y0 + (y1 - y0) * 0.45, y1 - 0.6], ww = w * 0.5, ink = "rgba(0,0,0,0.38)", fill = "none" } = {}) {
  return rect(x, y0, w, y1 - y0, fill, 0, `rx="0.25" stroke="${ink}" stroke-width="0.6" vector-effect="non-scaling-stroke"`) +
    rect(x + (w - ww) / 2, wy0, ww, wy1 - wy0, "#252a30", 0, 'rx="0.2"');
}
// A bicycle pictogram, h ft tall, centered at (x, y).
const bike = (x, y, h, color) => {
  const r = h * 0.28, s = `fill="none" stroke="${color}" stroke-width="${r2(h * 0.07)}"`;
  return `<g transform="translate(${r2(x)} ${r2(y)})"><circle cx="${r2(-h * 0.45)}" cy="${r2(-h * 0.2)}" r="${r2(r)}" ${s}/><circle cx="${r2(h * 0.45)}" cy="${r2(-h * 0.2)}" r="${r2(r)}" ${s}/>` +
    `<path d="M${r2(-h * 0.45)} ${r2(-h * 0.2)}L${r2(-h * 0.1)} ${r2(h * 0.25)}L${r2(h * 0.3)} ${r2(h * 0.25)}L${r2(h * 0.45)} ${r2(-h * 0.2)}M${r2(-h * 0.1)} ${r2(h * 0.25)}L${r2(h * 0.05)} ${r2(-h * 0.2)}L${r2(h * 0.3)} ${r2(h * 0.25)}" ${s}/></g>`;
};

// ===================== DB: ICE 4 =====================
// Siemens ICE 4 (DB class 412, 2017-2024): end cars 29.11 m over the
// couplers, the others 28.75 m, bodies 4.1 m tall and 2.85 m wide, trucks
// 19.5 m apart (de.wikipedia "DB-Baureihe 412"); powered trucks (2.6 m
// wheelbase) under the "powercars", trailing ones (2.3 m) under the rest,
// 920 mm wheels. A door at each end of each car; a long low nose. The
// 12-car sets (Tz 9001-9050) and 13-car sets (9451-9500) are cleared for
// Switzerland; they run Hamburg/Berlin/Köln-Basel-Zürich-Chur and
// Basel-Bern-Interlaken/Brig.
// The paint (photographs at Tecknau 2024, Hamburg Lombardsbrücke and Berlin
// Ostbahnhof 2025-2026): light grey-white, the traffic-red stripe low along
// the side (about 0.85 ft wide), rising along the nose at nearly its full
// width to the tip; the windows in one dark band; DB's ICE logo in light
// grey behind the cab, breaking the stripe, a grille over the stripe just
// ahead of it (on one side); the upright DB logo in the stripe mid-car
// (rechecked at Hamburg Hbf 2025 and Berlin Ostbahnhof 2025); white class numerals at the
// ends of the window band, a yellow bar by the first-class doors, a bicycle
// pictogram over the bicycle car's door.
const ICE = { white: "#eef0f1", red: "#ec0016", band: "#252a30", letter: "#a2a8ae", skirt: "#cdd1d5", seam: "rgba(0,0,0,0.28)", yellow: "#f6c400" };
const I4 = { roof: 12.7, midRoof: 13.3, skirt: 2.0, arch: 3.35, bandLo: 6.4, bandHi: 9.2, redLo: 4.72, redHi: 5.57, doorLo: 3.0, doorHi: 11.2, doorW: 3.77, wheel: 36.2 };
// DB's logo, drawn as its shapes: the red frame, white inside, round the red
// letters D and B; h ft tall, centered at (x, y), w its width over its
// height: 1.43 the usual mark (as on the ICEs' noses), about 0.65 the
// upright one set into the ICEs' red stripe (photographs of a 407 at
// Paris-Est and a 408 at Haldern, 2025-26). Reads the same on a mirrored car.
const rrect = (x0, y0, x1, y1, r) => `M${r2(x0 + r)} ${r2(y0)}H${r2(x1 - r)}Q${r2(x1)} ${r2(y0)} ${r2(x1)} ${r2(y0 + r)}V${r2(y1 - r)}Q${r2(x1)} ${r2(y1)} ${r2(x1 - r)} ${r2(y1)}` +
  `H${r2(x0 + r)}Q${r2(x0)} ${r2(y1)} ${r2(x0)} ${r2(y1 - r)}V${r2(y0 + r)}Q${r2(x0)} ${r2(y0)} ${r2(x0 + r)} ${r2(y0)}Z`;
export function dbLogo(c, x, y, h, w = 1.43, red = "#ec0016") {
  // In the logo's own frame: 1 tall, y down, centered.
  const W = w / 2, t = 0.075, L = 0.62, h2 = L / 2, gap = w > 1 ? 0.06 : 0.03;
  const lw = Math.min(0.86, 2 * W - 2 * t - 0.06), lx = (lw - gap) / 2, st = w > 1 ? 0.13 : 0.065;
  const a1 = -lw / 2, b1 = a1 + lx, a2 = b1 + gap, b2 = a2 + lx;
  // D: a stem and a rounded bowl, its counter cut out.
  const rd = Math.min(lx * 0.55, h2), ri = Math.max(rd - st, 0.02);
  const D = `M${r2(a1)} ${r2(-h2)}H${r2(b1 - rd)}Q${r2(b1)} ${r2(-h2)} ${r2(b1)} ${r2(-h2 + rd)}V${r2(h2 - rd)}Q${r2(b1)} ${r2(h2)} ${r2(b1 - rd)} ${r2(h2)}H${r2(a1)}Z` +
    `M${r2(a1 + st)} ${r2(-h2 + st)}H${r2(b1 - st - ri)}Q${r2(b1 - st)} ${r2(-h2 + st)} ${r2(b1 - st)} ${r2(-h2 + st + ri)}V${r2(h2 - st - ri)}Q${r2(b1 - st)} ${r2(h2 - st)} ${r2(b1 - st - ri)} ${r2(h2 - st)}H${r2(a1 + st)}Z`;
  // B: two bowls, the upper a little narrower, a counter in each.
  const bu = b2 - lx * 0.06, ru = Math.min((bu - a2) * 0.5, h2 / 2), rl = Math.min((b2 - a2) * 0.5, h2 / 2);
  const B = `M${r2(a2)} ${r2(-h2)}H${r2(bu - ru)}Q${r2(bu)} ${r2(-h2)} ${r2(bu)} ${r2(-h2 + ru)}V${r2(-ru * 0.6)}Q${r2(bu)} 0 ${r2(bu - ru * 0.5)} 0` +
    `H${r2(b2 - rl * 0.5)}Q${r2(b2)} 0 ${r2(b2)} ${r2(rl * 0.6)}V${r2(h2 - rl)}Q${r2(b2)} ${r2(h2)} ${r2(b2 - rl)} ${r2(h2)}H${r2(a2)}Z` +
    rrect(a2 + st, -h2 + st, bu - st, -st * 0.45, Math.max(ru - st, 0.02)) + rrect(a2 + st, st * 0.45, b2 - st, h2 - st, Math.max(rl - st, 0.02));
  return `<g transform="translate(${r2(x)} ${r2(y)}) scale(${r2((c.mirrored ? -1 : 1) * h)} ${r2(-h)})">` +
    `<path d="${rrect(-W, -0.5, W, 0.5, 0.14)}" fill="${red}"/><path d="${rrect(-W + t, -0.5 + t, W - t, 0.5 - t, 0.08)}" fill="#ffffff"/>` +
    `<path d="${D}${B}" fill="${red}" fill-rule="evenodd"/></g>`;
}
// The upright DB logo in the stripe, about the stripe's height, the stripe
// broken a little either side of it.
const STRIPE_DB = 0.65;
const dbMark = (c, x, y, h) => dbLogo(c, x, y, h, STRIPE_DB);
// The DB mark on the IC2's class 147 locomotive (not part of this audit).
const dbMark147 = (c, x, y, h) => rect(x - h * 0.72, y - h / 2, h * 1.44, h, "#ffffff", 0, `rx="${r2(h * 0.18)}" stroke="${ICE.red}" stroke-width="${r2(h * 0.11)}"`) +
  letters(c, x, y - h * 0.02, h * 0.74, "DB", ICE.red, { weight: 800, spacing: -0.02 * h });
// The stripe from a to b (a gap left for the DB mark at x).
const stripeGap = () => (I4.redHi - I4.redLo) * (STRIPE_DB / 2 + 0.27);
const iceStripe = (a, b, mark) => mark == null ? rect(a, I4.redLo, b - a, I4.redHi - I4.redLo, ICE.red)
  : rect(a, I4.redLo, mark - stripeGap() - a, I4.redHi - I4.redLo, ICE.red) + rect(mark + stripeGap(), I4.redLo, b - mark - stripeGap(), I4.redHi - I4.redLo, ICE.red);
const iceNumeral = (c, x, cls) => letters(c, x, 8.4, 1.05, cls, "#ffffff", { weight: 700 }) +
  lines([[x - 0.35, 7.45, x + 0.35, 7.45], [x - 0.35, 7.05, x + 0.35, 7.05]], "rgba(255,255,255,0.55)", 0.5);
// A door: grey edge, window, and the first class's yellow bar beside it.
const iceDoor = (x, first) => plugDoor(x, I4.doorW, I4.doorLo, I4.doorHi, { win: [7.0, 10.4], ww: 1.9, ink: "rgba(60,66,72,0.55)" }) +
  (first ? rect(x + I4.doorW + 0.08, 9.4, 0.22, 1.8, ICE.yellow) : "");
// The lower side: a light grey skirt with its panel joints.
const iceSkirt = (L, xs) => rect(-1, 0, L + 2, 2.9, ICE.skirt) + line(-1, 2.9, L + 1, 2.9, "rgba(0,0,0,0.18)", 0.5) +
  lines(xs.map((x) => [x, 0.5, x, 2.85]), "rgba(0,0,0,0.16)", 0.5);
// Trucks under the arches: [x, powered].
const iceTrucks = (list) => list.map(([x, p]) => truck(x, { wb: p ? 8.53 : 7.55, d: I4.wheel, top: I4.arch })).join("");
// The pantograph on a powercar's roof: in a shallow well between fairings.
const icePan = (x, R, up) => roofCover(x - 9.5, R, 5.2, 0.32, "#c3c8cd", 1) + roofCover(x + 4.3, R, 5.2, 0.32, "#c3c8cd", 1) +
  rect(x - 4.3, R - 0.05, 8.6, 0.2, "#9aa1a9", 0.3) + pantograph(x, R + 0.1, { up, facing: -1 }) + panGear(x, R + 0.1, 1);

// A middle car, 28.75 m. o.cls "1" or "2"; o.pan a pantograph (up or
// down); o.power a powercar (traction gear under the floor, powered
// trucks); o.bistro the restaurant car (first class at one end); o.bikes.
function ice4Mid(c, o) {
  const L = c.L, b1 = 15.15, b2 = L - 15.15, x0 = 0.4, x1 = L - 0.4, R = I4.midRoof;
  const d = M([x0, I4.skirt]) + L_(bottom(x0, x1, I4.skirt, [b1, b2], 5.8, I4.arch).slice(1)) +
    `L${r2(x1)} ${r2(R - 1.1)}Q${r2(x1)} ${R} ${r2(x1 - 1.1)} ${R}L${r2(x0 + 1.1)} ${R}Q${r2(x0)} ${R} ${r2(x0)} ${r2(R - 1.1)}Z`;
  const first = o.cls === "1";
  const paint = rect(-1, 0, L + 2, 20, ICE.white) + iceSkirt(L, [24, 40, 56, 72]) + iceStripe(-1, L + 1, 48.6) + line(-1, R - 0.55, L + 1, R - 0.55, "rgba(0,0,0,0.1)", 0.5);
  let s = shell(d, ICE.white, paint);
  s += band(8.6, 82.8, I4.bandLo, I4.bandHi, { pitch: 6.23, from: 12.6 });
  s += iceDoor(2.56, first) + iceDoor(88.3, first);
  s += dbMark(c, 48.6, (I4.redLo + I4.redHi) / 2, (I4.redHi - I4.redLo) * 0.96);
  s += iceNumeral(c, 14.2, o.bistro ? "" : o.cls) + iceNumeral(c, 82.0, o.cls);
  if (o.bikes) s += bike(10.4, 10.0, 1.1, "#7d848b");
  // Roof: hatches near the ends, the air-conditioning cover, a pantograph.
  s += roofCover(3.0, R, 3.6, 0.22, "#c9ced3", 1) + roofCover(L - 6.6, R, 3.6, 0.22, "#c9ced3", 1);
  s += o.pan != null ? icePan(L / 2 + 6, R, o.pan) : roofCover(37.0, R, 27.0, 0.2, "#c9ced3", 4);
  s += iceTrucks([[b1, o.power], [b2, o.power]]);
  return s + ends(c, 2.4, R - 0.4);
}

// An end car, 29.11 m, the nose at the left (the consist mirrors the one
// at the back). The nose's profile from the side (Hamburg Hbf, 2025): its
// tip 1.08 m up, the top rising in one long curve to the full roof about
// 7 m back; the windshield in a black visor along the nose's top; a seam
// where the cab module meets the body.
const NOSE_TOP = [[0, 3.54], [0.43, 4.48], [1.02, 4.82], [2.2, 5.97], [3.48, 6.73], [4.66, 7.37], [6.0, 8.06], [7.25, 8.67], [8.53, 9.31], [10.5, 10.12], [13.1, 11.13], [16.4, 12.04], [20.3, 12.62], [23.5, 12.7]];
const NOSE_LOW = [[0, 3.54], [0.43, 2.66], [1.31, 2.03], [3.3, 1.85]];
// From the side the windshield shows only over the front of the nose: the
// black round it ends about 8.5 ft back, white beyond (Hamburg Hbf, 2025).
const VISOR = NOSE_TOP.filter(([x]) => x >= 2.2 && x <= 8.53).map(([x, y]) => [x, y + 0.3]);
const VISOR_LOW = NOSE_TOP.filter(([x]) => x >= 2.2 && x <= 8.53).map(([x, y]) => [x + 0.3 + x * 0.03, y - 0.6 + x * 0.02]).reverse();
const GLASS = NOSE_TOP.filter(([x]) => x >= 3.48 && x <= 7.25).map(([x, y]) => [x + 0.4, y - 0.1]);
const GLASS_LOW = GLASS.map(([x, y]) => [x + 0.3, y - 0.3]).reverse();
function ice4End(c, o) {
  const L = c.L, b1 = 16.4, b2 = L - 15.1, x1 = L - 0.4, R = I4.roof;
  const top = [...NOSE_TOP].reverse();
  const d = M([3.3, 1.85]) + L_(bottom(3.3, x1, I4.skirt, [b1, b2], 5.8, I4.arch).slice(1)) +
    `L${r2(x1)} ${r2(R - 1.1)}Q${r2(x1)} ${R} ${r2(x1 - 1.1)} ${R}L${r2(top[0][0])} ${r2(top[0][1])}` + smooth(top) + smooth([...NOSE_LOW]).replace(/^/, "") + "Z";
  const first = o.cls === "1";
  // The stripe (Hamburg Hbf 2025, Tecknau 2024, Lombardsbrücke 2026): from
  // the nose's tip, where it is a little thinner, rising along the nose at
  // nearly its full width to the side's level, cut square just before the
  // ICE logo and going on just after it.
  const lowE = [[-0.5, 3.1], [1.1, 3.2], [2.5, 3.4], [5.3, 3.75], [8.5, 4.2], [11.9, 4.55], [15.0, 4.7], [18.8, I4.redLo]];
  const upE = [[18.8, I4.redHi], [15.0, 5.55], [11.9, 5.4], [8.5, 5.0], [5.3, 4.55], [2.5, 4.0], [1.1, 3.75], [-0.5, 3.6]];
  const nose = path(M(lowE[0]) + smooth(lowE) + L_([upE[0]]) + smooth(upE) + "Z", ICE.red);
  const paint = rect(-1, 0, L + 2, 20, ICE.white) + iceSkirt(L, [26, 42, 58, 74]) + nose + iceStripe(24.5, L + 1, 50.7) +
    // The black visor round the windshield along the nose's top, the glass
    // in it catching the light.
    path(M(VISOR[0]) + smooth(VISOR) + L_([VISOR_LOW[0]]) + smooth(VISOR_LOW) + "Z", "#1d2126") +
    path(M(GLASS[0]) + smooth(GLASS) + L_([GLASS_LOW[0]]) + smooth(GLASS_LOW) + "Z", "#3b444e") +
    // The cab module's seam, crossing the stripe about 6 ft ahead of the
    // logo; the access hatch low on the nose.
    path(`M21.5 ${R}` + smooth([[21.5, R], [19.0, 9.8], [14.9, 6.5], [12.7, 5.3], [11.5, 3.6], [11.3, 2.0]]), "none", 0, `stroke="${ICE.seam}" stroke-width="0.6" vector-effect="non-scaling-stroke"`) +
    rect(2.9, 4.25, 1.7, 1.95, "none", 0, `rx="0.35" stroke="${ICE.seam}" stroke-width="0.6" vector-effect="non-scaling-stroke"`);
  let s = shell(d, ICE.white, paint);
  // The windows behind the cab: the band's front end cut on the slant.
  s += path(M([7.4, 7.75]) + L_([[11.6, I4.bandHi], [25.75, I4.bandHi], [25.75, I4.bandLo], [10.4, I4.bandLo]]) + "Z", ICE.band) +
    rect(11.0, I4.bandLo + 1.75, 14.5, 0.85, "#3b444e", 0, 'opacity="0.7"') + lines([[21.4, I4.bandLo + 0.15, 21.4, I4.bandHi - 0.15]], "#4a525c", 0.5);
  s += band(33.0, 85.0, I4.bandLo, I4.bandHi, { pitch: 6.23, from: 39.2 });
  s += iceDoor(27.3, first) + iceDoor(L - 5.1, first);
  // DB's ICE logo, its caps about 2.7 times the stripe's width, their tops
  // just above the stripe; before it a grille from the stripe's foot up
  // over it, the red running under its slats.
  s += iceLogo(c, 21.5, 4.72, 2.3, ICE.letter);
  s += rect(15.3, I4.redLo, 2.0, 1.6, "none", 0, `rx="0.15" stroke="${ICE.seam}" stroke-width="0.5" vector-effect="non-scaling-stroke"`) + slats(15.45, I4.redLo + 0.12, 1.7, 1.36, 0.2, "rgba(0,0,0,0.32)");
  s += dbMark(c, 50.7, (I4.redLo + I4.redHi) / 2, (I4.redHi - I4.redLo) * 0.96);
  s += iceNumeral(c, 34.3, o.cls) + iceNumeral(c, 83.9, o.cls);
  if (o.bikes) s += bike(34.4, 10.1, 1.1, "#7d848b");
  s += roofCover(L - 22, R, 12.5, 0.3, "#c9ced3", 3) + roofCover(L - 6.6, R, 3.6, 0.22, "#c9ced3", 1);
  s += iceTrucks([[b1, false], [b2, false]]);
  return s + ends({ ...c, coupledL: false }, 2.4, R - 0.4);
}

// ===================== TGV Lyria =====================
// Alstom TGV 2N2 "Euroduplex" (3UFC, three-voltage), Lyria's sets 4716-4730
// (power cars 310031-310060; fr.wikipedia "TGV 2N2"): two power cars, 22.15
// m, and eight double-deck trailers on shared (Jacobs) trucks, the end ones
// 21.85 m, the others 18.7 m; 200.19 m in all, the trailers 4.32 m tall.
// Lyria's paint since 2019 (photographs at Genève 2026, Basel SBB 2024,
// Pasilly 2026): the power car white at the front, a black visor over the
// cab edged by a pink line that runs from the nose's foot up to the roof,
// the red "TGV Lyria" box under the cab window; behind the cab door, from a
// band of halftone dots, red with a black band along the machine room,
// "France <> Suisse" in the red above it and "Schweiz <> Frankreich" below,
// the louvers dark along the top. The trailers: silver-grey above, dark
// grey below a red-to-magenta line under the upper deck's windows, red
// doors, the small Lyria box by each door; the bar car's lower deck red.
const LY = { red: "#e2231a", pink: "#d42a6a", magenta: "#c01f78", black: "#1c1d21", white: "#eef0f1", silver: "#c4c8cc", anth: "#666b71",
  lineGrey: "#c9cdd1", blue: "#2b3d8c", skirt: "#33373c", louver: "#8f969d" };
const LYC = { pcRoof: 13.25, roof: 14.17, wheel: 36.2 };
// Lyria's mark: a red box, "TGV" in light and "Lyria" in bold italic
// white; vertical (the trailers' small box by the doors) when up is true.
const lyriaBox = (c, x, y, w, h, up = false) => rect(x - w / 2, y - h / 2, w, h, LY.red) +
  (up ? `<g transform="translate(${r2(x)} ${r2(y)}) rotate(${c.mirrored ? -90 : 90})">${lyriaWord({ ...c, mirrored: false }, 0, 0, w * 0.55)}</g>`
    : lyriaWord(c, x, y, h * 0.42));
const lyriaWord = (c, x, y, h) => `<g transform="translate(${r2(x)} ${r2(y)}) scale(${c.mirrored ? -1 : 1} -1)">` +
  `<text x="${r2(-h * 0.1)}" y="${r2(h * 0.36)}" font-size="${r2(h)}" text-anchor="end" font-weight="400" font-family="${SANS}" fill="#ffffff">TGV</text>` +
  `<text x="${r2(-h * 0.02)}" y="${r2(h * 0.36)}" font-size="${r2(h * 1.05)}" text-anchor="start" font-weight="700" font-style="italic" font-family="${SANS}" fill="#ffffff">Lyria</text></g>`;
// The halftone band where white turns to red: dots growing toward the red.
function dots(x0, x1, y0, y1, color) {
  let s = "";
  const cols = 7, rows = Math.round((y1 - y0) / 0.45);
  for (let i = 0; i < cols; i++) for (let j = 0; j <= rows; j++) {
    const r = 0.05 + (0.2 * (i + 1)) / cols, x = x0 + ((x1 - x0) * (i + 0.5)) / cols + (j % 2 ? 0.18 : 0);
    s += `<circle cx="${r2(x)}" cy="${r2(y0 + j * 0.45)}" r="${r2(r)}" fill="${color}"/>`;
  }
  return s;
}
// The power car, the nose at the left (the consist mirrors the rear one).
// Its profile (Rennes, 2025, a 2N2 from the side): the tip 1.2 m up, the
// top rising to the roof in a convex curve about 6 m back; a white bumper
// over a black spoiler.
const TGV_TOP = [[0, 3.6], [0.25, 4.6], [1.0, 5.75], [2.82, 7.06], [4.6, 8.15], [6.6, 9.71], [8.6, 10.95], [10.4, 11.8], [12.5, 12.55], [15.0, 13.05], [17.9, 13.2], [19.7, 13.25]];
const TGV_LOW = [[0, 3.6], [0.15, 2.5], [0.7, 1.95], [2.6, 1.65]];
function lyriaPower(c) {
  const L = c.L, R = LYC.pcRoof, x1 = L - 0.5, b1 = 16.4, b2 = L - 10.4;
  const top = [...TGV_TOP].reverse();
  const d = M([2.6, 1.65]) + L_(bottom(2.6, x1, 2.6, [b1, b2], 6.4, 3.7).slice(1).map(([x, y]) => [x, y === 2.6 && x > 20 ? 2.3 : y])) +
    `L${r2(x1)} ${r2(R - 1.0)}Q${r2(x1)} ${R} ${r2(x1 - 1.0)} ${R}L${r2(top[0][0])} ${r2(top[0][1])}` + smooth(top) + smooth(TGV_LOW) + "Z";
  const red0 = 23.0; // where the red begins, behind the dots
  const paint = rect(-1, 0, L + 2, 20, LY.white) +
    // The red machine room: the louvers along the top, the black band, the
    // thin blue line over it; the dark skirt.
    rect(red0, 0, L, 20, LY.red) + dots(19.6, red0, 2.4, 12.6, LY.red) +
    rect(25.8, 11.4, L, 4, "#c3c7cb") + rect(26.0, 11.55, 34.0, 1.5, "#2a2d31") + slats(26.0, 11.55, 34.0, 1.5, 0.95, "rgba(220,224,228,0.85)") +
    rect(red0, 5.6, L, 3.25, LY.black) + rect(red0, 8.85, L, 0.14, LY.blue) +
    rect(-1, 0, L + 2, 3.55, LY.skirt) + line(-1, 3.55, L + 1, 3.55, "rgba(255,255,255,0.18)", 0.5) +
    // The visor over the cab, edged by the pink line from the foot of the
    // nose up to the roof.
    path(M([-1, 4.3]) + L_([[1.6, 4.6], [5.4, 7.0], [9.6, 10.2], [13.6, 13.6], [-1, 13.6]]) + "Z", LY.black) +
    path(M([-1, 3.85]) + L_([[1.7, 4.1], [5.8, 6.65], [10.1, 9.95], [14.6, 13.6], [13.6, 13.6], [9.6, 10.2], [5.4, 7.0], [1.6, 4.6], [-1, 4.3]]) + "Z", LY.pink) +
    rect(-1, 0, L + 2, 1.9, "#25282c");
  let s = shell(d, LY.white, paint);
  // The windshield's edge in the visor, the cab's side window, the door.
  s += path(M([5.6, 8.45]) + L_([[9.9, 11.4], [12.6, 12.85], [9.4, 10.5], [6.4, 8.45]]) + "Z", "#3b444e");
  s += path(M([15.0, 8.3]) + L_([[17.6, 10.0], [17.7, 10.0], [17.7, 8.3]]) + "Z", LY.black) +
    path(`M15.3 8.25L17.75 8.25L17.75 9.85Q17.75 10.1 17.45 10.05L16.0 9.15Q15.3 8.7 15.3 8.25Z`, C.glass, 0, `stroke="${C.gasket}" stroke-width="0.6" vector-effect="non-scaling-stroke"`);
  s += plugDoor(22.0, 2.9, 2.8, 11.3, { win: [8.0, 10.6], ww: 0.9, ink: "rgba(0,0,0,0.4)", fill: LY.red });
  s += lyriaBox(c, 18.4, 7.3, 4.4, 2.9);
  s += letters(c, 36.5, 10.1, 2.1, "France &lt;&gt; Suisse", "#ffffff", { weight: 300, family: NARROW });
  s += letters(c, 57.0, 4.55, 1.6, "Schweiz &lt;&gt; Frankreich", "#ffffff", { weight: 300, family: NARROW });
  // The spoiler under the nose; trucks; the pantograph raised at the back,
  // the other folded; roof gear.
  s += path(M([0.3, 1.6]) + L_([[6.0, 1.55], [6.6, 0.75], [1.8, 0.65]]) + "Z", "#2a2d31");
  s += truck(b1, { wb: 9.84, d: LYC.wheel, kind: "loco", top: 3.7 }) + truck(b2, { wb: 9.84, d: LYC.wheel, kind: "loco", top: 3.7 });
  s += roofCover(25.6, R, L - 34, 0.3, "#9aa1a9", 4) + pantograph(L - 10.0, R + 0.3, { up: true, facing: -1 }) + pantograph(36.0, R + 0.3, { up: false }) +
    panGear(L - 10.0, R + 0.3, -1);
  return s + (c.coupledR ? gangway(L, 1, 3.0, R - 0.6) : "");
}

// A trailer. o.end: the end trailer (21.85 m) next to a power car, its own
// truck under that end (at the left; o.rear draws it mirrored, for the
// back of the set); o.bar the bar car; o.cls "1" or "2".
const TR = { up: [9.7, 12.0], low: [3.3, 5.45], line: [8.95, 9.4], grey: 6.35, doorTop: 9.45 };
const lyWin = (x, [y0, y1], w = 3.6) => rect(x, y0, w, y1 - y0, C.glass, 0, `rx="0.55" stroke="${C.gasket}" stroke-width="0.5" vector-effect="non-scaling-stroke"`) +
  rect(x + 0.15, y0 + (y1 - y0) * 0.6, w - 0.3, (y1 - y0) * 0.3, C.glassLight, 0, 'rx="0.3"');
const louvers = (x, y0, y1, w = 0.75) => rect(x, y0, w, y1 - y0, "#2b2f34") + slats(x, y0, w, y1 - y0, 0.2, "rgba(255,255,255,0.22)");
function lyriaTrailer(c, o) {
  const L = c.L, R = LYC.roof, e0 = o.end ? 9.6 : 7.6, e1 = L - 7.6; // where the lower deck runs between the trucks
  const gid = newId();
  const d = M([0.35, 3.75]) + L_([[e0 - 0.6, 3.75], [e0, 1.3], [e1, 1.3], [e1 + 0.6, 3.75], [L - 0.35, 3.75], [L - 0.35, R - 1.6]]) +
    `Q${r2(L - 0.35)} ${R} ${r2(L - 1.9)} ${R}L1.9 ${R}Q0.35 ${R} 0.35 ${r2(R - 1.6)}Z`;
  const paint = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${LY.red}"/><stop offset="1" stop-color="${LY.magenta}"/></linearGradient></defs>` +
    rect(-1, 0, L + 2, 20, LY.silver) + rect(-1, 0, L + 2, TR.line[0], LY.anth) + rect(-1, TR.line[0], L + 2, TR.line[1] - TR.line[0], `url(#${gid})`) +
    rect(-1, TR.grey, L + 2, 0.12, LY.lineGrey) + rect(-1, 0, L + 2, 2.2, "#5a5f65") + line(-1, R - 0.7, L + 1, R - 0.7, "rgba(0,0,0,0.12)", 0.5) +
    (o.bar ? rect(e0 + 1.0, 1.3, e1 - e0 - 2.0, TR.grey - 1.3, LY.red) : "");
  let s = shell(d, LY.silver, paint);
  // Upper deck: nine windows (the end trailer ten); lower deck: eight, or the
  // bar's grilles; louvers in the end bays.
  const n = o.end ? 10 : 9, pitch = 5.55, a = o.end ? 11.0 : 6.3;
  for (let i = 0; i < n; i++) s += lyWin(a + i * pitch, TR.up);
  if (o.bar) for (let i = 0; i < 5; i++) s += rect(e0 + 3.0 + i * 8.6, 2.0, 4.2, 3.6, i % 2 ? "rgba(0,0,0,0.25)" : "rgba(120,10,10,0.35)", 0, 'rx="0.2"') + (i % 2 ? slats(e0 + 3.0 + i * 8.6, 2.0, 4.2, 3.6, 0.3, "rgba(0,0,0,0.35)") : "");
  else for (let i = 0; i < 8; i++) s += lyWin(e0 + 2.2 + i * ((e1 - e0 - 7.8) / 7), TR.low, 3.4);
  s += louvers(e0 - 2.2, 9.6, 12.2) + louvers(e0 - 2.2, 3.9, 8.6) + louvers(e1 + 1.0, 3.9, 8.6);
  // The door at the right end, the Lyria box and class numeral beside it.
  s += plugDoor(L - 5.4, 2.95, 1.6, TR.doorTop, { win: [5.0, 8.4], ww: 0.7, ink: "rgba(0,0,0,0.45)", fill: LY.red });
  s += lyriaBox(c, L - 6.6, 7.6, 1.0, 1.7, true) + letters(c, L - 8.2, 7.6, 1.2, o.cls, "#ffffff", { weight: 600 });
  if (o.bar) s += lyriaBox(c, e0 + 1.8, 7.6, 1.0, 1.7, true);
  // Trucks: a shared one under the right end; the end trailer's own at the left.
  s += truck(L, { wb: 9.2, d: 36.2, top: 3.75 }) + (o.end ? truck(4.6, { wb: 9.2, d: 36.2, top: 3.75 }) : "");
  return s + (c.coupledL ? gangway(0, -1, 3.8, R - 0.8, "#2a2d31") : "") + (c.coupledR ? gangway(L, 1, 3.8, R - 0.8, "#2a2d31") : "");
}
const mirror = (c, draw) => `<g transform="matrix(-1 0 0 1 ${c.L} 0)">${draw({ ...c, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: c.coupledL })}</g>`;

// ===================== ÖBB: railjet =====================
// The first-generation railjet (Siemens, 2008-2013; de.wikipedia "Railjet
// 1. Generation"): seven cars, 26.5 m (the driving trailer 26.85 m), 4.05 m
// tall, trucks 19.0 m apart: car 27 the driving trailer (Afmpz, business and
// first), 26 first (Ampz), 25 first with the restaurant (ARbmpz), 22-24
// economy (Bmpz), 21 economy with the bicycles (Bmpvz), a Taurus (1116) at
// that end; sets and locomotives 1-23 carry the Swiss train protection and
// run the RJX Zürich-Wien/Graz/Budapest. The paint (photographs at
// Kiefersfelden 2025, the Walensee and Rheineck 2025): carmine red above,
// the windows in a dark band edged below by a bright vermilion stripe,
// dark grey below with "railjet" in big outlined letters and the class
// ("economy", "first", "business") in red, a silver fairing under the
// floor; the doors' edges marked in orange, the first and business class
// doors framed in yellow; on the driving trailer the grey and the stripe
// sweep down toward the cab. The Taurus alike, "railjet" big along it.
const RJP = { red: "#c21a2b", stripe: "#e8361c", dark: "#363833", silver: "#babdbe", roof: "#9da2a6", text: "#c9cbc7", yellow: "#f2a900", orange: "#ef7d00" };
const RJC = { roof: 13.29, sill: 3.6, win: [6.75, 9.75], stripe: [5.95, 6.95], wheel: 36.2 };
// Outlined letters (the railjet word), h ft tall.
const outlined = (c, x, y, h, text, stroke) => `<g transform="translate(${r2(x)} ${r2(y)}) scale(${c.mirrored ? -1 : 1} -1)"><text y="${r2(h * 0.36)}" font-size="${r2(h)}" text-anchor="middle" ` +
  `font-weight="400" font-family="${SANS}" fill="none" stroke="${stroke}" stroke-width="${r2(h * 0.035)}">${text}</text></g>`;
const obbRailjet = (c, x, y, h) => `<g transform="translate(${r2(x)} ${r2(y)}) scale(${c.mirrored ? -1 : 1} -1)">` +
  `<text x="${r2(-h * 0.15)}" y="${r2(h * 0.36)}" font-size="${r2(h * 0.85)}" text-anchor="end" font-weight="800" font-family="${SANS}" fill="#e2002a">ÖBB</text>` +
  `<text x="0" y="${r2(h * 0.36)}" font-size="${r2(h)}" text-anchor="start" font-weight="700" font-style="italic" font-family="${SANS}" fill="#ffffff">railjet</text></g>`;
// A railjet car. o.cls: "economy", "first" or "business"; o.cab the
// driving trailer (cab at the left); o.bistro, o.bikes.
function rjCar(c, o) {
  const L = c.L, R = RJC.roof, S = RJC.sill, b1 = L / 2 - 31.17, b2 = L / 2 + 31.17;
  const x0 = 0.45, x1 = L - 0.45;
  const nose = [[0.9, S], [0.55, 6.0], [0.6, 9.4], ["q", 0.9, 12.2, 3.4, R]];
  const d = o.cab ? `M${nose[0][0]} ${S}L${r2(x1)} ${S}L${r2(x1)} ${r2(R - 0.9)}Q${r2(x1)} ${R} ${r2(x1 - 0.9)} ${R}L3.4 ${R}Q0.9 12.2 0.6 9.4L0.55 6.0Z`
    : `M${x0} ${S}L${r2(x1)} ${S}L${r2(x1)} ${r2(R - 0.9)}Q${r2(x1)} ${R} ${r2(x1 - 0.9)} ${R}L${r2(x0 + 0.9)} ${R}Q${x0} ${R} ${x0} ${r2(R - 0.9)}Z`;
  const first = o.cls !== "economy";
  // The doors: one at the right end (on the driving trailer behind the cab).
  const dx = o.cab ? 13.6 : L - 7.3;
  const a = o.cab ? 18.6 : 8.6, b = o.cab ? L - 6.0 : o.cls === "economy" ? L - 25.0 : L - 15.8;
  let paint = rect(-1, 0, L + 2, 20, RJP.red) + rect(-1, R - 0.55, L + 2, 1, RJP.roof);
  if (o.cab) {
    // The grey and the stripe sweep down toward the cab, ending under the door.
    paint += path(`M${L + 1} 0L${L + 1} ${RJC.stripe[0]}L22 ${RJC.stripe[0]}C14 ${RJC.stripe[0]} 12.5 4.6 9.5 2.0L9.5 0Z`, RJP.dark) +
      path(`M${L + 1} ${RJC.stripe[0]}L22 ${RJC.stripe[0]}C14 ${RJC.stripe[0]} 12.5 4.6 9.5 2.0L6.0 2.0C9.0 4.6 11.5 ${RJC.stripe[1]} 21 ${RJC.stripe[1]}L${L + 1} ${RJC.stripe[1]}Z`, RJP.stripe) +
      // The black visor round the windshield and the cab's side windows.
      path(`M-1 9.0L3.9 9.0Q4.6 9.0 4.9 9.6L6.4 ${R + 1}L-1 ${R + 1}Z`, "#1c1d20") +
      path(`M7.6 7.9L8.2 11.2Q8.3 11.6 8.7 11.6L9.4 11.6L9.4 9.0Z`, "#1c1d20") + rect(9.8, 7.8, 1.55, 3.2, "#1c1d20", 0, 'rx="0.25"');
  } else paint += rect(-1, 0, L + 2, RJC.stripe[0], RJP.dark) + rect(-1, RJC.stripe[0], L + 2, RJC.stripe[1] - RJC.stripe[0], RJP.stripe);
  let s = shell(d, RJP.red, paint);
  // The window band, its pillars; a small window at the far end.
  s += band(a, b, RJC.win[0], RJC.win[1], { pitch: o.cls === "economy" ? 6.0 : 7.1, fill: "#202326", r: 0.45, from: a + 6.0 });
  if (!o.cab) s += rect(4.9, 7.6, 1.2, 1.9, C.glass, 0, `rx="0.2" stroke="${C.gasket}" stroke-width="0.5" vector-effect="non-scaling-stroke"`);
  else s += rect(11.9, 7.7, 1.0, 1.4, C.glass, 0, 'rx="0.15"') + path("M10.0 8.0L10.0 10.8L11.1 10.8L11.1 8.0Z", C.glass);
  // The door: grey, its window a dark strip with the class numeral.
  s += rect(dx, S + 0.1, 3.6, 9.2, "none", 0, `rx="0.2" stroke="rgba(0,0,0,0.5)" stroke-width="0.5" vector-effect="non-scaling-stroke"`) +
    rect(dx + 1.05, 5.0, 1.0, 5.6, "#1b1c1f", 0, 'rx="0.5"') + letters(c, dx + 1.55, 9.5, 0.8, first ? "1" : "2", "#e6e7e8", { weight: 600 }) +
    (o.bikes ? bike(dx + 1.55, 7.6, 0.75, "#e6e7e8") : "");
  s += first ? path(`M${dx - 0.15} 5.0L${dx - 0.15} 11.5L${dx + 3.75} 11.5L${dx + 3.75} 4.0`, "none", 0, `stroke="${RJP.yellow}" stroke-width="0.9"`)
    : line(dx + 3.85, 6.0, dx + 3.85, 10.9, RJP.orange, 1.0);
  // The words: railjet big and outlined, the class in red, the mark.
  if (!o.cab) s += outlined(c, L * 0.3, 4.75, 2.6, "railjet", RJP.text);
  s += letters(c, o.cab ? 30.0 : L * 0.66, 4.75, 0.75, o.bistro ? "first" : o.cls, "#e8361c", { weight: 500 });
  if (o.cab) s += obbRailjet(c, 18.0, 11.3, 0.75) + letters(c, 40, 4.75, 0.75, "first", "#e8361c", { weight: 500 });
  // Under the floor: the silver fairing; trucks; buffers and couplings.
  s += path(`M${r2(b1 + 6.2)} ${S}L${r2(b2 - 6.2)} ${S}L${r2(b2 - 6.2)} 1.6Q${r2(b2 - 6.2)} 1.0 ${r2(b2 - 7.0)} 1.0L${r2(b1 + 7.0)} 1.0Q${r2(b1 + 6.2)} 1.0 ${r2(b1 + 6.2)} 1.6Z`, RJP.silver, 0.5) +
    slats(L / 2 - 8, 1.7, 3.0, 1.1, 0.35, "rgba(0,0,0,0.45)") + slats(L / 2 + 4, 1.7, 2.2, 1.1, 0.35, "rgba(0,0,0,0.45)");
  s += truck(b1, { wb: 8.53, d: RJC.wheel, top: S }) + truck(b2, { wb: 8.53, d: RJC.wheel, top: S });
  s += uicBuffers(L, 1, { sill: S + 0.9, beam: 2.4, y: 3.45 }) + (o.cab ? uicBuffers(0, -1, { sill: S + 0.9, beam: 2.4, y: 3.45, end: 0.9 }) +
    lamp(0.75, 5.5, 0.5, 0.55) + lamp(0.75, 4.75, 0.45, 0.35, RED_LAMP) + rect(1.0, 12.4, 1.6, 0.9, "#f6f2dc", 0, 'rx="0.15"') : uicBuffers(0, -1, { sill: S + 0.9, beam: 2.4, y: 3.45 }));
  s += roofCover(L / 2 - 8, R, 16, 0.35, "#a7adb2", 3);
  return s + (c.coupledL ? gangway(0, -1, 4.2, R - 1.0) : "") + (c.coupledR ? gangway(L, 1, 4.2, R - 1.0) : "");
}

// The railjet Taurus (ÖBB 1116, 1999-2006; the railjet ones from 1116 201,
// sets 1-23's with the Swiss gear and a third, narrow pantograph): czechia's
// Taurus body (19.28 m, Bo'Bo') in the railjet paint as photographed in
// 2025: carmine, a black visor over each cab, the grey low along the side
// under the vermilion stripe, both sweeping down to the rear end (the
// number 2 cab); "railjet" big and outlined along the middle.
const NOSE_TAURUS = [[1.7, 4.1], [1.1, 6.3], ["q", 0.95, 8.5, 2.3, 9.3], [3.9, 12.15], ["q", 4.6, 13.0, 6.4, 13.0]];
const rjTaurusPaint = (c, L) => rect(-1, 0, L + 2, 20, RJP.red) + path("M-1 9.25L2.2 9.25L4.1 12.0L6.8 13.0L6.8 14L-1 14Z", "#1c1d20") + rect(-1, 4.1, L + 2, 0.45, "#2b2c2e") +
  // The cab front below the windshield dark grey, a red band at the corner.
  path("M-1 4.0L2.1 4.0L1.6 6.6L1.7 9.3L-1 9.3Z", "#2b2c2e") + path("M1.75 6.6L2.35 6.6L2.25 7.4L1.68 7.4Z", RJP.stripe);
const rjTaurusOver = (c, L) => {
  const top = 7.25, st = 8.2, id = newId();
  return `<clipPath id="${id}"><rect x="1.6" y="4.15" width="${r2(L - 3.2)}" height="8.6"/></clipPath><g clip-path="url(#${id})">` +
    path(`M0 4.1L0 ${top}L${r2(L * 0.5)} ${top}C${r2(L * 0.68)} ${top} ${r2(L * 0.78)} 5.4 ${r2(L - 8)} 4.1Z`, RJP.dark) +
    path(`M0 ${top}L${r2(L * 0.5)} ${top}C${r2(L * 0.68)} ${top} ${r2(L * 0.78)} 5.4 ${r2(L - 8)} 4.1L${L} 4.1L${L} 6.0C${r2(L * 0.8)} 6.8 ${r2(L * 0.7)} ${st} ${r2(L * 0.48)} ${st}L0 ${st}Z`, RJP.stripe) + "</g>" +
    outlined(c, L * 0.46, 8.1, 3.6, "railjet", RJP.text) + obbRailjet(c, L - 13.5, 11.0, 0.55) + letters(c, 7.6, 12.45, 0.5, "1116", "#e6e7e8", { weight: 600 });
};
const rjTaurus = (c) => euroLoco(c, { roof: 13.0, sill: 4.1, nose: NOSE_TAURUS, rake: [[2.3, 9.3], [3.9, 12.15]], centers: 32.5, door: 7.2, wheel: 45,
  paint: rjTaurusPaint, over: rjTaurusOver, surround: "#141518", grilles: [[-16.5, 4.2, 11.0, 12.3], [-1.5, 2.6, 11.0, 12.3], [9.5, 2.4, 11.0, 12.3], [12.3, 2.4, 11.0, 12.3]], grilleFill: "rgba(20,22,25,0.55)" });

// ===================== ÖBB: the new Nightjet =====================
// Siemens Viaggio Comfort "Next Level" (ÖBB, 33 seven-car sets since 2023;
// on Zürich-Hamburg since December 2025, Zürich-Wien since June 2026):
// a seat car with a cab (Bfmpz, 80-91 7xx), a multi-function car (seats,
// the accessible compartment, bicycles; a low floor at its middle door),
// three couchette cars with mini cabins (Bcmz, 73 81 52-91 3xx), two
// sleeping cars (WLAmz, 73 81 70-91 1xx); 26.5 m cars, 4.05 m tall.
// Paint (photographs of WLAmz 103 and Bcmz 303 at Innsbruck 2024, the seat
// car at Wien Hbf 2026 and Amersfoort 2026): night blue, the windows in a
// black band over a red line and a thin grey one, a silver underfloor
// fairing, a silver frame round each door; "nightjet" big in outlined
// italic capitals low on the side, the car's kind ("sleeping car",
// "couchette", "seat car") in white bold italic, ÖBB in red at one end;
// the seat car's cab end swept by a red and dark grey blade.
const NJ = { blue: "#0d2a63", band: "#15171b", red: "#d2081c", grey: "#5b6575", roof: "#9aa1aa", silver: "#b3bcc3", frame: "#c5ccd2" };
const NJC = { roof: 13.2, sill: 3.5, band: [7.2, 9.9], red: [6.45, 7.25], grey: [6.1, 6.45] };
const njWord = (c, x, y, h) => `<g transform="translate(${r2(x)} ${r2(y)}) scale(${c.mirrored ? -1 : 1} -1) skewX(-12)"><text y="${r2(h * 0.36)}" font-size="${r2(h)}" text-anchor="middle" ` +
  `font-weight="400" font-family="${SANS}" fill="none" stroke="#d9dde3" stroke-width="${r2(h * 0.03)}">nightjet</text></g>`;
const obbMark = (c, x, y, h) => letters(c, x, y, h * 1.2, "ÖBB", "#e2002a", { weight: 800 });
// A silver-framed door: x the frame's left edge.
const njDoor = (c, x, word, { y0 = NJC.sill + 0.05, w = 5.0 } = {}) => rect(x, y0, w, 11.6 - y0, NJ.frame, 0, `rx="0.25" stroke="rgba(0,0,0,0.3)" stroke-width="0.5" vector-effect="non-scaling-stroke"`) +
  rect(x + 0.6, y0 + 0.25, w - 1.2, 11.1 - y0, NJ.blue, 0, `stroke="rgba(0,0,0,0.45)" stroke-width="0.5" vector-effect="non-scaling-stroke"`) +
  rect(x + (w - 1.3) / 2, 8.0, 1.3, 2.3, NJ.band, 0, 'rx="0.4"') + (word ? letters(c, x + w / 2, 11.35, 0.36, word, "#ffffff", { weight: 700, italic: true }) : "");
// The body and its paint; o.drop a low floor ({ a, b, y }).
function njBody(c, o = {}) {
  const L = c.L, R = NJC.roof, S = NJC.sill, x0 = 0.45, x1 = L - 0.45, dr = o.drop;
  const low = dr ? `L${r2(dr.a - 0.8)} ${S}Q${r2(dr.a)} ${S} ${r2(dr.a)} ${r2(S - 0.6)}L${r2(dr.a)} ${dr.y}L${r2(dr.b)} ${dr.y}L${r2(dr.b)} ${r2(S - 0.6)}Q${r2(dr.b)} ${S} ${r2(dr.b + 0.8)} ${S}` : "";
  const d = `M${x0} ${S}${low}L${r2(x1)} ${S}L${r2(x1)} ${r2(R - 1.0)}Q${r2(x1)} ${R} ${r2(x1 - 1.0)} ${R}L${r2(x0 + 1.0)} ${R}Q${x0} ${R} ${x0} ${r2(R - 1.0)}Z`;
  const paint = rect(-1, 0, L + 2, 20, NJ.blue) + rect(-1, R - 1.2, L + 2, 2, NJ.roof) + rect(-1, NJC.red[0], L + 2, NJC.red[1] - NJC.red[0], NJ.red) +
    rect(-1, NJC.grey[0], L + 2, NJC.grey[1] - NJC.grey[0], NJ.grey);
  return shell(d, NJ.blue, paint);
}
// Under the floor: the silver fairing between the trucks; trucks; ends.
function njRunning(c, { fair = true } = {}) {
  const L = c.L, S = NJC.sill, b1 = L / 2 - 31.17, b2 = L / 2 + 31.17;
  let s = fair ? rect(b1 + 6.0, 1.75, b2 - b1 - 12.0, S - 1.75, NJ.silver, 0.5, 'rx="0.3"') + lines([[L * 0.35, 1.8, L * 0.35, S], [L * 0.5, 1.8, L * 0.5, S], [L * 0.65, 1.8, L * 0.65, S]], "rgba(0,0,0,0.25)", 0.5) : "";
  s += truck(b1, { wb: 8.53, d: 36.2, top: S }) + truck(b2, { wb: 8.53, d: 36.2, top: S });
  return s + (c.coupledL ? gangway(0, -1, 4.0, NJC.roof - 1.0) : "") + (c.coupledR ? gangway(L, 1, 4.0, NJC.roof - 1.0) : "");
}
const njWin = (x, w, y0 = 7.45, y1 = 9.7) => rect(x, y0, w, y1 - y0, "#2a3038", 0, `rx="0.3" stroke="#0b0c0e" stroke-width="0.5" vector-effect="non-scaling-stroke"`) +
  rect(x + 0.15, y0 + (y1 - y0) * 0.6, w - 0.3, (y1 - y0) * 0.28, C.glassLight, 0, 'rx="0.15" opacity="0.8"');
// Sleeping car (WLAmz): ten compartment windows in the band, one more on
// its own at the far end; two small windows low by the door end.
function njSleeper(c) {
  const L = c.L;
  let s = njBody(c) + rect(15.6, NJC.band[0], 65.0, NJC.band[1] - NJC.band[0], NJ.band, 0, 'rx="0.3"') + rect(5.9, 7.25, 4.4, 2.65, NJ.band, 0, 'rx="0.3"');
  s += njWin(6.2, 3.8);
  for (let i = 0; i < 10; i++) s += njWin(16.0 + i * 6.7, 3.8);
  s += njWin(63.4, 1.9, 5.55, 6.15) + njWin(70.1, 1.9, 5.55, 6.15);
  s += njDoor(c, L - 5.75, "sleeping car") + obbMark(c, 2.7, 8.8, 0.75) + njWord(c, 33.0, 4.9, 2.6) + letters(c, 57.3, 5.75, 0.6, "sleeping car", "#ffffff", { weight: 700, italic: true });
  s += roofCover(L - 23, NJC.roof, 21, 0.35, "#a7adb3", 4);
  return s + njRunning(c);
}
// Couchette car (Bcmz): eleven windows, the mini cabins' narrower ones
// toward one end, their lower berths' small windows by the door.
function njCouchette(c) {
  const L = c.L, xs = [8.9, 13.8, 18.8, 24.2, 29.7, 35.3, 41.3, 47.8, 54.3, 61.4, 69.6], ws = [2.9, 2.9, 2.9, 3.0, 3.0, 3.6, 3.6, 3.8, 3.8, 4.1, 4.4];
  let s = njBody(c) + rect(8.5, NJC.band[0], 66.2, NJC.band[1] - NJC.band[0], NJ.band, 0, 'rx="0.3"');
  xs.forEach((x, i) => (s += njWin(x, ws[i])));
  s += njWin(55.4, 1.9, 5.55, 6.15) + njWin(62.4, 1.9, 5.55, 6.15);
  s += njDoor(c, L - 5.75, "couchette") + obbMark(c, 2.7, 8.8, 0.75) + njWord(c, 30.0, 4.9, 2.6) + letters(c, 51.4, 5.75, 0.6, "couchette", "#ffffff", { weight: 700, italic: true });
  s += roofCover(L - 23, NJC.roof, 21, 0.35, "#a7adb3", 4);
  return s + njRunning(c);
}
// The multi-function car: a low floor round its door (the accessible
// entrance, bicycles and luggage), seats and the accessible compartment at
// the ends.
function njMulti(c) {
  const L = c.L, dr = { a: 24.0, b: 60.0, y: 1.6 };
  let s = njBody(c, { drop: dr }) + rect(4.5, NJC.band[0], 12.0, NJC.band[1] - NJC.band[0], NJ.band, 0, 'rx="0.3"') + rect(64.0, NJC.band[0], 16.0, NJC.band[1] - NJC.band[0], NJ.band, 0, 'rx="0.3"');
  s += njWin(5.0, 4.6) + njWin(11.4, 4.6) + njWin(64.6, 3.4) + njWin(68.6, 3.4) + njWin(75.0, 4.6);
  s += njWin(30.0, 1.6, 5.2, 8.6) + njWin(37.0, 1.6, 5.2, 8.6);
  s += njDoor(c, 46.0, "", { y0: dr.y + 0.1 }) + njWord(c, 16.5, 5.0, 2.3) + obbMark(c, 2.7, 8.8, 0.75);
  s += rect(dr.a + 1.0, 1.0, 20, 0.6, NJ.silver, 0.4);
  s += roofCover(4, NJC.roof, 20, 0.35, "#a7adb3", 3);
  return s + njRunning(c, { fair: false }) + rect(L / 2 - 31.17 + 6, 1.75, 2.8, NJC.sill - 1.75, NJ.silver, 0.4) + rect(L / 2 + 31.17 - 8.8, 1.75, 2.8, NJC.sill - 1.75, NJ.silver, 0.4);
}
// The seat car with the cab (Bfmpz), cab at the left: a Vectron-like front
// (the windshield raked back to the roof, a dark buffer beam), the big
// seat windows behind the door; the red blade sweeping from under the
// windows down to the front's foot, dark grey inside it.
function njSeatCab(c) {
  const L = c.L, R = NJC.roof, x1 = L - 0.45, F = 2.1; // F: the body's front, behind the buffers
  const d = `M${F} 3.0L${r2(x1)} 3.0L${r2(x1)} ${r2(R - 1.0)}Q${r2(x1)} ${R} ${r2(x1 - 1.0)} ${R}L${F + 9.8} ${R}` +
    smooth([[F + 9.8, R], [F + 3.6, 12.4], [F + 1.1, 9.8], [F + 0.3, 8.2], [F, 3.9]]) + "Z";
  const paint = rect(-1, 0, L + 2, 20, NJ.blue) + rect(F + 10, R - 1.2, L, 2, NJ.roof) +
    rect(F + 22.5, 6.1, L, 1.2, NJ.red) +
    // The blade: the red sweeping down from the stripe to the front's foot,
    // the dark grey within it.
    path(`M${F + 23} 7.3L${F + 18.7} 7.3C${F + 13} 7.0 ${F + 9} 5.8 ${F + 4.3} 4.2L${F + 3.9} 3.0L${F + 23} 3.0Z`, NJ.red) +
    path(`M${F + 22.5} 6.1L${F + 18.5} 6.1C${F + 15} 5.6 ${F + 12.5} 4.8 ${F + 10.4} 3.6L${F + 22.5} 3.6Z`, "#333740") +
    // The cab's side window in its black surround, along the nose.
    path(`M${F + 6.7} 7.9L${F + 6.7} 10.9L${F + 2.6} 10.9L${F + 1.4} 9.6L${F + 0.9} 7.9Z`, NJ.band) +
    rect(-1, 0, F + 1.0, 4.0, "#2b2e33");
  let s = shell(d, NJ.blue, paint);
  s += rect(F + 4.7, 8.1, 1.75, 2.5, C.glass, 0, `rx="0.3" stroke="${C.gasket}" stroke-width="0.5" vector-effect="non-scaling-stroke"`) +
    path(`M${F + 1.25} 9.7L${F + 3.5} 12.25L${F + 4.3} 12.3L${F + 2.0} 9.7Z`, "#3b444e");
  s += njDoor(c, F + 18.5, "seat car", { y0: 3.05, w: 6.0 });
  s += `<g transform="translate(${F + 16.2} 10.2) scale(${c.mirrored ? -1 : 1} -1)"><text x="-0.1" y="0.2" font-size="0.6" text-anchor="end" font-weight="800" font-family="${SANS}" fill="#e2002a">ÖBB</text>` +
    `<text x="0" y="0.2" font-size="0.62" text-anchor="start" font-weight="700" font-style="italic" font-family="${SANS}" fill="#ffffff">nightjet</text></g>`;
  // The seat windows, tall, their foot in the red stripe.
  s += rect(F + 25.8, 6.4, L - F - 28.6, 4.0, NJ.band, 0, 'rx="0.35"');
  for (let i = 0; i < 8; i++) s += njWin(F + 26.1 + i * 7.15, 6.6, 6.6, 10.2);
  s += njWord(c, F + 50.0, 4.9, 2.6) + letters(c, F + 34.0, 5.6, 0.6, "seat car", "#ffffff", { weight: 700, italic: true });
  // The front: the buffer beam, buffers, lamps; horns on the roof.
  s += rect(F - 0.2, 1.6, 2.6, 2.6, "#2b2e33") + uicBuffers(0, -1, { sill: 4.0, beam: 2.4, y: 3.45, end: F + 0.1 }) +
    lamp(F + 0.15, 5.0, 0.4, 0.5) + lamp(F + 0.15, 4.45, 0.38, 0.3, RED_LAMP) + rect(F + 6.0, R - 0.05, 1.4, 0.3, "currentColor") + rect(F + 6.2, R + 0.25, 0.35, 0.35, "currentColor");
  s += roofCover(F + 24, R, 9, 0.4, "#a7adb3", 3);
  return s + njRunning(c);
}

// ===================== ÖBB: the classic Nightjet =====================
// The UIC-Z cars still on the Zürich-Amsterdam, -Berlin and -Graz
// Nightjets and the EuroNights east (26.4 m, trucks 19 m apart): sleeping
// cars WLABmz (61 80 72-90, Siemens 2003-2005, bought from DB, and ÖBB's
// own 73 81 72-90?), couchettes Bcmz 59-90, seat cars Bmz 21-91. The
// paint (photographs of WLABmz 72-90 011 at Bruxelles-Midi 2025 and a
// Bcmz 59-90 at Wien Matzleinsdorf 2024): night blue, a red line under the
// windows over a thin grey one, the doors light grey; "nightjet" big in
// outlined italic, ÖBB in red, the car's kind in white italic, a big "2"
// by the couchettes' and seats' door.
const NJO = { blue: "#262f66", red: "#d8222b", grey: "#8c919b", door: "#c9cdd2", roof: "#9aa1aa" };
// Sleeper windows (WLABmz 72-90): the compartments' different sizes, as
// [x, w] along the 86.6 ft car.
const NJO_WL = [[4.6, 1.5], [7.9, 1.5], [10.6, 1.5], [14.2, 1.5], [17.3, 1.5], [22.8, 2.9], [27.6, 2.1], [34.3, 4.0], [40.2, 3.0], [49.3, 5.5], [57.4, 4.0], [66.6, 4.7], [76.0, 5.8]];
function njoCar(c, kind) {
  const L = c.L, R = 13.3, S = 3.9, b1 = L / 2 - 31.15, b2 = L / 2 + 31.15;
  const d = `M0.6 ${S}L${r2(L - 0.6)} ${S}L${r2(L - 0.6)} ${r2(R - 1.6)}Q${r2(L - 0.6)} ${R} ${r2(L - 2.4)} ${R}L2.4 ${R}Q0.6 ${R} 0.6 ${r2(R - 1.6)}Z`;
  const paint = rect(-1, 0, L + 2, 20, NJO.blue) + rect(-1, 11.9, L + 2, 3, NJO.roof) + line(-1, 11.9, L + 1, 11.9, "rgba(0,0,0,0.2)", 0.5) +
    rect(-1, 6.95, L + 2, 0.4, NJO.red) + rect(-1, 6.75, L + 2, 0.2, NJO.grey);
  let s = shell(d, NJO.blue, paint);
  const win = (x, w, y0 = 7.55, y1 = 10.45) => rect(x, y0, w, y1 - y0, C.glass, 0, `rx="0.35" stroke="#b9bec5" stroke-width="0.6" vector-effect="non-scaling-stroke"`) +
    rect(x + 0.15, y0 + (y1 - y0) * 0.62, w - 0.3, (y1 - y0) * 0.28, C.glassLight, 0, 'rx="0.15"');
  if (kind === "sleeper") for (const [x, w] of NJO_WL) s += win(x, w, w < 2 ? 7.9 : 7.55);
  else for (let i = 0; i < 10; i++) s += win(8.4 + i * 7.15, kind === "couchette" ? 4.4 : 4.8);
  // The doors: light grey at each end, a window in each.
  for (const x of kind === "sleeper" ? [L - 4.4] : [1.6, L - 4.4]) s += rect(x, S + 0.15, 2.7, 7.4, NJO.door, 0, `stroke="rgba(0,0,0,0.4)" stroke-width="0.5" vector-effect="non-scaling-stroke"`) +
    rect(x + 0.55, 7.7, 1.6, 2.6, C.glass, 0, 'rx="0.6"');
  const word = { sleeper: "sleeping car", couchette: "liegewagen", coach: "sitzwagen" }[kind];
  s += obbMark(c, kind === "sleeper" ? 17.0 : 52.0, 5.6, 0.95) + njWord(c, kind === "sleeper" ? 34.0 : 66.0, 5.15, 2.0) +
    letters(c, kind === "sleeper" ? 58.0 : 28.0, 5.8, 0.7, word, "#ffffff", { weight: 600, italic: kind === "sleeper" });
  if (kind !== "sleeper") s += letters(c, 13.9, 9.0, 1.5, "2", "#ffffff", { weight: 500 });
  s += boxes(b1 + 6, b2 - 6, S, 3, 1.2) + truck(b1, { wb: 8.2, d: 36, top: S }) + truck(b2, { wb: 8.2, d: 36, top: S });
  s += uicBuffers(0, -1, { sill: S }) + uicBuffers(L, 1, { sill: S }) + czHvac(L / 2 - 7, R, 14, 0.6);
  return s + (c.coupledL ? gangway(0, -1, 4.25, 11.8) : "") + (c.coupledR ? gangway(L, 1, 4.25, 11.8) : "");
}

// ===================== DB: Intercity 2 (Gäubahn) =====================
// The Zürich-Stuttgart ICs (IC 87, numbers 180-189, 280-289, 380s, 480s,
// 1080s; route 91-19-Y): DB's Bombardier Twindexx Vario IC2 sets, back on
// the line since June 2025 (de.wikipedia "Intercity 2 (Deutsche Bahn)"):
// a class 147.5 TRAXX at the Stuttgart end ("147 590 schiebt den IC nach
// Zürich HB", Singen 2026), the first-class car (DApza 687.2) next to it,
// three second-class cars (DBpza 682.2), and the driving trailer with the
// bicycles, the wheelchair places and the family area (DBpbzfa 668.2) at
// the Zürich end; 134.5 m without the locomotive, the double-deck cars
// about 4.6 m tall. Paint (Westerstede-Ocholt 2026, Wiesbaden 2026,
// Oberhausen 2025): light grey-white, a grey roof, the traffic-red stripe
// between the decks, sweeping down the cab car's nose; "IC" big in grey
// italic capitals behind the cab, the class numeral by the doors.
const DD = { roof: 15.1, end: 4.0, low: 1.35, up: [10.0, 13.1], lowWin: [2.25, 5.25], stripe: [5.75, 6.65] };
// A middle car (o.cls "1"/"2"), or the cab car (o.cab, cab at the left).
function ic2Car(c, o = {}) {
  const L = c.L, R = DD.roof, x1 = L - 0.45, cab = !!o.cab;
  const d0 = cab ? 24.0 : 13.2, d1 = L - 13.2; // the low floor between the trucks
  const front = cab ? `M1.4 2.1L${r2(d0 - 2.5)} 2.1Q${r2(d0 - 1.6)} 2.1 ${r2(d0 - 1.6)} 3.0L${r2(d0 - 1.6)} ${DD.end}L${r2(d0 - 0.6)} ${DD.end}` : `M0.45 ${DD.end}L${r2(d0 - 0.6)} ${DD.end}`;
  const drop = `Q${r2(d0)} ${DD.end} ${r2(d0)} ${r2(DD.end - 0.6)}L${r2(d0)} ${DD.low}L${r2(d1)} ${DD.low}L${r2(d1)} ${r2(DD.end - 0.6)}Q${r2(d1)} ${DD.end} ${r2(d1 + 0.6)} ${DD.end}`;
  // The cab car's nose (Westerstede-Ocholt, 2026): nearly upright from its
  // foot to the cab window's top, then rounding over to the roof ~9.5 ft back.
  const nose = smooth([[9.6, R], [5.0, 14.6], [2.4, 13.2], [1.0, 11.0], [0.45, 8.5], [0.3, 4.6], [0.5, 2.6], [1.4, 2.1]]);
  const d = front + drop + `L${r2(x1)} ${DD.end}L${r2(x1)} ${r2(R - 1.4)}Q${r2(x1)} ${R} ${r2(x1 - 1.4)} ${R}` +
    (cab ? `L9.6 ${R}${nose}Z` : `L1.85 ${R}Q0.45 ${R} 0.45 ${r2(R - 1.4)}Z`);
  let paint = rect(-1, 0, L + 2, 20, ICE.white) + rect(-1, 14.0, L + 2, 3, "#8f969d") + line(-1, 14.0, L + 1, 14.0, "rgba(0,0,0,0.2)", 0.5) +
    rect(-1, 0, L + 2, 1.9, "#4b5056");
  if (cab) paint += path(M([-0.5, 1.75]) + smooth([[-0.5, 1.75], [4.5, 2.4], [9.5, 3.9], [13.0, 5.2], [16.5, DD.stripe[0]], [19.0, DD.stripe[0]]]) + L_([[L + 1, DD.stripe[0]], [L + 1, DD.stripe[1]], [19.0, DD.stripe[1]]]) +
      smooth([[19.0, DD.stripe[1]], [16.2, DD.stripe[1]], [12.6, 6.25], [9.2, 4.95], [4.4, 3.4], [-0.5, 2.75]]) + "Z", ICE.red) +
    // The cab's big side window: black, its front edge following the nose,
    // from the stripe's level up to under the roof.
    path(M([4.45, 3.7]) + smooth([[4.45, 3.7], [5.1, 5.8], [5.9, 7.9], [7.0, 9.5]]) + L_([[9.4, 9.5], [9.4, 3.7]]) + "Z", "#1c1e22");
  else paint += rect(-1, DD.stripe[0], L + 2, DD.stripe[1] - DD.stripe[0], ICE.red);
  let s = shell(d, ICE.white, paint);
  const glass = (x, y0, y1, w = 4.6) => rect(x, y0, w, y1 - y0, C.glass, 0, `rx="0.5" stroke="#4c5258" stroke-width="0.7" vector-effect="non-scaling-stroke"`) +
    rect(x + 0.2, y0 + (y1 - y0) * 0.6, w - 0.4, (y1 - y0) * 0.28, C.glassLight, 0, 'rx="0.3"');
  if (cab) s += path(M([6.7, 5.9]) + L_([[6.7, 8.3]]) + smooth([[6.7, 8.3], [7.3, 9.15], [8.0, 9.3]]) + L_([[9.2, 9.3], [9.2, 5.9]]) + "Z", C.glass) +
    rect(6.9, 8.0, 2.1, 1.0, C.glassLight, 0, 'opacity="0.6"');
  // Doors: double, at each end of the low floor (the cab car's only behind
  // the cab section).
  const door = (x) => rect(x, DD.low + 0.1, 5.4, 8.7 - DD.low, "none", 0, `rx="0.2" stroke="rgba(40,44,48,0.65)" stroke-width="0.6" vector-effect="non-scaling-stroke"`) +
    lines([[x + 2.7, DD.low + 0.2, x + 2.7, 8.7]], "rgba(40,44,48,0.65)", 0.6) + rect(x + 0.9, 2.6, 0.85, 4.4, C.glass, 0, 'rx="0.42"') + rect(x + 3.65, 2.6, 0.85, 4.4, C.glass, 0, 'rx="0.42"');
  const doorsAt = cab ? [d0 + 0.2] : [d0 - 0.1, d1 - 5.3];
  for (const x of doorsAt) s += door(x);
  // Windows: the upper deck from door to door, the lower deck between them.
  const ua = cab ? d0 - 0.3 : 4.2, ub = L - 4.6;
  const nu = Math.floor((ub - ua - 4.6) / 5.75) + 1;
  for (let i = 0; i < nu; i++) s += glass(ua + i * 5.75, DD.up[0], DD.up[1]);
  const la = cab ? 31.5 : d0 + 5.9, lb = d1 - 0.8, nl = Math.floor((lb - la - 4.2) / 5.2) + 1;
  for (let i = 0; i < nl; i++) s += glass(la + i * 5.2, DD.lowWin[0], DD.lowWin[1], 4.2);
  const grl = (x, y, w, h) => rect(x, y, w, h, "#dfe2e4", 0, `stroke="rgba(0,0,0,0.25)" stroke-width="0.5" vector-effect="non-scaling-stroke"`) + slats(x, y, w, h, 0.2, "rgba(0,0,0,0.3)");
  // The end sections: a window over the truck, grilles; the class numeral.
  if (cab) s += glass(15.7, 5.9, 9.5, 3.2) + grl(15.7, 3.3, 3.3, 2.4) + grl(10.3, 10.7, 2.6, 2.4) + grl(9.9, 8.6, 2.1, 1.0) +
    letters(c, 13.6, 3.85, 2.75, "IC", "#6f767d", { weight: 700, italic: true });
  s += letters(c, cab ? 20.5 : L - 16.3, 8.9, 1.2, o.cls || "2", "#3c4248", { weight: 700 });
  if (o.bikes) s += bike(la + 2 * 5.2 + 2.1, 3.8, 1.5, "#3c4248");
  // Roof: the air-conditioning over each end section.
  s += roofCover(cab ? 10.2 : 1.8, R, 8.4, 0.35, "#a7adb3", 3) + roofCover(L - 10.2, R, 8.4, 0.35, "#a7adb3", 3);
  // Trucks (20 m apart), buffers and couplings.
  const t0 = cab ? 10.8 : L / 2 - 32.8, t1 = cab ? 10.8 + 65.6 : L / 2 + 32.8;
  s += truck(t0, { wb: 8.2, d: 33, top: DD.end }) + truck(t1, { wb: 8.2, d: 33, top: DD.end });
  s += uicBuffers(L, 1, { sill: DD.end + 0.3, beam: 2.4 }) + (cab ? uicBuffers(0, -1, { sill: 2.6, beam: 1.9, end: 0.6 }) + lamp(0.55, 4.6, 0.45, 0.55) + lamp(0.6, 3.9, 0.38, 0.32, RED_LAMP)
    : uicBuffers(0, -1, { sill: DD.end + 0.3, beam: 2.4 }));
  return s + (c.coupledL ? gangway(0, -1, 4.4, 13.8) : "") + (c.coupledR ? gangway(L, 1, 4.4, 13.8) : "");
}
// The class 147.5 TRAXX 3 (2016-2020, 18.9 m, Bo'Bo'): light grey, its
// side ribbed, the red stripe along the middle with the DB mark, the frame
// and the cabs' lower corners dark grey; a cab door with a window at each
// end.
const NOSE_147 = [[1.1, 4.0], [0.9, 7.8], ["q", 0.95, 8.7, 1.6, 9.2], [2.5, 12.3], ["q", 2.8, 12.95, 3.9, 12.95]];
const paint147 = (c, L) => rect(-1, 0, L + 2, 20, "#e3e5e6") + rect(-1, 11.9, L + 2, 3, "#9aa1a8") + rect(-1, 0, L + 2, 5.25, "#4d5258") +
  path(`M3.4 7.55L${L - 3.4} 7.55L${L - 3.0} 8.5L3.0 8.5Z`, ICE.red) + lines(Array.from({ length: 22 }, (_, i) => [17.2 + i * 1.32, 5.4, 17.2 + i * 1.32, 11.8]), "rgba(0,0,0,0.13)", 0.6);
const over147 = (c, L) => dbMark147(c, L - 14.5, 8.03, 1.0) + rect(L / 2 + 13.4, 7.55, 1.5, 0.95, "#e3e5e6") + letters(c, 12.0, 4.6, 0.45, "147 5", "#e3e5e6", { weight: 600 });
const loco147 = (c) => euroLoco(c, { roof: 12.95, sill: 4.0, nose: NOSE_147, rake: [[1.6, 9.2], [2.5, 12.3]], centers: 34.25, door: 5.6, wheel: 49,
  paint: paint147, over: over147, surround: "#25282c", grilles: [[-14.5, 4.0, 10.2, 11.6], [10.5, 4.0, 10.2, 11.6]], grilleFill: "rgba(40,44,48,0.35)" });

// ===================== ÖBB: S-Bahn Vorarlberg =====================
// ÖBB 4748 (Siemens Desiro ML "cityjet", 21 for Vorarlberg 2022-2023, de.
// wikipedia "S-Bahn Vorarlberg"): four cars, 100 m, each on its own two
// trucks, the end cars motored, the floor 600 mm up, two double doors a
// side in each car; the newer Desiro ML front, upright under a roof visor.
// Vorarlberg's paint (photographs of 4748 016 at St. Margrethen 2025-2026):
// white above, ÖBB red from mid-window down, a black skirt; the windows in
// black; black doors with white lines; the cab front white over the red,
// ÖBB in red on a white band under the windshield; "VMOBIL" big in grey
// letters high on the side, "S BAHN" in white on the windows.
const VM = { white: "#f1f2f3", red: "#e3241b", black: "#1b1c1f", grey: "#a7acb2", roof: "#b9bfc6" };
const seqC = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
const NOSE_4748 = [[1.0, 3.2], [0.55, 4.6], [0.5, 7.8], ["q", 0.6, 11.4, 2.0, 12.9], ["q", 3.3, 13.97, 5.8, 13.97]];
const vmPaint = (cab) => (c, g) => {
  const L = g.L;
  let s = rect(-1, 0, L + 2, 20, VM.white) + rect(-1, 13.3, L + 2, 2, VM.roof) + rect(-1, 3.2, L + 2, 5.4, VM.red) + rect(-1, 0, L + 2, 3.2, VM.black);
  // The nose: red low, a white band (ÖBB on it, seen from ahead), a thin
  // red line under the windshield.
  if (cab) s += rect(-1, 6.0, 4.6, 2.6, VM.white) + rect(-1, 8.6, 4.6, 0.3, VM.red) +
    path("M-1 9.0L3.6 9.0Q4.4 9.2 4.8 10.4L5.6 13.9L-1 13.9Z", VM.black) + rect(6.9, 6.6, 1.6, 5.4, VM.black, 0, 'rx="0.4"') + rect(7.1, 9.2, 1.2, 2.4, C.glass, 0, 'rx="0.3"');
  return s;
};
const vmDoor = (x) => ({ x, w: 4.3, y0: 3.3, y1: 10.5, leaves: 2, glassY: 0.4, glassH: 0.45, fill: VM.black });
const vmOver = (c, x, sb) => letters(c, x, 11.75, 2.3, "VMOBIL", VM.grey, { weight: 500, family: NARROW, spacing: 0.3, stretch: 0.8 }) +
  (sb ? letters(c, sb, 9.9, 0.75, "S BAHN", "#ffffff", { weight: 700, family: NARROW, anchor: "start" }) : "");
const vmCab = (c) => unit(c, { roof: 13.97, sill: 3.2, nose: NOSE_4748, rake: [[0.6, 8.9], [1.9, 12.7]], depth: 3.4, cabLen: 7, lampY: 5.4,
  rows: [{ xs: [10.4], y: 5.6, w: 3.0, h: 5.0, r: 0.4 }, { xs: seqC(24.6, 5.5, 7), y: 5.6, w: 4.7, h: 5.0, r: 0.4 }, { xs: [c.L - 13.6, c.L - 8.1], y: 5.6, w: 4.7, h: 5.0, r: 0.4 }],
  doors: [vmDoor(18.4), vmDoor(c.L - 21.0)], trucks: [11.5, c.L - 11.5], wheel: 33, paint: vmPaint(true), surround: VM.black,
  pan: 30, extra: (cc, g) => czHvac(g.L - 30, 13.97, 10) + boxes(17, 34, 3.2, 2, 1.1) + boxes(40, g.L - 18, 3.2, 2, 0.9) +
    letters(cc, 13.0, 11.6, 1.0, "ÖBB", VM.red, { weight: 800 }) + letters(cc, 13.2, 5.0, 0.55, "cityjet", "#ffffff", { weight: 700, italic: true }) + vmOver(cc, 38, 24.9) +
    lines([[22.9, 3.6, 22.9, 10.3], [23.15, 3.6, 23.15, 10.3]], "#ffffff", 0.5) });
const vmMid = (c) => unit(c, { roof: 13.97, sill: 3.2,
  rows: [{ xs: [3.2], y: 5.6, w: 4.7, h: 5.0, r: 0.4 }, { xs: seqC(23.0, 5.5, 6), y: 5.6, w: 4.7, h: 5.0, r: 0.4 }, { xs: [c.L - 8.0], y: 5.6, w: 4.7, h: 5.0, r: 0.4 }],
  doors: [vmDoor(16.4), vmDoor(c.L - 20.4)], trucks: [12.7, c.L - 12.7], wheel: 30, paint: vmPaint(false),
  extra: (cc, g) => czHvac(4, 13.97, 9) + czHvac(g.L - 13, 13.97, 9) + boxes(22, g.L - 22, 3.2, 3, 1.0) + vmOver(cc, 36, 23.3) });

// ===================== DB Regio Baden-Württemberg (bwegt) =====================
// The state's trains run by DB Regio into Basel Badischer Bahnhof (RE 7,
// RB 27, RE 27 from Offenburg, Freiburg, Karlsruhe) and Schaffhausen (RE 3,
// Singen-Erzingen and on to Basel Bad Bf). The bwegt paint (photographs of
// 1462 013 at Basel SBB 2024, 1462 513 at Basel Bad Bf, 463 505 at
// Gundelfingen, 612 625 at Schaffhausen 2024, 612 129 2024): white over a
// black skirt, bright yellow over the roof edge and round the cab, the
// doors yellow, the windows in dark grey; "bwegt" (bw in black, egt in
// yellow) with the lion, "Mobilität für Baden-Württemberg" under it; a
// yellow bicycle by the bicycle doors.
const BW = { white: "#eceee9", yellow: "#ffd400", black: "#1e1f1c", grey: "#3a3b37", roof: "#b9bcb5" };
const bwegt = (c, x, y, h) => `<g transform="translate(${r2(x)} ${r2(y)}) scale(${c.mirrored ? -1 : 1} -1)">` +
  `<text x="0" y="0" font-size="${r2(h)}" font-weight="500" font-family="${SANS}" fill="${BW.black}">bw<tspan fill="#e0b400">egt</tspan></text>` +
  `<text x="${r2(-h * 0.05)}" y="${r2(h * 0.42)}" font-size="${r2(h * 0.17)}" font-weight="500" font-family="${SANS}" fill="${BW.black}">Mobilität für Baden-Württemberg</text></g>`;
const bwDoor = (x, y0, y1, w = 4.3) => ({ x, w, y0, y1, leaves: 2, glassY: 0.35, glassH: 0.5, fill: BW.yellow, grabs: false });
// Desiro HC (DB 462, Netz Rheintal, 2019-2020): four cars, single-deck
// end cars (26.2 m, the motors and a pantograph each) and two double-deck
// middle cars (25.2 m), 4.64 m tall (de.wikipedia "Siemens Desiro HC").
const NOSE_HC = [[1.0, 2.9], [0.6, 4.4], ["q", 0.45, 7.6, 1.9, 9.8], [5.6, 14.0], ["q", 6.8, 15.2, 9.8, 15.2]];
const hcPaint = (cab) => (c, g) => {
  const L = g.L;
  let s = rect(-1, 0, L + 2, 20, BW.white) + rect(-1, 13.6, L + 2, 3, BW.yellow) + rect(-1, 0, L + 2, 3.0, BW.black);
  // The cab: yellow from the roof down round the windshield to the nose's
  // foot; behind it a dark grey sweep from the roof down to the skirt,
  // the cab's side window in it.
  if (cab) s += path("M-1 3.5L-1 15.3L9.8 15.3Q6.8 12.4 5.6 9.0Q4.8 6.0 4.9 3.5Z", BW.yellow) +
    path("M8.6 15.3Q11.2 9.0 10.6 3.5L13.2 3.5Q14.4 8.0 14.2 11.4L16.0 13.6L16.0 15.3Z", BW.grey);
  return s;
};
const hcEnd = (c) => unit(c, { roof: 15.2, sill: 2.9, nose: NOSE_HC, rake: [[1.9, 9.8], [5.6, 14.0]], depth: 3.6, cabLen: 10, lampY: 5.4,
  rows: [{ xs: [12.9], y: 8.4, w: 1.8, h: 3.0, r: 0.3 }, { xs: [17.4], y: 6.0, w: 9.0, h: 4.4, r: 0.5 }, { xs: [32.0, 41.6, 51.2], y: 6.0, w: 9.0, h: 4.4, r: 0.5 }, { xs: [70.6], y: 6.0, w: 9.0, h: 4.4, r: 0.5 }],
  doors: [bwDoor(26.9, 3.0, 11.0), bwDoor(c.L - 22.4, 3.0, 11.0)], trucks: [11.0, c.L - 11.0], wheel: 33, paint: hcPaint(true), surround: BW.black,
  pan: c.L - 18, extra: (cc, g) => czHvac(16, 15.2, 12) + boxes(26, 58, 2.9, 3, 1.0) + bwegt(cc, 19.2, 5.0, 1.2) + bike(c.L - 26.8, 4.4, 1.6, "#e0b400") });
const hcMid = (c) => unit(c, { roof: 15.2, sill: 3.4, drop: { a: 17.0, b: c.L - 17.0, y: 1.2 }, diaphragm: [3.7, 13.4],
  rows: [{ xs: [27.6, 34.4, 41.2, 48.0], y: 3.2, w: 5.8, h: 2.8, r: 0.45 }, { xs: [27.6, 34.4, 41.2, 48.0], y: 10.2, w: 5.8, h: 2.6, r: 0.5 },
    { xs: [2.6, c.L - 9.0], y: 6.4, w: 6.4, h: 2.9, r: 0.45 }],
  doors: [bwDoor(19.0, 1.3, 9.2, 5.6), bwDoor(c.L - 24.6, 1.3, 9.2, 5.6)], trucks: [9.0, c.L - 9.0], wheel: 33,
  paint: (cc, g) => rect(-1, 0, g.L + 2, 20, BW.white) + rect(-1, 13.6, g.L + 2, 3, BW.yellow) + rect(-1, 0, g.L + 2, 2.0, BW.black) + rect(26.8, 2.8, 28.6, 3.6, BW.grey, 0, 'rx="0.4"'),
  extra: (cc, g) => czHvac(3, 15.2, 10) + czHvac(g.L - 13, 15.2, 10) + bwegt(cc, 31, 8.0, 1.1) });
// Mireo (DB 463, 2019-2020): three cars on four trucks, Jacobs ones
// between the cars, 70 m long, 4.0 m tall, the floor low; two double
// doors a side in each end car, one in the middle car.
const NOSE_MIREO = [[1.4, 2.3], [0.7, 3.8], ["q", 0.5, 6.4, 1.6, 8.6], [4.6, 12.4], ["q", 5.6, 13.3, 8.0, 13.3]];
const mireoPaint = (cab) => (c, g) => {
  const L = g.L;
  let s = rect(-1, 0, L + 2, 20, BW.white) + rect(-1, 12.2, L + 2, 3, BW.yellow) + rect(-1, 0, L + 2, 2.5, BW.black);
  // The cab: a black visor over the windshield, yellow under it from the
  // lamps up and back over the cab door's top to the roof's yellow.
  if (cab) s += path("M-1 6.0L4.2 6.0Q7.6 7.4 9.2 12.2L-1 12.2Z", BW.yellow) + path("M1.4 8.4L4.6 12.6L8.2 13.4L-1 13.4L-1 8.4Z", BW.black) +
    path("M-1 2.5L1.4 2.5L1.6 3.2L-1 3.2Z", BW.black);
  return s;
};
const mireoEnd = (c) => unit(c, { roof: 13.3, sill: 2.3, nose: NOSE_MIREO, rake: [[1.6, 8.6], [4.6, 12.4]], depth: 3.4, cabLen: 8, lampY: 4.8,
  rows: [{ xs: [10.6], y: 6.5, w: 2.4, h: 3.6, r: 0.4 }, { xs: [24.0, 30.4, 36.8, 43.2, 49.6], y: 5.6, w: 5.6, h: 4.3, r: 0.45 }, { xs: [c.L - 12.0], y: 5.6, w: 5.6, h: 4.3, r: 0.45 }],
  doors: [bwDoor(17.0, 2.4, 10.4), bwDoor(c.L - 19.4, 2.4, 10.4)], trucks: [10.0, "end"], wheel: 33, paint: mireoPaint(true), surround: BW.black,
  extra: (cc, g) => czHvac(26, 13.3, 12) + boxes(24, 54, 2.3, 3, 0.9) + bwegt(cc, 12.6, 5.0, 1.0) });
const mireoMid = (c) => unit(c, { roof: 13.3, sill: 2.3,
  rows: [{ xs: [3.0, 9.4, 15.8, 22.2], y: 5.6, w: 5.6, h: 4.3, r: 0.45 }, { xs: [38.0, 44.4, 50.8, 57.2], y: 5.6, w: 5.6, h: 4.3, r: 0.45 }],
  doors: [bwDoor(29.8, 2.4, 10.4)], trucks: ["start", "end"], wheel: 30, paint: mireoPaint(false), pan: 40,
  extra: (cc, g) => czHvac(4, 13.3, 10) + boxes(8, 26, 2.3, 2, 0.8) + bike(c.L - 14, 3.8, 1.6, "#e0b400") });
// VT 612 (RegioSwinger, 1998-2004): two cars, 25.9 m each, tilting
// diesel-hydraulic, an engine under each car; a double door behind the cab
// and one at the inner end of each car; first class behind the cab.
const NOSE_612 = [[1.3, 3.6], [0.5, 4.8], [0.4, 7.4], ["q", 0.6, 9.4, 1.5, 10.1], [3.3, 12.2], ["q", 4.0, 12.9, 6.2, 12.9]];
const v612Paint = (c, g) => rect(-1, 0, g.L + 2, 20, BW.white) + rect(-1, 12.0, g.L + 2, 3, BW.roof) + rect(-1, 0, g.L + 2, 4.3, BW.black) +
  path("M-1 4.3L-1 13.0L5.4 13.0Q6.8 12.1 7.0 10.6L7.4 4.3Z", BW.yellow) + path("M0.6 6.4L0.8 9.6L2.8 11.4L5.6 11.4L5.8 6.4Z", BW.black);
const v612 = (c) => unit(c, { roof: 12.9, sill: 3.6, nose: NOSE_612, rake: [[1.5, 10.1], [3.3, 12.2]], depth: 2.4, cabLen: 7, lampY: 5.0,
  rows: [{ xs: [8.3], y: 6.4, w: 1.6, h: 4.0, r: 0.3 }, { xs: [16.2, 20.2], y: 6.0, w: 3.0, h: 4.4, r: 0.3 },
    { xs: Array.from({ length: 10 }, (_, i) => 29.6 + i * 4.4), y: 6.0, w: 3.0, h: 4.4, r: 0.3 }],
  doors: [bwDoor(10.6, 3.7, 10.8, 3.7), bwDoor(c.L - 8.6, 3.7, 10.8, 3.7)], trucks: [10.0, c.L - 10.0], wheel: 30, paint: v612Paint, surround: BW.black,
  extra: (cc, g) => exhaustBox(g.L - 22, 12.9) + boxes(16, g.L - 16, 3.6, 3, 1.4) + bwegt(cc, 22.0, 4.9, 1.0) + bike(26.2, 7.4, 1.6, "#e0b400") });
const exhaustBox = (x, roof) => rect(x, roof - 0.05, 6, 0.8, "#4a4d50", 0.4, 'rx="0.2"') + slats(x + 0.4, roof + 0.1, 5.2, 0.6, 0.35, "rgba(255,255,255,0.25)");

// ===================== SNCF's TER into Switzerland =====================
// Grand Est (Strasbourg/Mulhouse-Saint-Louis-Basel SBB, TER 96100-96299):
// the TER 200 push-pull trains, a BB 26000 with Corail coaches (photographs
// of BB 26151 and 26146 at Basel SBB, 2023 and August 2026; the coaches at
// Mulhouse and Colmar, April-May 2026), and AGC Z 27500 units in TER
// Alsace paint (Z 27878 at Basel SNCF 2023, Z 27888 at Belfort 2024).
// Auvergne-Rhône-Alpes (Bellegarde-Genève, TER 96500-96600): AGC Z 27500 in
// its blue and silver (Z 27691 at Satigny 2024, Z 27605 at Bellegarde
// 2025). Bourgogne-Franche-Comté (Besançon-Morteau-La Chaux-de-Fonds, the
// Ligne des Horlogers, TER 18101-18114; Frasne and Labergement-Vallorbe,
// 18131-18147): X 73500 railcars (X 73755 and 73753 at La Chaux-de-Fonds,
// 2025).
const TER = { blue: "#2d3fa0", deep: "#1f2c7a", silver: "#c9ced3", steel: "#b5bbc1", dark: "#4a4f55", band: "#3c434b", aura: "#2f4ea8" };
const terWord = (c, x, y, h, fill = TER.blue, region = null) => letters(c, x, y, h, "ter", fill, { weight: 400, italic: true, family: "Georgia, serif" }) +
  (region ? letters(c, x + h * 1.25, y - h * 0.05, h * 0.3, region, fill, { weight: 600, anchor: "start" }) : "");
const sncf = (c, x, y, h) => rect(x - h * 0.9, y - h / 2, h * 1.8, h, "#c8102e", 0, `rx="${r2(h * 0.25)}"`) + letters(c, x, y, h * 0.55, "SNCF", "#ffffff", { weight: 800, italic: true });
// --- BB 26000 "Sybic" (Alsthom 1988-1998): 17.71 m, B'B', 1,250 mm wheels,
// two pantographs; the cab's front leaning back, its corners cut. TER Grand
// Est's paint: silver; the cab's corner and windshield frame dark blue on
// the older ones (26151), dark grey on the refreshed (26158R); "fluo Grand
// Est" in a blue box mid-side; the Grand Est mark on the nose.
const NOSE_BB26 = [[1.7, 4.1], [1.05, 5.0], [1.05, 7.8], [1.9, 8.3], [3.0, 12.4], ["q", 3.4, 12.9, 4.6, 12.9]];
const bb26Paint = (c, L) => rect(-1, 0, L + 2, 20, "#c3c8cd") + rect(-1, 12.1, L + 2, 3, "#9aa1a8") + rect(-1, 11.6, L + 2, 0.7, TER.deep) + rect(-1, 0, L + 2, 4.6, "#55595e") +
  path("M-1 4.1L3.2 4.1L6.4 8.2L6.4 12.5L4.0 12.5L2.4 8.3L-1 8.3Z", TER.deep) + line(-1, 4.7, L + 1, 4.7, "rgba(0,0,0,0.25)", 0.5);
const bb26Over = (c, L) => rect(L / 2 + 3.5, 6.2, 6.4, 3.4, "#1f8ad2") + letters(c, L / 2 + 5.9, 8.2, 1.6, "fluo", "#e9e82a", { weight: 700, italic: true }) +
  letters(c, L / 2 + 8.4, 6.9, 0.55, "Grand Est", "#ffffff", { weight: 600 }) + letters(c, 10.6, 10.6, 0.9, "26151", "#1d1f22", { weight: 500 });
const bb26000 = (c) => euroLoco(c, { roof: 12.9, sill: 4.1, nose: NOSE_BB26, rake: [[1.9, 8.3], [3.0, 12.4]], centers: 30.2, door: 7.4, wheel: 49,
  paint: bb26Paint, over: bb26Over, surround: TER.deep, grilles: [[-17.5, 7.8, 7.3, 11.3], [-8.5, 7.8, 7.3, 11.3]], grilleFill: "rgba(28,30,34,0.9)" });
// --- Corail coaches (VU and VTU, 26.4 m, 1975-1989) in TER Alsace's
// paint, now lettered TER Grand Est: grey; a blue band along the bottom
// of the body; the door dark blue; over most of the side the Alsace
// graphic of tall slanting stripes in green, yellow, pink, orange and
// brown (the line map over them, left out here); "ALSACE S'Elsass" in
// blue low near one end.
function corail(c, o = {}) {
  const L = c.L, R = 13.3, S = 3.9, b1 = L / 2 - 31.17, b2 = L / 2 + 31.17;
  const d = `M0.6 ${S}L${r2(L - 0.6)} ${S}L${r2(L - 0.6)} ${r2(R - 1.6)}Q${r2(L - 0.6)} ${R} ${r2(L - 2.6)} ${R}L2.6 ${R}Q0.6 ${R} 0.6 ${r2(R - 1.6)}Z`;
  const cols = ["#8fd3c3", "#f2c230", "#e2338a", "#f08a2c", "#a87443", "#7cc576", "#f5e15a", "#d93a8a"];
  let stripes = "";
  for (let i = 0; i < 16; i++) { const x = 8 + i * 3.6; stripes += path(`M${r2(x)} 5.0L${r2(x + 2.2)} 5.0L${r2(x + 4.4)} 12.0L${r2(x + 2.2)} 12.0Z`, cols[i % cols.length], 0, 'opacity="0.9"'); }
  const paint = rect(-1, 0, L + 2, 20, TER.silver) + rect(-1, 12.2, L + 2, 3, TER.steel) + lines([[-1, 12.6, L + 1, 12.6], [-1, 13.0, L + 1, 13.0]], "rgba(0,0,0,0.18)", 0.5) +
    stripes + rect(-1, 3.9, L + 2, 1.1, TER.blue) + rect(-1, 0, L + 2, 3.9, "#5a5f65");
  let s = shell(d, TER.silver, paint);
  const pitch = o.first ? 7.6 : 6.15, w = o.first ? 5.0 : 3.6;
  for (let x = 12.6; x < L - 9; x += pitch) s += rect(x, 6.9, w, 4.5, C.glass, 0, `rx="0.5" stroke="#2a2d31" stroke-width="0.7" vector-effect="non-scaling-stroke"`) + rect(x + 0.2, 9.8, w - 0.4, 1.2, C.glassLight, 0, 'rx="0.3"');
  for (const x of [2.4, L - 5.4]) s += rect(x, S + 0.15, 3.0, 8.1, TER.deep, 0, `stroke="rgba(0,0,0,0.45)" stroke-width="0.5" vector-effect="non-scaling-stroke"`) + rect(x + 0.7, 7.4, 1.6, 3.6, C.glass, 0, 'rx="0.6"');
  s += letters(c, 7.3, 9.7, 1.5, o.first ? "1" : "2", "#e2338a", { weight: 800 }) + letters(c, L - 18, 5.6, 1.1, "ALSACE", TER.blue, { weight: 400, spacing: 0.06 }) +
    letters(c, L - 10.6, 5.6, 0.9, "S'Elsass", TER.blue, { weight: 400 }) + terWord(c, L - 7.2, 6.0, 0.9);
  if (o.cab) s += path("M0.6 4.0L5.6 4.0Q4.4 8.8 4.0 12.6L0.6 12.6Z", TER.deep) + rect(1.1, 8.6, 1.8, 2.6, C.glass, 0, 'rx="0.3"') + lamp(0.75, 5.4, 0.45, 0.5) + lamp(0.8, 4.7, 0.4, 0.3, RED_LAMP);
  s += boxes(b1 + 6, b2 - 6, S, 3, 1.1) + truck(b1, { wb: 8.53, d: 36, top: S }) + truck(b2, { wb: 8.53, d: 36, top: S });
  s += uicBuffers(0, -1, { sill: S }) + uicBuffers(L, 1, { sill: S }) + czHvac(L / 2 - 6, R, 12, 0.5);
  return s + (c.coupledL ? gangway(0, -1, 4.25, 11.8) : "") + (c.coupledR ? gangway(L, 1, 4.25, 11.8) : "");
}
// The TER 200's pilot car (a Corail rebuilt with Alstom's cab, B5uxh,
// photographs of no. 126 at Strasbourg, 2025): the nose blue over the
// windshield and down the sides to the buffer beam, a white curve under
// it, silver below; the bicycle door behind the cab; "ter", Grand Est.
function corailCab(c) {
  const L = c.L, R = 13.3, S = 3.9, b1 = L / 2 - 31.17 + 1.5, b2 = L / 2 + 31.17;
  const d = `M1.8 ${S}L${r2(L - 0.6)} ${S}L${r2(L - 0.6)} ${r2(R - 1.6)}Q${r2(L - 0.6)} ${R} ${r2(L - 2.6)} ${R}L7.2 ${R}` +
    smooth([[7.2, R], [4.0, 12.6], [2.0, 11.0], [1.2, 9.0], [1.0, 6.0], [1.4, 4.4], [1.8, S]]) + "Z";
  const cols = ["#8fd3c3", "#f2c230", "#e2338a", "#f08a2c", "#a87443", "#7cc576"];
  let stripes = "";
  for (let i = 0; i < 12; i++) { const x = 22 + i * 3.6; stripes += path(`M${r2(x)} 5.0L${r2(x + 2.2)} 5.0L${r2(x + 4.4)} 12.0L${r2(x + 2.2)} 12.0Z`, cols[i % cols.length], 0, 'opacity="0.9"'); }
  const paint = rect(-1, 0, L + 2, 20, TER.silver) + rect(-1, 12.2, L + 2, 3, TER.steel) + stripes + rect(-1, 3.9, L + 2, 1.1, TER.blue) + rect(-1, 0, L + 2, 3.9, "#5a5f65") +
    path(`M-1 ${R + 1}L9.8 ${R + 1}Q9.0 11.0 11.6 9.0Q13.4 7.6 13.0 5.4L4.6 5.4Q2.8 5.6 1.8 7.0L-1 7.0Z`, TER.blue) +
    path("M1.6 7.2Q3.0 5.8 4.8 5.6L12.8 5.6L13.0 5.0L4.6 5.0Q2.6 5.2 1.4 6.6Z", "#f1f2f3");
  let s = shell(d, TER.silver, paint);
  s += path("M2.0 9.6L3.6 12.0Q4.6 12.9 7.0 13.0L7.0 10.2L5.6 9.6Z", C.glass) + rect(11.0, 8.3, 1.4, 2.6, C.glass, 0, 'rx="0.2"');
  s += rect(17.0, S + 0.15, 3.0, 8.1, TER.deep, 0, `stroke="rgba(0,0,0,0.45)" stroke-width="0.5" vector-effect="non-scaling-stroke"`) + rect(17.7, 7.4, 1.6, 3.6, C.glass, 0, 'rx="0.6"') + bike(18.5, 9.2, 1.0, "#ffffff");
  for (let x = 24.6; x < L - 9; x += 6.15) s += rect(x, 6.9, 3.6, 4.5, C.glass, 0, `rx="0.5" stroke="#2a2d31" stroke-width="0.7" vector-effect="non-scaling-stroke"`);
  s += rect(L - 5.4, S + 0.15, 3.0, 8.1, TER.deep, 0, `stroke="rgba(0,0,0,0.45)" stroke-width="0.5" vector-effect="non-scaling-stroke"`);
  s += terWord(c, 14.4, 5.9, 1.0) + rect(12.4, 7.0, 3.6, 1.7, "#2b7fd0", 0, 'rx="0.2"') + letters(c, 14.2, 7.95, 0.62, "Grand Est", "#ffffff", { weight: 700 }) + sncf(c, 14.2, 10.2, 0.6) +
    lamp(1.2, 5.2, 0.45, 0.5) + lamp(1.25, 4.5, 0.4, 0.3, RED_LAMP) + letters(c, L - 18, 5.6, 1.1, "ALSACE", TER.blue, { weight: 400, spacing: 0.06 });
  s += boxes(b1 + 6, b2 - 6, S, 3, 1.1) + truck(b1, { wb: 8.53, d: 36, top: S }) + truck(b2, { wb: 8.53, d: 36, top: S });
  s += uicBuffers(0, -1, { sill: S, end: 1.8 }) + uicBuffers(L, 1, { sill: S });
  return s + (c.coupledR ? gangway(L, 1, 4.25, 11.8) : "");
}
// --- AGC (Bombardier Z 27500, 2004-2010): four cars, 72.8 m, the end cars
// longer, five trucks (the end cars' motor trucks at the noses, Jacobs
// trucks between), the floor low (600 mm) between the doors; two
// pantographs. Body 4.0 m tall to the roof fairings, which run its whole
// length in louvered panels. The nose: a deep raked windshield in a
// blue (TER Alsace, AURA) cap that sweeps back past the cab door; the
// lower nose silver, a grey bumper.
const NOSE_AGC = [[1.4, 2.1], [0.6, 3.0], [0.4, 5.6], ["q", 0.5, 7.4, 1.6, 8.6], [3.6, 11.9], ["q", 4.6, 13.1, 7.0, 13.1]];
const agcPaint = (cab, lv) => (c, g) => {
  const L = g.L;
  let s = rect(-1, 0, L + 2, 20, TER.silver) + rect(-1, 12.4, L + 2, 3, lv === "aura" ? TER.aura : TER.blue) + rect(-1, 0, L + 2, 2.5, "#9aa0a6");
  if (cab) s += path("M-1 6.6L2.1 6.6Q4.2 9.6 6.2 12.6L11.0 12.6Q8.4 10.2 6.6 6.0Q5.8 4.4 6.4 3.4L-1 3.4Z", lv === "aura" ? TER.aura : TER.blue) +
    rect(-1, 5.0, 4.6, 1.5, "#e7eaec") + rect(-1, 2.0, 6.0, 1.4, "#9aa0a6");
  if (lv === "alsace") for (let i = 0; i < 9; i++) { const x = (cab ? 40 : 6) + i * 2.6; s += path(`M${r2(x)} 3.0L${r2(x + 1.4)} 3.0L${r2(x + 3.6)} 12.0L${r2(x + 2.2)} 12.0Z`, ["#8fd3c3", "#f2c230", "#e2338a", "#f08a2c", "#7cc576"][i % 5], 0, 'opacity="0.85"'); }
  return s;
};
const agcDoor = (x, lv) => ({ x, w: 4.3, y0: 2.1, y1: 9.8, leaves: 2, glassY: 0.35, glassH: 0.5, fill: lv === "aura" ? "#3b5fa8" : TER.blue, grabs: false });
const agcCab = (lv) => (c) => unit(c, { roof: 13.1, sill: 2.1, nose: NOSE_AGC, rake: [[1.6, 8.6], [3.6, 11.9]], depth: 3.4, cabLen: 9, lampY: 4.3,
  rows: [{ xs: [9.6], y: 7.4, w: 1.8, h: 3.4, r: 0.3 }, { xs: [14.2, 19.0, 23.8, 28.6, 33.4, 38.2], y: 5.8, w: 4.2, h: 4.6, r: 0.4 }, { xs: [50.6, 55.4], y: 5.2, w: 4.2, h: 4.6, r: 0.4 }],
  doors: [agcDoor(44.2, lv)], trucks: [7.6, "end"], wheel: 33, paint: agcPaint(true, lv), surround: "#1d2026", pan: lv ? 22 : null,
  extra: (cc, g) => roofCover(10, 13.1, g.L - 11, 0.55, "#8d949b", 8) + boxes(12, 30, 2.1, 2, 0.9) +
    (lv === "aura" ? letters(cc, 36.8, 3.7, 0.5, "La Région Auvergne-Rhône-Alpes", "#1f3c8c", { weight: 600 }) : terWord(cc, 12.6, 4.2, 1.0, TER.blue, "ALSACE")) +
    sncf(cc, 8.9, 6.4, 0.7) });
const agcMid = (lv) => (c) => unit(c, { roof: 13.1, sill: 2.1,
  rows: [{ xs: [3.0, 7.6, 12.2, 16.8, 21.4, 26.0, 30.6, 35.2, 39.8, 44.4], y: 5.2, w: 4.0, h: 4.6, r: 0.4 }],
  doors: [agcDoor(c.L - 6.4, lv)], trucks: ["end"], wheel: 30, paint: agcPaint(false, lv),
  extra: (cc, g) => roofCover(0.5, 13.1, g.L - 1, 0.55, "#8d949b", 6) + boxes(6, 40, 2.1, 3, 0.7) + (cc.index % 2 ? "" : bike(g.L - 9.0, 7.4, 1.3, "#ffffff")) +
    (lv === "alsace" && cc.index === 1 ? letters(cc, 26, 11.45, 1.9, "ALSACE", "#3a4aa8", { weight: 400, spacing: 0.08 }) : "") });
// --- X 73500 (Alstom, 1999-2004): a single-car diesel railcar, 28.9 m, on
// two trucks, a door a side behind each cab; the TER's silver, blue over
// the roof and the cab (a blue cap down to the lamps), the windows in a
// dark grey band from cab to cab; "ter" in blue, Franche-Comté's mark and
// "La Ligne des Horlogers" panels on the side.
const NOSE_X735 = [[1.4, 3.0], [0.4, 4.0], [0.3, 5.4], ["q", 0.6, 7.8, 3.0, 10.2], [6.0, 12.1], ["q", 7.4, 12.6, 9.4, 12.6]];
const x735Paint = (c, g) => rect(-1, 0, g.L + 2, 20, "#b9bec3") + rect(-1, 11.6, g.L + 2, 3, TER.blue) + rect(-1, 11.2, g.L + 2, 0.4, "#d6dadd") +
  // The blue cap: over the windshield and down the nose to the lamps; the
  // cab's side window in a dark surround.
  path("M-1 4.6L1.0 4.6Q3.6 8.6 7.4 10.0Q10.4 11.0 12.8 11.6L-1 11.6Z", TER.blue) + path("M8.6 8.4L13.0 8.4L13.0 10.6L10.8 10.6Z", "#2d3238");
const x73500 = (c) => twinEnded(c, (h) => unit(h, { roof: 12.6, sill: 3.0, nose: NOSE_X735, rake: [[3.0, 10.2], [6.0, 12.1]], depth: 2.8, cabLen: 9, lampY: 4.5,
  rows: [{ xs: [13.8, 20.0], y: 6.6, w: 5.8, h: 3.9, r: 0.3 }, { xs: [36.4, 42.6], y: 6.6, w: 5.8, h: 3.9, r: 0.3 }],
  doors: [{ x: 30.2, w: 4.0, y0: 3.1, y1: 11.2, leaves: 1, glassY: 0.3, glassH: 0.6, grabs: false, fill: "#9aa0a6" }], trucks: [10.6], wheel: 33,
  paint: x735Paint, surround: "#1d2026", extra: (cc, g) => boxes(16, 28, 3.0, 2, 1.2) + slats(1.6, 3.2, 5.0, 1.3, 0.3, "rgba(0,0,0,0.4)") })) +
  rect(13.4, 6.2, 13.2, 4.7, "#3c434b", 0, 'rx="0.3"') + rect(c.L - 26.6, 6.2, 13.2, 4.7, "#3c434b", 0, 'rx="0.3"') + rect(35.8, 6.2, c.L - 71.6, 4.7, "#3c434b", 0, 'rx="0.3"') +
  [14.0, 20.2, 36.6, 42.8, c.L - 48.6, c.L - 42.4, c.L - 26.0, c.L - 19.8].map((x) => rect(x, 6.6, 5.6, 3.9, C.glass, 0, 'rx="0.3"') + rect(x + 0.2, 9.0, 5.2, 1.0, C.glassLight, 0, 'opacity="0.5"')).join("") +
  terWord(c, 13.0, 4.4, 1.6) + terWord(c, c.L - 13.0, 4.4, 1.6) + sncf(c, c.L - 9.4, 7.6, 0.6) +
  // The region's panel: its colour swoosh at the left, its small red mark
  // and "Franche-Comté / Conseil régional / www.franche-comte.fr".
  path("M21.5 3.7L35.0 3.7L35.0 6.0L23.6 6.0Z", "#f1f2f3") +
  [["#f6c400", 4.0], ["#f08a2c", 4.45], ["#e2231a", 4.9], ["#c8102e", 5.35], ["#7b2a8c", 5.75]].map(([f, y]) => path(`M24.2 ${y}Q26.4 ${y - 0.25} 28.4 ${y + 0.1}L28.4 ${y + 0.22}Q26.4 ${y - 0.1} 24.4 ${y + 0.2}Z`, f)).join("") +
  rect(28.9, 4.2, 0.9, 0.9, "#e2231a", 0, 'rx="0.2"') + circle(29.35, 4.65, 0.22, "#f1f2f3") +
  letters(c, 30.1, 4.3, 0.36, "Franche-Comté", "#1d1f22", { weight: 700, anchor: "start" }) + letters(c, 30.1, 4.85, 0.3, "Conseil régional", "#1d1f22", { weight: 400, anchor: "start" }) +
  letters(c, 30.1, 5.4, 0.26, "www.franche-comte.fr", "#1d1f22", { weight: 400, anchor: "start" }) +
  rect(c.L - 34.0, 3.7, 13.0, 2.3, "#f1f2f3", 0, 'rx="0.2"') + letters(c, c.L - 25.6, 4.6, 0.65, "Horlogers", "#2c4a8a", { weight: 500, italic: true }) +
  // The clock hand: a thin grey curve sweeping under the words.
  path(`M${r2(c.L - 32.6)} 4.6Q${r2(c.L - 31.6)} 3.9 ${r2(c.L - 29.6)} 4.2Q${r2(c.L - 31.2)} 4.0 ${r2(c.L - 32.0)} 4.9Q${r2(c.L - 31.6)} 5.6 ${r2(c.L - 30.4)} 5.4`, "none", 0, 'stroke="#8d9297" stroke-width="0.12"') +
  letters(c, c.L - 25.6, 5.4, 0.32, "La Ligne des", "#2c4a8a", { weight: 400 }) + bike(c.L - 23.2, 8.8, 1.4, "#ffffff") +
  roofCover(14, 12.6, c.L - 28, 0.4, "#9aa1a8", 8);

// ===================== The Transalpin (EC 163/164) =====================
// Zürich-Graz, ÖBB's and SBB's (vagonweb.cz's 2025 listing: an SBB Re 460
// Zürich-Buchs, ÖBB's 1016/1116 on in Austria; SBB Apm 1990 and Bpm 2090
// coaches and ÖBB Bmpz 2290; photographs of EC 163 at Zell am See 2025
// and on the Trisanna bridge 2026, EC 164 2026): SBB's first-class
// panorama car (Apm 61 85 19-90) behind the locomotive, an SBB EC coach,
// then ÖBB's coaches. The panorama car: white, its glass running up into
// the roof in curved panes, the ends red with the yellow first-class band
// and the class's blue strip, SBB's mark low mid-side, dark grey below.
function sbbPanorama(c) {
  const L = c.L, R = 13.3, S = 3.6, b1 = L / 2 - 31.17, b2 = L / 2 + 31.17;
  const d = `M0.6 ${S}L${r2(L - 0.6)} ${S}L${r2(L - 0.6)} ${r2(R - 2.4)}Q${r2(L - 0.6)} ${R} ${r2(L - 3.4)} ${R}L3.4 ${R}Q0.6 ${R} 0.6 ${r2(R - 2.4)}Z`;
  const paint = rect(-1, 0, L + 2, 20, "#f2f2f0") + rect(-1, 0, L + 2, 4.2, "#4a4f55") + rect(-1, 4.2, L + 2, 0.25, "#8d9297") +
    [[0.6, 6.0], [L - 6.6, 6.0]].map(([x, w]) => rect(x, 6.2, w, R, "#eb0000") + rect(x, 10.6, w, 0.8, "#f6c400") + circle(x < L / 2 ? x + 1.0 : x + w - 1.0, 9.0, 0.55, "#f2f2f0")).join("") +
    rect(6.6, 7.4, L - 13.2, R, "#20272d") + lines(Array.from({ length: 12 }, (_, i) => [9 + i * 6.1, 7.6, 9 + i * 6.1 + 1.0, R]), "#5a636b", 0.7) +
    rect(6.8, 10.8, L - 13.6, 1.6, "#3a444e", 0, 'opacity="0.6"') + line(6.6, 9.8, L - 6.6, 9.8, "#5a636b", 0.6);
  let s = shell(d, "#f2f2f0", paint);
  for (const x of [2.0, L - 5.0]) s += rect(x, S + 0.15, 2.8, 8.3, "none", 0, `stroke="rgba(0,0,0,0.45)" stroke-width="0.5" vector-effect="non-scaling-stroke"`) + rect(x + 0.7, 7.6, 1.4, 3.2, C.glass, 0, 'rx="0.4"') +
    rect(x < L / 2 ? x + 3.0 : x - 0.6, 7.6, 0.45, 4.4, "#2d327d");
  s += letters(c, 3.4, 11.0, 0.9, "1", "#ffffff", { weight: 700 }) + rect(L / 2 - 6.4, 5.0, 0.9, 0.9, "#eb0000") + letters(c, L / 2 - 3.6, 5.45, 0.55, "SBB CFF FFS", "#1c1e20", { weight: 600 });
  s += boxes(b1 + 6, b2 - 6, S, 3, 1.0) + truck(b1, { wb: 8.2, d: 36, top: S }) + truck(b2, { wb: 8.2, d: 36, top: S }) + uicBuffers(0, -1, { sill: S + 0.3 }) + uicBuffers(L, 1, { sill: S + 0.3 });
  return s + (c.coupledL ? gangway(0, -1, 4.0, 11.6) : "") + (c.coupledR ? gangway(L, 1, 4.0, 11.6) : "");
}
// ÖBB's Bmpz (Eurofima and its successors, 26.4 m): light grey, a red band
// over the roof's edge, a thin red line low; the windows framed in black,
// the class numeral white on dark grey by the doors; ÖBB in red low.
function obbBmpz(c) {
  const L = c.L, R = 13.3, S = 3.9, b1 = L / 2 - 31.17, b2 = L / 2 + 31.17;
  const d = `M0.6 ${S}L${r2(L - 0.6)} ${S}L${r2(L - 0.6)} ${r2(R - 1.6)}Q${r2(L - 0.6)} ${R} ${r2(L - 2.6)} ${R}L2.6 ${R}Q0.6 ${R} 0.6 ${r2(R - 1.6)}Z`;
  const paint = rect(-1, 0, L + 2, 20, "#cdd0d3") + rect(-1, 11.9, L + 2, 3, "#e1251b") + rect(-1, 11.5, L + 2, 0.4, "#dfe2e4") + rect(-1, 4.5, L + 2, 0.45, "#e1251b") + rect(-1, 0, L + 2, 4.5, "#8e9399");
  let s = shell(d, "#d7dadd", paint);
  for (let x = 9.2; x < L - 11; x += 6.45) s += rect(x, 7.4, 4.0, 3.0, C.glass, 0, `rx="0.4" stroke="#17191c" stroke-width="0.9" vector-effect="non-scaling-stroke"`) + rect(x + 0.2, 9.2, 3.6, 0.9, C.glassLight, 0, 'rx="0.2"');
  for (const x of [2.0, L - 4.8]) s += rect(x, S + 0.15, 2.8, 8.0, "none", 0, `stroke="rgba(0,0,0,0.45)" stroke-width="0.5" vector-effect="non-scaling-stroke"`) + rect(x + 0.6, 7.6, 1.6, 3.0, C.glass, 0, 'rx="0.4"');
  // The class numeral between two windows, the blue plate under it.
  s += letters(c, L - 23.6, 9.6, 1.9, "2", "#ffffff", { weight: 500 }) + rect(L - 24.6, 7.25, 2.0, 0.55, "#2d4fae");
  s += boxes(b1 + 6, b2 - 6, S, 3, 1.1) + truck(b1, { wb: 8.2, d: 36, top: S }) + truck(b2, { wb: 8.2, d: 36, top: S }) + uicBuffers(0, -1, { sill: S }) + uicBuffers(L, 1, { sill: S });
  return s + (c.coupledL ? gangway(0, -1, 4.25, 11.8) : "") + (c.coupledR ? gangway(L, 1, 4.25, 11.8) : "");
}

// ---------- Types, models ----------

export const TYPES = {
  deIce4End1: { name: "ICE 4 end car, first class", kind: "emu", amenities: ["first"] },
  deIce4End2: { name: "ICE 4 end car, second class, bicycles", kind: "emu", amenities: ["bikes"] },
  deIce4First: { name: "ICE 4 first-class car", kind: "emu", amenities: ["first"] },
  deIce4FirstP: { name: "ICE 4 first-class powercar", kind: "emu", amenities: ["first"] },
  deIce4Bistro: { name: "ICE 4 restaurant car (Bordrestaurant and first class)", kind: "emu", amenities: ["first", "dining"] },
  deIce4Service: { name: "ICE 4 service powercar (family area, wheelchair places)", kind: "emu" },
  deIce4Second: { name: "ICE 4 second-class car", kind: "emu" },
  deIce4SecondP: { name: "ICE 4 second-class powercar", kind: "emu" },
  deIce4Pan: { name: "ICE 4 second-class car with pantograph", kind: "emu" },
  frLyriaPower: { name: "TGV Lyria power car (TGV 2N2)", kind: "electric", pan: true },
  frLyriaEnd1: { name: "TGV Lyria end trailer, first class", kind: "bilevel", amenities: ["first"] },
  frLyriaFirst: { name: "TGV Lyria trailer, first class", kind: "bilevel", amenities: ["first"] },
  frLyriaBar: { name: "TGV Lyria bar car", kind: "bilevel", amenities: ["cafe"] },
  frLyriaSecond: { name: "TGV Lyria trailer, second class", kind: "bilevel" },
  frLyriaEnd2: { name: "TGV Lyria end trailer, second class", kind: "bilevel" },
  atRjTaurus: { name: "ÖBB Taurus (1116), railjet paint", kind: "electric", pan: true },
  atRjBikes: { name: "railjet economy car with bicycles (Bmpvz)", kind: "coach", amenities: ["bikes"] },
  atRjEconomy: { name: "railjet economy car (Bmpz)", kind: "coach" },
  atRjBistro: { name: "railjet first class and restaurant (ARbmpz)", kind: "coach", amenities: ["first", "dining"] },
  atRjFirst: { name: "railjet first-class car (Ampz)", kind: "coach", amenities: ["first"] },
  atRjCabCar: { name: "railjet driving trailer, business and first class (Afmpz)", kind: "coach", cab: true, amenities: ["first", "business"] },
  atNjnSeatCab: { name: "Nightjet seat car with cab (new generation)", kind: "coach", cab: true },
  atNjnMulti: { name: "Nightjet multi-function car (new generation; seats, accessible compartment, bicycles)", kind: "coach", amenities: ["bikes"] },
  atNjnCouchette: { name: "Nightjet couchette car with mini cabins (new generation, Bcmz)", kind: "coach", amenities: ["sleepers"] },
  atNjnSleeper: { name: "Nightjet sleeping car (new generation, WLAmz)", kind: "coach", amenities: ["sleepers"] },
  atNjoSleeper: { name: "Nightjet sleeping car (WLABmz)", kind: "coach", amenities: ["sleepers"] },
  atNjoCouchette: { name: "Nightjet couchette car (Bcmz)", kind: "coach", amenities: ["sleepers"] },
  atNjoCoach: { name: "Nightjet seat car (Bmz)", kind: "coach" },
  de147: { name: "DB class 147.5 (TRAXX 3) electric locomotive", kind: "electric", pan: true },
  deIc2First: { name: "IC2 double-deck first-class car (DApza 687.2)", kind: "bilevel", amenities: ["first"] },
  deIc2Second: { name: "IC2 double-deck second-class car (DBpza 682.2)", kind: "bilevel" },
  deIc2Cab: { name: "IC2 double-deck driving trailer (DBpbzfa 668.2; bicycles, wheelchair places, family area)", kind: "bilevel", cab: true, amenities: ["bikes"] },
  at4748Cab: { name: "ÖBB cityjet (Desiro ML, 4748) end car", kind: "emu", pan: true },
  at4748Mid: { name: "ÖBB cityjet (Desiro ML, 4748) middle car", kind: "emu" },
  de462End: { name: "Desiro HC (DB 462) end car, bwegt", kind: "emu", pan: true },
  de462Mid: { name: "Desiro HC (DB 462) double-deck car, bwegt", kind: "bilevel", emu: true },
  de463End: { name: "Mireo (DB 463) end car, bwegt", kind: "emu" },
  de463Mid: { name: "Mireo (DB 463) middle car, bwegt", kind: "emu", amenities: ["bikes"] },
  de612: { name: "RegioSwinger (DB 612) diesel car, bwegt", kind: "emu" },
  frBb26000: { name: "SNCF BB 26000 electric locomotive, TER Grand Est", kind: "electric", pan: true },
  frCorail: { name: "Corail coach, TER Grand Est (Alsace)", kind: "coach" },
  frCorailFirst: { name: "Corail coach with first class, TER Grand Est (Alsace)", kind: "coach", amenities: ["first"] },
  frCorailCab: { name: "TER 200 pilot car (Corail, Alsace)", kind: "coach", cab: true, amenities: ["bikes"] },
  frAgcAlsaceCab: { name: "AGC (Z 27500) end car, TER Alsace", kind: "emu", pan: true },
  frAgcAlsaceMid: { name: "AGC (Z 27500) middle car, TER Alsace", kind: "emu" },
  frAgcAuraCab: { name: "AGC (Z 27500) end car, TER Auvergne-Rhône-Alpes", kind: "emu", pan: true },
  frAgcAuraMid: { name: "AGC (Z 27500) middle car, TER Auvergne-Rhône-Alpes", kind: "emu" },
  frX73500: { name: "X 73500 diesel railcar, TER (Franche-Comté)", kind: "emu" },
  chRe460: { ...(SBB_TYPES.chsbbRe460 || { name: "SBB Re 460 locomotive", kind: "electric" }), pan: true },
  chEcB: { ...(SBB_TYPES.chsbbEcB || { name: "SBB EC second-class coach (Bpm)", kind: "coach" }) },
  chPanorama: { name: "SBB first-class panorama car (Apm)", kind: "coach", amenities: ["first"] },
  atBmpz: { name: "ÖBB second-class coach (Bmpz)", kind: "coach" },
};
const Mo = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  deIce4End1: Mo((c) => ice4End(c, { cls: "1" }), 95.5, true),
  deIce4End2: Mo((c) => ice4End(c, { cls: "2", bikes: true }), 95.5, true),
  deIce4First: Mo((c) => ice4Mid(c, { cls: "1" }), 94.32),
  deIce4FirstP: Mo((c) => ice4Mid(c, { cls: "1", power: true }), 94.32),
  deIce4Bistro: Mo((c) => ice4Mid(c, { cls: "1", bistro: true }), 94.32),
  deIce4Service: Mo((c) => ice4Mid(c, { cls: "2", power: true, pan: false }), 94.32),
  deIce4Second: Mo((c) => ice4Mid(c, { cls: "2" }), 94.32),
  deIce4SecondP: Mo((c) => ice4Mid(c, { cls: "2", power: true }), 94.32),
  deIce4Pan: Mo((c) => ice4Mid(c, { cls: "2", pan: true }), 94.32),
  frLyriaPower: Mo(lyriaPower, 72.67, true),
  frLyriaEnd1: Mo((c) => lyriaTrailer(c, { end: true, cls: "1" }), 71.67),
  frLyriaFirst: Mo((c) => lyriaTrailer(c, { cls: "1" }), 61.35),
  frLyriaBar: Mo((c) => lyriaTrailer(c, { bar: true, cls: "1" }), 61.35),
  frLyriaSecond: Mo((c) => lyriaTrailer(c, { cls: "2" }), 61.35),
  frLyriaEnd2: Mo((c) => mirror(c, (m) => lyriaTrailer(m, { end: true, cls: "2" })), 71.67),
  atRjTaurus: Mo(rjTaurus, 63.25),
  atRjBikes: Mo((c) => rjCar(c, { cls: "economy", bikes: true }), 86.78),
  atRjEconomy: Mo((c) => rjCar(c, { cls: "economy" }), 86.94),
  atRjBistro: Mo((c) => rjCar(c, { cls: "first", bistro: true }), 86.94),
  atRjFirst: Mo((c) => rjCar(c, { cls: "first" }), 86.94),
  atRjCabCar: Mo((c) => rjCar(c, { cls: "business", cab: true }), 88.09, true),
  atNjnSeatCab: Mo(njSeatCab, 88.09, true),
  atNjnMulti: Mo(njMulti, 86.94),
  atNjnCouchette: Mo(njCouchette, 86.94),
  atNjnSleeper: Mo(njSleeper, 86.94),
  atNjoSleeper: Mo((c) => njoCar(c, "sleeper"), 86.6),
  atNjoCouchette: Mo((c) => njoCar(c, "couchette"), 86.6),
  atNjoCoach: Mo((c) => njoCar(c, "coach"), 86.6),
  de147: Mo(loco147, 62.0),
  deIc2First: Mo((c) => ic2Car(c, { cls: "1" }), 88.2),
  deIc2Second: Mo((c) => ic2Car(c, { cls: "2" }), 88.2),
  deIc2Cab: Mo((c) => ic2Car(c, { cab: true, cls: "2", bikes: true }), 89.6, true),
  at4748Cab: Mo(vmCab, 84.0, true),
  at4748Mid: Mo(vmMid, 78.7),
  de462End: Mo(hcEnd, 86.0, true),
  de462Mid: Mo(hcMid, 82.7),
  de463End: Mo(mireoEnd, 82.0, true),
  de463Mid: Mo(mireoMid, 65.6),
  de612: Mo((c) => (c.index % 2 ? mirror(c, v612) : v612(c)), 84.9, false, (ctx) => ctx.index % 2),
  frBb26000: Mo(bb26000, 58.1),
  frCorail: Mo((c) => corail(c), 86.6),
  frCorailFirst: Mo((c) => corail(c, { first: true }), 86.6),
  frCorailCab: Mo(corailCab, 88.6, true),
  frAgcAlsaceCab: Mo(agcCab("alsace"), 66.6, true),
  frAgcAlsaceMid: Mo(agcMid("alsace"), 52.8, false, (ctx) => ctx.index % 2),
  frAgcAuraCab: Mo(agcCab("aura"), 66.6, true),
  frAgcAuraMid: Mo(agcMid("aura"), 52.8, false, (ctx) => ctx.index % 2),
  frX73500: Mo(x73500, 94.8),
  chRe460: SBB_MODELS.chsbbRe460,
  chEcB: SBB_MODELS.chsbbEcB,
  chPanorama: Mo(sbbPanorama, 86.6),
  atBmpz: Mo(obbBmpz, 86.6),
};

// ---------- Fleets ----------
// [first, last, type] over the 12-digit European Vehicle Number as a
// number (country and keeper, then the series and serial, then the check
// digit). Each from the vehicles' own lettering in photographs and their
// Wikipedia pages: ICE 4 "93 80 5812 001-x" (class 412's cars, the series
// in the four digits), TGV 2N2 power cars "93 87 0310 048-8", the railjet's
// "73 81 80-90 7xx" (de.wikipedia "Railjet 1. Generation"), the new
// Nightjet's "73 81 52-91 303" and "73 81 70-91 103", its seat car
// "80-91 721", the classic sleeping cars "61 80 72-90 011" (DB-registered)
// and couchettes "73 81 59-90", the IC2 cab car "50 80 86-81" and the 147
// "91 80 6147 590-4", ÖBB's 4748 "94 81 4748 016-4".
const evn = (prefix8) => [Number(`${prefix8}0000`), Number(`${prefix8}9999`)];
const R = (prefix8, key) => [...evn(prefix8), key];
export const FLEETS = {
  chintl: [
    // ICE 4: 412.0 (12 cars, Tz 9001-9050) and 412.4 (13 cars, 9451-9500)
    // and 412.2 (7 cars, 9201-9237), by the cars' class numbers.
    R("93800812", "deIce4End1"), R("93805812", "deIce4End2"), R("93801812", "deIce4First"), R("93801412", "deIce4FirstP"),
    R("93808812", "deIce4Bistro"), R("93806412", "deIce4Service"), R("93809812", "deIce4Second"), R("93802412", "deIce4SecondP"),
    R("93804812", "deIce4Pan"), R("93806812", "deIce4End1"), R("93807812", "deIce4End2"), R("93803412", "deIce4SecondP"),
    R("93803812", "deIce4Pan"), R("93807412", "deIce4Service"),
    // TGV 2N2 power cars 310001-310060 (Lyria's 310031-310060); the
    // trailers' numbers aren't known here, so a Lyria set is drawn typical.
    R("93870310", "frLyriaPower"),
    // The railjet: driving trailer, first, first with the restaurant,
    // economy, economy with the bicycles; its Taurus (1116).
    [738180907000, 738180907999, "atRjCabCar"], [738119906000, 738119906999, "atRjFirst"], [738185905000, 738185905999, "atRjBistro"],
    [738122902000, 738122904999, "atRjEconomy"], [738184901000, 738184901999, "atRjBikes"], R("91811116", "atRjTaurus"),
    // The new Nightjet; the classic one's sleeping cars, couchettes, seats.
    [738180917000, 738180917999, "atNjnSeatCab"], [738152913000, 738152913999, "atNjnCouchette"], [738170911000, 738170911999, "atNjnSleeper"],
    [618072900000, 618072909999, "atNjoSleeper"], [738172900000, 738172909999, "atNjoSleeper"], [738159900000, 738159909999, "atNjoCouchette"],
    [738121910000, 738121919999, "atNjoCoach"],
    // DB's IC2: the cab car and the class 147.5.
    [508086810000, 508086819999, "deIc2Cab"], R("91806147", "de147"),
    // ÖBB 4748: the end cars 0xx (the middle cars' own numbers unknown).
    [948147480000, 948147480999, "at4748Cab"],
    // DB Regio Baden-Württemberg: Desiro HC end cars "94 80 1462 013-2",
    // Mireo end cars "94 80 0463 505-8", 612s "95 80 0612 625-3" (the
    // cars' lettering; the HC's and Mireo's middle cars' numbers unknown).
    // SNCF: BB 26000 "91 87 0026 xxx", AGC Z 27500 end cars "94 87 0027 xxx",
    // X 73500 "95 87 0073 xxx" (the vehicles' lettering in the photographs).
    R("91870026", "frBb26000"), R("94870027", "frAgcAlsaceCab"), R("95870073", "frX73500"),
    R("94801462", "de462End"), R("94800463", "de463End"), R("95800612", "de612"), R("95801612", "de612"),
  ],
};

// ---------- Typical trains ----------
const set = (label, ...units) => ({ label, units });
// ICE 4, 12 cars as the cars run from car 14 (the first-class end car) to
// car 1 (de.wikipedia's table of class 412): 0812, 1812, 1412, the
// restaurant 8812, 6412, 9812, 2412.0, 2412.3, 4812, 2412.5, 2412.8, 5812.
const ICE12 = set("ICE 4, twelve cars: first class and the restaurant at one end, the bicycles in the end car at the other (some trains have thirteen)",
  ["deIce4End1", 1], ["deIce4First", 1], ["deIce4FirstP", 1], ["deIce4Bistro", 1], ["deIce4Service", 1], ["deIce4Second", 1],
  ["deIce4SecondP", 2], ["deIce4Pan", 1], ["deIce4SecondP", 2], ["deIce4End2", 1]);
const ICE7 = set("ICE 4, seven cars", ["deIce4End1", 1], ["deIce4SecondP", 1], ["deIce4Pan", 1], ["deIce4SecondP", 1], ["deIce4Service", 1], ["deIce4Bistro", 1], ["deIce4End2", 1]);
// TGV Lyria: power car, R1-R2 first, R3 mixed (drawn first), R4 the bar,
// R5-R8 second, power car.
const LYRIA = set("TGV Lyria (Euroduplex): first class in cars 1-3, the bar in car 4 (some trains are two sets coupled)",
  ["frLyriaPower", 1], ["frLyriaEnd1", 1], ["frLyriaFirst", 2], ["frLyriaBar", 1], ["frLyriaSecond", 3], ["frLyriaEnd2", 1], ["frLyriaPower", 1]);
// The railjet from the Taurus: car 21 (bicycles), 22-24 economy, 25
// first and the restaurant, 26 first, 27 the driving trailer.
const RAILJET = set("railjet (ÖBB): a Taurus and seven cars, economy next to it, first and business class and the driving trailer at the other end",
  ["atRjTaurus", 1], ["atRjBikes", 1], ["atRjEconomy", 3], ["atRjBistro", 1], ["atRjFirst", 1], ["atRjCabCar", 1]);
const RAILJET_BACK = { ...RAILJET, units: [...RAILJET.units].reverse() };
// The new Nightjet: the seat car with the cab, the multi-function car,
// three couchette cars, two sleeping cars; the locomotive (an SBB Re 460
// in Switzerland) isn't drawn.
const NJ_NEW = set("Nightjet, new generation (seven cars: seats, a multi-function car, couchettes with mini cabins, sleeping cars); SBB's locomotive and any SBB cars not shown",
  ["atNjnSeatCab", 1], ["atNjnMulti", 1], ["atNjnCouchette", 3], ["atNjnSleeper", 2]);
const NJ_OLD = set("Nightjet (classic cars: sleeping cars, couchettes, a seat car); SBB's locomotive and cars not shown",
  ["atNjoCoach", 1], ["atNjoCouchette", 2], ["atNjoSleeper", 2]);
// DB's IC2 on the Gäubahn: the 147 at the Stuttgart (Singen) end.
const IC2_N = set("Intercity 2 (DB): a class 147 locomotive, first class next to it, three second-class cars and the cab car (bicycles, wheelchair places)",
  ["de147", 1], ["deIc2First", 1], ["deIc2Second", 3], ["deIc2Cab", 1]);
const IC2_S = { ...IC2_N, units: [...IC2_N.units].reverse() };
const HC4 = set("Desiro HC (bwegt): four cars, single-deck end cars and two double-deck cars between (some trains two units)", ["de462End", 1], ["de462Mid", 2], ["de462End", 1]);
const MIREO = set("Mireo (bwegt): three cars (some trains two units)", ["de463End", 1], ["de463Mid", 1], ["de463End", 1]);
const RS612 = set("RegioSwinger (612, bwegt): two two-car diesel units", ["de612", 4]);
// TER into Switzerland, by service: Grand Est's fast TER 200 (Strasbourg-
// Colmar-Mulhouse-Saint-Louis-Basel, numbers 96200-96299 in the Swiss
// timetable, headed Strasbourg; they pass Basel St. Johann without
// stopping) are a BB 26000 with Corail coaches and the Alsace pilot car
// (fr.wikipedia "TER 200"; BB 26151 and 26146 at Basel SBB 2023/2026); the
// stopping Mulhouse-Saint-Louis-Basel omnibus (96100-96199, which stop at
// Basel St. Johann) usually AGCs (Z 27878 at Basel 2023, Basel St. Johann).
// AURA's 96500-96699 (Bellegarde-Genève): AGCs. BFC's 18101-18147: X
// 73500s (the Ligne des Horlogers and Frasne-Vallorbe).
const TER200 = set("TER 200 (TER Grand Est): a BB 26000 with Corail coaches and the pilot car at the other end",
  ["frBb26000", 1], ["frCorailFirst", 1], ["frCorail", 4], ["frCorailCab", 1]);
const AGC_ALSACE = set("Usually an AGC (Z 27500, TER Alsace paint), four cars", ["frAgcAlsaceCab", 1], ["frAgcAlsaceMid", 2], ["frAgcAlsaceCab", 1]);
const AGC_AURA = set("AGC (Z 27500, TER Auvergne-Rhône-Alpes): four cars, often two units", ["frAgcAuraCab", 1], ["frAgcAuraMid", 2], ["frAgcAuraCab", 1]);
const X73500 = set("X 73500 diesel railcar (TER Bourgogne-Franche-Comté; some trains two coupled)", ["frX73500", 1]);
// The Transalpin in Switzerland: SBB's Re 460, SBB's panorama car and EC
// coach, then ÖBB's coaches (vagonweb.cz 2025; photographs 2025-2026).
const TRANSALPIN = set("Transalpin (EC, ÖBB and SBB): an SBB Re 460 in Switzerland, SBB's first-class panorama car and an SBB coach, then ÖBB's coaches",
  ["chRe460", 1], ["chPanorama", 1], ["chEcB", 1], ["atBmpz", 5]);
const CITYJET = set("ÖBB cityjet (Desiro ML, class 4748), four cars", ["at4748Cab", 1], ["at4748Mid", 2], ["at4748Cab", 1]);
const BY_KEY = { deIce4End1: ICE12, deIce4End2: ICE12, frLyriaPower: LYRIA, atRjTaurus: RAILJET, atRjCabCar: RAILJET, atNjnSeatCab: NJ_NEW, atNjoSleeper: NJ_OLD,
  deIc2Cab: IC2_S, de147: IC2_S, at4748Cab: CITYJET, de462End: HC4, de463End: MIREO, de612: RS612, frBb26000: TER200, frAgcAlsaceCab: AGC_ALSACE, frX73500: X73500 };
const num = (t) => String(t.number || "").replace(/\D/g, "");
// A car shown alone (a fleet page's sample): the set it runs in.
const SETS = [ICE12, ICE7, LYRIA, RAILJET, NJ_NEW, NJ_OLD, IC2_N, HC4, MIREO, RS612, TER200, AGC_ALSACE, AGC_AURA, X73500, TRANSALPIN, CITYJET];
const setOf = (key) => SETS.find((x) => x.units.some(([k]) => k.replace(/R$/, "") === key.replace(/R$/, ""))) || null;
export const TYPICAL = {
  chintl: (t, reported) => {
    const r = t.route || "", n = num(t), dest = t.destination || "";
    if (!r && reported) return setOf(reported);
    if (r === "ICE") return n === "1064" || n === "1067" ? ICE7 : ICE12;
    if (/^TGV/.test(r)) return LYRIA;
    if (r === "RJX") return /Zürich/.test(dest) ? RAILJET_BACK : RAILJET;
    if (r === "NJ" || r === "EN") {
      // New Nightjets on Zürich-Hamburg (since December 2025) and
      // Zürich-Wien (since June 2026; 466/467, 13486/13487); the classic
      // cars on Amsterdam, Berlin, Graz and the EuroNights east.
      if (/^(470|471|2870|2871|30470|70470|10470|30570)$/.test(n) || /^(466|467|13486|13487)$/.test(n)) return NJ_NEW;
      return NJ_OLD;
    }
    if (r === "IC") return /Zürich/.test(dest) ? IC2_S : IC2_N;
    if (/^(S 3|R 5|S 2|R 2)$/.test(r)) return CITYJET;
    // DB Regio into Basel Bad Bf (RE 7: Desiro HC; RB 27, RE 27: Mireo,
    // the state's Netz Rheintal award) and Schaffhausen (RE 3: 612s).
    if (r === "RE 7") return HC4;
    if (r === "RB 27" || r === "RE 27") return MIREO;
    if (r === "RE 3") return RS612;
    if (r === "TER") {
      const k = Number(n);
      if (k >= 18100 && k < 18200) return X73500;
      if (k >= 96500 && k < 96700) return AGC_AURA;
      const stopsAt = (re) => (t.stops || []).some((x) => re.test(x.name || ""));
      // The omnibus stops at Basel St. Johann; the TER 200 doesn't.
      if (stopsAt(/St\. Johann/)) return AGC_ALSACE;
      if (k >= 96200 && k < 96300) return TER200;
      if (k >= 96100 && k < 96200) return AGC_ALSACE;
      return /Strasbourg|Colmar/.test(`${t.origin || ""} ${t.destination || ""}`) ? TER200 : AGC_ALSACE;
    }
    // The panorama car is behind the locomotive both ways (EC 163 at Zell am
    // See 2025, EC 164 2026).
    if (r === "EC") return TRANSALPIN;
    if (reported && BY_KEY[reported]) return BY_KEY[reported];
    return null;
  },
};

// ---------- Fact sheets ----------
const WP = "https://en.wikipedia.org/wiki/";
const DEWP = "https://de.wikipedia.org/wiki/";
const ICE4F = { model: "Siemens ICE 4 (DB class 412)", type: "High-speed electric multiple unit", builder: "Siemens Mobility and Bombardier", built: "2017–2024",
  fleet: "137 sets (50 of 12 cars, 50 of 13, 37 of 7)", topSpeedMph: 165, lengthFt: 94.3, source: `${DEWP}DB-Baureihe_412` };
const LYF = { model: "Alstom TGV 2N2 (Euroduplex, 3UFC)", type: "High-speed double-deck trainset", builder: "Alstom", built: "2011–2013 (Lyria's sets)",
  fleet: "15 Lyria sets (4716–4730)", topSpeedMph: 199, source: "https://fr.wikipedia.org/wiki/TGV_2N2" };
const RJF = { model: "railjet (Siemens Viaggio Comfort)", type: "Passenger coach", builder: "Siemens Mobility", built: "2008–2013", fleet: "60 seven-car sets (sets 1–23 equipped for Switzerland)",
  topSpeedMph: 143, lengthFt: 86.9, source: `${DEWP}Railjet_1._Generation` };
const NJNF = { model: "Nightjet, new generation (Siemens Viaggio Comfort)", type: "Night train coach", builder: "Siemens Mobility", built: "2023 on", fleet: "33 seven-car sets",
  topSpeedMph: 143, source: "https://www.seat61.com/trains-and-routes/nightjet-new-generation.htm" };
const NJOF = { model: "Nightjet, classic cars (UIC-Z)", type: "Night train coach", builder: "Various (Siemens SGP's sleeping cars, 2003–2005)", lengthFt: 86.6, source: `${WP}Nightjet` };
const IC2F = { model: "Bombardier Twindexx Vario (DB Intercity 2)", type: "Double-deck coach", builder: "Bombardier (now Alstom)", built: "2013–2020", lengthFt: 88.2,
  topSpeedMph: 99, source: `${DEWP}Intercity_2_(Deutsche_Bahn)` };
export const FACTS = {
  deIce4End1: { ...ICE4F, lengthFt: 95.5, about: "The first-class end car of DB's ICE 4, with the driver's cab. ICE 4s run the ICEs from Germany to Basel, Zürich, Chur, Bern, Interlaken and Brig." },
  deIce4End2: { ...ICE4F, lengthFt: 95.5, about: "The second-class end car with the cab, where the ICE 4 carries its bicycles." },
  deIce4First: { ...ICE4F, about: "A first-class car of the ICE 4." },
  deIce4FirstP: { ...ICE4F, about: "A first-class powercar: its own traction gear under the floor, as every other car of the ICE 4 has." },
  deIce4Bistro: { ...ICE4F, about: "The restaurant car (Bordrestaurant), with first-class seats beyond it." },
  deIce4Service: { ...ICE4F, about: "The service car: the family area, the wheelchair places and the train crew's office." },
  deIce4Second: { ...ICE4F, about: "A second-class car of the ICE 4." },
  deIce4SecondP: { ...ICE4F, about: "A second-class powercar of the ICE 4." },
  deIce4Pan: { ...ICE4F, about: "A second-class car carrying one of the train's pantographs." },
  frLyriaPower: { ...LYF, type: "High-speed power car", lengthFt: 72.7, powerHp: 12339, about: "Each TGV Lyria has a power car at each end. Lyria (SNCF and SBB) runs Paris–Basel–Zürich, Paris–Lausanne and Paris–Genève, and Marseille–Genève in season." },
  frLyriaEnd1: { ...LYF, lengthFt: 71.7, about: "The first-class end trailer, next to a power car: Lyria's Standard Plus and Business on both decks." },
  frLyriaFirst: { ...LYF, lengthFt: 61.4, about: "A first-class double-deck trailer, on trucks shared with its neighbors." },
  frLyriaBar: { ...LYF, lengthFt: 61.4, about: "The bar car: the bar on the lower deck, seats upstairs." },
  frLyriaSecond: { ...LYF, lengthFt: 61.4, about: "A second-class (Standard) double-deck trailer." },
  frLyriaEnd2: { ...LYF, lengthFt: 71.7, about: "The second-class end trailer." },
  atRjTaurus: { model: "Siemens Taurus (ÖBB 1116)", type: "Electric locomotive", builder: "Siemens and Krauss-Maffei", built: "1999–2006", topSpeedMph: 143, powerHp: 8579, lengthFt: 63.3,
    source: `${DEWP}ÖBB_1116`, about: "The railjet's locomotive, in its paint; those for Switzerland carry the Swiss train protection and a third pantograph." },
  atRjBikes: { ...RJF, about: "Car 21, economy class with room for bicycles." },
  atRjEconomy: { ...RJF, about: "An economy-class car (22–24) of the railjet." },
  atRjBistro: { ...RJF, about: "Car 25: first class and the restaurant." },
  atRjFirst: { ...RJF, about: "Car 26, first class." },
  atRjCabCar: { ...RJF, lengthFt: 88.1, about: "Car 27, the driving trailer: business class behind the cab, first class beyond. The railjet runs Zürich–Innsbruck–Wien, Graz and Budapest (RJX)." },
  atNjnSeatCab: { ...NJNF, about: "The seat car, with a cab at its end. The new Nightjet runs Zürich–Hamburg and Zürich–Wien." },
  atNjnMulti: { ...NJNF, about: "The multi-function car: the low-floor entrance, an accessible compartment, bicycles and seats." },
  atNjnCouchette: { ...NJNF, about: "A couchette car: four-berth compartments and the single-person Mini Cabins." },
  atNjnSleeper: { ...NJNF, about: "A sleeping car: compartments of one to three beds, each with its own shower and toilet." },
  atNjoSleeper: { ...NJOF, about: "A classic Nightjet sleeping car (WLABmz): compartments of one to three beds, some with a shower." },
  atNjoCouchette: { ...NJOF, about: "A classic couchette car (Bcmz), four or six berths a compartment." },
  atNjoCoach: { ...NJOF, about: "The seat car (Bmz) of a classic Nightjet." },
  de147: { model: "Bombardier TRAXX 3 (DB class 147.5)", type: "Electric locomotive", builder: "Bombardier (now Alstom)", built: "2016–2020", topSpeedMph: 99, powerHp: 7500, lengthFt: 62.0,
    source: `${DEWP}DB-Baureihe_147`, about: "It pushes and pulls DB's Intercity 2 trains between Stuttgart, Singen and Zürich." },
  deIc2First: { ...IC2F, about: "The first-class car of the Intercity 2." },
  deIc2Second: { ...IC2F, about: "A second-class double-deck car." },
  deIc2Cab: { ...IC2F, lengthFt: 89.6, about: "The cab car: bicycle places, wheelchair places and a family area. DB's Intercity 2 runs Stuttgart–Singen–Zürich (IC 87) since June 2025." },
  at4748Cab: { model: "Siemens Desiro ML (ÖBB 4748, cityjet)", type: "Electric multiple unit", builder: "Siemens Mobility", built: "2022–2023", fleet: "21 for Vorarlberg", topSpeedMph: 99,
    lengthFt: 84.0, source: `${DEWP}S-Bahn_Vorarlberg`, about: "The S-Bahn Vorarlberg's trains, into Switzerland at St. Margrethen and Buchs SG." },
  de462End: { model: "Siemens Desiro HC (DB 462)", type: "Electric multiple unit", builder: "Siemens Mobility", built: "2019–2020", fleet: "15 for Netz Rheintal", topSpeedMph: 99,
    lengthFt: 86.0, source: "https://de.wikipedia.org/wiki/Siemens_Desiro_HC", about: "The RE 7 Karlsruhe/Offenburg–Freiburg–Basel Bad Bf in Baden-Württemberg's bwegt paint, run by DB Regio." },
  de462Mid: { model: "Siemens Desiro HC (DB 462)", type: "Double-deck electric multiple unit car", builder: "Siemens Mobility", built: "2019–2020", lengthFt: 82.7,
    source: "https://de.wikipedia.org/wiki/Siemens_Desiro_HC", about: "One of the unit's two double-deck middle cars." },
  de463End: { model: "Siemens Mireo (DB 463)", type: "Electric multiple unit", builder: "Siemens Mobility", built: "2019–2020", fleet: "24 for Netz Rheintal", topSpeedMph: 99,
    source: "https://de.wikipedia.org/wiki/Siemens_Mireo", about: "The RB 27 Offenburg–Freiburg–Basel Bad Bf, in bwegt paint, run by DB Regio." },
  de463Mid: { model: "Siemens Mireo (DB 463)", type: "Electric multiple unit", builder: "Siemens Mobility", built: "2019–2020", source: "https://de.wikipedia.org/wiki/Siemens_Mireo",
    about: "The middle car, with the pantograph and the bicycle area." },
  de612: { model: "Bombardier RegioSwinger (DB 612)", type: "Tilting diesel multiple unit", builder: "Bombardier (Adtranz)", built: "1998–2004", topSpeedMph: 99, lengthFt: 84.9,
    source: "https://de.wikipedia.org/wiki/DB-Baureihe_612", about: "Two-car tilting diesel units on the RE 3 along the Hochrhein, Basel Bad Bf–Schaffhausen–Singen–Friedrichshafen (the line is being electrified for 2027)." },
  frBb26000: { model: "Alsthom BB 26000 (Sybic)", type: "Electric locomotive", builder: "Alsthom", built: "1988–1998", topSpeedMph: 124, powerHp: 7600, lengthFt: 58.1,
    source: "https://fr.wikipedia.org/wiki/BB_26000", about: "It hauls TER Grand Est's TER 200 trains of Corail coaches between Strasbourg, Mulhouse and Basel SBB." },
  frCorail: { model: "Corail coach (VTU)", type: "Passenger coach", builder: "Various (SNCF)", built: "1975–1989", lengthFt: 86.6, source: "https://fr.wikipedia.org/wiki/Voiture_Corail",
    about: "A second-class Corail coach of the TER 200, in TER Alsace's map-and-stripes paint, now TER Grand Est." },
  frCorailFirst: { model: "Corail coach (VTU)", type: "Passenger coach", builder: "Various (SNCF)", built: "1975–1989", lengthFt: 86.6, source: "https://fr.wikipedia.org/wiki/Voiture_Corail",
    about: "The TER 200's first-class Corail coach, with the bicycle places." },
  frCorailCab: { model: "Corail pilot car (TER 200)", type: "Driving trailer", builder: "SNCF, cab by Alstom", lengthFt: 88.6, source: "https://fr.wikipedia.org/wiki/TER_200",
    about: "The cab car at the other end of the TER 200 from its BB 26000, with the bicycle places behind the cab." },
  frAgcAlsaceCab: { model: "Bombardier AGC (Z 27500)", type: "Electric multiple unit", builder: "Bombardier", built: "2004–2010", topSpeedMph: 99, lengthFt: 66.6,
    source: "https://fr.wikipedia.org/wiki/Z_27500", about: "The bi-current AGC, four cars on five trucks; in TER Alsace's paint into Basel SBB." },
  frAgcAlsaceMid: { model: "Bombardier AGC (Z 27500)", type: "Electric multiple unit", builder: "Bombardier", built: "2004–2010", lengthFt: 52.8, source: "https://fr.wikipedia.org/wiki/Z_27500",
    about: "A middle car of the AGC, its floor low between the trucks." },
  frAgcAuraCab: { model: "Bombardier AGC (Z 27500)", type: "Electric multiple unit", builder: "Bombardier", built: "2004–2010", topSpeedMph: 99, lengthFt: 66.6,
    source: "https://fr.wikipedia.org/wiki/Z_27500", about: "Auvergne-Rhône-Alpes's AGCs on the TER Bellegarde–Genève." },
  frAgcAuraMid: { model: "Bombardier AGC (Z 27500)", type: "Electric multiple unit", builder: "Bombardier", built: "2004–2010", lengthFt: 52.8, source: "https://fr.wikipedia.org/wiki/Z_27500",
    about: "A middle car of the AGC." },
  frX73500: { model: "Alstom X 73500 (A TER)", type: "Diesel railcar", builder: "Alstom (LHB)", built: "1999–2004", topSpeedMph: 87, lengthFt: 94.8,
    source: "https://fr.wikipedia.org/wiki/X_73500", about: "The single-car diesel of the Ligne des Horlogers (Besançon–Morteau–La Chaux-de-Fonds) and Frasne–Vallorbe." },
  chPanorama: { model: "SBB panorama car (Apm 61 85 19-90)", type: "Passenger coach", builder: "SIG / Schindler", built: "1991, rebuilt", lengthFt: 86.6, source: "https://de.wikipedia.org/wiki/Transalpin_(Zug)",
    about: "SBB's first-class panorama car, with windows up into the roof, on the Transalpin between Zürich and Graz." },
  atBmpz: { model: "ÖBB Bmpz (second class)", type: "Passenger coach", builder: "Various", lengthFt: 86.6, source: "https://de.wikipedia.org/wiki/Transalpin_(Zug)",
    about: "ÖBB's open second-class coach, the most of the Transalpin's train." },
  at4748Mid: { model: "Siemens Desiro ML (ÖBB 4748, cityjet)", type: "Electric multiple unit", builder: "Siemens Mobility", built: "2022–2023", lengthFt: 78.7,
    source: `${DEWP}S-Bahn_Vorarlberg`, about: "A middle car of the four-car cityjet." },
};

// ---------- A reported formation ----------
// The Train Formation Service rarely covers these railways' trains (no EVU
// code for DB, ÖBB or SNCF), but where a car comes with its EVN or model,
// this names its drawing: the EVN by the series above; else the model's
// designation (a railjet's "Afmpz", "ARbmpz", "Bmpvz"; an ICE 4's "412";
// a Nightjet's "WLABmz", "Bcmz"), else nothing (the typical train is drawn).
const MODEL_KEYS = [
  [/Afmpz/, "atRjCabCar"], [/ARbmpz/, "atRjBistro"], [/Bmpvz/, "atRjBikes"], [/^Ampz/, "atRjFirst"], [/^Bmpz/, "atRjEconomy"], [/1116/, "atRjTaurus"],
  [/WLA(B)?mz/, "atNjoSleeper"], [/Bcmz/, "atNjoCouchette"], [/^Bmz/, "atNjoCoach"],
  [/DBpbzfa/, "deIc2Cab"], [/DApza/, "deIc2First"], [/DBpza/, "deIc2Second"], [/147/, "de147"], [/4748/, "at4748Mid"],
];
const fleetKey = (number) => {
  const n = Number(number);
  if (!number || !Number.isInteger(n)) return null;
  return FLEETS.chintl.find(([a, b]) => n >= a && n <= b)?.[2] || null;
};
export const FORMATION = {
  chintl: (car, i, cars) => {
    const byNumber = fleetKey(car.number);
    if (byNumber) return byNumber;
    const m = car.model || "";
    // An ICE 4 car by its class number in the model ("812", "412").
    if (/412|812/.test(m)) {
      if (i === 0 || i === cars.length - 1) return car.cls === "1" ? "deIce4End1" : "deIce4End2";
      if (car.cls === "WR") return "deIce4Bistro";
      return car.cls === "1" ? "deIce4First" : "deIce4Second";
    }
    return MODEL_KEYS.find(([re]) => re.test(m))?.[1] || null;
  },
};
