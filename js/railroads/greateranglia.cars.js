// Greater Anglia's cars (scripts/railroads/gb.py, "greateranglia"): the
// whole fleet was replaced in 2019-2024 by three new trains, all drawn here.
// The Class 745 (Stadler FLIRT, twelve articulated cars, electric) of the
// Norwich intercity trains and the Stansted Express; the Class 755 (the
// FLIRT's bi-mode sister, three or four cars round a diesel power pack) of
// the rural lines of Norfolk, Suffolk and Cambridgeshire; and the Class 720
// (Bombardier/Alstom Aventra, five cars, electric) of the commuter lines out
// of London Liverpool Street. The timetable names no unit, so a train is
// drawn as the model that usually runs it, labeled as typical. Trainsheet's
// own side views from published dimensions, at the shared scale
// (js/carart.js), in Greater Anglia's white, gray and red, lettered here (no
// logo files). The toolkit from avanti.cars.js; the FLIRT is drawn again
// here in its Anglian form and paint (Transport for Wales' copy is not
// exported), and the Aventra likewise (West Midlands Trains' has a gangwayed
// cab; the 720's front is closed).

import { rect, path, lines, pantograph } from "../carart.js?v=dev";
import { seq, bands, boxes, ft, spread, yellowEnd, fairing, unit, letters, hvac, hvLine, exhaust } from "./avanti.cars.js?v=dev";

// ---------- Paint ----------
// Greater Anglia's livery on the new trains (the map's red is #d70428),
// drawn from memory of the trains, not checked against photographs: white
// sides under a gray roof, the windows in a near-black band that runs
// forward into the windshield mask, a charcoal skirt; red doors; a dark gray
// cab end behind a yellow front panel. On the side the name in lower case,
// run together: "greateranglia".
const GA = { white: "#f1f2f3", red: "#d70428", deep: "#a80320", roof: "#8a9098", band: "#1b1c21", skirt: "#2c2e35", trim: "#b6bbc2", ink: "#3a3d45",
  cabGray: "#4a4e57", note: "#6c7280", grille: "#3a3d45" };
const gaName = (c, x, y, h) => letters(c, x, y, h, "greateranglia", GA.ink, { weight: 700, spacing: "-0.02em" });
// A unit's class number, small in gray near the skirt.
const classNo = (c, x, y, text) => letters(c, x, y, 0.36, text, GA.note, { weight: 600, spacing: "0.06em" });
// The cab end: dark gray from the front back to x = a at the skirt, its edge
// leaning back to x = b at the roof, a red line along it.
const grayEnd = (a, b, sill, roof) => path(`M-1 ${sill}L${a} ${sill}L${b} ${roof + 1}L-1 ${roof + 1}Z`, GA.cabGray) +
  path(`M${a} ${sill}L${b} ${roof + 1}L${b + 0.7} ${roof + 1}L${a + 0.7} ${sill}Z`, GA.red);
// The side: white, the window band from x = a to b, a gray roof, the skirt.
const gaPaint = (o, a, b, cabArt = "") => (c, g) => bands(g.L, [[0, 20, GA.white], [o.roof - 0.6, 3, GA.roof], [0, o.sill, GA.skirt]]) +
  rect(a, o.win - 0.3, (b < 0 ? g.L + b : b) - a, o.winH + 0.6, GA.band) + cabArt;

