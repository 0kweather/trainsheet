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
import { C, rect, path, line, lines, poly, slats, truck, pantograph, win, flutes } from "../carart.js?v=dev";
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
      letters(c, 13.0, 10.5, 0.48, "Mona Seilitz", "#ffffff", { weight: 500, italic: true, anchor: "start" });
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

// A unit's end car seen from its other side: the drawing mirrored, so a
// second unit coupled behind the first shows its cab at the back.
const toRight = (draw) => (c) => `<g transform="matrix(-1 0 0 1 ${r2(c.L)} 0)">${draw({ ...c, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: c.coupledL })}</g>`;

// ===================== Bombardier Contessa (X31K, Öresundståg) =====================

// --- X31K/X32K/ET "Øresundståg" (Adtranz/Bombardier Contessa, 111 three-
// car units 1999-2012: X31K and the Danish ET 4301-4342 and 4350-4411,
// X32K 4343-4349; A cars 43xx/44xx, middle cars 47xx/48xx, B cars
// 45xx/46xx; all Swedish-owned since 2023): 78.9 m, Bo'Bo'+2'2'+Bo'Bo',
// the end cars powered, the middle car a trailer carrying the transformer
// and both pantographs (one for Sweden's 15 kV, one for Denmark's 25 kV)
// over a low-floor section between its doors; 2.97 m wide, motor bogies
// of 2.6 m wheelbase (järnväg.net, loco-info.com). The split between the
// cars (end cars about 27.0 m, middle 24.9 m), the height (about 3.9 m)
// and the window and door positions are estimated from photographs: the
// cab end a blunt, rounded block behind a thick black rubber collar (two
// units couple nose to nose, the collars meeting and the driving desk
// swinging aside for a gangway), a narrow door-height window just behind
// it, three big first-class (or quiet-zone) windows, a double plug door,
// then a long row of windows; the middle car a double door either side of
// the low-floor section. The paint since the 2018-23 refurbishment:
// unpainted stainless, a dark gray skirt, the windows in a dark band; the
// end cars' doors dark gray with an orange-red line, the middle car's
// doors orange-red with the low-floor section between them dark gray;
// ØRESUNDSTÅG in red capitals behind the first door.
const X31 = { roof: 12.7, sill: 3.4, cornerR: 1.0, end: 0.5, trucks: { centers: ft(19.0), wb: ft(2.6), d: 36 }, diaphragm: [3.6, 11.6], badge: false };
const X31_END = ft(27.0), X31_MID = ft(24.9);
const X31K = { steel: "#c9ccd0", band: "#2f3439", skirt: "#3d4146", door: "#4a4f55", red: "#e2382b", orange: "#ec4a2c", collar: "#1b1d20", roof: "#b4b9bf" };
const X31_WIN = { y: 5.85, h: 3.25, r: 0.35 };
const x31Door = (m, fill) => ({ x: ft(m) - 2.3, w: 4.6, y0: 3.55, y1: 10.6, leaves: 2, glassY: 0.48, glassH: 0.4, grabs: false, fill });
const x31Band = (a, b) => rect(a, X31_WIN.y - 0.2, b - a, X31_WIN.h + 0.4, X31K.band, 0, 'rx="0.3"');
function x31End(c) {
  const L = c.L, firsts = [2.7, 4.45, 6.2].map(ft), rest = seq(9.9, 1.75, 9).map(ft), d = x31Door(8.55);
  return bilevel({ ...c, cabL: true, cabR: false, coupledL: false }, { ...X31, base: X31K.steel,
    nose: [[2.4, 3.4], [1.0, 4.0], [0.6, 5.0], [0.6, 10.8], ["q", 0.7, 12.7, 2.6, 12.7]], cabLen: 7,
    rows: [{ xs: firsts, y: X31_WIN.y, w: ft(1.5), h: X31_WIN.h, r: 0.35 }, { xs: rest, y: X31_WIN.y, w: ft(1.35), h: X31_WIN.h, r: 0.3 }],
    doors: [d],
    paint: () => rect(0, 11.9, L, 2, X31K.roof) + line(0, 11.9, L, 11.9, "rgba(0,0,0,0.15)", 0.5) + rect(0, 0, L, 4.1, X31K.skirt) + rect(0, 4.1, L, 0.12, "rgba(0,0,0,0.3)") +
      x31Band(firsts[0] - 0.4, firsts[2] + ft(1.5) + 0.4) + x31Band(rest[0] - 0.4, rest[8] + ft(1.35) + 0.4) +
      rect(d.x - 0.1, 3.45, d.w + 0.2, 7.25, X31K.door) + rect(d.x + d.w / 2 - 0.12, 3.6, 0.24, 6.9, X31K.red) +
      // The narrow window behind the cab, in a dark panel.
      rect(4.2, 4.2, 1.9, 6.8, "#3a3e44", 0, 'rx="0.35"') + letters(c, ft(5.1), 4.85, 1.35, "ØRESUNDSTÅG", X31K.red, { weight: 800, spacing: 0.02 }),
    extra: (c, g) => boxes(ft(5.5), L / 2 - 5, X31.sill, 2, 1.2) + boxes(L / 2 + 5, L - ft(5.5), X31.sill, 2, 1.0) + rect(L / 2 - 4.5, 1.4, 9.0, 1.3, "#2f3338", 0.4, 'rx="0.5"') +
      hvac(ft(9.5), g.roof, 11, 0.6, "#a7aeb6") + roofCover(ft(20.5), g.roof, 9, 0.35, "#a3a9b1") + rect(ft(1.6), g.roof - 0.05, 3.2, 0.25, "#9aa1a9", 0.3),
    cab: () => {
      // The black rubber collar round the front, the side window behind it.
      let s = path(poly([[0.3, 4.3], [0.3, 10.9], ["q", 0.4, 12.95, 2.6, 12.95], [3.9, 12.95], ["q", 3.35, 12.4, 3.35, 11.2], [3.35, 4.4], ["q", 3.0, 3.65, 2.0, 3.65], [1.0, 3.75]]), X31K.collar, 0.5);
      s += lines([[1.0, 4.6, 1.0, 11.0], [2.6, 4.3, 2.6, 11.9]], "#34383d", 0.6);
      s += path(poly([[0.7, 3.8], [6.0, 3.8], [6.0, 1.3], [1.8, 1.15], [0.6, 2.1]]), "#26292d") + emuFront(1.3, 3.4, { coupler: 2.9 });
      s += lamp(0.62, 6.0, 0.3, 0.4) + lamp(0.62, 5.35, 0.3, 0.3, RED_LAMP);
      return s + rect(4.5, 7.2, 1.3, 3.4, C.glass, 0, `rx="0.3" stroke="${C.gasket}" stroke-width="0.5"`) + rect(4.62, 9.3, 1.06, 1.1, C.glassLight, 0, 'rx="0.2"');
    },
  });
}
function x31Mid(c) {
  const L = c.L, d1 = x31Door(6.75, X31K.orange), d2 = x31Door(18.15, X31K.orange);
  const a = seq(0.95, 1.75, 3).map(ft), low = seq(8.0, 1.95, 5).map(ft), b = [19.6, 21.35, 23.1].map(ft), ww = ft(1.35);
  return bilevel({ ...c, cabL: false, cabR: false }, { ...X31, base: X31K.steel, drop: { a: d1.x - 0.4, b: d2.x + d2.w + 0.4, y: 2.0 },
    rows: [{ xs: [...a, ...low, ...b], y: X31_WIN.y, w: ww, h: X31_WIN.h, r: 0.3 }],
    doors: [d1, d2],
    paint: () => rect(0, 11.9, L, 2, X31K.roof) + line(0, 11.9, L, 11.9, "rgba(0,0,0,0.15)", 0.5) + rect(0, 0, L, 4.1, X31K.skirt) + rect(0, 4.1, L, 0.12, "rgba(0,0,0,0.3)") +
      x31Band(a[0] - 0.4, a[2] + ww + 0.4) + x31Band(b[0] - 0.4, b[2] + ww + 0.4) +
      // The low-floor section, dark gray from door to door; the doors orange.
      rect(d1.x, 0, d2.x + d2.w - d1.x, 11.75, "#3b3f45") + [d1, d2].map((d) => rect(d.x - 0.1, 2.0, d.w + 0.2, 8.7, X31K.orange)).join(""),
    extra: (c, g) => boxes(d1.x + 6, d2.x - 2, 2.05, 3, 0.45) + rect(L / 2 - 6, 0.95, 12, 1.1, "#2a2d31", 0.4, 'rx="0.3"') +
      // The two pantographs over the ends, the roof line between them.
      pantograph(ft(2.6), g.roof + 0.3, { facing: 1 }) + rect(ft(2.6) - 3.0, g.roof - 0.05, 6.0, 0.35, "#8f969e", 0.4) + panGear(ft(2.6), g.roof + 0.2, 1) +
      pantograph(L - ft(2.6), g.roof + 0.3, { up: false, facing: -1 }) + rect(L - ft(2.6) - 3.0, g.roof - 0.05, 6.0, 0.35, "#8f969e", 0.4) + panGear(L - ft(2.6), g.roof + 0.2, -1) +
      line(ft(2.6) + 6.2, g.roof + 0.95, L - ft(2.6) - 6.2, g.roof + 0.95, "#5a6068", 0.8) + hvac(L / 2 - 6, g.roof, 12, 0.6, "#a7aeb6"),
  });
}

