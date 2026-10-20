// Hellenic Train's cars (scripts/railroads/hellenictrain.py). The tracker
// names each train's unit or locomotive (locomotiveNumber: "460110" is
// Desiro set 460 110's cab car, "120015" a class 120 locomotive), so a
// train is drawn as that model's usual formation; one with no number known
// here, as what usually runs on its line. Bodies and parts from
// czechia.cars.js; the paint, the coaches and the lettering are drawn here,
// each from photographs of the trains in 2025-26 (Wikimedia Commons'
// "J26" series at Thessaloníki, June 2026, among them).
//
// What Hellenic Train runs in October 2026: the class 120 electric and
// class 220 diesel locomotives with its Intercity coaches (ADmz, Amz,
// WRmz, Bmz, Bmpz), the Siemens Desiro EMUs (class 460), the Stadler GTW
// railcars (class 560) and the MAN-2000 DMUs (class 621). Not drawn,
// because none of them carries passengers now: the five ETR 470 tilting
// trains, laid up since mid-2025 and to be rebuilt (athenstransport.com,
// July 2026); the two Hitachi HTR 412 "Blues" hybrids, still in testing
// (commercial service from the end of 2026 at the earliest); the 23 Alstom
// Coradia Streams ordered in December 2025, due from 2027. The metre-gauge
// GTWs (class 4500, Patras and Katakolo) and the Diakopto-Kalavryta rack
// railcars (class 3107) run lines the tracker's timetable doesn't have.

import { C, rect, path, line, lines, poly, truck, slats, underframe, flutes } from "../carart.js?v=dev";
import { bilevel, coachCar } from "../carmodels.js?v=dev";
import { euroLoco, unit, letters, mark, hvac, exhaust, tank, buffers, HT } from "./czechia.cars.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const plug = (x, sill, top, w = 4.4) => ({ x, w, y0: sill, y1: top, leaves: 2, glassY: 0.4, glassH: 0.45 });
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 3, depth = 1.3) => underframe(a, b, top, { depth, boxes: k, tanks: false });

// Hellenic Train's mark as on its trains since 2023: a ring round a "T"
// (the rail and its sleeper seen end on), the name in capitals beside it.
// Drawn as a sign here, not the logo artwork. stacked: the ring over the
// name in two lines, as on the class 120s' sides.
const ring = (h, color) => `<circle cx="0" cy="0" r="${n(0.62 * h)}" fill="none" stroke="${color}" stroke-width="${n(0.15 * h)}"/>` +
  `<path d="M${n(-0.36 * h)} ${n(-0.24 * h)}L${n(0.36 * h)} ${n(-0.24 * h)}M0 ${n(-0.24 * h)}L0 ${n(0.42 * h)}" fill="none" stroke="${color}" stroke-width="${n(0.16 * h)}"/>`;
const htMark = (c, x, y, h, color = HT.blue) => {
  const k = c.mirrored ? -1 : 1;
  return mark(c, x - k * 4.55 * h, y, ring(h, color)) + letters(c, x + k * 0.35 * h, y, h * 0.86, "HELLENIC TRAIN", color, { weight: 700, spacing: "0.03em" });
};
const htStack = (c, x, y, h, color = "#ffffff") => mark(c, x, y + 1.3 * h, ring(h, color)) +
  letters(c, x, y, h * 0.62, "HELLENIC", color, { weight: 700, spacing: "0.04em" }) + letters(c, x, y - 0.75 * h, h * 0.62, "TRAIN", color, { weight: 700, spacing: "0.04em" });

// Siemens Desiro (class 460, built at Hellenic Shipyards, Skaramangas,
// 2004-06; 460 101/201-120/220): five articulated sections, 89.3 m, 2.8 m
// wide, on Jakobs trucks at the joints and a motor truck under each cab; a
// big raked windshield over a rounded nose; one double door a side in each
// section, the pantograph on the middle one. Two sets often run coupled.
// The Proastiakos's paint, as Hellenic Train keeps it: white, violet along
// the bottom under a lilac line, rising round the nose to the windshield
// and over the roof's leading edge; yellow doors (corrected from cream,
// after photographs of 460 104 and 460 115 in 2025 and Wikipedia's "the
// doors are yellow"); Hellenic Train's mark in blue behind the cab
// (replacing the "Proastiakos" lettering these sets no longer carry).
const NOSE_460 = [[1.2, 3.6], [0.9, 5.4], ["q", 0.8, 7.0, 1.6, 8.0], [4.6, 12.6], ["q", 5.6, 13.9, 7.6, 13.9]];
const desiroPaint = (cab) => (c, g) => bands(g.L, [[0, 20, HT.cream], [12.9, 3, "#c3c8ce"], [0, 5.5, HT.violet], [5.5, 0.22, HT.lilac]]) +
  (cab ? path("M-1 0L-1 8.2Q2.4 8.5 4.6 7.0Q6.8 5.5 9.6 5.5L9.6 0Z", HT.violet) + path("M-1 8.2Q2.4 8.5 4.6 7.0Q6.8 5.5 9.6 5.5L9.6 5.72Q6.9 5.72 4.8 7.2Q2.5 8.75 -1 8.45Z", HT.lilac) +
    path("M-1 11.4Q3.6 11.5 6.4 12.4Q9.0 13.3 12.5 13.4L12.5 15L-1 15Z", HT.violet) : "");
