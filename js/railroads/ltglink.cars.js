// LTG Link's cars (scripts/railroads/lithuania.py, agency "ltglink"):
// Lithuania's passenger railroad: the Škoda double-deck EMUs of the
// electrified Vilnius–Kaunas and Vilnius–Trakai lines, the PESA diesel
// units of the long non-electrified runs to Klaipėda, Rīga and Mockava,
// the single-car and two-car PESA regionals, the older DR1AM diesel
// sets of the Turmantas line, and the Siemens ER20 diesel locomotive
// with its seated coaches on the weekend Vilnius–Klaipėda extras.
// Trainsheet's own side views at the shared scale (js/carart.js), each
// drawn from one photograph on Wikimedia Commons, named here fleet by
// fleet. Bodies and parts from czechia.cars.js (unit, euroLoco, hvac and
// the rest) and carmodels.js (coachCar); the lettering is drawn here (no
// logo files). The white Vytis (the Lithuanian coat of arms) that the
// real trains carry on their sides is a complex heraldic figure and is
// NOT drawn; where a photograph shows it, the fact sheet says so.
//
// What is from the photographs: each fleet's paint, the shape of its
// cab, and what can be counted on the side that faces the camera. None
// of the photographs is a true side view (the Marijampolė 620M comes
// closest), so the windows' spacing, the doors' places, the roof
// equipment, what hangs under the floor and every length are
// Trainsheet's reading of the type, not measurements. The lengths the
// drawings are scaled to are the figures usually published for each
// class, set down from memory and not checked against a source for this
// file (see MODELS); the fact sheets give them anyway, as the other
// plug-in files do. The set formations (three cars for the EJ575 and
// the 730ML, two for the 630MiL, four for the DR1AM, four coaches
// behind the ER20) are judgements too.
//
//   EJ575, the Škoda double-decker (three cars): EJ575-006 at Trakai
//     ("LTG Škoda EJ 575 EMU at Trakai, Lithuania 041025.jpg"), in the
//     current red livery: a grey body, a big red swoosh on the side
//     with the white Vytis in it, red doors, the upper deck's windows
//     in a dark band, a red band at the lower deck's windows; the grey
//     cab front with a red band over the windshield and a red V under
//     it, round headlamps, "EJ575-006" in blue. The night photograph at
//     Vilnius ("LTG-Link-Vilnius-Kaunas-EJ575-outside-Sep-2021.jpg")
//     shows the same shape in the older livery (light grey, red window
//     band, "LTG LINK" logo, a nature wrap on one car) and gives the
//     long side view. A third photograph, EJ575-002 between Vievis and
//     Žasliai (2015, older LG grey/red livery), could not be downloaded
//     (Wikimedia 429s on 22 Nov 2026); the two fetched photographs
//     carry the drawing.
//   730ML, the PESA three-car DMU: 730ML-006 at Šiauliai
//     ("Šiauliai station 2025 3.jpg") in the current red/silver livery
//     (silver body, red band at the windows, red doors, grey roof,
//     black lower front with "730ML-006" and the "LTG LINK" mark) and
//     730ML-007 approaching Mockava ("Mockava station 2025 12.jpg") in
//     the same livery. 730ML-002 arriving at Rīga on train 889
//     ("08.03.24 Rīga Pasažieru LTG 730ML-002 (53582543447).jpg")
//     wears the blue/silver nature-wrap livery instead; that variant
//     is not drawn. The photograph looks down the train from ahead, so
//     the windows a car and the doors' places are a reading.
//   620M, the PESA single-car railcar: 620M-016 at Šiauliai
//     ("Šiauliai station 2025 2.jpg") in the current livery (red upper
//     body, white roof, grey lower body and skirt, red doors, "LTG
//     LINK" logos, "620M-016" on the front) and the pure side profile
//     at Marijampolė ("The train at the Marijampolė train station.jpg",
//     2017) in the older red/grey "Lietuvos geležinkeliai" livery with
//     the white Vytis. The side profile gives the proportions: a cab
//     window, four windows, a door, two windows, a door, four windows.
//     The real car has a cab at each end; it is drawn here as a single
//     car with its cab nose on the left only (oneEnd), as the 710 in
//     srbijavoz.cars.js.
//   630MiL, the PESA two-car DMU: 630MiL-004 at Vilnius on train 647
//     ("28.05.19 Vilnius 630MiL-004 (47961510973).jpg") and at Mockava
//     ("Mockava, IC Hańcza, 630MiL-004.jpg"). Silver with a red window
//     band, red doors, a black cab front with "630MiL-004", the white
//     Vytis on a red panel behind the cab, "LIETUVOS GELEŽINKELIAI"
//     lettering. Both photographs show the older LG livery, not the
//     current LTG Link one; the drawing follows the photographs.
//   DR1AM, the RVR diesel set: a DR1AM leaving Vilnius
//     ("LTG DR1AM DMU departs Vilnius Central Railway Station,
//     Lithuania 031025.jpg"), 3 Oct 2025. Red with a grey roof and a
//     grey lower band, a red chevron on the front, "RVR" above the
//     windshields, a big round headlamp on the roof. The photograph is
//     a front three-quarter view, so the windows a car and the doors'
//     places are a reading. CAVEAT: this shows the DR1AM in service in
//     Oct 2025; the LTG Link fleet table on Wikipedia omits it, so it
//     is not confirmed to still run in the Nov 2026 feed window. It is
//     drawn for the Vilnius–Turmantas and Vilnius–Ignalina trains
//     because no other fleet is photographed on that line.
//   ER20, the Siemens diesel locomotive: ER20-040 at Vilnius on train
//     781 ("06.03.24 Vilnius ER20-040 (53583632913).jpg"). All red
//     with a dark grey skirt, black cab windows, radiator grilles on
//     the side, the white Vytis and "LIETUVOS GELEŽINKELIAI" lettering.
//     The coach rake behind it, and at Radviliškis
//     ("Radviliškis station 2025 4.jpg"), is the current LTG Link
//     coach: light grey with the windows in a black band, a red band
//     below them with the "LTG LINK" mark, a grey roof.
//
// NOT in this file: the Stadler FLIRT (EMU and battery). It entered
// commercial service on 22 Oct 2026 and now covers Vilnius–Kaunas
// (e.g. train 841) and, from 19 Nov 2026, Vilnius–Klaipėda — but NO
// Commons photograph of a Lithuanian FLIRT exists, and the only FLIRT
// photographed at Vilnius is a Belarusian EPr, explicitly not to be
// used. Train 841 (and any other FLIRT working) therefore has no
// consist until a photograph appears; TYPICAL returns null for it, and
// the app renders the timetable row with no consist strip.
//
// The timetable names no locomotive or unit, so which fleet a train is
// drawn as is a judgement, labeled as typical; see TYPICAL below, where
// each rule is set out. VERIFIED after writing (22 Nov 2026): node
// --check passes; every model rendered and looked at beside its
// photograph; TYPICAL run over all 247 ltglink runs, 0 failures.

