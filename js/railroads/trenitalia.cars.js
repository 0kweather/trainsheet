// Trenitalia's cars (scripts/railroads/trenitalia.py): the Frecce, InterCity,
// the Regionale trains and Trenitalia Tper in Emilia-Romagna. The timetable
// names no unit, so every train is drawn as what usually runs in its
// category (t.route: "Frecciarossa", "Intercity", "Regionale"...) and number
// range, labeled as typical. The drawings are Trainsheet's own side views
// from published dimensions and descriptions of each model, at the shared
// scale (js/carart.js), in Trenitalia's current paint: the Frecce's silver
// with the black window band and red below, InterCity's 2024 white and
// light blue (the night trains' blue), the regional trains' grey "DPR"
// scheme and the green-and-yellow Regionale scheme of 2024. Names are
// lettered here (no logo files). Detail helpers come from Finland's file
// (digitraffic.cars.js), as the Baltic and Norwegian files take them.

import { newId, bilevel, cabUnit } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, poly, truck, pantograph, slats, win } from "../carart.js?v=dev";
import { letters, hvac, roofCover, panGear, horns, lamp, RED_LAMP, wiper, emuFront, buffers, boxes, frames, strokes, bothEnds, flirt } from "./digitraffic.cars.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
const r2 = (v) => Math.round(v * 100) / 100;

// ---------- Paint ----------
// Frecciarossa (2022 scheme, on the ETR 400, ETR 500, ETR 600 and ETR 700):
// a silver body, a black band through the windows forward to the cab doors,
// red along the lower body carrying the name, a silver strip under it, a red
// arrow up the nose. Frecciargento/Frecciabianca (ETR 485): grey-silver,
// thin red bands top and bottom. InterCity (2024): white and light blue by
// day, blue and light blue at night. Regionale: the grey DPR scheme (light
// grey over dark grey, a black window band, blue and yellow lines low,
// lime doors) and the 2024 one (two greens, yellow touches, green doors in
// a wide black border). Tper: white, a dark window band, red doors and cab.
const FR = { silver: "#cdd2d7", light: "#e3e6e9", red: "#c8102e", deep: "#93101f", band: "#17191c", roof: "#9aa1a9", dark: "#2b2f34", strip: "#b5bbc2" };
const FA = { silver: "#c6cbd0", red: "#c8102e", band: "#24282d", roof: "#a3aab2" };
const IC = { white: "#f2f4f6", sky: "#3aa6dd", blue: "#173f8a", navy: "#10295c", roof: "#a3aab2", skirt: "#3a3f45" };
const DPR = { light: "#dadde0", grey: "#767c83", band: "#1b1d20", blue: "#1f4fa0", yellow: "#f2c200", lime: "#9cc93a", orange: "#ee7d1c", roof: "#a3aab2" };
const RG = { white: "#eef0ee", green: "#00813d", leaf: "#6cb33f", yellow: "#ffd100", black: "#17191b", roof: "#a3aab2" };
const TP = { white: "#f1f2f3", red: "#d2232a", band: "#22262b", grey: "#8d949c", roof: "#a3aab2" };
const LX = { white: "#f2f3f4", red: "#ce2b37", green: "#009246" };

// ---------- Lettering ----------
const SERIF = "Georgia, Times New Roman, serif";
// The Frecce's names: the category in an italic sans, white or colored.
const freccia = (c, x, y, h, name, fill = "#ffffff") => letters(c, x, y, h, name, fill, { weight: 700, italic: true, spacing: -0.01 * h });
// The red arrow of the Frecce: a long point, lettered in shape only.
// It points forward (left, toward the cab), its tail cut in a notch.
const arrow = (x, y, w, h, fill) => path(poly([[x + w, y], [x + w * 0.18, y], [x, y + h / 2], [x + w * 0.18, y + h], [x + w, y + h], [x + w * 0.84, y + h / 2]]), fill);
const trenitalia = (c, x, y, h, fill) => letters(c, x, y, h, "TRENITALIA", fill, { weight: 700, spacing: 0.06 * h });
const fsMark = (c, x, y, h, fill) => letters(c, x, y, h, "FS", fill, { weight: 800, italic: true, family: SERIF });
const ic = (c, x, y, h, fill) => letters(c, x, y, h, "InterCity", fill, { weight: 700, italic: true });
// Regionale's mark: a rounded square with the R, and the name beside it.
const rMark = (c, x, y, h, bg, fg) => rect(x - h / 2, y - h / 2, h, h, bg, 0, `rx="${r2(h * 0.28)}"`) + letters(c, x, y - 0.03 * h, h * 0.78, "R", fg, { weight: 800 });
const regionale = (c, x, y, h, fill) => letters(c, x, y, h, "Regionale", fill, { weight: 600, anchor: "start" });
const classNo = (c, x, y, cls, fill = "#ffffff") => letters(c, x, y, 1.1, String(cls), fill, { weight: 700 });
// ---------- Classes ----------
// A car's class, as on the real cars and made legible at the strip's
// scale: the class numeral by each door, big ("1" about 2.2 ft tall; a
// smaller "2"), and the class or service level's name lettered beside it
// (cap height about 1.2 ft). Executive and Business are first class,
// Premium and Standard second. c.lv names the car's level.
// Trainsheet's own convention on top (as Amtrak's business-class band,
// carmodels.js AMFLEET_CLASS, for every railroad): a solid gold band, 0.9
// ft, the length of a first-class or Business car just above its window
// band, or over only the first-class part of a car that is partly first.
export const GOLD = "#c9a227";
const NAMES = { executive: "EXECUTIVE", business: "BUSINESS", bistro: "BUSINESS · BISTRÒ", premium: "PREMIUM", standard: "STANDARD",
  first: "1ª CLASSE", bar: "BAR", second: null };
const isFirst = (lv) => lv === "executive" || lv === "business" || lv === "bistro" || lv === "first";
export const goldBand = (y, x0 = -1, x1 = 1000) => rect(x0, y, x1 - x0, 0.9, GOLD);
// The numerals at xs (centered, at height y), the name at each [x, anchor]
// of names (at height ny): "start" runs it toward the car's middle from a
// door at its left, "end" from a door at its right (kept so on a car drawn
// mirrored).
function classSigns(c, lv, xs, y, names = [], ny = y, { fill = "#ffffff", ink = fill } = {}) {
  const first = isFirst(lv), name = NAMES[lv];
  const flip = (a) => (c.mirrored ? (a === "start" ? "end" : "start") : a);
  return xs.map((x) => letters(c, x, y, first ? 3.05 : 2.2, first ? "1" : "2", fill, { weight: 700 })).join("") +
    (name ? names.map(([x, a]) => letters(c, x, ny, first ? 1.67 : 1.3, name, ink, { weight: 700, spacing: 0.03, anchor: flip(a) })).join("") : "");
}

// ---------- Parts ----------
// A section of a train on its own trucks (or shared ones), drawn by
// carmodels' bilevel(); o: roof, sill, nose, cabLen, rows, doors, drop,
// paint(c, g), cab(c, g), extra(c, g), trucks [x | [x, d, wb]], jakobs
// ["start", "end"], wheel.
function sec(c, o) {
  const cab = !!o.nose;
  return bilevel(cab ? { ...c, cabL: true, cabR: false } : { ...c, cabL: false, cabR: false }, {
    roof: o.roof, sill: o.sill, cornerR: o.cornerR ?? 1.0, end: 0.6, noTrucks: true, badge: false, base: o.base,
    nose: o.nose || null, cabLen: cab ? o.cabLen ?? 8 : 0, drop: o.drop || null, ends: o.ends,
    diaphragm: o.diaphragm ?? [o.sill + 0.3, o.roof - 1.5], rows: o.rows, doors: o.doors,
    paint: o.paint, cab: cab ? o.cab : null,
    extra: (cc, g) => {
      let s = "";
      for (const t of o.trucks || []) {
        const [x, d = o.wheel ?? 33, wb = o.wb ?? 8.5] = Array.isArray(t) ? t : [t];
        s += truck(x, { wb, d, top: o.drop && x > o.drop.a && x < o.drop.b ? o.drop.y : o.sill });
      }
      for (const j of o.jakobs || []) s += truck(j === "end" ? g.L : 0, { wb: 8.2, d: 30, top: o.sill });
      return s + (o.extra ? o.extra(cc, g) : "");
    },
  });
}
// Door spec helpers: a double plug door, a single one.
const dbl = (x, y0, y1, w = 4.3, fill) => ({ x, w, y0, y1, leaves: 2, glassY: 0.4, glassH: 0.45, grabs: false, ...(fill ? { fill } : {}) });
const sgl = (x, y0, y1, w = 2.8, fill) => ({ x, w, y0, y1, glassY: 0.55, glassH: 0.3, grabs: false, ...(fill ? { fill } : {}) });
// Skirt fairing over a high-speed train's truck: a panel with a cutout.
const fairing = (x, sill, w, fill) => path(`M${r2(x - w / 2)} ${r2(sill)}L${r2(x + w / 2)} ${r2(sill)}L${r2(x + w / 2)} ${r2(sill - 0.9)}Q${r2(x + w / 2 - 1.2)} ${r2(sill - 0.9)} ${r2(x + w / 2 - 1.6)} ${r2(sill - 0.3)}L${r2(x - w / 2 + 1.6)} ${r2(sill - 0.3)}Q${r2(x - w / 2 + 1.2)} ${r2(sill - 0.9)} ${r2(x - w / 2)} ${r2(sill - 0.9)}Z`, fill, 0.4);
// A high-speed roof: a long low fairing, its panel seams.
const roofFairing = (a, b, roof, h = 0.55, fill = "#b2b8bf") => roofCover(a, roof, b - a, h, fill, Math.max(2, Math.round((b - a) / 9)));
// A pantograph with its breaker and a low fairing around its base.
const panSet = (x, roof, dir = 1, up = true) => roofCover(x - 3.6, roof, 7.2, 0.35, "#9aa1a9", 1) + pantograph(x, roof + 0.3, { up, facing: -dir }) + panGear(x, roof + 0.3, dir);
// The window frames of a row, in a dark band (painted).
const framesOf = (rows, pad = 0.18, fill = "#111316") => rows.map((r) => frames(r.xs, r.y, r.w, r.h, pad, fill)).join("");
// A cab windshield polygon with its glare and wiper. pts: the glass.
const glass = (pts, glare, wipe) => path(poly(pts), C.glass) + path(poly(pts), "none", 0, `stroke="${C.gasket}" stroke-width="0.6" vector-effect="non-scaling-stroke"`) +
  (glare ? path(poly(glare), C.glassLight) : "") + (wipe ? wiper(...wipe) : "");
// Side buffers at both ends of a locomotive or coach (sill = top of the beam).
const ends2 = (L, y = 3.45) => buffers(0, -1, { y }) + buffers(L, 1, { y });
// A locomotive's side grille panel with louvers.
const grille = (x, y, w, h, gap = 0.32) => rect(x, y, w, h, "rgba(20,22,25,0.5)", 0.4, 'rx="0.1"') + slats(x, y, w, h, gap, "rgba(255,255,255,0.2)");
// The rear coupler and hoses of a locomotive's blind end are drawn by
// consist.js; a gangway door and its handrails at the blind end.
const blindEnd = (L, sill, roof) => rect(L - 1.1, sill + 0.4, 0.5, roof - sill - 2.0, "rgba(0,0,0,0.18)") + line(L - 1.3, sill + 1.0, L - 1.3, roof - 2.4, "currentColor", 0.6);

// ===================== Frecciarossa =====================

// Frecciarossa paint for a section: base silver; the black band from y0 to
// y1 (forward to x0 on a cab section); red under it to the strip; the
// strip; a grey roof band; on a cab, the red arrow up the nose.
function frPaint(c, g, { y0, y1, red0, x0 = 0, roofY, cab = null, name = null, nameAt = null, darkRoof = false }) {
  const L = g.L;
  let s = rect(0, 0, L, 20, FR.silver) + rect(0, roofY, L, 4, darkRoof ? FR.dark : FR.roof) + line(0, roofY, L, roofY, "rgba(0,0,0,0.18)", 0.5);
  if (darkRoof) s += rect(0, roofY - 0.28, L, 0.2, FR.red);
  s += rect(x0, y0, L - x0 + 1, y1 - y0, FR.band) + rect(-1, red0, L + 2, y0 - red0 - 0.25, FR.red) + rect(-1, red0 - 0.9, L + 2, 0.9, FR.strip) + rect(-1, 0, L + 2, red0 - 0.9, FR.dark);
  s += rect(-1, y0 - 0.25, L + 2, 0.25, FR.light);
  if (cab) s += cab;
  if (name) s += freccia(c, nameAt ?? L / 2, (red0 + y0 - 0.25) / 2, Math.min(1.35, (y0 - red0 - 0.25) * 0.72), name);
  return s;
}

// --- Frecciarossa 1000 (ETR 400): eight cars, 202 m; the end cars about
// 26.6 m with a long pointed nose (Bertone), the middle ones 24.9 m; one
// plug door a side per car near an end, more at the cab end; trucks with
// 920 mm wheels under skirt fairings. Four pantographs: two on the middle
// cars (AC), one toward each end (DC). The cab: a deep raked windshield
// set far back along the nose's top.
const FR4 = { roof: 13.35, sill: 3.55 };
const NOSE_400 = [[1.6, 3.55], [0.45, 4.35], ["q", 0.35, 5.5, 3.0, 6.5], [12.5, 10.3], ["q", 17.5, 12.6, 24.0, 13.35]];
const fr4Rows = (a, n) => [{ xs: seq(a, 6.35, n), y: 7.05, w: 4.7, h: 2.85, r: 0.4 }];
const fr4Cab = (c) => {
  const rows = fr4Rows(29.6, 8);
  return sec(c, { ...FR4, nose: NOSE_400, cabLen: 22, rows, doors: [sgl(24.6, 3.75, 10.9, 2.7), sgl(c.L - 5.6, 3.75, 10.9)], trucks: [[11.5, 36, 9.2], [c.L - 9.8, 36, 9.2]],
    paint: (cc, g) => frPaint(cc, g, { y0: 6.55, y1: 10.45, red0: 4.55, x0: 23.2, roofY: 12.45, name: "Frecciarossa", nameAt: 55,
      cab: rect(-1, 3.6, 24.4, 2.7, FR.silver) + path("M23.4 4.55L23.4 6.3L18.0 6.3L20.0 4.55Z", FR.silver) + arrow(1.4, 4.6, 19.0, 1.5, FR.red) +
        path("M8.6 8.6Q14.5 11.0 19.5 12.4L23.2 12.4L23.2 10.45L19.4 10.45Q14.4 9.6 9.6 8.2Z", FR.band) }) +
      framesOf(rows) + rect(rows[0].xs[0] - 0.4, 6.65, 0.1, 3.7, "rgba(255,255,255,0.08)") + (isFirst(cc.lv) ? goldBand(10.55, 23.2) : "") +
      classSigns(cc, cc.lv || "standard", [28.45, 80.2], 8.5, [[29.8, "start"], [78.4, "end"]], 5.35),
    cab: () => glass([[9.4, 8.95], [14.4, 10.8], ["q", 17.0, 11.85, 20.4, 12.35], [22.0, 12.45], [22.0, 10.9], [16.6, 10.1], [12.0, 8.95]], [[10.6, 9.15], [14.6, 10.6], [15.6, 10.6], [12.0, 9.15]], [11.6, 9.1, 15.0, 10.7]) +
      lamp(2.1, 5.1, 1.2, 0.36) + lamp(1.2, 4.55, 0.55, 0.28, RED_LAMP) + emuFront(1.4, 3.55, { coupler: 2.9 }) + horns(22.0, 13.3),
    extra: (cc, g) => fairing(11.5, 3.55, 13, FR.dark) + fairing(g.L - 9.8, 3.55, 13, FR.dark) + boxes(19, g.L - 18, 3.55, 4, 1.0, "#33373c") +
      roofFairing(26, g.L - 14, 13.35) + hvac(g.L - 13.5, 13.35, 9.0) + panSet(30.5, 13.9, 1, false) +
      fsMark(cc, g.L - 15, 11.55, 0.6, FR.band) + trenitalia(cc, g.L - 24, 11.6, 0.42, "#5b6168") });
};
const fr4Mid = (c) => {
  const rows = fr4Rows(4.4, 11);
  const pan = c.index === 3 || c.index === 4;
  return sec(c, { ...FR4, rows, doors: [sgl(c.L - 5.5, 3.75, 10.9)], trucks: [[9.5, 36, 9.2], [c.L - 9.5, 36, 9.2]],
    paint: (cc, g) => frPaint(cc, g, { y0: 6.55, y1: 10.45, red0: 4.55, roofY: 12.45, name: cc.index === 1 ? "Frecciarossa" : null, nameAt: 30 }) + framesOf(rows) +
      (isFirst(cc.lv) ? goldBand(10.55) : "") + classSigns(cc, cc.lv || "standard", [2.5, 74.4], 8.5, [[72.4, "end"]], 5.35),
    extra: (cc, g) => fairing(9.5, 3.55, 13, FR.dark) + fairing(g.L - 9.5, 3.55, 13, FR.dark) + boxes(17, g.L - 17, 3.55, 4, 1.0, "#33373c") +
      (pan ? roofFairing(4, 26, 13.35) + panSet(g.L / 2 + 6, 13.6, -1, cc.index === 4) + roofFairing(g.L - 22, g.L - 4, 13.35) : roofFairing(4, g.L - 18, 13.35) + hvac(g.L - 17, 13.35, 9.0)) });
};

