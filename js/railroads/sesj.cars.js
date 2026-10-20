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
// stainless coaches, MTRX (VR's since August 2024) its six FLIRTs, now in
// VR's green, Arlanda Express its seven X3s. SJ's Zefiro Express (X250,
// first trains planned for December 2027) and CAF X45s (autumn 2027) are not
// in service yet, and FlixTrain left Sweden in January 2024, so none of them
// is drawn. Vy's trains into Sweden are Entur's (entur.cars.js).

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

// ===================== Bombardier Regina (X55, X52) =====================

// --- Bombardier Regina: SJ 3000 (X55, 20 four-car sets 3344-3363, 2010-13)
// and the four three-car X52s (9077-9080, Västtrafik's and Transitio's) that
// SJ runs on Göteborg–Karlstad. A 2-car Regina is 53.9 m, a 3-car 80.5 m, an X55 107.1
// m (Swedish Wikipedia), so an end car is 26.95 m and a middle car 26.6 m;
// 3.45 m wide, the widest Swedish train; bogies 19.0 m apart, 2.7 m
// wheelbase, 840 mm wheels; floor 1150 mm; about 4.1 m to the roof, scaled
// from photographs. A rounded nose under a big raked windshield, its
// coupler under a black cover; a cab door, then the windows, a double plug
// door at each end of the car. Every X55 bogie is powered but the bistro
// car's. SJ 3000: painted silver, the windows a dark band, the nose's
// lower face darker gray with SJ on it. The X52s wear Västtrafik's paint:
// white, the roof and the top of the side light blue, sweeping down beside
// the windshield, the windows in a black band, the windshield in a black
// mask.
const RG_ROOF = 13.45, RG_SILL = 3.1;
const RG = { roof: RG_ROOF, sill: RG_SILL, cornerR: 1.1, end: 0.5, trucks: { centers: ft(19.0), wb: ft(2.7), d: 33.1 }, diaphragm: [3.9, 12.2], badge: false };
const RG_NOSE = [[3.4, RG_SILL], [1.1, 3.15], ["q", 0.35, 3.5, 0.35, 4.6], [0.5, 6.6], ["q", 0.8, 7.9, 1.8, 8.6], [5.2, 12.1], ["q", 6.5, RG_ROOF, 9.6, RG_ROOF]];
const RG_PAINT = {
  sj: { body: "#b9bec4", roof: "#a3a9b0", band: "#23262b", face: "#70757c", door: "#b0b6bc", skirt: "#3a3e44" },
  vt: { body: "#f3f5f6", roof: "#2f9be2", band: "#1c1e21", face: "#f3f5f6", door: "#e8ebed", skirt: "#232528" },
};
const rgDoor = (x) => ({ x, w: 4.3, y0: 3.3, y1: 10.9, leaves: 2, glassY: 0.5, glassH: 0.36, grabs: false });
function regina(c, part, paint) {
  const L = c.L, k = RG_PAINT[paint], cab = part === "cab", vt = paint === "vt";
  const pitch = vt ? 5.4 : 6.9, w = vt ? 4.6 : 6.2;
  const xs = cab ? seq(vt ? 18.4 : 13.6, pitch, vt ? 10 : 9) : part === "bistro" ? [...seq(10.0, 6.9, 5), ...seq(48.0, 8.0, 3)] : seq(10.0, 6.9, 10);
  // SJ's end car: a crew door behind the cab; the X52's: a passenger door
  // there instead.
  const doors = cab ? [L - 11.5, ...(vt ? [10.6] : [])] : [2.6, L - 7.0];
  const band = vt ? [0, L] : [xs[0] - 0.5, xs[xs.length - 1] + w + 0.5];
  return bilevel({ ...c, cabL: cab && c.cabL, cabR: false }, { ...RG, nose: cab ? RG_NOSE : null, cabLen: 9,
    paint: (c, g) => {
      let s = rect(0, 0, L, 17, k.body) + rect(band[0], 7.0, band[1] - band[0], 3.7, k.band, 0, 'rx="0.5"') + rect(0, 11.9, L, 3, k.roof) + line(0, 11.9, L, 11.9, "rgba(0,0,0,0.18)", 0.5) +
        rect(0, 0, L, RG_SILL + 0.45, k.skirt);
      if (vt) s += rect(0, 10.95, L, 1.0, k.roof);
      for (const x of doors) s += rect(x - 0.2, RG_SILL, 4.7, 8.0, k.door);
      if (cab) {
        // The nose: no window band ahead of the cab door; SJ's darker lower
        // face, or Västtrafik's blue swept down beside the windshield in its
        // black mask.
        s += vt ? rect(0, 7.0, 9.4, 3.7, k.body) + path(poly([[0, 13.6], [0, 9.6], [1.6, 9.6], [5.6, 12.4], [9.6, 12.0], [12.0, 10.95], [16.0, 10.95], [16.0, 13.6]]), k.roof) +
            path(poly([[1.55, 8.45], [5.3, 12.05], [8.4, 12.05], [8.4, 8.45]]), k.band)
          : path(poly([[0, 3.6], [2.6, 3.6], [2.0, 8.4], [0, 8.4]]), k.face);
        s += path(poly([[1.9, 8.75], [5.15, 11.75], [7.9, 11.75], [7.9, 8.75]]), C.glass) + path(poly([[2.3, 9.0], [3.6, 10.2], [4.3, 10.2], [3.0, 9.0]]), C.glassLight);
      }
      return s + frames(xs, 7.25, w, 3.2, 0.12, "#191b1e");
    },
    rows: [{ xs, y: 7.25, w, h: 3.2, r: 0.4 }, ...(cab ? [] : [])],
    doors: [...doors.map(rgDoor), ...(cab && !vt ? [{ x: 9.4, w: 2.2, y0: 4.2, y1: 11.3, glassY: 0.55, glassH: 0.33, grabs: true }] : [])],
    extra: (c, g) => {
      let s = boxes(17.0, L - 17.0, RG_SILL, 4, 1.05) + hvac(cab ? 22.0 : 12.0, RG_ROOF, 11) + roofCover(cab ? 40.0 : 44.0, RG_ROOF, 14, 0.5);
      if (cab && !c.mirrored) s += pantograph(L - 14.0, RG_ROOF, { facing: -1 }) + panGear(L - 14.0, RG_ROOF, -1);
      if (cab) s += horns(10.4, RG_ROOF - 0.02);
      const mark = vt ? letters(c, cab ? 30.0 : L / 2, 5.0, 0.9, "Västtrafik", "#1d4f91", { weight: 600 })
        : letters(c, cab ? 15.5 : 10.0, 5.4, 1.1, "SJ", "#ffffff", { weight: 800 });
      return s + mark + (part === "bistro" ? letters(c, 60.0, 5.2, 0.8, "Bistro", "#2c3038", { weight: 600 }) : "");
    },
    cab: () => wiper(2.5, 9.0, 4.6, 11.2) + lamp(0.55, 5.6, 0.6, 0.45) + lamp(0.6, 6.4, 0.4, 0.28, RED_LAMP) + lamp(6.6, 12.6, 0.8, 0.3) +
      rect(-0.05, 2.55, 1.6, 1.5, "#1d1f22", 0, 'rx="0.35"') + path(poly([[1.0, 3.1], [3.8, 3.1], [3.6, 1.1], [1.5, 0.9]]), "#2a2d31"),
  });
}
const x55Cab = (c) => regina(c, "cab", "sj"), x55Mid = (c) => regina(c, "mid", "sj"), x55Bistro = (c) => regina(c, "bistro", "sj");
const x52Cab = (c) => regina(c, "cab", "vt"), x52Mid = (c) => regina(c, "mid", "vt");

