// Latvia's passenger cars (Vivi, scripts/railroads/vivi.py): Trainsheet's own
// side views from each model's published dimensions. The live feed names
// the train, not the unit, so each train is drawn as what typically runs on
// its line: Škoda's electric units on the four lines under wires, the
// Rīga-built DR1A diesel trains on the rest.

import { bilevel } from "../carmodels.js?v=dev";
import { rect, path, line, poly, slats, win, pantograph, C } from "../carart.js?v=dev";
import { letters, hvac, roofCover, panGear, horns, lamp, RED_LAMP, wiper, emuFront, boxes, frames } from "./digitraffic.cars.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
// Vivi's colors since 2023: signal yellow on anthracite, a dark gray skirt.
const VIVI = { yellow: "#f7b500", anthracite: "#383e42", gray: "#2c3135", roof: "#8d949c" };
const viviMark = (c, x, y, h) => letters(c, x, y, h, "VIVI", VIVI.yellow, { weight: 800, italic: true, spacing: 0.02 * h, stretch: 1.2 });

// --- Škoda RegioPanter family for the 1520 mm gauge: Vivi's 16Ev (32
// four-car units, 2019-24, about 27 m a car) and Elron's 21Ev (three
// cars). A wide, tall body for the broad gauge, every car on its own two
// bogies, floors at the high platforms' level; a rounded nose under a big
// windshield in a black mask, the automatic coupler under a deflector,
// headlights low on the nose; a double door a side in each cab car, two
// in each middle car; air conditioning over every car, the pantograph and
// its breaker on a middle car, converters and tanks under the floor.
// k: the railroad's paint, { body, roof, skirt, door, mask, paint(c, g,
// cab) drawing its graphics on the side (clipped to the body) }.
const RP = { roof: 14.2, sill: 4.0, cornerR: 1.1, end: 0.6, trucks: { centers: 61.0, wb: 8.9, d: 33 }, diaphragm: [4.3, 12.6], badge: false };
const rpDoor = (x) => ({ x, w: 4.6, y0: 4.15, y1: 11.4, leaves: 2, glassY: 0.4, glassH: 0.45 });
const rpWins = (xs) => ({ xs, y: 7.2, w: 4.4, h: 3.4, r: 0.45 });
const rpBase = (k, L, doors, rows) => rect(0, 0, L, 17, k.body) + rect(0, 13.2, L, 2, k.roof) + line(0, 13.2, L, 13.2, "rgba(0,0,0,0.2)", 0.5) +
  rect(0, 0, L, 4.4, k.skirt) + doors.map((x) => rect(x - 0.15, 4.05, 4.9, 7.5, k.door)).join("") + rows.map((r) => frames(r.xs, r.y, r.w, r.h, 0.15)).join("");
export function regioPanter(c, k, { cab = false } = {}) {
  const L = c.L;
  if (cab) {
    const rows = [rpWins([10.2]), rpWins(seq(23.0, 5.6, 4)), rpWins(seq(52.0, 5.6, 6))];
    return bilevel({ ...c, cabL: true }, { ...RP,
      nose: [[1.5, 4.0], [1.0, 6.2], ["q", 0.9, 8.4, 1.9, 9.6], [3.8, 12.8], ["q", 4.5, 14.2, 6.6, 14.2]], cabLen: 8, rows, doors: [rpDoor(16.4)],
      paint: (c, g) => rpBase(k, L, [16.4], rows) + k.paint(c, g, true) + path(poly([[1.6, 9.4], [3.7, 12.95], [7.6, 12.95], [7.6, 9.4]]), k.mask),
      extra: (c, g) => hvac(26, g.roof, 12) + roofCover(56, g.roof, 12, 0.5) + rect(9.5, g.roof - 0.05, 4.0, 0.45, C.steelDark, 0.4, 'rx="0.15"') +
        boxes(22, 46, g.sill, 3, 1.2) + boxes(50, 68, g.sill, 2, 1.0),
      cab: () => path(poly([[2.0, 9.9], [3.9, 12.6], [7.2, 12.6], [7.2, 9.9]]), C.glass) + path(poly([[2.4, 10.15], [3.4, 11.7], [4.1, 11.7], [3.1, 10.15]]), C.glassLight) +
        wiper(2.6, 10.0, 3.7, 12.0) + lamp(1.0, 6.5, 0.55, 0.45) + lamp(1.05, 5.7, 0.4, 0.3, RED_LAMP) + lamp(5.0, 13.6, 0.7, 0.28) +
        rect(5.2, 12.65, 1.9, 0.3, "#f4a321", 0, 'rx="0.08"') + horns(7.6, 14.15) + emuFront(1.5, 4.0, { coupler: 3.4 }),
    });
  }
  const rows = [rpWins([2.6]), rpWins(seq(15.8, 5.6, 10)), rpWins([L - 7.0])];
  return bilevel({ ...c, cabL: false, cabR: false }, { ...RP, rows, doors: [rpDoor(8.6), rpDoor(L - 13.8)],
    paint: (c, g) => rpBase(k, L, [8.6, L - 13.8], rows) + k.paint(c, g, false),
    extra: (c, g) => hvac(c.pan ? 50 : 18, g.roof, 12) + boxes(18, L - 18, g.sill, 4, 1.2) +
      (c.pan ? pantograph(g.L / 2 - 8, g.roof) + panGear(g.L / 2 - 8, g.roof, 1) + roofCover(g.L / 2 + 1.5, g.roof, 4.0, 0.6) : roofCover(52, g.roof, 12, 0.5)),
  });
}
// Vivi's 16Ev: anthracite, the nose yellow back past the cab and a yellow
// band low along the side that sweeps up behind the cab to the roof
// line; yellow doors; VIVI big in yellow over the windows.
export const VIVI_RP = { body: VIVI.anthracite, roof: VIVI.roof, skirt: VIVI.gray, door: VIVI.yellow, mask: "#16181b",
  paint: (c, g, cab) => {
    const L = g.L;
    let s = rect(0, 4.4, L, 0.95, VIVI.yellow);
    if (cab) {
      s += path("M0 0L0 15L6.8 15Q8.6 11.4 9.2 9.2Q10.2 6.0 13.6 5.35L13.6 0Z", VIVI.yellow);
      s += path(`M30 5.35Q41 5.6 47 11.6Q49.5 13.2 54 13.2L${L} 13.2L${L} 12.3L54.5 12.3Q50.6 12.3 48.6 10.9Q42.4 4.4 30 4.4Z`, VIVI.yellow);
      s += viviMark(c, 34.0, 12.0, 1.7);
    } else s += viviMark(c, L / 2, 12.0, 1.7) + path(`M0 12.3L${L} 12.3L${L} 12.65L0 12.65Z`, VIVI.yellow);
    return s;
  },
};

