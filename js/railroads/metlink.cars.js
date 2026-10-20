// Wellington's trains (scripts/railroads/metlink.py): Metlink's Matangi
// electric units on the Kāpiti, Hutt Valley, Melling and Johnsonville
// lines, and the Wairarapa Connection, a KiwiRail DFB with rebuilt British
// Rail Mark 2 carriages. Metlink's feed names a train's vehicle when it
// names one (a Matangi car's number, its unit's); otherwise each train is
// drawn as what usually runs on its line. Trainsheet's own side views, from
// published dimensions and photographs of the current paint; the lettering
// is drawn as type, not copied from Metlink's logo. The locomotive and the
// shared detail come from Auckland's file (aucklandtransport.cars.js).

import { bilevel } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, poly, win, slats, pantograph } from "../carart.js?v=dev";
import { letters, hvac, roofCover, panGear, horns, lamp, RED_LAMP, wiper } from "./digitraffic.cars.js?v=dev";
import { facing, unitEnd, autoCoupler, underGear, truckGear, aerial, roofCable, leafDoor, dfb, MK2, mk2Gear } from "./aucklandtransport.cars.js?v=dev";


const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
const r2 = (v) => Math.round(v * 100) / 100;

// ===================== Matangi (FP/FT) =====================

// --- FP/FT "Matangi" (Hyundai Rotem and Mitsui, Changwon, South Korea):
// two-car units, 48 delivered 2010-12 (4103-4610) and 35 in 2015-16
// (5010-5396; Scharfenberg couplers, LED lights; the first batch since
// fitted alike); both cars of a unit carry its number, FP 4103 and FT 4103.
// The FP, a motor car with the pantograph at its inner end, 21.53 m; the
// FT, a trailer with a low floor (730 mm) between its trucks, 22.5 m; a
// unit 44.03 m. 2.73 m wide, 3.64 m (11 ft 11 in) over the roof without the
// pantograph; floor 1,100 mm; 1,500 V DC, 3 ft 6 in gauge, 95 km/h in
// service; 147 seats a unit; truck centers 15.3 m in the tender
// (Wikipedia, "New Zealand FP class electric multiple unit"). Each car: the
// cab, a wide window, a double sliding door, three windows, a door, two
// windows (scaled from photographs of FP 4103, FP 5033 and FP 4512).
// Metlink's paint: bare stainless, a lime line along the foot of the
// windows, a navy band along the bottom edged in white that sweeps up behind
// the cab under Metlink's name; the doors blue-gray; the cab end yellow
// round the front and down the side to a silver crescent that frames the
// dark cab window, black round the windshields and across the top, the
// headlights low in silver under the yellow.
const MT = { steel: "#bcc1c7", roof: "#a3a9b0", lime: "#b2cf2e", navy: "#1e2f5b", yellow: "#f6c400", black: "#16181b", door: "#5b7390", skirt: "#3a3e44" };
const MAT = { roof: 11.94, sill: 3.3, cornerR: 1.0, end: 0.6, trucks: { centers: 50.2, wb: 7.2, d: 34 }, diaphragm: [3.6, 10.6], badge: false };
const metlinkName = (c, x, y, h, fill = "#ffffff") => letters(c, x, y, h, "metlink", fill, { weight: 600, italic: false, spacing: -0.02 * h }) +
  circle(x + h * 2.1, y + h * 0.05, h * 0.26, "none", 0, `stroke="${MT.lime}" stroke-width="${r2(h * 0.12)}"`) + circle(x + h * 2.1, y + h * 0.05, h * 0.08, MT.lime);
