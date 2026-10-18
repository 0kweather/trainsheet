// Trenes Argentinos' Buenos Aires trains (scripts/railroads/trenesba.py).
// SOFSE's arrivals name each service's unit ("M15" on the Mitre, "RC12" on
// the Sarmiento, "F134" on the Roca, "B950" on the San Martín, "1001" on the
// Belgrano Sur, "UTA3" on the Tren de la Costa), which
// js/railroads/trenesba.js passes as the train's one known car with its
// class; the rest is what that line runs. Drawn from each class's published
// dimensions; liveries simplified to Trenes Argentinos' white, sky blue and
// navy.

import { bilevel, newId } from "../carmodels.js?v=dev";
import { C, rect, path, poly, win, truck, pantograph, underframe, lines, slats } from "../carart.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
const TA = { white: "#eef0f2", sky: "#3d9ad6", navy: "#1f3a6e", band: "#24282d", roof: "#b4bac1", skirt: "#3a3f45" };
// White, a dark window band, a sky blue stripe under it and a navy skirt;
// on a cab, the navy rises to the windshield.
function taPaint(c, g, nose, { band = [6.9, 3.4], noseX = 0 } = {}) {
  const L = g.L;
  let s = rect(0, 0, L, 17, TA.white) + rect(0, g.roof - 0.8, L, 2, TA.roof) + rect(0, 0, L, 4.6, TA.navy) + rect(0, 5.0, L, 0.9, TA.sky) +
    rect(nose ? noseX + 6 : 0, band[0], L, band[1], TA.band, 0, 'rx="0.4"');
  if (nose) s += path(`M0 0L${noseX + 4} 0L${noseX + 4} 4.6Q${noseX + 1.6} 4.6 ${noseX + 1.0} 7.6L0 7.6Z`, TA.navy) +
    path(`M${noseX + 6.4} ${band[0]}L${noseX + 6.4} ${g.roof}L${noseX + 4.0} ${g.roof}Q${noseX + 2.0} ${band[0] + 2.6} ${noseX + 1.3} ${band[0] + 0.4}Z`, TA.band);
  return s;
}
const drivingCar = (spec, car) => (c) => bilevel({ ...c, cabL: true }, { ...spec(c), ...car, paint: (c, g) => taPaint(c, g, true, car.paintOpts) });
const middleCar = (spec, car) => (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...spec(c), nose: null, cab: null, ...car, paint: (c, g) => taPaint(c, g, false, car.paintOpts) });
const ROCA = (c) => c.route === "Roca";

// --- CSR Sifang EMUs (built at Qingdao, 2013-16): the Mitre's six-car and
// the Sarmiento's nine-car trains on 800 V third rail, the Roca's seven-car
// trains under 25 kV catenary. Control cars 22.67 m, the others 21.8 m;
// three double doors a side; 120 km/h. Third-rail shoes on the Mitre and
// Sarmiento cars, pantographs on the Roca's.
const CSR = (c) => ({ roof: 12.4, sill: 3.8, cornerR: 1.0, end: 0.6, trucks: { centers: 51.0, wb: 8.2, d: 34, shoe: !ROCA(c) }, diaphragm: [4.0, 11.4], badge: false,
  nose: [[1.4, 3.8], [0.9, 4.9], ["q", 0.8, 6.6, 1.4, 7.5], [3.4, 11.4], ["q", 4.1, 12.4, 5.8, 12.4]], cabLen: 6,
  cab: () => path(poly([[1.7, 7.7], [3.6, 11.0], [4.9, 11.0], [4.9, 7.7]]), C.glass) + win(5.8, 7.6, 1.4, 2.6, 0.3) });
const csrDoor = (x) => ({ x, w: 4.3, y0: 3.9, y1: 10.6, leaves: 2, glassY: 0.42, glassH: 0.42 });
const csrRows = (xs) => [{ xs, y: 7.05, w: 3.9, h: 3.0, r: 0.35 }];
const csrCar = drivingCar(CSR, { rows: csrRows([7.2, ...seq(18.6, 4.6, 4), ...seq(42.6, 4.6, 4), 67.6]), doors: [csrDoor(13.0), csrDoor(37.0), csrDoor(61.0)],
  roofItems: [[22, 12, 0.5]] });
