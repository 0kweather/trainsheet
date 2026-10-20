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
};

export const FLEETS = {
  pagatag: [[1, 99, "sesX61Cab"]],
  vasttag: [[61401, 61422, "sesX61Cab"]],
  oresundstag: [[4301, 4411, "sesX31Cab"], [4501, 4611, "sesX31CabR"], [4701, 4811, "sesX31Mid"]],
};

const set = (label, ...units) => ({ label, units });
const X61_SET = set("Four-section X61 (Coradia Nordic), often two together", ["sesX61Cab", 1], ["sesX61A", 1], ["sesX61B", 1], ["sesX61Cab", 1]);
const X31_ONE = ["sesX31Cab", 1], X31_MIDC = ["sesX31Mid", 1], X31_TAIL = ["sesX31CabR", 1];
const X31_SET = set("Two three-car X31K (Contessa) units, usually 1 to 3", X31_ONE, X31_MIDC, X31_TAIL, X31_ONE, X31_MIDC, X31_TAIL);
export const TYPICAL = {
  oresundstag: () => X31_SET,
  pagatag: () => X61_SET,
  vasttag: () => X61_SET,
};

export const FACTS = {};