// ===================== Bombardier Regina (X50-X53, Västtåg) =====================

// --- Regina (Adtranz/Bombardier, 89 built 2000-13 as X50-X54; Västtrafik
// runs 28: 3262-3267, 3289-3296, 9035-9036, 9038, 9040-9041, 9074-9076 and
// 9084-9089, two-car and three-car): two cars 53.9 m (Bo'Bo'+Bo'2'), three
// 80.5 m (Bo'Bo'+2'2'+Bo'Bo', the unpowered UB middle car), bogie centres
// 19.0 m, motor bogies of 2.7 m wheelbase, a 3.45 m wide stainless body
// (the widest in Sweden, five seats abreast), a 1150 mm floor with a low
// entrance and lift at one end (järnväg.net; Swedish Wikipedia). The
// height (about 4.15 m) and the doors and windows are from photographs:
// a long raked nose with the windshield in a black surround, a tall cab
// side window, a door about a third of the way along each end car and
// another near its inner end, the windows in a continuous dark band.
// Västtåg's paint: the stainless left bare, the nose white, Västtrafik's
// yellow over the roof and sweeping down behind the windshield, white
// doors with an orange inner edge, "västtågen" in dark gray along the side.
const RG = { roof: 13.6, sill: 3.6, cornerR: 1.1, end: 0.5, trucks: { centers: ft(19.0), wb: ft(2.7), d: 36 }, diaphragm: [3.8, 12.4], badge: false };
const RG_END = ft(26.95), RG_MID = ft(26.6);
const RGK = { steel: "#c6cacf", white: "#f1f2f2", yellow: "#f5c518", band: "#25292e", skirt: "#3d4247", orange: "#f07a1e", roof: "#f5c518" };
const RG_WIN = { y: 6.05, h: 3.4 };
const rgDoor = (x) => ({ x: x - 2.1, w: 4.2, y0: 3.75, y1: 11.1, leaves: 2, glassY: 0.45, glassH: 0.4, grabs: false, fill: "rgba(255,255,255,0.0)" });
// A window band from a to b: panes of about 2 m between thin pillars.
function rgPanes(a, b) {
  const n = Math.max(1, Math.round((b - a) / ft(2.0))), w = (b - a) / n, xs = [];
  for (let i = 0; i < n; i++) xs.push(a + i * w + 0.15);
  return { xs, w: w - 0.3 };
}
function rgBody(c, { cab, L }) {
  const d1 = cab ? rgDoor(ft(9.6)) : rgDoor(ft(2.2)), d2 = rgDoor(L - ft(2.2));
  const a0 = cab ? ft(4.6) : d1.x + d1.w + 0.6, bands = cab ? [[a0, d1.x - 0.6], [d1.x + d1.w + 0.6, d2.x - 0.6]] : [[a0, d2.x - 0.6]];
  const panes = bands.map(([a, b]) => rgPanes(a, b));
  return bilevel({ ...c, cabL: cab, cabR: false, coupledL: cab ? false : c.coupledL }, { ...RG, base: RGK.steel,
    nose: cab ? [[2.6, 3.6], [1.2, 3.95], [0.9, 5.0], ["q", 0.85, 6.4, 1.6, 7.0], [5.6, 11.9], ["q", 7.3, 13.6, 10.4, 13.6]] : null, cabLen: cab ? 10 : 0,
    rows: panes.map((p) => ({ xs: p.xs, y: RG_WIN.y, w: p.w, h: RG_WIN.h, r: 0.25 })),
    doors: [d1, d2],
    paint: () => {
      let s = rect(0, 12.6, L, 2, RGK.roof) + line(0, 12.6, L, 12.6, "rgba(0,0,0,0.15)", 0.5) + rect(0, 0, L, 4.3, RGK.skirt) + rect(0, 4.3, L, 0.12, "rgba(0,0,0,0.3)");
      for (const [a, b] of bands) s += rect(a - 0.25, RG_WIN.y - 0.3, b - a + 0.5, RG_WIN.h + 0.6, RGK.band, 0, 'rx="0.35"');
      for (const d of [d1, d2]) s += rect(d.x - 0.1, 3.7, d.w + 0.2, 7.5, RGK.white) + rect(d.x + d.w / 2 - 0.2, 3.75, 0.4, 7.3, RGK.orange);
      if (cab) {
        // The white nose cap back to the cab door's line, the yellow sweep
        // behind the windshield's black surround.
        s += path(poly([[0, 0], [13.2, 0], [13.2, 12.6], [0, 12.6]]), RGK.white) + rect(0, 0, 13.2, 4.3, RGK.skirt) +
          path(poly([[4.0, 6.2], [9.6, 12.6], ["q", 10.1, 13.5, 10.6, 14.0], [14.2, 14.0], ["q", 12.2, 13.0, 11.4, 11.9], [6.6, 5.2], [3.6, 5.2]]), RGK.yellow) +
          path(poly([[1.2, 7.2], [5.7, 12.25], ["q", 7.0, 13.45, 9.3, 13.5], [9.8, 12.75], [4.1, 6.3], [1.9, 6.25]]), "#17191c");
        s += letters(c, ft(13.0), 4.95, 1.5, "västtågen", "#555a61", { weight: 700, italic: true, spacing: -0.03 }) + letters(c, 3.0, 5.4, 0.6, "3264", "#26292e", { weight: 600, italic: true });
      }
      return s;
    },
    extra: (c, g) => {
      let s = boxes(ft(6.0), L / 2 - 4, RG.sill, 2, 1.25) + boxes(L / 2 + 4, L - ft(6.0), RG.sill, 2, 1.0) + rect(L / 2 - 4, 1.5, 8, 1.2, "#2f3338", 0.4, 'rx="0.5"');
      s += hvac(cab ? ft(12.0) : ft(4.5), g.roof, 12, 0.65, "#d9c25a") + hvac(L - ft(8.0), g.roof, 9, 0.55, "#d9c25a");
      if (c.pan) s += pantograph(L - ft(5.0), g.roof + 0.3, { facing: -1 }) + rect(L - ft(5.0) - 3.0, g.roof - 0.05, 6.0, 0.35, "#8f969e", 0.4) + panGear(L - ft(5.0), g.roof + 0.2, -1);
      return s;
    },
    cab: () => path(poly([[1.55, 7.45], [5.8, 12.05], ["q", 7.0, 13.15, 8.9, 13.2], [9.25, 12.75], [4.0, 6.65], [2.1, 6.55]]), C.glass) +
      path(poly([[2.0, 7.5], [3.6, 9.3], [4.3, 9.2], [2.7, 7.4]]), C.glassLight) + wiper(2.4, 7.4, 4.0, 9.9) +
      path(poly([[1.0, 4.1], [3.9, 4.1], [4.6, 5.6], [1.3, 5.9]]), "#1f2226") + lamp(1.5, 4.55, 0.55, 0.45) + lamp(2.4, 4.6, 0.4, 0.35, RED_LAMP) +
      rect(ft(3.15), 6.6, 1.9, 3.8, C.glass, 0, `rx="0.45" stroke="${C.gasket}" stroke-width="0.5"`) + rect(ft(3.15) + 0.12, 8.9, 1.66, 1.3, C.glassLight, 0, 'rx="0.3"') +
      emuFront(1.5, 3.6, { coupler: 2.9 }) + rect(0, 2.2, 1.7, 1.3, "#1d1f22", 0.3, 'rx="0.15"') + lamp(6.0, 13.4, 1.0, 0.25),
  });
}
const rgCab = (c) => rgBody({ ...c, pan: true }, { cab: true, L: c.L });
const rgCabB = (c) => rgBody({ ...c, pan: false }, { cab: true, L: c.L });
const rgMid = (c) => rgBody({ ...c, pan: false }, { cab: false, L: c.L });