// --- Rīga Carriage Works DR1A (1976-98), rebuilt as DR1AM (from 1998) and
// DR1AC (2015-16): diesel-hydraulic trains of motor cars (26.0 m, the
// engine room behind the cab, its radiator louvers on the side and its
// exhaust on the roof) and trailers (25.6 m), in sets of three to six
// cars; a rounded cab end with two windshield panes, the headlight over
// them, an automatic coupler; a vestibule with a single door a side at
// each end of the passenger rooms. Drawn in Vivi's colors, which some sets
// now wear (others are in red and silver, or the old yellow and blue):
// anthracite, a broad yellow band under the windows and the yellow front,
// yellow doors, VIVI on the side.
const DR1 = { roof: 14.4, sill: 4.3, cornerR: 1.3, end: 0.6, trucks: { centers: 57.0, wb: 8.9, d: 41 }, diaphragm: [4.6, 12.6], badge: false };
const drPaint = (nose, doors) => (c, g) => {
  const L = g.L;
  let s = rect(0, 0, L, 17, VIVI.anthracite) + rect(0, 13.3, L, 2, VIVI.roof) + line(0, 13.3, L, 13.3, "rgba(0,0,0,0.2)", 0.5) +
    rect(0, 5.1, L, 1.8, VIVI.yellow) + rect(0, 0, L, 4.8, VIVI.gray) + doors.map((x) => rect(x - 0.15, 4.35, 3.0, 7.35, VIVI.yellow)).join("");
  if (nose) s += path("M0 4.8L0 12.0L1.4 12.0Q2.6 8.6 6.4 6.9L6.4 4.8Z", VIVI.yellow) + path(poly([[1.0, 8.2], [1.0, 11.3], [5.7, 11.3], [5.7, 8.2]]), "#16181b");
  return s + viviMark(c, nose ? 50.0 : L / 2, 12.2, 1.4);
};
const drDoor = (x) => ({ x, w: 2.7, y0: 4.45, y1: 11.6, glassY: 0.55, glassH: 0.3 });
const dr1Motor = (c) => bilevel({ ...c, cabL: true }, { ...DR1,
  nose: [[1.3, 4.3], [0.9, 6.6], ["q", 0.7, 9.4, 1.3, 11.2], ["q", 1.9, 13.6, 4.0, 14.2], ["q", 5.0, 14.4, 6.6, 14.4]], cabLen: 6,
  rows: [{ xs: [7.6], y: 8.0, w: 2.2, h: 2.6, r: 0.35 }, { xs: seq(27.4, 4.75, 11), y: 7.7, w: 3.6, h: 3.0, r: 0.35 }],
  doors: [drDoor(22.4), drDoor(c.L - 3.6)], paint: drPaint(true, [22.4, c.L - 3.6]),
  extra: (c, g) => rect(11.0, 7.4, 9.6, 3.6, "rgba(20,22,25,0.5)", 0.4) + slats(11.2, 7.6, 9.2, 3.2, 0.35, "rgba(255,255,255,0.2)") +
    roofCover(9.5, g.roof, 11.5, 0.8, "#8d949c", 3) + slats(10.3, g.roof + 0.12, 9.9, 0.55, 0.4, "rgba(0,0,0,0.35)") +
    rect(16.0, g.roof + 0.75, 0.6, 1.0, "currentColor") + rect(17.2, g.roof + 0.75, 0.6, 0.85, "currentColor") +
    boxes(10, 21, g.sill, 1, 1.6) + rect(24, 1.6, 7, 0.9, "#2a2d31", 0.4, 'rx="0.4"') + boxes(33, 66, g.sill, 3, 1.0) + roofCover(46, g.roof, 4, 0.4),
  cab: () => win(1.25, 8.4, 1.4, 2.6, 0.4) + win(3.0, 8.6, 2.4, 2.4, 0.35) + wiper(3.4, 8.7, 4.6, 10.6) +
    lamp(1.9, 13.2, 0.8, 0.45) + lamp(0.85, 6.9, 0.5, 0.45) + lamp(0.9, 6.15, 0.38, 0.3, RED_LAMP) + horns(5.0, 14.35) + emuFront(1.3, 4.3, { coupler: 3.5 }),
});
const dr1Trailer = (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...DR1,
  rows: [{ xs: seq(6.4, 4.75, 15), y: 7.7, w: 3.6, h: 3.0, r: 0.35 }], doors: [drDoor(1.4), drDoor(c.L - 4.1)], paint: drPaint(false, [1.4, c.L - 4.1]),
  extra: (c, g) => boxes(18, g.L - 18, g.sill, 3, 1.0) + seq(12, 15, 5).map((x) => roofCover(x, g.roof, 2.2, 0.45)).join(""),
});