// ---------- Stadler FLIRT: Classes 745 and 755 ----------
// Stadler's FLIRT for East Anglia, built at Bussnang in 2018-2020:
// articulated aluminium cars on shared (Jakobs) trucks, 3.915 m tall and
// 2.720 m wide, the floor low, 960 mm over the rail, level with the platform
// at every door; one double-leaf sliding plug door a side on each car, each
// 1.3 m wide; powered wheels 870 mm, carrying wheels 760 mm; 100 mph; 25 kV
// 50 Hz overhead.
// Class 745: twelve cars, 236.6 m, 5,200 kW at the wheel, electric only. Ten
// 745/0 for the Norwich intercity trains (704 seats, 80 of them First) and
// ten 745/1 for the Stansted Express (722 seats, all Standard); 745 001-010
// and 745 101-110.
// Class 755: bi-mode, the passenger cars round a short power pack 2.822 m
// wide that holds Deutz 16-liter V8 diesel engines and a passage through
// its middle; 2,600 kW under the wire. Fourteen 755/3 (three cars and the
// pack, DMSO-PP-PTSOW-DMSO, 65.0 m, two engines, 960 kW, 144 seats), 755
// 325-338, and twenty-four 755/4 (four cars and the pack, 80.7 m, four
// engines, 1,920 kW, 202 seats), 755 401-424.
// (Wikipedia, "British Rail Class 745" and "British Rail Class 755". The 755
// infobox's car lengths, 21.31 m driving cars, 15.7 m trailers and a 6.690 m
// power pack, are marked unsourced there but sum to both published train
// lengths. The 745's is not given: with the same 21.31 m end cars, ten
// intermediate cars of 19.4 m make up the 236.6 m. The 745 is drawn with
// every joint on a shared truck; the real train is two six-car halves.
// Which 745 cars carry the pantographs and First class is from memory.)
const FL = { sill: 3.15, roof: ft(3.915), win: 6.5, winH: 3.3, cab: ft(21.31), mid: ft(15.7), long: ft(19.4), pp: ft(6.69) };
const NOSE_FL = [[0.8, 2.6], [0.45, 4.6], ["q", 0.5, 6.4, 2.2, 7.8], [6.2, FL.roof - 1.0], ["q", 7.2, FL.roof, 9.6, FL.roof]];
const flDoor = (x) => ({ x, w: 4.3, y0: FL.sill, y1: 10.5, leaves: 2, glassY: 0.42, glassH: 0.42, grabs: false, fill: GA.red });
const flRow = (xs) => [{ xs, y: FL.win, w: 5.2, h: FL.winH, r: 0.45 }];
const flBay = (a, b) => spread(a, b, 5.2, 6.1);
// The roof: a long equipment fairing between the car's ends.
const flRoof = (a, b) => fairing(a, b, FL.roof, GA.trim) + rect(a + 1.5, FL.roof + 0.27, b - a - 3, 0.6, GA.roof, 0.4, 'rx="0.2"');
// A yellow stripe over the windows marks First class.
const firstStripe = (a, b) => rect(a, FL.win + FL.winH + 0.55, b - a, 0.3, "#f6d000");
// The driving car: the motor truck under the cab, one door behind the
// saloon's first bay. o.no: the class number; o.first: First class.
function flCab(c, o) {
  const L = c.L, d = L / 2 + 6;
  return unit(c, { roof: FL.roof, sill: FL.sill, nose: NOSE_FL, rake: [[2.4, 8.0], [5.8, FL.roof - 1.3]], depth: 3.0, cabLen: 11, lampY: 4.6, low: 3.6,
    rows: flRow([...flBay(14.4, d - 0.8), ...flBay(d + 5.1, L - 1.4)]), doors: [flDoor(d)], trucks: [9.6, "end"], wheel: 34,
    diaphragm: [3.6, FL.roof - 1.1],
    paint: gaPaint(FL, 13.6, -1, grayEnd(9.6, 13.4, FL.sill, FL.roof) + path(`M2.0 7.7L6.2 ${FL.roof - 1.0}L10.4 ${FL.roof - 1.0}L10.4 7.7Z`, GA.band) + yellowEnd(3.4, 2.8, 7.3)),
    surround: GA.band,
    extra: (cc, g) => flRoof(9.8, g.L - 0.8) + boxes(26, g.L - 8, FL.sill, 2, 1.1) +
      // The cab's side window.
      rect(7.4, 7.9, 2.4, 2.5, "#1d2026", 0.4) + (o.first ? firstStripe(14.4, d - 0.8) : "") +
      gaName(cc, (14.4 + d) / 2, 4.2, 1.1) + classNo(cc, g.L - 7, 3.6, o.no) });
}
// An intermediate car, a shared truck at each end, its door in the middle.
// o.pan: the pantograph on its roof, raised.
function flMid(c, o = {}) {
  const L = c.L, d = L / 2 - 2.15;
  return unit(c, { roof: FL.roof, sill: FL.sill,
    rows: flRow([...flBay(1.4, d - 0.8), ...flBay(d + 5.1, L - 1.4)]), doors: [flDoor(d)], trucks: ["start", "end"], wheel: 30, diaphragm: [3.6, FL.roof - 1.1],
    paint: gaPaint(FL, 0.8, -0.8),
    extra: (cc, g) => (o.pan ? fairing(0.8, g.L - 0.8, FL.roof, GA.trim) + pantograph(9, FL.roof + 0.29, { up: true, facing: -1 }) + hvLine(12, 20, FL.roof + 0.29) +
        rect(22, FL.roof + 0.27, g.L - 24.5, 0.6, GA.roof, 0.4, 'rx="0.2"') : flRoof(0.8, g.L - 0.8)) +
      boxes(8, g.L - 8, FL.sill, 2, 1.1) + (o.first ? firstStripe(1.4, g.L - 1.4) : "") + gaName(cc, g.L * 0.25, 4.2, 0.8) });
}
// The 755's power pack: no seats, a passage through the middle; behind the
// louvers on each side the diesel engines, their exhausts on the roof.
function flPack(c) {
  return unit(c, { roof: FL.roof, sill: FL.sill, rows: [], doors: [], trucks: ["start", "end"], wheel: 30, diaphragm: [3.6, FL.roof - 1.1],
    paint: (cc, g) => bands(g.L, [[0, 20, GA.white], [FL.roof - 0.6, 3, GA.roof], [0, FL.sill, GA.skirt]]),
    extra: (cc, g) => fairing(0.8, g.L - 0.8, FL.roof, GA.trim) + exhaust(g.L * 0.3, FL.roof + 0.27) + exhaust(g.L * 0.7, FL.roof + 0.27) +
      [2.2, g.L / 2 + 0.6].map((x) => rect(x, 4.4, g.L / 2 - 2.8, 6.6, GA.grille, 0.4, 'rx="0.25"') +
        lines(seq(4.9, 0.55, 11).map((y) => [x + 0.4, y, x + g.L / 2 - 3.2, y]), "rgba(255,255,255,0.2)", 0.4)).join("") +
      classNo(cc, g.L / 2, 3.6, "PP") });
}