// ===================== ASEA X10 family (X11, X12, X14) =====================

// --- X11, X12 and X14 (ASEA/ABB, 1982-95): two-car units of a motor car
// and a driving trailer, 49.868 m (each car 24.93 m), Bo'Bo'+2'2', 1280 kW,
// a high floor; stainless bodies, corrugated below the windows (järnväg.net).
// The X11s are X10s rebuilt in 1994-98 with a toilet and their middle door
// pair blocked, so a door behind the cab and one at the inner end of each
// car; the X12s (1991-94) were built with one door a side per car, and the
// X14s (1994-95) with two. A flat front leaning back above the windshields,
// a destination box with two lamps over them, a headlight low at each
// corner, a Scharfenberg coupler between two round rubber bumpers, the
// crew door just behind the cab; on the roof the air intakes' boxy hoods,
// the motor car's pantograph toward its inner end over the resistor hood.
// The height (about 3.85 m), bogie spacing and door and window positions
// are estimated from photographs. Paint:
//   Västtåg (X11 3139-3147, 3171-3172, 3182-3183, 3204-3213; X12 3195-3197,
//     3214-3223; X14 3190, 3223-3229, 3235, 3238, 3240-3241): the cab's
//     upper half and the roof Västtrafik yellow, gray elsewhere, two
//     yellow lines under the windows, the X11s' and X12s' doors orange,
//     the X14s' gray edged in yellow, "västtågen" big on the side.
//   Krösatåg (X11 since the 2013-15 refurbishment, X14 3230, 3232-3233,
//     3236-3237, 3239): white with a gray window band, the roof and the
//     cab's upper half yellow, a red line along the sill and a red buffer
//     beam, yellow doors, KRÖSATÅGEN in spaced red capitals.
const X10 = { roof: 12.6, sill: 3.3, cornerR: 1.0, end: 0.5, trucks: { centers: ft(17.5), wb: ft(2.6), d: 36 }, diaphragm: [3.6, 11.4], badge: false };
const X10_L = ft(24.934);
const X10_PAINT = {
  vasttag: { upper: "#959ca4", lower: "#c4c8cc", band: "#959ca4", top: "#f2c300", line: "#f2c300", skirt: "#4a4f55", front: "#959ca4", beam: "#5a6068",
    door: { X11: "#e8742a", X12: "#e8742a", X14: "#9aa1a9" }, edge: "#f2c300", mark: (c, x) => letters(c, x, 4.5, 1.8, "västtågen", "#3f444b", { weight: 700, spacing: -0.05 }) },
  krosatag: { upper: "#f2f2ef", lower: "#e4e6e7", band: "#8e959c", top: "#f5c400", line: "#d9262e", skirt: "#d9262e", front: "#f2f2ef", beam: "#d9262e",
    door: { X11: "#f5c400", X12: "#f5c400", X14: "#f5c400" }, edge: "#f5c400", mark: (c, x) => letters(c, x, 4.7, 0.95, "KRÖSATÅGEN", "#d9262e", { weight: 700, spacing: 0.35 }) },
};
// Doors (m, centers from the cab end) and window starts by class.
const X10_DOORS = { X11: [5.0, 23.3], X12: [12.6], X14: [5.0, 23.3] };
function x10Wins(cls) {
  const doors = X10_DOORS[cls].map(ft), xs = [ft(2.95)];
  for (let x = ft(6.15); x < X10_L - ft(1.0); x += ft(1.55)) if (!doors.some((d) => x + ft(1.0) > d - ft(0.75) && x < d + ft(0.75))) xs.push(x);
  return xs;
}
const x10 = (cls) => married((c) => {
  const L = c.L, k = X10_PAINT[c.agency] || X10_PAINT.vasttag, motor = !c.mate, doors = X10_DOORS[cls].map((m) => ({ x: ft(m) - 2.15, w: 4.3, y0: 3.5, y1: 10.4, leaves: 2, glassY: 0.5, glassH: 0.38, grabs: false }));
  const wins = x10Wins(cls), kros = c.agency === "krosatag";
  return bilevel({ ...c, cabR: false }, { ...X10, base: k.upper,
    nose: [[1.4, 3.3], [0.9, 4.0], [0.75, 7.9], [1.2, 11.0], ["q", 1.45, 12.6, 3.6, 12.6]], cabLen: 5,
    rows: [{ xs: wins, y: 6.3, w: ft(1.0), h: 3.2, r: 0.35 }],
    doors,
    paint: () => {
      let s = rect(0, 11.6, L, 3, k.top) + line(0, 11.6, L, 11.6, "rgba(0,0,0,0.15)", 0.5) + rect(0, 3.3, L, 2.6, k.lower) + flutes(0, L, 3.5, 5.7, 0.28) +
        rect(0, 0, L, 3.5, k.skirt);
      if (kros) s += rect(0, 6.0, L, 3.9, k.band);
      else s += rect(0, 5.95, L, 0.28, k.line) + rect(0, 5.55, L, 0.22, k.line);
      for (const d of doors) s += rect(d.x - 0.1, 3.4, d.w + 0.2, 7.1, k.door[cls]) + (cls === "X14" && !kros ? rect(d.x - 0.1, 3.4, 0.3, 7.1, k.edge) + rect(d.x + d.w - 0.2, 3.4, 0.3, 7.1, k.edge) : "");
      // The cab: the front's upper half yellow back to the crew door.
      s += path(poly([[0, 7.6], [ft(1.45), 7.6], [ft(1.45), 13], [0, 13]]), k.top) + rect(0, 3.3, ft(1.45), 4.3, k.front) + (kros ? rect(0, 3.3, ft(1.45), 0.55, k.line) : rect(0, 5.55, ft(1.45), 0.5, k.line));
      s += wins.slice(1).map((x) => rect(x - 0.15, 6.15, ft(1.0) + 0.3, 3.5, "rgba(20,22,25,0.35)", 0, 'rx="0.4"')).join("");
      return s + k.mark(c, L * 0.42) + letters(c, 2.6, 6.9, 0.55, kros ? (cls === "X14" ? "3232" : "3137") : (cls === "X14" ? "3224" : cls === "X12" ? "3215" : "3209"), kros ? "#26292e" : "#1f3f8a", { weight: 600, italic: !kros });
    },
    extra: (c, g) => {
      let s = boxes(ft(5.5), L / 2 - 4, X10.sill, 2, 1.3) + boxes(L / 2 + 4, L - ft(5.5), X10.sill, 2, 1.1) + rect(L / 2 - 3.5, 1.5, 7, 1.1, "#2f3338", 0.4, 'rx="0.5"');
      // The air intakes' hoods along the roof, yellow like it.
      for (const m of [1.6, 6.4, 11.2, 18.0, 22.6]) s += path(poly([[ft(m), g.roof - 0.05], [ft(m) + 0.4, g.roof + 0.95], [ft(m) + 4.4, g.roof + 0.95], [ft(m) + 4.8, g.roof - 0.05]]), k.top, 0.4) +
        slats(ft(m) + 0.7, g.roof + 0.15, 3.4, 0.6, 0.35, "rgba(0,0,0,0.35)");
      if (motor) s += roofCover(ft(13.2), g.roof, 13, 0.6, "#8d949c", 4) + pantograph(ft(17.4), g.roof + 0.65, { facing: -1 }) + panGear(ft(17.4), g.roof + 0.6, -1);
      return s;
    },
    cab: () => {
      let s = path(poly([[0.85, 8.4], [1.2, 10.9], [1.6, 10.9], [1.3, 8.4]]), C.glass) + rect(ft(0.5), 11.4, 1.4, 1.0, "#1d1f22", 0.3, 'rx="0.15"');
      s += lamp(0.8, 5.2, 0.4, 0.55) + lamp(1.0, 11.6, 0.35, 0.35) + horns(3.2, 12.55);
      // Crew door, the bumpers and coupler, the plow.
      s += rect(ft(1.6), 4.2, 2.3, 7.0, "rgba(0,0,0,0.05)", 0.5, 'rx="0.15"') + win(ft(1.6) + 0.45, 7.6, 1.4, 2.2, 0.25);
      s += rect(0.1, 3.85, 1.2, 0.9, "#26292d", 0, 'rx="0.4"') + emuFront(1.4, 3.3, { coupler: 3.0 }) + path(poly([[0.5, 2.0], [5.0, 2.0], [5.0, 0.9], [1.2, 0.8]]), k.beam);
      return s;
    },
  });
});

