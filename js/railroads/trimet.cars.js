// WES Commuter Rail's cars (scripts/railroads/trimet.py): TriMet's three
// Colorado Railcar Aero diesel railcars and their cab trailer, and the two
// rebuilt Budd RDCs kept as spares. The feed's vehicle id is a car's
// number, which picks its drawing. Trainsheet's own side views, from
// published dimensions and photographs of the cars in today's paint; the
// lettering is drawn as type, not copied from TriMet's logo.

import { bilevel } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, poly, win, slats, flutes, underframe } from "../carart.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
const r2 = (v) => Math.round(v * 100) / 100;

// The railcars' first paint (2008, still on 1001-1003): white, a blue sweep
// over the windows, a yellow crescent low on the side. The cab trailer's
// (2001, repainted March 2025): royal blue all over, two orange stripes
// slanting across the middle. The RDCs': fluted stainless, a white window
// band under a blue letterboard. TriMet's orange for its mark.
const WES = { white: "#f1f2f3", blue: "#1f56c2", navy: "#173b8c", yellow: "#e8cf62", royal: "#1a3fc6", orange: "#f2652a",
  black: "#1b1d21", skirt: "#2c3036", stainless: "#d5d9de", band: "#f2f0ea", letter: "#2a55b5", pods: "#2b323b" };

// ---------- Drawing helpers ----------

const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
// Lettering h ft tall centered at (x, y), reading left to right even on a
// car drawn mirrored.
const letters = (c, x, y, h, text, fill, { weight = 700, spacing = 0, anchor = "middle" } = {}) =>
  `<text transform="translate(${r2(x)} ${r2(y)}) scale(${c.mirrored ? -1 : 1} -1)" y="${r2(h * 0.36)}" font-size="${r2(h)}" text-anchor="${anchor}" font-weight="${weight}"` +
  `${spacing ? ` letter-spacing="${spacing}"` : ""} font-family="${SANS}" fill="${fill}">${text}</text>`;
// TriMet's name as on WES's cars: TRI MET spaced out small over WES set
// big, with TriMet's mark (an orange disc) between TRI and MET; drawn as
// type and a plain disc, not the logo artwork. x: the center, y: WES's.
const wesName = (c, x, y, h, fill, mark = WES.orange) => {
  const k = c.mirrored ? -1 : 1;
  return letters(c, x - k * h * 0.62, y + h * 1.0, h * 0.42, "TRI", fill, { weight: 600, spacing: 0.08 }) + circle(x, y + h * 1.0, h * 0.2, mark) +
    letters(c, x + k * h * 0.66, y + h * 1.0, h * 0.42, "MET", fill, { weight: 600, spacing: 0.08 }) + letters(c, x, y, h, "WES", fill, { weight: 700, spacing: 0.05 });
};
// A smooth curve through points (Catmull-Rom as cubic Béziers), as path
// data without its opening move.
function through(pts) {
  let d = "";
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += `C${r2(p1[0] + (p2[0] - p0[0]) / 6)} ${r2(p1[1] + (p2[1] - p0[1]) / 6)} ${r2(p2[0] - (p3[0] - p1[0]) / 6)} ${r2(p2[1] - (p3[1] - p1[1]) / 6)} ${r2(p2[0])} ${r2(p2[1])}`;
  }
  return d;
}
// Paint under a curve down to y = bottom, or above it up to y = top.
const below = (pts, bottom, fill) => path(`M${r2(pts[0][0])} ${r2(pts[0][1])}${through(pts)}L${r2(pts[pts.length - 1][0])} ${bottom}L${r2(pts[0][0])} ${bottom}Z`, fill);
const above = (pts, top, fill) => below(pts, top, fill);

// Lamps on a cab front, seen from the side; a plug door's step box; horns.
const lamp = (x, y, r = 0.3) => circle(x, y, r + 0.1, "#d6d9de", 0.3) + circle(x, y, r, "#fff6d0");
const marker = (x, y, r = 0.22) => circle(x, y, r + 0.08, "#d6d9de", 0.3) + circle(x, y, r, "#c8202e");
const stepBox = (x, w, top, y = 2.2) => rect(x + 0.2, y, w - 0.4, top - y, WES.skirt, 0.4) + lines([[x + 0.4, y + (top - y) / 2, x + w - 0.4, y + (top - y) / 2]], "#5a6068", 0.6);
const horns = (x, roof) => rect(x, roof - 0.05, 1.3, 0.3, "#5a6068", 0.3, 'rx="0.1"') +
  path(poly([[x + 0.2, roof + 0.25], [x - 0.4, roof + 0.5], [x - 0.4, roof + 0.8], [x + 0.2, roof + 0.55]]), "#6a7078") +
  path(poly([[x + 1.1, roof + 0.25], [x + 1.7, roof + 0.45], [x + 1.7, roof + 0.75], [x + 1.1, roof + 0.55]]), "#6a7078");

