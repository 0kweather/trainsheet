// SNCF's long-distance trains and the foreign railways' trains in France
// (scripts/railroads/sncf.py, railroads "tgv", "ouigo", "intercites" and
// "frintl"): the TGV INOUI double-deck sets and the TGV M, OUIGO's
// Duplexes and its OUIGO Train Classique, the Intercités (Corail coaches
// behind BB 26000 and BB 7200 locomotives, the Coradia Liners, the night
// trains), and Eurostar, DB's ICE, Trenitalia's Frecciarossa, Renfe's AVE
// and TGV Lyria. Trainsheet's own side views, from published dimensions and
// recent photographs (Wikimedia Commons, 2024-2026), at the shared scale
// (js/carart.js), each in its current paint, lettered here (no logo files).

import { newId } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, poly, truck, pantograph, slats } from "../carart.js?v=dev";
import { letters, roofCover, panGear, lamp, RED_LAMP, wiper, boxes } from "./digitraffic.cars.js?v=dev";
import { euroLoco, unit, buffers as uicBuffers, hvac as czHvac } from "./czechia.cars.js?v=dev";
// TGV Lyria, as drawn for Switzerland (chintl.cars.js).
import { TYPES as CH_TYPES, MODELS as CH_MODELS, FACTS as CH_FACTS } from "./chintl.cars.js?v=dev";

const r2 = (v) => Math.round(v * 100) / 100;
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
const NARROW = "Roboto Condensed, Arial Narrow, Helvetica Neue Condensed, Helvetica Neue, Arial, sans-serif";

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
const NS = 'vector-effect="non-scaling-stroke"';

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
    `<g clip-path="url(#${id})">${paint}<rect x="-5" y="${lo}" width="240" height="${r2(hi - lo)}" fill="url(#${id}-s)"/></g>` + path(d, "none", 0.8);
}
// The rubber gangway cover between two cars, floor to top; side -1 at the
// left end, 1 at the right.
function gangway(xFace, side, floor, top, fill = C.rubber) {
  const w = 0.8, x = side < 0 ? xFace : xFace - w;
  return rect(x, floor, w, top - floor, fill, 0, 'rx="0.2"') + lines([[x + 0.27, floor + 0.3, x + 0.27, top - 0.3], [x + 0.54, floor + 0.3, x + 0.54, top - 0.3]], "#3a3f45", 0.6);
}
const ends = (c, floor, top, fill) => (c.coupledL ? gangway(0, -1, floor, top, fill) : "") + (c.coupledR ? gangway(c.L, 1, floor, top, fill) : "");
// A body bottom along y, rising into an arch over each truck (centers xs,
// half-width w, up to y1): points, left to right.
function bottom(a, b, y, xs, w, y1) {
  const pts = [[a, y]];
  for (const x of xs) pts.push([x - w, y], [x - w + 0.6, y1], [x + w - 0.6, y1], [x + w, y]);
  return [...pts, [b, y]];
}
// A window: dark glass, the sky's reflection in its upper part, a frame.
const glazing = (x, y0, y1, w, { r = 0.5, frame = C.gasket, fw = 0.5 } = {}) => rect(x, y0, w, y1 - y0, C.glass, 0, `rx="${r}" stroke="${frame}" stroke-width="${fw}" ${NS}`) +
  rect(x + 0.15, y0 + (y1 - y0) * 0.58, w - 0.3, (y1 - y0) * 0.3, C.glassLight, 0, `rx="${r2(Math.min(r, 0.3))}"`);
// A plug door: its outline in the body, a window in it.
function plugDoor(x, w, y0, y1, { win: [wy0, wy1] = [y0 + (y1 - y0) * 0.45, y1 - 0.6], ww = w * 0.5, ink = "rgba(0,0,0,0.38)", fill = "none", r = 0.25 } = {}) {
  return rect(x, y0, w, y1 - y0, fill, 0, `rx="${r}" stroke="${ink}" stroke-width="0.6" ${NS}`) +
    rect(x + (w - ww) / 2, wy0, ww, wy1 - wy0, "#252a30", 0, `rx="${r2(Math.min(0.35, ww / 3))}" stroke="#15181b" stroke-width="0.5" ${NS}`);
}
// A vertical gradient (top to bottom: [offset, color], ...), as a fill.
const vgrad = (id, stops) => `<defs><linearGradient id="${id}" x1="0" y1="1" x2="0" y2="0">${stops.map(([o, col]) => `<stop offset="${o}" stop-color="${col}"/>`).join("")}</linearGradient></defs>`;
const hgrad = (id, stops) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">${stops.map(([o, col]) => `<stop offset="${o}" stop-color="${col}"/>`).join("")}</linearGradient></defs>`;
// A mirrored drawing (the rear unit of a set, a trailer turned round).
const mirror = (c, draw) => `<g transform="matrix(-1 0 0 1 ${c.L} 0)">${draw({ ...c, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: c.coupledL })}</g>`;
// Marks drawn in their own y-down coordinates (units of h), placed at (x, y)
// and kept readable on a mirrored car.
const placed = (c, x, y, h, inner) => `<g transform="translate(${r2(x)} ${r2(y)}) scale(${r2((c.mirrored ? -1 : 1) * h)} ${r2(-h)})">${inner}</g>`;
// A bicycle pictogram, h ft tall, centered at (x, y).
const bike = (x, y, h, color) => {
  const r = h * 0.28, s = `fill="none" stroke="${color}" stroke-width="${r2(h * 0.07)}"`;
  return `<g transform="translate(${r2(x)} ${r2(y)})"><circle cx="${r2(-h * 0.45)}" cy="${r2(-h * 0.2)}" r="${r2(r)}" ${s}/><circle cx="${r2(h * 0.45)}" cy="${r2(-h * 0.2)}" r="${r2(r)}" ${s}/>` +
    `<path d="M${r2(-h * 0.45)} ${r2(-h * 0.2)}L${r2(-h * 0.1)} ${r2(h * 0.25)}L${r2(h * 0.3)} ${r2(h * 0.25)}L${r2(h * 0.45)} ${r2(-h * 0.2)}M${r2(-h * 0.1)} ${r2(h * 0.25)}L${r2(h * 0.05)} ${r2(-h * 0.2)}L${r2(h * 0.3)} ${r2(h * 0.25)}" ${s}/></g>`;
};

// ---------- Marks ----------

// The TGV INOUI mark (photographs of trailers at Grenoble 2025-2026 and
// power cars at Rennes 2025): "TGV" in small light capitals over "inOui",
// whose round lowercase letters are drawn in one even stroke, the first
// "i" upside down (its dot at the foot), the "O" a big ring standing above
// and below the others. h is the ring's diameter; (x, y) the word's middle
// at its baseline.
function inouiMark(c, x, y, h, fill, { tgv = true } = {}) {
  const sw = 0.145, s = `fill="none" stroke="${fill}" stroke-width="${sw}" stroke-linecap="round"`;
  const g = `<path d="M-1.21 -0.53L-1.21 -0.24" ${s}/><circle cx="-1.21" cy="-0.075" r="0.08" fill="${fill}"/>` +
    `<path d="M-0.92 0L-0.92 -0.355A0.175 0.175 0 0 1 -0.57 -0.355L-0.57 0" ${s} stroke-linecap="butt"/>` +
    `<circle cx="0" cy="-0.28" r="0.425" ${s}/>` +
    `<path d="M0.65 -0.6L0.65 -0.245A0.175 0.175 0 0 0 1.0 -0.245L1.0 -0.6M1.0 -0.6L1.0 0" ${s} stroke-linecap="butt"/>` +
    `<path d="M1.25 -0.37L1.25 -0.07" ${s}/><circle cx="1.25" cy="-0.55" r="0.08" fill="${fill}"/>` +
    (tgv ? `<text x="-1.3" y="-0.74" font-size="0.3" font-family="${SANS}" font-weight="400" fill="${fill}">TGV</text>` : "");
  return placed(c, x, y, h, g);
}
// SNCF Voyageurs' mark: "SNCF" in white on a red tile with rounded corners
// (the carmine fading to magenta at its top right), "VOYAGEURS" under it.
function sncfMark(c, x, y, h, { voyageurs = true, fill = "#d4002d", word = "#ffffff" } = {}) {
  const id = newId();
  const g = `<defs><linearGradient id="${id}" x1="0" y1="1" x2="1" y2="0"><stop offset="0.3" stop-color="${fill}"/><stop offset="1" stop-color="#b8136e"/></linearGradient></defs>` +
    `<rect x="-0.95" y="-0.5" width="1.9" height="1" rx="0.22" fill="url(#${id})"/>` +
    `<text x="0" y="0.27" font-size="0.72" text-anchor="middle" font-family="${SANS}" font-weight="800" font-style="italic" letter-spacing="-0.04" fill="#ffffff">SNCF</text>` +
    (voyageurs ? `<text x="0" y="0.95" font-size="0.3" text-anchor="middle" font-family="${SANS}" font-weight="700" letter-spacing="0.02" fill="${word}">VOYAGEURS</text>` : "");
  return placed(c, x, y, h, g);
}

