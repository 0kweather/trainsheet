// TCDD Taşımacılık's cars (scripts/railroads/turkey.py, agency "tcdd"):
// Turkey's passenger railroad: the YHT high-speed sets, the main-line
// locomotives and the regional DMUs. Trainsheet's own side views at the
// shared scale (js/carart.js), each drawn from, and checked against, one
// photograph on Wikimedia Commons, named here fleet by fleet. Bodies and
// parts from czechia.cars.js (unit, euroLoco, hvac and the rest) and
// carmodels.js (coachCar); the hood-unit diesels are drawn here, on the
// aucklandtransport.cars.js pattern, since no shared builder shapes a hood
// unit. The lettering is drawn here (no logo files).
//
// What is from the photographs: each fleet's paint, the shape of its cab,
// and what can be counted on the side that faces the camera. All but two
// of the photographs are three-quarter or distant views, so the windows'
// spacing, the doors' places, the roof equipment, what hangs under the
// floor and every length are Trainsheet's reading of the type, not
// measurements. The lengths the drawings are scaled to are the figures
// usually published for each class, set down from memory and not checked
// against a source for this file (see MODELS); the fact sheets give them
// anyway, as the other plug-in files do. The file was verified after
// writing: node --check passes, every consist renders, TYPICAL was run over
// all 233 trains in the feed (0 failures), and the drawings were looked at
// beside their photographs (22 Nov 2026) — the cab cars, the locomotives,
// the DMU driving cars and the coach; the four intermediate cars share
// their fleets' paint and were rendered, not separately eyeballed. Three
// mismatches found that way were fixed: the hood units' white stripes had
// merged with the hand rail, the E68000's lettering sat behind its
// grilles, and the HT80000's turquoise barely showed on its nose. A second
// look the same day found the HT80000's turquoise still too narrow — the
// real Velaro TR is turquoise-dominant above the windows — so the roof and
// upper body were repainted turquoise, over the nose and along the side.
//
//   HT65000, the YHT set (CAF, six cars): HT 65010 at Ankara Tren Garı
//     ("TCDD Taşımacılık HT65000 at Ankara Tren Garı.jpg"). White, a dark
//     blue nose, a black window band, a red stripe over a blue one along
//     the side, the Turkish flag and "HT 65010" behind the cab, "YHT" in
//     blue mid-side, a grey skirt. The photograph is a front three-quarter
//     view, so the windows a car, the doors and where the pantographs sit
//     are a reading.
//   HT80000, the YHT set (Siemens Velaro TR, eight cars): the set on an
//     Ankara–İstanbul service at Bilecik ("TCDD HT80000 Bilecik.jpg"),
//     with HT 80108 at Söğütlüçeşme ("HT 80108 @ Söğütlüçeşme, Istanbul
//     Turkey 2023.jpg") for the nose's detail. Turquoise over the roof and
//     upper body, sweeping over the nose, a dark window band, a white lower
//     body with a turquoise wave along the side, a dark blue skirt, "YHT"
//     in turquoise, the flag and "HT 80108". The Bilecik photograph is
//     distant, so the wave's exact sweep and the windows a car are a reading.
//   E68000, the electric locomotive: two E 68s with an empty ore train
//     between Araplı and Yeşilhisar ("TCDD E 68 055 Araplı - Yeşilhisar.jpg").
//     White with a yellow cab end, a grey roof, "TCDD TAŞIMACILIK" in blue
//     along the side. The photograph is distant, so the side's detail —
//     the small windows, the grilles, the doors' places — is a reading.
//   E43000, the electric locomotive: E 43 042 at Haydarpaşa yard
//     ("TCDD E43042 at Haydarpasa.jpg"). White, a blue roof, a red stripe
//     along the side over a blue band low, big blue "TCDD" letters, red
//     cab doors, a red front. The dining car lettered "YEMEKLİ VAGON" and
//     the coaches behind it are in the same photograph: white with a blue
//     roof, a red stripe over a thin blue one.
//   DE24000, the diesel locomotive: DE 24 382 at a station
//     (the photograph's Commons file URL is not determined — see
//     world-build/countries/tr/photos/MANIFEST.md), and DE24 184 with the
//     Fırat Ekspresi near Pınarlı ("TCDD DE24 184 Pınarlı.jpg"). Red, two
//     white stripes along the long hood, a white chevron on the cab's side,
//     a grey roof, "TCDD" in white on the hood, a blue panel on it.
//   DE22000, the diesel locomotive: DE 22 068 hauling the Güney Kurtalan
//     Ekspresi between Kurk and Uluova ("TCDD DE 22 068 Kurk - Uluova.jpg"),
//     and DE 22 065 hauling the Doğu Ekspresi through snow
//     ("Doğu ekspresi.jpg"). Red, one white stripe along the long hood,
//     "TCDD TAŞIMACILIK" in white on it, a white chevron on the cab.
//   DM15000, the diesel unit (four cars): set MT 15406 "ANADOLU" at
//     Basmane, İzmir (the photograph's Commons file URL is not determined —
//     see MANIFEST.md; narrowed to two ToprakM Basmane files, which cannot
//     be told apart). White, a grey-blue roof, a dark window band, red
//     doors, a red stripe over a blue one sweeping up behind the cab,
//     "ANADOLU" in blue. The photograph is a front three-quarter view, so
//     the windows a car and the doors' places are a reading.
//   MT30000, the diesel unit (three cars): crossing a steel truss bridge
//     in arid hills (the photograph's Commons file URL is not determined —
//     see MANIFEST.md). White, a grey roof, a blue stripe with a thin red
//     one above it, red doors. The photograph is distant, so the windows a
//     car and the doors' places are a reading.
//   The coach: the coaches behind E 43 042 at Haydarpaşa and behind
//     DE24 184 on the Fırat Ekspresi. White with a blue roof, a red stripe
//     over a thin blue one under the windows, red doors. The windows and
//     the length are those of the standard 26.4 m coach.
//
// The timetable names no locomotive or unit, so which fleet a train is
// drawn as is a judgement, labeled as typical; see TYPICAL below, where
// each rule is set out. Two of the rules rest on photographs of the train
// itself (the Doğu and Güney Kurtalan expresses behind a DE22000, the
// Fırat Ekspresi behind a DE24000); the rest are placed by number and by
// the line's two ends, on what is electrified and on which fleets work
// which region. A line's page, which has no number, is placed by its ends
// the same way, so the Ankara–İstanbul line page reads as the main-line
// train, not the YHT — the two share the route name and only the number
// tells them apart.

