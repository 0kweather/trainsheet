// DB Regio's trains in the north and east of Germany (scripts/railroads/
// germany.py, railroad "dbregio": Schleswig-Holstein, Hamburg, Niedersachsen,
// Bremen, Mecklenburg-Vorpommern, Brandenburg, Berlin, Sachsen-Anhalt,
// Sachsen and Thüringen). Germany publishes no formations, so every train is
// drawn as what usually runs on its line, labeled as typical. Trainsheet's
// own side views from published dimensions and recent photographs
// (Wikimedia Commons, 2024-2026), at the shared scale (js/carart.js), each
// in the paint most of its fleet wears in 2026; lettering and marks drawn
// here (no logo files). The builders below are exported for dbregio2.cars.js
// (DB Regio in the south and west), which may import them.

import { newId } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, poly, truck, pantograph, slats, win, coupledEnd } from "../carart.js?v=dev";
import { mark, twinEnded } from "./czechia.cars.js?v=dev";
import { hvac, roofCover, lamp, RED_LAMP, panGear, boxes } from "./digitraffic.cars.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const FT = 3.2808; // feet in a metre
export const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
const STROKE = 'stroke-linejoin="round" stroke-linecap="round"';
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const clip = (d, inner) => {
  const id = newId();
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`;
};
// Text in a mark() group (y down, centered at its origin).
export const txt = (x, y, h, text, fill, { weight = 700, family = SANS, anchor = "middle", spacing = 0, style = "", extra = "" } = {}) =>
  `<text x="${n(x)}" y="${n(y + h * 0.36)}" font-size="${n(h)}" text-anchor="${anchor}" font-weight="${weight}" letter-spacing="${spacing}" font-family="${family}" fill="${fill}"${style ? ` font-style="${style}"` : ""}${extra ? " " + extra : ""}>${text}</text>`;
// Lettering on a car side, h ft tall, centered at (x, y), reading left to
// right on a mirrored car too.
export const letters = (c, x, y, h, text, fill, o) => mark(c, x, y, txt(0, 0, h, text, fill, o));

// ===================== DB Regio's paint =====================
// From photographs (2024-2026): traffic red (RAL 3020) all over, light gray
// (RAL 7035) along the bottom, between the decks of the double-deck cars
// and on the doors; the roofs a dark gray; the locomotives' cab fronts a
// light gray band with the DB mark. Sampled from those photographs and
// lifted a little toward the paint's own color.
export const DBR = { red: "#d4161c", redDark: "#b8121a", gray: "#cfd2cf", grayDark: "#a9adab", roof: "#6d7277", roofLight: "#8d9296", under: "#3b3f44",
  yellow: "#f2c20f", mask: "#565b60", white: "#f2f3f1" };
// The DB mark: "DB" in a rounded frame, 7:5. neg: on red, the frame and
// letters white (as on DB Regio's red sides); else red on white.
export function dbMark(c, x, y, h, { neg = false, fill = null, rot = false } = {}) {
  const w = h * 1.4, ink = neg ? "#ffffff" : "#ec0016", bg = fill ?? (neg ? "none" : "#ffffff");
  return mark(c, x, y, (rot ? '<g transform="rotate(-90)">' : "") + `<rect x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${n(h)}" rx="${n(h * 0.16)}" fill="${bg}" stroke="${ink}" stroke-width="${n(h * 0.1)}"/>` +
    txt(0, 0.02 * h, h * 0.74, "DB", ink, { weight: 800, spacing: `${n(-0.02 * h)}`, extra: `textLength="${n(w * 0.7)}" lengthAdjust="spacingAndGlyphs"` }) + (rot ? "</g>" : ""));
}
// A class numeral by a door: white, bold.
const classNum = (c, x, y, k, h = 0.85, fill = "#ffffff") => letters(c, x, y, h, k, fill, { weight: 700 });
// The class plate by a unit's door: the classes' numerals stacked, a thin
// rule between them (Schleswig-Holstein's units: 1 over 2 where first
// class is aboard), white on the paint.
const classPlate = (c, x, y, classes, h = 1.0, fill = "#ffffff") => classes.map((k, i) => letters(c, x, y - i * h * 1.35, h, k, fill, { weight: 500 }) +
  (i ? rect(x - h * 0.3, y - (i - 0.5) * h * 1.35 - 0.03, h * 0.6, 0.06, fill) : "")).join("");
// The bicycle pictogram, white line art, h tall.
export const bike = (c, x, y, h, color = "#ffffff") => {
  const r = h * 0.3, s = `fill="none" stroke="${color}" stroke-width="${n(h * 0.075)}" ${STROKE}`;
  return mark(c, x, y, `<circle cx="${n(-h * 0.42)}" cy="${n(h * 0.2)}" r="${n(r)}" ${s}/><circle cx="${n(h * 0.42)}" cy="${n(h * 0.2)}" r="${n(r)}" ${s}/>` +
    `<path d="M${n(-h * 0.42)} ${n(h * 0.2)}L${n(-h * 0.12)} ${n(-h * 0.22)}L${n(h * 0.3)} ${n(-h * 0.22)}L${n(h * 0.42)} ${n(h * 0.2)}M${n(-h * 0.12)} ${n(-h * 0.22)}L${n(h * 0.05)} ${n(h * 0.2)}L${n(h * 0.3)} ${n(-h * 0.22)}M${n(-h * 0.2)} ${n(-h * 0.36)}L${n(-h * 0.02)} ${n(-h * 0.36)}M${n(h * 0.3)} ${n(-h * 0.22)}L${n(h * 0.24)} ${n(-h * 0.4)}L${n(h * 0.36)} ${n(-h * 0.42)}" ${s}/>`);
};

// ===================== Building blocks =====================

// A section of a car. o: outline (points, poly() style), base, paint(c, L)
// (clipped to the body), wins ([x0, x1, y0, y1, r, fill]), over(c, L)
// (clipped, over the windows), doors + door(c, d), trucks ([x, wb, d(in),
// kind]), truckTop, under(c, L) (behind), extra(c, L) (on top), gangway
// [floor, top] for the bellows at a coupled end; cab: the left end is a cab
// (no bellows there).
export function sec(c, o) {
  const L = c.L, d = poly(o.outline);
  let s = (o.trucks || []).map(([x, wb, dia, kind = "car", top = o.truckTop ?? 3.6]) => truck(x, { wb, d: dia, kind, top })).join("");
  if (o.under) s += o.under(c, L);
  let liv = o.paint(c, L);
  liv += (o.wins || []).map(([x0, x1, y0, y1, r = 0.42, fill]) => fill ? rect(x0, y0, x1 - x0, y1 - y0, fill, 0, `rx="${r}"`) : win(x0, y0, x1 - x0, y1 - y0, r)).join("");
  if (o.over) liv += o.over(c, L);
  s += path(d, o.base) + clip(d, liv);
  if (o.door) s += (o.doors || []).map((dr) => o.door(c, dr)).join("");
  if (o.extra) s += o.extra(c, L);
  s += path(d, "none", 0.8);
  const [floor, top] = o.gangway || [3.8, 12.6];
  if (c.coupledL && !o.cab) s += coupledEnd(0, -1, { floor, top, coupler: o.coupler ?? 3.4 });
  if (c.coupledR && !o.cabR) s += coupledEnd(L, 1, { floor, top, coupler: o.coupler ?? 3.4 });
  return s;
}
// An outline: from the nose's foot (or x0 at low) along the bottom (the
// steps given), up the right end to the roof (or down a nose at the right,
// noseR, points from the bottom up, measured from the right end), back
// along the roof and down the nose (its points from the bottom up).
export function box(L, { roof, low, r = 0.6, nose = null, noseR = null, bottom = null, x0 = 0.3, x1 = L - 0.3, well = null }) {
  const pts = [nose ? nose[0] : [x0, low]];
  if (bottom) pts.push(...bottom);
  if (noseR) pts.push(...noseR.map(([x, y]) => [L - x, y]));
  else if (well) {
    // The roof let down from well.a to the right end, to well.y.
    const { a, y } = well;
    pts.push([x1, low], [x1, y - r], ["q", x1, y, x1 - r, y], [a + 0.9, y], ["q", a, y, a - 0.3, y + 0.8], [a - 1.0, roof - 0.2], ["q", a - 1.3, roof, a - 2.0, roof]);
  } else pts.push([x1, low], [x1, roof - r], ["q", x1, roof, x1 - r, roof]);
  if (nose) pts.push(...reversePath(nose));
  else pts.push([x0 + r, roof], ["q", x0, roof, x0, roof - r]);
  return pts;
}
// poly() points traced backward, curves included (a nose drawn bottom-up,
// walked top-down to close an outline).
export function reversePath(pts) {
  const end = (p) => (p[0] === "q" ? [p[3], p[4]] : [p[0], p[1]]);
  const out = [end(pts[pts.length - 1])];
  for (let i = pts.length - 1; i > 0; i--) {
    const p = pts[i], to = end(pts[i - 1]);
    out.push(p[0] === "q" ? ["q", p[1], p[2], to[0], to[1]] : to);
  }
  return out;
}
// A smooth curve through points, as quadratic pieces (for noses).
export const curve = (pts) => {
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i], [x2, y2] = pts[i + 1];
    out.push(["q", x, y, (x + x2) / 2, (y + y2) / 2]);
  }
  out.push(pts[pts.length - 1]);
  return out;
};
// A plug door: its outline in the body, its two leaves, the windows.
export function plugDoor(x, w, y0, y1, { fill = DBR.gray, edge = "rgba(0,0,0,0.35)", glass = [y0 + (y1 - y0) * 0.35, y1 - 0.7], gw = 0.42, oval = true, leaves = 2, glassFill = C.glass } = {}) {
  let s = rect(x, y0, w, y1 - y0, fill, 0, `rx="0.2" stroke="${edge}" stroke-width="0.07"`);
  if (leaves === 2) s += line(x + w / 2, y0 + 0.05, x + w / 2, y1 - 0.05, edge, 0.5);
  const lw = w / leaves;
  for (let i = 0; i < leaves; i++) {
    const cx = x + lw * i + lw / 2;
    s += rect(cx - gw / 2, glass[0], gw, glass[1] - glass[0], glassFill, 0, `rx="${n(oval ? gw / 2 : 0.12)}"`);
  }
  return s;
}
// UIC buffers and the screw coupling's hook at a coach's end, at height y.
export function uicEnd(x, side, y = 3.45) {
  const a = side < 0 ? x : x - 1.1;
  return rect(a, y - 0.27, 1.1, 0.54, "currentColor", 0, 'opacity="0.85"') + rect(side < 0 ? x : x - 0.32, y - 0.62, 0.32, 1.24, C.steelDark, 0.4, 'rx="0.12"');
}
// The automatic coupler and the deflector under a nose at the left.
export function coupler(c, { x = 1.0, y = 3.1, defl = [1.2, 8.6, 1.9], color = "#2a2d31" } = {}) {
  if (c.coupledL) return "";
  let s = "";
  if (defl) s += path(poly([[defl[0] + 0.4, defl[2]], [defl[1], defl[2]], [defl[1] + 0.3, 0.85], [defl[0] + 1.6, 0.75]]), color);
  s += rect(0.3, y - 0.3, x + 0.4, 0.6, "currentColor", 0, 'opacity="0.9"') + rect(0, y - 0.7, 0.5, 1.4, "currentColor", 0, 'rx="0.15"') +
    rect(0.12, y + 0.75, 0.45, 0.35, C.steelDark, 0.3);
  return s;
}
const mirrorG = (c, svg) => `<g transform="matrix(-1 0 0 1 ${c.L} 0)">${svg}</g>`;

// ===================== Double-deck coaches ("Dosto") =====================
// Bombardier's (now Alstom's) double-deck coaches from Görlitz, DB Regio's
// mainstay behind its locomotives: 26.8 m over the buffers (the driving
// trailers 27.27 m), 4.63 m tall, Görlitz bogies on 920 mm wheels. Between
// the doors the lower deck sits 0.6 m over the rail; at one end a long
// section at an intermediate level (three windows, the toilet), at the other
// a short one (on a driving trailer the cab: the crew's window, one
// passenger window). From photographs (DBpbzfa 766 at Nienburg 2025 side
// on, measured; DBpza 751.4 in the Saar valley 2025; DABpzfa 762 at Dresden
// 2025 and an S 1 set on the Marienbrücke; driving trailers at Berlin-
// Gesundbrunnen, Osnabrück and Magdeburg 2025-2026): red, the roof dark
// gray; a light gray band between the decks, light gray under the lower
// deck's windows and along the bottom of the end sections; light gray
// doors with two tall oval windows; first class (upstairs) marked only by
// a yellow length of the gray band and a 1 by the door; the DB mark small
// in white over the lower windows, bicycle pictograms by the doors, the
// numerals small in white by the doors. The driving trailer's head: a
// domed front, the dark gray mask round the windshield and lamps, the gray
// roof cap running down to it.
const DD = { roof: 15.12, eave: 13.9, sill: 3.6, drop: 1.0, band: [9.55, 10.05], low: 2.6, upY: [10.3, 13.45], loY: [2.85, 6.05], endY: [6.2, 9.5],
  coach: 26.8 * FT, cab: 27.27 * FT, door: 4.3 };
