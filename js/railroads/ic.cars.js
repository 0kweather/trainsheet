// PKP Intercity's cars (scripts/railroads/poland.py, agency "ic"): Poland's
// long-distance passenger railroad. Trainsheet's own side views at the
// shared scale (js/carart.js), each drawn from, and checked against, one
// photograph on Wikimedia Commons, named here fleet by fleet. Bodies and
// parts from czechia.cars.js (unit, euroLoco, hvac and the rest) and
// carmodels.js (coachCar); the IC mark and the lettering are drawn here (no
// logo files).
//
// What is from the photographs: each fleet's paint, the shape of its cab,
// and what can be counted on the side that faces the camera. Only the
// Husarz's photograph is a true side view; the other three are
// three-quarter views from the front, so the windows' spacing, the doors'
// places, the roof equipment, what hangs under the floor and every length
// are Trainsheet's reading of the type, not measurements. The lengths the
// drawings are scaled to are the figures usually published for each class,
// set down from memory and not checked against a source for this file (see
// MODELS); the fact sheets give only the two locomotives'. The file was
// verified after writing: node --check passes, every consist renders, and
// each drawing was looked at beside its photograph (22 Nov 2026).
//
//   ED250, the Pendolino (Alstom, seven cars): a full set on line 8 near
//     Słomniki ("Pendolino ED250 PKP Intercity na linii kolejowej nr 8 pod
//     Słomnikami 20200808 1010 3442.jpg"). Silver, the windows in a dark
//     band, a light blue line along the roof's edge and a blue band low on
//     the side over a gray skirt; the nose blue under the windshield with a
//     pale line over it, blue again sweeping up behind the windshield, the
//     windshield and the roof over it dark. Seven cars can be counted by
//     their roofs. The photograph looks down the train from ahead, so the
//     number of windows a car, the doors and where the pantographs sit are
//     a reading.
//   EU44 "Husarz" (Siemens ES64U4, a Taurus): EU44-002 in a yard, the one
//     true side view ("EU44-002 "HUSARZ".JPG"). Silver; a blue cap over
//     each cab and a blue line down behind the windshield; a thin
//     orange-red line under the roof's louvers between the cabs; on the
//     side two blue panels that fade out in dots toward the middle, the
//     shorter one behind one cab and the longer, carrying "HUSARZ", behind
//     the other; between them the IC mark (orange "iC", then "cc" in
//     outline) and "PKP INTERCITY"; a dark gray frame. The panels, the
//     lettering, the louvers and the line are placed from the photograph;
//     the nose is the Taurus's as czechia.cars.js draws it for ÖBB's 1216,
//     the same type.
//   EP09 (Pafawag): EP09-017 at Kraków Główny, from the front ("PKP
//     Intercity EP09-017, Kraków Główny, 2024 (03).jpg"). A blue front and
//     blue low on the cab's side, fading back in horizontal lines; the rest
//     of the side silver-gray with louvers high on it, a second row under
//     some; a gray frame; the headlight in a box on the roof; two
//     pantographs. The side is seen at a steep angle: how many louvers
//     there are and where, and where the IC mark and the name sit, are a
//     reading, and the far cab is taken to match the near one.
//   The coach: there is no photograph of a PKP Intercity coach of its own
//     in this set; the drawing is from the two coaches behind EP09-017 in
//     the same photograph, small and in shadow. What can be seen: light
//     gray sides, a turquoise door, a pale turquoise band low on the side.
//     (The set's manifest calls them "light grey with red stripe"; the
//     red-brown between the windows looks like the platform's orange
//     columns reflected, as on the locomotive's louvers, and is not drawn
//     as paint.) Everything else about the coach (ten windows, a door at
//     each end, 26.4 m) is the standard European coach and a guess. The
//     same coach is drawn behind both locomotives. PKP Intercity has
//     newer paint (navy over light gray, as czechia.cars.js draws its
//     night cars from other photographs); it is not used here because no
//     photograph in this set shows it.
//   ED160, the FLIRT (Stadler, built at Siedlce as its side says):
//     ED160-007 at Toruń Główny, from the front ("ED160 PKP Intercity,
//     Toruń Główny (2024-04-27).jpg"). A blue front, roof and lower side;
//     pale blue-white between; the windows in a black band that begins
//     behind the cab; the cab's side window in a black panel of its own;
//     single-leaf doors, pale above and blue below; the IC mark and "PKP
//     INTERCITY" under the first windows; a white 2 by the door. The
//     photograph looks along the train: five sections can be told apart
//     before it is lost in the distance, so the eight drawn are the figure
//     usually published for the class, not a count, and the windows a
//     section and the pantograph's place are a reading.
// No sleeping car or couchette is in this set, so none is drawn: the night
// trains are drawn as day coaches and their labels say so.
//
// The timetable names no locomotive or unit, so which fleet a train is
// drawn as is a judgement, labeled as typical; see TYPICAL below, where
// each rule is set out.

