// Ukrzaliznytsia's cars (scripts/railroads/ukraine.py, agency "uz"):
// Ukraine's long-distance, Intercity+ and night trains. Trainsheet's own
// side views at the shared scale (js/carart.js), each drawn from, and
// checked against, one photograph on Wikimedia Commons, named here fleet
// by fleet. Bodies and parts from czechia.cars.js (unit, euroLoco, hvac
// and the rest) and carmodels.js (coachCar); the lettering is drawn here
// (no logo files).
//
// What is from the photographs: each fleet's paint, the shape of its cab,
// and what can be counted on the side that faces the camera. None of the
// photographs is a true side view (the EPL2T's comes closest), so the
// windows' spacing, the doors' places, the roof equipment, what hangs
// under the floor and every length are Trainsheet's reading of the type,
// not measurements. The lengths the drawings are scaled to are the figures
// usually published for each class, set down from memory and not checked
// against a source for this file (see MODELS); the fact sheets give only
// the locomotives'. The file was verified after writing: node --check
// passes, every consist renders, and each drawing was looked at beside
// its photograph (22 Nov 2026).
//
//   HRCS2, the Hyundai Rotem Intercity+ set (nine cars): HRCS2-002 at
//     Kharkiv ("Hyundai HRCS2-002 Kharkiv 02.jpg"), with the night pair
//     ("Hyundai Rotem HRCS2.JPG") for the nose's detail. Silver, the
//     windows in a dark band, the nose black round the windshield with
//     orange swooshes down its sides and the eye-like lamp cluster over
//     the windshield, twin round lamps low. The photograph looks down
//     the train from ahead, so the windows a car, the doors and where
//     the pantographs sit are a reading.
//   EJ675, the Škoda double-decker (six cars): EJ675-01
//     ("Trainset EJ675-01 2016 G1.jpg"). A white cab, a blue band with
//     the headlamp bar over the windshield, a red skirt, a blue-grey
//     double-deck body with two rows of windows, "225 001-7". The
//     photograph is a front three-quarter view, so the windows a deck,
//     the doors and where the pantograph sits are a reading.
//   EKr1 "Tarpan" (nine cars): EKr1-001 ("EKr1-001 Tarpan 2016 G1.jpg").
//     Silver-grey, an orange stripe along the roofline and down the
//     nose, a dark grey window band, the "ТАРПАН" horse logo on the
//     cab's side, a red skirt. The photograph is a front three-quarter
//     view, so the windows a car, the doors and where the pantographs
//     sit are a reading.
//   DPKr-3 (three cars): the set at Cherkasy ("Diesel-powered train
//     DPKr-3 on Cherkasy railway station.jpg"). A cream driving car with
//     an orange nose and a black window band, "УКРАЗАЛІЗНИЦЯ" on its
//     side; blue intermediate cars with a cream band. The photograph
//     looks along the train from above, so the doors' places and the
//     rear driving car's paint are a reading (taken to match the front
//     one). The two-car DPKr-2 is the same design and is drawn as the
//     DPKr-3; no separate DPKr-2 photograph is in the set.
//   EPL2T: EPL2T-004 ("EPL2T-004.jpg"). A dark green cab with the
//     red-and-white UZ chevron on its front, a pale green body with a
//     white stripe, a red skirt, a round headlamp on the cab roof. The
//     chevron is on the front face and is not drawn on the side. The
//     photograph is the closest to a side view in the set.
//   ER9M: ER9M-392 ("ER9M-392 train 2014 G1.jpg"). A white cab, a grey
//     roof, a big round headlamp on the roof, red bands with the
//     light-blue winged UZ mark, "ЕР9м-392" in blue, a blue skirt and a
//     blue band low on the side, a red plow. The number and the mark are
//     on the front face and are not drawn on the side.
//   ED9M: ED9M-0071 at Vinnytsia ("ED9M-0071 Train 2011 G2.jpg"). A
//     blue cab with orange destination displays over the windshields, a
//     blue-and-cream body, a red skirt. At the left of the same
//     photograph, a green UZ restaurant car ("РЕСТОРАН") in the classic
//     dark green with a yellow stripe: the restaurant car is drawn from
//     that car.
//   ChS7 (Škoda, two sections): ChS7-173 at Sevastopol
//     ("Locomotive ChS7-173 2012 G1.jpg"). Blue with a white swoosh
//     along the side and a red chevron on the nose, "ЧС7-173", a grey
//     roof, red pantographs. The swoosh's exact curve is a reading.
//   ChS4 (Škoda): ChS4-072 ("Locomotive ChS4-072 2011 G1.jpg"), hauling
//     blue coaches with a yellow stripe. Red with a cream band wrapping
//     the nose and a cream stripe along the side, a grey skirt,
//     "ЧС4-072". The coaches behind it are the same blue coaches drawn
//     here.
//   VL10 (two sections): VL10-083 ("ВЛ10-083.JPG"). Dark green with
//     orange stripes, "ВЛ10-083" on a red plate, a big round lamp on
//     the roof. This one is a Russian VL10, used as a class reference
//     only: no UZ marking is visible on it, and UZ's VL10s are taken
//     to share the green-and-orange livery.
//   2TE116 (two sections): 2TE116-1422 at Dnipropetrovsk
//     ("2TE116-1422 Dnipropetrovsk.jpg 01.jpg"). A green cab with
//     orange and yellow stripes, grey hood sides, hauling blue coaches.
//     The photograph is distant, so the hood's vents and the exhaust
//     stacks' places are a reading.
//   The coach: UZ's sleeper coaches at Kyiv at night (train 12,
//     "UKRAINE RAILWAYS TRAIN 12 DEPARTURE FOR SIMFEROPOL CRIMEA AT
//     KIEV CENTRAL STATION UKRAINE SEP 2013 (10044343313).jpg"). Dark
//     blue with a yellow stripe, lit windows. The windows and the
//     length are those of the standard 24.5 m coach.
//
// The timetable names no locomotive or unit, so which fleet a train is
// drawn as is a judgement, labeled as typical; see TYPICAL below, where
// each rule is set out. Three fleets have no train in the 14-day window
// the feed covers: the EJ675 and the EKr1 run Intercity+ services
// (Kyiv–Lviv, Kyiv–Ternopil, Kyiv–Lutsk) that are not among the five
// 7xx lines in this feed, and the EPL2T, ER9M and ED9M are commuter
// units whose suburban network is not in the feed at all (the feed is
// the long-distance network only). They are drawn all the same, with
// fact sheets, so the models exist when the feed grows; no train in the
// window is drawn as one.

import { coachCar } from "../carmodels.js?v=dev";
import { rect, circle, path, win, truck, underframe } from "../carart.js?v=dev";
import { unit, euroLoco, letters, hvac, buffers, exhaust } from "./czechia.cars.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 2, depth = 1.0) => underframe(a, b, top, { depth, boxes: k, tanks: false });

