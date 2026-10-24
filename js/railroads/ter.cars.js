// TER: every French region's regional trains (scripts/railroads/sncf.py,
// agency "ter"; the train's line is its region's network). Trainsheet's own
// side views at the shared scale (js/carart.js), from published dimensions
// and from photographs (Wikimedia Commons, 2022-2026) measured off near-
// broadside views, each in the paint most of that region's fleet of that
// series wears in late 2026; lettered here, no logo files. Parts: Régiolis
// (and the Coradia Liner), the double-deck units (Regio 2N and Omneo, TER 2N
// NG, TER 2N PG), the AGC family, X 73500/X 73900, X 72500 and Z 21500, the
// locomotive-hauled trains (TER 200, RRR, the Corail push-pull sets), the
// tram-trains and the metre-gauge lines; then what usually runs on each
// region's lines (TYPICAL).
import { C, rect, circle, path, line, lines, poly, truck, pantograph, slats } from "../carart.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const seq = (from, pitch, k) => Array.from({ length: Math.max(0, k) }, (_, i) => from + i * pitch);
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const NARROW = "'Roboto Condensed', 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif";
const STROKE = 'vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"';
const M2F = 3.2808; // feet in a metre
let ids = 0;
const newId = () => `ts-clip-ter${++ids}`;

// Text h ft tall centred at (x, y), reading left to right on a mirrored car
// too. anchor "start"/"end" as in SVG (start = left as seen).
function T(c, x, y, h, text, fill, { weight = 700, spacing = 0, italic = false, family = SANS, anchor = "middle", stretch = 1 } = {}) {
  const a = c.mirrored && anchor !== "middle" ? (anchor === "start" ? "end" : "start") : anchor;
  return `<text transform="translate(${n(x)} ${n(y)}) scale(${n((c.mirrored ? -1 : 1) * stretch)} -1)" y="${n(h * 0.36)}" font-size="${n(h)}" text-anchor="${a}" ` +
    `font-weight="${weight}"${italic ? ' font-style="italic"' : ""} letter-spacing="${spacing}" font-family="${family}" fill="${fill}">${text}</text>`;
}
// A mark drawn y-down in a unit box centred at (x, y), h ft tall, never
// mirrored (a logo reads the same way on both sides of the train).
const markAt = (c, x, y, h, inner) => `<g transform="translate(${n(x)} ${n(y)}) scale(${n((c.mirrored ? -1 : 1) * h)} ${n(-h)})">${inner}</g>`;

// The SNCF logo (2005, "carmillon"): white italic SNCF on a rounded box
// shading from red to carmine-purple; voyageurs: "VOYAGEURS" in grey
// under it (SNCF Voyageurs' version, on units lettered since 2020).
function sncf(c, x, y, h, { voyageurs = false, ink = "#6e7378" } = {}) {
  const id = newId(), w = h * 1.95;
  const g = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e2001a"/><stop offset="1" stop-color="#a1006b"/></linearGradient></defs>`;
  return g + markAt(c, x, y, 1, `<rect x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${n(h)}" rx="${n(h * 0.22)}" fill="url(#${id})"/>`) +
    T(c, x, y - h * 0.02, h * 0.6, "SNCF", "#ffffff", { weight: 800, italic: true, spacing: -0.02 * h }) +
    (voyageurs ? T(c, x, y - h * 0.85, h * 0.27, "VOYAGEURS", ink, { weight: 600, spacing: 0.04 * h }) : "");
}

// ===================== Body =====================
// A car body seen from the side, its cab (if any) on the left: the outline
// from the nose's points (bottom to roof) or a plain end, the paint clipped
// to it and shaded like every other drawing (carmodels.js), then what stands
// proud of it. o: sill, roof, nose, x0 (left end when no nose), x1 (right
// end), endR (roof corner), bottom ([[x, y], ...] replacing the straight
// sill, left to right), base (the body colour under the paint), paint(g),
// over(g) (after the outline's fill: doors' edges, lettering), under(g)
// (trucks, underfloor, before the body), top(g) (roof gear, after), ends:
// [floor, top] of the gangway bellows at a coupled end, cabR (the right end
// has a cab: no bellows there).
function body(c, o) {
  const L = c.L, x0 = o.x0 ?? 0.35, x1 = o.x1 ?? L - 0.35, r = o.endR ?? 0.9, { sill, roof } = o;
  const pts = [];
  if (o.nose) pts.push(...o.nose.map((p) => [...p]));
  else pts.push([x0, sill], [x0, roof - r], ["q", x0, roof, x0 + r, roof]);
  const rearPts = [[x1 - r, roof], ["q", x1, roof, x1, roof - r], [x1, sill]];
  const d = poly([...pts, ...rearPts, ...(o.bottom ? [...o.bottom].reverse() : []), pts[0][0] === "q" ? [pts[0][3], pts[0][4]] : pts[0]]);
  const id = newId(), g = { L, sill, roof, x0: o.nose ? o.nose[0][0] : x0, x1 };
  const ys = d.match(/-?\d+(\.\d+)?/g).map(Number).filter((_, i) => i % 2 === 1), lo = Math.min(...ys), hi = Math.max(...ys);
  const stop = (off, color, v, fb) => `<stop offset="${off}" stop-color="${color}" stop-opacity="${fb}" style="stop-opacity:var(${v},${fb})"/>`;
  const shade = `<linearGradient id="${id}-s" gradientUnits="userSpaceOnUse" x1="0" y1="${n(lo)}" x2="0" y2="${n(hi)}">` +
    stop(0, "#000", "--car-shade-low", 0.16) + '<stop offset="0.36" stop-color="#000" stop-opacity="0"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/>' +
    stop(0.8, "#fff", "--car-shade-high", 0.1) + '<stop offset="0.93" stop-color="#fff" stop-opacity="0"/>' + stop(1, "#000", "--car-shade-roof", 0.08) + "</linearGradient>";
  let s = o.under ? o.under(g) : "";
  const [ef, et] = o.ends || [sill + 0.6, roof - 1.4];
  if (c.coupledR && !o.cabR) s += rect(x1 - 0.2, ef, L - x1 + 0.2, et - ef, C.rubber) + lines([[x1 + 0.12, ef + 0.2, x1 + 0.12, et - 0.2]], "#3a3f45", 0.6);
  if (c.coupledL && !o.nose) s += rect(0, ef, x0 + 0.2, et - ef, C.rubber) + lines([[x0 - 0.12, ef + 0.2, x0 - 0.12, et - 0.2]], "#3a3f45", 0.6);
  s += `<path d="${d}" fill="${o.base || "#e8eaec"}"/><clipPath id="${id}"><path d="${d}"/></clipPath><defs>${shade}</defs>` +
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
// seam, a tall window in each (glass: [from, to] as fractions of the
// height; gw: the window's share of a leaf's width).
function leaves(x, w, y0, y1, fill, { glass = [0.2, 0.86], gw = 0.5, seam = "#2b2e33", r = null } = {}) {
  const h = y1 - y0, lw = w / 2;
  let s = rect(x, y0, w, h, fill);
  for (const k of [0, 1]) s += pane(x + lw * k + lw * (1 - gw) / 2, y0 + h * glass[0], lw * gw, h * (glass[1] - glass[0]), r ?? lw * gw * 0.45, "#22252a");
  return s + line(x + lw, y0 + 0.05, x + lw, y1 - 0.05, seam, 0.6) + line(x, y0, x, y1, "rgba(0,0,0,0.35)", 0.5) + line(x + w, y0, x + w, y1, "rgba(0,0,0,0.35)", 0.5);
}

// ===================== Running gear =====================
// A Jakobs truck under the joint of two articulated cars (each car draws
// its half; x at the joint).
const jakobs = (x, top, d = 33, wb = 8.86) => truck(x, { wb, d, top });
// A Scharfenberg coupler run out from the nose to the coupler face (x =
// 0), on its drawbar, the electric head beside it.
function autoCoupler(x1, y = 2.6) {
  return rect(0.35, y - 0.28, Math.max(0.2, x1 - 0.2), 0.56, "#2a2d31") + rect(0, y - 0.62, 0.48, 1.24, "#3b3f45", 0.4, 'rx="0.14"') +
    rect(0.1, y - 0.14, 0.26, 0.28, "#1b1d20") + rect(0.55, y + 0.4, 0.8, 0.42, "#5a6068", 0.3, 'rx="0.08"');
}
// Two coupled units' noses meet: the couplers joined (drawn by the left one).
const coupledCouplers = (y = 2.6) => rect(-0.2, y - 0.28, 1.6, 0.56, "#2a2d31") + rect(-0.25, y - 0.55, 0.5, 1.1, "#3b3f45");
// UIC side buffers and the screw coupling at a locomotive's or coach's end
// (xFace: the buffer face; side -1 left, 1 right).
function uicBuffers(xFace, side, { y = 3.45, reach = 2.0 } = {}) {
  const x0 = side < 0 ? xFace : xFace - reach;
  return rect(x0 + (side < 0 ? 0.55 : 0), y - 0.3, reach - 0.55, 0.6, "#2a2d31") + rect(side < 0 ? xFace : xFace - 0.55, y - 0.62, 0.55, 1.24, "#3b3f45", 0.4, 'rx="0.12"') +
    rect(side < 0 ? xFace + 0.4 : xFace - 1.2, y - 1.35, 0.8, 0.5, "#2a2d31");
}
// Underfloor equipment: cases between a and b hung from the floor (top).
function cases(a, b, top, k = 2, depth = 1.0, fill = "#2c2f35") {
  if (b - a < 1) return "";
  const w = (b - a) / k;
  let s = "";
  for (let i = 0; i < k; i++) s += rect(a + i * w + 0.25, top - depth, w - 0.5, depth, fill, 0, 'rx="0.1"') + line(a + i * w + 0.5, top - depth + 0.25, a + (i + 1) * w - 0.5, top - depth + 0.25, "rgba(255,255,255,0.12)", 0.5);
  return s;
}

// ===================== Roof =====================
// A low fairing with its seams (air conditioning, converters).
function fairing(x, w, roof, h = 0.65, fill = "#9ca2aa", k = 3) {
  return path(poly([[x, roof - 0.1], [x + 0.5, roof + h], [x + w - 0.5, roof + h], [x + w, roof - 0.1]]), fill, 0.4) +
    lines(seq(x + w / k, w / k, k - 1).map((v) => [v, roof + 0.05, v, roof + h - 0.08]), "rgba(0,0,0,0.25)", 0.4);
}
// A pantograph on its base with the main breaker beside it; dir -1: the
// knee toward the left.
function panGear(x, roof, { up = true, dir = -1, breaker = 4.0, base = "#5d636c" } = {}) {
  return rect(x - 3.0, roof - 0.05, 6.0, 0.35, base, 0.4, 'rx="0.12"') + pantograph(x, roof + 0.3, { up, facing: dir }) +
    rect(x + breaker * -dir - 0.6, roof - 0.05, 1.2, 0.9, "#b7bcc3", 0.4, 'rx="0.15"') + rect(x + breaker * -dir - 0.2, roof + 0.85, 0.4, 0.45, "#7d848c", 0.3);
}

// ===================== Orientation and tables =====================
// The same car turned round: its cab (drawn on the left) now on the right.
function facingRight(c, draw) {
  const m = { ...c, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: c.coupledL };
  return `<g transform="matrix(-1 0 0 1 ${n(c.L)} 0)">${draw(m)}</g>`;
}
// A part's tables: add(key, name, draw, lenFt, extra) for a car; addCab()
// also adds key + "R", the same car closing its unit.
function registry() {
  const TYPES = {}, MODELS = {};
  const M = (draw, len) => ({ draw, len, oneEnd: false, variant: (c) => `${c.index}/${c.count}` });
  const add = (key, name, draw, len, extra = {}) => { TYPES[key] = { name, kind: "emu", ...extra }; MODELS[key] = M(draw, len); };
  const addCab = (key, name, draw, len, extra = {}) => { add(key, name, draw, len, extra); add(`${key}R`, name, (c) => facingRight(c, draw), len, extra); };
  return { TYPES, MODELS, add, addCab };
}
const set = (label, ...units) => ({ label, units });

// =====================================================================
// REGIOLIS
// =====================================================================
const PART_REGIOLIS = (() => {
const facing = facingRight;
// Régiolis (Alstom Coradia Polyvalent) for the TER car file.
//
// Four cars 71.82 m, six 109.98 m, three 56.4 m (fr/de.wikipedia "Alstom
// Coradia Polyvalent"); articulated on Jakobs trucks, a motor truck under
// each cab; 2.85 m wide, 4.29 m over the roof gear, the floor 600 mm up
// throughout. Cars, measured off near-broadside photographs of Z 54506
// (Sennecé-lès-Mâcon, 2025-05-29) and B 84703/04 (Longueau): the end car
// (VE) 21.5 m from the coupler face to the Jakobs truck's middle, the
// short access car next to it (VIUFR) 13.4 m (3-car 56.4 m), the other
// middle car (VI) 15.4 m (4-car 71.82 m), and in the six-car sets the two
// division cars (VC) 19.1 m each, a plain truck at the end where the two
// halves meet. Regional sets (B 84500, Z 51500, Z 54500) one double door a
// side per car; periurban ones (B 83500, Z 54900) two. Heights from the
// same photographs scaled by the 4.29 m: the window band 4.25-8.5 ft, the
// doors 1.9-9.9 ft, the eave 12.1 ft, the roof 12.6 ft.


const G = { sill: 1.35, floor: 1.97, doorLo: 1.9, doorHi: 9.9, winLo: 4.25, winHi: 8.5, eave: 12.1, roof: 12.6, gear: 14.07, jak: 3.1 };
// Lengths, ft.
const RL = { ve: 72.0, viu: 41.2, vi: 50.4, vc: 62.6 };

// The nose (left), bottom to roof: the coupler hood low, the bumper's round
// face, the deep windshield raked back to the roof.
const NOSE = [[2.0, 1.35], [0.7, 2.2], [0.3, 3.6], ["q", 0.25, 5.4, 0.9, 6.6], [3.2, 9.6], ["q", 5.6, G.roof - 0.1, 11.0, G.roof]];

// The body's underside: low (the skirt) between the trucks, rising over
// each Jakobs truck at the joints (within 5 ft) and over the motor truck
// behind the cab.
function bottom(L, { cab, left = true, right = true }) {
  const lo = G.sill, hi = G.jak, pts = [];
  if (cab) pts.push([2.0, 1.35], [9.6, 1.35], [10.7, hi], [20.3, hi], [21.4, lo]);
  else if (left) pts.push([0.35, hi], [3.6, hi], [5.0, lo]);
  else pts.push([0.35, lo]);
  if (right) pts.push([L - 5.0, lo], [L - 3.6, hi], [L - 0.35, hi]);
  else pts.push([L - 0.35, lo]);
  return pts;
}

// ===================== Layouts =====================
// Windows [x0, x1] and doors' left edges, ft from the car's left end (the
// cab end of an end car). The regional end car off Z 54506 (cab door 5.3-9.0,
// the region's panel 11.6-16.5, windows, the door 32.1-38.4); the access car
// (VIUFR) off the same unit; the others from the cars' window count.
const DOOR_W = 5.0;
const LAY = {
  ve: { L: RL.ve, wins: [[23.1, 28.8], [29.6, 35.2], [42.5, 47.6], [48.6, 53.9], [54.8, 59.6], [60.6, 65.3], [66.2, 70.6]], doors: [36.5], panel: [17.3, 21.9] },
  viu: { L: RL.viu, wins: [[2.4, 6.3], [7.4, 11.7], [17.8, 21.8], [22.5, 26.5], [27.2, 31.5], [32.0, 35.8], [36.7, 40.2]], doors: [12.4] },
  vi: { L: RL.vi, wins: [[1.8, 6.6], [7.4, 12.6], [13.4, 18.6], [25.6, 30.8], [31.6, 36.8], [37.6, 42.8], [43.6, 48.6]], doors: [19.8] },
  vc: { L: RL.vc, wins: [[1.8, 6.8], [7.6, 13.0], [13.8, 19.2], [20.0, 25.4], [32.6, 38.0], [38.8, 44.2], [45.0, 50.4], [51.2, 56.6], [57.4, 61.0]], doors: [26.6] },
// Periurban: two doors a car, fewer windows.
  pve: { L: RL.ve, wins: [[23.1, 28.8], [29.6, 35.2], [42.5, 47.6], [48.6, 53.9], [61.6, 66.2], [67.0, 70.8]], doors: [36.5, 55.3], panel: [17.3, 21.9] },
  pviu: { L: RL.viu, wins: [[1.8, 6.4], [13.0, 18.2], [19.0, 24.2], [31.0, 35.8], [36.6, 40.0]], doors: [7.2, 25.2] },
  pvi: { L: RL.vi, wins: [[1.8, 6.8], [14.0, 19.6], [20.4, 26.0], [26.8, 31.6], [38.8, 43.8], [44.6, 48.8]], doors: [7.6, 32.6] },
};

// ===================== Running gear and roof =====================
const motor = (x) => truck(x, { wb: 8.86, d: 33, top: G.jak - 0.2 });
// Roof gear: the dark boxes that run along most of the roof (converters,
// air conditioning, and on the bimode units the diesel packs), louvered.
function box(x, w, h = 1.45, fill = "#4b5057") {
  return path(poly([[x, G.roof - 0.1], [x + 0.4, G.roof + h], [x + w - 0.4, G.roof + h], [x + w, G.roof - 0.1]]), fill, 0.4) +
    lines(seq(x + 1.2, 1.2, Math.floor((w - 1.6) / 1.2)).map((v) => [v, G.roof + 0.25, v, G.roof + h - 0.2]), "rgba(255,255,255,0.13)", 0.4);
}
// A diesel pack on the roof (B 83500, B 84500): a tall box, the radiator
// fan's ring on top, the exhaust stack.
const pack = (x, w) => box(x, w, 1.45, "#3d4147") + rect(x + w * 0.62, G.roof + 1.45, 3.2, 0.12, "#2c2f34") + rect(x + 1.0, G.roof + 1.45, 0.5, 0.35, "#2c2f34");

// ===================== The cars =====================
// kind: "ve" | "viu" | "vi" | "vc" (periurban: "pve", "pviu", "pvi"); o.liv
// the paint; o.pan a pantograph; o.diesel a roof diesel pack; o.cls1 first
// class (its window part marked as the livery marks it, if at all).
function car(c, kind, o) {
  const lay = LAY[kind], L = c.L, liv = o.liv, cab = kind === "ve" || kind === "pve", vc = kind === "vc";
  const g0 = { L, kind, cab, lay, c, o };
  const paint = () => {
    let s = liv.base(g0);
    for (const [a, b] of lay.wins) s += liv.window ? liv.window(g0, a, b) : pane(a, G.winLo, b - a, G.winHi - G.winLo, 0.55, "#26292e");
    s += lay.doors.map((x) => liv.door(g0, x)).join("");
    if (cab) s += cabSide(g0);
    s += liv.over ? liv.over(g0) : "";
    return s;
  };
  // A division car's plain end (right, as drawn): it couples to its twin.
  const bot = bottom(L, { cab, left: !cab, right: !vc });
  return body(c, {
    sill: G.sill, roof: G.roof, nose: cab ? NOSE : null, x0: 0.35, x1: L - (vc ? 0.6 : 0.35), base: liv.color, endR: 0.9,
    bottom: bot, ends: [G.floor + 0.2, G.eave - 0.4], paint,
    under: () => (cab ? motor(15.5) + (c.coupledL ? coupledCouplers(2.6) : autoCoupler(2.0, 2.6)) : jakobs(0, G.jak - 0.2)) +
      (vc ? truck(L - 8.8, { wb: 8.86, d: 33, top: G.jak - 0.2 }) + (c.coupledR ? coupledCouplers(2.6).replace(/x="-0\.2/, `x="${n(L - 1.4)}`) : "") : jakobs(L, G.jak - 0.2)) +
      cases(cab ? 22 : 6, L - (vc ? 14 : 6), G.sill + 0.1, cab ? 3 : 2, 0.55),
    top: () => roof(g0),
  });
}
// The cab seen from the side, over the livery: the windshield's black
// visor, the crew door, the headlight pods, the lower nose's grey.
function cabSide(g) {
  const liv = g.o.liv;
  let s = liv.cab ? liv.cab(g) : "";
  // Windshield and visor, edge-on along the raked face.
  s += path(poly([[0.95, 6.7], [1.6, 6.6], [3.6, 9.3], ["q", 5.9, 12.0, 11.5, 12.35], [11.5, 14], [-1, 14], [-1, 6.7]]), "#1d2024");
  s += path(poly([[1.9, 7.1], [3.6, 9.4], ["q", 5.2, 11.4, 8.6, 11.85], [8.4, 11.0], ["q", 5.8, 10.6, 4.6, 9.2], [3.0, 7.1]]), C.glassLight, 0, 'opacity="0.55"');
  // The headlight pod: a black teardrop low on the nose's flank.
  s += path(poly([[0.35, 4.6], ["q", 1.8, 4.15, 4.0, 4.6], ["q", 4.9, 5.25, 3.9, 5.85], ["q", 1.8, 6.0, 0.45, 5.45]]), "#16181b") +
    circle(1.2, 5.05, 0.33, "#f3ead0", 0, 'stroke="#3a3d42" stroke-width="0.5" vector-effect="non-scaling-stroke"') + circle(2.2, 5.0, 0.26, "#d9dde2");
  // The crew door: its seam, a tall narrow window, the steps under it.
  s += rect(11.0, G.doorLo + 0.9, 3.5, G.doorHi - G.doorLo - 0.4, "none", 0, `rx="0.35" stroke="rgba(40,44,50,0.6)" stroke-width="0.6" ${STROKE}`) +
    rect(12.1, 6.4, 1.3, 3.0, "#1f2226", 0, 'rx="0.3"');
  // The equipment hatches behind it.
  s += rect(15.0, 3.3, 1.6, 2.6, "none", 0, `rx="0.2" stroke="rgba(40,44,50,0.45)" stroke-width="0.5" ${STROKE}`) +
    rect(22.0, 3.3, 1.0, 2.0, "none", 0, `rx="0.15" stroke="rgba(40,44,50,0.35)" stroke-width="0.5" ${STROKE}`);
  return s;
}
// Roof gear by car (as seen on Z 54506 and B 83524): on the end car the
// cab's smooth cap, then a long box; boxes on the middle cars; the
// pantograph on the access car (electric and bimode), the diesel packs on
// the end cars' roofs (bimode).
function roof(g) {
  const L = g.L, o = g.o;
  if (g.cab) return (o.diesel ? pack(22.0, 18.0) + pack(44.0, 16.5) : box(22.0, 16.0) + box(44.0, 15.0, 1.0)) + fairing(62.0, 6.5, G.roof, 0.45, "#8f959c");
  if (g.kind === "viu" || g.kind === "pviu") return box(3.0, 10.0, 1.0) + (o.pan === false ? box(15.0, 12.0) : panGear(21.0, G.roof + 0.25, { dir: -1 }) + box(30.0, 11.0, 1.0));
  if (g.kind === "vc") return box(4.0, 20.0) + box(30.0, 18.0, 1.0) + (o.pan ? panGear(54.0, G.roof + 0.25, { dir: 1 }) : box(50.0, 9.0, 1.0));
  return box(4.0, 18.0) + box(28.0, 18.0, 1.0);
}

// ===================== Liveries =====================
// The windows between doors, as groups [x0, x1].
function groups(lay) {
  const out = [];
  let cur = null;
  for (const [a, b] of lay.wins) {
    if (cur && !lay.doors.some((x) => x > cur[1] && x < a)) cur[1] = b;
    else out.push((cur = [a, b]));
  }
  return out;
}
// Each: color (the body's base), base(g) (paint under the windows),
// window(g, a, b), door(g, x), cab(g) (over the cab side), over(g).
const darkWin = (a, b, frame = "#3a3e44", y0 = G.winLo, y1 = G.winHi) => rect(a - 0.35, y0 - 0.35, b - a + 0.7, y1 - y0 + 0.7, frame, 0, 'rx="0.75"') + pane(a, y0, b - a, y1 - y0, 0.55, "#1d2024");
const doorPlain = (fill, { plate = "#d9dde2" } = {}) => (g, x) =>
  leaves(x, DOOR_W, G.doorLo, G.doorHi, fill, { glass: [0.36, 0.86], gw: 0.46 }) +
  rect(x - 0.4, G.doorHi + 0.05, DOOR_W + 0.8, 0.7, plate, 0.3, 'rx="0.3"') + rect(x + DOOR_W / 2 - 0.8, G.doorHi + 0.22, 1.6, 0.35, "#2b2e33", 0, 'rx="0.1"');
// The lower nose and the body's foot in grey, the nose's cap colour over
// the windshield and back along the roof.
const lowNose = (fill = "#9da2a8") => path(`M-1 1.0L-1 3.4Q2.0 3.0 5.0 3.2Q9.5 3.5 12.0 2.5L12.0 1.0Z`, fill);

// --- Bourgogne-Franche-Comté, Mobigo (Z 54506, 2025; Z 54529, 54543,
// 2026): light grey; a lime band along the roof's edge, carried forward as
// a cap over the windshield; dark grey window surrounds; green doors; over
// the windows white and lime chevrons; "mobigo" low near the doors; the
// region's yellow panel on the cab side; "emmène-moi là où je veux !"
// small over the windows.
const MOB = { grey: "#e4e6e7", lime: "#b2cc3c", dark: "#43484e", green: "#1d8a57", skirt: "#8f959b" };
function chevron(x) {
  // Two rows of forward-slanting strokes, white then lime, the lower row
  // stepped to the right (Z 54543, Dijon 2026).
  const st = (x0, y0, y1, w, fill) => path(poly([[x0 + 2.2, y0], [x0 + 2.2 + w, y0], [x0 + w, y1], [x0, y1]]), fill);
  return st(x - 0.6, 10.55, 7.5, 1.2, "#ffffff") + st(x + 1.1, 10.55, 7.5, 1.6, MOB.lime) +
    st(x + 1.2, 7.1, 4.3, 0.9, "#ffffff") + st(x + 2.6, 7.6, 4.6, 1.1, MOB.lime);
}
const LIV_MOB = {
  color: MOB.grey,
  base: (g) => rect(-1, G.eave - 1.45, g.L + 2, 4, MOB.lime) + rect(-1, 0, g.L + 2, 2.35, MOB.skirt) + line(-1, G.eave - 1.45, g.L + 1, G.eave - 1.45, "rgba(0,0,0,0.12)", 0.4) +
    groups(g.lay).map(([a, b]) => rect(a - 0.6, 3.95, b - a + 1.2, 5.4, MOB.dark, 0, 'rx="0.9"')).join(""),
  window: (g, a, b) => pane(a, G.winLo, b - a, G.winHi - G.winLo, 0.5, "#1d2024"),
  door: doorPlain(MOB.green),
  cab: (g) => lowNose(MOB.skirt) + path(`M4.0 ${G.roof}C6.5 12.0 8.4 11.3 10.2 11.0C12.6 10.7 14.5 10.65 17.0 ${G.eave - 1.45}L17.0 14L4.0 14Z`, MOB.lime) +
    rect(-1, 0, 22, 2.35, MOB.grey) + rect(17.3, 6.9, 4.6, 3.6, "#f6d81c", 0, 'rx="0.15"') +
    T(g.c, 19.6, 9.9, 0.42, "RÉGION", "#1d1f22", { weight: 700, family: "Georgia, serif" }) + T(g.c, 19.6, 9.1, 0.5, "BOURGOGNE", "#1d1f22", { weight: 700, family: "Georgia, serif" }) +
    T(g.c, 19.6, 8.3, 0.5, "FRANCHE", "#1d1f22", { weight: 700, family: "Georgia, serif" }) + T(g.c, 19.6, 7.5, 0.5, "COMTÉ", "#1d1f22", { weight: 700, family: "Georgia, serif" }) +
    sncf(g.c, 9.4, 8.1, 0.95),
  over: (g) => {
    let s = "";
    const xs = groups(g.lay).map(([a]) => a + 3.2);
    for (const x of xs) s += chevron(x);
    const dx = g.lay.doors[0];
    s += T(g.c, dx + DOOR_W + 9.0, 10.65, 0.5, "emmène-moi là où je veux !", "#3c4146", { weight: 500, italic: true });
    s += mobigo(g.c, groups(g.lay)[0][0] + 3.0, 3.3, 0.9);
    if (g.cab) s += bikeSign(g.c, dx + DOOR_W + 3.2, 6.4, 1.6) + bikeSign(g.c, dx + DOOR_W / 2, 9.15, 0.55);
    s += lay2(g).map((x) => rect(x - 1.25, 8.35, 0.8, 1.15, "#f6d81c") + rect(x + DOOR_W + 0.45, 8.35, 0.8, 1.15, "#f6d81c")).join("");
    return s;
  },
};
const lay2 = (g) => g.lay.doors;
// A white bicycle pictogram, h ft tall, centred at (x, y).
function bikeSign(c, x, y, h, color = "#ffffff") {
  const r = h * 0.28, st = `fill="none" stroke="${color}" stroke-width="${n(h * 0.08)}"`;
  return `<g transform="translate(${n(x)} ${n(y)})"><circle cx="${n(-h * 0.42)}" cy="${n(-h * 0.2)}" r="${n(r)}" ${st}/><circle cx="${n(h * 0.42)}" cy="${n(-h * 0.2)}" r="${n(r)}" ${st}/>` +
    `<path d="M${n(-h * 0.42)} ${n(-h * 0.2)}L${n(-h * 0.1)} ${n(h * 0.25)}L${n(h * 0.3)} ${n(h * 0.25)}L${n(h * 0.42)} ${n(-h * 0.2)}M${n(-h * 0.1)} ${n(h * 0.25)}L${n(h * 0.05)} ${n(-h * 0.2)}L${n(h * 0.3)} ${n(h * 0.25)}" ${st}/></g>`;
}
// The mobigo word: "mobi" in dark green, "go" in lime, the strapline under.
const mobigo = (c, x, y, h) => T(c, x, y, h, `mobi<tspan fill="${MOB.lime}">go</tspan>`, "#2f6e46", { weight: 700, spacing: "-0.02em" });

// ===================== The regions' marks =====================
// Simplified from the marks as they appear on the trains (each in a unit
// box, y down, drawn unmirrored).
// Normandie: the red shield with two gold leopards passant, one above the
// other (the region's arms, its logo since 2016).
const LEOPARD = "M-0.36 0.02Q-0.42 -0.08 -0.34 -0.12L-0.3 -0.06L-0.18 -0.06Q-0.1 -0.12 0.08 -0.1L0.16 -0.2L0.2 -0.14L0.3 -0.18L0.34 -0.08L0.42 -0.06L0.36 0.0L0.26 0.02" +
  "L0.24 0.12L0.18 0.12L0.16 0.04L-0.04 0.05L-0.08 0.13L-0.14 0.13L-0.14 0.04L-0.26 0.04L-0.3 0.13L-0.36 0.13Z";
const normandie = (c, x, y, h) => markAt(c, x, y, h, '<path d="M-0.42 -0.5L0.42 -0.5L0.42 0.1Q0.42 0.42 0 0.52Q-0.42 0.42 -0.42 0.1Z" fill="#d7192d"/>' +
  `<g transform="translate(0 -0.2) scale(0.9)"><path d="${LEOPARD}" fill="#f2c21b"/></g><g transform="translate(0 0.17) scale(0.9)"><path d="${LEOPARD}" fill="#f2c21b"/></g>`);
// Hauts-de-France: the region's outline in one line with a green heart
// over its top; "Région" in green, "Hauts-de-France" under it.
const HDF_OUTLINE = "M-0.3 -0.3Q-0.25 -0.48 -0.05 -0.42Q0.1 -0.36 0.18 -0.42L0.32 -0.2L0.26 0.0L0.34 0.24L0.16 0.46L-0.02 0.36L-0.18 0.46L-0.28 0.22L-0.2 0.02L-0.34 -0.16Z";
const HDF_HEART = "M0.02 0.12L-0.2 -0.12Q-0.3 -0.32 -0.12 -0.38Q0 -0.4 0.04 -0.26Q0.1 -0.42 0.24 -0.36Q0.36 -0.26 0.24 -0.08Z";
const hdfMark = (c, x, y, h, ink) => markAt(c, x, y, h, `<path d="${HDF_OUTLINE}" fill="none" stroke="${ink}" stroke-width="0.07" stroke-linejoin="round"/>` +
  `<path d="${HDF_HEART}" fill="none" stroke="#8cc63f" stroke-width="0.07" stroke-linejoin="round"/>`);
const hdfLogo = (c, x, y, h, ink) => hdfMark(c, x, y, h, ink) + T(c, x + h * 0.55, y + h * 0.18, h * 0.3, "Région", "#8cc63f", { weight: 700, anchor: "start" }) +
  T(c, x + h * 0.55, y - h * 0.22, h * 0.36, "Hauts-de-France", ink, { weight: 700, anchor: "start", stretch: 0.9 });
// Pays de la Loire: two arcs, blue and yellow-green, then "Région" in red,
// "PAYS", "de la", "LOIRE" in blue.
const pdlLogo = (c, x, y, h) => markAt(c, x, y, h, '<path d="M-0.5 -0.45Q-0.2 0 -0.5 0.45" fill="none" stroke="#1aa7df" stroke-width="0.11"/><path d="M-0.3 -0.45Q0 0 -0.3 0.45" fill="none" stroke="#c4d600" stroke-width="0.13"/>') +
  T(c, x + h * 0.55, y + h * 0.42, h * 0.16, "Région", "#d8232a", { weight: 500 }) + T(c, x + h * 0.55, y + h * 0.18, h * 0.3, "PAYS", "#2a86c8", { weight: 600 }) +
  T(c, x + h * 0.55, y - h * 0.05, h * 0.14, "de la", "#2a86c8", { weight: 500 }) + T(c, x + h * 0.55, y - h * 0.3, h * 0.3, "LOIRE", "#2a86c8", { weight: 600 });
// Nouvelle-Aquitaine: the red shield with the white lion rampant; "RÉGION
// Nouvelle-Aquitaine" beside it.
const LION = "M-0.12 0.32L-0.08 0.1L-0.2 -0.02L-0.12 -0.08L-0.1 -0.24L0.0 -0.32L0.1 -0.26L0.06 -0.18L0.14 -0.12L0.2 -0.2L0.22 -0.08L0.1 0.02L0.16 0.14L0.22 0.32L0.12 0.32L0.04 0.16L-0.02 0.32Z";
const naqLogo = (c, x, y, h, ink = "#3a3f46") => markAt(c, x, y, h, '<path d="M-0.36 -0.46L0.36 -0.46L0.36 0.12Q0.36 0.4 0 0.5Q-0.36 0.4 -0.36 0.12Z" fill="#e0262f"/>' +
  `<path d="${LION}" fill="#ffffff"/>`) + T(c, x + h * 0.5, y + h * 0.36, h * 0.15, "RÉGION", ink, { weight: 600, anchor: "start" }) +
  T(c, x + h * 0.5, y + h * 0.08, h * 0.24, "Nouvelle-", ink, { weight: 500, anchor: "start" }) + T(c, x + h * 0.5, y - h * 0.2, h * 0.24, "Aquitaine", ink, { weight: 500, anchor: "start" });
// Occitanie: the Occitan cross (four arms ending in three balls each) in
// yellow on the region's red square.
function occCross(c, x, y, h, { square = true } = {}) {
  let p = (square ? '<rect x="-0.5" y="-0.5" width="1" height="1" rx="0.06" fill="#d81e1e"/>' : "") + '<path d="M0 -0.36L0.07 -0.07L0.36 0L0.07 0.07L0 0.36L-0.07 0.07L-0.36 0L-0.07 -0.07Z" fill="#f2c21b"/>';
  for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) for (const k of [-1, 0, 1]) {
    const px = dx * 0.38 + (dy ? k * 0.08 : 0), py = dy * 0.38 + (dx ? k * 0.08 : 0);
    p += `<circle cx="${n(px)}" cy="${n(py)}" r="0.045" fill="#f2c21b"/>`;
  }
  return markAt(c, x, y, h, p);
}

// --- The class numeral beside a door (white or dark, as lettered).
const numeral = (c, x, cls = "2", fill = "#ffffff") => T(c, x, 9.0, 0.75, cls, fill, { weight: 600 });
// A logo panel: white rounded plate (the regions' marks), text lines.
function plate(c, x, y, w, h, linesTxt, { fill = "#ffffff", ink = "#1d1f22", mark = null } = {}) {
  let s = rect(x, y, w, h, fill, 0, 'rx="0.2"') + (mark || "");
  linesTxt.forEach(([t, size, weight], k) => (s += T(c, x + w / 2, y + h - 0.55 - k * (size + 0.12), size, t, ink, { weight })));
  return s;
}
// The window band of the standard TER Régiolis paint: dark grey round
// each group of windows between doors, its ends rounded.
const bandGroups = (g, color, lo = 3.95, hi = 9.35) => groups(g.lay).map(([a, b]) => rect(a - 0.6, lo, b - a + 1.2, hi - lo, color, 0, 'rx="0.9"')).join("");

// --- Normandie (B 84566 at Paris-Montparnasse and Villedieu, 2024): the
// region's first Régiolis paint, still on the Paris-Granville sets: silver;
// the windows in a dark grey band, a green band over them with the
// region's little pictures (left out here, too small to read); navy
// doors; on the cab "Normandie fort et vert" in green handwriting and the
// region's white plate.
const NOR = { silver: "#c9cccf", band: "#5a5f65", green: "#8cc63f", door: "#25365f", skirt: "#8e9399" };
const LIV_NOR = {
  color: NOR.silver,
  base: (g) => rect(-1, 0, g.L + 2, 2.35, NOR.skirt) + bandGroups(g, NOR.band) + groups(g.lay).map(([a, b]) => rect(a - 0.6, 9.55, b - a + 1.2, 1.5, NOR.green, 0, 'rx="0.6"')).join(""),
  window: (g, a, b) => pane(a, G.winLo, b - a, G.winHi - G.winLo, 0.5, "#1d2024"),
  door: (g, x) => doorPlain(NOR.door)(g, x) + numeral(g.c, x - 0.6, "2") + numeral(g.c, x + DOOR_W + 0.6, "2"),
  cab: (g) => lowNose(NOR.skirt) + rect(-1, 0, 22, 2.35, NOR.silver) +
    `<g transform="translate(15.0 10.4) rotate(-6)">${T(g.c, 0, 0, 0.95, "Normandie fort et vert", NOR.green, { weight: 500, italic: true, family: "'Comic Sans MS', 'Segoe Print', cursive" })}</g>` +
    rect(17.6, 5.4, 2.4, 3.6, "#ffffff", 0, 'rx="0.15"') + normandie(g.c, 18.8, 7.9, 1.3) + T(g.c, 18.8, 6.6, 0.24, "RÉGION", "#3a3f46", { weight: 500 }) + T(g.c, 18.8, 6.1, 0.3, "NORMANDIE", "#3a3f46", { weight: 600 }) + sncf(g.c, 9.4, 8.1, 0.95),
};

// --- Pays de la Loire (B 84541, 84535, 84547 in 2022-2024): silver; a
// turquoise sweep over the cab; dark grey window band; plum doors, a lime
// and a blue stripe ahead of each; "RÉGION DES PAYS DE LA LOIRE" over the
// windows; the region's mark by the door.
const PDL = { silver: "#d0d3d5", band: "#4b5056", turq: "#1aa7df", door: "#8a2a59", lime: "#c4d600", skirt: "#8e9399" };
const LIV_PDL = {
  color: PDL.silver,
  base: (g) => rect(-1, 0, g.L + 2, 2.35, PDL.skirt) + bandGroups(g, PDL.band),
  window: (g, a, b) => pane(a, G.winLo, b - a, G.winHi - G.winLo, 0.5, "#1d2024"),
  door: (g, x) => rect(x - 1.05, 2.5, 0.45, 7.2, PDL.lime) + rect(x - 0.55, 2.5, 0.25, 7.2, "#2a86c8") + doorPlain(PDL.door)(g, x) +
    numeral(g.c, x + 0.6, "2") + numeral(g.c, x + DOOR_W - 0.6, "2"),
  cab: (g) => lowNose(PDL.skirt) + rect(-1, 0, 22, 2.35, PDL.silver) +
    path(`M-1 6.2C1.5 7.4 3.8 9.4 5.2 11.2C6.6 12.6 8.0 13.0 9.6 13.0L10.4 14L-1 14Z`, PDL.turq) +
    path(`M3.6 9.0C5.4 11.4 7.4 12.6 10.8 ${G.roof}L10.8 3.2C9.6 2.7 8.6 2.5 7.6 2.5C6.6 3.6 5.6 5.0 4.6 6.4C4.2 7.2 3.8 8.2 3.6 9.0Z`, PDL.turq) +
    sncf(g.c, 9.2, 7.6, 0.8) + pdlLogo(g.c, 18.0, 7.4, 1.8),
  over: (g) => T(g.c, g.lay.doors.at(-1) + DOOR_W + 7.6, 10.35, 0.7, "RÉGION DES PAYS DE LA LOIRE", "#2d3035", { weight: 700, family: "'Arial Narrow', 'Roboto Condensed', Arial, sans-serif" }),
};

// --- Nouvelle-Aquitaine (Z 51535 at Bordeaux 2023, Z 51513 at Hendaye,
// B 84821 2025): light grey; a broad dark grey band through the windows;
// red doors, white chevrons at their top; "La Région vous transporte" in
// white on a navy tab over the windows and a row of navy crescents; the
// cab's top and the roof's edge over it blue; the region's shield.
const NAQ = { grey: "#d6d9db", band: "#4d5258", red: "#d8232a", navy: "#1f2f6b", blue: "#2346a0", skirt: "#8e9399" };
const LIV_NAQ = {
  color: NAQ.grey,
  base: (g) => rect(-1, 0, g.L + 2, 2.35, NAQ.skirt) + rect(-1, 11.75, g.L + 2, 3, NAQ.blue) + bandGroups(g, NAQ.band, 3.4, 9.6),
  window: (g, a, b) => pane(a, G.winLo, b - a, G.winHi - G.winLo, 0.5, "#1d2024"),
  door: (g, x) => doorPlain(NAQ.red)(g, x) + [0, 0.55].map((d) => path(poly([[x + DOOR_W - 1.4, 9.5 - d], [x + DOOR_W - 0.9, 9.5 - d], [x + DOOR_W - 0.5, 9.05 - d], [x + DOOR_W - 0.9, 8.6 - d], [x + DOOR_W - 1.4, 8.6 - d], [x + DOOR_W - 1.0, 9.05 - d]]), "#ffffff")).join(""),
  cab: (g) => lowNose(NAQ.skirt) + rect(-1, 0, 22, 2.35, NAQ.grey) + path(`M0.4 5.8C1.8 7.6 3.6 10.0 5.6 11.4C7.6 12.4 10.4 12.0 13.0 11.75L22 11.75L22 14L-1 14L-1 5.8Z`, NAQ.blue) +
    path(`M0.6 6.0C2.0 7.6 3.8 9.8 5.6 11.0L6.6 11.0C4.6 9.6 3.0 7.4 1.6 5.6Z`, "#2a54b8") +
    naqLogo(g.c, 17.4, 7.6, 1.8) + sncf(g.c, 9.4, 8.1, 0.95),
  over: (g) => {
    const [a, b] = groups(g.lay).at(-1);
    let s = rect(a, 9.85, 10.6, 1.0, NAQ.navy, 0, 'rx="0.5"') + T(g.c, a + 5.3, 10.33, 0.62, "La Région vous transporte", "#ffffff", { weight: 600, italic: true });
    for (let x = a + 11.6; x < b - 0.4; x += 0.85) s += path(`M${n(x)} 10.0Q${n(x - 0.35)} 10.35 ${n(x)} 10.75Q${n(x - 0.15)} 10.35 ${n(x)} 10.0Z`, NAQ.navy);
    return s;
  },
};

// --- Hauts-de-France (B 84703/04 and 84511/12 at Longueau; B 84520 at
// Amiens 2024): royal blue; white panels sloping back from each door with
// broad green slants at their edges; blue doors; "www.hautsdefrance.fr"
// and the region's mark on the white; the cab silver, its cap blue.
const HDF = { blue: "#2b3c9d", white: "#f2f3f4", green: "#8cc63f", door: "#2b44ad", silver: "#c9cdd1", skirt: "#7f858c" };
const LIV_HDF = {
  color: HDF.blue,
  base: (g) => {
    let s = rect(-1, 0, g.L + 2, 2.35, HDF.skirt);
    for (const x of g.lay.doors) {
      // Ahead of the door: a white panel from a green slant; behind it,
      // over the windows, a white strip ending in a green slant.
      const a = Math.max(g.cab ? 19.5 : 0.5, x - 11.5);
      s += path(poly([[a + 2.6, 10.9], [x, 10.9], [x, 2.35], [a - 0.6, 2.35]]), HDF.white) + path(poly([[a + 0.4, 10.9], [a + 2.6, 10.9], [a - 0.6, 2.35], [a - 2.8, 2.35]]), HDF.green);
      const b = Math.min(g.L - 3, x + DOOR_W + 22);
      s += path(poly([[x + DOOR_W + 9.0, 9.4], [b - 0.6, 9.4], [b, 10.9], [x + DOOR_W + 9.6, 10.9]]), HDF.white) + path(poly([[b - 0.6, 9.4], [b + 1.6, 9.4], [b + 2.2, 10.9], [b, 10.9]]), HDF.green);
    }
    return s;
  },
  window: (g, a, b) => darkWin(a, b, "#3a3e44"),
  door: (g, x) => doorPlain(HDF.door)(g, x),
  cab: (g) => lowNose(HDF.skirt) + path(`M-1 0L-1 14L22 14L22 11.4C17.0 11.4 13.0 11.0 10.6 9.6C9.4 8.6 9.0 6.0 9.4 2.35L-1 2.35Z`, HDF.silver) +
    path(`M2.4 10.0C5.0 12.0 8.0 12.3 11.0 12.0C14.0 11.7 17.0 11.4 22.0 11.4L22 14L2.0 14Z`, HDF.blue) + sncf(g.c, 11.8, 8.6, 0.85) +
    rect(17.6, 5.4, 2.6, 3.6, "#ffffff", 0, 'rx="0.1"') + hdfMark(g.c, 18.9, 7.7, 1.9, "#3a3f55") + T(g.c, 18.9, 6.25, 0.22, "Région", "#8cc63f", { weight: 600 }) +
    T(g.c, 18.9, 5.85, 0.24, "Hauts-de-France", "#3a3f55", { weight: 600, stretch: 0.85 }),
  over: (g) => g.lay.doors.map((x) => T(g.c, x + DOOR_W + 17.5, 10.15, 0.7, "www.hautsdefrance.fr", HDF.blue, { weight: 600 }) +
    hdfLogo(g.c, x + DOOR_W + 1.6, 9.85, 1.6, "#ffffff")).join(""),
};

// --- Grand Est, fluo (B 84809 at Sélestat 2024, 84803/84807 2023-2026):
// silver, the roof's edge dark grey; on the cab a broad blue sweep and the
// blue panel with "fluo" in yellow and "Grand Est" in white; blue doors,
// coloured blocks (yellow, lime, sky blue) by the doors.
const GEF = { silver: "#cfd3d6", grey: "#62676d", blue: "#1f6fc5", yellow: "#f3d21b", lime: "#a9cf38", sky: "#4fb3e8", skirt: "#868b91" };
const LIV_GE = {
  color: GEF.silver,
  base: (g) => rect(-1, 0, g.L + 2, 2.35, GEF.skirt),
  window: (g, a, b) => darkWin(a, b, "#5b6066"),
  door: (g, x) => doorPlain(GEF.blue)(g, x) + rect(x, G.doorLo + 0.05, DOOR_W, 2.0, GEF.lime) + (x - 3.2 > (g.cab ? 22.5 : 0.8) ? rect(x - 3.2, 9.0, 2.6, 1.6, GEF.yellow) : "") + rect(x + DOOR_W + 0.6, 2.6, 2.2, 1.5, GEF.lime),
  cab: (g) => lowNose(GEF.skirt) + rect(-1, 0, 22, 2.35, GEF.silver) + path(`M2.0 9.4C4.0 11.6 6.4 12.4 10.6 ${G.roof}L10.6 14L-1 14Z`, GEF.grey) +
    path(`M0.6 5.8C3.6 6.4 6.8 8.0 9.4 10.0L10.8 10.9L10.8 8.6C8.0 6.8 5.0 5.4 1.8 5.0Z`, GEF.blue) +
    path(`M15.6 10.9L21.6 10.9C23.4 10.9 24.2 9.8 23.6 8.2L21.6 3.6C21.2 3.0 20.6 2.8 19.6 2.8L15.6 2.8Z`, GEF.blue) + T(g.c, 19.4, 8.4, 1.7, "fluo", GEF.yellow, { weight: 600, italic: true, family: "Georgia, serif" }) +
    T(g.c, 19.8, 6.6, 0.7, "Grand Est", "#ffffff", { weight: 600 }) + sncf(g.c, 9.0, 8.0, 0.8),
  over: (g) => g.lay.doors.filter((x) => x - 9.5 > (g.cab ? 22.5 : 0.8)).map((x) => rect(x - 9.5, 9.6, 6.2, 1.15, GEF.sky, 0, 'rx="0.1"') + T(g.c, x - 6.4, 10.17, 0.5, "fluo Grand Est", "#ffffff", { weight: 600 })).join(""),
};

// --- Auvergne-Rhône-Alpes (B 84629 at Moulins 2022, B 84640 at
// Clermont-Ferrand 2024): sky blue, the roof's edge deep blue; grey skirt;
// white doors; big white discs with the region's blue mountain mark;
// "LA RÉGION VOUS TRANSPORTE" over the windows; "La Région / Auvergne-
// Rhône-Alpes" in white; the cab's nose light grey.
const AURA = { sky: "#2aa0e2", deep: "#2a3fae", door: "#e3e6e9", grey: "#c6cacd", skirt: "#7b8086" };
const auraMark = (c, x, y, h, color) => markAt(c, x, y, h, `<path d="M-0.42 0.25L-0.42 -0.05L-0.12 -0.35L0.08 -0.1L0.25 -0.25L0.42 -0.05L0.42 0.25M-0.42 0.25Q-0.2 0.0 0.0 0.2Q0.2 0.35 0.42 0.1" fill="none" stroke="${color}" stroke-width="0.09" stroke-linejoin="round"/>`);
const LIV_AURA = {
  color: AURA.sky,
  base: (g) => rect(-1, 0, g.L + 2, 2.35, AURA.skirt) + rect(-1, 10.9, g.L + 2, 3, AURA.deep) +
    g.lay.doors.slice(0, 1).map((x) => circle(x - 3.0, 9.4, 2.4, "#ffffff") + auraMark(g.c, x - 3.0, 9.4, 2.6, AURA.sky)).join(""),
  window: (g, a, b) => darkWin(a, b, "#243b6b"),
  door: (g, x) => doorPlain(AURA.door, { plate: "#d9dde2" })(g, x),
  cab: (g) => lowNose(AURA.skirt) + path(`M-1 0L-1 7.0C1.6 7.0 3.6 6.2 5.0 5.0C6.0 4.0 6.8 3.0 8.4 2.35L-1 2.35Z`, AURA.grey) + rect(-1, 0, 12, 2.35, AURA.grey) +
    path(`M2.4 10.0C5.0 12.0 8.0 12.3 11.0 12.0C14.0 11.6 17.0 11.0 22.0 10.9L22 14L2.0 14Z`, AURA.deep) + sncf(g.c, 11.8, 8.4, 0.85) +
    circle(18.6, 8.3, 0.75, "#ffffff") + auraMark(g.c, 18.6, 8.25, 1.0, AURA.sky) + T(g.c, 18.6, 7.0, 0.55, "La Région", "#ffffff", { weight: 600 }) + T(g.c, 18.6, 6.4, 0.25, "Auvergne-Rhône-Alpes", "#ffffff", { weight: 500 }),
  over: (g) => {
    const [a, b] = groups(g.lay).at(-1);
    return T(g.c, (a + b) / 2, 10.1, 0.95, "LA RÉGION VOUS TRANSPORTE", "#ffffff", { weight: 500, family: "'Roboto Condensed', 'Arial Narrow', Arial, sans-serif", spacing: "0.06em", stretch: 0.82 }) +
      circle(b - 9.0, 3.4, 0.6, "#ffffff") + auraMark(g.c, b - 9.0, 3.38, 0.8, AURA.sky) + T(g.c, b - 8.1, 3.55, 0.62, "La Région", "#ffffff", { weight: 600, anchor: "start" }) +
      T(g.c, b - 8.1, 2.85, 0.42, "Auvergne-Rhône-Alpes", "#ffffff", { weight: 500, anchor: "start" });
  },
};

// --- Occitanie, liO (Z 54935 at Toulouse 2026, Z 549xx at Latour-de-Carol
// 2026, B 83591 at Luchon 2025): red all over, dark grey along the foot;
// yellow doors; yellow dashes and dots slanting across the side; "liO"
// in white with the region's mark by the cab.
const LIO = { red: "#e1242b", grey: "#54585e", yellow: "#f2c500" };
function lioDashes(x) {
  // The cluster of long round-ended dashes and dots, slanting up to the
  // right across the side (B 83500 600, Montréjeau 2025).
  const Y = "#e6d64a", st = (x0, y0, len) => `<path d="M${n(x0)} ${n(y0)}l${n(len * 0.58)} ${n(len)}" stroke="${Y}" stroke-width="0.62" stroke-linecap="round" fill="none"/>`;
  return st(x, 2.6, 2.2) + st(x + 1.0, 4.4, 5.6) + st(x + 3.4, 6.6, 3.4) + st(x + 4.6, 5.2, 5.6) + st(x + 6.4, 8.8, 1.8) +
    circle(x + 0.6, 6.0, 0.36, Y) + circle(x + 1.4, 7.6, 0.36, Y) + circle(x + 3.0, 10.0, 0.36, Y) + circle(x + 4.4, 9.2, 0.36, Y) + circle(x + 8.6, 10.4, 0.42, Y);
}
const LIV_LIO = {
  color: LIO.red,
  base: (g) => rect(-1, 0, g.L + 2, 2.6, LIO.grey) + groups(g.lay).slice(-1).map(([a]) => lioDashes(a + 0.5)).join(""),
  window: (g, a, b) => darkWin(a, b, "#4a4e54"),
  door: (g, x) => doorPlain(LIO.yellow)(g, x),
  // "liO" in white behind the crew door, "SERVICE PUBLIC OCCITANIE
  // TRANSPORTS" small ahead of it, then the region's mark: the gold
  // Occitan cross over "La Région Occitanie" in a white-edged panel
  // (Z 54935, Toulouse 2026).
  cab: (g) => lowNose(LIO.grey) + sncf(g.c, 8.4, 8.2, 0.85) + T(g.c, 18.6, 7.7, 1.9, "liO", "#ffffff", { weight: 300, family: "'Helvetica Neue', Arial, sans-serif" }) +
    ["SERVICE", "PUBLIC", "OCCITANIE", "TRANSPORTS"].map((w, k) => T(g.c, 16.9, 8.5 - k * 0.32, 0.2, w, "#ffffff", { weight: 600, anchor: "end" })).join("") +
    rect(20.4, 6.3, 1.5, 2.9, "none", 0, `rx="0.1" stroke="#ffffff" stroke-width="0.6" ${STROKE}`) + occCross(g.c, 21.15, 8.15, 1.0, { square: false }) +
    T(g.c, 21.15, 7.0, 0.17, "La Région", "#ffffff", { weight: 600 }) + T(g.c, 21.15, 6.72, 0.2, "Occitanie", "#ffffff", { weight: 600 }),
};
// --- Carmillon (the B 85000 "Coradia Liner" Régiolis, 6 cars, which TER
// Grand Est runs Paris-Est-Troyes-Mulhouse since 2025; B 85055 at
// Moulins 2025, B 85069 at Belfort 2024, B 85043/45 2024-2025): white; the
// roof's edge dark grey; the windows in a dark grey band with a carmine
// line along its top; carmine doors; on the cab a black cap round the
// windshield and a carmine stripe sweeping up from the nose to the roof; a
// white "2" on the window by each door.
const CAR = { white: "#eef0f1", dark: "#3d4147", carmine: "#c8126e", black: "#1f2125", skirt: "#8f959b" };
const LIV_CAR = {
  color: CAR.white,
  base: (g) => rect(-1, 0, g.L + 2, 2.35, CAR.skirt) + rect(-1, 11.3, g.L + 2, 3, CAR.dark) +
    groups(g.lay).map(([a, b]) => rect(a - 0.6, 3.9, b - a + 1.2, 5.4, CAR.dark) + rect(a - 0.6, 9.3, b - a + 1.2, 0.32, CAR.carmine)).join(""),
  window: (g, a, b) => pane(a, G.winLo, b - a, G.winHi - G.winLo, 0.4, "#1d2024"),
  door: (g, x) => doorPlain(CAR.carmine)(g, x) + T(g.c, x - 1.3, 7.9, 1.1, "2", "#ffffff", { weight: 700 }),
  cab: (g) => lowNose(CAR.skirt) + rect(-1, 0, 22, 2.35, CAR.white) + path(`M-1 5.4C1.2 6.6 3.2 9.0 4.8 11.0C6.2 12.4 8.6 12.9 11.6 ${G.roof}L11.6 14L-1 14Z`, CAR.black) +
    path(`M1.2 4.0C3.4 5.2 5.6 7.6 7.6 9.8C9.0 11.2 10.4 11.7 12.4 11.8L13.4 11.3C11.4 11.0 10.2 10.4 8.8 9.0C6.8 6.8 4.6 4.4 2.4 3.4Z`, CAR.carmine) + sncf(g.c, 17.6, 8.2, 0.85),
};
// --- Provence-Alpes-Côte d'Azur (B 84611 at Marseille-Saint-Charles and
// on the Côte Bleue, 2024): silver, the roof's edge and cab cap blue; the
// side between the doors in the region's band of Provence, orange with
// slanting red pales and white lozenges bearing the region's arms.
const PRV = { silver: "#cdd0d3", blue: "#2c3fae", orange: "#f5a623", red: "#e4312b", skirt: "#8e9399" };
function provence(c, a, b, y0 = 2.6, y1 = 10.9) {
  let s = rect(a, y0, b - a, y1 - y0, PRV.orange);
  for (let x = a + 0.4, i = 0; x < b - 0.4; x += 1.5, i++) {
    if (i % 5 === 2) s += path(poly([[x, y1 - 0.2], [x + 1.6, (y0 + y1) / 2], [x, y0 + 0.2], [x - 1.6, (y0 + y1) / 2]]), "#f7f6f2") +
      markAt(c, x, (y0 + y1) / 2, 1.6, i % 2 ? '<path d="M-0.3 0.2Q-0.1 -0.4 0.25 -0.1Q0.1 0 0.3 0.25Z" fill="#2c4fa3"/>' : '<path d="M-0.25 0.3L-0.1 -0.3L0.1 -0.1L0.25 -0.35L0.2 0.3Z" fill="#d22e2a"/>');
    else s += path(poly([[x, y0], [x + 0.55, y0], [x + 0.95, y1], [x + 0.4, y1]]), PRV.red);
  }
  return s;
}
const LIV_PACA = {
  color: PRV.silver,
  base: (g) => {
    let s = rect(-1, 0, g.L + 2, 2.35, PRV.skirt) + rect(-1, 11.3, g.L + 2, 3, PRV.blue);
    const xs = [g.cab ? 22.5 : 0.4, ...g.lay.doors.flatMap((x) => [x, x + DOOR_W]), g.L - 0.4];
    for (let k = 0; k + 1 < xs.length; k += 2) if (xs[k + 1] - xs[k] > 2) s += provence(g.c, xs[k], xs[k + 1]);
    return s;
  },
  window: (g, a, b) => darkWin(a, b, "#3a3e44"),
  door: doorPlain(PRV.blue),
  cab: (g) => lowNose(PRV.skirt) + rect(-1, 0, 22, 2.35, PRV.silver) + path(`M2.4 10.0C5.0 12.0 8.0 12.3 11.0 12.0C14.0 11.7 17.0 11.3 22.0 11.3L22 14L2.0 14Z`, PRV.blue) + sncf(g.c, 17.8, 8.6, 0.85),
};
// --- The cross-border Régiolis (B 85500, Strasbourg–Kehl–Offenburg since
// May 2026; B 85539 at Offenburg, 2026-05-04): ultramarine all over, the
// cab's cap and the windows' surrounds darker; "SNCF VOYAGEURS" in white on
// the cab side.
const TFA = { blue: "#2b33a3", navy: "#1c2266", skirt: "#232766" };
const LIV_TFA = {
  color: TFA.blue,
  base: (g) => rect(-1, 0, g.L + 2, 2.35, TFA.skirt),
  window: (g, a, b) => darkWin(a, b, TFA.navy),
  door: doorPlain(TFA.blue, { plate: "#9ea3c9" }),
  cab: (g) => lowNose(TFA.skirt) + T(g.c, 18.6, 6.6, 0.75, "SNCF", "#ffffff", { weight: 800, italic: true }) + T(g.c, 18.6, 5.9, 0.3, "VOYAGEURS", "#ffffff", { weight: 600, spacing: 0.03 }),
};
// ===================== Tables =====================
const R = registry();
const TYPES = R.TYPES, MODELS = R.MODELS;
const SETS = {}, FACTS = {};
// One livery's set of cars: key prefix p (e.g. "terRgBfc"), the unit's kinds.
function family(p, name, liv, { diesel = false, peri = false } = {}) {
  const k = peri ? { ve: "pve", viu: "pviu", vi: "pvi" } : { ve: "ve", viu: "viu", vi: "vi" };
  R.addCab(`${p}Cab`, `${name} end car`, (c) => car(c, k.ve, { liv, diesel }), RL.ve);
  R.add(`${p}Acc`, `${name} access car (pantograph)`, (c) => car(c, k.viu, { liv, pan: true }), RL.viu, { pan: true });
  R.add(`${p}AccR`, `${name} access car (pantograph)`, (c) => facing(c, (m) => car(m, k.viu, { liv, pan: true })), RL.viu, { pan: true });
  R.add(`${p}Mid`, `${name} middle car`, (c) => car(c, k.vi, { liv }), RL.vi);
  if (!peri) {
    R.add(`${p}Div`, `${name} division car`, (c) => car(c, "vc", { liv }), RL.vc);
    R.add(`${p}DivR`, `${name} division car`, (c) => facing(c, (m) => car(m, "vc", { liv })), RL.vc);
  }
}
family("terRgBfc", "Régiolis (Z 54500/Z 51500), Mobigo", LIV_MOB);
family("terRgNor", "Régiolis (B 84500), TER Normandie", LIV_NOR, { diesel: true });
family("terRgPdl", "Régiolis (B 84500/Z 51500), TER Pays de la Loire", LIV_PDL, { diesel: true });
family("terRgNaq", "Régiolis (Z 51500), TER Nouvelle-Aquitaine", LIV_NAQ);
family("terRgNaqB", "Régiolis (B 84500/B 84800), TER Nouvelle-Aquitaine", LIV_NAQ, { diesel: true });
family("terRgHdf", "Régiolis (B 84500), TER Hauts-de-France", LIV_HDF, { diesel: true });
family("terRgGe", "Régiolis (B 84500/B 84800), fluo Grand Est", LIV_GE, { diesel: true });
family("terRgGeP", "Régiolis (B 83500), fluo Grand Est", LIV_GE, { diesel: true, peri: true });
family("terRgAura", "Régiolis (B 84500), TER Auvergne-Rhône-Alpes", LIV_AURA, { diesel: true });
family("terRgCar", "Régiolis Coradia Liner (B 85000), TER Grand Est", LIV_CAR, { diesel: true });
family("terRgPaca", "Régiolis (B 84500), TER Provence-Alpes-Côte d'Azur", LIV_PACA, { diesel: true });
family("terRgTfa", "Régiolis (B 85500), cross-border, TER Grand Est", LIV_TFA, { diesel: true });
family("terRgOcc", "Régiolis (Z 54900), liO (TER Occitanie)", LIV_LIO, { peri: true });
family("terRgOccB", "Régiolis (B 83500/B 84500), liO (TER Occitanie)", LIV_LIO, { diesel: true, peri: true });
// Four cars: end car, access car, middle car, end car turned round. Six:
// the two halves, each end car + access car + division car.
const four = (p) => [[`${p}Cab`, 1], [`${p}Acc`, 1], [`${p}Mid`, 1], [`${p}CabR`, 1]];
const six = (p) => [[`${p}Cab`, 1], [`${p}Acc`, 1], [`${p}Div`, 1], [`${p}DivR`, 1], [`${p}AccR`, 1], [`${p}CabR`, 1]];
SETS.rg6_bfc = set("Régiolis (Z 54500), six cars, Mobigo (TER Bourgogne-Franche-Comté)", ...six("terRgBfc"));
SETS.rg6_nor = set("Régiolis (B 84500), six cars, TER Normandie", ...six("terRgNor"));
SETS.rg4_pdl = set("Régiolis (B 84500), four cars, TER Pays de la Loire", ...four("terRgPdl"));
SETS.rg4e_naq = set("Régiolis (Z 51500), four cars, TER Nouvelle-Aquitaine", ...four("terRgNaq"));
SETS.rg4b_naq = set("Régiolis (B 84500/B 84800), four cars, TER Nouvelle-Aquitaine", ...four("terRgNaqB"));
SETS.rg6_hdf = set("Régiolis (B 84500), six cars, TER Hauts-de-France", ...six("terRgHdf"));
SETS.rg4_ge = set("Régiolis (B 84500/B 84800), four cars, fluo Grand Est", ...four("terRgGe"));
SETS.rg4p_ge = set("Régiolis (B 83500), four cars, fluo Grand Est", ...four("terRgGeP"));
SETS.rg4_aura = set("Régiolis (B 84500), four cars, TER Auvergne-Rhône-Alpes", ...four("terRgAura"));
SETS.rg4e_occ = set("Régiolis (Z 54900), four cars, liO (TER Occitanie)", ...four("terRgOcc"));
SETS.rg4b_occ = set("Régiolis (B 83500), four cars, liO (TER Occitanie)", ...four("terRgOccB"));
SETS.rg6_car = set("Régiolis Coradia Liner (B 85000), six cars, carmillon paint (TER Grand Est, Paris-Est–Troyes–Mulhouse)", ...six("terRgCar"));
SETS.rg4_nor = set("Régiolis (B 85900), four cars, TER Normandie", ...four("terRgNor"));
SETS.rg4_paca = set("Régiolis (B 84500), four cars, TER Provence-Alpes-Côte d'Azur", ...four("terRgPaca"));
SETS.rg4_tfa = set("Régiolis (B 85500), four cars, the cross-border paint (TER Grand Est)", ...four("terRgTfa"));
SETS.rg4_bfc = set("Régiolis (Z 51500), four cars, Mobigo (TER Bourgogne-Franche-Comté)", ...four("terRgBfc"));

// ===================== Facts =====================
const WPF = "https://fr.wikipedia.org/wiki/";
const RGF = { model: "Alstom Régiolis (Coradia Polyvalent)", builder: "Alstom (Reichshoffen)", built: "2013–2026", topSpeedMph: 99, source: `${WPF}Alstom_Coradia_Polyvalent` };
const about = {
  Bfc: "Bourgogne-Franche-Comté's Régiolis in the Mobigo paint: the six-car Z 54500 on Paris-Bercy–Dijon–Lyon, the four-car Z 51500 around Dijon, Besançon and Belfort.",
  Nor: "Normandy's six-car bimode Régiolis on Paris-Montparnasse–Granville, in the region's first paint with its green band of Normandy pictures.",
  Pdl: "The Pays de la Loire's Régiolis (Nantes–Cholet, Nantes–Les Sables-d'Olonne, Nantes–Pornic and Saint-Gilles).",
  Naq: "Nouvelle-Aquitaine's electric Régiolis on Bordeaux–Agen and Bordeaux–Hendaye.",
  NaqB: "Nouvelle-Aquitaine's bimode Régiolis (Bordeaux–Sarlat, Bordeaux–Pau–Tarbes, La Rochelle–Poitiers, Limoges).",
  Hdf: "Hauts-de-France's bimode Régiolis: Paris-Nord–Amiens–Boulogne–Calais, Paris–Laon, Amiens–Lille.",
  Ge: "Grand Est's regional bimode Régiolis (Épinal–Saint-Dié, Nancy–Remiremont, Strasbourg lines) in the fluo paint.",
  GeP: "Grand Est's periurban bimode Régiolis, two doors a car (Strasbourg–Haguenau, Strasbourg–Sarreguemines, Colmar–Metzeral).",
  Aura: "Auvergne-Rhône-Alpes's bimode Régiolis (Clermont-Ferrand–Lyon, Clermont–Nevers, Lyon–Paray-le-Monial) in its sky-blue paint.",
  Car: "The Coradia Liner (B 85000), built for Intercités; TER Grand Est runs them in their carmillon paint on Paris-Est–Troyes–Mulhouse and Paris–Bar-le-Duc.",
  Occ: "Occitanie's electric Régiolis (Z 54900) around Toulouse (Montauban, Latour-de-Carol, Narbonne) in the red liO paint.",
  Paca: "Provence-Alpes-Côte d'Azur's bimode Régiolis (Marseille–Gap–Briançon, Marseille–Aix–Pertuis, the Côte Bleue, Avignon–Carpentras).",
  Tfa: "The cross-border Régiolis ordered by Grand Est for its lines into Germany; on Strasbourg–Kehl–Offenburg since May 2026.",
  OccB: "Occitanie's bimode Régiolis (Toulouse–Albi–Rodez, Mazamet, Auch, Luchon) in the liO paint.",
};
const series = { Bfc: "Z 54500 / Z 51500", Nor: "B 84500", Pdl: "B 84500 / Z 51500", Naq: "Z 51500", NaqB: "B 84500 / B 84800", Hdf: "B 84500", Ge: "B 84500 / B 84800",
  GeP: "B 83500", Aura: "B 84500", Car: "B 85000 (Coradia Liner)", Paca: "B 84500", Tfa: "B 85500", Occ: "Z 54900", OccB: "B 83500 / B 84500" };
for (const r of Object.keys(about)) {
  const p = `terRg${r}`, diesel = /^B/.test(series[r]);
  const base = { ...RGF, model: `Alstom Régiolis (${series[r]})`, type: diesel ? "Bimode (electric and diesel) multiple unit" : "Electric multiple unit", powerHp: diesel ? 2400 : 3400 };
  for (const [k, part, len] of [["Cab", "End car with the cab and a motor truck.", RL.ve], ["Acc", "The access car next to the end car: the wheelchair places and the pantograph.", RL.viu],
    ["Mid", "A middle car.", RL.vi], ["Div", "A six-car set's middle car where its two halves meet.", RL.vc]]) {
    if (!TYPES[p + k]) continue;
    const f = { ...base, lengthFt: len, about: `${part} ${about[r]}` };
    FACTS[p + k] = f;
    if (TYPES[`${p + k}R`]) FACTS[`${p + k}R`] = f;
  }
}

return { TYPES, MODELS, SETS, FACTS, FLEET: typeof FLEET === "undefined" ? [] : FLEET };
})();

// =====================================================================
// DD
// =====================================================================
const PART_DD = (() => {

// TER's double-deck electric multiple units: Bombardier (now Alstom) Regio
// 2N and Omneo Premium, Alstom's TER 2N NG (Z 24500, Z 26500) and TER 2N
// PG (Z 23500). Trainsheet's own side views at the shared scale, measured
// off photographs (Wikimedia Commons, 2019-2026).
//
// Regio 2N (fr/en Wikipedia, and the cars' own length markings): single-
// deck cars carry the doors, toilets, bicycle places and the roof equipment
// and alternate with double-deck cars, which have no doors; each car rides
// on its own two trucks. One end car is single-deck (Es: its door near its
// inner end, the cab's truck 5.6 m back from the nose), the other double-
// deck (Ed: its door behind the cab). Lettered on the cars: access car
// 10.02 m, double-deck car 15.45 m; the end cars measured off broadsides of
// Z 56673 at Caen (Es 14.2 m) leaving 19.3 m for Ed, so that an eight-car
// unit (Ed A D A D A D Es) is 109.91 m and a ten-car one (two cars more)
// 135.375 m, as published. The six-car units (80.945 m: Ed A D A D Es) have
// shorter double-deck cars, 13.7 m. Heights off the same photographs: the
// double-deck roof's crown and the cab 4.32 m, the single-deck sides 3.3 m
// with the roof equipment over them to about 4.15 m.


const m = (v) => n(v * M2F); // metres to feet
const P = (pts) => pts.map((p) => (p[0] === "q" ? ["q", m(p[1]), m(p[2]), m(p[3]), m(p[4])] : [m(p[0]), m(p[1])])); // metre points to feet

// ===================== Shared =====================
// A body from its outline (path d), its paint clipped to it and shaded as
// every other drawing is; under: drawn first (trucks, gangways); top: after
// the outline (roof gear).
function shell(c, d, base, paint, under = "", top = "") {
  const id = newId();
  const ys = d.match(/-?\d+(\.\d+)?/g).map(Number).filter((_, i) => i % 2 === 1), lo = Math.min(...ys), hi = Math.max(...ys);
  const stop = (off, color, v, fb) => `<stop offset="${off}" stop-color="${color}" stop-opacity="${fb}" style="stop-opacity:var(${v},${fb})"/>`;
  const shade = `<linearGradient id="${id}-s" gradientUnits="userSpaceOnUse" x1="0" y1="${n(lo)}" x2="0" y2="${n(hi)}">` +
    stop(0, "#000", "--car-shade-low", 0.16) + '<stop offset="0.36" stop-color="#000" stop-opacity="0"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/>' +
    stop(0.8, "#fff", "--car-shade-high", 0.1) + '<stop offset="0.93" stop-color="#fff" stop-opacity="0"/>' + stop(1, "#000", "--car-shade-roof", 0.08) + "</linearGradient>";
  return under + `<path d="${d}" fill="${base}"/><clipPath id="${id}"><path d="${d}"/></clipPath><defs>${shade}</defs>` +
    `<g clip-path="url(#${id})">${paint}<rect x="-5" y="${n(lo)}" width="${n(c.L + 10)}" height="${n(hi - lo)}" fill="url(#${id}-s)"/></g>` +
    `<path d="${d}" fill="none" stroke="currentColor" stroke-width="0.8" ${STROKE}/>` + top;
}
// The rubber gangway bellows and the coupler at a coupled end (x: the end;
// heights in feet).
function joint(x, side, y0, y1) {
  const w = 0.5, x0 = side < 0 ? x : x - w;
  return rect(x0, y0, w, y1 - y0, C.rubber) + lines([[x0 + w / 2, y0 + 0.2, x0 + w / 2, y1 - 0.2]], "#3a3f45", 0.6) + rect(x0, 2.4, w, 0.6, "#2a2d31");
}
const trucks = (xs, top, d = 33, wb = m(2.5)) => xs.map((x) => truck(x, { wb, d, top })).join("");
// A window in its frame (fc), the glass inside.
const win = (x, y0, x1, y1, fc, r = 0.55) => (fc ? rect(x - 0.13, y0 - 0.13, x1 - x + 0.26, y1 - y0 + 0.26, fc, 0, `rx="${n(r + 0.12)}"`) : "") + pane(x, y0, x1 - x, y1 - y0, r, "#1c1e22");
// A window given in metres [x0, x1, y0, y1].
const winM = ([a, b, y0, y1], fc, r) => win(m(a), m(y0), m(b), m(y1), fc, r);
// The bicycle pictogram, h ft tall.
function bikeSign(x, y, h, color = "#ffffff") {
  const r = h * 0.27, sw = n(h * 0.08);
  return `<g transform="translate(${n(x)} ${n(y)})" fill="none" stroke="${color}" stroke-width="${sw}"><circle cx="${n(-h * 0.4)}" cy="${n(-h * 0.15)}" r="${n(r)}"/><circle cx="${n(h * 0.4)}" cy="${n(-h * 0.15)}" r="${n(r)}"/>` +
    `<path d="M${n(-h * 0.4)} ${n(-h * 0.15)}L${n(-h * 0.1)} ${n(h * 0.25)}L${n(h * 0.28)} ${n(h * 0.25)}L${n(h * 0.4)} ${n(-h * 0.15)}M${n(-h * 0.1)} ${n(h * 0.25)}L${n(h * 0.05)} ${n(-h * 0.15)}"/></g>`;
}
// Roof equipment over a single-deck section, a..b ft, on the side's top
// (y ft): the slotted fairing along the roof's edge (Z 56673 car 7), the
// equipment standing above it in boxes of several heights, one domed.
function roofBoxes(a, b, y, yTop, fill, k, { fairing = "#b4b9bf", seed = 0 } = {}) {
  const fy = y + 0.95, w = (b - a) / k;
  let s = "";
  const H = [1.0, 0.82, 0.62, 0.9, 0.7];
  for (let i = 0; i < k; i++) {
    const x0 = a + i * w + 0.25, x1 = x0 + w - 0.5, h = (yTop - fy) * H[(i + seed) % H.length];
    if ((i + seed) % 4 === 2) s += path(`M${n(x0 + 0.4)} ${n(fy)}Q${n(x0 + 0.5)} ${n(fy + h * 1.05)} ${n((x0 + x1) / 2)} ${n(fy + h * 1.05)}Q${n(x1 - 0.5)} ${n(fy + h * 1.05)} ${n(x1 - 0.4)} ${n(fy)}Z`, "#a9afb6", 0.4);
    else s += rect(x0, fy - 0.1, x1 - x0, h + 0.1, fill, 0.4, 'rx="0.15"') + slats(x0 + 0.4, fy + h * 0.2, Math.min(2.6, (x1 - x0) * 0.4), h * 0.6, 0.28, "rgba(0,0,0,0.3)");
  }
  s += path(poly([[a, y - 0.05], [a + 0.3, fy], [b - 0.3, fy], [b, y - 0.05]]), fairing, 0.4);
  for (let x = a + 0.8; x < b - 1.4; x += 2.2) s += rect(x, y + 0.35, 1.5, 0.22, "#5d636b", 0, 'rx="0.1"');
  return s;
}

// ===================== Regio 2N geometry (metres) =====================
const G = { crown: 4.32, side: 3.3, dds: 3.68, land: 3.81, bot: 0.66, ddBot: 0.8, tTop: 0.86, door: [0.81, 3.01], win: [1.7, 2.59], low: [1.4, 2.25], hi: [2.38, 2.9],
  up: [3.33, 3.97], lo: [1.3, 2.25], landW: [2.06, 3.02] };
// The nose seen from the side, off Z 56673 (Caen): a deep rounded front,
// the windscreen wrapping round it, its top reaching the roof 1.5 m back.
const NOSE = [[0.85, 0.5], [0.5, 0.62], ["q", 0.25, 0.8, 0.2, 1.3], [0.15, 2.0], ["q", 0.18, 2.6, 0.45, 3.05], ["q", 0.75, 3.6, 1.05, 3.95], ["q", 1.35, 4.28, 1.75, G.crown]];
// The cab's roof behind the nose, stepping down to the single-deck side
// at the crew door.
const CAB_STEP = [[2.85, G.crown], ["q", 3.3, G.crown, 3.35, 4.05], [3.4, G.side + 0.15], ["q", 3.45, G.side, 3.6, G.side]];

// The cars, cab (if any) on the left. Windows [x0, x1, y0, y1]; doors [x0,
// x1]; saloon [x0, x1] where the double-deck roof stands; landing [x0, x1]
// where a double-deck car's roof is low (equipment over it); trucks.
const D_LO = [[2.73, 3.32], [3.69, 5.17], [5.56, 6.99], [7.43, 8.83], [9.19, 10.58], [10.95, 12.29]];
const D_UP = [[2.8, 3.41], [3.78, 5.25], [5.64, 7.09], [7.47, 8.87], [9.22, 10.61], [10.93, 11.46]];
const deck = (list, [y0, y1], dx = 0) => list.map(([a, b]) => [a + dx, b + dx, y0, y1]);
const KIND = {
  // Single-deck end car, 14.2 m: cab, crew door, the high window over the
  // equipment hatch, two low windows, the door, a window by the gangway.
  Es: { L: 14.2, cab: true, crew: [2.37, 3.34], doors: [[10.33, 12.2]], trucks: [5.6, 13.2], saloon: null,
    wins: [[4.69, 5.67, ...G.hi], [6.55, 8.0, ...G.low], [8.37, 9.81, ...G.low], [12.5, 13.8, ...G.win]], hatch: [4.45, 5.9] },
  // Double-deck end car, 19.3 m: cab, crew door, a window, the door, then
  // the saloon (windows as a double-deck car's, mirrored).
  Ed: { L: 19.3, cab: true, crew: [2.37, 3.34], doors: [[4.9, 6.8]], trucks: [5.6, 18.05], saloon: [7.05, 17.55],
    wins: [[3.75, 4.6, ...G.win], ...deck(D_LO, G.lo, 4.62), ...deck(D_UP, G.up, 4.62)] },
  // Access car, 10.02 m: windows at its ends, two double doors, the
  // bicycle window between them.
  A: { L: 10.02, doors: [[2.4, 4.3], [6.1, 8.0]], trucks: [1.8, 8.22], saloon: null, bike: [4.65, 5.6],
    wins: [[0.6, 1.85, ...G.win], [4.65, 5.6, ...G.win], [8.25, 9.45, ...G.win]] },
  // BreizhGo's and Nouvelle-Aquitaine's access cars: the bicycle windows at
  // the ends, a panel between the doors.
  Ab: { L: 10.02, doors: [[2.3, 4.2], [5.85, 7.75]], trucks: [1.8, 8.22], saloon: null, bike: [0.65, 1.9], bike2: [8.15, 9.4],
    wins: [[0.65, 1.9, ...G.win], [8.15, 9.4, ...G.win]] },
  // Omneo Premium's: a small window, the doors, the region's panel between
  // them, the luggage-area window (Z 56673 car 7).
  Ao: { L: 10.02, doors: [[2.35, 4.15], [5.85, 7.65]], trucks: [1.8, 8.22], saloon: null,
    wins: [[0.45, 1.75, ...G.win], [8.1, 9.6, 1.55, 2.75]] },
  // Double-deck car, 15.45 m: the landing at its left end (low roof with the
  // air conditioning, a window at landing height), the saloon's six windows
  // a deck.
  D: { L: 15.45, doors: [], trucks: [1.75, 14.21], saloon: [2.45, 13.7], landing: [0, 2.45],
    wins: [[0.47, 2.01, ...G.landW], ...deck(D_LO, G.lo), ...deck(D_UP, G.up)] },
  // The six-car units' double-deck car, 13.7 m: five windows a deck.
  Ds: { L: 13.7, doors: [], trucks: [1.75, 12.46], saloon: [2.45, 11.95], landing: [0, 2.45],
    wins: [[0.47, 2.01, ...G.landW], ...deck(D_LO.slice(0, 5), G.lo), ...deck(D_UP.slice(0, 5), G.up)] },
};

function outline(k) {
  const L = k.L, x1 = L - 0.12;
  const top = [];
  if (k.cab) top.push(...NOSE, ...(k.saloon ? [[2.85, G.crown], ["q", 3.3, G.crown, 3.35, 4.05], [3.4, G.side + 0.15], ["q", 3.45, G.side, 3.6, G.side]] : CAB_STEP));
  else top.push([0.12, k.saloon ? G.ddBot + 0.3 : G.bot + 0.3], [0.12, (k.landing ? G.land : G.side) - 0.25], ["q", 0.12, k.landing ? G.land : G.side, 0.4, k.landing ? G.land : G.side]);
  if (k.saloon) {
    const [a, b] = k.saloon;
    if (k.landing) top.push([a - 0.3, G.land], ["q", a, G.land, a + 0.05, G.land + 0.2], ["q", a + 0.15, G.crown, a + 0.6, G.crown]);
    else top.push([a - 0.25, G.side], ["q", a, G.side, a + 0.05, G.side + 0.25], ["q", a + 0.25, G.crown, a + 0.9, G.crown]);
    // the far end: the roof curves down to the car's end.
    top.push([b, G.crown], ["q", L - 0.5, G.crown, x1, G.dds - 0.05]);
  } else top.push([x1 - 0.3, G.side], ["q", x1, G.side, x1, G.side - 0.25]);
  top.push([x1, k.saloon && !k.cab ? G.ddBot + 0.3 : G.bot + 0.3]);
  // The bottom, right to left, flat (the trucks under it).
  const lowY = k.saloon && !k.cab ? G.ddBot : G.bot;
  const bot = [[x1, lowY], [k.cab ? 0.85 : 0.12, k.cab ? 0.5 : lowY]];
  return poly(P([...top, ...bot]));
}

// The cab, seen from the side: the windscreen's dark edge round the nose,
// the headlight, the crew door and its window.
function cabSide(c, k, liv) {
  let s = path(poly(P([[0.2, 2.05], ["q", 0.22, 2.62, 0.48, 3.06], ["q", 0.78, 3.6, 1.08, 3.95], ["q", 1.3, 4.18, 1.55, 4.22], [1.5, 4.0], ["q", 1.15, 3.6, 0.92, 3.1], ["q", 0.72, 2.6, 0.5, 2.05]])), "#1b1e23") +
    path(poly(P([[0.5, 2.6], ["q", 0.7, 3.15, 1.05, 3.6], [1.15, 3.55], ["q", 0.85, 3.1, 0.68, 2.6]])), C.glassLight, 0, 'opacity="0.55"');
  // The headlight under the windscreen.
  s += path(poly(P([[0.2, 1.62], ["q", 0.22, 1.98, 0.5, 2.02], [1.05, 1.98], ["q", 1.12, 1.75, 0.95, 1.6], [0.3, 1.5]])), liv.lampRim || "#3a3f45") + circle(m(0.42), m(1.78), 0.3, "#f4f0dc");
  const [a, b] = k.crew;
  s += rect(m(a), m(1.1), m(b - a), m(2.34), "none", 0, `rx="0.3" stroke="rgba(0,0,0,0.45)" stroke-width="0.6" ${STROKE}`) +
    pane(m(a + 0.12), m(2.59), m(b - a - 0.24 - 0.5), m(0.63), 0.3, "#1c1e22") + line(m(b) + 0.4, m(1.3), m(b) + 0.4, m(2.6), "#8a9098", 0.8) + line(m(a) - 0.4, m(1.3), m(a) - 0.4, m(2.6), "#8a9098", 0.8);
  return s;
}
// A double door: leaves, their tall windows, and the sill plate.
const door = (c, [a, b], liv) => leaves(m(a), m(b - a), m(G.door[0]), m(G.door[1]), liv.door, { glass: [0.36, 0.84], gw: 0.38, r: 0.6, seam: liv.seam || "#2b2e33" });

function r2nCar(c, kindKey, liv, o = {}) {
  const k = KIND[kindKey], L = c.L;
  const g = { L, k, kind: kindKey, o };
  let paint = rect(-1, 0, L + 2, 20, liv.body) + (liv.paint ? liv.paint(c, g) : "");
  // The glazing bands over the double-deck saloon's windows (and the end
  // cars' low windows), where the livery has them.
  if (liv.band && k.saloon) {
    const [a, b] = k.saloon, lw = k.wins.filter((w) => w[2] === G.lo[0]), uw = k.wins.filter((w) => w[2] === G.up[0]);
    if (lw.length) paint += rect(m(lw[0][0] - 0.18), m(G.lo[0] - 0.12), m(lw[lw.length - 1][1] - lw[0][0] + 0.36), m(G.lo[1] - G.lo[0] + 0.24), liv.band);
    if (uw.length) paint += rect(m(uw[0][0] - 0.18), m(G.up[0] - 0.1), m(uw[uw.length - 1][1] - uw[0][0] + 0.36), m(G.up[1] - G.up[0] + 0.2), liv.band);
  }
  if (liv.band && kindKey === "Es") paint += rect(m(6.4), m(G.low[0] - 0.1), m(3.56), m(G.low[1] - G.low[0] + 0.2), liv.band);
  for (const w of k.wins) paint += winM(w, liv.frame, 0.5);
  if (k.bike && liv.bikes !== false) paint += bikeSign(m((k.bike[0] + k.bike[1]) / 2), m(2.15), 1.5);
  if (k.bike2 && liv.bikes !== false) paint += bikeSign(m((k.bike2[0] + k.bike2[1]) / 2), m(2.15), 1.5);
  if (k.hatch) paint += rect(m(k.hatch[0]), m(1.05), m(k.hatch[1] - k.hatch[0]), m(0.68), "none", 0, `rx="0.2" stroke="rgba(0,0,0,0.35)" stroke-width="0.5" ${STROKE}`);
  for (const d of k.doors) paint += door(c, d, liv);
  if (k.cab) paint += cabSide(c, k, liv);
  paint += liv.over ? liv.over(c, g) : "";
  // Under: the trucks, the bellows, the coupler at the nose.
  const ty = m(G.tTop);
  let under = trucks(k.trucks.map(m), m(k.saloon && !k.cab ? G.ddBot : G.bot) + 0.1, 33);
  if (c.coupledR) under += joint(L, 1, m(0.9), m(k.saloon && !k.cab ? 3.5 : 3.1));
  if (c.coupledL && !k.cab) under += joint(0, -1, m(0.9), m(k.saloon || k.landing ? 3.5 : 3.1));
  if (k.cab) under += c.coupledL ? coupledCouplers(m(0.95)) : autoCoupler(m(0.85), m(0.95));
  // Roof: the equipment over the single-deck sections and the landing; a
  // pantograph on the access cars that carry one.
  const gear = liv.gear || "#7d838a";
  let top = "";
  if (!k.saloon) {
    const a = k.cab ? m(3.7) : 0.6, b = L - 0.6;
    if (o.pan) {
      const px = m(1.75);
      top += roofBoxes(px + m(1.3), b, m(G.side), m(4.15), gear, 3, { seed: 1 }) + path(poly([[0.6, m(G.side) - 0.05], [0.9, m(G.side) + 0.95], [px + m(1.2), m(G.side) + 0.95], [px + m(1.3), m(G.side) - 0.05]]), "#b4b9bf", 0.4) +
        rect(px - 2.9, m(G.side) + 0.95, 5.8, 0.3, "#5d636c", 0.4, 'rx="0.1"') + pantograph(px, m(G.side) + 1.25, { up: true, facing: -1 });
    } else top += roofBoxes(a, b, m(G.side), m(4.15), gear, k.cab ? 5 : 3, { seed: k.cab ? 0 : 3 });
  } else if (k.landing) top += rect(m(k.landing[0]) + 0.5, m(G.land) - 0.05, m(k.landing[1] - k.landing[0]) - 1.1, m(G.crown - G.land - 0.03), gear, 0.4, 'rx="0.2"') +
    circle(m(k.landing[0] + 0.8), m(G.land + 0.26), 0.62, "#5d636b") + circle(m(k.landing[0] + 0.8), m(G.land + 0.26), 0.35, "none", 0, 'stroke="#8d939a" stroke-width="0.12"') +
    slats(m(k.landing[0] + 1.25), m(G.land + 0.08), m(0.8), m(0.36), 0.25, "rgba(0,0,0,0.3)");
  else if (k.cab) top += roofBoxes(m(3.7), m(k.saloon[0]) - 0.3, m(G.side), m(4.15), gear, 2, { seed: 2 });
  return shell(c, outline(k), liv.body, paint, under, top);
}

const R2N = { G, KIND, r2nCar, NOSE };

// ===================== Regio 2N liveries =====================
// Shapes in metres, clipped to the body. A cab's cap swept back from the
// headlights to the crew door (CVL, HdF, PACA, liO), or covering the whole
// cab to just ahead of the crew door (Pays de la Loire, Centre's Omneo).
const sweepCap = (fill, edge = null) => path(poly(P([[-0.5, 1.42], [0.55, 1.45], ["q", 1.7, 1.75, 2.3, 3.05], [2.33, 5], [-0.5, 5]])), fill) +
  (edge ? path(poly(P([[-0.5, 1.32], [0.55, 1.35], ["q", 1.78, 1.66, 2.42, 3.05], [2.42, 3.4], [2.33, 3.4], [2.3, 3.05], ["q", 1.7, 1.75, 0.55, 1.47], [-0.5, 1.45]])), edge) : "");
const fullCap = (fill, x = 2.25, y0 = 0.82) => rect(-1, m(y0), m(x) + 1, 20, fill);
const SILVER = "#c5c9cd", GREY_SKIRT = "#8f959c";
const skirt = (L, y = 0.95, fill = GREY_SKIRT) => rect(-1, 0, L + 2, m(y), fill);
// SNCF's logo on the cab's side (and on the front, seen edge-on, left out).
const cabLogo = (c, liv) => sncf(c, m(liv.logoX ?? 1.65), m(2.12), m(0.36), { voyageurs: !!liv.voyageurs });
// The class numeral by a door (pink on BreizhGo, white or grey elsewhere).
const num = (c, x, y, cls, fill, h = 0.42) => T(c, m(x), m(y), m(h), cls, fill, { weight: 700 });

const LIV = {};
// A logo laid out as seen (mark at the left, text after it) on either side
// of the train: seen(c, x0, W) maps an offset u from the logo's left as seen
// to the drawing's x; START is the text anchor that reads from there.
const seen = (c, x0, W) => (u) => (c.mirrored ? x0 + W - u : x0 + u);
const START = (c) => (c.mirrored ? "end" : "start");
// Centre-Val de Loire (Z 55500 on Paris-Chartres-Le Mans; 506L, 2019, and
// the units at Chartres and Paris-Montparnasse 2023-2026): silver, the cab's
// cap and the doors TER blue, the saloons' windows in dark grey bands.
const TER_BLUE = "#2a3c9e";
LIV.cvl = { name: "TER Centre-Val de Loire", body: SILVER, door: TER_BLUE, frame: "#d7d9d6", band: "#4a4e55",
  paint: (c, g) => skirt(g.L) + (g.k.cab ? sweepCap(TER_BLUE) : ""),
  over: (c, g) => (g.k.cab ? cabLogo(c, {}) : "") + (g.kind === "D" ? cvlHeart(c, m(1.2), m(2.55)) : "") };
// Hauts-de-France (Z 55500, Paris-Nord-Amiens/Saint-Quentin; Paris-Nord 2024-
// 2026): silver, the cab's cap blue, green doors; the region's mark and a
// green band on the double-deck cars.
const HDF_BLUE = "#2b3a9a", HDF_GREEN = "#3fae49";
LIV.hdf = { name: "TER Hauts-de-France", body: SILVER, door: HDF_GREEN, frame: "#d7d9d6", band: "#4a4e55",
  paint: (c, g) => skirt(g.L) + (g.k.cab ? sweepCap(HDF_BLUE) : ""),
  over: (c, g) => (g.k.cab ? cabLogo(c, {}) : "") + (g.kind === "Es" ? hdfMark(c, m(3.75), m(1.98), m(0.35)) : "") };
// BreizhGo (Z 55500 in Bretagne; Rennes, October 2025): silver-grey, the
// saloons' windows in anthracite bands with gold frames, the nose's front
// anthracite with the white bands of the Gwenn-ha-du across it, the doors
// anthracite with pink class numerals; "BREIZHGO" in a black box with blue
// rays on the double-deck cars; the region's ermine mark behind the cab.
const BZH = { body: "#c3c7cb", dark: "#3a3d42", pink: "#e6007e", ray: "#3d8fd1" };
LIV.bzh = { name: "BreizhGo", body: BZH.body, door: BZH.dark, frame: "#b8a27a", band: BZH.dark, layoutA: "Ab", gear: "#64696f",
  paint: (c, g) => {
    const L = g.L;
    let s = skirt(L, 0.95, "#9aa0a6");
    // The double-deck saloon's upper side anthracite, from the crown down
    // to just under the upper windows.
    if (g.k.saloon) s += rect(m(g.k.saloon[0]) - 0.5, m(3.2), m(g.k.saloon[1] - g.k.saloon[0]) + 1.0, 6, BZH.dark);
    if (g.kind === "Ab") s += rect(m(4.2), m(0.7), m(1.65), m(2.31), BZH.dark);
    if (g.k.cab) {
      // The nose's top: black over the windscreen and back over the cab's
      // roof to the crew door, the Gwenn-ha-du's white bands across it.
      const rx = (y) => (y >= 3.6 ? 2.3 : 0.6 + 1.7 * Math.pow((y - 2.05) / 1.55, 0.8));
      s += path(poly(P([[-0.5, 2.05], [0.6, 2.05], ...[2.4, 2.8, 3.2, 3.6].map((y) => [rx(y), y]), [2.3, 5], [-0.5, 5]])), "#1c1e21");
      for (let i = 0; i < 7; i++) { const y = 2.3 + i * 0.27; s += path(poly(P([[-0.5, y], [rx(y) - 0.02, y], [rx(y + 0.11) - 0.02, y + 0.11], [-0.5, y + 0.11]])), "#f4f4f2"); }
    }
    return s;
  },
  over: (c, g) => {
    let s = g.k.cab ? cabLogo(c, { logoX: 1.55 }) + bzhRegion(c, m(g.kind === "Es" ? 4.45 : 9.0), m(2.2)) + (g.kind === "Es" ? T(c, m(5.55), m(2.05), m(0.42), "ter", "#2d3a4a", { weight: 400, italic: true, family: "Georgia, serif" }) : "") : "";
    if (g.kind === "D" || g.kind === "Ds") s += bzhRays(c, g.L / 2 + m(0.6), m(2.72)) + bzhErmine(c, g.L - m(1.25), m(2.35));
    for (const d of g.k.doors) {
      s += rect(m(d[0] + 0.15), m(G.door[1] - 0.12), m(d[1] - d[0] - 0.3), m(0.07), "#3d8fd1");
      for (const x of [d[0] - 0.2, d[1] + 0.2]) s += num(c, x, 2.35, "1", BZH.pink, 0.3) + num(c, x, 1.95, "2", BZH.pink, 0.3);
    }
    return s;
  } };
function bzhRays(c, x, y) {
  let s = "";
  for (let i = -3; i <= 3; i++) s += path(`M${n(x - 6.5)} ${n(y + i * 0.22)}Q${n(x - 3)} ${n(y + i * 0.55)} ${n(x - 2.2)} ${n(y + i * 0.18)}`, "none", 0, `stroke="${BZH.ray}" stroke-width="0.14"`) +
    path(`M${n(x + 6.5)} ${n(y + i * 0.22)}Q${n(x + 3)} ${n(y + i * 0.55)} ${n(x + 2.2)} ${n(y + i * 0.18)}`, "none", 0, `stroke="${BZH.ray}" stroke-width="0.14"`);
  return s + rect(x - 2.9, y - 0.65, 5.8, 1.3, "#1e2023", 0, 'rx="0.12"') + T(c, x - 0.9, y, 0.68, "BREIZH<tspan fill=\"#5aa9e6\">GO</tspan>", "#ffffff", { weight: 800, spacing: 0.02 });
}
// PACA (Z 55500, Grasse-Nice-Ventimiglia, Les Arcs-Nice; Nice and Grasse,
// 2024-2025): silver, the cab's cap and the doors blue, a blue band over the
// upper windows; the "Train Express Régional" band of the region's arms and
// stripes in orange, red, blue and white between the decks.
const PACA = { blue: "#2c3fae", orange: "#f5a623", red: "#e4312b", deep: "#1f2f86" };
LIV.paca = { name: "TER Provence-Alpes-Côte d'Azur", body: SILVER, door: PACA.blue, frame: "#e7e8e6",
  paint: (c, g) => skirt(g.L) + (g.k.cab ? sweepCap(PACA.blue) : "") + (g.k.saloon ? rect(m(g.k.saloon[0]), m(3.12), m(g.k.saloon[1] - g.k.saloon[0]) + 2, 6, PACA.blue) : "") +
    provenceBand(c, g),
  over: (c, g) => (g.k.cab ? cabLogo(c, {}) : "") };
// The band: red and orange stripes slanting, the arms' white lozenges.
function provenceBand(c, g) {
  const k = g.k;
  let a, b, y0, y1;
  if (g.band) [a, b, y0, y1] = g.band.map(m);
  else if (k.saloon) { a = m(k.saloon[0] + 0.4); b = m(k.saloon[1] - 0.1); y0 = m(2.25); y1 = m(3.1); }
  else if (g.kind === "Es") { a = m(6.4); b = m(10.2); y0 = m(2.25); y1 = m(3.05); }
  else { a = m(0.3); b = m(2.3); y0 = m(2.65); y1 = m(3.05); }
  let s = rect(a, y0, b - a, y1 - y0, PACA.orange);
  for (let x = a + 0.6, i = 0; x < b; x += 1.25, i++) {
    if (i % 6 === 3 || i % 6 === 4) { s += path(poly([[x - 0.2, y0], [x + 2.2, y0 + (y1 - y0) / 2], [x - 0.2, y1], [x - 2.6, y0 + (y1 - y0) / 2]]), "#f7f6f2") +
      markAt(c, x - 0.2, y0 + (y1 - y0) / 2, 1.2, i % 2 ? '<path d="M-0.3 0.2Q-0.1 -0.4 0.25 -0.1Q0.1 0 0.3 0.25Z" fill="#2c4fa3"/>' : '<path d="M-0.25 0.3L-0.1 -0.3L0.1 -0.1L0.25 -0.35L0.2 0.3Z" fill="#d22e2a"/>'); }
    else s += path(poly([[x, y0], [x + 0.5, y0], [x + 0.8, y1], [x + 0.3, y1]]), PACA.red);
  }
  return s;
}
// Auvergne-Rhône-Alpes (Z 55500; Lyon Part-Dieu 2023-2025): the region's
// sky blue over the cab with a white swoosh from the roof down to the
// headlight, big sky-blue diagonals across the silver cars, sky-blue doors;
// "La Région Auvergne-Rhône-Alpes" with its mountain mark behind the cab.
const AURA = { sky: "#2ea3e3", deep: "#1f86cf" };
LIV.aura = { name: "TER Auvergne-Rhône-Alpes", body: SILVER, door: AURA.sky, frame: "#e7e8e6", band: "#4a4e55",
  paint: (c, g) => {
    const L = g.L;
    let s = skirt(L);
    if (g.k.cab) s += fullCap(AURA.sky, 2.3, 0.6) + path(poly(P([[1.55, 4.5], [2.0, 4.5], ["q", 1.6, 2.8, 0.85, 1.45], [0.55, 1.45], ["q", 1.25, 2.8, 1.55, 4.5]])), "#f4f6f7");
    // one broad diagonal per car, rising toward the cab end
    const x0 = g.k.cab ? 7.0 : (g.kind === "A" ? 4.0 : 6.5), w = g.kind === "A" ? 2.6 : 4.2;
    s += path(poly(P([[x0, 0.9], [x0 + w, 0.9], [x0 + w + 2.6, 4.5], [x0 + 2.6, 4.5]])), AURA.sky);
    return s;
  },
  over: (c, g) => (g.k.cab ? cabLogo(c, { logoX: 3.9 }) + auraName(c, m(g.kind === "Es" ? 7.0 : 8.0), m(1.0)) : "") };
// Nouvelle-Aquitaine (Z 56300/56400, six cars; Pessac and La Réole 2022-
// 2025): silver, the nose's front dark grey round the windscreen, red doors
// with the region's lion in white, the windows in anthracite bands, the
// red ")))" and "La Région vous transporte" on the double-deck cars.
const NAQ = { red: "#d8232a", dark: "#4a4e55" };
LIV.naq = { name: "TER Nouvelle-Aquitaine", body: SILVER, door: NAQ.red, frame: "#d7d9d6", band: NAQ.dark, layoutA: "Ab", bikes: true,
  paint: (c, g) => skirt(g.L) + (g.k.cab ? path(poly(P([[-0.5, 1.45], [0.65, 1.5], ["q", 1.2, 2.6, 1.45, 4.5], [-0.5, 4.5]])), "#6b7077") : ""),
  over: (c, g) => {
    let s = g.k.cab ? cabLogo(c, { logoX: 1.95 }) + naqLion(c, m(4.2), m(2.45), m(0.55)) : "";
    if (g.kind === "D" || g.kind === "Ds") s += naqWaves(c, m(1.1), m(2.55), 1.6) + naqName(c, m(3.6), m(2.6), m(0.42));
    // The lion on a dark shield on each door leaf, under its window.
    for (const [a, b] of g.k.doors) for (const u of [0.25, 0.75]) s += naqLion(c, m(a + (b - a) * u), m(1.35), m(0.3), "#3a3d42");
    return s;
  } };
const naqWaves = (c, x, y, h) => [0, 1, 2].map((i) => path(`M${n(x + i * h * 0.5)} ${n(y + h)}Q${n(x + i * h * 0.5 + h * 0.55)} ${n(y)} ${n(x + i * h * 0.5)} ${n(y - h)}`, "none", 0, `stroke="${NAQ.red}" stroke-width="${n(h * 0.22)}"`)).join("");
// liO, Occitanie (Z 56300; Toulouse 2023-2025): silver, the cab's cap red
// edged in blue, a red band along the roof's edge, blue doors; the big
// "liO" ring on the double-deck cars, the region's cross behind the cab.
const LIO = { red: "#e8352f", blue: "#2b3590" };
LIV.occ = { name: "liO (TER Occitanie)", body: SILVER, door: LIO.blue, frame: "#e7e8e6",
  paint: (c, g) => skirt(g.L) + (g.k.cab ? sweepCap(LIO.red, LIO.blue) : "") + rect(-1, m(g.k.saloon ? 3.25 : 2.95), g.L + 2, m(0.35), LIO.red) +
    (g.kind === "D" || g.kind === "Ds" ? circle(m(8.0), m(2.0), m(1.45), "none", 0, `stroke="${LIO.blue}" stroke-width="${m(0.28)}" opacity="0.85"`) : ""),
  over: (c, g) => (g.k.cab ? cabLogo(c, { logoX: 1.7 }) + occCross(c, m(3.62), m(1.4), m(0.46)) + liO(c, m(3.98), m(1.4), m(0.46)) : "") };
// Pays de la Loire (Z 56500, Interloire; Le Croisic 2022, Cinq-Mars 2019):
// silver, the whole cab turquoise to just ahead of the crew door, magenta
// doors with a lime-yellow band beside each, the region's name.
const PDL = { teal: "#18a9c9", magenta: "#9b2a85", lime: "#e4ec1c" };
LIV.pdl = { name: "TER Pays de la Loire", body: SILVER, door: PDL.magenta, frame: "#c9b88f", band: "#4a4e55",
  paint: (c, g) => {
    let s = skirt(g.L) + (g.k.cab ? fullCap(PDL.teal, 2.25) + [[PDL.magenta, 2.02], ["#f4f5f2", 1.88], [PDL.lime, 1.74]].map(([f, x]) => path(poly(P([[x, 0.82], [x + 0.13, 0.82], ["q", x + 0.05, 1.5, x + 0.38, 2.0], [x + 0.25, 2.0], ["q", x - 0.08, 1.5, x, 0.82]])), f)).join("") : "");
    for (const [a, b] of g.k.doors) s += rect(m(a) - m(0.7), m(0.7), m(0.7), m(2.55), PDL.lime) + rect(m(b), m(0.7), m(0.25), m(2.55), PDL.magenta);
    return s;
  },
  over: (c, g) => (g.k.cab ? cabLogo(c, { logoX: 1.5 }) + T(c, m(1.2), m(1.55), m(0.32), "ter", "#ffffff", { weight: 400, italic: true, family: "Georgia, serif" }) : "") + (g.kind === "Es" || g.kind === "Ed" ? pdlName(c, m(g.kind === "Es" ? 7.4 : 8.3), m(2.75)) : "") };
// ----- Omneo Premium -----
// Normandie (Z 56600, Krono+ Paris-Rouen-Le Havre, Paris-Caen-Cherbourg;
// Z 56673 at Caen and 622XL at Gournay, 2023-2025): light grey above, a
// thin red line, then navy fading darker toward the floor, a light grey
// sill; the nose silver with the red line running down its side to the
// headlight; light grey doors; the Normandy flag "RÉGION NORMANDIE" on the
// cars; first class in the single-deck end car and part of car 3, the
// class in big white numerals.
const NOR = { navy: "#26355f", deep: "#1c2748", red: "#e0262e", grey: "#c9ccd0", door: "#d6d8dc" };
const norGrad = (c) => { const id = newId(); return { id, def: `<defs><linearGradient id="${id}" x1="0" y1="${m(2.75)}" x2="0" y2="${m(1.0)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${NOR.navy}"/><stop offset="1" stop-color="${NOR.deep}"/></linearGradient></defs>` }; };
LIV.nor = { name: "Normandie (Nomad)", body: NOR.grey, door: NOR.door, frame: "#c7c9cc", layoutA: "Ao", bikes: false, voyageurs: false,
  paint: (c, g) => {
    const gr = norGrad(c), L = g.L;
    let s = gr.def + rect(-1, m(1.12), L + 2, m(1.68), `url(#${gr.id})`) + rect(-1, m(2.72), L + 2, m(0.09), NOR.red) + rect(-1, 0, L + 2, m(1.12), "#aeb3b9") + rect(-1, m(1.0), L + 2, m(0.12), "#dcdfe2");
    if (g.k.saloon && !g.k.cab) s += rect(-1, m(1.3), L + 2, m(1.8), `url(#${gr.id})`) + rect(-1, m(3.1), L + 2, m(0.075), NOR.red) + rect(-1, m(3.04), L + 2, m(0.06), "#e9ebee") + rect(-1, m(1.18), L + 2, m(0.12), "#dcdfe2");
    if (g.k.cab) s += path(poly(P([[-0.5, 1.15], [0.62, 1.15], [0.78, 1.95], ["q", 1.4, 2.8, 2.4, 2.81], [2.4, 5], [-0.5, 5]])), NOR.grey) + rect(-1, 0, m(0.7), m(1.3), "#b9bdc2") +
      path(`M${m(2.4)} ${m(2.77)}Q${m(1.4)} ${m(2.76)} ${m(0.8)} ${m(1.9)}`, "none", 0, `stroke="${NOR.red}" stroke-width="${m(0.09)}"`);
    return s;
  },
  over: (c, g) => {
    let s = g.k.cab ? cabLogo(c, { logoX: 1.55 }) : "";
    if (g.kind === "Es") s += norRow(c, m(4.1), m(1.97), m(0.34));
    if (g.kind === "D") s += norFlag(c, g.L - m(1.25), m(2.25), m(0.72));
    if (g.kind === "Ao") s += norFlag(c, m(5.0), m(1.98), m(0.85));
    if (g.kind === "Es") s += num(c, 13.0, 1.4, "1", "#ffffff", 0.32);
    if (g.kind === "Ao") s += num(c, 1.1, 1.35, g.o.first ? "2" : "2", "#ffffff", 0.32) + num(c, 8.85, 1.25, g.o.first ? "1" : "2", "#ffffff", 0.32);
    return s;
  } };
// Normandie's Omneo for the Paris-Rouen "Citi" trains (Z 56800; Val-de-
// Reuil, 2026): bottle green below a light grey band, a yellow line between;
// the nose silver; the same flag and lettering.
LIV.nor2 = { ...LIV.nor, name: "Normandie (Nomad Citi)",
  paint: (c, g) => {
    const L = g.L, G2 = "#2f4a38";
    let s = rect(-1, m(0.95), L + 2, m(1.85), G2) + rect(-1, m(2.72), L + 2, m(0.09), "#e8c21b") + rect(-1, 0, L + 2, m(0.95), "#aeb3b9");
    if (g.k.saloon && !g.k.cab) s += rect(m(2.45), m(0.95), L, m(2.3), G2) + rect(m(2.45), m(3.22), L, m(0.09), "#e8c21b") + rect(-1, m(3.31), L + 2, 10, NOR.grey);
    if (g.k.cab) s += path(poly(P([[-0.5, 0], [2.35, 0], [2.35, 2.81], ["q", 1.4, 2.79, 0.9, 1.95], [0.75, 1.5], [-0.5, 1.5]])), "#bfc3c7") +
      path(`M${m(2.35)} ${m(2.81)}Q${m(1.4)} ${m(2.79)} ${m(0.92)} ${m(1.97)}`, "none", 0, `stroke="#e8c21b" stroke-width="${m(0.09)}"`);
    return s;
  } };
// Centre-Val de Loire's Omneo Premium (Z 56700, Rémi Express Paris-Orléans-
// Tours, Paris-Bourges; Paris-Austerlitz 2022-2025): the whole cab lime
// yellow to the crew door with a white swoosh low on it, silver cars, steel
// doors; the region's name and heart on the cars.
const REMI = { lime: "#dfe05a", deep: "#c9cb3a" };
LIV.remi = { name: "Rémi (TER Centre-Val de Loire)", body: SILVER, door: "#b5babf", frame: "#d7d9d6", layoutA: "Ao",
  paint: (c, g) => skirt(g.L, 0.85, "#9aa0a6") + (g.k.cab ? fullCap(REMI.lime, 2.3, 0.55) + path(poly(P([[2.3, 1.05], [2.3, 1.5], ["q", 1.6, 1.25, 0.9, 0.62], [1.3, 0.62], ["q", 1.8, 1.0, 2.3, 1.05]])), "#f2f3f0") : ""),
  over: (c, g) => (g.k.cab ? cabLogo(c, { logoX: 1.55 }) : "") + (g.kind === "D" ? cvlName(c, m(0.5), m(2.5), m(0.42)) : "") +
    (g.kind === "Es" || g.kind === "Ed" ? cvlHeart(c, m(g.kind === "Es" ? 4.0 : 9.0), m(2.0)) : "") };
// ZOU! (Transdev's Z 59000 on Marseille-Toulon-Nice since June 2025; Nice
// and Anthéor, 2026): blue all over, a white curve along the cab's foot,
// white panels on the cars with "ZOU" in huge blue letters, "RÉGION SUD"
// and Transdev's name.
const ZOU = { blue: "#1f7ad6", deep: "#1257b0" };
LIV.zou = { name: "ZOU! (Transdev, Région Sud)", body: ZOU.blue, door: "#e9ecef", frame: null, layoutA: "Ao", bikes: false,
  paint: (c, g) => {
    const L = g.L;
    let s = rect(-1, 0, L + 2, m(0.95), "#8f959c");
    if (g.k.cab) s += path(`M${m(0.6)} ${m(1.15)}Q${m(1.8)} ${m(1.3)} ${m(2.6)} ${m(2.0)}L${m(2.6)} ${m(2.15)}Q${m(1.8)} ${m(1.45)} ${m(0.6)} ${m(1.3)}Z`, "#ffffff");
    if (g.k.saloon && !g.k.cab) s += rect(m(3.0), m(1.0), m(9.6), m(2.05), "#f3f5f6") + T(c, m(7.8), m(2.0), m(1.55), "ZOU", ZOU.deep, { weight: 800, family: NARROW, spacing: -0.05 });
    return s;
  },
  over: (c, g) => (g.k.cab ? T(c, m(2.0), m(2.15), m(0.36), "ZOU!", "#ffffff", { weight: 800 }) + T(c, m(2.0), m(1.75), m(0.22), "transdev", "#ffffff", { weight: 600, italic: true }) : "") +
    (g.k.saloon && !g.k.cab ? T(c, m(11.4), m(2.55), m(0.26), "RÉGION SUD", "#1f3c8c", { weight: 800 }) : "") };

// ===================== Types and sets =====================
const { TYPES, MODELS, add, addCab } = registry();
const ft = (k) => m(KIND[k].L);
const FIRST = { amenities: ["first"] };
// Every car type of a livery; sfx names it.
function r2nTypes(sfx, liv, { short = false, first = false } = {}) {
  const A = liv.layoutA || "A", nm = liv.name;
  addCab(`terR2nEs${sfx}`, `Regio 2N single-deck end car, ${nm}`, (c) => r2nCar(c, "Es", liv), ft("Es"), first ? FIRST : {});
  addCab(`terR2nEd${sfx}`, `Regio 2N double-deck end car, ${nm}`, (c) => r2nCar(c, "Ed", liv), ft("Ed"));
  add(`terR2nA${sfx}`, `Regio 2N access car, ${nm}`, (c) => r2nCar(c, A, liv), ft(A));
  add(`terR2nAp${sfx}`, `Regio 2N access car with pantograph${first ? " and first class" : ""}, ${nm}`, (c) => r2nCar(c, A, liv, { pan: true, first }), ft(A), first ? { ...FIRST } : {});
  add(`terR2nApR${sfx}`, `Regio 2N access car with pantograph${first ? " and first class" : ""}, ${nm}`, (c) => facingRight(c, (cc) => r2nCar(cc, A, liv, { pan: true, first })), ft(A), first ? { ...FIRST } : {});
  add(`terR2nD${sfx}`, `Regio 2N double-deck car, ${nm}`, (c) => r2nCar(c, "D", liv), ft("D"), { kind: "bilevel", emu: true });
  add(`terR2nDR${sfx}`, `Regio 2N double-deck car, ${nm}`, (c) => facingRight(c, (cc) => r2nCar(cc, "D", liv)), ft("D"), { kind: "bilevel", emu: true });
  if (short) {
    add(`terR2nDs${sfx}`, `Regio 2N double-deck car (six-car units), ${nm}`, (c) => r2nCar(c, "Ds", liv), ft("Ds"), { kind: "bilevel", emu: true });
    add(`terR2nDsR${sfx}`, `Regio 2N double-deck car (six-car units), ${nm}`, (c) => facingRight(c, (cc) => r2nCar(cc, "Ds", liv)), ft("Ds"), { kind: "bilevel", emu: true });
  }
}
// Units from the double-deck end car (cab on the left) to the single-deck
// one: Ed A D A D A D Es (eight), with A D more (ten), Ed A Ds A Ds Es (six).
// A double-deck car's landing (its low roof and landing window) faces the
// single-deck end car next to it (BreizhGo, Rennes 2025) and the double-
// deck end car in that half of a ten-car unit (Z 56673's car 6); the
// middle one of an eight-car unit is taken to face the single-deck end.
// Pantographs on cars 3 and 5 from the single-deck end (506L; Z 56673's
// car 3), on a ten-car unit cars 3 and 7.
function r2nUnit(sfx, cars, label) {
  const k = (x) => `terR2n${x}${sfx}`;
  const inner = cars === 6 ? ["Ap", "Ds", "Ap", "DsR"] : cars === 10 ? ["A", "D", "Ap", "D", "A", "DR", "Ap", "DR"] : ["A", "D", "Ap", "DR", "Ap", "DR"];
  return set(label, [k("Ed"), 1], ...inner.map((x) => [k(x), 1]), [k("Es") + "R", 1]);
}
r2nTypes("Cvl", LIV.cvl);
r2nTypes("Hdf", LIV.hdf);
r2nTypes("Bzh", LIV.bzh, { short: true });
r2nTypes("Paca", LIV.paca);
r2nTypes("Aura", LIV.aura, { short: true });
r2nTypes("Naq", LIV.naq, { short: true });
r2nTypes("Occ", LIV.occ, { short: true });
r2nTypes("Pdl", LIV.pdl);
r2nTypes("Nor", LIV.nor, { first: true });
r2nTypes("Nor2", LIV.nor2);
r2nTypes("Remi", LIV.remi, { first: true });
r2nTypes("Zou", LIV.zou, { first: true });

const SETS = {
  r2n8_cvl: r2nUnit("Cvl", 8, "Regio 2N (Z 55500), eight cars, TER Centre-Val de Loire"),
  r2n10_hdf: r2nUnit("Hdf", 10, "Regio 2N (Z 55500/Z 56000), ten cars, TER Hauts-de-France"),
  r2n8_bzh: r2nUnit("Bzh", 8, "Regio 2N (Z 55500), eight cars, BreizhGo"),
  r2n6_bzh: r2nUnit("Bzh", 6, "Regio 2N (Z 55500), six cars, BreizhGo"),
  r2n8_paca: r2nUnit("Paca", 8, "Regio 2N (Z 55500), eight cars, TER Provence-Alpes-Côte d'Azur"),
  r2n6_aura: r2nUnit("Aura", 6, "Regio 2N (Z 55500), six cars, TER Auvergne-Rhône-Alpes"),
  r2n6_naq: r2nUnit("Naq", 6, "Regio 2N (Z 56300/Z 56400), six cars, TER Nouvelle-Aquitaine"),
  r2n6_occ: r2nUnit("Occ", 6, "Regio 2N (Z 56300), six cars, liO TER Occitanie"),
  r2n8_pdl: r2nUnit("Pdl", 8, "Regio 2N (Z 56500), eight cars, TER Pays de la Loire (Interloire)"),
  omneo10_nor: r2nUnit("Nor", 10, "Omneo Premium (Z 56600), ten cars, Nomad (Normandie), first class at the single-deck end"),
  omneo10_nor2: r2nUnit("Nor2", 10, "Omneo (Z 56800), ten cars, Nomad Citi (Normandie)"),
  omneo8_cvl: r2nUnit("Remi", 8, "Omneo Premium (Z 56700), eight cars, Rémi Express (Centre-Val de Loire)"),
  omneo8_paca: r2nUnit("Zou", 8, "Omneo Premium (Z 59000), eight cars, ZOU! (Transdev, Région Sud)"),
};
const FACTS = {};

// ===================== TER 2N NG (Z 24500, Z 26500) =====================
// Alstom, 2004-2010 (fr.wikipedia "TER 2N NG"): double-deck throughout,
// three cars 81.10 m, four 107.50 m, five 133.90 m, so end cars of 27.35 m
// and middle cars of 26.4 m; trucks 20.0 m apart; 4.32 m tall, 2.81 m wide;
// doors 1.30 m wide. Each end car: the cab, the crew door, two windows
// over the motor truck, a double door, then the saloon to its inner end;
// each middle car a door and a low platform at both ends, the saloon
// between. Measured off Z 24687/88 at La Ménitré (2024), Z 24570 at
// Thionville (2026) and Z 24500s in Savoie (2025-2026). One pantograph,
// on the middle car's end next to an end car.
const N = { crown: 4.32, eave: 3.95, bot: 0.95, platBot: 1.1, tTop: 0.95, lo: [1.22, 2.08], up: [2.78, 3.58], plat: [1.78, 2.62], door: [1.0, 3.1] };
const NG = {
  // End car, 27.35 m, the cab on the left.
  E: { L: 27.35, cab: true, trucks: [4.15, 24.15], crew: [2.25, 3.05], doors: [[6.2, 7.6]],
    wins: [[3.55, 4.6, ...N.plat], [4.85, 5.9, ...N.plat], ...seq(8.6, 2.6, 7).flatMap((x) => [[x, x + 2.05, ...N.lo], [x, x + 2.05, ...N.up]])] },
  // Middle car, 26.4 m.
  M: { L: 26.4, trucks: [3.2, 23.2], doors: [[2.35, 3.65], [22.75, 24.05]],
    wins: [[0.55, 1.95, ...N.plat], [24.45, 25.85, ...N.plat], ...seq(4.4, 2.6, 7).flatMap((x) => [[x, x + 2.05, ...N.lo], [x, x + 2.05, ...N.up]])] },
};
// The nose: the coupler's recess at the foot, the front raking back in one
// line past the headlights to the windscreen, the windscreen's top curving
// into the roof 3 m back (La Ménitré, Thionville).
const NG_NOSE = [[0.95, 0.55], [0.35, 0.75], ["q", 0.12, 0.95, 0.15, 1.5], [0.3, 2.1], ["q", 0.55, 2.6, 0.95, 3.25], ["q", 1.55, 4.1, 2.6, 4.28], [3.2, N.crown]];
function ngOutline(k) {
  const L = k.L, x1 = L - 0.12, top = [];
  if (k.cab) top.push(...NG_NOSE); else top.push([0.12, N.platBot], [0.12, N.eave], ["q", 0.12, N.crown, 0.7, N.crown]);
  top.push([x1 - 0.6, N.crown], ["q", x1, N.crown, x1, N.eave], [x1, N.platBot]);
  // The bottom: high over the trucks, low between them (the lower deck).
  const [t0, t1] = k.trucks;
  const bot = [[x1, N.platBot], [t1 + 1.6, N.platBot], [t1 - 1.6, N.bot], [t0 + 1.6, N.bot], [t0 - 1.6, N.platBot], [k.cab ? 0.95 : 0.12, k.cab ? 0.55 : N.platBot]];
  return poly(P([...top, ...bot]));
}
function ngCar(c, key, liv, o = {}) {
  const k = NG[key], L = c.L;
  const g = { L, k, kind: key, o };
  let paint = rect(-1, 0, L + 2, 20, liv.body) + (liv.paint ? liv.paint(c, g) : "");
  for (const w of k.wins) paint += winM(w, liv.frame, 0.45);
  for (const [a, b] of k.doors) paint += leaves(m(a), m(b - a), m(N.door[0]), m(N.door[1]), liv.door, { glass: [0.42, 0.86], gw: 0.4, r: 0.55 });
  if (k.cab) {
    // Windscreen, headlights, the silver grille under them, crew door.
    paint += path(poly(P([[0.32, 2.25], ["q", 0.58, 2.7, 0.98, 3.3], ["q", 1.5, 4.0, 2.4, 4.2], [2.45, 4.02], ["q", 1.65, 3.85, 1.2, 3.25], ["q", 0.8, 2.7, 0.62, 2.2]])), "#1b1e23") +
      path(poly(P([[0.12, 1.05], [0.75, 1.05], [0.75, 1.55], [0.14, 1.55]])), "#c9ced3") + lines([0, 1, 2].map((i) => [0.4, m(1.15 + i * 0.13), m(0.75), m(1.15 + i * 0.13)]), "#7d838a", 0.6) +
      circle(m(0.36), m(1.85), 0.42, "#f2efdc", 0, 'stroke="#3a3f45" stroke-width="0.4"');
    const [a, b] = k.crew;
    paint += rect(m(a), m(1.1), m(b - a), m(2.4), "none", 0, `rx="0.3" stroke="rgba(0,0,0,0.45)" stroke-width="0.6" ${STROKE}`) + pane(m(a + 0.12), m(2.6), m(b - a - 0.24), m(0.65), 0.3, "#1c1e22");
  }
  paint += liv.over ? liv.over(c, g) : "";
  let under = trucks(k.trucks.map(m), m(N.platBot) + 0.05, 33, m(2.6));
  if (c.coupledR) under += joint(L, 1, m(1.2), m(3.85));
  if (c.coupledL && !k.cab) under += joint(0, -1, m(1.2), m(3.85));
  if (k.cab) under += c.coupledL ? coupledCouplers(m(0.95)) : autoCoupler(m(0.9), m(0.95));
  let top = rect(m(k.cab ? 5.5 : 6.5), m(N.crown) - 0.05, m(k.cab ? 4.0 : 3.2), 0.55, "#8d939a", 0.4, 'rx="0.2"') + slats(m(k.cab ? 5.8 : 6.8), m(N.crown), m(2.0), 0.45, 0.3, "rgba(0,0,0,0.3)");
  if (o.pan) top += rect(L - m(3.6), m(N.crown) - 0.05, m(3.0), 0.35, "#5d636c", 0.4, 'rx="0.1"') + pantograph(L - m(2.1), m(N.crown) + 0.3, { up: true, facing: 1 });
  return shell(c, ngOutline(k), liv.body, paint, under, top);
}
// ----- TER 2N NG liveries (metres) -----
const NGL = {};
// Swoosh across a car: a band from low at x to high at x + run.
const swoosh = (x, run, w, fill, y0 = 0.6, y1 = 4.4) => path(poly(P([[x, y0], [x + w, y0], [x + w + run, y1], [x + run, y1]])), fill);
// Grand Est, "fluo" (the renovated Z 24500/26500 on Metz-Luxembourg and
// Nancy-Metz-Luxembourg; Z 24570 at Thionville, September 2026): navy all
// over, lime doors, a broad white swoosh with a blue one in it by the doors;
// "fluo" in lime and "La Région Grand Est" behind the cab, SNCF VOYAGEURS.
const FLUO = { navy: "#1f2a7a", lime: "#b5d334", white: "#e9edf2", sky: "#4c7fd0" };
NGL.ge = { name: "fluo Grand Est", body: FLUO.navy, door: FLUO.lime, frame: null,
  paint: (c, g) => (g.k.cab ? swoosh(8.4, 1.2, 1.1, FLUO.white) + swoosh(9.0, 1.2, 0.35, FLUO.sky) : "") + rect(-1, 0, g.L + 2, m(0.95), "#2a2f46"),
  over: (c, g) => (g.k.cab ? sncf(c, m(4.0), m(3.25), m(0.33), { voyageurs: true, ink: "#ffffff" }) + fluoName(c, m(3.0), m(2.22), m(0.4)) : "") };
// "fluo" in lime, a white bar, "La Région / Grand Est" in white (Z 24570).
function fluoName(c, x0, y, h) {
  const X = seen(c, x0, h * 4.6), a = START(c);
  return T(c, X(0), y, h * 1.05, "fluo", FLUO.lime, { weight: 500, italic: true, family: "'Brush Script MT', 'Segoe Script', cursive", anchor: a }) +
    rect(X(h * 1.95) - h * 0.03, y - h * 0.5, h * 0.06, h * 1.0, "#ffffff") +
    T(c, X(h * 2.15), y + h * 0.22, h * 0.26, "La Région", "#ffffff", { weight: 500, anchor: a }) + T(c, X(h * 2.15), y - h * 0.2, h * 0.5, "Grand Est", "#ffffff", { weight: 700, anchor: a, stretch: 0.9 });
}
// Auvergne-Rhône-Alpes (sky blue, renovated units; Saint-André-le-Gaz
// 2025, Tarentaise 2026): sky blue all over, a white swoosh behind the
// cab, "LA RÉGION VOUS TRANSPORTE" on the upper deck.
NGL.aura = { name: "TER Auvergne-Rhône-Alpes", body: AURA.sky, door: "#e8ecef", frame: null,
  paint: (c, g) => (g.k.cab ? path(poly(P([[2.4, 0.6], [3.4, 0.6], ["q", 5.0, 2.6, 5.4, 4.4], [4.2, 4.4], ["q", 3.8, 2.6, 2.4, 0.6]])), "#f3f5f7") : "") + rect(-1, 0, g.L + 2, m(0.95), "#5f6a75"),
  over: (c, g) => (g.k.cab ? sncf(c, m(1.85), m(2.25), m(0.33)) + auraName(c, m(8.6), m(1.6)) : "") +
    T(c, m(g.k.cab ? 18.5 : 13.2), m(2.47), m(0.3), "LA RÉGION VOUS TRANSPORTE", "#ffffff", { weight: 800, family: NARROW }) };
// Hauts-de-France (the renovated units, 2023-2026; Amiens, Douai, Lille):
// navy, green doors, a white and a green swoosh behind the cab, silver
// between the doors and the swoosh; the region's mark, SNCF VOYAGEURS.
NGL.hdf = { name: "TER Hauts-de-France", body: "#26338f", door: HDF_GREEN, frame: null,
  paint: (c, g) => (g.k.cab ? rect(m(7.6), m(0.6), m(1.8), m(3.9), SILVER) + swoosh(8.6, 1.4, 0.55, "#f2f4f6") + swoosh(9.1, 1.4, 1.0, HDF_GREEN) : "") + rect(-1, 0, g.L + 2, m(0.95), "#2a2f46"),
  over: (c, g) => (g.k.cab ? sncf(c, m(4.15), m(3.3), m(0.33), { voyageurs: true, ink: "#ffffff" }) + hdfMark(c, m(3.2), m(2.2), m(0.45), { onBlue: true }) : "") };
// Aléop, Pays de la Loire (the units renovated since 2025; Z 24500 at La
// Ménitré, 2024): grey, the cab royal blue to the crew door, a blue line
// low along the cars, magenta over the roof's edge; Aléop's name and "LA
// RÉGION VOUS TRANSPORTE".
NGL.pdl = { name: "Aléop (Pays de la Loire)", body: "#b9bec3", door: "#b9bec3", frame: null,
  paint: (c, g) => rect(-1, m(1.0), g.L + 2, m(0.16), "#2a3fbf") + rect(-1, m(3.75), g.L + 2, 4, "#d65aa0") + rect(-1, 0, g.L + 2, m(1.0), "#7f868d") + (g.k.cab ? fullCap("#2a3fbf", 3.15, 0.5) + rect(m(3.15), m(3.75), m(1.5), 4, "#3bb0d6") : ""),
  over: (c, g) => (g.k.cab ? aleop(c, m(3.45), m(1.72), m(0.45)) : "") +
    T(c, m(g.k.cab ? 17.5 : 13.2), m(2.47), m(0.3), "LA RÉGION VOUS TRANSPORTE", "#2a3fbf", { weight: 800, family: NARROW }) };
// PACA (Z 26500, Grasse-Cannes-Nice-Ventimiglia; Nice 2024): silver, the
// cab blue to the crew door, blue doors; "ZOU!" lettering on the cars.
NGL.paca = { name: "TER Provence-Alpes-Côte d'Azur (ZOU!)", body: SILVER, door: PACA.blue, frame: "#e7e8e6",
  paint: (c, g) => rect(-1, 0, g.L + 2, m(0.95), GREY_SKIRT) + (g.k.cab ? fullCap(PACA.blue, 3.15, 0.5) : ""),
  over: (c, g) => (g.k.cab ? sncf(c, m(2.6), m(2.6), m(0.33)) + pacaArms(c, m(2.6), m(3.4), m(0.5)) : "") +
    T(c, m(g.k.cab ? 9.4 : 5.4), m(2.47), m(0.42), "ZOU!", PACA.blue, { weight: 800, family: NARROW }) };
function ngTypes(sfx, liv) {
  addCab(`terNgE${sfx}`, `TER 2N NG (Z 24500/26500) end car, ${liv.name}`, (c) => ngCar(c, "E", liv), m(27.35), { kind: "bilevel", emu: true });
  add(`terNgM${sfx}`, `TER 2N NG middle car, ${liv.name}`, (c) => ngCar(c, "M", liv), m(26.4), { kind: "bilevel", emu: true });
  add(`terNgMp${sfx}`, `TER 2N NG middle car with pantograph, ${liv.name}`, (c) => ngCar(c, "M", liv, { pan: true }), m(26.4), { kind: "bilevel", emu: true, pan: true });
}
for (const [sfx, liv] of [["Ge", NGL.ge], ["Aura", NGL.aura], ["Hdf", NGL.hdf], ["Pdl", NGL.pdl], ["Paca", NGL.paca]]) ngTypes(sfx, liv);
const ngUnit = (sfx, cars, label) => set(label, [`terNgE${sfx}`, 1], ...Array.from({ length: cars - 2 }, (_, i) => [i === cars - 3 ? `terNgMp${sfx}` : `terNgM${sfx}`, 1]), [`terNgE${sfx}R`, 1]);
Object.assign(SETS, {
  z245_3_ge: ngUnit("Ge", 3, "TER 2N NG (Z 24500), three cars, fluo Grand Est"),
  z265_4_ge: ngUnit("Ge", 4, "TER 2N NG (Z 26500), four cars, fluo Grand Est"),
  z265_5_ge: ngUnit("Ge", 5, "TER 2N NG (Z 26500), five cars, fluo Grand Est"),
  z245_3_aura: ngUnit("Aura", 3, "TER 2N NG (Z 24500), three cars, TER Auvergne-Rhône-Alpes"),
  z245_3_hdf: ngUnit("Hdf", 3, "TER 2N NG (Z 24500), three cars, TER Hauts-de-France"),
  z265_4_hdf: ngUnit("Hdf", 4, "TER 2N NG (Z 26500), four cars, TER Hauts-de-France"),
  z265_5_hdf: ngUnit("Hdf", 5, "TER 2N NG (Z 26500), five cars, TER Hauts-de-France"),
  z245_3_pdl: ngUnit("Pdl", 3, "TER 2N NG (Z 24500), three cars, Aléop (Pays de la Loire)"),
  z265_4_paca: ngUnit("Paca", 4, "TER 2N NG (Z 26500), four cars, TER Provence-Alpes-Côte d'Azur"),
});

// ===================== TER 2N PG (Z 23500) =====================
// Alstom (GEC Alsthom), 1997-2000: two double-deck cars, 52.5 m, each a
// cab car of 26.25 m on two trucks 19.0 m apart, 4.32 m tall; the cab
// nearly upright, the windscreen in a dark frame, the roof rounded over it;
// behind the cab a door (blue on PACA's), the saloon (six windows below,
// seven above), a door and a low platform at the inner end. One pantograph
// over the inner end of one car. Off Z 23521 at Toulon (2025) and Z 23548
// at Notre-Dame-de-Briançon (February 2026).
const PG = { L: 26.25, trucks: [3.9, 22.9], doors: [[3.75, 5.2], [22.35, 23.75]],
  wins: [[24.1, 25.5, ...N.plat], ...seq(6.4, 2.25, 6).flatMap((x) => [[x, x + 1.75, ...N.lo]]), ...seq(5.95, 2.25, 7).map((x) => [x, x + 1.75, ...N.up])] };
const PG_NOSE = [[0.9, 0.55], [0.35, 0.7], ["q", 0.18, 0.9, 0.2, 1.4], [0.3, 2.3], ["q", 0.4, 3.4, 0.6, 3.85], ["q", 0.9, 4.3, 1.8, N.crown]];
function pgCar(c, liv, o = {}) {
  const L = c.L, k = { ...PG, cab: true };
  const x1 = L - 0.12;
  const d = poly(P([...PG_NOSE, [x1 - 0.6, N.crown], ["q", x1, N.crown, x1, N.eave], [x1, N.platBot], [k.trucks[1] + 1.6, N.platBot], [k.trucks[1] - 1.6, N.bot], [k.trucks[0] + 1.6, N.bot], [k.trucks[0] - 1.6, N.platBot], [0.9, 0.55]]));
  const g = { L, k, kind: "PG", o };
  let paint = rect(-1, 0, L + 2, 20, liv.body) + (liv.paint ? liv.paint(c, g) : "");
  for (const w of k.wins) paint += winM(w, liv.frame, 0.45);
  for (const [a, b] of k.doors) paint += leaves(m(a), m(b - a), m(N.door[0]), m(N.door[1]), liv.door, { glass: [0.42, 0.86], gw: 0.4, r: 0.5 });
  // The windscreen's dark frame seen edge-on, the headlights, a side window.
  paint += path(poly(P([[0.3, 2.35], [0.42, 3.55], ["q", 0.6, 4.0, 1.0, 4.18], [1.15, 4.0], ["q", 0.8, 3.8, 0.7, 3.45], [0.62, 2.35]])), "#1b1e23") +
    circle(m(0.3), m(1.7), 0.42, "#f2efdc", 0, 'stroke="#3a3f45" stroke-width="0.4"') + pane(m(1.6), m(2.3), m(0.7), m(1.3), 0.3, "#1c1e22") +
    rect(m(2.5), m(1.1), m(0.8), m(2.5), "none", 0, `rx="0.3" stroke="rgba(0,0,0,0.45)" stroke-width="0.6" ${STROKE}`);
  paint += liv.over ? liv.over(c, g) : "";
  let under = trucks(k.trucks.map(m), m(N.platBot) + 0.05, 33, m(2.6));
  if (c.coupledR) under += joint(L, 1, m(1.2), m(3.85));
  under += c.coupledL ? coupledCouplers(m(0.95)) : autoCoupler(m(0.85), m(0.95));
  let top = rect(m(8.0), m(N.crown) - 0.05, m(3.5), 0.55, "#8d939a", 0.4, 'rx="0.2"') + slats(m(8.3), m(N.crown), m(2.0), 0.45, 0.3, "rgba(0,0,0,0.3)");
  if (o.pan) top += rect(L - m(3.6), m(N.crown) - 0.05, m(3.0), 0.35, "#5d636c", 0.4, 'rx="0.1"') + pantograph(L - m(2.1), m(N.crown) + 0.3, { up: true, facing: 1 });
  return shell(c, d, liv.body, paint, under, top);
}
const PGL = {};
// Auvergne-Rhône-Alpes (the Chambéry and Lyon-Vienne units; Savoie 2026):
// sky blue all over, a lighter band through the windows.
PGL.aura = { name: "TER Auvergne-Rhône-Alpes", body: AURA.sky, door: "#d9e4ec", frame: null,
  paint: (c, g) => rect(-1, 0, g.L + 2, m(0.95), "#5f6a75"),
  over: (c, g) => sncf(c, m(1.95), m(1.75), m(0.3)) + auraName(c, m(9.0), m(1.55)) };
// PACA (Marseille-Toulon, Toulon-Les Arcs; Toulon 2025): blue, a grey band
// low between the decks and over the upper windows, blue doors; the
// Provence band of the region's arms on the saloon, the TER 2N's town name
// and coat of arms behind the cab.
PGL.paca = { name: "TER Provence-Alpes-Côte d'Azur", body: "#2c3fae", door: "#2c3fae", frame: "#3a3f45",
  paint: (c, g) => rect(-1, m(0.95), g.L + 2, m(0.2), "#8e959d") + rect(-1, m(2.7), m(5.2), m(0.9), "#8e959d") + rect(-1, 0, g.L + 2, m(0.95), "#7f868d") +
    provenceBand(c, { k: {}, band: [5.6, 21.9, 1.95, 3.62] }) + rect(-1, m(0.95), g.L + 2, m(0.3), "#8e959d"),
  over: (c, g) => sncf(c, m(2.4), m(1.9), m(0.33)) + pacaArms(c, m(2.4), m(2.95), m(0.5)) };
// Hauts-de-France (the former Nord-Pas-de-Calais units; Lille 2023): silver
// with the cab blue, green doors.
PGL.hdf = { name: "TER Hauts-de-France", body: SILVER, door: HDF_GREEN, frame: "#d7d9d6",
  paint: (c, g) => rect(-1, 0, g.L + 2, m(0.95), GREY_SKIRT) + fullCap(HDF_BLUE, 3.4, 0.5),
  over: (c, g) => sncf(c, m(2.0), m(1.85), m(0.3)) };
for (const [sfx, liv] of [["Aura", PGL.aura], ["Paca", PGL.paca], ["Hdf", PGL.hdf]]) {
  addCab(`terPg${sfx}`, `TER 2N PG (Z 23500) car, ${liv.name}`, (c) => pgCar(c, liv), m(26.25), { kind: "bilevel", emu: true });
  addCab(`terPgP${sfx}`, `TER 2N PG (Z 23500) car with pantograph, ${liv.name}`, (c) => pgCar(c, liv, { pan: true }), m(26.25), { kind: "bilevel", emu: true, pan: true });
}
Object.assign(SETS, {
  z235_2_aura: set("TER 2N PG (Z 23500), two cars, TER Auvergne-Rhône-Alpes", ["terPgPAura", 1], ["terPgAuraR", 1]),
  z235_2_paca: set("TER 2N PG (Z 23500), two cars, TER Provence-Alpes-Côte d'Azur", ["terPgPPaca", 1], ["terPgPacaR", 1]),
  z235_2_hdf: set("TER 2N PG (Z 23500), two cars, TER Hauts-de-France", ["terPgPHdf", 1], ["terPgHdfR", 1]),
});

// ===================== Fact sheets =====================
const FRWP = "https://fr.wikipedia.org/wiki/";
const R2NF = { model: "Bombardier (Alstom) Regio 2N", type: "Double-deck electric multiple unit", builder: "Bombardier Transportation (Crespin), now Alstom", built: "2013–2026",
  topSpeedMph: 99, powerHp: 3860, source: `${FRWP}Regio_2N` };
const OMF = { ...R2NF, model: "Bombardier (Alstom) Omneo Premium (Regio 2N, 200 km/h)", topSpeedMph: 124, built: "2019–2026" };
const NGF = { model: "Alstom TER 2N NG (Z 24500 / Z 26500)", type: "Double-deck electric multiple unit", builder: "Alstom", built: "2004–2010", fleet: "211 units (145 three-car, 42 four-car, 24 five-car)",
  topSpeedMph: 99, source: `${FRWP}TER_2N_NG` };
const PGF = { model: "Alstom TER 2N PG (Z 23500)", type: "Double-deck electric multiple unit", builder: "GEC Alsthom / Alstom", built: "1997–2000", fleet: "60 two-car units",
  topSpeedMph: 87, lengthFt: m(26.25), source: `${FRWP}Z_23500` };
for (const key of Object.keys(TYPES)) {
  const k = key.replace(/R$/, "");
  const omneo = /Nor|Remi|Zou/.test(k);
  let f = null;
  if (k.startsWith("terR2nEs")) f = { ...(omneo ? OMF : R2NF), lengthFt: m(14.2), about: "The single-deck end car: the cab, a few seats, the wheelchair place and the toilet; its door near the inner end." + (omneo ? " First class on Omneo Premium." : "") };
  else if (k.startsWith("terR2nEd")) f = { ...(omneo ? OMF : R2NF), lengthFt: m(19.3), about: "The double-deck end car: the cab, a door behind it, then a double-deck saloon." };
  else if (k.startsWith("terR2nAp")) f = { ...(omneo ? OMF : R2NF), lengthFt: m(10.02), about: "A single-deck access car carrying one of the unit's two pantographs: two double doors a side, bicycle and luggage space, the traction equipment on the roof." };
  else if (k.startsWith("terR2nA")) f = { ...(omneo ? OMF : R2NF), lengthFt: m(10.02), about: "A single-deck access car: two double doors a side (1.6 m wide), the bicycle places and the toilet; the double-deck cars either side have no doors." };
  else if (k.startsWith("terR2nDs")) f = { ...R2NF, lengthFt: m(13.7), about: "A double-deck car of a six-car unit, shorter than the long units'." };
  else if (k.startsWith("terR2nD")) f = { ...(omneo ? OMF : R2NF), lengthFt: m(15.45), about: "A double-deck car: seats on both decks, no doors; air conditioning over its low end." };
  else if (k.startsWith("terNgE")) f = { ...NGF, lengthFt: m(27.35), about: "The end car with the cab and a motor truck; one double door a side behind the cab." };
  else if (k.startsWith("terNgM")) f = { ...NGF, lengthFt: m(26.4), about: "A middle car, with a door at each end." + (k.startsWith("terNgMp") ? " It carries the unit's pantograph." : "") };
  else if (k.startsWith("terPg")) f = { ...PGF, about: "One of the two double-deck cars of a Z 23500, each with a cab." };
  if (f) FACTS[key] = { ...f, about: `${f.about} Paint: ${TYPES[key].name.split(", ").pop()}.` };
}

// ===================== The regions' marks =====================
// Simplified from the marks as photographed on the trains; each mark drawn
// in a unit box (y down) by markAt, so it reads the same on both sides;
// words laid out as seen (seen(), START()).

// Normandy: a red banner with two gold leopards (lions passant guardant,
// facing the hoist, a forepaw raised, tails curled over their backs), one
// above the other (Z 56673, Caen).
const LEOPARD = '<g fill="#f2c21b" stroke="#f2c21b" stroke-linecap="round" stroke-linejoin="round">' +
  '<path stroke="none" d="M-0.24 -0.02Q-0.02 -0.08 0.22 -0.05Q0.34 -0.03 0.34 0.05L0.31 0.1Q0.05 0.13 -0.2 0.08Z"/>' +
  '<circle stroke="none" cx="-0.3" cy="-0.07" r="0.1"/><path stroke="none" d="M-0.39 -0.13L-0.37 -0.21L-0.31 -0.15ZM-0.25 -0.15L-0.22 -0.21L-0.2 -0.12Z"/>' +
  '<path fill="none" stroke-width="0.055" d="M-0.2 -0.01Q-0.33 0.0 -0.43 -0.13M-0.15 0.07L-0.18 0.21L-0.26 0.22M0.12 0.09L0.1 0.21L0.03 0.22M0.28 0.08L0.32 0.21L0.25 0.22"/>' +
  '<path fill="none" stroke-width="0.035" d="M0.32 0.0Q0.5 -0.05 0.44 -0.2Q0.38 -0.3 0.29 -0.2"/></g>' +
  '<circle cx="-0.33" cy="-0.08" r="0.016" fill="#7a1a10"/><circle cx="-0.27" cy="-0.08" r="0.016" fill="#7a1a10"/>';
const NOR_BANNER = '<path d="M-0.42 -0.36Q-0.05 -0.4 0.33 -0.52Q0.33 0.0 0.5 0.55Q0.05 0.42 -0.4 0.4Q-0.47 0.02 -0.42 -0.36Z" fill="#e2231a"/>' +
  `<g transform="translate(-0.02 -0.15) scale(0.62)">${LEOPARD}</g><g transform="translate(0.0 0.2) scale(0.62)">${LEOPARD}</g>`;
// The banner (h ft tall, centred at x, its foot at y) and RÉGION NORMANDIE
// under it, left-aligned with the banner as on the cars.
function norFlag(c, x, y, h) {
  const X = seen(c, x - h * 0.45, h * 2.2), a = START(c);
  return markAt(c, x, y + h * 0.5, h, NOR_BANNER) +
    T(c, X(0.05 * h), y - h * 0.24, h * 0.19, "RÉGION", "#ffffff", { weight: 400, anchor: a, spacing: 0.02 * h }) +
    T(c, X(-0.15 * h), y - h * 0.5, h * 0.27, "NORMANDIE", "#ffffff", { weight: 400, anchor: a, spacing: 0.01 * h });
}
// In a row (the end cars): the banner, then the two lines (x: the left as
// seen).
function norRow(c, x, y, h) {
  const X = seen(c, x, h * 4.9), a = START(c);
  return markAt(c, X(h * 0.5), y, h, NOR_BANNER) +
    T(c, X(h * 1.15), y + h * 0.18, h * 0.32, "RÉGION", "#ffffff", { weight: 400, anchor: a, spacing: 0.03 }) + T(c, X(h * 1.15), y - h * 0.32, h * 0.5, "NORMANDIE", "#ffffff", { weight: 400, anchor: a });
}

// Hauts-de-France: the region's outline drawn in one line with a green
// tick-shaped heart in its top (white on blue, blue on silver), "Région"
// and "Hauts-de-France" beside it (Regio 2N, Paris-Nord 2025-2026).
const hdfMapMark = (line) => `<path d="M-0.12 -0.36Q-0.02 -0.5 0.1 -0.42Q0.22 -0.56 0.3 -0.4L0.34 -0.06L0.4 0.12L0.26 0.3L0.2 0.5L-0.06 0.44L-0.28 0.48L-0.3 0.26L-0.42 0.16L-0.36 -0.08L-0.4 -0.26Z" fill="none" stroke="${line}" stroke-width="0.065" stroke-linejoin="round"/>` +
  '<path d="M-0.24 -0.22L-0.02 0.08L0.34 -0.5" fill="none" stroke="#5bb446" stroke-width="0.1" stroke-linecap="round" stroke-linejoin="round"/>';
function hdfMark(c, x0, y, h, { onBlue = false } = {}) {
  const X = seen(c, x0, h * 4.8), a = START(c);
  if (!onBlue) {
    // The silver cars' version (Paris-Nord 2026): green speed lines, the
    // mark, "Hauts-de-France" in blue and "mobilités" in green under it.
    return lines([0, 1, 2].map((i) => [X(h * (0.05 + i * 0.08)), y + h * (0.3 - i * 0.12), X(h * 0.38), y + h * (0.3 - i * 0.12)]), "#8cc63f", 0.8) +
      markAt(c, X(h * 0.9), y, h * 1.15, hdfMapMark(HDF_BLUE)) + T(c, X(h * 0.9), y - h * 0.82, h * 0.3, "Hauts-de-France", HDF_BLUE, { weight: 700, stretch: 0.9 }) +
      T(c, X(h * 0.9), y - h * 1.15, h * 0.3, "mobilités", "#8cc63f", { weight: 500 });
  }
  return markAt(c, X(h * 0.5), y, h * 1.1, hdfMapMark("#ffffff")) +
    T(c, X(h * 1.15), y + h * 0.17, h * 0.3, "Région", "#5bb446", { weight: 700, anchor: a }) +
    T(c, X(h * 1.15), y - h * 0.2, h * 0.34, "Hauts-de-France", "#ffffff", { weight: 700, anchor: a, stretch: 0.92 });
}

// Bretagne: the region's white ermine (a stylised ermine spot, its three
// dots above the tail) on black, "Région BRETAGNE" under it.
const ERMINE = '<path d="M-0.42 -0.02Q-0.05 -0.12 0.22 0.08Q0.36 0.18 0.46 0.02Q0.44 0.34 0.12 0.34Q-0.2 0.3 -0.42 -0.02Z" fill="#ffffff"/>' +
  '<path d="M0.3 0.12L0.48 0.2L0.34 0.26Z" fill="#1e2023"/>' +
  '<g fill="#ffffff"><ellipse cx="-0.24" cy="-0.38" rx="0.05" ry="0.09"/><ellipse cx="-0.24" cy="-0.16" rx="0.05" ry="0.08"/><ellipse cx="-0.35" cy="-0.27" rx="0.09" ry="0.05"/><ellipse cx="-0.13" cy="-0.27" rx="0.09" ry="0.05"/></g>';
const bzhRegion = (c, x, y) => rect(x - 1.25, y - 1.1, 2.5, 2.2, "#1e2023", 0, 'rx="0.12"') + markAt(c, x, y + 0.38, 1.1, ERMINE) +
  T(c, x, y - 0.4, 0.28, "Région", "#ffffff", { weight: 400 }) + T(c, x, y - 0.78, 0.36, "BRETAGNE", "#ffffff", { weight: 800, spacing: 0.02 });
const bzhErmine = (c, x, y) => rect(x - 1.25, y - 1.15, 2.5, 2.3, "#1e2023", 0, 'rx="0.15"') + markAt(c, x, y + 0.3, 1.2, ERMINE) +
  T(c, x, y - 0.78, 0.42, "BREIZH", "#ffffff", { weight: 800, spacing: 0.04 });

// Centre-Val de Loire: the region's figure, a blue stroke curving over a
// yellow sun and a turquoise point below (Z 56714, Paris-Austerlitz).
const CVL_MARK = '<path d="M-0.3 0.12Q-0.48 -0.36 -0.06 -0.42Q0.04 -0.26 -0.06 -0.02" fill="none" stroke="#2f6fbe" stroke-width="0.11" stroke-linecap="round"/>' +
  '<circle cx="0.13" cy="-0.22" r="0.17" fill="#f2c21b"/><path d="M-0.32 0.08Q-0.12 0.2 0.02 0.08Q0.18 0.16 0.34 0.02L0.02 0.48Z" fill="#33b3c4"/>';
const cvlHeart = (c, x, y, h = 1.6) => markAt(c, x, y, h, CVL_MARK);
const cvlName = (c, x0, y, h) => { const X = seen(c, x0, h * 9), a = START(c);
  return cvlHeart(c, X(h * 0.6), y, h * 1.8) + T(c, X(h * 1.4), y + h * 0.45, h * 0.3, "Région", "#2f6fae", { weight: 400, anchor: a }) +
    T(c, X(h * 1.4), y - h * 0.05, h * 0.7, "Centre-Val de Loire", "#2f6fae", { weight: 400, italic: true, anchor: a, family: NARROW, stretch: 0.85 }); };

// Auvergne-Rhône-Alpes: a blue disc with a white mountain line in it,
// "La Région" and "Auvergne-Rhône-Alpes" beside it.
const AURA_MARK = '<circle r="0.5" fill="#1f6fbf"/><path d="M-0.3 0.18L-0.08 -0.24L0.04 -0.04L0.12 -0.14L0.3 0.18" fill="none" stroke="#ffffff" stroke-width="0.09" stroke-linejoin="round" stroke-linecap="round"/>';
function auraName(c, x0, y) {
  const X = seen(c, x0, 6.0), a = START(c);
  return markAt(c, X(0.75), y, 1.5, AURA_MARK) +
    T(c, X(1.75), y + 0.25, 0.55, "La Région", "#1f6fbf", { weight: 500, anchor: a }) + T(c, X(1.75), y - 0.4, 0.42, "Auvergne-Rhône-Alpes", "#1f6fbf", { weight: 400, anchor: a });
}

// Nouvelle-Aquitaine: the lion of Aquitaine, rampant, white on a red shield
// (cab) and on dark grey (the doors); the region's name with its red ")))".
const LION = '<path d="M-0.04 -0.4Q0.1 -0.44 0.14 -0.32Q0.24 -0.32 0.2 -0.2L0.1 -0.12Q0.24 0.0 0.18 0.18L0.26 0.38L0.13 0.38L0.06 0.22L-0.06 0.38L-0.18 0.38L-0.06 0.14Q-0.15 0.0 -0.08 -0.12L-0.24 -0.16L-0.22 -0.26L-0.08 -0.22Q-0.15 -0.33 -0.04 -0.4Z" fill="#ffffff"/>' +
  '<path d="M0.18 0.1Q0.36 0.05 0.32 -0.12Q0.3 -0.2 0.38 -0.22" fill="none" stroke="#ffffff" stroke-width="0.05" stroke-linecap="round"/>';
const SHIELD = (fill) => `<path d="M-0.42 -0.48L0.42 -0.48L0.42 0.08Q0.4 0.38 0 0.52Q-0.4 0.38 -0.42 0.08Z" fill="${fill}"/>`;
const naqLion = (c, x, y, h, fill = NAQ.red) => markAt(c, x, y, h, SHIELD(fill) + `<g transform="scale(0.78)">${LION}</g>`);
function naqName(c, x0, y, h) {
  const X = seen(c, x0, h * 6), a = START(c);
  return T(c, X(0), y + h * 0.22, h * 0.3, "Région", "#6b7077", { weight: 500, anchor: a }) + T(c, X(0), y - h * 0.2, h * 0.42, "Nouvelle-Aquitaine", "#6b7077", { weight: 500, anchor: a }) +
    naqWaves(c, X(h * 4.3), y, h * 0.42);
}

// Occitanie: the region's red square with the gold cross of Toulouse (its
// four arms each ending in three balls) and its name; the liO wordmark,
// a yellow dot, "l", "i" and a big ring in blue.
const ARM = '<path d="M0 0L0.09 -0.29L-0.09 -0.29Z"/><circle cx="-0.09" cy="-0.34" r="0.045"/><circle cx="0" cy="-0.38" r="0.045"/><circle cx="0.09" cy="-0.34" r="0.045"/>';
const OCC_CROSS = `<g fill="#f2c21b">${[0, 90, 180, 270].map((r) => `<g transform="rotate(${r})">${ARM}</g>`).join("")}</g>`;
function occCross(c, x, y, h = 1.7) {
  return rect(x - h * 0.38, y - h / 2, h * 0.76, h, "#d8232a") + markAt(c, x, y + h * 0.18, h * 0.55, OCC_CROSS) +
    T(c, x, y - h * 0.2, h * 0.08, "La Région", "#ffffff", { weight: 500 }) + T(c, x, y - h * 0.31, h * 0.13, "Occitanie", "#ffffff", { weight: 500 }) +
    T(c, x, y - h * 0.41, h * 0.06, "Pyrénées - Méditerranée", "#ffffff", { weight: 400 });
}
function liO(c, x0, y, h) {
  const X = seen(c, x0, h * 1.5);
  return circle(X(h * 0.05), y - h * 0.44, h * 0.06, "#f2c21b") + rect(X(h * 0.24) - h * 0.045, y - h * 0.5, h * 0.09, h * 1.0, "#2b3590", 0, `rx="${n(h * 0.045)}"`) +
    rect(X(h * 0.44) - h * 0.045, y - h * 0.5, h * 0.09, h * 0.66, "#2b3590", 0, `rx="${n(h * 0.045)}"`) + circle(X(h * 0.44), y + h * 0.32, h * 0.06, "#e23a3a") +
    `<ellipse cx="${n(X(h * 1.0))}" cy="${n(y)}" rx="${n(h * 0.34)}" ry="${n(h * 0.45)}" fill="none" stroke="#2b3590" stroke-width="${n(h * 0.12)}"/>`;
}

// Pays de la Loire: "Région PAYS DE LA LOIRE" with its blue and yellow
// brackets (Regio 2N, Le Croisic); Aléop: its name in a hand-lettered
// italic, two blue brackets, "RÉGION PAYS DE LA LOIRE" stacked (Z 24500,
// La Ménitré 2024).
function pdlName(c, x0, y) {
  const X = seen(c, x0, 6.2), a = START(c);
  return path(`M${n(X(0.2))} ${n(y + 0.8)}Q${n(X(0.85))} ${n(y)} ${n(X(0.2))} ${n(y - 0.8)}`, "none", 0, 'stroke="#2c9ad6" stroke-width="0.25"') +
    path(`M${n(X(0.6))} ${n(y + 0.7)}Q${n(X(1.2))} ${n(y)} ${n(X(0.6))} ${n(y - 0.7)}`, "none", 0, 'stroke="#f2c21b" stroke-width="0.25"') +
    T(c, X(1.35), y + 0.4, 0.32, "Région", "#7a2a6e", { weight: 500, anchor: a }) + T(c, X(1.35), y - 0.2, 0.62, "PAYS DE LA LOIRE", "#1f3c8c", { weight: 500, anchor: a });
}
function aleop(c, x0, y, h, ink = "#2a3fbf") {
  const X = seen(c, x0, h * 6.2), a = START(c);
  return T(c, X(h * 1.25), y, h * 0.95, "Aléop", ink, { weight: 500, italic: true, family: "'Brush Script MT', 'Segoe Script', cursive" }) +
    [2.6, 2.85].map((u) => path(`M${n(X(h * u))} ${n(y + h * 0.42)}Q${n(X(h * (u + 0.22)))} ${n(y)} ${n(X(h * u))} ${n(y - h * 0.42)}`, "none", 0, `stroke="${ink}" stroke-width="${n(h * 0.09)}"`)).join("") +
    ["RÉGION", "PAYS", "DE LA", "LOIRE"].map((w, i) => T(c, X(h * 3.25), y + h * (0.33 - i * 0.24), h * 0.2, w, ink, { weight: i ? 400 : 600, anchor: a })).join("") +
    T(c, X(h * 1.25), y - h * 0.55, h * 0.12, "LA RÉGION VOUS TRANSPORTE", ink, { weight: 500 });
}

// Région Sud (PACA): its arms quartered, Provence's red pales on gold, the
// dolphin of the Dauphiné, the red eagle of Nice, the horn of Orange in
// blue (on the Z 26500's cab, Nice 2024).
const PACA_ARMS = '<path d="M-0.4 -0.48L0.4 -0.48L0.4 0.1Q0.38 0.38 0 0.5Q-0.38 0.38 -0.4 0.1Z" fill="#f2c21b"/>' +
  '<g clip-path="none"><path d="M-0.3 -0.48h0.07v0.48h-0.07zM-0.16 -0.48h0.07v0.48h-0.07z" fill="#d8232a"/>' +
  '<path d="M0.06 -0.2Q0.2 -0.42 0.34 -0.22Q0.24 -0.28 0.2 -0.12Q0.12 -0.04 0.06 -0.2Z" fill="#2b5fae"/>' +
  '<path d="M-0.4 0.0L0 0.0L0 0.5Q-0.38 0.38 -0.4 0.1Z" fill="#f4f4f2"/><path d="M-0.3 0.06L-0.2 0.16L-0.1 0.06L-0.13 0.3L-0.27 0.3Z" fill="#d8232a"/>' +
  '<path d="M0 0.0L0.4 0.0L0.4 0.1Q0.38 0.38 0 0.5Z" fill="#2b5fae"/><path d="M0.08 0.18Q0.2 0.1 0.3 0.2L0.26 0.26Q0.18 0.2 0.1 0.24Z" fill="#f2c21b"/></g>';
const pacaArms = (c, x, y, h) => markAt(c, x, y, h, PACA_ARMS);

return { TYPES, MODELS, SETS, FACTS, FLEET: typeof FLEET === "undefined" ? [] : FLEET };
})();

// =====================================================================
// DMU
// =====================================================================
const PART_DMU = (() => {

// TER part: Bombardier AGC (X 76500, B 81500, B 82500, Z 27500), the
// X 73500 / X 73900 railcars, the X 72500 and the Z 21500 / Z 21700.
// Trainsheet's own side views at the shared scale, from published
// dimensions and photographs (Wikimedia Commons 2021-2026).


const { TYPES, MODELS, add, addCab } = registry();
const SETS = {}, FACTS = {}, FLEET = [];

// ===================== Shared marks =====================
// The regions' and networks' marks, drawn as simplified copies of the real
// ones (no logo files), each checked at large scale against photographs of
// the cars (2023-2026; crops in the scratchpad's dmu/logos).
const mk = (c, x, y, h, inner) => markAt(c, x, y, h, inner);
// "ter", TER's lower-case brush script (2006 on): the tall "t" with its
// crossbar reaching back, the looped "e", the "r" with a long tail; h is
// the "t"'s height (Z 27637's nose, Mantes 2024; "ter Bourgogne", Dijon).
const TER_PATH = "M-0.82 -0.62C-0.9 -0.25 -1.0 0.15 -0.82 0.3C-0.68 0.38 -0.55 0.26 -0.45 0.14M-1.12 -0.24L-0.58 -0.3" +
  "M-0.45 0.14C-0.2 -0.02 -0.04 -0.17 -0.14 -0.27C-0.28 -0.36 -0.5 -0.1 -0.42 0.14C-0.32 0.36 -0.06 0.3 0.12 0.12" +
  "M0.12 0.12C0.22 -0.02 0.28 -0.16 0.34 -0.26C0.38 -0.1 0.37 0.08 0.36 0.24M0.36 0.0C0.46 -0.2 0.62 -0.3 0.78 -0.24";
// The "r"'s tail: a long sweep tapering down to the right.
const TER_TAIL = "M0.68 -0.31C1.0 -0.2 1.2 0.14 1.46 0.43L1.3 0.44C1.1 0.2 0.92 -0.05 0.7 -0.16Z";
const terWord = (c, x, y, h, fill, { accent = null } = {}) => mk(c, x, y, h, `<path d="${TER_PATH}" fill="none" stroke="${fill}" stroke-width="0.15" stroke-linecap="round" stroke-linejoin="round"/><path d="${TER_TAIL}" fill="${fill}"/>` +
  (accent ? `<path d="M0.62 0.46Q1.0 0.56 1.42 0.46" fill="none" stroke="${accent}" stroke-width="0.09" stroke-linecap="round"/>` : ""));
// liO (Occitanie's network): a yellow dot, a thin "l", "i" and "O".
const lio = (c, x, y, h, fill, dot = "#f6c400") => circle(x - h * 0.55, y - h * 0.32, h * 0.13, dot) + T(c, x + h * 0.35, y, h, "liO", fill, { weight: 300, family: SANS, spacing: 0.02 * h });
// "SERVICE / PUBLIC / OCCITANIE / TRANSPORTS" right-aligned before a navy
// "liO", the region's square after it (Z 27500 at Narbonne, 2024).
const lioBlock = (c, x, y) => ["SERVICE", "PUBLIC", "OCCITANIE", "TRANSPORTS"].map((t, i) => T(c, x - 1.1, y + 0.55 - i * 0.36, 0.26, t, "#4a4f57", { weight: 600, anchor: "end", spacing: 0.02 })).join("") +
  lio(c, x, y, 1.45, "#24318a") + occitanie(c, x + 4.2, y + 0.05, 2.0);
// The Occitanie region's mark: a red square edged in white, the gold
// Occitan cross (four flared arms, three pommels on each) in its upper
// part, "Occitanie" in white under it (Z 27702 at Bram, 2022).
const OCC_CROSS = [0, 90, 180, 270].map((a) => `<g transform="rotate(${a})"><path d="M-0.025 -0.03L-0.09 -0.24L0.09 -0.24L0.025 -0.03Z" fill="#f6c400"/>` +
  [-0.08, 0, 0.08].map((dx) => `<circle cx="${dx}" cy="-0.28" r="0.035" fill="#f6c400"/>`).join("") + "</g>").join("");
// The mark is two halves: the cross's left half, and on the right the
// Catalan bars (gold, four red pales), as on Z 27702's cab.
const CAT_BARS = '<rect x="0.015" y="-0.33" width="0.31" height="0.66" fill="#f6c400"/>' +
  [0.055, 0.125, 0.195, 0.265].map((px) => `<rect x="${px}" y="-0.33" width="0.04" height="0.66" fill="#d81e1e"/>`).join("");
const occitanie = (c, x, y, h) => mk(c, x, y, h, '<rect x="-0.4" y="-0.5" width="0.8" height="1" fill="#d81e1e" stroke="#ffffff" stroke-width="0.035"/>' +
  `<g transform="translate(0 -0.14) scale(1.05)">${OCC_CROSS}${CAT_BARS}</g>`) + T(c, x, y - h * 0.3, h * 0.15, "Occitanie", "#ffffff", { weight: 600 });
// Auvergne-Rhône-Alpes: a white disc with the region's mark in blue line
// (a short climb, a dip, a peak, and the bar under them), "La Région /
// Auvergne-Rhône-Alpes" (B 81737, B 81663, 2026).
const AURA_MARK = (ink, w = 0.065) => `<path d="M-0.33 0.17L-0.15 -0.04M-0.17 -0.03Q-0.04 0.11 0.1 -0.04M-0.06 -0.09L0.05 -0.27L0.28 0.09M-0.19 0.19L0.31 0.19" fill="none" stroke="${ink}" stroke-width="${w}" stroke-linecap="butt" stroke-linejoin="miter"/>`;
const auraDisc = (c, x, y, r, ink = "#2a8fd0", bg = "#ffffff") => circle(x, y, r, bg) + mk(c, x, y, r * 2, AURA_MARK(ink));
const auraName = (c, x, y, h, fill = "#ffffff", anchor = "start") => T(c, x, y, h, "La Région", fill, { weight: 700, anchor }) +
  T(c, x, y - h * 1.05, h * 0.72, "Auvergne-Rhône-Alpes", fill, { weight: 400, anchor });
// Nouvelle-Aquitaine: the shield (square top, rounded point), red and
// white wavy pales down its left, the white lion rampant on red; "RÉGION /
// Nouvelle-Aquitaine" in grey beside it (Agen and Périgueux, 2023-2025).
const NA_LION = "M0.0 0.32L0.04 0.08L-0.06 -0.02L-0.02 -0.18L0.07 -0.31L0.17 -0.3L0.14 -0.22L0.24 -0.2L0.2 -0.1L0.12 -0.12L0.1 -0.02L0.27 0.06L0.2 0.12L0.26 0.32L0.17 0.32L0.13 0.17L0.08 0.32Z" +
  "M-0.06 -0.02Q-0.16 -0.12 -0.1 -0.24L-0.06 -0.2Q-0.1 -0.12 -0.04 -0.06Z";
const naShield = (c, x, y, h) => mk(c, x, y, h, '<path d="M-0.38 -0.5L0.38 -0.5L0.38 0.12Q0.38 0.42 0 0.5Q-0.38 0.42 -0.38 0.12Z" fill="#c8102e" stroke="#ffffff" stroke-width="0.03"/>' +
  '<path d="M-0.36 -0.48L-0.14 -0.48L-0.14 0.38Q-0.3 0.3 -0.36 0.12Z" fill="#ffffff"/>' +
  [-0.31, -0.22].map((cx) => `<path d="M${cx} -0.46Q${cx + 0.05} -0.3 ${cx} -0.15Q${cx - 0.05} 0.0 ${cx} 0.15Q${cx + 0.04} 0.26 ${cx} 0.33" fill="none" stroke="#c8102e" stroke-width="0.04"/>`).join("") +
  `<path d="${NA_LION}" fill="#ffffff"/>`);
const naName = (c, x, y, h, ink = "#5a6068") => naShield(c, x, y, h * 2.2) + T(c, x + h * 1.1, y + h * 0.65, h * 0.4, "RÉGION", ink, { weight: 600, anchor: "start" }) +
  T(c, x + h * 1.1, y, h * 0.8, "Nouvelle-", ink, { weight: 500, anchor: "start", stretch: 0.88 }) + T(c, x + h * 1.1, y - h * 0.85, h * 0.8, "Aquitaine", ink, { weight: 500, anchor: "start", stretch: 0.88 });
// Hauts-de-France: a white card with the region's outline in blue and a
// green tick inside it; on the AGCs it heads a blue panel with "Région" in
// green and "Hauts-de-France" in white (B 82770 at Rémy, 2023).
const HDF_MAP = '<path d="M-0.18 -0.42C-0.05 -0.5 0.12 -0.45 0.2 -0.36L0.28 -0.18Q0.22 0 0.3 0.15L0.2 0.35Q0.05 0.42 -0.05 0.36L-0.25 0.3Q-0.18 0.12 -0.28 -0.02Q-0.32 -0.25 -0.18 -0.42Z" fill="none" stroke="#2c46a7" stroke-width="0.05"/>' +
  '<path d="M-0.13 -0.12L0.0 0.12L0.2 -0.3" fill="none" stroke="#7cc242" stroke-width="0.06" stroke-linecap="round"/>';
const hdfCard = (c, x, y, h) => rect(x - h * 0.36, y - h * 0.5, h * 0.72, h, "#f4f5f2", 0, `rx="${n(h * 0.03)}"`) + mk(c, x, y + h * 0.1, h * 0.62, HDF_MAP) +
  T(c, x, y - h * 0.3, h * 0.08, "Région", "#7cc242", { weight: 700 }) + T(c, x, y - h * 0.39, h * 0.08, "Hauts-de-France", "#2c46a7", { weight: 700 });
const hdfPanel = (c, x, y, h) => rect(x, y - h / 2, h * 3.4, h, "#2c46a7") + rect(x, y - h / 2, h * 0.62, h, "#f4f5f2") + mk(c, x + h * 0.31, y, h * 0.8, HDF_MAP) +
  T(c, x + h * 0.75, y + h * 0.2, h * 0.32, "Région", "#7cc242", { weight: 700, anchor: "start", stretch: 0.85 }) +
  T(c, x + h * 0.75, y - h * 0.2, h * 0.42, "Hauts-de-France", "#ffffff", { weight: 700, anchor: "start", stretch: 0.78 });
// Grand Est: the region's blue box, "La Région" over "Grand Est" in white,
// a white swash under them (X 76510 at Verdun, 2026).
const geLogo = (c, x, y, h) => rect(x - h * 1.6, y - h * 0.5, h * 3.2, h, "#2b49a6") + T(c, x, y + h * 0.25, h * 0.24, "La Région", "#ffffff", { weight: 600 }) +
  T(c, x, y - h * 0.08, h * 0.46, "Grand Est", "#ffffff", { weight: 800, spacing: -0.03 * h }) + path(`M${n(x - h * 1.1)} ${n(y - h * 0.36)}Q${n(x)} ${n(y - h * 0.3)} ${n(x + h * 1.2)} ${n(y - h * 0.36)}`, "none", 0, `stroke="#ffffff" stroke-width="${n(h * 0.03)}"`);
// fluo Grand Est: "fluo" in a rounded lime italic, "Grand Est" in white bold
// under its end.
const fluoWord = (c, x, y, h, ink = "#a8cf2f", ge = "#ffffff") => T(c, x, y, h, "fluo", ink, { weight: 700, italic: true, family: "'Arial Rounded MT Bold', 'Helvetica Neue', Arial, sans-serif", spacing: -0.04 * h }) +
  T(c, x + h * 0.55, y - h * 0.85, h * 0.45, "Grand Est", ge, { weight: 700, spacing: -0.02 * h });
// Rémi (Centre-Val de Loire): a white card, "Rémi" in heavy navy italic
// with a green accent, the network's line with stations under it (X 72529,
// Tours and Paris-Austerlitz 2024).
const remi = (c, x, y, h) => rect(x - h * 1.2, y - h * 0.62, h * 2.4, h * 1.24, "#ffffff", 0, `rx="${n(h * 0.05)}"`) +
  T(c, x, y + h * 0.05, h * 0.7, "Rémi", "#1d2f6e", { weight: 900, italic: true, spacing: -0.03 * h }) + path(`M${n(x - 0.55 * h)} ${n(y + 0.36 * h)}Q${n(x - 0.3 * h)} ${n(y + 0.58 * h)} ${n(x - 0.05 * h)} ${n(y + 0.42 * h)}Q${n(x - 0.3 * h)} ${n(y + 0.3 * h)} ${n(x - 0.55 * h)} ${n(y + 0.36 * h)}Z`, "#56b04a") +
  line(x - h * 0.85, y - h * 0.4, x + h * 0.55, y - h * 0.4, "#1d2f6e", 0.6) + [-0.6, -0.15, 0.3].map((d) => circle(x + d * h, y - h * 0.4, h * 0.07, "#1d2f6e")).join("");
// Normandie: the region's red square with its two gold leopards, over
// "NORMANDIE", on a white panel beside the door (Z 27637 at Mantes, 2024).
const LEOPARD = "M-0.3 0.02L-0.18 -0.08L0.1 -0.08L0.2 -0.16L0.3 -0.12L0.26 -0.04L0.3 0.08L0.22 0.08L0.18 0.0L0.12 0.08L0.04 0.08L0.04 0.0L-0.14 0.0L-0.18 0.08L-0.26 0.08Z";
const normandie = (c, x, y, h) => rect(x - h * 0.3, y - h * 0.75, h * 0.6, h * 1.5, "#f4f5f6") + mk(c, x, y + h * 0.2, h * 0.5, '<rect x="-0.5" y="-0.5" width="1" height="1" fill="#d7262f"/>' +
  `<g transform="translate(0 -0.18)"><path d="${LEOPARD}" fill="#f6c400"/></g><g transform="translate(0 0.22)"><path d="${LEOPARD}" fill="#f6c400"/></g>`) +
  T(c, x, y - h * 0.22, h * 0.09, "NORMANDIE", "#3b4047", { weight: 700 });
// Région Sud and ZOU! (Provence-Alpes-Côte d'Azur): "RÉGION / SUD" in white
// bold capitals, "PROVENCE / ALPES / CÔTE D'AZUR" small, the region's shield
// (Provence's red pales on gold, Dauphiné's blue, the Comté de Nice's
// eagle in red on white), "VOTRE MOBILITÉ, NOTRE PRIORITÉ.", "ZOU!" (X 76543
// at Tende, 2024).
const sudShield = (c, x, y, h) => mk(c, x, y, h, '<path d="M-0.35 -0.5L0.35 -0.5L0.35 0.2Q0.3 0.42 0 0.5Q-0.3 0.42 -0.35 0.2Z" fill="#f6c400"/>' +
  [-0.27, -0.14].map((cx) => `<rect x="${cx}" y="-0.5" width="0.07" height="0.92" fill="#d7262f"/>`).join("") +
  '<rect x="0" y="-0.5" width="0.35" height="0.48" fill="#2a3e9b"/><path d="M0 -0.02L0.35 -0.02L0.35 0.2Q0.3 0.42 0 0.5Z" fill="#ffffff"/><path d="M0.1 0.08L0.25 0.08L0.18 0.3Z" fill="#d7262f"/>' +
  '<circle cx="0.17" cy="-0.26" r="0.08" fill="#f6c400"/>');
const regionSud = (c, x, y, h) => T(c, x, y + h * 0.5, h * 0.55, "RÉGION", "#ffffff", { weight: 800, family: NARROW, anchor: "start" }) + T(c, x + h * 0.4, y - h * 0.1, h * 0.55, "SUD", "#ffffff", { weight: 800, family: NARROW, anchor: "start" }) +
  ["PROVENCE", "ALPES", "CÔTE D'AZUR"].map((t, i) => T(c, x + h * 0.6, y - h * (0.55 + i * 0.22), h * 0.18, t, "#ffffff", { weight: 500, family: NARROW })).join("") + sudShield(c, x + h * 2.75, y + h * 0.1, h * 1.3);
const zouWord = (c, x, y, h) => T(c, x, y, h, "ZOU", "#ffffff", { weight: 900, family: NARROW, italic: true, spacing: -0.04 * h, anchor: "start" }) +
  rect(x + h * 1.75, y - h * 0.15, h * 0.18, h * 0.62, "#ffffff", 0, `transform="skewX(-8)"`) + circle(x + h * 1.8, y - h * 0.38, h * 0.1, "#ffffff");
// BreizhGo: "BREIZHGO" in light grey capitals on a black panel (Z 21599 at
// Nantes, 2026).
const breizhgo = (c, x, y, h) => rect(x - h * 2.4, y - h * 0.6, h * 4.8, h * 1.2, "#232427", 0, `rx="${n(h * 0.06)}"`) + T(c, x, y - h * 0.02, h * 0.85, "BREIZHGO", "#c9ccd0", { weight: 800, family: NARROW, stretch: 0.82, spacing: 0.02 * h });

// ===================== Bombardier AGC =====================
// AGC ("autorail grande capacité", Bombardier, 2004-2010): articulated, the
// end cars 21.0 m from the coupler to the Jakobs truck's middle (the motor
// truck 16.4 m from it, so 4.6 m from the coupler), the middle cars 15.4 m;
// three cars 57.4 m, four 72.8 m; 4.02 m tall, 2.95 m wide (fr.wikipedia
// "Autorail grande capacité"). One double door a side in each car. Behind
// each cab, over the motor truck, a raised section ("baie surélevée") with
// four big windows; elsewhere the floor is low (600 mm) and the windows sit
// lower. X 76500 diesel, B 81500 and B 82500 bimode (one and two
// pantographs, on the middle cars), Z 27500 electric (two pantographs); the
// diesel and bimode units have grilles under the raised section's last
// window, the Z 27500 none.
// Measured off broadside photographs: B 81500 three cars on the Ribeyrès
// viaduct (whole unit, 2023), B 81737 and 81661 at Polliat and
// Bourg-en-Bresse (cab, nose profile, raised section; 2026), Z 27702 at Bram
// (cab to door; 2022), scaled by the middle car's 15.4 m.
// Heights checked against the middle cars' broadsides (X 76513 at Hémévillers,
// B 81500 on the Ribeyrès viaduct): 4.02 m to the top of the roof covers.
const AG = { L: 68.9, M: 50.5, roof: 12.6, eave: 11.85, sill: 1.4, raised: 3.3, rwin: [6.07, 10.1], lwin: [4.2, 8.55], door: [1.55, 10.2], wheel: 33 };
// The nose, bottom to roof (the profile of B 81661 at Polliat).
const NOSE_AGC = [[7.8, 0.85], [3.0, 0.8], [1.2, 1.0], [0.62, 1.55], [0.4, 2.5], [0.36, 4.75], ["q", 0.32, 5.9, 0.62, 6.3], [1.1, 7.3], [1.8, 8.4], [2.8, 9.65],
  ["q", 3.5, 10.3, 4.15, 10.75], ["q", 5.5, 11.65, 6.9, 12.2], ["q", 8.3, AG.roof, 10.7, AG.roof]];
const RAISED_WIN = [[12.6, 17.7], [18.5, 23.6], [24.5, 29.7], [30.5, 35.8]];
const LOW_WIN_END = [[45.4, 50.0], [51.1, 55.6], [56.8, 61.2], [62.4, 66.9]];
const END_DOOR = 38.6, DOOR_W = 5.6;
const MID_C = AG.M / 2;
const MID_WIN = [[-22.9, -18.55], [-17.15, -12.55], [-11.5, -6.85], [-5.6, -3.9], [3.9, 5.6], [6.85, 11.5], [12.55, 17.15], [18.55, 22.9]].map(([a, b]) => [MID_C + a, MID_C + b]);
const MID_DOOR = MID_C - DOOR_W / 2;
// The body's underside: the raised section over the motor truck, low behind
// it; over each Jakobs truck the floor rises for the last few feet.
const endBottom = (L) => [[7.8, 0.85], [8.3, AG.raised], [20.9, AG.raised], [21.4, AG.sill], [L - 4.4, AG.sill], [L - 3.9, 2.9]];
const midBottom = (L) => [[0.35, 2.9], [3.9, 2.9], [4.4, AG.sill], [L - 4.4, AG.sill], [L - 3.9, 2.9]];

// A double plug door ("louvoyante"), its tall leaf windows; fill: the
// leaves' colour.
function agcDoor(x, fill, { frame = null, bike = false, c = null } = {}) {
  let s = frame ? rect(x - 0.35, AG.door[0] - 0.05, DOOR_W + 0.7, AG.door[1] - AG.door[0] + 0.45, frame, 0, 'rx="0.35"') : "";
  s += leaves(x, DOOR_W, AG.door[0], AG.door[1], fill, { glass: [0.27, 0.72], gw: 0.48 });
  if (bike && c) s += bikeSign(x + 0.9, AG.door[1] - 0.75, 0.55, "#ffffff");
  return s;
}
// A bicycle pictogram h ft tall centred at (x, y).
function bikeSign(x, y, h, color) {
  const r = h * 0.3, st = `fill="none" stroke="${color}" stroke-width="${n(h * 0.09)}"`;
  return `<g transform="translate(${n(x)} ${n(y)})"><circle cx="${n(-h * 0.5)}" cy="${n(-h * 0.15)}" r="${n(r)}" ${st}/><circle cx="${n(h * 0.5)}" cy="${n(-h * 0.15)}" r="${n(r)}" ${st}/>` +
    `<path d="M${n(-h * 0.5)} ${n(-h * 0.15)}L${n(-h * 0.15)} ${n(h * 0.3)}L${n(h * 0.3)} ${n(h * 0.3)}L${n(h * 0.5)} ${n(-h * 0.15)}M${n(-h * 0.15)} ${n(h * 0.3)}L${n(0)} ${n(-h * 0.15)}L${n(h * 0.3)} ${n(h * 0.3)}" ${st}/></g>`;
}
// A window in its rubber frame (the AGC's are flush, dark-framed).
const agcWin = (a, b, [lo, hi], frame = "#3a3f46") => rect(a - 0.18, lo - 0.18, b - a + 0.36, hi - lo + 0.36, frame, 0, 'rx="0.35"') + pane(a, lo, b - a, hi - lo, 0.3, "#1c1f23");
// The louvred fairing along the side's top (the roof's edge), louvre slats.
const louvres = (x0, x1, color) => rect(x0, AG.eave, x1 - x0, AG.roof - AG.eave + 0.05, color) +
  lines(seq(x0 + 0.6, 0.55, Math.floor((x1 - x0 - 1) / 0.55)).filter((x, i) => i % 9 !== 8).map((x) => [x, AG.eave + 0.2, x, AG.roof - 0.15]), "rgba(0,0,0,0.28)", 0.45);
// The headlight cluster: a pointed white lens back along the nose's side.
const agcEye = (fill = "#e9ecef") => path("M0.45 5.6Q0.5 6.35 1.2 6.4L2.6 6.05Q2.0 5.55 1.1 5.0Q0.5 5.0 0.45 5.6Z", fill, 0, 'stroke="rgba(0,0,0,0.35)" stroke-width="0.5" vector-effect="non-scaling-stroke"') +
  circle(0.95, 5.68, 0.28, "#fbf7e6", 0, 'stroke="#555" stroke-width="0.4" vector-effect="non-scaling-stroke"');
// The windscreen seen edge-on: a dark band along the nose's front edge.
const agcScreen = path("M0.55 6.45Q0.75 7.2 1.25 7.8L2.35 9.25Q3.0 10.1 3.8 10.75L4.2 10.2Q3.5 9.6 2.9 8.8L1.85 7.35Q1.35 6.8 1.2 6.35Z", "#16191d");

// The end car, cab on the left. o: liv (paint scheme), ver: "X" (X 76500),
// "B" (B 81500), "B2" (B 82500), "Z" (Z 27500).
function agcEnd(c, o) {
  const L = c.L, liv = o.liv, g0 = { L, cab: true, ver: o.ver };
  const paint = (g) => {
    let s = liv.paint(c, g0);
    s += louvres(10.9, L + 1, liv.louvre);
    s += RAISED_WIN.map(([a, b]) => agcWin(a, b, AG.rwin, liv.frame)).join("") + LOW_WIN_END.map(([a, b]) => agcWin(a, b, AG.lwin, liv.frame)).join("");
    s += agcDoor(END_DOOR, liv.door, { frame: liv.doorFrame, bike: liv.bikeOnDoor, c });
    // The cab's side door and its window.
    s += rect(7.0, 5.0, 2.4, 5.6, "none", 0, `rx="0.2" stroke="rgba(0,0,0,0.45)" stroke-width="0.6" ${STROKE}`) + pane(7.25, 8.3, 1.9, 2.2, 0.15, "#15181b");
    // The cab module's seam; the vent grille ahead of it.
    s += line(10.9, AG.raised + 0.1, 10.9, AG.roof - 0.1, "rgba(0,0,0,0.35)", 0.6) + rect(9.55, 4.55, 1.1, 1.0, "#c6cace", 0, `stroke="#8a9096" stroke-width="0.4" ${STROKE}`) + slats(9.6, 4.6, 1.0, 0.9, 0.18, "rgba(0,0,0,0.6)");
    // Diesel and bimode units: the cooling grille under the last raised window.
    if (o.ver !== "Z") s += rect(31.2, 4.15, 4.4, 0.65, "#1d2024") + slats(31.25, 4.18, 4.3, 0.6, 0.2, "rgba(255,255,255,0.18)");
    // The lower nose and the skirt under it.
    s += liv.nose ? liv.nose(c, g0) : "";
    s += agcScreen + agcEye(liv.eye);
    s += liv.over ? liv.over(c, g0) : "";
    return s;
  };
  return body(c, { sill: AG.sill, roof: AG.roof, nose: NOSE_AGC, x1: L - 0.35, bottom: endBottom(L), base: liv.base, ends: [AG.sill + 0.8, AG.roof - 1.5], paint,
    under: () => truck(15.1, { wb: 8.86, d: AG.wheel, top: AG.raised + 0.1 }) + jakobs(L, AG.sill + 0.6, 30, 9.19) + (c.coupledL ? coupledCouplers(2.8) : autoCoupler(0.7, 2.8)) +
      cases(22, 36, AG.sill + 0.1, 2, 0.5) + (o.ver !== "Z" ? rect(8.5, 1.7, 2.0, 1.4, "#2c2f35", 0, 'rx="0.2"') + rect(21.0, 1.9, 1.0, 1.2, "#3a3e44") : ""),
    top: () => agcRoofEnd(L, o.ver, liv.louvre),
  });
}
// The end car's roof: the cab's dome, the air conditioning over the raised
// section; the diesel units' cooling and exhaust box over the raised section.
// The roof covers: a row of louvred panels in the body's upper colour
// standing about 0.3 m over the roof's edge along the whole car (every
// photograph; they hide the air conditioning and, on the diesel and bimode
// units, the cooling), short ones over the cab.
const AG_COVER = 0.62;
function agcCovers(x0, x1, color) {
  const R = AG.roof, top = R + AG_COVER, k = Math.max(1, Math.round((x1 - x0) / 7.6)), w = (x1 - x0) / k;
  let s = rect(x0, R - 0.05, x1 - x0, AG_COVER + 0.05, color, 0.4, 'rx="0.15"');
  for (let i = 0; i < k; i++) {
    const a = x0 + i * w;
    s += line(a, R, a, top, "rgba(0,0,0,0.35)", 0.5) + lines(seq(R + 0.2, 0.17, 4).map((y) => [a + 0.9, y, a + w * 0.45, y]).concat(seq(R + 0.2, 0.17, 4).map((y) => [a + w * 0.55, y, a + w - 0.9, y])), "rgba(0,0,0,0.45)", 0.5);
  }
  return s;
}
function agcRoofEnd(L, ver, color) {
  let s = agcCovers(11.6, L - 0.6, color);
  if (ver !== "Z") s += rect(23.6, AG.roof + AG_COVER - 0.05, 11.5, 0.45, "#9ea4ab", 0.4, 'rx="0.15"') + rect(29.5, AG.roof + AG_COVER + 0.4, 1.0, 0.35, "#4b5056", 0.3);
  return s;
}
// A middle car (Jakobs trucks at both ends). pans: pantograph positions.
function agcMid(c, o) {
  const L = c.L, liv = o.liv, g0 = { L, cab: false, ver: o.ver, index: o.index };
  const paint = () => {
    let s = liv.paint(c, g0);
    s += louvres(-1, L + 1, liv.louvre);
    s += MID_WIN.map(([a, b]) => agcWin(a, b, AG.lwin, liv.frame)).join("");
    s += agcDoor(MID_DOOR, liv.door, { frame: liv.doorFrame, bike: liv.bikeOnDoor, c });
    s += liv.over ? liv.over(c, g0) : "";
    return s;
  };
  return body(c, { sill: AG.sill, roof: AG.roof, x0: 0.35, x1: L - 0.35, bottom: midBottom(L), base: liv.base, ends: [AG.sill + 0.8, AG.roof - 1.5], paint,
    under: () => jakobs(0, AG.sill + 0.6, 30, 9.19) + jakobs(L, AG.sill + 0.6, 30, 9.19) + cases(8, L - 8, AG.sill + 0.1, 3, 0.45),
    top: () => agcCovers(0.6, L - 0.6, liv.louvre) + (o.pans || []).map(([x, dir]) => panGear(x, AG.roof + AG_COVER, { dir })).join(""),
  });
}

// ---------- AGC paint schemes ----------
// Each: base (the body), louvre (the roof-edge fairing), frame (window
// frames), door, doorFrame, eye, paint(c, g) under the windows, nose(c, g)
// over the cab, over(c, g) the lettering.
const DARK = "#5c6168";
// The cab's cap (TER's 2004 national scheme): over the windscreen and back
// past the cab door, its back edge curving down and forward to the
// headlight; under it a white band through the lamps.
const CAP = "M-1 14L12.4 14L12.4 13.2Q11.2 11.6 10.8 9.4Q10.4 7.6 8.6 6.6Q5.6 5.3 2.6 5.5L1.0 5.6L-1 5.6Z";
const LAMPBAND = "M-1 6.55L1.2 6.55Q4.0 6.3 6.4 6.7Q5.0 5.3 2.6 4.75L-1 4.75Z";
// The dark panels round the windows: on the raised section (its front edge
// slanting), and round the low windows; mid: a middle car's two.
const raisedPanel = (fill) => path(`M11.75 ${AG.eave - 1.15}L36.6 ${AG.eave - 1.15}L36.6 3.4L12.6 3.4Q12.2 7.0 11.75 ${AG.eave - 1.15}Z`, fill);
const lowPanel = (x0, x1, fill) => rect(x0, 2.6, x1 - x0, AG.lwin[1] + 0.55 - 2.6, fill);
const panels = (g, fill) => g.cab ? raisedPanel(fill) + lowPanel(44.85, g.L + 1, fill)
  : lowPanel(-1, MID_DOOR - 0.45, fill) + lowPanel(MID_DOOR + DOOR_W + 0.45, g.L + 1, fill);
const doorX = (g) => (g.cab ? END_DOOR : MID_DOOR);
// Thin teal strips either side of each door (the national scheme).
const doorStrips = (g, color = "#16a596") => rect(doorX(g) - 0.45, AG.door[0] + 0.3, 0.22, AG.door[1] - AG.door[0] - 0.6, color) + rect(doorX(g) + DOOR_W + 0.23, AG.door[0] + 0.3, 0.22, AG.door[1] - AG.door[0] - 0.6, color);
// "ter" in TER's lower-case italic, h ft tall.

// TER's national AGC scheme (most AGCs in 2026): silver; the cab's cap and
// the roof-edge fairing in the region's colour, the white band through the
// lamps; the windows in dark grey panels; silver doors with teal strips;
// the lower nose and skirt a darker grey (B 82599 at Chambéry, Z 27804 at
// Plouaret, Z 27637 at Mantes, Z 27738 at Dijon, B 82770 at Rémy,
// 2022-2025). o: cap, louvre, panel, doors, strips, body, deco(c, g) under
// the windows, mark(c, g) lettering over them.
const national = (o) => ({
  base: o.body || "#b9bec4", louvre: o.louvre || o.cap, frame: "#3a3f46", door: o.doors || "#c3c7cc", doorFrame: null, eye: "#eef0f1",
  paint: (c, g) => {
    const L = g.L;
    let s = rect(-1, 0, L + 2, 2.4, "#8d939a") + panels(g, o.panel || DARK);
    s += o.under ? o.under(c, g) : "";
    if (g.cab) s += path(CAP, o.cap) + path(LAMPBAND, "#eef0f1") + rect(-1, 0, 8.4, 4.75, "#a9aeb5") + line(-1, 4.75, 7.6, 4.75, "rgba(0,0,0,0.25)", 0.5);
    if (o.strips !== false) s += doorStrips(g, o.strips || "#16a596");
    return s + (o.deco ? o.deco(c, g) : "");
  },
  over: (c, g) => (g.cab ? sncf(c, 5.9, 8.2, 0.8, { voyageurs: !!o.voyageurs }) : "") + (o.mark ? o.mark(c, g) : ""),
});

// --- The regions' versions of the national scheme ---
const NAT_BLUE = "#3a4fb5";
// Auvergne-Rhône-Alpes (Z 27500, B 82500): blue cap; "La Région /
// Auvergne-Rhône-Alpes" in pale blue with the region's disc low behind the
// cab (B 82599 at Chambéry, 2025; Z 27605 at Bellegarde, 2024).
const LIV_AURA_NAT = national({ cap: NAT_BLUE, mark: (c, g) => g.cab ? auraDisc(c, 14.4, 4.55, 0.75, "#ffffff", "#5aa9e0") + auraName(c, 15.6, 4.85, 0.85, "#7fbdea") +
  auraDisc(c, 9.6, 11.6, 0.45, NAT_BLUE, "#eef0f1") : "" });
// Normandie (Z 27500, B 82500, X 76500): blue cap with white rings and
// dots; pale blue bubbles over the side; "ter" in blue on the nose (Z 27637
// and 27517, Rouen and Mantes, 2024).
const bubbles = (list, color) => list.map(([x, y, r]) => circle(x, y, r, color)).join("");
const LIV_NOR = national({ cap: NAT_BLUE,
  deco: (c, g) => g.cab ? `<circle cx="7.6" cy="10.9" r="1.15" fill="none" stroke="#ffffff" stroke-width="0.22"/>` + bubbles([[7.6, 10.9, 0.55], [5.4, 12.3, 0.28], [9.6, 12.2, 0.2], [4.6, 9.6, 0.18]], "#ffffff") +
      bubbles([[18.2, 4.3, 0.9], [20.4, 3.6, 0.45], [22.8, 4.9, 1.25], [25.6, 3.8, 0.55], [27.9, 5.2, 0.75], [30.6, 4.1, 0.4], [57.0, 2.9, 0.4], [60.0, 3.2, 0.6]], "#5fc3e4") + bubbles([[21.2, 5.4, 0.3], [29.0, 3.6, 0.3]], "#ffffff")
    : bubbles([[8.0, 3.1, 0.5], [11.2, 3.3, 0.8], [36.0, 3.0, 0.45], [39.5, 3.3, 0.7], [42.6, 3.0, 0.4]], "#5fc3e4"),
  mark: (c, g) => (g.cab ? terWord(c, 3.6, 3.6, 1.3, NAT_BLUE) + normandie(c, 36.9, 7.0, 4.6) : "") });
// Bretagne (Z 27500, B 82500): blue cap with a white swirl and the ermine
// tufts of the Breton flag (Z 27804 at Plouaret, 2024; B 82586 at Brest).
const LIV_BZH = national({ cap: NAT_BLUE,
  deco: (c, g) => g.cab ? path("M3.4 6.9Q6.4 7.6 8.2 9.6Q9.6 11.2 10.8 13.6", "none", 0, 'stroke="#ffffff" stroke-width="0.28" stroke-linecap="round"') +
    [[5.0, 7.7], [7.6, 8.9], [9.4, 10.9]].map(([x, y]) => `<ellipse cx="${x}" cy="${y + 0.45}" rx="0.22" ry="0.45" fill="#ffffff"/>`).join("") : "" });
// Bourgogne-Franche-Comté (Z 27500, B 81500 of TER Bourgogne): the cap
// yellow, "ter Bourgogne" in blue on the nose (Z 27738 at Dijon, 2023).
const LIV_BFC = national({ cap: "#f2cd1b", louvre: NAT_BLUE,
  mark: (c, g) => (g.cab ? terWord(c, 3.1, 3.6, 1.2, "#2f4fa6", { accent: "#e2334a" }) + T(c, 4.5, 3.35, 0.42, "Bourgogne", "#2f4fa6", { weight: 500, anchor: "start" }) : "") });
// Hauts-de-France (B 82500, X 76500): blue cap, the window panels and the
// doors blue, green bars slanting by the doors, "www.hautsdefrance.fr" over
// the windows and the region's white tag (B 82770 at Rémy, X 76501 at
// Estrées-Saint-Denis, 2023-2024).
const HDF_BLUE = "#2c46a7", HDF_GREEN = "#7cc242";
// The scheme (B 82770 at Rémy 2023, X 76513 at Hémévillers 2024): the
// national scheme from the cab to the first door ("www.hautsdefrance.fr"
// over the raised windows, the region's tag low on them); beyond, the
// upper side blue (the roof's edge with it), a white band slanting down
// across it at the doors with green ends, green bars at the windows' foot
// by the doors; blue doors framed in white; the region's mark in white on
// the blue; the window panels dark grey.
const hdfUpper = (L, from) => rect(from, AG.lwin[1] + 0.55, L + 1 - from, AG.eave - AG.lwin[1] - 0.5, HDF_BLUE);
const hdfBand = (a, b) => path(`M${n(a)} ${n(AG.lwin[1] + 0.55)}L${n(a + 3.3)} ${AG.eave}L${n(b)} ${AG.eave}L${n(b - 3.1)} ${n(AG.lwin[1] + 0.55)}Z`, "#f4f5f6");
const hdfGreen = (a, w) => path(`M${n(a)} ${n(AG.lwin[1] + 0.55)}L${n(a + 3.3)} ${AG.eave}L${n(a + 3.3 + w)} ${AG.eave}L${n(a + w)} ${n(AG.lwin[1] + 0.55)}Z`, HDF_GREEN);
const hdfWhiteMark = (c, x, y, h) => mk(c, x - h * 0.75, y, h * 1.1, HDF_MAP.replace(/#2c46a7/g, "#ffffff").replace(/#7cc242/g, "#ffffff")) +
  T(c, x, y + h * 0.22, h * 0.36, "Région", "#ffffff", { weight: 700, anchor: "start" }) + T(c, x, y - h * 0.24, h * 0.46, "Hauts-de-France", "#ffffff", { weight: 700, anchor: "start", stretch: 0.85 });
const LIV_HDF = {
  ...national({ cap: NAT_BLUE, louvre: HDF_BLUE, doors: HDF_BLUE, strips: false }),
  paint: (c, g) => {
    const L = g.L;
    let s = national({ cap: NAT_BLUE, louvre: HDF_BLUE, doors: HDF_BLUE, strips: false }).paint(c, g);
    if (g.cab) {
      const d = END_DOOR + DOOR_W + 0.3;
      s += hdfUpper(L, d) + hdfBand(d, 59.0) + hdfGreen(52.8, 6.2) + rect(d, 2.7, 4.8, 0.5, HDF_GREEN);
    } else {
      s += hdfUpper(L, -1) + hdfBand(11.9, 41.2) + hdfGreen(11.9, 4.2) + hdfGreen(33.2, 4.8) + rect(7.3, 2.7, 14.4, 0.5, HDF_GREEN) + rect(28.5, 2.7, 5.0, 0.5, HDF_GREEN);
    }
    // White frames round the doors.
    const dx = doorX(g);
    return s + rect(dx - 0.35, AG.door[0], 0.35, AG.door[1] - AG.door[0] + 0.2, "#f4f5f6") + rect(dx + DOOR_W, AG.door[0], 0.35, AG.door[1] - AG.door[0] + 0.2, "#f4f5f6");
  },
  over: (c, g) => g.cab
    ? sncf(c, 5.9, 8.2, 0.8) + terWord(c, 3.4, 3.6, 1.2, NAT_BLUE) + T(c, 24.0, 10.65, 0.85, "www.hautsdefrance.fr", "#4b5a8a", { weight: 400, spacing: 0.03 }) + hdfPanel(c, 12.9, 4.9, 1.25) + T(c, 30.0, 4.4, 0.42, "www.hautsdefrance.fr", "#ffffff", { weight: 600 }) +
      hdfWhiteMark(c, 58.6, 10.85, 1.2)
    : hdfWhiteMark(c, 4.0, 10.85, 1.2) + hdfWhiteMark(c, 42.6, 10.85, 1.2) + T(c, 13.0, 3.8, 0.42, "www.hautsdefrance.fr", "#ffffff", { weight: 600 }),
};
// Pays de la Loire (Z 27500, X 76500): the cab turquoise to the skirt,
// magenta and yellow stripes across the side by the first door (X 76500
// at La Bernerie, 2023; Z 27500 at Pornic, 2024).
const PDL_TURQ = "#1ea7de";
const LIV_PDL = national({ cap: PDL_TURQ,
  under: (c, g) => g.cab ? path("M-1 14L12.4 14L12.4 13.2Q11.4 11.6 11.6 9.0L11.8 2.4L-1 2.4Z", PDL_TURQ) : "",
  deco: (c, g) => { const x = g.cab ? 36.9 : 2.0; return path(`M${n(x)} 2.4L${n(x + 0.4)} 2.4L${n(x + 0.9)} 12.15L${n(x + 0.5)} 12.15Z`, "#f0d32c") + path(`M${n(x + 0.8)} 2.4L${n(x + 1.9)} 2.4L${n(x + 2.6)} 12.15L${n(x + 1.5)} 12.15Z`, "#b5398f"); } });
// Grand Est (Z 27500 and B 82500 not yet renovated: Lorraine's and
// Alsace's schemes on the national base); the blue cap and the "Grand Est"
// tag drawn, the old regions' side graphics left out.
const LIV_GE_NAT = national({ cap: NAT_BLUE, mark: (c, g) => (g.cab ? geLogo(c, 6.0, 9.7, 0.75) : "") });
// Nouvelle-Aquitaine (B 81500, B 82500, after OPTER renovation): blue cap,
// the region's red shield with the lion, "Région Nouvelle-Aquitaine" low
// behind the cab (B 81500 at Périgueux 2023, Bordeaux 2025).
const LIV_NAQ = national({ cap: NAT_BLUE, voyageurs: true,
  mark: (c, g) => g.cab ? naName(c, 14.6, 4.6, 0.8) : "" });
// Centre-Val de Loire (Z 27500): the national scheme, blue cap.
const LIV_CVL = national({ cap: NAT_BLUE, mark: (c, g) => (g.cab ? terWord(c, 3.4, 3.6, 1.2, NAT_BLUE) : "") });
// Provence-Alpes-Côte d'Azur (B 81500): the national scheme, blue cap.
const LIV_PACA = national({ cap: NAT_BLUE, mark: (c, g) => (g.cab ? terWord(c, 3.4, 3.6, 1.2, NAT_BLUE) : "") });

// Occitanie, liO light on the AGC (B 81500 and Z 27500 of the former TER
// Languedoc-Roussillon): white with the blue cap, red doors framed in
// white, "liO" and the region's mark on the nose and by the doors (B
// 81500 on the Ribeyrès viaduct, 2023; Z 27500 at Cerbère, 2023).
const LIV_OCC_LIGHT = {
  ...national({ cap: "#2f4fa6", body: "#eef0f1", doors: "#d7262f", strips: false,
    mark: (c, g) => (g.cab ? lio(c, 4.6, 3.6, 0.95, "#34383d") + occitanie(c, 7.4, 3.6, 0.7) + lioBlock(c, 53.5, 10.6) : lioBlock(c, 16.0, 10.6)) }), doorFrame: "#f4f5f6" };

// liO (Occitanie, since 2018): red all over, the big white "liO" with its
// dot across the side, the doors yellow with an orange flush, a dark grey
// skirt (Z 27702 at Bram 2022; B 81500s at Toulouse and Rodez 2025).
const LIO_RED = "#e3262b";
// The big letters, readable on both sides (mirrored back on a turned car).
const bigLio = (c, x) => {
  const g = rect(x, 2.9, 1.3, 7.8, "#ffffff", 0, 'rx="0.65"') + rect(x + 2.05, 2.9, 1.3, 5.4, "#ffffff", 0, 'rx="0.65"') + circle(x + 2.7, 10.0, 0.72, "#f6c400") +
    `<circle cx="${n(x + 9.6)}" cy="6.9" r="3.45" fill="none" stroke="#ffffff" stroke-width="1.3"/>` + circle(x - 1.6, 3.5, 0.6, "#1f2a6b");
  const cx = x + 5.3;
  return c.mirrored ? `<g transform="matrix(-1 0 0 1 ${n(2 * cx)} 0)">${g}</g>` : g;
};
const LIV_LIO = {
  base: LIO_RED, louvre: LIO_RED, frame: "#595e66", door: "#f7c600", doorFrame: null, eye: "#eceef0",
  paint: (c, g) => {
    let s = rect(-1, 0, g.L + 2, 2.55, "#55595f") + (g.cab ? bigLio(c, 17.2) : bigLio(c, 4.0));
    const dx = doorX(g);
    s += path(`M${n(dx + 3.4)} ${AG.door[1] + 0.1}L${n(dx + DOOR_W + 1.6)} ${AG.door[1] + 0.1}L${n(dx + DOOR_W + 1.6)} 6.0Q${n(dx + 4.6)} 8.8 ${n(dx + 3.4)} ${AG.door[1] + 0.1}Z`, "#f39200", 0, 'opacity="0.85"');
    return s;
  },
  nose: () => rect(-1, 0, 8.6, 4.4, "#55595f"),
  over: (c, g) => (g.cab ? sncf(c, 5.6, 7.7, 0.8) + occitanie(c, 5.4, 6.3, 0.8) : ""),
};

// Auvergne-Rhône-Alpes, the scheme of the renovated units (2023 on; most
// B 81500 and X 76500 by 2026): sky blue; a white swash sweeping down from
// the cab's roof behind the cab door; the region's white disc with its
// mountain on the sides, "LA RÉGION VOUS TRANSPORTE" high up; white doors
// with a band of blue confetti at their foot; dark grey skirt (B 81737,
// 81661 and 81663 at Polliat and Bourg-en-Bresse, August 2026).
const AURA_SKY = "#2a9bd8";
const auraMountain = (c, x, y, h) => mk(c, x, y, h, AURA_MARK("#2a9bd8", 0.06));
const LIV_AURA = {
  base: AURA_SKY, louvre: AURA_SKY, frame: "#3c4148", door: "#f4f5f6", doorFrame: null, eye: "#eceef0",
  paint: (c, g) => {
    let s = rect(-1, 0, g.L + 2, 2.4, "#4b5057");
    // The swash: from the roof over the cab door, sweeping down and back
    // behind it, widening to the skirt.
    if (g.cab) s += path("M7.3 13.4L9.7 13.4Q9.6 10.4 10.4 8.0Q11.2 5.4 12.6 2.4L9.2 2.4Q9.0 5.6 8.4 8.0Q7.6 10.6 7.3 13.4Z", "#f2f4f5") +
      circle(31.1, 8.6, 3.9, "#f2f4f5") + auraMountain(c, 31.1, 10.6, 6.0);
    else s += circle(10.0, 4.3, 3.4, "#f2f4f5") + auraMountain(c, 10.0, 4.3, 5.4);
    return s + rect(doorX(g), AG.door[0], DOOR_W, 1.3, "#2a7fc4");
  },
  nose: () => rect(-1, 0, 8.6, 4.55, "#b9bec4") + rect(-1, 4.4, 8.6, 0.18, "#4b5057"),
  over: (c, g) => g.cab
    ? sncf(c, 4.8, 7.3, 0.85) + auraDisc(c, 3.0, 6.4, 0.45, AURA_SKY, "#f2f4f5") + T(c, 3.0, 5.6, 0.4, "La Région", "#ffffff", { weight: 700 }) + T(c, 3.0, 5.2, 0.2, "Auvergne-Rhône-Alpes", "#ffffff", { weight: 400 }) +
      auraDisc(c, 24.6, 4.85, 1.0, AURA_SKY, "#f2f4f5") + T(c, 23.3, 5.15, 1.05, "La Région", "#ffffff", { weight: 700, anchor: "end" }) + T(c, 23.3, 4.2, 0.72, "Auvergne-Rhône-Alpes", "#ffffff", { weight: 400, anchor: "end" }) +
      T(c, 47.5, 10.9, 0.95, "LA RÉGION VOUS TRANSPORTE", "#ffffff", { weight: 700, family: NARROW, stretch: 0.92 }) +
      // The classes by the door: first in the raised section, ahead of it.
      T(c, END_DOOR - 0.55, 7.0, 0.8, "1", "#2a6cc4", { weight: 500 }) + T(c, END_DOOR + DOOR_W + 0.55, 7.0, 0.8, "2", "#2a6cc4", { weight: 500 }) + bikeSign(END_DOOR + 1.3, 8.8, 0.7, "#2a6cc4")
    : T(c, 36.0, 10.9, 0.95, "LA RÉGION VOUS TRANSPORTE", "#ffffff", { weight: 700, family: NARROW, stretch: 0.92 }) + auraDisc(c, 34.0, 4.9, 0.6, AURA_SKY, "#f2f4f5") + auraName(c, 35.0, 5.1, 0.6) +
      rect(MID_DOOR - 0.85, 6.3, 0.6, 1.0, "#3fb37f") + T(c, MID_DOOR - 0.55, 6.8, 0.6, "2", "#ffffff", { weight: 700 }) + rect(MID_DOOR + DOOR_W + 0.25, 6.3, 0.6, 1.0, "#3fb37f") + T(c, MID_DOOR + DOOR_W + 0.55, 6.8, 0.6, "2", "#ffffff", { weight: 700 }),
};

// Grand Est "fluo" on the renovated X 76500 (OPTER, 2023 on; X 76509 and
// 76510 at Verdun, September 2026): the end cars sky blue, a lime outline
// round the raised windows, "fluo / Grand Est" and "Voyagez en grand avec
// la Région"; the middle car light grey over a dark grey skirt, the big
// blue "fluo Grand Est" panel, yellow blocks under the windows, pale blue
// lines, a big white bicycle by the door; blue doors.
const FLUO_SKY = "#1f93db", FLUO_LIME = "#a8cf2f", FLUO_YEL = "#f6c900";
const LIV_FLUO = {
  base: "#d3d6d9", louvre: "#3b4046", frame: "#4a4f56", door: FLUO_SKY, doorFrame: null, eye: "#eceef0",
  paint: (c, g) => {
    const L = g.L;
    if (g.cab) {
      let s = rect(-1, 0, L + 2, 20, FLUO_SKY) + rect(-1, 0, L + 2, 2.4, "#4b5057");
      s += rect(12.3, AG.rwin[0] - 0.55, 23.9, AG.rwin[1] - AG.rwin[0] + 1.1, "none", 0, `rx="0.5" stroke="${FLUO_LIME}" stroke-width="0.35"`);
      return s;
    }
    let s = rect(-1, 0, L + 2, 2.9, "#4b5057");
    s += path(`M1.2 9.1L17.6 9.9L17.4 12.0L1.0 11.4Z`, FLUO_SKY) + rect(5.0, 2.95, 4.2, 1.4, FLUO_YEL) + rect(36.0, 2.95, 9.5, 1.4, FLUO_YEL) + rect(30.6, 8.4, 4.0, 0.25, "#8cc9ef") + rect(14.6, 8.4, 5.0, 0.25, "#8cc9ef");
    return s;
  },
  nose: () => rect(-1, 0, 8.6, 4.55, "#b9bec4") + rect(-1, 4.4, 8.6, 0.18, "#4b5057"),
  over: (c, g) => g.cab
    ? geLogo(c, 6.0, 9.75, 0.75) + sncf(c, 6.0, 8.5, 0.75, { voyageurs: true }) + fluoWord(c, 27.5, 4.9, 1.6) + T(c, 20.5, 4.4, 0.62, "Voyagez en grand avec la Région", "#ffffff", { weight: 600, anchor: "end" })
    : fluoWord(c, 4.6, 10.7, 1.05, FLUO_LIME, "#ffffff") + T(c, 11.0, 10.4, 0.95, "Grand Est", "#ffffff", { weight: 700, spacing: -0.03 }) + bikeSign(MID_DOOR + DOOR_W + 3.6, 5.2, 2.6, "#ffffff") +
      T(c, 16.0, 8.0, 0.5, "Voyagez en grand avec la Région", "#3b4046", { weight: 600, anchor: "end" }),
};
// Provence-Alpes-Côte d'Azur's X 76500 (Nice-Breil-Tende, renovated in
// ZOU!'s blue): the cab dark blue to the skirt, the white band through the
// lamps; the side blue, "RÉGION SUD" and "ZOU!" behind the cab (X 76543 at
// Tende, 2024).
const ZOU_BLUE = "#2160c4";
const LIV_ZOU = national({ cap: "#2a43a8", body: ZOU_BLUE, panel: "#1d2a6e", doors: "#eef0f1", strips: false, voyageurs: true,
  under: (c, g) => (g.cab ? path("M-1 14L12.4 14L12.4 13.2Q11.4 11.6 11.6 9.0L11.8 2.4L-1 2.4Z", "#2a43a8") : ""),
  mark: (c, g) => g.cab ? regionSud(c, 13.4, 4.9, 1.1) + T(c, 21.5, 5.2, 0.62, "VOTRE MOBILITÉ,", "#ffffff", { weight: 600, family: NARROW, italic: true, anchor: "start" }) +
    T(c, 21.5, 4.45, 0.62, "NOTRE PRIORITÉ.", "#ffffff", { weight: 600, family: NARROW, italic: true, anchor: "start" }) + zouWord(c, 26.6, 4.6, 1.6) : zouWord(c, 12.0, 4.6, 1.6) });

// ---------- Tables ----------
const LIVS = { occlight: LIV_OCC_LIGHT, lio: LIV_LIO, aura: LIV_AURA, auranat: LIV_AURA_NAT, nor: LIV_NOR, bzh: LIV_BZH, bfc: LIV_BFC, hdf: LIV_HDF, pdl: LIV_PDL,
  genat: LIV_GE_NAT, fluo: LIV_FLUO, naq: LIV_NAQ, cvl: LIV_CVL, paca: LIV_PACA, zou: LIV_ZOU };
const LIV_NAME = { occlight: "TER Occitanie (liO marks on the national scheme)", lio: "TER Occitanie, liO", aura: "TER Auvergne-Rhône-Alpes (renovated)", auranat: "TER Auvergne-Rhône-Alpes",
  nor: "TER Normandie", bzh: "TER BreizhGo (Bretagne)", bfc: "TER Bourgogne-Franche-Comté", hdf: "TER Hauts-de-France", pdl: "TER Aléop (Pays de la Loire)", genat: "TER Grand Est",
  fluo: "TER fluo Grand Est (renovated)", naq: "TER Nouvelle-Aquitaine", cvl: "TER Rémi (Centre-Val de Loire)", paca: "TER ZOU! (Provence-Alpes-Côte d'Azur)", zou: "TER ZOU! (Provence-Alpes-Côte d'Azur), renovated" };
const VER = { X: "X 76500", B: "B 81500", B2: "B 82500", Z: "Z 27500" };
const VER_FACT = {
  X: { model: "Bombardier AGC (X 76500, XGC)", type: "Diesel multiple unit", powerHp: 1771, topSpeedMph: 99, fleet: "163 units built (2004-2009)" },
  B: { model: "Bombardier AGC (B 81500, BGC)", type: "Bimode (electric and diesel) multiple unit", powerHp: 1771, topSpeedMph: 99, fleet: "about 160 units built" },
  B2: { model: "Bombardier AGC (B 82500, BGC bi-current)", type: "Bimode (electric and diesel) multiple unit", powerHp: 1771, topSpeedMph: 99, fleet: "about 160 units, all of four cars" },
  Z: { model: "Bombardier AGC (Z 27500, ZGC)", type: "Electric multiple unit", powerHp: 1771, topSpeedMph: 99, fleet: "about 180 units built" },
};
const AGC_SRC = "https://fr.wikipedia.org/wiki/Autorail_grande_capacit%C3%A9";
function agcKeys(ver, lv) {
  const base = `terAgc${ver}${lv[0].toUpperCase()}${lv.slice(1)}`, liv = LIVS[lv], nm = `AGC (${VER[ver]})`;
  addCab(`${base}Cab`, `${nm} end car, ${LIV_NAME[lv]}`, (c) => agcEnd(c, { liv, ver }), AG.L);
  // Middle cars with their pantographs: two on a Z 27500's (one on each
  // middle car of a four-car unit), one on a B 81500's, one on each of a B
  // 82500's two middle cars; none on an X 76500.
  const one = [[AG.M - 9.5, -1]], two = [[9.5, 1], [AG.M - 9.5, -1]];
  add(`${base}Mid`, `${nm} middle car, ${LIV_NAME[lv]}`, (c) => agcMid(c, { liv, ver, pans: ver === "X" ? [] : ver === "Z" ? two : one }), AG.M, { pan: ver !== "X" });
  add(`${base}Mid1`, `${nm} middle car, ${LIV_NAME[lv]}`, (c) => agcMid(c, { liv, ver, pans: ver === "X" ? [] : one }), AG.M, { pan: ver !== "X" });
  add(`${base}Mid0`, `${nm} middle car, ${LIV_NAME[lv]}`, (c) => agcMid(c, { liv, ver, pans: [] }), AG.M);
  const F = { ...VER_FACT[ver], builder: "Bombardier Transportation (Crespin)", built: "2004-2010", source: AGC_SRC };
  FACTS[`${base}Cab`] = FACTS[`${base}CabR`] = { ...F, lengthFt: AG.L, about: `The end car of an AGC in ${LIV_NAME[lv]}'s paint, its cab ahead of a raised section over the motor truck; behind the door the floor is low (600 mm).` };
  for (const k of ["Mid", "Mid1", "Mid0"]) FACTS[`${base}${k}`] = { ...F, lengthFt: AG.M, about: `A middle car of an AGC in ${LIV_NAME[lv]}'s paint, low-floored, on Jakobs trucks shared with its neighbours${ver === "X" ? "" : "; the pantographs are on the middle cars"}.` };
  return base;
}
// [set id, version, livery, cars, label]
const AGC_SETS = [
  ["agc3b_occlight", "B", "occlight", 3], ["agc4b_occlight", "B", "occlight", 4], ["agc3e_occlight", "Z", "occlight", 3], ["agc4e_occlight", "Z", "occlight", 4],
  ["agc3e_occ", "Z", "lio", 3], ["agc4e_occ", "Z", "lio", 4], ["agc3b_occ", "B", "lio", 3], ["agc4b_occ", "B", "lio", 4],
  ["agc3b_aura", "B", "aura", 3], ["agc4b_aura", "B", "aura", 4], ["agc3d_aura", "X", "aura", 3], ["agc4e_aura", "Z", "auranat", 4], ["agc3e_aura", "Z", "auranat", 3], ["agc4bb_aura", "B2", "auranat", 4],
  ["agc4e_nor", "Z", "nor", 4], ["agc3e_nor", "Z", "nor", 3], ["agc4bb_nor", "B2", "nor", 4], ["agc3d_nor", "X", "nor", 3],
  ["agc3e_bzh", "Z", "bzh", 3], ["agc4e_bzh", "Z", "bzh", 4], ["agc4bb_bzh", "B2", "bzh", 4],
  ["agc3e_bfc", "Z", "bfc", 3], ["agc3b_bfc", "B", "bfc", 3], ["agc4b_bfc", "B", "bfc", 4], ["agc3d_bfc", "X", "bfc", 3],
  ["agc4bb_hdf", "B2", "hdf", 4], ["agc3d_hdf", "X", "hdf", 3],
  ["agc4e_pdl", "Z", "pdl", 4], ["agc4d_pdl", "X", "pdl", 4],
  ["agc3e_ge", "Z", "genat", 3], ["agc4e_ge", "Z", "genat", 4], ["agc4bb_ge", "B2", "genat", 4], ["agc3d_ge", "X", "fluo", 3], ["agc4d_ge", "X", "fluo", 4],
  ["agc3b_naq", "B", "naq", 3], ["agc4b_naq", "B", "naq", 4], ["agc4bb_naq", "B2", "naq", 4],
  ["agc4e_cvl", "Z", "cvl", 4], ["agc3e_cvl", "Z", "cvl", 3],
  ["agc3b_paca", "B", "paca", 3], ["agc4b_paca", "B", "paca", 4], ["agc3d_paca", "X", "zou", 3],
];
const made = new Set();
for (const [id, ver, lv, cars] of AGC_SETS) {
  const k = `${ver}/${lv}`, base = `terAgc${ver}${lv[0].toUpperCase()}${lv.slice(1)}`;
  if (!made.has(k)) { agcKeys(ver, lv); made.add(k); }
  const label = `AGC (${VER[ver]}), ${cars === 3 ? "three" : "four"} cars, ${LIV_NAME[lv]}`;
  SETS[id] = cars === 3 ? set(label, [`${base}Cab`, 1], [`${base}Mid`, 1], [`${base}CabR`, 1])
    : set(label, [`${base}Cab`, 1], [`${base}${ver === "B" ? "Mid1" : ver === "X" ? "Mid" : "Mid1"}`, 1], [`${base}${ver === "B" ? "Mid0" : ver === "X" ? "Mid" : "Mid1"}`, 1], [`${base}CabR`, 1]);
}

// ===================== X 73500 / X 73900 =====================
// Alstom (LHB Salzgitter) "A TER" X 73500 (1999-2004) and X 73900 (2000,
// fitted for Germany): a single-car diesel railcar, 28.9 m over the
// couplers, a cab at each end; a door a side at each end of the low middle
// section, two big windows over each truck (the floor raised there), four
// lower ones between the doors; the trucks about 6.5 m from each end.
// Measured off a near-broadside photograph of X 73571 at Tassin (August
// 2026), scaled by the car's length and checked against its
// three-quarter view; the car's centre falls on the middle windows'.
const XA = { L: 94.8, roof: 12.6, eave: 11.8, sill: 1.7, skirt: 2.9, ewin: [6.0, 10.0], mwin: [4.0, 8.3], door: [1.75, 9.8], wheel: 30 };
// The nose from its tip (x = 0) up to the roof, as seen side-on.
const NOSE_X735 = [[3.0, 0.65], [0.7, 1.0], [0.15, 2.3], [0, 3.7], ["q", 0.25, 4.3, 0.8, 4.4], [2.5, 5.6], [5.1, 7.9], [8.4, 10.45], ["q", 10.6, 11.9, 13.0, 12.35], ["q", 14.4, XA.roof, 16.4, XA.roof]];
const X_EWIN = [[17.4, 22.6], [23.2, 28.4]], X_MWIN = [[39.6, 43.4], [43.6, 47.4], [47.6, 51.4], [51.6, 55.5]];
const X_DOOR = 34.0, X_DOOR_W = 4.6;
// The whole outline: the nose at each end.
function x735Outline(L) {
  const back = NOSE_X735.slice().reverse().map((p) => (p[0] === "q" ? null : [L - p[0], p[1]])).filter(Boolean);
  const pts = [...NOSE_X735, [L - 16.4, XA.roof], ["q", L - 14.4, XA.roof, L - 13.0, 12.35], ["q", L - 10.6, 11.9, L - 8.4, 10.45], ...back];
  return poly(pts);
}
function xShell(c, d, base, paint) {
  const id = newId(), L = c.L;
  const stop = (off, color, v, fb) => `<stop offset="${off}" stop-color="${color}" stop-opacity="${fb}" style="stop-opacity:var(${v},${fb})"/>`;
  const shade = `<linearGradient id="${id}-s" gradientUnits="userSpaceOnUse" x1="0" y1="0.6" x2="0" y2="${XA.roof}">` +
    stop(0, "#000", "--car-shade-low", 0.16) + '<stop offset="0.36" stop-color="#000" stop-opacity="0"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/>' +
    stop(0.8, "#fff", "--car-shade-high", 0.1) + '<stop offset="0.93" stop-color="#fff" stop-opacity="0"/>' + stop(1, "#000", "--car-shade-roof", 0.08) + "</linearGradient>";
  return `<path d="${d}" fill="${base}"/><clipPath id="${id}"><path d="${d}"/></clipPath><defs>${shade}</defs>` +
    `<g clip-path="url(#${id})">${paint}<rect x="-5" y="0" width="${n(L + 10)}" height="20" fill="url(#${id}-s)"/></g>` + `<path d="${d}" fill="none" stroke="currentColor" stroke-width="0.8" ${STROKE}/>`;
}
// One end's paint and fittings, drawn for the left end; right(): the same
// turned to the right end (geometry mirrored, lettering still readable).
const atRight = (c, draw) => `<g transform="matrix(-1 0 0 1 ${n(c.L)} 0)">${draw({ ...c, mirrored: !c.mirrored })}</g>`;
// The lower nose (grey, its grilles), the windscreen edge-on, the lamps.
function x735Nose(c, low = "#5a6068", top = 4.4) {
  let s = path(`M-1 -1L17.0 -1L16.4 ${XA.skirt}Q9.0 3.3 3.5 ${top}Q1.4 ${top + 0.1} -1 ${top + 0.3}Z`, low);
  s += [[7.8, 10.9], [11.2, 14.4]].map(([a, b]) => rect(a, 0.85, b - a, 1.55, "rgba(0,0,0,0.25)", 0, 'rx="0.15"') + lines(seq(1.05, 0.28, 5).map((y) => [a + 0.2, y, b - 0.2, y]), "rgba(255,255,255,0.2)", 0.5)).join("");
  s += path("M0.8 4.45L2.5 5.65L5.1 7.95L8.4 10.5L9.6 11.35L9.2 10.3L5.6 7.4L3.0 5.2L1.6 4.4Z", "#14171a");
  s += path("M0.55 4.1Q1.6 4.25 2.6 4.95L1.9 4.95Q1.0 4.6 0.45 4.45Z", "#f2f0e4", 0, 'stroke="#555" stroke-width="0.4" vector-effect="non-scaling-stroke"');
  return s;
}
// The cab's side window and the mirror housing over it.
const x735CabSide = () => pane(11.0, 8.6, 1.8, 1.7, 0.15, "#14171a") + path("M13.4 10.6L15.3 10.6Q15.6 11.1 15.3 11.6L13.9 11.6Q13.3 11.2 13.4 10.6Z", "#d5d9dd", 0, 'stroke="rgba(0,0,0,0.4)" stroke-width="0.5" vector-effect="non-scaling-stroke"');
// A window group: dark frame round its panes.
const xWins = (list, [lo, hi], frame = "#33383e") => list.map(([a, b]) => rect(a - 0.15, lo - 0.2, b - a + 0.3, hi - lo + 0.4, frame, 0, 'rx="0.25"') + pane(a + 0.05, lo, b - a - 0.1, hi - lo, 0.2, "#16191c")).join("");
// A plug door (single leaf, one tall window).
const xDoor = (x, fill, frame = null) => (frame ? rect(x, XA.door[0], X_DOOR_W, XA.door[1] - XA.door[0], frame) : "") +
  rect(x + 0.45, XA.door[0] + 0.1, X_DOOR_W - 0.9, XA.door[1] - XA.door[0] - 0.5, fill, 0, `stroke="rgba(0,0,0,0.45)" stroke-width="0.5" ${STROKE}`) + pane(x + 0.9, 3.7, X_DOOR_W - 1.8, 4.4, 0.2, "#16191c");
// The car: paint(c) under everything, end(c) at each end, mid(c) the
// middle section's own; doors: [left door's fill, frame], [right's].
function x735(c, liv) {
  const L = c.L, d = x735Outline(L);
  let paint = rect(-1, XA.eave, L + 2, 3, liv.roof) + rect(30.0, XA.eave - 0.7, L - 60, 0.7, liv.louvre || "#7d848c") + lines(seq(30.4, 0.5, Math.floor((L - 61) / 0.5)).map((x) => [x, XA.eave - 0.62, x, XA.eave - 0.08]), "rgba(0,0,0,0.3)", 0.4);
  paint += liv.side ? liv.side(c) : "";
  paint += xWins(X_EWIN, XA.ewin) + xWins(X_EWIN.map(([a, b]) => [L - b, L - a]), XA.ewin) + xWins(X_MWIN, XA.mwin);
  paint += xDoor(X_DOOR, ...(liv.doorA || ["#b9bec3"])) + xDoor(L - X_DOOR - X_DOOR_W, ...(liv.doorB || liv.doorA || ["#b9bec3"]));
  paint += rect(-1, 0, L + 2, XA.skirt, "#55595f") + rect(-1, XA.skirt - 0.1, L + 2, 0.12, "rgba(0,0,0,0.3)");
  const end = (cc) => liv.cab(cc) + x735Nose(cc, liv.low) + x735CabSide() + rect(9.0, 3.5, 1.6, 1.5, "#2a2e33") + slats(9.05, 3.55, 1.5, 1.4, 0.22, "rgba(255,255,255,0.2)");
  paint += end(c) + atRight(c, end);
  paint += liv.over ? liv.over(c) : "";
  const under = truck(21.4, { wb: 7.2, d: XA.wheel, top: XA.sill + 0.2 }) + truck(L - 21.4, { wb: 7.2, d: XA.wheel, top: XA.sill + 0.2 }) + cases(26.5, L - 26.5, XA.sill, 4, 0.9) +
    (c.coupledL ? coupledCouplers(2.5) : autoCoupler(0.3, 2.5)) + (c.coupledR ? "" : `<g transform="matrix(-1 0 0 1 ${n(L)} 0)">${autoCoupler(0.3, 2.5)}</g>`);
  const top = fairing(19.0, 9.0, XA.roof, 0.5, "#a7adb4", 3) + fairing(L - 28.0, 9.0, XA.roof, 0.5, "#a7adb4", 3) + rect(L / 2 - 2.0, XA.roof - 0.05, 4.0, 0.55, "#7d848c", 0.4, 'rx="0.15"') +
    rect(L / 2 + 0.8, XA.roof + 0.5, 0.6, 0.45, "#3a3e44", 0.3);
  return under + xShell(c, d, liv.base, paint) + top;
}
// --- X 73500 schemes ---
// TER's national scheme (most X 73500 in 2026): silver; the cab dark blue
// above the lamps back to the cab module's seam, the roof blue; the
// windows in dark frames; silver doors (X 73725 at Toulouse, liO marks;
// the Nouvelle-Aquitaine cars at Agen and Limoges, 2023-2025).
const xNational = (o = {}) => ({
  base: "#c3c8cd", roof: o.roof || "#2f4fa6", low: "#5a6068", doorA: o.doorA,
  cab: (c) => path(`M-1 20L16.4 20L16.4 7.4Q9.0 6.6 3.0 5.2Q1.0 4.8 -1 4.7Z`, o.cap || "#2f4fa6") + line(16.4, XA.skirt, 16.4, XA.roof, "rgba(0,0,0,0.3)", 0.5) +
    (o.cabMark ? o.cabMark(c) : sncf(c, 5.0, 6.6, 0.7)),
  side: o.side, over: o.over,
});
const terMark = (c, x, y, h, fill = "#2f4fa6") => terWord(c, x, y, h, fill);
const X_NAT = xNational({ over: (c) => terMark(c, 25.0, 4.6, 1.5) + atRight(c, (cc) => terMark(cc, 25.0, 4.6, 1.5)) });
// Occitanie: the national scheme with liO and the region's mark.
const X_OCC = xNational({ over: (c) => [c, null].map((_, i) => (i ? atRight(c, (cc) => lio(cc, 21.5, 4.7, 1.2, "#34383d") + occitanie(cc, 25.0, 4.75, 0.9)) : lio(c, 21.5, 4.7, 1.2, "#34383d") + occitanie(c, 25.0, 4.75, 0.9))).join("") });
// Nouvelle-Aquitaine: red doors with the region's lion shield, "Nouvelle-
// Aquitaine" by the doors (cars at Agen and Limoges, 2023-2025).
const X_NAQ = xNational({ doorA: ["#d7232f"],
  over: (c) => naName(c, 19.0, 4.6, 0.75) + atRight(c, (cc) => naName(cc, 19.0, 4.6, 0.75)) + mk(c, X_DOOR + X_DOOR_W / 2, 7.0, 1.6, '<path d="M-0.3 -0.3Q0 0 -0.3 0.3M-0.1 -0.3Q0.2 0 -0.1 0.3M0.1 -0.3Q0.4 0 0.1 0.3" fill="none" stroke="#ffffff" stroke-width="0.09"/>') });
// Auvergne-Rhône-Alpes, renovated (most of its 86 cars by 2026? see the
// report; X 73571 at Tassin, August 2026): silver; the roof blue; each cab
// sky blue with a white swash behind it; the region's sky-blue wave below
// and over the middle windows by the plain door, the wheelchair door
// framed in sky blue with confetti at its foot; "LA RÉGION VOUS
// TRANSPORTE" over the end windows, "La Région / Auvergne-Rhône-Alpes" big
// under them, the small mark by each door.
const SKY = "#2a8fd6";
const X_AURA = {
  base: "#c9ced1", roof: "#3f63b8", low: "#5a6068", louvre: "#7f8ea8", doorA: ["#b9bec3", SKY], doorB: ["#2a2f35"],
  cab: (c) => path(`M-1 20L16.4 20L16.4 ${XA.skirt}L-1 ${XA.skirt}Z`, SKY) +
    path(`M12.4 12.6Q14.2 8.8 15.5 ${XA.skirt}L16.4 ${XA.skirt}L16.4 12.6Z`, "#eef0f1") +
    sncf(c, 7.9, 7.0, 0.75) + auraDisc(c, 11.1, 7.1, 0.5, SKY, "#eef0f1") + T(c, 11.1, 6.15, 0.45, "La Région", "#ffffff", { weight: 700 }) + T(c, 11.1, 5.65, 0.2, "Auvergne-Rhône-Alpes", "#ffffff", { weight: 400 }) +
    auraDisc(c, 5.0, 8.2, 0.32, SKY, "#eef0f1") + T(c, 4.2, 5.25, 0.5, "571", "#ffffff", { weight: 700 }),
  side: (c) => {
    const L = c.L;
    // The wave: below the middle windows by the plain door, rising over
    // them and tapering toward the wheelchair door.
    let s = rect(51.5, 3.2, L - X_DOOR - X_DOOR_W - 51.5, 0.8, SKY) + path(`M45.0 ${XA.mwin[1] + 0.25}L52.3 ${XA.mwin[1] + 0.25}L${n(L - X_DOOR - X_DOOR_W)} ${XA.mwin[1] + 0.25}L${n(L - X_DOOR - X_DOOR_W)} 10.0L52.3 10.0Z`, SKY) +
      path(`M50.6 3.2L52.4 3.2L53.4 ${XA.mwin[1] + 0.3}L51.6 ${XA.mwin[1] + 0.3}Z`, SKY);
    // Confetti at the wheelchair door's foot.
    s += rect(X_DOOR + 0.45, XA.door[0] + 0.1, X_DOOR_W - 0.9, 1.9, "#eef0f1") + seq(X_DOOR + 0.7, 0.42, 9).map((x, i) => line(x, 2.2 + (i % 3) * 0.4, x + 0.25, 2.5 + (i % 3) * 0.4, SKY, 0.8)).join("");
    return s;
  },
  over: (c) => {
    const L = c.L, near = (cc, ink) => T(cc, 22.9, 11.0, 0.75, "LA RÉGION VOUS TRANSPORTE", ink, { weight: 700, family: NARROW, italic: true, stretch: 0.9 }) +
      auraDisc(cc, 20.4, 4.7, 0.85, "#ffffff", ink) + T(cc, 21.6, 5.15, 1.0, "La Région", ink, { weight: 700, anchor: "start" }) + T(cc, 21.6, 4.15, 0.7, "Auvergne-Rhône-Alpes", ink, { weight: 400, anchor: "start" }) +
      auraDisc(cc, 31.7, 7.1, 0.4, "#ffffff", "#2a3a5a") + T(cc, 31.7, 6.25, 0.42, "La Région", "#2a3a5a", { weight: 700 }) + rect(30.2, 8.6, 3.0, 0.3, "#24282d") + rect(30.2, 4.2, 3.0, 1.0, "#5d636a") + slats(30.25, 4.25, 2.9, 0.9, 0.22, "rgba(0,0,0,0.4)");
    return near(c, SKY) + atRight(c, (cc) => near(cc, "#2a5aa8")) + markAt(c, X_DOOR + X_DOOR_W / 2, 9.15, 0.45, '<rect x="-0.5" y="-0.5" width="1" height="1" rx="0.15" fill="#2a3a5a"/><circle cx="0.05" cy="-0.22" r="0.1" fill="#fff"/><path d="M0 -0.05L0 0.15L0.2 0.15M-0.2 0.05Q-0.25 0.35 0.05 0.35" fill="none" stroke="#fff" stroke-width="0.08"/>');
  },
};
// X 73900 (TER Alsace, Strasbourg-Offenburg and Mulhouse-Müllheim): the
// Alsace scheme of 2006: silver-grey, the cab cap blue to the roof, broad
// slanting stripes in lime, yellow, ochre, brown, pink and pale green over
// the lower side, "ter ALSACE" and SNCF by the cab (X 73908 at Offenburg,
// 2024).
const ALSACE_STRIPES = ["#a8cf3a", "#a8b1b8", "#f2d32a", "#c9a24a", "#8b5a2b", "#c9cf8f", "#e2338a", "#b5d98a"];
// The stripes over the A end, from the cab to the door: below the dark
// window band a pale aqua field, then the map's colours (yellow, ochre,
// pink, magenta, green, grey) slanting back, a long pink stripe crossing
// the band by the door; over the band more of the same; thin green and
// yellow ones at the B end; "ALSACE S'Elsass" over the middle windows
// (X 73908 at Strasbourg, 2025).
const X_ALS = xNational({ cap: "#3a4fb5", roof: "#3a4fb5", doorA: ["#b9bec3", "#3a4fb5"],
  cabMark: (c) => sncf(c, 5.0, 6.6, 0.75),
  side: (c) => {
    const L = c.L, band = (a, b) => rect(a, XA.ewin[0] - 0.5, b - a, XA.ewin[1] - XA.ewin[0] + 1.0, "#55595f");
    let s = band(16.4, 29.2) + band(L - 29.2, L - 16.4) + rect(X_DOOR + X_DOOR_W, XA.mwin[0] - 0.5, L - 2 * (X_DOOR + X_DOOR_W), XA.eave - 0.7 - XA.mwin[0] + 0.5, "#55595f");
    s += path(`M16.4 ${XA.skirt}L22.0 ${XA.skirt}L22.6 ${XA.ewin[0] - 0.5}L16.4 ${XA.ewin[0] - 0.5}Z`, "#9ad6c8");
    const cols = ["#f2c230", "#d99a3a", "#e2338a", "#c9a24a", "#d6327f", "#a8cf3a", "#a8b1b8", "#7cc576", "#c9cf8f"];
    cols.forEach((f, i) => { const x = 22.0 + i * 1.4; s += path(`M${n(x)} ${XA.skirt}L${n(x + 1.4)} ${XA.skirt}L${n(x + 1.9)} ${XA.ewin[0] - 0.5}L${n(x + 0.5)} ${XA.ewin[0] - 0.5}Z`, f) +
      path(`M${n(x - 0.6)} ${XA.ewin[1] + 0.5}L${n(x + 0.8)} ${XA.ewin[1] + 0.5}L${n(x + 1.1)} ${XA.eave}L${n(x - 0.3)} ${XA.eave}Z`, cols[(i + 3) % cols.length]); });
    s += path(`M31.6 ${XA.skirt}L32.6 ${XA.skirt}L34.0 ${XA.eave}L33.0 ${XA.eave}Z`, "#e2338a");
    s += [["#a8cf3a", L - 22.0], ["#f2c230", L - 20.6], ["#7cc576", L - 26.5]].map(([f, x]) => path(`M${n(x)} ${XA.skirt}L${n(x + 0.6)} ${XA.skirt}L${n(x + 0.9)} ${XA.ewin[0] - 0.5}L${n(x + 0.3)} ${XA.ewin[0] - 0.5}Z`, f)).join("");
    return s;
  },
  over: (c) => terWord(c, 19.0, 5.3, 0.9, "#ffffff") + T(c, 20.0, 5.0, 0.32, "ALSACE", "#ffffff", { weight: 700, anchor: "start" }) + sncf(c, 16.9, 5.3, 0.6) +
    T(c, 47.4, 9.25, 1.15, "ALSACE <tspan fill=\"#e8d36a\" font-weight=\"500\">S'Elsass</tspan>", "#ffffff", { weight: 700 }) +
    atRight(c, (cc) => terWord(cc, 19.0, 5.3, 0.9, "#ffffff") + T(cc, 20.0, 5.0, 0.32, "ALSACE", "#ffffff", { weight: 700, anchor: "start" })) });
for (const [lv, liv, nm] of [["Nat", X_NAT, "TER (national scheme)"], ["Occ", X_OCC, "TER Occitanie (liO marks)"], ["Naq", X_NAQ, "TER Nouvelle-Aquitaine"], ["Aura", X_AURA, "TER Auvergne-Rhône-Alpes (renovated)"]]) {
  add(`terX735${lv}`, `X 73500 diesel railcar, ${nm}`, (c) => x735(c, liv), XA.L);
  FACTS[`terX735${lv}`] = { model: "Alstom X 73500 (A TER)", type: "Diesel railcar", builder: "Alstom (LHB Salzgitter)", built: "1999-2004", fleet: "331 cars", topSpeedMph: 87, powerHp: 845, lengthFt: XA.L,
    source: "https://fr.wikipedia.org/wiki/X_73500", about: `A single-car diesel railcar with a cab at each end, the most common railcar on France's rural lines; in ${nm} paint. Two or three often run coupled.` };
}
add("terX739Als", "X 73900 diesel railcar, TER Alsace (Grand Est)", (c) => x735(c, X_ALS), XA.L);
FACTS.terX739Als = { model: "Alstom X 73900 (A TER)", type: "Diesel railcar", builder: "Alstom (LHB Salzgitter)", built: "2000-2003", fleet: "19 cars", topSpeedMph: 87, powerHp: 845, lengthFt: XA.L,
  source: "https://fr.wikipedia.org/wiki/X_73500", about: "The X 73500's version fitted with German train protection and signalling, for Strasbourg-Offenburg, Mulhouse-Müllheim and Metz-Trier; most still in TER Alsace's striped paint." };
SETS.x735_nat = set("X 73500 diesel railcar, TER (national scheme); often two or three coupled", ["terX735Nat", 1]);
for (const r of ["nor", "bzh", "cvl", "pdl", "bfc", "ge", "hdf", "paca"]) SETS[`x735_${r}`] = SETS.x735_nat;
SETS.x735_occ = set("X 73500 diesel railcar, TER Occitanie (liO marks); often two coupled", ["terX735Occ", 1]);
SETS.x735_naq = set("X 73500 diesel railcar, TER Nouvelle-Aquitaine; often two coupled", ["terX735Naq", 1]);
SETS.x735_aura = set("X 73500 diesel railcar, TER Auvergne-Rhône-Alpes; often two coupled", ["terX735Aura", 1]);
SETS.x739_ge = set("X 73900 diesel railcar, TER Alsace paint (Grand Est); often two coupled", ["terX739Als", 1]);
SETS.x735_2_nat = set("Two X 73500 diesel railcars coupled, TER (national scheme)", ["terX735Nat", 2]);

// ===================== X 72500 (X-TER) and Z 21500 / Z 21700 (Z-TER) =====================
// Alstom's X-TER (X 72500, 1997-2002, diesel, two or three cars) and its
// electric sister the Z-TER (Z 21500, 2003-2006, three cars, 200 km/h): the
// same bodies, the end cars 26.45 m with a long raked nose, the trailer
// 25.6 m; 4.22 m tall, 2.9 m wide; one narrow (90 cm) door a side in each
// car, the floor high, two trucks a car (fr.wikipedia "X 72500", "Z 21500").
// Measured off a broadside of a three-car X 72500 (ex-SNCF, at Comarnic,
// July 2024; still in the national scheme) by each car's own length.
const XT = { L: 86.8, Lt: 84.0, roof: 13.0, eave: 12.4, sill: 1.9, skirt: 3.8, win: [6.8, 10.7], door: [2.0, 11.0], wheel: 33 };
const NOSE_XT = [[3.6, 1.6], [0.9, 1.75], [0.3, 2.2], ["q", 0.05, 2.7, 0.6, 3.4], [2.2, 4.4], [4.9, 6.9], [8.8, 10.0], [12.8, 12.35], ["q", 14.0, XT.roof, 16.5, XT.roof]];
const XT_END_WIN = [[16.6, 22.0], [22.6, 28.0], [28.6, 34.0], [48.4, 52.4], ...seq(56.2, 4.8, 6).map((x) => [x, x + 4.2])];
const XT_END_DOOR = 43.1, XT_DOOR_W = 3.1;
const XT_MID_WIN = [...seq(1.6, 4.8, 7).map((x) => [x, x + 4.2]), ...seq(50.4, 4.8, 7).map((x) => [x, x + 4.2])];
const XT_MID_DOOR = 41.0;
// A narrow folding door: two leaves, a window in each.
const xtDoor = (x, fill) => leaves(x, XT_DOOR_W, XT.door[0], XT.door[1], fill, { glass: [0.42, 0.88], gw: 0.55 });
const xtWins = (list) => list.map(([a, b]) => pane(a, XT.win[0], b - a, XT.win[1] - XT.win[0], 0.35, "#1c1f23")).join("");
// The end car (cab on the left). o: liv, diesel (X 72500: the engine's
// roof hood; else the Z-TER's roof), first (its first-class end: by the cab).
function xtEnd(c, o) {
  const L = c.L, liv = o.liv;
  const paint = () => {
    let s = rect(-1, XT.eave, L + 2, 3, liv.roof) + rect(-1, 0, L + 2, XT.skirt, "#8f959c") + line(-1, XT.skirt, L + 1, XT.skirt, "rgba(0,0,0,0.3)", 0.5);
    s += liv.paint ? liv.paint(c, { L, cab: true }) : "";
    s += xtWins(XT_END_WIN) + xtDoor(XT_END_DOOR, liv.door) + rect(52.7, 7.0, 3.0, 3.6, "#9aa0a6") + slats(52.75, 7.05, 2.9, 3.5, 0.25, "rgba(0,0,0,0.35)") + rect(37.0, 8.9, 3.2, 0.25, "#2a2e33");
    // The cab: its side door, the windscreen edge-on, the lamps.
    s += rect(10.4, 3.8, 2.2, 7.5, "none", 0, `rx="0.2" stroke="rgba(0,0,0,0.45)" stroke-width="0.6" ${STROKE}`) + pane(10.65, 8.0, 1.7, 2.6, 0.15, "#14171a");
    s += path("M2.4 4.75L4.9 7.15L8.8 10.25L12.6 12.55L14.2 12.95L13.0 12.2L9.3 9.7L5.4 6.7L3.1 4.6Z", "#14171a");
    s += path("M0.5 3.15Q1.4 3.25 2.3 3.9L1.6 4.0Q0.9 3.7 0.4 3.5Z", "#f2f0e4", 0, 'stroke="#555" stroke-width="0.4" vector-effect="non-scaling-stroke"');
    return s + (liv.over ? liv.over(c, { L, cab: true }) : "");
  };
  return body(c, { sill: XT.sill, roof: XT.roof, nose: NOSE_XT, x1: L - 0.35, base: liv.base, ends: [XT.sill + 1.2, XT.roof - 1.4], paint,
    under: () => truck(18.7, { wb: 8.86, d: XT.wheel, top: XT.sill + 0.2 }) + truck(L - 5.8, { wb: 8.86, d: XT.wheel, top: XT.sill + 0.2 }) + cases(25, L - 13, XT.sill + 0.1, 3, 1.1) +
      (c.coupledL ? coupledCouplers(2.6) : autoCoupler(0.6, 2.6)),
    top: () => o.diesel ? rect(35.0, XT.roof - 0.05, 24.0, 0.8, "#a3a9b0", 0.4, 'rx="0.25"') + slats(35.5, XT.roof + 0.1, 23.0, 0.55, 0.45, "rgba(0,0,0,0.3)") + rect(46.0, XT.roof + 0.75, 1.0, 0.4, "#3a3e44", 0.3)
      : fairing(36.0, 18.0, XT.roof, 0.5, "#a3a9b0", 4),
  });
}
// The trailer (Z-TER: the pantographs on its roof).
function xtMid(c, o) {
  const L = c.L, liv = o.liv;
  const paint = () => {
    let s = rect(-1, XT.eave, L + 2, 3, liv.roof) + rect(-1, 0, L + 2, XT.skirt, "#8f959c") + line(-1, XT.skirt, L + 1, XT.skirt, "rgba(0,0,0,0.3)", 0.5);
    s += liv.paint ? liv.paint(c, { L, cab: false }) : "";
    s += xtWins(XT_MID_WIN.filter(([a, b]) => b < XT_MID_DOOR - 3.6 || a > XT_MID_DOOR + XT_DOOR_W + 0.3)) + xtDoor(XT_MID_DOOR, liv.door) + rect(36.6, 7.0, 3.0, 3.6, "#9aa0a6") + slats(36.65, 7.05, 2.9, 3.5, 0.25, "rgba(0,0,0,0.35)");
    return s + (liv.over ? liv.over(c, { L, cab: false }) : "");
  };
  return body(c, { sill: XT.sill, roof: XT.roof, x0: 0.35, x1: L - 0.35, base: liv.base, ends: [XT.sill + 1.2, XT.roof - 1.4], paint,
    under: () => truck(11.0, { wb: 8.86, d: XT.wheel, top: XT.sill + 0.2 }) + truck(L - 11.0, { wb: 8.86, d: XT.wheel, top: XT.sill + 0.2 }) + cases(17, L - 17, XT.sill + 0.1, 3, 1.0),
    top: () => o.diesel ? fairing(30.0, 24.0, XT.roof, 0.5, "#a3a9b0", 4)
      : fairing(4.0, 12.0, XT.roof, 0.5, "#a3a9b0", 3) + rect(30.0, XT.roof - 0.05, 24.0, 0.55, "#7d848c", 0.4, 'rx="0.15"') + panGear(24.5, XT.roof, { dir: 1 }) + panGear(L - 24.5, XT.roof, { dir: -1 }),
  });
}
// --- Schemes ---
// The national scheme (X 72500 in Centre-Val de Loire, Nouvelle-Aquitaine,
// PACA; Z 21500 of Pays de la Loire): silver; the nose blue ahead of a line
// slanting from the roof 5.6 m back down to the bumper, the roof's edge
// blue along every car (X 72529 at Paris-Austerlitz 2024, X 72526 at
// Marseille 2025, Z 21518 at Meung-sur-Loire 2024).
const xtNational = (o = {}) => ({
  base: "#c3c8cd", roof: o.blue || "#2f4fa6", door: o.door || "#b9bec3",
  paint: (c, g) => (g.cab ? path(`M-1 20L18.4 20L18.4 ${XT.eave}Q12.0 7.0 3.8 1.6L-1 1.6Z`, o.blue || "#2f4fa6") : "") + (o.paint ? o.paint(c, g) : ""),
  over: (c, g) => (g.cab ? sncf(c, 14.0, 7.6, 0.75) : "") + (o.over ? o.over(c, g) : ""),
});
const XT_NAT = xtNational({ over: (c, g) => (g.cab ? terWord(c, 26.0, 4.9, 1.6, "#2f4fa6") : "") });
// Centre-Val de Loire: Rémi's mark beside the door (X 72529, 2024).
const XT_CVL = xtNational({ over: (c, g) => remi(c, g.cab ? 38.6 : 30.0, 5.3, 1.1) });
// Bretagne, renovated 2022-2024 (BreizhGo): silver all over, black and
// white stripes up the nose's corner by the windscreen (the Breton flag's),
// "BREIZHGO" in a black panel behind the cab, SNCF Voyageurs (Z 21599 at
// Nantes, July 2026).
const XT_BZH = {
  base: "#c3c8cd", roof: "#aeb4ba", door: "#b9bec3",
  paint: (c, g) => g.cab ? seq(5.4, 0.95, 7).map((y, i) => path(`M${n(y * 0.95 + 1.6)} ${n(y)}L${n(y * 0.95 + 5.2)} ${n(y)}L${n(y * 0.95 + 5.6)} ${n(y + 0.5)}L${n(y * 0.95 + 2.0)} ${n(y + 0.5)}Z`, i % 2 ? "#f2f3f4" : "#1b1c1f")).join("") : "",
  over: (c, g) => g.cab ? sncf(c, 14.0, 7.6, 0.75, { voyageurs: true }) + breizhgo(c, 20.5, 5.1, 1.4) : "",
};
// Centre-Val de Loire's renovated Z 21500 (2023-2025): silver all over, the
// region's big graphic of blue, yellow and green strokes behind the cab,
// "Région Centre-Val de Loire", a blue door with the bicycle sign (Z 21522
// at Tours, 2025).
const XT_CVLR = {
  base: "#c3c8cd", roof: "#aeb4ba", door: "#2d5fb4",
  paint: (c, g) => g.cab ? path("M22.0 12.2Q17.0 11.6 17.8 8.6Q18.6 6.0 22.5 7.0L23.6 10.2Z", "#2d5fb4") + path("M24.0 12.3Q28.6 12.5 28.6 9.6Q28.4 7.4 25.6 7.8Z", "#f2c230") +
    path("M20.0 6.6L26.4 6.6L23.4 2.6Z", "#4aa84a") + path("M27.6 6.2Q31.4 6.6 33.0 4.0L30.6 2.8Q29.0 4.8 27.0 5.0Z", "#5bb8e6") : "",
  over: (c, g) => g.cab ? sncf(c, 14.0, 6.8, 0.8) + T(c, 35.5, 5.5, 0.55, "Région", "#3b4047", { weight: 500, anchor: "end" }) + T(c, 35.5, 4.6, 0.9, "Centre-Val de Loire", "#3b4047", { weight: 600, anchor: "end", stretch: 0.9 }) +
    bikeSign(XT_END_DOOR - 1.3, 9.0, 0.8, "#2d5fb4") : "",
};
const XT_LIVS = { Nat: [XT_NAT, "TER (national scheme)"], Cvl: [XT_CVL, "TER Rémi (Centre-Val de Loire)"], Bzh: [XT_BZH, "TER BreizhGo (Bretagne), renovated"], Cvlr: [XT_CVLR, "TER Rémi (Centre-Val de Loire), renovated"] };
for (const [lv, [liv, nm]] of Object.entries(XT_LIVS)) {
  for (const [ser, diesel] of [["X725", true], ["Z215", false]]) {
    if (ser === "X725" && (lv === "Bzh" || lv === "Cvlr")) continue;
    const label = ser === "X725" ? "X 72500 (X-TER)" : "Z 21500 (Z-TER)";
    addCab(`ter${ser}${lv}Cab`, `${label} end car, ${nm}`, (c) => xtEnd(c, { liv, diesel }), XT.L, { amenities: ["first"] });
    add(`ter${ser}${lv}Mid`, `${label} trailer, ${nm}`, (c) => xtMid(c, { liv, diesel }), XT.Lt, diesel ? {} : { pan: true });
    const F = diesel ? { model: "Alstom X 72500 (X-TER)", type: "Diesel multiple unit", builder: "Alstom", built: "1997-2002", fleet: "117 units built; about 65 left in 2025, being withdrawn", topSpeedMph: 99, powerHp: 1610, source: "https://fr.wikipedia.org/wiki/X_72500" }
      : { model: "Alstom Z 21500 (Z-TER)", type: "Electric multiple unit", builder: "Alstom", built: "2003-2006", fleet: "57 units (8 renumbered Z 21700)", topSpeedMph: 124, source: "https://fr.wikipedia.org/wiki/Z_21500" };
    FACTS[`ter${ser}${lv}Cab`] = FACTS[`ter${ser}${lv}CabR`] = { ...F, lengthFt: XT.L, about: `The end car with its long raked nose, first class behind the cab; ${nm}.` };
    FACTS[`ter${ser}${lv}Mid`] = { ...F, lengthFt: XT.Lt, about: diesel ? `The middle trailer of a three-car X 72500; ${nm}.` : `The trailer, with the transformer and both pantographs; ${nm}.` };
  }
}
const xt = (ser, lv, cars, label) => set(label, [`ter${ser}${lv}Cab`, 1], ...(cars === 3 ? [[`ter${ser}${lv}Mid`, 1]] : []), [`ter${ser}${lv}CabR`, 1]);
SETS.x725_2_nat = xt("X725", "Nat", 2, "X 72500 (X-TER), two cars, TER national scheme (some trains three cars or two units)");
SETS.x725_3_nat = xt("X725", "Nat", 3, "X 72500 (X-TER), three cars, TER national scheme");
SETS.x725_2_cvl = xt("X725", "Cvl", 2, "X 72500 (X-TER), two cars, TER Rémi (Centre-Val de Loire)");
SETS.x725_3_cvl = xt("X725", "Cvl", 3, "X 72500 (X-TER), three cars, TER Rémi (Centre-Val de Loire)");
for (const r of ["naq", "paca", "pdl"]) { SETS[`x725_2_${r}`] = SETS.x725_2_nat; SETS[`x725_3_${r}`] = SETS.x725_3_nat; }
SETS.z215_bzh = xt("Z215", "Bzh", 3, "Z 21500 (Z-TER), three cars, BreizhGo (Bretagne), renovated");
SETS.z215_cvl = xt("Z215", "Cvlr", 3, "Z 21500 (Z-TER), three cars, Rémi (Centre-Val de Loire), renovated");
SETS.z215_pdl = xt("Z215", "Nat", 3, "Z 21500 / Z 21700 (Z-TER), three cars, TER Pays de la Loire (national scheme)");

// Development: the marks on their own, for checking against photographs.
const MARKS_DEV = {
  ter: (c) => terWord(c, 0, 0, 1, "#2f4fa6"), terBourgogne: (c) => terWord(c, 0, 0, 1, "#2f4fa6", { accent: "#e2334a" }) + T(c, 1.4, -0.2, 0.35, "Bourgogne", "#2f4fa6", { weight: 500, anchor: "start" }),
  lio: (c) => lio(c, 0, 0, 1, "#34383d"), occitanie: (c) => occitanie(c, 0, 0, 1), aura: (c) => rect(-0.8, -0.8, 1.6, 1.6, "#2a9bd8") + auraDisc(c, 0, 0, 0.6, "#2a9bd8", "#eef0f1"),
  na: (c) => naName(c, 0, 0, 0.5), hdfPanel: (c) => hdfPanel(c, 0, 0, 1), hdfCard: (c) => hdfCard(c, 0, 0, 1.6), ge: (c) => geLogo(c, 0, 0, 1), fluo: (c) => rect(-0.5, -1.2, 3.2, 2.2, "#1f93db") + fluoWord(c, 1.0, 0, 1),
  remi: (c) => remi(c, 0, 0, 1), normandie: (c) => normandie(c, 0, 0, 2), sud: (c) => rect(-0.3, -1.2, 5.0, 2.2, "#2160c4") + regionSud(c, 0, 0, 1), zou: (c) => rect(-0.3, -0.8, 3.0, 1.6, "#2160c4") + zouWord(c, 0, 0, 1),
  breizhgo: (c) => breizhgo(c, 0, 0, 1),
};

return { TYPES, MODELS, SETS, FACTS, FLEET: typeof FLEET === "undefined" ? [] : FLEET };
})();

// =====================================================================
// LOCO
// =====================================================================
const PART_LOCO = (() => {

// TER's locomotive-hauled trains still running in 2026 (part of
// ter.cars.js): Grand Est's TER 200 (BB 26000 + Corail + the pilot car) and
// its RRR sets behind a BB 22200; Auvergne-Rhône-Alpes's Corail push-pull
// sets ("RCR") behind BB 22200s and, in the Maurienne, BB 7200s; Centre-Val
// de Loire's Rémi Corail trains behind BB 7200s out of Paris-Austerlitz.
// Trainsheet's own side views, at the shared scale, from published
// dimensions and from photographs (Wikimedia Commons, 2023-2026) measured
// off grids and rectified side views; lettered here, no logo files.
// Not drawn (ended): PACA's Corail (Marseille-Nice, to Transdev's Omneo
// on 28 June 2025), Bourgogne-Franche-Comté's (9 December 2023),
// Normandie's, Hauts-de-France's V2N (its cab cars withdrawn December
// 2025), the BB 67400 + RRR to Saint-Dié (the RRR run with BB 22200s;
// the line is closed for works July-November 2026).


const SCRIPT = "'Comic Sans MS', 'Chalkboard SE', 'Trebuchet MS', sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";
const smooth = (pts) => {
  let d = "";
  for (let i = 0; i + 1 < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += `C${n(p1[0] + (p2[0] - p0[0]) / 6)} ${n(p1[1] + (p2[1] - p0[1]) / 6)} ${n(p2[0] - (p3[0] - p1[0]) / 6)} ${n(p2[1] - (p3[1] - p1[1]) / 6)} ${n(p2[0])} ${n(p2[1])}`;
  }
  return d;
};

// A body from its outline path d: the base colour, the paint clipped to
// it and shaded as every drawing is, the outline in the theme's ink.
function shell(d, base, paint, L) {
  const id = newId();
  const ys = d.match(/-?\d+(\.\d+)?/g).map(Number).filter((_, i) => i % 2 === 1), lo = Math.min(...ys), hi = Math.max(...ys);
  const stop = (o, color, v, fb) => `<stop offset="${o}" stop-color="${color}" stop-opacity="${fb}" style="stop-opacity:var(${v},${fb})"/>`;
  const shade = `<linearGradient id="${id}-s" gradientUnits="userSpaceOnUse" x1="0" y1="${n(lo)}" x2="0" y2="${n(hi)}">` +
    stop(0, "#000", "--car-shade-low", 0.16) + '<stop offset="0.36" stop-color="#000" stop-opacity="0"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/>' +
    stop(0.8, "#fff", "--car-shade-high", 0.1) + '<stop offset="0.93" stop-color="#fff" stop-opacity="0"/>' + stop(1, "#000", "--car-shade-roof", 0.08) + "</linearGradient>";
  return `<path d="${d}" fill="${base}"/><clipPath id="${id}"><path d="${d}"/></clipPath><defs>${shade}</defs>` +
    `<g clip-path="url(#${id})">${paint}<rect x="-5" y="${n(lo)}" width="${n(L + 10)}" height="${n(hi - lo)}" fill="url(#${id}-s)"/></g>` +
    `<path d="${d}" fill="none" stroke="currentColor" stroke-width="0.8" ${STROKE}/>`;
}
// The left half's outline points (bottom to roof, x from the buffer face)
// mirrored for the right end: one closed path round a twin-cab body.
function twinPath(L, pts) {
  const right = [...pts].reverse().map(([x, y]) => [L - x, y]);
  const all = [...pts, ...right];
  return "M" + all.map(([x, y]) => `${n(x)} ${n(y)}`).join("L") + "Z";
}
const hgrad = (id, stops) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient></defs>`;
// A grab handle (vertical) and a horizontal one.
const grab = (x, y0, y1) => line(x, y0, x, y1, "#d6d9dc", 1.1) + line(x + 0.06, y0, x + 0.06, y1, "rgba(0,0,0,0.35)", 0.4);
const hgrab = (x0, x1, y) => line(x0, y, x1, y, "#d6d9dc", 1.0) + line(x0, y - 0.07, x1, y - 0.07, "rgba(0,0,0,0.3)", 0.4);
// A louvred grille panel: dark, fine vertical slats.
const grille = (x0, x1, y0, y1, fill = "#3a3d42") => rect(x0, y0, x1 - x0, y1 - y0, fill, 0, `stroke="#2a2c30" stroke-width="0.6" ${STROKE}`) + slats(x0, y0, x1 - x0, y1 - y0, 0.22, "rgba(255,255,255,0.13)");
const lampPair = (x, y, dir) => circle(x, y, 0.28, "#f2efe0", 0, 'stroke="#2a2d31" stroke-width="0.5" vector-effect="non-scaling-stroke"') + circle(x + dir * 0.55, y, 0.22, "#c8262f");
// The region's mark (Annecy 2025, Saint-Marcellin and Modane 2026):
// Auvergne-Rhône-Alpes's sky-blue square; in it a white disc holding the
// mountain line in blue (a small rise on the left, a big pointed peak, the
// line running out level to the right under it), "La Région" in white
// bold and "Auvergne-Rhône-Alpes" in white under it.
function auraPanel(c, x0, y0, w, h) {
  const cx = x0 + w / 2, cy = y0 + h * 0.72, r = Math.min(w * 0.3, h * 0.17);
  const mtn = `<path d="M-0.5 0.16L-0.22 -0.06L-0.04 0.08L0.12 -0.46L0.44 0.14L-0.24 0.3" fill="none" stroke="#1d9be0" stroke-width="0.08" stroke-linejoin="round" stroke-linecap="round"/>`;
  return rect(x0, y0, w, h, "#1d9be0") + circle(cx, cy, r, "#ffffff") + markAt(c, cx, cy + r * 0.05, r * 0.95, mtn) +
    T(c, cx, y0 + h * 0.4, Math.min(h * 0.13, w * 0.2), "La Région", "#ffffff", { weight: 700, family: NARROW }) +
    T(c, cx, y0 + h * 0.27, Math.min(h * 0.065, w * 0.085), "Auvergne-Rhône-Alpes", "#ffffff", { weight: 400, family: NARROW });
}
// SNCF's TER wordmark (2005): "ter" in one brush-written line, blue, a red
// crescent swept up under the "r" (BB 7319, the Bourgogne coaches, pilot
// car 126); on the Bourgogne coaches the region's name beside it. Drawn as strokes h ft tall (x: the t's
// foot, y: the baseline's middle).
const TER_PATH = "M0.22 -0.6Q0.12 -0.1 0.12 0.2Q0.14 0.4 0.36 0.3M-0.06 -0.18Q0.3 -0.26 0.62 -0.2" +
  "M0.5 0.06Q0.78 0.02 0.78 -0.12Q0.72 -0.24 0.58 -0.14Q0.44 0.02 0.52 0.22Q0.66 0.36 0.86 0.2" +
  "M0.9 0.3Q0.92 0.04 0.98 -0.12Q1.06 0.0 1.2 -0.04Q1.42 -0.1 1.56 0.1Q1.62 0.2 1.66 0.3";
function terMark(c, x, y, h, { ink = "#2d3fa0", region = null, regionInk = ink, swoosh = true } = {}) {
  let inner = `<path d="${TER_PATH}" fill="none" stroke="${ink}" stroke-width="0.11" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (swoosh) inner += `<path d="M0.94 0.32Q1.2 0.44 1.4 0.16Q1.28 0.42 1.02 0.42Z" fill="#e2001a"/>`;
  return markAt(c, x, y, h, `<g transform="translate(-0.8 0)">${inner}</g>`) +
    (region ? T(c, x + h * 0.95, y - h * 0.02, h * 0.36, region, regionInk, { weight: 600, anchor: "start" }) : "");
}
// Grand Est's wordmark: "Grand" and "Est" in bold condensed capitals-and-
// lower-case, the E's left upright cut short (white on blue).
const geWord = (c, x, y, h, fill = "#ffffff") => T(c, x, y, h, "Grand<tspan dx=\"0.04em\">Est</tspan>", fill, { weight: 700, family: NARROW, spacing: -0.02 * h, stretch: 0.8 });
// Grand Est's "fluo" box (BB 26152, 2026; BB 22298): a mid-blue rounded
// panel; "fluo" hand-drawn in one yellow-green line, the f's stem running
// down to the panel's foot, the o's top carried out to the right; the Grand
// Est wordmark in white beside it, low. Drawn in a box 2 units wide.
const FLUO_PATH = "M-0.6 0.46L-0.52 -0.28Q-0.5 -0.42 -0.36 -0.42M-0.7 -0.06L-0.44 -0.08" +
  "M-0.26 -0.42L-0.32 0.14M-0.18 -0.1L-0.2 0.08Q-0.18 0.16 -0.08 0.1L-0.04 -0.1L-0.06 0.14" +
  "M0.06 -0.08Q-0.06 -0.06 -0.04 0.06Q-0.02 0.16 0.08 0.12Q0.16 0.06 0.12 -0.06L0.3 -0.09";
function fluoBox(c, x0, y0, w, h) {
  const cx = x0 + w / 2, cy = y0 + h / 2, k = Math.min(w / 2, h);
  return rect(x0, y0, w, h, "#2c78cc", 0, `rx="${n(h * 0.12)}"`) +
    markAt(c, cx, cy, k, `<path d="${FLUO_PATH}" fill="none" stroke="#cddc3a" stroke-width="0.09" stroke-linecap="round" stroke-linejoin="round"/>`) +
    geWord(c, x0 + w * 0.76, y0 + h * 0.4, h * 0.3);
}
// The Grand Est plate (BB 26152's nose, pilot car 126): a blue rounded
// plate edged white, the wordmark big, a thin white rule ending in yellow,
// orange and red, and "ALSACE CHAMPAGNE-ARDENNE LORRAINE" under it.
const grandEstPlate = (c, x, y, w) => {
  const h = w * 0.36, x0 = x - w / 2, y0 = y - h / 2;
  return rect(x0, y0, w, h, "#2f74c6", 0, `rx="${n(h * 0.12)}" stroke="#ffffff" stroke-width="0.6" ${STROKE}`) + geWord(c, x, y0 + h * 0.62, h * 0.42) +
    rect(x0 + w * 0.08, y0 + h * 0.3, w * 0.6, h * 0.03, "#ffffff") + rect(x0 + w * 0.68, y0 + h * 0.3, w * 0.08, h * 0.035, "#f6c400") +
    rect(x0 + w * 0.76, y0 + h * 0.3, w * 0.08, h * 0.035, "#f08a2c") + rect(x0 + w * 0.84, y0 + h * 0.3, w * 0.08, h * 0.035, "#e2231a") +
    T(c, x, y0 + h * 0.16, h * 0.11, "ALSACE CHAMPAGNE-ARDENNE LORRAINE", "#ffffff", { weight: 700, family: NARROW });
};
// TER Alsace's words (Mulhouse, April 2025): "ALSACE" in tall, thin,
// condensed blue capitals, "S'Elsass" in pale gold beside it.
const alsaceWords = (c, x, y) => T(c, x, y, 2.3, "ALSACE", "#3346b0", { weight: 400, family: NARROW, stretch: 0.62, spacing: 0.05 }) +
  T(c, x + 5.6, y - 0.25, 1.4, "S'Elsass", "#cbb66a", { weight: 400, family: NARROW, anchor: "start", stretch: 0.8 });
// Bourgogne's mark (Conseil régional, on its old coaches): the arms of
// Burgundy (blue with gold fleurs-de-lis, gold and red bends) under a big
// blue brush "B", "Bourgogne" and "Conseil régional" in blue under it.
function bourgogneMark(c, x, y, h) {
  const arms = `<path d="M-0.36 -0.42L0.0 -0.42L0.0 0.0Q-0.02 0.22 -0.18 0.32Q-0.36 0.2 -0.36 0.0Z" fill="#2f43b8"/>` +
    `<path d="M-0.18 -0.42L0.0 -0.42L0.0 0.0Q-0.02 0.22 -0.18 0.32Z" fill="#f2b632"/>` +
    `<path d="M-0.14 -0.42L-0.08 -0.42L-0.01 -0.1L-0.05 0.05ZM-0.04 -0.42L0.0 -0.42L0.0 -0.2Z" fill="#d6302a"/>` +
    `<circle cx="-0.28" cy="-0.3" r="0.035" fill="#f2b632"/><circle cx="-0.28" cy="-0.15" r="0.035" fill="#f2b632"/><circle cx="-0.22" cy="0.0" r="0.035" fill="#f2b632"/>` +
    `<path d="M-0.06 0.4Q0.12 -0.1 0.26 -0.46M0.2 -0.36Q0.5 -0.44 0.38 -0.18Q0.3 -0.08 0.14 -0.06Q0.5 -0.04 0.4 0.22Q0.3 0.42 0.02 0.36" fill="none" stroke="#2f5fc8" stroke-width="0.07" stroke-linecap="round"/>`;
  return markAt(c, x, y + h * 0.18, h * 0.6, arms) + T(c, x, y - h * 0.25, h * 0.15, "Bourgogne", "#2f5fc8", { weight: 700 }) +
    T(c, x, y - h * 0.4, h * 0.09, "Conseil régional", "#5b7fd0", { weight: 400 });
}
// Rémi's sticker by the door (X 72529 at Tours 2026, Corails at Paris-
// Austerlitz February 2026): one slanted white panel; at its left the Rémi
// wordmark ("Ré" navy, "mi" sky blue, a green leaf over the é, a yellow
// dot on the i; the network's dotted line under it), a yellow middle with
// "CENTRE-VAL DE LOIRE / LA RÉGION VOUS TRANSPORTE" in dark capitals, and
// at its right the region's heart (sky blue and yellow lobes, a green
// point, a blue wave across).
const CVL_HEART = `<path d="M0 0.42L-0.32 0.0Q-0.46 -0.22 -0.3 -0.38Q-0.12 -0.5 0.0 -0.26Z" fill="#43b7e8"/><path d="M0 -0.26Q0.12 -0.5 0.32 -0.38Q0.48 -0.2 0.32 0.0L0 0.42Z" fill="#f2c94c"/>` +
  `<path d="M-0.16 0.2L0 0.42L0.16 0.2Z" fill="#2aa84a"/><path d="M-0.5 0.02Q-0.2 -0.08 0.05 0.06Q0.3 0.18 0.55 0.04" fill="none" stroke="#7fd0f2" stroke-width="0.09"/>`;
function remiBand(c, x, y, h) {
  const w = h * 4.4, k = h * 0.18, y0 = y - h / 2, y1 = y + h / 2;
  const para = (a, b, fill) => path(poly([[x + a + k, y1], [x + b + k, y1], [x + b - k, y0], [x + a - k, y0]]), fill);
  let s = para(0, w, "#ffffff") + para(w * 0.33, w * 0.78, "#f2c230");
  // The Rémi wordmark.
  s += T(c, x + w * 0.15, y + h * 0.06, h * 0.4, 'Ré<tspan fill="#1aa6e0">mi</tspan>', "#26235f", { weight: 800, italic: true, spacing: -0.03 * h }) +
    path(`M${n(x + w * 0.125)} ${n(y + h * 0.27)}q${n(h * 0.06)} ${n(h * 0.16)} ${n(h * 0.2)} ${n(h * 0.13)}q${n(-h * 0.05)} ${n(-h * 0.12)} ${n(-h * 0.2)} ${n(-h * 0.13)}Z`, "#2aa84a") +
    circle(x + w * 0.235, y + h * 0.25, h * 0.05, "#f2c94c") + line(x + w * 0.06, y - h * 0.3, x + w * 0.26, y - h * 0.3, "#26235f", 0.6) +
    [0.09, 0.12, 0.2, 0.23].map((f) => circle(x + w * f, y - h * 0.3, h * 0.035, "#26235f")).join("");
  s += T(c, x + w * 0.56, y + h * 0.1, h * 0.12, "CENTRE-VAL DE LOIRE", "#2a2620", { weight: 700, family: NARROW }) +
    T(c, x + w * 0.56, y - h * 0.1, h * 0.12, "LA RÉGION VOUS TRANSPORTE", "#2a2620", { weight: 700, family: NARROW });
  return s + markAt(c, x + w * 0.88, y + h * 0.05, h * 0.5, CVL_HEART);
}

// ===================== BB 7200 and BB 22200 ("nez cassé") =====================
// Alsthom's BB 7200 (1.5 kV, 1976-1985) and BB 22200 (dual voltage,
// 1976-1986), one body: 17.48 m over the buffers, bogie pivots 9.694 m
// apart, 2.8 m bogies, 1,250 mm wheels (fr.wikipedia "BB 22200",
// "BB 7200"). Paul Arzens's "broken nose": a projecting lower nose and the
// cab's windscreen leaning out at the top; a long louvred grille along the
// side between the cab doors; two pantographs. Measured off BB 7319
// broadside at Modane (August 2026): lower nose 0.52 m ahead of the cab,
// cab doors 2.0-2.5 m from the buffers, the grille from 4.2 m to 13.0 m,
// 1.05 m tall.
const NC = { L: 57.35, sill: 3.7, roof: 12.85, gr: [13.9, 42.8, 7.2, 10.85], door: [6.56, 8.25], pans: [15.3, 41.0], piv: 31.8 };
const NC_PTS = [[1.75, 3.15], [1.69, 3.5], [1.69, 7.75], [1.85, 8.25], [2.15, 8.6], [3.59, 8.95], [3.2, 11.7], [3.45, 12.1], [4.4, 12.6], [5.8, NC.roof]];
// liv: paint(L) under the details, over(c, L) lettering after.
function nezCasse(c, liv) {
  const L = NC.L, d = twinPath(L, NC_PTS);
  const doorAt = (x0) => {
    const x1 = x0 + (NC.door[1] - NC.door[0]);
    return rect(x0, 4.0, x1 - x0, 7.2, "none", 0, `rx="0.15" stroke="rgba(0,0,0,0.45)" stroke-width="0.6" ${STROKE}`) + pane(x0 + 0.35, 9.15, 1.0, 1.85, 0.2, "#1d2024") +
      grab(x0 - 0.3, 4.4, 9.4) + grab(x1 + 0.3, 4.4, 9.4) + rect(x0 + 0.35, 4.3, 1.0, 0.35, "#2a2d31");
  };
  let paint = liv.paint(L);
  paint += grille(NC.gr[0], NC.gr[1], NC.gr[2], NC.gr[3]) + line(NC.gr[0] - 0.2, NC.gr[3] + 0.15, NC.gr[1] + 0.2, NC.gr[3] + 0.15, "rgba(255,255,255,0.35)", 0.5);
  paint += doorAt(NC.door[0]) + doorAt(L - NC.door[1]);
  // The roof's edge: a light rain strip, the roof's grey above.
  paint += rect(-1, 12.0, L + 2, 3, liv.roof || "#a2a7ad") + line(-1, 12.0, L + 1, 12.0, "rgba(0,0,0,0.25)", 0.5);
  // The windscreen's frame seen edge-on and the rain strip over the nose.
  paint += path(poly([[3.2, 11.7], [3.59, 8.95], [4.2, 9.1], [3.8, 11.75]]), liv.cabFrame || "#2a2d31") + path(poly([[L - 3.2, 11.7], [L - 3.59, 8.95], [L - 4.2, 9.1], [L - 3.8, 11.75]]), liv.cabFrame || "#2a2d31");
  paint += hgrab(2.6, 4.6, 8.45) + hgrab(L - 4.6, L - 2.6, 8.45);
  // The step under each cab door.
  paint += rect(NC.door[0] + 0.1, 3.0, 1.5, 0.25, "#2a2d31") + rect(L - NC.door[1] + 0.1, 3.0, 1.5, 0.25, "#2a2d31");
  let s = "";
  // Running gear: two bogies, the air reservoirs between them.
  const c2 = NC.piv / 2;
  s += rect(22.9, 2.35, 10.7, 1.05, "#6d7278", 0, `rx="0.5" stroke="#3a3d42" stroke-width="0.5" ${STROKE}`) + rect(19.5, 2.9, 3.0, 0.8, "#2d3035") + rect(34.0, 2.9, 3.0, 0.8, "#2d3035");
  for (const k of [-1, 1]) s += truck(L / 2 + k * c2, { wb: 9.19, d: 49.2, kind: "loco", top: NC.sill });
  s += shell(d, liv.base, paint, L);
  s += liv.over ? liv.over(c, L) : "";
  // Lamps on the nose, buffers and coupling at both ends.
  s += uicBuffers(0, -1, { y: 3.45, reach: 1.75 }) + uicBuffers(L, 1, { y: 3.45, reach: 1.75 });
  s += rect(1.6, 2.6, 1.0, 0.6, "#2a2d31") + rect(L - 2.6, 2.6, 1.0, 0.6, "#2a2d31");
  // Roof: the two pantographs on their insulators, the resistor housing.
  s += rect(23.4, NC.roof - 0.05, 9.3, 1.35, "#8a9096", 0.4, 'rx="0.12"') + slats(23.5, NC.roof + 0.1, 9.1, 1.1, 0.35, "rgba(0,0,0,0.35)");
  s += rect(NC.pans[0] - 2.6, NC.roof - 0.05, 5.2, 0.35, "#5d636c", 0.4) + pantograph(NC.pans[0], NC.roof + 0.3, { up: false, facing: 1 });
  s += rect(NC.pans[1] - 2.6, NC.roof - 0.05, 5.2, 0.35, "#5d636c", 0.4) + pantograph(NC.pans[1], NC.roof + 0.3, { up: true, facing: -1 });
  s += lines([[NC.pans[0] + 2.8, NC.roof + 0.55, 23.4, NC.roof + 0.55], [32.7, NC.roof + 0.55, NC.pans[1] - 2.8, NC.roof + 0.55]], "#4a4e55", 0.8);
  return s;
}
// SNCF's grey ("livrée grise", carmillon logo; BB 22355, 22257, 22248 at
// Chambéry and Saint-Jean-de-Maurienne 2026; BB 7235 at Paris-Austerlitz,
// February 2026): silver all over, the number on the nose and on the side
// by the cab, the logo by the cab door.
const LIV_GRISE = (num) => ({
  base: "#c3c7cb", roof: "#9aa0a6", cabFrame: "#2a2d31",
  paint: (L) => rect(-1, 0, L + 2, 20, "#c3c7cb") + line(-1, 3.75, L + 1, 3.75, "rgba(0,0,0,0.2)", 0.5),
  over: (c, L) => T(c, 4.35, 6.3, 1.05, num, "#4a4d52", { weight: 500, stretch: 0.82 }) + T(c, L - 4.35, 6.3, 1.05, num, "#4a4d52", { weight: 500, stretch: 0.82 }) +
    sncf(c, 10.0, 7.6, 0.85) + sncf(c, L - 10.0, 7.6, 0.85),
});
// "En voyage" (2000s), as on BB 7319 for Auvergne-Rhône-Alpes (Modane,
// August 2026): silver; a broad band along the bottom shading from purple
// at cab 2 to light blue at cab 1, a nautilus and two faces in it, "en
// voyage..." in white hand lettering; the region's blue square behind cab
// 2's door, "ter" in blue at the grille's end, SNCF's logo on cab 1.
const LIV_VOYAGE = {
  base: "#c4c8cd", roof: "#a1a6ac", cabFrame: "#2a2d31",
  paint: (L) => {
    const id = newId();
    return rect(-1, 0, L + 2, 20, "#c4c8cd") + hgrad(id, [[0, "#6857ad"], [0.42, "#5b4c9f"], [0.6, "#5a5fae"], [0.78, "#4f8fcf"], [1, "#3b9ad8"]]) +
      rect(-1, 3.75, L + 2, 3.35, `url(#${id})`) + line(-1, 7.15, L + 1, 7.15, "#eef0f2", 1.4) + line(-1, 3.75, L + 1, 3.75, "#e6e9ec", 1.0) +
      // The nautilus and the two faces, as soft shapes in the band.
      "";
  },
  over: (c, L) => auraPanel(c, 9.46, 7.13, 3.5, 3.79) + T(c, 28.3, 5.5, 1.65, "en voyage...", "#ffffff", { weight: 400, family: SCRIPT, spacing: 0.06 }) +
    T(c, 4.1, 5.95, 0.95, "507319R", "#e8e6f2", { weight: 500 }) + T(c, 8.8, 6.0, 0.55, "2", "#ffffff", { weight: 500 }) + T(c, 48.2, 6.0, 0.55, "1", "#ffffff", { weight: 500 }) +
    terMark(c, 44.8, 8.75, 1.6) + sncf(c, 52.3, 6.4, 0.6),
};
// Grand Est's fluo (BB 22282, 22259, 22298 at Strasbourg and Ebersheim,
// 2022-2025): the cabs dark blue, back along the side to the cab doors;
// light grey body, the fluo box under the grille at one end, the Grand Est
// plate and SNCF's logo at the other, the number by the door.
const GE_BLUE = "#2b3d9e";
const LIV_FLUO22 = {
  base: "#c5cad0", roof: "#a6acb3", cabFrame: "#1d2a6e",
  paint: (L) => rect(-1, 0, L + 2, 20, "#c5cad0") +
    path(`M-1 0L6.25 0L6.25 11.4Q6.25 12.2 5.6 12.6L4.6 14L-1 14Z`, GE_BLUE) + path(`M${L + 1} 0L${L - 2.3} 0L${L - 2.3} 8.6L${L - 3.75} 9.0L${L - 3.4} 14L${L + 1} 14Z`, GE_BLUE),
  over: (c, L) => fluoBox(c, 36.0, 4.25, 4.9, 2.55) + grandEstPlate(c, 44.6, 10.3, 2.3) + sncf(c, 44.8, 8.5, 0.6) + T(c, 11.6, 9.6, 0.62, "22298RC", "#2a2d31", { weight: 700 }) +
    T(c, 9.2, 4.6, 0.45, "2", "#2a2d31", { weight: 500 }) + T(c, L - 9.2, 4.6, 0.45, "1", "#2a2d31", { weight: 500 }) + sncf(c, 4.0, 6.6, 0.7),
};

// ===================== BB 26000 (Sybic) =====================
// Alsthom's BB 26000 (1988-1998): 17.71 m over the buffers, bogie pivots
// 9.694 m apart, 2.8 m bogies, 1,250 mm wheels, monomotor bogies; two
// pantographs (fr.wikipedia "BB 26000"). The side measured off a
// rectified photograph of BB 26152 (Strasbourg? 2026): a cab-side window
// either end, three grille panels and two narrow slatted doors between,
// a box under the floor between the bogies. TER Grand Est's BB 26140R-
// 26153R (TER 200): silver, the cab's flanks dark blue, swept back from the
// windscreen to just ahead of the side window; a blue line along the top
// of the side; the fluo box mid-side, the number behind the cab, SNCF's
// logo at the far end; on the nose the Grand Est plate (not seen from the
// side).
const SY = { L: 58.1, sill: 3.8, roof: 12.95, piv: 31.8 };
const SY_PTS = [[1.6, 3.2], [1.15, 3.9], [1.1, 7.6], [1.6, 8.25], [2.75, 12.15], [3.6, 12.75], [4.8, SY.roof]];
function bb26000(c) {
  const L = SY.L, d = twinPath(L, SY_PTS), M = L / 2;
  let paint = rect(-1, 0, L + 2, 20, "#c6cacd") + rect(-1, 12.3, L + 2, 3, "#a3a9af") + line(-1, 12.3, L + 1, 12.3, "rgba(0,0,0,0.25)", 0.5);
  paint += rect(-1, 11.4, L + 2, 0.16, GE_BLUE);
  // The blue flanks of the cabs (26140R-26153R).
  paint += path(`M-1 0L5.0 0L5.6 3.9L8.4 12.3L8.8 14L-1 14Z`, GE_BLUE) + path(`M${L + 1} 0L${L - 5.0} 0L${L - 5.6} 3.9L${L - 8.4} 12.3L${L - 8.8} 14L${L + 1} 14Z`, GE_BLUE);
  // The windscreen's frame seen edge-on.
  paint += path(poly([[1.6, 8.25], [2.75, 12.15], [3.3, 12.1], [2.2, 8.3]]), "#1d2024") + path(poly([[L - 1.6, 8.25], [L - 2.75, 12.15], [L - 3.3, 12.1], [L - 2.2, 8.3]]), "#1d2024");
  // The side: cab windows, grilles, the slatted doors.
  for (const [a, b] of [[8.7, 10.9], [L - 10.9, L - 8.7]]) paint += pane(a, 9.35, b - a, 2.0, 0.2, "#1d2024");
  for (const [a, b] of [[12.2, 18.5], [21.4, 36.7], [L - 18.5, L - 12.2]]) paint += grille(a, b, 7.8, 11.25, "#33363b");
  for (const a of [18.9, L - 21.0]) paint += rect(a, 4.2, 2.1, 7.0, "#c0c4c8", 0, `rx="0.15" stroke="rgba(0,0,0,0.4)" stroke-width="0.6" ${STROKE}`) +
    rect(a + 0.55, 5.2, 1.0, 5.6, "#8f959b", 0, 'rx="0.4"') + slats(a + 0.6, 5.3, 0.9, 5.4, 0.18, "rgba(0,0,0,0.35)");
  // Panel joints and handholds low on the side.
  paint += lines([[12.0, 3.9, 12.0, 7.6], [L - 12.0, 3.9, L - 12.0, 7.6]], "rgba(0,0,0,0.22)", 0.5) + hgrab(8.8, 10.6, 7.1) + hgrab(L - 10.6, L - 8.8, 7.1) + hgrab(8.8, 10.6, 4.3) + hgrab(L - 10.6, L - 8.8, 4.3);
  let s = rect(21.4, 2.7, 14.8, 1.5, "#4a4e55", 0, `rx="0.2" stroke="#2c2f34" stroke-width="0.5" ${STROKE}`) + lines([[26.0, 2.8, 26.0, 4.1], [31.0, 2.8, 31.0, 4.1]], "rgba(255,255,255,0.15)", 0.5);
  for (const k of [-1, 1]) s += truck(M + k * SY.piv / 2, { wb: 9.19, d: 49.2, kind: "loco", top: SY.sill });
  s += shell(d, "#c6cacd", paint, L);
  s += fluoBox(c, 24.6, 4.65, 9.15, 3.1) + T(c, 29.2, 4.2, 0.34, "91 87 0026 152-5 F-SNCF", "#2a2d31", { weight: 500 }) +
    T(c, 9.8, 8.7, 0.8, "26152", "#2a2d31", { weight: 500 }) + sncf(c, L - 10.0, 10.35, 0.55) + T(c, 4.4, 4.6, 0.4, "2", "#e9ecef", { weight: 600 }) + T(c, L - 4.4, 4.6, 0.4, "1", "#e9ecef", { weight: 600 });
  s += uicBuffers(0, -1, { y: 3.45, reach: 1.3 }) + uicBuffers(L, 1, { y: 3.45, reach: 1.3 });
  // Roof: the pantographs at either end of the roof well, the
  // equipment in it under its grid.
  s += rect(14.0, SY.roof - 0.1, 30.1, 0.45, "#5d636c", 0.4) + slats(18.0, SY.roof, 22.0, 0.35, 0.5, "rgba(255,255,255,0.25)");
  s += pantograph(16.5, SY.roof + 0.35, { up: false, facing: 1 }) + pantograph(41.6, SY.roof + 0.35, { up: true, facing: -1 });
  return s;
}

// ===================== Corail coaches (VTU) =====================
// The Corail VTU (1975-1989): 26.4 m over the buffers, bogie pivots 18.306
// m apart on Y 32 bogies, 4.05 m tall (fr.wikipedia "Voiture Corail");
// measured off a rectified photograph of B11tux 50 87 20-77 681-6 at
// Saint-Marcellin (2026): a plug door near each end (the toilet beyond
// it), ten windows 1.5 m wide at a 2.08 m pitch between, the sill 1.15 m
// up. The TER paint (most of AURA's, Centre-Val de Loire's and Grand Est's
// coaches): grey, a broad blue band low on the side; the class panel by
// the door, a white "2" on a green-teal strip or a white "1" on an
// orange-red panel (the first class's only outside mark, A10tu at
// Haguenau 2025, AURA's at Annecy 2025); the region's marks at the ends.
const CO = { L: 86.6, end: 1.8, sill: 3.75, top: 12.3, roof: 13.29, win: [8.0, 11.4], band: [4.95, 5.95], door: [4.35, 11.05], piv: 60.06 };
const CO_W = 4.8, CO_P = 6.55, CO_X0 = 11.4; // window width, pitch, first window (ft from the coupler face)
function coachShell(c, paint, { cab = null } = {}) {
  const L = c.L, x0 = CO.end - 0.05, x1 = L - CO.end + 0.05, R = CO.roof;
  const d = cab ? cab.d : `M${n(x0)} ${CO.sill}L${n(x1)} ${CO.sill}L${n(x1)} ${n(R - 1.4)}Q${n(x1)} ${R} ${n(x1 - 1.8)} ${R}L${n(x0 + 1.8)} ${R}Q${n(x0)} ${R} ${n(x0)} ${n(R - 1.4)}Z`;
  let s = "";
  // Bogies and underframe first; the gangway bellows at coupled ends.
  const b1 = L / 2 - CO.piv / 2 + (cab ? cab.shift || 0 : 0), b2 = L / 2 + CO.piv / 2;
  s += rect(b1 + 7, 2.3, b2 - b1 - 14, 1.35, "#3a3e44", 0, 'rx="0.15"') + rect(L / 2 - 3.5, 1.9, 7.0, 0.8, "#9aa0a7", 0.4, 'rx="0.4"');
  s += truck(b1, { wb: 8.4, d: 36, top: CO.sill }) + truck(b2, { wb: 8.4, d: 36, top: CO.sill });
  if (c.coupledR) s += rect(L - CO.end - 0.1, 4.4, CO.end + 0.1, 7.4, C.rubber) + lines([[L - 0.9, 4.6, L - 0.9, 11.6]], "#3a3f45", 0.6);
  if (c.coupledL && !cab) s += rect(0, 4.4, CO.end + 0.1, 7.4, C.rubber) + lines([[0.9, 4.6, 0.9, 11.6]], "#3a3f45", 0.6);
  s += shell(d, "#b9bdc2", paint, L);
  s += uicBuffers(L, 1, { y: 3.45, reach: CO.end + 0.1 }) + (cab ? uicBuffers(0, -1, { y: 3.45, reach: cab.buf }) : uicBuffers(0, -1, { y: 3.45, reach: CO.end + 0.1 }));
  // Roof: the ventilation hoods and the curve's ribs.
  s += [14, 30, L - 30, L - 14].map((x) => path(`M${x - 1.2} ${R - 0.05}Q${x} ${R + 0.55} ${x + 1.2} ${R - 0.05}Z`, "#8f959b", 0.4)).join("");
  return s;
}
// The windows: a dark frame, the glass, the top-hung light's bar.
const coWins = (from, k, pitch = CO_P, w = CO_W) => Array.from({ length: k }, (_, i) => {
  const x = from + i * pitch;
  return rect(x, CO.win[0], w, CO.win[1] - CO.win[0], "#2d3036", 0, 'rx="0.55"') + pane(x + 0.25, CO.win[0] + 0.25, w - 0.5, CO.win[1] - CO.win[0] - 0.5, 0.4, "#1c1e22") +
    line(x + 0.35, CO.win[1] - 1.0, x + w - 0.35, CO.win[1] - 1.0, "#9aa0a6", 0.7);
}).join("");
// A door: its frame, the window, the handle; fill: the door's colour.
const coDoor = (x, fill) => rect(x, CO.door[0], 2.2, CO.door[1] - CO.door[0], fill, 0, `rx="0.2" stroke="rgba(0,0,0,0.45)" stroke-width="0.6" ${STROKE}`) +
  rect(x + 0.55, 7.6, 1.1, 2.9, "#2a2d33", 0, 'rx="0.5"') + rect(x + 0.65, 7.7, 0.9, 2.7, C.glass, 0, 'rx="0.42"') + rect(x + 1.75, 7.0, 0.15, 0.6, "#d6d9dc") +
  rect(x - 0.1, 3.0, 2.4, 0.25, "#2a2d31") + grab(x - 0.25, 5.0, 9.5) + grab(x + 2.45, 5.0, 9.5);
const DOORS = (L) => [6.0, L - 8.2];
// The class panel beside a door (x: its left edge).
const clsPanel = (c, x, cls) => cls === "1"
  ? rect(x, 7.3, 1.5, 4.0, "#e8542a") + T(c, x + 0.75, 10.45, 1.3, "1", "#ffffff", { weight: 700 }) + lines([[x + 0.12, 9.1, x + 1.38, 9.1], [x + 0.12, 8.6, x + 1.38, 8.6], [x + 0.12, 8.1, x + 1.38, 8.1]], "rgba(255,255,255,0.55)", 0.5)
  : rect(x, 7.3, 0.9, 4.0, "#2aa78e") + T(c, x + 0.45, 10.55, 0.95, "2", "#ffffff", { weight: 700 });
function corailTer(c, o) {
  const L = c.L, [d1, d2] = DOORS(L), first = o.cls === "1";
  let p = rect(-1, 0, L + 2, 20, "#b9bdc2") + rect(-1, CO.top, L + 2, 3, "#8e949a") + line(-1, CO.top, L + 1, CO.top, "rgba(0,0,0,0.3)", 0.5);
  p += rect(-1, CO.band[0], L + 2, CO.band[1] - CO.band[0], o.band || "#3b3a9a");
  if (o.underBand) p += o.underBand(L);
  p += coWins(CO_X0, 10) + coDoor(d1, o.door || "#c3c7cb") + coDoor(d2, o.door || "#c3c7cb");
  p += clsPanel(c, d1 + 2.55, first ? "1" : "2") + (o.bothPanels ? clsPanel(c, d2 - 1.6, first ? "1" : "2") : "");
  p += line(-1, CO.sill + 0.25, L + 1, CO.sill + 0.25, "rgba(0,0,0,0.25)", 0.5);
  let s = coachShell(c, p);
  s += o.over ? o.over(c, L, d1, d2) : "";
  return s;
}
// Auvergne-Rhône-Alpes: the region's blue square on each end past the
// door, SNCF's logo mid-side; Bourgogne-Franche-Comté's coaches in the
// same trains keep their "ter Bourgogne" paint (two blue lines, a red one
// at the class's end, the big outlined numeral) with AURA's square added.
const AURA_OVER = (c, L, d1, d2) => auraPanel(c, 2.3, 7.0, 3.3, 3.9) + auraPanel(c, L - 5.6, 7.0, 3.3, 3.9) + sncf(c, 47.0, 6.9, 0.85);
const CVL_OVER = (c, L, d1, d2) => sncf(c, d1 + 6.6, 7.0, 1.0) + terMark(c, d1 + 13.0, 7.3, 1.7) + remiBand(c, d1 + 17.0, 7.0, 1.7);
const GE_OVER = (c, L, d1, d2) => terMark(c, L - 16.6, 7.0, 1.3) + grandEstPlate(c, L - 12.0, 7.0, 2.4) + sncf(c, L - 8.6, 7.0, 0.75);
function corailBfc(c) {
  const L = c.L, [d1, d2] = DOORS(L);
  let p = rect(-1, 0, L + 2, 20, "#b6bac0") + rect(-1, CO.top, L + 2, 3, "#8e949a") + line(-1, CO.top, L + 1, CO.top, "rgba(0,0,0,0.3)", 0.5);
  p += rect(-1, 5.25, L + 2, 0.55, "#2f43b8") + rect(-1, 6.55, L + 2, 0.22, "#2f43b8") + rect(d1 + 2.8, 6.4, 12.3, 0.42, "#e2271e");
  // The big outlined "2" by the door.
  p += path(`M${d1 + 3.0} 7.2Q${d1 + 2.6} 10.8 ${d1 + 5.8} 12.0`, "none", 0, 'stroke="#eef0f2" stroke-width="0.7" vector-effect="non-scaling-stroke"') +
    rect(d1 + 2.8, 6.9, 2.6, 2.2, "#c9ccd1") + T(c, d1 + 3.6, 8.0, 1.6, "2", "#ffffff", { weight: 800 });
  p += coWins(CO_X0 + 0.4, 10) + coDoor(d1, "#d63a2f") + coDoor(d2, "#d63a2f");
  let s = coachShell(c, p);
  s += terMark(c, L - 14.6, 7.5, 1.15, { ink: "#2f43b8", region: "Bourgogne" }) + bourgogneMark(c, 3.25, 9.6, 3.6) +
    T(c, 47.0, 4.55, 0.4, "E-SNCF 50 87 20-77 681-6", "#2a2d31", { weight: 600, anchor: "start" });
  return s;
}
// TER 200's Alsace coaches (TER Alsace's paint, lettered Grand Est):
// grey; the door dark blue; over the end the region's line map on pale
// green and yellow; along the side tall slanting stripes in pink, yellow,
// green, grey and brown behind the windows; "ALSACE S'Elsass" in blue at
// the far end; the blue band low (photographs at Mulhouse and Colmar,
// April 2025; Strasbourg 2025).
function corailAlsace(c, o = {}) {
  const L = c.L, [d1, d2] = DOORS(L), G0 = 5.95, G1 = CO.top;
  let p = rect(-1, 0, L + 2, 20, "#bec2c7") + rect(-1, CO.top, L + 2, 3, "#8e949a") + line(-1, CO.top, L + 1, CO.top, "rgba(0,0,0,0.3)", 0.5);
  // The map end, past the door: pale green, a broad yellow slash, the
  // lines and stations (Strasbourg's big ring).
  p += rect(CO.end - 0.2, G0, d1 - CO.end + 0.2, G1 - G0, "#a9dcc8") + path(poly([[3.3, G0], [d1, G0], [d1, G1], [5.0, G1]]), "#f2c62e");
  p += lines([[1.6, 9.4, 4.4, 8.6], [4.4, 8.6, d1, 9.6], [2.6, 12.3, 4.4, 8.6], [4.4, 8.6, 3.0, 6.0]], "#2c3e93", 0.9) + circle(4.4, 8.6, 0.55, "#ffffff", 0, `stroke="#2c3e93" stroke-width="1.0" ${STROKE}`);
  // Past the door: an orange block, then tall stripes slanting forward
  // behind the windows, the line map running thin over them.
  p += rect(d1 + 2.2, G0, 2.6, G1 - G0, "#f08a2c");
  const cols = ["#e23c8c", "#f4c531", "#7cc576", "#a9adb3", "#a7713f", "#f08bb5", "#d9e23c", "#5fb7a0"];
  for (let i = 0; i < 14; i++) {
    const x = d1 + 4.8 + i * 3.3, w = i % 3 === 1 ? 1.5 : 2.3;
    if (x > L - 30) break;
    p += path(poly([[x, G0], [x + w, G0], [x + w + 1.2, G1], [x + 1.2, G1]]), cols[i % cols.length], 0, 'opacity="0.92"');
  }
  p += lines([[d1 + 2.2, 9.6, d1 + 14, 8.2], [d1 + 14, 8.2, d1 + 30, 7.4], [d1 + 30, 7.4, d1 + 46, 7.9]], "#2c3e93", 0.7) +
    [[d1 + 14, 8.2], [d1 + 30, 7.4], [d1 + 46, 7.9]].map(([x, y]) => circle(x, y, 0.28, "#ffffff", 0, `stroke="#2c3e93" stroke-width="0.6" ${STROKE}`)).join("");
  p += rect(-1, 4.5, L + 2, G0 - 4.5, "#2c3e93") + coWins(CO_X0, 10) + coDoor(d1, "#2c3e93") + coDoor(d2, "#2c3e93");
  p += T(c, d1 + 3.5, 10.4, 1.9, o.cls === "1" ? "1" : "2", o.cls === "1" ? "#f08bb5" : "#ffffff", { weight: 800 });
  let s = coachShell(c, p);
  s += alsaceWords(c, L - 28.1, 7.3) + terMark(c, L - 16.6, 7.2, 1.2) + grandEstPlate(c, L - 13.1, 7.4, 1.8) + sncf(c, L - 10.6, 7.4, 0.65);
  return s;
}

// ===================== Corail pilot car (B5uxh) =====================
// 48 driving trailers rebuilt from B6Du coaches with Alstom's cab
// (2007-2008, fr.wikipedia "Voiture Corail"), 27.0 m here: the cab's
// windscreen raked far back over a rounded nose, a narrow cab-side window,
// the bicycle door behind it. The cab's paint: a cap over the windscreen
// and down the cab's sides in the region's colour (Grand Est's dark blue
// on the TER 200's, no. 126 at Strasbourg 2025; Bourgogne's red on those
// now in AURA's push-pull sets, Saint-Marcellin and Chambéry 2026), a
// white curve below the windscreen round the lamps, grey below.
const PIL = { L: 88.6, buf: 1.9, front: 2.0 };
const PIL_TOP = [[2.0, 3.9], [1.85, 6.2], [2.1, 7.6], [2.9, 8.5], [5.0, 10.2], [7.6, 11.9], [10.4, 12.95], [13.2, CO.roof]];
function pilotCar(c, o) {
  const L = c.L, R = CO.roof, x1 = L - CO.end + 0.05;
  const d = `M2.0 ${CO.sill}L${n(x1)} ${CO.sill}L${n(x1)} ${n(R - 1.4)}Q${n(x1)} ${R} ${n(x1 - 1.8)} ${R}L13.2 ${R}` + smooth([...PIL_TOP].reverse()) + "Z";
  const cap = o.cap, D1 = 23.5, D2 = L - 8.2;
  let p = rect(-1, 0, L + 2, 20, "#b9bdc2") + rect(13, CO.top, L, 3, "#8e949a") + line(13, CO.top, L + 1, CO.top, "rgba(0,0,0,0.3)", 0.5);
  p += rect(-1, CO.band[0], L + 2, CO.band[1] - CO.band[0], o.band || "#3b3a9a");
  // The cab: the cap over the windscreen and back along the cab's side
  // past its window, edged by a white curve that runs from under the
  // lamps up behind the window to the roof.
  p += path(`M-1 6.1L2.2 6.1C4.8 6.0 8.0 6.4 10.6 7.0C13.6 7.6 15.2 9.6 15.4 12.4L15.6 14L-1 14Z`, cap);
  p += path(`M-1 4.6L2.4 4.6C3.6 4.7 4.6 5.0 5.6 5.4C8.0 5.6 11.0 5.9 13.0 6.6C15.4 7.4 16.4 9.6 16.4 12.4L16.6 14L15.6 14L15.4 12.4C15.2 9.6 13.6 7.6 10.6 7.0C8.0 6.4 4.8 6.0 2.2 6.1L-1 6.1Z`, "#f1f2f3");
  // The windscreen seen edge-on along the nose, the cab-side window.
  p += path(poly([[3.1, 8.75], [5.1, 10.45], [7.7, 12.15], [10.2, 13.05], [10.6, 12.6], [8.0, 11.6], [5.5, 9.95], [3.6, 8.45]]), "#1d2024");
  p += pane(13.2, 9.0, 1.2, 2.8, 0.25, "#1d2024");
  p += rect(D1, CO.door[0], 2.4, CO.door[1] - CO.door[0], o.door || cap, 0, `rx="0.2" stroke="rgba(0,0,0,0.45)" stroke-width="0.6" ${STROKE}`) +
    rect(D1 + 0.6, 7.4, 1.2, 3.2, "#2a2d33", 0, 'rx="0.5"') + bikeIcon(D1 + 1.2, 9.0, 0.9, "#ffffff") + grab(D1 - 0.25, 5.0, 9.5) + grab(D1 + 2.65, 5.0, 9.5);
  p += o.paint ? o.paint(c, L, D1) : "";
  p += coWins(28.6, 8, CO_P) + coDoor(D2, o.farDoor || "#c3c7cb");
  let s = coachShell(c, p, { cab: { d, buf: PIL.buf + 0.1, shift: 1.2 } });
  s += rect(2.0, 2.4, 1.4, 1.2, "#2a2d31") + circle(2.05, 5.3, 0.3, "#f2efe0", 0, 'stroke="#2a2d31" stroke-width="0.5" vector-effect="non-scaling-stroke"');
  s += o.over ? o.over(c, L, D1) : "";
  return s;
}
function bikeIcon(x, y, h, color) {
  const r = h * 0.28, st = `fill="none" stroke="${color}" stroke-width="${n(h * 0.08)}"`;
  return `<g transform="translate(${n(x)} ${n(y)})"><circle cx="${n(-h * 0.42)}" cy="${n(-h * 0.2)}" r="${n(r)}" ${st}/><circle cx="${n(h * 0.42)}" cy="${n(-h * 0.2)}" r="${n(r)}" ${st}/>` +
    `<path d="M${n(-h * 0.42)} ${n(-h * 0.2)}L${n(-h * 0.1)} ${n(h * 0.22)}L${n(h * 0.28)} ${n(h * 0.22)}L${n(h * 0.42)} ${n(-h * 0.2)}M${n(-h * 0.1)} ${n(h * 0.22)}L${n(h * 0.05)} ${n(-h * 0.2)}L${n(h * 0.28)} ${n(h * 0.22)}" ${st}/></g>`;
}
const PILOT_GE = {
  cap: "#2c3eb2", band: "#2c3e93", door: "#2c3e93",
  paint: (c, L, D1) => {
    // Alsace's map and stripes behind the bicycle door.
    let s = rect(19.6, 5.95, D1 - 19.6, 6.35, "#a9dcc8") + path(poly([[20.8, 5.95], [22.2, 5.95], [D1, 9.0], [D1, 12.3], [21.8, 12.3]]), "#f2c62e") +
      lines([[19.6, 9.6, 21.6, 8.9], [21.6, 8.9, D1, 9.4], [20.6, 12.3, 21.6, 8.9]], "#2c3e93", 0.6) + circle(21.6, 8.9, 0.32, "#ffffff", 0, `stroke="#2c3e93" stroke-width="0.6" ${STROKE}`) +
      rect(D1 + 2.4, 5.95, 3.0, 6.35, "#f08a2c");
    const cols = ["#e23c8c", "#f4c531", "#7cc576", "#a9adb3", "#a7713f", "#f08bb5"];
    for (let i = 0; i < 10; i++) { const x = D1 + 5.4 + i * 3.4; s += path(poly([[x, 5.95], [x + 2.4, 5.95], [x + 3.6, 12.3], [x + 1.2, 12.3]]), cols[i % 6], 0, 'opacity="0.92"'); }
    return s;
  },
  over: (c, L, D1) => grandEstPlate(c, 17.6, 9.6, 2.6) + sncf(c, 17.2, 11.6, 0.6) + terMark(c, 17.4, 7.0, 1.2) + T(c, 5.4, 6.9, 0.6, "126", "#ffffff", { weight: 700 }) +
    alsaceWords(c, L - 25.5, 7.3),
};
const PILOT_AURA = {
  cap: "#e1312b", band: "#3b3a9a", door: "#d6302a",
  paint: (c, L, D1) => path(`M16.6 14L16.4 12.4C16.3 9.4 17.6 6.4 19.6 3.8L20.0 3.8L20.0 4.6C18.6 7.0 17.8 9.6 17.9 14Z`, "#9ea3a9") +
    // The big grey outlined "2" behind the door, Bourgogne's swoosh.
    path(`M${D1 + 3.2} 5.0Q${D1 + 2.4} 9.6 ${D1 + 5.4} 12.1`, "none", 0, 'stroke="#d0d3d7" stroke-width="0.8" vector-effect="non-scaling-stroke"') +
    T(c, D1 + 3.9, 7.0, 1.4, "2", "#e4e6e9", { weight: 800 }),
  over: (c, L, D1) => auraPanel(c, 19.9, 7.2, 3.2, 4.4) + sncf(c, L - 30.0, 7.0, 0.8),
};

// ===================== RRR (rame réversible régionale) =====================
// Carel Fouché and Alsthom's stainless push-pull sets (1985-1994);
// Grand Est's last 15 cars run as three-car sets behind a BB 22200 between
// Strasbourg, Sélestat and Saverne (BOAMP tender, August 2025; 16 Régiolis
// to replace them from 2028-2030). In every 2023-2025 photograph the cab car
// runs next to the locomotive, its blue cab against it, the set's far end a
// plain stainless one. Each car: fluted stainless lower sides, the windows
// in a flat band with a top-hung light, a single sliding door near each
// end, the dark-blue strip along the eaves; the cab car's face dark blue
// with the set's number in white. Car length 25.1 m (not published;
// estimated from the photographs, uncertain).
const RR = { L: 82.3, sill: 3.7, roof: 13.05, top: 12.25, win: [8.3, 11.2], end: 1.8 };
function rrrCar(c, o = {}) {
  const L = c.L, R = RR.roof, x0 = RR.end, x1 = L - RR.end;
  const cab = !!o.cab;
  const d = cab
    ? `M${n(x0)} ${RR.sill}L${n(x1)} ${RR.sill}L${n(x1)} ${n(R - 1.2)}Q${n(x1)} ${R} ${n(x1 - 1.5)} ${R}L${n(x0 + 2.0)} ${R}Q${n(x0 + 0.5)} ${R} ${n(x0 + 0.35)} ${n(R - 1.2)}L${n(x0)} 9.0Z`
    : `M${n(x0)} ${RR.sill}L${n(x1)} ${RR.sill}L${n(x1)} ${n(R - 1.2)}Q${n(x1)} ${R} ${n(x1 - 1.5)} ${R}L${n(x0 + 1.5)} ${R}Q${n(x0)} ${R} ${n(x0)} ${n(R - 1.2)}Z`;
  const doors = cab ? [17.0, L - 8.6] : [7.4, L - 10.2];
  let p = rect(-1, 0, L + 2, 20, "#a9aeb4") + rect(-1, RR.top, L + 2, 3, "#5f646b");
  // Fluting below the windows, a flat band at the windows, the blue
  // strip under the roof's edge.
  const segs = [];
  for (let y = RR.sill + 0.35; y < RR.win[0] - 0.4; y += 0.34) segs.push([-1, y, L + 1, y]);
  p += lines(segs, "rgba(60,66,72,0.45)", 0.5) + rect(-1, RR.win[0] - 0.4, L + 2, RR.win[1] - RR.win[0] + 0.8, "#b4b9be") + rect(-1, RR.top - 0.45, L + 2, 0.45, "#2b3a7e");
  // Windows: one between the end and each door, eight between the doors.
  const w = 3.3, xs = [];
  if (cab) { xs.push(9.0, 12.6); for (let i = 0; i < 9; i++) xs.push(20.6 + i * 5.8); }
  else { xs.push(3.4); for (let i = 0; i < 10; i++) xs.push(11.4 + i * 5.85); xs.push(L - 5.6); }
  for (const x of xs) if (x + w < L - 1) p += rect(x, RR.win[0], w, RR.win[1] - RR.win[0], "#2d3036", 0, 'rx="0.3"') + pane(x + 0.2, RR.win[0] + 0.2, w - 0.4, RR.win[1] - RR.win[0] - 0.4, 0.25, "#1c1e22") +
    line(x + 0.25, RR.win[1] - 0.8, x + w - 0.25, RR.win[1] - 0.8, "#8d939a", 0.6);
  for (const x of doors) p += rect(x, 4.0, 2.6, 7.7, "#9da2a8", 0, `rx="0.15" stroke="rgba(0,0,0,0.5)" stroke-width="0.6" ${STROKE}`) +
    pane(x + 0.5, 8.3, 1.6, 2.9, 0.3, "#1c1e22") + line(x + 1.3, 4.1, x + 1.3, 8.1, "rgba(0,0,0,0.3)", 0.5) + rect(x - 0.1, 3.2, 2.8, 0.25, "#2a2d31");
  if (cab) {
    // The blue cab face wrapping onto the side; the cab's side window.
    p += path(`M-1 0L${n(x0 + 2.2)} 0L${n(x0 + 2.2)} ${R + 1}L-1 ${R + 1}Z`, "#2c3eb2") + pane(x0 + 0.7, 9.2, 1.2, 1.9, 0.2, "#1c1e22");
  }
  let s = "";
  const b1 = 9.0, b2 = L - 9.0;
  s += rect(b1 + 6, 2.4, b2 - b1 - 12, 1.25, "#3a3e44", 0, 'rx="0.15"');
  s += truck(b1, { wb: 8.2, d: 33, top: RR.sill }) + truck(b2, { wb: 8.2, d: 33, top: RR.sill });
  if (c.coupledR) s += rect(L - RR.end - 0.1, 4.3, RR.end + 0.1, 7.2, C.rubber);
  if (c.coupledL && !cab) s += rect(0, 4.3, RR.end + 0.1, 7.2, C.rubber);
  s += shell(d, "#a9aeb4", p, L);
  s += uicBuffers(0, -1, { y: 3.45, reach: RR.end + 0.1 }) + uicBuffers(L, 1, { y: 3.45, reach: RR.end + 0.1 });
  if (cab) s += T(c, x0 + 1.3, 7.0, 0.75, o.num || "306", "#ffffff", { weight: 700 }) + sncf(c, 7.6, 9.7, 0.6) + bikeIcon(13.6 + 0.9, 9.6, 0.9, "#e9ecef") + lampPair(x0 + 0.5, 5.0, 1);
  s += [16, L - 16].map((x) => rect(x - 1.5, R - 0.05, 3.0, 0.4, "#4a4e55", 0.4, 'rx="0.12"')).join("");
  return s;
}

// ===================== Tables =====================
const { TYPES, MODELS, add } = registry();
const loco = (key, name, draw, len, kind = "electric") => { TYPES[key] = { name, kind, pan: true }; MODELS[key] = { draw, len, oneEnd: false, variant: null }; };
const coach = (key, name, draw, len, extra = {}) => { TYPES[key] = { name, kind: "coach", ...extra }; MODELS[key] = { draw, len, oneEnd: !!extra.cab, variant: null }; };
loco("terBB26000ge", "BB 26000 (Sybic) electric locomotive, TER Grand Est (fluo)", bb26000, SY.L);
loco("terBB22200ge", "BB 22200 electric locomotive, TER Grand Est (fluo)", (c) => nezCasse(c, LIV_FLUO22), NC.L);
loco("terBB22200aura", "BB 22200 electric locomotive, SNCF grey, TER Auvergne-Rhône-Alpes", (c) => nezCasse(c, LIV_GRISE("522355")), NC.L);
loco("terBB7200aura", "BB 7200 electric locomotive, “en voyage” paint, TER Auvergne-Rhône-Alpes", (c) => nezCasse(c, LIV_VOYAGE), NC.L);
loco("terBB7200cvl", "BB 7200 electric locomotive, SNCF grey, Rémi (Centre-Val de Loire)", (c) => nezCasse(c, LIV_GRISE("507235")), NC.L);
coach("terCorailGeA", "Corail coach with first class (A10tu), TER Grand Est", (c) => corailTer(c, { cls: "1", over: GE_OVER }), CO.L, { amenities: ["first"] });
coach("terCorailAlsB", "Corail coach (B11tu), TER Alsace paint, TER Grand Est", (c) => corailAlsace(c, {}), CO.L);
coach("terCorailAlsA", "Corail coach with first class, TER Alsace paint, TER Grand Est", (c) => corailAlsace(c, { cls: "1" }), CO.L, { amenities: ["first"] });
coach("terPilotGe", "TER 200 pilot car (Corail B5uxh), TER Grand Est", (c) => pilotCar(c, PILOT_GE), PIL.L, { cab: true, amenities: ["bikes"] });
coach("terCorailAuraA", "Corail coach with first class (A10tu), TER Auvergne-Rhône-Alpes", (c) => corailTer(c, { cls: "1", over: AURA_OVER }), CO.L, { amenities: ["first"] });
coach("terCorailAuraB", "Corail coach (B11tu), TER Auvergne-Rhône-Alpes", (c) => corailTer(c, { cls: "2", over: AURA_OVER }), CO.L);
coach("terCorailBfcB", "Corail coach (B11tux) in TER Bourgogne paint, TER Auvergne-Rhône-Alpes", corailBfc, CO.L);
coach("terPilotAura", "Corail pilot car (B5uxh) in Bourgogne's red, TER Auvergne-Rhône-Alpes", (c) => pilotCar(c, PILOT_AURA), PIL.L, { cab: true, amenities: ["bikes"] });
coach("terCorailCvlA", "Corail coach with first class (A10tu), Rémi (Centre-Val de Loire)", (c) => corailTer(c, { cls: "1", door: "#2aa78e", over: CVL_OVER }), CO.L, { amenities: ["first"] });
coach("terCorailCvlB", "Corail coach (B11tu), Rémi (Centre-Val de Loire)", (c) => corailTer(c, { cls: "2", door: "#2aa78e", over: CVL_OVER }), CO.L);
TYPES.terRrrCab = { name: "RRR cab car (rame réversible régionale), TER Grand Est", kind: "coach", cab: false };
MODELS.terRrrCab = { draw: (c) => rrrCar(c, { cab: true }), len: RR.L, oneEnd: false, variant: null };
coach("terRrrB", "RRR car (rame réversible régionale), TER Grand Est", (c) => rrrCar(c, {}), RR.L);
void add;

// ---------- Typical trains ----------
const SETS = {
  ter200_ge: set("TER 200 (TER Grand Est): a BB 26000 with Corail coaches, first class next to it, the pilot car at the other end; usually in TER Alsace's paint (some coaches plain grey)",
    ["terBB26000ge", 1], ["terCorailGeA", 1], ["terCorailAlsB", 4], ["terPilotGe", 1]),
  rrr_bb222_ge: set("TER Grand Est: a BB 22200 with a three-car RRR set (Strasbourg–Sélestat, Strasbourg–Saverne; often two sets)",
    ["terBB22200ge", 1], ["terRrrCab", 1], ["terRrrB", 2]),
  corail_bb222_aura: set("TER Auvergne-Rhône-Alpes Corail push-pull set: a BB 22200, Corail coaches (some still in TER Bourgogne's paint), first class next to the locomotive, the pilot car at the far end",
    ["terBB22200aura", 1], ["terCorailAuraA", 1], ["terCorailAuraB", 2], ["terCorailBfcB", 1], ["terPilotAura", 1]),
  corail_bb72_aura: set("TER Auvergne-Rhône-Alpes Corail push-pull set in the Maurienne: a BB 7200, Corail coaches and the pilot car",
    ["terBB7200aura", 1], ["terCorailAuraA", 1], ["terCorailAuraB", 3], ["terPilotAura", 1]),
  corail_bb72_cvl: set("Rémi (TER Centre-Val de Loire) Paris-Austerlitz–Orléans: a BB 7200 with Corail coaches, first class next to it",
    ["terBB7200cvl", 1], ["terCorailCvlA", 1], ["terCorailCvlB", 5]),
};

// ---------- Fleet numbers ----------
// European Vehicle Numbers as the locomotives are lettered: BB 26000
// "91 87 0026 152-5" (TER Grand Est's 26140-26168), BB 22200 "91 87 0022 xxx"
// (Grand Est's ten include 22259, 22282, 22298 and 22305 in the
// photographs; the rest of the TER ones are Auvergne-Rhône-Alpes's), BB 7200
// "91 87 0007 2xx/3xx" (AURA's at Chambéry; Centre-Val de Loire's too, not
// told apart here).
const one = (num, key) => { const s = String(num).padStart(5, "0"); return [Number(`9187000${s}0`), Number(`9187000${s}9`), key]; };
const FLEET = [
  [918700261400, 918700261689, "terBB26000ge"],
  ...[22259, 22282, 22298, 22305].map((k) => one(k, "terBB22200ge")),
  [918700222000, 918700224059, "terBB22200aura"],
];

// ---------- Fact sheets ----------
const FRWP = "https://fr.wikipedia.org/wiki/";
const CORAIL = { model: "Corail coach (VTU)", type: "Passenger coach", builder: "Various (SNCF design)", built: "1975–1989", topSpeedMph: 99, lengthFt: 86.6, source: `${FRWP}Voiture_Corail` };
const NCF = { builder: "Alsthom and MTE", type: "Electric locomotive", topSpeedMph: 99, lengthFt: 57.3 };
const FACTS = {
  terBB26000ge: { model: "Alsthom BB 26000 (Sybic)", type: "Electric locomotive", builder: "Alsthom", built: "1988–1998", fleet: "22 reversible units for TER Grand Est's TER 200 (26140R–26168R)",
    topSpeedMph: 124, powerHp: 7510, lengthFt: 58.1, source: `${FRWP}BB_26000`, about: "It hauls and pushes the TER 200's Corail coaches between Strasbourg, Colmar, Mulhouse and Basel, and to Metz and Nancy." },
  terBB22200ge: { ...NCF, model: "Alsthom BB 22200", built: "1976–1986", fleet: "10 for TER Grand Est (bought from PACA in 2019)", powerHp: 5550, source: `${FRWP}BB_22200`,
    about: "Grand Est's BB 22200s work the RRR sets between Strasbourg, Sélestat and Saverne, in the fluo paint." },
  terBB22200aura: { ...NCF, model: "Alsthom BB 22200", built: "1976–1986", fleet: "32 at Chambéry (2026)", powerHp: 5550, source: `${FRWP}BB_22200`,
    about: "Auvergne-Rhône-Alpes's BB 22200s push and pull the Corail sets on Lyon–Chambéry–Modane, Annecy, Grenoble–Valence and Bourg-Saint-Maurice." },
  terBB7200aura: { ...NCF, model: "Alsthom BB 7200", built: "1976–1985", powerHp: 5550, source: `${FRWP}BB_7200`,
    about: "A 1.5 kV BB 7200 on the Maurienne's Corail trains to Modane, still in SNCF's \"en voyage\" paint with the region's mark." },
  terBB7200cvl: { ...NCF, model: "Alsthom BB 7200", built: "1976–1985", powerHp: 5550, source: `${FRWP}BB_7200`,
    about: "Rémi's Corail trains between Paris-Austerlitz and Orléans are hauled by BB 7200s in SNCF's grey." },
  terCorailGeA: { ...CORAIL, about: "A first-class Corail coach of the TER 200, marked by the orange-red \"1\" by its doors." },
  terCorailAlsB: { ...CORAIL, about: "A second-class Corail of the TER 200 in TER Alsace's paint: the region's line map and bright stripes." },
  terCorailAlsA: { ...CORAIL, about: "A TER 200 Corail with first class, in TER Alsace's paint." },
  terPilotGe: { model: "Corail pilot car (B5uxh)", type: "Driving trailer", builder: "SNCF, cab by Alstom", built: "2007–2008 (rebuilt from B6Du)", lengthFt: 88.6,
    source: `${FRWP}TER_200`, about: "The cab car at the far end of the TER 200 from its BB 26000, with the bicycles behind the cab." },
  terCorailAuraA: { ...CORAIL, about: "A first-class Corail of Auvergne-Rhône-Alpes's push-pull sets, the orange-red \"1\" by its door." },
  terCorailAuraB: { ...CORAIL, about: "A second-class Corail of Auvergne-Rhône-Alpes's push-pull sets." },
  terCorailBfcB: { ...CORAIL, about: "One of the Corail coaches Bourgogne-Franche-Comté passed on to Auvergne-Rhône-Alpes after its own Corail trains ended in December 2023, still in TER Bourgogne's paint." },
  terPilotAura: { model: "Corail pilot car (B5uxh)", type: "Driving trailer", builder: "SNCF, cab by Alstom", built: "2007–2008 (rebuilt from B6Du)", lengthFt: 88.6,
    source: `${FRWP}Voiture_Corail`, about: "Ex-Bourgogne pilot car, still red, at the far end of Auvergne-Rhône-Alpes's Corail sets." },
  terCorailCvlA: { ...CORAIL, about: "A first-class Corail of Rémi's Paris-Austerlitz–Orléans trains." },
  terCorailCvlB: { ...CORAIL, about: "A second-class Corail of Rémi's Paris-Austerlitz–Orléans trains." },
  terRrrCab: { model: "RRR (rame réversible régionale) cab car", type: "Driving trailer", builder: "Carel Fouché Industrie and Alsthom", built: "1985–1994", fleet: "15 cars left (Grand Est)",
    source: `${FRWP}Rame_r%C3%A9versible_r%C3%A9gionale`, about: "Grand Est's last RRR sets, stainless three-car push-pull sets, to be replaced by Régiolis from 2028." },
  terRrrB: { model: "RRR (rame réversible régionale)", type: "Passenger coach", builder: "Carel Fouché Industrie and Alsthom", built: "1985–1994",
    source: `${FRWP}Rame_r%C3%A9versible_r%C3%A9gionale`, about: "A stainless car of Grand Est's RRR sets." },
};

return { TYPES, MODELS, SETS, FACTS, FLEET: typeof FLEET === "undefined" ? [] : FLEET };
})();

// =====================================================================
// SPECIAL
// =====================================================================
const PART_SPECIAL = (() => {

// TER part: the tram-trains and the metre-gauge lines in SNCF's TER
// timetable — the Citadis Dualis of Nantes (U 53500: Nantes–Nort-sur-Erdre–
// Châteaubriant, Nantes–Clisson) and of the Ouest lyonnais (U 52500: Lyon
// Saint-Paul–Sain-Bel, –Brignais, Lozanne–Tassin), the Avanto of Mulhouse
// (U 25500, Mulhouse–Thann Saint-Jacques; the Kruth trains beyond are X
// 73500 railcars), the Train Jaune's Z 100 cars and the Mont-Blanc
// Express's Z 850. Trainsheet's own side views at the shared scale, from
// published dimensions and photographs (Wikimedia Commons 2017-2026).
// Metre-gauge cars stand on the same rail line (y = 0) as every other car.


const { TYPES, MODELS, add, addCab } = registry();
const SETS = {}, FACTS = {}, FLEET = [];
const M2F = 3.2808;
const ft = (m) => m * M2F;

// ===================== Shared marks =====================
// Simplified from the real marks as photographed on these trains (crops in
// the scratchpad's special/logos): no logo files.
let mk = 0;
// SNCF's logo (2005): heavy white italic SNCF on a box whose top edge
// runs from the high left corner and curves down to the right, its right
// side leaning in, shading from red to carmine-purple (nt_cab, tj_front);
// h its height, (x, y) its centre.
function sncfMark(c, x, y, h, { flat = null } = {}) {
  const id = `ts-sncf-sp${++mk}`, w = h * 1.9;
  const fill = flat || `url(#${id})`;
  const g = flat ? "" : `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e3261b"/><stop offset="1" stop-color="#a3175a"/></linearGradient></defs>`;
  const shape = `<path d="M-0.5 -0.5Q0.12 -0.5 0.5 -0.2L0.42 0.5L-0.5 0.5Z" fill="${fill}"/>`;
  return g + markAt(c, x, y, h, `<g transform="scale(${n(w / h)} 1)">${shape}</g>`) +
    T(c, x + h * 0.02, y - h * 0.08, h * 0.52, "SNCF", "#ffffff", { weight: 800, italic: true, family: SANS, spacing: -0.05 * h, stretch: 1.05 });
}
// The TER mark of 1998-2020: a hand-drawn "ter" — a tall t whose bar is a
// long stroke reaching out to its left, an e and an r joined, the r's tail
// sweeping off to the right (nt_cab, ly_ter, mb_logo2). (x, y): the t's
// foot; h: the t's height; region: the small capitals after it.
function terScript(c, x, y, h, fill = "#ffffff", region = null) {
  const st = (d, w) => `<path d="${d}" fill="none" stroke="${fill}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const glyph = st("M0.5 -1.05Q0.36 -0.55 0.26 -0.16Q0.22 0.02 0.44 -0.02Q0.62 -0.06 0.74 -0.18", 0.15) +
    st("M-0.3 -0.44Q0.3 -0.56 0.9 -0.58", 0.11) +
    st("M0.74 -0.18Q1.06 -0.3 1.04 -0.48Q0.96 -0.6 0.82 -0.44Q0.7 -0.22 0.86 -0.06Q1.02 0.02 1.22 -0.14Q1.28 -0.32 1.32 -0.46Q1.42 -0.4 1.62 -0.36Q1.9 -0.3 2.04 -0.1Q2.2 0.06 2.45 -0.06", 0.13);
  let s = markAt(c, x, y, h, glyph);
  if (region) s += T(c, x + h * 1.55, y + h * 0.66, h * 0.22, region, fill, { weight: 600, anchor: "start", family: NARROW });
  return s;
}
// Auvergne-Rhône-Alpes: the mountain — a stroke rising to a peak, dropping
// to a hollow and rising again before falling away, a level bar under its
// right half — in the region's blue, often in a white disc.
// (ly_reg crop): a stroke rising from the lower left into a rounded hollow
// that climbs again, the tall peak over it falling away to the right, and
// the level bar under the right half.
const AURA_MT = (ink, w = 0.1) => `<path d="M-0.4 0.22L-0.2 -0.04Q-0.04 0.2 0.12 -0.02M-0.06 -0.14L0.02 -0.32L0.38 0.12M-0.1 0.3L0.38 0.3" fill="none" stroke="${ink}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="butt"/>`;
const auraMark = (c, x, y, r, ink, bg = "#ffffff") => circle(x, y, r, bg) + markAt(c, x, y, r * 1.8, AURA_MT(ink, 0.11));
// liO (Occitanie's network): a dot, the l and the i as round-ended bars,
// a big O ring; "SERVICE PUBLIC OCCITANIE TRANSPORTS" beside it (tj_front).
function lio(c, x, y, h, fill, { strap = false } = {}) {
  const sw = h * 0.16;
  // The baseline dot pale grey, the i's dot red (tj_front).
  let s = circle(x - h * 0.6, y - h * 0.44, h * 0.08, "#d9d6cf") +
    rect(x - h * 0.4, y - h * 0.5, sw, h * 1.0, fill, 0, `rx="${n(sw / 2)}"`) + rect(x - h * 0.12, y - h * 0.5, sw, h * 0.68, fill, 0, `rx="${n(sw / 2)}"`) +
    circle(x - h * 0.12 + sw / 2, y + h * 0.36, sw * 0.6, "#b8323a") +
    circle(x + h * 0.45, y - h * 0.14, h * 0.32, "none", 0, `stroke="${fill}" stroke-width="${n(sw)}"`);
  if (strap) ["SERVICE", "PUBLIC", "OCCITANIE", "TRANSPORTS"].forEach((t, i) => (s += T(c, x - h * 0.7, y + h * 0.35 - i * h * 0.24, h * 0.17, t, fill, { weight: 600, anchor: "end", spacing: 0.02 * h })));
  return s;
}
// Occitanie (2017 mark): on a red square, in gold, the left half of the
// Occitan cross (arms with forked tips, balls at their ends) joined to the
// Catalan bars, "La Région Occitanie" under it (tj_front).
function occitanie(c, x, y, h) {
  const G = "#f2b544";
  const arm = (r) => `<g transform="rotate(${r})"><path d="M0 0L-0.06 -0.12L-0.1 -0.3L0 -0.24L0.1 -0.3L0.06 -0.12Z" fill="${G}"/>` +
    `<circle cx="-0.1" cy="-0.35" r="0.04" fill="${G}"/><circle cx="0.1" cy="-0.35" r="0.04" fill="${G}"/></g>`;
  const bars = [0, 1, 2, 3].map((i) => `<rect x="${n(0.05 + i * 0.1)}" y="${n(-0.3 + i * 0.03)}" width="0.05" height="${n(0.6 - i * 0.06)}" fill="${G}"/>`).join("");
  return rect(x - h / 2, y - h / 2, h, h * 1.05, "#c8303a", 0, `rx="${n(h * 0.03)}"`) + markAt(c, x - h * 0.08, y + h * 0.15, h * 0.62, arm(-90) + arm(0) + arm(180) + bars) +
    T(c, x, y - h * 0.2, h * 0.12, "La Région", "#ffffff", { weight: 500 }) + T(c, x, y - h * 0.34, h * 0.19, "Occitanie", "#ffffff", { weight: 600 });
}
// Centre-Val de Loire's former mark on the X 74500: the region's outline in
// white swept round by a blue arc (ba_l2 crop).
const centreMark = (c, x, y, h) => markAt(c, x, y, h, `<path d="M-0.18 -0.42L0.05 -0.36L0.12 -0.18L0.22 -0.1L0.16 0.12L0.2 0.3L0.0 0.36L-0.12 0.22L-0.24 0.18L-0.2 -0.02L-0.26 -0.2Z" fill="#ffffff"/>` +
  `<path d="M-0.3 -0.1Q-0.36 0.34 0.0 0.46Q0.24 0.5 0.3 0.3" fill="none" stroke="#3a7cd6" stroke-width="0.07"/>`);
// The X 74500's "LE BLANC ARGENT": two brush strokes, light green over
// green, the words in grey capitals on them.
function blancArgent(c, x, y, h) {
  return path(`M${n(x)} ${n(y + 0.15 * h)}L${n(x + 4.3 * h)} ${n(y + 0.25 * h)}L${n(x + 4.1 * h)} ${n(y + 0.95 * h)}L${n(x + 0.1 * h)} ${n(y + 0.85 * h)}Z`, "#a8d23a", 0, 'opacity="0.95"') +
    path(`M${n(x + 1.2 * h)} ${n(y - 0.6 * h)}L${n(x + 5.0 * h)} ${n(y - 0.55 * h)}L${n(x + 4.8 * h)} ${n(y + 0.1 * h)}L${n(x + 1.1 * h)} ${n(y)}Z`, "#3fae49", 0, 'opacity="0.95"') +
    T(c, x + 1.9 * h, y + 0.52 * h, 0.5 * h, "LE BLANC", "#5c6066", { weight: 500, family: "'Segoe Print', 'Comic Sans MS', cursive" }) +
    T(c, x + 3.6 * h, y - 0.26 * h, 0.5 * h, "ARGENT", "#5c6066", { weight: 500, family: "'Segoe Print', 'Comic Sans MS', cursive" });
}

// ===================== Citadis Dualis (U 53500, U 52500) =====================
// Alstom Citadis Dualis (2010-2013): four short articulated bodies, 42 m
// over the couplers, 2.65 m wide, 3.5 m tall; each body on its own truck;
// the floor 380 mm up throughout (fr.wikipedia "Citadis Dualis"). The end
// cars about 12.9 m with the cab, the middle ones 8.1 m (off near-broadside
// photographs at Clisson, 2016, and La Chapelle-Aulnay, 2014). One double
// door a side in each body, at its inner end in the end cars and the
// middle ones toward the train's middle; the windows in one black band.
// One pantograph, on a middle car.
const DU = { L1: ft(12.9), L2: ft(8.1), sill: 0.8, floor: 1.25, winLo: 3.7, winHi: 9.25, band: 9.25, eave: 10.7, roof: 11.3, doorW: ft(1.3), wheel: 26, wb: ft(1.8) };
// The nose (left), bottom to roof: a deep rounded bumper, the windshield
// raked back to a cap over the roof.
const NOSE_DU = [[1.3, 0.8], ["q", 0.2, 1.2, 0.2, 2.6], [0.3, 4.4], ["q", 0.5, 5.6, 1.2, 6.0], [2.6, 9.2], ["q", 3.6, 11.0, 6.0, DU.roof]];
// An end car (cab left) or a middle car (doors at its right end as drawn;
// R twins turn it round). liv: { base(g), cab(g), over(g), door }.
function dualis(c, o) {
  const L = c.L, cab = !!o.cab, liv = o.liv;
  // The door: at the end car's inner end; in the first middle car past its
  // middle, in the second near its front (Clisson, 2016).
  const dx = cab ? L - 1.2 - DU.doorW : o.second ? 1.0 : L * 0.6 - DU.doorW / 2;
  const wins = [], run = (a, b) => { const k = Math.max(1, Math.round((b - a) / 5.2)), pw = (b - a) / k; for (let i = 0; i < k; i++) wins.push([a + i * pw + 0.15, a + (i + 1) * pw - 0.15]); };
  if (cab) run(7.0, dx - 0.6); else { if (dx > 3) run(1.0, dx - 0.6); run(dx + DU.doorW + 0.6, L - 1.0); }
  const g = { L, cab, dx, wins, c, second: !!o.second };
  const paint = () => {
    let s = liv.base(g);
    // The black window band from behind the cab to the car's end.
    s += rect(cab ? 4.8 : -1, DU.winLo - 0.25, L + 2, DU.winHi - DU.winLo + 0.5, "#16181b");
    for (const [a, b] of wins) s += pane(a, DU.winLo, b - a, DU.winHi - DU.winLo, 0.25, "#0f1012");
    // The doors: glazed leaves in a frame of the door colour.
    s += rect(dx - 0.3, DU.sill + 0.15, DU.doorW + 0.6, DU.winHi + 0.2 - DU.sill, liv.door) +
      leaves(dx, DU.doorW, DU.floor - 0.1, DU.winHi - 0.1, "#1c1e21", { glass: [0.06, 0.97], gw: 0.78, r: 0.25 });
    if (cab) s += liv.cab(g) +
      // Windshield and its black surround, the cab's side window.
      path(poly([[0.9, 6.0], [2.8, 9.2], ["q", 3.8, 10.8, 6.0, 11.0], [6.6, 11.0], [6.6, 5.4], [1.6, 5.4]]), "#16181b") +
      path(poly([[1.7, 6.2], [3.3, 9.0], ["q", 4.1, 10.2, 5.6, 10.4], [5.6, 6.2]]), C.glass) + rect(2.4, 7.6, 2.8, 0.9, C.glassLight, 0, 'opacity="0.5"') +
      // The headlights in their black pod low on the nose.
      path(poly([[0.3, 3.2], ["q", 1.6, 2.9, 3.4, 3.3], [3.6, 4.4], ["q", 2.0, 4.8, 0.4, 4.5]]), "#16181b") +
      circle(1.1, 3.85, 0.28, "#e9e6d6") + circle(1.9, 3.85, 0.28, "#e9e6d6") + circle(2.7, 3.85, 0.2, "#c8102e");
    return s + (liv.over ? liv.over(g) : "");
  };
  return body(c, { sill: DU.sill, roof: DU.roof, nose: cab ? NOSE_DU : null, x0: 0.25, x1: L - 0.25, base: liv.color, endR: 0.6, ends: [DU.floor, DU.eave - 0.4], paint,
    // Each body on its own truck, hidden behind the skirt but for the wheels' lower part.
    under: () => truck(cab ? L * 0.55 : L / 2, { wb: DU.wb, d: DU.wheel, top: DU.sill + 0.2 }) + (cab ? (c.coupledL ? coupledCouplers(2.0) : autoCoupler(1.3, 2.0)) : ""),
    top: () => (cab ? fairing(7.2, L - 9.0, DU.roof, 0.55, "#5c6168", 3) : (o.pan ? panGear(L / 2, DU.roof + 0.1, { dir: -1 }) : fairing(1.5, L - 3.0, DU.roof, 0.5, "#5c6168", 2))) });
}

// --- Nantes (U 53500, TER Pays de la Loire; TT 115, 120, 122 at Nantes,
// Clisson and Châteaubriant, 2016-2026): the region's first tram-train
// paint, on all 24: the cab turquoise; the body light grey below the
// windows; over them a band, grey on the end cars with "CONSEIL RÉGIONAL
// DES PAYS DE LA LOIRE" in dark grey, magenta beyond; a magenta panel
// round each door; narrow lime-and-yellow and turquoise-and-yellow
// stripes; "Région PAYS DE LA LOIRE" with the region's blue and yellow
// brackets low on the end car; "ter PAYS DE LA LOIRE" and SNCF's mark on
// the cab.
const NT = { turq: "#20aee3", grey: "#a9adb1", band: "#bfc2c5", magenta: "#9b2a6e", lime: "#cddc29", yellow: "#f5d31a", blue: "#2a73c2", ink: "#4a4e53" };
const stripePair = (x, a, b, y0, y1) => rect(x, y0, 0.5, y1 - y0, a) + rect(x + 0.5, y0, 0.45, y1 - y0, b);
const LIV_NT = {
  color: NT.grey, door: NT.magenta,
  base: (g) => {
    const { L, cab, dx, second } = g;
    let s = rect(-1, 0, L + 2, 20, NT.grey) + rect(-1, DU.band, L + 2, 4, cab ? NT.band : NT.magenta) + rect(-1, DU.eave, L + 2, 2, "#8f2463");
    if (cab) return s + rect(dx - 3.4, DU.band, L, 4, NT.magenta) + stripePair(dx - 4.3, NT.lime, NT.yellow, DU.band, DU.eave) + stripePair(dx - 1.6, NT.lime, NT.yellow, DU.sill, DU.winLo) +
      rect(dx - 0.65, DU.sill, L, DU.winLo - DU.sill, NT.magenta);
    if (!second) {
      // The first middle car: the band magenta ahead of the stripes, grey
      // behind; below, magenta from the stripes to past the door.
      const x = dx - 3.0;
      return s + rect(x + 0.95, DU.band, L, DU.eave - DU.band, NT.band) + stripePair(x, NT.yellow, NT.turq, DU.sill, DU.eave) +
        rect(x + 0.95, DU.sill, dx + DU.doorW + 0.5 - x - 0.95, DU.winLo - DU.sill, NT.magenta);
    }
    // The second: magenta round the door at its front, the stripes behind it.
    return s + rect(-1, DU.sill, dx + DU.doorW + 1.4, DU.winLo - DU.sill, NT.magenta) + stripePair(dx + DU.doorW + 0.4, NT.turq, NT.yellow, DU.sill, DU.eave);
  },
  cab: (g) => path(`M-1 0L14.0 0L14.0 ${DU.winLo - 0.25}L5.0 ${DU.winLo - 0.25}L5.0 ${DU.band}L18.5 ${DU.band}L20.5 14L-1 14Z`, NT.turq) +
    T(g.c, 21.0, 10.0, 0.62, "CONSEIL RÉGIONAL DES PAYS DE LA LOIRE", NT.ink, { weight: 700, family: NARROW, anchor: "start", stretch: 0.92 }) +
    rect(8.3, 1.3, 2.0, 2.1, "rgba(255,255,255,0.1)", 0, 'rx="0.06" stroke="rgba(20,30,40,0.6)" stroke-width="0.04"') + sncfMark(g.c, 9.3, 2.8, 0.82) +
    terScript(g.c, 8.25, 1.1, 0.95) + T(g.c, 10.0, 1.5, 0.32, "PAYS DE", "#ffffff", { weight: 700, anchor: "start", family: NARROW }) + T(g.c, 10.25, 1.12, 0.32, "LA LOIRE", "#ffffff", { weight: 700, anchor: "start", family: NARROW }),
  over: (g) => g.cab ? path(`M${n(g.dx - 15.2)} 1.6Q${n(g.dx - 15.8)} 2.4 ${n(g.dx - 15.2)} 3.2`, "none", 0, `stroke="${NT.yellow}" stroke-width="0.28"`) +
    path(`M${n(g.dx - 15.6)} 1.5Q${n(g.dx - 16.3)} 2.4 ${n(g.dx - 15.6)} 3.3`, "none", 0, `stroke="${NT.blue}" stroke-width="0.28"`) +
    T(g.c, g.dx - 14.6, 2.95, 0.32, "Région", NT.blue, { weight: 500, anchor: "start" }) + T(g.c, g.dx - 14.6, 2.15, 0.62, "PAYS DE LA LOIRE", NT.blue, { weight: 600, family: NARROW, anchor: "start" }) : "",
};
// --- Ouest lyonnais (U 52500, TER Auvergne-Rhône-Alpes; TT 206, 209,
// 212, 214 at Lyon Saint-Paul, Brignais, Casino Lacroix-Laval, 2020-2023):
// repainted 2020-2021 in the region's sky blue all over, the windows black;
// over them on each body "LA RÉGION VOUS TRANSPORTE" in white capitals; a
// big white panel with the region's mountain in blue over the joints; "La
// Région / Auvergne-Rhône-Alpes" with its disc in white, low; the cab
// solid blue with "ter" and SNCF's mark.
const LY = { sky: "#1f9ee3", ink: "#1f6fc0" };
const LIV_LY = {
  color: LY.sky, door: LY.sky,
  base: (g) => rect(-1, 0, g.L + 2, 20, LY.sky),
  cab: () => "",
  over: (g) => {
    const { L, cab, dx } = g;
    const MT = AURA_MT(LY.ink, 0.1);
    let s = cab ? terScript(g.c, 7.9, 7.0, 0.95) + sncfMark(g.c, 9.4, 5.9, 0.6) : "";
    s += T(g.c, cab ? 24.5 : L / 2 - 1.5, 10.0, 0.95, "LA RÉGION VOUS TRANSPORTE", "#ffffff", { weight: 600, family: NARROW, spacing: "0.03em", stretch: 0.85 });
    // Below the windows a white panel with the mountain (Brignais, 2022),
    // and a big white disc cut by the roof's edge with it again.
    const px = cab ? 13.0 : dx > 6 ? 1.2 : dx + DU.doorW + 1.2;
    // the big white disc, cut by the window band (ly_reg, Brignais 2022)
    const cid = `lyl${++mk}`;
    s += `<clipPath id="${cid}"><rect x="-1" y="${DU.sill}" width="${n(L + 2)}" height="${n(DU.winLo - 0.25 - DU.sill)}"/></clipPath>` +
      `<g clip-path="url(#${cid})">${circle(px + 3.0, 2.6, 3.1, "#ffffff")}${markAt(g.c, px + 3.0, 2.4, 2.6, MT)}</g>`;
    if (!cab) s += `<clipPath id="lyc${++mk}"><rect x="-1" y="${DU.band}" width="${n(L + 2)}" height="3"/></clipPath>` +
      `<g clip-path="url(#lyc${mk})">${circle(L - 4.2, 10.4, 2.6, "#ffffff")}${markAt(g.c, L - 4.2, 10.9, 2.0, MT)}</g>`;
    const tx = cab ? 21.0 : px + 6.8;
    if (tx + 9 < (cab ? dx : L)) s += auraMark(g.c, tx + 0.6, 2.3, 0.7, LY.sky) + T(g.c, tx + 1.6, 2.6, 0.85, "La Région", "#ffffff", { weight: 700, anchor: "start" }) +
      T(g.c, tx + 1.6, 1.6, 0.6, "Auvergne-Rhône-Alpes", "#ffffff", { weight: 500, anchor: "start" });
    return s;
  },
};
function dualisFamily(p, name, liv) {
  addCab(`${p}Cab`, `${name} end car`, (c) => dualis(c, { cab: true, liv }), DU.L1);
  add(`${p}Mid`, `${name} middle car`, (c) => dualis(c, { liv, pan: true }), DU.L2, { pan: true });
  add(`${p}Mid2`, `${name} middle car`, (c) => dualis(c, { liv, second: true }), DU.L2);
}
dualisFamily("terDuNt", "Citadis Dualis (U 53500), tram-train Nantes", LIV_NT);
dualisFamily("terDuLy", "Citadis Dualis (U 52500), tram-train Ouest lyonnais", LIV_LY);
SETS.dualis_nantes = set("Citadis Dualis tram-train (U 53500), TER Pays de la Loire", ["terDuNtCab", 1], ["terDuNtMid", 1], ["terDuNtMid2", 1], ["terDuNtCabR", 1]);
SETS.dualis_lyon = set("Citadis Dualis tram-train (U 52500), TER Auvergne-Rhône-Alpes", ["terDuLyCab", 1], ["terDuLyMid", 1], ["terDuLyMid2", 1], ["terDuLyCabR", 1]);

// ===================== Avanto (U 25500, Mulhouse) =====================
// Siemens Avanto S70 (2010), 12 units for the tram-train Mulhouse–Vallée de
// la Thur (TT 16-27; 11 since 2024): 36.97 m, 2.65 m wide, 3.52 m tall,
// five modules on four trucks (Bo'+2'+0'+2'+Bo': the cab modules on motor
// trucks, the next ones on trailer trucks, the middle module carried
// between them), five double doors a side (fr.wikipedia "Siemens Avanto").
// Module lengths off photographs (TT 20 at Mulhouse Gare Centrale, TT 23
// at Thann Saint-Jacques, 2025): cab module 9.2 m, next 7.3 m, middle 4.0
// m. Paint (Mulhouse tram's and TER Alsace's, 2010): silver; the lower nose
// and a panel along the cab module's foot blue; blue along the roof's edge
// of the passenger modules; blue doors.
const AV = { Lc: ft(9.2), Ln: ft(7.3), Lm: ft(4.0), sill: 0.9, floor: 1.15, winLo: 3.9, winHi: 9.0, eave: 10.0, roof: 11.55, doorW: ft(1.3), wheel: 26 };
const AVC = { silver: "#c3c7cb", blue: "#2c3fa6", ink: "#2a2d31" };
const NOSE_AV = [[1.5, 0.9], ["q", 0.3, 1.3, 0.3, 2.8], [0.4, 4.2], ["q", 0.6, 5.2, 1.0, 5.6], [2.0, 9.8], ["q", 2.8, 11.4, 5.4, AV.roof]];
function avanto(c, kind, o = {}) {
  const L = c.L, cab = kind === "cab";
  const doors = kind === "next" ? [1.4, L - 1.4 - AV.doorW] : kind === "mid" ? [(L - AV.doorW) / 2] : [];
  const paint = () => {
    let s = rect(-1, 0, L + 2, 20, AVC.silver);
    if (!cab) s += rect(-1, AV.eave + 0.2, L + 2, 4, AVC.blue);
    else s += rect(-1, AV.eave + 0.6, L + 2, 4, "#b4b9be") + path(`M-1 0L-1 4.3Q4.0 4.2 7.0 3.9Q9.4 3.7 10.6 3.4L10.6 0Z`, AVC.blue) +
      line(5.4, 0.9, 5.4, 4.05, "rgba(0,0,0,0.3)", 0.5) + rect(12.4, AV.sill + 0.1, 10.0, 1.3, AVC.blue, 0, 'rx="0.2"');
    // Windows: in the cab module two big panes behind the cab's side window.
    const wins = cab ? [[13.4, 19.6], [20.0, 27.6]] : kind === "next" ? [[1.4 + AV.doorW + 0.8, L - 2.2 - AV.doorW]] : [];
    for (const [a, b] of wins) s += rect(a - 0.35, AV.winLo - 0.35, b - a + 0.7, AV.winHi - AV.winLo + 0.7, AVC.ink, 0, 'rx="0.3"') + pane(a, AV.winLo, b - a, AV.winHi - AV.winLo, 0.2, "#16181b");
    for (const x of doors) s += leaves(x, AV.doorW, AV.floor, AV.winHi + 0.3, AVC.blue, { glass: [0.18, 0.9], gw: 0.55, r: 0.25 });
    if (cab) s += path(poly([[0.7, 5.6], [1.4, 9.0], ["q", 2.2, 11.0, 4.6, 11.1], [4.6, 5.0], [1.4, 5.0]]), "#1b1d20") +
      path(poly([[1.4, 5.9], [2.0, 9.0], ["q", 2.6, 10.5, 4.2, 10.6], [4.2, 5.9]]), C.glass) +
      // The cab's side window: tall, its front edge curved.
      path(poly([[5.2, 4.4], [5.2, 9.8], ["q", 5.6, 10.9, 7.4, 10.9], [10.4, 10.9], ["q", 11.0, 10.9, 11.0, 10.2], [10.6, 4.4]]), "#1b1d20") + pane(5.7, 4.9, 4.5, 5.4, 0.8, "#0f1012") +
      path(poly([[0.5, 4.5], ["q", 2.5, 4.1, 5.0, 4.4], [5.0, 5.2], ["q", 2.5, 5.4, 0.7, 5.3]]), "#16181b") + circle(1.4, 4.85, 0.25, "#e9e6d6") + circle(2.3, 4.85, 0.25, "#d23a35") + circle(3.2, 4.85, 0.25, "#e9e6d6") +
      rect(11.5, 7.3, 0.6, 0.7, "#e98a2b", 0, 'rx="0.1"');
    return s;
  };
  const truckAt = cab ? L * 0.62 : kind === "next" ? L - 1.0 : null;
  return body(c, { sill: AV.sill, roof: AV.roof, nose: cab ? NOSE_AV : null, x0: 0.25, x1: L - 0.25, base: AVC.silver, endR: 0.5, ends: [AV.floor, AV.eave - 0.3], paint,
    under: () => (truckAt != null ? truck(truckAt, { wb: ft(1.8), d: AV.wheel, top: AV.sill + 0.2 }) : "") + (cab ? (c.coupledL ? coupledCouplers(2.0) : autoCoupler(1.5, 2.0)) : ""),
    top: () => cab ? fairing(13.0, L - 14.5, AV.roof, 0.6, "#8b9198", 3) : kind === "next" && o.pan ? panGear(L - 5.0, AV.roof + 0.1, { dir: -1 }) + fairing(1.0, 9.0, AV.roof, 0.5, "#8b9198", 2) :
      fairing(0.8, L - 1.6, AV.roof, 0.45, "#8b9198", 2) });
}
addCab("terAvCab", "Avanto tram-train (U 25500), Mulhouse, cab module", (c) => avanto(c, "cab"), AV.Lc);
add("terAvNext", "Avanto tram-train (U 25500), Mulhouse, passenger module (pantograph)", (c) => avanto(c, "next", { pan: true }), AV.Ln, { pan: true });
add("terAvNextR", "Avanto tram-train (U 25500), Mulhouse, passenger module", (c) => facingRight(c, (m) => avanto(m, "next")), AV.Ln);
add("terAvMid", "Avanto tram-train (U 25500), Mulhouse, middle module", (c) => avanto(c, "mid"), AV.Lm);
SETS.avanto_mulhouse = set("Avanto tram-train (U 25500), Mulhouse–Thann (TER Grand Est)", ["terAvCab", 1], ["terAvNext", 1], ["terAvMid", 1], ["terAvNextR", 1], ["terAvCabR", 1]);

// ===================== Train Jaune (Z 100) =====================
// The Ligne de Cerdagne's cars (1910-1912, rebuilt 1963-1968 and
// 1984-1988; metre gauge, 850 V third rail): the Z 100 motor cars with a
// cab at each end, about 15 m (not published; from photographs of Z 108
// and 109 at Fontpédrouse, 2017, and Z 106 at Villefranche, 2026); the
// closed trailers (ZRBDq 20001-20004 "Midi", ZRBq "Nord") and in summer
// the open cars (ZRBX 20030-20034). Yellow with a red foot and red lining
// in panels, the roof brown; in 2026 lettered liO with the Occitanie and
// SNCF Voyageurs marks (they were "Vivre en Languedoc-Roussillon").
const TJ = { L: ft(14.384), Lt: ft(13.6), Lo: ft(13.6), sill: 2.6, floor: 3.3, winLo: 6.0, winHi: 8.9, eave: 9.55, roof: 10.5, yellow: "#f0b81c", red: "#d7262b", roof_: "#6b4a3a", wheel: 30 };
// The red lining: a panel outline (x0..x1, y0..y1) with incurved corners.
const lining = (x0, x1, y0, y1) => rect(x0, y0, x1 - x0, y1 - y0, "none", 0, `rx="0.5" stroke="${TJ.red}" stroke-width="0.14"`);
function tjCar(c, kind) {
  const L = c.L, motor = kind === "motor", open = kind === "open";
  const paint = () => {
    let s = rect(-1, 0, L + 2, 20, TJ.yellow) + rect(-1, TJ.sill, L + 2, 1.15, TJ.red) + rect(-1, TJ.eave - 0.35, L + 2, 0.35, TJ.red) + rect(-1, TJ.eave, L + 2, 3, TJ.roof_);
    if (open) {
      // The open car: a waist-high side, the railing over it, the roofless
      // body showing the seat backs.
      s += lining(1.2, L - 1.2, TJ.sill + 1.4, 6.6);
      return s;
    }
    if (motor) {
      // A cab at each end (from the side its narrow window), the entrance
      // behind each cab, two windows, a narrow door, three windows (Z 108,
      // Fontpédrouse 2017; Z 106, Villefranche 2026).
      for (const x of [0.4, L - 2.2]) s += pane(x, TJ.winLo - 0.4, 1.8, TJ.winHi - TJ.winLo + 0.6, 0.2, "#3b2a1e");
      for (const [x, w] of [[2.9, 2.8], [L - 5.7, 2.8], [15.4, 1.9]]) s += rect(x, TJ.sill + 0.3, w, TJ.winHi + 0.3 - TJ.sill, TJ.yellow, 0, `stroke="rgba(120,40,20,0.55)" stroke-width="0.12"`) +
        pane(x + w / 2 - 0.55, TJ.winLo - 0.4, 1.1, TJ.winHi - TJ.winLo + 0.4, 0.2, "#3b2a1e");
      for (const x of [6.6, 10.7, 18.4, 22.4, 26.4, 30.4, 34.4, 38.4]) if (x + 3.2 < L - 6.0) s += pane(x, TJ.winLo, 3.2, TJ.winHi - TJ.winLo, 0.3, "#3b2a1e");
      s += lining(6.3, 15.0, TJ.sill + 1.0, TJ.winLo - 0.55) + lining(17.8, L - 6.3, TJ.sill + 1.0, TJ.winLo - 0.55);
      s += lio(c, 25.0, 4.6, 1.2, "#3a3b3f", { strap: true }) + occitanie(c, 28.0, 4.5, 1.25) + sncfMark(c, 11.0, 4.5, 1.1);
      return s;
    }
    // A closed trailer: doors at each end, windows between.
    for (const x of [0.8, L - 3.5]) s += rect(x, TJ.sill + 0.5, 2.7, TJ.winHi + 0.4 - TJ.sill, TJ.yellow, 0, `stroke="${TJ.red}" stroke-width="0.12"`) + pane(x + 0.6, TJ.winLo, 1.5, TJ.winHi - TJ.winLo, 0.2, "#3b2a1e");
    for (const x of seq(5.0, 3.6, Math.floor((L - 9.0) / 3.6))) s += pane(x, TJ.winLo, 2.8, TJ.winHi - TJ.winLo, 0.25, "#3b2a1e");
    s += lining(4.4, L - 4.4, TJ.sill + 1.4, TJ.winLo - 0.5) + lio(c, L / 2 + 1.0, 4.6, 1.2, "#3a3b3f", { strap: true });
    return s;
  };
  const roofY = open ? 7.0 : TJ.roof;
  const d = open ? null : null;
  let s = body(c, { sill: TJ.sill, roof: roofY, x0: 0.3, x1: L - 0.3, base: TJ.yellow, endR: open ? 0.2 : 0.6, ends: [TJ.floor, roofY - 0.6], paint,
    under: () => truck(L / 2 - ft(4.25), { wb: ft(1.9), d: TJ.wheel, top: TJ.sill }) + truck(L / 2 + ft(4.25), { wb: ft(1.9), d: TJ.wheel, top: TJ.sill }) + cases(L * 0.32, L * 0.68, TJ.sill, 2, 0.9, "#3a3c40") +
      // The third-rail shoe beam on the motor cars' trucks.
      (motor ? rect(L / 2 - ft(4.25) - 3.6, 0.55, 1.1, 0.3, "#2a2d31") + rect(L / 2 + ft(4.25) + 2.5, 0.55, 1.1, 0.3, "#2a2d31") : "") +
      // Central buffer-coupler, chain links.
      rect(-0.2, 2.95, 0.8, 0.55, "#2a2d31") + rect(L - 0.6, 2.95, 0.8, 0.55, "#2a2d31"),
    top: () => (open ? "" : rect(0.6, TJ.roof - 0.05, L - 1.2, 0.35, TJ.roof_, 0.4, 'rx="0.15"') + seq(2.0, 2.6, Math.floor((L - 3) / 2.6)).map((x) => rect(x, TJ.roof + 0.25, 0.7, 0.3, "#5a4033", 0, 'rx="0.12"')).join("")) });
  if (open) {
    // The railing along the open car's side, its posts, the canvas-less top.
    s += rect(0.4, 7.0, L - 0.8, 0.22, TJ.yellow, 0.4) + lines(seq(1.2, 1.15, Math.floor((L - 2) / 1.15)).map((x) => [x, 6.6, x, 7.0]), TJ.yellow, 1.2) +
      lines(seq(1.2, 1.15, Math.floor((L - 2) / 1.15)).map((x) => [x, 6.6, x, 7.0]), "rgba(0,0,0,0.35)", 0.4) +
      rect(0.3, 2.8, 0.5, 5.4, TJ.yellow, 0.4) + rect(L - 0.8, 2.8, 0.5, 5.4, TJ.yellow, 0.4) +
      // The benches' backs over the side, end to end.
      seq(2.0, 3.0, Math.floor((L - 3) / 3.0)).map((x) => rect(x, 7.25, 2.2, 0.75, "#c99a1a", 0.3, 'rx="0.2"')).join("");
  }
  if (motor) {
    // The headlights on the cab fronts' corners, seen from the side.
    s += rect(-0.15, 5.0, 0.45, 0.8, "#c9a21c", 0.3, 'rx="0.2"') + rect(L - 0.3, 5.0, 0.45, 0.8, "#c9a21c", 0.3, 'rx="0.2"');
  }
  return s;
}
add("terTjZ100", "Z 100 motor car, Train Jaune", (c) => tjCar(c, "motor"), TJ.L, { kind: "emu" });
add("terTjTrailer", "Train Jaune closed trailer (ZRBq)", (c) => tjCar(c, "trailer"), TJ.Lt, { kind: "coach" });
add("terTjOpen", "Train Jaune open car (ZRBX, summer)", (c) => tjCar(c, "open"), TJ.Lo, { kind: "coach" });
SETS.trainjaune = set("Train Jaune: Z 100 motor cars and trailers (liO, TER Occitanie)", ["terTjZ100", 1], ["terTjTrailer", 1], ["terTjZ100", 1]);
SETS.trainjaune_summer = set("Train Jaune in summer: Z 100 motor cars, trailers and the open cars (liO, TER Occitanie)",
  ["terTjZ100", 1], ["terTjOpen", 1], ["terTjZ100", 1], ["terTjTrailer", 1], ["terTjZ100", 1]);

// ===================== Mont-Blanc Express (Z 850) =====================
// Stadler Z 850 (2005-2008), six units for Saint-Gervais-Le Fayet–
// Chamonix–Vallorcine (metre gauge, 850 V third rail and a pantograph for
// the Le Fayet–Chedde overhead section): three bodies, 40.878 m, 3.62 m
// tall; the motor car in the middle on two trucks, the end cars each on
// one truck at the cab and carried by the motor car at the other; floor
// 710 mm low between the trucks; second class only (de.wikipedia "SNCF Z
// 850"). Paint (Z 850 55/56 at Le Fayet, 2024-2026; Les Bossons 2026):
// red; a cream band round the roof's edge and a white one low along the
// side through the headlights; white doors; SNCF and "ter" on the cab.
const ZB = { Le: ft(14.2), Lm: ft(12.48), sill: 1.1, floor: 2.33, winLo: 4.9, winHi: 8.6, eave: 10.6, roof: 11.9, red: "#d8262b", cream: "#d9d2c3", wheel: 30 };
const NOSE_ZB = [[0.6, 1.1], [0.6, 3.2], [1.1, 4.4], [3.0, 10.7], ["q", 3.4, ZB.roof, 4.8, ZB.roof]];
function zbCar(c, kind) {
  const L = c.L, cab = kind === "cab";
  const paint = () => {
    let s = rect(-1, 0, L + 2, 20, ZB.red) + rect(-1, ZB.eave, L + 2, 4, ZB.cream) + rect(-1, 3.0, L + 2, 0.75, "#f3f1ec");
    if (cab) {
      // The windshield, the crew door behind it, three windows (one long),
      // the white double door near the joint, a small window after it.
      s += path(poly([[1.3, 5.0], [2.9, 10.4], [5.2, 10.4], ["q", 5.6, 10.4, 5.6, 10.0], [5.6, 5.4], ["q", 5.6, 5.0, 5.2, 5.0]]), "#1d1f22") + pane(3.3, 5.5, 1.9, 4.4, 0.35, "#0f1012") +
        rect(6.0, ZB.floor + 0.4, 2.3, ZB.winHi + 0.4 - ZB.floor, "none", 0, `rx="0.3" stroke="rgba(0,0,0,0.4)" stroke-width="0.5" ${STROKE}`) + pane(6.6, 5.6, 1.1, 3.0, 0.4, "#0f1012");
      for (const [a, b] of [[10.0, 14.6], [14.9, 22.8], [23.1, 27.3]]) s += pane(a, ZB.winLo, b - a, ZB.winHi - ZB.winLo, 0.4, "#141518");
      s += leaves(31.5, ft(1.3), ZB.floor - 0.1, ZB.winHi + 0.3, "#e9e7e2", { glass: [0.3, 0.88], gw: 0.5, r: 0.3 }) + pane(37.2, ZB.winLo, 2.4, ZB.winHi - ZB.winLo, 0.4, "#141518");
      s += circle(1.2, 3.38, 0.25, "#e9e6d6") + circle(1.8, 3.38, 0.25, "#e9e6d6") + bikeSign(c, 33.6, 9.8, 0.7);
      // As lettered (mb_logo2): SNCF in white letters on a faint purple
      // patch, the "ter" hand, RHÔNE-ALPES small beside it.
      s += rect(10.0, 3.85, 1.15, 1.0, "#8e2a52", 0, 'opacity="0.35"') + T(c, 10.35, 4.25, 0.48, "SNCF", "#f3f1ec", { weight: 600, italic: true, family: NARROW, spacing: -0.02 }) +
        terScript(c, 11.6, 4.0, 0.82, "#f3f1ec", "RHÔNE-ALPES");
    } else {
      // The motor car: tall windows along its length (the panoramic car),
      // no doors.
      for (const x of seq(1.6, 4.3, 9)) s += pane(x, ZB.winLo, 3.6, ZB.winHi + 0.9 - ZB.winLo, 0.4, "#141518") + pane(x + 0.2, ZB.eave + 0.15, 3.2, 0.75, 0.2, "#141518");
    }
    return s;
  };
  const trucks = cab ? [7.6] : [8.5, L - 8.5];
  return body(c, { sill: ZB.sill, roof: ZB.roof, nose: cab ? NOSE_ZB : null, x0: 0.3, x1: L - 0.3, base: ZB.red, endR: 0.8, ends: [ZB.floor, ZB.eave - 0.4], paint,
    bottom: cab ? null : [[0.3, ZB.sill + 0.8], [L - 0.3, ZB.sill + 0.8]],
    under: () => trucks.map((x) => truck(x, { wb: ft(2.0), d: ZB.wheel, top: ZB.sill + (cab ? 0.1 : 0.9), kind: cab ? "car" : "loco" })).join("") +
      (cab ? (c.coupledL ? coupledCouplers(2.4) : autoCoupler(0.9, 2.4) + rect(1.0, 0.9, 1.6, 1.5, "#2a2d31", 0, 'rx="0.2"')) : cases(L * 0.3, L * 0.7, ZB.sill + 0.8, 2, 0.8)) +
      (cab ? "" : rect(8.5 - 3.4, 0.5, 1.0, 0.3, "#2a2d31") + rect(L - 8.5 + 2.4, 0.5, 1.0, 0.3, "#2a2d31")),
    top: () => (cab ? fairing(6.0, 12.0, ZB.roof, 0.55, "#8b9198", 3) : panGear(L / 2, ZB.roof + 0.1, { dir: -1 }) + fairing(1.5, 10.0, ZB.roof, 0.7, "#8b9198", 3) + fairing(L - 11.5, 10.0, ZB.roof, 0.7, "#8b9198", 3)) });
}
function bikeSign(c, x, y, h, color = "#ffffff") {
  const r = h * 0.28, st = `fill="none" stroke="${color}" stroke-width="${n(h * 0.09)}"`;
  return `<g transform="translate(${n(x)} ${n(y)})"><circle cx="${n(-h * 0.42)}" cy="${n(-h * 0.2)}" r="${n(r)}" ${st}/><circle cx="${n(h * 0.42)}" cy="${n(-h * 0.2)}" r="${n(r)}" ${st}/>` +
    `<path d="M${n(-h * 0.42)} ${n(-h * 0.2)}L${n(-h * 0.1)} ${n(h * 0.25)}L${n(h * 0.3)} ${n(h * 0.25)}L${n(h * 0.42)} ${n(-h * 0.2)}" ${st}/></g>`;
}
addCab("terZ850Cab", "Z 850 end car with cab, Mont-Blanc Express", (c) => zbCar(c, "cab"), ZB.Le);
add("terZ850Mot", "Z 850 motor car, Mont-Blanc Express", (c) => zbCar(c, "motor"), ZB.Lm, { pan: true });
SETS.montblanc = set("Z 850 (Stadler), three cars, Mont-Blanc Express (TER Auvergne-Rhône-Alpes)", ["terZ850Cab", 1], ["terZ850Mot", 1], ["terZ850CabR", 1]);
SETS.montblanc2 = set("Two Z 850 coupled, Mont-Blanc Express", ["terZ850Cab", 1], ["terZ850Mot", 1], ["terZ850CabR", 1], ["terZ850Cab", 1], ["terZ850Mot", 1], ["terZ850CabR", 1]);

// ===================== Facts =====================
const FRW = "https://fr.wikipedia.org/wiki/";
const DUF = { model: "Alstom Citadis Dualis", type: "Tram-train (electric)", builder: "Alstom", built: "2010–2013", topSpeedMph: 62, source: `${FRW}Citadis_Dualis` };
const fact = (keys, f) => keys.forEach((k) => (FACTS[k] = f));
fact(["terDuNtCab", "terDuNtCabR", "terDuNtMid", "terDuNtMid2"], { ...DUF, model: "Alstom Citadis Dualis (U 53500)", fleet: "24 units", lengthFt: 137.8,
  about: "Nantes's tram-trains, TER Pays de la Loire: Nantes–Nort-sur-Erdre–Châteaubriant and Nantes–Clisson, in the region's turquoise, grey and magenta." });
fact(["terDuLyCab", "terDuLyCabR", "terDuLyMid", "terDuLyMid2"], { ...DUF, model: "Alstom Citadis Dualis (U 52500)", fleet: "24 units", lengthFt: 137.8,
  about: "The tram-train de l'Ouest lyonnais, TER Auvergne-Rhône-Alpes: Lyon Saint-Paul–Sain-Bel, –Brignais and Tassin–Lozanne, in the region's sky blue." });
fact(["terAvCab", "terAvCabR", "terAvNext", "terAvNextR", "terAvMid"], { model: "Siemens Avanto S70 (U 25500)", type: "Tram-train (electric, 750 V DC and 25 kV)", builder: "Siemens", built: "2009–2010",
  fleet: "12 for Mulhouse (11 since 2024)", topSpeedMph: 62, lengthFt: 121.3, source: `${FRW}Siemens_Avanto`,
  about: "The tram-train Mulhouse–Thann: through Mulhouse's streets as a tram, then on the SNCF line to Thann Saint-Jacques." });
fact(["terTjZ100"], { model: "Z 100 (SNCF)", type: "Metre-gauge electric motor car (850 V third rail)", builder: "SACM, Carde", built: "1910–1912, rebuilt 1984–1988", fleet: "13", topSpeedMph: 37,
  source: `${FRW}Train_jaune`, about: "The Train Jaune's motor cars, a cab at each end, on the Ligne de Cerdagne from Villefranche-Vernet-les-Bains up to Latour-de-Carol." });
fact(["terTjTrailer"], { model: "Train Jaune trailer (ZRBq / ZRBDq)", type: "Metre-gauge coach", built: "1910s", source: `${FRW}Train_jaune`, about: "A closed trailer of the Train Jaune." });
fact(["terTjOpen"], { model: "Train Jaune open car (ZRBX 20030–20034)", type: "Metre-gauge open coach", builder: "Carde", built: "1912", fleet: "5", source: `${FRW}Train_jaune`,
  about: "The roofless cars the Train Jaune adds in summer." });
fact(["terZ850Cab", "terZ850CabR", "terZ850Mot"], { model: "Stadler Z 850", type: "Metre-gauge electric multiple unit", builder: "Stadler Rail", built: "2005–2008", fleet: "6", topSpeedMph: 43, lengthFt: 134.1,
  source: "https://de.wikipedia.org/wiki/SNCF_Z_850", about: "The Mont-Blanc Express from Saint-Gervais-Le Fayet to Chamonix and Vallorcine: an end car with the cab at each end and the motor car between." });

// ===================== Blanc-Argent (X 74500) =====================
// CFD X 74500 (2001-2002), five articulated two-car railcars for the
// metre-gauge Salbris–Romorantin–Valençay line (TER Centre-Val de Loire),
// the only stock allowed on it since 2016 (the Verney X 241 stored at
// Romorantin): 26.24 m, a long car of 16.01 m and a short one of 10.23 m,
// each with a cab; three trucks, the motor truck under the joint; 2.583 m
// wide, 3.5 m tall; two doors a side in the long car, two (normally
// locked) in the short (fr.wikipedia "X 74500"). Still in the 1998 TER
// paint (X 74501, 74502, 74505 at Salbris, Romorantin and Valençay,
// 2019-2024): the cab ends deep blue, the sides metallic grey with the
// windows in a dark grey band, the roof grey; SNCF on the cab's flank,
// "ter" and the line's green-and-yellow brush mark "Le Blanc Argent".
const BA = { Ll: ft(16.01), Ls: ft(10.23), sill: 2.2, floor: 3.0, winLo: 5.6, winHi: 9.3, eave: 10.0, roof: 11.5, blue: "#232f8f", grey: "#8b9096", band: "#3f444b", doorW: ft(1.1) };
const NOSE_BA = [[0.6, 2.2], [0.5, 4.8], [1.2, 9.6], ["q", 1.6, BA.roof, 3.6, BA.roof]];
function baCar(c, long) {
  const L = c.L, doors = long ? [10.0, L - 4.6] : [L - 4.4];
  const wins = long ? [[4.6, 9.4], [14.2, 19.0], [19.4, 24.2], [24.6, 29.4], [29.8, 34.6], [35.0, 39.8]] : [[4.6, 9.4], [9.8, 14.6], [15.0, 19.8], [20.2, 24.8], [25.2, 28.6]];
  const paint = () => {
    let s = rect(-1, 0, L + 2, 20, BA.grey) + rect(-1, BA.eave + 0.2, L + 2, 4, "#a9aeb3") + rect(-1, BA.sill, L + 2, 0.9, "#5a5f66");
    // The blue cab: over the front and back along the side past the cab door.
    s += path(`M-1 0L-1 14L3.9 14L3.9 ${BA.eave + 0.2}Q4.2 7.0 3.7 ${BA.sill + 0.9}L3.7 0Z`, BA.blue);
    s += rect(4.3, BA.winLo - 0.4, L - 4.3 + 1, BA.winHi - BA.winLo + 0.8, BA.band);
    for (const [a, b] of wins) if (b < L - 0.8) s += pane(a, BA.winLo, b - a, BA.winHi - BA.winLo, 0.3, "#16181b");
    for (const x of doors) s += leaves(x, BA.doorW + 0.4, BA.floor, BA.winHi + 0.5, "#9da2a8", { glass: [0.3, 0.9], gw: 0.5, r: 0.25 });
    // Windshield (edge-on), the cab's side window and door.
    s += path(poly([[0.7, 5.3], [1.3, 9.5], ["q", 1.7, 10.6, 3.2, 10.6], [3.2, 5.3]]), "#1b1d20");
    if (long) s += rect(L - 9.8, BA.sill + 1.2, 1.6, BA.winHi - BA.sill - 1.0, "#6f747a") + slats(L - 9.8, BA.sill + 1.2, 1.6, BA.winHi - BA.sill - 1.0, 0.22, "rgba(0,0,0,0.45)");
    s += circle(1.0, 4.2, 0.28, "#e9e6d6") + circle(1.0, 3.5, 0.22, "#c8102e");
    s += sncfMark(c, 2.7, 6.6, 0.85);
    if (long) s += terScript(c, 6.0, 3.3, 1.0, BA.blue, "CENTRE") + blancArgent(c, 22.0, 3.6, 0.9) + centreMark(c, 42.0, 7.2, 2.0);
    return s;
  };
  return body(c, { sill: BA.sill, roof: BA.roof, nose: NOSE_BA, x0: 0.3, x1: L - 0.3, base: BA.grey, endR: 0.6, ends: [BA.floor, BA.eave - 0.4], paint,
    under: () => truck(ft(2.6), { wb: ft(2.1), d: 27, top: BA.sill }) + (long ? truck(L, { wb: ft(2.1), d: 27, top: BA.sill, kind: "loco" }) : "") +
      cases(ft(4.0), L - ft(2.0), BA.sill, 2, 0.9) + (c.coupledL ? coupledCouplers(2.0) : autoCoupler(0.6, 2.0)),
    top: () => fairing(5.0, 7.0, BA.roof, 0.45, "#7f858c", 2) + (long ? fairing(L - 12.0, 9.0, BA.roof, 0.7, "#6c7279", 3) + rect(L - 7.0, BA.roof + 0.7, 0.5, 0.6, "#3a3d42") : "") });
}
addCab("terBaLong", "X 74500 railcar, long car (Blanc-Argent)", (c) => baCar(c, true), BA.Ll);
addCab("terBaShort", "X 74500 railcar, short car (Blanc-Argent)", (c) => baCar(c, false), BA.Ls);
SETS.blancargent = set("X 74500 diesel railcar (two articulated cars), Blanc-Argent line (TER Centre-Val de Loire)", ["terBaLong", 1], ["terBaShortR", 1]);
SETS.blancargent2 = set("Two X 74500 railcars coupled, Blanc-Argent line", ["terBaLong", 1], ["terBaShortR", 1], ["terBaLong", 1], ["terBaShortR", 1]);
fact(["terBaLong", "terBaLongR", "terBaShort", "terBaShortR"], { model: "CFD X 74500", type: "Metre-gauge diesel railcar (two articulated cars)", builder: "CFD (Bagnères-de-Bigorre)", built: "2001–2002",
  fleet: "5 (X 74501–74505)", topSpeedMph: 53, powerHp: 410, lengthFt: 86.1, source: `${FRW}X_74500`,
  about: "The railcars of the metre-gauge Blanc-Argent line, Salbris–Romorantin–Valençay, TER Centre-Val de Loire; limited to 70 km/h there." });

return { TYPES, MODELS, SETS, FACTS, FLEET: typeof FLEET === "undefined" ? [] : FLEET };
})();

// =====================================================================
// TYPICAL
// =====================================================================
// What usually runs on a TER train, by region (the train's line in the
// timetable is its region's network, scripts/railroads/sncf.py) and by its
// end stations; the fleets as fr.wikipedia's regional rolling-stock pages
// list them (2025-2026) and the services' own photographs. Rules are tried in
// order: [one end, the other end (or null: either end), set id].
const R = (a, b, id) => [a, b, id];
const PARIS_N = /^Paris Gare du Nord/, LILLE = /^Lille/;
const RULES = {
  "TER Hauts-de-France": [
    R(PARIS_N, /Laon|Boulogne|Calais/, "rg6_hdf"),
    R(PARIS_N, null, "r2n10_hdf"),
    // SNCB's own trains (drawn in sncb.cars.js): the two-voltage AM96
    // (441-490; Maubeuge is under 25 kV) to Kortrijk and to Charleroi
    // (AM 487 on Antwerpen–Kortrijk–Lille 2020, AM 459 on Namur–Maubeuge
    // 2022, AM96s at Lille-Flandres 2025-2026).
    R(/Kortrijk|Charleroi/, null, "sncb_am96"),
    R(LILLE, /Lens|Béthune|Douai|Valenciennes|Jeumont|Tourcoing|Maubeuge/, "z235_2_hdf"),
    R(LILLE, /Tournai|Saint-Pol|Hirson|Charleville|Boulogne/, "agc4bb_hdf"),
    R(LILLE, /Calais|Dunkerque|Hazebrouck|Amiens|Arras|Saint-Omer/, "z265_4_hdf"),
    R(LILLE, /Saint-Quentin|Rouen/, "z265_5_hdf"),
    R(/Douai|Arras|Lens|Valenciennes|Jeumont|Cambrai/, /Douai|Arras|Lens|Valenciennes|Jeumont|Cambrai|Saint-Quentin/, "z235_2_hdf"),
    R(/Calais|Dunkerque|Étaples|Rang-du-Fliers|Le Tréport|Abancourt|Albert|Saint-Pol|Crépy|Hirson|Tergnier|Aulnoye/, null, "agc3d_hdf"),
    R(/Amiens|Beauvais|Creil|Compiègne|Laon|Saint-Quentin/, null, "agc4bb_hdf"),
    R(/Arras|Béthune|Hazebrouck|Lille/, null, "z245_3_hdf"),
    R(/./, null, "agc4bb_hdf"),
  ],
  "TER Normandie": [
    R(/Paris Saint-Lazare/, /Vernon|Évreux|Serquigny/, "omneo10_nor2"),
    R(/Mantes|Bueil/, null, "omneo10_nor2"),
    R(/Paris Saint-Lazare/, /Dieppe/, "rg4_nor"),
    R(/Paris Saint-Lazare/, null, "omneo10_nor"),
    R(/Paris Montparnasse/, null, "rg6_nor"),
    R(/Granville|Pontorson/, null, "rg6_nor"),
    R(/Dieppe/, null, "rg4_nor"),
    R(/Fécamp/, null, "x735_nor"),
    R(/Caen/, /Rouen/, "agc4e_nor"),
    R(/Amiens/, null, "agc4bb_nor"),
    R(/Caen/, /Coutances|Rennes|Saint-Lô|Alençon/, "agc4bb_nor"),
    R(/Caen/, /Le Mans|Tours/, "agc3d_nor"),
    R(/Lisieux|Évreux/, /Évreux|Lisieux/, "agc3e_nor"),
    R(/./, null, "agc3e_nor"),
  ],
  "TER Bretagne": [
    R(/Quimper|Nantes/, /Rennes|Nantes/, "z215_bzh"),
    R(/Brest/, /Quimper|Nantes/, "agc4bb_bzh"),
    R(/Paimpol|Carhaix|Callac|Lannion|Plouaret|Dinan|Dol-de-Bretagne|Châteaubriant|Retiers/, null, "x735_bzh"),
    R(/Rennes/, /Montreuil|Messac|Brohinière|Vitré/, "r2n6_bzh"),
    R(/Rennes/, null, "r2n8_bzh"),
    R(/./, null, "agc3e_bzh"),
  ],
  "TER Pays de la Loire": [
    R(/Clisson|Nort-sur-Erdre|Châteaubriant/, null, "dualis_nantes"),
    R(/Le Croisic|Orléans/, null, "r2n8_pdl"),
    R(/Nantes|Angers/, /Tours/, "r2n8_pdl"),
    R(/Paris Montparnasse|Nogent|Chartres|Versailles/, null, "r2n8_cvl"),
    R(/Quimper|Brest/, null, "z215_bzh"),
    R(/Pornic|Saint-Gilles|Sainte-Pazanne/, null, "agc4d_pdl"),
    R(/Chantonnay|Château-du-Loir|Bressuire/, null, "x735_pdl"),
    R(/Cholet|Sables|Roche-sur-Yon|La Rochelle|Saumur|Thouars/, null, "rg4_pdl"),
    R(/Caen/, null, "agc3d_nor"),
    R(/Alençon/, null, "agc4e_pdl"),
    R(/Saint-Nazaire|Savenay|Ancenis|Redon/, null, "z245_3_pdl"),
    R(/Le Mans|Laval|Sablé|Rennes/, /Laval|Nantes|Sablé|Rennes|Le Mans/, "z215_pdl"),
    R(/./, null, "z245_3_pdl"),
  ],
  "TER Centre-Val de Loire": [
    R(/Romorantin Blanc Argent|Valençay|Gièvres/, /Valençay|Salbris|Romorantin Blanc Argent|Gièvres/, "blancargent"),
    R(/Paris Austerlitz/, /Châteaudun|Vendôme/, "x725_2_cvl"),
    R(/Paris Austerlitz|Paris Bercy/, null, "omneo8_cvl"),
    R(/Paris Montparnasse|Versailles/, null, "r2n8_cvl"),
    R(/Chartres/, /Nogent|Le Mans/, "r2n8_cvl"),
    R(/Loches|Bléré|Saint-Aignan|Courtalain|Brou|Châteaudun|Alençon|Caen|Montluçon|Commentry|Saint-Amand|Chinon/, null, "x735_cvl"),
    R(/Chartres/, /Tours/, "x725_2_cvl"),
    R(/Tours|Saint-Pierre/, /Tours|Saint-Pierre-des-Corps/, "agc3e_cvl"),
    R(/Orléans|Aubrais|Blois|Tours|Saint-Pierre/, /Orléans|Aubrais|Blois|Tours|Poitiers|Port-de-Piles|Angers|Nantes|Saumur|Le Mans|Vendôme/, "z215_cvl"),
    R(/./, null, "agc4e_cvl"),
  ],
  "TER Bourgogne-Franche-Comté": [
    R(/Paris Bercy|Paris Gare de Lyon/, /Lyon|Dijon|Mâcon/, "rg6_bfc"),
    R(/Paris Bercy|Paris Gare de Lyon|Montereau/, /Auxerre|Avallon|Clamecy|Laroche/, "agc4b_bfc"),
    R(/Dijon/, /Lyon|Mâcon|Chalon|Chagny/, "rg6_bfc"),
    R(/Dijon|Belfort|Besançon Viotte|Lons|Bourg/, /Dijon|Belfort|Besançon Viotte|Lyon|Montbéliard|Lons|Bourg|Mouchard/, "rg4_bfc"),
    R(/Besançon Franche-Comté TGV|Ecole-Valentin/, null, "agc3e_bfc"),
    R(/Chaux-de-Fonds|Morteau|Valdahon|Neuchâtel|Vallorbe|Pontarlier|Saint-Claude|Andelot/, null, "x735_bfc"),
    R(/Vesoul|Épinal/, null, "x735_bfc"),
    R(/Delle/, null, "agc3e_bfc"),
    R(/Seurre|Is-sur-Tille|Laumes|Paray|Montchanin|Étang|Decize|Cosne|Nevers|Moulins/, null, "agc4b_bfc"),
    R(/./, null, "agc3b_bfc"),
  ],
  "TER Grand Est": [
    R(/Thann Saint-Jacques/, null, "avanto_mulhouse"),
    R(/Kruth/, null, "x735_ge"),
    R(/Paris Est/, /Troyes|Mulhouse|Culmont|Chaumont|Bar-le-Duc/, "rg6_car"),
    R(/Paris Est/, null, "agc4bb_ge"),
    R(/Offenburg|Kehl/, null, "rg4_tfa"),
    R(/Basel SBB|Saint-Louis/, /Strasbourg/, "ter200_ge"),
    R(/Mulhouse/, /Strasbourg/, "ter200_ge"),
    R(/Luxembourg|Thionville|Longwy/, null, "z265_4_ge"),
    R(/Metz/, /Nancy/, "z245_3_ge"),
    R(/Saarbrücken|Neustadt|Wörth|Lauterbourg|Müllheim|Trier/, null, "x739_ge"),
    R(/Sélestat|Saverne/, /Sélestat|Saverne|Strasbourg/, "rrr_bb222_ge"),
    R(/Haguenau|Niederbronn|Wissembourg|Sarreguemines|Metzeral|Roeschwoog|Mommenheim/, null, "rg4p_ge"),
    R(/Saint-Dié|Remiremont|Épinal|Neufchâteau|Saales|Rothau/, null, "rg4_ge"),
    R(/Strasbourg/, /Barr|Molsheim/, "agc3e_ge"),
    R(/Strasbourg/, /Metz|Nancy|Sarrebourg|Lunéville/, "agc4e_ge"),
    R(/Basel|Mulhouse|Colmar|Belfort/, null, "agc3e_ge"),
    R(/Givet|Sedan|Charleville|Laon|Fismes|Verdun|Conflans|Hagondange|Forbach|Chaumont/, null, "agc3d_ge"),
    R(/Reims|Épernay|Châlons|Champagne-Ardenne/, null, "agc3e_ge"),
    R(/./, null, "agc4e_ge"),
  ],
  "TER Auvergne-Rhône-Alpes": [
    R(/Lyon Saint-Paul|Tassin|Lozanne|Sain-Bel|Brignais|L'Arbresle/, /Sain-Bel|Brignais|L'Arbresle|Lozanne|Tassin|Lyon Saint-Paul/, "dualis_lyon"),
    R(/Chamonix|Les Houches|Vallorcine/, null, "montblanc"),
    R(/Modane|Bourg-Saint-Maurice/, null, "corail_bb72_aura"),
    R(/Genève|Annecy/, /Lyon/, "corail_bb222_aura"),
    R(/Grenoble|Chambéry/, /Lyon Part Dieu/, "corail_bb222_aura"),
    R(/Lyon|Vienne|Villefranche|Saint-Étienne|Firminy|Mâcon|Valence|Givors|Saint-André|Avignon|Marseille/, /Lyon|Vienne|Villefranche|Saint-Étienne|Firminy|Mâcon|Valence|Givors|Saint-André-le-Gaz|Avignon|Marseille|Ambérieu/, "r2n6_aura"),
    R(/Clermont/, /Lyon|Nevers|Moulins|Vichy|Montluçon/, "rg4_aura"),
    R(/Annecy|Chambéry|Grenoble|Genève|Valence|Rives|Saint-Marcellin|Gières/, /Annecy|Chambéry|Grenoble|Genève|Valence|Rives|Saint-Marcellin|Gières|Saint-André-le-Gaz/, "z245_3_aura"),
    R(/Évian|Saint-Gervais|Annemasse|La Roche-sur-Foron|Bellegarde/, null, "agc4bb_aura"),
    R(/Roanne|Le Puy|Montbrison|Boën|Bas - Monistrol|Oyonnax|Bourg-en-Bresse|Paray/, null, "agc3b_aura"),
    R(/Thiers|Issoire|Volvic|Vic-le-Comte|Gannat|Vertaizon|Brioude|Aurillac|Langeac|Commentry|Montluçon|Ussel|Neussargues/, null, "x735_aura"),
    R(/Clermont/, null, "x735_aura"),
    R(/./, null, "agc3e_aura"),
  ],
  "TER Provence-Alpes-Côte d'Azur": [
    R(/Grasse|Cannes|Nice|Menton|Monaco|Ventimiglia|Les Arcs/, /Grasse|Cannes|Nice-Ville|Menton|Monaco|Ventimiglia|Les Arcs/, "r2n8_paca"),
    R(/Tende|Breil|Drap/, null, "agc3d_paca"),
    R(/Briançon|Gap|Sisteron|Veynes|Romans|Pertuis/, null, "x725_2_paca"),
    R(/Carpentras/, null, "agc3b_paca"),
    R(/Marseille|Aubagne|Toulon|Hyères|Carnoules/, /Toulon|Hyères|Aubagne|Marseille|Les Arcs|Carnoules/, "z235_2_paca"),
    R(/Aix-en-Provence|Cavaillon/, null, "rg4_paca"),
    R(/Miramas|Arles|Avignon/, /Marseille|Miramas|Avignon|Arles|Valence/, "z235_2_paca"),
    R(/Narbonne|Montpellier|Béziers|Lunel/, null, "agc4e_occ"),
    R(/./, null, "z235_2_paca"),
  ],
  "ZOU! Marseille – Toulon – Nice": [R(/./, null, "omneo8_paca")],
  "TER Occitanie": [
    R(/Colomiers|Saint-Cyprien/, null, "r2n6_occ"),
    R(/Toulouse/, /Montauban|Muret|Castelnaudary|Carcassonne|L'Isle-Jourdain/, "r2n6_occ"),
    R(/Toulouse/, /Latour-de-Carol|Ax-les-Thermes|Foix|Pau|Tarbes|Boussens|Montréjeau|Narbonne|Perpignan|Portbou|Cerbère|Agen/, "rg4e_occ"),
    R(/Toulouse/, /Rodez|Albi|Carmaux|Mazamet|Auch|Luchon|Saint-Sulpice/, "rg4b_occ"),
    R(/Luchon|Carmaux|Saint-Sulpice/, null, "rg4b_occ"),
    R(/Figeac|Aurillac|Millau|Neussargues|Saint-Chély|Mende|Bédarieux|Langeac|Clermont/, null, "agc3b_occ"),
    R(/Brive|Cahors/, null, "agc4e_occ"),
    R(/Le Grau-du-Roi|Vauvert|Limoux|Quillan|Génolhac|Villefort|Alès|Villefranche - Vernet|Pont-Saint-Esprit/, null, "x735_occ"),
    R(/Perpignan/, /Villefranche/, "x735_occ"),
    R(/./, null, "agc4e_occ"),
  ],
  "TER Nouvelle-Aquitaine": [
    R(/Bordeaux|Arcachon|Libourne|Coutras|Langon|Pessac/, /Arcachon|Libourne|Coutras|Langon|Bordeaux Saint-Jean/, "r2n6_naq"),
    R(/Bordeaux|Dax|Bayonne/, /Hendaye|Agen|Marmande/, "rg4e_naq"),
    R(/Bordeaux|Dax/, /Pau|Tarbes|Lourdes/, "rg4b_naq"),
    R(/La Rochelle/, /Poitiers|Bordeaux|Nantes/, "rg4b_naq"),
    R(/Sarlat|Bergerac/, null, "rg4b_naq"),
    R(/Bayonne|Pau|Oloron|Bedous|Saint-Jean-Pied-de-Port/, /Saint-Jean-Pied-de-Port|Bedous|Oloron|Pau/, "x735_naq"),
    R(/Limoges/, /Saint-Yrieix|Ussel|Eymoutiers|Saillat|Saint-Junien|Guéret/, "x735_naq"),
    R(/Brive/, /Tulle|Ussel|Objat/, "x735_naq"),
    R(/Le Buisson|Mussidan|Niversac|Monsempron|Montmorillon/, null, "x725_2_naq"),
    R(/Poitiers|Châtellerault|Tours|Angoulême|Royan|Saintes|Niort|Rochefort/, null, "agc4bb_naq"),
    R(/Limoges|Châteauroux|La Souterraine|Vierzon|Montluçon/, /Limoges|Châteauroux|La Souterraine|Vierzon|Montluçon|Orléans|Brive|Poitiers/, "rg4b_naq"),
    R(/./, null, "agc3b_naq"),
  ],
  "Tram-train Nantes – Châteaubriant": [R(/./, null, "dualis_nantes")],
  "Mont-Blanc Express": [R(/./, null, "montblanc")],
  "Train Jaune": [R(/./, null, "trainjaune")],
};
// The region's train by its ends; undefined when no rule matched, null when
// a rule says the train isn't drawn here.
function ruleFor(t) {
  const rules = RULES[t.route || ""];
  if (!rules) return undefined;
  const a = t.origin || "", b = t.destination || "";
  for (const [ra, rb, id] of rules) {
    if (rb ? (ra.test(a) && rb.test(b)) || (ra.test(b) && rb.test(a)) : ra.test(a) || ra.test(b)) return id;
  }
  return undefined;
}

// SNCB's own units on the two Belgian TER Hauts-de-France lines (Lille–
// Kortrijk and Charleroi–Maubeuge: the two-voltage AM96), drawn in Belgium's car file
// (sncb.cars.js): borrowed when that file is there, the two lines left
// typical-less if not.
const optional = (file) => import(file).catch(() => null);
const SNCB = await optional("./sncb.cars.js?v=dev");
const PART_SNCB = { TYPES: {}, MODELS: {}, FACTS: {}, FLEET: [], SETS: {} };
if (SNCB) {
  for (const k of ["am96a", "am96aR", "am96b", "am96c", "am96cR"]) {
    if (!SNCB.TYPES?.[k] || !SNCB.MODELS?.[k]) continue;
    PART_SNCB.TYPES[k] = SNCB.TYPES[k]; PART_SNCB.MODELS[k] = SNCB.MODELS[k];
    if (SNCB.FACTS?.[k]) PART_SNCB.FACTS[k] = SNCB.FACTS[k];
  }
  const ok = (ks) => ks.every((k) => PART_SNCB.TYPES[k]);
  if (ok(["am96a", "am96b", "am96cR"])) PART_SNCB.SETS.sncb_am96 = { label: "SNCB AM96 (three cars, two-voltage), SNCB's own train", units: [["am96a", 1], ["am96b", 1], ["am96cR", 1]] };
}
const PARTS = [PART_REGIOLIS, PART_DD, PART_DMU, PART_LOCO, PART_SPECIAL, PART_SNCB];
export const TYPES = {}, MODELS = {}, FACTS = {};
const SETS = {};
for (const p of PARTS) {
  for (const [k, v] of Object.entries(p.TYPES)) { if (TYPES[k]) throw new Error(`ter: type ${k} twice`); TYPES[k] = v; }
  Object.assign(MODELS, p.MODELS); Object.assign(FACTS, p.FACTS);
  for (const [k, v] of Object.entries(p.SETS)) { if (SETS[k]) throw new Error(`ter: set ${k} twice`); SETS[k] = v; }
}
export { SETS };
export const FLEETS = { ter: PARTS.flatMap((p) => p.FLEET || []) };
// A car shown alone (a fleet page's sample): the first set it runs in.
const setOf = (key) => Object.values(SETS).find((x) => x.units.some(([k]) => k.replace(/R$/, "") === key.replace(/R$/, ""))) || null;
const usually = (s) => ({ label: `Usually ${s.label}`, units: s.units });
export const TYPICAL = {
  ter: (t, reported) => {
    if (reported && TYPES[reported] && !t.route) return setOf(reported);
    const id = ruleFor(t);
    if (id && SETS[id]) return usually(SETS[id]);
    return reported && TYPES[reported] ? setOf(reported) : null;
  },
};
