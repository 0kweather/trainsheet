// Fertagus's cars (scripts/railroads/fertagus.py): the double-deck 3500s
// of the Eixo Norte-Sul, Roma-Areeiro–Pragal (over the 25 de Abril
// bridge)–Coina–Setúbal. The timetable names no unit, so a train is drawn
// as the four-car unit that runs every trip, labeled as typical. The body
// is CP's 3500 (cp.cars.js, the same Alstom and CAF design), painted here
// in Fertagus's blue by the car's railroad (c.agency).

import { ddCar } from "./cp.cars.js?v=dev";

export const TYPES = {
  ftDdCab: { name: "3500 double-deck motor car", kind: "emu" },
  ftDdMid: { name: "3500 double-deck trailer", kind: "emu", pan: true },
};
const byIndex = (ctx) => ctx.index;
export const MODELS = {
  ftDdCab: { draw: (c) => ddCar(c, true), len: 87.4, oneEnd: true, variant: null },
  ftDdMid: { draw: (c) => ddCar(c, false), len: 87.4, oneEnd: false, variant: byIndex },
};

// Units 3501-3518, for the fleet page.
export const FLEETS = {
  fertagus: [[3501, 3518, "ftDdCab"]],
};

const UNIT = { label: "3500: a four-car double-deck electric unit (at busy times two coupled)", units: [["ftDdCab", 1], ["ftDdMid", 2], ["ftDdCab", 1]] };
export const TYPICAL = {
  fertagus: () => UNIT,
};

const ft = { model: "Fertagus 3500", type: "Double-deck electric multiple unit", builder: "Alstom and CAF", built: "1999", fleet: "18 four-car units (3501–3518)",
  topSpeedMph: 87, seats: 476, lengthFt: 349.7, source: "https://pt.wikipedia.org/wiki/S%C3%A9rie_3500_da_CP" };
export const FACTS = {
  ftDdCab: { ...ft, about: "A double-deck motor car with the cab. One class throughout. Fertagus, the private operator of the railway across the 25 de Abril bridge, runs the line under a concession to March 2031; two cars bought from Renfe will lengthen two units to five cars from 2027." },
  ftDdMid: { ...ft, about: "A double-deck trailer, the floor dropped low between the trucks; doors in the end sections over them. Several units run in full advertising wraps instead of the blue." },
};
