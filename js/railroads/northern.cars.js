// Northern's cars (scripts/railroads/gb.py, "northern"): the Class 195
// (CAF Civity, two and three cars, diesel) of the longer runs out of
// Manchester, Leeds and Liverpool; the Class 331 (the same Civity body,
// three and four cars, electric) of the wires round Leeds, Manchester and
// Blackpool; and the Class 150 Sprinter (two cars, diesel), British Rail's
// stopping train of the 1980s, still the workhorse of the branch lines.
// The timetable names no unit, so a train is drawn as the model that
// usually runs it, labeled as typical. Trainsheet's own side views from
// published dimensions, at the shared scale (js/carart.js), in Northern's
// white and deep blue, lettered here (no logo files). The toolkit from
// avanti.cars.js; the Civity is drawn again here in Northern's paint
// (TransPennine's copy is not exported), and the Class 150 is new here.

import { rect, path, lines, pantograph } from "../carart.js?v=dev";
import { seq, bands, boxes, ft, spread, yellowEnd, fairing, unit, letters, hvac, hvLine, exhaust } from "./avanti.cars.js?v=dev";

// ---------- Paint ----------
// Northern's livery since 2016, kept by the state-owned Northern Trains
// since 2020 (the map's blue is #0f0d78), drawn from memory of the trains,
// not checked against photographs: white sides under a gray roof, a
// charcoal skirt; each cab end deep blue, the blue sweeping back in a curve
// from the skirt to the roof; deep blue doors, to stand out from the white
// as the accessibility rules ask; a yellow panel on each cab front under a
// black windshield. "northern" in deep blue, lower case, on the side.
const NT = { white: "#f3f4f6", blue: "#0f0d78", deep: "#0a0957", sky: "#2d7fd6", roof: "#8f959d", band: "#15161c", skirt: "#2a2c33", trim: "#b4b9c0",
  gray: "#6c7280" };
// Northern's name: lower case, heavy, deep blue; centered on x, h ft tall.
const northern = (c, x, y, h) => letters(c, x, y, h, "northern", NT.blue, { weight: 700, spacing: "-0.01em" });
// A unit's class number, small in gray near the skirt.
const classNo = (c, x, y, text) => letters(c, x, y, 0.36, text, NT.gray, { weight: 600, spacing: "0.06em" });
// The blue cab end: solid from the front back to x = a at the skirt, its
// edge curving back to x = b at the roof, a lighter blue line along it.
const sweep = (a, b, sill, roof) => path(`M-1 ${sill}L${a} ${sill}Q${a + (b - a) * 0.75} ${(sill + roof) / 2} ${b} ${roof + 1}L-1 ${roof + 1}Z`, NT.blue) +
  path(`M${a} ${sill}Q${a + (b - a) * 0.75} ${(sill + roof) / 2} ${b} ${roof + 1}L${b + 0.9} ${roof + 1}Q${a + (b - a) * 0.75 + 0.9} ${(sill + roof) / 2} ${a + 0.9} ${sill}Z`, NT.sky);
// The side: white, a gray roof, the skirt.
const ntPaint = (o, cabArt = "") => (c, g) => bands(g.L, [[0, 20, NT.white], [o.roof - 0.6, 3, NT.roof], [0, o.sill, NT.skirt]]) + cabArt;
// A diesel engine's raft under the floor, with its radiator's louvers.
const raft = (a, b) => rect(a, 1.5, b - a, 2.25, "currentColor", 0, 'rx="0.3" opacity="0.85"') +
  lines(seq(a + 1.2, 1.1, Math.floor((b - a - 2) / 1.1)).map((x) => [x, 1.8, x, 3.4]), "rgba(255,255,255,0.16)", 0.4);

