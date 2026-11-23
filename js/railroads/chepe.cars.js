// Chepe Express's cars (scripts/railroads/mexico.py, agency
// "chepe"): the Los Mochis–Creel tourist train — a Ferromex EMD
// GP38-2 and refurbished coaches. Trainsheet's own side views at
// the shared scale (js/carart.js), drawn from, and checked against,
// one photograph on Wikimedia Commons. The lettering is drawn here
// (no logo files); "Ferromex" sits on the locomotive's nose face
// and is not drawn on the side.
//
// What is from the photograph: the paint, the shape of the cab and
// the hood, and what can be counted on the side that faces the
// camera. The photograph is a front three-quarter view, so the
// windows' spacing, the doors' places, the roof equipment, what
// hangs under the floor and every length are Trainsheet's reading
// of the type, not measurements. The locomotive is drawn at the
// GP38-2's published length, 59 ft 2 in; the coaches at the usual
// 85 ft.
//
//   EMD GP38-2 #2022 + refurbished coaches: the Divisadero
//     photograph ("Chepe Divisadero.jpg",
//     https://commons.wikimedia.org/wiki/File:Chepe_Divisadero.jpg)
//     shows #2022 at the head of the full refurbished consist: a
//     dark-grey hood unit, "chepe express" in white script on the
//     long hood with the round Chepe mark beside it and
//     "FERROCARRIL CHIHUAHUA-PACIFICO" below, "2022" on the cab
//     side and on the number boards, "Ferromex" on the short
//     hood's face, a black-and-white striped plow, round
//     headlamps, a grey frame and fuel tank. Behind it the coaches:
//     a near-black upper body, an orange band along the lower
//     body with a thin white line above it, a silver-grey roof,
//     rectangular windows, the white "Chepe" mark on the side.
//     The photograph shows four coaches clearly, the train
//     curving away behind them; five is the usual Express
//     consist, so the set is drawn as the locomotive + five
//     coaches, a judgement.
//
//   The Urike dome dining car: no Commons photograph isolates
//     it, and no dome car is distinguishable in the consist
//     photograph — the coaches behind the locomotive read as one
//     type — so no separate dome model is drawn; the dome diner
//     is not invented here.
//
// The timetable names no rolling stock, so the fleet-to-train
// assignment is a judgement, labeled as typical; see TYPICAL below.

import { coachCar } from "../carmodels.js?v=dev";
import { C, rect, circle, path, truck, lines, slats, poly } from "../carart.js?v=dev";
import { buffers, exhaust, tank, letters } from "./czechia.cars.js?v=dev";

// ---------- EMD GP38-2 ----------
// A hood unit, drawn with plain primitives (the KCI CC201 pattern):
// the short hood ahead of the cab, the cab, the long hood behind it,
// two two-axle trucks. Dark grey with a black roof, "chepe express"
// in white on the long hood, "2022" on the cab side, a striped plow.
const GP = { grey: "#3a3f45", dark: "#232629", black: "#17191c", frame: "#2a2d31", white: "#f2f3f4", orange: "#e87722" };
function gp382(c) {
  const L = c.L, deck = 4.4, hood = 11.0, cabTop = 13.2, cab0 = 10.0, cab1 = 18.0;
  let s = buffers(0, -1, { end: 1.4, sill: deck, y: 3.45 }) + buffers(L, 1, { end: 1.4, sill: deck, y: 3.45 });
  // The frame and its walkway, and the black-and-white striped plow
  // under the short hood's nose.
  s += rect(1.3, deck - 0.9, L - 2.6, 0.9, GP.frame, 0.5);
  s += path(poly([[1.0, deck - 0.9], [5.2, deck - 0.9], [4.4, 0.7], [1.8, 0.7]]), GP.white, 0.5);
  s += path("M2.2 3.5L3.0 0.7L3.7 0.7L2.9 3.5Z", GP.black) + path("M3.6 3.5L4.4 0.7L5.0 0.7L4.3 3.5Z", GP.black);
  // The short nose ahead of the cab, the cab, the long hood behind it.
  s += path(poly([[2.2, deck], [2.2, hood - 0.6], ["q", 2.2, hood, 2.8, hood], [cab0, hood], [cab0, deck]]), GP.grey, 0.5);
  s += path(poly([[cab0, deck], [cab0, cabTop - 0.7], ["q", cab0, cabTop, cab0 + 0.8, cabTop], [cab1 - 0.8, cabTop], ["q", cab1, cabTop, cab1, cabTop - 0.7], [cab1, deck]]), GP.grey, 0.5);
  s += path(poly([[cab1, deck], [cab1, hood - 0.4], [L - 2.8, hood - 0.4], ["q", L - 2.2, hood - 0.4, L - 2.2, hood - 1.0], [L - 2.2, deck]]), GP.grey, 0.5);
  // The black roof over the hoods and cab.
  s += rect(2.2, hood - 0.5, cab0 - 2.2, 0.5, GP.dark) + rect(cab0, cabTop - 0.5, cab1 - cab0, 0.5, GP.dark) +
    rect(cab1, hood - 0.5, L - 2.2 - cab1, 0.5, GP.dark);
  // The radiator grille at the long hood's far end and the
  // dynamic-brake housing on the roof; the long hood's side is
  // otherwise plain dark grey, as photographed.
  s += rect(L - 6.0, 5.0, 3.6, 5.3, "rgba(20,22,25,0.35)", 0.4) + slats(L - 6.0, 5.0, 3.6, 5.3, 0.3, "rgba(255,255,255,0.2)");
  s += rect(30.0, hood - 0.05, 12.0, 0.55, GP.dark, 0.4, 'rx="0.25"');
  s += exhaust(24.0, hood) + exhaust(46.0, hood);
  // The cab windows and door, the handrails along the walkway, the
  // headlamp on the short hood and the number on the cab side.
  s += rect(cab0 + 0.7, 9.6, 2.5, 2.6, C.glass, 0.5, 'rx="0.25"') + rect(cab1 - 3.2, 9.6, 2.5, 2.6, C.glass, 0.5, 'rx="0.25"') +
    rect(cab0 + 3.6, 5.0, 0.4, 6.8, "none", 0.5);
  s += lines([[2.4, deck + 2.2, cab0 - 0.6, deck + 2.2], [cab1 + 0.6, deck + 2.2, L - 2.4, deck + 2.2]], "rgba(255,255,255,0.3)", 0.25);
  s += circle(2.6, 6.6, 0.45, "#fff4cf", 0.3);
  s += letters(c, cab0 + 4.0, 7.0, 1.1, "2022", GP.white, { weight: 700 });
  // "chepe express" in white on the long hood, with the round Chepe
  // mark beside it.
  s += circle(26.0, 8.8, 1.7, "none", 0, 'stroke="#f2f3f4" stroke-width="0.35"') +
    letters(c, 40.0, 8.8, 1.9, "chepe express", GP.white, { weight: 600 });
  s += tank(L / 2 - 4.5, L / 2 + 3.0, deck - 0.9, 1.5);
  for (const x of [10.0, L - 10.0]) s += truck(x, { wb: 8.5, d: 40, kind: "loco", top: deck - 0.9, axles: 2 });
  return s;
}

