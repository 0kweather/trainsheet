// Island Line's cars (scripts/railroads/gb.py, "islandline"): the Isle of
// Wight's one railroad, Ryde Pier Head to Shanklin, run by South Western
// Railway. One fleet: the Class 484, Vivarail's rebuild of London
// Underground D78 Stock, two cars. The timetable names no unit, so a train
// is drawn as that fleet, labeled as typical. Trainsheet's own side views
// from published dimensions, at the shared scale (js/carart.js), in Island
// Line's blue, lettered here (no logo files). The toolkit from
// avanti.cars.js; the body is new here.

import { rect, path } from "../carart.js?v=dev";
import { bands, boxes, ft, spread, leaf, yellowEnd, fairing, unit, letters } from "./avanti.cars.js?v=dev";

// ---------- Paint ----------
// Island Line since 2021, drawn from memory and not checked against
// photographs: South Western Railway's scheme in the island's blue (the
// railroad's #0092cb, toned down a little): blue sides with no window band,
// a darker gray roof, a navy band along the foot of the side under a fine
// yellow line, a navy cab end closing in three slanted pale stripes, pale
// gray doors, "Island Line" in white under the windows, and the flat front
// yellow round a black windshield mask.
const IL = { blue: "#1487b8", navy: "#1c2f5e", pale: "#d9dee4", door: "#cfd4da", white: "#f6f4f2", band: "#1f2126", skirt: "#33363b", roof: "#6f757c", trim: "#9aa0a7",
  yellow: "#f2c400" };

// The name, mixed case, h ft tall, centered on x; reads left to right on a
// mirrored car too.
const name = (c, x, y, h = 1.15) => letters(c, x, y, h, "Island<tspan font-weight=\"300\" dx=\"0.22em\">Line</tspan>", IL.white, { weight: 700, spacing: "0.01em" });
// The class, small on the navy band at the inner end of a car.
const classNo = (c, x, y, text) => letters(c, x, y, 0.36, text, IL.pale, { weight: 600, spacing: "0.06em" });

// ---------- Vivarail Class 484 ----------
// Metro-Cammell built the D78 Stock for London Underground's District line
// in 1978-1981; Vivarail rebuilt ten driving cars as five two-car units
// (484 001-005) in 2020-2021 for the Island Line, in service since November
// 2021 in place of the 1938 Tube Stock. Two driving motor cars, each
// 18.652 m over couplers (37.304 m a unit), 2.84 m wide, 3.63 m tall, of
// aluminum; 790 mm wheels; 750 V third rail, 448 kW, 60 mph by design and
// 45 mph in service; four single-leaf pocket sliding doors a side, each
// 1.127 m wide; a flat cab front with no gangway door, the cars joined by
// a gangway between them. (Wikipedia, "British Rail Class 484". The door
// and window places, the low surface-stock floor and the truck centers are
// from memory of the D78.)
const D = { roof: ft(3.63), sill: 3.4, car: ft(18.652), door: ft(1.127), top: 10.2 };
const NOSE_484 = [[0.35, 2.9], [0.3, 6.4], ["q", 0.3, 7.2, 0.55, 7.9], [1.1, D.roof - 0.8], ["q", 1.4, D.roof, 2.6, D.roof]];
// The doors' left edges, evenly along the side behind the cab.
const DOORS = [10.4, 24.1, 37.8, 51.5];
const door = (x) => leaf(x, D.sill, D.top, D.door, IL.door);
// The windows: a pair between each two doors, one small one behind the cab
// door and one at the inner end.
const rows = (L) => [{ xs: [...DOORS.slice(0, -1).flatMap((x, i) => spread(x + D.door + 0.7, DOORS[i + 1] - 0.7, 3.7, 4.5)), ], y: 6.3, w: 3.7, h: 2.9, r: 0.35 },
  { xs: [DOORS[3] + D.door + 0.8], y: 6.3, w: L - DOORS[3] - D.door - 2.2, h: 2.9, r: 0.35 }];
