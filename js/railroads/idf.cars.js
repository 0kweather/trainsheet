// Île-de-France's RER and Transilien trains (scripts/railroads/sncf.py,
// agency "transilien"): the RER lines A to E, run by RATP and SNCF, and
// SNCF's Transilien lines H, J, K, L, N, P, R, U and V. Trainsheet's own
// side views, at the shared scale (js/carart.js), from the builders' and
// SNCF's published dimensions (French Wikipedia's articles on each series,
// read October 2026) and from photographs (Wikimedia Commons, 2024-2026)
// measured against the cars' known lengths; lettered here, no logo files.
//
// Paint as the trains carry it in late 2026: Île-de-France Mobilités'
// livery (2017 on: metallic grey, a pale blue line along the windows, the
// doors white with their inner halves blue, "îledeFrance mobilités" in big
// blue letters and the authority's blue square with its figure) on
// everything new or rebuilt since; the older paint only where most of a
// series still wears it. No first class: Île-de-France's suburban trains
// have carried none since 2000.

import { C, rect, circle, path, line, lines, poly, truck, pantograph, slats } from "../carart.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const FT = 3.28084;
const m = (v) => v * FT; // metres to feet
const seq = (from, pitch, k) => Array.from({ length: Math.max(0, k) }, (_, i) => from + i * pitch);
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
// Île-de-France Mobilités' wordmark is set in a round geometric sans.
const ROUND = "'Avenir Next', Avenir, 'Century Gothic', 'Helvetica Neue', Arial, sans-serif";
const STROKE = 'vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"';
let ids = 0;
const newId = () => `ts-clip-idf${++ids}`;

// ===================== Paint =====================
// Île-de-France Mobilités (IDFM): sampled off sunlit photographs of
// Z 50000 289 and 305 (Gretz-Armainvilliers, 2025) and Z 20808 (La
// Norville, 2026).
export const IDFM = {
  blue: "#70a5da", blueDeep: "#4f86bd", grey: "#d3d8dc", greyMid: "#8f989f", band: "#2b313b", white: "#eef1f3",
  skirt: "#3c4148", face: "#1d2229", roof: "#c4c9cd", ink: "#262b31",
};

// Text h ft tall centered at (x, y), reading left to right on a mirrored
// car too.
export function T(c, x, y, h, text, fill, { weight = 700, spacing = 0, italic = false, family = SANS, anchor = "middle", stretch = 1 } = {}) {
  return `<text transform="translate(${n(x)} ${n(y)}) scale(${n((c.mirrored ? -1 : 1) * stretch)} -1)" y="${n(h * 0.36)}" font-size="${n(h)}" text-anchor="${anchor}" ` +
    `font-weight="${weight}"${italic ? ' font-style="italic"' : ""} letter-spacing="${spacing}" font-family="${family}" fill="${fill}">${text}</text>`;
}
// A mark drawn y-down in a box centered at (x, y), h ft tall, unmirrored.
const markAt = (c, x, y, h, inner) => `<g transform="translate(${n(x)} ${n(y)}) scale(${n((c.mirrored ? -1 : 1) * h)} ${n(-h)})">${inner}</g>`;

// IDFM's square: rounded, its figure (a head, an arm flung up to the
// right, the body sweeping down to a stride) in the other colour; drawn in
// a unit square.
const FIGURE = "M-0.06 -0.27A0.075 0.075 0 1 1 -0.059 -0.27Z" +
  "M-0.29 -0.05C-0.12 -0.06 0.05 -0.1 0.27 -0.23C0.08 -0.04 -0.04 0.0 -0.16 0.02Z" +
  "M-0.09 -0.07C-0.03 0.06 -0.02 0.16 -0.2 0.33L-0.12 0.33C0.04 0.18 0.06 0.08 0.03 -0.04Z" +
  "M0.0 0.06C0.1 0.12 0.18 0.2 0.25 0.33L0.17 0.33C0.11 0.24 0.06 0.18 -0.02 0.13Z";
export const idfmSquare = (c, x, y, h, { bg = IDFM.blue, fg = "#ffffff" } = {}) =>
  markAt(c, x, y, h, `<rect x="-0.5" y="-0.5" width="1" height="1" rx="0.16" fill="${bg}"/><path d="${FIGURE}" fill="${fg}"/>`);
// "îledeFrance" with "mobilités" under its end: "île" and "France" bold,
// "de" light, about 7.1 times as wide as its capitals are tall (measured
// on the doors' marks). x: the left end, y: the baseline, h: the
// capitals' height. square: the small square after it, as on the doors and
// fronts.
export function idfmWord(c, x, y, h, { fill = IDFM.blue, sub = IDFM.ink, square = false, mob = true, mobH = 0.42, mobY = 0.62, wide = 7.1, inline = false, lead = false } = {}) {
  const sz = h / 0.71, w = h * wide;
  const x0 = c.mirrored ? x + w : x;
  let s = `<text transform="translate(${n(x0)} ${n(y)}) scale(${c.mirrored ? -1 : 1} -1)" font-size="${n(sz)}" font-family="${ROUND}" fill="${fill}" letter-spacing="-0.02em"` +
    ` textLength="${n(w)}" lengthAdjust="spacingAndGlyphs"><tspan font-weight="700">île</tspan><tspan font-weight="400">de</tspan><tspan font-weight="700">France</tspan></text>`;
  if (mob && inline) s += T(c, x + w + h * 0.35, y + h * mobH * 0.36, h * mobH, "mobilités", sub, { weight: 500, family: ROUND, anchor: c.mirrored ? "end" : "start" });
  else if (mob) s += T(c, c.mirrored ? x : x + w, y - h * mobY, h * mobH, "mobilités", sub, { weight: 500, family: ROUND, anchor: c.mirrored ? "start" : "end" });
  if (lead) s += idfmSquare(c, x - h * 1.0, y + h * 0.48, h * 1.25);
  if (square) s += idfmSquare(c, x + w + h * 0.95, y + h * 0.2, h * 1.45);
  return s;
}
// SNCF's mark (2005): white letters on a carmine-to-purple tile, its top
// edge sweeping up to the right.
export function sncfMark(c, x, y, h) {
  const id = newId(), w = h * 1.45, x0 = x - w / 2, y0 = y - h / 2;
  const d = `M${n(x0)} ${n(y0 + h * 0.12)}Q${n(x0)} ${n(y0)} ${n(x0 + h * 0.12)} ${n(y0)}L${n(x0 + w - h * 0.12)} ${n(y0)}Q${n(x0 + w)} ${n(y0)} ${n(x0 + w)} ${n(y0 + h * 0.12)}` +
    `L${n(x0 + w + h * 0.06)} ${n(y0 + h * 0.86)}Q${n(x0 + w * 0.55)} ${n(y0 + h * 1.12)} ${n(x0)} ${n(y0 + h * 0.84)}Z`;
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d0102e"/><stop offset="1" stop-color="#8a1f63"/></linearGradient></defs>` +
    `<path d="${d}" fill="url(#${id})"/>` + T(c, x + h * 0.02, y - h * 0.04, h * 0.5, "SNCF", "#ffffff", { weight: 800, spacing: "-0.04em", stretch: 0.92 });
}

// ===================== Body =====================
// A car body seen from the side, its cab (if any) on the left: the
// outline from the nose's points (bottom to roof) or a plain end, the
// paint clipped to it and shaded like every other drawing (carmodels.js),
// then what stands proud of it. o: sill, roof, nose, x0, x1, endR,
// bottom, base (the body's own colour), paint(g), over(g), under(g),
// top(g), ends: [floor, top] of the gangway bellows at a coupled end.
function body(c, o) {
  const L = c.L, x0 = o.x0 ?? 0.35, x1 = o.x1 ?? L - 0.35, r = o.endR ?? 0.9, { sill, roof } = o;
  const pts = [];
  if (o.nose) pts.push(...o.nose.map((p) => [...p]));
  else pts.push([x0, sill], [x0, roof - r], ["q", x0, roof, x0 + r, roof]);
  const rearPts = o.rear ? o.rear.map((p) => [...p]) : [[x1 - r, roof], ["q", x1, roof, x1, roof - r], [x1, sill]];
  const d = poly([...pts, ...rearPts, ...(o.bottom ? [...o.bottom].reverse() : [])]);
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
  s += `<path d="${d}" fill="${o.base || IDFM.grey}"/><clipPath id="${id}"><path d="${d}"/></clipPath><defs>${shade}</defs>` +
    `<g clip-path="url(#${id})">${o.paint(g)}<rect x="-5" y="${n(lo)}" width="${n(L + 10)}" height="${n(hi - lo)}" fill="url(#${id}-s)"/></g>`;
  s += o.over ? o.over(g) : "";
  s += `<path d="${d}" fill="none" stroke="currentColor" stroke-width="0.8" ${STROKE}/>`;
  return s + (o.top ? o.top(g) : "");
}

// A window: dark glass in a thin dark frame, the sky's reflection high in
// it; r: corner radius.
function pane(x, y, w, h, r = 0.35, frame = "#22262c") {
  return rect(x, y, w, h, C.glass, 0, `rx="${n(r)}" stroke="${frame}" stroke-width="0.7" ${STROKE}`) +
    rect(x + 0.15, y + h * 0.6, w - 0.3, h * 0.3, C.glassLight, 0, `rx="${n(Math.min(r, 0.2))}"`);
}

// ===================== Running gear =====================
// A Jakobs truck under the joint of two cars (each car draws its half).
const jakobs = (x, top, wb = 9.19, d = 33) => truck(x, { wb, d, top });
// The automatic coupler (Scharfenberg) run out from the nose to the
// coupler face (x = 0), its drawbar, the electric head, the anticlimber.
function autoCoupler(x1, y = 2.95) {
  return rect(0.35, y - 0.28, x1 - 0.2, 0.56, "#2a2d31") + rect(0, y - 0.62, 0.48, 1.24, "#3b3f45", 0.4, 'rx="0.14"') +
    rect(0.1, y - 0.14, 0.26, 0.28, "#1b1d20") + rect(0.55, y + 0.4, 0.8, 0.42, "#5a6068", 0.3, 'rx="0.08"');
}
const coupledCouplers = (y = 2.95) => rect(-0.2, y - 0.28, 1.6, 0.56, "#2a2d31") + rect(-0.25, y - 0.55, 0.5, 1.1, "#3b3f45");
// Underfloor equipment: cases between a and b hung from the floor (top).
function cases(a, b, top, k = 2, depth = 1.0, fill = "#2c2f35") {
  if (b - a < 1) return "";
  const w = (b - a) / k;
  let s = "";
  for (let i = 0; i < k; i++) s += rect(a + i * w + 0.25, top - depth, w - 0.5, depth, fill, 0, 'rx="0.1"') + line(a + i * w + 0.5, top - depth + 0.25, a + (i + 1) * w - 0.5, top - depth + 0.25, "rgba(255,255,255,0.12)", 0.5);
  return s;
}
// A pantograph on its base with the roof line; dir -1: the knee toward
// the left.
function panGear(x, roof, { up = true, dir = -1 } = {}) {
  return rect(x - 3.0, roof - 0.05, 6.0, 0.35, "#5d636c", 0.4, 'rx="0.12"') + pantograph(x, roof + 0.3, { up, facing: dir });
}
// A roof fairing with louvres: a low box x..x+w, its slots.
function louvres(x, w, roof, h = 0.75, fill = "#c9ced3") {
  let s = path(poly([[x, roof - 0.1], [x + 0.35, roof + h], [x + w - 0.35, roof + h], [x + w, roof - 0.1]]), fill, 0.4);
  const k = Math.max(1, Math.floor((w - 1.2) / 1.6));
  for (let i = 0; i < k; i++) { const sx = x + 0.6 + i * ((w - 1.2) / k); s += rect(sx, roof + h * 0.32, (w - 1.2) / k - 0.45, h * 0.32, "#3a3f46", 0, 'rx="0.12"'); }
  return s;
}

// ===================== Orientation =====================
// Every unit's end cars face outward. Each end car is two types: its key
// (drawn with its cab on the left, leading its unit) and key + "R" (the
// same car turned round, closing its unit).
function facingRight(c, draw) {
  const mm = { ...c, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: c.coupledL };
  return `<g transform="matrix(-1 0 0 1 ${n(c.L)} 0)">${draw(mm)}</g>`;
}

// ===================== Z 50000 "Francilien" =====================
// Bombardier's articulated single-deck units (2009-2022, 360): eight cars
// (112.50 m, lines H, K, P and E) or seven (94.31 m, J and L, for Saint-
// Lazare's shorter platforms): end cars 16.53 m from the coupler face to
// the joint, middle cars 13.24 m between joints, the seven-car units' short
// middle car 8.29 m; a truck under each joint (2.8 m wheelbase), a motor
// truck under each cab (2.3 m), 840 mm wheels; 3.06 m wide, 4.28 m tall,
// the floor 970 mm up. One double door (1.95 m) a side in every car, at
// the end of each car toward the middle of the unit; the end car's crew
// door behind the long sloping nose. Positions measured off a near side-on
// photograph of an end car (Saint-Denis, 2026) and against the joints of
// unit 304 (Gretz-Armainvilliers, 2025). IDFM's paint (every unit by
// 2026 bar a few still in SNCF's Carmillon): metallic grey; a black band
// at the windows edged above with pale blue, rounded at its front end; a
// mid grey panel under it with "îledeFrance" across it; the doors white,
// their inner halves and a stripe up over the roof blue; the nose blue
// from the roof round the cab's side, the face black.
const ZF = { sill: m(0.62), floor: m(0.97), panel: m(1.66), bandHi: m(3.27), blueHi: m(3.36), winLo: m(1.78), winHi: m(3.13), eave: m(3.86), roof: m(4.12), doorHi: m(3.05) };
const ZF_DOOR = m(2.6); // the white door surround (the leaves 1.95 m)
// The nose, from the skirt's foot up the black face and the windshield's
// long rake back to the roof (the side photographs: the roof's crown
// reached about 3.6 m back, the cape's edge 6.2 m back at the roof).
const NOSE_ZF = [[m(0.75), m(0.4)], ["q", m(0.32), m(0.5), m(0.3), m(0.95)], [m(0.28), m(1.85)], ["q", m(0.32), m(2.3), m(0.8), m(2.75)],
  ["q", m(1.9), m(3.65), m(3.6), m(4.06)], ["q", m(4.3), ZF.roof, m(5.2), ZF.roof]];