const csrMid = middleCar(CSR, { rows: csrRows([2.4, ...seq(14.0, 4.8, 4), ...seq(39.2, 4.8, 4), 65.4]), doors: [csrDoor(8.5), csrDoor(33.6), csrDoor(58.7)],
  roofItems: [[20, 12, 0.5]], extra: (c, g) => (ROCA(c) && c.pan ? pantograph(g.L - 12, 12.4, { facing: -1 }) : "") });

// --- CNR (Tangshan) DMUs, the Belgrano Sur's (27 three-car units from
// 1001, 2014-15): two driving motor cars and a trailer, a raked nose, two
// double doors a side; engines under the motor cars; 100 km/h.
const CNR = () => ({ roof: 12.8, sill: 3.8, cornerR: 1.0, end: 0.6, trucks: { centers: 52.0, wb: 8.2, d: 33 }, diaphragm: [4.0, 11.8], badge: false,
  nose: [[1.8, 3.8], [1.1, 4.9], ["q", 0.9, 6.4, 1.6, 7.3], [4.6, 11.8], ["q", 5.4, 12.8, 7.2, 12.8]], cabLen: 7,
  cab: () => path(poly([[2.0, 7.6], [4.8, 11.4], [6.2, 11.4], [6.2, 7.6]]), C.glass) + win(7.0, 7.6, 1.5, 2.6, 0.3) });
const cnrDoor = (x) => ({ x, w: 4.3, y0: 3.9, y1: 10.8, leaves: 2, glassY: 0.42, glassH: 0.42 });
const cnrCar = drivingCar(CNR, { rows: [{ xs: [9.0, ...seq(24.0, 4.9, 6), 60.4, 65.3], y: 7.1, w: 4.1, h: 3.0, r: 0.35 }], doors: [cnrDoor(15.6), cnrDoor(54.4)],
  roofItems: [[30, 8, 0.7]], extra: () => underframe(24, 50, 3.8, { depth: 1.7, boxes: 3 }) });
const cnrMid = middleCar(CNR, { rows: [{ xs: [2.4, 7.4, ...seq(21.0, 4.9, 6), 57.8, 62.8, 67.8], y: 7.1, w: 4.1, h: 3.0, r: 0.35 }], doors: [cnrDoor(13.6), cnrDoor(52.0)],
  roofItems: [[30, 14, 0.5]] });

// --- CSR Qishuyan SDD7 locomotives (the San Martín's whole fleet of 24,
// 2013-14): Co-Co diesel-electric hood units, a cab at the front over a
// short hood and the long hood behind; 1,678 kW, 120 km/h. With CSR
// coaches (160 bought with them), push-pull: seats for 78 in each, two
// double doors a side for the high platforms.
function sdd7(c) {
  const L = c.L, sill = 4.4, hood = 12.6, cabTop = 14.3, cab0 = 4.6, cab1 = 13.2;
  let s = truck(L / 2 - 18.5, { wb: 12.4, d: 40, kind: "loco", top: sill, axles: 3 }) + truck(L / 2 + 18.5, { wb: 12.4, d: 40, kind: "loco", top: sill, axles: 3 });
  s += path(poly([[L / 2 - 10, sill], [L / 2 + 10, sill], [L / 2 + 10, 2.4], ["q", L / 2 + 10, 1.6, L / 2 + 9.2, 1.6], [L / 2 - 9.2, 1.6], ["q", L / 2 - 10, 1.6, L / 2 - 10, 2.4]]), "currentColor", 0, 'opacity="0.82"');
  s += rect(0.4, 2.2, L - 0.8, sill - 2.2 + 0.6, "currentColor", 0, 'opacity="0.9"') + rect(0.4, sill + 0.6, L - 0.8, 0.35, "#f4f4f4");
  const body = poly([[1.2, sill + 0.95], [L - 1.2, sill + 0.95], [L - 1.2, hood - 0.6], ["q", L - 1.2, hood, L - 1.8, hood], [cab1, hood], [cab1, cabTop - 0.6],
    ["q", cab1, cabTop, cab1 - 0.6, cabTop], [cab0 + 0.9, cabTop], ["q", cab0 + 0.4, cabTop, cab0 + 0.3, cabTop - 0.6], [cab0, 10.4], [1.8, 10.2], ["q", 1.2, 10.2, 1.2, 9.6]]);
  const id = newId();
  s += path(body, TA.white) + `<clipPath id="${id}"><path d="${body}"/></clipPath><g clip-path="url(#${id})">` +
    rect(0, 0, L, 7.4, TA.navy) + rect(0, 7.4, L, 0.9, TA.sky) + "</g>";
  s += path(poly([[cab0 + 0.3, 10.8], [cab0 + 0.7, 13.6], [cab0 + 1.6, 13.6], [cab0 + 1.6, 10.8]]), C.glass) + win(cab0 + 2.6, 10.9, 2.6, 2.3, 0.3) + win(cab0 + 5.8, 10.9, 2.2, 2.3, 0.3);
  s += slats(cab1 + 4, 8.8, 12, 2.6, 0.35, "rgba(0,0,0,0.3)") + slats(L - 18, 8.8, 14, 2.8, 0.35, "rgba(0,0,0,0.3)");
  for (const x of [cab1 + 19, cab1 + 26]) s += rect(x, sill + 1.8, 5.6, 4.4, "none", 0.45, 'rx="0.15"');
  for (const x of [L - 16, L - 9]) s += path(`M${x} ${hood}Q${x + 2} ${hood + 0.7} ${x + 4} ${hood}Z`, C.steelDark, 0.4);
  s += lines([[2.0, 8.2, cab0, 8.2], [cab1 + 0.5, 8.0, L - 1.6, 8.0]], "currentColor", 0.5);
  return s + path(body, "none", 0.8);
}
const COACH = () => ({ roof: 12.6, sill: 3.8, cornerR: 1.0, end: 0.6, trucks: { centers: 56.0, wb: 8.2, d: 33 }, diaphragm: [4.0, 11.6], badge: false,
  doors: [{ x: 13.0, w: 4.3, y0: 3.9, y1: 10.8, leaves: 2, glassY: 0.42, glassH: 0.42 }, { x: 62.7, w: 4.3, y0: 3.9, y1: 10.8, leaves: 2, glassY: 0.42, glassH: 0.42 }],
  rows: [{ xs: [2.4, 7.4, ...seq(19.2, 5.0, 8), 68.8, 73.8], y: 7.1, w: 4.0, h: 3.0, r: 0.35 }], roofItems: [[34, 12, 0.5]] });