// ---------- Bombardier Aventra: Class 720 ----------
// The Aventra for Greater Anglia's commuter lines, built at Derby (Litchurch
// Lane) by Bombardier and, from 2021, Alstom; in service from 2020. Five
// aluminium cars on two trucks each (DMS-PMSL-MS-MS-DTS), about 122 m over
// all, two double-leaf sliding plug doors a side on each car, 3+2 seats
// under the windows: 490 seats and 145 standing; 100 mph; 25 kV 50 Hz
// overhead, the pantograph on the second car. 133 units with Greater
// Anglia: 720 101-144 and 720 501-589. (Wikipedia, "British Rail Class
// 720". Car lengths, 24.47 m driving cars and 24.21 m intermediates, the
// 2.78 m width and the height, about 3.87 m, are from memory, as the unit
// ranges are.)
const AVT = { sill: 3.8, roof: ft(3.87), win: 7.0, winH: 2.9, cab: ft(24.47), mid: ft(24.21) };
// The closed front, raked back over the windshield.
const NOSE_AVT = [[0.6, 3.1], [0.35, 5.6], ["q", 0.4, 7.4, 1.6, 8.6], [4.0, AVT.roof - 1.0], ["q", 4.7, AVT.roof, 6.8, AVT.roof]];
const avDoor = (x) => ({ x, w: 4.6, y0: AVT.sill, y1: 10.9, leaves: 2, glassY: 0.48, glassH: 0.36, grabs: false, fill: GA.red });
const avBay = (a, b) => spread(a, b, 5.0, 5.7);
const avRow = (xs) => [{ xs, y: AVT.win, w: 5.0, h: AVT.winH, r: 0.4 }];
function avCab(c) {
  const L = c.L, d1 = 21.0, d2 = L - 23.4;
  return unit(c, { roof: AVT.roof, sill: AVT.sill, nose: NOSE_AVT, rake: [[1.8, 8.6], [3.8, AVT.roof - 1.3]], depth: 2.4, cabLen: 9, lampY: 5.0, low: 4.1,
    rows: avRow([...avBay(d1 + 5.4, d2 - 0.8), ...avBay(d2 + 5.4, L - 1.6)]), doors: [avDoor(d1), avDoor(d2)], trucks: [11.2, L - 9.8], wheel: 33,
    diaphragm: [4.1, AVT.roof - 1.1],
    paint: gaPaint(AVT, d1 + 4.6, -1, grayEnd(11.6, 15.2, AVT.sill, AVT.roof) + path(`M1.4 8.4L4.0 ${AVT.roof - 1.0}L8.4 ${AVT.roof - 1.0}L8.4 8.4Z`, GA.band) + yellowEnd(2.8, 3.1, 8.0)),
    surround: GA.band,
    extra: (cc, g) => fairing(7.0, g.L - 1.0, AVT.roof, GA.trim) + hvac(30, AVT.roof + 0.27, 12, 0.55) + boxes(17, g.L - 14, AVT.sill, 4, 1.4) +
      // The cab's side window and door.
      rect(5.6, 8.5, 2.2, 2.2, "#1d2026", 0.4) + rect(8.8, 4.0, 1.9, 6.9, "rgba(0,0,0,0.22)", 0.5) +
      gaName(cc, (d1 + 4.6 + d2) / 2, 4.7, 1.1) + classNo(cc, g.L - 8.5, 4.35, "720") });
}
// o.pan: the pantograph over one truck, the transformer under the floor.
function avMid(c, o = {}) {
  const L = c.L, d1 = 20.6, d2 = L - 25.2;
  return unit(c, { roof: AVT.roof, sill: AVT.sill,
    rows: avRow([...avBay(1.6, d1 - 0.8), ...avBay(d1 + 5.4, d2 - 0.8), ...avBay(d2 + 5.4, L - 1.6)]), doors: [avDoor(d1), avDoor(d2)],
    trucks: [9.8, L - 9.8], wheel: 33, diaphragm: [4.1, AVT.roof - 1.1],
    paint: gaPaint(AVT, 1.0, -1),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, AVT.roof, GA.trim) +
      (o.pan ? pantograph(11, AVT.roof + 0.29, { up: true, facing: -1 }) + hvLine(14, 22, AVT.roof + 0.29) + hvac(g.L - 27, AVT.roof + 0.27, 12, 0.55) + boxes(16, g.L - 16, AVT.sill, 2, 1.6)
        : hvac(g.L / 2 - 6, AVT.roof + 0.27, 12, 0.55) + boxes(16, g.L - 14, AVT.sill, 4, 1.4)) +
      gaName(cc, (d1 + 4.6 + d2) / 2, 4.7, 1.1) });
}

