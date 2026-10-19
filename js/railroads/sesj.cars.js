// Sweden's long-distance trains (SJ, Snälltåget, Vy Tåg, Tågab and Arlanda
// Express, scripts/railroads/sweden.py): Trainsheet's own side views from
// each model's published dimensions, chiefly järnväg.net's vehicle guide
// (www.jarnvag.net/vagnguide, /lokguide) and Swedish Wikipedia, checked
// against photographs on Wikimedia Commons. Heights the sources don't give
// are scaled from those photographs and say so.
//
// What runs in October 2026: SJ's tilting X2000s (most now refurbished as
// X2C, with dark gray fronts and doors), its SJ 3000s (X55, Bombardier
// Regina) north and west of Stockholm, X40 double-deckers on the regional
// and InterCity lines, and Rc6 locomotives with 1980s coaches on the other
// InterCity and the night trains: SJ's own in black, and since December
// 2024 the Trafikverket-owned night trains to Luleå and Narvik in their gray
// and red. Snälltåget runs red Vectrons with white coaches, Tågab Rc3s with
// stainless coaches, Vy Tåg Värmlandstrafik's yellow Reginas on Oslo–
// Karlstad–Stockholm (and Vy's own FLIRTs on Oslo–Göteborg–Malmö), Arlanda
// Express its seven X3s. SJ's Zefiro Express (X250, first trains planned for
// December 2027) and CAF X45s (autumn 2027) are not in service yet, and
// FlixTrain left Sweden in January 2024, so none of them is drawn.

import { bilevel, cabUnit } from "../carmodels.js?v=dev";
import { rect, circle, path, line, lines, poly, slats, win, truck, pantograph, C } from "../carart.js?v=dev";
import { bothEnds, flirt, letters, hvac, roofCover, panGear, horns, lamp, RED_LAMP, wiper, buffers, boxes, frames } from "./digitraffic.cars.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
const M2FT = 3.28084;
const ft = (m) => Math.round(m * M2FT * 100) / 100;

