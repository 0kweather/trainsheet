// EAV's trains (scripts/railroads/eav.py): Ente Autonomo Volturno's lines
// round Naples. The Circumvesuviana (950 mm gauge, 1.5 kV) runs short
// three-section articulated units: the new Stadler ETR 300, the Metrostar
// (ETR 200) and the old FE 220 and T 21; the standard-gauge Cumana and
// Circumflegrea (3 kV) two-car ET 400 and ET 500 units; the former
// Alifana to Piedimonte Matese Stadler's diesel ATR 803. The timetable
// names no unit, so a train is drawn as what usually runs on its line,
// labeled as typical. Trainsheet's own side views from published
// dimensions and photographs (Wikimedia Commons), at the shared scale,
// lettered here (no logo files). Builders from trenord.cars.js.

import { rect, path, poly } from "../carart.js?v=dev";
import { letters, hvac } from "./czechia.cars.js?v=dev";
import { single, powerModule, bands, boxes, cover } from "./trenord.cars.js?v=dev";

// ---------- Paint ----------
// EAV today: white, red doors and a red line along the bottom, a gray band
// at the window sills carrying EAV's name (the ETR 300, the repainted FE
// 220s). The Metrostar as built: night blue below the windows and over the
// roof, a white window band, red swooshes by the doors and a red nose band.
// The rebuilt T 21s red over night blue. The Cumana's ET 400s electric
// blue with a silver band low; the ET 500s royal blue with a silver wedge
// along the side and red under the windshield. The ATR 803s white, a
// green panel over the lower side.
const EV = { white: "#f4f4f4", red: "#d0202a", gray: "#9ea4aa", night: "#1c2a4a", blue: "#2a3fb0", royal: "#2440b8", silver: "#b5b8bc", green: "#3daa35",
  ink: "#1d2026", skirt: "#3a3f45", roof: "#a3a9b0" };
// EAV's name: the three letters, heavy, a red slash through the middle one's
// leg drawn as a stroke beside them.
const eavName = (c, x, y, h, fill = EV.night) => letters(c, x, y, h, "EAV", fill, { weight: 800, spacing: "0.02em" }) +
  path(poly([[x + h * 1.25, y - h * 0.38], [x + h * 1.5, y - h * 0.38], [x + h * 1.95, y + h * 0.38], [x + h * 1.7, y + h * 0.38]]), EV.red);
const plate = (c, x, y, text, fill = EV.ink) => letters(c, x, y, 0.45, text, fill, { weight: 600, spacing: "0.04em" });

const etr300Paint = (cab) => (c, g) => bands(g.L, [[0, 20, EV.white], [11.1, 3, EV.roof], [0, 3.3, EV.skirt], [3.3, 0.45, EV.red], [5.15, 1.0, EV.gray]]) +
  (cab ? path("M-1 3.3L-1 6.6Q2.0 6.6 3.2 5.6L5.0 3.3Z", EV.red) : "");
const metroPaint = (cab) => (c, g) => {
  let s = bands(g.L, [[0, 20, EV.white], [10.5, 3, EV.night], [0, 5.6, EV.night], [5.6, 0.2, EV.red]]);
  // Red swooshes curving up beside each door.
  for (const x of c.doorsAt || []) s += path(`M${x - 2.4} 5.8Q${x - 0.6} 6.4 ${x - 0.2} 9.4L${x - 0.75} 9.4Q${x - 1.2} 6.9 ${x - 2.4} 6.3Z`, EV.red);
  if (cab) s += rect(-1, 4.1, 5.4, 0.8, EV.red) + path("M-1 5.6L-1 10.6L6.2 10.6Q5.0 7.0 2.6 5.6Z", EV.night);
  return s;
};
const t21Paint = (cab) => (c, g) => bands(g.L, [[0, 20, EV.red], [10.5, 3, EV.roof], [0, 5.0, EV.night], [5.0, 0.2, EV.white], [9.95, 0.15, EV.white]]) +
  (cab ? path("M-1 5.0L-1 10.4L2.8 10.4L4.6 5.0Z", EV.night) : "");
