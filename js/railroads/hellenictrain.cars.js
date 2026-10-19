// Hellenic Train's cars (scripts/railroads/hellenictrain.py). The tracker
// names each train's unit or locomotive (locomotiveNumber: "460110" is
// Desiro set 460 110's cab car, "120015" a class 120 locomotive), so a
// train is drawn as that model's usual formation; one with no number known
// here, as what usually runs on its line. Bodies and parts from
// czechia.cars.js, each in its current paint (the Proastiakos's violet and
// cream, white with blue, the red 220s), lettered here.

import { bilevel } from "../carmodels.js?v=dev";
import { C, rect, path, poly, truck, slats, underframe } from "../carart.js?v=dev";
import { euroLoco, unit, letters, htLogo, hvac, exhaust, tank, HT, TYPES as CZ_TYPES, MODELS as CZ_MODELS } from "./czechia.cars.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
const plug = (x, sill, top, w = 4.4) => ({ x, w, y0: sill, y1: top, leaves: 2, glassY: 0.4, glassH: 0.45 });
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 3, depth = 1.3) => underframe(a, b, top, { depth, boxes: k, tanks: false });

// Siemens Desiro (class 460): five articulated sections, 89.3 m, on Jakobs
// trucks at the joints and a motor truck under each cab; a big raked
// windshield over a rounded nose; one double door a side in each section,
// the pantograph on the middle one. The Proastiakos's paint: cream, violet
// along the bottom under a lilac line, rising round the nose to the
// windshield; the name in violet over the windows.
const NOSE_460 = [[1.2, 3.6], [0.9, 5.4], ["q", 0.8, 7.0, 1.6, 8.0], [4.6, 12.6], ["q", 5.6, 13.9, 7.6, 13.9]];
const desiroPaint = (cab) => (c, g) => bands(g.L, [[0, 20, HT.cream], [12.9, 3, "#c3c8ce"], [0, 5.5, HT.violet], [5.5, 0.22, HT.lilac]]) +
  (cab ? path("M-1 0L-1 8.2Q2.4 8.5 4.6 7.0Q6.8 5.5 9.6 5.5L9.6 0Z", HT.violet) + path("M-1 8.2Q2.4 8.5 4.6 7.0Q6.8 5.5 9.6 5.5L9.6 5.72Q6.9 5.72 4.8 7.2Q2.5 8.75 -1 8.45Z", HT.lilac) : "");
const desiroCab = (c) => unit(c, { roof: 13.9, sill: 3.6, nose: NOSE_460, rake: [[1.6, 8.0], [4.6, 12.6]], cabLen: 8, low: 5.0, lampY: 5.0,
  rows: [{ xs: [9.8], y: 6.4, w: 2.4, h: 3.8, r: 0.4 }, { xs: seq(13.6, 5.7, 2), y: 6.4, w: 4.8, h: 3.8, r: 0.45 }, { xs: seq(31.0, 5.7, 5), y: 6.4, w: 4.8, h: 3.8, r: 0.45 }],
  doors: [plug(25.4, 3.6, 10.6)], trucks: [11.0, "end"], paint: desiroPaint(true), doorFill: () => "#e4e1da",
  extra: (cc, g) => hvac(15, 13.9, 10) + hvac(40, 13.9, 12) + boxes(31, 54, 3.6, 2, 0.8) +
    letters(cc, 44, 11.35, 0.95, "Proastiakos", HT.violet, { weight: 700, style: "italic" }) + htLogo(cc, 40, 4.55, 0.55, "#ffffff") });
const desiroMid = (c) => unit(c, { roof: 13.9, sill: 3.6, low: 5.0,
  rows: [{ xs: seq(3.4, 5.7, 3), y: 6.4, w: 4.8, h: 3.8, r: 0.45 }, { xs: seq(32.2, 5.7, 4), y: 6.4, w: 4.8, h: 3.8, r: 0.45 }],
  doors: [plug(c.L / 2 - 2.2, 3.6, 10.6)], trucks: ["start", "end"], pan: c.index === 2 ? c.L / 2 - 6 : null, paint: desiroPaint(false), doorFill: () => "#e4e1da",
  extra: (cc) => (cc.index === 2 ? hvac(4, 13.9, 9) : hvac(6, 13.9, 10) + hvac(36, 13.9, 10)) + boxes(6, 22, 3.6, 2, 0.8) + boxes(34, 50, 3.6, 2, 0.8) });