// The 4th-generation driving trailer's head (from 2008), measured from the
// Nienburg photograph: points from the buffer beam up.
const DD_NOSE4 = curve([[1.0, 3.6], [0.6, 5.5], [0.65, 8.0], [0.95, 9.8], [1.55, 11.4], [2.6, 12.9], [4.0, 14.15], [5.8, 14.9], [7.8, 15.12]]);
// The 3rd-generation head (DABpbzfa 762, 1997-2007): flatter, the
// windshield more raked, the dome shorter.
const DD_NOSE3 = curve([[1.0, 3.6], [0.7, 5.4], [0.75, 8.6], [1.2, 10.4], [2.0, 12.4], [3.0, 13.9], [4.4, 14.8], [6.4, 15.12]]);
// kind: "mid" (second class), "mid1" (first class upstairs over half the
// car), "bike" (DBpza 751: a multi-purpose area, fewer lower windows),
// "cab4" / "cab3" (driving trailers, first class upstairs).
export function dosto(c, kind, lv = {}) {
  const L = c.L, cab = kind.startsWith("cab");
  const red = lv.red ?? DBR.red, gray = lv.gray ?? DBR.gray, roofC = lv.roof ?? DBR.roof;
  const nose = kind === "cab3" ? DD_NOSE3 : DD_NOSE4;
  const dw = DD.door, F = (f) => L * f;
  // Drawn with the short end (a driving trailer's cab) at the left: the
  // fractions measured from the long end, mirrored.
  const X = (f) => L * (1 - f);
  const d1 = cab ? X(0.80) : F(0.165), d2 = cab ? X(0.235) - dw : L - F(0.165) - dw;
  const a = d1 + dw, b = d2;
  const t1 = cab ? X(0.885) : F(0.12), t2 = cab ? X(0.127) : L - F(0.12);
  const bottom = [[d1 - 0.9, DD.sill], [d1 - 0.35, DD.drop + 0.4], ["q", d1 - 0.2, DD.drop, d1 + 0.3, DD.drop], [d2 + dw - 0.3, DD.drop], ["q", d2 + dw + 0.2, DD.drop, d2 + dw + 0.35, DD.drop + 0.4], [d2 + dw + 0.9, DD.sill]];
  const outline = box(L, { roof: DD.roof, low: DD.sill, r: 1.1, nose: cab ? nose : null, bottom, x0: 0.35, x1: L - 0.35 });
  // Upper deck: 11 windows over a driving trailer's double deck, 12 over a
  // coach's, from over one door to over the other; lower deck 8 between the
  // doors (6 and a bicycle area on the multi-purpose car).
  const upA = cab ? X(0.797) : d1 - 0.2, upB = cab ? X(0.229) : d2 + dw + 0.2, nUp = cab ? 11 : 12, pu = (upB - upA) / nUp;
  const up = seq(upA, pu, nUp).map((x) => [x + 0.45, x + pu - 0.45, DD.upY[0], DD.upY[1], 0.6]);
  const loA = cab ? X(0.721) : a + 1.2, loB = cab ? X(0.313) : b - 1.2;
  const nLo = kind === "bike" ? 6 : 8, pl = (loB - loA) / (kind === "bike" ? 8 : 8);
  const lo = seq(loA, pl, 8).slice(0, kind === "bike" ? 6 : 8).map((x) => [x + 0.25, x + pl - 0.25, DD.loY[0], DD.loY[1], 0.4]);
  // The long end's three windows; the short end's one (a coach's), or the
  // cab section's passenger and crew windows.
  // A coach: two windows at its left end, one at its right beside the
  // toilet's blank panels (DBpza 751.4).
  const ends = (cab ? [[X(0.072), X(0.040)], [X(0.141), X(0.092)], [X(0.181), X(0.149)]] : [[F(0.04), F(0.075)], [F(0.098), F(0.145)], [L - F(0.16), L - F(0.118)]])
    .map(([p, q]) => [p, q, DD.endY[0], DD.endY[1], 0.4]);
  if (cab) ends.push([X(0.883), X(0.838), 7.0, 10.0, 0.4]);
  // First class: the cab car's middle three upper windows (as on the
  // Dresden cab cars), the composite coach's upper deck at its short end.
  const first = kind === "mid1" ? [upA, upA + pu * 6] : cab ? [upA + pu * 4, upA + pu * 6.5] : null;
  return sec(c, {
    base: red, cab, outline, truckTop: DD.sill,
    trucks: [[t1, 8.2, 36], [t2, 8.2, 36]],
    paint: (cc) => {
      let s = rect(-1, -1, L + 2, 20, red) + rect(-1, DD.eave, L + 2, 4, roofC);
      s += rect(-1, DD.band[0], L + 2, DD.band[1] - DD.band[0], gray);
      // Light gray along the bottom: up to the lower windows on the low
      // deck, about 1 ft over the floor on the end sections.
      s += rect(-1, -1, L + 2, DD.sill + 2.0, gray) + rect(a - 1, DD.low, b - a + 2, 2.2, red);
      if (first) s += rect(first[0], DD.band[0], first[1] - first[0], DD.band[1] - DD.band[0], DBR.yellow);
      if (cab) {
        // The gray roof cap down the dome to the windshield; the dark mask
        // round the windshield and the lamps; the cab section's gray band.
        s += path(poly([[-1, 11.6], [1.4, 11.2], ["q", 2.7, 12.6, 4.2, 13.4], ["q", 6.2, 13.9, 9.5, DD.eave], [9.5, 16], [-1, 16]]), roofC);
        s += path(poly([[-1, 4.6], [1.6, 4.6], ["q", 2.2, 7.0, 2.0, 9.6], ["q", 1.9, 10.6, 1.25, 11.25], [-1, 11.6]]), lv.mask ?? DBR.mask);
        s += path(poly([[0.85, 9.75], [1.55, 9.75], ["q", 1.85, 10.3, 1.5, 11.0], [1.3, 11.15]]), C.glass);
        s += rect(-1, 5.3, X(0.80) - 0.2, 0.55, gray);
        // The crew's side window.
        s += rect(X(0.97), 7.0, X(0.926) - X(0.97), 3.0, "#1b1d20", 0, 'rx="0.35"') + rect(X(0.97) + 0.2, 7.2, X(0.926) - X(0.97) - 0.4, 2.6, C.glass, 0, 'rx="0.28"') +
          rect(X(0.97) + 0.3, 8.6, X(0.926) - X(0.97) - 0.6, 1.0, C.glassLight, 0, 'rx="0.2"');
      }
      // The long end's vent grille, low; a coach's toilet panels.
      if (cab) s += rect(X(0.072), 3.95, X(0.040) - X(0.072), 1.6, "rgba(0,0,0,0.25)", 0, 'rx="0.1"');
      else s += rect(L - F(0.105), 7.0, F(0.075), 3.0, "none", 0, 'rx="0.1" stroke="rgba(0,0,0,0.22)" stroke-width="0.06"') + rect(L - F(0.105), 4.35, F(0.075), 2.5, "none", 0, 'rx="0.1" stroke="rgba(0,0,0,0.22)" stroke-width="0.06"');
      return s;
    },
    wins: [...up, ...lo, ...ends],
    over: (cc) => {
      const m = (a + b) / 2;
      let s = dbMark(cc, m + (cab ? 4.5 : -6), 8.2, 0.85, { neg: true }) + bike(cc, a + 2.4, 7.9, 1.5) + bike(cc, b - 2.4, 7.9, 1.5);
      s += classNum(cc, d1 - 0.55, 5.6, "2") + classNum(cc, d2 + dw + 0.55, 5.6, "2");
      if (first) s += classNum(cc, d1 - 0.55, 8.0, "1");
      if (lv.over) s += lv.over(cc, L, { a, b, d1, d2 });
      return s;
    },
    doors: [{ x: d1 }, { x: d2 }],
    door: (cc, dr) => plugDoor(dr.x, dw, DD.drop + 0.3, DD.band[0] - 0.25, { fill: gray, glass: [3.4, 8.2], gw: 0.6 }),
    extra: (cc) => {
      // Roof: the air-conditioning hood at each end; the buffers; the
      // cab's lamps.
      let s = hvac(cab ? 9.0 : 2.5, DD.roof, 6.5, 0.4, "#6f7479") + hvac(L - 9.0, DD.roof, 6.5, 0.4, "#6f7479");
      if (cab) s += lamp(0.7, 6.9, 0.3, 0.45) + lamp(0.68, 6.2, 0.25, 0.3, RED_LAMP) + uicEnd(0.2, -1, 3.45) + uicEnd(L, 1, 3.45);
      else s += uicEnd(0, -1, 3.45) + uicEnd(L, 1, 3.45);
      return s;
    },
    gangway: [3.9, 13.4],
  });
}

// ===================== Locomotives =====================
// A four-axle locomotive body, symmetric (cab at each end), from its half:
// o: L, roof, sill, nose (points bottom up), centers, wheel, wb, paint(c,
// L) (each half, drawn mirrored), over(c, L) (once), grilles, pans.
export function loco(c, o) {
  const L = c.L;
  const half = (h) => {
    const d = poly([o.nose[0], [L / 2 + 1, o.sill], [L / 2 + 1, o.roof], ...reversePath(o.nose)]);
    let s = path(d, o.base) + clip(d, o.paint(h, L)) + path(d, "none", 0.8);
    if (o.cab) s += o.cab(h, L);
    return s;
  };
  const id = newId();
  let s = `<clipPath id="${id}"><rect x="-5" y="-5" width="${L / 2 + 0.01 + 5}" height="30"/></clipPath>`;
  const hl = half({ ...c, cabL: true }), hr = half({ ...c, cabL: true, mirrored: !c.mirrored });
  const c2 = o.centers / 2;
  for (const k of [-1, 1]) s += truck(L / 2 + k * c2, { wb: o.wb ?? 8.5, d: o.wheel ?? 49, kind: "loco", top: o.sill });
  if (o.under) s += o.under(c, L);
  s += `<g clip-path="url(#${id})">${hl}</g><g transform="matrix(-1 0 0 1 ${L} 0)"><g clip-path="url(#${id})">${hr}</g></g>`;
  if (o.over) s += o.over(c, L);
  for (const [k, side] of [[0, -1], [L, 1]]) s += locoBuffers(k, side, o.bufferY ?? 3.45, o.beam ?? 1.5);
  return s;
}
// A locomotive's buffers, headstock and the screw coupling's hook.
function locoBuffers(x, side, y, reach) {
  const at = (v) => x - side * v;
  const span = (p, q) => [Math.min(at(p), at(q)), Math.abs(q - p)];
  const [hx, hw] = span(reach - 0.1, reach + 0.6), [bx, bw] = span(0.3, reach);
  return rect(hx, 2.5, hw, 1.6, "currentColor", 0, 'opacity="0.88"') + rect(bx, y - 0.27, bw, 0.54, "currentColor", 0, 'opacity="0.78"') +
    rect(Math.min(at(0), at(0.32)), y - 0.62, 0.32, 1.24, C.steelDark, 0.4, 'rx="0.12"');
}

// --- Bombardier TRAXX P160 AC2 (DB 146.1 and 146.2, 2004-2006; 146.0's
// AC1 alike): 18.9 m over the buffers, Bo'Bo', bogies 10.44 m apart on
// 1,250 mm wheels, 4.28 m tall. The TRAXX's front: an upright lower nose
// over the buffer beam, the windshield raked back, the roof's edge rounded;
// on the side a crew door behind each cab, the machine room's grilles high
// toward the middle. DB Regio's paint (146 101, 103 and 107 at Wunstorf,
// Bremen and Norddeich 2024-2026): red, the underframe and the cab's sill
// dark gray, the front's light gray band across the headlights carrying
// the DB mark; the roof gray.
const NOSE_146 = [[1.25, 4.05], [1.0, 5.2], [0.95, 8.0], ["q", 1.05, 8.9, 1.6, 9.25], [2.55, 12.05], ["q", 2.85, 12.95, 4.0, 12.95]];
export function traxx146(c, { lv = "regio" } = {}) {
  const L = c.L;
  return loco(c, {
    roof: 12.95, sill: 4.05, nose: NOSE_146, centers: 10.44 * FT, wheel: 49, wb: 8.5, base: DBR.red,
    paint: (h) => {
      let s = rect(-1, -1, L + 2, 20, DBR.red) + rect(-1, 11.95, L + 2, 3, DBR.roofLight) + rect(-1, -1, L + 2, 6.6, DBR.gray) + rect(1.6, -1, L, 4.15, "#4a4f55");
      // The front's gray band at the headlights.
      s += path(poly([[-1, 6.4], [1.6, 6.4], [1.6, 7.6], [-1, 7.6]]), DBR.gray);
      // Windshield and the cab's side window; the crew door.
      s += path(poly([[1.75, 9.45], [2.55, 9.45], [3.3, 12.0], [2.6, 12.0]]), C.glass);
      s += rect(4.1, 9.0, 1.7, 2.3, "#1b1d20", 0, 'rx="0.3"') + rect(4.25, 9.15, 1.4, 2.0, C.glass, 0, 'rx="0.25"');
      s += rect(6.3, 4.6, 2.2, 7.0, "none", 0, 'rx="0.15" stroke="rgba(0,0,0,0.35)" stroke-width="0.07"') + rect(6.75, 9.0, 1.3, 1.9, C.glass, 0, 'rx="0.2"');
      // Machine-room grilles high on the side.
      for (const [x, w] of [[L / 2 - 13.5, 4.6], [L / 2 - 7.6, 5.4]]) s += rect(x, 9.4, w, 1.9, "rgba(25,20,20,0.35)", 0, 'rx="0.1"') + slats(x, 9.4, w, 1.9, 0.3, "rgba(255,255,255,0.18)");
      return s;
    },
    cab: (h) => lamp(1.05, 6.6, 0.32, 0.4) + lamp(1.0, 5.75, 0.28, 0.3, RED_LAMP) + rect(1.0, 12.9, 1.2, 0.35, "currentColor"),
    under: (cc) => rect(L / 2 - 9.5, 1.7, 19, 2.35, "#2d3135", 0, 'rx="0.2"') + rect(L / 2 - 8.5, 1.3, 6.5, 0.6, "#2d3135", 0, 'rx="0.3"'),
    over: (cc) => pantograph(L * 0.3, 12.95 + 0.35, { up: false }) + pantograph(L * 0.7, 12.95 + 0.35, { up: true, facing: -1 }) +
      roofCover(L / 2 - 9, 12.95, 18, 0.55, "#7c8186") + dbMark(cc, L - 10.8, 8.9, 1.35, { rot: true }),
  });
}

// --- DB 112.1 (DR 212, LEW Hennigsdorf, 1990-1992): 16.64 m over the
// buffers, Bo'Bo', bogies 7.9 m apart on 1,250 mm wheels. A flat front, two
// windshield panes leaning back a little, the roof's edge rounded; the
// sides ribbed between the crew doors, a row of small windows and grilles
// high up. DB Regio's paint (112 168 and 112 179 at Hamburg, 2024-2025):
// red, the frame and its skirt light gray, the front's light gray band
// with the DB mark; the roof gray.
const NOSE_112 = [[1.1, 4.0], [1.0, 8.6], ["q", 1.05, 9.2, 1.4, 9.4], [2.0, 12.1], ["q", 2.25, 12.85, 3.2, 12.85]];
export function br112(c) {
  const L = c.L;
  return loco(c, {
    roof: 12.85, sill: 4.0, nose: NOSE_112, centers: 7.9 * FT, wheel: 49, wb: 10.2, base: DBR.red,
    paint: (h) => {
      let s = rect(-1, -1, L + 2, 20, DBR.red) + rect(-1, 11.95, L + 2, 3, DBR.roofLight) + rect(-1, -1, L + 2, 7.9, DBR.gray) + rect(-1, 6.85, L + 2, 0.1, "#8f9391");
      s += path(poly([[-1, 6.4], [1.5, 6.4], [1.5, 7.5], [-1, 7.5]]), DBR.gray);
      s += path(poly([[1.25, 9.6], [1.95, 9.6], [2.6, 12.0], [1.9, 12.0]]), C.glass);
      s += rect(5.6, 5.1, 2.0, 6.6, "none", 0, 'rx="0.12" stroke="rgba(0,0,0,0.35)" stroke-width="0.07"') + rect(5.95, 9.0, 1.3, 1.9, C.glass, 0, 'rx="0.2"');
      // The machine room's side, ribbed lengthwise.
      const segs = [];
      for (let y = 6.7; y < 11.6; y += 0.62) segs.push([8.4, y, L / 2 + 0.5, y]);
      s += lines(segs, "rgba(0,0,0,0.16)", 0.5) + lines(segs.map(([x, y0, x2, y1]) => [x, y0 + 0.1, x2, y1 + 0.1], "rgba(255,255,255,0.12)"), "rgba(255,255,255,0.14)", 0.4);
      return s;
    },
    cab: (h) => lamp(1.1, 6.55, 0.3, 0.4) + lamp(1.08, 5.75, 0.26, 0.3, RED_LAMP),
    under: (cc) => rect(L / 2 - 6.0, 1.9, 12, 2.1, "#2d3135", 0, 'rx="0.2"'),
    over: (cc) => pantograph(L * 0.29, 12.85 + 0.35, { up: false }) + pantograph(L * 0.71, 12.85 + 0.35, { up: true, facing: -1 }) +
      roofCover(L / 2 - 7, 12.85, 14, 0.5, "#7c8186") + dbMark(cc, L / 2 + 4, 9.6, 1.2, { rot: true }),
  });
}