// --- ETR 500 with E.404 power cars (TREVI, Pininfarina; 59 sets): a power
// car at each end, 20.57 m, Bo'Bo' on 1.1 m wheels, its nose shorter and
// blunter than the 1000's; eleven coaches of 26.1 m between. Two
// pantographs on each power car; the machine room behind long louvers.
const NOSE_404 = [[2.2, 4.0], [0.6, 4.9], ["q", 0.5, 6.2, 2.6, 7.3], [8.6, 10.9], ["q", 11.6, 13.1, 15.6, 13.1]];
const e404 = (c) => cabUnit(c, {
  roof: 13.1, sill: 4.0, rearR: 1.0, nose: NOSE_404, base: FR.silver, trucks: { centers: 36.1, wb: 9.8, d: 43 }, reservoir: [27, 37],
  paint: (cc, sp) => frPaint(cc, { L: sp.L }, { y0: 7.4, y1: 10.5, red0: 5.1, x0: 13.6, roofY: 12.3, name: "Frecciarossa", nameAt: 35,
    cab: rect(-1, 4.0, 15, 3.15, FR.silver) + arrow(1.6, 5.2, 12.4, 1.45, FR.red) + path("M7.4 9.3Q10.6 10.9 12.6 12.0L13.6 12.0L13.6 10.5Q10.6 9.6 8.2 8.6Z", FR.band) }),
  glass: [[[7.6, 9.25], [11.0, 11.3], [13.2, 11.6], [13.2, 10.0], [10.4, 9.6]]],
  sideWin: [[14.4, 8.2, 2.0, 1.9]],
  doors: [[17.4, 2.3, 4.5, 11.3]],
  grilles: [[21.4, 8.0, 17.0, 2.1], [40.2, 8.0, 17.0, 2.1], [58.4, 8.0, 5.6, 2.1]],
  panels: [[21.4, 5.3, 8.0, 2.2], [30.0, 5.3, 8.0, 2.2], [41.0, 5.3, 8.0, 2.2]],
  extra: (cc, sp) => roofFairing(15, sp.L - 2, 13.1, 0.4, "#a9afb6") + panSet(28.0, 13.5, 1, false) + panSet(sp.L - 12.0, 13.5, -1, true) +
    roofCover(37, 13.5, 12, 0.5, "#8d949c", 3) + lamp(2.2, 5.6, 1.0, 0.34) + lamp(1.1, 5.0, 0.5, 0.26, RED_LAMP) + wiper(8.4, 9.5, 10.6, 10.9) +
    fairing(sp.L / 2 - 18.05, 4.0, 14, FR.dark) + fairing(sp.L / 2 + 18.05, 4.0, 14, FR.dark) + buffers(sp.L, 1) +
    letters(cc, 50, 4.55, 0.5, "E.404", "#ffffff", { weight: 600 }) + fsMark(cc, 45, 11.45, 0.6, FR.band),
});
const etr500Coach = (c) => {
  const rows = [{ xs: seq(6.6, 6.05, 12), y: 7.25, w: 4.4, h: 2.65, r: 0.35 }];
  return sec(c, { roof: 13.1, sill: 3.9, rows, doors: [sgl(2.0, 4.1, 10.9), sgl(c.L - 4.9, 4.1, 10.9)], trucks: [[11.6, 36, 8.9], [c.L - 11.6, 36, 8.9]],
    paint: (cc, g) => frPaint(cc, g, { y0: 6.8, y1: 10.35, red0: 4.75, roofY: 11.75, darkRoof: true, name: cc.index === 2 ? "Frecciarossa" : null, nameAt: 42 }) + framesOf(rows) +
      (isFirst(cc.lv) ? goldBand(10.45) : "") + classSigns(cc, cc.lv || "standard", [5.65, 79.1], 8.55, [[6.8, "start"], [77.4, "end"]], 5.6),
    extra: (cc, g) => fairing(11.6, 3.9, 13, FR.dark) + fairing(g.L - 11.6, 3.9, 13, FR.dark) + boxes(19, g.L - 19, 3.9, 4, 1.05, "#33373c") +
      hvac(g.L / 2 - 7, 13.1, 14) + roofCover(8, 13.1, 12, 0.35, "#a9afb6", 2) + roofCover(g.L - 20, 13.1, 12, 0.35, "#a9afb6", 2) + trenitalia(cc, 20, 11.25, 0.42, "#e3e6e9") });
};

// --- ETR 700 (AnsaldoBreda V250, built for Fyra, 17 for Trenitalia, in
// Frecciarossa paint since 2022): eight cars, 200.9 m, driving cars 26.95
// m, middle cars 24.5 m; a rounded nose under a broad windshield; single
// plug doors near the car ends.
const NOSE_700 = [[1.4, 3.6], [0.6, 4.8], ["q", 0.6, 6.4, 2.8, 7.8], [8.6, 11.7], ["q", 10.8, 13.25, 14.6, 13.25]];
const etr700Cab = (c) => {
  const rows = [{ xs: seq(21.2, 6.0, 10), y: 7.1, w: 4.3, h: 2.8, r: 0.4 }];
  return sec(c, { roof: 13.25, sill: 3.6, nose: NOSE_700, cabLen: 14, rows, doors: [sgl(16.4, 3.8, 10.9, 2.7), sgl(c.L - 5.4, 3.8, 10.9)], trucks: [[10.6, 36, 9.0], [c.L - 10.0, 36, 9.0]],
    paint: (cc, g) => frPaint(cc, g, { y0: 6.6, y1: 10.45, red0: 4.6, x0: 15.2, roofY: 12.4, name: "Frecciarossa", nameAt: 50,
      cab: rect(-1, 3.6, 16.4, 2.75, FR.silver) + arrow(1.0, 4.65, 14.4, 1.45, FR.red) + path("M6.8 9.7Q10.6 11.4 12.6 12.1L15.2 12.1L15.2 10.45L12.2 10.45Q9.4 9.9 7.4 9.0Z", FR.band) }) + framesOf(rows) +
      (isFirst(cc.lv) ? goldBand(10.55, 15.2) : "") + classSigns(cc, cc.lv || "standard", [20.15, 81.25], 8.5, [[21.4, "start"], [79.4, "end"]], 5.4),
    cab: () => glass([[6.6, 9.4], [9.8, 11.6], [13.8, 12.1], [13.8, 10.4], [9.6, 9.85]], [[7.4, 9.75], [9.2, 10.9], [10.0, 10.9], [8.4, 9.75]], [7.6, 9.6, 9.6, 11.0]) +
      lamp(1.4, 5.5, 1.1, 0.4) + lamp(0.9, 4.85, 0.55, 0.28, RED_LAMP) + emuFront(1.2, 3.6, { coupler: 2.9 }) + horns(14.5, 13.2),
    extra: (cc, g) => fairing(10.6, 3.6, 12.5, FR.dark) + fairing(g.L - 10.0, 3.6, 12.5, FR.dark) + boxes(18, g.L - 17, 3.6, 4, 1.0, "#33373c") +
      roofFairing(16, g.L - 16, 13.25) + hvac(g.L - 15.5, 13.25, 9) + fsMark(cc, g.L - 12, 11.6, 0.6, FR.band) + letters(cc, 17.6, 3.95, 0.5, "ETR 700", "#ffffff", { weight: 600 }) +
      "" });
};
const etr700Mid = (c) => {
  const rows = [{ xs: seq(5.4, 6.0, 11), y: 7.1, w: 4.3, h: 2.8, r: 0.4 }];
  const pan = c.index === 2 || c.index === c.count - 3;
  return sec(c, { roof: 13.25, sill: 3.6, rows, doors: [sgl(c.L - 5.2, 3.8, 10.9)], trucks: [[9.2, 36, 9.0], [c.L - 9.2, 36, 9.0]],
    paint: (cc, g) => frPaint(cc, g, { y0: 6.6, y1: 10.45, red0: 4.6, roofY: 12.4 }) + framesOf(rows) + (isFirst(cc.lv) ? goldBand(10.55) : "") + classSigns(cc, cc.lv || "standard", [2.7, 72.5], 8.5, [[70.4, "end"]], 5.4),
    extra: (cc, g) => fairing(9.2, 3.6, 12.5, FR.dark) + fairing(g.L - 9.2, 3.6, 12.5, FR.dark) + boxes(16, g.L - 16, 3.6, 4, 1.0, "#33373c") +
      (pan ? roofFairing(3, 30, 13.25) + panSet(g.L - 24, 13.5, -1, cc.index === 2) + hvac(g.L - 15, 13.25, 9) : roofFairing(3, g.L - 16, 13.25) + hvac(g.L - 15.5, 13.25, 9)) });
};

// --- ETR 600 (Alstom New Pendolino, Giugiaro; 12): seven tilting cars,
// 187.4 m, the narrow body tapering in toward the roof; a long nose with a
// pronounced chin; small windows close together; single plug doors near
// the car ends. Frecciarossa paint since 2022 (it was a Frecciargento).
const NOSE_600 = [[2.6, 3.6], [0.7, 4.5], ["q", 0.25, 5.6, 1.8, 6.9], [9.6, 11.4], ["q", 12.2, 12.65, 15.8, 12.65]];
const etr600Cab = (c) => {
  const rows = [{ xs: seq(21.4, 4.3, 15), y: 6.95, w: 3.2, h: 2.75, r: 0.4 }];
  return sec(c, { roof: 12.65, sill: 3.6, nose: NOSE_600, cabLen: 16, rows, doors: [sgl(17.0, 3.8, 10.6, 2.6), sgl(c.L - 5.2, 3.8, 10.6)], trucks: [[12.6, 34, 8.9], [c.L - 9.8, 34, 8.9]],
    paint: (cc, g) => frPaint(cc, g, { y0: 6.5, y1: 10.15, red0: 4.6, x0: 16.0, roofY: 11.75, name: "Frecciarossa", nameAt: 52,
      cab: rect(-1, 3.6, 17.2, 2.65, FR.silver) + arrow(1.2, 4.65, 15.0, 1.4, FR.red) + path("M7.8 9.8Q11.6 11.4 13.6 11.75L16.0 11.75L16.0 10.15L13.0 10.15Q10.2 9.7 8.4 9.0Z", FR.band) }) + framesOf(rows) +
      (isFirst(cc.lv) ? goldBand(10.25, 16.0) : "") + classSigns(cc, cc.lv || "standard", [20.5, 86.05], 8.35, [[21.6, "start"], [84.6, "end"]], 5.35),
    cab: () => glass([[7.6, 9.5], [11.4, 11.35], [15.0, 11.7], [15.0, 10.1], [10.8, 9.8]], [[8.4, 9.75], [10.6, 10.8], [11.4, 10.8], [9.4, 9.75]], [8.6, 9.7, 10.8, 11.0]) +
      lamp(0.85, 5.1, 1.1, 0.36) + lamp(1.4, 4.55, 0.55, 0.26, RED_LAMP) + emuFront(1.4, 3.6, { coupler: 2.8 }) + horns(16.0, 12.6),
    extra: (cc, g) => fairing(12.6, 3.6, 12, FR.dark) + fairing(g.L - 9.8, 3.6, 12, FR.dark) + boxes(20, g.L - 17, 3.6, 4, 1.0, "#33373c") +
      roofFairing(17, g.L - 16, 12.65, 0.5) + hvac(g.L - 15, 12.65, 9) + fsMark(cc, g.L - 12, 11.0, 0.55, FR.band) });
};
const etr600Mid = (c) => {
  const rows = [{ xs: seq(5.0, 4.3, 17), y: 6.95, w: 3.2, h: 2.75, r: 0.4 }];
  const pan = c.index === 2 || c.index === 4;
  return sec(c, { roof: 12.65, sill: 3.6, rows, doors: [sgl(c.L - 5.2, 3.8, 10.6)], trucks: [[10.0, 34, 8.9], [c.L - 10.0, 34, 8.9]],
    paint: (cc, g) => frPaint(cc, g, { y0: 6.5, y1: 10.15, red0: 4.6, roofY: 11.75 }) + framesOf(rows) +
      (isFirst(cc.lv) ? goldBand(10.25) : "") + classSigns(cc, cc.lv || "standard", [2.6, 78.9], 8.35, [[76.8, "end"]], 5.35),
    extra: (cc, g) => fairing(10.0, 3.6, 12, FR.dark) + fairing(g.L - 10.0, 3.6, 12, FR.dark) + boxes(17, g.L - 17, 3.6, 4, 1.0, "#33373c") +
      (pan ? roofFairing(3, 28, 12.65, 0.5) + panSet(g.L - 26, 12.9, -1, cc.index === 2) + hvac(g.L - 15, 12.65, 9) : roofFairing(3, g.L - 16, 12.65, 0.5) + hvac(g.L - 15, 12.65, 9)) });
};

// ===================== Frecciargento and Frecciabianca =====================

// --- ETR 485 (Fiat Ferroviaria/Alstom, 15, nine tilting cars, the last
// Frecciargento and, since summer 2026, the Frecciabianca on Rome-Genoa):
// a pointed nose under a raked windshield, small windows in a dark band,
// one plug door a side near the end of each car. Grey-silver, thin red
// bands along the top and bottom, the name on the side.
const NOSE_485 = [[2.4, 3.5], [0.8, 4.5], ["q", 0.35, 5.8, 2.0, 7.0], [8.8, 11.2], ["q", 11.0, 12.4, 14.2, 12.4]];
const faName = (c) => (c.route === "Frecciabianca" ? "Frecciabianca" : "Frecciargento");
function faPaint(c, g, cab) {
  const L = g.L;
  let s = rect(0, 0, L, 20, FA.silver) + rect(0, 11.5, L, 3, FA.roof) + rect(0, 11.0, L, 0.32, FA.red) + rect(0, 4.35, L, 0.32, FA.red) + rect(0, 0, L, 3.95, "#4a5057") +
    rect(cab ? 14.6 : -1, 6.5, L + 1, 3.65, FA.band);
  if (cab) s += path("M6.4 9.6Q10.2 11.0 12.4 11.5L14.6 11.5L14.6 10.15L12.0 10.15Q9.6 9.6 7.4 8.8Z", FA.band) + path("M0 4.35L0 4.67Q8.0 4.9 14.6 6.5L14.6 6.18Q8.0 4.58 0 4.35Z", FA.red);
  return s;
}
const etr485Cab = (c) => {
  const rows = [{ xs: seq(20.2, 4.4, 14), y: 6.9, w: 3.1, h: 2.8, r: 0.35 }];
  return sec(c, { roof: 12.4, sill: 3.5, nose: NOSE_485, cabLen: 15, rows, doors: [sgl(15.6, 3.7, 10.4, 2.5, "#4a5057"), sgl(c.L - 5.0, 3.7, 10.4)], trucks: [[12.0, 35, 8.9], [c.L - 9.6, 35, 8.9]],
    paint: (cc, g) => faPaint(cc, g, true) + framesOf(rows) + freccia(cc, 50, 5.45, 0.95, faName(cc), FA.red) +
      (isFirst(cc.lv) ? goldBand(10.25, 14.6) : "") + classSigns(cc, cc.lv || "second", [19.15, 82.85], 8.3, [[20.2, "start"], [80.6, "end"]], 5.5, { ink: "#24282d" }),
    cab: () => glass([[7.0, 9.4], [10.4, 11.1], [13.6, 11.45], [13.6, 10.0], [10.0, 9.7]], [[7.8, 9.65], [9.6, 10.5], [10.3, 10.5], [8.6, 9.65]], [8.0, 9.6, 9.9, 10.8]) +
      lamp(0.9, 5.05, 1.0, 0.36) + lamp(1.4, 4.45, 0.5, 0.26, RED_LAMP) + emuFront(1.4, 3.5, { coupler: 2.8 }) + horns(14.6, 12.35),
    extra: (cc, g) => fairing(12.0, 3.5, 12, "#3a3f45") + fairing(g.L - 9.6, 3.5, 12, "#3a3f45") + boxes(19, g.L - 17, 3.5, 4, 1.0, "#33373c") +
      roofFairing(16, g.L - 15, 12.4, 0.45) + hvac(g.L - 14.5, 12.4, 8.5) + fsMark(cc, g.L - 11.5, 5.4, 0.6, FA.red) });
};
const etr485Mid = (c) => {
  const rows = [{ xs: seq(5.2, 4.4, 16), y: 6.9, w: 3.1, h: 2.8, r: 0.35 }];
  const pan = c.index === 2 || c.index === c.count - 3;
  return sec(c, { roof: 12.4, sill: 3.5, rows, doors: [sgl(c.L - 5.0, 3.7, 10.4)], trucks: [[9.8, 35, 8.9], [c.L - 9.8, 35, 8.9]],
    paint: (cc, g) => faPaint(cc, g, false) + framesOf(rows) + (cc.index === 1 ? freccia(cc, 36, 5.45, 0.9, faName(cc), FA.red) : "") +
      (isFirst(cc.lv) ? goldBand(10.25) : "") + classSigns(cc, cc.lv || "second", [2.6, 76.15], 8.3, [[74.2, "end"]], 5.5, { ink: "#24282d" }),
    extra: (cc, g) => fairing(9.8, 3.5, 12, "#3a3f45") + fairing(g.L - 9.8, 3.5, 12, "#3a3f45") + boxes(17, g.L - 17, 3.5, 4, 1.0, "#33373c") +
      (pan ? roofFairing(3, 28, 12.4, 0.45) + panSet(g.L - 25, 12.7, -1, cc.index === 2) + hvac(g.L - 14.5, 12.4, 8.5) : roofFairing(3, g.L - 15, 12.4, 0.45) + hvac(g.L - 14.5, 12.4, 8.5)) +
      "" });
};