const mtDoor = (x, y0) => leafDoor(x, 4.7, y0, 10.05, { fill: MT.door, glass: [0.38, 0.88], gw: 0.5, edge: "#2b2e33" }) + rect(x + 0.3, y0 - 0.3, 4.1, 0.26, "#3a3e44");
// One car, cab on the left: ft for the trailer (longer, its middle floor
// low), else the FP with its pantograph.
function matangi(ft) {
  const d1 = 25.6, d2 = ft ? 55.0 : 52.6;
  const rows = [{ xs: [16.4], y: 6.4, w: 6.0, h: 3.2, r: 0.35 }, { xs: seq(32.4, 6.0, 3).map((x) => x + (ft ? 0.9 : 0)), y: 6.4, w: 4.6, h: 3.2, r: 0.35 },
    { xs: [d2 + 7.4, d2 + 12.3].map((x) => x - 0.6), y: 6.4, w: 4.0, h: 3.2, r: 0.35 }];
  return (c) => bilevel(c, { ...MAT, rows, doors: [], cabLen: 10.5, ...(ft ? { drop: { a: 14.5, b: c.L - 14.5, y: 2.2 } } : {}),
    nose: [[1.6, 3.3], [1.25, 4.6], [1.2, 9.6], ["q", 1.3, 11.5, 2.9, 11.94]],
    paint: (c, g) => {
      const L = g.L;
      let s = rect(0, 0, L, 18, MT.steel) + rect(0, 10.4, L, 3, MT.roof) + line(0, 10.4, L, 10.4, "rgba(0,0,0,0.18)", 0.5) + rect(0, 0, L, 3.55, MT.skirt);
      // The lime line, the navy band along the bottom and its white edge,
      // sweeping up behind the cab to carry the name.
      s += rect(10.4, 6.0, L - 10.4, 0.28, MT.lime) + rect(0, 3.55, L, 1.05, MT.navy) + rect(13.0, 4.6, L - 13.0, 0.12, "#ffffff");
      s += path(poly([[4.8, 3.55], [13.0, 4.6], [24.6, 4.6], [24.6, 6.0], [13.8, 6.0], ["q", 9.0, 5.6, 4.8, 3.55]]), MT.navy) +
        path(poly([[3.0, 3.55], [4.8, 3.55], ["q", 9.0, 5.6, 13.8, 6.0], [13.8, 6.18], ["q", 8.6, 5.9, 3.0, 3.55]]), "#ffffff");
      // The cab: yellow round the front and back along the side to the
      // silver crescent; black round the windshield and across the top.
      s += path(poly([[0, 4.7], [5.4, 4.7], ["q", 4.6, 8.0, 5.6, 11.94], [0, 12.2]]), MT.yellow) +
        path(poly([[5.4, 4.7], [6.4, 4.7], ["q", 5.6, 8.0, 6.6, 11.94], [5.6, 11.94], ["q", 4.6, 8.0, 5.4, 4.7]]), "#d9dde1") +
        path(poly([[0, 10.6], [3.6, 10.6], ["q", 4.3, 10.9, 4.9, 11.94], [0, 12.2]]), MT.black) + rect(0, 3.55, 5.6, 1.15, "#c9cdd2");
      return s;
    },
    cab: (c, g) => path(poly([[1.22, 7.4], [1.9, 7.4], [1.9, 10.5], [1.3, 10.5]]), C.glass) + wiper(1.4, 7.6, 1.75, 9.6) +
      path(poly([[6.5, 6.6], [9.6, 6.6], ["q", 10.2, 6.6, 10.2, 7.2], [10.2, 10.0], [6.9, 10.0], ["q", 6.1, 8.2, 6.5, 6.6]]), C.glass, 0, `stroke="${C.gasket}" stroke-width="0.6" vector-effect="non-scaling-stroke"`) +
      circle(1.75, 4.15, 0.42, "#e9edf0", 0.35) + circle(1.75, 4.15, 0.25, "#fff6d0") + lamp(1.3, 5.0, 0.35, 0.3, RED_LAMP) +
      rect(0.55, 5.35, 0.9, 0.35, MT.yellow, 0.35) + autoCoupler(1.6, 5.4, 3.3, { y: 2.7 }) + metlinkName(c, 16.0, 5.25, 0.85),
    extra: (c, g) => {
      const t = MAT.trucks, a = g.L / 2 - t.centers / 2, b = g.L / 2 + t.centers / 2, y0 = ft ? 2.4 : 3.55, roof = MAT.roof;
      let s = mtDoor(d1, y0) + mtDoor(d2, y0) + truckGear(a, MAT.sill) + truckGear(b, MAT.sill);
      s += ft ? underGear(a + 5, a + 10, MAT.sill, 1, 1.1) + underGear(b - 10, b - 5, MAT.sill, 1, 1.1) + underGear(g.L / 2 - 8, g.L / 2 + 8, 2.2, 2, 0.45)
        : underGear(a + 5.5, b - 5.5, MAT.sill, 4, 1.35);
      s += hvac(13.0, roof - 0.1, 9.0, 0.5, "#a3aab2") + hvac(g.L - 20.0, roof - 0.1, 9.0, 0.5, "#a3aab2") + horns(5.4, roof - 0.05) + aerial(8.6, roof);
      if (!ft) s += rect(g.L - 12.8, roof - 0.1, 7.6, 0.3, "#8f969e", 0.4) + pantograph(g.L - 9.0, roof + 0.2, { facing: 1 }) + panGear(g.L - 9.0, roof, -1) +
        roofCable(g.L - 15.0, g.L - 24.0, roof) + roofCover(g.L / 2 - 6, roof - 0.1, 10, 0.35, "#a7adb4", 2);
      return s;
    },
  });
}
const pairEnd = unitEnd(2);
export const mtFp = facing(matangi(false), pairEnd);
export const mtFt = facing(matangi(true), pairEnd);