const csrCoach = (c) => bilevel(c, { ...COACH(), paint: (c, g) => taPaint(c, g, false) });

// --- Tren de la Costa (Maipú-Delta, 1995): nine two-car articulated units
// built by CAF, derived from the second series of Valencia's FGV 3700;
// 1,500 V overhead, standard gauge. Each half on its own motor truck at the
// cab, the two sharing a truck at the joint; one double door a side on each
// half. A pantograph on one half.
const CAF = () => ({ roof: 12.2, sill: 3.4, cornerR: 1.0, end: 0.6, noTrucks: true, diaphragm: [3.6, 11.2], badge: false,
  nose: [[0.9, 3.4], [0.7, 4.5], [0.7, 9.6], ["q", 0.8, 11.2, 1.8, 11.9], ["q", 2.4, 12.2, 3.4, 12.2]], cabLen: 4,
  cab: () => win(0.9, 7.2, 2.2, 3.4, 0.3) });
const cafCar = drivingCar(CAF, { rows: [{ xs: [5.0, 9.6, 26.0, 30.6, 35.2, 39.8], y: 6.9, w: 3.8, h: 3.0, r: 0.35 }], doors: [{ x: 16.4, w: 4.3, y0: 3.5, y1: 10.4, leaves: 2, glassY: 0.42, glassH: 0.42 }],
  roofItems: [[30, 8, 0.5]], paintOpts: { band: [6.7, 3.4], noseX: -2 },
  extra: (c, g) => truck(9.0, { wb: 7.2, d: 30, top: 3.4 }) + truck(g.L, { wb: 7.2, d: 30, top: 3.4 }) + (c.mirrored ? "" : pantograph(g.L - 13, 12.2, { facing: -1 })) });