// ===================== InterCity =====================

// InterCity's 2024 paint, by train: day trains white with light blue low
// and a blue line; the night trains (route "Intercity Notte") blue with the
// light blue low. Locomotives and coaches share it.
const night = (c) => /Notte/.test(c.route || "");
function icSide(c, L, { low, top, skirt }) {
  if (night(c)) return rect(-1, 0, L + 2, 20, IC.blue) + rect(-1, top, L + 2, 4, "#2b4f97") + rect(-1, skirt, L + 2, low - skirt, IC.sky) + rect(-1, low, L + 2, 0.18, "#ffffff") + rect(-1, 0, L + 2, skirt, IC.navy);
  return rect(-1, 0, L + 2, 20, IC.white) + rect(-1, top, L + 2, 4, IC.roof) + rect(-1, skirt, L + 2, low - skirt, IC.sky) + rect(-1, low, L + 2, 0.22, IC.blue) + rect(-1, 0, L + 2, skirt, IC.skirt);
}
const icInk = (c) => (night(c) ? "#ffffff" : IC.blue);

// --- UIC-Z1 coach (Casaralta and others since 1985, 990 built): 26.4 m,
// ten big windows (eleven in open saloons), a single plug door at each end,
// Fiat trucks 19 m apart; the air conditioning on the roof. Driving
// coaches (Z1a, converted since 2017) carry a sloped cab at one end.
const IC_ROWS = (L, cab) => [{ xs: seq(cab ? 15.4 : 8.0, 6.45, cab ? 10 : 11), y: 7.3, w: 4.7, h: 3.0, r: 0.45 }];
function z1(c, { cab = false, kind = "coach" } = {}) {
  const L = c.L, roof = 13.3, sill = 3.95;
  const rows = kind === "sleeper" ? [{ xs: seq(8.2, 6.9, 10), y: 7.6, w: 3.6, h: 2.7, r: 0.4 }] : kind === "couchette" ? [{ xs: seq(8.0, 6.45, 11), y: 7.4, w: 4.4, h: 2.8, r: 0.4 }]
    // First class: nine compartments' worth of wider-spaced windows.
    : c.lv === "first" ? [{ xs: seq(9.2, 7.6, 9), y: 7.3, w: 4.9, h: 3.0, r: 0.45 }] : IC_ROWS(L, cab);
  const doorFill = night(c) ? IC.navy : "#d6dade";
  return sec({ ...c, cabL: cab && c.cabL }, { roof, sill, rows, nose: cab && c.cabL ? [[1.2, sill], [0.9, 7.4], ["q", 1.0, 8.6, 2.3, 9.8], [4.2, 12.3], ["q", 4.8, roof, 6.4, roof]] : null, cabLen: 11,
    doors: [sgl(cab && c.cabL ? 9.4 : 2.0, 4.15, 11.0, 2.6, doorFill), sgl(L - 4.6, 4.15, 11.0, 2.6, doorFill)], trucks: [[L / 2 - 31.15, 36, 8.2], [L / 2 + 31.15, 36, 8.2]],
    paint: (cc, g) => {
      let s = icSide(cc, L, { low: 6.75, top: 12.3, skirt: 4.4 }) + framesOf(rows, 0.15, "#2a2e33");
      if (cab && cc.cabL) s += path("M0 4.4L4.0 4.4Q2.6 7.0 2.4 9.6L0 9.6Z", IC.blue) + rect(0, 9.6, 8.6, 3.6, "#1d2024");
      s += ic(cc, L * (kind === "coach" ? 0.45 : 0.3), 5.6, 0.95, icInk(cc));
      if (kind === "sleeper") s += letters(cc, L * 0.62, 5.6, 0.7, "VAGONE LETTO", icInk(cc), { weight: 600, spacing: 0.12 });
      else if (kind === "couchette") s += letters(cc, L * 0.62, 5.6, 0.7, "CUCCETTE", icInk(cc), { weight: 600, spacing: 0.12 });
      else if (night(cc)) s += letters(cc, L * 0.62, 5.6, 0.8, "Notte", "#ffffff", { weight: 600, italic: true });
      if (kind !== "coach") return s;
      // By the doors: the class numeral between door and window, the class
      // lettered along the light blue band; the gold band over the windows.
      const lv = cc.lv === "first" ? "first" : "second", a = cab && cc.cabL ? 13.6 : 6.6, b = cc.lv === "first" ? 78.4 : 79.6;
      return s + (lv === "first" ? goldBand(10.55) : "") + classSigns(cc, lv, [a, b], 8.8, [[a + 2.6, "start"], [b - 1.9, "end"]], 5.55,
        { fill: night(cc) ? "#ffffff" : IC.blue, ink: night(cc) ? "#ffffff" : IC.navy });
    },
    cab: () => glass([[2.6, 9.95], [4.3, 12.0], [7.6, 12.0], [7.6, 9.95]], [[3.0, 10.2], [3.8, 11.2], [4.5, 11.2], [3.6, 10.2]], [3.2, 10.1, 4.0, 11.6]) +
      lamp(1.0, 5.6, 0.5, 0.5) + lamp(1.0, 4.85, 0.4, 0.32, RED_LAMP) + lamp(5.0, 12.95, 0.6, 0.25) + horns(7.0, roof),
    extra: (cc, g) => {
      let s = hvac(L / 2 - 7, roof, 14, 0.7) + [12, 24, L - 24, L - 12].map((x) => path(`M${x - 1.1} ${roof - 0.05}Q${x} ${roof + 0.7} ${x + 1.1} ${roof - 0.05}Z`, C.steelDark, 0.4)).join("");
      s += rect(L / 2 - 3.5, sill - 1.9, 7, 0.75, C.steelDark, 0.4, 'rx="0.37"') + boxes(L / 2 - 23, L / 2 - 5, sill, 2, 1.2) + boxes(L / 2 + 5, L / 2 + 23, sill, 2, 1.1);
      return s + buffers(0, -1, { y: 3.45 }) + buffers(L, 1, { y: 3.45 });
    },
  });
}
const icCoach = (c) => z1(c);
const icFirst = (c) => z1({ ...c, lv: "first" });
const icCab = (c) => z1(c, { cab: true });
const icCouchette = (c) => z1(c, { kind: "couchette" });
const icSleeper = (c) => z1(c, { kind: "sleeper" });

// --- E.414 (59, the ETR 500's first power cars rebuilt for 200 km/h,
// InterCity since 2020-22): 20.25 m, one cab under a Kevlar nose, a blind
// end toward the train; 4,400 kW. InterCity paint.
const e414 = (c) => cabUnit(c, {
  roof: 13.1, sill: 4.0, rearR: 1.0, nose: NOSE_404, base: IC.white, trucks: { centers: 36.1, wb: 9.8, d: 43 }, reservoir: [27, 37],
  paint: (cc, sp) => icSide(cc, sp.L, { low: 6.6, top: 12.3, skirt: 4.6 }) + path("M0 4.6L0 7.4Q4.0 7.5 8.4 9.6L13.6 12.3L13.6 6.6Z", night(cc) ? IC.navy : IC.blue) +
    path("M7.4 9.3Q10.6 10.9 12.6 12.0L13.6 12.0L13.6 10.5Q10.6 9.6 8.2 8.6Z", "#1d2024") + ic(cc, 40, 9.2, 1.5, icInk(cc)) + letters(cc, 50, 5.5, 0.55, "E.414", "#ffffff", { weight: 600 }),
  glass: [[[7.6, 9.25], [11.0, 11.3], [13.2, 11.6], [13.2, 10.0], [10.4, 9.6]]],
  sideWin: [[14.4, 8.2, 2.0, 1.9]],
  doors: [[17.4, 2.3, 4.5, 11.3]],
  grilles: [[21.4, 10.6, 17.0, 1.3], [40.2, 10.6, 17.0, 1.3], [58.4, 7.8, 5.0, 3.4]],
  panels: [[21.4, 5.3, 8.0, 4.6], [30.0, 5.3, 8.0, 4.6], [50.2, 5.3, 7.0, 4.6]],
  extra: (cc, sp) => roofFairing(15, sp.L - 2, 13.1, 0.4, "#a9afb6") + panSet(28.0, 13.5, 1, false) + panSet(sp.L - 12.0, 13.5, -1, true) +
    roofCover(37, 13.5, 12, 0.5, "#8d949c", 3) + lamp(2.2, 5.6, 1.0, 0.34) + lamp(1.1, 5.0, 0.5, 0.26, RED_LAMP) + wiper(8.4, 9.5, 10.6, 10.9) + buffers(sp.L, 1) +
    blindEnd(sp.L, 4.0, 13.1) + fsMark(cc, 44, 11.45, 0.6, icInk(cc)),
});

// --- E.401 (40, rebuilt 2015-19 from E.402A): 18.44 m, one cab with a
// wedge front, the other end blind; about 6,000 kW, 200 km/h; it pushes
// and pulls InterCity trains with a Z1a driving coach at the far end.
const NOSE_402 = [[1.5, 4.0], [1.0, 6.6], ["q", 1.0, 7.8, 1.9, 8.6], [4.0, 12.1], ["q", 4.5, 12.95, 5.8, 12.95]];
function e40x(c, { cls, twin }) {
  const draw = (h) => cabUnit(h, {
    roof: 12.95, sill: 4.0, rearR: 1.0, nose: NOSE_402, base: IC.white, trucks: { centers: 33.5, wb: 9.5, d: 49 }, tank: [h.L / 2 - 8, h.L / 2 + 8, 1.7],
    paint: (cc, sp) => icSide(cc, sp.L, { low: 6.8, top: 12.2, skirt: 4.6 }) + path("M0 4.6L0 8.4L2.0 8.4Q4.8 7.6 8.8 6.8L8.8 4.6Z", night(cc) ? IC.navy : IC.blue) +
      path(poly([[1.75, 8.55], [3.9, 11.9], [6.6, 11.9], [6.6, 8.55]]), "#1d2024") + (twin ? "" : ic(cc, sp.L / 2 + 2, 9.1, 1.45, icInk(cc))) +
      letters(cc, twin ? 16 : sp.L / 2 + 8, 5.55, 0.55, cls, "#ffffff", { weight: 600 }),
    glass: [[[1.95, 8.8], [3.95, 11.7], [6.3, 11.7], [6.3, 8.8]]],
    sideWin: [[7.0, 8.9, 1.6, 2.0]],
    doors: [[9.0, 2.2, 4.5, 11.3]],
    grilles: [[12.4, 10.5, 9.0, 1.2], [twin ? 22.4 : 22.6, 10.5, 9.0, 1.2]],
    panels: [[12.4, 5.4, 9.0, 4.6], [22.6, 5.4, 9.0, 4.6]],
    extra: (cc, sp) => (twin ? panSet(16.0, 12.95, 1, h.half === 1) : panSet(16.0, 12.95, 1, false) + panSet(sp.L - 14, 12.95, -1, true) + roofCover(22, 12.95, 10, 0.5, "#8d949c", 2) + blindEnd(sp.L, 4.0, 12.95) + buffers(sp.L, 1)) +
      horns(6.4, 12.9) + lamp(1.15, 6.0, 0.45, 0.5) + lamp(1.05, 5.2, 0.35, 0.3, RED_LAMP) + lamp(4.6, 12.45, 0.55, 0.25) + wiper(2.4, 8.9, 3.6, 11.0) + buffers(0, -1) +
      fsMark(cc, twin ? 28 : sp.L - 10, 11.4, 0.55, icInk(cc)),
  });
  // The name runs across the middle of a two-cab locomotive, over both halves.
  return twin ? bothEnds(c, draw) + ic(c, c.L / 2, 9.1, 1.45, icInk(c)) : draw({ ...c, half: 0 });
}
const e401 = (c) => e40x(c, { cls: "E.401" });
const e402b = (c) => e40x(c, { cls: "E.402B", twin: true });

// --- E.464 (Bombardier, 717 for Trenitalia): 15.75 m, one cab, the blind
// end a luggage space; 3,500 kW, 160 km/h; yellow display panels on the
// sides. It hauls Vivalto push-pull trains and many InterCitys: InterCity
// paint on InterCity, the regional grey (or the new green) otherwise.
const NOSE_464 = [[1.4, 4.0], [1.15, 7.2], ["q", 1.2, 8.3, 1.9, 9.0], [3.4, 12.1], ["q", 3.8, 12.95, 4.9, 12.95]];
const e464 = (c) => cabUnit(c, {
  roof: 12.95, sill: 4.0, rearR: 0.9, nose: NOSE_464, base: DPR.light, trucks: { centers: 25.4, wb: 8.5, d: 43 }, reservoir: [c.L / 2 - 4, c.L / 2 + 4],
  paint: (cc, sp) => {
    const L = sp.L;
    let s;
    if (cc.agency === "trenitaliaic") s = icSide(cc, L, { low: 6.8, top: 12.2, skirt: 4.6 }) + path("M0 4.6L0 8.6L2.0 8.6Q4.8 7.6 8.0 6.8L8.0 4.6Z", night(cc) ? IC.navy : IC.blue) + ic(cc, 30, 9.6, 1.25, icInk(cc));
    else if (cc.agency === "tper") s = rect(-1, 0, L + 2, 20, TP.white) + rect(-1, 12.2, L + 2, 3, TP.roof) + rect(-1, 0, L + 2, 6.0, TP.red) + rect(-1, 0, L + 2, 4.6, TP.band) + letters(cc, 30, 9.6, 1.3, "Tper", TP.red, { weight: 800 });
    else s = rect(-1, 0, L + 2, 20, DPR.light) + rect(-1, 12.2, L + 2, 3, DPR.roof) + rect(-1, 0, L + 2, 7.2, DPR.grey) + rect(-1, 5.2, L + 2, 0.35, DPR.blue) + rect(-1, 4.75, L + 2, 0.3, DPR.yellow) + rect(-1, 0, L + 2, 4.6, "#3a3f45") +
      regionale(cc, 21, 9.6, 1.0, "#4a5057");
    return s + path(poly([[1.65, 8.85], [3.4, 11.95], [5.9, 11.95], [5.9, 8.85]]), "#1d2024") + rect(17.6, 8.4, 7.2, 1.0, "#1b1d20", 0, 'rx="0.15"') + rect(17.8, 8.55, 6.8, 0.7, "#f2b705", 0, 'opacity="0.85"') +
      letters(cc, 42, 5.4, 0.5, "E.464", "#ffffff", { weight: 600 });
  },
  glass: [[[1.85, 9.1], [3.45, 11.75], [5.6, 11.75], [5.6, 9.1]]],
  sideWin: [[6.3, 9.1, 1.5, 2.0], [43.8, 8.6, 1.6, 2.0]],
  doors: [[8.0, 2.1, 4.5, 11.3], [c.L - 6.4, 2.1, 4.5, 11.3]],
  grilles: [[11.2, 10.2, 5.6, 1.4], [26.2, 10.2, 13.0, 1.4], [26.2, 5.3, 13.0, 4.4]],
  panels: [[11.2, 5.3, 5.6, 4.4], [17.6, 5.3, 7.2, 2.6]],
  extra: (cc, sp) => panSet(15.0, 12.95, 1, false) + panSet(sp.L - 15.5, 12.95, -1, true) + roofCover(20.0, 12.95, 10.0, 0.55, "#8d949c", 2) + horns(5.4, 12.9) +
    lamp(1.2, 6.2, 0.45, 0.5) + lamp(1.1, 5.4, 0.35, 0.3, RED_LAMP) + lamp(4.2, 12.45, 0.55, 0.25) + wiper(2.3, 9.2, 3.4, 11.2) + buffers(0, -1) + buffers(sp.L, 1) +
    blindEnd(sp.L, 4.0, 12.95) + fsMark(cc, sp.L - 9, 11.3, 0.5, cc.agency === "trenitaliaic" ? icInk(cc) : "#4a5057"),
});

// ===================== Hitachi Masaccio: Blues and the InterCity HTR 412 =====================

