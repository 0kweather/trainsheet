// Germany's private regional railways in the south and west
// (scripts/railroads/germany.py, railroad "deprivat2"): Arverio in
// Baden-Württemberg and Bayern, SWEG, agilis, the Bayerische Regiobahn (BRB),
// Die Länderbahn's waldbahn, oberpfalzbahn and alex, the Hessische
// Landesbahn (HLB), VIAS, vlexx, the MittelrheinBahn (Trans Regio), the
// Westerwaldbahn, the Bodensee-Oberschwaben-Bahn, WEG's lines round
// Stuttgart and the Bayerische Zugspitzbahn. Trainsheet's own side views at
// the shared scale (js/carart.js), from the builders' data sheets and type
// drawings (Stadler's FLIRT data sheet for Baden-Württemberg, Alstom's and
// Siemens's published dimensions) and photographs (Wikimedia Commons,
// 2024-2026), each unit in the paint most of its fleet wears in autumn
// 2026. The operators' word marks are drawn from their published logos
// (the bwegt and Arverio marks as the shapes in their logo files); the rest
// of the lettering is set here.
//
// The timetable names no cars, so TYPICAL picks what usually runs each line
// (the operators' fleet pages and Wikipedia's line lists for the 2026
// timetable); FLEETS maps the units' numbers (UIC series 1427-1430, 2463,
// 440, 650, 648, 622 ...) to their drawings for the fleet pages.

import { C, rect, circle, path, line, lines, poly, truck, pantograph, slats, win } from "../carart.js?v=dev";
import { newId } from "../carmodels.js?v=dev";
import { mark, euroLoco, TYPES as CZ_TYPES, MODELS as CZ_MODELS, FACTS as CZ_FACTS } from "./czechia.cars.js?v=dev";
import { lamp, RED_LAMP, wiper } from "./digitraffic.cars.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
const NARROW = "Roboto Condensed, Arial Narrow, Helvetica Neue Condensed, Helvetica Neue, Arial, sans-serif";
const clip = (d, inner) => {
  const id = newId();
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`;
};
// Text in a mark() group (y down, centered at its origin), so it reads left
// to right on a car drawn the other way round too.
const txt = (x, y, h, text, fill, { weight = 700, family = SANS, anchor = "middle", spacing = 0, style = "", extra = "" } = {}) =>
  `<text x="${n(x)}" y="${n(y + h * 0.36)}" font-size="${n(h)}" text-anchor="${anchor}" font-weight="${weight}" letter-spacing="${spacing}" font-family="${family}" fill="${fill}"${style ? ` font-style="${style}"` : ""}${extra ? " " + extra : ""}>${text}</text>`;
const letters = (c, x, y, h, text, fill, o) => mark(c, x, y, txt(0, 0, h, text, fill, o));
const fitted = (c, x, y, h, text, fill, w, o = {}) => letters(c, x, y, h, text, fill, { ...o, extra: `textLength="${n(w)}" lengthAdjust="spacingAndGlyphs"` });
// A smooth outline through points (Catmull-Rom as cubic Béziers), closed.
function smooth(pts, closed = true) {
  let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
  const N = pts.length, at = (i) => pts[closed ? (i + N) % N : Math.max(0, Math.min(N - 1, i))];
  for (let i = 0; i < (closed ? N : N - 1); i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    d += `C${n(p1[0] + (p2[0] - p0[0]) / 6)} ${n(p1[1] + (p2[1] - p0[1]) / 6)} ${n(p2[0] - (p3[0] - p1[0]) / 6)} ${n(p2[1] - (p3[1] - p1[1]) / 6)} ${n(p2[0])} ${n(p2[1])}`;
  }
  return d + (closed ? "Z" : "");
}
// A path through points: plain points are corners, ["s", ...points] a
// smooth run through them (y up, feet).
function outline(parts) {
  let d = "", first = true;
  for (const p of parts) {
    if (p[0] === "s") {
      const pts = p.slice(1);
      if (first) { d += `M${n(pts[0][0])} ${n(pts[0][1])}`; first = false; } else d += `L${n(pts[0][0])} ${n(pts[0][1])}`;
      for (let i = 0; i + 1 < pts.length; i++) {
        const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
        d += `C${n(p1[0] + (p2[0] - p0[0]) / 6)} ${n(p1[1] + (p2[1] - p0[1]) / 6)} ${n(p2[0] - (p3[0] - p1[0]) / 6)} ${n(p2[1] - (p3[1] - p1[1]) / 6)} ${n(p2[0])} ${n(p2[1])}`;
      }
    } else { d += `${first ? "M" : "L"}${n(p[0])} ${n(p[1])}`; first = false; }
  }
  return d + "Z";
}

// ---------- Marks ----------
// bwegt, Baden-Württemberg's mark for its trains (bwegt's logo file): the
// Württemberg lion, "bw" and "egt" in their heavy italic, "Mobilität für
// Baden-Württemberg" under them. Paths in a 285 x 79 box, y down.
const BWEGT = {
  lion: "M65.2 26.8C64.8 26.5 64.4 26 64.1 25.6C65.1 25.4 66.2 25.8 66.2 25.8C66.3 27.1 66.1 27.4 65.2 26.8ZM65.9 46.5C67.7 45.4 76.9 39.5 76.9 39.5C78.3 37.5 79.6 37.5 82.4 37.4C82.7 32.5 74.2 33.7 74.1 36.6C74.2 36.6 66.3 37.3 66.3 37.3C66.3 37.3 66.3 35.2 66.3 34.2C66.3 34 66.4 34 66.5 34C66.6 34 66.6 34 66.7 34C67.6 34.8 68.4 35.5 69.1 35.4C69.8 35 69.7 34.4 69.7 32.9C68.4 34.1 67.9 33.1 67.7 31.6C69.6 32 74.1 32.8 73.9 28.4C73.9 28.4 73.7 28.4 73.7 28.4C73.4 32.1 68.8 31.5 68.1 30.3C67.7 29.7 68.8 27.6 70.8 30C70.8 30 71.1 27 70.9 26.6C70.9 26.4 65.3 24.1 63 24.3C61.6 24.4 59.2 24.6 58.4 24.7C57.6 24.9 55.9 23.8 55.3 23.7C55.3 23.9 56 25.5 56 25.5C54.6 26.8 52.7 31.1 52.5 33.9C51 35.3 43.1 38.7 29.2 34.1C20 31.1 14.2 35.2 12.7 30.9C12.3 29.9 12.1 28.4 14.6 27C17.3 25.6 21.5 25.7 29.9 28.9C33.6 30.3 40.3 32.7 43.5 32.7C46.6 32.7 48.6 30.9 48.6 27.8C48.5 25.5 43.8 22.8 43.7 23C43.5 23.2 47.2 26.5 45.1 29.4C43 32.4 39.1 30.7 37.5 30.3C31 28.5 20.6 22.1 13.6 25.3C9.1 27.3 9.1 33.3 13.7 34.7C12.5 37.2 10.1 42.8 10 45.3C9.9 45.3 5.2 46.5 5.2 46.5L4 54.1L14 54.1C14 54.1 14.3 51.9 9.7 50.8C9.6 50.7 9.5 50.7 9.5 50.6C9.5 50.5 9.6 50.4 9.6 50.4C11.3 49.4 18.8 47.1 20.8 43.9C23.9 47.4 26.2 53.2 26.1 54.1L37.2 54.2C37.2 54.2 38.4 50.8 30.2 50.4C30.2 47.9 30 43.8 29.9 42.1C29.9 42.1 29.9 42.1 29.9 42.1C29.8 42 29.9 41.9 30.1 41.9C30.1 41.9 30.1 41.9 30.1 41.9C38.2 43.1 38.1 49.3 51.4 48.9C51.5 49.3 51.5 50.1 51.5 50.1C51.5 50.1 65.6 54.1 65.6 54.2L79.8 54.2C79.7 52.5 78.9 50.1 71 51C69.8 49.9 66.8 47.5 65.9 46.9C65.8 46.8 65.8 46.8 65.8 46.7C65.8 46.6 65.8 46.5 65.9 46.5",
  b: "M102 19L105.4 0C99.7 0.5 95.9 2.1 94.8 2.6L89.4 33.4C88.9 36.2 88.5 39.7 88.5 42.4C88.5 49.7 91.9 55.1 102.4 55.1C116.3 55.1 123.5 43.5 123.5 29.4C123.5 21.3 119.7 15.1 111.8 15.1C107 15.1 104.3 17 102.4 19.2C102.1 19.5 101.9 19.4 102 19ZM108 23.8C111.7 23.8 113.1 26.8 113.1 30.9C113.1 38.2 110.1 46.7 103.6 46.7C100.1 46.7 98.5 45 98.5 40.5C98.5 33.2 101.4 23.8 108 23.8",
  w: "M156 54.2L165.2 54.2C171.8 45.2 179.3 29.3 183.7 16L173 16C170.4 26.1 166 36.1 162.9 42.4C162.7 42.6 162.4 42.6 162.4 42.2C162.4 36.1 161.1 26 159.4 16L150.5 16C147.3 26.1 143.5 36.1 140.4 42.3C140.3 42.6 140 42.6 140 42.2C139.7 36.1 138.6 26 136.7 16L126.1 16C129.8 29 132.4 45.2 133.2 54.2L142.5 54.2C146.8 47.1 151 37 152.9 31.7C153.1 31.4 153.3 31.4 153.4 31.7C154.4 36.9 155.7 47.1 156 54.2",
  egt: "M194 33.7C195.3 27.5 198.6 23.4 203.7 23.4C206.2 23.4 207.8 24.7 207.8 26.7C207.8 29.6 205.9 30.9 202 31.9L197.3 33.1C196 33.4 195.2 33.7 194.5 34.1C194.2 34.3 194 34.2 194 33.7ZM197.3 39.7L203.8 38.2C212.9 36.1 218.1 33.5 218.1 25.4C218.1 20 213.4 15.1 204.7 15.1C191.1 15.1 183.2 26.3 183.2 39.7C183.2 48.8 188.4 55.1 198 55.1C204.7 55.1 209.5 53.4 213.3 51.4L214.8 42.6C210 44.9 204.3 46.8 198.9 46.8C195.3 46.8 194.2 44.6 194.2 43C194.2 41.1 195.3 40.2 197.3 39.7M236.3 46.5C232.7 46.5 231.1 44.4 231.1 39.9C231.1 32.6 234 23.6 240.6 23.6C244.3 23.6 245.8 26.6 245.8 30.7C245.8 38 242.7 46.5 236.3 46.5ZM255.7 27.2C255.7 19.3 251.5 15.1 241.9 15.1C228 15.1 220.8 26.3 220.8 40.6C220.8 48.6 224.6 55.1 232.4 55.1C237.2 55.1 239.5 53.3 241.6 51.3C241.9 50.9 242.2 51 242.1 51.5C241.1 56.9 237.2 61.1 230.6 61.1C226.1 61.1 223 59.9 219.6 57.7L218.1 66.6C220.3 68.3 224.5 69.9 230.4 69.9C241.5 69.9 249.9 64.8 252.4 50.6C253 47.1 254.2 40 254.8 36.5C255.4 33 255.7 30 255.7 27.2M265.1 24L262.1 40.8C261.8 42.6 261.4 44.9 261.4 46.2C261.4 52.1 264.5 55 271.6 55C275.2 55 278.6 54.3 279.5 54L280.9 45.5C279.3 46 277.5 46.5 275.4 46.5C273.1 46.5 271.9 46 271.9 43.6C271.9 42.9 271.9 42.1 272.2 40.9L275.2 24L283.6 24L285 16L276.5 16L278.5 4.8C272.8 5.3 269 6.9 268 7.4L266.4 16L261.8 16L260.3 24L265.1 24",
};
// The mark h ft tall (lion to tagline), centered at (x, y).
function bwegtLogo(c, x, y, h, { bw = "#2f363b", egt = "#fbc715", tag = true } = {}) {
  const k = h / (tag ? 79 : 62), w = 285 * k;
  return mark(c, x, y, `<g transform="translate(${n(-w / 2)} ${n(-h / 2)}) scale(${n(k * 1000) / 1000})"><path d="${BWEGT.lion}" fill="${bw}"/><path d="${BWEGT.b}${BWEGT.w}" fill="${bw}"/><path d="${BWEGT.egt}" fill="${egt}"/>` +
    (tag ? txt(4, 72, 11.5, "Mobilität für Baden-Württemberg", bw, { weight: 500, anchor: "start", style: "italic", extra: 'textLength="205" lengthAdjust="spacingAndGlyphs"' }) : "") + "</g>");
}
// The lion alone, big on the side behind the cab (light gray on white),
// h ft tall, its feet at (x, y), facing the cab at the left; not turned
// back on a car drawn the other way round, so it faces that car's cab.
const bwLion = (x, y, h, fill, squeeze = 1) => `<g transform="translate(${n(x)} ${n(y)}) scale(${n(-h / 32 * squeeze * 1000) / 1000} ${n(-h / 32 * 1000) / 1000}) translate(-84 -54)"><path d="${BWEGT.lion}" fill="${fill}"/></g>`;
// Arverio (Arverio's logo file): ARVERIO in its geometric capitals, the
// first A open at the left with a blue wave through it; "BAYERN" under it
// on the Bavarian trains. Paths in a 628 x 154 box, y down.
const ARVERIO = {
  word: "M332.05 77.99h50.79V92h-67.5V2h65.7v14.02h-48.98v23.4h44.61c0 7.6-6.16 13.75-13.75 13.75h-30.86v24.82ZM207.66 34.01C207.66 14.08 193 2 169.34 2h-37.02v90h16.72V16.15h19.53c14.66 0 22.25 6.56 22.25 17.87s-7.59 18-22.25 18c-6.96 0-12.6 5.64-12.6 12.6v1.15h13.41c2.2 0 4.27 1.07 5.53 2.88l16.29 23.36h18l-20.7-29.58c12.22-4.75 19.17-14.78 19.17-28.41Zm51.18 37.42L228.88 2h-18.13l39.34 90h16.45l39.22-90h-16.72l-30.21 69.43Zm368.34-24.46c0 26.75-20.59 46.31-48.51 46.31s-48.51-19.68-48.51-46.31S550.75.65 578.67.65s48.51 19.56 48.51 46.33Zm-16.86 0c0-18.41-13.5-31.66-31.65-31.66s-31.65 13.25-31.65 31.66 13.5 31.65 31.65 31.65 31.65-13.25 31.65-31.65M476.88 34.01C476.88 14.08 462.22 2 438.57 2h-37.03v90h16.71V16.15h19.55c14.66 0 22.23 6.56 22.23 17.87s-7.58 18-22.23 18c-6.97 0-12.62 5.65-12.62 12.62v1.13h13.43c2.2 0 4.25 1.07 5.51 2.87l16.31 23.37h18l-20.7-29.58c12.21-4.75 19.15-14.78 19.15-28.41ZM495.56 92h16.72V2h-16.72zM0 92h16.72c0-41.09 33.5-74.52 75.12-74.52h5.18V92h16.72V2h-21.9C41.87 2 0 42.37 0 92",
  bayern: "M0 122h12.77c3.43 0 6.13.99 7.84 2.66 1.24 1.29 1.93 2.87 1.93 4.8v.09c0 3.9-2.4 5.91-4.76 6.94 3.56 1.07 6.43 3.13 6.43 7.24v.09c0 5.14-4.33 8.19-10.89 8.19H0v-30Zm19.11 7.93c0-2.96-2.36-4.89-6.64-4.89H3.34v10.33h8.87c4.07 0 6.9-1.84 6.9-5.36v-.09Zm-6.3 8.44H3.34v10.59h10.07c4.54 0 7.37-2.01 7.37-5.36v-.09c0-3.26-2.74-5.14-7.97-5.14m28.76-16.58h3.17L58.41 152h-3.64l-3.51-7.93H34.93L31.37 152H27.9zm8.36 19.24-6.81-15.3-6.86 15.3zm19.07-.9L56.53 122h4.11l10.11 15 10.2-15h3.94l-12.47 18.09V152h-3.43v-11.87ZM90.29 122h21.69v3.09h-18.3v10.24h16.37v3.09H93.68v10.5h18.51v3.09h-21.9v-30Zm28.72 0h12.9c3.69 0 6.64 1.11 8.53 3 1.46 1.46 2.31 3.56 2.31 5.91v.09c0 4.97-3.43 7.89-8.14 8.74l9.21 12.26h-4.16l-8.7-11.66h-8.57V152H119v-30Zm12.6 15.3c4.5 0 7.71-2.31 7.71-6.17v-.09c0-3.69-2.83-5.91-7.67-5.91h-9.26v12.17h9.21Zm18.38-15.3h3.17l18.9 24.04V122h3.3v30h-2.7l-19.37-24.6V152h-3.3z",
  wave: "M32.15 59.46c16.69-14.79 49.23 32.38 59.28-9.76-19.64 17.16-42.32-20.9-59.28 9.76",
};
function arverioLogo(c, x, y, h, color, { wave = "#008dc9", bayern = false } = {}) {
  const H = bayern ? 152 : 94, k = h / H, w = 628 * k;
  return mark(c, x, y, `<g transform="translate(${n(-w / 2)} ${n(-h / 2)}) scale(${n(k * 10000) / 10000})"><path d="${ARVERIO.word}${bayern ? ARVERIO.bayern : ""}" fill="${color}"/><path d="${ARVERIO.wave}" fill="${wave}"/></g>`);
}

// ---------- A car of a multiple unit ----------
// o: d (the body's outline path), base (its color), paint(c) (clipped to
// the body), wins ([x0, x1, y0, y1, r]), winFill, doors, door(c, d),
// trucks ([x, wb, d(in)]), truckTop, under(c), over(c) (clipped, over the
// windows), extra(c) (on top), roof(c) (behind the body: roof equipment),
// gangway [floor, top], cab (no gangway at the left).
function sec(c, o) {
  const L = c.L, d = o.d;
  let s = (o.trucks || []).map(([x, wb, dia]) => truck(x, { wb, d: dia, top: o.truckTop ?? 2.9 })).join("");
  if (o.under) s += o.under(c);
  if (o.roof) s += o.roof(c);
  let liv = o.paint(c);
  liv += (o.wins || []).map(([x0, x1, y0, y1, r = 0.45]) => (o.frame ? rect(x0 - o.frame, y0 - o.frame, x1 - x0 + 2 * o.frame, y1 - y0 + 2 * o.frame, o.frameFill || "#141618", 0, `rx="${r + o.frame * 0.6}"`) : "") +
    glass(x0, y0, x1 - x0, y1 - y0, r, o.winEdge)).join("");
  if (o.over) liv += o.over(c);
  s += path(d, o.base) + clip(d, liv);
  if (o.door) s += (o.doors || []).map((dr) => o.door(c, dr)).join("");
  if (o.extra) s += o.extra(c);
  s += path(d, "none", 0.8);
  const [floor, top] = o.gangway || [1.6, 12.0];
  if (c.coupledL && !o.cab) s += gangway(0, -1, floor, top);
  if (c.coupledR) s += gangway(L, 1, floor, top);
  return s;
}
// A window: dark glass, the sky's reflection in its upper part, a black
// rubber edge (or edge: a color).
const glass = (x, y, w, h, r = 0.45, edge = C.gasket) => rect(x, y, w, h, C.glass, 0, `rx="${r}" stroke="${edge || C.gasket}" stroke-width="0.6" vector-effect="non-scaling-stroke"`) +
  rect(x + 0.12, y + h * 0.6, w - 0.24, h * 0.3, C.glassLight, 0, `rx="${Math.min(r, 0.2)}"`);
// The bellows between two cars of a unit, and the coupler under it.
function gangway(xFace, side, floor, top) {
  const w = 0.9, x = side < 0 ? xFace : xFace - w;
  return rect(x, floor, w, top - floor, C.rubber, 0, 'rx="0.2"') + lines([[x + 0.3, floor + 0.3, x + 0.3, top - 0.3], [x + 0.6, floor + 0.3, x + 0.6, top - 0.3]], "#3a3f45", 0.6);
}
// The automatic coupler under a nose at the left, its head at the face.
function coupler(y = 3.0, reach = 2.6) {
  return rect(0.3, y - 0.28, reach, 0.56, "currentColor", 0, 'opacity="0.9"') + rect(0, y - 0.65, 0.6, 1.3, "currentColor", 0, 'rx="0.15"') +
    rect(0.2, y + 0.7, 0.55, 0.38, C.steelDark, 0.3);
}
// A plug door, two leaves, a tall window in each; fill the leaves' color.
function plugDoor(d, fill, { glassTop = 8.6, glassLow = 4.7, gw = 1.3, seam = "rgba(0,0,0,0.5)", edge = "rgba(0,0,0,0.55)" } = {}) {
  const m = d.x + d.w / 2, lw = d.w / 2;
  let s = rect(d.x, d.y0, d.w, d.y1 - d.y0, fill, 0, `rx="0.2" stroke="${edge}" stroke-width="0.6" vector-effect="non-scaling-stroke"`) + line(m, d.y0 + 0.1, m, d.y1 - 0.1, seam, 0.7);
  for (const a of [d.x + (lw - gw) / 2, m + (lw - gw) / 2]) s += rect(a, glassLow, gw, glassTop - glassLow, "#15181b", 0, 'rx="0.35"') + rect(a + 0.12, glassLow + 0.15, gw - 0.24, glassTop - glassLow - 0.3, C.glass, 0, 'rx="0.3"') +
    rect(a + 0.18, glassTop - 1.4, gw - 0.36, 1.0, C.glassLight, 0, 'rx="0.2"');
  return s;
}
// Roof equipment: a rounded box from x, w long, h tall, on the roof at r.
const roofBox = (x, r, w, h, fill = "#55595e") => rect(x, r - 0.2, w, h + 0.2, fill, 0, `rx="0.35" stroke="rgba(0,0,0,0.45)" stroke-width="0.5" vector-effect="non-scaling-stroke"`) +
  line(x + 0.4, r + h - 0.25, x + w - 0.4, r + h - 0.25, "rgba(255,255,255,0.18)", 0.6);
// A class sign as the German regional trains carry them by the windows: a
// black plate edged in white, the class numeral at its top and the
// pictograms (no smoking, no food) small below.
const classPlate = (c, x, y0, y1, cls, { w = 0.62, fill = "#16181a", ink = "#ffffff" } = {}) =>
  rect(x - w / 2, y0, w, y1 - y0, fill, 0, `rx="0.06" stroke="${ink}" stroke-width="0.5" vector-effect="non-scaling-stroke"`) +
  letters(c, x, y1 - 0.62, 0.78, cls, ink, { weight: 700, family: NARROW }) +
  rect(x - w * 0.3, y0 + (y1 - y0) * 0.36, w * 0.6, 0.12, ink) + rect(x - w * 0.3, y0 + (y1 - y0) * 0.2, w * 0.6, 0.12, ink);
// Pictograms drawn in outline: a bicycle, a wheelchair user, h ft tall,
// centered at (x, y).
function bikeIcon(x, y, h, color, sw = 0.09) {
  const r = h * 0.3, s = `fill="none" stroke="${color}" stroke-width="${n(h * sw)}" stroke-linejoin="round" stroke-linecap="round"`;
  return `<g transform="translate(${n(x)} ${n(y)})"><circle cx="${n(-h * 0.5)}" cy="${n(-h * 0.2)}" r="${n(r)}" ${s}/><circle cx="${n(h * 0.5)}" cy="${n(-h * 0.2)}" r="${n(r)}" ${s}/>` +
    `<path d="M${n(-h * 0.5)} ${n(-h * 0.2)}L${n(-h * 0.18)} ${n(h * 0.28)}L${n(h * 0.3)} ${n(h * 0.28)}L${n(h * 0.5)} ${n(-h * 0.2)}M${n(-h * 0.18)} ${n(h * 0.28)}L${n(h * 0.02)} ${n(-h * 0.2)}L${n(h * 0.3)} ${n(h * 0.28)}M${n(-h * 0.06)} ${n(h * 0.42)}L${n(h * 0.1)} ${n(h * 0.42)}M${n(h * 0.3)} ${n(h * 0.28)}L${n(h * 0.25)} ${n(h * 0.45)}L${n(h * 0.42)} ${n(h * 0.45)}" ${s}/></g>`;
}
function chairIcon(x, y, h, color, sw = 0.09) {
  const s = `fill="none" stroke="${color}" stroke-width="${n(h * sw)}" stroke-linejoin="round" stroke-linecap="round"`;
  return `<g transform="translate(${n(x)} ${n(y)})"><circle cx="${n(-h * 0.02)}" cy="${n(h * 0.42)}" r="${n(h * 0.08)}" fill="${color}"/>` +
    `<path d="M${n(-h * 0.05)} ${n(h * 0.28)}L${n(-h * 0.08)} ${n(-h * 0.02)}L${n(h * 0.2)} ${n(-h * 0.02)}L${n(h * 0.3)} ${n(-h * 0.42)}" ${s}/>` +
    `<path d="M${n(-h * 0.2)} ${n(h * 0.12)}A${n(h * 0.3)} ${n(h * 0.3)} 0 1 0 ${n(h * 0.22)} ${n(-h * 0.28)}" ${s}/></g>`;
}

// ===================== Stadler FLIRT 3 (Germany) =====================
// The German FLIRT 3 (Stadler, 2016 on), from Stadler's data sheet for
// Baden-Württemberg's units (FSFBW0918d: three cars 58.6 m and five cars
// 90.8 m over the couplers, 4.12 m tall, the low floor 600 mm and the high
// floor 1145 mm, a 1.3 m door a side on each car, 2.7 m truck wheelbases)
// and its side drawing: end cars 21.3 m, the cars between 16.0 m, all on
// Jakobs trucks but the motor truck under each cab. The upright nose with
// the windshield raked back in a black mask over a chin; the cab's side
// window and the driver's door behind it; the first windows over the motor
// truck set higher (the high floor), the rest lower. The same body for the
// four- and six-car units (74.2 and 106.7 m) and Arverio Bayern's and the
// BRB's units.
const F3 = { end: 69.9, mid: 52.3, roof: 12.0, cab: 13.45, low: 1.42, door: [1.87, 9.74], hi: [6.2, 9.18], lo: [4.54, 8.0] };
// The nose seen from the side (Stadler's drawing), from the roof down.
const F3_NOSE = [[9.8, 13.45], [8.3, 13.3], [7.35, 12.85], [6.2, 12.15], [5.27, 11.4], [4.5, 10.45], [3.88, 9.32], [3.3, 8.4], [2.84, 7.6], [2.52, 6.6], [2.43, 5.86], [2.47, 4.9], [2.55, 3.4], [2.7, 2.4]];
// Window layouts per car (Stadler's drawing): [x0, x1, "hi"|"lo"], the
// door's left edge; the end car's layout with the cab at the left. "A"
// and "B" are a unit's two end cars, "m1" the middle car of the
// three-car units (its door near one end, the toilet beyond), "m2" the
// other middle cars (the door nearer the other end).
const F3_LAY = {
  A: { wins: [[21.0, 25.4, "hi"], [27.0, 31.4, "hi"], [33.3, 37.9, "lo"], [39.2, 43.7, "lo"], [45.1, 49.6, "lo"], [56.8, 61.3, "lo"], [62.5, 67.0, "hi"]], door: 50.9 },
  B: { wins: [[21.0, 25.5, "hi"], [27.0, 31.6, "hi"], [33.5, 38.1, "lo"], [39.3, 43.9, "hi"], [45.1, 49.7, "lo"], [56.8, 61.4, "lo"], [62.75, 67.05, "hi"]], door: 50.9 },
  m1: { wins: [[3.65, 8.1, "hi"], [8.9, 13.3, "lo"], [29.6, 31.8, "lo"], [32.97, 37.6, "lo"], [38.9, 43.5, "lo"], [44.7, 49.2, "hi"]], door: 14.6 },
  m2: { wins: [[3.6, 8.0, "hi"], [9.4, 13.9, "lo"], [15.4, 19.9, "lo"], [21.2, 25.8, "lo"], [27.1, 31.6, "lo"], [38.9, 43.3, "lo"], [44.9, 49.0, "hi"]], door: 32.9 },
};
// An end car's outline (the cab at the left): the nose, the roof's fairing
// over the cab back to 21 ft, the roof; the underside over the motor truck
// higher than the low floor's, rising over the Jakobs truck at the far end.
function f3CabD(L) {
  return outline([["s", [2.7, 2.4], [3.6, 2.02], [5.0, 2.0]], [12.0, 2.0], ["s", [12.0, 2.0], [12.5, 3.0], [13.3, 3.4]], [23.4, 3.4], ["s", [23.4, 3.4], [24.2, 3.0], [24.6, 2.0]], [25.4, 2.0], [26.0, F3.low], [L - 8.6, F3.low], ["s", [L - 8.6, F3.low], [L - 6.0, 2.1], [L - 4.6, 2.75]], [L - 0.3, 2.75],
    [L - 0.3, F3.roof - 0.35], ["s", [L - 0.3, F3.roof - 0.35], [L - 0.5, F3.roof - 0.05], [L - 0.9, F3.roof]], [21.2, F3.roof],
    ["s", [21.2, F3.roof], [20.7, 12.75], [17.0, 13.3], [12.0, 13.45], ...F3_NOSE.slice(0, -1)], ["s", [2.55, 3.4], [2.58, 2.8], [2.7, 2.4]]]);
}
function f3MidD(L) {
  return outline([[0.3, 2.75], [4.6, 2.75], ["s", [4.6, 2.75], [6.0, 2.1], [8.6, F3.low]], [L - 8.6, F3.low], ["s", [L - 8.6, F3.low], [L - 6.0, 2.1], [L - 4.6, 2.75]], [L - 0.3, 2.75],
    [L - 0.3, F3.roof - 0.35], ["s", [L - 0.3, F3.roof - 0.35], [L - 0.5, F3.roof - 0.05], [L - 0.9, F3.roof]], [0.9, F3.roof], ["s", [0.9, F3.roof], [0.5, F3.roof - 0.05], [0.3, F3.roof - 0.35]]]);
}
// k: the paint (FLIRT3_PAINT); part "A", "B", "m1", "m2"; first: first
// class behind the cab; pan: a pantograph (true up, false down) near the
// end car's inner end.
function flirt3(c, part, k, { first = false, pan = null } = {}) {
  const L = c.L, cab = part === "A" || part === "B", lay = F3_LAY[part];
  const wins = lay.wins.map(([a, b, h]) => [a, b, ...F3[h], 0.5]);
  const doors = [{ x: lay.door, w: 4.6, y0: F3.door[0], y1: F3.door[1] }];
  const info = { L, cab, lay, first, part };
  return sec(c, {
    d: cab ? f3CabD(L) : f3MidD(L), base: k.base, cab, truckTop: 2.75,
    trucks: [...(cab ? [[17.9, 8.86, 34]] : [[0, 8.86, 30]]), [L, 8.86, 30]],
    paint: (cc) => k.paint(cc, info) + (cab ? f3Cab(cc, k, info) : ""),
    wins, winEdge: k.winEdge, frame: k.frame, over: (cc) => k.marks(cc, info),
    doors, door: (cc, d) => plugDoor(d, k.door),
    under: () => (cab ? path(poly([[6.4, 2.0], [9.4, 2.0], [9.2, 1.0], [6.9, 0.85]]), "#2a2d31") + rect(27.0, 0.75, 14.0, 0.75, "#3a3e44", 0.3) + rect(43.0, 0.85, 6.0, 0.65, "#3a3e44", 0.3)
      : rect(16.0, 0.75, 11.0, 0.7, "#3a3e44", 0.3)),
    roof: () => {
      const R = F3.roof;
      let s = cab ? roofBox(22.0, R, 15.0, 1.1, k.roofKit) + roofBox(38.5, R, 9.0, 1.0, k.roofKit) + roofBox(L - 17.5, R, 6.0, 0.9, k.roofKit)
        : roofBox(5.0, R, 13.0, 1.0, k.roofKit) + roofBox(22.0, R, 8.0, 0.8, k.roofKit) + roofBox(34.0, R, 13.0, 1.0, k.roofKit);
      if (cab && pan != null) s += pantograph(L - 7.0, R + 0.5, { up: pan, facing: -1 });
      return s;
    },
    extra: (cc) => (cab ? coupler(3.0, 2.7) + lamp(2.45, 5.25, 0.42, 0.55) + lamp(2.5, 4.6, 0.36, 0.42, RED_LAMP) + wiper(3.2, 8.2, 3.9, 9.6) : ""),
    gangway: [1.9, 11.6],
  });
}
// The cab's own parts over the paint: the windshield's black mask along
// the nose, its glass, the cab's side window, the driver's door.
function f3Cab(c, k, info) {
  const mask = [[2.7, 6.7], [3.1, 8.1], [3.75, 9.25], [4.5, 10.35], [5.4, 11.5], [6.5, 12.4], [7.8, 13.05], [9.4, 13.4], [9.2, 12.5], [7.6, 12.0], [6.4, 11.1], [5.5, 9.9], [4.8, 8.6], [4.25, 7.2], [4.0, 6.7]];
  const glassPts = [[3.05, 7.3], [3.5, 8.5], [4.2, 9.6], [5.1, 10.75], [6.2, 11.75], [7.5, 12.45], [7.3, 11.7], [6.2, 10.9], [5.4, 9.8], [4.8, 8.6], [4.35, 7.3]];
  let s = path(poly(mask), k.mask || "#1b1d20") + path(poly(glassPts), C.glass);
  // The side window: its front edge slanted with the windshield.
  s += path(poly([[5.0, 8.1], [6.25, 10.55], [8.39, 10.75], [8.04, 8.1]]), "#16181a") + path(poly([[5.25, 8.3], [6.4, 10.35], [8.2, 10.53], [7.88, 8.3]]), C.glass);
  // The driver's door: its outline, a narrow window high in it, handrails.
  s += rect(9.2, 4.6, 2.65, 5.9, "none", 0, 'rx="0.3" stroke="rgba(0,0,0,0.45)" stroke-width="0.6" vector-effect="non-scaling-stroke"') +
    rect(9.8, 8.2, 1.3, 2.0, "#16181a", 0, 'rx="0.3"') + rect(9.92, 8.3, 1.06, 1.8, C.glass, 0, 'rx="0.25"') +
    line(8.9, 4.9, 8.9, 9.4, "rgba(0,0,0,0.5)", 0.8) + line(12.15, 4.9, 12.15, 9.4, "rgba(0,0,0,0.5)", 0.8);
  return s;
}
const FLIRT3_PAINT = {};
// bwegt (Baden-Württemberg's state trains, Arverio's units; photographs of
// ET 3.08 at Geislingen 2021, ET 5.06 2020, ET 6.10 at Stuttgart Hbf 2024,
// ET 5.18 2025): white; the windows in a black band, its lower edge higher
// under the high-floor windows behind the cab; a white line over it, then
// yellow over the roof's edge the whole length; the cab yellow back over
// the side window to the roof's fairing (yellow too), a white band low on
// the nose over the dark skirt; yellow doors; the class plates by the
// windows; the big gray lion behind the driver's door; bwegt's mark under
// the cab's side window and on the side; a yellow bicycle by the doors;
// first class (nine seats behind one cab) marked by a short yellow bar
// over its windows.
const BW = { white: "#f1f1ed", yellow: "#fdcd0f", black: "#1f2123", ink: "#2f363b", skirt: "#3b3e41", lion: "#c6c9cb", roof: "#5d6166" };
FLIRT3_PAINT.bwegt = {
  base: BW.white, door: BW.yellow, roofKit: "#4c5055", winEdge: "#0e0f10",
  paint: (c, { L, cab, lay, first }) => {
    let s = rect(-1, 0, L + 2, 20, BW.white);
    // The black band (raised under the cab end's high windows).
    if (cab) s += rect(20.3, 5.77, 12.6, 10.42 - 5.77, BW.black) + rect(32.9, 3.96, L - 31.9, 10.42 - 3.96, BW.black);
    else s += rect(-1, 3.96, L + 2, 10.42 - 3.96, BW.black);
    s += rect(-1, 10.93, L + 2, 10, BW.yellow);
    if (cab && first) s += rect(21.0, 10.55, 10.4, 0.26, BW.yellow);
    // The skirt: higher under the cab's raised floor.
    s += rect(-1, 0, L + 2, 2.45, BW.skirt) + (cab ? rect(-1, 0, 20.3, 3.85, BW.skirt) : "");
    if (cab) {
      s += path(outline([[-1, 4.9], [4.35, 4.9], ["s", [4.35, 4.9], [4.6, 7.0], [5.4, 9.3], [6.9, 10.95], [8.9, 11.6]], [9.0, 16], [-1, 16]]), BW.yellow);
      s += rect(-1, 3.95, 10.0, 0.95, BW.white) + rect(-1, 0, 9.0, 3.95, BW.skirt);
    }
    return s;
  },
  marks: (c, { L, cab, lay, part }) => {
    let s = "";
    if (cab) {
      s += bwLion(12.6, 6.55, 3.4, BW.lion, 0.78) + bwegtLogo(c, 7.0, 6.25, 0.82, { bw: BW.ink }) + bwegtLogo(c, 26.6, 4.85, 1.65, { bw: BW.ink });
      s += classPlate(c, 26.2, 6.45, 9.0, "1") + classPlate(c, lay.door - 0.75, 5.0, 7.6, "2") + bikeIcon(lay.door - 4.6, 3.2, 1.55, "#e0b400");
      s += bwegtLogo(c, 64.6, 5.0, 0.95, { bw: "#ffffff", tag: false });
    } else {
      const far = lay.door > 20;
      s += classPlate(c, lay.door - 0.75, 5.0, 7.6, "2") + classPlate(c, lay.door + 5.35, 5.0, 7.6, "2") + bwegtLogo(c, 6.0, 5.0, 0.95, { bw: "#ffffff", tag: false });
      s += far ? bikeIcon(lay.door - 4.6, 3.2, 1.55, "#e0b400") : chairIcon(lay.door + 7.2, 3.2, 1.5, "#e0b400");
    }
    return s;
  },
};
// Arverio Bayern (E-Netz Allgäu, ET 4.24-4.45; photographs of ET 4.27 at
// Lindau-Insel 2022 broadside, ET 4.30 at Geltendorf 2022, ET 4.26 at
// Lindau 2026): sky blue all over, cab and roof fairing too; on each car
// a light gray wave rising from a thin tip into the door, which is light
// gray, and breaking in a short curl beyond it; the windows each in a
// black frame; white class numerals by the windows, a yellow bar over
// first class behind one cab; a white bicycle over the doors; ARVERIO
// BAYERN in white high behind the driver's door (Go-Ahead's mark until
// 2024-2025), the bwegt and "Bahnland Bayern" marks low beside it.
const AB = { blue: "#1f93dc", wave: "#d4d8da", dark: "#16191c", roof: "#4a4f55" };
// The wave on a car: from its tip at xt to the door [xd0, xd1], the curl
// beyond; dir 1 when the door is to the right of the tip.
function abWave(xt, xd0, xd1, dir, fill = AB.wave) {
  const X = (x) => (dir > 0 ? x : xd0 + xd1 - x); // mirror about the door
  const a = dir > 0 ? xt : xd0 + xd1 - xt, span = xd0 - a;
  const top = [[a, 8.9], [a + span * 0.15, 7.3], [a + span * 0.35, 5.9], [a + span * 0.6, 5.6], [a + span * 0.84, 7.1], [xd0, 9.74]];
  const low = [[xd0, 2.4], [a + span * 0.75, 2.6], [a + span * 0.45, 3.35], [a + span * 0.25, 4.4], [a + span * 0.1, 6.6], [a + 0.5, 8.5]];
  const curl = [[xd1, 9.74], [xd1 + 2.6, 9.95], [xd1 + 4.8, 10.4], [xd1 + 3.2, 8.6], [xd1 + 1.2, 6.6], [xd1, 5.4]];
  const m = (pts) => pts.map(([x, y]) => [X(x), y]);
  return path(outline([["s", ...m(top)], ["s", ...m(low)]]), fill) + path(outline([["s", ...m(curl)]]), fill);
}
FLIRT3_PAINT.arvby = {
  base: AB.blue, door: AB.wave, roofKit: AB.roof, winEdge: "#0c0d0e", frame: 0.28,
  paint: (c, { L, cab, lay }) => {
    let s = rect(-1, 0, L + 2, 20, AB.blue);
    const d0 = lay.door, d1 = lay.door + 4.6;
    if (cab) s += abWave(17.2, d0, d1, 1);
    else if (d0 > L / 2) s += abWave(2.0, d0, d1, 1);
    else s += abWave(L - 2.0, d0, d1, -1);
    if (cab) s += rect(-1, 0, 9.0, 1.9, "#25292d");
    return s;
  },
  marks: (c, { L, cab, lay, first }) => {
    let s = "";
    const num = (x, cls) => letters(c, x, 8.1, 1.15, cls, "#ffffff", { weight: 600 });
    if (cab) {
      s += arverioLogo(c, 17.6, 10.15, 1.45, "#ffffff", { bayern: true, wave: "#ffffff" });
      s += bwegtLogo(c, 19.4, 6.2, 0.8, { bw: "#ffffff" }) + rect(14.0, 5.0, 3.7, 3.7, "none", 0, 'rx="0.5" stroke="rgba(0,0,0,0.3)" stroke-width="0.5" vector-effect="non-scaling-stroke"');
      s += letters(c, 15.0, 6.5, 0.36, "Bahnland", "#ffffff", { weight: 700, style: "italic" }) + letters(c, 15.0, 6.05, 0.36, "Bayern", "#ffffff", { weight: 700, style: "italic" }) +
        letters(c, 16.6, 6.5, 0.26, "Wir fahren", "#ffffff", { weight: 600 }) + letters(c, 16.6, 6.15, 0.26, "für das", "#ffffff", { weight: 600 });
      if (first) s += rect(21.6, 10.35, 7.4, 0.38, "#f2c418") + num(26.2, "1");
      s += num(lay.door - 1.0, "2") + num(lay.door + 6.0, "2");
    } else s += num(lay.door - 1.0, "2") + num(lay.door + 6.0, "2");
    s += bikeIcon(lay.door + 2.3, 10.55, 0.75, "#ffffff", 0.12);
    return s;
  },
};
// The BRB's Chiemgau-Inntal units (ex-Meridian, Transdev's; ET 301-329
// six cars, ET 351-357 three; photographs of ET 351 at München Hbf 2022,
// ET 307 2025, ET 321 2024), still in Meridian's paint with BRB's marks:
// light silver-gray, the windows in a blue band, blue along the bottom;
// at each car's joint a yellow slash down across the side and blue slashes
// in the gray over it; the cab blue, a dark gray panel round its side
// window and the driver's door, cut off behind by a light sweep falling
// from the roof to the lamps; yellow doors; white class numerals by the
// doors; BRB's mark and "Wir sind transdev" behind the cab, the network's
// name ("Chiemgau-Inntal") by the first door.
const MER = { silver: "#e3e6e8", blue: "#2f5cc2", deep: "#26489c", dark: "#3b3f45", yellow: "#f3d21c" };
// The BRB's mark: "BRB" bold over a red line fading out, "Bayerische
// Regiobahn" beside it; "Wir sind transdev" under it (sub).
function brbLogo(c, x, y, h, color, { sub = true, red = "#e3001b" } = {}) {
  const id = newId();
  return mark(c, x, y, `<defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${red}"/><stop offset="1" stop-color="${red}" stop-opacity="0.1"/></linearGradient></defs>` +
    txt(-h * 1.75, 0, h, "BRB", color, { weight: 800, anchor: "start", extra: `textLength="${n(h * 1.75)}" lengthAdjust="spacingAndGlyphs"` }) +
    txt(h * 0.15, -h * 0.2, h * 0.36, "Bayerische", color, { weight: 500, anchor: "start" }) + txt(h * 0.15, h * 0.22, h * 0.36, "Regiobahn", color, { weight: 500, anchor: "start" }) +
    `<rect x="${n(-h * 1.75)}" y="${n(h * 0.5)}" width="${n(h * 3.6)}" height="${n(h * 0.08)}" fill="url(#${id})"/>` +
    (sub ? txt(-h * 1.75, h * 0.95, h * 0.3, "Wir sind", color, { weight: 500, anchor: "start" }) + txt(-h * 0.5, h * 0.95, h * 0.34, "transdev", red, { weight: 700, anchor: "start" }) : ""));
}
// Transdev's figure (the "flying t": a running figure in a ring that fades
// out at its foot), from Transdev's logo file (Transdev GmbH logo.svg on
// Wikimedia Commons). Paths in a 172 x 138 box, y down; h ft tall, centered
// at (x, y).
const TD_FIG = "M171.6 29.2C171.3 27.4 169.5 26.1 165.3 26.6C139.3 29.9 124.6 32.2 71.6 38C67.3 38.5 63.6 39.1 63.2 42C62.6 46.8 74.9 47.1 83.5 49.1C87.8 50.1 92.3 51.3 96.3 53.3C99.2 54.8 98.2 57 97.5 58C87.5 72.6 73.9 93.3 70.1 100.8C66.3 108.2 72.7 111.9 79 106.3C93.9 93.1 98.5 87.1 111.8 76.7C113.7 75.2 115.1 75.5 115.6 77.7C115.8 78.9 116.1 80.5 116.4 82.3C116.7 84.4 116.7 88 116.4 90.5C116.4 90.6 116.3 90.7 116.3 90.8C116.3 91.4 116.2 92.2 116.1 93.2C114.4 108.3 105.1 124.1 95.1 133.5C104.7 130.1 113.5 124.5 120.5 117L120.6 116.9C122.1 115.4 123.5 113.7 124.9 111.7C130.6 104 134.7 94.8 136.6 84C137.1 81.7 137.4 79.4 137.6 77C139.7 55.4 148.6 47.7 167.2 36.2C170 34.4 172.1 31.8 171.6 29.2ZM131.5 22.6C136.8 19.7 138.8 13 135.9 7.7C133 2.4 126.3 0.4 121 3.3C115.7 6.2 113.7 12.9 116.6 18.2C119.5 23.5 126.1 25.5 131.5 22.6Z";
const TD_ARC = "M6.1 58C-0.2 93.1 21.9 126.7 56.1 135.2C57.5 135.6 59 135.9 60.5 136.2C72.2 138.3 84.2 137.3 95.1 133.5C105.1 124.1 114.4 108.3 116.1 93.2C116.2 92.2 116.3 91.4 116.3 90.8C115.8 94.9 114.4 102.1 108.9 109.3C104.7 114.9 99 120.1 90.2 123.6C81.8 126.8 72.3 127.8 62.3 126C60.5 125.6 58.7 125.2 57 124.7C29.1 116.9 11.1 88.9 16.3 59.8C21.9 28.9 51.5 8.2 82.5 13.8L82.5 13.8C85.3 14.3 88 12.4 88.5 9.6C89 6.8 87.1 4.1 84.3 3.6C80.3 2.8 76.3 2.5 72.3 2.5C40.3 2.5 11.9 25.4 6.1 58Z";
function transdevFigure(c, x, y, h, color = "#e2001a") {
  const k = h / 138, id = newId();
  return mark(c, x, y, `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="60" y2="138"><stop offset="0" stop-color="${color}"/><stop offset="0.65" stop-color="${color}" stop-opacity="0.75"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>` +
    `<g transform="scale(${n(k * 10000) / 10000}) translate(-86 -69)"><path d="${TD_ARC}" fill="url(#${id})"/><path d="${TD_FIG}" fill="${color}"/></g>`);
}
// The yellow and blue slashes at a joint at x (drawn on both cars, clipped).
const merSlash = (x) => path(poly([[x - 5.2, 12.2], [x - 3.2, 12.2], [x + 4.6, 2.4], [x + 2.6, 2.4]]), MER.yellow) +
  path(poly([[x - 1.6, 12.2], [x + 0.6, 12.2], [x + 2.2, 10.2], [x + 0.0, 10.2]]), MER.blue) + path(poly([[x + 1.6, 12.2], [x + 3.0, 12.2], [x + 4.6, 10.2], [x + 3.2, 10.2]]), MER.blue);