// ===================== Bombardier Talent 2 (DB 442) =====================
// Electric units of two to five cars on Jakobs bogies (2008-2014): 40.1,
// 56.2, 72.3 and 88.4 m, so the end cars about 20.0 m and the middle cars
// 16.1 m between the joints; 4.26 m tall; the floor 0.695 m over the rail
// between the bogies, raised over the end car's motor bogie behind the
// cab; one door a side in each car (two in the S-Bahn Rostock's and the
// FEX's middle cars' 800 mm versions alike), 1.3 m wide; the pantograph
// on one end car's roof. The nose's long beak under a steeply raked
// windshield. DB Regio's paint (442 637 at Berlin Alexanderplatz 2026, 442
// 778/809/207 at Nienburg and Bremen 2026, 442 340 at Rostock-Marienehe
// 2026): red, the windows in an anthracite band that sweeps up round the
// windshield; a light gray stripe under the end cars' windows (broken by
// REGIO and the DB mark in white) and over the middle cars' windows;
// light gray doors and skirt; first class (an end car's front half)
// under a yellow line.
// The silver S-Bahn Mitteldeutschland units (1442) on RE 13 and RE 14:
// silver, the doors green (the first series) or red, the cab's mask and
// window band anthracite.
const T2 = { roof: 14.0, eave: 12.6, sill: 3.5, drop: 1.0, win: [4.9, 9.25], band: [4.7, 9.6], stripe: [3.5, 4.1], skirt: 2.4, end: 20.05 * FT, mid: 16.1 * FT };
// The nose, measured from the Alexanderplatz photograph: the beak low and
// far forward, the windshield raked well back, the roof's crown 3.8 m back.
const T2_NOSE = curve([[1.4, 2.0], [0.55, 3.0], [0.6, 4.4], [1.4, 5.4], [2.6, 6.4], [4.0, 7.8], [5.6, 9.8], [7.2, 11.8], [8.8, 13.2], [10.6, 13.85], [12.0, 14.0]]);
export const T2_LV = {
  regio: { body: DBR.red, band: "#45494d", stripe: DBR.gray, door: DBR.gray, skirt: DBR.gray, roof: DBR.red, mask: "#3a3e42", word: true },
  mdsb: { body: "#c9cdd0", band: "#4a4f54", stripe: null, door: "#5fae3c", skirt: "#a7acaf", roof: "#9aa0a5", mask: "#33373b", word: false },
};
// kind: "cab" (an end car), "cab1" (with first class), "mid".
export function talent2(c, kind, lvKey = "regio") {
  const L = c.L, cab = kind !== "mid", lv = T2_LV[lvKey];
  const dw = 4.27;
  const door = cab ? 33.6 : L / 2 - dw / 2;
  const bottom = cab ? [[14.0, 3.2], [14.6, T2.drop + 0.4], ["q", 14.8, T2.drop, 15.4, T2.drop], [L - 5.4, T2.drop], ["q", L - 4.8, T2.drop, L - 4.6, T2.drop + 0.4], [L - 4.2, T2.sill]]
    : [[0.3, T2.sill], [4.2, T2.sill], [4.6, T2.drop + 0.4], ["q", 4.8, T2.drop, 5.4, T2.drop], [L - 5.4, T2.drop], ["q", L - 4.8, T2.drop, L - 4.6, T2.drop + 0.4], [L - 4.2, T2.sill]];
  const outline = box(L, { roof: T2.roof, low: T2.sill, r: 0.9, nose: cab ? T2_NOSE : null, bottom: cab ? bottom : bottom.slice(1), x0: 0.3, x1: L - 0.3 });
  const W = (x, w) => [x, x + w, T2.win[0], T2.win[1], 0.5];
  const wins = cab ? [W(18.0, 4.3), W(23.0, 4.3), W(28.0, 4.6), W(40.0, 5.6), W(46.4, 5.6), W(52.8, 5.6)]
    : [W(5.4, 5.0), W(11.2, 5.0), W(17.0, 4.7), W(door + dw + 1.4, 4.7), W(door + dw + 6.9, 5.0), W(door + dw + 12.7, 5.0)];
  const first = kind === "cab1" ? [13.2, door - 0.6] : null;
  return sec(c, {
    base: lv.body, cab, outline, truckTop: T2.sill,
    trucks: cab ? [[9.0, 7.55, 33], [L, 9.2, 30]] : [[L, 9.2, 30]],
    paint: (cc) => {
      const x0 = cab ? 12.5 : -1;
      let s = rect(-1, -1, L + 2, 20, lv.body) + rect(x0, T2.eave, L + 2, 4, lv.roof);
      s += rect(x0, T2.band[0], L + 2, T2.band[1] - T2.band[0], lv.band);
      // The light gray skirt along the bottom, up to the stripe's foot.
      s += rect(-1, -1, L + 2, (lv.word ? 3.35 : T2.skirt) + 1, lv.skirt);
      if (lv.stripe) s += cab ? rect(14.0, T2.stripe[0], L - 14.4, T2.stripe[1] - T2.stripe[0], lv.stripe) : rect(-1, 9.85, L + 2, 0.5, lv.stripe);
      if (first) s += rect(first[0], 9.85, first[1] - first[0], 0.4, DBR.yellow);
      if (cab) {
        // The anthracite sweeping from the windshield into the window band;
        // the windshield; the cab's raised floor over the motor bogie.
        // The band runs on forward and up the windshield's edge to the
        // roof; the lower nose stays red.
        s += path(poly([[13.0, T2.band[0]], [10.0, T2.band[0]], ["q", 5.6, T2.band[0], 2.6, 6.0], [1.6, 6.6], [7.0, 13.6], [9.4, 14.6], [13.0, 14.6], [13.0, 12.6], [11.6, 12.6], ["q", 10.4, 12.4, 10.6, 10.6], ["q", 11.0, T2.band[1], 13.0, T2.band[1]]]), lv.mask);
        s += path(poly([[3.3, 6.9], [4.3, 6.7], ["q", 6.2, 9.0, 7.7, 11.4], ["q", 8.3, 12.6, 7.6, 12.3], ["q", 5.2, 9.6, 3.3, 6.9]]), C.glass);
      }
      return s;
    },
    wins,
    over: (cc) => {
      let s = "";
      if (cab && lv.word) {
        // REGIO and the DB mark in white, breaking the stripe.
        s += rect(20.3, T2.stripe[0] - 0.05, 12.3, T2.stripe[1] - T2.stripe[0] + 0.1, lv.body) +
          letters(cc, cc.mirrored ? 28.7 : 23.9, 3.85, 2.4, "REGIO", "#ffffff", { weight: 600, family: "Roboto Condensed, Arial Narrow, Helvetica Neue, Arial, sans-serif", extra: 'textLength="5.6" lengthAdjust="spacingAndGlyphs"' }) + dbMark(cc, cc.mirrored ? 23.1 : 29.5, 3.85, 1.55, { neg: true });
      }
      if (cab && !lv.word) s += dbMark(cc, 26.0, 3.8, 0.9, { neg: false });
      if (lv.word) s += dbMark(cc, door - 1.6, 4.9, 0.55, { neg: true });
      if (first) s += classNum(cc, door - 0.6, 10.1, "1", 0.9);
      return s;
    },
    doors: [{ x: door }].concat(cab ? [{ x: 14.6, crew: true }] : []),
    door: (cc, dr) => dr.crew ? rect(dr.x, 3.6, 1.8, 7.9, "none", 0, 'rx="0.15" stroke="rgba(0,0,0,0.4)" stroke-width="0.07"') + rect(dr.x + 0.4, 7.4, 1.0, 2.3, C.glass, 0, 'rx="0.2"')
      : plugDoor(dr.x, dw, T2.drop + 0.6, 8.85, { fill: lv.door, glass: [4.3, 8.2], gw: 1.15, oval: false }),
    extra: (cc) => {
      let s = "";
      if (cab) s += roofCover(15.5, T2.roof, 15, 0.75, "#5b6065", 3) + lamp(1.4, 4.9, 0.5, 0.45) + coupler(cc, { x: 0.9, y: 2.7, defl: null });
      if (kind === "cab1") s += pantograph(40, T2.roof + 0.3, { up: true, facing: -1 }) + panGear(40, T2.roof, 1);
      if (!cab) s += hvac(8, T2.roof, 10, 0.6, "#5b6065");
      return s;
    },
    gangway: [2.6, 12.6],
  });
}

// ===================== Double-deck units =====================
// A double-deck unit's car: o.nose (a cab car, cab at the left), doors
// ([x...], o.dw wide), up/lo (upper and lower deck windows, [x, w]), ends
// (the end sections' windows, [x, w]), well ([a, b, y]: the roof let down
// for a pantograph), drop [a, b] (the lower deck's underside), trucks,
// paint(c, L), over(c, L), extra(c, L), door fill and the window heights.
function ddCar(c, o) {
  const L = c.L, dw = o.dw ?? 4.3;
  const [a, b] = o.drop;
  const bottom = [[a - 0.9, o.sill], [a - 0.35, o.dropY + 0.4], ["q", a - 0.2, o.dropY, a + 0.3, o.dropY], [b - 0.3, o.dropY], ["q", b + 0.2, o.dropY, b + 0.35, o.dropY + 0.4], [b + 0.9, o.sill]];
  const outline = box(L, { roof: o.roof, low: o.sill, r: 1.0, nose: o.nose || null, bottom, x0: 0.35, x1: L - 0.35, well: o.well ? { a: o.well[0], y: o.well[1] } : null });
  const W = (y) => ([x, w]) => [x, x + w, y[0], y[1], o.winR ?? 0.5];
  return sec(c, {
    base: o.base, cab: !!o.nose, outline, truckTop: o.sill, trucks: o.trucks,
    paint: (cc) => o.paint(cc, L),
    wins: [...o.up.map(W(o.upY)), ...o.lo.map(W(o.loY)), ...(o.ends || []).map(W(o.endY))],
    over: (cc) => (o.over ? o.over(cc, L) : ""),
    doors: o.doors.map((x) => ({ x })),
    door: (cc, dr) => plugDoor(dr.x, dw, o.dropY + 0.3, o.doorTop, { fill: o.doorFill, glass: [3.4, o.doorTop - 0.8], gw: 0.55 }),
    extra: (cc) => (o.extra ? o.extra(cc, L) : "") + (o.nose ? lamp(o.lampX ?? 0.6, o.lampY ?? 5.0, 0.35, 0.4) + coupler(cc, { x: 0.8, y: 3.0, defl: null }) : ""),
    gangway: [3.9, 13.4],
  });
}
const span = (a, b, k, gap = 0.9) => { const p = (b - a) / k; return seq(a, p, k).map((x) => [x + gap / 2, p - gap]); };

// --- Bombardier Twindexx Vario (DB 445, Schleswig-Holstein's Netz Mitte,
// 2017-2018; 17 four-car units, RE 7 and RE 70, two coupled): end cars
// 25.98 m, the middle cars 26.8 m, 4.63 m tall. The end car: the cab, its
// crew window, two windows at an intermediate level over the motor bogie,
// a door, the double deck, a door, and the roof let down over the inner
// end for the pantograph. From photographs (445 018 at Pinneberg 2022, 445
// 037 at Prisdorf 2025, 445 017 at Hamburg 2025): Schleswig-Holstein's
// green design: slate blue, a pale blue-gray band along the roof's edge, a
// white line low down, lime green doors; the cab lime green to an S-curve
// ahead of the first door; first class (upstairs at the cab end) under a
// yellow band between the decks; NAH.SH's mark (its dot map of the state
// and the name) in white behind the cab.
export const SHG = { slate: "#3d5064", lime: "#b3d332", edge: "#a6b6c4", nose: "#a3b0bc", white: "#eef1f2", yellow: "#f3c623" };
const TDX = { roof: 15.12, sill: 3.6, dropY: 1.0, upY: [10.3, 13.3], loY: [2.9, 6.1], endY: [6.6, 10.2], end: 25.98 * FT, mid: 26.8 * FT, doorTop: 9.4 };
const TDX_NOSE = curve([[1.1, 2.4], [0.5, 3.4], [0.45, 5.6], [0.8, 8.0], [1.6, 10.2], [2.8, 12.4], [4.4, 14.2], [6.4, 15.0], [8.4, 15.12]]);
// The NAH.SH mark: the state as a field of dots, and the name.
export function nahsh(c, x, y, h, fill = "#ffffff", dots = true) {
  let inner = "";
  if (dots) {
    const rows = [[0.1, 0.5], [0.0, 0.62], [0.05, 0.7], [0.15, 0.62], [0.25, 0.55], [0.3, 0.45], [0.35, 0.4], [0.4, 0.35], [0.5, 0.3]];
    rows.forEach(([x0, w], i) => { for (let u = x0; u <= x0 + w; u += 0.11) inner += `<circle cx="${n((u - 1.0) * h)}" cy="${n((i * 0.11 - 0.45) * h)}" r="${n(0.035 * h)}" fill="${fill}"/>`; });
  }
  return mark(c, x, y, inner + txt(dots ? -0.2 * h : 0, -0.02 * h, 0.62 * h, "NAH.SH", fill, { weight: 500, anchor: dots ? "start" : "middle", spacing: `${n(-0.01 * h)}` }));
}
export function twindexx445(c, kind) {
  const L = c.L, cab = kind !== "mid";
  const dw = 4.3;
  const doors = cab ? [19.2, L - 17.4] : [14.6, L - 14.6 - dw];
  const [d1, d2] = doors;
  const up = cab ? span(d1 - 0.4, d2 + dw + 0.2, 11) : span(d1 - 0.2, d2 + dw + 0.2, 12);
  const lo = span(d1 + dw + 1.0, d2 - 1.0, 6, 0.8);
  const ends = cab ? [[8.4, 2.0], [12.2, 2.4], [15.2, 2.4]] : [[4.0, 3.6], [L - 7.6, 3.6]];
  const first = kind === "cab1" ? [d1 + dw, d1 + dw + 26] : null;
  return ddCar(c, {
    base: SHG.slate, nose: cab ? TDX_NOSE : null, roof: TDX.roof, sill: TDX.sill, dropY: TDX.dropY, drop: [d1, d2 + dw],
    upY: TDX.upY, loY: TDX.loY, endY: TDX.endY, doorTop: TDX.doorTop, doorFill: SHG.lime, doors, dw, up, lo, ends,
    well: cab ? [L - 11.0, 13.2] : null,
    trucks: cab ? [[9.4, 8.9, 36], [L - 6.6, 8.2, 36]] : [[6.4, 8.2, 36], [L - 6.4, 8.2, 36]],
    paint: (cc) => {
      let s = rect(-1, -1, L + 2, 20, SHG.slate) + rect(-1, 13.75, L + 2, 3, SHG.edge) + rect(-1, 2.25, L + 2, 0.22, SHG.white);
      if (first) s += rect(first[0], 9.55, first[1] - first[0], 0.5, SHG.yellow);
      if (cab) {
        // The lime cab to its S-curve; the gray roof over the cab; the
        // windshield in its dark surround.
        s += path(`M-1 -1L9.4 -1C9.8 4.0 11.6 8.6 15.4 11.6C17.2 12.9 19.6 14.0 20.8 16L-1 16Z`, SHG.lime);
        s += path(poly([[-1, 13.8], [3.0, 13.2], ["q", 6.0, 14.2, 12.0, 14.0], [12.0, 16], [-1, 16]]), SHG.nose);
        s += path(poly([[0.85, 8.4], [1.8, 8.3], ["q", 3.0, 11.2, 4.2, 13.3], [3.4, 13.4], ["q", 1.9, 11.2, 0.85, 8.4]]), "#1b1d20");
      }
      return s;
    },
    over: (cc) => {
      const cls = first ? ["1", "2"] : ["2"];
      let s = classPlate(cc, d1 + dw + 0.7, 8.0, cls) + classPlate(cc, d2 - 0.7, 8.0, cls) + bike(cc, d1 + dw + 2.8, 8.4, 1.4) + dbMark(cc, d1 + dw + 5.6, 8.4, 0.75, { neg: false });
      // NAH.SH's mark, big, on the blue behind the cab's green sweep.
      if (cab) s += nahsh(cc, 13.9, 4.7, 2.4);
      return s;
    },
    extra: (cc) => (cab ? pantograph(L - 6.0, 13.2, { up: true, facing: -1 }) + hvac(14, TDX.roof, 8, 0.45, "#7f8a95") : hvac(4, TDX.roof, 7, 0.45, "#7f8a95") + hvac(L - 11, TDX.roof, 7, 0.45, "#7f8a95")),
    lampX: 0.5, lampY: 4.6,
  });
}

