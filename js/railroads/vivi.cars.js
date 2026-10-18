// Latvia's passenger cars (Vivi, scripts/railroads/vivi.py): Trainsheet's own
// side views from each model's published dimensions. The live feed names
// the train, not the unit, so each train is drawn as what typically runs on
// its line: Škoda's electric units on the four lines under wires, the
// Rīga-built DR1A diesel trains on the rest.

import { bilevel } from "../carmodels.js?v=dev";
import { rect, path, poly, win, pantograph, C } from "../carart.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
// Vivi's colors since 2023: signal yellow, anthracite and a dark gray.
const VIVI = { yellow: "#f7b500", anthracite: "#383e42", gray: "#575d61", roof: "#8d949c" };

// --- Škoda RegioPanter family for the 1520 mm gauge: Vivi's 16Ev (32
// four-car units, 2019-24, about 27 m a car) and Elron's 21Ev (three
// cars). A wide, tall body for the broad gauge, every car on its own two
// bogies, floors at the high platforms' level; a rounded nose under a big
// windshield; a double door a side in each cab car, two in each middle car.
// colors: { body (above the waist), low (below it and over the nose),
// skirt, roof }; the pantograph on a middle car.
const RP = { roof: 14.2, sill: 4.0, cornerR: 1.1, end: 0.6, trucks: { centers: 61.0, wb: 8.9, d: 33 }, diaphragm: [4.3, 12.6], badge: false };
const rpPaint = (k, nose) => (c, g) => {
  let s = rect(0, 0, g.L, 17, k.body) + rect(0, 13.2, g.L, 2, k.roof) + rect(0, 0, g.L, 6.4, k.low) + rect(0, 0, g.L, 4.4, k.skirt);
  if (nose) s += path("M0 4.4L0 10.2L2.6 10.2Q5.0 7.4 8.6 6.4L8.6 4.4Z", k.low);
  return s;
};
const rpDoor = (x) => ({ x, w: 4.6, y0: 4.15, y1: 11.4, leaves: 2, glassY: 0.4, glassH: 0.45 });
const rpWins = (xs) => ({ xs, y: 7.2, w: 4.4, h: 3.4, r: 0.45 });
export function regioPanter(c, k, { cab = false } = {}) {
  const L = c.L;
  if (cab) {
    return bilevel({ ...c, cabL: true }, { ...RP,
      nose: [[1.5, 4.0], [1.0, 6.2], ["q", 0.9, 8.4, 1.9, 9.6], [3.8, 12.8], ["q", 4.5, 14.2, 6.6, 14.2]], cabLen: 8,
      rows: [rpWins([10.2]), rpWins(seq(23.0, 5.6, 4)), rpWins(seq(52.0, 5.6, 6))], doors: [rpDoor(16.4)],
      paint: rpPaint(k, true), roofItems: [[12, 7, 0.55], [50, 12, 0.55]],
      cab: () => path(poly([[2.0, 9.9], [3.9, 12.6], [7.2, 12.6], [7.2, 9.9]]), C.glass) + rect(2.5, 5.2, 1.0, 0.5, "#f4f2e8", 0, 'rx="0.2"'),
    });
  }
  return bilevel({ ...c, cabL: false, cabR: false }, { ...RP,
    rows: [rpWins([2.6]), rpWins(seq(15.8, 5.6, 10)), rpWins([L - 7.0])], doors: [rpDoor(8.6), rpDoor(L - 13.8)],
    paint: rpPaint(k, false), roofItems: [[20, 14, 0.55]],
    extra: (c, g) => (c.pan ? pantograph(g.L / 2, g.roof) : ""),
  });
}
const VIVI_RP = { body: VIVI.anthracite, low: VIVI.yellow, skirt: VIVI.gray, roof: VIVI.roof };

// --- Rīga Carriage Works DR1A (1976-98), rebuilt as DR1AM (from 1998) and
// DR1AC (2015-16): diesel-hydraulic trains of motor cars (26.0 m, the
// engine behind the cab) and trailers (25.6 m), in sets of three to six
// cars; a rounded cab end with two windshield panes, a vestibule with a
// single door a side at each end of the passenger rooms. Drawn in Vivi's
// colors, which some sets now wear (others are in red and silver, or the
// old yellow and blue).
const DR1 = { roof: 14.4, sill: 4.3, cornerR: 1.3, end: 0.6, trucks: { centers: 57.0, wb: 8.9, d: 41 }, diaphragm: [4.6, 12.6], badge: false };
const drPaint = (nose) => (c, g) => rect(0, 0, g.L, 17, VIVI.anthracite) + rect(0, 13.3, g.L, 2, VIVI.roof) + rect(0, 0, g.L, 6.9, VIVI.yellow) +
  rect(0, 0, g.L, 4.8, VIVI.gray) + (nose ? path("M0 4.8L0 11.0L1.8 11.0Q3.0 8.4 6.4 6.9L6.4 4.8Z", VIVI.yellow) : "");
const drDoor = (x) => ({ x, w: 2.7, y0: 4.45, y1: 11.6, glassY: 0.55, glassH: 0.3 });
const dr1Motor = (c) => bilevel({ ...c, cabL: true }, { ...DR1,
  nose: [[1.3, 4.3], [0.9, 6.6], ["q", 0.7, 9.4, 1.3, 11.2], ["q", 1.9, 13.6, 4.0, 14.2], ["q", 5.0, 14.4, 6.6, 14.4]], cabLen: 6,
  rows: [{ xs: [7.6], y: 8.0, w: 2.2, h: 2.6, r: 0.35 }, { xs: seq(27.4, 4.75, 11), y: 7.7, w: 3.6, h: 3.0, r: 0.35 }],
  doors: [drDoor(22.4), drDoor(c.L - 3.6)], paint: drPaint(true),
  roofItems: [[9.5, 11.5, 0.7]],
  extra: () => rect(11.0, 7.4, 9.6, 3.6, "rgba(20,22,25,0.5)", 0.4) + rect(11.4, 7.8, 8.8, 2.8, "none", 0, 'stroke="rgba(255,255,255,0.18)" stroke-width="0.4"'),
  cab: () => win(1.25, 8.4, 1.4, 2.6, 0.4) + win(3.0, 8.6, 2.4, 2.4, 0.35),
});
const dr1Trailer = (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...DR1,
  rows: [{ xs: seq(6.4, 4.75, 15), y: 7.7, w: 3.6, h: 3.0, r: 0.35 }], doors: [drDoor(1.4), drDoor(c.L - 4.1)], paint: drPaint(false),
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