const desiroCab = (c) => unit(c, { roof: 13.9, sill: 3.6, nose: NOSE_460, rake: [[1.6, 8.0], [4.6, 12.6]], cabLen: 8, low: 5.0, lampY: 5.0,
  rows: [{ xs: [9.8], y: 6.4, w: 2.4, h: 3.8, r: 0.4 }, { xs: seq(13.6, 5.7, 2), y: 6.4, w: 4.8, h: 3.8, r: 0.45 }, { xs: seq(31.0, 5.7, 5), y: 6.4, w: 4.8, h: 3.8, r: 0.45 }],
  doors: [plug(25.4, 3.6, 10.6)], trucks: [11.0, "end"], paint: desiroPaint(true), doorFill: () => HT.yellow,
  extra: (cc, g) => hvac(15, 13.9, 10) + hvac(40, 13.9, 12) + boxes(31, 54, 3.6, 2, 0.8) + htMark(cc, 47, 11.35, 0.62) });
const desiroMid = (c) => unit(c, { roof: 13.9, sill: 3.6, low: 5.0,
  rows: [{ xs: seq(3.4, 5.7, 3), y: 6.4, w: 4.8, h: 3.8, r: 0.45 }, { xs: seq(32.2, 5.7, 4), y: 6.4, w: 4.8, h: 3.8, r: 0.45 }],
  doors: [plug(c.L / 2 - 2.2, 3.6, 10.6)], trucks: ["start", "end"], pan: c.index === 2 ? c.L / 2 - 6 : null, paint: desiroPaint(false), doorFill: () => HT.yellow,
  extra: (cc) => (cc.index === 2 ? hvac(4, 13.9, 9) : hvac(6, 13.9, 10) + hvac(36, 13.9, 10)) + boxes(6, 22, 3.6, 2, 0.8) + boxes(34, 50, 3.6, 2, 0.8) });

// Stadler GTW 2/6 (class 560; Stadler with Bombardier and Hellenic
// Shipyards, 2003-04; 560 101-117 and 201-217, power modules 560 901-917):
// two passenger sections of 17.9 m, each on a truck under its cab and hung
// at its inner end from the short power module between them (as the
// built-in GTW, js/carmodels.js); a raked nose, one wide double door a
// side. White, an aqua band low along the side and round the windshield
// (corrected from blue: photographs of 560 102 at the airport and 560 108
// at Aigio), yellow doors; the name over the windows.
const AQUA = "#45bfcc";
const NOSE_GTW = [[1.0, 2.4], [1.0, 5.6], ["q", 1.1, 6.8, 1.8, 7.8], [3.6, 11.9], ["q", 4.2, 12.8, 5.6, 12.8]];
const gtwPaint = (c, g) => bands(g.L, [[0, 20, HT.white], [11.8, 3, "#9aa1a9"], [2.85, 1.1, AQUA], [4.15, 0.25, AQUA], [0, 2.6, "#3a3f45"]]) +
  path("M-1 2.4L-1 7.6Q1.4 7.6 3.0 6.4Q4.6 5.2 7.0 5.2L7.0 2.4Z", AQUA) + path("M-1 11.2Q2.6 11.2 3.4 11.9L5.4 12.9L-1 12.9Z", AQUA);
const gtwCar = (c) => unit(c, { roof: 12.8, sill: 2.4, nose: NOSE_GTW, rake: [[1.8, 7.8], [3.6, 11.9]], depth: 2.4, cabLen: 6, lampY: 4.2,
  rows: [{ xs: [11.6, 16.8, 30.2, 35.9, 41.5, 47.2, 52.8], y: 5.6, w: 4.3, h: 3.8, r: 0.45 }],
  doors: [{ x: 23.0, w: 5.2, y0: 2.1, y1: 9.6, leaves: 2, glassY: 0.3, glassH: 0.55 }], diaphragm: [2.6, 11.2], paint: gtwPaint, doorFill: () => HT.yellow,
  extra: (cc) => truck(9.2, { wb: 6.9, d: 30, top: 2.4 }) + hvac(19, 12.8, 9) + hvac(38, 12.8, 7) + boxes(30, 50, 2.4, 2, 0.6) + htMark(cc, 43, 10.55, 0.55) });