FLIRT3_PAINT.meridian = {
  base: MER.silver, door: MER.yellow, roofKit: "#4a4f55", winEdge: "#0d0e10",
  paint: (c, { L, cab }) => {
    let s = rect(-1, 0, L + 2, 20, MER.silver) + rect(-1, 4.2, L + 2, 10.15 - 4.2, MER.blue) + rect(-1, 0, L + 2, 2.55, MER.blue) + rect(-1, 0, L + 2, 1.7, MER.deep);
    s += (cab ? "" : merSlash(0)) + merSlash(L);
    if (cab) {
      // The light sweep from the roof behind the cab down to the lamps;
      // the dark panel in front of it, the blue fairing and nose round it.
      s += rect(-1, 0, 23, 20, MER.blue);
      s += path(outline([["s", [23.5, 12.3], [21.5, 11.2], [16.0, 9.1], [11.5, 7.0], [7.0, 5.1], [3.0, 4.4], [1.5, 4.35]], [1.5, 5.6], ["s", [3.0, 5.6], [7.0, 6.2], [11.5, 8.1], [16.0, 10.2], [19.5, 11.6], [21.5, 12.3]]]), MER.silver);
      s += path(outline([["s", [21.4, 12.3], [19.4, 11.65], [16.0, 10.25], [11.5, 8.15], [7.0, 6.25], [3.0, 5.65], [2.0, 5.65]], [2.0, 12.3]]), MER.dark) + rect(-1, 11.45, 22, 5, MER.blue);
    }
    return s;
  },
  marks: (c, { L, cab, lay, first }) => {
    const num = (x, cls) => letters(c, x, 8.6, 1.2, cls, "#ffffff", { weight: 600 });
    let s = num(lay.door - 1.0, cab && first ? "1" : "2");
    if (cab) s += brbLogo(c, 30.5, 7.0, 0.9, "#ffffff") + letters(c, 44.0, 5.0, 0.55, "Chiemgau-Inntal", "#ffffff", { weight: 700, style: "italic" });
    return s;
  },
};
// The BRB's own paint (2016 on: its LINTs, the Oberland's LINT 54s and the
// FLIRT 3s ET 359-360 of the RB 53 Traunstein-Ruhpolding; photographs of
// ET 359 at Traunstein and Ruhpolding 2024): white, red doors, a dark
// skirt; the cab's face framed in deep blue, the blue carried back round
// the cab side over the roof's fairing and low along the nose; BRB's mark
// and "Wir sind transdev" on the cab side.
const BRBC = { white: "#f2f3f4", blue: "#1f2f8f", red: "#d3122a", skirt: "#2f3338", gray: "#8d939a" };
FLIRT3_PAINT.brb = {
  base: BRBC.white, door: BRBC.red, roofKit: "#4a4f55", winEdge: "#0d0e10", frame: 0.22,
  paint: (c, { L, cab }) => {
    let s = rect(-1, 0, L + 2, 20, BRBC.white) + rect(-1, 0, L + 2, 2.5, BRBC.skirt);
    if (cab) s += path(outline([[-1, 16], [21.2, 16], [21.2, 11.9], ["s", [21.2, 11.9], [12.0, 11.7], [8.0, 10.9], [5.4, 8.6], [4.6, 5.8], [4.8, 4.0]], [5.2, 2.5], [-1, 2.5]]), BRBC.blue) +
      path(outline([["s", [3.9, 4.9], [4.0, 6.0]], [2.0, 6.0], [2.0, 4.9]]), BRBC.white);
    return s;
  },
  marks: (c, { cab }) => (cab ? brbLogo(c, 13.6, 6.6, 0.9, BRBC.blue) : ""),
};

