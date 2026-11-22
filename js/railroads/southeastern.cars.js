// Southeastern's cars (scripts/railroads/gb.py, "southeastern"): the trains
// out of Victoria, Charing Cross, Cannon Street and St Pancras to south-east
// London, Kent and East Sussex. Three fleets: the Hitachi Class 395
// "Javelin", the 140 mph train of High Speed 1; the Bombardier Class 375
// Electrostar, the main-line train to the Kent coast and Hastings, in three
// and four cars (usually two or three units coupled); and the Class 465
// Networker, the Metro train of the suburban lines. The timetable names no
// unit, so a train is drawn as the fleet that usually runs it, labeled as
// typical. Trainsheet's own side views from published dimensions, at the
// shared scale (js/carart.js), in Southeastern's dark blue, lettered here
// (no logo files). The toolkit from avanti.cars.js; the Electrostar is
// redrawn here in Southeastern paint (southern.cars.js does not export its
// 377); the 395 and the Networker are new bodies.

import { rect, path, poly, pantograph } from "../carart.js?v=dev";
import { bands, boxes, ft, spread, leaf, yellowEnd, fairing, unit, letters, hvac, hvLine } from "./avanti.cars.js?v=dev";

// ---------- Paint ----------
// Southeastern's dark blue, first worn by the 395s in 2009 and since spread
// to the Electrostars and Networkers as they are repainted; drawn from
// memory and not checked against photographs: dark blue all over, a darker
// roof and a charcoal skirt; doors light blue (the railroad's color,
// #389cff, a little muted); a fine light blue line along the foot of the
// side; the name in white lower case under the windows, on the 395
// followed by "highspeed" in light blue; the 395's windows in a near-black
// band; a yellow front (the 395: a yellow panel under the windshield).
const SE = { blue: "#14254a", deep: "#0e1b38", sky: "#4a9fe8", pale: "#8cc4f2", white: "#f5f6f7", band: "#17191e", skirt: "#2a2d33", roof: "#3a4048", trim: "#5a616a", silver: "#c9cdd2" };

// Southeastern's name, lower case, centered on x; reads left to right on a
// mirrored car too. more: a second word after it in light blue.
const name = (c, x, y, h = 0.95, more = "") => letters(c, x, y, h, "southeastern" + (more ? `<tspan fill="${SE.pale}" dx="0.3em">${more}</tspan>` : ""), SE.white, { weight: 600, spacing: "-0.01em" });
// The class, small on the skirt at the inner end of a driving car.
const classNo = (c, x, y, text) => letters(c, x, y, 0.36, text, SE.silver, { weight: 600, spacing: "0.06em" });
// The side: dark blue, the light line along its foot; band: [y, h] of a
// near-black window band.
const side = (roof, sill, more = "", band = null) => (c, g) => bands(g.L, [[0, 20, SE.blue], [roof - 0.6, 3, SE.roof], ...(band ? [[band[0], band[1], SE.band]] : []),
  [sill + 0.35, 0.2, SE.sky], [0, sill, SE.skirt]]) + more;
// A third-rail shoe beam, hung between a truck's axleboxes.
const shoe = (x) => rect(x - 2.3, 0.95, 4.6, 0.3, "#3b3f45", 0.3) + rect(x - 0.7, 0.5, 1.4, 0.45, "#6a4a2a", 0.3);

