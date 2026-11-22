// Caledonian Sleeper's cars (scripts/railroads/gb.py): the night trains
// between London Euston and Scotland, CAF's Mark 5 coaches behind a Class 92
// electric locomotive. The timetable names no unit, so a train is drawn as
// the formation that usually runs it, labeled as typical. Trainsheet's own
// side views from published dimensions, at the shared scale (js/carart.js),
// in the Sleeper's midnight teal, lettered here (no logo files). The
// toolkit from avanti.cars.js; the locomotive's body from czechia.cars.js.

import { rect, path, lines, slats, truck } from "../carart.js?v=dev";
import { seq, bands, boxes, ft, spread, leaf, yellowEnd, fairing, unit, letters, mark, hvac } from "./avanti.cars.js?v=dev";
import { euroLoco } from "./czechia.cars.js?v=dev";

// ---------- Paint ----------
// Caledonian Sleeper since 2015 (Serco's rebrand, kept under Scottish Rail
// Holdings from 2023), drawn from memory, not checked against photographs:
// "midnight teal", a very dark blue-green, all over, roof and skirt
// darker still; a stag's head and antlers in white beside "CALEDONIAN
// SLEEPER" in silver-white capitals, wide-spaced, under the windows; the
// doors a paler teal so that they stand out; on GB Railfreight's Class 92s
// the same teal with the stag big on the side and a yellow panel on each
// front.
const CS = { teal: "#1d2e35", deep: "#15232a", door: "#3d6470", roof: "#131d22", skirt: "#16191c", silver: "#d9dfe2", white: "#f4f6f6", glass: "#1b1e22" };
const n = (v) => Math.round(v * 100) / 100;

// The stag: a head and two antlers of three tines each, in line, h ft tall,
// centered on (x, y).
const STAG = ["M-0.07 0.08Q-0.30 -0.02 -0.33 -0.50", "M-0.21 0.01L-0.44 -0.06", "M-0.29 -0.16L-0.50 -0.30", "M-0.32 -0.33L-0.19 -0.47"];
const stag = (c, x, y, h, fill = CS.white) => {
  const side = (k) => STAG.map((d) => d.replace(/(-?\d+\.\d+) (-?\d+\.\d+)/g, (_, a, b) => `${n(a * h * k)} ${n(b * h)}`)).join("");
  return mark(c, x, y, `<path d="${side(1)}${side(-1)}" fill="none" stroke="${fill}" stroke-width="${n(h * 0.065)}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M${n(-0.1 * h)} ${n(0.06 * h)}L${n(0.1 * h)} ${n(0.06 * h)}L${n(0.045 * h)} ${n(0.5 * h)}L${n(-0.045 * h)} ${n(0.5 * h)}Z" fill="${fill}"/>`);
};
// The name, in one line, h ft tall, centered on x.
const sleeper = (c, x, y, h, fill = CS.silver) => letters(c, x, y, h, "CALEDONIAN SLEEPER", fill, { weight: 500, spacing: "0.2em" });
const csPaint = (L, sill) => bands(L, [[0, 20, CS.teal], [11.7, 3, CS.roof], [0, sill, CS.skirt]]);

// ---------- Class 92 ----------
// Brush Traction's Channel Tunnel locomotive of 1993-1996, for 25 kV
// overhead and 750 V third rail: 21.34 m long, 2.67 m wide, 3.95 m tall,
// Co'Co' on 1,160 mm wheels, 5,040 kW. (Wikipedia, "British Rail Class
// 92".) A flat front, the windshield leaning back a little over it; a long
// plain side with louvers high along the machine room; two pantographs.
// The truck centers (about 12.2 m) and wheelbase (about 4.3 m) are from
// memory. GB Railfreight's, fitted with Dellner couplers, haul the Sleeper
// between Euston and Edinburgh or Glasgow.
const C92 = { roof: ft(3.95), sill: 4.1, len: ft(21.34), centers: 40, wb: 14.1 };
const NOSE_92 = [[0.7, 4.1], [0.6, 8.3], [1.5, 12.3], ["q", 1.7, C92.roof, 3.0, C92.roof]];
const loco92 = (c) => euroLoco(c, { roof: C92.roof, sill: C92.sill, nose: NOSE_92, rake: [[0.65, 8.6], [1.4, 12.0]], centers: C92.centers, wb: C92.wb, wheel: 46,
  door: 5.4, surround: CS.glass, grilles: [[-22, 9.5, 9.4, 11.6], [-11, 9.5, 9.4, 11.6], [1.5, 9.5, 9.4, 11.6], [12.5, 9.5, 9.4, 11.6]], grilleFill: "rgba(0,0,0,0.32)",
  paint: (cc, L) => csPaint(L, C92.sill + 0.3) + yellowEnd(1.9, C92.sill, 8.4),
  // The third axle of each truck (the shared body draws two); the stag,
  // the name and the number.
  over: (cc, L) => [-1, 1].map((k) => truck(L / 2 + k * C92.centers / 2, { wb: C92.wb, d: 46, kind: "loco", top: C92.sill, axles: 3 })).join("") +
    stag(cc, L / 2 - 17.5, 6.9, 3.4) + sleeper(cc, L / 2 + 4.5, 6.9, 0.95) + letters(cc, L - 12, 5.0, 0.5, "92", CS.silver, { weight: 600, spacing: "0.06em" }) });