// ---------- CAF Civity: Class 195 and Class 331 ----------
// CAF's Civity UK, built at Zaragoza, Irun and Newport in 2017-2020 for
// Northern, the first new trains the north of England's local lines had
// had in a generation: aluminium cars, the driving cars 24.026 m and the
// intermediate ones 23.350 m, on two trucks each, 2.712 m wide; 100 mph.
// Two double-leaf sliding plug doors a side, a third of the way in from
// each end; a raked cab with no gangway through it.
//   Class 195, diesel: 3.850 m tall, an MTU 6H 1800 R85L of 390 kW under
//   every car, driving through a mechanical transmission. 25 two-car units
//   (195/0, DMSL-DMS, 48.05 m, 124 seats) and 33 three-car (195/1,
//   DMSL-MS-DMS, 71.40 m, 204 seats).
//   Class 331, electric, 25 kV overhead: 3.870 m tall, 780 mm wheels, eight
//   motors of 220 kW in the two driving cars, the pantograph and the
//   transformer on the trailer behind the leading car. 31 three-car units
//   (331/0, DMSL-PTS-DMS, 71.40 m, 184 seats) and 12 four-car (331/1,
//   94.75 m, 260 seats).
// (Wikipedia, "British Rail Class 195" and "British Rail Class 331".)
const CIV = { sill: 3.8, cab: ft(24.026), mid: ft(23.35) };
const D195 = { ...CIV, roof: ft(3.85), no: "195" };
const E331 = { ...CIV, roof: ft(3.87), no: "331" };
const civNose = (r) => [[0.6, 3.2], [0.35, 6.0], ["q", 0.4, 7.2, 1.3, 8.2], [4.2, r - 0.9], ["q", 4.9, r, 6.8, r]];
const civPaint = (o, cab) => ntPaint(o, cab ? sweep(11.5, 18.0, o.sill, o.roof) + path(`M1.2 8.0L4.2 ${o.roof - 0.9}L8.0 ${o.roof - 0.9}L8.0 8.0Z`, NT.band) + yellowEnd(3.2, 3.2, 7.6) : "");
const civDoor = (x) => ({ x, w: 4.4, y0: CIV.sill, y1: 10.9, leaves: 2, glassY: 0.48, glassH: 0.36, grabs: false, fill: NT.blue });
// The windows: panes in three bays, one each side of the doors and a longer
// one between them.
const civRows = (a, d1, d2, b) => [{ xs: [...spread(a, d1 - 0.8, 4.6, 5.5), ...spread(d1 + 5.2, d2 - 0.8, 4.6, 5.5), ...spread(d2 + 5.2, b, 4.6, 5.5)], y: 7.0, w: 4.6, h: 2.9, r: 0.4 }];
// Under the floor: the 195's engine raft and tanks, or the 331's traction
// gear.
const civUnder = (o, g, a) => (o === D195 ? raft(a, a + 15) + boxes(a + 17, g.L - 14, o.sill, 2, 1.3) : boxes(a, g.L - 14, o.sill, 4, 1.4));
function civCab(c, o) {
  const L = c.L, d1 = 20.4, d2 = L - 23.0;
  return unit(c, { roof: o.roof, sill: o.sill, nose: civNose(o.roof), rake: [[1.5, 8.3], [4.0, o.roof - 1.2]], depth: 2.8, cabLen: 9, lampY: 5.0, low: 4.1,
    rows: [{ ...civRows(0, 0, d2, L - 1.6)[0], xs: [...spread(d1 + 5.2, d2 - 0.8, 4.6, 5.5), ...spread(d2 + 5.2, L - 1.6, 4.6, 5.5)] }], doors: [civDoor(d1), civDoor(d2)], trucks: [10.6, L - 9.8], wheel: 31, diaphragm: [4.1, o.roof - 1.1],
    paint: civPaint(o, true), surround: NT.band,
    extra: (cc, g) => fairing(6.8, g.L - 1.0, o.roof, NT.trim) + hvac(30, o.roof + 0.27, 12, 0.55) + (o === D195 ? exhaust(g.L - 8, o.roof + 0.27) : "") + civUnder(o, g, 17) +
      // The cab's side window and door.
      rect(5.2, 8.1, 2.0, 2.4, "#1d2026", 0.4) + rect(8.0, 4.0, 2.0, 7.0, "rgba(0,0,0,0.22)", 0.5) +
      northern(cc, (d1 + 4.4 + d2) / 2, 5.1, 1.7) + classNo(cc, g.L - 9, 4.45, o.no) });
}
function civMid(c, o) {
  const L = c.L, d1 = 21.4, d2 = L - 25.8, pan = !!c.panCar;
  return unit(c, { roof: o.roof, sill: o.sill,
    rows: civRows(1.6, d1, d2, L - 1.6), doors: [civDoor(d1), civDoor(d2)], trucks: [9.8, L - 9.8], wheel: 31, diaphragm: [4.1, o.roof - 1.1],
    paint: civPaint(o, false),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, o.roof, NT.trim) +
      // The 331's pantograph car: the pantograph over one truck, the transformer under the floor.
      (pan ? pantograph(11, o.roof + 0.29, { up: true, facing: -1 }) + hvLine(14, 22, o.roof + 0.29) + hvac(g.L - 27, o.roof + 0.27, 12, 0.55) + boxes(16, g.L - 16, o.sill, 2, 1.6)
        : hvac(g.L / 2 - 6, o.roof + 0.27, 12, 0.55) + (o === D195 ? exhaust(g.L - 8, o.roof + 0.27) + civUnder(o, g, 15) : boxes(18, g.L - 18, o.sill, 2, 1.2))) +
      northern(cc, g.L / 2, 5.1, 1.7) });
}