import { coachCar, newId } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, poly, win, truck, underframe, slats } from "../carart.js?v=dev";
import { unit, euroLoco, letters, hvac, buffers, exhaust, tank } from "./czechia.cars.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 2, depth = 1.0) => underframe(a, b, top, { depth, boxes: k, tanks: false });

// The Turkish flag, small, on a car side: the red field, the white
// crescent, and a five-point star.
const star5 = (cx, cy, r) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.42 : r;
    pts.push([n(cx + rr * Math.cos(a)), n(cy + rr * Math.sin(a))]);
  }
  return path(poly(pts), "#ffffff");
};
const trFlag = (x, y, s) => rect(x, y, s, s * 0.67, "#e30a17") +
  circle(x + s * 0.38, y + s * 0.335, s * 0.21, "#ffffff") +
  circle(x + s * 0.455, y + s * 0.335, s * 0.17, "#e30a17") +
  star5(x + s * 0.62, y + s * 0.335, s * 0.11);

// A hood-unit diesel's body (the carmodels.js builders can't shape a hood
// unit): the outline filled, its livery clipped to it and shaded like the
// built-in drawings, as in aucklandtransport.cars.js.
function hoodShell(d, base, liv, top = 13) {
  const id = newId();
  const shade = `<linearGradient id="${id}-s" gradientUnits="userSpaceOnUse" x1="0" y1="2" x2="0" y2="${top}">` +
    '<stop offset="0.15" stop-color="#000" stop-opacity="0.16" style="stop-opacity:var(--car-shade-low,0.16)"/><stop offset="0.45" stop-color="#000" stop-opacity="0"/>' +
    '<stop offset="0.6" stop-color="#fff" stop-opacity="0"/><stop offset="0.85" stop-color="#fff" stop-opacity="0.1" style="stop-opacity:var(--car-shade-high,0.1)"/>' +
    '<stop offset="1" stop-color="#000" stop-opacity="0.08" style="stop-opacity:var(--car-shade-roof,0.08)"/></linearGradient>';
  return path(d, base) + `<clipPath id="${id}"><path d="${d}"/></clipPath><defs>${shade}</defs>` +
    `<g clip-path="url(#${id})">${liv}<rect x="-5" y="0" width="200" height="${top + 2}" fill="url(#${id}-s)"/></g>` + path(d, "none", 0.8);
}
// Hand rails along a hood unit's walkway, posts to the rail: from a to b
// at deck y, the rail h above the walkway.
const handrail = (a, b, deck, h = 2.4) => lines([[a, deck + h, b, deck + h],
  ...seq(a, 5, Math.floor((b - a) / 5) + 1).map((x) => [x, deck, x, deck + h])], "#d9dcdf", 0.7);

// ---------- HT65000: the YHT set (CAF) ----------
// Six cars, each on two trucks of its own; a rounded nose under a deep
// windshield, the dark blue nose with a white swoosh, the windows in a
// black band, a red stripe over a blue one.
const HT65 = { white: "#f4f5f6", roof: "#8f959b", band: "#14171b", navy: "#1f3a8f", red: "#d8262c", blue: "#2b5cb8", skirt: "#565b61" };
const H65G = { roof: 13.0, sill: 3.6 };
const NOSE_H65 = [[1.6, 3.6], [0.9, 4.8], ["q", 0.6, 6.2, 2.4, 7.6], [9.0, 12.2], ["q", 10.4, 13.0, 13.6, 13.0]];
function ht65000Paint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, HT65.white], [12.2, 3, HT65.roof], [0, 3.95, HT65.skirt]]) +
      rect(cab ? 20 : -1, 7.0, L - (cab ? 20 : -1) + 1, 3.4, HT65.band, 0, 'rx="0.4"') +
      rect(-1, 5.35, L + 2, 0.5, HT65.red) + rect(-1, 4.55, L + 2, 0.45, HT65.blue);
    if (cab) {
      // The dark blue nose; the white swoosh curving down it, and the
      // stripes running into it.
      s += rect(-1, 3.6, 14, 9.4, HT65.navy) +
        path("M2.2 12.6Q6.4 12.2 8.2 8.4Q9.2 6.2 8.8 4.2L10.4 4.2Q10.8 6.6 9.6 9.0Q7.6 12.8 3.8 13.0Z", HT65.white) +
        rect(0, 5.35, 14, 0.5, HT65.red) + rect(0, 4.55, 14, 0.45, HT65.blue);
    }
    return s;
  };
}
const ht65Door = (x) => ({ x, w: 2.7, y0: H65G.sill, y1: 10.6, leaves: 1, glassY: 0.5, glassH: 0.36, grabs: false, fill: HT65.white });
const ht65000Cab = (c) => unit(c, { roof: H65G.roof, sill: H65G.sill, nose: NOSE_H65, rake: [[2.4, 7.6], [9.0, 12.2]], depth: 3.0, cabLen: 16, lampY: 5.9, bare: true,
  rows: [{ xs: seq(26.0, 5.6, 8), y: 7.3, w: 4.3, h: 2.6, r: 0.35 }], doors: [ht65Door(21), ht65Door(c.L - 4.6)],
  trucks: [14.0, c.L - 10.0], wheel: 35, paint: ht65000Paint(true), surround: "#14171b",
  // The cab's side window, a triangle behind the windshield.
  cab: () => path("M13.5 7.6L17.5 7.6L17.5 10.2L15.7 10.2Z", "#1d2026", 0.4),
  extra: (cc, g) => trFlag(26, 8.3, 2.4) + letters(cc, 27.2, 6.35, 0.8, "HT 65010", "#1d2026", { weight: 600 }) +
    letters(cc, g.L / 2 + 6, 6.35, 1.0, "YHT", HT65.blue, { weight: 800 }) +
    hvac(24, H65G.roof, 10, 0.6) + hvac(g.L - 20, H65G.roof, 10, 0.6) + boxes(22, g.L - 16, H65G.sill, 3, 1.2) });
const ht65000Mid = (c) => unit(c, { roof: H65G.roof, sill: H65G.sill,
  rows: [{ xs: seq(6.9, 5.6, 11), y: 7.3, w: 4.3, h: 2.6, r: 0.35 }], doors: [ht65Door(1.7), ht65Door(c.L - 4.4)],
  trucks: [10.0, c.L - 10.0], wheel: 35, paint: ht65000Paint(false),
  // A pantograph on the third and fifth cars (a reading).
  pan: c.index === 2 || c.index === 4 ? c.L / 2 - 6 : null,
  extra: (cc, g) => letters(cc, g.L / 2, 6.35, 1.0, "YHT", HT65.blue, { weight: 800 }) +
    hvac(8, H65G.roof, 10, 0.6) + hvac(g.L - 20, H65G.roof, 10, 0.6) + boxes(16, g.L - 16, H65G.sill, 3, 1.2) });

