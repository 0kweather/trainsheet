// The Netherlands' regional railways (scripts/railroads/nl.py, agency
// "nlregio"): Arriva in Groningen and Friesland, Limburg, the Achterhoek
// and Rivierenland (RRReis) and Overijssel (Blauwnet); Keolis on the
// Blauwnet lines from Zwolle and the Valleilijn (RRReis); Qbuzz on the
// MerwedeLingelijn (R-net). Trainsheet's own side views at the shared scale
// (js/carart.js), from the builders' dimensions (Stadler, Alstom,
// Fahrzeugtechnik Dessau as the Dutch Wikipedia's fleet pages give them,
// Stadler's WINK type drawing) and photographs (Wikimedia Commons, mostly
// 2025-2026), each unit in the paint most of its fleet wears in autumn
// 2026; the lettering and marks are drawn here (no logo files).
//
// The feed names no cars, so TYPICAL picks what runs each line (the
// railways' and the provinces' fleet pages and Wikipedia's lists of each
// series' trains for the 2026 timetable). FLEETS maps the units' own
// numbers (Arriva's 10.2xx-10.6xx, Keolis's 74xx, Qbuzz's 63xx/72xx) to
// their drawings, for the fleet pages.

import { C, rect, circle, path, line, lines, poly, truck, pantograph, slats, win, coupledEnd } from "../carart.js?v=dev";
import { newId } from "../carmodels.js?v=dev";
import { mark } from "./czechia.cars.js?v=dev";
import { hvac, roofCover, lamp, RED_LAMP, wiper } from "./digitraffic.cars.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
const clip = (d, inner) => {
  const id = newId();
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`;
};
// A gradient as a fill (y up, feet): stops [[offset, color], ...] from
// (x0, y0) to (x1, y1).
function grad(x0, y0, x1, y1, stops) {
  const id = newId();
  return [`<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${n(x0)}" y1="${n(y0)}" x2="${n(x1)}" y2="${n(y1)}">` +
    stops.map(([o, col]) => `<stop offset="${o}" stop-color="${col}"/>`).join("") + `</linearGradient></defs>`, `url(#${id})`];
}
// Text in a mark() group (y down, centered at its origin).
const txt = (x, y, h, text, fill, { weight = 700, family = SANS, anchor = "middle", spacing = 0, style = "", extra = "" } = {}) =>
  `<text x="${n(x)}" y="${n(y + h * 0.36)}" font-size="${n(h)}" text-anchor="${anchor}" font-weight="${weight}" letter-spacing="${spacing}" font-family="${family}" fill="${fill}"${style ? ` font-style="${style}"` : ""}${extra ? " " + extra : ""}>${text}</text>`;
const letters = (c, x, y, h, text, fill, o) => mark(c, x, y, txt(0, 0, h, text, fill, o));
// A word fitted to its width w.
const fitted = (c, x, y, h, text, fill, w, o = {}) => letters(c, x, y, h, text, fill, { ...o, extra: `textLength="${n(w)}" lengthAdjust="spacingAndGlyphs"` });

// ---------- A car of a multiple unit ----------
// o: outline (points, y up, poly() style), base (the body color), paint(c)
// (clipped to the body), wins ([x0, x1, y0, y1, r]), doors, door(c, d),
// trucks ([x, wb, d(in), kind]), under(c), over(c) (clipped, on the
// windows), extra(c) (on top), gangway [floor, top], cab (no gangway at
// the left).
function sec(c, o) {
  const L = c.L, d = poly(o.outline);
  let s = (o.trucks || []).map(([x, wb, dia, kind = "car"]) => truck(x, { wb, d: dia, kind, top: o.truckTop ?? 2.9 })).join("");
  if (o.under) s += o.under(c);
  let liv = o.paint(c);
  liv += (o.wins || []).map(([x0, x1, y0, y1, r = 0.45]) => win(x0, y0, x1 - x0, y1 - y0, r)).join("");
  if (o.over) liv += o.over(c);
  s += path(d, o.base) + clip(d, liv);
  if (o.door) s += (o.doors || []).map((dr) => o.door(c, dr)).join("");
  if (o.extra) s += o.extra(c);
  s += path(d, "none", 0.8);
  const [floor, top] = o.gangway || [1.6, 12.4];
  if (c.coupledL && !o.cab) s += coupledEnd(0, -1, { floor, top, coupler: 2.4 });
  if (c.coupledR) s += coupledEnd(L, 1, { floor, top, coupler: 2.4 });
  return s;
}
// A body's outline: from x0 to x1, its underside at low (or the steps
// given in bottom), its roof at roof, rounded at the corners; nose: a
// cab's points from the roof down to the bottom (at the left).
function box(L, { roof, low, r = 0.5, nose = null, bottom = null, x0 = 0.3, x1 = L - 0.3 }) {
  const pts = [nose ? nose[nose.length - 1] : [x0, low]];
  if (bottom) pts.push(...bottom);
  pts.push([x1, low], [x1, roof - r], ["q", x1, roof, x1 - r, roof]);
  if (nose) pts.push(...nose.slice(0, -1));
  else pts.push([x0 + r, roof], ["q", x0, roof, x0, roof - r]);
  return pts;
}
// The automatic coupler and its head under a nose at the left, and the
// dark buffer beam (the obstacle deflector) under the front.
function coupler(c, { x = 1.4, y = 2.9, defl = [0.9, 5.0, 1.0, 2.4], color = "#25282c" } = {}) {
  const [a, b, lo, hi] = defl;
  let s = path(poly([[a, hi], [b, hi], [b, lo + 0.3], [a + 0.6, lo]]), color);
  s += rect(0.3, y - 0.3, x + 0.4, 0.6, "currentColor", 0, 'opacity="0.9"') + rect(0, y - 0.7, 0.55, 1.4, "currentColor", 0, 'rx="0.15"') +
    rect(0.15, y + 0.75, 0.5, 0.35, C.steelDark, 0.3);
  return s;
}
// A plug door, two leaves, its windows; fill the leaves' color.
function plugDoor(c, d, fill, { glassTop = 9.2, glassLow = 4.0, seam = "rgba(0,0,0,0.45)" } = {}) {
  const m = d.x + d.w / 2, lw = d.w / 2;
  let s = rect(d.x, d.y0, d.w, d.y1 - d.y0, fill, 0.5, 'rx="0.18"') + line(m, d.y0 + 0.1, m, d.y1 - 0.1, seam, 0.7);
  for (const a of [d.x + 0.4, m + 0.3]) s += rect(a, glassLow, lw - 0.7, glassTop - glassLow, "#15181b", 0, 'rx="0.3"') + rect(a + 0.1, glassLow + 0.12, lw - 0.9, glassTop - glassLow - 0.24, C.glass, 0, 'rx="0.25"') +
    rect(a + 0.15, glassTop - 1.5, lw - 1.0, 1.1, C.glassLight, 0, 'rx="0.2"');
  return s;
}
// The class numerals at the top of each door leaf, as on the Dutch
// regional trains (a small "2" or "1" with the pictograms between).
const doorClasses = (c, d, left, right, fill = "#1d1f22") =>
  letters(c, d.x + 0.45, d.y1 - 0.42, 0.42, left, fill, { weight: 700 }) + letters(c, d.x + d.w - 0.45, d.y1 - 0.42, 0.42, right, fill, { weight: 700 });

// ---------- Marks ----------
// Arriva's mark since 2017: a pointed "A" drawn in one stroke, its
// crossbar looping round; h its height, centered at (x, y).
const ARRIVA_A = "M-0.42 0.5L-0.05 -0.5L0.42 0.5M-0.3 0.18Q0.05 -0.12 0.3 0.18Q0.05 0.42 -0.2 0.3";
const arrivaA = (c, x, y, h, color, w = 0.12) => mark(c, x, y, `<path d="${ARRIVA_A}" transform="scale(${n(h)})" fill="none" stroke="${color}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`);
// "arriva" in its rounded lowercase, the A mark before it.
const arrivaWord = (c, x, y, h, color) => mark(c, x, y,
  `<path d="${ARRIVA_A}" transform="translate(${n(-1.55 * h)} 0) scale(${n(h * 1.15)})" fill="none" stroke="${color}" stroke-width="0.11" stroke-linejoin="round" stroke-linecap="round"/>` +
  txt(-1.05 * h, 0.08 * h, h, "arriva", color, { weight: 500, anchor: "start", family: "Avenir Next, Futura, Helvetica Neue, Arial, sans-serif" }));
// The old Arriva mark (2008-2017; on Limburg's GTWs and FLIRT IIs): a white
// disc with a blue swoosh, "ARRIVA" beside it.
const arrivaOld = (c, x, y, h, color = "#ffffff", word = true) => mark(c, x, y,
  `<circle cx="0" cy="0" r="${n(h * 0.5)}" fill="none" stroke="${color}" stroke-width="${n(h * 0.12)}"/><path d="M${n(-0.32 * h)} ${n(0.1 * h)}Q0 ${n(-0.35 * h)} ${n(0.32 * h)} ${n(-0.1 * h)}" fill="none" stroke="${color}" stroke-width="${n(h * 0.14)}"/>` +
  (word ? txt(h * 0.7, 0, h * 0.8, "ARRIVA", color, { weight: 600, anchor: "start", spacing: "0.02em" }) : ""));
// Blauwnet's mark: a lowercase "b" in a white square, "blauwnet" beside it.
const blauwnet = (c, x, y, h, color = "#ffffff") => mark(c, x, y,
  `<rect x="0" y="${n(-h / 2)}" width="${n(h * 0.8)}" height="${n(h)}" rx="${n(h * 0.12)}" fill="none" stroke="${color}" stroke-width="${n(h * 0.1)}"/>` +
  txt(h * 0.4, 0.02 * h, h * 0.85, "b", color, { weight: 700 }) + txt(h * 1.0, 0.05 * h, h * 0.75, "blauwnet", color, { weight: 500, anchor: "start" }));
// "RRReis" in RRReis's italic capitals ("RR" and "R" heavier), "met ons
// mee" under it.
const rrreisWord = (c, x, y, h, color, sub = "met ons mee") => mark(c, x, y,
  txt(0, 0, h, "RRReis", color, { weight: 800, style: "italic", spacing: "-0.03em" }) + (sub ? txt(0, h * 0.85, h * 0.36, sub, color, { weight: 500, style: "italic" }) : ""));