// ===================== A generic multiple-unit car =====================
// S: the car's shape (cab at the left, or none): L, roof, nose (points
// from the roof down to the nose's foot, smooth), bottom (the underside
// from the nose's foot or the left end, points), wins ([x0, x1, y0, y1]),
// doors ([x, w]), doorY ([y0, y1]), trucks ([x, wb, d(in)]), truckTop,
// cabWin (points), crew ([x, w, y0, y1]: the driver's door), mask (the
// windshield's surround, points), glass (the windshield, points), roofKit
// ([x, w, h]), pan (x), lamps ([x, y]), coupler (y), gangway ([floor,
// top]). k: the paint: base, door, paint(c, info), marks(c, info), frame,
// winEdge, maskFill, roofKit. info: { L, cab, S, first, part }.
function emuCar(c, S, k, { first = false, pan = null, part = "" } = {}) {
  const L = c.L, cab = !!S.nose, R = S.roof, info = { L, cab, S, first, part };
  const bottom = typeof S.bottom === "function" ? S.bottom(L) : S.bottom;
  const yOf = (p, last) => (p[0] === "s" ? p[last ? p.length - 1 : 1][1] : p[1]);
  const d = outline([...(cab ? [] : [[0.3, yOf(bottom[0], false)]]), ...bottom, [L - 0.3, yOf(bottom[bottom.length - 1], true)], [L - 0.3, R - 0.4],
    ["s", [L - 0.3, R - 0.4], [L - 0.5, R - 0.06], [L - 0.95, R]], ...(cab ? [["s", ...(S.top || []), ...S.nose]] : [[0.95, R], ["s", [0.95, R], [0.5, R - 0.06], [0.3, R - 0.4]]])]);
  const wins = (typeof S.wins === "function" ? S.wins(L) : S.wins).map(([a, b, y0, y1, r = 0.5]) => [a, b, y0, y1, r]);
  const doorList = typeof S.doors === "function" ? S.doors(L) : S.doors;
  return sec(c, {
    d, base: k.base, cab, truckTop: S.truckTop ?? 2.9, trucks: typeof S.trucks === "function" ? S.trucks(L) : S.trucks,
    paint: (cc) => {
      let s = k.paint(cc, info);
      if (cab) {
        if (S.mask) s += path(outline([["s", ...S.mask]]), k.maskFill || "#1b1d20");
        if (S.glass) s += path(outline([["s", ...S.glass]]), C.glass);
        if (S.cabWin) s += path(poly(S.cabWin), "#16181a") + path(poly(S.cabWin.map(([x, y], i, a) => [x + (x < a.reduce((m, p) => m + p[0], 0) / a.length ? 0.22 : -0.22), y + (y < a.reduce((m, p) => m + p[1], 0) / a.length ? 0.22 : -0.22)])), C.glass);
        if (S.crew) {
          const [x, w, y0, y1] = S.crew;
          s += rect(x, y0, w, y1 - y0, "none", 0, 'rx="0.3" stroke="rgba(0,0,0,0.45)" stroke-width="0.6" vector-effect="non-scaling-stroke"') +
            rect(x + w * 0.25, y1 - 2.6, w * 0.5, 2.1, "#16181a", 0, 'rx="0.3"') + rect(x + w * 0.25 + 0.1, y1 - 2.5, w * 0.5 - 0.2, 1.9, C.glass, 0, 'rx="0.25"');
        }
      }
      return s;
    },
    wins, winEdge: k.winEdge, frame: k.frame, over: (cc) => k.marks(cc, info),
    doors: doorList.map(([x, w]) => ({ x, w, y0: S.doorY[0], y1: S.doorY[1] })), door: (cc, dd) => plugDoor(dd, k.door, S.doorGlass || {}),
    under: () => (S.under ? S.under(L) : ""),
    roof: () => (S.roofKit || []).map(([x, w, h]) => roofBox(x < 0 ? L + x : x, R, w, h, k.roofKit || "#4c5055")).join("") +
      (pan != null && S.pan != null ? pantograph(S.pan < 0 ? L + S.pan : S.pan, R + 0.45, { up: pan, facing: -1 }) : ""),
    extra: () => (cab ? coupler(S.coupler ?? 3.0, S.reach ?? 2.0) + (S.lamps || []).map(([x, y, red]) => lamp(x, y, 0.45, red ? 0.36 : 0.5, red ? RED_LAMP : undefined)).join("") : ""),
    gangway: S.gangway || [2.0, R - 0.6],
  });
}

// ===================== Siemens Mireo =====================
// Siemens's Mireo (2019 on; de.wikipedia "Siemens Mireo"): three cars 69.86
// m over the couplers (end cars 25.0 m, the middle 20.0 m), 4.21 m tall,
// on Jakobs trucks between the cars and a motor truck under each cab; the
// long, deep-chinned nose; the Mireo Plus B (battery) two cars, 46.56 m
// (Siemens's data sheet for the Ortenau units, MORS-B10022-00, and its
// side drawing). The 760 mm-platform version of Arverio Bayern and agilis
// has one double door a side on each car (photographs of 2463 008 at
// Augsburg 2024, 1463 219 at Plattling 2025).
const MI_NOSE = [[8.4, 13.3], [6.2, 13.05], [4.6, 12.4], [3.4, 11.2], [2.5, 9.7], [1.75, 8.3], [1.25, 6.8], [0.95, 5.3], [1.0, 4.0], [1.35, 2.9], [1.9, 2.3]];
const MI = {
  roof: 13.3, doorY: [2.45, 10.4], truckTop: 2.6, coupler: 2.95, reach: 1.6, lamps: [[1.05, 4.75], [1.1, 4.15, true]],
  mask: [[1.5, 7.6], [2.3, 9.6], [3.4, 11.3], [4.8, 12.5], [6.5, 13.1], [8.4, 13.3], [8.2, 12.3], [6.6, 11.7], [5.2, 10.4], [4.3, 8.8], [3.6, 7.5], [2.5, 7.1]],
  glass: [[2.1, 8.2], [2.85, 9.8], [3.9, 11.2], [5.3, 12.3], [6.9, 12.85], [6.8, 12.1], [5.5, 11.2], [4.6, 9.8], [3.9, 8.3]],
  cabWin: [[9.0, 8.4], [9.2, 10.6], [11.9, 10.9], [11.9, 8.4]],
};
// The end car of the 760 mm units (cab at the left): the driver's door
// behind the cab window, three windows, the door, six windows to the
// Jakobs truck.
const MIREO_END = {
  ...MI, nose: MI_NOSE, crew: [12.6, 2.6, 4.0, 10.8],
  bottom: (L) => [[1.9, 2.3], [8.6, 2.3], ["s", [8.6, 2.3], [9.3, 3.3], [10.2, 3.5]], [16.6, 3.5], ["s", [16.6, 3.5], [17.4, 3.2], [17.8, 2.3]], [L - 9.2, 2.3], ["s", [L - 9.2, 2.3], [L - 6.4, 2.6], [L - 4.8, 3.0]]],
  wins: (L) => [[16.6, 21.6, 6.0, 10.3], [22.9, 27.9, 6.0, 10.3], [29.2, 34.2, 6.0, 10.3], ...[0, 1, 2, 3, 4, 5].map((i) => [42.6 + i * 6.3, 47.6 + i * 6.3, 6.0, 10.3]).filter(([, b]) => b < L - 3.0)],
  doors: [[36.0, 4.6]], trucks: [[13.0, 7.55, 34], [82.0, 7.55, 30]].map(([x, wb, dd]) => [x, wb, dd]),
  roofKit: [[10.4, 8.0, 0.8], [20.0, 16.0, 1.1], [-26.0, 12.0, 0.9]], pan: -10.0,
};
MIREO_END.trucks = (L) => [[13.0, 7.55, 34], [L, 7.55, 30]];
const MIREO_MID = {
  ...MI, nose: null,
  bottom: (L) => [["s", [0.3, 3.0], [1.9, 2.6], [4.8, 2.3]], [L - 4.8, 2.3], ["s", [L - 4.8, 2.3], [L - 1.9, 2.6], [L - 0.3, 3.0]]],
  wins: (L) => [[3.6, 8.6], [9.9, 14.9], [16.2, 21.2], [22.5, 27.5], [L - 27.5, L - 22.5], [L - 21.2, L - 16.2], [L - 14.9, L - 9.9], [L - 8.6, L - 3.6]].map(([a, b]) => [a, b, 6.0, 10.3]),
  doors: (L) => [[L / 2 - 2.3, 4.6]], trucks: (L) => [[0, 7.55, 30], [L, 7.55, 30]], roofKit: [[4.0, 14.0, 1.0], [-18.0, 14.0, 1.0]], pan: 33.0,
};
const MIREO_PAINT = {};
// Arverio Bayern (Augsburger Netze; photographs of 2463 008 at Augsburg
// 2024, 2463 0xx at Diedorf 2026, Augsburg Hbf 2026): as their FLIRTs,
// sky blue with the light gray wave into each door, black-framed windows;
// ARVERIO BAYERN high behind the driver's door, the bwegt and Bahnland
// Bayern marks under it; a yellow bar over the first-class window
// behind one cab; the white bicycle over the door; a dark skirt.
MIREO_PAINT.arvby = {
  base: AB.blue, door: AB.wave, roofKit: AB.roof, winEdge: "#0c0d0e", frame: 0.28,
  paint: (c, { L, cab, S }) => {
    const [[x0, w]] = typeof S.doors === "function" ? S.doors(L) : S.doors;
    let s = rect(-1, 0, L + 2, 20, AB.blue) + rect(-1, 0, L + 2, 2.6, "#33373b");
    s += cab ? abWave(16.0, x0, x0 + w, 1) : abWave(2.0, x0, x0 + w, 1);
    return s;
  },
  marks: (c, { L, cab, S, first }) => {
    const [[x0, w]] = typeof S.doors === "function" ? S.doors(L) : S.doors;
    let s = bikeIcon(x0 + w / 2, 11.0, 0.8, "#ffffff", 0.12);
    if (cab) {
      s += arverioLogo(c, 23.0, 11.6, 1.75, "#ffffff", { bayern: true, wave: "#ffffff" }) + bwegtLogo(c, 27.0, 4.6, 0.75, { bw: "#ffffff" }) +
        letters(c, 31.6, 4.85, 0.32, "Bahnland", "#ffffff", { weight: 700, style: "italic" }) + letters(c, 31.6, 4.45, 0.32, "Bayern", "#ffffff", { weight: 700, style: "italic" });
      if (first) s += rect(29.6, 10.45, 5.6, 0.36, "#f2c418");
    }
    return s;
  },
};

// A single car with a cab at each end: drawn with its cab at the left,
// that left half again mirrored for the right.
function bothEnds(c, draw) {
  const L = c.L, a = newId(), b = newId();
  return `<clipPath id="${a}"><rect x="-3" y="-2" width="${n(L / 2 + 3)}" height="24"/></clipPath><g clip-path="url(#${a})">${draw(c)}</g>` +
    `<g transform="matrix(-1 0 0 1 ${n(L)} 0)"><clipPath id="${b}"><rect x="-3" y="-2" width="${n(L / 2 + 3.02)}" height="24"/></clipPath><g clip-path="url(#${b})">${draw({ ...c, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: c.coupledL })}</g></g>`;
}
// A field of small triangles (vlexx's and VIAS's mesh), thinning out from
// x0 to x1 (dir 1) between y0 and y1.
function triMesh(x0, x1, y0, y1, color, { size = 0.9, line = false } = {}) {
  let d = "";
  const rows = Math.round((y1 - y0) / size);
  for (let r = 0; r < rows; r++) {
    const y = y0 + r * size;
    for (let x = x0, k = 0; x < x1; x += size, k++) {
      const t = (x - x0) / (x1 - x0);
      // A fixed pseudo-random pattern, so every drawing of a car is alike.
      const h = Math.abs(Math.sin(r * 12.9898 + k * 78.233) * 43758.5453) % 1;
      if (h < t * 1.15) continue;
      const up = (r + k) % 2 === 0;
      d += up ? `M${n(x)} ${n(y)}L${n(x + size)} ${n(y)}L${n(x + size / 2)} ${n(y + size)}Z` : `M${n(x)} ${n(y + size)}L${n(x + size)} ${n(y + size)}L${n(x + size / 2)} ${n(y)}Z`;
    }
  }
  return line ? `<path d="${d}" fill="none" stroke="${color}" stroke-width="0.5" vector-effect="non-scaling-stroke"/>` : `<path d="${d}" fill="${color}"/>`;
}

// ===================== Stadler Regio-Shuttle RS1 =====================
// One car of 25.5 m with a cab at each end, 4.09 m tall (de.wikipedia
// "Stadler Regio-Shuttle RS 1"); the low floor between the motor trucks,
// a double door a side by each end's high floor; the engines under the
// floor at the ends. The geometry as czechia.cars.js measured it.
const RS1_NOSE = [[6.4, 13.1], [5.0, 12.95], [4.0, 12.2], [3.1, 10.4], [2.2, 8.6], [1.4, 7.7], [1.05, 6.4], [1.0, 5.0], [1.1, 3.6]];
const RS1 = {
  roof: 13.1, nose: RS1_NOSE, doorY: [2.1, 10.3], truckTop: 3.6, coupler: 3.1, reach: 1.2, lamps: [[1.0, 5.1], [1.05, 4.45, true]],
  mask: [[1.25, 7.0], [2.0, 8.5], [3.0, 10.3], [3.9, 12.0], [5.0, 12.75], [6.3, 12.85], [6.1, 12.1], [5.0, 11.8], [4.4, 10.4], [3.6, 8.5], [2.9, 7.2], [2.1, 6.9]],
  glass: [[1.9, 7.6], [2.7, 9.0], [3.5, 10.6], [4.3, 11.9], [5.3, 12.35], [5.1, 11.4], [4.3, 9.9], [3.6, 8.4], [3.0, 7.5]],
  cabWin: [[7.0, 6.6], [7.0, 10.4], [9.0, 10.4], [9.0, 6.6]],
  bottom: (L) => [[1.1, 3.6], [15.6, 3.6], ["s", [15.6, 3.6], [16.4, 2.4], [16.8, 2.0]], [L - 16.8, 2.0], ["s", [L - 16.8, 2.0], [L - 16.4, 2.4], [L - 15.6, 3.6]]],
  wins: (L) => [[23.6, 28.2], [29.4, 34.0], [35.2, 39.8], [L / 2 - 2.3, L / 2 + 2.3]].map(([a, b]) => [a, b, 6.3, 10.0, 0.45]),
  doors: [[17.6, 4.4]], trucks: (L) => [[8.4, 6.9, 30], [L - 8.4, 6.9, 30]],
  roofKit: [[10.0, 9.0, 0.7]], under: () => rect(11.0, 2.3, 4.4, 1.25, "#3a3e44", 0.3) + rect(20.6, 1.3, 9.0, 0.6, "#3a3e44", 0.3),
};
const rs1Car = (k) => (c) => bothEnds(c, (h) => emuCar(h, RS1, k) + exhaustBox(20.5, RS1.roof));
const exhaustBox = (x, roof) => rect(x, roof - 0.05, 2.6, 0.6, "#3c4045", 0.4, 'rx="0.2"') + rect(x + 0.7, roof + 0.55, 0.5, 0.5, "#2a2d31") + rect(x + 1.5, roof + 0.55, 0.5, 0.35, "#2a2d31");
const RS1_PAINT = {};
// agilis (Oberfranken; photographs of VT 650 734 at Ebermannstadt and 650
// 7xx at Hochstadt-Marktzeuln 2024): light silver, the ends graphite with
// a lime mask round the windshield, lime doors, lime birds flying forward
// on the cab sides, "agilis" in white there; a lime band low on the side.
const AG = { silver: "#d7dade", graphite: "#4c5156", lime: "#c5d92d", limeDark: "#a9bd1f", skirt: "#3a3e42" };
// agilis's mark: the bird (a lime swallow) and "agilis" in its round
// lowercase; birds: a flock of small birds as an arrow.
const agilisWord = (c, x, y, h, color) => letters(c, x, y, h, "agilis", color, { weight: 400, family: "Calibri, Carlito, Segoe UI, Helvetica Neue, Arial, sans-serif" });
function agBirds(x, y, w, h, color) {
  // An arrow of small birds pointing left (forward), x the arrow's tip.
  let s = "";
  for (let i = 0; i < 26; i++) {
    const u = ((i * 37) % 26) / 26, v = ((i * 11) % 13) / 13 - 0.5;
    const px = x + u * w, py = y + v * h * (0.25 + u * 0.75);
    s += `M${n(px)} ${n(py)}l0.32 0.12l0.06 -0.2l0.06 0.2l0.32 -0.12l-0.24 -0.12l-0.14 -0.04l-0.14 0.04z`;
  }
  return `<path d="${s}" fill="${color}"/>`;
}
RS1_PAINT.agilis = {
  base: AG.silver, door: AG.lime, maskFill: AG.lime, winEdge: "#0e0f10", frame: 0.18,
  paint: (c, { L }) => rect(-1, 0, L + 2, 20, AG.silver) + rect(-1, 11.9, L + 2, 3, "#b9bdc2") + rect(-1, 2.8, L + 2, 1.3, AG.lime) + rect(-1, 0, L + 2, 2.8, AG.skirt) +
    path(outline([[-1, 0], [14.6, 0], ["s", [14.6, 0], [15.0, 6.0], [14.2, 12.0], [12.5, 14.0]], [-1, 14]]), AG.graphite),
  marks: (c) => agBirds(9.5, 9.3, 4.8, 3.2, AG.lime) + agilisWord(c, 12.0, 5.3, 1.1, "#ffffff"),
};
// waldbahn (Die Länderbahn's Bavarian Forest lines; photographs of 650 653
// at Regen 2023 and at Spiegelau 2024): green, the front yellow-orange, an
// orange line low along the side; yellow-orange doors;
// the "Bahnland Bayern" mark on the cab side.
const WB = { green: "#2f9b3c", dark: "#1f6e2a", yellow: "#f2b51c", orange: "#ea7d1a" };
RS1_PAINT.waldbahn = {
  base: WB.green, door: WB.yellow, maskFill: "#1b1d20", winEdge: "#0e0f10",
  paint: (c, { L }) => rect(-1, 0, L + 2, 20, WB.green) + rect(-1, 3.4, L + 2, 0.5, WB.orange) + rect(-1, 0, L + 2, 3.4, "#3d4a3a") +
    path(outline([[-1, 3.4], [2.6, 3.4], ["s", [2.6, 3.4], [3.0, 7.0], [4.6, 11.0], [6.4, 13.2]], [-1, 14]]), WB.yellow),
  marks: (c, { L }) => letters(c, 12.0, 6.0, 0.7, "Bahnland Bayern", "#ffffff", { weight: 600, style: "italic" }),
};
// oberpfalzbahn (photographs of 650 665/666 at Cham 2022): yellow-orange,
// a green band along the bottom; "oberpfalzbahn" in green.
const OPB = { orange: "#f39a1e", green: "#3d9a2f", blue: "#1f2f6e", yellow: "#f6c412" };
RS1_PAINT.opb = {
  base: OPB.orange, door: OPB.orange, maskFill: "#1b1d20", winEdge: "#0e0f10",
  paint: (c, { L }) => rect(-1, 0, L + 2, 20, OPB.orange) + rect(-1, 0, L + 2, 4.7, OPB.green),
  marks: (c, { L }) => letters(c, L / 2, 11.3, 0.9, "oberpfalzbahn", OPB.green, { weight: 700 }),
};
// bwegt (the SWEG's Ringzug and Europabahn units, repainted 2023-2024;
// DB Regio's on the S 61 since December 2023; photographs of VT 234 at
// Schwenningen, 563/650 at Radolfzell 2025): white, the cab yellow down to
// the lamps, yellow over the roof's edge, the windows in a black band,
// yellow doors; the bwegt mark on the side and the cab, a yellow bicycle;
// SWEG (or DB) on the nose.
RS1_PAINT.bwegt = {
  base: BW.white, door: BW.yellow, maskFill: "#1b1d20", winEdge: "#0e0f10", roofKit: "#4c5055",
  paint: (c, { L }) => rect(-1, 0, L + 2, 20, BW.white) + rect(-1, 11.4, L + 2, 4, BW.yellow) + rect(22.6, 5.6, L - 45.2, 5.1, BW.black) + rect(-1, 0, L + 2, 3.0, BW.skirt) +
    path(outline([[-1, 4.4], [5.6, 4.4], ["s", [5.6, 4.4], [6.4, 8.0], [9.6, 11.6]], [9.6, 15], [-1, 15]]), BW.yellow),
  marks: (c, { L }) => bwegtLogo(c, 12.3, 4.7, 1.1, { bw: BW.ink }) + bikeIcon(L / 2, 3.9, 1.3, "#e0b400"),
};
// WEG's Strohgäubahn (VT 361-368; photographs of VT 368 at Korntal 2024,
// VT 361 and 362 at Münchingen): one end lime green, a broad yellow sweep
// coming down behind its first window, big green ovals on the yellow
// toward the middle; the other end yellow, green dots growing toward the
// middle; dark green doors; "Strohgäubahn" with its yellow S-arrow under
// the green end's window, bwegt behind it, the web address on the yellow
// end. (Drawn half by half: c.mirrored is the yellow end.)
const SG = { green: "#8fca3e", yellow: "#f6d31c", door: "#1f6a33", skirt: "#3c4a2c" };
RS1_PAINT.strohgaeu = {
  base: SG.green, door: SG.door, maskFill: "#1b1d20", winEdge: "#0e0f10",
  paint: (c, { L }) => {
    const m = L / 2 + 2, dot = (x, y, r, f) => `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(r)}" ry="${n(r * 1.25)}" fill="${f}"/>`;
    if (!c.mirrored) return rect(-1, 0, L + 2, 20, SG.green) + path(outline([["s", [19.5, 14], [21.5, 9.0], [23.0, 4.0], [24.6, 1.0]], [m, 1.0], [m, 14]]), SG.yellow) +
      dot(31.5, 7.6, 3.0, SG.green) + dot(39.0, 9.4, 3.6, SG.green) + dot(41.5, 3.4, 2.0, SG.green) + rect(-1, 0, L + 2, 2.6, SG.skirt);
    return rect(-1, 0, L + 2, 20, SG.yellow) + dot(24.5, 9.6, 0.7, SG.green) + dot(28.0, 5.2, 1.1, SG.green) + dot(32.0, 10.2, 1.6, SG.green) + dot(36.4, 6.2, 2.2, SG.green) + dot(41.4, 9.0, 2.8, SG.green) +
      rect(-1, 0, L + 2, 2.6, SG.skirt);
  },
  marks: (c, { L }) => (!c.mirrored ? letters(c, 13.6, 5.1, 0.62, "Strohgäubahn", "#ffffff", { weight: 700, style: "italic" }) + bwegtLogo(c, 13.6, 4.0, 0.55, { bw: "#ffffff", tag: false })
    : letters(c, 13.0, 11.5, 0.42, "www.strohgaeubahn.de", "#3c6a1c", { weight: 600 }) + letters(c, 13.6, 5.1, 0.62, "Strohgäubahn", "#2f7d32", { weight: 700, style: "italic" }) +
      bwegtLogo(c, 13.6, 8.6, 0.6, { tag: false })),
};


// ===================== Alstom Coradia LINT =====================
// LINT 41 (two cars on a Jakobs truck, 41.89 m), LINT 54 (two cars of
// 27.1 m, each on its own trucks, 54.27 m, two doors a side on each car),
// LINT 81 (three such cars); 4.31 m over the roof equipment, the body
// 4.0 m; the 2011 crash-proof nose on the newer units (the BRB's, the
// oberpfalzbahn's, the SWEG's and vlexx's). (de.wikipedia "Alstom Coradia
// LINT"; the LINT 41 geometry as nlregio.cars.js measured it.)
const LT_NOSE41 = [[7.4, 13.1], [5.6, 12.9], [4.2, 12.3], [3.1, 11.2], [2.3, 9.8], [1.75, 8.2], [1.4, 6.4], [1.25, 4.6], [1.3, 3.0], [1.9, 2.4]];
const LT_COMMON = {
  roof: 13.1, nose: LT_NOSE41, doorY: [1.9, 10.6], truckTop: 2.9, coupler: 3.1, reach: 1.3, lamps: [[1.25, 5.0], [1.3, 4.35, true]],
  mask: [[1.5, 7.4], [2.1, 9.2], [2.9, 10.8], [4.0, 12.0], [5.5, 12.75], [7.2, 12.95], [7.0, 12.1], [5.7, 11.7], [4.7, 10.6], [4.0, 9.0], [3.4, 7.6], [2.6, 7.1]],
  glass: [[2.0, 8.0], [2.6, 9.6], [3.4, 10.9], [4.4, 11.9], [5.6, 12.35], [5.4, 11.5], [4.6, 10.4], [3.9, 9.0], [3.3, 7.9]],
  cabWin: [[8.4, 6.6], [8.4, 10.4], [10.8, 10.4], [10.8, 6.6]],
};
// LINT 41: one car of the pair (the cab at the left), its double door mid-
// car, the low floor round it.
const LINT41 = {
  ...LT_COMMON,
  bottom: [[1.9, 2.4], [21.0, 2.5], ["s", [21.0, 2.5], [22.0, 1.9], [22.4, 1.6]], [56.0, 1.6], ["s", [56.0, 1.6], [57.0, 2.0], [57.4, 2.6]]],
  wins: [[13.6, 18.8], [19.8, 24.6], [25.6, 29.4], [37.6, 42.4], [43.4, 48.2], [49.2, 54.0], [55.0, 59.8], [60.8, 65.6]].map(([a, b]) => [a, b, 5.6, 10.4, 0.35]),
  doors: [[31.0, 4.4]], trucks: (L) => [[13.0, 8.2, 30], [L, 8.86, 30]], firstBar: [13.6, 29.4], tdFig: 27.6,
  roofKit: [[4.5, 8.0, 0.8], [22.0, 9.0, 0.7], [56.0, 9.0, 0.8]],
  under: () => rect(5.0, 1.4, 5.5, 1.0, "#3a3e44", 0.4) + rect(58.0, 1.6, 7.0, 1.0, "#3a3e44", 0.4),
};
// LINT 54/81: a 27.1 m car (89 ft), the cab at the left (or none: the
// LINT 81's middle car), two double doors a side, the low floor between
// them, the engine under each end's high floor.
// Layout (photograph of 622 171 at München Hbf, 2020): from the cab three
// windows (wide, medium, narrow), the first door, two windows, the second
// door, four windows to the car's end; the low floor round the doors.
const LINT54 = {
  ...LT_COMMON,
  bottom: (L) => [[1.9, 2.4], [35.0, 2.5], ["s", [35.0, 2.5], [35.8, 1.9], [36.2, 1.6]], [61.6, 1.6], ["s", [61.6, 1.6], [62.0, 1.9], [62.8, 2.6]]],
  wins: (L) => [[12.6, 21.0], [22.0, 30.0], [31.0, 35.0], [42.6, 47.6], [48.6, 53.6], [62.0, 67.0], [68.0, 73.0], [74.0, 79.0], [80.0, L - 3.0]].map(([a, b]) => [a, b, 5.6, 10.4, 0.35]),
  doors: (L) => [[36.6, 4.4], [55.8, 4.4]], trucks: (L) => [[9.0, 8.2, 30], [L - 9.0, 8.2, 30]], firstBar: [12.6, 21.0], tdFig: 33.0,
  roofKit: [[4.5, 8.0, 0.8], [26.0, 10.0, 0.7], [-14.0, 9.0, 0.8]],
  under: (L) => rect(14.0, 1.4, 5.0, 1.0, "#3a3e44", 0.4) + rect(L - 22.0, 1.6, 7.0, 1.0, "#3a3e44", 0.4),
};
const LINT81M = { ...LINT54, nose: null, bottom: (L) => [[0.3, 2.6], [16.4, 2.6], ["s", [16.4, 2.6], [17.2, 1.9], [17.6, 1.6]], [L - 17.6, 1.6], ["s", [L - 17.6, 1.6], [L - 17.2, 1.9], [L - 16.4, 2.6]]],
  wins: (L) => [[2.6, 7.6], [8.6, 13.6], [14.6, 19.6], [20.6, 25.6], [26.6, 31.6], [42.6, 47.6], [48.6, 53.6], [62.0, 67.0], [68.0, 73.0], [74.0, 79.0], [80.0, L - 3.0]].map(([a, b]) => [a, b, 5.6, 10.4, 0.35]),
  roofKit: [[4.5, 9.0, 0.8], [26.0, 10.0, 0.7], [-14.0, 9.0, 0.8]] };
