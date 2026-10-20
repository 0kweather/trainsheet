// Central and northern Sweden's regional trains (SL's pendeltåg, Mälartåg
// with the former Upptåget, Östgötapendeln, Tåg i Bergslagen, Norrtåg,
// Värmlandstrafik and X-Tåget, scripts/railroads/sweden.py): Trainsheet's
// own side views from each model's published dimensions. Swedish bodies
// are tall and wide (the loading gauge allows 3.4 m), and most of these
// trains are owned by Transitio, the regions' leasing company, and painted
// in the region's colors: SL's white with blue doors, Östgötapendeln's red
// and orange suns, Norrtåg's royal blue under a yellow band, Mälartåg's
// cobalt blue over silver, Tåg i Bergslagen's red over white,
// Värmlandstrafik's yellow and green, X-Tåget's red on anthracite. Sweden's
// feeds name no units, so each train is drawn as what typically runs on
// its line, told by its train number.

import { bilevel } from "../carmodels.js?v=dev";
import { rect, path, line, lines, poly, slats, truck, pantograph, C } from "../carart.js?v=dev";
import { letters, hvac, roofCover, panGear, horns, lamp, RED_LAMP, wiper, emuFront, boxes, frames } from "./digitraffic.cars.js?v=dev";

const ft = (m) => Math.round(m * 3.2808 * 100) / 100;
const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
// n windows w wide, spread with equal gaps between a and b.
const even = (a, b, n, w) => {
  const gap = (b - a - n * w) / (n + 1);
  return Array.from({ length: n }, (_, i) => a + gap * (i + 1) + w * i);
};
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";

// Dark roof equipment (converters, transformers, brake resistors) in a
// low box with louvered sides and a lighter lid line.
const roofBox = (x, roof, w, h = 0.9, fill = "#454b52") =>
  path(`M${x} ${roof - 0.05}L${x + 0.3} ${roof + h}L${x + w - 0.3} ${roof + h}L${x + w} ${roof - 0.05}Z`, fill, 0.4) +
  slats(x + 0.6, roof + 0.15, w - 1.2, h - 0.35, 0.45, "rgba(255,255,255,0.16)") + line(x + 0.4, roof + h - 0.1, x + w - 0.4, roof + h - 0.1, "rgba(255,255,255,0.25)", 0.5);
// A roof antenna: a short mast on a base.
const antenna = (x, roof) => rect(x - 0.3, roof - 0.05, 0.6, 0.2, "currentColor") + line(x, roof + 0.1, x, roof + 1.1, "currentColor", 0.8);
// A plug door's leaf, flush with the side: its outline, one long window, a
// seam for a two-leaf door; drawn over the paint. y0..y1 from the sill of
// the door to its head.
const plug = (x, w, y0, y1, { leaves = 1, glass = [0.45, 0.42], stroke = "rgba(0,0,0,0.55)" } = {}) => {
  let s = rect(x, y0, w, y1 - y0, "rgba(0,0,0,0.04)", 0, `rx="0.2" stroke="${stroke}" stroke-width="0.6" vector-effect="non-scaling-stroke"`);
  const lw = w / leaves, h = y1 - y0;
  for (let i = 0; i < leaves; i++) {
    if (i) s += line(x + lw * i, y0, x + lw * i, y1, stroke, 0.5);
    const gx = x + lw * i + lw * 0.2, gw = lw * 0.6;
    s += rect(gx, y0 + h * glass[0], gw, h * glass[1], C.glass, 0, 'rx="0.25"') + rect(gx + 0.1, y0 + h * (glass[0] + glass[1] * 0.62), gw - 0.2, h * glass[1] * 0.3, C.glassLight, 0, 'rx="0.15"');
  }
  return s;
};

// ===================== Alstom Coradia Nordic (X60, X61, X62) =====================

// --- Alstom Coradia Nordic, the Salzgitter-built articulated family: SL's
// X60 (six cars, 107.0 m; 71 X60 6001-6071 of 2005-08, 12 X60A 6072-6083 of
// 2012, 46 X60B 6084-6129 of 2015-17), and the four-car X61 (74.3 m;
// Östgötapendeln's 61201-61216 and 61301-61302) and X62 (Norrtåg's
// 62001-62012, 2011-12, for 180 km/h). Railway Gazette's description of the
// X60 as built (2005): end cars A1 and A2 20.75 m, middle cars 16.4 m;
// bogies 15.5 + 4 x 16.4 + 15.5 m apart, a motor bogie under each cab
// (2.4 m wheelbase) and Jakobs bogies at the joints (2.7 m), all but one
// powered; 850 mm wheels; 3.25 m wide, 4.18 m to the roof; a low floor
// 760-790 mm over the rail between the bogies, 1080 mm over them; double
// doors 1.3 m wide and 2.0 m tall, two a side on every car (twelve a side,
// spaced for Citybanan's platform doors). Nearly everything electrical is
// on the roof: a transformer and converter group on A1, M2 and A2, the
// heaters and air conditioning on every car, the pantographs at the inner
// ends of M2 and M3. The four-car units carry their pantograph at the
// middle joint; the X61 has five door pairs a side (one on each end car by
// its inner end, two on M1, one on M2) and bigger windows, the X62 one door
// pair on each car (jarnvag.net; photographs on Wikimedia Commons, 2016-26).
// A blunt nose: a near-upright chin with the headlights in its corners, the
// windshield raked back at about 50 degrees in a dark mask, the coupler
// under a box on its drawbar.
const CN = { roof: 13.7, sill: 2.7, cornerR: 1.1, end: 0.5, noTrucks: true, diaphragm: [2.6, 11.6], badge: false };
const CN_NOSE = [[1.75, 2.7], [1.45, 4.9], ["q", 1.35, 7.3, 2.15, 8.3], [5.0, 12.4], ["q", 5.9, 13.7, 8.0, 13.7]];
const cnJakobs = (x) => truck(x, { wb: 8.86, d: 33.5, top: 2.7 });
const CN_DOOR = { w: 4.27, y0: 2.55, y1: 9.1 };
// The windshield (seen from the side, wrapping round the corner), the
// headlights in the chin, the coupler and its box, and on the X60B and the
// four-car units three headlights over the windshield.
// The mask round the windshield as the side sees it: a wedge along the
// raked front, from the headlights up to the roof.
const CN_MASK = "M1.42 6.3Q3.4 6.5 4.5 8.0L7.3 11.9Q7.9 12.8 8.3 13.7L6.4 13.7Q5.6 13.6 5.0 12.4L2.15 8.3Q1.4 7.3 1.42 6.3Z";
const cnFront = ({ tops = 1, box = "#2a2d31", stripes = false }) => {
  let s = path(poly([[2.45, 8.7], [5.15, 12.4], [7.05, 12.4], [4.75, 9.15], ["q", 4.1, 8.4, 3.3, 8.4]]), C.glass) + path(poly([[2.85, 8.95], [4.0, 10.6], [4.45, 10.6], [3.4, 8.95]]), C.glassLight) +
    wiper(3.0, 8.9, 4.5, 11.2) + lamp(1.45, 5.55, 0.95, 0.62) + lamp(1.62, 4.8, 0.45, 0.32, RED_LAMP) + emuFront(1.75, 2.7, { coupler: 3.3 });
  s += lamp(5.55, 13.0, tops > 1 ? 1.1 : 0.55, 0.32);
  s += rect(-0.1, 2.55, 1.6, 1.5, box, 0, 'rx="0.15"');
  if (stripes) for (const x of [0.15, 0.75]) s += path(poly([[x, 2.65], [x + 0.35, 2.65], [x + 0.65, 3.95], [x + 0.3, 3.95]]), "#f2c200");
  return s;
};
// One car of a Coradia Nordic. part "cab" (the cab at the left) or "mid";
// o: { doors: [x], runs: [[a, b, n]] (window runs), w, y, h (windows),
//      roof(c, g) (equipment), k: paint { body, paint(c, g, part) } }.
function coradia(c, part, o) {
  const L = c.L, cab = part === "cab", roof = CN.roof;
  const rows = o.runs.map(([a, b, n]) => ({ xs: even(a, b, n, o.w), y: o.y, w: o.w, h: o.h, r: 0.5 }));
  return bilevel({ ...c, cabL: cab, cabR: false }, { ...CN, base: o.k.body,
    nose: cab ? CN_NOSE : null, cabLen: cab ? 9.0 : 0, rows,
    drop: { a: cab ? 22.6 : 6.4, b: L - 6.4, y: 1.55 },
    paint: (c, g) => o.k.paint(c, g, part) + rows.map((r) => frames(r.xs, r.y, r.w, r.h, 0.16, "#1f2327")).join(""),
    extra: (c, g) => {
      let s = (cab ? truck(17.2, { wb: 7.87, d: 33.5, top: 2.7 }) : cnJakobs(0)) + cnJakobs(L);
      for (const x of o.doors) s += plug(x, CN_DOOR.w, CN_DOOR.y0, CN_DOOR.y1, { leaves: 2, glass: [0.36, 0.5] });
      // The crew door behind the cab, its window high.
      if (cab) s += plug(9.4, 2.3, 2.9, 10.4, { glass: [0.52, 0.3] }) + line(9.15, 5.0, 9.15, 8.6, "currentColor", 0.6);
      // Under the floor only small boxes: brake and battery boxes by the
      // bogies, the air reservoirs; all else is on the roof.
      s += cab ? boxes(23.5, 30.0, 1.6, 1, 0.45) + boxes(L - 16.0, L - 7.0, 1.6, 1, 0.35) : boxes(8.0, 14.0, 1.6, 1, 0.4) + boxes(L - 15.0, L - 8.0, 1.6, 1, 0.35);
      s += line(0, 13.7, L, 13.7, "rgba(0,0,0,0.12)", 0.4);
      return s + o.roof(c, g);
    },
    cab: () => cnFront(o.front || {}),
  });
}