// ===================== Stadler GTW (fourth generation): Arriva's "Spurt" =====================
// Two end cars hung from a short power module carrying the motor truck and
// the diesel engines (or the transformer and pantograph); GTW 2/6 40.89 m,
// GTW 2/8 55.94 m with a 15.05 m middle car between one end car and the
// module, on a truck shared with that end car. 4.04 m tall; low floor (780
// mm) between the door and the module, a high floor (996 mm) over the
// truck under the cab. One double door a side on each car. End cars about
// 17.95 m, the module about 4.9 m. Measured off broadside photographs:
// Ruurlosche Broek (264, 2026), Boxmeer (385, 2025), Zevenaar (520, 2026),
// Geldermalsen (6352, 2025), Groningen (302, 2025), Deurningen (350, 2026).
const GT = { end: 58.9, mid: 49.4, mod: 16.1, roof: 13.24, low: 1.7 };
const GT_NOSE = [[8.6, 13.24], [6.6, 13.05], [4.9, 12.5], [3.5, 11.45], [2.5, 10.05], [1.8, 8.45], [1.4, 6.75], [1.2, 5.1], [1.12, 3.7], [1.3, 2.85], [1.9, 2.5]];
const GT_BOTTOM = [[2.2, 2.5], [28.9, 2.5], ["q", 29.6, 2.5, 29.7, 1.7]];
// The windshield seen from the side (a long raked band up the nose) and
// the cab's side windows (a D-shaped one, a narrow one behind it).
const GT_SCREEN = [[1.45, 6.9], [1.85, 8.5], [2.6, 9.95], [3.65, 11.2], [5.0, 12.15], [6.6, 12.7], [8.4, 12.9], [8.4, 11.6], [6.9, 11.25], [5.5, 10.4], [4.3, 9.1], [3.5, 7.7], [3.1, 6.7]];
const GT_DWIN = "M15.2 10.5L11.0 10.5Q9.5 10.3 9.0 8.7Q8.8 7.1 10.4 6.85L15.2 6.85Z";
// Window layouts: high-floor windows behind the cab, the door, the low
// floor's windows (five alike on the first Spurts, Groningen's and the
// MerwedeLingelijn's and Limburg's; four larger and a small one on the
// Achterhoek's and the Vechtdal's, built with more legroom).
const GT_HIGH = [[15.5, 17.2, 6.85, 10.5], [19.1, 23.4, 6.4, 10.5], [24.0, 28.1, 6.4, 10.5]];
const GT_LOW5 = [[36.0, 39.6], [40.3, 43.9], [44.6, 48.2], [48.9, 52.5], [53.2, 56.8]];
const GT_LOW4 = [[35.9, 37.9], [38.5, 42.6], [43.4, 47.5], [48.2, 52.3], [53.0, 57.0]];
const GT_DOOR = 29.8;
// The middle car (truck end at the left): two windows, the door, six.
const GT_MID = { wins: [[1.8, 5.6], [6.4, 10.2], [16.9, 21.5], [22.2, 26.8], [27.5, 32.1], [32.8, 37.4], [38.1, 42.7], [43.4, 48.0]], door: 11.4 };

// The paints. Each: base, body(c, L, part) the paint under the windows
// (part "end", "mid", "mod"), door(c, d, part, i) the leaves' color and
// marks, marks(c, L, part) on top, low (the window style: 4 or 5),
// roof (the roof's color), screen (the windshield's mask).
const GTP = {};
// Arriva in Groningen and Friesland, since the refits of 2020-2024 (all
// the Spurts by June 2024): the cab white back to the door, the body
// turquoise above fading to a sandy beige at the sill; white doors; the
// "arriva" mark white low on the low-floor part, Arriva's big "A" in
// outline on the module. No first class (declassified 2020).
GTP.noord = {
  base: "#f2f2ef", low: 5, roof: "#c9ccce",
  body: (c, L, part) => {
    const [d, f] = grad(0, 1.2, 0, 13.2, [[0, "#e6d7b2"], [0.3, "#cfd6bf"], [0.55, "#79c9d4"], [1, "#56bfd2"]]);
    let s = d + rect(-1, -1, L + 2, 16, f);
    if (part === "end") s += path(`M-1 -1L${GT_DOOR - 0.6} -1L${GT_DOOR - 0.6} 16L-1 16Z`, "#f4f4f1") + rect(-1, -1, GT_DOOR - 0.6, 2.6, "#e9e3d2");
    return s;
  },
  door: (c, d) => plugDoor(c, d, "#f1ece0") + doorClasses(c, d, "2", "2"),
  marks: (c, L, part) => {
    if (part === "end") return arrivaWord(c, 46.5, 3.6, 1.45, "#ffffff");
    if (part === "mod") return arrivaA(c, L / 2, 7.4, 6.4, "#ffffff", 0.05);
    return "";
  },
};
// RRReis (Gelderland's brand) since the new Achterhoek-Rivierenland
// concession (from May 2025; every Spurt and the nine ex-Breng units by
// 2026): the cab white back to the high-floor windows, the body purple at
// the ends through blue to teal at the module, the module green; white
// doors; RRReis's white loops; "RRReis met ons mee" white under the
// windows by the module, "RRReis met Arriva" in color on the white.
GTP.rrreis = {
  base: "#f3f4f5", low: 4, roof: "#c9ccce",
  body: (c, L, part) => {
    if (part === "mod") return rect(-1, -1, L + 2, 16, "#13a37a");
    const far = part === "end" ? L : 0, near = part === "end" ? 0 : L;
    const [d, f] = grad(part === "end" ? 20 : L, 0, part === "end" ? L : 0, 0, [[0, "#5d2a9c"], [0.35, "#4a3fb3"], [0.62, "#2866c9"], [0.85, "#1489b8"], [1, "#11a08a"]]);
    let s = d + rect(-1, -1, L + 2, 16, f);
    const loop = (x, y, r) => circle(x, y, r, "none", 0, 'stroke="#ffffff" stroke-width="0.36"');
    const tail = (d) => `<path d="${d}" fill="none" stroke="#ffffff" stroke-width="0.36" stroke-linecap="round"/>`;
    if (part === "end") s += path("M-1 -1L18.5 -1L18.5 13.6L-1 13.6Z", "#f3f4f5") +
      loop(20.6, 3.0, 1.9) + tail("M21.9 4.4C23.0 6.0 23.0 8.6 24.7 10.7") + loop(25.8, 11.7, 1.15) +
      loop(52.6, 11.7, 1.25) + tail("M53.7 11.1C55.8 8.2 53.8 5.6 53.5 4.3") + loop(53.3, 3.4, 0.9);
    if (part === "mid") s += loop(8.0, 11.7, 1.25) + tail("M9.1 11.1C11.2 8.2 9.2 5.6 8.9 4.3") + loop(8.7, 3.4, 0.9) + loop(36.0, 3.0, 1.9);
    return s;
  },
  door: (c, d, part) => plugDoor(c, d, "#f4f5f6") + doorClasses(c, d, "2", part === "endA" ? "1" : "2"),
  marks: (c, L, part) => {
    if (part === "end") return rrreisWord(c, 46.0, 4.2, 1.75, "#ffffff") + rrreisWord(c, 13.6, 3.9, 1.2, "#3a3fb0", "met Arriva");
    if (part === "mid") return rrreisWord(c, 30.5, 4.2, 1.75, "#ffffff");
    if (part === "mod") return rect(4.2, 8.0, 2.0, 2.4, "none", 0, 'stroke="rgba(0,0,0,0.35)" stroke-width="0.08"') + slats(4.4, 8.2, 1.6, 2.0, 0.28, "rgba(0,0,0,0.3)");
    return "";
  },
};
// Blauwnet on the Vechtdallijnen (Zwolle-Emmen, the electric Spurts): the
// cab white back past the high-floor windows, the body blue, lighter
// below the windows; white doors; "Vechtdallijnen" big in white on the
// light blue, Blauwnet's mark over the windows; "arriva" on the nose.
GTP.vecht = {
  base: "#f2f3f4", low: 4, roof: "#c9ccce",
  body: (c, L, part) => {
    let s = rect(-1, -1, L + 2, 16, "#1e6cc4") + rect(-1, -1, L + 2, 5.2, "#3a98dc");
    if (part === "end") s += path("M-1 -1L18.6 -1Q19.6 7.0 22.8 13.6L-1 13.6Z", "#f2f3f4");
    return s;
  },
  door: (c, d) => plugDoor(c, d, "#f3f4f5") + doorClasses(c, d, "2", "2"),
  marks: (c, L, part) => {
    if (part === "end") return fitted(c, 46.5, 2.9, 2.3, "Vechtdallijnen", "#ffffff", 14.0, { weight: 500 }) + blauwnet(c, 38.0, 11.3, 1.2) + arrivaWord(c, 13.6, 3.0, 1.0, "#2a5aa0");
    if (part === "mid") return fitted(c, 31.0, 2.9, 2.3, "Vechtdallijnen", "#ffffff", 14.0, { weight: 500 }) + blauwnet(c, 18.0, 11.3, 1.2);
    return "";
  },
};
// Blauwnet's paint for Overijssel (2017 on; the two diesel Spurts on the
// Zutphen-Oldenzaal line since 2023): the cab white back to the door, the
// body blue, a lighter blue band low along it; big white class numerals
// either side of each door, "2" and "2"; Blauwnet's mark low by the door.
GTP.bnet = {
  base: "#f2f3f4", low: 5, roof: "#c9ccce",
  body: (c, L, part) => {
    let s = rect(-1, -1, L + 2, 16, "#1d6ec7") + rect(-1, -1, L + 2, 4.7, "#48a6e3");
    if (part === "end") s += path("M-1 -1L18.4 -1L18.4 13.6L-1 13.6Z", "#f2f3f4") + rect(GT_DOOR + 4.7, 4.85, L - GT_DOOR - 5.0, 5.3, "#14171a");
    if (part === "mid") s += rect(-1, 4.85, L + 2, 5.3, "#14171a");
    return s;
  },
  door: (c, d) => plugDoor(c, d, "#f3f4f5") + doorClasses(c, d, "2", "2"),
  marks: (c, L, part) => {
    const big = (x) => bigClass(c, x - 3.3, "2") + bigClass(c, x + 4.3 + 3.3, "2");
    if (part === "end") return big(GT_DOOR) + blauwnet(c, 44.5, 3.0, 1.1) + arrivaWord(c, 13.4, 3.6, 0.85, "#5b6670");
    if (part === "mid") return big(GT_MID.door) + blauwnet(c, 24.0, 3.0, 1.1);
    return "";
  },
};
// Blauwnet's big numerals: white, as tall as the window band.
const bigClass = (c, x, k, h = 10.0) => letters(c, x, 7.0, h, k, "#ffffff", { weight: 700, family: "Arial Rounded MT Bold, Helvetica Neue, Arial, sans-serif" });
// R-net (the Rotterdam region's brand) on Qbuzz's MerwedeLingelijn units
// (repainted 2020-2021): dark gray, the cab's face and the roof red, the
// red reaching down to the windows' tops along the side and sweeping down
// behind the cab; red doors; "R-NET" white on the nose and the cars; a
// white line and dot motif. No first class.
GTP.rnet = {
  base: "#3c4046", low: 5, roof: "#d8262f", screen: "#1a1c1f",
  body: (c, L, part) => {
    let s = rect(-1, -1, L + 2, 16, "#3c4046") + rect(-1, 11.15, L + 2, 4, "#d8262f");
    if (part === "end") s += path("M-1 -1L1.6 -1L1.6 4.3Q5.0 4.6 8.2 5.6Q11.4 6.8 13.4 9.2Q15.4 11.15 20.0 11.15L20 16L-1 16Z", "#d8262f");
    if (part !== "mod") s += line(L * 0.62, 3.4, L * 0.78, 10.0, "rgba(255,255,255,0.75)", 0.6) + circle(L * 0.59, 3.2, 0.45, "rgba(255,255,255,0.85)");
    return s;
  },
  door: (c, d) => plugDoor(c, d, "#d8262f", { seam: "rgba(0,0,0,0.5)" }),
  marks: (c, L, part) => {
    if (part === "end") return letters(c, 3.6, 5.3, 0.95, "R·NET", "#ffffff", { weight: 700, spacing: "0.04em" }) + letters(c, 41.8, 4.2, 1.0, "R·NET", "#ffffff", { weight: 700, spacing: "0.04em" });
    if (part === "mid") return letters(c, 24.0, 4.2, 1.0, "R·NET", "#ffffff", { weight: 700, spacing: "0.04em" });
    return "";
  },
};
// Arriva Limburg (from 2016; the ex-Veolia units, the diesels only
// relettered): the cab cream-white, sweeping back low past the high-floor
// windows; the body royal blue, the windows and doors framed in a thin
// yellow line; light blue doors; Limburg's red lion on the white behind the
// cab; "ARRIVA" with the old mark white low on each car. First class:
// sixteen seats.
GTP.limburg = {
  base: "#efede6", low: 5, roof: "#c8cacc",
  body: (c, L, part) => {
    let s = rect(-1, -1, L + 2, 16, "#2a50b8");
    if (part === "end") s += path("M-1 -1L22.4 -1Q23.4 8.0 28.6 13.6L28.6 16L-1 16Z", "#efede6");
    const f = part === "end" ? [[29.2, 58.4]] : part === "mid" ? [[1.0, 48.6]] : [];
    for (const [a, b] of f) s += rect(a, 4.55, b - a, 6.35, "none", 0, 'rx="0.5" stroke="#f2c230" stroke-width="0.16"');
    return s;
  },
  door: (c, d, part) => plugDoor(c, d, "#8fb3e8") + doorClasses(c, d, part === "endA" ? "1" : "2", "2"),
  marks: (c, L, part) => {
    if (part === "end") return limburgLion(c, 21.3, 6.0, 7.2) + arrivaOld(c, 44.5, 3.4, 0.8);
    if (part === "mid") return arrivaOld(c, 30.0, 3.4, 0.8);
    return "";
  },
};
// The electric Limburg units, repainted (not only relettered) in 2016:
// Arriva's new mark on the cars and the A on the nose (Klimmen-Ransdaal,
// Valkenburg, 2024-2025).
GTP.limburgE = { ...GTP.limburg,
  marks: (c, L, part) => (part === "end" ? limburgLion(c, 21.3, 6.0, 7.2) + arrivaWord(c, 44.5, 3.4, 1.0, "#ffffff") + arrivaA(c, 2.2, 5.6, 0.9, "#2a50b8")
    : part === "mid" ? arrivaWord(c, 30.0, 3.4, 1.0, "#ffffff") : "") };