import { coachCar } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, poly, win, truck, underframe } from "../carart.js?v=dev";
import { unit, euroLoco, mark, letters, hvac, buffers } from "./czechia.cars.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 2, depth = 1.0) => underframe(a, b, top, { depth, boxes: k, tanks: false });
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const txt = (x, y, h, text, fill, { weight = 700, style = "", anchor = "middle", extra = "" } = {}) =>
  `<text x="${n(x)}" y="${n(y + h * 0.36)}" font-size="${n(h)}" text-anchor="${anchor}" font-weight="${weight}" font-family="${FONT}" fill="${fill}"${style ? ` font-style="${style}"` : ""}${extra ? " " + extra : ""}>${text}</text>`;

const IC = { orange: "#e9531f", navy: "#1f2e78" };
// The IC mark, h tall, its middle at (x, y): "iC" in orange italics, "cc"
// after it in outline; name: "PKP INTERCITY" after that, in a color.
const icMark = (c, x, y, h, name = null, ground = "#ffffff") => mark(c, x, y,
  txt(0, 0, h, "iC", IC.orange, { weight: 800, style: "italic", anchor: "end" }) +
  txt(h * 0.04, 0, h, "cc", ground, { weight: 800, style: "italic", anchor: "start", extra: `stroke="${IC.navy}" stroke-width="${n(h * 0.045)}"` }) +
  (name ? txt(h * 1.25, h * 0.18, h * 0.3, "PKP INTERCITY", name, { weight: 700, style: "italic", anchor: "start" }) : ""));
// A panel fading out in bars, as the dots of the paint do: from x, w long,
// toward dir.
const fade = (x, w, y, h, fill, dir = 1, k = 10) => seq(0, w / k, k).map((d, i) => {
  const bw = (w / k) * (1 - (i + 0.5) / k);
  return rect(dir > 0 ? x + d : x - d - bw, y, bw, h, fill);
}).join("");

