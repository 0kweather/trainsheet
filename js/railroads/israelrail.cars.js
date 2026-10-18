// Israel Railways' cars (scripts/railroads/israelrail.py): Siemens Desiro
// HC electric units and push-pull trains of Bombardier double-deck coaches
// behind TRAXX electric or diesel locomotives. The SIRI feed's vehicle ref is
// the train number, not a unit, so every train is drawn as what usually runs
// on its line. Trainsheet's own side views, from published dimensions and
// photographs; liveries simplified.
import { newId, bilevel } from "../carmodels.js?v=dev";
import { C, rect, path, poly, win, door, truck, pantograph, slats, underframe } from "../carart.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);

// White over Israel Railways blue, red doors.
const IR = { white: "#f2f3f5", blue: "#24398f", navy: "#1a2a6c", red: "#e1402c", roof: "#b3b9c0", skirt: "#3a3e44" };

// A locomotive's body, a cab at each end, which the carmodels.js builders
// can't shape: the outline filled, its livery clipped to it and shaded like
// the built-in drawings.
function shell(d, base, liv) {
  const id = newId();
  const shade = `<linearGradient id="${id}-s" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="14">` +
    '<stop offset="0.2" stop-color="#000" stop-opacity="0.16" style="stop-opacity:var(--car-shade-low,0.16)"/><stop offset="0.45" stop-color="#000" stop-opacity="0"/>' +
    '<stop offset="0.6" stop-color="#fff" stop-opacity="0"/><stop offset="0.85" stop-color="#fff" stop-opacity="0.1" style="stop-opacity:var(--car-shade-high,0.1)"/>' +
    '<stop offset="1" stop-color="#000" stop-opacity="0.08" style="stop-opacity:var(--car-shade-roof,0.08)"/></linearGradient>';
  return path(d, base) + `<clipPath id="${id}"><path d="${d}"/></clipPath><defs>${shade}</defs>` +
    `<g clip-path="url(#${id})">${liv}<rect x="-5" y="0" width="200" height="16" fill="url(#${id}-s)"/></g>` + path(d, "none", 0.8);
}
const buffers = (x, side, y = 3.4) => rect(side < 0 ? x : x - 1.1, y - 0.45, 1.1, 0.9, "currentColor", 0, 'rx="0.2"') +
  rect(side < 0 ? x : x - 0.25, y - 0.7, 0.25, 1.4, "currentColor");
const grille = (x, y, w, h) => rect(x, y, w, h, "rgba(20,22,25,0.5)", 0.4) + slats(x, y, w, h, 0.4, "rgba(255,255,255,0.18)");

