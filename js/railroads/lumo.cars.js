// Lumo's cars (scripts/railroads/gb.py, "lumo"): FirstGroup's open-access
// trains on the East Coast Main Line between London King's Cross and
// Edinburgh, all of them worked by one fleet, Hitachi's Class 803. The
// timetable names no unit, and there is only the one model to draw.
// Trainsheet's own side views from published dimensions, at the shared
// scale (js/carart.js), in Lumo's blue, lettered here (no logo files). The
// Hitachi AT300 body and the Great Britain toolkit from avanti.cars.js.

import { path } from "../carart.js?v=dev";
import { bands, letters, AT300, at300Cab, at300Mid } from "./avanti.cars.js?v=dev";

// ---------- Paint ----------
// Lumo since its first train in October 2021, drawn from memory of
// photographs and not checked against them: one bright blue all over, the
// nose and the doors too, with no yellow panel; the windows in a near-black
// band that runs forward into the windshield's mask; a darker blue roof and
// a charcoal skirt; "lumo" in white, lower case and round, large on the cab
// side and smaller under the windows of every car.
const LU = { blue: "#2b6ef5", deep: "#1f56cf", roof: "#1b47a8", band: "#16181d", skirt: "#262a31", door: "#3f7dfa", white: "#f6f7f9" };
const LU_FONT = "'Arial Rounded MT Bold', 'Varela Round', 'Helvetica Neue', Helvetica, Arial, sans-serif";

// Lumo's name, h ft tall, centered on x.
const lumoName = (c, x, y, h, fill = LU.white) => letters(c, x, y, h, "lumo", fill, { weight: 700, spacing: "0.01em", family: LU_FONT });

// ---------- Class 803 ----------
// Hitachi's AT300 as built for Lumo at Newton Aycliffe, 2020-2021: five
// aluminium cars, the driving cars 25.85 m and the three between them
// 26.0 m (129.7 m in all), 2.7 m wide, each on two trucks; two single-leaf
// pocket sliding doors a side on every car; electric only, 25 kV 50 Hz
// overhead, a pantograph on each driving car and the motors under the three
// middle cars, with no diesel engine (a battery keeps the lights and air
// conditioning on if the wires fail); 200 km/h. Formed DPTS-MS-MS-MS-DPTS:
// 402 seats, all Standard. Units 803 001-005. (Wikipedia, "British Rail
// Class 803", infobox; car lengths and the body's other dimensions with the
// AT300 in avanti.cars.js, the infobox giving none.)
const C803 = {
  door: LU.door, surround: LU.band, roofTrim: "#2f58b4",
  paint: (cab) => (c, g) => bands(g.L, [[0, 20, LU.blue], [11.3, 3, LU.roof], [6.4, 3.45, LU.band], [0, 3.7, LU.skirt]]) +
    // The cab end: blue down to the rail over the nose, a shade deeper low
    // on the fairing; the black mask round the windshield, running back
    // into the window band.
    (cab ? path("M-1 2.9L-1 13L24 13L24 3.7Z", LU.blue) + path("M-1 2.9L-1 4.3L13.5 4.3L15.5 3.7L15.5 2.9Z", LU.deep) +
      path("M3.0 7.1Q7.4 8.9 11.6 10.7L21.8 10.7L21.8 7.2L10.0 7.0Q6.0 7.0 3.0 7.1Z", LU.band) : ""),
  over: (c, g, cab) => (cab ? lumoName(c, 14.2, 4.6, 1.9) + letters(c, g.L - 12, 4.5, 0.36, "803", LU.white, { weight: 600, spacing: "0.06em" })
    : lumoName(c, g.L / 2, 4.6, 1.45)),
};

// ---------- Tables ----------

// Lumo has one class, Standard (2+2), through the whole train; the two
// driving cars differ from the middle ones, not from each other.
export const TYPES = {
  lu803Cab: { name: "Class 803 end car", kind: "emu", pan: true },
  lu803Mid: { name: "Class 803 car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => `${ctx.index}/${ctx.count}`;
export const MODELS = {
  // The leading car's pantograph is drawn raised, the trailing one's down.
  lu803Cab: M((c) => at300Cab({ ...c, pan: c.index === 0 }, C803), AT300.cab, true, byIndex),
  lu803Mid: M((c) => at300Mid(c, C803), AT300.mid, false, byIndex),
};

// Units by number: 803 001-005, the whole fleet. The timetable names no
// unit; these are for the fleet pages.
export const FLEETS = {
  lumo: [[803001, 803005, "lu803Cab"]],
};

const set = (label, ...units) => ({ label, units });
const S803 = set("Class 803: five cars, electric, Standard class throughout (some trains run as two sets coupled)",
  ["lu803Cab", 1], ["lu803Mid", 3], ["lu803Cab", 1]);

// Every Lumo service on the East Coast is a Class 803.
export const TYPICAL = {
  lumo: () => S803,
};

const W803 = "https://en.wikipedia.org/wiki/British_Rail_Class_803";
const c803 = { model: "Hitachi Class 803 (AT300)", type: "Electric multiple unit", builder: "Hitachi Rail (Newton Aycliffe)", built: "2020–2021",
  fleet: "5 five-car units", topSpeedMph: 125, seats: 402, source: W803 };
export const FACTS = {
  lu803Cab: { ...c803, lengthFt: 425.5,
    about: "The Class 803's driving car, a pantograph on its roof. Lumo's whole East Coast fleet is five of these five-car trains, in service since October 2021 between London King's Cross and Edinburgh by way of Newcastle and Morpeth. One class, Standard, with 402 seats to a train; food comes from a trolley, and there is no buffet or kitchen." },
  lu803Mid: { ...c803,
    about: "Standard class, seated 2+2. The three middle cars carry the traction motors. Unlike the bi-mode Azumas it shares the line with, the 803 has no diesel engine: it is electric only, with a battery to keep the lights and air conditioning on should the overhead wire fail." },
};