// ---------- Class 150 Sprinter ----------
// British Rail's first production Sprinter, built by BREL at York in
// 1984-1987 on the Mark 3 coach's body profile: steel cars of 19.741 m
// (150/2; the 150/1's are 19.930 m) on two trucks each, 2.816 m wide,
// 3.774 m tall, the floor 1.144 m over the rail; a Cummins NT855-R5 of
// 213 kW under every car driving through a hydraulic transmission; 75 mph.
// Two double-leaf sliding pocket doors a side, a third of the way in from
// each end, with small hopper-topped windows between; a flat cab, with a
// gangway through its front on the 150/2 (drawn) and none on the 150/1.
// Northern's are of two cars, DMSL-DMS. (Wikipedia, "British Rail Class
// 150".)
const SPR = { roof: ft(3.774), sill: 3.75, car: ft(19.741) };
const NOSE_150 = [[0.4, 3.2], [0.25, 6.4], ["q", 0.25, 8.0, 0.5, 8.8], [1.4, 11.6], ["q", 1.7, SPR.roof, 3.2, SPR.roof]];
const sprPaint = (cab) => ntPaint(SPR, cab ? sweep(9.0, 14.5, SPR.sill, SPR.roof) + path("M0.4 8.2L1.4 11.6L5.4 11.6L5.4 8.2Z", NT.band) + yellowEnd(2.2, 3.2, 7.8) : "");
const sprDoor = (x) => ({ x, w: 4.0, y0: SPR.sill, y1: 10.6, leaves: 2, glassY: 0.5, glassH: 0.34, grabs: false, fill: NT.blue });
const SPR_WIN = { y: 7.1, w: 3.7, h: 2.6, r: 0.3 };
// The hopper vent's bar across the top of each window.
const hoppers = (row) => lines(row.xs.map((x) => [x + 0.15, row.y + row.h - 0.75, x + row.w - 0.15, row.y + row.h - 0.75]), "rgba(255,255,255,0.4)", 0.5);
function sprCab(c) {
  const L = c.L, d1 = 15.6, d2 = L - 20.4;
  const row = { xs: [...spread(d1 + 4.8, d2 - 0.8, 3.7, 4.6), ...spread(d2 + 4.8, L - 1.6, 3.7, 4.6), 9.6], ...SPR_WIN };
  return unit(c, { roof: SPR.roof, sill: SPR.sill, nose: NOSE_150, rake: [[0.7, 8.4], [1.3, 11.3]], depth: 1.8, cabLen: 6, lampY: 5.0, low: 4.1,
    rows: [row], doors: [sprDoor(d1), sprDoor(d2)], trucks: [9.4, L - 9.4], wheel: 33, diaphragm: [4.1, 11.2],
    paint: sprPaint(true), surround: NT.band,
    extra: (cc, g) => fairing(3.4, g.L - 1.0, SPR.roof, NT.trim) + exhaust(g.L - 6, SPR.roof + 0.27) + hoppers(row) +
      raft(15, 28) + boxes(30, g.L - 13, SPR.sill, 2, 1.3) +
      // The cab's side window and door.
      rect(2.6, 8.3, 1.9, 2.2, "#1d2026", 0.4) + rect(5.6, 4.0, 1.9, 6.8, "rgba(0,0,0,0.22)", 0.5) +
      northern(cc, (d1 + 4.0 + d2) / 2, 5.1, 1.6) + classNo(cc, g.L - 8, 4.45, "150") });
}

