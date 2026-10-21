// Trenord's cars (scripts/railroads/trenord.py): Lombardy's regional and
// suburban trains. The timetable names no unit, so each train is drawn as
// what usually runs on its line, labeled as typical. Trainsheet's own side
// views from published dimensions and photographs, at the shared scale
// (js/carart.js), lettered here (no logo files). Bodies and parts from
// czechia.cars.js; the double-deck, single-deck and articulated builders
// here are shared with South Tyrol's, Naples's, Sardinia's and Trentino's
// railroads (sta.cars.js, eav.cars.js, arst.cars.js, trentino.cars.js),
// each passing its own paint.

import { bilevel } from "../carmodels.js?v=dev";
import { C, rect, path, line, lines, poly, truck, slats, underframe, pantograph } from "../carart.js?v=dev";
import { unit, letters, mark, hvac, hvLine, exhaust, tank, buffers, screen } from "./czechia.cars.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
export const seq = (from, pitch, k) => Array.from({ length: Math.max(0, k) }, (_, i) => from + i * pitch);
export const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
export const boxes = (a, b, top, k = 3, depth = 1.3) => underframe(a, b, top, { depth, boxes: k, tanks: false });
export const plug = (x, sill, top, w = 4.4, fill = null) => ({ x, w, y0: sill, y1: top, leaves: 2, glassY: 0.4, glassH: 0.45, ...(fill ? { fill } : {}) });
// Windows evenly spread from a to b, w wide at pitch; with skip ([[x0,
// x1], ...]: doors), spread in each stretch of side between them instead.
export function spread(a, b, w, pitch, skip = []) {
  if (skip.length) {
    const cuts = [...skip].sort((p, q) => p[0] - q[0]);
    const out = [];
    let x = a;
    for (const [p, q] of [...cuts, [b + 0.8, b + 0.8]]) {
      if (p - 0.8 > x) out.push(...spread(x, Math.min(b, p - 0.8), w, pitch));
      x = Math.max(x, q + 0.8);
    }
    return out;
  }
  const k = Math.max(0, Math.floor((b - a - w) / pitch) + 1);
  const x0 = a + (b - a - ((k - 1) * pitch + w)) / 2;
  return seq(x0, pitch, k);
}
// A roof cover over traction gear: a low housing with its panels' seams.
export const cover = (x, roof, w, h = 0.6, fill = "#aab1b9") => rect(x, roof - 0.05, w, h, fill, 0.4, 'rx="0.25"') +
  lines(seq(x + w / 3, w / 3, 2).map((s) => [s, roof + 0.05, s, roof + h - 0.1]), "rgba(0,0,0,0.25)", 0.4);
// A wiper, a step under a door, a door's grab rail.
export const step = (x, w, y) => rect(x + 0.1, y - 0.35, w - 0.2, 0.25, "currentColor", 0, 'opacity="0.85"');

// ---------- Builders ----------

// A double-deck car (sections of a unit, or coaches): the lower deck sunk
// between the trucks (a..b, floor y), the ends over the trucks at an
// intermediate level. o: roof, sill, a, b, y; nose and rake (a cab); cabLen;
// doors: [{x, w, low}] (low: on the lower deck, else at the end level);
// trucks [x...]; pan; paint(c, g); doorFill; ends (end-section windows' xs);
// extra(c, g). The windows are laid out on both decks between the doors.
export function deck(c, o) {
  const { roof, sill, a, b, y } = o, L = c.L;
  const doorSpans = (o.doors || []).map((d) => [d.x, d.x + d.w]);
  const up = roof - 4.4, lo = y + 2.45;
  const rows = [
    { xs: spread(a + 0.4, b - 0.4, o.winW ?? 5.0, o.pitch ?? 5.8), y: up, w: o.winW ?? 5.0, h: o.upH ?? 2.75, r: 0.45 },
    { xs: spread(a + 0.4, b - 0.4, o.winW ?? 5.0, o.pitch ?? 5.8, doorSpans), y: lo, w: o.winW ?? 5.0, h: o.loH ?? 2.6, r: 0.45 },
    { xs: (o.ends ?? [a - 9.0, b + 4.6]).filter((x) => !doorSpans.some(([p, q]) => x + 3.9 > p && x < q)), y: sill + 3.3, w: 3.9, h: 2.6, r: 0.4 },
  ];
  const doors = (o.doors || []).map((d) => ({ ...plug(d.x, d.low ? y + 0.15 : sill + 0.2, d.low ? y + 7.4 : sill + 7.2, d.w), ...(o.doorFill ? { fill: o.doorFill(c) } : {}) }));
  return unit(c, { roof, sill, drop: { a, b, y }, nose: o.nose, rake: o.rake, cabLen: o.cabLen ?? 8, depth: o.depth, lampY: o.lampY ?? sill + 1.9,
    rows, doors, trucks: o.trucks ?? [8.0, L - 8.0], wheel: o.wheel ?? 36, paint: o.paint, diaphragm: [sill + 0.2, roof - 1.5], surround: o.surround,
    coupler: o.coupler, pan: o.pan ?? null,
    extra: (cc, g) => (o.doors || []).map((d) => step(d.x, d.w, d.low ? y + 0.15 : sill + 0.2)).join("") + (o.extra ? o.extra(cc, g) : "") });
}

// A single-deck car on its own two trucks, or a section of an articulated
// unit (trucks "start"/"end" for the Jakobs trucks it shares). o: roof,
// sill, nose, rake, cabLen, doors ([x...] double plug doors, doorW wide,
// from doorY), win { y, w, h, pitch }, trucks, pan, paint, extra.
export function single(c, o) {
  const { roof, sill } = o, L = c.L, dw = o.doorW ?? 4.3, dy = o.doorY ?? sill;
  const spans = (o.doors || []).map((x) => [x, x + dw]);
  const wn = o.win || { y: sill + 3.0, w: 5.0, h: 3.8, pitch: 5.8 };
  const a = o.nose ? (o.cabLen ?? 8) + 1.8 : 1.6, b = L - (o.cabR ? 9 : 1.6);
  const rows = [{ xs: spread(a, b, wn.w, wn.pitch, spans), y: wn.y, w: wn.w, h: wn.h, r: wn.r ?? 0.45 }, ...(o.rows || [])];
  const doors = (o.doors || []).map((x) => ({ ...plug(x, dy, wn.y + wn.h + 0.5, dw), ...(o.doorFill ? { fill: o.doorFill(c) } : {}) }));
  return unit(c, { roof, sill, nose: o.nose, rake: o.rake, cabLen: o.cabLen ?? 8, depth: o.depth, lampY: o.lampY ?? sill + 1.7, low: o.low,
    rows, doors, trucks: o.trucks ?? [8.0, L - 8.0], wheel: o.wheel ?? 33, paint: o.paint, diaphragm: o.diaphragm ?? [sill + 0.2, roof - 1.5],
    surround: o.surround, coupler: o.coupler, pan: o.pan ?? null,
    extra: (cc, g) => (o.doors || []).map((x) => step(x, dw, dy)).join("") + (o.extra ? o.extra(cc, g) : "") });
}

