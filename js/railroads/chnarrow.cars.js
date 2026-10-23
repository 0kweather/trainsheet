// Switzerland's metre-gauge and rack railways' cars (scripts/railroads/
// switzerland.py): the Rhätische Bahn (rhb), the Matterhorn Gotthard Bahn
// (mgb), the Zentralbahn (zb), MOB/GoldenPass (mob) and the other
// metre-gauge and rack lines (chnarrowother). Trainsheet's own side views,
// at the shared scale (js/carart.js), drawn from the builders' published
// side elevations and dimensions (Stadler's data sheets, the railways' and
// Wikipedia's figures) and from photographs of the trains as they run now
// (Wikimedia Commons, 2020-2026), in their present paint; the railways'
// marks and lettering are drawn here (no logo files).
//
// Metre-gauge cars are smaller than standard-gauge ones: lower (a roof at
// 3.5-3.9 m over the rail, not 4.2-4.6 m), shorter, on smaller wheels. Each
// is drawn at its real size on the same rail as every other railroad's
// cars. A rack railway's cars, built for the slope, are drawn level.
//
// Geometry here is in metres (converted to the shared feet as it's drawn):
// x along the car from its left coupling point, y up from the top of the
// rail. A car with a driving cab draws it at its left end; the strip mirrors
// a cab car at the back of a train.

import { newId } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, poly, truck, pantograph, slats } from "../carart.js?v=dev";
import { mark } from "./czechia.cars.js?v=dev";

const F = 3.28084;
const n = (v) => Math.round(v * 100) / 100;
const ft = (v) => v * F;
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);

// ---------- Drawing in metres ----------
const R = (x, y, w, h, fill, s = 0, e = "") => rect(ft(x), ft(y), ft(w), ft(h), fill, s, e);
const ptsFt = (pts) => pts.map((p) => (p[0] === "q" ? ["q", ft(p[1]), ft(p[2]), ft(p[3]), ft(p[4])] : [ft(p[0]), ft(p[1])]));
const P = (pts, fill, s = 0, e = "") => path(poly(ptsFt(pts)), fill, s, e);
const Ln = (x1, y1, x2, y2, color = "currentColor", px = 0.6) => line(ft(x1), ft(y1), ft(x2), ft(y2), color, px);
const Ci = (x, y, r, fill, s = 0, e = "") => circle(ft(x), ft(y), ft(r), fill, s, e);
// A rounded rectangle, r in metres.
const RR = (x, y, w, h, r, fill, s = 0, e = "") => R(x, y, w, h, fill, s, `rx="${n(ft(r))}"${e ? " " + e : ""}`);
// Bands across the whole side: [[y, h, fill], ...].
const bands = (L, list) => list.map(([y, h, fill]) => R(-0.5, y, L + 1, h, fill)).join("");

// Lettering, h tall, centered on (x, y) (anchor "start" or "end" to set it
// by one end), reading left to right on a mirrored car too.
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
const COND = "'Arial Narrow', 'Helvetica Neue Condensed', 'Roboto Condensed', 'Helvetica Neue', Arial, sans-serif";
const txt = (x, y, h, text, fill, { weight = 700, anchor = "middle", family = SANS, spacing = 0, italic = false, stretch = "" } = {}) =>
  `<text x="${n(x)}" y="${n(y + h * 0.36)}" font-size="${n(h)}" text-anchor="${anchor}" font-weight="${weight}" letter-spacing="${spacing}" font-family="${family}" fill="${fill}"` +
  `${italic ? ' font-style="italic"' : ""}${stretch ? ` font-stretch="${stretch}"` : ""}>${text}</text>`;
const T = (c, x, y, h, text, fill, opts) => mark(c, ft(x), ft(y), txt(0, 0, ft(h), text, fill, opts));
// Something drawn in its own frame (y down, metres scaled to feet) at
// (x, y), kept reading left to right.
const M = (c, x, y, inner, scale = 1) => mark(c, ft(x), ft(y), `<g transform="scale(${n(F * scale)})">${inner}</g>`);

// Soft light from above on a body (the same shading carmodels.js gives its
// bodies), clipped to the outline.
function clipped(outline, inner) {
  const id = newId();
  const ys = outline.match(/-?\d+(\.\d+)?/g).map(Number).filter((_, i) => i % 2 === 1);
  const lo = Math.min(...ys), hi = Math.max(...ys);
  const stop = (o, color, v, fallback) => `<stop offset="${o}" stop-color="${color}" stop-opacity="${fallback}" style="stop-opacity:var(${v},${fallback})"/>`;
  const shade = `<linearGradient id="${id}-s" gradientUnits="userSpaceOnUse" x1="0" y1="${lo}" x2="0" y2="${hi}">` +
    stop(0, "#000", "--car-shade-low", 0.16) + '<stop offset="0.36" stop-color="#000" stop-opacity="0"/>' +
    '<stop offset="0.55" stop-color="#fff" stop-opacity="0"/>' + stop(0.8, "#fff", "--car-shade-high", 0.1) +
    '<stop offset="0.93" stop-color="#fff" stop-opacity="0"/>' + stop(1, "#000", "--car-shade-roof", 0.08) + "</linearGradient>";
  return `<clipPath id="${id}"><path d="${outline}"/></clipPath><defs>${shade}</defs>` +
    `<g clip-path="url(#${id})">${inner}<rect x="-5" y="${lo}" width="300" height="${hi - lo}" fill="url(#${id}-s)"/></g>`;
}

// ---------- Parts ----------
const GLASS = "#20262c", GLASS_HI = "#3a434c", GASKET = "#101316";
// A window: dark glass, the sky's reflection in its upper part.
const pane = (x, y, w, h, r = 0.08) => RR(x, y, w, h, r, GLASS) + RR(x + 0.04, y + h * 0.6, w - 0.08, h * 0.3, Math.min(r, 0.05), GLASS_HI, 0, 'opacity="0.85"');
// Panes set in one black frame (a Stadler window band): from x, the panes'
// widths in order, gap between them; y, h; the frame's border.
function glazing(x, y, ws, h, { gap = 0.1, border = 0.05, r = 0.1, frame = GASKET } = {}) {
  const w = ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1);
  let s = RR(x - border, y - border, w + 2 * border, h + 2 * border, r + border, frame), at = x;
  for (const pw of ws) { s += pane(at, y, pw, h, r * 0.6); at += pw + gap; }
  return s;
}
// Panes given by their left and right edges: [[a, b], ...], each its own frame.
const panes = (list, y, h, o = {}) => list.map(([a, b]) => glazing(a, y, [b - a], h, o)).join("");
// A plug or sliding door: leaves (1 or 2) with a narrow window in each,
// from x, w wide, y0 to y1; fill its paint.
function door(x, w, y0, y1, { leaves = 2, fill = "#d5dadd", win = [0.3, 0.75], winW = 0.28, edge = "currentColor" } = {}) {
  let s = R(x, y0, w, y1 - y0, fill) + R(x, y0, w, y1 - y0, "none", 0.6);
  const lw = w / leaves;
  for (let i = 0; i < leaves; i++) {
    if (i) s += Ln(x + lw * i, y0, x + lw * i, y1, edge, 0.5);
    const wx = leaves === 2 ? (i === 0 ? x + lw - winW - 0.1 : x + lw + 0.1) : x + (lw - winW) / 2;
    if (win) s += RR(wx, y0 + (y1 - y0) * win[0], winW, (y1 - y0) * (win[1] - win[0]), 0.05, GLASS);
  }
  return s;
}
// A bogie: centre x, wheelbase wb (m), wheel diameter d (mm), top of its
// frame (m); kind "car" or "loco".
const bogie = (x, wb, d, top, kind = "car") => truck(ft(x), { wb: ft(wb), d: d / 25.4, top: ft(top), kind });
// A rack bogie: a bogie with the cogwheel's casing between its axles.
const rackBogie = (x, wb, d, top) => bogie(x, wb, d, top, "loco") + RR(x - 0.35, 0.12, 0.7, 0.42, 0.12, "currentColor", 0, 'opacity="0.85"');
// A roof box (air conditioning, converter, resistors), x to x + w, h tall.
const roofBox = (x, w, roof, h = 0.25, fill = "#b9c0c6") => RR(x, roof - 0.03, w, h + 0.03, 0.08, fill, 0.4) + slats(ft(x + 0.15), ft(roof + 0.04), ft(w - 0.3), ft(h - 0.08), 0.5, "rgba(0,0,0,0.2)");
// A pantograph, standing on the roof at x; up or folded, its knee toward
// facing (1 right, -1 left).
// Metre-gauge pantographs are smaller than standard gauge's, and the wire
// lower (about 5.0-5.5 m over the rail): the shared one drawn at k of its
// size.
const panto = (x, roof, up = true, facing = -1, k = 0.72) =>
  `<g transform="translate(${n(ft(x))} ${n(ft(roof))}) scale(${k}) translate(${n(-ft(x))} ${n(-ft(roof))})">${pantograph(ft(x), ft(roof), { up, facing })}</g>`;
// The automatic coupler (Schwab or +GF+) under a cab, its head at x (left
// end) and y its centre.
const autoCoupler = (x, len, y = 0.62) => R(x + 0.12, y - 0.07, len, 0.14, "currentColor", 0, 'opacity="0.9"') + RR(x, y - 0.17, 0.16, 0.34, 0.03, C.steelDark, 0.4) +
  R(x + 0.04, y - 0.04, 0.08, 0.08, "#2a2d31");
// Lamps on a cab front, seen side-on.
const lamp = (x, y, w = 0.14, h = 0.1, color = "#fff4cf") => RR(x, y, w, h, 0.03, color, 0.35);
// The rubber diaphragm and coupling between two cars of a unit, at the end
// x (0 or L) of a car, floor to top.
function gangway(x, side, floor, top) {
  const w = 0.3, a = side < 0 ? x : x - w;
  return RR(a, floor + 0.05, w, top - floor - 0.1, 0.06, C.rubber) + Ln(a + w * 0.33, floor + 0.1, a + w * 0.33, top - 0.1, "#3a3f45", 0.6) +
    Ln(a + w * 0.66, floor + 0.1, a + w * 0.66, top - 0.1, "#3a3f45", 0.6) + R(a, Math.max(0.3, floor - 0.35), w, 0.35, "currentColor", 0, 'opacity="0.85"');
}

// ---------- A car body ----------
// o (metres): roof (the roof's top over the side), sill (the body's foot),
// nose (the cab end's profile from its foot up to the roof, points and
// ["q", cx, cy, x, y] curves; a car without one has plain ends), endR (a
// plain end's roof corner), bottom (the underside from left to right, [x, y]
// points between the ends, for skirts and steps; the sill otherwise),
// endInset (where a plain end's body begins), base (the body's paint),
// paint(c, L) (everything painted on the side, clipped to the body: bands,
// windows set flush), under(c, L) (drawn behind the body: bogies,
// equipment), extra(c, L) (over it: doors, roof equipment, lettering), dia
// ([floor, top] of the gangway at a coupled plain end).
function body(c, o) {
  const L = c.L / F, inset = o.endInset ?? 0.3, xR = L - inset;
  const cab = !!o.nose;
  const x0 = cab ? o.nose[0][0] : inset, sill = o.sill, roof = o.roof, er = o.endR ?? 0.35;
  const bottom = o.bottom || [];
  const pts = [[x0, cab ? o.nose[0][1] : sill], ...bottom, [xR, sill], [xR, roof - er], ["q", xR, roof, xR - er, roof]];
  if (cab) {
    // The nose walked from the roof down.
    const nose = o.nose, end = (p) => (p[0] === "q" ? [p[3], p[4]] : p);
    pts.push(end(nose[nose.length - 1]));
    for (let i = nose.length - 1; i > 0; i--) {
      const p = nose[i], to = end(nose[i - 1]);
      pts.push(p[0] === "q" ? ["q", p[1], p[2], to[0], to[1]] : to);
    }
  } else pts.push([x0 + er, roof], ["q", x0, roof, x0, roof - er]);
  const d = poly(ptsFt(pts));
  let s = o.under ? o.under(c, L) : "";
  s += path(d, o.base) + clipped(d, R(-1, -1, L + 2, roof + 2, o.base) + (o.paint ? o.paint(c, L) : ""));
  if (o.extra) s += o.extra(c, L);
  s += path(d, "none", 0.8);
  const [fl, tp] = o.dia || [sill + 0.4, roof - 0.45];
  if (c.coupledL && !cab) s += gangway(0, -1, fl, tp);
  if (c.coupledR) s += gangway(L, 1, fl, tp);
  return s;
}

// ===================== Rhätische Bahn =====================
// RhB red (photographs, 2022-2026), the light gray roof, the silver line at
// floor height, the doors' silver-gray, first class's yellow line along the
// top of the side.
const RHB = { red: "#d9231f", roof: "#c4cad0", silver: "#e2e5e7", door: "#dde1e3", skirt: "#4d555d", yellow: "#f2c200", dark: "#1a1d21" };
// The RhB mark (Hans Schmid, 1964), white on the red: a bar along the top
// turning down into a chevron pointing back, "RhB" in heavy capitals
// beside it, a block closing the right end, a long bar under it all
// reaching back further (photograph of AB 5702, 2018). h its height (m), x
// its left end, y its middle; then the railway's name beside it in narrow
// bold letters as tall as the mark: "Rhätische Bahn", "Viafier retica" or
// "Ferrovia retica".
const RHB_D = "M1.359 0L4.23 0L4.174 0.235L1.387 0.235L1.112 0.482L1.269 0.692L0.924 0.692L0.81 0.52Q0.78 0.47 0.83 0.42L1.232 0.05Q1.29 0 1.359 0Z" +
  "M3.095 0.336L4.174 0.336L4.104 0.678L3.053 0.678Z" + "M0 0.784L3.417 0.776L3.23 0.95Q3.18 1.0 3.1 1.0L0 1.0Z";
const rhbLogo = (h, fill) => `<g transform="scale(${n(h)})"><path d="${RHB_D}" fill="${fill}"/>` +
  `<text x="1.39" y="0.692" font-size="0.45" textLength="1.6" lengthAdjust="spacingAndGlyphs" font-weight="900" font-family="${SANS}" fill="${fill}">RhB</text></g>`;
function rhbMark(c, x, y, h, name, fill = "#ffffff") {
  // The mark and the name as one group, so they keep their order on a
  // mirrored car; x is the mark's left end.
  const fs = h * 1.36, tw = name ? name.length * fs * 0.42 : 0, w = 4.23 * h + (name ? 0.3 * h + tw : 0);
  return M(c, x + w / 2, y, `<g transform="translate(${n(-w / 2)} ${n(-h / 2)})">${rhbLogo(h, fill)}` +
    (name ? `<text x="${n(4.53 * h)}" y="${n(h)}" font-size="${n(fs)}" font-weight="700" font-family="${COND}" font-stretch="condensed" fill="${fill}">${name}</text>` : "") + "</g>");
}

// ---------- Capricorn (ABe 4/16 3111-3172) ----------
// Stadler, 2019-2026 (62 units): four cars, 76.43 m over the couplers
// (Stadler data sheet TMRHB0522d, its side elevation measured here): the
// high-floor power car Be 4/4 (second class), the low-floor Bi and B
// (second class), the control car At (first class); 2.67 m wide, 3.78 m
// high, Bo'Bo'+2'2'+2'2'+2'2', 810 mm driving wheels, the trailers' 685 mm
// (the At's leading bogie 810 mm, its wheelbase 2.0 m). Photographs at
// Domat/Ems, Davos, Bever and Landquart (2021-2026): RhB red, the front's
// glazing in a black mask, a silver line at floor height round the front
// and along the sides (the doors silver-gray down to the step), the roof
// light gray over its equipment covers; the unit's number white behind the
// cab door; on each car the RhB mark with the railway's name in one of its
// three languages (Rhätische Bahn, Viafier retica, Ferrovia retica); "2" or
// "1" in white beside the doors; the At's yellow line along the top of the
// side over the first-class windows. Two pantographs, sunk into the power
// car's roof cover at its ends; the one at the inner end is drawn raised.
const CAP = { roof: 3.72, eave: 3.3, sill: 0.33, stripe: [0.8, 0.075], hi: [1.68, 2.79], lo: [1.08, 2.79] };
const NOSE_CAP = [[0.45, 0.42], [0.45, 1.05], [0.5, 1.68], [1.68, 3.43], ["q", 1.98, 3.72, 2.45, 3.72]];
const capPaint = (L, { yellow = null } = {}) => (c) => bands(L, [[CAP.eave, 2, RHB.roof], [0, CAP.sill + 0.12, RHB.skirt], [CAP.sill + 0.12, 0.04, "#8e969d"], [CAP.stripe[0], CAP.stripe[1], RHB.silver]]) +
  (yellow ? yellow.map(([a, b]) => R(a, CAP.hi[1] + 0.07, b - a, 0.08, RHB.yellow)).join("") : "");
// Window bands: panes [[a, b, low], ...] in one frame each run.
const capBand = (list) => band(list, CAP.hi, CAP.lo);
const capDoor = (x) => door(x, 1.36, 0.36, 2.82, { fill: RHB.door, win: [0.3, 0.85], winW: 0.26 }) + R(x + 0.05, 0.24, 1.26, 0.12, "#3a3f45");
const capNum = (c, x, y, k) => T(c, x, y, 0.42, k, "#ffffff", { weight: 700 });
// The cab: the black mask along the windscreen and round the side window,
// the cab door with its grab rails and narrow window, the lamps, the
// coupler; the unit's number behind the door.
function capCab(c) {
  let s = P([[0.47, 1.6], [1.62, 3.38], [2.0, 3.38], [0.85, 1.6]], RHB.dark) + P([[1.07, 1.88], [1.22, 1.65], [2.22, 1.65], [2.22, 2.92], [1.86, 2.92]], RHB.dark) +
    P([[1.13, 1.9], [1.25, 1.72], [2.15, 1.72], [2.15, 2.85], [1.9, 2.85]], GLASS) + R(1.3, 2.35, 0.8, 0.45, GLASS_HI, 0, 'opacity="0.6"');
  s += Ln(2.45, CAP.sill + 0.2, 2.45, CAP.roof - 0.05, "rgba(0,0,0,0.35)", 0.5) + R(2.52, 0.62, 0.86, 2.62, "none", 0.5) + RR(2.8, 1.72, 0.3, 1.05, 0.05, GLASS) +
    Ln(2.58, 0.95, 2.58, 2.75, "#e8eaec", 1.0) + Ln(3.32, 0.95, 3.32, 2.75, "#e8eaec", 1.0) + R(2.58, 0.45, 0.74, 0.07, "#3a3f45");
  s += lamp(0.42, 1.18, 0.12, 0.1) + lamp(0.42, 1.36, 0.1, 0.08, "#ff5a4a") + autoCoupler(0.0, 0.5, 0.6);
  return s;
}
function capPower(c) {
  const L = c.L / F;
  const roofCover = RR(3.35, CAP.eave + 0.02, L - 3.7, CAP.roof + 0.06 - CAP.eave, 0.12, "#cdd3d8", 0.4) +
    R(3.76, CAP.roof - 0.1, 0.95, 0.18, "#9ea6ad") + R(16.08, CAP.roof - 0.1, 0.92, 0.18, "#9ea6ad") +
    roofBox(6.37, 1.4, CAP.roof - 0.04, 0.12, "#6d757c") + R(8.3, CAP.roof - 0.02, 1.1, 0.08, "#aab2b9", 0.4) + roofBox(11.74, 2.24, CAP.roof - 0.04, 0.12, "#6d757c");
  return body(c, {
    roof: CAP.roof, sill: CAP.sill, nose: NOSE_CAP, base: RHB.red, endInset: 0.45, dia: [0.9, 3.2],
    under: () => bogie(4.03, 2.0, 810, 0.55, "loco") + bogie(16.86, 2.0, 810, 0.55, "loco") + R(6.0, 0.25, 4.5, 0.25, "currentColor", 0, 'opacity="0.8"'),
    paint: () => capPaint(L)(c) + capBand([[3.91, 5.43], [5.58, 6.43], [6.61, 8.21]]) + capBand([[11.79, 13.43], [13.66, 15.25], [15.44, 17.04]]) +
      RR(8.3 - 0.0, 1.1, 1.15, 0.2, 0.03, "#2b2f34") + RR(17.55, 1.25, 0.55, 1.45, 0.12, "none", 0.4),
    extra: () => capDoor(9.6) + roofCover + panto(16.54, CAP.roof + 0.0, true, -1) + panto(4.23, CAP.roof, false) + capCab(c) +
      capNum(c, 9.32, 2.52, "2") + capNum(c, 11.25, 2.52, "2") +
      rhbMark(c, 11.6, 1.28, 0.24, "Rhätische Bahn"),
  });
}
function capBi(c) {
  const L = c.L / F;
  return body(c, {
    roof: CAP.roof, sill: CAP.sill, base: RHB.red, endInset: 0.45, dia: [0.6, 3.2],
    under: () => bogie(2.92, 1.8, 685, 0.5) + bogie(15.75, 1.8, 685, 0.5),
    paint: () => capPaint(L)(c) + capBand([[0.98, 2.59], [2.81, 4.41], [4.56, 6.17], [6.6, 7.9, true]]) + capBand([[12.22, 13.53, true], [13.83, 15.43], [15.62, 17.18]]) +
      RR(8.62, 1.98, 0.36, 0.7, 0.06, GASKET) + RR(8.66, 2.02, 0.28, 0.62, 0.05, "#a9b4b8") + RR(12.45, 0.92, 0.85, 0.12, 0.02, "#2b2f34") +
      [1.2, 1.45, 1.7, 1.95].map((y) => RR(8.25, y, 0.18, 0.18, 0.02, "none", 0, 'stroke="#ffffff" stroke-width="0.6" vector-effect="non-scaling-stroke"')).join(""),
    extra: () => capDoor(9.9) + RR(10.1, CAP.roof - 0.02, 2.0, 0.13, 0.05, "#b0b8be", 0.4) + capNum(c, 8.33, 2.55, "2") + rhbMark(c, 1.15, 1.3, 0.24, "Viafier retica"),
  });
}
function capB(c) {
  const L = c.L / F;
  return body(c, {
    roof: CAP.roof, sill: CAP.sill, base: RHB.red, endInset: 0.45, dia: [0.6, 3.2],
    under: () => bogie(2.91, 1.8, 685, 0.5) + bogie(15.6, 1.8, 685, 0.5),
    paint: () => capPaint(L)(c) + capBand([[0.86, 2.47], [2.69, 4.22], [4.88, 6.15, true], [6.37, 7.65, true]]) + capBand([[10.32, 11.84, true], [12.13, 13.7], [13.92, 15.49]]) +
      RR(16.89, 2.04, 0.65, 0.7, 0.12, GASKET) + RR(16.94, 2.09, 0.55, 0.6, 0.1, "#a9b4b8") + RR(10.55, 0.92, 0.85, 0.12, 0.02, "#2b2f34"),
    extra: () => capDoor(8.45) + RR(8.0, CAP.roof - 0.02, 4.8, 0.13, 0.05, "#b0b8be", 0.4) + capNum(c, 8.15, 2.55, "2") + capNum(c, 10.1, 2.55, "2") +
      rhbMark(c, 1.0, 1.3, 0.24, "Ferrovia retica"),
  });
}
function capAt(c) {
  const L = c.L / F;
  return body(c, {
    roof: CAP.roof, sill: CAP.sill, nose: NOSE_CAP, base: RHB.red, endInset: 0.45, dia: [0.6, 3.2],
    under: () => bogie(3.95, 2.0, 810, 0.5) + bogie(16.8, 1.8, 685, 0.5),
    paint: () => capPaint(L, { yellow: [[3.88, 9.81], [13.04, 18.96]] })(c) + capBand([[3.94, 5.81], [5.95, 7.85]]) + capBand([[8.2, 9.75, true]]) +
      capBand([[13.1, 14.6, true], [15.03, 16.85], [17.0, 18.9]]) + RR(13.3, 0.92, 0.85, 0.12, 0.02, "#2b2f34"),
    extra: () => capDoor(11.08) + roofBox(10.8, 2.05, CAP.roof, 0.13, "#b0b8be") + capCab(c) + capNum(c, 10.78, 2.55, "1") + capNum(c, 12.78, 2.55, "1") +
      rhbMark(c, 15.25, 1.3, 0.24, "Rhätische Bahn"),
  });
}

// Window bands for Stadler bodies: panes [[a, b, low], ...] each in a
// black frame, the frames joined between neighbouring panes; hi and lo the
// high-floor and low-floor panes' [foot, top].
function band(list, hi, lo = hi, { r = 0.1, gap = true } = {}) {
  const yy = (low) => (low ? lo : hi);
  let s = list.map(([a, b, low]) => RR(a - 0.06, yy(low)[0] - 0.06, b - a + 0.12, yy(low)[1] - yy(low)[0] + 0.12, r, GASKET)).join("");
  if (gap) s += list.slice(1).map(([a], i) => (a - list[i][1] < 0.6 ? R(list[i][1], hi[0] - 0.06, a - list[i][1], hi[1] - hi[0] + 0.12, GASKET) : "")).join("");
  return s + list.map(([a, b, low]) => pane(a, yy(low)[0], b - a, yy(low)[1] - yy(low)[0], r * 0.6)).join("");
}

// ---------- Allegra (ABe 8/12 3501-3515) ----------
// Stadler, 2009-2011 (15 units): three cars, 49.5 m over the couplers
// (Stadler's data sheet, its side elevation measured here): two high-floor
// power cars ABe 4/4 (first class behind the cab, then second) and a
// partly low-floor middle car Bi on trailing bogies; 3.80 m high, 810 mm
// driving and 685 mm trailing wheels. Dual voltage: a DC pantograph on
// each end car behind the cab, the AC one on the middle car. Photographs at
// Bernina Lagalb, Poschiavo, Tirano and Chur (2022-2026): RhB red, the
// silver line at floor height and dark red under it; the windscreen and the
// cab side window black; the first class's yellow line over its two
// windows, "1" and "2" either side of the single door; on each car the RhB
// mark and the railway's name (Ferrovia retica, Viafier retica,
// Rhätische Bahn). (Each unit's name, lettered small behind the cab, is
// left out: the drawing is of the class, not one unit.)
const ALG = { roof: 3.8, eave: 3.33, sill: 0.33, stripe: 0.98, hi: [1.45, 2.85], lo: [1.06, 2.85], dark: "#a8181a" };
// On the Bernina line (1000 V DC) the end cars' pantographs are up, the
// middle car's (11 kV AC) down.
const bernina = (c) => /Bernina|^R 19$|^RE 9$/.test(c.route || "");
const NOSE_ALG = [[0.6, 0.38], [0.48, 0.86], [0.44, 1.22], [0.57, 1.67], [0.85, 2.5], ["q", 1.0, 2.95, 1.26, 3.23], ["q", 1.55, 3.6, 1.95, 3.72], ["q", 2.2, 3.8, 2.5, 3.8]];
const algPaint = (L) => bands(L, [[ALG.eave, 2, RHB.roof], [0, ALG.stripe, ALG.dark], [ALG.stripe, 0.08, RHB.silver], [0, ALG.sill + 0.1, RHB.skirt]]);
function algEnd(c) {
  const L = c.L / F;
  return body(c, {
    roof: ALG.roof, sill: ALG.sill, nose: NOSE_ALG, base: RHB.red, endInset: 0.4, dia: [1.0, 3.25],
    under: () => bogie(3.08, 2.0, 810, 0.55, "loco") + bogie(13.8, 2.0, 810, 0.55, "loco") + R(5.0, 0.3, 6.9, 0.3, "currentColor", 0, 'opacity="0.8"'),
    paint: () => algPaint(L) + R(3.18, ALG.hi[1] + 0.08, 3.92, 0.09, RHB.yellow) +
      P([[0.6, 1.55], [0.9, 2.5], ["q", 1.05, 2.95, 1.3, 3.22], [1.62, 3.22], [1.62, 1.55]], RHB.dark) + P([[0.95, 1.62], [1.2, 2.5], ["q", 1.3, 2.85, 1.45, 3.05], [1.55, 3.05], [1.55, 1.62]], GLASS) +
      band([[3.24, 5.04], [5.25, 7.04]], ALG.hi) + band([[9.99, 11.6], [11.78, 13.38], [13.56, 15.2]], ALG.hi) +
      RR(15.43, 1.1, 0.63, 1.72, 0.14, "none", 0.4) + RR(9.99, 1.2, 0.62, 0.12, 0.02, "#2b2f34"),
    extra: () => door(7.74, 1.05, 0.42, 2.84, { leaves: 1, fill: RHB.door, win: [0.45, 0.88], winW: 0.42 }) + R(7.78, 0.3, 0.97, 0.12, "#3a3f45") +
      Ln(1.76, ALG.sill + 0.1, 1.76, ALG.roof - 0.1, "rgba(0,0,0,0.35)", 0.5) + R(1.85, 0.5, 0.77, 2.4, "none", 0.5) + RR(1.99, 1.6, 0.45, 1.2, 0.08, GLASS) +
      Ln(1.9, 0.9, 1.9, 2.7, "#e8eaec", 0.9) + Ln(2.57, 0.9, 2.57, 2.7, "#e8eaec", 0.9) +
      lamp(0.42, 1.1, 0.12, 0.12) + lamp(0.45, 0.92, 0.1, 0.08, "#ff5a4a") + autoCoupler(0.0, 0.62, 0.62) +
      roofBox(3.95, 0.86, ALG.roof, 0.14, "#9aa2a9") + roofBox(5.81, 1.2, ALG.roof, 0.14, "#9aa2a9") + roofBox(7.77, 1.78, ALG.roof, 0.12) + roofBox(11.1, 1.55, ALG.roof, 0.14, "#6d757c") + roofBox(13.95, 1.0, ALG.roof, 0.14, "#9aa2a9") +
      panto(3.35, ALG.roof + 0.05, bernina(c) && !c.lead, 1) +
      T(c, 7.4, 2.6, 0.42, "1", "#ffffff") + T(c, 9.15, 2.6, 0.42, "2", "#ffffff") + rhbMark(c, 10.1, 1.32, 0.24, "Ferrovia retica"),
  });
}
function algMid(c) {
  const L = c.L / F;
  return body(c, {
    roof: ALG.roof, sill: ALG.sill, base: RHB.red, endInset: 0.4, dia: [0.6, 3.25],
    under: () => bogie(2.68, 1.8, 685, 0.5) + bogie(13.45, 1.8, 685, 0.5) + R(4.3, 0.28, 2.0, 0.25, "currentColor", 0, 'opacity="0.8"'),
    paint: () => algPaint(L) + band([[0.85, 2.45], [2.68, 4.27], [4.45, 6.05, true], [6.28, 7.87]], ALG.hi, ALG.lo) + band([[11.88, 13.47], [13.7, 15.3]], ALG.hi),
    extra: () => door(8.79, 1.4, 0.36, 2.84, { fill: RHB.door, win: [0.3, 0.88], winW: 0.38 }) + R(8.84, 0.26, 1.3, 0.1, "#3a3f45") +
      roofBox(4.2, 3.2, ALG.roof, 0.14, "#9aa2a9") + roofBox(9.1, 1.5, ALG.roof, 0.12) + panto(13.45, ALG.roof + 0.05, !bernina(c), -1) +
      T(c, 8.45, 2.6, 0.42, "2", "#ffffff") + T(c, 10.55, 2.6, 0.42, "2", "#ffffff") + rhbMark(c, 1.0, 1.32, 0.24, "Viafier retica"),
  });
}