const et400Paint = (c, g) => bands(g.L, [[0, 20, EV.blue], [12.1, 3, EV.roof], [0, 4.0, EV.skirt], [4.0, 1.3, EV.silver], [5.3, 0.15, EV.white]]) +
  path("M-1 4.0L-1 8.6L3.6 8.6L3.6 4.0Z", EV.silver);
const et500Paint = (c, g) => bands(g.L, [[0, 20, EV.royal], [12.1, 3, EV.roof], [0, 4.0, EV.skirt]]) +
  path(`M10 4.3L${g.L - 2} 4.3L${g.L - 2} 5.2L28 6.6Z`, EV.silver) + path("M-1 4.0L-1 7.6L3.2 7.6L4.6 4.0Z", EV.red) + path("M2.2 8.0Q3.4 10.8 4.2 12.9L5.0 12.9Q4.2 10.6 3.0 7.8Z", EV.silver);
const atrPaint = (cab) => (c, g) => bands(g.L, [[0, 20, EV.white], [12.8, 3, EV.roof], [0, 3.0, EV.skirt], [3.3, 2.3, EV.green]]) +
  (cab ? path("M-1 3.0L-1 7.8Q1.6 7.8 2.6 6.6Q3.8 5.6 6.6 5.6L6.6 3.0Z", EV.green) : "");

// ---------- Circumvesuviana: three articulated sections ----------
// About 40 m in three sections on four trucks, a motor truck under each
// cab and Jakobs trucks at the joints; 2.65 m wide, about 3.6 m tall.
// o: nose, rake, doors per section, paint, roof gear.
const CV = { roof: 11.8, sill: 3.3 };
function circum(c, o) {
  const L = c.L, cab = c.index === 0 || c.index === c.count - 1;
  const doors = cab ? o.cabDoors(L) : o.midDoors(L);
  const cc = { ...c, doorsAt: doors };
  return single(cc, { roof: o.roof ?? CV.roof, sill: o.sill ?? CV.sill, nose: cab ? o.nose : null, rake: o.rake, depth: o.depth ?? 2.4, cabLen: o.cabLen ?? 6, lampY: o.lampY,
    doors, doorW: o.doorW ?? 3.8, doorY: o.doorY ?? 2.4, win: o.win, trucks: cab ? [7.2, "end"] : ["start", "end"], wheel: 30, paint: o.paint(cab), doorFill: o.doorFill,
    surround: EV.ink, coupler: o.coupler, pan: !cab && o.pan ? L / 2 - 5 : null,
    extra: (k, g) => (cab ? hvac((o.cabLen ?? 6) + 4, o.roof ?? CV.roof, 9, 0.6) : (o.pan ? "" : hvac(4, o.roof ?? CV.roof, 9, 0.6))) +
      (o.pan && !cab ? cover(g.L / 2 + 4, o.roof ?? CV.roof, 8, 0.55) : cover(g.L - 13, o.roof ?? CV.roof, 9, 0.55)) + boxes(9, g.L - 6, o.sill ?? CV.sill, 2, 0.8) + o.over(k, g, cab) });
}
// Stadler ETR 300 (2024-): a flat front under a big windshield, a separate
// cab side window; five wide double doors a side (two in each end section,
// one in the middle); big square windows.
const NOSE_300 = [[1.1, 3.3], [1.0, 6.0], ["q", 1.0, 7.0, 1.6, 7.6], [2.6, 11.0], ["q", 2.9, 11.8, 4.2, 11.8]];
const etr300 = (c) => circum(c, { nose: NOSE_300, rake: [[1.6, 7.6], [2.6, 11.0]], lampY: 4.6, paint: etr300Paint, doorFill: () => EV.red, doorW: 4.6,
  cabDoors: (L) => [12.6, L - 9.0], midDoors: (L) => [L / 2 - 2.3], win: { y: 6.4, w: 4.4, h: 3.6, pitch: 5.2 }, pan: true,
  over: (k, g, cab) => (cab ? eavName(k, 24.0, 5.65, 0.7) + plate(k, 8.4, 4.2, "ETR 300") : "") });
