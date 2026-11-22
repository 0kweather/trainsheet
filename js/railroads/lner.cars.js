// LNER's cars (scripts/railroads/gb.py, "lner"): London North Eastern
// Railway's East Coast Main Line trains, the Hitachi Azuma (Classes 800 and
// 801, five and nine cars) and the InterCity 225 (a Class 91 locomotive,
// nine Mark 4 coaches and a driving van trailer). The timetable names no
// unit, so a train is drawn as the model that usually runs it, labeled as
// typical. Trainsheet's own side views from published dimensions, at the
// shared scale (js/carart.js), in LNER's red and white, lettered here (no
// logo files). The toolkit and the Hitachi AT300 body from avanti.cars.js.

import { rect, path, lines, poly, slats, pantograph } from "../carart.js?v=dev";
import { seq, bands, boxes, ft, spread, leaf, yellowEnd, fairing, unit, letters, hvac, hvLine, AT300, at300Cab, at300Mid } from "./avanti.cars.js?v=dev";

// ---------- Paint ----------
// LNER since June 2018 (its red is #ce0e2d). The Azuma: white sides, the
// windows in a charcoal band, a broad red stripe along the bottom of the
// side; on each driving car the red rises from the stripe in a long curve
// to cover the whole cab end, nose and roof, round a black windshield, with
// no yellow panel; red doors; "LNER" in red on the white by the doors and
// "AZUMA" in white on the red behind the cab. The InterCity 225, in the
// paint LNER took over from Virgin Trains East Coast: red from the windows
// up, white below them, a charcoal skirt and roof; the locomotive and the
// van red at the cab, a yellow panel under the windshield.
const LN = { red: "#ce0e2d", deep: "#a50b24", white: "#f4f4f3", band: "#22252a", skirt: "#2a2d31", roof: "#3a3f45", gray: "#c9cdd2", gold: "#c8a45a" };
// LNER's name: four heavy capitals, close-set; h ft tall, centered on x.
const lner = (c, x, y, h, fill) => letters(c, x, y, h, "LNER", fill, { weight: 800, spacing: "0.02em" });
// A car's class over its windows: "FIRST" in gold (Standard goes unmarked).
const classMark = (c, x, y, cls) => (cls === "first" ? letters(c, x, y, 0.6, "FIRST", LN.gold, { weight: 700, spacing: "0.14em" }) : "");

// ---------- Azuma (Hitachi AT300, Classes 800 and 801) ----------
// Body and dimensions in avanti.cars.js: 26.0 m cars, driving cars 25.85 m,
// 2.7 m wide; five cars 129.7 m, nine 233.7 m. (Wikipedia, "British Rail
// Class 800", "British Rail Class 801".) The 800s are bi-mode, an MTU
// diesel under each motor car (three of a five-car set's cars, five of a
// nine-car's); the 801s are electric, with one engine for emergencies.
const AZUMA = {
  door: LN.red, surround: LN.band, roofTrim: "#565d64",
  paint: (cab) => (c, g) => bands(g.L, [[0, 20, LN.white], [11.3, 3, LN.roof], [6.4, 3.45, LN.band], [0, 5.0, LN.red], [0, 3.7, LN.skirt]]) +
    // The cab end: red from the nose back, falling in a long curve to the
    // stripe; the windshield's black mask.
    (cab ? path("M-1 2.9L-1 13L21.5 13Q27.5 9.6 34.0 5.0L34.0 3.7L-1 3.7Z", LN.red) +
      path("M3.0 7.1Q7.4 8.9 11.6 10.7L18.6 10.7L18.6 7.2L10.0 7.0Q6.0 7.0 3.0 7.1Z", LN.band) : ""),
  over: (c, g, cab) => (cab ? letters(c, 13.6, 5.2, 1.0, "AZUMA", LN.white, { weight: 700, spacing: "0.16em" }) + lner(c, g.L - 9.6, 5.35, 1.15, LN.red) +
      letters(c, g.L - 16, 4.1, 0.36, c.cls80x || "", LN.white, { weight: 600, spacing: "0.06em" })
    : lner(c, 8.6, 5.35, 1.15, LN.red)) +
    classMark(c, cab ? 52 : g.L / 2, 10.55, c.cls) + (c.cls === "comp" ? classMark(c, g.L * 0.28, 10.55, "first") : ""),
};