// Hitachi's tri-mode (3 kV, diesel and battery) units, 2022 on: the
// regional Blues (HTR 312, three cars, 66.88 m; HTR 412, four, 86.08 m),
// and InterCity's HTR 412s in day paint. Articulated: cars share Jakobs
// trucks; a rounded nose with a big windshield; two double doors a side on
// each car; a pantograph on one car, the diesel gensets and batteries
// under the floor. Blues: the regional grey (DPR), blue doors.
const NOSE_MAS = [[1.2, 3.4], [0.8, 5.6], ["q", 0.8, 7.3, 2.0, 8.6], [4.8, 12.3], ["q", 5.8, 13.4, 8.0, 13.4]];
function masPaint(c, g, cab) {
  const L = g.L;
  let s;
  if (c.agency === "trenitaliaic") s = icSide(c, L, { low: 6.0, top: 12.5, skirt: 3.9 }) + rect(cab ? 12 : -1, 6.6, L + 1, 3.7, "#1d2024");
  else s = rect(-1, 0, L + 2, 20, DPR.light) + rect(-1, 12.5, L + 2, 3, DPR.roof) + rect(-1, 0, L + 2, 6.1, DPR.grey) + rect(-1, 4.65, L + 2, 0.32, DPR.blue) + rect(-1, 4.2, L + 2, 0.28, DPR.yellow) +
    rect(-1, 0, L + 2, 3.9, "#33373c") + rect(cab ? 12 : -1, 6.6, L + 1, 3.7, "#1d2024");
  if (cab) s += path(poly([[1.6, 8.4], [4.8, 12.3], [12.2, 12.3], [12.2, 6.6], [8.0, 6.6]]), "#1d2024") + (c.agency === "trenitaliaic" ? path("M0 3.9L0 8.0Q2.4 6.6 6.6 6.0L6.6 3.9Z", IC.blue) : path("M0 3.9L0 8.0Q2.4 6.6 6.6 6.1L6.6 3.9Z", "#2b6db5"));
  return s;
}
const masDoor = (c) => (c.agency === "trenitaliaic" ? IC.sky : "#2b6db5");
const masCab = (c) => {
  const rows = [{ xs: [13.2], y: 6.8, w: 2.6, h: 3.3, r: 0.35 }, { xs: seq(22.0, 5.2, 3), y: 6.8, w: 4.4, h: 3.3, r: 0.35 }, { xs: [c.L - 13.6, c.L - 8.4], y: 6.8, w: 4.4, h: 3.3, r: 0.35 }];
  return sec(c, { roof: 13.4, sill: 3.4, nose: NOSE_MAS, cabLen: 10, rows, doors: [dbl(16.6, 3.4, 10.7, 4.3, masDoor(c)), dbl(c.L - 19.4, 3.4, 10.7, 4.3, masDoor(c))], trucks: [[10.0, 33, 8.5]], jakobs: ["end"],
    paint: (cc, g) => masPaint(cc, g, true) + (cc.agency === "trenitaliaic" ? ic(cc, 30, 5.0, 0.9, IC.blue) : letters(cc, 30, 5.3, 1.0, "Blues", "#ffffff", { weight: 700, italic: true })) +
      // InterCity's Plus (first class) seats: "1" and the level's name over the windows.
      (cc.lv === "first" ? goldBand(10.4, 12) + classSigns(cc, "first", [39.0, 54.4], 8.45, [[40.6, "start"]], 8.45) : ""),
    cab: () => glass([[2.3, 8.8], [5.0, 12.0], [9.4, 12.0], [9.4, 8.8]], [[2.8, 9.1], [4.0, 10.6], [4.8, 10.6], [3.6, 9.1]], [3.0, 9.0, 4.4, 11.2]) +
      lamp(1.0, 5.0, 0.9, 0.4) + lamp(0.9, 4.3, 0.5, 0.28, RED_LAMP) + emuFront(1.2, 3.4, { coupler: 2.8 }) + horns(9.0, 13.35),
    extra: (cc, g) => hvac(14, 13.4, 9) + roofCover(32, 13.4, 10, 0.5) + boxes(14, 30, 3.4, 2, 1.2) + rect(31, 1.6, 9, 1.6, "#2a2d31", 0.4, 'rx="0.3"') + slats(31.4, 1.8, 8.2, 1.2, 0.4, "rgba(255,255,255,0.18)") +
      boxes(42, g.L - 9, 3.4, 1, 1.1) + fsMark(cc, g.L - 8, 11.4, 0.5, "#ffffff") });
};
const masMid = (c) => {
  const rows = [{ xs: [3.0, 8.2], y: 6.8, w: 4.4, h: 3.3, r: 0.35 }, { xs: seq(19.2, 5.2, 4), y: 6.8, w: 4.4, h: 3.3, r: 0.35 }, { xs: [c.L - 13.6, c.L - 8.4], y: 6.8, w: 4.4, h: 3.3, r: 0.35 }];
  const pan = c.index === 1;
  return sec(c, { roof: 13.4, sill: 3.4, rows, doors: [dbl(13.6, 3.4, 10.7, 4.3, masDoor(c)), dbl(c.L - 19.4, 3.4, 10.7, 4.3, masDoor(c))], jakobs: ["start", "end"],
    paint: (cc, g) => masPaint(cc, g, false),
    extra: (cc, g) => (pan ? panSet(g.L / 2, 13.4, -1, true) + roofCover(g.L / 2 + 5, 13.4, 9, 0.6, "#8d949c", 2) : hvac(g.L / 2 - 4.5, 13.4, 9) + roofCover(g.L / 2 + 6, 13.4, 8, 0.55, "#8d949c", 2)) +
      boxes(9, 13, 3.4, 1, 0.9) + rect(20, 1.6, 9, 1.6, "#2a2d31", 0.4, 'rx="0.3"') + slats(20.4, 1.8, 8.2, 1.2, 0.4, "rgba(255,255,255,0.18)") + boxes(30, g.L - 20, 3.4, 2, 1.1) });
};

// ===================== Regionale =====================

// The DPR grey on a single-deck section: light over dark grey, a black
// window band, blue and yellow lines low, the cab's surround black.
function dprSide(L, { band, low, skirt, roofY, cabTo = null }) {
  let s = rect(-1, 0, L + 2, 20, DPR.light) + rect(-1, roofY, L + 2, 4, DPR.roof) + rect(-1, 0, L + 2, low, DPR.grey) +
    rect(-1, low - 0.55, L + 2, 0.3, DPR.blue) + rect(-1, low - 0.95, L + 2, 0.26, DPR.yellow) + rect(-1, 0, L + 2, skirt, "#33373c");
  if (band) s += rect(cabTo ?? -1, band[0], L + 2, band[1] - band[0], DPR.band);
  return s;
}
// The 2024 Regionale scheme: a white-grey body, the dark green rising in a
// soft curve from the lower side toward the cab, the lighter green along
// its edge, a yellow line; at the cab the greens wrap the nose.
function rgSide(L, { low, roofY, skirt, cab = false, band }) {
  let s = rect(-1, 0, L + 2, 20, RG.white) + rect(-1, roofY, L + 2, 4, RG.roof) + rect(-1, 0, L + 2, low, RG.green) + rect(-1, low, L + 2, 0.35, RG.leaf) +
    rect(-1, skirt + 0.25, L + 2, 0.2, RG.yellow) + rect(-1, 0, L + 2, skirt, "#2a2e2b");
  if (band) s += rect(cab ? 12 : -1, band[0], L + 2, band[1] - band[0], "#1d2024");
  if (cab) s += path(`M-1 ${low}L-1 ${roofY}L6 ${roofY}Q8.6 ${roofY - 2} 11.0 ${low + 2.6}Q13.0 ${low + 0.4} 18.0 ${low}Z`, RG.green) +
    path(`M6 ${roofY}Q8.6 ${roofY - 2} 11.0 ${low + 2.6}Q13.0 ${low + 0.4} 18.0 ${low}L18.0 ${low + 0.35}Q13.2 ${low + 0.75} 11.3 ${low + 2.9}Q9.0 ${roofY - 1.7} 6.6 ${roofY}Z`, RG.leaf);
  return s;
}
// A green door in its wide black border (2024 scheme).
const rgDoorFrame = (x, y0, w, h) => rect(x - 0.45, y0, w + 0.9, h + 0.45, RG.black, 0, 'rx="0.3"');

// --- Rock (Hitachi Caravaggio): double-deck, not articulated, cars about
// 27 m; ETR 421 four cars (109.6 m), ETR 521 five (136.8 m), ETR 621 six;
// 160 km/h. A long rounded nose; the upper deck over the low floor between
// the trucks, stairs over the trucks; two wide single-leaf doors a side per
// car at the low floor; the equipment on the roof. Drawn in the 2024
// Regionale scheme (Tper's in its own colors).
const ROCK = { roof: 15.0, sill: 3.9, drop: (L, cab) => ({ a: cab ? 22.0 : 13.5, b: L - 13.5, y: 1.9 }) };
const NOSE_ROCK = [[1.6, 3.9], [0.9, 6.0], ["q", 0.9, 8.4, 2.6, 10.0], [6.6, 14.0], ["q", 8.0, 15.0, 10.8, 15.0]];
function rockPaint(c, g, cab) {
  const L = g.L;
  if (c.agency === "tper") return rect(-1, 0, L + 2, 20, TP.white) + rect(-1, 14.0, L + 2, 3, TP.roof) + rect(cab ? 15 : -1, 10.75, L + 2, 2.85, TP.band) + rect(cab ? 15 : -1, 4.85, L + 2, 2.65, TP.band) +
    rect(-1, 0, L + 2, 2.6, TP.band) + rect(-1, 2.6, L + 2, 0.35, TP.red) + (cab ? path("M0 2.6L0 15L7.6 15Q4.8 12 4.0 8.4Q3.6 5.4 7.0 2.6Z", TP.red) + path(poly([[2.2, 9.8], [6.4, 13.9], [14.8, 13.9], [14.8, 9.8]]), "#1d2024") : "");
  let s = rgSide(L, { low: 4.4, roofY: 14.0, skirt: 2.6, cab }) + rect(cab ? 15 : -1, 10.75, L + 2, 2.85, "#1d2024") + rect(cab ? 22 : 13.5, 4.85, L - (cab ? 35.5 : 27), 2.65, "#1d2024");
  if (cab) s += path(poly([[2.2, 9.8], [6.4, 13.9], [14.8, 13.9], [14.8, 9.8]]), "#1d2024");
  return s;
}
const rockDoorFill = (c) => (c.agency === "tper" ? TP.red : RG.green);
const rockRows = (L, cab) => [{ xs: seq(cab ? 23.0 : 14.6, 5.3, Math.floor((L - (cab ? 37 : 29)) / 5.3) + 1), y: 10.95, w: 4.3, h: 2.45, r: 0.4 },
  { xs: seq(cab ? 29.2 : 21.0, 5.3, Math.floor((L - (cab ? 50 : 42)) / 5.3) + 1), y: 5.05, w: 4.3, h: 2.25, r: 0.4 },
  { xs: cab ? [16.2, L - 11.2] : [3.4, 7.8, L - 11.8, L - 7.4], y: 8.1, w: 3.7, h: 2.3, r: 0.4 }];
const rockDoors = (L, cab, c) => [{ x: cab ? 23.6 : 15.2, w: 4.0, y0: 2.0, y1: 9.6, leaves: 1, glassY: 0.35, glassH: 0.5, grabs: false, fill: rockDoorFill(c) },
  { x: L - 19.6, w: 4.0, y0: 2.0, y1: 9.6, leaves: 1, glassY: 0.35, glassH: 0.5, grabs: false, fill: rockDoorFill(c) }];
const rockOver = (c, L, cab) => (c.agency === "tper" ? letters(c, cab ? 46 : 44, 9.3, 1.1, "Tper", TP.red, { weight: 800 }) + letters(c, cab ? 58 : 56, 9.3, 0.5, "TRENITALIA", "#5b6168", { weight: 700, spacing: 0.06 })
  : (cab ? rMark(c, 4.8, 6.4, 1.6, RG.yellow, RG.green) : "") + regionale(c, cab ? 42 : 38, 9.3, 0.95, RG.green) + trenitalia(c, cab ? 60 : 56, 9.3, 0.45, "#5b6168")) +
  rockDoors(L, cab, c).map((d) => (c.agency === "tper" ? "" : rgDoorFrame(d.x, d.y0, d.w, d.y1 - d.y0))).join("");
const rockCab = (c) => sec(c, { roof: ROCK.roof, sill: ROCK.sill, drop: ROCK.drop(c.L, true), nose: NOSE_ROCK, cabLen: 14, rows: rockRows(c.L, true), doors: rockDoors(c.L, true, c),
  trucks: [[9.8, 33, 8.5], [c.L - 7.8, 33, 8.5]], diaphragm: [4.2, 13.6],
  paint: (cc, g) => rockPaint(cc, g, true) + rockOver(cc, g.L, true),
  cab: () => glass([[2.6, 10.2], [6.6, 13.6], [13.0, 13.6], [13.0, 10.2]], [[3.1, 10.5], [4.8, 12.0], [5.8, 12.0], [4.0, 10.5]], [3.4, 10.4, 5.2, 12.6]) +
    lamp(1.0, 5.9, 0.9, 0.42) + lamp(0.92, 5.1, 0.5, 0.3, RED_LAMP) + emuFront(1.6, 3.9, { coupler: 3.0 }) + horns(12.6, 14.95),
  extra: (cc, g) => hvac(17, 15.0, 10) + roofCover(30, 15.0, 16, 0.55, "#9aa1a9", 3) + hvac(g.L - 16, 15.0, 9) + boxes(23.5, g.L - 15, 1.9, 3, 0.55) + boxes(2.6, 5.8, 3.9, 1, 0.8) });
const rockMid = (c) => sec(c, { roof: ROCK.roof, sill: ROCK.sill, drop: ROCK.drop(c.L, false), rows: rockRows(c.L, false), doors: rockDoors(c.L, false, c),
  trucks: [[7.8, 33, 8.5], [c.L - 7.8, 33, 8.5]], diaphragm: [4.2, 13.6],
  paint: (cc, g) => rockPaint(cc, g, false) + rockOver(cc, g.L, false),
  extra: (cc, g) => (c.index % 2 === 1 ? panSet(g.L / 2 - 6, 15.0, -1, true) + roofCover(g.L / 2 + 1, 15.0, 14, 0.6, "#9aa1a9", 3) : hvac(g.L / 2 - 12, 15.0, 10) + roofCover(g.L / 2 + 1, 15.0, 12, 0.5, "#9aa1a9", 2)) +
    hvac(3, 15.0, 8) + hvac(g.L - 11, 15.0, 8) + boxes(15, g.L - 15, 1.9, 3, 0.55) });

// --- Pop (Alstom Coradia Stream): single-deck, cars of about 21 m on their
// own trucks; ETR 103 three cars (65.7 m), ETR 104 four (84.2 m); 160 km/h.
// A broad rounded nose; two double doors a side per car; roof equipment.
const NOSE_POP = [[1.3, 3.6], [0.8, 5.8], ["q", 0.8, 7.5, 2.0, 8.8], [4.6, 12.4], ["q", 5.6, 13.5, 7.8, 13.5]];
function popPaint(c, g, cab) {
  const L = g.L;
  if (c.agency === "tper") return rect(-1, 0, L + 2, 20, TP.white) + rect(-1, 12.6, L + 2, 3, TP.roof) + rect(cab ? 11 : -1, 6.7, L + 2, 3.6, TP.band) + rect(-1, 0, L + 2, 3.9, TP.band) + rect(-1, 3.9, L + 2, 0.35, TP.red) +
    (cab ? path("M0 3.9L0 13.5L5.4 13.5Q2.6 10 2.6 7.2Q2.6 5 5.6 3.9Z", TP.red) + path(poly([[1.6, 8.6], [4.8, 12.4], [11.2, 12.4], [11.2, 8.6]]), "#1d2024") : "");
  return rgSide(L, { low: 5.4, roofY: 12.6, skirt: 3.6, cab, band: [6.7, 10.3] }) + (cab ? path(poly([[1.6, 8.6], [4.8, 12.4], [11.2, 12.4], [11.2, 8.6]]), "#1d2024") : "");
}
const popDoors = (L, cab, c) => [dbl(cab ? 14.8 : 7.6, 3.6, 10.8, 4.3, c.agency === "tper" ? TP.red : RG.green), dbl(L - 14.0, 3.6, 10.8, 4.3, c.agency === "tper" ? TP.red : RG.green)];
const popOver = (c, L, cab) => (c.agency === "tper" ? letters(c, cab ? 30 : 34, 5.3, 1.0, "Tper", "#ffffff", { weight: 800 })
  : (cab ? rMark(c, 4.2, 5.4, 1.4, RG.yellow, RG.green) : "") + regionale(c, cab ? 22.5 : 15, 11.45, 0.75, RG.green) + trenitalia(c, L - 22, 11.45, 0.4, "#5b6168") +
    popDoors(L, cab, c).map((d) => rgDoorFrame(d.x, d.y0, d.w, d.y1 - d.y0)).join(""));