// Limburg's lion (the province's arms): red, rampant, crowned, its tail
// forked, facing the cab; h its height, centered at (x, y). It turns with
// the car.
const LION = "M-0.12 -0.46L-0.04 -0.5L0 -0.44L0.05 -0.5L0.08 -0.42L0.06 -0.32Q0.14 -0.22 0.1 -0.08Q0.2 0.05 0.16 0.18L0.3 0.04Q0.42 -0.1 0.36 -0.3" +
  "L0.43 -0.37L0.39 -0.22Q0.47 -0.08 0.34 0.08L0.22 0.24L0.25 0.41L0.33 0.48L0.13 0.48L0.1 0.3L0 0.26L-0.1 0.4L-0.04 0.48L-0.23 0.48L-0.2 0.3L-0.06 0.12" +
  "Q-0.12 0 -0.1 -0.1L-0.3 -0.02L-0.39 0.02L-0.36 -0.07L-0.26 -0.12L-0.12 -0.18L-0.32 -0.22L-0.41 -0.2L-0.38 -0.28L-0.28 -0.3L-0.16 -0.28L-0.22 -0.32L-0.31 -0.34L-0.2 -0.39Z";
const limburgLion = (c, x, y, h, fill = "#d0202e") => mark({ ...c, mirrored: false }, x, y, `<path d="${LION}" transform="scale(${n(h)})" fill="${fill}"/>`);

// An end car. part "endA" (the car with first class, if any, or the one
// the middle car hangs from, if "J"), "endB".
function gtwEnd(c, k, { jakobs = false, first = false } = {}) {
  const L = c.L, P = GTP[k];
  const low = P.low === 4 ? GT_LOW4 : GT_LOW5;
  const part = first ? "endA" : "endB";
  return sec(c, {
    base: P.base, cab: true, truckTop: 2.4,
    outline: box(L, { roof: GT.roof, low: GT.low, nose: GT_NOSE, bottom: GT_BOTTOM }),
    trucks: [[20.0, 6.9, 29.5], ...(jakobs ? [[L, 6.9, 29.5]] : [])],
    paint: (cc) => {
      let s = P.body(cc, L, "end");
      s += path(poly(GT_SCREEN.map(([x, y]) => [x - 0.2, y + (y > 11 ? 0.25 : -0.3)])), P.screen || "#16191c") + path(poly(GT_SCREEN), C.glass);
      s += path(GT_DWIN, "#15181b") + path("M15.0 10.3L11.05 10.3Q9.7 10.1 9.25 8.65Q9.1 7.25 10.45 7.05L15.0 7.05Z", C.glass) +
        path("M15.0 10.3L11.05 10.3Q10.0 10.15 9.6 9.3L15.0 9.3Z", C.glassLight);
      return s;
    },
    wins: [...GT_HIGH, ...low.map(([a, b]) => [a, b, 5.1, 9.9])],
    over: (cc) => P.marks(cc, L, "end"),
    doors: [{ x: GT_DOOR, w: 4.3, y0: 1.9, y1: 10.5 }], door: (cc, d) => P.door(cc, d, part),
    under: () => rect(36.0, 1.1, 8.0, 0.7, "#3a3e44", 0.3) + rect(5.0, 1.6, 3.0, 0.9, "#3a3e44", 0.3),
    extra: (cc) => {
      let s = hvac(9.6, GT.roof, 9.0, 0.7, "#3d4247") + roofCover(41.0, GT.roof, 9.0, 0.4, P.roof, 2);
      s += coupler(cc, { x: 1.2, y: 3.0, defl: [0.9, 6.0, 1.15, 2.5] }) + lamp(1.15, 5.15, 0.32, 0.42) + lamp(1.2, 4.5, 0.26, 0.3, RED_LAMP) +
        wiper(2.1, 8.0, 3.3, 9.9);
      return s;
    },
    gangway: [1.7, 12.4],
  });
}
function gtwMid(c, k) {
  const L = c.L, P = GTP[k];
  return sec(c, {
    base: P.base, truckTop: 2.4,
    outline: box(L, { roof: GT.roof, low: GT.low }),
    trucks: [[0, 6.9, 29.5]],
    paint: (cc) => P.body(cc, L, "mid"),
    wins: GT_MID.wins.map(([a, b]) => [a, b, 5.1, 9.9]),
    over: (cc) => P.marks(cc, L, "mid"),
    doors: [{ x: GT_MID.door, w: 4.3, y0: 1.9, y1: 10.5 }], door: (cc, d) => P.door(cc, d, "mid"),
    under: () => rect(20.0, 1.1, 10.0, 0.7, "#3a3e44", 0.3),
    extra: () => roofCover(18.0, GT.roof, 12.0, 0.4, P.roof, 3),
    gangway: [1.7, 12.4],
  });
}
// The power module: a short box on the motor truck, the gangway through
// it (a narrow window high in its side), the engines' (or transformer's)
// access doors and grilles; on the diesels the radiators and exhausts on
// the roof, on the electric ones the pantograph.
function gtwModule(c, k, electric) {
  const L = c.L, P = GTP[k], roof = GT.roof + 0.05;
  return sec(c, {
    base: P.base, truckTop: 3.1,
    outline: box(L, { roof, low: 2.7, x0: 0.9, x1: L - 0.9, r: 0.35 }),
    trucks: [[L / 2, 8.2, 33.9, "loco"]],
    // Limburg's diesel modules kept Veolia's gray when the units were only
    // relettered (Boxmeer, 385, 2025): two big louvred grilles over the
    // engines; the repainted electric ones are blue like the cars
    // (Klimmen-Ransdaal, 2024). The yellow line stops at the module.
    paint: (cc) => (k === "limburg" && !electric
      ? rect(-1, -1, L + 2, 16, "#80868c") + [2.2, L / 2 + 0.4].map((a) => rect(a, 5.6, L / 2 - 2.6, 5.4, "#5d6268", 0, 'rx="0.15"') + slats(a + 0.2, 5.8, L / 2 - 3.0, 5.0, 0.3, "rgba(255,255,255,0.22)")).join("") +
        rect(2.2, 1.6, L - 4.4, 3.4, "none", 0, 'rx="0.2" stroke="rgba(0,0,0,0.3)" stroke-width="0.08"')
      : P.body(cc, L, "mod") + rect(2.4, 3.2, L - 4.8, 6.4, "none", 0, 'rx="0.2" stroke="rgba(0,0,0,0.3)" stroke-width="0.08"') +
        line(L / 2, 3.2, L / 2, 9.6, "rgba(0,0,0,0.3)", 0.5) + slats(3.0, 10.4, L - 6.0, 1.6, 0.32, "rgba(0,0,0,0.28)")),
    over: (cc) => P.marks(cc, L, "mod"),
    extra: () => {
      // The gangway bellows at each end (the end cars' faces meet them).
      let s = rect(0.0, 2.2, 0.9, 10.4, C.rubber, 0, 'rx="0.2"') + rect(L - 0.9, 2.2, 0.9, 10.4, C.rubber, 0, 'rx="0.2"');
      if (electric) s += pantograph(L / 2, roof, { up: true, facing: -1 }) + rect(L / 2 - 4.6, roof - 0.05, 1.6, 0.8, C.steelDark, 0.3, 'rx="0.15"');
      else s += roofCover(2.0, roof, L - 4.0, 0.9, "#8d9399", 3) + rect(L / 2 - 0.3, roof + 0.85, 0.6, 0.6, "#3b3f44");
      return s + rect(L / 2 - 3.0, 1.4, 6.0, 1.3, "#3a3e44", 0.4, 'rx="0.15"');
    },
    gangway: [2.7, 12.4],
  });
}