// --- Stadler KISS (DB 445.1/445.6, Schleswig-Holstein's Elektronetz Ost,
// 2023; 18 four-car units, RE 8, RE 80, RE 8X and RE 86 Hamburg-Lübeck-
// Travemünde, two or three coupled): the end cars about 26.6 m, the middle
// cars 25.6 m, 4.6 m tall. The end car: the cab and its door, a window at
// an intermediate level, a door, the double deck, a door, an end section.
// From photographs (445 119 and 445 620 near Ahrensburg 2023, 445 116 and
// 628 at Hamburg 2025, Lübeck 2024-2025): Schleswig-Holstein's blue design:
// navy, a white band round the upper windows under the navy roof, a white
// line low down, turquoise doors; the cab turquoise back to a slant ahead
// of the cab door; first class (the middle cars' upper decks) under a
// yellow bar; "Schleswig-Holstein. Der echte Norden." in white serif
// letters over the lower windows, big bicycle pictograms by the
// multi-purpose doors, NAH.SH's mark on the cab.
export const SHB = { navy: "#1e2d66", turq: "#19a7b2", white: "#f1f3f4", yellow: "#f3c623" };
const KISS = { roof: 15.0, sill: 3.6, dropY: 1.0, upY: [10.0, 12.9], loY: [3.0, 6.2], endY: [6.9, 10.2], end: 26.6 * FT, mid: 25.6 * FT, doorTop: 9.5 };
const KISS_NOSE = curve([[1.4, 2.0], [0.55, 3.2], [0.45, 6.4], [0.9, 9.0], [1.9, 11.6], [3.4, 13.8], [5.4, 14.8], [7.6, 15.0]]);
export function kissSH(c, kind) {
  const L = c.L, cab = kind === "cab", dw = 4.0;
  const doors = cab ? [20.4, L - 18.6] : [14.2, L - 14.2 - dw];
  const [d1, d2] = doors;
  const up = cab ? span(d1 - 0.2, d2 + dw + 0.2, 7, 1.4) : span(d1 - 0.2, d2 + dw + 0.2, 8, 1.4);
  const lo = span(d1 + dw + 1.2, d2 - 1.2, cab ? 5 : 6, 1.2);
  const ends = cab ? [[13.0, 3.6], [L - 9.4, 3.2]] : [[4.4, 3.2], [L - 7.6, 3.2]];
  // First class upstairs in the end cars (the yellow bar under the upper
  // windows from door to door, 445 119 near Ahrensburg).
  const first = cab ? [d1 + 0.2, d2 + dw - 0.2] : null;
  return ddCar(c, {
    base: SHB.navy, nose: cab ? KISS_NOSE : null, roof: KISS.roof, sill: KISS.sill, dropY: KISS.dropY, drop: [d1, d2 + dw],
    upY: KISS.upY, loY: KISS.loY, endY: KISS.endY, doorTop: KISS.doorTop, doorFill: SHB.turq, doors, dw, up, lo, ends,
    trucks: cab ? [[9.6, 8.9, 36], [L - 7.2, 8.2, 36]] : [[7.0, 8.2, 36], [L - 7.0, 8.2, 36]],
    paint: (cc) => {
      // The upper deck's windows in a white band under the navy roof.
      let s = rect(-1, -1, L + 2, 20, SHB.navy) + rect(-1, 11.4, L + 2, 2.3, SHB.white) + rect(-1, 2.55, L + 2, 0.25, SHB.white);
      if (first) s += rect(first[0], 9.35, first[1] - first[0], 0.45, SHB.yellow);
      if (cab) {
        s += path(poly([[-1, -1], [17.6, -1], [15.2, 16], [-1, 16]]), SHB.turq);
        s += path(poly([[0.9, 9.0], [1.9, 8.9], ["q", 2.8, 11.4, 3.8, 13.4], [3.0, 13.5], ["q", 1.8, 11.6, 0.9, 9.0]]), "#1b1d20");
        s += rect(9.2, 3.4, 1.9, 7.8, "none", 0, 'rx="0.15" stroke="rgba(0,0,0,0.4)" stroke-width="0.07"') + rect(9.6, 8.0, 1.1, 2.2, C.glass, 0, 'rx="0.2"');
      }
      return s;
    },
    over: (cc) => {
      const cls = first ? ["1", "2"] : ["2"];
      let s = classPlate(cc, d1 - 0.75, 8.0, cls) + classPlate(cc, d2 + dw + 0.75, 8.0, cls) + (cab ? dbMark(cc, d1 - 2.6, 6.0, 0.7, { neg: false }) : "");
      s += letters(cc, (d1 + dw + d2) / 2, 7.9, 1.05, "Schleswig-Holstein. Der echte Norden.", "#ffffff", { weight: 400, family: "Georgia, 'Times New Roman', serif", extra: `textLength="${n(Math.min(30, d2 - d1 - dw - 4))}" lengthAdjust="spacingAndGlyphs"` });
      if (kind === "cab") s += bike(cc, d2 - (d2 - d1) * 0.29, 4.4, 2.3) + bike(cc, d2 - (d2 - d1) * 0.62, 4.4, 2.3);
      if (cab) s += nahsh(cc, 13.0, 5.4, 1.6) + dbMark(cc, 3.2, 8.4, 0.8, { neg: false });
      return s;
    },
    extra: (cc) => (kind === "mid" ? pantograph(L / 2, KISS.roof + 0.1, { up: true, facing: -1 }) : hvac(14, KISS.roof, 8, 0.45, "#5d6a85")) + hvac(L - 12, KISS.roof, 7, 0.45, "#5d6a85"),
    lampX: 0.5, lampY: 4.4,
  });
}

// ===================== Diesel units =====================
// DB Regio's paint on its diesel units (photographs: 648 614 at Neuruppin
// 2024, 648 452 at Neustadt in Holstein 2024, 623 at Teterow 2026, 642s at
// Königsbrück and Schöna 2026, 612s at Erfurt and Hermsdorf 2025-2026):
// red; a light gray band along the floor (the LINTs, round the nose) or
// along the bottom (the 612s); the Desiros' windows in one dark band with a
// light gray stripe under it in long dashes; light gray doors; the cab's
// windshield black, wrapping round the front; first class under a short
// yellow bar by its door.

// A roof engine/exhaust housing.
const engineHood = (x, roof, w) => roofCover(x, roof, w, 0.7, "#8e9398", 2) + rect(x + w * 0.3, roof + 0.7, 0.9, 0.35, "#4a4e53", 0, 'rx="0.1"');
// --- Alstom Coradia LINT 41 (DB 648, 623 and 1648; 2000-2025): two
// sections on a Jakobs bogie, 41.81 m; 4.2 m tall; the floor low between
// the doors, which sit beside the joint, raised over each motor bogie under
// the cab; the power pack under each section. The 623s (LINT 41 H, for
// the north-east's longer runs) and the 1648s (Sachsen-Anhalt, 2024-2025)
// are the same body.
const LINT = { roof: 13.8, eave: 12.6, sill: 3.4, drop: 2.0, win: [5.6, 9.5], sec: 20.9 * FT, sec27: 27.27 * FT, sec54: 27.15 * FT };
const LINT_NOSE = curve([[1.3, 1.6], [0.45, 2.6], [0.35, 4.6], [0.7, 6.6], [1.9, 8.8], [3.9, 11.2], [6.0, 12.9], [8.0, 13.6], [9.6, 13.8]]);
export const LINT_LV = {
  regio: { body: DBR.red, band: DBR.gray, skirt: "#55595e", door: DBR.gray, roof: DBR.red, mask: "#1a1c1f" },
  pe: { body: DBR.red, band: DBR.gray, skirt: "#55595e", door: DBR.gray, roof: DBR.red, mask: "#1a1c1f" },
  // Schleswig-Holstein's blue design (RB 62, RB 85; 648 at Haffkrug 2026
  // and in Rostock 2026): navy, the cab turquoise back to a slant ahead of
  // the first window, a white line low down, turquoise doors.
  nahsh: { body: "#1e2d66", band: null, skirt: "#1e2d66", line: "#f1f3f4", door: "#19a7b2", roof: "#1e2d66", mask: "#1a1c1f", front: "#19a7b2", word: "nahsh" },
  // The Dieselnetz Sachsen-Anhalt's 1648s, taken over from Abellio in
  // December 2024 and run on in its paint with Abellio's name taken off
  // (1648 431 at Blankenburg and 1648 444 at Thale, 2025): silver, the
  // windows in a black band that widens behind the cab, a red wedge
  // standing in the black there.
  silver: { body: "#d3d6d8", band: null, skirt: "#8f9498", door: "#2a2d31", roof: "#c4c8cb", mask: "#1a1c1f", black: true },
};
// kind: "cab" (a LINT 41's section), "cab1" (with first class behind the
// cab); "l27" a LINT 27 (one car, a cab each end, drawn by its half);
// "l54" a LINT 54 car.
export function lint(c, kind, lvKey = "regio") {
  const L = c.L, lv = LINT_LV[lvKey], first = kind === "cab1";
  const d = kind === "l27" ? L / 2 - 2.1 : kind === "l54" ? 27.0 : L - 17.0 - 2.15, dw = 4.3;
  const bottom = [[10.6, LINT.sill], [11.2, LINT.drop + 0.3], ["q", 11.4, LINT.drop, 11.9, LINT.drop], [L - 4.6, LINT.drop], ["q", L - 4.2, LINT.drop, L - 4.1, LINT.drop + 0.3], [L - 3.8, LINT.sill]];
  const outline = box(L, { roof: LINT.roof, low: LINT.sill, r: 0.8, nose: LINT_NOSE, bottom, x0: 0.3, x1: L - 0.3 });
  const W = (x, w) => [x, x + w, LINT.win[0], LINT.win[1], 0.35];
  const wins = kind === "l54" ? [W(14.6, 4.3), W(19.6, 4.3), W(32.8, 4.3), W(37.8, 4.3), W(42.8, 4.3), W(47.8, 4.3), W(52.8, 4.3), W(57.8, 4.3), W(62.8, 4.3), W(67.8, 4.3), W(72.8, 4.3), W(77.8, 4.3)]
    : kind === "l27" ? [W(14.4, 4.3), W(19.4, 4.3), W(24.4, 4.3), W(29.4, 4.3), W(d + dw + 1.2, 3.5), W(d + dw + 5.4, 3.5)]
    : [...seq(14.4, 6.9, 5).map((x) => W(x, 5.4)), ...seq(d + dw + 1.0, 3.6, 4).map((x) => W(x, 2.8))];
  const draw = (cc) => sec(cc, {
    base: lv.body, cab: true, outline, truckTop: LINT.sill,
    trucks: kind === "l27" ? [[8.6, 6.6, 30]] : kind === "l54" ? [[8.6, 6.6, 30], [L - 8.0, 6.6, 30]] : [[8.6, 6.6, 30], [L, 8.9, 30]],
    paint: () => {
      let s = rect(-1, -1, L + 2, 20, lv.body) + rect(-1, -1, L + 2, LINT.drop + 1.4, lv.skirt);
      if (lv.band) s += rect(-1, 3.0, L + 2, 1.35, lv.band);
      if (lv.line) s += rect(-1, 3.1, L + 2, 0.3, lv.line);
      if (lv.front) s += path(poly([[-1, -1], [10.8, -1], [13.6, 15], [-1, 15]]), lv.front);
      if (lv.black) {
        // The black window band, deep behind the cab with the red wedge.
        s += rect(12.0, 5.2, L, 4.8, "#1d1f22") + path(poly([[9.8, 3.6], [19.0, 3.6], [19.0, 12.2], [12.6, 12.2]]), "#1d1f22") +
          path(poly([[13.2, 3.6], [17.4, 3.6], [15.0, 11.4], [13.6, 11.4]]), "#d4161c");
      }
      // The black windshield wrapping back to the cab's side window.
      s += path(poly([[0.9, 6.6], [3.0, 6.0], [12.2, 5.8], [12.2, 9.9], [9.4, 10.3], [6.4, 12.3], [5.0, 12.4], [2.6, 9.9]]), lv.mask);
      s += path(poly([[1.4, 7.0], [3.1, 6.4], [9.0, 6.3], [9.0, 9.6], [6.0, 11.7], [5.0, 11.8], [2.9, 9.6]]), C.glass, 0, 'opacity="0.85"');
      if (first) s += rect(14.2, 10.15, 18.2, 0.45, DBR.yellow);
      return s;
    },
    wins,
    over: (h) => (first ? classNum(h, d - 0.7, 9.3, "1") : "") + (kind !== "l27" ? classNum(h, d + dw + 0.7, 9.3, "2") : "") + (lvKey === "silver" ? "" : dbMark(h, 3.4, 4.2, 0.85, { neg: false })) +
      (lvKey === "regio" ? dbMark(h, d - 2.5, 4.9, 0.6, { neg: true }) : "") + (lv.word === "nahsh" ? nahsh(h, 13.5, 4.6, 1.0) : "") + (lvKey === "pe" ? letters(h, 25.0, 4.85, 0.95, "Prignitz-Express", "#efe2c4", { weight: 700 }) : ""),
    doors: [{ x: d }],
    door: (h, dr) => plugDoor(dr.x, dw, LINT.drop + 0.4, 10.9, { fill: lv.door, glass: [4.4, 10.2], gw: 1.2, oval: false }),
    extra: (h) => engineHood(16, LINT.roof, 11) + hvac(30, LINT.roof, 8, 0.5, "#8e9398") + boxes(13, 26, LINT.drop + 0.3, 2, 1.0) +
      lamp(0.5, 3.3, 0.35, 0.4) + coupler(h, { x: 0.8, y: 2.6, defl: null }),
    gangway: [2.6, 12.0],
  });
  return kind === "l27" ? twinEnded(c, draw) : draw(c);
}

