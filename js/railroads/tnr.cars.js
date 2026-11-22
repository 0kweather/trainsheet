// TNR's cars (scripts/railroads/morocco.py): ONCF's Train Navette Rapide,
// the Casablanca suburban shuttles (Casablanca-Rabat-Kenitra, El Jadida,
// Settat) and Al Bidaoui to Mohammed V airport, run by the Z2M, AnsaldoBreda's
// double-deck electric unit. The timetable names no unit, so every train is
// drawn as one Z2M, labeled as typical. Trainsheet's own side views from
// published dimensions, at the shared scale (js/carart.js), in ONCF's
// suburban paint, lettered here (no logo files). Bodies and parts from
// czechia.cars.js.
//
// The Z2M is AnsaldoBreda's TAF (Treno ad Alta Frequentazione, Trenitalia's
// ALe 426/506) built for ONCF's 3 kV lines, and the dimensions here are the
// TAF's. The paint is checked against photographs of the fleet: the light gray
// body, the charcoal upper deck and roof, the orange cab, roof edge and skirt
// band and the body-color doors; where the lettering sits is Trainsheet's
// reading.

import { C, rect, path, underframe } from "../carart.js?v=dev";
import { unit, letters, hvac } from "./czechia.cars.js?v=dev";

const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 1, depth = 0.8) => underframe(a, b, top, { depth, boxes: k, tanks: false });

// ---------- Paint ----------
// ONCF's suburban stock: light gray sides; the upper deck's windows in a
// charcoal band that carries on over the roof; the lower deck's in a dark
// band between the doors; a bold orange band along the bottom of every car;
// the roof edge orange over each single-deck end; the whole nose and cab roof
// orange; doors in the body's gray. "ONCF" and "TNR" in orange between the decks.
const TN = { white: "#e6e7e5", roof: "#2b2e33", band: "#22252b", orange: "#f07d02", skirt: "#33363c", ink: "#6c7078" };
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";

// ---------- Z2M ----------
// Four cars, 103.97 m: a motor car with a cab at each end (25.94 m) and two
// trailers between (26.05 m), each on its own two trucks, 920 mm wheels;
// 4.3 m tall over the rail, 2.82 m wide. Between the trucks the floor drops
// and the car is double-deck; over each truck it is single-deck at the
// intermediate level. Two double plug doors a side, at the low floor just
// inside the trucks. One pantograph on each motor car, over the single-deck
// end behind the cab. A deep, rounded nose under a tall raked windshield.
const Z = { roof: 14.1, sill: 3.7, cab: 85.1, mid: 85.5, drop: (L) => ({ a: 14.6, b: L - 14.6, y: 1.6 }) };
const NOSE = [[1.5, 3.7], [1.0, 6.0], ["q", 0.95, 7.9, 2.5, 9.1], [5.9, 13.2], ["q", 6.7, 14.1, 8.6, 14.1]];
// The orange's edge behind the cab, from the roof down to the skirt band.
const SWEEP = "C8.3 11.0 7.6 7.0 6.4 4.1";
function paint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, TN.white], [13.25, 3, TN.roof], [2.4, 2.6, TN.orange], [0, 2.4, TN.skirt]]) +
      // The orange roof edge over each single-deck end.
      rect(-1, 12.3, 18.2, 4, TN.orange) + rect(L - 17.2, 12.3, 18.2, 4, TN.orange) +
      // The charcoal upper deck, on over the roof, and the lower deck's band between the doors.
      rect(17.0, 9.6, L - 34.0, 6, TN.band) + rect(21.9, 4.3, L - 43.8, 2.85, TN.band, 0, 'rx="0.4"');
    // The nose and cab roof, orange down to the skirt band.
    if (cab) s += path(`M-1 2.4L-1 14.8L9.0 14.8${SWEEP}L6.4 2.4Z`, TN.orange);
    return s;
  };
}
// Windows: the upper deck, the lower deck between the doors, and one at the
// intermediate level over each truck (a ft in from each end).
const rows = (L, a = 6.2) => [{ xs: seq(17.6, 5.4, Math.floor((L - 35.2 - 4.4) / 5.4) + 1), y: 10.1, w: 4.4, h: 2.45, r: 0.4 },
  { xs: seq(22.6, 5.5, Math.floor((L - 45.2 - 4.4) / 5.5) + 1), y: 4.5, w: 4.4, h: 2.45, r: 0.4 }, { xs: [a, L - 6.2 - 4.2], y: 7.95, w: 4.2, h: 2.6, r: 0.4 }];