const LINT_PAINT = {};
// The BRB (photographs of VT 339 at Schondorf 2026, VT 320 on the
// Paartalbahn, VT 470 at Tegernsee 2024): white; the cab's face and the
// cab side's front edge deep blue, the blue carried back low under the
// windows to the first door; red doors; BRB's mark on the cab side.
LINT_PAINT.brb = {
  base: BRBC.white, door: BRBC.red, maskFill: "#1b1d20", winEdge: "#0e0f10", frame: 0.15,
  paint: (c, { L, cab }) => rect(-1, 0, L + 2, 20, BRBC.white) + rect(-1, 11.95, L + 2, 3, BRBC.blue) + rect(-1, 0, L + 2, 3.4, BRBC.blue) + rect(-1, 0, L + 2, 1.9, BRBC.skirt) +
    (cab ? path(outline([[-1, 15], [8.2, 15], ["s", [8.2, 15], [7.4, 11.6], [7.0, 8.0], [8.0, 5.2], [11.0, 4.3], [16.0, 4.2]], [16.0, 2.6], [-1, 2.6]]), BRBC.blue) : ""),
  // First class (photographs of VT 171 at München 2020, 1648 166 at
  // Lagerlechfeld 2021): a pale yellow bar over the windows behind one cab,
  // a white plate with a black "1" on the window.
  // BRB's mark and "Wir sind transdev" low on the cab side; Transdev's red
  // figure under the windows beside the first door (622 171 at München).
  marks: (c, { cab, first, S }) => (cab ? brbLogo(c, 10.6, 5.2, 0.6, BRBC.blue) + (S.tdFig ? transdevFigure(c, S.tdFig, 4.3, 2.6) : "") : "") +
    (cab && first ? rect(S.firstBar[0], 10.75, S.firstBar[1] - S.firstBar[0], 0.32, "#f2df7a") + classPlate(c, S.firstBar[1] - 1.0, 6.4, 9.0, "1", { fill: "#f4f4f4", ink: "#1a1a1a" }) : ""),
};
// oberpfalzbahn (LINT 41, RB 23; photograph at Hof 2019 and 2025): yellow,
// the windows in a dark blue band, its ends swept back at the cab;
// "oberpfalzbahn" in blue low on the side.
LINT_PAINT.opb = {
  base: OPB.yellow, door: OPB.blue, maskFill: "#1b1d20", winEdge: "#0e0f10",
  paint: (c, { L, cab }) => rect(-1, 0, L + 2, 20, OPB.yellow) + rect(cab ? 11.6 : -1, 5.1, L + 2, 5.9, OPB.blue) + rect(-1, 0, L + 2, 2.4, "#2f3337") +
    (cab ? path(poly([[11.6, 5.1], [13.4, 5.1], [12.4, 11.0], [10.6, 11.0]]), OPB.blue) : ""),
  marks: (c, { L }) => letters(c, 20.0, 3.6, 0.9, "oberpfalzbahn", OPB.blue, { weight: 700 }),
};
// The SWEG's LINT 54s in bwegt (622 4xx Ulm, 622 3xx Zollernalb;
// photographs of 622 460 at Storzingen, 622 317 at Hechingen 2026).
LINT_PAINT.bwegt = {
  base: BW.white, door: BW.yellow, maskFill: "#1b1d20", winEdge: "#0e0f10", roofKit: "#4c5055",
  paint: (c, { L, cab }) => rect(-1, 0, L + 2, 20, BW.white) + rect(-1, 11.5, L + 2, 4, BW.yellow) + rect(cab ? 12.0 : -1, 5.0, L + 2, 6.0, BW.black) + rect(-1, 0, L + 2, 2.6, BW.skirt) +
    (cab ? path(outline([[-1, 4.2], [6.0, 4.2], ["s", [6.0, 4.2], [6.8, 8.0], [9.5, 11.8]], [9.5, 15], [-1, 15]]), BW.yellow) : ""),
  marks: (c, { L, cab }) => (cab ? bwegtLogo(c, 15.4, 3.9, 1.0, { bw: BW.ink }) : "") + bikeIcon(cab ? 26.0 : L / 2, 3.6, 1.3, "#e0b400"),
};
// vlexx (photographs of 620 912 at Mainz 2023, 622 416 at Lebach-Jabach
// 2026): royal blue cab end breaking up into a field of blue triangles over
// the white body; blue doors; "vlexx" in white on the blue.
const VX = { blue: "#2a3e9a", white: "#f1f2f4", skirt: "#2a2f45" };
LINT_PAINT.vlexx = {
  base: VX.white, door: VX.blue, maskFill: "#1b1d20", winEdge: "#0e0f10",
  paint: (c, { L, cab }) => rect(-1, 0, L + 2, 20, VX.white) + rect(-1, 0, L + 2, 2.6, VX.skirt) +
    (cab ? rect(-1, 0, 14.0, 20, VX.blue) + triMesh(14.0, 30.0, 2.6, 12.6, VX.blue) : ""),
  marks: (c, { cab }) => (cab ? letters(c, 9.0, 4.2, 0.9, "vlexx", "#ffffff", { weight: 700 }) : ""),
};
// HLB (photographs at Niedernhausen and Altenkirchen 2026): the cab end
// yellow, a red-orange wedge behind it rising to the roof, the body gray,
// red doors; the HLB mark on the yellow.
const HLB = { yellow: "#f6c400", red: "#e8451e", gray: "#9aa0a6", silver: "#d5d8dc", skirt: "#3a3e42" };
const hlbLogo = (c, x, y, h, color = "#1f1f1f") => mark(c, x, y, `<path d="M${n(-h * 0.9)} ${n(-h * 0.28)}L${n(-h * 0.1)} ${n(-h * 0.85)}L${n(h * 0.7)} ${n(-h * 0.28)}" fill="none" stroke="#e3001b" stroke-width="${n(h * 0.14)}"/>` +
  txt(-h * 0.1, h * 0.1, h * 0.75, "HLB", color, { weight: 800, extra: `textLength="${n(h * 1.5)}" lengthAdjust="spacingAndGlyphs"` }) + txt(h * 1.45, h * 0.12, h * 0.5, "Bahn", color, { weight: 500 }));
// First class (photographs at Montabaur 2024 and Fulda 2020): a dark gray
// "1" on the yellow at the top corner of the first window behind the cab.
LINT_PAINT.hlb = {
  base: "#cfd3d7", door: HLB.red, maskFill: "#1b1d20", winEdge: "#0e0f10",
  paint: (c, { L, cab }) => rect(-1, 0, L + 2, 20, "#cfd3d7") + rect(-1, 0, L + 2, 2.6, HLB.skirt) +
    (cab ? path(poly([[-1, 0], [15.0, 0], [21.0, 15], [-1, 15]]), HLB.red) + path(poly([[-1, 0], [11.5, 0], [16.5, 15], [-1, 15]]), HLB.yellow) : ""),
  marks: (c, { cab, first }) => (cab ? hlbLogo(c, 11.6, 9.0, 0.9) + (first ? letters(c, 12.9, 10.0, 0.75, "1", "#3a3e42", { weight: 700 }) : "") : ""),
};
// RheinRuhrBahn (Transdev; S 7 "Der Müngstener", ex-Abellio LINT 41s,
// photograph at Solingen Hbf 2024): silver-white, the windows in a black
// band, red doors; "RheinRuhrBahn" in blue italics high behind the cab.
LINT_PAINT.rrb = {
  base: "#e8eaec", door: "#d3122a", maskFill: "#1b1d20", winEdge: "#0e0f10",
  paint: (c, { L, cab }) => rect(-1, 0, L + 2, 20, "#e8eaec") + rect(cab ? 11.8 : -1, 5.2, L + 2, 5.6, "#1c1e21") + rect(-1, 0, L + 2, 2.5, "#3a3e42"),
  marks: (c, { cab }) => (cab ? letters(c, 21.0, 11.7, 0.85, "RheinRuhrBahn", "#1f4ea3", { weight: 700, style: "italic" }) : ""),
};

// ===================== Alstom Coradia Continental =====================
// Alstom's Coradia Continental (de.wikipedia "Alstom Coradia
// Continental"): 4.28 m tall, Jakobs trucks (2.7 m) between the cars and
// a motor truck (2.44 m) under each cab; agilis's three-car units 57.8 m,
// four-car 74.2 m (end cars 20.7 m, the others 16.4 m); the rounded nose
// with its deep windshield. agilis's (440, 2010): no driver's door, the
// end car's door a third of the way back; HLB's (1440, 2017 and 2024): a
// driver's door behind the cab, the end car's door near its inner end.
const CC_NOSE = [[8.4, 13.6], [6.4, 13.42], [4.9, 12.85], [3.7, 11.85], [2.75, 10.5], [2.05, 8.9], [1.6, 7.1], [1.4, 5.3], [1.5, 3.7], [2.0, 2.6]];
const CC = {
  roof: 13.6, doorY: [2.0, 10.3], truckTop: 2.8, coupler: 3.0, reach: 1.5, lamps: [[1.45, 5.0], [1.5, 4.35, true]],
  mask: [[1.7, 7.1], [2.2, 8.9], [3.0, 10.6], [4.1, 12.0], [5.6, 12.95], [7.4, 13.35], [8.4, 13.4], [8.3, 12.6], [6.8, 12.4], [5.4, 11.5], [4.4, 10.2], [3.6, 8.5], [3.1, 7.1]],
  glass: [[2.2, 7.6], [2.7, 9.2], [3.5, 10.7], [4.6, 11.9], [6.0, 12.65], [7.6, 12.95], [7.2, 12.2], [5.8, 11.5], [4.8, 10.3], [4.0, 8.8], [3.5, 7.6]],
  bottom: (L) => [[2.0, 2.6], [5.2, 2.4], [13.8, 2.4], ["s", [13.8, 2.4], [14.6, 1.9], [15.2, 1.7]], [L - 8.4, 1.7], ["s", [L - 8.4, 1.7], [L - 6.0, 2.2], [L - 4.6, 2.75]]],
  trucks: (L) => [[9.0, 8.0, 33], [L, 8.86, 30]], gangway: [2.0, 12.6],
};
const CC_AG_END = { ...CC, nose: CC_NOSE, cabWin: [[9.0, 7.0], [9.0, 10.4], [11.4, 10.4], [11.4, 7.0]],
  wins: (L) => [[12.6, 17.2], [18.4, 23.0], ...[0, 1, 2, 3, 4, 5, 6].map((i) => [30.6 + i * 5.3, 34.9 + i * 5.3])].map(([a, b]) => [a, b, 5.4, 10.0, 0.4]),
  doors: [[24.6, 4.4]], roofKit: [[9.0, 10.0, 0.9], [24.0, 12.0, 1.0], [-18.0, 8.0, 0.8]], pan: -6.0 };
const CC_HLB_END = { ...CC, nose: CC_NOSE, crew: [9.6, 2.6, 3.4, 10.4],
  wins: (L) => [[18.0, 22.0], [23.4, 27.4], [28.8, 32.8], [34.2, 38.2], [39.6, 43.6], [45.0, 49.0], [L - 10.2, L - 6.2]].map(([a, b]) => [a, b, 5.4, 9.9, 0.4]),
  doors: (L) => [[L - 16.4, 4.4]], roofKit: [[9.0, 10.0, 0.9], [24.0, 12.0, 1.0], [-18.0, 8.0, 0.8]], pan: -6.0 };
const CC_MID = { ...CC, nose: null, bottom: (L) => [["s", [0.3, 2.75], [2.4, 2.4], [5.2, 1.7]], [L - 8.4, 1.7], ["s", [L - 8.4, 1.7], [L - 6.0, 2.2], [L - 4.6, 2.75]]],
  wins: (L) => [[3.6, 7.8], [9.0, 13.2], [14.4, 18.6], [26.8, 31.0], [32.2, 36.4], [37.6, 41.8], [43.0, 47.2], [48.4, 51.0]].map(([a, b]) => [a, b, 5.4, 10.0, 0.4]),
  doors: [[20.4, 4.4]], trucks: (L) => [[0, 8.86, 30], [L, 8.86, 30]], roofKit: [[4.0, 12.0, 1.0], [-20.0, 14.0, 1.0]], pan: 30.0 };
const CC_PAINT = {};
// agilis (photographs of 440 104 2021, 440 606 2024, 440 409 at Ulm 2026):
// silver, a lime band low along the side, lime doors; the cab graphite,
// the lime birds flying forward on its side, "agilis" in white; first
// class (behind one cab) marked by a "1" and a lime bar over its windows.
CC_PAINT.agilis = {
  base: AG.silver, door: AG.lime, roofKit: "#55595e", winEdge: "#0e0f10", frame: 0.15,
  paint: (c, { L, cab }) => rect(-1, 0, L + 2, 20, AG.silver) + rect(-1, 2.4, L + 2, 1.0, AG.lime) + rect(-1, 0, L + 2, 2.4, AG.skirt) +
    (cab ? path(outline([[-1, 0], [11.9, 0], ["s", [11.9, 0], [12.1, 7.0], [11.7, 15]], [-1, 15]]), AG.graphite) : ""),
  marks: (c, { cab, first }) => (cab ? agBirds(14.4, 10.2, 7.0, 3.6, AG.lime) + agilisWord(c, 18.4, 4.6, 1.15, "#59606a") + (first ? rect(12.6, 10.35, 10.4, 0.3, AG.lime) + letters(c, 17.8, 8.9, 0.55, "1", "#2f3338", { weight: 700 }) : "") : ""),
};
// HLB (photographs of ET 341 at Klein-Gerau 2026, 1440 262 at Frankfurt
// 2025): the cab yellow back past the driver's door, a red wedge behind it
// rising to the roof, then light silver; red along the roof's edge with
// three thin lines under it (mint, teal, violet); red doors; the "HLBahn"
// mark on the yellow, the RMV's low; a big red bicycle by the doors.
CC_PAINT.hlb = {
  base: HLB.silver, door: HLB.red, roofKit: "#55595e", winEdge: "#0e0f10", frame: 0.18,
  paint: (c, { L, cab }) => {
    let s = rect(-1, 0, L + 2, 20, HLB.silver) + rect(-1, 11.95, L + 2, 4, HLB.red) + rect(-1, 11.62, L + 2, 0.33, "#7fd3c0") + rect(-1, 11.35, L + 2, 0.27, "#1ea3a6") + rect(-1, 11.1, L + 2, 0.25, "#5a3f9b") +
      rect(-1, 0, L + 2, 2.4, "#7c8187");
    if (cab) s += path(outline([[-1, 0], [27.0, 0], ["s", [27.0, 0], [24.5, 6.5], [21.0, 11.0], [16.5, 13.4]], [-1, 16]]), HLB.red) +
      path(outline([[-1, 0], [19.6, 0], ["s", [19.6, 0], [18.2, 6.0], [15.6, 10.8], [13.6, 12.4]], [-1, 12.4]]), HLB.yellow) + rect(-1, 0, 30, 2.4, "#7c8187");
    return s;
  },
  marks: (c, { L, cab, first }) => (cab ? hlbLogo(c, 15.6, 7.6, 1.1) + (first ? classPlate(c, 28.1, 6.2, 8.8, "1", { fill: "#f4f4f4", ink: "#1a1a1a" }) : "") : "") +
    bikeIcon(cab ? L - 24.0 : 25.6, 4.6, 2.2, HLB.red, 0.07),
};

// ===================== Stadler FLIRT (the first FLIRTs, 2004-2014) =====================
// Stadler's first FLIRT (de.wikipedia "Stadler Flirt"): end cars 21.4 m
// with the motor truck under the cab, the others 15.65 m (four cars 74.1
// m), on Jakobs trucks; the low pointed nose under a steeply raked
// windshield; a double door a side on each car. HLB's five-car 429s
// (RE 98, RE 99), VIAS's three- and four-car units (RB 10) and the BRB's
// ex-BLB three-car units (S 4).
const F1_NOSE = [[8.8, 13.0], [6.8, 12.85], [5.4, 12.3], [4.3, 11.4], [3.45, 10.2], [2.75, 8.7], [2.25, 7.1], [1.95, 5.5], [1.9, 4.1], [2.15, 2.9], [2.7, 2.3]];
const F1 = {
  roof: 13.0, doorY: [1.9, 10.0], truckTop: 2.8, coupler: 3.0, reach: 2.0, lamps: [[1.95, 5.0], [2.0, 4.35, true]], gangway: [1.9, 12.2],
  mask: [[2.2, 6.6], [2.6, 8.2], [3.25, 9.7], [4.1, 11.0], [5.2, 12.0], [6.7, 12.6], [8.6, 12.8], [8.3, 12.0], [6.8, 11.7], [5.6, 10.8], [4.7, 9.4], [4.0, 7.9], [3.6, 6.6]],
  glass: [[2.6, 7.2], [3.05, 8.6], [3.75, 10.0], [4.7, 11.2], [5.9, 12.0], [7.2, 12.35], [6.7, 11.5], [5.6, 10.6], [4.8, 9.3], [4.2, 8.0], [3.85, 7.2]],
  bottom: (L) => [[2.7, 2.3], [5.0, 2.1], [24.0, 2.1], ["s", [24.0, 2.1], [24.8, 1.6], [25.4, 1.45]], [L - 8.6, 1.45], ["s", [L - 8.6, 1.45], [L - 6.0, 2.1], [L - 4.6, 2.75]]],
  trucks: (L) => [[16.4, 8.86, 34], [L, 8.86, 30]],
};
const F1_END = { ...F1, nose: F1_NOSE, cabWin: [[9.4, 7.4], [9.4, 10.2], [11.8, 10.2], [11.8, 7.4]],
  wins: (L) => [[13.2, 17.6, 6.0, 9.6], [18.6, 23.0, 6.0, 9.6], [33.2, 37.8], [38.8, 43.4], [44.4, 49.0], [50.0, 54.6], [55.6, 60.2], [61.2, 65.8]].map(([a, b, y0 = 4.6, y1 = 9.6]) => [a, b, y0, y1, 0.4]),
  doors: [[26.6, 4.4]], roofKit: [[12.0, 12.0, 1.0], [-22.0, 10.0, 0.9]], pan: -6.0 };
const F1_MID = { ...F1, nose: null, bottom: (L) => [["s", [0.3, 2.75], [2.4, 2.1], [5.2, 1.45]], [L - 8.6, 1.45], ["s", [L - 8.6, 1.45], [L - 6.0, 2.1], [L - 4.6, 2.75]]],
  wins: (L) => [[3.4, 8.0], [9.0, 13.6], [14.6, 19.2], [28.0, 32.6], [33.6, 38.2], [39.2, 43.8], [44.8, 48.4]].map(([a, b]) => [a, b, 4.6, 9.6, 0.4]),
  doors: [[21.6, 4.4]], trucks: (L) => [[0, 8.86, 30], [L, 8.86, 30]], roofKit: [[4.0, 12.0, 1.0], [-18.0, 12.0, 1.0]] };
const F1_PAINT = {};
// HLB (429 044/544 at Kassel-Wilhelmshöhe 2021, Herborn): as its other
// units, the cab yellow and the red wedge, the body gray, red doors.
F1_PAINT.hlb = {
  base: HLB.gray, door: HLB.red, roofKit: "#55595e", winEdge: "#0e0f10",
  paint: (c, { L, cab }) => rect(-1, 0, L + 2, 20, "#a9aeb3") + rect(-1, 0, L + 2, 2.3, HLB.skirt) +
    (cab ? path(poly([[-1, 0], [19.0, 0], [24.5, 15], [-1, 15]]), HLB.red) + path(poly([[-1, 0], [15.0, 0], [20.0, 15], [-1, 15]]), HLB.yellow) : ""),
  marks: (c, { cab }) => (cab ? hlbLogo(c, 13.4, 8.4, 0.9) : ""),
};
// VIAS (RB 10; photographs at Wiesbaden 2026 and Kaub 2026): the cab end
// teal, breaking up into a mesh of triangles over the white body; blue
// doors; VIAS's mark in white on the teal.
const VI = { teal: "#139a8e", deep: "#0d6e66", white: "#f1f3f3", blue: "#1f4fa0" };
F1_PAINT.vias = {
  base: VI.white, door: VI.blue, roofKit: "#55595e", winEdge: "#0e0f10",
  paint: (c, { L, cab }) => rect(-1, 0, L + 2, 20, VI.white) + rect(-1, 0, L + 2, 2.3, "#3a3e42") + (cab ? rect(-1, 0, 13.0, 20, VI.teal) + triMesh(13.0, 30.0, 2.3, 12.6, VI.teal) : ""),
  marks: (c, { cab }) => (cab ? letters(c, 7.0, 4.3, 1.0, "VIAS", "#ffffff", { weight: 800, style: "italic" }) : ""),
};
// The BRB's ex-BLB units (S 4; photographs at Hallthurm 2022, Salzburg Hbf
// 2019): white, a red band over the roof's edge with a thin blue line
// under it, the windows in a dark band, blue doors; www.brb.de lettered.
F1_PAINT.blb = {
  base: "#f2f3f4", door: "#1f4fa0", roofKit: "#55595e", winEdge: "#0e0f10",
  paint: (c, { L, cab }) => rect(-1, 0, L + 2, 20, "#f2f3f4") + rect(-1, 11.3, L + 2, 4, "#d3122a") + rect(-1, 11.0, L + 2, 0.22, "#1f4fa0") +
    rect(cab ? 12.6 : -1, 4.3, L + 2, 5.6, "#2a2e33") + rect(-1, 0, L + 2, 2.3, "#8d939a"),
  marks: (c, { cab }) => (cab ? letters(c, 20.0, 3.5, 0.6, "www.brb.de", "#1f2f8f", { weight: 700 }) : ""),
};

// ===================== Bombardier Talent 3 (vlexx) =====================
// Talent 3 (8442, 2019-2021): three cars, 56.1 m, Jakobs trucks; vlexx's
// 8442 1xx/6xx on the Saarland lines (RB 73, RB 74, RB 76): the royal
// blue cab end breaking into blue triangles over white, blue doors.
const T3_NOSE = [[8.6, 13.3], [6.5, 13.12], [5.0, 12.55], [3.8, 11.5], [2.9, 10.0], [2.2, 8.3], [1.7, 6.6], [1.45, 4.9], [1.5, 3.4], [2.0, 2.4]];
const T3 = {
  roof: 13.3, doorY: [1.9, 10.1], truckTop: 2.8, coupler: 3.0, reach: 1.6, lamps: [[1.5, 5.0], [1.55, 4.35, true]], gangway: [1.9, 12.4],
  mask: [[1.8, 6.8], [2.3, 8.5], [3.1, 10.1], [4.1, 11.5], [5.4, 12.5], [7.0, 13.0], [8.6, 13.1], [8.3, 12.3], [6.9, 12.0], [5.6, 11.0], [4.6, 9.6], [3.9, 8.0], [3.4, 6.8]],
  glass: [[2.3, 7.4], [2.8, 8.9], [3.6, 10.4], [4.7, 11.6], [6.0, 12.35], [7.3, 12.6], [6.8, 11.8], [5.6, 11.0], [4.7, 9.6], [4.0, 8.2], [3.6, 7.4]],
  bottom: (L) => [[2.0, 2.4], [4.6, 2.2], [14.6, 2.2], ["s", [14.6, 2.2], [15.4, 1.7], [16.0, 1.5]], [L - 8.6, 1.5], ["s", [L - 8.6, 1.5], [L - 6.0, 2.1], [L - 4.6, 2.75]]],
  trucks: (L) => [[9.0, 8.5, 33], [L, 8.86, 30]],
};
const T3_END = { ...T3, nose: T3_NOSE, cabWin: [[9.4, 7.2], [9.4, 10.3], [11.6, 10.3], [11.6, 7.2]],
  wins: (L) => [[12.8, 17.4], [18.4, 23.0], [30.6, 35.2], [36.2, 40.8], [41.8, 46.4], [47.4, 52.0], [53.0, 57.6], [58.6, 63.2]].map(([a, b]) => [a, b, 4.8, 10.0, 0.4]),
  doors: [[24.4, 4.6]], roofKit: [[9.0, 10.0, 0.9], [-24.0, 12.0, 1.0]], pan: -7.0 };
const T3_MID = { ...T3, nose: null, bottom: (L) => [["s", [0.3, 2.75], [2.4, 2.1], [5.2, 1.5]], [L - 8.6, 1.5], ["s", [L - 8.6, 1.5], [L - 6.0, 2.1], [L - 4.6, 2.75]]],
  wins: (L) => [[3.4, 8.0], [9.0, 13.6], [26.6, 31.2], [32.2, 36.8], [37.8, 42.4], [43.4, 46.4]].map(([a, b]) => [a, b, 4.8, 10.0, 0.4]),
  doors: [[17.4, 4.6]], trucks: (L) => [[0, 8.86, 30], [L, 8.86, 30]], roofKit: [[4.0, 12.0, 1.0]] };
const T3_PAINT = {
  vlexx: { base: VX.white, door: VX.blue, roofKit: "#55595e", winEdge: "#0e0f10",
    paint: (c, { L, cab }) => rect(-1, 0, L + 2, 20, VX.white) + rect(-1, 0, L + 2, 2.2, VX.skirt) + (cab ? rect(-1, 0, 16.5, 20, VX.blue) + triMesh(16.5, 36.0, 2.2, 12.6, VX.blue, { size: 1.1 }) : ""),
    marks: (c, { cab }) => (cab ? letters(c, 6.6, 4.4, 0.9, "vlexx", "#ffffff", { weight: 700 }) : "") },
};