// A four-axle locomotive with a cab at each end: raked windshields, the
// livery, cab side windows and doors, side grilles, buffers.
function loco(c, { roof, sill = 4.0, rake, grilles, pan = false, tank = false, centers, d = 40 }) {
  const { L } = c;
  const d0 = poly([[0.8, sill], [L - 0.8, sill], [L - 0.8, 9.4], [L - rake, roof - 0.5], ["q", L - rake - 0.3, roof, L - rake - 1.2, roof],
    [rake + 1.2, roof], ["q", rake + 0.3, roof, rake, roof - 0.5], [0.8, 9.4]]);
  let s = truck(L / 2 - centers / 2, { wb: 8.5, d, kind: "loco", top: sill }) + truck(L / 2 + centers / 2, { wb: 8.5, d, kind: "loco", top: sill });
  if (tank) s += rect(L / 2 - 9, 1.7, 18, sill - 1.7, "currentColor", 0, 'opacity="0.82" rx="0.6"');
  let liv = rect(0, 0, L, 16, IR.white) + rect(0, sill, L, 2.6, IR.blue) + rect(0, sill + 2.75, L, 0.3, IR.red) + rect(0, roof - 1.4, L, 2, IR.roof);
  liv += path(poly([[1.0, 9.7], [rake - 0.1, roof - 0.9], [rake + 2.2, roof - 0.9], [rake + 2.2, 9.7]]), C.glass);
  liv += path(poly([[L - 1.0, 9.7], [L - rake + 0.1, roof - 0.9], [L - rake - 2.2, roof - 0.9], [L - rake - 2.2, 9.7]]), C.glass);
  s += shell(d0, IR.white, liv);
  s += win(rake + 3.0, 9.4, 1.8, 2.2, 0.2) + win(L - rake - 4.8, 9.4, 1.8, 2.2, 0.2);
  s += door(rake + 5.4, sill + 0.3, 1.9, 7.0, { glass: false }) + door(L - rake - 7.3, sill + 0.3, 1.9, 7.0, { glass: false });
  for (const [x, w] of grilles) s += grille(x, 8.4, w, 3.0);
  if (pan) s += pantograph(L / 2 - 4, roof, { up: true }) + rect(L / 2 - 1, roof - 0.05, 6, 0.6, C.steelDark, 0.4, 'rx="0.2"');
  return s + buffers(0.8, -1) + buffers(L - 0.8, 1);
}
// --- Bombardier TRAXX P160 AC3 (2017 on): 62 electric locomotives for
// the 25 kV lines, 6 MW, 160 km/h; they haul the double-deck sets.
export const traxx = (c) => loco(c, { roof: 13.9, rake: 2.0, centers: 33, pan: true, grilles: [[12, 5], [c.L - 17, 5]] });
// --- Alstom/EMD JT42BW (48) and the Vossloh Euro 3200 and 4000 diesels:
// the diesel fleet hauling double-deck and single-deck sets off the wires;
// drawn on one body, the JT42BW's.
export const jt42 = (c) => loco(c, { roof: 13.6, rake: 1.8, centers: 38, tank: true, grilles: [[10, 9], [c.L - 22, 12]] });

// --- Bombardier double-deck coaches (TWINDEXX Vario, 2001-21): 443 cars in
// many batches, a driving trailer at one end of each set, 160 km/h. The
// lower deck dropped between the trucks, double doors at its ends; white
// with the blue band along the bottom and red doors.
const DDK = { roof: 15.1, sill: 3.9, cornerR: 1.0, end: 0.6, trucks: { centers: 63, wb: 8.5, d: 36 }, diaphragm: [4.0, 12.6], badge: false,
  ends: { h: 13.9, len: 12.5, ramp: 3 } };
const ddPaint = (L, x0 = 0) => rect(0, 0, L, 17, IR.white) + rect(0, 13.4, L, 3, IR.roof) + rect(0, 0, L, 7.4, IR.blue) + rect(0, 7.4, L, 0.25, IR.red) +
  rect(x0, 9.9, L - x0, 2.6, "#272c33", 0, 'rx="0.4"');
const ddDoor = (x) => ({ x, w: 4.3, y0: 1.7, y1: 9.1, leaves: 2, glassY: 0.45, glassH: 0.4, fill: IR.red });
const ddRows = (a) => [{ xs: seq(a, 5.2, 7), y: 10.15, w: 4.2, h: 2.1, r: 0.3 }, { xs: seq(a, 5.2, 7), y: 4.6, w: 4.2, h: 2.2, r: 0.3 }];
export const ddCoach = (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...DDK, drop: { a: 18.0, b: c.L - 18.0, y: 1.6 },
  rows: [...ddRows(26.4), { xs: [4.2, 9.6, c.L - 14.0, c.L - 8.6], y: 7.95, w: 4.0, h: 2.4, r: 0.3 }],
  doors: [ddDoor(20.2), ddDoor(c.L - 24.5)], paint: (c, g) => ddPaint(g.L),
});
export const ddCab = (c) => bilevel({ ...c, cabL: true, cabR: false }, { ...DDK, drop: { a: 22.0, b: c.L - 18.0, y: 1.6 },
  nose: [[1.1, 3.9], [0.7, 5.4], ["q", 0.6, 7.6, 1.4, 9.0], [3.8, 12.9], ["q", 4.6, 13.9, 6.6, 13.9]],
  rows: [...ddRows(30.0), { xs: [11.0, c.L - 14.0, c.L - 8.6], y: 7.95, w: 4.0, h: 2.4, r: 0.3 }],
  doors: [ddDoor(24.2), ddDoor(c.L - 24.5)], cabLen: 9, paint: (c, g) => ddPaint(g.L, 16),
  cab: () => path(poly([[1.5, 9.1], [4.0, 12.6], [7.6, 12.6], [7.6, 9.1]]), C.glass),
});