const popCab = (c) => sec(c, { roof: 13.5, sill: 3.6, nose: NOSE_POP, cabLen: 10, rows: [{ xs: [11.0], y: 7.0, w: 2.6, h: 3.1, r: 0.4 }, { xs: seq(21.0, 5.3, 6), y: 7.0, w: 4.5, h: 3.1, r: 0.4 }],
  doors: popDoors(c.L, true, c), trucks: [[9.0, 33, 8.5], [c.L - 8.0, 33, 8.5]],
  paint: (cc, g) => popPaint(cc, g, true) + popOver(cc, g.L, true),
  cab: () => glass([[2.0, 8.95], [5.0, 12.1], [10.4, 12.1], [10.4, 8.95]], [[2.5, 9.2], [3.8, 10.7], [4.6, 10.7], [3.4, 9.2]], [2.8, 9.1, 4.2, 11.4]) +
    lamp(0.95, 5.6, 0.9, 0.4) + lamp(0.88, 4.85, 0.5, 0.28, RED_LAMP) + emuFront(1.3, 3.6, { coupler: 2.9 }) + horns(10.4, 13.45),
  extra: (cc, g) => hvac(14, 13.5, 9) + roofCover(26, 13.5, 14, 0.6, "#9aa1a9", 3) + hvac(g.L - 14, 13.5, 8) + boxes(20, g.L - 15, 3.6, 3, 1.1) });
const popMid = (c) => sec(c, { roof: 13.5, sill: 3.6, rows: [{ xs: [2.8], y: 7.0, w: 3.4, h: 3.1, r: 0.4 }, { xs: seq(14.2, 5.3, 7), y: 7.0, w: 4.5, h: 3.1, r: 0.4 }, { xs: [c.L - 8.2], y: 7.0, w: 4.5, h: 3.1, r: 0.4 }],
  doors: popDoors(c.L, false, c), trucks: [[8.0, 33, 8.5], [c.L - 8.0, 33, 8.5]],
  paint: (cc, g) => popPaint(cc, g, false) + popOver(cc, g.L, false),
  extra: (cc, g) => (c.index === 1 ? panSet(g.L / 2 - 4, 13.5, -1, true) + roofCover(g.L / 2 + 3, 13.5, 12, 0.6, "#9aa1a9", 2) : hvac(g.L / 2 - 8, 13.5, 9) + roofCover(g.L / 2 + 3, 13.5, 10, 0.55, "#9aa1a9", 2)) +
    hvac(2.5, 13.5, 7) + boxes(14, g.L - 14, 3.6, 3, 1.1) });

// --- Jazz (Alstom Coradia Meridian): articulated low-floor units, ETR 324
// (four sections, 67.55 m), ETR 425 (five, 82.2 m) and ETR 526 (six); 160
// km/h. A sharp sloped nose; one double door a side per section; Jakobs
// trucks at the joints. DPR grey with lime doors; on the Leonardo Express
// (Roma Termini-Fiumicino) white with green and red.
const NOSE_JAZZ = [[1.4, 3.5], [0.8, 5.2], ["q", 0.9, 7.0, 2.4, 8.4], [6.2, 12.6], ["q", 7.2, 13.5, 9.4, 13.5]];
const leo = (c) => !!c.leonardo;
function jazzPaint(c, g, cab) {
  const L = g.L;
  if (leo(c)) return rect(-1, 0, L + 2, 20, LX.white) + rect(-1, 12.6, L + 2, 3, DPR.roof) + rect(cab ? 13 : -1, 6.8, L + 2, 3.5, "#1d2024") + rect(-1, 0, L + 2, 3.5, "#33373c") +
    rect(-1, 4.6, L + 2, 0.7, LX.green) + rect(-1, 5.3, L + 2, 0.7, LX.red) + (cab ? path(poly([[1.8, 8.3], [6.2, 12.5], [13.2, 12.5], [13.2, 8.3]]), "#1d2024") + path("M0 3.5L0 8.0Q2.0 6.2 5.2 5.3L5.2 3.5Z", LX.green) : "");
  return dprSide(L, { band: [6.8, 10.3], low: 5.9, skirt: 3.5, roofY: 12.6, cabTo: cab ? 13 : null }) + (cab ? path(poly([[1.8, 8.3], [6.2, 12.5], [13.2, 12.5], [13.2, 8.3]]), "#1d2024") + path("M0 3.5L0 7.6Q2.0 6.2 5.0 5.9L5.0 3.5Z", DPR.yellow) : "");
}
const jazzDoor = (c) => (leo(c) ? LX.green : DPR.lime);
const jazzOver = (c, x) => (leo(c) ? letters(c, x, 11.45, 0.8, "Leonardo Express", LX.green, { weight: 700, italic: true }) : letters(c, x, 11.45, 0.75, "Jazz", "#4a5057", { weight: 700, italic: true }) + trenitalia(c, x + 9, 11.45, 0.4, "#5b6168"));
const jazzCab = (c) => sec(c, { roof: 13.5, sill: 3.5, nose: NOSE_JAZZ, cabLen: 12, rows: [{ xs: [13.6], y: 7.0, w: 2.6, h: 3.1, r: 0.4 }, { xs: seq(25.0, 5.2, 6), y: 7.0, w: 4.4, h: 3.1, r: 0.4 }],
  doors: [dbl(19.0, 3.5, 10.8, 4.3, jazzDoor(c))], trucks: [[10.4, 33, 8.5]], jakobs: ["end"],
  paint: (cc, g) => jazzPaint(cc, g, true) + jazzOver(cc, 34),
  cab: () => glass([[2.4, 8.7], [6.4, 12.2], [12.4, 12.2], [12.4, 8.7]], [[2.9, 9.0], [4.6, 10.6], [5.4, 10.6], [3.8, 9.0]], [3.2, 8.9, 5.0, 11.4]) +
    lamp(1.0, 5.3, 0.9, 0.4) + lamp(0.92, 4.6, 0.5, 0.28, RED_LAMP) + emuFront(1.4, 3.5, { coupler: 2.85 }) + horns(12.4, 13.45),
  extra: (cc, g) => hvac(16, 13.5, 9) + (cc.index === 0 ? panSet(36, 13.5, -1, true) : roofCover(32, 13.5, 8, 0.45)) + roofCover(44, 13.5, 10, 0.55) + boxes(17, 30, 3.5, 2, 1.0) + boxes(32, g.L - 8, 3.5, 2, 0.9) });
const jazzMid = (c) => sec(c, { roof: 13.5, sill: 3.5, rows: [{ xs: seq(3.0, 5.2, 3), y: 7.0, w: 4.4, h: 3.1, r: 0.4 }, { xs: seq(24.2, 5.2, 4), y: 7.0, w: 4.4, h: 3.1, r: 0.4 }],
  doors: [dbl(18.6, 3.5, 10.8, 4.3, jazzDoor(c))], jakobs: ["start", "end"],
  paint: (cc, g) => jazzPaint(cc, g, false) + (cc.index === 2 ? jazzOver(cc, 34) : ""),
  extra: (cc, g) => hvac(3, 13.5, 9) + roofCover(25, 13.5, 14, 0.5, "#9aa1a9", 2) + boxes(5, 17, 3.5, 2, 0.9) + boxes(25, g.L - 6, 3.5, 2, 1.0) });
// The Leonardo Express's Jazz units, in its own paint.
const lxCab = (c) => jazzCab({ ...c, leonardo: true });
const lxMid = (c) => jazzMid({ ...c, leonardo: true });

// --- Vivalto (double-deck coaches, 26.06 m, 4.3 m tall, 160 km/h; 126
// seats in a middle car): a low floor between the trucks, the end sections
// over the trucks at a middle level with a wide door a side; windows on
// both decks. The driving car's cab copies the E.464's nose. DPR grey (or
// Tper's).
const VIV = { roof: 14.1, sill: 3.9 };
const NOSE_VIV = [[1.4, 3.9], [1.1, 7.9], ["q", 1.2, 9.2, 2.0, 9.9], [3.6, 13.3], ["q", 4.0, 14.1, 5.2, 14.1]];
function vivPaint(c, g, cab) {
  const L = g.L;
  const tper = c.agency === "tper";
  let s = rect(-1, 0, L + 2, 20, tper ? TP.white : DPR.light) + rect(-1, 13.3, L + 2, 3, DPR.roof) + rect(-1, 0, L + 2, 7.25, tper ? TP.red : DPR.grey) + rect(-1, 0, L + 2, 2.7, "#33373c");
  if (!tper) s += rect(-1, 6.55, L + 2, 0.3, DPR.blue) + rect(-1, 6.15, L + 2, 0.26, DPR.yellow);
  s += rect(17.5, 10.25, L - 35, 2.55, DPR.band) + rect(17.5, 4.3, L - 35, 2.35, "#2a2d31");
  if (cab) s += path(poly([[1.8, 9.75], [3.6, 13.1], [6.4, 13.1], [6.4, 9.75]]), "#1d2024");
  return s;
}
const vivRows = (L, cab) => [{ xs: seq(18.0, 5.05, Math.floor((L - 36) / 5.05) + 1), y: 10.45, w: 4.1, h: 2.15, r: 0.4 },
  { xs: seq(18.0, 5.05, Math.floor((L - 36) / 5.05) + 1), y: 4.5, w: 4.1, h: 1.95, r: 0.4 }, { xs: cab ? [7.4, L - 7.8] : [3.0, L - 7.0], y: 8.2, w: 3.6, h: 2.2, r: 0.4 }];
const vivDoorFill = (c) => (c.agency === "tper" ? TP.red : DPR.lime);
const vivDoors = (L, cab, c) => [sgl(cab ? 11.6 : 8.0, 4.1, 11.6, 3.2, vivDoorFill(c)), sgl(L - 11.4, 4.1, 11.6, 3.2, vivDoorFill(c))];
// The class numerals at the end of each deck: "1" upstairs on a mixed coach.
// Upstairs, by the end of the deck over each door, "1" on a coach with
// first class there (its name between the decks, the gold band over the
// upper deck's windows only), else "2"; "2" by the lower deck.
const vivClass = (c, L) => {
  const up = c.lv === "first" ? "first" : "second", xs = [c.cabL ? 16.2 : 14.3, L - 14.45];
  return (up === "first" ? goldBand(12.85, 17.5, L - 17.5) : "") + classSigns(c, up, xs, 11.45, up === "first" ? [[18.2, "start"]] : [], 8.95, { fill: "#2a2d31" }) +
    classSigns(c, "second", xs, 5.45, []);
};
const vivOver = (c, L) => vivClass(c, L) + (c.agency === "tper" ? letters(c, L / 2, 8.6, 1.0, "Tper", TP.red, { weight: 800 }) : letters(c, L / 2 + 2, 8.6, 0.9, "Vivalto", "#4a5057", { weight: 700, italic: true }) + trenitalia(c, L / 2 + 13, 8.6, 0.4, "#5b6168"));
const vivExtra = (c, L) => hvac(4, 14.1, 8.5) + hvac(L - 12.5, 14.1, 8.5) + roofCover(20, 14.1, L - 40, 0.3, "#b2b8bf", 4) + boxes(19, L - 19, 1.6, 3, 0.5) +
  rect(L / 2 - 3, 0.9, 6, 0.6, C.steelDark, 0.4, 'rx="0.3"') + buffers(L, 1) + (c.cabL ? "" : buffers(0, -1));
const vivalto = (c) => sec(c, { ...VIV, drop: { a: 16.5, b: c.L - 16.5, y: 1.6 }, rows: vivRows(c.L, false), doors: vivDoors(c.L, false, c),
  trucks: [[8.6, 36, 8.2], [c.L - 8.6, 36, 8.2]], diaphragm: [4.2, 12.8], paint: (cc, g) => vivPaint(cc, g, false) + vivOver(cc, g.L), extra: (cc, g) => vivExtra(cc, g.L) });
const vivaltoCab = (c) => sec(c, { ...VIV, drop: { a: 17.5, b: c.L - 16.5, y: 1.6 }, nose: NOSE_VIV, cabLen: 7, rows: vivRows(c.L, true), doors: vivDoors(c.L, true, c),
  trucks: [[9.6, 36, 8.2], [c.L - 8.6, 36, 8.2]], diaphragm: [4.2, 12.8], paint: (cc, g) => vivPaint(cc, g, true) + vivOver(cc, g.L),
  cab: () => glass([[2.0, 10.0], [3.65, 12.85], [6.1, 12.85], [6.1, 10.0]], [[2.3, 10.2], [3.0, 11.4], [3.6, 11.4], [3.0, 10.2]], [2.5, 10.1, 3.4, 12.2]) +
    lamp(1.2, 6.4, 0.45, 0.5) + lamp(1.1, 5.6, 0.35, 0.3, RED_LAMP) + lamp(4.4, 13.6, 0.55, 0.25) + buffers(0, -1) + horns(6.2, 14.05) + rect(1.0, 2.2, 1.6, 1.2, "#2a2d31"),
  extra: (cc, g) => vivExtra(cc, g.L) });

// --- Minuetto (Alstom, Giugiaro; ALe 501/502 electric about 100, ALn
// 501/502 diesel about 104): three articulated sections, 51.9 m; a
// rounded nose under a big wrap-round windshield; one double door a side
// in each end section near the joint. DPR grey with lime doors.
const NOSE_MIN = [[1.6, 3.4], [0.9, 5.4], ["q", 0.6, 7.6, 2.0, 9.4], [4.4, 12.0], ["q", 5.6, 13.0, 8.0, 13.0]];
const minPaint = (cab) => (c, g) => dprSide(g.L, { band: [6.5, 10.2], low: 5.6, skirt: 3.4, roofY: 12.2, cabTo: cab ? 10.5 : null }) +
  (cab ? path("M0 3.4L0 7.8Q2.4 5.9 6.0 5.6L6.0 3.4Z", DPR.yellow) + path(poly([[1.0, 8.6], [4.0, 11.9], [10.6, 11.9], [10.6, 6.5], [6.0, 6.5]]), "#1d2024") : "");
const minCab = (diesel) => (c) => sec(c, { roof: 13.0, sill: 3.4, nose: NOSE_MIN, cabLen: 10, rows: [{ xs: seq(12.0, 5.0, 4), y: 6.7, w: 4.0, h: 3.2, r: 0.4 }, { xs: [c.L - 7.2], y: 6.7, w: 4.0, h: 3.2, r: 0.4 }],
  doors: [dbl(c.L - 13.8, 3.4, 10.5, 4.2, DPR.lime)], trucks: [[8.8, 30, 8.2]], jakobs: ["end"],
  // The "501" end car's first-class section behind the cab (its four
  // windows): the gold band over it, "1" and its name past its last window;
  // "2" by the door.
  paint: (cc, g) => minPaint(true)(cc, g) + letters(cc, 42, 4.55, 0.85, "Minuetto", "#ffffff", { weight: 700, italic: true }) +
    (cc.lv === "first" ? goldBand(10.3, 10.6, 31.6) + classSigns(cc, "first", [33.3], 8.35, [[34.9, "start"]], 8.35) : "") + classSigns(cc, "second", [g.L - 8.4], 8.35),
  cab: () => glass([[1.8, 8.9], [4.3, 11.7], [9.6, 11.7], [9.6, 8.6], [5.4, 8.6]], [[2.3, 9.2], [3.6, 10.6], [4.4, 10.6], [3.2, 9.2]], [2.6, 9.1, 3.8, 11.0]) +
    lamp(0.85, 5.3, 0.8, 0.4) + lamp(0.8, 4.55, 0.45, 0.28, RED_LAMP) + emuFront(1.6, 3.4, { coupler: 2.8 }) + horns(9.6, 12.95),
  extra: (cc, g) => hvac(12, 13.0, 9) + (diesel ? roofCover(24, 13.0, 8, 0.7, "#8d949c", 2) + slats(24.6, 13.1, 6.8, 0.5, 0.4, "rgba(0,0,0,0.35)") + rect(28, 13.7, 0.5, 0.8, "currentColor") +
    boxes(14, 20, 3.4, 1, 1.2) + rect(21, 1.6, 9, 1.6, "#2a2d31", 0.4, 'rx="0.4"') + slats(21.4, 1.8, 8.2, 1.2, 0.4, "rgba(255,255,255,0.18)") : roofCover(24, 13.0, 10, 0.5, "#9aa1a9", 2) + boxes(14, 32, 3.4, 2, 1.1)) +
    boxes(g.L - 12, g.L - 6, 3.4, 1, 0.8) });
const minMid = (diesel) => (c) => sec(c, { roof: 13.0, sill: 3.4, rows: [{ xs: seq(3.6, 5.0, 8), y: 6.7, w: 4.0, h: 3.2, r: 0.4 }], jakobs: ["start", "end"],
  paint: minPaint(false), extra: (cc, g) => (diesel ? hvac(g.L / 2 - 4.5, 13.0, 9) : panSet(g.L / 2, 13.0, -1, true)) + boxes(6, g.L - 6, 3.4, 3, 1.0) +
    trenitalia(cc, g.L / 2, 4.55, 0.45, "#ffffff") });