// ===================== Alstom X40 (Coradia Duplex) =====================

// --- Alstom Coradia Duplex, SJ X40 (43 sets, 2004-08; 2-car 3301-3310 and
// 3338-3342, 3-car 3311-3337): 27.55 m cars (55.1 m and 81.5 m sets),
// 2.96 m wide, 4.56 m tall (trainspo), bogies 20.0 m apart, each car on a
// motor bogie (920 mm wheels) and a trailer bogie. Double-deck between the
// bogies, entered at 645 mm; single-level ends over the bogies. The end
// car's cab sits high in a bulbous nose behind a huge windshield, its
// coupler under a cover; a crew door, two windows over the motor bogie, a
// door into the double-deck section at each end of it. Painted silver, the
// windows framed dark; the three-car sets refurbished by VR FleetCare from
// 2024 keep the silver.
const X40_ROOF = 14.96, X40_SILL = 3.9;
const X40 = { roof: X40_ROOF, sill: X40_SILL, cornerR: 1.2, end: 0.5, noTrucks: true, diaphragm: [4.0, 12.8], badge: false };
const X40_NOSE = [[5.0, X40_SILL], [1.8, 3.4], ["q", 0.15, 3.6, 0.15, 5.3], [0.25, 7.4], ["q", 0.55, 9.0, 1.35, 10.0], [2.5, 13.4], ["q", 3.3, X40_ROOF, 6.6, X40_ROOF]];
const x40Door = (x) => ({ x, w: 4.0, y0: 2.2, y1: 9.7, leaves: 2, glassY: 0.48, glassH: 0.38, grabs: false });
function x40(c, cab) {
  const L = c.L, dd = [cab ? 24.6 : 17.6, L - 17.6];
  const up = seq(dd[0] + 1.6, 5.35, 9), low = seq(dd[0] + 1.6, 5.35, 9);
  const ends = cab ? [11.6, 15.8, L - 10.2] : [3.4, 8.2, L - 10.2];
  return bilevel({ ...c, cabL: cab && c.cabL, cabR: false }, { ...X40, nose: cab ? X40_NOSE : null, cabLen: 8, drop: { a: dd[0], b: dd[1], y: 1.55 },
    paint: (c, g) => {
      let s = rect(0, 0, L, 17, "#c6cacf") + rect(0, 13.4, L, 3, "#a9afb6") + line(0, 13.4, L, 13.4, "rgba(0,0,0,0.18)", 0.5) + rect(0, 0, L, 2.1, "#3a3e44");
      s += frames(up, 9.55, 4.3, 3.0, 0.14, "#2a2d31") + frames(low, 3.05, 4.3, 2.6, 0.14, "#2a2d31") + frames(ends, 7.4, 3.6, 3.0, 0.14, "#2a2d31");
      if (cab) s += path(poly([[1.3, 9.6], [2.45, 13.3], [7.6, 13.3], [7.6, 9.6]]), "#1d2024") + rect(0, 3.4, 2.4, 2.0, "#2a2d31");
      return s;
    },
    rows: [{ xs: up, y: 9.55, w: 4.3, h: 3.0, r: 0.5 }, { xs: low, y: 3.05, w: 4.3, h: 2.6, r: 0.5 }, { xs: ends, y: 7.4, w: 3.6, h: 3.0, r: 0.5 }],
    doors: [x40Door(dd[0] - 4.6), x40Door(dd[1] + 0.6), ...(cab ? [{ x: 8.2, w: 2.0, y0: 4.4, y1: 11.9, glassY: 0.55, glassH: 0.33, grabs: true }] : [])],
    extra: (c, g) => {
      // The motor bogie under the A end (the cab), the trailer bogie under the other.
      let s = truck(L / 2 - 32.8, { wb: ft(2.7), d: 36.2, top: X40_SILL }) + truck(L / 2 + 32.8, { wb: ft(2.5), d: 30.7, top: X40_SILL });
      s += boxes(cab ? 6.5 : 4.0, dd[0] - 5.2, X40_SILL, 1, 1.0) + boxes(dd[1] + 5.2, L - 4.0, X40_SILL, 1, 0.9) + boxes(dd[0] + 3, dd[1] - 3, 1.55, 3, 0.35);
      s += hvac(cab ? 10.0 : 3.0, X40_ROOF, 10) + hvac(L - 13.0, X40_ROOF, 10) + roofCover(32.0, X40_ROOF, 14, 0.4);
      if (c.mirrored && cab) s += pantograph(L - 26.0, X40_ROOF, { facing: -1 }) + panGear(L - 26.0, X40_ROOF, -1);
      return s + letters(c, cab ? 20.0 : 13.0, 8.4, 1.0, "SJ", "#2c3038", { weight: 800 });
    },
    cab: () => path(poly([[1.55, 9.85], [2.55, 12.95], [7.3, 12.95], [7.3, 9.85]]), C.glass) + path(poly([[1.95, 10.05], [2.6, 11.7], [3.3, 11.7], [2.65, 10.05]]), C.glassLight) +
      wiper(2.0, 10.0, 2.9, 12.3) + rect(3.0, 13.45, 3.6, 0.75, "#141618", 0, 'rx="0.15"') + rect(3.3, 13.62, 2.4, 0.4, "#f4a321", 0, 'rx="0.06"') +
      lamp(0.45, 6.4, 0.8, 0.7) + lamp(0.6, 7.5, 0.45, 0.32, RED_LAMP) + lamp(4.0, 14.5, 0.5, 0.25) +
      rect(-0.05, 2.3, 2.2, 2.3, "#2b2e33", 0, 'rx="0.4"') + path(poly([[1.8, 3.4], [5.0, 3.4], [4.8, 1.2], [2.3, 1.0]]), "#2a2d31"),
  });
}
const x40Cab = (c) => x40(c, true), x40Mid = (c) => x40(c, false);