// ---------- Paint ----------
// Regione Lombardia's livery (Giugiaro, 2019), on every Caravaggio,
// Donizetti and Colleoni and on older units as they're overhauled: white,
// a double arrow in two greens along the side pointing ahead, a blue band
// along the underframe and another at the roof edge, yellow-green doors.
// Trenord's 2011 paint, still on unrebuilt units: white, a dark green
// band low on the side under a gray one, red at the doors' edges.
export const TN = { white: "#f3f4f2", green: "#78be20", light: "#c4e17f", blue: "#006298", door: "#c4d600", roof: "#b3b9c0",
  dark: "#00693c", gray: "#8d969e", red: "#d52b1e", ink: "#22262b", skirt: "#2a2e33" };
// The double arrow on a car, its tip toward the left end (the cab). low,
// top: the band of side it fills; tip: x of the tip.
function arrows(L, low, top, tip = 2) {
  const h = top - low, mid = low + h * 0.5;
  // The light arrow behind, longer; the bright one before it, its tail
  // thinning out along the car.
  return path(poly([[tip + 6, mid], [tip + 14, top], [L + 2, top - h * 0.25], [L + 2, low + h * 0.1], [tip + 14, low]]), TN.light) +
    path(poly([[tip, mid], [tip + 7, top - h * 0.05], [L * 0.62, mid + h * 0.12], [L + 2, mid + h * 0.04], [L + 2, mid - h * 0.12], [L * 0.62, mid - h * 0.14], [tip + 7, low + h * 0.05]]), TN.green);
}
// The Lombardy paint for a section: o: low/top (the arrows' band), skirt (the
// blue band's top), roofY (the roof edge's band), cab (x where the cab ends).
export function lombardy(o) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, TN.white], [o.roofY + 0.55, 3, TN.roof], [o.roofY, 0.55, TN.blue], [0, o.skirt, TN.blue], [0, o.skirt - 0.9, TN.skirt]]);
    s += arrows(L, o.low, o.top, o.cab != null ? o.cab - 3 : -6);
    // The cab front: the bright green swept up round the lower nose.
    if (o.cab != null) s += path(`M-1 ${o.skirt}L${o.cab * 0.55} ${o.skirt}Q${o.cab * 0.75} ${o.low + 0.6} ${o.cab * 0.45} ${o.top + 0.6}L-1 ${o.top + 0.6}Z`, TN.green);
    return s;
  };
}
export function trenord2011(o) {
  return (c, g) => bands(g.L, [[0, 20, TN.white], [o.roofY, 3, TN.roof], [0, o.skirt, TN.skirt], [o.skirt, o.h ?? 1.5, TN.dark], [o.skirt + (o.h ?? 1.5), 0.45, TN.gray]]) +
    (o.cab != null ? path(`M-1 ${o.skirt}L${o.cab} ${o.skirt}Q${o.cab - 1.4} ${o.skirt + 3.2} -1 ${o.skirt + 4.4}Z`, TN.dark) : "");
}
// Trenord's name, lowercase heavy, and a car's class and number.
export const tnName = (c, x, y, h, fill = TN.blue) => letters(c, x, y, h, "trenord", fill, { weight: 800, spacing: "-0.01em" });
const regione = (c, x, y, h) => letters(c, x, y, h, "REGIONE LOMBARDIA", TN.blue, { weight: 600, spacing: "0.08em" });
const plate = (c, x, y, text) => letters(c, x, y, 0.5, text, TN.ink, { weight: 600, spacing: "0.04em" });

// ---------- Caravaggio (Hitachi Rock: ETR 421, ETR 521) ----------
// Double-deck, cars of about 28.3 m (cab) and 26.5 m on their own trucks;
// two double doors a side on the lower deck, beside the trucks; big windows
// on both decks; most of the traction gear on the roof. A long sloped nose
// under a big windshield. 4.3 m tall. Four cars 109.6 m; five 136.8 m.
const ROCK = { roof: 14.9, sill: 3.9, y: 1.55 };
const NOSE_ROCK = [[1.4, 3.9], [1.0, 6.2], ["q", 1.1, 8.2, 3.0, 9.6], [6.6, 13.8], ["q", 7.6, 14.9, 9.6, 14.9]];
const rockPaint = (cab) => lombardy({ low: 2.0, top: 9.6, skirt: 1.55, roofY: 13.9, cab: cab ? 12 : null });
function rockCab(c) {
  const L = c.L, a = 18.0, b = L - 13.4;
  return deck(c, { ...ROCK, a, b, nose: NOSE_ROCK, rake: [[3.0, 9.6], [6.6, 13.8]], depth: 3.2, cabLen: 10, lampY: 5.6, trucks: [9.6, L - 8.0],
    doors: [{ x: a + 0.6, w: 4.4, low: true }, { x: b - 5.0, w: 4.4, low: true }], ends: [b + 4.0], paint: rockPaint(true), doorFill: () => TN.door,
    surround: TN.ink,
    extra: (cc, g) => cover(14, ROCK.roof, 14) + hvac(34, ROCK.roof, 12) + hvac(g.L - 22, ROCK.roof, 10) + boxes(a + 6, b - 6, ROCK.y + 0.05, 2, 0.4) +
      tnName(cc, 40, 9.05, 0.95) + regione(cc, 62, 9.05, 0.42) + plate(cc, g.L - 6.4, 6.2, cc.count === 5 ? "ETR 521" : "ETR 421") +
      (mxp(cc) ? classDoors(cc, [{ x: a + 0.6, w: 4.4 }, { x: b - 5.0, w: 4.4 }], ROCK.y + 0.15, false) : "") });
}
// An aircraft pictogram (Trenord's airport-area marking), h ft long,
// nose to the right.
const plane = (c, x, y, h, fill) => `<g transform="translate(${x} ${y}) scale(${c.mirrored ? -h : h} ${h})">` +
  `<path d="M-0.5 -0.04L0.36 -0.04Q0.5 -0.04 0.5 0Q0.5 0.04 0.36 0.04L-0.5 0.04Z" fill="${fill}"/>` +
  `<path d="M0.08 0.03L-0.12 0.42L-0.02 0.42L0.24 0.03ZM0.08 -0.03L-0.12 -0.42L-0.02 -0.42L0.24 -0.03Z" fill="${fill}"/>` +
  `<path d="M-0.36 0.03L-0.48 0.18L-0.42 0.18L-0.28 0.03ZM-0.36 -0.03L-0.48 -0.18L-0.42 -0.18L-0.28 -0.03Z" fill="${fill}"/></g>`;