// ===================== Bombardier Itino (Y31, Y32) =====================

// --- Itino, Y31 and Y32 (Adtranz/Bombardier, 30 for Sweden 2002-10: Y31
// 1400-1405 and 1412-1429, two cars; Y32 1406-1411, three): Y31 38.4 m
// (B'2'B'), Y32 54.75 m (B'2'2'B'), the cars sharing Jakobs bogies, a
// diesel engine with its transmission under each end car driving the bogie
// under the cab; 140 km/h, two MAN V12s (Iveco V8s from 2008) of 480-560 kW
// (järnväg.net). A low-floor section by each car's door, the seats over
// the bogies a step up; the cooling and the air conditioning on the roof.
// End cars about 19.2 m and the Y32's middle car 16.35 m; the height (about
// 3.85 m), doors and windows are estimated from photographs: a raked nose
// with the windshield in a dark surround, the crew door behind it, three
// big windows over the motor bogie, the door, two in the low-floor
// section. Paint:
//   Krösatåg: white, the roof and the crown over the windshield yellow,
//     the windows in a gray band, yellow doors, a red line along the side,
//     KRÖSATÅGEN in small red capitals; each unit named in red script.
//   Västtåg (1400, 1402-1403, 1412-1413, 1417-1419), repainted from 2021:
//     silvery gray, Västtrafik's light blue over the crown and roof edge and
//     in a line low along the side, a dark gray window band, the doors
//     framed in orange, "västtågen" in dark gray.
const IT = { roof: 12.6, sill: 3.0, cornerR: 1.0, end: 0.5, noTrucks: true, diaphragm: [2.2, 11.4], badge: false };
const IT_END = ft(19.2), IT_MID = ft(16.35);
const IT_PAINT = {
  krosatag: { body: "#f2f2ef", crown: "#f5c400", band: "#7d848c", line: "#d9262e", door: "#f5c400", frame: "#f5c400", skirt: "#5a6068",
    mark: (c, x) => letters(c, x, 10.3, 0.5, "KRÖSATÅGEN", "#d9262e", { weight: 700, spacing: 0.2 }), name: (c) => letters(c, ft(4.9), 10.3, 0.75, "Emil i Lönneberga", "#d9262e", { weight: 400, italic: true }) },
  vasttag: { body: "#b9c1c9", crown: "#4fb3ea", band: "#4a5058", line: "#4fb3ea", door: "#c6ccd2", frame: "#f07a1e", skirt: "#4a5058",
    mark: (c, x) => letters(c, x, 4.4, 1.4, "västtågen", "#3a3f45", { weight: 700, spacing: -0.04 }), name: () => "" },
};
function itino(c, part) {
  const L = c.L, k = IT_PAINT[c.agency] || IT_PAINT.krosatag, cab = part === "cab";
  const door = cab ? ft(11.6) : L / 2, d = { x: door - 2.15, w: 4.3, y0: 1.7, y1: 9.6, leaves: 2, glassY: 0.42, glassH: 0.42, grabs: false };
  const high = cab ? [ft(3.6), ft(5.75), ft(7.9)] : [ft(0.8), ft(13.4)];
  const low = cab ? [d.x + d.w + 1.0, d.x + d.w + 1.0 + ft(2.25)] : [d.x - ft(2.2) - 0.8, d.x + d.w + 0.8];
  const xs = [...high, ...low], ww = cab ? ft(2.0) : ft(1.75);
  return bilevel({ ...c, cabL: cab, cabR: false, coupledL: cab ? false : c.coupledL }, { ...IT, base: k.body,
    drop: { a: cab ? d.x - 1.5 : ft(2.4), b: L - ft(2.4), y: 1.55 },
    nose: cab ? [[2.8, 3.0], [1.0, 3.25], [0.8, 4.6], ["q", 0.8, 5.7, 1.5, 6.1], [4.8, 11.2], ["q", 5.8, 12.6, 7.8, 12.6]] : null, cabLen: cab ? 7 : 0,
    rows: [{ xs, y: 5.5, w: ww, h: 3.4, r: 0.35 }],
    doors: [d],
    paint: () => {
      let s = rect(0, 11.8, L, 2, k.crown) + line(0, 11.8, L, 11.8, "rgba(0,0,0,0.15)", 0.5) + rect(0, 0, L, 2.3, k.skirt) + rect(0, 3.0, L, 0.35, k.line);
      s += rect(Math.min(...xs) - 0.4, 5.15, Math.max(...xs) + ww - Math.min(...xs) + 0.8, 4.1, k.band, 0, 'rx="0.4"');
      s += rect(d.x - 0.35, 1.6, d.w + 0.7, 8.3, k.frame) + rect(d.x - 0.08, 1.65, d.w + 0.16, 8.05, k.door);
      if (cab) {
        s += path(poly([[0, 5.2], [4.6, 5.2], [9.4, 11.3], ["q", 10.4, 12.4, 12.0, 12.6], [15.0, 13.5], [0, 13.5]]), k.crown) + path(poly([[1.3, 6.2], [4.9, 11.35], ["q", 5.8, 12.3, 7.4, 12.3], [7.8, 11.6], [3.8, 5.9], [1.8, 5.75]]), "#202327");
        s += k.mark(c, cab ? d.x + d.w + 6 : L / 2) + k.name(c) + letters(c, 2.2, 4.1, 0.6, c.agency === "vasttag" ? "1402" : "1405", "#26292e", { weight: 700 });
      }
      return s;
    },
    extra: (c, g) => {
      const jakobs = (x) => truck(x, { wb: ft(2.7), d: 30, top: 3.0 });
      let s = cab ? truck(ft(3.9), { wb: ft(2.4), d: 33, top: 3.0 }) + jakobs(L) : jakobs(0) + jakobs(L);
      if (cab) {
        // The power pack (engine, transmission) and fuel tank under the floor,
        // the radiators and exhaust on the roof over it, the air conditioning.
        s += rect(ft(5.4), 1.0, ft(4.3), 2.0, "#2f3338", 0.4, 'rx="0.2"') + slats(ft(5.6), 1.2, ft(1.6), 1.6, 0.35, "rgba(255,255,255,0.18)") + rect(ft(9.8), 1.2, 3.0, 1.6, "#3a3e44", 0.4, 'rx="0.4"');
        s += roofCover(ft(2.6), g.roof, ft(6.0), 0.85, "#a3a9b1", 4) + slats(ft(2.9), g.roof + 0.12, ft(5.2), 0.6, 0.4, "rgba(0,0,0,0.35)") + rect(ft(8.9), g.roof + 0.8, 0.45, 0.6, "currentColor") +
          hvac(ft(12.4), g.roof, ft(3.2), 0.6);
      } else s += hvac(L / 2 - 5, g.roof, 10, 0.6);
      return s;
    },
    cab: () => path(poly([[1.65, 6.5], [5.0, 11.15], ["q", 5.8, 12.05, 7.1, 12.05], [7.35, 11.5], [3.7, 6.25], [2.1, 6.1]]), C.glass) +
      path(poly([[2.1, 6.6], [3.3, 8.3], [3.9, 8.2], [2.7, 6.5]]), C.glassLight) + wiper(2.4, 6.5, 3.8, 8.9) +
      lamp(1.0, 4.0, 0.5, 0.45) + lamp(1.05, 4.75, 0.35, 0.3, RED_LAMP) + emuFront(1.0, 3.0, { coupler: 2.6 }) +
      rect(ft(2.45), 3.3, 2.4, 7.4, "rgba(0,0,0,0.05)", 0.5, 'rx="0.2"') + win(ft(2.45) + 0.4, 6.6, 1.6, 2.6, 0.3) + rect(0, 2.0, 1.2, 1.2, "#26292d", 0.3, 'rx="0.2"'),
  });
}
const itinoCab = (c) => itino(c, "cab");
const itinoMid = (c) => itino(c, "mid");