// A Z 50000 door: the white surround from the floor to the eave, the
// leaves (each a tall window, its inner half blue), the blue stripe from
// the door up over the roof, the small IDFM mark at its top.
function zfDoor(c, x) {
  const w = ZF_DOOR, cx = x + w / 2, lw = m(0.975), l0 = cx - lw, top = ZF.doorHi;
  let s = rect(x, ZF.floor - 0.1, w, ZF.eave + 1 - ZF.floor, IDFM.white, 0, 'rx="0.5"');
  s += rect(cx - m(0.43), ZF.floor - 0.1, m(0.86), 20, IDFM.blue);
  s += rect(l0 - 0.1, ZF.floor, lw * 2 + 0.2, top - ZF.floor, "none", 0, `stroke="#555c64" stroke-width="0.6" ${STROKE}`);
  for (const k of [0, 1]) {
    const gx = k ? cx + m(0.2) : l0 + m(0.12);
    s += pane(gx, m(1.38), m(0.68), m(1.45), 0.2, "#1b1e22");
  }
  s += line(cx, ZF.floor + 0.1, cx, top - 0.05, "#2c3036", 0.8);
  s += rect(cx - 0.75, m(1.22), 1.5, 0.75, "#2a2e33", 0, 'rx="0.3"') + circle(cx - 0.3, m(1.33), 0.18, "#c8ccd0");
  // The step under the door.
  s += rect(x + 0.4, ZF.sill - 0.15, w - 0.8, 0.45, "#2b2f35");
  s += idfmWord(c, x + 0.45, top + 0.55, 0.32, { square: true });
  return s;
}
// A row of windows in the black band: [a, b] pairs, each a pane.
const zfWindows = (wins) => wins.map(([a, b]) => pane(a, ZF.winLo, b - a, ZF.winHi - ZF.winLo, 0.25, "#15181c")).join("");
// The band: black from a to b at the windows, the pale blue line over it;
// round: the end (left, right) rounded at the front of an end car.
function zfBand(a, b, { roundL = false } = {}) {
  const r = 1.6;
  if (!roundL) return rect(a, ZF.panel, b - a, ZF.bandHi - ZF.panel, IDFM.band) + rect(a, ZF.bandHi, b - a, ZF.blueHi - ZF.bandHi, IDFM.blue);
  return path(poly([[a, ZF.panel], [a, ZF.blueHi - r], ["q", a, ZF.blueHi, a + r, ZF.blueHi], [b, ZF.blueHi], [b, ZF.panel]]), IDFM.blue) +
    path(poly([[a + 0.3, ZF.panel], [a + 0.3, ZF.bandHi - r + 0.3], ["q", a + 0.3, ZF.bandHi, a + r, ZF.bandHi], [b, ZF.bandHi], [b, ZF.panel]]), IDFM.band);
}
// Window layouts (feet from the car's left end as drawn).
// End car (cab left): the crew door, the square, the band of windows to
// the door at its rear.
const ZF_CAB = { crew: [m(4.65), m(5.6)], square: m(6.5), band: m(7.2), wins: [[m(7.45), m(8.1)], [m(8.25), m(10.05)], [m(10.2), m(10.85)], [m(11.0), m(12.8)]], door: m(13.35) };
function zfCab(c) {
  const L = c.L, x1 = L;
  const paint = () => {
    // Charcoal under the floor; the mid grey panel under the windows,
    // its front end curving down to the floor by the crew door.
    let s = rect(-1, 0, L + 2, ZF.floor, IDFM.skirt);
    s += path(`M${n(m(6.25))} ${n(ZF.floor)}C${n(m(6.3))} ${n(m(1.35))} ${n(m(6.5))} ${n(ZF.panel)} ${n(m(7.3))} ${n(ZF.panel)}L${n(L + 1)} ${n(ZF.panel)}L${n(L + 1)} ${n(ZF.floor)}Z`, IDFM.greyMid);
    s += zfBand(ZF_CAB.band, ZF_CAB.door + 0.1, { roundL: true }) + zfWindows(ZF_CAB.wins);
    // The blue cape: from the roof over the nose and down the cab's side
    // to the skirt.
    s += path(`M-1 0L${n(m(2.25))} 0L${n(m(2.25))} ${n(ZF.floor)}C${n(m(2.4))} ${n(m(1.7))} ${n(m(3.2))} ${n(m(2.4))} ${n(m(4.0))} ${n(m(2.9))}` +
      `C${n(m(4.9))} ${n(m(3.45))} ${n(m(5.7))} ${n(m(3.85))} ${n(m(6.25))} ${n(m(4.3))}L-1 ${n(m(4.3))}Z`, IDFM.blue);
    s += rect(-1, 0, m(2.5), ZF.floor, IDFM.skirt);
    // The black face and windshield along the nose's front edge.
    s += path(`M-1 ${n(m(0.62))}L${n(m(0.7))} ${n(m(0.62))}C${n(m(0.62))} ${n(m(1.2))} ${n(m(0.62))} ${n(m(1.7))} ${n(m(0.7))} ${n(m(1.95))}` +
      `C${n(m(1.1))} ${n(m(2.5))} ${n(m(2.3))} ${n(m(3.4))} ${n(m(3.9))} ${n(m(3.9))}L${n(m(4.3))} ${n(m(4.3))}L-1 ${n(m(4.3))}Z`, IDFM.face);
    s += path(`M${n(m(0.95))} ${n(m(2.2))}C${n(m(1.5))} ${n(m(2.85))} ${n(m(2.4))} ${n(m(3.45))} ${n(m(3.5))} ${n(m(3.82))}`, "none", 0, `stroke="#3b434d" stroke-width="0.8" ${STROKE}`);
    // The headlight's rim, seen past the face's corner.
    s += path(`M${n(m(0.3))} ${n(m(1.3))}A0.6 0.6 0 0 1 ${n(m(0.3))} ${n(m(1.66))}L${n(m(0.45))} ${n(m(1.62))}L${n(m(0.45))} ${n(m(1.34))}Z`, "#e3e7ea");
    // The crew door with its high window and its handle; SNCF's mark ahead
    // of it.
    const [ca, cb] = ZF_CAB.crew;
    s += rect(ca, ZF.floor + 0.15, cb - ca, m(2.42), "none", 0, `rx="0.45" stroke="#7d848c" stroke-width="0.6" ${STROKE}`) + pane(ca + 0.5, m(2.5), cb - ca - 1.0, m(0.8), 0.15) +
      rect(ca + 0.55, m(1.55), 0.75, 0.42, "#c3c8cd", 0, 'rx="0.12" stroke="#7d848c" stroke-width="0.4"') + rect(cb - 0.65, m(1.25), 0.22, m(0.62), "#9ca3aa", 0, 'rx="0.1"');
    s += rect(m(3.7), m(1.2), m(0.48), m(0.62), "none", 0, `stroke="#8a9198" stroke-width="0.5" ${STROKE}`);
    s += sncfMark(c, m(3.05), m(2.02), m(0.42));
    s += idfmSquare(c, ZF_CAB.square, m(2.62), m(1.2));
    s += zfDoor(c, ZF_CAB.door);
    // "îledeFrance mobilités" across the panel.
    s += idfmWord(c, m(7.4), m(1.18), m(0.36), { fill: IDFM.blue, sub: IDFM.ink });
    return s;
  };
  const top = () => louvres(m(6.4), m(3.0), ZF.roof) + louvres(m(9.9), m(3.9), ZF.roof);
  return body(c, {
    sill: ZF.sill, roof: ZF.roof, nose: NOSE_ZF, x1, rear: [[x1, ZF.roof], [x1, ZF.sill]], paint, top, ends: [ZF.floor, ZF.eave - 0.3],
    bottom: [[m(0.75), m(0.4)], [m(2.6), m(0.4)], [m(2.75), ZF.sill], [x1, ZF.sill]],
    under: () => truck(m(3.9), { wb: m(2.3), d: 33, top: ZF.sill }) + jakobs(L, ZF.sill) + cases(m(5.6), L - m(2.2), ZF.sill + 0.05, 3, 0.8) +
      (c.coupledL ? coupledCouplers() : autoCoupler(1.4)),
  });
}
// A middle car (13.24 m between joints; the short one 8.29 m): windows
// to its door, the door at the end toward the unit's middle; "îledeFrance"
// under the windows ahead of the door. o.short: the short car (the door
// and two windows); o.pan: a pantograph over its middle.
function zfMid(c, o = {}) {
  const L = c.L;
  const door = o.short ? (L - ZF_DOOR) / 2 : m(5.55);
  const wins = o.short ? [[m(0.45), m(1.05)], [door + ZF_DOOR + m(0.3), L - m(0.45)]]
    : [[m(0.45), m(1.1)], [m(1.25), m(3.05)], [m(3.2), m(3.85)], [m(4.0), m(5.3)], [door + ZF_DOOR + m(0.25), door + ZF_DOOR + m(0.9)], [door + ZF_DOOR + m(1.05), door + ZF_DOOR + m(2.85)], [door + ZF_DOOR + m(3.0), L - m(0.45)]];
  const paint = () => {
    let s = rect(-1, 0, L + 2, ZF.floor, IDFM.skirt) + rect(-1, ZF.floor, L + 2, ZF.panel - ZF.floor, IDFM.greyMid);
    s += zfBand(-1, L + 1) + zfWindows(wins);
    s += zfDoor(c, door);
    if (!o.short) s += idfmWord(c, m(1.0), m(1.14), m(0.24), { fill: IDFM.blue, sub: IDFM.ink });
    return s;
  };
  const top = () => (o.plain ? "" : o.pan ? panGear(m(2.4), ZF.roof + 0.4, { dir: -1, up: o.pan === "up" }) + louvres(m(4.3), L - m(4.3) - 0.8, ZF.roof) : louvres(0.8, L - 1.6, ZF.roof));
  return body(c, {
    sill: ZF.sill, roof: ZF.roof, x0: 0, x1: L, rear: [[L, ZF.roof], [L, ZF.sill]], nose: [[0, ZF.sill], [0, ZF.roof]], paint, top,
    under: () => jakobs(0, ZF.sill) + jakobs(L, ZF.sill) + cases(m(2.0), L - m(2.0), ZF.sill + 0.05, o.short ? 1 : 2, 0.8),
  });
}

// ===================== Z 57000 Regio 2N =====================
// Bombardier's (now Alstom's) articulated Regio 2N in Île-de-France's
// long version (2017-2021; 145 units: Transilien N, R and the RER D's
// southern branches): eight cars, 109.91 m, single-deck cars (the doors,
// the gear on their roofs, the pantographs) between double-deck ones; a
// truck under each joint and a motor truck under each cab. One end car is
// single-deck (VE 1N, with the wheelchair places), the other double-deck
// behind a short single-deck part with its door (VE 2N); between them
// 2N, 1N, 2N, 1N, 2N, 1N. Lengths: the end car VE 2N about 19.7 m (a
// side-on photograph of 278, Montargis, 2025, scaled by its 1.60 m
// door), the middle cars 12.73 m on average (a 1N and a 2N together
// 25.47 m, the ten-car version's extra pair), the VE 1N the rest
// (13.8 m); heights off the same photograph (the double-deck roof
// 4.13 m, the upper windows 2.8-3.6 m, the lower 0.75-1.65 m). Paint:
// white over the pale blue line at 2.7 m, slate grey under it; the doors
// white with their inner halves blue; "îledeFrance" between the decks.
const RN = { roof2: m(4.13), edge2: m(3.73), roof1: m(3.4), edge1: m(3.28), sill2: m(0.36), sill1: m(0.7), endSill: m(0.95), line: m(2.7), lineHi: m(2.77),
  upLo: m(2.81), upHi: m(3.61), loLo: m(0.75), loHi: m(1.65), floor1: m(0.6), doorHi: m(2.66), slate: "#565d6b", white: "#eceff2" };
const RN_DOOR = m(2.05); // the white surround (the leaves 2 x 0.85 m)
// A Regio 2N door at x: the surround, the leaves with their rounded
// windows, inner halves blue; the small IDFM mark and SNCF's beside it.
function rnDoor(c, x, { mark = true } = {}) {
  const w = RN_DOOR, cx = x + w / 2, lw = m(0.85);
  let s = rect(x, RN.floor1 - 0.3, w, RN.lineHi - RN.floor1 + 0.3, RN.white, 0, 'rx="0.4"');
  s += rect(cx - m(0.42), RN.floor1 - 0.3, m(0.84), 20, IDFM.blue);
  s += rect(cx - lw - 0.08, RN.floor1, lw * 2 + 0.16, RN.doorHi - RN.floor1, "none", 0, `stroke="#5b626a" stroke-width="0.6" ${STROKE}`);
  for (const k of [-1, 1]) s += pane(cx + k * m(0.45) - m(0.21), m(1.22), m(0.42), m(0.95), 0.6, "#1b1e22");
  s += line(cx, RN.floor1 + 0.1, cx, RN.doorHi - 0.05, "#2c3036", 0.8) + circle(cx - 0.5, m(1.15), 0.16, "#d6dadd");
  s += rect(x + 0.3, RN.floor1 - 0.45, w - 0.6, 0.35, "#2b2f35");
  if (mark) s += idfmWord(c, x + 0.3, RN.doorHi + 0.1, 0.17, { square: true, mob: false });
  return s;
}
// A double-deck section's windows from x0: upper narrow, wide, wide,
// narrow; lower wide, wide, wide, narrow (the end car's, measured: 0.5 and
// 1.42 m panes, 0.4 m piers). mirror: the other way round.
function rnDecks(x0, { lowerFirstWide = true, extra = 0 } = {}) {
  const N = m(0.53), W = m(1.42), G = m(0.39);
  const ups = [[x0 + m(0.9), N]], los = [[x0, m(1.45)]];
  let x = x0 + m(1.45) + G;
  for (let i = 0; i < 2 + extra; i++) { ups.push([x, W]); los.push([x, W]); x += W + G; }
  ups.push([x, N]); los.push([x, N]);
  let s = "";
  for (const [ux, w] of ups) s += pane(ux, RN.upLo, w, RN.upHi - RN.upLo, 0.55, "#14171b");
  for (const [lx, w] of los) s += pane(lx, RN.loLo, w, RN.loHi - RN.loLo, 0.55, "#14171b");
  return s;
}
// The Regio 2N's body outline: the double-deck part [a, b] full height and
// low between the trucks; single-deck parts lower; ends at x0, x1. parts:
// [[from, to, "1"|"2"], ...] along the car, left to right.
function rnOutline(parts, nose) {
  const r = 0.9, pts = [];
  // Top, left to right.
  for (const [a, b, k] of parts) {
    const top = k === "2" ? RN.roof2 : RN.roof1;
    if (!pts.length && !nose) pts.push([a, k === "2" ? RN.endSill : RN.sill1], [a, top - r], ["q", a, top, a + r, top]);
    else if (!pts.length) pts.push(...nose.map((p) => [...p]));
    else pts.push([a, top]);
    pts.push([b, top]);
  }
  const [lastA, lastB, lastK] = parts[parts.length - 1];
  const topL = lastK === "2" ? RN.roof2 : RN.roof1;
  pts[pts.length - 1] = [lastB - r, topL];
  pts.push(["q", lastB, topL, lastB, topL - r], [lastB, lastK === "2" ? RN.endSill : RN.sill1]);
  return pts;
}
// A Regio 2N car. o: kind ("VE2N", "VE1N", "VI2N", "VI1N"), pan.
function regio2n(c, o) {
  const L = c.L, k = o.kind, cab = k.startsWith("VE");
  // The roof: full height over the double deck, low over the single-deck
  // parts and the double-deck cars' ends over the trucks.
  const parts = k === "VE2N" ? [[0, m(8.25), "1"], [m(8.25), m(17.6), "2"], [m(17.6), L, "1"]] : k === "VI2N" ? [[0, m(1.9), "1"], [m(1.9), L - m(1.9), "2"], [L - m(1.9), L, "1"]] : [[0, L, "1"]];
  const paint = () => {
    let s = rect(-1, RN.line, L + 2, 20, RN.white) + rect(-1, 0, L + 2, RN.line, RN.slate) + rect(-1, RN.line, L + 2, RN.lineHi - RN.line, IDFM.blue);
    for (const [a, b, kk] of parts) s += rect(a - 0.05, kk === "2" ? RN.edge2 : RN.edge1, b - a + 0.1, 5, "#9097a0");
    s += rect(-1, 0, L + 2, RN.sill1 + 0.25, "#2c3036");
    if (k === "VE2N") {
      // Cab, the crew door, a window, the door, the double deck from 8.4 m
      // to 17.4 m, the end over the joint's truck with its middle window.
      s += rnCabSide(c);
      s += pane(m(4.9), m(1.98), m(0.91), m(0.38), 0.3, "#14171b") + idfmWord(c, m(3.84), m(1.62), m(0.2), { mobH: 0.78, mobY: 0.95 }) + idfmSquare(c, m(5.85), m(1.7), m(0.42));
      s += rnDoor(c, m(6.34));
      s += rnDecks(m(11.23)) + pane(m(17.98), m(1.5), m(1.35), m(0.91), 0.5, "#14171b");
      s += idfmWord(c, m(11.27), m(2.18), m(0.4), { mobH: 0.78, mobY: 0.95, wide: 7.9, sub: "#2f343b" }) + idfmSquare(c, m(15.0), m(2.28), m(0.85));
    } else if (k === "VE1N") {
      s += rnCabSide(c);
      s += pane(m(4.4), m(1.45), m(1.5), m(0.9), 0.5, "#14171b") + rnDoor(c, m(6.5)) + pane(m(9.2), m(1.45), m(1.5), m(0.9), 0.5, "#14171b") +
        pane(m(11.3), m(1.45), m(1.5), m(0.9), 0.5, "#14171b");
      s += idfmWord(c, m(9.2), m(1.05), m(0.22), { mob: false });
    } else if (k === "VI2N") {
      s += rnDecks(m(2.15), { extra: 1 }) + pane(m(0.55), m(1.5), m(1.25), m(0.91), 0.5, "#14171b") + pane(L - m(1.8), m(1.5), m(1.25), m(0.91), 0.5, "#14171b");
      s += idfmWord(c, m(3.3), m(2.18), m(0.4), { mobH: 0.78, mobY: 0.95, wide: 7.9, sub: "#2f343b" }) + idfmSquare(c, m(7.05), m(2.28), m(0.85));
    } else {
      s += pane(m(0.65), m(1.45), m(1.55), m(0.9), 0.5, "#14171b") + pane(L - m(2.2), m(1.45), m(1.55), m(0.9), 0.5, "#14171b");
      s += rnDoor(c, L * 0.32 - RN_DOOR / 2) + rnDoor(c, L * 0.68 - RN_DOOR / 2, { mark: false });
    }
    return s;
  };
  const pts = rnOutline(parts, cab ? NOSE_RN : null);
  // The double-deck part's floor sinks between the trucks.
  const lowA = k === "VE2N" ? m(9.0) : m(2.4), lowB = L - m(2.4);
  const bottom = [];
  if (cab) bottom.push([m(1.25), m(0.33)], [m(4.6), m(0.33)], [m(4.8), RN.sill1]);
  else bottom.push([0, k === "VI2N" ? RN.endSill : RN.sill1]);
  if (k === "VE2N" || k === "VI2N") bottom.push([lowA - 0.6, RN.endSill], [lowA, RN.sill2], [lowB, RN.sill2], [lowB + 0.6, RN.endSill], [L, RN.endSill]);
  else bottom.push([L, RN.sill1]);
  const d = poly([...pts, ...[...bottom].reverse()]);
  const roofGear = () => {
    const H = m(0.6);
    if (k === "VE2N") return louvres(m(2.9), m(5.2), RN.roof1, H, "#8d949c") + louvres(m(17.7), L - m(17.8), RN.roof1, H, "#8d949c");
    if (k === "VE1N") return louvres(m(2.9), L - m(3.0), RN.roof1, H, "#8d949c");
    if (k === "VI1N") return o.pan ? louvres(0.3, L / 2 - 3.4, RN.roof1, H, "#8d949c") + panGear(L / 2, RN.roof1 + 0.35, { dir: -1, up: o.pan === "up" }) +
      louvres(L / 2 + 3.1, L / 2 - 3.4, RN.roof1, H, "#8d949c") : louvres(0.3, L - 0.6, RN.roof1, H, "#8d949c");
    return louvres(0.2, m(1.6), RN.roof1, H, "#8d949c") + louvres(L - m(1.7), m(1.6), RN.roof1, H, "#8d949c");
  };
  const under = () => (cab ? truck(m(3.2), { wb: m(2.3), d: 33, top: RN.sill1 }) + (c.coupledL ? coupledCouplers() : autoCoupler(1.5)) : jakobs(0, RN.endSill)) +
    jakobs(L, RN.endSill) + (k.endsWith("1N") ? cases(cab ? m(5.0) : m(2.2), L - m(2.2), RN.sill1 + 0.05, 2, 0.7) : cases(lowA + 0.5, lowB - 0.5, RN.sill2 + 0.6, 2, 0.5));
  return rawBody(c, d, paint, under, roofGear, cab, { ends: [RN.endSill, m(2.9)] });
}
// The cab's side: the nose's blue edge, white ahead of the slate, SNCF's
// mark, the crew door with its high window, the headlight cluster.
const NOSE_RN = [[m(1.25), m(0.4)], ["q", m(0.45), m(0.5), m(0.43), m(1.1)], ["q", m(0.45), m(1.6), m(0.7), m(2.05)], ["q", m(1.1), m(2.85), m(1.85), m(3.45)],
  ["q", m(2.3), m(3.85), m(2.75), m(3.9)], [m(3.1), RN.roof1]];