const AIR_YELLOW = "#f5c400";
// Class marks as the airport Caravaggios carry them (photographed on ETR
// 421 047, 2026): the class numeral, thin and white, small on the body
// left of each door near its top, about a seventh of the door tall;
// Trenord's yellow band and aircraft pictograms mark the first-class area
// (airMark, below). Trainsheet adds its own class band, gold the length of the
// first-class car over its upper windows, as on Italy's other railroads'
// cars. Only the airport units have two classes; the other Trenord trains
// drawn here are one class and carry none of it.
const CLASS_GOLD = "#c9a227";
const mxp = (c) => /^RE5[14]$/.test(String(c.route || "").replace(/[\s_]/g, "").toUpperCase());
const TN_FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";
function classDoors(c, doors, y, first) {
  return doors.map(({ x, w }) => letters(c, c.mirrored ? x + w + 0.6 : x - 0.6, y + 6.2, 1.5, first ? "1" : "2", "#ffffff", { weight: 300, family: TN_FONT })).join("");
}
// The airport Caravaggios' (ETR 421 047-054) first-class area: marked
// outside with a yellow band and aircraft pictograms by the doors.
function airMark(c, L, a, b) {
  return rect(a + 5.2, 9.85, b - a - 10.4, 0.4, AIR_YELLOW) + rect(-1, 9.85, a - 3.2, 0.4, AIR_YELLOW) + rect(b + 3.2, 9.85, L - b - 2.2, 0.4, AIR_YELLOW) +
    [a - 1.6, b + 1.6].map((x) => rect(x - 1.0, 8.2, 2.0, 1.4, AIR_YELLOW, 0, 'rx="0.2"') + plane(c, x, 8.9, 1.5, TN.ink)).join("");
}
function rockMid(c) {
  const L = c.L, a = 13.6, b = L - 13.6, pan = c.index === 1 || (c.count === 5 && c.index === 3);
  return deck(c, { ...ROCK, a, b, trucks: [8.0, L - 8.0], doors: [{ x: a + 0.6, w: 4.4, low: true }, { x: b - 5.0, w: 4.4, low: true }], ends: [3.4, b + 4.4],
    paint: (cc, g) => rockPaint(false)(cc, g) + (cc.air ? rect(-1, 13.3, g.L + 2, 0.55, CLASS_GOLD) : ""), doorFill: () => TN.door,
    extra: (cc, g) => (cc.air || mxp(cc) ? classDoors(cc, [{ x: a + 0.6, w: 4.4 }, { x: b - 5.0, w: 4.4 }], ROCK.y + 0.15, !!cc.air) : "") + (pan ? pantograph(g.L / 2 - 8, ROCK.roof + 0.55, { up: true, facing: -1 }) + cover(g.L / 2 - 11, ROCK.roof, 7, 0.55) + hvLine(g.L / 2 - 5, g.L / 2 + 4, ROCK.roof + 0.55) + cover(g.L / 2 + 4, ROCK.roof, 12)
      : hvac(15, ROCK.roof, 12) + cover(g.L / 2 + 2, ROCK.roof, 14)) + boxes(a + 6, b - 6, ROCK.y + 0.05, 2, 0.4) +
      (cc.air ? airMark(cc, g.L, a, b) + letters(cc, g.L / 2, 7.6 + 1.3, 0.7, "Malpensa Express", TN.blue, { weight: 600, style: "italic" })
        : cc.index === 1 ? letters(cc, g.L / 2, 8.95, 0.7, "Caravaggio", TN.blue, { weight: 600, style: "italic" }) : "") });
}

// ---------- Donizetti (Alstom Coradia Stream: ETR 103, 104, 204) ----------
// Single-deck cars on their own trucks, about 22.4 m (cab) and 19.7 m;
// two double doors a side in each car, a step-free floor at the doors;
// big windows; a rounded nose under a windshield wrapping down. Three cars
// 65.7 m, four 84.2 m.
const POP = { roof: 13.6, sill: 3.5 };
const NOSE_POP = [[1.3, 3.5], [1.0, 5.6], ["q", 1.0, 7.4, 2.4, 8.6], [5.0, 12.6], ["q", 5.9, 13.6, 7.6, 13.6]];
const popPaint = (cab) => lombardy({ low: 3.9, top: 6.4, skirt: 3.5, roofY: 12.6, cab: cab ? 10 : null });
const popWin = { y: 6.6, w: 5.4, h: 4.0, pitch: 6.2 };
function popCab(c) {
  const L = c.L;
  return single(c, { ...POP, nose: NOSE_POP, rake: [[2.4, 8.6], [5.0, 12.6]], depth: 3.0, cabLen: 9, lampY: 5.2, doors: [17.6, L - 21.0], doorY: 2.9,
    win: popWin, trucks: [9.2, L - 7.6], paint: popPaint(true), doorFill: () => TN.door, surround: TN.ink, pan: c.index === 0 && c.count > 3 ? null : null,
    extra: (cc, g) => hvac(14, POP.roof, 11) + cover(g.L - 22, POP.roof, 12) + boxes(24, g.L - 23, POP.sill, 2, 1.1) +
      tnName(cc, 38, 12.0, 0.85) + plate(cc, g.L - 4.6, 5.0, cc.count === 3 ? "ETR 103" : "ETR 104") });
}
function popMid(c) {
  const L = c.L, pan = c.index === 1;
  return single(c, { ...POP, doors: [10.2, L - 14.5], doorY: 2.9, win: popWin, trucks: [7.4, L - 7.4], paint: popPaint(false), doorFill: () => TN.door,
    pan: pan ? L / 2 - 6 : null,
    extra: (cc, g) => (pan ? cover(g.L / 2 + 5, POP.roof, 9) : hvac(18, POP.roof, 11) + cover(g.L - 20, POP.roof, 10)) + boxes(17, g.L - 17, POP.sill, 2, 1.0) +
      (cc.index === 1 ? letters(cc, g.L / 2, 12.0, 0.7, "Donizetti", TN.blue, { weight: 600, style: "italic" }) : "") });
}