// The power module: a short, tall box over its own truck, with a corridor
// through it between the sections; louvers either side of the corridor
// door, radiators and the exhaust on the roof, fuel tanks under it.
function gtwPower(c) {
  const L = c.L, roof = 13.4, sill = 3.4;
  return bilevel({ ...c, cabL: false, cabR: false }, {
    roof, sill, cornerR: 0.6, end: 0.4, noTrucks: true, badge: false, rows: [], doors: [], diaphragm: [3.6, 12.2],
    paint: () => bands(L, [[0, 20, HT.white], [12.2, 3, "#9aa1a9"], [2.85, 1.1, AQUA], [0, 3.6, "#3a3f45"], [4.15, 0.25, AQUA]]),
    extra: () => {
      let s = truck(L / 2, { wb: 7.2, d: 33, kind: "loco", top: sill });
      for (const x of [1.4, L - 5.6]) s += rect(x, 5.4, 4.2, 5.6, "rgba(20,22,25,0.55)", 0.4, 'rx="0.15"') + slats(x, 5.4, 4.2, 5.6, 0.35, "rgba(255,255,255,0.18)");
      s += rect(L / 2 - 1.6, 4.6, 3.2, 7.0, "rgba(0,0,0,0.06)", 0.5) + rect(L / 2 - 0.9, 8.6, 1.8, 2.0, C.glass, 0, 'rx="0.2"');
      s += rect(1.0, roof - 0.05, L - 2.0, 0.7, C.steelDark, 0.4, 'rx="0.25"') + slats(1.6, roof + 0.1, L - 3.2, 0.45, 0.45, "rgba(0,0,0,0.25)");
      return s + exhaust(L / 2 - 1.2, roof + 0.6) + tank(1.2, L / 2 - 3.8, sill, 1.6) + tank(L / 2 + 3.8, L - 1.2, sill, 1.6);
    },
  });
}

// MAN-2000 (class 621; Bombardier and Hellenic Shipyards, 2006-07; 621
// 101/201-115/215): two-car diesel units of 47.2 m, a boxy cab with a flat
// windshield; two double doors a side in each car, the engine under the
// floor. Corrected after photographs of 621 210 at Edessa and 621 111 at
// Thessaloníki (June 2026): the sides sky blue from the windows up to the
// light gray roof, a white line under the windows, navy below it over a
// second white line and a gray skirt; sky blue doors; at the cab, white
// over the windshield and round the lamps, the navy sweeping up under it.
const MAN = { sky: "#2f86d6", navy: "#1f3d9c", roof: "#d3d7dc" };
const NOSE_621 = [[1.0, 3.9], [0.9, 7.2], ["q", 1.0, 8.2, 1.7, 8.9], [2.6, 12.4], ["q", 3.0, 13.2, 4.4, 13.2]];
const manPaint = (c, g) => bands(g.L, [[0, 20, MAN.sky], [11.9, 3, MAN.roof], [0, 4.6, "#b4bac1"], [4.6, 0.3, "#f3f4f5"], [4.9, 1.55, MAN.navy], [6.45, 0.32, "#f3f4f5"]]) +
  path("M-1 6.45L-1 8.9L1.7 8.9L3.4 6.45Z", "#f3f4f5") + path("M-1 4.9L-1 6.45L3.4 6.45L4.6 4.9Z", MAN.navy) + path("M-1 11.9L2.9 11.9L3.6 13.4L-1 13.4Z", "#f3f4f5");
const man2000 = (c) => unit(c, { roof: 13.2, sill: 3.9, nose: NOSE_621, rake: [[1.7, 8.9], [2.6, 12.4]], depth: 2.4, cabLen: 6, low: 5.6, lampY: 5.8,
  rows: [{ xs: [8.6], y: 7.0, w: 2.6, h: 3.0, r: 0.35 }, { xs: seq(18.6, 5.3, 8), y: 7.0, w: 4.4, h: 3.0, r: 0.4 }],
  doors: [plug(12.6, 3.9, 11.0, 4.2), plug(c.L - 9.6, 3.9, 11.0, 4.2)], trucks: [9.5, c.L - 8.5], diaphragm: [4.2, 11.6], paint: manPaint, doorFill: () => MAN.sky,
  extra: (cc, g) => hvac(20, 13.2, 10) + hvac(46, 13.2, 8) + exhaust(34, 13.2) + boxes(16, 30, 3.9, 2, 1.3) + tank(31, 40, 3.9, 1.5) + boxes(41, g.L - 15, 3.9, 2, 1.2) +
    letters(cc, 17.75, 9.7, 0.9, "2", "#ffffff", { weight: 600 }) + htMark(cc, 42, 5.65, 0.62, "#ffffff") });