// The navy cab end, closing in three slanted pale stripes.
const cabEnd = () => path(`M-1 ${D.sill}L8.2 ${D.sill}L11.4 ${D.roof - 0.6}L-1 ${D.roof - 0.6}Z`, IL.navy) +
  [0, 1, 2].map((k) => path(`M${9.0 + k * 1.15} ${D.sill + 1.1}L${9.55 + k * 1.15} ${D.sill + 1.1}L${12.0 + k * 1.15} ${D.roof - 0.6}L${11.45 + k * 1.15} ${D.roof - 0.6}Z`, IL.pale)).join("");
// The third rail's shoe beam, between a truck's axles.
const shoe = (x) => rect(x - 2.2, 0.9, 4.4, 0.32, "#5a5d62", 0.4) + rect(x - 0.7, 0.52, 1.4, 0.38, "#3a3c40", 0.4);
const side = (more = "") => (c, g) => bands(g.L, [[0, 20, IL.blue], [D.roof - 0.6, 3, IL.roof], [0, D.sill + 1.1, IL.navy], [D.sill + 1.1, 0.14, IL.yellow], [0, D.sill, IL.skirt]]) + more;

// A driving motor car: cab at the left, gangway at the right.
function d78Cab(c) {
  const L = c.L;
  return unit(c, { roof: D.roof, sill: D.sill, nose: NOSE_484, rake: [[0.6, 7.3], [1.1, D.roof - 1.1]], depth: 1.6, cabLen: 6, lampY: 4.6, low: 3.8,
    rows: rows(L), doors: DOORS.map(door), trucks: [10.6, L - 10.6], wheel: 31, diaphragm: [3.8, 10.6],
    // The front yellow from the skirt to the roof, round the windshield's mask.
    paint: side(cabEnd() + yellowEnd(2.0, 2.9, D.roof - 0.6) + path(`M0.5 7.1L1.1 ${D.roof - 0.8}L3.2 ${D.roof - 0.8}L3.2 7.1Z`, IL.band)), surround: IL.band,
    extra: (cc, g) => fairing(2.6, g.L - 0.8, D.roof, IL.trim) +
      // Roof vents in a row (no air conditioning), traction gear and
      // batteries under the floor.
      spread(14, g.L - 6, 2.4, 6.9).map((x) => rect(x, D.roof + 0.25, 2.4, 0.3, IL.trim, 0.4, 'rx="0.12"')).join("") +
      boxes(15.5, g.L - 15.5, D.sill, 4, 1.25) + shoe(10.6) + shoe(g.L - 10.6) +
      // The cab's side window and door.
      rect(3.6, 7.2, 1.5, 2.3, "#1d2026", 0.4) + rect(5.7, 3.7, 1.9, 6.5, "rgba(255,255,255,0.10)", 0.5) +
      name(cc, (DOORS[1] + D.door + DOORS[2]) / 2, 5.0) + classNo(cc, g.L - 5.2, 3.75, "484") });
}

// ---------- Tables ----------

export const TYPES = {
  il484Cab: { name: "Class 484 driving motor car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  il484Cab: M(d78Cab, D.car, true),
};

// Units by number (class and serial run together): 484 001-005. The
// timetable names no unit; these are for the fleet pages.
export const FLEETS = {
  islandline: [[484001, 484005, "il484Cab"]],
};

const set = (label, ...units) => ({ label, units });
const E484 = set("Class 484: two cars, electric, on the third rail; rebuilt from London Underground D78 Stock", ["il484Cab", 2]);

// The only fleet: every Island Line train is a 484, one unit or two coupled.
export const TYPICAL = {
  islandline: () => E484,
};

const W484 = "https://en.wikipedia.org/wiki/British_Rail_Class_484";
export const FACTS = {
  il484Cab: { model: "Vivarail Class 484 (D-Train)", type: "Electric multiple unit", builder: "Metro-Cammell (Birmingham, as D78 Stock); rebuilt by Vivarail", built: "1978–1981; rebuilt 2020–2021",
    fleet: "5 two-car units", topSpeedMph: 60, powerHp: 601, lengthFt: 122.4, source: W484,
    about: "A driving motor car of the Island Line's Class 484: both cars of a unit have a cab, with a gangway between them. Built for London Underground's District line as D78 Stock and rebuilt by Vivarail, they took over the Isle of Wight's 8.5 miles from Ryde Pier Head to Shanklin in November 2021 from 1938 Tube Stock, then 83 years old. Four single sliding doors a side; 45 mph in service on the 750 V third rail." },
};