// ---------- HRCS2: the Hyundai Rotem Intercity+ set ----------
// Nine cars, each on two trucks of its own; a long pointed nose under a
// deep windshield, the eye-like lamp cluster over it; the windows in a
// dark band, orange swooshes down the nose's sides.
const HR = { silver: "#d3d6d9", roof: "#878d94", band: "#23272c", orange: "#f58220", nose: "#16181b", skirt: "#6e747b" };
const HRG = { roof: 12.8, sill: 3.6 };
const NOSE_HR = [[1.6, 3.6], [0.7, 4.7], ["q", 0.4, 6.3, 2.6, 7.7], [10.2, 12.0], ["q", 11.8, 12.8, 14.8, 12.8]];
function hrcs2Paint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, HR.silver], [11.85, 3, HR.roof], [0, 3.95, HR.skirt]]) +
      rect(cab ? 20 : -1, 7.0, L - (cab ? 20 : -1) + 1, 3.4, HR.band, 0, 'rx="0.4"');
    if (cab) {
      // The nose: black round the windshield, the orange swoosh down its side.
      s += rect(-1, 3.6, 11, 9.2, HR.nose) + path("M7.5 3.6L10.5 3.6L16.5 12.8L13.5 12.8Z", HR.orange);
    }
    return s;
  };
}
const hrDoor = (x) => ({ x, w: 2.7, y0: HRG.sill, y1: 10.6, leaves: 1, glassY: 0.5, glassH: 0.36, grabs: false, fill: HR.silver });
const hrcs2Cab = (c) => unit(c, { roof: HRG.roof, sill: HRG.sill, nose: NOSE_HR, rake: [[2.6, 7.7], [10.2, 12.0]], depth: 3.6, cabLen: 19, lampY: 5.9, bare: true,
  rows: [{ xs: seq(26.0, 5.6, 6), y: 7.3, w: 4.3, h: 2.6, r: 0.35 }], doors: [hrDoor(21), hrDoor(c.L - 4.6)],
  trucks: [14.0, c.L - 10.0], wheel: 35, paint: hrcs2Paint(true), surround: "#14171b",
  // The eye-like lamp cluster over the windshield, and the cab's side window.
  cab: () => path("M5.5 12.6Q7.5 11.7 9.5 12.6Q7.5 13.5 5.5 12.6Z", "#101215", 0.4) + circle(7.5, 12.6, 0.45, "#fff4cf", 0.3) +
    path("M13.5 7.6L17.5 7.6L17.5 10.2L15.7 10.2Z", "#1d2026", 0.4),
  extra: (cc, g) => hvac(24, HRG.roof, 10, 0.6) + hvac(g.L - 20, HRG.roof, 10, 0.6) + boxes(22, g.L - 16, HRG.sill, 3, 1.2) });
const hrcs2Mid = (c) => unit(c, { roof: HRG.roof, sill: HRG.sill,
  rows: [{ xs: seq(6.9, 5.6, 9), y: 7.3, w: 4.3, h: 2.6, r: 0.35 }], doors: [hrDoor(1.7), hrDoor(c.L - 4.4)],
  trucks: [10.0, c.L - 10.0], wheel: 35, paint: hrcs2Paint(false),
  // A pantograph on the third and sixth cars (a reading).
  pan: c.index === 2 || c.index === 5 ? c.L / 2 - 6 : null,
  extra: (cc, g) => hvac(8, HRG.roof, 10, 0.6) + hvac(g.L - 20, HRG.roof, 10, 0.6) + boxes(16, g.L - 16, HRG.sill, 3, 1.2) });

// ---------- EJ675: the Škoda double-decker ----------
// Six cars, each on two trucks of its own; a white cab with a blue band
// over the windshield, a red skirt, a blue-grey double-deck body with
// two rows of windows.
const EJ = { white: "#f2f3f4", blue: "#2b7fc2", body: "#6e87a0", dark: "#2a2f36", red: "#c8352c", roof: "#9aa0a6" };
const EJG = { roof: 15.0, sill: 3.6 };
const NOSE_EJ = [[1.2, 3.6], [1.0, 6.0], ["q", 1.0, 7.5, 2.0, 8.5], [4.5, 13.0], ["q", 5.5, 15.0, 8.0, 15.0]];
function ej675Paint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, EJ.body], [13.9, 3, EJ.roof], [0, 3.95, EJ.red]]) +
      rect(cab ? 18 : -1, 11.2, L - (cab ? 18 : -1) + 1, 2.9, EJ.dark, 0, 'rx="0.3"') +
      rect(cab ? 18 : -1, 6.9, L - (cab ? 18 : -1) + 1, 3.4, EJ.dark, 0, 'rx="0.3"');
    if (cab) {
      // The white cab front; the blue band over the windshield (with the
      // headlamp bar, a pale strip) and under it.
      s += rect(-1, 3.6, 12, 11.4, EJ.white) + rect(-1, 13.2, 12, 1.8, EJ.blue) + rect(-1, 4.6, 12, 2.4, EJ.blue) +
        rect(0, 13.6, 6, 0.8, "#dfe3e6");
    }
    return s;
  };
}
const ejDoor = (x) => ({ x, w: 3.2, y0: EJG.sill, y1: 11.0, leaves: 2, glassY: 0.45, glassH: 0.4, grabs: false, fill: EJ.body });
const ej675Cab = (c) => unit(c, { roof: EJG.roof, sill: EJG.sill, nose: NOSE_EJ, rake: [[2.0, 8.5], [4.5, 13.0]], depth: 3.2, cabLen: 16, lampY: 5.9, bare: true,
  rows: [{ xs: seq(22.0, 5.6, 10), y: 11.6, w: 4.3, h: 2.2, r: 0.35 }, { xs: seq(22.0, 5.6, 10), y: 7.3, w: 4.3, h: 2.6, r: 0.35 }],
  doors: [ejDoor(18), ejDoor(c.L - 6.0)],
  trucks: [10.0, c.L - 10.0], wheel: 36, paint: ej675Paint(true), surround: "#14171b",
  // The cab's side window, high on the upper deck behind the windshield.
  cab: () => path("M8.5 11.0L13.0 11.0L13.0 13.2L11.2 13.2Q9.8 12.4 8.5 11.0Z", "#1d2026", 0.4),
  extra: (cc, g) => hvac(24, EJG.roof, 10, 0.6) + hvac(g.L - 20, EJG.roof, 10, 0.6) + boxes(22, g.L - 16, EJG.sill, 3, 1.2) });
const ej675Mid = (c) => unit(c, { roof: EJG.roof, sill: EJG.sill,
  rows: [{ xs: seq(8.0, 5.6, 12), y: 11.6, w: 4.3, h: 2.2, r: 0.35 }, { xs: seq(8.0, 5.6, 12), y: 7.3, w: 4.3, h: 2.6, r: 0.35 }],
  doors: [ejDoor(2.0), ejDoor(c.L - 6.0)],
  trucks: [10.0, c.L - 10.0], wheel: 36, paint: ej675Paint(false),
  // A pantograph on the third car (a reading).
  pan: c.index === 2 ? c.L / 2 - 6 : null,
  extra: (cc, g) => hvac(8, EJG.roof, 10, 0.6) + hvac(g.L - 20, EJG.roof, 10, 0.6) + boxes(16, g.L - 16, EJG.sill, 3, 1.2) });

