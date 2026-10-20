// Estonia's passenger cars (Elron, scripts/railroads/elron.py): Trainsheet's
// own side views from each model's published dimensions, in Elron's orange.
// The live map names the run, not the unit, so each train is drawn as what
// typically runs on its line: electric units on the lines under wires west
// and east of Tallinn, diesel FLIRTs on the rest.

import { path, rect } from "../carart.js?v=dev";
import { flirt, letters, strokes } from "./digitraffic.cars.js?v=dev";
import { regioPanter } from "./vivi.cars.js?v=dev";

const ORANGE = "#f26a21", GRAPHITE = "#3a3d42", WHITE = "#f6f6f4";
const elronMark = (c, x, y, h) => letters(c, x, y, h, "elron", WHITE, { weight: 700, spacing: -0.02 * h });
// Elron's scheme: orange, a graphite crescent sweeping back from the
// windshield over the top of the side and down behind the cab, a white
// line low along the side curving up the nose, white slashes leaning by
// the doors, a graphite skirt and gray roof; elron in white.
const elronSide = (L, { cab, door, w = 4.27, line = 3.95 }) => {
  let s = path(`M0 ${line}L${L} ${line}L${L} ${line + 0.35}L0 ${line + 0.35}Z`, WHITE);
  s += strokes(door + w + 0.6, line + 0.6, line + 5.2, 3, { w: 0.42, gap: 0.8, lean: 1.6, fills: [WHITE] });
  if (cab) s += path("M0 6.8Q9 4.2 19.5 5.9Q25 7.0 27.5 12.95L0 12.95Z", GRAPHITE) + path(`M0 ${line + 0.35}Q2.4 ${line + 1.6} 3.2 6.4L2.6 6.6Q1.8 ${line + 1.9} 0 ${line + 0.9}Z`, WHITE);
  return s;
};

// --- Stadler FLIRT for the 1520 mm gauge (2012-14): 18 electric units
// (twelve three-car, six four-car, about 75 m) and 20 diesel ones (six
// two-car, eight three-car, six four-car), the first diesel FLIRTs, with
// supercapacitors to help them away: the FLIRT sections
// (digitraffic.cars.js) in Elron's orange; the electric units' pantograph
// on a middle section, the diesel units' radiators and exhausts there.
const flirtK = (diesel) => ({ body: ORANGE, roof: "#8d949c", skirt: GRAPHITE, mask: "#17191c", diesel,
  paint: (c, g, part) => elronSide(g.L, { cab: part === "cab", door: part === "cab" ? 24.0 : 18.5 }) +
    (part === "cab" ? elronMark(c, 50.0, 5.0, 1.4) : elronMark(c, 36.0, 5.0, 1.0)) });
const EMU_K = flirtK(false), DMU_K = flirtK(true);
const emuCab = (c) => flirt(c, "cab", EMU_K);
const emuSection = (c) => flirt(c, "mid", EMU_K);
const dmuCab = (c) => flirt(c, "cab", DMU_K);
const dmuSection = (c) => flirt(c, "mid", DMU_K);

// --- Škoda 21Ev (16 three-car units, 2024-26; eleven for long distances,
// five suburban): the RegioPanter family, as Vivi's 16Ev (vivi.cars.js),
// in Elron's scheme.
const SKODA = { body: ORANGE, roof: "#8d949c", skirt: GRAPHITE, door: ORANGE, mask: "#17191c",
  paint: (c, g, cab) => elronSide(g.L, { cab: false, door: cab ? 16.4 : g.L - 13.8, w: 4.6, line: 4.6 }) + (cab ? path("M0 7.3Q8 4.9 18 6.8Q23 8.0 25.5 13.2L0 13.2Z", GRAPHITE) : "") +
    (cab ? elronMark(c, 48.0, 5.6, 1.5) : elronMark(c, g.L / 2, 5.6, 1.2)) + rect(0, 13.0, g.L, 0.2, GRAPHITE) };

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
  elronEmuCab: M(emuCab, 70.5, true),
  elronEmuMid: M(emuSection, 51.5),
  elronDmuCab: M(dmuCab, 70.5, true),
  elronDmuMid: M(dmuSection, 51.5),
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
    // Tallinn-Tartu-Rīga (since 12 January 2026): a two-car diesel FLIRT,
    // one of the three ERA cleared for Latvia's lines (vivi.lv and ERR).
    if (/Rīga/.test(r)) return set("Two-car Stadler FLIRT diesel unit (one of the three cleared for Latvia)", ["elronDmuCab", 2]);
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