// Metrostar (ETR 200, 2005-2010): a rounded, slightly raked nose; six
// doors a side, two in each section.
const NOSE_200 = [[1.2, 3.3], [0.9, 5.4], ["q", 0.9, 7.0, 2.0, 8.0], [3.8, 11.0], ["q", 4.4, 11.8, 5.8, 11.8]];
const metrostar = (c) => circum(c, { nose: NOSE_200, rake: [[2.0, 8.0], [3.8, 11.0]], depth: 2.6, cabLen: 7, lampY: 4.4, paint: metroPaint, doorFill: () => EV.white, doorW: 3.6,
  cabDoors: (L) => [12.4, L - 11.0], midDoors: (L) => [6.0, L - 9.6], win: { y: 6.6, w: 3.9, h: 3.2, pitch: 4.6 }, pan: true,
  over: (k, g, cab) => (cab ? letters(k, 28, 4.6, 0.7, "Metrostar", EV.white, { weight: 600, style: "italic" }) + plate(k, g.L - 6, 4.6, "ETR 200", EV.white) : eavName(k, g.L / 2 - 1.2, 4.55, 0.8, EV.white)) });
// FE 220 (1971-79) and T 21 (1989-93): aluminium bodies, a sloped front on
// the FE 220, upright on the T 21; two doors a side in each section. The
// rebuilt T 21s' red and night blue.
const NOSE_T21 = [[1.0, 3.4], [0.9, 7.2], ["q", 0.95, 8.0, 1.4, 8.4], [1.8, 10.9], ["q", 2.0, 11.6, 3.2, 11.6]];
const t21 = (c) => circum(c, { roof: 11.6, sill: 3.4, nose: NOSE_T21, rake: [[1.4, 8.4], [1.8, 10.9]], depth: 2.2, cabLen: 5, lampY: 4.6, paint: t21Paint,
  doorFill: () => EV.night, doorW: 3.4, doorY: 2.6, cabDoors: (L) => [10.0, L - 9.0], midDoors: (L) => [5.6, L - 9.0], win: { y: 6.5, w: 3.6, h: 3.0, pitch: 4.4, r: 0.3 },
  pan: true, over: (k, g, cab) => (cab ? eavName(k, 24, 4.25, 0.6, EV.white) + plate(k, g.L - 6, 4.2, "T 21", EV.white) : "") });

// ---------- Cumana and Circumflegrea: two-car units ----------
// ET 400 (Firema, 1991-98): two cars, 50.66 m, a boxy cab with a flat
// two-pane windshield; three single sliding doors a side in each car.
const NOSE_400 = [[1.1, 3.9], [1.0, 8.0], ["q", 1.05, 8.6, 1.4, 9.0], [1.9, 12.4], ["q", 2.1, 13.2, 3.4, 13.2]];
const et400 = (c) => single(c, { roof: 13.2, sill: 3.9, nose: NOSE_400, rake: [[1.4, 9.0], [1.9, 12.4]], depth: 2.2, cabLen: 6, lampY: 5.4,
  doors: [11.0, c.L / 2 - 1.6, c.L - 9.4], doorW: 3.2, doorY: 3.0, win: { y: 7.0, w: 4.0, h: 3.3, pitch: 5.0, r: 0.3 }, trucks: [8.6, c.L - 8.6], wheel: 36,
  paint: et400Paint, doorFill: () => EV.silver, surround: EV.ink, pan: c.index === 0 ? c.L / 2 + 5 : null,
  extra: (k, g) => hvac(12, 13.2, 10) + (k.index === 0 ? "" : hvac(g.L - 30, 13.2, 10)) + boxes(16, g.L - 15, 3.9, 3, 1.3) + eavName(k, 22, 4.65, 0.75, EV.blue) + plate(k, g.L - 5, 9.4, "ET 400", "#ffffff") });