// ===================== Arlanda Express X3 =====================

// --- Alstom X3 (7 four-car units, 1-7, 1998-99, built in Birmingham): 93.08
// m (järnväg.net), the end cars about 24.4 m and the middle ones 22.1 m;
// about 3.8 m tall; floors level with the special high platforms at
// Stockholm C and Arlanda. Motor bogies under the end cars (Bo'Bo'+2'2'+
// 2'2'+Bo'Bo'), 200 km/h. A rounded nose (new nose cones in 2003-04), two
// double doors a side on every car. The paint since 2010-11: white sides,
// the nose and the doors yellow, arlanda express in dark gray type.
const X3_ROOF = 12.5, X3_SILL = 3.4, X3Y = "#f5c400";
const X3 = { roof: X3_ROOF, sill: X3_SILL, cornerR: 1.0, end: 0.5, trucks: { centers: ft(16.0), wb: ft(2.6), d: 33.1 }, diaphragm: [3.8, 11.4], badge: false };
const X3_NOSE = [[3.8, X3_SILL], [1.3, 3.3], ["q", 0.3, 3.6, 0.3, 4.9], [0.5, 6.6], ["q", 0.8, 8.0, 1.9, 8.8], [5.4, 11.5], ["q", 6.9, X3_ROOF, 9.8, X3_ROOF]];
function x3(c, cab) {
  const L = c.L, doors = cab ? [16.0, L - 12.5] : [9.0, L - 13.5];
  const xs = cab ? [...seq(21.8, 5.6, 8), L - 6.6] : [3.2, ...seq(15.4, 5.6, 8), L - 7.6];
  return bilevel({ ...c, cabL: cab && c.cabL, cabR: false }, { ...X3, trucks: { ...X3.trucks, centers: ft(cab ? 16.6 : 15.0) }, nose: cab ? X3_NOSE : null, cabLen: 10,
    paint: (c, g) => {
      let s = rect(0, 0, L, 17, "#f3f4f4") + rect(0, 11.4, L, 3, "#b7bdc4") + line(0, 11.4, L, 11.4, "rgba(0,0,0,0.18)", 0.5) + rect(0, 0, L, X3_SILL + 0.4, "#3a3e44");
      for (const x of doors) s += rect(x - 0.5, X3_SILL, 5.3, 8.1, X3Y);
      if (cab) s += path(poly([[0, 0], [11.5, 0], [11.5, 11.45], [9.0, 13.5], [0, 13.5]]), X3Y) + path(poly([[1.9, 8.6], [5.3, 11.2], [8.9, 11.2], [8.9, 8.6]]), "#1d2024");
      return s + frames(xs, 7.2, 4.4, 2.9, 0.14, "#2a2d31");
    },
    rows: [{ xs, y: 7.2, w: 4.4, h: 2.9, r: 0.45 }],
    doors: doors.map((x) => ({ x, w: 4.3, y0: 3.6, y1: 10.9, leaves: 2, glassY: 0.48, glassH: 0.38, grabs: false })),
    extra: (c, g) => {
      let s = boxes(14.0, L - 14.0, X3_SILL, 3, 1.0) + hvac(cab ? 24.0 : 20.0, X3_ROOF, 11) + roofCover(cab ? 44.0 : 40.0, X3_ROOF, 10, 0.4);
      if (cab && !c.mirrored) s += pantograph(L - 16.0, X3_ROOF, { facing: -1 }) + panGear(L - 16.0, X3_ROOF, -1);
      return s + letters(c, cab ? 38.0 : L / 2, 4.9, 1.3, "arlanda express", "#2a2d31", { weight: 600, spacing: -0.03 });
    },
    cab: () => path(poly([[2.2, 8.85], [5.3, 10.95], [8.6, 10.95], [8.6, 8.85]]), C.glass) + path(poly([[2.6, 9.05], [3.8, 9.9], [4.5, 9.9], [3.3, 9.05]]), C.glassLight) +
      wiper(2.8, 9.0, 4.6, 10.6) + lamp(0.55, 5.9, 0.6, 0.45) + lamp(0.65, 6.7, 0.4, 0.28, RED_LAMP) + win(9.8, 8.6, 1.4, 2.3, 0.3) +
      path(poly([[1.2, 3.3], [4.0, 3.3], [3.8, 1.2], [1.7, 1.0]]), "#2a2d31") + rect(0.0, 2.6, 1.5, 1.1, "#1d1f22", 0, 'rx="0.3"'),
  });
}
const x3Cab = (c) => x3(c, true), x3Mid = (c) => x3(c, false);

// ===================== Snälltåget =====================