// ===================== Wairarapa Connection =====================

// --- SW, SWS and SWG carriages (British Rail Mark 2D, 2E and 2F, Derby
// 1971-75; rebuilt by Hillside Engineering, Dunedin, for the Wairarapa
// Connection, in service from May 2007): the Mark 2 body as in
// aucklandtransport.cars.js, 19.66 m, with its original plug doors at each
// end of the side and the wide windows between; the SW a saloon (64
// seats), the SWS with an accessible toilet, a servery and a wheelchair
// hoist (37 seats), the SWG with a luggage compartment and the generator
// (37 seats): SW 3282, 3294, 3339, 3349, 3355, 3376, 3394, 3404, 5646, 5658,
// 5820, 5837; SWS 3298, 5660, 5723; SWG 3365, 3422, 5671 (Wikipedia,
// "Wairarapa Connection"). Formed into sets of up to eight with, from the
// Masterton end, an SWG, an SW, the SWS and the other SWs; the DFB runs
// round its train at each end of the line. Metlink's paint: dark slate,
// the windows in a lighter blue-gray band between lime lines, a gray roof.
const WC = { body: "#2f3b4c", band: "#4f5e72", lime: "#a9c63a", roof: "#69717a", skirt: "#262a30" };
const wcPaint = (c, g) => rect(0, 0, g.L, 18, WC.body) + rect(0, 6.0, g.L, 3.6, WC.band) + rect(0, 5.55, g.L, 0.42, WC.lime) + rect(0, 9.72, g.L, 0.14, WC.lime) +
  rect(0, 10.5, g.L, 3, WC.roof) + line(0, 10.5, g.L, 10.5, "rgba(0,0,0,0.25)", 0.5) + rect(0, 0, g.L, 3.35, WC.skirt);
// A Mark 2's plug door: one leaf with a drop light, the handle, the step.
const plugDoor = (x) => rect(x, 3.25, 2.3, 6.75, "rgba(0,0,0,0.12)", 0.6, 'rx="0.15"') + win(x + 0.45, 7.0, 1.4, 2.0, 0.25) + rect(x + 1.8, 6.1, 0.3, 0.12, "#c9cdd2") +
  rect(x + 0.2, 2.95, 1.9, 0.25, "#3a3e44");
const WIN = (xs, w = 5.0) => [{ xs, y: 6.3, w, h: 2.95, r: 0.4 }];
const wcCar = (rows, more = () => "", gen = false) => (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...MK2, rows, doors: [], paint: wcPaint,
  extra: (c, g) => plugDoor(1.2) + plugDoor(g.L - 3.5) + metlinkName(c, g.L / 2, 4.45, 0.75, "#ffffff") + more(c, g) + mk2Gear(c, g, gen) });
export const wcSw = wcCar(WIN(seq(5.6, 6.25, 9)));
// SWS: the servery's small windows and the hoist's wide door mid-car.
export const wcSws = wcCar([...WIN(seq(5.6, 6.25, 3)), ...WIN([42.6, 48.85, 55.1]), { xs: [26.0, 29.0], y: 8.0, w: 2.0, h: 1.3, r: 0.25 }],
  (c, g) => leafDoor(33.0, 5.2, 3.3, 9.9, { fill: "rgba(0,0,0,0.12)", glass: [0.5, 0.85], gw: 0.4 }) + rect(39.4, 7.4, 0.9, 0.9, "#2a62b0", 0, 'rx="0.1"'));
// SWG: the generator at one end behind louvers, the luggage compartment's
// double doors, then the saloon.
export const wcSwg = wcCar(WIN(seq(30.6, 6.25, 5)),
  (c, g) => rect(5.0, 4.8, 8.0, 4.4, "rgba(20,22,25,0.5)", 0.4) + slats(5.0, 4.8, 8.0, 4.4, 0.4, "rgba(255,255,255,0.18)") +
    leafDoor(17.0, 6.0, 3.3, 9.9, { fill: "rgba(0,0,0,0.1)", glass: [0.6, 0.85], gw: 0.4, button: false }), true);