// ET 500 "Alfa 3" (Titagarh Firema, 2021-25): two cars, 50.89 m, a raked
// windshield in a silver frame; three double doors a side in each car.
const NOSE_500 = [[1.2, 3.9], [1.0, 6.6], ["q", 1.1, 8.0, 2.2, 9.0], [4.0, 12.4], ["q", 4.6, 13.2, 6.2, 13.2]];
const et500 = (c) => single(c, { roof: 13.2, sill: 3.9, nose: NOSE_500, rake: [[2.2, 9.0], [4.0, 12.4]], depth: 2.6, cabLen: 7, lampY: 5.4,
  doors: [11.8, c.L / 2 - 1.4, c.L - 10.0], doorW: 4.0, doorY: 3.0, win: { y: 7.0, w: 4.4, h: 3.5, pitch: 5.2 }, trucks: [9.0, c.L - 8.6], wheel: 36,
  paint: et500Paint, doorFill: () => "#4a4f57", surround: EV.ink, pan: c.index === 0 ? c.L / 2 + 6 : null,
  extra: (k, g) => hvac(16, 13.2, 10) + cover(g.L - 22, 13.2, 12) + boxes(17, g.L - 15, 3.9, 3, 1.3) + eavName(k, 30, 11.4, 0.7, "#ffffff") + plate(k, g.L - 5, 4.6, k.alfa2 ? "ETR 243" : "ET 500", "#ffffff") });

// ---------- ATR 803 (Stadler FLIRT, diesel) ----------
// Three passenger cars and a power module, 66.8 m, on Jakobs trucks; one
// double door a side in each car; a FLIRT nose.
const NOSE_FLIRT = [[1.0, 3.0], [1.0, 5.8], ["q", 1.1, 7.0, 2.0, 8.0], [5.4, 12.7], ["q", 6.2, 13.7, 8.0, 13.7]];
const flWin = { y: 6.4, w: 4.6, h: 3.7, pitch: 5.3 };
const atrCab = (c) => single(c, { roof: 13.7, sill: 3.0, nose: NOSE_FLIRT, rake: [[2.0, 8.0], [5.4, 12.7]], depth: 3.0, cabLen: 9, lampY: 4.9, doors: [c.L - 26.0],
  doorY: 2.9, win: flWin, trucks: [8.6, "end"], wheel: 30, paint: atrPaint(true), doorFill: () => EV.green, surround: EV.ink,
  extra: (k, g) => hvac(16, 13.7, 10) + hvac(g.L - 18, 13.7, 9) + boxes(20, g.L - 28, 3.0, 2, 1.0) + eavName(k, 30, 11.4, 0.75) + plate(k, g.L - 6, 4.4, "ATR 803", "#ffffff") });
const atrMid = (c) => single(c, { roof: 13.7, sill: 3.0, doors: [c.L / 2 - 2.15], doorY: 2.9, win: flWin, trucks: ["start", "end"], wheel: 30, paint: atrPaint(false),
  doorFill: () => EV.green, extra: (k, g) => hvac(6, 13.7, 9) + hvac(g.L - 15, 13.7, 9) + boxes(8, g.L / 2 - 5, 3.0, 1, 0.9) + boxes(g.L / 2 + 5, g.L - 8, 3.0, 1, 0.9) });
const atrPack = (c) => powerModule(c, { roof: 14.0, sill: 3.0, d: 30, paint: (L) => bands(L, [[0, 20, EV.white], [12.8, 3, EV.roof], [0, 3.0, EV.skirt], [3.3, 2.3, EV.green]]) });

// ---------- Tables ----------