// --- Siemens Desiro Classic (DB 642, 1999-2008): two sections on a Jakobs
// bogie, 41.7 m; 3.9 m tall; the floor low between the motor bogies; one
// door a side in each section, two thirds of the way back from the cab.
const DES = { roof: 12.8, eave: 11.6, sill: 3.3, drop: 1.4, win: [4.6, 8.6], sec: 20.85 * FT };
const DES_NOSE = curve([[1.2, 1.5], [0.4, 2.4], [0.3, 4.2], [0.9, 6.2], [2.6, 8.9], [4.6, 11.0], [6.6, 12.3], [8.6, 12.8]]);
export function desiro(c, kind = "regio") {
  const L = c.L, dw = 4.3, d = 42.0;
  const bottom = [[9.4, DES.sill], [10.0, DES.drop + 0.3], ["q", 10.2, DES.drop, 10.7, DES.drop], [L - 4.6, DES.drop], ["q", L - 4.2, DES.drop, L - 4.1, DES.drop + 0.3], [L - 3.8, DES.sill]];
  const outline = box(L, { roof: DES.roof, low: DES.sill, r: 0.8, nose: DES_NOSE, bottom, x0: 0.3, x1: L - 0.3 });
  const W = (x, w) => [x, x + w, DES.win[0], DES.win[1], 0.15, "#24282d"];
  return sec(c, {
    base: DBR.red, cab: true, outline, truckTop: DES.sill,
    trucks: [[6.8, 7.2, 30], [L, 8.9, 30]],
    paint: () => {
      let s = rect(-1, -1, L + 2, 20, DBR.red) + rect(-1, -1, L + 2, DES.drop + 1.25, DBR.gray);
      // The dark window band from the windshield back, the dashed stripe.
      s += path(poly([[1.0, 5.2], [10.5, 4.3], [L + 1, 4.3], [L + 1, 9.0], [7.6, 9.0], [5.8, 11.4], [4.6, 11.6], [2.4, 8.4]]), "#1e2125");
      // The light gray cap over the cab's roof, down to the windshield.
      s += path(poly([[3.4, 10.0], [5.0, 11.9], [8.0, 11.0], ["q", 11.0, 11.6, 13.0, 13.2], [-1, 14], [-1, 9.0]]), "#b9bdbf");
      for (const [a, b] of kind === "erz" ? [[9.0, 22.6], [d + dw + 0.8, L - 1.2]] : [[9.0, 24.0], [25.2, 40.6], [d + dw + 0.8, L - 1.2]]) s += rect(a, 3.15, b - a, 0.75, DBR.gray);
      return s;
    },
    wins: [W(12.0, 6.0), W(18.6, 6.0), W(25.2, 6.0), W(31.8, 6.0), W(d + dw + 1.0, 6.0), W(d + dw + 7.6, 6.0), W(d + dw + 14.2, 6.0)],
    over: (h) => (kind === "erz" ? letters(h, 30.0, 3.75, 1.5, "Erzgebirgsbahn", "#ffffff", { weight: 700, style: "italic", extra: 'textLength="13" lengthAdjust="spacingAndGlyphs"' })
      : dbMark(h, 33.0, 3.55, 0.6, { neg: false, fill: DBR.gray })) + classNum(h, d - 0.7, 8.2, "2") + dbMark(h, 2.4, 3.3, 0.7, { neg: true }),
    doors: [{ x: d }],
    door: (h, dr) => plugDoor(dr.x, dw, DES.drop + 0.35, 9.4, { fill: DBR.gray, glass: [4.0, 8.9], gw: 1.25, oval: false }),
    extra: (h) => engineHood(14, DES.roof, 10) + hvac(30, DES.roof, 9, 0.5, "#8e9398") + boxes(12, 30, DES.drop + 0.2, 2, 0.8) +
      lamp(0.45, 3.0, 0.35, 0.4) + coupler(h, { x: 0.8, y: 2.5, defl: null }),
    gangway: [2.2, 11.2],
  });
}

// --- Bombardier RegioSwinger (DB 612, 1998-2004): two tilting cars of
// 25.9 m, each on two bogies; 3.9 m tall; a double door behind the cab and
// a single one at the inner end; an engine under each car.
const RS612 = { roof: 12.9, eave: 11.8, sill: 3.7, win: [6.0, 10.4], car: 25.9 * FT };
const RS612_NOSE = curve([[1.3, 3.0], [0.5, 4.0], [0.4, 7.0], [0.8, 9.2], [2.2, 11.2], [4.0, 12.4], [6.2, 12.9]]);
export function rs612(c) {
  const L = c.L;
  const outline = box(L, { roof: RS612.roof, low: RS612.sill, r: 0.8, nose: RS612_NOSE, x0: 0.3, x1: L - 0.3 });
  const W = (x, w) => [x, x + w, RS612.win[0], RS612.win[1], 0.3];
  return sec(c, {
    base: DBR.red, cab: true, outline, truckTop: RS612.sill,
    trucks: [[10.0, 8.2, 30], [L - 10.0, 8.2, 30]],
    paint: () => {
      let s = rect(-1, -1, L + 2, 20, DBR.red) + rect(-1, -1, L + 2, 6.0, DBR.gray) + rect(-1, 4.95, L + 2, 0.1, "#9a9e9c");
      s += path(poly([[0.5, 7.4], [1.4, 7.2], [6.4, 7.3], [6.4, 10.8], [4.2, 11.9], [2.2, 10.6]]), "#1a1c1f");
      return s;
    },
    wins: [W(7.3, 1.7), W(16.2, 3.2), W(20.3, 3.2), ...seq(29.4, 4.45, 10).map((x) => W(x, 3.3))],
    over: (h) => dbMark(h, 2.0, 4.3, 0.75, { neg: false }) + dbMark(h, 27.0, 8.1, 0.65, { neg: true }) + classNum(h, 15.4, 9.4, "2") + rect(16.0, 10.85, 7.8, 0.4, DBR.yellow) + classNum(h, 15.4, 8.1, "1"),
    doors: [{ x: 10.9, w: 3.9 }, { x: L - 6.6, w: 2.6 }],
    door: (h, dr) => plugDoor(dr.x, dr.w, RS612.sill + 0.1, 10.9, { fill: DBR.gray, glass: [6.3, 10.3], gw: dr.w > 3 ? 1.1 : 1.4, oval: false, leaves: dr.w > 3 ? 2 : 1 }),
    extra: (h) => roofCover(L - 24, RS612.roof, 7, 0.8, "#8e9398", 2) + hvac(16, RS612.roof, 9, 0.5, "#8e9398") + boxes(16, L - 16, RS612.sill, 3, 1.4) +
      lamp(0.5, 5.0, 0.35, 0.4) + coupler(h, { x: 0.8, y: 2.9, defl: null }),
    gangway: [3.8, 11.8],
  });
}

// --- Siemens Mireo (DB 463, Netz Lausitz, 2022; 3-car units, RE 10, RE 11,
// RE 13, RB 43, RB 49): 70 m on four bogies, Jakobs bogies between the
// cars, the end cars about 24.1 m, the middle car 21.8 m; 4.0 m tall; the
// floor low throughout; two double doors a side in each end car, one in
// the middle car; the pantograph on the middle car. DB Regio's paint (463
// 100 at Taucha 2026, 463 103 at Falkenberg, 463 104 at Torgau): red, a
// light gray band along the bottom and a thin one over the windows, light
// gray doors; the nose's dark gray mask round the windshield running down
// to the coupler; a big white bicycle by the multi-purpose doors.
const MIR = { roof: 13.1, eave: 12.0, sill: 2.4, win: [4.9, 9.7], end: 24.1 * FT, mid: 21.8 * FT };
const MIR_NOSE = curve([[1.6, 1.6], [0.5, 2.6], [0.4, 4.6], [1.0, 6.8], [2.8, 9.0], [5.0, 11.2], [7.4, 12.7], [10.0, 13.1]]);
export function mireo(c, kind) {
  const L = c.L, cab = kind === "cab", dw = 4.3;
  const doors = cab ? [17.6, L - 18.2] : [L / 2 - dw / 2];
  const outline = box(L, { roof: MIR.roof, low: MIR.sill, r: 0.8, nose: cab ? MIR_NOSE : null, x0: 0.3, x1: L - 0.3 });
  const W = (x, w) => [x, x + w, MIR.win[0], MIR.win[1], 0.45];
  const wins = cab ? [W(10.8, 2.0), W(23.4, 5.2), W(29.4, 5.2), W(35.4, 5.2), W(41.4, 5.2), W(L - 12.6, 5.2), W(L - 6.6, 4.4)]
    : [W(2.4, 5.0), W(8.2, 5.0), W(14.0, 5.0), W(L / 2 + dw / 2 + 7.0, 5.0), W(L / 2 + dw / 2 + 12.8, 5.0)];
  return sec(c, {
    base: DBR.red, cab, outline, truckTop: MIR.sill,
    trucks: cab ? [[8.8, 7.2, 30], [L, 8.9, 28]] : [[L, 8.9, 28]],
    paint: () => {
      // Light gray along the floor and the skirt, a white line along its top.
      let s = rect(-1, -1, L + 2, 20, DBR.red) + rect(-1, -1, L + 2, 4.4, DBR.gray) + rect(-1, 3.3, L + 2, 0.12, "#f4f5f4") + rect(-1, 10.15, L + 2, 0.4, DBR.gray);
      if (cab) {
        s += path(poly([[-1, 2.4], [1.6, 2.4], ["q", 2.6, 4.6, 3.8, 6.6], [6.0, 9.6], ["q", 7.6, 11.6, 10.4, 12.0], [10.4, 14], [-1, 14]]), "#3e4246");
        s += path(poly([[3.6, 8.0], [4.6, 7.9], ["q", 6.4, 10.4, 8.6, 11.6], ["q", 9.0, 12.1, 8.2, 12.0], ["q", 5.6, 10.8, 3.6, 8.0]]), C.glass);
        s += rect(-1, 10.15, 11.5, 2, DBR.red);
      }
      return s;
    },
    wins,
    over: (h) => (kind === "mid" ? bike(h, L / 2 + dw / 2 + 3.7, 7.3, 4.0) : "") + (cab ? dbMark(h, 3.6, 6.9, 0.85, { neg: false }) : ""),
    doors: doors.map((x) => ({ x })),
    door: (h, dr) => plugDoor(dr.x, dw, MIR.sill - 0.6, 10.0, { fill: DBR.gray, glass: [4.0, 9.4], gw: 1.15, oval: false }),
    extra: (h) => (kind === "mid" ? pantograph(L / 2 + 6, MIR.roof + 0.3, { up: true, facing: -1 }) + panGear(L / 2 + 6, MIR.roof, -1) : roofCover(22, MIR.roof, 14, 0.75, "#5b6065", 3)) +
      (cab ? lamp(1.1, 4.2, 0.45, 0.35) + coupler(h, { x: 0.9, y: 2.6, defl: null }) : ""),
    gangway: [2.4, 11.6],
  });
}

// --- Stadler GTW 2/6 (DB 646, Usedomer Bäderbahn, 2002-2003; RB 23 and RB
// 24 on Usedom): two low-floor cars of 17 m either side of the 4.9 m power
// module, 38.7 m, 3.85 m tall; a double door a side in each car. The UBB's
// paint (photographs at Peenemünde 2023 and Stralsund 2024): silver-white,
// a royal-blue wave rolling along the bottom, the cab's mask and window
// band dark gray, the UBB mark (its initials in a blue rounded square) on
// the power module.
const GTW = { roof: 12.6, sill: 2.4, win: [4.6, 9.6], len: 38.66 * FT, car: 16.9 * FT, pm: 4.86 * FT };
const GTW_NOSE = curve([[1.4, 1.6], [0.5, 2.6], [0.4, 5.0], [0.8, 7.2], [2.0, 9.8], [3.4, 11.8], [5.2, 12.6]]);
export function gtwUbb(c) {
  const L = c.L, a = GTW.car, b = GTW.car + GTW.pm, dw = 4.3;
  const half = (h) => {
    const outline = box(L, { roof: GTW.roof, low: GTW.sill, r: 0.8, nose: GTW_NOSE, x0: 0.3, x1: L - 0.3 });
    return sec(h, {
      base: "#e9ebec", cab: true, cabR: true, outline, truckTop: GTW.sill, trucks: [[7.6, 7.0, 30]],
      paint: () => {
        let s = rect(-1, -1, L + 2, 20, "#e9ebec") + rect(-1, 11.4, L + 2, 3, "#c4c8cb");
        // The blue wave along the bottom, cresting twice per car.
        s += path(`M-1 -1L-1 4.2C4 4.6 8 2.6 13 3.4S20 5.2 26 3.6S36 2.8 44 4.0S52 3.2 ${L + 1} 3.6L${L + 1} -1Z`, "#1f47b8");
        s += path(poly([[-1, 3.0], [1.4, 3.0], ["q", 3.0, 6.0, 5.6, 9.8], [a, 9.8], [a, 4.4], [8.0, 4.4], ["q", 4.2, 4.4, 2.8, 3.0]]), "#4a5056");
        s += path(poly([[2.0, 6.2], [3.0, 6.0], ["q", 4.2, 8.6, 5.4, 10.6], ["q", 5.6, 11.2, 4.9, 11.0], ["q", 3.2, 9.0, 2.0, 6.2]]), C.glass);
        return s;
      },
      wins: [[8.6, 12.2, GTW.win[0], GTW.win[1], 0.3], [13.0, 16.6, GTW.win[0], GTW.win[1], 0.3], [26.4, 30.0, GTW.win[0], GTW.win[1], 0.3], [30.8, 34.4, GTW.win[0], GTW.win[1], 0.3],
        [35.2, 38.8, GTW.win[0], GTW.win[1], 0.3], [39.6, 43.2, GTW.win[0], GTW.win[1], 0.3]],
      over: (hh) => classNum(hh, 25.4, 8.6, "2", 0.85, "#1f47b8"),
      doors: [{ x: 20.4 }], door: (hh, dr) => plugDoor(dr.x, dw, GTW.sill - 0.5, 10.0, { fill: "#d9dcde", glass: [3.6, 9.4], gw: 1.15, oval: false }),
      extra: (hh) => lamp(0.8, 3.6, 0.4, 0.35) + coupler(hh, { x: 0.9, y: 2.5, defl: null }) + roofCover(30, GTW.roof, 10, 0.6, "#a9adb1", 2),
      gangway: [2.4, 11.0],
    });
  };
  // The two cars (the left one drawn, then mirrored), the power module
  // between them: taller, its roof gear, the UBB mark.
  let s = twinEnded(c, half);
  const pmRoof = 13.3;
  s += path(poly([[a, 2.2], [b, 2.2], [b, pmRoof - 0.5], ["q", b, pmRoof, b - 0.5, pmRoof], [a + 0.5, pmRoof], ["q", a, pmRoof, a, pmRoof - 0.5]]), "#e9ebec", 0.8);
  s += rect(a + 0.1, 2.25, GTW.pm * FT / FT - 0.2, 1.6, "#1f47b8") + rect(a + 0.6, 4.5, b - a - 1.2, 5.4, "none", 0, 'rx="0.2" stroke="rgba(0,0,0,0.3)" stroke-width="0.07"');
  s += mark(c, (a + b) / 2, 8.0, `<rect x="-1.25" y="-1.25" width="2.5" height="2.5" rx="0.55" fill="#1f47b8"/>` + txt(0, 0, 1.0, "UBB", "#ffffff", { weight: 800 }));
  s += truck((a + b) / 2, { wb: 7.2, d: 33, top: 2.2 }) + exhaustStack((a + b) / 2 - 1.0, pmRoof);
  return s;
}
const exhaustStack = (x, roof) => rect(x, roof - 0.05, 2.2, 0.6, "#5a5e63", 0.4, 'rx="0.2"') + rect(x + 0.6, roof + 0.5, 0.5, 0.6, "#3a3e43");