// ---------- Colleoni (Stadler FLIRT, ATR 803) ----------
// Diesel-electric with batteries: three passenger cars with a short power
// module between the first two, 66.8 m, on Jakobs trucks; one double door
// a side in each car. A FLIRT nose.
const FL = { roof: 13.7, sill: 3.0 };
const NOSE_FLIRT = [[1.0, 3.0], [1.0, 5.8], ["q", 1.1, 7.0, 2.0, 8.0], [5.4, 12.7], ["q", 6.2, 13.7, 8.0, 13.7]];
const flPaint = (cab) => lombardy({ low: 3.3, top: 6.0, skirt: 3.0, roofY: 12.8, cab: cab ? 9 : null });
const flWin = { y: 6.4, w: 4.6, h: 3.7, pitch: 5.3 };
function colleoniCab(c) {
  const L = c.L;
  return single(c, { ...FL, nose: NOSE_FLIRT, rake: [[2.0, 8.0], [5.4, 12.7]], depth: 3.0, cabLen: 9, lampY: 4.9, doors: [L - 26.0], doorY: 2.9,
    win: flWin, trucks: [8.6, "end"], wheel: 30, paint: flPaint(true), doorFill: () => TN.door, surround: TN.ink,
    extra: (cc, g) => hvac(16, FL.roof, 10) + hvac(g.L - 18, FL.roof, 9) + boxes(20, g.L - 28, FL.sill, 2, 1.0) + rect(g.L - 18, 1.6, 10, 1.3, "currentColor", 0, 'opacity="0.7" rx="0.2"') +
      tnName(cc, 34, 11.75, 0.8) + plate(cc, g.L - 6, 4.6, "ATR 803") });
}
function colleoniMid(c) {
  const L = c.L;
  return single(c, { ...FL, doors: [L / 2 - 2.15], doorY: 2.9, win: flWin, trucks: ["start", "end"], wheel: 30, paint: flPaint(false), doorFill: () => TN.door,
    extra: (cc, g) => hvac(6, FL.roof, 9) + hvac(g.L - 15, FL.roof, 9) + boxes(8, g.L / 2 - 5, FL.sill, 1, 0.9) + boxes(g.L / 2 + 5, g.L - 8, FL.sill, 1, 0.9) +
      letters(cc, g.L / 2, 11.75, 0.65, "Colleoni", TN.blue, { weight: 600, style: "italic" }) });
}
// A diesel power module between two passenger sections (Stadler's GTW and
// FLIRT DMUs): a short, tall box over its own truck, a corridor through it;
// louvers either side of the corridor door, radiators and the exhaust on
// the roof, fuel tanks under it. o: roof, sill, d (wheel), paint(L).
export function powerModule(c, { roof = 13.4, sill = 3.4, d = 33, paint }) {
  const L = c.L;
  return bilevel({ ...c, cabL: false, cabR: false }, {
    roof, sill, cornerR: 0.6, end: 0.4, noTrucks: true, badge: false, rows: [], doors: [], diaphragm: [sill + 0.2, roof - 1.2],
    paint: () => paint(L),
    extra: () => {
      let s = truck(L / 2, { wb: 7.2, d, kind: "loco", top: sill });
      for (const x of [1.3, L - 5.7]) s += rect(x, sill + 2.4, 4.4, roof - sill - 4.6, "rgba(20,22,25,0.55)", 0.4, 'rx="0.15"') + slats(x, sill + 2.4, 4.4, roof - sill - 4.6, 0.35, "rgba(255,255,255,0.18)");
      s += rect(L / 2 - 1.6, sill + 1.0, 3.2, roof - sill - 2.6, "rgba(0,0,0,0.06)", 0.5) + rect(L / 2 - 0.9, roof - 5.0, 1.8, 2.1, C.glass, 0, 'rx="0.2"');
      s += rect(1.0, roof - 0.05, L - 2.0, 0.7, C.steelDark, 0.4, 'rx="0.25"') + slats(1.6, roof + 0.1, L - 3.2, 0.45, 0.45, "rgba(0,0,0,0.25)");
      return s + exhaust(L / 2 - 1.2, roof + 0.6) + tank(1.1, L / 2 - 3.8, sill, sill - 1.8) + tank(L / 2 + 3.8, L - 1.1, sill, sill - 1.8);
    },
  });
}
const flirtPack = (c) => powerModule(c, { roof: 14.0, sill: 3.0, d: 30,
  paint: (L) => bands(L, [[0, 20, TN.white], [12.8, 0.55, TN.blue], [13.35, 3, TN.roof], [0, 3.0, TN.blue], [0, 2.1, TN.skirt], [3.3, 2.7, TN.green]]) });

// ---------- TSR (Treno Servizio Regionale: ALe 711, ALe 710) ----------
// Double-deck, every car powered; cab cars 26.46 m, intermediates 26.03 m,
// three to six cars. Two double doors a side on the lower deck beside the
// trucks, all alike. A blunt rounded front, the windshield in a black
// mask. Overhauled units since 2024 in the Lombardy paint (drawn here),
// the rest in Trenord's 2011 white and dark green.
const TSR = { roof: 14.6, sill: 3.9, y: 1.6 };
const NOSE_TSR = [[1.3, 3.9], [1.1, 7.0], ["q", 1.2, 8.6, 2.4, 9.8], [4.2, 13.6], ["q", 4.9, 14.6, 6.8, 14.6]];
const tsrPaint = (cab) => lombardy({ low: 2.1, top: 9.4, skirt: 1.6, roofY: 13.6, cab: cab ? 9.5 : null });
function tsrCab(c) {
  const L = c.L, a = 15.4, b = L - 13.6;
  return deck(c, { ...TSR, a, b, nose: NOSE_TSR, rake: [[2.4, 9.8], [4.2, 13.6]], depth: 2.8, cabLen: 7.5, lampY: 6.0, trucks: [8.6, L - 8.0],
    doors: [{ x: a + 0.5, w: 4.4, low: true }, { x: b - 4.9, w: 4.4, low: true }], ends: [b + 4.2], paint: tsrPaint(true), doorFill: () => TN.door,
    surround: TN.ink, winW: 4.6, pitch: 5.5, pan: 30,
    extra: (cc, g) => hvac(10, TSR.roof, 9) + hvac(g.L - 21, TSR.roof, 11) + boxes(a + 6, b - 6, TSR.y + 0.05, 2, 0.4) +
      tnName(cc, 50, 9.15, 0.95) + plate(cc, g.L - 6.4, 6.3, "ALe 711") });
}
function tsrMid(c) {
  const L = c.L, a = 13.6, b = L - 13.6;
  return deck(c, { ...TSR, a, b, doors: [{ x: a + 0.5, w: 4.4, low: true }, { x: b - 4.9, w: 4.4, low: true }], ends: [3.4, b + 4.4],
    paint: tsrPaint(false), doorFill: () => TN.door, winW: 4.6, pitch: 5.5, pan: c.index % 2 ? 22 : null,
    extra: (cc, g) => (c.index % 2 ? "" : hvac(12, TSR.roof, 11)) + hvac(g.L - 23, TSR.roof, 11) + boxes(a + 6, b - 6, TSR.y + 0.05, 2, 0.4) + plate(cc, 6.4, 6.3, "ALe 710") });
}

// ---------- TAF (Treno Alta Frequentazione) ----------
// Four double-deck cars, about 105 m: a motor car with a cab at each end
// (ALe 506, ALe 426), two trailers (Le 736) between. Pininfarina's rounded
// nose with a big curved windshield over the lower deck; the doors at the
// end level over the trucks, narrower on the cab cars. Drawn in Trenord's
// 2011 white with dark green and gray, as most still are.
const TAF = { roof: 14.5, sill: 3.9, y: 1.7 };
const NOSE_TAF = [[1.4, 3.9], [1.0, 6.4], ["q", 1.0, 9.0, 3.2, 11.0], [6.0, 13.8], ["q", 7.0, 14.5, 9.0, 14.5]];
const tafPaint = (cab) => trenord2011({ skirt: 1.7, h: 1.6, roofY: 13.5, cab: cab ? 9.0 : null });
function tafCab(c) {
  const L = c.L, a = 16.0, b = L - 15.0;
  return deck(c, { ...TAF, a, b, nose: NOSE_TAF, rake: [[3.2, 11.0], [6.0, 13.8]], depth: 3.4, cabLen: 9, lampY: 6.2, trucks: [9.8, L - 8.0],
    doors: [{ x: 11.4, w: 3.0 }, { x: L - 6.2, w: 3.0 }], ends: [], paint: tafPaint(true), doorFill: () => TN.dark, surround: TN.ink, winW: 4.8, pitch: 5.6,
    pan: 38, extra: (cc, g) => hvac(16, TAF.roof, 10) + hvac(g.L - 22, TAF.roof, 11) + boxes(a + 4, b - 4, TAF.y + 0.05, 3, 0.4) +
      rect(10.9, 3.9, 0.4, 7.2, TN.red) + tnName(cc, 30, 9.25, 0.95, TN.dark) + plate(cc, 58, 9.25, cc.mirrored ? "ALe 426" : "ALe 506") });
}
function tafMid(c) {
  const L = c.L, a = 14.0, b = L - 14.0;
  return deck(c, { ...TAF, a, b, doors: [{ x: 3.2, w: 4.0 }, { x: L - 7.2, w: 4.0 }], ends: [8.6, L - 12.6], paint: tafPaint(false), doorFill: () => TN.dark,
    winW: 4.8, pitch: 5.6,
    extra: (cc, g) => hvac(14, TAF.roof, 10) + hvac(g.L - 24, TAF.roof, 10) + boxes(a + 4, b - 4, TAF.y + 0.05, 3, 0.4) + rect(2.7, 3.9, 0.4, 7.2, TN.red) +
      plate(cc, g.L / 2, 9.25, "Le 736") });
}