// ----- SL's X60: white, the doors and a stripe under the roof in SL's
// blue, a thin blue line at the cant rail; on the cab a blue sweep from
// the roof stripe down past the headlights round the mask; a dark mask
// round the windshield (on the X60B carried up over the cab roof), a gray
// skirt. Names on some units ("Skrammeltåget"), not drawn.
const SL = { white: "#eef1f3", blue: "#1d6fc4", skirt: "#4b5259", mask: "#3a4249", roof: "#c4cad0" };
const x60Paint = (b) => (c, g, part) => {
  const L = g.L;
  let s = rect(0, 0, L, 17, SL.white) + rect(0, 12.35, L, 3, SL.roof) + line(0, 12.35, L, 12.35, "rgba(0,0,0,0.18)", 0.5) +
    rect(0, 11.05, L, 0.55, SL.blue) + rect(0, 12.0, L, 0.16, SL.blue) + rect(0, 0, L, 1.95, SL.skirt) + rect(0, 1.95, L, 0.1, "rgba(0,0,0,0.3)");
  for (const x of x60Doors(part, L)) s += rect(x - 0.12, 2.45, CN_DOOR.w + 0.24, 6.8, SL.blue);
  if (part === "cab") {
    // The mask (on the X60B over the cab roof too), the blue sweep from the
    // roof stripe down round it, and the unit's number by the chin.
    s += rect(0, 11.05, 9.6, 1.3, SL.white) + path(CN_MASK, SL.mask);
    if (b) s += path("M5.0 12.4Q5.8 13.75 8.0 13.75L12.0 13.75L12.0 12.35L7.4 12.35Z", SL.mask);
    s += path("M11.0 11.6Q8.2 11.5 6.5 9.0L5.2 7.1Q4.0 5.6 1.3 5.45L1.3 4.6Q4.4 4.7 5.9 6.6L7.3 8.6Q8.8 10.95 11.0 11.05Z", SL.blue) +
      letters(c, 4.8, 3.6, 0.7, b ? "6084 A1" : "6001 A1", "#1d2024", { weight: 700, family: SANS });
  }
  return s;
};
// Doors two a side, spaced along the unit; windows between, slim and
// close set.
const x60Doors = (part, L) => (part === "cab" ? [12.4, 42.4] : [8.6, 38.6]);
const x60Runs = (part, L) => (part === "cab" ? [[16.67, 42.4, 5], [46.67, L - 1.5, 4]] : [[1.5, 8.6, 1], [12.87, 38.6, 5], [42.87, L - 1.5, 2]]);
// Roof: A1 and A2 a transformer and converter group, M2 the third with
// the pantograph at its inner end, M3 a cooler and the second pantograph,
// M1 and M4 a compressor; an air-conditioning unit on every car.
const x60Roof = (role) => (c, g) => {
  const L = g.L, roof = 13.7;
  let s = hvac(role === "cab" ? 31.0 : 3.5, roof, 8.5, 0.8, "#b4bac1");
  if (role === "cab") s += roofBox(11.0, roof, 17.0, 1.05) + roofBox(42.0, roof, 9.0, 0.8, "#5a6067") + roofCover(53.0, roof, 10.0, 0.55, "#9aa1a9") + antenna(9.0, roof);
  else if (role === "m2") s += roofBox(14.0, roof, 22.0, 1.05) + pantograph(L - 9.0, roof, { up: true, facing: -1 }) + panGear(L - 9.0, roof, -1);
  else if (role === "m3") s += roofBox(26.0, roof, 14.0, 0.95, "#5a6067") + pantograph(9.0, roof, { up: false }) + panGear(9.0, roof, 1);
  else s += roofBox(18.0, roof, 12.0, 0.8, "#5a6067") + roofCover(34.0, roof, 12.0, 0.5, "#9aa1a9");
  return s;
};
const x60 = (role, b = false) => (c) => coradia(c, role === "cab" ? "cab" : "mid", {
  doors: x60Doors(role === "cab" ? "cab" : "mid", c.L), runs: x60Runs(role === "cab" ? "cab" : "mid", c.L), w: 2.75, y: 4.75, h: 3.85,
  k: { body: SL.white, paint: x60Paint(b) }, roof: x60Roof(role), front: { tops: b ? 3 : 1, stripes: true, box: "#1d2024" },
});