// ===================== TGV: the double-deck sets =====================
// Alstom's TGV Duplex (2N1, sets 201-289, 1995-2004), Dasye (2N1 asynchrone,
// 701-750, 2008-2012) and Euroduplex (2N2: 4701-4730, 801-896, 2011-2021):
// ten bodies, a power car at each end (22.15 m, 4.10 m tall) and eight
// articulated double-deck trailers between (the end ones 21.85 m, the
// others 18.7 m, 4.32 m tall) on nine shared trucks; 200.19 m in all
// (fr.wikipedia "TGV Duplex", "TGV 2N2"). The three families look alike from
// the side; the power cars' trucks 14 m apart, 1,092 mm wheels.
// The power car, nose at the left (the set's rear one mirrored). Its
// profile from the side (Duplex 271 at Rennes, October 2025, and Duplex
// 257, 2N2 852 and 881 at Rennes and Paris-Montparnasse, 2024-2025): the
// tip 1.3 m up, the top rising in a convex curve to the roof about 5 m
// back; the cab's side window behind the curve, the cab door 5.4 m back.
// Measured on Duplex 271 broadside at Rennes (October 2025): the rounded
// tip 3.2 ft up, the top a long, nearly straight wedge reaching the roof
// about 21 ft back; under the nose the white comes down to 2.1 ft, a dark
// skirt below it.
const PC_TOP = [[0, 3.2], [0.3, 4.15], [1.3, 4.85], [3.0, 5.95], [5.2, 7.5], [7.4, 8.8], [9.6, 10.0], [11.9, 11.1], [14.0, 12.0], [16.2, 12.65], [19.6, 13.1], [21.0, 13.25]];
const PC_LOW = [[0, 3.2], [0.15, 2.55], [0.7, 2.1]];
const PC = { roof: 13.25, door: 17.8, doorW: 3.2, b1: 16.4, b2: 62.27, wheel: 36.2 };
// The outline, nose at the left.
function pcOutline(L) {
  const x1 = L - 0.5, R = PC.roof, top = [...PC_TOP].reverse();
  return M([0.7, 2.1]) + L_([[9.3, 2.1], [9.6, 2.8]]) + L_(bottom(9.6, x1, 2.8, [PC.b1, PC.b2], 6.4, 3.7).slice(1)) +
    `L${r2(x1)} ${r2(R - 1.0)}Q${r2(x1)} ${R} ${r2(x1 - 1.0)} ${R}L${r2(top[0][0])} ${r2(top[0][1])}` + smooth(top) + smooth(PC_LOW) + "Z";
}
// The parts every livery shares: the windshield's glass in its visor, the
// cab's side window, the cab door, the louvers along the roof behind it,
// the front spoiler, trucks, pantographs (the rear one raised).
function pcParts(c, { visor = "#16181b", louver = [21.4, 43.4], doorFill = "none" } = {}) {
  const L = c.L, R = PC.roof;
  // The cab's side window (the windshield, on top of the nose, doesn't
  // show from the side): a trapezoid, its front edge leaning, in a light
  // surround; the access hatch low on the nose; the cab door.
  let s = path(`M11.2 8.0L14.1 8.0L14.1 9.95L12.6 9.95Z`, "rgba(255,255,255,0.35)", 0, `stroke="rgba(0,0,0,0.25)" stroke-width="0.5" ${NS}`) +
    path(`M11.6 8.2L13.85 8.2L13.85 9.7L12.75 9.7Z`, C.glass, 0, `stroke="${visor}" stroke-width="0.6" ${NS}`);
  s += rect(4.0, 3.6, 2.5, 3.1, "none", 0, `rx="0.35" stroke="rgba(0,0,0,0.3)" stroke-width="0.5" ${NS}`) + rect(7.0, 3.7, 1.0, 0.9, "none", 0, `rx="0.15" stroke="rgba(0,0,0,0.3)" stroke-width="0.5" ${NS}`) +
    line(14.9, 3.0, 14.9, 12.2, "rgba(0,0,0,0.25)", 0.5);
  s += plugDoor(PC.door, PC.doorW, 3.7, 9.9, { win: [8.4, 9.5], ww: 0.55, ink: "rgba(0,0,0,0.45)", fill: doorFill }) + rect(PC.door + 0.7, 3.0, 1.8, 0.35, "#5a5f65");
  s += rect(louver[0], 10.8, louver[1] - louver[0], 1.6, "#202326") + slats(louver[0], 10.8, louver[1] - louver[0], 1.6, 0.95, "rgba(200,205,210,0.35)") +
    line(louver[1] + 0.3, 12.4, L - 17.5, 12.4, "rgba(0,0,0,0.25)", 0.5) + line(L - 17.5, 12.4, L - 17.5, R, "rgba(0,0,0,0.25)", 0.5);
  s += path(M([1.4, 2.15]) + L_([[9.4, 2.15], [9.4, 0.75], [2.4, 0.65], [1.6, 1.2]]) + "Z", "#25282c");
  s += truck(PC.b1, { wb: 9.84, d: PC.wheel, kind: "loco", top: 3.7 }) + truck(PC.b2, { wb: 9.84, d: PC.wheel, kind: "loco", top: 3.7 });
  s += roofCover(L - 17.2, R, 16.0, 0.25, "#9aa1a9", 3) + pantograph(L - 8.6, R + 0.3, { up: true, facing: -1 }) + pantograph(L - 12.6, R + 0.3, { up: false }) +
    panGear(L - 8.6, R + 0.3, -1);
  return s + (c.coupledR ? gangway(L, 1, 3.0, R - 0.6) : "");
}
// TGV INOUI (the Carmillon paint, 2011 on, INOUI's marks since 2017;
// Duplex 257 and 271, 2N2 852 and 881, 2024-2025): white; the windshield in
// a black visor over the nose, edged by a carmine band from the nose's tip
// to the roof; behind the cab door a black band at the height of the
// trailers' lower windows, a thin carmine line over its rear end; the
// louvers along the roof dark; the skirt dark grey; "TGV inOui" carmine on
// the cab's side, the set's number low by the nose.
// Bands following the nose's top: [from, to] ft below the top edge, ending
// where the nose meets the roof (x1).
function noseBand(d0, d1, x1 = 15.0) {
  const pts = PC_TOP.filter(([x]) => x <= x1);
  const upper = pts.map(([x, y]) => [x - 0.2, y + 0.5 - d0]), lower = pts.map(([x, y]) => [x + d1 * 0.25, y - d1]).reverse();
  return M([-1, upper[0][1] - 0.4]) + L_([upper[0]]) + smooth(upper) + L_([[x1 + 0.6, 14]]) + L_([lower[0]]) + smooth(lower) + L_([[-1, lower[lower.length - 1][1] - 0.4]]) + "Z";
}
// From the side the Carmillon nose shows only a thin carmine edge along its
// top, darker at the tip.
const noseBands = (gid) => path(noseBand(0, 0.42, 14.6), `url(#${gid})`) + path(noseBand(0, 0.13, 4.5), "#3a2b33");
const IN = { white: "#ecebe7", black: "#1c1d20", carmine: "#b5154b", red: "#d2163b", skirt: "#3a3d42", silver: "#c3c6ca", anth: "#3a3c42", strip: "#b7bbc0" };
function inouiPower(c) {
  const L = c.L, gid = newId();
  const paint = hgrad(gid, [[0, IN.red], [1, IN.carmine]]) + rect(-1, 0, L + 2, 20, IN.white) +
    rect(PC.door + PC.doorW + 0.2, 4.85, L - PC.door - PC.doorW - 2.2, 3.75, IN.black, 0, 'rx="0.2"') + rect(L - 20.0, 8.85, 21, 0.25, IN.carmine) +
    rect(-1, 0, L + 2, 3.1, "#d3cfc4") +
    // The visor and its carmine edge, from the nose's tip up to the roof:
    // from the side, a thin black edge along the nose's top over a thin
    // carmine band.
    noseBands(gid) +
    "";
  let s = shell(pcOutline(L), IN.white, paint);
  s += pcParts(c);
  s += inouiMark(c, 11.2, 5.6, 2.05, IN.carmine) + letters(c, 5.2, 4.4, 0.55, c.setNo || "", "#2b2d31", { weight: 600, italic: true });
  return s;
}

// The trailers (Duplex 271's end trailer and its neighbours at Rennes,
// October 2025; the doors of Duplex 18 and 6 at Grenoble, 2025-2026; the bar
// of a Duplex at Bordeaux, 2026): the upper deck's big windows, 6.5 ft
// apart, over the lower deck's in line under them; the door, as wide as a
// window, toward one end of each trailer, a small window over the end
// beyond it, ventilation grilles at the other end. Drawn with the door at
// the right end (the set's front half; its rear half is turned round), the
// end trailer's power car at its left.
// Measured on Duplex 271's trailers broadside (Rennes, October 2025).
const TRL = { roof: 14.17, up: [9.8, 12.1], low: [3.9, 5.75], line: [8.95, 9.25], strip: [2.9, 3.4], doorLo: 1.6, doorHi: 8.95, sill: 3.75, deck: 2.2, winW: 4.9, pitch: 6.3 };
function trailerOutline(L, end) {
  const R = TRL.roof, e0 = end ? 17.0 : 7.6, e1 = L - 7.6; // where the lower deck runs between the trucks
  return { e0, e1, d: M([0.35, TRL.sill]) + L_([[e0 - 0.6, TRL.sill], [e0, TRL.deck], [e1, TRL.deck], [e1 + 0.6, TRL.sill], [L - 0.35, TRL.sill], [L - 0.35, R - 1.6]]) +
    `Q${r2(L - 0.35)} ${R} ${r2(L - 1.9)} ${R}L1.9 ${R}Q0.35 ${R} 0.35 ${r2(R - 1.6)}Z` };
}
// Where things go on a trailer of length L: the door's left edge, the
// windows' left edges (upper deck, lower deck), the grilles' end.
function trailerLayout(L, end) {
  const door = L - 16.8, doorW = 4.2, ups = [], lows = [];
  for (let k = 0; k < (end ? 7 : 6); k++) ups.push(r2(door - 2.5 - TRL.winW - k * TRL.pitch));
  for (let k = 0; k < 5; k++) lows.push(ups[k]);
  return { door, doorW, ups, lows };
}
// A Carmillon door: carmine fading to magenta at the top and violet at the
// foot (French Berry, one flat colour, on some renovated Duplexes).
function carmillonDoor(x, w, gid) {
  return vgrad(gid, [[0, "#9b1f8f"], [0.12, "#b3218a"], [0.45, "#ea4038"], [0.62, "#e7392f"], [0.92, "#d2238c"], [1, "#c9238f"]]) +
    rect(x - 0.25, TRL.doorLo - 0.05, w + 0.5, TRL.doorHi - TRL.doorLo + 0.1, "#b9bdc2") +
    rect(x, TRL.doorLo, w, TRL.doorHi - TRL.doorLo, `url(#${gid})`, 0, `rx="0.35" stroke="rgba(0,0,0,0.5)" stroke-width="0.6" ${NS}`) +
    rect(x + w / 2 - 0.8, 4.9, 1.6, 2.5, C.glass, 0, `rx="0.4" stroke="#15181b" stroke-width="0.7" ${NS}`) + rect(x + w * 0.72, 4.3, 0.32, 0.55, "#c9ccd0", 0, 'rx="0.05"');
}
// An INOUI trailer. o.cls "1" or "2"; o.end the end trailer (its power
// car at the left, its own truck under that end); o.bar the bar car.
function inouiTrailer(c, o) {
  const L = c.L, R = TRL.roof, { e0, e1, d } = trailerOutline(L, o.end);
  const { door, doorW, ups, lows } = trailerLayout(L, o.end);
  const lid = newId(), did = newId();
  const paint = hgrad(lid, [[0, "#e4173a"], [1, "#d3157f"]]) + rect(-1, 0, L + 2, 20, IN.silver) + rect(-1, 0, L + 2, TRL.line[0], IN.anth) +
    rect(-1, TRL.line[0], L + 2, TRL.line[1] - TRL.line[0], `url(#${lid})`) + rect(-1, TRL.strip[0], L + 2, TRL.strip[1] - TRL.strip[0], IN.strip) +
    rect(-1, 0, L + 2, TRL.strip[0], "#4a4d53") + line(-1, R - 0.75, L + 1, R - 0.75, "rgba(0,0,0,0.12)", 0.5);
  let s = shell(d, IN.silver, paint);
  for (const x of ups) s += glazing(x, TRL.up[0], TRL.up[1], TRL.winW, { r: 0.35, frame: "#2d3035", fw: 0.7 });
  if (o.bar) {
    // The bar's lower deck: equipment behind grilles, "BAR" by the door.
    for (let i = 0; i < 4; i++) { const x = e0 + 3.2 + i * 9.4; s += rect(x, 1.9, 8.2, 3.6, "#2a2c31", 0, `rx="0.2" stroke="#55595f" stroke-width="0.5" ${NS}`) + slats(x + 0.3, 2.1, 7.6, 3.2, 0.45, "rgba(150,155,160,0.45)"); }
    s += letters(c, door - 2.2, 7.6, 0.75, "BAR", "#ffffff", { weight: 500 });
  } else for (const x of lows) s += glazing(x, TRL.low[0], TRL.low[1], TRL.winW, { r: 0.35, frame: "#1d1f23", fw: 0.7 });
  // The small window over the end beyond the door; the grilles at the
  // other end (upper and lower), over the truck.
  s += glazing(L - 6.05, TRL.up[0] - 0.05, TRL.up[1] - 0.1, 2.15, { r: 0.45, frame: "#2d3035", fw: 0.7 });
  // The grilles at the other end: over the end trailer's own truck a tall
  // one in the band and a wide one low; on the others a grille over the
  // lower deck's end and one up by the roof.
  if (o.end) s += rect(7.1, 8.4, 1.6, 2.7, "#202226", 0, 'rx="0.15"') + slats(7.15, 8.5, 1.5, 2.5, 0.28, "rgba(150,155,160,0.4)") +
    rect(13.2, 4.6, 3.1, 2.7, "#26282c", 0, 'rx="0.2"') + lines(Array.from({ length: 6 }, (_, k) => [13.35, 4.8 + k * 0.4, 16.15, 4.8 + k * 0.4]), "rgba(140,145,150,0.5)", 0.5);
  else s += rect(2.8, 10.4, 1.9, 1.9, "#d0d3d6", 0, `rx="0.25" stroke="#9aa0a6" stroke-width="0.5" ${NS}`) + slats(2.9, 10.55, 1.7, 1.6, 0.3, "rgba(0,0,0,0.25)") +
    rect(2.2, 4.4, 3.2, 3.0, "#26282c", 0, 'rx="0.2"') + lines(Array.from({ length: 7 }, (_, k) => [2.35, 4.6 + k * 0.4, 5.25, 4.6 + k * 0.4]), "rgba(140,145,150,0.5)", 0.5);
  // The door; beside it, toward the middle, the destination display at the
  // band's top, SNCF Voyageurs' mark and the class numeral; the TGV INOUI
  // mark beyond it.
  s += carmillonDoor(door, doorW, did);
  const d0 = door; // the display, the SNCF mark and the numeral sit left of the door
  s += rect(d0 - 2.3, 7.7, 1.8, 0.75, "#141518", 0, `rx="0.2" stroke="#55595f" stroke-width="0.4" ${NS}`) + rect(d0 - 2.05, 7.85, 1.3, 0.42, "#b8c2b0", 0, 'opacity="0.55"');
  s += letters(c, d0 - 1.35, 6.1, 2.0, o.cls, "#eef0f2", { weight: 700, family: SANS }) + sncfMark(c, d0 - 2.85, 4.6, 0.42, { voyageurs: false });
  s += inouiMark(c, L - 9.4, 6.9, 1.0, "#ffffff");
  // Trucks: a shared one under the right end; the end trailer's own at the left.
  s += truck(L, { wb: 9.84, d: 36.2, top: TRL.sill }) + truck(o.end ? 4.6 : 0, { wb: 9.84, d: 36.2, top: TRL.sill });
  return s + (c.coupledL ? gangway(0, -1, 3.8, R - 0.8, "#2a2d31") : "") + (c.coupledR ? gangway(L, 1, 3.8, R - 0.8, "#2a2d31") : "");
}