// --- Siemens Vectron, Snälltåget's 193s (seven, leased from ELL since
// 2016): 18.98 m, 6400 kW, 200 km/h (järnväg.net); bogies 9.5 m apart, 3.0
// m wheelbase, 1250 mm wheels; a near-upright nose with a wide windshield,
// a crew door behind each cab, the machine room's smooth sides, a
// pantograph over each end. Snälltåget's red, a dark gray band along the
// bottom, and its name three times along the side in white serif type.
const vectron = (c) => vectronBody(c) + [17.4, 31.1, 44.8].map((x) => letters(c, x, 7.9, 2.0, "Snälltåget", "#ffffff", { weight: 600, family: "Georgia, serif", spacing: -0.04 })).join("");
const vectronBody = (c) => bothEnds(c, (h) => {
  const L = h.L, sill = 4.0, roof = 12.8, red = "#cf2030";
  return cabUnit(h, {
    roof, sill, rearR: 1.0,
    nose: [[1.5, sill], [1.25, 6.4], [1.55, 8.6], [2.7, 11.9], ["q", 3.0, roof, 4.0, roof]],
    base: red, trucks: { centers: ft(9.5), wb: ft(3.0), d: 49.2 },
    tank: [18.5, L - 18.5, 1.8],
    paint: () => rect(0, 0, L, 5.4, "#3a3e44") + rect(0, 5.4, L, 0.12, "#25282c") + rect(0, roof - 0.55, L, 1, "#2a2d31") +
      path(poly([[1.6, 8.6], [2.6, 11.7], [6.0, 11.7], [6.0, 8.6]]), "#1d1f22"),
    glass: [[[1.75, 8.9], [2.75, 11.5], [5.6, 11.5], [5.6, 8.9]]],
    sideWin: [[6.3, 9.1, 1.6, 1.8]],
    doors: [[8.2, 2.3, sill + 0.35, 11.3]],
    grilles: [[13.0, 11.2, 6.0, 0.7, 0.3], [20.5, 11.2, 6.0, 0.7, 0.3]],
    roofItems: [[L / 2 - 9, 18, 0.55]],
    extra: () => pantograph(15.5, roof, { up: h.half === 1, facing: -1 }) + panGear(15.5, roof, 1) + horns(5.6, roof) +
      lamp(1.35, 6.9, 0.45, 0.42) + lamp(1.28, 6.1, 0.32, 0.3, RED_LAMP) + lamp(3.0, 12.15, 0.5, 0.28) + wiper(2.2, 9.0, 3.0, 11.1) +
      buffers(0, -1, { y: 3.45 }) + rect(11.5, 1.9, 2.4, 1.0, "#3a3e44", 0.4, 'rx="0.1"') + lines([[8.0, 5.5, 8.0, 11.0], [10.8, 5.5, 10.8, 11.0]], "#e9ebed", 0.6),
  });
});

// --- Snälltåget's coaches: second-class open coaches bought from ÖBB and DB
// (Bmpz, Bpmmz, Bmz; 26.4 m, built 1973-89), couchette cars (Bvcmz, 26.4 m,
// and SJ-built BC2, 23.5 m), the WRbmz dining car (26.4 m), all about 4.05
// m tall on Minden-Deutz-type bogies; doors at the ends. Their paint: white,
// the ends red, a gray roof and a dark band along the bottom, and big serif
// words along the side in red, blue, green, pink and yellow (Snälltåget, or
// the cities it serves); the dining car red all over.
const SN = { roof: 13.3, sill: 3.6, cornerR: 1.2, end: 0.5, trucks: { centers: ft(19.0), wb: ft(2.5), d: 36.2 }, diaphragm: [4.0, 11.8], badge: false };
const SN_COLORS = ["#d4202c", "#2c52a3", "#3aa045", "#e0488f", "#e9b417"];
const SN_WORDS = { seat: ["Snälltåget", "Snälltåget", "Snälltåget"], night: ["Stockholm", "Malmö", "Berlin"], couchette: ["Snälltåget", "Snälltåget", "Snälltåget"] };
function snallCoach(c, { rows, doors, words = "seat", dining = false, small = [] }) {
  const L = c.L, red = "#d4202c";
  return bilevel(c, { ...SN,
    paint: (c, g) => {
      let s = rect(0, 0, L, 17, dining ? red : "#f1f1ee") + rect(0, 12.15, L, 3, "#a7adb4") + line(0, 12.15, L, 12.15, "rgba(0,0,0,0.2)", 0.5) +
        rect(0, 0, L, SN.sill + 0.6, "#3a3e44") + (dining ? "" : ribs(0, L, 4.3, 12.0, 0.32, "rgba(0,0,0,0.05)"));
      // The red ends round the doors.
      if (!dining) s += rect(0, 0, 6.6, 17, red) + rect(L - 6.6, 0, 6.6, 17, red) + rect(0, 0, L, SN.sill + 0.6, "#3a3e44");
      for (const r of rows) s += frames(r.xs, r.y, r.w, r.h, 0.16, "#2a2d31");
      return s;
    },
    rows: [...rows, ...small.map(([x, w]) => ({ xs: [x], y: 8.4, w, h: 1.6, r: 0.25 }))],
    doors: doors.map((x) => ({ x, w: 2.6, y0: 3.95, y1: 10.9, glassY: 0.58, glassH: 0.3, grabs: true })),
    extra: (c, g) => {
      let s = hvac(L / 2 - 6, SN.roof, 12, 0.6) + boxes(19.0, L - 19.0, SN.sill, 3, 0.95, "#2f3338") + buffers(0, -1, { y: 3.45 }) + buffers(L, 1, { y: 3.45 });
      if (dining) return s + letters(c, L / 2, 5.2, 1.6, "Restaurang", "#ffffff", { weight: 600, family: "Georgia, serif" });
      const ws = SN_WORDS[words], span = L - 16.0;
      ws.forEach((w, i) => { s += letters(c, 8.0 + span * (i + 0.5) / ws.length, 5.15, 1.75, w, SN_COLORS[i % SN_COLORS.length], { weight: 600, family: "Georgia, serif", spacing: -0.03 }); });
      return s + letters(c, 3.3, 5.0, 0.55, "Snälltåget", "#ffffff", { weight: 600, family: "Georgia, serif" });
    },
  });
}
const SNW = (xs, w = 3.9, h = 2.8) => ({ xs, y: 7.2, w, h, r: 0.35 });
// Bmpz: an open saloon, twelve windows.
const snBmpz = (c) => snallCoach(c, { doors: [1.25, c.L - 3.85], rows: [SNW(seq(8.4, 6.0, 12), 4.3)] });
// Bvcmz: ten six-berth compartments, a window each, and the corridor.
const snCouchette = (c) => snallCoach(c, { doors: [1.25, c.L - 3.85], rows: [SNW(seq(9.2, 6.9, 10), 3.6, 2.9)], words: "night" });
// WRbmz: the dining car, the kitchen's small windows at one end.
const snDining = (c) => snallCoach(c, { doors: [1.25, c.L - 3.85], rows: [SNW(seq(24.0, 6.6, 8), 5.0)], small: [[8.0, 1.5], [11.4, 1.5], [15.0, 1.5], [18.6, 1.5]], dining: true });