// ---------- InterCity 225 ----------
// British Rail's East Coast electric train of 1988-1991, built for 225 km/h
// (140 mph) and run at 125. The Class 91 (BREL Crewe for GEC): 19.4 m,
// Bo'Bo', 2.74 m wide, 3.757 m tall, 970 mm wheels; a raked, streamlined
// No. 1 cab and a blunt No. 2 end against the train; the pantograph over
// the blunt end. The Mark 4 coach (Metro-Cammell, 1989-1992): 23.0 m,
// 2.73 m wide, 3.79 m tall, the sides leaning in above the waist; one plug
// door a side at each end. The driving van trailer: 18.83 m, the 91's cab
// and outline on a luggage van. (Wikipedia, "British Rail Class 91",
// "British Rail Mark 4", "InterCity 225".)
const IC = { roof: 12.4, sill: 3.8, loco: ft(19.4), coach: ft(23.0), dvt: ft(18.83) };
const NOSE_91 = [[0.9, 3.3], [0.55, 5.0], ["q", 0.6, 6.3, 2.2, 7.3], [7.8, 11.5], ["q", 8.8, 12.4, 11.0, 12.4]];
const icPaint = (cab) => (c, g) => bands(g.L, [[0, 20, LN.red], [11.75, 3, LN.roof], [0, 6.2, LN.white], [0, 3.8, LN.skirt]]) +
  // The cab end: all red, the white starting behind the cab door on a
  // slant; charcoal round the windshield; the yellow panel.
  (cab ? path("M-1 3.3L-1 6.3L17.0 6.3L14.2 3.8Z", LN.red) + path("M2.6 7.5Q5.6 9.6 7.8 11.5L13.4 11.5L13.4 7.4Z", LN.band) + yellowEnd(4.6, 3.3, 6.6) : "");
