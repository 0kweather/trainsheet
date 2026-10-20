// South Tyrol's trains (scripts/railroads/sta.py): the province's own
// fleet, owned by STA (Strutture Trasporto Alto Adige) and run by SAD and
// Trenitalia: Stadler FLIRTs, the new Alstom Coradia Streams and the
// Vinschgau line's GTW railcars. The timetable names no unit, so a train
// is drawn as what usually runs on its line, labeled as typical.
// Trainsheet's own side views from published dimensions and photographs
// (Wikimedia Commons), at the shared scale, lettered here (no logo files).
// Builders from trenord.cars.js, parts from czechia.cars.js.

import { rect, path, truck } from "../carart.js?v=dev";
import { unit, letters, hvac } from "./czechia.cars.js?v=dev";
import { single, powerModule, bands, boxes, cover, step } from "./trenord.cars.js?v=dev";

// ---------- Paint ----------
// The FLIRTs and GTWs: silver, the windows in a dark band, a patchwork of
// color blocks along the top of the side (lime, yellow, magenta, red and
// white); at the cab a lime frame round the windshield, a red band between
// the headlights, a dark gray skirt. The Coradia Streams: silver-gray, the
// cab ends lime-yellow back to the first door, blocks of red, orange and
// yellow on the middle cars.
const ST = { silver: "#c9ccd0", deep: "#a9aeb4", band: "#24272b", lime: "#b5d334", yellow: "#f2d21b", magenta: "#e0457b", red: "#e3342f", white: "#f4f5f5",
  skirt: "#4a4d50", roof: "#9aa0a7", stream: "#bcc0c4", cab: "#cfd52a", orange: "#f08a24" };
const PATCH = [ST.lime, ST.white, ST.yellow, ST.magenta, ST.white, ST.red, ST.lime, ST.yellow, ST.white, ST.magenta];
// The patchwork: blocks of varied width from x0 along the band y..y+h.
function patchwork(L, y, h, seed = 0, x0 = 0) {
  let s = "", x = x0, k = seed;
  while (x < L + 1) {
    const w = 2.2 + ((k * 7) % 5) * 0.9;
    s += rect(x, y, w, h, PATCH[k % PATCH.length]);
    x += w; k++;
  }
  return s;
}
const flirtPaint = (cab) => (c, g) => {
  let s = bands(g.L, [[0, 20, ST.silver], [12.85, 3, ST.roof], [6.25, 4.2, ST.band], [0, 3.0, ST.skirt]]) + patchwork(g.L, 11.0, 1.15, c.index ?? 0, cab ? 10.5 : 0);
  if (cab) s += path("M1.6 7.7Q3.6 10.6 5.2 12.9L10.2 12.9L10.2 12.25L5.6 12.25Q4.0 9.9 2.2 7.5Z", ST.lime) + path("M-1 4.0L-1 5.1L6.0 5.1L6.0 4.0Z", ST.red);
  return s;
};
const streamPaint = (cab) => (c, g) => {
  let s = bands(g.L, [[0, 20, ST.stream], [12.9, 3, ST.roof], [0, 3.6, ST.skirt], [3.6, 0.2, ST.white]]);
  if (cab) s += path("M-1 3.8L17.6 3.8L17.6 14L-1 14Z", ST.cab);
  else for (const [x, w, f] of [[3, 3.2, ST.red], [6.2, 2.4, ST.orange], [8.6, 3.0, ST.yellow]]) s += rect(x, 3.8, w, 1.3, f) + rect(g.L - x - w, 3.8, w, 1.3, f);
  return s;
};
const staName = (c, x, y, h, fill = ST.band) => letters(c, x, y, h, "südtirol · alto adige", fill, { weight: 700, spacing: "0.02em" });
const plate = (c, x, y, text, fill = "#ffffff") => letters(c, x, y, 0.5, text, fill, { weight: 600, spacing: "0.04em" });