// ===================== Tågab =====================

// --- Tågab's coaches: SJ's 1960s stainless cars, B1 (second class, 62
// seats), A2 (first, 40), AB3, BS5 (kiosk), R2 (bistro): 24.1 m, 3.08 m
// wide, about 4.0 m to the roof; corrugated stainless sides, swing doors at
// the ends, framed windows (järnväg.net). Tågab's stripes: a broad red band
// under the windows, a thin line over them, red on second-class cars and
// yellow on first.
const TG = { roof: 13.1, sill: 3.6, cornerR: 1.2, end: 0.5, trucks: { centers: ft(17.2), wb: ft(2.5), d: 34.6 }, diaphragm: [4.0, 11.7], badge: false };
function tagabCoach(c, { first = false, rows, small = [], label = null }) {
  const L = c.L;
  return bilevel(c, { ...TG,
    paint: (c, g) => rect(0, 0, L, 17, "#c9cdd2") + ribs(0, L, 3.7, 12.0, 0.26, "rgba(0,0,0,0.12)") + rect(0, 12.1, L, 3, "#8e949b") + line(0, 12.1, L, 12.1, "rgba(0,0,0,0.2)", 0.5) +
      rect(0, 5.0, L, 1.55, "#d32630") + rect(0, 10.55, L, 0.32, first ? "#f0c419" : "#d32630") + rect(0, 0, L, TG.sill + 0.3, "#2a2d31") +
      rows.map((r) => frames(r.xs, r.y, r.w, r.h, 0.22, "#8f969e")).join(""),
    rows: [...rows, ...small.map(([x, w]) => ({ xs: [x], y: 8.3, w, h: 1.6, r: 0.25 }))],
    doors: [1.25, L - 3.85].map((x) => ({ x, w: 2.6, y0: 3.95, y1: 10.9, glassY: 0.58, glassH: 0.3, grabs: true, fill: "rgba(0,0,0,0.04)" })),
    extra: (c, g) => hvac(L - 12.5, TG.roof, 9, 0.6) + boxes(17.0, L - 17.0, TG.sill, 3, 0.9, "#2f3338") + buffers(0, -1, { y: 3.45 }) + buffers(L, 1, { y: 3.45 }) +
      letters(c, 6.2, 9.9, 1.0, first ? "1" : "2", first ? "#c79a00" : "#d32630", { weight: 800 }) + (label ? letters(c, L / 2, 4.4, 0.55, label, "#2a2d31", { weight: 700 }) : ""),
  });
}
const TGW = (xs, w = 3.9) => ({ xs, y: 7.0, w, h: 3.0, r: 0.35 });
const tgB1 = (c) => tagabCoach(c, { rows: [TGW(seq(8.8, 6.15, 10), 4.2)], small: [[5.0, 1.4]] });
const tgA2 = (c) => tagabCoach(c, { first: true, rows: [TGW(seq(9.0, 7.0, 9), 4.6)], small: [[5.0, 1.4]] });

// ===================== MTRX (VR) =====================

// --- Stadler FLIRT Nordic, X74 (6 five-car units, 001-006, 2014-15; built
// for MTR Express, VR's since August 2024): 105.5 m, Bo'2'2'Bo'+2'2'Bo',
// 4500 kW, 200 km/h (järnväg.net); the FLIRT sections of
// digitraffic.cars.js, the café in the middle section. Being wrapped in
// VR's colors since August 2024: the cab sections VR green with VR in
// white behind the door and white speed lines thickening toward the rear,
// the other sections white streaked with green (some sets still show
// MTR's red and black behind green cabs).
const VR_GREEN = "#1fa65a", VR_DEEP = "#14824a";
const vrStreaks = (x0, x1, fromGreen) => {
  let s = "";
  for (let i = 0; i < 9; i++) {
    const y = 4.4 + i * 0.95, h = 0.12 + i * 0.06;
    s += rect(x0, y, x1 - x0, h, fromGreen ? "#ffffff" : VR_GREEN, 0, 'opacity="0.85"');
  }
  return s;
};
const X74 = { body: "#f3f5f4", roof: "#8f979f", skirt: "#2a2d31", door: null, mask: "#17191c",
  paint: (c, g, part) => part === "cab"
    ? rect(0, 0, g.L, 17, VR_GREEN) + rect(0, 0, g.L, 3.55, VR_DEEP) + vrStreaks(30.0, g.L, true) + rect(0, 12.95, g.L, 3, "#8f979f") +
      letters(c, 21.6, 7.6, 1.9, "VR", "#ffffff", { weight: 800, spacing: -0.05, stretch: 1.1 })
    : vrStreaks(0, 12.0, false) + vrStreaks(g.L - 12.0, g.L, false) + rect(0, 3.55, g.L, 0.4, VR_GREEN) };
const x74Cab = (c) => flirt(c, "cab", X74), x74Mid = (c) => flirt(c, "mid", X74);

// ===================== The registry =====================