function rnCabSide(c) {
  let s = path(`M-1 0L${n(m(3.3))} 0L${n(m(3.3))} ${n(m(0.74))}L${n(m(4.0))} ${n(m(2.1))}L${n(m(4.0))} 20L-1 20Z`, RN.white);
  s += path(`M-1 ${n(m(1.0))}C${n(m(0.45))} ${n(m(1.1))} ${n(m(0.55))} ${n(m(1.7))} ${n(m(0.95))} ${n(m(2.05))}C${n(m(1.55))} ${n(m(2.75))} ${n(m(2.25))} ${n(m(3.35))} ${n(m(3.0))} ${n(m(3.95))}` +
    `L${n(m(3.3))} 20L-1 20Z`, IDFM.blue);
  s += path(`M-1 ${n(m(1.25))}C${n(m(0.4))} ${n(m(1.3))} ${n(m(0.5))} ${n(m(1.6))} ${n(m(0.62))} ${n(m(1.78))}C${n(m(1.3))} ${n(m(2.55))} ${n(m(2.0))} ${n(m(3.2))} ${n(m(2.75))} ${n(m(3.85))}L${n(m(3.3))} 20L-1 20Z`, IDFM.face);
  s += rect(-1, 0, m(1.6), m(0.7), "#2c3036");
  s += rect(m(2.39), m(0.98), m(1.0), m(2.1), "none", 0, `rx="0.4" stroke="#8a9198" stroke-width="0.6" ${STROKE}`) + pane(m(2.6), m(2.4), m(0.5), m(0.55), 0.3) +
    rect(m(2.55), m(1.5), 0.6, 0.35, "#b8bdc2", 0, 'rx="0.1"');
  s += sncfMark(c, m(1.82), m(2.23), m(0.54));
  return s;
}
// A body from its outline path d: paint clipped to it and shaded, the
// outline, under (trucks), top (roof gear).
function rawBody(c, d, paint, under, top, cab, { ends = [m(1.0), m(2.9)] } = {}) {
  const L = c.L, id = newId();
  const stop = (off, color, v, fb) => `<stop offset="${off}" stop-color="${color}" stop-opacity="${fb}" style="stop-opacity:var(${v},${fb})"/>`;
  const shade = `<linearGradient id="${id}-s" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${n(m(4.2))}">` +
    stop(0, "#000", "--car-shade-low", 0.16) + '<stop offset="0.36" stop-color="#000" stop-opacity="0"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/>' +
    stop(0.8, "#fff", "--car-shade-high", 0.1) + '<stop offset="0.93" stop-color="#fff" stop-opacity="0"/>' + stop(1, "#000", "--car-shade-roof", 0.08) + "</linearGradient>";
  let s = under();
  const [ef, et] = ends;
  if (c.coupledR) s += rect(L - 0.4, ef, 0.4, et - ef, C.rubber);
  if (c.coupledL && !cab) s += rect(0, ef, 0.4, et - ef, C.rubber);
  s += `<path d="${d}" fill="${RN.white}"/><clipPath id="${id}"><path d="${d}"/></clipPath><defs>${shade}</defs>` +
    `<g clip-path="url(#${id})">${paint()}<rect x="-5" y="0" width="${n(L + 10)}" height="20" fill="url(#${id}-s)"/></g>`;
  s += `<path d="${d}" fill="none" stroke="currentColor" stroke-width="0.8" ${STROKE}/>`;
  return s + top();
}

// ===================== Z 58000 / Z 58500 "RER NG" =====================
// Alstom's (and Bombardier's) RER NG (2019 on; in service from November
// 2023 on the RER E, December 2024 on the RER D): ordinary cars, each on
// two trucks: two single-deck motor end cars and four (Z 58000, 111.54 m,
// RER E) or five (Z 58500, 130.26 m, RER D) double-deck cars, each with a
// double door (1.95 m) at both ends; the end cars a 1.30 m door behind the
// cab and a 1.95 m one toward the rear. Lengths from the two versions'
// totals: the double-deck cars 18.72 m, the end cars 18.33 m. The end car
// measured off a near side-on photograph (Neuilly - Porte Maillot, 2024)
// scaled by its doors, its paint checked on 58550 (Melun, 2025): the cab
// white, a broad blue band along the nose's edge, the body silver grey,
// black below the windows with "îledeFrance mobilités" across it; the
// doors white, their inner halves and a column up to the roof blue; a
// pale blue band along the top of the side over the door sections.
const NG = { roof2: m(4.32), edge2: m(4.0), roof1: m(3.58), edge1: m(3.42), sill: m(0.55), sill2: m(0.35), endSill: m(0.95), floor: m(0.99),
  black: m(1.6), black2: m(0.8), upLo: m(2.55), upHi: m(3.75), loLo: m(0.68), loHi: m(1.72), band: [m(3.0), m(3.17)], doorHi: m(3.03),
  grey: "#c6cacd", greyEnd: "#a3a8ac", dark: "#1e2125", white: "#eceeef" };
// A door: the white leaves, their inner halves blue, the blue column over
// it; w the opening (1.30 or 1.95 m).
function ngDoor(c, x, open, { ufr = false } = {}) {
  const lw = open / 2 + m(0.06), w = open + m(0.42), cx = x + w / 2;
  let s = rect(x, NG.floor - 0.4, w, NG.doorHi - NG.floor + 0.4 + 0.35, NG.white, 0, 'rx="0.3"');
  s += rect(cx - m(0.33), NG.floor - 0.4, m(0.66), 20, IDFM.blue);
  s += rect(cx - lw, NG.floor, lw * 2, NG.doorHi - NG.floor, "none", 0, `stroke="#5b626a" stroke-width="0.6" ${STROKE}`);
  for (const k of [-1, 1]) s += pane(cx + k * (lw / 2 + m(0.04)) - m(0.19), m(1.55), m(0.38), m(1.1), 0.6, "#1b1e22");
  s += line(cx, NG.floor + 0.1, cx, NG.doorHi - 0.05, "#2c3036", 0.8) + circle(cx + 0.45, m(1.45), 0.16, "#d6dadd");
  if (ufr) s += rect(cx - lw + 0.35, m(2.4), 0.8, 0.8, "#24272c", 0, 'rx="0.08"') + circle(cx - lw + 0.75, m(2.63), 0.12, "#ffffff");
  s += rect(x + 0.2, NG.floor - 0.55, w - 0.4, 0.3, "#2b2f35");
  return { s, w };
}
// A framed window (the RER NG's: dark glass in a broad grey rounded frame).
const ngWin = (x, y, w, h) => rect(x - 0.28, y - 0.28, w + 0.56, h + 0.56, "#d5d8da", 0, `rx="${n(Math.min(w, h) * 0.32 + 0.28)}" stroke="#9ca1a6" stroke-width="0.5" ${STROKE}`) +
  pane(x, y, w, h, Math.min(w, h) * 0.3, "#15181b");
function rerNg(c, o) {
  const L = c.L, cab = !!o.cab;
  const paint = () => {
    let s = rect(-1, 0, L + 2, 20, NG.grey);
    if (cab) {
      s += rect(-1, 0, L + 2, NG.black, NG.dark);
      // The pale blue band along the side's top over the door sections.
      s += rect(m(7.5), NG.band[0], L - m(7.5) + 1, NG.band[1] - NG.band[0], IDFM.blue);
      // The cab: white ahead of the grey, the dark below curving up to the
      // front; the blue band along the nose; the black windshield.
      s += path(`M-1 0L${n(m(3.0))} 0L${n(m(3.3))} ${n(NG.black)}L${n(m(4.5))} ${n(NG.edge1 + 1)}L-1 ${n(NG.edge1 + 1)}Z`, NG.white);
      s += path(`M-1 0L${n(m(3.2))} 0L${n(m(3.2))} ${n(m(1.25))}C${n(m(2.4))} ${n(m(1.3))} ${n(m(1.4))} ${n(m(1.0))} ${n(m(0.9))} ${n(m(0.65))}L-1 ${n(m(0.65))}Z`, NG.dark);
      s += path(`M-1 ${n(m(0.6))}C${n(m(0.55))} ${n(m(0.7))} ${n(m(0.7))} ${n(m(1.4))} ${n(m(1.05))} ${n(m(1.9))}C${n(m(1.6))} ${n(m(2.65))} ${n(m(2.3))} ${n(m(3.15))} ${n(m(3.05))} ${n(m(3.6))}` +
        `L${n(m(3.05))} 20L-1 20Z`, IDFM.blue);
      s += path(`M-1 ${n(m(1.05))}C${n(m(0.5))} ${n(m(1.15))} ${n(m(0.6))} ${n(m(1.7))} ${n(m(0.75))} ${n(m(2.0))}C${n(m(1.2))} ${n(m(2.75))} ${n(m(1.9))} ${n(m(3.25))} ${n(m(2.65))} ${n(m(3.62))}L${n(m(2.65))} 20L-1 20Z`, IDFM.face);
      // The crew door, its tall window; the grilles; the marks.
      s += rect(m(3.56), NG.floor + 0.1, m(0.92), m(2.15), "none", 0, `rx="0.35" stroke="#8a9198" stroke-width="0.6" ${STROKE}`) + pane(m(3.76), m(1.62), m(0.42), m(1.4), 0.25) +
        rect(m(3.7), m(1.25), 0.5, 0.3, "#b8bdc2", 0, 'rx="0.08"');
      s += rect(m(4.7), m(2.55), m(0.42), m(0.35), "#d9dcde", 0.4) + slats(m(4.75), m(2.58), m(0.32), m(0.29), 0.16) +
        rect(m(6.35), m(1.75), m(0.75), m(1.0), "#d9dcde", 0, `rx="0.5" stroke="#9ca1a6" stroke-width="0.5" ${STROKE}`) +
        lines(seq(m(6.5), m(0.11), 5).flatMap((xx) => seq(m(1.85), m(0.12), 7).map((yy) => [xx, yy, xx + 0.18, yy])), "#5c6268", 1.2);
      s += idfmWord(c, m(1.32), m(2.62), m(0.15), { square: true, mobH: 0.78, mobY: 0.95, wide: 7.6 });
      s += sncfMark(c, m(2.15), m(1.68), m(0.32));
      s += T(c, m(2.25), m(1.0), 0.42, "ALSTOM", "#e9ecee", { weight: 700, spacing: "0.08em" });
      // The doors, the windows between, the rear window.
      s += ngDoor(c, m(7.7), m(1.3), { ufr: true }).s;
      for (const x of [m(10.25), m(11.35), m(12.45)]) s += ngWin(x, NG.black + m(0.22), m(0.75), m(0.82));
      s += ngDoor(c, m(13.6), m(1.95)).s + ngWin(m(16.8), NG.black + m(0.22), m(0.75), m(0.82));
      s += idfmWord(c, m(10.55), m(1.13), m(0.28), { fill: IDFM.blue, sub: "#ffffff", mobH: 0.72, inline: true, lead: true, wide: 7.6 });
    } else {
      // A double-deck car: the door sections at its ends (mid grey, the
      // blue band at the top), the two decks between.
      const dA = m(1.05), dB = L - m(1.05) - m(2.37), deckA = m(4.45), deckB = L - m(4.45);
      s += rect(-1, 0, deckA + 1, 20, NG.greyEnd) + rect(deckB, 0, L - deckB + 1, 20, NG.greyEnd);
      s += rect(-1, 0, L + 2, NG.black2, NG.dark) + rect(-1, 0, deckA + 1, NG.floor, NG.dark) + rect(deckB, 0, L - deckB + 1, NG.floor, NG.dark);
      s += rect(-1, NG.band[0], deckA + 1, NG.band[1] - NG.band[0], IDFM.blue) + rect(deckB, NG.band[0], L - deckB + 1, NG.band[1] - NG.band[0], IDFM.blue);
      s += ngDoor(c, dA, m(1.95)).s + ngDoor(c, dB, m(1.95)).s;
      s += ngWin(m(0.3), m(1.75), m(0.5), m(0.8)) + ngWin(L - m(0.8), m(1.75), m(0.5), m(0.8));
      const k = 5, ww = m(1.5), span = deckB - deckA, gap = (span - k * ww) / (k + 1);
      for (let i = 0; i < k; i++) { const x = deckA + gap + i * (ww + gap); s += ngWin(x, NG.upLo, ww, NG.upHi - NG.upLo) + ngWin(x, NG.loLo, ww, NG.loHi - NG.loLo); }
      if (o.word) s += idfmWord(c, deckA + gap + m(0.95), m(1.9), m(0.6), { fill: IDFM.blue, sub: "#1b1e22", mobH: 0.5, inline: true, lead: true, wide: 7.6 });
    }
    return s;
  };
  const r = 0.9;
  let d;
  if (cab) d = poly([[m(1.0), NG.sill], ["q", m(0.45), m(0.62), m(0.45), m(1.15)], ["q", m(0.48), m(1.7), m(0.85), m(2.1)], ["q", m(1.6), m(2.95), m(2.5), m(3.35)],
    ["q", m(2.9), NG.roof1, m(3.6), NG.roof1], [L - r, NG.roof1], ["q", L - 0.3, NG.roof1, L - 0.3, NG.roof1 - r], [L - 0.3, NG.sill]]);
  else d = poly([[0.3, NG.endSill], [0.3, NG.roof1 - r], ["q", 0.3, NG.roof1, 0.3 + r, NG.roof1], [m(4.0), NG.roof1], ["q", m(4.35), NG.roof1, m(4.4), NG.roof1 + 0.6],
    ["q", m(4.45), NG.roof2, m(5.0), NG.roof2], [L - m(5.0), NG.roof2], ["q", L - m(4.45), NG.roof2, L - m(4.4), NG.roof1 + 0.6], ["q", L - m(4.35), NG.roof1, L - m(4.0), NG.roof1],
    [L - 0.3 - r, NG.roof1], ["q", L - 0.3, NG.roof1, L - 0.3, NG.roof1 - r], [L - 0.3, NG.endSill], [L - m(4.2), NG.endSill], [L - m(4.6), NG.sill2], [m(4.6), NG.sill2], [m(4.2), NG.endSill]]);
  const under = () => (cab ? truck(m(3.3), { wb: m(2.5), d: 33, top: NG.sill }) + truck(L - m(2.5), { wb: m(2.5), d: 33, top: NG.sill }) + (c.coupledL ? coupledCouplers() : autoCoupler(1.6)) +
      cases(m(5.0), L - m(4.2), NG.sill + 0.05, 3, 0.6)
    : truck(m(1.85), { wb: m(2.3), d: 33, top: NG.endSill }) + truck(L - m(1.85), { wb: m(2.3), d: 33, top: NG.endSill }) + cases(m(5.0), L - m(5.0), NG.sill2 + 0.5, 2, 0.4)) +
    (c.coupledR ? rect(L - 0.4, m(0.8), 0.4, 0.5, "#2a2d31") : "");
  const top = () => (cab ? louvres(m(4.2), m(3.0), NG.roof1, m(0.5), "#b9bec3") + (o.pan ? panGear(m(11.0), NG.roof1 + 0.35, { dir: -1, up: o.pan === "up" }) : "") + louvres(m(12.4), m(5.0), NG.roof1, m(0.5), "#b9bec3")
    : louvres(0.5, m(3.6), NG.roof1, m(0.45), "#b9bec3") + louvres(L - m(3.9), m(3.6), NG.roof1, m(0.45), "#b9bec3"));
  return rawBody(c, d, paint, under, top, cab, { ends: [NG.floor, m(3.1)] });
}