// ---------- EKr1 "Tarpan" ----------
// Nine cars, each on two trucks of its own; a long pointed nose under a
// deep windshield, an orange stripe along the roofline and down the nose,
// a dark grey window band, "ТАРПАН" on the cab's side, a red skirt.
const EK = { silver: "#d5d8da", roof: "#9aa0a6", band: "#3a3f45", orange: "#f26a1b", red: "#d23c2e", skirt: "#3a3d42" };
const EKG = { roof: 12.8, sill: 3.6 };
const NOSE_EK = [[1.6, 3.6], [0.7, 4.7], ["q", 0.4, 6.3, 2.6, 7.7], [10.2, 12.0], ["q", 11.8, 12.8, 14.8, 12.8]];
function ekr1Paint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, EK.silver], [11.85, 3, EK.roof], [0, 3.95, EK.skirt]]) +
      rect(-1, 12.0, L + 2, 0.55, EK.orange) +
      rect(cab ? 20 : -1, 7.0, L - (cab ? 20 : -1) + 1, 3.4, EK.band, 0, 'rx="0.4"');
    if (cab) {
      // The orange stripe down the nose, and the red skirt at its foot.
      s += path("M7.5 3.6L10.5 3.6L16.5 12.8L13.5 12.8Z", EK.orange) + rect(-1, 0, 8, 3.6, EK.red);
    }
    return s;
  };
}
const ekDoor = (x) => ({ x, w: 2.7, y0: EKG.sill, y1: 10.6, leaves: 1, glassY: 0.5, glassH: 0.36, grabs: false, fill: EK.silver });
const ekr1Cab = (c) => unit(c, { roof: EKG.roof, sill: EKG.sill, nose: NOSE_EK, rake: [[2.6, 7.7], [10.2, 12.0]], depth: 3.6, cabLen: 19, lampY: 5.9, bare: true,
  rows: [{ xs: seq(26.0, 5.6, 7), y: 7.3, w: 4.3, h: 2.6, r: 0.35 }], doors: [ekDoor(21), ekDoor(c.L - 4.6)],
  trucks: [14.0, c.L - 10.0], wheel: 35, paint: ekr1Paint(true), surround: "#14171b",
  // The cab's side window.
  cab: () => path("M13.5 7.6L17.5 7.6L17.5 10.2L15.7 10.2Z", "#1d2026", 0.4),
  extra: (cc, g) => letters(cc, 24, 8.7, 0.95, "ТАРПАН", "#ffffff", { weight: 700 }) +
    hvac(24, EKG.roof, 10, 0.6) + hvac(g.L - 20, EKG.roof, 10, 0.6) + boxes(22, g.L - 16, EKG.sill, 3, 1.2) });
const ekr1Mid = (c) => unit(c, { roof: EKG.roof, sill: EKG.sill,
  rows: [{ xs: seq(6.9, 5.6, 10), y: 7.3, w: 4.3, h: 2.6, r: 0.35 }], doors: [ekDoor(1.7), ekDoor(c.L - 4.4)],
  trucks: [10.0, c.L - 10.0], wheel: 35, paint: ekr1Paint(false),
  // A pantograph on the third and sixth cars (a reading).
  pan: c.index === 2 || c.index === 5 ? c.L / 2 - 6 : null,
  extra: (cc, g) => hvac(8, EKG.roof, 10, 0.6) + hvac(g.L - 20, EKG.roof, 10, 0.6) + boxes(16, g.L - 16, EKG.sill, 3, 1.2) });

// ---------- DPKr-3: the diesel railcar ----------
// Three cars, each on two trucks of its own; a rounded nose, an orange
// nose on the cream driving cars, a black window band, blue intermediate
// cars with a cream band. No pantograph: it is a diesel.
const DP = { cream: "#f2ede2", blue: "#2b4fae", orange: "#f58220", black: "#1d2026", red: "#d8262c", roof: "#b9bec4", skirt: "#3a3d42" };
const DPG = { roof: 13.4, sill: 3.6 };
const NOSE_DP = [[1.3, 3.6], [0.9, 5.5], ["q", 0.9, 7.0, 2.2, 8.2], [6.0, 12.6], ["q", 7.0, 13.4, 9.0, 13.4]];
function dpkrPaint(cab) {
  return (c, g) => {
    const L = g.L;
    if (cab) {
      return bands(L, [[0, 20, DP.cream], [12.55, 3, DP.roof], [0, 3.95, DP.skirt]]) +
        rect(9, 7.0, L - 8, 3.4, DP.black, 0, 'rx="0.4"') +
        rect(-1, 3.6, 9, 4.6, DP.orange) + rect(-1, 6.6, L + 2, 0.3, DP.red);
    }
    return bands(L, [[0, 20, DP.blue], [12.55, 3, DP.roof], [0, 3.95, DP.skirt]]) +
      rect(-1, 6.0, L + 2, 1.0, DP.cream) + rect(-1, 7.0, L + 2, 3.4, DP.black, 0, 'rx="0.4"') +
      rect(-1, 5.7, L + 2, 0.3, DP.red);
  };
}
const dpDoor = (x, fill) => ({ x, w: 2.7, y0: DPG.sill, y1: 10.6, leaves: 1, glassY: 0.5, glassH: 0.36, grabs: false, fill });
const dpkrCab = (c) => unit(c, { roof: DPG.roof, sill: DPG.sill, nose: NOSE_DP, rake: [[2.2, 8.2], [6.0, 12.6]], depth: 3.2, cabLen: 17, lampY: 5.9, bare: true,
  rows: [{ xs: seq(26.0, 5.6, 8), y: 7.3, w: 4.3, h: 2.6, r: 0.35 }], doors: [dpDoor(20, DP.cream), dpDoor(c.L - 5.0, DP.cream)],
  trucks: [12.0, c.L - 12.0], wheel: 33, paint: dpkrPaint(true), surround: "#14171b",
  // The cab's side window.
  cab: () => path("M11.5 7.6L15.5 7.6L15.5 10.2L13.7 10.2Z", "#1d2026", 0.4),
  extra: (cc, g) => letters(cc, g.L / 2 + 4, 5.3, 1.0, "УКРАЗАЛІЗНИЦЯ", DP.blue, { weight: 700 }) +
    hvac(24, DPG.roof, 10, 0.6) + boxes(22, g.L - 16, DPG.sill, 3, 1.2) });
const dpkrMid = (c) => unit(c, { roof: DPG.roof, sill: DPG.sill,
  rows: [{ xs: seq(7.0, 5.6, 11), y: 7.3, w: 4.3, h: 2.6, r: 0.35 }], doors: [dpDoor(2.0, DP.blue), dpDoor(c.L - 5.0, DP.blue)],
  trucks: [12.0, c.L - 12.0], wheel: 33, paint: dpkrPaint(false),
  extra: (cc, g) => hvac(8, DPG.roof, 10, 0.6) + hvac(g.L - 20, DPG.roof, 10, 0.6) + boxes(16, g.L - 16, DPG.sill, 3, 1.2) });

