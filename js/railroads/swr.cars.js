// South Western Railway's cars (scripts/railroads/gb.py, "swr"): the trains
// out of London Waterloo to Surrey, Hampshire, Dorset and the West of
// England. Three fleets: the Siemens Class 450 Desiro, the four-car
// third-rail train of most outer-suburban and stopping main-line services;
// its long-distance sister the five-car Class 444, to Portsmouth, Poole and
// Weymouth; and the Alstom Class 701 Arterio (an Aventra), the ten- and
// five-car train of the inner-suburban lines to Windsor, Reading and round
// the loops. The timetable names no unit, so a train is drawn as the fleet
// that usually runs it, labeled as typical. Trainsheet's own side views from
// published dimensions, at the shared scale (js/carart.js), in South
// Western Railway's gray and navy, lettered here (no logo files). The
// toolkit from avanti.cars.js; the Desiro is drawn here with the 444's and
// 450's gangwayed front (emr.cars.js does not export its 360) and the
// Aventra redrawn in this paint (greateranglia.cars.js and c2c.cars.js do
// not export their 720s). The Class 158 and 159 diesels of the Salisbury
// and Exeter line are not drawn.

import { rect, path } from "../carart.js?v=dev";
import { bands, boxes, ft, spread, yellowEnd, fairing, unit, letters, hvac } from "./avanti.cars.js?v=dev";

// ---------- Paint ----------
// South Western Railway since 2017, drawn from memory and not checked
// against photographs: slate gray sides with no window band, a darker roof
// and a charcoal skirt; a navy band along the foot of the side with a fine
// yellow line over it; behind each cab the navy rises to the roof and ends
// in three slanted pale gray stripes; doors pale gray; the name in white
// under the windows; the front yellow round a black windshield mask. The
// navy is the railroad's color (#24398c).
const SW = { gray: "#5b6470", navy: "#24398c", deep: "#1b2c6e", pale: "#c5cad1", yellow: "#f2c400", white: "#f4f5f6", band: "#1d2026", skirt: "#2e3136", roof: "#454b53", trim: "#8c9299", silver: "#c9cdd2" };

// The name, centered on x; reads left to right on a mirrored car too.
const name = (c, x, y) => letters(c, x, y, 0.82, "South Western Railway", SW.white, { weight: 600, spacing: "0.02em" });
// The class, small on the skirt at the inner end of a driving car.
const classNo = (c, x, y, text) => letters(c, x, y, 0.36, text, SW.silver, { weight: 600, spacing: "0.06em" });
// The side: gray, the navy band and its yellow line along the foot.
const side = (roof, sill, more = "") => (c, g) => bands(g.L, [[0, 20, SW.gray], [roof - 0.6, 3, SW.roof], [sill, 0.9, SW.navy], [sill + 0.9, 0.2, SW.yellow], [0, sill, SW.skirt]]) + more;
// A slanted stripe from the band to the roof line, its foot at x.
const slant = (x, w, sill, roof, fill) => path(`M${x} ${sill + 1.1}L${x + w} ${sill + 1.1}L${x + w + 2.6} ${roof - 0.6}L${x + 2.6} ${roof - 0.6}Z`, fill);
// The cab end: navy from the front back to x, then three pale stripes.
const cabEnd = (x, sill, roof) => path(`M-1 ${sill}L${x} ${sill}L${x + 2.6} ${roof - 0.6}L-1 ${roof - 0.6}Z`, SW.navy) +
  slant(x + 0.7, 0.7, sill, roof, SW.pale) + slant(x + 2.0, 0.5, sill, roof, SW.pale) + slant(x + 3.1, 0.3, sill, roof, SW.pale);
// A First saloon: Trainsheet's fine line over its windows, from a to b.
const firstLine = (a, b, y) => rect(a, y, b - a, 0.18, SW.yellow);
// A third-rail shoe beam, hung between a truck's axleboxes.
const shoe = (x) => rect(x - 2.3, 0.95, 4.6, 0.3, "#3b3f45", 0.3) + rect(x - 0.7, 0.5, 1.4, 0.45, "#6a4a2a", 0.3);