// ----- The four-car units. Östgötapendeln's X61: white, a red sun and an
// orange one ringed in white rolling along the side, the mask dark gray
// round the windshield, the region's ring mark on the nose. Norrtåg's
// X62: royal blue, a yellow band along the top of the side, edged in
// white, that sweeps down the nose round the windshield; NORRTÅG on the
// side in white and yellow.
const OG = { white: "#f2f1ec", red: "#e2231a", orange: "#f39200", mask: "#3b4148", skirt: "#4b5259", roof: "#c7ccd1" };
const NT = { blue: "#1f4fb4", deep: "#163b8a", yellow: "#f6b519", roof: "#7f8994" };
const ogPaint = (c, g, part) => {
  const L = g.L, mid = part !== "cab";
  let s = rect(0, 0, L, 17, OG.white) + rect(0, 12.35, L, 3, OG.roof) + line(0, 12.35, L, 12.35, "rgba(0,0,0,0.18)", 0.5) + rect(0, 0, L, 1.95, OG.skirt);
  // The suns: a big red disc and an orange one ringed in white, centered
  // low and running off the car's top and bottom; on each end car they
  // begin behind the crew door.
  const sun = (x, r, fill, ring) => (ring ? `<circle cx="${x}" cy="5.6" r="${r + 1.1}" fill="${OG.white}"/>` : "") + `<circle cx="${x}" cy="5.6" r="${r}" fill="${fill}"/>`;
  s += mid ? sun(L * 0.3, 15.5, OG.red) + sun(L * 0.95, 13.0, OG.orange, true) : sun(30.0, 14.0, OG.red) + sun(62.0, 12.5, OG.orange, true);
  s += rect(0, 0, L, 1.95, OG.skirt);
  if (!mid) s += path(CN_MASK, OG.mask) + letters(c, 4.6, 3.6, 0.7, "61201", "#1d2024", { weight: 700, family: SANS });
  return s;
};
const ntPaint = (c, g, part) => {
  const L = g.L;
  let s = rect(0, 0, L, 17, NT.blue) + rect(0, 12.35, L, 3, NT.roof) + rect(0, 10.6, L, 1.75, NT.yellow) + rect(0, 10.38, L, 0.22, "#ffffff") +
    rect(0, 0, L, 1.95, NT.deep) + line(0, 12.35, L, 12.35, "rgba(0,0,0,0.2)", 0.5);
  if (part === "cab") {
    s += path("M14.0 10.38L14.0 12.35L8.6 12.35Q6.6 9.6 4.3 7.0Q2.8 5.6 1.2 5.4L1.2 4.3Q3.6 4.6 5.2 6.2Q7.4 8.4 9.6 10.38Z", NT.yellow) +
      path("M9.6 10.38Q7.4 8.4 5.2 6.2Q3.6 4.6 1.2 4.3L1.2 4.05Q3.8 4.3 5.4 6.0Q7.6 8.2 9.9 10.38Z", "#ffffff") +
      path(CN_MASK, NT.deep) +
      letters(c, 31.0, 3.75, 0.95, "NORR<tspan fill=\"#f6b519\">TÅG</tspan>", "#ffffff", { weight: 800, italic: true, family: SANS }) +
      letters(c, 4.6, 3.6, 0.7, "62001 A1", "#ffffff", { weight: 700, family: SANS });
  }
  return s;
};
// Roof of a four-car unit: the transformer and converter group on each end
// car, a converter on each middle car, the pantograph on M1 by the middle
// joint (raised), an air-conditioning unit on every car.
const cn4Roof = (role) => (c, g) => {
  const L = g.L, roof = 13.7;
  if (role === "cab") return hvac(31.0, roof, 8.5, 0.8, "#b4bac1") + roofBox(11.0, roof, 17.0, 1.05) + roofBox(42.0, roof, 9.0, 0.8, "#5a6067") + roofCover(53.0, roof, 10.0, 0.55, "#9aa1a9") + antenna(9.0, roof);
  return hvac(3.5, roof, 8.5, 0.8, "#b4bac1") + roofBox(15.0, roof, 14.0, 0.9, "#5a6067") +
    (role === "m1" ? pantograph(L - 9.0, roof, { up: true, facing: -1 }) + panGear(L - 9.0, roof, -1) : roofCover(L - 18.0, roof, 10.0, 0.5, "#9aa1a9"));
};
// X61: on the end car six big windows, the door by the inner end and two
// windows beyond it; M1 two doors, M2 one. X62: one door on every car.
const X61_LAYOUT = {
  cab: { doors: [48.6], runs: [[12.0, 48.2, 6], [53.3, 66.8, 2]] },
  m1: { doors: [6.4, 41.8], runs: [[11.0, 41.4, 5], [46.4, 52.4, 1]] },
  m2: { doors: [6.4], runs: [[1.3, 6.0, 1], [11.0, 52.4, 7]] },
};
const X62_LAYOUT = {
  cab: { doors: [48.6], runs: [[12.0, 48.2, 6], [53.3, 66.8, 2]] },
  m1: { doors: [6.4], runs: [[11.0, 52.4, 7]] },
  m2: { doors: [6.4], runs: [[11.0, 52.4, 7]] },
};
const cn4 = (layout, k, role) => (c) => {
  const lay = layout[role];
  return coradia(c, role === "cab" ? "cab" : "mid", { ...lay, w: 3.9, y: 5.0, h: 3.6, k, roof: cn4Roof(role), front: { tops: 3 } });
};
const X61K = { body: OG.white, paint: ogPaint }, X62K = { body: NT.blue, paint: ntPaint };

// ===================== Stadler DOSTO, ER1 =====================

// --- Stadler DOSTO (KISS), Swedish type ER1 (60 four-car units, 2019-23,
// owned by Transitio: 001-053 Mälartåg's, the eight of Upptåget among
// them, 054-060 Tåg i Bergslagen's). Stadler's data sheet for TiB's
// (DOSTO_TIB0522e): 104.81 m over couplers, 2.92 m wide and 4.70 m tall
// (12 cm wider and 10 cm taller than the standard DOSTO), floors 450 mm
// (lower deck), 605 mm (entrances) and 2597 mm (upper deck) over the rail,
// single-leaf doors 1.3 m wide, bogies of 2.5 m wheelbase on 920 mm wheels;
// 2'Bo' + 2'2' + Bo'2' + Bo'2'. Each car: the double deck between the
// bogies with a door at each end of it, and a single-deck end section over
// each bogie under a lower roof; the end cars 26.85 m, the middle ones
// 25.55 m (from the total and the diagram's proportions). The long raked
// nose with a crew door a side, twin bellows between the cars, big snow
// ploughs. The pantographs on the middle cars' end sections, by the end
// cars (one raised). Mälartåg's paint: pale silver, the upper deck and the
// roof cobalt blue, the blue brought down the whole nose to the
// headlights; door frames outlined in red; Mälartåg's mark, three dots,
// and its name by the cab. Tåg i Bergslagen's: white, a warm red in place
// of the blue, the TiB mark.
const DS = { roof: 15.42, sill: 3.3, cornerR: 1.0, end: 0.5, ends: { h: 14.75, len: 12.6, ramp: 1.6 }, noTrucks: true, diaphragm: [3.4, 13.4], badge: false };
const DS_NOSE = [[2.4, 3.3], [1.75, 5.2], ["q", 1.6, 7.2, 2.6, 8.4], [7.6, 13.9], ["q", 8.9, 14.75, 11.5, 14.75]];
const dsTruck = (x) => truck(x, { wb: 8.2, d: 36, top: 3.3 });
const DS_LIV = {
  malartag: { top: "#2b5bd3", deep: "#1f45a8", body: "#e4e7eb", skirt: "#70777f", frame: "#e0312b", ink: "#1f3f9a", name: "Mälartåg" },
  tib: { top: "#e2452d", deep: "#b8331f", body: "#f1f1ef", skirt: "#70777f", frame: "#e2452d", ink: "#c2311d", name: "Tåg i Bergslagen" },
};
const dsLiv = (c) => DS_LIV[c.agency] || DS_LIV.malartag;
const DS_DOOR = { w: 4.27, y0: 1.98, y1: 8.9 };
// Mälartåg's mark: three dots in a cluster, then the name.
const dsMark = (c, x, y, k) => (k.name === "Mälartåg"
  ? [[-0.55, 0.0], [0.0, 0.42], [0.55, 0.0]].map(([dx, dy]) => `<circle cx="${x + (c.mirrored ? -dx : dx)}" cy="${y + 0.95 + dy}" r="0.3" fill="${k.ink}"/>`).join("") + letters(c, x, y, 0.85, k.name, k.ink, { weight: 600, family: SANS })
  : letters(c, x, y + 0.2, 1.1, "TiB", k.ink, { weight: 800, italic: true, family: SANS }) + letters(c, x, y - 0.9, 0.55, k.name, k.ink, { weight: 600, family: SANS }));