const door = (x) => ({ x, w: 4.6, y0: 1.7, y1: 8.9, leaves: 2, glassY: 0.54, glassH: 0.3, fill: TN.white });
const doors = (L) => [door(16.3), door(L - 20.9)];
// Air-conditioning over the upper deck's ends.
const roofGear = (L) => hvac(24, Z.roof, 10, 0.6) + hvac(L - 34, Z.roof, 10, 0.6);
// The class figure by a door, and the names on the white between the decks.
const figure = (c, x) => letters(c, x, 8.6, 1.0, "2", TN.ink, { weight: 700, family: SANS });
const oncf = (c, x) => letters(c, x, 8.62, 1.15, "ONCF", TN.orange, { weight: 800, style: "italic", spacing: "0.02em", family: SANS });
const tnr = (c, x) => letters(c, x, 8.62, 1.15, "TNR", TN.orange, { weight: 800, spacing: "0.04em", family: SANS });

function z2mCab(c) {
  const L = c.L;
  return unit(c, { roof: Z.roof, sill: Z.sill, drop: Z.drop(L), nose: NOSE, rake: [[2.5, 9.1], [5.9, 13.2]], depth: 2.8, cabLen: 9, lampY: 5.5,
    rows: rows(L, 10.6), doors: doors(L), trucks: [8.0, L - 8.0], wheel: 36, diaphragm: [3.9, 12.8], paint: paint(true), surround: "#17191d",
    pan: 12.5,
    extra: (cc, g) => roofGear(g.L) + boxes(g.L - 4.6, g.L - 2.6, Z.sill) +
      oncf(cc, 31) + tnr(cc, g.L - 31) + figure(cc, 22.4) + figure(cc, g.L - 22.4) +
      letters(cc, 26, 3.25, 0.5, "Z2M", "#ffffff", { weight: 600, spacing: "0.08em", family: SANS }) });
}
function z2mMid(c) {
  const L = c.L;
  return unit(c, { roof: Z.roof, sill: Z.sill, drop: Z.drop(L), rows: rows(L), doors: doors(L), trucks: [8.0, L - 8.0], wheel: 36,
    diaphragm: [3.9, 12.8], paint: paint(false),
    extra: (cc, g) => roofGear(g.L) + rect(g.L / 2 - 4, Z.roof - 0.05, 8, 0.45, C.steelDark, 0.4, 'rx="0.2"') +
      boxes(2.6, 4.6, Z.sill) + boxes(g.L - 4.6, g.L - 2.6, Z.sill) +
      tnr(cc, g.L / 2 - 6) + oncf(cc, g.L / 2 + 6) + figure(cc, 22.4) + figure(cc, g.L - 22.4) });
}

// ---------- Tables ----------

export const TYPES = {
  tnrZ2mCab: { name: "Z2M double-deck motor car", kind: "emu", pan: true },
  tnrZ2mMid: { name: "Z2M double-deck trailer", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
// Feet: 25.94 m and 26.05 m.
export const MODELS = {
  tnrZ2mCab: M(z2mCab, Z.cab, true),
  tnrZ2mMid: M(z2mMid, Z.mid),
};

// The 24 units, counted 1-24 (not ONCF's own numbering). ONCF's feed names
// none; these are for the fleet pages.
export const FLEETS = {
  tnr: [[1, 24, "tnrZ2mCab"]],
};

const set = (label, ...units) => ({ label, units });
const Z2M = set("Typical TNR train: a Z2M double-deck electric unit, four cars", ["tnrZ2mCab", 1], ["tnrZ2mMid", 2], ["tnrZ2mCab", 1]);

// ONCF publishes no rosters; the shuttles and Al Bidaoui share the Z2M
// fleet, so every train is drawn as one unit (busy trains run two coupled).
export const TYPICAL = {
  tnr: () => Z2M,
};

const ONCF = "https://en.wikipedia.org/wiki/ONCF";
const TAF = "https://it.wikipedia.org/wiki/Treno_ad_alta_frequentazione";
const z2m = { model: "AnsaldoBreda Z2M", type: "Double-deck electric multiple unit", builder: "AnsaldoBreda (Pistoia)", built: "2006–2010",
  fleet: "24 four-car units", topSpeedMph: 99 };
export const FACTS = {
  tnrZ2mCab: { ...z2m, lengthFt: 341, source: ONCF,
    about: "The Z2M runs ONCF's Train Navette Rapide shuttles round Casablanca and the Al Bidaoui trains to Mohammed V airport. A motor car with a cab stands at each end of the four-car unit, its pantograph over the single-deck section behind the cab; 3 kV DC, up to 160 km/h." },
  tnrZ2mMid: { ...z2m, source: TAF,
    about: "The two trailers between the motor cars. Like the Italian TAF it derives from, the Z2M is double-deck between the trucks, with two wide double doors a side at the low floor and a single-deck saloon over each truck." },
};