// Horizontal ribs of corrugated or fluted steel between y0 and y1.
function ribs(x0, x1, y0, y1, gap = 0.3, color = "rgba(0,0,0,0.16)", px = 0.5) {
  const segs = [];
  for (let y = y0 + gap / 2; y < y1; y += gap) segs.push([x0, y, x1, y]);
  return lines(segs, color, px);
}
// An outline-only rectangle (a door's painted frame, a panel seam).
const frameLine = (x, y, w, h, color, px = 0.8, r = 0.2) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="${color}" stroke-width="${px}" vector-effect="non-scaling-stroke"/>`;

// ===================== SJ X2000 (X2) =====================

// SJ's colors on the refurbished X2C: unpainted fluted stainless sides, the
// smooth window band, the dark anthracite front and doors, SJ's green on
// the doors (the seat numbers), and SJ's name in dark gray type.
const X2C = { steel: "#c9cdd2", band: "#bdc2c8", silver: "#b8bdc3", roof: "#a3a9b0", dark: "#3a3e44", door: "#464a50", green: "#3fae4a",
  ink: "#2c3038", skirt: "#33373c", chin: "#b3b8be" };

// --- ABB X2 (X2000), 1989-98: a power car (X2) at one end, five trailers and
// a driving trailer (UB2X) at the other, the trailers' bodies tilting up to
// 6.5 degrees on radial ("soft") bogies. Refurbished from 2021 (X2C, 36
// sets): X2 + UA2 (first class) + UB2 + URB2 (bistro) + UB2 + UB2 + UB2X.
// From järnväg.net: 17.397 m (X2), 24.95 m (the trailers), 22.447 m (UB2X),
// 164.7 m the set; 3.814 m to the roof (Swedish Wikipedia), 3.08 m wide;
// trailer bogies 17.7 m apart (UB2X 14.25 m), 2.9 m wheelbase, 880 mm
// wheels. The power car's bogies (1100 mm wheels) about 11 m apart and the
// sill heights are scaled from photographs. Each trailer has one plug door
// a side, at one end, so the doors of two cars meet at every other joint;
// the windows are short and wide in a smooth band between fluted panels.
const X2_ROOF = 12.51, X2_SILL = 3.2;
const X2_NOSE = [[5.6, X2_SILL], [5.0, 2.0], [1.0, 1.9], ["q", 0.1, 2.2, 0.1, 3.3], ["q", 0.3, 5.6, 2.6, 7.4], [8.0, 10.6], ["q", 10.8, X2_ROOF, 14.5, X2_ROOF]];
// The front, at the left: the windshield wrapping round onto the side, a
// small cab side window, headlights low on the nose, and the light gray
// chin spoiler under it.
const x2Cab = () =>
  path(poly([[3.4, 7.95], [7.5, 10.4], [9.7, 10.4], [9.7, 8.35]]), C.glass) + path(poly([[3.9, 8.2], [5.9, 9.4], [6.6, 9.4], [4.7, 8.2]]), C.glassLight) +
  wiper(4.4, 8.3, 6.6, 9.9) + win(11.0, 8.35, 2.1, 1.95, 0.35) +
  lamp(0.45, 4.05, 0.65, 0.45) + lamp(0.75, 4.85, 0.4, 0.3, RED_LAMP) + lamp(6.4, 9.1, 0.5, 0.25) +
  path(poly([[0.95, 1.9], [5.0, 2.0], [4.7, 0.55], [1.7, 0.45], ["q", 0.6, 0.6, 0.75, 1.3]]), X2C.chin, 0.4) +
  line(1.2, 1.25, 4.6, 1.3, "rgba(0,0,0,0.25)", 0.5);
// The dark front: everything ahead of a line rising from the foot of the
// nose to the roof behind the cab, the silver below it.
const x2Front = (top = 14.4) => path(poly([[-3, -1], [3.4, -1], [5.2, X2_SILL], [top + 1.0, 13.6], [-3, 13.6]]), X2C.dark);
// The trailers' paint: fluted below and above the windows, a smooth band
// between, the roof's gray, a dark line along the sill.
function x2Sides(L) {
  return rect(0, 0, L, 17, X2C.steel) + rect(0, 6.55, L, 3.1, X2C.band) + ribs(0, L, 3.4, 6.5, 0.28, "rgba(0,0,0,0.13)") + ribs(0, L, 9.7, 10.75, 0.28, "rgba(0,0,0,0.13)") +
    rect(0, 10.9, L, 3, X2C.roof) + line(0, 10.9, L, 10.9, "rgba(0,0,0,0.2)", 0.5) + rect(0, 0, L, X2_SILL + 0.25, X2C.skirt);
}
// A door's green seat-number patch (the door itself drawn dark), and SJ by it.
const x2DoorPatch = (x, w) => path(`M${x + 0.1} 4.55L${x + w - 1.25} 4.55Q${x + w - 0.1} 4.55 ${x + w - 0.1} 5.85Q${x + w - 0.1} 7.15 ${x + w - 1.25} 7.15L${x + 0.1} 7.15Z`, X2C.green) +
  rect(x + 0.5, 5.75, w - 1.4, 0.14, "rgba(255,255,255,0.85)");
const x2Door = (x) => ({ x, w: 2.95, y0: 3.45, y1: 10.5, glassY: 0.63, glassH: 0.24, grabs: false, fill: X2C.door });
const X2T = { roof: X2_ROOF, sill: X2_SILL, cornerR: 1.0, end: 0.5, trucks: { centers: ft(17.7), wb: ft(2.9), d: 34.6 }, diaphragm: [3.6, 11.3], badge: false };
// Underfloor: the tilt and brake equipment and the air reservoirs between
// the bogies, behind a shallow skirt.
const x2Under = (L, a = 21, b = L - 21) => boxes(a, b, X2_SILL, 4, 0.85) + rect(a - 1, X2_SILL - 0.45, b - a + 2, 0.45, "#3a3e44");
// A trailer: its door at the left end (pair 1) or the right (pair 0), so two
// cars' doors meet at every other joint; rows of windows: { xs, w } measured
// from the door end.
function x2Trailer(c, { xs, w, h = 2.45, logo = true, extra = null }) {
  const L = c.L, right = c.pair !== 1;
  const X = (x, wd = 0) => (right ? L - x - wd : x);
  const dx = X(1.4, 2.95);
  return bilevel({ ...c, cabL: false, cabR: false }, { ...X2T,
    paint: (c, g) => x2Sides(L) + rect(X(0.5, 5.2), X2_SILL, 5.2, 7.5, X2C.steel) + frames(xs.map((x) => X(x, w)), 7.05, w, h, 0.16, "#2a2d31"),
    rows: [{ xs: xs.map((x) => X(x, w)), y: 7.05, w, h, r: 0.7 }],
    doors: [x2Door(dx)],
    extra: (c, g) => x2Under(L) + hvac(X(5.5, 13), X2_ROOF, 13, 0.7, "#a9afb6") + x2DoorPatch(dx, 2.95) +
      (logo ? letters(c, X(7.2), 8.25, 1.35, "SJ", X2C.ink, { weight: 800, spacing: -0.02 }) : "") + (extra ? extra(c, g, X) : ""),
  });
}
const ua2 = (c) => x2Trailer(c, { xs: seq(11.2, 6.6, 10), w: 4.6 });
const ub2 = (c) => x2Trailer(c, { xs: seq(10.8, 5.45, 12), w: 4.0 });
// The bistro car: seats at the door end, then the counter, standing room
// and fewer, wider windows.
const urb2 = (c) => x2Trailer(c, { xs: [...seq(10.8, 5.45, 7), ...seq(50.0, 7.6, 4)], w: 4.0,
  extra: (c, g, X) => letters(c, X(68.0), 10.15, 0.55, "Bistro", X2C.ink, { weight: 600 }) });

// --- X2 power car: 17.4 m, Bo'Bo', 3260 kW; a long sloping nose, the cab
// door behind it, the machine room's fluted sides under a row of dark
// louvered intakes along the roof, the pantograph on the roof over the
// inner bogie. X2C: the front dark anthracite down to a line that rises from
// the foot of the nose to the roof behind the cab, smooth silver below it,
// SJ big and dark on the flutes.
const x2Power = (c) => {
  const L = c.L;
  return bilevel(c, { ...X2T, trucks: { centers: ft(11.0), wb: ft(2.9), d: 43.3, kind: "loco" }, diaphragm: [3.6, 11.3],
    nose: X2_NOSE, cabLen: 14,
    paint: (c, g) => {
      let s = rect(0, 0, L, 17, X2C.silver) + rect(17.5, 3.6, L - 19.0, 7.15, X2C.steel) + ribs(17.5, L - 1.5, 3.7, 10.7, 0.27, "rgba(0,0,0,0.14)") +
        rect(0, 0, L, X2_SILL + 0.3, X2C.skirt) + rect(0, 11.05, L, 3, X2C.roof);
      if (c.cabL) s += x2Front();
      return s + letters(c, (17.5 + L) / 2 + 0.5, 7.1, 3.7, "SJ", X2C.ink, { weight: 800, spacing: -0.1 });
    },
    doors: [{ x: 14.2, w: 2.6, y0: 3.6, y1: 10.6, glassY: 0.7, glassH: 0.18, grabs: false }],
    extra: (c, g) => {
      // The intakes along the roof, in four louvered panels.
      let s = "";
      for (const x of seq(17.8, (L - 20.0) / 4, 4)) s += rect(x, 10.95, (L - 20.0) / 4 - 0.4, 1.25, "#24272b", 0.4, 'rx="0.12"') + slats(x + 0.1, 11.05, (L - 20.0) / 4 - 0.6, 1.05, 0.35, "rgba(255,255,255,0.15)");
      s += boxes(16.5, 40.5, X2_SILL, 3, 1.15) + rect(15.5, X2_SILL - 0.4, 26.0, 0.4, "#3a3e44");
      s += pantograph(L - 13.5, X2_ROOF, { facing: -1 }) + panGear(L - 13.5, X2_ROOF, -1) + roofCover(19.0, X2_ROOF, 14, 0.45) + horns(14.6, X2_ROOF - 0.02);
      return s;
    },
    cab: x2Cab,
  });
};

// --- UB2X driving trailer: 22.4 m, the power car's nose and cab at its
// outer end, second class and the wheelchair place behind, its door at the
// inner end. The same dark front, SJ on the smooth panel behind the cab.
const ub2x = (c) => {
  const L = c.L, xs = seq(22.6, 5.45, 8), w = 4.0;
  return bilevel(c, { ...X2T, trucks: { centers: ft(14.25), wb: ft(2.9), d: 34.6 }, nose: X2_NOSE, cabLen: 14,
    paint: (c, g) => x2Sides(L) + rect(0, 3.45, 21.0, 7.4, X2C.silver) + (c.cabL ? x2Front(14.0) : "") + frames(xs, 7.05, w, 2.45, 0.16, "#2a2d31"),
    rows: [{ xs, w, y: 7.05, h: 2.45, r: 0.7 }],
    doors: [x2Door(L - 4.4)],
    extra: (c, g) => x2Under(L, 17, L - 17) + hvac(L - 18.5, X2_ROOF, 13, 0.7, "#a9afb6") + x2DoorPatch(L - 4.4, 2.95) +
      letters(c, 18.0, 8.25, 1.35, "SJ", X2C.ink, { weight: 800 }) + horns(14.2, X2_ROOF - 0.02),
    cab: x2Cab,
  });
};

// ===================== Rc locomotives =====================

// --- Asea Rc6 (100: 1383-1422 new 1985-88, 1323-1382 converted from Rc5,
// 1992-95) and Rc3 (Tågab): 15.52 m over the buffers, 3.15 m wide, bogies
// 7.7 m apart with a 2.7 m wheelbase and 1300 mm wheels (Swedish
// Wikipedia's table; järnväg.net); about 3.9 m to the roof, scaled from
// photographs. A flat cab front with two big windows, the cab's sliding
// side window behind it, the machine room's corrugated sides with two
// portholes each side of the middle door, a row of air intakes along the
// roof, a single-arm pantograph over each cab (the rear one raised), side
// buffers and a screw coupler, a snow plow. SJ's Rc6s are black since 2006,
// SJ in white, yellow grab rails, red plows; Trafikverket's 14 (leased to SJ
// for the night trains) gray with red cab ends; Tågab's Rc3s black.
const RC = { roof: 12.9, sill: 4.0 };
const RC_LIVERY = {
  sj: { body: "#26282c", rib: "rgba(255,255,255,0.07)", end: "#26282c", skirt: "#1c1d20", roof: "#3a3d42", mark: (h, x, y, s) => letters(h, x, y, s, "SJ", "#ffffff", { weight: 800 }) },
  trv: { body: "#b9bec4", rib: "rgba(0,0,0,0.13)", end: "#c8232c", skirt: "#4a4f56", roof: "#8d939a", mark: (h, x, y, s) => letters(h, x, y, s * 0.42, "TRAFIKVERKET", "#2a2d31", { weight: 700 }) },
  tagab: { body: "#222428", rib: "rgba(255,255,255,0.07)", end: "#222428", skirt: "#1a1b1e", roof: "#3a3d42", mark: (h, x, y, s) => letters(h, x, y, s * 0.4, "TÅGAB", "#e9ebed", { weight: 700, spacing: 0.1 }) },
};
const rcLoco = (which) => (c) => bothEnds(c, (h) => {
  const L = h.L, { roof, sill } = RC, k = RC_LIVERY[which];
  return cabUnit(h, {
    roof, sill, rearR: 1.0,
    nose: [[1.95, sill], [1.85, 8.3], [2.25, 11.7], ["q", 2.4, roof, 3.5, roof]],
    base: k.body, trucks: { centers: ft(7.7), wb: ft(2.7), d: 51.2 },
    paint: () => {
      let s = ribs(8.6, L / 2, 4.7, 10.3, 0.3, k.rib) + rect(0, roof - 0.6, L, 1, k.roof) + rect(0, sill, L, 0.5, k.skirt);
      if (which === "trv") s += path(poly([[0, 0], [8.4, 0], [8.4, 13.5], [0, 13.5]]), k.end) + rect(8.4, 0, 0.18, 13.5, "#ffffff");
      // Yellow grab rail up the cab corner, the SJ-style marks.
      s += lines([[2.25, 7.4, 2.25, 10.0], [2.25, 10.0, 3.6, 10.0]], "#e5b520", 0.9);
      if (h.half === 0) s += k.mark(h, L / 2 + 6.5, 9.6, 1.3);
      return s + k.mark(h, 6.6, 6.6, which === "sj" ? 1.15 : 1.4);
    },
    glass: [[[1.95, 8.6], [2.25, 11.35], [2.75, 11.35], [2.45, 8.6]]],
    sideWin: [[3.6, 8.7, 4.1, 2.55]],
    grilles: [[9.0, 10.65, L / 2 - 9.2, 1.45, 0.32]],
    extra: () => {
      let s = "";
      // Portholes either side of the middle door, which is on this half.
      for (const x of [11.6, 18.6]) s += circle(x, 9.0, 0.82, C.glass, 0, `stroke="#111" stroke-width="0.8" vector-effect="non-scaling-stroke"`) + circle(x - 0.2, 9.25, 0.35, C.glassLight);
      if (h.half === 0) s += rect(L / 2 - 4.6, sill + 0.4, 2.3, 7.0, "rgba(0,0,0,0.12)", 0.5, 'rx="0.12"') + lines([[L / 2 - 4.9, 5.4, L / 2 - 4.9, 10.6], [L / 2 - 2.0, 5.4, L / 2 - 2.0, 10.6]], "#e5b520", 0.9) +
        rect(L / 2 - 4.4, sill - 0.9, 1.9, 0.25, "#e5b520") + rect(L / 2 - 4.4, sill - 0.45, 1.9, 0.25, "#e5b520");
      // Pantograph over the cab (the rear one raised), its breaker inboard.
      s += pantograph(8.2, roof, { up: h.half === 1, facing: -1 }) + panGear(8.2, roof, 1) + rect(15.5, roof - 0.05, 4.5, 0.5, C.steelDark, 0.4, 'rx="0.12"');
      // Headlights, the red marker, the front window's wiper and sunshade.
      s += lamp(1.65, 6.3, 0.35, 0.6) + lamp(2.0, 12.25, 0.4, 0.3) + lamp(1.7, 7.1, 0.25, 0.25, RED_LAMP) + wiper(2.0, 8.8, 2.3, 10.9);
      // Snow plow (red on SJ's), side buffers, the step under the cab.
      s += path(poly([[1.9, 2.75], [5.2, 2.75], [5.0, 1.4], [4.2, 0.45], [1.5, 0.45], [1.1, 1.1]]), "#b42027", 0.4) + buffers(0, -1, { y: 3.4, reach: 2.0 }) +
        rect(5.0, 1.7, 1.4, 0.18, "#e5b520") + rect(5.0, 2.6, 1.4, 0.18, "#e5b520");
      return s;
    },
  });
});
const rc6 = rcLoco("sj"), rc6Trv = rcLoco("trv"), rc3Tagab = rcLoco("tagab");

// ===================== SJ's 1980s coaches =====================

// --- Kalmar Verkstad's and Kockums' coaches of the 1980s (the "type 7"
// family: A7, B7, BF7, RB7, BC4, WL4, WL6 and their rebuilds, 1979-94): 26.4
// m over the buffers, 3.08 m wide, about 4.0 m to the roof (scaled from
// photographs), MD-type bogies 19 m apart; corrugated steel sides with a
// smooth window band, hinged plug doors at the ends (the sleeping and
// couchette cars only at one end, toilets and washrooms at the other), the
// air-conditioning unit on the roof over one end, side buffers and screw
// couplers. SJ's paint since 2006 is black: dark roof, the doors framed in
// white, SJ in white by them. Trafikverket's night-train cars (leased to SJ
// since December 2024) are light gray over a darker gray corrugated band
// with red doors.
const CO = { roof: 13.15, sill: 3.55, cornerR: 1.2, end: 0.5, trucks: { centers: ft(19.0), wb: ft(2.5), d: 34.6 }, diaphragm: [4.0, 11.7], badge: false };
const COACH_PAINT = {
  sj: { body: "#2a2c30", low: "#2a2c30", rib: "rgba(255,255,255,0.06)", roof: "#3c3f44", door: "#2a2c30", doorLine: "#eceef0", ink: "#ffffff" },
  trv: { body: "#c6cacf", low: "#8f949b", rib: "rgba(0,0,0,0.13)", roof: "#9aa0a7", door: "#cf2229", doorLine: null, ink: "#e9ebed" },
};
// A coach of the family. doors: x positions (2.6 ft wide), wide: a luggage
// double door { x, w }; rows: window rows; label: lettering on the lower
// side (Trafikverket's names the car's use).
function coach7(c, { paint = "sj", doors, rows, wide = null, label = null, small = [], extra = null }) {
  const L = c.L, k = COACH_PAINT[paint];
  const doorList = doors.map((x) => ({ x, w: 2.6, y0: 3.9, y1: 10.9, glassY: 0.58, glassH: 0.3, grabs: true, fill: "rgba(0,0,0,0.05)" }));
  if (wide) doorList.push({ x: wide.x, w: wide.w, y0: 3.9, y1: 10.6, leaves: 2, glassY: 0.62, glassH: 0.2, grabs: false, fill: "rgba(0,0,0,0.05)" });
  return bilevel(c, { ...CO,
    paint: (c, g) => {
      let s = rect(0, 0, L, 17, k.body) + rect(0, 0, L, 6.6, k.low) + ribs(0, L, 3.7, 6.6, 0.3, k.rib) + ribs(0, L, 10.4, 12.1, 0.3, k.rib) +
        rect(0, 12.15, L, 2, k.roof) + line(0, 12.15, L, 12.15, "rgba(0,0,0,0.25)", 0.5) + rect(0, 0, L, CO.sill + 0.3, "#202225");
      if (paint === "trv") s += rect(0, 10.35, L, 0.22, "#eef0f2") + rect(0, 6.6, L, 0.14, "#6f757c");
      for (const d of [...doors.map((x) => ({ x, w: 2.6 })), ...(wide ? [wide] : [])]) s += rect(d.x - 0.35, CO.sill, d.w + 0.7, 7.75, k.door);
      for (const r of rows) s += frames(r.xs, r.y, r.w, r.h, 0.16, "#141518");
      return s;
    },
    rows: [...rows, ...small.map(([x, w]) => ({ xs: [x], y: 8.6, w, h: 1.4, r: 0.25 }))],
    doors: doorList,
    extra: (c, g) => {
      let s = hvac(L - 13.5, CO.roof, 10.5, 0.7, paint === "sj" ? "#4a4e54" : "#a7aeb6") + boxes(19.0, L - 19.0, CO.sill, 3, 0.95, "#2f3338") +
        rect(30.0, 1.7, 10.0, 0.9, "#2a2d31", 0.4, 'rx="0.4"') + buffers(0, -1, { y: 3.45 }) + buffers(L, 1, { y: 3.45 });
      // The doors' white frames (SJ) and SJ beside them.
      if (k.doorLine) for (const x of doors) s += frameLine(x - 0.1, 4.0, 2.8, 6.8, k.doorLine, 0.9, 0.3);
      const first = doors[0] ?? (wide ? wide.x : 2);
      s += letters(c, first + 1.3, 5.1, 0.85, "SJ", paint === "sj" ? "#ffffff" : "#ffffff", { weight: 800 });
      if (label) s += letters(c, L / 2, 4.75, 1.1, label, k.ink, { weight: 600, family: "Georgia, serif" });
      return s + (extra ? extra(c, g) : "");
    },
  });
}
const W7 = (xs, w = 4.0, h = 2.8) => ({ xs, y: 7.15, w, h, r: 0.45 });
// B7: second class, 78 seats (2+2), a door at each end, eleven windows.
const b7 = (paint) => (c) => coach7(c, { paint, doors: [1.25, c.L - 3.85], rows: [W7(seq(10.6, 6.25, 11))], small: [[6.0, 1.6]] });
// A7: first class, 52 seats (2+1), ten wider windows.
const a7 = (c) => coach7(c, { doors: [1.25, c.L - 3.85], rows: [W7(seq(10.4, 6.9, 10), 4.6)], small: [[6.0, 1.6]] });
// BF7: second class with a luggage room at one end behind a double door.
const bf7 = (c) => coach7(c, { doors: [1.25, c.L - 3.85], wide: { x: c.L - 14.5, w: 5.0 }, rows: [W7(seq(10.6, 6.25, 8))], small: [[6.0, 1.6]] });
// RB7: the bistro car: seats, then the counter and the family area.
const rb7 = (c) => coach7(c, { doors: [1.25, c.L - 3.85], rows: [W7(seq(10.6, 6.25, 5)), W7(seq(44.0, 7.6, 4), 5.2)], small: [[6.0, 1.6]],
  extra: (c) => letters(c, 60.0, 5.1, 0.7, "Bistro", "#ffffff", { weight: 600 }) });
// BC4: couchettes, ten six-berth compartments, its door at one end, the
// toilets and washroom at the other (small frosted windows).
const bc4 = (paint) => (c) => coach7(c, { paint, doors: [1.25], rows: [W7(seq(10.0, 6.4, 10), 3.9, 2.6)], small: [[c.L - 6.6, 1.5], [c.L - 9.2, 1.5]],
  label: paint === "trv" ? "Liggvagn" : null });
// WL4: first-class sleeper, two-berth compartments each with its own
// shower and toilet; WL6: thirteen three-berth compartments, a shower at
// the end. Doors at one end only.
const wl4 = (paint) => (c) => coach7(c, { paint, doors: [1.25], rows: [W7(seq(10.0, 6.3, 11), 3.3, 2.5)], small: [[c.L - 6.6, 1.5]],
  label: paint === "trv" ? "Sovvagn" : null });
const wl6 = (paint) => (c) => coach7(c, { paint, doors: [1.25], rows: [W7(seq(9.6, 5.05, 13), 2.9, 2.5)], small: [[c.L - 6.4, 1.4]],
  label: paint === "trv" ? "Sovvagn" : null });
// B2 (1988-89): second class, 70 seats, Trafikverket's seats on the night
// trains: a door at each end, twelve windows.
const b2Trv = (c) => coach7(c, { paint: "trv", doors: [1.25, c.L - 3.85], rows: [W7(seq(10.2, 5.8, 12), 3.8)], small: [[6.0, 1.6]], label: "Sittvagn" });
// R12 (rebuilt 1968-69 cars, 24.1 m): the night trains' bistro, a door at
// each end, the kitchen's small windows, big windows over the tables.
const r12Trv = (c) => coach7(c, { paint: "trv", doors: [1.25, c.L - 3.85], rows: [W7(seq(20.0, 7.0, 7), 5.0)], small: [[6.2, 1.4], [10.0, 1.4], [13.6, 1.4]], label: "Bistro" });

// ===================== The registry =====================

export const TYPES = {
  seX2: { name: "X2 power car (X2000)", kind: "emu" },
  seUA2: { name: "X2000 first-class car (UA2)", kind: "emu" },
  seUB2: { name: "X2000 second-class car (UB2)", kind: "emu" },
  seURB2: { name: "X2000 bistro car (URB2)", kind: "emu", amenities: ["cafe"] },
  seUB2X: { name: "X2000 driving trailer (UB2X)", kind: "emu" },
  seRc6: { name: "Rc6 electric locomotive", kind: "electric", pan: true },
  seRc6Trv: { name: "Rc6 electric locomotive (Trafikverket)", kind: "electric", pan: true },
  seRc3: { name: "Rc3 electric locomotive", kind: "electric", pan: true },
  seA7: { name: "A7 first-class coach", kind: "coach" },
  seB7: { name: "B7 second-class coach", kind: "coach" },
  seBF7: { name: "BF7 coach with luggage room", kind: "coach" },
  seRB7: { name: "RB7 bistro car", kind: "coach", amenities: ["cafe"] },
  seBC4: { name: "BC4 couchette car", kind: "coach", amenities: ["sleepers"] },
  seWL4: { name: "WL4 sleeping car", kind: "coach", amenities: ["sleepers"] },
  seB2Trv: { name: "B2 second-class coach", kind: "coach" },
  seR12Trv: { name: "R12 bistro car", kind: "coach", amenities: ["cafe"] },
  seBC4Trv: { name: "BC4 couchette car", kind: "coach", amenities: ["sleepers"] },
  seWL4Trv: { name: "WL4 sleeping car", kind: "coach", amenities: ["sleepers"] },
  seWL6Trv: { name: "WL6 sleeping car", kind: "coach", amenities: ["sleepers"] },
};

const M = (draw, len, oneEnd = false) => ({ draw, len, oneEnd, variant: null });
const COACH = ft(26.4);
export const MODELS = {
  seX2: M(x2Power, ft(17.397), true),
  seUA2: M(ua2, ft(24.95)),
  seUB2: M(ub2, ft(24.95)),
  seURB2: M(urb2, ft(24.95)),
  seUB2X: M(ub2x, ft(22.447), true),
  seRc6: M(rc6, ft(15.52)),
  seRc6Trv: M(rc6Trv, ft(15.52)),
  seRc3: M(rc3Tagab, ft(15.52)),
  seA7: M(a7, COACH),
  seB7: M(b7("sj"), COACH),
  seBF7: M(bf7, COACH),
  seRB7: M(rb7, COACH),
  seBC4: M(bc4("sj"), COACH),
  seWL4: M(wl4("sj"), COACH),
  seB2Trv: M(b2Trv, COACH),
  seR12Trv: M(r12Trv, ft(24.1)),
  seBC4Trv: M(bc4("trv"), COACH),
  seWL4Trv: M(wl4("trv"), COACH),
  seWL6Trv: M(wl6("trv"), COACH),
};

// [first, last, type]: the fleet numbers as järnväg.net lists them.
export const FLEETS = {
  sj: [[2001, 2043, "seX2"], [2088, 2088, "seX2"], [2501, 2544, "seUB2X"], [2601, 2624, "seURB2"], [2701, 2754, "seUA2"], [2801, 2821, "seUA2"], [2822, 2882, "seUB2"],
    [1323, 1336, "seRc6Trv"], [1337, 1422, "seRc6"]],
};

const set = (label, ...units) => ({ label, units });
const X2_SET = set("X2000: power car, five cars and a driving trailer", ["seX2", 1], ["seUA2", 1], ["seUB2", 1], ["seURB2", 1], ["seUB2", 2], ["seUB2X", 1]);
const IC_SET = set("Rc6 locomotive with InterCity coaches, usually 5 to 7", ["seRc6", 1], ["seA7", 1], ["seB7", 2], ["seRB7", 1], ["seB7", 1], ["seBF7", 1]);
const NIGHT_NORTH = set("Rc6 locomotive with Trafikverket's night-train cars (seats, bistro, couchettes, sleepers), about 10 cars",
  ["seRc6Trv", 1], ["seB2Trv", 2], ["seR12Trv", 1], ["seBC4Trv", 2], ["seWL4Trv", 1], ["seWL6Trv", 3]);
const NIGHT_SJ = set("Rc6 locomotive with seats, couchettes and sleeping cars", ["seRc6", 1], ["seB7", 2], ["seRB7", 1], ["seBC4", 2], ["seWL4", 2]);
const BY_TYPE = { seX2: X2_SET, seUA2: X2_SET, seUB2: X2_SET, seURB2: X2_SET, seUB2X: X2_SET, seRc6: IC_SET, seA7: IC_SET, seB7: IC_SET, seBF7: IC_SET, seRB7: IC_SET,
  seRc6Trv: NIGHT_NORTH, seB2Trv: NIGHT_NORTH, seR12Trv: NIGHT_NORTH, seBC4Trv: NIGHT_NORTH, seWL4Trv: NIGHT_NORTH, seWL6Trv: NIGHT_NORTH, seBC4: NIGHT_SJ, seWL4: NIGHT_SJ };
const text = (t) => `${t.route || ""} ${t.product || ""} ${t.destination || ""} ${t.origin || ""}`;
const NORTH = /Luleå|Narvik|Kiruna|Boden|Abisko|Gällivare|Umeå|Riksgränsen/i;
export const TYPICAL = {
  sj: (t, reported) => {
    if (BY_TYPE[reported]) return BY_TYPE[reported];
    const s = text(t);
    if (/natt|night/i.test(s)) return NORTH.test(s) ? NIGHT_NORTH : NIGHT_SJ;
    if (/intercity|\bIC\b/i.test(s)) return IC_SET;
    return X2_SET;
  },
};

// Fact sheets in mph, hp and ft, from the published km/h, kW and m.
const JV = "https://www.jarnvag.net/";
export const FACTS = {
  seX2: { model: "ABB X2 (X2000)", type: "Tilting electric train, power car", builder: "ABB (later Adtranz), Kalmar and Västerås", built: "1989–1998",
    fleet: "43 power cars, 2001–2043 (and 2088, bought from China)", topSpeedMph: 124.3, powerHp: 4372, lengthFt: 540.5,
    about: "Sweden's tilting high-speed train, in service since 1990: a power car pushing or pulling five tilting cars and a driving trailer. It runs Stockholm–Göteborg, Stockholm–Malmö–Copenhagen and Göteborg–Malmö at up to 200 km/h, faster than other trains through curves. SJ is refurbishing 36 sets (X2C), with new electrics from ABB, more seats and dark gray fronts.",
    source: JV + "vagnguide/x2" },
  seRc6: { model: "Asea Rc6", type: "Electric locomotive", builder: "Asea", built: "1985–1988 (60 more converted from Rc5)", fleet: "100, 1323–1422",
    topSpeedMph: 99.4, powerHp: 4828, lengthFt: 50.9,
    about: "The last of Sweden's Rc family, geared for 160 km/h. SJ's, black since 2006, haul its InterCity and night trains; the 14 that Trafikverket owns, gray with red cab ends, haul the night trains to Luleå and Narvik.",
    source: JV + "lokguide/rc6" },
  seRc3: { model: "Asea Rc3", type: "Electric locomotive", builder: "Asea", built: "1970–1971 (more converted from Rc2)", topSpeedMph: 99.4, powerHp: 4828, lengthFt: 50.9,
    about: "An Rc geared for 160 km/h for passenger trains. Tågab hauls its own InterCity trains with them, Göteborg–Karlstad–Kristinehamn and Karlstad–Stockholm.",
    source: JV + "lokguide/rc3" },
  seB7: { model: "B7 coach", type: "Coach", builder: "Kalmar Verkstad", built: "1979–1990", fleet: "171 built", topSpeedMph: 99.4, seats: 78, lengthFt: 86.6,
    about: "The standard second-class coach of SJ's locomotive-hauled InterCity trains, 2+2 seats in an open saloon, a door at each end.",
    source: JV + "vagnguide/b7" },
  seA7: { model: "A7 coach", type: "Coach", builder: "Kalmar Verkstad", built: "1980–1987", fleet: "56 built", topSpeedMph: 99.4, seats: 52, lengthFt: 86.6,
    about: "First class on SJ's InterCity trains, 2+1 seats.", source: JV + "vagnguide/a7" },
  seBF7: { model: "BF7 coach", type: "Coach with luggage room", builder: "Kalmar Verkstad (rebuilt)", built: "1985–1986", fleet: "28", seats: 46, topSpeedMph: 99.4, lengthFt: 86.6,
    about: "A second-class coach with a room for luggage, bicycles and skis behind a double door.", source: JV + "vagnguide/bf7" },
  seRB7: { model: "RB7 bistro car", type: "Bistro car", builder: "Kalmar Verkstad (rebuilt)", fleet: "6", seats: 41, topSpeedMph: 99.4, lengthFt: 86.6,
    about: "The bistro and family car of SJ's InterCity trains.", source: JV + "vagnguide/rb7" },
  seBC4: { model: "BC4 couchette car", type: "Couchette car", builder: "Kalmar Verkstad", built: "1985–1986", fleet: "31 built: 11 SJ's, 20 Trafikverket's", topSpeedMph: 99.4, lengthFt: 86.6,
    about: "Six-berth compartments whose middle berths fold away by day. SJ's own are black; Trafikverket's, gray and red, run in the night trains to upper Norrland.",
    source: JV + "vagnguide/bc4" },
  seWL4: { model: "WL4 sleeping car", type: "Sleeping car", builder: "Kockums", built: "1990–1992", fleet: "27 built: 21 SJ's, 5 Trafikverket's", topSpeedMph: 99.4, lengthFt: 86.6,
    about: "Two-berth compartments, each with its own shower and toilet. SJ is refurbishing its cars from 2025.", source: JV + "vagnguide/wl4" },
  seWL6Trv: { model: "WL6 sleeping car", type: "Sleeping car", builder: "Kalmar Verkstad", built: "1993–1994", fleet: "23 built, 20 Trafikverket's", topSpeedMph: 99.4, lengthFt: 86.6,
    about: "Thirteen three-berth compartments and a shower at the end. Trafikverket leases its cars to SJ for the night trains Stockholm–Luleå–Narvik.",
    source: JV + "vagnguide/wl6" },
  seB2Trv: { model: "B2 coach", type: "Coach", built: "1988–1989", seats: 70, topSpeedMph: 99.4, lengthFt: 86.6,
    about: "A second-class coach that Trafikverket leases to SJ for the night trains to upper Norrland.", source: JV + "vagnguide/b2" },
  seR12Trv: { model: "R12 bistro car", type: "Bistro car", built: "1968–1969 (rebuilt)", seats: 39, topSpeedMph: 99.4, lengthFt: 79.1,
    about: "The bistro of the night trains to upper Norrland, owned by Trafikverket.", source: JV + "vagnguide/r12" },
};
const part = (facts, name) => ({ ...facts, model: `${facts.model}, ${name}` });
FACTS.seUA2 = part(FACTS.seX2, "first-class car (UA2)");
FACTS.seUB2 = part(FACTS.seX2, "second-class car (UB2)");
FACTS.seURB2 = part(FACTS.seX2, "bistro car (URB2)");
FACTS.seUB2X = part(FACTS.seX2, "driving trailer (UB2X)");
FACTS.seRc6Trv = FACTS.seRc6;
FACTS.seBC4Trv = FACTS.seBC4;
FACTS.seWL4Trv = FACTS.seWL4;