import { coachCar, newId } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, poly, win, truck, underframe, slats } from "../carart.js?v=dev";
import { unit, euroLoco, letters, mark, hvac, buffers, exhaust, tank } from "./czechia.cars.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 2, depth = 1.0) => underframe(a, b, top, { depth, boxes: k, tanks: false });

// LTG Link's red, as photographed on the 730ML, the 620M and the
// coaches; and the "LTG LINK" mark as drawn here: "LTG" white on a
// black panel, "LINK" white on a red one, h tall, centred at (x, y).
// Drawn inside mark() so the panels stay in order (and the text reads)
// on a car the app draws mirrored at the far end of a set.
const LTG = { red: "#d8231f", redDark: "#b51c1a", black: "#1d2026" };
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
const ltgLogo = (c, x, y, h) => {
  const w1 = h * 2.1, w2 = h * 2.9, gap = h * 0.12, th = h * 0.62;
  const txtAt = (tx, str) => `<text x="${n(tx)}" y="${n(th * 0.36)}" font-size="${n(th)}" text-anchor="middle" font-weight="800" font-family="${SANS}" fill="#ffffff">${str}</text>`;
  return mark(c, x, y,
    rect(-w1 - gap - w2, -h / 2, w1, h, LTG.black, 0, 'rx="0.2"') +
    rect(-w2, -h / 2, w2, h, LTG.red, 0, 'rx="0.2"') +
    txtAt(-w1 / 2 - gap - w2, "LTG") + txtAt(-w2 / 2, "LINK"));
};

// ---------- EJ575: the Škoda double-decker ----------
// Three cars, each on two trucks of its own, the low floor and the two
// decks between them. Grey; the upper deck's windows in a dark band, a
// red band at the lower deck's windows; red doors; a big red swoosh on
// the side behind the cab (the white Vytis inside it is not drawn); the
// grey cab front with a red band over the windshield and a red V under
// it, round headlamps, "EJ575-006" in blue on the front (not drawn on
// the side). The pantograph on the middle car (a reading).
const EJ = { grey: "#c6c9cd", silver: "#d8dbde", dark: "#23272c", red: "#d8231f", roof: "#8f959b", black: "#17191c" };
const EJG = { roof: 15.0, sill: 3.0, low: 1.2 };
const NOSE_EJ = [[1.7, 3.0], [1.0, 4.6], ["q", 0.8, 6.4, 1.8, 8.4], [5.4, 13.6], ["q", 6.4, 15.0, 9.6, 15.0]];
function ej575Paint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, EJ.grey], [14.0, 3, EJ.roof], [10.4, 3.2, EJ.dark], [4.2, 3.4, EJ.red], [0, 4.2, EJ.grey]]);
    if (cab) {
      // The red swoosh on the side behind the cab, widening away from
      // it and merging into the red lower band; it stays below the dark
      // upper band the upper deck's windows sit in. The red band over
      // the windshield and the red V under it, on the nose.
      s += path("M13.0 10.2L13.0 7.0Q20.0 6.0 28.0 5.0Q38.0 3.8 46.0 4.2L46.0 10.2Z", EJ.red) +
        rect(-1, 13.4, 12, 1.6, EJ.red) + path("M-1 4.6L5.5 7.6L12.0 4.6L12.0 6.2L5.5 9.0L-1 6.2Z", EJ.red);
    }
    return s;
  };
}
const ejDoor = (x) => ({ x, w: 4.4, y0: EJG.low + 0.2, y1: 8.7, leaves: 2, glassY: 0.42, glassH: 0.4, grabs: false, fill: EJ.red });
const ej575Cab = (c) => unit(c, { roof: EJG.roof, sill: EJG.sill, drop: { a: 24.0, b: c.L - 17.0, y: EJG.low }, diaphragm: [3.4, 13.4],
  nose: NOSE_EJ, rake: [[1.8, 8.4], [5.4, 13.6]], depth: 3.2, cabLen: 10, lampY: 5.0, bare: true, surround: EJ.black,
  rows: [{ xs: [11.0], y: 6.9, w: 2.2, h: 3.0, r: 0.35 }, { xs: seq(22.0, 5.8, 9), y: 11.0, w: 4.4, h: 2.3, r: 0.4 },
    { xs: [30.0, 35.8, 41.6, 47.4, 53.2], y: 4.6, w: 4.4, h: 2.6, r: 0.4 },
    { xs: [c.L - 13.4], y: 6.4, w: 5.0, h: 2.8, r: 0.4 }],
  doors: [ejDoor(20.0), ejDoor(62.0)], trucks: [13.0, c.L - 10.2], wheel: 36, paint: ej575Paint(true),
  extra: (cc, g) => ltgLogo(cc, 47.0, 2.6, 1.1) +
    hvac(14, EJG.roof, 9, 0.5) + hvac(g.L - 16, EJG.roof, 10, 0.5) });