// ===================== Bombardier Talent (BOB's 426) =====================
// Bombardier's electric Talent (DB 426, two cars on a Jakobs truck, 34.6
// m); the Bodensee-Oberschwaben-Bahn's eight ex-Saarland units (RB 91,
// photographs of 426 042 at Ravensburg 2025, Friedrichshafen Hafen 2026):
// blue, BOB's white goat and "Bodensee-Oberschwaben-Bahn" on the side.
const TA_NOSE = [[7.0, 12.6], [5.0, 12.42], [3.8, 11.4], [2.7, 9.8], [1.7, 8.2], [1.0, 6.7], [0.7, 4.9], [0.75, 3.3], [1.2, 2.3]];
const TALENT = {
  roof: 12.6, nose: TA_NOSE, doorY: [1.9, 9.8], truckTop: 2.6, coupler: 3.0, reach: 0.9, lamps: [[0.75, 4.9], [0.8, 4.25, true]], gangway: [1.9, 11.8],
  mask: [[1.1, 6.8], [1.7, 8.3], [2.6, 9.9], [3.6, 11.3], [4.8, 12.1], [6.6, 12.35], [6.4, 11.6], [5.2, 11.3], [4.3, 10.1], [3.5, 8.6], [2.8, 7.2], [2.0, 6.8]],
  glass: [[1.6, 7.2], [2.2, 8.6], [3.0, 10.0], [3.9, 11.2], [5.0, 11.8], [4.8, 11.0], [4.0, 10.0], [3.3, 8.6], [2.7, 7.4]],
  bottom: (L) => [[1.2, 2.3], [3.0, 2.2], [L - 5.0, 2.2], ["s", [L - 5.0, 2.2], [L - 3.6, 2.6], [L - 2.4, 2.9]]],
  wins: (L) => [[8.6, 12.4, 6.0, 9.4], [20.2, 24.6], [25.6, 30.0], [31.0, 35.4], [36.4, 40.8], [41.8, 46.2], [47.2, 51.6]].map(([a, b, y0 = 5.4, y1 = 9.6]) => [a, b, y0, y1, 0.4]),
  doors: [[14.2, 4.3]], trucks: (L) => [[7.4, 8.2, 30], [L, 8.2, 30]], roofKit: [[8.0, 9.0, 0.8], [-18.0, 10.0, 0.9]], pan: -8.0,
};
const BOB = { blue: "#1f5aa8", light: "#7fb2e0" };
const TALENT_PAINT = {
  bob: { base: BOB.blue, door: "#d7dbe0", roofKit: "#55595e", winEdge: "#0e0f10",
    paint: (c, { L }) => rect(-1, 0, L + 2, 20, BOB.blue) + rect(-1, 2.2, L + 2, 1.3, "#f1f3f5") + rect(-1, 10.6, L + 2, 0.25, "#f1f3f5") + rect(-1, 0, L + 2, 2.2, "#24324a"),
    marks: (c, { L }) => letters(c, 34.0, 3.7, 0.7, "Bodensee-Oberschwaben-Bahn", "#ffffff", { weight: 600 }) },
};

// ===================== Siemens Desiro ML (MittelrheinBahn) =====================
// Siemens Desiro Mainline (Trans Regio's 460, 2008-2010; de.wikipedia
// "TDR-Baureihe 460"): three cars on their own trucks, 75.2 m; a door a
// side at each end of each car. The MittelrheinBahn's paint (photographs
// of 460 514 at Köln-Süd, Budenheim 2021): light silver, the windows in a
// dark band, yellow doors; "trans regio" on the nose, a short yellow bar
// over first class behind the cab.
const DML_NOSE = [[8.2, 13.6], [6.2, 13.42], [4.6, 12.7], [3.4, 11.4], [2.5, 9.8], [1.9, 8.0], [1.55, 6.2], [1.5, 4.4], [1.75, 3.0], [2.3, 2.4]];
const DML = {
  roof: 13.6, doorY: [2.9, 10.4], truckTop: 3.2, coupler: 3.0, reach: 1.8, lamps: [[1.55, 5.2], [1.6, 4.55, true]], gangway: [2.9, 12.6],
  mask: [[1.9, 7.2], [2.5, 9.0], [3.4, 10.6], [4.5, 11.9], [6.0, 12.8], [8.2, 13.2], [7.9, 12.4], [6.4, 12.0], [5.2, 11.0], [4.3, 9.6], [3.6, 8.0], [3.1, 7.2]],
  glass: [[2.4, 7.8], [3.0, 9.3], [3.8, 10.7], [4.9, 11.8], [6.3, 12.5], [6.0, 11.7], [5.0, 10.8], [4.2, 9.4], [3.6, 7.9]],
  bottom: (L) => [[2.3, 2.4], [L - 1.0, 2.4]], trucks: (L) => [[10.6, 8.2, 33], [L - 10.6, 8.2, 33]],
};
// Layout (photograph of 460 503 at Ingelheim, January 2026): the end car's
// big dark cab side window, two big first-class windows, a door near the
// middle, a window, a second door near the inner end, a window; the
// middle car a door near each end, windows between; the doors set in gray
// panels, their leaves yellow below the glass.
const DML_END = { ...DML, nose: DML_NOSE, cabWin: [[9.6, 6.6], [9.6, 11.2], [15.4, 11.2], [15.4, 6.6]],
  wins: (L) => [[21.4, 30.6], [31.6, 40.8], [52.0, 61.2], [72.0, L - 3.0]].map(([a, b]) => [a, b, 5.6, 10.2, 0.4]),
  doors: (L) => [[44.2, 4.4], [64.4, 4.4]], roofKit: [[9.0, 12.0, 0.9], [30.0, 14.0, 1.0]], pan: -14.0,
  doorGlass: { glassLow: 6.0, glassTop: 9.6, gw: 1.6 } };
const DML_MID = { ...DML, nose: null, bottom: (L) => [[0.3, 2.4], [L - 0.3, 2.4]],
  wins: (L) => [[12.6, 21.8], [22.8, 32.0], [33.0, 42.2], [43.2, 52.4], [53.4, 62.6]].map(([a, b]) => [a, b, 5.6, 10.2, 0.4]),
  doors: (L) => [[5.4, 4.4], [L - 11.2, 4.4]], trucks: (L) => [[10.0, 8.2, 33], [L - 10.0, 8.2, 33]], roofKit: [[12.0, 14.0, 1.0], [-26.0, 14.0, 1.0]],
  doorGlass: { glassLow: 6.0, glassTop: 9.6, gw: 1.6 } };
const TR = { silver: "#e3e6e9", dark: "#2a2e33", yellow: "#f6c400" };
const transRegio = (c, x, y, h, color = "#1d1f22") => mark(c, x, y, txt(0, -h * 0.45, h * 0.62, "trans", color, { weight: 700, anchor: "start" }) + txt(0, h * 0.25, h * 0.62, "regio", color, { weight: 700, anchor: "start" }) +
  txt(0, h * 0.75, h * 0.26, "Wir sind Transdev", "#e3001b", { weight: 600, anchor: "start" }));
const DML_PAINT = {
  transregio: { base: TR.silver, door: TR.yellow, roofKit: "#55595e", winEdge: "#0e0f10", frame: 0.15,
    paint: (c, { L, cab, S }) => rect(-1, 0, L + 2, 20, TR.silver) + rect(-1, 0, L + 2, 2.4, "#5b6067") +
      (S.doors(L)).map(([x, w]) => rect(x - 0.7, 2.4, w + 1.4, 9.4, "#a9aeb3", 0, 'rx="0.3"')).join("") +
      (cab ? path(outline([[-1, 13.6], [9.0, 13.6], ["s", [9.0, 13.6], [9.4, 11.6], [9.2, 7.0]], [-1, 7.0]]), "#d8dbde") : ""),
    marks: (c, { cab, first }) => (cab ? letters(c, 17.2, 5.0, 0.8, "TransRegio", "#1f3f8f", { weight: 700 }) + letters(c, 17.2, 4.2, 0.4, "Wir sind transdev", "#e3001b", { weight: 600 }) +
      (first ? rect(21.4, 10.75, 9.2, 0.3, TR.yellow) + classPlate(c, 30.0, 6.6, 9.4, "1") : classPlate(c, 30.0, 6.6, 9.4, "2")) : "") },
};
// The MittelrheinBahn's six Mireos (463 301-306, Mainz-Bingen, and the
// Ahrtalbahn since December 2025): the same paint on the Mireo.
MIREO_PAINT.transregio = {
  base: TR.silver, door: TR.yellow, roofKit: "#55595e", winEdge: "#0e0f10", frame: 0.15,
  paint: (c, { L }) => rect(-1, 0, L + 2, 20, TR.silver) + rect(-1, 0, L + 2, 2.6, "#5b6067"),
  marks: (c, { cab, first }) => (cab ? letters(c, 14.6, 7.6, 0.85, "TransRegio", "#1f3f8f", { weight: 700 }) + letters(c, 14.6, 6.8, 0.42, "Wir sind transdev", "#e3001b", { weight: 600 }) +
    (first ? rect(16.6, 10.55, 5.0, 0.3, TR.yellow) : "") : ""),
};
// agilis's Mireos (1463 201-223, four cars; photographs of 1463 219 at
// Plattling 2025, Freising 2026): silver, the cab graphite, the lime
// birds on its side, lime doors, a lime line along the roof's edge.
MIREO_PAINT.agilis = {
  base: AG.silver, door: AG.lime, roofKit: "#55595e", winEdge: "#0e0f10", frame: 0.15,
  paint: (c, { L, cab }) => rect(-1, 0, L + 2, 20, AG.silver) + rect(-1, 12.3, L + 2, 0.45, AG.lime) + rect(-1, 12.75, L + 2, 3, "#b9bdc2") + rect(-1, 0, L + 2, 2.6, AG.skirt) +
    (cab ? path(outline([[-1, 0], [15.2, 0], ["s", [15.2, 0], [15.6, 7.0], [15.0, 15]], [-1, 15]]), AG.graphite) : ""),
  marks: (c, { cab, first }) => (cab ? agBirds(10.0, 9.0, 4.6, 4.2, AG.lime) + agilisWord(c, 13.0, 4.8, 1.1, "#ffffff") + (first ? rect(16.6, 10.55, 5.0, 0.3, AG.lime) : "") : ""),
};

// ===================== Bombardier Itino (VIAS Odenwaldbahn) =====================
// Bombardier's Itino (VIAS's 615, VT 101-126, 2005), two cars on a Jakobs
// truck, 51.75 m; the Odenwaldbahn's paint (photograph of VT 111 at
// Rüdesheim): white, the cab end and a band over the roof's edge red, a
// thin teal line over the windows, red doors, a gray skirt; "Odenwald-
// Bahn" in green script, VIAS's mark.
const IT_NOSE = [[6.6, 12.4], [4.7, 12.3], [3.3, 11.8], [2.3, 10.6], [1.6, 9.0], [1.2, 7.2], [1.05, 5.4], [1.1, 3.8], [1.6, 2.7]];
// Layout per car (photographs of VT 111 at Rüdesheim 2021, VT 103 at
// Frankfurt 2025): the cab's side window, VIAS's mark, three big panes
// in one group, the double door two-thirds back, two big panes, the
// Jakobs truck.
const ITINO = {
  roof: 12.4, nose: IT_NOSE, doorY: [2.1, 9.8], truckTop: 2.8, coupler: 3.0, reach: 1.1, lamps: [[1.1, 4.8], [1.15, 4.15, true]], gangway: [2.1, 11.6],
  mask: [[1.4, 6.8], [1.9, 8.6], [2.6, 10.2], [3.6, 11.4], [5.0, 12.0], [6.4, 12.1], [6.2, 11.3], [5.0, 11.1], [4.0, 10.0], [3.3, 8.4], [2.7, 6.9]],
  glass: [[1.9, 7.3], [2.4, 8.8], [3.1, 10.1], [4.0, 11.1], [5.1, 11.6], [4.9, 10.8], [4.0, 9.8], [3.4, 8.4], [2.9, 7.3]],
  cabWin: [[8.0, 6.4], [8.0, 10.2], [10.6, 10.2], [10.6, 6.4]],
  bottom: (L) => [[1.6, 2.7], [L - 6.0, 2.7], ["s", [L - 6.0, 2.7], [L - 4.0, 2.9], [L - 2.4, 3.1]]],
  wins: (L) => [[15.6, 25.0], [25.3, 34.7], [35.0, 44.4], [55.2, 64.6], [64.9, 74.3]].map(([a, b]) => [a, b, 4.6, 10.0, 0.3]),
  doors: [[48.0, 4.4]], trucks: (L) => [[9.0, 8.2, 30], [L, 8.2, 30]], roofKit: [[8.0, 9.0, 0.8], [30.0, 12.0, 1.0]],
};
const ITINO_PAINT = {
  vias: { base: "#f1f2f3", door: "#d3122a", roofKit: "#55595e", winEdge: "#0e0f10",
    paint: (c, { L }) => rect(-1, 0, L + 2, 20, "#f1f2f3") + rect(-1, 10.9, L + 2, 4, "#d3122a") + rect(-1, 10.25, L + 2, 0.3, "#139a8e") + rect(-1, 0, L + 2, 2.7, "#7c8187") +
      path(outline([[-1, 0], [7.6, 0], ["s", [7.6, 0], [7.9, 6.0], [7.3, 11.0]], [-1, 11]]), "#d3122a"),
    marks: (c, { L }) => letters(c, 30.0, 3.6, 1.15, "Odenwald-Bahn", "#2e8b3d", { weight: 500, style: "italic", family: "Brush Script MT, Segoe Script, Georgia, serif" }) +
      letters(c, 13.2, 8.6, 0.55, "VIAS", "#4a5560", { weight: 700 }) + triMesh(12.6, 14.0, 7.4, 8.1, "#139a8e", { size: 0.35 }) },
};

// ===================== Stadler GTW 2/6 =====================
// Stadler's GTW 2/6 (HLB's 646 and 509; the Westerwaldbahn's two ex-HLB
// units on the Daadetalbahn since 2023): two end cars hung from a short
// power module, 38.7 m; the geometry as nlregio.cars.js measured it.
const GT_NOSE2 = [[8.6, 13.24], [6.6, 13.05], [4.9, 12.5], [3.5, 11.45], [2.5, 10.05], [1.8, 8.45], [1.4, 6.75], [1.2, 5.1], [1.12, 3.7], [1.3, 2.85], [1.9, 2.5]];
const GTW_END = {
  roof: 13.24, nose: GT_NOSE2, doorY: [1.75, 10.4], truckTop: 2.9, coupler: 3.0, reach: 1.2, lamps: [[1.2, 5.0], [1.25, 4.35, true]], gangway: [1.75, 12.4],
  mask: [[1.4, 6.9], [1.85, 8.5], [2.6, 9.95], [3.65, 11.2], [5.0, 12.15], [6.6, 12.7], [8.4, 12.9], [8.4, 11.6], [6.9, 11.25], [5.5, 10.4], [4.3, 9.1], [3.5, 7.7], [3.1, 6.7]],
  glass: [[1.85, 7.4], [2.35, 8.8], [3.1, 10.1], [4.1, 11.2], [5.4, 11.95], [6.6, 12.3], [6.4, 11.5], [5.2, 10.8], [4.2, 9.6], [3.5, 8.3], [3.1, 7.4]],
  cabWin: [[10.0, 6.85], [9.1, 8.7], [11.0, 10.5], [15.2, 10.5], [15.2, 6.85]],
  bottom: (L) => [[1.9, 2.5], [28.9, 2.5], ["s", [28.9, 2.5], [29.6, 2.1], [29.7, 1.7]], [L - 0.3, 1.7]],
  wins: (L) => [[15.5, 17.2, 6.85, 10.5], [19.1, 23.4, 6.4, 10.5], [24.0, 28.1, 6.4, 10.5], [34.6, 39.2, 5.0, 10.0], [40.0, 44.6, 5.0, 10.0], [45.4, 50.0, 5.0, 10.0], [50.8, 55.4, 5.0, 10.0]].map(([a, b, y0, y1]) => [a, b, y0, y1, 0.4]),
  doors: [[29.8, 4.3]], trucks: (L) => [[8.6, 6.9, 30]], roofKit: [[9.0, 8.0, 0.8], [36.0, 12.0, 0.9]],
};
const GTW_MOD = { roof: 13.24, nose: null, doorY: [1.75, 10.4], truckTop: 2.9, bottom: (L) => [[0.3, 1.7], [L - 0.3, 1.7]], wins: [], doors: [], trucks: (L) => [[L / 2, 7.2, 30]], roofKit: [[2.0, 12.0, 1.2]], gangway: [1.75, 12.4] };
const GTW_PAINT = {
  hlb: { base: HLB.gray, door: HLB.red, roofKit: "#55595e", winEdge: "#0e0f10",
    paint: (c, { L, cab }) => rect(-1, 0, L + 2, 20, "#a9aeb3") + rect(-1, 0, L + 2, 2.4, HLB.skirt) +
      (cab ? path(poly([[-1, 0], [15.0, 0], [20.5, 15], [-1, 15]]), HLB.red) + path(poly([[-1, 0], [11.2, 0], [16.7, 15], [-1, 15]]), HLB.yellow) : ""),
    marks: (c, { cab }) => (cab ? hlbLogo(c, 11.0, 8.6, 0.8) : "") },
  // The Westerwaldbahn's (509 106 and 109, ex-HLB; photograph of 509 106
  // near Schutzbach, April 2025, hans-maennel.de): silver, a lime green
  // stripe along the top of the windows and a lime band across the front
  // under the windshield. Its lettering can't be read on the one photo
  // found, so none is drawn.
  weba: { base: "#cfd3d6", door: "#cfd3d6", roofKit: "#55595e", winEdge: "#0e0f10",
    paint: (c, { L, cab }) => rect(-1, 0, L + 2, 20, "#cfd3d6") + rect(-1, 10.7, L + 2, 0.7, "#7dc242") + rect(-1, 0, L + 2, 2.4, "#3a3e42") +
      (cab ? path(outline([[-1, 4.2], [4.6, 4.2], ["s", [4.6, 4.2], [5.2, 5.6], [6.4, 6.6]], [-1, 6.6]]), "#7dc242") : ""),
    marks: () => "" },
};

// ===================== Integral S5D95 (Regiobahn, S 28) =====================
// The Integral (Jenbacher, 1998; ex-Bayerische Oberlandbahn, class 609.1,
// VT 101-117): five sections, 53.4 m, the end sections on a truck at each
// end, the middle one on its own truck, the two between hung from their
// neighbours; a blunt nose under a deep windshield. The Regiobahn's paint
// (photographs of VT 111 2024, VT 114 at Neuss 2024): white, the windows
// in a black band, red doors with round-cornered windows, a dark skirt;
// the "REGIO bahn" mark behind the cab.
const IN_NOSE = [[6.0, 12.8], [4.0, 12.62], [2.7, 11.8], [1.8, 10.4], [1.25, 8.6], [1.0, 6.6], [1.0, 4.6], [1.2, 3.3], [1.7, 2.6]];
const INT_END = {
  roof: 12.8, nose: IN_NOSE, doorY: [2.6, 10.0], truckTop: 3.2, coupler: 3.0, reach: 1.0, lamps: [[1.0, 5.0], [1.05, 4.35, true]], gangway: [2.6, 11.8],
  mask: [[1.1, 6.6], [1.4, 8.6], [2.0, 10.3], [2.9, 11.6], [4.2, 12.3], [5.8, 12.45], [5.6, 11.6], [4.4, 11.3], [3.6, 10.0], [3.0, 8.4], [2.6, 6.8]],
  glass: [[1.6, 7.2], [1.9, 8.8], [2.5, 10.2], [3.4, 11.3], [4.6, 11.8], [4.4, 10.9], [3.6, 9.8], [3.0, 8.4], [2.6, 7.2]],
  cabWin: [[6.6, 6.8], [6.6, 10.0], [8.6, 10.0], [8.6, 6.8]],
  bottom: (L) => [[1.7, 2.6], [L - 0.3, 2.6]], trucks: (L) => [[7.5, 7.2, 30], [L - 7.0, 7.2, 30]],
  wins: (L) => [[16.0, 20.6], [21.6, 26.2], [27.2, 31.8], [32.8, 37.4]].map(([a, b]) => [a, b, 5.8, 9.8, 0.4]),
  doors: [[10.2, 4.2]], roofKit: [[8.0, 10.0, 1.0], [24.0, 12.0, 0.8]],
};
const INT_SUS = { ...INT_END, nose: null, bottom: (L) => [[0.3, 2.6], [L - 0.3, 2.6]], trucks: [], wins: (L) => [[1.8, 6.4], [7.4, 12.0], [18.4, 23.0], [24.0, 28.6]].map(([a, b]) => [a, b, 5.8, 9.8, 0.4]), doors: [[13.2, 4.2]], roofKit: [[4.0, 10.0, 0.8]] };
const INT_MID = { ...INT_SUS, trucks: (L) => [[L / 2, 7.2, 30]], wins: (L) => [[2.0, 6.6], [7.6, 12.2], [18.8, 23.4], [24.4, 29.0]].map(([a, b]) => [a, b, 5.8, 9.8, 0.4]), doors: [[13.4, 4.2]] };
const INT_PAINT = {
  regiobahn: { base: "#f2f3f4", door: "#d3122a", roofKit: "#55595e", winEdge: "#0e0f10",
    paint: (c, { L, cab }) => rect(-1, 0, L + 2, 20, "#f2f3f4") + rect(-1, 0, L + 2, 4.0, "#6b7076") + rect(-1, 0, L + 2, 2.8, "#3a3e42"),
    marks: (c, { cab }) => (cab ? letters(c, 17.0, 4.8, 0.75, "REGIO", "#d3122a", { weight: 800, anchor: "end" }) + letters(c, 17.3, 4.8, 0.75, "bahn", "#6b7178", { weight: 600, anchor: "start" }) : "") },
};

// ===================== Siemens Desiro HC (Arverio Bayern) =====================
// Siemens Desiro HC (Arverio Bayern's 2462 001-012, five cars, 2022;
// de.wikipedia "Siemens Desiro HC"): single-deck end cars (26.2 m, the
// motors and a pantograph each), double-deck middle cars (25.2 m), 4.64 m
// tall; in Arverio Bayern's blue with the gray wave; the geometry as
// chintl.cars.js's.
const HC_NOSE = [[9.8, 15.2], [7.4, 15.0], [5.6, 14.0], [3.7, 11.9], [1.9, 9.8], [0.9, 8.0], [0.55, 6.2], [0.6, 4.4], [1.0, 2.9]];
const HC_END = {
  roof: 15.2, nose: HC_NOSE, doorY: [3.0, 11.0], truckTop: 3.0, coupler: 3.0, reach: 0.8, lamps: [[0.6, 5.2], [0.62, 4.55, true]], gangway: [3.0, 13.8],
  mask: [[1.0, 8.0], [2.0, 9.9], [3.8, 12.0], [5.6, 13.9], [7.4, 14.75], [9.6, 14.95], [9.2, 14.0], [7.4, 13.6], [5.8, 12.4], [4.4, 10.6], [3.2, 8.6], [2.2, 7.9]],
  glass: [[1.6, 8.5], [2.6, 10.3], [4.2, 12.1], [5.8, 13.4], [7.4, 14.1], [7.0, 13.2], [5.8, 12.2], [4.6, 10.6], [3.4, 8.8]],
  cabWin: [[11.4, 8.4], [11.4, 11.4], [14.0, 11.4], [14.0, 8.4]],
  bottom: (L) => [[1.0, 2.9], [L - 0.3, 2.9]], trucks: (L) => [[11.0, 8.2, 33], [L - 11.0, 8.2, 33]],
  wins: (L) => [[17.4, 26.4], [32.0, 41.0], [41.6, 50.6], [51.2, 60.2], [70.6, 79.6]].map(([a, b]) => [a, b, 6.0, 10.4, 0.5]),
  doors: (L) => [[26.9, 4.3], [L - 22.4, 4.3]], roofKit: [[16.0, 12.0, 0.9], [-20.0, 10.0, 0.9]], pan: -18.0,
};
const HC_MID = {
  roof: 15.2, nose: null, doorY: [1.3, 9.2], truckTop: 3.4, gangway: [3.6, 13.4],
  bottom: (L) => [[0.3, 3.4], [17.0, 3.4], ["s", [17.0, 3.4], [17.6, 1.8], [18.2, 1.2]], [L - 18.2, 1.2], ["s", [L - 18.2, 1.2], [L - 17.6, 1.8], [L - 17.0, 3.4]], [L - 0.3, 3.4]],
  wins: (L) => [[27.6, 33.4, 3.2, 6.0], [34.4, 40.2, 3.2, 6.0], [41.2, 47.0, 3.2, 6.0], [48.0, 53.8, 3.2, 6.0], [27.6, 33.4, 10.2, 12.8], [34.4, 40.2, 10.2, 12.8], [41.2, 47.0, 10.2, 12.8], [48.0, 53.8, 10.2, 12.8],
    [2.6, 9.0, 6.4, 9.3], [L - 9.0, L - 2.6, 6.4, 9.3]].map(([a, b, y0, y1]) => [a, b, y0, y1, 0.45]),
  doors: (L) => [[19.0, 5.6], [L - 24.6, 5.6]], trucks: (L) => [[9.0, 8.2, 33], [L - 9.0, 8.2, 33]], roofKit: [[3.0, 10.0, 0.7], [-13.0, 10.0, 0.7]],
};
const HC_PAINT = {
  arvby: { base: AB.blue, door: AB.wave, roofKit: AB.roof, winEdge: "#0c0d0e", frame: 0.25,
    paint: (c, { L, S, cab }) => {
      const [[x0, w]] = S.doors(L);
      return rect(-1, 0, L + 2, 20, AB.blue) + rect(-1, 0, L + 2, cab ? 2.9 : 1.2, "#33373b") + (cab ? abWave(16.0, x0, x0 + w, 1) : abWave(L - 2.0, L - 24.6, L - 19.0, -1));
    },
    marks: (c, { L, S, cab, first }) => {
      const [[x0, w]] = S.doors(L);
      return cab ? arverioLogo(c, 21.6, 12.6, 1.75, "#ffffff", { bayern: true, wave: "#ffffff" }) + bikeIcon(x0 + w / 2, 11.9, 0.8, "#ffffff", 0.12) + (first ? rect(17.4, 10.85, 9.0, 0.36, "#f2c418") : "") : "";
    } },
};
// The battery Mireo Plus B (two cars, 46.56 m): the SWEG's 563 001-027
// (Ortenau, bwegt) and HLB's three (563 801-803; RB 90, RB 29). One door
// a side on the A car, two on the B car (the toilet between them).
const MPB_A = { ...MIREO_END, wins: (L) => [[16.6, 21.6], [22.9, 27.9], [29.2, 34.2], [42.4, 47.4], [48.7, 53.7], [55.0, 60.0], [61.3, 66.3], [67.6, 72.6]].map(([a, b]) => [a, b, 6.0, 10.3]),
  doors: [[36.0, 4.6]], pan: -6.0 };
const MPB_B = { ...MIREO_END, wins: (L) => [[16.6, 21.6], [22.9, 27.9], [29.2, 34.2], [44.0, 49.0], [50.3, 55.3], [67.4, 72.4]].map(([a, b]) => [a, b, 6.0, 10.3]),
  doors: [[37.6, 4.6], [59.6, 4.6]], pan: null };