// ---------- Alvra (the Albula articulated sets, AGZ 5701-5706) ----------
// Stadler, 2015-2017 (six sets) with the control cars At 57801-57806
// (2016-2017): six coaches short-coupled for good, Bi 576 (low-floor, its
// panorama photo compartment at the locomotive end), B 574, B 573, B 577
// (the family car), AB 572 and A 570, 112.39 m over the buffers, each body
// 17.8 m, 2.67 m wide, 3.735 m high, on 685 mm wheels (Stadler data sheets
// WRhB1212d and SWRhBAlbAit0217d, their side elevations measured here).
// Photographs at St. Moritz, Landquart and near Filisur (2017-2023): RhB
// red, the light gray roof, a silver line at floor height, the windows in
// black frames, the doors silver-gray; the destination display under the
// windows by a door; first class's yellow line over its windows (the At,
// the A, and the AB's five windows next to the A), "1" or "2" by the
// doors; the RhB mark and a name on each coach (which name on the Bi, the
// B 574 and B 573 and the AB is not seen in a photograph: drawn in turn).
// The family car B 577 carries a skier in white line drawing between its
// toilet window and the windows. A Ge 4/4 III pulls toward the Engadin and
// pushes back to Chur.
const ALV = { roof: 3.65, eave: 2.97, sill: 0.33, stripe: 0.95, hi: [1.62, 2.69], lo: [1.11, 2.69] };
const alvPaint = (L, yellow = []) => bands(L, [[ALV.eave, 2, RHB.roof], [ALV.stripe, 0.08, RHB.silver], [0, ALV.sill + 0.12, RHB.skirt]]) +
  yellow.map(([a, b]) => R(a, ALV.hi[1] + 0.09, b - a, 0.08, RHB.yellow)).join("");
const alvDoor = (x, w = 1.47) => door(x, w, 0.4, 2.83, { fill: RHB.door, win: [0.15, 0.78], winW: 0.36 }) + R(x + 0.05, 0.28, w - 0.1, 0.12, "#3a3f45");
// The destination display: black, its text amber.
const alvDisplay = (x, w = 1.28, y = 0.97) => RR(x, y, w, 0.36, 0.03, "#16181b", 0.4) + R(x + 0.12, y + 0.13, w - 0.24, 0.09, "#e8a23a", 0, 'opacity="0.75"');
const alvRoof = (a, b) => R(a, ALV.roof - 0.02, b - a, 0.09, "#b5bcc2", 0.4);
// A coupled end of a set: the central buffer and screw coupling.
const cbc = (x, side, y = 0.66) => {
  const a = side < 0 ? x : x - 0.42;
  return R(a, y - 0.16, 0.42, 0.32, "currentColor", 0, 'opacity="0.85"') + RR(side < 0 ? x : x - 0.08, y - 0.24, 0.08, 0.48, 0.02, C.steelDark, 0.4) +
    path(`M${n(ft(x - side * 0.3))} ${n(ft(y - 0.15))}Q${n(ft(x - side * 0.15))} ${n(ft(y - 0.45))} ${n(ft(x - side * 0.04))} ${n(ft(y - 0.32))}`, "none", 0, 'stroke="#2a2d31" stroke-width="0.9" vector-effect="non-scaling-stroke"');
};
// The skier on the family car, in white lines (from the photograph): a
// long ski from over his head to his feet, the other across under him, a
// pole held out behind; 1.8 m wide, 2.1 m tall, from x, its middle at y.
const SKIER = "M0.78 0L0.66 2.1M0.42 1.42L1.02 1.78M0.0 1.08L0.5 1.03M0.04 1.0L0.04 1.16" +
  "M0.48 0.42Q0.62 0.3 0.7 0.42Q0.74 0.56 0.62 0.64Q0.5 0.7 0.44 0.6Q0.4 0.5 0.48 0.42Z M0.46 0.5L0.68 0.47" +
  "M0.46 0.66Q0.3 0.8 0.32 0.98Q0.36 1.1 0.5 1.12L0.72 1.2Q0.8 1.32 0.68 1.48M0.6 0.66Q0.72 0.6 0.76 0.44M0.5 1.12Q0.4 1.05 0.5 1.03L0.62 0.96Q0.66 0.86 0.6 0.78" +
  "M0.68 1.48L0.8 1.56M0.4 0.96L0.62 1.3L0.86 1.42";
const skier = (c, x, y) => M(c, x + 0.9, y, `<g transform="scale(1.5 1) translate(-0.6 -1.05)"><path d="${SKIER}" fill="none" stroke="#ffffff" stroke-width="0.03" stroke-linecap="round" stroke-linejoin="round"/></g>`);
// Frosted glass (a toilet's window).
const frosted = (a, b, y0, y1) => RR(a - 0.06, y0 - 0.06, b - a + 0.12, y1 - y0 + 0.12, 0.14, GASKET) + RR(a, y0, b - a, y1 - y0, 0.1, "#b7c2bf");
// Graubünden's brand, small and gray, on RhB's newer cars.
const gr = (c, x, y) => T(c, x, y, 0.07, "graubünden", "#c9cfd3", { weight: 500 });
function alvCar(c, o) {
  const L = c.L / F;
  return body(c, {
    roof: ALV.roof, sill: ALV.sill, base: RHB.red, endInset: o.endInset ?? 0.38, endR: 0.3, dia: [0.6, 2.95],
    under: () => o.bogies.map(([x, d = 685, wb = 1.8]) => bogie(x, wb, d, 0.5)).join("") + (o.under || ""),
    paint: () => alvPaint(L, o.yellow) + o.windows.map((b) => band(b, ALV.hi, ALV.lo)).join("") + (o.paint || ""),
    extra: () => o.doors.map((x) => alvDoor(x)).join("") + (o.extra ? o.extra(c, L) : "") + (o.coupler === "L" ? cbc(0, -1) : o.coupler === "R" ? cbc(L, 1) : ""),
  });
}
const alvBi = (c) => alvCar(c, { coupler: "L", endInset: 0.62, bogies: [[3.2], [16.1]],
  windows: [[[1.19, 2.21, true]], [[2.57, 3.6, true]], [[3.95, 5.02, true]], [[8.44, 9.82, true], [10.2, 11.6, true], [11.96, 13.38, true], [13.72, 15.42], [15.81, 17.59]]],
  doors: [6.37],
  paint: [[1.19, 2.21], [2.57, 3.6], [3.95, 5.02]].map(([a, b]) => RR(a, 3.12, b - a, 0.36, 0.08, GLASS, 0, 'opacity="0.9"')).join("") + alvDisplay(8.5, 1.28, 0.95),
  extra: (cc, L) => alvRoof(6.3, 8.5) + T(cc, 6.05, 2.55, 0.4, "2", "#ffffff") + T(cc, 8.15, 2.55, 0.4, "2", "#ffffff") + rhbMark(cc, 13.8, 1.3, 0.24, "Rhätische Bahn") });
const alvB = (c) => alvCar(c, { bogies: [[2.9], [15.7]],
  windows: [[[1.0, 2.4], [2.8, 4.3]], [[7.36, 8.86], [9.1, 10.6], [10.94, 12.38], [12.74, 14.2], [14.6, 16.0], [16.4, 17.84]]],
  doors: [5.25], paint: alvDisplay(7.47, 1.28),
  extra: (cc, L) => alvRoof(5.0, 7.2) + T(cc, 4.95, 2.55, 0.4, "2", "#ffffff") + T(cc, 7.04, 2.55, 0.4, "2", "#ffffff") + rhbMark(cc, 9.2, 1.3, 0.24, cc.index % 2 ? "Viafier retica" : "Ferrovia retica") });
const alvB577 = (c) => alvCar(c, { bogies: [[3.28], [16.1]],
  windows: [[[3.37, 4.75], [5.1, 6.47], [6.84, 8.22], [8.57, 9.94], [10.29, 11.71]], [[14.84, 16.25], [16.6, 18.08]]],
  doors: [12.3], paint: frosted(1.35, 2.05, 1.72, 2.69) + alvDisplay(10.33, 1.28),
  extra: (cc, L) => alvRoof(12.0, 14.2) + skier(cc, 1.65, 1.85) + gr(cc, 10.97, 0.86) + T(cc, 11.98, 2.55, 0.4, "2", "#ffffff") + T(cc, 14.1, 2.55, 0.4, "2", "#ffffff") + rhbMark(cc, 14.75, 1.3, 0.24, "Rhätische Bahn") });
const alvAB = (c) => alvCar(c, { bogies: [[2.95], [15.75]], yellow: [[7.75, 17.53]],
  windows: [[[0.97, 2.52], [2.97, 4.64]], [[7.81, 9.54], [9.64, 11.3], [11.66, 13.36], [13.7, 15.42], [15.77, 17.47]]],
  doors: [5.72], paint: alvDisplay(7.95, 1.28),
  extra: (cc, L) => alvRoof(5.5, 7.6) + T(cc, 5.4, 2.55, 0.4, "2", "#ffffff") + T(cc, 7.5, 2.55, 0.4, "1", "#ffffff") + rhbMark(cc, 1.0, 1.3, 0.24, "Ferrovia retica") });
const alvA = (c) => alvCar(c, { coupler: "R", endInset: 0.62, bogies: [[3.0], [15.74]], yellow: [[3.05, 10.97], [13.93, 17.77]],
  windows: [[[1.27, 1.67]], [[3.11, 4.78], [5.16, 6.82], [7.19, 8.89], [9.22, 10.91]], [[13.99, 15.69], [16.02, 17.71]]],
  doors: [11.45], paint: alvDisplay(9.4, 1.28),
  extra: (cc, L) => alvRoof(11.2, 13.4) + T(cc, 11.15, 2.55, 0.4, "1", "#ffffff") + T(cc, 13.25, 2.55, 0.4, "1", "#ffffff") + rhbMark(cc, 14.2, 1.3, 0.24, "Viafier retica") });
// The control car At 578 (and the Bt 528 for the Arosa line, the same body
// with second class): 18.87 m over the couplers, its leading bogie 810 mm
// wheels on 2.0 m, the rear one 685 mm; the cab a smaller Allegra nose.
const NOSE_AT = [[0.62, 0.36], [0.75, 0.81], [0.8, 1.16], [0.89, 1.66], [1.1, 2.29], ["q", 1.25, 2.62, 1.45, 2.89], ["q", 1.65, 3.15, 1.81, 3.35], ["q", 1.95, 3.5, 2.05, 3.56], ["q", 2.2, 3.65, 2.37, 3.65]];
function stwCar(c, first) {
  const L = c.L / F, k = first ? "1" : "2";
  return body(c, {
    roof: ALV.roof, sill: ALV.sill, nose: NOSE_AT, base: RHB.red, endInset: 0.49, endR: 0.3, dia: [0.6, 2.95],
    under: () => bogie(3.4, 2.0, 810, 0.5) + bogie(15.93, 1.8, 685, 0.5) + P([[0.35, 0.12], [0.95, 0.12], [1.2, 0.5], [0.7, 0.5]], RHB.skirt),
    paint: () => alvPaint(L, first ? [[3.52, 7.35], [11.69, 17.49]] : []) +
      P([[0.85, 1.55], [1.12, 2.35], ["q", 1.3, 2.75, 1.55, 3.0], [2.0, 3.0], [2.0, 1.55]], RHB.dark) + P([[1.15, 1.6], [1.38, 2.3], ["q", 1.5, 2.62, 1.62, 2.75], [1.95, 2.75], [1.95, 1.6]], GLASS) +
      band([[3.58, 5.28], [5.6, 7.29]], ALV.hi) + band([[10.05, 11.33, true]], ALV.hi, [1.05, 2.69]) + band([[11.75, 13.14, true], [13.73, 15.42], [15.75, 17.43]], ALV.hi, ALV.lo) +
      RR(17.62, 1.1, 0.5, 1.45, 0.14, "none", 0.4),
    extra: () => alvDoor(7.96) + gr(c, 10.7, 0.86) + Ln(2.05, ALV.sill + 0.1, 2.05, ALV.roof - 0.1, "rgba(0,0,0,0.35)", 0.5) + R(2.12, 0.55, 0.8, 2.3, "none", 0.5) + RR(2.21, 1.57, 0.6, 1.16, 0.08, GLASS) +
      Ln(2.16, 0.9, 2.16, 2.65, "#e8eaec", 0.9) + Ln(2.88, 0.9, 2.88, 2.65, "#e8eaec", 0.9) + lamp(0.78, 1.22, 0.12, 0.14) + lamp(0.82, 1.02, 0.1, 0.08, "#ff5a4a") + autoCoupler(0.0, 0.7, 0.67) +
      roofBox(2.97, 1.87, ALV.roof, 0.1) + T(c, 7.68, 2.55, 0.4, k, "#ffffff") + T(c, 9.75, 2.55, 0.4, k, "#ffffff") +
      [1.35, 1.75].map((y) => RR(11.42, y, 0.22, 0.22, 0.02, "none", 0, 'stroke="#ffffff" stroke-width="0.6" vector-effect="non-scaling-stroke"')).join("") +
      rhbMark(c, 3.65, 1.3, 0.24, "Rhätische Bahn"),
  });
}

// ---------- RhB's standard coaches (Einheitswagen) and control cars ----------
// FFA's and SWA's Einheitswagen I-IV (1962-1993), still on the Bernina
// line's regional trains, the Arosa line's and as extra coaches: steel
// bodies with a door at each end (a two-leaf folding door, silver), big
// drop windows between; the long ones (EW I/II, 18.4-18.5 m over the
// buffers) with nine windows in second class, seven in first, the short
// Bernina ones (EW III, 1.40 m windows, about 16.5 m) seven. Photographs at
// Chur and Tirano (2024): RhB red, a silver line under the windows that
// runs on in red across the doors, a light gray roof, first class's yellow
// line along the top of the side and a "1" by the doors, the RhB mark and a
// name under the windows. (The baggage half of a BD: a sliding door and a
// small window; drawn from photographs of BD 2471-2475, approximately.)
const EW = { roof: 3.48, sill: 0.82, win: [1.85, 2.88], stripe: [1.55, 0.2] };
function ewCoach(c, { len, first = false, bd = false, wins }) {
  const L = c.L / F, red = RHB.red, d0 = 0.95, d1 = L - 1.9;
  const a = d0 + 1.35, b = (bd ? L * 0.55 : d1) - 0.35;
  const k = wins, w = first ? 1.45 : 1.25, pitch = (b - a - w) / (k - 1);
  let panes = seq(a, pitch, k).map((x) => [x, x + w]);
  return body(c, {
    roof: EW.roof, sill: EW.sill, base: red, endInset: 0.35, endR: 0.32, dia: [1.05, 3.15],
    under: () => bogie(2.75, 1.8, 750, EW.sill) + bogie(L - 2.75, 1.8, 750, EW.sill) + R(6.0, 0.48, L - 12, 0.34, "currentColor", 0, 'opacity="0.78"'),
    paint: () => bands(L, [[3.0, 1, "#c3c9cf"], [EW.stripe[0], EW.stripe[1], "#d3d7da"], [0, EW.sill + 0.1, RHB.skirt]]) +
      (first ? R(-0.5, 2.98, L + 1, 0.07, RHB.yellow) : "") +
      panes.map(([x0, x1]) => RR(x0 - 0.05, EW.win[0] - 0.05, x1 - x0 + 0.1, EW.win[1] - EW.win[0] + 0.1, 0.1, GASKET) + pane(x0, EW.win[0], x1 - x0, EW.win[1] - EW.win[0], 0.06) +
        R(x0 + 0.05, EW.win[0] + 0.62, x1 - x0 - 0.1, 0.05, GASKET)).join("") +
      (bd ? R(L * 0.62, 0.95, 1.5, 2.1, "none", 0.5) + RR(L * 0.62 + 2.4, 2.15, 0.6, 0.55, 0.05, GASKET) : "") +
      RR(L - 1.62, 2.1, 0.32, 0.65, 0.05, "#9aa3a6"),
    extra: (cc) => [d0, d1].map((x) => door(x, 0.95, 0.9, 3.0, { fill: "#d6dadd", win: [0.38, 0.9], winW: 0.2 }) + R(x, EW.stripe[0], 0.95, EW.stripe[1], red)).join("") +
      roofBox(L / 2 - 1.0, 2.0, EW.roof, 0.12) + T(cc, d0 + 1.15, 2.62, 0.38, first ? "1" : "2", "#ffffff", { weight: 600 }) + T(cc, d1 - 0.22, 2.62, 0.38, first ? "1" : "2", "#ffffff", { weight: 600 }) +
      rhbMark(cc, L * 0.36, 1.32, 0.2, cc.index % 3 === 0 ? "Rhätische Bahn" : cc.index % 3 === 1 ? "Viafier retica" : "Ferrovia retica") + gr(cc, L * 0.5, 1.75),
  });
}
// BDt 1751-1752 (Stadler 1999): the control car of the Ge 4/4 II push-pull
// trains (Engadin, Alvaneu-Filisur), 18.8 m, a flat cab with two
// windscreens, a baggage and bike section behind it, a low-floor door in
// the middle (photograph of 1755 at Chur, 2015, the same body; the
// remaining two now carry ZSI 127). RhB red, the silver line, gray roof.
// BD 564 01-06: six of them rebuilt in 2024 as bike and baggage cars for
// the Alvra trains (Haribu, 2026), their cab given up; drawn as the BDt
// with a plain end there (the rebuilt end not seen in a photograph).
function bdtCar(c, cab = true) {
  const L = c.L / F, red = RHB.red;
  const NOSE = [[0.3, 0.42], [0.25, 1.4], [0.3, 2.95], ["q", 0.35, 3.35, 0.7, 3.5], [1.6, 3.55]];
  return body(c, {
    roof: 3.55, sill: 0.42, nose: cab ? NOSE : null, base: red, endInset: 0.35, endR: 0.3, dia: [0.9, 3.15],
    under: () => bogie(3.0, 1.8, 750, 0.6) + bogie(L - 2.9, 1.8, 750, 0.6) + R(0.25, 0.15, 1.4, 0.3, "#3a3f45"),
    paint: () => bands(L, [[3.08, 1, "#c3c9cf"], [1.12, 0.15, "#d3d7da"], [0, 0.55, RHB.skirt]]) +
      (cab ? RR(1.05, 1.75, 1.1, 1.05, 0.08, GASKET) + RR(1.1, 1.8, 1.0, 0.95, 0.06, GLASS) : "") + RR(3.0, 1.75, 1.2, 1.05, 0.08, GASKET) + pane(3.05, 1.8, 1.1, 0.95) +
      [[7.4, 8.55, 1.25], [8.75, 9.9, 1.25], [10.1, 11.25, 1.25], [11.55, 12.7, 1.6], [12.9, 14.05, 1.6], [14.25, 15.4, 1.6], [15.6, 16.75, 1.6]].map(([a, b, y]) => RR(a, y, b - a, 2.85 - y, 0.08, GASKET) + pane(a + 0.05, y + 0.05, b - a - 0.1, 2.75 - y, 0.05)).join(""),
    extra: (cc) => door(5.75, 1.3, 0.48, 2.95, { fill: "#d6dadd", win: [0.3, 0.88], winW: 0.25 }) +
      (cab ? lamp(0.24, 1.0, 0.14, 0.14) + lamp(0.28, 0.82, 0.1, 0.08, "#ff5a4a") + cbc(0, -1) + RR(0.5, 3.0, 0.5, 0.25, 0.04, "#16181b") : "") +
      T(cc, 7.15, 2.55, 0.36, "2", "#ffffff", { weight: 600 }) + rhbMark(cc, 7.6, 0.92, 0.2, "Rhätische Bahn") + roofBox(8.0, 2.0, 3.55, 0.12),
  });
}

// ---------- Panorama coaches: Glacier Express and Bernina Express ----------
// The emblem of both trains: a golden edelweiss star with the Swiss cross
// in a red disc at its heart, r its radius (m).
function edelweiss(c, x, y, r) {
  const pts = [];
  for (let k = 0; k < 16; k++) { const a = (Math.PI * k) / 8 - Math.PI / 2, rr = k % 2 ? r * 0.42 : r; pts.push(`${n(Math.cos(a) * rr)} ${n(Math.sin(a) * rr)}`); }
  return M(c, x, y, `<path d="M${pts.join("L")}Z" fill="#f2b51c"/><circle r="${n(r * 0.36)}" fill="#e3001b"/>` +
    `<path d="M${n(-r * 0.07)} ${n(-r * 0.24)}h${n(r * 0.14)}v${n(r * 0.17)}h${n(r * 0.17)}v${n(r * 0.14)}h${n(-r * 0.17)}v${n(r * 0.17)}h${n(-r * 0.14)}v${n(-r * 0.17)}h${n(-r * 0.17)}v${n(-r * 0.14)}h${n(r * 0.17)}Z" fill="#ffffff"/>`);
}

// Glacier Express panorama coaches (Stadler, 2006-2011; RhB and MGB own
// them jointly run): 18.5 m over the buffers, 17.7 m bodies, 3.695 m high,
// 12.83 m between the bogie pivots, 685 mm wheels, a cogwheel brake for the
// rack (Stadler data sheet WGEX0123d, its side elevations measured here):
// six panorama windows each side with the roof glazed over them, a door at
// one end, the toilet's window at the other (the Api's accessible toilet
// has none). Photographs at Brig (2021), Andermatt (2026) and Disentis
// (2021): the body pale glacier blue over a red skirt, the ends red, each
// end carrying a piece of a big white Swiss cross, slanting forward; the
// class's numeral on the red by the door; the Excellence Class car (Aps
// 1321, 4046) a gold band along the red's slanted edge and "EXCELLENCE
// CLASS" small in gold; the kitchen car WRp red all over with "GLACIER
// EXPRESS" and the edelweiss. A train: Ap, Api, WRp, Bp, Bp, Bp (the
// Excellence car added at one end).
const GX = { roof: 3.64, sill: 0.6, blue: "#b9d7e4", gold: "#c39a4a", lo: [1.6, 2.91], up: [3.03, 3.55], skirt: 0.98 };
const GX_PANES = [[2.72, 4.65], [4.73, 6.67], [6.75, 8.68], [8.76, 10.7], [10.78, 12.71], [12.79, 14.73]];
// A white cross's vertical arm leaning forward, xc its middle at the
// floor, w wide; and its horizontal arm from a to b.
const gxArm = (xc, w = 1.1) => P([[xc - w / 2, 0], [xc + w / 2, 0], [xc + w / 2 + 0.55, 4.2], [xc - w / 2 + 0.55, 4.2]], "#ffffff");
const gxBar = (a, b) => P([[a, 1.9], [b, 1.9], [b + 0.12, 2.48], [a + 0.12, 2.48]], "#ffffff");
function gexCar(c, kind) {
  const L = c.L / F, red = RHB.red, wr = kind === "WRp";
  const doorX = 16.63;
  return body(c, {
    roof: GX.roof, sill: GX.sill, base: wr ? red : GX.blue, endInset: 0.42, endR: 0.4, dia: [0.95, 3.2],
    under: () => bogie(2.835, 1.8, 685, 0.62) + bogie(15.665, 1.8, 685, 0.62) + R(5.0, 0.4, 2.0, 0.25, "currentColor", 0, 'opacity="0.8"') + R(11.5, 0.4, 1.6, 0.25, "currentColor", 0, 'opacity="0.8"'),
    paint: () => {
      let s = R(-0.5, GX.up[0] - 0.08, L + 1, 2, wr ? red : "#c3c9cf") + R(-0.5, 0, L + 1, GX.skirt, red);
      if (!wr) {
        // The red ends, their edges slanting, and the white cross.
        s += P([[-0.5, 0], [1.95, 0], [2.45, GX.up[0] - 0.08], [-0.5, GX.up[0] - 0.08]], red) + P([[15.8, 0], [L + 0.5, 0], [L + 0.5, GX.up[0] - 0.08], [15.0, GX.up[0] - 0.08]], red);
        if (kind === "Aps") s += P([[15.62, 0], [15.8, 0], [15.0, GX.up[0] - 0.08], [14.82, GX.up[0] - 0.08]], GX.gold) + P([[2.13, 0], [1.95, 0], [2.45, GX.up[0] - 0.08], [2.63, GX.up[0] - 0.08]], GX.gold);
        s += gxArm(16.85, 1.05) + gxBar(15.35, 18.6) + P([[0.2, 1.9], [0.62, 1.9], [0.74, 2.48], [0.32, 2.48]], "#ffffff");
        s += GX_PANES.map(([a, b]) => RR(a - 0.05, GX.lo[0] - 0.05, b - a + 0.1, GX.lo[1] - GX.lo[0] + 0.1, 0.12, GASKET) + pane(a, GX.lo[0], b - a, GX.lo[1] - GX.lo[0], 0.08) +
          R(a, GX.up[0], b - a, GX.up[1] - GX.up[0], "#5f7682") + R(a, GX.up[0] + 0.28, b - a, 0.2, "#8ea6b2", 0, 'opacity="0.7"')).join("") +
          Ln(2.6, GX.up[0] - 0.04, 14.85, GX.up[0] - 0.04, GASKET, 0.6);
        if (kind === "Ap" || kind === "Bp") s += frosted(1.11, 1.88, 1.85, 2.85);
        s += alvDisplay(14.85, 0.75, 1.25);
      } else {
        // The kitchen car (drawn as at Brig, its kitchen at the left): the
        // cross at each end, two kitchen windows, the dining end's two
        // panorama windows with their roof glazing.
        s += gxArm(0.55, 0.85) + gxBar(-0.3, 1.0) + gxBar(16.9, 18.6) + gxArm(17.6, 0.6);
        s += RR(1.25, 2.1, 0.95, 0.85, 0.06, GASKET) + RR(1.3, 2.15, 0.85, 0.75, 0.05, "#9aa3a6") +
          [[4.1, 6.15], [7.05, 9.1]].map(([a, b]) => RR(a, 2.2, b - a, 0.7, 0.06, GASKET) + pane(a + 0.05, 2.25, b - a - 0.1, 0.6, 0.04)).join("") +
          [[12.4, 14.5], [14.58, 16.7]].map(([a, b]) => RR(a, GX.lo[0], b - a, GX.lo[1] - GX.lo[0], 0.08, GASKET) + pane(a + 0.06, GX.lo[0] + 0.06, b - a - 0.12, GX.lo[1] - GX.lo[0] - 0.12, 0.06) +
            R(a, GX.up[0], b - a, GX.up[1] - GX.up[0], "#5f7682")).join("") + R(10.7, 0.75, 0.92, 2.35, "none", 0.5);
      }
      return s;
    },
    extra: (cc) => {
      if (wr) return T(cc, 7.5, 1.74, 0.64, "GLACIER", "#ffffff", { weight: 800, italic: true }) + T(cc, 8.65, 1.12, 0.5, "EXPRESS", "#ffffff", { weight: 400, italic: true }) +
        edelweiss(cc, 9.95, 1.9, 0.5) + roofBox(4.0, 5.0, GX.roof, 0.18);
      const k = kind === "Bp" ? "2" : "1";
      let s = door(doorX, 1.04, 0.62, 3.0, { leaves: 1, fill: "rgba(0,0,0,0.03)", win: [0.45, 0.82], winW: 0.58 }) + T(cc, 15.3, 2.62, 0.38, k, "#ffffff", { weight: 500 }) +
        roofBox(0.9, 1.5, GX.roof, 0.14) + roofBox(L - 2.6, 1.6, GX.roof, 0.14);
      if (kind === "Aps") s += T(cc, 14.15, 2.62, 0.13, "EXCELLENCE", GX.gold, { weight: 500, family: SANS }) + T(cc, 14.0, 2.42, 0.13, "CLASS", GX.gold, { weight: 500, family: SANS });
      return s;
    },
  });
}