// ---------- Hitachi Class 395 "Javelin" ----------
// Built at Kasado by Hitachi, 2007-2009, its first train for Europe and the
// forerunner of the AT300: 29 six-car units of aluminium cars, about 122 m;
// the driving cars (DPT, trailers with a pantograph each) 20.88 m, the four
// motor cars between them 20.0 m; 2.81 m wide, 3.817 m tall, floor at
// 1.235 m; 3,360 kW; 140 mph on 25 kV under High Speed 1's wires, 100 mph
// on the 750 V third rail beyond it; two single-leaf sliding doors a side,
// 3 ft wide, about a quarter of the way in from each end; 340 seats, all
// Standard. A tapered nose, much shorter than the AT300's, with a coupler
// behind its doors so that two units run as twelve cars. (Wikipedia,
// "British Rail Class 395".)
const JV = { roof: ft(3.817), sill: 3.85, cab: ft(20.88), mid: ft(20.0) };
const NOSE_395 = [[0.8, 2.9], [0.5, 4.3], ["q", 0.6, 5.8, 2.2, 7.0], [7.8, 10.9], ["q", 9.6, JV.roof, 12.4, JV.roof]];
const jvDoor = (x) => leaf(x, JV.sill, 10.7, 3.0, SE.sky);
// The windows: wide panes in the band, between and outside the doors.
const jvRows = (a, d1, d2, b) => [{ xs: [...(d1 - a > 6 ? spread(a, d1 - 0.9, 4.6, 5.5) : []), ...spread(d1 + 3.9, d2 - 0.9, 4.6, 5.5), ...spread(d2 + 3.9, b, 4.6, 5.5)], y: 7.0, w: 4.6, h: 2.7, r: 0.4 }];
const jvPaint = (cab) => side(JV.roof, JV.sill,
  // The nose: a yellow panel under the windshield, the band running into
  // the windshield's mask.
  cab ? yellowEnd(5.2, 2.9, 7.0) + path(`M2.6 7.2L7.8 10.9L16.0 10.9L16.0 9.95L14.0 9.95L14.0 6.75L6.0 6.75Z`, SE.band) : "", [6.75, 3.2]);
// c.pan: this driving car's pantograph raised.
function jvCab(c) {
  const L = c.L, d1 = 17.2, d2 = L - 14.6;
  return unit(c, { roof: JV.roof, sill: JV.sill, nose: NOSE_395, rake: [[3.2, 7.6], [7.4, 10.6]], depth: 3.0, cabLen: 14, lampY: 4.7, low: 4.1,
    rows: jvRows(d1, d1, d2, L - 1.8), doors: [jvDoor(d1), jvDoor(d2)], trucks: [11.6, L - 9.6], wheel: 34, diaphragm: [4.1, 11.3],
    paint: jvPaint(true), surround: SE.band,
    extra: (cc, g) => fairing(12.4, g.L - 1.0, JV.roof, SE.trim) +
      pantograph(g.L - 20, JV.roof + 0.29, { up: !!cc.pan, facing: -1 }) + hvLine(g.L - 17, g.L - 8, JV.roof + 0.29) + hvac(22, JV.roof + 0.27, 12, 0.6) +
      boxes(18, g.L - 15, JV.sill, 2, 1.4) + shoe(11.6) + shoe(g.L - 9.6) +
      // The cab's side window and door.
      path(poly([[9.6, 7.6], [12.4, 7.6], [12.4, 9.7], [11.0, 9.7]]), "#1d2026", 0.4) + rect(13.4, 4.0, 2.0, 6.5, "rgba(0,0,0,0.14)", 0.5) +
      name(cc, (d1 + 3.0 + d2) / 2, 5.55, 1.0, "highspeed") + classNo(cc, g.L - 8, 3.15, "395") });
}
function jvMid(c) {
  const L = c.L, d1 = 12.4, d2 = L - 15.4;
  return unit(c, { roof: JV.roof, sill: JV.sill,
    rows: jvRows(1.8, d1, d2, L - 1.8), doors: [jvDoor(d1), jvDoor(d2)], trucks: [9.6, L - 9.6], wheel: 34, diaphragm: [4.1, 11.3],
    paint: jvPaint(false),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, JV.roof, SE.trim) + hvac(8, JV.roof + 0.27, 12, 0.6) + hvac(g.L - 22, JV.roof + 0.27, 12, 0.6) +
      boxes(15, g.L - 15, JV.sill, 3, 1.3) + name(cc, (d1 + 3.0 + d2) / 2, 5.55, 1.0, "highspeed") });
}