// --- Colorado Railcar Aero DMU (1001-1003, built 2008 at Fort Lupton,
// Colorado) and its cab trailer (2001): single-level cars 85 ft over the
// couplers, 13 ft 7 in over the body roof and 14 ft 7 in over the radiator
// housings along it; GSI low-clearance trucks (8 ft 6 in wheelbase, 36 in
// wheels) about 65 ft apart; the floor about 3 ft 11 in over the rail,
// stairs at each door. One streamlined end (the "Aero" cab: a nearly
// upright nose, a big wraparound windshield, the cab roof swelling up into
// the radiator housings) and one flat end with a cab of its own, an end
// door and a diaphragm; the trailer has a cab only in its streamlined end.
// Each side: the windshield, the cab side window, two big windows, a
// double plug door, five windows, a second door, three windows (the last
// small). Each railcar has two 600 hp Detroit Diesel Series 60 engines
// under the floor driving Voith transmissions, their radiators on the roof;
// 74 seats (the trailer 80). Figures from Colorado Railcar's specification
// sheet (length, height) and TriMet (seats, engines); the trucks, floor,
// doors and windows measured from photographs side-on (Wikimedia Commons,
// 2009-2025), allowing for their perspective.
const AERO = {
  roof: 13.6, sill: 3.3, cornerR: 1.0, end: 0.6, trucks: { centers: 64.8, wb: 8.5, d: 36 }, diaphragm: [3.9, 12.2], badge: false,
  nose: [[1.8, 3.3], ["q", 0.45, 3.45, 0.4, 5.0], [0.5, 8.7], ["q", 0.6, 9.5, 1.35, 9.85], [3.4, 12.25], ["q", 4.3, 13.4, 6.2, 14.05],
    ["q", 8.2, 14.65, 10.6, 14.65], [11.6, 14.65], [11.8, 13.6]],
  cabLen: 9.5,
  rows: [{ xs: [13.7, 18.4], y: 7.0, w: 4.7, h: 3.3, r: 0.4 }, { xs: [34.8, 40.3, 45.8, 51.4, 56.6], y: 7.0, w: 4.6, h: 3.3, r: 0.4 },
    { xs: [71.6, 76.9], y: 7.0, w: 4.4, h: 3.3, r: 0.4 }, { xs: [81.8], y: 7.4, w: 1.7, h: 2.6, r: 0.35 }],
  doors: [{ x: 26.8, w: 4.3, y0: 3.9, y1: 11.0, leaves: 2, glassY: 0.36, glassH: 0.5, grabs: false }, { x: 64.6, w: 4.3, y0: 3.9, y1: 11.0, leaves: 2, glassY: 0.36, glassH: 0.5, grabs: false }],
};
// The streamlined cab seen from the side: the wraparound windshield (one
// pane, a pillar where it turns the corner), the cab side window, the
// wiper; the headlights and red markers on the nose; the anticlimber and
// coupler, the pilot striped white on black.
const aeroCab = (c, g) => path(poly([[1.55, 9.95], [3.45, 12.2], [8.6, 12.4], [9.2, 12.2], [9.2, 9.95]]), C.glass, 0, `stroke="${C.gasket}" stroke-width="0.6"`) +
  path(poly([[2.2, 10.9], [3.5, 12.0], [8.4, 12.15], [8.4, 11.3]]), C.glassLight) + line(6.6, 9.95, 6.9, 12.3, "#0b0d0f", 0.9) + line(3.2, 10.3, 4.6, 11.8, "#0b0d0f", 0.7) +
  win(10.1, 9.0, 2.6, 2.6, 0.4) + lamp(0.75, 6.4) + marker(0.75, 7.4) + marker(0.85, 8.5, 0.18) +
  path(poly([[0.4, 3.5], [1.9, 3.5], [1.9, 0.9], [0.5, 0.9], [0.1, 1.5]]), WES.black) +
  lines([[0.5, 1.2, 1.3, 3.3], [1.1, 1.0, 1.85, 2.9]], "#f4f4f4", 1.0) +
  rect(-0.25, 2.45, 1.7, 0.8, "#2a2d31", 0, 'rx="0.15"') + rect(-0.3, 2.2, 0.45, 1.3, "#2a2d31", 0, 'rx="0.12"');