// ---------- HT80000: the YHT set (Siemens Velaro TR) ----------
// Eight cars, each on two trucks of its own; a rounded nose, a turquoise
// roof and upper body sweeping over the nose, a dark window band, a white
// lower body with a turquoise wave along the side, a dark blue skirt.
const HT80 = { white: "#f4f5f6", teal: "#2ea5bb", tealDark: "#1e7d92", roof: "#8f959b", band: "#1d2026", skirt: "#2a3a4a" };
const H80G = { roof: 13.0, sill: 3.6 };
const NOSE_H80 = [[1.6, 3.6], [0.8, 4.6], ["q", 0.5, 6.0, 2.2, 7.4], [8.6, 12.2], ["q", 10.0, 13.0, 13.2, 13.0]];
function ht80000Paint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, HT80.white], [10.4, 5, HT80.teal], [0, 3.95, HT80.skirt]]) +
      rect(cab ? 20 : -1, 7.0, L - (cab ? 20 : -1) + 1, 3.4, HT80.band, 0, 'rx="0.4"') +
      rect(-1, 5.5, L + 2, 0.5, HT80.teal) + rect(-1, 4.8, L + 2, 0.25, HT80.tealDark);
    if (cab) {
      // The turquoise over the nose, sweeping down its side to meet the
      // stripe, and the white of the nose below it.
      s += path("M-1 13.0L13.2 13.0Q10.0 12.2 8.6 12.2L8.6 10.6Q7.0 8.8 4.5 7.4Q2.0 6.2 -1 6.2Z", HT80.teal) +
        path("M-1 5.5L8.0 5.5Q9.5 6.4 9.8 8.2L8.2 8.2Q7.8 6.8 6.4 6.0L-1 6.0Z", HT80.teal);
    }
    return s;
  };
}
const ht80Door = (x) => ({ x, w: 2.7, y0: H80G.sill, y1: 10.6, leaves: 1, glassY: 0.5, glassH: 0.36, grabs: false, fill: HT80.white });
const ht80000Cab = (c) => unit(c, { roof: H80G.roof, sill: H80G.sill, nose: NOSE_H80, rake: [[2.2, 7.4], [8.6, 12.2]], depth: 3.0, cabLen: 16, lampY: 5.9, bare: true,
  rows: [{ xs: seq(26.0, 5.6, 8), y: 7.3, w: 4.3, h: 2.6, r: 0.35 }], doors: [ht80Door(21), ht80Door(c.L - 4.6)],
  trucks: [14.0, c.L - 10.0], wheel: 35, paint: ht80000Paint(true), surround: "#14171b",
  // The cab's side window, a triangle behind the windshield.
  cab: () => path("M13.0 7.6L17.0 7.6L17.0 10.2L15.2 10.2Z", "#1d2026", 0.4),
  extra: (cc, g) => trFlag(26, 8.3, 2.4) + letters(cc, 27.2, 6.35, 0.8, "HT 80108", "#1d2026", { weight: 600 }) +
    letters(cc, g.L / 2 + 6, 6.35, 1.0, "YHT", HT80.teal, { weight: 800 }) +
    hvac(24, H80G.roof, 10, 0.6) + hvac(g.L - 20, H80G.roof, 10, 0.6) + boxes(22, g.L - 16, H80G.sill, 3, 1.2) });
const ht80000Mid = (c) => unit(c, { roof: H80G.roof, sill: H80G.sill,
  rows: [{ xs: seq(6.9, 5.6, 10), y: 7.3, w: 4.3, h: 2.6, r: 0.35 }], doors: [ht80Door(1.7), ht80Door(c.L - 4.4)],
  trucks: [10.0, c.L - 10.0], wheel: 35, paint: ht80000Paint(false),
  // A pantograph on the third and sixth cars (a reading).
  pan: c.index === 2 || c.index === 5 ? c.L / 2 - 6 : null,
  extra: (cc, g) => letters(cc, g.L / 2, 6.35, 1.0, "YHT", HT80.teal, { weight: 800 }) +
    hvac(8, H80G.roof, 10, 0.6) + hvac(g.L - 20, H80G.roof, 10, 0.6) + boxes(16, g.L - 16, H80G.sill, 3, 1.2) });

// ---------- The regional DMUs: DM15000 and MT30000 ----------
// Both are rounded-nose driving cars with a cab at each outer end; the
// DM15000's windows sit in a dark band with its red and blue stripes
// sweeping up behind the cab, the MT30000's are single windows on white
// with a straight blue stripe and a thin red one above it.

// DM15000: white, a grey-blue roof, a dark window band, red doors, a red
// stripe over a blue one sweeping up behind the cab, "ANADOLU" in blue.
const DM15 = { white: "#f2f3f4", roof: "#7d8a99", band: "#1d2026", red: "#d8262c", blue: "#2b5cb8", skirt: "#565b61" };
const D15G = { roof: 12.9, sill: 3.6 };
const NOSE_D15 = [[1.4, 3.6], [0.8, 5.0], ["q", 0.7, 6.4, 2.2, 7.8], [7.6, 12.1], ["q", 8.8, 12.9, 11.6, 12.9]];
function dm15000Paint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, DM15.white], [12.1, 3, DM15.roof], [0, 3.95, DM15.skirt]]) +
      rect(cab ? 18 : -1, 7.0, L - (cab ? 18 : -1) + 1, 3.6, DM15.band, 0, 'rx="0.4"') +
      rect(cab ? 18 : -1, 5.1, L - (cab ? 18 : -1) + 1, 0.55, DM15.red) +
      rect(cab ? 18 : -1, 4.3, L - (cab ? 18 : -1) + 1, 0.45, DM15.blue);
    if (cab) {
      // The stripes sweeping up behind the cab to the window band.
      s += path("M11.0 5.65Q15.0 5.65 16.5 8.0Q17.5 9.8 17.5 10.6L15.3 10.6Q15.3 9.6 14.3 7.8Q13.3 6.2 11.0 6.2Z", DM15.red) +
        path("M11.0 4.3Q14.0 4.3 15.5 6.0Q16.5 7.2 16.8 8.8L14.8 9.0Q14.3 7.4 13.3 6.0Q12.3 4.75 11.0 4.75Z", DM15.blue);
    }
    return s;
  };
}
const dm15Door = (x) => ({ x, w: 2.7, y0: D15G.sill, y1: 10.6, leaves: 1, glassY: 0.5, glassH: 0.36, grabs: false, fill: DM15.red });
const dm15000Cab = (c) => unit(c, { roof: D15G.roof, sill: D15G.sill, nose: NOSE_D15, rake: [[2.2, 7.8], [7.6, 12.1]], depth: 2.8, cabLen: 12, lampY: 5.9, bare: true,
  rows: [{ xs: seq(24.0, 5.4, 6), y: 7.3, w: 4.3, h: 2.6, r: 0.35 }], doors: [dm15Door(18.5), dm15Door(c.L - 4.6)],
  trucks: [13.0, c.L - 11.0], wheel: 33, paint: dm15000Paint(true), surround: "#14171b",
  // The cab's side window, a triangle behind the windshield.
  cab: () => path("M11.0 7.8L14.5 7.8L14.5 10.4L12.8 10.4Z", "#1d2026", 0.4),
  extra: (cc, g) => letters(cc, 30, 6.3, 0.9, "ANADOLU", DM15.blue, { weight: 700 }) +
    hvac(24, D15G.roof, 10, 0.6) + exhaust(42, D15G.roof) + boxes(22, g.L - 16, D15G.sill, 3, 1.2) + tank(38, 47, D15G.sill, 1.5) });