// ===================== Stadler FLIRT 3 (the Dutch versions) =====================
// Arriva Limburg's (II: two cars, 45.7 m, 2016; IIImc: three cars, 63.2 m,
// for the Drielandentrein, 2018) and Keolis's (three cars 63.2 m, four 80.7
// m, 2017; two three-car ex-Connexxion units on the Valleilijn, 2018): end
// cars 22.85 m with the motor truck under the cab's raised floor (its
// center 5.25 m from the coupler), the cars between 17.5 m, all on Jakobs
// trucks; 4.12 m tall; double plug doors, 1.3 m. The crash-proof Dutch
// front: upright, a black mask round the windshield.
const FL = { end: 75.0, mid: 57.4, roof: 13.5, low: 1.35 };
const FL_NOSE = [[9.8, 13.5], [7.6, 13.36], [5.8, 12.85], [4.5, 12.0], [3.6, 10.9], [2.95, 9.5], [2.45, 7.7], [2.05, 5.9], [1.9, 4.0], [1.95, 2.4], [2.7, 1.9]];
const FL_BOTTOM = [[3.0, 2.6], [22.2, 2.6], ["q", 23.2, 2.6, 23.6, 1.35]];
const FL_SCREEN = [[2.55, 7.9], [3.05, 9.7], [3.75, 11.05], [4.75, 12.05], [6.0, 12.65], [7.3, 12.8], [7.3, 8.3]];
// Layouts per car: windows [x0, x1] (y from 5.0 to 10.0 unless given),
// doors (left edges, 4.3 ft wide).
const FL_LAY = {
  // Arriva IIImc (Drielandentrein), from the cab: the cab's side window,
  // two windows, the door, six windows.
  arrCab3: { wins: [[15.2, 19.0], [19.8, 23.6]], tail: [[31.2, 35.2], [36.6, 40.6], [42.0, 46.0], [47.4, 51.4], [52.8, 56.8], [58.2, 62.2], [63.6, 67.6], [69.0, 73.0]], doors: [25.2] },
  // Its middle car, with both pantographs: five windows, the door, three.
  arrMid3: { wins: [[2.4, 6.4], [7.6, 11.6], [12.8, 16.8], [18.0, 22.0], [23.2, 27.2], [28.4, 32.4]], doors: [34.0], tail: [[40.0, 44.0], [45.2, 49.2], [50.4, 54.4]], pans: [44.0, 13.0] },
  // Arriva II: two doors on each car (the pantograph over the cab car's
  // inner end).
  arrCab2: { wins: [[18.4, 22.0]], tail: [[29.0, 33.0], [34.4, 38.4], [39.8, 43.8], [45.2, 48.4]], doors: [23.2, 49.6], tail2: [[55.6, 59.6], [61.0, 65.0], [66.4, 70.4]] },
  // Keolis (and the Valleilijn's two): the cab door, two windows, the
  // door, six; the middle car two, the door, five.
  keoCab: { wins: [[15.6, 19.4], [20.4, 24.2]], tail: [[31.6, 35.4], [36.8, 40.6], [42.0, 45.8], [47.2, 51.0], [52.4, 56.2], [57.6, 61.4], [62.8, 66.6], [68.0, 71.8]], doors: [25.6], cabDoor: true },
  keoMid: { wins: [[2.4, 6.2], [7.6, 11.4]], doors: [13.2], tail: [[19.2, 23.0], [24.4, 28.2], [29.6, 33.4], [34.8, 38.6], [40.0, 43.8], [45.2, 49.0], [50.4, 54.2]], pans: [] },
  keoMidP: { wins: [[2.4, 6.2], [7.6, 11.4]], doors: [13.2], tail: [[19.2, 23.0], [24.4, 28.2], [29.6, 33.4], [34.8, 38.6], [40.0, 43.8], [45.2, 49.0], [50.4, 54.2]], pans: [44.0] },
};
const FLP = {};
// Arriva Limburg: the cab white, sweeping back to a curve before the first
// windows; royal blue; the windows and doors framed in a yellow line;
// light blue doors; Limburg's lion behind the cab (not on the IIImc: the
// Drielandentrein's carry "Drielandentrein" instead, at Belgium's
// request); the A on the nose; "arriva" with DB's "a DB company" low on
// the side. First class: twelve seats at the inner end of a cab car.
FLP.limburg = {
  base: "#f4f4f4",
  body: (c, L, cab, lay, k) => {
    let s = rect(-1, -1, L + 2, 16, "#2b4fb6");
    const w = k === "mc" ? 13.4 : 16.4;
    if (cab) s += path(`M-1 -1L${w} -1Q${w - 0.8} 6.4 ${w + 1.0} 13.0L${w + 1.0} 16L-1 16Z`, "#f4f4f4");
    const a = cab ? w + 1.2 : 0.9, b = L - 0.9;
    s += rect(a, 4.5, b - a, 6.2, "none", 0, 'rx="0.5" stroke="#f2b632" stroke-width="0.16"');
    return s;
  },
  door: (c, d, first) => plugDoor(c, d, "#93b5e8") + rect(d.x - 0.25, d.y0 + 0.4, d.w + 0.5, d.y1 - d.y0 - 0.2, "none", 0, 'rx="0.3" stroke="#f2b632" stroke-width="0.14"') + doorClasses(c, d, first ? "1" : "2", "2"),
  marks: (c, L, cab, lay, k) => {
    let s = "";
    if (cab && k === "mc") s += arrivaA(c, 2.6, 5.3, 0.9, "#2b4fb6");
    if (cab && k !== "mc") s += arrivaOld(c, 2.5, 5.3, 0.8, "#2b4fb6", false) + limburgLion(c, 14.2, 6.6, 6.4);
    // The IIImcs carry Arriva's new mark, the IIs the old one.
    s += k === "mc" ? arrivaWord(c, cab ? 33.6 : 40.0, 3.0, 0.95, "#ffffff") : arrivaOld(c, cab ? 30.0 : 34.0, 3.2, 0.85);
    return s;
  },
};
// Blauwnet (Keolis): the cab white, the body blue with a light blue band
// low along it; big white numerals by each door ("1" and "2" on the cab
// cars, whose first class is the two windows behind the cab, "2" and "2"
// on the others); Blauwnet's mark low by the doors; "KEOLIS" on the nose.
FLP.bnet = {
  base: "#f4f5f6",
  body: (c, L, cab) => {
    let s = rect(-1, -1, L + 2, 16, "#1e70c8");
    if (cab) s += path("M-1 -1L13.8 -1L13.8 16L-1 16Z", "#f4f5f6") + rect(-1, -1, 13.8, 3.0, "#4aa7e4");
    return s;
  },
  door: (c, d, first) => plugDoor(c, d, "#f4f5f6") + doorClasses(c, d, first ? "1" : "2", "2"),
  marks: (c, L, cab, lay, k, first) => lay.doors.map((x) => bigClass(c, x - 3.2, cab && first ? "1" : "2") + bigClass(c, x + 7.5, "2")).join("") +
    (cab ? letters(c, 5.6, 2.6, 0.75, "KEOLIS", "#1e70c8", { weight: 600, spacing: "0.06em" }) : "") + blauwnet(c, cab ? 36.0 : 25.0, 2.9, 1.0),
};
// The Valleilijn's (Connexxion's, Keolis's since December 2023; still in
// it in 2026 while the RRReis refits go on): light blue, darker blue waves
// sweeping along the lower body; the front white; class numerals "1" and
// "2" by the windows; "Valleilijn" low on the side.
FLP.vallei = {
  base: "#55bde6",
  body: (c, L, cab) => {
    let s = rect(-1, -1, L + 2, 16, "#55bde6");
    // Three bands sweeping down from the windows to the sill and up again.
    for (const [k, col] of [[0, "#1f7fcb"], [1.4, "#8fd6f2"], [2.8, "#1f7fcb"]])
      s += `<path d="M${n(L * 0.05)} ${n(11.0 - k)}C${n(L * 0.3)} ${n(11.0 - k)} ${n(L * 0.33)} ${n(3.4 - k)} ${n(L * 0.62)} ${n(3.0 - k)}C${n(L * 0.8)} ${n(2.8 - k)} ${n(L * 0.9)} ${n(6.0 - k)} ${n(L + 1)} ${n(9.0 - k)}" fill="none" stroke="${col}" stroke-width="1.0"/>`;
    if (cab) s += path("M-1 -1L7.6 -1L7.6 4.0Q7.8 9.0 9.4 13.6L-1 13.6Z", "#f4f5f6") + `<path d="M1.6 6.3Q4.0 5.6 7.4 6.2" fill="none" stroke="#3aa3dc" stroke-width="0.25"/>`;
    return s;
  },
  door: (c, d) => plugDoor(c, d, "#4b5157"),
  marks: (c, L, cab) => (cab ? letters(c, 26.6, 8.6, 0.9, "1", "#ffffff", { weight: 700 }) : "") + letters(c, cab ? 44.0 : 34.0, 8.6, 0.9, "2", "#ffffff", { weight: 700 }) +
    letters(c, cab ? 50.0 : 30.0, 3.0, 1.0, "Valleilijn", "#3aa3dc", { weight: 500, style: "italic" }),
};
function flirtCar(c, lk, pk, { variant = "", first = false } = {}) {
  const L = c.L, lay = FL_LAY[lk], P = FLP[pk], cab = lk.endsWith("Cab3") || lk.endsWith("Cab2") || lk === "keoCab";
  const wins = [...lay.wins, ...(lay.tail || []), ...(lay.tail2 || [])].map(([a, b, y0 = 4.7, y1 = 10.3]) => [a, b, y0, y1]);
  const doors = lay.doors.map((x) => ({ x, w: 4.3, y0: 1.75, y1: 10.4 }));
  return sec(c, {
    base: P.base, cab, truckTop: 2.9,
    outline: box(L, { roof: FL.roof, low: FL.low, nose: cab ? FL_NOSE : null, bottom: cab ? FL_BOTTOM : null }),
    trucks: [...(cab ? [[17.2, 8.2, 36, "car"]] : [[0, 8.86, 30]]), [L, 8.86, 30]],
    paint: (cc) => {
      let s = P.body(cc, L, cab, lay, variant);
      if (cab) {
        s += path(poly(FL_SCREEN.map(([x, y]) => [x - 0.3, y + (y > 12 ? 0.25 : -0.4)])), "#16191c") + path(poly(FL_SCREEN), C.glass) +
          rect(8.6, 8.2, 2.4, 3.3, "#16191c", 0, 'rx="0.4"') + rect(8.8, 8.4, 2.0, 2.9, C.glass, 0, 'rx="0.3"');
        if (lay.cabDoor) s += rect(11.4, 2.8, 2.3, 9.0, "none", 0, 'rx="0.3" stroke="rgba(0,0,0,0.35)" stroke-width="0.08"') + rect(11.8, 8.2, 1.5, 2.6, "#16191c", 0, 'rx="0.3"');
      }
      return s;
    },
    wins, over: (cc) => P.marks(cc, L, cab, lay, variant, first),
    doors, door: (cc, d) => P.door(cc, d, cab && first),
    under: () => (cab ? rect(9.0, 1.9, 4.0, 0.9, "#3a3e44", 0.4) + rect(30.0, 0.9, 10.0, 0.6, "#3a3e44", 0.3) : rect(18.0, 0.9, 12.0, 0.6, "#3a3e44", 0.3)),
    extra: (cc) => {
      let s = hvac(cab ? 24.0 : L / 2 - 6, FL.roof, 11.0, 0.65, "#9aa0a6") + (cab ? roofCover(13.0, FL.roof, 8.5, 0.55, "#9aa0a6", 2) : "");
      for (const x of lay.pans || []) s += pantograph(x, FL.roof, { up: x === (lay.pans || [])[0], facing: -1 });
      if (lk === "arrCab2" && first) s += pantograph(L - 9.0, FL.roof, { up: true, facing: -1 });
      if (cab) s += coupler(cc, { x: 1.9, y: 2.9, defl: [1.3, 6.4, 1.0, 2.0] }) + lamp(2.0, 4.6, 0.36, 0.5) + lamp(2.0, 3.9, 0.3, 0.32, RED_LAMP) +
        wiper(3.1, 9.0, 3.9, 11.0);
      return s;
    },
    gangway: [1.4, 12.6],
  });
}