// Bernina Express panorama coaches (Stadler, 2000 and 2006-2007): 16.45 m
// over the couplers, 2.65 m wide, 3.54 m high, 685 mm wheels (Stadler data
// sheet TMRHBBE0123d, its side elevations measured here): the windows run
// up into the roof; a door at one end, the toilet's window at the other.
// Photographs of Ap 1306 at Ospizio Bernina and of the coaches at Tirano
// and Alp Grüm (2021-2024): RhB red, a silver band at the windows' foot,
// first class's yellow line along the top of the end sections, the
// edelweiss and "Bernina Express" in white along the lower side, the RhB
// mark with "Viafier retica" small on the band by the door. (Ap 1306 has
// six panorama windows; the data sheet's first-class car five.)
const BX = { roof: 3.54, sill: 0.6, win: [1.68, 3.43], belt: [1.5, 1.66] };
function bexCar(c, first) {
  const L = c.L / F, red = RHB.red;
  const panes = first ? seq(2.15, 1.72, 6).map((a) => [a, a + 1.5]) : [[2.33, 3.8], [4.11, 5.58], [5.89, 7.36], [7.68, 9.14], [9.465, 10.93], [11.25, 12.71], [13.03, 14.5]];
  const doorX = first ? 14.66 : 14.76;
  return body(c, {
    roof: BX.roof, sill: BX.sill, base: red, endInset: 0.42, endR: 0.35, dia: [1.0, 3.15],
    under: () => bogie(2.87, 1.8, 685, 0.65) + bogie(13.58, 1.8, 685, 0.65) + R(5.0, 0.42, 2.4, 0.22, "currentColor", 0, 'opacity="0.8"'),
    paint: () => bands(L, [[3.44, 1, "#c3c9cf"], [BX.belt[0], BX.belt[1] - BX.belt[0], "#c5cacd"], [0, 0.72, "#a81b1a"]]) +
      (first ? R(0.45, 3.32, 1.8, 0.1, RHB.yellow) + R(12.4, 3.32, 3.6, 0.1, RHB.yellow) : "") +
      panes.map(([a, b]) => `<path d="M${n(ft(a))} ${n(ft(BX.win[0]))}h${n(ft(b - a))}v${n(ft(1.3))}q0 ${n(ft(0.45))} ${n(ft(-0.4))} ${n(ft(0.45))}h${n(ft(-(b - a - 0.8)))}q${n(ft(-0.4))} 0 ${n(ft(-0.4))} ${n(ft(-0.45))}z" fill="${GASKET}"/>` +
        RR(a + 0.05, BX.win[0] + 0.05, b - a - 0.1, BX.win[1] - BX.win[0] - 0.1, 0.32, GLASS) + R(a + 0.08, 2.75, b - a - 0.16, 0.5, GLASS_HI, 0, 'opacity="0.6"')).join("") +
      frosted(1.08, 1.77, 1.88, 2.75) + alvDisplay(first ? 11.2 : 11.6, 0.85, 1.12),
    extra: (cc) => door(doorX, 1.08, 0.66, 3.05, { leaves: 1, fill: "#d9dde0", win: [0.42, 0.88], winW: 0.56 }) + roofBox(6.1, 4.6, BX.roof, 0.2) +
      T(cc, first ? 12.6 : 12.87, 2.6, 0.4, first ? "1" : "2", "#ffffff", { weight: 500 }) +
      edelweiss(cc, 4.4, 1.14, 0.24) + R(4.82, 0.9, 0.03, 0.5, "#ffffff") + T(cc, 4.98, 1.15, 0.46, "Bernina Express", "#ffffff", { weight: 500, anchor: "start" }) +
      M(cc, doorX + 0.54, BX.belt[0] + 0.08, `<g transform="translate(-0.5 -0.05)">${rhbLogo(0.1, red)}<text x="0.5" y="0.1" font-size="0.12" font-weight="700" font-family="${COND}" fill="${red}">Viafier retica</text></g>`) +
      gr(cc, 1.9, 1.58),
  });
}

// ---------- Locomotives ----------
// UIC-style side buffers are not used on the RhB: a central buffer with
// screw couplings either side of it (cbc above), at about 0.66 m.
// A locomotive's cab front details: lamps low on the nose, the tail lamp,
// the central buffer coupling, the plough.
const locoFront = (x, sill, lampY) => lamp(x + 0.02, lampY, 0.14, 0.14) + lamp(x + 0.04, lampY - 0.22, 0.1, 0.09, "#ff5a4a") + cbc(x - 0.02 > 0 ? 0 : 0, -1) +
  P([[x + 0.05, 0.12], [x + 0.75, 0.12], [x + 0.95, sill], [x + 0.05, sill]], "#2f3439");
// A double-ended locomotive drawn whole: o.half(c, L) draws what is the same
// at both ends (mirrored), o.side(c, L) the side as seen (doors and windows
// that aren't symmetric, lettering).
function loco(c, o) {
  const L = c.L / F, id = newId();
  const half = o.half({ ...c, coupledL: false, coupledR: false }, L);
  let s = `<clipPath id="${id}"><rect x="-5" y="-5" width="${n(ft(L / 2) + 5.2)}" height="40"/></clipPath>` +
    `<g clip-path="url(#${id})">${half}</g><g transform="matrix(-1 0 0 1 ${n(ft(L))} 0)"><g clip-path="url(#${id})">${half}</g></g>`;
  return s + o.side(c, L);
}

// Ge 4/4 III (641-653): SLM and ABB, 1993-1994 (12; 653 the former MOB
// 8003, in service May 2026): 16.0 m over the buffers, 2.8 m wide, 3.86 m
// high, Bo'Bo' on 1,070 mm wheels, 2,400 kW; the Re 460's electronics, a
// raked windscreen, the upper side and roof gray with two rows of four
// grilles, a pantograph at each end. The cab door on each side at one end
// only (behind the cab side window; the other cab only its window).
// Photographs of 641 near Maienfeld (2023) and 643 at St. Moritz (2024):
// the red "new design" (642, 643, 647, 650, 651, 653): RhB red up to the
// grilles, a silver line at floor height, dark gray below; the RhB mark and
// "Rhätische Bahn" big along the side, "Ferrovia retica  Viafier retica"
// under it. (The others carry advertising; drawn in the red. Each loco's
// coat of arms, name and number are left out. The bogie centres are
// measured from a photograph.)
const G3 = { roof: 3.75, eave: 3.15, sill: 0.54, stripe: 1.1 };
const NOSE_G3 = [[0.25, 0.54], [0.22, 1.2], [0.3, 2.44], [0.89, 3.22], ["q", 1.08, 3.52, 1.43, 3.73], ["q", 1.6, 3.75, 1.8, 3.75]];
function ge44iii(c) {
  const red = RHB.red;
  return loco(c, {
    half: (cc, L) => {
      const h = body({ ...cc, coupledL: false, coupledR: false }, { roof: G3.roof, sill: G3.sill, nose: NOSE_G3, base: red, endInset: 0.25,
        under: () => bogie(3.05, 2.6, 1070, G3.sill + 0.05, "loco") + R(5.5, 0.35, 2.6, 0.25, "currentColor", 0, 'opacity="0.85"'),
        paint: () => bands(L, [[G3.eave, 2, "#c4cad0"], [0, G3.stripe, "#4b5259"], [G3.stripe, 0.07, RHB.silver]]) +
          P([[0.35, 2.3], [0.92, 3.12], [1.6, 3.12], [1.6, 2.3]], RHB.dark) +
          [2.36, 3.79, 5.21, 6.64].map((x) => RR(x, G3.eave + 0.05, 1.35, 0.38, 0.03, "#2e3338") + slats(ft(x + 0.1), ft(G3.eave + 0.09), ft(1.15), ft(0.3), 0.35, "rgba(255,255,255,0.12)")).join("") +
          RR(0.95, 2.05, 1.12, 0.87, 0.08, GASKET) + RR(1.0, 2.1, 1.02, 0.77, 0.06, GLASS) + Ln(1.5, 2.1, 1.5, 2.87, GASKET, 0.6),
        extra: () => locoFront(0.24, G3.sill, 1.0) + RR(0.82, 2.35, 0.2, 0.32, 0.06, red, 0.4) + Ln(1.0, 3.75, 7.9, 3.75, "#a9b0b8", 0.6) },
      );
      return h;
    },
    side: (cc, L) => {
      // The cab door at the left end; both pantographs, the rear one up.
      let s = R(2.56, 1.2, 0.62, 1.68, "none", 0.5) + RR(2.62, 1.75, 0.5, 1.05, 0.06, GLASS) + Ln(2.48, 1.3, 2.48, 2.7, "#e8eaec", 0.9) + Ln(3.26, 1.3, 3.26, 2.7, "#e8eaec", 0.9);
      s += panto(3.85, G3.roof, false, 1) + panto(L - 3.85, G3.roof, c.wires !== false, -1) + roofBox(L / 2 - 1.4, 2.8, G3.roof, 0.12, "#9aa2a9");
      s += M(cc, 4.0 + 0.89, 2.36, `<g transform="translate(-0.89 -0.21)">${rhbLogo(0.42, "#ffffff")}</g>`) +
        T(cc, 6.05, 2.36, 0.74, "Rhätische Bahn", "#ffffff", { anchor: "start", family: COND, stretch: "condensed" }) +
        T(cc, 6.1, 1.68, 0.36, "Ferrovia retica&#160;&#160;Viafier retica", "#ffffff", { anchor: "start", family: COND, stretch: "condensed" });
      return s;
    },
  });
}

// Ge 4/4 II (611-633): SLM, BBC and MFO, 1973 and 1984-1985 (19 left in
// 2026): 12.96 m over the buffers, Bo'Bo' on 1,070 mm wheels; a flat front
// with two windscreens, louvred grilles high on the side under the roof at
// each end, the brake resistors on the roof between them, a pantograph at
// each end; two machine-room windows each side. Photograph of 614 at Chur
// (2024): RhB red, a silver line at floor height, dark gray below; the RhB
// mark and the railway's name low in the middle. (Many carry advertising;
// drawn in the red, without each one's coat of arms and number.)
const G2 = { roof: 3.8, eave: 3.37, sill: 0.96, stripe: 1.38 };
const NOSE_G2 = [[0.4, 0.96], [0.38, 2.25], [0.45, 3.2], ["q", 0.5, 3.55, 0.75, 3.7], ["q", 0.95, 3.8, 1.3, 3.8]];
function ge44ii(c) {
  const red = RHB.red;
  return loco(c, {
    half: (cc, L) => body({ ...cc, coupledL: false, coupledR: false }, { roof: G2.roof, sill: G2.sill, nose: NOSE_G2, base: red, endInset: 0.38,
      under: () => bogie(3.38, 2.3, 1070, G2.sill, "loco") + R(5.3, 0.45, 1.3, 0.5, "currentColor", 0, 'opacity="0.85"'),
      paint: () => bands(L, [[G2.eave, 2, "#c4cad0"], [0, G2.stripe, "#4b5259"], [G2.stripe, 0.07, RHB.silver]]) +
        [1.52, 2.36, 3.2].map((x) => RR(x, G2.eave + 0.06, 0.8, 0.32, 0.03, "#5b5048") + slats(ft(x + 0.06), ft(G2.eave + 0.09), ft(0.68), ft(0.26), 0.3, "rgba(255,255,255,0.15)")).join("") +
        R(0.38, 2.3, 0.1, 1.0, RHB.dark),
      extra: () => locoFront(0.36, G2.sill, 1.3) }),
    side: (cc, L) => {
      // As seen on 614's side: the left cab's narrow window and its door,
      // the right cab's big sliding window and its narrow one; one
      // machine-room window toward each end, a hatch between; the brake
      // resistors on the roof.
      let s = RR(0.78, 2.47, 0.3, 0.66, 0.05, GLASS) + R(1.12, 1.43, 0.75, 1.9, "none", 0.5) + RR(1.3, 2.4, 0.45, 0.82, 0.05, GLASS) +
        Ln(1.06, 1.5, 1.06, 2.9, "#e8eaec", 0.9) + Ln(1.94, 1.5, 1.94, 2.9, "#e8eaec", 0.9) + R(1.15, 0.85, 0.7, 0.08, "#3a3f45");
      s += RR(L - 1.2, 2.47, 0.3, 0.66, 0.05, GLASS) + RR(L - 2.18, 2.42, 0.85, 0.98, 0.06, GASKET) + RR(L - 2.13, 2.47, 0.75, 0.88, 0.05, GLASS) + RR(L - 1.75, 2.62, 0.15, 0.3, 0.04, red, 0.4);
      s += RR(2.71, 2.43, 1.47, 0.85, 0.1, GASKET) + RR(2.76, 2.48, 1.37, 0.75, 0.08, GLASS) + RR(8.25, 2.43, 1.55, 0.85, 0.1, GASKET) + RR(8.3, 2.48, 1.45, 0.75, 0.08, GLASS);
      s += R(4.49, 1.5, 1.08, 1.65, "none", 0.4);
      s += R(4.7, G2.eave + 0.02, 3.5, 0.16, "#3a3f45") + [5.0, 5.7, 6.4, 7.1].map((x) => roofBox(x, 0.6, G2.roof - 0.05, 0.3, "#7e848a")).join("");
      s += panto(3.1, G2.roof, false, 1) + panto(L - 3.1, G2.roof, c.wires !== false, -1);
      s += rhbMark(cc, 2.75, 1.86, 0.23, "Rhätische Bahn") + gr(cc, 11.2, 1.95);
      return s;
    },
  });
}

// ===================== Zentralbahn =====================
// zb's paint (photographs at Meiringen, Stans and Luzern, 2018-2025):
// white, the window band red from just under the high-floor windows to the
// roof's edge, a dark gray skirt, the roof light gray; on the cab end a red
// sweep from the cab door down to a red band across the front's foot, a
// huge white "zb" on it; "Die Zentralbahn." in dark gray with the red zb
// disc beside it; first class's yellow line along the top of the band over
// its windows, and "1" or "2" in the door's window.
const ZB = { red: "#d42a2a", white: "#f1f2f3", gray: "#4b5157", roof: "#c9cfd4", yellow: "#f3c300", band: [1.72, 3.42], skirt: 0.95 };
// The zb disc: a red circle with "zb" in white.
const zbDisc = (r) => `<circle r="${n(r)}" fill="${ZB.red}"/><text y="${n(r * 0.36)}" font-size="${n(r * 1.15)}" text-anchor="middle" font-weight="800" font-family="${SANS}" fill="#ffffff" letter-spacing="-0.04em">zb</text>`;
const zbName = (c, x, y, h) => M(c, x, y, `<g transform="translate(${n(-h * 4.1)} 0)">${zbDisc(h * 0.62)}<text x="${n(h * 0.85)}" y="${n(h * 0.36)}" font-size="${n(h)}" font-weight="600" font-family="${SANS}" fill="#3b4046" letter-spacing="-0.02em">Die Zentralbahn.</text></g>`);
// The FINK and ADLER bodies (Stadler, 2012-2016 and 2026): 4.02 m high;
// the end cars rest on an adhesion motor bogie at the cab end and on the
// middle car (which has the two rack bogies) at the other; the low-floor
// sections around the doors. Measured from zb's FINK side elevation
// (Commons, "ZB ABeh 160 - Drehgestelle"), scaled to its 54.0 m.
const ZBD = { roof: 3.9, sill: 0.42, hi: [1.92, 3.14], lo: [1.19, 3.14] };
const NOSE_ZB = [[0.12, 0.3], [0.05, 0.95], [0.05, 1.7], [0.18, 2.6], ["q", 0.35, 3.45, 1.1, 3.78], ["q", 1.5, 3.9, 2.1, 3.9]];
function zbBody(c, o) {
  const L = c.L / F, cab = !!o.cab;
  return body(c, {
    roof: ZBD.roof, sill: ZBD.sill, nose: cab ? NOSE_ZB : null, base: ZB.white, endInset: 0.15, endR: 0.35, dia: [0.5, 3.5],
    bottom: o.drop ? [[o.drop[0] - 0.3, ZBD.sill], [o.drop[0], 0.36], [o.drop[1], 0.36], [o.drop[1] + 0.3, ZBD.sill]] : null,
    under: () => (o.bogies || []).map(([x, rack]) => (rack ? rackBogie(x, 2.0, 810, 0.45) : bogie(x, 2.1, 810, 0.45, "loco"))).join("") + (o.under || ""),
    paint: () => {
      let s = bands(L, [[ZB.band[0], ZB.band[1] - ZB.band[0], ZB.red], [ZB.band[1], 2, ZB.roof], [0, ZB.skirt, ZB.gray]]);
      s += (o.yellow || []).map(([a, b]) => R(a, ZB.band[1] - 0.12, b - a, 0.1, ZB.yellow)).join("");
      // The cab: the red sweep from the band down round the side window to
      // the front's foot, the windscreen in a dark mask, the side window.
      if (cab && o.spatz) s += P([[0.06, 1.75], [0.22, 2.75], ["q", 0.4, 3.45, 1.2, 3.75], [2.4, 3.75], [2.4, 1.75]], "#5b636b") + R(-0.5, 1.72, 1.3, 0.55, ZB.red) +
        P([[0.4, 2.3], [0.6, 3.1], ["q", 0.9, 3.55, 1.6, 3.6], [1.95, 3.6], [1.95, 2.3]], GLASS) + RR(2.15, 1.85, 0.5, 1.45, 0.08, GASKET) + RR(2.2, 1.9, 0.4, 1.35, 0.06, GLASS);
      else if (cab) s += P([[2.75, 0.5], [2.75, 3.42], [2.2, 3.42], ["q", 0.85, 3.1, 0.55, 1.6], ["q", 0.45, 1.1, 0.3, 0.5]], ZB.red) +
        R(-0.5, 0.5, 1.2, 0.45, ZB.red) + P([[0.06, 1.55], [0.18, 2.6], ["q", 0.32, 3.3, 0.95, 3.6], [1.25, 3.6], [1.25, 1.55]], "#2b3035") +
        P([[0.2, 1.75], [0.3, 2.6], ["q", 0.42, 3.15, 0.98, 3.42], [1.18, 3.42], [1.18, 1.75]], GLASS) + R(0.6, 3.62, 0.8, 0.2, "#2b3035") +
        P([[1.65, 1.5], [2.55, 1.5], [2.55, 3.15], [2.1, 3.15], ["q", 1.72, 2.95, 1.65, 2.4]], GASKET) + P([[1.72, 1.56], [2.49, 1.56], [2.49, 3.09], [2.12, 3.09], ["q", 1.78, 2.92, 1.72, 2.4]], GLASS);
      s += o.windows.map((b) => band(b, ZBD.hi, ZBD.lo)).join("");
      // Roof windows over the end cars' high-floor seats.
      s += (o.sky || []).map(([a, b]) => RR(a, ZB.band[1] + 0.12, b - a, 0.26, 0.06, "#59697a", 0, 'opacity="0.9"')).join("");
      return s;
    },
    extra: (cc) => {
      let s = o.doors.map((x) => door(x, 1.6, 0.42, 3.08, { fill: "#c9ced2", win: [0.18, 0.9], winW: 0.42 }) + T(cc, x + 0.8, 2.75, 0.3, o.cls(x), "#ffffff", { weight: 700 })).join("");
      if (cab && o.spatz) s += lamp(0.08, 1.5, 0.12, 0.12) + autoCoupler(-0.05, 0.4, 0.62);
      else if (cab) s += R(2.8, 0.5, 0.62, 2.95, "none", 0.5) + lamp(0.12, 1.12, 0.12, 0.12) + lamp(0.13, 0.98, 0.09, 0.07, "#ff5a4a") + autoCoupler(-0.05, 0.4, 0.62) +
        T(cc, 2.0, 1.05, 1.55, "zb", "#ffffff", { weight: 800, spacing: "-0.05em" }) + RR(0.55, 3.62, 1.0, 0.18, 0.04, "#16181b", 0.4);
      s += (o.roofBoxes || []).map(([x, w]) => roofBox(x, w, ZBD.roof, 0.16)).join("") + (o.pan != null ? panto(o.pan, ZBD.roof, c.wires !== false, 1) : "");
      if (o.name != null) s += zbName(cc, o.name, 1.25, 0.32);
      return s;
    },
  });
}
const fCls = (k) => () => k;
// FINK ABeh 160/161/162: Bth (cab, second class), Beh (the middle car,
// rack bogies, the pantograph), ABth (cab, first class behind the cab).
const zbFinkB = (c) => zbBody(c, { cab: true, bogies: [[3.48]], drop: [9.6, 17.6], cls: fCls("2"), name: 6.0, sky: [[3.0, 4.7], [5.0, 6.7], [7.0, 8.7]],
  windows: [[[2.9, 4.75], [4.98, 6.8], [7.0, 8.83]], [[13.5, 15.07, true], [15.27, 16.86, true]]], doors: [10.9], roofBoxes: [[2.6, 3.4], [6.5, 1.6]] });
const zbFinkC = (c) => zbBody(c, { bogies: [[2.93, true], [15.9, true]], cls: fCls("2"), pan: 3.0, name: null,
  windows: [[[1.18, 2.7], [2.9, 4.5], [4.7, 6.3], [6.5, 8.1], [8.15, 9.8]], [[12.33, 13.87], [14.1, 15.65], [15.8, 17.3]]], doors: [10.3], roofBoxes: [[5.0, 1.6], [8.6, 3.2]] });
const zbFinkA = (c) => zbBody(c, { cab: true, bogies: [[3.4]], drop: [9.6, 17.6], cls: (x) => "1", name: 6.4, yellow: [[2.9, 9.6]], sky: [[3.9, 5.3], [5.6, 7.1], [7.3, 8.9]],
  windows: [[[3.0, 3.6], [3.85, 5.35], [5.6, 7.1], [7.3, 8.9]], [[11.8, 13.4, true], [13.6, 15.1, true], [15.4, 16.8, true]]], doors: [9.8], roofBoxes: [[2.6, 3.4], [6.5, 1.6]] });
// The ADLER ABeh 150 (2012-2013, four seven-car trains): two half-trains,
// each an end car Ath (first class, cab), the rack car Beh and a low-floor
// Bh, the bistro car BR in the middle; 126 m. Car lengths from zb's ADLER
// elevation (Commons "ZB ABeh 150 - Drehgestelle"), its windows from a
// photograph at Meiringen (2017) and the FINK's: approximate.
const zbAdA = (c) => zbBody(c, { cab: true, bogies: [[3.4]], drop: [9.6, 17.6], cls: fCls("1"), name: 6.4, yellow: [[2.9, 17.4]], sky: [[3.9, 5.3], [5.6, 7.1], [7.3, 8.9]],
  windows: [[[3.0, 3.6], [3.85, 5.35], [5.6, 7.1], [7.3, 8.9]], [[11.8, 13.4, true], [13.6, 15.1, true], [15.4, 16.8, true]]], doors: [9.8], roofBoxes: [[2.6, 3.4]] });
const zbAdB = (c) => zbBody(c, { bogies: [[15.0]], drop: [0.3, 12.0], cls: fCls("2"), name: 13.6,
  windows: [[[0.9, 2.45, true], [2.65, 4.2, true], [4.4, 6.0, true]], [[8.4, 9.95, true], [10.15, 11.7, true]], [[12.5, 14.0], [14.2, 15.8]]], doors: [6.5], roofBoxes: [[9.0, 3.0]] });
const zbAdWR = (c) => zbBody(c, { bogies: [[3.0], [16.2]], cls: fCls("2"), name: null,
  windows: [[[1.2, 2.8], [3.0, 4.6]], [[7.4, 9.0, true], [9.2, 10.8, true], [11.0, 12.6, true]], [[14.6, 16.2], [16.4, 18.0]]], doors: [5.3], roofBoxes: [[7.5, 4.0]] });

// SPATZ ABe 130 001-010 (Stadler, 2004-2005, for SBB's Brünig line, now
// zb's): three cars, 51.93 m, 3.72 m high, no rack; low-floor end cars
// (the GTW's cab front) resting on the high-floor middle car, which has the
// motors, the pantograph and panorama windows and no doors. Photographs at
// Interlaken Ost (2018) and Hergiswil (2025): zb's paint, the cab's red
// band carried round the front. (Car lengths estimated from photographs:
// end cars about 17.7 m, the middle car 16.5 m.)
const zbSpatzEnd = (first) => (c) => zbBody(c, { cab: true, spatz: true, bogies: [[2.7]], drop: [3.0, 17.7], cls: fCls("2"), name: 13.4,
  yellow: first ? [[3.2, 8.0]] : [],
  windows: [[[3.3, 5.3, true], [5.55, 7.55, true]], [[10.15, 11.65, true], [11.9, 13.4, true], [13.65, 15.15, true]]], doors: [8.05, 15.75], roofBoxes: [[10.0, 3.2]] });
const zbSpatzMid = (c) => zbBody(c, { bogies: [[3.0], [13.5]], cls: fCls("2"), name: null,
  windows: [seq(0.8, 1.35, 11).map((x) => [x, x + 1.12])], doors: [], pan: 8.2, roofBoxes: [[2.0, 3.6], [11.0, 3.6]],
  sky: seq(0.8, 1.35, 11).map((x) => [x + 0.05, x + 1.07]) });

// The Luzern-Engelberg Express coaches (the HGe 101's push-pull trains,
// until the ABeh 151 come): the panorama coaches A 102-103, the older
// steel coaches from the Brünig line, B and BD, and at the other end the
// articulated control-car set ABt 941-943 (Stadler, 2010; ABt, B1, B2).
// Photographs of A 102 at Luzern (2013) and of the set at Engelberg (2014):
// red above, a white band at the windows' foot, a dark gray skirt, the
// doors gray; on the panorama coach "Luzern-Engelberg Express" in dark gray
// on the white and the red "zb" sweep, first class's yellow line along its
// ends' top edge. (Lengths, about 17-18 m, and the steel coaches' windows
// estimated from the photographs; the BD's "Globi" decoration is left out.)
function lexCoach(c, kind) {
  const L = c.L / F, red = ZB.red, pano = kind === "A";
  return body(c, {
    roof: 3.6, sill: 0.82, base: ZB.white, endInset: 0.3, endR: 0.3, dia: [1.0, 3.2],
    under: () => bogie(2.7, 1.9, 750, 0.82) + bogie(L - 2.7, 1.9, 750, 0.82) + R(5.5, 0.45, L - 11, 0.35, "currentColor", 0, 'opacity="0.75"'),
    paint: () => {
      let s = R(-0.5, pano ? 1.95 : 1.95, L + 1, 2, red) + R(-0.5, 3.3, L + 1, 1, ZB.roof) + R(-0.5, 0, L + 1, 1.05, ZB.gray);
      if (pano) {
        s += R(0.5, 3.18, 2.2, 0.08, ZB.yellow) + R(L - 2.7, 3.18, 2.2, 0.08, ZB.yellow);
        s += seq(2.9, (L - 5.8) / 6, 6).map((a) => RR(a, 2.15, (L - 5.8) / 6 - 0.04, 1.0, 0.04, GASKET) + pane(a + 0.04, 2.19, (L - 5.8) / 6 - 0.12, 0.92, 0.04) +
          R(a, 3.2, (L - 5.8) / 6 - 0.04, 0.38, "#59697a")).join("");
        s += P([[L - 4.2, 1.05], [L - 2.6, 1.05], [L - 2.6, 2.0], [L - 3.9, 2.0], ["q", L - 4.5, 1.6, L - 4.2, 1.05]], red);
      } else {
        s += (kind === "BD" ? seq(5.0, 1.45, 5) : seq(3.3, 1.45, 8)).map((a) => RR(a, 2.15, 1.25, 1.0, 0.08, GASKET) + pane(a + 0.04, 2.19, 1.17, 0.92, 0.06)).join("");
        if (kind === "BD") s += R(L - 5.6, 1.1, 1.4, 2.0, "none", 0.5);
      }
      return s;
    },
    extra: (cc) => [0.55, L - 1.55].map((x) => door(x, 1.0, 0.85, 3.12, { leaves: 1, fill: "#8f979e", win: [0.55, 0.85], winW: 0.42 })).join("") +
      (pano ? T(cc, L * 0.45, 1.45, 0.45, "Luzern–Engelberg Express", "#3d4247", { weight: 400 }) + T(cc, L - 3.2, 1.7, 1.05, "zb", "#ffffff", { weight: 800, spacing: "-0.05em" }) +
        T(cc, 2.3, 2.95, 0.3, "1", "#ffffff", { weight: 500 }) + T(cc, L - 2.3, 2.95, 0.3, "1", "#ffffff", { weight: 500 })
        : T(cc, 2.8, 2.95, 0.36, "2", "#ffffff", { weight: 600 }) + zbName(cc, L * 0.55, 1.45, 0.3)),
  });
}
// The control-car set ABt 941-943: the SPATZ's GTW cab (first class behind
// it) and two low-floor sections, articulated (approximate).
const zbGswABt = (c) => zbBody(c, { cab: true, spatz: true, bogies: [[2.7]], drop: [3.0, 15.5], cls: fCls("1"), name: 11.5, yellow: [[3.2, 8.0]],
  windows: [[[3.3, 5.3, true], [5.55, 7.55, true]], [[10.15, 11.65, true], [11.9, 13.4, true]]], doors: [8.05], roofBoxes: [[10.0, 3.2]] });
const zbGswB = (c) => zbBody(c, { bogies: [[13.2]], drop: [0.3, 12.0], cls: fCls("2"), name: 9.5,
  windows: [[[0.9, 2.45, true], [2.65, 4.2, true]], [[6.4, 7.95, true], [8.15, 9.7, true], [9.9, 11.45, true]]], doors: [4.5], roofBoxes: [[7.0, 3.0]] });