const ej575Mid = (c) => unit(c, { roof: EJG.roof, sill: EJG.sill, drop: { a: 17.0, b: c.L - 17.0, y: EJG.low }, diaphragm: [3.4, 13.4],
  rows: [{ xs: seq(8.0, 5.8, 12), y: 11.0, w: 4.4, h: 2.3, r: 0.4 },
    { xs: [28.0, 33.8, 39.6, 45.4, 51.2], y: 4.6, w: 4.4, h: 2.6, r: 0.4 },
    { xs: [4.0, c.L - 9.0], y: 6.4, w: 5.0, h: 2.8, r: 0.4 }],
  doors: [ejDoor(20.0), ejDoor(62.0)], trucks: [9.6, c.L - 9.6], wheel: 36, paint: ej575Paint(false),
  // The pantograph on the middle car (a reading).
  pan: c.index === 1 ? 40 : null,
  extra: (cc, g) => (c.index === 1 ? "" : hvac(3, EJG.roof, 10, 0.5)) + hvac(g.L - 14, EJG.roof, 10, 0.5) +
    ltgLogo(cc, g.L / 2, 2.6, 1.1) });

// ---------- 730ML: the PESA three-car DMU ----------
// Three cars, each on two trucks of its own. Silver with a red band at
// the windows, red doors, a grey roof and skirt; the cab front silver
// with a black lower band carrying the "LTG LINK" mark and the number
// (on the front face, not drawn on the side). No pantograph: it is a
// diesel. The blue/silver nature-wrap livery some units wear (730ML-002
// at Rīga) is not drawn.
const ML = { silver: "#d3d6d9", red: "#d8231f", roof: "#9aa0a6", skirt: "#6e747b", black: "#17191c" };
const MLG = { roof: 13.6, sill: 3.4 };
const NOSE_ML = [[1.5, 3.4], [0.9, 4.6], ["q", 0.7, 6.0, 1.9, 7.4], [6.2, 12.4], ["q", 7.2, 13.6, 10.0, 13.6]];
function ml730Paint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, ML.silver], [12.9, 3, ML.roof], [7.0, 3.6, ML.red], [0, 3.4, ML.skirt]]);
    if (cab) s += rect(-1, 3.4, 9, 2.2, ML.black);
    return s;
  };
}
const mlDoor = (x) => ({ x, w: 3.8, y0: MLG.sill + 0.15, y1: 10.6, leaves: 2, glassY: 0.45, glassH: 0.4, grabs: false, fill: ML.red });
const ml730Cab = (c) => unit(c, { roof: MLG.roof, sill: MLG.sill, nose: NOSE_ML, rake: [[1.9, 7.4], [6.2, 12.4]], depth: 3.2, cabLen: 10, lampY: 5.2, bare: true, surround: ML.black,
  rows: [{ xs: [9.8], y: 8.0, w: 2.6, h: 3.0, r: 0.4 }, { xs: seq(20.0, 5.0, 5), y: 7.5, w: 3.9, h: 3.0, r: 0.35 }, { xs: [52.0, 57.0], y: 7.5, w: 3.9, h: 3.0, r: 0.35 }],
  doors: [mlDoor(14.0), mlDoor(46.0)], trucks: [11.0, c.L - 10.0], wheel: 34, paint: ml730Paint(true),
  extra: (cc, g) => ltgLogo(cc, 25.0, 5.5, 1.0) +
    hvac(13, MLG.roof, 9, 0.55) + hvac(g.L - 18, MLG.roof, 10, 0.55) +
    boxes(20, 34, MLG.sill, 2, 1.2) + tank(37, 46, MLG.sill, 1.5) + boxes(49, g.L - 16, MLG.sill, 1, 1.2) });
