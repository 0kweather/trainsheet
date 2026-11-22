// ScotRail's cars (scripts/railroads/gb.py, "scotrail"): the Class 385
// (Hitachi, three and four cars, electric) of the Central Belt, Edinburgh
// to Glasgow by every electrified route; the Class 170 Turbostar (three
// cars, diesel) of the lines to Fife, Perth, Aberdeen and Inverness; and
// the Class 158 (two cars, diesel) of the rural lines to the Far North,
// Kyle of Lochalsh and the Borders. The timetable names no unit, so a train
// is drawn as the model that usually runs it, labeled as typical.
// Trainsheet's own side views from published dimensions, at the shared
// scale (js/carart.js), in ScotRail's Saltire blue, lettered here (no logo
// files). The toolkit from avanti.cars.js; the Class 385 and the Class 158
// are new here, and the Turbostar is drawn again here in ScotRail's paint
// (CrossCountry's and EMR's copies are not exported).

import { rect, path, lines, pantograph } from "../carart.js?v=dev";
import { seq, bands, boxes, ft, spread, yellowEnd, fairing, unit, letters, hvac, hvLine, exhaust } from "./avanti.cars.js?v=dev";

// ---------- Paint ----------
// The Saltire livery, Transport Scotland's own since 2008 and carried
// through every franchise since (the map's blue is #1e467d), drawn from
// memory of the trains, not checked against photographs: a dark blue all
// over, the roof darker; a charcoal skirt; at each end of the set, behind
// the cab, the arms of a white St Andrew's cross climbing the side; doors
// in a pale blue-gray, to stand out from the side as the accessibility
// rules ask; a yellow panel on each cab front under a black windshield.
// "ScotRail" in white on the side.
const SR = { blue: "#1e467d", roof: "#1b2c47", band: "#141a24", skirt: "#262a31", door: "#c3cfdf", trim: "#51627c", white: "#f5f7fa",
  pale: "#8fa9cf", gold: "#d9b860", cross: "rgba(255,255,255,0.62)" };
// ScotRail's name: white, the two capitals in one word; centered on x, the
// capitals h ft tall.
const scotrail = (c, x, y, h) => letters(c, x, y, h, "ScotRail", SR.white, { weight: 700, spacing: "0.01em" });
// A car's class over its windows: "FIRST" in gold (Standard goes unmarked).
const classMark = (c, x, y, cls) => (cls === "first" ? letters(c, x, y, 0.6, "FIRST", SR.gold, { weight: 700, spacing: "0.14em" }) : "");
// A unit's class number, small in pale blue near the skirt.
const classNo = (c, x, y, text) => letters(c, x, y, 0.36, text, SR.pale, { weight: 600, spacing: "0.06em" });
// The Saltire behind a cab: two white arms crossing between x = a and b,
// from the skirt to the roof's edge.
const saltire = (a, b, y0, y1) => lines([[a, y0, b, y1], [a, y1, b, y0]], SR.cross, 1.15);
// The side: blue, a darker roof, the skirt, and (o.band) a near-black
// window band from o.band up to o.bandTop.
const srPaint = (o, cabArt = "") => (c, g) => bands(g.L, [[0, 20, SR.blue], [o.roof - 0.6, 3, SR.roof],
  ...(o.band ? [[o.band, o.bandTop - o.band, SR.band]] : []), [0, o.sill, SR.skirt]]) + cabArt;
// A diesel engine's raft under the floor, with its radiator's louvers.
const raft = (a, b) => rect(a, 1.5, b - a, 2.25, "currentColor", 0, 'rx="0.3" opacity="0.85"') +
  lines(seq(a + 1.2, 1.1, Math.floor((b - a - 2) / 1.1)).map((x) => [x, 1.8, x, 3.4]), "rgba(255,255,255,0.16)", 0.4);

