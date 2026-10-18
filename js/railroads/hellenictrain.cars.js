// Hellenic Train's cars (scripts/railroads/hellenictrain.py). The tracker
// names each train's unit or locomotive (locomotiveNumber: "460110" is
// Desiro set 460 110's cab car, "120015" a class 120 locomotive), so a
// train is drawn as that model's usual formation; one with no number known
// here, as what usually runs on its line. Bodies from czechia.cars.js and the
// built-in GTW (js/carmodels.js), in Hellenic Train's white with a gray line,
// a black skirt and blue and red at the cab ends.

import { gtwCar, gtwPower } from "../carmodels.js?v=dev";
import { path } from "../carart.js?v=dev";
import { euroLoco, unit, side, repaint, TYPES as CZ_TYPES, MODELS as CZ_MODELS } from "./czechia.cars.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
const plug = (x, sill, top, w = 4.4) => ({ x, w, y0: sill, y1: top, leaves: 2, glassY: 0.4, glassH: 0.45 });

// Siemens Desiro (class 460): five articulated sections, 89.3 m, on Jakobs
// trucks at the joints and a motor truck under each cab; a big raked
// windshield over a rounded nose; one double door a side in each section,
// the pantograph on the middle one.
const NOSE_460 = [[1.2, 3.6], [0.9, 5.4], ["q", 0.8, 7.0, 1.6, 8.0], [4.6, 12.6], ["q", 5.6, 13.9, 7.6, 13.9]];
const desiroCab = (c) => unit(c, { roof: 13.9, sill: 3.6, nose: NOSE_460, rake: [[1.6, 8.0], [4.6, 12.6]], cabLen: 8, low: 5.0,
  rows: [{ xs: [9.8], y: 6.4, w: 2.4, h: 3.8, r: 0.4 }, { xs: seq(13.6, 5.7, 2), y: 6.4, w: 4.8, h: 3.8, r: 0.45 }, { xs: seq(31.0, 5.7, 5), y: 6.4, w: 4.8, h: 3.8, r: 0.45 }],
  doors: [plug(25.4, 3.6, 10.6)], trucks: [11.0, "end"], roofItems: [[15, 10, 0.6], [40, 12, 0.6]] });
const desiroMid = (c) => unit(c, { roof: 13.9, sill: 3.6, low: 5.0,
  rows: [{ xs: seq(3.4, 5.7, 3), y: 6.4, w: 4.8, h: 3.8, r: 0.45 }, { xs: seq(32.2, 5.7, 4), y: 6.4, w: 4.8, h: 3.8, r: 0.45 }],
  doors: [plug(c.L / 2 - 2.2, 3.6, 10.6)], trucks: ["start", "end"], pan: c.index === 2 ? c.L / 2 : null, roofItems: [[6, 10, 0.6]] });

// Stadler GTW 2/6 (class 560): the built-in GTW's two passenger sections and
// power module, CapMetro's silver and red swapped for Hellenic Train's white
// and blue, the red at the edge of the blue.
const HT_GTW = { "#c9cdd2": "#f2f3f4", "#d3d7dc": "#f2f3f4", "#e2251f": "#0a6ab4", "#a8231f": "#e2001a", "#3a3f45": "#1d1e20" };

// MAN-2000 (class 621): two-car diesel units of 47.2 m, a boxy cab with a
// flat windshield; two double doors a side in each car.
const NOSE_621 = [[1.0, 3.9], [0.9, 7.2], ["q", 1.0, 8.2, 1.7, 8.9], [2.6, 12.4], ["q", 3.0, 13.2, 4.4, 13.2]];
const man2000 = (c) => unit(c, { roof: 13.2, sill: 3.9, nose: NOSE_621, rake: [[1.7, 8.9], [2.6, 12.4]], depth: 2.4, cabLen: 6, low: 5.6,
  rows: [{ xs: [8.6], y: 7.0, w: 2.6, h: 3.0, r: 0.35 }, { xs: seq(18.6, 5.3, 8), y: 7.0, w: 4.4, h: 3.0, r: 0.4 }],
  doors: [plug(12.6, 3.9, 11.0, 4.2), plug(c.L - 9.6, 3.9, 11.0, 4.2)], trucks: [9.5, c.L - 8.5], roofItems: [[20, 10, 0.7], [44, 8, 0.7]], diaphragm: [4.2, 11.6] });

// Siemens EuroSprinter ES64P (class 120): a Taurus-like rounded nose, 19.58
// m. Adtranz DE2000 (class 220): a boxier diesel, its ends painted red in a
// chevron back from the cab (the "Marlboro" front).
const NOSE_120 = [[1.3, 4.1], [1.1, 6.9], ["q", 1.2, 8.4, 2.5, 9.6], [3.6, 12.0], ["q", 4.1, 12.9, 5.4, 12.9]];
const NOSE_220 = [[1.2, 4.1], [1.1, 7.4], ["q", 1.2, 8.5, 1.9, 9.3], [3.0, 12.2], ["q", 3.4, 12.9, 4.6, 12.9]];
const marlboro = (c, L) => side(c, L, { eave: 11.8, low: 6.3, skirt: 4.65 }) + path("M0 4.65L14.0 4.65L9.0 8.6L14.0 11.8L0 11.8Z", "#d52b1e");

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
const M = (draw, len, oneEnd = false) => ({ draw, len, oneEnd, variant: null });
export const MODELS = {
  czCoach: CZ_MODELS.czCoach,
  htDesiroCab: M(desiroCab, 63.3, true),
  htDesiroMid: M(desiroMid, 55.4),
  htGtwCar: M((c) => repaint(gtwCar(c), HT_GTW), 58.85, true),
  htGtwPower: M((c) => repaint(gtwPower(c), HT_GTW), 16.4),
  htMan2000: M(man2000, 77.4, true),
  ht120: M((c) => euroLoco(c, { roof: 12.9, sill: 4.1, nose: NOSE_120, rake: [[2.5, 9.6], [3.6, 12.0]], centers: 32.8, door: 6.4 }), 64.24),
  ht220: M((c) => euroLoco(c, { roof: 12.9, sill: 4.1, nose: NOSE_220, rake: [[1.9, 9.3], [3.0, 12.2]], centers: 32.0, door: 5.6, pans: false,
    grilles: [[-16.0, 7.0], [-5.5, 11.0], [9.0, 7.0]], paint: marlboro }), 63.6),
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
    about: "Hellenic Train's locomotive-hauled trains are made up of standard European coaches, drawn here in its white with a gray line." },
};