// ===================== MI 09 and MI 2N =====================
// RATP's double-deck interconnection units for the RER A, all five cars
// double-deck (R + M + M + M + R, 112 m, 4.32 m tall, trucks 16.70 m
// apart): every car has three double doors a side, one at each end over
// the trucks and one in its middle, the two saloons between them two
// decks high, the lower deck sunk between the trucks. MI 09 (Alstom and
// Bombardier, 2011-2017, 140 units) and MI 2N "Altéo" (1997-2005, 43)
// share the body; the MI 09's cab is the newer one. Run two coupled (224
// m). Measured off photographs of MI 09s at Bry-sur-Marne (2026) and
// Poissy (2023) against the trucks' spacing. Paint: the MI 09 in STIF's
// (2011): cream, a grey band between the decks carrying "stif" and a fine
// white line, the windows framed in cream; the doors cream, RATP's jade
// green up their middle to the roof.
const MI = { roof2: m(4.32), edge2: m(3.92), roof1: m(3.62), edge1: m(3.45), sill2: m(0.32), endSill: m(1.0), floor: m(1.1),
  upLo: m(2.78), upHi: m(3.58), loLo: m(0.74), loHi: m(1.92), bandLo: m(2.0), bandHi: m(2.68), doorHi: m(3.25),
  cream: "#ecebe4", grey: "#9ea2a2", jade: "#2fb49c", dark: "#2a2d31", navy: "#263a78", red: "#e3262b" };
// A door at x (frame 2.1 m), as the livery paints it: STIF's cream leaves
// with RATP's jade up the seam to the roof; the MI 2N's original white
// with a red head and a navy foot; IDFM's white with the inner halves and
// a column to the roof blue.
function miDoor(c, x, liv) {
  const w = m(2.1), cx = x + w / 2, lw = m(0.98);
  let s = rect(x, MI.floor - 0.3, w, MI.doorHi - MI.floor + 0.3, liv.doorBase, 0, 'rx="0.3"');
  if (liv.door === "stif") s += rect(cx - m(0.4), MI.floor - 0.3, m(0.8), 20, MI.jade);
  if (liv.door === "alteo") s += rect(x, MI.doorHi - m(0.42), w, m(0.42) + 0.4, MI.red) + rect(x, MI.floor - 0.3, w, m(0.28), MI.navy);
  if (liv.door === "idfm") s += rect(cx - m(0.38), MI.floor - 0.3, m(0.76), 20, IDFM.blue) + rect(x, MI.floor - 0.3, w, m(0.22), IDFM.blue);
  s += rect(cx - lw, MI.floor, lw * 2, MI.doorHi - MI.floor, "none", 0, `stroke="#5b626a" stroke-width="0.6" ${STROKE}`);
  for (const k of [-1, 1]) s += pane(cx + k * m(0.5) - m(0.3), m(1.62), m(0.6), m(1.28), 0.35, "#1b1e22");
  s += line(cx, MI.floor + 0.1, cx, MI.doorHi - 0.05, "#2c3036", 0.8) + rect(x + 0.25, MI.floor - 0.45, w - 0.5, 0.3, "#2b2f35");
  return s;
}
// A framed window on the double deck.
const miWin = (x, y, w, h, frame) => rect(x - 0.3, y - 0.3, w + 0.6, h + 0.6, frame, 0, `rx="0.55" stroke="#8d9296" stroke-width="0.5" ${STROKE}`) + pane(x, y, w, h, 0.4, "#15181b");
// A saloon a..b: upper and lower windows, the narrow one at the end
// toward `narrowAt` ("L" or "R").
function miSaloon(a, b, narrowAt, frame) {
  const span = b - a, nW = span * 0.25, wW = span * 0.5, g = span * 0.08;
  const xs = narrowAt === "L" ? [[a + g, nW], [a + 2 * g + nW, wW]] : [[b - g - nW, nW], [b - 2 * g - nW - wW, wW]];
  return xs.map(([x, w]) => miWin(x, MI.upLo, w, MI.upHi - MI.upLo, frame) + miWin(x, MI.loLo, w, MI.loHi - MI.loLo, frame)).join("");
}
// The liveries.
// STIF's (every MI 09; photographs at Bry-sur-Marne and Poissy, 2023-2026):
// cream; a mid grey band from under the upper windows down past the lower
// windows' sills, carrying "stif" and its fine white line; cream window
// frames.
const MI_STIF = { name: "stif", base: MI.cream, band: [m(0.95), m(2.7), MI.grey], frame: MI.cream, doorBase: MI.cream, door: "stif", face: "#2c3036" };
// The MI 2N's original (RATP's Altéo, 25 of 42 units in October 2026; and
// SNCF's Éole, Z 22500): white, a navy line at the eave, the doors' heads
// red and their feet navy; on the Altéo's end cars a big navy "(RER" and
// the Region's red "îledeFrance" with its star; the Éole's carry
// Transilien's leaf instead (Bussy-Saint-Georges 2026, La Défense 2024;
// Val de Fontenay 2026).
const MI_ALTEO = { name: "alteo", base: "#f4f5f6", eave: MI.navy, frame: "#c9cdd1", doorBase: "#f4f5f6", door: "alteo", face: "#30353c", rer: true };
const MI_EOLE = { ...MI_ALTEO, name: "eole", rer: false, transilien: true, face: MI.navy };
// IDFM's, on the rebuilt Altéos (17 by October 2026; 1538, Boissy 2024):
// white; a pale grey panel from under the upper windows down past the
// lower ones, with "îledeFrance mobilités" across it; IDFM's doors; the
// big blue square behind the cab door, the nose edged pale blue.
const MI_IDFM = { name: "idfm", base: "#f2f4f5", band: [m(1.08), m(2.6), "#b5bbc0"], bandLine: IDFM.blue, frame: "#e2e5e7", doorBase: "#f2f4f5", door: "idfm", face: "#22272d", edge: IDFM.blue, word: true };
// A car. o: cab (the cab car, cab on the left), pan, liv.
function miCar(c, o) {
  const L = c.L, cab = !!o.cab, liv = o.liv;
  // Sections: [doors' x], saloons.
  const doors = cab ? [m(5.0), m(11.6), L - m(3.55)] : [m(1.2), (L - m(2.1)) / 2, L - m(3.3)];
  const sal = cab ? [[m(7.1), m(11.6)], [m(13.7), L - m(3.55)]] : [[m(3.3), doors[1]], [doors[1] + m(2.1), L - m(3.3)]];
  const paint = () => {
    let s = rect(-1, 0, L + 2, 20, liv.base) + rect(-1, MI.edge2, L + 2, 5, "#8c9196");
    if (liv.band) s += rect(cab ? m(4.0) : -1, liv.band[0], L + 2, liv.band[1] - liv.band[0], liv.band[2]);
    if (liv.bandLine) s += rect(cab ? m(4.0) : -1, liv.band[1], L + 2, m(0.1), liv.bandLine);
    // The MI 2N's two navy bands: at the doors' heads (red on the doors)
    // and at their feet, behind the windows.
    if (liv.eave) s += rect(-1, MI.doorHi + m(0.05), L + 2, m(0.2), liv.eave) + rect(-1, MI.floor - 0.3, L + 2, m(0.28), liv.eave);
    s += rect(-1, 0, L + 2, MI.sill2 + 0.4, MI.dark);
    s += miSaloon(sal[0][0], sal[0][1], "L", liv.frame) + miSaloon(sal[1][0], sal[1][1], "R", liv.frame);
    for (const x of doors) s += miDoor(c, x, liv);
    // The end's small window by the end door.
    if (!cab) s += pane(m(0.3), m(1.92), m(0.42), m(0.62), 0.25);
    s += pane(L - m(0.72), m(1.92), m(0.42), m(0.62), 0.25);
    const y = (MI.loHi + MI.upLo) / 2;
    if (liv.name === "stif") {
      s += T(c, sal[0][0] + m(0.9), y - 0.05, m(0.36), "stif", "#ffffff", { weight: 500, family: ROUND, anchor: "start", spacing: "0.02em" }) +
        path(`M${n(sal[0][0] + m(1.9))} ${n(y + 0.55)}L${n(sal[0][0] + m(3.2))} ${n(y + 0.55)}Q${n(sal[0][0] + m(3.6))} ${n(y + 0.55)} ${n(sal[0][0] + m(3.8))} ${n(y + 0.1)}L${n(sal[0][1] + m(0.2))} ${n(y + 0.1)}`,
          "none", 0, `stroke="#ffffff" stroke-width="0.9" ${STROKE}`);
    }
    if (liv.rer && cab) s += T(c, sal[1][0] + m(0.3), y + 0.1, m(1.35), "(RER", MI.navy, { weight: 700, anchor: "start", family: ROUND, spacing: "-0.01em" }) +
      T(c, sal[0][0] + m(0.25), y, m(0.36), "îledeFrance", "#e2231a", { weight: 700, anchor: "start", family: SANS, spacing: "-0.03em" });
    if (liv.transilien && cab) s += transilienWord(c, sal[0][0] + m(0.3), y - 0.1, m(0.3), TR.blue);
    if (liv.word) s += idfmWord(c, (cab ? sal[0][0] : sal[1][0]) + m(0.3), y - 0.55, m(0.5), { wide: 7.6, mobH: 0.5, inline: true, sub: "#2f343b" });
    if (cab) {
      // The cab: the face and windshield, the side behind it with the
      // headlight and the oval lamp recess; the crew door.
      s += path(`M-1 0L${n(m(1.05))} 0L${n(m(1.05))} ${n(m(1.4))}C${n(m(1.1))} ${n(m(2.6))} ${n(m(1.35))} ${n(m(3.3))} ${n(m(2.1))} ${n(m(3.75))}L${n(m(2.1))} 20L-1 20Z`, liv.face);
      if (liv.edge) s += path(`M${n(m(1.05))} 0L${n(m(1.3))} 0L${n(m(1.3))} ${n(m(1.4))}C${n(m(1.35))} ${n(m(2.55))} ${n(m(1.6))} ${n(m(3.2))} ${n(m(2.35))} ${n(m(3.65))}L${n(m(2.1))} ${n(m(3.75))}C${n(m(1.35))} ${n(m(3.3))} ${n(m(1.1))} ${n(m(2.6))} ${n(m(1.05))} ${n(m(1.4))}Z`, liv.edge);
      s += circle(m(1.35), m(1.05), 0.55, "#f2f0e8") + `<ellipse cx="${n(m(1.95))}" cy="${n(m(1.1))}" rx="1.25" ry="0.9" fill="#1e2125"/>`;
      s += rect(m(3.2), MI.floor + 0.1, m(0.75), m(2.15), "none", 0, `rx="0.3" stroke="#8a9198" stroke-width="0.6" ${STROKE}`) + pane(m(3.38), m(1.75), m(0.4), m(1.45), 0.2);
      if (liv.name === "idfm") s += idfmSquare(c, m(4.5), m(2.0), m(0.95));
    }
    return s;
  };
// Outline: low roof over the end sections, full height over the saloons.
  const r = 0.9, lowA = cab ? m(7.1) : m(3.3), lowB = L - m(3.3);
  const pts = cab ? [[m(0.6), MI.endSill - 0.6], ["q", m(0.3), m(0.6), m(0.3), m(1.3)], [m(0.35), m(2.5)], ["q", m(0.5), m(3.5), m(1.4), m(3.8)], ["q", m(2.0), MI.roof2, m(3.0), MI.roof2]]
    : [[0.3, MI.endSill], [0.3, MI.roof1 - r], ["q", 0.3, MI.roof1, 0.3 + r, MI.roof1], [lowA - 1.6, MI.roof1], ["q", lowA - 0.5, MI.roof1, lowA - 0.2, MI.roof1 + 0.7], ["q", lowA, MI.roof2, lowA + 1.4, MI.roof2]];
  pts.push([lowB - 1.4, MI.roof2], ["q", lowB, MI.roof2, lowB + 0.2, MI.roof1 + 0.7], ["q", lowB + 0.5, MI.roof1, lowB + 1.6, MI.roof1], [L - 0.3 - r, MI.roof1], ["q", L - 0.3, MI.roof1, L - 0.3, MI.roof1 - r],
    [L - 0.3, MI.endSill], [lowB - 0.4, MI.endSill], [lowB - 1.0, MI.sill2], [lowA + 1.0, MI.sill2], [lowA + 0.4, MI.endSill]);
  if (cab) pts.push([m(1.2), MI.endSill], [m(1.0), MI.endSill - 0.6]);
  const d = poly(pts);
  const tA = cab ? m(3.6) : (L - m(16.7)) / 2, tB = cab ? m(3.6) + m(16.7) : tA + m(16.7);
  const under = () => truck(tA, { wb: m(2.45), d: 33, top: MI.endSill }) + truck(tB, { wb: m(2.45), d: 33, top: MI.endSill }) + cases(lowA + 1.2, lowB - 1.2, MI.sill2 + 0.45, 3, 0.35) +
    (cab ? (c.coupledL ? coupledCouplers() : autoCoupler(1.6)) : "");
  const top = () => (cab ? "" : louvres(0.6, lowA - 2.2, MI.roof1, m(0.35), "#9aa0a6")) + louvres(lowB + 1.6, L - lowB - 2.2, MI.roof1, m(0.35), "#9aa0a6") +
    (o.pan ? panGear(lowB + m(1.6), MI.roof1 + 0.35, { dir: 1, up: o.pan === "up" }) : "");
  return rawBody(c, d, paint, under, top, cab, { ends: [MI.endSill, m(3.2)] });
}

