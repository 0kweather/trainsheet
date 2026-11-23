// Tren Suburbano's cars (scripts/railroads/mexico.py, agency
// "suburbano"): the Buenavista–Cuautitlán commuter trains — CAF
// 447-family EMUs (FE-07/FE-10). Trainsheet's own side views at the
// shared scale (js/carart.js), drawn from, and checked against, two
// photographs on Wikimedia Commons, named here fleet by fleet. The
// lettering is drawn here (no logo files); the Suburbano "S" roundel
// sits on the trains' front faces and is not drawn on the side.
//
// What is from the photographs: the paint, the shape of the cab, and
// what can be counted on the side that faces the camera. Neither
// photograph is a true side view (one is a front three-quarter, the
// other a motion-blurred side at distance), so the windows' spacing,
// the doors' places, the roof equipment, what hangs under the floor
// and every length are Trainsheet's reading of the type, not
// measurements. The cars are drawn at the 447 family's published car
// length, about 22.5 m.
//
//   CAF 447 (FE-07/FE-10), the only fleet: the Buenavista photograph
//     ("Ferrocarril Suburbano de la Zona Metropolitana del Valle de
//     México estación Buenavista.jpg",
//     https://commons.wikimedia.org/wiki/File:Ferrocarril_Suburbano_de_la_Zona_Metropolitana_del_Valle_de_M%C3%A9xico_estaci%C3%B3n_Buenavista.jpg)
//     shows unit M1.0102: a white body, a red band along the roof,
//     a black swoosh sweeping down the cab's side, a red lower front
//     with a black band across it at the windshield's base, the red
//     "S" roundel in a white square on the front face, a big
//     windshield with two wipers, a destination display above it,
//     twin round headlamps in a black housing above the display,
//     the red CAF mark, red doors, a dark window band and a grey
//     roof box. The Tlalnepantla photograph ("Suburbano
//     tlalnepantla.jpg",
//     https://commons.wikimedia.org/wiki/File:Suburbano_tlalnepantla.jpg)
//     shows a northbound set from the side: the black swoosh
//     descending from the roof toward the rear of each car, red
//     doors, a dark window band, a black skirt. Drawn as a
//     three-car unit, cab + intermediate + cab: the FE-07's own
//     formation (sets couple in service; the timetable names no
//     stock, so the three-car set is a judgement).
//
// Not drawn: the AIFA branch's CAF CIVIA 465 sets
// ("suburbano-aifa-civia.jpg" in the photo manifest) — no AIFA
// trains run in this build, so no model is assigned to them.
//
// The timetable names no rolling stock, so the fleet-to-train
// assignment is a judgement, labeled as typical; see TYPICAL below.

import { rect, path, truck, underframe, win } from "../carart.js?v=dev";
import { unit, hvac } from "./czechia.cars.js?v=dev";

const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 2, depth = 1.0) => underframe(a, b, top, { depth, boxes: k, tanks: false });
// Window x positions filling the gaps between doors from lo to hi, at
// pitch, skipping any that would hit a door.
const gapWins = (doors, doorW, lo, hi, pitch = 3.4) => {
  const xs = [];
  for (let x = lo; x + 2.6 <= hi; x += pitch) {
    if (doors.some((d) => x + 2.6 > d - 0.7 && x < d + doorW + 0.7)) continue;
    xs.push(Math.round(x * 10) / 10);
  }
  return xs;
};
const winRow = (xs) => ({ xs, y: 7.6, w: 2.6, h: 2.8, r: 0.3 });
const emuDoor = (x, fill, w = 3.2) => ({ x, w, y0: 3.6, y1: 10.8, leaves: 2, glassY: 0.45, glassH: 0.4, grabs: true, fill });
// Three doors a side; cab cars put the first door behind the cab.
const D3 = [8, 31, 54], D3CAB = [13, 33, 53];
const G = { roof: 13.0, sill: 3.6 };