MIREO_PAINT.bwegt = {
  base: BW.white, door: BW.yellow, roofKit: "#4c5055", winEdge: "#0e0f10",
  paint: (c, { L, cab, S }) => rect(-1, 0, L + 2, 20, BW.white) + rect(-1, 11.4, L + 2, 4, BW.yellow) + rect(15.8, 5.4, L - 14.8, 5.6, BW.black) + rect(-1, 0, L + 2, 2.6, BW.skirt) +
    path(outline([[-1, 4.4], [4.4, 4.4], ["s", [4.4, 4.4], [5.6, 8.4], [8.4, 11.6], [12.4, 13.4]], [12.4, 16], [-1, 16]]), BW.yellow),
  marks: (c, { L }) => bwLion(17.6, 3.0, 2.0, BW.lion, 0.8) + bwegtLogo(c, 27.6, 4.0, 1.25, { bw: BW.ink }) + bwegtLogo(c, 13.0, 6.2, 0.7, { bw: BW.ink }) + bikeIcon(L - 30.0, 3.8, 1.4, "#e0b400"),
};
MIREO_PAINT.hlb = {
  base: HLB.silver, door: HLB.red, roofKit: "#55595e", winEdge: "#0e0f10", frame: 0.18,
  paint: (c, { L }) => rect(-1, 0, L + 2, 20, HLB.silver) + rect(-1, 12.0, L + 2, 4, HLB.red) + rect(-1, 0, L + 2, 2.6, "#7c8187") +
    path(outline([[-1, 0], [28.0, 0], ["s", [28.0, 0], [25.0, 6.5], [20.6, 11.0], [15.5, 13.4]], [-1, 16]]), HLB.red) +
    path(outline([[-1, 0], [20.8, 0], ["s", [20.8, 0], [19.2, 6.0], [16.0, 10.8], [13.4, 12.6]], [-1, 12.6]]), HLB.yellow) + rect(-1, 0, 30, 2.6, "#7c8187"),
  marks: (c) => hlbLogo(c, 16.6, 7.4, 1.0),
};

// ===================== More paints =====================
// Transdev's Regio-Shuttles on the Hunsrückbahn and the Moselweinbahn (RB
// 37, RB 85; ex-Rhenus Veniro; photograph of 650 352 at Bullay 2024):
// white, the cab ends and a band over the roof's edge blue, a thin blue
// line under the windows, yellow doors; "HunsrückBahn" on the side.
RS1_PAINT.transdev = {
  base: "#f1f2f3", door: "#f2c400", maskFill: "#1b1d20", winEdge: "#0e0f10",
  paint: (c, { L }) => rect(-1, 0, L + 2, 20, "#f1f2f3") + rect(-1, 11.6, L + 2, 4, "#2b6cc0") + rect(22.6, 6.0, L - 45.2, 4.4, "#1c1e21") + rect(-1, 5.2, L + 2, 0.55, "#2b6cc0") + rect(-1, 0, L + 2, 3.0, "#3a3e42") +
    path(outline([[-1, 3.0], [8.6, 3.0], ["s", [8.6, 3.0], [9.4, 8.0], [8.8, 12.0]], [8.8, 15], [-1, 15]]), "#2b6cc0"),
  marks: (c, { L }) => letters(c, 15.4, 4.4, 0.8, "HunsrückBahn", "#2b6cc0", { weight: 700 }),
};
// WEG's Tälesbahn, Teckbahn and Wieslauftalbahn units (Transdev; photograph
// of VT 447 2023): white, a dark blue band low along the side rising over
// the cab, yellow doors; "Tälesbahn" and the Verbund's marks.
RS1_PAINT.weg = {
  base: "#f1f2f3", door: "#f2d21b", maskFill: "#1b1d20", winEdge: "#0e0f10",
  paint: (c, { L }) => rect(-1, 0, L + 2, 20, "#f1f2f3") + rect(-1, 0, L + 2, 4.6, "#1f2d6e") + path(outline([[-1, 4.6], [14.0, 4.6], ["s", [14.0, 4.6], [11.0, 9.0], [9.6, 14.0]], [-1, 14]]), "#1f2d6e"),
  marks: () => "",
};
// The ex-Abellio units VIAS runs in Nordrhein-Westfalen (FLIRT 3 ET 25
// 22xx/23xx on RE 19 and RB 35, the first FLIRTs 22 11xx and 23 11xx on RE
// 16, RB 46 and RB 91; photographs of ET 25 2206 at Voerde 2026, 23 1109 at
// Bochum 2025): silver-white, the windows in a black band, a red wedge
// sweeping down behind each cab, red doors, a thin red line over the
// band; VIAS's mark (white "VIAS" and its arrow on a blue tag) on the nose
// and small behind the cab.
const ABL = { white: "#eceef0", red: "#d3122a", black: "#1c1e21" };
const viasTag = (c, x, y, h, color = "#1f5fc0") => mark(c, x, y, txt(-h * 0.35, 0.02 * h, h * 0.9, "VIAS", color, { weight: 800, style: "italic" }) +
  `<path d="M${n(h * 0.95)} ${n(-h * 0.32)}L${n(h * 1.35)} ${n(-h * 0.32)}L${n(h * 1.75)} 0L${n(h * 1.35)} ${n(h * 0.32)}L${n(h * 0.95)} ${n(h * 0.32)}L${n(h * 1.3)} 0Z" fill="${color}"/>`);
const abellioPaint = (cabEdge) => ({
  base: ABL.white, door: ABL.red, roofKit: "#55595e", winEdge: "#0e0f10",
  paint: (c, { L, cab }) => rect(-1, 0, L + 2, 20, ABL.white) + rect(-1, 4.4, L + 2, 5.6, ABL.black) + rect(-1, 10.3, L + 2, 0.18, ABL.red) + rect(-1, 0, L + 2, 2.2, "#3a3e42") +
    (cab ? rect(-1, 2.2, cabEdge + 6.0, 7.8, ABL.black) + path(poly([[cabEdge + 1.0, 10.0], [cabEdge + 1.8, 10.0], [cabEdge + 5.0, 2.2], [cabEdge - 1.0, 2.2]]), ABL.red) : ""),
  marks: (c, { cab }) => (cab ? viasTag(c, 3.6, 4.0, 0.7) : ""),
});
FLIRT3_PAINT.abellio = { ...abellioPaint(20.3), marks: (c, { cab, first }) => (cab ? viasTag(c, 22.0, 10.8, 0.6) + (first ? letters(c, 26.6, 8.6, 1.0, "1", "#ffffff", { weight: 600 }) : "") : "") };
F1_PAINT.abellio = abellioPaint(12.8);
// VIAS's LINTs on RB 34 and RB 39 (photograph at Dalheim 2021): silver-
// white, a dark blue band low along the side; VIAS's mark.
LINT_PAINT.vias = {
  base: ABL.white, door: ABL.white, maskFill: "#1b1d20", winEdge: "#0e0f10",
  paint: (c, { L }) => rect(-1, 0, L + 2, 20, ABL.white) + rect(-1, 0, L + 2, 3.6, "#1f2d6e"),
  marks: (c, { cab }) => (cab ? viasTag(c, 3.2, 4.6, 0.5) : ""),
};
// VIAS's FLIRT 3XLs for the RE 19 Frankfurt-Koblenz (late from Stadler;
// the line now starts in December 2026). No photograph of one exists yet:
// drawn from Stadler's own rendering (January 2023, as published by
// railtarget.eu): the cab end blue back past the first windows, a few thin
// white lines on the blue, a yellow line over the first-class windows;
// a white body, teal doors, a big white-outlined bicycle by the doors.
const VXL = { blue: "#2c5cb4", white: "#eef1f6", teal: "#3aa58f", yellow: "#f2c400" };
FLIRT3_PAINT.vias = {
  base: VXL.white, door: VXL.teal, roofKit: "#4a4f55", winEdge: "#0e0f10",
  paint: (c, { L, cab, first }) => rect(-1, 0, L + 2, 20, VXL.white) + rect(-1, 0, L + 2, 2.2, "#3a3e42") +
    (cab ? path(poly([[-1, 0], [33.0, 0], [33.0, 9.6], [32.2, 12.0], [32.2, 16], [-1, 16]]), VXL.blue) +
      lines([[20.4, 2.4, 25.0, 10.2], [25.0, 10.2, 31.0, 4.6], [14.0, 11.8, 20.4, 2.4], [26.5, 2.4, 31.0, 4.6]], "rgba(255,255,255,0.55)", 0.5) +
      (first ? rect(20.6, 9.75, 11.0, 0.3, VXL.yellow) : "") : ""),
  marks: (c, { cab, lay }) => bikeIcon(lay.door + 8.0, 3.4, 1.8, "#3a4a6a", 0.06),
};
// SWEG's Talent 3s on the Breisgau S-Bahn (8442; S 2, S 3, S 5): bwegt.
T3_PAINT.bwegt = {
  base: BW.white, door: BW.yellow, roofKit: "#4c5055", winEdge: "#0e0f10",
  paint: (c, { L, cab }) => rect(-1, 0, L + 2, 20, BW.white) + rect(-1, 11.4, L + 2, 4, BW.yellow) + rect(cab ? 12.4 : -1, 4.3, L + 2, 6.4, BW.black) + rect(-1, 0, L + 2, 2.4, BW.skirt) +
    (cab ? path(outline([[-1, 4.4], [5.0, 4.4], ["s", [5.0, 4.4], [6.2, 8.2], [9.4, 11.6]], [9.4, 15], [-1, 15]]), BW.yellow) : ""),
  marks: (c, { cab }) => (cab ? bwegtLogo(c, 16.8, 3.3, 0.9, { bw: BW.ink }) : ""),
};

// ===================== CAF Nexio (Schönbuchbahn) =====================
// CAF's Nexio for the Schönbuchbahn (WEG, 455 501-512, 2023-2025): three
// sections, 39 m, the middle one short; the Schönbuchbahn's paint
// (photograph of 455 513 at Böblingen): white, the cab yellow with a red
// line sweeping back from it along the window band's top, a thin red line
// under the windows; "Schönbuchbahn" on the side.
const NX_NOSE = [[6.4, 12.6], [4.6, 12.45], [3.3, 11.8], [2.3, 10.6], [1.6, 9.0], [1.2, 7.2], [1.05, 5.4], [1.1, 3.6], [1.6, 2.6]];
const NEXIO_END = {
  roof: 12.6, nose: NX_NOSE, doorY: [1.4, 9.6], truckTop: 2.6, coupler: 2.9, reach: 1.0, lamps: [[1.05, 4.7], [1.1, 4.05, true]], gangway: [1.4, 11.8],
  mask: [[1.4, 6.8], [1.9, 8.6], [2.6, 10.2], [3.6, 11.4], [5.0, 12.05], [6.3, 12.1], [6.1, 11.3], [5.0, 11.1], [4.0, 10.0], [3.3, 8.4], [2.7, 6.9]],
  glass: [[1.9, 7.3], [2.4, 8.8], [3.1, 10.1], [4.0, 11.1], [5.1, 11.6], [4.9, 10.8], [4.0, 9.8], [3.4, 8.4], [2.9, 7.3]],
  bottom: (L) => [[1.6, 2.6], [10.6, 2.6], ["s", [10.6, 2.6], [11.2, 1.6], [11.8, 1.3]], [L - 0.3, 1.3]],
  wins: (L) => [[8.0, 11.0, 5.4, 9.2], [18.4, 23.4], [24.4, 29.4], [30.4, 35.4], [36.4, L - 1.2]].map(([a, b, y0 = 4.4, y1 = 9.4]) => [a, b, y0, y1, 0.4]),
  doors: [[12.6, 4.4]], trucks: (L) => [[6.8, 6.6, 28]], roofKit: [[7.0, 9.0, 0.9], [22.0, 12.0, 0.9]],
};
const NEXIO_MID = { roof: 12.6, nose: null, doorY: [1.4, 9.6], truckTop: 2.6, gangway: [1.4, 11.8], bottom: (L) => [[0.3, 1.3], [L - 0.3, 1.3]],
  wins: (L) => [[2.0, 7.0, 4.4, 9.4, 0.4], [L - 7.0, L - 2.0, 4.4, 9.4, 0.4]], doors: (L) => [[L / 2 - 2.2, 4.4]], trucks: (L) => [[0.4, 6.6, 28], [L - 0.4, 6.6, 28]], roofKit: [[3.0, 12.0, 1.0]] };
const NEXIO_PAINT = {
  weg: { base: "#f3f4f5", door: "#f2c400", roofKit: "#55595e", winEdge: "#0e0f10",
    paint: (c, { L, cab }) => rect(-1, 0, L + 2, 20, "#f3f4f5") + rect(-1, 11.4, L + 2, 4, "#f2c400") + rect(-1, 10.9, L + 2, 0.4, "#e3001b") + rect(-1, 9.75, L + 2, 0.32, "#e3001b") + rect(-1, 3.95, L + 2, 0.2, "#e3001b") + rect(-1, 0, L + 2, 2.4, "#3a3e42") +
      (cab ? path(outline([[-1, 2.4], [7.6, 2.4], ["s", [7.6, 2.4], [8.6, 7.0], [10.6, 11.2], [14.0, 12.6]], [-1, 13]]), "#f2c400") + path(outline([["s", [7.4, 12.6], [10.2, 11.0], [14.0, 10.1], [18.0, 9.75]], [18.0, 10.07], ["s", [18.0, 10.07], [14.0, 10.5], [10.6, 11.5], [8.4, 12.6]]]), "#e3001b") : ""),
    marks: (c, { cab }) => (cab ? letters(c, 22.0, 5.4, 0.85, "Schönbuchbahn", "#4a4f55", { weight: 700 }) : "") },
};

// ===================== Bayerische Zugspitzbahn =====================
// The Zugspitzbahn's articulated rack railcars (Stadler, 2006; Nr. 12,
// 14-16), metre gauge, two sections; white, a blue band low along the
// side rising toward the back, the Bavarian arms on the front.
const BZ_NOSE = [[4.4, 11.6], [2.6, 11.5], [1.6, 11.0], [1.0, 9.8], [0.7, 8.0], [0.6, 6.0], [0.6, 4.2], [0.9, 2.9]];
const BZB = {
  roof: 11.6, nose: BZ_NOSE, doorY: [2.4, 9.2], truckTop: 2.6, coupler: 2.6, reach: 0.6, lamps: [[0.6, 4.6], [0.62, 4.0, true]], gangway: [2.4, 10.8],
  mask: [[0.8, 6.4], [1.0, 8.6], [1.6, 10.4], [2.6, 11.2], [4.2, 11.3], [4.0, 10.6], [3.0, 10.4], [2.4, 9.4], [2.1, 8.0], [1.9, 6.4]],
  glass: [[1.1, 6.8], [1.3, 8.6], [1.8, 10.0], [2.6, 10.7], [3.6, 10.8], [3.4, 10.1], [2.7, 9.6], [2.3, 8.4], [2.1, 6.8]],
  bottom: (L) => [[0.9, 2.9], [L - 0.3, 2.9]], wins: (L) => [[9.6, 13.4], [14.6, 18.4], [19.6, 23.4], [24.6, 28.4], [29.6, 33.4], [34.6, 38.4], [39.6, 43.4], [44.6, 48.4], [49.6, 53.4]].filter(([, b]) => b < L - 1).map(([a, b]) => [a, b, 6.0, 9.4, 0.4]),
  doors: [[5.0, 3.8]], trucks: (L) => [[8.0, 6.2, 26], [L, 6.2, 26]], roofKit: [[6.0, 10.0, 0.8]],
};
const BZB_PAINT = { base: "#f3f4f5", door: "#f3f4f5", roofKit: "#55595e", winEdge: "#0e0f10",
  paint: (c, { L }) => rect(-1, 0, L + 2, 20, "#f3f4f5") + path(outline([[-1, 2.9], [L + 1, 2.9], [L + 1, 6.4], ["s", [L + 1, 6.4], [L * 0.5, 5.6], [6.0, 4.6], [-1, 4.5]]]), "#2a8fd8") +
    path(outline([["s", [-1, 4.5], [6.0, 4.6], [L * 0.5, 5.6], [L + 1, 6.4]], [L + 1, 6.75], ["s", [L + 1, 6.75], [L * 0.5, 5.95], [6.0, 4.95], [-1, 4.85]]]), "#1f3f8f"),
  marks: () => "" };

// ===================== alex (Die Länderbahn) =====================
// The RE 25 München-Regensburg-Schwandorf-Furth im Wald (-Praha):
// between München and Regensburg one of Beacon Rail's black Taurus
// locomotives (ES64U2, 182 5xx, since December 2023; photographed at
// Feldmoching, December 2025): black, a yellow line low along the side,
// Beacon's yellow ring behind one cab. Beyond Regensburg Die Länderbahn's
// ER20 diesel (223, drawn in czechia.cars.js); ČD's coaches and the alex
// coaches (ex-Eurofima, silver with the orange-yellow line) throughout.
const NOSE_TAURUS = [[1.7, 4.1], [1.1, 6.3], ["q", 0.95, 8.5, 2.3, 9.3], [3.9, 12.15], ["q", 4.6, 13.0, 6.4, 13.0]];
const beaconTaurus = (c) => euroLoco(c, { roof: 13.0, sill: 4.1, nose: NOSE_TAURUS, rake: [[2.3, 9.3], [3.9, 12.15]], centers: 32.5, door: 7.2, wheel: 45,
  paint: (cc, L) => rect(-1, 0, L + 2, 20, "#1f2123") + rect(-1, 5.3, L + 2, 0.22, "#e2b417") + rect(-1, 4.1, L + 2, 0.4, "#121314"),
  over: (cc, L) => [1.85, 1.35, 0.85].map((r) => `<circle cx="${n(L * 0.27)}" cy="8.3" r="${r}" fill="none" stroke="#d9b13a" stroke-width="0.3"/>`).join("") +
    letters(cc, L - 8.0, 5.9, 0.5, "BEACON", "#d9d4c4", { weight: 700, spacing: "0.06em" }),
  surround: "#141518", grilles: [[-16.5, 4.2, 11.0, 12.3], [-1.5, 2.6, 11.0, 12.3], [9.5, 2.4, 11.0, 12.3], [12.3, 2.4, 11.0, 12.3]], grilleFill: "rgba(80,82,86,0.55)" });

// ===================== Tables =====================
export const TYPES = {};
export const MODELS = {};
const M = (draw, len, oneEnd = false) => ({ draw, len, oneEnd });
const add = (key, type, model) => { TYPES[key] = type; MODELS[key] = model; };
// Arverio Baden-Württemberg's FLIRT 3s (bwegt).
add("abwF3A", { name: "Arverio BW FLIRT 3 (bwegt) end car, 1st and 2nd class", kind: "emu", amenities: ["first", "bikes"] }, M((c) => flirt3(c, "A", FLIRT3_PAINT.bwegt, { first: true, pan: true }), F3.end, true));
add("abwF3B", { name: "Arverio BW FLIRT 3 (bwegt) end car", kind: "emu", amenities: ["bikes"] }, M((c) => flirt3(c, "B", FLIRT3_PAINT.bwegt, { pan: false }), F3.end, true));
add("abwF3M1", { name: "Arverio BW FLIRT 3 (bwegt) middle car", kind: "emu" }, M((c) => flirt3(c, "m1", FLIRT3_PAINT.bwegt), F3.mid));
add("abwF3M2", { name: "Arverio BW FLIRT 3 (bwegt) middle car", kind: "emu", amenities: ["bikes"] }, M((c) => flirt3(c, "m2", FLIRT3_PAINT.bwegt), F3.mid));
// Arverio Bayern's FLIRT 3s (four cars).
add("abyF3A", { name: "Arverio Bayern FLIRT 3 end car, 1st and 2nd class", kind: "emu", amenities: ["first", "bikes"] }, M((c) => flirt3(c, "A", FLIRT3_PAINT.arvby, { first: true, pan: true }), F3.end, true));
add("abyF3B", { name: "Arverio Bayern FLIRT 3 end car", kind: "emu", amenities: ["bikes"] }, M((c) => flirt3(c, "B", FLIRT3_PAINT.arvby, { pan: false }), F3.end, true));
add("abyF3M1", { name: "Arverio Bayern FLIRT 3 middle car", kind: "emu" }, M((c) => flirt3(c, "m1", FLIRT3_PAINT.arvby), F3.mid));
add("abyF3M2", { name: "Arverio Bayern FLIRT 3 middle car", kind: "emu", amenities: ["bikes"] }, M((c) => flirt3(c, "m2", FLIRT3_PAINT.arvby), F3.mid));

// The BRB's FLIRT 3s: ex-Meridian (Chiemgau-Inntal) and its own (RB 53).
add("merF3A", { name: "BRB FLIRT 3 (ex-Meridian) end car, 1st and 2nd class", kind: "emu", amenities: ["first", "bikes"] }, M((c) => flirt3(c, "A", FLIRT3_PAINT.meridian, { first: true, pan: true }), F3.end, true));
add("merF3B", { name: "BRB FLIRT 3 (ex-Meridian) end car", kind: "emu", amenities: ["bikes"] }, M((c) => flirt3(c, "B", FLIRT3_PAINT.meridian, { pan: false }), F3.end, true));
add("merF3M1", { name: "BRB FLIRT 3 (ex-Meridian) middle car", kind: "emu" }, M((c) => flirt3(c, "m1", FLIRT3_PAINT.meridian), F3.mid));
add("merF3M2", { name: "BRB FLIRT 3 (ex-Meridian) middle car", kind: "emu", amenities: ["bikes"] }, M((c) => flirt3(c, "m2", FLIRT3_PAINT.meridian), F3.mid));
add("brbF3A", { name: "BRB FLIRT 3 end car", kind: "emu", amenities: ["bikes"] }, M((c) => flirt3(c, "A", FLIRT3_PAINT.brb, { pan: true }), F3.end, true));
add("brbF3B", { name: "BRB FLIRT 3 end car", kind: "emu", amenities: ["bikes"] }, M((c) => flirt3(c, "B", FLIRT3_PAINT.brb, { pan: false }), F3.end, true));
add("brbF3M1", { name: "BRB FLIRT 3 middle car", kind: "emu" }, M((c) => flirt3(c, "m1", FLIRT3_PAINT.brb), F3.mid));

// Arverio Bayern's Mireos (three cars).
add("abyMiA", { name: "Arverio Bayern Mireo end car, 1st and 2nd class", kind: "emu", amenities: ["first", "bikes"] }, M((c) => emuCar(c, MIREO_END, MIREO_PAINT.arvby, { first: true }), 82.0, true));
add("abyMiB", { name: "Arverio Bayern Mireo end car", kind: "emu", amenities: ["bikes"] }, M((c) => emuCar(c, MIREO_END, MIREO_PAINT.arvby), 82.0, true));
add("abyMiM", { name: "Arverio Bayern Mireo middle car (pantograph)", kind: "emu", amenities: ["bikes"] }, M((c) => emuCar(c, MIREO_MID, MIREO_PAINT.arvby, { pan: true }), 65.6));

// Regio-Shuttles.
const RS1_NAMES = { agilis: "agilis", waldbahn: "waldbahn (Die Länderbahn)", opb: "oberpfalzbahn (Die Länderbahn)", bwegt: "SWEG (bwegt)", strohgaeu: "WEG Strohgäubahn" };
for (const [p, name] of Object.entries(RS1_NAMES)) add(`rs1${p[0].toUpperCase()}${p.slice(1)}`, { name: `Regio-Shuttle RS1, ${name}`, kind: "emu" }, M(rs1Car(RS1_PAINT[p]), 83.7));
// LINTs.
const LINT_NAMES = { brb: "BRB", opb: "oberpfalzbahn", bwegt: "SWEG (bwegt)", vlexx: "vlexx", hlb: "HLB", rrb: "RheinRuhrBahn" };
for (const [p, name] of Object.entries(LINT_NAMES)) {
  const P = p[0].toUpperCase() + p.slice(1), k = LINT_PAINT[p];
  add(`l41${P}`, { name: `Coradia LINT 41, ${name}`, kind: "emu" }, M((c) => emuCar(c, LINT41, k), 68.7, true));
  add(`l54${P}`, { name: `Coradia LINT 54, ${name}`, kind: "emu" }, M((c) => emuCar(c, LINT54, k), 89.0, true));
  add(`l81${P}`, { name: `Coradia LINT 81 middle car, ${name}`, kind: "emu" }, M((c) => emuCar(c, LINT81M, k), 89.0));
}
// The cars with first class behind the cab (the BRB's and HLB's units).
for (const [P, name] of [["Brb", "BRB"], ["Hlb", "HLB"]]) {
  const k = LINT_PAINT[P.toLowerCase()];
  add(`l41${P}F`, { name: `Coradia LINT 41, ${name}, 1st and 2nd class`, kind: "emu", amenities: ["first"] }, M((c) => emuCar(c, LINT41, k, { first: true }), 68.7, true));
  add(`l54${P}F`, { name: `Coradia LINT 54, ${name}, 1st and 2nd class`, kind: "emu", amenities: ["first"] }, M((c) => emuCar(c, LINT54, k, { first: true }), 89.0, true));
}