// The flat end (at the right): its cab's lamps, the end door's diaphragm
// when coupled, the end sill striped like the pilot.
const flatEnd = (c, g) => {
  const x = g.x1;
  let s = lamp(x - 0.25, 6.4, 0.24) + marker(x - 0.25, 11.9, 0.2) + rect(x - 0.9, 2.3, 0.9, 1.0, WES.black) + lines([[x - 0.8, 2.4, x - 0.2, 3.2]], "#f4f4f4", 0.9);
  if (!c.coupledR) s += rect(x - 0.15, 2.45, 0.8, 0.8, "#2a2d31", 0, 'rx="0.15"');
  return s;
};
// The radiator housings along the roof: louvered panels each side, a sloped
// cap at the flat end; on the railcars their exhausts poke up.
function pods(c, g, fill, { exhaust = true } = {}) {
  const a = 11.8, b = g.x1 - 1.6, top = 14.6;
  let s = path(poly([[a, 13.55], [a, top], [b - 0.8, top], [b, 13.55]]), fill, 0.4);
  for (let x = a + 0.5; x < b - 2.5; x += 7.2) s += slats(x, 13.7, Math.min(6.4, b - 1.2 - x), 0.75, 0.24, "rgba(0,0,0,0.45)");
  if (exhaust) s += rect(36.5, top - 0.05, 0.6, 0.45, "#3a3f45") + rect(54.5, top - 0.05, 0.6, 0.45, "#3a3f45");
  return s + line(a + 0.2, top - 0.1, b - 1.0, top - 0.1, "rgba(255,255,255,0.25)", 0.5) + horns(4.0, 14.25);
}
// Under the floor: on a railcar its two engines and transmissions behind a
// louvered skirt, fuel tank and air reservoirs; on the trailer batteries
// and air reservoirs in the open.
function aeroUnder(c, g, power) {
  if (!power) return underframe(14.0, 26.4, 3.3, { depth: 1.1, boxes: 2 }) + underframe(31.6, 64.0, 3.3, { depth: 1.0, boxes: 3 }) +
    [26.8, 64.6].map((x) => stepBox(x, 4.3, 3.3)).join("");
  return [26.8, 64.6].map((x) => stepBox(x, 4.3, 3.3)).join("") + underframe(13.6, 26.4, 3.3, { depth: 1.0, boxes: 2, tanks: false }) +
    // The engines and transmissions (one set toward each truck), the fuel
    // tank between them; louvers in the skirt over the engines.
    rect(32.0, 1.7, 9.0, 1.6, "currentColor", 0, 'opacity="0.82" rx="0.2"') + rect(55.0, 1.7, 9.0, 1.6, "currentColor", 0, 'opacity="0.82" rx="0.2"') +
    rect(42.0, 1.9, 12.0, 1.4, "currentColor", 0, 'opacity="0.62" rx="0.6"') + line(42.6, 2.6, 53.4, 2.6, C.steelDark, 0.4) +
    [33.0, 56.0].map((x) => lines(seq(x, 0.55, 12).map((v) => [v, 3.85, v, 4.75]), "#24272c", 1.2)).join("");
}
// The railcars' paint (above): the blue sweep falls from the roof over the
// second big window to the window sills at the first door, runs under the
// windows and climbs back to the roof by the flat end's windows; the yellow
// rises from the bottom of the side after the first door to just under the
// windows at the second; a dark edge along the bottom of the side.
function aeroPaint(c, g) {
  const L = g.L;
  let s = rect(0, 0, L, 17, WES.white);
  s += above([[17.0, 15], [19.5, 13.6], [23.0, 11.3], [27.0, 8.2], [31, 6.7], [42, 6.4], [54, 6.55], [62, 7.6], [68.5, 9.6], [73.5, 12.0], [77.0, 13.7], [78.5, 15]], 15, WES.blue);
  s += path(`M31.1 3.7${through([[31.1, 3.7], [38, 4.0], [46, 4.5], [54, 5.1], [60, 5.5], [64.6, 5.75]]).slice(0)}L64.6 3.7Z`, WES.yellow);
  s += rect(0, 3.3, L, 0.4, WES.skirt) + rect(0, 0, L, 3.3, WES.black);
  return s;
}
const aeroDetail = (c, g) => wesName(c, 11.6, 5.7, 1.1, WES.navy) + letters(c, 45.0, 12.5, 0.55, "trimet.org", "#ffffff", { weight: 600 }) +
  circle(32.6, 5.6, 0.42, "#ffffff", 0, `stroke="${WES.orange}" stroke-width="0.25"`) + circle(32.6, 5.6, 0.22, WES.orange);