// ---------- HGe 4/4 II (MGB 1-5 and 101-109, zb 101 961-968) ----------
// SLM, BBC and ABB, 1985-1990: the rack and adhesion locomotive of the
// Furka-Oberalp, Brig-Visp-Zermatt and Brünig lines, 14.78 m over the
// buffers (zb's 14.8 m), Bo'Bo' with the cogwheels in the bogies (Abt on
// the MGB, Riggenbach on the zb); a raked two-window front, the side one
// long louvred panel, the cab door behind the cab window at one end only;
// the roof's resistor covers glazed. Photographs of MGB 107 at Brig (2021)
// and of zb 101 961 at Engelberg (2022). MGB: red, the skirt dark gray-green,
// white slashes slanting up the front's corners, the MGB mark (its
// mountain in white dashes) with "matterhorn gotthard bahn" in white lower
// case on the louvres. zb: red, a white lower panel from behind the cab
// to the rear end, the skirt dark gray, a giant white "zb" across the
// side, "Die Zentralbahn." small at the rear. (Each loco's name and coat
// of arms left out; the wheel size, about 1 m, and the bogie centres are
// estimated from the photographs.)
const HG = { roof: 3.7, sill: 0.95 };
const NOSE_HG = [[0.3, 0.95], [0.25, 1.75], [0.42, 2.95], ["q", 0.48, 3.45, 0.85, 3.6], ["q", 1.1, 3.7, 1.5, 3.7]];
// The MGB mark (from the photograph): a lattice of white dashed lines
// slanting both ways, outlining a mountain, a white wedge at its heart;
// h tall, centred at (x, y).
const mgbMark = (c, x, y, h, fill = "#ffffff") => {
  let d = "";
  for (let k = 0; k < 5; k++) { const o = k * 0.16; d += `M${n(0.05 + o)} ${n(0.95)}L${n(0.42 + o)} ${n(0.05 + k * 0.06)}`; }
  for (let k = 0; k < 4; k++) { const o = k * 0.16; d += `M${n(0.36 + o)} ${n(0.08 + k * 0.05)}L${n(0.62 + o)} ${n(0.95)}`; }
  return M(c, x, y, `<g transform="scale(${n(h)}) translate(-0.5 -0.5)"><path d="${d}" stroke="${fill}" stroke-width="0.03" stroke-dasharray="0.05 0.03" fill="none"/>` +
    `<path d="M0.42 0.78L0.55 0.48L0.62 0.82Z" fill="${fill}"/></g>`);
};
const MGB_FONT = "'Avenir Next', 'Trebuchet MS', 'Helvetica Neue', Arial, sans-serif";
const mgbName = (c, x, y, h, fill = "#ffffff") => M(c, x, y, `<text x="0" y="0" font-size="${n(h)}" font-weight="400" font-family="${MGB_FONT}" fill="${fill}">matterhorn</text>` +
  `<text x="${n(h * 1.5)}" y="${n(h * 1.15)}" font-size="${n(h)}" font-weight="400" font-family="${MGB_FONT}" fill="${fill}">gotthard bahn</text>`);
function hge(c, rail) {
  const zb = rail === "zb", red = zb ? ZB.red : "#d8232a", skirt = zb ? ZB.gray : "#3d4a47";
  return loco(c, {
    half: (cc, L) => body({ ...cc, coupledL: false, coupledR: false }, { roof: HG.roof, sill: HG.sill, nose: NOSE_HG, base: red, endInset: 0.3,
      under: () => rackBogie(3.55, 2.6, 1000, HG.sill) + R(5.6, 0.45, 1.6, 0.45, "currentColor", 0, 'opacity="0.85"'),
      paint: () => bands(L, [[3.48, 2, "#b9bfc5"], [0, HG.sill + 0.25, skirt]]) + (zb ? R(-0.5, 0.9, 1.6, 0.35, "#2e3338") : "") +
        P([[0.3, 2.25], [0.42, 2.95], ["q", 0.46, 3.3, 0.7, 3.42], [0.95, 3.42], [0.95, 2.25]], "#2e3338") + P([[0.42, 2.35], [0.5, 2.9], ["q", 0.55, 3.2, 0.75, 3.3], [0.88, 3.3], [0.88, 2.35]], GLASS) +
        (zb ? "" : [0.0, 0.3].map((d) => P([[0.25 + d, 1.3], [0.38 + d, 1.3], [0.75 + d, 2.2], [0.62 + d, 2.2]], "#ffffff")).join("")) +
        RR(1.75, 2.3, 0.62, 0.9, 0.06, GASKET) + RR(1.8, 2.35, 0.52, 0.8, 0.05, GLASS),
      extra: () => locoFront(0.3, HG.sill, 1.25) + RR(2.42, 2.4, 0.2, 0.42, 0.05, red, 0.4) }),
    side: (cc, L) => {
      // The louvred panel; the cab door at the left end; the roof covers.
      let s = R(3.15, 1.35, L - 6.3, 2.1, "none", 0.4) + lines(seq(1.5, 0.15, 13).map((y) => [ft(3.25), ft(y), ft(L - 3.25), ft(y)]), "rgba(0,0,0,0.22)", 0.5);
      s += R(2.6, 1.0, 0.55, 2.4, "none", 0.5) + RR(2.68, 2.1, 0.38, 1.0, 0.05, GLASS) + Ln(2.55, 1.2, 2.55, 3.0, "#e8eaec", 0.9) + Ln(3.2, 1.2, 3.2, 3.0, "#e8eaec", 0.9);
      s += [3.4, 5.4, 7.4, 9.4].map((x) => RR(x, HG.roof - 0.03, 1.9, 0.2, 0.04, "#6a7a86", 0.4)).join("");
      s += panto(3.0, HG.roof, false, 1) + panto(L - 3.0, HG.roof, c.wires !== false, -1);
      if (zb) {
        s += P([[2.45, HG.sill + 0.25], [L - 0.3, HG.sill + 0.25], [L - 0.3, 1.95], [3.0, 1.95], ["q", 2.5, 1.95, 2.45, 1.6]], ZB.white) +
          T(cc, L * 0.58, 2.13, 3.0, "zb", "#ffffff", { weight: 800, spacing: "-0.05em" }) + zbName(cc, L - 1.4, 1.5, 0.12);
      } else s += mgbMark(cc, L * 0.36, 2.25, 1.6) + mgbName(cc, L * 0.43, 2.6, 0.4);
      return s;
    },
  });
}

// ===================== Matterhorn Gotthard Bahn =====================
// MGB red, the light gray band of the Komet and the older units, the
// Orion's white skirt band; the MGB mark (mgbMark, mgbName above).
const MGB = { red: "#e0262b", gray: "#c9ccce", white: "#f2f3f3", skirt: "#3d4a47", roof: "#c4c9cd" };
// Orion (ABeh 8/12 301-337): Stadler, from 2023 (12, then 25 more from
// 2026): three cars, 56.6 m over the couplers, 3.885 m high, (A1z)(1zA) +
// 2'2' + (A1z)(1zA), 790 mm wheels; the end cars with first class behind
// the cab (24 seats), a double door in the low-floor section at the inner
// end; the middle car's low floor with the accessible toilet, both
// pantographs on its roof. Stadler's data sheet MBT0822d (its side
// elevation measured here: end cars about 19.3 m, the middle car 17.9 m)
// and photographs of 308 at Brig and 312 at Göschenen (2023-2025): red,
// a white band along the foot of the side and round the nose, the cab's
// glazing in a black mask; four white slashes slanting under the windows
// behind the cab door; first class's yellow line over its windows; the MGB
// mark small by the door.
const OR = { roof: 3.88, sill: 0.4, hi: [1.84, 2.92], lo: [1.25, 2.92], band: 1.2 };
const NOSE_OR = [[0.35, 0.3], [0.25, 0.95], [0.3, 1.6], [0.62, 2.45], ["q", 0.95, 3.4, 1.7, 3.75], ["q", 2.0, 3.88, 2.45, 3.88]];
function orionEnd(c) {
  const L = c.L / F, red = MGB.red;
  return body(c, {
    roof: OR.roof, sill: OR.sill, nose: NOSE_OR, base: red, endInset: 0.3, dia: [0.5, 3.5],
    under: () => rackBogie(4.25, 2.3, 790, 0.5) + rackBogie(16.35, 2.3, 790, 0.5),
    paint: () => bands(L, [[0, OR.band, MGB.white], [0, 0.45, MGB.skirt]]) + R(3.9, OR.hi[1] + 0.08, 5.5, 0.09, "#f2c200") +
      P([[0.3, 1.45], [0.62, 2.45], ["q", 0.92, 3.3, 1.6, 3.62], [2.2, 3.62], [2.2, 1.45]], "#1e2226") + P([[0.65, 1.7], [0.85, 2.45], ["q", 1.1, 3.15, 1.7, 3.42], [2.1, 3.42], [2.1, 1.7]], GLASS) +
      band([[3.95, 5.55], [5.85, 7.4], [7.95, 9.35]], OR.hi) + band([[12.2, 13.4, true]], OR.hi, OR.lo) + band([[14.2, 15.6], [15.9, 17.3], [17.5, 18.3]], OR.hi) +
      [0, 0.45, 0.9, 1.35].map((d) => P([[9.5 + d, 0.55], [9.68 + d, 0.55], [10.3 + d, 1.72], [10.12 + d, 1.72]], "#ffffff")).join("") + alvDisplay(4.4, 1.1, 1.0),
    extra: (cc) => door(2.55, 0.62, 0.5, 3.05, { leaves: 1, fill: "rgba(0,0,0,0.05)", win: [0.45, 0.88], winW: 0.3 }) + door(10.4, 1.5, 0.45, 2.95, { fill: "#d2d6d9", win: [0.2, 0.88], winW: 0.4 }) +
      lamp(0.28, 1.3, 0.14, 0.12) + autoCoupler(-0.05, 0.45, 0.6) + roofBox(6.2, 1.4, OR.roof, 0.16, "#3a4046") + roofBox(14.2, 1.7, OR.roof, 0.16, "#3a4046") +
      mgbMark(cc, 12.5, 0.85, 0.32, MGB.red) + T(cc, 9.85, 2.6, 0.32, "1", "#ffffff", { weight: 500 }) + T(cc, 12.1, 2.6, 0.32, "2", "#ffffff", { weight: 500 }),
  });
}
function orionMid(c) {
  const L = c.L / F, red = MGB.red;
  return body(c, {
    roof: OR.roof, sill: OR.sill, base: red, endInset: 0.3, dia: [0.5, 3.5],
    under: () => bogie(1.95, 2.0, 790, 0.5) + bogie(L - 1.95, 2.0, 790, 0.5),
    paint: () => bands(L, [[0, OR.band, MGB.white], [0, 0.45, MGB.skirt]]) +
      band([[0.3, 1.85], [2.1, 3.6]], OR.hi) + band([[4.3, 5.4, true]], OR.hi, OR.lo) + band([[8.2, 9.0, true]], OR.hi, OR.lo) + band([[9.9, 11.2, true], [11.5, 12.8, true]], OR.hi, OR.lo) +
      band([[12.9, 14.4], [14.7, 16.2]], OR.hi),
    extra: (cc) => door(6.0, 1.5, 0.45, 2.95, { fill: "#d2d6d9", win: [0.2, 0.88], winW: 0.4 }) + roofBox(8.8, 1.7, OR.roof, 0.16, "#3a4046") +
      panto(1.9, OR.roof, true, 1) + panto(L - 2.1, OR.roof, false, -1) + T(cc, 5.7, 2.6, 0.32, "2", "#ffffff", { weight: 500 }) + mgbName(cc, 9.4, 0.95, 0.2, "#7a7f84"),
  });
}
// Komet (ABDeh 4/8 2021-2028 and ABDeh 4/10 2011-2014): Stadler,
// 2007-2008 and 2014: a high-floor panorama power car without doors in the
// middle (its roof glazed at the edges), the low-floor end cars resting on
// it, each on one bogie at its cab end; 56.66 m (the 4/10, with a trailer
// added, 74.73 m), 3.95 m high; first class and the low-floor second class
// at one end, the baggage compartment at the other. Photographs at Brig
// (2014-2020): red, a light gray band along the foot of the windows to the
// skirt (red again below), the windows in a black band, the cab's front
// white below and red above, white slashes slanting across its corners;
// the MGB mark on the gray behind the door; first class's yellow line.
// (The cars' lengths, about 18.9 m for each, and their windows estimated
// from photographs.)
const KO = { roof: 3.95, sill: 0.42, hi: [1.75, 3.0], lo: [1.2, 3.0], gray: [0.85, 1.6] };
const NOSE_KO = [[0.3, 0.3], [0.2, 1.3], [0.25, 2.2], [0.45, 3.5], ["q", 0.6, 3.95, 1.2, 3.95]];
function kometEnd(c, first) {
  const L = c.L / F, red = MGB.red;
  return body(c, {
    roof: KO.roof, sill: KO.sill, nose: NOSE_KO, base: red, endInset: 0.3, dia: [0.5, 3.5],
    bottom: [[L - 4.0, KO.sill], [L - 3.8, 0.38]],
    under: () => bogie(2.8, 1.8, 685, 0.45),
    paint: () => bands(L, [[3.55, 0.08, MGB.gray], [KO.gray[0], KO.gray[1] - KO.gray[0], MGB.gray], [0, 0.42, MGB.skirt]]) + (first ? R(4.0, KO.hi[1] + 0.08, 6.5, 0.09, "#f2c200") : "") +
      R(-0.5, 0.42, 1.0, 1.2, MGB.white) + P([[0.25, 2.05], [0.42, 3.4], [1.5, 3.4], [1.5, 2.05]], "#1e2226") + P([[0.35, 2.2], [0.5, 3.25], [1.4, 3.25], [1.4, 2.2]], GLASS) +
      [0, 0.32].map((d) => P([[0.2 + d, 1.25], [0.32 + d, 1.25], [0.62 + d, 1.95], [0.5 + d, 1.95]], "#ffffff")).join("") +
      (first ? band([[3.35, 4.3, true]], KO.hi, KO.lo) + band([[4.6, 6.4, true], [6.6, 8.4, true], [8.6, 10.4, true]], KO.hi, KO.lo) : RR(4.6, 0.9, 2.2, 2.4, 0.05, "none", 0.5) + band([[3.35, 4.3, true]], KO.hi, KO.lo) + band([[7.4, 8.4, true], [8.6, 10.4, true]], KO.hi, KO.lo)) +
      band([[12.6, 14.4, true], [14.6, 16.4, true]], KO.hi, KO.lo) + [5, 7, 9].map((x) => RR(x, 3.25, 1.6, 0.35, 0.06, "#59697a")).join(""),
    extra: (cc) => door(2.0, 0.62, 0.45, 3.1, { leaves: 1, fill: "rgba(0,0,0,0.05)", win: [0.45, 0.88], winW: 0.3 }) + door(10.9, 1.4, 0.4, 2.98, { fill: "#d2d6d9", win: [0.2, 0.88], winW: 0.38 }) +
      lamp(0.2, 1.1, 0.14, 0.12) + autoCoupler(-0.05, 0.45, 0.6) + mgbMark(cc, 15.4, 1.22, 0.75, MGB.red) + mgbName(cc, 12.6, 1.38, 0.3, MGB.red),
  });
}
function kometPower(c, rows = true) {
  const L = c.L / F, red = MGB.red;
  return body(c, {
    roof: KO.roof, sill: 0.45, base: red, endInset: 0.3, dia: [1.0, 3.5],
    under: () => rackBogie(3.0, 2.3, 796, 0.5) + rackBogie(L - 3.0, 2.3, 796, 0.5),
    paint: () => bands(L, [[3.55, 0.08, MGB.gray], [KO.gray[0], KO.gray[1] - KO.gray[0], MGB.gray], [0, 0.45, MGB.skirt]]) +
      band(seq(1.0, (L - 2.0) / 7, 7).map((a) => [a, a + (L - 2.0) / 7 - 0.15]), [1.85, 3.15]) + seq(1.0, (L - 2.0) / 7, 7).map((a) => RR(a, 3.3, (L - 2.0) / 7 - 0.15, 0.4, 0.05, "#59697a")).join(""),
    extra: (cc) => panto(L / 2, KO.roof, c.wires !== false, -1) + roofBox(2.0, 3.0, KO.roof, 0.18) + roofBox(L - 5.0, 3.0, KO.roof, 0.18),
  });
}

// The Zermatt shuttle (BDSeh 4/8 2051-2054, Stadler 2002-2005): the
// Komet's forerunner, 52.0 m, all second class: two low-floor end cars with
// two double doors each side (for luggage trolleys), a panorama power car
// in the middle. Photograph at Täsch (2023): the Komet's paint, "Zermatt
// Shuttle" in red on the middle car's gray band. (Car lengths, end cars
// about 17 m, and windows estimated from photographs.)
function shuttleEnd(c) {
  const L = c.L / F, red = MGB.red;
  return body(c, {
    roof: KO.roof, sill: KO.sill, nose: NOSE_KO, base: red, endInset: 0.3, dia: [0.5, 3.5],
    under: () => bogie(2.8, 1.8, 685, 0.45),
    paint: () => bands(L, [[3.55, 0.08, MGB.gray], [KO.gray[0], KO.gray[1] - KO.gray[0], MGB.gray], [0, 0.42, MGB.skirt]]) +
      R(-0.5, 0.42, 1.0, 1.2, MGB.white) + P([[0.25, 2.05], [0.42, 3.4], [1.5, 3.4], [1.5, 2.05]], "#1e2226") + P([[0.35, 2.2], [0.5, 3.25], [1.4, 3.25], [1.4, 2.2]], GLASS) +
      [0, 0.32].map((d) => P([[0.2 + d, 1.25], [0.32 + d, 1.25], [0.62 + d, 1.95], [0.5 + d, 1.95]], "#ffffff")).join("") +
      band([[2.0, 3.1, true]], KO.hi, KO.lo) + band([[3.6, 5.2, true], [5.4, 7.0, true]], KO.hi, KO.lo) + band([[9.3, 11.9, true]], KO.hi, KO.lo) + band([[14.8, 16.4, true]], KO.hi, KO.lo),
    extra: (cc) => door(7.5, 1.5, 0.4, 2.98, { fill: "#d2d6d9", win: [0.2, 0.88], winW: 0.42 }) + door(12.9, 1.5, 0.4, 2.98, { fill: "#d2d6d9", win: [0.2, 0.88], winW: 0.42 }) +
      lamp(0.2, 1.1, 0.14, 0.12) + autoCoupler(-0.05, 0.45, 0.6) + mgbMark(cc, 5.4, 1.22, 0.55, MGB.red) + mgbName(cc, 3.2, 1.32, 0.2, MGB.red),
  });
}
const shuttleMid = (c) => kometPower(c) + T(c, c.L / F / 2, 1.22, 0.55, "Zermatt<tspan font-weight='400'>Shuttle</tspan>", MGB.red, { weight: 700 });

// ===================== A regional unit's car, generically =====================
// For the many Stadler (and older) metre-gauge units drawn below: o (m):
// roof, sill, nose (a cab car), low (the low-floor body's foot where it
// drops between the bogies: [a, b]), bogies ([x, wheel mm, rack?]),
// colors { base, top (the band from top[0] up to the roof), band (the
// window band, [y0, y1, color]), skirt, mask (the cab's glass surround),
// roof }, windows (band() lists), wins ([y0, y1] high, [y0, y1] low),
// doors ([x, w] or [x, w, leaves]), doorFill, pans ([x, up]), boxes
// (roof boxes [x, w]), yellow ([a, b] first class's line), paint and
// extra (more, as functions of (c, L)).
function regio(c, o) {
  const L = c.L / F, col = o.colors;
  const hi = o.hi || [1.75, 2.95], lo = o.lo || [1.2, 2.95];
  return body(c, {
    roof: o.roof, sill: o.sill, nose: o.nose || null, base: col.base, endInset: o.endInset ?? 0.3, endR: o.endR ?? 0.35, dia: o.dia || [0.55, o.roof - 0.4],
    bottom: o.low ? [[o.low[0] - 0.3, o.sill], [o.low[0], o.lowY ?? 0.33], [o.low[1], o.lowY ?? 0.33], [o.low[1] + 0.3, o.sill]] : null,
    under: () => (o.bogies || []).map(([x, d = 760, rack = false, wb = 1.9]) => (rack ? rackBogie(x, wb, d, Math.min(o.sill, 0.6) + 0.05) : bogie(x, wb, d, Math.min(o.sill, 0.6) + 0.05, d > 900 ? "loco" : "car"))).join("") + (o.under ? o.under(c, L) : ""),
    paint: () => {
      let s = "";
      if (col.top) s += R(-0.5, col.top[0], L + 1, 3, col.top[1]);
      if (col.roof) s += R(-0.5, o.roof - (col.roofH ?? 0.35), L + 1, 1, col.roof);
      for (const [y0, y1, f] of col.bands || []) s += R(-0.5, y0, L + 1, y1 - y0, f);
      if (col.skirt) s += R(-0.5, 0, L + 1, col.skirt[0], col.skirt[1]);
      s += (o.yellow || []).map(([a, b]) => R(a, (o.yellowY ?? hi[1] + 0.09), b - a, 0.08, RHB.yellow)).join("");
      if (o.paint) s += o.paint(c, L);
      s += (o.windows || []).map((b) => band(b, hi, lo, { r: o.winR ?? 0.1 })).join("");
      if (o.nose && o.mask) s += P(o.mask[0], col.mask || "#1a1d22") + P(o.mask[1], GLASS);
      return s;
    },
    extra: (cc) => (o.doors || []).map(([x, w, leaves = 2]) => door(x, w, o.doorY?.[0] ?? 0.4, o.doorY?.[1] ?? 2.95, { leaves, fill: o.doorFill || "#d2d6d9", win: [0.2, 0.88], winW: leaves === 2 ? 0.36 : 0.4 })).join("") +
      (o.nose ? lamp(o.nose[1][0] - 0.02, o.lampY ?? 1.05, 0.14, 0.12) + autoCoupler(-0.05, 0.45, 0.6) : "") +
      (o.boxes || []).map(([x, w]) => roofBox(x, w, o.roof, 0.16)).join("") + (o.pans || []).map(([x, up = true]) => panto(x, o.roof, up && c.wires !== false, -1)).join("") +
      (o.extra ? o.extra(cc, L) : ""),
  });
}
// The standard Stadler regional cab of the 2010s (WSM, Walzer, Tango...):
// a rounded raked front.
const NOSE_ST = [[0.3, 0.32], [0.2, 0.9], [0.22, 1.6], [0.5, 2.6], ["q", 0.8, 3.45, 1.6, 3.75], ["q", 1.9, 3.85, 2.3, 3.85]];
const MASK_ST = [[[0.22, 1.5], [0.5, 2.6], ["q", 0.78, 3.4, 1.6, 3.68], [2.15, 3.68], [2.15, 1.5]], [[0.45, 1.75], [0.68, 2.6], ["q", 0.9, 3.25, 1.62, 3.5], [2.05, 3.5], [2.05, 1.75]]];

// ===================== MOB / GoldenPass =====================
// GoldenPass Express (GPX, since December 2022, Montreux-Interlaken Ost):
// Stadler's coaches with Alstom's gauge-changing bogies, Pininfarina's
// styling: 18.75 m over the couplers, 3.87 m high on the metre gauge, the
// body raised 185 mm on the standard gauge (Zweisimmen-Interlaken); the
// driving trailers Ast 181-184 (Prestige behind the cab, raised, then first
// class) at the Montreux end and ABst 381-384 (Prestige and second class)
// at the Interlaken end, As 191-194, Bs 281-284 and the low-floor BsNF
// 271-274 between. Photographs at Zweisimmen and Gstaad (2022-2024): deep
// navy, the windows set in a cream panel, a thin gold line at its foot
// that runs forward and sweeps up round the cab; the roof navy with roof
// windows over the seats; "GPX" in gold on the nose, the GOLDENPASS
// EXPRESS mark small under the windows, "PRESTIGE" by the first windows
// behind the cab, the class's numeral by the doors, each cab car's name
// (Gstaad, Montreux, ...) under its cab window. On the metre gauge a MOB Ge
// 4/4 8001-8004 hauls it, on the standard gauge a BLS Re 465 with an
// interface coach. (Window spacing from the photographs; the lower body
// is drawn without the shadowed sweep.)
const GPX = { navy: "#1b2348", cream: "#ece3cc", gold: "#c3a565", roof: 3.87, sill: 0.62, panel: [1.62, 3.12] };
const NOSE_GPX = [[0.25, 0.45], [0.15, 0.95], [0.3, 1.55], [0.75, 2.75], ["q", 1.0, 3.55, 1.85, 3.8], ["q", 2.1, 3.87, 2.6, 3.87]];
// The GOLDENPASS EXPRESS mark: the name in spaced capitals, a small gold
// wing either side, "EXPRESS" under it.
const gpxMark = (c, x, y, h) => M(c, x, y, `<text y="0" font-size="${n(h)}" text-anchor="middle" font-weight="600" letter-spacing="0.08em" font-family="${SANS}" fill="${GPX.gold}">GOLDENPASS</text>` +
  `<text y="${n(h * 1.1)}" font-size="${n(h * 0.62)}" text-anchor="middle" font-weight="500" letter-spacing="0.25em" font-family="${SANS}" fill="${GPX.gold}">EXPRESS</text>` +
  `<path d="M${n(-h * 4.1)} ${n(-h * 0.35)}h${n(h * 0.9)}M${n(h * 3.2)} ${n(-h * 0.35)}h${n(h * 0.9)}" stroke="${GPX.gold}" stroke-width="${n(h * 0.1)}"/>`);
function gpxCar(c, kind) {
  const L = c.L / F, cab = kind === "Ast" || kind === "ABst", lift = c.agency === "bls" ? 0.185 : 0;
  const first = kind === "Ast" || kind === "As";
  const k = first ? "1" : "2";
  const panes = cab ? [[3.25, 4.85], [5.0, 6.6], [7.05, 8.55], [8.75, 10.25], [10.45, 11.95], [12.15, 13.65], [13.85, 14.75]]
    : kind === "BsNF" ? [[1.6, 3.0], [3.2, 4.6], [6.5, 8.0], [8.2, 9.7], [9.9, 11.4], [11.6, 13.1], [13.3, 14.8], [15.0, 16.4]]
    : seq(1.6, (L - 4.3) / 8, 8).map((a) => [a, a + (L - 4.3) / 8 - 0.18]);
  const doors = cab ? [L - 2.0] : [0.55, L - 1.55];
  const inner = `<g transform="translate(0 ${n(ft(lift))})">` + body({ ...c, coupledL: false, coupledR: false }, {
    roof: GPX.roof, sill: GPX.sill, nose: cab ? NOSE_GPX : null, base: GPX.navy, endInset: 0.3, endR: 0.4, dia: [1.0, 3.5],
    paint: () => {
      const a = cab ? 3.05 : 1.4, b = cab ? 14.95 : L - 1.85;
      let s = RR(a, GPX.panel[0], b - a, GPX.panel[1] - GPX.panel[0], 0.18, GPX.cream);
      s += cab ? P([[3.05, 1.5], [L + 0.5, 1.5], [L + 0.5, 1.56], [3.05, 1.56], ["q", 1.55, 1.56, 1.25, 2.3], ["q", 1.05, 2.9, 1.15, 3.35], [1.1, 3.35], ["q", 1.0, 2.9, 1.18, 2.28], ["q", 1.5, 1.5, 3.05, 1.5]], GPX.gold)
        : R(-0.5, 1.5, L + 1, 0.06, GPX.gold);
      s += R(-0.5, 0.95, L + 1, 0.04, GPX.gold);
      s += band(panes, [1.82, 2.95], [1.82, 2.95], { r: 0.12 });
      s += (cab ? seq(3.3, 1.9, 6) : seq(1.6, (L - 4.0) / 6, 6)).map((x) => RR(x, 3.32, 1.55, 0.4, 0.08, "#6f7a95", 0.4)).join("");
      if (cab) s += P([[0.32, 1.6], [0.75, 2.75], ["q", 0.95, 3.4, 1.7, 3.7], [2.3, 3.7], [2.3, 1.6]], "#0e1226") + P([[0.62, 2.0], [0.88, 2.75], ["q", 1.05, 3.3, 1.75, 3.55], [2.15, 3.55], [2.15, 2.0]], GLASS) +
        RR(2.0, 1.95, 0.75, 1.05, 0.08, GASKET) + RR(2.05, 2.0, 0.65, 0.95, 0.06, GLASS);
      return s;
    },
    extra: (cc) => doors.map((x) => door(x, 0.95, 0.65, 3.05, { leaves: 1, fill: GPX.cream, win: [0.5, 0.86], winW: 0.38 })).join("") +
      (cab ? T(cc, 1.0, 1.25, 0.24, "GPX", GPX.gold, { weight: 700, italic: true }) + autoCoupler(-0.05, 0.45, 0.62) + lamp(0.18, 1.05, 0.14, 0.12) +
        T(cc, 3.3, 3.03, 0.09, "PRESTIGE", "#6f6247", { weight: 500, anchor: "start" }) + T(cc, 2.4, 1.78, 0.12, kind === "Ast" ? "Montreux" : "Gstaad", "#ffffff", { weight: 500, italic: true }) : "") +
      T(cc, cab ? L - 2.35 : L - 2.15, 2.65, 0.32, k, GPX.navy, { weight: 700 }) + gpxMark(cc, L * 0.5, 1.25, 0.16),
  }) + "</g>";
  const truckTop = 0.66 + lift;
  return [3.0, L - 3.0].map((x) => bogie(x, 1.8, 750, truckTop)).join("") + inner +
    (c.coupledL && !cab ? gangway(0, -1, 1.0 + lift, 3.5 + lift) : "") + (c.coupledR ? gangway(L, 1, 1.0 + lift, 3.5 + lift) : "");
}
// The GoldenPass Panoramic: an ABe 4/4 9300 and Be 4/4 9200 with the
// panorama coaches and a "Superpanoramic" control car at the Montreux end
// (Ast 116-117, 1985-1986, the driver raised over the passengers at the
// front; photograph of Ast 116 at Montreux, 2024): polished stainless
// sides, the windows running up into a glazed roof, the flat front navy
// above cream, a narrow door near the front. (About 17.5 m, estimated;
// the panorama coaches drawn alike with a door at each end.)
const NOSE_PANO = [[0.15, 0.55], [0.1, 1.4], [0.1, 3.3], ["q", 0.12, 3.75, 0.6, 3.8], [1.0, 3.8]];
const mobPano = (cab) => (c) => regio(c, { roof: 3.8, sill: 0.62, nose: cab ? NOSE_PANO : null, bogies: [[2.8, 750], [14.7, 750]],
  mask: [[[0.1, 1.75], [0.1, 3.3], ["q", 0.12, 3.62, 0.6, 3.65], [1.0, 3.65], [1.0, 1.75]], [[0.18, 1.85], [0.18, 3.25], ["q", 0.2, 3.52, 0.6, 3.55], [0.92, 3.55], [0.92, 1.85]]],
  colors: { base: "#c9cfd4", roof: "#8fa3b3", roofH: 0.45, skirt: [0.7, "#2e3138"], mask: "#1b2348" }, hi: [1.7, 3.3],
  paint: () => (cab ? R(-0.5, 0.62, 1.2, 1.1, "#e8e2d0") : "") + lines(seq(1.0, 0.35, 3).map((y) => [ft(-0.5), ft(y), ft(30), ft(y)]), "rgba(255,255,255,0.25)", 0.5),
  windows: [cab ? seq(3.4, 1.65, 8).map((x) => [x, x + 1.5]) : seq(1.9, 1.75, 8).map((x) => [x, x + 1.6])],
  doors: cab ? [[2.1, 0.75, 1]] : [[0.5, 0.9, 1], [16.1, 0.9, 1]], doorFill: "#1b2026", doorY: [0.65, 3.2] });