// ---------- ED250: the Pendolino ----------
// Seven cars, each on two trucks of its own; a long pointed nose under a
// deep windshield, nothing showing at its tip; the windows in a dark band.
const PD = { silver: "#cfd3d6", roof: "#b3b8bd", band: "#20252b", blue: "#2478d0", sky: "#6fb0e4", pale: "#eef1f3", skirt: "#959ba2", dark: "#2a2f36", door: "#c4c9cd" };
const PDG = { roof: 12.8, sill: 3.6 };
const NOSE_PD = [[1.6, 3.6], [0.7, 4.7], ["q", 0.4, 6.3, 2.6, 7.7], [10.2, 12.0], ["q", 11.8, 12.8, 14.8, 12.8]];
function pendoPaint(cab) {
  return (c, g) => {
    const L = g.L, a = cab ? 20.5 : 5.4;
    return bands(L, [[0, 20, PD.silver], [11.85, 3, PD.roof], [11.5, 0.35, PD.sky], [4.75, 0.95, PD.blue], [0, 3.95, PD.skirt]]) +
      rect(a, 6.95, L - a - 5.4, 3.4, PD.band, 0, 'rx="0.5"') +
      (cab
        // The nose: silver over the cab's side, blue under the windshield
        // running back into the low band, a pale line over the blue; blue
        // again from the nose up to the roof behind the windshield; the
        // roof over the windshield dark.
        ? rect(-1, 3.95, 20, 9, PD.silver) + path("M-1 3.6L-1 7.95Q8 7.5 12.5 6.5Q16 5.7 20.5 5.7L20.5 4.75L15 4.75Q10.5 4.5 8.4 3.6Z", PD.blue) +
          path("M-1 8.3Q8 7.85 12.6 6.85Q16 6.05 20.5 6.05L20.5 5.7Q16 5.7 12.5 6.5Q8 7.5 -1 7.95Z", PD.pale) +
          path("M9.6 7.0Q14 9.6 17.2 12.9L19.6 12.9Q16 9.0 12.2 6.75Z", PD.blue) + path("M9.6 11.3L18.4 12.2L19.2 14L9.6 14Z", PD.dark)
        : "");
  };
}
const pdDoor = (x) => ({ x, w: 2.7, y0: PDG.sill, y1: 10.6, leaves: 1, glassY: 0.5, glassH: 0.36, grabs: false, fill: PD.door });
const pdRoof = (L, a) => rect(a, PDG.roof - 0.05, L - a - 2, 0.35, "#c3c8ce", 0.4, 'rx="0.17"') + hvac(L / 2 - 6, PDG.roof, 12, 0.6);
const pendoCab = (c) => unit(c, { roof: PDG.roof, sill: PDG.sill, nose: NOSE_PD, rake: [[2.6, 7.7], [10.2, 12.0]], depth: 3.6, cabLen: 19, lampY: 5.9, bare: true,
  rows: [{ xs: seq(22.0, 5.6, 11), y: 7.3, w: 4.3, h: 2.6, r: 0.35 }], doors: [pdDoor(c.L - 4.6)],
  trucks: [14.0, c.L - 10.0], wheel: 35, paint: pendoPaint(true), surround: "#14171b",
  // The cab's side window, raked like the front.
  cab: () => path("M14.6 7.6L18.6 7.6L18.6 10.2L16.8 10.2Z", "#1d2026", 0.4),
  extra: (cc, g) => pdRoof(g.L, 21) + boxes(20, g.L - 16, PDG.sill, 3, 1.2) });
const pendoMid = (c) => unit(c, { roof: PDG.roof, sill: PDG.sill,
  rows: [{ xs: seq(6.9, 5.6, 13), y: 7.3, w: 4.3, h: 2.6, r: 0.35 }], doors: [pdDoor(1.7), pdDoor(c.L - 4.4)],
  trucks: [10.0, c.L - 10.0], wheel: 35, paint: pendoPaint(false),
  // A pantograph on the third and fifth cars (a reading).
  pan: c.index === 2 || c.index === 4 ? c.L / 2 - 6 : null,
  extra: (cc, g) => (c.index === 2 || c.index === 4 ? rect(2, PDG.roof - 0.05, 20, 0.35, "#c3c8ce", 0.4, 'rx="0.17"') : pdRoof(g.L, 2)) + boxes(16, g.L - 16, PDG.sill, 3, 1.2) });

// ---------- EU44 "Husarz" ----------
// The Taurus: a rounded nose under a deep windshield raked well back,
// smooth sides, louvers high under the roof toward each end. The nose and
// trucks are the ES64U4's as czechia.cars.js has them; the paint and what
// is on the side are from the side view of EU44-002, whose two ends differ.
const HZ = { silver: "#e3e5e7", roof: "#d3d6d9", blue: "#2c4fae", orange: "#e9531f", frame: "#55595f", navy: IC.navy };
const NOSE_TAURUS = [[1.7, 4.1], [1.1, 6.3], ["q", 0.95, 8.5, 2.3, 9.3], [3.9, 12.15], ["q", 4.6, 13.0, 6.4, 13.0]];
// One half's side: the blue cap over the cab, the blue line down behind the
// windshield, the orange line under the louvers, the frame; the blue panel
// solid from a to b and fading out by e, the cap cap long (feet from that
// end).
const husarzSide = (a, b, e, cap) => (c, L) => bands(L, [[0, 20, HZ.silver], [12.25, 3, HZ.roof], [0, 5.0, HZ.frame]]) + rect(cap + 0.1, 10.85, L, 0.27, HZ.orange) +
  path(`M-1 11.6L${cap - 1.1} 11.6Q${cap} 11.65 ${cap} 12.6L${cap} 14L-1 14Z`, HZ.blue) + path("M2.9 5.0L3.9 5.0Q4.0 8.6 5.4 11.6L4.3 11.6Q3.0 8.6 2.9 5.0Z", HZ.blue) +
  rect(a, 5.95, b - a, 3.0, HZ.blue) + fade(b, e - b, 5.95, 3.0, HZ.blue);
