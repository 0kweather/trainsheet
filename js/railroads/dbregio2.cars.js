// DB Regio in the south and west of Germany (scripts/railroads/germany.py,
// agency "dbregio2": the RE and RB lines DB Regio runs in Nordrhein-
// Westfalen, Hessen, Rheinland-Pfalz, Saarland, Baden-Württemberg and
// Bayern, with its regional companies: Kurhessenbahn, Westfrankenbahn,
// Südostbayernbahn). Trainsheet's own side views at the shared scale
// (js/carart.js), from published dimensions and from photographs
// (Wikimedia Commons, 2024-2026) measured off near-broadside views, each
// in the paint most of that series wears in late 2026; lettered here, no
// logo files. No formations are published for DB Regio's trains, so each
// is drawn as what usually runs on its line (TYPICAL).
import { C, rect, circle, path, line, lines, poly, truck, pantograph, slats } from "../carart.js?v=dev";
// DB Regio's double-deck coaches and lichtgrau as drawn for the north and east (dbregio.cars.js), shared so both halves of DB Regio match.
import { dosto as DBR_DOSTO, MODELS as DBR_MODELS, DBR } from "./dbregio.cars.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const seq = (from, pitch, k) => Array.from({ length: Math.max(0, k) }, (_, i) => from + i * pitch);
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const NARROW = "'Roboto Condensed', 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif";
const STROKE = 'vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"';
const M2F = 3.2808; // feet in a metre
const m = (v) => n(v * M2F); // metres to feet
const P = (pts) => pts.map((p) => (p[0] === "q" ? ["q", m(p[1]), m(p[2]), m(p[3]), m(p[4])] : [m(p[0]), m(p[1])])); // metre points to feet
let ids = 0;
const newId = () => `ts-clip-dbr2-${++ids}`;

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