// ---------- Siemens Desiro: Class 450 and Class 444 ----------
// Built by Siemens in Vienna and Krefeld, 2002-2006, for South West Trains:
// aluminium cars 2.796 m wide on SGP SF5000 trucks with 850 mm wheels, the
// floor 1.157 m over the rail, 100 mph, 1,500 kW a unit; 750 V DC from the
// third rail, the shoes on the driving cars' trucks; a flat cab front with
// a gangway door, so that coupled units can be walked through. The Class
// 450: four cars of 20.34 m (81.60 m a unit), two double-leaf sliding plug
// doors a side at the thirds of each car. The Class 444: five cars of
// 23.57 m (about 119 m), one single-leaf plug door a side at each end of
// the car, long rows of windows between them; one trailer has a roof well
// for a pantograph, never fitted. (Wikipedia, "British Rail Class 450" and
// "British Rail Class 444"; the infoboxes give no height, taken as 3.74 m
// from memory.)
const DS = { roof: ft(3.74), sill: 3.8, car450: ft(20.34), car444: ft(23.57) };
const NOSE_DES = [[0.4, 3.2], [0.3, 6.6], ["q", 0.3, 7.5, 0.8, 8.2], [2.0, DS.roof - 0.8], ["q", 2.4, DS.roof, 3.8, DS.roof]];
const TOP = 10.9;
const dbl = (x, sill = DS.sill, w = 4.3) => ({ x, w, y0: sill, y1: TOP, leaves: 2, glassY: 0.48, glassH: 0.36, grabs: false, fill: SW.pale });
const sgl = (x) => ({ x, w: 3.0, y0: DS.sill, y1: TOP, leaves: 1, glassY: 0.48, glassH: 0.36, grabs: false, fill: SW.pale });
const row = (xs, w) => [{ xs, y: 7.0, w, h: 2.8, r: 0.4 }];
// S: 450 (doors at the thirds) or 444 (a door at each end). The doors and
// the windows of a car whose saloon runs from a to b.
function layout(S, a, b, L) {
  if (S === 444) { const d1 = a, d2 = L - 5.2;
    return { doors: [sgl(d1), sgl(d2)], rows: row(spread(d1 + 4.0, d2 - 1.0, 4.6, 5.5), 4.6), mid: L / 2 }; }
  const d1 = a + 8.0, d2 = L - 19.4;
  return { doors: [dbl(d1), dbl(d2)], rows: row([...spread(a, d1 - 0.8, 4.2, 5.0), ...spread(d1 + 5.1, d2 - 0.8, 4.2, 5.0), ...spread(d2 + 5.1, b, 4.2, 5.0)], 4.2), mid: (d1 + 4.3 + d2) / 2 };
}
// o.first: the First saloon behind the cab.
function desCab(c, S, o = {}) {
  const L = c.L, lay = layout(S, S === 444 ? 8.4 : 9.0, L - 1.6, L);
  return unit(c, { roof: DS.roof, sill: DS.sill, nose: NOSE_DES, rake: [[0.9, 8.4], [1.9, DS.roof - 1.1]], depth: 2.0, cabLen: 7, lampY: 5.0, low: 4.1,
    rows: lay.rows, doors: lay.doors, trucks: [9.8, L - 9.2], wheel: 33, diaphragm: [4.1, 11.2],
    // The front yellow from the skirt to the roof, round the windshield's mask.
    paint: side(DS.roof, DS.sill, cabEnd(S === 444 ? 4.6 : 5.6, DS.sill, DS.roof) + yellowEnd(2.6, 3.2, DS.roof - 0.6) + path(`M0.7 8.2L2.0 ${DS.roof - 0.8}L4.4 ${DS.roof - 0.8}L4.4 8.2Z`, SW.band)), surround: SW.band,
    extra: (cc, g) => fairing(3.8, g.L - 1.0, DS.roof, SW.trim) + hvac(g.L / 2 - 6, DS.roof + 0.27, 12, 0.55) + boxes(15, g.L - 14, DS.sill, 3, 1.3) +
      shoe(9.8) + shoe(g.L - 9.2) +
      // The cab's side window.
      rect(3.4, 8.3, 1.7, 2.1, "#1d2026", 0.4) +
      (o.first ? firstLine(S === 444 ? 12.4 : 9.0, lay.mid, 10.15) : "") +
      name(cc, lay.mid + (S === 444 ? 3 : 0), 5.9) + classNo(cc, g.L - 8, 3.1, String(S)) });
}
// o.well: the trailer whose roof is cut down at one end for a pantograph
// (none fitted).
function desMid(c, S, o = {}) {
  const L = c.L, lay = layout(S, S === 444 ? 2.2 : 1.6, L - 1.6, L);
  return unit(c, { roof: DS.roof, sill: DS.sill,
    rows: lay.rows, doors: lay.doors, trucks: [9.2, L - 9.2], wheel: 33, diaphragm: [4.1, 11.2],
    paint: side(DS.roof, DS.sill),
    extra: (cc, g) => (o.well ? fairing(21, g.L - 1.0, DS.roof, SW.trim) + rect(3.0, DS.roof - 0.42, 17.0, 0.45, "#6f757b", 0.4) + hvac(g.L - 24, DS.roof + 0.27, 12, 0.55)
      : fairing(1.0, g.L - 1.0, DS.roof, SW.trim) + hvac(g.L / 2 - 6, DS.roof + 0.27, 12, 0.55)) +
      boxes(15, g.L - 15, DS.sill, 2, 1.5) + name(cc, lay.mid, 5.9) });
}