// --- TAF (ALe 426/Le 736/ALe 506; Ansaldo-Breda, Firema, Fiat; 1997-
// 2006): four double-deck cars, about 104 m; a sloping cab nose; the
// lower deck between the trucks, a pair of doors a side at its ends; 140
// km/h, on Rome's FL lines. DPR grey.
const NOSE_TAF = [[1.6, 3.9], [1.0, 6.2], ["q", 1.0, 8.6, 2.4, 10.0], [6.0, 13.6], ["q", 7.0, 14.4, 9.0, 14.4]];
function tafPaint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = rect(-1, 0, L + 2, 20, DPR.light) + rect(-1, 13.6, L + 2, 3, DPR.roof) + rect(-1, 0, L + 2, 7.0, DPR.grey) + rect(-1, 6.3, L + 2, 0.3, DPR.blue) + rect(-1, 5.9, L + 2, 0.26, DPR.yellow) +
      rect(-1, 0, L + 2, 2.6, "#33373c") + rect(cab ? 21 : 17, 10.4, L - (cab ? 38 : 34), 2.6, DPR.band) + rect(cab ? 21 : 17, 4.35, L - (cab ? 38 : 34), 2.3, "#2a2d31");
    if (cab) s += path(poly([[2.2, 9.8], [6.0, 13.4], [12.0, 13.4], [12.0, 9.8]]), "#1d2024") + path("M0 2.6L0 8.6Q2.0 7.0 5.4 6.6L5.4 2.6Z", DPR.yellow);
    return s;
  };
}
const tafRows = (L, cab) => [{ xs: seq(cab ? 22.0 : 18.0, 5.4, Math.floor((L - (cab ? 40 : 36)) / 5.4) + 1), y: 10.6, w: 4.2, h: 2.2, r: 0.4 },
  { xs: seq(cab ? 22.0 : 18.0, 5.4, Math.floor((L - (cab ? 40 : 36)) / 5.4) + 1), y: 4.5, w: 4.2, h: 1.95, r: 0.4 }, { xs: cab ? [13.4, L - 7.6] : [3.2, L - 7.4], y: 8.2, w: 3.8, h: 2.3, r: 0.4 }];
const tafDoors = (L, cab) => [dbl(cab ? 15.8 : 11.6, 1.8, 9.6, 4.0, DPR.lime), dbl(L - 15.6, 1.8, 9.6, 4.0, DPR.lime)];
const tafCab = (c) => sec(c, { roof: 14.4, sill: 3.9, drop: { a: 15.4, b: c.L - 11.4, y: 1.7 }, nose: NOSE_TAF, cabLen: 12, rows: tafRows(c.L, true), doors: tafDoors(c.L, true),
  trucks: [[8.8, 36, 8.5], [c.L - 8.0, 36, 8.5]], diaphragm: [4.2, 13.0],
  paint: (cc, g) => tafPaint(true)(cc, g) + letters(cc, 46, 8.6, 0.9, "TAF", "#4a5057", { weight: 800 }) + trenitalia(cc, 56, 8.6, 0.4, "#5b6168"),
  cab: () => glass([[2.6, 10.1], [6.1, 13.1], [11.4, 13.1], [11.4, 10.1]], [[3.0, 10.4], [4.6, 11.8], [5.4, 11.8], [3.9, 10.4]], [3.2, 10.3, 4.8, 12.4]) +
    lamp(1.0, 6.4, 0.9, 0.42) + lamp(0.95, 5.6, 0.5, 0.3, RED_LAMP) + emuFront(1.6, 3.9, { coupler: 3.0 }) + horns(11.6, 14.35),
  extra: (cc, g) => hvac(14, 14.4, 9) + panSet(34, 14.4, -1, true) + roofCover(42, 14.4, 14, 0.6, "#9aa1a9", 3) + hvac(g.L - 12, 14.4, 8) + boxes(17, g.L - 13, 1.7, 3, 0.5) });
const tafMid = (c) => sec(c, { roof: 14.4, sill: 3.9, drop: { a: 15.0, b: c.L - 15.0, y: 1.7 }, rows: tafRows(c.L, false), doors: tafDoors(c.L, false),
  trucks: [[8.0, 36, 8.5], [c.L - 8.0, 36, 8.5]], diaphragm: [4.2, 13.0], paint: tafPaint(false),
  extra: (cc, g) => hvac(3, 14.4, 8) + hvac(g.L - 11, 14.4, 8) + roofCover(20, 14.4, g.L - 40, 0.35, "#b2b8bf", 4) + boxes(17, g.L - 17, 1.7, 3, 0.5) });

// --- Swing (Pesa ATR 220, 40 for Trenitalia): three articulated
// sections, about 55.6 m, a diesel under each end section's floor; a
// rounded nose; one double door a side in each section. DPR grey.
const NOSE_SWING = [[1.4, 3.3], [0.9, 5.6], ["q", 0.9, 7.6, 2.4, 9.0], [4.8, 12.6], ["q", 5.8, 13.5, 8.0, 13.5]];
const swingCab = (c) => sec(c, { roof: 13.5, sill: 3.3, nose: NOSE_SWING, cabLen: 10, rows: [{ xs: seq(11.6, 5.2, 2), y: 6.7, w: 4.3, h: 3.3, r: 0.4 }, { xs: seq(27.6, 5.2, 5), y: 6.7, w: 4.3, h: 3.3, r: 0.4 }],
  doors: [dbl(21.4, 3.3, 10.6, 4.3, DPR.lime)], trucks: [[9.4, 33, 8.5]], jakobs: ["end"],
  paint: (cc, g) => dprSide(g.L, { band: [6.5, 10.4], low: 5.4, skirt: 3.3, roofY: 12.6, cabTo: 10.6 }) + path(poly([[1.6, 8.9], [4.8, 12.4], [10.8, 12.4], [10.8, 8.9]]), "#1d2024") +
    path("M0 3.3L0 7.6Q2.4 5.9 5.6 5.4L5.6 3.3Z", DPR.yellow) + letters(cc, 40, 4.4, 0.85, "Swing", "#ffffff", { weight: 700, italic: true }),
  cab: () => glass([[2.0, 9.15], [5.0, 12.1], [10.0, 12.1], [10.0, 9.15]], [[2.5, 9.4], [3.8, 10.8], [4.6, 10.8], [3.4, 9.4]], [2.8, 9.3, 4.2, 11.4]) +
    lamp(0.95, 5.3, 0.9, 0.4) + lamp(0.9, 4.55, 0.5, 0.28, RED_LAMP) + emuFront(1.4, 3.3, { coupler: 2.8 }) + horns(10.0, 13.45),
  extra: (cc, g) => hvac(13, 13.5, 9) + roofCover(28, 13.5, 9, 0.7, "#8d949c", 2) + slats(28.6, 13.6, 7.8, 0.5, 0.4, "rgba(0,0,0,0.35)") + rect(33, 14.2, 0.5, 0.9, "currentColor") +
    rect(30, 1.5, 10, 1.7, "#2a2d31", 0.4, 'rx="0.4"') + slats(30.4, 1.7, 9.2, 1.3, 0.4, "rgba(255,255,255,0.18)") + boxes(13, 20, 3.3, 1, 1.0) + boxes(42, g.L - 7, 3.3, 2, 1.0) });
const swingMid = (c) => sec(c, { roof: 13.5, sill: 3.3, rows: [{ xs: seq(3.0, 5.2, 2), y: 6.7, w: 4.3, h: 3.3, r: 0.4 }, { xs: seq(c.L / 2 + 3.2, 5.2, 4), y: 6.7, w: 4.3, h: 3.3, r: 0.4 }],
  doors: [dbl(c.L / 2 - 4.6, 3.3, 10.6, 4.3, DPR.lime)], jakobs: ["start", "end"],
  paint: (cc, g) => dprSide(g.L, { band: [6.5, 10.4], low: 5.4, skirt: 3.3, roofY: 12.6 }) + trenitalia(cc, 9, 4.4, 0.45, "#ffffff"),
  extra: (cc, g) => hvac(3, 13.5, 9) + hvac(g.L - 12, 13.5, 9) + boxes(5, g.L / 2 - 6, 3.3, 2, 1.0) + boxes(g.L / 2 + 6, g.L - 5, 3.3, 2, 1.0) });

// ===================== Trenitalia Tper =====================

// --- Stadler FLIRT, ETR 350 (26 for Tper): five sections; Finland's FLIRT
// drawing (digitraffic.cars.js) in Tper's white with a dark window band,
// red doors and a red cab front, the name behind the cab.
const TPER_FLIRT = { body: TP.white, roof: TP.roof, skirt: TP.band, door: TP.red, mask: "#1d2024",
  paint: (c, g, part) => {
    const L = g.L;
    let s = rect(0, 6.35, L, 4.1, "#2a2e33") + rect(0, 3.55, L, 0.3, TP.red);
    if (part === "cab") s += path("M0 3.0L0 13.2L1.8 13.2Q1.0 10.6 1.4 7.4Q2.4 5.0 5.6 3.55Z", TP.red);
    return s;
  },
  over: (c, g, part) => (part === "cab" ? letters(c, 17.0, 11.65, 1.0, "Tper", TP.red, { weight: 800 }) + letters(c, 42, 5.0, 0.45, "TRENITALIA", "#5b6168", { weight: 700, spacing: 0.06 })
    : c.index === 2 ? letters(c, g.L / 2, 5.0, 0.6, "ETR 350", "#5b6168", { weight: 600 }) : ""),
};
const tperFlirtCab = (c) => flirt(c, "cab", TPER_FLIRT);
const tperFlirtMid = (c) => flirt({ ...c, pan: c.index === 2 }, "mid", TPER_FLIRT);

// ---------- Tables ----------

export const TYPES = {
  itFr1000Exec: { name: "Frecciarossa 1000 Executive car", kind: "emu", amenities: ["first", "business"] },
  itFr1000Business: { name: "Frecciarossa 1000 Business car", kind: "emu", amenities: ["business"] },
  itFr1000Bistro: { name: "Frecciarossa 1000 Business car with the bistro", kind: "emu", amenities: ["business", "cafe"] },
  itFr1000Premium: { name: "Frecciarossa 1000 Premium car", kind: "emu" },
  itFr1000Mid: { name: "Frecciarossa 1000 Standard car", kind: "emu" },
  itFr1000Cab: { name: "Frecciarossa 1000 Standard end car", kind: "emu" },
  itE404: { name: "E.404 power car (ETR 500)", kind: "electric", pan: true },
  itEtr500Exec: { name: "ETR 500 Executive and Business coach", kind: "coach", amenities: ["first", "business"] },
  itEtr500Business: { name: "ETR 500 Business coach", kind: "coach", amenities: ["business"] },
  itEtr500Bistro: { name: "ETR 500 Business coach with the bistro", kind: "coach", amenities: ["business", "cafe"] },
  itEtr500Premium: { name: "ETR 500 Premium coach", kind: "coach" },
  itEtr500Coach: { name: "ETR 500 Standard coach", kind: "coach" },
  itEtr700CabBiz: { name: "ETR 700 Business end car", kind: "emu", amenities: ["business"] },
  itEtr700Business: { name: "ETR 700 Business car", kind: "emu", amenities: ["business"] },
  itEtr700Premium: { name: "ETR 700 Premium car", kind: "emu" },
  itEtr700Mid: { name: "ETR 700 Standard car", kind: "emu" },
  itEtr700Cab: { name: "ETR 700 Standard end car", kind: "emu" },
  itEtr600CabBiz: { name: "ETR 600 Business end car", kind: "emu", amenities: ["business"] },
  itEtr600Business: { name: "ETR 600 Business car", kind: "emu", amenities: ["business"] },
  itEtr600Bistro: { name: "ETR 600 Business car with the bar", kind: "emu", amenities: ["business", "cafe"] },
  itEtr600Premium: { name: "ETR 600 Premium car", kind: "emu" },
  itEtr600Mid: { name: "ETR 600 Standard car", kind: "emu" },
  itEtr600Cab: { name: "ETR 600 Standard end car", kind: "emu" },
  itEtr485CabFirst: { name: "ETR 485 first-class end car", kind: "emu", amenities: ["first"] },
  itEtr485First: { name: "ETR 485 first-class car", kind: "emu", amenities: ["first"] },
  itEtr485Bar: { name: "ETR 485 bar car", kind: "emu", amenities: ["cafe"] },
  itEtr485Mid: { name: "ETR 485 second-class car", kind: "emu" },
  itEtr485Cab: { name: "ETR 485 second-class end car", kind: "emu" },
  itE414: { name: "E.414 electric locomotive", kind: "electric", pan: true },
  itE401: { name: "E.401 electric locomotive", kind: "electric", pan: true },
  itE402B: { name: "E.402B electric locomotive", kind: "electric", pan: true },
  itE464: { name: "E.464 electric locomotive", kind: "electric", pan: true },
  itIcFirst: { name: "UIC-Z1 first-class coach", kind: "coach", amenities: ["first"] },
  itIcCoach: { name: "UIC-Z1 second-class coach", kind: "coach" },
  itIcCab: { name: "UIC-Z1 second-class driving coach", kind: "coach", cab: true },
  itIcnCouchette: { name: "Couchette car", kind: "coach", amenities: ["sleepers"] },
  itIcnSleeper: { name: "Sleeping car", kind: "coach", amenities: ["sleepers"] },
  itMasCab: { name: "Hitachi Masaccio (HTR 312/412) end car", kind: "emu" },
  itMasMid: { name: "Hitachi Masaccio (HTR 312/412) car", kind: "emu" },
  itHtrPlus: { name: "HTR 412 InterCity end car with Plus (first class)", kind: "emu", amenities: ["first"] },
  itRockCab: { name: "Rock (Caravaggio) end car", kind: "bilevel", emu: true },
  itRockMid: { name: "Rock (Caravaggio) car", kind: "bilevel", emu: true },
  itPopCab: { name: "Pop (Coradia Stream) end car", kind: "emu" },
  itPopMid: { name: "Pop (Coradia Stream) car", kind: "emu" },
  itJazzCab: { name: "Jazz (Coradia Meridian) end section", kind: "emu" },
  itJazzMid: { name: "Jazz (Coradia Meridian) section", kind: "emu" },
  itLxCab: { name: "Leonardo Express (Jazz) end section", kind: "emu" },
  itLxMid: { name: "Leonardo Express (Jazz) section", kind: "emu" },
  itVivalto: { name: "Vivalto double-deck coach", kind: "bilevel" },
  itVivaltoMixed: { name: "Vivalto coach with first class upstairs", kind: "bilevel", amenities: ["first"] },
  itVivaltoCab: { name: "Vivalto driving car", kind: "bilevel", cab: true },
  itMinElFirst: { name: "Minuetto (ALe 501) end section with first class", kind: "emu", amenities: ["first"] },
  itMinElCab: { name: "Minuetto (ALe 502) end section", kind: "emu" },
  itMinElMid: { name: "Minuetto (ALe 501) middle section", kind: "emu" },
  itMinDFirst: { name: "Minuetto (ALn 501) end section with first class", kind: "emu", amenities: ["first"] },
  itMinDCab: { name: "Minuetto (ALn 502) end section", kind: "emu" },
  itMinDMid: { name: "Minuetto (ALn 501) middle section", kind: "emu" },
  itTafCab: { name: "TAF end car", kind: "bilevel", emu: true },
  itTafMid: { name: "TAF car", kind: "bilevel", emu: true },
  itSwingCab: { name: "Swing (ATR 220) end section", kind: "emu" },
  itSwingMid: { name: "Swing (ATR 220) middle section", kind: "emu" },
  itFlirt350Cab: { name: "FLIRT (ETR 350) end section", kind: "emu" },
  itFlirt350Mid: { name: "FLIRT (ETR 350) section", kind: "emu" },
};