// ---------- Stadler FLIRT (ETR 170, ex-ETR 155) ----------
// Six sections on Jakobs trucks, about 106 m: cab sections 21.5 m to the
// joint, intermediates 15.7 m; one wide double door a side in each
// section; a rounded nose under a wrap-around windshield. 3 kV DC and
// Austria's 15 kV, for Innsbruck and Lienz.
const FL = { roof: 13.85, sill: 3.0 };
const NOSE_FLIRT = [[1.0, 3.0], [1.0, 5.8], ["q", 1.1, 7.0, 2.0, 8.0], [5.4, 12.85], ["q", 6.2, 13.85, 8.0, 13.85]];
const flWin = { y: 6.55, w: 4.6, h: 3.6, pitch: 5.25 };
function flirtCab(c) {
  const L = c.L;
  return single(c, { ...FL, nose: NOSE_FLIRT, rake: [[2.0, 8.0], [5.4, 12.85]], depth: 3.1, cabLen: 9, lampY: 4.6, doors: [23.6], doorW: 4.27, doorY: 2.9,
    win: flWin, trucks: [L - 51.8 > 0 ? 9.6 : 9.6, "end"], wheel: 30, paint: flirtPaint(true), doorFill: () => ST.deep, surround: ST.band,
    extra: (cc, g) => hvac(21, FL.roof, 10) + hvac(44, FL.roof, 8) + boxes(29, g.L - 8, FL.sill, 2, 0.7) + staName(cc, 46, 5.0, 0.75, ST.band) + plate(cc, 14.0, 5.0, "ETR 170", ST.band) });
}
function flirtMid(c) {
  const L = c.L, pan = c.index === 2 || c.index === 3;
  return single(c, { ...FL, doors: [18.5], doorW: 4.27, doorY: 2.9, win: flWin, trucks: ["start", "end"], wheel: 30, paint: flirtPaint(false), doorFill: () => ST.deep,
    pan: pan ? L / 2 - 4 : null,
    extra: (cc, g) => (pan ? cover(g.L - 13, FL.roof, 9) : hvac(4, FL.roof, 9) + hvac(30, FL.roof, 9)) + boxes(26, g.L - 6, FL.sill, 2, 0.6) });
}

// ---------- Alstom Coradia Stream (ETR 160) ----------
// Six single-deck cars on their own trucks, 127.9 m; two double doors a
// side, the cab door behind each cab; a blunt rounded nose, the windshield
// in a black mask; the roof lined with equipment covers. 3, 15 and 25 kV.
const CS = { roof: 13.7, sill: 3.6 };
const NOSE_STREAM = [[1.3, 3.6], [1.0, 5.8], ["q", 1.0, 7.6, 2.4, 8.8], [4.8, 12.7], ["q", 5.7, 13.7, 7.4, 13.7]];
const csWin = { y: 6.5, w: 4.8, h: 3.9, pitch: 5.7 };
function streamCab(c) {
  const L = c.L;
  return single(c, { ...CS, nose: NOSE_STREAM, rake: [[2.4, 8.8], [4.8, 12.7]], depth: 3.0, cabLen: 9, lampY: 5.0, doors: [18.4, L - 13.0], doorY: 2.9,
    win: csWin, trucks: [9.0, L - 7.6], paint: streamPaint(true), doorFill: () => "#7d8288", surround: ST.band,
    extra: (cc, g) => cover(12, CS.roof, 14, 0.7, "#5d6268") + hvac(30, CS.roof, 11) + cover(g.L - 18, CS.roof, 12, 0.7, "#5d6268") + boxes(25, g.L - 15, CS.sill, 2, 1.0) +
      staName(cc, 45, 5.1, 0.75, "#2a2d31") + plate(cc, g.L - 6, 5.1, "ETR 160", "#2a2d31") });
}
function streamMid(c) {
  const L = c.L, pan = c.index === 2;
  return single(c, { ...CS, doors: [9.4, L - 13.7], doorY: 2.9, win: csWin, trucks: [7.4, L - 7.4], paint: streamPaint(false), doorFill: () => "#7d8288",
    pan: pan ? L / 2 - 6 : null,
    extra: (cc, g) => (pan ? cover(g.L / 2 + 5, CS.roof, 10, 0.7, "#5d6268") : cover(10, CS.roof, 16, 0.7, "#5d6268") + hvac(g.L - 24, CS.roof, 11)) + boxes(16, g.L - 16, CS.sill, 2, 1.0) });
}