// Stadler GTW 2/6 (class 560): two passenger sections of 17.9 m, each on a
// truck under its cab and hung at its inner end from the short power module
// between them (as the built-in GTW, js/carmodels.js); a raked nose, one
// wide double door a side. White, light blue stripes low on the side, blue
// under the windshield, yellow doors; the name over the windows.
const NOSE_GTW = [[1.0, 2.4], [1.0, 5.6], ["q", 1.1, 6.8, 1.8, 7.8], [3.6, 11.9], ["q", 4.2, 12.8, 5.6, 12.8]];
const gtwPaint = (c, g) => bands(g.L, [[0, 20, HT.white], [11.8, 3, "#9aa1a9"], [2.85, 1.1, HT.sky], [4.15, 0.25, HT.sky], [0, 2.6, "#3a3f45"]]) +
  path("M-1 2.4L-1 7.6Q1.4 7.6 3.0 6.4Q4.6 5.2 7.0 5.2L7.0 2.4Z", HT.blue);
const gtwCar = (c) => unit(c, { roof: 12.8, sill: 2.4, nose: NOSE_GTW, rake: [[1.8, 7.8], [3.6, 11.9]], depth: 2.4, cabLen: 6, lampY: 4.2,
  rows: [{ xs: [11.6, 16.8, 30.2, 35.9, 41.5, 47.2, 52.8], y: 5.6, w: 4.3, h: 3.8, r: 0.45 }],
  doors: [{ x: 23.0, w: 5.2, y0: 2.1, y1: 9.6, leaves: 2, glassY: 0.3, glassH: 0.55 }], diaphragm: [2.6, 11.2], paint: gtwPaint, doorFill: () => HT.yellow,
  extra: (cc) => truck(9.2, { wb: 6.9, d: 30, top: 2.4 }) + hvac(19, 12.8, 9) + hvac(38, 12.8, 7) + boxes(30, 50, 2.4, 2, 0.6) + htLogo(cc, 40, 10.6, 0.6) });
// The power module: a short, tall box over its own truck, with a corridor
// through it between the sections; louvers either side of the corridor
// door, radiators and the exhaust on the roof, fuel tanks under it.
function gtwPower(c) {
  const L = c.L, roof = 13.4, sill = 3.4;
  return bilevel({ ...c, cabL: false, cabR: false }, {
    roof, sill, cornerR: 0.6, end: 0.4, noTrucks: true, badge: false, rows: [], doors: [], diaphragm: [3.6, 12.2],
    paint: () => bands(L, [[0, 20, HT.white], [12.2, 3, "#9aa1a9"], [2.85, 1.1, HT.sky], [0, 3.6, "#3a3f45"], [4.15, 0.25, HT.sky]]),
    extra: () => {
      let s = truck(L / 2, { wb: 7.2, d: 33, kind: "loco", top: sill });
      for (const x of [1.4, L - 5.6]) s += rect(x, 5.4, 4.2, 5.6, "rgba(20,22,25,0.55)", 0.4, 'rx="0.15"') + slats(x, 5.4, 4.2, 5.6, 0.35, "rgba(255,255,255,0.18)");
      s += rect(L / 2 - 1.6, 4.6, 3.2, 7.0, "rgba(0,0,0,0.06)", 0.5) + rect(L / 2 - 0.9, 8.6, 1.8, 2.0, C.glass, 0, 'rx="0.2"');
      s += rect(1.0, roof - 0.05, L - 2.0, 0.7, C.steelDark, 0.4, 'rx="0.25"') + slats(1.6, roof + 0.1, L - 3.2, 0.45, 0.45, "rgba(0,0,0,0.25)");
      return s + exhaust(L / 2 - 1.2, roof + 0.6) + tank(1.2, L / 2 - 3.8, sill, 1.6) + tank(L / 2 + 3.8, L - 1.2, sill, 1.6);
    },
  });
}