// ---------- CAF 447 (FE-07/FE-10) ----------
// White with a red band along the roof, a black swoosh sweeping down
// the side from the cab toward the rear, red doors, a dark window
// band and a black skirt. The cab's front is red below with a black
// band across it at the windshield's base; the swoosh's exact curve
// is a reading.
const FE = { white: "#f2f3f4", red: "#e02318", black: "#1d2024", roof: "#b9bec4", skirt: "#26292e" };
const NOSE_FE = [[1.0, 3.6], [0.8, 8.5], [1.3, 12.2], ["q", 1.5, 13.0, 3.0, 13.0]];
// The swoosh: a black diagonal band, high at the car's front end and
// low at its rear, as in the Tlalnepantla side view.
const swoosh = () => path("M2 12.9L10 12.9L36 3.6L28 3.6Z", FE.black);
function fePaint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, FE.white], [12.3, 3, FE.red], [0, 3.6, FE.skirt]]) + swoosh();
    if (cab) s += rect(-1, 0, 11, 5.6, FE.red) + rect(-1, 5.6, 11, 0.9, FE.black);
    return s;
  };
}
const feCab = (c) => unit(c, { roof: G.roof, sill: G.sill, nose: NOSE_FE, rake: [[1.3, 8.5], [2.8, 12.2]], depth: 2.6, cabLen: 10, lampY: 5.35,
  rows: [winRow(gapWins(D3CAB, 3.2, 13, 70.5))], doors: D3CAB.map((x) => emuDoor(x, FE.red)),
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: fePaint(true), surround: "#1d2026",
  cab: () => win(7.0, 8.6, 2.4, 2.6, 0.25),
  extra: (cc, g) => hvac(14, G.roof, 12, 0.5) + boxes(16, g.L - 16, G.sill, 3, 1.2) });
const feMid = (c) => unit(c, { roof: G.roof, sill: G.sill,
  rows: [winRow(gapWins(D3, 3.2, 5.5, 70.5))], doors: D3.map((x) => emuDoor(x, FE.red)),
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: fePaint(false),
  pan: c.index === 1 ? c.L / 2 - 6 : null,
  extra: (cc, g) => hvac(10, G.roof, 12, 0.5) + hvac(g.L - 24, G.roof, 12, 0.5) + boxes(16, g.L - 16, G.sill, 3, 1.2) });

// ---------- Tables ----------

export const TYPES = {
  suburbanoFE07Cab: { name: "CAF 447 (FE-07/FE-10) end car", kind: "emu" },
  suburbanoFE07Mid: { name: "CAF 447 (FE-07/FE-10) intermediate car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers: the 447 cars about 22.5 m.
export const MODELS = {
  suburbanoFE07Cab: M(feCab, 73.8, true),
  suburbanoFE07Mid: M(feMid, 73.8, false, byIndex),
};

const set = (label, ...units) => ({ label, units });
const FE07_SET = set("Typical: a three-car CAF 447 (FE-07/FE-10) unit (a judgement: the timetable names no stock; the three-car unit is the FE-07's own formation)",
  ["suburbanoFE07Cab", 1], ["suburbanoFE07Mid", 1], ["suburbanoFE07Cab", 1]);

// The timetable (the CDMX open-data GTFS, repaired) names no rolling
// stock, so every run is the one fleet: the CAF 447 unit.
export const TYPICAL = {
  suburbano: (t = {}) => FE07_SET,
};

// Sources: the photographs each drawing was checked against
// (Wikimedia Commons). Builders are the commonly published ones.
const CM = "https://commons.wikimedia.org/wiki/File:";
const fFE07 = { model: "CAF 447 (FE-07/FE-10)", type: "Electric multiple unit", builder: "CAF",
  source: `${CM}Ferrocarril_Suburbano_de_la_Zona_Metropolitana_del_Valle_de_M%C3%A9xico_estaci%C3%B3n_Buenavista.jpg` };
export const FACTS = {
  suburbanoFE07Cab: { ...fFE07,
    about: "An end car of a CAF 447 (FE-07/FE-10) unit, Tren Suburbano's only fleet: white with a red band along the roof, a black swoosh sweeping down the side, a red lower front with a black band across it at the windshield's base and the red \"S\" roundel on the front face, red doors. The unit photographed at Buenavista is M1.0102; the swoosh's exact curve is a reading." },
  suburbanoFE07Mid: { ...fFE07,
    about: "An intermediate car of a CAF 447 (FE-07/FE-10) unit, white with the red roof band, the black swoosh and red doors, carrying the pantograph. The Tlalnepantla photograph shows the swoosh and doors from the side." },
};