const dm15000Mid = (c) => unit(c, { roof: D15G.roof, sill: D15G.sill,
  rows: [{ xs: seq(7.0, 5.4, 10), y: 7.3, w: 4.3, h: 2.6, r: 0.35 }], doors: [dm15Door(1.8), dm15Door(c.L - 4.6)],
  trucks: [11.0, c.L - 11.0], wheel: 33, paint: dm15000Paint(false),
  extra: (cc, g) => hvac(8, D15G.roof, 10, 0.6) + hvac(g.L - 20, D15G.roof, 10, 0.6) + boxes(16, g.L - 16, D15G.sill, 3, 1.2) });

// MT30000: white, a grey roof, a blue stripe with a thin red one above it,
// red doors. The windows are single, on white.
const MT30 = { white: "#f2f3f4", roof: "#9aa0a6", red: "#d8262c", blue: "#2b5cb8", skirt: "#565b61" };
const M30G = { roof: 12.9, sill: 3.6 };
const NOSE_M30 = [[1.4, 3.6], [0.8, 5.0], ["q", 0.7, 6.4, 2.2, 7.8], [7.6, 12.1], ["q", 8.8, 12.9, 11.6, 12.9]];
function mt30000Paint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, MT30.white], [12.1, 3, MT30.roof], [0, 3.95, MT30.skirt]]) +
      rect(-1, 5.0, L + 2, 0.6, MT30.blue) + rect(-1, 5.95, L + 2, 0.3, MT30.red);
    if (cab) {
      // The red dash on the nose, as photographed.
      s += rect(-1, 9.0, 4, 1.2, MT30.red);
    }
    return s;
  };
}
const mt30Door = (x) => ({ x, w: 2.7, y0: M30G.sill, y1: 10.6, leaves: 1, glassY: 0.5, glassH: 0.36, grabs: false, fill: MT30.red });
const mt30000Cab = (c) => unit(c, { roof: M30G.roof, sill: M30G.sill, nose: NOSE_M30, rake: [[2.2, 7.8], [7.6, 12.1]], depth: 2.8, cabLen: 12, lampY: 5.9, bare: true,
  rows: [{ xs: seq(24.0, 5.6, 7), y: 7.3, w: 4.3, h: 2.6, r: 0.35 }], doors: [mt30Door(18.5), mt30Door(c.L - 4.6)],
  trucks: [13.0, c.L - 11.0], wheel: 33, paint: mt30000Paint(true), surround: "#14171b",
  // The cab's side window, a triangle behind the windshield.
  cab: () => path("M11.0 7.8L14.5 7.8L14.5 10.4L12.8 10.4Z", "#1d2026", 0.4),
  extra: (cc, g) => hvac(24, M30G.roof, 10, 0.6) + exhaust(42, M30G.roof) + boxes(22, g.L - 16, M30G.sill, 3, 1.2) + tank(38, 47, M30G.sill, 1.5) });
const mt30000Mid = (c) => unit(c, { roof: M30G.roof, sill: M30G.sill,
  rows: [{ xs: seq(7.0, 5.6, 10), y: 7.3, w: 4.3, h: 2.6, r: 0.35 }], doors: [mt30Door(1.8), mt30Door(c.L - 4.6)],
  trucks: [11.0, c.L - 11.0], wheel: 33, paint: mt30000Paint(false),
  extra: (cc, g) => hvac(8, M30G.roof, 10, 0.6) + hvac(g.L - 20, M30G.roof, 10, 0.6) + boxes(16, g.L - 16, M30G.sill, 3, 1.2) });

// ---------- The electric locomotives ----------

// E68000: a four-axle box with a cab at each end. White with a yellow cab
// end, a grey roof, "TCDD TAŞIMACILIK" in blue along the side.
const E68 = { white: "#f2f3f4", yellow: "#f5c400", grey: "#9aa0a6", blue: "#1e4fa3", skirt: "#3a3d42" };
const NOSE_E68 = [[1.4, 4.1], [1.1, 7.0], ["q", 1.1, 8.5, 2.2, 9.5], [3.5, 12.3], ["q", 4.2, 13.0, 6.0, 13.0]];
function e68000Paint(c, L) {
  return bands(L, [[0, 20, E68.white], [12.25, 3, E68.grey], [0, 4.1, E68.skirt]]) +
    rect(-1, 4.1, 5, 8.2, E68.yellow) + rect(-1, 10.6, L + 2, 0.35, E68.blue);
}
const e68000 = (c) => euroLoco(c, { roof: 13.0, sill: 4.1, nose: NOSE_E68, rake: [[2.2, 9.5], [3.5, 12.3]], centers: 34, wheel: 49, surround: "#1d2026",
  door: 6.2, doorW: 1.9, paint: e68000Paint,
  grilles: [[-13, 9, 7.5, 10.8], [4, 9, 7.5, 10.8]], grilleFill: "rgba(20,22,25,0.28)",
  over: (cc, L) => letters(cc, L / 2, 5.6, 1.0, "TCDD TAŞIMACILIK", E68.blue, { weight: 700 }) +
    [20, 46].map((x) => win(x, 10.0, 2.0, 1.6, 0.25)).join("") });