function dosto(c, cab) {
  const L = c.L, k = dsLiv(c), roof = DS.roof;
  const a = cab ? 22.4 : 16.4, b = L - 16.4;           // the double deck
  const doors = [a + 0.4, b - 0.4 - DS_DOOR.w];
  const lower = { xs: even(doors[0] + DS_DOOR.w, doors[1], cab ? 5 : 6, 3.9), y: 3.2, w: 3.9, h: 2.55, r: 0.45 };
  const upper = { xs: even(a, b, cab ? 7 : 8, 3.9), y: 10.15, w: 3.9, h: 2.45, r: 0.45 };
  const ends = { xs: cab ? [16.4, L - 11.3] : [3.4, L - 11.3], y: 6.5, w: cab ? 4.4 : 3.6, h: 2.6, r: 0.45 };
  const rows = [lower, upper, ends];
  const panSide = c.index != null && c.count != null && c.index >= c.count / 2 ? 1 : -1;  // the end section by the nearer end car
  return bilevel({ ...c, cabL: cab, cabR: false }, { ...DS, base: k.body, nose: cab ? DS_NOSE : null, cabLen: cab ? 11 : 0, rows,
    drop: { a: a - 0.4, b: b + 0.4, y: 1.1 },
    paint: (c, g) => {
      let s = rect(0, 0, L, 17, k.body) + rect(0, 9.55, L, 8, k.top) + rect(0, 9.35, L, 0.2, "#ffffff") + rect(0, 0, L, 1.65, k.skirt);
      s += rows.map((r) => frames(r.xs, r.y, r.w, r.h, 0.16, "#1f2327")).join("");
      for (const x of doors) s += rect(x - 0.3, DS_DOOR.y0 - 0.1, DS_DOOR.w + 0.6, DS_DOOR.y1 - DS_DOOR.y0 + 0.4, k.frame, 0, 'rx="0.35"') + rect(x - 0.1, DS_DOOR.y0, DS_DOOR.w + 0.2, DS_DOOR.y1 - DS_DOOR.y0, k.body, 0, 'rx="0.25"');
      if (cab) {
        // The color down the whole nose to the headlights, back to the
        // crew door; the windshield's black surround.
        s += path(`M0 4.9L9.6 4.9Q12.4 4.9 12.4 7.5L12.4 9.55L0 9.55Z`, k.top) +
          path(poly([[2.0, 8.0], [7.4, 13.75], [11.0, 13.75], [11.0, 8.5], [5.0, 7.7]]), "#15181b") + dsMark(c, 7.0, 3.6, { ...k, ink: "#ffffff" });
      } else s += dsMark(c, L / 2, 7.0, k);
      return s;
    },
    extra: (c, g) => {
      let s = cab ? dsTruck(13.6) + dsTruck(L - 9.4) : dsTruck(9.4) + dsTruck(L - 9.4);
      for (const x of doors) s += plug(x, DS_DOOR.w, DS_DOOR.y0, DS_DOOR.y1, { glass: [0.38, 0.45] });
      if (cab) s += plug(12.9, 2.2, 3.6, 11.4, { glass: [0.5, 0.3] }) + lines([[12.6, 5.5, 12.6, 9.5], [15.4, 5.5, 15.4, 9.5]], "currentColor", 0.6);
      // Underfloor: converters and transformer boxes under the end
      // sections, nothing under the low double deck.
      s += cab ? boxes(1.5 + 15.0, a - 1.0, 3.3, 1, 0.7) + boxes(b + 1.0, b + 4.8, 3.3, 1, 0.6) : boxes(3.6, 4.6, 3.3, 1, 0.5) + boxes(b + 1.0, b + 4.8, 3.3, 1, 0.6);
      // Roof: air conditioning over each deck's ends, the end sections'
      // equipment, and on a middle car the pantograph.
      s += hvac(a + 2.0, roof, 9.0, 0.6, "#a7aeb6") + hvac(b - 11.0, roof, 9.0, 0.6, "#a7aeb6");
      if (cab) s += roofBox(12.0, 14.75, 4.0, 0.6) + horns(9.8, 14.75);
      else {
        const px = panSide < 0 ? 6.2 : L - 6.2;
        s += pantograph(px, 14.75, { up: panSide < 0, facing: -panSide }) + roofBox(panSide < 0 ? L - 11.0 : 1.5, 14.75, 9.0, 0.6);
      }
      return s;
    },
    cab: () => path(poly([[2.45, 8.3], [7.5, 13.5], [10.6, 13.5], [10.6, 8.75], [5.2, 8.05]]), C.glass) + path(poly([[2.9, 8.55], [4.6, 10.4], [5.3, 10.4], [3.7, 8.55]]), C.glassLight) +
      wiper(3.4, 8.6, 5.4, 11.2) + lamp(1.65, 5.45, 0.55, 0.45) + lamp(1.72, 4.75, 0.38, 0.3, RED_LAMP) + lamp(9.6, 14.15, 0.8, 0.3) + emuFront(2.4, 3.3, { coupler: 3.4 }) +
      path(poly([[2.2, 3.3], [6.2, 3.3], [5.5, 0.55], [2.6, 0.45], [1.9, 1.4]]), "#2a2d31"),
  });
}

// ===================== Bombardier Regina (X50-X54) =====================