// MOB's Ge 4/4 8001-8004 (SLM and ABB, 1994-1995; 8003 sold to the RhB in
// 2019): the Ge 4/4 III's body, 16.0 m. 8002 (photograph at Gstaad, 2024)
// is in the GoldenPass night blue and champagne: navy above, champagne
// below the windows and on the nose's foot; "MOB" in gray on the
// champagne. (8001 and 8004 carry advertising; drawn as 8002.)
function mobGe44(c) {
  const navy = GPX.navy, cream = "#e6dfcd";
  return loco(c, {
    half: (cc, L) => body({ ...cc, coupledL: false, coupledR: false }, { roof: G3.roof, sill: G3.sill, nose: NOSE_G3, base: navy, endInset: 0.25,
      under: () => bogie(3.05, 2.6, 1070, G3.sill + 0.05, "loco") + R(5.5, 0.35, 2.6, 0.25, "currentColor", 0, 'opacity="0.85"'),
      paint: () => bands(L, [[G3.eave, 2, "#8c93a3"], [G3.eave - 0.06, 0.06, cream], [0, 1.95, cream], [0, G3.sill + 0.1, "#2d3138"]]) + R(-0.5, 1.4, 0.95, 0.55, "#14182a") +
        P([[0.35, 2.3], [0.92, 3.12], [1.6, 3.12], [1.6, 2.3]], "#0e1226") +
        RR(0.95, 2.05, 1.12, 0.87, 0.08, GASKET) + RR(1.0, 2.1, 1.02, 0.77, 0.06, GLASS) + Ln(1.5, 2.1, 1.5, 2.87, GASKET, 0.6),
      extra: () => locoFront(0.24, G3.sill, 1.0) }),
    side: (cc, L) => R(2.56, 1.2, 0.62, 1.68, "none", 0.5) + RR(2.62, 1.75, 0.5, 1.05, 0.06, GLASS) +
      panto(3.85, G3.roof, true, 1) + panto(L - 3.85, G3.roof, c.wires !== false, -1) + [4.3, 6.0, 7.7, 9.4].map((x) => RR(x, G3.roof - 0.03, 1.5, 0.12, 0.03, "#7c8796", 0.4)).join("") +
      T(cc, L * 0.72, 1.42, 0.42, "MOB", "#6b6f78", { weight: 400 }),
  });
}

// MOB's Stadler cars (the "Westschweizer Meterspurzüge" family, 2016):
// ABe 4/4 9301-9304 and Be 4/4 9201-9204 (and 9205-9206, 9305-9306 from
// the Chemins de fer du Jura, December 2025), single cars of 20.26 m, Bo'Bo',
// a cab at each end... each runs as a pair (the ABe at the Montreux end,
// first class behind its cab), hauling the GoldenPass Panoramic and
// regional trains. Photographs at Montreux (2024): champagne, the window
// band and the upper body night blue, the night blue sweeping down round
// the cab; first class's yellow line; "MOB" with its emblem and the unit's
// name (ALPINA, ...) on the champagne; two pantographs.
const MOBC = { navy: "#1b2348", cream: "#e8e2d2" };
function mobWsm(c, first) {
  return regio(c, { roof: 3.85, sill: 0.45, nose: NOSE_ST, low: [8.7, 12.3], bogies: [[3.2, 810, false, 2.0], [L_WSM - 3.2, 810, false, 2.0]], mask: MASK_ST,
    colors: { base: MOBC.cream, top: [1.62, MOBC.navy], roof: "#2b3254", skirt: [0.45, "#2e3138"], mask: "#10142a" },
    hi: [1.62, 3.05], lo: [1.62, 3.05],
    // The champagne line along the roof's edge, curving down behind the
    // cab's side window to the champagne below.
    paint: (cc, L) => R(3.6, 3.38, L - 7.2, 0.07, MOBC.cream) + P([[3.6, 3.38], [3.6, 3.45], ["q", 3.0, 3.45, 2.85, 2.6], [2.75, 1.62], [2.68, 1.62], [2.78, 2.6], ["q", 2.92, 3.38, 3.6, 3.38]], MOBC.cream) +
      P([[L - 3.6, 3.38], [L - 3.6, 3.45], ["q", L - 3.0, 3.45, L - 2.85, 2.6], [L - 2.75, 1.62], [L - 2.68, 1.62], [L - 2.78, 2.6], ["q", L - 2.92, 3.38, L - 3.6, 3.38]], MOBC.cream) +
      RR(2.0, 1.75, 0.55, 1.2, 0.08, GASKET) + RR(L - 2.55, 1.75, 0.55, 1.2, 0.08, GASKET),
    windows: [[[4.0, 5.4], [5.6, 7.0], [7.2, 8.6]], [[9.0, 10.3, true]], [[12.3, 13.6], [13.8, 15.1], [15.3, 16.6]]], doors: [[10.6, 1.4]],
    yellow: first ? [[4.0, 8.6]] : [], yellowY: 3.13, pans: [[5.0, false], [L_WSM - 5.0, true]], boxes: [[6.5, 1.6], [12.0, 1.6]],
    extra: (cc, L) => T(cc, 6.8, 1.0, 0.42, "MOB", "#3b4050", { weight: 400 }) + T(cc, 1.6, 0.58, 0.14, first ? "ALPINA" : "", "#1b2348", { weight: 700 }) });
}
const L_WSM = 20.26;
// The cab at each end: drawn twice, a mirror for the right end.
const twoCabs = (draw) => (c) => {
  const id = newId(), half = draw({ ...c, coupledL: false, coupledR: false });
  return `<clipPath id="${id}"><rect x="-5" y="-5" width="${n(c.L / 2 + 5)}" height="40"/></clipPath><g clip-path="url(#${id})">${half}</g>` +
    `<g transform="matrix(-1 0 0 1 ${n(c.L)} 0)"><g clip-path="url(#${id})">${draw({ ...c, mirrored: !c.mirrored, coupledL: false, coupledR: false })}</g></g>`;
};

// ===================== The other metre-gauge railways =====================
// Aargau Verkehr (AVA): the Bremgarten-Dietikon line (S 17) and the
// Wynental- und Suhrentalbahn (S 14). Photographs of BDWM 5011 at Dietikon
// (2023) and of Saphir 43 at Schöftland (2025): AVA's paint, night blue
// over the cab half of each end car and white beyond, the AVA mark across
// the blue in huge white strokes (a bar, a V, a slash), its small mark
// under the windscreen. The Diamant (ABe 4/8 5001-5014, Stadler 2009-2011,
// some lengthened to four cars): 37.5 m in three cars, the end cars on a
// motor bogie and the short low-floor middle car; the Saphir (ABe 4/12,
// 2019, 60 m) and Saphir II (ABe 4/8, 2025, 40 m): 20 m cars. (Car
// lengths and windows estimated from the photographs.)
const AVA = { blue: "#262a6e", white: "#f1f3f5" };
// The AVA mark in white strokes, h tall, its left end at x, foot at y.
const avaMark = (x, y, h) => {
  const k = h / 2.2;
  return P([[x, y + 1.0 * k], [x + 0.95 * k, y + 1.0 * k], [x + 0.95 * k, y + 1.32 * k], [x, y + 1.32 * k]], "#ffffff") +
    P([[x + 1.05 * k, y + 2.2 * k], [x + 1.45 * k, y + 2.2 * k], [x + 1.85 * k, y + 0.5 * k], [x + 2.25 * k, y + 2.2 * k], [x + 2.65 * k, y + 2.2 * k], [x + 2.05 * k, y], [x + 1.65 * k, y]], "#ffffff") +
    P([[x + 2.75 * k, y], [x + 3.15 * k, y], [x + 3.75 * k, y + 2.2 * k], [x + 3.35 * k, y + 2.2 * k]], "#ffffff");
};
const NOSE_AVA = [[0.35, 0.35], [0.2, 0.95], [0.25, 1.7], [0.55, 2.7], ["q", 0.85, 3.5, 1.6, 3.8], ["q", 1.9, 3.9, 2.3, 3.9]];
function avaEnd(c, { len, blueTo, doors, windows, first, saphir = false }) {
  return regio(c, { roof: 3.9, sill: 0.4, nose: NOSE_AVA, low: [doors[0][0] - 1.0, len - 0.3], bogies: [[2.9, 810, false, 2.0]], mask: MASK_ST,
    colors: { base: AVA.white, skirt: [0.4, "#2a2d33"], mask: "#14172a" },
    paint: () => P([[-0.5, 0], [blueTo + 0.6, 0], [blueTo, 4.2], [-0.5, 4.2]], AVA.blue) + R(-0.5, 3.55, len + 1, 1, "#c9ced3") +
      (saphir ? P([[0.2, 1.3], [0.55, 2.7], ["q", 0.85, 3.55, 1.65, 3.85], [2.4, 3.85], [2.4, 3.45], [1.7, 3.45], ["q", 1.0, 3.2, 0.8, 2.3], [0.6, 1.3]], "#f1f3f5") : ""),
    // The mark as seen with the cab at the right, turned for the cab at the
    // left (bar, V, slash from the rear toward the cab), stretched 1.35
    // times its own width as on the cars.
    extra: (cc) => `<g transform="translate(${n(ft(8.4))} 0) scale(-1.35 1) translate(${n(-ft(2.6))} 0)">${avaMark(2.6, 0.55, 2.55)}</g>` + (first ? R(doors[0][0], 2.95, doors[0][1], 0.2, "#f3c300") : ""),
    windows, doors, yellow: first ? [[doors[0][0] - 2.6, doors[0][0] - 0.1]] : [], boxes: [[4.0, 2.0], [len - 6.0, 2.4]], pans: first ? [] : [[len - 4.0, true]] });
}
const avaMid = (c, len) => regio(c, { roof: 3.9, sill: 0.4, low: [0.3, len - 0.3], colors: { base: AVA.white, skirt: [0.4, "#2a2d33"] },
  paint: () => R(-0.5, 3.55, len + 1, 1, "#c9ced3"), windows: [[[0.8, 2.2, true], [2.4, 3.8, true]], [[len - 3.8, len - 2.4, true], [len - 2.2, len - 0.8, true]]],
  doors: [[len / 2 - 0.7, 1.4]], boxes: [[1.0, len - 2.0]] });
const L_DIA = 14.0, L_DIAM = 9.5, L_SAPH = 20.0;
const avaDiaEnd = (first) => (c) => avaEnd(c, { len: L_DIA, blueTo: 11.2, first, doors: [[9.2, 1.4]],
  windows: [[[2.5, 3.6]], [[4.0, 5.6, true], [5.8, 7.4, true]], [[10.9, 12.2, true], [12.4, 13.6, true]]] });
const avaSaphEnd = (first) => (c) => avaEnd(c, { len: L_SAPH, blueTo: 10.0, first, saphir: true, doors: [[6.9, 1.4], [13.3, 1.4]],
  windows: [[[2.6, 3.6]], [[4.2, 6.6, true]], [[8.5, 9.9, true], [10.1, 11.5, true]], [[14.9, 16.3, true], [16.5, 17.9, true]]] });
const avaDiaMid = (c) => avaMid(c, L_DIAM);
const avaSaphMid = (c) => avaMid(c, L_SAPH);

// FLP (Lugano-Ponte Tresa, S 60): nine Stadler Tramlink Be 6/8 51-59
// (2021): seven modules, about 45 m (each half drawn as one 22.5 m piece,
// its module joints in black); white, the doors orange, a thin orange line
// over the windows, "FLP" in orange under them. Photograph of 51 at Agno
// (2021). (Module lengths estimated.)
const NOSE_TL = [[0.25, 0.32], [0.15, 1.0], [0.2, 2.6], ["q", 0.3, 3.35, 1.0, 3.55], ["q", 1.4, 3.62, 1.8, 3.62]];
const flpHalf = (c) => regio(c, { roof: 3.62, sill: 0.3, nose: NOSE_TL, bogies: [[2.2, 600], [12.5, 600], [21.5, 600]],
  mask: [[[0.15, 1.45], [0.2, 2.6], ["q", 0.3, 3.25, 1.0, 3.45], [1.6, 3.45], [1.6, 1.45]], [[0.35, 1.65], [0.4, 2.6], ["q", 0.48, 3.12, 1.05, 3.3], [1.5, 3.3], [1.5, 1.65]]],
  colors: { base: "#f4f5f6", skirt: [0.3, "#3a3d42"], bands: [[3.02, 3.07, "#f07a1d"]] }, hi: [1.4, 2.85], lo: [1.4, 2.85],
  paint: () => [4.4, 10.5, 15.0].map((x) => R(x, 0.3, 0.42, 3.3, "#2a2c30")).join(""),
  windows: [[[2.4, 3.9]], [[6.8, 8.9]], [[11.0, 11.8]], [[15.6, 17.3]], [[19.9, 21.2]]], doors: [[5.0, 1.3], [9.0, 1.3], [12.0, 1.3], [17.6, 1.3]], doorFill: "#f07a1d",
  doorY: [0.32, 2.95], pans: [[11.0, true]], boxes: [[2.5, 1.6], [16.0, 3.0]],
  extra: (cc) => [3.2, 8.0, 18.5].map((x) => T(cc, x, 1.0, 0.24, "FLP", "#f07a1d", { weight: 700 })).join("") });

// The Mont-Blanc Express (TMR, Martigny-Le Châtelard-Vallorcine, R 85):
// seven new Stadler rack units, TMR's Beh 4/8 91-97 with SNCF's Z 891-897,
// from 2025 (Wikipedia: EVN 90 85 838 0891-0897). Photograph of Z 891 at
// Martigny (2025): white, the French end car in the Auvergne-Rhône-Alpes
// region's blue, the Swiss end red, "Mont-Blanc Express" over a mountain
// line in white. (Three cars of about 15.5 m each, estimated.)
const tmrEnd = (fieldCol, name) => (c) => regio(c, { roof: 3.85, sill: 0.42, nose: NOSE_ST, low: [8.0, 15.2], bogies: [[2.9, 790, true, 2.2]], mask: MASK_ST,
  colors: { base: "#f4f5f7", skirt: [0.42, "#2e3237"], mask: "#151a22" },
  paint: () => P([[3.2, 0], [15.6, 0], [15.6, 3.6], [6.2, 3.6]], fieldCol) + R(-0.5, 3.6, 17, 1, "#cbd0d5"),
  windows: [[[2.4, 3.4]], [[4.2, 5.7], [5.9, 7.4]], [[10.2, 11.7, true], [11.9, 13.4, true]]], doors: [[8.3, 1.3]], boxes: [[4.0, 2.4]],
  extra: (cc) => (name ? T(cc, 11.0, 1.1, 0.34, "Mont-Blanc Express", "#ffffff", { weight: 500, italic: true }) : "") });
const tmrMid = (c) => regio(c, { roof: 3.85, sill: 0.42, low: [0.3, 9.0], bogies: [[12.2, 790, true, 2.2]], colors: { base: "#f4f5f7", skirt: [0.42, "#2e3237"] },
  paint: () => P([[4.0, 0], [15.6, 0], [15.6, 3.6], [8.5, 3.6]], "#3f8fd6") + R(-0.5, 3.6, 17, 1, "#cbd0d5"),
  windows: [[[0.8, 2.3, true], [2.5, 4.0, true]], [[6.4, 7.9, true]], [[9.8, 11.3], [11.5, 13.0], [13.2, 14.7]]], doors: [[4.6, 1.3]], pans: [[13.0, true]], boxes: [[9.5, 3.0]] });

// RBS (Regionalverkehr Bern-Solothurn): RBS orange all over, the windows
// in black frames, the doors silver-white, the roof's equipment gray; the
// S-Bahn's blue panel with the yellow S behind the cab door; white "RBS"
// on the front. NExT RABe 4/12 21-34 (Stadler 2009-2013, the RE 5
// Bern-Solothurn): three 20 m cars, 60 m, 3.97 m high, first class in the
// Bern-end car; its name "NExT" in white low by the cab. Worbla Be 4/10
// 01-16 (2018-2024, S 7 and S 9): four articulated cars on Jakobs bogies,
// 60 m, the cab's big round side window, "Be 4/10" and "worbla" with the
// unit's number in white low by the cab. Photographs of NExT 26 at
// Zollikofen (2018) and of worbla 12 (2025). (Car lengths and windows
// estimated from photographs.)
const RBSC = { orange: "#f25a0c", roof: "#5e646a" };
const sPanel = (x, y = 1.65) => R(x, y, 0.55, 1.25, "#283a8c") + T({ mirrored: false }, x + 0.27, y + 0.7, 0.62, "S", "#f5c400", { weight: 800 });
const NOSE_NEXT = [[0.3, 0.32], [0.2, 0.9], [0.2, 3.2], ["q", 0.25, 3.82, 0.9, 3.92], [1.4, 3.97]];
function rbsNext(c, first) {
  return regio(c, { roof: 3.97, sill: 0.4, nose: NOSE_NEXT, low: [5.0, 15.6], bogies: [[2.7, 760, false, 2.0]],
    mask: [[[0.2, 1.25], [0.2, 3.3], ["q", 0.26, 3.75, 0.9, 3.8], [1.25, 3.8], [1.25, 1.25]], [[0.32, 1.4], [0.32, 3.25], ["q", 0.36, 3.65, 0.9, 3.68], [1.15, 3.68], [1.15, 1.4]]],
    colors: { base: RBSC.orange, roof: RBSC.roof, roofH: 0.25, skirt: [0.4, "#3a3d42"], mask: "#16181b" }, hi: [1.55, 2.95], lo: [1.35, 2.95],
    paint: () => sPanel(3.25), windows: [[[2.05, 2.6]], [[3.9, 5.1]], [[7.4, 8.6, true], [8.8, 10.0, true], [10.2, 11.4, true], [11.6, 12.8, true]], [[16.4, 17.6], [17.8, 19.0]]],
    doors: [[5.7, 1.3], [14.6, 1.3]], doorFill: "#eef0f2", pans: [[16.0, true]], boxes: [[4.0, 2.6]], yellow: first ? [[7.4, 12.8]] : [],
    extra: (cc) => T(cc, 1.9, 0.75, 0.18, "NExT", "#ffffff", { weight: 600 }) + T(cc, 0.7, 1.05, 0.13, "&lt;RBS&gt;", "#ffffff", { weight: 800 }) });
}
const rbsNextMid = (c) => regio(c, { roof: 3.97, sill: 0.4, bogies: [[2.7, 760, false, 2.0], [17.3, 760, false, 2.0]], colors: { base: RBSC.orange, roof: RBSC.roof, roofH: 0.25, skirt: [0.4, "#3a3d42"] },
  hi: [1.55, 2.95], windows: [[[0.8, 2.0], [2.2, 3.4]], [[6.4, 7.6], [7.8, 9.0], [11.0, 12.2], [12.4, 13.6]], [[16.6, 17.8], [18.0, 19.2]]], doors: [[4.4, 1.3], [14.4, 1.3]], doorFill: "#eef0f2", boxes: [[8.0, 4.0]] });
const NOSE_WOR = [[0.35, 0.32], [0.15, 0.9], [0.1, 2.0], [0.25, 3.0], ["q", 0.45, 3.8, 1.4, 3.92], [2.0, 3.98]];
const rbsWorEnd = (c) => regio(c, { roof: 3.98, sill: 0.4, nose: NOSE_WOR, low: [3.5, 14.7], bogies: [[2.2, 760, false, 2.0], [15.0, 680]],
  colors: { base: RBSC.orange, roof: RBSC.roof, roofH: 0.25, skirt: [0.3, "#3a3d42"], mask: "#16181b" }, hi: [1.4, 2.95], lo: [1.4, 2.95],
  // The nose cap's big round side window (its glass running into the
  // windscreen), the cab door's narrow window, the S panel.
  mask: [[[0.12, 1.75], [0.18, 2.9], ["q", 0.35, 3.5, 0.9, 3.55], ["q", 1.95, 3.55, 1.95, 2.55], ["q", 1.95, 1.4, 0.95, 1.3], ["q", 0.3, 1.3, 0.12, 1.75]],
    [[0.22, 1.82], [0.28, 2.88], ["q", 0.42, 3.42, 0.92, 3.45], ["q", 1.83, 3.45, 1.83, 2.55], ["q", 1.83, 1.5, 0.95, 1.42], ["q", 0.38, 1.42, 0.22, 1.82]]],
  paint: () => Ln(2.1, 0.3, 2.1, 3.9, "rgba(0,0,0,0.5)", 0.6) + R(3.05, 1.5, 1.0, 1.45, "#283a8c") + T({ mirrored: false }, 3.45, 2.3, 0.75, "S", "#f5c400", { weight: 800 }) +
    RR(2.35, 1.6, 0.55, 1.35, 0.1, GASKET) + RR(2.4, 1.65, 0.45, 1.25, 0.08, GLASS), windows: [[[4.1, 5.9, true]], [[8.4, 9.9, true], [10.1, 11.6, true]], [[13.6, 14.4, true]]],
  doors: [[6.5, 1.4], [12.0, 1.4]], doorFill: "#e8eaec", boxes: [[3.0, 4.0]],
  extra: (cc) => T(cc, 2.6, 0.62, 0.26, "worbla", "#ffffff", { weight: 500 }) + T(cc, 2.75, 0.95, 0.2, "Be 4/10", "#ffffff", { weight: 500 }) });
const rbsWorMid = (c) => regio(c, { roof: 3.98, sill: 0.4, low: [0.3, 14.7], bogies: [[15.0, 680]], colors: { base: RBSC.orange, roof: RBSC.roof, roofH: 0.25, skirt: [0.3, "#3a3d42"] },
  hi: [1.4, 2.95], lo: [1.4, 2.95], windows: [[[0.6, 2.1, true], [2.3, 3.8, true]], [[6.4, 7.9, true], [8.1, 9.6, true]], [[11.9, 13.4, true]]], doors: [[4.4, 1.4], [10.2, 1.4]], doorFill: "#e8eaec",
  pans: c.index % 2 ? [] : [[7.5, true]], boxes: [[2.0, 3.0], [10.0, 3.0]] });

// Appenzeller Bahnen (AB): AB red, a black window band with a thin white
// line along its top edge, the doors silver, the roof gray; "AB Appenzeller
// Bahnen" in white; first class's yellow line at the roof's edge. Walzer
// ABe 4/12 1001-1005 (Stadler 2018, Gossau-Appenzell-Wasserauen): three
// cars, 58.81 m; photograph at Gonten (2018). Tango ABe 8/12 4001-4011
// (2018-2019, St. Gallen-Appenzell/Trogen): two halves of three modules,
// 52.6 m, 2.40 m wide, a tram's cab; photograph at St. Gallen (2021).
const ABC = { red: "#e2231a", roof: "#9aa0a6" };
const abLogo = (c, x, y, h) => M(c, x, y, `<rect x="${n(-h * 0.55)}" y="${n(-h * 0.5)}" width="${n(h * 1.1)}" height="${n(h)}" rx="${n(h * 0.15)}" fill="none" stroke="#ffffff" stroke-width="${n(h * 0.1)}"/>` +
  `<text y="${n(h * 0.33)}" font-size="${n(h * 0.75)}" text-anchor="middle" font-weight="800" font-style="italic" font-family="${SANS}" fill="#ffffff">AB</text>` +
  `<text x="${n(h * 0.75)}" y="${n(h * 0.3)}" font-size="${n(h * 0.62)}" font-weight="500" font-family="${SANS}" fill="#ffffff">Appenzeller Bahnen</text>`);
const abBand = (L) => R(-0.5, 1.55, L + 1, 1.45, "#16181b") + R(-0.5, 3.06, L + 1, 0.06, "#ffffff");
const abWalzerEnd = (first) => (c) => regio(c, { roof: 3.85, sill: 0.4, nose: NOSE_ST, low: [9.0, 19.3], bogies: [[3.0, 760, false, 2.0]], mask: MASK_ST,
  colors: { base: ABC.red, skirt: [0.4, "#2e3135"], mask: "#16181b" }, hi: [1.6, 2.95], lo: [1.6, 2.95],
  paint: (cc, L) => abBand(L) + (first ? R(9.0, 3.55, 10.3, 0.07, RHB.yellow) : ""), windows: [[[3.0, 4.4], [4.6, 6.0], [6.2, 7.6], [7.8, 8.6]], [[10.7, 12.0, true], [12.2, 13.5, true]], [[15.1, 16.4, true], [16.6, 17.9, true]]],
  doors: [[13.6, 1.3]], doorFill: "#dfe2e5", boxes: [[3.5, 3.0]], extra: (cc) => abLogo(cc, 9.3, 1.05, 0.3) });
const abWalzerMid = (c) => regio(c, { roof: 3.85, sill: 0.4, low: [0.3, 19.3], colors: { base: ABC.red, skirt: [0.4, "#2e3135"] }, hi: [1.6, 2.95], lo: [1.6, 2.95],
  paint: (cc, L) => abBand(L), windows: [[[0.8, 2.1, true], [2.3, 3.6, true], [3.8, 5.1, true], [5.3, 6.6, true]], [[9.4, 10.7, true], [10.9, 12.2, true], [12.4, 13.7, true], [13.9, 15.2, true]], [[17.0, 18.3, true]]],
  doors: [[7.0, 1.3], [15.5, 1.3]], doorFill: "#dfe2e5", pans: [[9.5, true]], boxes: [[2.0, 4.0], [11.0, 4.0]], extra: (cc) => abLogo(cc, 10.5, 1.05, 0.3) });
const NOSE_TANGO = [[0.15, 0.25], [0.05, 0.8], [0.1, 1.6], [0.4, 2.9], ["q", 0.7, 3.62, 1.6, 3.72], [2.0, 3.72]];
const abTangoHalf = (c) => regio(c, { roof: 3.72, sill: 0.35, nose: NOSE_TANGO, bogies: [[3.0, 680], [12.8, 680], [24.5, 680]],
  mask: [[[0.08, 1.2], [0.42, 2.85], ["q", 0.7, 3.5, 1.6, 3.6], [2.4, 3.6], [2.6, 1.2]], [[0.25, 1.4], [0.52, 2.8], ["q", 0.78, 3.38, 1.6, 3.46], [2.3, 3.46], [2.45, 1.4]]],
  colors: { base: ABC.red, roof: "#b9bec4", roofH: 0.25, skirt: [0.35, "#2e3135"], mask: "#16181b" }, hi: [1.45, 2.95], lo: [1.45, 2.95],
  paint: (cc, L) => R(2.6, 1.42, L, 1.55, "#16181b") + R(2.6, 3.05, L, 0.12, "#e7e9eb") + [9.0, 16.0].map((x) => R(x, 0.35, 0.35, 3.3, "#1d1f22")).join(""),
  windows: [[[3.0, 4.6], [4.8, 6.4], [6.6, 8.2]], [[10.6, 12.0], [12.2, 13.6], [13.8, 15.4]], [[18.2, 19.8], [20.0, 21.6], [21.8, 23.4]]], doors: [[8.4, 1.3], [16.6, 1.3], [24.2, 1.3]], doorFill: "#dfe2e5",
  pans: [[12.5, true]], boxes: [[4.0, 3.0], [18.0, 3.0]], extra: (cc) => abLogo(cc, 6.3, 1.05, 0.3) + T(cc, 3.2, 1.05, 0.2, "Fähnern", "#ffffff", { weight: 500 }) });

// MBC (Morges-Bière-Cossonay): the Stadler Be 4/4 31-38 (2015-2016, the
// Westschweizer family's cab), with the low-floor B 2065-2067 between two
// of them. Photographs near Vufflens-le-Château (2020): cream white, a
// green wave along the foot of the side, the doors green, the towns' names
// along the line in green capitals over the motor cars' sides (left out:
// too small to read at this scale); the wave and "MBC" in green on the
// trailers.
const MBCC = { white: "#eef0e6", green: "#1e9a49" };
const mbcWave = (L) => `<path d="M${n(ft(-0.5))} ${n(ft(1.1))}${seq(0, 4.2, Math.ceil(L / 4.2) + 1).map((x) => `Q${n(ft(x + 1.05))} ${n(ft(1.55))} ${n(ft(x + 2.1))} ${n(ft(1.1))}Q${n(ft(x + 3.15))} ${n(ft(0.65))} ${n(ft(x + 4.2))} ${n(ft(1.1))}`).join("")}L${n(ft(L + 2))} 0L${n(ft(-0.5))} 0Z" fill="${MBCC.green}"/>`;
const mbcBe = (c) => regio(c, { roof: 3.85, sill: 0.45, nose: NOSE_ST, low: [6.6, 11.8], bogies: [[3.2, 810, false, 2.0], [17.06, 810, false, 2.0]], mask: MASK_ST,
  colors: { base: MBCC.white, roof: "#9aa0a6", roofH: 0.25, skirt: [0.45, "#2e3135"], mask: "#16181b" }, hi: [1.62, 3.05], lo: [1.62, 3.05],
  paint: (cc, L) => R(-0.5, 0.45, 2.0, 0.55, MBCC.green),
  windows: [[[3.2, 4.6], [4.8, 6.2], [6.4, 7.8]], [[9.9, 11.2, true]], [[12.3, 13.6], [13.8, 15.1], [15.3, 16.6]]], doors: [[8.3, 1.4]], doorFill: MBCC.green, pans: [[5.0, true]], boxes: [[12.0, 2.4]] });