// ===================== Stadler WINK (Arriva, Groningen and Friesland) =====================
// Stadler's WINK (2021): two FLIRT-like end cars on the Jakobs trucks of a
// power module between them (two diesel engines, batteries; a pantograph to
// charge under the wires), 55.5 m, 4.12 m tall; the cab cars' motor trucks
// 5.4 m from the couplers. One door a side on the Bfk end car, two on the
// Bk. From Stadler's type drawing ("Typenskizze Arriva") and photographs
// (Wehl 605, 2022; Leeuwarden, Harlingen, Mantgum, 2023-2025): the cab
// white, light turquoise sweeping back across it, the cars turquoise; the
// windows in one black band; white doors; Arriva's big "A" outlined on the
// module, "arriva" white low on the cars. No first class.
const WK = { end: 79.1, mod: 23.6, roof: 13.5, low: 1.3 };
const WK_LAY = {
  bfk: { band: [[15.5, 33.2], [39.7, 76.4]], wins: [[16.0, 21.4], [22.0, 27.4], [28.0, 32.7], [40.3, 45.6], [46.2, 51.5], [52.1, 57.4], [58.0, 63.3], [63.9, 69.2], [69.8, 75.9]], doors: [34.0] },
  bk: { band: [[15.5, 33.2], [39.7, 59.6], [65.4, 76.4]], wins: [[16.0, 21.4], [22.0, 27.4], [28.0, 32.7], [40.3, 45.6], [46.2, 51.5], [52.1, 59.0], [66.0, 70.8], [71.4, 75.9]], doors: [34.0, 60.2] },
};
function winkEnd(c, part) {
  const L = c.L, lay = WK_LAY[part];
  return sec(c, {
    base: "#f3f4f4", cab: true, truckTop: 2.9,
    outline: box(L, { roof: WK.roof, low: WK.low, nose: FL_NOSE, bottom: [[3.0, 2.6], [22.6, 2.6], ["q", 23.6, 2.6, 24.0, 1.3]] }),
    trucks: [[17.7, 8.86, 34, "car"], [L, 8.86, 30]],
    paint: () => {
      const [d, f] = grad(0, 2, 0, 13.5, [[0, "#2fa9c0"], [0.5, "#43b7cc"], [1, "#58c1d4"]]);
      let s = d + rect(-1, -1, L + 2, 16, f);
      // The white cab and the light turquoise sweeping back across it.
      s += path("M-1 -1L14.6 -1L16.0 16L-1 16Z", "#f3f4f4") + path("M14.6 -1L19.4 -1L21.6 16L16.0 16Z", "#c3e8ee") + path("M19.4 -1L25.0 -1L28.0 16L21.6 16Z", "#8fd3df");
      for (const [a, b] of lay.band) s += rect(a, 5.6, b - a, 4.5, "#14171a", 0, 'rx="0.4"');
      s += path(poly(FL_SCREEN.map(([x, y]) => [x - 0.3, y + (y > 12 ? 0.25 : -0.4)])), "#16191c") + path(poly(FL_SCREEN), C.glass) +
        rect(8.6, 8.2, 2.4, 3.3, "#16191c", 0, 'rx="0.4"') + rect(8.8, 8.4, 2.0, 2.9, C.glass, 0, 'rx="0.3"') +
        rect(11.4, 2.8, 2.3, 9.0, "none", 0, 'rx="0.3" stroke="rgba(0,0,0,0.35)" stroke-width="0.08"') + rect(11.8, 8.2, 1.5, 2.6, "#16191c", 0, 'rx="0.3"');
      return s;
    },
    wins: lay.wins.map(([a, b]) => [a, b, 5.8, 9.9, 0.3]),
    over: (cc) => arrivaWord(cc, part === "bfk" ? 52.0 : 48.0, 3.4, 1.5, "#ffffff") + arrivaA(cc, 2.7, 5.4, 0.8, "#43b7cc"),
    doors: lay.doors.map((x) => ({ x, w: 4.3, y0: 1.6, y1: 10.4 })), door: (cc, d) => plugDoor(cc, d, "#f4f5f5") + doorClasses(cc, d, "2", "2"),
    under: () => rect(9.0, 1.9, 4.0, 0.9, "#3a3e44", 0.4) + rect(30.0, 0.9, 10.0, 0.6, "#3a3e44", 0.3),
    extra: (cc) => hvac(24.0, WK.roof, 11.0, 0.65, "#9aa0a6") + roofCover(56.0, WK.roof, 10.0, 0.5, "#9aa0a6", 2) +
      coupler(cc, { x: 1.9, y: 2.9, defl: [1.3, 6.4, 1.0, 2.0] }) + lamp(2.0, 4.6, 0.36, 0.5) + lamp(2.0, 3.9, 0.3, 0.32, RED_LAMP) + wiper(3.1, 9.0, 3.9, 11.0),
    gangway: [1.3, 12.6],
  });
}
// The WINK's power module: the engines behind two big access doors each
// side under the radiators' grilles; the pantograph on its roof.
function winkModule(c) {
  const L = c.L, roof = WK.roof + 0.1;
  return sec(c, {
    base: "#2fa9c0", truckTop: 2.9,
    outline: box(L, { roof, low: 1.6, x0: 1.2, x1: L - 1.2, r: 0.4 }),
    trucks: [[0, 8.86, 30], [L, 8.86, 30]],
    paint: () => {
      const [d, f] = grad(0, 2, 0, 13.5, [[0, "#2aa3bb"], [1, "#4fbdd0"]]);
      let s = d + rect(-1, -1, L + 2, 16, f);
      for (const a of [2.0, L / 2 + 0.6]) s += rect(a, 1.9, L / 2 - 2.6, 7.6, "none", 0, 'rx="0.3" stroke="rgba(0,0,0,0.35)" stroke-width="0.08"') +
        line(a + (L / 2 - 2.6) / 2, 2.0, a + (L / 2 - 2.6) / 2, 9.4, "rgba(0,0,0,0.3)", 0.5) + rect(a + 0.2, 11.0, L / 2 - 3.0, 2.0, "#1d2226", 0, 'rx="0.2"') +
        slats(a + 0.3, 11.1, L / 2 - 3.2, 1.8, 0.3, "rgba(255,255,255,0.25)");
      return s;
    },
    over: (cc) => arrivaA(cc, L / 2, 6.0, 7.4, "#ffffff", 0.05),
    extra: () => pantograph(L / 2, roof, { up: false, facing: -1 }) + roofCover(1.8, roof, 5.0, 0.6, "#8d9399", 1) + roofCover(L - 6.8, roof, 5.0, 0.6, "#8d9399", 1) +
      rect(0.0, 1.8, 1.2, 10.8, C.rubber, 0, 'rx="0.2"') + rect(L - 1.2, 1.8, 1.2, 10.8, C.rubber, 0, 'rx="0.2"'),
    gangway: [1.6, 12.6],
  });
}

// ===================== Alstom Coradia LINT 41/H (Arriva, Blauwnet) =====================
// Two cars on a Jakobs truck, 41.89 m, the body 4.0 m high (4.34 m over the
// roof equipment); a diesel engine under each car's raised end, the low
// floor (780 mm) round the doors; one double door a side on each car. Ex-
// Syntus, in Blauwnet's paint (Almelo-Hardenberg, the Vechtdallijnen's;
// Zutphen-Oldenzaal since December 2023). Photographs at Almelo (34,
// 2025), Hengelo (30, 2025), Zutphen (26, 2026).
const LT = { car: 68.7, roof: 13.1, low: 1.6 };
const LT_NOSE = [[7.4, 13.1], [5.6, 12.9], [4.2, 12.3], [3.1, 11.2], [2.3, 9.8], [1.75, 8.2], [1.4, 6.4], [1.25, 4.6], [1.3, 3.0], [1.9, 2.4]];
const LT_SCREEN = [[1.75, 8.0], [2.25, 9.6], [3.0, 10.9], [4.1, 11.95], [5.5, 12.5], [6.6, 12.6], [6.6, 8.2]];
const LTP = {
  // The Vechtdallijnen's: the cab white, a diagonal back to the second
  // window; blue, lighter below the windows; "Vechtdallijnen" big in white,
  // "ARRIVA" with the old mark on the white; the door's classes "1" and
  // "2" (eight first-class seats, behind the cab).
  vecht: {
    body: (c, L, part) => {
      let s = rect(-1, -1, L + 2, 16, "#1e74c8") + rect(-1, -1, L + 2, 4.9, "#3c9fe0");
      s += path(part === "a" ? "M-1 -1L16.0 -1L19.6 13.6L-1 13.6Z" : "M-1 -1L11.0 -1L13.0 13.6L-1 13.6Z", "#f3f4f5");
      return s;
    },
    marks: (c, L, part) => (part === "a" ? arrivaOld(c, 6.6, 3.6, 0.95, "#1e5fa8") + fitted(c, 50.0, 3.4, 1.6, "Vechtdallijnen", "#ffffff", 15.0, { weight: 500 }) :
      fitted(c, 44.0, 3.4, 1.6, "Vechtdallijnen", "#ffffff", 15.0, { weight: 500 })),
    classes: (part) => (part === "a" ? ["1", "2"] : ["2", "2"]),
  },
  // Blauwnet's own (Zutphen-Oldenzaal): the cab white, blue with the light
  // blue band low; big white numerals either side of the doors; Blauwnet's
  // mark; "arriva" on the nose.
  bnet: {
    body: (c, L, part) => {
      let s = rect(-1, -1, L + 2, 16, "#1d6ec7") + rect(-1, -1, L + 2, 4.6, "#48a6e3");
      s += path("M-1 -1L13.0 -1L13.0 6.0Q13.4 11.6 16.0 13.6L-1 13.6Z", "#f3f4f5");
      return s;
    },
    marks: (c, L, part) => arrivaWord(c, 6.2, 3.6, 0.7, "#5b6670") + blauwnet(c, 46.0, 2.8, 0.7),
    big: true,
    // No first class: the eight seats behind one cab are a work compartment
    // on this line.
    classes: () => ["2", "2"],
  },
};
function lintCar(c, k, part) {
  const L = c.L, P = LTP[k];
  const wins = part === "a" ? [[8.4, 10.8, 6.6, 10.4], [13.6, 18.8], [19.8, 24.6], [25.6, 29.4], [38.8, 43.6], [44.6, 49.4], [50.4, 55.2], [56.2, 61.0], [62.0, 66.4]]
    : [[8.4, 10.8, 6.6, 10.4], [13.6, 18.8], [19.8, 24.6], [25.6, 29.4], [38.8, 43.6], [44.6, 49.4], [50.4, 55.2], [56.2, 61.0], [62.0, 66.4]];
  const door = 31.4;
  return sec(c, {
    base: "#f3f4f5", cab: true, truckTop: 2.9,
    outline: box(L, { roof: LT.roof, low: LT.low, nose: LT_NOSE, bottom: [[2.4, 2.5], [21.0, 2.5], ["q", 22.0, 2.5, 22.4, 1.6], [56.0, 1.6], ["q", 57.0, 1.6, 57.4, 2.5]] }),
    trucks: [[13.0, 8.2, 30.3, "car"], [L, 8.86, 30.3]],
    paint: (cc) => {
      let s = P.body(cc, L, part);
      s += path(poly(LT_SCREEN.map(([x, y]) => [x - 0.3, y + (y > 12 ? 0.25 : -0.4)])), "#16191c") + path(poly(LT_SCREEN), C.glass);
      return s;
    },
    wins: wins.map(([a, b, y0 = 5.6, y1 = 10.4]) => [a, b, y0, y1, 0.3]),
    over: (cc) => P.marks(cc, L, part) + (P.big ? bigClass(cc, door - 3.2, P.classes(part)[0]) + bigClass(cc, door + 7.5, P.classes(part)[1]) : ""),
    doors: [{ x: door, w: 4.3, y0: 1.9, y1: 10.6 }],
    door: (cc, d) => { const [l, r] = P.classes(part); return plugDoor(cc, d, "#f4f5f6") + doorClasses(cc, d, l, r); },
    under: () => rect(5.0, 1.4, 5.5, 1.0, "#3a3e44", 0.4) + rect(58.0, 1.6, 7.0, 1.0, "#3a3e44", 0.4),
    extra: (cc) => roofCover(4.5, LT.roof, 8.0, 0.8, "#a9aeb3", 2) + hvac(22.0, LT.roof, 9.0, 0.7, "#9aa0a6") + roofCover(56.0, LT.roof, 9.0, 0.8, "#a9aeb3", 2) +
      rect(52.5, LT.roof, 0.5, 1.2, "#5a4a3a") + coupler(cc, { x: 1.4, y: 3.1, defl: [1.0, 5.6, 1.1, 2.4] }) + lamp(1.35, 5.2, 0.32, 0.45) + lamp(1.35, 4.5, 0.26, 0.3, RED_LAMP) + wiper(2.2, 9.0, 3.2, 10.8),
    gangway: [1.6, 12.3],
  });
}