// --- Siemens Desiro HC (2020 on): 60 electric units, 330 cars, 160 km/h:
// single-deck motor cars with the cabs at the ends, double-deck cars
// between, for the electrified lines (Jerusalem, the airport, Herzliya to
// Rehovot and Modi'in). White over blue, red plug doors.
const HC = { sill: 3.9, cornerR: 1.0, end: 0.6, trucks: { centers: 60, wb: 8.5, d: 36 }, diaphragm: [4.0, 12.4], badge: false };
export const hcCab = (c) => bilevel({ ...c, cabL: true, cabR: false }, { ...HC, roof: 14.0,
  nose: [[1.2, 3.9], [0.7, 5.2], ["q", 0.5, 7.6, 1.4, 9.2], [4.6, 13.0], ["q", 5.6, 14.0, 7.8, 14.0]],
  rows: [{ xs: [...seq(20.0, 5.4, 6), 56.6, 62.0], y: 8.0, w: 4.4, h: 2.8, r: 0.35 }],
  doors: [{ x: 13.6, w: 4.4, y0: 4.0, y1: 11.3, leaves: 2, glassY: 0.45, glassH: 0.4, fill: IR.red }, { x: c.L - 16.0, w: 4.4, y0: 4.0, y1: 11.3, leaves: 2, glassY: 0.45, glassH: 0.4, fill: IR.red }],
  cabLen: 9, roofItems: [[c.L - 26, 14, 0.7]],
  paint: (c, g) => rect(0, 0, g.L, 17, IR.white) + rect(0, 12.8, g.L, 3, IR.roof) + rect(0, 0, g.L, 7.4, IR.blue) + rect(0, 7.4, g.L, 0.25, IR.red) +
    path("M0 7.6L0 12.0Q3 11.4 5.0 9.6L5.0 7.6Z", IR.navy),
  cab: () => path(poly([[1.6, 9.3], [4.6, 12.6], [8.4, 12.6], [8.4, 9.3]]), C.glass),
  extra: (c, g) => underframe(22, 64, 3.9, { depth: 1.3, boxes: 3 }) + pantograph(g.L - 18, 14.0, { up: true, facing: -1 }),
});
export const hcMid = (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...DDK, drop: { a: 17.0, b: c.L - 17.0, y: 1.6 },
  rows: [...ddRows(25.4), { xs: [4.2, 9.6, c.L - 14.0, c.L - 8.6], y: 7.95, w: 4.0, h: 2.4, r: 0.3 }],
  doors: [ddDoor(19.4), ddDoor(c.L - 23.6)], paint: (c, g) => ddPaint(g.L),
});

export const TYPES = {
  ilTraxx: { name: "TRAXX P160 AC3 electric locomotive", kind: "electric", pan: true },
  ilJt42: { name: "JT42BW diesel locomotive", kind: "diesel" },
  ilDd: { name: "Bombardier double-deck coach", kind: "bilevel" },
  ilDdCab: { name: "Bombardier double-deck driving trailer", kind: "bilevel", cab: true },
  ilHcCab: { name: "Desiro HC motor car", kind: "emu", pan: true },
  ilHc: { name: "Desiro HC double-deck car", kind: "bilevel", emu: true },
};
// oneEnd: single-cab equipment, drawn cab-left and mirrored at the back of a train.
const M = (draw, len, oneEnd = false) => ({ draw, len, oneEnd, variant: null });
export const MODELS = {
  ilTraxx: M(traxx, 62.0), ilJt42: M(jt42, 66.0),
  ilDd: M(ddCoach, 87.9), ilDdCab: M(ddCab, 89.0, true),
  ilHcCab: M(hcCab, 86.6, true), ilHc: M(hcMid, 84.0),
};