// ---------- Class 385 ----------
// Hitachi's AT200 commuter train, built at Kasado and Newton Aycliffe in
// 2015-2019 for the electrification of the Edinburgh-Glasgow main line:
// double-skin aluminium cars, the driving cars 23.639 m and the trailers
// 23.0 m, on two trucks each; 25 kV overhead; 100 mph. 46 three-car units
// (385/0, DMSL-PTS-DMSL, 206 seats) and 24 four-car (385/1, DMCL-PTS-TS-
// DMSL, 273 seats, 20 of them First in one driving car). Two double-leaf
// sliding plug doors a side; an upright cab with a gangway through its
// front, so that coupled sets are one train inside. (Wikipedia, "British
// Rail Class 385"; the infobox gives no height or width: 3.79 m and 2.74 m
// here are from memory.)
const H385 = { roof: 12.43, sill: 3.8, band: 6.75, bandTop: 10.2, cab: ft(23.639), mid: ft(23.0) };
const NOSE_385 = [[0.5, 3.2], [0.3, 6.2], ["q", 0.3, 8.0, 0.9, 9.0], [2.5, 11.7], ["q", 2.9, 12.43, 4.6, 12.43]];
const h385Paint = (cab) => srPaint(H385, cab ? path("M0.7 8.4L2.5 11.7L7.0 11.7L7.0 8.4Z", SR.band) + yellowEnd(2.6, 3.2, 7.9) + saltire(10.2, 18.0, H385.sill, 11.6) : "");
const h385Door = (x) => ({ x, w: 4.3, y0: H385.sill, y1: 10.9, leaves: 2, glassY: 0.5, glassH: 0.36, grabs: false, fill: SR.door });
// The windows: panes in three bays, one each side of the doors and a longer
// one between them.
const h385Rows = (a, d1, d2, b) => [{ xs: [...spread(a, d1 - 0.8, 4.5, 5.4), ...spread(d1 + 5.1, d2 - 0.8, 4.5, 5.4), ...spread(d2 + 5.1, b, 4.5, 5.4)], y: 7.05, w: 4.5, h: 2.85, r: 0.4 }];
function h385Cab(c) {
  const L = c.L, d1 = 19.4, d2 = L - 18.6;
  return unit(c, { roof: H385.roof, sill: H385.sill, nose: NOSE_385, rake: [[1.0, 8.6], [2.3, 11.4]], depth: 2.2, cabLen: 7, lampY: 5.0, low: 4.1,
    rows: h385Rows(9.6, d1, d2, L - 1.6), doors: [h385Door(d1), h385Door(d2)], trucks: [10.4, L - 9.6], wheel: 33, diaphragm: [4.1, 11.5],
    paint: h385Paint(true), surround: SR.band,
    extra: (cc, g) => fairing(5.2, g.L - 1.0, H385.roof, SR.trim) + hvac(30, H385.roof + 0.27, 12, 0.55) +
      // The traction gear under the motor car's floor.
      boxes(17, g.L - 15, H385.sill, 4, 1.4) +
      // The cab's side window and door.
      rect(3.6, 8.5, 1.8, 2.1, "#1d2026", 0.4) + rect(6.2, 4.1, 2.0, 6.9, "rgba(0,0,0,0.16)", 0.5) +
      scotrail(cc, (d1 + 4.3 + d2) / 2, 5.2, 1.6) + classMark(cc, (d1 + 4.3 + d2) / 2, 10.9, c.cls) + classNo(cc, g.L - 8, 4.5, "385") });
}
function h385Mid(c) {
  const L = c.L, d1 = 16.6, d2 = L - 20.9, pan = !!c.panCar;
  return unit(c, { roof: H385.roof, sill: H385.sill,
    rows: h385Rows(1.6, d1, d2, L - 1.6), doors: [h385Door(d1), h385Door(d2)], trucks: [9.6, L - 9.6], wheel: 33, diaphragm: [4.1, 11.5],
    paint: h385Paint(false),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, H385.roof, SR.trim) +
      // The pantograph car: the pantograph over one truck, the transformer under the floor.
      (pan ? pantograph(11, H385.roof + 0.29, { up: true, facing: -1 }) + hvLine(14, 22, H385.roof + 0.29) + hvac(g.L - 27, H385.roof + 0.27, 12, 0.55) + boxes(16, g.L - 16, H385.sill, 2, 1.6)
        : hvac(g.L / 2 - 6, H385.roof + 0.27, 12, 0.55) + boxes(18, g.L - 18, H385.sill, 2, 1.2)) +
      scotrail(cc, (d1 + 4.3 + d2) / 2, 5.2, 1.6) });
}