// ===================== Protos (Keolis, the Valleilijn) =====================
// Fahrzeugtechnik Dessau's Protos (2007; the only five built, 5031-5035):
// two 26.4 m cars, each on two trucks of its own (the motor trucks at the
// inner ends), 54.5 m over the couplers, a tall body (4.58 m over the roof
// equipment); two double doors a side on each car; 16 first-class seats
// behind one cab. The Valleilijn's light blue with darker waves, still worn
// in 2026 ("Valleilijn wordt RRReis") while the refits go on.
const PR = { car: 89.4, roof: 13.8, low: 2.0 };
const PR_NOSE = [[7.0, 13.8], [5.0, 13.6], [3.6, 13.0], [2.6, 12.0], [2.0, 10.6], [1.7, 8.8], [1.55, 6.8], [1.5, 4.6], [1.55, 3.0], [2.1, 2.4]];
const PR_SCREEN = [[1.95, 8.2], [2.2, 10.4], [2.8, 11.9], [3.8, 12.75], [5.0, 13.05], [5.0, 8.2]];
function protosCar(c, part) {
  const L = c.L, first = part === "a";
  const wins = [[7.4, 10.4, 6.6, 10.6], [12.6, 16.6], [17.4, 21.4], [28.6, 32.6], [33.4, 37.4], [38.2, 42.2], [43.0, 47.0], [47.8, 51.8], [52.6, 56.6], [57.4, 61.4], [68.6, 72.6], [73.4, 77.4], [78.2, 82.2], [83.0, 86.4]];
  return sec(c, {
    base: "#55bde6", cab: true, truckTop: 3.0,
    outline: box(L, { roof: PR.roof, low: PR.low, nose: PR_NOSE }),
    trucks: [[12.4, 8.2, 30, "car"], [L - 12.4, 8.2, 33, "car"]],
    paint: (cc) => {
      let s = FLP.vallei.body(cc, L, false);
      s += path("M-1 -1L5.6 -1L5.6 4.0Q5.8 9.4 7.0 14L-1 14Z", "#e9ecee") + `<path d="M1.8 6.6Q3.6 6.0 5.6 6.4" fill="none" stroke="#3aa3dc" stroke-width="0.25"/>`;
      s += path(poly(PR_SCREEN.map(([x, y]) => [x - 0.3, y + (y > 12 ? 0.25 : -0.4)])), "#16191c") + path(poly(PR_SCREEN), C.glass);
      return s;
    },
    wins: wins.map(([a, b, y0 = 5.4, y1 = 10.0]) => [a, b, y0, y1, 0.35]),
    over: (cc) => (first ? letters(cc, 11.6, 8.6, 0.9, "1", "#ffffff", { weight: 700 }) : letters(cc, 11.6, 8.6, 0.9, "2", "#ffffff", { weight: 700 })) +
      letters(cc, 27.6, 8.6, 0.9, "2", "#ffffff", { weight: 700 }) + letters(cc, 62.4, 8.6, 0.9, "2", "#ffffff", { weight: 700 }) +
      letters(cc, 44.0, 3.2, 1.1, "Valleilijn", "#3aa3dc", { weight: 500, style: "italic" }),
    doors: [{ x: 22.4, w: 4.3, y0: 2.2, y1: 10.8 }, { x: 63.0, w: 4.3, y0: 2.2, y1: 10.8 }], door: (cc, d) => plugDoor(cc, d, "#4b5157"),
    under: () => rect(20.0, 1.4, 8.0, 0.8, "#3a3e44", 0.3) + rect(64.0, 1.4, 10.0, 0.8, "#3a3e44", 0.3),
    extra: (cc) => hvac(20.0, PR.roof, 12.0, 0.7, "#8f969d") + roofCover(60.0, PR.roof, 14.0, 0.8, "#8f969d", 3) + pantograph(L - 6.0, PR.roof + 0.1, { up: !first, facing: -1 }) +
      coupler(cc, { x: 1.6, y: 3.2, defl: [1.2, 5.8, 1.2, 2.5] }) + lamp(1.6, 5.2, 0.34, 0.45) + lamp(1.6, 4.5, 0.28, 0.3, RED_LAMP) + wiper(2.3, 9.2, 3.0, 11.2),
    gangway: [2.0, 12.6],
  });
}

// ===================== Tables =====================
// GTW keys: <paint>Gtw + A (end car, first class where the paint's units
// have it), AJ (the same on the shared truck with the middle car), B (the
// other end car), Mid, Mod (the power module; Limburg's ModD diesel, ModE
// electric).
const GTW_PAINTS = {
  arn: { k: "noord", name: "Arriva Spurt (GTW)", first: false, electric: false },
  rrr: { k: "rrreis", name: "Arriva Spurt (GTW), RRReis", first: true, electric: false },
  vdl: { k: "vecht", name: "Arriva Spurt (GTW-E), Vechtdallijnen", first: true, electric: true },
  bnw: { k: "bnet", name: "Arriva Spurt (GTW), Blauwnet", first: false, electric: false },
  rnt: { k: "rnet", name: "Qbuzz GTW-E (R-net)", first: false, electric: true },
  lim: { k: "limburg", name: "Arriva Limburg GTW", first: true, electric: null },
  lie: { k: "limburgE", name: "Arriva Limburg GTW-E", first: true, electric: true },
};
export const TYPES = {};
const M = (draw, len, oneEnd = false) => ({ draw, len, oneEnd });
export const MODELS = {};
for (const [p, g] of Object.entries(GTW_PAINTS)) {
  const firstNote = g.first ? ", 1st and 2nd class" : "";
  const amen = g.first ? { amenities: ["first"] } : {};
  TYPES[`${p}GtwA`] = { name: `${g.name} end car${firstNote}`, kind: "emu", ...amen };
  TYPES[`${p}GtwAJ`] = { name: `${g.name} end car${firstNote}`, kind: "emu", ...amen };
  TYPES[`${p}GtwB`] = { name: `${g.name} end car`, kind: "emu" };
  TYPES[`${p}GtwBJ`] = { name: `${g.name} end car`, kind: "emu" };
  TYPES[`${p}GtwMid`] = { name: `${g.name} middle car`, kind: "emu" };
  MODELS[`${p}GtwA`] = M((c) => gtwEnd(c, g.k, { first: g.first }), GT.end, true);
  MODELS[`${p}GtwAJ`] = M((c) => gtwEnd(c, g.k, { first: g.first, jakobs: true }), GT.end, true);
  MODELS[`${p}GtwB`] = M((c) => gtwEnd(c, g.k), GT.end, true);
  MODELS[`${p}GtwBJ`] = M((c) => gtwEnd(c, g.k, { jakobs: true }), GT.end, true);
  MODELS[`${p}GtwMid`] = M((c) => gtwMid(c, g.k), GT.mid);
  for (const el of g.electric === null ? [false, true] : [g.electric]) {
    const key = `${p}GtwMod${g.electric === null ? (el ? "E" : "D") : ""}`;
    TYPES[key] = { name: `${g.name} power module (${el ? "pantograph, transformer" : "diesel engines"})`, kind: "module" };
    MODELS[key] = M((c) => gtwModule(c, g.k, el), GT.mod);
  }
}
Object.assign(TYPES, {
  limF2Cab: { name: "Arriva FLIRT 3 (II) end car", kind: "emu" },
  limF2CabA: { name: "Arriva FLIRT 3 (II) motor car, 1st and 2nd class", kind: "emu", amenities: ["first"] },
  limF3Cab: { name: "Arriva FLIRT 3 (IIImc, Drielandentrein) end car", kind: "emu" },
  limF3CabA: { name: "Arriva FLIRT 3 (IIImc, Drielandentrein) end car, 1st and 2nd class", kind: "emu", amenities: ["first"] },
  limF3Mid: { name: "Arriva FLIRT 3 (IIImc) middle car with the pantographs", kind: "emu" },
  keoCabA: { name: "Keolis FLIRT 3 (Blauwnet) end car, 1st and 2nd class", kind: "emu", amenities: ["first"] },
  keoCab: { name: "Keolis FLIRT 3 (Blauwnet) end car", kind: "emu" },
  keoMidP: { name: "Keolis FLIRT 3 (Blauwnet) car with the pantograph", kind: "emu" },
  keoMid: { name: "Keolis FLIRT 3 (Blauwnet) car", kind: "emu" },
  valCabA: { name: "Keolis FLIRT 3 (Valleilijn) end car, 1st and 2nd class", kind: "emu", amenities: ["first"] },
  valCab: { name: "Keolis FLIRT 3 (Valleilijn) end car", kind: "emu" },
  valMid: { name: "Keolis FLIRT 3 (Valleilijn) car with the pantograph", kind: "emu" },
  wnkBfk: { name: "Arriva WINK end car (one door)", kind: "emu" },
  wnkBk: { name: "Arriva WINK end car (two doors)", kind: "emu" },
  wnkMod: { name: "Arriva WINK power module (diesel engines, batteries)", kind: "module" },
  vdlLintA: { name: "Arriva LINT 41/H (Vechtdallijnen) car, 1st and 2nd class", kind: "emu", amenities: ["first"] },
  vdlLintB: { name: "Arriva LINT 41/H (Vechtdallijnen) car", kind: "emu" },
  bnwLintA: { name: "Arriva LINT 41/H (Blauwnet) car", kind: "emu" },
  bnwLintB: { name: "Arriva LINT 41/H (Blauwnet) car", kind: "emu" },
  proA: { name: "Protos (Valleilijn) car, 1st and 2nd class", kind: "emu", amenities: ["first"] },
  proB: { name: "Protos (Valleilijn) car", kind: "emu" },
});
Object.assign(MODELS, {
  limF2Cab: M((c) => flirtCar(c, "arrCab2", "limburg"), FL.end, true),
  limF2CabA: M((c) => flirtCar(c, "arrCab2", "limburg", { first: true }), FL.end, true),
  limF3Cab: M((c) => flirtCar(c, "arrCab3", "limburg", { variant: "mc" }), FL.end, true),
  limF3CabA: M((c) => flirtCar(c, "arrCab3", "limburg", { variant: "mc", first: true }), FL.end, true),
  limF3Mid: M((c) => flirtCar(c, "arrMid3", "limburg", { variant: "mc" }), FL.mid),
  keoCabA: M((c) => flirtCar(c, "keoCab", "bnet", { first: true }), FL.end, true),
  keoCab: M((c) => flirtCar(c, "keoCab", "bnet"), FL.end, true),
  keoMidP: M((c) => flirtCar(c, "keoMidP", "bnet"), FL.mid),
  keoMid: M((c) => flirtCar(c, "keoMid", "bnet"), FL.mid),
  valCabA: M((c) => flirtCar(c, "keoCab", "vallei", { first: true }), FL.end, true),
  valCab: M((c) => flirtCar(c, "keoCab", "vallei"), FL.end, true),
  valMid: M((c) => flirtCar(c, "keoMidP", "vallei"), FL.mid),
  wnkBfk: M((c) => winkEnd(c, "bfk"), WK.end, true),
  wnkBk: M((c) => winkEnd(c, "bk"), WK.end, true),
  wnkMod: M(winkModule, WK.mod),
  vdlLintA: M((c) => lintCar(c, "vecht", "a"), LT.car, true),
  vdlLintB: M((c) => lintCar(c, "vecht", "b"), LT.car, true),
  bnwLintA: M((c) => lintCar(c, "bnet", "a"), LT.car, true),
  bnwLintB: M((c) => lintCar(c, "bnet", "b"), LT.car, true),
  proA: M((c) => protosCar(c, "a"), PR.car, true),
  proB: M((c) => protosCar(c, "b"), PR.car, true),
});
// Every car drawn the other way round (its cab, if any, at the right): the
// key with "R" added, for a unit's trailing half and a second unit coupled.
for (const key of Object.keys(MODELS)) {
  const m = MODELS[key];
  MODELS[key + "R"] = { len: m.len, oneEnd: false,
    draw: (c) => `<g transform="matrix(-1 0 0 1 ${c.L} 0)">${m.draw({ ...c, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: c.coupledL, cabL: c.cabR, cabR: c.cabL })}</g>` };
  TYPES[key + "R"] = { ...TYPES[key] };
}