const mbcB = (c) => regio(c, { roof: 3.85, sill: 0.45, low: [3.0, 15.0], bogies: [[2.2, 680], [16.3, 680]], colors: { base: MBCC.white, roof: "#9aa0a6", roofH: 0.25, skirt: [0.45, "#2e3135"] },
  hi: [1.62, 3.05], lo: [1.4, 3.05], paint: (cc, L) => mbcWave(L), windows: [[[3.3, 4.6, true], [4.8, 6.1, true], [6.3, 7.6, true]], [[10.0, 11.3, true], [11.5, 12.8, true], [13.0, 14.3, true]]],
  doors: [[8.2, 1.3]], doorFill: MBCC.green, extra: (cc, L) => T(cc, L - 3.0, 2.2, 0.36, "MBC", MBCC.green, { weight: 800 }) });

// NStCM (Nyon-St-Cergue-Morez): ABe 4/8 401/402-419/420 (Stadler 2015,
// 2021-2022), two 17.7 m cars; photograph at La Givrine (2022): red, the
// cab front white round the windscreen and lamps, a dark gray band along
// the foot of the side; doors white; first class behind one cab.
const nstcm = (first) => (c) => regio(c, { roof: 3.85, sill: 0.45, nose: NOSE_ST, low: [8.0, 17.4], bogies: [[3.1, 810, false, 2.0]],
  mask: [[[0.32, 1.95], [0.5, 2.6], ["q", 0.72, 3.25, 1.35, 3.55], [1.35, 1.95]], [[0.45, 2.05], [0.6, 2.6], ["q", 0.8, 3.15, 1.28, 3.42], [1.28, 2.05]]],
  colors: { base: "#d9261e", roof: "#c3c8cd", roofH: 0.2, skirt: [0.95, "#4a4f55"], mask: "#16181b" }, hi: [1.62, 3.0], lo: [1.62, 3.0],
  // The white surround of the windscreen and lamps, the cab's side window
  // arched in black.
  paint: () => P([[0.2, 1.05], [0.22, 1.6], [0.5, 2.6], ["q", 0.8, 3.45, 1.6, 3.78], [2.6, 3.85], [2.55, 3.6], ["q", 1.55, 3.3, 1.15, 1.05]], "#f2f3f4") +
    P([[1.75, 1.45], [2.7, 1.45], [2.7, 3.35], ["q", 2.0, 3.2, 1.75, 1.45]], "#16181b") + P([[1.95, 1.6], [2.6, 1.6], [2.6, 3.15], ["q", 2.1, 3.0, 1.95, 1.6]], GLASS),
  windows: [[[3.0, 3.35]], [[4.0, 5.2], [5.4, 6.6], [6.8, 8.0]], [[10.2, 11.5, true], [11.7, 13.0, true]], [[14.6, 15.9, true], [16.1, 17.2, true]]], doors: [[8.6, 1.3]], doorFill: "#eef0f2",
  yellow: first ? [[4.0, 8.0]] : [], pans: first ? [] : [[14.0, true]], boxes: [[4.0, 2.4]], extra: (cc) => T(cc, 0.7, 1.15, 0.12, "NStCM", "#d9261e", { weight: 600 }) });

// LEB (Lausanne-Echallens-Bercher): Be 4/8 61-66 (Stadler 2019-2020, the
// Worbla's sister), three cars, 44.8 m; photograph at Echallens (2023):
// light silver, a green line along the top of the windows that sweeps down
// round the cab, the doors green; the dark gray skirt.
const NOSE_LEB = [[0.3, 0.32], [0.15, 0.9], [0.12, 2.0], [0.28, 3.0], ["q", 0.5, 3.75, 1.4, 3.88], [2.0, 3.92]];
const lebEnd = (c) => regio(c, { roof: 3.92, sill: 0.4, nose: NOSE_LEB, low: [3.0, 14.7], bogies: [[2.3, 760, false, 2.0], [15.0, 680]], mask: [[[0.12, 1.3], [0.24, 2.9], ["q", 0.45, 3.6, 1.3, 3.72], [2.4, 3.72], [2.4, 1.3]], [[0.26, 1.45], [0.36, 2.85], ["q", 0.52, 3.46, 1.3, 3.58], [2.25, 3.58], [2.25, 1.45]]],
  colors: { base: "#e4e7ea", roof: "#4a4f55", roofH: 0.3, skirt: [0.4, "#3a3d42"], mask: "#1a1d22" }, hi: [1.55, 2.95], lo: [1.4, 2.95],
  paint: (cc, L) => R(-0.5, 0.5, L + 1, 0.08, "#5bb531") + R(2.3, 3.1, L, 0.12, "#5bb531") + P([[0.2, 1.1], [0.35, 1.1], [1.0, 2.6], ["q", 1.5, 3.1, 2.4, 3.1], [2.4, 3.22], ["q", 1.4, 3.22, 0.9, 2.6]], "#5bb531"),
  windows: [[[2.9, 4.4]], [[6.5, 8.0, true], [8.2, 9.7, true]], [[12.1, 13.6, true]]], doors: [[4.8, 1.3], [10.4, 1.3]], doorFill: "#5bb531", boxes: [[3.0, 3.6]] });
const lebMid = (c) => regio(c, { roof: 3.92, sill: 0.4, low: [0.3, 14.7], bogies: [[15.0, 680]], colors: { base: "#e4e7ea", roof: "#4a4f55", roofH: 0.3, skirt: [0.4, "#3a3d42"] },
  hi: [1.55, 2.95], lo: [1.4, 2.95], paint: (cc, L) => R(-0.5, 0.5, L + 1, 0.08, "#5bb531") + R(-0.5, 3.1, L + 1, 0.12, "#5bb531"),
  windows: [[[0.7, 2.2, true], [2.4, 3.9, true]], [[6.3, 7.8, true], [8.0, 9.5, true]], [[11.9, 13.4, true]]], doors: [[4.4, 1.3], [10.1, 1.3]], doorFill: "#5bb531", pans: [[7.0, true]], boxes: [[2.0, 3.0]] });

// The Jungfrau railways and the other rack lines (photographs 2019-2026;
// car lengths, where not published, estimated from the photographs).
// BOB ABeh 4/8 331-345 (Stadler, from 2024): three cars, 50.71 m, the
// pantographs on the middle car, rack on every bogie; royal blue, the
// window band in yellow panels, a white line under the windows with
// "Berner Oberland-Bahn" in white, the cab's lower front yellow.
const BOBC = { blue: "#1d3a8f", yellow: "#f5c400" };
const NOSE_BOB = [[0.3, 0.32], [0.2, 0.9], [0.22, 1.7], [0.45, 2.7], ["q", 0.75, 3.55, 1.6, 3.85], [2.3, 3.95]];
const bobEnd = (first) => (c) => regio(c, { roof: 3.95, sill: 0.42, nose: NOSE_BOB, low: [8.0, 16.2], bogies: [[2.9, 760, true, 2.2]], mask: MASK_ST,
  colors: { base: BOBC.blue, roof: "#5a6070", roofH: 0.2, skirt: [0.42, "#22283a"], mask: "#16181b" }, hi: [1.75, 3.05], lo: [1.75, 3.05],
  paint: (cc, L) => R(2.7, 1.7, L - 2.7, 1.4, BOBC.yellow) + R(-0.5, 0.95, 1.6, 0.6, BOBC.yellow) + R(2.4, 1.36, L - 2.4, 0.08, "#ffffff"),
  windows: [[[3.0, 4.6], [4.8, 6.4]], [[9.6, 11.0, true], [11.2, 12.6, true], [12.8, 14.2, true], [14.4, 15.8, true]]], doors: [[7.0, 1.3]], doorFill: "#d6dadd",
  yellow: [], boxes: [[3.0, 3.4]], extra: (cc) => T(cc, 4.8, 1.12, 0.3, "Berner Oberland-Bahn", "#ffffff", { weight: 500, italic: true }) });
const bobMid = (c) => regio(c, { roof: 3.95, sill: 0.42, low: [0.3, 17.4], bogies: [[3.0, 760, true, 2.2], [14.7, 760, true, 2.2]], colors: { base: BOBC.blue, roof: "#5a6070", roofH: 0.2, skirt: [0.42, "#22283a"] },
  hi: [1.75, 3.05], lo: [1.75, 3.05], paint: (cc, L) => R(-0.5, 1.7, L + 1, 1.4, BOBC.yellow) + R(-0.5, 1.36, L + 1, 0.08, "#ffffff"),
  windows: [[[0.8, 2.3, true], [2.5, 4.0, true], [4.2, 5.7, true]], [[9.0, 10.5, true], [10.7, 12.2, true], [12.4, 13.9, true], [14.1, 15.6, true]]], doors: [[6.6, 1.3]], doorFill: "#d6dadd",
  pans: [[4.0, true], [13.5, false]], boxes: [[7.0, 1.6]] });
// WAB Bhe 4/8 141-150 (Stadler 2004, 2014-2015): three cars, 41.83 m,
// 2.30 m wide; the end cars low-floor with one bogie, the high-floor
// middle car's panorama windows and no doors; 800 mm gauge. Yellow above,
// green below, a yellow line along the green; the cab's front dark gray.
const WABC = { yellow: "#f2c21b", green: "#1f6b3a" };
const NOSE_WAB = [[0.2, 0.35], [0.15, 0.9], [0.15, 3.2], ["q", 0.2, 3.42, 0.5, 3.42], [1.0, 3.42]];
const wabEnd = (c) => regio(c, { roof: 3.42, sill: 0.4, nose: NOSE_WAB, low: [2.8, 13.5], bogies: [[2.0, 700, true, 1.8]],
  mask: [[[0.15, 1.3], [0.15, 3.2], ["q", 0.2, 3.38, 0.5, 3.38], [1.4, 3.38], [1.4, 1.3]], [[0.25, 1.75], [0.25, 3.0], [1.3, 3.0], [1.3, 1.75]]],
  colors: { base: WABC.yellow, roof: "#5a5f66", roofH: 0.18, skirt: [1.35, WABC.green], mask: "#2e3338", bands: [[1.05, 1.15, WABC.yellow]] }, hi: [1.7, 3.0], lo: [1.7, 3.0],
  windows: [[[2.2, 3.2]], [[4.6, 5.6], [5.8, 6.8]], [[9.0, 10.0], [10.2, 11.2], [11.4, 12.4]]], doors: [[7.3, 1.2]], doorFill: WABC.yellow, pans: [[2.2, true]],
  extra: (cc) => T(cc, 9.5, 0.75, 0.24, "WENGERNALPBAHN", WABC.yellow, { weight: 500 }) });
const wabMid = (c) => regio(c, { roof: 3.42, sill: 0.6, bogies: [[2.2, 700, true, 1.8], [12.6, 700, true, 1.8]], colors: { base: WABC.yellow, roof: "#5a5f66", roofH: 0.18, skirt: [1.35, WABC.green], bands: [[1.05, 1.15, WABC.yellow]] },
  hi: [1.6, 3.15], windows: [seq(0.7, 1.55, 9).map((x) => [x, x + 1.4])] });
// Jungfraubahn Bhe 4/8 221-224 (Stadler 2016): 47.86 m, 2.60 m wide,
// 3.35 m high, two halves; three-phase current through a double
// pantograph. Red, the window band dark, a yellow line along the foot of
// the side; yellow numbers on the front.
const NOSE_JB = [[0.2, 0.3], [0.1, 0.9], [0.1, 3.1], ["q", 0.15, 3.35, 0.5, 3.35], [1.0, 3.35]];
const jbHalf = (c) => regio(c, { roof: 3.35, sill: 0.35, nose: NOSE_JB, bogies: [[2.2, 700, true, 2.0], [12.5, 700, true, 2.0], [21.8, 700, true, 2.0]],
  mask: [[[0.1, 1.2], [0.1, 3.1], ["q", 0.15, 3.3, 0.5, 3.3], [1.5, 3.3], [1.5, 1.2]], [[0.2, 1.65], [0.2, 3.0], [1.4, 3.0], [1.4, 1.65]]],
  colors: { base: "#d3192a", roof: "#59606a", roofH: 0.18, skirt: [0.35, "#2c2f33"], mask: "#1c1e22", bands: [[0.55, 0.62, "#f2c21b"], [1.4, 3.05, "#1c1e22"]] }, hi: [1.55, 2.95], lo: [1.55, 2.95],
  paint: (cc) => R(8.0, 0.35, 0.3, 3.0, "#1c1e22") + R(16.0, 0.35, 0.3, 3.0, "#1c1e22"),
  windows: [[[2.0, 3.4], [3.6, 5.0], [5.2, 6.6]], [[9.6, 11.0], [11.2, 12.6], [12.8, 14.2]], [[17.4, 18.8], [19.0, 20.4], [20.6, 22.0]]], doors: [[6.9, 0.95, 1], [14.6, 0.95, 1], [22.5, 0.95, 1]], doorFill: "#f2c21b",
  pans: [[11.0, true]], extra: (cc) => T(cc, 0.75, 0.95, 0.3, "224", "#f2c21b", { weight: 700 }) });
// Gornergrat Bahn Polaris Bhe 4/6 3091-3095 (Stadler 2022): drawn as two
// 16 m halves (estimated); terracotta red-orange, the windows in a broad
// dark band edged in brushed silver, a gray skirt band; the cab's mask
// framed in silver, a white "1" lamp-sign by the door; "gornergrat bahn"
// with its mountain mark in white.
const GGBC = { orange: "#c8461e", silver: "#c6cbcf" };
const NOSE_GGB = [[0.25, 0.4], [0.12, 1.2], [0.12, 3.1], ["q", 0.2, 3.5, 0.7, 3.6], [1.4, 3.65]];
const ggbHalf = (c) => regio(c, { roof: 3.65, sill: 0.42, nose: NOSE_GGB, bogies: [[2.6, 700, true, 2.2], [13.6, 700, true, 2.2]],
  mask: [[[0.12, 1.45], [0.12, 3.1], ["q", 0.2, 3.42, 0.7, 3.48], [1.25, 3.48], [1.25, 1.45]], [[0.22, 1.6], [0.22, 3.05], ["q", 0.3, 3.32, 0.72, 3.36], [1.15, 3.36], [1.15, 1.6]]],
  colors: { base: GGBC.orange, skirt: [0.95, "#62686f"], mask: "#16181b" }, hi: [1.55, 3.1], lo: [1.55, 3.1],
  paint: (cc, L) => RR(1.3, 1.3, L - 1.3, 2.05, 0.2, GGBC.silver) + R(1.45, 1.4, L - 1.45, 1.85, "#1e2125") + RR(0.05, 1.3, 1.35, 2.25, 0.18, "none", 0, `stroke="${GGBC.silver}" stroke-width="2"`),
  windows: [[[4.0, 5.5], [5.7, 7.2], [7.4, 8.9], [9.1, 10.6], [10.8, 12.3], [12.5, 14.0], [14.2, 15.7]]], doors: [[1.75, 1.1, 1]], doorFill: GGBC.orange,
  pans: [[7.0, true]], extra: (cc) => T(cc, 6.8, 1.15, 0.24, "gornergrat bahn", "#ffffff", { weight: 500 }) });
// FART's Stadler units (the Centovalli's, 2024-2025): ABe 6/12 three cars
// 48.9 m, ABe 8/16 four 63.4 m (the cars about 16 m); sand gold, a black
// skirt, the cab's lamps set in blue, first class's yellow line, a blue
// "fart" behind the cab; photograph of 1102 (InnoTrans, 2024).
const FARTC = { sand: "#cdb78d", blue: "#1d3f99" };
const fartEnd = (first) => (c) => regio(c, { roof: 3.85, sill: 0.42, nose: NOSE_ST, low: [6.0, 16.0], bogies: [[2.9, 760, false, 2.0]], mask: MASK_ST,
  colors: { base: FARTC.sand, roof: "#8a8f95", roofH: 0.2, skirt: [0.7, "#24272b"], mask: "#121418" }, hi: [1.7, 3.0], lo: [1.7, 3.0],
  paint: () => R(-0.5, 0.95, 1.2, 0.45, FARTC.blue) + RR(2.4, 1.7, 1.2, 1.3, 0.12, GASKET) + RR(2.45, 1.75, 1.1, 1.2, 0.1, GLASS),
  windows: [[[4.4, 6.0]], [[8.4, 9.9, true], [10.1, 11.6, true]], [[13.3, 14.8, true]]], doors: [[6.6, 1.3]], doorFill: "#24272b",
  yellow: first ? [[8.4, 11.6]] : [], boxes: [[4.0, 2.0]], pans: first ? [] : [[13.0, true]], extra: (cc) => T(cc, 5.2, 3.35, 0.3, "fart", FARTC.blue, { weight: 600 }) });
const fartMid = (c) => regio(c, { roof: 3.85, sill: 0.42, low: [0.3, 15.8], colors: { base: FARTC.sand, roof: "#8a8f95", roofH: 0.2, skirt: [0.7, "#24272b"] }, hi: [1.7, 3.0], lo: [1.7, 3.0],
  windows: [[[0.8, 2.3, true], [2.5, 4.0, true], [4.2, 5.7, true]], [[8.5, 10.0, true], [10.2, 11.7, true], [11.9, 13.4, true]]], doors: [[6.4, 1.3]], doorFill: "#24272b", boxes: [[8.0, 3.0]] });
// CJ ABe 4/12 671-675 (Stadler 2024-2025, R 36 and R 37): three cars
// (about 18 m each, estimated); red, a white band low along the side
// carrying the CJ mark and "Chemins de fer du Jura", the windows framed in
// black; each unit's name behind the cab.
const cjEnd = (first) => (c) => regio(c, { roof: 3.85, sill: 0.42, nose: NOSE_ST, low: [7.5, 17.7], bogies: [[2.9, 760, false, 2.0]], mask: MASK_ST,
  colors: { base: "#dc2027", roof: "#a3a9af", roofH: 0.2, skirt: [0.55, "#2a2d31"], mask: "#16181b", bands: [[0.95, 1.4, "#f3f4f5"]] }, hi: [1.65, 3.0], lo: [1.65, 3.0],
  windows: [[[2.4, 3.1]], [[3.6, 5.1], [5.3, 6.8]], [[9.6, 11.1, true], [11.3, 12.8, true]], [[14.6, 16.1, true], [16.3, 17.4, true]]], doors: [[7.8, 1.3]], doorFill: "#f3f4f5",
  yellow: first ? [[3.6, 6.8]] : [], boxes: [[4.0, 2.4]], extra: (cc) => T(cc, 11.5, 1.18, 0.3, "Chemins de fer du Jura", "#dc2027", { weight: 600 }) });
const cjMid = (c) => regio(c, { roof: 3.85, sill: 0.42, low: [0.3, 17.7], colors: { base: "#dc2027", roof: "#a3a9af", roofH: 0.2, skirt: [0.55, "#2a2d31"], bands: [[0.95, 1.4, "#f3f4f5"]] },
  hi: [1.65, 3.0], lo: [1.65, 3.0], windows: [[[0.8, 2.3, true], [2.5, 4.0, true], [4.2, 5.7, true]], [[9.4, 10.9, true], [11.1, 12.6, true], [12.8, 14.3, true], [14.5, 16.0, true]]],
  doors: [[7.6, 1.3]], doorFill: "#f3f4f5", pans: [[9.0, true]], boxes: [[2.0, 3.0]] });
// Stadler GTW: two low-floor end cars resting on the power module between
// them (its own two bogies), the rack drive in it on the rack lines. o:
// paint { base, front, skirt, extra }. TPC's Beh 2/6 541-547 (AOMC, 2016):
// apple green with darker green swirls, a blue "tpc" on the front; MVR's
// ABeh 2/6 7501-7508 "SURF" (CEV, 2015-2017): champagne, the cab and the
// band over the windows night blue, "MVR" on the side; ASM's Be 2/6 (Biel-
// Täuffelen-Ins, 1997/2007): silver-gray, the cab red, a teal stripe.
const NOSE_GTW = [[0.3, 0.32], [0.15, 0.9], [0.15, 1.6], [0.4, 2.7], ["q", 0.65, 3.45, 1.5, 3.7], [2.2, 3.75]];
const gtwEnd = (col, name) => (c) => regio(c, { roof: 3.75, sill: 0.4, nose: NOSE_GTW, low: [3.6, 14.6], bogies: [[2.4, 680, false, 1.8]], mask: MASK_ST,
  colors: { base: col.base, roof: col.roof || "#9aa0a6", roofH: 0.2, skirt: [0.45, "#2a2d31"], mask: "#16181b", top: col.top }, hi: [1.65, 3.0], lo: [1.55, 3.0],
  paint: () => (col.front ? P([[-0.5, 0], [2.6, 0], [2.6, 4], [-0.5, 4]], col.front) : "") + (col.stripe ? R(2.6, 1.32, 12.0, 0.14, col.stripe) : ""),
  windows: col.oneDoor ? [[[2.6, 3.5, true], [3.7, 4.6, true]], [[6.5, 7.4, true], [7.6, 8.5, true], [8.7, 9.6, true], [9.8, 10.7, true], [10.9, 11.8, true]], [[13.4, 14.4, true]]]
    : [[[3.0, 3.8, true]], [[6.0, 7.4, true], [7.6, 9.0, true]], [[11.6, 13.0, true], [13.2, 14.3, true]]],
  doors: col.oneDoor ? [[5.0, 1.2]] : [[4.2, 1.3], [9.6, 1.3]], doorFill: col.door || "#e4e7ea",
  extra: (cc) => (name ? T(cc, 12.0, 1.1, 0.32, name, col.text || "#ffffff", { weight: 600 }) : "") });
const gtwPower = (col, rack) => (c) => regio(c, { roof: 3.9, sill: 0.62, bogies: [[1.4, 760, rack, 1.7], [3.9, 760, rack, 1.7]], colors: { base: col.module || col.base, roof: col.roof || "#9aa0a6", roofH: 0.2, skirt: [0.7, "#2a2d31"] },
  paint: () => slats(ft(1.0), ft(1.6), ft(3.3), ft(1.2), 0.4, "rgba(0,0,0,0.25)"), pans: [[2.65, true]] });
const TPCC = { base: "#a5cf43", roof: "#8fb83a", door: "#33307a", top: null, oneDoor: true };
const MVRC = { base: "#e8e2d2", top: [2.95, "#1b2348"], front: null, roof: "#1b2348", door: "#d8d2c2", module: "#1b2348", text: "#1b2348" };
const ASMG = { base: "#c9cdd1", front: "#d8262c", stripe: "#2aa3a5", door: "#e4e7ea" };
// ASM's Be 4/8 110-115 "STAR" (Stadler 2008, 2011; Solothurn-Langenthal
// and the S 12): two cars, 39.0 m; deep red, the roof's edge, cab top and
// skirt gray, the white "asm" mark.
const asmStar = (c) => regio(c, { roof: 3.85, sill: 0.4, nose: NOSE_GTW, low: [5.5, 19.3], bogies: [[2.6, 750, false, 2.0]], mask: MASK_ST,
  colors: { base: "#c8102e", roof: "#5a6067", roofH: 0.45, skirt: [0.95, "#5a6067"], mask: "#16181b", bands: [[1.0, 1.06, "#f2f3f4"]] }, hi: [1.65, 3.0], lo: [1.55, 3.0],
  windows: [[[2.8, 3.6]], [[7.4, 8.9, true], [9.1, 10.6, true]], [[13.4, 14.9, true], [15.1, 16.6, true], [16.8, 18.3, true]]], doors: [[5.8, 1.3], [11.2, 1.3]], doorFill: "#e4e7ea",
  pans: [[17.0, true]], boxes: [[3.5, 2.0]], extra: (cc) => T(cc, 4.6, 1.35, 0.22, "aare seeland mobil", "#ffffff", { weight: 600, italic: true }) });
// transN ABe 4/8 9-10 (Stadler 2024, La Chaux-de-Fonds-Les Ponts-de-
// Martel): two cars (about 17.7 m each, estimated); white, a lime green
// sweep along the foot rising toward the cab, the doors lime, "transN" in
// green.
const transn = (c) => regio(c, { roof: 3.85, sill: 0.42, nose: NOSE_ST, low: [7.0, 17.4], bogies: [[3.0, 760, false, 2.0]], mask: MASK_ST,
  colors: { base: "#f2f3f4", roof: "#d5d9dc", roofH: 0.2, skirt: [0.45, "#3a3d42"], mask: "#16181b", bands: [[1.6, 3.05, "#1c1e21"]] }, hi: [1.65, 3.0], lo: [1.65, 3.0],
  paint: (cc, L) => P([[-0.5, 0.45], [L + 0.5, 0.45], [L + 0.5, 0.95], [7.0, 0.95], ["q", 3.0, 1.0, 1.6, 2.0], [-0.5, 2.0]], "#9dc31c"),
  windows: [[[2.5, 3.2]], [[3.7, 5.1], [5.3, 6.7]], [[9.5, 11.0, true], [11.2, 12.7, true]], [[14.4, 15.9, true], [16.1, 17.2, true]]], doors: [[7.6, 1.3]], doorFill: "#9dc31c",
  pans: [[14.0, true]], boxes: [[4.0, 2.4]], extra: (cc) => T(cc, 11.0, 1.35, 0.4, "transN", "#7da614", { weight: 500, italic: true }) });
// Rack lines' own: MGN Bhe 4/8 301-305 (SLM 1983-2010, 800 mm): two cars,
// 23.89 m; royal blue below, cream above, the name in script on the
// front. Monte Generoso Bhe 4/8 11-14 (SLM 1982): two cars; orange-red
// with a broad blue band lettered "MONTE GENEROSO". Pilatus Bhe 2/2 41-48
// (Stadler 2022-2023, 800 mm, 48 per cent): single cars of 12.32 m, run in
// pairs; the body stepped for the grade (drawn level); red with a black
// window band. Rigi Bhe 4/6 41-46 (Stadler 2021-2022, standard gauge):
// 34.8 m, 3.0 m wide; bronze with a dark window band.
const mgnHalf = (c) => regio(c, { roof: 3.55, sill: 0.6, nose: [[0.2, 0.6], [0.15, 3.2], ["q", 0.2, 3.55, 0.6, 3.55], [1.0, 3.55]], bogies: [[2.3, 700, true, 2.0], [9.8, 700, true, 2.0]],
  mask: [[[0.15, 1.8], [0.15, 3.0], [1.2, 3.0], [1.2, 1.8]], [[0.22, 1.9], [0.22, 2.95], [1.12, 2.95], [1.12, 1.9]]],
  colors: { base: "#efe8d2", roof: "#9aa0a6", roofH: 0.2, skirt: [1.6, "#1d3f99"], mask: "#16181b" }, hi: [1.85, 2.9],
  windows: [[[2.2, 3.2], [3.4, 4.4], [4.6, 5.6], [5.8, 6.8], [7.0, 8.0], [8.2, 9.2], [9.4, 10.4]]], doors: [[1.25, 0.8, 1]], doorFill: "#efe8d2", pans: [[3.0, true]] });
const mgHalf = (c) => regio(c, { roof: 3.55, sill: 0.6, nose: [[0.2, 0.6], [0.15, 3.2], ["q", 0.2, 3.55, 0.6, 3.55], [1.0, 3.55]], bogies: [[2.3, 700, true, 2.0], [9.0, 700, true, 2.0]],
  mask: [[[0.15, 1.8], [0.15, 3.0], [1.2, 3.0], [1.2, 1.8]], [[0.22, 1.9], [0.22, 2.95], [1.12, 2.95], [1.12, 1.9]]],
  colors: { base: "#e2562b", roof: "#1d3f99", roofH: 0.2, skirt: [0.8, "#2a2d31"], mask: "#16181b", bands: [[1.0, 1.75, "#1d3f99"]] }, hi: [1.9, 2.9],
  windows: [[[2.2, 3.1], [3.3, 4.2], [4.4, 5.3], [5.5, 6.4], [6.6, 7.5], [7.7, 8.6], [8.8, 9.7]]], doors: [[1.25, 0.8, 1]], doorFill: "#e2562b", pans: [[3.0, true]],
  extra: (cc) => T(cc, 6.0, 1.38, 0.38, "MONTE GENEROSO", "#e2562b", { weight: 800 }) });
const pilatus = (c) => regio(c, { roof: 3.4, sill: 0.7, nose: [[0.25, 0.7], [0.1, 1.4], [0.1, 3.0], ["q", 0.15, 3.4, 0.6, 3.4], [1.0, 3.4]], bogies: [[2.6, 600, true, 1.6], [9.7, 600, true, 1.6]],
  mask: [[[0.1, 1.2], [0.1, 3.0], ["q", 0.15, 3.32, 0.6, 3.32], [1.2, 3.32], [1.2, 1.2]], [[0.2, 1.3], [0.2, 2.95], [1.1, 2.95], [1.1, 1.3]]],
  colors: { base: "#c8162a", roof: "#c8162a", skirt: [0.95, "#2a2d31"], mask: "#16181b", bands: [[1.25, 3.05, "#16181b"]] }, hi: [1.35, 2.95],
  windows: [[[1.6, 2.6], [2.75, 3.75], [3.9, 4.9], [5.05, 6.05], [6.2, 7.2], [7.35, 8.35], [8.5, 9.5], [9.65, 10.65]]], pans: [[6.1, true]],
  extra: (cc) => T(cc, 6.1, 1.1, 0.26, "PILATUS", "#ffffff", { weight: 800 }) });