// --- Alstom Coradia A TER (DB 641, "Walfisch", 2000-2001): a single car
// with a cab at each end, 28.9 m, 4.06 m tall; the floor low between the
// bogies, a double door a side at each end of it; two engines. DB Regio's
// paint (641 025 at Leipzig, "Der Geithainer", RB 113, 2025): red, light
// gray along the bottom, the window band and the cab's mask dark gray.
const W641 = { roof: 13.3, sill: 3.4, drop: 2.0, win: [5.0, 9.8], len: 28.9 * FT };
const NOSE_641 = curve([[1.4, 2.2], [0.5, 3.2], [0.4, 5.6], [0.9, 8.2], [2.4, 10.8], [4.4, 12.6], [6.6, 13.3]]);
export function w641(c) {
  const L = c.L, dw = 4.3;
  const half = (h) => {
    const bottom = [[9.6, W641.sill], [10.2, W641.drop + 0.3], ["q", 10.4, W641.drop, 10.9, W641.drop], [L - 10.9, W641.drop], ["q", L - 10.4, W641.drop, L - 10.2, W641.drop + 0.3], [L - 9.6, W641.sill]];
    const outline = box(L, { roof: W641.roof, low: W641.sill, r: 0.8, nose: NOSE_641, bottom, x0: 0.3, x1: L - 0.3 });
    return sec(h, {
      base: DBR.red, cab: true, cabR: true, outline, truckTop: W641.sill, trucks: [[7.2, 7.2, 30]],
      paint: () => rect(-1, -1, L + 2, 20, DBR.red) + rect(-1, -1, L + 2, 4.8, DBR.gray) + rect(9.0, 4.7, L, 5.4, "#2a2d31") + rect(-1, 4.2, L + 2, 0.3, DBR.gray) +
        path(poly([[-1, 3.4], [1.0, 3.4], ["q", 2.6, 7.0, 4.6, 10.2], ["q", 6.2, 12.4, 9.0, 12.4], [9.0, 4.7], [6.4, 4.7], ["q", 3.4, 4.6, 2.0, 3.4]]), "#2a2d31") +
        path(poly([[1.8, 5.8], [2.8, 5.6], ["q", 4.2, 8.4, 5.6, 10.6], ["q", 6.0, 11.4, 5.2, 11.2], ["q", 3.2, 9.0, 1.8, 5.8]]), C.glass),
      wins: [[15.6, 20.4, 5.2, 9.6, 0.25, "#3b444e"], [21.0, 25.8, 5.2, 9.6, 0.25, "#3b444e"], [26.4, 31.2, 5.2, 9.6, 0.25, "#3b444e"], [31.8, 36.6, 5.2, 9.6, 0.25, "#3b444e"], [37.2, 42.0, 5.2, 9.6, 0.25, "#3b444e"]],
      over: (hh) => classNum(hh, 14.8, 8.6, "2") + dbMark(hh, 2.6, 2.9, 0.7, { neg: false }),
      doors: [{ x: 10.6 }], door: (hh, dr) => plugDoor(dr.x, dw, W641.drop + 0.3, 10.2, { fill: DBR.gray, glass: [4.4, 9.6], gw: 1.15, oval: false }),
      extra: (hh) => lamp(0.6, 4.0, 0.4, 0.35) + coupler(hh, { x: 0.9, y: 2.8, defl: null }) + roofCover(14, W641.roof, 8, 0.7, "#8e9398", 2),
      gangway: [3.0, 12.0],
    });
  };
  return twinEnded(c, half) + dbMark(c, L / 2, 3.3, 0.6, { neg: true });
}

// --- Bombardier TRAXX P160 DE ME (DB 245.2, Marschbahn RE 6, 2016): the
// TRAXX body on diesel, four engines; no pantographs, the exhaust hoods on
// the roof. Schleswig-Holstein's blue design (245 206 at Bredstedt, 245
// 211 and 220 at Westerland): navy, the cab turquoise back past the crew
// door, a big turquoise triangle and a white one meeting along a diagonal
// over the machine room, a white line along the frame; "Schleswig-
// Holstein / Der echte Norden" in white serif letters; NAH.SH's mark on
// the turquoise behind the cab.
export function br245(c) {
  const L = c.L;
  return loco(c, {
    roof: 12.95, sill: 4.05, nose: NOSE_146, centers: 10.44 * FT, wheel: 43, wb: 8.5, base: SHB.navy,
    paint: (h) => {
      // The side is not symmetric: the turquoise triangle rises from behind
      // the No. 1 cab (left) to the roof past the middle, the white one
      // under the roof toward the No. 2 cab; drawn here per half (h is the
      // right half when mirrored relative to the car).
      const right = !!h.mirrored !== !!c.mirrored;
      let s = rect(-1, -1, L + 2, 20, SHB.navy) + path(poly([[-1, -1], [8.8, -1], [8.8, 15], [-1, 15]]), SHB.turq);
      if (!right) s += path(poly([[8.8, 4.6], [L * 0.25, 4.6], [L * 0.45, 12.95], [L * 0.45, 15], [8.8, 15]]), SHB.turq) +
        path(poly([[L * 0.45, 12.95], [L * 0.86, 12.95], [L * 0.86, 11.0]]), SHB.white);
      else s += path(poly([[L * 0.55, 12.95], [L * 0.14, 12.95], [L * 0.14, 11.0]]), SHB.white) + path(poly([[8.8, 11.0], [L * 0.14, 11.0], [L * 0.14, 15], [8.8, 15]]), SHB.turq);
      s += rect(9.4, 4.6, L, 0.3, SHB.white) + rect(-1, -1, L + 2, 4.6, "#2a2f3a");
      s += path(poly([[1.75, 9.45], [2.55, 9.45], [3.3, 12.0], [2.6, 12.0]]), C.glass);
      s += rect(4.1, 9.0, 1.7, 2.3, "#1b1d20", 0, 'rx="0.3"') + rect(4.25, 9.15, 1.4, 2.0, C.glass, 0, 'rx="0.25"');
      s += rect(6.3, 4.6, 2.2, 7.0, "none", 0, 'rx="0.15" stroke="rgba(0,0,0,0.35)" stroke-width="0.07"');
      for (const [x, w] of [[L / 2 - 13.5, 2.2], [L / 2 - 8.0, 2.2]]) s += rect(x, 7.4, w, 3.6, "rgba(10,12,20,0.55)", 0, 'rx="0.1"') + slats(x, 7.4, w, 3.6, 0.25, "rgba(255,255,255,0.18)");
      return s;
    },
    cab: (h) => lamp(1.05, 6.6, 0.32, 0.4) + lamp(1.0, 5.75, 0.28, 0.3, RED_LAMP),
    under: (cc) => rect(L / 2 - 9.5, 1.5, 19, 2.55, "#2d3135", 0, 'rx="0.3"'),
    over: (cc) => roofCover(L / 2 - 12, 12.95, 10, 0.6, "#5d6a85", 2) + roofCover(L / 2 + 2, 12.95, 10, 0.6, "#5d6a85", 2) +
      letters(cc, L * 0.6, 9.0, 0.95, "Schleswig-Holstein", "#ffffff", { weight: 400, family: "Georgia, 'Times New Roman', serif" }) +
      letters(cc, L * 0.6, 7.6, 0.95, "Der echte Norden", "#ffffff", { weight: 400, family: "Georgia, 'Times New Roman', serif" }) +
      nahsh(cc, 12.6, 7.4, 1.3) + dbMark(cc, 14.0, 5.6, 0.6, { neg: false }),
  });
}

// --- The Marschbahn's "Married Pair" coaches (Bombardier, 2005, from the
// Nord-Ostsee-Bahn; DB Regio's since 2016, RE 6 Hamburg-Altona-Westerland):
// pairs of single-deck coaches, the floor raised over the bogies, let down
// between them, about 26.8 m each, 4.3 m tall. Schleswig-Holstein's design
// (photographs at Niebüll 2017 and Westerland 2022-2025): white, a blue
// roof, a dark gray window band under a yellow pinstripe, blue along the
// bottom; turquoise doors; "Schleswig-Holstein. Der echte Norden." in blue
// serif letters under the windows; NAH.SH's mark large on the gray at the
// end. The trains run with a 245 at each end.
const MP = { roof: 14.2, sill: 3.8, drop: 1.7, len: 26.8 * FT, win: [6.6, 9.6] };
export function marriedPair(c) {
  const L = c.L, dw = 4.0, d1 = 15.2, d2 = L - 15.2 - dw;
  const bottom = [[d1 - 0.9, MP.sill], [d1 - 0.35, MP.drop + 0.4], ["q", d1 - 0.2, MP.drop, d1 + 0.3, MP.drop], [d2 + dw - 0.3, MP.drop], ["q", d2 + dw + 0.2, MP.drop, d2 + dw + 0.35, MP.drop + 0.4], [d2 + dw + 0.9, MP.sill]];
  const outline = box(L, { roof: MP.roof, low: MP.sill, r: 1.0, bottom, x0: 0.35, x1: L - 0.35 });
  const W = (x, w) => [x, x + w, MP.win[0], MP.win[1], 0.4];
  return sec(c, {
    base: "#eef0f1", outline, truckTop: MP.sill, trucks: [[7.6, 8.2, 36], [L - 7.6, 8.2, 36]],
    paint: () => rect(-1, -1, L + 2, 20, "#eef0f1") + rect(-1, 12.6, L + 2, 3, "#1f45b5") + rect(-1, 6.1, L + 2, 4.2, "#4b5058") + rect(-1, 10.3, L + 2, 0.18, "#e9a41a") +
      rect(-1, -1, L + 2, 3.0, "#1f45b5"),
    wins: [W(d1 + dw + 1.2, 3.6), ...seq(d1 + dw + 5.6, 4.15, 9).map((x) => W(x, 3.5)), W(L - 12.6, 3.6)],
    over: (h) => letters(h, (d1 + d2 + dw) / 2, 4.4, 1.0, "Schleswig-Holstein. Der echte Norden.", "#1f45b5", { weight: 400, family: "Georgia, 'Times New Roman', serif", extra: 'textLength="27" lengthAdjust="spacingAndGlyphs"' }) +
      nahsh(h, 6.2, 8.2, 1.6) + classNum(h, d2 - 0.7, 8.6, "2", 0.85, "#ffffff"),
    doors: [{ x: d1 }, { x: d2 }],
    door: (h, dr) => plugDoor(dr.x, dw, MP.drop + 0.3, 10.2, { fill: SHB.turq, glass: [4.4, 9.6], gw: 0.9, oval: false }),
    extra: (h) => hvac(3, MP.roof, 7, 0.45, "#3a5bb8") + hvac(L - 10, MP.roof, 7, 0.45, "#3a5bb8") + uicEnd(0, -1, 3.45) + uicEnd(L, 1, 3.45),
    gangway: [3.8, 12.8],
  });
}