const husarz = (c) => euroLoco(c, { roof: 13.0, sill: 4.1, nose: NOSE_TAURUS, rake: [[2.3, 9.3], [3.9, 12.15]], centers: 32.5, wheel: 45, surround: "#141518",
  doors: [9.9, 6.8], doorW: 2.4, doorGlass: false, paint: husarzSide(14.2, 17.0, 22.4, 14.3), paintR: husarzSide(9.3, 18.9, 24.8, 9.4),
  grilles: [[-17.1, 9.0, 11.25, 12.1], [14.6, 7.7, 11.25, 12.1]], grilleFill: "rgba(20,22,25,0.3)",
  over: (cc, L) => win(6.3, 8.9, 3.2, 2.2, 0.3) +
    // The two round ports in each door.
    [10.55, L - 7.45].map((x) => [6.7, 8.5].map((y) => circle(x, y, 0.36, HZ.silver, 0.5)).join("")).join("") +
    icMark(cc, 25.6, 7.45, 3.0, null, HZ.silver) + letters(cc, 34.3, 6.3, 0.8, "PKP INTERCITY", HZ.navy, { weight: 700, style: "italic" }) +
    letters(cc, 52.3, 6.75, 0.62, "HUSARZ", "#ffffff", { weight: 700, style: "italic" }) + letters(cc, 46.5, 4.55, 0.36, "5 370 002", "#e9ecef", { weight: 600 }) });

// ---------- EP09 ----------
// A four-axle box: a flat front leaning back a little above the waist, two
// windshield panes, the headlight in a box on the roof; a door behind each
// cab between long handrails; louvers high on the side. Drawn the same at
// both ends (the photograph shows one).
const EP = { blue: "#2f3fb4", silver: "#b9bbbc", roof: "#8d9298", frame: "#6c7178", rail: "#e6e8ea" };
const NOSE_EP = [[0.95, 4.1], [0.8, 8.3], [1.5, 12.0], ["q", 1.65, 12.9, 2.9, 12.9]];
const epSide = (c, L) => bands(L, [[0, 20, EP.silver], [11.95, 3, EP.roof]]) +
  // The front blue to the roof; the cab's side blue below the waist, fading
  // back in lines; the frame, gray round the front too.
  rect(-1, 0, 3.7, 11.95, EP.blue) + rect(-1, 0, 11, 8.3, EP.blue) + seq(5.25, 0.44, 7).map((y) => rect(10, y, 7.2, 0.22, EP.blue)).join("") +
  rect(-1, 0, L + 2, 5.0, EP.frame) + rect(-1, 5.0, L + 2, 0.12, "rgba(255,255,255,0.35)");
const ep09 = (c) => euroLoco(c, { roof: 12.9, sill: 4.1, nose: NOSE_EP, rake: [[0.85, 8.6], [1.5, 12.0]], centers: 27.9, wheel: 49, surround: "#1d2026",
  door: 7.4, doorW: 2.0, doorGlass: false, paint: epSide,
  // The upper row of louvers and the shorter lower row (from the middle).
  grilles: [[-15.0, 4.5, 8.9, 11.6], [-8.0, 4.5, 8.9, 11.6], [-2.9, 4.5, 8.9, 11.6], [2.2, 4.5, 8.9, 11.6], [-2.9, 4.5, 6.5, 8.5], [2.2, 4.5, 6.5, 8.5]],
  grilleFill: "rgba(40,42,46,0.6)",
  over: (cc, L) => [0, 1].map((k) => { const x = (v) => (k ? L - v : v);
    // The cab's side window in the silver; the long handrails by each
    // door; the headlight's box on the roof.
    return win(Math.min(x(4.2), x(6.1)), 8.9, 1.9, 2.3, 0.3) + line(x(7.0), 4.6, x(7.0), 10.6, EP.rail, 1.3) + line(x(9.8), 4.6, x(9.8), 10.6, EP.rail, 1.3) +
      rect(Math.min(x(1.9), x(3.5)), 12.85, 1.6, 0.9, EP.roof, 0.4, 'rx="0.2"') + rect(k ? x(1.9) - 0.1 : x(1.9) - 0.25, 13.05, 0.35, 0.5, "#fff6d8", 0.3, 'rx="0.12"'); }).join("") +
    icMark(cc, L - 17.2, 7.3, 1.5, null, EP.silver) + letters(cc, 20.0, 6.25, 0.62, "PKP INTERCITY", "#7d86b8", { weight: 700, style: "italic" }) });