// ---------- Coradia Meridian (ETR 425, ETR 526, ETR 245) ----------
// Alstom's articulated regional unit: five (82.2 m) or six (92.9 m)
// sections on Jakobs trucks, cab sections of about 19.3 m, the
// intermediates 14.5 m; one double door a side in each section, a low
// floor at the doors; a rounded nose under a deep windshield.
const JAZZ = { roof: 13.9, sill: 3.4 };
const NOSE_JAZZ = [[1.3, 3.4], [1.0, 5.6], ["q", 1.1, 7.4, 2.6, 8.8], [5.4, 12.9], ["q", 6.3, 13.9, 8.2, 13.9]];
const jazzPaint = (cab) => lombardy({ low: 3.8, top: 6.6, skirt: 3.4, roofY: 12.9, cab: cab ? 10 : null });
const jazzWin = { y: 6.9, w: 4.8, h: 3.7, pitch: 5.6 };
function jazzCab(c) {
  const L = c.L;
  return single(c, { ...JAZZ, nose: NOSE_JAZZ, rake: [[2.6, 8.8], [5.4, 12.9]], depth: 3.0, cabLen: 9, lampY: 5.3, doors: [L - 22.6], doorY: 2.2,
    win: jazzWin, trucks: [9.0, "end"], wheel: 30, paint: jazzPaint(true), doorFill: () => TN.door, surround: TN.ink,
    extra: (cc, g) => hvac(14, JAZZ.roof, 11) + cover(g.L - 16, JAZZ.roof, 10) + boxes(18, g.L - 24, JAZZ.sill, 2, 1.0) +
      tnName(cc, 33, 12.25, 0.8) + plate(cc, g.L - 8, 5.0, cc.count === 6 ? "ETR 526" : cc.route && /^RE5[14]$/.test(cc.route) ? "ETR 245" : "ETR 425") });
}
function jazzMid(c) {
  const L = c.L, pan = c.index === 2;
  return single(c, { ...JAZZ, doors: [L / 2 - 2.15], doorY: 2.2, win: jazzWin, trucks: ["start", "end"], wheel: 30, paint: jazzPaint(false), doorFill: () => TN.door,
    pan: pan ? 4 : null,
    extra: (cc, g) => (pan ? cover(g.L - 14, JAZZ.roof, 11) : hvac(5, JAZZ.roof, 10) + hvac(g.L - 15, JAZZ.roof, 10)) + boxes(6, g.L / 2 - 4, JAZZ.sill, 1, 0.8) +
      boxes(g.L / 2 + 4, g.L - 6, JAZZ.sill, 1, 0.8) });
}

// ---------- Stadler GTW (ATR 115, ATR 125) ----------
// Two passenger sections of 17.9 m, each on a truck under its cab and hung
// at its inner end from a short power module holding the diesel; ATR 125s
// are two of these coupled for good. A raked nose, one wide double door a
// side. In the Lombardy paint since the overhauls.
const GTW = { roof: 12.8, sill: 2.4 };
const NOSE_GTW = [[1.0, 2.4], [1.0, 5.6], ["q", 1.1, 6.8, 1.8, 7.8], [3.6, 11.9], ["q", 4.2, 12.8, 5.6, 12.8]];
const gtwPaint = lombardy({ low: 2.8, top: 5.3, skirt: 2.4, roofY: 11.85, cab: 7 });
function gtwCar(c) {
  return unit(c, { roof: GTW.roof, sill: GTW.sill, nose: NOSE_GTW, rake: [[1.8, 7.8], [3.6, 11.9]], depth: 2.4, cabLen: 6, lampY: 4.2,
    rows: [{ xs: [11.6, 16.8, 30.2, 35.9, 41.5, 47.2, 52.8], y: 5.6, w: 4.3, h: 3.8, r: 0.45 }],
    doors: [{ x: 23.0, w: 5.2, y0: 2.1, y1: 9.6, leaves: 2, glassY: 0.3, glassH: 0.55, fill: TN.door }], diaphragm: [2.6, 11.2], paint: gtwPaint, surround: TN.ink,
    extra: (cc) => truck(9.2, { wb: 6.9, d: 30, top: 2.4 }) + step(23.0, 5.2, 2.1) + hvac(19, GTW.roof, 9) + hvac(38, GTW.roof, 7) + boxes(30, 50, 2.4, 2, 0.6) +
      tnName(cc, 41, 10.5, 0.75) + plate(cc, 50, 4.4, cc.count > 3 ? "ATR 125" : "ATR 115") });
}
const gtwPack = (c) => powerModule(c, { roof: 13.4, sill: 3.4,
  paint: (L) => bands(L, [[0, 20, TN.white], [11.85, 0.55, TN.blue], [12.4, 3, TN.roof], [0, 3.4, TN.blue], [0, 2.4, TN.skirt], [3.7, 1.6, TN.green]]) });