export const TYPES = {
  csrCar: { name: "CSR control car", kind: "emu" },
  csrMid: { name: "CSR car", kind: "emu", pan: true },
  cnrCar: { name: "CNR DMU driving car", kind: "emu" },
  cnrMid: { name: "CNR DMU trailer", kind: "emu" },
  sdd7: { name: "CSR SDD7 locomotive", kind: "diesel" },
  csrCoach: { name: "CSR coach", kind: "coach" },
  cafCar: { name: "CAF articulated car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  csrCar: M(csrCar, 74.4, true, (c) => (ROCA(c) ? "ac" : "")), csrMid: M(csrMid, 71.5, false, (c) => (ROCA(c) ? "ac" : "")),
  cnrCar: M(cnrCar, 75.5, true), cnrMid: M(cnrMid, 75.5),
  sdd7: M(sdd7, 68.9), csrCoach: M(csrCoach, 80.4),
  cafCar: M(cafCar, 49.0, true),
};
// The Belgrano Sur's DMUs are the only units named by plain numbers.
export const FLEETS = { trenesba: [[1001, 1027, "cnrCar"]] };

const csr = (n) => ({ label: `${n}-car CSR electric train`, units: [["csrCar", 1], ["csrMid", n - 2], ["csrCar", 1]] });
const CSR_CARS = { Mitre: 6, Sarmiento: 9, Roca: 7 };
const BY_CLASS = {
  sdd7: { label: "CSR SDD7 locomotive with CSR coaches", units: [["sdd7", 1], ["csrCoach", 7]] },
  cnrCar: { label: "CNR three-car DMU, often two coupled (some trains locomotive-hauled)", units: [["cnrCar", 1], ["cnrMid", 1], ["cnrCar", 1]] },
  cafCar: { label: "CAF two-car articulated unit", units: [["cafCar", 2]] },
};
const BY_LINE = { "San Martín": "sdd7", "Belgrano Sur": "cnrCar", "Tren de la Costa": "cafCar" };
export const TYPICAL = {
  // The unit the feed names decides; else the line.
  trenesba: (t, reported) => {
    const k = reported || BY_LINE[t.route] || (CSR_CARS[t.route] ? "csrCar" : null);
    if (k === "csrCar") return csr(CSR_CARS[t.route] || 6);
    return BY_CLASS[k] || null;
  },
};

const WIKI = "https://en.wikipedia.org/wiki/";
const CSR_FACTS = { model: "CSR EMU", type: "Electric multiple unit", builder: "CSR Sifang (Qingdao, China)", built: "2013–2016",
  fleet: "Over 700 cars", topSpeedMph: 74.6, seats: 72, lengthFt: 71.5,
  about: "The Chinese-built trains that replaced the old Japanese fleets on Buenos Aires' electric lines from 2014: six cars on the Mitre, nine on the Sarmiento, seven on the Roca. The Mitre and Sarmiento cars take 800 V from a third rail; the Roca's run under 25 kV wires and have stronger motors.",
  source: `${WIKI}CSR_EMU_(Argentina)` };
const CNR_FACTS = { model: "CNR DMU", type: "Diesel multiple unit", builder: "CNR Corporation", built: "2014–2015", fleet: "27 three-car units (from 1001)",
  topSpeedMph: 62,
  about: "Three-car diesel trains, two driving motor cars with a trailer between, bought in 2013 for the Belgrano Sur, Buenos Aires' metre-gauge line to González Catán and Marcos Paz. Its older locomotive-hauled sets still run some trains.",
  source: `${WIKI}CNR_diesel_multiple_unit` };
const SDD7_FACTS = { model: "CSR SDD7", type: "Diesel-electric locomotive", builder: "CSR Qishuyan", built: "2013–2014", fleet: "24", topSpeedMph: 74.6, powerHp: 2250,
  about: "Chinese Co-Co locomotives that arrived with 160 new coaches to renew the whole San Martín line, from Retiro to Pilar and Cabred, in 2014.",
  source: `${WIKI}CSR_SDD7` };
const COACH_FACTS = { model: "CSR coach", type: "Passenger coach", builder: "CSR", built: "2013–2014", fleet: "160", seats: 78,
  about: "The San Martín's locomotive-hauled coaches, bought from China with the SDD7s. Their high floors meant the platforms from Retiro to Pilar were rebuilt.",
  source: "https://es.wikipedia.org/wiki/L%C3%ADnea_San_Mart%C3%ADn" };
const CAF_FACTS = { model: "CAF Tren de la Costa unit", type: "Electric multiple unit", builder: "CAF", built: "1990s", fleet: "9 two-car units",
  about: "Two-car articulated trains derived from Valencia's FGV 3700 series, built for the Tren de la Costa when it opened in 1995 along the old Bartolomé Mitre branch by the River Plate.",
  source: `${WIKI}Tren_de_la_Costa` };
export const FACTS = {
  csrCar: CSR_FACTS, csrMid: CSR_FACTS, cnrCar: CNR_FACTS, cnrMid: CNR_FACTS,
  sdd7: SDD7_FACTS, csrCoach: COACH_FACTS, cafCar: CAF_FACTS,
};