// ---------- Alstom Aventra: Class 701 Arterio ----------
// Built at Derby by Bombardier, then Alstom, 2019-2024, in service since
// 2024: 60 ten-car units (701/0, 4,000 kW, 556 seats) and 30 five-car ones
// (701/5, 2,000 kW, 274 seats); 750 V DC from the third rail, on Flexx
// B5000 trucks, 100 mph; two double-leaf sliding plug doors a side at the
// thirds of each car, wide gangways between the cars, and a closed,
// lightly raked cab front with no door through it. (Wikipedia, "British
// Rail Class 701". Its infobox gives no car dimensions: the cars are taken
// as 20.4 m, a ten-car unit being about 204 m, and 3.76 m tall, from
// memory.)
const AV = { roof: ft(3.76), sill: 3.7, car: ft(20.4) };
const NOSE_701 = [[0.5, 3.1], [0.35, 6.3], ["q", 0.4, 7.3, 1.1, 8.1], [3.4, 11.4], ["q", 4.0, AV.roof, 5.8, AV.roof]];
const avLay = (a, b, L) => { const d1 = a + 9.6, d2 = L - 19.6;
  return { doors: [dbl(d1, AV.sill, 4.6), dbl(d2, AV.sill, 4.6)], rows: [{ xs: [...spread(a, d1 - 0.8, 4.6, 5.4), ...spread(d1 + 5.4, d2 - 0.8, 4.6, 5.4), ...spread(d2 + 5.4, b, 4.6, 5.4)], y: 6.9, w: 4.6, h: 2.9, r: 0.45 }], mid: (d1 + 4.6 + d2) / 2 }; };
function avCab(c, text) {
  const L = c.L, lay = avLay(9.4, L - 1.6, L);
  return unit(c, { roof: AV.roof, sill: AV.sill, nose: NOSE_701, rake: [[1.3, 8.2], [3.2, 11.1]], depth: 2.6, cabLen: 8, lampY: 4.9, low: 4.0,
    rows: lay.rows, doors: lay.doors, trucks: [10.2, L - 9.2], wheel: 33, diaphragm: [4.0, 11.3],
    paint: side(AV.roof, AV.sill, cabEnd(6.4, AV.sill, AV.roof) + yellowEnd(3.0, 3.1, 7.6) + path("M1.0 7.9L3.4 11.4L7.0 11.4L7.0 7.9Z", SW.band)), surround: SW.band,
    extra: (cc, g) => fairing(5.8, g.L - 1.0, AV.roof, SW.trim) + hvac(g.L / 2 - 6, AV.roof + 0.27, 12, 0.5) + boxes(15, g.L - 14, AV.sill, 3, 1.3) +
      shoe(10.2) + shoe(g.L - 9.2) +
      // The cab's side window and door.
      rect(4.4, 8.0, 1.8, 2.3, "#1d2026", 0.4) + rect(6.7, 4.0, 1.9, 6.9, "rgba(0,0,0,0.14)", 0.5) +
      name(cc, lay.mid, 5.8) + classNo(cc, g.L - 8, 3.0, text) });
}
// Motor cars and trailers alternate along the train; the motor cars carry
// the shoes.
function avMid(c) {
  const L = c.L, lay = avLay(1.6, L - 1.6, L), motor = c.index % 2 === 0;
  return unit(c, { roof: AV.roof, sill: AV.sill,
    rows: lay.rows, doors: lay.doors, trucks: [9.2, L - 9.2], wheel: 33, diaphragm: [4.0, 11.3],
    paint: side(AV.roof, AV.sill),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, AV.roof, SW.trim) + hvac(g.L / 2 - 6, AV.roof + 0.27, 12, 0.5) +
      boxes(15, g.L - 15, AV.sill, motor ? 3 : 2, motor ? 1.3 : 1.5) + (motor ? shoe(9.2) + shoe(g.L - 9.2) : "") + name(cc, lay.mid, 5.8) });
}