// ---------- E.464 and Vivalto ----------
// Bombardier's E.464: a single-cab Bo'Bo' of 15.75 m for push-pull trains,
// the cab at one end, a narrow service end with a small window at the
// other; louvers along the machine room. Vivalto: double-deck coaches of
// 26.7 m, the doors at the end level over the trucks, two a side; and the
// driving trailer, its cab at the far end. Trenord's in its white and green.
const NOSE_464 = [[1.4, 4.1], [1.2, 7.0], ["q", 1.3, 8.4, 2.2, 9.4], [3.4, 12.4], ["q", 3.8, 13.0, 5.0, 13.0]];
function e464(c) {
  const L = c.L, roof = 13.0, sill = 4.1;
  return bilevel({ ...c, cabL: true }, {
    roof, sill, cornerR: 0.8, end: 0.6, noTrucks: true, badge: false, nose: NOSE_464, cabLen: 0, diaphragm: [4.3, 11.8],
    paint: () => bands(L, [[0, 20, TN.white], [12.0, 3, TN.roof], [0, 5.4, TN.skirt], [5.4, 1.5, TN.dark], [6.9, 0.4, TN.gray]]) + path("M-1 5.4L-1 9.6Q1.6 9.6 2.6 8.6L4.8 5.4Z", TN.dark),
    doors: [{ x: 6.0, w: 1.9, y0: sill + 0.5, y1: roof - 1.7, glassY: 0.62, glassH: 0.25, grabs: true }],
    rows: [{ xs: [L - 3.6], y: 8.6, w: 1.6, h: 1.8, r: 0.3 }],
    cab: () => screen(c, [2.2, 9.4], [3.4, 12.4], 2.0, TN.ink),
    extra: () => {
      let s = "";
      for (const x of [10.0, 21.0, 32.0]) s += rect(x, 7.9, 9.0, 2.8, "rgba(20,22,25,0.42)", 0.4) + slats(x, 7.9, 9.0, 2.8, 0.32, "rgba(255,255,255,0.18)");
      s += truck(13.0, { wb: 8.5, d: 41, kind: "loco", top: sill }) + truck(L - 11.5, { wb: 8.5, d: 41, kind: "loco", top: sill });
      s += underframe(19.0, L - 18.0, sill, { depth: 1.6, boxes: 1, tanks: true });
      s += pantograph(L * 0.62, roof + 0.4, { up: true, facing: -1 }) + rect(L * 0.3, roof - 0.05, 12, 0.5, C.steelDark, 0.4, 'rx="0.2"') + hvLine(L * 0.62 - 9.5, L * 0.62 - 3.0, roof + 0.4);
      s += buffers(0, -1, { sill, end: 1.6 }) + buffers(L, 1, { sill });
      s += path(poly([[1.8, 2.6], [5.8, 2.6], [5.2, 0.6], [2.6, 0.55], [1.9, 1.5]]), C.black, 0, 'opacity="0.92"');
      s += rect(1.1, 5.6, 0.5, 0.45, "#fff4cf", 0.35, 'rx="0.15"') + rect(3.2, 12.5, 0.5, 0.35, "#fff4cf", 0.35, 'rx="0.15"') + rect(1.2, 4.95, 0.4, 0.32, "#d8262c", 0.3, 'rx="0.1"');
      return s + tnName(c, L / 2, 6.15, 0.75, "#ffffff") + letters(c, L - 9, 11.1, 0.55, "E.464", TN.ink, { weight: 600 });
    },
  });
}
const VIV = { roof: 14.9, sill: 3.9, y: 1.6 };
const vivPaint = (cab) => trenord2011({ skirt: 1.6, h: 1.7, roofY: 13.9, cab: cab ? 9 : null });
function vivalto(c) {
  const L = c.L, a = 14.6, b = L - 14.6;
  return deck(c, { ...VIV, a, b, doors: [{ x: 3.0, w: 3.6 }, { x: L - 6.6, w: 3.6 }], ends: [7.6, L - 11.6], paint: vivPaint(false), doorFill: () => TN.dark,
    winW: 4.9, pitch: 5.7, coupler: "buffers",
    extra: (cc, g) => hvac(14, VIV.roof, 10) + hvac(g.L - 24, VIV.roof, 10) + boxes(a + 4, b - 4, VIV.y + 0.05, 3, 0.4) + buffers(0, -1, { sill: VIV.sill }) + buffers(g.L, 1, { sill: VIV.sill }) +
      letters(cc, g.L / 2, 9.35, 0.55, "Vivalto", TN.dark, { weight: 600, style: "italic" }) });
}
const NOSE_VIV = [[1.4, 3.9], [1.1, 7.0], ["q", 1.2, 9.0, 2.8, 10.4], [5.0, 13.8], ["q", 5.8, 14.9, 7.6, 14.9]];
function vivaltoCab(c) {
  const L = c.L, a = 16.4, b = L - 14.6;
  return deck(c, { ...VIV, a, b, nose: NOSE_VIV, rake: [[2.8, 10.4], [5.0, 13.8]], depth: 3.0, cabLen: 8, lampY: 6.0, doors: [{ x: 10.2, w: 3.4 }, { x: L - 6.6, w: 3.6 }],
    ends: [L - 11.6], paint: vivPaint(true), doorFill: () => TN.dark, surround: TN.ink, winW: 4.9, pitch: 5.7, coupler: "buffers", trucks: [9.0, L - 8.0],
    extra: (cc, g) => hvac(16, VIV.roof, 10) + hvac(g.L - 24, VIV.roof, 10) + boxes(a + 4, b - 4, VIV.y + 0.05, 3, 0.4) + buffers(g.L, 1, { sill: VIV.sill }) +
      tnName(cc, 46, 9.35, 0.9, TN.dark) });
}

// ---------- Tables ----------