// ---------- Units ----------
const unitOf = (...keys) => keys.map((k) => [k, 1]);
const flip = (units) => units.map(([k, c]) => [k.endsWith("R") ? k.slice(0, -1) : k + "R", c]).reverse();
const twice = (u) => [...u, ...u];
const GTW26 = (p, mod = "") => unitOf(`${p}GtwA`, `${p}GtwMod${mod}`, `${p}GtwBR`);
const GTW28 = (p, mod = "") => unitOf(`${p}GtwAJ`, `${p}GtwMid`, `${p}GtwMod${mod}`, `${p}GtwBR`);
const WINK = unitOf("wnkBfk", "wnkMod", "wnkBkR");
const LIM2 = unitOf("limF2Cab", "limF2CabAR");
const LIM3 = unitOf("limF3Cab", "limF3Mid", "limF3CabAR");
const KEO3 = unitOf("keoCabA", "keoMidP", "keoCabR");
const KEO4 = unitOf("keoCabA", "keoMid", "keoMidP", "keoCabAR");
const VAL3 = unitOf("valCabA", "valMid", "valCabR");
const LINT = (p) => unitOf(`${p}LintA`, `${p}LintBR`);
const PROTOS = unitOf("proA", "proBR");

// ---------- Fleets: the units' numbers ----------
// Arriva numbers its trains 10.xxx (Spurts 10.228-10.394 and 10.411-
// 10.532, FLIRTs 10.450-10.572, WINKs 10.601-10.618, LINTs 10.024-
// 10.037); Keolis its FLIRTs 7301-7309, 7401-7407, 5038-5039 and Protos
// 5031-5035; Qbuzz its GTWs 6351-6352 and 7221-7228 (Wikipedia's fleet
// lists, 2026). A unit's number maps to its first car; TYPICAL draws the
// whole unit it belongs to.
export const FLEETS = {
  nlregio: [
    [10024, 10032, "bnwLintA"], [10033, 10037, "vdlLintA"],
    [10228, 10244, "arnGtwA"], [10252, 10264, "rrrGtwA"], [10276, 10281, "limGtwA"],
    [10301, 10313, "arnGtwAJ"], [10314, 10314, "bnwGtwAJ"], [10315, 10349, "arnGtwAJ"], [10350, 10350, "bnwGtwAJ"], [10351, 10351, "arnGtwAJ"],
    [10365, 10381, "rrrGtwAJ"], [10382, 10391, "limGtwAJ"], [10392, 10394, "rrrGtwAJ"],
    [10411, 10416, "vdlGtwA"], [10426, 10430, "lieGtwA"], [10450, 10464, "limF2Cab"],
    [10514, 10525, "vdlGtwAJ"], [10530, 10532, "lieGtwAJ"], [10550, 10557, "limF3Cab"],
    [10601, 10618, "wnkBfk"],
    [5031, 5035, "proA"], [5038, 5039, "valCabA"], [6351, 6352, "rntGtwA"], [7221, 7228, "rntGtwAJ"],
    [7301, 7309, "keoCabA"], [7401, 7407, "keoCabB"],
  ],
};
// keoCabB: the four-car Keolis units' end car (first class at both ends).
TYPES.keoCabB = { ...TYPES.keoCabA }; MODELS.keoCabB = MODELS.keoCabA; TYPES.keoCabBR = TYPES.keoCabAR; MODELS.keoCabBR = MODELS.keoCabAR;

// ---------- Typical trains ----------
const set = (label, ...units) => ({ label, units: units.flat() });
const lineOf = (t) => (String(t.route || "").match(/\b(R[ES]\d+|IC\d+)\b/) || [])[1] || "";
const by = (t) => String(t.route || "").split(" ")[0];
const at = (t, re) => re.test(`${t.origin || ""}|${t.destination || ""}`);
// What a reported unit runs in, by its key.
const BY_KEY = {
  arnGtwA: () => set("Arriva Spurt (GTW 2/6)", GTW26("arn")), arnGtwAJ: () => set("Arriva Spurt (GTW 2/8)", GTW28("arn")),
  rrrGtwA: () => set("RRReis Spurt (GTW 2/6)", GTW26("rrr")), rrrGtwAJ: () => set("RRReis Spurt (GTW 2/8)", GTW28("rrr")),
  vdlGtwA: () => set("Vechtdallijnen Spurt (GTW-E 2/6)", GTW26("vdl")), vdlGtwAJ: () => set("Vechtdallijnen Spurt (GTW-E 2/8)", GTW28("vdl")),
  bnwGtwAJ: () => set("Blauwnet Spurt (GTW 2/8)", GTW28("bnw")),
  rntGtwA: () => set("R-net GTW-E 2/6", GTW26("rnt")), rntGtwAJ: () => set("R-net GTW-E 2/8", GTW28("rnt")),
  limGtwA: () => set("Arriva Limburg GTW 2/6 (diesel)", GTW26("lim", "D")), limGtwAJ: () => set("Arriva Limburg GTW 2/8 (diesel)", GTW28("lim", "D")),
  lieGtwA: () => set("Arriva Limburg GTW-E 2/6", GTW26("lie")), lieGtwAJ: () => set("Arriva Limburg GTW-E 2/8", GTW28("lie")),
  limF2Cab: () => set("Arriva FLIRT 3 (II): two cars", LIM2), limF3Cab: () => set("Arriva FLIRT 3 (IIImc): three cars", LIM3),
  wnkBfk: () => set("Arriva WINK", WINK), keoCabA: () => set("Keolis FLIRT 3: three cars", KEO3), keoCabB: () => set("Keolis FLIRT 3: four cars", KEO4),
  valCabA: () => set("Keolis FLIRT 3 (Valleilijn): three cars", VAL3), proA: () => set("Protos (Valleilijn)", PROTOS),
  bnwLintA: () => set("Arriva LINT 41/H (Blauwnet)", LINT("bnw")), vdlLintA: () => set("Arriva LINT 41/H (Vechtdallijnen)", LINT("vdl")),
};
// What usually runs each line (the 2026 timetable's series as Wikipedia's
// fleet pages list them, and photographs of each line, 2025-2026):
//   Groningen and Friesland: WINKs on the Friesian lines (RS2, RS3, RE3),
//   WINKs and Spurts on Leeuwarden-Groningen (RS1, RE1), Spurts on the
//   Groningen lines (RS4-RS7, RE6 to Leer). Limburg: the Spurts on the
//   Maaslijn (RS11, diesel until it is electrified in 2027) and the
//   Heuvellandlijn (RS18, electric), FLIRT IIs on RS12 and RS15, the
//   FLIRT IIImcs on the Drielandentrein (RE18) and the night train.
//   Blauwnet: electric Spurts on Zwolle-Emmen (RS20, RE20, and the night
//   trains from Zwolle and Groningen), LINTs on Almelo-Hardenberg (RS21)
//   and Zutphen-Oldenzaal (RS24, with two Spurts), Keolis's FLIRTs on
//   Zwolle-Kampen (RS22, three cars) and Zwolle-Enschede (RS23, IC23,
//   four cars). RRReis: the Spurts in the Achterhoek and Rivierenland
//   (RE30, RS30-RS33), the Protos and two FLIRTs on the Valleilijn (RS34).
//   R-net: Qbuzz's electric Spurts on the MerwedeLingelijn.
export const TYPICAL = {
  nlregio: (t, reported) => {
    if (reported && BY_KEY[reported.replace(/R$/, "")]) return BY_KEY[reported.replace(/R$/, "")](Number(t.cars?.numbers?.[0]));
    const who = by(t), l = lineOf(t), r = String(t.route || "");
    if (who === "Arriva") {
      if (/Nachttrein/.test(r)) return at(t, /Maastricht/) ? set("Arriva FLIRT 3 (IIImc), two coupled", LIM3, LIM3)
        : set("Arriva Spurt (GTW-E 2/8, Vechtdallijnen), two coupled", GTW28("vdl"), GTW28("vdl"));
      if (/^(RS2|RS3|RE3)$/.test(l)) return set("Arriva WINK", WINK);
      if (/^(RS1|RE1)$/.test(l)) return set("Arriva Spurt (GTW 2/8) or WINK", GTW28("arn"));
      if (/^(RE6|RS4)$/.test(l)) return set("Arriva Spurt (GTW 2/8)", GTW28("arn"));
      if (/^RS[567]$/.test(l)) return set("Arriva Spurt (GTW 2/6)", GTW26("arn"));
      if (l === "RS11") return set("Arriva Limburg GTW 2/8 (diesel; FLIRTs from the Maaslijn's electrification, 2027)", GTW28("lim", "D"));
      if (l === "RS18") return set("Arriva Limburg GTW-E 2/6", GTW26("lie"));
      if (/^(RS12|RS15)$/.test(l)) return set("Arriva FLIRT 3 (II): two cars", LIM2);
      if (l === "RE18") return set("Arriva FLIRT 3 (IIImc, Drielandentrein): three cars", LIM3);
      return null;
    }
    if (who === "Blauwnet") {
      if (/^R[SE]20$/.test(l)) return set("Arriva Spurt (GTW-E 2/8, Vechtdallijnen)", GTW28("vdl"));
      if (l === "RS21") return set("Arriva LINT 41/H (Vechtdallijnen)", LINT("vdl"));
      if (l === "RS24") return set("Arriva LINT 41/H (Blauwnet; some trains a Spurt GTW 2/8)", LINT("bnw"));
      if (l === "RS22") return set("Keolis FLIRT 3: three cars", KEO3);
      if (/^(RS23|IC23)$/.test(l)) return set("Keolis FLIRT 3: four cars", KEO4);
      return null;
    }
    if (who === "RRReis") {
      if (l === "RS34") return set("Protos (some trains a FLIRT 3)", PROTOS);
      if (/^(RE30|RS32|RS33)$/.test(l)) return set("Arriva Spurt (GTW 2/8), RRReis", GTW28("rrr"));
      return set("Arriva Spurt (GTW 2/6), RRReis", GTW26("rrr"));
    }
    if (who === "R-net") return set("Qbuzz GTW-E 2/8 (R-net)", GTW28("rnt"));
    return null;
  },
};