// ===================== Alstom Zefiro Express (X80, Västtåg) =====================

// --- X80 (Bombardier/Alstom Zefiro Express, now Avelia Stream Nordic; 45
// ordered 2016-18, 35 more in 2025, 80001-80080; bodies built in China,
// finished in Germany; in passenger service since 11 May 2026, first
// Göteborg-Älvängen and Göteborg-Vänersborg): 80.7 m in three cars,
// 2'Bo'+2'2'+Bo'2' (a trailer bogie under each cab, the motor bogies at
// the end cars' inner ends), 2800 kW, 200 km/h, 270 seats five abreast,
// a low-floor section with the toilets and wheelchair and bicycle space
// in the middle car (järnväg.net; Swedish Wikipedia). Car lengths (end
// cars about 27.5 m, middle 25.7 m), the height (about 4.3 m) and the
// layout are estimated from photographs: a long pointed nose, the
// windshield in a dark navy mask edged in light blue, a rounded cab side
// window, one single-leaf door a side about halfway along each end car,
// two on the middle car either side of its low floor. Västtrafik's new
// blue and white: white, two light-blue bars down the side behind the cab,
// the window band navy, the lower side light blue from the door back, the
// middle car's doors orange; "västtågen" in white.
const X80 = { roof: 14.1, sill: 3.6, cornerR: 1.2, end: 0.5, noTrucks: true, diaphragm: [3.8, 12.6], badge: false };
const X80_END = ft(27.5), X80_MID = ft(25.7);
const X80K = { white: "#f4f5f6", blue: "#2b8fd9", navy: "#1d2b4b", skirt: "#30353c", orange: "#ef6a2a", roof: "#c9ced4" };
function x80(c, part) {
  const L = c.L, cab = part === "cab";
  const doors = cab ? [{ x: ft(12.6) - 1.7, w: 3.4, y0: 3.75, y1: 11.6, glassY: 0.4, glassH: 0.42, grabs: false }]
    : [ft(6.2), L - ft(6.2)].map((x) => ({ x: x - 2.15, w: 4.3, y0: 2.4, y1: 11.0, leaves: 2, glassY: 0.42, glassH: 0.42, grabs: false }));
  const pane = (a, b) => rgPanes(a, b);
  const bands = cab ? [[ft(7.9), doors[0].x - 0.8], [doors[0].x + doors[0].w + 0.8, L - ft(1.4)]] : [[ft(1.2), doors[0].x - 0.8], [doors[0].x + doors[0].w + 0.8, doors[1].x - 0.8], [doors[1].x + doors[1].w + 0.8, L - ft(1.2)]];
  const panes = bands.map(([a, b]) => pane(a, b));
  return bilevel({ ...c, cabL: cab, cabR: false, coupledL: cab ? false : c.coupledL }, { ...X80, base: X80K.white,
    drop: cab ? null : { a: doors[0].x - 0.5, b: doors[1].x + doors[1].w + 0.5, y: 2.2 },
    nose: cab ? [[3.4, 3.6], [1.0, 3.9], [0.55, 5.3], ["q", 0.55, 7.0, 1.8, 7.7], [7.2, 12.6], ["q", 8.6, 14.1, 11.8, 14.1]] : null, cabLen: cab ? 11 : 0,
    rows: panes.map((p) => ({ xs: p.xs, y: 6.8, w: p.w, h: 3.5, r: 0.3 })),
    doors,
    paint: () => {
      let s = rect(0, 13.2, L, 2, X80K.roof) + line(0, 13.2, L, 13.2, "rgba(0,0,0,0.15)", 0.5) + rect(0, 0, L, 4.3, X80K.skirt);
      if (cab) {
        const d = doors[0];
        s += rect(d.x - 0.6, 4.3, L, 2.2, X80K.blue) + rect(ft(5.6), 4.3, 1.9, 9.0, X80K.blue) + rect(ft(6.5), 4.3, 1.2, 9.0, X80K.blue);
      } else s += rect(0, 4.3, L, 2.2, X80K.blue);
      for (const [a, b] of bands) s += rect(a - 0.3, 6.5, b - a + 0.6, 4.1, X80K.navy, 0, 'rx="0.4"');
      for (const d of doors) s += rect(d.x - 0.12, d.y0 - 0.1, d.w + 0.24, d.y1 - d.y0 + 0.2, cab ? X80K.white : X80K.orange);
      if (cab) {
        // The windshield's navy mask edged in light blue; the cab window.
        s += path(poly([[1.0, 7.2], [6.9, 13.2], ["q", 8.2, 14.15, 10.4, 14.15], [11.0, 13.4], [4.9, 6.9], ["q", 3.0, 6.3, 1.0, 7.2]]), X80K.blue) +
          path(poly([[1.5, 7.55], [7.2, 13.0], ["q", 8.3, 13.8, 10.1, 13.8], [10.4, 13.3], [4.7, 7.25], ["q", 3.0, 6.75, 1.5, 7.55]]), X80K.navy) +
          path(poly([[ft(3.4), 8.0], [ft(4.4), 8.0], [ft(4.4), 11.8], ["q", ft(3.6), 12.3, ft(3.4), 11.0]]), X80K.navy) +
          letters(c, L - ft(5.0), 5.4, 1.2, "västtågen", "#ffffff", { weight: 700, spacing: -0.03 }) + letters(c, 4.6, 4.95, 0.55, "80013", "#26292e", { weight: 500, italic: true });
      }
      return s;
    },
    extra: (c, g) => {
      let s = "";
      if (cab) s += truck(ft(3.7), { wb: ft(2.6), d: 33, top: 3.6 }) + truck(L - ft(3.4), { wb: ft(2.7), d: 36, top: 3.6 }) +
        // Skirts over the equipment between the bogies.
        rect(ft(6.4), 1.6, L - ft(11.2), 2.05, "#3a3f46", 0.4, 'rx="0.2"') + lines(seq(ft(9), ft(3.3), 6).map((x) => [x, 1.7, x, 3.5]), "rgba(255,255,255,0.12)", 0.5) +
        hvac(ft(8.5), g.roof, 12, 0.7, "#b9bfc6") + roofCover(ft(15.5), g.roof, 22, 0.55, "#aab0b8", 4);
      else s += truck(ft(3.2), { wb: ft(2.6), d: 33, top: 3.6 }) + truck(L - ft(3.2), { wb: ft(2.6), d: 33, top: 3.6 }) +
        pantograph(ft(2.2), g.roof + 0.3, { facing: 1 }) + rect(ft(2.2) - 3.0, g.roof - 0.05, 6.0, 0.35, "#8f969e", 0.4) + panGear(ft(2.2), g.roof + 0.2, 1) +
        roofCover(ft(6.0), g.roof, 16, 0.6, "#aab0b8", 4) + hvac(L - ft(10.5), g.roof, 12, 0.7, "#b9bfc6") + boxes(doors[0].x + 6, doors[1].x - 2, 2.25, 3, 0.4);
      return s;
    },
    cab: () => path(poly([[2.0, 7.85], [7.35, 12.75], ["q", 8.3, 13.5, 9.9, 13.5], [10.15, 13.15], [4.6, 7.55], ["q", 3.1, 7.15, 2.0, 7.85]]), C.glass) +
      path(poly([[2.6, 8.0], [4.6, 9.9], [5.3, 9.8], [3.4, 7.9]]), C.glassLight) + wiper(3.0, 7.9, 4.8, 10.3) +
      path(poly([[1.0, 5.6], [2.6, 5.6], [3.6, 6.4], [1.2, 6.5]]), "#1f2226") + lamp(1.4, 5.75, 0.8, 0.45) + lamp(1.15, 4.6, 0.4, 0.35, RED_LAMP) +
      rect(ft(3.55), 8.3, 2.1, 3.1, C.glass, 0, `rx="0.6" stroke="${C.gasket}" stroke-width="0.5"`) +
      emuFront(1.4, 3.6, { coupler: 2.9 }) + path(poly([[1.4, 3.6], [8.5, 3.6], [8.5, 1.0], [2.4, 0.8], [1.2, 1.8]]), "#555b63") + rect(0, 2.2, 1.6, 1.3, "#1d1f22", 0.3, 'rx="0.15"'),
  });
}
const x80Cab = (c) => x80(c, "cab");
const x80Mid = (c) => x80(c, "mid");