// ---------- Class 170 Turbostar ----------
// Adtranz's (later Bombardier's) regional diesel train, built at Derby in
// 1998-2005: welded aluminium cars of 23.62 m on two trucks each, 2.69 m
// wide, 3.77 m tall, an MTU 6R 183 of 315 kW under every car driving
// through a hydraulic transmission; 100 mph. Two double-leaf sliding plug
// doors a side, a third of the way in from each end; a short, upright cab
// with a raked windshield and no gangway through it; ScotRail's are of
// three cars. (Wikipedia, "British Rail Class 170".) The same body as
// CrossCountry's and EMR's, here in Saltire blue with no window band.
const TS = { roof: 12.37, sill: 3.8, car: ft(23.62) };
const NOSE_170 = [[0.5, 3.2], [0.35, 6.4], ["q", 0.4, 7.4, 1.1, 8.2], [3.6, 11.5], ["q", 4.2, 12.37, 6.0, 12.37]];
const tsPaint = (cab) => srPaint(TS, cab ? path("M1.0 8.0L3.6 11.5L7.4 11.5L7.4 8.0Z", SR.band) + yellowEnd(3.0, 3.2, 7.6) + saltire(10.6, 18.4, TS.sill, 11.5) : "");
const tsDoor = (x) => ({ x, w: 4.4, y0: TS.sill, y1: 10.8, leaves: 2, glassY: 0.48, glassH: 0.36, grabs: false, fill: SR.door });
const tsRows = (a, d1, d2, b) => [{ xs: [...spread(a, d1 - 0.8, 4.6, 5.5), ...spread(d1 + 5.2, d2 - 0.8, 4.6, 5.5), ...spread(d2 + 5.2, b, 4.6, 5.5)], y: 6.95, w: 4.6, h: 2.9, r: 0.4 }];
const tsUnder = (g, a) => raft(a, a + 15) + boxes(a + 17, g.L - 14, TS.sill, 2, 1.3);
function tsCab(c) {
  const L = c.L, d1 = 19.6, d2 = L - 23.0;
  return unit(c, { roof: TS.roof, sill: TS.sill, nose: NOSE_170, rake: [[1.3, 8.3], [3.4, 11.2]], depth: 2.6, cabLen: 8, lampY: 5.0, low: 4.1,
    rows: tsRows(9.4, d1, d2, L - 1.6), doors: [tsDoor(d1), tsDoor(d2)], trucks: [10.4, L - 9.8], wheel: 33, diaphragm: [4.1, 11.2],
    paint: tsPaint(true), surround: SR.band,
    extra: (cc, g) => fairing(6.0, g.L - 1.0, TS.roof, SR.trim) + hvac(30, TS.roof + 0.27, 12, 0.55) + exhaust(g.L - 8, TS.roof + 0.27) + tsUnder(g, 17) +
      // The cab's side window and door.
      rect(4.6, 8.1, 1.9, 2.3, "#1d2026", 0.4) + rect(7.0, 4.0, 1.9, 6.9, "rgba(0,0,0,0.16)", 0.5) +
      scotrail(cc, (d1 + 4.4 + d2) / 2, 5.15, 1.6) + classNo(cc, g.L - 9, 4.45, "170") });
}
function tsMid(c) {
  const L = c.L, d1 = 21.6, d2 = L - 26.0;
  return unit(c, { roof: TS.roof, sill: TS.sill,
    rows: tsRows(1.6, d1, d2, L - 1.6), doors: [tsDoor(d1), tsDoor(d2)], trucks: [9.8, L - 9.8], wheel: 33, diaphragm: [4.1, 11.2],
    paint: tsPaint(false),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, TS.roof, SR.trim) + hvac(g.L / 2 - 6, TS.roof + 0.27, 12, 0.55) + exhaust(g.L - 8, TS.roof + 0.27) + tsUnder(g, 15) +
      scotrail(cc, g.L / 2, 5.15, 1.6) });
}