// ===================== DB's colours and marks =====================
// Verkehrsrot as DB's vehicles show it in daylight, light grey (lichtgrau)
// skirts and door leaves, the window bands' near-black.
const DB = { red: "#e3000f", deep: "#b5000c", grey: "#d4d8da", grey2: "#b9bec2", dark: "#2b2f33", band: "#1f2226", roof: "#9fa5ab", white: "#f4f5f5", yellow: "#f2c200" };
// The DB logo, h ft tall: "DB" in a rounded box with a border.
//   white (default): a white box, red border and red letters, as on the
//   noses; outline: a white border and white letters on the paint beneath.
function dbLogo(c, x, y, h, { outline = false, red = DB.red } = {}) {
  const w = h * 1.42, sw = h * 0.1;
  const box = outline
    ? `<rect x="${n(-w / 2 + sw / 2)}" y="${n(-h / 2 + sw / 2)}" width="${n(w - sw)}" height="${n(h - sw)}" rx="${n(h * 0.16)}" fill="none" stroke="#ffffff" stroke-width="${n(sw)}"/>`
    : `<rect x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${n(h)}" rx="${n(h * 0.18)}" fill="${red}"/><rect x="${n(-w / 2 + sw)}" y="${n(-h / 2 + sw)}" width="${n(w - 2 * sw)}" height="${n(h - 2 * sw)}" rx="${n(h * 0.1)}" fill="#ffffff"/>`;
  return markAt(c, x, y, 1, box) + T(c, x, y - h * 0.01, h * 0.66, "DB", outline ? "#ffffff" : red, { weight: 800, spacing: -0.03 * h, family: SANS });
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
// A smooth curve through points (Catmull-Rom as quadratic-ish cubic
// Béziers): the path's "C" segments after its first point, for streamlined
// noses drawn as a polyline of measured points.
function smooth(pts) {
  let d = "";
  for (let i = 0; i + 1 < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${n(c1[0])} ${n(c1[1])} ${n(c2[0])} ${n(c2[1])} ${n(p2[0])} ${n(p2[1])}`;
  }
  return d;
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
function leaves(x, w, y0, y1, fill, { glass = [0.2, 0.86], gw = 0.5, seam = "#2b2e33", r = null, k = 2 } = {}) {
  const h = y1 - y0, lw = w / k;
  let s = rect(x, y0, w, h, fill);
  for (let i = 0; i < k; i++) s += pane(x + lw * i + lw * (1 - gw) / 2, y0 + h * glass[0], lw * gw, h * (glass[1] - glass[0]), r ?? lw * gw * 0.45, "#22252a");
  for (let i = 1; i < k; i++) s += line(x + lw * i, y0 + 0.05, x + lw * i, y1 - 0.05, seam, 0.6);
  return s + line(x, y0, x, y1, "rgba(0,0,0,0.35)", 0.5) + line(x + w, y0, x + w, y1, "rgba(0,0,0,0.35)", 0.5);
}

// ===================== Running gear and ends =====================
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
// A lamp: lens in a dark surround (white headlight, red tail light).
const lamp = (x, y, w = 0.55, h = 0.38, color = "#f6f2dc") => rect(x - 0.08, y - 0.08, w + 0.16, h + 0.16, "#1b1d20", 0, 'rx="0.12"') + rect(x, y, w, h, color, 0, 'rx="0.1"');
const RED_LAMP = "#d8262f";
const wiper = (x0, y0, x1, y1) => line(x0, y0, x1, y1, "#0d0f11", 0.9);

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
// A diesel's exhaust stack and silencer box on the roof.
const exhaust = (x, roof, w = 3.0) => rect(x, roof - 0.05, w, 0.7, "#55595f", 0.4, 'rx="0.15"') + rect(x + w * 0.6, roof + 0.6, 0.45, 0.5, "#2a2d31", 0, 'rx="0.08"');

// ===================== Pictograms =====================
// A bicycle, h ft tall, centred at (x, y).
function bikeSign(x, y, h, color = "#ffffff") {
  const r = h * 0.28, s = `fill="none" stroke="${color}" stroke-width="${n(h * 0.08)}"`;
  return `<g transform="translate(${n(x)} ${n(y)})"><circle cx="${n(-h * 0.45)}" cy="${n(-h * 0.2)}" r="${n(r)}" ${s}/><circle cx="${n(h * 0.45)}" cy="${n(-h * 0.2)}" r="${n(r)}" ${s}/>` +
    `<path d="M${n(-h * 0.45)} ${n(-h * 0.2)}L${n(-h * 0.1)} ${n(h * 0.25)}L${n(h * 0.3)} ${n(h * 0.25)}L${n(h * 0.45)} ${n(-h * 0.2)}M${n(-h * 0.1)} ${n(h * 0.25)}L${n(h * 0.05)} ${n(-h * 0.2)}L${n(h * 0.3)} ${n(h * 0.25)}" ${s}/></g>`;
}
// The wheelchair symbol in a square, h ft, centred at (x, y).
function wheelchair(c, x, y, h, fill = "#1f5fa8") {
  return markAt(c, x, y, h, `<rect x="-0.5" y="-0.5" width="1" height="1" rx="0.08" fill="${fill}"/>` +
    '<circle cx="0.02" cy="-0.3" r="0.08" fill="#fff"/><path d="M0.02 -0.18L0.02 0.08L0.25 0.08L0.32 0.32" fill="none" stroke="#fff" stroke-width="0.08"/>' +
    '<path d="M-0.08 -0.02A0.24 0.24 0 1 0 0.2 0.28" fill="none" stroke="#fff" stroke-width="0.07"/>');
}

// ===================== Orientation and tables =====================
// The same car turned round: its cab (drawn on the left) now on the right.
function facingRight(c, draw) {
  const mm = { ...c, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: c.coupledL };
  return `<g transform="matrix(-1 0 0 1 ${n(c.L)} 0)">${draw(mm)}</g>`;
}
// A part's tables: add(key, name, draw, lenFt, extra) for a car; addCab()
// also adds key + "R", the same car closing its unit (its cab on the right).
// extra: TYPES fields ({ kind: "electric" } for a locomotive, { kind:
// "coach" } for a coach, cab: true for a driving trailer, amenities...).
function registry() {
  const TYPES = {}, MODELS = {};
  const Mo = (draw, len) => ({ draw, len, oneEnd: false, variant: (c) => `${c.index}/${c.count}` });
  const add = (key, name, draw, len, extra = {}) => { TYPES[key] = { name, kind: "emu", ...extra }; MODELS[key] = Mo(draw, len); };
  const addCab = (key, name, draw, len, extra = {}) => { add(key, name, draw, len, extra); add(`${key}R`, name, (c) => facingRight(c, draw), len, extra); };
  return { TYPES, MODELS, add, addCab };
}
const set = (label, ...units) => ({ label, units });
const WP = "https://en.wikipedia.org/wiki/";
const DEWP = "https://de.wikipedia.org/wiki/";
// A part of the file, built in its own scope; a part that fails leaves
// the others standing (its error in PART_ERRORS).
const PART_ERRORS = {};
function safe(name, build) {
  try { return build(); } catch (e) { PART_ERRORS[name] = String(e && e.stack || e); return { TYPES: {}, MODELS: {}, SETS: {}, FACTS: {}, FLEETS: [] }; }
}

// =====================================================================
// LOCOMOTIVE-HAULED TRAINS: DB Regio's locomotives (TRAXX 146 and 147,
// 245, 218, 111, 114, Škoda 102, the Vectrons hired in) and its coaches
// (double-deck cars and their cab cars, Škoda's München–Nürnberg-Express
// sets, the ex-InterCity cars of the RE 200).
// =====================================================================
const PART_LOCO = safe("loco", () => {
  const { TYPES, MODELS, add, addCab } = registry();
  const FACTS = {}, FLEETS = [];
  const ev = (prefix8, key) => [Number(`${prefix8}0000`), Number(`${prefix8}9999`), key];

  // ---------- Shared ----------
  // Both ends of a double-cab locomotive: draw(c) draws the body with its
  // cab on the left; the right half is the same drawing mirrored (c.half 1).
  function twin(c, draw) {
    const L = c.L, mk = () => { const id = newId(); return [id, `<clipPath id="${id}"><rect x="-5" y="-5" width="${n(L / 2 + 5)}" height="40"/></clipPath>`]; };
    const [a, ca] = mk(), [b, cb] = mk();
    return ca + cb + `<g clip-path="url(#${a})">${draw({ ...c, half: 0 })}</g>` +
      `<g transform="matrix(-1 0 0 1 ${n(L)} 0)"><g clip-path="url(#${b})">${draw({ ...c, half: 1, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: c.coupledL })}</g></g>`;
  }
  // A rounded window pane with a frame of the given colour, metres.
  const winM = (x0, x1, y0, y1, r = 0.12, frame = "#1d2024") => pane(m(x0), m(y0), m(x1 - x0), m(y1 - y0), m(r), frame);
  // Oval-ended door window (DB's double-deck doors): a tall slot.
  const slot = (x, w, y0, y1) => rect(x, y0, w, y1 - y0, C.glass, 0, `rx="${n(w / 2)}" stroke="#2a2d33" stroke-width="0.7" ${STROKE}`) +
    rect(x + w * 0.2, y0 + (y1 - y0) * 0.55, w * 0.6, (y1 - y0) * 0.35, C.glassLight, 0, `rx="${n(w * 0.3)}"`);
  // A sliding door pair (metres): leaves in fill, a slot window in each.
  function ddDoor(x0, x1, y0, y1, fill = DB.grey) {
    const X0 = m(x0), X1 = m(x1), Y0 = m(y0), Y1 = m(y1), w = (X1 - X0) / 2;
    return rect(X0, Y0, X1 - X0, Y1 - Y0, fill, 0, `stroke="rgba(0,0,0,0.45)" stroke-width="0.6" ${STROKE}`) + line(X0 + w, Y0 + 0.1, X0 + w, Y1 - 0.1, "#3a3e44", 0.6) +
      slot(X0 + w * 0.24, w * 0.5, Y0 + (Y1 - Y0) * 0.3, Y1 - (Y1 - Y0) * 0.1) + slot(X0 + w * 1.26, w * 0.5, Y0 + (Y1 - Y0) * 0.3, Y1 - (Y1 - Y0) * 0.1);
  }
  // Roof grilles (air conditioning) seen from the side: a dark louvred box.
  const grille = (x, w, roof, h = 0.45) => rect(x, roof - 0.15, w, h, "#7c838b", 0.4, 'rx="0.1"') + slats(x + 0.15, roof - 0.1, w - 0.3, h - 0.1, 0.32, "rgba(0,0,0,0.45)");

  // =================== Double-deck coaches ===================
  // The coaches are drawn by dbregio.cars.js's dosto() (DB Regio north and
  // east), so the double-deck cars look the same all over Germany: red, the
  // light grey (lichtgrau) along the bottom up to the lower deck's windows
  // and the grey roof, first class's yellow band upstairs.
  const DDC = DBR_MODELS.deRDd.len, DDCAB = DBR_MODELS.deRDdCab4.len;
  add("dwDdMid", "Double-deck car, second class (DBpza)", (c) => DBR_DOSTO(c, "mid"), DDC, { kind: "coach" });
  add("dwDdBike", "Double-deck car with multi-purpose area, second class (DBpza 751)", (c) => DBR_DOSTO(c, "bike"), DDC, { kind: "coach", amenities: ["bikes"] });
  add("dwDdFirst", "Double-deck car, first and second class (DABpza)", (c) => DBR_DOSTO(c, "mid1"), DDC, { kind: "coach", amenities: ["first"] });
  addCab("dwDdCab", "Double-deck cab car, first and second class (DABpbzfa)", (c) => DBR_DOSTO(c, "cab4"), DDCAB, { kind: "coach", cab: true, amenities: ["first", "bikes"] });

  // =================== TRAXX AC (146, 147) ===================
  // An outline d filled with base, the paint clipped to it and shaded as
  // body() does, then outlined.
  function shell(d, base, paint) {
    const id = newId();
    const ys = d.match(/-?\d+(\.\d+)?/g).map(Number).filter((_, i) => i % 2 === 1), lo = Math.min(...ys), hi = Math.max(...ys);
    const stop = (off, color, v, fb) => `<stop offset="${off}" stop-color="${color}" stop-opacity="${fb}" style="stop-opacity:var(${v},${fb})"/>`;
    const shade = `<linearGradient id="${id}-s" gradientUnits="userSpaceOnUse" x1="0" y1="${n(lo)}" x2="0" y2="${n(hi)}">` +
      stop(0, "#000", "--car-shade-low", 0.16) + '<stop offset="0.36" stop-color="#000" stop-opacity="0"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/>' +
      stop(0.8, "#fff", "--car-shade-high", 0.1) + '<stop offset="0.93" stop-color="#fff" stop-opacity="0"/>' + stop(1, "#000", "--car-shade-roof", 0.08) + "</linearGradient>";
    return `<path d="${d}" fill="${base}"/><clipPath id="${id}"><path d="${d}"/></clipPath><defs>${shade}</defs>` +
      `<g clip-path="url(#${id})">${paint}<rect x="-5" y="${n(lo)}" width="200" height="${n(hi - lo)}" fill="url(#${id}-s)"/></g>` +
      `<path d="${d}" fill="none" stroke="currentColor" stroke-width="0.8" ${STROKE}/>`;
  }
  // Bombardier TRAXX P160 AC1/AC2 (DB 146.0, 146.1, 146.2): 18.9 m over
  // the buffers, bogie centres 10.44 m, 2.6 m wheelbase, 1,250 mm wheels
  // (de.wikipedia "Bombardier Traxx"); measured off 146 212 at Pirna (July
  // 2026, broadside) with 146 122 (Osnabrück 2024) and 146 230/236
  // (Konstanz, RE 2, 2026): the cabs full height, the machine room between
  // them lower under its grey roof hatches and grilles. Paint: verkehrsrot,
  // dark grey along the bottom of the body; the big DB logo (white-edged)
  // once on each side, a metre toward cab 1 from the middle.
  const TX = { sill: 0.92, grey: 1.45, roof: 4.15, side: 3.55, hatch: 4.0, cab: 3.2 };
  const NOSE_146 = [[0.3, 0.92], [0.32, 1.45], [0.38, 2.45], [0.48, 2.85], [0.78, 3.75], ["q", 0.9, 4.1, 1.25, 4.15]];
  const NOSE_147 = [[0.3, 0.92], [0.3, 1.45], [0.33, 2.5], [0.42, 2.9], [0.82, 3.82], ["q", 0.92, 4.12, 1.3, 4.15]];
  const bigLogo = (c, x, y, h) => markAt(c, x, y, 1, `<rect x="${n(-h * 0.76)}" y="${n(-h * 0.56)}" width="${n(h * 1.52)}" height="${n(h * 1.12)}" rx="${n(h * 0.22)}" fill="#ffffff"/>`) + dbLogo(c, x, y, h);
  function traxx(c, { ac3 = false } = {}) {
    return twin(c, (h) => {
      const L = h.L, first = h.half === 0, half = L / 2 + 0.5;
      const nose = P(ac3 ? NOSE_147 : NOSE_146);
      // the outline: nose, cab roof, step down to the machine room's roof
      const d = poly([...nose, [m(TX.cab - 0.15), m(TX.roof)], ["q", m(TX.cab), m(TX.roof), m(TX.cab), m(TX.roof - 0.12)], [m(TX.cab), m(TX.hatch)],
        [half, m(TX.hatch)], [half, m(TX.sill)]]);
      const grey = ac3 ? 1.75 : TX.grey;
      let paint = rect(-1, 0, L + 2, 20, DB.red) + rect(-1, 0, L + 2, m(grey), DBR.gray) + rect(m(TX.cab), m(TX.side), L, 3, "#8a9096") +
        line(m(TX.cab), m(TX.side), L, m(TX.side), "rgba(0,0,0,0.35)", 0.6);
      // the AC3's machine room: a ribbed side panel between the cabs
      if (ac3) paint += line(m(TX.cab + 0.1), m(grey + 0.05), m(TX.cab + 0.1), m(TX.side - 0.05), "rgba(0,0,0,0.3)", 0.6) +
        lines(seq(m(TX.cab + 0.45), m(0.42), 20).map((x) => [x, m(grey + 0.08), x, m(TX.side - 0.08)]), "rgba(0,0,0,0.2)", 0.5);
      let s = shell(d, DB.red, paint);
      // roof hatches: grilles and plain panels between the cabs
      for (const [a, b, gr] of [[3.35, 4.6, 1], [4.65, 5.75, 1], [5.8, 7.0, 0], [7.05, 9.5, 0]]) {
        s += rect(m(a), m(TX.side + 0.04), m(b - a), m(TX.hatch - TX.side - 0.1), gr ? "#565c62" : "#9ba1a7", 0, 'rx="0.1"');
        if (gr) s += slats(m(a) + 0.15, m(TX.side + 0.08), m(b - a) - 0.3, m(TX.hatch - TX.side - 0.18), 0.32, "rgba(0,0,0,0.5)");
      }
      // windscreen edge, cab side window, door, lamps
      s += path(poly(P(ac3 ? [[0.42, 2.92], [0.66, 2.92], [1.02, 3.86], [0.8, 3.86]] : [[0.48, 2.88], [0.66, 2.88], [0.98, 3.8], [0.78, 3.8]])), C.glass);
      s += ac3 ? winM(1.3, 1.75, 2.5, 3.42, 0.18, "#15171a") : winM(1.27, 1.8, 2.63, 3.24, 0.14, "#15171a");
      s += rect(m(1.98), m(1.47), m(0.84), m(1.8), "none", 0, `stroke="rgba(0,0,0,0.42)" stroke-width="0.6" ${STROKE} rx="0.15"`) +
        line(m(1.93), m(1.5), m(1.93), m(3.3), "#2c3035", 0.7) + line(m(2.87), m(1.5), m(2.87), m(3.3), "#2c3035", 0.7);
      s += lamp(m(0.3), m(1.95), m(0.1), m(0.16)) + lamp(m(0.3), m(1.7), m(0.1), m(0.14), RED_LAMP);
      s += T(h, m(2.4), m(1.2), m(0.13), first ? "1" : "2", "#ffffff", { weight: 600 });
      if (first && ac3) s += dbLogo(h, m(4.7), m(2.75), m(0.42), { outline: true });
      if (first && !ac3) s += bigLogo(h, m(18.9 / 2 - 1.0), m(2.45), m(0.78));
      if (first) s += T(h, m(8.1), m(1.2), m(0.1), ac3 ? "91 80 6147 0" : "91 80 6146 2", "#1d1f22", { weight: 500 });
      // running gear, buffer beam, roof gear
      s = truck(m(4.23), { wb: m(2.6), d: 49, kind: "loco", top: m(TX.sill) }) + cases(m(6.0), m(9.0), m(TX.sill), 2, m(0.4), "#2c2f35") +
        rect(m(0.3), m(0.45), m(1.3), m(0.47), "#2a2d31") + s + uicBuffers(0, -1, { y: m(1.06), reach: m(0.62) });
      s += pantograph(m(5.4), m(TX.hatch) + 0.05, { up: !first, facing: 1 }) + rect(m(4.6), m(TX.hatch) - 0.05, m(1.6), 0.3, "#5d636c");
      return s;
    });
  }
  add("dwL146", "DB class 146 electric locomotive (TRAXX P160 AC1/AC2)", (c) => traxx(c), m(18.9), { kind: "electric", pan: true });
  add("dwL147", "DB class 147 electric locomotive (TRAXX P160 AC3)", (c) => traxx(c, { ac3: true }), m(18.9), { kind: "electric", pan: true });

  // TRAXX P160 DE ME (DB 245, 2013-2016): the TRAXX body with four diesel
  // engines; 18.9 m, bogie centres 10.44 m (de.wikipedia "Bombardier
  // Traxx"). Measured off 245 at Bad Vilbel-Gronau (Niddertal, September
  // 2024) and 245 036/002 at Radolfzell and Singen (RE 3, 2025-2026): the
  // cabs full height, the engine room's side with louvred grilles and small
  // windows, its roof in light grey; the DB logo on the side once.
  function loco245(c) {
    const L = c.L;
    let s = twin(c, (h) => {
      const half = h.L / 2 + 0.5;
      const d = poly([...P(NOSE_146), [m(TX.cab - 0.15), m(TX.roof)], ["q", m(TX.cab), m(TX.roof), m(TX.cab), m(TX.roof - 0.12)], [m(TX.cab), m(4.05)], [half, m(4.05)], [half, m(TX.sill)]]);
      const paint = rect(-1, 0, h.L + 2, 20, DB.red) + rect(-1, 0, h.L + 2, m(TX.grey), DBR.gray) + rect(m(TX.cab), m(3.45), h.L, 3, "#b4b3ad") +
        line(m(TX.cab), m(3.45), h.L, m(3.45), "rgba(0,0,0,0.35)", 0.6) + line(m(5.5), m(3.45), m(5.8), m(4.05), "rgba(0,0,0,0.25)", 0.5);
      let t = shell(d, DB.red, paint);
      t += path(poly(P([[0.48, 2.88], [0.66, 2.88], [0.98, 3.8], [0.78, 3.8]])), C.glass) + winM(1.27, 1.8, 2.63, 3.24, 0.14, "#15171a");
      t += rect(m(1.98), m(1.47), m(0.84), m(1.8), "none", 0, `stroke="rgba(0,0,0,0.42)" stroke-width="0.6" ${STROKE} rx="0.15"`) +
        line(m(1.93), m(1.5), m(1.93), m(3.3), "#c9cdd1", 0.7) + line(m(2.87), m(1.5), m(2.87), m(3.3), "#c9cdd1", 0.7);
      t += lamp(m(0.3), m(1.95), m(0.1), m(0.16)) + T(h, m(2.4), m(1.2), m(0.13), h.half === 0 ? "1" : "2", "#ffffff", { weight: 600 });
      t = truck(m(4.23), { wb: m(2.6), d: 49, kind: "loco", top: m(TX.sill) }) + rect(m(0.3), m(0.45), m(1.3), m(0.47), "#2a2d31") + t + uicBuffers(0, -1, { y: m(1.06), reach: m(0.62) });
      return t;
    });
    // the engine room's side, end to end (not mirrored)
    const grill = (a, b, y0, y1) => rect(m(a), m(y0), m(b - a), m(y1 - y0), "#b8000c", 0, `rx="0.25" stroke="rgba(0,0,0,0.35)" stroke-width="0.5" ${STROKE}`) +
      lines(seq(m(y0) + 0.3, 0.32, Math.floor((m(y1 - y0) - 0.4) / 0.32)).map((y) => [m(a) + 0.2, y, m(b) - 0.2, y]), "rgba(0,0,0,0.4)", 0.5);
    const box = (a, b, y0, y1) => rect(m(a), m(y0), m(b - a), m(y1 - y0), "#b3000c", 0, `stroke="rgba(0,0,0,0.35)" stroke-width="0.5" ${STROKE}`);
    s += grill(3.6, 4.8, 1.75, 2.6) + box(5.4, 6.0, 2.35, 2.85) + box(5.4, 6.0, 1.95, 2.3) + grill(6.3, 7.5, 1.6, 3.1) + box(7.9, 8.5, 2.6, 2.95) + box(8.6, 9.6, 2.6, 2.95) +
      box(11.1, 11.6, 2.6, 2.95) + box(11.7, 12.2, 2.6, 2.95) + grill(12.6, 13.6, 1.6, 3.1) + grill(14.6, 15.2, 1.7, 2.2);
    s += dbLogo(c, m(10.3), m(2.45), m(0.42));
    s += rect(m(5.0), m(4.05), m(2.0), m(0.12), "#8f8e88") + rect(m(9.0), m(4.05), m(0.8), m(0.25), "#55595f");
    return s;
  }
  add("dwL245", "DB class 245 diesel locomotive (TRAXX P160 DE ME)", loco245, m(18.9), { kind: "diesel" });

  // A double-cab locomotive's outline and paint from a nose profile
  // (metres, bottom to roof), drawn as its left half (twin() mirrors it).
  function cabHalf(h, nose, { roof, sill, paint }) {
    const half = h.L / 2 + 0.5;
    return shell(poly([...P(nose), [half, m(roof)], [half, m(sill)]]), DB.red, paint);
  }
  const hRibs = (x0, x1, y0, y1, k) => lines(seq(m(y0), m((y1 - y0) / k), k + 1).map((y) => [x0, y, x1, y]), "rgba(0,0,0,0.3)", 0.6);

  // DB 114 (ex-DR 112, LEW 1990-1992, the class 143 family): 16.64 m over
  // the buffers, bogie centres 8.2 m, 1,250 mm wheels. Measured off 114 038
  // at Fulda (RE 50, March 2024) and 114 016 (Frankfurt, RE 50, 2025):
  // verkehrsrot over a grey frame, the machine room's side in horizontal
  // ribs, louvres along its top; the small DB logo once on each side, the
  // white band with the DB logo across each front.
  const NOSE_114 = [[0.55, 1.02], [0.52, 2.3], [0.6, 2.75], [0.74, 3.5], ["q", 0.82, 3.95, 1.25, 3.98]];
  function loco114(c) {
    return twin(c, (h) => {
      const L = h.L, first = h.half === 0, half = L / 2 + 0.5;
      const paint = rect(-1, 0, L + 2, 20, DB.red) + rect(-1, 0, L + 2, m(1.45), "#8f9896") + rect(m(2.6), m(3.45), L, m(0.4), "#5a6066") +
        slats(m(2.65), m(3.47), L, m(0.36), 0.35, "rgba(0,0,0,0.45)") + hRibs(m(2.75), L, 1.75, 3.3, 11) + rect(-1, m(3.87), L + 2, 3, "#9aa0a6");
      let s = cabHalf(h, NOSE_114, { roof: 3.98, sill: 1.02, paint });
      s += path(poly(P([[0.62, 2.82], [0.74, 2.82], [0.86, 3.48], [0.74, 3.5]])), C.glass) + winM(0.95, 1.55, 2.65, 3.42, 0.14, "#15171a");
      s += rect(m(1.72), m(1.5), m(0.7), m(1.85), "none", 0, `stroke="rgba(0,0,0,0.42)" stroke-width="0.6" ${STROKE} rx="0.15"`) +
        line(m(1.66), m(1.55), m(1.66), m(3.2), "#c9cdd1", 0.7) + line(m(2.48), m(1.55), m(2.48), m(3.2), "#c9cdd1", 0.7);
      s += lamp(m(0.5), m(1.7), m(0.1), m(0.18)) + T(h, m(2.6), m(1.25), m(0.13), first ? "1" : "2", "#ffffff", { weight: 600 });
      if (first) s += dbLogo(h, m(5.6), m(2.95), m(0.34), { outline: true });
      s = truck(m(4.22), { wb: m(2.7), d: 49, kind: "loco", top: m(1.02) }) + rect(m(0.5), m(0.5), m(1.1), m(0.52), "#2a2d31") + s + uicBuffers(0, -1, { y: m(1.06), reach: m(0.62) });
      s += pantograph(m(4.6), m(3.98) + 0.05, { up: !first, facing: 1 }) + rect(m(3.8), m(3.93), m(1.6), 0.3, "#5d636c");
      return s;
    });
  }
  add("dwL114", "DB class 114 electric locomotive", loco114, m(16.64), { kind: "electric", pan: true });

  // DB 218 (Krupp/Henschel/MaK 1971-1979): 16.4 m over the buffers,
  // bogie centres 8.6 m, 2.8 m wheelbase, 1,000 mm wheels. Measured off
  // 218 428 at Regensburg Hbf (May 2026): a cab at each end, the engine
  // room between with a row of windows along the top of its side and
  // louvred grilles below; verkehrsrot, grey frame and roof, the white band
  // with the DB logo across the fronts, the small DB logo on the side.
  const NOSE_218 = [[0.62, 1.15], [0.62, 2.2], [0.72, 2.7], [0.92, 3.4], ["q", 1.05, 3.85, 1.7, 3.95]];
  function loco218(c) {
    let s = twin(c, (h) => {
      const L = h.L, first = h.half === 0;
      const paint = rect(-1, 0, L + 2, 20, DB.red) + rect(-1, 0, L + 2, m(1.62), "#7c8287") + rect(-1, m(3.65), L + 2, 3, "#8d9399");
      let t = cabHalf(h, NOSE_218, { roof: 3.95, sill: 1.15, paint });
      t += path(poly(P([[0.73, 2.78], [0.86, 2.78], [1.0, 3.38], [0.9, 3.4]])), C.glass) + winM(1.2, 2.25, 2.85, 3.5, 0.12, "#15171a");
      t += lamp(m(0.62), m(1.85), m(0.1), m(0.2)) + T(h, m(2.8), m(1.4), m(0.13), first ? "1" : "2", "#ffffff", { weight: 600 });
      t = truck(m(3.9), { wb: m(2.8), d: 39, kind: "loco", top: m(1.15) }) + rect(m(0.6), m(0.55), m(1.0), m(0.6), "#2a2d31") + t + uicBuffers(0, -1, { y: m(1.06), reach: m(0.62) });
      return t;
    });
    // the engine room, end to end: the row of windows high along the
    // side, the grilles, the DB logo, the door (218 428, Regensburg 2026)
    for (let k = 0; k < 10; k++) { const a = 2.75 + k * 0.97; s += winM(a, a + 0.82, 2.92, 3.55, 0.1, "#2b2f34"); }
    const grill = (a, b, y0, y1) => rect(m(a), m(y0), m(b - a), m(y1 - y0), "#b8000c", 0, `rx="0.15" stroke="rgba(0,0,0,0.35)" stroke-width="0.5" ${STROKE}`) +
      lines(seq(m(y0) + 0.25, 0.3, Math.floor((m(y1 - y0) - 0.3) / 0.3)).map((y) => [m(a) + 0.15, y, m(b) - 0.15, y]), "rgba(0,0,0,0.4)", 0.5);
    s += grill(3.05, 3.45, 1.8, 2.7) + grill(3.75, 4.15, 1.8, 2.7) + grill(5.55, 6.35, 1.72, 2.82) + grill(6.55, 7.35, 1.72, 2.82) + grill(8.05, 8.65, 1.72, 2.82);
    s += rect(m(2.3), m(1.62), m(0.4), m(1.9), "none", 0, `stroke="rgba(0,0,0,0.42)" stroke-width="0.6" ${STROKE}`) +
      rect(m(9.25), m(1.62), m(0.65), m(1.9), "none", 0, `stroke="rgba(0,0,0,0.42)" stroke-width="0.6" ${STROKE}`) + line(m(9.2), m(1.7), m(9.2), m(3.4), "#c9cdd1", 0.7) + line(m(9.95), m(1.7), m(9.95), m(3.4), "#c9cdd1", 0.7);
    s += dbLogo(c, m(4.75), m(2.45), m(0.34), { outline: true });
    s += rect(m(6.3), m(3.95), m(1.4), m(0.18), "#4b5056") + rect(m(7.2), m(4.1), m(0.25), m(0.15), "#2a2d31") + cases(m(5.8), m(10.6), m(1.15), 2, m(0.6), "#2c2f35");
    return s;
  }
  add("dwL218", "DB class 218 diesel locomotive", loco218, m(16.4), { kind: "diesel" });

  // Siemens Vectron (class 193): 18.98 m over the buffers, bogie centres
  // 9.5 m, 3.0 m wheelbase, 1,250 mm wheels. Two liveries run for DB Regio
  // here: verkehrsrot (Beacon Rail's 193 041-044, delivered in DB's red,
  // hired for the Kinzigtal, RE 50/RB 51; de.wikipedia "Siemens Vectron")
  // and ELL's graphite with green (the RE 200 Wendlingen–Ulm's pair, 193
  // 242 at Wendlingen: the green line low along the side, rising at the
  // cab). No logos are drawn on the red ones (not seen in a photograph).
  const NOSE_VEC = [[0.43, 1.25], [0.43, 2.22], ["q", 0.44, 2.53, 0.64, 2.74], [0.91, 3.75], ["q", 1.0, 3.93, 1.31, 3.93]];
  function vectron(c, ell) {
    return twin(c, (h) => {
      const L = h.L, first = h.half === 0, body = ell ? "#3a3d41" : DB.red;
      let paint = rect(-1, 0, L + 2, 20, body) + rect(-1, 0, L + 2, m(1.55), ell ? "#2f3236" : "#5f656b") + rect(-1, m(3.6), L + 2, 3, ell ? "#55595e" : "#8d9399");
      if (ell) paint += rect(-1, m(1.55), L + 2, m(0.16), "#58b031") + path(poly(P([[0.3, 1.55], [3.2, 1.55], [3.4, 1.71], [1.0, 1.71], [0.6, 2.6], [0.3, 2.6]])), "#58b031");
      let s = shell(poly([...P(NOSE_VEC), [L / 2 + 0.5, m(3.93)], [L / 2 + 0.5, m(1.25)]]), body, paint);
      s += path(poly(P([[0.66, 2.8], [0.82, 2.8], [1.05, 3.72], [0.9, 3.74]])), C.glass);
      s += rect(m(1.9), m(1.6), m(0.75), m(1.95), "none", 0, `stroke="rgba(0,0,0,0.45)" stroke-width="0.6" ${STROKE} rx="0.15"`) + winM(2.05, 2.5, 2.7, 3.35, 0.12, "#15171a") +
        line(m(1.82), m(1.65), m(1.82), m(3.3), "#c9cdd1", 0.7) + line(m(2.73), m(1.65), m(2.73), m(3.3), "#c9cdd1", 0.7);
      for (const [a, b] of [[3.2, 4.7], [7.0, 8.9]]) s += path(poly(P([[a, 3.9], [a + 0.25, 4.15], [b - 0.25, 4.15], [b, 3.9]])), ell ? "#4a4d52" : "#6d737a", 0.4) + slats(m(a) + 0.4, m(3.93), m(b - a) - 0.8, m(0.18), 0.3, "rgba(0,0,0,0.45)");
      s += lamp(m(0.45), m(1.85), m(0.1), m(0.2)) + T(h, m(3.0), m(1.35), m(0.13), first ? "1" : "2", "#ffffff", { weight: 600 });
      s = truck(m(4.74), { wb: m(3.0), d: 49, kind: "loco", top: m(1.25) }) + cases(m(6.8), m(9.4), m(1.25), 2, m(0.45), "#2c2f35") + rect(m(0.4), m(0.5), m(1.2), m(0.75), "#2a2d31") + s +
        uicBuffers(0, -1, { y: m(1.06), reach: m(0.62) });
      s += pantograph(m(6.0), m(3.93) + 0.05, { up: !first, facing: 1 }) + rect(m(5.2), m(3.88), m(1.6), 0.3, "#5d636c");
      return s;
    });
  }
  add("dwL193", "Siemens Vectron electric locomotive (class 193, hired in, DB red)", (c) => vectron(c, false), m(18.98), { kind: "electric", pan: true });
  add("dwL193Ell", "Siemens Vectron electric locomotive (class 193, ELL)", (c) => vectron(c, true), m(18.98), { kind: "electric", pan: true });

  // Ex-InterCity open coach (Bpmz 291-294) repainted for DB Regio: red
  // above, light grey below, light grey door (the RE 200's cars at
  // Wendlingen; the RE 1's at München, 2024-2025). 26.4 m over the buffers.
  function icCoach(c) {
    const L = c.L, f = 0.45, X = (v) => m(f + v);
    const paint = (g) => rect(-1, 0, L + 2, 20, DB.red) + rect(-1, 0, L + 2, m(1.62), DB.grey) + rect(-1, m(3.72), L + 2, 3, "#a9afb5");
    const over = (g) => {
      let t = "";
      for (const x of [0.5, L / M2F - 2 * f - 1.35]) t += rect(X(x), m(1.12), m(0.85), m(2.3), DB.grey, 0, `stroke="rgba(0,0,0,0.45)" stroke-width="0.6" ${STROKE}`) + winM(f + x + 0.25, f + x + 0.6, 2.4, 3.1, 0.1);
      for (let k = 0; k < 11; k++) { const a = 2.6 + k * 1.92; t += winM(f + a, f + a + 1.55, 2.22, 3.18, 0.1, "#3a0005"); }
      return t + dbLogo(c, X(12.8), m(1.92), m(0.26));
    };
    const under = (g) => truck(X(2.55), { wb: m(2.5), d: 36, top: m(1.12) }) + truck(L - m(f + 2.55), { wb: m(2.5), d: 36, top: m(1.12) }) + cases(X(6), X(19), m(1.12), 3, m(0.5)) +
      uicBuffers(0, -1, { y: m(1.06), reach: m(0.62) }) + uicBuffers(L, 1, { y: m(1.06), reach: m(0.62) });
    return body(c, { sill: m(1.12), roof: m(4.05), x0: X(0), x1: L - m(f), endR: m(0.45), base: DB.red, paint, over, under, ends: [m(1.2), m(3.6)] });
  }
  add("dwIcB", "Ex-InterCity open coach, second class (Bpmz)", icCoach, m(26.4), { kind: "coach" });

  // =================== Škoda 109E3 (DB 102) ===================
  // Škoda 109E3 (DB 102 001-006, 2016): 18.0 m over the buffers, bogie
  // centres 8.7 m, 2.5 m wheelbase, 1,250 mm wheels, 4.275 m tall
  // (de.wikipedia "DB-Baureihe 102"); measured off 102 002 at München Hbf
  // (2022, near broadside) and 102 003's side (InnoTrans 2016), its paint
  // checked on 102 005 at Nürnberg (2025): verkehrsrot over a dark grey
  // frame, the machine room's side in fine horizontal ribs, a small
  // outlined DB logo high on it toward cab 1, "ŠKODA" on the frame;
  // "Wir fahren für das Bahnland Bayern" behind cab 2 (since 2025).
  const NOSE_102 = [[0.42, 0.9], [0.36, 1.4], [0.3, 2.0], ["q", 0.33, 2.44, 0.67, 2.77], [1.22, 3.75], ["q", 1.4, 4.0, 1.8, 4.0]];
  function loco102(c) {
    return twin(c, (h) => {
      const L = h.L, first = h.half === 0, half = L / 2 + 0.5;
      const d = poly([...P(NOSE_102), [m(2.95), m(4.0)], ["q", m(3.1), m(4.0), m(3.1), m(3.9)], [m(3.1), m(3.8)], [half, m(3.8)], [half, m(0.9)]]);
      let paint = rect(-1, 0, L + 2, 20, DB.red) + rect(-1, 0, L + 2, m(1.38), "#6d7378") + rect(m(3.1), m(3.62), L, 3, "#878d93");
      // the ribbed panel, its front edge leaning back at the top
      paint += path(poly(P([[3.35, 1.7], [9.5, 1.7], [9.5, 3.58], [3.15, 3.58]])), "none", 0, 'stroke="rgba(0,0,0,0.25)" stroke-width="0.6" vector-effect="non-scaling-stroke"') +
        lines(seq(1.8, 0.12, 15).map((y) => [m(3.35 - (y - 1.7) * 0.1), m(y), half, m(y)]), "rgba(0,0,0,0.32)", 0.6);
      let s = shell(d, DB.red, paint);
      for (const [a, b] of [[3.3, 4.6], [4.7, 6.0], [6.1, 7.4], [7.5, 8.8]]) s += rect(m(a), m(3.65), m(b - a), m(0.3), "#4f555b", 0, 'rx="0.1"') + slats(m(a) + 0.15, m(3.68), m(b - a) - 0.3, m(0.24), 0.3, "rgba(0,0,0,0.5)");
      s += path(poly(P([[0.72, 2.88], [0.95, 2.88], [1.45, 3.7], [1.25, 3.72]])), C.glass);
      // cab door with its window, grab rails either side
      s += rect(m(1.75), m(1.42), m(0.85), m(2.0), "none", 0, `stroke="rgba(0,0,0,0.42)" stroke-width="0.6" ${STROKE} rx="0.2"`) + winM(1.95, 2.4, 2.75, 3.3, 0.12, "#15171a") +
        line(m(1.68), m(1.5), m(1.68), m(3.2), "#c9cdd1", 0.7) + line(m(2.72), m(1.5), m(2.72), m(3.2), "#c9cdd1", 0.7);
      s += lamp(m(0.32), m(1.75), m(0.1), m(0.2)) + T(h, m(2.2), m(1.12), m(0.13), first ? "1" : "2", "#ffffff", { weight: 600 });
      if (first) s += dbLogo(h, m(4.6), m(3.05), m(0.4), { outline: true }) + T(h, m(6.2), m(1.15), m(0.13), "9180 6 102 00x D-DB", "#ffffff", { weight: 600 });
      else s += T(h, m(5.2), m(1.15), m(0.2), "ŠKODA", "#ffffff", { weight: 700 }) + T(h, m(3.75), m(2.05), m(0.1), "Wir fahren für das", "#ffffff", { weight: 500 }) +
        T(h, m(3.75), m(1.88), m(0.13), "Bahnland Bayern", "#ffffff", { weight: 700 });
      s = truck(m(4.65), { wb: m(2.5), d: 49, kind: "loco", top: m(0.9) }) + cases(m(6.3), m(9.0), m(0.9), 2, m(0.4), "#2c2f35") + rect(m(0.35), m(0.4), m(1.2), m(0.5), "#2a2d31") + s +
        uicBuffers(0, -1, { y: m(1.06), reach: m(0.62) });
      s += pantograph(m(5.6), m(3.95) + 0.05, { up: !first, facing: 1 }) + rect(m(4.8), m(3.9), m(1.6), 0.3, "#5d636c");
      return s;
    });
  }
  add("dwL102", "DB class 102 electric locomotive (Škoda 109E3)", loco102, m(18.0), { kind: "electric", pan: true });

  // =================== Škoda double-deck push-pull cars ===================
  // Škoda's double-deck push-pull sets for the München–Nürnberg-Express
  // (DB 790.0 DBpz, 790.1 DABpz, 770.0 DABpbzf; 2016-2020, six cars and a
  // 102): measured off cab car "Pfeil" at Nürnberg Hbf (broadside, July
  // 2025) and the sets at Ingolstadt (2025). Paint: verkehrsrot, a light
  // grey line at the upper floor (yellow over the first class), light grey
  // along the bottom edge, single light grey door leaves, grey roof; the
  // cab's nose long and raked, dark grey under the lamps.
  const SK = { face: 0.45, yE: 0.73, yL: 0.36, roof: 4.62, line: [3.16, 3.28], low: [1.02, 1.9], up: [3.36, 4.02], door: [0.5, 2.98] };
  const SK_NOSE = [[0.62, 0.73], [0.66, 1.2], [0.72, 1.6], [0.8, 2.2], [0.98, 2.85], [1.3, 3.35], ["q", 1.8, 3.95, 2.6, 4.3], ["q", 3.1, 4.55, 3.8, 4.62]];
  function skDoor(x0, x1) {
    const X0 = m(x0), X1 = m(x1);
    return rect(X0, m(SK.door[0]), X1 - X0, m(SK.door[1] - SK.door[0]), DB.grey, 0, `stroke="rgba(0,0,0,0.45)" stroke-width="0.6" ${STROKE}`) +
      winM(x0 + (x1 - x0) * 0.33, x1 - (x1 - x0) * 0.33, 1.47, 2.4, 0.12);
  }
  function skCar(c, o) {
    const L = c.L, f = SK.face, X = (v) => m(f + v), bl = L / M2F - 2 * f, cab = !!o.cab, low = o.lowSpan;
    const bot = [[0, SK.yE], [low[0] - 0.4, SK.yE], [low[0], SK.yL], [low[1], SK.yL], [low[1] + 0.4, SK.yE], [bl, SK.yE]].map(([x, y]) => [X(x), m(y)]);
    const band = path(poly([...bot.map(([x, y]) => [x, y + m(0.1)]), ...[...bot].reverse().map(([x, y]) => [x, y + m(0.42)])]), DB.grey);
    const paint = (g) => {
      let s = rect(-1, 0, L + 2, 20, DB.red) + rect(-1, 0, L + 2, m(SK.yL + 0.1), "#3d4247") + band + rect(-1, m(SK.line[0]), L + 2, m(SK.line[1] - SK.line[0]), DB.grey);
      if (o.first) s += rect(X(o.first[0]), m(SK.line[0]), m(o.first[1] - o.first[0]), m(SK.line[1] - SK.line[0]), DB.yellow);
      s += rect(-1, m(4.25), L + 2, 4, "#a3a9af") + line(-1, m(4.25), L + 2, m(4.25), "rgba(0,0,0,0.25)", 0.5);
      if (cab) s += path(poly(P([[0, 0.73], [1.2, 0.73], [1.25, 1.12], [0.95, 1.95], [0, 1.95]])), "#4a4f55") + path(poly(P([[2.4, 4.15], [3.6, 4.45], [5, 4.45], [5, 6], [0, 6], [0, 4.0]])), "#a3a9af");
      return s;
    };
    const over = (g) => {
      let s = "";
      for (const [a, b] of o.doors) s += skDoor(f + a, f + b);
      for (const [a, b] of o.endWins || []) s += winM(f + a, f + b, 2.05, 2.95, 0.12);
      for (const [a, b] of o.lower) s += winM(f + a, f + b, SK.low[0], SK.low[1], 0.14);
      for (const [a, b] of o.upper) s += winM(f + a, f + b, SK.up[0], SK.up[1], 0.16);
      for (const [x, k] of o.nums || []) s += (k.includes("1") ? T(c, X(x), m(2.83), m(0.36), "1", "#ffffff", { weight: 700 }) : "") + T(c, X(x), m(2.16), m(0.36), "2", "#ffffff", { weight: 700 });
      s += dbLogo(c, X(o.logo), m(2.48), m(0.3));
      if (cab) {
        s += path(poly(P([[0.84, 2.35], [1.0, 2.86], [1.32, 3.36], [1.55, 3.33], [1.2, 2.84], [1.02, 2.35]])), C.glass);
        s += line(m(3.55), m(3.42), m(1.6), m(0.9), "rgba(0,0,0,0.35)", 0.6);
        s += winM(3.5, 4.12, 2.29, 3.05, 0.12) + lamp(m(0.82), m(1.62), m(0.12), m(0.16));
        s += T(c, X(3.35), m(1.95), m(0.09), "Wir fahren für das", "#ffffff", { weight: 500 }) + T(c, X(3.35), m(1.78), m(0.12), "Bahnland Bayern", "#ffffff", { weight: 700 });
      }
      return s;
    };
    const under = (g) => {
      let s = truck(cab ? m(5.2) : X(2.95), { wb: m(2.5), d: 36, top: m(SK.yE) }) + truck(L - m(f + 2.95), { wb: m(2.5), d: 36, top: m(SK.yE) });
      s += cases(X(low[0] + 1.0), X(low[1] - 1.0), m(SK.yL), 3, m(0.18), "#2c2f35");
      if (!cab) s += uicBuffers(0, -1, { y: m(1.06), reach: m(0.62) });
      else s += uicBuffers(0, -1, { y: m(1.06), reach: m(0.62) });
      return s + uicBuffers(L, 1, { y: m(1.06), reach: m(0.62) });
    };
    const top = (g) => (cab ? grille(m(6.1), m(2.2), m(SK.roof)) : grille(X(0.8), m(1.8), m(SK.roof))) + grille(L - m(f + 2.6), m(1.8), m(SK.roof));
    return body(c, { sill: m(SK.yE), roof: m(SK.roof), x0: X(0), x1: L - m(f), endR: m(0.45), nose: cab ? P(SK_NOSE) : null, bottom: bot, base: DB.red, paint, over, under, top,
      ends: [m(SK.yE + 0.15), m(SK.roof - 0.5)] });
  }
  // Window rows (metres from the body's left end): the low floor's wide
  // windows between the doors.
  const skRows = (a, b, w, pitch) => { const out = []; for (let x = a; x + w <= b + 0.01; x += pitch) out.push([x, x + w]); return out; };
  const SK_MID = { doors: [[4.55, 5.85], [20.05, 21.35]], lowSpan: [4.5, 21.4], endWins: [[1.0, 2.6], [23.3, 24.9]],
    lower: skRows(6.35, 19.6, 1.3, 1.66), upper: skRows(5.0, 21.1, 1.42, 1.66), nums: [[6.15, "2"], [19.75, "2"]], logo: 13.0 };
  add("dwSkMid", "Škoda double-deck car, second class (DBpz 790.0)", (c) => skCar(c, SK_MID), m(26.8), { kind: "coach" });
  add("dwSkEnd", "Škoda double-deck end car, first and second class (DABpz 790.1)", (c) => skCar(c, { ...SK_MID, first: [14.0, 21.1], nums: [[6.15, "2"], [19.75, "12"]] }), m(26.8),
    { kind: "coach", amenities: ["first"] });
  addCab("dwSkCab", "Škoda double-deck cab car, first and second class (DABpbzf 770.0)", (c) => skCar(c, { cab: true, doors: [[7.15, 8.8], [20.55, 21.85]], lowSpan: [7.1, 21.9],
    lower: skRows(9.9, 20.1, 1.3, 1.66), upper: skRows(9.4, 21.4, 1.42, 1.66), endWins: [[4.75, 5.95], [23.8, 25.4]], nums: [[9.25, "12"], [20.25, "2"]], logo: 11.75, first: [11.9, 21.6] }), m(27.4),
    { kind: "coach", cab: true, amenities: ["first"] });

  // =================== Sets ===================
  const SETS = {
    // RE 1 (München–Ingolstadt–Nürnberg).
    mnx102: set("München–Nürnberg-Express: a class 102 and Škoda's six double-deck cars, the cab car at the other end", ["dwL102", 1], ["dwSkEnd", 1], ["dwSkMid", 4], ["dwSkCabR", 1]),
    // RE 2 Karlsruhe–Konstanz, RE 5 Stuttgart–Friedrichshafen (146.2, four
    // cars); RE 2 Düsseldorf–Münster–Osnabrück, RE 42 (146.1, five); RE 2
    // München–Regensburg–Hof (146.2); RE 20/RB 22 Frankfurt–Limburg, RE 30
    // Kassel–Frankfurt (146 or 114, six); RE 50/RB 51 Kinzigtal.
    dd146x4: set("A class 146 with four double-deck cars, the cab car at the other end", ["dwL146", 1], ["dwDdFirst", 1], ["dwDdMid", 2], ["dwDdCabR", 1]),
    dd146x5: set("A class 146 with five double-deck cars, the cab car at the other end", ["dwL146", 1], ["dwDdFirst", 1], ["dwDdMid", 3], ["dwDdCabR", 1]),
    dd146x6: set("A class 146 with six double-deck cars, the cab car at the other end", ["dwL146", 1], ["dwDdFirst", 1], ["dwDdMid", 4], ["dwDdCabR", 1]),
    // RE 9 Aachen–Köln–Siegen (147 and five cars since December 2025).
    dd147x5: set("A class 147 with five double-deck cars, the cab car at the other end", ["dwL147", 1], ["dwDdFirst", 1], ["dwDdMid", 3], ["dwDdCabR", 1]),
    // RE 30, RE 50/RB 51 (Hessen), RE 20/RB 22.
    dd114x6: set("A class 114 with six double-deck cars, the cab car at the other end", ["dwL114", 1], ["dwDdFirst", 1], ["dwDdMid", 4], ["dwDdCabR", 1]),
    // RE 50/RB 51 Kinzigtal: Beacon's Vectrons in DB red.
    dd193x6: set("A Vectron (hired) with six double-deck cars, the cab car at the other end", ["dwL193", 1], ["dwDdFirst", 1], ["dwDdMid", 4], ["dwDdCabR", 1]),
    // Südostbayernbahn München–Mühldorf (RB 40, RE 4, RB 45), Niddertal
    // (RB 34/RB 48), Hochrhein (RE 3 Basel–Singen, three cars).
    dd245x4: set("A class 245 diesel with four double-deck cars, the cab car at the other end", ["dwL245", 1], ["dwDdFirst", 1], ["dwDdMid", 2], ["dwDdCabR", 1]),
    dd245x3: set("A class 245 diesel with three double-deck cars, the cab car at the other end", ["dwL245", 1], ["dwDdMid", 1], ["dwDdFirst", 1], ["dwDdCabR", 1]),
    // RE 2 München–Hof's diesel part, RB 45 Mühldorf–Salzburg.
    dd218x4: set("A class 218 diesel with four double-deck cars, the cab car at the other end", ["dwL218", 1], ["dwDdFirst", 1], ["dwDdMid", 2], ["dwDdCabR", 1]),
    // RE 200 Wendlingen–Ulm: ELL Vectrons at both ends (sandwich), five ex-IC cars.
    re200: set("RE 200: an ELL Vectron at each end and five ex-InterCity cars", ["dwL193Ell", 1], ["dwIcB", 5], ["dwL193Ell", 1]),
  };
  // ---------- Fleets: [first, last, key] over the 12-digit EVN ----------
  // Locomotives "91 80 6146 2xx-c" (the class in digits 5-8), diesels
  // "92 80 1245/1218", the double-deck cars by their UIC type digits
  // (26- second class, 36- first and second, 86-/80- cab cars; de.wikipedia
  // "Liste von Doppelstockwagen der Deutschen Bahn"), the ex-IC Bpmz
  // "61 80 20-..". Beacon's red Vectrons are 193 041-050, ELL's 193 2xx.
  FLEETS.push(ev("91806146", "dwL146"), ev("91806147", "dwL147"), ev("91806114", "dwL114"), ev("91806102", "dwL102"), ev("92801245", "dwL245"), ev("92801218", "dwL218"),
    [918061930400, 918061930509, "dwL193"], [918061932000, 918061932999, "dwL193Ell"],
    [508026000000, 508026999999, "dwDdMid"], [508036000000, 508036999999, "dwDdFirst"], [508086000000, 508086999999, "dwDdCab"], [508080350000, 508080359999, "dwDdCab"],
    [618020000000, 618021999999, "dwIcB"]);

  // ---------- Fact sheets ----------
  const LIST = `${DEWP}Liste_von_Doppelstockwagen_der_Deutschen_Bahn`;
  const DDF = { model: "Bombardier double-deck coach", builder: "Bombardier Transportation (Görlitz)", built: "1994–2017", topSpeedMph: 99, source: LIST };
  const SKF = { model: "Škoda double-deck push-pull coach", builder: "Škoda Transportation (Ostrava)", built: "2016–2020", fleet: "36 cars in six sets", topSpeedMph: 118,
    source: `${DEWP}München-Nürnberg-Express` };
  Object.assign(FACTS, {
    dwDdMid: { ...DDF, type: "Double-deck coach, second class (DBpza)", lengthFt: 87.9, about: "A second-class double-deck car, the mainstay of DB Regio's locomotive-hauled trains: the low floor between the doors, a raised end over each bogie." },
    dwDdFirst: { ...DDF, type: "Double-deck coach, first and second class (DABpza)", lengthFt: 87.9, about: "A double-deck car with first class at one end of the upper deck, marked by the yellow line under its windows." },
    dwDdCab: { ...DDF, type: "Double-deck cab car (DABpbzfa)", lengthFt: 89.5, about: "The cab car closing a push-pull train, the locomotive pushing from the other end: first class upstairs behind the cab, bicycles and wheelchair places below." },
    dwDdCabR: { ...DDF, type: "Double-deck cab car (DABpbzfa)", lengthFt: 89.5, about: "The cab car closing a push-pull train, the locomotive pushing from the other end." },
    dwSkMid: { ...SKF, type: "Double-deck coach, second class (DBpz 790.0)", lengthFt: 87.9, about: "A second-class car of the München–Nürnberg-Express's Škoda sets, built for 190 km/h on the high-speed line through Ingolstadt." },
    dwSkEnd: { ...SKF, type: "Double-deck coach, first and second class (DABpz 790.1)", lengthFt: 87.9, about: "The set's car next to the locomotive, with its few first-class seats upstairs." },
    dwSkCab: { ...SKF, type: "Double-deck cab car (DABpbzf 770.0)", lengthFt: 89.9, about: "The Škoda set's cab car, each named (\u201cPfeil\u201d and others); the class 102 pushes from the other end." },
    dwSkCabR: { ...SKF, type: "Double-deck cab car (DABpbzf 770.0)", lengthFt: 89.9, about: "The Škoda set's cab car; the class 102 pushes from the other end." },
    dwL146: { model: "Bombardier TRAXX P160 AC1/AC2 (DB 146)", type: "Electric locomotive", builder: "Bombardier Transportation (Kassel)", built: "2001–2006", fleet: "146 001–032, 101–132, 201–282",
      topSpeedMph: 99, powerHp: 7500, lengthFt: 62.0, source: `${DEWP}Bombardier_Traxx`, about: "DB Regio's standard locomotive for its double-deck push-pull trains." },
    dwL147: { model: "Bombardier TRAXX P160 AC3 (DB 147)", type: "Electric locomotive", builder: "Bombardier Transportation (Kassel)", built: "2015–2020", topSpeedMph: 99, powerHp: 7500, lengthFt: 62.0,
      source: `${DEWP}Bombardier_Traxx`, about: "The TRAXX's third generation; class 147s work the Rhein-Sieg-Express (RE 9) since December 2025." },
    dwL245: { model: "Bombardier TRAXX P160 DE ME (DB 245)", type: "Diesel-electric locomotive", builder: "Bombardier Transportation (Kassel)", built: "2013–2016", fleet: "245 001–037 (with gaps)",
      topSpeedMph: 99, powerHp: 3000, lengthFt: 62.0, source: `${DEWP}Bombardier_Traxx`, about: "Four engines that start and stop with the load; on the Südostbayernbahn, the Hochrhein and the Niddertal." },
    dwL218: { model: "DB class 218", type: "Diesel-hydraulic locomotive", builder: "Krupp, Henschel, MaK", built: "1971–1979", topSpeedMph: 87, powerHp: 2500, lengthFt: 53.8,
      source: `${DEWP}DB-Baureihe_218`, about: "The last of West Germany's classic diesels still hauling DB Regio's trains in Bavaria." },
    dwL114: { model: "DB class 114 (ex-DR 112)", type: "Electric locomotive", builder: "LEW Hennigsdorf", built: "1990–1992", topSpeedMph: 99, powerHp: 4960, lengthFt: 54.6,
      source: `${DEWP}DR-Baureihe_243`, about: "The 143 family's 160 km/h version, hauling double-deck trains in Hessen." },
    dwL102: { model: "Škoda 109E3 (DB 102)", type: "Electric locomotive", builder: "Škoda Transportation (Plzeň)", built: "2016", fleet: "6 (102 001–006)", topSpeedMph: 124, powerHp: 8580, lengthFt: 59.1,
      source: `${DEWP}DB-Baureihe_102`, about: "Built with Škoda's coaches for the München–Nürnberg-Express; in service since 2020." },
    dwL193: { model: "Siemens Vectron AC (class 193)", type: "Electric locomotive", builder: "Siemens Mobility (München-Allach)", built: "2024–2025", topSpeedMph: 124, powerHp: 8580, lengthFt: 62.3,
      source: `${DEWP}Siemens_Vectron`, about: "Hired from Beacon Rail in DB's red for the Kinzigtal's double-deck trains." },
    dwL193Ell: { model: "Siemens Vectron AC (class 193, ELL)", type: "Electric locomotive", builder: "Siemens Mobility (München-Allach)", built: "2017–2022", topSpeedMph: 124, powerHp: 8580, lengthFt: 62.3,
      source: `${DEWP}Siemens_Vectron`, about: "European Locomotive Leasing's Vectrons work the RE 200 Wendlingen–Ulm in pairs, one at each end, over the 250 km/h line." },
    dwIcB: { model: "Bpmz (ex-InterCity open coach)", type: "Passenger coach, second class", builder: "Various", built: "1970s–1990s (rebuilt)", topSpeedMph: 124, lengthFt: 86.6,
      source: `${DEWP}Bpmz-Wagen_der_Deutschen_Bundesbahn`, about: "Former InterCity cars repainted for DB Regio, used on the RE 200 Wendlingen–Ulm." },
  });
  FACTS.dwDdBike ??= { ...FACTS.dwDdMid, about: "A second-class double-deck car with a multi-purpose area on the lower deck for bicycles, prams and wheelchairs." };
  return { TYPES, MODELS, SETS, FACTS, FLEETS };
});


// =====================================================================
// DIESEL UNITS: 612, 642, Talent (643/644), LINT 27/41/54/81, Pesa Link,
// Regio-Shuttle, 628, 641
// =====================================================================
const PART_DMU = safe("dmu", () => {
  const { TYPES, MODELS, add, addCab } = registry();
  const FT = M2F;
  // ---------- Shared pieces (feet unless a name says metres) ----------
  const G = { lg: DB.grey, skirt: "#4a4f54", slate: "#555b61", ink: "#2b2f33", roofG: "#a3a9ae", bwW: "#ebece8", bwY: "#ffd400", bwK: "#1f201e", bwG: "#3b3d3c" };
  // A car body in feet, its cab on the left (nose: outline points bottom
  // to roof, feet). o: sill, roof, nose, bottom, base, paint(g), wins
  // [[x0, x1, y0, y1, r]], doors [{ x, w, y0, y1, fill, k, glass }],
  // trucks [[x, wb, d]], under(g), top(g), over(g), coupler (height, ft).
  function car(c, o) {
    const L = c.L;
    return body(c, {
      sill: o.sill, roof: o.roof, nose: o.nose, bottom: o.bottom, base: o.base, x0: o.x0, endR: o.endR ?? 0.9, ends: o.ends,
      paint: (g) => o.paint(g),
      under: (g) => (o.trucks || []).map(([x, wb, d, top]) => truck(x, { wb, d, top: top ?? o.truckTop ?? o.sill })).join("") + (o.under ? o.under(g) : "") +
        (o.nose ? autoCoupler(o.nose[0][0] + 0.3, o.coupler ?? 2.75) : ""),
      over: (g) => (o.wins || []).map(([a, b, y0, y1, r = 0.3, fr]) => pane(a, y0, b - a, y1 - y0, r, fr || "#1b1e22")).join("") +
        (o.doors || []).map((d) => leaves(d.x, d.w, d.y0, d.y1, d.fill, { k: d.k ?? 2, glass: d.glass || [0.42, 0.88], gw: d.gw ?? 0.5, r: 0.25 })).join("") +
        (o.over ? o.over(g) : ""),
      top: (g) => (o.top ? o.top(g) : ""),
    });
  }
  const W = (xs, w, y0, y1, r) => xs.map((x) => [x, x + w, y0, y1, r]);
  // The windshield: its dark surround and the glass, a wiper resting on it
  // (pts: the glass outline, feet).
  const screen = (pts, frame = "#16191c", grow = 0.35) => {
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    const big = pts.map(([x, y]) => [x + Math.sign(x - cx) * grow, y + Math.sign(y - cy) * grow]);
    return path(poly(big), frame) + path(poly(pts), C.glass) + path(poly(pts.map(([x, y]) => [x, y]).slice(0, 2).concat(pts.slice(0, 2).reverse().map(([x, y]) => [x + 0.4, y]))), "rgba(255,255,255,0.08)");
  };
  // Head and tail lamps on the nose's face at height y (feet), x the lamp's front.
  const lamps = (x, y) => lamp(x, y, 0.32, 0.42) + lamp(x + 0.05, y - 0.7, 0.26, 0.3, RED_LAMP);
  // "REGIO DB": the word in white, the logo outlined beside it.
  const regio = (c, x, y, h, fill = "#ffffff") => T(c, x - h * 0.95, y, h, "REGIO", fill, { weight: 700, family: NARROW, spacing: -0.02 * h }) + dbLogo(c, x + h * 1.15, y, h * 1.05, { outline: true });
  const num = (c, x, y, t, fill = "#ffffff", h = 1.0) => T(c, x, y, h, t, fill, { weight: 600 });
  const firstBar = (x0, x1, y, h = 0.28) => rect(x0, y, x1 - x0, h, DB.yellow);
  // bwegt: "bw" in black and "egt" in yellow, the lion before it, the line
  // "Mobilität für Baden-Württemberg" under it.
  const lion = (c, x, y, h, fill) => markAt(c, x, y, h, `<path d="M-0.55 0.2L-0.4 -0.05L-0.15 -0.12L0.05 -0.3L0.2 -0.25L0.25 -0.1L0.45 -0.05L0.55 0.12L0.3 0.12L0.15 0.25L-0.3 0.25Z" fill="${fill}"/>`);
  const bwegt = (c, x, y, h, ink = G.bwK) => lion(c, x - h * 1.25, y + h * 0.05, h * 0.75, ink) +
    T(c, x - h * 0.65, y, h, `bw<tspan fill="#e6b800">egt</tspan>`, ink, { weight: 600, anchor: "start", spacing: -0.02 * h }) +
    T(c, x - h * 1.6, y - h * 0.62, h * 0.2, "Mobilität für Baden-Württemberg", ink, { weight: 500, anchor: "start" });
  const bwDb = (c, x, y, h) => dbLogo(c, x, y, h);
  // Bavaria's mark (2020-): "Wir fahren für das" small, "Bahnland Bayern",
  // a thin zigzag arrow beside it.
  const bahnland = (c, x, y, h) => markAt(c, x + h * 0.95, y, h, '<path d="M-0.15 0.9L0.25 0.35L-0.1 -0.1L0.3 -0.7" fill="none" stroke="#fff" stroke-width="0.07"/><path d="M0.12 -0.75L0.3 -0.7L0.28 -0.52" fill="none" stroke="#fff" stroke-width="0.07"/>') +
    T(c, x - h * 0.55, y + h * 0.15, h * 0.28, "Bahnland", "#ffffff", { weight: 700, anchor: "start" }) + T(c, x - h * 0.55, y - h * 0.2, h * 0.28, "Bayern", "#ffffff", { weight: 700, anchor: "start" }) +
    T(c, x - h * 1.3, y + h * 0.05, h * 0.15, "Wir fahren", "#ffffff", { weight: 500, anchor: "start" }) + T(c, x - h * 1.3, y - h * 0.15, h * 0.15, "für das", "#ffffff", { weight: 500, anchor: "start" });
  const roofBox = (x, w, roof, h = 0.7, fill = "#9aa1a8") => fairing(x, w, roof, h, fill, 3);
  // The Regio-S-Bahn Donau-Iller's mark: a dot and "RS", "Regio-S-Bahn" under it.
  const rsMark = (c, x, y, h) => circle(x - h * 0.75, y + h * 0.3, h * 0.12, "#ffffff") + T(c, x, y, h, "RS", "#ffffff", { weight: 800, spacing: -0.05 * h }) +
    T(c, x, y - h * 0.65, h * 0.2, "Regio-S-Bahn", "#ffffff", { weight: 600 });

  // =================== 612 RegioSwinger ===================
  // Two cars of 25.875 m (51.75 m over the couplers), 4.12 m over the roof
  // gear, the floor 1.29 m up; tilting; a single-leaf plug door behind the
  // cab and one by the inner end; the first class (24 seats) at the inner
  // end of one car, under a yellow bar. 890 mm wheels (de.wikipedia "DB-
  // Baureihe 612 (1998)"; photographs at Jena-Göschwitz 2024, Immenstadt
  // 2025, Ulm 2025, Basel Bad Bf 2024).
  const S612 = { sill: m(1.0), roof: m(3.86), win: [m(1.95), m(2.95)], door: [m(1.06), m(3.12)] };
  const NOSE_612 = P([[0.62, 0.6], [0.28, 0.85], [0.2, 1.55], ["q", 0.2, 1.98, 0.42, 2.18], [0.95, 3.5], ["q", 1.22, 3.86, 2.2, 3.86]]);
  const GLASS_612 = P([[0.47, 2.25], [0.98, 3.42], [1.75, 3.55], [1.75, 2.25]]);
  function v612(c, { liv, first }) {
    const L = c.L, [w0, w1] = S612.win, bw = liv === "bw";
    const wins = [...W([m(4.05), m(5.45)], m(1.12), w0, w1, 0.5), [m(8.9), m(10.5), m(1.85), m(3.0), 0.55], [m(12.5), m(13.85), w0, w1, 0.5],
      ...W(seq(m(14.3), m(1.3), 6), m(0.98), w0, w1, 0.45), [m(23.62), m(24.32), w0, w1, 0.4], [m(24.55), m(25.25), w0, w1, 0.4]];
    const doors = [{ x: m(7.15), w: m(1.22), y0: S612.door[0], y1: S612.door[1], fill: bw ? G.bwY : G.lg, k: 1, gw: 0.62 },
      { x: m(22.15), w: m(1.22), y0: S612.door[0], y1: S612.door[1], fill: bw ? G.bwY : G.lg, k: 1, gw: 0.62 }];
    const cabWin = path(poly(P([[2.0, 1.95], [2.72, 3.34], [3.25, 3.34], [3.25, 1.95]])), "#16191c") + path(poly(P([[2.07, 2.0], [2.75, 3.28], [3.19, 3.28], [3.19, 2.0]])), C.glass);
    const paint = (g) => {
      let s;
      if (bw) {
        s = rect(-1, 0, L + 2, 20, G.bwW) + rect(-1, 0, L + 2, m(1.3), G.bwK) + rect(-1, m(3.7), L + 2, 2, "#c9ccc8");
        // The dark panels the windows sit in.
        s += rect(m(3.85), w0 - 0.5, m(2.9), w1 - w0 + 1.0, G.bwG, 0, 'rx="0.5"') + rect(m(8.75), w0 - 0.75, m(1.9), w1 - w0 + 1.5, G.bwG, 0, 'rx="0.5"') +
          rect(m(12.35), w0 - 0.5, m(9.6), w1 - w0 + 1.0, G.bwG, 0, 'rx="0.5"') + rect(m(23.45), w0 - 0.5, m(1.95), w1 - w0 + 1.0, G.bwG, 0, 'rx="0.5"');
        // Yellow round the cab: over the windshield and down the nose,
        // the cab's side white behind a slanting edge.
        s += path(poly(P([[-0.2, 0.6], [0.95, 0.6], [0.95, 1.5], [1.75, 2.2], [2.0, 3.3], [2.9, 3.62], [3.9, 3.9], [-0.2, 3.9]])), G.bwY);
      } else {
        s = rect(-1, 0, L + 2, 20, DB.red) + rect(-1, 0, L + 2, m(1.4), G.lg) + rect(-1, 0, L + 2, m(1.12), "#62696f") +
          rect(m(3.3), m(3.42), L, m(0.1), G.lg) + rect(-1, m(3.74), L + 2, 2, "#c3c7ca");
        // The cab front: grey round the windshield, its lower panel dark.

        if (first) s += firstBar(m(23.5), m(25.4), w1 + 0.55, 0.32);
      }
      return s + screen(GLASS_612, bw ? "#1f201e" : "#7d848a", bw ? 0.25 : 0.5) + cabWin;
    };
    const over = (g) => {
      let s = lamps(m(0.25), m(1.3));
      if (bw) s += bwegt(c, m(2.75), m(1.62), 1.25) + bikeSign(m(9.7), m(1.55), 1.7, "#e6b800") + bwDb(c, m(11.4), m(1.65), 1.0) + num(c, m(6.9), w1 - 0.4, "2", "#1f201e", 0.9) +
        lion(c, m(17.5), m(1.62), 2.6, "#c9ccc8") + bwegt(c, m(15.5), m(1.62), 0.8);
      else {
        s += (first ? num(c, m(23.3), w1 - 0.4, "1", "#ffffff", 0.9) : "") + num(c, m(11.5), w1 - 0.1, "2", "#ffffff", 1.15) + num(c, m(6.85), w1 - 0.4, "2", "#ffffff", 0.75);
        s += liv === "by" ? bahnland(c, m(3.0), m(1.6), 2.0) + dbLogo(c, m(16.5), m(1.62), 0.6, { outline: true }) : regio(c, m(20.0), m(1.62), 1.0);
        s += bikeSign(m(9.7), m(1.45), 1.8, "#ffffff");
      }
      return s + dbLogo(c, m(0.75), m(1.4), 0.62);
    };
    const top = (g) => roofBox(m(3.4), m(3.2), S612.roof, 0.75) + exhaust(L - m(7.8), S612.roof, 2.6) + roofBox(L - m(6.2), m(4.8), S612.roof, 0.6, "#a3a9ae");
    return car(c, { sill: S612.sill, roof: S612.roof, nose: NOSE_612, base: bw ? G.bwW : DB.red, bottom: P([[2.1, 0.6], [2.4, 1.0]]),
      trucks: [[m(4.15), 8.2, 35], [L - m(4.15), 8.2, 35]], wins, doors, paint, over, top, coupler: m(0.85),
      under: (g) => cases(m(6.6), L - m(6.6), S612.sill, 3, m(0.5)) });
  }

  // =================== 642 Desiro Classic ===================
  // Two halves on a shared Jakobs truck, 41.7 m over the couplers, the
  // low floor (575 mm) through the middle, a double door a side in each
  // half; the windows in a slate band; red, a light grey line over the
  // dark skirt (photographs: 642 073 at Würzbach 2025, Bad Kreuznach
  // 2025, Kassel 2026, Öhringen 2026). First class behind one cab.
  const S642 = { sill: m(0.42), roof: m(3.83), band: [m(1.6), m(3.02)], win: [m(1.72), m(2.92)] };
  const NOSE_642 = P([[1.0, 0.42], [0.38, 0.6], [0.24, 1.0], ["q", 0.24, 1.45, 0.62, 1.72], [2.15, 3.32], ["q", 2.75, 3.83, 4.0, 3.83]]);
  const GLASS_642 = P([[0.66, 1.78], [2.12, 3.27], [2.7, 3.55], [3.0, 3.6], [3.0, 1.78]]);
  function d642(c, { first, liv }) {
    const L = c.L, [b0, b1] = S642.band, [w0, w1] = S642.win;
    const wins = [...W([m(3.9), m(5.55), m(7.2)], m(1.4), w0, w1, 0.4), [m(8.85), m(9.75), w0, w1, 0.4], [m(11.85), m(13.0), w0, w1, 0.4],
      ...W([m(13.25), m(14.8), m(16.35), m(17.9)], m(1.3), w0, w1, 0.4), [m(19.45), m(20.3), w0, w1, 0.4]];
    const doors = [{ x: m(10.15), w: m(1.3), y0: m(0.6), y1: m(3.0), fill: G.lg }];
    const paint = (g) => {
      let s = rect(-1, 0, L + 2, 20, DB.red) + rect(-1, 0, L + 2, m(0.8), G.lg) + rect(-1, 0, L + 2, m(0.62), G.skirt) +
        rect(m(2.4), b0, L, b1 - b0, G.slate) + rect(-1, m(3.66), L + 2, 2, "#b9bec2");
      // The nose: dark grey under the light grey line, grey round the glass.
      s += path(poly(P([[0, 1.55], [0.9, 1.55], [2.4, 3.3], [3.3, 3.86], [0, 3.86]])), "#5d6368");
      if (first) s += firstBar(m(3.9), m(6.95), b1 + 0.15, 0.3);
      return s + path(poly(GLASS_642), C.glass) + path(poly(P([[2.4, 1.75], [3.45, 2.95], [3.6, 2.95], [3.6, 1.75]])), "#1d2024") + path(poly(P([[2.48, 1.8], [3.45, 2.9], [3.55, 2.9], [3.55, 1.8]])), C.glass);
    };
    const over = (g) => {
      let s = lamps(m(0.25), m(1.2)) + dbLogo(c, m(0.72), m(1.38), 0.55) + dbLogo(c, m(7.0), m(1.25), 0.55) +
        num(c, m(5.4), w1 - 0.9, first ? "1" : "2", "#ffffff", 0.8) + num(c, m(11.65), w1 - 0.9, "2", "#ffffff", 0.8) + bikeSign(m(12.4), m(1.95), 1.3);
      if (liv === "wfb") s += T(c, m(7.2), m(1.2), m(0.34), "WestFrankenBahn", "#ffffff", { weight: 800, italic: true, spacing: -0.01 * m(0.34), family: SANS });
      if (liv === "khb") s += T(c, m(3.6), m(1.3), 0.62, "Kurhessenbahn", "#ffffff", { weight: 600, italic: true });
      return s;
    };
    const top = (g) => roofBox(m(4.4), m(3.4), S642.roof, 0.75) + exhaust(m(9.0), S642.roof, 2.2) + roofBox(m(14.0), m(4.6), S642.roof, 0.65, "#a3a9ae");
    return car(c, { sill: S642.sill, roof: S642.roof, nose: NOSE_642, base: DB.red, bottom: [[m(2.4), m(0.42)], [m(2.55), m(0.92)], [m(4.7), m(0.92)], [m(4.85), m(0.42)], [L - m(1.6), m(0.42)], [L - m(1.45), m(0.92)], [L - 0.35, m(0.92)]],
      trucks: [[m(3.6), 7.2, 30, m(0.92)], [L, 7.9, 30, m(0.92)]], wins, doors, paint, over, top, coupler: m(0.75),
      under: (g) => cases(m(5.2), m(9.8), S642.sill + 0.1, 2, m(0.2)) });
  }

  // =================== Talent (643, 644) ===================
  // Bombardier Talent: end cars of 17.3 m on a motor truck under the cab
  // and Jakobs trucks between the cars; 643.0/644 three cars (48.4 m),
  // 643.2 two (34.6 m); the floor 1.19 m over the trucks, 590 mm at the
  // doors; one double door a side in each car (DB's Talents: red, the
  // lower body light grey, the windows black: 643 005 at Pirmasens 2025,
  // 643 072 at Münster 2024; euregiobahn's 643.2: violet and orange).
  const S643 = { sill: m(0.55), roof: m(3.84), win: [m(1.5), m(2.92)] };
  const NOSE_643 = [[2.0, 1.9], ["q", 0.6, 1.9, 0.45, 3.4], [0.45, 4.4], ["q", 0.5, 5.6, 1.1, 6.4], [3.2, 11.3], ["q", 4.5, 12.6, 7.2, 12.6]];
  const GLASS_643 = [[1.25, 6.6], [3.2, 11.0], [4.6, 11.85], [6.4, 11.95], [6.4, 6.6]];
  const EU = { violet: "#3e3a8f", orange: "#ef4b24" };
  function talentPaint(c, L, cab, liv) {
    if (liv === "eu") {
      let s = rect(-1, 0, L + 2, 20, EU.violet) + rect(-1, S643.win[1] + 0.5, L + 2, 6, EU.orange) + rect(-1, 0, L + 2, m(0.95), "#b9bec2") + rect(-1, 0, L + 2, m(0.62), "#5c6267");
      if (cab) s += path(poly(P([[0, 0.9], [2.4, 0.9], [3.1, 3.9], [0, 3.9]])), EU.orange);
      return s;
    }
    let s = rect(-1, 0, L + 2, 20, DB.red) + rect(-1, 0, L + 2, m(1.1), G.lg) + rect(-1, 0, L + 2, m(0.66), "#7a8187") + rect(-1, m(3.66), L + 2, 2, "#c3c7ca");
    return s;
  }
  function talent(c, { kind, liv }) {
    const L = c.L, [w0, w1] = S643.win, cab = kind === "end";
    let wins, doors, trucks, bottom;
    if (cab) {
      wins = [[m(3.55), m(5.0), w0, w1, 0.3], ...W([m(5.2), m(7.2)], m(1.6), w0, w1, 0.3), ...W([m(11.2), m(13.2), m(15.2)], m(1.6), w0, w1, 0.3)];
      doors = [{ x: m(9.25), w: m(1.3), y0: m(0.62), y1: m(3.02), fill: liv === "eu" ? "#c9ced2" : G.lg }];
      trucks = [[m(2.6), 8.2, 30, m(1.0)], [L, 8.86, 30, m(1.0)]];
      bottom = [[m(1.6), m(0.55)], [m(1.75), m(1.0)], [m(3.5), m(1.0)], [m(3.65), m(0.55)], [L - m(1.1), m(0.55)], [L - m(0.95), m(1.0)], [L - 0.35, m(1.0)]];
    } else {
      wins = [...W([m(0.45), m(2.2), m(3.95)], m(1.55), w0, w1, 0.3), ...W([m(7.6), m(9.35), m(11.1)], m(1.55), w0, w1, 0.3)].filter(([a, b]) => b < L - 0.3);
      doors = [{ x: m(5.95), w: m(1.3), y0: m(0.62), y1: m(3.02), fill: liv === "eu" ? "#c9ced2" : G.lg }];
      trucks = [[0, 8.86, 30, m(1.0)], [L, 8.86, 30, m(1.0)]];
      bottom = [[0.3, m(1.0)], [m(0.95), m(1.0)], [m(1.1), m(0.55)], [L - m(1.1), m(0.55)], [L - m(0.95), m(1.0)], [L - 0.35, m(1.0)]];
    }
    const paint = (g) => talentPaint(c, L, cab, liv) + rect(cab ? m(2.9) : -1, w0 - 0.25, L + 2, w1 - w0 + 0.5, "#1c1f23") + (cab ? screen(GLASS_643, "#16191c", 0.35) + path(poly([[6.4, 4.6], [10.6, 4.6], [10.6, 11.9], [6.4, 11.9]]), "#16191c") + pane(7.6, 6.9, 2.2, 3.6, 0.35) : "");
    const over = (g) => {
      let s = num(c, (cab ? m(9.25) : m(5.95)) - 0.6, w1 - 0.7, "2", "#ffffff", 0.75);
      if (cab) s += lamps(0.55, 4.6) + dbLogo(c, 2.2, 5.3, 0.62) + (liv === "eu" ? T(c, m(5.0), m(1.25), 1.05, "euregiobahn", "#ffffff", { weight: 500 }) : dbLogo(c, m(6.0), m(1.25), 0.6));
      else if (liv !== "eu") s += bikeSign(m(8.4), m(1.85), 1.3);
      return s;
    };
    const top = (g) => cab ? roofBox(m(3.0), m(3.0), S643.roof, 0.7) + exhaust(m(7.5), S643.roof, 2.4) : roofBox(m(4.0), m(4.0), S643.roof, 0.65, "#a3a9ae");
    return car(c, { sill: S643.sill, roof: S643.roof, nose: cab ? NOSE_643 : null, base: DB.red, bottom, x0: cab ? undefined : 0.3,
      trucks, wins, doors, paint, over, top, coupler: 2.75, under: (g) => cases(m(4.0), m(9.5), m(1.0), 2, m(0.35)) });
  }

  // =================== Coradia LINT ===================
  // LINT 27 (640): one car of 27.26 m on two trucks; LINT 41 (648, 623):
  // two cars of 20.9 m on a shared Jakobs truck, one double door a side in
  // each at the low floor; LINT 54 (622): two cars of 27.1 m, each on two
  // trucks of its own; LINT 81 (620): three such cars. Body 4.0 m high
  // (4.31-4.34 m over the roof gear). DB's paint: red, a light grey line
  // along the roof edge and a light grey band over the dark skirt, the
  // cab grey round the windshield (622 055 at Senden 2026; 620 534 at
  // Urft 2026, the Dieselnetz Köln's "vareo" lettering).
  const SL = { roof: 13.1, sill: 2.5, low: 1.6, win: [5.6, 10.4] };
  const NOSE_LINT = [[1.9, 2.4], [1.3, 3.0], [1.25, 4.6], [1.4, 6.4], [1.75, 8.2], [2.3, 9.8], [3.1, 11.2], [4.2, 12.3], [5.6, 12.9], [7.4, 13.1]];
  const GLASS_LINT = [[1.75, 8.0], [2.25, 9.6], [3.0, 10.9], [4.1, 11.95], [5.5, 12.5], [6.6, 12.6], [6.6, 8.2]];
  function lintPaint(c, L, cab, liv) {
    let s = rect(-1, 0, L + 2, 20, DB.red) + rect(-1, 0, L + 2, 4.1, G.lg) + rect(-1, 0, L + 2, 3.35, "#5d6368") + (liv === "db41" ? "" : rect(cab ? 7.8 : -1, 11.0, L + 2, 0.5, G.lg)) + rect(-1, 12.75, L + 2, 2, "#c3c7ca");
    if (cab) s += path(poly([[0, 7.2], [2.4, 7.2], [8.4, 13.2], [0, 13.2]]), "#7d848a") +
      path(poly([[2.0, 7.4], [11.0, 6.0], [11.0, 12.0], [4.2, 12.0]]), "#16191c") + path(poly([[7.2, 7.0], [10.5, 6.6], [10.5, 11.4], [8.8, 11.4]]), C.glass);
    if (liv === "vareo" && !cab) s += path(poly([[L * 0.35, 4.1], [L * 0.55, 4.1], [L * 0.47, 10.6]]), "#c4000c") + path(poly([[L * 0.5, 4.1], [L * 0.66, 4.1], [L * 0.6, 8.6]]), "#d2000d");
    if (liv === "vareo" && cab) s += path(poly([[9.0, 4.1], [21.0, 4.1], [14.0, 11.4]]), "#c4000c") + path(poly([[15.0, 4.1], [24.0, 4.1], [19.5, 9.0]]), "#d2000d");
    return s;
  }
  function lintCar(c, { kind, liv, wins, doors, trucks, bottom, top, marks }) {
    const L = c.L, cab = kind !== "mid";
    return car(c, { sill: SL.sill, roof: SL.roof, nose: cab ? NOSE_LINT : null, base: DB.red, bottom, x0: cab ? undefined : 0.3,
      trucks, wins: wins.map(([a, b, y0 = SL.win[0], y1 = SL.win[1]]) => [a, b, y0, y1, 0.3]),
      doors: doors.map((x) => ({ x, w: 4.3, y0: 1.9, y1: 10.6, fill: G.lg })),
      paint: (g) => lintPaint(c, L, cab, liv) + (cab ? path(poly(GLASS_LINT), C.glass) : ""),
      over: (g) => (cab ? lamps(1.3, 5.2) + dbLogo(c, 3.5, 6.6, 0.62) : "") + (marks ? marks(g) : ""),
      top, coupler: 3.1, under: (g) => cases(cab ? 16 : 8, cab ? 30 : 20, SL.sill, 2, 1.0) });
  }
  // LINT 41 section (68.7 ft): the nlregio.cars.js layout (photographed).
  const lint41 = (c, { liv, first, mark }) => lintCar(c, { kind: "end", liv,
    wins: [[12.6, 18.4], [19.4, 24.6], [25.6, 29.8], [37.6, 43.0], [44.0, 49.4], [50.4, 55.8], [56.8, 62.2]],
    doors: [31.4], trucks: [[13.0, 8.2, 30], [c.L, 8.86, 30]], bottom: [[2.4, 2.5], [21.6, 2.5], [22.4, 1.6], [56.2, 1.6], [57.0, 2.5]],
    top: () => roofBox(4.5, 8.0, SL.roof, 0.8) + hvac2(22.0, 9.0) + roofBox(56.0, 9.0, SL.roof, 0.8) + exhaust(52.0, SL.roof, 1.2),
    marks: (g) => num(c, 30.4, 9.7, "2", "#ffffff", 0.8) + num(c, 36.8, 9.7, "2", "#ffffff", 0.8) +
      regio(c, 40.5, 4.85, 0.85) + (mark ? mark(c) : "") });
  const hvac2 = (x, w) => fairing(x, w, SL.roof, 0.7, "#9aa0a6", 3);
  // LINT 54/81 car (88.9 ft): cab, two windows, a door, two windows, a
  // door, four windows (620 534 at Urft, 2026); the middle car of a LINT 81
  // the same between two plain ends. The low floor between the doors.
  const L54W = [[13.2, 17.6], [18.6, 23.0], [30.2, 34.6], [35.6, 40.0], [47.2, 52.2], [53.4, 58.4], [59.6, 64.6], [65.8, 70.8], [72.0, 77.0], [78.2, 83.2], [84.4, 87.2]];
  const lint54 = (c, { liv, kind = "end", first }) => lintCar(c, { kind, liv,
    wins: kind === "mid" ? [[1.4, 5.4], [6.6, 11.6], [12.8, 17.8], [18.6, 23.0], [30.2, 34.6], [35.6, 40.0], [47.2, 52.2], [53.4, 58.4], [59.6, 64.6], [65.8, 70.8], [72.0, 77.0], [78.2, 83.2], [84.4, 87.4]]
      : L54W,
    doors: [24.4, 41.4], trucks: [[11.5, 8.2, 30], [c.L - 11.5, 8.2, 30]],
    bottom: [[2.4, 2.5], [21.6, 2.5], [22.4, 1.6], [46.8, 1.6], [47.6, 2.5]],
    top: () => (kind === "mid" ? "" : roofBox(4.5, 8.0, SL.roof, 0.8)) + hvac2(26.0, 10.0) + roofBox(60.0, 12.0, SL.roof, 0.8) + exhaust(74.0, SL.roof, 1.2),
    marks: (g) => num(c, 23.4, 9.7, "2", "#ffffff", 0.8) + num(c, 40.4, 9.7, "2", "#ffffff", 0.8) +
      bikeSign(43.6, 6.2, 1.3) + (liv === "vareo" && kind === "mid" ? regio(c, 30.5, 4.85, 0.85) : liv === "vareo" ? T(c, 17.0, 6.1, 1.7, "vareo", "#ffffff", { weight: 300, spacing: "0.08em" }) + T(c, 17.0, 4.95, 0.33, "DER ZUG FÜR DIE REGION", "#ffffff", { weight: 500 }) + regio(c, 30.5, 4.85, 0.85)
        : liv === "rs" ? rsMark(c, 12.3, 8.9, 1.0) + bahnland(c, 12.0, 5.2, 1.6) : regio(c, 30.5, 4.85, 0.85)) });
  const lint27 = (c) => lintCar(c, { kind: "end", liv: "db",
    wins: [[8.4, 10.8, 6.6, 10.4], [13.6, 18.4], [19.4, 24.2], [37.4, 42.2], [43.2, 48.0], [49.0, 53.8], [54.8, 59.6], [60.6, 65.4], [66.4, 71.2], [72.2, 77.0], [78.0, 80.4, 6.6, 10.4]],
    doors: [27.6], trucks: [[13.0, 8.2, 30], [c.L - 13.0, 8.2, 30]], bottom: [[2.4, 2.5], [21.2, 2.5], [22.0, 1.6], [36.2, 1.6], [37.0, 2.5]],
    top: () => roofBox(4.5, 8.0, SL.roof, 0.8) + hvac2(40.0, 10.0) + exhaust(60.0, SL.roof, 1.2),
    marks: (g) => num(c, 26.6, 9.7, "2", "#ffffff", 0.8) + regio(c, 48.0, 4.85, 0.85) });

  // =================== Pesa Link II (632) and III (633) ===================
  // Two (43.7 m) or three cars (58.4 m) on Jakobs trucks, a powered truck
  // under each cab; a long rounded nose under a wraparound windshield; one
  // double door a side in each car; red, the nose grey, a light grey band
  // over the dark grey skirt, the windows in one dark band; first class
  // behind one cab under a yellow bar (633 030 at Ulm, 2025; 632s at
  // Arnsberg and Urberach 2026). Layout from ČD's Link II (czechia.cars.js).
  const NOSE_PL = [[1.5, 2.4], [1.15, 5.2], ["q", 1.2, 7.4, 2.7, 8.9], [5.2, 12.8], ["q", 6.1, 14.04, 8.0, 14.04]];
  const GLASS_PL = [[2.95, 8.95], [5.25, 12.5], [7.4, 13.0], [7.4, 8.95]];
  const SPL = { roof: 14.04, sill: 2.4, win: [6.5, 10.1] };
  function link(c, { kind, first }) {
    const L = c.L, cab = kind === "end";
    const wins = cab ? [...W(seq(13.6, 5.8, 4), 4.8, 6.5, 10.1, 0.4), [36.8, 38.8, 6.5, 10.1, 0.4], ...W([46.8, 52.6, 58.4, 64.2], 4.8, 6.5, 10.1, 0.4)].filter(([a, b]) => b < L - 0.6)
      : [...W(seq(1.0, 5.8, 3), 4.8, 6.5, 10.1, 0.4), ...W(seq(24.6, 5.8, 4), 4.8, 6.5, 10.1, 0.4)].filter(([a, b]) => b < L - 0.6);
    const doorX = cab ? 40.0 : 18.4;
    const paint = (g) => {
      let s = rect(-1, 0, L + 2, 20, DB.red) + rect(-1, 0, L + 2, 4.2, G.lg) + rect(-1, 0, L + 2, 3.3, "#5d6368") + rect(cab ? 9.0 : -1, 11.35, L + 2, 0.3, G.lg) + rect(-1, 13.55, L + 2, 2, "#c3c7ca");
      if (cab) s += path(poly([[0, 5.4], [2.6, 5.4], ["q", 8.0, 6.2, 9.4, 14.2], [0, 14.2]]), "#6d747a") + path(poly(GLASS_PL), C.glass) +
        (first ? firstBar(13.0, 25.0, 11.35, 0.3) : "");
      return s;
    };
    const over = (g) => (cab ? lamps(1.2, 5.2) + dbLogo(c, 3.0, 9.6, 0.7) + num(c, doorX - 1.0, 9.4, first ? "1" : "2", "#ffffff", 0.8) : bikeSign(doorX - 3.5, 5.3, 1.3)) +
      num(c, doorX + 5.4, 9.4, "2", "#ffffff", 0.8) + (cab ? dbLogo(c, 30.0, 5.2, 0.55) : "");
    const top = (g) => (cab ? roofBox(14.0, 12.0, SPL.roof, 0.8) + exhaust(34.0, SPL.roof, 2.0) : roofBox(8.0, 10.0, SPL.roof, 0.75));
    const cabDoor = cab ? leaves(9.4, 2.6, 3.0, 11.0, DB.red, { k: 1, glass: [0.45, 0.9], gw: 0.6, r: 0.3 }) + line(9.1, 5.0, 9.1, 9.5, "#c9cdd0", 0.8) + line(12.3, 5.0, 12.3, 9.5, "#c9cdd0", 0.8) : "";
    return car(c, { sill: SPL.sill, roof: SPL.roof, nose: cab ? NOSE_PL : null, base: DB.red, x0: cab ? undefined : 0.3, over: (g) => cabDoor + over(g),
      trucks: cab ? [[10.0, 7.9, 30], [L, 9.5, 30]] : [[0, 9.5, 30], [L, 9.5, 30]], wins,
      doors: [{ x: doorX, w: 4.4, y0: 2.45, y1: 10.6, fill: G.lg }], paint, top, coupler: 3.0, under: (g) => cases(cab ? 16 : 6, cab ? 36 : 16, SPL.sill, 2, 1.0) });
  }

  // =================== Regio-Shuttle RS1 (650) ===================
  // One car of 25.5 m, a cab at each end, a motor truck under each end, the
  // low floor between them, two double doors a side (czechia.cars.js's
  // layout). DB red with a light grey band, or bwegt's white, black and
  // yellow (650 315 at Bad Wurzach 2025; 650s at Radolfzell 2025, Günzburg
  // 2024).
  const NOSE_RS1 = [[1.1, 3.6], [1.0, 6.0], ["q", 1.1, 7.6, 2.2, 8.6], [4.0, 12.2], ["q", 4.7, 13.1, 6.4, 13.1]];
  const GLASS_RS1 = [[2.3, 8.7], [4.05, 12.0], [5.6, 12.4], [5.6, 8.7]];
  function rs1Half(c, liv) {
    const L = c.L, bw = liv === "bw";
    const paint = (g) => {
      let s;
      if (bw) s = rect(-1, 0, L + 2, 20, G.bwW) + rect(-1, 0, L + 2, 4.6, G.bwK) + rect(-1, 12.2, L + 2, 2, G.bwY) + rect(8.6, 5.9, L, 4.6, G.bwG, 0, 'rx="0.4"') +
        path(poly([[0, 3.6], [3.4, 3.6], [4.6, 8.4], [7.6, 12.2], [7.6, 13.2], [0, 13.2]]), G.bwY);
      else s = rect(-1, 0, L + 2, 20, DB.red) + rect(-1, 0, L + 2, 4.6, G.lg) + rect(-1, 0, L + 2, 3.9, "#5d6368") + rect(8.6, 5.95, L, 4.5, "#2a2e33", 0, 'rx="0.4"') + rect(-1, 12.3, L + 2, 2, "#c3c7ca") +
        path(poly([[0, 6.0], [2.6, 6.0], [7.2, 13.2], [0, 13.2]]), "#6d747a");
      return s + path(poly(GLASS_RS1), C.glass);
    };
    const doorFill = bw ? G.bwY : G.lg;
    return car(c, { sill: 3.6, roof: 13.1, nose: NOSE_RS1, base: bw ? G.bwW : DB.red, bottom: [[2.0, 3.6], [16.4, 3.6], [16.8, 2.0], [L + 1, 2.0]],
      trucks: [[8.4, 6.5, 30]], wins: [[9.4, 14.0, 6.3, 10.0, 0.4], [23.6, 28.2, 6.3, 10.0, 0.4], [29.4, 34.0, 6.3, 10.0, 0.4], [35.2, L + 1, 6.3, 10.0, 0.4]],
      doors: [{ x: 17.6, w: 4.4, y0: 2.1, y1: 10.3, fill: doorFill }], paint,
      over: (g) => lamps(1.0, 4.9) + (bw ? dbLogo(c, 3.2, 6.0, 0.75) + bwegt(c, 11.5, 4.9, 0.95, "#ffffff") + bikeSign(26.0, 4.3, 1.5, "#e6b800")
        : dbLogo(c, 3.2, 6.0, 0.7) + regio(c, 28.0, 5.0, 0.8) + num(c, 23.0, 9.4, "2", "#ffffff", 0.8)),
      top: (g) => fairing(9.0, 9.0, 13.1, 0.75, bw ? "#d8d0a0" : "#9aa0a6") + exhaust(19.0, 13.1, 1.6), coupler: 3.0, under: (g) => cases(10.5, 16.0, 3.6, 1, 1.2) });
  }
  // A double-ended car: its left half, and the same half mirrored.
  function twin(c, half) {
    const L = c.L, id = newId(), id2 = newId();
    const clip = (k) => `<clipPath id="${k}"><rect x="-5" y="-5" width="${n(L / 2 + 5.08)}" height="40"/></clipPath>`;
    const mm = { ...c, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: c.coupledL };
    return clip(id) + clip(id2) + `<g clip-path="url(#${id})">${half({ ...c, coupledR: false })}</g>` + `<g transform="matrix(-1 0 0 1 ${n(L)} 0)"><g clip-path="url(#${id2})">${half({ ...mm, coupledR: false })}</g></g>`;
  }

  // =================== 628.4 ===================
  // Two cars (628 + 928) of 22.94 m over the buffers, trucks 15.1 m apart,
  // floor 1.22 m; a single-leaf door behind each cab and a buffer beam;
  // red, the light grey band low and a line over the windows, the cab face
  // light grey above a red band (628 685 at Wörth 2025, Passau 2026).
  const S628 = { sill: m(0.78), roof: m(4.0), win: [m(1.95), m(2.9)] };
  const NOSE_628 = P([[0.45, 0.78], [0.38, 1.05], [0.36, 2.15], ["q", 0.37, 2.45, 0.55, 2.62], [0.95, 3.75], ["q", 1.08, 4.0, 1.5, 4.0]]);
  const GLASS_628 = P([[0.6, 2.62], [0.96, 3.6], [1.3, 3.66], [1.3, 2.62]]);
  function v628(c, { first }) {
    const L = c.L, [w0, w1] = S628.win;
    const paint = (g) => rect(-1, 0, L + 2, 20, DB.red) + rect(-1, 0, L + 2, m(1.45), G.lg) + rect(-1, 0, L + 2, m(1.08), "#5d6368") + rect(m(4.4), m(3.3), L, m(0.1), G.lg) +
      rect(-1, m(3.82), L + 2, 2, "#c3c7ca") +
      // The cab face: light grey above the lamps' red band.
      path(poly(P([[0, 2.05], [1.45, 2.05], [1.45, 4.1], [0, 4.1]])), "#c2c7cb") + path(poly(GLASS_628), C.glass) +
      path(poly(P([[1.5, 2.0], [1.75, 3.35], [3.05, 3.35], [3.05, 2.0]])), "#1d2024") + path(poly(P([[1.57, 2.06], [1.8, 3.29], [2.99, 3.29], [2.99, 2.06]])), C.glass) +
      (first ? firstBar(m(8.7), m(11.5), m(3.0), 0.35) : "");
    const wins = [[m(5.45), m(6.95), m(1.85), m(3.0), 0.5], ...W(seq(m(8.75), m(1.42), 10), m(1.02), w0, w1, 0.45).filter(([a, b]) => b < L - m(0.6))];
    return car(c, { sill: S628.sill, roof: S628.roof, nose: NOSE_628, base: DB.red, x0: 0.5,
      trucks: [[m(3.9), 8.2, 33, m(1.05)], [L - m(3.9), 8.2, 33, m(1.05)]], wins,
      doors: [{ x: m(3.2), w: m(1.15), y0: m(0.85), y1: m(3.25), fill: G.lg, k: 1, gw: 0.62 }], paint,
      over: (g) => lamps(m(0.3), m(1.55)) + dbLogo(c, m(0.75), m(1.42), 0.65) + num(c, m(7.25), w1 - 0.3, "2", "#ffffff", 0.95) + (first ? num(c, m(8.35), w1 - 0.3, "1", "#ffffff", 0.95) : "") +
        bikeSign(m(6.2), m(1.55), 1.6) + dbLogo(c, m(12.2), m(1.55), 0.55, { outline: true }) + uicBuffers(0.15, -1, { y: m(1.05), reach: 1.3 }) +
        rect(m(7.95), m(1.55), m(0.32), m(0.95), "#d5000d", 0.4, 'rx="0.4"'),
      top: (g) => roofBox(m(2.0), m(2.6), S628.roof, 0.7) + (first ? "" : exhaust(L - m(5.4), S628.roof, 2.4)), coupler: m(1.05),
      under: (g) => (first ? cases(m(7.0), m(16.0), m(1.05), 2, m(0.25)) : cases(m(7.0), m(16.0), m(1.05), 3, m(0.4))) });
  }

  // =================== 641 (Coradia A TER) ===================
  // One car of 28.9 m with a cab at each end; from the first-class end:
  // two windows, a double door, the long window band, a door, two windows
  // and the cab's blank side with a small window (641 at the B176 2025,
  // broadside; 641s at Waldshut and Stühlingen 2026). DB red, a light grey
  // line over the dark grey skirt, the cabs' sloping noses.
  const NOSE_641 = P([[0.5, 0.72], [0.22, 0.95], [0.2, 1.25], ["q", 0.25, 1.55, 0.7, 1.8], [2.05, 3.05], ["q", 2.6, 3.55, 3.4, 3.62]]);
  const GLASS_641 = P([[0.75, 1.88], [2.0, 3.0], [2.7, 3.38], [2.7, 1.88]]);
  function a641(c) {
    const L = c.L, w0 = m(1.79), w1 = m(2.86);
    const paint = (g) => rect(-1, 0, L + 2, 20, DB.red) + rect(-1, 0, L + 2, m(1.1), G.lg) + rect(-1, 0, L + 2, m(1.0), "#5d6368") + rect(-1, m(3.45), L + 2, 2, "#b9bec2") + rect(m(3.7), m(3.0), L - m(7.4), m(0.06), G.lg) +
      path(poly(P([[0, 1.6], [1.1, 1.6], [3.0, 3.25], [3.7, 3.7], [0, 3.7]])), "#5d6368") + path(poly(GLASS_641), C.glass) +
      firstBar(L - m(5.25), L - m(3.0), w1 + 0.4, 0.32);
    const wins = [[m(3.75), m(4.3), m(2.25), m(2.75), 0.25], ...W([m(5.95), m(8.35)], m(2.05), w0, w1, 0.4), [m(14.5), m(21.1), w0, w1, 0.4], ...W([L - m(5.25), L - m(4.0)], m(1.15), w0, w1, 0.4)];
    const s = car(c, { sill: m(0.72), roof: m(3.62), nose: NOSE_641, base: DB.red, bottom: P([[2.0, 0.72], [2.3, 1.0], [5.0, 1.0], [5.2, 0.72]]),
      trucks: [[m(3.4), 6.9, 30, m(1.0)], [L - m(3.4), 6.9, 30, m(1.0)]], wins,
      doors: [{ x: m(12.4), w: m(1.55), y0: m(0.5), y1: m(2.63), fill: G.lg }, { x: m(21.3), w: m(1.55), y0: m(0.5), y1: m(2.63), fill: G.lg }], paint,
      over: (g) => lamps(m(0.22), m(1.08)) + dbLogo(c, m(0.6), m(1.3), 0.55) + regio(c, m(9.0), m(1.42), 0.85) + num(c, m(11.9), w1 - 0.5, "2", "#ffffff", 0.8) +
        num(c, L - m(6.0), w1 - 0.5, "2", "#ffffff", 0.8) + num(c, L - m(6.6), w1 - 0.5, "1", "#ffffff", 0.8),
      top: (g) => roofBox(m(6.0), m(4.0), m(3.62), 0.6) + exhaust(m(15.0), m(3.62), 2.0) + roofBox(L - m(10.0), m(4.0), m(3.62), 0.6), coupler: m(0.9),
      under: (g) => cases(m(6.0), m(12.0), m(0.72), 2, m(0.2)) });
    return s;
  }
  // A car with a cab at both ends: the whole car drawn with its cab on the
  // left, its right end replaced by the same cab mirrored (cut: the cab's
  // length, ft).
  function bothCabs(c, draw, cut) {
    const L = c.L, a = newId(), b = newId();
    const mm = { ...c, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: c.coupledL };
    return `<clipPath id="${a}"><rect x="-5" y="-5" width="${n(L - cut + 5.08)}" height="40"/></clipPath><clipPath id="${b}"><rect x="-5" y="-5" width="${n(cut + 5)}" height="40"/></clipPath>` +
      `<g clip-path="url(#${a})">${draw({ ...c, coupledR: false })}</g><g transform="matrix(-1 0 0 1 ${n(L)} 0)"><g clip-path="url(#${b})">${draw({ ...mm, coupledR: false })}</g></g>`;
  }

  // ---------- Tables ----------
  const ft = (metres) => n(metres * FT);
  add("dw612A", "612 RegioSwinger, car with first class (Bavaria)", (c) => v612(c, { liv: "by", first: true }), ft(25.875), { amenities: ["first"] });
  add("dw612B", "612 RegioSwinger, second-class car (Bavaria)", (c) => facingRight(c, (m2) => v612(m2, { liv: "by", first: false })), ft(25.875));
  add("dw612sA", "612 RegioSwinger, car with first class", (c) => v612(c, { liv: "so", first: true }), ft(25.875), { amenities: ["first"] });
  add("dw612sB", "612 RegioSwinger, second-class car", (c) => facingRight(c, (m2) => v612(m2, { liv: "so", first: false })), ft(25.875));
  add("dw612bwA", "612 RegioSwinger (bwegt), car with first class", (c) => v612(c, { liv: "bw", first: true }), ft(25.875), { amenities: ["first"] });
  add("dw612bwB", "612 RegioSwinger (bwegt), second-class car", (c) => facingRight(c, (m2) => v612(m2, { liv: "bw", first: false })), ft(25.875));
  for (const [sfx, liv, nm] of [["", "db", ""], ["wfb", "wfb", " (WestFrankenBahn)"], ["khb", "khb", " (Kurhessenbahn)"]]) {
    add(`dw642${sfx}A`, `642 Desiro Classic${nm}, half with first class`, (c) => d642(c, { first: true, liv }), ft(20.85), { amenities: ["first"] });
    add(`dw642${sfx}B`, `642 Desiro Classic${nm}, second-class half`, (c) => facingRight(c, (m2) => d642(m2, { first: false, liv })), ft(20.85));
  }
  for (const [sfx, liv, nm] of [["", "db", "Talent"], ["eu", "eu", "Talent (euregiobahn)"]]) {
    addCab(`dw643${sfx}`, `${nm} (643) end car`, (c) => talent(c, { kind: "end", liv }), ft(17.3));
    add(`dw643${sfx}Mid`, `${nm} (643) middle car`, (c) => talent(c, { kind: "mid", liv }), ft(13.76));
  }
  addCab("dw644", "Talent (644) end car", (c) => talent(c, { kind: "end", liv: "db" }), ft(17.3));
  add("dw644Mid", "Talent (644) middle car", (c) => talent(c, { kind: "mid", liv: "db" }), ft(13.76));
  add("dw648A", "LINT 41 (648/623), section", (c) => lint41(c, { liv: "db41", first: true }), 68.7);
  add("dw648B", "LINT 41 (648/623), other section", (c) => facingRight(c, (m2) => lint41(m2, { liv: "db41", first: false })), 68.7);
  add("dw622A", "LINT 54 (622), car", (c) => lint54(c, { liv: "db", first: true }), ft(27.1));
  add("dw622B", "LINT 54 (622), other car", (c) => facingRight(c, (m2) => lint54(m2, { liv: "db", first: false })), ft(27.1));
  add("dw622rsA", "LINT 54 (622, Regio-S-Bahn Donau-Iller), car", (c) => lint54(c, { liv: "rs", first: true }), ft(27.1));
  add("dw622rsB", "LINT 54 (622, Regio-S-Bahn Donau-Iller), second-class car", (c) => facingRight(c, (m2) => lint54(m2, { liv: "rs", first: false })), ft(27.1));
  add("dw620A", "LINT 81 (620, vareo), end car", (c) => lint54(c, { liv: "vareo", first: true }), ft(27.1));
  add("dw620Mid", "LINT 81 (620, vareo), middle car", (c) => lint54(c, { liv: "vareo", kind: "mid" }), ft(27.1));
  add("dw620B", "LINT 81 (620, vareo), second-class end car", (c) => facingRight(c, (m2) => lint54(m2, { liv: "vareo", first: false })), ft(27.1));
  add("dw622vA", "LINT 54 (622, vareo), car", (c) => lint54(c, { liv: "vareo", first: true }), ft(27.1));
  add("dw622vB", "LINT 54 (622, vareo), second-class car", (c) => facingRight(c, (m2) => lint54(m2, { liv: "vareo", first: false })), ft(27.1));
  add("dw640", "LINT 27 (640)", (c) => twin(c, (h) => lint27(h)), ft(27.26));
  add("dw633A", "Pesa Link (632/633) end car with first class", (c) => link(c, { kind: "end", first: true }), ft(22.23), { amenities: ["first"] });
  add("dw633Mid", "Pesa Link III (633) middle car", (c) => link(c, { kind: "mid" }), ft(14.0));
  add("dw633B", "Pesa Link (632/633) end car", (c) => facingRight(c, (m2) => link(m2, { kind: "end", first: false })), ft(22.23));
  add("dw650", "Regio-Shuttle RS1 (650)", (c) => twin(c, (h) => rs1Half(h, "db")), ft(25.5));
  add("dw650bw", "Regio-Shuttle RS1 (650, bwegt)", (c) => twin(c, (h) => rs1Half(h, "bw")), ft(25.5));
  add("dw628", "628.4 motor car", (c) => v628(c, { first: false }), ft(22.94), { kind: "emu" });
  add("dw928", "928.4 driving trailer (first class)", (c) => facingRight(c, (m2) => v628(m2, { first: true })), ft(22.94), { amenities: ["first"] });
  add("dw641", "641 (Coradia A TER)", (c) => bothCabs(c, a641, m(2.9)), ft(28.9), { amenities: ["first"] });
  // Plain-railcar kinds: the single cars carry cabs at both ends.
  for (const k of ["dw640", "dw650", "dw650bw", "dw641"]) TYPES[k].cab = true;

  const u2 = (a, b) => [[a, 1], [b, 1]];
  const SETS = {
    dmu612: set("612 RegioSwinger: two tilting cars (often two or three units)", ...u2("dw612A", "dw612B")),
    dmu612x2: set("612 RegioSwinger: two units", ...u2("dw612A", "dw612B"), ...u2("dw612A", "dw612B")),
    dmu612s: set("612 RegioSwinger: two tilting cars", ...u2("dw612sA", "dw612sB")),
    dmu612sx2: set("612 RegioSwinger: two units", ...u2("dw612sA", "dw612sB"), ...u2("dw612sA", "dw612sB")),
    dmu612bw: set("612 RegioSwinger (bwegt): two tilting cars (often two units)", ...u2("dw612bwA", "dw612bwB")),
    dmu612bwx2: set("612 RegioSwinger (bwegt): two units", ...u2("dw612bwA", "dw612bwB"), ...u2("dw612bwA", "dw612bwB")),
    dmu642: set("Desiro Classic (642): two halves (sometimes two units)", ...u2("dw642A", "dw642B")),
    dmu642x2: set("Desiro Classic (642): two units", ...u2("dw642A", "dw642B"), ...u2("dw642A", "dw642B")),
    dmu642wfb: set("Desiro Classic (642, WestFrankenBahn): two halves", ...u2("dw642wfbA", "dw642wfbB")),
    dmu642khb: set("Desiro Classic (642, Kurhessenbahn): two halves", ...u2("dw642khbA", "dw642khbB")),
    dmu643: set("Talent (643): three cars", ["dw643", 1], ["dw643Mid", 1], ["dw643R", 1]),
    dmu643x2: set("Talent (643): two three-car units", ["dw643", 1], ["dw643Mid", 1], ["dw643R", 1], ["dw643", 1], ["dw643Mid", 1], ["dw643R", 1]),
    dmu6432: set("Talent (643.2): two cars", ["dw643", 1], ["dw643R", 1]),
    dmu643eu: set("Talent (643.2, euregiobahn): two cars (often two units)", ["dw643eu", 1], ["dw643euR", 1]),
    dmu644: set("Talent (644): three cars", ["dw644", 1], ["dw644Mid", 1], ["dw644R", 1]),
    dmu648: set("LINT 41 (648/623): two sections", ...u2("dw648A", "dw648B")),
    dmu648x2: set("LINT 41 (648/623): two units", ...u2("dw648A", "dw648B"), ...u2("dw648A", "dw648B")),
    dmu622: set("LINT 54 (622): two cars", ...u2("dw622A", "dw622B")),
    dmu622x2: set("LINT 54 (622): two units", ...u2("dw622A", "dw622B"), ...u2("dw622A", "dw622B")),
    dmu622_648: set("LINT 54 (622) with a LINT 41 (648/623)", ...u2("dw622A", "dw622B"), ...u2("dw648A", "dw648B")),
    dmu622rs: set("LINT 54 (622, Regio-S-Bahn Donau-Iller): two cars", ...u2("dw622rsA", "dw622rsB")),
    dmu620: set("LINT 81 (620, vareo): three cars", ["dw620A", 1], ["dw620Mid", 1], ["dw620B", 1]),
    dmu620_622: set("LINT 81 (620) with a LINT 54 (622), vareo", ["dw620A", 1], ["dw620Mid", 1], ["dw620B", 1], ...u2("dw622vA", "dw622vB")),
    dmu622v: set("LINT 54 (622, vareo): two cars", ...u2("dw622vA", "dw622vB")),
    dmu640: set("LINT 27 (640): one car", ["dw640", 1]),
    dmu640x2: set("LINT 27 (640): two cars", ["dw640", 2]),
    dmu632: set("Pesa Link II (632): two cars", ...u2("dw633A", "dw633B")),
    dmu633: set("Pesa Link III (633): three cars", ["dw633A", 1], ["dw633Mid", 1], ["dw633B", 1]),
    dmu633_632: set("Pesa Link III (633) with a Link II (632)", ["dw633A", 1], ["dw633Mid", 1], ["dw633B", 1], ...u2("dw633A", "dw633B")),
    dmu650: set("Regio-Shuttle RS1 (650): one car (often two)", ["dw650", 1]),
    dmu650x2: set("Regio-Shuttle RS1 (650): two cars", ["dw650", 2]),
    dmu650bw: set("Regio-Shuttle RS1 (650, bwegt): one car (often two)", ["dw650bw", 1]),
    dmu650bwx2: set("Regio-Shuttle RS1 (650, bwegt): two cars", ["dw650bw", 2]),
    dmu628: set("628.4: a motor car and its driving trailer", ["dw628", 1], ["dw928", 1]),
    dmu641: set("641 (Coradia A TER): one car (often two)", ["dw641", 1]),
    dmu641x2: set("641 (Coradia A TER): two cars", ["dw641", 2]),
  };

  // ---------- Fleets (EVN as 12-digit numbers) ----------
  // DB's diesel units: 95 80 0612 001-x (612.0 cars, 001-199) and 0612 5xx
  // (612.5, their mates); 0642 0xx and 5xx (the two halves); 0643/0644 0xx
  // end cars, 0943/0944 middle cars, 0643 5xx the other end; 0648 0xx/1xx/
  // 4xx and 5xx/6xx/9xx (the two sections); 0622/0620 0xx and 5xx end cars,
  // 0620 middle cars as 0620 4xx? (not confirmed: left to the end cars'
  // ranges); 0632/0633 0xx, 0933 middle cars; 0650 0xx-3xx; 0628 and 0928.
  const R = (series, key, lo = 0, hi = 9999) => [958000000000 + series * 10000 + lo, 958000000000 + series * 10000 + hi, key];
  const FLEETS = [
    R(612, "dw612A", 0, 4999), R(612, "dw612B", 5000, 9999),
    R(642, "dw642A", 0, 4999), R(642, "dw642B", 5000, 9999),
    R(643, "dw643", 0, 4999), R(643, "dw643R", 5000, 9999), R(943, "dw643Mid"),
    R(644, "dw644", 0, 4999), R(644, "dw644R", 5000, 9999), R(944, "dw644Mid"),
    R(648, "dw648A", 0, 4999), R(648, "dw648B", 5000, 9999), R(623, "dw648A", 0, 4999), R(623, "dw648B", 5000, 9999),
    R(622, "dw622A", 0, 4999), R(622, "dw622B", 5000, 9999),
    R(620, "dw620A", 0, 4999), R(620, "dw620B", 5000, 9999),
    R(632, "dw633A", 0, 4999), R(632, "dw633B", 5000, 9999), R(633, "dw633A", 0, 4999), R(633, "dw633B", 5000, 9999), R(933, "dw633Mid"),
    R(650, "dw650"), R(640, "dw640"), R(641, "dw641"), R(628, "dw628"), R(928, "dw928"),
  ];

  // ---------- Fact sheets ----------
  const F612 = { model: "Adtranz/Bombardier RegioSwinger (DB class 612)", type: "Tilting diesel multiple unit", builder: "Adtranz Hennigsdorf, Bombardier", built: "1998–2003",
    fleet: "192 two-car units", topSpeedMph: 99, powerHp: 1503, lengthFt: 84.9, source: `${DEWP}DB-Baureihe_612_(1998)` };
  const F642 = { model: "Siemens Desiro Classic (DB class 642)", type: "Diesel multiple unit", builder: "Siemens, Düwag", built: "1999–2008", fleet: "about 230 two-car units at DB",
    topSpeedMph: 75, powerHp: 738, lengthFt: 68.4, source: `${DEWP}Siemens_Desiro_Classic` };
  const F643 = { model: "Bombardier Talent (DB classes 643, 644)", type: "Diesel multiple unit", builder: "Bombardier (Talbot, Aachen)", built: "1996–2004",
    source: `${DEWP}Bombardier_Talent` };
  const FLINT = { model: "Alstom Coradia LINT", type: "Diesel multiple unit", builder: "Alstom (Salzgitter)", built: "1999–2023", topSpeedMph: 87, source: `${DEWP}Alstom_Coradia_LINT` };
  const FLINK = { model: "Pesa Link (DB classes 632, 633)", type: "Diesel multiple unit", builder: "Pesa Bydgoszcz", built: "2016–2022", topSpeedMph: 75, source: `${DEWP}Pesa_Link` };
  const FRS1 = { model: "Stadler Regio-Shuttle RS1 (DB class 650)", type: "Diesel railcar", builder: "Adtranz, Stadler", built: "1996–2014", topSpeedMph: 75, powerHp: 704, lengthFt: 83.7,
    source: `${DEWP}Stadler_Regio-Shuttle_RS1` };
  const F628 = { model: "DB class 628.4", type: "Diesel multiple unit (motor car and driving trailer)", builder: "Duewag, AEG, LHB, MBB", built: "1992–1996", topSpeedMph: 75, powerHp: 650,
    lengthFt: 75.3, source: `${DEWP}DB-Baureihe_628` };
  const F641 = { model: "Alstom Coradia A TER (DB class 641)", type: "Diesel railcar", builder: "Alstom LHB", built: "2001–2002", fleet: "40", topSpeedMph: 75, powerHp: 603, lengthFt: 94.8,
    source: `${DEWP}Alstom_Coradia_A_TER` };
  const FACTS = {
    dw612A: { ...F612, about: "The RegioSwinger's car with first class at its inner end. DB Regio runs them on Bavaria's Allgäu lines (Augsburg/München–Lindau and Oberstdorf), in Franconia and the Upper Palatinate (Nürnberg–Hof, Regensburg, Weiden, Cheb) and on Würzburg–Erfurt." },
    dw612B: { ...F612, about: "The RegioSwinger's second car, second class." },
    dw612sA: { ...F612, about: "A RegioSwinger car with first class, lettered REGIO DB." }, dw612sB: { ...F612, about: "A RegioSwinger second-class car." },
    dw612bwA: { ...F612, about: "A RegioSwinger in Baden-Württemberg's bwegt paint (Brenzbahn Ulm–Aalen, Hochrhein Basel–Singen–Friedrichshafen, Stuttgart–Tübingen–Aulendorf, the Danube valley Ulm–Donaueschingen)." },
    dw612bwB: { ...F612, about: "The second car of a bwegt RegioSwinger." },
    dw642A: { ...F642, about: "A Desiro Classic's half with first class behind the cab. DB Regio's run in the Palatinate and Saarland, around Mühldorf (Südostbayernbahn) and in Middle Franconia." },
    dw642B: { ...F642, about: "The Desiro Classic's other half, second class." },
    dw642wfbA: { ...F642, about: "A Desiro Classic of DB's WestFrankenBahn (Aschaffenburg–Miltenberg–Crailsheim, the Madonnenland and Kahlgrund lines, Heilbronn–Crailsheim)." }, dw642wfbB: { ...F642, about: "WestFrankenBahn Desiro Classic, second half." },
    dw642khbA: { ...F642, about: "A Desiro Classic of DB's Kurhessenbahn (Kassel–Korbach, Bad Wildungen, Marburg–Brilon, the Upper Lahn valley line)." }, dw642khbB: { ...F642, about: "Kurhessenbahn Desiro Classic, second half." },
    dw643: { ...F643, lengthFt: 56.8, about: "The Talent's end car, its engine under the floor; DB Regio runs them in the Palatinate (Wörth, Landau, Kaiserslautern), in the Münsterland and on the Lahn and Eifel lines." },
    dw643R: { ...F643, lengthFt: 56.8, about: "The Talent's other end car." }, dw643Mid: { ...F643, lengthFt: 45.1, about: "The Talent's middle car, on Jakobs trucks shared with its neighbors." },
    dw643eu: { ...F643, lengthFt: 56.8, about: "A two-car Talent (643.2) of the euregiobahn around Aachen, Stolberg and Düren, in its violet and orange." }, dw643euR: { ...F643, lengthFt: 56.8, about: "The euregiobahn Talent's other car." },
    dw643euMid: { ...F643, lengthFt: 45.1, about: "A euregiobahn Talent middle car." },
    dw644: { ...F643, type: "Diesel-electric multiple unit", lengthFt: 56.8, about: "The diesel-electric Talent (644), in the Cologne, Münster and Eifel networks." },
    dw644R: { ...F643, lengthFt: 56.8, about: "The 644's other end car." }, dw644Mid: { ...F643, lengthFt: 45.1, about: "The 644's middle car, its generator set under the floor." },
    dw648A: { ...FLINT, model: "Alstom Coradia LINT 41 (DB classes 648, 623)", lengthFt: 68.7, about: "A LINT 41 section: Middle Franconia, the Lahn and Eifel lines, the Münsterland, Ulm's Iller valley." },
    dw648B: { ...FLINT, model: "Alstom Coradia LINT 41 (DB classes 648, 623)", lengthFt: 68.7, about: "The LINT 41's other section." },
    dw622A: { ...FLINT, model: "Alstom Coradia LINT 54 (DB class 622)", lengthFt: 88.9, about: "A LINT 54 car: the Cologne diesel network, Rheinhessen and the Palatinate, Ulm's Iller valley." },
    dw622B: { ...FLINT, model: "Alstom Coradia LINT 54 (DB class 622)", lengthFt: 88.9, about: "The LINT 54's other car." },
    dw622vA: { ...FLINT, model: "Alstom Coradia LINT 54 (DB class 622)", lengthFt: 88.9, about: "A LINT 54 of the Cologne diesel network, lettered vareo." }, dw622vB: { ...FLINT, model: "Alstom Coradia LINT 54 (DB class 622)", lengthFt: 88.9, about: "The vareo LINT 54's other car." },
    dw622rsA: { ...FLINT, model: "Alstom Coradia LINT 54 (DB class 622)", lengthFt: 88.9, about: "A LINT 54 of the Regio-S-Bahn Donau-Iller (Ulm–Memmingen, Ulm–Weißenhorn), with Bavaria's \"Bahnland Bayern\" mark." },
    dw622rsB: { ...FLINT, model: "Alstom Coradia LINT 54 (DB class 622)", lengthFt: 88.9, about: "The Regio-S-Bahn LINT 54's other car." },
    dw620A: { ...FLINT, model: "Alstom Coradia LINT 81 (DB class 620)", lengthFt: 88.9, about: "The three-car LINT 81 of the Cologne diesel network (vareo): Köln–Gummersbach–Lüdenscheid, the Eifel lines to Trier, Bonn–Euskirchen." },
    dw620Mid: { ...FLINT, model: "Alstom Coradia LINT 81 (DB class 620)", lengthFt: 88.9, about: "The LINT 81's middle car." }, dw620B: { ...FLINT, model: "Alstom Coradia LINT 81 (DB class 620)", lengthFt: 88.9, about: "The LINT 81's other end car." },
    dw640: { ...FLINT, model: "Alstom Coradia LINT 27 (DB class 640)", type: "Diesel railcar", lengthFt: 89.4, about: "The single-car LINT 27, on the Lahn-Eifel lines." },
    dw633A: { ...FLINK, lengthFt: 72.9, about: "A Pesa Link's cab car with first class: the Sauerland network (Dortmund, Hagen, Winterberg, Brilon), the Dreieich line south of Frankfurt, the Allgäu's Außerfern line and Ulm–Kempten–Oberstdorf." },
    dw633Mid: { ...FLINK, lengthFt: 45.9, about: "The middle car of the three-car Link III (633)." }, dw633B: { ...FLINK, lengthFt: 72.9, about: "The Link's other cab car." },
    dw650: { ...FRS1, about: "The single-car Regio-Shuttle, in DB red: Bavaria's Mittelschwaben line (Günzburg–Krumbach)." },
    dw650bw: { ...FRS1, about: "A Regio-Shuttle in bwegt paint: the Lake Constance and Upper Swabia branches, Radolfzell–Stockach, Tübingen–Horb–Pforzheim, the Teck line." },
    dw628: { ...F628, about: "The 628.4's motor car. The last ones run in the Palatinate (Wörth–Lauterbourg), around Mühldorf and in Upper Swabia." },
    dw928: { ...F628, type: "Driving trailer", about: "The 628's unpowered driving trailer (928), with the first-class seats." },
    dw641: { ...F641, about: "The single-car Coradia A TER on the Hochrhein's local trains (Basel Bad Bf–Waldshut–Lauchringen, Waldshut–Stühlingen)." },
  };
  return { TYPES, MODELS, SETS, FACTS, FLEETS };
});


// =====================================================================
// BOMBARDIER AND ALSTOM ELECTRIC UNITS: Twindexx Vario (445, 446),
// Talent 2 (442 and its bwegt sisters), Talent 3, Coradia Continental
// (440, 1440)
// =====================================================================
const PART_BOMB = safe("bomb", () => {
const { TYPES, MODELS, add, addCab } = registry();
const FACTS = {}, SETS = {}, FLEETS = [];
const BW = { white: "#eef0ee", yellow: "#ffd400", dark: "#33373b", grey: "#54595e", lion: "#9a9ea2", roof: "#b9bdbf", door: "#ffd400" };
const ROOFGREY = "#a8adb2", SKIRT = "#34383c";
// A run of panes: xs (metres) of the left edges, each w wide, y0..y1 (metres).
const panes = (xs, w, y0, y1, r = 0.35, frame) => xs.map((x) => pane(m(x), m(y0), m(w), m(y1 - y0), r, frame)).join("");
// Class numerals as DB prints them beside the doors: a white square plate
// with the black numeral ("2") and a small seat pictogram under it; at a
// first-class door the plate is yellow.
const classPlate = (c, x, y, cls) => rect(m(x), m(y), m(0.22), m(0.36), cls === "1" ? "#f2c200" : "#ffffff", 0, 'rx="0.05"') +
  T(c, m(x + 0.11), m(y + 0.24), m(0.17), cls, "#1d1f22", { weight: 700 }) + rect(m(x + 0.06), m(y + 0.04), m(0.1), m(0.06), "#1d1f22");
// DB's "REGIO" sign: REGIO in white capitals and the DB logo outlined.
const regio = (c, x, y, h, k = c.mirrored ? -1 : 1) => T(c, x - k * h * 0.95, y, h * 0.62, "REGIO", "#ffffff", { weight: 700, spacing: 0.02 * h, anchor: "middle", stretch: 0.92 }) +
  dbLogo(c, x + k * h * 0.75, y, h * 0.78, { outline: true });

// ===================== Twindexx Vario (445, 446) =====================
// Bombardier Twindexx Vario double-deck unit as DB Regio runs it: powered
// double-deck end cars with a cab (445, 25.98 m over the couplers; the
// 446 of the Main-Neckar-Ried network is the same body) and Twindexx
// middle cars (26.8 m), 4.63 m tall (de.wikipedia "Bombardier Twindexx
// Vario"). Measured off near-broadside photographs: 445 049 with its
// middle cars at Thüngen (Main-Spessart-Express, 2024) and 446 024 near
// Frankfurt (Main-Neckar-Ried-Express, August 2025); fronts: 445 062 at
// Offenbach (2025). DB red, a light grey band along the foot of the body
// and round the cab, the roof grey; "REGIO" and the DB mark mid-car, the
// line's name in small white letters over the lower deck.
const TW = { roof: 4.63, top: 4.36, up: [3.32, 4.2], line: [3.06, 3.2], low: [1.2, 2.1], mid: [2.16, 2.99], door: [0.62, 3.02], band: [0.68, 0.9], drop: 0.42, end: 0.98 };
const twBody = (c, o) => {
  const { a, b } = o; // the low part of the body between a and b (metres)
  const bottom = P([[a - 0.25, TW.end], [a, TW.drop], [b, TW.drop], [b + 0.25, TW.end]]);
  return { sill: m(TW.end), roof: m(TW.roof), bottom, base: DB.red, endR: m(0.45) };
};
// The paint common to every Twindexx car: the light grey line under the
// upper deck's windows, the grey band along the foot (stepping down into
// the low middle) with the dark grey under it, and the grey roof.
const twPaint = (g, a, b) => rect(-1, m(TW.top), g.L + 2, 6, ROOFGREY) + rect(-1, m(TW.top - 0.05), g.L + 2, m(0.05), "#d7dadc") +
  rect(-1, m(TW.line[0]), g.L + 2, m(TW.line[1] - TW.line[0]), DB.grey) +
  rect(-1, m(TW.end), m(a) + 1, m(0.22), DB.grey) + rect(m(b), m(TW.end), g.L - m(b) + 1, m(0.22), DB.grey) +
  rect(m(a - 0.2), m(TW.band[0]), m(b - a + 0.4), m(TW.band[1] - TW.band[0]), DB.grey) + rect(m(a - 0.2), m(TW.drop) - 1, m(b - a + 0.4), m(TW.band[0] - TW.drop) + 1, "#5c6166");
// A door: two light grey leaves, a tall narrow window in each.
const twDoor = (x) => leaves(m(x), m(1.4), m(TW.door[0]), m(TW.door[1]), DB.grey, { glass: [0.24, 0.9], gw: 0.32, r: 0.3, seam: "#8c9196" });
const twTrucks = (xs, top = TW.end) => xs.map((x) => truck(m(x), { wb: m(2.5), d: 34, top: m(top) - 0.1 })).join("");
// A louvred panel in the body side (the machine rooms).
const louvre = (x, y, w, h) => rect(m(x), m(y), m(w), m(h), "#c9000e", 0, 'rx="0.15" stroke="rgba(0,0,0,0.25)" stroke-width="0.5" vector-effect="non-scaling-stroke"') +
  slats(m(x) + 0.1, m(y) + 0.1, m(w) - 0.2, m(h) - 0.2, 0.3, "rgba(0,0,0,0.3)");
// The cab nose: the coupler low, the lower front near-upright, the
// windshield raked back to the roof (metres from the coupler face).
const TW_NOSE = [[0.62, TW.end - 0.42], [0.4, 0.75], [0.33, 1.55], ["q", 0.33, 2.25, 0.62, 2.6], [1.45, 4.1], ["q", 1.75, TW.roof, 2.5, TW.roof]];
// A powered end car (445/446), 25.98 m, its cab on the left: the cab
// side window, the front machine room (louvres high and low), a door,
// the low lower deck (four windows behind the door, then the name and
// the DB mark), a door, the rear compartment over the powered truck with
// its pantograph above.
function twPower(c, o = {}) {
  const a = 6.9, b = 19.6;
  const sh = twBody(c, { a, b });
  const nose = P(TW_NOSE);
  const paint = (g) => twPaint(g, a, b) +
    // The front: grey from the roof down round the windshield to the
    // nose's foot, edged white; the grey foot band rises under the cab.
    path(poly(P([[-0.1, TW.roof + 0.2], [3.0, TW.roof + 0.2], [2.85, 4.3], ["q", 2.1, 3.7, 1.65, 2.5], [1.2, 1.0], [-0.1, 1.0]])), DB.grey2) +
    path(`M${m(2.85)} ${m(4.3)}Q${m(2.1)} ${m(3.7)} ${m(1.65)} ${m(2.5)}L${m(1.2)} ${m(1.0)}`, "none", 0, 'stroke="#f0f1f2" stroke-width="0.32"') +
    rect(-1, m(TW.end), m(3.0) + 1, m(0.3), DB.grey) +
    // Under the cab's side window a black wedge sweeps down and forward.
    path(poly(P([[2.42, 2.0], [3.2, 2.0], [3.05, 1.55], ["q", 2.7, 1.4, 2.5, 1.62]])), "#16181b");
  const over = (g) => {
    let s = path(poly(P([[0.7, 2.62], [1.42, 3.98], [1.62, 3.98], [0.98, 2.62]])), "#22262b");
    s += pane(m(2.42), m(1.98), m(0.78), m(1.5), 0.6, "#111316");
    s += lamp(m(0.48), m(1.6), 0.5, 0.36);
    s += louvre(4.1, 3.55, 0.85, 0.65) + louvre(4.0, 1.2, 0.68, 1.35) + louvre(4.72, 1.2, 0.68, 1.35);
    s += twDoor(a - 1.4) + twDoor(b);
    s += panes(seq(a + 0.35, 1.42, 4), 1.27, TW.low[0], TW.low[1], 0.3) + panes(seq(5.55, 1.6, 9), 1.42, TW.up[0], TW.up[1], 0.55);
    s += pane(m(21.2), m(TW.mid[0]), m(0.55), m(TW.mid[1] - TW.mid[0]), 0.3) + louvre(22.5, 1.45, 1.4, 1.35);
    if (o.bayern) s += bahnland(c, 3.62, 1.55);
    if (o.name) s += T(c, m(a + 7.2), m(2.66), m(0.19), o.name, "#ffffff", { weight: 600, italic: true });
    s += bikeSign(m(a + 0.9), m(2.6), m(0.44)) + dbLogo(c, m(a + 2.0), m(2.62), m(0.3), { outline: true }) + rect(m(a + 4.1), m(2.5), m(1.1), m(0.3), "#1d1f22", 0, 'rx="0.08"');
    s += classPlate(c, a - 1.72, 1.9, "2") + classPlate(c, b + 1.5, 1.9, "2");
    return s;
  };
  const under = () => twTrucks([2.9, 23.0]) + cases(m(a + 0.6), m(b - 0.6), m(TW.drop), 2, 0.5) + (c.coupledL ? coupledCouplers(m(0.95)) : autoCoupler(m(0.62), m(0.95)));
  const top = () => fairing(m(3.4), m(2.4), m(TW.roof), 0.5) + fairing(m(9.5), m(5.0), m(TW.roof), 0.4, "#9ca2aa", 4) +
    fairing(m(20.2), m(1.5), m(TW.roof), 0.55) + panGear(m(23.2), m(TW.roof) - 0.05, { up: o.pan !== false, dir: -1 });
  return body(c, { ...sh, nose, paint, over, under, top });
}
// The Bavarian state's mark (BEG): "Wir fahren für das" and "Bahnland
// Bayern" in white beside a white open chevron, x/y the mark's centre.
function bahnland(c, x, y) {
  const h = m(0.8), k = c.mirrored ? -1 : 1;
  x = m(x) / 1; const X = (d) => n(x + k * d);
  return T(c, X(-h * 0.55), m(y) + h * 0.12, h * 0.17, "Wir fahren", "#ffffff", { weight: 500 }) + T(c, X(-h * 0.55), m(y) - h * 0.1, h * 0.17, "für das", "#ffffff", { weight: 500 }) +
    T(c, X(h * 0.32), m(y) + h * 0.12, h * 0.22, "Bahnland", "#ffffff", { weight: 600 }) + T(c, X(h * 0.32), m(y) - h * 0.15, h * 0.22, "Bayern", "#ffffff", { weight: 600 }) +
    markAt(c, X(h * 0.3), m(y), h, '<path d="M-0.12 -0.52L0.5 -0.52L0.5 -0.2M-0.12 0.52L0.5 0.52M0.5 0.2L0.62 0L0.5 -0.2" fill="none" stroke="#fff" stroke-width="0.05"/>');
}
// A middle car, 26.8 m: a door at each end of the low lower deck (eight
// windows between), an end compartment with two windows over each truck.
// o.first: the first-class seats upstairs mid-car, marked by the yellow
// stretch of the line under the upper deck's windows.
function twMid(c, o = {}) {
  const a = 6.2, b = 20.6;
  const sh = twBody(c, { a, b });
  const paint = (g) => twPaint(g, a, b) + (o.first ? rect(m(10.6), m(TW.line[0]), m(7.4), m(TW.line[1] - TW.line[0]), DB.yellow) : "");
  const over = (g) => {
    let s = twDoor(a - 1.4) + twDoor(b);
    s += panes(seq(a + 0.45, 1.72, 8), 1.4, TW.low[0], TW.low[1], 0.3) + panes(seq(2.95, 1.62, 13), 1.4, TW.up[0], TW.up[1], 0.45);
    s += panes([1.25, 2.45], 0.95, TW.mid[0], TW.mid[1], 0.3) + panes([23.4, 24.6], 0.95, TW.mid[0], TW.mid[1], 0.3);
    if (o.regio) s += regio(c, m(10.0), m(2.62), m(0.4));
    if (o.name) s += T(c, m(o.regio ? 10.0 : 12.0), m(o.regio ? 2.32 : 2.68), m(0.18), o.name, "#ffffff", { weight: 600, italic: true });
    if (!o.regio) s += dbLogo(c, m(14.6), m(2.62), m(0.3), { outline: true });
    s += classPlate(c, a - 1.72, 1.9, "2") + classPlate(c, b + 1.5, 1.9, "2");
    if (o.first) s += classPlate(c, b - 0.45, 3.4, "1");
    s += bikeSign(m(2.4), m(1.6), m(0.45)) + wheelchair(c, m(23.5), m(1.62), m(0.42));
    return s;
  };
  const under = () => twTrucks([2.6, 24.2]) + cases(m(a + 0.6), m(b - 0.6), m(TW.drop), 3, 0.5);
  const top = () => fairing(m(0.9), m(2.4), m(TW.roof), 0.35) + fairing(m(23.5), m(2.4), m(TW.roof), 0.35);
  return body(c, { ...sh, paint, over, under, top });
}
{
  const F445 = { model: "Bombardier Twindexx Vario (DB class 445)", type: "Double-deck electric multiple unit", builder: "Bombardier Transportation (Görlitz)", built: "2013–2019",
    topSpeedMph: 99, powerHp: 3084, source: `${DEWP}Bombardier_Twindexx_Vario` };
  const lines = { ms: "Main-Spessart-Express", mnr: "Main-Neckar-Ried-Express" };
  for (const [k, nm, cls, name] of [["Ms", "Main-Spessart-Express", "445", lines.ms], ["Rw", "München–Nürnberg", "445", null], ["Mnr", "Main-Neckar-Ried-Express", "446", lines.mnr]]) {
    addCab(`dw${cls}${k}Cab`, `Twindexx Vario powered end car (class ${cls}, ${nm})`, (c) => twPower(c, { name, bayern: cls === "445", pan: true }), m(25.98), { pan: true });
    FACTS[`dw${cls}${k}Cab`] = { ...F445, model: `Bombardier Twindexx Vario (DB class ${cls})`, lengthFt: m(25.98),
      about: `The powered double-deck end car with the cab; ${cls === "446" ? "the Main-Neckar-Ried network's 3- and 4-car units (446 001–048) have no other powered cars" : "two of them sandwich two or four middle cars"}.` };
  }
  add("dw445Mid", "Twindexx Vario middle car, second class", (c) => twMid(c, { bikes: true }), m(26.8));
  add("dw445MidFirst", "Twindexx Vario middle car, first and second class", (c) => twMid(c, { first: true, mixed: true, regio: true }), m(26.8), { amenities: ["first"] });
  add("dw445MidMs", "Twindexx Vario middle car, first and second class (Main-Spessart-Express)", (c) => twMid(c, { first: true, mixed: true, regio: true, name: lines.ms }), m(26.8), { amenities: ["first"] });
  add("dw446Mid", "Twindexx Vario middle car (Main-Neckar-Ried-Express)", (c) => twMid(c, { bikes: true, name: lines.mnr }), m(26.8));
  add("dw446MidFirst", "Twindexx Vario middle car, first and second class (Main-Neckar-Ried-Express)", (c) => twMid(c, { first: true, mixed: true, name: lines.mnr }), m(26.8), { amenities: ["first"] });
  const FM = { model: "Bombardier Twindexx Vario middle car", type: "Double-deck coach", builder: "Bombardier Transportation (Görlitz)", built: "2013–2019", lengthFt: m(26.8), topSpeedMph: 99, source: `${DEWP}Bombardier_Twindexx_Vario` };
  for (const k of ["dw445Mid", "dw446Mid"]) FACTS[k] = { ...FM, about: "A second-class double-deck middle car, a multi-purpose area for bicycles and wheelchairs at one end." };
  for (const k of ["dw445MidFirst", "dw445MidMs", "dw446MidFirst"]) FACTS[k] = { ...FM, about: "The middle car with the unit's first-class seats (marked by the yellow line under the upper deck's windows) at one end." };
  SETS.dw445Ms = set("Twindexx Vario (Main-Spessart-Express): two powered end cars and two middle cars", ["dw445MsCab", 1], ["dw445MidMs", 1], ["dw445Mid", 1], ["dw445MsCabR", 1]);
  SETS.dw445Rw4 = set("Twindexx Vario (München–Nürnberg): two powered end cars and two middle cars", ["dw445RwCab", 1], ["dw445MidFirst", 1], ["dw445Mid", 1], ["dw445RwCabR", 1]);
  SETS.dw445Rw6 = set("Twindexx Vario (München–Nürnberg): two powered end cars and four middle cars", ["dw445RwCab", 1], ["dw445MidFirst", 1], ["dw445Mid", 3], ["dw445RwCabR", 1]);
  SETS.dw446x3 = set("Twindexx Vario (Main-Neckar-Ried-Express, class 446): three cars", ["dw446MnrCab", 1], ["dw446MidFirst", 1], ["dw446MnrCabR", 1]);
  SETS.dw446x4 = set("Twindexx Vario (Main-Neckar-Ried-Express, class 446): four cars", ["dw446MnrCab", 1], ["dw446MidFirst", 1], ["dw446Mid", 1], ["dw446MnrCabR", 1]);
}


// ===================== Talent 2 (442) =====================
// Bombardier Talent 2: articulated, end cars 20.05 m and middle cars
// 16.1 m over the couplers and joints (2 cars 40.1 m, 3 cars 56.2 m, 4
// cars 72.3 m, 5 cars 88.4 m), 4.26 m tall over the roof gear, floor
// 0.695 m with a raised section behind each cab over the powered truck
// (de.wikipedia "Bombardier Talent 2"). Measured off a broadside of a
// four-car 2442 at Heiterwang (Werdenfelsbahn, 2023) and the bwegt 3442
// 706 and 3442 7xx at Stuttgart and Crailsheim (2023-2024): behind the
// cab the crew door and three windows in the raised section (its window
// band higher), the double door 10.9 m from the nose, three windows in
// the low part; each middle car has its one door near the end-car side.
// DB red: the window band dark grey, a white line along the middle cars
// over it, light grey along the foot, the doors light grey; "REGIO" and
// the DB mark under the raised section's windows; first class (one end
// car's raised section) a yellow line over its windows. bwegt (DB Regio
// Baden-Württemberg's 3442 for the Gäu-Murr lines; DB Regio Stuttgart's
// 8442, ordered by Abellio in the same paint): white, the window band
// dark, yellow along the top of the side and round the cab, yellow doors,
// the lion and "bwegt".
const T2 = { roof: 4.05, sill: 0.45, hiSill: 0.98, hiBand: [2.12, 3.42], hiWin: [2.2, 3.32], loBand: [1.45, 2.9], loWin: [1.53, 2.8], line: [3.04, 3.12], door: [0.72, 3.1], foot: [0.45, 0.75] };
const T2_NOSE = [[0.9, T2.sill + 0.12], [0.4, 0.82], [0.08, 1.3], ["q", -0.02, 1.95, 0.35, 2.5], [0.9, 3.15], ["q", 1.7, T2.roof, 3.0, T2.roof]];
const t2Door = (x, fill) => leaves(m(x), m(1.4), m(T2.door[0]), m(T2.door[1]), fill, { glass: [0.22, 0.9], gw: 0.42, r: 0.25, seam: "rgba(0,0,0,0.4)" });
// Liveries: red, redW (Werdenfelsbahn lettering), bw (bwegt, DB Regio
// BW: the DB mark), bwN (bwegt, no operator's mark).
const isBw = (lv) => lv === "bw" || lv === "bwN";
const T3C = { red: "#e0201b", white: "#f2f3f3" };
const T3_NOSE = [[0.75, T2.sill + 0.05], [0.3, 0.72], [0.12, 1.4], ["q", 0.08, 2.1, 0.35, 2.7], [1.05, 3.6], ["q", 1.75, T2.roof, 3.0, T2.roof]];
// The paint of a Talent 2 car: hi (the raised section's extent, from the
// nose) or null; the low band from a to b.
function t2Paint(g, lv, { hi = null, cab = false, first = false } = {}) {
  const L = g.L;
  if (lv === "t3") {
    let s = rect(-1, -1, L + 2, m(1.08) + 1, T3C.red) + rect(-1, -1, L + 2, m(0.5) + 1, SKIRT);
    if (cab) s += path(poly(P([[-0.2, 2.05], [0.9, 2.05], ["q", 1.6, 2.15, 2.05, 2.75], [2.55, 3.75], ["q", 2.8, 4.2, 3.4, 4.3], [-0.2, 4.3]])), T3C.red) +
      path(poly(P([[-0.2, 2.22], [0.85, 2.22], ["q", 1.45, 2.32, 1.85, 2.85], [2.35, 3.8], ["q", 2.6, 4.2, 3.2, 4.3], [-0.2, 4.3]])), "#16181b") +
      path(poly(P([[2.05, 1.95], [2.35, 3.45], [2.75, 3.45], [2.75, 2.5]])), "#16181b") +
      rect(m(4.15), m(2.0), m(6.1), m(1.62), "#121315", 0, 'rx="0.6"') + rect(m(12.9), m(1.42), m(6.2), m(1.52), "#121315", 0, 'rx="0.6"');
    return s;
  }
  if (!isBw(lv)) {
    let s = rect(-1, m(T2.foot[0]) - 1, L + 2, m(T2.foot[1] - T2.foot[0]) + 1, DB.grey) + rect(-1, m(T2.loBand[0]), L + 2, m(T2.loBand[1] - T2.loBand[0]), DB.dark);
    if (hi) s += rect(-1, m(T2.loBand[0]), m(hi) + 1, m(T2.loBand[1] - T2.loBand[0]), DB.red) + rect(-1, m(T2.hiBand[0]), m(hi) + 1, m(T2.hiBand[1] - T2.hiBand[0]), DB.dark) +
      rect(-1, m(T2.foot[0]) - 1, m(3.9) + 1, m(T2.foot[1] - T2.foot[0]) + 1, DB.red);
    s += rect(hi ? m(hi + 1.6) : -1, m(T2.line[0]), L + 2, m(T2.line[1] - T2.line[0]), "#f3f4f4");
    if (first) s += rect(m(4.0), m(3.42), m(6.1), m(0.09), DB.yellow);
    if (cab) s += path(poly(P([[-0.2, 2.0], [1.2, 2.0], [2.3, 3.42], ["q", 2.7, 3.85, 3.35, 4.3], [-0.2, 4.3]])), DB.dark);
    return s;
  }
  let s = rect(-1, -1, L + 2, m(0.85) + 1, SKIRT) + rect(-1, m(3.62), L + 2, 4, BW.yellow) + rect(-1, m(T2.loBand[0]), L + 2, m(T2.loBand[1] - T2.loBand[0]), BW.dark);
  if (hi) s += rect(-1, m(T2.loBand[0]), m(hi) + 1, m(T2.loBand[1] - T2.loBand[0]), BW.white) +
    path(poly(P([[1.95, 1.72], [2.7, 2.12], [hi, 2.12], [hi, 3.42], [3.25, 3.42], ["q", 2.45, 2.7, 1.95, 1.72]])), BW.dark);
  if (cab) s += path(poly(P([[-0.2, 1.05], [0.75, 1.05], ["q", 1.25, 1.25, 1.6, 2.1], [2.7, 3.62], [3.4, 3.62], [3.4, 4.3], [-0.2, 4.3]])), BW.yellow) +
    path(poly(P([[0.45, 2.2], [1.2, 2.2], [2.35, 3.45], [3.2, 3.75], [2.9, 4.15], [1.1, 3.6]])), "#202326");
  return s;
}
// An end car, 20.05 m, its cab on the left. o: lv, first (the raised
// section first class), pan (a pantograph over the rear joint), up.
function t2End(c, o) {
  const lv = o.lv, bw = isBw(lv), t3 = lv === "t3";
  const nose = P(t3 ? T3_NOSE : T2_NOSE);
  const bottom = P([[1.1, T2.hiSill], [5.6, T2.hiSill], [6.0, T2.sill], [18.6, T2.sill], [19.0, 0.82]]);
  const paint = (g) => t2Paint(g, lv, { hi: 10.85, cab: true, first: o.first });
  const over = (g) => {
    const doorFill = bw ? BW.yellow : t3 ? "#1d1f22" : DB.grey;
    const cd = t3 ? 2.85 : 2.5;
    let s = rect(m(cd), m(1.0), m(0.62), m(2.3), "none", 0, 'rx="0.12" stroke="rgba(0,0,0,0.45)" stroke-width="0.6" vector-effect="non-scaling-stroke"') +
      pane(m(cd + 0.1), m(2.25), m(0.42), m(0.85), 0.15, "#15171a");
    s += t3 ? panes([4.3, 6.35, 8.4], 1.85, 2.08, 3.55, 0.35, "#0e0f11") : panes([4.15, 6.3, 8.4], 1.5, T2.hiWin[0], T2.hiWin[1], 0.3, "#15171a");
    s += t2Door(10.9, doorFill) + panes([13.05, 15.15, 17.4], 1.5, T2.loWin[0], T2.loWin[1], 0.3, "#15171a");
    s += lamp(m(0.25), m(1.45), 0.42, 0.3);
    if (t3) {
      s += bikeSign(m(11.3), m(2.75), m(0.32), "#ffffff");
    } else if (bw) {
      s += bwLion(c, 5.2, 1.3, 0.85) + bwegtWord(c, 7.9, 1.32, 0.58, lv === "bw" ? "DB Regio fährt für" : null);
      if (lv === "bw") s += dbLogo(c, m(16.4), m(1.12), m(0.3));
      s += bikeSign(m(13.6), m(1.12), m(0.55), BW.yellow);
    } else if (!t3) {
      s += regio(c, m(7.0), m(1.72), m(0.38));
      if (lv === "redW") s += T(c, m(7.0), m(1.45), m(0.14), "Werdenfelsbahn", "#ffffff", { weight: 600 }) + T(c, m(15.6), m(3.32), m(0.15), "Für Land und Leute.  www.bahn.de/werdenfelsbahn", "#ffffff", { weight: 600 });
      s += bikeSign(m(13.9), m(1.12), m(0.42));
    }
    s += classPlate(c, 3.75, 2.4, o.first ? "1" : "2") + classPlate(c, 12.5, 1.9, "2");
    return s;
  };
  const under = () => truck(m(3.9), { wb: m(2.3), d: 33, top: m(T2.hiSill) - 0.1 }) + jakobs(c.L, m(0.82), 31, m(2.8)) + cases(m(6.4), m(10.6), m(T2.sill), 2, 0.35) +
    (c.coupledL ? coupledCouplers(m(0.95)) : autoCoupler(m(0.9), m(0.95)));
  const top = () => fairing(m(2.9), m(7.2), m(T2.roof), 0.75, "#6f757b", 4) + fairing(m(10.6), m(3.4), m(T2.roof), 0.55, "#6f757b") +
    (o.pan ? panGear(m(17.6), m(T2.roof), { up: o.up !== false, dir: -1 }) : fairing(m(15.0), m(4.2), m(T2.roof), 0.5, "#6f757b"));
  return body(c, { sill: m(T2.sill), roof: m(T2.roof), nose, bottom, base: bw ? BW.white : t3 ? T3C.white : DB.red, endR: m(0.3), paint, over, under, top });
}
// A middle car, 16.1 m: the door near its left end, a window before it
// and five after.
function t2Mid(c, o) {
  const lv = o.lv, bw = isBw(lv), t3 = lv === "t3";
  const bottom = P([[0.5, 0.82], [1.2, T2.sill], [14.9, T2.sill], [15.6, 0.82]]);
  const paint = (g) => t2Paint(g, lv, {});
  const over = (g) => {
    let s = (t3 ? rect(m(0.85), m(1.42), m(1.8), m(1.52), "#121315", 0, 'rx="0.6"') + rect(m(5.0), m(1.42), m(10.2), m(1.52), "#121315", 0, 'rx="0.6"') : "") +
      pane(m(1.0), m(T2.loWin[0]), m(1.5), m(T2.loWin[1] - T2.loWin[0]), 0.3, "#15171a") + t2Door(3.1, bw ? BW.yellow : t3 ? "#1d1f22" : DB.grey) +
      panes(seq(5.15, 2.08, 5), 1.5, T2.loWin[0], T2.loWin[1], 0.3, "#15171a");
    s += classPlate(c, 4.75, 1.9, "2");
    if (bw) s += bikeSign(m(5.9), m(1.12), m(0.55), BW.yellow) + bwegtWord(c, 9.6, 3.28, 0.52, lv === "bw" ? "DB Regio fährt für" : null) + bwLion(c, 13.2, 3.24, 0.62) +
      (lv === "bw" ? dbLogo(c, m(11.2), m(1.12), m(0.3)) : "");
    else if (lv === "redW") s += T(c, m(9.5), m(3.32), m(0.15), "Für Land und Leute.  www.bahn.de/werdenfelsbahn", "#ffffff", { weight: 600 });
    return s;
  };
  const under = () => jakobs(0, m(0.82), 31, m(2.8)) + jakobs(c.L, m(0.82), 31, m(2.8)) + cases(m(2.0), m(14.0), m(T2.sill), 3, 0.35);
  const top = () => fairing(m(3.0), m(4.2), m(T2.roof), 0.5, "#6f757b") + fairing(m(7.6), m(4.0), m(T2.roof), 0.5, "#6f757b");
  return body(c, { sill: m(T2.sill), roof: m(T2.roof), bottom, base: bw ? BW.white : t3 ? T3C.white : DB.red, x0: 0.3, x1: c.L - 0.3, endR: m(0.3), paint, over, under, top });
}
// bwegt's lion (the state arms' lion, drawn as a grey silhouette of dots)
// and its word mark: "bw" dark, "egt" yellow, "Mobilität für Baden-
// Württemberg" under it; pre: the line over it ("DB Regio fährt für").
function bwLion(c, x, y, h) {
  return markAt(c, m(x), m(y), m(h), '<path d="M-0.9 0.45L-0.7 0.1Q-0.75 -0.2 -0.5 -0.3L-0.45 -0.55Q-0.3 -0.65 -0.2 -0.45L0.1 -0.3Q0.45 -0.35 0.6 -0.1L0.85 -0.35L0.95 -0.2L0.7 0.1L0.75 0.45L0.55 0.45L0.45 0.15L-0.3 0.2L-0.45 0.45Z" fill="#a8acaf" opacity="0.85"/>');
}
function bwegtWord(c, x, y, h, pre) {
  const k = c.mirrored ? -1 : 1;
  let s = T(c, m(x), m(y), m(h), `bw<tspan fill="#e0b400">egt</tspan>`, BW.dark, { weight: 600, spacing: "-0.02em" }) +
    T(c, m(x + k * h * 0.15), m(y - h * 0.5), m(h * 0.17), "Mobilität für Baden-Württemberg", BW.dark, { weight: 500 });
  if (pre) s += T(c, m(x - k * h * 0.9), m(y + h * 0.45), m(h * 0.18), pre, BW.dark, { weight: 600 });
  return s;
}
{
  const F = { model: "Bombardier Talent 2 (DB class 442)", type: "Electric multiple unit", builder: "Bombardier Transportation (Hennigsdorf)", built: "2008–2021", topSpeedMph: 99,
    source: `${DEWP}Bombardier_Talent_2` };
  const LV = { red: "DB Regio", redW: "Werdenfelsbahn", bw: "bwegt, DB Regio Baden-Württemberg", bwN: "bwegt, DB Regio Stuttgart" };
  for (const lv of ["red", "redW", "bw", "bwN"]) {
    const k = { red: "", redW: "W", bw: "Bw", bwN: "Bs" }[lv];
    addCab(`dw442${k}End`, `Talent 2 end car (${LV[lv]})`, (c) => t2End(c, { lv, pan: true }), m(20.05), { pan: true });
    addCab(`dw442${k}End1`, `Talent 2 end car with first class (${LV[lv]})`, (c) => t2End(c, { lv, first: true, pan: true, up: false }), m(20.05), { pan: true, amenities: ["first"] });
    addCab(`dw442${k}Mid`, `Talent 2 middle car (${LV[lv]})`, (c) => t2Mid(c, { lv }), m(16.1));
    FACTS[`dw442${k}End`] = { ...F, lengthFt: m(20.05), about: "An end car with the cab: the crew door, a raised section over the powered truck, then the low-floor part beyond the door." };
    FACTS[`dw442${k}End1`] = { ...F, lengthFt: m(20.05), about: "The end car whose raised section behind the cab is first class (the yellow line over its windows)." };
    FACTS[`dw442${k}Mid`] = { ...F, lengthFt: m(16.1), about: "A low-floor middle car, articulated on shared (Jakobs) trucks; its one double door near the end car." };
  }
  for (const k of ["dw442BwEnd", "dw442BwEnd1", "dw442BwMid"]) FACTS[k] = { ...FACTS[k], model: "Bombardier Talent 2 (DB class 3442)", fleet: "16 four-car units (3442 200–215)", about: FACTS[k].about + " DB Regio Baden-Württemberg's Gäu-Murr units, in the state's bwegt paint." };
  for (const k of ["dw442BsEnd", "dw442BsEnd1", "dw442BsMid"]) FACTS[k] = { ...FACTS[k], model: "Bombardier Talent 2 (class 8442)", fleet: "52 units (26 of three cars, 26 of five), owned by the state (SFBW)", about: FACTS[k].about + " Ordered by Abellio for the Stuttgart networks in bwegt paint, run since 2025 by DB Regio Stuttgart." };
  const F3 = { model: "Alstom (Bombardier) Talent 3 (class 6442)", type: "Electric multiple unit", builder: "Bombardier Transportation / Alstom (Hennigsdorf)", built: "2018–2022", topSpeedMph: 99,
    fleet: "28 units rented by Baden-Württemberg as stand-ins while the Stuttgart fleet is fitted with ETCS", source: `${DEWP}Bombardier_Talent_3` };
  addCab("dw6442End", "Talent 3 end car (rented, DB Regio Stuttgart)", (c) => t2End(c, { lv: "t3", pan: true }), m(20.05), { pan: true });
  addCab("dw6442End1", "Talent 3 end car with first class (rented, DB Regio Stuttgart)", (c) => t2End(c, { lv: "t3", first: true, pan: true, up: false }), m(20.05), { pan: true, amenities: ["first"] });
  addCab("dw6442Mid", "Talent 3 middle car (rented, DB Regio Stuttgart)", (c) => t2Mid(c, { lv: "t3" }), m(16.1));
  FACTS.dw6442End = { ...F3, lengthFt: m(20.05), about: "An end car of a six-car Talent 3, built for ÖBB but not taken up, rented in plain white and red for DB Regio Stuttgart's lines (RE 10a/b, MEX 17 and others)." };
  FACTS.dw6442End1 = { ...FACTS.dw6442End };
  FACTS.dw6442Mid = { ...F3, lengthFt: m(16.1), about: "A middle car of the Talent 3, low-floor, on shared (Jakobs) trucks." };
  SETS.dw6442x6 = set("Talent 3 (6442, rented stand-in, white and red), six cars", ["dw6442End", 1], ["dw6442Mid", 2], ["dw6442MidR", 2], ["dw6442End1R", 1]);
  const t2 = (k, n, label) => set(label, [`dw442${k}End`, 1], ...(n > 2 ? [[`dw442${k}Mid`, 1]] : []), ...(n > 4 ? [[`dw442${k}Mid`, 1]] : []), ...(n > 3 ? [[`dw442${k}MidR`, 1]] : []), [`dw442${k}End1R`, 1]);
  SETS.dw442x2 = t2("", 2, "Talent 2 (442), two cars");
  SETS.dw442x4 = t2("", 4, "Talent 2 (442), four cars");
  SETS.dw442Wx2 = t2("W", 2, "Talent 2 (442, Werdenfelsbahn), two cars");
  SETS.dw442Wx4 = t2("W", 4, "Talent 2 (2442, Werdenfelsbahn), four cars");
  SETS.dw442Wx8 = { label: "Talent 2 (2442, Werdenfelsbahn), two four-car units", units: [...SETS.dw442Wx4.units, ...SETS.dw442Wx4.units] };
  SETS.dw442Bwx4 = t2("Bw", 4, "Talent 2 (3442, bwegt), four cars");
  SETS.dw442Bsx3 = t2("Bs", 3, "Talent 2 (8442, bwegt), three cars");
  SETS.dw442Bsx5 = t2("Bs", 5, "Talent 2 (8442, bwegt), five cars");
}


// ===================== Coradia Continental (440, 1440) =====================
// Alstom Coradia Continental: articulated, end cars 19.05 m (the first
// series, class 440, short nose) or 20.25 m (class 1440's longer crash-
// proof nose) and middle cars 16.4 m (18.05 m in the Breisgau-S-Bahn's
// long 1440.1); 3 cars 54.5/56.9 m, 4 cars 70.9/73.3 m, 5 cars 87.3/89.7
// m; 4.28 m tall, floor 0.73 m (de.wikipedia "Alstom Coradia
// Continental"). From photographs of 440 804 and 440 825 (Mainfranken,
// 2024), 1440 734 (RB 33, October 2024), 1440 249 at Karlsruhe (2025)
// and a Breisgau unit at Schluchsee (2026): the 1440 has a crew door
// behind the cab, the 440 only a side window; then first class (two
// windows), the double door, second class; the middle cars' door near
// the end car. DB red: light grey along the foot and a light grey line
// along the top of the side, yellow over first class; the doors light
// grey, the nose dark grey round the windshield. bwegt (the Karlsruhe
// and Breisgau 1440s, the Tübingen 440s): white, yellow along the top and
// round the cab, the window band dark, yellow doors.
const CC = { roof: 4.0, sill: 0.42, endSill: 0.9, line: [3.42, 3.57], door: [0.57, 3.3], foot: [0.82, 1.06], winO: [1.95, 3.1], winN: [1.76, 2.92], band: [1.62, 3.08] };
const CC_NOSE = { old: [[0.78, CC.sill + 0.05], [0.35, 0.75], [0.18, 1.3], ["q", 0.12, 2.35, 0.45, 2.9], [1.1, 3.72], ["q", 1.6, CC.roof, 2.6, CC.roof]],
  new: [[0.95, CC.sill], [0.42, 0.7], [0.15, 1.4], ["q", 0.05, 2.2, 0.45, 2.78], [1.55, 3.75], ["q", 2.2, CC.roof, 3.4, CC.roof]] };
const ccDoor = (x, fill) => leaves(m(x), m(1.3), m(CC.door[0]), m(CC.door[1]), fill, { glass: [0.18, 0.86], gw: 0.4, r: 0.22, seam: "rgba(0,0,0,0.4)" });
// lv: red or bw; head: old (440) or new (1440).
function ccPaint(g, lv, { cab = null, first = null, head = "new" } = {}) {
  const L = g.L, band = head === "old" ? [1.82, 3.22] : CC.band;
  if (lv === "red") {
    let s = rect(-1, -1, L + 2, m(CC.foot[0]) + 1, "#4a4f54") + rect(-1, m(CC.foot[0]), L + 2, m(CC.foot[1] - CC.foot[0]), DB.grey) +
      rect(-1, m(CC.line[0]), L + 2, m(CC.line[1] - CC.line[0]), DB.grey);
    if (first) s += rect(m(first[0]), m(CC.line[0]), m(first[1] - first[0]), m(CC.line[1] - CC.line[0]), DB.yellow);
    if (cab === "old") s += path(poly(P([[-0.2, 1.5], [0.55, 1.5], ["q", 1.2, 1.75, 1.55, 2.85], [2.05, 4.3], [-0.2, 4.3]])), "#4f5459");
    if (cab === "new") s += path(poly(P([[-0.2, 1.55], [0.65, 1.55], ["q", 1.45, 1.8, 1.95, 2.85], [2.75, 4.3], [-0.2, 4.3]])), "#4f5459");
    return s;
  }
  let s = rect(-1, -1, L + 2, m(0.85) + 1, SKIRT) + rect(-1, m(3.62), L + 2, 4, BW.yellow) + rect(-1, m(band[0]), L + 2, m(band[1] - band[0]), BW.dark);
  if (cab) {
    const r = cab === "new" ? 1 : 0.8;
    s += rect(-1, m(band[0]) - 0.5, m(4.0 * r) + 1, m(band[1] - band[0]) + 1, BW.white) +
      path(poly(P([[-0.2, 1.05], [0.5, 1.05], ["q", 1.0 * r, 1.35, 1.5 * r, 2.3], [2.95 * r, 3.62], [3.6 * r, 3.62], [3.6 * r, 4.3], [-0.2, 4.3]])), BW.yellow) +
      path(poly(P([[0.3, 2.3], [1.15 * r, 2.3], [2.3 * r, 3.5], [2.2 * r, 3.95], [1.3 * r, 3.95], [0.4, 3.2]])), "#1f2226");
  }
  return s;
}
// An end car, its cab on the left. o: lv, head, first (first-class
// windows behind the cab), pan.
function ccEnd(c, o) {
  const { lv, head } = o, nu = head === "new", bw = lv !== "red";
  const off = nu ? 1.2 : 0; // the longer nose moves everything back
  const nose = P(CC_NOSE[head]);
  const win = nu ? CC.winN : CC.winO;
  const L = c.L;
  const bottom = P([[1.2, CC.endSill], [5.2 + off, CC.endSill], [5.6 + off, CC.sill], [L / M2F - 1.3, CC.sill], [L / M2F - 0.9, 0.8]]);
  const paint = (g) => ccPaint(g, lv, { cab: head, head, first: o.first && lv === "red" ? [2.8 + off, 6.45 + off] : null }) +
    (bw ? "" : rect(m(-0.2), m(win[0]) - 0.3, m(3.8 + off), 0.3, "rgba(0,0,0,0)"));
  const over = (g) => {
    const fill = bw ? BW.yellow : DB.grey;
    let s = "";
    if (nu) s += rect(m(3.0), m(0.75), m(0.72), m(2.75), "none", 0, 'rx="0.12" stroke="rgba(0,0,0,0.45)" stroke-width="0.6" vector-effect="non-scaling-stroke"') + (bw ? pane(m(3.14), m(1.45), m(0.44), m(1.65), 0.15, "#15171a") : pane(m(3.14), m(2.3), m(0.44), m(0.95), 0.15, "#15171a") + pane(m(3.14), m(1.55), m(0.44), m(0.55), 0.15, "#15171a"));
    else s += pane(m(2.75), m(2.85), m(0.5), m(0.8), 0.15, "#15171a");
    s += panes([3.7 + off, 5.25 + off], 1.3, win[0], win[1], 0.25, "#15171a");
    s += ccDoor(7.1 + off, fill);
    const n = nu ? 7 : 6, from = 8.95 + off, pitch = (L / M2F - 1.0 - from - 1.22) / (n - 1);
    s += panes(seq(from, pitch, n), 1.22, win[0], win[1], 0.25, "#15171a");
    s += lamp(m(0.28), m(1.6), 0.45, 0.32);
    if (bw) s += bwegtWord(c, 11.5 + off, 3.4, 0.38, lv === "bw" ? "DB Regio fährt für" : null) + bwLion(c, 14.2 + off, 3.38, 0.42) + bikeSign(m(9.6 + off), m(1.15), m(0.5), BW.yellow);
    else {
      if (!nu) s += regio(c, m(11.4 + off), m(1.45), m(0.36));
      if (o.name) s += T(c, m(11.4 + off), m(1.2), m(0.13), o.name, "#ffffff", { weight: 600 });
      s += classPlate(c, 5.0 + off, 2.85, o.first ? "1" : "2");
    }
    s += classPlate(c, 8.6 + off, 2.85, "2");
    return s;
  };
  const under = () => truck(m(3.3 + off), { wb: m(2.44), d: 33, top: m(CC.endSill) - 0.1 }) + jakobs(c.L, m(0.8), 31, m(2.7)) + cases(m(6.0 + off), m(L / M2F - 1.6), m(CC.sill), 3, 0.35) +
    (c.coupledL ? coupledCouplers(m(0.95)) : autoCoupler(m(nu ? 0.95 : 0.78), m(0.95)));
  const top = () => fairing(m(2.4 + off), m(5.5), m(CC.roof), 0.7, "#6f757b", 4) + fairing(m(8.6 + off), m(4.5), m(CC.roof), 0.5, "#7d838a") +
    (o.pan ? panGear(m(L / M2F - 2.2), m(CC.roof), { up: o.up !== false, dir: -1 }) : "");
  return body(c, { sill: m(CC.sill), roof: m(CC.roof), nose, bottom, base: bw ? BW.white : DB.red, endR: m(0.3), paint, over, under, top });
}
// A middle car (16.4 m, or 18.05 m): its door near the left end (two
// windows before it), windows to the right; o.two: a second door near the
// right end (the five-car units' centre car).
function ccMid(c, o) {
  const { lv, head } = o, bw = lv !== "red", Lm = c.L / M2F, win = head === "new" ? CC.winN : CC.winO;
  const bottom = P([[0.5, 0.8], [1.2, CC.sill], [Lm - 1.2, CC.sill], [Lm - 0.5, 0.8]]);
  const paint = (g) => ccPaint(g, lv, { head });
  const over = (g) => {
    const fill = bw ? BW.yellow : DB.grey;
    let s = panes([0.75, 2.45], 1.25, win[0], win[1], 0.25, "#15171a") + ccDoor(4.25, fill);
    const right = o.two ? Lm - 5.4 : Lm - 0.75;
    const n = Math.max(2, Math.round((right - 6.0) / 1.62)), pitch = (right - 6.0 - 1.22) / (n - 1);
    s += panes(seq(6.0, pitch, n), 1.22, win[0], win[1], 0.25, "#15171a");
    if (o.two) s += ccDoor(Lm - 5.15, fill) + panes([Lm - 3.5, Lm - 1.95], 1.22, win[0], win[1], 0.25, "#15171a");
    s += classPlate(c, 5.85, 2.85, "2");
    if (bw) s += bikeSign(m(6.6), m(1.15), m(0.5), BW.yellow);
    else if (head === "old") s += regio(c, m(9.6), m(1.45), m(0.34));
    return s;
  };
  const under = () => jakobs(0, m(0.8), 31, m(2.7)) + jakobs(c.L, m(0.8), 31, m(2.7)) + cases(m(1.8), m(Lm - 1.8), m(CC.sill), 3, 0.35);
  const top = () => (o.pan ? panGear(m(2.4), m(CC.roof), { up: true, dir: 1 }) : fairing(m(1.0), m(3.4), m(CC.roof), 0.5, "#6f757b")) + fairing(m(5.5), m(4.6), m(CC.roof), 0.55, "#7d838a");
  return body(c, { sill: m(CC.sill), roof: m(CC.roof), bottom, base: bw ? BW.white : DB.red, x0: 0.3, x1: c.L - 0.3, endR: m(0.3), paint, over, under, top });
}
{
  const F = { type: "Electric multiple unit", builder: "Alstom (Salzgitter)", topSpeedMph: 99, source: `${DEWP}Alstom_Coradia_Continental` };
  const V = [
    // key, head, livery, name, model note
    ["dw440", "old", "red", "Mainfrankenbahn", "Alstom Coradia Continental (DB class 440)", "2008–2010", "DB Regio Bayern's Mainfranken units (Würzburg: RE 10, RB 53, RB 79, RB 80, RB 85) and the five-car units on München–Buchloe (RB 74)."],
    ["dw440Bw", "old", "bw", null, "Alstom Coradia Continental (DB class 440)", "2008–2009", "Four-car units from the Augsburg network, repainted in bwegt for DB Regio Baden-Württemberg's Ammertal and Ermstal line (RB 63 Herrenberg–Tübingen–Bad Urach)."],
    ["dw1440", "new", "red", null, "Alstom Coradia Continental (DB class 1440)", "2017–2020", "DB Regio's 1440s in red: NRW's RE 8 and RB 33, the Saarland's RB 70 and RB 71."],
    ["dw1440Bw", "new", "bw", null, "Alstom Coradia Continental (DB class 1440)", "2019–2022", "DB Regio's 1440s in bwegt: the Breisgau-S-Bahn (S 1, S 10, S 11) and Karlsruhe's RE 40, RB 41, RB 44 and RE 45."],
  ];
  for (const [k, head, lv, name, model, built, about] of V) {
    const endL = head === "new" ? 20.25 : 19.05;
    addCab(`${k}End`, `Coradia Continental end car${lv === "bw" ? " (bwegt)" : ""}`, (c) => ccEnd(c, { lv, head, name }), m(endL));
    addCab(`${k}End1`, `Coradia Continental end car with first class${lv === "bw" ? " (bwegt)" : ""}`, (c) => ccEnd(c, { lv, head, name, first: true }), m(endL), { amenities: ["first"] });
    addCab(`${k}Mid`, `Coradia Continental middle car${lv === "bw" ? " (bwegt)" : ""}`, (c) => ccMid(c, { lv, head }), m(16.4));
    addCab(`${k}MidP`, `Coradia Continental middle car with pantograph${lv === "bw" ? " (bwegt)" : ""}`, (c) => ccMid(c, { lv, head, pan: true }), m(16.4), { pan: true });
    add(`${k}Mid2`, `Coradia Continental centre car${lv === "bw" ? " (bwegt)" : ""}`, (c) => ccMid(c, { lv, head, two: true }), m(16.4));
    for (const sfx of ["End", "End1", "Mid", "MidP", "Mid2"]) FACTS[`${k}${sfx}`] = { ...F, model, built, lengthFt: sfx.startsWith("End") ? m(endL) : m(16.4),
      about: (sfx === "End1" ? "The end car with the first-class seats behind the cab. " : sfx.startsWith("End") ? "An end car with the cab. " : "A middle car on shared (Jakobs) trucks. ") + about };
  }
  addCab("dw1440BgMid", "Coradia Continental long middle car (bwegt, Breisgau-S-Bahn)", (c) => ccMid(c, { lv: "bw", head: "new", pan: true }), m(18.05), { pan: true });
  FACTS.dw1440BgMid = { ...F, model: "Alstom Coradia Continental (DB class 1440.1)", built: "2019–2020", lengthFt: m(18.05), about: "The Breisgau-S-Bahn's four-car units have longer middle cars (76.6 m in all)." };
  const cc = (k, n, label, pan = "MidP") => {
    const mids = n === 3 ? [[`${k}${pan}`, 1]] : n === 4 ? [[`${k}${pan}`, 1], [`${k}MidR`, 1]] : [[`${k}${pan}`, 1], [`${k}Mid2`, 1], [`${k}MidR`, 1]];
    return set(label, [`${k}End1`, 1], ...mids, [`${k}EndR`, 1]);
  };
  SETS.dw440x3 = cc("dw440", 3, "Coradia Continental (440, Mainfrankenbahn), three cars");
  SETS.dw440x5 = cc("dw440", 5, "Coradia Continental (440), five cars");
  SETS.dw440Bwx4 = cc("dw440Bw", 4, "Coradia Continental (440, bwegt), four cars");
  SETS.dw1440x3 = cc("dw1440", 3, "Coradia Continental (1440), three cars");
  SETS.dw1440x4 = cc("dw1440", 4, "Coradia Continental (1440), four cars");
  SETS.dw1440x5 = cc("dw1440", 5, "Coradia Continental (1440), five cars");
  SETS.dw1440x8 = { label: "Coradia Continental (1440), five and three cars coupled", units: [...SETS.dw1440x5.units, ...SETS.dw1440x3.units] };
  SETS.dw1440Bwx3 = cc("dw1440Bw", 3, "Coradia Continental (1440, bwegt), three cars");
  SETS.dw1440Bwx5 = cc("dw1440Bw", 5, "Coradia Continental (1440, bwegt), five cars");
  SETS.dw1440Bgx4 = set("Coradia Continental (1440.1, bwegt, Breisgau-S-Bahn), four cars", ["dw1440BwEnd1", 1], ["dw1440BgMid", 1], ["dw1440BgMidR", 1], ["dw1440BwEndR", 1]);
}


// ---------- Fleets ----------
// [first, last, key] over the 12-digit European Vehicle Number: DB's
// multiple units "94 80 sNNN nnn-c" (s the series' prefix digit: 2442 the
// Werdenfels Talent 2s, 3442 the bwegt Gäu-Murr units, 8442 the Stuttgart
// fleet, 6442 the rented Talent 3s; the middle cars carry the class plus
// one, 443/441), the Twindexx powered cars "91 80 0445 nnn-c" (445 043-066
// Main-Spessart, 445 067-104 München-Nürnberg, 446 001-048 Main-Neckar-
// Ried; de.wikipedia "Bombardier Twindexx Vario"). The 1440s are left out:
// their numbers don't tell the red units from the bwegt ones.
{
  const R = (prefix8, key) => [Number(`${prefix8}0000`), Number(`${prefix8}9999`), key];
  FLEETS.push(R("94802442", "dw442WEnd"), R("94802443", "dw442WMid"), [948004420090, 948004420119, "dw442WEnd"],
    R("94803442", "dw442BwEnd"), R("94803443", "dw442BwMid"), R("94808442", "dw442BsEnd"), R("94808443", "dw442BsMid"),
    R("94806442", "dw6442End"), R("94806443", "dw6442Mid"), R("94800442", "dw442End"), R("94800443", "dw442Mid"),
    R("94800440", "dw440End"), R("94800441", "dw440Mid"), R("94800841", "dw440Mid2"),
    [918004450430, 918004450669, "dw445MsCab"], [918004450670, 918004451049, "dw445RwCab"], R("91800446", "dw446MnrCab"));
}

return { TYPES, MODELS, SETS, FACTS, FLEETS };
});

// =====================================================================
// STADLER AND SIEMENS ELECTRIC UNITS: Desiro HC, Mireo, FLIRT, ET 425
// =====================================================================
const PART_STSI = safe("stsi", () => {
const { TYPES, MODELS, add, addCab } = registry();
const FACTS = {}, SETS = {}, FLEETS = [];
// Shorthands in metres: a rectangle, a window, a door, all measured off
// the photographs in metres from the coupler face and the rail.
const R = (x0, y0, x1, y1, fill, extra = "") => rect(m(x0), m(y0), m(x1 - x0), m(y1 - y0), fill, 0, extra);
const W = (x0, y0, x1, y1, r = 0.12, frame = "#15171a") => pane(m(x0), m(y0), m(x1 - x0), m(y1 - y0), m(r), frame);
const Dr = (x0, y0, x1, y1, fill, o = {}) => leaves(m(x0), m(x1 - x0), m(y0), m(y1), fill, o);
const TXT = (c, x, y, h, text, fill, o) => T(c, m(x), m(y), m(h), text, fill, o);
const tr = (x, top, { d = 33.5, wb = 2.25 } = {}) => truck(m(x), { wb: m(wb), d, top: m(top) });
// A thin line of paint from x0 to x1 at height y (thickness t).
const stripe = (x0, x1, y, t, fill) => R(x0, y - t / 2, x1, y + t / 2, fill);
// The class numeral and the pictograms under it.
const classMark = (c, x, y, cls, fill = "#ffffff") => TXT(c, x, y, 0.3, cls, fill, { weight: 700 }) +
  R(x - 0.08, y - 0.34, x + 0.08, y - 0.22, fill) + R(x - 0.08, y - 0.48, x + 0.08, y - 0.38, fill, 'opacity="0.8"');
// A destination display set in the side: dark glass, amber letters.
const sideLed = (x0, x1, y) => R(x0, y - 0.09, x1, y + 0.09, "#141618", 'rx="0.05"') + R(x0 + 0.06, y - 0.03, x1 - 0.3, y + 0.03, "#e98b1c", 'opacity="0.75"');
// "Wir fahren für das Bahnland Bayern": the Bavarian network's mark (an
// angular white arrow) with its words, white on the red, by the cab.
const bahnland = (c, x, y, h = 0.42, fill = "#ffffff") => markAt(c, m(x), m(y), m(h),
  `<path d="M-0.55 -0.35L-0.05 -0.05L-0.55 0.25M-0.2 -0.5L0.2 -0.25" fill="none" stroke="${fill}" stroke-width="0.12"/>`) +
  TXT(c, x + 0.18, y + 0.08, 0.1, "Bahnland", fill, { weight: 700, anchor: "start" }) + TXT(c, x + 0.18, y - 0.06, 0.1, "Bayern", fill, { weight: 700, anchor: "start" });
const mirrorDraw = (draw) => (c) => facingRight(c, draw);
// ===================== Siemens Desiro HC =====================
// Four (or six) cars: single-deck motor end cars 26.226 m over the body
// (27.43 m over the couplers) and double-deck trailers 25.2 m, the
// double-deck cars 4.64 m tall, the end cars lower, 2.82 m wide (de.
// wikipedia "Siemens Desiro HC"). The end cars' floor drops between the
// trucks for step-free doors; the middle cars' lower deck between their
// doors; a recess in the roof at each end of the middle cars for their
// air conditioning.
// DB Regio Bayern (Franken-Südthüringen 1462 031-048 and 4462 001-008 from
// December 2023/June 2024; Donau-Isar 1462 049-073 from December 2024):
// broadside photographs of 1462 566 at the Nymphenburger Kanal (October
// 2025) and of a Franken-Thüringen-Express set at Nürnberg (October
// 2024), 4462 004 at Strullendorf and 4462 507 at Fürth (2026): verkehrs-
// rot all over, a light grey line along the side at the doors' tops
// (yellow over the first-class seats), a light grey band along the sill
// that steps down with the floor, dark grey below; light grey doors; the
// windshield in a black visor; the DB logo by the first door, "Bahnland
// Bayern" by the cab, the white class numerals by the windows; on the
// Franken-Thüringen sets "Franken-Thüringen-Express" in small white
// letters after the DB logo. The end car with first class is 1462.5xx,
// the other (accessible toilet, wheelchair spaces) 1462.0xx, which
// carries the raised pantograph.
// bwegt (Netz Rheintal, 1462 001-015, from June 2020; 1462 013 at Basel
// SBB 2024, 1462 510 at Freiburg 2023): white, yellow over the roof and
// round the cab, dark grey along the bottom and round the windows,
// yellow doors (two leaves, 1.8 m in the middle cars), "bwegt" with the
// lion, a big yellow bicycle by the bicycle door.
const HC = { roof: 4.05, mroof: 4.64, endL: 27.43, midL: 25.2 };
const HCP = {
  by: { body: DB.red, band: "#d4d8da", skirt: "#4a4f55", line: "#d4d8da", door: "#d4d8da", visor: "#16181b", roof: "#c8000d" },
  bw: { body: "#eceee9", yellow: "#ffd400", dark: "#3b3d3a", skirt: "#2b2d2b", door: "#ffd400", visor: "#16181b" },
};
// The nose (metres from the coupler face, bottom to roof).
const hcNose = () => [[m(1.0), m(0.5)], [m(0.72), m(0.8)], [m(0.6), m(1.55)], ["q", m(0.6), m(2.0), m(0.66), m(2.36)], ["q", m(0.74), m(2.8), m(0.97), m(3.08)],
  ["q", m(1.2), m(3.4), m(1.5), m(3.62)], ["q", m(1.85), m(3.86), m(2.25), m(3.96)], ["q", m(2.7), m(4.05), m(3.2), m(4.05)]];
// Body underside (left to right): the front section over the motor truck,
// down between the trucks, up again over the rear.
const hcBottom = (L, a, b, hi, lo) => [[m(1.1), m(hi)], [m(a), m(hi)], [m(a + 0.35), m(lo)], [m(b - 0.35), m(lo)], [m(b), m(hi)], [L - 0.35, m(hi)]];
// The cab's front seen from the side: the visor's rim at the front edge,
// the headlight, the coupler and the grey bumper below.
function hcFront(c, pal) {
  let s = path(`M${m(0.66)} ${m(2.3)}Q${m(0.72)} ${m(2.85)} ${m(0.98)} ${m(3.12)}L${m(1.08)} ${m(3.06)}Q${m(0.84)} ${m(2.8)} ${m(0.8)} ${m(2.3)}Z`, pal.visor);
  s += R(0.62, 1.72, 0.9, 1.84, "#f4f1df") + R(0.7, 0.95, 1.05, 1.3, "#2a2d31", 'rx="0.06"');
  return s + autoCoupler(m(0.75), m(0.92));
}
const doorEdge = (d, y0, y1) => rect(m(d[0]) - 0.12, m(y0), m(d[1] - d[0]) + 0.24, m(y1 - y0) + 0.12, "none", 0, 'stroke="rgba(0,0,0,0.35)" stroke-width="0.5" vector-effect="non-scaling-stroke"');
function hcEnd(c, liv, k) {
  const pal = HCP[liv], L = c.L, by = liv === "by";
  const first = k === "5";
  // Positions (m from the coupler face) measured off the photographs:
  // Bayern's first-class car (1462 566), its other end car (FTX 0xx), and
  // bwegt's (1462 013).
  const lay = by ? (first
    ? { cabW: [2.05, 2.55], front: [[4.0, 6.1]], d1: [6.8, 8.7], mids: [[9.3, 10.6], [11.0, 13.4], [13.9, 16.3], [16.8, 18.3]], d2: [19.1, 21.2], rear: [[22.3, 25.2]], a: 5.3, b: 21.7 }
    : { cabW: [2.0, 2.45], front: [[3.75, 5.65]], d1: [6.45, 7.95], mids: [[8.65, 9.85], [10.35, 12.4], [12.9, 15.1], [15.6, 16.85]], d2: [17.6, 19.4], rear: [[20.4, 22.5], [23.4, 25.9]], a: 4.9, b: 20.0 })
    : { cabW: [2.0, 2.45], front: [[6.1, 7.85]], d1: [8.4, 9.8], mids: [[10.4, 11.9], [12.3, 13.9], [14.3, 15.9]], d2: [17.4, 18.8], rear: [[20.0, 22.2], [23.2, 25.9]], a: 7.9, b: 19.6 };
  const x1 = L - m(0.62);
  const paint = (g) => {
    let s = rect(-1, 0, L + 2, 20, pal.body);
    if (by) {
      // Sill band and the dark skirt, stepping down between the trucks.
      s += R(-1, 0.87, lay.a + 0.2, 1.1, pal.band) + R(-1, 0, lay.a + 0.2, 0.87, pal.skirt) + R(lay.b - 0.2, 0.87, HC.endL + 1, 1.1, pal.band) + R(lay.b - 0.2, 0, HC.endL + 1, 0.87, pal.skirt);
      s += R(lay.a, 0.46, lay.b, 0.67, pal.band) + R(lay.a, 0, lay.b, 0.46, pal.skirt);
      s += path(`M${m(lay.a)} ${m(1.1)}L${m(lay.a + 0.4)} ${m(0.67)}L${m(lay.a + 0.4)} ${m(0.46)}L${m(lay.a)} ${m(0.87)}Z`, pal.band) +
        path(`M${m(lay.b)} ${m(1.1)}L${m(lay.b - 0.4)} ${m(0.67)}L${m(lay.b - 0.4)} ${m(0.46)}L${m(lay.b)} ${m(0.87)}Z`, pal.band);
      // The line at the doors' tops, yellow over first class.
      s += stripe(1.75, HC.endL + 1, 2.81, 0.08, pal.line);
      if (first) s += stripe(2.75, 10.8, 2.81, 0.08, DB.yellow);
    } else {
      // bwegt: yellow over the roof, the dark band round the windows and
      // the dark skirt; the cab's yellow and the dark sweep behind it.
      s += R(-1, 3.55, HC.endL + 1, 6, pal.yellow) + R(-1, 0, HC.endL + 1, 0.66, pal.skirt);
      s += R(lay.front[0][0] - 0.25, 1.15, lay.d1[0], 2.55, pal.dark, 'rx="0.3"') + R(lay.d1[1], 1.05, lay.d2[0], 2.25, pal.dark) + R(lay.d2[1], 1.55, HC.endL + 1, 2.8, pal.dark);
      // The cab: a dark grey sweep round the cab's side window from the
      // roof down to the lamps, the yellow nose ahead of it.
      s += path(`M${m(1.0)} ${m(1.3)}Q${m(2.0)} ${m(1.25)} ${m(3.0)} ${m(1.6)}Q${m(4.3)} ${m(2.2)} ${m(4.5)} ${m(3.55)}L${m(4.5)} ${m(6)}L${m(2.2)} ${m(6)}Z`, pal.dark);
      s += path(`M${m(-0.2)} ${m(0.66)}L${m(-0.2)} ${m(6)}L${m(3.4)} ${m(6)}Q${m(2.3)} ${m(3.2)} ${m(1.9)} ${m(2.3)}Q${m(1.5)} ${m(1.5)} ${m(1.0)} ${m(1.3)}L${m(0.9)} ${m(0.66)}Z`, pal.yellow);
    }
    return s;
  };
  const over = (g) => {
    let s = W(lay.cabW[0], 2.15, lay.cabW[1], 2.75, 0.1);
    for (const [a, b] of lay.front) s += W(a, 1.6, b, 2.37, 0.14);
    for (const [a, b] of lay.mids) s += W(a, 1.25, b, 2.06, 0.14);
    for (const [a, b] of lay.rear) s += W(a, 1.76, b, 2.62, 0.14);
    const dy0 = 0.64, dy1 = 2.62;
    for (const d of [lay.d1, lay.d2]) s += Dr(d[0], dy0, d[1], dy1, pal.door, { glass: [0.3, 0.86], gw: 0.46, k: d[1] - d[0] > 1.6 || !by ? 2 : 1, seam: "#7d8388" }) + doorEdge(d, dy0, dy1);
    if (by) {
      const mid = first ? 9.95 : 8.95;
      s += dbLogo(c, m(mid), m(2.35), m(0.26));
      if (/^R[EB] ?(14|19|20|25|28|29)$/.test(c.route || "")) s += TXT(c, mid + 1.75, 2.35, 0.12, "Franken-Thüringen-Express", "#ffffff", { weight: 700 });
      s += sideLed(first ? 13.6 : 12.9, first ? 14.9 : 14.2, 2.4);
      s += bahnland(c, 1.6, 1.45, 0.36);
      s += classMark(c, lay.front[0][0] - 0.35, 2.1, first ? "1" : "2");
      if (first) s += classMark(c, lay.d1[1] + 0.3, 1.85, "1") + classMark(c, lay.mids[2][0] - 0.25, 1.85, "2");
      else s += classMark(c, lay.mids[0][0] - 0.25, 1.85, "2") + classMark(c, lay.mids[2][0] - 0.25, 1.85, "2");
      s += first ? bikeSign(m(lay.d2[0] + 0.9), m(3.15), m(0.3)) : wheelchair(c, m(lay.d2[0] + 0.5), m(3.2), m(0.22), "#ffffff");
    } else {
      s += bwegtMark(c, 4.75, 1.6, 0.42) + classMark(c, lay.d1[1] + 0.3, 2.15, "2", "#ffffff");
      s += bikeSign(m(lay.d2[1] + 1.0), m(1.05), m(0.55), "#ffd400");
      s += dbLogo(c, m(1.15), m(1.4), m(0.2));
    }
    return s + hcFront(c, pal);
  };
  const under = (g) => tr(3.9, by ? 0.69 : 0.72, { d: 33.5, wb: 2.3 }) + tr(L / M2F - 3.1, by ? 0.69 : 0.72, { d: 33.5, wb: 2.3 }) + cases(m(lay.a + 0.6), m(lay.b - 0.6), m(0.36), 3, m(0.18));
  const top = (g) => {
    const R0 = m(HC.roof);
    let s = R(1.55, 3.55, 2.0, 3.68, "#1d1f22") + fairing(m(14.8), m(3.0), R0 - 0.05, 0.9, "#3a3d41", 3) + fairing(m(18.2), m(6.8), R0 - 0.05, 0.9, "#3a3d41", 4);
    if (!first) s += panGear(m(24.9), R0, { up: true, dir: -1 });
    return s;
  };
  return body(c, { sill: m(0.69), roof: m(HC.roof), nose: hcNose(), x1, base: pal.body, bottom: hcBottom(L, lay.a, lay.b, by ? 0.69 : 0.72, 0.36), paint, over, under, top, ends: [m(0.8), m(3.5)] });
}
// The bwegt mark: "bw" dark, "egt" yellow, the lion in grey before it and
// "Mobilität für Baden-Württemberg" under it.
function bwegtMark(c, x, y, h, { lion = true } = {}) {
  return TXT(c, x, y, h, `bw<tspan fill="#e6b800">egt</tspan>`, "#2a2c2a", { weight: 600, anchor: "start", spacing: -0.02 * m(h) }) +
    TXT(c, x + 0.02, y - h * 0.62, h * 0.2, "Mobilität für Baden-Württemberg", "#2a2c2a", { weight: 500, anchor: "start" }) +
    (lion ? markAt(c, m(x - 0.45), m(y + 0.05), m(h * 0.8), '<path d="M-0.5 0.3L-0.3 -0.1L-0.1 -0.35L0.25 -0.4L0.45 -0.2L0.3 0.0L0.45 0.3L0.15 0.15L-0.05 0.3Z" fill="#2a2c2a"/>') : "");
}
// The Baden-Württemberg lion as the bwegt trains carry it big beside the
// mark: a striding lion in grey (drawn y-down in a unit box), h m tall.
const bwLion = (c, x, y, h, fill = "#9c9e9a") => markAt(c, m(x), m(y), m(h),
  `<path d="M-0.55 0.48L-0.42 0.12L-0.5 -0.05L-0.38 -0.3L-0.2 -0.42L0.05 -0.48L0.18 -0.38L0.1 -0.3L0.22 -0.22L0.38 -0.3L0.42 -0.18L0.3 -0.08L0.42 0.02L0.36 0.18L0.5 0.48L0.3 0.48L0.2 0.25L0.0 0.2L-0.12 0.48L-0.3 0.48L-0.25 0.2Z" fill="${fill}"/>` +
  `<path d="M-0.5 -0.05Q-0.7 -0.3 -0.6 -0.5" fill="none" stroke="${fill}" stroke-width="0.06"/>`);
// A double-deck middle car (25.2 m): end sections over the trucks, the
// doors, the two decks between them; the right end longer (the toilet).
function hcMid(c, liv) {
  const pal = HCP[liv], L = c.L, by = liv === "by";
  const d1 = by ? [4.36, 5.7] : [4.1, 5.9], d2 = by ? [15.61, 17.4] : [15.5, 17.3];
  const paint = (g) => {
    let s = rect(-1, 0, L + 2, 20, pal.body);
    if (by) {
      s += R(-1, 1.01, d1[0], 1.25, pal.band) + R(-1, 0, d1[0], 1.01, pal.skirt) + R(d2[1], 1.01, HC.midL + 1, 1.25, pal.band) + R(d2[1], 0, HC.midL + 1, 1.01, pal.skirt);
      s += R(d1[0], 0.64, d2[1], 0.85, pal.band) + R(d1[0], 0, d2[1], 0.64, pal.skirt);
      s += stripe(-1, HC.midL + 1, 2.9, 0.08, pal.line);
    } else {
      s += R(-1, 4.12, HC.midL + 1, 6, pal.yellow) + R(-1, 0, HC.midL + 1, 0.66, pal.skirt) + R(d1[1], 0.95, d2[0], 2.15, pal.dark) + R(-1, 1.6, d1[0], 2.8, pal.dark) + R(d2[1], 1.85, HC.midL + 1, 3.25, pal.dark);
    }
    return s;
  };
  const over = (g) => {
    let s = W(0.4, 1.81, 1.9, 2.61) + W(2.27, 1.81, 3.17, 2.61);
    for (const [a, b] of [[6.78, 8.4], [8.57, 10.27], [10.46, 12.27], [12.49, 14.36]]) s += W(a, 3.33, b, 4.05, 0.18);
    s += W(4.64, 3.42, 6.23, 4.0, 0.18) + W(15.1, 3.42, 17.24, 4.0, 0.18);
    for (const [a, b] of [[6.43, 8.24], [8.57, 10.14], [10.51, 12.14], [12.57, 14.71]]) s += W(a, 1.17, b, 1.97, 0.14);
    s += W(21.16, 2.02, 23.82, 3.09);
    for (const d of [d1, d2]) s += Dr(d[0], 0.61, d[1], 2.9, pal.door, { glass: [0.3, 0.86], gw: 0.46, k: by ? 1 : 2, seam: "#7d8388" }) + doorEdge(d, 0.61, 2.9);
    if (by) {
      s += dbLogo(c, m(9.35), m(2.5), m(0.26)) + bikeSign(m(11.35), m(2.52), m(0.3));
      for (const x of [8.4, 12.35]) s += classMark(c, x, 1.75, "2");
      s += sideLed(6.85, 8.0, 2.2) + sideLed(13.1, 14.4, 2.2);
    } else {
      s += bwegtMark(c, 7.4, 2.7, 0.45) + bikeSign(m(10.8), m(0.62), m(0.45), "#ffd400");
    }
    return s;
  };
  // The outline: the roof recessed over each end's air conditioning.
  const ni = m(4.05), r = 0.9, x0 = 0.35, x1 = L - 0.35;
  const left = [[x0, m(1.01)], [x0, ni - r], ["q", x0, ni, x0 + r, ni], [m(2.6), ni], ["q", m(2.75), m(4.62), m(3.4), m(4.64)], [m(21.4), m(4.64)], ["q", m(21.95), m(4.62), m(22.1), ni]];
  const bottom = [[x0, m(1.01)], [m(d1[0] - 0.35), m(1.01)], [m(d1[0]), m(0.36)], [m(d2[1]), m(0.36)], [m(d2[1] + 0.35), m(1.01)], [x1, m(1.01)]];
  const under = (g) => (c.coupledL ? rect(0, m(1.1), x0 + 0.2, m(2.6), C.rubber) : "") + tr(2.47, 1.01, { d: 30, wb: 2.2 }) + tr(21.05, 1.01, { d: 30, wb: 2.2 }) + cases(m(d1[1] + 0.3), m(d2[0] - 0.3), m(0.36), 3, m(0.16));
  const top = (g) => R(0.5, 4.0, 2.5, 4.32, "#2d3034", 'rx="0.08"') + R(22.3, 4.0, 24.7, 4.42, "#2d3034", 'rx="0.08"') +
    lines([[m(1.2), m(4.05), m(1.2), m(4.3)], [m(1.8), m(4.05), m(1.8), m(4.3)], [m(23.1), m(4.05), m(23.1), m(4.4)], [m(23.9), m(4.05), m(23.9), m(4.4)]], "#4c5157", 0.5);
  return body(c, { sill: m(1.01), roof: ni, nose: left, x1, endR: r, base: pal.body, bottom, paint, over, under, top, ends: [m(1.1), m(3.7)] });
}

for (const [liv, tag, nm] of [["by", "Hc", "Desiro HC (DB Regio Bayern)"], ["bw", "HcBw", "Desiro HC (bwegt)"]]) {
  addCab(`dw${tag}End1`, `${nm} end car, first and second class`, (c) => hcEnd(c, liv, "5"), m(HC.endL), { amenities: ["first", "bikes"] });
  addCab(`dw${tag}End2`, `${nm} end car, second class, accessible toilet`, (c) => hcEnd(c, liv, "0"), m(HC.endL), { pan: true, amenities: ["wheelchair"] });
  add(`dw${tag}Mid`, `${nm} double-deck middle car`, (c) => hcMid(c, liv), m(HC.midL));
  add(`dw${tag}MidR`, `${nm} double-deck middle car`, mirrorDraw((c) => hcMid(c, liv)), m(HC.midL));
}
SETS.hcBy4 = set("Desiro HC, four cars (DB Regio Bayern)", ["dwHcEnd2", 1], ["dwHcMid", 1], ["dwHcMidR", 1], ["dwHcEnd1R", 1]);
SETS.hcBy4x2 = set("Two four-car Desiro HC (DB Regio Bayern)", ["dwHcEnd2", 1], ["dwHcMid", 1], ["dwHcMidR", 1], ["dwHcEnd1R", 1], ["dwHcEnd1", 1], ["dwHcMid", 1], ["dwHcMidR", 1], ["dwHcEnd2R", 1]);
SETS.hcBy6 = set("Desiro HC, six cars (Franken-Thüringen-Express, 190 km/h)", ["dwHcEnd2", 1], ["dwHcMid", 2], ["dwHcMidR", 2], ["dwHcEnd1R", 1]);
SETS.hcBw4 = set("Desiro HC (bwegt), four cars", ["dwHcBwEnd2", 1], ["dwHcBwMid", 1], ["dwHcBwMidR", 1], ["dwHcBwEnd1R", 1]);
SETS.hcBw4x2 = set("Two Desiro HC (bwegt)", ["dwHcBwEnd2", 1], ["dwHcBwMid", 1], ["dwHcBwMidR", 1], ["dwHcBwEnd1R", 1], ["dwHcBwEnd1", 1], ["dwHcBwMid", 1], ["dwHcBwMidR", 1], ["dwHcBwEnd2R", 1]);

// ===================== Siemens Mireo =====================
// Three cars on four trucks (the middle ones Jakobs trucks shared by two
// cars), 69.86 m over the couplers, 2.81 m wide, 4.21 m tall over the
// roof gear; the end car 25.0 m from its coupler face to the Jakobs
// truck, the middle car 19.8 m between them; the motor trucks 19.68 m
// from the Jakobs ones (de.wikipedia "Siemens Mireo"). Layout measured
// off 463 582 near Karlsruhe (2023) and 463 085 at Heidelberg: the cab
// and its side door, three windows (first class behind the cab), a
// double door, six windows to the joint; the middle car a double door
// near each end, five windows between, the pantograph on its roof.
// bwegt (Netz Rheintal 463 001-024, RB 26/27/28; Nordbaden-Express RE 73
// 463 085-091): white, a yellow band along the top of the side, the
// windows in an anthracite band, black along the bottom; the nose yellow
// under a black cap, white below the lamps; yellow doors, big yellow
// bicycles, "bwegt" and the lion, "DB Regio fährt für".
// DB Regio Bayern (Flughafenexpress RE 22, four cars, 1463 001-006 from
// December 2024; 1463 503 at Regensburg 2024, RE 22 at Freising 2025):
// verkehrsrot, a light grey line at the doors' tops, yellow over first
// class, light grey along the sill and dark grey below, light grey
// doors; the windshield in a black visor; "Bahnland Bayern".
const MI = { roof: 4.05, endL: 25.0, midL: 19.8 };
const MIP = {
  bw: { body: "#eceee9", yellow: "#ffd400", dark: "#30322f", skirt: "#232523", door: "#ffd400", cap: "#1e2022" },
  by: { body: DB.red, band: "#d4d8da", skirt: "#4a4f55", line: "#d4d8da", door: "#d4d8da", cap: "#16181b" },
};
const miNose = () => [[m(0.95), m(0.42)], [m(0.6), m(0.7)], ["q", m(0.42), m(1.0), m(0.44), m(1.45)], ["q", m(0.46), m(1.9), m(0.62), m(2.3)], ["q", m(0.95), m(2.95), m(1.6), m(3.45)],
  ["q", m(2.4), m(3.98), m(3.4), m(4.04)], [m(3.8), m(4.05)]];
function miEnd(c, liv) {
  const pal = MIP[liv], L = c.L, bw = liv === "bw";
  const cabD = [5.7, 6.95], fw = [[7.5, 8.75], [9.0, 10.2], [10.5, 11.75]], d1 = [12.3, 13.65];
  const rw = [[14.95, 15.95], [16.2, 17.35], [17.75, 18.95], [19.3, 20.55], [20.85, 22.05], [23.0, 24.4]];
  const paint = (g) => {
    let s = rect(-1, 0, L + 2, 20, pal.body);
    if (bw) {
      s += R(-1, 3.3, MI.endL + 1, 3.72, pal.yellow) + R(-1, 0, MI.endL + 1, 0.9, pal.skirt);
      s += R(7.25, 1.5, d1[0], 2.95, pal.dark, 'rx="0.3"') + R(d1[1], 1.5, MI.endL + 1, 2.95, pal.dark);
      // The nose: yellow from the roof's edge sweeping down to the lamps,
      // white below them; the black cap over the windshield.
      s += path(`M${m(-0.2)} ${m(1.55)}Q${m(1.1)} ${m(1.75)} ${m(2.3)} ${m(2.35)}Q${m(3.6)} ${m(3.0)} ${m(5.1)} ${m(3.3)}L${m(5.1)} ${m(5)}L${m(-0.2)} ${m(5)}Z`, pal.yellow);
      s += path(`M${m(-0.2)} ${m(2.0)}Q${m(0.9)} ${m(2.15)} ${m(1.8)} ${m(2.85)}Q${m(2.6)} ${m(3.45)} ${m(3.4)} ${m(3.62)}L${m(4.4)} ${m(3.72)}L${m(4.4)} ${m(5)}L${m(-0.2)} ${m(5)}Z`, pal.cap);
    } else {
      s += R(-1, 0.9, MI.endL + 1, 1.12, pal.band) + R(-1, 0, MI.endL + 1, 0.9, pal.skirt);
      s += stripe(5.2, MI.endL + 1, 3.05, 0.08, pal.line) + stripe(7.2, 10.4, 3.05, 0.08, DB.yellow);
      s += path(`M${m(-0.2)} ${m(1.85)}Q${m(0.9)} ${m(2.0)} ${m(1.8)} ${m(2.75)}Q${m(2.6)} ${m(3.4)} ${m(3.4)} ${m(3.62)}L${m(4.4)} ${m(3.72)}L${m(4.4)} ${m(5)}L${m(-0.2)} ${m(5)}Z`, pal.cap);
      s += R(-1, 0.9, 1.6, 1.25, "#eceee9");
    }
    return s;
  };
  const over = (g) => {
    let s = W(cabD[0] + 0.25, 2.0, cabD[1] - 0.25, 2.75, 0.12) + doorEdge(cabD, 0.85, 3.0);
    for (const [a, b] of [...fw, ...rw]) s += W(a, 1.67, b, 2.82, 0.2);
    s += Dr(d1[0], 0.62, d1[1], 2.95, pal.door, { glass: [0.28, 0.88], gw: 0.48, seam: "#6d7378" }) + doorEdge(d1, 0.62, 2.95);
    s += lamp(m(0.5), m(1.5), m(0.4), m(0.13), "#f4f1df");
    if (bw) {
      s += bwegtMark(c, 7.75, 1.12, 0.55, { lion: false }) + TXT(c, 7.75, 1.52, 0.07, "DB Regio fährt für", "#2a2c2a", { weight: 500, anchor: "start" }) + bwLion(c, 11.0, 1.15, 0.8) +
        bwegtMark(c, 5.0, 1.75, 0.2) + bikeSign(m(19.0), m(1.05), m(0.5), "#ffd400") + R(19.6, 0.95, 19.75, 1.08, DB.red) + dbLogo(c, m(1.0), m(2.05), m(0.2));
    } else {
      s += bahnland(c, 7.8, 1.3, 0.34) + dbLogo(c, m(15.0), m(3.32), m(0.24)) + dbLogo(c, m(0.95), m(2.15), m(0.24));
      s += classMark(c, 8.9, 2.55, "1") + classMark(c, 10.35, 2.55, "2") + bikeSign(m(16.6), m(3.32), m(0.28));
    }
    return s + autoCoupler(m(0.55), m(0.9));
  };
  const under = (g) => tr(5.35, 0.9, { d: 31, wb: 2.3 }) + jakobs(L, m(0.9), 30, m(2.3)) + cases(m(d1[1] + 0.4), m(23.0), m(0.85), 3, m(0.35));
  const top = (g) => fairing(m(13.0), m(5.5), m(MI.roof) - 0.05, 0.95, "#2b2e32", 3) + fairing(m(19.0), m(4.6), m(MI.roof) - 0.05, 0.95, "#2b2e32", 3);
  return body(c, { sill: m(0.9), roof: m(MI.roof), nose: miNose(), x1: L - 0.3, endR: 0.3, base: pal.body, paint, over, under, top, ends: [m(0.95), m(3.5)] });
}
function miMid(c, liv, { pan = true } = {}) {
  const pal = MIP[liv], L = c.L, bw = liv === "bw";
  const d1 = [2.9, 4.3], d2 = [15.5, 16.9], ws = [[0.9, 2.4], [5.0, 6.5], [6.85, 8.35], [8.7, 10.2], [10.55, 12.05], [12.4, 13.9], [17.4, 18.9]];
  const paint = (g) => {
    let s = rect(-1, 0, L + 2, 20, pal.body);
    if (bw) s += R(-1, 3.3, MI.midL + 1, 3.72, pal.yellow) + R(-1, 0, MI.midL + 1, 0.9, pal.skirt) + R(-1, 1.5, d1[0], 2.95, pal.dark) + R(d1[1], 1.5, d2[0], 2.95, pal.dark) + R(d2[1], 1.5, MI.midL + 1, 2.95, pal.dark);
    else s += R(-1, 0.9, MI.midL + 1, 1.12, pal.band) + R(-1, 0, MI.midL + 1, 0.9, pal.skirt) + stripe(-1, MI.midL + 1, 3.05, 0.08, pal.line);
    return s;
  };
  const over = (g) => {
    let s = "";
    for (const [a, b] of ws) s += W(a, 1.67, b, 2.82, 0.2);
    for (const d of [d1, d2]) s += Dr(d[0], 0.62, d[1], 2.95, pal.door, { glass: [0.28, 0.88], gw: 0.48, seam: "#6d7378" }) + doorEdge(d, 0.62, 2.95);
    if (bw) s += bwegtMark(c, 5.4, 3.12, 0.22) + bikeSign(m(6.2), m(1.05), m(0.5), "#ffd400") + bikeSign(m(7.5), m(1.05), m(0.5), "#ffd400") + bikeSign(m(13.6), m(1.05), m(0.5), "#ffd400") + dbLogo(c, m(17.6), m(1.15), m(0.2));
    else s += dbLogo(c, m(9.9), m(3.32), m(0.24)) + bikeSign(m(11.3), m(3.32), m(0.28)) + classMark(c, 8.55, 2.55, "2") + classMark(c, 12.25, 2.55, "2");
    return s;
  };
  const under = (g) => jakobs(0, m(0.9), 30, m(2.3)) + jakobs(L, m(0.9), 30, m(2.3)) + cases(m(4.8), m(14.5), m(0.85), 3, m(0.3));
  const top = (g) => fairing(m(1.0), m(3.2), m(MI.roof) - 0.05, 0.95, "#2b2e32", 2) + (pan ? panGear(m(9.9), m(MI.roof), { up: true, dir: -1 }) : fairing(m(7.5), m(4.6), m(MI.roof) - 0.05, 0.95, "#2b2e32", 3)) + fairing(m(15.4), m(3.6), m(MI.roof) - 0.05, 0.95, "#2b2e32", 2);
  return body(c, { sill: m(0.9), roof: m(MI.roof), x0: 0.3, x1: L - 0.3, endR: 0.3, base: pal.body, paint, over, under, top, ends: [m(0.95), m(3.5)] });
}
for (const [liv, tag, nm] of [["bw", "MiBw", "Mireo (bwegt)"], ["by", "Mi", "Mireo (DB Regio Bayern)"]]) {
  addCab(`dw${tag}End`, `${nm} end car`, (c) => miEnd(c, liv), m(MI.endL), { amenities: liv === "by" ? ["first"] : [] });
  add(`dw${tag}Mid`, `${nm} middle car`, (c) => miMid(c, liv), m(MI.midL), { pan: true, amenities: ["bikes"] });
}
add("dwMiMid2", "Mireo (DB Regio Bayern) middle car", (c) => miMid(c, "by", { pan: false }), m(MI.midL), { amenities: ["bikes"] });
SETS.miBw3 = set("Mireo (bwegt), three cars", ["dwMiBwEnd", 1], ["dwMiBwMid", 1], ["dwMiBwEndR", 1]);
SETS.miBw3x2 = set("Two Mireo (bwegt)", ["dwMiBwEnd", 1], ["dwMiBwMid", 1], ["dwMiBwEndR", 1], ["dwMiBwEnd", 1], ["dwMiBwMid", 1], ["dwMiBwEndR", 1]);
SETS.miBy4 = set("Mireo, four cars (DB Regio Bayern, Flughafenexpress)", ["dwMiEnd", 1], ["dwMiMid", 1], ["dwMiMid2", 1], ["dwMiEndR", 1]);

// ===================== Stadler FLIRT 3 =====================
// FLIRT 3 160 (DB 0429.1 Südwest-Express, five cars, 90.8 m, 2.88 m
// wide, 4.12 m tall, floor 780 mm, Stadler's data sheet; 1428, four cars,
// 74.2 m): end cars 20.5 m from the coupler face to the Jakobs truck,
// middle cars 16.6 m between them. Measured off 1428 502 at Duisburg (a
// near-broadside, 2019) and 429 113 at Koblenz (2024): the nose, a large
// cab side window, the cab door, the equipment room over the motor truck
// (no windows), four windows, a double door, two windows to the joint.
// DB Regio NRW 1428 (RE 42 Niers-Haard-Express; 1428 008 in 2024 as in
// 2019): verkehrsrot, the roof and the cab's top grey, a light grey line
// at the windows' tops (yellow over first class), a light grey band low
// along the side over dark grey; light grey doors; "NWL", the VRR mark
// and "REGIO DB" low behind the cab door.
// SÜWEX (Südwest-Express, 0429 100-127): since 2023 repainted with the end
// cars verkehrsrot from the nose to the first passenger windows, big
// white-outlined triangles on the red; the rest Fliederweiß (RAL 290 93 05)
// with grey door surrounds (yellow round the first-class doors) and
// "SÜWEX" in grey low on the side (429 113 at Koblenz 2024, 429 117 at
// Köln 2025, 429 602 at Mannheim 2026: every Süwex photographed since
// 2025 is repainted).
const FL = { roof: 4.12, endL: 20.5, midL: 16.6 };
const FLP = {
  dbr: { body: DB.red, roof: "#8c9297", band: "#d4d8da", skirt: "#4a4f55", line: "#d4d8da", door: "#d4d8da", visor: "#2a2e33" },
  suw: { body: "#e4e4ea", red: DB.red, roof: "#b9bcc2", skirt: "#5b5f66", door: "#e4e4ea", frame: "#8e9399", visor: "#2a2e33" },
};
const flNose = () => [[m(0.85), m(0.45)], [m(0.4), m(0.75)], [m(0.25), m(1.2)], ["q", m(0.22), m(1.9), m(0.42), m(2.55)], ["q", m(0.72), m(3.25), m(1.4), m(3.75)],
  ["q", m(2.1), m(4.08), m(3.0), m(4.12)], [m(3.2), m(4.12)]];
// The SÜWEX end car's white-outlined triangles (point down), x0..x1 the
// red part; drawn in metres.
function suwTriangles(x0) {
  const st = `stroke="#ffffff" stroke-width="${m(0.07)}"`;
  const tri = (x, y, w, h = w * 1.05) => path(`M${m(x)} ${m(y)}L${m(x + w)} ${m(y)}L${m(x + w / 2)} ${m(y - h)}Z`, "none", 0, st);
  return tri(x0 + 0.85, 3.0, 1.15) + tri(x0 + 2.4, 3.0, 1.15) + tri(x0 + 0.75, 4.6, 1.2) + tri(x0 + 2.35, 4.6, 1.2) + tri(x0 + 0.1, 1.15, 1.15, 1.6) +
    path(`M${m(x0 - 0.6)} ${m(-0.2)}L${m(x0 + 0.2)} ${m(1.15)}`, "none", 0, st);
}
function flEnd(c, liv) {
  const pal = FLP[liv], L = c.L, suw = liv === "suw";
  const cabW = [3.35, 4.8], cabD = [5.25, 6.1], ws = [[9.3, 10.6], [11.0, 12.3], [12.7, 14.0], [14.3, 15.5]], d1 = [16.0, 17.35], ws2 = [[17.75, 18.9], [19.2, 20.15]];
  const paint = (g) => {
    let s = rect(-1, 0, L + 2, 20, pal.body);
    if (suw) {
      s += R(-1, 3.65, FL.endL + 1, 5, pal.roof) + R(-1, 0, FL.endL + 1, 0.55, pal.skirt);
      s += path(`M${m(-0.2)} 0L${m(8.9)} 0L${m(10.3)} ${m(5)}L${m(-0.2)} ${m(5)}Z`, pal.red) + suwTriangles(6.3);
      s += R(d1[0] - 0.2, 0.55, d1[1] + 0.2, 3.65, pal.frame) + R(d1[0] - 0.2, 3.0, d1[1] + 0.2, 3.65, DB.yellow);
    } else {
      s += R(-1, 3.65, FL.endL + 1, 5, pal.roof) + R(-1, 0.98, FL.endL + 1, 1.18, pal.band) + R(-1, 0, FL.endL + 1, 0.98, pal.skirt);
      s += stripe(6.2, FL.endL + 1, 3.15, 0.08, pal.line) + stripe(8.9, 14.0, 3.15, 0.08, DB.yellow);
    }
    // The cab's top and the visor round the windshield.
    s += path(`M${m(-0.2)} ${m(2.05)}Q${m(1.2)} ${m(2.15)} ${m(2.1)} ${m(2.6)}Q${m(2.9)} ${m(3.1)} ${m(3.3)} ${m(3.65)}L${m(-0.2)} ${m(3.65)}Z`, pal.visor) + (suw ? "" : R(-0.2, 3.62, 5.4, 5, pal.roof));
    return s;
  };
  const over = (g) => {
    let s = path(`M${m(cabW[0])} ${m(2.3)}L${m(cabW[1])} ${m(2.3)}L${m(cabW[1])} ${m(3.3)}L${m(cabW[0] + 0.55)} ${m(3.3)}Z`, "#1d2024", 0, `stroke="#111316" stroke-width="0.6" vector-effect="non-scaling-stroke"`) +
      W(cabD[0] + 0.22, 2.2, cabD[1] - 0.22, 2.95, 0.1) + doorEdge(cabD, 0.75, 3.1) + lines([[m(cabD[0] - 0.12), m(1.1), m(cabD[0] - 0.12), m(2.7)], [m(cabD[1] + 0.12), m(1.1), m(cabD[1] + 0.12), m(2.7)]], "#9aa0a6", 0.8);
    for (const [a, b] of [...ws, ...ws2]) s += W(a, 1.65, b, 2.7, 0.16);
    s += Dr(d1[0], 0.8, d1[1], 2.98, pal.door, { glass: [0.28, 0.88], gw: 0.44, seam: "#6d7378" }) + doorEdge(d1, 0.8, 2.98);
    s += lamp(m(0.35), m(1.55), m(0.45), m(0.15), "#f4f1df") + dbLogo(c, m(0.6), m(2.05), m(0.25));
    if (suw) s += TXT(c, 12.4, 1.15, 0.28, "SÜWEX", "#8e9399", { weight: 500, spacing: 0.04 }) + classMark(c, d1[0] - 0.35, 2.5, "1", "#4a4f55");
    else {
      s += TXT(c, 7.05, 1.5, 0.3, "NWL", "#ffffff", { weight: 700, anchor: "start", italic: true }) + path(`M${m(6.4)} ${m(1.3)}L${m(6.75)} ${m(1.75)}M${m(6.6)} ${m(1.3)}L${m(6.95)} ${m(1.75)}`, "none", 0, `stroke="#ffffff" stroke-width="${m(0.06)}"`);
      s += markAt(c, m(8.35), m(1.5), m(0.42), '<path d="M0 -0.5L0.43 -0.25L0.43 0.25L0 0.5L-0.43 0.25L-0.43 -0.25Z" fill="none" stroke="#ffffff" stroke-width="0.09"/>') + TXT(c, 8.35, 1.5, 0.13, "VRR", "#ffffff", { weight: 700 });
      s += TXT(c, 10.3, 1.5, 0.34, "REGIO", "#ffffff", { weight: 700, anchor: "end", stretch: 0.9 }) + dbLogo(c, m(10.72), m(1.5), m(0.3), { outline: true });
      s += classMark(c, 14.1, 2.55, "1") + classMark(c, ws2[0][0] - 0.2, 2.55, "2") + bikeSign(m(d1[0] - 0.6), m(3.15), m(0.25));
    }
    return s + autoCoupler(m(0.45), m(0.95));
  };
  const under = (g) => tr(7.5, 0.98, { d: 34, wb: 2.5 }) + jakobs(L, m(0.98), 30, m(2.5)) + cases(m(9.0), m(15.5), m(0.6), 3, m(0.3)) +
    path(`M${m(0.85)} ${m(0.45)}L${m(2.6)} ${m(0.42)}L${m(2.9)} ${m(0.98)}L${m(0.85)} ${m(0.98)}Z`, "#2a2d31");
  const top = (g) => R(3.3, 4.1, 5.0, 4.3, "#2d3034", 'rx="0.06"') + fairing(m(6.2), m(4.6), m(FL.roof) - 0.05, 0.85, "#3a3e43", 3) + fairing(m(11.6), m(5.2), m(FL.roof) - 0.05, 0.8, "#3a3e43", 3);
  return body(c, { sill: m(0.6), roof: m(FL.roof), nose: flNose(), x1: L - 0.3, endR: 0.4, base: pal.body, paint, over, under, top, ends: [m(0.9), m(3.3)] });
}
function flMid(c, liv, { pan = false } = {}) {
  const pal = FLP[liv], L = c.L, suw = liv === "suw";
  const d1 = [0.9, 2.25], ws = seq(2.75, 1.65, 8).map((a) => [a, a + 1.2]);
  const paint = (g) => {
    let s = rect(-1, 0, L + 2, 20, pal.body);
    if (suw) s += R(-1, 3.65, FL.midL + 1, 5, pal.roof) + R(-1, 0, FL.midL + 1, 0.55, pal.skirt) + R(d1[0] - 0.2, 0.55, d1[1] + 0.2, 3.65, pal.frame);
    else s += R(-1, 3.65, FL.midL + 1, 5, pal.roof) + R(-1, 0.98, FL.midL + 1, 1.18, pal.band) + R(-1, 0, FL.midL + 1, 0.98, pal.skirt) + stripe(-1, FL.midL + 1, 3.15, 0.08, pal.line);
    return s;
  };
  const over = (g) => {
    let s = "";
    for (const [a, b] of ws) s += W(a, 1.65, b, 2.7, 0.16);
    s += Dr(d1[0], 0.8, d1[1], 2.98, pal.door, { glass: [0.28, 0.88], gw: 0.44, seam: "#6d7378" }) + doorEdge(d1, 0.8, 2.98);
    if (suw) s += bikeSign(m(4.4), m(3.2), m(0.45), "#8e9399") + TXT(c, 9.5, 1.15, 0.28, "SÜWEX", "#8e9399", { weight: 500, spacing: 0.04 });
    else s += classMark(c, 2.55, 2.55, "2") + bikeSign(m(3.4), m(3.15), m(0.25));
    return s;
  };
  const under = (g) => jakobs(0, m(0.98), 30, m(2.5)) + jakobs(L, m(0.98), 30, m(2.5)) + cases(m(3.5), m(13.5), m(0.6), 3, m(0.3));
  const top = (g) => pan ? panGear(m(4.0), m(FL.roof), { up: true, dir: -1 }) + fairing(m(8.5), m(5.0), m(FL.roof) - 0.05, 0.8, "#3a3e43", 3)
    : fairing(m(2.0), m(5.0), m(FL.roof) - 0.05, 0.8, "#3a3e43", 3) + fairing(m(9.0), m(5.0), m(FL.roof) - 0.05, 0.8, "#3a3e43", 3);
  return body(c, { sill: m(0.6), roof: m(FL.roof), x0: 0.3, x1: L - 0.3, endR: 0.4, base: pal.body, paint, over, under, top, ends: [m(0.9), m(3.3)] });
}
for (const [liv, tag, nm] of [["dbr", "Fl1428", "FLIRT 3 (DB 1428)"], ["suw", "FlSuw", "FLIRT 3 (SÜWEX, DB 429.1)"]]) {
  addCab(`dw${tag}End`, `${nm} end car`, (c) => flEnd(c, liv), m(FL.endL), { amenities: ["first"] });
  add(`dw${tag}Mid`, `${nm} middle car`, (c) => flMid(c, liv), m(FL.midL), { amenities: ["bikes"] });
  add(`dw${tag}MidR`, `${nm} middle car`, mirrorDraw((c) => flMid(c, liv)), m(FL.midL), { amenities: ["bikes"] });
  add(`dw${tag}MidP`, `${nm} middle car with pantograph`, (c) => flMid(c, liv, { pan: true }), m(FL.midL), { pan: true });
}
SETS.fl1428 = set("FLIRT 3 (DB 1428), four cars (often two)", ["dwFl1428End", 1], ["dwFl1428MidP", 1], ["dwFl1428MidR", 1], ["dwFl1428EndR", 1]);
SETS.fl1428x2 = set("Two FLIRT 3 (DB 1428)", ["dwFl1428End", 1], ["dwFl1428MidP", 1], ["dwFl1428MidR", 1], ["dwFl1428EndR", 1], ["dwFl1428End", 1], ["dwFl1428MidP", 1], ["dwFl1428MidR", 1], ["dwFl1428EndR", 1]);
SETS.flSuw = set("SÜWEX FLIRT 3 (DB 429.1), five cars", ["dwFlSuwEnd", 1], ["dwFlSuwMid", 1], ["dwFlSuwMidP", 1], ["dwFlSuwMidR", 1], ["dwFlSuwEndR", 1]);
SETS.flSuwx2 = set("Two SÜWEX FLIRT 3 (DB 429.1)", ["dwFlSuwEnd", 1], ["dwFlSuwMid", 1], ["dwFlSuwMidP", 1], ["dwFlSuwMidR", 1], ["dwFlSuwEndR", 1], ["dwFlSuwEnd", 1], ["dwFlSuwMid", 1], ["dwFlSuwMidP", 1], ["dwFlSuwMidR", 1], ["dwFlSuwEndR", 1]);

// FLIRT 3 XL of the Verkehrsverbund Rhein-Ruhr (3427 001-017, three cars,
// 67.6 m; 3429 001-024, five cars, 106.2 m; VRR's, leased to DB Regio NRW
// for the S-Bahn and the RB 32, RB 40, RE 41, RE 49 and RE 34): end cars
// 24.15 m to the Jakobs truck, middle cars 19.3 m, the larger XL body.
// VRR's operator-neutral paint (3429 013 at Voerde March 2026, 3427 003 at
// Oberhausen June 2026, 3429 014 September 2026): white, VRR green over the
// roof's edge and all round the cab, green doors, the windshield in black;
// "Ich fahre elektrisch." in a purple hexagon behind the cab door; a short
// yellow bar over first class; the DB logo on the front only.
const XL = { roof: 4.25, endL: 24.15, midL: 19.3, green: "#5fb92e", white: "#f1f2f1", purple: "#7b2a8c", skirt: "#5d6268" };
function xlEnd(c) {
  const L = c.L, cabW = [3.35, 4.85], cabD = [5.35, 6.2], ws = [[9.2, 10.7], [11.1, 12.5], [12.9, 13.6]], d1 = [14.1, 15.55];
  const ws2 = [[16.05, 17.3], [17.65, 18.9], [19.25, 20.5], [20.85, 22.1], [22.45, 23.6]];
  const paint = (g) => rect(-1, 0, L + 2, 20, XL.white) + R(-1, 3.75, XL.endL + 1, 5, XL.green) + R(-1, 0, XL.endL + 1, 0.5, XL.skirt) +
    path(`M${m(-0.2)} 0L${m(5.0)} 0Q${m(5.25)} ${m(2.0)} ${m(5.05)} ${m(3.8)}L${m(5.05)} ${m(5)}L${m(-0.2)} ${m(5)}Z`, XL.green) +
    path(`M${m(-0.2)} ${m(2.05)}Q${m(1.2)} ${m(2.15)} ${m(2.1)} ${m(2.6)}Q${m(2.9)} ${m(3.15)} ${m(3.3)} ${m(3.75)}L${m(-0.2)} ${m(3.75)}Z`, "#1f2226") +
    R(0.0, 0.9, 1.6, 1.95, XL.white) + R(d1[0] - 0.12, 0.5, d1[1] + 0.12, 3.05, XL.green);
  const over = (g) => {
    let s = path(`M${m(cabW[0])} ${m(2.3)}L${m(cabW[1])} ${m(2.3)}L${m(cabW[1])} ${m(3.35)}L${m(cabW[0] + 0.55)} ${m(3.35)}Z`, "#1d2024", 0, `stroke="#111316" stroke-width="0.6" vector-effect="non-scaling-stroke"`) +
      W(cabD[0] + 0.22, 2.2, cabD[1] - 0.22, 2.95, 0.1) + doorEdge(cabD, 0.75, 3.1);
    for (const [a, b] of [...ws, ...ws2]) s += W(a, 1.65, b, 2.75, 0.16);
    s += Dr(d1[0], 0.78, d1[1], 3.0, XL.green, { glass: [0.28, 0.88], gw: 0.44, seam: "#3c7a1d" }) + doorEdge(d1, 0.78, 3.0);
    s += markAt(c, m(7.3), m(2.35), m(0.75), `<path d="M0 -0.5L0.43 -0.25L0.43 0.25L0 0.5L-0.43 0.25L-0.43 -0.25Z" fill="${XL.purple}"/>`) +
      TXT(c, 7.3, 2.45, 0.12, "Ich fahre", "#ffffff", { weight: 700 }) + TXT(c, 7.3, 2.29, 0.12, "elektrisch.", "#ffffff", { weight: 700 });
    s += R(9.2, 3.0, 10.7, 3.08, DB.yellow) + classMark(c, 10.9, 2.55, "1", "#3a3d40") + classMark(c, 9.0, 2.55, "2", "#3a3d40") + bikeSign(m(d1[0] + 0.72), m(1.25), m(0.35), "#ffffff");
    s += lamp(m(0.35), m(1.55), m(0.45), m(0.15), RED_LAMP) + dbLogo(c, m(0.75), m(1.45), m(0.28));
    return s + autoCoupler(m(0.45), m(0.95));
  };
  const under = (g) => tr(7.6, 0.98, { d: 34, wb: 2.5 }) + jakobs(L, m(0.98), 30, m(2.5)) + cases(m(9.0), m(21.5), m(0.55), 4, m(0.3)) +
    path(`M${m(0.85)} ${m(0.45)}L${m(2.6)} ${m(0.42)}L${m(2.9)} ${m(0.98)}L${m(0.85)} ${m(0.98)}Z`, "#2a2d31");
  const top = (g) => fairing(m(6.0), m(4.6), m(XL.roof) - 0.05, 0.85, "#3a3e43", 3) + fairing(m(13.0), m(6.0), m(XL.roof) - 0.05, 0.8, "#3a3e43", 3);
  return body(c, { sill: m(0.5), roof: m(XL.roof), nose: flNose().map((p) => p[0] === "q" ? ["q", p[1], p[2] * 1.032, p[3], p[4] * 1.032] : [p[0], p[1] * 1.032]), x1: L - 0.3, endR: 0.4, base: XL.white, paint, over, under, top, ends: [m(0.9), m(3.4)] });
}
function xlMid(c, { pan = false } = {}) {
  const L = c.L, d1 = [0.9, 2.35], ws = seq(2.9, 1.62, 10).map((a) => [a, a + 1.25]);
  const paint = (g) => rect(-1, 0, L + 2, 20, XL.white) + R(-1, 3.75, XL.midL + 1, 5, XL.green) + R(-1, 0, XL.midL + 1, 0.5, XL.skirt) + R(d1[0] - 0.12, 0.5, d1[1] + 0.12, 3.05, XL.green);
  const over = (g) => {
    let s = "";
    for (const [a, b] of ws) s += W(a, 1.65, b, 2.75, 0.16);
    s += Dr(d1[0], 0.78, d1[1], 3.0, XL.green, { glass: [0.28, 0.88], gw: 0.44, seam: "#3c7a1d" }) + doorEdge(d1, 0.78, 3.0) + classMark(c, 2.7, 2.55, "2", "#3a3d40");
    return s;
  };
  const under = (g) => jakobs(0, m(0.98), 30, m(2.5)) + jakobs(L, m(0.98), 30, m(2.5)) + cases(m(3.5), m(16.0), m(0.55), 3, m(0.3));
  const top = (g) => pan ? panGear(m(4.2), m(XL.roof), { up: true, dir: -1 }) + fairing(m(9.0), m(6.0), m(XL.roof) - 0.05, 0.8, "#3a3e43", 3)
    : fairing(m(2.5), m(6.0), m(XL.roof) - 0.05, 0.8, "#3a3e43", 3) + fairing(m(10.5), m(6.0), m(XL.roof) - 0.05, 0.8, "#3a3e43", 3);
  return body(c, { sill: m(0.5), roof: m(XL.roof), x0: 0.3, x1: L - 0.3, endR: 0.4, base: XL.white, paint, over, under, top, ends: [m(0.9), m(3.4)] });
}
addCab("dwXlEnd", "FLIRT 3 XL (VRR, DB 3427/3429) end car", xlEnd, m(XL.endL), { amenities: ["first"] });
add("dwXlMid", "FLIRT 3 XL (VRR) middle car", (c) => xlMid(c), m(XL.midL));
add("dwXlMidR", "FLIRT 3 XL (VRR) middle car", mirrorDraw((c) => xlMid(c)), m(XL.midL));
add("dwXlMidP", "FLIRT 3 XL (VRR) middle car with pantograph", (c) => xlMid(c, { pan: true }), m(XL.midL), { pan: true });
SETS.xl3 = set("FLIRT 3 XL (VRR, DB 3427), three cars", ["dwXlEnd", 1], ["dwXlMidP", 1], ["dwXlEndR", 1]);
SETS.xl5 = set("FLIRT 3 XL (VRR, DB 3429), five cars", ["dwXlEnd", 1], ["dwXlMid", 1], ["dwXlMidP", 1], ["dwXlMidR", 1], ["dwXlEndR", 1]);

// ===================== Stadler FLIRT Akku (6526) =====================
// DB Regio Mitte's battery FLIRTs for the Pfalznetz (6526 001-044, from
// 2025; the RE 6 Karlsruhe–Neustadt since 2026): two cars on their own
// trucks (Bo'Bo' + 2'2'), about 23.3 m each. Paint as the Pfalz's new
// design (6526 005 at Kaiserslautern September 2025, a 6526 at Karlsruhe
// Hbf October 2026): each car's front half verkehrsrot with white-outlined
// triangles, the rear Fliederweiß, a yellow surround round the first-
// class door, "Akku statt Diesel" in teal with a teal triangle and plug.
const AK = { L: 23.3, roof: 4.12, white: "#e4e4ea", teal: "#2a9d97", skirt: "#5b5f66" };
function akkuCar(c, motor) {
  const L = c.L, cabW = [3.3, 4.75], cabD = [5.15, 6.0], ws = [[6.5, 7.4], [7.85, 9.3]], d1 = [11.0, 12.35], ws2 = [[12.9, 14.1], [14.5, 15.7], [16.1, 17.3], [17.7, 18.9], [19.3, 20.5], [20.9, 22.1]];
  const paint = (g) => {
    let s = rect(-1, 0, L + 2, 20, AK.white) + R(-1, 3.65, AK.L + 1, 5, "#b9bcc2") + R(-1, 0, AK.L + 1, 0.55, AK.skirt);
    s += path(`M${m(-0.2)} 0L${m(9.4)} 0L${m(10.4)} ${m(5)}L${m(-0.2)} ${m(5)}Z`, DB.red) + suwTriangles(6.6);
    s += path(`M${m(-0.2)} ${m(2.05)}Q${m(1.2)} ${m(2.15)} ${m(2.1)} ${m(2.6)}Q${m(2.9)} ${m(3.1)} ${m(3.3)} ${m(3.65)}L${m(-0.2)} ${m(3.65)}Z`, "#2a2e33");
    s += R(d1[0] - 0.15, 3.05, d1[1] + 0.15, 3.6, DB.yellow);
    return s;
  };
  const over = (g) => {
    let s = path(`M${m(cabW[0])} ${m(2.3)}L${m(cabW[1])} ${m(2.3)}L${m(cabW[1])} ${m(3.3)}L${m(cabW[0] + 0.55)} ${m(3.3)}Z`, "#1d2024", 0, `stroke="#111316" stroke-width="0.6" vector-effect="non-scaling-stroke"`) +
      W(cabD[0] + 0.22, 2.2, cabD[1] - 0.22, 2.95, 0.1) + doorEdge(cabD, 0.75, 3.1);
    for (const [a, b] of [...ws, ...ws2]) s += W(a, 1.65, b, 2.7, 0.16);
    s += Dr(d1[0], 0.8, d1[1], 2.98, AK.white, { glass: [0.28, 0.88], gw: 0.44, seam: "#6d7378" }) + doorEdge(d1, 0.8, 2.98);
    s += path(`M${m(12.9)} ${m(0.75)}L${m(14.3)} ${m(0.75)}L${m(13.6)} ${m(1.95)}Z`, "none", 0, `stroke="${AK.teal}" stroke-width="${m(0.06)}"`) +
      TXT(c, 13.6, 1.25, 0.12, "Akku statt", AK.teal, { weight: 600 }) + TXT(c, 13.6, 1.08, 0.12, "Diesel", AK.teal, { weight: 600 }) +
      TXT(c, 17.5, 1.25, 0.22, "Akku statt Diesel", AK.teal, { weight: 500 }) + classMark(c, d1[0] - 0.35, 2.5, "1", "#4a4f55");
    s += TXT(c, 6.2, 0.95, 0.15, "STADLER", "#ffffff", { weight: 700, anchor: "start" }) + lamp(m(0.35), m(1.55), m(0.45), m(0.15), "#f4f1df") + dbLogo(c, m(0.6), m(2.05), m(0.25));
    return s + autoCoupler(m(0.45), m(0.95));
  };
  const under = (g) => tr(5.8, 0.98, { d: motor ? 34 : 30, wb: 2.5 }) + tr(AK.L - 2.9, 0.98, { d: 30, wb: 2.5 }) + cases(m(7.5), m(19.5), m(0.6), 4, m(0.35)) +
    path(`M${m(0.85)} ${m(0.45)}L${m(2.6)} ${m(0.42)}L${m(2.9)} ${m(0.98)}L${m(0.85)} ${m(0.98)}Z`, "#2a2d31");
  const top = (g) => fairing(m(6.5), m(5.0), m(AK.roof) - 0.05, 0.85, "#3a3e43", 3) + fairing(m(12.5), m(7.5), m(AK.roof) - 0.05, 0.85, "#3a3e43", 4) +
    (motor ? panGear(m(20.5), m(AK.roof), { up: true, dir: -1 }) : "");
  return body(c, { sill: m(0.6), roof: m(AK.roof), nose: flNose(), x1: L - 0.35, endR: 0.4, base: AK.white, paint, over, under, top, ends: [m(0.9), m(3.3)] });
}
addCab("dwAkkuA", "FLIRT Akku (DB 6526) motor car", (c) => akkuCar(c, true), m(AK.L), { pan: true, amenities: ["first"] });
addCab("dwAkkuB", "FLIRT Akku (DB 6526) trailer car", (c) => akkuCar(c, false), m(AK.L), { amenities: ["first", "bikes"] });
SETS.akku = set("FLIRT Akku (DB 6526), two cars (often two units)", ["dwAkkuA", 1], ["dwAkkuBR", 1]);
SETS.akkux2 = set("Two FLIRT Akku (DB 6526)", ["dwAkkuA", 1], ["dwAkkuBR", 1], ["dwAkkuA", 1], ["dwAkkuBR", 1]);

// ===================== ET 425 / 426 =====================
// Siemens/Bombardier/DWA 425 (four cars, 67.5 m over the couplers; end
// cars 17.84 m, middle cars 15.505 m, on Jakobs trucks between the cars;
// 3.75 m tall, floor 798 mm; de.wikipedia "DB-Baureihe 425") and 426 (the
// two-car version, 36.49 m). Two double doors a side on every car.
// Measured off a broadside middle car at Ludwigshafen (August 2025) and
// 425 316 at Karlsruhe (October 2026): verkehrsrot, a light grey line under
// the roof's edge (yellow over first class, behind the cab), a light grey
// strip along the bottom, light grey doors, the cab's windshield in a dark
// grey surround, red class numerals on white plates beside the doors. DB
// Regio's 425s on the RB 27 (Mönchengladbach–Koblenz), Ulm–Lindau (RE 3,
// RB 93) and the Regio-S-Bahn Donau-Iller wear the same paint; the S-Bahn
// marks are left off.
const E4 = { roof: 3.75, sill: 0.74, endL: 18.25, midL: 15.505, grey: "#d4d8da" };
const e4Nose = () => [[m(0.55), m(0.74)], [m(0.4), m(1.0)], [m(0.38), m(1.75)], ["q", m(0.45), m(2.4), m(0.75), m(3.0)], ["q", m(1.0), m(3.5), m(1.5), m(3.68)], [m(2.0), m(3.75)]];
const e4Plate = (c, x, cls) => R(x - 0.13, 2.25, x + 0.13, 2.7, "#ffffff") + TXT(c, x, 2.52, 0.25, cls, DB.red, { weight: 700 }) + R(x - 0.08, 2.3, x + 0.08, 2.36, DB.red);
function e4Car(c, { cab = false, pan = false } = {}) {
  const L = c.L, end = cab;
  // Doors and windows (m from the left end): the end car's cab on the left.
  const lay = end
    ? { doors: [[7.35, 8.65], [11.5, 12.8]], wins: [[4.3, 5.5], [5.85, 7.0], [9.0, 10.25], [10.55, 11.15], [13.2, 14.4], [14.75, 15.95], [16.3, 17.5]], cabW: [2.5, 2.95] }
    : { doors: [[3.9, 5.2], [11.1, 12.4]], wins: [[0.6, 1.9], [2.25, 3.5], [5.6, 6.85], [7.2, 8.45], [8.8, 10.0], [12.8, 14.0], [14.3, 15.0]] };
  const paint = (g) => {
    let s = rect(-1, 0, L + 2, 20, DB.red) + R(-1, 0, L / M2F + 1, 0.95, E4.grey) + stripe(end ? 2.1 : -1, L / M2F + 1, 3.25, 0.06, E4.grey);
    if (end) s += stripe(4.1, 8.0, 3.25, 0.07, DB.yellow) +
      path(`M${m(0.38)} ${m(1.8)}Q${m(0.45)} ${m(2.4)} ${m(0.75)} ${m(3.0)}Q${m(1.0)} ${m(3.45)} ${m(1.45)} ${m(3.6)}L${m(1.75)} ${m(3.6)}L${m(1.55)} ${m(1.8)}Z`, "#3b4046");
    return s;
  };
  const over = (g) => {
    let s = "";
    for (const [a, b] of lay.wins) s += W(a, 1.69, b, 2.66, 0.16);
    for (const d of lay.doors) s += Dr(d[0], 0.82, d[1], 2.95, E4.grey, { glass: [0.36, 0.88], gw: 0.46, seam: "#6d7378" }) + doorEdge(d, 0.82, 2.95);
    if (end) {
      s += W(lay.cabW[0], 1.8, lay.cabW[1], 2.85, 0.1) + doorEdge([2.3, 3.15], 0.85, 3.0) + e4Plate(c, lay.doors[0][0] - 0.25, "1") + e4Plate(c, lay.doors[0][1] + 0.25, "2") + e4Plate(c, lay.doors[1][0] - 0.25, "2");
      s += lamp(m(0.4), m(1.2), m(0.3), m(0.16), "#f4f1df") + dbLogo(c, m(0.75), m(1.25), m(0.24));
    } else {
      s += e4Plate(c, lay.doors[0][1] + 0.25, "2") + e4Plate(c, lay.doors[1][0] - 0.25, "2") + bikeSign(m(6.2), m(1.3), m(0.3), "#ffffff");
    }
    return s + (end ? autoCoupler(m(0.55), m(0.95)) : "");
  };
  const tv = (x) => truck(m(x), { wb: m(2.5), d: 30, top: m(E4.sill) });
  const under = (g) => (end ? tv(2.9) : jakobs(0, m(E4.sill), 30, m(2.5))) + jakobs(L, m(E4.sill), 30, m(2.5)) + cases(m(end ? 5 : 3), m(end ? 15.5 : 13.0), m(E4.sill), 3, m(0.3));
  const top = (g) => fairing(m(end ? 4.5 : 3.0), m(4.5), m(E4.roof) - 0.05, 0.7, "#8e959c", 3) + (end && !pan ? "" : panGear(m(end ? 12.0 : 10.5), m(E4.roof), { up: true, dir: -1 }));
  return body(c, { sill: m(E4.sill), roof: m(E4.roof), ...(end ? { nose: e4Nose() } : { x0: 0.3 }), x1: L - 0.3, endR: 0.5, base: DB.red, paint, over, under, top, ends: [m(0.9), m(3.2)] });
}
addCab("dw425End", "ET 425/426 end car (first and second class)", (c) => e4Car(c, { cab: true }), m(E4.endL), { amenities: ["first"] });
add("dw425Mid", "ET 425 middle car with pantograph", (c) => e4Car(c), m(E4.midL), { pan: true, amenities: ["bikes"] });
add("dw425MidR", "ET 425 middle car with pantograph", mirrorDraw((c) => e4Car(c)), m(E4.midL), { pan: true, amenities: ["bikes"] });
SETS.e425 = set("ET 425, four cars (often two units)", ["dw425End", 1], ["dw425Mid", 1], ["dw425MidR", 1], ["dw425EndR", 1]);
SETS.e425x2 = set("Two ET 425", ["dw425End", 1], ["dw425Mid", 1], ["dw425MidR", 1], ["dw425EndR", 1], ["dw425End", 1], ["dw425Mid", 1], ["dw425MidR", 1], ["dw425EndR", 1]);
addCab("dw426End", "ET 426 end car with pantograph", (c) => e4Car(c, { cab: true, pan: true }), m(E4.endL), { pan: true, amenities: ["first"] });
SETS.e426 = set("ET 426, two cars", ["dw426End", 1], ["dw425EndR", 1]);

// ---------- Fleets ----------
// [first, last, key] over the 12-digit European Vehicle Number (94 80
// SSSS NNN c), from the cars' lettering in the photographs and the
// Wikipedia fleet tables: Desiro HC end cars 1462 0xx (accessible toilet)
// and 1462 5xx (first class), middle cars 1862; bwegt's are 001-015 and
// 501-515, Bavaria's 031-073 and 531-573; the six-car 4462/4862. Mireo end
// cars 0463 0xx/5xx (bwegt 001-024 and 085-091), Bavaria's 1463 001-006/
// 501-506. FLIRT: SÜWEX 0429 1xx and 6xx (the two end cars), 1428 0xx/5xx,
// VRR 3427 and 3429, FLIRT Akku 6526. ET 425 end cars 0425, middle cars
// 0435, 426.
const E = (series, from, to, key) => [Number(`9480${series}${String(from).padStart(3, "0")}0`), Number(`9480${series}${String(to).padStart(3, "0")}9`), key];
FLEETS.push(
  E("1462", 1, 15, "dwHcBwEnd2"), E("1462", 501, 515, "dwHcBwEnd1"), E("1862", 1, 15, "dwHcBwMid"), E("1862", 501, 515, "dwHcBwMid"),
  E("1462", 31, 99, "dwHcEnd2"), E("1462", 531, 599, "dwHcEnd1"), E("1862", 31, 99, "dwHcMid"), E("1862", 531, 599, "dwHcMid"),
  E("4462", 1, 99, "dwHcEnd2"), E("4462", 501, 599, "dwHcEnd1"), E("4862", 0, 999, "dwHcMid"),
  E("0463", 1, 24, "dwMiBwEnd"), E("0463", 501, 524, "dwMiBwEnd"), E("0463", 85, 91, "dwMiBwEnd"), E("0463", 585, 591, "dwMiBwEnd"),
  E("1463", 1, 6, "dwMiEnd"), E("1463", 501, 506, "dwMiEnd"),
  E("0429", 100, 127, "dwFlSuwEnd"), E("0429", 600, 627, "dwFlSuwEnd"),
  E("1428", 1, 14, "dwFl1428End"), E("1428", 501, 514, "dwFl1428End"),
  E("3427", 1, 17, "dwXlEnd"), E("3429", 1, 24, "dwXlEnd"), E("6526", 1, 44, "dwAkkuA"),
  E("0425", 0, 999, "dw425End"), E("0435", 0, 999, "dw425Mid"), E("0426", 0, 999, "dw426End"),
);

// ---------- Fact sheets ----------
const fHc = { model: "Siemens Desiro HC (DB 1462/4462)", type: "Electric multiple unit (single-deck end cars, double-deck middle cars)", builder: "Siemens Mobility", topSpeedMph: 99, powerHp: 4412, source: `${DEWP}Siemens_Desiro_HC` };
const hcBy = { ...fHc, built: "2021–2024", fleet: "DB Regio Bayern: 43 four-car (1462 031–073) and 8 six-car (4462 001–008) units", about: "DB Regio Bayern's Desiro HC run the Franken-Thüringen-Express (Nürnberg–Bamberg–Coburg/Saalfeld/Erfurt, the six-car ones at 190 km/h over the high-speed line) and the Donau-Isar-Express (München–Landshut–Passau)." };
const hcBw = { ...fHc, built: "2018–2020", fleet: "15 four-car units (1462 001–015)", about: "The Rheintal's RE 7 (Karlsruhe/Offenburg–Freiburg–Basel Bad Bf), in Baden-Württemberg's bwegt paint." };
FACTS.dwHcEnd1 = { ...hcBy, lengthFt: 90.0, about: `The end car with first class (1462 5xx). ${hcBy.about}` };
FACTS.dwHcEnd2 = { ...hcBy, lengthFt: 90.0, about: `The end car with the accessible toilet and the wheelchair places (1462 0xx). ${hcBy.about}` };
FACTS.dwHcMid = { ...hcBy, lengthFt: 82.7, about: `A double-deck middle car, step-free into its lower deck. ${hcBy.about}` };
FACTS.dwHcBwEnd1 = { ...hcBw, lengthFt: 90.0 }; FACTS.dwHcBwEnd2 = { ...hcBw, lengthFt: 90.0 }; FACTS.dwHcBwMid = { ...hcBw, lengthFt: 82.7 };
const fMi = { model: "Siemens Mireo (DB 463/1463)", type: "Electric multiple unit", builder: "Siemens Mobility", topSpeedMph: 99, powerHp: 3487, source: `${DEWP}Siemens_Mireo` };
FACTS.dwMiBwEnd = { ...fMi, built: "2019–2022", fleet: "24 units for the Rheintal (463 001–024), 7 for the Nordbaden-Express (463 085–091)", lengthFt: 82.0,
  about: "Three cars on four trucks. In bwegt paint on the Rheintal's RB 26/27/28 (Offenburg–Freiburg–Basel, Müllheim–Mulhouse) and the RE 73 Karlsruhe–Heidelberg." };
FACTS.dwMiBwMid = { ...FACTS.dwMiBwEnd, lengthFt: 65.0, about: "The middle car, with the pantograph and the bicycle spaces." };
FACTS.dwMiEnd = { ...fMi, built: "2022–2024", fleet: "6 four-car units (1463 001–006)", lengthFt: 82.0, about: "DB Regio Bayern's Flughafenexpress (RE 22 Regensburg–Landshut–München Flughafen): first class behind the cab." };
FACTS.dwMiMid = { ...FACTS.dwMiEnd, lengthFt: 65.0, about: "A middle car, with the pantograph." }; FACTS.dwMiMid2 = { ...FACTS.dwMiEnd, lengthFt: 65.0, about: "A middle car." };
const fFl = { model: "Stadler FLIRT 3", type: "Electric multiple unit", builder: "Stadler Rail", topSpeedMph: 99, source: `${DEWP}Stadler_Flirt` };
FACTS.dwFlSuwEnd = { ...fFl, model: "Stadler FLIRT 3 (DB 429.1, SÜWEX)", built: "2013–2015", fleet: "28 five-car units (0429 100–127)", lengthFt: 67.3,
  about: "The Südwest-Express (RE 1 Koblenz–Trier–Saarbrücken–Mannheim, RE 2 Koblenz–Mainz–Frankfurt, RE 4 Karlsruhe–Mainz–Frankfurt, RE 14 Mannheim–Frankfurt), repainted since 2023 with red ends and white-outlined triangles.", source: `${DEWP}SÜWEX` };
FACTS.dwFlSuwMid = { ...FACTS.dwFlSuwEnd, lengthFt: 54.5, about: "A middle car of the SÜWEX FLIRT." }; FACTS.dwFlSuwMidP = { ...FACTS.dwFlSuwMid, about: "The middle car carrying the pantograph." };
FACTS.dwFl1428End = { ...fFl, model: "Stadler FLIRT 3 (DB 1428)", built: "2014–2015", fleet: "14 four-car units", lengthFt: 67.3, about: "DB Regio NRW's FLIRTs for the RE 42 Niers-Haard-Express (Mönchengladbach–Essen–Münster), first class behind the cab." };
FACTS.dwFl1428Mid = { ...FACTS.dwFl1428End, lengthFt: 54.5, about: "A middle car." }; FACTS.dwFl1428MidP = { ...FACTS.dwFl1428Mid, about: "The middle car with the pantograph." };
FACTS.dwXlEnd = { ...fFl, model: "Stadler FLIRT 3 XL (VRR, DB 3427/3429)", built: "2019–2026", fleet: "17 three-car (3427) and 24 five-car (3429) units owned by the VRR", lengthFt: 79.2,
  about: "The Verkehrsverbund Rhein-Ruhr's own FLIRTs in its white and green, run by DB Regio NRW on the S-Bahn and the RB 32, RB 40, RE 41, RE 49 and RE 34." };
FACTS.dwXlMid = { ...FACTS.dwXlEnd, lengthFt: 63.3, about: "A middle car." }; FACTS.dwXlMidP = { ...FACTS.dwXlMid, about: "The middle car with the pantograph." };
FACTS.dwAkkuA = { ...fFl, model: "Stadler FLIRT Akku (DB 6526)", type: "Battery-electric multiple unit", built: "2024–2026", fleet: "44 two-car units (6526 001–044)", lengthFt: 76.4,
  about: "DB Regio Mitte's battery trains for the Pfalz's lines without wires (RE 6 Karlsruhe–Landau–Neustadt first); the motor car, with the pantograph that charges it." };
FACTS.dwAkkuB = { ...FACTS.dwAkkuA, about: "The trailer car of the FLIRT Akku, with the batteries under its floor." };
const f425 = { model: "DB Class 425/426", type: "Electric multiple unit", builder: "Siemens, Bombardier and DWA", built: "1999–2008", fleet: "250 four-car 425s and 60 two-car 426s", topSpeedMph: 99, powerHp: 3150, source: `${DEWP}DB-Baureihe_425_(1999)` };
FACTS.dw425End = { ...f425, lengthFt: 59.9, about: "DB Regio's workhorse for the regional lines, here on the RB 27 (Mönchengladbach–Köln–Koblenz), Ulm–Friedrichshafen–Lindau (RE 3, RB 93) and the Regio-S-Bahn Donau-Iller; first class behind the cab." };
FACTS.dw425Mid = { ...f425, lengthFt: 50.9, about: "A middle car of the 425, with the pantograph." }; FACTS.dw426End = { ...f425, lengthFt: 59.9, about: "The two-car 426's end car with the pantograph." };
for (const k of Object.keys(TYPES)) { const b = k.replace(/R$/, ""); if (!FACTS[k] && FACTS[b]) FACTS[k] = FACTS[b]; }
return { TYPES, MODELS, SETS, FACTS, FLEETS };
});


// =====================================================================
// ÖBB 4024 (Talent) on the Außerfernbahn (S 7 Pfronten-Steinach–Reutte–
// Lähn, run by ÖBB for Tirol alongside DB Regio's Talent 2s).
// =====================================================================
const PART_OBB = safe("obb", () => {
  const { TYPES, MODELS, add, addCab } = registry();
  const FACTS = {}, SETS = {}, FLEETS = [];
  // Bombardier Talent EMU (ÖBB 4024, 2004-2008): four cars, 66.87 m, on
  // five trucks (Bo'2'2'2'Bo': motor trucks under the cabs, Jakobs trucks
  // at the joints), 2.925 m wide, the floor 590 mm at the doors, second
  // class only (de.wikipedia "ÖBB 4024"). End cars about 18.6 m to the
  // joint, middle cars 14.8 m. Measured off 4024 058 near Innsbruck (May
  // 2025, Tirol's units) and 4024 126 (2024, near broadside): the cab end
  // raised over the motor truck with four big windows, a double door, two
  // windows to the joint; the middle cars two windows, the door, three.
  // The cityjet paint every 4024 wears since 2024: white, the window band
  // black, a red band under it in four stripes (red, orange-red, orange,
  // red) over a black skirt; the cab's roof and windshield black edged in
  // red; the doors black with two white lines; "ÖBB" in red by the cab and
  // on the nose, "cityjet" in grey outline letters, Tirol's red mark on
  // the middle cars, "REGIOZUG" under the cab's windows.
  const OB = { white: "#f2f3f3", red: "#e2001a", red2: "#f04820", orange: "#f46a2a", black: "#1d1f22", grey: "#a9adb1", roof: "#8e9399" };
  const Y = { skirt: 0.47, red: [0.85, 1.77], win: [1.84, 3.06], low: [1.29, 2.54], roof: 3.56 };
  const NOSE = [[0.4, 0.47], [0.15, 0.85], [0.08, 1.4], [0.15, 2.0], ["q", 0.4, 2.85, 1.1, 3.3], [1.9, 3.52], ["q", 2.3, 3.56, 2.9, 3.56]];
  // The red band in its four stripes, its top at y1 (lower at the nose).
  const stripes = (x0, x1, y1 = Y.red[1]) => { const h = y1 - Y.red[0]; return rect(m(x0), m(Y.red[0]), m(x1 - x0), m(h * 0.2), OB.red) + rect(m(x0), m(Y.red[0] + h * 0.2), m(x1 - x0), m(h * 0.28), OB.orange) +
    rect(m(x0), m(Y.red[0] + h * 0.48), m(x1 - x0), m(h * 0.24), OB.red2) + rect(m(x0), m(Y.red[0] + h * 0.72), m(x1 - x0), m(h * 0.28), OB.red); };
  const paintBand = (L) => rect(-1, 0, L + 2, 20, OB.white) + rect(-1, 0, L + 2, m(Y.red[0]), OB.black) + stripes(-0.5, L / M2F + 0.5);
  const band = (x0, x1, [y0, y1]) => rect(m(x0), m(y0), m(x1 - x0), m(y1 - y0), OB.black, 0, `rx="${m(0.12)}"`);
  const wins = (list, [y0, y1]) => list.map(([a, b]) => pane(m(a), m(y0 + 0.06), m(b - a), m(y1 - y0 - 0.12), m(0.08), "#0e0f11")).join("");
  // A door: black leaves, two white lines down it, a yellow step below.
  const door = (x0, x1) => leaves(m(x0), m(x1 - x0), m(0.55), m(3.0), OB.black, { glass: [0.4, 0.9], gw: 0.36, seam: "#55595e" }) +
    lines([[m(x0 + 0.33), m(0.6), m(x0 + 0.33), m(2.95)], [m(x1 - 0.33), m(0.6), m(x1 - 0.33), m(2.95)]], "#ffffff", 0.7) + rect(m(x0 - 0.05), m(0.42), m(x1 - x0 + 0.1), m(0.08), "#f2c200");
  const cityjet = (c, x, y) => T(c, m(x), m(y), m(0.5), "cityjet", "none", { weight: 400, italic: true, family: SANS }).replace('fill="none"', `fill="none" stroke="${OB.grey}" stroke-width="0.07"`);
  const obbWord = (c, x, y, h) => T(c, m(x), m(y), m(h), "ÖBB", OB.red, { weight: 800 });
  const tirol = (c, x, y) => rect(m(x - 0.22), m(y - 0.22), m(0.44), m(0.44), OB.red, 0, 'rx="0.12"') + T(c, m(x), m(y), m(0.14), "Tirol", "#ffffff", { weight: 800, italic: true });
  const jak = (x) => truck(x, { wb: m(2.2), d: 30, top: m(0.62) });

  function endCar(c, { pan = false } = {}) {
    const L = c.L;
    return body(c, {
      sill: m(Y.skirt), roof: m(Y.roof), nose: P(NOSE), base: OB.white, endR: 0.4,
      paint: (g) => rect(-1, 0, L + 2, 20, OB.white) + rect(-1, 0, L + 2, m(Y.red[0]), OB.black) + stripes(3.4, L / M2F + 0.5) +
        // under the cab the band's top sweeps down to the nose
        path(poly(P([[-0.5, Y.red[0]], [3.5, Y.red[0]], [3.5, Y.red[1]], ["q", 2.0, 1.72, 0.6, 1.4], [-0.5, 1.35]])), OB.red) +
        path(poly(P([[-0.5, 0.95], [3.5, 0.95], [3.5, 1.45], ["q", 2.0, 1.4, 0.6, 1.15], [-0.5, 1.1]])), OB.orange) +
        rect(-1, m(Y.red[0]), m(3.6), m(0.12), OB.red) +
        // the cab: black mask over the windshield and the cab's side window, red-edged, black roof cap
        path(poly(P([[-0.5, 1.88], [0.3, 1.88], ["q", 2.0, 1.95, 3.25, 2.2], [3.3, 3.05], ["q", 3.1, 3.42, 2.6, 3.42], [2.2, 3.7], [-0.5, 3.7]])), OB.red) +
        path(poly(P([[-0.5, 1.98], [0.35, 1.98], ["q", 2.0, 2.05, 3.15, 2.3], [3.18, 3.0], ["q", 3.0, 3.34, 2.55, 3.34], [2.1, 3.7], [-0.5, 3.7]])), OB.black) +
        band(4.25, 10.6, Y.win) + band(12.2, 18.3, Y.low),
      over: (g) => wins([[4.35, 5.85], [5.95, 7.45], [7.55, 9.0], [9.1, 10.5]], Y.win) + wins([[12.3, 15.2], [15.3, 18.2]], Y.low) + door(10.85, 11.95) +
        line(m(0.5), m(3.05), m(3.0), m(3.05), "#3b4047", 0.6) + obbWord(c, 3.8, 2.6, 0.4) + obbWord(c, 0.9, 1.62, 0.24) + T(c, m(5.9), m(1.18), m(0.17), "▼▼▼ REGIOZUG", "#ffffff", { weight: 700 }) +
        T(c, m(3.0), m(1.05), m(0.11), "4024", "#f7c9c2", { weight: 500 }) + cityjet(c, 14.3, 2.92) +
        lamp(m(0.13), m(1.66), m(0.12), m(0.13)) + autoCoupler(m(0.4), m(0.9)),
      under: (g) => truck(m(3.4), { wb: m(2.5), d: 33.9, top: m(Y.skirt) }) + jak(L) + cases(m(5.6), m(10.6), m(0.6), 2, m(0.32)),
      top: (g) => path(poly(P([[2.1, 3.55], [2.4, 3.85], [4.6, 3.85], [4.8, 3.55]])), "#2a2c30", 0.4) + slats(m(3.0), m(Y.roof), m(1.6), m(0.26), 0.32, "rgba(255,255,255,0.25)") +
        rect(m(5.2), m(Y.roof) - 0.05, m(4.4), m(0.42), "#3a3d41", 0.4, 'rx="0.15"') + (pan ? panGear(m(14.6), m(Y.roof), { up: !c.mirrored, dir: -1 }) : ""),
    });
  }
  function midCar(c) {
    const L = c.L;
    return body(c, {
      sill: m(Y.skirt), roof: m(Y.roof), x0: 0.15, x1: L - 0.15, base: OB.white, endR: 0.3, ends: [m(0.6), m(3.3)],
      paint: (g) => paintBand(L) + band(0.4, 6.0, Y.low) + band(7.6, 14.45, Y.low),
      over: (g) => wins([[0.5, 3.2], [3.3, 5.9], [7.7, 10.0], [10.1, 12.3], [12.4, 14.35]], Y.low) + door(6.25, 7.35) + tirol(c, 1.4, 3.0) +
        obbWord(c, 10.4, 3.0, 0.3) + tirol(c, 11.3, 3.0),
      under: (g) => jak(0) + jak(L) + cases(m(1.8), m(5.6), m(0.6), 1, m(0.3)),
      top: (g) => rect(m(8.0), m(Y.roof) - 0.05, m(4.6), m(0.4), "#3a3d41", 0.4, 'rx="0.15"'),
    });
  }
  addCab("dw4024End", "ÖBB 4024 (Talent) end car", (c) => endCar(c, { pan: true }), m(18.6), { pan: true });
  addCab("dw4024Mid", "ÖBB 4024 (Talent) middle car", midCar, m(14.84));
  SETS.obb4024 = set("ÖBB 4024 (Talent, cityjet): four cars", ["dw4024End", 1], ["dw4024Mid", 1], ["dw4024MidR", 1], ["dw4024EndR", 1]);
  const F = { model: "Bombardier Talent (ÖBB 4024)", type: "Electric multiple unit", builder: "Bombardier Transportation", built: "2004–2008", fleet: "140 units (4024 001–140)",
    topSpeedMph: 87, powerHp: 1931, seats: 199, source: `${DEWP}ÖBB_4024` };
  FACTS.dw4024End = { ...F, lengthFt: m(18.6), about: "An end car of ÖBB's four-car Talent, in cityjet paint. Tirol's units run the Außerfernbahn's S 7 between Pfronten-Steinach, Reutte and Lähn." };
  FACTS.dw4024Mid = { ...F, lengthFt: m(14.84), about: "A middle car of the 4024, low-floor, on shared (Jakobs) trucks." };
  FLEETS.push([948140240000, 948140249999, "dw4024End"]);
  return { TYPES, MODELS, SETS, FACTS, FLEETS };
});

// ===================== Tables =====================
const PARTS = [PART_LOCO, PART_DMU, PART_BOMB, PART_STSI, PART_OBB];
export const TYPES = Object.assign({}, ...PARTS.map((p) => p.TYPES));
export const MODELS = Object.assign({}, ...PARTS.map((p) => p.MODELS));
export const SETS = Object.assign({}, ...PARTS.map((p) => p.SETS || {}));
export const FACTS = Object.assign({}, ...PARTS.map((p) => p.FACTS || {}));
export const FLEETS = { dbregio2: PARTS.flatMap((p) => p.FLEETS || []) };
export { PART_ERRORS };

// ===================== Typical trains =====================
// What usually runs on each line, from the Länder's line lists on
// de.wikipedia (Bayern, Baden-Württemberg, Rheinland-Pfalz, Saarland,
// Nordrhein-Westfalen, the RMV and NVV lists, read October 2026: the
// timetable from 14 December 2025), oepnv-info.de's DB Regio NRW and
// Kurhessenbahn pages and photographs from 2025-2026. The timetable gives
// no train numbers DB uses for its sets, so a train is matched by its line
// and where it runs: many line numbers are used twice (RE 1 is the
// München-Nürnberg-Express and the Südwest-Express, RB 33 runs in Aachen
// and in Landshut), told apart by their stations.
// Lines in this railroad's timetable that DB doesn't run (other companies'
// trains the timetable files under DB Regio: HLB's Taunus lines RB 12, 15
// and 16, vlexx's RB 33, RB 73 and RE 17 from Bingen, CFL's RE 11, RB 83
// and RB 87 at Trier, SWEG's RB 42, BOB's RB 91, RheinRuhrBahn's RE 10 to
// Kleve, the S-Bahn's RB 11 at Stuttgart, the SNCF's and Arriva's RE 18)
// get no drawing rather than a wrong one.
const LINE_SETS = {
  ddNrw: "dd146x5", suewex: "flSuw", ddBw: "dd146x4", ddBy: "dd218x4", ddHe: "dd146x4", ddMw: "dd114x6", kinzig: "dd114x6", dd147: "dd147x5", dd245: "dd245x3",
  c1440x2: "dw1440x5", c1440x8: "dw1440x8", c1440x3: "dw1440x3", c1440bw: "dw1440Bwx3", c440by: "dw440x3", c440x5: "dw440x5", c440bw: "dw440Bwx4", c440nord: "dw440x5",
  t442x3: "dw442x4", t442x4: "dw442x4", t442w: "dw442Wx4", t442bw: "dw442Bsx5", t442bwGm: "dw442Bwx4", t442bw3: "dw442Bsx3", t442bw17: "dw442Bsx5",
  tdx445x2: "dw445Ms", tdx445x4: "dw445Rw6", tdx445rw4: "dw445Rw4", tdxMnr: "dw446x4",
  hcBw: "hcBw4", mireoBw: "miBw3", mireo1463: "miBy4", mireoRn: "miBw3", et425: "e425", et425rs: "e425",
  flirt3xl: "xl5", flirt3xl3: "xl3", flirt1428x2: "fl1428x2", flirt3428: "dw442x4",
};
const S = (id) => SETS[LINE_SETS[id] || id] || null;
// Trains of other companies that the timetable files under DB Regio are
// drawn as their own railroads' files draw them (loaded with this one,
// guarded: without a file those trains go undrawn), their cars added to
// this file's tables so the drawings are there when the train is shown.
const OTHER = {};
for (const f of ["deprivat2", "deprivat", "cfl", "sbahn", "nlregio"]) {
  try { OTHER[f] = await import(`./${f}.cars.js?v=dev`); } catch (e) { OTHER[f] = null; }
  const o = OTHER[f];
  if (!o) continue;
  for (const [k, v] of Object.entries(o.TYPES || {})) if (!TYPES[k] && o.MODELS?.[k]) { TYPES[k] = v; MODELS[k] = o.MODELS[k]; }
  for (const [k, v] of Object.entries(o.FACTS || {})) FACTS[k] ??= v;
}
function other(f, t, route = null, reported = null) {
  const fn = OTHER[f]?.TYPICAL?.[f];
  if (!fn) return null;
  try {
    const s = fn({ ...t, agency: f, ...(route ? { route } : {}) }, reported);
    return s && s.units.every(([k]) => TYPES[k] && MODELS[k]) ? s : null;
  } catch (e) { return null; }
}
const stationsOf = (t) => [t.origin, t.destination, ...(t.stops || []).map((x) => x.name)].filter(Boolean).join(" | ");
const routeOf = (t) => String(t.route || "").replace(/\s+/g, " ").trim();
// Which network a train of a shared line number runs in, by its stations.
const NET = [
  ["nrw", /Düsseldorf|Duisburg|Essen|Dortmund|Köln|Aachen|Münster \(Westf|Mönchengladbach|Bochum|Gelsenkirchen|Hagen|Siegen|Iserlohn|Lüdenscheid|Bonn|Remagen|Ahrbrück|Coesfeld|Gronau|Enschede|Dorsten|Haltern|Wesel|Wuppertal|Osnabrück|Neuenrade|Menden|Brilon|Winterberg|Warburg|Euskirchen|Gerolstein|Bedburg|Heinsberg|Stolberg|Kleve|Krefeld|Rheine|Löhne|Herford|Hameln/],
  ["hessen", /Frankfurt \(Main\)|Kassel|Gießen|Marburg|Fulda|Limburg|Wächtersbach|Hanau|Darmstadt|Dieburg|Glauburg|Bebra|Bad Hersfeld|Korbach|Bad Wildungen|Treysa|Königstein|Friedberg \(Hess\)|Brandoberndorf|Grävenwiesbach/],
  ["rp", /Koblenz|Trier|Mainz|Worms|Kaiserslautern|Ludwigshafen|Neustadt \(Weinstr|Landau \(Pfalz|Pirmasens|Saarbrücken|Homburg \(Saar|Merzig|Bingen|Bad Kreuznach|Kusel|Lauterecken|Frankenthal|Freinsheim|Grünstadt|Monsheim|Wörth \(Rhein|Winden \(Pfalz|Bad Bergzabern|Wissembourg|Lauterbourg|Germersheim|Mayen|Andernach|Wittlich|Perl|Dillingen \(Saar|Niedaltdorf|Zweibrücken|Dahn|Biblis|Alzey|Konz|Saarburg|Igel/],
  ["bw", /Stuttgart|Karlsruhe|Mannheim|Heidelberg|Heilbronn|Tübingen|Ulm Hbf|Friedrichshafen|Freiburg|Offenburg|Basel|Konstanz|Singen|Pforzheim|Aalen|Sigmaringen|Aulendorf|Lindau|Rottweil|Horb|Osterburken|Crailsheim|Gernsbach|Freudenstadt|Rastatt|Mühlacker|Bruchsal|Biberach|Memmingen|Weißenhorn|Radolfzell|Villingen|Schwäbisch Hall|Öhringen|Wertheim|Bad Mergentheim/],
  ["by", /München|Nürnberg|Würzburg|Bamberg|Regensburg|Augsburg|Kempten|Ingolstadt|Landshut|Plattling|Hof Hbf|Bayreuth|Weiden|Schwandorf|Treuchtlingen|Garmisch|Mittenwald|Starnberg|Weilheim|Kochel|Pfronten|Oberstdorf|Buchloe|Coburg|Lichtenfels|Saalfeld|Sonneberg|Erfurt|Aschaffenburg|Miltenberg|Gemünden|Schweinfurt|Fürth \(Bay|Cadolzburg|Gräfenberg|Neuhaus \(Pegnitz|Simmelsdorf|Hilpoltstein|Pleinfeld|Wassertrüdingen|Steinach|Rothenburg|Windsbach|Günzburg|Mindelheim|Bad Wörishofen|Marktbreit|Flughafen|Cheb|Marktredwitz|Kronach|Markt Erlbach|Ehrwald|Lermoos/],
];
const netOf = (t) => {
  const s = stationsOf(t);
  // The endpoints decide first (a line touching two Länder is the one it
  // starts or ends in most), then any station on the way.
  const ends = [t.origin, t.destination].filter(Boolean).join(" | ");
  for (const [k, re] of NET) if (re.test(ends)) return k;
  for (const [k, re] of NET) if (re.test(s)) return k;
  return null;
};
const at = (t, re) => re.test(stationsOf(t));

function typical(t) {
  const r = routeOf(t), net = netOf(t);
  const pick = (byNet, fallback = null) => S(byNet[net] ?? fallback);
  switch (r) {
    // ---------- Nordrhein-Westfalen and its neighbours ----------
    case "RE 2":
      if (at(t, /Osnabrück|Münster \(Westf|Gelsenkirchen|Düsseldorf/)) return S("ddNrw");
      if (at(t, /Koblenz|Mainz|Frankfurt/)) return S("suewex");
      if (at(t, /Konstanz|Offenburg|Villingen|Karlsruhe|Singen/)) return S("ddBw");
      return S("ddBy");
    case "RE 8": return S("c1440x2");
    case "RE 9": return S("dd147");
    case "RE 10": return at(t, /Kleve|Krefeld|Düsseldorf/) ? other("deprivat", t) : S("c440x5");
    case "RE 12": return S("dmu620");
    case "RE 17":
      if (at(t, /Hagen|Brilon|Warburg|Meschede|Bestwig/)) return S("dmu633_632");
      if (at(t, /Oberstdorf|Augsburg|Immenstadt/)) return S("dmu612");
      return other("deprivat2", t); // vlexx (Bingen-Kaiserslautern)
    case "RB 20": return S("dmu643eu");
    case "RE 22":
      if (at(t, /Köln|Trier|Gerolstein|Euskirchen|Kall/)) return S("dmu620_622");
      return S("mireo1463");
    case "RB 22": return S("ddHe");
    case "RB 24": return S("dmu620_622");
    case "RB 25": return at(t, /Bamberg|Kronach|Lichtenfels/) ? S("hcBy4") : S("dmu620_622");
    case "RB 27": return at(t, /Freiburg|Basel|Offenburg|Neuenburg|Müllheim|Lahr|Emmendingen/) ? S("mireoBw") : S("et425");
    case "RB 30": return at(t, /Ahrbrück|Remagen|Bonn|Köln/) ? S("t442x3") : S("dmu648");
    case "RB 31": return at(t, /Simmelsdorf|Neunkirchen a Sand|Lauf/) ? S("dmu648") : S("dmu622");
    case "RB 32": case "RB 40": case "RE 49": case "RE 34": return S("flirt3xl");
    case "RE 41": return at(t, /Bochum|Haltern/) ? S("flirt3xl3") : S("dmu612");
    case "RB 33":
      if (at(t, /Landshut|Freising|Regensburg|München/)) return S("hcBy4");
      if (at(t, /Bad Kreuznach|Gau Algesheim/)) return other("deprivat2", t); // vlexx
      return S("c1440x8");
    case "RB 38":
      if (at(t, /Kassel|Treysa|Wabern/)) return S("dmu642khb");
      if (at(t, /Mayen|Andernach|Kaisersesch/)) return S("dmu648");
      return S("dmu620");
    case "RE 42": return S("flirt1428x2");
    case "RB 43": return S("dmu644");
    case "RB 51":
      if (at(t, /Frankfurt|Wächtersbach|Fulda|Hanau|Offenbach/)) return S("kinzig");
      if (at(t, /Karlsruhe|Neustadt|Landau/)) return S("dmu643");
      return S("dmu643x2");
    case "RB 52":
      if (at(t, /Lauterbourg|Wörth|Karlsruhe/)) return S("dmu628");
      return S("dmu632");
    case "RB 53":
      if (at(t, /Iserlohn|Schwerte|Dortmund/)) return S("dmu632");
      if (at(t, /Würzburg|Bamberg|Flieden|Gemünden|Jossa|Schweinfurt/)) return S("c440by");
      if (at(t, /Landau|Wissembourg|Bad Bergzabern|Winden/)) return S("dmu643");
      return S("dmu650bw");
    case "RB 54": return at(t, /Winden|Bad Bergzabern|Landau|Karlsruhe/) ? S("dmu643") : S("dmu632");
    case "RE 57": return S("dmu633_632");
    case "RB 63":
      if (at(t, /Münster|Coesfeld/)) return S("dmu648");
      if (at(t, /Bensheim|Worms/)) return S("dmu622");
      return S("c440bw");
    case "RB 64": return at(t, /Münster|Gronau|Enschede|Steinfurt/) ? S("dmu643x2") : S("dmu642");
    case "RE 62": return at(t, /Rheine|Löhne|Osnabrück/) ? S("c440nord") : S("t442w");
    case "RB 77": return at(t, /Hameln|Herford/) ? S("dmu648") : S("dmu642");
    // ---------- Hessen ----------
    case "RE 30": return at(t, /Kassel|Frankfurt|Gießen|Marburg|Treysa/) ? S("ddMw") : S("dmu612");
    case "RE 20": return at(t, /Limburg|Frankfurt/) ? S("ddHe") : S("hcBy4");
    case "RE 50": return at(t, /Aalen|Ulm/) ? S("dmu612bw") : S("kinzig");
    case "RE 5": return at(t, /Frankfurt|Fulda|Bebra/) ? S("kinzig") : S("ddBw");
    case "RE 54": return S("tdx445x2");
    case "RE 55": return at(t, /Frankfurt|Aschaffenburg|Würzburg|Bamberg|Gemünden/) ? S("tdx445x2") : S("dmu612bw");
    case "RE 60": return at(t, /Treuchtlingen|Nürnberg/) ? S("tdx445rw4") : S("tdxMnr");
    case "RB 67": return at(t, /Kusel|Kaiserslautern|Landstuhl|Altenglan/) ? S("dmu643") : S("tdxMnr");
    case "RB 68": return at(t, /Saarbrücken|Pirmasens|Zweibrücken/) ? S("dmu642") : S("tdxMnr");
    case "RE 70": return at(t, /Frankfurt|Mannheim|Mörfelden|Walldorf \(Hess/) ? S("tdxMnr") : S("dmu612");
    case "RB 34": return S("dd245");
    case "RB 61": return at(t, /Roth|Hilpoltstein/) ? S("dmu642") : S("dmu633_632");
    case "RB 56": return at(t, /Hanau|Schöllkrippen|Kahl|Aschaffenburg/) ? S("dmu642wfb") : S("dmu642");
    case "RB 4": case "RB 39": case "RE 39": case "RB 97": case "RE 97": return S("dmu642khb");
    case "RB 94": return at(t, /Marburg|Siegen|Erndtebrück|Bad Laasphe|Cölbe/) ? S("dmu642khb") : S("dmu633");
    case "RB 12": return at(t, /Königstein/) ? other("deprivat2", t, "RE 24") : S("dmu648"); // HLB's Königsteiner Bahn
    // HLB's Taunusbahn, Königsteiner Bahn and Friedberg-Friedrichsdorf: its LINT 41s (as
    // deprivat2.cars.js draws its RE 24).
    case "RB 15": return other("deprivat2", t, "RE 24");
    case "RB 16": return at(t, /Friedrichsdorf|Friedberg/) ? other("deprivat2", t, "RE 24") : S("tdx445x4"); // HLB's Friedberg-Friedrichsdorf
    case "RB 23": return at(t, /Kaisersesch|Mayen/) && !at(t, /Koblenz|Limburg/) ? S("dmu648") : S("dmu643");
    case "RE 25": return S("dmu643");
    case "RB 69": return S("dmu648");
    // ---------- Rheinland-Pfalz and Saarland ----------
    case "RE 1": return at(t, /München|Nürnberg|Ingolstadt|Dachau/) ? S("mnx102") : S("suewex");
    case "RE 4": return at(t, /Stuttgart|Singen|Konstanz|Rottweil|Tuttlingen/) ? S("t442bwGm") : S("suewex");
    case "RE 14": return at(t, /Nürnberg|Saalfeld|Bamberg|Ludwigsstadt|Probstzella|Camburg/) ? S("hcBy4") : S("suewex");
    case "RE 11": return other("cfl", t); // CFL's Luxembourg-Trier-Koblenz
    case "RE 6":
      if (at(t, /Stuttgart|Tübingen/)) return S("t442bw");
      return S("akku");
    case "RE 15": case "RE 15A": return S("dmu622_648");
    case "RE 21": return S("dmu642");
    case "RB 35": return S("dmu622");
    case "RB 45": case "RB 46": return S("dmu622");
    case "RB 55": return S("dmu643");
    case "RB 65": return at(t, /Starnberg|Weilheim/) ? S("t442w") : S("dmu642");
    case "RB 66": return at(t, /Kochel|Starnberg|Tutzing|Penzberg/) ? S("t442w") : S("dmu643");
    case "RB 62": return at(t, /Worms|Biblis/) ? S("dmu622") : S("dmu648");
    case "RB 70": return S("c1440x3");
    case "RB 71": return at(t, /Bruchsal|Mühlacker|Bretten/) ? S("t442bw") : S("c1440x3");
    case "RB 81": return at(t, /Koblenz|Trier|Cochem|Wittlich|Bullay/) ? S("t442x4") : S("dmu642");
    case "RB 82": return at(t, /Trier|Perl|Konz|Oberbillig/) ? S("flirt3428") : S("dmu642");
    case "RB 83": return at(t, /Igel|Wittlich/) ? other("cfl", t) : S("dmu642wfb"); // CFL's KISS at Trier
    case "RB 84": return at(t, /Trier|Konz|Saarburg|Serrig/) ? S("flirt3428") : S("dmu642wfb");
    case "RB 87": return at(t, /Igel|Karthaus/) ? other("cfl", t) : S("dmu642wfb");
    case "RB 88": case "RE 80": return S("dmu642wfb");
    case "RE 16": return at(t, /Trier|Konz/) ? S("flirt3428") : S("tdx445x4");
    // Arriva's Drielandentrein (Aachen-Heerlen-Maastricht-Liège); the
    // SNCF's Forbach-Saarbrücken train is drawn on the French side (ter.cars.js).
    case "RE 18": return at(t, /Aachen|Eygelshoven|Heerlen/) ? other("nlregio", t, null, "limF3Cab") : null;
    case "RB 73": return at(t, /Kempten|Pfronten|Oy/) ? S("dmu633") : other("deprivat2", t); // vlexx at Saarbrücken
    case "RB 72": return S("t442bw");
    // ---------- Baden-Württemberg ----------
    case "MEX 12": case "MEX 18": return S("t442bw");
    case "MEX 19": case "MEX 90": case "RE 14a": case "RE 14b": case "RB 14a": return S("t442bwGm");
    case "RE 10a": case "RE 10b": case "RB 10a": case "RB 18": return S("t442bw3");
    case "MEX 17": return S("t442bw17");
    case "RE 71": return at(t, /Heidelberg|Mühlacker|Bruchsal|Bretten/) ? S("t442bw") : S("dmu612");
    case "RE 3":
      if (at(t, /München|Plattling|Landshut/)) return S("hcBy4");
      if (at(t, /Singen|Überlingen|Uhldingen|Friedrichshafen Hafen/) && !at(t, /Ulm/)) return S("dmu612bw");
      return S("et425");
    case "RE 6a": case "RE 6b": return S("dmu612bw");
    case "RE 7":
      if (at(t, /Offenburg|Freiburg|Basel|Lahr|Karlsruhe|Baden-Baden|Rastatt|Achern|Bad Krozingen|Emmendingen/)) return S("hcBw");
      if (at(t, /Erfurt|Mellrichstadt|Schweinfurt|Würzburg/)) return S("dmu612s");
      if (at(t, /Heidelberg|Eppingen|Sinsheim|Neckargemünd|Bad Rappenau/)) return other("sbahn", t, "S 5") || S("mireoRn");
      return S("dmu612");
    case "RE 45": return at(t, /Kaiserslautern/) ? S("et425") : S("c1440bw");
    case "RE 40": return at(t, /Gernsbach|Freudenstadt|Schönmünzach|Herrenberg|Karlsruhe|Mannheim/) ? S("c1440bw") : S("dmu612");
    case "RB 41": case "RB 44": return S("c1440bw");
    case "RE 73": return at(t, /Karlsruhe|Mannheim|Heidelberg/) ? S("mireoRn") : S("dmu612");
    case "RE 200": return S("re200");
    case "RB 26": return S("mireoBw");
    case "RB 74": return at(t, /Buchloe|München/) ? S("c440x5") : S("dmu650bw");
    case "RB 42": return other("deprivat2", t); // SWEG's Ringzug
    case "RB 91": return at(t, /Windsbach|Wicklesgreuth/) ? S("dmu642") : other("deprivat2", t); // BOB at Friedrichshafen
    case "RB 93": return S("et425");
    case "RS 2": case "RS 21": return S("et425rs");
    case "RS 7": case "RS 71": return S("dmu622rs");
    case "RB 11": return at(t, /Cadolzburg|Fürth/) ? S("dmu622") : other("sbahn", t); // S-Bahn Stuttgart's 426s
    // ---------- Bayern ----------
    case "RB 16": return S("tdx445x4");
    case "RE 19": case "RE 29": return S("hcBy6");
    case "RE 28": return S("hcBy4");
    case "RE 31": case "RE 32": case "RE 33": case "RE 35": case "RE 38": case "RE 43": case "RE 47":
      return S("dmu612");
    case "RB 6": case "RB 60": case "RE 61": case "S 6": return S("t442w");
    // The Außerfernbahn's S 7 (Tirol): ÖBB's 4024s between Pfronten-Steinach, Reutte and
    // Lähn; DB Regio's Talent 2s on the trains through to Garmisch (RB 60).
    case "S 7": return at(t, /Garmisch|Ehrwald|Griesen|Murnau|München/) ? S("t442w") : S("obb4024");
    case "S 61": return S("dmu650bw");
    case "RB 79": case "RB 80": case "RB 85": return S("c440by");
    case "RE 75": case "RE 79": return S("dmu633");
    case "RE 76": return S("dmu612");
    case "RB 78": return S("dmu650");
    case "RB 21": return S("dmu648");
    case "RE": return S("et425");
  }
  return null;
}
export const TYPICAL = {
  dbregio2: (t, reported) => {
    const s = typical(t);
    if (s) return s;
    // A car shown alone (a fleet page's sample): the set it runs in.
    if (!t.route && reported) return Object.values(SETS).find((x) => x.units.some(([k]) => k.replace(/R$/, "") === reported.replace(/R$/, ""))) || null;
    return null;
  },
};