// MAN-2000 (class 621): two-car diesel units of 47.2 m, a boxy cab with a
// flat windshield; two double doors a side in each car, the engine under
// the floor. White, a blue band under the windows over a navy skirt, a
// light blue line; blue doors.
const NOSE_621 = [[1.0, 3.9], [0.9, 7.2], ["q", 1.0, 8.2, 1.7, 8.9], [2.6, 12.4], ["q", 3.0, 13.2, 4.4, 13.2]];
const manPaint = (c, g) => bands(g.L, [[0, 20, HT.white], [12.2, 3, "#a9b0b8"], [0, 4.6, "#16274f"], [4.6, 1.85, HT.blue], [6.6, 0.2, HT.sky]]) +
  path("M-1 6.45L-1 8.9L1.7 8.9L3.2 6.45Z", HT.blue);
const man2000 = (c) => unit(c, { roof: 13.2, sill: 3.9, nose: NOSE_621, rake: [[1.7, 8.9], [2.6, 12.4]], depth: 2.4, cabLen: 6, low: 5.6, lampY: 5.8,
  rows: [{ xs: [8.6], y: 7.0, w: 2.6, h: 3.0, r: 0.35 }, { xs: seq(18.6, 5.3, 8), y: 7.0, w: 4.4, h: 3.0, r: 0.4 }],
  doors: [plug(12.6, 3.9, 11.0, 4.2), plug(c.L - 9.6, 3.9, 11.0, 4.2)], trucks: [9.5, c.L - 8.5], diaphragm: [4.2, 11.6], paint: manPaint, doorFill: () => "#2a62b0",
  extra: (cc, g) => hvac(20, 13.2, 10) + hvac(46, 13.2, 8) + exhaust(34, 13.2) + boxes(16, 30, 3.9, 2, 1.3) + tank(31, 40, 3.9, 1.5) + boxes(41, g.L - 15, 3.9, 2, 1.2) +
    htLogo(cc, 42, 5.5, 0.7, "#ffffff") });

// Siemens EuroSprinter ES64P (class 120): a Taurus-like rounded nose, 19.58
// m. White, a red band over a blue one low on the side, gray roof; the name
// between the grilles. Adtranz DE2000 (class 220): a boxier diesel, red, a
// white band low along the middle under a blue panel of louvers, the white
// "Marlboro" chevron on the nose; the exhaust and radiator fans on the
// roof, the fuel tank between the trucks.
const NOSE_120 = [[1.3, 4.1], [1.1, 6.9], ["q", 1.2, 8.4, 2.5, 9.6], [3.6, 12.0], ["q", 4.1, 12.9, 5.4, 12.9]];
const NOSE_220 = [[1.2, 4.1], [1.1, 7.4], ["q", 1.2, 8.5, 1.9, 9.3], [3.0, 12.2], ["q", 3.4, 12.9, 4.6, 12.9]];
const paint120 = (c, L) => bands(L, [[0, 20, HT.white], [11.8, 3, "#9aa1a9"], [5.05, 2.5, HT.red], [4.45, 0.6, HT.blue], [0, 4.45, "#1d1e20"]]) +
  path("M-1 7.55L-1 9.4Q1.4 9.4 2.6 8.6L4.2 7.55Z", HT.red);
const over120 = (c, L) => htLogo(c, L / 2 + 1.6, 9.0, 0.62) + letters(c, L - 16, 6.3, 0.6, "120", "#ffffff", { weight: 600 });
const paint220 = (c, L) => bands(L, [[0, 20, "#c8102e"], [11.8, 3, "#8e959d"], [0, 4.65, "#1d1e20"]]) + rect(12.5, 4.65, L - 25, 2.6, HT.white) +
  rect(15.0, 7.4, L - 30, 3.8, "#2a3f8f", 0, 'rx="0.2"') + path(poly([[-1, 4.65], [2.4, 4.65], [3.6, 9.2], [2.3, 9.2], [-1, 6.4]]), HT.white);
const under220 = (c, L) => tank(L / 2 - 10, L / 2 + 10, 4.1, 1.35) + rect(L / 2 - 9, 3.0, 4, 0.6, C.steelDark, 0, 'rx="0.3"');
const roof220 = (c, L) => exhaust(L / 2 - 4, 12.9) + [L / 2 + 6, L / 2 + 12].map((x) => path(`M${x - 2.2} 12.85Q${x} 13.7 ${x + 2.2} 12.85Z`, C.steelDark, 0.4)).join("") +
  rect(L / 2 - 14, 12.85, 8, 0.45, C.steelDark, 0.4, 'rx="0.2"') + slats(L / 2 - 13.5, 12.9, 7, 0.35, 0.45, "rgba(0,0,0,0.25)");