// ---------- Mark 5 ----------
// CAF's coaches for the Sleeper, built at Beasain 2016-2018 and in service
// from April 2019: 22.2 m long, 2.75 m wide, about 3.8 m tall, on two
// trucks with 920 mm wheels; 100 mph. (Wikipedia, "British Rail Mark 5".)
// Four kinds: the sleeping car, ten rooms with a small window each on the
// berth side (drawn here); the accessible sleeping car, with fewer, bigger
// rooms; the Club Car, a lounge with long windows; and the seated coach.
// One plug door a side, at one end (the window and door layout from
// memory).
const MK5 = { roof: ft(3.8), sill: 3.8, len: ft(22.2) };
const MK5_ROWS = {
  sleeper: (L) => ({ xs: spread(9.0, L - 4.0, 2.5, 5.9), y: 7.0, w: 2.5, h: 2.5, r: 0.35 }),
  access: (L) => ({ xs: spread(11.0, L - 4.0, 2.9, 7.4), y: 7.0, w: 2.9, h: 2.5, r: 0.35 }),
  club: (L) => ({ xs: spread(9.0, L - 5.0, 5.6, 7.3), y: 6.7, w: 5.6, h: 3.0, r: 0.45 }),
  seat: (L) => ({ xs: spread(9.0, L - 5.0, 4.4, 6.2), y: 6.8, w: 4.4, h: 2.8, r: 0.4 }),
};
const MK5_NAME = { club: "CLUB CAR", seat: "SEATED", access: "ACCESSIBLE" };
function mark5(c, kind = "sleeper") {
  const L = c.L;
  return unit(c, { roof: MK5.roof, sill: MK5.sill, rows: [MK5_ROWS[kind](L)], doors: [leaf(2.0, MK5.sill, 10.9, 2.9, CS.door)], trucks: [9.4, L - 9.4], wheel: 36,
    diaphragm: [4.0, 11.3], paint: (cc, g) => csPaint(g.L, MK5.sill),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, MK5.roof, "#3a444a") + hvac(g.L / 2 - 8, MK5.roof + 0.27, 16, 0.5) +
      // Under the floor: the air-conditioning and converter boxes and, on
      // the sleeping cars, the water and retention tanks.
      boxes(15.5, g.L - 15.5, MK5.sill, kind === "seat" ? 3 : 4, 1.4) +
      // The Club Car's kitchen has a blank side at the far end.
      (kind === "club" ? rect(g.L - 13.5, 6.5, 9.0, 3.4, CS.teal) + slats(g.L - 10.5, 9.0, 3.6, 0.9, 0.3, "rgba(0,0,0,0.35)") : "") +
      lines([[0, 5.15, g.L, 5.15]], "rgba(255,255,255,0.1)", 0.4) +
      stag(cc, g.L / 2 - 14.2, 5.2, 2.1) + sleeper(cc, g.L / 2 + 2.6, 5.2, 0.72) +
      (MK5_NAME[kind] ? letters(cc, g.L / 2, 10.75, 0.55, MK5_NAME[kind], CS.silver, { weight: 600, spacing: "0.16em" }) : "") });
}

// ---------- Tables ----------