export const TYPES = {
  eavEtr300: { name: "Stadler ETR 300 section", kind: "emu", pan: true },
  eavMetrostar: { name: "Metrostar (ETR 200) section", kind: "emu", pan: true },
  eavT21: { name: "T 21 section", kind: "emu", pan: true },
  eavEt400: { name: "ET 400 car", kind: "emu" },
  eavEt500: { name: "ET 500 (Alfa 3) car", kind: "emu" },
  eavEtr243: { name: "ETR 243 (Alfa 2) car", kind: "emu" },
  eavAtrCab: { name: "ATR 803 end car", kind: "emu" },
  eavAtrMid: { name: "ATR 803 middle car", kind: "emu" },
  eavAtrPack: { name: "ATR 803 power module", kind: "module" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
// A three-section unit's sections differ by place (cab or not).
const place = (ctx) => (ctx.index === 0 || ctx.index === ctx.count - 1 ? "cab" : "mid");
export const MODELS = {
  eavEtr300: M(etr300, 44.7, true, place),
  eavMetrostar: M(metrostar, 43.7, true, place),
  eavT21: M(t21, 43.3, true, place),
  eavEt400: M(et400, 83.1, true, (ctx) => ctx.index),
  eavEt500: M(et500, 83.5, true, (ctx) => ctx.index),
  eavEtr243: M((c) => et500({ ...c, alfa2: true }), 83.5, true, (ctx) => ctx.index),
  eavAtrCab: M(atrCab, 70.2, true),
  eavAtrMid: M(atrMid, 57.1),
  eavAtrPack: M(atrPack, 21.7),
};

// Units by number: Metrostars ETR 201-226; FE 220s ETR 001-085 and T 21s
// 086-118 (the same numbering, run together); ET 401-414; ET 501-518.
export const FLEETS = {
  eav: [[201, 226, "eavMetrostar"], [1, 118, "eavT21"], [401, 414, "eavEt400"], [501, 518, "eavEt500"]],
};

const set = (label, ...units) => ({ label, units });
const ETR300 = set("Stadler ETR 300: a three-section electric unit", ["eavEtr300", 3]);
const METRO = set("Metrostar (ETR 200): a three-section electric unit", ["eavMetrostar", 3]);
const T21 = set("FE 220 / T 21: a three-section electric unit", ["eavT21", 3]);
const ET400 = set("ET 400: a two-car electric unit", ["eavEt400", 2]);
const ET500 = set("ET 500 (Alfa 3): a two-car electric unit", ["eavEt500", 2]);
const ALFA2 = set("ETR 243 (Alfa 2): a two-car electric unit", ["eavEtr243", 2]);
const ATR = set("ATR 803: a three-car diesel unit", ["eavAtrCab", 1], ["eavAtrPack", 1], ["eavAtrMid", 1], ["eavAtrCab", 1]);
const BY_MODEL = { eavMetrostar: METRO, eavT21: T21, eavEt400: ET400, eavEt500: ET500, eavEtr243: ALFA2 };

// By line, as EAV's GTFS names them (a number, "1" to "9", with dots for
// short workings, or the line's name). The Sorrento line runs mostly
// Metrostars; Baiano got the first ETR 300s in 2026; the other
// Circumvesuviana branches FE 220s and T 21s; the Cumana (9) the new ET
// 500s, the Circumflegrea (5) ET 400s (both types run on both); Napoli-
// Piedimonte Matese (7) the ATR 803s; Napoli-Benevento (3) the Alfa 2s.
// Line 2 (Piscinola-Aversa) is a metro, not drawn.
const LINE = [
  [/Sorrento|^1\.*$|Torre Annunziata|Torre del Greco/i, METRO], [/Baiano|^8$/i, ETR300], [/Cumana|Bagnoli|Gerolomini|^9\.*$/i, ET500],
  [/Circumflegrea|Quarto|Monte Sant|^5\.*$/i, ET400], [/Piedimonte|Alifana|^7$/i, ATR], [/Benevento|Cancello|^3$/i, ALFA2],
  [/Aversa|Giugliano|^2$/i, null],
];
export const TYPICAL = {
  eav: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    const r = String(t.route || "").trim();
    for (const [re, s] of LINE) if (re.test(r)) return s;
    return r ? T21 : null;
  },
};

const IT = "https://it.wikipedia.org/wiki/";
export const FACTS = {
  eavEtr300: { model: "Stadler ETR 300", type: "Electric multiple unit (950 mm gauge)", builder: "Stadler Rail", built: "Since 2024", fleet: "56 ordered, 12 built by 2026",
    powerHp: 1448, seats: 90, lengthFt: 134.1, source: `${IT}Elettrotreno_EAV_ETR_300`,
    about: "The Circumvesuviana's new trains, three articulated sections with five wide doors a side; approved in July 2026, they began service on the Napoli–Baiano line. 66 fixed and 24 folding seats, room for 377." },
  eavMetrostar: { model: "Metrostar (ETR 200)", type: "Electric multiple unit (950 mm gauge)", builder: "AnsaldoBreda and Firema", built: "2005–2010", fleet: "26, ETR 201–226",
    topSpeedMph: 49.7, powerHp: 1368, lengthFt: 131.2, source: `${IT}Elettrotreno_ETR_200_(Metrostar)`,
    about: "Three articulated sections, six doors a side; approved for 120 km/h but held to 80 by the line's signalling. Mostly on Naples–Sorrento. A white and red repaint was shown in August 2026; drawn here in the original blue and white." },
  eavT21: { model: "SFSM FE 220 and T 21 (ETR 001–118)", type: "Electric multiple unit (950 mm gauge)", builder: "Sofer, Asgen, Meccanica Romana, Lamborghini",
    built: "1971–1993", fleet: "118 built (FE 220 001–085, T 21 086–118)", topSpeedMph: 56, powerHp: 912, seats: 124, lengthFt: 129.8, source: `${IT}Elettrotreni_SFSM_ETR_001-118`,
    about: "The Circumvesuviana's classic trains: three aluminium sections on four trucks, the FE 220 with a sloped front, the T 21 an upright one. Drawn as a rebuilt T 21 in red and night blue." },
  eavEt400: { model: "SEPSA ET 400", type: "Electric multiple unit", builder: "Firema and Ansaldo Trasporti", built: "1991–1998", fleet: "14, ET 401–414",
    topSpeedMph: 62, powerHp: 1475, seats: 72, lengthFt: 166.2, source: `${IT}Elettrotreno_SEPSA_ET.400`,
    about: "Two-car units for the standard-gauge Cumana and Circumflegrea, rebuilt in electric blue with a silver band." },
  eavEt500: { model: "Titagarh Firema Alfa 3 (ET 500)", type: "Electric multiple unit", builder: "Titagarh Firema", built: "Since 2021", fleet: "18, ET 501–518",
    topSpeedMph: 62, powerHp: 1985, seats: 72, lengthFt: 167, source: `${IT}Elettrotreno_TFA_Alfa`,
    about: "The Cumana and Circumflegrea's newest trains, two cars with six doors a side; the second series arrived in 2025." },
  eavEtr243: { model: "Titagarh Firema Alfa 2 (ETR 243)", type: "Electric multiple unit", builder: "Titagarh Firema", fleet: "9", topSpeedMph: 99.4, powerHp: 2146, seats: 140,
    lengthFt: 167, source: `${IT}Elettrotreno_TFA_Alfa`,
    about: "The Alfa's 160 km/h version for the Benevento line, drawn here on the ET 500's body and paint; its own livery wasn't checked." },
  eavAtrCab: { model: "Stadler ATR 803 (FLIRT)", type: "Diesel multiple unit", builder: "Stadler Rail", built: "2022", fleet: "5",
    topSpeedMph: 87, seats: 151, lengthFt: 219.2, source: `${IT}Autotreno_ATR_803`,
    about: "EAV's diesel FLIRTs, in service since November 2022 between Napoli Centrale and Piedimonte Matese on the former Alifana line." },
  eavAtrMid: { model: "Stadler ATR 803 (FLIRT)", type: "Diesel multiple unit", builder: "Stadler Rail", built: "2022", topSpeedMph: 87, source: `${IT}Autotreno_ATR_803`,
    about: "The third car of an ATR 803, sharing Jakobs trucks with its neighbours." },
  eavAtrPack: { model: "ATR 803 power module", type: "Power module", builder: "Stadler Rail", source: `${IT}Autotreno_ATR_803`,
    about: "The diesel engine and generator ride in this short module, with an aisle through it." },
};