// E43000: a four-axle box with a cab at each end. White, a blue roof, a
// red stripe along the side over a blue band low, big blue "TCDD" letters,
// red cab doors, a red front.
const E43 = { white: "#f2f3f4", blue: "#2b5cb8", red: "#d8262c", roof: "#7d8a99", skirt: "#3a3d42" };
const NOSE_E43 = [[1.4, 4.1], [1.1, 7.0], ["q", 1.1, 8.5, 2.2, 9.5], [3.5, 12.3], ["q", 4.2, 13.0, 6.0, 13.0]];
function e43000Paint(c, L) {
  return bands(L, [[0, 20, E43.white], [12.2, 3, E43.roof], [0, 4.1, E43.skirt]]) +
    rect(-1, 4.1, L + 2, 1.4, E43.blue) + rect(-1, 8.2, L + 2, 0.8, E43.red) +
    rect(-1, 4.1, 3.0, 8.2, E43.red) +
    // The cab doors are red: painted behind their translucent panels.
    rect(6.2, 4.6, 1.9, 6.6, E43.red);
}
const e43000 = (c) => euroLoco(c, { roof: 13.0, sill: 4.1, nose: NOSE_E43, rake: [[2.2, 9.5], [3.5, 12.3]], centers: 28, wheel: 49, surround: "#1d2026",
  door: 6.2, doorW: 1.9, paint: e43000Paint,
  grilles: [[-8, 6, 8.5, 11.0], [2, 6, 8.5, 11.0]], grilleFill: "rgba(20,22,25,0.3)",
  over: (cc, L) => letters(cc, L / 2, 7.0, 2.0, "TCDD", E43.blue, { weight: 800, spacing: "0.06em" }) +
    letters(cc, 11.5, 6.2, 0.7, "E 43 042", E43.blue, { weight: 600 }) });

// ---------- The diesel locomotives: hood units ----------
// A hood unit's shape: the cab on the left with a short hood ahead of it
// and the long hood behind, a walkway along the side. The cab is drawn on
// the left, as the convention requires; the short hood leads.

// DE24000: red, two white stripes along the long hood, a white chevron on
// the cab's side, a grey roof, "TCDD" in white on the hood, a blue panel
// on it as photographed on DE 24 382.
const DE24 = { red: "#c8102e", white: "#f2f3f4", grey: "#6c7178", frame: "#24272b", blue: "#2b5cb8" };
const de24000 = (c) => {
  const L = c.L, deck = 4.4, roof = 13.0, hood = 11.2, nose = 9.2;
  const d = poly([[0.7, deck], [0.7, nose - 0.6], ["q", 0.7, nose, 1.3, nose], [6.8, nose], [6.8, roof - 0.4],
    ["q", 6.8, roof, 7.4, roof], [13.6, roof], ["q", 14.2, roof, 14.2, roof - 0.6], [14.2, hood], [L - 0.7, hood], [L - 0.7, deck]]);
  let s = truck(L / 2 - 14, { wb: 12, d: 40, kind: "loco", top: deck, axles: 3 }) +
    truck(L / 2 + 14, { wb: 12, d: 40, kind: "loco", top: deck, axles: 3 });
  // The fuel tank between the trucks.
  s += tank(L / 2 - 8, L / 2 + 8, deck, 1.3);
  const liv = rect(0, 0, L, 14, DE24.red) +
    rect(14.2, hood - 0.45, L - 14.9, 0.45, DE24.grey) + rect(6.8, roof - 0.45, 7.4, 0.45, DE24.grey) + rect(0.7, nose - 0.45, 6.1, 0.45, DE24.grey) +
    // Two white stripes along the long hood, one along the short hood,
    // clear of the hand rail below them.
    rect(14.2, 7.1, L - 14.9, 0.55, DE24.white) + rect(14.2, 8.1, L - 14.9, 0.55, DE24.white) +
    rect(0.7, 7.1, 6.1, 0.55, DE24.white) +
    // The blue panel on the long hood, as photographed on DE 24 382.
    rect(24, 5.0, 9, 2.4, DE24.blue);
  s += hoodShell(d, DE24.red, liv);
  // The cab's side window and its white chevron, the number below them.
  s += win(8.0, 10.2, 2.4, 2.0, 0.4) +
    path("M7.6 9.8L9.8 7.4L12.0 9.8L12.0 8.8L9.8 6.6L7.6 8.8Z", DE24.white) +
    letters(c, 10.5, 5.6, 0.7, "DE 24 382", DE24.white, { weight: 600 });
  // "TCDD" big on the long hood, its grilles and doors, the hand rails.
  s += letters(c, L / 2 + 2, 9.4, 1.6, "TCDD", DE24.white, { weight: 800, spacing: "0.04em" }) +
    rect(40, 6.6, 10, 2.2, "rgba(20,22,25,0.5)", 0.4) + slats(40, 6.6, 10, 2.2, 0.32, "rgba(255,255,255,0.18)") +
    lines(seq(16, 3.2, 8).map((x) => [x, deck + 0.3, x, hood - 0.4]), "rgba(0,0,0,0.22)", 0.45) +
    handrail(15, L - 1, deck, 1.0);
  // The exhaust and the fans on the long hood's roof; the headlight and a
  // red marker on the short hood's front.
  s += exhaust(L * 0.62, hood) + rect(36, hood - 0.05, 4, 0.35, "#5a6068", 0.4, 'rx="0.1"') + rect(44, hood - 0.05, 4, 0.35, "#5a6068", 0.4, 'rx="0.1"') +
    rect(0.75, 7.4, 0.5, 0.5, "#fff4cf", 0.35, 'rx="0.15"') + rect(0.75, 6.6, 0.4, 0.3, "#d8262c", 0.3, 'rx="0.1"');
  return s;
};