// ===================== Z 2N (Z 5600, Z 8800, Z 20500, Z 20900) =====================
// SNCF's double-deck suburban units (1982-2004): four cars (Z 8800, most
// Z 20500 and the Z 20900; 98.76 m, 103.5 m for the Z 20900) or five (the
// RER D's Z 20500 and Z 5600 with an extra trailer), every car double-deck
// between its trucks (17.8 m apart on the motor cars, 20.0 m on the long
// trailers), a door over each truck at platform height. Motor cars 25.1 m
// with the flat cab of the series, trailers 24.28 m. Measured off
// photographs of Z 20624 (Villeneuve-Saint-Georges, 2026), Z 20708
// (Lieusaint, 2025) and a trailer at Paris-Nord (2024). IDFM's paint (every
// Z 20500 and Z 20900 rebuilt 2018-2023): silver grey; the pale blue line
// under the upper windows; "îledeFrance" in big blue letters between the
// decks; dark slate from the lower windows down; the doors white with
// their inner halves blue, a dark header over them; the cab's face black
// with pale blue corners.
const Z2 = { roof: m(4.32), edge: m(3.9), endRoof: m(3.75), sill: m(0.42), endSill: m(1.05), floor: m(1.12), upLo: m(2.72), upHi: m(3.65), loLo: m(0.55), loHi: m(1.6),
  line: [m(2.5), m(2.62)], darkHi: m(1.7), doorHi: m(3.05), grey: "#c9cdd1", slate: "#262d38", cabBlue: "#8fc0e6" };
const Z2_DOOR = m(1.9);
function z2Door(c, x, tr = false, carm = false) {
  const w = Z2_DOOR, cx = x + w / 2, lw = m(0.65);
  let s = rect(x - 0.3, Z2.doorHi, w + 0.6, m(0.32), Z2.slate, 0, 'rx="0.3"');
  if (carm) {
    // Carmillon: the leaves carmine, deepening to magenta at their feet.
    const id = newId();
    s += `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${n(Z2.floor)}" x2="0" y2="${n(Z2.doorHi)}"><stop offset="0" stop-color="#8e1f6b"/><stop offset="0.6" stop-color="#c8102e"/></linearGradient></defs>` +
      rect(x, Z2.floor - 0.3, w, Z2.doorHi - Z2.floor + 0.3, `url(#${id})`);
    tr = true;
  } else s += rect(x, Z2.floor - 0.3, w, Z2.doorHi - Z2.floor + 0.3, "#eef0f2");
  if (!tr) s += rect(cx - lw - 0.1, Z2.floor - 0.3, m(0.26), Z2.doorHi - Z2.floor + 0.3, IDFM.blue) + rect(cx + lw + 0.1 - m(0.26), Z2.floor - 0.3, m(0.26), Z2.doorHi - Z2.floor + 0.3, IDFM.blue);
  s += rect(cx - lw, Z2.floor, lw * 2, Z2.doorHi - Z2.floor, "none", 0, `stroke="#5b626a" stroke-width="0.6" ${STROKE}`);
  for (const k of [-1, 1]) s += pane(cx + k * m(0.33) - m(0.2), m(1.75), m(0.4), m(1.05), 0.5, "#1b1e22");
  s += line(cx, Z2.floor + 0.1, cx, Z2.doorHi - 0.05, "#2c3036", 0.8) + rect(x + 0.2, Z2.floor - 0.5, w - 0.4, 0.3, "#2b2f35");
  return s;
}
const z2Win = (x, y, w, h) => rect(x - 0.25, y - 0.25, w + 0.5, h + 0.5, "#bfc3c6", 0, `rx="0.6" stroke="#7d8389" stroke-width="0.5" ${STROKE}`) + pane(x, y, w, h, 0.5, "#15181b");
// A Z 2N car. o: cab, pan, word (the big lettering), liv (IDFM only, as
// drawn here).
function z2Car(c, o) {
  const L = c.L, cab = !!o.cab;
  const tA = cab ? m(4.6) : m(2.15), tB = cab ? tA + m(17.8) : L - m(2.15);
  // The double deck between the doors.
  const dA = cab ? m(5.4) : m(1.0), dB = L - m(1.0) - Z2_DOOR;
  const deckA = dA + Z2_DOOR + m(0.35), deckB = dB - m(0.35);
  const tr = o.liv === "transilien", carm = o.liv === "carmillon";
  const paint = () => {
    // Carmillon (SNCF 2008-2017; the RER C's Z 5600 and Z 8800 still in
    // it, Versailles-Chantiers 2025 and Champ de Mars 2024): silver; a mid
    // grey band between the decks with STIF's fine white line-drawing; a
    // white line, then the carmine one; charcoal through the lower
    // windows; white, then charcoal, at the foot.
    let s = carm ? rect(-1, 0, L + 2, 20, "#d6d9dc") + rect(-1, m(1.95), L + 2, m(0.62), "#9ca2a8") + rect(-1, m(1.72), L + 2, m(0.11), "#c8102e") +
        rect(-1, m(0.48), L + 2, m(1.24), "#2e3440") + rect(-1, 0, L + 2, m(0.28), "#3a3f46")
      : tr ? rect(-1, 0, L + 2, 20, TR.white) + rect(-1, 0, L + 2, m(2.3), TR.blue)
      : rect(-1, 0, L + 2, 20, Z2.grey) + rect(-1, 0, L + 2, Z2.darkHi, Z2.slate) + rect(deckA - 0.2, Z2.line[0], deckB - deckA + 0.4, Z2.line[1] - Z2.line[0], IDFM.blue);
    if (tr) for (const x of [dA, dB]) s += `<ellipse cx="${n(x + Z2_DOOR / 2)}" cy="${n(m(2.1))}" rx="${n(m(1.3))}" ry="${n(m(1.7))}" fill="${TR.pale}"/>`;
    s += rect(-1, Z2.edge, L + 2, 5, "#8f959b");
    const k = 6, span = deckB - deckA, ww = m(1.42), g = (span - k * ww) / (k + 1);
    for (let i = 0; i < k; i++) { const x = deckA + g + i * (ww + g); s += z2Win(x, Z2.upLo, ww, Z2.upHi - Z2.upLo) + z2Win(x, Z2.loLo, ww, Z2.loHi - Z2.loLo); }
    if (carm && !cab) s += line(deckA + m(1.0), m(2.2), deckB - m(1.5), m(2.2), "#eef0f2", 0.7) + T(c, deckA + m(0.3), m(2.22), m(0.22), "stif", "#eef0f2", { weight: 500, family: ROUND, anchor: "start" });
    if (o.word && !tr && !carm) s += idfmSquare(c, deckA + g + m(0.4), m(2.15), m(0.72)) + idfmWord(c, deckA + g + m(1.0), m(1.86), m(0.58), { wide: 7.6, mobH: 0.45, inline: true, sub: "#2f343b" });
    s += z2Door(c, dA, tr, carm) + z2Door(c, dB, tr, carm);
    // The end section beyond the rear door: its small window.
    s += pane(L - m(0.75), m(2.15), m(0.4), m(0.7), 0.3);
    if (!cab) s += pane(m(0.35), m(2.15), m(0.4), m(0.7), 0.3);
    if (cab) {
      // The face's pale blue corner, the black face beyond; the cab side
      // with its window, SNCF's mark; the equipment grille, the small
      // "îledeFrance".
      const id = newId(), edge = carm ? `url(#${id})` : IDFM.blue;
      if (carm) s += `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${n(Z2.roof)}"><stop offset="0" stop-color="#8e1f6b"/><stop offset="0.7" stop-color="#c8102e"/></linearGradient></defs>`;
      if (carm) s += rect(-1, m(0.28), m(4.45), 20, "#d6d9dc") + rect(m(1.2), m(0.28), m(0.25), 20, "#bfc3c7");
      s += rect(-1, 0, m(0.5), 20, "#20252b") + rect(m(0.45), m(0.6), carm ? m(0.75) : m(0.55), 20, edge) + rect(-1, Z2.edge, m(3.6), 5, edge);
      if (tr) {
        // Transilien: the cab section blue to the roof, the green leaf.
        s += rect(-1, 0, dA + 1, 20, TR.blue);
        s += path(`M${n(m(2.2))} ${n(m(3.6))}C${n(m(4.3))} ${n(m(3.1))} ${n(m(5.0))} ${n(m(1.6))} ${n(m(4.2))} ${n(m(0.7))}C${n(m(2.6))} ${n(m(1.4))} ${n(m(1.9))} ${n(m(2.7))} ${n(m(2.2))} ${n(m(3.6))}Z`, TR.green);
      }
      s += pane(m(1.6), m(2.2), m(0.5), m(1.1), 0.2) + (carm ? sncfMark(c, m(1.9), m(1.15), m(0.7)) : tr ? "" : sncfMark(c, m(1.75), m(1.3), m(0.5)));
      s += (tr ? "" : rect(m(2.5), m(1.55), m(1.75), m(1.75), "#3c4046", 0, 'rx="0.15"') + slats(m(2.55), m(1.6), m(1.65), m(1.65), 0.3)) +
        rect(m(4.45), Z2.floor, m(0.7), m(2.0), "none", 0, `rx="0.3" stroke="#7d848c" stroke-width="0.6" ${STROKE}`);
      s += tr || carm ? "" : idfmWord(c, m(2.6), m(1.3), m(0.17), { square: true, mobH: 0.7, mobY: 1.0, wide: 7.4 });
    }
    return s;
  };
  const r = 0.9;
  const pts = cab ? [[m(0.45), m(0.65)], [m(0.4), m(3.6)], ["q", m(0.45), Z2.roof, m(0.9), Z2.roof]]
    : [[0.3, Z2.endSill], [0.3, Z2.endRoof - r], ["q", 0.3, Z2.endRoof, 0.3 + r, Z2.endRoof], [m(0.9), Z2.endRoof], ["q", m(1.05), Z2.roof, m(1.4), Z2.roof]];
  pts.push([L - m(1.4), Z2.roof], ["q", L - m(1.05), Z2.roof, L - m(0.9), Z2.endRoof], [L - 0.3 - r, Z2.endRoof], ["q", L - 0.3, Z2.endRoof, L - 0.3, Z2.endRoof - r], [L - 0.3, Z2.endSill],
    [tB - m(1.6), Z2.endSill], [tB - m(1.9), Z2.sill], [tA + m(1.9), Z2.sill], [tA + m(1.6), Z2.endSill]);
  if (cab) pts.push([m(1.2), Z2.endSill], [m(0.9), m(0.65)]);
  const d = poly(pts);
  const under = () => truck(tA, { wb: m(2.4), d: 36, top: Z2.endSill }) + truck(tB, { wb: m(2.4), d: 36, top: Z2.endSill }) + cases(tA + m(2.2), tB - m(2.2), Z2.sill + 0.45, 3, 0.35) +
    (cab ? rect(0, m(0.75), m(0.5), m(0.35), "#2a2d31") + rect(-0.1, m(0.62), 0.5, m(0.6), "#3b3f45") : "");
  const top = () => (o.pan ? panGear(tB - m(1.5), Z2.roof + 0.35, { dir: 1, up: o.pan === "up" }) : "") + (cab ? rect(m(1.0), Z2.roof - 0.1, m(2.6), m(0.35), "#5a6068", 0.3, 'rx="0.2"') : "");
  return rawBody(c, d, paint, under, top, cab, { ends: [Z2.endSill, m(3.3)] });
}

// ===================== MI 79 and MI 84 (RER B) =====================
// Single-deck interconnection units (MI 79: 1980-1985, MI 84: 1985-1990),
// four cars of 26.26 m (105.05 m a unit), always run two coupled; every
// car four double doors a side (four per face), two windows between each
// pair, the floor high for the RER B's raised platforms. Rebuilt 2010-2015
// (MI 79) and from 2020 (MI 84) in STIF's paint as photographed on 8249
// (Paris-Nord, 2025) and 8316 (2021): white over a black window band, a
// grey band under it carrying "stif" and a white line, charcoal at the
// foot; the doors in the operators' colours, the left leaf carmine fading
// to magenta at the top (SNCF), the right one jade (RATP), both stripes up
// to the roof.
const MB = { roof: m(4.18), edge: m(3.8), sill: m(0.95), floor: m(1.15), bandLo: m(1.65), bandHi: m(3.05), winLo: m(1.85), winHi: m(2.85), greyLo: m(1.0), white: m(1.6),
  doorHi: m(3.0), black: "#1f2226", greyB: "#a7abaf", carmine: "#c8102e", magenta: "#a3195b", jade: "#2fb49c" };
const MB_DOOR = m(1.6);
function mbDoor(c, x) {
  const w = MB_DOOR, cx = x + w / 2, id = newId();
  // The carmine leaf darkens to magenta at its foot; the stripe over it,
  // up to the roof, magenta.
  let s = `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${n(MB.floor)}" x2="0" y2="${n(MB.doorHi)}"><stop offset="0" stop-color="${MB.magenta}"/><stop offset="0.75" stop-color="${MB.carmine}"/></linearGradient></defs>`;
  // Seen from the side the carmine leaf is always on the left: a car drawn
  // turned round swaps them back.
  const [lx, rx] = c.mirrored ? [cx, x] : [x, cx];
  s += rect(lx, MB.floor - 0.2, w / 2, MB.doorHi - MB.floor + 0.2, `url(#${id})`) + rect(lx, MB.doorHi, w / 2, 20, MB.magenta) + rect(rx, MB.floor - 0.2, w / 2, 20, MB.jade);
  s += rect(x, MB.floor, w, MB.doorHi - MB.floor, "none", 0, `stroke="#3a3f45" stroke-width="0.6" ${STROKE}`);
  for (const k of [0, 1]) s += pane(x + (k ? w / 2 + m(0.12) : m(0.12)), m(1.85), w / 2 - m(0.24), m(0.95), 0.25, "#1b1e22");
  s += line(cx, MB.floor + 0.1, cx, MB.doorHi - 0.05, "#2c3036", 0.8) + rect(x + 0.1, MB.floor - 0.45, w - 0.2, 0.3, "#2b2f35");
  return s;
}
// A car. o: cab, pan.
function mbCar(c, o) {
  const L = c.L, cab = !!o.cab, idfm = o.liv === "idfm";
  const doors = cab ? [m(4.7), m(10.95), m(17.2), m(23.45)] : [m(1.95), m(8.35), m(14.75), m(21.15)];
  const tA = cab ? m(3.6) : (L - m(18.5)) / 2, tB = tA + m(18.5);
  const paint = () => {
    // MI 84 in IDFM's paint (Massy-Palaiseau, 2025): white, a navy band
    // through the windows, white below with the big "îledeFrance
    // mobilités" on alternate cars.
    let s = idfm ? rect(-1, 0, L + 2, 20, "#f1f2f4") + rect(-1, MB.bandLo - m(0.05), L + 2, MB.bandHi - MB.bandLo + m(0.1), "#323766") + rect(-1, 0, L + 2, MB.sill + 0.5, "#4a4c52")
      : rect(-1, 0, L + 2, 20, "#f1f1ef") + rect(-1, MB.bandLo, L + 2, MB.bandHi - MB.bandLo, MB.black) + rect(-1, MB.greyLo, L + 2, MB.white - MB.greyLo, MB.greyB) + rect(-1, 0, L + 2, MB.greyLo, "#33373c");
    s += rect(-1, MB.edge, L + 2, 5, "#b9bdc1");
    for (let i = 0; i < doors.length - 1; i++) {
      const a = doors[i] + MB_DOOR + m(0.3), b = doors[i + 1] - m(0.3), w = (b - a - m(0.3)) / 2;
      s += pane(a, MB.winLo, w, MB.winHi - MB.winLo, 0.3, "#0f1114") + pane(a + w + m(0.3), MB.winLo, w, MB.winHi - MB.winLo, 0.3, "#0f1114");
    }
    if (!cab) s += pane(m(0.4), MB.winLo, m(1.15), MB.winHi - MB.winLo, 0.3, "#0f1114");
    s += pane(L - m(1.55), MB.winLo, m(1.15), MB.winHi - MB.winLo, 0.3, "#0f1114");
    for (const x of doors) s += mbDoor(c, x);
    const y = (MB.greyLo + MB.white) / 2;
    if (idfm) s += o.word ? idfmSquare(c, doors[1] + MB_DOOR + m(0.45), m(1.3), m(0.42)) + idfmWord(c, doors[1] + MB_DOOR + m(0.75), m(1.1), m(0.36), { wide: 7.6, mobH: 0.55, inline: true, sub: "#2f343b" })
      : idfmWord(c, doors[2] - m(3.2), m(3.35), m(0.16), { square: true, mobH: 0.75, mobY: 1.0, wide: 7.4 });
    else s += T(c, doors[1] - m(2.6), y - 0.05, m(0.32), "stif", "#ffffff", { weight: 500, family: ROUND, anchor: "start" }) +
      line(doors[1] - m(1.7), y + 0.3, doors[2] - m(0.4), y + 0.3, "#ffffff", 0.8);
    if (cab) {
      // The cab: the black face beyond the white corner, the crew door
      // and its window, the grille, the number.
      s += rect(-1, 0, m(0.5), 20, MB.black) + rect(m(0.45), MB.greyLo, m(0.35), m(3.0), "#f1f1ef");
      s += rect(m(1.6), MB.floor, m(0.7), m(1.95), "none", 0, `rx="0.25" stroke="#7d848c" stroke-width="0.6" ${STROKE}`) + pane(m(1.72), m(2.05), m(0.46), m(0.85), 0.2);
      s += rect(m(2.75), m(1.95), m(0.4), m(0.95), "#3a3f45") + slats(m(2.77), m(1.98), m(0.36), m(0.89), 0.25);
      s += circle(m(0.95), m(1.65), 0.5, "#1e2125") + T(c, m(1.35), m(1.25), m(0.22), "SNCF", "#ffffff", { weight: 800 });
    }
    return s;
  };
  const r = 1.0;
  const pts = cab ? [[m(0.5), MB.sill], [m(0.4), m(1.1)], [m(0.3), m(3.6)], ["q", m(0.35), MB.roof, m(1.0), MB.roof]] : [[0.3, MB.sill], [0.3, MB.roof - r], ["q", 0.3, MB.roof, 0.3 + r, MB.roof]];
  pts.push([L - 0.3 - r, MB.roof], ["q", L - 0.3, MB.roof, L - 0.3, MB.roof - r], [L - 0.3, MB.sill]);
  const d = poly(pts);
  const under = () => truck(tA, { wb: m(2.4), d: 36, top: MB.sill }) + truck(tB, { wb: m(2.4), d: 36, top: MB.sill }) + cases(tA + m(2.0), tB - m(2.0), MB.sill + 0.05, 3, 0.7) +
    (cab ? (c.coupledL ? coupledCouplers() : autoCoupler(1.5)) : "");
  const top = () => (o.pan ? panGear(L / 2, MB.roof + 0.3, { dir: 1, up: o.pan === "up" }) : "") + rect(L * 0.2, MB.roof - 0.1, L * 0.18, m(0.3), "#8f959b", 0.3, 'rx="0.2"');
  return rawBody(c, d, paint, under, top, cab, { ends: [MB.floor, m(3.1)] });
}