export const TYPES = {
  sesX61Cab: { name: "X61 (Alstom Coradia Nordic) end section", kind: "emu" },
  sesX61A: { name: "X61 (Alstom Coradia Nordic) section", kind: "emu" },
  sesX61B: { name: "X61 (Alstom Coradia Nordic) section", kind: "emu" },
  sesX31Cab: { name: "X31K (Bombardier Contessa) end car", kind: "emu" },
  sesX31CabR: { name: "X31K (Bombardier Contessa) end car", kind: "emu" },
  sesX31Mid: { name: "X31K (Bombardier Contessa) middle car", kind: "emu" },
  sesRegina: { name: "Regina (X50-X53) end car", kind: "emu" },
  sesReginaB: { name: "Regina (X50-X53) end car", kind: "emu" },
  sesReginaMid: { name: "Regina (UB) middle car", kind: "emu" },
  sesX11: { name: "X11 car", kind: "emu" },
  sesX12: { name: "X12 car", kind: "emu" },
  sesX14: { name: "X14 car", kind: "emu" },
  sesItino: { name: "Y31/Y32 (Bombardier Itino) end car", kind: "emu" },
  sesItinoB: { name: "Y31/Y32 (Bombardier Itino) end car", kind: "emu" },
  sesItinoMid: { name: "Y32 (Bombardier Itino) middle car", kind: "emu" },
  sesX80: { name: "X80 (Alstom Zefiro Express) end car", kind: "emu" },
  sesX80B: { name: "X80 (Alstom Zefiro Express) end car", kind: "emu" },
  sesX80Mid: { name: "X80 (Alstom Zefiro Express) middle car", kind: "emu" },
};