// Mireos: agilis (four cars), the MittelrheinBahn (three), Mireo Plus B.
add("agMiA", { name: "agilis Mireo end car, 1st and 2nd class", kind: "emu", amenities: ["first", "bikes"] }, M((c) => emuCar(c, MIREO_END, MIREO_PAINT.agilis, { first: true }), 82.0, true));
add("agMiB", { name: "agilis Mireo end car", kind: "emu", amenities: ["bikes"] }, M((c) => emuCar(c, MIREO_END, MIREO_PAINT.agilis), 82.0, true));
add("agMiM", { name: "agilis Mireo middle car", kind: "emu", amenities: ["bikes"] }, M((c) => emuCar(c, MIREO_MID, MIREO_PAINT.agilis, { pan: true }), 65.6));
add("trMiA", { name: "MittelrheinBahn Mireo end car, 1st and 2nd class", kind: "emu", amenities: ["first", "bikes"] }, M((c) => emuCar(c, MIREO_END, MIREO_PAINT.transregio, { first: true }), 82.0, true));
add("trMiB", { name: "MittelrheinBahn Mireo end car", kind: "emu", amenities: ["bikes"] }, M((c) => emuCar(c, MIREO_END, MIREO_PAINT.transregio), 82.0, true));
add("trMiM", { name: "MittelrheinBahn Mireo middle car", kind: "emu", amenities: ["bikes"] }, M((c) => emuCar(c, MIREO_MID, MIREO_PAINT.transregio, { pan: true }), 65.6));
add("swMpbA", { name: "SWEG Mireo Plus B (bwegt) car with the pantograph", kind: "emu", amenities: ["bikes"] }, M((c) => emuCar(c, MPB_A, MIREO_PAINT.bwegt, { pan: true }), 76.4, true));
add("swMpbB", { name: "SWEG Mireo Plus B (bwegt) car", kind: "emu", amenities: ["bikes"] }, M((c) => emuCar(c, MPB_B, MIREO_PAINT.bwegt), 76.4, true));
add("hlbMpbA", { name: "HLB Mireo Plus B car with the pantograph", kind: "emu", amenities: ["bikes"] }, M((c) => emuCar(c, MPB_A, MIREO_PAINT.hlb, { pan: true }), 76.4, true));
add("hlbMpbB", { name: "HLB Mireo Plus B car", kind: "emu", amenities: ["bikes"] }, M((c) => emuCar(c, MPB_B, MIREO_PAINT.hlb), 76.4, true));
// Desiro HC (Arverio Bayern, five cars).
add("abyHcA", { name: "Arverio Bayern Desiro HC end car, 1st and 2nd class", kind: "emu", amenities: ["first"] }, M((c) => emuCar(c, HC_END, HC_PAINT.arvby, { first: true, pan: true }), 86.0, true));
add("abyHcB", { name: "Arverio Bayern Desiro HC end car", kind: "emu" }, M((c) => emuCar(c, HC_END, HC_PAINT.arvby, { pan: false }), 86.0, true));
add("abyHcM", { name: "Arverio Bayern Desiro HC double-deck middle car", kind: "emu", amenities: ["bikes"] }, M((c) => emuCar(c, HC_MID, HC_PAINT.arvby), 82.7));
// Coradia Continental: agilis and HLB.
add("agCcA", { name: "agilis Coradia Continental (440) end car, 1st and 2nd class", kind: "emu", amenities: ["first"] }, M((c) => emuCar(c, CC_AG_END, CC_PAINT.agilis, { first: true, pan: true }), 67.9, true));
add("agCcB", { name: "agilis Coradia Continental (440) end car", kind: "emu" }, M((c) => emuCar(c, CC_AG_END, CC_PAINT.agilis, { pan: false }), 67.9, true));
add("agCcM", { name: "agilis Coradia Continental (440) middle car", kind: "emu", amenities: ["bikes"] }, M((c) => emuCar(c, CC_MID, CC_PAINT.agilis), 53.8));
add("hlbCcA", { name: "HLB Coradia Continental (1440) end car, 1st and 2nd class", kind: "emu", amenities: ["first"] }, M((c) => emuCar(c, CC_HLB_END, CC_PAINT.hlb, { first: true, pan: true }), 67.9, true));
add("hlbCcB", { name: "HLB Coradia Continental (1440) end car", kind: "emu" }, M((c) => emuCar(c, CC_HLB_END, CC_PAINT.hlb, { pan: false }), 67.9, true));
add("hlbCcM", { name: "HLB Coradia Continental (1440) middle car", kind: "emu", amenities: ["bikes"] }, M((c) => emuCar(c, CC_MID, CC_PAINT.hlb), 53.8));
// The first FLIRTs: HLB, VIAS, the BRB's ex-BLB.
for (const [p, name] of [["hlb", "HLB FLIRT (429)"], ["vias", "VIAS FLIRT"], ["blb", "BRB FLIRT (ex-BLB)"]]) {
  add(`${p}F1A`, { name: `${name} end car`, kind: "emu" }, M((c) => emuCar(c, F1_END, F1_PAINT[p], { pan: true }), 70.2, true));
  add(`${p}F1B`, { name: `${name} end car`, kind: "emu" }, M((c) => emuCar(c, F1_END, F1_PAINT[p], { pan: false }), 70.2, true));
  add(`${p}F1M`, { name: `${name} middle car`, kind: "emu" }, M((c) => emuCar(c, F1_MID, F1_PAINT[p]), 51.3));
}
// Talent 3 (vlexx), Talent (BOB), Desiro ML (MittelrheinBahn), Itino
// (VIAS), GTW (HLB, Westerwaldbahn), Integral (Regiobahn).
add("vxT3A", { name: "vlexx Talent 3 end car", kind: "emu" }, M((c) => emuCar(c, T3_END, T3_PAINT.vlexx, { pan: true }), 67.6, true));
add("vxT3M", { name: "vlexx Talent 3 middle car", kind: "emu" }, M((c) => emuCar(c, T3_MID, T3_PAINT.vlexx), 48.9));
add("bobTal", { name: "BOB Talent (426) car", kind: "emu" }, M((c) => emuCar(c, TALENT, TALENT_PAINT.bob, { pan: c.index % 2 === 0 }), 56.8, true));
add("trDmlA", { name: "MittelrheinBahn Desiro ML (460) end car", kind: "emu", amenities: ["first"] }, M((c) => emuCar(c, DML_END, DML_PAINT.transregio, { first: true, pan: true }), 83.3, true));
add("trDmlM", { name: "MittelrheinBahn Desiro ML (460) middle car", kind: "emu" }, M((c) => emuCar(c, DML_MID, DML_PAINT.transregio), 79.4));
add("viItino", { name: "VIAS Itino (615) car", kind: "emu" }, M((c) => emuCar(c, ITINO, ITINO_PAINT.vias), 84.9, true));
for (const p of ["hlb", "weba"]) {
  add(`${p}GtwA`, { name: `${p === "hlb" ? "HLB" : "Westerwaldbahn"} GTW 2/6 end car`, kind: "emu" }, M((c) => emuCar(c, GTW_END, GTW_PAINT[p]), 58.9, true));
  add(`${p}GtwMod`, { name: `${p === "hlb" ? "HLB" : "Westerwaldbahn"} GTW 2/6 power module`, kind: "module" }, M((c) => emuCar(c, GTW_MOD, GTW_PAINT[p]), 16.1));
}
add("rbIntA", { name: "Regiobahn Integral end section", kind: "emu", amenities: ["first"] }, M((c) => emuCar(c, INT_END, INT_PAINT.regiobahn), 41.0, true));
add("rbIntS", { name: "Regiobahn Integral section", kind: "emu" }, M((c) => emuCar(c, INT_SUS, INT_PAINT.regiobahn), 30.8));
add("rbIntM", { name: "Regiobahn Integral middle section", kind: "emu" }, M((c) => emuCar(c, INT_MID, INT_PAINT.regiobahn), 31.4));

// More Regio-Shuttles, LINTs, FLIRTs; the Nexio, the Zugspitzbahn's
// railcars; Talent 3 (bwegt).
add("rs1Transdev", { name: "Regio-Shuttle RS1, Transdev (HunsrückBahn)", kind: "emu" }, M(rs1Car(RS1_PAINT.transdev), 83.7));
add("rs1Weg", { name: "Regio-Shuttle RS1, WEG", kind: "emu" }, M(rs1Car(RS1_PAINT.weg), 83.7));
add("l41Vias", { name: "Coradia LINT 41, VIAS", kind: "emu" }, M((c) => emuCar(c, LINT41, LINT_PAINT.vias), 68.7, true));
add("l54Vias", { name: "Coradia LINT 54, VIAS", kind: "emu" }, M((c) => emuCar(c, LINT54, LINT_PAINT.vias), 89.0, true));
add("viF3A", { name: "VIAS FLIRT 3 end car, 1st and 2nd class", kind: "emu", amenities: ["first", "bikes"] }, M((c) => flirt3(c, "A", FLIRT3_PAINT.abellio, { first: true, pan: true }), F3.end, true));
add("viF3B", { name: "VIAS FLIRT 3 end car", kind: "emu", amenities: ["bikes"] }, M((c) => flirt3(c, "B", FLIRT3_PAINT.abellio, { pan: false }), F3.end, true));
add("viF3M1", { name: "VIAS FLIRT 3 middle car", kind: "emu" }, M((c) => flirt3(c, "m1", FLIRT3_PAINT.abellio), F3.mid));
add("viF3M2", { name: "VIAS FLIRT 3 middle car", kind: "emu", amenities: ["bikes"] }, M((c) => flirt3(c, "m2", FLIRT3_PAINT.abellio), F3.mid));
add("vxlF3A", { name: "VIAS FLIRT 3XL end car, 1st and 2nd class", kind: "emu", amenities: ["first", "bikes"] }, M((c) => flirt3(c, "A", FLIRT3_PAINT.vias, { first: true, pan: true }), F3.end, true));
add("vxlF3B", { name: "VIAS FLIRT 3XL end car", kind: "emu", amenities: ["bikes"] }, M((c) => flirt3(c, "B", FLIRT3_PAINT.vias, { pan: false }), F3.end, true));
add("vxlF3M1", { name: "VIAS FLIRT 3XL middle car", kind: "emu" }, M((c) => flirt3(c, "m1", FLIRT3_PAINT.vias), F3.mid));
add("vxlF3M2", { name: "VIAS FLIRT 3XL middle car", kind: "emu", amenities: ["bikes"] }, M((c) => flirt3(c, "m2", FLIRT3_PAINT.vias), F3.mid));
add("abellioF1A", { name: "VIAS FLIRT (ex-Abellio) end car", kind: "emu" }, M((c) => emuCar(c, F1_END, F1_PAINT.abellio, { pan: true }), 70.2, true));
add("abellioF1B", { name: "VIAS FLIRT (ex-Abellio) end car", kind: "emu" }, M((c) => emuCar(c, F1_END, F1_PAINT.abellio, { pan: false }), 70.2, true));
add("abellioF1M", { name: "VIAS FLIRT (ex-Abellio) middle car", kind: "emu" }, M((c) => emuCar(c, F1_MID, F1_PAINT.abellio), 51.3));
add("swT3A", { name: "SWEG Talent 3 (bwegt) end car", kind: "emu" }, M((c) => emuCar(c, T3_END, T3_PAINT.bwegt, { pan: true }), 67.6, true));
add("swT3M", { name: "SWEG Talent 3 (bwegt) middle car", kind: "emu" }, M((c) => emuCar(c, T3_MID, T3_PAINT.bwegt), 48.9));
add("nexA", { name: "Schönbuchbahn CAF Nexio (455) end section", kind: "emu" }, M((c) => emuCar(c, NEXIO_END, NEXIO_PAINT.weg), 52.0, true));
add("nexM", { name: "Schönbuchbahn CAF Nexio (455) middle section", kind: "emu" }, M((c) => emuCar(c, NEXIO_MID, NEXIO_PAINT.weg), 24.0));
add("bzbA", { name: "Bayerische Zugspitzbahn rack railcar section", kind: "emu" }, M((c) => emuCar(c, BZB, BZB_PAINT), 57.4, true));
// alex: Beacon Rail's Taurus; Die Länderbahn's ER20 and the coaches, ČD's
// coaches (czechia.cars.js's drawings).
add("deBeaconTaurus", { name: "Siemens Taurus (182, Beacon Rail), hauling the alex", kind: "electric", pan: true }, M(beaconTaurus, 63.25));
for (const key of ["deEr20", "deAlexCoach", "czCoach"]) if (CZ_MODELS[key]) { TYPES[key] = { ...CZ_TYPES[key] }; MODELS[key] = CZ_MODELS[key]; }

// Every car drawn the other way round (its cab at the right): the key with
// "R" added, for a unit's trailing half.
for (const key of Object.keys(MODELS)) {
  const m = MODELS[key];
  MODELS[key + "R"] = { len: m.len, oneEnd: false,
    draw: (c) => `<g transform="matrix(-1 0 0 1 ${c.L} 0)">${m.draw({ ...c, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: c.coupledL, cabL: c.cabR, cabR: c.cabL })}</g>` };
  TYPES[key + "R"] = { ...TYPES[key] };
}
// ---------- Units ----------
const set = (label, ...units) => ({ label, units: units.flat() });
const u = (...keys) => keys.map((k) => [k, 1]);
const twice = (x) => [...x, ...x];
// FLIRT 3 units by length: A, (middles), B turned round.
const f3 = (p, cars) => u(`${p}F3A`, ...[[], [], ["M1"], ["M2", "M1"], ["M2", "M1", "M2R"], ["M2", "M1", "M2R", "M1R"]][cars - 1].map((m) => `${p}F3${m}`), `${p}F3BR`);
const BW3 = f3("abw", 3), BW4 = f3("abw", 4), BW5 = f3("abw", 5), BW6 = f3("abw", 6);
const BY4 = f3("aby", 4), MER6 = f3("mer", 6), MER3 = f3("mer", 3), BRBF3 = f3("brb", 3), VI5 = f3("vi", 5), VXL4 = f3("vxl", 4);
const MIREO3 = (p) => u(`${p}MiA`, `${p}MiM`, `${p}MiBR`), AGMI4 = u("agMiA", "agMiM", "agMiMR", "agMiBR");
const HC5 = u("abyHcA", "abyHcM", "abyHcM", "abyHcM", "abyHcBR");
const CC3 = (p) => u(`${p}CcA`, `${p}CcM`, `${p}CcBR`), CC4 = (p) => u(`${p}CcA`, `${p}CcM`, `${p}CcMR`, `${p}CcBR`), CC5 = (p) => u(`${p}CcA`, `${p}CcM`, `${p}CcMR`, `${p}CcM`, `${p}CcBR`);
const F1U = (p, cars) => u(`${p}F1A`, ...Array.from({ length: cars - 2 }, (_, i) => (i % 2 ? `${p}F1MR` : `${p}F1M`)), `${p}F1BR`);
const RS1U = (p) => u(`rs1${p}`);
const lead = (k) => (TYPES[`${k}F`] ? `${k}F` : k);
const L41 = (p) => u(lead(`l41${p}`), `l41${p}R`), L54 = (p) => u(lead(`l54${p}`), `l54${p}R`), L81 = (p) => u(lead(`l54${p}`), `l81${p}`, `l54${p}R`);
const MPB = (p) => u(`${p}MpbA`, `${p}MpbBR`);
const T3V = (p) => u(`${p}T3A`, `${p}T3M`, `${p}T3AR`);
const GTW = (p) => u(`${p}GtwA`, `${p}GtwMod`, `${p}GtwAR`);
const INTEGRAL = u("rbIntA", "rbIntS", "rbIntM", "rbIntSR", "rbIntAR");
const DML3 = u("trDmlA", "trDmlM", "trDmlAR"), ITINO2 = u("viItino", "viItinoR"), BOBT = u("bobTal", "bobTalR"), NEXIO = u("nexA", "nexM", "nexAR"), BZB2 = u("bzbA", "bzbAR");
const ALEX = (diesel) => [[diesel ? "deEr20" : "deBeaconTaurus", 1], ["deAlexCoach", 3], ["czCoach", 2]];

// ---------- Fleets: the units' numbers ----------
// UIC series and the operators' unit numbers (de.wikipedia's fleet lists,
// nahverkehr-franken.de, 2026). A unit's number maps to its first car;
// TYPICAL draws the whole unit.
export const FLEETS = {
  deprivat2: [
    [1427011, 1427023, "abwF3A"], [1428015, 1428023, "abwF3A"], [1429036, 1429054, "abwF3A"], [1430044, 1430057, "abwF3A"],
    [1428024, 1428045, "abyF3A"], [1430001, 1430028, "merF3A"], [1427001, 1427007, "merF3A"], [1427009, 1427010, "brbF3A"],
    [2463001, 2463044, "abyMiA"], [2462001, 2462012, "abyHcA"], [1463201, 1463223, "agMiA"], [463301, 463306, "trMiA"],
    [440101, 440108, "agCcA"], [440401, 440418, "agCcA"], [563001, 563027, "swMpbA"], [563801, 563803, "hlbMpbA"],
    [650701, 650742, "rs1Agilis"], [1648201, 1648212, "l41Opb"], [622451, 622460, "l54Bwegt"], [622301, 622318, "l54Bwegt"],
    [429044, 429044, "hlbF1A"], [427130, 427134, "blbF1A"], [1429001, 1429007, "viF3A"], [1429008, 1429021, "viF3A"],
    [460001, 460017, "trDmlA"], [615101, 615126, "viItino"], [609101, 609117, "rbIntA"], [455501, 455513, "nexA"], [426041, 426048, "bobTal"],
  ],
};

// ---------- Typical trains ----------
const lineOf = (t) => String(t.route || "").replace(/\s+/g, " ").trim();
const at = (t, re) => re.test(`${t.origin || ""}|${t.destination || ""}`);
// What a reported unit runs in, by its key.
const BY_KEY = {
  abwF3A: () => set("FLIRT 3 (Arverio, bwegt): five cars", BW5), abyF3A: () => set("FLIRT 3 (Arverio Bayern): four cars", BY4),
  merF3A: () => set("FLIRT 3 (BRB, ex-Meridian): six cars", MER6), brbF3A: () => set("FLIRT 3 (BRB): three cars", BRBF3),
  abyMiA: () => set("Mireo (Arverio Bayern): three cars", MIREO3("aby")), abyHcA: () => set("Desiro HC (Arverio Bayern): five cars", HC5),
  agMiA: () => set("Mireo (agilis): four cars", AGMI4), trMiA: () => set("Mireo (MittelrheinBahn): three cars", MIREO3("tr")),
  agCcA: () => set("Coradia Continental (agilis): three cars", CC3("ag")), swMpbA: () => set("Mireo Plus B (SWEG, bwegt): two cars", MPB("sw")),
  hlbMpbA: () => set("Mireo Plus B (HLB): two cars", MPB("hlb")), rs1Agilis: () => set("Regio-Shuttle RS1 (agilis)", RS1U("Agilis")),
  l41Opb: () => set("LINT 41 (oberpfalzbahn)", L41("Opb")), l54Bwegt: () => set("LINT 54 (SWEG, bwegt)", L54("Bwegt")),
  hlbF1A: () => set("FLIRT (HLB): five cars", F1U("hlb", 5)), blbF1A: () => set("FLIRT (BRB, ex-BLB): three cars", F1U("blb", 3)),
  viF3A: () => set("FLIRT 3 (VIAS): five cars", VI5), trDmlA: () => set("Desiro ML (MittelrheinBahn): three cars", DML3),
  viItino: () => set("Itino (VIAS)", ITINO2), rbIntA: () => set("Integral (Regiobahn): five sections", INTEGRAL), nexA: () => set("Nexio (Schönbuchbahn)", NEXIO),
  bobTal: () => set("Talent (BOB): two cars", BOBT),
};
// What usually runs each line (the operators' fleet pages and Wikipedia's
// line lists for the 2026 timetable; the same line number is used by two
// or three railways here, told apart by where the train runs):
//   Arverio BW: FLIRT 3s in bwegt (three- and five-car on the MEX 13 and
//   MEX 16, four- and six-car on the RE 1, RE 8 and RB 8, the three-car
//   FLIRT 3XL on the RE 90; Mireos stand in on the MEX 13 and Talent 3+s
//   on the RE 8 while the FLIRTs get ETCS, TRI's coaches on the RE 90 to
//   December 2026). Arverio Bayern: Desiro HCs and Mireos on the München-
//   Augsburg lines (RE 9, RE 80, RB 86, RB 87), Mireos on the RE 89 and RB
//   89, four-car FLIRT 3s in the Allgäu (RE 72, RE 96, RB 92). agilis:
//   Coradia Continentals on the RB 15, RB 17 and RE 18, four-car Mireos on
//   the RE 22, RE 50 and RB 51, Regio-Shuttles in Oberfranken. The BRB:
//   LINT 41s round Augsburg and Ingolstadt (with LINT 54s and 81s in the
//   Ostallgäu), LINT 54s on the Oberland, the ex-Meridian FLIRT 3s on the
//   RE 5, RB 54 and RB 58, its own FLIRT 3s on the RB 53. Die Länderbahn:
//   Regio-Shuttles (waldbahn, oberpfalzbahn), LINT 41s on the RB 23, the
//   alex's coaches behind a Taurus to Regensburg and the ER20 beyond.
//   SWEG: Regio-Shuttles on the Ringzug, LINT 54s on the Zollernalb lines,
//   Mireo Plus Bs on the Hermann-Hesse-Bahn. HLB: Coradia Continentals on
//   the Mittelhessen-Express and the Südhessen-Untermain lines, five-car
//   FLIRTs on the RE 98 and RE 99, LINTs elsewhere (Mireo Plus Bs on some
//   RB 90 and RB 29 trains). VIAS: FLIRTs on the RB 10, Itinos on the
//   Odenwaldbahn, the ex-Abellio FLIRTs in Nordrhein-Westfalen, LINTs on
//   the RB 34 and RB 39. vlexx: LINT 54s and 81s, Talent 3s in the
//   Saarland. The MittelrheinBahn: Desiro MLs (Mireos Mainz-Bingen and on
//   the Ahrtalbahn). WEG: the Nexio on the Schönbuchbahn, Regio-Shuttles
//   on the Strohgäubahn, Teckbahn, Tälesbahn and Wieslauftalbahn.
export const TYPICAL = {
  deprivat2: (t, reported) => {
    if (reported && BY_KEY[reported.replace(/R$/, "")]) return BY_KEY[reported.replace(/R$/, "")]();
    const l = lineOf(t);
    // ---- Baden-Württemberg ----
    if (l === "MEX 13") return set("FLIRT 3 (Arverio, bwegt): five cars, often with a three-car (state Mireos stand in on some trains)", BW5);
    if (l === "MEX 16") return set("FLIRT 3 (Arverio, bwegt): five cars, often with a three-car", BW5);
    if (l === "RE 1") return set("FLIRT 3 (Arverio, bwegt): six cars", BW6);
    if (l === "RE 8") return set("FLIRT 3 (Arverio, bwegt): six cars (Talent 3+ units stand in on some trains)", BW6);
    if (l === "RB 8") return set("FLIRT 3 (Arverio, bwegt): four cars", BW4);
    if (l === "RE 90") return set("FLIRT 3XL (Arverio, bwegt): three cars, often two (TRI's coaches on some trains until December 2026)", BW3);
    if (/^R[BE] 4[23]a?$/.test(l) || (l === "RE 4" && at(t, /Tuttlingen|Singen|Rottweil|Engen/))) return set("Regio-Shuttle RS1 (SWEG Ringzug, bwegt), often two or three", RS1U("Bwegt"));
    if ((l === "RB 66" || l === "RE 66" || l === "RB 68") && at(t, /Tübingen|Hechingen|Gammertingen|Sigmaringen|Albstadt|Burladingen|Hausen/)) return set("LINT 54 (SWEG, bwegt)", L54("Bwegt"));
    if (l === "RB 76" && at(t, /Calw|Renningen|Weil der Stadt/)) return set("Mireo Plus B (SWEG, bwegt): two cars", MPB("sw"));
    if (l === "RB 91" && at(t, /Friedrichshafen|Aulendorf|Ravensburg/)) return set("Talent (BOB): two cars", BOBT);
    if (l === "RB 54" && at(t, /Pfullendorf|Altshausen/)) return set("Regio-Shuttle RS1 (bwegt)", RS1U("Bwegt"));
    if (l === "RB 46" && at(t, /Böblingen|Dettenhausen|Holzgerlingen/)) return set("Nexio (WEG, Schönbuchbahn)", NEXIO);
    if (l === "RB 47" && at(t, /Korntal|Heimerdingen/)) return set("Regio-Shuttle RS1 (WEG, Strohgäubahn)", RS1U("Strohgaeu"));
    if ((l === "RB 61" && at(t, /Schorndorf|Oberndorf|Rudersberg/)) || (l === "RB 64" && at(t, /Kirchheim|Oberlenningen/)) || (l === "RB 65" && at(t, /Nürtingen|Neuffen/)))
      return set("Regio-Shuttle RS1 (WEG)", RS1U("Weg"));
    // ---- Bayern ----
    if (l === "RB 64" && at(t, /Garmisch|Zugspitz|Grainau|Eibsee/)) return set("Zugspitzbahn rack railcar: two sections", BZB2);
    if (l === "RE 9" || l === "RE 80") return set("Desiro HC (Arverio Bayern): five cars (often a Mireo or two instead)", HC5);
    if (/^R[BE] 8[679]$/.test(l) && at(t, /München|Augsburg|Dinkelscherben|Donauwörth|Aalen|Nördlingen|Kissing|Pasing|Bopfingen|Westheim/)) return set("Mireo (Arverio Bayern): three cars, often two coupled", MIREO3("aby"), l === "RB 89" ? [] : MIREO3("aby"));
    if (l === "RB 80" || /^R[BE] 8[679]$/.test(l)) return set("Mireo (Arverio Bayern): three cars", MIREO3("aby"));
    if (/^R[BE] (72|9[26])$/.test(l) && at(t, /Memmingen|Lindau|München|Buchloe|Kißlegg|Wangen|Mindelheim/)) return set("FLIRT 3 (Arverio Bayern): four cars (often two)", BY4);
    if (/^(RB 15|RB 17|RE 18)$/.test(l) && at(t, /Ulm|Ingolstadt|Regensburg|Donauwörth|Günzburg|Saal|Neustadt|Plattling|Obertraubling/)) return set("Coradia Continental (agilis): three or four cars", CC3("ag"));
    if (/^RE (22|50)$/.test(l) || l === "RB 51") return set("Mireo (agilis): four cars", AGMI4);
    if (/^RB (18|22|24|26|34|95|96|97|98|99)$/.test(l) && at(t, /Coburg|Rodach|Forchheim|Ebermannstadt|Bamberg|Ebern|Bayreuth|Weiden|Weidenberg|Hof|Selb|Marktredwitz|Bad Steben|Helmbrechts|Münchberg|Neuenmarkt|Kirchenlaibach|Oberkotzau|Rehau|Lichtenfels|Kulmbach|Aš|As\b|Gutenfürst/))
      return set("Regio-Shuttle RS1 (agilis), often two", RS1U("Agilis"));
    // Second class only on the Ammersee-Altmühltal lines (brb.de); first
    // class on the Ostallgäu lines' units.
    if (/^RB (13|14|67|83)$/.test(l)) return set("LINT 41 (BRB), often two; second class only", u("l41Brb", "l41BrbR"));
    if (/^RB (68|69|77)$/.test(l)) return set("LINT 41 (BRB), often with a LINT 54 or 81", L41("Brb"), l === "RB 68" ? L41("Brb") : []);
    if (/^RB 5[567]$/.test(l)) return set("LINT 54 (BRB Oberland): two or three coupled, divided at Holzkirchen and Schaftlach", L54("Brb"), L54("Brb"));
    if (l === "RE 5") return set("FLIRT 3 (BRB, ex-Meridian): six cars", MER6);
    if (l === "RB 54" || (l === "RB 58" && at(t, /Rosenheim|Holzkirchen|Deisenhofen|München/))) return set("FLIRT 3 (BRB, ex-Meridian): three or six cars", MER3);
    if (l === "RB 53") return set("FLIRT 3 (BRB): three cars", BRBF3);
    if (/^RB 3[5-8]$/.test(l) && at(t, /Zwiesel|Plattling|Eisenstein|Grafenau|Bodenmais|Gotteszell|Viechtach|Deggendorf/)) return set("Regio-Shuttle RS1 (waldbahn), often two", RS1U("Waldbahn"));
    if (l === "RB 23") return set("LINT 41 (oberpfalzbahn)", L41("Opb"));
    if (/^RB 2[789]s?$/.test(l) && at(t, /Cham|Furth|Lam|Waldmünchen|Schwandorf|Roding|Kötzting/)) return set("Regio-Shuttle RS1 (oberpfalzbahn), often two", RS1U("Opb"));
    // The alex is drawn as it leaves München (its Taurus); the ER20 takes
    // over at Regensburg.
    if (l === "RE 25" || l === "RE 23") return set("alex: Beacon Rail's Taurus to Regensburg (Die Länderbahn's ER20 beyond), alex and ČD coaches", ALEX(false));
    // ---- Hessen, Rheinland-Pfalz, Saarland, Nordrhein-Westfalen ----
    if (/^RB (37|40|41|49)$/.test(l) && at(t, /Frankfurt|Gießen|Bad Nauheim|Friedberg|Dillenburg|Marburg|Kirchhain|Hanau/)) return set("Coradia Continental (HLB): four or five cars", CC5("hlb"));
    if ((l === "RB 58" || l === "RE 59" || l === "RB 75") && at(t, /Frankfurt|Hanau|Aschaffenburg|Rüsselsheim|Laufach|Kleinostheim|Wiesbaden|Darmstadt|Mainz|Stockstadt|Dieburg|Groß Gerau/)) return set("Coradia Continental (HLB): three or four cars", CC4("hlb"));
    if (l === "RE 34") return set("Coradia Continental (HLB): three cars", CC3("hlb"));
    if (l === "RE 98" || l === "RE 99") return set("FLIRT (HLB): five cars, two coupled south of Gießen", F1U("hlb", 5));
    if (l === "RE 24") return set("LINT 41 (HLB)", L41("Hlb"));
    if (/^RB (21|29|45|46|47|48|52|90|91|92|93|95|96)$/.test(l) && at(t, /Wiesbaden|Niedernhausen|Limburg|Siershahn|Gießen|Fulda|Alsfeld|Gelnhausen|Nidda|Friedberg|Wölfersheim|Beienheim|Gersfeld|Siegen|Betzdorf|Westerburg|Finnentrop|Olpe|Erndtebrück|Aue-Wingeshausen|Dillenburg|Neunkirchen|Würgendorf|Welschen Ennest|Glauburg|Weilburg|Nieder-Ohmen|Altenkirchen|Au \(Sieg\)|Kreuztal|Hilchenbach|Hachenburg/))
      return set("LINT 41 (HLB), often two", L41("Hlb"));
    if (l === "RB 97" && at(t, /Daaden|Betzdorf/)) return set("GTW 2/6 (Westerwaldbahn)", GTW("weba"));
    if (l === "RB 10" || (l === "RB 61" && at(t, /Darmstadt|Frankfurt/))) return set("FLIRT (VIAS): four cars", F1U("vias", 4));
    if (/^R[BE] (8[0-6]|66)$/.test(l) && at(t, /Darmstadt|Erbach|Eberbach|Wiebelsbach|Frankfurt|Hanau|Pfungstadt/)) return set("Itino (VIAS Odenwaldbahn), often two", ITINO2);
    if (l === "RE 19") return set("FLIRT 3 (VIAS): two five-car units to Wesel (Emmerich/Arnhem and Bocholt)", VI5);
    if (l === "RB 35" && at(t, /Duisburg|Mönchengladbach|Oberhausen|Gelsenkirchen/)) return set("FLIRT 3 (VIAS): five cars", VI5);
    if ((l === "RE 16" || l === "RB 91" || l === "RB 46") && at(t, /Hagen|Iserlohn|Letmathe|Essen|Altenhundem|Siegen|Bochum|Gelsenkirchen|Welschen/)) return set(l === "RB 46" ? "FLIRT (VIAS): two cars" : "FLIRT (VIAS): three cars", F1U("abellio", l === "RB 46" ? 2 : 3));
    if ((l === "RB 34" && at(t, /Dalheim|Mönchengladbach/)) || l === "RB 39") return set("LINT (VIAS)", l === "RB 39" ? L54("Vias") : L41("Vias"));
    if (l === "RB 26" || l === "RB 32" || (l === "RE 2" && at(t, /Bingen|Oberwesel/) && !at(t, /Frankfurt|Koblenz/))) {
      if (l === "RB 26" && !at(t, /Bingen/)) return set("Desiro ML (MittelrheinBahn): three cars, often two or three", DML3, DML3);
      return set("Mireo (MittelrheinBahn): three cars", MIREO3("tr"));
    }
    // The few RE 2 trains Frankfurt/Mainz-Koblenz the timetable gives vlexx
    // (VIAS's FLIRT 3XLs come only with the RE 19 in December 2026).
    if (l === "RE 2" && at(t, /Frankfurt|Koblenz/)) return set("LINT 54 (vlexx), often two", L54("Vlexx"));
    if ((l === "RB 37" && at(t, /Boppard|Emmelshausen/)) || l === "RB 85") return set("Regio-Shuttle RS1 (Transdev)", RS1U("Transdev"));
    if (/^RB 7[346]$/.test(l)) return set("Talent 3 (vlexx): three cars", T3V("vx"));
    if (/^R[EB] (3|13|15)$/.test(l)) return set("LINT 81 (vlexx), often with a LINT 54", L81("Vlexx"));
    if (/^R[EB] (2|4|17|31|33|34|35|44|65|71|72)$/.test(l)) return set("LINT 54 (vlexx), often two", L54("Vlexx"));
    return null;
  },
};
// Ready sets for the S-Bahn lines whose trains are these railways' (or
// these railways' kind of) units, for sbahn.cars.js: S 28 (Regiobahn's
// Integrals), S 7 Wuppertal-Solingen (RheinRuhrBahn's LINT 41s), the
// SWEG's Ortenau and Ulm lines and its Europabahn, S 61 Radolfzell-Stockach
// (DB Regio's Regio-Shuttles in bwegt), S 4 Freilassing-Berchtesgaden (the
// BRB's ex-BLB FLIRTs) and the Breisgau S-Bahn (SWEG's Talent 3s).
export const SBAHN_SETS = {
  "S 28": set("Integral (Regiobahn): five sections (FLIRT 3XLs from June 2027)", INTEGRAL),
  "S 7 Wuppertal": set("LINT 41 (RheinRuhrBahn)", L41("Rrb")),
  "RS 1": set("Mireo Plus B (SWEG, bwegt): two cars, often two", MPB("sw")),
  "RS 11": set("Mireo Plus B (SWEG, bwegt): two cars", MPB("sw")),
  "RS 12": set("Mireo Plus B (SWEG, bwegt): two cars", MPB("sw")),
  "RS 2": set("Mireo Plus B (SWEG, bwegt): two cars", MPB("sw")),
  "RS 3 Achern": set("Mireo Plus B (SWEG, bwegt): two cars", MPB("sw")),
  "RS 3 Ulm": set("LINT 54 (SWEG, bwegt)", L54("Bwegt")),
  "RS 5": set("LINT 54 (SWEG, bwegt)", L54("Bwegt")),
  "RS 51": set("LINT 54 (SWEG, bwegt)", L54("Bwegt")),
  "RS 4": set("Regio-Shuttle RS1 (SWEG, bwegt), often two (SNCF's Régiolis on some trains)", RS1U("Bwegt"), RS1U("Bwegt")),
  "S 61": set("Regio-Shuttle RS1 (DB Regio, bwegt)", RS1U("Bwegt")),
  "S 4 Berchtesgaden": set("FLIRT (BRB, ex-BLB): three cars", F1U("blb", 3)),
  "S 2 Freiburg": set("Talent 3 (SWEG, bwegt): four cars", u("swT3A", "swT3M", "swT3MR", "swT3AR")),
  "S 3 Freiburg": set("Talent 3 (SWEG, bwegt): three cars", T3V("sw")),
  "S 5 Freiburg": set("Talent 3 (SWEG, bwegt): three cars", T3V("sw")),
};
// The same, told apart by the train's line and stations.
export function sbahnSet(t) {
  const l = lineOf(t);
  if (l === "S 28") return SBAHN_SETS["S 28"];
  if (l === "S 7" && at(t, /Wuppertal|Solingen|Remscheid/)) return SBAHN_SETS["S 7 Wuppertal"];
  if (l === "RS 3") return at(t, /Achern|Ottenhöfen/) ? SBAHN_SETS["RS 3 Achern"] : SBAHN_SETS["RS 3 Ulm"];
  if (/^RS (1|11|12|2|4|5|51)$/.test(l)) return SBAHN_SETS[l];
  if (l === "S 61" && at(t, /Radolfzell|Stockach/)) return SBAHN_SETS["S 61"];
  if (l === "S 4" && at(t, /Berchtesgaden|Freilassing|Bad Reichenhall/)) return SBAHN_SETS["S 4 Berchtesgaden"];
  if (/^S [235]$/.test(l) && at(t, /Freiburg|Elzach|Bleibach|Krozingen|Münstertal|Staufen|Breisach|Riegel|Endingen|Denzlingen/)) return SBAHN_SETS[`${l} Freiburg`];
  return null;
}