// ===================== OUIGO =====================
// SNCF's low-cost TGVs (since 2013): Duplexes and Dasyes rebuilt with more
// seats (sets 760-797 and others), one class, in OUIGO's paint
// (fr.wikipedia "Livrées SNCF"; photographs at Lille-Flandres 2025,
// Bordeaux 2025, Paris-Montparnasse 2025, Toulon and Bourg-Saint-Maurice
// 2026): sky blue; on the power car a big pink-red disc over the cab's side
// with OUIGO in white across it, the cab's window in it; a black visor at
// the front, the same black band as INOUI's behind the cab door; big pale
// circles on the blue; "OUIGO.COM" small by the roof. The trailers blue all
// over, the windows black-framed, the doors pink-red; "OUIGO.COM" in pale
// capitals between the decks on every other car. Usually two sets coupled.
const OG = { blue: "#2ea3d6", pale: "#5db9e2", pink: "#d8355f", leaf: "#a51d3b", deep: "#c51f40", black: "#18191c", skirt: "#2c3a46", letter: "#a9dcf2" };
// OUIGO's word: rounded bold capitals, the G's bar a short stroke.
// OUIGO's word: lowercase, round, bold, white ("ouigo" on the power cars'
// discs, Bordeaux and Lille 2025): round capitals, the i lowercase.
const ouigoWord = (c, x, y, h, fill) => letters(c, x, y, h, "OU<tspan font-size=\"0.82em\">i</tspan>GO", fill, { weight: 700, family: "Arial Rounded MT Bold, Nunito, Varela Round, " + SANS, spacing: 0.01 * h });
function ouigoPower(c) {
  const L = c.L, did = newId();
  const disc = `<circle cx="${r2(PC.door - 4.4)}" cy="7.0" r="4.0" fill="${OG.pink}"/>`;
  const paint = rect(-1, 0, L + 2, 20, OG.blue) +
    `<circle cx="34.0" cy="5.5" r="7.5" fill="${OG.pale}" opacity="0.55"/><circle cx="${r2(PC.door + 6.2)}" cy="9.0" r="4.2" fill="${OG.pale}" opacity="0.45"/>` +
    rect(PC.door + PC.doorW + 0.2, 4.85, L - PC.door - PC.doorW - 2.2, 3.75, OG.black, 0, 'rx="0.2"') +
    disc + path(noseBand(0, 0.4, 16.0), OG.black);
  let s = shell(pcOutline(L), OG.blue, paint);
  s += pcParts(c);
  s += ouigoWord(c, PC.door - 4.4, 6.1, 1.95, "#ffffff") + letters(c, PC.door + 1.6, 12.35, 0.85, "OUIGO.COM", OG.letter, { weight: 600 });
  return s;
}
// A OUIGO trailer: o.end the end trailer; o.word "OUIGO.COM" on it; o.deck
// car 4, over its equipment (no lower windows).
function ouigoTrailer(c, o) {
  const L = c.L, R = TRL.roof, { e0, d } = trailerOutline(L, o.end), { door, doorW, ups, lows } = trailerLayout(L, o.end);
  const paint = rect(-1, 0, L + 2, 20, OG.blue) + rect(-1, 0, L + 2, 2.6, "#25313b") + line(-1, R - 0.75, L + 1, R - 0.75, "rgba(0,0,0,0.12)", 0.5) +
    "";
  let s = shell(d, OG.blue, paint);
  for (const x of ups) s += rect(x - 0.28, TRL.up[0] - 0.28, TRL.winW + 0.56, TRL.up[1] - TRL.up[0] + 0.56, "#141518", 0, 'rx="0.75"') + glazing(x, TRL.up[0], TRL.up[1], TRL.winW, { r: 0.55, frame: "#15171a", fw: 0.6 });
  if (o.deck) for (let i = 0; i < 4; i++) { const x = e0 + 3.2 + i * 9.4; s += rect(x, 2.2, 8.2, 3.6, "#24607e", 0, `rx="0.2" stroke="#1d4d66" stroke-width="0.5" ${NS}`) + slats(x + 0.3, 2.4, 7.6, 3.2, 0.45, "rgba(10,30,45,0.35)"); }
  else for (const x of lows) s += rect(x - 0.28, TRL.low[0] - 0.28, TRL.winW + 0.56, TRL.low[1] - TRL.low[0] + 0.56, "#141518", 0, 'rx="0.7"') + glazing(x, TRL.low[0], TRL.low[1], TRL.winW, { r: 0.5, frame: "#15171a", fw: 0.6 });
  s += glazing(L - 6.05, TRL.up[0] - 0.05, TRL.up[1] - 0.1, 2.15, { r: 0.45, frame: "#15171a", fw: 1.0 });
  if (o.end) s += rect(7.1, 8.4, 1.6, 2.7, "#1e5875", 0, 'rx="0.15"') + slats(7.15, 8.5, 1.5, 2.5, 0.28, "rgba(0,0,0,0.3)") + rect(13.2, 4.6, 3.1, 2.7, "#1e5875", 0, 'rx="0.2"') + slats(13.3, 4.7, 2.9, 2.5, 0.35, "rgba(0,0,0,0.3)");
  else s += rect(2.2, 4.4, 3.2, 3.0, "#1e5875", 0, 'rx="0.2"') + slats(2.3, 4.5, 3.0, 2.8, 0.35, "rgba(0,0,0,0.3)");
  // The door: pink-red, its window; the pale word between the decks.
  // The door (Lille-Flandres, Toulon 2025-2026): a dark red leaf, square at
  // the top, in a lighter pink frame whose top is rounded.
  const fx = door - 0.7, fw = doorW + 1.4, ft = 10.1;
  s += path(`M${r2(fx)} ${TRL.doorLo}L${r2(fx)} ${r2(ft - fw / 2)}A${r2(fw / 2)} ${r2(fw / 2)} 0 0 0 ${r2(fx + fw)} ${r2(ft - fw / 2)}L${r2(fx + fw)} ${TRL.doorLo}Z`, OG.pink) +
    rect(door, TRL.doorLo, doorW, TRL.doorHi - TRL.doorLo, OG.leaf, 0, `rx="0.2" stroke="rgba(0,0,0,0.45)" stroke-width="0.5" ${NS}`) +
    rect(door + doorW / 2 - 0.8, 4.9, 1.6, 2.5, C.glass, 0, `rx="0.4" stroke="#15181b" stroke-width="0.7" ${NS}`);
  if (o.word) s += letters(c, door - 14.5, 8.5, 2.6, "OUIGO.COM", OG.letter, { weight: 500, spacing: 0.04 });
  s += truck(L, { wb: 9.84, d: 36.2, top: TRL.sill }) + truck(o.end ? 4.6 : 0, { wb: 9.84, d: 36.2, top: TRL.sill });
  return s + (c.coupledL ? gangway(0, -1, 3.8, R - 0.8, "#2a2d31") : "") + (c.coupledR ? gangway(L, 1, 3.8, R - 0.8, "#2a2d31") : "");
}

// ===================== Locomotives =====================
// --- BB 26000 "Sybic" (Alsthom 1988-1998): 17.71 m, B'B', 1,250 mm wheels,
// two pantographs; the cab's front leaning back, its corners cut (the
// shape as drawn for TER Grand Est in chintl.cars.js). The Intercités ones
// (BB 26015, 26046, 26051 at Paris-Bercy, Paris-Austerlitz and Moulins,
// 2025-2026): silver grey, the cab front black, a thin carmillon line along
// the top of the side, and at each end, round the cab's corner, a white
// patch brushed with carmine and magenta; SNCF's mark small by the cab door.
const NOSE_BB26 = [[1.7, 4.1], [1.05, 5.0], [1.05, 7.8], [1.9, 8.3], [3.0, 12.4], ["q", 3.4, 12.9, 4.6, 12.9]];
// The patch round the cab's corner: white, brushed with carmine and
// magenta strokes running up it (26051, Paris-Bercy 2026).
const brush = (x0) => path(`M${x0} 4.1L${x0 + 3.4} 4.1Q${x0 + 2.9} 8.0 ${x0 + 3.2} 12.6L${x0} 12.6Z`, "#f2f0f1") +
  [[0.6, 4.4, 2.4, 6.6, "#d2163b"], [1.0, 6.4, 2.9, 8.4, "#e0284a"], [0.4, 8.2, 2.6, 10.6, "#c8186c"], [1.2, 10.2, 3.0, 12.4, "#d23a7a"], [0.2, 5.8, 1.2, 7.4, "#b5154b"]]
    .map(([a, y0, b, y1, f]) => path(`M${x0 + a} ${y0}Q${x0 + (a + b) / 2} ${y0 - 0.3} ${x0 + b} ${y0 + 0.4}L${x0 + b - 0.2} ${y1}Q${x0 + (a + b) / 2} ${y1 + 0.3} ${x0 + a + 0.2} ${y1 - 0.4}Z`, f, 0, 'opacity="0.85"')).join("");
const bb26Paint = (c, L) => rect(-1, 0, L + 2, 20, "#a6abb2") + rect(-1, 12.2, L + 2, 3, "#8e949b") + rect(-1, 12.0, L + 2, 0.22, "#c41a62") + rect(-1, 0, L + 2, 4.6, "#4a4e54") +
  path("M-1 4.1L2.3 4.1L1.5 5.0L1.5 7.9L2.4 8.4L3.5 12.4L-1 12.4Z", "#17181b") + brush(1.6);