// Siemens EuroSprinter ES64P "HellasSprinter" (class 120; Krauss-Maffei
// and Siemens, 1997-2001; 120 001-030): a Taurus-like rounded nose, 19.58
// m. Corrected from OSE's old white, red and blue: every one seen since
// the TrainOSE years is dark blue all over, the roof edge and grilles
// included, a black skirt; Hellenic Train's mark in white, the ring over
// the name, on the rear half of the side over the number (photographs of
// 120 030 at Thessaloníki, 2025-26, 120 016 at Athens); its grilles moved
// up under the roof edge, a big one behind the No. 1 cab and a row of five
// over the rear half, as photographed. Adtranz DE2000
// (class 220; 1997, 2003-04; 220 001-036): a boxier diesel, red, the white
// "Marlboro" chevron on the nose; the side's white panel over the rear two
// thirds, a big blue panel in it, its trailing edge slanted (refined from a
// band and panel drawn the length of the side, after photographs of 220 019
// and 220 022 in 2025-26); the exhaust and radiator fans on the roof, the
// fuel tank between the trucks.
const HT120 = { blue: "#28409a", roof: "#22377f" };
const NOSE_120 = [[1.3, 4.1], [1.1, 6.9], ["q", 1.2, 8.4, 2.5, 9.6], [3.6, 12.0], ["q", 4.1, 12.9, 5.4, 12.9]];
const NOSE_220 = [[1.2, 4.1], [1.1, 7.4], ["q", 1.2, 8.5, 1.9, 9.3], [3.0, 12.2], ["q", 3.4, 12.9, 4.6, 12.9]];
const paint120 = (c, L) => bands(L, [[0, 20, HT120.blue], [11.8, 3, HT120.roof], [0, 4.45, "#1d1e20"]]);
const over120 = (c, L) => htStack(c, L * 0.7, 8.4, 0.95) + letters(c, L * 0.7, 6.0, 0.8, "120", "#ffffff", { weight: 600 });
const paint220 = (c, L) => bands(L, [[0, 20, "#c8102e"], [11.8, 3, "#8e959d"], [0, 4.65, "#1d1e20"]]) + path(poly([[-1, 4.65], [2.4, 4.65], [3.6, 9.2], [2.3, 9.2], [-1, 6.4]]), HT.white);
const over220 = (c, L) => path(poly([[L * 0.36, 4.7], [L * 0.83, 4.7], [L * 0.83, 11.0], [L * 0.38, 11.0]]), HT.white) +
  path(poly([[L * 0.38, 5.5], [L * 0.7, 5.5], [L * 0.67, 10.7], [L * 0.385, 10.7]]), "#2a3f8f") +
  htMark(c, L * 0.76, 8.6, 0.5) + letters(c, L * 0.76, 7.4, 0.55, "220", "#1d1e20", { weight: 600 });
const under220 = (c, L) => tank(L / 2 - 10, L / 2 + 10, 4.1, 1.35) + rect(L / 2 - 9, 3.0, 4, 0.6, C.steelDark, 0, 'rx="0.3"');
const roof220 = (c, L) => exhaust(L / 2 - 4, 12.9) + [L / 2 + 6, L / 2 + 12].map((x) => path(`M${x - 2.2} 12.85Q${x} 13.7 ${x + 2.2} 12.85Z`, C.steelDark, 0.4)).join("") +
  rect(L / 2 - 14, 12.85, 8, 0.45, C.steelDark, 0.4, 'rx="0.2"') + slats(L / 2 - 13.5, 12.9, 7, 0.35, 0.45, "rgba(0,0,0,0.25)");