export const TYPES = {
  seX2: { name: "X2 power car (X2000)", kind: "emu" },
  seUA2: { name: "X2000 first-class car (UA2)", kind: "emu" },
  seUB2: { name: "X2000 second-class car (UB2)", kind: "emu" },
  seURB2: { name: "X2000 bistro car (URB2)", kind: "emu", amenities: ["cafe"] },
  seUB2X: { name: "X2000 driving trailer (UB2X)", kind: "emu" },
  seX55Cab: { name: "SJ 3000 (X55) end car", kind: "emu" },
  seX55Mid: { name: "SJ 3000 (X55) car", kind: "emu" },
  seX55Bistro: { name: "SJ 3000 (X55) bistro car", kind: "emu", amenities: ["cafe"] },
  seX52Cab: { name: "Regina (X52) end car", kind: "emu" },
  seX52Mid: { name: "Regina (X52) middle car", kind: "emu" },
  seX40Cab: { name: "X40 double-deck end car", kind: "emu" },
  seX40Mid: { name: "X40 double-deck middle car", kind: "emu" },
  seRc6: { name: "Rc6 electric locomotive", kind: "electric", pan: true },
  seRc6Trv: { name: "Rc6 electric locomotive (Trafikverket)", kind: "electric", pan: true },
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
  seX3Cab: { name: "X3 end car", kind: "emu" },
  seX3Mid: { name: "X3 middle car", kind: "emu" },
  se193: { name: "Vectron (193) electric locomotive", kind: "electric", pan: true },
  seSnBmpz: { name: "Bmpz second-class coach", kind: "coach" },
  seSnBvcmz: { name: "Couchette car", kind: "coach", amenities: ["sleepers"] },
  seSnWRbmz: { name: "WRbmz dining car", kind: "coach", amenities: ["cafe"] },
  seRc3: { name: "Rc3 electric locomotive", kind: "electric", pan: true },
  seTgB1: { name: "B1 second-class coach", kind: "coach" },
  seTgA2: { name: "A2 first-class coach", kind: "coach" },
  seX74Cab: { name: "X74 (Stadler FLIRT) cab section", kind: "emu", pan: true },
  seX74Mid: { name: "X74 (Stadler FLIRT) section", kind: "emu", pan: true },
};

const M = (draw, len, oneEnd = false) => ({ draw, len, oneEnd, variant: null });
const COACH = ft(26.4);
export const MODELS = {
  seX2: M(x2Power, ft(17.397), true),
  seUA2: M(ua2, ft(24.95)),
  seUB2: M(ub2, ft(24.95)),
  seURB2: M(urb2, ft(24.95)),
  seUB2X: M(ub2x, ft(22.447), true),
  seX55Cab: M(x55Cab, ft(26.95), true),
  seX55Mid: M(x55Mid, ft(26.6)),
  seX55Bistro: M(x55Bistro, ft(26.6)),
  seX52Cab: M(x52Cab, ft(26.95), true),
  seX52Mid: M(x52Mid, ft(26.6)),
  seX40Cab: M(x40Cab, ft(27.55), true),
  seX40Mid: M(x40Mid, ft(26.4)),
  seRc6: M(rc6, ft(15.52)),
  seRc6Trv: M(rc6Trv, ft(15.52)),
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
  seX3Cab: M(x3Cab, ft(24.4), true),
  seX3Mid: M(x3Mid, ft(22.14)),
  se193: M(vectron, ft(18.98)),
  seSnBmpz: M(snBmpz, COACH),
  seSnBvcmz: M(snCouchette, COACH),
  seSnWRbmz: M(snDining, COACH),
  seRc3: M(rc3Tagab, ft(15.52)),
  seTgB1: M(tgB1, ft(24.1)),
  seTgA2: M(tgA2, ft(24.1)),
  seX74Cab: M(x74Cab, 70.5, true),
  seX74Mid: M(x74Mid, 51.5),
};

// [first, last, type]: unit, power-car and locomotive numbers as
// järnväg.net lists them (an X55's or X40's set number; Arlanda Express's
// units 1-7; MTRX's 001-006; the Rc6s Trafikverket owns, which it lists as
// 14 of 1323-1382, taken here as 1323-1336; Tågab's Rc3s, numbered among
// the Rc2s they were rebuilt from). Neither Trafikverket's feed nor the
// timetable names a train's units, so these only list each railroad's
// fleet on its page; every train is drawn by TYPICAL.
export const FLEETS = {
  sj: [[2001, 2043, "seX2"], [2088, 2088, "seX2"], [2501, 2544, "seUB2X"], [2601, 2624, "seURB2"], [2701, 2754, "seUA2"], [2801, 2821, "seUA2"], [2822, 2882, "seUB2"],
    [3344, 3363, "seX55Cab"], [3301, 3343, "seX40Cab"], [9077, 9080, "seX52Cab"], [1323, 1336, "seRc6Trv"], [1337, 1422, "seRc6"]],
  arlandaexpress: [[1, 7, "seX3Cab"]],
  mtrx: [[1, 6, "seX74Cab"]],
  tagab: [[1027, 1136, "seRc3"]],
};