// ---------- Stadler GTW 2/6 (ATR 100) ----------
// The Vinschgau line's diesel railcars since its reopening in 2005: two
// passenger sections of 17.9 m hung on a short power module; one wide
// double door a side. The FLIRTs' silver and patchwork.
const GTW = { roof: 12.8, sill: 2.4 };
const NOSE_GTW = [[1.0, 2.4], [1.0, 5.6], ["q", 1.1, 6.8, 1.8, 7.8], [3.6, 11.9], ["q", 4.2, 12.8, 5.6, 12.8]];
const gtwPaint = (c, g) => bands(g.L, [[0, 20, ST.silver], [11.8, 3, ST.roof], [5.25, 4.6, ST.band], [0, 2.4, ST.skirt]]) + patchwork(g.L, 10.25, 1.05, 3, 7) +
  path("M1.3 6.9Q2.6 9.4 3.4 11.9L7.0 11.9L7.0 11.4L3.8 11.4Q3.0 9.0 1.8 6.7Z", ST.lime) + rect(-1, 3.4, 5.6, 0.9, ST.red);
function gtwCar(c) {
  return unit(c, { roof: GTW.roof, sill: GTW.sill, nose: NOSE_GTW, rake: [[1.8, 7.8], [3.6, 11.9]], depth: 2.4, cabLen: 6, lampY: 4.2,
    rows: [{ xs: [11.6, 16.8, 30.2, 35.9, 41.5, 47.2, 52.8], y: 5.6, w: 4.3, h: 3.8, r: 0.45 }],
    doors: [{ x: 23.0, w: 5.2, y0: 2.1, y1: 9.6, leaves: 2, glassY: 0.3, glassH: 0.55, fill: ST.deep }], diaphragm: [2.6, 11.2], paint: gtwPaint, surround: ST.band,
    extra: (cc) => truck(9.2, { wb: 6.9, d: 30, top: 2.4 }) + step(23.0, 5.2, 2.1) + hvac(19, GTW.roof, 9) + hvac(38, GTW.roof, 7) + boxes(30, 50, 2.4, 2, 0.6) +
      staName(cc, 41, 4.2, 0.65) + plate(cc, 14.0, 4.2, "ATR 100", ST.band) });
}
const gtwPack = (c) => powerModule(c, { roof: 13.4, sill: 3.4, paint: (L) => bands(L, [[0, 20, ST.silver], [12.4, 3, ST.roof], [0, 3.4, ST.skirt]]) + patchwork(L, 10.85, 1.05, 5, 0) });

// ---------- Tables ----------