// ---------- Class 158 ----------
// British Rail's Express Sprinter, built by BREL at Derby in 1989-1992:
// welded aluminium cars of 22.57 m on two trucks each, 2.70 m wide, 3.73 m
// tall, a Cummins NTA855 of 350 hp under every car driving through a
// hydraulic transmission; 90 mph. One double-leaf plug door a side at each
// end of the car, the saloon in one long run of windows between them; a
// flat cab with a gangway through its front. ScotRail's are of two cars.
// (Wikipedia, "British Rail Class 158".)
const SP = { roof: 12.24, sill: 3.8, car: ft(22.57) };
const NOSE_158 = [[0.5, 3.2], [0.3, 6.4], ["q", 0.3, 8.0, 0.8, 8.8], [2.3, 11.5], ["q", 2.7, 12.24, 4.4, 12.24]];
const spPaint = (cab) => srPaint(SP, cab ? path("M0.6 8.2L2.3 11.5L6.6 11.5L6.6 8.2Z", SR.band) + yellowEnd(2.6, 3.2, 7.8) + saltire(13.4, 21.0, SP.sill, 11.4) : "");
const spDoor = (x) => ({ x, w: 3.5, y0: SP.sill, y1: 10.7, leaves: 2, glassY: 0.5, glassH: 0.34, grabs: false, fill: SR.door });
function spCab(c) {
  const L = c.L, d1 = 8.6, d2 = L - 5.6;
  return unit(c, { roof: SP.roof, sill: SP.sill, nose: NOSE_158, rake: [[1.0, 8.4], [2.1, 11.2]], depth: 2.2, cabLen: 7, lampY: 5.0, low: 4.1,
    rows: [{ xs: spread(d1 + 13.6, d2 - 0.9, 4.9, 5.7), y: 6.95, w: 4.9, h: 2.8, r: 0.4 }], doors: [spDoor(d1), spDoor(d2)], trucks: [10.2, L - 10.2], wheel: 33, diaphragm: [4.1, 11.1],
    paint: spPaint(true), surround: SR.band,
    extra: (cc, g) => fairing(5.0, g.L - 1.0, SP.roof, SR.trim) + hvac(28, SP.roof + 0.27, 10, 0.5) + exhaust(g.L - 7, SP.roof + 0.27) +
      raft(17, 32) + boxes(34, g.L - 14, SP.sill, 2, 1.3) +
      // The cab's side window.
      rect(3.6, 8.3, 2.4, 2.2, "#1d2026", 0.4) +
      scotrail(cc, (d1 + 13.6 + d2) / 2, 5.1, 1.6) + classNo(cc, g.L - 12, 4.45, "158") });
}

// ---------- Tables ----------

