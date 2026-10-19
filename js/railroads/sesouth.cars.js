// Southern and western Sweden's regional trains (scripts/railroads/sweden.py):
// Pågatåg (Skånetrafiken's purple local trains), Öresundståg (the Malmö-
// Copenhagen trains and their runs up the west coast and into Småland and
// Blekinge), Västtåg (Västtrafik's regional and Göteborg commuter trains)
// and Krösatåg (Småland's regional trains). Trainsheet's own side views,
// built from each class's published dimensions (järnväg.net's vagnguide,
// Swedish Wikipedia, the operators' own drawings) and photographs of the
// current paint; lettering is drawn as type, not copied from the
// operators' logos. Units are feet (carart.js); the metric figures they
// come from are given beside them.

import { bilevel, married, newId } from "../carmodels.js?v=dev";
import { C, rect, path, line, lines, poly, slats, truck, pantograph, win } from "../carart.js?v=dev";
import { letters, hvac, roofCover, panGear, horns, lamp, RED_LAMP, wiper, emuFront, boxes, frames } from "./digitraffic.cars.js?v=dev";

const ft = (m) => Math.round(m * 3.28084 * 100) / 100;
const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
const r2 = (v) => Math.round(v * 100) / 100;

// ===================== Alstom Coradia Nordic (X61) =====================