export const TYPES = {
  tnRockCab: { name: "Caravaggio end car", kind: "bilevel", emu: true },
  tnRockMid: { name: "Caravaggio intermediate car", kind: "bilevel", emu: true, pan: true },
  tnRockAir: { name: "Caravaggio airport car, first class", kind: "bilevel", emu: true, pan: true, amenities: ["first"] },
  tnPopCab: { name: "Donizetti end car", kind: "emu" },
  tnPopMid: { name: "Donizetti intermediate car", kind: "emu", pan: true },
  tnColleoniCab: { name: "Colleoni end car", kind: "emu" },
  tnColleoniMid: { name: "Colleoni middle car", kind: "emu" },
  tnFlirtPack: { name: "Colleoni power module", kind: "module" },
  tnTsrCab: { name: "TSR cab car (ALe 711)", kind: "bilevel", emu: true, pan: true },
  tnTsrMid: { name: "TSR intermediate car (ALe 710)", kind: "bilevel", emu: true, pan: true },
  tnTafCab: { name: "TAF motor car", kind: "bilevel", emu: true, pan: true },
  tnTafMid: { name: "TAF trailer (Le 736)", kind: "bilevel", emu: true },
  tnJazzCab: { name: "Coradia Meridian end section", kind: "emu" },
  tnJazzMid: { name: "Coradia Meridian intermediate section", kind: "emu", pan: true },
  tnGtwCar: { name: "Stadler GTW passenger section", kind: "emu" },
  tnGtwPack: { name: "Stadler GTW power module", kind: "module" },
  tn464: { name: "E.464 electric locomotive", kind: "electric", pan: true },
  tnVivalto: { name: "Vivalto double-deck coach", kind: "bilevel" },
  tnVivaltoCab: { name: "Vivalto driving trailer", kind: "bilevel", cab: true },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
export const MODELS = {
  tnRockCab: M(rockCab, 92.8, true, (ctx) => `${ctx.count}${ctx.route}`),
  tnRockMid: M(rockMid, 87.0, false, (ctx) => `${ctx.index}${ctx.count}${ctx.route}`),
  tnRockAir: M((c) => rockMid({ ...c, air: true }), 87.0),
  tnPopCab: M(popCab, 73.5, true, (ctx) => ctx.count),
  tnPopMid: M(popMid, 64.6, false, byIndex),
  tnColleoniCab: M(colleoniCab, 70.2, true),
  tnColleoniMid: M(colleoniMid, 57.1),
  tnFlirtPack: M(flirtPack, 21.7),
  tnTsrCab: M(tsrCab, 86.8, true),
  tnTsrMid: M(tsrMid, 85.4, false, byIndex),
  tnTafCab: M(tafCab, 86.6, true),
  tnTafMid: M(tafMid, 85.6),
  tnJazzCab: M(jazzCab, 63.3, true, (ctx) => `${ctx.count}${ctx.route}`),
  tnJazzMid: M(jazzMid, 47.6, false, byIndex),
  tnGtwCar: M(gtwCar, 58.85, true, (ctx) => ctx.count),
  tnGtwPack: M(gtwPack, 16.4),
  tn464: M(e464, 51.7, true),
  tnVivalto: M(vivalto, 87.6),
  tnVivaltoCab: M(vivaltoCab, 87.6, true),
};

// Units by number, where Trenord's numbering is known: the Meridians
// repainted for the airport (ETR 245 001-014), the GTW 2/6s (ATR 115
// 001-008). The Caravaggios, Donizettis and others are counted, but their
// number ranges aren't published as such.
export const FLEETS = {
  trenord: [[245001, 245014, "tnJazzCab"], [115001, 115008, "tnGtwCar"]],
};

const set = (label, ...units) => ({ label, units });
const ROCK4 = set("Caravaggio (ETR 421): a four-car double-deck electric unit", ["tnRockCab", 1], ["tnRockMid", 2], ["tnRockCab", 1]);
const ROCK5 = set("Caravaggio (ETR 521): a five-car double-deck electric unit", ["tnRockCab", 1], ["tnRockMid", 3], ["tnRockCab", 1]);
// Which car holds the airport units' first-class area isn't published;
// it's drawn in the second car.
const ROCK_MXP = set("Malpensa Express: an airport Caravaggio (ETR 421), four double-deck cars, a first-class area in the second", ["tnRockCab", 1], ["tnRockAir", 1], ["tnRockMid", 1], ["tnRockCab", 1]);
const POP4 = set("Donizetti (ETR 104): a four-car electric unit", ["tnPopCab", 1], ["tnPopMid", 2], ["tnPopCab", 1]);
const POP3 = set("Donizetti (ETR 103): a three-car electric unit", ["tnPopCab", 1], ["tnPopMid", 1], ["tnPopCab", 1]);
const COLLEONI = set("Colleoni (ATR 803): a three-car diesel-battery unit", ["tnColleoniCab", 1], ["tnFlirtPack", 1], ["tnColleoniMid", 1], ["tnColleoniCab", 1]);
const TSR5 = set("TSR: a five-car double-deck electric unit", ["tnTsrCab", 1], ["tnTsrMid", 3], ["tnTsrCab", 1]);
const TSR3 = set("TSR: a three-car double-deck electric unit", ["tnTsrCab", 1], ["tnTsrMid", 1], ["tnTsrCab", 1]);
const TAF4 = set("TAF: a four-car double-deck electric unit", ["tnTafCab", 1], ["tnTafMid", 2], ["tnTafCab", 1]);
const JAZZ5 = set("Coradia Meridian (ETR 425): a five-section electric unit", ["tnJazzCab", 1], ["tnJazzMid", 3], ["tnJazzCab", 1]);
const JAZZ6 = set("Coradia Meridian (ETR 526): a six-section electric unit", ["tnJazzCab", 1], ["tnJazzMid", 4], ["tnJazzCab", 1]);
const GTW1 = set("Stadler GTW (ATR 115): a two-section diesel railcar", ["tnGtwCar", 1], ["tnGtwPack", 1], ["tnGtwCar", 1]);
const GTW2 = set("Stadler GTW (ATR 125): two GTW 2/6 coupled for good", ["tnGtwCar", 1], ["tnGtwPack", 1], ["tnGtwCar", 2], ["tnGtwPack", 1], ["tnGtwCar", 1]);
const VIVALTO = set("An E.464 locomotive and Vivalto double-deck coaches", ["tn464", 1], ["tnVivalto", 4], ["tnVivaltoCab", 1]);
const BY_MODEL = { tnJazzCab: JAZZ5, tnGtwCar: GTW1, tnRockAir: ROCK_MXP };

// What usually runs, by Trenord's line (its GTFS names them S1-S50, RE1-
// RE80, R1-R41). The airport lines (RE51 Gallarate-Malpensa-Centrale and
// RE54 Cadorna-Malpensa, the Malpensa Express) run airport Caravaggios
// since 2025. The Passante's S lines are TSR country, S9 the TAFs'; the
// main RE lines and S11 Caravaggios; the Valtellina's RE8 and the Sondrio
// branches Coradia Meridians; the diesel lines GTWs (S7 and Como-Lecco
// R18, Brescia-Iseo-Edolo) or Colleonis (Pavia-Alessandria and the other
// southern branches since 2023); the other R lines mostly Donizettis.
// Lines vary with the day's workings; the labels say "usually". The
// Swiss TILO lines (S10, S30, S40, S50, RE80) run TILO's own FLIRTs, not
// drawn here.
const TSR_LINES = new Set(["S1", "S2", "S5", "S6", "S12", "S13", "S3", "S4"]);
const ROCK5_LINES = new Set(["RE1", "RE2", "RE5", "RE6", "RE7", "RE13", "S11", "R4", "R14", "R22", "R17", "R27"]);
const DIESEL_GTW = new Set(["S7", "R18", "R3", "RE3", "S31", "R9"]);
const DIESEL_FLIRT = new Set(["R35", "R36", "R37", "R40", "R8", "R25", "RE11"]);
const JAZZ_LINES = new Set(["RE8", "R11", "R12", "R13"]);
const TILO = new Set(["S10", "S30", "S40", "S50", "RE80"]);
export const TYPICAL = {
  trenord: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    const r = String(t.route || "").replace(/[\s_]/g, "").toUpperCase();
    if (TILO.has(r)) return null;
    if (r === "RE51" || r === "RE54" || r.startsWith("MXP")) return ROCK_MXP;
    if (r === "S9" || r === "S19") return TAF4;
    if (TSR_LINES.has(r)) return /^S(3|4|12)$/.test(r) ? TSR3 : TSR5;
    if (DIESEL_GTW.has(r)) return r === "S7" ? GTW2 : GTW1;
    if (DIESEL_FLIRT.has(r)) return COLLEONI;
    if (r === "RE8") return JAZZ6;
    if (JAZZ_LINES.has(r)) return JAZZ5;
    if (r === "RE4" || r === "R23") return VIVALTO;
    if (ROCK5_LINES.has(r)) return ROCK5;
    if (/^S\d/.test(r)) return ROCK4;
    if (/^R\d/.test(r)) return POP4;
    return r ? POP3 : null;
  },
};

const WP = "https://en.wikipedia.org/wiki/";
const ITW = "https://it.wikipedia.org/wiki/";
const FNM = "https://www.fnmgroup.it/wp-content/uploads/2025/12/Trenord_251212_CS_214treni_def.pdf";
const rock = { model: "Hitachi Caravaggio (ETR 421, ETR 521)", type: "Double-deck electric multiple unit", builder: "Hitachi Rail Italy", built: "Since 2018",
  fleet: "123 in service (ETR 421 and 521), 13 more coming in 2026", topSpeedMph: 99.4, powerHp: 4559, source: FNM };
const pop = { model: "Alstom Donizetti (Coradia Stream; ETR 103, 104, 204)", type: "Electric multiple unit", builder: "Alstom (Savigliano)", built: "Since 2019",
  fleet: "61", topSpeedMph: 99.4, source: FNM };