// --- Bombardier Regina (Kalmar Verkstad, 2000-11; 63 of them Transitio's):
// cars of 26.95 m (two-car units 53.9 m, three-car 80.5 m), 3.45 m wide,
// the widest trains in Sweden (five seats abreast); bogie centers 19.0 m,
// 2.7 m wheelbase, 840 mm wheels; the floor 1.15 m over the rail, with a
// low entrance at one end of the B car (sv.wikipedia, "Regina (tåg)";
// the height, about 4.3 m, from photographs). Bo'Bo' + Bo'2': both bogies
// of the A car powered and the B car's one under its cab; a three-car
// unit's middle car (UB) runs on two trailer bogies. Stainless steel
// sides; a near-upright rounded nose with a big windshield in a black
// surround, the headlights at its lower corners, a lamp over the glass;
// behind the cab one tall side window; two plug doors a side on each car,
// one about a third of the way from the cab and one by the inner end; the
// pantograph on the A car by the joint, air conditioning over each half
// of every car. Variants (jarnvag.net): X50 (Mälartåg 9001-9004; X-Tåget
// 9061), X51 (Tåg i Bergslagen 9007-9025; X-Tåget 9010), X52 (200 km/h:
// Norrtåg's, 9032-9062, X-Tåget's, 9046 among them, Mälartåg's ex-Upptåget
// 9064-9066, Tåg i Bergslagen's 9037 and 9039), X53 (Värmlandstrafik's,
// 9049 among them), X54 (TiB 9005, 9006, 9056, 9057, 9068).
// Each region's paint, from photographs of 2023-26 (Wikimedia Commons,
// jarnvag.net): a cab color over the front, a sweep of the trim color up
// each side of the windshield and along the top of the side, a dark
// window band. Tåg i Bergslagen: a white cab, red sweeping over the
// cab roof and along the eaves, stainless sides, its red mark big on the
// cab side. Mälartåg (2025): the whole cab and the eaves cobalt blue, the
// sides silver-white, the doors framed in red, its red mark and name.
// X-Tåget: a white cab with red over its roof, the sides anthracite with
// a big red X by the cab and red door frames, the name in white. Norrtåg:
// royal blue, yellow up the windshield's sides and along the eaves.
// Värmlandstrafik: a white cab, yellow up the windshield's sides and along
// the eaves, stainless sides, a green line at the waist rising toward
// the cab.
const RG = { roof: 14.1, sill: 3.0, cornerR: 1.1, end: 0.55, trucks: { centers: 62.34, wb: 8.86, d: 33 }, diaphragm: [3.8, 12.2], badge: false };
const RG_NOSE = [[1.25, 3.0], [0.95, 6.2], ["q", 0.95, 8.1, 1.6, 9.0], [3.3, 13.0], ["q", 3.9, 14.1, 5.6, 14.1]];
const STEEL = "#d3d7db", STEEL_DK = "#b7bdc3";
const RG_MARK = {
  tib: (c, x, y, h) => letters(c, x, y, h, "TiB", "#d7262f", { weight: 800, italic: true, family: SANS }),
  malartag: (c, x, y, h) => [[-0.5, 0], [0, 0.45], [0.5, 0]].map(([dx, dy]) => `<circle cx="${x - 3.2 * h + (c.mirrored ? -dx : dx) * h}" cy="${y + dy * h}" r="${0.32 * h}" fill="#e0312b"/>`).join("") +
    letters(c, x, y, h, "Mälartåg", "#e0312b", { weight: 600, family: SANS }),
  xtaget: (c, x, y, h) => letters(c, x, y, h, "Xtåget", "#ffffff", { weight: 800, family: SANS, spacing: -0.03 * h }),
  norrtag: (c, x, y, h) => letters(c, x, y, h, "NORR<tspan fill=\"#f6b519\">TÅG</tspan>", "#ffffff", { weight: 800, italic: true, family: SANS }),
  varmlandstag: (c, x, y, h) => letters(c, x, y, h, "Värmlandstrafik", "#22a046", { weight: 700, family: SANS }),
};
// body: the sides; cab: the front; trim: the sweep and eaves; band: the
// window band; low: the skirt; frame: door frames.
const RG_LIV = {
  tib: { body: STEEL, cab: "#f4f4f2", trim: "#d7262f", band: "#24282c", low: "#5e656c", roof: "#c2c8ce" },
  malartag: { body: "#e9ecef", cab: "#2b5bd3", trim: "#2b5bd3", band: "#3a4047", low: "#5e656c", roof: "#2b5bd3", frame: "#e0312b" },
  xtaget: { body: "#45494e", cab: "#f4f4f2", trim: "#e2232e", band: "#26292d", low: "#33363a", roof: "#c2c8ce", frame: "#e2232e", x: true },
  norrtag: { body: NT.blue, cab: NT.blue, trim: NT.yellow, band: "#14306e", low: NT.deep, roof: NT.roof, pin: true },
  varmlandstag: { body: STEEL, cab: "#f4f4f2", trim: "#f2b800", eave: 0.6, band: "#24282c", low: "#5e656c", roof: "#c2c8ce", green: "#22a046" },
};
const rgLiv = (c) => RG_LIV[c.agency] || RG_LIV.tib;
// The side's paint shared by every car: the window band, eaves, skirt,
// door frames; from x0 on (a cab car's begin behind its cab).
function rgSide(c, L, k, x0, doors) {
  let s = rect(0, 0, L, 17, k.body) + rect(0, 12.9, L, 2, k.roof) + line(0, 12.9, L, 12.9, "rgba(0,0,0,0.18)", 0.5) +
    rect(x0, 6.25, L - x0, 3.75, k.band) + rect(0, 12.9 - (k.eave || 1.8), L, k.eave || 1.8, k.trim) + rect(0, 0, L, 3.4, k.low);
  if (k.pin) s += rect(0, 10.9, L, 0.2, "#ffffff");
  if (k.body === STEEL) s += lines([[x0, 4.9, L, 4.9], [x0, 11.0, L, 11.0]], STEEL_DK, 0.5);
  if (k.green) s += rect(x0, 5.2, L - x0, 0.5, k.green);
  for (const d of doors) {
    if (k.frame) s += rect(d.x - 0.3, d.y0, d.w + 0.6, d.y1 - d.y0 + 0.3, k.frame, 0, 'rx="0.3"');
    s += rect(d.x - 0.05, d.y0, d.w + 0.1, d.y1 - d.y0, k.x ? "#5a5f65" : k.body === NT.blue ? "#2a5cc4" : "#dfe2e5", 0, 'rx="0.2"');
  }
  return s;
}
const RG_DOOR = (x, low) => ({ x, w: 3.6, y0: low ? 1.95 : 3.77, y1: 10.3 });
const RG_WIN = { y: 6.55, w: 4.7, h: 3.15, r: 0.35 };
// car: "A" (motor car, cab), "B" (cab, the low entrance), "M" (middle).
function regina(c, car) {
  const L = c.L, k = rgLiv(c), roof = RG.roof, cab = car !== "M";
  const doors = cab ? [RG_DOOR(28.0, false), RG_DOOR(L - 13.8, car === "B")] : [RG_DOOR(9.6, false), RG_DOOR(L - 13.2, false)];
  const rows = cab ? [{ ...RG_WIN, xs: even(10.8, 28.0, 2, 4.7) }, { ...RG_WIN, xs: even(31.6, L - 13.8, 5, 4.7) }, { ...RG_WIN, xs: [L - 9.0] }]
    : [{ ...RG_WIN, xs: [3.4] }, { ...RG_WIN, xs: even(13.2, L - 13.2, 9, 4.7) }, { ...RG_WIN, xs: [L - 8.4] }];
  const mark = RG_MARK[c.agency] || RG_MARK.tib;
  return bilevel({ ...c, cabL: cab, cabR: false }, { ...RG, base: k.body, nose: cab ? RG_NOSE : null, cabLen: cab ? 7.5 : 0, rows,
    paint: (c, g) => {
      let s = rgSide(c, L, k, cab ? 9.6 : 0, doors);
      if (cab) {
        // The cab's color over the front and back to its side window, the
        // trim sweeping up beside the windshield to the eaves, the black
        // surround of the glass.
        s += path("M0 3.4L0 14.2L9.6 14.2L9.6 3.4Z", k.cab) + rect(0, 0, 9.6, 3.4, k.low) +
          path(poly([[0.95, 5.0], [3.1, 5.0], ["q", 4.3, 8.0, 6.0, 10.4], ["q", 7.0, 11.1, 9.6, 11.1], [9.6, 14.2], [5.4, 14.2], ["q", 3.9, 14.2, 3.2, 12.6], [1.6, 9.0], ["q", 1.0, 7.8, 0.95, 5.0]]), k.trim) +
          path(poly([[1.3, 8.3], [3.15, 13.0], ["q", 3.6, 13.8, 4.6, 13.8], [5.6, 13.8], [4.7, 12.9], [2.95, 8.3]]), "#16191c") + frames([6.7], 6.9, 1.5, 3.4, 0.15) +
          (k.x ? path(poly([[12.6, 3.4], [15.6, 3.4], [17.6, 7.0], [19.6, 3.4], [22.6, 3.4], [19.2, 8.4], [22.6, 13.0], [19.6, 13.0], [17.6, 9.8], [15.6, 13.0], [12.6, 13.0], [16.0, 8.4]]), k.trim) : "") +
          (k.green ? path("M9.6 5.7L9.6 5.2Q6.2 5.1 3.6 3.8L3.2 4.2Q6.0 5.7 9.6 5.7Z", k.green) : "");
        s += c.agency === "xtaget" ? mark(c, 15.0, 4.6, 1.3) : c.agency === "malartag" ? mark(c, 21.0, 4.4, 0.95) : mark(c, 6.9, 4.5, c.agency === "varmlandstag" ? 0.5 : 1.0);
      } else if (k.x || c.agency === "malartag") s += mark(c, L / 2, 4.4, 0.95);
      return s;
    },
    extra: (c, g) => {
      let s = "";
      for (const d of doors) s += plug(d.x, d.w, d.y0, d.y1, { glass: [0.42, 0.42] });
      // Underfloor: the traction converter and transformer between the A
      // car's bogies, auxiliaries and the battery under the others.
      s += car === "A" ? boxes(24.0, 64.0, 3.0, 4, 1.25, "#363a40") : boxes(24.0, 64.0, 3.0, 3, 1.0, "#363a40");
      s += hvac(17.0, roof, 10.0, 0.7, "#a7aeb6") + hvac(L - 30.0, roof, 10.0, 0.7, "#a7aeb6");
      if (car === "A") s += pantograph(L - 10.5, roof, { up: true, facing: -1 }) + panGear(L - 10.5, roof, -1) + roofBox(40.0, roof, 12.0, 0.7, "#5a6067");
      else s += roofCover(40.0, roof, 14.0, 0.5, "#9aa1a9");
      return s + (cab ? horns(6.2, 14.05) : "");
    },
    cab: () => path(poly([[1.6, 8.6], [3.35, 12.75], ["q", 3.7, 13.45, 4.5, 13.45], [5.0, 13.45], [4.3, 12.75], [2.7, 8.6]]), C.glass) + path(poly([[1.9, 8.85], [2.75, 10.9], [3.3, 10.9], [2.45, 8.85]]), C.glassLight) +
      wiper(2.2, 8.8, 3.2, 11.4) + lamp(1.0, 5.6, 0.75, 0.6) + lamp(1.1, 4.75, 0.45, 0.34, RED_LAMP) + lamp(4.6, 13.55, 0.8, 0.28) + emuFront(1.25, 3.0, { coupler: 3.1 }),
  });
}

// ===================== Bombardier Itino (Y31) =====================