// ===================== Tables =====================
// Each car with a driving cab has a twin key ending in "R": the same car
// turned round, its cab at the right (the back of a unit that runs with
// its cab toward the end of the train, or a unit coupled behind another).
// The tables below choose which end each cab faces, so the strip's own
// turning of the last car is not used (oneEnd false).
const mirror = (draw) => (c) => `<g transform="matrix(-1 0 0 1 ${n(c.L)} 0)">${draw({ ...c, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: c.coupledL })}</g>`;
export const TYPES = {
  rhbCapBe: { name: "Capricorn power car (Be 4/4, second class)", kind: "emu", pan: true },
  rhbCapBi: { name: "Capricorn intermediate car (Bi, second class, low floor)", kind: "emu" },
  rhbCapB: { name: "Capricorn intermediate car (B, second class, low floor)", kind: "emu" },
  rhbCapAt: { name: "Capricorn control car (At, first class)", kind: "emu", amenities: ["first"] },
  rhbAlgEnd: { name: "Allegra power car (ABe 4/4, first and second class)", kind: "emu", pan: true, amenities: ["first"] },
  rhbAlgMid: { name: "Allegra middle car (Bi, second class, low floor)", kind: "emu", pan: true },
  rhbAlvBi: { name: "Alvra coach Bi 576 (second class, low floor, photo compartment)", kind: "coach" },
  rhbAlvB: { name: "Alvra coach B 574/573 (second class)", kind: "coach" },
  rhbAlvB577: { name: "Alvra family coach B 577 (second class)", kind: "coach" },
  rhbAlvAB: { name: "Alvra coach AB 572 (first and second class)", kind: "coach", amenities: ["first"] },
  rhbAlvA: { name: "Alvra coach A 570 (first class)", kind: "coach", amenities: ["first"] },
  gexAp: { name: "Glacier Express panorama coach Ap (first class)", kind: "coach", amenities: ["first"] },
  gexApi: { name: "Glacier Express panorama coach Api (first class, accessible toilet)", kind: "coach", amenities: ["first"] },
  gexAps: { name: "Glacier Express Excellence Class coach Aps", kind: "coach", amenities: ["first"] },
  gexBp: { name: "Glacier Express panorama coach Bp (second class)", kind: "coach" },
  gexWRp: { name: "Glacier Express kitchen and bar car WRp", kind: "coach", amenities: ["cafe"] },
  bexAp: { name: "Bernina Express panorama coach Ap (first class)", kind: "coach", amenities: ["first"] },
  bexBp: { name: "Bernina Express panorama coach Bp (second class)", kind: "coach" },
  rhbEwA: { name: "Einheitswagen coach A (first class)", kind: "coach", amenities: ["first"] },
  rhbEwAB: { name: "Einheitswagen coach AB (first and second class)", kind: "coach", amenities: ["first"] },
  rhbEwB: { name: "Einheitswagen coach B (second class)", kind: "coach" },
  rhbEwBs: { name: "Einheitswagen coach B, Bernina type (second class)", kind: "coach" },
  rhbEwBD: { name: "Einheitswagen coach BD (second class and baggage)", kind: "coach" },
  rhbBDt: { name: "Control car BDt 1751 (second class and baggage)", kind: "coach", cab: true },
  rhbBD564: { name: "Bike and baggage car BD 564 (Alvra trains)", kind: "coach" },
  zbFinkB: { name: "FINK end car Bth (second class)", kind: "emu" },
  zbFinkC: { name: "FINK middle car Beh (second class, rack bogies)", kind: "emu", pan: true },
  zbFinkA: { name: "FINK end car ABth (first and second class)", kind: "emu", amenities: ["first"] },
  zbSpatzBt: { name: "SPATZ end car Bt (second class, low floor)", kind: "emu" },
  zbSpatzMid: { name: "SPATZ middle car Be (motors, panorama windows)", kind: "emu", pan: true },
  zbSpatzABt: { name: "SPATZ end car ABt (first and second class, low floor)", kind: "emu", amenities: ["first"] },
  zbHGe: { name: "HGe 101 rack electric locomotive", kind: "electric", pan: true },
  zbLexA: { name: "Luzern-Engelberg Express panorama coach A (first class)", kind: "coach", amenities: ["first"] },
  zbLexB: { name: "zb coach B (second class)", kind: "coach" },
  zbLexBD: { name: "zb coach BD (second class and baggage)", kind: "coach" },
  zbGswABt: { name: "Control-car set ABt 941-943, cab section (first class)", kind: "coach", cab: true, amenities: ["first"] },
  zbGswB: { name: "Control-car set ABt 941-943, low-floor section (second class)", kind: "coach" },
  mgbHGe: { name: "HGe 4/4 II rack electric locomotive", kind: "electric", pan: true },
  mobGpxAst: { name: "GoldenPass Express driving coach Ast (Prestige and first class)", kind: "coach", cab: true, amenities: ["first"] },
  mobGpxAs: { name: "GoldenPass Express coach As (first class)", kind: "coach", amenities: ["first"] },
  mobGpxBs: { name: "GoldenPass Express coach Bs (second class)", kind: "coach" },
  mobGpxBsNF: { name: "GoldenPass Express low-floor coach BsNF (second class)", kind: "coach" },
  mobGpxABst: { name: "GoldenPass Express driving coach ABst (Prestige and second class)", kind: "coach", cab: true, amenities: ["first"] },
  mobGe44: { name: "Ge 4/4 8000 electric locomotive", kind: "electric", pan: true },
  mobGpxBsi: { name: "GoldenPass Express interface coach Bsi (second class, standard gauge leg)", kind: "coach" },
  mobPanoAst: { name: "GoldenPass Panoramic control car Ast (first class, seats ahead of the raised cab)", kind: "coach", cab: true, amenities: ["first"] },
  mobPanoB: { name: "GoldenPass Panoramic panorama coach", kind: "coach" },
  mobABe93: { name: "ABe 4/4 9300 railcar (first and second class)", kind: "emu", pan: true, amenities: ["first"] },
  mobBe92: { name: "Be 4/4 9200 railcar (second class)", kind: "emu", pan: true },
  avaDiaA: { name: "Diamant end car (first and second class)", kind: "emu", amenities: ["first"] },
  avaDiaB: { name: "Diamant end car (second class)", kind: "emu", pan: true },
  avaDiaMid: { name: "Diamant middle car (low floor)", kind: "emu" },
  avaSaphA: { name: "Saphir end car (first and second class)", kind: "emu", amenities: ["first"] },
  avaSaphB: { name: "Saphir end car (second class)", kind: "emu", pan: true },
  avaSaphMid: { name: "Saphir middle car (low floor)", kind: "emu" },
  flpTl: { name: "Tramlink Be 6/8 (half)", kind: "emu", pan: true },
  tmrEndF: { name: "Mont-Blanc Express end car (SNCF end)", kind: "emu" },
  tmrMid: { name: "Mont-Blanc Express middle car", kind: "emu", pan: true },
  tmrEndS: { name: "Mont-Blanc Express end car (TMR end)", kind: "emu" },
  rbsNextA: { name: "NExT end car (first and second class)", kind: "emu", amenities: ["first"] },
  rbsNextMid: { name: "NExT middle car", kind: "emu" },
  rbsNextB: { name: "NExT end car (second class)", kind: "emu", pan: true },
  rbsWorEnd: { name: "Worbla end car", kind: "emu" },
  rbsWorMid: { name: "Worbla middle car", kind: "emu", pan: true },
  abWalzerA: { name: "Walzer end car (first and second class)", kind: "emu", amenities: ["first"] },
  abWalzerMid: { name: "Walzer middle car", kind: "emu", pan: true },
  abWalzerB: { name: "Walzer end car (second class)", kind: "emu" },
  abTango: { name: "Tango half (three modules)", kind: "emu", pan: true },
  mbcBe: { name: "Stadler Be 4/4 railcar", kind: "emu", pan: true },
  mbcB: { name: "Low-floor coach B", kind: "emu" },
  nstcmA: { name: "ABe 4/8 car (first and second class)", kind: "emu", amenities: ["first"] },
  nstcmB: { name: "ABe 4/8 car (second class)", kind: "emu", pan: true },
  lebEnd: { name: "Be 4/8 end car", kind: "emu" },
  lebMid: { name: "Be 4/8 middle car", kind: "emu", pan: true },
  bobEndA: { name: "BOB ABeh 4/8 end car (first and second class)", kind: "emu", amenities: ["first"] },
  bobEndB: { name: "BOB ABeh 4/8 end car (second class)", kind: "emu" },
  bobMid: { name: "BOB ABeh 4/8 middle car", kind: "emu", pan: true },
  wabEnd: { name: "WAB Bhe 4/8 end car (low floor)", kind: "emu", pan: true },
  wabMid: { name: "WAB Bhe 4/8 panorama middle car", kind: "emu" },
  jbHalf: { name: "Jungfraubahn Bhe 4/8 (half)", kind: "emu", pan: true },
  ggbHalf: { name: "Gornergrat Bahn Polaris Bhe 4/6 (half)", kind: "emu", pan: true },
  fartA: { name: "FART Stadler end car (first and second class)", kind: "emu", amenities: ["first"] },
  fartB: { name: "FART Stadler end car (second class)", kind: "emu", pan: true },
  fartMid: { name: "FART Stadler middle car", kind: "emu" },
  cjA: { name: "CJ ABe 4/12 end car (first and second class)", kind: "emu", amenities: ["first"] },
  cjB: { name: "CJ ABe 4/12 end car (second class)", kind: "emu" },
  cjMid: { name: "CJ ABe 4/12 middle car", kind: "emu", pan: true },
  tpcGtw: { name: "TPC Beh 2/6 end car", kind: "emu" },
  tpcGtwPower: { name: "TPC Beh 2/6 power module (rack)", kind: "emu", pan: true },
  mvrGtw: { name: "MVR ABeh 2/6 SURF end car", kind: "emu" },
  mvrGtwPower: { name: "MVR ABeh 2/6 SURF power module (rack)", kind: "emu", pan: true },
  asmGtw: { name: "ASM Be 2/6 GTW end car", kind: "emu" },
  asmGtwPower: { name: "ASM Be 2/6 GTW power module", kind: "emu", pan: true },
  asmStar: { name: "ASM Be 4/8 STAR car", kind: "emu", pan: true },
  transn: { name: "transN ABe 4/8 car", kind: "emu", pan: true },
  mgnHalf: { name: "MGN Bhe 4/8 car", kind: "emu", pan: true },
  mgHalf: { name: "Monte Generoso Bhe 4/8 car", kind: "emu", pan: true },
  pilatus: { name: "Pilatus Bhe 2/2 railcar", kind: "emu", pan: true },
  mgbOrEnd: { name: "Orion end car (first and second class)", kind: "emu", amenities: ["first"] },
  mgbOrMid: { name: "Orion middle car (second class, pantographs)", kind: "emu", pan: true },
  mgbKoA: { name: "Komet end car (first and second class, low floor)", kind: "emu", amenities: ["first"] },
  mgbKoD: { name: "Komet end car (second class and baggage, low floor)", kind: "emu" },
  mgbKoPower: { name: "Komet panorama power car", kind: "emu", pan: true },
  mgbShEnd: { name: "Zermatt shuttle end car (second class, low floor)", kind: "emu" },
  mgbShMid: { name: "Zermatt shuttle panorama power car", kind: "emu", pan: true },
  zbAdA: { name: "ADLER end car Ath (first class)", kind: "emu", amenities: ["first"] },
  zbAdC: { name: "ADLER rack car Beh (second class)", kind: "emu", pan: true },
  zbAdB: { name: "ADLER low-floor car Bh (second class)", kind: "emu" },
  zbAdWR: { name: "ADLER bistro car BR", kind: "emu", amenities: ["cafe"] },
  rhbGe3: { name: "Ge 4/4 III electric locomotive", kind: "electric", pan: true },
  rhbGe2: { name: "Ge 4/4 II electric locomotive", kind: "electric", pan: true },
  rhbAt: { name: "Control car At 578 (first class)", kind: "coach", cab: true, amenities: ["first"] },
  rhbBt: { name: "Control car Bt 528 (second class)", kind: "coach", cab: true },
};
const Mo = (draw, lenM, oneEnd = false, variant = null) => ({ draw, len: Math.round(lenM * F * 100) / 100, oneEnd, variant });
export const MODELS = {
  rhbCapBe: Mo(capPower, 19.73, true),
  rhbCapBi: Mo(capBi, 18.47),
  rhbCapB: Mo(capB, 18.46),
  rhbCapAt: Mo(capAt, 19.74, true),
  rhbAlgEnd: Mo(algEnd, 16.67, true),
  rhbAlgMid: Mo(algMid, 16.16),
  rhbAlvBi: Mo(alvBi, 19.04),
  rhbAlvB: Mo(alvB, 18.71),
  rhbAlvB577: Mo(alvB577, 19.03),
  rhbAlvAB: Mo(alvAB, 18.48),
  rhbAlvA: Mo(alvA, 18.69),
  gexAp: Mo((c) => gexCar(c, "Ap"), 18.5, false),
  gexApi: Mo((c) => gexCar(c, "Api"), 18.5),
  gexAps: Mo((c) => gexCar(c, "Aps"), 18.5),
  gexBp: Mo((c) => gexCar(c, "Bp"), 18.5),
  gexWRp: Mo((c) => gexCar(c, "WRp"), 18.5),
  bexAp: Mo((c) => bexCar(c, true), 16.45),
  bexBp: Mo((c) => bexCar(c, false), 16.45),
  rhbEwA: Mo((c) => ewCoach(c, { first: true, wins: 7 }), 18.5),
  rhbEwAB: Mo((c) => ewCoach(c, { first: true, wins: 8 }), 18.5),
  rhbEwB: Mo((c) => ewCoach(c, { wins: 9 }), 18.5),
  rhbEwBs: Mo((c) => ewCoach(c, { wins: 7 }), 16.45),
  rhbEwBD: Mo((c) => ewCoach(c, { bd: true, wins: 4 }), 16.45),
  rhbBDt: Mo(bdtCar, 18.8, true),
  rhbBD564: Mo((c) => bdtCar(c, false), 18.8),
  zbFinkB: Mo(zbFinkB, 17.7),
  zbFinkC: Mo(zbFinkC, 18.7),
  zbFinkA: Mo(zbFinkA, 17.6),
  zbSpatzBt: Mo(zbSpatzEnd(false), 17.7),
  zbSpatzMid: Mo(zbSpatzMid, 16.5),
  zbSpatzABt: Mo(zbSpatzEnd(true), 17.7),
  zbHGe: Mo((c) => hge(c, "zb"), 14.8),
  zbLexA: Mo((c) => lexCoach(c, "A"), 17.7),
  zbLexB: Mo((c) => lexCoach(c, "B"), 17.7),
  zbLexBD: Mo((c) => lexCoach(c, "BD"), 17.7),
  zbGswABt: Mo(zbGswABt, 16.0),
  zbGswB: Mo(zbGswB, 14.4),
  mgbHGe: Mo((c) => hge(c, "mgb"), 14.78),
  mobGpxAst: Mo((c) => gpxCar(c, "Ast"), 18.75),
  mobGpxAs: Mo((c) => gpxCar(c, "As"), 18.75),
  mobGpxBs: Mo((c) => gpxCar(c, "Bs"), 18.75),
  mobGpxBsNF: Mo((c) => gpxCar(c, "BsNF"), 18.75),
  mobGpxABst: Mo((c) => gpxCar(c, "ABst"), 18.75),
  mobGe44: Mo(mobGe44, 16.0),
  mobGpxBsi: Mo((c) => gpxCar(c, "Bs"), 18.75),
  mobPanoAst: Mo(mobPano(true), 17.5),
  mobPanoB: Mo(mobPano(false), 17.5),
  mobABe93: Mo((c) => mobWsm(c, true), L_WSM),
  mobBe92: Mo((c) => mobWsm(c, false), L_WSM),
  avaDiaA: Mo(avaDiaEnd(true), L_DIA),
  avaDiaB: Mo(avaDiaEnd(false), L_DIA),
  avaDiaMid: Mo(avaDiaMid, L_DIAM),
  avaSaphA: Mo(avaSaphEnd(true), L_SAPH),
  avaSaphB: Mo(avaSaphEnd(false), L_SAPH),
  avaSaphMid: Mo(avaSaphMid, L_SAPH),
  flpTl: Mo(flpHalf, 22.5),
  tmrEndF: Mo(tmrEnd("#3f8fd6", true), 15.5),
  tmrMid: Mo(tmrMid, 15.5),
  tmrEndS: Mo(tmrEnd("#d8262c", false), 15.5),
  rbsNextA: Mo((c) => rbsNext(c, true), 20.0),
  rbsNextMid: Mo(rbsNextMid, 20.0),
  rbsNextB: Mo((c) => rbsNext(c, false), 20.0),
  rbsWorEnd: Mo(rbsWorEnd, 15.4),
  rbsWorMid: Mo(rbsWorMid, 14.6),
  abWalzerA: Mo(abWalzerEnd(true), 19.6),
  abWalzerMid: Mo(abWalzerMid, 19.6),
  abWalzerB: Mo(abWalzerEnd(false), 19.6),
  abTango: Mo(abTangoHalf, 26.3),
  mbcBe: Mo(mbcBe, 20.26),
  mbcB: Mo(mbcB, 18.5),
  nstcmA: Mo(nstcm(true), 17.7),
  nstcmB: Mo(nstcm(false), 17.7),
  lebEnd: Mo(lebEnd, 15.2),
  lebMid: Mo(lebMid, 14.4),
  bobEndA: Mo(bobEnd(true), 16.5),
  bobEndB: Mo(bobEnd(false), 16.5),
  bobMid: Mo(bobMid, 17.7),
  wabEnd: Mo(wabEnd, 13.5),
  wabMid: Mo(wabMid, 14.83),
  jbHalf: Mo(jbHalf, 23.93),
  ggbHalf: Mo(ggbHalf, 16.0),
  fartA: Mo(fartEnd(true), 16.3),
  fartB: Mo(fartEnd(false), 16.3),
  fartMid: Mo(fartMid, 16.1),
  cjA: Mo(cjEnd(true), 18.0),
  cjB: Mo(cjEnd(false), 18.0),
  cjMid: Mo(cjMid, 18.0),
  tpcGtw: Mo(gtwEnd(TPCC, null), 15.0),
  tpcGtwPower: Mo(gtwPower(TPCC, true), 5.3),
  mvrGtw: Mo(gtwEnd(MVRC, "MVR"), 15.0),
  mvrGtwPower: Mo(gtwPower(MVRC, true), 5.3),
  asmGtw: Mo(gtwEnd(ASMG, null), 15.0),
  asmGtwPower: Mo(gtwPower(ASMG, false), 5.3),
  asmStar: Mo(asmStar, 19.5),
  transn: Mo(transn, 17.7),
  mgnHalf: Mo(mgnHalf, 11.95),
  mgHalf: Mo(mgHalf, 11.5),
  pilatus: Mo(pilatus, 12.32),
  mgbOrEnd: Mo(orionEnd, 19.35),
  mgbOrMid: Mo(orionMid, 17.9),
  mgbKoA: Mo((c) => kometEnd(c, true), 18.95),
  mgbKoD: Mo((c) => kometEnd(c, false), 18.95),
  mgbKoPower: Mo(kometPower, 18.76),
  mgbShEnd: Mo(shuttleEnd, 17.0),
  mgbShMid: Mo(shuttleMid, 18.0),
  zbAdA: Mo(zbAdA, 17.6),
  zbAdC: Mo(zbFinkC, 18.4),
  zbAdB: Mo(zbAdB, 17.4),
  zbAdWR: Mo(zbAdWR, 19.2),
  rhbGe3: Mo(ge44iii, 16.0),
  rhbGe2: Mo(ge44ii, 12.96),
  rhbAt: Mo((c) => stwCar(c, true), 18.87, true),
  rhbBt: Mo((c) => stwCar(c, false), 18.87, true),
};
// Every car's turned twin (a unit running the other way round is seen
// from its other side: every car of it mirrored, doors and all).
function twins() {
  for (const k of Object.keys(TYPES)) {
    if (k.endsWith("R") && TYPES[k.slice(0, -1)]) continue;
    TYPES[k + "R"] = { ...TYPES[k] };
    MODELS[k] = { ...MODELS[k], oneEnd: false };
    MODELS[k + "R"] = { ...MODELS[k], draw: mirror(MODELS[k].draw) };
  }
}
twins();
const set = (label, ...units) => ({ label, units });
const CAPRICORN = set("Capricorn (ABe 4/16): four cars, the first class in the control car", ["rhbCapBe", 1], ["rhbCapBi", 1], ["rhbCapB", 1], ["rhbCapAtR", 1]);
const ALLEGRA = set("Allegra (ABe 8/12): three cars, first class behind each cab", ["rhbAlgEnd", 1], ["rhbAlgMid", 1], ["rhbAlgEndR", 1]);
const ALVRA = set("Ge 4/4 III with a bike car and an Alvra set (six coaches) and an At control car", ["rhbGe3", 1], ["rhbBD564", 1], ["rhbAlvBi", 1], ["rhbAlvB", 2], ["rhbAlvB577", 1], ["rhbAlvAB", 1], ["rhbAlvA", 1], ["rhbAtR", 1]);
const FINK = set("FINK (ABeh 160/161/162): three cars, first class behind one cab", ["zbFinkB", 1], ["zbFinkC", 1], ["zbFinkAR", 1]);
const ADLER = set("ADLER (ABeh 150): seven cars, first class in both end cars, the bistro in the middle", ["zbAdA", 1], ["zbAdC", 1], ["zbAdB", 1], ["zbAdWR", 1], ["zbAdBR", 1], ["zbAdCR", 1], ["zbAdAR", 1]);
const SPATZ = set("SPATZ (ABe 130): three cars, first class at one end", ["zbSpatzABt", 1], ["zbSpatzMid", 1], ["zbSpatzBtR", 1]);
const ORION = set("Orion (ABeh 8/12): three cars, first class behind each cab", ["mgbOrEnd", 1], ["mgbOrMid", 1], ["mgbOrEndR", 1]);
const KOMET = set("Komet (ABDeh 4/8): three cars, first class at one end, the baggage compartment at the other", ["mgbKoA", 1], ["mgbKoPower", 1], ["mgbKoDR", 1]);
const GPX_MOB = set("GoldenPass Express: MOB Ge 4/4 with the Prestige coaches (Ast at the Montreux end, ABst at the Interlaken end)",
  ["mobGe44", 1], ["mobGpxAst", 1], ["mobGpxAs", 1], ["mobGpxBsNF", 1], ["mobGpxBs", 1], ["mobGpxABstR", 1]);
export const SAMPLE_SETS = {
  bob: { agency: "chnarrowother", set: set("BOB", ["bobEndA", 1], ["bobMid", 1], ["bobEndBR", 1]) },
  wab: { agency: "chnarrowother", set: set("WAB", ["wabEnd", 1], ["wabMid", 1], ["wabEndR", 1]) },
  jb: { agency: "chnarrowother", set: set("JB", ["jbHalf", 1], ["jbHalfR", 1]) },
  ggb: { agency: "chnarrowother", set: set("GGB", ["ggbHalf", 1], ["ggbHalfR", 1]) },
  fart: { agency: "chnarrowother", set: set("FART", ["fartA", 1], ["fartMid", 1], ["fartBR", 1]) },
  cj: { agency: "chnarrowother", set: set("CJ", ["cjA", 1], ["cjMid", 1], ["cjBR", 1]) },
  tpc: { agency: "chnarrowother", set: set("TPC", ["tpcGtw", 1], ["tpcGtwPower", 1], ["tpcGtwR", 1]) },
  mvr: { agency: "chnarrowother", set: set("MVR", ["mvrGtw", 1], ["mvrGtwPower", 1], ["mvrGtwR", 1]) },
  asmg: { agency: "chnarrowother", set: set("ASM GTW", ["asmGtw", 1], ["asmGtwPower", 1], ["asmGtwR", 1]) },
  asms: { agency: "chnarrowother", set: set("ASM STAR", ["asmStar", 1], ["asmStarR", 1]) },
  transn: { agency: "chnarrowother", set: set("transN", ["transn", 1], ["transnR", 1]) },
  mgn: { agency: "chnarrowother", set: set("MGN", ["mgnHalf", 1], ["mgnHalfR", 1]) },
  mg: { agency: "chnarrowother", set: set("MG", ["mgHalf", 1], ["mgHalfR", 1]) },
  pb: { agency: "chnarrowother", set: set("PB", ["pilatus", 1]) },
  next: { agency: "chnarrowother", set: set("NExT", ["rbsNextA", 1], ["rbsNextMid", 1], ["rbsNextBR", 1]) },
  worbla: { agency: "chnarrowother", set: set("Worbla", ["rbsWorEnd", 1], ["rbsWorMid", 2], ["rbsWorEndR", 1]) },
  walzer: { agency: "chnarrowother", set: set("Walzer", ["abWalzerB", 1], ["abWalzerMid", 1], ["abWalzerAR", 1]) },
  tango: { agency: "chnarrowother", set: set("Tango", ["abTango", 1], ["abTangoR", 1]) },
  mbc: { agency: "chnarrowother", set: set("MBC", ["mbcBe", 1], ["mbcB", 1], ["mbcBeR", 1]) },
  nstcm: { agency: "chnarrowother", set: set("NStCM", ["nstcmA", 1], ["nstcmBR", 1]) },
  leb: { agency: "chnarrowother", set: set("LEB", ["lebEnd", 1], ["lebMid", 1], ["lebEndR", 1]) },
  diamant: { agency: "chnarrowother", set: set("Diamant", ["avaDiaA", 1], ["avaDiaMid", 1], ["avaDiaBR", 1]) },
  saphir: { agency: "chnarrowother", set: set("Saphir II", ["avaSaphA", 1], ["avaSaphBR", 1]) },
  flp: { agency: "chnarrowother", set: set("Tramlink", ["flpTl", 1], ["flpTlR", 1]) },
  tmr: { agency: "chnarrowother", set: set("Mont-Blanc Express", ["tmrEndF", 1], ["tmrMid", 1], ["tmrEndSR", 1]) },
  gpx: { agency: "mob", set: GPX_MOB },
  mobwsm: { agency: "mob", set: set("MOB ABe 4/4 + Be 4/4", ["mobABe93", 1], ["mobBe92R", 1]) },
  mobpano: { agency: "mob", set: set("GoldenPass Panoramic", ["mobPanoAst", 1], ["mobPanoB", 2], ["mobBe92R", 1], ["mobABe93R", 1]) },
  orion: { agency: "mgb", set: ORION },
  komet: { agency: "mgb", set: KOMET },
  shuttle: { agency: "mgb", set: set("Zermatt shuttle (BDSeh 4/8): three cars", ["mgbShEnd", 1], ["mgbShMid", 1], ["mgbShEndR", 1]) },
  spatz: { agency: "zb", set: SPATZ },
  hge: { agency: "zb", set: set("HGe", ["zbHGe", 1], ["mgbHGe", 1]) },
  lex: { agency: "zb", set: set("LEX", ["zbGswABt", 1], ["zbGswB", 2], ["zbLexBD", 1], ["zbLexB", 2], ["zbLexA", 1], ["zbHGeR", 1]) },
  fink: { agency: "zb", set: FINK },
  adler: { agency: "zb", set: ADLER },
  ew: { agency: "rhb", set: set("EW", ["rhbGe2", 1], ["rhbEwA", 1], ["rhbEwB", 1], ["rhbEwBs", 1], ["rhbEwBD", 1], ["rhbBDtR", 1]) },
  gex: { agency: "rhb", set: set("Glacier Express", ["rhbGe3", 1], ["gexAps", 1], ["gexAp", 1], ["gexApi", 1], ["gexWRp", 1], ["gexBp", 3]) },
  bex: { agency: "rhb", set: set("Bernina Express", ["rhbAlgEnd", 1], ["rhbAlgMid", 1], ["rhbAlgEndR", 1], ["bexAp", 2], ["bexBp", 4]) },
  locos: { agency: "rhb", set: set("locos", ["rhbGe3", 1], ["rhbGe2", 1]) },
  alvra: { agency: "rhb", set: ALVRA },
  allegra: { agency: "rhb", set: ALLEGRA },
  capricorn: { agency: "rhb", set: CAPRICORN },
};