// ---------- Tables ----------

// First is marked on the 444's driving car at one end; the 450's small
// First section is not drawn, and the 701 is all Standard. Each car kind
// is its own type, placed in the formation, with its own fact sheet; each
// formation has its own driving car, so that a unit's number picks its
// length. All third rail: kind "emu" without pan.
export const TYPES = {
  sw450Cab: { name: "Class 450 Desiro driving car", kind: "emu" },
  sw450Mid: { name: "Class 450 Desiro trailer car", kind: "emu" },
  sw444First: { name: "Class 444 Desiro First and Standard driving car", kind: "emu", amenities: ["first"] },
  sw444Cab: { name: "Class 444 Desiro driving car", kind: "emu" },
  sw444Mid: { name: "Class 444 Desiro trailer car", kind: "emu" },
  sw444Well: { name: "Class 444 Desiro trailer car (pantograph well)", kind: "emu" },
  sw701Cab: { name: "Class 701 Arterio driving car", kind: "emu" },
  sw7015Cab: { name: "Class 701/5 Arterio driving car", kind: "emu" },
  sw701Mid: { name: "Class 701 Arterio intermediate car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
export const MODELS = {
  sw450Cab: M((c) => desCab(c, 450), DS.car450, true),
  sw450Mid: M((c) => desMid(c, 450), DS.car450),
  sw444First: M((c) => desCab(c, 444, { first: true }), DS.car444, true),
  sw444Cab: M((c) => desCab(c, 444), DS.car444, true),
  sw444Mid: M((c) => desMid(c, 444), DS.car444),
  sw444Well: M((c) => desMid(c, 444, { well: true }), DS.car444),
  sw701Cab: M((c) => avCab(c, "701"), AV.car, true),
  sw7015Cab: M((c) => avCab(c, "701/5"), AV.car, true),
  sw701Mid: M(avMid, AV.car, false, byIndex),
};

// Units by number (class and serial run together; Wikipedia's fleet
// numbers): 450 001-127, 444 001-045, 701 001-060 of ten cars and 701
// 501-530 of five. The timetable names no unit; these are for the fleet
// pages.
export const FLEETS = {
  swr: [[450001, 450127, "sw450Cab"], [444001, 444045, "sw444First"], [701001, 701060, "sw701Cab"], [701501, 701530, "sw7015Cab"]],
};

const set = (label, ...units) => ({ label, units });
const D450 = set("Class 450 Desiro: four cars, third-rail electric; usually two or three units coupled",
  ["sw450Cab", 1], ["sw450Mid", 2], ["sw450Cab", 1]);
const D444 = set("Class 444 Desiro: five cars, third-rail electric, First at one end; often two units coupled",
  ["sw444First", 1], ["sw444Well", 1], ["sw444Mid", 2], ["sw444Cab", 1]);
const A701 = set("Class 701 Arterio: ten cars, third-rail electric", ["sw701Cab", 1], ["sw701Mid", 8], ["sw701Cab", 1]);
const A7015 = set("Class 701/5 Arterio: five cars, third-rail electric; usually two units coupled", ["sw7015Cab", 1], ["sw701Mid", 3], ["sw7015Cab", 1]);
const BY_MODEL = { sw450Cab: D450, sw450Mid: D450, sw444First: D444, sw444Cab: D444, sw444Mid: D444, sw444Well: D444, sw701Cab: A701, sw701Mid: A701, sw7015Cab: A7015 };

// By the reported unit; else the Class 450, the largest fleet, on the
// stopping and semi-fast trains of every main line out of Waterloo. The
// 444s run the fast trains to Portsmouth Harbour and to Bournemouth, Poole
// and Weymouth; the 701s the suburban lines to Windsor, Reading,
// Shepperton, Hampton Court, Chessington and round the Kingston and
// Hounslow loops; the Class 159 diesels (not drawn) Salisbury and Exeter.
// The timetable does not say which train is which, so the label says
// "usually".
export const TYPICAL = {
  swr: (t, reported) => BY_MODEL[reported] || D450,
};

const W450 = "https://en.wikipedia.org/wiki/British_Rail_Class_450";
const W444 = "https://en.wikipedia.org/wiki/British_Rail_Class_444";
const W701 = "https://en.wikipedia.org/wiki/British_Rail_Class_701";
const f450 = { model: "Siemens Class 450 Desiro", type: "Electric multiple unit", builder: "Siemens Transportation Systems", built: "2002–2006",
  fleet: "127 four-car units", topSpeedMph: 100, powerHp: 2012, seats: 285, source: W450 };
const f444 = { model: "Siemens Class 444 Desiro", type: "Electric multiple unit", builder: "Siemens Transportation Systems", built: "2002–2004",
  fleet: "45 five-car units", topSpeedMph: 100, powerHp: 2012, seats: 359, source: W444 };
const f701 = { model: "Alstom Class 701 Arterio (Aventra)", type: "Electric multiple unit", builder: "Bombardier Transportation, then Alstom (Derby)", built: "2019–2024",
  topSpeedMph: 100, source: W701 };
export const FACTS = {
  sw450Cab: { ...f450, lengthFt: 267.7,
    about: "A driving motor car of the four-car Desiro, South Western Railway's most numerous train, which replaced the slam-door stock out of Waterloo from 2003. It takes 750 V from the third rail through shoes on its trucks; the flat front carries a gangway door, so that eight- and twelve-car trains can be walked through." },
  sw450Mid: { ...f450,
    about: "One of the two trailers between the driving cars: no motors, a lavatory, and two double plug doors a side at the thirds of the car, for the short station stops of an outer-suburban train." },
  sw444First: { ...f444, lengthFt: 390.4,
    about: "The driving car at the First Class end of the five-car Desiro, the long-distance train of the Portsmouth Direct and the South West Main Line to Weymouth. Its 23.57 m cars have a single door at each end, away from the saloon, as on an intercity coach." },
  sw444Cab: { ...f444,
    about: "The Standard driving motor car of the Class 444. All the unit's 1,500 kW is in the two driving cars; the three cars between them are trailers." },
  sw444Mid: { ...f444,
    about: "A trailer of the Class 444: a long saloon between two end vestibules, each with one single-leaf plug door a side." },
  sw444Well: { ...f444,
    about: "The trailer with the wheelchair spaces, one end of its roof cut down into a well where a pantograph and transformer could go if the lines were ever wired. None has been fitted." },
  sw701Cab: { ...f701, fleet: "60 ten-car units", powerHp: 5364, seats: 556, lengthFt: 669,
    about: "A driving car of the ten-car Arterio, the suburban train ordered in 2017 to replace the Class 455s and their kin; software and cab faults kept it out of service until 2024. Walk-through from end to end, with room for some 750 standing." },
  sw7015Cab: { ...f701, model: "Alstom Class 701/5 Arterio (Aventra)", fleet: "30 five-car units", powerHp: 2682, seats: 274, lengthFt: 334.6,
    about: "A driving car of the five-car Arterio, which runs in pairs as a ten-car train, or alone where platforms are short." },
  sw701Mid: { ...f701,
    about: "An intermediate car of the Arterio: two double plug doors a side at the thirds of the car, and wide open gangways to its neighbors." },
};