// DE22000: red, one white stripe along the long hood, "TCDD TAŞIMACILIK"
// in white on it, a white chevron on the cab.
const DE22 = { red: "#c8102e", white: "#f2f3f4", grey: "#6c7178", frame: "#24272b" };
const de22000 = (c) => {
  const L = c.L, deck = 4.4, roof = 13.0, hood = 11.2, nose = 9.2;
  const d = poly([[0.7, deck], [0.7, nose - 0.6], ["q", 0.7, nose, 1.3, nose], [6.8, nose], [6.8, roof - 0.4],
    ["q", 6.8, roof, 7.4, roof], [13.6, roof], ["q", 14.2, roof, 14.2, roof - 0.6], [14.2, hood], [L - 0.7, hood], [L - 0.7, deck]]);
  let s = truck(L / 2 - 12, { wb: 12, d: 40, kind: "loco", top: deck, axles: 3 }) +
    truck(L / 2 + 12, { wb: 12, d: 40, kind: "loco", top: deck, axles: 3 });
  // The fuel tank between the trucks.
  s += tank(L / 2 - 7, L / 2 + 7, deck, 1.3);
  const liv = rect(0, 0, L, 14, DE22.red) +
    rect(14.2, hood - 0.45, L - 14.9, 0.45, DE22.grey) + rect(6.8, roof - 0.45, 7.4, 0.45, DE22.grey) + rect(0.7, nose - 0.45, 6.1, 0.45, DE22.grey) +
    // One white stripe along the long hood, one along the short hood,
    // clear of the hand rail below it.
    rect(14.2, 7.6, L - 14.9, 0.55, DE22.white) + rect(0.7, 7.6, 6.1, 0.55, DE22.white);
  s += hoodShell(d, DE22.red, liv);
  // The cab's side window and its white chevron, the number below them.
  s += win(8.0, 10.2, 2.4, 2.0, 0.4) +
    path("M7.6 9.8L9.8 7.4L12.0 9.8L12.0 8.8L9.8 6.6L7.6 8.8Z", DE22.white) +
    letters(c, 10.5, 5.6, 0.7, "DE 22 065", DE22.white, { weight: 600 });
  // "TCDD TAŞIMACILIK" on the long hood, its grilles and doors, the hand rails.
  s += letters(c, L / 2, 9.4, 1.1, "TCDD TAŞIMACILIK", DE22.white, { weight: 700 }) +
    rect(38, 6.6, 10, 2.2, "rgba(20,22,25,0.5)", 0.4) + slats(38, 6.6, 10, 2.2, 0.32, "rgba(255,255,255,0.18)") +
    lines(seq(16, 3.2, 7).map((x) => [x, deck + 0.3, x, hood - 0.4]), "rgba(0,0,0,0.22)", 0.45) +
    handrail(15, L - 1, deck, 1.0);
  // The exhaust and the fans on the long hood's roof; the headlight and a
  // red marker on the short hood's front.
  s += exhaust(L * 0.62, hood) + rect(34, hood - 0.05, 4, 0.35, "#5a6068", 0.4, 'rx="0.1"') + rect(42, hood - 0.05, 4, 0.35, "#5a6068", 0.4, 'rx="0.1"') +
    rect(0.75, 7.4, 0.5, 0.5, "#fff4cf", 0.35, 'rx="0.15"') + rect(0.75, 6.6, 0.4, 0.3, "#d8262c", 0.3, 'rx="0.1"');
  return s;
};

// ---------- The coach ----------
// A 26.4 m coach on two trucks 19 m apart, a door at each end, eleven
// windows between. White with a blue roof, a red stripe over a thin blue
// one under the windows, red doors. The dining car is the same, lettered
// "YEMEKLİ VAGON".
const CO = { white: "#f2f3f4", blue: "#2b5cb8", red: "#d8262c", skirt: "#3a3d42" };
function tcddCoach(c, dining) {
  const L = c.L;
  return coachCar(c, { roof: 13.3, sill: 3.9, end: 0.6, endR: 1.2, base: CO.white, badge: false, under: true,
    trucks: { centers: 62.3, wb: 8.2, d: 36 }, diaphragm: [4.25, 11.8],
    rows: [{ a: 6.0, b: L - 6.0, y: 7.4, w: 4.6, h: 3.1, pitch: 6.45, r: 0.45 }],
    doors: [2.0, L - 4.6].map((x) => ({ x, w: 2.6, h: 7.0, glassY: 0.5, glassH: 0.38 })),
    livery: () => bands(L, [[12.4, 3, CO.blue], [6.3, 0.9, CO.red], [5.5, 0.35, CO.blue], [0, 4.25, CO.skirt]]) +
      // The doors are red: painted behind their translucent panels.
      rect(2.0, 4.05, 2.6, 7.0, CO.red) + rect(L - 4.6, 4.05, 2.6, 7.0, CO.red),
    extra: (cc) => hvac(L / 2 - 7, 13.3, 14, 0.7) +
      (dining ? letters(cc, L / 2, 11.2, 0.75, "YEMEKLİ VAGON", CO.red, { weight: 700 }) : "") +
      buffers(0, -1, { sill: 3.9 }) + buffers(L, 1, { sill: 3.9 }) });
}
const coach = (c) => tcddCoach(c, false);
const dining = (c) => tcddCoach(c, true);

// ---------- Tables ----------