export const wesAero = (c) => bilevel({ ...c, cabL: true, cabR: false }, { ...AERO, base: WES.white, paint: aeroPaint, cab: aeroCab,
  extra: (c, g) => pods(c, g, "#59616b") + aeroUnder(c, g, true) + flatEnd(c, g) + aeroDetail(c, g) });
// The trailer's 2025 paint: royal blue; three orange stripes (the widest
// in the middle, thin blue gaps between) leaning back across the last two
// windows before the flat end's door; TRI MET WES in white under the cab
// side window, TriMet's mark white on the nose.
function trailerPaint(c, g) {
  const L = g.L, slant = 1.5;
  const stripe = (a, w) => path(poly([[a, 0], [a + w, 0], [a + w + slant, 15], [a + slant, 15]]), WES.orange);
  return rect(0, 0, L, 17, WES.royal) + stripe(47.8, 3.9) + stripe(52.6, 4.6) + stripe(57.9, 2.7) + rect(0, 0, L, 3.7, WES.navy);
}
export const wesTrailer = (c) => bilevel({ ...c, cabL: true, cabR: false }, { ...AERO, base: WES.royal, paint: trailerPaint, cab: aeroCab,
  extra: (c, g) => pods(c, g, "#1d39a8", { exhaust: false }) + aeroUnder(c, g, false) + flatEnd(c, g) +
    wesName(c, 11.6, 5.7, 1.1, "#ffffff", "#ffffff") + circle(0.9, 5.5, 0.3, "#ffffff") });

// --- Budd RDCs (1702: built 1953 as an RDC-3 for the New Haven, 129, then
// the Alaska Railroad's 702; 1711: built 1952 as an RDC-2, New Haven 121,
// then Alaska 711; in WES service since 2011): 85 ft over the couplers, 10
// ft wide, 14 ft 7 in over the roof; trucks 59 ft 6 in apart, 8 ft 6 in
// wheelbase, 36 in wheels; two Detroit Diesel engines under the floor, one
// driving the inner axle of each truck, their radiators and exhausts in
// shrouds on the roof at each end. A cab at each end, beside the end door;
// a vestibule with a side door at each end. The Alaska Railroad rebuilt
// their baggage and mail rooms for passengers: from the cab, the vestibule,
// a window-less panel, a long row of coach windows, then a short plain
// section with one door at the far end. Budd's figures (as carmodels.js's
// rdc); the far end's layout from photographs of both cars (Wikimedia
// Commons, 2017-2023), approximated.
// TriMet's paint: fluted stainless, the window band white, a blue
// letterboard with trimet.org in white, TRI MET WES at the cab end; the
// ends striped blue and yellow (seen edge-on here).
const BUDD = { roof: 13.5, sill: 3.9, cornerR: 1.1, end: 0.6, trucks: { centers: 59.5, wb: 8.5, d: 36 }, diaphragm: [4.25, 12.3], badge: false,
  rows: [{ xs: [11.6], y: 7.15, w: 3.7, h: 2.75, r: 0.35 }, { xs: seq(16.4, 4.55, 10), y: 7.3, w: 3.4, h: 2.5, r: 0.35 }],
  doors: [{ x: 1.6, w: 2.6, y0: 4.0, y1: 11.0, glassY: 0.55, glassH: 0.3 }, { x: 66.2, w: 2.6, y0: 4.0, y1: 11.0, glassY: 0.55, glassH: 0.3 },
    { x: 80.8, w: 2.6, y0: 4.0, y1: 11.0, glassY: 0.55, glassH: 0.3 }],
  roofItems: [[6.5, 13, 0.8], [65.5, 13, 0.8]] };