const bb26Over = (c, L) => sncfMark(c, 10.6, 7.2, 1.0, { voyageurs: false }) + letters(c, L / 2, 5.0, 0.5, c.number ? String(c.number).slice(-5) : "", "#1d1f22", { weight: 500 });
const bb26000 = (c) => euroLoco(c, { roof: 12.9, sill: 4.1, nose: NOSE_BB26, rake: [[1.9, 8.3], [3.0, 12.4]], centers: 30.2, door: 7.4, wheel: 49,
  paint: bb26Paint, over: bb26Over, surround: "#17181b", grilles: [[-17.5, 7.8, 7.3, 11.3], [-8.5, 7.8, 7.3, 11.3]], grilleFill: "rgba(28,30,34,0.85)" });
// --- The "nez cassé" BB 7200 and BB 22200 (Alsthom, 1976-1986; Paul
// Arzens's broken nose): 17.48 m, B'B', 1,250 mm wheels, the windshield
// leaning back from a sharp edge, the panel under it leaning back too;
// a cab door behind each cab, the machine room's big windows between.
const NOSE_NC = [[1.5, 4.1], [0.75, 6.0], [0.42, 8.55], [0.55, 8.85], [2.2, 12.35], ["q", 2.5, 12.9, 3.6, 12.9]];
const ncLoco = (paint, over, opts = {}) => (c) => euroLoco(c, { roof: 12.9, sill: 4.1, nose: NOSE_NC, rake: [[0.55, 8.85], [2.2, 12.35]], centers: 31.8, door: 6.3, doorW: 1.7, wheel: 49,
  paint, over, surround: opts.surround || "#202226", grilles: [[-10.5, 8.6, 7.5, 11.4], [2.6, 8.6, 7.5, 11.4]], grilleFill: opts.grilleFill || "rgba(30,32,36,0.75)" });
// BB 7200 in the "béton" paint (BB 7255 at Marseille-Saint-Charles, September
// 2025, on an Intercités Bordeaux-Marseille): concrete grey, an orange band
// along the side at the windshield's foot, darker grey below; SNCF in orange
// on the side.
const ncBetonPaint = (c, L) => rect(-1, 0, L + 2, 20, "#a9a9a2") + rect(-1, 12.2, L + 2, 3, "#8c8d88") + rect(-1, 8.25, L + 2, 0.75, "#ec6a1f") + rect(-1, 0, L + 2, 5.6, "#6d6e6b") +
  rect(-1, 5.6, L + 2, 0.2, "#ec6a1f");
const ncBetonOver = (c, L) => letters(c, L * 0.62, 6.6, 0.9, "SNCF", "#ec6a1f", { weight: 800, italic: true }) + letters(c, 9.0, 6.6, 0.55, c.number ? String(c.number).slice(-4) : "", "#2a2b2c", { weight: 500 });
const bb7200 = ncLoco(ncBetonPaint, ncBetonOver);
// BB 22200 in OUIGO Train Classique's paint (BB 22323 at Villevêque and
// BB 22332, 2025-2026; BB 22240 at Rennes 2025): coral pink all over, the
// roof grey, the cab doors sky blue, beside each a tall blue oval with
// OUIGO up it in white.
const ncOuigoPaint = (c, L) => rect(-1, 0, L + 2, 20, OTC.pink) + rect(-1, 12.2, L + 2, 3, "#8e949b") + rect(-1, 0, L + 2, 4.6, "#3c3f44");
const ncOuigoOver = (c, L) => [6.0, L - 8.0].map((x) => `<ellipse cx="${r2(x + (x < L / 2 ? 2.9 : -0.9))}" cy="8.2" rx="1.05" ry="2.9" fill="${OTC.bubble}"/>` +
  `<g transform="translate(${r2(x + (x < L / 2 ? 2.9 : -0.9))} 8.2) rotate(${c.mirrored ? -90 : 90}) scale(${c.mirrored ? -1 : 1} -1)"><text y="0.3" font-size="0.85" text-anchor="middle" font-family="${SANS}" font-weight="700" fill="#ffffff">OUIGO</text></g>`).join("") +
  rect(6.3, 4.7, 1.7, 7.0, OTC.sky) + rect(L - 8.0, 4.7, 1.7, 7.0, OTC.sky);
const bb22200Ouigo = ncLoco(ncOuigoPaint, ncOuigoOver, { grilleFill: "rgba(60,30,35,0.7)" });
// BB 22200 in grey (the "En Voyage" grey, BB 22200s on the night trains to
// Nice and Cerbère, Paris-Austerlitz 2026): metallic grey, the cab front and
// its corners black, a thin carmillon line.
const ncGreyPaint = (c, L) => rect(-1, 0, L + 2, 20, "#a3a8ae") + rect(-1, 12.2, L + 2, 3, "#8c9298") + rect(-1, 0, L + 2, 4.6, "#45494e") + rect(-1, 11.95, L + 2, 0.2, "#c41a62") +
  path("M-1 4.1L1.9 4.1L1.0 6.0L0.7 8.6L2.4 12.4L-1 12.4Z", "#17181b");
const ncGreyOver = (c, L) => sncfMark(c, L / 2 + 4.0, 6.6, 0.6, { voyageurs: false });
const bb22200Grey = ncLoco(ncGreyPaint, ncGreyOver);

// ===================== Corail coaches =====================
// Corail VU/VTU (1975-1989): 26.4 m, trucks 19 m apart (Y 32), a plug door
// at each end, the windows in pairs. Three paints in 2026:
// Intercités (Carmillon, as renovated since 2011; Paris-Clermont and the
// POLT at Moulins and Paris-Bercy 2025-2026): metallic grey, the windows'
// frames black, a carmillon band along the top of the side, the doors
// carmillon, dark grey below the floor; the night trains' cars the same
// in white (fr.wikipedia "Livrées SNCF"); OUIGO Train Classique's (Villevêque
// and Rennes 2025): coral pink, the doors sky blue, "OUIGO.COM" by them.
const CO = { roof: 13.3, sill: 3.9 };
const OTC = { pink: "#e4477d", sky: "#4fb6e4", bubble: "#57b9e3" };
function corailBody(c, base, paint) {
  const L = c.L, R = CO.roof, S = CO.sill;
  const d = `M0.6 ${S}L${r2(L - 0.6)} ${S}L${r2(L - 0.6)} ${r2(R - 1.6)}Q${r2(L - 0.6)} ${R} ${r2(L - 2.6)} ${R}L2.6 ${R}Q0.6 ${R} 0.6 ${r2(R - 1.6)}Z`;
  return shell(d, base, rect(-1, 0, L + 2, 20, base) + rect(-1, 12.25, L + 2, 3, "#8f959b") + lines([[-1, 12.65, L + 1, 12.65], [-1, 13.0, L + 1, 13.0]], "rgba(0,0,0,0.16)", 0.5) + paint);
}
function corailRunning(c) {
  const L = c.L, S = CO.sill, b1 = L / 2 - 31.17, b2 = L / 2 + 31.17;
  let s = boxes(b1 + 6, b2 - 6, S, 3, 1.1) + truck(b1, { wb: 8.53, d: 36, top: S }) + truck(b2, { wb: 8.53, d: 36, top: S });
  s += uicBuffers(0, -1, { sill: S }) + uicBuffers(L, 1, { sill: S }) + czHvac(L / 2 - 6, CO.roof, 12, 0.5);
  return s + (c.coupledL ? gangway(0, -1, 4.25, 11.8) : "") + (c.coupledR ? gangway(L, 1, 4.25, 11.8) : "");
}
// The windows: second class in pairs (VTU), first class wider (VU, A10tu),
// the bar car (VRtu) three big ones and the counter's blank side.
function corailWindows(o) {
  let s = "";
  const w = o.first ? 4.9 : 3.65, pitch = o.first ? 7.55 : 6.15, y0 = 6.3, y1 = 11.2;
  const xs = [];
  if (o.bar) xs.push(14.0, 20.2, 26.4, 52.0, 58.2, 64.4, 70.6);
  else for (let x = 9.6; x < 77 - w; x += pitch) xs.push(x);
  for (const x of xs) s += rect(x, y0, w, y1 - y0, C.glass, 0, `rx="0.55" stroke="#141518" stroke-width="1.0" ${NS}`) + rect(x + 0.2, y1 - 1.6, w - 0.4, 1.2, C.glassLight, 0, 'rx="0.3"');
  return s;
}
function carmDoor(x, gid, fillOverride) {
  return (fillOverride ? "" : vgrad(gid, [[0, "#a41f86"], [0.5, "#e2343a"], [1, "#c8208d"]])) +
    rect(x, CO.sill + 0.15, 3.0, 8.1, fillOverride || `url(#${gid})`, 0, `stroke="rgba(0,0,0,0.45)" stroke-width="0.5" ${NS}`) + rect(x + 0.7, 7.4, 1.6, 3.6, C.glass, 0, 'rx="0.6"');
}
// o.first, o.bar, o.night (white), o.cls the numeral.
function icCorail(c, o = {}) {
  const L = c.L, lid = newId(), did = newId(), base = o.night ? "#eceeef" : "#a3a8af";
  const paint = hgrad(lid, [[0, "#d2163b"], [1, "#c4187a"]]) + rect(-1, 11.55, L + 2, 0.45, `url(#${lid})`) + rect(-1, 0, L + 2, 3.9, "#3d4146") +
    (o.night ? rect(-1, 3.9, L + 2, 1.0, "#2a2d31") : "");
  let s = corailBody(c, base, paint) + corailWindows(o);
  s += carmDoor(2.4, did) + carmDoor(L - 5.4, did);
  s += sncfMark(c, 7.2, 5.6, 0.5, { voyageurs: false });
  return s + corailRunning(c);
}
function ouigoCorail(c) {
  const L = c.L, paint = `<circle cx="${r2(L * 0.62)}" cy="6.8" r="5.2" fill="${OTC.bubble}"/>` + rect(-1, 0, L + 2, 3.9, "#3a3d42") + rect(-1, 3.9, L + 2, 0.5, "#4a4e54");
  let s = corailBody(c, OTC.pink, paint) + corailWindows({ single: true });
  s += carmDoor(2.4, null, OTC.sky) + carmDoor(L - 5.4, null, OTC.sky);
  s += letters(c, 22.0, 5.4, 0.7, "OUIGO.COM", "#ffffff", { weight: 700 });
  return s + corailRunning(c);
}