// --- X61 (Alstom Coradia Nordic, "Coradia LIREX"; 139 built 2009-19:
// Skånetrafiken 001-099, Västtrafik 61401-61422, Östgötatrafiken):
// 74.3 m over couplers in four articulated sections, Bo'(Bo')(2')(Bo')Bo',
// a motor bogie under each cab and Jakobs bogies under the three joints
// (the middle one unpowered); 4.28 m tall over the roof equipment, 3.26 m
// wide, a 760 mm low floor (raised over the bogies) (järnväg.net, SL X60 on
// Wikipedia). Section lengths, doors and windows from Skånetrafiken's
// side drawing (järnväg.net, X61stor.jpg): end sections about 20.7 m and
// middle ones 16.45 m; behind each cab a narrow single-leaf door, then a
// double plug door 16.1 m from the nose; the second section one double
// door near its far end, the third two; windows about 0.95 m wide at a
// 1.65 m pitch with a pillar after each pair. Västtrafik's units add a
// double door in each end section (seven a side against Skåne's five).
// The traction gear is on the roof under fairings, the pantograph at the
// rear of the second section with a second one, folded, across the joint
// on the third. The nose: a near-vertical lower face over the coupler
// (under a cover box), then a long sloping windshield in a dark surround,
// three lamps in a row on the crown.
const X61 = { roof: 12.6, sill: 3.3, cornerR: 1.0, end: 0.5, noTrucks: true, diaphragm: [2.4, 11.6], badge: false };
const X61_CAB = ft(20.7), X61_MID = ft(16.45);
const X61_LOW = 1.6;                 // the low floor's skirt, over the rail
const X61_WIN = { y: 5.1, w: 3.1, h: 3.0, r: 0.45 };
// Windows (m from the section's left end, as drawn by Skånetrafiken).
const X61_CAB_WINS = [5.29, 6.91, 8.91, 10.53, 12.19, 13.85, 17.43, 19.09];
const X61_A_WINS = [0.89, 2.55, 4.42, 6.13, 7.79, 9.41, 13.03, 14.69];
const X61_B_WINS = [0.74, 2.40, 6.02, 7.64, 9.30, 12.88, 14.58];
const X61_VT_CAB_WINS = [5.29, 6.91, 12.19, 13.85, 17.43, 19.09];
const x61Dbl = (m) => ({ x: ft(m) - 2.45, w: 4.9, y0: 2.1, y1: 9.6, leaves: 2, glassY: 0.42, glassH: 0.42, grabs: false });
const x61Single = { x: ft(3.36), w: 2.9, y0: 2.1, y1: 9.6, glassY: 0.4, glassH: 0.45, grabs: false };
// Each operator's paint.
//   Skånetrafiken (Pågatåg): a blue-violet all over, a lighter lilac sweep
//     from the foot of the nose up past the windshield and back along the
//     top of the side (fading out halfway down the end section), a deep
//     violet surround to the windshield; big pale chevrons across the sides
//     pointing out toward each end; "Pågatågen" in pale lilac script below
//     the windows behind the cab, the unit's name in white over its door.
//   Västtrafik (Västtåg, since the 2025-26 refresh): silver, the sky blue
//     of Västtrafik over the crown and around the windshield and in a
//     stripe low along the side, blue panels framing white doors, a gray
//     panel under the windshield, a dark gray skirt; "västtågen" in dark
//     gray on the end sections.
const X61_PAINT = {
  pagatag: { body: "#6e70c4", light: "#a9acec", deep: "#3a3c8c", skirt: "#4d4f9c", roof: "#8a8fc4", door: null, glass: C.glass },
  vasttag: { body: "#c8ccd1", light: "#1f9ee2", deep: "#2a2e34", skirt: "#3f444b", roof: "#9aa1a9", door: "#f2f3f4", glass: C.glass },
};
const x61Paint = (c) => X61_PAINT[c.agency] || X61_PAINT.pagatag;
// The Pågatåg chevrons: a row of pale arrows pointing to the left end.
const chevronRow = (x0, x1, y0, y1, pitch = 8.2) => {
  let s = "";
  const ym = (y0 + y1) / 2, arm = (y1 - y0) / 2 * 0.9, t = 1.7;
  for (let x = x0; x < x1; x += pitch) {
    s += path(poly([[x, ym], [x + arm, ym + arm], [x + arm + t, ym + arm], [x + t, ym], [x + arm + t, ym - arm], [x + arm, ym - arm]]), "rgba(255,255,255,0.10)");
  }
  return s;
};
// part: "cab", "a" (second section, the pantograph), "b" (third).
function x61(c, part) {
  const L = c.L, k = x61Paint(c), vt = c.agency === "vasttag", cab = part === "cab";
  const wins = (cab ? (vt ? X61_VT_CAB_WINS : X61_CAB_WINS) : part === "a" ? X61_A_WINS : X61_B_WINS).map(ft);
  const doors = cab ? [x61Single, ...(vt ? [x61Dbl(9.95)] : []), x61Dbl(16.1)] : part === "a" ? [x61Dbl(11.6)] : [x61Dbl(4.85), x61Dbl(11.55)];
  // The body: a low skirt between the bogies, raised over them.
  const drop = cab ? { a: ft(5.35) + 5.6, b: L - 5.6, y: X61_LOW } : { a: 5.6, b: L - 5.6, y: X61_LOW };
  return bilevel({ ...c, cabL: cab, cabR: false }, { ...X61, base: k.body, drop,
    nose: cab ? [[3.5, 3.3], [3.25, 4.6], ["q", 3.2, 5.8, 3.9, 6.6], [7.6, 10.9], ["q", 9.2, 12.6, 11.4, 12.6]] : null, cabLen: cab ? 10 : 0,
    rows: [{ xs: wins, ...X61_WIN }],
    doors,
    paint: (c, g) => {
      let s = rect(0, 11.4, L, 3, k.roof) + line(0, 11.4, L, 11.4, "rgba(0,0,0,0.15)", 0.5) + rect(0, 0, L, 2.6, k.skirt);
      if (vt) {
        // Blue stripe low on the side, blue panels around each door.
        s += rect(0, 3.5, L, 0.55, k.light) + rect(0, 10.6, L, 0.8, k.light);
        for (const d of doors) if (d.leaves) s += rect(d.x - 1.1, 2.6, d.w + 2.2, 8.8, k.light) + rect(d.x - 0.12, 2.0, d.w + 0.24, 7.75, k.door);
      } else {
        // Chevrons, pointing to the left end on the cab and second
        // sections and to the right on the third (drawn mirrored).
        const ch = chevronRow(cab ? ft(17.0) : 1.0, L - 1.0, 2.9, 10.2);
        s += part === "b" ? `<g transform="matrix(-1 0 0 1 ${r2(L)} 0)">${ch}</g>` : ch;
      }
      s += frames(wins, X61_WIN.y, X61_WIN.w, X61_WIN.h, 0.14, "#2a2d33");
      if (cab) s += x61CabPaint(c, k, vt);
      return s;
    },
    extra: (c, g) => x61Running(c, part) + x61Roof(c, part, g.roof),
    cab: () => x61Front(c, k, vt),
  });
}
// The cab section's paint: the sweep (or blue crown), the windshield's
// surround, the lettering.
function x61CabPaint(c, k, vt) {
  let s = "";
  if (vt) {
    // Blue over the crown, down around the windshield to the headlights;
    // silver below; the gray panel under the windshield.
    s += path("M0 13L0 8.6Q2.6 6.2 4.6 5.5L6.0 5.8Q4.6 7.0 4.0 7.9L9.5 12.0Q11.0 11.0 13.0 10.6L16.0 10.6L16.0 13Z", k.light) +
      path("M3.3 5.1L3.3 6.4Q4.2 5.6 5.4 5.4L5.2 5.0Z", "#5a6068") + rect(0, 0, 4.2, 2.6, k.skirt);
    s += letters(c, 40.0, 4.6, 1.15, "västtågen", "#3f444b", { weight: 700, spacing: -0.02 }) + letters(c, 19.0, 9.6, 0.6, "västtrafik", k.light, { weight: 700 });
  } else {
    // The lilac sweep: up from the foot of the nose along the windshield's
    // edge, then back along the top of the side, fading out.
    const id = newId();
    s += `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="6" y1="0" x2="${r2(ft(12))}" y2="0"><stop offset="0" stop-color="${k.light}"/>` +
      `<stop offset="0.6" stop-color="${k.light}" stop-opacity="0.7"/><stop offset="1" stop-color="${k.light}" stop-opacity="0"/></linearGradient></defs>`;
    s += path("M3.3 3.4L3.3 4.4Q6.5 6.8 9.8 10.5Q11.4 11.15 14 11.15L60 11.15L60 10.5L14.5 10.5Q11.9 10.5 10.6 9.7Q7.4 6.0 3.3 3.4Z", `url(#${id})`);
    s += letters(c, ft(7.3), 3.7, 0.95, "Pågatågen", "#c6c8f2", { weight: 400, italic: true }) + letters(c, ft(7.0), 4.55, 0.38, "Skånetrafiken", "#d6d8f6", { weight: 600 }) +
      letters(c, 13.0, 10.5, 0.48, "Birgit Nilsson", "#ffffff", { weight: 500, italic: true, anchor: "start" });
  }
  // The windshield's dark surround on the sloping nose.
  s += path("M3.45 6.25Q4.6 5.75 6.2 5.95L10.75 11.15L10.5 12.1Q9.2 12.35 7.9 11.9Z", vt ? k.light : k.deep);
  s += letters(c, 4.6, 3.0, 0.55, vt ? "61410" : "084", vt ? "#26292e" : "#ffffff", { weight: 500 });
  return s;
}
// The nose: windshield glass and wiper, the headlight cluster, the three
// lamps on the crown, the coupler in its pocket under the cover box.
function x61Front(c, k, vt) {
  let s = path(poly([[4.0, 6.5], [8.3, 11.55], ["q", 9.2, 11.85, 10.0, 11.6], [10.15, 11.1], [5.9, 6.3], ["q", 4.8, 6.2, 4.0, 6.5]]), C.glass) +
    path(poly([[4.5, 6.75], [6.6, 9.2], [7.3, 9.1], [5.3, 6.6]]), C.glassLight) + wiper(4.7, 6.7, 6.3, 9.4) +
    win(ft(2.82), 6.3, 1.3, 2.6, 0.3);
  s += lamp(3.35, 5.0, 0.65, 0.42) + lamp(3.45, 4.45, 0.3, 0.26, RED_LAMP);
  for (const [x, y] of [[8.6, 12.1], [9.4, 12.35], [10.2, 12.5]]) s += lamp(x, y, 0.42, 0.22);
  // Cover box over the coupler's head, the coupler, the anticlimber.
  s += emuFront(3.5, 3.3, { coupler: 2.6 }) + rect(0, 2.05, 1.6, 1.25, "#1d1f22", 0.3, 'rx="0.15"') + slats(0.15, 2.2, 1.3, 0.95, 0.35, "rgba(255,255,255,0.12)");
  return s;
}
// Bogies (a motor bogie under each cab, Jakobs bogies at the joints), the
// skirt over them, the few underfloor boxes (the gear is on the roof).
function x61Running(c, part) {
  const L = c.L;
  const jakobs = (x) => truck(x, { wb: ft(2.8), d: 30, top: 3.3 });
  let s = "";
  if (part === "cab") s += truck(ft(5.35), { wb: ft(2.6), d: 33, top: 3.3 }) + jakobs(L) + boxes(ft(9.0), ft(13.5), X61_LOW + 0.05, 2, 0.4);
  else s += jakobs(0) + jakobs(L) + boxes(L / 2 - 6, L / 2 + 6, X61_LOW + 0.05, 2, 0.35);
  return s;
}
// The roof: fairings over the converters, compressor and air conditioning
// (Skånetrafiken's drawing), and on the second section the pantograph with
// its breaker, a folded one on the third across the joint.
function x61Roof(c, part, roof) {
  const fair = (a, b, h = 0.5) => roofCover(ft(a), roof, ft(b) - ft(a), h, "#a3a9b1", 3);
  if (part === "cab") return fair(4.85, 7.82, 0.55) + fair(8.02, 10.79, 0.55) + fair(11.09, 14.25, 0.45) + fair(14.55, 15.74, 0.3) + fair(16.13, 17.42, 0.3) +
    rect(ft(17.92), roof - 0.05, ft(0.9), 1.0, "#a3a9b1", 0.4, 'rx="0.12"') + hvac(ft(18.9) - 0.2, roof, 2.6, 0.5);
  if (part === "a") return fair(1.0, 4.6, 0.4) + fair(5.6, 8.8, 0.55) + fair(9.0, 10.1, 0.35) + rect(ft(10.4), roof - 0.05, 1.4, 0.9, "#a3a9b1", 0.4, 'rx="0.12"') +
    pantograph(ft(15.0), roof + 0.25, { facing: -1 }) + rect(ft(15.0) - 3.0, roof - 0.05, 6.0, 0.35, "#8f969e", 0.4) + panGear(ft(15.0), roof + 0.2, -1);
  return pantograph(ft(1.95), roof + 0.25, { up: false, facing: 1 }) + rect(ft(1.95) - 3.0, roof - 0.05, 6.0, 0.35, "#8f969e", 0.4) +
    fair(3.4, 4.1, 0.3) + fair(4.3, 5.0, 0.3) + fair(5.6, 6.6, 0.45) + fair(7.0, 9.6, 0.55) + fair(10.5, 15.2, 0.4);
}
const x61Cab = (c) => x61(c, "cab");
const x61A = (c) => x61(c, "a");
const x61B = (c) => x61(c, "b");

export const TYPES = {
  sesX61Cab: { name: "X61 (Alstom Coradia Nordic) end section", kind: "emu" },
  sesX61A: { name: "X61 (Alstom Coradia Nordic) section", kind: "emu" },
  sesX61B: { name: "X61 (Alstom Coradia Nordic) section", kind: "emu" },
};

const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  sesX61Cab: M(x61Cab, X61_CAB, true),
  sesX61A: M(x61A, X61_MID),
  sesX61B: M(x61B, X61_MID),
};

export const FLEETS = {
  pagatag: [[1, 99, "sesX61Cab"]],
  vasttag: [[61401, 61422, "sesX61Cab"]],
};

const set = (label, ...units) => ({ label, units });
const X61_SET = set("Four-section X61 (Coradia Nordic), often two together", ["sesX61Cab", 1], ["sesX61A", 1], ["sesX61B", 1], ["sesX61Cab", 1]);
export const TYPICAL = {
  pagatag: () => X61_SET,
  vasttag: () => X61_SET,
};

export const FACTS = {};