// ---------- The commuter EMUs: EPL2T, ER9M, ED9M ----------
// The classic flat-fronted units, two windshields, a door at each quarter
// of the car, many small windows. Each is drawn at its own length (the
// cars are 19.6 m on the EPL2T and ER9M, 21.5 m on the ED9M); the car
// counts in the consists are a reading (the photographs show long sets
// without a countable end).
// The windows are placed to clear the doors (the doors are drawn over the
// paint, and a window behind one would show through it).
const emuWin64 = [5.0, 8.4, 19.0, 22.4, 25.8, 29.2, 32.6, 36.0, 39.4, 42.8, 52.0, 55.4, 58.8];
const emuWin70 = [5.0, 8.4, 19.0, 22.4, 25.8, 29.2, 32.6, 36.0, 39.4, 42.8, 46.2, 57.0, 60.4, 63.8];
const emuDoor = (x, fill) => ({ x, w: 3.2, y0: 3.6, y1: 10.8, leaves: 2, glassY: 0.45, glassH: 0.4, grabs: true, fill });
const emuWin = (xs) => ({ xs, y: 7.6, w: 2.4, h: 2.8, r: 0.3 });

// EPL2T: a dark green cab, a pale green body with a white stripe, a red
// skirt, a round headlamp on the cab roof. The red-and-white chevron is
// on the front face and is not drawn on the side.
const EP = { green: "#1d4d2b", pale: "#a8c69a", white: "#f2f3f4", red: "#c8352c", roof: "#9aa0a6" };
const EPG = { roof: 13.2, sill: 3.6 };
const NOSE_EP = [[0.9, 3.6], [0.7, 8.0], [1.2, 12.2], ["q", 1.4, 13.2, 2.8, 13.2]];
function epl2tPaint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, EP.pale], [12.35, 3, EP.roof], [0, 3.95, EP.red]]) +
      rect(-1, 10.6, L + 2, 0.8, EP.white);
    if (cab) s += rect(-1, 3.6, 9, 9.6, EP.green);
    return s;
  };
}
const epl2tCab = (c) => unit(c, { roof: EPG.roof, sill: EPG.sill, nose: NOSE_EP, rake: [[1.0, 8.2], [1.4, 12.2]], depth: 2.6, cabLen: 8, lampY: 5.35, bare: true,
  rows: [emuWin(emuWin64)], doors: [emuDoor(14, EP.pale), emuDoor(47, EP.pale)],
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: epl2tPaint(true), surround: "#1d2026",
  // The round headlamp on the cab roof, and the cab's side window.
  cab: () => circle(2.0, 13.3, 0.55, "#fff4cf", 0.4) + path("M4.5 8.4L7.5 8.4L7.5 11.0L6.0 11.0Q5.0 10.0 4.5 8.4Z", "#1d2026", 0.4),
  extra: (cc, g) => hvac(g.L / 2 - 6, EPG.roof, 12, 0.6) + boxes(16, g.L - 16, EPG.sill, 3, 1.2) });
const epl2tMid = (c) => unit(c, { roof: EPG.roof, sill: EPG.sill,
  rows: [emuWin(emuWin64)], doors: [emuDoor(14, EP.pale), emuDoor(47, EP.pale)],
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: epl2tPaint(false),
  // A pantograph on the second car (a reading).
  pan: c.index === 1 ? c.L / 2 - 6 : null,
  extra: (cc, g) => hvac(g.L / 2 - 6, EPG.roof, 12, 0.6) + boxes(16, g.L - 16, EPG.sill, 3, 1.2) });

// ER9M: a white cab, a grey roof, a big round headlamp on the roof, red
// bands across the front, a blue band low on the side, a blue skirt, a
// red plow. The winged UZ mark and "ЕР9м-392" are on the front face and
// are not drawn on the side.
const ER = { white: "#f2f3f4", roof: "#b9bec4", red: "#d8262c", blue: "#2a6ed3", skirt: "#3a3d42" };
const ERG = { roof: 13.2, sill: 3.6 };
const NOSE_ER = [[0.9, 3.6], [0.7, 8.0], [1.2, 12.2], ["q", 1.4, 13.2, 2.8, 13.2]];
function er9mPaint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, ER.white], [12.35, 3, ER.roof], [0, 3.6, ER.skirt]]) +
      rect(-1, 4.2, L + 2, 1.8, ER.blue);
    if (cab) {
      s += rect(-1, 9.6, 9, 1.0, ER.red) + rect(-1, 6.4, 9, 0.8, ER.red) + rect(-1, 0, 7, 3.6, ER.red);
    }
    return s;
  };
}
const er9mCab = (c) => unit(c, { roof: ERG.roof, sill: ERG.sill, nose: NOSE_ER, rake: [[1.0, 8.2], [1.4, 12.2]], depth: 2.6, cabLen: 8, lampY: 5.35, bare: true,
  rows: [emuWin(emuWin64)], doors: [emuDoor(14, ER.white), emuDoor(47, ER.white)],
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: er9mPaint(true), surround: "#1d2026",
  // The big round headlamp on the cab roof, and the cab's side window.
  cab: () => circle(2.0, 13.5, 0.9, "#fff4cf", 0.4) + path("M4.5 8.4L7.5 8.4L7.5 11.0L6.0 11.0Q5.0 10.0 4.5 8.4Z", "#1d2026", 0.4),
  extra: (cc, g) => hvac(g.L / 2 - 6, ERG.roof, 12, 0.6) + boxes(16, g.L - 16, ERG.sill, 3, 1.2) });
const er9mMid = (c) => unit(c, { roof: ERG.roof, sill: ERG.sill,
  rows: [emuWin(emuWin64)], doors: [emuDoor(14, ER.white), emuDoor(47, ER.white)],
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: er9mPaint(false),
  // A pantograph on the second car (a reading).
  pan: c.index === 1 ? c.L / 2 - 6 : null,
  extra: (cc, g) => hvac(g.L / 2 - 6, ERG.roof, 12, 0.6) + boxes(16, g.L - 16, ERG.sill, 3, 1.2) });

// ED9M: a blue cab with orange destination displays over the windshields,
// a blue body with a cream band, a red skirt.
const ED = { blue: "#2a6ed3", cream: "#e8e4d8", red: "#c8352c", roof: "#9aa0a6" };
const EDG = { roof: 13.2, sill: 3.6 };
const NOSE_ED = [[1.0, 3.6], [0.8, 8.0], [1.3, 12.2], ["q", 1.5, 13.2, 3.0, 13.2]];
function ed9mPaint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, ED.blue], [12.35, 3, ED.roof], [0, 3.95, ED.red]]) +
      rect(-1, 5.6, L + 2, 1.2, ED.cream);
    if (cab) s += rect(-1, 4.2, 9, 1.2, ED.cream) + rect(-1, 0, 7, 3.6, ED.red);
    return s;
  };
}
const ed9mCab = (c) => unit(c, { roof: EDG.roof, sill: EDG.sill, nose: NOSE_ED, rake: [[1.1, 8.2], [1.5, 12.2]], depth: 2.6, cabLen: 8, lampY: 5.35,
  rows: [emuWin(emuWin70)], doors: [emuDoor(15, ED.blue), emuDoor(52, ED.blue)],
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: ed9mPaint(true), surround: "#1d2026",
  // The cab's side window (the destination displays come from the screen).
  cab: () => path("M4.5 8.4L7.5 8.4L7.5 11.0L6.0 11.0Q5.0 10.0 4.5 8.4Z", "#1d2026", 0.4),
  extra: (cc, g) => hvac(g.L / 2 - 6, EDG.roof, 12, 0.6) + boxes(16, g.L - 16, EDG.sill, 3, 1.2) });