// OUIGO Train Classique Paris-Bruxelles (since 2025): SNCB's I11 coaches
// (BN/Bombardier 1995-1997, 26.4 m) wrapped in OUIGO's pink, behind SNCB's
// HLE 18 (Siemens, 2009-2010) in SNCB's own paint (I11 12888 and 12883, HLE
// 1869 at Bruxelles-Midi, April 2025; mobilithib.substack.com): pink, the
// doors sky blue, a sky-blue bubble low on the side, "OUIGO" in white, the
// bottom dark blue; SNCB's B and SNCF Voyageurs' marks low on the doors.
function i11Ouigo(c, o = {}) {
  const L = c.L, R = 13.2, S = 3.9, b1 = L / 2 - 31.17, b2 = L / 2 + 31.17;
  const d = `M0.6 ${S}L${r2(L - 0.6)} ${S}L${r2(L - 0.6)} ${r2(R - 1.6)}Q${r2(L - 0.6)} ${R} ${r2(L - 2.6)} ${R}L2.6 ${R}Q0.6 ${R} 0.6 ${r2(R - 1.6)}Z`;
  const paint = rect(-1, 0, L + 2, 20, OTC.pink) + rect(-1, 12.1, L + 2, 3, "#9aa0a6") + `<circle cx="${r2(L * 0.42)}" cy="5.6" r="4.0" fill="${OTC.bubble}"/>` +
    rect(-1, 0, L + 2, 4.9, "#1f2f66") + rect(-1, 0, L + 2, 3.9, "#3a3d42");
  let s = shell(d, OTC.pink, paint);
  s += rect(10.6, 6.95, 9 * 6.0 + 6.0, 3.95, "#24262b", 0, 'rx="0.3"');
  for (let i = 0; i < 10; i++) s += glazing(11.0 + i * 6.0, 7.2, 10.6, 5.4, { r: 0.25, frame: "#1a1c20", fw: 0.6 });
  for (const x of [2.2, L - 6.2]) s += rect(x, S + 0.15, 4.0, 8.0, OTC.sky, 0, `rx="0.2" stroke="rgba(0,0,0,0.4)" stroke-width="0.5" ${NS}`) + rect(x + 1.3, 6.9, 1.4, 3.6, C.glass, 0, 'rx="0.6"');
  s += letters(c, L * 0.6, 6.0, 1.15, "OUIGO", "#ffffff", { weight: 700 }) + (o.xl ? "" : "");
  s += boxes(b1 + 6, b2 - 6, S, 3, 1.1) + truck(b1, { wb: 8.53, d: 36, top: S }) + truck(b2, { wb: 8.53, d: 36, top: S }) + uicBuffers(0, -1, { sill: S }) + uicBuffers(L, 1, { sill: S });
  return s + (c.coupledL ? gangway(0, -1, 4.25, 11.8) : "") + (c.coupledR ? gangway(L, 1, 4.25, 11.8) : "");
}
// SNCB's HLE 18: 19.1 m, Bo'Bo', the Eurosprinter's raked front; SNCB's
// paint: light grey, the cab yellow round its windshield and corners, a
// dark grey band along the top of the side between a red line and a blue
// one, SNCB's "B" in a ring.
const NOSE_HLE = [[1.7, 4.1], [1.1, 6.3], ["q", 0.95, 8.5, 2.3, 9.3], [3.9, 12.15], ["q", 4.6, 13.0, 6.4, 13.0]];
const hlePaint = (c, L) => rect(-1, 0, L + 2, 20, "#d9dcdf") + rect(-1, 12.0, L + 2, 3, "#9aa0a6") + rect(-1, 8.6, L + 2, 2.9, "#3a3d44") + rect(-1, 11.5, L + 2, 0.22, "#d2232a") +
  rect(-1, 8.4, L + 2, 0.2, "#2b4fa0") + rect(-1, 0, L + 2, 4.6, "#4a4e54") + path("M-1 8.0L2.6 8.0Q3.8 9.5 4.4 12.9L-1 12.9Z", "#f2c21b") + rect(-1, 4.1, 4.6, 1.2, "#f2c21b");
const hleOver = (c, L) => placed(c, L / 2 + 6, 6.6, 1.1, `<circle r="0.48" fill="none" stroke="#2b3036" stroke-width="0.07"/><text y="0.2" font-size="0.6" text-anchor="middle" font-family="${SANS}" font-weight="700" fill="#2b3036">B</text>`) +
  letters(c, 9.4, 6.6, 0.9, "18" + String(c.setNo || "").slice(-2), "#2b3036", { weight: 600 });
const hle18 = (c) => euroLoco(c, { roof: 13.0, sill: 4.1, nose: NOSE_HLE, rake: [[2.3, 9.3], [3.9, 12.15]], centers: 32.5, wheel: 45, door: 7.2, surround: "#141518",
  paint: hlePaint, over: hleOver, grilles: [[-13.1, 4.0, 11.1, 11.9], [17.9, 4.6, 11.1, 11.9]], grilleFill: "rgba(20,22,25,0.25)" });

// ===================== Coradia Liner (Régiolis Intercités) =====================
// Alstom's Coradia Liner for Intercités (B 85000, bi-mode, six cars, 110 m,
// Nantes-Bordeaux, Nantes-Lyon; Z 51500, electric, four cars, 72 m, no first
// class, Toulouse-Hendaye; fr.wikipedia "Coradia Liner"), in the Carmillon
// paint (B 85045 at Nantes, 2026): white, the windows in a black band, a
// carmillon line over it, a black mask round the windshield edged in
// carmillon sweeping up from the coupler to the roof, the doors magenta,
// light grey along the bottom, the roof grey.
const NOSE_RG = [[1.6, 2.1], [0.7, 3.2], [0.45, 5.5], ["q", 0.6, 7.3, 1.7, 8.5], [3.8, 12.0], ["q", 4.7, 13.1, 7.0, 13.1]];
const rgPaint = (cab) => (c, g) => {
  const L = g.L, lid = newId();
  let s = hgrad(lid, [[0, "#d2163b"], [1, "#c4187a"]]) + rect(-1, 0, L + 2, 20, "#eceeef") + rect(-1, 12.4, L + 2, 3, "#9aa0a6") + rect(-1, 5.4, L + 2, 5.1, "#232528") +
    rect(-1, 10.5, L + 2, 0.32, `url(#${lid})`) + rect(-1, 0, L + 2, 3.1, "#b9bdc2") + rect(-1, 0, L + 2, 1.9, "#55595f");
  if (cab) s += path("M-1 2.6L1.7 2.6Q3.0 6.2 6.0 9.8Q7.8 11.6 9.8 13.2L-1 13.2Z", "#17181b") +
    path("M1.7 2.6L2.5 2.6Q3.8 6.0 6.8 9.5Q8.6 11.4 10.8 13.2L9.8 13.2Q7.8 11.6 6.0 9.8Q3.0 6.2 1.7 2.6Z", `url(#${lid})`);
  return s;
};
const rgDoor = (x) => ({ x, w: 4.3, y0: 2.1, y1: 9.9, leaves: 2, glassY: 0.35, glassH: 0.45, fill: "#c4187a", grabs: false });
const rgCab = (c) => unit(c, { roof: 13.1, sill: 2.1, nose: NOSE_RG, rake: [[1.7, 8.5], [3.8, 12.0]], depth: 3.4, cabLen: 9, lampY: 4.3,
  rows: [{ xs: [9.8], y: 7.3, w: 1.6, h: 2.6, r: 0.3 }, { xs: [21.0, 26.4, 31.8, 37.2, 42.6, 48.0, 53.4], y: 6.0, w: 4.4, h: 3.9, r: 0.45 }],
  doors: [rgDoor(14.6)], trucks: [7.6, "end"], wheel: 33, paint: rgPaint(true), surround: "#17181b",
  extra: (cc, g) => roofCover(10, 13.1, g.L - 11, 0.55, "#8d949b", 8) + boxes(20, 40, 2.1, 2, 1.0) + sncfMark(cc, 19.2, 4.2, 0.45, { voyageurs: false }) });
const rgMid = (o = {}) => (c) => unit(c, { roof: 13.1, sill: 2.1,
  rows: [{ xs: [4.6, 10.0, 15.4, 20.8, 26.2, 31.6, 37.0, 42.4, 47.8].filter((x) => x < c.L - 12), y: 6.0, w: 4.4, h: 3.9, r: 0.45 }],
  doors: [rgDoor(c.L - 8.6)], trucks: ["end"], wheel: 30, paint: rgPaint(false), pan: o.pan ? 20 : null,
  extra: (cc, g) => roofCover(0.5, 13.1, g.L - 1, 0.55, "#8d949b", 6) + boxes(8, 40, 2.1, 3, 0.8) });

// ===================== Siemens Velaro: DB's ICE 3 and Eurostar's e320 =====================
// Velaro D (DB class 407, 2013-2024: Paris-Frankfurt, -Stuttgart-Munich and,
// since December 2024, -Berlin; ICE 3M class 406 too): eight cars, 200 m,
// end cars 25.5 m with the long nose, the others 24.2 m, 3.89 m tall; a door
// at one or both ends of each car, the windows in a dark band; pantographs on
// the transformer cars, second from each end (de.wikipedia "DB-Baureihe 407").
// DB's paint (407 at Paris-Est, October 2025; Commons' side diagram of the
// 407): light grey-white, a traffic-red stripe low along the side from the
// nose's tip, "ICE" big in grey behind the cab over it, DB's mark on the nose.
// Eurostar's e320 (Velaro, class 374, 2015-2018, sixteen cars, 390 m:
// London-Paris, -Brussels, -Amsterdam) the same body; its paint (4003 at
// Bruxelles-Midi, October 2026; 374 008 at St Pancras, June 2026; Hoofddorp
// 2026): grey, a dark blue band at the windows and below edged in yellow, the
// nose yellow round the windshield; on the end car the blue swept up over
// the cab with the white "star" lines and the eurostar mark.
const VEL_NOSE = [[1.4, 3.3], [0.5, 4.0], ["q", 0.25, 5.2, 1.4, 6.0], [10.4, 10.7], ["q", 14.0, 12.75, 21.0, 12.75]];
const VEL = { roof: 12.75, sill: 3.3 };
const vDoor = (x, fill = "rgba(0,0,0,0.06)") => ({ x, w: 2.6, y0: 3.5, y1: 10.5, glassY: 0.58, glassH: 0.3, grabs: false, fill });
const dbMark = (c, x, y, h) => placed(c, x, y, h, `<rect x="-0.72" y="-0.5" width="1.44" height="1" rx="0.18" fill="#ffffff" stroke="#ec0016" stroke-width="0.11"/>` +
  `<text x="0" y="0.27" font-size="0.74" text-anchor="middle" font-family="${SANS}" font-weight="800" fill="#ec0016">DB</text>`);
const iceEndPaint = (c, g) => rect(-1, 0, g.L + 2, 20, "#eef0f1") + rect(-1, 12.0, g.L + 2, 2, "#c9ced3") + rect(-1, 0, g.L + 2, 2.9, "#cdd1d5") +
  path("M-1 3.75Q6 3.9 12 4.9L21 5.15L" + (g.L + 1) + " 5.15L" + (g.L + 1) + " 5.8L21 5.8L12 5.6Q6 4.55 -1 4.45Z", "#ec0016") + rect(29.6, 6.1, g.L - 32.0, 2.6, "#252a30", 0, 'rx="0.3"');
const iceMidPaint = (c, g) => rect(-1, 0, g.L + 2, 20, "#eef0f1") + rect(-1, 12.0, g.L + 2, 2, "#c9ced3") + rect(-1, 0, g.L + 2, 2.9, "#cdd1d5") + rect(-1, 5.15, g.L + 2, 0.65, "#ec0016") +
  rect(4.8, 6.1, g.L - 9.6, 2.6, "#252a30", 0, 'rx="0.3"');
// The windows (Commons' side diagram of the 407; e320 at Hoofddorp 2026):
// about 5.3 ft wide, 6.8 ft apart, 2.4 ft tall.
const velWins = (a, n) => [{ xs: Array.from({ length: n }, (_, i) => a + i * 6.8), y: 6.2, w: 5.3, h: 2.35, r: 0.4 }];
const iceEnd = (c) => unit(c, { ...VEL, nose: VEL_NOSE, rake: [[3.6, 7.3], [12.6, 11.4]], depth: 3.0, cabLen: 18, lampY: 5.0, surround: "#1d2126",
  rows: velWins(30.0, 7), doors: [vDoor(21.0)], trucks: [17.0, c.L - 8.0], wheel: 36, paint: iceEndPaint,
  extra: (cc, g) => letters(cc, 26.4, 7.0, 3.3, "ICE", "#8d949b", { weight: 700, family: NARROW }) + dbMark(cc, 3.2, 5.4, 0.7) + roofCover(g.L - 22, VEL.roof, 14, 0.35, "#c3c8cd", 3) });