// ---------- The railways' formations (the Train Formation Service) ----------
// The service names each vehicle by its type ("At", "Be", "Bi", "ABe",
// "Ath150", "Beh160(F)") with its class, and gives every vehicle of an RhB
// train the number (EVN) of the train's first vehicle or unit: 80 85 00 and
// the five-digit vehicle number (Ge 4/4 III 642: 808500006420; Capricorn
// 3111's power car Be 4/4 31011: 808500310111; Allegra 3511's end car
// 35011: 808500350117) and a check digit; zb's carry none. So each car is
// told by its type, among its neighbours: a cab faces left at the front of
// its unit, right at its back. Samples (relay, 2026-10-23): IR 38 1149 Ge,
// BD_ALVRA, B, Bi, B, B, B, AB, A, At; RE 13 1047 three Capricorns; R 19
// 4629 ABe, Bi, ABe, B x4, AB, WS; Bernina Express 977 ABe, Bi, ABe, Ap, Ap,
// Bps, Bp x3; R 28 4147 Ge, B, B, BDt; zb LIX 2929 Ath150, Beh150, Bh150,
// BR150, Bh150, Beh150, Ath150 and a FINK; S 5 two SPATZ (ABt130, Be130,
// Bt130); Luzern-Engelberg Express 2981 ABt GSW, B1 GSW, B2 GSW, BD(S)-Globi,
// B(S-) x2, As(S/Pano), HGeII.
const flip = (k) => (k.endsWith("R") && TYPES[k.slice(0, -1)] ? k.slice(0, -1) : k + "R");
const vehNo = (car) => (/^\d{12}$/.test(car.number || "") ? Number(car.number.slice(6, 11)) : null);
const clean = (m) => (m || "").replace(/\(F\)/g, "").trim();
function rhbFormation(car, i, cars) {
  const ms = cars.map((c) => clean(c.model)), m = ms[i], has = (x) => ms.includes(x);
  const next = ms[i + 1], R = (k, left) => (left ? k : k + "R");
  if (m === "Ge") {
    const v = vehNo(car);
    return v >= 641 && v <= 653 ? "rhbGe3" : "rhbGe2";
  }
  // A Capricorn: At, B, Bi, Be (or turned round).
  // Drawn Be, Bi, B, At (the At's cab at the right); a unit with its At
  // first, every car turned.
  if (has("Be") && ["At", "B", "Bi", "Be"].includes(m)) {
    const u = i - (i % 4), turned = ms[u] === "At";
    const k = { Be: "rhbCapBe", Bi: "rhbCapBi", B: "rhbCapB", At: "rhbCapAtR" }[m];
    return turned ? flip(k) : k;
  }
  // An Allegra: ABe, Bi, ABe.
  if (m === "ABe") return R("rhbAlgEnd", next === "Bi");
  if (m === "Bi" && ms[i - 1] === "ABe" && next === "ABe") return "rhbAlgMid";
  // An Alvra set (its bike car, Bi, B, B, B, AB, A, the At).
  // Drawn from the locomotive: Ge, BD, Bi, B, B, B 577, AB, A, At; the
  // other way round, every car turned.
  if (has("BD_ALVRA") || (has("At") && has("A") && has("AB") && has("Bi"))) {
    const bi = ms.indexOf("Bi"), turned = ms.indexOf("At") < bi;
    const T = (k) => (turned ? flip(k) : k);
    if (m === "BD_ALVRA") return T("rhbBD564");
    if (m === "Bi") return T("rhbAlvBi");
    if (m === "B") {
      const k = turned ? ms.slice(i + 1, bi).filter((x) => x === "B").length : ms.slice(bi, i).filter((x) => x === "B").length;
      if (turned ? i > bi : i < bi) return T("rhbEwB");
      return T(k < 2 ? "rhbAlvB" : k === 2 ? "rhbAlvB577" : "rhbEwB");
    }
    if (m === "AB") return T("rhbAlvAB");
    if (m === "A") return T("rhbAlvA");
    if (m === "At") return T("rhbAtR");
  }
  // The panorama coaches: the Glacier Express's own types, else the
  // Bernina Express's.
  const gex = has("WRp") || has("Api") || has("Aps");
  if (m === "Ap") return gex ? "gexAp" : "bexAp";
  if (m === "Api") return "gexApi";
  if (m === "Aps") return "gexAps";
  if (m === "WRp" || m === "WR") return "gexWRp";
  if (m === "Bp" || m === "Bps") return gex ? "gexBp" : "bexBp";
  if (m === "At") return R("rhbAt", i < cars.length - 1);
  if (m === "Bt") return R("rhbBt", i < cars.length - 1);
  if (m === "BDt") return R("rhbBDt", i < cars.length - 1);
  // Standard coaches: on the Bernina line (an Allegra hauling them, no
  // control car) the short Bernina ones.
  const bernina = has("ABe") && !has("Bt") && !has("BDt");
  if (m === "A" || m === "As") return "rhbEwA";
  if (m === "AB") return "rhbEwAB";
  if (m === "BD" || m === "D") return "rhbEwBD";
  if (/^B/.test(m) || m === "WS") return bernina ? "rhbEwBs" : "rhbEwB";
  return null;
}
// A multiple unit's cars among a train's: the run of consecutive cars of
// its family (fam(model) true) cut into units of size k; gives [start,
// end] of the unit car i is in.
function unitOf(ms, i, fam, k) {
  let r = i;
  while (r > 0 && fam(ms[r - 1])) r--;
  const a = r + Math.floor((i - r) / k) * k;
  return [a, a + k - 1];
}
// zb: the ADLER (Ath, Beh, Bh, BR, Bh, Beh, Ath; the ABeh 151 with a
// multi-purpose car for the bistro), the FINK (Bth, Beh, ABth), the SPATZ
// (ABt, Be, Bt), the HGe 101 with the Luzern-Engelberg Express coaches.
function zbFormation(car, i, cars) {
  const ms = cars.map((c) => clean(c.model)), m = ms[i], last = i === cars.length - 1;
  if (/^HGe/.test(m)) return "zbHGe";
  if (/15[01]$/.test(m)) {
    // ADLER: the half before the bistro faces left, the half after it right.
    const br = ms.findIndex((x, j) => /^(BR|WR|R|MZ|BD|B)15[01]$/.test(x) && j > 0 && /^Bh15/.test(ms[j - 1] || "") && /^Bh15/.test(ms[j + 1] || ""));
    if (/^(BR|WR)15/.test(m)) return "zbAdWR";
    let start = i; while (start > 0 && /15[01]$/.test(ms[start - 1]) && !/^Ath/.test(ms[start])) start--;
    const k = /^Ath/.test(m) ? "zbAdA" : /^Beh/.test(m) ? "zbAdC" : /^Bh/.test(m) ? "zbAdB" : /^B/.test(m) ? "zbAdWR" : null;
    if (!k) return null;
    const right = br >= 0 ? i > br : /^Ath/.test(m) ? (i > 0 && /15[01]$/.test(ms[i - 1])) : false;
    return right ? flip(k) : k;
  }
  if (/16[012]$/.test(m)) {
    // Drawn Bth, Beh, ABth (first class at the right); turned when the
    // ABth comes first.
    const [a, b] = unitOf(ms, i, (x) => /16[012]$/.test(x || ""), 3);
    const turned = ms.slice(a, b + 1).indexOf(ms.slice(a, b + 1).find((x) => /^ABth/.test(x || ""))) === 0;
    const k = /^ABth/.test(m) ? "zbFinkAR" : /^Bth/.test(m) ? "zbFinkB" : "zbFinkC";
    return turned ? flip(k) : k;
  }
  if (/130$/.test(m)) {
    // Drawn ABt, Be, Bt (first class at the left); turned when the Bt
    // comes first.
    const [a] = unitOf(ms, i, (x) => /130$/.test(x || ""), 3);
    const turned = /^Bt/.test(ms[a]);
    const k = /^ABt/.test(m) ? "zbSpatzABt" : /^Bt/.test(m) ? "zbSpatzBtR" : "zbSpatzMid";
    return turned ? flip(k) : k;
  }
  if (/GSW/.test(m)) return /^ABt/.test(m) ? (last || (i > 0 && /GSW/.test(ms[i - 1])) ? "zbGswABtR" : "zbGswABt") : "zbGswB";
  if (/Pano/.test(m) || /^As/.test(m)) return "zbLexA";
  if (/^BD\(S/.test(m)) return "zbLexBD";
  if (/^B\(S/.test(m)) return "zbLexB";
  return null;
}
export const FORMATION = { rhb: rhbFormation, zb: zbFormation };

// ---------- Fleets (by EVN, for the fleet pages and single numbers) ----------
// 80 85 00 + the vehicle's number + check digit (as the service gives
// them): the Capricorns' power cars Be 4/4 31011-31072 and control cars At
// 31811-31872, the Allegras' end cars 35001-35015 and 35101-35115, the Ge
// 4/4 II 611-633 and Ge 4/4 III 641-653.
const evn = (a, b) => [8085000000000 / 10 + a * 10, 8085000000000 / 10 + b * 10 + 9];
export const FLEETS = {
  // MGB, zb and MOB by their running numbers (the formation service
  // doesn't cover the MGB and MOB; zb's vehicles come without numbers).
  mgb: [[2011, 2014, "mgbKoA"], [2021, 2028, "mgbKoA"], [2051, 2054, "mgbShEnd"], [301, 337, "mgbOrEnd"], [101, 109, "mgbHGe"], [3, 5, "mgbHGe"],
    [4040, 4045, "gexAp"], [4046, 4046, "gexAps"], [4061, 4067, "gexBp"], [3833, 3835, "gexWRp"]],
  zb: [[150001, 150004, "zbAdA"], [160001, 160006, "zbFinkB"], [161011, 161015, "zbFinkB"], [162021, 162030, "zbFinkB"], [130001, 130010, "zbSpatzABt"], [101961, 101968, "zbHGe"]],
  mob: [[8001, 8004, "mobGe44"], [9301, 9306, "mobABe93"], [9201, 9206, "mobBe92"], [181, 184, "mobGpxAst"], [191, 194, "mobGpxAs"], [271, 274, "mobGpxBsNF"],
    [281, 284, "mobGpxBs"], [291, 293, "mobGpxBsi"], [381, 384, "mobGpxABst"], [116, 117, "mobPanoAst"]],
  rhb: [[...evn(31011, 31072), "rhbCapBe"], [...evn(31811, 31872), "rhbCapAt"], [...evn(35001, 35015), "rhbAlgEnd"], [...evn(35101, 35115), "rhbAlgEnd"],
    [...evn(641, 653), "rhbGe3"], [...evn(611, 633), "rhbGe2"]],
};

// ---------- What usually runs (no formation) ----------
// The railways' own pages, Wikipedia's (2026) and the formations above:
// RhB: the Capricorns on the Prättigau, Davos, Engadin (Vereina),
// Surselva, Chur S-Bahn and Davos-Filisur trains, two coupled on the
// Landquart-Klosters RE 13 and RE 24 (and some RE 3, RE 4, R 15), split at
// Klosters; IR 38 / RE 38 / R 38 (Albula) a Ge 4/4 III with an Alvra set,
// its bike car and At (the locomotive at the Engadin end); the Arosa line
// an Allegra with Einheitswagen and a Bt control car; the Bernina line an
// Allegra with Einheitswagen; Alvaneu-Filisur (R 28) a Ge 4/4 II with two
// coaches and a BDt; the Bernina Express an Allegra with two first-class
// and four second-class panorama coaches; the Glacier Express (on the RhB)
// a Ge 4/4 III with Ap, Api, WRp and three Bp. A train numbered odd runs
// away from Chur and Landquart (toward St. Moritz, Davos, Scuol, Disentis,
// Arosa, Tirano).
const ends = (t) => `${t.origin || ""}|${t.destination || ""}`;
const odd = (t) => Number(String(t.number || "").replace(/\D.*$/, "")) % 2 === 1;
// A unit or set turned round: the keys reversed, each cab twin swapped.
const turn = (units) => units.slice().reverse().map(([k, n2]) => [flip(k), n2]);
const times = (k, units) => Array.from({ length: k }, () => units).flat();
const CAP1 = [["rhbCapAtR", 1], ["rhbCapBR", 1], ["rhbCapBiR", 1], ["rhbCapBeR", 1]];
const ALG1 = [["rhbAlgEnd", 1], ["rhbAlgMid", 1], ["rhbAlgEndR", 1]];
const FINK1 = [["zbFinkB", 1], ["zbFinkC", 1], ["zbFinkAR", 1]];
const SPATZ1 = [["zbSpatzABt", 1], ["zbSpatzMid", 1], ["zbSpatzBtR", 1]];
const ADLER1 = [["zbAdA", 1], ["zbAdC", 1], ["zbAdB", 1], ["zbAdWR", 1], ["zbAdBR", 1], ["zbAdCR", 1], ["zbAdAR", 1]];
// The GoldenPass Express's coaches, from the Montreux end (the Ast's cab
// leading) to the Interlaken end (the ABst's): for chstd.cars.js's BLS
// trains too (Zweisimmen-Interlaken, the coaches raised on their
// standard-gauge bogies when drawn for agency "bls"; there the BLS Re 465
// and the interface coach mobGpxBsi go at the Interlaken end).
export const GPX_COACHES = [["mobGpxAst", 1], ["mobGpxAs", 1], ["mobGpxBsNF", 1], ["mobGpxBs", 1], ["mobGpxABstR", 1]];
const toward = (t, re) => re.test(t.destination || "");
export const TYPICAL = {
  // MGB: the Zermatt shuttle (R 40); the Komets on R 41 and R 42 (Brig/
  // Visp/Fiesch-Zermatt); the Orions on R 43-R 45 (Visp-Andermatt-
  // Disentis, Göschenen); the Glacier Express an HGe 4/4 II with its
  // panorama coaches (on the MGB one six-coach set).
  mgb: (t) => {
    const r = t.route || "";
    if (/Glacier/.test(r)) {
      const u = [["mgbHGe", 1], ["gexAp", 1], ["gexApi", 1], ["gexWRp", 1], ["gexBp", 3]];
      return set("Glacier Express: HGe 4/4 II with panorama coaches (first class, the kitchen car, second class)", ...u);
    }
    if (r === "R 40" || /Täsch/.test(ends(t))) return set("Zermatt shuttle (BDSeh 4/8): three cars, second class", ["mgbShEnd", 1], ["mgbShMid", 1], ["mgbShEndR", 1]);
    if (/^R 4[12]$/.test(r)) return set("Komet (ABDeh 4/8 or 4/10): three or four cars, first class at one end", ["mgbKoA", 1], ["mgbKoPower", 1], ["mgbKoDR", 1]);
    return set("Orion (ABeh 8/12): three cars, first class behind each cab", ["mgbOrEnd", 1], ["mgbOrMid", 1], ["mgbOrEndR", 1]);
  },
  // MOB: the GoldenPass Express (a Ge 4/4 at the Zweisimmen end, coupled
  // to the ABst; photograph of 8002 with ABst 381, 2024); the GoldenPass
  // Panoramic (the Ast 116/117 at the Montreux end, the motor cars at the
  // other: approximate); the regional trains an ABe 4/4 9300 with a Be 4/4
  // 9200. Lenk-Zweisimmen (R 31) has older Be 4/4 5000s, not drawn.
  mob: (t) => {
    const r = t.route || "", up = toward(t, /Zweisimmen|Interlaken|Gstaad|Lenk|Château-d'Oex|Rougemont|Saanen|Montbovon|Les Avants|Chamby|Chernex/);
    if (/GoldenPass Express/.test(r)) {
      const u = [...GPX_COACHES, ["mobGe44R", 1]];
      return set("GoldenPass Express: the Prestige coaches with a MOB Ge 4/4 (a BLS Re 465 beyond Zweisimmen)", ...(up ? turn(u) : u));
    }
    if (/Panoramic/.test(r)) {
      const u = [["mobPanoAst", 1], ["mobPanoB", 2], ["mobBe92R", 1], ["mobABe93R", 1]];
      return set("GoldenPass Panoramic: a panorama control car and coaches with an ABe 4/4 and a Be 4/4", ...(up ? turn(u) : u));
    }
    if (r === "R 31") return null;
    return set("ABe 4/4 9300 and Be 4/4 9200 (first class in the ABe, at the Montreux end)", ...(up ? turn([["mobABe93", 1], ["mobBe92R", 1]]) : [["mobABe93", 1], ["mobBe92R", 1]]));
  },
  // The other railways, told by their lines and ends (routes as the
  // timetable names them, 2026). Lines whose trains aren't drawn here give
  // no train (Frauenfeld-Wil's Zebras, Gais-Altstätten, Rorschach-Heiden,
  // Rheineck-Walzenhausen, Aigle-Leysin, Aigle-Les Diablerets, Bex-Villars,
  // Le Locle-Les Brenets, Yverdon-Ste-Croix, Lauterbrunnen-Mürren, the
  // Schynige Platte, Rigi and Brienz Rothorn railways).
  chnarrowother: (t) => {
    const r = t.route || "", e = ends(t), two = (a, b) => [[a, 1], [b + "R", 1]];
    if (r === "S 17" || /Dietikon|Wohlen|Bremgarten/.test(e)) return set("Diamant (ABe 4/8): three cars, first class behind one cab", ["avaDiaA", 1], ["avaDiaMid", 1], ["avaDiaBR", 1]);
    if (r === "S 14" || /Menziken|Schöftland/.test(e)) return set("Saphir (ABe 4/12): three cars (some trains the two-car Saphir II)", ["avaSaphA", 1], ["avaSaphMid", 1], ["avaSaphBR", 1]);
    if (r === "S 60" || /Ponte Tresa|Lugano FLP/.test(e)) return set("Tramlink (Be 6/8)", ["flpTl", 1], ["flpTlR", 1]);
    if (r === "R 85" || /Martigny|Châtelard|Vallorcine|Marécottes|Finhaut/.test(e)) return set("Mont-Blanc Express (Beh 4/8, Stadler 2025)", ["tmrEndF", 1], ["tmrMid", 1], ["tmrEndSR", 1]);
    if (/Worb|Bolligen|Unterzollikofen/.test(e) || /^S [79]$/.test(r)) return set("Worbla (Be 4/10): four cars", ["rbsWorEnd", 1], ["rbsWorMid", 2], ["rbsWorEndR", 1]);
    if (r === "RE 5" || r === "S 8" || /Solothurn|Jegenstorf|Bätterkinden/.test(e) && /Bern/.test(e))
      return set(`NExT (RABe 4/12): three cars, first class at the Bern end${r === "S 8" ? " (the S 8 also has the older Seconda units)" : ""}`, ...(toward(t, /Bern$/) ? [["rbsNextA", 1], ["rbsNextMid", 1], ["rbsNextBR", 1]] : [["rbsNextB", 1], ["rbsNextMid", 1], ["rbsNextAR", 1]]));
    if (/^R 5[67]$/.test(r) || /Morges|Bière|L'Isle|Apples/.test(e)) return set("Stadler Be 4/4 with a low-floor coach and another Be 4/4", ["mbcBe", 1], ["mbcB", 1], ["mbcBeR", 1]);
    if (/^S 2[012]$/.test(r) || /Trogen|Speicher/.test(e)) return set("Tango (ABe 8/12): two halves", ["abTango", 1], ["abTangoR", 1]);
    if (r === "S 23" || /Wasserauen|Gossau/.test(e)) return set("Walzer (ABe 4/12): three cars, first class at one end", ["abWalzerB", 1], ["abWalzerMid", 1], ["abWalzerAR", 1]);
    if (r === "R 55" || /Nyon|St-Cergue|La Cure|Genolier/.test(e)) return set("ABe 4/8: two cars, first class behind one cab", ...two("nstcmA", "nstcmB"));
    if (/Locarno|Camedo|Domodossola|Intragna|Verdasio/.test(e) || /Centovalli/.test(r)) return set("Stadler three-car unit (some trains four cars)", ["fartA", 1], ["fartMid", 1], ["fartBR", 1]);
    if (r === "R 20" || /Bercher|Echallens|Lausanne-Flon/.test(e)) return set("Be 4/8: three cars", ["lebEnd", 1], ["lebMid", 1], ["lebEndR", 1]);
    if (/^R 6[12]$/.test(r)) return set("ABeh 4/8: three cars (some trains an ABDeh 8/8)", ["bobEndA", 1], ["bobMid", 1], ["bobEndBR", 1]);
    if (r === "R 35" || /Vevey|Blonay|Pléiades|Chevalleyres/.test(e)) return set("SURF (ABeh 2/6): a rack GTW", ["mvrGtw", 1], ["mvrGtwPower", 1], ["mvrGtwR", 1]);
    if (/Rochers-de-Naye|Caux/.test(e)) return set("Bhe 4/8: two cars", ["mgnHalf", 1], ["mgnHalfR", 1]);
    if (/Glovelier|Saignelégier|Noirmont|Tramelan|Breuleux/.test(e) || (r === "R 36")) return set("ABe 4/12: three cars, first class at one end", ["cjA", 1], ["cjMid", 1], ["cjBR", 1]);
    if (/Ponts-de-Martel|La Sagne|Corbatière/.test(e)) return set("ABe 4/8: two cars", ["transn", 1], ["transnR", 1]);
    if (r === "S 11" || r === "S 12" || /Oensingen|Langenthal|St. Urban|Wiedlisbach/.test(e)) return set("STAR (Be 4/8): two cars", ["asmStar", 1], ["asmStarR", 1]);
    if (r === "S 37" || /Täuffelen|Ins/.test(e)) return set("Stadler GTW (Be 2/6)", ["asmGtw", 1], ["asmGtwPower", 1], ["asmGtwR", 1]);
    if (r === "R 72" || /Champéry|Monthey/.test(e)) return set("Rack GTW (Beh 2/6)", ["tpcGtw", 1], ["tpcGtwPower", 1], ["tpcGtwR", 1]);
    if (/Wengernalp/.test(r)) return set("Bhe 4/8: three cars, the panorama car in the middle", ["wabEnd", 1], ["wabMid", 1], ["wabEndR", 1]);
    if (/Jungfrau/.test(r)) return set("Bhe 4/8: two halves", ["jbHalf", 1], ["jbHalfR", 1]);
    if (/Gornergrat/.test(r)) return set("Polaris (Bhe 4/6)", ["ggbHalf", 1], ["ggbHalfR", 1]);
    if (/Pilatus/.test(r)) return set("Bhe 2/2: two railcars", ["pilatus", 1], ["pilatus", 1]);
    if (/Generoso/.test(r)) return set("Bhe 4/8: two cars", ["mgHalf", 1], ["mgHalfR", 1]);
    return null;
  },
  // zb (formations, 2026-10-23): the Luzern-Interlaken Express an ADLER,
  // often with a FINK; the Luzern-Engelberg Express the HGe 101 with its
  // coaches and the ABt set (the HGe at the Engelberg end), until the
  // ABeh 151 arrive; S 4, S 41, S 44 and S 5 two SPATZ (or a FINK), S 55
  // and R 70 (Interlaken-Meiringen) a FINK.
  zb: (t) => {
    const r = t.route || "", away = /Interlaken|Engelberg|Giswil|Sachseln|Stans|Wolfenschiessen|Dallenwil|Meiringen|Horw|Innertkirchen/.test(t.destination || "");
    if (/Interlaken Express|LIX/.test(r)) return set("ADLER (ABeh 150): seven cars, first class at both ends, the bistro in the middle (often a FINK added)", ...ADLER1);
    if (/Engelberg Express|LEX/.test(r)) {
      const u = [["zbGswABt", 1], ["zbGswB", 2], ["zbLexBD", 1], ["zbLexB", 2], ["zbLexA", 1], ["zbHGe", 1]];
      return set("HGe 101 with the Luzern-Engelberg Express coaches and the ABt control-car set (the locomotive at the Engelberg end)", ...(away ? u : turn(u)));
    }
    if (/^(S 4|S 41|S 44|S 5)$/.test(r)) return set("SPATZ (ABe 130): two three-car units (some trains a FINK)", ...SPATZ1, ...SPATZ1);
    // Meiringen-Innertkirchen (the former MIB's GTW and Be 4/4): not drawn.
    if (r === "R 71" || /Innertkirchen/.test(ends(t))) return null;
    return set("FINK (ABeh 160/161/162): three cars, first class behind one cab", ...FINK1);
  },
  rhb: (t, reported) => {
    const r = t.route || "", e = ends(t), away = odd(t);
    const dir = (units) => (away ? units : turn(units));
    // The locomotive leads both ways (it runs round at the ends).
    if (/Glacier/.test(r)) return set("Glacier Express: Ge 4/4 III with panorama coaches (first class, the kitchen car, second class)",
      ["rhbGe3", 1], ["gexAp", 1], ["gexApi", 1], ["gexWRp", 1], ["gexBp", 3]);
    if (/Bernina/.test(r)) return set("Bernina Express: an Allegra with panorama coaches (two first class, four second)", ...ALG1, ["bexAp", 2], ["bexBp", 4]);
    if (/^(IR|RE|R) 38$/.test(r)) return set("Ge 4/4 III with an Alvra set: a bike car, six coaches (first class at the At's end) and the At control car",
      ...dir([["rhbGe3", 1], ["rhbBD564", 1], ["rhbAlvBi", 1], ["rhbAlvB", 2], ["rhbAlvB577", 1], ["rhbAlvAB", 1], ["rhbAlvA", 1], ["rhbAtR", 1]]));
    if (/^(R 16|RE 6)$/.test(r) || /Arosa/.test(e)) return set("Allegra with Einheitswagen and a Bt control car (the Arosa line)",
      ...dir([...ALG1, ["rhbEwAB", 1], ["rhbEwB", 1], ["rhbBtR", 1]]));
    if (/^(R 19|RE 9)$/.test(r) || /Tirano|Poschiavo/.test(e)) return set("Allegra with Einheitswagen (the Bernina line)", ...ALG1, ["rhbEwBs", 4], ["rhbEwAB", 1]);
    if (r === "R 28" || /Alvaneu/.test(e)) return set("Ge 4/4 II with two coaches and a BDt control car", ...dir([["rhbGe2", 1], ["rhbEwB", 2], ["rhbBDtR", 1]]));
    const two = /^(RE 13|RE 24|RE 3|RE 4|R 15)$/.test(r);
    return two ? set("Capricorn (ABe 4/16): two four-car units (first class in each control car)", ...dir(times(2, CAP1)))
      : set("Capricorn (ABe 4/16): four cars, the first class in the control car", ...dir(CAP1));
  },
};

// ---------- Fact sheets ----------
const W = (s, lang = "de") => `https://${lang}.wikipedia.org/wiki/${s}`;
const fact = (model, type, builder, built, fleet, lenM, source, about) => ({ model, type, builder, built, fleet, lengthFt: Math.round(lenM * F), source, about });
const CAPF = fact("RhB ABe 4/16 3111–3172 Capricorn", "Electric multiple unit, metre gauge", "Stadler Rail", "2019–2026", "62 four-car units", 76.4, W("RhB_ABe_4/16_3111–3172"),
  "The RhB's standard regional train: power car, two low-floor cars, the first-class control car. Up to four run coupled; they split at Klosters for Davos and the Engadin.");
const ALGF = fact("RhB ABe 8/12 Allegra", "Dual-voltage electric multiple unit", "Stadler Rail", "2009–2011", "15 three-car units", 49.5, W("RhB_ABe_8/12"),
  "Runs on the Bernina line's 1,000 V DC and the main network's 11 kV AC, so it hauls the Bernina Express from Chur to Tirano without a change.");
const ALVF = fact("RhB Alvra (Albula-Gliederzug)", "Articulated coach set", "Stadler Rail", "2015–2017", "6 six-coach sets with At control cars", 112.4, W("Albula-Gliederzug"),
  "The Chur–St. Moritz InterRegio's coaches, hauled toward the Engadin by a Ge 4/4 III and pushed back to Chur.");
const GEXF = fact("Glacier Express panorama coach", "Panorama coach", "Stadler Rail", "2006–2011", "about 50 cars (RhB and MGB)", 18.5, W("Panoramawagen_(Schweiz,_Schmalspur)"),
  "Six-car sets: Ap, Api, WRp, three Bp; the Excellence Class Aps added at one end.");
const BEXF = fact("Bernina Express panorama coach", "Panorama coach", "Stadler Rail", "2000, 2006–2007", "about 30 cars", 16.45, W("Bernina_Express"), "Two first-class and four second-class coaches behind an Allegra.");
const ORF = fact("MGB ABeh 8/12 Orion", "Rack electric multiple unit", "Stadler Rail", "2023–2029", "12 in service, 25 more from 2026", 56.6, W("MGB_Orion"),
  "Adhesion and Abt rack; runs Visp–Andermatt–Disentis and Göschenen–Andermatt.");
const KOF = fact("MGB ABDeh 4/8 and 4/10 Komet", "Rack electric multiple unit", "Stadler Rail", "2007–2008, 2014", "8 three-car and 4 four-car units", 56.7, W("MGB_Komet"),
  "A panorama power car between two low-floor end cars; the Brig/Visp–Zermatt trains.");
const ADF = fact("zb ABeh 150 ADLER", "Rack electric multiple unit", "Stadler Rail", "2012–2013", "4 seven-car units", 126, W("ZB_ABeh_150"),
  "The Luzern–Interlaken Express: two three-car halves with first class at the ends and the bistro car between them.");
const FIF = fact("zb ABeh 160/161/162 FINK", "Rack electric multiple unit", "Stadler Rail", "2012, 2016, 2026", "21 three-car units", 54, W("ZB_ABeh_160/161"), "Over the Brünig and up to Engelberg; often added to an ADLER.");
const SPF = fact("zb ABe 130 SPATZ", "Electric multiple unit", "Stadler Rail", "2004–2005", "10 three-car units", 51.9, W("Stadler_Spatz"), "Luzern's S-Bahn on the zb, usually two coupled.");
const GPXF = fact("GoldenPass Express coach", "Variable-gauge coach", "Stadler Rail; gauge-changing bogies by Alstom", "2018–2024", "23 cars", 18.75, W("GoldenPass_Express", "fr"),
  "Montreux–Interlaken without changing trains: at Zweisimmen the bogies change from metre to standard gauge and the body rises 185 mm.");
export const FACTS = {
  rhbCapBe: CAPF, rhbCapBi: CAPF, rhbCapB: CAPF, rhbCapAt: CAPF, rhbAlgEnd: ALGF, rhbAlgMid: ALGF,
  rhbAlvBi: ALVF, rhbAlvB: ALVF, rhbAlvB577: ALVF, rhbAlvAB: ALVF, rhbAlvA: ALVF, rhbAt: ALVF,
  rhbGe3: fact("RhB Ge 4/4 III", "Electric locomotive", "SLM and ABB", "1993–1994", "13", 16.0, W("RhB_Ge_4/4_III"), "The Albula line's locomotive; also the Vereina car trains."),
  rhbGe2: fact("RhB Ge 4/4 II", "Electric locomotive", "SLM, BBC and MFO", "1973, 1984–1985", "19 in service", 12.96, W("RhB_Ge_4/4_II"), "Push-pull trains with a BDt, the Glacier Express, extras."),
  gexAp: GEXF, gexApi: GEXF, gexAps: GEXF, gexBp: GEXF, gexWRp: GEXF, bexAp: BEXF, bexBp: BEXF,
  mgbOrEnd: ORF, mgbOrMid: ORF, mgbKoA: KOF, mgbKoD: KOF, mgbKoPower: KOF,
  mgbHGe: fact("MGB HGe 4/4 II", "Rack electric locomotive", "SLM, BBC and ABB", "1985–1990", "12", 14.78, W("HGe_4/4_II"), "The Glacier Express's locomotive on the MGB."),
  zbAdA: ADF, zbAdB: ADF, zbAdC: ADF, zbAdWR: ADF, zbFinkA: FIF, zbFinkB: FIF, zbFinkC: FIF, zbSpatzABt: SPF, zbSpatzBt: SPF, zbSpatzMid: SPF,
  mobGpxAst: GPXF, mobGpxAs: GPXF, mobGpxBs: GPXF, mobGpxBsNF: GPXF, mobGpxABst: GPXF, mobGpxBsi: GPXF,
};
for (const k of Object.keys(FACTS)) FACTS[k + "R"] ??= FACTS[k];