// ---------- The coach ----------
// The standard 26.4 m coach on two trucks 19 m apart, a door at each end,
// ten windows between (a guess; see the header). Light gray, a pale
// turquoise band low on the side, turquoise doors.
const CO = { gray: "#c9cccf", roof: "#9aa0a6", teal: "#1f9fa3", band: "#8fd0cd", skirt: "#3a3d42" };
function coach(c) {
  const L = c.L, roof = 13.3, sill = 3.9, xs = [2.0, L - 4.6];
  return coachCar(c, { roof, sill, end: 0.6, endR: 1.2, base: CO.gray, badge: false, under: true,
    trucks: { centers: 62.3, wb: 8.2, d: 36 }, diaphragm: [4.25, 11.8],
    rows: [{ a: 6.0, b: L - 6.0, y: 7.4, w: 4.6, h: 3.1, pitch: 6.45, r: 0.45 }],
    doors: xs.map((x) => ({ x, w: 2.6, h: 7.0, glassY: 0.5, glassH: 0.38 })),
    livery: () => bands(L, [[12.4, 3, CO.roof], [4.7, 1.7, CO.band], [0, 4.25, CO.skirt]]) + xs.map((x) => rect(x, sill + 0.15, 2.6, 7.0, CO.teal)).join(""),
    extra: () => hvac(L / 2 - 7, roof, 14, 0.7) + [14, L - 14].map((x) => path(`M${x - 1.1} ${roof - 0.05}Q${x} ${roof + 0.7} ${x + 1.1} ${roof - 0.05}Z`, C.steelDark, 0.4)).join("") +
      buffers(0, -1, { sill }) + buffers(L, 1, { sill }) });
}