const over220 = (c, L) => htLogo(c, L / 2 + 1.4, 5.95, 0.72) + letters(c, 16.5, 12.1, 0.55, "220", "#ffffff", { weight: 600 });

export const TYPES = {
  czCoach: CZ_TYPES.czCoach,
  htDesiroCab: { name: "Siemens Desiro end section", kind: "emu" },
  htDesiroMid: { name: "Siemens Desiro intermediate section", kind: "emu" },
  htGtwCar: { name: "Stadler GTW passenger section", kind: "emu" },
  htGtwPower: { name: "Stadler GTW power module", kind: "module" },
  htMan2000: { name: "MAN-2000 diesel car", kind: "emu" },
  ht120: { name: "EuroSprinter electric locomotive", kind: "electric", pan: true },
  ht220: { name: "DE2000 diesel locomotive", kind: "diesel" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  czCoach: CZ_MODELS.czCoach,
  htDesiroCab: M(desiroCab, 63.3, true),
  htDesiroMid: M(desiroMid, 55.4, false, (ctx) => ctx.index),
  htGtwCar: M(gtwCar, 58.85, true),
  htGtwPower: M(gtwPower, 16.4),
  htMan2000: M(man2000, 77.4, true),
  ht120: M((c) => euroLoco(c, { roof: 12.9, sill: 4.1, nose: NOSE_120, rake: [[2.5, 9.6], [3.6, 12.0]], centers: 32.8, door: 6.4, paint: paint120, over: over120,
    grilles: [[-14.5, 8.0, 7.6, 10.6], [6.5, 8.0, 7.6, 10.6]] }), 64.24),
  ht220: M((c) => euroLoco(c, { roof: 12.9, sill: 4.1, nose: NOSE_220, rake: [[1.9, 9.3], [3.0, 12.2]], centers: 32.0, door: 5.6, pans: false, wheel: 43,
    grilles: [[-16.0, 7.0, 7.8, 10.8], [-5.5, 11.0, 7.8, 10.8], [9.0, 7.0, 7.8, 10.8]], grilleFill: "rgba(20,22,25,0.3)",
    paint: paint220, over: over220, under: under220, roof2: roof220 }), 63.6),
};

// The tracker's locomotiveNumber, as a number: each Desiro set reports from
// both cab cars (460 101-120 and 460 201-220), each GTW from its passenger
// sections (560 1xx, 2xx) or power module (560 9xx), each MAN-2000 from
// either car (621 1xx, 2xx).
export const FLEETS = {
  hellenictrain: [[460101, 460120, "htDesiroCab"], [460201, 460220, "htDesiroCab"], [560101, 560117, "htGtwCar"], [560201, 560217, "htGtwCar"],
    [560901, 560917, "htGtwPower"], [621101, 621115, "htMan2000"], [621201, 621215, "htMan2000"], [120001, 120030, "ht120"], [220001, 220036, "ht220"]],
};

const set = (label, ...units) => ({ label, units });
const DESIRO = set("Siemens Desiro: a five-section electric unit", ["htDesiroCab", 1], ["htDesiroMid", 3], ["htDesiroCab", 1]);
const GTW = set("Stadler GTW: a two-section diesel railcar", ["htGtwCar", 1], ["htGtwPower", 1], ["htGtwCar", 1]);
const MAN2000 = set("MAN-2000: a two-car diesel unit", ["htMan2000", 2]);
const LOCO120 = set("A class 120 electric locomotive and coaches", ["ht120", 1], ["czCoach", 6]);
const LOCO220 = set("A class 220 diesel locomotive and coaches", ["ht220", 1], ["czCoach", 5]);

// By the reported unit; else by line, as the tracker showed them on
// 2026-10-18: the Proastiakos's electric lines run Desiros (Thessaloniki-
// Larissa also a class 120 and coaches), Kiato-Aigio (trains 300-311) GTWs;
// the Intercitys a class 220 and coaches (the ETR 470s, when in service, are
// not drawn); Athens-Leianokladi (520, 521) a class 120 and coaches; the
// regional lines to Florina, Edessa and Ormenio MAN-2000s.
export const TYPICAL = {
  hellenictrain: (t, reported) => {
    if (reported === "htDesiroCab") return DESIRO;
    if (reported === "htGtwCar" || reported === "htGtwPower") return GTW;
    if (reported === "ht120") return LOCO120;
    if (reported === "ht220") return LOCO220;
    if (reported === "htMan2000") return MAN2000;
    if (t.route === "Intercity") return LOCO220;
    if (t.route === "Proastiakos") return /^3\d\d$/.test(t.number || "") ? GTW : DESIRO;
    return /^52\d$/.test(t.number || "") ? LOCO120 : MAN2000;
  },
};

const WP = "https://en.wikipedia.org/wiki/";
export const FACTS = {
  htDesiroCab: { model: "Siemens Desiro (class 460)", type: "Electric multiple unit", builder: "Siemens, built at Hellenic Shipyards", built: "2004–2006",
    fleet: "20 five-car sets, 460 101/201–120/220", topSpeedMph: 99.4, powerHp: 5150, lengthFt: 293, source: `${WP}OSE_class_460`,
    about: "The Athens and Thessaloniki Proastiakos's electric trains: five articulated sections on shared trucks. Two sets can run coupled as one ten-car train." },
  htDesiroMid: { model: "Siemens Desiro (class 460)", type: "Electric multiple unit", builder: "Siemens, built at Hellenic Shipyards", built: "2004–2006",
    fleet: "20 five-car sets", topSpeedMph: 99.4, powerHp: 5150, source: `${WP}OSE_class_460`,
    about: "An intermediate section of a class 460, resting on Jakobs trucks shared with its neighbours." },
  htGtwCar: { model: "Stadler GTW 2/6 (class 560)", type: "Diesel multiple unit", builder: "Stadler, Bombardier and Hellenic Shipyards", built: "2003",
    fleet: "17, 560 101–117", topSpeedMph: 71.5, powerHp: 738, seats: 94, source: `${WP}Stadler_GTW_in_Greece`,
    about: "Two passenger sections hung from a short power module holding the engine. Hellenic Train runs them on Kiato–Aigio, Leianokladi–Stylida and other lines off the wires." },
  htGtwPower: { model: "Stadler GTW 2/6 (class 560) power module", type: "Power module", builder: "Stadler, Bombardier and Hellenic Shipyards", built: "2003",
    fleet: "17, 560 901–917", powerHp: 738, source: `${WP}Stadler_GTW_in_Greece`,
    about: "The GTW's power module carries its MTU diesel engine, with a corridor through it between the two passenger sections." },
  htMan2000: { model: "MAN-2000 (class 621)", type: "Diesel multiple unit", builder: "Bombardier and Hellenic Shipyards", built: "2006–2007",
    fleet: "15 two-car units, 621 101/201–115/215", topSpeedMph: 77.7, seats: 140, lengthFt: 154.9, source: "https://www.railwaygazette.com/news/ose-dmus-enter-service/30723.article",
    about: "Two-car diesel units ordered in 1997 and delayed by the builders' troubles; the first entered service in July 2006. Hellenic Train runs them on regional lines off the wires, such as Thessaloniki–Edessa–Florina and Alexandroupoli–Ormenio." },
  ht120: { model: "Siemens EuroSprinter ES64P (class 120)", type: "Electric locomotive", builder: "Krauss-Maffei and Siemens", built: "1996–2001", fleet: "30, 120 001–030",
    powerHp: 6705, lengthFt: 64.2, source: `${WP}Siemens_EuroSprinter`,
    about: "Greece's 25 kV electric locomotives, close to the ES64P prototype. On 18 October 2026 the tracker showed them on Athens–Leianokladi and Thessaloniki–Larissa passenger trains; they also haul freight." },
  ht220: { model: "Adtranz DE2000 (class 220)", type: "Diesel-electric locomotive", builder: "Adtranz (later Bombardier)", built: "1997, 2003–2004", fleet: "36, 220 001–036",
    topSpeedMph: 99.4, powerHp: 2816, source: `${WP}OSE_Class_220`,
    about: "Known for its red-chevron \"Marlboro\" front, the DE2000 hauls Intercity trains (the tracker showed IC50 and IC51 behind 220s on 18 October 2026), trains on the Paleofarsalos–Kalambaka line, and freight." },
  "czCoach@hellenictrain": { model: "Intercity coach", type: "Passenger coach", builder: "Various", lengthFt: 86.6, source: `${WP}Hellenic_Train`,
    about: "Hellenic Train's locomotive-hauled trains are made up of standard European coaches, drawn here in white with a blue band, the name on it." },
};