function rdcPaint(c, g) {
  const L = g.L;
  return rect(0, 0, L, 17, WES.stainless) + flutes(0, L, 4.1, 6.6, 0.26) + rect(0, 6.65, L, 4.0, WES.band) + rect(0, 10.65, L, 1.3, WES.letter) +
    rect(0, 10.6, L, 0.08, WES.navy) + rect(0, 11.9, L, 2, "#c3c9d0") + flutes(0, L, 12.0, 13.4, 0.3);
}
// An end striped blue and yellow, seen edge-on; the cab's end window.
const rdcEnd = (x) => seq(4.0, 0.7, 11).map((y, i) => rect(x, y, 0.5, 0.7, i % 2 ? "#f2c21b" : WES.navy)).join("");
export const wesRdc = (c) => bilevel({ ...c, cabL: true, cabR: true }, { ...BUDD, base: WES.stainless, paint: rdcPaint,
  extra: (c, g) => rdcEnd(0.6) + rdcEnd(g.L - 1.1) +
    // Engines and transmissions under the floor, by the inner axles.
    rect(20, 2.0, 12, 1.8, "currentColor", 0, 'opacity="0.8" rx="0.2"') + rect(53, 2.0, 12, 1.8, "currentColor", 0, 'opacity="0.8" rx="0.2"') +
    slats(21, 2.3, 4, 1.2, 0.3, "rgba(255,255,255,0.2)") + slats(54, 2.3, 4, 1.2, 0.3, "rgba(255,255,255,0.2)") +
    // The roof shrouds' exhaust stacks.
    rect(12.5, 14.25, 0.5, 0.9, "currentColor") + rect(72.0, 14.25, 0.5, 0.9, "currentColor") +
    wesName(c, 8.0, 7.6, 1.0, WES.letter) + letters(c, 42.0, 11.3, 0.55, "trimet.org", "#ffffff", { weight: 600 }) + letters(c, 74.0, 8.2, 0.95, "WES", WES.letter) });

export const TYPES = {
  wesAero: { name: "Colorado Railcar Aero railcar", kind: "emu" },
  wesTrailer: { name: "Colorado Railcar cab trailer", kind: "emu" },
  wesRdc: { name: "Budd Rail Diesel Car", kind: "emu" },
};
// oneEnd: drawn streamlined end first, and mirrored at the back of a train.
const M = (draw, len, oneEnd = false) => ({ draw, len, oneEnd, variant: null });
export const MODELS = {
  wesAero: M(wesAero, 85, true),
  wesTrailer: M(wesTrailer, 85, true),
  wesRdc: M(wesRdc, 85),
};
// Car numbers (TriMet's roster). The two RDC-1s TriMet bought in 2017 (2007
// and 2011) haven't entered service.
export const FLEETS = {
  wes: [[1001, 1003, "wesAero"], [2001, 2001, "wesTrailer"], [1702, 1702, "wesRdc"], [1711, 1711, "wesRdc"]],
};
// Two sets run, one or two cars each, coupled flat end to flat end with
// the streamlined ends outward: a railcar with the cab trailer or another
// railcar, or a railcar alone; the RDCs stand in as a pair.
export const TYPICAL = {
  wes: (t, reported) => {
    if (reported === "wesRdc") return { label: "Two Budd Rail Diesel Cars (WES's spares)", units: [["wesRdc", 2]] };
    if (reported === "wesTrailer") return { label: "The 2001 cab trailer with an Aero railcar", units: [["wesTrailer", 1], ["wesAero", 1]] };
    return { label: "Colorado Railcar Aero railcars, one or two (some trains with the 2001 cab trailer)", units: [["wesAero", 1], ["wesAero", 1]] };
  },
};

const WP = "https://en.wikipedia.org/wiki/";
export const FACTS = {
  wesAero: { model: "Colorado Railcar Aero DMU", type: "Diesel multiple unit", builder: "Colorado Railcar (Fort Lupton, Colorado)", built: "2008",
    fleet: "3 (1001–1003)", topSpeedMph: 90, powerHp: 1200, seats: 74, lengthFt: 85,
    about: "Built for WES's opening in February 2009, among the last cars Colorado Railcar finished before it closed. Each has two Detroit Diesel engines under the floor and can run alone or with a second car.",
    source: `${WP}Colorado_Railcar_DMU` },
  wesTrailer: { model: "Colorado Railcar Aero cab trailer", type: "Unpowered cab car", builder: "Colorado Railcar (Fort Lupton, Colorado)", built: "2008",
    fleet: "1 (2001)", topSpeedMph: 90, seats: 80, lengthFt: 85,
    about: "WES's one unpowered car, with a cab at its streamlined end from which it drives the railcar coupled to it. It came back in March 2025 in a new blue and orange paint.",
    source: `${WP}WES_Commuter_Rail` },
  wesRdc: { model: "Budd RDC", type: "Diesel railcar", builder: "Budd Company (Philadelphia)", built: "1952–1953",
    fleet: "2 (1702, 1711)", topSpeedMph: 85, powerHp: 550, lengthFt: 85,
    about: "Built for the New Haven Railroad, then run by the Alaska Railroad, which rebuilt them; TriMet bought them in 2009 and put them into WES service in 2011 as spares for the Aero cars.",
    source: `${WP}Budd_Rail_Diesel_Car` },
};