export const TYPES = {
  viviEvCab: { name: "Škoda 16Ev cab car", kind: "emu" },
  viviEvMid: { name: "Škoda 16Ev car", kind: "emu", pan: true },
  viviDr1Motor: { name: "DR1A motor car", kind: "emu" },
  viviDr1Trailer: { name: "DR1A trailer", kind: "emu" },
};
const M = (draw, len, oneEnd = false) => ({ draw, len, oneEnd, variant: null });
export const MODELS = {
  viviEvCab: M((c) => regioPanter(c, VIVI_RP, { cab: true }), 89.4, true),
  viviEvMid: M((c) => regioPanter(c, VIVI_RP), 89.4),
  viviDr1Motor: M(dr1Motor, 85.3, true),
  viviDr1Trailer: M(dr1Trailer, 83.9),
};

// The electric lines (Tukums, Jelgava, Skulte, Aizkraukle) get the 16Evs;
// the diesel ones (Liepāja, Daugavpils, Zilupe, Gulbene, Valga) DR1As.
const set = (label, ...units) => ({ label, units });
const EV = set("Four-car Škoda 16Ev", ["viviEvCab", 1], ["viviEvMid", 2], ["viviEvCab", 1]);
const DR = set("Three-car DR1A-family diesel train", ["viviDr1Motor", 1], ["viviDr1Trailer", 1], ["viviDr1Motor", 1]);
const ELECTRIC = /Tukums|Jelgava|Skulte|Aizkraukle/;
export const TYPICAL = {
  vivi: (t, reported) => (/^viviEv/.test(reported || "") ? EV : /^viviDr1/.test(reported || "") ? DR : ELECTRIC.test(t.route || "") ? EV : t.route ? DR : EV),
};

export const FACTS = {
  viviEvCab: { model: "Škoda 16Ev", type: "Electric multiple unit", builder: "Škoda Vagonka", built: "2019–2024", fleet: "32 four-car units",
    topSpeedMph: 99.4, seats: 436, lengthFt: 357.6,
    about: "Latvia's new electric trains, built on Škoda's RegioPanter for the 1520 mm gauge and for both 3 kV DC and 25 kV AC. The first entered service in December 2023 on the lines out of Rīga; they are designed for 160 km/h but run at up to 120.",
    source: "https://www.skodagroup.com/press-release/first-electric-units-skoda-16ev-start-regular-operation-in-latvia" },
  viviDr1Motor: { model: "DR1A", type: "Diesel multiple unit", builder: "Rīga Carriage Works (RVR)", built: "1976–1998; rebuilt since 1998",
    topSpeedMph: 74.6, powerHp: 987, lengthFt: 85.3,
    about: "Soviet-era diesel trains built in Rīga, still running Vivi's lines without wires. Many have been rebuilt with new MTU engines and Voith transmissions (DR1AM, and six DR1ACs in 2015–16).",
    source: "https://ru.wikipedia.org/wiki/ДР1" },
};
// A unit's other cars share its sheet, named for the part they are.
const part = (facts, name) => ({ ...facts, model: `${facts.model}, ${name}` });
FACTS.viviEvMid = part(FACTS.viviEvCab, "middle car");
const { powerHp, ...unpowered } = FACTS.viviDr1Motor;
FACTS.viviDr1Trailer = { ...part(unpowered, "trailer"), lengthFt: 83.9 };