// --- Bombardier Itino, Y31 (2002-10; Värmlandstrafik runs five, 1413-1421
// among them, on the Fryksdal Line to Torsby): two cars, 38.4 m, on three
// bogies (B'2'B'), the middle one a Jakobs bogie under the joint, a powered
// bogie under each cab; a MAN or Iveco diesel and its transmission under
// the raised floor behind each cab, the radiator and exhaust on the roof
// above; a low floor at the doors, one double door a side on each car by
// the joint (jarnvag.net; about 3.9 m tall from photographs).
// Värmlandstrafik's paint: anthracite, the cab and a band along the roof
// edge yellow, the door frames yellow, a thin green line low on the side.
const IT = { roof: 12.8, sill: 2.4, cornerR: 1.0, end: 0.5, noTrucks: true, diaphragm: [2.2, 10.8], badge: false };
const IT_NOSE = [[1.4, 2.4], [1.0, 5.2], ["q", 1.0, 7.0, 1.7, 8.0], [3.3, 11.6], ["q", 3.9, 12.8, 5.6, 12.8]];
const VT = { body: "#565b61", yellow: "#f4b700", green: "#22a046", roof: "#6d737a" };
function itino(c) {
  const L = c.L, roof = IT.roof;
  const rows = [{ xs: [9.5], y: 6.2, w: 2.2, h: 3.0, r: 0.35 }, { xs: even(13.0, 45.0, 4, 6.4), y: 6.0, w: 6.4, h: 3.3, r: 0.45 }, { xs: [L - 6.6], y: 6.0, w: 4.6, h: 3.3, r: 0.45 }];
  const door = { x: L - 13.5, w: 4.27, y0: 1.95, y1: 8.8 };
  return bilevel({ ...c, cabL: true, cabR: false }, { ...IT, base: VT.body, nose: IT_NOSE, cabLen: 7, rows,
    drop: { a: 21.5, b: L - 5.4, y: 1.35 },
    paint: (c, g) => rect(0, 0, L, 17, VT.body) + rect(0, 11.9, L, 2, VT.roof) + rect(0, 10.9, L, 1.0, VT.yellow) + rect(0, 0, L, 1.6, "#3d4146") +
      rect(0, 4.4, L, 0.3, VT.green) + rect(door.x - 0.3, door.y0 - 0.1, door.w + 0.6, door.y1 - door.y0 + 0.4, VT.yellow, 0, 'rx="0.3"') +
      path("M0 3.6L0 13L9.0 13L9.0 10.9Q7.6 10.9 6.4 8.0Q5.4 5.6 3.2 4.6Q2.2 4.0 2.0 3.6Z", VT.yellow) + path(poly([[1.45, 7.6], [3.2, 11.3], [6.6, 11.3], [6.6, 7.6]]), "#1f2327") +
      rows.map((r) => frames(r.xs, r.y, r.w, r.h, 0.15)).join("") + letters(c, 30.0, 4.4, 0.7, "Värmlandstrafik", "#ffffff", { weight: 700, family: SANS }),
    extra: (c, g) => truck(13.5, { wb: 8.2, d: 30, top: 2.4 }) + truck(L, { wb: 8.2, d: 30, top: 2.4 }) +
      plug(door.x, door.w, door.y0, door.y1, { leaves: 2, glass: [0.35, 0.5] }) +
      // The power pack under the raised floor, its radiator and exhaust
      // on the roof; air conditioning over the low floor.
      rect(19.5, 0.9, 13.0, 1.5, "#2f3338", 0.4, 'rx="0.2"') + slats(20.0, 1.0, 5.5, 1.3, 0.4, "rgba(255,255,255,0.15)") + rect(33.0, 1.3, 6.0, 1.0, "#3a3e44", 0.4, 'rx="0.4"') +
      roofCover(10.0, roof, 13.0, 0.85, "#80878f", 3) + slats(10.8, roof + 0.15, 11.4, 0.6, 0.4, "rgba(0,0,0,0.35)") + rect(19.5, roof + 0.85, 0.5, 0.6, "currentColor") +
      hvac(30.0, roof, 9.0, 0.65, "#9aa1a9") + horns(6.6, roof - 0.05),
    cab: () => path(poly([[1.65, 7.9], [3.25, 11.1], [6.2, 11.1], [6.2, 7.9]]), C.glass) + path(poly([[2.0, 8.15], [2.9, 10.0], [3.5, 10.0], [2.6, 8.15]]), C.glassLight) +
      wiper(2.2, 8.1, 3.1, 10.3) + lamp(1.05, 5.0, 0.55, 0.5) + lamp(1.1, 4.3, 0.4, 0.3, RED_LAMP) + emuFront(1.4, 2.4, { coupler: 3.0 }),
  });
}

// ===================== ASEA X11 =====================

// --- ASEA X11 (rebuilt 1990s from the X10 commuter units of 1983-95;
// Norrtåg leases three from Transitio, 3189 among them, for Umeå-Vännäs-
// Hällnäs): two cars, 49.87 m, a motor car (Bo'Bo') with the pantograph
// and a trailer (2'2'), each with a cab; the X10's middle doors sealed, so
// a double door a side near each end of each car; ribbed steel lower
// panels, a flat cab front with two windows and the headlights high in a
// box on the roof's front (jarnvag.net; height about 3.85 m and bogie
// centers about 17.5 m, from photographs). Norrtåg's paint: royal blue,
// the roof and the cab's corners yellow, NORRTÅG on the side.
const X11 = { roof: 12.7, sill: 3.9, cornerR: 0.9, end: 0.55, trucks: { centers: 57.4, wb: 8.2, d: 36 }, diaphragm: [4.0, 11.4], badge: false };
const X11_NOSE = [[1.0, 3.9], [0.9, 7.6], [1.6, 11.6], ["q", 1.9, 12.7, 3.2, 12.7]];
function x11(c, motor) {
  const L = c.L, roof = X11.roof;
  const doors = [{ x: 12.6, w: 4.4 }, { x: L - 16.0, w: 4.4 }];
  const rows = [{ xs: [7.4], y: 7.0, w: 3.6, h: 3.0, r: 0.4 }, { xs: even(17.3, L - 16.3, 8, 3.6), y: 7.0, w: 3.6, h: 3.0, r: 0.4 }, { xs: [L - 9.0], y: 7.0, w: 3.6, h: 3.0, r: 0.4 }];
  const rib = [];
  for (let y = 4.4; y < 6.6; y += 0.36) rib.push([0, y, L, y]);
  return bilevel({ ...c, cabL: true, cabR: false }, { ...X11, base: NT.blue, nose: X11_NOSE, cabLen: 5.5, rows,
    paint: (c, g) => rect(0, 0, L, 17, NT.blue) + rect(0, 11.3, L, 2, NT.yellow) + rect(0, 11.1, L, 0.2, "#ffffff") + rect(0, 0, L, 4.3, NT.deep) +
      lines(rib, "#3d6bd0", 0.5) + path("M0 4.2L0 13L5.0 13L5.0 11.3Q3.6 11.3 3.2 9.8L2.6 4.2Z", NT.yellow) +
      rows.map((r) => frames(r.xs, r.y, r.w, r.h, 0.18, "#8d949c")).join("") + letters(c, 21.5, 10.55, 0.6, "NORR<tspan fill=\"#f6b519\">TÅG</tspan>", "#ffffff", { weight: 800, italic: true, family: SANS }),
    extra: (c, g) => {
      let s = "";
      for (const d of doors) s += plug(d.x, d.w, 4.1, 10.6, { leaves: 2, glass: [0.45, 0.42] });
      s += plug(4.5, 2.0, 4.3, 10.8, { glass: [0.5, 0.33] }) + rect(14.0, 1.6, 2.0, 0.7, "#2f3338") + boxes(20.0, L - 20.0, 3.9, motor ? 4 : 3, motor ? 1.3 : 1.0, "#30343a");
      s += hvac(18.0, roof, 9.0, 0.75, "#a7aeb6") + hvac(L - 27.0, roof, 9.0, 0.75, "#a7aeb6") + roofBox(1.4, roof, 3.4, 0.9, "#30343a");
      if (motor) s += pantograph(L - 12.0, roof, { up: true, facing: -1 }) + panGear(L - 12.0, roof, -1);
      return s;
    },
    cab: () => path(poly([[1.0, 8.0], [1.55, 10.9], [4.6, 10.9], [4.6, 8.0]]), C.glass) + path(poly([[1.25, 8.3], [1.6, 10.0], [2.2, 10.0], [1.9, 8.3]]), C.glassLight) +
      wiper(1.5, 8.2, 2.0, 10.4) + lamp(1.6, 13.0, 0.6, 0.5) + lamp(0.95, 5.0, 0.5, 0.45) + lamp(1.0, 4.3, 0.36, 0.3, RED_LAMP) + emuFront(1.0, 3.9, { coupler: 3.0 }),
  });
}