// ---------- ED160: the FLIRT ----------
// Eight sections sharing a truck at each joint, a truck of its own under
// each cab: a rounded nose under a deep windshield; the cab's side window a
// black panel raked at the front; the windows in one black band; single
// plug doors.
const FL = { blue: "#22409c", pale: "#dbe3f0", band: "#17191d", door: "#dbe3f0" };
const FLG = { roof: 13.9, sill: 3.0, low: 5.0, band: [6.9, 4.1] };
const NOSE_FL = [[1.3, 3.0], [0.9, 5.6], ["q", 0.9, 7.0, 2.2, 8.1], [6.3, 12.9], ["q", 7.0, 13.9, 9.2, 13.9]];
function flirtPaint(cab) {
  return (c, g) => {
    const L = g.L, [by, bh] = FLG.band;
    return bands(L, [[0, 20, FL.pale], [12.85, 3, FL.blue], [0, FLG.low, FL.blue]]) +
      (cab ? path(`M28.2 ${by}Q27 ${by} 27 ${by + 1.2}L27 ${by + bh - 1.2}Q27 ${by + bh} 28.2 ${by + bh}L${L + 1} ${by + bh}L${L + 1} ${by}Z`, FL.band) : rect(-1, by, L + 2, bh, FL.band)) +
      // The front: blue from the roof round to the lower side, its back
      // edge curving past the cab's side window; a pale line low on the
      // nose, running back into the pale side.
      (cab ? path(`M-1 20L13.4 20L12.8 12.85Q9.2 11.6 8.3 8.4Q8.4 6.4 11.6 ${FLG.low}L-1 ${FLG.low}Z`, FL.blue) + rect(-1, 4.5, 12.6, 0.5, FL.pale) : "");
  };
}
const flDoor = (x) => ({ x, w: 3.2, y0: FLG.sill, y1: 11.0, leaves: 1, glassY: 0.4, glassH: 0.5, grabs: false, fill: FL.door });
// The doors' lower part, blue with the side; the 2 beside each.
const flDoorFoot = (c, xs) => xs.map((x) => rect(x + 0.06, FLG.sill + 0.06, 3.08, FLG.low - FLG.sill - 0.06, FL.blue) + letters(c, x + 4.1, 9.9, 1.1, "2", "#ffffff", { weight: 600 })).join("");
const flWin = (xs, w = 4.2) => ({ xs, y: 7.3, w, h: 3.3, r: 0.35 });
const flirtCab = (c) => unit(c, { roof: FLG.roof, sill: FLG.sill, nose: NOSE_FL, rake: [[2.2, 8.1], [6.3, 12.9]], depth: 3.2, cabLen: 17, lampY: 4.2,
  rows: [flWin([28.6, 33.6]), flWin(seq(44.6, 5.0, 4))], doors: [flDoor(39.4)], diaphragm: [3.2, 12.2],
  paint: flirtPaint(true), surround: "#111214",
  cab: () => path("M8.9 7.3L15.6 7.3L15.6 11.5L12.3 11.5Q10.0 10.2 8.9 7.3Z", "#1d2026", 0.4) + line(13.3, 7.3, 13.3, 11.5, "#3b444e", 0.7),
  extra: (cc, g) => truck(13.6, { wb: 8.2, d: 36, top: FLG.sill }) + truck(g.L, { wb: 8.86, d: 30, top: FLG.sill }) + flDoorFoot(cc, [39.4]) +
    hvac(22, FLG.roof, 10) + hvac(46, FLG.roof, 10) + boxes(26, 38, FLG.sill, 2, 0.6) + icMark(cc, 30.6, 5.95, 1.3, IC.navy, FL.pale) });
const flirtMid = (c) => unit(c, { roof: FLG.roof, sill: FLG.sill,
  rows: [flWin(seq(3.0, 5.0, 4)), flWin(seq(29.6, 5.0, 5))], doors: [flDoor(24.4)], diaphragm: [3.2, 12.2], paint: flirtPaint(false),
  // A pantograph on the fourth section (a reading).
  pan: c.index === 3 ? c.L / 2 + 6 : null,
  extra: (cc, g) => truck(0, { wb: 8.86, d: 30, top: FLG.sill }) + truck(g.L, { wb: 8.86, d: 30, top: FLG.sill }) + flDoorFoot(cc, [24.4]) +
    (c.index === 3 ? hvac(4, FLG.roof, 12) : hvac(4, FLG.roof, 12) + hvac(g.L - 20, FLG.roof, 12)) + boxes(30, 46, FLG.sill, 2, 0.6) });

// ---------- Tables ----------