const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  sesX61Cab: M(x61Cab, X61_CAB, true),
  sesX61A: M(x61A, X61_MID),
  sesX61B: M(x61B, X61_MID),
  sesX31Cab: M(x31End, X31_END),
  sesX31CabR: M(toRight(x31End), X31_END),
  sesX31Mid: M(x31Mid, X31_MID),
  sesRegina: M(rgCab, RG_END),
  sesReginaB: M(toRight(rgCabB), RG_END),
  sesReginaMid: M(rgMid, RG_MID),
  sesX11: M(x10("X11"), X10_L),
  sesX12: M(x10("X12"), X10_L),
  sesX14: M(x10("X14"), X10_L),
  sesItino: M(itinoCab, IT_END),
  sesItinoB: M(toRight(itinoCab), IT_END),
  sesItinoMid: M(itinoMid, IT_MID),
  sesX80: M(x80Cab, X80_END),
  sesX80B: M(toRight(x80Cab), X80_END),
  sesX80Mid: M(x80Mid, X80_MID),
};


// [first, last, type]: the units' numbers as their operators list them
// (järnväg.net, Swedish Wikipedia). Trafikverket's feed and the timetable
// name no vehicles (scripts/railroads/sweden.py), so these only show each
// railroad's roster; every train is drawn as what typically runs on its
// line. Pågatåg's units carry 001-099; an Öresundståg is known by its A
// car (43xx/44xx), with its B car 45xx/46xx and middle car 47xx/48xx.
const X11_VT = [[3139, 3147, "sesX11"], [3171, 3172, "sesX11"], [3182, 3183, "sesX11"], [3204, 3213, "sesX11"]];
export const FLEETS = {
  pagatag: [[1, 99, "sesX61Cab"]],
  oresundstag: [[4301, 4411, "sesX31Cab"], [4501, 4611, "sesX31CabR"], [4701, 4811, "sesX31Mid"]],
  vasttag: [[61401, 61422, "sesX61Cab"], [80001, 80080, "sesX80"], ...X11_VT, [3195, 3197, "sesX12"], [3214, 3222, "sesX12"],
    [3190, 3190, "sesX14"], [3223, 3229, "sesX14"], [3235, 3235, "sesX14"], [3238, 3238, "sesX14"], [3240, 3241, "sesX14"],
    [3262, 3267, "sesRegina"], [3289, 3296, "sesRegina"], [9035, 9036, "sesRegina"], [9038, 9038, "sesRegina"], [9040, 9041, "sesRegina"],
    [9074, 9076, "sesRegina"], [9084, 9089, "sesRegina"], [1400, 1400, "sesItino"], [1402, 1403, "sesItino"], [1412, 1413, "sesItino"], [1417, 1419, "sesItino"]],
  krosatag: [[3137, 3137, "sesX11"], [3230, 3230, "sesX14"], [3232, 3233, "sesX14"], [3236, 3237, "sesX14"], [3239, 3239, "sesX14"],
    [1401, 1401, "sesItino"], [1404, 1411, "sesItino"], [1414, 1416, "sesItino"], [1420, 1429, "sesItino"]],
};

// What runs where (October 2026). Pågatåg: X61s only, one or two units.
// Öresundståg: X31Ks, two units on most trains and three at rush hour.
// Västtåg, by the ends of the run (the operator's line pages, Swedish
// Wikipedia, järnväg.net): the Kinnekulle line (Herrljunga-Lidköping-
// Mariestad-Hallsberg/Örebro) Y31 diesels; Borås, Varberg and the
// Uddevalla-Herrljunga-Borås line X11, X12 and X14 pairs; the new X80s
// since May 2026 on Göteborg-Älvängen and Göteborg-Trollhättan-
// Vänersborg (the Säffle trains too); Bohusbanan (Uddevalla, Strömstad,
// Stenungsund) mostly X61s; the Skövde, Falköping, Jönköping and Nässjö
// trains Reginas; the Kungsbacka and Alingsås commuter trains X61s.
// Krösatåg: KLT's Kalmar-Linköping and Linköping-Västervik (the former
// Kustpilen, no wires) Y31 Itinos, as are the Nord trains to Vetlanda,
// Eksjö, Värnamo and Halmstad; the electrified lines (Jönköping-Nässjö-
// Växjö, Nässjö-Tranås, Kalmar-Växjö, Emmaboda-Karlskrona, Växjö-
// Hässleholm) X11s and X14s. Krösatåg's 28 new CAF Civity units (ER3 and
// the bimodal BIR1) were delivered from 2025, but their first passenger
// runs were put off to early 2027, so they aren't drawn.
const set = (label, ...units) => ({ label, units });
const X61_SET = set("Four-section X61 (Coradia Nordic), often two coupled", ["sesX61Cab", 1], ["sesX61A", 1], ["sesX61B", 1], ["sesX61Cab", 1]);
const X31_ONE = ["sesX31Cab", 1], X31_MIDC = ["sesX31Mid", 1], X31_TAIL = ["sesX31CabR", 1];
const X31_SET = set("Two three-car X31K (Contessa) units, usually 2 (1 to 3)", X31_ONE, X31_MIDC, X31_TAIL, X31_ONE, X31_MIDC, X31_TAIL);
const REGINA = set("Three-car Regina (X50-X53), some trains two cars", ["sesRegina", 1], ["sesReginaMid", 1], ["sesReginaB", 1]);
const X80_SET = set("Three-car X80 (Zefiro Express), some trains still Regina", ["sesX80", 1], ["sesX80Mid", 1], ["sesX80B", 1]);
const X10_VT = set("Two X11, X12 or X14 two-car units together", ["sesX11", 2], ["sesX14", 2]);
const X61_VT = set("Four-section X61 (Coradia Nordic), some trains Regina or X11-X14", ...X61_SET.units);
const X61_PENDEL = set("Four-section X61 (Coradia Nordic), often two coupled", ...X61_SET.units);
const Y31 = (agency) => set(`Two-car Y31 (Itino) diesel railcar${agency === "krosatag" ? ", some trains a three-car Y32" : ""}`, ["sesItino", 1], ["sesItinoB", 1]);
const Y32 = set("Three-car Y32 (Itino) diesel railcar", ["sesItino", 1], ["sesItinoMid", 1], ["sesItinoB", 1]);
const X11_KR = set("X11 or X14 two-car unit, sometimes two together", ["sesX11", 2]);
const X14_KR = set("X14 or X11 two-car unit, sometimes two together", ["sesX14", 2]);
const BY_TYPE = {
  sesX61Cab: X61_SET, sesX61A: X61_SET, sesX61B: X61_SET, sesX31Cab: X31_SET, sesX31CabR: X31_SET, sesX31Mid: X31_SET,
  sesRegina: REGINA, sesReginaB: REGINA, sesReginaMid: REGINA, sesX80: X80_SET, sesX80B: X80_SET, sesX80Mid: X80_SET,
  sesItinoMid: Y32,
};
// The run's two ends (and, for a train placed from the timetable, its stops).
const ends = (t) => `${t.origin || ""} ${t.destination || ""}`;
export const TYPICAL = {
  pagatag: () => X61_SET,
  oresundstag: () => X31_SET,
  vasttag: (t, reported) => {
    if (BY_TYPE[reported]) return BY_TYPE[reported];
    if (reported === "sesX11" || reported === "sesX12" || reported === "sesX14") return X10_VT;
    if (reported === "sesItino" || reported === "sesItinoB") return Y31("vasttag");
    const e = ends(t);
    if (/Lidköping|Mariestad|Hallsberg|Örebro|Håkantorp|Gårdsjö|Götene|Hova/.test(e)) return Y31("vasttag");
    if (/Borås|Varberg|Herrljunga|Vårgårda|Limmared/.test(e)) return X10_VT;
    if (/Älvängen|Vänersborg|Trollhättan|Öxnered|Säffle|Åmål|Mellerud|Lödöse/.test(e)) return X80_SET;
    if (/Strömstad|Uddevalla|Stenungsund|Munkedal|Dingle|Ytterby|Kode/.test(e)) return X61_VT;
    if (/Kungsbacka|Alingsås/.test(e) && !/Skövde|Falköping|Töreboda|Jönköping|Nässjö/.test(e)) return X61_PENDEL;
    return REGINA;
  },
  krosatag: (t, reported) => {
    if (reported === "sesX14") return X14_KR;
    if (reported === "sesX11") return X11_KR;
    if (reported === "sesItinoMid") return Y32;
    if (reported === "sesItino" || reported === "sesItinoB") return Y31("krosatag");
    const r = t.route || "", e = ends(t);
    if (/Kalmar$/.test(r) || /Västervik|Linköping|Hultsfred|Vimmerby/.test(e)) return Y31("krosatag");
    if (/Vetlanda|Eksjö|Halmstad|Värnamo|Åseda|Vaggeryd|Hyltebruk|Oskarshamn/.test(e)) return Y31("krosatag");
    return X11_KR;
  },
};