const iceMid = (o = {}) => (c) => unit(c, { ...VEL, rows: velWins(9.85, 9), doors: [vDoor(1.6), vDoor(c.L - 4.2)], trucks: [8.0, c.L - 8.0], wheel: 36, paint: iceMidPaint,
  pan: o.pan ? c.L / 2 + 6 : null, extra: (cc, g) => (o.pan ? "" : roofCover(18, VEL.roof, 30, 0.3, "#c3c8cd", 4)) });
// Eurostar e320.
const ES = { grey: "#a8aeb5", blue: "#1f2f66", yellow: "#f2c21b", star: "#ffffff" };
const esWord = (c, x, y, h, fill = "#ffffff") => placed(c, x, y, h, `<circle cx="-2.35" cy="-0.32" r="0.42" fill="none" stroke="${fill}" stroke-width="0.07"/>` +
  `<path d="M-2.35 -0.68L-2.28 -0.39L-2.0 -0.32L-2.28 -0.25L-2.35 0.04L-2.42 -0.25L-2.7 -0.32L-2.42 -0.39Z" fill="${fill}"/>` +
  `<text x="-1.75" y="0" font-size="0.85" font-family="Georgia, ${SANS}" font-style="italic" fill="${fill}">eurostar</text>`);
const starLines = (x, y, r) => lines([[x - r, y - r * 0.15, x + r, y + r * 0.15], [x - r * 0.35, y + r * 0.9, x + r * 0.3, y - r * 0.95], [x - r * 0.7, y - r * 0.6, x + r * 0.75, y + r * 0.55]], "rgba(255,255,255,0.85)", 0.6);
// The e320's nose (4003 at Bruxelles-Midi, October 2026): yellow over its
// whole upper part, round the windscreen and back over the cab's roof to
// a point above the cab door, the headlights at its lower edge; grey below;
// the blue panel from behind the cab window back along the train, the
// yellow line under it running on along the side.
// The e320's paint (4003 at Bruxelles-Midi and Hoofddorp, 374 008 at St
// Pancras, 2026): on the end car the nose yellow over its whole upper part,
// round the windscreen and up over the cab's roof, the headlights at its
// lower edge, grey below; a grey strip, then the blue panel, its front edge
// a curve behind the windscreen, up to just under the roof's edge as far as
// the cab door, then at the windows' height along the car, closed near its
// far end by the yellow line under it sweeping up; the other cars grey,
// the yellow line low along them.
const e320EndPaint = (c, g) => rect(-1, 0, g.L + 2, 20, ES.grey) + rect(-1, 12.0, g.L + 2, 2, "#8f969d") + rect(-1, 0, g.L + 2, 2.9, "#5f656c") +
  path(`M10.6 4.95Q13.6 5.4 14.3 8.0Q14.9 10.4 16.4 11.9L21.0 11.9Q22.0 11.9 22.4 10.6L23.6 9.6L${g.L - 20} 9.6Q${g.L - 14} 9.6 ${g.L - 11} 9.6L${g.L - 11} 9.4Q${g.L - 14} 5.0 ${g.L - 20} 4.95Z`, ES.blue) +
  path(`M9.0 4.95L${g.L - 20} 4.95Q${g.L - 14} 5.0 ${g.L - 11} 9.4L${g.L - 10.4} 9.4Q${g.L - 13.4} 4.6 ${g.L - 20} 4.55L10.0 4.55Z`, ES.yellow) + rect(g.L - 11.5, 4.55, 12.5, 0.4, ES.yellow) +
  path("M-1 4.5Q2.0 4.7 3.6 5.2Q7.0 6.5 10.0 8.4Q12.4 10.0 14.0 12.6L-1 13.5Z", ES.yellow) +
  path("M2.0 5.3Q3.6 5.7 4.8 6.3L4.5 6.9Q3.2 6.4 1.9 6.0Z", "#1d2126");
const e320MidPaint = (c, g) => rect(-1, 0, g.L + 2, 20, ES.grey) + rect(-1, 12.0, g.L + 2, 2, "#8f969d") + rect(-1, 0, g.L + 2, 2.9, "#5f656c") +
  rect(-1, 4.55, g.L + 2, 0.4, ES.yellow);
const e320End = (c) => unit(c, { ...VEL, nose: VEL_NOSE, rake: [[4.6, 8.1], [12.6, 11.6]], depth: 1.4, cabLen: 18, lampY: 5.0, surround: "#1d2126",
  rows: velWins(25.6, 8), doors: [vDoor(21.0, ES.grey)], trucks: [17.0, c.L - 8.0], wheel: 36, paint: e320EndPaint,
  extra: (cc, g) => path("M15.9 9.3L17.4 9.3L17.4 10.9L16.7 10.9Z", C.glass, 0, `stroke="#15181b" stroke-width="0.6" ${NS}`) +
    starLines(18.0, 7.2, 3.0) + esWord(cc, 19.45, 10.0, 0.65) + letters(cc, 16.4, 6.0, 0.75, cc.setNo || "", "#ffffff", { weight: 600 }) + roofCover(g.L - 22, VEL.roof, 14, 0.35, "#8f969d", 3) });
const e320Mid = (o = {}) => (c) => unit(c, { ...VEL, rows: velWins(9.85, 9), doors: [vDoor(1.6, ES.grey), vDoor(c.L - 4.2, ES.grey)], trucks: [8.0, c.L - 8.0], wheel: 36, paint: e320MidPaint,
  pan: o.pan ? c.L / 2 + 6 : null, extra: (cc, g) => (o.pan ? "" : roofCover(18, VEL.roof, 30, 0.3, "#8f969d", 4)) });

// ===================== Eurostar's red trains (ex-Thalys PBKA and PBA) =====================
// Alstom's TGV PBKA (4301-4307, 4321-4322, 4331-4332, 4341-4346, 1996-1998)
// and PBA (4531-4540, 1996): a TGV Réseau-like power car at each end and
// eight single-deck articulated trailers, 200 m; Thalys's since 1996, Eurostar's
// since its merger with Thalys (October 2023), still in Thalys's red with
// Eurostar's marks in 2026 (4331, 4537, 4304 at Paris-Nord, Amsterdam and
// Hoofddorp, 2026; 4538 at Aime-la-Plagne for the ski trains): Thalys red;
// on the power car a pale grey wave low along the side rising to the rear,
// the louvers dark, the white star lines on the cab's side and "eurostar"
// with its star; the trailers red, the windows in a plum band edged above
// and below by a silver line, the doors silver grey, grey along the bottom.
const TH = { red: "#a7192d", plum: "#6e2a3d", silver: "#c6c9cc", skirt: "#5b5f64" };
function pbkaPower(c) {
  const L = c.L;
  const paint = rect(-1, 0, L + 2, 20, TH.red) + path(`M${PC.door + PC.doorW + 0.6} 4.1L${L - 3} 4.1L${L - 3} 10.4Q${L - 18} 8.6 ${PC.door + 8} 4.9Z`, TH.silver) +
    rect(-1, 0, L + 2, 3.1, TH.skirt) + path(noseBand(0, 0.3, 14.0), "#3a0f18");
  let s = shell(pcOutline(L), TH.red, paint);
  s += pcParts(c, { visor: "#3a0f18", doorFill: TH.red });
  s += starLines(9.5, 7.0, 3.0) + esWord(c, PC.door + 8.8, 10.0, 1.3) + letters(c, 5.2, 4.4, 0.55, c.setNo || "", "#ffffff", { weight: 600, italic: true });
  return s;
}
function pbkaTrailer(c, o = {}) {
  const L = c.L, R = 11.3, S = 3.4;
  const d = M([0.35, S]) + L_([[L - 0.35, S], [L - 0.35, R - 1.2]]) + `Q${r2(L - 0.35)} ${R} ${r2(L - 1.6)} ${R}L1.6 ${R}Q0.35 ${R} 0.35 ${r2(R - 1.2)}Z`;
  // The trailers (4306 at Hoofddorp, 2026): red, a wide silver band over
  // the windows, the windows in a plum band, red below, grey along the foot.
  const paint = rect(-1, 0, L + 2, 20, TH.red) + rect(-1, 5.3, L + 2, 3.6, TH.plum) + rect(-1, 8.9, L + 2, 1.1, TH.silver) +
    rect(-1, 0, L + 2, 3.9, TH.skirt);
  let s = shell(d, TH.red, paint);
  for (let i = 0; i < 8; i++) s += glazing(9.5 + i * 6.2, 5.6, 8.6, 3.9, { r: 0.4, frame: "#2a1218" });
  s += rect(3.4, S + 0.1, 2.5, 6.4, TH.silver, 0, `rx="0.25" stroke="rgba(0,0,0,0.4)" stroke-width="0.5" ${NS}`) + rect(4.15, 5.9, 1.0, 2.4, C.glass, 0, 'rx="0.35"');
  s += esWord(c, L - 9.0, 4.8, 0.6);
  s += truck(L, { wb: 9.84, d: 36.2, top: S }) + truck(0, { wb: 9.84, d: 36.2, top: S });
  return s + (c.coupledL ? gangway(0, -1, 3.6, R - 0.6, "#2a2d31") : "") + (c.coupledR ? gangway(L, 1, 3.6, R - 0.6, "#2a2d31") : "");
}

// ---------- Types, models ----------