const ed9mMid = (c) => unit(c, { roof: EDG.roof, sill: EDG.sill,
  rows: [emuWin(emuWin70)], doors: [emuDoor(15, ED.blue), emuDoor(52, ED.blue)],
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: ed9mPaint(false),
  // A pantograph on the second car (a reading).
  pan: c.index === 1 ? c.L / 2 - 6 : null,
  extra: (cc, g) => hvac(g.L / 2 - 6, EDG.roof, 12, 0.6) + boxes(16, g.L - 16, EDG.sill, 3, 1.2) });

// ---------- The locomotives ----------
// The two-section locomotives (ChS7, VL10, 2TE116) are drawn as one body
// with a cab at each end; euroLoco draws two trucks, and the inner two
// bogies are added in `over`, so each section rides on two bogies.

// ChS7 (Škoda, two sections): blue with a white swoosh along the side
// and a red chevron on the nose, a grey roof. The swoosh's exact curve
// is a reading.
const CHS7 = { blue: "#2f7fc4", white: "#f2f3f4", red: "#d8262c", roof: "#b9bec4", skirt: "#2a2d31" };
const NOSE_CHS7 = [[1.7, 4.1], [1.1, 6.3], ["q", 0.95, 8.5, 2.3, 9.3], [3.9, 12.15], ["q", 4.6, 13.0, 6.4, 13.0]];
function chs7Paint(c, L) {
  let s = bands(L, [[0, 20, CHS7.blue], [12.25, 3, CHS7.roof], [0, 4.1, CHS7.skirt]]);
  // The red chevron on the nose, as bands wrapping the nose's front.
  s += rect(-1, 8.2, 10, 1.0, CHS7.red) + rect(-1, 5.6, 10, 1.0, CHS7.red);
  // The white swoosh: low at the nose, cresting mid-side, low again at
  // the rear (drawn for the whole length; the halves mirror it).
  s += path("M-1 3.8L30 3.8Q45 3.8 55 6.8Q65 9.8 80 9.8L112 9.8L112 7.8L80 7.8Q67 7.8 57 4.8Q47 1.8 32 1.8L-1 1.8Z", CHS7.white);
  return s;
}
const chs7 = (c) => euroLoco(c, { roof: 13.0, sill: 4.1, nose: NOSE_CHS7, rake: [[2.3, 9.3], [3.9, 12.15]], centers: 85, wheel: 49, surround: "#1d2026",
  door: 7.4, doorW: 2.0, paint: chs7Paint,
  grilles: [[-32, 20, 9.8, 12.0], [12, 20, 9.8, 12.0]], grilleFill: "rgba(255,255,255,0.22)",
  over: (cc, L) => truck(46, { wb: 8.5, d: 49, kind: "loco", top: 4.1 }) + truck(L - 46, { wb: 8.5, d: 49, kind: "loco", top: 4.1 }) +
    letters(cc, 15, 4.9, 0.62, "ЧС7-173", "#ffffff", { weight: 600 }) });

// ChS4 (Škoda): red with a cream band wrapping the nose and a cream
// stripe along the side, a grey skirt. Its small side windows are drawn
// in `over`, symmetric about the middle.
const CHS4 = { red: "#a83c32", cream: "#e8c96a", roof: "#9aa0a6", skirt: "#6c7178" };
const NOSE_CHS4 = [[1.4, 4.1], [1.1, 7.0], ["q", 1.1, 8.5, 2.2, 9.5], [3.5, 12.3], ["q", 4.2, 13.0, 6.0, 13.0]];
function chs4Paint(c, L) {
  let s = bands(L, [[0, 20, CHS4.red], [12.25, 3, CHS4.roof], [0, 4.1, CHS4.skirt]]);
  s += rect(-1, 9.3, L + 2, 1.5, CHS4.cream) + rect(-1, 4.3, 9, 1.0, CHS4.cream);
  return s;
}
const chs4 = (c) => euroLoco(c, { roof: 13.0, sill: 4.1, nose: NOSE_CHS4, rake: [[2.2, 9.5], [3.5, 12.3]], centers: 30, wheel: 49, surround: "#1d2026",
  door: 7.0, doorW: 2.0, paint: chs4Paint,
  grilles: [[-8, 12, 7.0, 9.0]], grilleFill: "rgba(20,22,25,0.35)",
  over: (cc, L) => [19, 26, 33, 40].map((x) => win(x, 10.9, 2.0, 1.2, 0.25)).join("") });

// VL10 (two sections): dark green with two orange stripes along the
// side, a grey roof, a big round lamp on the roof. The photograph is a
// Russian VL10-083, a class reference only (see the header).
const VL = { green: "#1e4d2e", orange: "#f58220", roof: "#8f959b", skirt: "#1c1e20" };
const NOSE_VL = [[1.5, 4.1], [1.2, 7.0], ["q", 1.2, 8.5, 2.2, 9.5], [3.5, 12.3], ["q", 4.2, 13.0, 6.0, 13.0]];
function vl10Paint(c, L) {
  let s = bands(L, [[0, 20, VL.green], [12.25, 3, VL.roof], [0, 4.1, VL.skirt]]);
  s += rect(-1, 8.8, L + 2, 0.8, VL.orange) + rect(-1, 5.2, L + 2, 0.8, VL.orange);
  for (const y of [7.0, 10.6, 11.6]) s += rect(-1, y, L + 2, 0.12, "rgba(0,0,0,0.3)");
  return s;
}
const vl10 = (c) => euroLoco(c, { roof: 13.0, sill: 4.1, nose: NOSE_VL, rake: [[2.2, 9.5], [3.5, 12.3]], centers: 82, wheel: 49, surround: "#1d2026",
  door: 7.0, doorW: 2.0, paint: vl10Paint,
  grilles: [[-38, 16, 6.5, 8.5], [22, 16, 6.5, 8.5]], grilleFill: "rgba(20,22,25,0.3)",
  over: (cc, L) => truck(44, { wb: 8.5, d: 49, kind: "loco", top: 4.1 }) + truck(L - 44, { wb: 8.5, d: 49, kind: "loco", top: 4.1 }) +
    [23, 33, 43, 62.7, 72.7, 82.7].map((x) => win(x, 10.9, 2.0, 1.2, 0.25)).join("") });