// ===================== Tables =====================
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const TYPES = {
  deR146: { name: "DB 146 (TRAXX P160 AC) electric locomotive", kind: "electric", pan: true },
  deR112: { name: "DB 112.1 electric locomotive", kind: "electric", pan: true },
  deRDd: { name: "Double-deck coach, second class (DBpza)", kind: "bilevel" },
  deRDd1: { name: "Double-deck coach, first and second class (DABpza)", kind: "bilevel", amenities: ["first"] },
  deRDdBike: { name: "Double-deck coach with multi-purpose area (DBpza 751)", kind: "bilevel", amenities: ["bikes"] },
  deRDdCab4: { name: "Double-deck driving trailer, first and second class (DABpbzfa)", kind: "bilevel", cab: true, amenities: ["first", "bikes"] },
  deRT2Cab1: { name: "Talent 2 (DB 442) end car, first and second class", kind: "emu", pan: true, amenities: ["first"] },
  deRT2Cab: { name: "Talent 2 (DB 442) end car", kind: "emu" },
  deRT2Mid: { name: "Talent 2 (DB 443) middle car", kind: "emu" },
  deRMdCab: { name: "Talent 2 (DB 1442, S-Bahn Mitteldeutschland) end car", kind: "emu", pan: true },
  deRMdCabB: { name: "Talent 2 (DB 1442, S-Bahn Mitteldeutschland) end car", kind: "emu" },
  deRMdMid: { name: "Talent 2 (DB 1443, S-Bahn Mitteldeutschland) middle car", kind: "emu" },
  deR648Cab1: { name: "LINT 41 (DB 648) section, first and second class", kind: "emu", amenities: ["first"] },
  deR623Cab1: { name: "LINT 41 (DB 623) section, first and second class", kind: "emu", amenities: ["first"] },
  deR623Cab: { name: "LINT 41 (DB 623) section", kind: "emu", amenities: ["bikes"] },
  deR648Cab: { name: "LINT 41 (DB 648) section", kind: "emu", amenities: ["bikes"] },
  deR640: { name: "LINT 27 (DB 640) diesel car", kind: "emu" },
  deR622: { name: "LINT 54 (DB 622) car", kind: "emu" },
  deR642: { name: "Desiro Classic (DB 642) section", kind: "emu" },
  deR612: { name: "RegioSwinger (DB 612) diesel car", kind: "emu" },
  deR445Cab1: { name: "Twindexx Vario (DB 445) end car, first and second class", kind: "bilevel", emu: true, pan: true, amenities: ["first"] },
  deR445Cab: { name: "Twindexx Vario (DB 445) end car", kind: "bilevel", emu: true, pan: true },
  deR445Mid: { name: "Twindexx Vario (DB 445) middle car", kind: "bilevel", emu: true },
  deRKissCab: { name: "KISS (DB 445) end car, first and second class, multi-purpose area", kind: "bilevel", emu: true, amenities: ["first", "bikes"] },
  deRKissMid: { name: "KISS (DB 445) middle car", kind: "bilevel", emu: true, pan: true },
  deR463Cab: { name: "Mireo (DB 463) end car", kind: "emu" },
  deR463Mid: { name: "Mireo (DB 463) middle car, multi-purpose area", kind: "emu", pan: true, amenities: ["bikes"] },
  deR646Ubb: { name: "GTW 2/6 (DB 646), Usedomer Bäderbahn", kind: "emu" },
  deR641: { name: "Coradia A TER (DB 641) diesel car", kind: "emu" },
  deR245: { name: "DB 245 (TRAXX P160 DE ME) diesel locomotive", kind: "diesel" },
  deRMp: { name: "Marschbahn coach (Married Pair)", kind: "coach" },
  deR1648Cab: { name: "LINT 41 (DB 1648) section", kind: "emu" },
  deR648ShCab: { name: "LINT 41 (DB 648) section, Schleswig-Holstein design", kind: "emu" },
  deR648PeCab1: { name: "LINT 41 (DB 648) section, first and second class, Prignitz-Express", kind: "emu", amenities: ["first"] },
  deR648PeCab: { name: "LINT 41 (DB 648) section, Prignitz-Express", kind: "emu" },
  deR642Erz: { name: "Desiro Classic (DB 642) section, Erzgebirgsbahn", kind: "emu" },
  deRDdCab3: { name: "Double-deck driving trailer, first and second class (DABpbzfa 762)", kind: "bilevel", cab: true, amenities: ["first", "bikes"] },
};
export const MODELS = {
  deR146: M((c) => traxx146(c), 18.9 * FT),
  deR112: M(br112, 16.64 * FT),
  deRDd: M((c) => dosto(c, "mid"), DD.coach),
  deRDd1: M((c) => dosto(c, "mid1"), DD.coach),
  deRDdBike: M((c) => dosto(c, "bike"), DD.coach),
  deRDdCab4: M((c) => dosto(c, "cab4"), DD.cab, true),
  deRDdCab3: M((c) => dosto(c, "cab3"), DD.cab, true),
  deR445Cab1: M((c) => twindexx445(c, "cab1"), TDX.end, true),
  deR445Cab: M((c) => twindexx445(c, "cab"), TDX.end, true),
  deR445Mid: M((c) => twindexx445(c, "mid"), TDX.mid),
  deRKissCab: M((c) => kissSH(c, "cab"), KISS.end, true),
  deRKissMid: M((c) => kissSH(c, "mid"), KISS.mid),
  deR463Cab: M((c) => mireo(c, "cab"), MIR.end, true),
  deR463Mid: M((c) => mireo(c, "mid"), MIR.mid),
  deR646Ubb: M(gtwUbb, GTW.len),
  deR641: M(w641, W641.len),
  deR245: M(br245, 18.9 * FT),
  deRMp: M(marriedPair, MP.len),
  deR1648Cab: M((c) => lint(c, "cab", "silver"), LINT.sec, true),
  deR648ShCab: M((c) => lint(c, "cab", "nahsh"), LINT.sec, true),
  deR648PeCab1: M((c) => lint(c, "cab1", "pe"), LINT.sec, true),
  deR648PeCab: M((c) => lint(c, "cab", "pe"), LINT.sec, true),
  deR642Erz: M((c) => desiro(c, "erz"), DES.sec, true),
  deR648Cab1: M((c) => lint(c, "cab1"), LINT.sec, true),
  deR623Cab1: M((c) => lint(c, "cab1"), LINT.sec, true),
  deR623Cab: M((c) => lint(c, "cab"), LINT.sec, true),
  deR648Cab: M((c) => lint(c, "cab"), LINT.sec, true),
  deR640: M((c) => lint(c, "l27"), LINT.sec27),
  deR622: M((c) => lint(c, "l54"), LINT.sec54, true),
  deR642: M((c) => desiro(c), DES.sec, true),
  deR612: M(rs612, RS612.car, true),
  deRT2Cab1: M((c) => talent2(c, "cab1"), T2.end, true),
  deRT2Cab: M((c) => talent2(c, "cab"), T2.end, true),
  deRT2Mid: M((c) => talent2(c, "mid"), T2.mid),
  deRMdCab: M((c) => talent2(c, "cab1", "mdsb"), T2.end, true),
  deRMdCabB: M((c) => talent2(c, "cab", "mdsb"), T2.end, true),
  deRMdMid: M((c) => talent2(c, "mid", "mdsb"), T2.mid),
};
// Every car drawn the other way round (its cab, if any, at the right): the
// key with "R" added.
for (const key of Object.keys(MODELS)) {
  const m = MODELS[key];
  MODELS[key + "R"] = { len: m.len, oneEnd: false, variant: m.variant,
    draw: (c) => `<g transform="matrix(-1 0 0 1 ${c.L} 0)">${m.draw({ ...c, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: c.coupledL, cabL: c.cabR, cabR: c.cabL })}</g>` };
  TYPES[key + "R"] = { ...TYPES[key] };
}

// ===================== What usually runs =====================
const set = (label, ...units) => ({ label, units });
const one = (...keys) => keys.map((k) => [k, 1]);
const times = (k, units) => Array.from({ length: k }, () => units).flat();
// Loco-hauled double-deck trains: the locomotive at the north/west end as
// they are usually photographed, the coaches (the multi-purpose car next to
// the locomotive), the driving trailer (first class upstairs) at the far end.
const dd = (loco, coaches, cab = "deRDdCab4R") => [[loco, 1], ["deRDdBike", 1], ["deRDd", coaches - 1], [cab, 1]];
const t2 = (cars, lv = "T2") => lv === "Md" ? [["deRMdCab", 1], ["deRMdMid", cars - 2], ["deRMdCabBR", 1]] : [["deRT2Cab1", 1], ["deRT2Mid", cars - 2], ["deRT2CabR", 1]];
const U = {
  T445: one("deR445Cab1", "deR445Mid", "deR445MidR", "deR445CabR"),
  KISS: one("deRKissCab", "deRKissMid", "deRKissMidR", "deRKissCabR"),
  L648: one("deR648Cab1", "deR648CabR"),
  L623: one("deR623Cab1", "deR623CabR"),
  L1648: one("deR1648Cab", "deR1648CabR"),
  LSH: one("deR648ShCab", "deR648ShCabR"),
  LPE: one("deR648PeCab1", "deR648PeCabR"),
  D642: one("deR642", "deR642R"),
  ERZ: one("deR642Erz", "deR642ErzR"),
  R612: one("deR612", "deR612R"),
  L54: one("deR622", "deR622R"),
  MIR: one("deR463Cab", "deR463Mid", "deR463CabR"),
};
export const SETS = {
  HANSE: set("DB 146 with five double-deck coaches, the driving trailer at the far end (Hanse-Express)", ...dd("deR146", 4)),
  NORDDEICH: set("DB 146 with seven double-deck coaches (RE 1 Norddeich-Hannover)", ...dd("deR146", 6)),
  RE2NI: set("DB 146 or 147 with six double-deck coaches", ...dd("deR146", 5)),
  RE9NI: set("DB 146 with four double-deck coaches (some trains a Talent 2)", ...dd("deR146", 3)),
  MD3: set("DB 146 with three double-deck coaches", ...dd("deR146", 2)),
  BB112: set("DB 112 with five double-deck coaches (some trains a 114, 143 or 147)", ...dd("deR112", 4)),
  RE5: set("DB 112 with five double-deck coaches (some trains a 146 or a five-car Twindexx Vario)", ...dd("deR112", 4)),
  FEX: set("DB 112 with four double-deck coaches (the airport express)", ...dd("deR112", 3)),
  RB81: set("DB 112 with six double-deck coaches (the driving trailer at the Bad Oldesloe end)", ...dd("deR112", 5)),
  OBERELBE: set("Talent 2 (DB 442), five cars (some trains DB 112 with double-deck coaches)", ...t2(5)),
  T2_5: set("Talent 2 (DB 442.3), five cars", ...t2(5)),
  T2_4: set("Talent 2 (DB 442), four cars (one to three units)", ...t2(4)),
  T2_3: set("Talent 2 (DB 442.1), three cars", ...t2(3)),
  MD_4: set("Talent 2 (DB 1442) of the S-Bahn Mitteldeutschland fleet, four cars", ...t2(4, "Md")),
  MD_3: set("Talent 2 (DB 1442) of the S-Bahn Mitteldeutschland fleet, three cars", ...t2(3, "Md")),
  T445_2: set("Twindexx Vario (DB 445): two four-car units (the Kiel and Flensburg halves of RE 7 part at Neumünster)", ...U.T445, ...U.T445),
  T445_1: set("Twindexx Vario (DB 445), four cars (some trains two units)", ...U.T445),
  KISS_2: set("KISS (DB 445): two four-car units (some trains three)", ...U.KISS, ...U.KISS),
  KISS_1: set("KISS (DB 445), four cars", ...U.KISS),
  MARSCH: set("Two DB 245s with the Marschbahn's coaches (some trains a 218, or double-deck coaches)", ["deR245", 1], ["deRMp", 4], ["deR245", 1]),
  RB62: set("LINT 41 (DB 648) in Schleswig-Holstein's design (some trains with a LINT 54)", ...U.LSH),
  RB85: set("LINT 41 (DB 648) in Schleswig-Holstein's design, one to three units", ...U.LSH),
  L648: set("LINT 41 (DB 648)", ...U.L648),
  L648_2: set("LINT 41 (DB 648): two units", ...U.L648, ...U.L648),
  L623_2: set("LINT 41 (DB 623): two units", ...U.L623, ...U.L623),
  L1648: set("LINT 41 (DB 1648), in Abellio's former paint", ...U.L1648),
  L1648_2: set("LINT 41 (DB 1648), two units, in Abellio's former paint", ...U.L1648, ...U.L1648),
  L640: set("LINT 27 (DB 640)", ["deR640", 1]),
  L640_2: set("LINT 27 (DB 640): two cars (some trains with a LINT 41)", ["deR640", 1], ["deR640R", 1]),
  PE: set("LINT 41 (DB 648) of the Prignitz-Express, two units", ...U.LPE, ...U.LPE),
  D642: set("Desiro Classic (DB 642)", ...U.D642),
  D642_2: set("Desiro Classic (DB 642): two units", ...U.D642, ...U.D642),
  ERZ: set("Desiro Classic (DB 642) of the Erzgebirgsbahn", ...U.ERZ),
  R612: set("RegioSwinger (DB 612): two units", ...U.R612, ...U.R612),
  W641: set("Coradia A TER (DB 641)", ["deR641", 1]),
  UBB: set("GTW 2/6 (DB 646) of the Usedomer Bäderbahn", ["deR646Ubb", 1]),
  MIR: set("Mireo (DB 463), three cars (some trains two units)", ...U.MIR),
};
const BY_KEY = {};
for (const [k, st] of Object.entries(SETS)) for (const [key] of st.units) BY_KEY[key.replace(/R$/, "")] ??= st;
Object.assign(BY_KEY, { deR146: SETS.HANSE, deR112: SETS.BB112, deRDd: SETS.HANSE, deRDdBike: SETS.HANSE, deRDdCab4: SETS.HANSE, deR623Cab1: SETS.L623_2, deR623Cab: SETS.L623_2 });

const plain = (v) => String(v || "").normalize("NFD").replace(/[̀-ͯ]/g, "");
const namesOf = (t) => [t.origin, t.destination, ...(t.stops || []).map((x) => x?.name || x?.stop || x || "")].map(plain).join("|");
// The trains' lines (the timetable's route names: "RE 7", "RB 81"...) and,
// where one name covers lines in different states, the stations they reach.
// What runs on each (2026): the states' line lists on Wikipedia (Schleswig-
// Holstein and Mecklenburg-Vorpommern December 2025, Niedersachsen and
// Sachsen-Anhalt October 2026, Sachsen and Thüringen 2025-2026), DB Regio
// Nordost's networks, and the photographs named at each drawing.
export const TYPICAL = {
  dbregio: (t, reported) => {
    const r = String(t.route || "").toUpperCase().replace(/\s+/g, " ").trim();
    if (reported && (t.fleet || !r)) return BY_KEY[reported.replace(/R$/, "")] || null;
    const at = namesOf(t), has = (re) => re.test(at);
    switch (r) {
      case "RE 1":
        if (has(/Norddeich|Oldenburg|Emden|Leer|Bremen|Nienburg|Hannover/)) return SETS.NORDDEICH;
        if (has(/Gottingen|Erfurt|Gera|Glauchau|Weimar|Gotha/)) return SETS.R612;
        return SETS.HANSE;
      case "RE 2":
        if (has(/Gottingen|Uelzen|Hannover|Celle/)) return SETS.RE2NI;
        return SETS.BB112;
      case "RE 3":
        if (has(/Erfurt|Altenburg|Greiz|Gera|Jena|Weimar/)) return SETS.R612;
        return SETS.BB112;
      case "RE 4":
        if (has(/Lubeck|Schonberg|Butzow|Teterow|Bad Kleinen|Pasewalk|Ueckermunde|Szczecin|Neubrandenburg|Gustrow/)) return SETS.L623_2;
        if (has(/Halle|Goslar|Halberstadt|Wernigerode/)) return SETS.L1648;
        return SETS.BB112;
      case "RE 5":
        if (has(/Cuxhaven|Stade/)) return null; // Start Unterelbe's trains in metronom's former paint: not drawn
        return SETS.RE5;
      case "RE 6": case "RE 6X": case "RE 60":
        if (has(/Wittenberge|Neuruppin|Hennigsdorf|Pritzwalk/)) return SETS.PE;
        return SETS.MARSCH;
      case "RE 7":
        if (has(/Kiel|Flensburg|Neumunster|Elmshorn/)) return SETS.T445_2;
        return SETS.BB112;
      case "RE 70": return SETS.T445_1;
      case "RE 8":
        if (has(/Bremen|Hannover|Bremerhaven|Nienburg/)) return SETS.T2_4;
        return SETS.KISS_2;
      case "RE 80": return SETS.KISS_2;
      case "RE 8X": case "RE 86": return SETS.KISS_1;
      case "RE 9":
        if (has(/Osnabruck|Diepholz|Bremerhaven/)) return SETS.RE9NI;
        return SETS.T2_5;
      case "RE 10": case "RE 11": case "RE 13":
        if (has(/Cottbus|Torgau|Falkenberg|Hoyerswerda|Frankfurt \(Oder\)|Senftenberg|Elsterwerda|Ruhland|Eilenburg|Guben/)) return SETS.MIR;
        if (r === "RE 13") return SETS.MD_4;
        if (r === "RE 11" && has(/Gottingen|Leinefelde|Muhlhausen/)) return SETS.D642;
        return SETS.L1648;
      case "RE 14": case "RB 51": return SETS.MD_3;
      case "RE 15": case "RE 18": return SETS.OBERELBE;
      case "RB 31": return SETS.T2_3;
      case "RE 50": case "RE 51": case "RB 28": return SETS.T2_5;
      case "RE 19": case "RE 55": case "RE 56": case "RB 11": case "RB 12": case "RB 33": case "RB 53": case "RB 71": case "RB 72": case "RB 91": case "U 28":
        return SETS.D642;
      case "RB 52": return SETS.D642;
      case "RE 20":
        if (has(/Uelzen|Stendal|Salzwedel|Magdeburg|Schonebeck/)) return SETS.MD3;
        return SETS.BB112;
      case "RE 30":
        if (has(/Halle|Magdeburg|Kothen/)) return SETS.MD3;
        return SETS.BB112;
      case "RB 40": return SETS.MD3;
      case "RE 21": case "RE 24": case "RE 31": case "RB 36": case "RB 41": case "RB 47": case "RB 50": case "RB 77":
        if (r === "RB 77" && has(/Hildesheim|Herford|Hameln/)) return SETS.L648;
        return SETS.L1648;
      case "HBX": return SETS.L1648_2;
      case "RB 43":
        if (has(/Cottbus|Falkenberg|Frankfurt \(Oder\)/)) return SETS.MIR;
        return SETS.L1648;
      case "RB 44":
        if (has(/Braunschweig|Salzgitter/)) return SETS.L640_2;
        return SETS.L1648;
      case "RB 48": return SETS.L640_2;
      case "RB 86": return SETS.L640;
      case "RB 25":
        if (has(/Barth|Stralsund/)) return SETS.L640;
        return SETS.T2_3;
      case "RB 49": return SETS.MIR;
      case "RE": case "RB":
        if (has(/Forst/)) return SETS.D642;
        return null;
      case "RB 14": case "RB 24":
        if (has(/Zinnowitz|Peenemunde/)) return SETS.UBB;
        return SETS.T2_5;
      case "RB 20": case "RB 21": case "RB 22": case "RB 32": case "RB 55":
        return r === "RB 55" ? SETS.L648 : SETS.T2_3;
      case "RB 23":
        if (has(/Zussow|Swinoujscie|Heringsdorf|Wolgast|Zinnowitz/)) return SETS.UBB;
        return SETS.T2_3;
      case "FEX": return SETS.FEX;
      case "RB 37": case "RB 38": case "RB 45": case "RB 46": case "RB 79": case "RB 82":
        return SETS.L648;
      case "RB 80":
        if (has(/Chemnitz|Annaberg|Cranzahl/)) return SETS.ERZ;
        return SETS.L648;
      case "RB 81":
        if (has(/Chemnitz|Olbernhau/)) return SETS.ERZ;
        if (has(/Hamburg|Ahrensburg|Bad Oldesloe|Bargteheide/)) return SETS.RB81;
        return SETS.L648;
      case "RB 95": return SETS.ERZ;
      case "RB 60": return SETS.W641;
      case "RB 61": return null; // the Oberweißbacher Bergbahn's funicular and flat-section railcar
      case "RB 62": return SETS.RB62;
      case "RB 85": return SETS.RB85;
      case "RB 113": return SETS.W641;
      case "RB 36X": return SETS.L1648;
      default:
        return reported ? BY_KEY[reported.replace(/R$/, "")] || null : null;
    }
  },
};