export const TYPES = {
  plEd250Cab: { name: "ED250 Pendolino end car", kind: "emu" },
  plEd250Mid: { name: "ED250 Pendolino intermediate car", kind: "emu" },
  plEu44: { name: "EU44 Husarz electric locomotive", kind: "electric" },
  plEp09: { name: "EP09 electric locomotive", kind: "electric" },
  plIcCoach: { name: "PKP Intercity coach", kind: "coach" },
  plEd160Cab: { name: "ED160 FLIRT end section", kind: "emu" },
  plEd160Mid: { name: "ED160 FLIRT intermediate section", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers (or to the joint's center), from the figures
// usually published, set down from memory and not checked for this file:
// the ED250 187.4 m as seven cars (drawn as end cars of 28.2 m and
// intermediates of 26.2 m); the EU44 19.58 m (the ES64U4's, as
// czechia.cars.js has it for ÖBB's 1216); the EP09 16.74 m; the coach drawn
// at the standard 26.4 m (a guess; PKP Intercity's coaches are of several
// lengths); the ED160 about 152.9 m as eight sections, how that divides
// between the end sections (21.2 m here) and the others (18.4 m) a guess.
export const MODELS = {
  plEd250Cab: M(pendoCab, 92.5, true),
  plEd250Mid: M(pendoMid, 86.0, false, byIndex),
  plEu44: M(husarz, 64.24),
  plEp09: M(ep09, 54.9),
  plIcCoach: M(coach, 86.6),
  plEd160Cab: M(flirtCab, 69.6, true),
  plEd160Mid: M(flirtMid, 60.4, false, byIndex),
};

const set = (label, ...units) => ({ label, units });
const hauled = (loco, k) => [[loco, 1], ["plIcCoach", k]];
const PENDOLINO = set("Typical: an ED250 Pendolino, seven cars (Express InterCity Premium)", ["plEd250Cab", 1], ["plEd250Mid", 5], ["plEd250Cab", 1]);
const FLIRT = set("Typical: an ED160 FLIRT eight-section electric unit (a judgement: the timetable names no unit, and locomotives with coaches run on these lines too)",
  ["plEd160Cab", 1], ["plEd160Mid", 6], ["plEd160Cab", 1]);
const HUSARZ = (k) => set("Typical: an EU44 Husarz electric locomotive and coaches (which locomotive is a judgement; the timetable names none)", ...hauled("plEu44", k));
const EP09 = (k) => set("Typical: an EP09 electric locomotive and coaches (which locomotive is a judgement; the timetable names none)", ...hauled("plEp09", k));
const NIGHT = set("Drawn as an EU44 Husarz and day coaches; this night train's sleeping cars and couchettes are not drawn yet", ...hauled("plEu44", 7));
const UKRAINE = set("Drawn as an EU44 Husarz and PKP Intercity coaches; this train to or from Ukraine has its own cars, which are not drawn", ...hauled("plEu44", 6));

// The timetable (the Polish Trains GTFS) names no locomotive or unit, and
// PKP Intercity's lines are just its categories (poland.py: "IC", "EIP",
// "TLK"), so a train is placed by the category in its number ("EIP 1302/3",
// "EC/EIC 17000/1", "EN/IC 14010/1"; its line when it has no number) and by
// its two ends. Every rule below is a judgement except the first.
//   EIP: the Pendolino. (Express InterCity Premium is the Pendolino's own
//     category.)
//   EN, alone or with another category (EN/IC, the Munich trains): a night
//     train. No sleeping car is in the photographs, so it is drawn as the
//     Husarz with day coaches and the label says so.
//   MP, IC+, IC/MP, and any train with an end in Ukraine (its name in
//     Cyrillic in the timetable): the trains between Przemyśl, Chełm or
//     Warsaw and Ukraine. Drawn as the Husarz and coaches; the label says
//     the train's own cars are not drawn.
//   EC and EIC, alone or together or with IC (EC/EIC, EC/IC): the Husarz
//     and seven coaches. The EU44 was bought for the Berlin-Warsaw trains,
//     which is as much as stands behind this.
//   IC with both ends among Warsaw's stations, Łódź Fabryczna, Kraków
//     Główny and Olsztyn Główny: the ED160 FLIRT. PKP Intercity's FLIRTs
//     were bought for IC trains between Warsaw and Łódź, Kraków and
//     Olsztyn, as far as Trainsheet knows (from memory, not checked against
//     PKP Intercity's own listings); locomotives and coaches run there too.
//   Every other TLK, and every other IC with an end at Kraków Główny: the
//     EP09 and coaches (the EP09 was photographed there at the head of such
//     a train; the split between the two locomotives is otherwise
//     arbitrary, and PKP Intercity's other locomotives, EP07 and EU160
//     among them, which haul many of these trains, are not drawn).
//   Everything else, and any train not placed: the Husarz and six coaches.
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L").toLowerCase().trim();
const FLIRT_ENDS = /^(warszawa|lodz fabryczna|krakow glowny|olsztyn glowny)/;
const CYRILLIC = /[Ѐ-ӿ]/;
export const TYPICAL = {
  ic: (t = {}) => {
    const num = String(t.number || "").trim().toUpperCase();
    const head = (/^[A-Z+/]+/.exec(num) || [""])[0] || String(t.route || t.line || "").trim().toUpperCase();
    const cats = head.split("/"), has = (k) => cats.includes(k);
    const a = fold(t.origin), b = fold(t.destination || t.dest);
    if (has("EIP")) return PENDOLINO;
    if (has("EN")) return NIGHT;
    if (has("MP") || has("IC+") || CYRILLIC.test(`${t.origin || ""}${t.destination || t.dest || ""}`)) return UKRAINE;
    if (has("EC") || has("EIC")) return HUSARZ(7);
    if (has("IC") && a && b && FLIRT_ENDS.test(a) && FLIRT_ENDS.test(b)) return FLIRT;
    if (has("TLK")) return EP09(5);
    if (has("IC") && (/^krakow glowny/.test(a) || /^krakow glowny/.test(b))) return EP09(6);
    return HUSARZ(6);
  },
};

// Sources: the photograph each drawing was checked against (Wikimedia
// Commons). Builders are the commonly published ones, set down from memory
// (the ED160's is on its side in the photograph); the two lengths are the
// published ones, not checked for this file; figures Trainsheet could not
// stand behind are left out.
const CM = "https://commons.wikimedia.org/wiki/File:";
const fPendo = { model: "ED250 Pendolino", type: "Electric multiple unit", builder: "Alstom",
  source: `${CM}Pendolino_ED250_PKP_Intercity_na_linii_kolejowej_nr_8_pod_S%C5%82omnikami_20200808_1010_3442.jpg` };
const fFlirt = { model: "ED160 (Stadler FLIRT)", type: "Electric multiple unit", builder: "Stadler, Siedlce",
  source: `${CM}ED160_PKP_Intercity%2C_Toru%C5%84_G%C5%82%C3%B3wny_%282024-04-27%29.jpg` };
export const FACTS = {
  plEd250Cab: { ...fPendo,
    about: "An end car of PKP Intercity's seven-car Pendolino, the train of its fastest category, Express InterCity Premium, between Warsaw, Gdynia, Kraków, Katowice and Wrocław. Silver with a blue nose and a blue band low on the side; the set photographed is on the line north of Kraków." },
  plEd250Mid: { ...fPendo,
    about: "An intermediate car of the Pendolino. Unlike the regional units' sections, each car rides on two trucks of its own; where the pantographs sit is Trainsheet's reading, the photograph being taken from ahead of the train." },
  plEu44: { model: "EU44 \"Husarz\" (Siemens ES64U4)", type: "Electric locomotive", builder: "Siemens", lengthFt: 64.2,
    source: `${CM}EU44-002_%22HUSARZ%22.JPG`,
    about: "PKP Intercity's Taurus, a multi-system locomotive named for Poland's winged hussars, bought for the Berlin–Warsaw trains. Silver with blue cabs, blue panels fading out along the side and the IC mark between them; the one photographed is EU44-002." },
  plEp09: { model: "EP09", type: "Electric locomotive", builder: "Pafawag, Wrocław", lengthFt: 54.9,
    source: `${CM}PKP_Intercity_EP09-017%2C_Krak%C3%B3w_G%C5%82%C3%B3wny%2C_2024_%2803%29.jpg`,
    about: "The four-axle express locomotive Pafawag built in Wrocław for Poland's 3 kV lines. Blue across the front and low on the cab, silver-gray along the side with its rows of louvers; the one photographed at Kraków Główny is EP09-017." },
  plIcCoach: { model: "PKP Intercity coach", type: "Locomotive-hauled passenger coach",
    source: `${CM}PKP_Intercity_EP09-017%2C_Krak%C3%B3w_G%C5%82%C3%B3wny%2C_2024_%2803%29.jpg`,
    about: "A PKP Intercity coach as far as it can be seen behind EP09-017 at Kraków Główny: light gray with turquoise doors and a pale turquoise band low on the side. The windows and length are those of the standard European coach, a guess; PKP Intercity's fleet is of many types and also wears a newer navy and gray." },
  plEd160Cab: { ...fFlirt,
    about: "An end section of PKP Intercity's long-distance FLIRT, built by Stadler at Siedlce: a blue front, roof and lower side, pale between, the windows in a black band. The unit photographed at Toruń Główny is ED160-007." },
  plEd160Mid: { ...fFlirt,
    about: "An intermediate section of the ED160; the sections share a truck at each joint. Eight sections is the figure usually published for the class: the photograph, taken along the train, shows five before they are lost in the distance." },
};