// 2TE116 (two sections, diesel): a green cab with orange and yellow
// stripes, grey hood sides. No pantograph; the exhaust stacks ride on
// the roof of each section.
const TE = { green: "#2a6e44", grey: "#8f959b", orange: "#f58220", yellow: "#f8c400", roof: "#3a3d42", skirt: "#2a2d31" };
const NOSE_TE = [[1.4, 4.1], [1.2, 7.5], ["q", 1.2, 9.0, 2.2, 10.0], [3.5, 12.6], ["q", 4.2, 13.2, 6.0, 13.2]];
function te116Paint(c, L) {
  let s = bands(L, [[0, 20, TE.grey], [12.35, 3, TE.roof], [0, 4.1, TE.skirt]]);
  s += rect(-1, 4.1, 14, 9.1, TE.green) + rect(-1, 8.2, 14, 1.0, TE.orange) + rect(-1, 6.9, 14, 0.8, TE.yellow);
  return s;
}
const te116 = (c) => euroLoco(c, { roof: 13.2, sill: 4.1, nose: NOSE_TE, rake: [[2.2, 10.0], [3.5, 12.6]], centers: 92, wheel: 41, surround: "#1d2026",
  door: 7.0, doorW: 2.0, paint: te116Paint, pans: false,
  grilles: [[-42, 20, 8.0, 11.0], [22, 20, 8.0, 11.0]], grilleFill: "rgba(20,22,25,0.3)",
  roof2: (cc, L) => exhaust(L * 0.28, 13.2) + exhaust(L * 0.72, 13.2),
  over: (cc, L) => truck(48, { wb: 8.5, d: 41, kind: "loco", top: 4.1 }) + truck(L - 48, { wb: 8.5, d: 41, kind: "loco", top: 4.1 }) });

// ---------- The coaches ----------
// The standard 24.5 m coach on two trucks 19 m apart, a door at each
// end, eleven windows between, a yellow stripe just under the windows.
// Blue for the day and sleeper coaches; dark green for the restaurant
// car, lettered "РЕСТОРАН" (drawn from the car at the left of the ED9M
// photograph).
const COB = { blue: "#1e3a8a", yellow: "#f8c400", roof: "#9aa0a6", skirt: "#2a2d31" };
const COG = { green: "#1d5c2e", yellow: "#f8c400", roof: "#9aa0a6", skirt: "#2a2d31" };
function uzCoach(c, green) {
  const L = c.L, pal = green ? COG : COB, base = green ? COG.green : COB.blue;
  return coachCar(c, { roof: 13.3, sill: 3.9, end: 0.6, endR: 1.2, base, badge: false, under: true,
    trucks: { centers: 62.3, wb: 8.2, d: 36 }, diaphragm: [4.25, 11.8],
    rows: [{ a: 6.0, b: L - 6.0, y: 7.4, w: 4.6, h: 3.1, pitch: 6.45, r: 0.45 }],
    doors: [2.0, L - 4.6].map((x) => ({ x, w: 2.6, h: 7.0, glassY: 0.5, glassH: 0.38 })),
    livery: () => bands(L, [[12.4, 3, pal.roof], [6.3, 0.9, pal.yellow], [0, 4.25, pal.skirt]]),
    extra: (cc) => hvac(L / 2 - 7, 13.3, 14, 0.7) +
      (green ? letters(cc, L / 2, 11.3, 0.95, "РЕСТОРАН", "#f8c400", { weight: 700 }) : "") +
      buffers(0, -1, { sill: 3.9 }) + buffers(L, 1, { sill: 3.9 }) });
}
const coach = (c) => uzCoach(c, false);
const resto = (c) => uzCoach(c, true);

// ---------- Tables ----------