const ml730Mid = (c) => unit(c, { roof: MLG.roof, sill: MLG.sill,
  rows: [{ xs: seq(12.0, 5.0, 7), y: 7.5, w: 3.9, h: 3.0, r: 0.35 }, { xs: [58.0], y: 7.5, w: 3.9, h: 3.0, r: 0.35 }],
  doors: [mlDoor(6.0), mlDoor(52.0)], trucks: [10.0, c.L - 10.0], wheel: 34, paint: ml730Paint(false),
  extra: (cc, g) => hvac(8, MLG.roof, 10, 0.55) + hvac(g.L - 18, MLG.roof, 10, 0.55) + ltgLogo(cc, g.L / 2, 5.5, 1.0) +
    boxes(16, g.L - 16, MLG.sill, 3, 1.2) });

// ---------- 620M: the PESA single-car railcar ----------
// One long car on two trucks, a cab at each end in reality, drawn here
// with its cab nose on the left only (oneEnd). Red upper body, a white
// roof, a grey lower body and a dark skirt, red doors, "LTG LINK"
// logos; the white Vytis on the side is not drawn. The proportions are
// from the Marijampolė side profile: a cab window, four windows, a
// door, two windows, a door, four windows. No pantograph: it is a
// diesel.
const M620 = { red: "#d8231f", white: "#e8eaec", grey: "#b9bec4", skirt: "#3a3d42", black: "#17191c" };
const M6G = { roof: 12.8, sill: 3.6 };
const NOSE_620 = [[1.2, 3.6], [0.9, 6.0], ["q", 0.9, 7.2, 2.2, 8.4], [5.0, 11.8], ["q", 6.0, 12.8, 9.0, 12.8]];
const m620Paint = (c, g) => bands(g.L, [[0, 20, M620.red], [12.2, 3, M620.white], [3.6, 1.8, M620.grey], [0, 3.6, M620.skirt]]);
const m620Door = (x) => ({ x, w: 3.4, y0: M6G.sill + 0.15, y1: 11.0, leaves: 2, glassY: 0.5, glassH: 0.36, grabs: false, fill: M620.red });
const ltglink620m = (c) => unit(c, { roof: M6G.roof, sill: M6G.sill, nose: NOSE_620, rake: [[2.2, 8.4], [5.0, 11.8]], depth: 2.6, cabLen: 9, lampY: 5.4, bare: true, surround: M620.black,
  rows: [{ xs: [5.8], y: 8.4, w: 2.2, h: 2.6, r: 0.3 }, { xs: seq(13.6, 5.2, 4), y: 7.8, w: 4.0, h: 2.9, r: 0.35 },
    { xs: [43.0, 48.2], y: 7.8, w: 4.0, h: 2.9, r: 0.35 }, { xs: seq(61.0, 5.2, 4), y: 7.8, w: 4.0, h: 2.9, r: 0.35 }, { xs: [83.0], y: 8.4, w: 2.2, h: 2.6, r: 0.3 }],
  doors: [m620Door(35.5), m620Door(54.5)], trucks: [11.5, c.L - 11.5], wheel: 33, paint: m620Paint,
  extra: (cc, g) => ltgLogo(cc, 46.0, 6.5, 1.1) +
    seq(14, 13, 5).map((x) => rect(x, M6G.roof - 0.05, 1.8, 0.4, M620.white, 0.4, 'rx="0.15"')).join("") +
    exhaust(g.L / 2 + 3, M6G.roof) + boxes(18, 33, M6G.sill, 2, 1.2) + tank(36, 45, M6G.sill, 1.5) + boxes(48, g.L - 18, M6G.sill, 2, 1.2) });

// ---------- 630MiL: the PESA two-car DMU ----------
// Two cars, a driving cab at each end. Silver with a red window band,
// red doors, a grey lower body, a black cab front with the number (on
// the front face, not drawn on the side), "LIETUVOS GELEŽINKELIAI"
// lettering on the grey. Both photographs show the older LG livery;
// the drawing follows them. No pantograph: it is a diesel.
const M630 = { silver: "#d3d6d9", red: "#d8231f", roof: "#9aa0a6", grey: "#b9bec4", skirt: "#3a3d42", black: "#17191c", blue: "#1f3a6e" };
const M3G = { roof: 13.4, sill: 3.6 };
const NOSE_630 = [[1.4, 3.6], [0.9, 4.8], ["q", 0.7, 6.2, 2.0, 7.6], [6.0, 12.4], ["q", 7.0, 13.4, 9.6, 13.4]];
function ml630Paint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, M630.silver], [12.7, 3, M630.roof], [7.0, 3.8, M630.red], [3.6, 2.2, M630.grey], [0, 3.6, M630.skirt]]);
    if (cab) s += rect(-1, 3.6, 8, 4.0, M630.black);
    return s;
  };
}
const ml630Door = (x) => ({ x, w: 3.6, y0: M3G.sill + 0.15, y1: 10.8, leaves: 2, glassY: 0.5, glassH: 0.36, grabs: false, fill: M630.red });
const ml630Cab = (c) => unit(c, { roof: M3G.roof, sill: M3G.sill, nose: NOSE_630, rake: [[2.0, 7.6], [6.0, 12.4]], depth: 3.0, cabLen: 10, lampY: 5.4, bare: true, surround: M630.black,
  rows: [{ xs: [10.0], y: 8.2, w: 2.4, h: 2.8, r: 0.35 }, { xs: seq(14.0, 5.4, 4), y: 7.5, w: 4.2, h: 2.9, r: 0.35 },
    { xs: [42.0, 47.4], y: 7.5, w: 4.2, h: 2.9, r: 0.35 }, { xs: [59.0, 64.4, 69.8], y: 7.5, w: 4.2, h: 2.9, r: 0.35 }],
  doors: [ml630Door(36.0), ml630Door(53.0)], trucks: [11.0, c.L - 11.0], wheel: 34, paint: ml630Paint(true),
  extra: (cc, g) => letters(cc, 25.0, 4.7, 0.55, "LIETUVOS GELEŽINKELIAI", M630.blue, { weight: 700, spacing: "0.02em" }) +
    hvac(13, M3G.roof, 9, 0.55) + hvac(g.L - 18, M3G.roof, 10, 0.55) +
    boxes(20, 34, M3G.sill, 2, 1.2) + tank(37, 46, M3G.sill, 1.5) + boxes(49, g.L - 16, M3G.sill, 1, 1.2) });