// ===================== Transilien's own liveries (2005-2017) =====================
// The livery Transilien gave its own trains before IDFM's: royal blue,
// white, pale blue and the network's coloured leaves; carried in 2026 by
// line J's BB 27300 and VB 2N (to be withdrawn when the RER E reaches
// Mantes, early 2027) and line P's AGC "Bibi" (B 82500).
const TR = { blue: "#2b3f9e", blueDeep: "#1f2f7a", pale: "#8dc6ea", white: "#f3f4f6", silver: "#d6d9dc", green: "#4caf50", red: "#e2403a", orange: "#f39232", magenta: "#b3237a" };
// The Transilien wordmark ("Transilien" in white italics on the blue, its
// green leaf over the T).
const transilienWord = (c, x, y, h, fill = "#ffffff") => T(c, x, y, h, "Transilien", fill, { weight: 500, italic: true, anchor: "start", family: ROUND }) +
  path(`M${n(x + h * 0.15)} ${n(y + h * 0.75)}q${n(h * 0.35)} ${n(h * 0.5)} ${n(h * 0.9)} ${n(h * 0.35)}q${n(-h * 0.25)} ${n(-h * 0.45)} ${n(-h * 0.9)} ${n(-h * 0.35)}Z`, TR.green);

// --- BB 27300 (Alstom Prima, 2008-2010; 19.52 m, B'B', 1,150 mm wheels,
// two pantographs): royal blue all over; on each side a white cloud
// panel with three leaves (red, orange, green) and the white leaf and
// SNCF's mark by one cab (BB 27346, Houilles 2025).
function bb27300(c) {
  const L = c.L, roof = m(4.25), sill = m(1.35);
  // Photographed on BB 27346 (Houilles, 2025): royal blue, grey at the
  // solebar; the white cloud over the left of the machine room, scalloped
  // below, with three small windows and three big leaves (magenta,
  // orange, lime); the machine-room door; horizontal ribs; a big white
  // leaf and SNCF's mark by the right-hand cab.
  const paint = () => {
    let s = rect(-1, 0, L + 2, 20, TR.blue) + rect(-1, 0, L + 2, m(1.78), "#8d9399") + rect(-1, m(3.95), L + 2, 5, "#3b4f9e");
    s += lines(seq(m(1.95), m(0.12), 6).map((y) => [m(1.9), y, L - m(4.2), y]), "rgba(0,0,0,0.25)", 0.5);
    const x0 = m(1.9), x1 = m(12.9), y0 = m(2.5), y1 = m(3.82);
    let cloud = `M${n(x0)} ${n(y1)}L${n(x1)} ${n(y1)}L${n(x1)} ${n(y0 + m(0.15))}`;
    for (let x = x1; x > x0 + 0.5; x -= m(0.95)) cloud += `Q${n(x - m(0.475))} ${n(y0 - m(0.25))} ${n(Math.max(x0, x - m(0.95)))} ${n(y0 + m(0.15))}`;
    s += path(cloud + "Z", TR.white) + lines(seq(y0 + m(0.15), m(0.1), 12).map((y) => [x0, y, x1, y]), "rgba(0,0,0,0.12)", 0.4);
    for (const x of [m(2.4), m(3.05), m(3.7)]) s += pane(x, m(3.05), m(0.42), m(0.55), 0.1);
    for (const [x, col] of [[m(5.1), "#c64b8c"], [m(6.65), "#f08a2c"], [m(8.2), "#a9c83c"]])
      s += path(`M${n(x + m(0.05))} ${n(m(3.82))}C${n(x + m(0.2))} ${n(m(3.65))} ${n(x + m(0.6))} ${n(m(3.3))} ${n(x + m(0.6))} ${n(m(2.98))}C${n(x + m(0.6))} ${n(m(2.55))} ${n(x - m(0.6))} ${n(m(2.55))} ${n(x - m(0.6))} ${n(m(2.98))}C${n(x - m(0.6))} ${n(m(3.3))} ${n(x - m(0.15))} ${n(m(3.6))} ${n(x + m(0.05))} ${n(m(3.82))}Z`, col);
    s += rect(m(9.55), m(1.95), m(1.05), m(1.75), "#cfd3d7", 0.5) + slats(m(9.65), m(2.05), m(0.85), m(1.55), 0.25, "rgba(0,0,0,0.5)");
    s += path(`M${n(L - m(5.9))} ${n(m(2.15))}C${n(L - m(5.0))} ${n(m(2.4))} ${n(L - m(4.9))} ${n(m(3.3))} ${n(L - m(4.75))} ${n(m(3.7))}C${n(L - m(5.6))} ${n(m(3.3))} ${n(L - m(5.9))} ${n(m(2.7))} ${n(L - m(5.9))} ${n(m(2.15))}Z`, "#ffffff") +
      sncfMark(c, L - m(5.25), m(1.95), m(0.4));
    // The cabs' doors and side windows.
    for (const [x, k] of [[m(2.0), 1], [L - m(3.7), -1]]) s += rect(x - (k > 0 ? m(1.0) : 0), m(1.55), m(0.75), m(2.25), "none", 0, `stroke="#141a3c" stroke-width="0.6" ${STROKE}`) +
      pane(x - (k > 0 ? m(0.9) : -m(0.1)), m(2.8), m(0.55), m(0.75), 0.15);
    s += T(c, L - m(1.2), m(2.8), m(0.22), "Transilien", "#ffffff", { weight: 500, italic: true, family: ROUND });
    return s;
  };
  const d = poly([[m(0.5), sill], [m(0.25), m(1.7)], [m(0.3), m(3.0)], ["q", m(0.45), m(3.7), m(1.2), m(4.0)], ["q", m(1.6), roof, m(2.2), roof], [L - m(2.2), roof], ["q", L - m(1.6), roof, L - m(1.2), m(4.0)],
    ["q", L - m(0.45), m(3.7), L - m(0.3), m(3.0)], [L - m(0.25), m(1.7)], [L - m(0.5), sill]]);
  const under = () => truck(m(4.6), { wb: m(2.6), d: 45, kind: "loco", top: sill }) + truck(L - m(4.6), { wb: m(2.6), d: 45, kind: "loco", top: sill }) +
    rect(0, m(1.0), m(0.5), m(0.3), "#2a2d31") + rect(L - m(0.5), m(1.0), m(0.5), m(0.3), "#2a2d31") + circle(0.2, m(1.05), 0.55, "#3b3f45") + circle(L - 0.2, m(1.05), 0.55, "#3b3f45");
  const top = () => panGear(m(5.2), roof + 0.3, { dir: 1, up: true }) + panGear(L - m(5.2), roof + 0.3, { dir: -1, up: false }) + rect(m(8), roof - 0.1, m(3.5), m(0.25), "#6d747c", 0.3);
  return rawBody(c, d, paint, under, top, true, { ends: [sill, m(3)] });
}
// --- VB 2N (1975-1985, rebuilt 2008-2012 in Transilien's paint): double-
// deck coaches of 24.28 m, a double door over each truck, the two decks
// between; white above, royal blue from the lower windows down, the doors
// in pale blue drops; the cab car (VB 2N pilote) with its cab at the
// right as drawn (it closes the train).
function vb2n(c, o) {
  const L = c.L, cab = !!o.cab;
  // Transilien's paint as photographed on line J (Houilles 2025, Poissy
  // 2022): royal blue, a white band between the decks; each door in a big
  // white drop with a coloured one inside it, pale blue, red or green
  // from coach to coach.
  const drop = cab ? TR.pale : [TR.pale, "#d8262f", "#4caf50"][(c.index || 0) % 3];
  const paint = () => {
    let s = rect(-1, 0, L + 2, 20, TR.blue) + rect(-1, m(1.85), L + 2, m(0.8), TR.white) + rect(-1, m(3.95), L + 2, 5, "#5d6570");
    const k = cab ? 5 : 6, a = m(3.8), b = cab ? L - m(6.6) : L - m(3.8), ww = m(1.35), g = (b - a - k * ww) / (k + 1);
    for (let i = 0; i < k; i++) { const x = a + g + i * (ww + g); s += pane(x, m(2.8), ww, m(0.85), 0.4) + pane(x, m(0.75), ww, m(0.9), 0.4); }
    if (cab) s += pane(L - m(3.55), m(2.8), m(1.2), m(0.85), 0.4) + pane(L - m(3.55), m(1.4), m(0.9), m(1.0), 0.3);
    for (const x of [m(1.0), cab ? L - m(6.0) : L - m(2.9)]) {
      const cx = x + m(0.95);
      const dropPath = (w, top, bot) => `M${n(cx)} ${n(top)}C${n(cx + w * 0.35)} ${n(top - (top - bot) * 0.25)} ${n(cx + w)} ${n(bot + (top - bot) * 0.45)} ${n(cx + w)} ${n(bot + (top - bot) * 0.25)}` +
        `C${n(cx + w)} ${n(bot)} ${n(cx - w)} ${n(bot)} ${n(cx - w)} ${n(bot + (top - bot) * 0.25)}C${n(cx - w)} ${n(bot + (top - bot) * 0.45)} ${n(cx - w * 0.35)} ${n(top - (top - bot) * 0.25)} ${n(cx)} ${n(top)}Z`;
      // The drops: round, their tips up toward the right.
      s += path(`M${n(cx + m(0.9))} ${n(m(3.75))}C${n(cx - m(0.6))} ${n(m(3.5))} ${n(cx - m(1.85))} ${n(m(2.6))} ${n(cx - m(1.75))} ${n(m(1.4))}C${n(cx - m(1.6))} ${n(m(0.35))} ${n(cx + m(1.6))} ${n(m(0.3))} ${n(cx + m(1.75))} ${n(m(1.5))}C${n(cx + m(1.85))} ${n(m(2.5))} ${n(cx + m(1.3))} ${n(m(3.1))} ${n(cx + m(0.9))} ${n(m(3.75))}Z`, TR.white) +
        `<ellipse cx="${n(cx - m(0.3))}" cy="${n(m(1.55))}" rx="${n(m(1.05))}" ry="${n(m(1.1))}" fill="${drop}"/>`;
      s += rect(x, m(1.1), m(1.9), m(2.0), "none", 0, `stroke="#3a3f45" stroke-width="0.6" ${STROKE}`) + pane(x + m(0.15), m(1.8), m(0.65), m(1.0), 0.3) + pane(x + m(1.1), m(1.8), m(0.65), m(1.0), 0.3) +
        line(x + m(0.95), m(1.15), x + m(0.95), m(3.05), "#3a3f45", 0.7);
    }
    if (cab) s += pane(L - m(1.2), m(2.6), m(0.5), m(0.8), 0.2) + path(`M${n(L - m(2.0))} ${n(m(0.9))}q${n(m(0.55))} ${n(m(0.3))} ${n(m(0.6))} ${n(m(0.9))}q${n(-m(0.55))} ${n(-m(0.2))} ${n(-m(0.6))} ${n(-m(0.9))}Z`, TR.green) +
      sncfMark(c, L - m(1.6), m(0.75), m(0.22));
    return s;
  };
  const roof = m(4.32), es = m(1.05), low = m(0.35), r = 0.9;
  const pts = [[0.3, es], [0.3, roof - r], ["q", 0.3, roof, 0.3 + r, roof]];
  if (cab) pts.push([L - m(1.0), roof], ["q", L - m(0.35), roof, L - m(0.3), m(3.5)], [L - m(0.3), m(0.9)]);
  else pts.push([L - 0.3 - r, roof], ["q", L - 0.3, roof, L - 0.3, roof - r], [L - 0.3, es]);
  pts.push([L - m(3.4), es], [L - m(3.7), low], [m(3.7), low], [m(3.4), es]);
  const under = () => truck(m(2.4), { wb: m(2.4), d: 36, top: es }) + truck(L - m(2.4), { wb: m(2.4), d: 36, top: es }) + (cab ? rect(L - m(0.5), m(1.0), m(0.5), m(0.3), "#2a2d31") : "");
  return rawBody(c, poly(pts), paint, under, () => "", false, { ends: [es, m(3.3)] });
}
// --- AGC B 82500 "Bibi" (Bombardier, 2006-2009): bi-mode, bi-current
// four-car units (72.8 m) for line P's unelectrified end (Trilport-La
// Ferté-Milon): the end cars 20.3 m, the middle ones 16.1 m, Jacobs
// trucks between, the floor low between the doors. Transilien's paint
// (photographs at Isles-Armentières-Congis, 2024, and Paris-Est): silver;
// a blue band along the roof; the blue nose with the green leaf sweeping
// back past the cab door; the doors red; blue, magenta and pale blue
// blocks over the windows.
function agcB(c, o) {
  const L = c.L, cab = !!o.cab, roof = m(4.0), sill = m(0.64);
  const paint = () => {
    let s = rect(-1, 0, L + 2, 20, TR.silver) + rect(-1, m(3.55), L + 2, 5, TR.blue) + rect(-1, 0, L + 2, m(0.75), "#8f959c");
    const door = cab ? m(12.3) : L - m(1.95);
    const wins = cab ? [m(4.6), m(6.4), m(8.2), m(10.0), m(14.4), m(16.2)] : [m(0.9), m(2.7), m(4.5), m(6.3), m(8.1), m(9.9), m(11.7)];
    for (const x of wins) s += rect(x - 0.25, m(1.42) - 0.25, m(1.6) + 0.5, m(1.18) + 0.5, "#2a2e33", 0, 'rx="0.3"') + pane(x, m(1.42), m(1.6), m(1.18), 0.25);
    s += rect(door, m(0.7), m(1.3), m(2.25), TR.red) + rect(door, m(0.7), m(1.3), m(2.25), "none", 0, `stroke="#5a2420" stroke-width="0.6" ${STROKE}`) +
      pane(door + m(0.1), m(1.45), m(0.45), m(1.1), 0.2) + pane(door + m(0.75), m(1.45), m(0.45), m(1.1), 0.2) + line(door + m(0.65), m(0.75), door + m(0.65), m(2.9), "#5a2420", 0.7);
    s += rect(cab ? m(8.2) : m(6.3), m(2.75), m(1.6), m(0.55), TR.magenta) + rect(cab ? m(10.0) : m(0.9), m(0.75), m(1.6), m(0.6), TR.blue);
    if (cab) {
      s += path(`M-1 0L${n(m(2.0))} 0C${n(m(2.6))} ${n(m(1.4))} ${n(m(3.2))} ${n(m(2.6))} ${n(m(4.4))} ${n(m(3.75))}L-1 ${n(m(3.75))}Z`, TR.blue);
      // The green leaf from the skirt up over the cab door.
      s += path(`M${n(m(2.5))} ${n(m(0.75))}C${n(m(2.4))} ${n(m(2.0))} ${n(m(2.9))} ${n(m(3.2))} ${n(m(4.1))} ${n(m(3.7))}C${n(m(4.3))} ${n(m(2.6))} ${n(m(3.7))} ${n(m(1.3))} ${n(m(2.5))} ${n(m(0.75))}Z`, TR.green) +
        line(m(2.55), m(0.8), m(4.0), m(3.6), "#2f7d34", 0.6);
      s += path(`M-1 ${n(m(1.4))}C${n(m(0.6))} ${n(m(1.5))} ${n(m(1.0))} ${n(m(2.4))} ${n(m(1.9))} ${n(m(3.4))}L-1 ${n(m(3.4))}Z`, "#20252b");
      s += rect(m(2.75), m(0.8), m(0.7), m(2.05), "none", 0, `rx="0.3" stroke="#7d848c" stroke-width="0.6" ${STROKE}`) + sncfMark(c, m(3.0), m(1.25), m(0.3));
    }
    return s;
  };
  const pts = cab ? [[m(0.45), m(0.5)], ["q", m(0.15), m(0.7), m(0.15), m(1.2)], ["q", m(0.25), m(2.1), m(0.9), m(2.7)], ["q", m(1.8), m(3.7), m(2.9), roof]] : [[0.2, sill], [0.2, roof]];
  pts.push([L - 0.2, roof], [L - 0.2, sill]);
  if (cab) pts.push([m(2.7), sill], [m(2.5), m(0.5)]);
  const under = () => (cab ? truck(m(2.4), { wb: m(2.6), d: 33, top: sill }) + (c.coupledL ? coupledCouplers() : autoCoupler(1.4)) : jakobs(0, sill, m(2.6))) + jakobs(L, sill, m(2.6)) +
    cases(cab ? m(4) : m(2.5), L - m(2.5), sill + 0.05, 2, 0.5);
  const top = () => louvres(cab ? m(4.0) : 0.5, L - (cab ? m(4.3) : 1.0), roof, m(0.45), "#8d949b") + (o.pan ? panGear(L - m(4), roof + m(0.45) + 0.2, { dir: 1, up: o.pan === "up" }) : "");
  return rawBody(c, poly(pts), paint, under, top, cab, { ends: [sill, m(3.0)] });
}