// ---------- Fact sheets ----------
const WP = "https://de.wikipedia.org/wiki/";
const fam = {
  flirt3: { model: "Stadler FLIRT 3", type: "Electric multiple unit", builder: "Stadler Rail", topSpeedMph: 99, source: `${WP}Stadler_Flirt` },
  flirt1: { model: "Stadler FLIRT", type: "Electric multiple unit", builder: "Stadler Rail", topSpeedMph: 99, source: `${WP}Stadler_Flirt` },
  mireo: { model: "Siemens Mireo", type: "Electric multiple unit", builder: "Siemens Mobility", topSpeedMph: 99, source: `${WP}Siemens_Mireo` },
  mireoB: { model: "Siemens Mireo Plus B", type: "Battery-electric multiple unit", builder: "Siemens Mobility", topSpeedMph: 87, lengthFt: 152.8, source: `${WP}Siemens_Mireo` },
  hc: { model: "Siemens Desiro HC", type: "Electric multiple unit (double-deck middle cars)", builder: "Siemens Mobility", topSpeedMph: 99, source: `${WP}Siemens_Desiro_HC` },
  cc: { model: "Alstom Coradia Continental", type: "Electric multiple unit", builder: "Alstom", topSpeedMph: 99, source: `${WP}Alstom_Coradia_Continental` },
  rs1: { model: "Stadler Regio-Shuttle RS1", type: "Diesel railcar", builder: "Stadler Rail (Adtranz)", topSpeedMph: 75, lengthFt: 83.7, source: `${WP}Stadler_Regio-Shuttle_RS1` },
  lint41: { model: "Alstom Coradia LINT 41", type: "Diesel multiple unit", builder: "Alstom", topSpeedMph: 75, lengthFt: 137.4, source: `${WP}Alstom_Coradia_LINT` },
  lint54: { model: "Alstom Coradia LINT 54", type: "Diesel multiple unit", builder: "Alstom", topSpeedMph: 87, lengthFt: 178.1, source: `${WP}Alstom_Coradia_LINT` },
  lint81: { model: "Alstom Coradia LINT 81", type: "Diesel multiple unit", builder: "Alstom", topSpeedMph: 87, source: `${WP}Alstom_Coradia_LINT` },
  t3: { model: "Bombardier Talent 3", type: "Electric multiple unit", builder: "Bombardier (Alstom)", topSpeedMph: 99, source: `${WP}Bombardier_Talent_3` },
  talent: { model: "Bombardier Talent (DB 426)", type: "Electric multiple unit", builder: "Bombardier", built: "1999–2001", topSpeedMph: 87, lengthFt: 113.5, source: `${WP}DB-Baureihe_426` },
  dml: { model: "Siemens Desiro ML (460)", type: "Electric multiple unit", builder: "Siemens", built: "2008–2010", topSpeedMph: 99, source: `${WP}TDR-Baureihe_460` },
  itino: { model: "Bombardier Itino (615)", type: "Diesel multiple unit", builder: "Bombardier", built: "2005", fleet: "26 (VT 101–126)", topSpeedMph: 75, lengthFt: 169.8, source: `${WP}Bombardier_Itino` },
  gtw: { model: "Stadler GTW 2/6", type: "Articulated diesel multiple unit", builder: "Stadler Rail", topSpeedMph: 75, lengthFt: 127, source: `${WP}Stadler_GTW` },
  integral: { model: "Integral S5D95 (609.1)", type: "Diesel multiple unit", builder: "Jenbacher", built: "1998", fleet: "13 left of 17 (VT 101–117)", topSpeedMph: 75, lengthFt: 175, source: `${WP}Integral_S5D95` },
  nexio: { model: "CAF Nexio (455)", type: "Electric multiple unit", builder: "CAF", built: "2023–2025", fleet: "12 (455 501–513)", lengthFt: 128, source: `${WP}Schönbuchbahn` },
  bzb: { model: "Stadler rack railcar (BZB Nr. 12, 14–16)", type: "Rack railcar (metre gauge)", builder: "Stadler Rail", built: "2006", source: `${WP}Bayerische_Zugspitzbahn` },
};
const f = (k, more) => ({ ...fam[k], ...more });
const facts = {
  abwF3A: f("flirt3", { built: "2019–2020", fleet: "13 three-car (1427 011–023), 9 four-car (1428 015–023), 19 five-car (1429 036–054), 14 six-car (1430 044–057); 11 three-car FLIRT 3XL (3427 018–028)", about: "Arverio Baden-Württemberg's FLIRTs in the state's bwegt paint (Go-Ahead's until 2024), on the MEX 13, MEX 16, RE 1, RE 8, RB 8 and (the XLs) RE 90. Nine first-class seats behind one cab, marked by the yellow bar over their windows." }),
  abyF3A: f("flirt3", { built: "2021", fleet: "22 four-car units (1428 024–045)", about: "Arverio Bayern's FLIRTs on the E-Netz Allgäu: RE 96 München–Memmingen–Lindau, RE 72 München–Memmingen and RB 92 Memmingen–Lindau." }),
  merF3A: f("flirt3", { built: "2013–2014", fleet: "28 six-car (1430 001–028, ET 301–329) and 7 three-car (1427 001–007, ET 351–357)", about: "Meridian's FLIRTs, the BRB's since 2020 (both Transdev's), on the RE 5 München–Rosenheim–Salzburg and the RB 54 and RB 58; still in Meridian's paint with BRB's marks." }),
  brbF3A: f("flirt3", { built: "2022", fleet: "2 (ET 359–360, 1427 009–010)", about: "The BRB's RB 53 Traunstein–Ruhpolding units, in the BRB's own paint; second class only." }),
  viF3A: f("flirt3", { built: "2016–2017", fleet: "7 multi-system (ET 25 2301–2307) and 14 (ET 25 2201–2214), five cars", about: "Ex-Abellio FLIRTs, VIAS's since 2022, on the RE 19 Düsseldorf–Emmerich–Arnhem and Bocholt and the RB 35; Abellio's paint with VIAS's marks (the Arnhem units being repainted green)." }),
  vxlF3A: f("flirt3", { model: "Stadler FLIRT 3XL", built: "2025–2026", fleet: "8 four-car units (3428 036–043)", about: "VIAS's new units for the RE 19 Rheingau-Loreley-Express Frankfurt–Koblenz, leased from Alpha Trains; the line's start moved to December 2026 as Stadler delivers late. Drawn from Stadler's 2023 rendering of the trains until they are delivered and photographed." }),
  hlbF1A: f("flirt1", { built: "2007", fleet: "five-car units (429 0xx/5xx)", about: "HLB's FLIRTs on the Main-Weser lines: one from Kassel (RE 98) and one from Siegen (RE 99), coupled at Gießen to Frankfurt." }),
  viasF1A: f("flirt1", { built: "2010", fleet: "three- and four-car units (ET 3xx, ET 4xx)", about: "VIAS's RB 10 Frankfurt–Wiesbaden–Koblenz–Neuwied units, repainted from 2025 in VIAS's teal mesh." }),
  blbF1A: f("flirt1", { built: "2009", fleet: "5 three-car units (ET 130–134, 427 130–134)", about: "The Berchtesgadener Land Bahn's FLIRTs, the BRB's since December 2021 on the S 4 Freilassing–Berchtesgaden; second class only since then." }),
  abellioF1A: f("flirt1", { built: "2007", fleet: "8 two-car (0426 100–107) and 9 three-car units (0427 100–108)", about: "Ex-Abellio FLIRTs, VIAS's since December 2023 on the Ruhr-Sieg lines: RE 16 Essen–Hagen–Iserlohn, RB 91 Hagen–Siegen, RB 46 Bochum–Gelsenkirchen." }),
  abyMiA: f("mireo", { built: "2021–2022", fleet: "44 three-car units (2463 001–044)", lengthFt: 229.2, about: "Arverio Bayern's Mireos on the Augsburger Netze (RE 9, RE 80, RB 86, RB 87, RE 89, RB 89), coupled up to four. First class behind one cab, marked by a yellow bar." }),
  agMiA: f("mireo", { built: "2023–2024", fleet: "23 four-car units (1463 201–223)", about: "agilis's Mireos on the RE 50 Nürnberg–Regensburg–Plattling, RE 22 and RB 51 since December 2024." }),
  trMiA: f("mireo", { built: "2020", fleet: "6 three-car units (463 301–306)", lengthFt: 229.2, about: "The MittelrheinBahn's Mireos, Mainz–Bingen (RB 26) and, since December 2025, the Ahrtalbahn (RB 32)." }),
  swMpbA: f("mireoB", { built: "2023–2024", fleet: "27 two-car units (563 001–027)", about: "The SWEG's battery units for the Ortenau-S-Bahn (since December 2024) and the Hermann-Hesse-Bahn Calw–Renningen (since 2026), in bwegt's paint; one door a side on this car." }),
  hlbMpbA: f("mireoB", { built: "2024", fleet: "3 two-car units (563 801–803)", about: "HLB's battery units on the RB 90 and RB 29 in the Westerwald." }),
  abyHcA: f("hc", { built: "2021–2022", fleet: "12 five-car units (2462 001–012)", lengthFt: 432, about: "Arverio Bayern's Desiro HCs on the München–Augsburg–Ulm/Donauwörth lines; single-deck end cars, double-deck middle cars." }),
  agCcA: f("cc", { built: "2010", fleet: "18 three-car (440 401–418) and 8 four-car units (440 101–108)", lengthFt: 189.6, about: "agilis's Coradias on the Danube: RB 15 Ulm–Ingolstadt, RB 17 Ingolstadt–Regensburg–Plattling, RE 18. First class behind one cab, a lime bar over it." }),
  hlbCcA: f("cc", { built: "2017, 2023–2024", fleet: "three-, four- and five-car units (1440 1xx–3xx)", about: "HLB's Coradias on the Südhessen-Untermain lines (RB 58, RE 59, RB 75) and the Mittelhessen-Express (RB 37, RB 40, RB 41, RB 49), and the RE 34 until December 2026." }),
  rs1Agilis: f("rs1", { built: "2011", fleet: "42 (650 7xx)", about: "agilis's diesel cars in Oberfranken (RB 18, RB 22, RB 24, RB 26, RB 34, RB 95-99)." }),
  rs1Waldbahn: f("rs1", { built: "1997–2005", fleet: "12, with 5 ex-ODEG", about: "Die Länderbahn's waldbahn in the Bavarian Forest: RB 35 Plattling–Bayerisch Eisenstein, RB 36 Zwiesel–Grafenau, RB 37 Zwiesel–Bodenmais, RB 38 Gotteszell–Viechtach." }),
  rs1Opb: f("rs1", { fleet: "13", about: "Die Länderbahn's oberpfalzbahn: RB 27 Schwandorf–Cham–Furth im Wald, RB 28 Cham–Lam, RB 29 Cham–Waldmünchen." }),
  rs1Bwegt: f("rs1", { fleet: "20 (Ringzug VT 231–250) and the Europabahn's", about: "The SWEG's Ringzug (repainted in bwegt 2023-2024) and Europabahn units; DB Regio's on the S 61 Radolfzell–Stockach likewise." }),
  rs1Strohgaeu: f("rs1", { fleet: "10 (VT 361–368 and two ex-BOB)", about: "WEG's Strohgäubahn Korntal–Heimerdingen." }),
  rs1Weg: f("rs1", { about: "WEG's (Transdev's) Tälesbahn Nürtingen–Neuffen, Teckbahn Kirchheim–Oberlenningen and Wieslauftalbahn Schorndorf–Oberndorf." }),
  rs1Transdev: f("rs1", { fleet: "650 350–352, 650 131–132", about: "Transdev's (ex-Rhenus Veniro) Hunsrückbahn Boppard–Emmelshausen and Moselweinbahn Bullay–Traben-Trarbach." }),
  l41Brb: f("lint41", { built: "2009, 2022", fleet: "41 (VT 311–351) and 19 (1648 1xx)", about: "The BRB's LINTs round Augsburg and Ingolstadt (RB 13, RB 14, RB 67, RB 83) and in the Ostallgäu (RB 68, RB 69, RB 77), there with LINT 54s and 81s." }),
  l54Brb: f("lint54", { built: "2019–2020", fleet: "31 (VT 4xx) on the Oberland, 4 (VT 17x)", about: "The BRB's Oberland lines München–Holzkirchen–Bayrischzell/Lenggries/Tegernsee (RB 55-57), divided at Holzkirchen and Schaftlach." }),
  l41Opb: f("lint41", { built: "2014", fleet: "12 (1648 201–212)", about: "Die Länderbahn's oberpfalzbahn RB 23 Regensburg–Weiden–Marktredwitz." }),
  l54Bwegt: f("lint54", { built: "2020–2021", fleet: "18 (Zollernalb, 622 3xx) and 13 (Ulm, 622 4xx)", about: "The SWEG's LINTs in bwegt: the Zollernalb lines (RB 66, RB 68) and the Ulm lines (RS 3, RS 5, RS 51)." }),
  l54Vlexx: f("lint54", { built: "2014", fleet: "LINT 54 (622 4xx/9xx) and LINT 81 (620 4xx/9xx)", about: "vlexx's diesel lines from Mainz and Frankfurt (Nahe, Alzey, Kaiserslautern) and in the Saarland." }),
  l81Vlexx: f("lint81", { about: "The LINT 81's middle car: a LINT 54 with a third car between." }),
  l41Hlb: f("lint41", { fleet: "LINT 41 (648, 1648, 2648) and LINT 27 (640)", about: "HLB's diesel lines in Hessen, the Westerwald and Siegerland." }),
  l41Rrb: f("lint41", { built: "2013", fleet: "9 (1648 0xx)", about: "The S 7 \"Der Müngstener\" Wuppertal–Solingen–Remscheid: ex-Abellio units owned by the VRR, RheinRuhrBahn's (Transdev) since December 2023." }),
  l41Vias: f("lint41", { fleet: "3 LINT 41H and 9 LINT 54H", about: "VIAS's RB 34 Mönchengladbach–Dalheim and RB 39 Düsseldorf–Bedburg." }),
  vxT3A: f("t3", { built: "2021", fleet: "three-car units (8442 1xx/6xx)", lengthFt: 184, about: "vlexx's electric lines in the Saarland (RB 73, RB 74, RB 76)." }),
  swT3A: f("t3", { built: "2020", fleet: "7 four-car and 5 three-car units", about: "The SWEG's Breisgau S-Bahn units (S 2, S 3, S 5) in bwegt's paint." }),
  bobTal: f("talent", { fleet: "8 (ex-DB Saarland, e.g. 426 042)", about: "The Bodensee-Oberschwaben-Bahn's RB 91 Friedrichshafen Hafen–Ravensburg–Aulendorf." }),
  trDmlA: f("dml", { fleet: "17 three-car units (460 0xx/5xx)", lengthFt: 246.7, about: "The MittelrheinBahn's RB 26 Köln–Koblenz–Mainz, three coupled north of Remagen." }),
  viItino: f("itino", { about: "VIAS's Odenwaldbahn (RE 80, RE 85, RB 81, RB 82, RB 86) and RB 66 Darmstadt–Pfungstadt." }),
  hlbGtwA: f("gtw", { about: "HLB's GTWs (646, 509) on the RE 24 and the Westerwald." }),
  webaGtwA: f("gtw", { fleet: "2 (509 106, 509 109; ex-HLB, 2023)", about: "The Westerwaldbahn's Daadetalbahn Betzdorf–Daaden. Eleven first-class seats." }),
  rbIntA: f("integral", { about: "The Regiobahn's S 28 Kaarster See–Düsseldorf–Mettmann–Wuppertal, ex-Bayerische Oberlandbahn units; FLIRT 3XLs from June 2027." }),
  nexA: f("nexio", { about: "WEG's (Transdev's) Schönbuchbahn Böblingen–Dettenhausen, all electric since 2025." }),
  bzbA: f("bzb", { about: "The Bayerische Zugspitzbahn's rack line from Garmisch-Partenkirchen by Grainau and Eibsee up to the Zugspitzplatt." }),
  deBeaconTaurus: { model: "Siemens Taurus (ES64U2, 182)", type: "Electric locomotive", builder: "Siemens", built: "2001–2002", topSpeedMph: 143, lengthFt: 63.3, source: `${WP}Alex_(Zug)`,
    about: "Beacon Rail's black Taurus locomotives haul the alex (RE 25) between München and Regensburg since December 2023; Die Länderbahn's ER20 diesel beyond, to Furth im Wald and Plzeň." },
};
export const FACTS = {};
for (const [k, v] of Object.entries(facts)) for (const key of Object.keys(TYPES)) if (key.replace(/R$/, "") === k || key.replace(/R$/, "").replace(/(A|B|M|M1|M2|Mod|S)$/, "A") === k ||
  key.replace(/R$/, "").replace(/(A|B|M|M1|M2|Mod|S)$/, "") === k.replace(/A$/, "")) FACTS[key] = FACTS[key] || v;
for (const k of ["deEr20", "deAlexCoach", "czCoach"]) FACTS[k] = FACTS[k + "R"] = CZ_FACTS?.[k] || { model: "ČD coach", type: "Passenger coach", builder: "Various",
  about: "ČD's coaches run through on the alex between München and Praha with Die Länderbahn's." };
for (const k of Object.keys(TYPES)) { const m = k.match(/^(l(?:41|54)(?:Brb|Hlb))FR?$/); if (m && facts[m[1]]) FACTS[k] = facts[m[1]]; }
for (const k of Object.keys(TYPES)) if (!FACTS[k]) {
  const base = k.replace(/R$/, "");
  const fam2 = /^l54/.test(base) ? facts.l54Vlexx : /^l81/.test(base) ? facts.l81Vlexx : /^l41/.test(base) ? facts.l41Hlb : /^rs1/.test(base) ? facts.rs1Weg : null;
  if (fam2) FACTS[k] = fam2;
}