// The paint goes by railroad and route (Leonardo Express, the night
// trains, InterCity's or the regional E.464s), so a drawing is kept per
// place in the train and per route.
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => `${ctx.index}:${ctx.route || ""}`;
const byRoute = (ctx) => ctx.route || "";
export const MODELS = {
  itFr1000Exec: M((c) => fr4Cab({ ...c, lv: "executive" }), 87.3, true),
  itFr1000Business: M((c) => fr4Mid({ ...c, lv: "business" }), 81.7, false, byIndex),
  itFr1000Bistro: M((c) => fr4Mid({ ...c, lv: "bistro" }), 81.7, false, byIndex),
  itFr1000Premium: M((c) => fr4Mid({ ...c, lv: "premium" }), 81.7, false, byIndex),
  itFr1000Mid: M(fr4Mid, 81.7, false, byIndex),
  itFr1000Cab: M(fr4Cab, 87.3, true),
  itE404: M(e404, 67.5, true),
  itEtr500Exec: M((c) => etr500Coach({ ...c, lv: "executive" }), 85.6, false, byIndex),
  itEtr500Business: M((c) => etr500Coach({ ...c, lv: "business" }), 85.6, false, byIndex),
  itEtr500Bistro: M((c) => etr500Coach({ ...c, lv: "bistro" }), 85.6, false, byIndex),
  itEtr500Premium: M((c) => etr500Coach({ ...c, lv: "premium" }), 85.6, false, byIndex),
  itEtr500Coach: M(etr500Coach, 85.6, false, byIndex),
  itEtr700CabBiz: M((c) => etr700Cab({ ...c, lv: "business" }), 88.4, true),
  itEtr700Business: M((c) => etr700Mid({ ...c, lv: "business" }), 80.4, false, byIndex),
  itEtr700Premium: M((c) => etr700Mid({ ...c, lv: "premium" }), 80.4, false, byIndex),
  itEtr700Mid: M(etr700Mid, 80.4, false, byIndex),
  itEtr700Cab: M(etr700Cab, 88.4, true),
  itEtr600CabBiz: M((c) => etr600Cab({ ...c, lv: "business" }), 92.5, true),
  itEtr600Business: M((c) => etr600Mid({ ...c, lv: "business" }), 86.0, false, byIndex),
  itEtr600Bistro: M((c) => etr600Mid({ ...c, lv: "bistro" }), 86.0, false, byIndex),
  itEtr600Premium: M((c) => etr600Mid({ ...c, lv: "premium" }), 86.0, false, byIndex),
  itEtr600Mid: M(etr600Mid, 86.0, false, byIndex),
  itEtr600Cab: M(etr600Cab, 92.5, true),
  itEtr485CabFirst: M((c) => etr485Cab({ ...c, lv: "first" }), 90.2, true, byRoute),
  itEtr485First: M((c) => etr485Mid({ ...c, lv: "first" }), 83.0, false, byIndex),
  itEtr485Bar: M((c) => etr485Mid({ ...c, lv: "bar" }), 83.0, false, byIndex),
  itEtr485Mid: M(etr485Mid, 83.0, false, byIndex),
  itEtr485Cab: M(etr485Cab, 90.2, true, byRoute),
  itE414: M(e414, 66.4, true, byRoute),
  itE401: M(e401, 60.5, true, byRoute),
  itE402B: M(e402b, 63.7, false, byRoute),
  itE464: M(e464, 51.7, true, byRoute),
  itIcFirst: M(icFirst, 86.6, false, byRoute),
  itIcCoach: M(icCoach, 86.6, false, byRoute),
  itIcCab: M(icCab, 86.6, true, byRoute),
  itIcnCouchette: M(icCouchette, 86.6, false, byRoute),
  itIcnSleeper: M(icSleeper, 86.6, false, byRoute),
  itMasCab: M(masCab, 75.5, true),
  itMasMid: M(masMid, 66.0, false, byIndex),
  itHtrPlus: M((c) => masCab({ ...c, lv: "first" }), 75.5, true),
  itRockCab: M(rockCab, 92.0, true),
  itRockMid: M(rockMid, 87.6, false, byIndex),
  itPopCab: M(popCab, 72.0, true),
  itPopMid: M(popMid, 66.2, false, byIndex),
  itJazzCab: M(jazzCab, 60.0, true),
  itJazzMid: M(jazzMid, 49.9, false, byIndex),
  itLxCab: M(lxCab, 60.0, true),
  itLxMid: M(lxMid, 49.9, false, byIndex),
  itVivalto: M(vivalto, 85.5),
  itVivaltoMixed: M((c) => vivalto({ ...c, lv: "first" }), 85.5),
  itVivaltoCab: M(vivaltoCab, 85.5, true),
  itMinElFirst: M((c) => minCab(false)({ ...c, lv: "first" }), 63.0, true),
  itMinElCab: M(minCab(false), 63.0, true),
  itMinElMid: M(minMid(false), 44.3),
  itMinDFirst: M((c) => minCab(true)({ ...c, lv: "first" }), 63.0, true),
  itMinDCab: M(minCab(true), 63.0, true),
  itMinDMid: M(minMid(true), 44.3),
  itTafCab: M(tafCab, 85.6, true),
  itTafMid: M(tafMid, 85.0),
  itSwingCab: M(swingCab, 64.0, true),
  itSwingMid: M(swingMid, 54.4),
  itFlirt350Cab: M(tperFlirtCab, 70.5, true),
  itFlirt350Mid: M(tperFlirtMid, 51.5, false, byIndex),
};

// [first, last, type], by class and serial run together (ETR 400 001 is
// 400001). The fleet pages draw one of each; no timetable reports a unit.
export const FLEETS = {
  frecce: [[400001, 400058, "itFr1000Exec"], [404500, 404659, "itE404"], [700001, 700017, "itEtr700CabBiz"], [600001, 600012, "itEtr600CabBiz"], [485001, 485015, "itEtr485CabFirst"]],
  trenitaliaic: [[401001, 401040, "itE401"], [402101, 402180, "itE402B"], [414101, 414159, "itE414"], [464001, 464717, "itE464"], [412001, 412011, "itHtrPlus"]],
  trenitaliareg: [[521001, 521099, "itRockCab"], [104001, 104099, "itPopCab"], [425001, 425099, "itJazzCab"], [312001, 312099, "itMasCab"],
    [501001, 501100, "itMinElFirst"], [501101, 501204, "itMinDFirst"], [426001, 426060, "itTafCab"], [220001, 220040, "itSwingCab"]],
  tper: [[350001, 350026, "itFlirt350Cab"], [521101, 521143, "itRockCab"], [104101, 104147, "itPopCab"]],
};

const set = (label, ...units) => ({ label, units });
// Car 1 leads: the Frecce's cars are numbered from the Executive (or
// Business) end.
const FR1000 = set("Frecciarossa 1000: Executive (car 1), Business (2, and 3 with the bistro), Premium (4), Standard (5–8)",
  ["itFr1000Exec", 1], ["itFr1000Business", 1], ["itFr1000Bistro", 1], ["itFr1000Premium", 1], ["itFr1000Mid", 3], ["itFr1000Cab", 1]);
const ETR500 = set("ETR 500: E.404 power cars; Executive and Business (coach 1), Business (2–4, and 5 with the bistro), Premium (6), Standard (7–11)",
  ["itE404", 1], ["itEtr500Exec", 1], ["itEtr500Business", 3], ["itEtr500Bistro", 1], ["itEtr500Premium", 1], ["itEtr500Coach", 5], ["itE404", 1]);
const ETR700 = set("ETR 700: Business (cars 1–3), Premium (4), Standard (5–8)", ["itEtr700CabBiz", 1], ["itEtr700Business", 2], ["itEtr700Premium", 1], ["itEtr700Mid", 3], ["itEtr700Cab", 1]);
const ETR600 = set("ETR 600: Business (cars 1–2, and 3 with the bar), Premium and Standard (4–7)",
  ["itEtr600CabBiz", 1], ["itEtr600Business", 1], ["itEtr600Bistro", 1], ["itEtr600Premium", 1], ["itEtr600Mid", 2], ["itEtr600Cab", 1]);
const ETR485 = (name) => set(`${name}: an ETR 485, nine tilting cars, first class in three`,
  ["itEtr485CabFirst", 1], ["itEtr485First", 2], ["itEtr485Bar", 1], ["itEtr485Mid", 4], ["itEtr485Cab", 1]);
const IC_DAY = set("InterCity: an E.401 (or E.414), a first-class coach, second-class coaches and a driving coach", ["itE401", 1], ["itIcFirst", 1], ["itIcCoach", 6], ["itIcCab", 1]);
const IC_414 = set("InterCity: an E.414, a first-class coach, second-class coaches and a driving coach", ["itE414", 1], ["itIcFirst", 1], ["itIcCoach", 6], ["itIcCab", 1]);
const IC_464 = set("InterCity: an E.464, a first-class coach and second-class coaches", ["itE464", 1], ["itIcFirst", 1], ["itIcCoach", 5]);
const HTR412 = set("InterCity: a four-car Hitachi HTR 412, Plus (first class) in the leading car", ["itHtrPlus", 1], ["itMasMid", 2], ["itMasCab", 1]);
const ICN = set("InterCity Notte: an E.402B, seated coaches, couchettes and sleeping cars", ["itE402B", 1], ["itIcCoach", 3], ["itIcnCouchette", 4], ["itIcnSleeper", 2]);
const ICN_BEDS = set("InterCity Notte: an E.402B, couchettes and sleeping cars", ["itE402B", 1], ["itIcnCouchette", 5], ["itIcnSleeper", 3]);
const ROCK5 = set("Rock: a five-car double-deck electric unit", ["itRockCab", 1], ["itRockMid", 3], ["itRockCab", 1]);
const POP = set("Pop: a four-car electric unit", ["itPopCab", 1], ["itPopMid", 2], ["itPopCab", 1]);
const JAZZ = set("Jazz: a five-section electric unit", ["itJazzCab", 1], ["itJazzMid", 3], ["itJazzCab", 1]);
const LEONARDO = set("Leonardo Express: a Jazz unit in the airport train's paint", ["itLxCab", 1], ["itLxMid", 3], ["itLxCab", 1]);
const VIVALTO = set("An E.464, Vivalto double-deck coaches (one with first class upstairs) and a driving car", ["itE464", 1], ["itVivalto", 2], ["itVivaltoMixed", 1], ["itVivalto", 2], ["itVivaltoCab", 1]);
const MIN_D = set("Minuetto: a three-section diesel unit, 24 first-class seats in the ALn 501 end", ["itMinDFirst", 1], ["itMinDMid", 1], ["itMinDCab", 1]);
const MIN_E = set("Minuetto: a three-section electric unit, 24 first-class seats in the ALe 501 end", ["itMinElFirst", 1], ["itMinElMid", 1], ["itMinElCab", 1]);
const TAF = set("TAF: a four-car double-deck electric unit", ["itTafCab", 1], ["itTafMid", 2], ["itTafCab", 1]);
const SWING = set("Swing (ATR 220): a three-section diesel unit", ["itSwingCab", 1], ["itSwingMid", 1], ["itSwingCab", 1]);
const BLUES = set("Blues: a three-car Hitachi unit (electric, diesel and battery)", ["itMasCab", 1], ["itMasMid", 1], ["itMasCab", 1]);
const FLIRT = set("FLIRT (ETR 350): a five-section electric unit", ["itFlirt350Cab", 1], ["itFlirt350Mid", 3], ["itFlirt350Cab", 1]);
const TPER_ROCK = set("Rock: a five-car double-deck electric unit, in Tper's paint", ["itRockCab", 1], ["itRockMid", 3], ["itRockCab", 1]);
const TPER_POP = set("Pop: a four-car electric unit, in Tper's paint", ["itPopCab", 1], ["itPopMid", 2], ["itPopCab", 1]);
// The formation a reported unit runs in (the fleet pages draw these).
const BY_MODEL = { itFr1000Cab: FR1000, itFr1000Exec: FR1000, itEtr700CabBiz: ETR700, itEtr600CabBiz: ETR600, itEtr485CabFirst: ETR485("Frecciargento"), itHtrPlus: HTR412,
  itMinElFirst: MIN_E, itMinDFirst: MIN_D, itE404: ETR500, itEtr700Cab: ETR700, itEtr600Cab: ETR600, itEtr485Cab: ETR485("Frecciargento"),
  itE401: IC_DAY, itE414: IC_414, itE402B: ICN, itE464: IC_464, itRockCab: ROCK5, itPopCab: POP, itJazzCab: JAZZ, itMinElCab: MIN_E, itMinDCab: MIN_D,
  itTafCab: TAF, itSwingCab: SWING, itFlirt350Cab: FLIRT, itVivaltoCab: VIVALTO };
const byModel = (agency, reported) => (reported === "itMasCab" ? (agency === "trenitaliaic" ? HTR412 : BLUES)
  : reported === "itE464" && agency !== "trenitaliaic" ? VIVALTO : agency === "tper" && reported === "itRockCab" ? TPER_ROCK : agency === "tper" && reported === "itPopCab" ? TPER_POP : BY_MODEL[reported]);

const ends = (t) => `${t.origin || ""} | ${t.destination || ""}`;
const between = (t, a, b) => a.test(ends(t)) && b.test(ends(t));
const num = (t) => Number(String(t.number || "").replace(/\D/g, "")) || 0;
// Where a placed train is, for the regional fleets that differ by region.
const near = (t, lat, lon, r) => Number.isFinite(t.lat) && Number.isFinite(t.lon) && Math.hypot(t.lat - lat, (t.lon - lon) * 0.75) < r;
const sardinia = (t) => Number.isFinite(t.lat) && t.lat > 38.8 && t.lat < 41.3 && t.lon > 8.0 && t.lon < 9.9;
const sicily = (t) => Number.isFinite(t.lat) && t.lat > 36.6 && t.lat < 38.35 && t.lon > 12.3 && t.lon < 15.7;

// What usually runs, by category, number and line (Trenitalia's service
// patterns as Wikipedia and the trade press summarize them; the day's
// workings vary, so the labels are "typical"). Frecciarossa: the main
// corridors' 9500-9799 trains Frecciarossa 1000s, the Adriatic's 8000s ETR
// 700s, the others ETR 500s. Frecciargento and Frecciabianca: ETR 485s.
// InterCity: Taranto-Reggio Calabria and Bari-Naples Hitachi HTR 412s; the
// others push-pull trains, drawn with an E.401 (E.414s share the work;
// no published rule says which runs which train);
// InterCity Notte (750-799 with seats, 1500-1999 berths only) an E.402B.
// Regionale: Leonardo Express a Jazz in its paint; Sardinia's and Sicily's
// trains Minuetto diesels; around Naples and Turin TAFs; Regionale Veloce an
// E.464 with Vivalto coaches; the others a Rock.
export const TYPICAL = {
  frecce: (t, reported) => {
    if (byModel(t.agency, reported)) return byModel(t.agency, reported);
    const r = t.route || "", n = num(t);
    if (r === "Frecciargento" || r === "Frecciabianca") return ETR485(r);
    if (r !== "Frecciarossa") return null;
    if (n >= 9500 && n <= 9799) return FR1000;
    if (n >= 8000 && n <= 8999) return ETR700;
    return ETR500;
  },
  trenitaliaic: (t, reported) => {
    if (byModel(t.agency, reported)) return byModel(t.agency, reported);
    const r = t.route || "", n = num(t);
    if (r === "Intercity Notte") return n >= 1500 && n <= 1999 ? ICN_BEDS : ICN;
    if (r !== "Intercity") return null;
    if (between(t, /Taranto/, /Reggio/) || between(t, /Bari/, /Napoli/)) return HTR412;
    return IC_DAY;
  },
  trenitaliareg: (t, reported) => {
    if (byModel(t.agency, reported)) return byModel(t.agency, reported);
    const r = t.route || "";
    if (/Leonardo/.test(r) || between(t, /Fiumicino Aeroporto/, /Roma Termini/)) return LEONARDO;
    if (sardinia(t) || sicily(t)) return MIN_D;
    if (r === "Regionale Veloce") return VIVALTO;
    if (near(t, 40.85, 14.27, 0.35) || near(t, 45.07, 7.68, 0.35)) return TAF;
    return ROCK5;
  },
  // Tper: FLIRTs on the Bologna suburban lines to Portomaggiore and
  // Vignola, Rocks on the Regionale Veloce, Pops on the other trains.
  tper: (t, reported) => {
    if (byModel(t.agency, reported)) return byModel(t.agency, reported);
    if (/Portomaggiore|Vignola/.test(ends(t))) return FLIRT;
    return t.route === "Regionale Veloce" ? TPER_ROCK : TPER_POP;
  },
};

// Fact sheets in data/models.json's units (mph, hp, ft), from the
// published km/h, kW and m.
const WP = "https://en.wikipedia.org/wiki/";
const ITW = "https://it.wikipedia.org/wiki/";
const mph = (k) => Math.round(k * 0.6214 * 10) / 10, hp = (kw) => Math.round(kw * 1.341), ft = (m) => Math.round(m * 3.281 * 10) / 10;
const FR1000_F = { model: "Frecciarossa 1000 (ETR 400)", type: "High-speed electric multiple unit", builder: "Bombardier and AnsaldoBreda (now Alstom and Hitachi Rail)", built: "Since 2013",
  fleet: "58 of the first series; 74 of a new generation from 2025", topSpeedMph: mph(300), powerHp: hp(9800), seats: 457, lengthFt: ft(202), source: `${ITW}ETR_1000` };
const ETR500_F = { model: "ETR 500", type: "High-speed train", builder: "TREVI consortium, styled by Pininfarina", built: "1992–2005", fleet: "59 sets",
  topSpeedMph: mph(300), powerHp: hp(8800), seats: 574, source: `${ITW}Elettrotreno_FS_ETR_500` };
const FS_700 = "https://fsitaliane.it/content/dam/fsitaliane/Documents/old-media-ed-eventi/comunicati-stampa-e-news/anno-2019/giugno/2019_06_03_ETR_700.pdf";
const ETR700_F = { model: "ETR 700", type: "High-speed electric multiple unit", builder: "AnsaldoBreda, styled by Pininfarina", built: "2009–2012 (as the Fyra V250)", fleet: "17",
  topSpeedMph: mph(250), powerHp: hp(5500), seats: 497, lengthFt: ft(200.9), source: `${ITW}ETR_700` };
const ETR600_F = { model: "ETR 600 (New Pendolino)", type: "Tilting electric multiple unit", builder: "Alstom (Savigliano), styled by Giugiaro", built: "2006–2008", fleet: "12",
  topSpeedMph: mph(250), powerHp: hp(5664), seats: 432, lengthFt: ft(187.4), source: `${ITW}Elettrotreno_FS_ETR_600` };