// What runs where, by the timetable's route and train number (contract of
// scripts/railroads/sweden.py: a 5-digit number is a variant of the 4-digit
// one after its first digit). SJ Snabbtåg: SJ 3000s on the trains north of
// Stockholm (560-599 to Sundsvall, Umeå, Östersund and Duved, 89 Duved–
// Östersund) and to Uddevalla (443), X2000s elsewhere (Göteborg, Malmö,
// Karlstad, Oslo; SJ 3000s stand in, especially on Göteborg–Malmö). SJ
// InterCity: an Rc6 with 1980s coaches, but Linköping–Gävle (264-271) runs
// X40s, and Luleå–Narvik (98-99) Trafikverket's cars. SJ Nattåg: Trafikverket's
// gray and red set to Umeå, Luleå and Narvik (91-94), SJ's black cars to
// Malmö (1-2) and Duved (70-71). SJ Regional: X40s, three-car sets often
// coupled to a two-car one, but Göteborg–Karlstad (3950-3979) the blue
// Reginas. Snälltåget's day and night trains, Tågab, MTRX and Arlanda
// Express each run one kind of train.
const set = (label, ...units) => ({ label, units });
const X2_SET = set("X2000: power car, five cars and a driving trailer", ["seX2", 1], ["seUA2", 1], ["seUB2", 1], ["seURB2", 1], ["seUB2", 2], ["seUB2X", 1]);
const X2_OR_X55 = set("X2000 (sometimes an SJ 3000): power car, five cars and a driving trailer", ...X2_SET.units);
const X55_SET = set("Four-car SJ 3000 (X55), sometimes two", ["seX55Cab", 1], ["seX55Mid", 1], ["seX55Bistro", 1], ["seX55Cab", 1]);
const X40_SET = set("Three-car X40 double-decker, often with a two-car set", ["seX40Cab", 1], ["seX40Mid", 1], ["seX40Cab", 1]);
const X52_3 = set("Three-car Regina (X52) in Västtrafik's colors", ["seX52Cab", 1], ["seX52Mid", 1], ["seX52Cab", 1]);
const IC_SET = set("Rc6 locomotive with InterCity coaches, usually 5 to 7", ["seRc6", 1], ["seA7", 1], ["seB7", 2], ["seRB7", 1], ["seB7", 1], ["seBF7", 1]);
const IC_NORTH = set("Rc6 locomotive with Trafikverket's coaches and bistro car", ["seRc6Trv", 1], ["seB2Trv", 2], ["seR12Trv", 1], ["seB2Trv", 1]);
const NIGHT_NORTH = set("Rc6 locomotive with Trafikverket's night-train cars (seats, bistro, couchettes, sleepers), about 10 cars",
  ["seRc6Trv", 1], ["seB2Trv", 2], ["seR12Trv", 1], ["seBC4Trv", 2], ["seWL4Trv", 1], ["seWL6Trv", 3]);
const NIGHT_SJ = set("Rc6 locomotive with seats, a bistro, couchettes and sleeping cars", ["seRc6", 1], ["seB7", 2], ["seRB7", 1], ["seBC4", 2], ["seWL4", 2]);
const X3_SET = set("Four-car X3", ["seX3Cab", 1], ["seX3Mid", 2], ["seX3Cab", 1]);
const X74_SET = set("Five-car X74 (Stadler FLIRT)", ["seX74Cab", 1], ["seX74Mid", 3], ["seX74Cab", 1]);
const SN_DAY = set("Vectron locomotive with coaches and a dining car, usually 6 to 8", ["se193", 1], ["seSnBmpz", 3], ["seSnWRbmz", 1], ["seSnBmpz", 2]);
const SN_NIGHT = set("Vectron locomotive with coaches, a dining car and couchette cars", ["se193", 1], ["seSnBmpz", 2], ["seSnWRbmz", 1], ["seSnBvcmz", 4]);
const TG_SET = set("Rc3 locomotive with stainless coaches, usually 4 or 5", ["seRc3", 1], ["seTgA2", 1], ["seTgB1", 3]);
const BY_TYPE = { seX2: X2_SET, seUA2: X2_SET, seUB2: X2_SET, seURB2: X2_SET, seUB2X: X2_SET, seX55Cab: X55_SET, seX55Mid: X55_SET, seX55Bistro: X55_SET,
  seX40Cab: X40_SET, seX40Mid: X40_SET, seX52Cab: X52_3, seX52Mid: X52_3, seRc6: IC_SET, seA7: IC_SET, seB7: IC_SET, seBF7: IC_SET, seRB7: IC_SET,
  seRc6Trv: NIGHT_NORTH, seB2Trv: NIGHT_NORTH, seR12Trv: NIGHT_NORTH, seBC4Trv: NIGHT_NORTH, seWL4Trv: NIGHT_NORTH, seWL6Trv: NIGHT_NORTH, seBC4: NIGHT_SJ, seWL4: NIGHT_SJ,
  seX3Cab: X3_SET, seX3Mid: X3_SET, seX74Cab: X74_SET, seX74Mid: X74_SET, se193: SN_DAY, seSnBmpz: SN_DAY, seSnWRbmz: SN_DAY, seSnBvcmz: SN_NIGHT,
  seRc3: TG_SET, seTgB1: TG_SET, seTgA2: TG_SET };