// ---------- DR1AM: the RVR diesel set ----------
// Four cars (a judgement: the sets run as three to six cars), each on
// two trucks of its own, a driving cab at each end. Red with a grey
// roof and a grey lower band, a red chevron on the front, "RVR" above
// the windshields and a big round headlamp on the roof (on the front
// face, not drawn on the side). No pantograph: it is a diesel.
const DR = { red: "#c8352c", grey: "#9a9c9d", roof: "#55585d", skirt: "#3a3d42", black: "#17191c" };
const DRG = { roof: 13.2, sill: 3.8 };
const NOSE_DR = [[1.0, 3.8], [0.8, 7.6], ["q", 0.8, 8.6, 1.4, 9.4], [2.4, 12.2], ["q", 2.8, 13.2, 4.4, 13.2]];
function dr1amPaint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, DR.red], [12.4, 3, DR.roof], [3.8, 1.6, DR.grey], [0, 3.8, DR.skirt]]);
    // The red chevron on the front, a white V pointing down.
    if (cab) s += path("M-1 8.2L5.5 4.8L12.0 8.2L12.0 6.8L5.5 3.6L-1 6.8Z", "#f2f3f4");
    return s;
  };
}
const drDoor = (x) => ({ x, w: 3.2, y0: DRG.sill + 0.15, y1: 10.8, leaves: 2, glassY: 0.5, glassH: 0.36, grabs: false, fill: DR.red });
const dr1amCab = (c) => unit(c, { roof: DRG.roof, sill: DRG.sill, nose: NOSE_DR, rake: [[1.4, 9.4], [2.4, 12.2]], depth: 2.4, cabLen: 6, lampY: 5.4, bare: true, surround: DR.black,
  rows: [{ xs: [6.4], y: 8.4, w: 2.2, h: 2.6, r: 0.3 }, { xs: seq(15.0, 4.8, 11), y: 7.8, w: 3.4, h: 2.8, r: 0.3 }],
  doors: [drDoor(8.5), drDoor(68.5)], trucks: [11.0, c.L - 11.0], wheel: 36, paint: dr1amPaint(true),
  // The big round headlamp on the cab roof.
  cab: () => circle(3.0, 13.3, 0.55, "#fff4cf", 0.4),
  extra: (cc, g) => letters(cc, 20.0, 5.6, 0.6, "DR1AM", "#ffffff", { weight: 600 }) +
    hvac(16, DRG.roof, 10, 0.55) + hvac(g.L - 20, DRG.roof, 10, 0.55) + exhaust(g.L / 2, DRG.roof) +
    boxes(20, 34, DRG.sill, 2, 1.2) + tank(37, 46, DRG.sill, 1.5) + boxes(49, g.L - 16, DRG.sill, 1, 1.2) });
const dr1amMid = (c) => unit(c, { roof: DRG.roof, sill: DRG.sill,
  rows: [{ xs: seq(6.0, 4.8, 13), y: 7.8, w: 3.4, h: 2.8, r: 0.3 }],
  doors: [drDoor(2.0), drDoor(70.0)], trucks: [11.0, c.L - 11.0], wheel: 36, paint: dr1amPaint(false),
  extra: (cc, g) => hvac(8, DRG.roof, 10, 0.55) + hvac(g.L - 20, DRG.roof, 10, 0.55) + exhaust(g.L / 2, DRG.roof) +
    boxes(16, g.L - 16, DRG.sill, 3, 1.2) });