// --- Hellenic Train's Intercity coaches (leased from GAIAOSE): UIC-Z
// bodies, 26.4 m over the buffers, 2.825 m wide, 4.05 m to the roof, on
// trucks 19 m apart with 920 mm wheels; a single swing-plug door with a
// tall window at each end of each side, the end walls dark blue under a
// fluted silver roof. el.wikipedia's fleet list: ADmz (first class, a
// luggage room, a children's corner and an accessible toilet; 28 seats;
// Hellenic Shipyards, Siemens and Temoinsa; 11), Amz (first class, nine
// compartments of six; 4), WRmz (buffet-restaurant, 42 seats; 9), Bmz
// (second class, eleven compartments of six; 8) and Bmpz (open second
// class, 80 seats; N. Kioleidis and Bombardier; 47). Their paint, as on
// Commons' June 2026 photographs at Thessaloníki: TrainOSE's blue sides, a
// cream line under the roof, cream, red and cream lines under the windows,
// a light gray skirt; the class numeral in white by the door. The WRmz
// restaurant cars wear Hellenic Train's wrap instead: white, broken into
// blue and sky-blue triangles, the mark on it (photograph "WRmz.jpg",
// 2025). Many cars carry advertising wraps and graffiti, not drawn.
const HC = { blue: "#2c5fc7", cream: "#efe7cf", red: "#d0312d", skirt: "#b9bfc6", roof: "#c9ced4" };
const CO = { roof: 13.3, sill: 3.9 };
// Triangles of the wrap, [x, y, size, rotation, fill] along a 29 ft
// repeat, laid out by hand to match the photograph's density.
const TRI = [[1.5, 9.5, 3.4, 15, "#1f5fc8"], [4.5, 6.0, 2.6, 200, "#5aa0ec"], [7.5, 10.5, 2.2, 95, "#0f3f9e"], [9.5, 5.5, 3.6, 330, "#1f5fc8"],
  [13.0, 9.8, 2.8, 250, "#8fc1f2"], [15.5, 6.5, 2.2, 40, "#0f3f9e"], [18.5, 10.2, 3.6, 170, "#1f5fc8"], [21.0, 5.6, 2.8, 290, "#5aa0ec"],
  [24.0, 8.4, 2.4, 120, "#0f3f9e"], [26.8, 11.0, 2.0, 10, "#8fc1f2"], [27.5, 5.2, 2.6, 60, "#1f5fc8"]];
function triangles(L) {
  let s = "";
  for (let off = -2; off < L; off += 29) {
    for (const [x, y, r, a, fill] of TRI) {
      const pts = [0, 120, 240].map((d) => [x + off + r * Math.cos(((a + d) * Math.PI) / 180), y + r * Math.sin(((a + d) * Math.PI) / 180)]);
      s += path(poly(pts), fill) + path(poly(pts.map(([px, py]) => [x + off + (px - x - off) * 0.45, y + (py - y) * 0.45])), "#f4f6f8", 0, 'opacity="0.55"');
    }
  }
  return s;
}
const coachDoor = (x) => ({ x, w: 2.6, h: 7.0, glassY: 0.4, glassH: 0.47 });
// A coach: kind "Bmpz", "Bmz", "Amz", "ADmz" or "WRmz".
function htCoach(c, kind) {
  const L = c.L, { roof, sill } = CO, wrap = kind === "WRmz";
  const win = (a, b, w, pitch, h = 3.0, y = 7.4) => ({ a, b, y, w, h, pitch, r: 0.4 });
  const rows = {
    Bmpz: [win(6.0, L - 6.0, 4.3, 5.95)],
    Bmz: [win(6.0, L - 6.0, 4.7, 6.45)],
    Amz: [win(6.0, L - 6.0, 5.2, 7.6)],
    // First-class saloon, the luggage room's double door, a window for the
    // children's corner, the accessible toilet's frosted pane.
    ADmz: [win(6.0, 55.0, 4.6, 6.4), win(64.5, 72.0, 4.6, 6.4), win(74.0, 77.6, 1.6, 2.0, 1.8, 8.6)],
    // The bar's two big windows at one end, then the restaurant's.
    WRmz: [win(6.4, 15.6, 8.4, 9.0, 3.3, 7.2), win(16.6, 22.6, 5.2, 6.0, 3.3, 7.2), win(24.0, L - 6.0, 4.2, 6.15)],
  }[kind];
  const doors = [coachDoor(2.0), coachDoor(L - 4.6)];
  if (kind === "ADmz") doors.push({ x: 57.4, w: 5.0, h: 7.0, leaves: 2, glassY: 0.5, glassH: 0.3 });
  const doorFill = wrap ? "#e9edf1" : HC.blue;
  return coachCar(c, {
    roof, sill, end: 0.6, endR: 1.2, base: wrap ? "#f4f6f8" : HC.blue, badge: false, under: true,
    trucks: { centers: 62.3, wb: 8.2, d: 36 }, diaphragm: [4.25, 11.8], rows, doors,
    livery: () => {
      let s = wrap ? triangles(L) : stripesOf(L);
      s += rect(-1, 12.2, L + 2, 3, HC.roof) + flutes(0, L, 12.45, 13.2, 0.26) + rect(-1, 0, L + 2, 4.45, HC.skirt);
      for (const d of doors) s += rect(d.x, sill + 0.15, d.w, d.h, doorFill);
      return s;
    },
    extra: (cc) => {
      // Roof: the air-conditioning unit mid-roof (over the kitchen end on
      // the restaurant car, with its extractor), vents along it.
      let s = (wrap ? hvac(5, roof, 13, 0.85) + rect(20, roof - 0.05, 3.2, 0.6, C.steelDark, 0.4, 'rx="0.2"') : hvac(L / 2 - 7, roof, 14, 0.7)) +
        [12, 24, L - 24, L - 12].map((x) => path(`M${x - 1.1} ${roof - 0.05}Q${x} ${roof + 0.7} ${x + 1.1} ${roof - 0.05}Z`, C.steelDark, 0.4)).join("");
      // Under the floor: the water tank, the battery and the converter.
      s += rect(L / 2 - 3.5, sill - 1.9, 7, 0.75, C.steelDark, 0.4, 'rx="0.37"') + rect(L / 2 + 5, sill - 1.4, 4.6, 1.2, "currentColor", 0, 'opacity="0.75" rx="0.1"') +
        rect(L / 2 - 10, sill - 1.3, 4.2, 1.1, "currentColor", 0, 'opacity="0.7" rx="0.1"') + slats(L / 2 - 9.8, sill - 1.2, 3.8, 0.9, 0.35, "rgba(255,255,255,0.2)");
      s += buffers(0, -1, { sill }) + buffers(L, 1, { sill });
      // The class numeral by each door; the luggage room's pictogram box.
      if (!wrap) {
        const num = kind === "Amz" || kind === "ADmz" ? "1" : "2";
        s += letters(cc, 5.7, 9.4, 1.3, num, "#ffffff", { weight: 600 }) + letters(cc, L - 5.7, 9.4, 1.3, num, "#ffffff", { weight: 600 });
        s += htMark(cc, L / 2 + 3, 5.55, 0.55, "#ffffff");
      } else s += htMark(cc, L - 22, 6.2, 0.62, "#0f3f9e");
      if (kind === "ADmz") s += rect(63.2, 9.9, 0.9, 0.9, "#ffffff", 0.3, 'rx="0.12"') + rect(63.45, 10.15, 0.4, 0.4, HC.blue);
      return s;
    },
  });
}
const stripesOf = (L) => bands(L, [[10.85, 0.18, HC.cream], [7.0, 0.16, HC.cream], [6.7, 0.24, HC.red], [6.5, 0.16, HC.cream]]);