// The cab's side window and door, as on both the 91 and the van.
const icCabSide = () => path(poly([[9.6, 8.0], [12.6, 8.0], [12.6, 10.3], [11.2, 10.3]]), "#1d2026", 0.4) + rect(14.0, 4.0, 2.1, 7.0, "rgba(0,0,0,0.12)", 0.5);
const icNose = { nose: NOSE_91, rake: [[2.9, 7.9], [7.2, 11.2]], depth: 3.0, cabLen: 13, lampY: 4.9, low: 4.1, surround: LN.band };
function loco91(c) {
  const L = c.L;
  return unit(c, { roof: IC.roof, sill: IC.sill, ...icNose, rows: [], doors: [], trucks: [13.4, L - 11.4], wheel: 38, diaphragm: [4.2, 11.0], paint: icPaint(true),
    extra: (cc, g) => fairing(11.0, g.L - 1.0, IC.roof, "#565d64") + pantograph(g.L - 13, IC.roof + 0.29, { up: true, facing: -1 }) + hvLine(g.L - 30, g.L - 16, IC.roof + 0.29) +
      // The machine room: louvers high on the side; the transformer slung
      // between the trucks.
      seq(21, 8.6, 3).map((x) => rect(x, 8.3, 6.6, 2.6, LN.deep, 0.4, 'rx="0.2"') + slats(x + 0.4, 8.6, 5.8, 2.0, 0.42, "rgba(0,0,0,0.3)")).join("") +
      rect(22, 1.5, g.L - 44, 2.4, "currentColor", 0, 'rx="0.3" opacity="0.85"') + icCabSide() +
      lner(cc, g.L - 17, 4.75, 1.3, LN.red) + letters(cc, 24, 4.3, 0.4, "91", LN.red, { weight: 600, spacing: "0.06em" }) });
}
// The Mark 4's windows: long panes, eight a car, in the red.
const mk4Door = (x) => leaf(x, IC.sill, 10.9, 2.7, LN.red);
function mark4(c) {
  const L = c.L;
  return unit(c, { roof: IC.roof, sill: IC.sill, rows: [{ xs: spread(7.4, L - 7.4, 5.2, 7.5), y: 7.0, w: 5.2, h: 2.7, r: 0.45 }],
    doors: [mk4Door(1.9), mk4Door(L - 4.6)], trucks: [9.6, L - 9.6], wheel: 36, diaphragm: [4.0, 11.2], paint: icPaint(false),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, IC.roof, "#565d64") + hvac(g.L / 2 - 7, IC.roof + 0.27, 14, 0.5) + boxes(16, g.L - 16, IC.sill, 3, 1.3) +
      lner(cc, g.L / 2, 4.75, 1.3, LN.red) + classMark(cc, g.L / 2, 10.75, cc.cls) +
      (cc.cls === "cafe" ? letters(cc, g.L * 0.72, 10.75, 0.6, "CAFÉ BAR", LN.white, { weight: 700, spacing: "0.14em" }) : "") });
}
function dvt(c) {
  const L = c.L;
  return unit(c, { roof: IC.roof, sill: IC.sill, ...icNose, rows: [], doors: [], trucks: [13.4, L - 9.6], wheel: 36, diaphragm: [4.0, 11.2], paint: icPaint(true),
    extra: (cc, g) => fairing(11.0, g.L - 1.0, IC.roof, "#565d64") + boxes(20, g.L - 15, IC.sill, 2, 1.3) + icCabSide() +
      // The van: two roller-shuttered luggage doors a side, no windows.
      [24, g.L - 17].map((x) => rect(x, 4.0, 6.2, 7.0, LN.deep, 0.4) + lines(seq(4.5, 0.5, 13).map((y) => [x + 0.2, y, x + 6.0, y]), "rgba(0,0,0,0.22)", 0.4)).join("") +
      lner(cc, (24 + 6.2 + g.L - 17) / 2, 8.4, 1.5, LN.white) });
}

// ---------- Tables ----------