// ---------- Tables ----------

// Each car of each formation is its own type, with its own fact sheet. The
// 755 is kind "emu" like the others: self-propelled, a cab at each end, and
// under the wire wherever there is one.
export const TYPES = {
  ga745First: { name: "Class 745 FLIRT First end car", kind: "emu", amenities: ["first"] },
  ga745FirstMid: { name: "Class 745 FLIRT First car", kind: "emu", pan: true, amenities: ["first"] },
  ga745Mid: { name: "Class 745 FLIRT Standard car", kind: "emu" },
  ga745Pan: { name: "Class 745 FLIRT Standard car with pantograph", kind: "emu", pan: true },
  ga745Cab: { name: "Class 745 FLIRT Standard end car", kind: "emu" },
  ga7554Cab: { name: "Class 755 FLIRT end car", kind: "emu" },
  ga7554Mid: { name: "Class 755 FLIRT pantograph car", kind: "emu", pan: true },
  ga7554Pack: { name: "Class 755 FLIRT power pack", kind: "emu" },
  ga7553Cab: { name: "Class 755 FLIRT end car", kind: "emu" },
  ga7553Mid: { name: "Class 755 FLIRT pantograph car", kind: "emu", pan: true },
  ga7553Pack: { name: "Class 755 FLIRT power pack", kind: "emu" },
  ga720Cab: { name: "Class 720 Aventra end car", kind: "emu" },
  ga720Pan: { name: "Class 720 Aventra pantograph car", kind: "emu", pan: true },
  ga720Mid: { name: "Class 720 Aventra middle car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  ga745First: M((c) => flCab(c, { no: "745", first: true }), FL.cab, true),
  ga745FirstMid: M((c) => flMid(c, { pan: true, first: true }), FL.long),
  ga745Mid: M((c) => flMid(c), FL.long),
  ga745Pan: M((c) => flMid(c, { pan: true }), FL.long),
  ga745Cab: M((c) => flCab(c, { no: "745" }), FL.cab, true),
  ga7554Cab: M((c) => flCab(c, { no: "755" }), FL.cab, true),
  ga7554Mid: M((c) => flMid(c, { pan: true }), FL.mid),
  ga7554Pack: M(flPack, FL.pp),
  ga7553Cab: M((c) => flCab(c, { no: "755" }), FL.cab, true),
  ga7553Mid: M((c) => flMid(c, { pan: true }), FL.mid),
  ga7553Pack: M(flPack, FL.pp),
  ga720Cab: M(avCab, AVT.cab, true),
  ga720Pan: M((c) => avMid(c, { pan: true }), AVT.mid),
  ga720Mid: M((c) => avMid(c), AVT.mid),
};

// Units by number, for the fleet pages (the timetable names no unit): the
// 745 and 755 ranges from Wikipedia's infoboxes, the 720's from memory. The
// Stansted Express 745/1s are all Standard; they are listed with the
// intercity sets and drawn as one.
export const FLEETS = {
  greateranglia: [[720101, 720144, "ga720Cab"], [720501, 720589, "ga720Cab"], [745001, 745010, "ga745Cab"], [745101, 745110, "ga745Cab"],
    [755325, 755338, "ga7553Cab"], [755401, 755424, "ga7554Cab"]],
};

const set = (label, ...units) => ({ label, units });
const A720 = set("Class 720 Aventra: five cars, electric; Standard only",
  ["ga720Cab", 1], ["ga720Pan", 1], ["ga720Mid", 2], ["ga720Cab", 1]);
const F745 = set("Class 745 FLIRT: twelve cars, electric; First at one end",
  ["ga745First", 1], ["ga745FirstMid", 1], ["ga745Mid", 8], ["ga745Pan", 1], ["ga745Cab", 1]);
const F7554 = set("Class 755 FLIRT: four cars round a power pack, electric and diesel; Standard only",
  ["ga7554Cab", 1], ["ga7554Mid", 1], ["ga7554Pack", 1], ["ga7554Mid", 1], ["ga7554Cab", 1]);
const F7553 = set("Class 755 FLIRT: three cars and a power pack, electric and diesel; Standard only",
  ["ga7553Cab", 1], ["ga7553Pack", 1], ["ga7553Mid", 1], ["ga7553Cab", 1]);
const BY_MODEL = {};
for (const k of Object.keys(TYPES)) BY_MODEL[k] = k.startsWith("ga720") ? A720 : k.startsWith("ga745") ? F745 : k.startsWith("ga7553") ? F7553 : F7554;

// By the reported unit; else the Class 720, by far the largest fleet (133
// units), which works the commuter trains out of Liverpool Street to
// Southend, Colchester, Clacton, Ipswich, Hertford East and Cambridge,
// alone or coupled in pairs. The 745s work London-Norwich and the Stansted
// Express, the 755s the lines without wires. The timetable does not say
// which train is which, so the label says "usually".
export const TYPICAL = {
  greateranglia: (t, reported) => BY_MODEL[reported] || A720,
};

const W720 = "https://en.wikipedia.org/wiki/British_Rail_Class_720";
const W745 = "https://en.wikipedia.org/wiki/British_Rail_Class_745";
const W755 = "https://en.wikipedia.org/wiki/British_Rail_Class_755";
const f720 = { model: "Alstom Class 720 Aventra", type: "Electric multiple unit", builder: "Bombardier, Alstom (Derby)", built: "2018–2024",
  fleet: "133 five-car units", topSpeedMph: 100, seats: 490, source: W720 };
const f745 = { model: "Stadler Class 745 FLIRT", type: "Electric multiple unit", builder: "Stadler (Bussnang)", built: "2018–2020",
  fleet: "20 twelve-car units", topSpeedMph: 100, powerHp: 6973, seats: 704, source: W745 };
const f755 = { model: "Stadler Class 755 FLIRT", type: "Bi-mode (electric and diesel-electric) multiple unit", builder: "Stadler (Bussnang)", built: "2018–2020",
  topSpeedMph: 100, powerHp: 3487, source: W755 };
const f7554 = { ...f755, fleet: "24 four-car units", seats: 202 };
const f7553 = { ...f755, fleet: "14 three-car units", seats: 144 };
const packAbout = (k) => `The power pack, a short car with no seats: ${k} Deutz V8 diesel engines and their generators beside a passage that passengers walk through between the halves of the train. Away from the wires they feed the same motors the pantograph does.`;
export const FACTS = {
  ga720Cab: { ...f720, lengthFt: 400.3,
    about: "A Class 720 driving car. The Aventra, built at Derby, replaced Greater Anglia's older commuter trains from 2020: five cars, about 122 m, with 490 seats arranged three and two across, at up to 100 mph. Two sets often run coupled as a ten-car train." },
  ga720Pan: { ...f720,
    about: "The second car carries the set's pantograph and, under its floor, the transformer; it also has the lavatory." },
  ga720Mid: { ...f720,
    about: "A middle car: two wide double doors a side and seats three and two across." },
  ga745First: { ...f745, lengthFt: 776.2,
    about: "A Class 745 driving car, here at the First class end of an intercity set. Stadler built twenty of these twelve-car articulated trains, 236.6 m long: ten for London–Norwich, with 704 seats of which 80 are First, and ten all-Standard sets with 722 seats for the Stansted Express. The floor is level with the platform at every door." },
  ga745FirstMid: { ...f745,
    about: "First class, seated two and one across. Each car shares a truck with its neighbor and has one wide double door a side." },
  ga745Mid: { ...f745,
    about: "A Standard class car, sharing a truck with its neighbor at each end, with one wide double door a side." },
  ga745Pan: { ...f745,
    about: "A Standard class car with one of the train's pantographs on its roof." },
  ga745Cab: { ...f745, lengthFt: 776.2,
    about: "The Standard class driving car. The Stansted Express sets are Standard from end to end." },
  ga7554Cab: { ...f7554, lengthFt: 264.8,
    about: "A Class 755 driving motor car: the truck under the cab is driven, fed from the overhead wire where there is one and from the power pack where there is not. The four-car set is 80.7 m long and seats 202; with the three-car sets it took over every rural line in East Anglia in 2019–2020." },
  ga7554Mid: { ...f7554,
    about: "A trailer car with a pantograph on its roof, sharing a truck with its neighbor at each end; one wide double door a side." },
  ga7554Pack: { ...f7554, about: packAbout("four") },
  ga7553Cab: { ...f7553, lengthFt: 213.3,
    about: "A Class 755 driving motor car of a three-car set, 65.0 m long with 144 seats: the truck under the cab is driven, fed from the overhead wire where there is one and from the power pack where there is not." },
  ga7553Mid: { ...f7553,
    about: "The trailer car, with the pantograph on its roof, the wheelchair spaces and the accessible toilet." },
  ga7553Pack: { ...f7553, about: packAbout("two") },
};