// ---------- ER20: the Siemens diesel locomotive ----------
// All red with a dark grey skirt, black cab windows, radiator grilles
// on the side, "LIETUVOS GELEŽINKELIAI" lettering; the white Vytis is
// not drawn. Two cabs, a cab at each end; no pantograph: it is a
// diesel.
const ER = { red: "#d8231f", skirt: "#2a2d31", roof: "#5e5a58", black: "#17191c" };
const NOSE_ER = [[1.4, 4.1], [1.1, 7.0], ["q", 1.1, 8.5, 2.2, 9.5], [3.5, 12.6], ["q", 4.2, 13.4, 6.0, 13.4]];
const paintER20 = (c, L) => bands(L, [[0, 20, ER.red], [12.6, 3, ER.roof], [0, 4.1, ER.skirt]]);
const ltglinkEr20 = (c) => euroLoco(c, { roof: 13.4, sill: 4.1, nose: NOSE_ER, rake: [[2.2, 9.5], [3.5, 12.6]], centers: 34.0, wb: 8.5, wheel: 43, surround: ER.black,
  door: 7.0, doorW: 1.9, doorGlass: true, paint: paintER20, pans: false,
  grilles: [[-16, 13], [3, 13]], grilleFill: "rgba(20,22,25,0.55)",
  roof2: (cc, L) => exhaust(L * 0.28, 13.4) + exhaust(L * 0.72, 13.4),
  over: (cc, L) => letters(cc, L / 2, 11.9, 0.62, "LIETUVOS GELEŽINKELIAI", "#ffffff", { weight: 700, spacing: "0.02em" }) +
    letters(cc, L / 2, 6.6, 0.55, "ER20-040", "#ffffff", { weight: 600 }) });

// ---------- The LTG Link seated coach ----------
// Light grey with the windows in a black band, a red band below them
// with the "LTG LINK" mark, a grey roof and a dark skirt; a door at
// each end, ten windows between (the standard coach's arrangement).
const CO = { silver: "#d3d6d9", black: "#1d2026", red: "#d8231f", roof: "#9aa0a6", skirt: "#2a2d31" };
const ltglinkCoach = (c) => {
  const L = c.L;
  return coachCar(c, { roof: 13.3, sill: 3.9, end: 0.6, endR: 1.2, base: CO.silver, badge: false, under: true,
    trucks: { centers: L - 23.6, wb: 8.2, d: 36 }, diaphragm: [4.25, 11.8],
    rows: [{ a: 6.0, b: L - 6.0, y: 7.5, w: 4.4, h: 3.0, pitch: 6.3, r: 0.45 }],
    doors: [2.0, L - 4.6].map((x) => ({ x, w: 2.6, h: 7.0, glassY: 0.5, glassH: 0.38 })),
    livery: () => bands(L, [[12.4, 3, CO.roof], [7.0, 4.0, CO.black], [4.25, 2.75, CO.red], [0, 4.25, CO.skirt]]) +
      // The doors are dark: painted behind their translucent panels.
      rect(2.0, 4.05, 2.6, 7.0, CO.skirt) + rect(L - 4.6, 4.05, 2.6, 7.0, CO.skirt),
    extra: (cc) => ltgLogo(cc, L * 0.3, 5.6, 1.1) + hvac(L / 2 - 7, 13.3, 14, 0.7) +
      buffers(0, -1, { sill: 3.9 }) + buffers(L, 1, { sill: 3.9 }) });
};

// ---------- Tables ----------