// ScotRail's classes: Standard everywhere, and First in one driving car of
// the four-car Class 385 (the Turbostars' small First sections are not
// drawn apart). Each is its own type, placed in the formation, with its
// own fact sheet. Diesel multiple units are kind "emu" (self-propelled, a
// cab at each end of the set) with no pantograph.
export const TYPES = {
  sr385Cab: { name: "Class 385 end car", kind: "emu" },
  sr385Pan: { name: "Class 385 pantograph car", kind: "emu", pan: true },
  sr3854First: { name: "Class 385 First and Standard end car", kind: "emu", amenities: ["first"] },
  sr3854Pan: { name: "Class 385 pantograph car", kind: "emu", pan: true },
  sr3854Mid: { name: "Class 385 car", kind: "emu" },
  sr3854Cab: { name: "Class 385 Standard end car", kind: "emu" },
  sr170Cab: { name: "Class 170 Turbostar end car", kind: "emu" },
  sr170Mid: { name: "Class 170 Turbostar car", kind: "emu" },
  sr158Cab: { name: "Class 158 end car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  sr385Cab: M(h385Cab, H385.cab, true),
  sr385Pan: M((c) => h385Mid({ ...c, panCar: true }), H385.mid),
  sr3854First: M((c) => h385Cab({ ...c, cls: "first" }), H385.cab, true),
  sr3854Pan: M((c) => h385Mid({ ...c, panCar: true }), H385.mid),
  sr3854Mid: M(h385Mid, H385.mid),
  sr3854Cab: M(h385Cab, H385.cab, true),
  sr170Cab: M(tsCab, TS.car, true),
  sr170Mid: M(tsMid, TS.car),
  sr158Cab: M(spCab, SP.car, true),
};

// Units by number: 385 001-046 (three cars) and 385 101-124 (four), from
// Wikipedia. The diesel ranges are from memory, not checked against a
// roster, and some units in them have since gone to other operators: 170
// 393-396, 170 401-434, 170 450-461 and 170 470-478 (three cars), 158
// 701-741 (two). The timetable names no unit; these are for the fleet
// pages.
export const FLEETS = {
  scotrail: [[385001, 385046, "sr385Cab"], [385101, 385124, "sr3854First"],
    [170393, 170396, "sr170Cab"], [170401, 170434, "sr170Cab"], [170450, 170461, "sr170Cab"], [170470, 170478, "sr170Cab"],
    [158701, 158741, "sr158Cab"]],
};

const set = (label, ...units) => ({ label, units });
const E385 = set("Class 385: three cars, electric; Standard only",
  ["sr385Cab", 1], ["sr385Pan", 1], ["sr385Cab", 1]);
const E3854 = set("Class 385: four cars, electric; First at one end",
  ["sr3854First", 1], ["sr3854Pan", 1], ["sr3854Mid", 1], ["sr3854Cab", 1]);
const T170 = set("Class 170 Turbostar: three cars, diesel",
  ["sr170Cab", 1], ["sr170Mid", 1], ["sr170Cab", 1]);
const S158 = set("Class 158: two cars, diesel; Standard only",
  ["sr158Cab", 2]);
const BY_MODEL = {};
for (const k of Object.keys(TYPES)) BY_MODEL[k] = k.startsWith("sr3854") ? E3854 : k.startsWith("sr385") ? E385 : k.startsWith("sr170") ? T170 : S158;

// By the reported unit; else the three-car Class 385, the most numerous of
// ScotRail's trains, which works the electric lines of the Central Belt:
// Edinburgh to Glasgow by Falkirk High and by Shotts, to Stirling, Dunblane
// and Alloa, North Berwick and the Cathcart Circle, often two sets coupled.
// The Turbostars run north to Fife, Perth, Dundee, Aberdeen and Inverness,
// the Class 158s on the Far North, Kyle and Borders lines. The Inter7City
// High Speed Trains, the older electric fleets (318, 320, 334, 380) and the
// West Highland's Class 156 are not drawn. The timetable does not say which
// train is which, so the label says "usually".
export const TYPICAL = {
  scotrail: (t, reported) => BY_MODEL[reported] || E385,
};

const W385 = "https://en.wikipedia.org/wiki/British_Rail_Class_385";
const W170 = "https://en.wikipedia.org/wiki/British_Rail_Class_170";
const W158 = "https://en.wikipedia.org/wiki/British_Rail_Class_158";
const e385 = { model: "Hitachi Class 385 (AT200)", type: "Electric multiple unit", builder: "Hitachi Rail (Kasado and Newton Aycliffe)", built: "2015–2019",
  topSpeedMph: 100, source: W385 };
const e3 = { ...e385, fleet: "46 three-car units", seats: 206 };
const e4 = { ...e385, fleet: "24 four-car units", seats: 273 };
const t170 = { model: "Bombardier Class 170 Turbostar", type: "Diesel-hydraulic multiple unit", builder: "Adtranz, later Bombardier Transportation (Derby)", built: "1998–2005",
  fleet: "139 built for many operators; ScotRail's are of three cars", topSpeedMph: 100, powerHp: 1267, source: W170 };
const s158 = { model: "BREL Class 158 Express Sprinter", type: "Diesel-hydraulic multiple unit", builder: "British Rail Engineering Limited (Derby)", built: "1989–1992",
  fleet: "180 built; ScotRail's are of two cars", topSpeedMph: 90, powerHp: 700, source: W158 };
export const FACTS = {
  sr385Cab: { ...e3, lengthFt: 230.6,
    about: "A Class 385 driving motor car. Hitachi built the class for the electrification of the main line between Edinburgh and Glasgow, and it now works most of the Central Belt's electric trains at up to 100 mph. A three-car set is 70.3 m long and seats 206; a gangway through each cab front makes coupled sets one train inside." },
  sr385Pan: { ...e3,
    about: "The middle car carries the set's pantograph and, under its floor, the transformer. Standard class, like the whole three-car train." },
  sr3854First: { ...e4, lengthFt: 306.0,
    about: "The four-car Class 385's First class driving car: 20 First seats and the rest Standard. A four-car set is 93.3 m long and seats 273; three- and four-car sets run coupled as seven or eight cars on the busiest Edinburgh to Glasgow trains." },
  sr3854Pan: { ...e4,
    about: "The second car carries the set's pantograph and, under its floor, the transformer. Standard class." },
  sr3854Mid: { ...e4,
    about: "A trailer car, Standard class, with wide double doors a side." },
  sr3854Cab: { ...e4,
    about: "The Standard class driving motor car at the other end of the four-car set." },
  sr170Cab: { ...t170, lengthFt: 232.5,
    about: "A Turbostar driving car. ScotRail's three-car Turbostars, new to Scotland from 1999, run from Edinburgh and Glasgow to Fife, Perth, Dundee, Aberdeen and Inverness at up to 100 mph, each car on its own MTU diesel engine." },
  sr170Mid: { ...t170,
    about: "The Turbostar's middle car, with wide double doors a third of the way in from each end." },
  sr158Cab: { ...s158, lengthFt: 148.1,
    about: "A Class 158 driving car. British Rail's Express Sprinter of 1989, with a door at each end of the car and one long saloon between; ScotRail's two-car sets work the Far North and Kyle lines out of Inverness and the Borders Railway to Tweedbank, each car on its own Cummins diesel engine, alone or coupled." },
};