export const FACTS = {
  tnRockCab: { ...rock, seats: 440, lengthFt: 359.6,
    about: "Trenord's double-deck workhorse, Hitachi's Rock in Lombardy's white, greens and blue: four cars seat 440, five 570, one class throughout on the regular units. Since 2025 airport versions with first class run the Malpensa Express." },
  tnRockMid: { ...rock, seats: 570,
    about: "Most of a Caravaggio's traction gear rides on the roof, which leaves room for big windows on both decks and step-free doors to the lower one. The regular units are one class throughout (563 seats in five cars); only two of the early ones and the airport series have first class." },
  tnRockAir: { ...rock, fleet: "Airport series ETR 421 047–054 and more, 26 ordered", source: "https://www.trenord.it/news/il-bello-di-trenord/articoli/trenord-vola-con-i-nuovi-caravaggio-aeroportuali",
    about: "The airport Caravaggios, on the Malpensa Express since March 2025, have first class, luggage racks and black seats in an area marked outside by a yellow band and aircraft pictograms. Since January 2026 second-class tickets are valid on RE54 for some stops, in the area marked for them; the car holding first class isn't published (drawn here in the second)." },
  tnPopCab: { ...pop, seats: 220, lengthFt: 215.6,
    about: "The single-deck partner of the Caravaggio for lighter lines: three cars (ETR 103) or four (ETR 104), one class; the ETR 204 version adds a small first-class area and a second toilet. In service with Trenord since July 2020." },
  tnPopMid: { ...pop, about: "Each Donizetti car has two wide doors a side with a step-free entry from the platform." },
  tnColleoniCab: { model: "Stadler Colleoni (FLIRT, ATR 803)", type: "Diesel-battery multiple unit", builder: "Stadler Rail", built: "Since 2022", fleet: "30",
    topSpeedMph: 87, powerHp: 1609, seats: 168, lengthFt: 219.2, source: "https://www.railvolution.net/news/first-new-fnm-flirt-dmu-on-test",
    about: "A FLIRT with a diesel power module and batteries, for the lines without wires; in service since 2023 on Pavia–Alessandria, then Lombardy's other southern branches, replacing the ALn 668s." },
  tnColleoniMid: { model: "Stadler Colleoni (FLIRT, ATR 803)", type: "Diesel-battery multiple unit", builder: "Stadler Rail", built: "Since 2022", fleet: "30", topSpeedMph: 87,
    source: "https://www.railvolution.net/news/first-new-fnm-flirt-dmu-on-test", about: "The Colleoni's third car, sharing Jakobs trucks with its neighbours." },
  tnFlirtPack: { model: "Stadler Colleoni power module", type: "Power module", builder: "Stadler Rail", powerHp: 1609, source: "https://www.railvolution.net/news/first-new-fnm-flirt-dmu-on-test",
    about: "The short module between the first two cars holds the diesel generator and batteries, with an aisle through it." },
  tnTsrCab: { model: "TSR (ALe 711)", type: "Double-deck electric multiple unit", builder: "AnsaldoBreda and Firema", built: "2006–2018", fleet: "104 units of 3 to 6 cars",
    topSpeedMph: 87, powerHp: 1006, seats: 96, lengthFt: 86.8, source: `${ITW}Treno_Servizio_Regionale`,
    about: "Lombardy's Treno Servizio Regionale, the backbone of the Milan Passante's S lines: double-deck cars, every one powered, coupled up to twelve. Units overhauled since 2024 wear the Lombardy livery." },
  tnTsrMid: { model: "TSR (ALe 710)", type: "Double-deck electric multiple unit", builder: "AnsaldoBreda and Firema", built: "2006–2018", powerHp: 1006, seats: 122, lengthFt: 85.4,
    topSpeedMph: 87, source: `${ITW}Treno_Servizio_Regionale`, about: "A TSR intermediate car; units run as three to six cars, numbered by length (R3, R5, R6)." },
  tnTafCab: { model: "TAF (ALe 506, ALe 426)", type: "Double-deck electric multiple unit", builder: "Breda, Firema and ABB; styled by Pininfarina", built: "1996–2004",
    topSpeedMph: 87, powerHp: 4881, seats: 475, lengthFt: 344, source: `${ITW}Treno_Alta_Frequentazione`,
    about: "The Treno Alta Frequentazione, Italy's first double-deck units for crowded suburban lines, four cars in a fixed set. The two motor cars carry the cabs and the pantographs." },
  tnTafMid: { model: "TAF (Le 736)", type: "Double-deck trailer", builder: "Breda, Firema and ABB", built: "1996–2004", source: `${ITW}Treno_Alta_Frequentazione`,
    about: "One of the TAF's two unpowered trailers, with wider doors than the motor cars." },
  tnJazzCab: { model: "Alstom Coradia Meridian (ETR 425, 526, 245)", type: "Electric multiple unit", builder: "Alstom", built: "Since 2012", fleet: "Including 14 ETR 245",
    topSpeedMph: 99.4, lengthFt: 270, source: `${WP}Jazz_(Italian_EMU)`,
    about: "Alstom's articulated regional unit, five sections (82 m) or six (93 m). Trenord's 14 ETR 245s ran the Malpensa Express until 2025 and are being repainted for regional lines." },
  tnJazzMid: { model: "Alstom Coradia Meridian", type: "Electric multiple unit", builder: "Alstom", built: "Since 2012", topSpeedMph: 99.4, source: `${WP}Jazz_(Italian_EMU)`,
    about: "An intermediate section, sharing a truck at each joint; the low floor runs through most of the train." },
  tnGtwCar: { model: "Stadler GTW 2/6 (ATR 115, ATR 125)", type: "Diesel multiple unit", builder: "Stadler Rail", fleet: "8 ATR 115 and the ATR 125s",
    source: "https://railcolornews.com/?p=110453",
    about: "Two passenger sections hung on a short power module. Trenord runs them on Brescia–Iseo–Edolo and the S7 Lecco–Molteno–Milan; the ATR 125 is two of them coupled for good. Hydrogen Coradia Streams (H2iseO) are due to replace them on the Iseo line from 2027." },
  tnGtwPack: { model: "Stadler GTW power module", type: "Power module", builder: "Stadler Rail", source: "https://railcolornews.com/?p=110453",
    about: "The GTW's diesel engine sits in this short module, with a corridor through it between the passenger sections." },
  tn464: { model: "Bombardier E.464", type: "Electric locomotive", builder: "Bombardier", built: "1999–2015", topSpeedMph: 99.4, powerHp: 4694, lengthFt: 51.7,
    source: `${ITW}Locomotiva_FS_E.464`, about: "Italy's standard push-pull locomotive, with a single cab; it runs at one end of a train with a driving trailer at the other." },
  tnVivalto: { model: "Vivalto", type: "Double-deck coach", builder: "Firema and AnsaldoBreda", built: "Since 2005", lengthFt: 87.6, source: `${ITW}Carrozza_Vivalto`,
    about: "Italy's double-deck regional coach, its doors over the trucks at the end level, with steps up and down to the two decks." },
  tnVivaltoCab: { model: "Vivalto driving trailer", type: "Double-deck driving trailer", builder: "Firema and AnsaldoBreda", built: "Since 2005", lengthFt: 87.6, source: `${ITW}Carrozza_Vivalto`,
    about: "The Vivalto's cab car lets the train run push-pull with the E.464 at the other end." },
};