export const TYPES = {
  htDesiroCab: { name: "Siemens Desiro end section", kind: "emu" },
  htDesiroMid: { name: "Siemens Desiro intermediate section", kind: "emu" },
  htGtwCar: { name: "Stadler GTW passenger section", kind: "emu" },
  htGtwPower: { name: "Stadler GTW power module", kind: "module" },
  htMan2000: { name: "MAN-2000 diesel car", kind: "emu" },
  ht120: { name: "EuroSprinter electric locomotive", kind: "electric", pan: true },
  ht220: { name: "DE2000 diesel locomotive", kind: "diesel" },
  htADmz: { name: "First class and luggage coach (ADmz)", kind: "coach", amenities: ["first"] },
  htAmz: { name: "First class compartment coach (Amz)", kind: "coach", amenities: ["first"] },
  htWRmz: { name: "Restaurant car (WRmz)", kind: "coach", amenities: ["cafe"] },
  htBmz: { name: "Second class compartment coach (Bmz)", kind: "coach" },
  htBmpz: { name: "Second class open coach (Bmpz)", kind: "coach" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  htDesiroCab: M(desiroCab, 63.3, true),
  htDesiroMid: M(desiroMid, 55.4, false, (ctx) => ctx.index),
  htGtwCar: M(gtwCar, 58.85, true),
  htGtwPower: M(gtwPower, 16.4),
  htMan2000: M(man2000, 77.4, true),
  ht120: M((c) => euroLoco(c, { roof: 12.9, sill: 4.1, nose: NOSE_120, rake: [[2.5, 9.6], [3.6, 12.0]], centers: 32.8, door: 6.4, paint: paint120, over: over120,
    surround: "#14205a", grilles: [[-11.5, 4.4, 10.3, 12.0], ...seq(2.6, 3.1, 5).map((dx) => [dx, 2.5, 10.5, 11.9])], grilleFill: "rgba(20,24,40,0.55)" }), 64.24),
  ht220: M((c) => euroLoco(c, { roof: 12.9, sill: 4.1, nose: NOSE_220, rake: [[1.9, 9.3], [3.0, 12.2]], centers: 32.0, door: 5.6, pans: false, wheel: 43,
    grilles: [[-16.0, 7.0, 7.8, 10.8], [-5.5, 11.0, 7.8, 10.8], [9.0, 7.0, 7.8, 10.8]], grilleFill: "rgba(20,22,25,0.3)",
    paint: paint220, over: over220, under: under220, roof2: roof220 }), 63.6),
  htADmz: M((c) => htCoach(c, "ADmz"), 86.6),
  htAmz: M((c) => htCoach(c, "Amz"), 86.6),
  htWRmz: M((c) => htCoach(c, "WRmz"), 86.6),
  htBmz: M((c) => htCoach(c, "Bmz"), 86.6),
  htBmpz: M((c) => htCoach(c, "Bmpz"), 86.6),
};

// The tracker's locomotiveNumber, as a number: each Desiro set reports from
// both cab cars (460 101-120 and 460 201-220), each GTW from its passenger
// sections (560 1xx, 2xx) or power module (560 9xx), each MAN-2000 from
// either car (621 1xx, 2xx). It names no coaches.
export const FLEETS = {
  hellenictrain: [[460101, 460120, "htDesiroCab"], [460201, 460220, "htDesiroCab"], [560101, 560117, "htGtwCar"], [560201, 560217, "htGtwCar"],
    [560901, 560917, "htGtwPower"], [621101, 621115, "htMan2000"], [621201, 621215, "htMan2000"], [120001, 120030, "ht120"], [220001, 220036, "ht220"]],
};

const set = (label, ...units) => ({ label, units });
const DESIRO = set("Siemens Desiro: a five-section electric unit, often two coupled", ["htDesiroCab", 1], ["htDesiroMid", 3], ["htDesiroCab", 1]);
const GTW = set("Stadler GTW: a two-section diesel railcar", ["htGtwCar", 1], ["htGtwPower", 1], ["htGtwCar", 1]);
const MAN2000 = set("MAN-2000: a two-car diesel unit", ["htMan2000", 2]);
// The Intercity's coaches: first class and luggage, first-class
// compartments, the restaurant car, then second class.
const IC_COACHES = [["htADmz", 1], ["htAmz", 1], ["htWRmz", 1], ["htBmpz", 2], ["htBmz", 1]];
const IC = (loco) => set(`Intercity: a class ${loco === "ht120" ? "120 electric" : "220 diesel"} locomotive and usually 6 coaches (first class, a restaurant car, second class)`,
  [loco, 1], ...IC_COACHES);
// Shorter trains on the regional runs: second class, one coach with a
// first-class end.
const LOCAL = (loco, what) => set(`${what}: a class ${loco === "ht120" ? "120 electric" : "220 diesel"} locomotive and usually 4 coaches`,
  [loco, 1], ["htADmz", 1], ["htBmpz", 3]);
const LARISSA = /Λάρισα|Larissa/;

// By the reported unit; else by line, as the tracker showed them on
// 2026-10-18 and 19: the Athens Proastiakos runs Desiros (Athens-Chalkida
// too); Thessaloníki-Larissa (trains 1590-1599, 2590-2595) a class 120 and
// coaches (120 018 on train 2594 on 19 October), some trains a Desiro;
// Kiato-Aigio (trains 300-311) GTWs; the Athens-Thessaloníki Intercitys
// (IC50, 51, 56, 57) a class 220 or 120 and coaches; Athens-Leianokladi
// (520, 521) a class 120 and coaches; the regional lines to Florina and
// Edessa and Alexandroupoli-Ormenio/Orestiada MAN-2000s.
export const TYPICAL = {
  hellenictrain: (t, reported) => {
    const num = t.number || "";
    const larissa = /^[12]59\d$/.test(num) || (LARISSA.test(t.destination || "") && t.route === "Proastiakos");
    if (reported === "htDesiroCab") return DESIRO;
    if (reported === "htGtwCar" || reported === "htGtwPower") return GTW;
    if (reported === "htMan2000") return MAN2000;
    if (reported === "ht120" || reported === "ht220") {
      if (t.route === "Intercity") return IC(reported);
      if (larissa) return LOCAL(reported, "Thessaloníki-Larissa");
      return LOCAL(reported, /^52\d$/.test(num) ? "Athens-Leianokladi" : "Locomotive-hauled");
    }
    if (t.route === "Intercity") return IC("ht220");
    if (t.route === "Proastiakos") {
      if (/^3\d\d$/.test(num)) return GTW;
      if (larissa) return set("Thessaloníki-Larissa: a class 120 locomotive and usually 4 coaches (some trains a Siemens Desiro)", ["ht120", 1], ["htADmz", 1], ["htBmpz", 3]);
      return DESIRO;
    }
    return /^52\d$/.test(num) ? LOCAL("ht120", "Athens-Leianokladi") : MAN2000;
  },
};

const WP = "https://en.wikipedia.org/wiki/";
const EL = "https://el.wikipedia.org/wiki/Hellenic_Train";
const coachFacts = (model, about, extra = {}) => ({ model, type: "Passenger coach", builder: "Leased from GAIAOSE", lengthFt: 86.6, topSpeedMph: 124.3, source: EL, about, ...extra });
export const FACTS = {
  htDesiroCab: { model: "Siemens Desiro (class 460)", type: "Electric multiple unit", builder: "Siemens, built at Hellenic Shipyards", built: "2004–2006",
    fleet: "20 five-car sets, 460 101/201–120/220", topSpeedMph: 99.4, powerHp: 5150, lengthFt: 293, source: `${WP}OSE_class_460`,
    about: "The Athens and Thessaloniki Proastiakos's electric trains: five articulated sections on shared trucks. Two sets can run coupled as one ten-car train." },
  htDesiroMid: { model: "Siemens Desiro (class 460)", type: "Electric multiple unit", builder: "Siemens, built at Hellenic Shipyards", built: "2004–2006",
    fleet: "20 five-car sets", topSpeedMph: 99.4, powerHp: 5150, source: `${WP}OSE_class_460`,
    about: "An intermediate section of a class 460, resting on Jakobs trucks shared with its neighbours." },
  htGtwCar: { model: "Stadler GTW 2/6 (class 560)", type: "Diesel multiple unit", builder: "Stadler, Bombardier and Hellenic Shipyards", built: "2003",
    fleet: "17, 560 101–117", topSpeedMph: 71.5, powerHp: 738, seats: 94, source: `${WP}Stadler_GTW_in_Greece`,
    about: "Two passenger sections hung from a short power module holding the engine. Hellenic Train runs them on Kiato–Aigio and other lines off the wires." },
  htGtwPower: { model: "Stadler GTW 2/6 (class 560) power module", type: "Power module", builder: "Stadler, Bombardier and Hellenic Shipyards", built: "2003",
    fleet: "17, 560 901–917", powerHp: 738, source: `${WP}Stadler_GTW_in_Greece`,
    about: "The GTW's power module carries its MTU diesel engine, with a corridor through it between the two passenger sections." },
  htMan2000: { model: "MAN-2000 (class 621)", type: "Diesel multiple unit", builder: "Bombardier and Hellenic Shipyards", built: "2006–2007",
    fleet: "15 two-car units, 621 101/201–115/215", topSpeedMph: 77.7, seats: 140, lengthFt: 154.9, source: "https://www.railwaygazette.com/news/ose-dmus-enter-service/30723.article",
    about: "Two-car diesel units ordered in 1997 and delayed by the builders' troubles; the first entered service in July 2006. Hellenic Train runs them on regional lines off the wires, such as Thessaloniki–Edessa–Florina and Alexandroupoli–Ormenio." },
  ht120: { model: "Siemens EuroSprinter ES64P (class 120)", type: "Electric locomotive", builder: "Krauss-Maffei and Siemens", built: "1996–2001", fleet: "30, 120 001–030",
    powerHp: 6705, lengthFt: 64.2, source: `${WP}Siemens_EuroSprinter`,
    about: "Greece's 25 kV electric locomotives, close to the ES64P prototype, now in dark blue. In October 2026 the tracker showed them on Athens–Leianokladi and Thessaloniki–Larissa passenger trains; they also haul Intercitys and freight." },
  ht220: { model: "Adtranz DE2000 (class 220)", type: "Diesel-electric locomotive", builder: "Adtranz (later Bombardier)", built: "1997, 2003–2004", fleet: "36, 220 001–036",
    topSpeedMph: 99.4, powerHp: 2816, source: `${WP}OSE_Class_220`,
    about: "Known for its red-chevron \"Marlboro\" front, the DE2000 hauls Intercity trains (the tracker showed IC50 and IC51 behind 220s on 18 October 2026), trains on the Paleofarsalos–Kalambaka line, and freight." },
  htADmz: coachFacts("ADmz first class and luggage coach", "The Intercity's end coach: a first-class saloon of 28 seats, a luggage room behind a double door, a children's corner and an accessible toilet.",
    { builder: "Hellenic Shipyards, Siemens and Temoinsa", fleet: "11", seats: 28 }),
  htAmz: coachFacts("Amz first class coach", "First class in nine compartments of six seats.", { fleet: "4", seats: 54 }),
  htWRmz: coachFacts("WRmz restaurant car", "The Intercity's buffet-restaurant: a bar, seven large and seven small tables. Hellenic Train's restaurant cars wear its triangle wrap.",
    { fleet: "9", seats: 42 }),
  htBmz: coachFacts("Bmz second class coach", "Second class in eleven compartments of six seats.", { fleet: "8", seats: 66 }),
  htBmpz: coachFacts("Bmpz second class coach", "Hellenic Train's most numerous coach: an open saloon of 80 second-class seats, on the Intercitys and the locomotive-hauled regional trains.",
    { builder: "N. Kioleidis and Bombardier", fleet: "47", seats: 80 }),
};