// TGV Lyria and the AGC as drawn in chintl.cars.js.
const CH_KEYS = ["frLyriaPower", "frLyriaEnd1", "frLyriaFirst", "frLyriaBar", "frLyriaSecond", "frLyriaEnd2", "frAgcAuraCab", "frAgcAuraMid"];
export const TYPES = {
  ...Object.fromEntries(CH_KEYS.map((k) => [k, CH_TYPES[k]])),
  snInouiPower: { name: "TGV INOUI power car (Duplex, Dasye, Euroduplex)", kind: "electric", pan: true },
  snInouiEnd1: { name: "TGV INOUI end trailer, first class (car 1)", kind: "bilevel", amenities: ["first"] },
  snInouiFirst: { name: "TGV INOUI trailer, first class", kind: "bilevel", amenities: ["first"] },
  snInouiBar: { name: "TGV INOUI bar car (car 4)", kind: "bilevel", amenities: ["cafe"] },
  snInouiSecond: { name: "TGV INOUI trailer, second class", kind: "bilevel" },
  snInouiSecondR: { name: "TGV INOUI trailer, second class", kind: "bilevel" },
  snInouiEnd2: { name: "TGV INOUI end trailer, second class (car 8)", kind: "bilevel" },
  snInouiPowerR: { name: "TGV INOUI power car (Duplex, Dasye, Euroduplex)", kind: "electric", pan: true },
  snOuigoPower: { name: "OUIGO power car (Duplex, Dasye)", kind: "electric", pan: true },
  snOuigoPowerR: { name: "OUIGO power car (Duplex, Dasye)", kind: "electric", pan: true },
  snOuigoEnd: { name: "OUIGO end trailer", kind: "bilevel" },
  snOuigoCar: { name: "OUIGO trailer", kind: "bilevel" },
  snOuigoCarW: { name: "OUIGO trailer", kind: "bilevel" },
  snOuigoDeck: { name: "OUIGO car 4 (upper deck seats, the train's equipment below)", kind: "bilevel" },
  snOuigoCarR: { name: "OUIGO trailer", kind: "bilevel" },
  snOuigoCarWR: { name: "OUIGO trailer", kind: "bilevel" },
  snOuigoEndR: { name: "OUIGO end trailer", kind: "bilevel" },
  snOtcBb22200: { name: "BB 22200 electric locomotive, OUIGO Train Classique", kind: "electric", pan: true },
  snOtcCorail: { name: "Corail coach, OUIGO Train Classique", kind: "coach" },
  snOtcI11: { name: "SNCB I11 coach, OUIGO Train Classique", kind: "coach" },
  snHle18: { name: "SNCB HLE 18 electric locomotive", kind: "electric", pan: true },
  snIcBb26000: { name: "BB 26000 electric locomotive, Intercités", kind: "electric", pan: true },
  snIcBb7200: { name: "BB 7200 electric locomotive (béton paint)", kind: "electric", pan: true },
  snIcBb22200: { name: "BB 22200 electric locomotive (grey)", kind: "electric", pan: true },
  snIcCorail2: { name: "Corail coach, second class, Intercités", kind: "coach" },
  snIcCorail1: { name: "Corail coach, first class, Intercités", kind: "coach", amenities: ["first"] },
  snIcnCouchette: { name: "Corail couchette car, Intercités de nuit", kind: "coach", amenities: ["sleepers"] },
  snIcnSeat: { name: "Corail seat car, Intercités de nuit", kind: "coach" },
  snRgCab: { name: "Coradia Liner (B 85000/Z 51500) end car, Intercités", kind: "emu" },
  snRgMid: { name: "Coradia Liner middle car, Intercités", kind: "emu" },
  snRgMidPan: { name: "Coradia Liner middle car with pantograph, Intercités", kind: "emu", pan: true },
  snIce3End: { name: "ICE 3 (Velaro D, DB class 407) end car", kind: "emu" },
  snIce3Mid: { name: "ICE 3 second-class car", kind: "emu" },
  snIce3Pan: { name: "ICE 3 second-class car with pantograph", kind: "emu", pan: true },
  snE320End: { name: "Eurostar e320 end car, Business Premier and Plus", kind: "emu", amenities: ["first", "business"] },
  snE320Pan: { name: "Eurostar e320 car with pantograph", kind: "emu", pan: true },
  snE320Mid: { name: "Eurostar e320 car, Eurostar Standard", kind: "emu" },
  snPbkaPower: { name: "Eurostar power car (ex-Thalys TGV PBKA/PBA)", kind: "electric", pan: true },
  snPbkaTrailer: { name: "Eurostar trailer (ex-Thalys)", kind: "coach" },
};
const Mo = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  ...Object.fromEntries(CH_KEYS.map((k) => [k, CH_MODELS[k]])),
  snInouiPower: Mo(inouiPower, 72.67, true),
  snInouiEnd1: Mo((c) => inouiTrailer(c, { end: true, cls: "1" }), 71.69),
  snInouiFirst: Mo((c) => inouiTrailer(c, { cls: "1" }), 61.35),
  snInouiBar: Mo((c) => inouiTrailer(c, { bar: true, cls: "1" }), 61.35),
  snInouiSecond: Mo((c) => inouiTrailer(c, { cls: "2" }), 61.35),
  snInouiSecondR: Mo((c) => mirror(c, (m) => inouiTrailer(m, { cls: "2" })), 61.35),
  snInouiEnd2: Mo((c) => mirror(c, (m) => inouiTrailer(m, { end: true, cls: "2" })), 71.69),
  snInouiPowerR: Mo((c) => mirror(c, inouiPower), 72.67),
  snOuigoPower: Mo(ouigoPower, 72.67, true),
  snOuigoPowerR: Mo((c) => mirror(c, ouigoPower), 72.67),
  snOuigoEnd: Mo((c) => ouigoTrailer(c, { end: true, word: true }), 71.69),
  snOuigoCar: Mo((c) => ouigoTrailer(c, {}), 61.35),
  snOuigoCarW: Mo((c) => ouigoTrailer(c, { word: true }), 61.35),
  snOuigoDeck: Mo((c) => ouigoTrailer(c, { deck: true }), 61.35),
  snOuigoCarR: Mo((c) => mirror(c, (m) => ouigoTrailer(m, {})), 61.35),
  snOuigoCarWR: Mo((c) => mirror(c, (m) => ouigoTrailer(m, { word: true })), 61.35),
  snOuigoEndR: Mo((c) => mirror(c, (m) => ouigoTrailer(m, { end: true })), 71.69),
  snOtcBb22200: Mo(bb22200Ouigo, 57.35),
  snOtcCorail: Mo(ouigoCorail, 86.6),
  snOtcI11: Mo(i11Ouigo, 86.6),
  snHle18: Mo(hle18, 62.7),
  snIcBb26000: Mo(bb26000, 58.1),
  snIcBb7200: Mo(bb7200, 57.35),
  snIcBb22200: Mo(bb22200Grey, 57.35),
  snIcCorail2: Mo((c) => icCorail(c, {}), 86.6),
  snIcCorail1: Mo((c) => icCorail(c, { first: true }), 86.6),
  snIcnCouchette: Mo((c) => icCorail(c, { night: true, couchette: true }), 86.6),
  snIcnSeat: Mo((c) => icCorail(c, { night: true }), 86.6),
  snRgCab: Mo(rgCab, 66.6, true),
  snRgMid: Mo(rgMid(), 57.9),
  snRgMidPan: Mo(rgMid({ pan: true }), 57.9),
  snIce3End: Mo(iceEnd, 83.66, true),
  snIce3Mid: Mo(iceMid(), 79.4),
  snIce3Pan: Mo(iceMid({ pan: true }), 79.4),
  snE320End: Mo(e320End, 83.66, true),
  snE320Pan: Mo(e320Mid({ pan: true }), 79.4),
  snE320Mid: Mo(e320Mid(), 79.4),
  snPbkaPower: Mo(pbkaPower, 72.67, true),
  snPbkaTrailer: Mo((c) => pbkaTrailer(c, {}), 61.35),
};

// ---------- Typical trains ----------
// SNCF publishes no formations, so each train is drawn as its line runs:
// TGV INOUI a double-deck set (Duplex, Dasye or Euroduplex: first class in
// cars 1-3, the bar in car 4, second class in 5-8; the Euroduplex
// "Océane" sets have first class in cars 1-2 and half of 3); OUIGO two
// sets coupled (each power car's nose at the coupling, as they run);
// TGV Lyria as in Switzerland.
const set = (label, ...units) => ({ label, units });
const INOUI_UNITS = [["snInouiPower", 1], ["snInouiEnd1", 1], ["snInouiFirst", 2], ["snInouiBar", 1], ["snInouiSecondR", 3], ["snInouiEnd2", 1]];
const INOUI = set("TGV INOUI double-deck set (Duplex or Euroduplex): first class in cars 1-3, the bar in car 4 (busier trains two sets coupled)",
  ...INOUI_UNITS, ["snInouiPower", 1]);
const INOUI_UM = set("TGV INOUI, two double-deck sets coupled (Duplex or Euroduplex): first class in cars 1-3 and 11-13, the bars in cars 4 and 14",
  ...INOUI_UNITS, ["snInouiPowerR", 1], ...INOUI_UNITS, ["snInouiPower", 1]);
const INOUI_DE = set("TGV INOUI Euroduplex for Germany (the 4700s, DB and SNCF's Alleo): first class in cars 1-3, the bar in car 4", ...INOUI_UNITS, ["snInouiPower", 1]);
const OUIGO_HALF = [["snOuigoPower", 1], ["snOuigoEnd", 1], ["snOuigoCar", 1], ["snOuigoCarW", 1], ["snOuigoDeck", 1], ["snOuigoCarR", 1], ["snOuigoCarWR", 1], ["snOuigoCarR", 1], ["snOuigoEndR", 1]];
const OUIGO = set("OUIGO: two double-deck sets coupled (Duplex or Dasye), one class, 20 cars (some trains one set)", ...OUIGO_HALF, ["snOuigoPowerR", 1], ...OUIGO_HALF, ["snOuigoPower", 1]);
const LYRIA = set("TGV Lyria (Euroduplex): first class in cars 1-3, the bar in car 4 (some trains are two sets coupled)",
  ["frLyriaPower", 1], ["frLyriaEnd1", 1], ["frLyriaFirst", 2], ["frLyriaBar", 1], ["frLyriaSecond", 3], ["frLyriaEnd2", 1], ["frLyriaPower", 1]);
const OTC_SET = set("OUIGO Train Classique: a BB 22200 and eight Corail coaches in OUIGO's pink, one class", ["snOtcBb22200", 1], ["snOtcCorail", 8]);
const OTC_BX = set("OUIGO Train Classique Paris-Bruxelles: an SNCB HLE 18 and eight SNCB I11 coaches in OUIGO's pink, one class", ["snHle18", 1], ["snOtcI11", 8]);
const IC_CORAIL = set("Intercités: a BB 26000 with Corail coaches, first class next to the locomotive", ["snIcBb26000", 1], ["snIcCorail1", 2], ["snIcCorail2", 6]);
const IC_BM = set("Intercités Bordeaux-Marseille: a BB 7200 with Corail coaches (to be replaced by CAF's Oxygène trains from 2028)", ["snIcBb7200", 1], ["snIcCorail1", 2], ["snIcCorail2", 5]);
const IC_RG6 = set("Intercités Coradia Liner (B 85000), six cars, first and second class", ["snRgCab", 1], ["snRgMid", 1], ["snRgMidPan", 1], ["snRgMid", 2], ["snRgCab", 1]);
const IC_RG4 = set("Intercités Coradia Liner (Z 51500), four cars, second class only", ["snRgCab", 1], ["snRgMidPan", 1], ["snRgMid", 1], ["snRgCab", 1]);
const IC_AGC = set("Intercités (the Aubrac, the Cévenol): an AGC railcar (B 81500), often two coupled", ["frAgcAuraCab", 1], ["frAgcAuraMid", 2], ["frAgcAuraCab", 1]);
const ICN = set("Intercités de Nuit: a BB 26000 with Corail night coaches: a seat car and couchettes (first class four to a compartment, second six); BB 75300s take over at the end of the line where it isn't electrified",
  ["snIcBb26000", 1], ["snIcnSeat", 1], ["snIcnCouchette", 6]);
const ICN_NICE = set("Intercités de Nuit Paris-Nice: a BB 22200 with Corail night coaches: a seat car and couchettes", ["snIcBb22200", 1], ["snIcnSeat", 1], ["snIcnCouchette", 6]);
const ICE3 = set("ICE 3 (DB's Velaro D, class 407): eight cars, first class at one end (some trains two sets coupled)",
  ["snIce3End", 1], ["snIce3Pan", 1], ["snIce3Mid", 4], ["snIce3Pan", 1], ["snIce3End", 1]);
const E320 = set("Eurostar e320: sixteen cars, two half-sets, Business Premier and Plus at the London end",
  ["snE320End", 1], ["snE320Pan", 1], ["snE320Mid", 4], ["snE320Pan", 1], ["snE320Mid", 2], ["snE320Pan", 1], ["snE320Mid", 4], ["snE320Pan", 1], ["snE320End", 1]);
const PBKA = set("Eurostar (the red ex-Thalys sets, PBKA or PBA): two power cars and eight trailers (some trains two sets coupled)",
  ["snPbkaPower", 1], ["snPbkaTrailer", 8], ["snPbkaPower", 1]);