// Fact sheets in mph, hp and ft, from the published km/h, kW and m.
const JV = "https://www.jarnvag.net/vagnguide/";
export const FACTS = {
  sesX61Cab: { model: "Alstom Coradia Nordic (X61)", type: "Electric multiple unit", builder: "Alstom, Salzgitter", built: "2009–2019",
    fleet: "139 four-section units: Skånetrafiken 99, Västtrafik 22, Östgötatrafiken 18", topSpeedMph: 99.4, powerHp: 2682, seats: 214, lengthFt: 243.8,
    about: "A shorter, regional version of Stockholm's X60 with toilets and softer seats, articulated on five bogies with a 760 mm low floor. In Skåne it is the only Pågatåg, each unit named after a real or fictional Scanian; Västtrafik's have two more doors a side and are being refreshed in blue in 2025–26.",
    source: JV + "x61" },
  sesX31Cab: { model: "Bombardier Contessa (X31K/X32K/ET)", type: "Electric multiple unit", builder: "Adtranz/Bombardier, Kalmar and Germany", built: "1999–2012",
    fleet: "111 three-car units, all Swedish-owned since 2023", topSpeedMph: 111.8, powerHp: 3084, seats: 194, lengthFt: 258.9,
    about: "The Öresund trains, built to run on both Sweden's 15 kV and Denmark's 25 kV and to switch between them under way on the Öresund Bridge. Units couple nose to nose behind thick rubber collars, and the driving desks swing aside to open a gangway between them. All were refurbished in 2018–23.",
    source: JV + "x31k" },
  sesRegina: { model: "Bombardier Regina (X50–X53)", type: "Electric multiple unit", builder: "Adtranz/Bombardier, Västerås, Kalmar and Hennigsdorf", built: "2000–2013",
    fleet: "28 at Västtrafik, two- and three-car", topSpeedMph: 124.3, powerHp: 2132, seats: 166, lengthFt: 176.8,
    about: "Sweden's wide-bodied regional train, 3.45 m across so it seats five abreast. Västtåg runs it to Skövde, Falköping, Jönköping and Nässjö and on the Trollhättan line; a three-car set (264 ft) adds an unpowered middle car.",
    source: JV + "x50" },
  sesX11: { model: "ASEA X11", type: "Electric multiple unit", builder: "ASEA (rebuilt from X10)", built: "1982–1993, rebuilt 1994–1998",
    fleet: "49 two-car units rebuilt; Västtrafik 23, Krösatåg 20", topSpeedMph: 87, powerHp: 1716, lengthFt: 163.6,
    about: "X10 commuter units rebuilt with a toilet, new seats and their middle doors blocked. Skåne's were the first Pågatåg, in purple from 1983; replaced there by X61s in 2013, they went to Krösatåg in yellow, white and red.",
    source: JV + "x11" },
  sesX12: { model: "ASEA X12", type: "Electric multiple unit", builder: "ASEA/ABB", built: "1991–1994", fleet: "18 built; 13 at Västtrafik",
    topSpeedMph: 99.4, powerHp: 1716, seats: 115, lengthFt: 163.6,
    about: "A regional version of the X10 with one door a side per car and a toilet. All that remain run for Västtåg around Göteborg.",
    source: JV + "x12" },
  sesX14: { model: "ABB X14", type: "Electric multiple unit", builder: "ABB", built: "1994–1995", fleet: "18 built (2 more from X12s); Västtrafik 12, Krösatåg 6",
    topSpeedMph: 99.4, powerHp: 1716, seats: 123, lengthFt: 163.6,
    about: "The last of the X10 family, built for regional lines with two doors per car and a toilet. Västtåg runs them to Borås, Varberg and Uddevalla, Krösatåg around Jönköping.",
    source: JV + "x14" },
  sesItino: { model: "Bombardier Itino (Y31/Y32)", type: "Diesel multiple unit", builder: "Adtranz/Bombardier, Hennigsdorf", built: "2002–2010",
    fleet: "24 two-car Y31, 6 three-car Y32", topSpeedMph: 87, powerHp: 1287, seats: 86, lengthFt: 126.0,
    about: "Articulated diesel railcars with a low-floor section by each door, an engine under each end car. Krösatåg runs them on the lines without wires, among them the former Kustpilen to Kalmar and Västervik; Västtåg on the Kinnekulle line.",
    source: JV + "y31" },
  sesX80: { model: "Alstom Zefiro Express (X80)", type: "Electric multiple unit", builder: "Bombardier/Alstom (bodies from China, finished in Germany)", built: "2021–",
    fleet: "80 ordered, 80001–80080", topSpeedMph: 124.3, powerHp: 3755, seats: 270, lengthFt: 264.8,
    about: "Västtrafik's new regional train, five seats abreast in three cars with a low-floor middle car. Years late after long testing, the first entered passenger service on 11 May 2026 between Göteborg and Älvängen; they are to replace the X11–X14s and many Reginas.",
    source: JV + "x80" },
};
// A unit's other cars share its sheet, named for the part they are.
const part = (facts, name) => ({ ...facts, model: `${facts.model}, ${name}` });
FACTS.sesX61A = part(FACTS.sesX61Cab, "middle section");
FACTS.sesX61B = part(FACTS.sesX61Cab, "middle section");
FACTS.sesX31CabR = FACTS.sesX31Cab;
FACTS.sesX31Mid = part(FACTS.sesX31Cab, "middle car");
FACTS.sesReginaB = FACTS.sesRegina;
FACTS.sesReginaMid = part(FACTS.sesRegina, "middle car");
FACTS.sesItinoB = FACTS.sesItino;
FACTS.sesItinoMid = part(FACTS.sesItino, "middle car");
FACTS.sesX80B = FACTS.sesX80;
FACTS.sesX80Mid = part(FACTS.sesX80, "middle car");