// ===================== The registry =====================

export const TYPES = {
  seX60Cab: { name: "X60 end car", kind: "emu" },
  seX60M: { name: "X60 middle car", kind: "emu" },
  seX60M2: { name: "X60 middle car (pantograph)", kind: "emu" },
  seX60M3: { name: "X60 middle car (pantograph)", kind: "emu" },
  seX60bCab: { name: "X60B end car", kind: "emu" },
  seX61Cab: { name: "X61 end car", kind: "emu" },
  seX61M1: { name: "X61 middle car (pantograph)", kind: "emu" },
  seX61M2: { name: "X61 middle car", kind: "emu" },
  seX62Cab: { name: "X62 end car", kind: "emu" },
  seX62M1: { name: "X62 middle car (pantograph)", kind: "emu" },
  seX62M2: { name: "X62 middle car", kind: "emu" },
  seEr1Cab: { name: "ER1 (Stadler DOSTO) end car", kind: "emu" },
  seEr1Mid: { name: "ER1 (Stadler DOSTO) middle car", kind: "emu" },
  seReginaA: { name: "Regina motor car", kind: "emu" },
  seReginaB: { name: "Regina car", kind: "emu" },
  seReginaM: { name: "Regina middle car", kind: "emu" },
  seY31: { name: "Itino (Y31) car", kind: "emu" },
  seX11M: { name: "X11 motor car", kind: "emu" },
  seX11T: { name: "X11 trailer car", kind: "emu" },
};

// len: feet over the couplers. Single-cab cars are drawn facing forward
// and mirrored at the back of a train.
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const CAB = ft(20.75), MID = ft(16.4);
export const MODELS = {
  seX60Cab: M(x60("cab"), CAB, true),
  seX60M: M(x60("m"), MID),
  seX60M2: M(x60("m2"), MID),
  seX60M3: M(x60("m3"), MID),
  seX60bCab: M(x60("cab", true), CAB, true),
  seX61Cab: M(cn4(X61_LAYOUT, X61K, "cab"), CAB, true),
  seX61M1: M(cn4(X61_LAYOUT, X61K, "m1"), MID),
  seX61M2: M(cn4(X61_LAYOUT, X61K, "m2"), MID),
  seX62Cab: M(cn4(X62_LAYOUT, X62K, "cab"), CAB, true),
  seX62M1: M(cn4(X62_LAYOUT, X62K, "m1"), MID),
  seX62M2: M(cn4(X62_LAYOUT, X62K, "m2"), MID),
  seEr1Cab: M((c) => dosto(c, true), ft(26.85), true),
  // The middle cars' pantographs stand at the end nearer an end car.
  seEr1Mid: M((c) => dosto(c, false), ft(25.555), false, (c) => (c.index >= c.count / 2 ? "b" : "a")),
  seReginaA: M((c) => regina(c, "A"), ft(26.95), true),
  seReginaB: M((c) => regina(c, "B"), ft(26.95), true),
  seReginaM: M((c) => regina(c, "M"), ft(26.6)),
  seY31: M(itino, ft(19.2), true),
  seX11M: M((c) => x11(c, true), ft(24.93), true),
  seX11T: M((c) => x11(c, false), ft(24.93), true),
};

// Unit numbers (jarnvag.net's fleet lists; for Värmlandstrafik and
// X-Tåget the units seen in photographs). Neither of Sweden's feeds names
// a unit today (scripts/railroads/sweden.py), so these only list what each
// railroad runs; a feed that some day reports units would match them.
const REGINA = (from, to = from) => [from, to, "seReginaA"];
export const FLEETS = {
  slpendel: [[6001, 6083, "seX60Cab"], [6084, 6129, "seX60bCab"]],
  ostgotapendeln: [[61201, 61216, "seX61Cab"], [61301, 61302, "seX61Cab"]],
  norrtag: [[62001, 62012, "seX62Cab"], REGINA(9032, 9062), [3189, 3189, "seX11M"]],
  malartag: [[1, 53, "seEr1Cab"], REGINA(9001, 9004), REGINA(9064, 9066)],
  tib: [[54, 60, "seEr1Cab"], REGINA(9005, 9029), REGINA(9037, 9039), REGINA(9056, 9057), REGINA(9068)],
  varmlandstag: [REGINA(9049), [1413, 1421, "seY31"]],
  xtaget: [REGINA(9010), REGINA(9046), REGINA(9061)],
};