// ---------- Fact sheets ----------
const NLWP = "https://nl.wikipedia.org/wiki/";
const spurt = { model: "Stadler GTW (Arriva \"Spurt\")", type: "Articulated diesel-electric multiple unit", builder: "Stadler Rail", topSpeedMph: 87 };
const part = (f, about) => ({ ...f, about });
const facts = {
  arnGtwA: part({ ...spurt, built: "2006–2007; refitted 2020–2024", fleet: "14 GTW 2/6 and 37 GTW 2/8 (10.228–10.351)", source: `${NLWP}Spurt_(trein)` },
    "Groningen's and Friesland's Spurts in Arriva's colors since their refit, turquoise over sand, the big Arriva A on the power module. Their first class was made second in 2020."),
  rrrGtwA: part({ ...spurt, built: "2012 (and the nine ex-Breng units, 2011)", fleet: "13 GTW 2/6, 20 GTW 2/8 (10.252–10.394)", source: `${NLWP}Spurt_(trein)` },
    "The Achterhoek's and Rivierenland's Spurts, repainted for RRReis (Gelderland's brand) from May 2025, a toilet added; first class behind one door."),
  vdlGtwA: part({ ...spurt, type: "Articulated electric multiple unit", built: "2012–2013", fleet: "3 GTW-E 2/6 and 12 GTW-E 2/8 (10.411–10.525)", source: `${NLWP}Spurt_(trein)` },
    "The electric Spurts of the Vechtdallijnen (Zwolle–Emmen), in Blauwnet's colors; they also run the weekend night trains to Schiphol."),
  bnwGtwA: part({ ...spurt, built: "2007", fleet: "2 (10.314, 10.350)", source: `${NLWP}Spurt_(trein)` }, "Two Spurts from Groningen, on Zutphen–Hengelo–Oldenzaal since December 2023 in Blauwnet's colors."),
  rntGtwA: part({ ...spurt, model: "Stadler GTW-E (R-net)", type: "Articulated electric multiple unit", built: "2008, 2011", fleet: "2 GTW 2/6 and 8 GTW 2/8", source: `${NLWP}MerwedeLingelijn` },
    "Qbuzz's MerwedeLingelijn units (Arriva's until 2018), in R-net's red and gray since 2020-2021; no first class. CAF Civity units replace them from 2027."),
  limGtwA: part({ ...spurt, model: "Stadler GTW (Limburg, ex-Velios)", built: "2007–2008", fleet: "16 diesel and 8 electric (10.276–10.532)", source: `${NLWP}Limburgse_GTW` },
    "Veolia's Velios units, Arriva's since 2016: the diesels on the Maaslijn (Nijmegen–Venlo–Roermond), only relettered, their power modules still Veolia's gray. Sixteen first-class seats."),
  lieGtwA: part({ ...spurt, model: "Stadler GTW-E (Limburg, ex-Velios)", type: "Articulated electric multiple unit", built: "2008", fleet: "5 GTW-E 2/6, 3 GTW-E 2/8 (10.426–10.430, 10.530–10.532)", source: `${NLWP}Limburgse_GTW` },
    "The electric units of the Heuvellandlijn (Maastricht Randwyck–Heerlen–Kerkrade), repainted in Limburg's blue in 2016. Sixteen first-class seats."),
};
const flirtL = { model: "Stadler FLIRT 3 (Arriva Limburg)", type: "Electric multiple unit", builder: "Stadler Rail", topSpeedMph: 99, source: `${NLWP}Arriva_FLIRT` };
const flirtK = { model: "Stadler FLIRT 3 (Keolis)", type: "Electric multiple unit", builder: "Stadler Rail", built: "2016–2018", topSpeedMph: 99, source: `${NLWP}Keolis_Nederland_FLIRT` };
Object.assign(facts, {
  limF2Cab: part({ ...flirtL, built: "2016", fleet: "15 two-car units (10.450–10.464)", seats: 111 }, "Two cars, four doors a side; on Roermond–Maastricht Randwyck (RS12) and Sittard–Heerlen (RS15)."),
  limF2CabA: part({ ...flirtL, built: "2016", fleet: "15 two-car units (10.450–10.464)" }, "The motor car: the pantograph over its inner end, twelve first-class seats."),
  limF3Cab: part({ ...flirtL, built: "2017–2018", fleet: "8 three-car units (10.550–10.557)", seats: 172 }, "The Drielandentrein (RE18, Liège–Maastricht–Heerlen–Aachen): built for the Dutch, German and Belgian currents; no Limburg lion, at Belgium's request."),
  limF3CabA: part({ ...flirtL, fleet: "8 three-car units (10.550–10.557)" }, "The end car with first class."),
  limF3Mid: part({ ...flirtL, fleet: "8 three-car units" }, "Both pantographs: one for direct current (1.5 and 3 kV), one for 15 kV."),
  keoCabA: part({ ...flirtK, fleet: "9 three-car (7301–7309) and 7 four-car units (7401–7407)" }, "Blauwnet's FLIRTs on Zwolle–Kampen and Zwolle–Enschede; first class behind the cab, the big numerals saying which class is where."),
  keoCab: part({ ...flirtK }, "The three-car units' second-class end car."),
  keoMid: part({ ...flirtK }, "Second class."), keoMidP: part({ ...flirtK }, "Second class; the pantograph on its roof."),
  valCabA: part({ ...flirtK, built: "2017", fleet: "2 (5038, 5039)" }, "The Valleilijn's two FLIRTs (Connexxion's until 2023), in the Valleilijn's light blue until their RRReis refit."),
  valCab: part({ ...flirtK, fleet: "2 (5038, 5039)" }, "Second class."), valMid: part({ ...flirtK, fleet: "2 (5038, 5039)" }, "The pantograph car."),
  wnkBfk: { model: "Stadler WINK (Arriva)", type: "Hybrid (diesel and battery) multiple unit", builder: "Stadler Rail", built: "2019–2020", fleet: "18 (10.601–10.618)", seats: 153, topSpeedMph: 87,
    lengthFt: 182, source: `${NLWP}Stadler_WINK`, about: "In service since April 2021 on the Friesian lines and Leeuwarden–Groningen; one door a side on this car. No first class." },
  wnkBk: { model: "Stadler WINK (Arriva)", type: "Hybrid multiple unit", builder: "Stadler Rail", source: `${NLWP}Stadler_WINK`, about: "Two doors a side on this car." },
  wnkMod: { model: "Stadler WINK (Arriva)", type: "Hybrid multiple unit", builder: "Stadler Rail", source: `${NLWP}Stadler_WINK`,
    about: "The power module: two Deutz diesels (run on HVO) and batteries, the gangway through it; the pantograph charges the batteries under the wires." },
  vdlLintA: { model: "Alstom Coradia LINT 41/H", type: "Diesel multiple unit", builder: "Alstom (LHB)", built: "2004–2005", fleet: "3 on Almelo–Hardenberg (10.033, 10.034, 10.037)", topSpeedMph: 75,
    lengthFt: 137, source: `${NLWP}Alstom_Coradia_Lint`, about: "Ex-Syntus, in the Vechtdallijnen's blue; eight first-class seats behind this cab." },
  bnwLintA: { model: "Alstom Coradia LINT 41/H", type: "Diesel multiple unit", builder: "Alstom (LHB)", built: "2004–2005", fleet: "7 on Zutphen–Oldenzaal (10.024–10.032)", topSpeedMph: 75,
    lengthFt: 137, source: `${NLWP}Alstom_Coradia_Lint`, about: "Ex-Syntus, from Limburg's Maaslijn to Zutphen–Hengelo–Oldenzaal in December 2023, in Blauwnet's colors." },
  proA: { model: "Protos", type: "Electric multiple unit", builder: "Fahrzeugtechnik Dessau", built: "2007", fleet: "5 (5031–5035), the only ones built", seats: 170, lengthFt: 179,
    source: `${NLWP}Protos_(treinstel)`, about: "The Valleilijn's two-car units; their quiet compartment behind this cab is first class. Refits into RRReis's colors, with a toilet, began in 2025." },
  proB: { model: "Protos", type: "Electric multiple unit", builder: "Fahrzeugtechnik Dessau", source: `${NLWP}Protos_(treinstel)`, about: "Second class." },
});
for (const p of Object.keys(GTW_PAINTS)) {
  const f = facts[`${p}GtwA`];
  facts[`${p}GtwAJ`] = f; facts[`${p}GtwB`] = part(f, "An end car."); facts[`${p}GtwBJ`] = facts[`${p}GtwB`];
  facts[`${p}GtwMid`] = part(f, "The GTW 2/8's middle car, on the power module at one end and a truck shared with the end car at the other.");
  for (const m of ["", "D", "E"]) facts[`${p}GtwMod${m}`] = part(f, "The power module: the motor truck and the engines (or, on the electric units, the transformer under the pantograph); the gangway runs through it.");
}
facts.keoCabB = facts.keoCabA;
facts.vdlLintB = part(facts.vdlLintA, "Second class."); facts.bnwLintB = part(facts.bnwLintA, "Second class.");
export const FACTS = {};
for (const [k, f] of Object.entries(facts)) { FACTS[k] = f; FACTS[k + "R"] = f; }