export const TYPES = {
  uzHrcs2Cab: { name: "HRCS2 Intercity+ end car", kind: "emu" },
  uzHrcs2Mid: { name: "HRCS2 Intercity+ intermediate car", kind: "emu" },
  uzEj675Cab: { name: "EJ675 double-decker end car", kind: "emu" },
  uzEj675Mid: { name: "EJ675 double-decker intermediate car", kind: "emu" },
  uzEkr1Cab: { name: "EKr1 Tarpan end car", kind: "emu" },
  uzEkr1Mid: { name: "EKr1 Tarpan intermediate car", kind: "emu" },
  uzDpkr3Cab: { name: "DPKr-3 railcar driving car", kind: "emu" },
  uzDpkr3Mid: { name: "DPKr-3 railcar intermediate car", kind: "emu" },
  uzEpl2tCab: { name: "EPL2T end car", kind: "emu" },
  uzEpl2tMid: { name: "EPL2T intermediate car", kind: "emu" },
  uzEr9mCab: { name: "ER9M end car", kind: "emu" },
  uzEr9mMid: { name: "ER9M intermediate car", kind: "emu" },
  uzEd9mCab: { name: "ED9M end car", kind: "emu" },
  uzEd9mMid: { name: "ED9M intermediate car", kind: "emu" },
  uzChs7: { name: "ChS7 electric locomotive", kind: "electric" },
  uzChs4: { name: "ChS4 electric locomotive", kind: "electric" },
  uzVl10: { name: "VL10 electric locomotive", kind: "electric" },
  uz2te116: { name: "2TE116 diesel locomotive", kind: "diesel" },
  uzCoach: { name: "Ukrzaliznytsia coach", kind: "coach" },
  uzResto: { name: "Ukrzaliznytsia restaurant car", kind: "coach" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers (or to the joint's center), from the figures
// usually published, set down from memory and not checked for this file:
// the HRCS2 187.5 m as nine cars; the EJ675 26.4 m a car, six cars; the
// EKr1 about 202 m as nine cars; the DPKr-3 25 m a car, three cars; the
// EPL2T and ER9M 19.6 m a car; the ED9M 21.5 m a car; the ChS7 34.0 m;
// the ChS4 18.5 m; the VL10 32.84 m; the 2TE116 36.4 m; the coach 24.5 m.
export const MODELS = {
  uzHrcs2Cab: M(hrcs2Cab, 68.4, true),
  uzHrcs2Mid: M(hrcs2Mid, 68.4, false, byIndex),
  uzEj675Cab: M(ej675Cab, 86.6, true),
  uzEj675Mid: M(ej675Mid, 86.6, false, byIndex),
  uzEkr1Cab: M(ekr1Cab, 73.5, true),
  uzEkr1Mid: M(ekr1Mid, 73.5, false, byIndex),
  uzDpkr3Cab: M(dpkrCab, 82.0, true),
  uzDpkr3Mid: M(dpkrMid, 82.0, false, byIndex),
  uzEpl2tCab: M(epl2tCab, 64.3, true),
  uzEpl2tMid: M(epl2tMid, 64.3, false, byIndex),
  uzEr9mCab: M(er9mCab, 64.3, true),
  uzEr9mMid: M(er9mMid, 64.3, false, byIndex),
  uzEd9mCab: M(ed9mCab, 70.5, true),
  uzEd9mMid: M(ed9mMid, 70.5, false, byIndex),
  uzChs7: M(chs7, 111.5),
  uzChs4: M(chs4, 61.0),
  uzVl10: M(vl10, 107.7),
  uz2te116: M(te116, 119.4),
  uzCoach: M(coach, 80.0),
  uzResto: M(resto, 80.0),
};

const set = (label, ...units) => ({ label, units });
const hauled = (loco, k, restoCar = true) => restoCar
  ? [[loco, 1], ["uzResto", 1], ["uzCoach", k]]
  : [[loco, 1], ["uzCoach", k]];
const HRCS2_SET = set("Typical: a nine-car HRCS2 Hyundai Rotem Intercity+ set (a judgement: the timetable names no unit; the HRCS2 is Ukrzaliznytsia's Intercity+ workhorse)",
  ["uzHrcs2Cab", 1], ["uzHrcs2Mid", 7], ["uzHrcs2Cab", 1]);
const EJ675_SET = set("Typical: a six-car EJ675 Škoda double-decker Intercity+ set (a judgement: the timetable names no unit)",
  ["uzEj675Cab", 1], ["uzEj675Mid", 4], ["uzEj675Cab", 1]);
const EKR1_SET = set("Typical: a nine-car EKr1 Tarpan Intercity+ set (a judgement: the timetable names no unit)",
  ["uzEkr1Cab", 1], ["uzEkr1Mid", 7], ["uzEkr1Cab", 1]);
const DPKR_SET = set("Typical: a three-car DPKr-3 diesel railcar (a judgement: the timetable names no unit; the DPKr family runs these cross-border regionals, and the two-car DPKr-2 is the same design)",
  ["uzDpkr3Cab", 1], ["uzDpkr3Mid", 1], ["uzDpkr3Cab", 1]);
const EPL2T_SET = set("Typical: a six-car EPL2T electric unit (a judgement: the timetable names no unit)",
  ["uzEpl2tCab", 1], ["uzEpl2tMid", 4], ["uzEpl2tCab", 1]);
const ER9M_SET = set("Typical: an eight-car ER9M electric unit (a judgement: the timetable names no unit)",
  ["uzEr9mCab", 1], ["uzEr9mMid", 6], ["uzEr9mCab", 1]);
const ED9M_SET = set("Typical: an eight-car ED9M electric unit (a judgement: the timetable names no unit)",
  ["uzEd9mCab", 1], ["uzEd9mMid", 6], ["uzEd9mCab", 1]);
const night = (loco, name) => set(`Typical: a ${name} locomotive, a restaurant car and six coaches (which locomotive is a judgement; the timetable names none)`, ...hauled(loco, 6));
const day = (loco, name) => set(`Typical: a ${name} locomotive and six coaches (which locomotive is a judgement; the timetable names none)`, ...hauled(loco, 6, false));

// The timetable (the jbb.ghsq.de GTFS) names no locomotive or unit, and
// its numbers are the UZ train numbers ("705", "Ш 89", "П 642",
// "40749"), so a train is placed by its number and by its two ends.
// Every rule below is a judgement except the first two. The ends are
// taken from the train's origin and destination when it has them, else
// from its line name, so a line's page (which has no number) is placed
// the same way.
//   7xx numbers: the Intercity+ trains. All five 7xx lines in the
//     window (Kyiv–Przemyśl, Kyiv–Kharkiv, Kyiv–Dnipro, Kyiv–Uzhhorod
//     and its Stryi short working) are drawn as the HRCS2, the fleet
//     that works them.
//   П numbers, and the Košice–Chop regional (Ш 961): the cross-border
//     regionals, drawn as the DPKr-3 diesel railcar.
//   Trains to Rakhiv, Yasinia, Solotvino or Chernivtsi: the Carpathian
//     diesel lines, drawn as a 2TE116 (the line is unelectrified there).
//   Trains with an end in the west (Lviv, Przemyśl, Chełm,
//     Ivano-Frankivsk, Uzhhorod, Chop, Mukachevo, Truskavets, Wien,
//     Budapest, Bratislava, Košice, Warszawa, Nyíregyháza, Záhony,
//     Szolnok): the Lviv railway's DC network, drawn as a VL10.
//   Trains to Kovel, Sumy or Kryvyi Rih: drawn as a ChS4 (the split
//     between the two AC locomotives is otherwise arbitrary).
//   Daytime Ш trains: a locomotive and six coaches, no restaurant car.
//   Everything else, and any train not placed: a ChS7, a restaurant car
//     and six coaches.
// NFD would decompose Cyrillic й and ї (Київ -> "киів", Кривий ->
// "кривии") and strip the combining mark, so they are parked on
// private-use code points while the Latin diacritics are stripped, then
// put back.
const fold = (s) => String(s || "").replace(/[йЙ]/g, "\uE000").replace(/[їЇ]/g, "\uE001")
  .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\uE000/g, "й").replace(/\uE001/g, "ї")
  .replace(/ł/g, "l").replace(/Ł/g, "L").toLowerCase().trim();
const ends = (t) => {
  const a = fold(t.origin), b = fold(t.destination || t.dest);
  if (a || b) return `${a} ${b}`;
  return fold(String(t.route || t.line || "").replace(/ – /g, " "));
};
const ICPLUS_LINES = /київ-пасажирський.*(przemysl|харків|дніпро|ужгород|стрий)/;
const DIESEL_ENDS = /(рахів|ясіня|солотвино|чернівці)/;
const WEST_ENDS = /(львів|przemysl|chelm|івано-франківськ|ужгород|чоп|мукачево|трускавець|wien|budapest|bratislava|kosice|warszawa|nyiregyhaza|zahony|szolnok)/;
const CHS4_ENDS = /(ковель|суми|кривий ріг)/;
const REGIONAL_LINES = /(nyiregyhaza|zahony|kosice)/;
export const TYPICAL = {
  uz: (t = {}) => {
    const num = String(t.number || "").trim();
    const e = ends(t);
    const isDay = /^Ш /.test(num);
    if (/^7\d\d$/.test(num)) return HRCS2_SET;
    if (!num && ICPLUS_LINES.test(e)) return HRCS2_SET;
    if (/^П /.test(num) || num === "Ш 961") return DPKR_SET;
    if (!num && REGIONAL_LINES.test(e)) return DPKR_SET;
    if (DIESEL_ENDS.test(e)) return isDay ? day("uz2te116", "2TE116 diesel") : night("uz2te116", "2TE116 diesel");
    if (WEST_ENDS.test(e)) return isDay ? day("uzVl10", "VL10 electric") : night("uzVl10", "VL10 electric");
    if (CHS4_ENDS.test(e)) return isDay ? day("uzChs4", "ChS4 electric") : night("uzChs4", "ChS4 electric");
    return isDay ? day("uzChs7", "ChS7 electric") : night("uzChs7", "ChS7 electric");
  },
};

// Sources: the photograph each drawing was checked against (Wikimedia
// Commons). Builders are the commonly published ones, set down from
// memory; figures Trainsheet could not stand behind are left out.
const CM = "https://commons.wikimedia.org/wiki/File:";
const fHrcs2 = { model: "HRCS2 (Hyundai Rotem)", type: "Electric multiple unit", builder: "Hyundai Rotem",
  source: `${CM}Hyundai_HRCS2-002_Kharkiv_02.jpg` };
const fEj675 = { model: "EJ675 (Škoda)", type: "Electric multiple unit", builder: "Škoda Vagonka",
  source: `${CM}Trainset_EJ675-01_2016_G1.jpg` };
const fEkr1 = { model: "EKr1 \"Tarpan\"", type: "Electric multiple unit", builder: "Kryukiv Railcar Building Works",
  source: `${CM}EKr1-001_Tarpan_2016_G1.jpg` };
const fDpkr3 = { model: "DPKr-3", type: "Diesel multiple unit", builder: "Kryukiv Railcar Building Works",
  source: `${CM}Diesel-powered_train_DPKr-3_on_Cherkasy_railway_station.jpg` };
const fEpl2t = { model: "EPL2T", type: "Electric multiple unit", builder: "Luhanskteplovoz",
  source: `${CM}EPL2T-004.jpg` };
const fEr9m = { model: "ER9M", type: "Electric multiple unit", builder: "Rīgas Vagonbūves Rūpnīca (RVR)",
  source: `${CM}ER9M-392_train_2014_G1.jpg` };
const fEd9m = { model: "ED9M", type: "Electric multiple unit", builder: "Demikhovsky Machine-Building Plant",
  source: `${CM}ED9M-0071_Train_2011_G2.jpg` };
const fChs7 = { model: "ChS7", type: "Electric locomotive", builder: "Škoda", lengthFt: 111.5,
  source: `${CM}Locomotive_ChS7-173_2012_G1.jpg` };
const fChs4 = { model: "ChS4", type: "Electric locomotive", builder: "Škoda", lengthFt: 61.0,
  source: `${CM}Locomotive_ChS4-072_2011_G1.jpg` };
const fVl10 = { model: "VL10", type: "Electric locomotive", builder: "Tbilisi Electric Locomotive Works", lengthFt: 107.7,
  source: `${CM}%D0%92%D0%9B10-083.JPG` };
const fTe116 = { model: "2TE116", type: "Diesel locomotive", builder: "Luhanskteplovoz", lengthFt: 119.4,
  source: `${CM}2TE116-1422_Dnipropetrovsk.jpg_01.jpg` };
const fCoach = { model: "Ukrzaliznytsia coach", type: "Locomotive-hauled passenger coach", lengthFt: 80.0,
  source: `${CM}UKRAINE_RAILWAYS_TRAIN_12_DEPARTURE_FOR_SIMFEROPOL_CRIMEA_AT_KIEV_CENTRAL_STATION_UKRAINE_SEP_2013_(10044343313).jpg` };
export const FACTS = {
  uzHrcs2Cab: { ...fHrcs2,
    about: "An end car of the HRCS2, Hyundai Rotem's nine-car Intercity+ set: silver with a black nose, orange swooshes and the eye-like lamp cluster over the windshield. The set photographed at Kharkiv is HRCS2-002; the second photograph, a night pair, shows the nose's detail." },
  uzHrcs2Mid: { ...fHrcs2,
    about: "An intermediate car of an HRCS2; each car rides on two trucks of its own. Where the pantographs sit is Trainsheet's reading, the photograph being taken from ahead of the train." },
  uzEj675Cab: { ...fEj675,
    about: "An end car of the EJ675, Škoda's six-car double-decker: a white cab, a blue band with the headlamp bar over the windshield, a red skirt. The unit photographed is EJ675-01, numbered 225 001-7; the windows a deck and where the pantograph sits are a reading." },
  uzEj675Mid: { ...fEj675,
    about: "An intermediate car of an EJ675, with windows on both decks. No train in the 14-day window the feed covers is drawn as one: the EJ675's Intercity+ services (Kyiv–Lviv, Kyiv–Lutsk) are not among the feed's 7xx lines." },
  uzEkr1Cab: { ...fEkr1,
    about: "An end car of the EKr1 \"Tarpan\", Kryukiv's nine-car Intercity+ set: silver-grey with an orange roofline stripe and the \"ТАРПАН\" horse logo on the cab's side. The unit photographed is EKr1-001; where the pantographs sit is a reading." },
  uzEkr1Mid: { ...fEkr1,
    about: "An intermediate car of an EKr1. No train in the 14-day window the feed covers is drawn as one: the Tarpan's Intercity+ services (Kyiv–Lviv, Kyiv–Ternopil) are not among the feed's 7xx lines." },
  uzDpkr3Cab: { ...fDpkr3,
    about: "A driving car of the DPKr-3, Kryukiv's three-car diesel railcar for the regional lines: cream with an orange nose, a black window band and \"УКРАЗАЛІЗНИЦЯ\" on its side. The set photographed at Cherkasy is a DPKr-3; the two-car DPKr-2 is the same design." },
  uzDpkr3Mid: { ...fDpkr3,
    about: "The intermediate car of a DPKr-3, blue with a cream band. The rear driving car is taken to match the front one; the photograph shows the train from above and its far end is not clear." },
  uzEpl2tCab: { ...fEpl2t,
    about: "An end car of the EPL2T, the classic commuter unit: a dark green cab with the red-and-white UZ chevron on its front (not drawn on the side), a pale green body with a white stripe, a red skirt. The unit photographed is EPL2T-004." },
  uzEpl2tMid: { ...fEpl2t,
    about: "An intermediate car of an EPL2T. No train in the 14-day window the feed covers is drawn as one: the feed carries no suburban trains, and the EPL2T works the commuter network." },
  uzEr9mCab: { ...fEr9m,
    about: "An end car of the ER9M: a white cab with a grey roof and the big round headlamp on it, red bands and a blue skirt. The unit photographed is ER9M-392; its number and the winged UZ mark are on the front face and are not drawn on the side." },
  uzEr9mMid: { ...fEr9m,
    about: "An intermediate car of an ER9M. No train in the 14-day window the feed covers is drawn as one: the feed carries no suburban trains, and the ER9M works the commuter network." },
  uzEd9mCab: { ...fEd9m,
    about: "An end car of the ED9M: a blue cab with orange destination displays over the windshields, a blue-and-cream body, a red skirt. The unit photographed at Vinnytsia is ED9M-0071, bound for Kyiv." },
  uzEd9mMid: { ...fEd9m,
    about: "An intermediate car of an ED9M. No train in the 14-day window the feed covers is drawn as one: the feed carries no suburban trains, and the ED9M works the commuter network." },
  uzChs7: { ...fChs7,
    about: "The ChS7, Škoda's two-section AC electric locomotive, Ukrzaliznytsia's night-train workhorse: blue with a white swoosh and a red chevron on the nose. The one photographed at Sevastopol is ChS7-173; the swoosh's exact curve is a reading." },
  uzChs4: { ...fChs4,
    about: "The ChS4, Škoda's single-section AC electric locomotive: red with a cream band wrapping the nose and a cream stripe along the side. The one photographed is ChS4-072, hauling the blue coaches with a yellow stripe drawn here." },
  uzVl10: { ...fVl10,
    about: "The VL10, the two-section DC electric locomotive of Ukraine's western lines: dark green with orange stripes. The one photographed is VL10-083, a Russian unit used here as a class reference only; UZ's VL10s are taken to share the green-and-orange livery." },
  uz2te116: { ...fTe116,
    about: "The 2TE116, the two-section diesel locomotive of the unelectrified lines: a green cab with orange and yellow stripes, grey hood sides. The one photographed at Dnipropetrovsk is 2TE116-1422, hauling blue coaches." },
  uzCoach: { ...fCoach,
    about: "A Ukrzaliznytsia coach: dark blue with a yellow stripe, as the sleeper coaches at Kyiv at night in the photograph (train 12 to Simferopol, 2013). The windows and length are those of the standard 24.5 m coach." },
  uzResto: { model: "Ukrzaliznytsia restaurant car", type: "Locomotive-hauled restaurant car", lengthFt: 80.0,
    source: `${CM}ED9M-0071_Train_2011_G2.jpg`,
    about: "A Ukrzaliznytsia restaurant car in the classic dark green with a yellow stripe, lettered \"РЕСТОРАН\": the green car at the left of the ED9M photograph at Vinnytsia. The windows are the standard coach's." },
};