// ===================== Tables =====================
const M = (draw, len) => ({ draw, len, oneEnd: false, variant: (c) => `${c.index}/${c.count}` });
export const TYPES = {}, MODELS = {};
function add(key, name, draw, len, extra = {}) {
  TYPES[key] = { name, kind: "emu", ...extra };
  MODELS[key] = M(draw, len);
}
// An end car: key leads its unit (cab on the left), key + "R" closes it.
function addCab(key, name, draw, len, extra = {}) {
  add(key, name, draw, len, extra);
  add(`${key}R`, name, (c) => facingRight(c, draw), len, extra);
}
// A middle car of a unit whose two halves mirror each other: key (its door
// toward the right as drawn, the unit's first half) and key + "R".
function addPair(key, name, draw, len, extra = {}) {
  add(key, name, draw, len, extra);
  add(`${key}R`, name, (c) => facingRight(c, draw), len, extra);
}

addCab("idfZ50", "Francilien (Z 50000) end car", zfCab, m(16.53));
addPair("idfZ50M", "Francilien (Z 50000) middle car", (c) => zfMid(c), m(13.24));
// The pantographs: on cars 2 and 7 (6 in a short unit); under 25 kV, all
// of the Transilien's Francilien lines, one is raised.
addPair("idfZ50P", "Francilien (Z 50000) middle car with a pantograph", (c) => zfMid(c, { pan: "up" }), m(13.24));
addPair("idfZ50Pd", "Francilien (Z 50000) middle car with a pantograph", (c) => zfMid(c, { pan: "down" }), m(13.24));
// Car 5 of a long unit carries nothing on its roof.
addPair("idfZ50C", "Francilien (Z 50000) middle car", (c) => zfMid(c, { plain: true }), m(13.24));
add("idfZ50S", "Francilien (Z 50000) short middle car", (c) => zfMid(c, { short: true }), m(8.29));

// Regio 2N: the end cars (VE 2N double-deck, VE 1N single-deck), the
// double-deck middle cars, the single-deck ones (two of the three carrying
// a pantograph; one raised under 25 kV, both under 1.5 kV).
addCab("idfR2nE2", "Regio 2N (Z 57000) double-deck end car", (c) => regio2n(c, { kind: "VE2N" }), m(19.7));
addCab("idfR2nE1", "Regio 2N (Z 57000) single-deck end car", (c) => regio2n(c, { kind: "VE1N" }), m(13.81));
add("idfR2n2", "Regio 2N (Z 57000) double-deck car", (c) => regio2n(c, { kind: "VI2N" }), m(12.97));
add("idfR2n1", "Regio 2N (Z 57000) single-deck car", (c) => regio2n(c, { kind: "VI1N" }), m(12.5));
add("idfR2n1P", "Regio 2N (Z 57000) single-deck car with a pantograph", (c) => regio2n(c, { kind: "VI1N", pan: "up" }), m(12.5));
add("idfR2n1Pd", "Regio 2N (Z 57000) single-deck car with a pantograph", (c) => regio2n(c, { kind: "VI1N", pan: "down" }), m(12.5));

// RER NG: the end cars (Z1, the pantograph on one of them raised), the
// double-deck cars (Z2, Z3, Z4), "îledeFrance" across every other one.
addCab("idfNgE", "RER NG (Z 58000/58500) end car", (c) => rerNg(c, { cab: true, pan: "up" }), m(18.33));
addCab("idfNgEd", "RER NG (Z 58000/58500) end car", (c) => rerNg(c, { cab: true, pan: "down" }), m(18.33));
add("idfNg2", "RER NG (Z 58000/58500) double-deck car", (c) => rerNg(c, { word: true }), m(18.72));
add("idfNg2b", "RER NG (Z 58000/58500) double-deck car", (c) => rerNg(c, {}), m(18.72));

// MI 09: R (cab), M, M (the pantograph), M, R.
addCab("idfMi09R", "MI 09 cab car", (c) => miCar(c, { cab: true, liv: MI_STIF }), m(22.6));
add("idfMi09M", "MI 09 motor car", (c) => miCar(c, { liv: MI_STIF }), m(22.27));
add("idfMi09P", "MI 09 motor car with the pantograph", (c) => miCar(c, { liv: MI_STIF, pan: "up" }), m(22.27));
// MI 2N Altéo (RER A) in its original paint and in IDFM's; MI 2N Éole
// (Z 22500, RER E).
for (const [k, name, liv] of [["idfAlteo", "MI 2N Altéo", MI_ALTEO], ["idfAlteoI", "MI 2N Altéo (rebuilt)", MI_IDFM], ["idfEole", "MI 2N Éole (Z 22500)", MI_EOLE]]) {
  addCab(`${k}R`, `${name} cab car`, (c) => miCar(c, { cab: true, liv }), m(22.6));
  add(`${k}M`, `${name} motor car`, (c) => miCar(c, { liv }), m(22.27));
  add(`${k}P`, `${name} motor car with the pantograph`, (c) => miCar(c, { liv, pan: "up" }), m(22.27));
}

// Z 2N in IDFM's paint: ZBe (motor car with cab; the pantograph over its
// rear truck), ZRBe and ZRABe trailers (the ex-first-class trailer has
// carried second class only since 2000: one type).
addCab("idfZ2nM", "Z 2N (Z 20500/Z 20900) motor car", (c) => z2Car(c, { cab: true, pan: "up", word: true }), m(25.1));
add("idfZ2nT", "Z 2N (Z 20500/Z 20900) trailer", (c) => z2Car(c, { word: true }), m(24.28));
add("idfZ2nT2", "Z 2N (Z 20500/Z 20900) trailer", (c) => z2Car(c, {}), m(24.28));
// Line U's Z 8800 in Transilien's paint (photographed at Versailles-
// Chantiers and La Défense, 2025): royal blue up to the upper windows,
// white above, the doors set in pale blue drops.
addCab("idfZ88M", "Z 8800 motor car (Transilien paint)", (c) => z2Car(c, { cab: true, pan: "up", liv: "transilien" }), m(25.1));
add("idfZ88T", "Z 8800 trailer (Transilien paint)", (c) => z2Car(c, { liv: "transilien" }), m(24.28));
// The RER C's and V's Z 5600 and Z 8800, most in Carmillon's paint (38 of
// 57 Z 8800, 16 of the 30 Z 5600 left in October 2026).
addCab("idfZ2cM", "Z 5600/Z 8800 motor car (Carmillon paint)", (c) => z2Car(c, { cab: true, pan: "up", liv: "carmillon" }), m(25.1));
add("idfZ2cT", "Z 5600/Z 8800 trailer (Carmillon paint)", (c) => z2Car(c, { liv: "carmillon" }), m(24.28));

// MI 79 / MI 84: M1 (cab, motor), R1, R2, M2 (pantograph on each motor car).
addCab("idfMi79M", "MI 79 motor car", (c) => mbCar(c, { cab: true, pan: "up" }), m(26.26));
add("idfMi79T", "MI 79 trailer", (c) => mbCar(c, {}), m(26.26));
addCab("idfMi84M", "MI 84 motor car", (c) => mbCar(c, { cab: true, pan: "up", liv: "idfm" }), m(26.26));
add("idfMi84T", "MI 84 trailer", (c) => mbCar(c, { liv: "idfm", word: true }), m(26.26));
add("idfMi84T2", "MI 84 trailer", (c) => mbCar(c, { liv: "idfm" }), m(26.26));

add("idfBb27300", "BB 27300 electric locomotive (Transilien)", bb27300, m(19.52), { kind: "electric" });
add("idfVb2n", "VB 2N double-deck coach", (c) => vb2n(c, {}), m(24.28), { kind: "coach" });
add("idfVb2nCab", "VB 2N double-deck cab car", (c) => vb2n(c, { cab: true }), m(24.28), { kind: "coach", cab: true });
// AGC B 82500: end cars (one with the raised pantograph; on diesel beyond
// Trilport both are down), middle cars.
addCab("idfAgcE", "AGC (B 82500) end car", (c) => agcB(c, { cab: true, pan: "down" }), m(20.3));
add("idfAgcM", "AGC (B 82500) middle car", (c) => agcB(c, {}), m(16.1));

