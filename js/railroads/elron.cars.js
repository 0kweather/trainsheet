// Estonia's passenger cars (Elron, scripts/railroads/elron.py): Trainsheet's
// own side views from each model's published dimensions, in Elron's orange.
// The live map names the run, not the unit, so each train is drawn as what
// typically runs on its line: electric units on the lines under wires west
// and east of Tallinn, diesel FLIRTs on the rest.

import { flirtCar, flirtMid } from "../carmodels.js?v=dev";
import { pantograph } from "../carart.js?v=dev";
import { flirtIn } from "./digitraffic.cars.js?v=dev";
import { regioPanter } from "./vivi.cars.js?v=dev";

const ORANGE = "#ff711d", GRAPHITE = "#3f4247";

// --- Stadler FLIRT for the 1520 mm gauge (2012-14): 18 electric units
// (twelve three-car, six four-car, about 75 m) and 20 diesel ones (six
// two-car, eight three-car, six four-car), the first diesel FLIRTs, with
// supercapacitors to help them away. carmodels.js's FLIRT sections, orange
// with graphite over the roof and down the nose; the electric units'
// pantograph on a middle section.
const COLORS = { body: ORANGE, top: GRAPHITE, line: GRAPHITE };
const flirtCab = (c) => flirtIn(flirtCar(c), COLORS);
const flirtSection = (c) => flirtIn(flirtMid(c), COLORS) + (c.pan ? pantograph(c.L / 2, 14.06) : "");

// --- Škoda 21Ev (16 three-car units, 2024-26; eleven for long distances,
// five suburban): the RegioPanter family, as Vivi's 16Ev (vivi.cars.js).
const SKODA = { body: ORANGE, low: ORANGE, skirt: GRAPHITE, roof: "#8d949c" };

export const TYPES = {
  elronEmuCab: { name: "Stadler FLIRT electric cab section", kind: "emu", pan: true },
  elronEmuMid: { name: "Stadler FLIRT electric section", kind: "emu", pan: true },
  elronDmuCab: { name: "Stadler FLIRT diesel cab section", kind: "emu" },
  elronDmuMid: { name: "Stadler FLIRT diesel section", kind: "emu" },
  elronEvCab: { name: "Škoda 21Ev cab car", kind: "emu" },
  elronEvMid: { name: "Škoda 21Ev car", kind: "emu", pan: true },
};
const M = (draw, len, oneEnd = false) => ({ draw, len, oneEnd, variant: null });
export const MODELS = {
  elronEmuCab: M(flirtCab, 70.5, true),
  elronEmuMid: M(flirtSection, 51.5),
  elronDmuCab: M(flirtCab, 70.5, true),
  elronDmuMid: M(flirtSection, 51.5),
  elronEvCab: M((c) => regioPanter(c, SKODA, { cab: true }), 87.5, true),
  elronEvMid: M((c) => regioPanter(c, SKODA), 87.5),
};

// Elron publishes no unit numbers we could check: 0 stands for the 21Ev, so
// the railroad's page lists it beside the FLIRTs its lines show (no feed
// reports a car 0).
export const FLEETS = { elron: [[0, 0, "elronEvCab"]] };

// The lines under wires (Paldiski, Kloogaranna, Turba, Keila, Pääsküla,
// Aegviidu) get electric FLIRTs, now joined by the 21Evs; the long lines to
// Tartu, Narva and Viljandi three- or four-car diesel FLIRTs; Tartu's
// branches (Koidula, Valga, Jõgeva) two-car ones.
const set = (label, ...units) => ({ label, units });
const EMU = set("Three-car Stadler FLIRT electric unit", ["elronEmuCab", 1], ["elronEmuMid", 1], ["elronEmuCab", 1]);
const EV = set("Three-car Škoda 21Ev", ["elronEvCab", 1], ["elronEvMid", 1], ["elronEvCab", 1]);
const DMU3 = set("Three-car Stadler FLIRT diesel unit", ["elronDmuCab", 1], ["elronDmuMid", 1], ["elronDmuCab", 1]);
const DMU2 = set("Two-car Stadler FLIRT diesel unit", ["elronDmuCab", 2]);
const ELECTRIC = /Paldiski|Kloogaranna|Turba|Keila|Pääsküla|Aegviidu/;
export const TYPICAL = {
  elron: (t, reported) => {
    const r = t.route || "";
    if (/^elronEv/.test(reported || "")) return EV;
    if (/^elronEmu/.test(reported || "")) return EMU;
    if (/^elronDmu/.test(reported || "")) return DMU3;
    if (ELECTRIC.test(r)) return EMU;
    return /^Tartu–/.test(r) ? DMU2 : DMU3;
  },
};

const SOURCE = "https://en.wikipedia.org/wiki/Elron_(rail_transit)";
export const FACTS = {
  elronEmuCab: { model: "Stadler FLIRT (electric)", type: "Electric multiple unit", builder: "Stadler Rail", built: "2012–2014",
    fleet: "18 units: 12 three-car, 6 four-car", topSpeedMph: 99.4, seats: 188,
    about: "Elron's electric trains on the lines around Tallinn, which with the diesel FLIRTs replaced the Soviet-era ER2 and DR1 trains by 2015. The four-car units, about 75 m long, seat 262.",
    source: SOURCE },
  elronDmuCab: { model: "Stadler FLIRT (diesel)", type: "Diesel-electric multiple unit", builder: "Stadler Rail", built: "2013–2014",
    fleet: "20 units: 6 two-car, 8 three-car, 6 four-car", topSpeedMph: 99.4, seats: 161,
    about: "The first diesel FLIRTs, with supercapacitors to boost acceleration. They run Elron's long-distance trains to Tartu, Narva, Viljandi and Valga with a first-class section; the three-car units seat 24 in first and 137 in second.",
    source: SOURCE },
  elronEvCab: { model: "Škoda 21Ev", type: "Electric multiple unit", builder: "Škoda Group", built: "2024–2026",
    fleet: "16 three-car units (11 long-distance, 5 suburban)", topSpeedMph: 99.4,
    about: "Built for both 3 kV DC and 25 kV AC as Estonia changes its wires. The first entered suburban service on 15 December 2025; the long-distance sets will run shorter routes until the Tartu line is electrified beyond Tapa.",
    source: SOURCE },
};
// A unit's other cars share its sheet, named for the part they are.
const part = (facts, name) => ({ ...facts, model: `${facts.model}, ${name}` });
FACTS.elronEmuMid = part(FACTS.elronEmuCab, "intermediate section");
FACTS.elronDmuMid = part(FACTS.elronDmuCab, "intermediate section");
FACTS.elronEvMid = part(FACTS.elronEvCab, "middle car");
