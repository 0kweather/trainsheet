// El Insurgente's cars (scripts/railroads/mexico.py, agency
// "insurgente"): the Zinacantepec–Observatorio interurban trains —
// CAF Civity 5-car EMUs. Trainsheet's own side views at the shared
// scale (js/carart.js), drawn from, and checked against, two
// photographs on Wikimedia Commons, named here fleet by fleet. The
// lettering is drawn here (no logo files).
//
// What is from the photographs: the paint, the shape of the cab, and
// what can be counted on the side that faces the camera. Neither
// photograph is a true side view (one is a front three-quarter, the
// other a distant elevated side), so the windows' spacing, the doors'
// places, the roof equipment, what hangs under the floor and every
// length are Trainsheet's reading of the type, not measurements. The
// cars are drawn at about 21 m each, the 5-car set's published
// length.
//
//   CAF Civity, the only fleet: the Lerma photograph ("Tren
//     México-Toluca El Insurgente - 11.jpg",
//     https://commons.wikimedia.org/wiki/File:Tren_M%C3%A9xico-Toluca_El_Insurgente_-_11.jpg)
//     shows set T019 from the front: a black glossy upper front with
//     the orange LED destination "EL INSURGENTE", a round headlamp
//     set in the black panel above the display, a big raked
//     windshield, red nose sides, "T019 A1" on the front, the
//     pantograph on the roof, a green side at the cab's edge. The
//     Santa Fe photograph ("Estación Santa Fe del Tren El
//     Insurgente 2.jpg",
//     https://commons.wikimedia.org/wiki/File:Estaci%C3%B3n_Santa_Fe_del_Tren_El_Insurgente_2.jpg)
//     shows a full 5-car set from the side: a white body, a red
//     stripe along the roofline, a dark window band, a green stripe
//     along the lower body, grey roof boxes, and the leading end's
//     red nose with a green wedge. Drawn as a five-car set, cab +
//     three intermediates + cab.
//
// Not drawn: the AIFA branch's Civity-family sets are the same
// vehicles in a different service; no AIFA trains run in this
// build, and the Insurgente sets are drawn in Insurgente service.
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
// Two doors a side; cab cars put the first door behind the cab.
const D2 = [12, 46], D2CAB = [17, 46];
const G = { roof: 13.0, sill: 3.6 };

// ---------- CAF Civity ----------
// White with a red stripe along the roofline, a dark window band, a
// green stripe along the lower body and a black skirt; the cab end's
// nose is red with a green wedge on its side. The green wedge's exact
// shape is a reading.
const CIV = { white: "#f2f3f4", red: "#d21f26", green: "#006847", dark: "#1f2428", roof: "#b9bec4", skirt: "#26292e", door: "#2a2e33" };
const NOSE_CIV = [[1.5, 3.6], [0.8, 5.0], ["q", 0.6, 7.0, 2.2, 8.0], [8.0, 12.2], ["q", 9.2, 13.0, 11.0, 13.0]];
function civityPaint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, CIV.white], [12.3, 3, CIV.red], [5.0, 1.2, CIV.green], [0, 3.6, CIV.skirt]]);
    if (cab) s += rect(-1, 3.6, 12, 9.4, CIV.red) + path("M-1 12.8L7 12.8L0 3.6L-1 3.6Z", CIV.green);
    return s;
  };
}
const civityCab = (c) => unit(c, { roof: G.roof, sill: G.sill, nose: NOSE_CIV, rake: [[2.2, 8.0], [8.0, 12.2]], depth: 3.2, cabLen: 14, lampY: 5.35,
  rows: [winRow(gapWins(D2CAB, 3.2, 17, 65.5))], doors: D2CAB.map((x) => emuDoor(x, CIV.door)),
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: civityPaint(true), surround: "#14171b",
  cab: () => win(11.5, 8.6, 2.2, 2.6, 0.25),
  extra: (cc, g) => hvac(18, G.roof, 12, 0.5) + boxes(20, g.L - 20, G.sill, 3, 1.2) });
const civityMid = (c) => unit(c, { roof: G.roof, sill: G.sill,
  rows: [winRow(gapWins(D2, 3.2, 5.5, 65.5))], doors: D2.map((x) => emuDoor(x, CIV.door)),
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: civityPaint(false),
  pan: c.index === 2 ? c.L / 2 - 6 : null,
  extra: (cc, g) => hvac(10, G.roof, 12, 0.5) + hvac(g.L - 24, G.roof, 12, 0.5) + boxes(16, g.L - 16, G.sill, 3, 1.2) });

// ---------- Tables ----------

export const TYPES = {
  insurgenteCivityCab: { name: "CAF Civity end car", kind: "emu" },
  insurgenteCivityMid: { name: "CAF Civity intermediate car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers: the Civity cars about 21 m.
export const MODELS = {
  insurgenteCivityCab: M(civityCab, 68.9, true),
  insurgenteCivityMid: M(civityMid, 68.9, false, byIndex),
};

const set = (label, ...units) => ({ label, units });
const CIVITY_SET = set("Typical: a five-car CAF Civity set (a judgement: the timetable names no stock; the five-car set is the Insurgente's own formation)",
  ["insurgenteCivityCab", 1], ["insurgenteCivityMid", 3], ["insurgenteCivityCab", 1]);

// The timetable (the CDMX open-data GTFS, repaired) names no rolling
// stock, so every run is the one fleet: the CAF Civity set.
export const TYPICAL = {
  insurgente: (t = {}) => CIVITY_SET,
};

// Sources: the photographs each drawing was checked against
// (Wikimedia Commons). Builders are the commonly published ones.
const CM = "https://commons.wikimedia.org/wiki/File:";
const fCivity = { model: "CAF Civity", type: "Electric multiple unit", builder: "CAF",
  source: `${CM}Tren_M%C3%A9xico-Toluca_El_Insurgente_-_11.jpg` };
export const FACTS = {
  insurgenteCivityCab: { ...fCivity,
    about: "An end car of a CAF Civity set, El Insurgente's only fleet: a black glossy upper front with the orange LED destination \"EL INSURGENTE\" and a round headlamp above it, a big raked windshield, red nose sides, and a white body with a red roofline stripe, a dark window band and a green stripe along the lower body. The set photographed at Lerma is T019; the green wedge on the nose is a reading from the Santa Fe side view." },
  insurgenteCivityMid: { ...fCivity,
    about: "An intermediate car of a CAF Civity set, white with the red roofline stripe, the dark window band and the green lower stripe, carrying the pantograph on the middle car. The Santa Fe photograph shows the full five-car set from the side." },
};