// ===================== Typical trains =====================
// No formations are published (SNCF and RATP give none openly), so each
// train is drawn as what usually runs on its line and branch in late 2026
// (French Wikipedia's articles on each line and series, read October 2026;
// IDFM's RER D line committee of June 2026; IDFM's and SNCF's notices).
const rep = (units, k) => Array.from({ length: k }, () => units).flat();
const Z50_LONG = [["idfZ50", 1], ["idfZ50P", 1], ["idfZ50M", 2], ["idfZ50C", 1], ["idfZ50MR", 1], ["idfZ50PR", 1], ["idfZ50R", 1]];
const Z50_SHORT = [["idfZ50", 1], ["idfZ50P", 1], ["idfZ50M", 1], ["idfZ50S", 1], ["idfZ50MR", 1], ["idfZ50PR", 1], ["idfZ50R", 1]];
const R2N = [["idfR2nE2", 1], ["idfR2n1P", 1], ["idfR2n2", 1], ["idfR2n1", 1], ["idfR2n2", 1], ["idfR2n1Pd", 1], ["idfR2n2", 1], ["idfR2nE1R", 1]];
const MI09 = [["idfMi09R", 1], ["idfMi09M", 1], ["idfMi09P", 1], ["idfMi09M", 1], ["idfMi09RR", 1]];
const MI79 = [["idfMi79M", 1], ["idfMi79T", 2], ["idfMi79MR", 1]];
const MI84 = [["idfMi84M", 1], ["idfMi84T", 1], ["idfMi84T2", 1], ["idfMi84MR", 1]];
const mi2n = (k) => [[`${k}R`, 1], [`${k}M`, 1], [`${k}P`, 1], [`${k}M`, 1], [`${k}RR`, 1]];
const Z2C4 = [["idfZ2cM", 1], ["idfZ2cT", 2], ["idfZ2cMR", 1]];
const Z2N4 = [["idfZ2nM", 1], ["idfZ2nT", 1], ["idfZ2nT2", 1], ["idfZ2nMR", 1]];
const Z2N5 = [["idfZ2nM", 1], ["idfZ2nT", 1], ["idfZ2nT2", 1], ["idfZ2nT", 1], ["idfZ2nMR", 1]];
const Z88 = [["idfZ88M", 1], ["idfZ88T", 2], ["idfZ88MR", 1]];
const NG6 = [["idfNgE", 1], ["idfNg2", 1], ["idfNg2b", 1], ["idfNg2", 1], ["idfNg2b", 1], ["idfNgEdR", 1]];
const NG7 = [["idfNgE", 1], ["idfNg2", 1], ["idfNg2b", 1], ["idfNg2", 1], ["idfNg2b", 1], ["idfNg2", 1], ["idfNgEdR", 1]];
const VB2N = [["idfBb27300", 1], ["idfVb2n", 6], ["idfVb2nCab", 1]];
const AGC = [["idfAgcE", 1], ["idfAgcM", 2], ["idfAgcER", 1]];
const SETS = {
  mi09: { label: "MI 09: two five-car double-deck units coupled", units: rep(MI09, 2) },
  mi79: { label: "MI 79 (STIF's paint): two four-car units coupled", units: rep(MI79, 2) },
  mi84: { label: "MI 84 (IDFM's paint): two four-car units coupled", units: rep(MI84, 2) },
  alteo: { label: "MI 2N Altéo in its original paint: two five-car double-deck units coupled", units: rep(mi2n("idfAlteo"), 2) },
  alteoI: { label: "MI 2N Altéo, rebuilt, in IDFM's paint: two five-car double-deck units coupled", units: rep(mi2n("idfAlteoI"), 2) },
  eole: { label: "MI 2N Éole (Z 22500): one five-car double-deck unit (the last of them, leaving by the end of 2026)", units: mi2n("idfEole") },
  z2cC: { label: "Z 5600 or Z 8800 (Z 2N) in Carmillon's paint: two four-car double-deck units coupled", units: rep(Z2C4, 2) },
  z2cV: { label: "Z 5600 or Z 8800 (Z 2N) in Carmillon's paint: one four-car double-deck unit", units: Z2C4 },
  z2nC: { label: "Z 20500 or Z 20900 (Z 2N): two four-car double-deck units coupled (the older Z 5600 and Z 8800 on about a quarter)", units: rep(Z2N4, 2) },
  z2nV: { label: "Z 2N (Z 20500, Z 20900, Z 5600 or Z 8800): one four-car double-deck unit", units: Z2N4 },
  z2nD: { label: "Z 20500 (Z 2N): two five-car double-deck units coupled (some trains the RER NG)", units: rep(Z2N5, 2) },
  z2nP: { label: "Z 20500 (Z 2N): two four-car double-deck units coupled", units: rep(Z2N4, 2) },
  ngD: { label: "RER NG (Z 58500): one seven-car unit, two at the peaks (some trains still the Z 20500)", units: NG7 },
  ngE: { label: "RER NG (Z 58000): one six-car unit, two at the peaks (the last MI 2N leave by the end of 2026)", units: NG6 },
  z50L: { label: "Francilien (Z 50000): one eight-car unit, two at the peaks", units: Z50_LONG },
  z50S: { label: "Francilien (Z 50000): one seven-car unit, two at the peaks", units: Z50_SHORT },
  r2n: { label: "Regio 2N (Z 57000): one eight-car unit, two at the peaks", units: R2N },
  vb2n: { label: "BB 27300 locomotive with VB 2N double-deck coaches (until the RER E reaches Mantes, 2027)", units: VB2N },
  agc: { label: "AGC (B 82500), bi-mode: one four-car unit, two or three at the peaks", units: AGC },
  z88: { label: "Z 8800 (Z 2N): two four-car double-deck units coupled", units: rep(Z88, 2) },
};
// The set a car's type belongs to (a fleet sample, or a train whose cars
// were reported).
const BY_KEY = {
  idfMi09R: "mi09", idfMi09M: "mi09", idfMi09P: "mi09", idfMi79M: "mi79", idfMi79T: "mi79", idfZ2nM: "z2nC", idfZ2nT: "z2nC", idfZ2nT2: "z2nC",
  idfNgE: "ngE", idfNgEd: "ngD", idfNg2: "ngE", idfNg2b: "ngE", idfZ50: "z50L", idfZ50M: "z50L", idfZ50P: "z50L", idfZ50Pd: "z50L", idfZ50C: "z50L", idfZ50S: "z50S",
  idfR2nE2: "r2n", idfR2nE1: "r2n", idfR2n2: "r2n", idfR2n1: "r2n", idfR2n1P: "r2n", idfR2n1Pd: "r2n", idfBb27300: "vb2n", idfVb2n: "vb2n", idfVb2nCab: "vb2n",
  idfAgcE: "agc", idfAgcM: "agc", idfZ88M: "z88", idfZ88T: "z88", idfMi84M: "mi84", idfMi84T: "mi84", idfMi84T2: "mi84",
  idfAlteoR: "alteo", idfAlteoM: "alteo", idfAlteoP: "alteo", idfAlteoIR: "alteoI", idfAlteoIM: "alteoI", idfAlteoIP: "alteoI", idfEoleR: "eole", idfEoleM: "eole", idfEoleP: "eole",
  idfZ2cM: "z2cC", idfZ2cT: "z2cC",
};
const plainName = (v) => String(v || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const has = (t, ...names) => names.some((x) => [t.origin, t.destination].some((e) => plainName(e).includes(plainName(x))));
// Where two series share a line and no feed says which runs a train, the
// train number picks, in proportion to each series' share of the line's
// fleet (October 2026): a stable choice, so a train keeps its drawing.
const share = (t) => { const d = Number(String(t.number || "").replace(/\D/g, "").slice(-9)) || 0; return ((Math.imul(d ^ (d >>> 7), 2654435761) >>> 0) >>> 8) % 100; };
function lineSet(t) {
  const r = String(t.route || "").replace(/^(RER|Transilien)\s+/i, "").trim().toUpperCase();
  switch (r) {
    // RER A: 140 MI 09, 42 MI 2N Altéo (17 rebuilt in IDFM's paint).
    case "A": { const h = share(t); return h < 13 ? "alteo" : h < 23 ? "alteoI" : "mi09"; }
    // RER B: 116 MI 79, 42 MI 84.
    case "B": return share(t) < 27 ? "mi84" : "mi79";
    // RER C: Z 20500 and Z 20900 in IDFM's paint; about a quarter of the
    // trains the Z 5600 and Z 8800 still in Carmillon's.
    case "C": return share(t) < 25 ? "z2cC" : "z2nC";
    case "D":
      // The RER NG runs the Creil/Orry/Villiers-le-Bel/Stade de France -
      // Corbeil-Essonnes trains (20 of its 26 rosters, December 2025); the
      // Regio 2N the southern shuttles (Juvisy - Malesherbes, Juvisy /
      // Corbeil - Melun); the Z 20500 the rest (Goussainville - Melun via
      // Combs-la-Ville, where 6 RER NG rosters run among them).
      if (has(t, "Malesherbes") || (has(t, "Melun") && has(t, "Juvisy", "Corbeil")) || (has(t, "Juvisy") && has(t, "Corbeil"))) return "r2n";
      if (has(t, "Corbeil") && has(t, "Creil", "Orry", "Villiers-le-Bel", "Stade de France", "Gare du Nord", "Goussainville")) return "ngD";
      return "z2nD";
    // RER E: 96 RER NG; a dozen MI 2N Éole left (October 2026).
    case "E": return share(t) < 10 ? "eole" : "ngE";
    case "H": case "K": return "z50L";
    case "J":
      // Mantes via Poissy (and Vernon): BB 27300 and VB 2N; the rest
      // (Ermont, Pontoise, Gisors, Mantes via Conflans): Franciliens.
      if (has(t, "Vernon") || (has(t, "Mantes", "Les Mureaux", "Issou") && !/^1368/.test(String(t.number || "")))) return "vb2n";
      return "z50S";
    case "L": return "z50S";
    case "N": case "R": return "r2n";
    case "P":
      if (has(t, "La Ferté-Milon")) return "agc";
      if (has(t, "Château-Thierry")) return "z2nP";
      return "z50L";
    case "U": return "z88";
    case "V": return share(t) < 40 ? "z2cV" : "z2nV";
    default: return null;
  }
}
export const TYPICAL = {
  transilien: (t, reported) => {
    const own = reported ? BY_KEY[reported] || BY_KEY[reported.replace(/R$/, "")] : null;
    const code = own && (!t.route || !lineSet(t)) ? own : lineSet(t) || own;
    return code ? { ...SETS[code] } : null;
  },
};

// ===================== Car numbers =====================
// The units' numbers (end cars), from the series' articles: a fleet
// sample draws its whole unit. The data carry no car numbers.
export const FLEETS = {
  transilien: [
    [1601, 1880, "idfMi09R"], [3503, 3503, "idfAlteoIR"], [3505, 3506, "idfAlteoIR"], [3501, 3543, "idfAlteoR"], [22501, 22606, "idfEoleR"],
    [8101, 8338, "idfMi79M"], [8401, 8546, "idfMi84M"], [5601, 5704, "idfZ2cM"], [20501, 20900, "idfZ2nM"], [20901, 21008, "idfZ2nM"], [8801, 8916, "idfZ88M"],
    [58001, 58499, "idfNgE"], [58501, 58999, "idfNgEd"], [50001, 50720, "idfZ50"], [507001, 507999, "idfZ50S"], [57001, 57290, "idfR2nE2"], [27301, 27367, "idfBb27300"], [82501, 82700, "idfAgcE"],
  ],
};


// ===================== Fact sheets =====================
const FRW = (p) => `https://fr.wikipedia.org/wiki/${p}`;
const z50F = { model: "Bombardier Francilien (Z 50000)", type: "Articulated electric multiple unit", builder: "Bombardier Transport (now Alstom), Crespin", built: "2009–2022",
  fleet: "360 units: 8-car (112.5 m, lines H, K, P, E) and 7-car (94.3 m, J, L)", topSpeedMph: 87, source: FRW("Z_50000") };
const r2nF = { model: "Regio 2N (Z 57000)", type: "Articulated double-deck electric multiple unit", builder: "Bombardier Transport (now Alstom), Crespin", built: "2017–2021",
  fleet: "145 eight-car units (lines N, R and the RER D's southern branches)", topSpeedMph: 99, lengthFt: 360.6, source: FRW("Regio_2N") };
const ngF = { model: "Alstom RER NG (Z 58000 / Z 58500)", type: "Double-deck electric multiple unit", builder: "Alstom (end cars), Bombardier/Alstom Crespin (double-deck cars)", built: "2019 on",
  fleet: "135 of 262 delivered (October 2026): 6-car Z 58000 on the RER E, 7-car Z 58500 on the RER D", topSpeedMph: 87, source: FRW("Z_58000_/_Z_58500") };
const mi09F = { model: "MI 09", type: "Double-deck electric multiple unit", builder: "Alstom and Bombardier", built: "2011–2017", fleet: "140 five-car units (RATP and SNCF)",
  topSpeedMph: 75, lengthFt: 367.5, source: FRW("MI_09") };
const mi79F = { model: "MI 79 / MI 84", type: "Electric multiple unit", builder: "Franco-Belge, ANF, TCO", built: "1980–1990, rebuilt 2010–2015 (MI 79) and from 2020 (MI 84)",
  fleet: "116 MI 79 and 42 MI 84, four cars each", topSpeedMph: 87, lengthFt: 344.7, source: FRW("MI_79"),
  about: "The RER B's trains until the MI 20 arrives (no sooner than late 2028). Drawn in STIF's paint, which most of both series carry; the doors in SNCF's carmine and RATP's jade." };
const z2nF = { model: "Z 2N (Z 20500, Z 20900)", type: "Double-deck electric multiple unit", builder: "CIMT, ANF, GEC-Alsthom; Alstom and Bombardier (Z 20900)", built: "1988–1998 (Z 20500), 2001–2004 (Z 20900)",
  fleet: "200 Z 20500 and 54 Z 20900, four or five cars", topSpeedMph: 87, source: FRW("Z_20500"),
  about: "SNCF's double-deck suburban units, rebuilt 2018–2023 in Île-de-France Mobilités' paint. The RER C, D and V; line P's Château-Thierry trains." };
const z88F = { model: "Z 8800 (Z 2N)", type: "Double-deck electric multiple unit", builder: "CIMT, ANF, TCO", built: "1985–1988", fleet: "57 four-car units", topSpeedMph: 87, lengthFt: 324.0,
  source: FRW("Z_8800"), about: "Line U's trains (La Défense – La Verrière), drawn in the Transilien paint they still wear; to be replaced by Franciliens by 2030." };
export const FACTS = {
  idfZ50: { ...z50F, about: "The Francilien's end car: its long sloping nose, the crew door, a motor truck under the cab. Île-de-France Mobilités' paint on nearly the whole fleet by 2026." },
  idfZ50M: { ...z50F, about: "A middle car (13.24 m), one wide door a side; a truck under each joint." },
  idfZ50P: { ...z50F, about: "Cars 2 and 7 (6 in a seven-car unit) carry the two pantographs; one is raised under 25 kV." },
  idfZ50C: { ...z50F, about: "Car 5 of an eight-car unit, the only one with nothing on its roof." },
  idfZ50S: { ...z50F, about: "The seven-car units' short middle car (8.29 m), for Saint-Lazare's shorter platforms." },
  idfR2nE2: { ...r2nF, about: "The double-deck end car: the cab, a short single-deck part with a door, then two decks." },
  idfR2nE1: { ...r2nF, about: "The single-deck end car with the wheelchair places." },
  idfR2n2: { ...r2nF, about: "A double-deck car: no doors, two decks of seats between its trucks." },
  idfR2n1: { ...r2nF, about: "A single-deck car: two double doors a side, the electrical gear on its roof." },
  idfR2n1P: { ...r2nF, about: "A single-deck car with one of the unit's two pantographs." },
  idfNgE: { ...ngF, about: "The single-deck motor end car: a 1.30 m door behind the cab, a 1.95 m one toward the rear, the pantograph on its roof." },
  idfNg2: { ...ngF, about: "A double-deck car, a door at each end; four in a Z 58000, five in a Z 58500." },
  idfMi09R: { ...mi09F, about: "The cab car; every car of an MI 09 is double-deck, with three doors a side." },
  idfMi09M: { ...mi09F, about: "A motor car." },
  idfMi09P: { ...mi09F, about: "The middle motor car, with the pantograph." },
  idfMi79M: { ...mi79F }, idfMi79T: { ...mi79F },
  idfMi84M: { ...mi79F, model: "MI 84", built: "1985–1990, rebuilt from 2020", fleet: "42 four-car units",
    about: "The MI 84s rebuilt for the RER B carry IDFM's paint: white, a navy band through the windows, the doors in SNCF's carmine and RATP's jade." },
  idfMi84T: { ...mi79F, model: "MI 84", built: "1985–1990, rebuilt from 2020", fleet: "42 four-car units" },
  idfAlteoR: { model: "MI 2N Altéo", type: "Double-deck electric multiple unit", builder: "GEC Alsthom (Alstom) and ANF (Bombardier)", built: "1997–2005", fleet: "42 five-car units",
    topSpeedMph: 75, lengthFt: 367.5, source: FRW("Altéo"),
    about: "RATP's first double-deck RER A trains. 25 of 42 still wear the original white with navy bands and red door heads, the big \"(RER\" on the end cars; the rest come back rebuilt in IDFM's paint (17 by October 2026)." },
  idfAlteoIR: { model: "MI 2N Altéo, rebuilt", type: "Double-deck electric multiple unit", builder: "GEC Alsthom and ANF; rebuilt by CAF", built: "1997–2005, rebuilt from 2024", fleet: "17 of 42 rebuilt (October 2026)",
    topSpeedMph: 75, lengthFt: 367.5, source: FRW("Altéo"), about: "The rebuilt Altéo in IDFM's paint: the big blue square behind the cab, the pale grey band with \"îledeFrance mobilités\"." },
  idfEoleR: { model: "MI 2N Éole (Z 22500)", type: "Double-deck electric multiple unit", builder: "GEC Alsthom and ANF", built: "1996–2000", fleet: "about a dozen of 53 left (October 2026)",
    topSpeedMph: 87, lengthFt: 367.5, source: FRW("Z_22500"), about: "The RER E's original trains, being retired as the RER NG takes over; the last should go by the end of 2026." },
  idfZ2cM: { model: "Z 5600 / Z 8800 (Z 2N)", type: "Double-deck electric multiple unit", builder: "CIMT, ANF, TCO", built: "1982–1988", fleet: "about 30 Z 5600 and 38 Z 8800 on the RER C and V",
    topSpeedMph: 87, source: FRW("Z_5600"), about: "The RER C's oldest double-deckers, most still in Carmillon's paint (silver, the carmine line, carmine-to-magenta doors), giving way to Z 20500s from the RER D." },
  idfZ2cT: { model: "Z 5600 / Z 8800 (Z 2N) trailer", type: "Double-deck electric multiple unit", builder: "CIMT, ANF, TCO", built: "1982–1988", source: FRW("Z_5600") },
  idfZ2nM: { ...z2nF }, idfZ2nT: { ...z2nF }, idfZ2nT2: { ...z2nF },
  idfZ88M: { ...z88F }, idfZ88T: { ...z88F },
  idfBb27300: { model: "BB 27300 (Alstom Prima)", type: "Electric locomotive", builder: "Alstom", built: "2008–2010", fleet: "67", topSpeedMph: 87, lengthFt: 64.0, powerHp: 5630,
    source: FRW("BB_27300"), about: "Pulls and pushes line J's VB 2N trains to Mantes via Poissy, until the RER E takes the branch over (2027)." },
  idfVb2n: { model: "VB 2N", type: "Double-deck coach", builder: "ANF, CIMT", built: "1975–1985, rebuilt 2008–2012", fleet: "17 sets left (2026), to go in March 2027", lengthFt: 79.7,
    source: FRW("Voiture_de_banlieue_à_deux_niveaux"), about: "SNCF's first double-deck suburban coaches." },
  idfVb2nCab: { model: "VB 2N cab car", type: "Double-deck driving trailer", builder: "ANF, CIMT", built: "1975–1985", lengthFt: 79.7, source: FRW("Voiture_de_banlieue_à_deux_niveaux") },
  idfAgcE: { model: "AGC (B 82500, \"Bibi\")", type: "Bi-mode articulated multiple unit", builder: "Bombardier Transport, Crespin", built: "2006–2009", lengthFt: 238.8, topSpeedMph: 99,
    source: FRW("B_82500"), about: "Electric and diesel, for line P's La Ferté-Milon branch beyond Trilport, unelectrified." },
  idfAgcM: { model: "AGC (B 82500)", type: "Bi-mode articulated multiple unit", builder: "Bombardier Transport", built: "2006–2009", source: FRW("B_82500") },
};
// The turned-round and pantograph-down variants share their fact sheets.
for (const k of Object.keys(TYPES)) {
  if (FACTS[k]) continue;
  const base = [k.replace(/R$/, ""), k.replace(/d?R?$/, ""), k.replace(/b$/, ""), k.replace(/Pd$/, "P"), k.replace(/[MP]$/, "R"), k.replace(/T2$/, "T")].find((b) => FACTS[b]);
  if (base) FACTS[k] = FACTS[base];
}