// ---------- Bombardier Electrostar: Class 375 ----------
// Built at Derby by Adtranz and Bombardier, 1999-2005: steel-framed
// aluminium cars, the driving cars 20.39 m and the middle ones 19.98 m,
// 2.80 m wide, 3.78 m tall, 100 mph; a flat cab front with a gangway door,
// so that coupled units can be walked through; two double-leaf sliding plug
// doors a side at the thirds of each car. Four cars (DMOS-MOSL-TOSL-DMOS,
// 1,500 kW) but for the three-car 375/3 (DMOS-TOSL-DMOS, 1,000 kW). 750 V
// DC from the third rail, the shoes on the driving cars' trucks; the
// trailer's roof has a well for a pantograph, fitted only on the
// dual-voltage 375/6 and kept down on Southeastern's lines, so it is drawn
// empty. (Wikipedia, "British Rail Class 375". The unit ranges are from
// memory.)
const ES = { roof: ft(3.78), sill: 3.7, cab: ft(20.39), mid: ft(19.98) };
const NOSE_375 = [[0.4, 3.2], [0.3, 6.5], ["q", 0.3, 7.4, 0.7, 8.1], [1.8, ES.roof - 0.77], ["q", 2.2, ES.roof, 3.6, ES.roof]];
const PLUG = 4.4;
const plug = (x, sill = ES.sill) => ({ x, w: PLUG, y0: sill, y1: 10.8, leaves: 2, glassY: 0.48, glassH: 0.36, grabs: false, fill: SE.sky });
// The windows: three bays, one each side of the doors and a long one
// between them.
const bays = (a, d1, d2, b, w = 4.4, pitch = 5.2, y = 6.95, h = 2.85) => [{ xs: [...spread(a, d1 - 0.8, w, pitch), ...spread(d1 + PLUG + 0.8, d2 - 0.8, w, pitch), ...spread(d2 + PLUG + 0.8, b, w, pitch)], y, w, h, r: 0.4 }];

// text: the class as lettered on the skirt.
function esCab(c, text = "375") {
  const L = c.L, d1 = 17.0, d2 = L - 19.6;
  return unit(c, { roof: ES.roof, sill: ES.sill, nose: NOSE_375, rake: [[0.8, 8.3], [1.7, ES.roof - 1.07]], depth: 2.0, cabLen: 7, lampY: 5.0, low: 4.1,
    rows: bays(8.8, d1, d2, L - 1.6), doors: [plug(d1), plug(d2)], trucks: [9.8, L - 9.2], wheel: 33, diaphragm: [4.1, 11.2],
    // The front yellow from the skirt to the roof, round the windshield's mask.
    paint: side(ES.roof, ES.sill, yellowEnd(2.6, 3.2, ES.roof - 0.6) + path(`M0.6 8.1L1.8 ${ES.roof - 0.77}L4.4 ${ES.roof - 0.77}L4.4 8.1Z`, SE.band)), surround: SE.band,
    extra: (cc, g) => fairing(3.6, g.L - 1.0, ES.roof, SE.trim) + hvac(g.L / 2 - 6, ES.roof + 0.27, 12, 0.55) + boxes(15, g.L - 14, ES.sill, 3, 1.3) +
      shoe(9.8) + shoe(g.L - 9.2) +
      // The cab's side window and door.
      rect(3.4, 8.2, 1.7, 2.2, "#1d2026", 0.4) + rect(5.6, 4.0, 1.9, 6.9, "rgba(0,0,0,0.16)", 0.5) +
      name(cc, (d1 + PLUG + d2) / 2, 5.6) + classNo(cc, g.L - 8, 3.05, text) });
}
// o.well: the trailer, its roof cut down at one end for a pantograph (none
// drawn) and the lavatory's blank panel in place of a window. o.motor:
// traction gear under the floor.
function esMid(c, o = {}) {
  const L = c.L, d1 = 14.6, d2 = L - 19.0;
  return unit(c, { roof: ES.roof, sill: ES.sill,
    rows: bays(1.6, d1, d2, L - 1.6), doors: [plug(d1), plug(d2)], trucks: [9.2, L - 9.2], wheel: 33, diaphragm: [4.1, 11.2],
    paint: side(ES.roof, ES.sill),
    extra: (cc, g) => (o.well ? fairing(21, g.L - 1.0, ES.roof, SE.trim) + rect(3.0, ES.roof - 0.42, 17.0, 0.45, "#2b3037", 0.4) + hvac(g.L - 24, ES.roof + 0.27, 12, 0.55)
      : fairing(1.0, g.L - 1.0, ES.roof, SE.trim) + hvac(g.L / 2 - 6, ES.roof + 0.27, 12, 0.55)) +
      boxes(15, g.L - 15, ES.sill, o.motor ? 3 : 2, o.motor ? 1.3 : 1.5) + name(cc, (d1 + PLUG + d2) / 2, 5.6) });
}