const SETS = [INOUI, INOUI_UM, OUIGO, LYRIA, OTC_SET, OTC_BX, IC_CORAIL, IC_BM, IC_RG6, IC_RG4, IC_AGC, ICN, ICN_NICE, ICE3, E320, PBKA];
const setOf = (key) => SETS.find((x) => x.units.some(([k]) => k === key)) || null;
const endsOf = (t) => `${t.origin || ""} | ${t.destination || ""}`;
const any = (t, re) => re.test(endsOf(t)) || (t.stops || []).some((x) => re.test(x.name || ""));
export const TYPICAL = {
  tgv: (t, reported) => {
    if (!t.route && reported) return setOf(reported);
    if (/Lyria/.test(t.route || "")) return LYRIA;
    return INOUI;
  },
  ouigo: (t, reported) => {
    if (!t.route && reported) return setOf(reported);
    if (/Classique/.test(t.route || "")) return any(t, /Bruxelles|Brussel/) ? OTC_BX : OTC_SET;
    return OUIGO;
  },
  intercites: (t, reported) => {
    const r = t.route || "";
    if (!r && reported) return setOf(reported);
    if (/Nuit/.test(r)) return any(t, /^Nice|Nice-Ville/) ? ICN_NICE : ICN;
    // By the line: the Coradia Liners on Nantes-Bordeaux, Nantes-Lyon and
    // Nancy-Lyon (six cars), Toulouse-Hendaye (four); AGCs on the Aubrac
    // (Clermont-Béziers) and the Cévenol; BB 7200s on Bordeaux-Marseille;
    // BB 26000s on Paris-Clermont and Paris-Limoges-Toulouse.
    if (any(t, /Hendaye|Bayonne|Lourdes|Tarbes|Pau$/) && any(t, /Toulouse/) && !any(t, /Paris/)) return IC_RG4;
    if (any(t, /Nantes|Nancy|Culmont/)) return IC_RG6;
    if (any(t, /Béziers|Nîmes/) && any(t, /Clermont/)) return IC_AGC;
    if (any(t, /Bordeaux|Marseille/) && !any(t, /Paris/)) return IC_BM;
    return IC_CORAIL;
  },
  frintl: (t, reported) => {
    const r = t.route || "";
    if (!r && reported) return setOf(reported);
    if (r === "ICE") return any(t, /Marseille|München/) ? INOUI_DE : ICE3;
    if (/Eurostar/.test(r)) return any(t, /London/) ? E320 : PBKA;
    return reported ? setOf(reported) : null;
  },
};

// ---------- Fact sheets ----------
const FRWP = "https://fr.wikipedia.org/wiki/";
const WP = "https://en.wikipedia.org/wiki/";
const DPX = { model: "Alstom TGV Duplex / Dasye / Euroduplex (2N2)", builder: "Alstom", built: "1995–2021", topSpeedMph: 199, source: `${FRWP}TGV_Duplex` };
const OGF = { model: "Alstom TGV Duplex / Dasye, rebuilt for OUIGO", builder: "Alstom", built: "1995–2012 (OUIGO since 2013)", topSpeedMph: 199, source: `${FRWP}Ouigo` };
const CORF = { model: "Corail coach (VU/VTU)", type: "Passenger coach", builder: "Various (SNCF)", built: "1975–1989", lengthFt: 86.6, topSpeedMph: 124, source: `${FRWP}Voiture_Corail` };
const RGF = { model: "Alstom Coradia Liner (Régiolis Intercités)", type: "Bi-mode multiple unit", builder: "Alstom", built: "2017–2018", topSpeedMph: 99, source: `${FRWP}Coradia_Liner` };
const VELF = { model: "Siemens Velaro D (DB class 407)", type: "High-speed electric multiple unit", builder: "Siemens Mobility", fleet: "17 sets", topSpeedMph: 199, source: "https://de.wikipedia.org/wiki/DB-Baureihe_407" };
const E320F = { model: "Siemens Velaro e320 (Eurostar class 374)", type: "High-speed electric multiple unit", builder: "Siemens Mobility", built: "2014–2018", fleet: "17 sixteen-car sets", topSpeedMph: 199, source: `${WP}British_Rail_Class_374` };
const PBKAF = { model: "Alstom TGV PBKA / PBA (ex-Thalys)", builder: "GEC-Alsthom", built: "1996–1998", fleet: "17 PBKA sets and the PBA sets 4531–4540", topSpeedMph: 186, source: `${WP}TGV_PBKA` };
export const FACTS = {
  ...Object.fromEntries(CH_KEYS.filter((k) => CH_FACTS[k]).map((k) => [k, CH_FACTS[k]])),
  snInouiPower: { ...DPX, type: "High-speed power car", lengthFt: 72.7, powerHp: 11800, about: "A TGV INOUI double-deck set has a power car at each end. They run Paris to every high-speed line's cities, the cross-country TGVs, and Paris–Milano, –Barcelona, –Frankfurt and –München." },
  snInouiPowerR: { ...DPX, type: "High-speed power car", lengthFt: 72.7, about: "The rear power car of the first of two coupled sets, its nose against the second set's." },
  snInouiEnd1: { ...DPX, type: "Double-deck trailer", lengthFt: 71.7, about: "Car 1, the first-class end trailer next to a power car, its own truck under that end." },
  snInouiFirst: { ...DPX, type: "Double-deck trailer", lengthFt: 61.4, about: "A first-class trailer (cars 2 and 3), on trucks shared with its neighbours." },
  snInouiBar: { ...DPX, type: "Double-deck trailer", lengthFt: 61.4, about: "Car 4, the bar car: the bar upstairs, the train's equipment on the lower deck." },
  snInouiSecond: { ...DPX, type: "Double-deck trailer", lengthFt: 61.4, about: "A second-class trailer." },
  snInouiSecondR: { ...DPX, type: "Double-deck trailer", lengthFt: 61.4, about: "A second-class trailer (cars 5–7)." },
  snInouiEnd2: { ...DPX, type: "Double-deck trailer", lengthFt: 71.7, about: "Car 8, the second-class end trailer." },
  snOuigoPower: { ...OGF, type: "High-speed power car", lengthFt: 72.7, about: "OUIGO, SNCF's low-cost TGV, runs its double-deck sets usually two coupled, 1,268 seats in one class." },
  snOuigoPowerR: { ...OGF, type: "High-speed power car", lengthFt: 72.7, about: "The rear power car of the first of two coupled OUIGO sets." },
  snOuigoEnd: { ...OGF, type: "Double-deck trailer", lengthFt: 71.7, about: "An end trailer of a OUIGO set." },
  snOuigoEndR: { ...OGF, type: "Double-deck trailer", lengthFt: 71.7, about: "An end trailer of a OUIGO set." },
  snOuigoCar: { ...OGF, type: "Double-deck trailer", lengthFt: 61.4, about: "A OUIGO trailer, one class on both decks." },
  snOuigoCarW: { ...OGF, type: "Double-deck trailer", lengthFt: 61.4, about: "A OUIGO trailer." },
  snOuigoCarR: { ...OGF, type: "Double-deck trailer", lengthFt: 61.4, about: "A OUIGO trailer." },
  snOuigoCarWR: { ...OGF, type: "Double-deck trailer", lengthFt: 61.4, about: "A OUIGO trailer." },
  snOuigoDeck: { ...OGF, type: "Double-deck trailer", lengthFt: 61.4, about: "Car 4, the old bar car: seats and the Point Info OUIGO upstairs, the train's equipment below." },
  snOtcBb22200: { model: "Alsthom BB 22200", type: "Electric locomotive", builder: "Alsthom and MTE", built: "1976–1986", fleet: "Nine in OUIGO paint", topSpeedMph: 99, powerHp: 5900, lengthFt: 57.4,
    source: `${FRWP}BB_22200`, about: "OUIGO Train Classique's locomotives, on Paris Austerlitz–Nantes, –Rennes and –Bordeaux at up to 160 km/h." },
  snOtcCorail: { ...CORF, about: "One of OUIGO Train Classique's Corail coaches, second-class seating throughout." },
  snOtcI11: { model: "SNCB I11 coach", type: "Passenger coach", builder: "BN (Bombardier)", built: "1995–1997", lengthFt: 86.6, topSpeedMph: 124, source: "https://nl.wikipedia.org/wiki/I11-rijtuig",
    about: "SNCB's I11 coaches in OUIGO's pink run OUIGO Train Classique between Paris-Nord and Bruxelles-Midi via Saint-Quentin and Mons." },
  snHle18: { model: "Siemens HLE 18 (Eurosprinter)", type: "Electric locomotive", builder: "Siemens Mobility", built: "2009–2010", topSpeedMph: 124, lengthFt: 62.7,
    source: "https://fr.wikipedia.org/wiki/HLE_18", about: "SNCB's multi-system locomotive, hauling OUIGO Train Classique between Brussels and Paris." },
  snIcBb26000: { model: "Alsthom BB 26000 (Sybic)", type: "Electric locomotive", builder: "Alsthom", built: "1988–1998", topSpeedMph: 124, powerHp: 7600, lengthFt: 58.1,
    source: `${FRWP}BB_26000`, about: "It hauls the Intercités Paris–Clermont-Ferrand and Paris–Limoges–Toulouse and the night trains out of Paris-Austerlitz." },
  snIcBb7200: { model: "Alsthom BB 7200", type: "Electric locomotive", builder: "Alsthom and MTE", built: "1976–1985", topSpeedMph: 99, powerHp: 5900, lengthFt: 57.4,
    source: `${FRWP}BB_7200`, about: "A DC-only sister of the BB 22200, hauling the Intercités Bordeaux–Toulouse–Marseille." },
  snIcBb22200: { model: "Alsthom BB 22200", type: "Electric locomotive", builder: "Alsthom and MTE", built: "1976–1986", topSpeedMph: 99, powerHp: 5900, lengthFt: 57.4,
    source: `${FRWP}BB_22200`, about: "A dual-voltage locomotive, here on the Intercités de Nuit Paris–Nice." },
  snIcCorail2: { ...CORF, about: "A second-class Corail coach of the Intercités, renovated in the Carmillon paint." },
  snIcCorail1: { ...CORF, about: "A first-class Corail coach of the Intercités (wider windows, fewer seats)." },
  snIcnCouchette: { ...CORF, type: "Couchette car", about: "A couchette car of the Intercités de Nuit, renovated 2017–2022: four- or six-berth compartments." },
  snIcnSeat: { ...CORF, about: "The seat car of an Intercités de Nuit, reclining seats." },
  snRgCab: { ...RGF, lengthFt: 66.6, fleet: "15 six-car B 85000 and 9 four-car Z 51500", about: "The end car of an Intercités Coradia Liner: Nantes–Bordeaux, Nantes–Lyon, Nancy–Lyon and Toulouse–Hendaye." },
  snRgMid: { ...RGF, lengthFt: 57.9, about: "A middle car of the Coradia Liner, on trucks shared with its neighbours." },
  snRgMidPan: { ...RGF, lengthFt: 57.9, about: "The middle car carrying the pantograph." },
  snIce3End: { ...VELF, lengthFt: 83.7, about: "DB's ICE 3 runs Paris–Frankfurt, Paris–Stuttgart and Paris–Berlin." },
  snIce3Mid: { ...VELF, lengthFt: 79.4, about: "A middle car of the ICE 3; its traction motors are spread under half the cars." },
  snIce3Pan: { ...VELF, lengthFt: 79.4, about: "A transformer car, with a pantograph." },
  snE320End: { ...E320F, lengthFt: 83.7, about: "Eurostar's e320 runs London–Paris, London–Brussels and London–Amsterdam through the Channel Tunnel." },
  snE320Mid: { ...E320F, lengthFt: 79.4, about: "A car of the e320; sixteen cars, two half-sets, 894 seats." },
  snE320Pan: { ...E320F, lengthFt: 79.4, about: "A transformer car of the e320, with a pantograph." },
  snPbkaPower: { ...PBKAF, type: "High-speed power car", lengthFt: 72.7, about: "The red sets of Thalys, Eurostar's since 2023: Paris–Brussels–Amsterdam, –Köln and –Dortmund, and the winter trains to the Alps." },
  snPbkaTrailer: { ...PBKAF, type: "Articulated coach", lengthFt: 61.4, about: "A trailer of the ex-Thalys sets: Premium and Plus at one end, the bar, Standard." },
};