const set = (label, ...units) => ({ label, units });
// Line ends on the electrified core: Tel Aviv and its suburbs, the airport,
// Modi'in and Jerusalem.
const WIRED = /^(Herzliya|Jerusalem|Modi'in|Tel Aviv|Ben Gurion Airport|Netanya|Rehovot|Rishon LeZion|Bnei Brak|Yavne)$/;
const NEAR = /^(Ashdod|Lod|Rosh HaAyin|Hadera|Binyamina|Ashkelon)$/;
export const TYPICAL = {
  israelrail: (t) => {
    const ends = (t.route || "").split(" – ");
    if (ends.length === 2 && ends.every((e) => WIRED.test(e))) {
      return set("Siemens Desiro HC electric unit, 4 cars shown (some trains a TRAXX locomotive with double-deck coaches)", ["ilHcCab", 1], ["ilHc", 2], ["ilHcCab", 1]);
    }
    // Out from the core along lines wired since: electric push-pull sets.
    if (ends.length === 2 && ends.every((e) => WIRED.test(e) || NEAR.test(e))) {
      return set("TRAXX electric locomotive with Bombardier double-deck coaches and a driving trailer (diesel on some trains)", ["ilTraxx", 1], ["ilDd", 5], ["ilDdCab", 1]);
    }
    return set("Diesel locomotive with Bombardier double-deck coaches and a driving trailer (a TRAXX electric where the line is wired)", ["ilJt42", 1], ["ilDd", 5], ["ilDdCab", 1]);
  },
};

// Facts come in km/h and kW; the page converts them back for display.
const kmh = (v) => Math.round((v / 1.609344) * 10) / 10, kw = (v) => Math.round(v / 0.7457);
const WP = "https://en.wikipedia.org/wiki/";
export const FACTS = {
  ilTraxx: { model: "Bombardier TRAXX P160 AC3", type: "Electric locomotive", builder: "Bombardier (now Alstom)", built: "2017 on",
    fleet: "62", topSpeedMph: kmh(160), powerHp: kw(6000), lengthFt: 62.0,
    about: "Israel Railways' first electric locomotives, bought for the 25 kV network that has been spreading out from the Tel Aviv–Jerusalem line since 2018. They haul push-pull sets of double-deck coaches.", source: `${WP}Bombardier_TRAXX` },
  ilJt42: { model: "Alstom/EMD JT42BW", type: "Diesel-electric locomotive", builder: "Alstom, with EMD", fleet: "48 (also 24 Euro 3200s and 14 Euro 4000s)",
    topSpeedMph: kmh(140),
    about: "The most numerous of Israel Railways' diesel locomotives, hauling the double-deck and Siemens single-deck push-pull sets on lines not yet electrified. Vossloh Euro 3200s and 4000s do the same work.", source: `${WP}Israel_Railways` },
  ilDd: { model: "Bombardier double-deck coach", type: "Double-deck coach", builder: "Bombardier (now Alstom), Görlitz", built: "2001–2021",
    fleet: "443 ordered from 2010 to 2019, and earlier batches", topSpeedMph: kmh(160),
    about: "The backbone of Israel Railways' fleet: push-pull double-deck coaches bought batch after batch over twenty years, the newer ones for electric haulage only.", source: `${WP}Bombardier_Double-deck_Coach` },
  ilDdCab: { model: "Bombardier double-deck driving trailer", type: "Double-deck driving trailer", builder: "Bombardier (now Alstom), Görlitz", built: "2001–2021",
    topSpeedMph: kmh(160), about: "The cab car at the far end of a double-deck set from its locomotive.", source: `${WP}Bombardier_Double-deck_Coach` },
  ilHcCab: { model: "Siemens Desiro HC", type: "Electric multiple unit", builder: "Siemens Mobility", built: "2020 on", fleet: "60 units, 330 cars",
    topSpeedMph: kmh(160),
    about: "Electric units with a single-deck motor car at each end and double-deck cars between, ordered in 2017 with a depot in Ashkelon; the first arrived in November 2020.", source: `${WP}Siemens_Desiro_HC` },
  ilHc: { model: "Siemens Desiro HC double-deck car", type: "Electric multiple unit", builder: "Siemens Mobility", built: "2020 on", fleet: "60 units, 330 cars",
    topSpeedMph: kmh(160), about: "A double-deck middle car of the Desiro HC, between its single-deck motor cars.", source: `${WP}Siemens_Desiro_HC` },
};