export const TYPES = {
  staFlirtCab: { name: "Stadler FLIRT end section", kind: "emu", amenities: ["first"] },
  staFlirtMid: { name: "Stadler FLIRT intermediate section", kind: "emu", pan: true },
  staStreamCab: { name: "Coradia Stream end car", kind: "emu" },
  staStreamMid: { name: "Coradia Stream intermediate car", kind: "emu", pan: true },
  staGtwCar: { name: "Stadler GTW passenger section", kind: "emu" },
  staGtwPack: { name: "Stadler GTW power module", kind: "module" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
export const MODELS = {
  staFlirtCab: M(flirtCab, 70.5, true),
  staFlirtMid: M(flirtMid, 51.5, false, byIndex),
  staStreamCab: M(streamCab, 72.0, true),
  staStreamMid: M(streamMid, 68.0, false, byIndex),
  staGtwCar: M(gtwCar, 58.85, true),
  staGtwPack: M(gtwPack, 16.4),
};

// Units by class and serial: the first FLIRTs (ETR 170 001-004 and the
// ETR 155 001-004 lengthened to six sections), the 2011 batch (170 101-
// 108; 109-110 are Trentino Trasporti's), the three-voltage 2017 batch
// (170 2xx, as photographed); the Coradia Streams ETR 160 0xx; the GTWs
// ATR 100 001-012.
export const FLEETS = {
  sta: [[170001, 170004, "staFlirtCab"], [155001, 155004, "staFlirtCab"], [170101, 170108, "staFlirtCab"], [170201, 170207, "staFlirtCab"],
    [160001, 160021, "staStreamCab"], [100001, 100012, "staGtwCar"]],
};

const set = (label, ...units) => ({ label, units });
const FLIRT = set("Stadler FLIRT (ETR 170): a six-section electric unit", ["staFlirtCab", 1], ["staFlirtMid", 4], ["staFlirtCab", 1]);
const STREAM = set("Coradia Stream (ETR 160): a six-car electric unit", ["staStreamCab", 1], ["staStreamMid", 4], ["staStreamCab", 1]);
const GTW1 = set("Stadler GTW (ATR 100): a two-section diesel railcar", ["staGtwCar", 1], ["staGtwPack", 1], ["staGtwCar", 1]);
const BY_MODEL = { staFlirtCab: FLIRT, staStreamCab: STREAM, staGtwCar: GTW1 };

// The Vinschgau line (Meran-Mals), electrified at 25 kV and reopened in
// stages from March 2026, is the Coradia Streams' first line; the FLIRTs
// run the Brenner, Pustertal (to Innichen and Lienz) and Bozen-Meran
// trains and the cross-border REX. The Streams spread across the province
// from mid-2026; the labels say "usually".
export const TYPICAL = {
  sta: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    const r = `${t.route || ""} ${t.destination || ""}`;
    if (/Vinsch|Venost|Mals|Malles|Schlanders|Silandro|Laas|Lasa/i.test(r)) return STREAM;
    return FLIRT;
  },
};

const DE = "https://de.wikipedia.org/wiki/";
const flirt = { model: "Stadler FLIRT (ETR 170)", type: "Electric multiple unit", builder: "Stadler Rail", built: "2008–2018", fleet: "23 six-section units",
  topSpeedMph: 99.4, source: `${DE}Stadler_FLIRT` };
export const FACTS = {
  staFlirtCab: { ...flirt, lengthFt: 348,
    about: "South Tyrol's FLIRTs, bought in four batches; the first four-section ETR 155s were lengthened to six. They run on both 3 kV DC and Austria's 15 kV, so they reach Innsbruck and Lienz." },
  staFlirtMid: { ...flirt, about: "An intermediate section of an ETR 170, sharing Jakobs trucks with its neighbours. A 2026 plan modernises all 23 units." },
  staStreamCab: { model: "Alstom Coradia Stream (ETR 160)", type: "Electric multiple unit", builder: "Alstom (Savigliano)", built: "Since 2024", fleet: "21 for South Tyrol and Tyrol",
    topSpeedMph: 99.4, powerHp: 4023, seats: 381, lengthFt: 419.6,
    source: "https://www.alstom.com/press-releases-news/2025/5/alstom-and-sta-unveil-first-21-coradia-stream-trains-new-regional-fleet-connecting-south-tyrol-italy-and-tyrol-austria",
    about: "Six-car trains for 3, 15 and 25 kV, shared with Tyrol. Their first line is the newly electrified Vinschgau line; from 2026 they also run Bozen–Innsbruck and towards Lienz." },
  staStreamMid: { model: "Alstom Coradia Stream (ETR 160)", type: "Electric multiple unit", builder: "Alstom (Savigliano)", built: "Since 2024", topSpeedMph: 99.4, seats: 381,
    source: "https://suedtirolmobil.info/en/news/details/new-trains-get-green-light", about: "An intermediate car of an ETR 160, on its own two trucks." },
  staGtwCar: { model: "Stadler GTW 2/6 (ATR 100)", type: "Diesel multiple unit", builder: "Stadler Rail", built: "2004–2005", fleet: "12 built, 11 left",
    source: `${DE}Vinschgaubahn`,
    about: "The diesel railcars that reopened the Vinschgau line in 2005. With the line electrified in 2026 the Coradia Streams take over, and the GTWs' remaining role is uncertain." },
  staGtwPack: { model: "Stadler GTW power module", type: "Power module", builder: "Stadler Rail", source: `${DE}Vinschgaubahn`,
    about: "The short module between the two passenger sections holds the diesel engine and generator." },
};