// Vehicle numbers (DB's six- and seven-digit class and running numbers),
// for the fleet pages: one number in each range draws its whole set.
export const FLEETS = {
  dbregio: [[146001, 146032, "deR146"], [146101, 146132, "deR146"], [146201, 146284, "deR146"], [112101, 112190, "deR112"],
    [245201, 245222, "deR245"], [445011, 445042, "deR445Cab1"], [445101, 445199, "deRKissCab"], [445601, 445699, "deRKissCab"],
    [442001, 442999, "deRT2Cab1"], [1442001, 1442999, "deRMdCab"], [463001, 463699, "deR463Cab"], [622001, 622999, "deR622"],
    [623001, 623999, "deR623Cab1"], [640001, 640999, "deR640"], [641001, 641999, "deR641"], [642001, 642999, "deR642"],
    [646101, 646199, "deR646Ubb"], [648001, 648999, "deR648Cab1"], [1648001, 1648999, "deR1648Cab"], [612001, 612999, "deR612"]],
};

// ---------- Fact sheets ----------
const kmh = (v) => Math.round(v / 1.609);
const kw = (v) => Math.round(v * 1.341);
const part = (base, about) => ({ ...base, about });
const DOSTO = { model: "Bombardier double-deck coach (DB Regio \"Dosto\")", type: "Double-deck coach", builder: "Bombardier (Görlitz), now Alstom", built: "1994–2014",
  topSpeedMph: kmh(160), lengthFt: 88, source: "https://de.wikipedia.org/wiki/Doppelstockwagen_der_Deutschen_Bahn" };
const T2F = { model: "Bombardier Talent 2 (DB 442)", type: "Electric multiple unit", builder: "Bombardier (Hennigsdorf), now Alstom", built: "2008–2014",
  topSpeedMph: kmh(160), source: "https://de.wikipedia.org/wiki/DB-Baureihe_442" };
const LINTF = { model: "Alstom Coradia LINT 41", type: "Diesel multiple unit", builder: "Alstom (Salzgitter)", built: "2000–2025", topSpeedMph: kmh(120), lengthFt: 137,
  source: "https://de.wikipedia.org/wiki/Alstom_Coradia_LINT" };
const DESF = { model: "Siemens Desiro Classic (DB 642)", type: "Diesel multiple unit", builder: "Siemens and Düwag", built: "1999–2008", topSpeedMph: kmh(120), lengthFt: 137, seats: 110,
  source: "https://de.wikipedia.org/wiki/Siemens_Desiro_Classic" };
const TDXF = { model: "Bombardier Twindexx Vario (DB 445)", type: "Double-deck electric multiple unit", builder: "Bombardier (Görlitz), now Alstom", built: "2016–2018",
  fleet: "17 four-car units for Schleswig-Holstein's Netz Mitte", topSpeedMph: kmh(160), source: "https://de.wikipedia.org/wiki/Bombardier_Twindexx_Vario" };
const KISSF = { model: "Stadler KISS (DB 445)", type: "Double-deck electric multiple unit", builder: "Stadler Rail", built: "2021–2023", fleet: "18 four-car units for Schleswig-Holstein's Elektronetz Ost",
  topSpeedMph: kmh(160), source: "https://de.wikipedia.org/wiki/Stadler_KISS" };
const MIRF = { model: "Siemens Mireo (DB 463)", type: "Electric multiple unit", builder: "Siemens Mobility", built: "2021–2022", fleet: "the Netz Lausitz's three-car units",
  topSpeedMph: kmh(160), lengthFt: 230, seats: 180, source: "https://de.wikipedia.org/wiki/Siemens_Mireo" };
export const FACTS = {
  deR146: { model: "Bombardier TRAXX P160 AC (DB 146)", type: "Electric locomotive", builder: "Bombardier (Kassel), now Alstom", built: "2001–2006", topSpeedMph: kmh(160),
    powerHp: kw(5600), lengthFt: 62, source: "https://de.wikipedia.org/wiki/DB-Baureihe_146", about: "Pushes and pulls DB Regio's double-deck trains in Niedersachsen, Bremen, Sachsen-Anhalt and on the Hanse-Express." },
  deR112: { model: "LEW Hennigsdorf class 112.1 (DR 212)", type: "Electric locomotive", builder: "LEW Hennigsdorf", built: "1990–1992", topSpeedMph: kmh(160), powerHp: kw(4220), lengthFt: 55,
    source: "https://de.wikipedia.org/wiki/DR-Baureihe_243", about: "The East German design that still hauls DB Regio Nordost's double-deck trains around Berlin and the RB 81 out of Hamburg." },
  deRDd: part(DOSTO, "A second-class coach: eight windows on the lower deck between the doors, twelve upstairs."),
  deRDd1: part(DOSTO, "A coach with first class upstairs (the yellow line between the decks)."),
  deRDdBike: part(DOSTO, "The multi-purpose coach (DBpza 751): bicycles and wheelchairs on the lower deck, fewer windows there."),
  deRDdCab4: part({ ...DOSTO, lengthFt: 89.5 }, "The driving trailer (from 2008, the fourth Görlitz head): the cab, first class upstairs (the yellow line), bicycles below."),
  deRDdCab3: part({ ...DOSTO, lengthFt: 89.5 }, "The driving trailer of 1997-2007 (DABpbzfa 762)."),
  deRT2Cab1: part({ ...T2F, lengthFt: 66 }, "An end car with first class behind the cab (the yellow line) and the pantograph on its roof."),
  deRT2Cab: part({ ...T2F, lengthFt: 66 }, "An end car: the cab over its motor bogie, then a door and the low-floor saloon."),
  deRT2Mid: part({ ...T2F, lengthFt: 53 }, "A middle car on the Jakobs bogies shared with its neighbors."),
  deRMdCab: part({ ...T2F, model: "Bombardier Talent 2 (DB 1442)", lengthFt: 66 }, "From the S-Bahn Mitteldeutschland's fleet, in its silver and green; the RE 13 and RE 14 and the RB 51 in Sachsen-Anhalt."),
  deRMdCabB: part({ ...T2F, model: "Bombardier Talent 2 (DB 1442)", lengthFt: 66 }, "The other end car."),
  deRMdMid: part({ ...T2F, model: "Bombardier Talent 2 (DB 1443)", lengthFt: 53 }, "A middle car."),
  deR445Cab1: part({ ...TDXF, lengthFt: 85 }, "An end car: first class upstairs (the yellow band), the pantograph on the let-down roof at its inner end. RE 7 and RE 70 Hamburg-Kiel/Flensburg."),
  deR445Cab: part({ ...TDXF, lengthFt: 85 }, "The other end car."),
  deR445Mid: part({ ...TDXF, lengthFt: 88 }, "A middle car, second class."),
  deRKissCab: part({ ...KISSF, lengthFt: 87 }, "An end car: first class upstairs toward the cab (the yellow bar), the multi-purpose area (the big bicycles) below. RE 8 and RE 80 Hamburg-Lübeck(-Travemünde)."),
  deRKissMid: part({ ...KISSF, lengthFt: 84 }, "A middle car, the pantograph on its roof."),
  deR648Cab1: part(LINTF, "A section with first class behind the cab (the yellow line)."),
  deR648Cab: part(LINTF, "A section; the bicycle area by its door."),
  deR623Cab1: part({ ...LINTF, model: "Alstom Coradia LINT 41 H (DB 623)" }, "The Stadttore-Linie (RE 4 Lübeck-Bad Kleinen-Pasewalk-Szczecin) and the Bützow-Teterow trains."),
  deR623Cab: part({ ...LINTF, model: "Alstom Coradia LINT 41 H (DB 623)" }, "A section."),
  deR1648Cab: part({ ...LINTF, model: "Alstom Coradia LINT 41 (DB 1648)", built: "2014–2018" }, "The Dieselnetz Sachsen-Anhalt's units (HBX, RE 4, RE 10, RE 11, RE 21, RE 24, RE 31, RB 36-RB 77), DB Regio's since Abellio left in December 2024, still in Abellio's silver with its name removed."),
  deR648ShCab: part(LINTF, "In Schleswig-Holstein's blue design: RB 85 Lübeck-Neustadt and RB 62 Itzehoe-Heide."),
  deR648PeCab1: part(LINTF, "The Prignitz-Express (RE 6 Berlin-Neuruppin-Wittenberge): first class behind the cab under the yellow line."),
  deR648PeCab: part(LINTF, "The Prignitz-Express's other section."),
  deR640: { model: "Alstom Coradia LINT 27 (DB 640)", type: "Diesel railcar", builder: "Alstom (Salzgitter)", built: "1999–2000", topSpeedMph: kmh(120), lengthFt: 89,
    source: "https://de.wikipedia.org/wiki/Alstom_Coradia_LINT", about: "A single car with a cab at each end: Braunschweig's and Einbeck's branches, Stralsund-Barth." },
  deR622: { model: "Alstom Coradia LINT 54 (DB 622)", type: "Diesel multiple unit", builder: "Alstom (Salzgitter)", built: "2016–2018", topSpeedMph: kmh(140), lengthFt: 178,
    source: "https://de.wikipedia.org/wiki/Alstom_Coradia_LINT", about: "A car of the two-car LINT 54." },
  deR642: part(DESF, "A section of the two-car Desiro: Mecklenburg, Thüringen, Sachsen's branches."),
  deR642Erz: part(DESF, "The Erzgebirgsbahn's Desiros (RB 80, RB 81, RB 95 from Chemnitz and Zwickau)."),
  deR612: { model: "Bombardier RegioSwinger (DB 612)", type: "Tilting diesel multiple unit", builder: "Bombardier (Adtranz)", built: "1998–2004", topSpeedMph: kmh(160), lengthFt: 85,
    source: "https://de.wikipedia.org/wiki/DB-Baureihe_612", about: "Thüringen's tilting trains: RE 1 Göttingen-Erfurt-Gera-Glauchau and RE 3 Erfurt-Gera-Altenburg/Greiz." },
  deR641: { model: "Alstom Coradia A TER (DB 641)", type: "Diesel railcar", builder: "Alstom (De Dietrich)", built: "2000–2001", topSpeedMph: kmh(120), lengthFt: 95,
    source: "https://de.wikipedia.org/wiki/DB-Baureihe_641", about: "\"Der Geithainer\" (RB 113 Leipzig-Geithain) and the Schwarzatalbahn (RB 60)." },
  deR646Ubb: { model: "Stadler GTW 2/6 (DB 646)", type: "Diesel multiple unit", builder: "Stadler Rail", built: "2002–2003", topSpeedMph: kmh(120), lengthFt: 127,
    source: "https://de.wikipedia.org/wiki/Usedomer_B%C3%A4derbahn", about: "The Usedomer Bäderbahn's trains, Züssow-Świnoujście and Zinnowitz-Peenemünde: two cars either side of the power module." },
  deR245: { model: "Bombardier TRAXX P160 DE ME (DB 245)", type: "Diesel locomotive", builder: "Bombardier (Kassel), now Alstom", built: "2013–2016", topSpeedMph: kmh(160), powerHp: kw(2256),
    lengthFt: 62, source: "https://de.wikipedia.org/wiki/Bombardier_TRAXX#TRAXX_P160_DE_ME", about: "The Marschbahn's locomotives (RE 6 Hamburg-Westerland), in Schleswig-Holstein's blue design." },
  deRMp: { model: "Bombardier \"Married Pair\" coach", type: "Coach", builder: "Bombardier (Görlitz)", built: "2005", lengthFt: 88, topSpeedMph: kmh(160),
    source: "https://de.wikipedia.org/wiki/Marschbahn", about: "Built for the Nord-Ostsee-Bahn, DB Regio's since 2016: run in pairs between two 245s on the RE 6 to Sylt." },
  deR463Cab: part({ ...MIRF }, "An end car: the cab over its motor bogie, two double doors."),
  deR463Mid: part({ ...MIRF }, "The middle car: the multi-purpose area (the big bicycle) and the pantograph."),
};
for (const k of Object.keys(FACTS)) FACTS[k + "R"] ??= FACTS[k];
// Every set, for checking the drawings together.
export const SAMPLE_SETS = Object.values(SETS);