const ETR485_F = { model: "ETR 485", type: "Tilting electric multiple unit", builder: "Fiat Ferroviaria (Alstom)", built: "Converted 2005–2009", fleet: "15, being retired",
  topSpeedMph: mph(250), powerHp: hp(5880), seats: 489, source: `${ITW}Elettrotreno_FS_ETR_485` };
const Z1_F = { model: "UIC-Z1 coach", type: "Passenger coach", builder: "Casaralta and others", built: "Since 1985", fleet: "About 990", topSpeedMph: mph(200), lengthFt: ft(26.4),
  source: `${ITW}Carrozza_UIC-Z1` };
const MAS_F = { model: "Hitachi Masaccio (HTR 312 and HTR 412)", type: "Tri-mode multiple unit (3 kV, diesel, battery)", builder: "Hitachi Rail", built: "Since 2022", topSpeedMph: mph(160),
  source: `${ITW}Hitachi_Blues` };
const ROCK_F = { model: "Rock (Hitachi Caravaggio: ETR 421, 521, 621)", type: "Double-deck electric multiple unit", builder: "Hitachi Rail", built: "Since 2019", topSpeedMph: mph(160), powerHp: hp(3400),
  seats: 598, lengthFt: ft(136.8), source: `${ITW}ETR_521` };
const POP_F = { model: "Pop (Alstom Coradia Stream: ETR 103, 104)", type: "Electric multiple unit", builder: "Alstom", built: "Since 2019", topSpeedMph: mph(160), seats: 305, lengthFt: ft(84.2),
  source: `${ITW}ETR_104` };
const JAZZ_F = { model: "Jazz (Alstom Coradia Meridian: ETR 324, 425, 526)", type: "Articulated electric multiple unit", builder: "Alstom", built: "2013–2019", topSpeedMph: mph(160), powerHp: hp(2052),
  seats: 309, lengthFt: ft(82.2), source: `${ITW}ETR_425` };
const MIN_F = { model: "Minuetto", type: "Articulated multiple unit", builder: "Alstom (Fiat Ferroviaria), styled by Giugiaro", built: "2004–2010", seats: 146, lengthFt: ft(51.9), source: `${ITW}Minuetto_(treno)` };
const TAF_F = { model: "TAF (ALe 426 / Le 736 / ALe 506)", type: "Double-deck electric multiple unit", builder: "AnsaldoBreda, Firema and Fiat Ferroviaria", built: "1997–2006",
  topSpeedMph: mph(140), powerHp: hp(3640), seats: 469, lengthFt: ft(104), source: `${ITW}TAF_(treno)` };
const SWING_F = { model: "Swing (Pesa ATR 220)", type: "Articulated diesel multiple unit", builder: "Pesa Bydgoszcz", built: "2014–2016", fleet: "40", seats: 155, lengthFt: ft(55.6),
  source: `${ITW}ATR_220` };
const VIV_F = { model: "Vivalto", type: "Double-deck coach", builder: "AnsaldoBreda and Firema (later Hitachi Rail)", built: "Since 2004", topSpeedMph: mph(160), lengthFt: ft(26.06), source: `${ITW}Carrozza_Vivalto` };
const FLIRT_F = { model: "Stadler FLIRT (ETR 350)", type: "Electric multiple unit", builder: "Stadler Rail", fleet: "26", topSpeedMph: mph(160), seats: 269, source: `${WP}Stadler_FLIRT` };

export const FACTS = {
  itFr1000Exec: { ...FR1000_F, about: "Trenitalia's flagship, styled by Bertone: eight cars, four of them powered, and four pantographs for Italy's 25 kV high-speed lines and its 3 kV older ones. Car 1, at one end, is the Executive car: 10 armchairs (14 in the second series) and a meeting room." },
  itFr1000Business: { ...FR1000_F, about: "Cars 2 and 3 are Business, first class, 2+1 leather seats; car 3 shares its length with the bistro." },
  itFr1000Bistro: { ...FR1000_F, about: "Car 3: Business seats and the bistro, the train's bar." },
  itFr1000Premium: { ...FR1000_F, about: "Car 4 is Premium, second class with leather seats and a snack served at the seat." },
  itFr1000Mid: { ...FR1000_F, about: "Cars 5 to 8 are Standard, second class, 2+2 seats; the train seats 457 in all (461 in the second series)." },
  itFr1000Cab: { ...FR1000_F, about: "Car 8, the Standard end car. The Frecciarossa 1000 runs the Turin–Milan–Rome–Naples–Salerno and Venice–Rome Frecciarossas, and to France and Spain." },
  itFr1000Mid: { ...FR1000_F, about: "A Frecciarossa 1000 has Executive, Business, Premium and Standard areas and a bar car in the middle of the train." },
  itE404: { model: "E.404 power car (ETR 500)", type: "Electric power car", builder: "TREVI consortium", built: "1992–2005", topSpeedMph: mph(300), lengthFt: ft(20.57), source: `${ITW}Elettrotreno_FS_ETR_500`,
    about: "An ETR 500 is two E.404 power cars with eleven or twelve coaches between them, about 327 m long. In Frecciarossa paint since 2022, it runs many of the Frecciarossas off the main Turin–Salerno corridor." },
  itEtr500Exec: { ...ETR500_F, lengthFt: ft(26.1), about: "Coach 1, next to a power car: the Executive area and a meeting room, then Business Silenzio. Executive and Business are first class." },
  itEtr500Business: { ...ETR500_F, lengthFt: ft(26.1), about: "Coaches 2 to 4 are Business, first class (coach 3 with a small lounge)." },
  itEtr500Bistro: { ...ETR500_F, lengthFt: ft(26.1), about: "Coach 5: Business seats and the bistro." },
  itEtr500Premium: { ...ETR500_F, lengthFt: ft(26.1), about: "Coach 6 is Premium, second class with leather seats." },
  itEtr500Coach: { ...ETR500_F, lengthFt: ft(26.1), about: "Coaches 7 to 11 are Standard, second class; a power car at each end drives the train, 574 seats in all." },
  itEtr700CabBiz: { ...ETR700_F, source: FS_700, about: "Built as the V250 for the Fyra service between Amsterdam and Brussels, bought by Trenitalia in 2016 and a Frecciarossa since 2022. Cars 1 to 3 are Business (first class, 2+1 seats), car 4 Premium, cars 5 to 8 Standard." },
  itEtr700Cab: { ...ETR700_F, source: FS_700, about: "Car 8, a Standard end car. The ETR 700 runs mainly on the Adriatic line." },
  itEtr700Business: { ...ETR700_F, source: FS_700, about: "Cars 2 and 3 are Business, first class, 2+1 seats." },
  itEtr700Premium: { ...ETR700_F, source: FS_700, about: "Car 4 is Premium, second class with leather seats, 2+2." },
  itEtr700Mid: { ...ETR700_F, source: FS_700, about: "Cars 5 to 7 are Standard, second class; about 500 seats in the train." },
  itEtr600CabBiz: { ...ETR600_F, about: "Alstom's second-generation Italian Pendolino, built for 250 km/h with tilt; a Frecciarossa since 2022. Business, first class, has 126 of its 432 seats, in the cars at this end up to the bar in car 3." },
  itEtr600Cab: { ...ETR600_F, about: "The Standard end car; Premium and Standard together have 306 seats." },
  itEtr600Business: { ...ETR600_F, about: "A Business car, first class, three seats across (rows A, B and D)." },
  itEtr600Bistro: { ...ETR600_F, about: "Car 3: half seats, half the bar, and the conductor's office." },
  itEtr600Premium: { ...ETR600_F, about: "Premium, second class with leather seats; which car carries it isn't published, so it is drawn next to the bar." },
  itEtr600Mid: { ...ETR600_F, about: "Standard, second class, four seats across." },
  itEtr485CabFirst: { ...ETR485_F, about: "The last Frecciargento trains, Rome–Ravenna and Rome–Benevento, and since summer 2026 the Frecciabianca between Rome, Pisa and Genoa. First class has 146 of the 489 seats, about three cars' worth, drawn at this end." },
  itEtr485First: { ...ETR485_F, about: "First class, 2+1 seats." },
  itEtr485Bar: { ...ETR485_F, about: "The bar car, between first and second class." },
  itEtr485Cab: { ...ETR485_F, about: "The second-class end car; second class has 344 seats." },
  itEtr485Mid: { ...ETR485_F, about: "Second class, 2+2 seats. The ETR 485 tilts into curves on the old lines; Trenitalia is retiring the fleet." },
  itE414: { model: "E.414", type: "Electric locomotive", builder: "TREVI consortium; rebuilt by Trenitalia", fleet: "59", topSpeedMph: mph(200), powerHp: hp(4400), lengthFt: ft(20.25),
    source: `${ITW}Locomotiva_FS_E.414`, about: "The ETR 500's first power cars, rebuilt as locomotives for 200 km/h. Once the Frecciabianca's, they have hauled InterCity trains since 2020–22." },
  itE401: { model: "E.401", type: "Electric locomotive", builder: "Rebuilt by Trenitalia from E.402A", built: "Rebuilt 2015–2019", fleet: "40", topSpeedMph: mph(200), powerHp: hp(6000), lengthFt: ft(18.44),
    source: `${ITW}Locomotiva_FS_E.401`, about: "E.402As rebuilt with a single cab for InterCity push-pull trains, with a driving coach at the far end." },
  itE402B: { model: "E.402B", type: "Electric locomotive", builder: "Ansaldo, Breda, Fiat Ferroviaria and others", built: "1996–2000", fleet: "About 80", topSpeedMph: mph(200), powerHp: hp(5600), lengthFt: ft(19.42),
    source: `${ITW}Locomotiva_FS_E.402`, about: "A two-cab locomotive; today it hauls mainly the InterCity Notte night trains." },
  itE464: { model: "E.464", type: "Electric locomotive", builder: "Bombardier (ADtranz), Vado Ligure", built: "1999–2014", fleet: "717", topSpeedMph: mph(160), powerHp: hp(3500), lengthFt: ft(15.75),
    source: `${ITW}Locomotiva_FS_E.464`, about: "Italy's most numerous locomotive: one cab, a luggage space at the blind end. It works the Vivalto double-deck push-pull trains and many InterCitys." },
  itIcFirst: { ...Z1_F, seats: 54, about: "First class: nine six-seat compartments (54 seats), or an open saloon of 2+1 seats in rebuilt coaches; Trenitalia now sells it as IC Plus. Usually one or two to a train." },
  itIcCoach: { ...Z1_F, seats: 75, about: "Second class (IC Easy): an open saloon of 75 seats, or 66 in compartments, rebuilt with new interiors and, from 2024, painted white and light blue." },
  itIcCab: { ...Z1_F, model: "UIC-Z1 driving coach (Z1a)", type: "Driving coach", seats: 64, about: "Second-class Z1 coaches converted since 2017 with a cab at one end, so that an E.401 or E.414 InterCity runs push-pull." },
  itIcnCouchette: { ...Z1_F, model: "Couchette car", type: "Couchette car", fleet: null, about: "InterCity Notte's couchettes, four or six berths to a compartment, on the night trains from the north to Rome, Calabria, Sicily and Apulia. New cars from Škoda and Titagarh Firema are due." },
  itIcnSleeper: { ...Z1_F, model: "Sleeping car (MU)", type: "Sleeping car", fleet: null, about: "Sleeping cars with one to three beds to a compartment; the trains to Sicily cross the Strait of Messina on a ferry." },
  itMasCab: { ...MAS_F, fleet: "109 Blues; 11 HTR 412 for InterCity", seats: 219, lengthFt: ft(66.88), about: "Hitachi's regional unit runs under the wires, on its diesels or on its batteries. The Blues runs in Tuscany, Sicily, Calabria, Sardinia, Friuli Venezia Giulia and elsewhere, second class only." },
  itHtrPlus: { ...MAS_F, model: "Hitachi Masaccio (HTR 412), InterCity", fleet: "11 (7 tri-mode, 4 electric)", lengthFt: ft(86.1), source: "https://siviaggia.it/notizie/trenitalia-intercity-novita-2025/486754/",
    about: "Four articulated cars in InterCity paint, on Taranto–Reggio Calabria, Bari–Naples and Bari–Rome, with IC Plus (first class) and IC Easy seats: 52 Plus and 74 Easy reported. Plus is drawn in the leading car." },
  "itMasCab@trenitaliaic": { ...MAS_F, model: "Hitachi Masaccio (HTR 412), InterCity", fleet: "11 (7 tri-mode, 4 electric)", lengthFt: ft(86.1),
    about: "Four articulated cars in InterCity paint, on Taranto–Reggio Calabria, Bari–Naples and Bari–Rome." },
  itMasMid: { ...MAS_F, about: "The cars share Jakobs trucks; the diesel generator sets and the batteries hang under the floor." },
  itRockCab: { ...ROCK_F, about: "Hitachi's double-deck regional train in four-, five- and six-car versions, second class only. Since 2024 Trenitalia drops the Rock name for Regionale and repaints its trains in two greens." },
  itRockMid: { ...ROCK_F, about: "Each car rides on its own trucks, with the stairs over them; the electrical gear is on the roof." },
  "itRockCab@tper": { ...ROCK_F, fleet: "43 with Tper", about: "Tper's Rocks run Emilia-Romagna's busiest regional trains." },
  itPopCab: { ...POP_F, about: "Alstom's single-deck regional train, in three-car (ETR 103) and four-car (ETR 104) versions, second class only (Trenord's ETR 204s have a small first-class area)." },
  itPopMid: { ...POP_F, about: "A Pop's intermediate car; the four-car units seat about 300." },
  "itPopCab@tper": { ...POP_F, fleet: "47 with Tper", about: "Tper runs Pops on Emilia-Romagna's regional lines." },
  itJazzCab: { ...JAZZ_F, about: "Alstom's low-floor articulated train, the regional mainstay before the Rock and Pop, one class throughout." },
  itJazzMid: { ...JAZZ_F, about: "The sections share Jakobs trucks; a low floor runs through the whole train." },
  itLxCab: { ...JAZZ_F, model: "Leonardo Express (Jazz, ETR 425)", seats: 253, about: "The non-stop train between Roma Termini and Fiumicino airport, run with Jazz units in their own white, green and red: one class, 253 seats in the airport version. It began with first-class-only coaches behind an E.464." },
  itLxMid: { ...JAZZ_F, model: "Leonardo Express (Jazz, ETR 425)", about: "The Leonardo Express has one class, with luggage space in each section." },
  itVivalto: { ...VIV_F, seats: 126, about: "The double-deck regional coach, hauled by an E.464 with a driving car at the other end and three to six coaches between; second class, 126 seats." },
  itVivaltoMixed: { ...VIV_F, about: "Since 2016 some Vivaltos have first class on the upper deck and second downstairs; the first series had all-first coaches of 90 seats, three across." },
  itVivaltoCab: { ...VIV_F, seats: 92, about: "The Vivalto driving car's cab copies the E.464's nose, so the train looks alike at both ends." },
  itMinElFirst: { ...MIN_F, model: "Minuetto (ALe 501, electric)", fleet: "About 100", topSpeedMph: mph(160), powerHp: hp(1250), about: "Giugiaro's three-section regional train. Its 24 first-class seats are in this end section, the 501; the train has 122 second-class seats." },
  itMinElCab: { ...MIN_F, model: "Minuetto (ALe 502, electric)", fleet: "About 100", topSpeedMph: mph(160), powerHp: hp(1250), about: "The other end section, the 502, second class." },
  itMinElMid: { ...MIN_F, model: "Minuetto (ALe 501/502, electric)", about: "The middle section carries the pantograph." },
  itMinDFirst: { ...MIN_F, model: "Minuetto (ALn 501, diesel)", fleet: "About 104", topSpeedMph: mph(130), powerHp: hp(1120), about: "The diesel Minuetto runs much of Sardinia's and Sicily's network. Its 24 first-class seats are in this end section, the 501." },
  itMinDCab: { ...MIN_F, model: "Minuetto (ALn 502, diesel)", fleet: "About 104", topSpeedMph: mph(130), powerHp: hp(1120), about: "The other end section, the 502, second class; an engine under each end section." },
  itMinDMid: { ...MIN_F, model: "Minuetto (ALn 501/502, diesel)", about: "The three sections share their trucks at the joints." },
  itTafCab: { ...TAF_F, about: "The 'high-capacity train' built for the Rome and Milan suburban lines, double-deck between the trucks, second class only; it runs around Naples and Turin (and with Trenord in Milan)." },
  itTafMid: { ...TAF_F, about: "A TAF's middle cars (Le 736) are unpowered; the motor cars are at the ends." },
  itSwingCab: { ...SWING_F, about: "A Polish diesel unit for the regional lines without wires in Tuscany, Abruzzo, Calabria, the Marche and Veneto; 155 seats, second class." },
  itSwingMid: { ...SWING_F, about: "The Swing's middle section; an engine sits under each end section." },
  itFlirt350Cab: { ...FLIRT_F, about: "Tper's FLIRTs run Bologna's suburban lines to Portomaggiore and Vignola." },
  itFlirt350Mid: { ...FLIRT_F, about: "Five sections on shared trucks, with 269 seats and 77 tip-up seats." },
  "coach@trenitaliaic": { ...Z1_F, about: "InterCity's UIC-Z1 coaches." },
};