// ---------- Class 465 Networker ----------
// British Rail's last suburban train, built for Network SouthEast's Kent
// lines in 1991-1994 by BREL and ABB at York (465/0, /1) and Metro-Cammell
// and GEC Alsthom at Washwood Heath (465/2, /9): 147 four-car units,
// DMSO-TSO-TSOL-DMSO, of welded aluminium; the driving motor cars 20.89 m,
// the trailers 20.06 m; 2.81 m wide, 3.77 m tall; 2,240 kW, 75 mph, 750 V
// DC from the third rail; two double-leaf sliding plug doors a side at the
// thirds of each car; a raked cab front with no gangway through it.
// (Wikipedia, "British Rail Class 465". The unit ranges are from memory.)
const NW = { roof: ft(3.77), sill: 3.75, cab: ft(20.89), mid: ft(20.06) };
const NOSE_465 = [[0.5, 3.2], [0.3, 6.1], ["q", 0.35, 7.2, 1.0, 8.0], [3.2, 11.5], ["q", 3.8, NW.roof, 5.6, NW.roof]];
const nwRows = (a, d1, d2, b) => bays(a, d1, d2, b, 4.2, 5.0, 7.1, 2.6);
function nwCab(c) {
  const L = c.L, d1 = 18.0, d2 = L - 19.8;
  return unit(c, { roof: NW.roof, sill: NW.sill, nose: NOSE_465, rake: [[1.2, 8.2], [3.0, 11.2]], depth: 2.4, cabLen: 8, lampY: 5.0, low: 4.1,
    rows: nwRows(9.6, d1, d2, L - 1.6), doors: [plug(d1, NW.sill), plug(d2, NW.sill)], trucks: [10.2, L - 9.4], wheel: 33, diaphragm: [4.1, 11.2],
    // The front yellow up to the windshield, which sits in a black mask.
    paint: side(NW.roof, NW.sill, yellowEnd(3.0, 3.2, 7.7) + path("M0.9 8.0L3.2 11.5L7.0 11.5L7.0 8.0Z", SE.band)), surround: SE.band,
    extra: (cc, g) => fairing(5.6, g.L - 1.0, NW.roof, SE.trim) + boxes(15, g.L - 14, NW.sill, 3, 1.3) + shoe(10.2) + shoe(g.L - 9.4) +
      // The cab's side window and door.
      rect(4.4, 8.1, 1.8, 2.3, "#1d2026", 0.4) + rect(6.8, 4.0, 1.9, 6.9, "rgba(0,0,0,0.16)", 0.5) +
      name(cc, (d1 + PLUG + d2) / 2, 5.7) + classNo(cc, g.L - 8, 3.1, "465") });
}
function nwMid(c) {
  const L = c.L, d1 = 15.0, d2 = L - 19.4;
  return unit(c, { roof: NW.roof, sill: NW.sill,
    rows: nwRows(1.6, d1, d2, L - 1.6), doors: [plug(d1, NW.sill), plug(d2, NW.sill)], trucks: [9.4, L - 9.4], wheel: 33, diaphragm: [4.1, 11.2],
    paint: side(NW.roof, NW.sill),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, NW.roof, SE.trim) + boxes(15, g.L - 15, NW.sill, 2, 1.5) + name(cc, (d1 + PLUG + d2) / 2, 5.7) });
}