// ---------- Tables ----------

// Northern's trains are Standard class throughout. Each car of each
// formation is its own type, with its own fact sheet. Diesel multiple
// units are kind "emu" (self-propelled, a cab at each end of the set) with
// no pantograph.
export const TYPES = {
  nt195Cab: { name: "Class 195 end car", kind: "emu" },
  nt1953Cab: { name: "Class 195 end car", kind: "emu" },
  nt1953Mid: { name: "Class 195 middle car", kind: "emu" },
  nt331Cab: { name: "Class 331 end car", kind: "emu" },
  nt331Pan: { name: "Class 331 pantograph car", kind: "emu", pan: true },
  nt3314Cab: { name: "Class 331 end car", kind: "emu" },
  nt3314Pan: { name: "Class 331 pantograph car", kind: "emu", pan: true },
  nt3314Mid: { name: "Class 331 trailer car", kind: "emu" },
  nt150Cab: { name: "Class 150 Sprinter car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const d195Cab = (c) => civCab(c, D195), e331Cab = (c) => civCab(c, E331), e331Pan = (c) => civMid({ ...c, panCar: true }, E331);
export const MODELS = {
  nt195Cab: M(d195Cab, CIV.cab, true),
  nt1953Cab: M(d195Cab, CIV.cab, true),
  nt1953Mid: M((c) => civMid(c, D195), CIV.mid),
  nt331Cab: M(e331Cab, CIV.cab, true),
  nt331Pan: M(e331Pan, CIV.mid),
  nt3314Cab: M(e331Cab, CIV.cab, true),
  nt3314Pan: M(e331Pan, CIV.mid),
  nt3314Mid: M((c) => civMid(c, E331), CIV.mid),
  nt150Cab: M(sprCab, SPR.car, true),
};

// Units by number: 195 001-025 (two cars), 195 101-133 (three), 331 001-031
// (three) and 331 101-112 (four), from Wikipedia. The Class 150 ranges are
// from memory, not checked against a roster: 150 101-150 (150/1) and the
// 150/2s within 150 201-285, some of which belong to other operators. The
// timetable names no unit; these are for the fleet pages.
export const FLEETS = {
  northern: [[195001, 195025, "nt195Cab"], [195101, 195133, "nt1953Cab"], [331001, 331031, "nt331Cab"], [331101, 331112, "nt3314Cab"],
    [150101, 150150, "nt150Cab"], [150201, 150285, "nt150Cab"]],
};

const set = (label, ...units) => ({ label, units });
const C1952 = set("Class 195: two cars, diesel; Standard only",
  ["nt195Cab", 2]);
const C1953 = set("Class 195: three cars, diesel; Standard only",
  ["nt1953Cab", 1], ["nt1953Mid", 1], ["nt1953Cab", 1]);
const C3313 = set("Class 331: three cars, electric; Standard only",
  ["nt331Cab", 1], ["nt331Pan", 1], ["nt331Cab", 1]);
const C3314 = set("Class 331: four cars, electric; Standard only",
  ["nt3314Cab", 1], ["nt3314Pan", 1], ["nt3314Mid", 1], ["nt3314Cab", 1]);
const S150 = set("Class 150 Sprinter: two cars, diesel; Standard only",
  ["nt150Cab", 2]);
const BY_MODEL = {};
for (const k of Object.keys(TYPES)) BY_MODEL[k] = k.startsWith("nt1953") ? C1953 : k.startsWith("nt195") ? C1952 : k.startsWith("nt3314") ? C3314 : k.startsWith("nt331") ? C3313 : S150;

// By the reported unit; else the three-car Class 195, the larger half of
// Northern's newest and most widely spread fleet: Manchester Airport to
// Barrow, Windermere and Liverpool, Leeds to Chester, Manchester, York,
// Nottingham and Lincoln, and the Calder Valley. The Class 331s work the
// wires: Leeds to Doncaster, Skipton, Ilkley and Bradford, Manchester to
// Blackpool, Crewe and Stoke. The Class 150s work stopping trains almost
// everywhere else. The Class 156, 158, 170, 323, 333 and 769 are not
// drawn. The timetable does not say which train is which, so the label
// says "usually".
export const TYPICAL = {
  northern: (t, reported) => BY_MODEL[reported] || C1953,
};

const W195 = "https://en.wikipedia.org/wiki/British_Rail_Class_195";
const W331 = "https://en.wikipedia.org/wiki/British_Rail_Class_331";
const W150 = "https://en.wikipedia.org/wiki/British_Rail_Class_150";
const d195 = { model: "CAF Class 195 Civity", type: "Diesel-mechanical multiple unit", builder: "CAF (Zaragoza, Irun and Newport)", built: "2017–2020",
  topSpeedMph: 100, source: W195 };
const d2 = { ...d195, fleet: "25 two-car units", powerHp: 1046, seats: 124 };
const d3 = { ...d195, fleet: "33 three-car units", powerHp: 1569, seats: 204 };
const e331 = { model: "CAF Class 331 Civity", type: "Electric multiple unit", builder: "CAF (Zaragoza, Irun and Newport)", built: "2017–2020",
  topSpeedMph: 100, powerHp: 2360, source: W331 };
const e3 = { ...e331, fleet: "31 three-car units", seats: 184 };
const e4 = { ...e331, fleet: "12 four-car units", seats: 260 };
const s150 = { model: "BREL Class 150 Sprinter", type: "Diesel-hydraulic multiple unit", builder: "British Rail Engineering Limited (York)", built: "1984–1987",
  fleet: "137 built; Northern's are of two cars", topSpeedMph: 75, powerHp: 570, source: W150 };
export const FACTS = {
  nt195Cab: { ...d2, lengthFt: 157.6,
    about: "A Class 195 driving car. CAF built the class for Northern, which put it in service in 2019 in place of the Pacer railbuses; each car rides on its own MTU diesel engine, at up to 100 mph. A two-car set is 48.05 m long and seats 124, and sets run coupled on the busier trains." },
  nt1953Cab: { ...d3, lengthFt: 234.3,
    about: "A Class 195 driving car. CAF built the class for Northern, which put it in service in 2019 in place of the Pacer railbuses; each car rides on its own MTU diesel engine, at up to 100 mph. A three-car set is 71.40 m long and seats 204." },
  nt1953Mid: { ...d3,
    about: "The three-car Class 195's middle car, with wide double doors a third of the way in from each end and an engine of its own under the floor." },
  nt331Cab: { ...e3, lengthFt: 234.3,
    about: "A Class 331 driving motor car: the Class 195's body under the wires, with four motors under each driving car. In service since 2019 on Northern's electric lines out of Leeds and Manchester. A three-car set is 71.40 m long and seats 184." },
  nt331Pan: { ...e3,
    about: "The middle car, a trailer, carries the set's pantograph and, under its floor, the transformer." },
  nt3314Cab: { ...e4, lengthFt: 310.9,
    about: "A driving motor car of the four-car Class 331, which works the busiest electric trains out of Leeds, to Doncaster, Skipton, Ilkley and Bradford. A four-car set is 94.75 m long and seats 260." },
  nt3314Pan: { ...e4,
    about: "The second car, a trailer, carries the set's pantograph and, under its floor, the transformer." },
  nt3314Mid: { ...e4,
    about: "A trailer car, with wide double doors a third of the way in from each end." },
  nt150Cab: { ...s150, lengthFt: 129.5,
    about: "A Class 150 driving car. British Rail's first production Sprinter, on the Mark 3 coach's body profile, with wide double doors for stopping trains; Northern's two-car sets seat 124 to 149 and work local trains across the north of England, each car on its own Cummins diesel engine, alone or coupled." },
};