export const TYPES = {
  mtFp: { name: "Matangi FP motor car", kind: "emu" },
  mtFt: { name: "Matangi FT trailer", kind: "emu" },
  krDfb: { name: "DFB class locomotive", kind: "diesel" },
  wcSw: { name: "SW carriage", kind: "coach" },
  wcSws: { name: "SWS carriage (servery, accessible)", kind: "coach" },
  wcSwg: { name: "SWG carriage (luggage, generator)", kind: "coach" },
};
const M = (draw, len, variant = null, oneEnd = false) => ({ draw, len, oneEnd, variant });
const endVariant = (c) => (pairEnd(c) ? "r" : "");
export const MODELS = {
  mtFp: M(mtFp, 70.64, endVariant),
  mtFt: M(mtFt, 73.82, endVariant),
  krDfb: M(dfb, 54.8, null, true),
  wcSw: M(wcSw, 65.6),
  wcSws: M(wcSws, 65.6),
  wcSwg: M(wcSwg, 65.6),
};
// A Matangi car's number is its unit's, the same on its FP and FT; the
// Wairarapa's DFBs and carriages by their numbers.
const each = (nums, key) => nums.map((n) => [n, n, key]);
export const FLEETS = {
  metlink: [[4103, 4610, "mtFp"], [5010, 5396, "mtFp"], [7008, 7348, "krDfb"],
    ...each([3282, 3294, 3339, 3349, 3355, 3376, 3394, 3404, 5646, 5658, 5820, 5837], "wcSw"), ...each([3298, 5660, 5723], "wcSws"), ...each([3365, 3422, 5671], "wcSwg")],
};
const MATANGI = ["mtFp", "mtFt"];
const units = (n) => Array.from({ length: n }, () => [["mtFp", 1], ["mtFt", 1]]).flat();
const WAIRARAPA = new Set(["krDfb", "wcSw", "wcSws", "wcSwg"]);
export const TYPICAL = {
  metlink: (t, reported) => {
    const route = t.route || "";
    if (/Wairarapa/i.test(route) || WAIRARAPA.has(reported)) {
      // From the Masterton end: the SWG, an SW, the SWS, the other SWs; the
      // locomotive at the front either way.
      const set = [["wcSwg", 1], ["wcSw", 1], ["wcSws", 1], ["wcSw", 3]];
      const toWellington = /Wellington/i.test(t.destination || "");
      return { label: "DFB locomotive with Mark 2 carriages, usually 5 to 8", units: [["krDfb", 1], ...(toWellington ? set.slice().reverse() : set)] };
    }
    const named = Math.min(4, new Set(t.cars?.numbers || []).size);
    if (named && MATANGI.includes(reported)) {
      return { label: `Matangi electric train, ${named === 1 ? "one two-car unit (more may be coupled)" : `${named} two-car units`}`, units: units(named) };
    }
    if (/Johnsonville|Melling/i.test(route)) return { label: "Matangi electric unit, usually 2 cars (4 at busy times)", units: units(1) };
    return { label: "Matangi electric units, usually 4 cars (6 or 8 at peak times)", units: units(2) };
  },
};

const kmh = (v) => Math.round((v / 1.609344) * 10) / 10, kw = (v) => Math.round(v / 0.7457);
const WP = "https://en.wikipedia.org/wiki/";
const MATANGI_FACTS = { model: "FP/FT Matangi", type: "Electric multiple unit", builder: "Hyundai Rotem and Mitsui (Changwon, South Korea)", built: "2010–2012, 2015–2016",
  fleet: "83 two-car units (4103–4610, 5010–5396)", topSpeedMph: kmh(95), powerHp: kw(680), seats: 147, lengthFt: 144.5,
  about: "Wellington's suburban trains: a motor car with the pantograph and a low-floor trailer, run singly or two to four coupled on the Kāpiti, Hutt Valley, Melling and Johnsonville lines. Seats are a unit's.",
  source: `${WP}New_Zealand_FP_class_electric_multiple_unit` };
export const FACTS = {
  mtFp: MATANGI_FACTS, mtFt: MATANGI_FACTS,
  wcSw: { model: "SW carriage (British Rail Mark 2)", type: "Passenger coach", builder: "British Rail (Derby); rebuilt by Hillside Engineering", built: "1971–1975, rebuilt 2007",
    fleet: "18 cars in three sets", topSpeedMph: kmh(100), seats: 64, lengthFt: 64.5,
    about: "The Wairarapa Connection's carriages, British Rail Mark 2s bought by Tranz Rail and rebuilt for New Zealand's narrow gauge. Alstom's Tūhono battery trains are to replace them from about 2030.",
    source: `${WP}Wairarapa_Connection` },
};
