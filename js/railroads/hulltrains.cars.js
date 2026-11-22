// Hull Trains' cars (scripts/railroads/gb.py): the open-access trains between
// London King's Cross and Hull (some on to Beverley), all of them worked by
// one fleet, Hitachi's Class 802/3 "Paragon". The timetable names no unit,
// and there is only the one model to draw. Trainsheet's own side views from
// published dimensions, at the shared scale (js/carart.js), in Hull Trains'
// dark blue and magenta, lettered here (no logo files). The Hitachi AT300
// body and the Great Britain toolkit from avanti.cars.js.

import { path } from "../carart.js?v=dev";
import { ft, bands, letters, yellowEnd, AT300, at300Cab, at300Mid } from "./avanti.cars.js?v=dev";

// ---------- Paint ----------
// Hull Trains since the Paragons arrived in 2019, drawn from memory of
// photographs and not checked against them: FirstGroup's dark blue all
// over, the roof too, with the windows in a near-black band and a charcoal
// skirt; behind each cab a magenta ribbon sweeps up from the skirt to the
// roof, a thin pale-blue one alongside it; magenta doors; a yellow warning
// panel on the nose; "Hull Trains" in white, mixed case, on the cab side
// and mid-car under the windows.
const HT = { blue: "#1b2a5b", deep: "#131f47", roof: "#16224c", band: "#1a1c22", skirt: "#26282e", pink: "#de005c", sky: "#6cc4e8", white: "#f5f5f6",
  gold: "#d8b25a" };
const HT_FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

// Hull Trains' name, h ft tall, centered on x.
const hullName = (c, x, y, h, fill = HT.white) => letters(c, x, y, h, "Hull Trains", fill, { weight: 700, spacing: "-0.01em", family: HT_FONT });
// The ribbons behind the cab: from the skirt at x, leaning back to the roof.
const ribbon = (x, w, fill) => path(`M${x} 3.7Q${x + 6.5} 5.2 ${x + 9.5} 13L${x + 9.5 + w} 13Q${x + 6.5 + w} 5.2 ${x + w * 1.6} 3.7Z`, fill);

// ---------- Class 802/3 Paragon ----------
// Hitachi's AT300 as built for Hull Trains, 2018-2019: five aluminium cars,
// the driving cars 25.7 m and the three between them 26.0 m (129.4 m in
// all), each on two trucks; two single-leaf pocket sliding doors a side on
// every car; a pantograph on each driving car and an MTU 12V 1600 R80L
// diesel of 700 kW under each of the three middle cars; 200 km/h. Formed
// DPTS-MS-MS-MC-DPTF: 327 seats, 43 of them First. Units 802 301-305.
// (Wikipedia, "British Rail Class 802", infobox; the body's other
// dimensions with the AT300 in avanti.cars.js.)
const P_CAB = ft(25.7);
const PARAGON = {
  door: HT.pink, surround: HT.band, roofTrim: "#3b4466",
  paint: (cab) => (c, g) => bands(g.L, [[0, 20, HT.blue], [11.3, 3, HT.roof], [6.4, 3.45, HT.band], [0, 3.7, HT.skirt]]) +
    (cab ? path("M-1 2.9L-1 13L30 13L30 9.85L27 3.7Z", HT.deep) + ribbon(28.5, 1.9, HT.pink) + ribbon(31.6, 0.55, HT.sky) +
      // The black mask round the windshield, running back into the window band.
      path("M3.0 7.1Q7.4 8.9 11.6 10.7L21.8 10.7L21.8 7.2L10.0 7.0Q6.0 7.0 3.0 7.1Z", HT.band) + yellowEnd(5.2, 2.9, 6.6) : ""),
  over: (c, g, cab) => (cab ? hullName(c, 15.6, 4.75, 1.5) + letters(c, g.L - 12, 4.5, 0.36, "802 3", HT.white, { weight: 600, spacing: "0.06em" })
    : hullName(c, g.L / 2, 4.6, 1.35)) +
    (c.cls === "first" ? letters(c, cab ? 52 : g.L * 0.7, 10.55, 0.62, "FIRST", HT.gold, { weight: 700, spacing: "0.14em" }) : ""),
};

// ---------- Tables ----------

// Hull Trains' classes: First (2+1, in the driving car at the London end
// and part of the car behind it) and Standard (2+2). Each is its own type,
// placed in the formation, with its own fact sheet.
export const TYPES = {
  ht802First: { name: "Class 802 Paragon First end car", kind: "emu", pan: true, amenities: ["first"] },
  ht802Comp: { name: "Class 802 Paragon First and Standard car", kind: "emu", amenities: ["first"] },
  ht802Mid: { name: "Class 802 Paragon Standard car", kind: "emu" },
  ht802Cab: { name: "Class 802 Paragon Standard end car", kind: "emu", pan: true },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => `${ctx.index}/${ctx.count}`;
export const MODELS = {
  ht802First: M((c) => at300Cab({ ...c, cls: "first", pan: true }, PARAGON), P_CAB, true),
  ht802Comp: M((c) => at300Mid({ ...c, cls: "first", engine: true }, PARAGON), AT300.mid, false, byIndex),
  ht802Mid: M((c) => at300Mid({ ...c, engine: true }, PARAGON), AT300.mid, false, byIndex),
  ht802Cab: M((c) => at300Cab({ ...c, pan: false }, PARAGON), P_CAB, true),
};

// Units by number: 802 301-305, the whole fleet. The timetable names no
// unit; these are for the fleet pages.
export const FLEETS = {
  hulltrains: [[802301, 802305, "ht802First"]],
};

const set = (label, ...units) => ({ label, units });
const P802 = set("Class 802 Paragon: five cars, electric and diesel; First in the leading car and part of the next (some trains run as two sets coupled)",
  ["ht802First", 1], ["ht802Comp", 1], ["ht802Mid", 2], ["ht802Cab", 1]);

// Every Hull Trains service is a Paragon.
export const TYPICAL = {
  hulltrains: () => P802,
};

const W802 = "https://en.wikipedia.org/wiki/British_Rail_Class_802";
const p802 = { model: "Hitachi Class 802/3 Paragon (AT300)", type: "Bi-mode multiple unit (electric and diesel)", builder: "Hitachi Rail", built: "2018–2019",
  fleet: "5 five-car units", topSpeedMph: 125, powerHp: 2816, seats: 327, source: W802 };
export const FACTS = {
  ht802First: { ...p802, lengthFt: 424.5,
    about: "The Paragon's First class driving car, seated 2+1. Hull Trains' whole fleet is five of these five-car trains, named for Hull's Paragon station; they run under the wires from King's Cross to Temple Hirst Junction, south of Selby, and on their diesel engines from there to Hull and Beverley. In service since late 2019, replacing the diesel Class 180s." },
  ht802Comp: { ...p802,
    about: "The composite car: the rest of First class (43 seats in all) and Standard seats beyond a partition. One of the three middle cars with an MTU diesel engine of 700 kW under its floor (the power shown is the three together)." },
  ht802Mid: { ...p802,
    about: "Standard class, seated 2+2; the train seats 284 in Standard. Each of the three middle cars carries a diesel engine under its floor, its exhaust on the roof." },
  ht802Cab: { ...p802,
    about: "The Standard class driving car at the Hull end. Both driving cars carry a pantograph; on the busiest trains two five-car sets run coupled." },
};