export const TYPES = {
  ltglinkEj575Cab: { name: "EJ575 double-decker end car", kind: "emu" },
  ltglinkEj575Mid: { name: "EJ575 double-decker intermediate car", kind: "emu" },
  ltglink730mlCab: { name: "PESA 730ML driving car", kind: "emu" },
  ltglink730mlMid: { name: "PESA 730ML intermediate car", kind: "emu" },
  ltglink620m: { name: "PESA 620M railcar", kind: "emu" },
  ltglink630milCab: { name: "PESA 630MiL driving car", kind: "emu" },
  ltglinkDr1amCab: { name: "DR1AM driving car", kind: "emu" },
  ltglinkDr1amMid: { name: "DR1AM intermediate car", kind: "emu" },
  ltglinkEr20: { name: "Siemens ER20 diesel locomotive", kind: "diesel" },
  ltglinkCoach: { name: "LTG Link seated coach", kind: "coach" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers (or to the joint's center), from the figures
// usually published, set down from memory and not checked for this file,
// so each is a judgement: the EJ575 about 26.5 m a car, three cars; the
// 730ML about 19.5 m a car, three cars; the 620M 27.35 m; the 630MiL
// about 23 m a car, two cars; the DR1AM 24.5 m a car, four cars; the
// ER20 19.98 m; the coach 24.5 m.
export const MODELS = {
  ltglinkEj575Cab: M(ej575Cab, 87.0, true),
  ltglinkEj575Mid: M(ej575Mid, 87.0, false, byIndex),
  ltglink730mlCab: M(ml730Cab, 64.0, true),
  ltglink730mlMid: M(ml730Mid, 64.0),
  ltglink620m: M(ltglink620m, 90.0, true),
  ltglink630milCab: M(ml630Cab, 76.0, true),
  ltglinkDr1amCab: M(dr1amCab, 80.0, true),
  ltglinkDr1amMid: M(dr1amMid, 80.0),
  ltglinkEr20: M(ltglinkEr20, 66.0),
  ltglinkCoach: M(ltglinkCoach, 80.0),
};

const set = (label, ...units) => ({ label, units });
const hauled = (k) => set(`Typical: a Siemens ER20 diesel locomotive and ${k} LTG Link seated coaches (which locomotive is a judgement; the timetable names none — ER20-040 is photographed on train 781, Vilnius–Šiauliai)`,
  ["ltglinkEr20", 1], ["ltglinkCoach", k]);
const EJ575_SET = set("Typical: a three-car Škoda EJ575 double-deck set (a judgement: the timetable names no unit; the EJ575 works the electrified Vilnius–Kaunas and Vilnius–Trakai lines)",
  ["ltglinkEj575Cab", 1], ["ltglinkEj575Mid", 1], ["ltglinkEj575Cab", 1]);
const ML730_SET = set("Typical: a three-car PESA 730ML diesel unit (a judgement: the timetable names no unit; the 730ML works Vilnius–Klaipėda, Vilnius–Rīga 889/890 and Vilnius–Mockava)",
  ["ltglink730mlCab", 1], ["ltglink730mlMid", 1], ["ltglink730mlCab", 1]);
const M620_SET = set("Typical: a single PESA 620M railcar (a judgement: the timetable names no unit; the 620M is the regional workhorse, 13 cars)",
  ["ltglink620m", 1]);
const ML630_SET = set("Typical: a two-car PESA 630MiL diesel unit (a judgement: the timetable names no unit; 630MiL-004 is photographed on train 647, Vilnius–Marcinkonys)",
  ["ltglink630milCab", 2]);
const DR1AM_SET = set("Typical: a four-car DR1AM diesel set (a judgement: the timetable names no unit, and the sets run as three to six cars; a DR1AM is photographed on the Vilnius–Turmantas line in Oct 2025, but its Nov 2026 status is unconfirmed)",
  ["ltglinkDr1amCab", 1], ["ltglinkDr1amMid", 2], ["ltglinkDr1amCab", 1]);
const ER20_SET = hauled(4);

// The timetable (the community LTG Link GTFS) names no locomotive or
// unit, so a train is placed by its number and by its line's name.
// Every rule is a judgement except the first: train 841 is a FLIRT
// (see the header) and has no consist, so TYPICAL returns null for it
// and the app renders the timetable row with no consist strip.
//   841: the FLIRT — no consist (no Commons photograph of a
//     Lithuanian FLIRT exists).
//   889/890, 891/892: Vilnius–Rīga — the 730ML (730ML-002 is
//     photographed on train 889).
//   31–36: Vilnius–Mockava — the 730ML (730ML-007 is photographed
//     approaching Mockava; a 630MiL is also photographed there,
//     connecting with the PKP IC Hańcza).
//   13–19, 21, 22, 25, 26: Vilnius–Klaipėda and its Vilnius–Šiauliai
//     short workings — the 730ML (730ML-006 is photographed at
//     Šiauliai on the Vilnius–Klaipėda line).
//   78x: Vilnius–Klaipėda — the ER20 and coaches (ER20-040 is
//     photographed on train 781, the weekend/extra set).
//   7xx and 8xx (other than 841): Vilnius–Kaunas and Vilnius–Trakai —
//     the EJ575 (EJ575-006 is photographed at Trakai; the FLIRT also
//     works these lines now, and which workings are FLIRT beyond 841
//     is not identified — a judgement).
//   A Vilnius–Turmantas or Vilnius–Ignalina line: the DR1AM.
//   A Vilnius–Marcinkonys line: the 630MiL (630MiL-004 is photographed
//     on train 647).
//   Everything else: the 620M single railcar.
// The line's name decides (a short working's own ends can lie on a
// main line, so the line decides); the train's ends only without one.
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/ł/g, "l").replace(/Ł/g, "L").toLowerCase().trim();
const ends = (t) => {
  const a = fold(t.origin), b = fold(t.destination || t.dest);
  if (a || b) return `${a} ${b}`;
  return fold(String(t.route || t.line || "").replace(/ – /g, " "));
};
export const TYPICAL = {
  ltglink: (t = {}) => {
    const num = String(t.number || "").trim();
    // The line's name; the train's ends only without one.
    const r = fold(t.route || t.line) || ends(t);
    if (num === "841") return null; // FLIRT: no photograph, no consist.
    if (/^889\/890$/.test(num) || /^891\/892$/.test(num)) return ML730_SET;
    if (/^3[1-6]$/.test(num)) return ML730_SET;
    if (/^1[3-9]$/.test(num) || /^2[0-6]$/.test(num)) return ML730_SET;
    if (/^78\d$/.test(num)) return ER20_SET;
    if (/^[78]\d\d$/.test(num)) return EJ575_SET;
    if (/turmantas|ignalina/.test(r)) return DR1AM_SET;
    if (/marcinkonys/.test(r)) return ML630_SET;
    return M620_SET;
  },
};

// Sources: the photograph each drawing was made from (Wikimedia Commons).
// Builders are the commonly published ones, set down from memory; top
// speeds are given only where Trainsheet is confident of them.
const CM = "https://commons.wikimedia.org/wiki/File:";
const fEj575 = { model: "EJ575 (Škoda CityElefant)", type: "Double-deck electric multiple unit", builder: "Škoda Vagonka", topSpeedMph: 99, lengthFt: 87.0,
  source: `${CM}LTG_%C5%A0koda_EJ_575_EMU_at_Trakai,_Lithuania_041025.jpg` };
const f730ml = { model: "PESA 730ML", type: "Diesel multiple unit", builder: "PESA", topSpeedMph: 75, lengthFt: 64.0,
  source: `${CM}%C5%A0iauliai_station_2025_3.jpg` };
const f620m = { model: "PESA 620M", type: "Diesel railcar", builder: "PESA", topSpeedMph: 75, lengthFt: 90.0,
  source: `${CM}%C5%A0iauliai_station_2025_2.jpg` };
const f630mil = { model: "PESA 630MiL", type: "Diesel multiple unit", builder: "PESA", topSpeedMph: 75, lengthFt: 76.0,
  source: `${CM}28.05.19_Vilnius_630MiL-004_(47961510973).jpg` };
const fDr1am = { model: "DR1AM", type: "Diesel multiple unit", builder: "Rīgas Vagonbūves Rūpnīca (RVR)", lengthFt: 80.0,
  source: `${CM}LTG_DR1AM_DMU_departs_Vilnius_Central_Railway_Station,_Lithuania_031025.jpg` };
const fEr20 = { model: "Siemens ER20 (EuroRunner)", type: "Diesel locomotive", builder: "Siemens", lengthFt: 66.0,
  source: `${CM}06.03.24_Vilnius_ER20-040_(53583632913).jpg` };
const fCoach = { model: "LTG Link seated coach", type: "Locomotive-hauled passenger coach", lengthFt: 80.0,
  source: `${CM}Radvili%C5%A1kis_station_2025_4.jpg` };
export const FACTS = {
  ltglinkEj575Cab: { ...fEj575,
    about: "An end car of the EJ575, Škoda's three-car double-decker for the electrified lines: grey with a big red swoosh on the side, red doors, the upper deck's windows in a dark band, a red band at the lower deck's windows, and a grey cab front with a red band over the windshield. The unit photographed at Trakai is EJ575-006; the night photograph at Vilnius shows the same shape in the older livery with a nature wrap. The white Vytis inside the red swoosh is not drawn. Drawn as a three-car set." },
  ltglinkEj575Mid: { ...fEj575,
    about: "An intermediate car of an EJ575, grey with a dark upper band and a red lower band and red doors. Where the pantograph sits is Trainsheet's reading; the photographs show the ends of the train." },
  ltglink730mlCab: { ...f730ml,
    about: "A driving car of the PESA 730ML, the three-car diesel unit of the long non-electrified runs: silver with a red band at the windows, red doors, a grey roof, a black lower front with the \"LTG LINK\" mark. The unit photographed at Šiauliai is 730ML-006, on the Vilnius–Klaipėda line; 730ML-007 is photographed approaching Mockava in the same livery. A blue/silver nature-wrap livery worn by 730ML-002 at Rīga is not drawn. Drawn as a three-car set; the windows and doors are a reading." },
  ltglink730mlMid: { ...f730ml,
    about: "An intermediate car of a 730ML, silver with a red window band and red doors. Its windows and doors are a reading; the photographs show the train from ahead." },
  ltglink620m: { ...f620m,
    about: "The PESA 620M, the single-car diesel railcar of the regional lines: a red upper body, a white roof, a grey lower body, red doors and \"LTG LINK\" logos. The unit photographed at Šiauliai is 620M-016; the pure side profile at Marijampolė (2017, older \"Lietuvos geležinkeliai\" livery) gives the proportions — a cab window, four windows, a door, two windows, a door, four windows. The real car has a cab at each end; Trainsheet draws it with one cab nose. The white Vytis on the side is not drawn." },
  ltglink630milCab: { ...f630mil,
    about: "A driving car of the PESA 630MiL, the two-car diesel unit: silver with a red window band, red doors, a black cab front and \"LIETUVOS GELEŽINKELIAI\" lettering. The unit photographed at Vilnius on train 647 to Marcinkonys, and at Mockava, is 630MiL-004. Both photographs show the older LG livery, not the current LTG Link one; the drawing follows the photographs. The white Vytis behind the cab is not drawn. Drawn as a two-car set of two driving cars." },
  ltglinkDr1amCab: { ...fDr1am,
    about: "A driving car of the DR1AM, the Riga-built diesel set: red with a grey roof and a grey lower band, a red chevron on the front. The set photographed leaving Vilnius in Oct 2025 is on the Vilnius–Turmantas line; its Nov 2026 status is unconfirmed (the LTG Link fleet table omits it), so drawing it on the Turmantas and Ignalina trains is a judgement. Drawn as a four-car set, a judgement: the sets run as three to six cars." },
  ltglinkDr1amMid: { ...fDr1am,
    about: "An intermediate car of a DR1AM, red with a grey lower band. Its windows and doors are a reading; the photograph is a front three-quarter view of the leading car." },
  ltglinkEr20: { ...fEr20,
    about: "The ER20, Siemens' EuroRunner diesel locomotive of the weekend and extra Vilnius–Klaipėda trains: all red with a dark grey skirt, black cab windows, radiator grilles on the side and \"LIETUVOS GELEŽINKELIAI\" lettering. The one photographed at Vilnius on train 781 to Šiauliai is ER20-040. The white Vytis on its side is not drawn. Which trains it hauls is a judgement." },
  ltglinkCoach: { ...fCoach,
    about: "An LTG Link seated coach: light grey with the windows in a black band, a red band below them with the \"LTG LINK\" mark, a grey roof. The rake photographed at Radviliškis runs behind the ER20 on the Vilnius–Klaipėda extras; the windows are the standard coach's." },
};