// LNER's classes: First (2+1) and Standard (2+2). An Azuma has First in one
// driving car (with the kitchen) and part of the next car in a five-car
// set, or the whole of the next and part of the third in a nine-car one. An
// InterCity 225 has First in the three coaches next to the van, at the
// London end, then the café bar coach, then Standard to the locomotive.
// Each Azuma fleet is its own set of types, so that a reported unit draws
// at its own length, with or without its engines.
const AZ = {
  ln8012: { cls: "801", name: "Class 801 Azuma", cars: 9, engines: [] },
  ln8011: { cls: "801", name: "Class 801 Azuma", cars: 5, engines: [] },
  ln8001: { cls: "800", name: "Class 800 Azuma", cars: 9, engines: [1, 2, 4, 6, 7] },
  ln8002: { cls: "800", name: "Class 800 Azuma", cars: 5, engines: [1, 2, 3] },
};
export const TYPES = {
  ln91: { name: "Class 91 electric locomotive", kind: "electric", pan: true },
  lnMk4: { name: "Mark 4 Standard coach", kind: "coach" },
  lnMk4Cafe: { name: "Mark 4 Standard coach with café bar", kind: "coach", amenities: ["cafe"] },
  lnMk4First: { name: "Mark 4 First coach", kind: "coach", amenities: ["first"] },
  lnDvt: { name: "Mark 4 driving van trailer", kind: "coach", cab: true },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => `${ctx.index}/${ctx.count}`;
export const MODELS = {
  ln91: M(loco91, IC.loco, true),
  lnMk4: M(mark4, IC.coach),
  lnMk4Cafe: M((c) => mark4({ ...c, cls: "cafe" }), IC.coach),
  lnMk4First: M((c) => mark4({ ...c, cls: "first" }), IC.coach),
  lnDvt: M(dvt, IC.dvt, true),
};
for (const [k, f] of Object.entries(AZ)) {
  const az = (c, more) => ({ ...c, cls80x: f.cls, engine: f.engines.includes(c.index), ...more });
  TYPES[`${k}First`] = { name: `${f.name} First end car`, kind: "emu", pan: true, amenities: ["first"] };
  TYPES[`${k}FirstMid`] = { name: `${f.name} First car`, kind: "emu", amenities: ["first"] };
  TYPES[`${k}Comp`] = { name: `${f.name} First and Standard car`, kind: "emu", amenities: ["first"] };
  TYPES[`${k}Mid`] = { name: `${f.name} Standard car`, kind: "emu" };
  TYPES[`${k}Cab`] = { name: `${f.name} Standard end car`, kind: "emu", pan: true };
  MODELS[`${k}First`] = M((c) => at300Cab(az(c, { cls: "first", pan: true, engine: false }), AZUMA), AT300.cab, true);
  MODELS[`${k}FirstMid`] = M((c) => at300Mid(az(c, { cls: "first" }), AZUMA), AT300.mid, false, byIndex);
  MODELS[`${k}Comp`] = M((c) => at300Mid(az(c, { cls: "comp" }), AZUMA), AT300.mid, false, byIndex);
  MODELS[`${k}Mid`] = M((c) => at300Mid(az(c), AZUMA), AT300.mid, false, byIndex);
  MODELS[`${k}Cab`] = M((c) => at300Cab(az(c, { pan: false, engine: false }), AZUMA), AT300.cab, true);
}

// Units by number: 800 101-113 (nine cars, bi-mode), 800 201-210 (five,
// bi-mode), 801 101-112 (five, electric), 801 201-230 (nine, electric); the
// Class 91s 91 101-132 as renumbered, of which about a dozen remain. The
// timetable names no unit; these are for the fleet pages.
export const FLEETS = {
  lner: [[800101, 800113, "ln8001First"], [800201, 800210, "ln8002First"], [801101, 801112, "ln8011First"], [801201, 801230, "ln8012First"],
    [91101, 91132, "ln91"]],
};

const set = (label, ...units) => ({ label, units });
const azuma = (k, label) => (AZ[k].cars === 9
  ? set(label, [`${k}First`, 1], [`${k}FirstMid`, 1], [`${k}Comp`, 1], [`${k}Mid`, 5], [`${k}Cab`, 1])
  : set(label, [`${k}First`, 1], [`${k}Comp`, 1], [`${k}Mid`, 2], [`${k}Cab`, 1]));
const SETS = {
  ln8012: azuma("ln8012", "Class 801 Azuma: nine cars, electric; First in the leading two cars and part of the third"),
  ln8011: azuma("ln8011", "Class 801 Azuma: five cars, electric; First in the leading car and part of the second"),
  ln8001: azuma("ln8001", "Class 800 Azuma: nine cars, electric and diesel; First in the leading two cars and part of the third"),
  ln8002: azuma("ln8002", "Class 800 Azuma: five cars, electric and diesel; First in the leading car and part of the second"),
};
const IC225 = set("InterCity 225: a Class 91 locomotive, nine Mark 4 coaches and a driving van trailer; First next to the van",
  ["ln91", 1], ["lnMk4", 5], ["lnMk4Cafe", 1], ["lnMk4First", 3], ["lnDvt", 1]);
const BY_MODEL = {};
for (const k of Object.keys(TYPES)) BY_MODEL[k] = SETS[k.slice(0, 6)] || IC225;

// By the reported unit; else the nine-car electric Azuma, the largest of
// LNER's fleets (30 of its 65 Azumas) and the usual train between London,
// Leeds, Newcastle and Edinburgh. The bi-modes run on beyond the wires (to
// Aberdeen, Inverness, Hull, Harrogate, Lincoln and elsewhere), the five-car
// sets often in pairs, and the few InterCity 225s mostly between London,
// Leeds and York; the timetable does not say which train is which, so the
// label says "usually".
export const TYPICAL = {
  lner: (t, reported) => BY_MODEL[reported] || SETS.ln8012,
};

const W800 = "https://en.wikipedia.org/wiki/British_Rail_Class_800";
const W801 = "https://en.wikipedia.org/wiki/British_Rail_Class_801";
const W91 = "https://en.wikipedia.org/wiki/British_Rail_Class_91";
const WMK4 = "https://en.wikipedia.org/wiki/British_Rail_Mark_4";
const az800 = { model: "Hitachi Class 800 Azuma (AT300)", type: "Bi-mode multiple unit (electric and diesel)", builder: "Hitachi Rail (Newton Aycliffe and Kasado)", built: "2014–2018",
  topSpeedMph: 125, source: W800 };
const az801 = { model: "Hitachi Class 801 Azuma (AT300)", type: "Electric multiple unit", builder: "Hitachi Rail (Newton Aycliffe)", built: "2017–2020",
  topSpeedMph: 125, source: W801 };
const mk4 = { model: "Mark 4 coach", type: "Intercity coach", builder: "Metro-Cammell (Washwood Heath)", built: "1989–1992", topSpeedMph: 125, source: WMK4 };
export const FACTS = {
  ln91: { model: "Class 91 (InterCity 225)", type: "Electric locomotive", builder: "BREL (Crewe) for GEC", built: "1988–1991", fleet: "31 built; about a dozen with LNER",
    topSpeedMph: 125, powerHp: 6300, lengthFt: 63.6, source: W91,
    about: "The InterCity 225's locomotive, at the north end of the train: 4.7 MW at the rails, designed for 140 mph (225 km/h, hence the name) and run at 125. Its streamlined cab leads going north; going south it pushes, driven from the van at the other end." },
  lnMk4: { ...mk4,
    about: "Standard class, seated 2+2. The Mark 4 was built for the East Coast electrification, its sides leaning in above the waist so that it could one day tilt; it never did." },
  lnMk4Cafe: { ...mk4,
    about: "Standard class with the café bar, between Standard and First." },
  lnMk4First: { ...mk4,
    about: "First class, seated 2+1, in the three coaches at the London end; the kitchen is in the one next to Standard." },
  lnDvt: { ...mk4, model: "Mark 4 driving van trailer", type: "Driving trailer and luggage van", lengthFt: 61.8,
    about: "A driving cab on a luggage van, shaped like the locomotive, at the London end of an InterCity 225: the driver works the Class 91 at the far end of the train from here." },
};
for (const [k, f] of Object.entries(AZ)) {
  const nine = f.cars === 9, bi = f.engines.length > 0;
  const base = { ...(bi ? az800 : az801), fleet: `${{ ln8012: 30, ln8011: 12, ln8001: 13, ln8002: 10 }[k]} ${nine ? "nine" : "five"}-car units`, seats: nine ? 596 : 302 };
  FACTS[`${k}First`] = { ...base, lengthFt: nine ? 766.7 : 425.5,
    about: `The Azuma's First class driving car, seated 2+1, with the kitchen behind the cab. ${nine ? "A nine-car set is 233.7 m long and seats 596 (102 First, 494 Standard)" : "A five-car set is 129.7 m long and seats 302 (48 First, 254 Standard); two often run coupled"}. ` +
      (bi ? "A bi-mode train: it runs on the wires where there are any and on its diesel engines beyond them." : "An electric train, with a single diesel engine to move it if the wires fail.") +
      " LNER's Azumas (the name is Japanese for \"east\") entered service in May 2019." };
  FACTS[`${k}FirstMid`] = { ...base, about: "The nine-car Azuma's second First class car, seated 2+1." };
  FACTS[`${k}Comp`] = { ...base, about: "First class in part of the car, Standard in the rest." };
  FACTS[`${k}Mid`] = { ...base,
    about: `Standard class, seated 2+2. ${bi ? `${nine ? "Five of the nine" : "Three of the five"} cars carry an MTU diesel engine under the floor, 560 kW each as LNER runs them.` : "The 801's motor cars take their power from the pantographs on the driving cars."}` };
  FACTS[`${k}Cab`] = { ...base, about: "The Standard class driving car. Both driving cars carry a pantograph." };
}