// ---------- Tables ----------

// All three fleets are drawn all Standard (the 395 and the Networker were
// built so; Southeastern withdrew First Class from the 375s in 2022-2023).
// Each car kind is its own type, placed in the formation, with its own fact
// sheet; the three-car 375/3 has its own driving car, so that a unit's
// number picks its length. The 395's pantographs are drawn by this file
// (the trailing car's raised), the others run on the third rail: kind
// "emu" without the pan flag.
export const TYPES = {
  se395Cab: { name: "Class 395 Javelin driving car", kind: "emu" },
  se395Mid: { name: "Class 395 Javelin motor car", kind: "emu" },
  se375Cab: { name: "Class 375 Electrostar driving car", kind: "emu" },
  se3753Cab: { name: "Class 375/3 Electrostar driving car", kind: "emu" },
  se375Motor: { name: "Class 375 Electrostar motor car", kind: "emu" },
  se375Trailer: { name: "Class 375 Electrostar trailer car", kind: "emu" },
  se465Cab: { name: "Class 465 Networker driving car", kind: "emu" },
  se465Mid: { name: "Class 465 Networker trailer car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
export const MODELS = {
  // The trailing car's pantograph is drawn raised, the leading one's down.
  se395Cab: M((c) => jvCab({ ...c, pan: c.index !== 0 }), JV.cab, true, byIndex),
  se395Mid: M(jvMid, JV.mid),
  se375Cab: M((c) => esCab(c), ES.cab, true),
  se3753Cab: M((c) => esCab(c, "375/3"), ES.cab, true),
  se375Motor: M((c) => esMid(c, { motor: true }), ES.mid),
  se375Trailer: M((c) => esMid(c, { well: true }), ES.mid),
  se465Cab: M(nwCab, NW.cab, true),
  se465Mid: M(nwMid, NW.mid),
};

// Units by number (class and serial run together): 395 001-029 (Wikipedia's
// fleet numbers); from memory, 375 301-310 of three cars, 375 601-630,
// 701-715, 801-830 and 901-927 of four; 465 001-050, 151-197, 235-250 and
// 901-934 (some of the last two series are stored). The timetable names no
// unit; these are for the fleet pages.
export const FLEETS = {
  southeastern: [[395001, 395029, "se395Cab"],
    [375301, 375310, "se3753Cab"], [375601, 375630, "se375Cab"], [375701, 375715, "se375Cab"], [375801, 375830, "se375Cab"], [375901, 375927, "se375Cab"],
    [465001, 465050, "se465Cab"], [465151, 465197, "se465Cab"], [465235, 465250, "se465Cab"], [465901, 465934, "se465Cab"]],
};

const set = (label, ...units) => ({ label, units });
const J395 = set("Class 395 Javelin: six cars, High Speed 1; two units coupled on the busiest trains",
  ["se395Cab", 1], ["se395Mid", 4], ["se395Cab", 1]);
const E375 = set("Class 375 Electrostar: four cars, third-rail electric; usually two or three units coupled",
  ["se375Cab", 1], ["se375Motor", 1], ["se375Trailer", 1], ["se375Cab", 1]);
const E3753 = set("Class 375/3 Electrostar: three cars, third-rail electric; usually coupled to other units",
  ["se3753Cab", 1], ["se375Trailer", 1], ["se3753Cab", 1]);
const N465 = set("Class 465 Networker: four cars, third-rail electric; usually two units coupled",
  ["se465Cab", 1], ["se465Mid", 2], ["se465Cab", 1]);
const BY_MODEL = { se395Cab: J395, se395Mid: J395, se375Cab: E375, se375Motor: E375, se375Trailer: E375, se3753Cab: E3753, se465Cab: N465, se465Mid: N465 };

// By the reported unit; else the four-car 375, the train of the main lines:
// Victoria and Charing Cross to Ramsgate, Dover, Ashford and Hastings. The
// 395s run only the trains out of St Pancras over High Speed 1; the
// Networkers (with the Class 376 and 707, not drawn) the Metro services to
// Dartford, Hayes, Orpington and Sevenoaks. The timetable does not say
// which train is which, so the label says "usually".
export const TYPICAL = {
  southeastern: (t, reported) => BY_MODEL[reported] || E375,
};

const W395 = "https://en.wikipedia.org/wiki/British_Rail_Class_395";
const W375 = "https://en.wikipedia.org/wiki/British_Rail_Class_375";
const W465 = "https://en.wikipedia.org/wiki/British_Rail_Class_465";
const f395 = { model: "Hitachi Class 395 Javelin", type: "High-speed electric multiple unit", builder: "Hitachi (Kasado)", built: "2007–2009",
  fleet: "29 six-car units", topSpeedMph: 140, powerHp: 4506, seats: 340, source: W395 };
const f375 = { model: "Bombardier Class 375 Electrostar", type: "Electric multiple unit", builder: "Adtranz and Bombardier Transportation (Derby)", built: "1999–2005",
  topSpeedMph: 100, source: W375 };
const f465 = { model: "Class 465 Networker", type: "Electric multiple unit", builder: "BREL and ABB (York); Metro-Cammell and GEC Alsthom (Washwood Heath)", built: "1991–1994",
  topSpeedMph: 75, powerHp: 3004, source: W465 };
export const FACTS = {
  se395Cab: { ...f395, lengthFt: 400,
    about: "A driving car of the Javelin, Britain's fastest domestic train: 140 mph under the wires of High Speed 1 from St Pancras to Ebbsfleet and Ashford, then on over the third rail at 100 mph to the Kent coast. A trailer with a pantograph on its roof and shoes on its trucks; a coupler hides behind the nose's doors, and two units make a twelve-car train. In service since 2009, and the shuttle to the Olympic Park in 2012." },
  se395Mid: { ...f395,
    about: "One of the four motor cars between the Javelin's driving cars, all their axles powered. Two single sliding doors a side; one class throughout, Standard." },
  se375Cab: { ...f375, powerHp: 2012, seats: 236, lengthFt: 264.9,
    about: "A driving motor car of Southeastern's four-car Electrostar, the main-line train of Kent since it replaced the slam-door stock in 2001-2005. Its flat front carries a gangway door, so that two or three coupled units can be walked through; trains split and join on the way, at Faversham and Ashford among others." },
  se3753Cab: { ...f375, model: "Bombardier Class 375/3 Electrostar", fleet: "10 three-car units", powerHp: 1341, seats: 176, lengthFt: 199.3,
    about: "A driving motor car of the three-car 375/3. With no motor car between them, the two driving cars do all the work; the units lengthen four-car trains to seven and eleven cars, and run the Medway Valley and Sheerness branches on their own." },
  se375Motor: { ...f375,
    about: "A motor car, with traction gear under its floor and a lavatory at one end. Two double plug doors a side at the thirds of the car, as on every Electrostar." },
  se375Trailer: { ...f375,
    about: "The trailer: no motors, and one end of its roof cut down into a well where a pantograph and its transformer can go. Only the thirty 375/6s carry one, and it stays down on Southeastern's lines: the trains take 750 V from the third rail through shoes on the driving cars' trucks." },
  se465Cab: { ...f465, seats: 334, lengthFt: 268.7,
    about: "A driving motor car of the Networker, British Rail's last suburban train, built for the Kent lines of Network SouthEast and still the mainstay of Southeastern's Metro services out of Charing Cross, Cannon Street and Victoria. All the motors are in the two driving cars." },
  se465Mid: { ...f465,
    about: "One of the two trailers between a Networker's driving cars; one of the pair has a lavatory. Two double plug doors a side at the thirds of the car." },
};