// The refurbished coach: a near-black upper body, an orange band
// along the lower body with a thin white line above it, a silver
// roof, rectangular windows, a door at each end, the white "Chepe"
// mark on the side.
const CO = { dark: "#232629", orange: "#e87722", roof: "#c9ccd0", skirt: "#1d2024", white: "#f2f3f4" };
function chepeCoach(c) {
  const L = c.L;
  return coachCar(c, { roof: 13.3, sill: 3.9, end: 0.6, endR: 1.2, base: CO.dark, badge: false, under: true,
    trucks: { centers: 59.5, wb: 8.5, d: 36 }, diaphragm: [4.25, 11.8],
    rows: [{ a: 6.0, b: L - 6.0, y: 7.4, w: 4.2, h: 2.8, pitch: 7.0, r: 0.3 }],
    doors: [2.0, L - 4.6].map((x) => ({ x, w: 2.6, h: 7.0, glassY: 0.5, glassH: 0.38 })),
    livery: () => rect(-1, 12.6, L + 2, 3, CO.roof) + rect(-1, 7.0, L + 2, 0.25, CO.white) + rect(-1, 3.9, L + 2, 3.1, CO.orange),
    extra: () => buffers(0, -1, { sill: 3.9 }) + buffers(L, 1, { sill: 3.9 }) +
      letters(c, L / 2 + 10, 10.6, 1.4, "Chepe", CO.white, { weight: 700 }) });
}

// ---------- Tables ----------

export const TYPES = {
  chepeGP382: { name: "EMD GP38-2 diesel locomotive", kind: "diesel" },
  chepeCoach: { name: "Chepe Express refurbished coach", kind: "coach" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
// Feet over the couplers: the GP38-2 59 ft 2 in; the coaches 85 ft.
export const MODELS = {
  chepeGP382: M(gp382, 59.2),
  chepeCoach: M(chepeCoach, 85.0),
};

const set = (label, ...units) => ({ label, units });
const CHEPE_SET = { ...set("Typical: a GP38-2 with five refurbished coaches (a judgement: the timetable names no stock; the photograph shows four coaches clearly, the train curving away, and five is the usual Express consist)",
  ["chepeGP382", 1], ["chepeCoach", 5]), wires: false };

// The timetable (chepe.mx, Chepe Express horarios) names no rolling
// stock, so both runs — one train number, both directions — are the
// one consist: the GP38-2 with its coaches.
export const TYPICAL = {
  chepe: (t = {}) => CHEPE_SET,
};

// Sources: the photograph each drawing was checked against
// (Wikimedia Commons). Builders are the commonly published ones.
const CM = "https://commons.wikimedia.org/wiki/File:";
const fGP = { model: "EMD GP38-2", type: "Diesel-electric locomotive", builder: "Electro-Motive Division (General Motors)",
  source: `${CM}Chepe_Divisadero.jpg` };
const fCoach = { model: "Chepe Express refurbished coach", type: "Locomotive-hauled passenger coach",
  source: `${CM}Chepe_Divisadero.jpg` };
export const FACTS = {
  chepeGP382: { ...fGP,
    about: "GP38-2 #2022, the Chepe Express's power in the Divisadero photograph: a dark-grey hood unit, \"chepe express\" in white script on the long hood with the round Chepe mark, \"2022\" on the cab side and the number boards, \"Ferromex\" on the short hood's face, a black-and-white striped plow. The exact unit varies by day; #2022 is the one photographed." },
  chepeCoach: { ...fCoach,
    about: "A refurbished Chepe Express coach: a near-black upper body, an orange band along the lower body with a thin white line above it, a silver-grey roof, rectangular windows, the white \"Chepe\" mark on the side. The Urike dome dining car has no separate model: no dome car is distinguishable in the consist photograph." },
};