const set = (label, ...units) => ({ label, units });
const X60_SET = set("Six-car X60 or X60B (Alstom Coradia Nordic); at rush hour often two, 12 cars", ["seX60Cab", 1], ["seX60M", 1], ["seX60M2", 1], ["seX60M3", 1], ["seX60M", 1], ["seX60Cab", 1]);
const X60B_SET = set("Six-car X60B (Alstom Coradia Nordic)", ["seX60bCab", 1], ["seX60M", 1], ["seX60M2", 1], ["seX60M3", 1], ["seX60M", 1], ["seX60bCab", 1]);
const X61_SET = set("Four-car X61 (Alstom Coradia Nordic), at busy times two", ["seX61Cab", 1], ["seX61M1", 1], ["seX61M2", 1], ["seX61Cab", 1]);
const X62_SET = set("Four-car X62 (Alstom Coradia Nordic)", ["seX62Cab", 1], ["seX62M1", 1], ["seX62M2", 1], ["seX62Cab", 1]);
const ER1_SET = set("Four-car ER1 (Stadler DOSTO) double-decker, at busy times two", ["seEr1Cab", 1], ["seEr1Mid", 2], ["seEr1Cab", 1]);
const REGINA_SET = set("Two-car Regina, at busy times two coupled", ["seReginaA", 1], ["seReginaB", 1]);
const REGINA_X = set("Regina, two or three cars", ["seReginaA", 1], ["seReginaB", 1]);
const Y31_SET = set("Two-car Itino (Y31) diesel", ["seY31", 2]);
const X11_SET = set("Two-car X11", ["seX11M", 1], ["seX11T", 1]);
const BY_TYPE = {
  seX60Cab: X60_SET, seX60M: X60_SET, seX60M2: X60_SET, seX60M3: X60_SET, seX60bCab: X60B_SET,
  seX61Cab: X61_SET, seX61M1: X61_SET, seX61M2: X61_SET, seX62Cab: X62_SET, seX62M1: X62_SET, seX62M2: X62_SET,
  seEr1Cab: ER1_SET, seEr1Mid: ER1_SET, seReginaA: REGINA_SET, seReginaB: REGINA_SET, seReginaM: REGINA_SET,
  seY31: Y31_SET, seX11M: X11_SET, seX11T: X11_SET,
};
// Which line runs what. Every railroad here is one route name in the
// timetable (sweden.py: "Mälartåg", "Norrtåg", "Tåg i Bergslagen"...), so
// the line is told by the advertised train number, as GTFS Sweden 3 numbers
// them (the timetable of 2026-10-18; a leading 1, 2, 3 or 5 on a five-digit
// number marks an extra run of the four-digit one), and by the destination
// when there is no number. The fleets per line, from the operators' and
// Transitio's fleet pages and jarnvag.net:
//   Mälartåg: ER1s everywhere but the Uven trains (Uppsala-Sala-Västerås-
//     Eskilstuna-Linköping, 2100-2199) and Uppsala-Sala-Västerås-Eskilstuna
//     (8500-8599), which are its nine Reginas' work.
//   Tåg i Bergslagen: Västerås-Ludvika and Västerås-Fagersta (8000-8099)
//     its seven ER1s; Gävle-Örebro-Hallsberg-Mjölby, Mora-Borlänge-Sala and
//     Örebro-Hallsberg-Laxå (8100-8249) Reginas.
//   Norrtåg: Umeå-Sundsvall (7401-7459) and Sundsvall-Östersund-Storlien
//     (7499-7559) X62s; Umeå-Vindeln-Hällnäs (7460-7498) X11s; Umeå-Luleå,
//     Luleå-Kiruna and Luleå-Haparanda (7101-7199) Reginas.
//   Värmlandstrafik: Charlottenberg-Karlstad-Kristinehamn (8900-8949)
//     Reginas; Karlstad-Torsby on the unelectrified Fryksdal Line
//     (8951-8999) Itinos.
//   SL: X60s on every line; Östgötapendeln X61s; X-Tåget Reginas.
const num = (t) => {
  const n = parseInt(String(t.number || "").replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? (n >= 10000 ? n % 10000 : n) : null;
};
const text = (t) => `${t.route || ""} ${t.destination || ""} ${t.origin || ""}`;
const within = (n, a, b) => n != null && n >= a && n <= b;
export const TYPICAL = {
  slpendel: (t, reported) => BY_TYPE[reported] || X60_SET,
  ostgotapendeln: (t, reported) => BY_TYPE[reported] || X61_SET,
  malartag: (t, reported) => {
    const n = num(t);
    if (BY_TYPE[reported]) return BY_TYPE[reported];
    if (n != null) return within(n, 2100, 2199) || within(n, 8500, 8599) ? REGINA_SET : ER1_SET;
    return /Linköping.*Sala|Sala.*Linköping/.test(text(t)) ? REGINA_SET : ER1_SET;
  },
  tib: (t, reported) => {
    const n = num(t);
    if (BY_TYPE[reported]) return BY_TYPE[reported];
    if (n != null) return within(n, 8000, 8099) ? ER1_SET : REGINA_SET;
    return /Ludvika|Fagersta/.test(text(t)) ? ER1_SET : REGINA_SET;
  },
  norrtag: (t, reported) => {
    const n = num(t);
    if (BY_TYPE[reported]) return BY_TYPE[reported];
    if (within(n, 7460, 7498)) return X11_SET;
    if (within(n, 7401, 7459) || within(n, 7499, 7599)) return X62_SET;
    if (n != null) return REGINA_SET;
    return /Hällnäs|Vindeln/.test(text(t)) ? X11_SET : /Östersund|Storlien|Duved|Åre|Bräcke|Ånge|Sundsvall/.test(text(t)) ? X62_SET : REGINA_SET;
  },
  varmlandstag: (t, reported) => {
    const n = num(t);
    if (BY_TYPE[reported]) return BY_TYPE[reported];
    if (n != null && within(n, 8900, 8999)) return n >= 8950 ? Y31_SET : REGINA_SET;
    return /Torsby|Sunne/.test(text(t)) ? Y31_SET : REGINA_SET;
  },
  xtaget: (t, reported) => BY_TYPE[reported] || REGINA_X,
};

// Fact sheets in mph, hp and ft, from the published km/h, kW and m.
const WIKI = "https://en.wikipedia.org/wiki/";
const JV = "https://www.jarnvag.net/vagnguide/";
export const FACTS = {
  seX60Cab: { model: "Alstom Coradia Nordic (X60)", type: "Electric multiple unit", builder: "Alstom, Salzgitter", built: "2005–2012",
    fleet: "83 six-car units (71 X60 and 12 X60A), 6001–6083", topSpeedMph: 99.4, powerHp: 4023, seats: 374, lengthFt: 351.0,
    about: "Stockholm's commuter train since 2005: six articulated cars, a low floor level with the platforms and twelve double doors a side. SL is refurbishing the first 83 to keep them running until about 2037.",
    source: WIKI + "SL_X60" },
  seX60bCab: { model: "Alstom Coradia Nordic (X60B)", type: "Electric multiple unit", builder: "Alstom, Salzgitter", built: "2015–2017",
    fleet: "46 six-car units, 6084–6129", topSpeedMph: 99.4, powerHp: 4023, seats: 356, lengthFt: 351.0,
    about: "The second series of SL's X60, bought for Citybanan and to retire the last X10s, with new doors and seats, a redesigned cab and three headlights over the windshield. It can't run coupled to the older X60s.",
    source: JV + "x60" },
  seX61Cab: { model: "Alstom Coradia Nordic (X61)", type: "Electric multiple unit", builder: "Alstom, Salzgitter", built: "2010–2019",
    fleet: "18 four-car units, 61201–61216 and 61301–61302", topSpeedMph: 99.4, powerHp: 2682, seats: 234, lengthFt: 243.8,
    about: "The four-car Coradia Nordic, built in the same family as SL's X60. Östgötatrafiken owns its trains and runs them on Östgötapendeln between Norrköping, Linköping, Mjölby, Motala and Tranås.",
    source: JV + "x61" },
  seX62Cab: { model: "Alstom Coradia Nordic (X62)", type: "Electric multiple unit", builder: "Alstom, Salzgitter", built: "2011–2012",
    fleet: "12 four-car units, 62001–62012", topSpeedMph: 111.8, powerHp: 2682, seats: 194, lengthFt: 243.8,
    about: "Norrtåg's main train, owned by Transitio: a four-car Coradia Nordic for 180 km/h, on the coast line between Umeå and Sundsvall and across Mittbanan to Östersund and Storlien.",
    source: JV + "x62" },
  seEr1Cab: { model: "Stadler DOSTO (ER1)", type: "Double-deck electric multiple unit", builder: "Stadler Rail", built: "2019–2023",
    fleet: "60 four-car units: 001–053 Mälartåg (the eight Upptåget units among them), 054–060 Tåg i Bergslagen", topSpeedMph: 124.3, powerHp: 6035, seats: 333, lengthFt: 343.9,
    about: "A four-car double-decker built for Swedish winters (minus 40 degrees, 80 cm of snow), owned by Transitio. It runs most of Mälartåg's trains around Lake Mälaren and Tåg i Bergslagen's Ludvika–Västerås line; 13 more are due in 2028–29.",
    source: "https://stadlerrail.com/api/docs/x/5408827293/kiss_ab-transitio_en.pdf" },
  seReginaA: { model: "Bombardier Regina", type: "Electric multiple unit", builder: "Bombardier, Kalmar", built: "2000–2011",
    fleet: "63 owned by Transitio, as X50–X54", topSpeedMph: 124.3, powerHp: 2132, seats: 170, lengthFt: 176.8,
    about: "Sweden's widest train, 3.45 m, with five seats abreast. Regional authorities run it across the country: Tåg i Bergslagen's lines from Gävle, Mora and Örebro, Norrtåg's north of Umeå, X-Tåget's from Gävle to Ljusdal and Sundsvall, Värmlandstrafik's Karlstad trains and a few of Mälartåg's.",
    source: WIKI + "Bombardier_Regina" },
  seY31: { model: "Bombardier Itino (Y31)", type: "Diesel multiple unit", builder: "Bombardier", built: "2002–2010",
    fleet: "24 Y31; Värmlandstrafik runs five", topSpeedMph: 87, powerHp: 1287, seats: 86, lengthFt: 126.0,
    about: "A two-car diesel unit with a low floor at its doors. Värmlandstrafik runs it on the unelectrified Fryksdal Line between Karlstad, Sunne and Torsby.",
    source: JV + "y31" },
  seX11M: { model: "ASEA X11", type: "Electric multiple unit", builder: "ASEA (rebuilt from X10)", built: "1983–1995",
    fleet: "Norrtåg leases three from Transitio", topSpeedMph: 87, powerHp: 1716, lengthFt: 163.6,
    about: "A regional version of Stockholm's old X10 commuter unit, its middle doors sealed. Norrtåg runs it between Umeå, Vännäs and Hällnäs.",
    source: JV + "x11" },
};
// Each unit's other cars share its sheet, named for the part they are.
const part = (facts, name) => ({ ...facts, model: `${facts.model}, ${name}` });
for (const [k, of, name] of [["seX60M", "seX60Cab", "middle car"], ["seX60M2", "seX60Cab", "middle car"], ["seX60M3", "seX60Cab", "middle car"],
  ["seX61M1", "seX61Cab", "middle car"], ["seX61M2", "seX61Cab", "middle car"], ["seX62M1", "seX62Cab", "middle car"], ["seX62M2", "seX62Cab", "middle car"],
  ["seEr1Mid", "seEr1Cab", "middle car"], ["seReginaB", "seReginaA", "B car"], ["seReginaM", "seReginaA", "middle car"], ["seX11T", "seX11M", "trailer car"]]) FACTS[k] = part(FACTS[of], name);