export const TYPES = {
  tcddHt65000Cab: { name: "HT65000 YHT end car", kind: "emu" },
  tcddHt65000Mid: { name: "HT65000 YHT intermediate car", kind: "emu" },
  tcddHt80000Cab: { name: "HT80000 YHT end car", kind: "emu" },
  tcddHt80000Mid: { name: "HT80000 YHT intermediate car", kind: "emu" },
  tcddE68000: { name: "E68000 electric locomotive", kind: "electric" },
  tcddE43000: { name: "E43000 electric locomotive", kind: "electric" },
  tcddDe24000: { name: "DE24000 diesel locomotive", kind: "diesel" },
  tcddDe22000: { name: "DE22000 diesel locomotive", kind: "diesel" },
  tcddDm15000Cab: { name: "DM15000 driving car", kind: "emu" },
  tcddDm15000Mid: { name: "DM15000 intermediate car", kind: "emu" },
  tcddMt30000Cab: { name: "MT30000 driving car", kind: "emu" },
  tcddMt30000Mid: { name: "MT30000 intermediate car", kind: "emu" },
  tcddCoach: { name: "TCDD coach", kind: "coach" },
  tcddDining: { name: "TCDD dining car", kind: "coach" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers (or to the joint's center), from the figures
// usually published, set down from memory and not checked for this file:
// the HT65000 about 158 m as six cars; the HT80000 200.2 m as eight cars;
// the E68000 20.7 m; the E43000 16.9 m; the DE24000 19.5 m; the DE22000
// 18.3 m; the DM15000 22.7 m a car, four cars; the MT30000 25.0 m a car,
// three cars; the coach 26.4 m.
export const MODELS = {
  tcddHt65000Cab: M(ht65000Cab, 86.0, true),
  tcddHt65000Mid: M(ht65000Mid, 86.0, false, byIndex),
  tcddHt80000Cab: M(ht80000Cab, 82.0, true),
  tcddHt80000Mid: M(ht80000Mid, 82.0, false, byIndex),
  tcddE68000: M(e68000, 68.0),
  tcddE43000: M(e43000, 55.0),
  tcddDe24000: M(de24000, 64.0),
  tcddDe22000: M(de22000, 60.0),
  tcddDm15000Cab: M(dm15000Cab, 74.5, true),
  tcddDm15000Mid: M(dm15000Mid, 74.5),
  tcddMt30000Cab: M(mt30000Cab, 82.0, true),
  tcddMt30000Mid: M(mt30000Mid, 82.0),
  tcddCoach: M(coach, 86.6),
  tcddDining: M(dining, 86.6),
};

const set = (label, ...units) => ({ label, units });
const hauled = (loco, name, k) => set(`Typical: a ${name} locomotive, a dining car and ${k} coaches (which locomotive is a judgement; the timetable names none)`,
  [loco, 1], ["tcddDining", 1], ["tcddCoach", k]);
const HT65000_SET = set("Typical: a six-car HT65000 YHT set (a judgement: the timetable names no unit; the HT65000 works the Ankara–Eskişehir, Ankara–Sivas and Ankara–Karaman YHT lines)",
  ["tcddHt65000Cab", 1], ["tcddHt65000Mid", 4], ["tcddHt65000Cab", 1]);
const HT80000_SET = set("Typical: an eight-car HT80000 YHT set (a judgement: the timetable names no unit; the Siemens Velaro TR works the Ankara–İstanbul YHT)",
  ["tcddHt80000Cab", 1], ["tcddHt80000Mid", 6], ["tcddHt80000Cab", 1]);
const DM15000_SET = set("Typical: a four-car DM15000 diesel unit (a judgement: the timetable names no unit; the DM15000 works the İzmir regionals, photographed at Basmane)",
  ["tcddDm15000Cab", 1], ["tcddDm15000Mid", 2], ["tcddDm15000Cab", 1]);
const MT30000_SET = set("Typical: a three-car MT30000 diesel unit (a judgement: the timetable names no unit)",
  ["tcddMt30000Cab", 1], ["tcddMt30000Mid", 1], ["tcddMt30000Cab", 1]);

// The timetable (the community GTFS) names no locomotive or unit, and its
// lines are named by their two ends, so a train is placed by its number
// and by its two ends, and by its line's two ends only when its own
// aren't known. Every rule is a judgement; the ones with least behind
// them are marked "a guess" in the set labels above, and the two that rest
// on photographs of the train itself are marked as photographed.
//   YHT: the 81xxx–85xxx high-speed numbers. The Velaro TR (HT80000)
//     works the Ankara–İstanbul line (the 810xx numbers); the HT65000
//     the other YHT lines.
//   The named eastern expresses, photographed behind their locomotives:
//     the Doğu Ekspresi (Ankara–Kars) and the Güney Kurtalan Ekspresi
//     (Ankara–Kurtalan) behind a DE22000 (dogu.jpg, de22000.jpg); the
//     Fırat Ekspresi (Ankara–Malatya) behind a DE24000 (de24000-2.jpg).
//     The Vangölü Ekspresi (Ankara–Tatvan) and the Tahran–Van train run
//     the same unelectrified eastern network: a DE24000 (a judgement).
//   The electrified main lines (Ankara–İstanbul, Ankara–İzmir, and the
//     internationals to Sofia and Bucharest): an E68000 (a judgement).
//   The İzmir expresses (Bandırma, Isparta, Eskişehir, Konya): an
//     E43000, the older electric photographed at Haydarpaşa (a judgement;
//     the 72xxx numbers on those routes are the same trains' return
//     workings, so the rule is by route, not by number range).
//   The İzmir regionals (Basmane, Denizli, Uşak, Alaşehir, Manisa, Tire,
//     Ödemiş, Söke, Nazilli): the DM15000, photographed at Basmane.
//   Everything else, and any train not placed: the MT30000.
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i").toLowerCase().trim();
const ends = (t) => {
  const a = fold(t.origin), b = fold(t.destination || t.dest);
  if (a || b) return `${a} ${b}`;
  return fold(String(t.route || t.line || "").replace(/ – /g, " "));
};
const IZMIR_REGION = /(izmir \(basmane\)|denizli|usak|alasehir|manisa|tire|odemis sehir|soke|nazilli)/;
const IZMIR_EXPRESS = /(bandirma sehir|isparta|eskisehir|konya)/;
export const TYPICAL = {
  tcdd: (t = {}) => {
    const num = String(t.number || "").trim();
    const e = ends(t);
    const ankaraIstanbul = /ankara gar/.test(e) && /istanbul\(halkali\)/.test(e);
    const ankaraIzmir = /ankara gar/.test(e) && /izmir \(basmane\)/.test(e);
    if (/^8[1-5]/.test(num)) return /^810/.test(num) ? HT80000_SET : HT65000_SET;
    if (/kars/.test(e) && /ankara gar/.test(e)) return hauled("tcddDe22000", "DE22000 diesel", 6);
    if (/kurtalan/.test(e)) return hauled("tcddDe22000", "DE22000 diesel", 6);
    if (/malatya/.test(e) && /ankara gar/.test(e)) return hauled("tcddDe24000", "DE24000 diesel", 6);
    if (/tatvan gar/.test(e) && /ankara gar/.test(e)) return hauled("tcddDe24000", "DE24000 diesel", 6);
    if (/tahran/.test(e) || /\bvan\b/.test(e)) return hauled("tcddDe24000", "DE24000 diesel", 5);
    if (ankaraIstanbul || ankaraIzmir || /sofia/.test(e) || /bucuresti nord/.test(e)) return hauled("tcddE68000", "E68000 electric", 5);
    if (/izmir \(basmane\)/.test(e) && IZMIR_EXPRESS.test(e)) return hauled("tcddE43000", "E43000 electric", 5);
    if (IZMIR_REGION.test(e)) return DM15000_SET;
    return MT30000_SET;
  },
};

// Sources: the photograph each drawing was checked against (Wikimedia
// Commons). Builders are the commonly published ones, set down from
// memory; figures Trainsheet could not stand behind are left out. Three
// photographs have no determined Commons URL (see the header and
// world-build/countries/tr/photos/MANIFEST.md); their models carry no
// source link rather than an invented one.
const CM = "https://commons.wikimedia.org/wiki/File:";
const fHt65000 = { model: "HT65000", type: "High-speed electric multiple unit", builder: "CAF", topSpeedMph: 155,
  source: `${CM}TCDD_Ta%C5%9F%C4%B1mac%C4%B1l%C4%B1k_HT65000_at_Ankara_Tren_Gar%C4%B1.jpg` };
const fHt80000 = { model: "HT80000 (Siemens Velaro TR)", type: "High-speed electric multiple unit", builder: "Siemens", topSpeedMph: 155,
  source: `${CM}TCDD_HT80000_Bilecik.jpg` };
const fE68000 = { model: "E68000", type: "Electric locomotive", builder: "Hyundai Rotem", lengthFt: 68.0,
  source: `${CM}TCDD_E_68_055_Arapl%C4%B1_-_Ye%C5%9Filhisar.jpg` };
const fE43000 = { model: "E43000", type: "Electric locomotive", builder: "Toshiba", lengthFt: 55.0,
  source: `${CM}TCDD_E43042_at_Haydarpasa.jpg` };
const fDe24000 = { model: "DE24000", type: "Diesel locomotive", builder: "Electro-Motive Diesel", lengthFt: 64.0 };
const fDe22000 = { model: "DE22000", type: "Diesel locomotive", builder: "Electro-Motive Diesel", lengthFt: 60.0,
  source: `${CM}TCDD_DE_22_068_Kurk_-_Uluova.jpg` };
const fDm15000 = { model: "DM15000", type: "Diesel multiple unit", builder: "FIAT Ferroviaria", lengthFt: 74.5 };
const fMt30000 = { model: "MT30000", type: "Diesel multiple unit", builder: "Hyundai Rotem", lengthFt: 82.0 };
const fCoach = { model: "TCDD coach", type: "Locomotive-hauled passenger coach", lengthFt: 86.6,
  source: `${CM}TCDD_E43042_at_Haydarpasa.jpg` };
export const FACTS = {
  tcddHt65000Cab: { ...fHt65000, lengthFt: 86.0,
    about: "An end car of the HT65000, CAF's six-car YHT set: white with a dark blue nose, a black window band and a red stripe over a blue one, the Turkish flag and \"HT 65010\" behind the cab. The set photographed at Ankara Tren Garı is HT 65010; the windows a car and where the pantographs sit are a reading." },
  tcddHt65000Mid: { ...fHt65000, lengthFt: 86.0,
    about: "An intermediate car of an HT65000. Where its pantographs sit is Trainsheet's reading; the photograph shows the set from the front." },
  tcddHt80000Cab: { ...fHt80000, lengthFt: 82.0,
    about: "An end car of the HT80000, Siemens' Velaro TR eight-car YHT set: a turquoise roof and upper body sweeping over the nose, a dark window band, a white lower body with a turquoise wave along the side, and a dark blue skirt. The set photographed at Söğütlüçeşme is HT 80108; the Bilecik photograph shows the set at distance, so the wave's exact sweep and the windows a car are a reading." },
  tcddHt80000Mid: { ...fHt80000, lengthFt: 82.0,
    about: "An intermediate car of an HT80000. Where its pantographs sit is Trainsheet's reading; the photographs show the set from the front and at distance." },
  tcddE68000: { ...fE68000,
    about: "The E68000, Hyundai Rotem's four-axle electric locomotive, TCDD's main-line electric: white with a yellow cab end, a grey roof and \"TCDD TAŞIMACILIK\" in blue along the side. The two photographed between Araplı and Yeşilhisar are hauling an empty ore train, at distance, so the side's detail is a reading." },
  tcddE43000: { ...fE43000,
    about: "The E43000, Toshiba's four-axle electric locomotive: white with a blue roof, a red stripe over a blue band, big blue \"TCDD\" letters and red cab doors. The one photographed at Haydarpaşa yard is E 43 042; the dining car and the coaches behind it are the ones drawn here." },
  tcddDe24000: { ...fDe24000,
    about: "The DE24000, EMD's six-axle hood-unit diesel of the eastern expresses: red with two white stripes along the long hood, a white chevron on the cab's side, \"TCDD\" in white on the hood and a blue panel on it. The one photographed at a station is DE 24 382, and DE24 184 is photographed hauling the Fırat Ekspresi near Pınarlı. Neither photograph's Commons file URL is determined; see photos/MANIFEST.md." },
  tcddDe22000: { ...fDe22000,
    about: "The DE22000, EMD's six-axle hood-unit diesel: red with one white stripe along the long hood and \"TCDD TAŞIMACILIK\" in white on it, a white chevron on the cab. DE 22 068 is photographed hauling the Güney Kurtalan Ekspresi between Kurk and Uluova, and DE 22 065 hauling the Doğu Ekspresi through snow." },
  tcddDm15000Cab: { ...fDm15000,
    about: "A driving car of the DM15000, FIAT's four-car diesel unit for the İzmir regionals: white with a grey-blue roof, a dark window band, red doors, a red stripe over a blue one sweeping up behind the cab, \"ANADOLU\" in blue. The set photographed at Basmane is MT 15406 \"ANADOLU\". Its photograph's Commons file URL is not determined; see photos/MANIFEST.md." },
  tcddDm15000Mid: { ...fDm15000,
    about: "An intermediate car of a DM15000. The windows a car and the doors' places are a reading; the photograph shows the set from the front at Basmane." },
  tcddMt30000Cab: { ...fMt30000,
    about: "A driving car of the MT30000, Hyundai Rotem's three-car diesel unit for the regionals: white with a grey roof, a blue stripe with a thin red one above it, red doors. Its photograph, crossing a steel truss bridge, is distant, so the windows a car and the doors' places are a reading; its Commons file URL is not determined, see photos/MANIFEST.md." },
  tcddMt30000Mid: { ...fMt30000,
    about: "An intermediate car of an MT30000. The windows a car and the doors' places are a reading; the photograph is distant." },
  tcddCoach: { ...fCoach,
    about: "A TCDD coach: white with a blue roof, a red stripe over a thin blue one under the windows, red doors — as the coaches behind E 43 042 at Haydarpaşa and behind DE24 184 on the Fırat Ekspresi. The windows and length are those of the standard 26.4 m coach." },
  tcddDining: { ...fCoach, model: "TCDD dining car", type: "Locomotive-hauled dining car",
    about: "A TCDD dining car, lettered \"YEMEKLİ VAGON\": the car at the back of E 43 042 at Haydarpaşa, in the same white, blue-roofed livery as the coaches. The windows are the standard coach's." },
};