// The Sleeper's accommodation: rooms (Classic, Club with a shower and
// toilet, and Caledonian Double) in the sleeping cars, the Club Car for
// meals and drinks, and reclining seats in the seated coach. Each kind of
// car is its own type, with its own fact sheet.
export const TYPES = {
  cs92: { name: "Class 92 electric locomotive", kind: "electric", pan: true },
  csSeat: { name: "Mark 5 seated coach", kind: "coach" },
  csClub: { name: "Mark 5 Club Car", kind: "coach", amenities: ["dining"] },
  csAccess: { name: "Mark 5 accessible sleeping car", kind: "coach", amenities: ["sleepers"] },
  csSleeper: { name: "Mark 5 sleeping car", kind: "coach", amenities: ["sleepers"] },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  cs92: M(loco92, C92.len),
  csSeat: M((c) => mark5(c, "seat"), MK5.len),
  csClub: M((c) => mark5(c, "club"), MK5.len),
  csAccess: M((c) => mark5(c, "access"), MK5.len),
  csSleeper: M((c) => mark5(c, "sleeper"), MK5.len),
};

// By number: the Mark 5s are 15001-15011 (seated), 15101-15110 (Club Cars),
// 15201-15214 (accessible sleeping cars) and 15301-15340 (sleeping cars);
// the Class 92s 92 001-046 as built, of which GB Railfreight keeps a handful
// for the Sleeper. (Number series from memory.) The timetable names no
// unit; these are for the fleet pages.
export const FLEETS = {
  calsleeper: [[92001, 92046, "cs92"], [15001, 15011, "csSeat"], [15101, 15110, "csClub"], [15201, 15214, "csAccess"], [15301, 15340, "csSleeper"]],
};

const set = (label, ...units) => ({ label, units });
const PORTION = set("Class 92 and eight Mark 5 coaches: a seated coach, the Club Car and six sleeping cars; two such portions run coupled south of Scotland",
  ["cs92", 1], ["csSeat", 1], ["csClub", 1], ["csAccess", 1], ["csSleeper", 5]);

// Every train is drawn as one portion behind a Class 92. The Lowland
// Sleeper is two portions of eight (Glasgow and Edinburgh) joined at
// Carstairs; the Highland Sleeper three (Inverness, Aberdeen and Fort
// William, sixteen coaches in all) joined at Edinburgh, north of which
// each goes on behind a Class 73/9 electro-diesel, not drawn here. The
// timetable does not say how a train is made up, so the label says
// "usually".
export const TYPICAL = {
  calsleeper: () => PORTION,
};

const W92 = "https://en.wikipedia.org/wiki/British_Rail_Class_92";
const WMK5 = "https://en.wikipedia.org/wiki/British_Rail_Mark_5";
const mk5 = { model: "CAF Mark 5", builder: "CAF (Beasain)", built: "2016–2018", fleet: "75 coaches", topSpeedMph: 100, lengthFt: 72.8, source: WMK5 };
export const FACTS = {
  cs92: { model: "Class 92", type: "Electric locomotive", builder: "Brush Traction (Loughborough)", built: "1993–1996", fleet: "46 built; GB Railfreight's haul the Sleeper",
    topSpeedMph: 87, powerHp: 6760, lengthFt: 70, source: W92,
    about: "Built to take freight and night trains through the Channel Tunnel, working from 25 kV overhead wires or the 750 V third rail. The through night trains never ran; since 2015 GB Railfreight's Class 92s have hauled the Caledonian Sleeper between London Euston and Edinburgh or Glasgow, where diesels take the Highland portions on." },
  csSeat: { ...mk5, type: "Seated coach",
    about: "Reclining seats, 2+1, with lockers and reading lights: the Sleeper's cheapest way to travel, one coach in each portion." },
  csClub: { ...mk5, type: "Lounge and dining car",
    about: "The Club Car: tables, bar stools and a kitchen serving Scottish food and drink through the evening and breakfast in the morning. Room guests have first call on its seats." },
  csAccess: { ...mk5, type: "Sleeping car",
    about: "A sleeping car with accessible rooms, a double and a twin, next to an accessible toilet, and Caledonian Double rooms with en-suite showers; it runs next to the Club Car." },
  csSleeper: { ...mk5, type: "Sleeping car",
    about: "Ten rooms along a side corridor, each with two berths: Classic rooms with a washbasin, Club rooms with their own shower and toilet. The Mark 5s replaced British Rail's Mark 2 and Mark 3 sleeper stock in 2019." },
};