// The train number, a 5-digit variant read as its 4-digit original.
const num = (t) => {
  const n = Number(String(t.number || "").replace(/\D/g, ""));
  return n >= 10000 ? n % 10000 : n;
};
const kind = (t) => `${t.route || ""} ${t.product || ""}`;
const within = (n, ...ranges) => ranges.some(([a, b]) => n >= a && n <= b);
export const TYPICAL = {
  sj: (t, reported) => {
    if (BY_TYPE[reported]) return BY_TYPE[reported];
    const k = kind(t), n = num(t), to = t.destination || "";
    if (/natt|night/i.test(k)) return within(n, [91, 94]) || /Umeå|Luleå|Narvik|Kiruna|Boden/i.test(to) ? NIGHT_NORTH : NIGHT_SJ;
    if (/intercity/i.test(k)) {
      if (within(n, [264, 271])) return X40_SET;
      if (within(n, [98, 99]) || /Narvik|Kiruna|Luleå/i.test(to)) return IC_NORTH;
      return IC_SET;
    }
    if (/snabb/i.test(k)) {
      if (n === 89 || n === 443 || within(n, [560, 599]) || /Sundsvall|Umeå|Östersund|Duved|Åre|Uddevalla/i.test(to)) return X55_SET;
      return within(n, [480, 496]) ? X2_OR_X55 : X2_SET;
    }
    if (within(n, [3950, 3979]) || /Karlstad|Kristinehamn|Kil|Öxnered|Trollhättan/i.test(to)) return X52_3;
    return X40_SET;
  },
  snalltaget: (t, reported) => BY_TYPE[reported] || (/natt|night|euronight/i.test(kind(t)) || /Berlin|Dresden|Storlien|Åre|Innsbruck|Salzburg/i.test(t.destination || "") ? SN_NIGHT : SN_DAY),
  tagab: (t, reported) => BY_TYPE[reported] || TG_SET,
  mtrx: (t, reported) => BY_TYPE[reported] || X74_SET,
  arlandaexpress: (t, reported) => BY_TYPE[reported] || X3_SET,
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
  seX55Cab: { model: "Bombardier Regina, SJ 3000 (X55)", type: "Electric multiple unit", builder: "Bombardier, Hennigsdorf", built: "2010–2013",
    fleet: "20 four-car sets, 3344–3363", topSpeedMph: 124.3, powerHp: 4264, seats: 245, lengthFt: 351.4,
    about: "SJ's long-distance version of the wide-bodied Regina, 2+2 seats, a bistro in the third car, every bogie powered but the bistro car's. It runs SJ's high-speed trains north of Stockholm, to Sundsvall, Umeå, Östersund and Duved, and stands in for X2000s elsewhere.",
    source: JV + "vagnguide/x55" },
  seX52Cab: { model: "Bombardier Regina (X52)", type: "Electric multiple unit", builder: "Bombardier", built: "2000–2013", fleet: "4 three-car sets on Göteborg–Karlstad, 9077–9080",
    topSpeedMph: 124.3, powerHp: 2843, lengthFt: 264.1,
    about: "Regional Reginas owned by Västtrafik and Transitio, run by SJ between Göteborg and Karlstad together with Västtrafik and Värmlandstrafik, in Västtrafik's white and blue.",
    source: JV + "vagnguide/x50" },
  seX40Cab: { model: "Alstom Coradia Duplex (X40)", type: "Double-deck electric multiple unit", builder: "Alstom, Salzgitter", built: "2004–2008",
    fleet: "43 sets: 16 two-car, 27 three-car (3301–3343)", topSpeedMph: 124.3, powerHp: 3420, seats: 233, lengthFt: 267.4,
    about: "SJ's double-decker for regional and shorter InterCity trains: Stockholm–Västerås–Örebro–Göteborg, Linköping–Gävle–Ljusdal and Göteborg–Kalmar. VR FleetCare is refurbishing the three-car sets in 2024–28.",
    source: JV + "vagnguide/x40" },
  seX3Cab: { model: "Alstom X3", type: "Electric multiple unit", builder: "Alstom, Birmingham", built: "1998–1999", fleet: "7 four-car units, 1–7",
    topSpeedMph: 124.3, powerHp: 3004, seats: 228, lengthFt: 305.4,
    about: "Arlanda Express's airport train between Stockholm C and Arlanda, every 15 minutes in about 20 minutes, at up to 200 km/h. Its floors are level with the high platforms at both ends.",
    source: JV + "vagnguide/x3" },
  seX74Cab: { model: "Stadler FLIRT Nordic (X74)", type: "Electric multiple unit", builder: "Stadler Rail", built: "2014–2015", fleet: "6 five-car units, 001–006",
    topSpeedMph: 124.3, powerHp: 6035, seats: 244, lengthFt: 346.1,
    about: "Built for MTR Express, the first competitor to SJ's high-speed trains between Stockholm and Göteborg (2015). Finland's VR bought the company in 2024 and is repainting the trains in its green.",
    source: JV + "vagnguide/x74" },
  se193: { model: "Siemens Vectron (193)", type: "Electric locomotive", builder: "Siemens Mobility", built: "2011–2024", fleet: "7 leased by Snälltåget",
    topSpeedMph: 124.3, powerHp: 8583, lengthFt: 62.3,
    about: "Snälltåget has run its own trains with Vectrons leased from ELL since 2016, painted red with Snälltåget three times on one side (and Loket on the other).",
    source: JV + "lokguide/193" },
  seSnBmpz: { model: "Bmpz coach", type: "Coach", built: "1973–1979 (for ÖBB)", seats: 74, lengthFt: 86.6,
    about: "Open second-class coaches bought from Austria's ÖBB for Snälltåget's day and night trains.", source: JV + "vagnguide/bmpz" },
  seSnBvcmz: { model: "Couchette car (Bvcmz, BC2)", type: "Couchette car", built: "1966–1972", lengthFt: 86.6,
    about: "Six-berth compartments on Snälltåget's night trains to Berlin, Dresden and the mountains of Jämtland.", source: JV + "vagnguide/bvcmz" },
  seSnWRbmz: { model: "WRbmz dining car", type: "Dining car", built: "1973–1979 (rebuilt)", seats: 42, lengthFt: 86.6,
    about: "The restaurant car that runs in most Snälltåget trains.", source: JV + "vagnguide/wrbmz" },
  seTgB1: { model: "B1 coach", type: "Coach", builder: "ASJ and others", built: "1960–1968", seats: 62, lengthFt: 79.1,
    about: "One of SJ's 1960s stainless coaches, rebuilt for Tågab's InterCity trains.", source: JV + "vagnguide/b1" },
  seTgA2: { model: "A2 coach", type: "Coach", built: "1963–1968", seats: 40, lengthFt: 79.1,
    about: "First class on Tågab's trains, a 1960s SJ stainless coach.", source: JV + "vagnguide/a2" },
};
const part = (facts, name) => ({ ...facts, model: `${facts.model}, ${name}` });
FACTS.seUA2 = part(FACTS.seX2, "first-class car (UA2)");
FACTS.seUB2 = part(FACTS.seX2, "second-class car (UB2)");
FACTS.seURB2 = part(FACTS.seX2, "bistro car (URB2)");
FACTS.seUB2X = part(FACTS.seX2, "driving trailer (UB2X)");
FACTS.seRc6Trv = FACTS.seRc6;
FACTS.seBC4Trv = FACTS.seBC4;
FACTS.seWL4Trv = FACTS.seWL4;
FACTS.seX55Mid = part(FACTS.seX55Cab, "middle car");
FACTS.seX55Bistro = part(FACTS.seX55Cab, "bistro car");
FACTS.seX52Mid = part(FACTS.seX52Cab, "middle car");
FACTS.seX40Mid = part(FACTS.seX40Cab, "middle car");
FACTS.seX3Mid = part(FACTS.seX3Cab, "middle car");
FACTS.seX74Mid = part(FACTS.seX74Cab, "intermediate section");
