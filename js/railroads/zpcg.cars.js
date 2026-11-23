// ŽPCG's cars (scripts/railroads/montenegro.py, agency "zpcg"): Željeznički
// prevoz Crne Gore, the Montenegrin passenger railroad. Its timetable in
// this feed has 29 trains: B 432, the night train from Bar by Podgorica
// and Bijelo Polje to Zemun, and the domestic 61xx (Bar–Bijelo Polje and
// Podgorica–Bar) and 71xx (Podgorica–Nikšić). Trainsheet's own side views
// at the shared scale (js/carart.js), each drawn from one photograph on
// Wikimedia Commons, named here fleet by fleet. The lettering is drawn
// here (no logo files); the railroad's mark on the Civity is set as two
// small strokes, not its real drawn form.
//
// What is from the photographs: each fleet's paint, the shape of its cab,
// and what can be counted on the side that faces the camera. Every one of
// the photographs is a three-quarter view, so the windows' spacing, the
// doors' places, the roof equipment, what hangs under the floor and every
// length are Trainsheet's reading of the type, not measurements.
//
//   461, the electric locomotive (six axles): 461-157 ("ŽS 461-157.jpg").
//     Dark crimson all over, a dark grey skirt, oval portholes along the
//     side, louvers under the roof, two pantographs. NOT DRAWN HERE: the
//     drawing is zs461Draw, imported from srbijavoz.cars.js, so it is the
//     Serbian railroad's 461-157 as photographed, with that locomotive's
//     "ЖС" lettering and number. Photographs of ŽPCG's own 461s in cream
//     and red (461-029 at Bijelo Polje, 461-039 at Lutovo, 2021–2023) are
//     now in the build's photo set, but the drawing stays Serbia's
//     461-157: this file also serves Serbia's B 433, and one drawing
//     cannot be both railroads' locomotive. A ŽPCG repaint is a recorded
//     improvement, not done here.
//   The coach: the Goša coach behind 441-075 at Belgrade-Glavna ("ŽS 441
//     in Belgrade-Glavna railway station.jpg"). Silver-grey, the windows in
//     a blue band, blue doors, a grey roof. NOT DRAWN HERE either: it is
//     gosaCoachDraw, imported from srbijavoz.cars.js. Which railroad's
//     coaches make up B 432 on a given night the timetable does not say.
//   Civity, the 6111 (CAF, three cars): a set at Bar on 1 October 2013
//     ("01.10.13 Bar 6111.001 (10101137154).jpg"). Silver-white; the cab's
//     front black round a big windshield and back over the cab's side
//     window, the roof over the cab grey; a silver band with the lamps
//     under the black; an orange stripe over a red one low along the side
//     and round the nose, black under them; red doors; small dark windows;
//     "CAF" on the front; the railroad's small mark and the number behind
//     the cab. Lettered "6111.101" (the photograph's own description
//     names the set 6111.101; its file name says 6111.001). The
//     photograph is a front three-quarter view, so the windows a car, the
//     doors' places, the trucks (drawn as two under each car), where the
//     pantograph sits (drawn on the intermediate car) and the intermediate
//     car altogether are a reading.
//   412/416, the RVR electric unit (412 motor cars, 416 trailers): 412-045
//     at Podgorica in 2016 ("Local emu Podgorica main station.jpg") and
//     412-050 head-on at Podgorica in 2010 ("ZCG 412-050 Podgorica.jpg").
//     Light grey, a grey roof, a grey chevron on the nose, an orange band
//     at lamp level, red below the band and along the skirt, red doors, the
//     headlamp pod on the cab roof, the number on the front. The
//     window/door layout is from the 2006 side views in the old blue
//     livery ("X06.11 Bf Virpazar, 412 049 Bar–Podgorica (Schluss)" for the
//     412 end car, "Train montenegro.jpg" for the 416 trailer) — only the
//     layout is taken from those, not the paint. The 416 trailer in the
//     current livery has no photograph, so the trailer is drawn in the
//     current livery as a judgement. The grey stripe along the side below
//     the windows is the chevron's arm as it reads on the side in the 2016
//     photograph; the pantograph on the second car is a reading.
//
// The honest caveats:
//   The Civity now runs trains in this feed: it serves Podgorica–Nikšić,
//     trains 7100–7109. It does not run the Belgrade–Bar train: it serves
//     Podgorica–Nikšić (and ran Bar–Podgorica train 6154 in 2013, when it
//     was photographed at Bar).
//   The FLEETS ranges (6111.101–103, three sets; 412-045–050) are
//     judgements — only 6111.101 and 412-045, 412-049, 412-050 are
//     photographed.
//   The lengths are judgements: the Civity is drawn at 76 ft a car (a
//     guess at the CAF Civity's car length, not a published figure checked
//     for this file); the 412/416 at 64.3 ft a car, the ER2 figure (19.6 m)
//     as in georgianrailway.cars.js; the 461 at 64 ft and the coach at
//     80 ft, as in srbijavoz.cars.js.
//   The timetable names no locomotive or unit, so every fleet assignment
//     is a judgement, labeled as typical; see TYPICAL below. The 412/416
//     on the 61xx trains rests on the 412s being photographed on the
//     Bar–Podgorica line at Šušanj and Virpazar. Whether the 412/416 sets
//     still run in the 2026 timetable the feed does not say, and the
//     current-livery photographs are from 2010–2016.
//   VERIFIED after writing (22 Nov 2026): node --check passes; the
//     Civity cab and mid cars rendered and looked at beside the Bar
//     photograph (roof checked grey, not black); TYPICAL run over the one
//     zpcg run, 0 failures; the Civity appears in the fleet view via FLEETS.
//   VERIFIED after the Montenegro C1 work (23 Nov 2026): node --check
//     passes; TYPICAL run over all 29 zpcg runs through the real
//     consist.js — 0 failures, 0 nulls (18 × 412/416 four-car set on the
//     61xx, 10 × Civity three-car set on the 71xx, 1 × 461 + five coaches
//     on B 432). The 412 cab and 416 trailer rendered and looked at
//     beside the 2016 Podgorica and 2006 Virpazar photographs: light grey
//     body, grey roof, orange band at lamp level, red below the band,
//     red doors, the chevron's arm along the side, the headlamp pod on
//     the cab roof (one fix made in the pass: the "412-045" lettering was
//     first drawn over the first door; the coordinator's re-check found
//     the "4" still clipped at 16.2, and moved it to 18.0, clear). The
//     Civity cab re-rendered unchanged.

import { rect, circle, path, underframe } from "../carart.js?v=dev";
import { unit, letters, hvac } from "./czechia.cars.js?v=dev";
import { zs461Draw, gosaCoachDraw } from "./srbijavoz.cars.js?v=dev";

const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 2, depth = 1.0) => underframe(a, b, top, { depth, boxes: k, tanks: false });

// ---------- Civity: the 6111 (CAF) ----------
// Three cars, drawn each on two trucks of its own (a reading). Silver-
// white; an orange stripe over a red one low along the side, black under
// them; red doors; a grey roof. The cab: black from the foot of the
// windshield up and back over the cab's side window, a silver band with
// the lamps under it, the stripes carried round the nose.
const CV = { silver: "#e3e5e8", roof: "#9a9fa5", black: "#17191c", orange: "#f08a1c", red: "#d3222a", skirt: "#1d1f23", ink: "#3a3d42" };
const CVG = { roof: 13.0, sill: 3.6 };
const NOSE_CV = [[1.5, 3.6], [0.9, 4.8], ["q", 0.7, 6.4, 2.0, 8.0], [5.8, 12.2], ["q", 6.8, 13.0, 9.6, 13.0]];
function civityPaint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = rect(-1, 0, L + 2, 20, CV.silver);
    // The black of the cab's front, swept back along the side to the far
    // edge of the cab's window.
    if (cab) s += path("M-1 7.0L3.0 7.0Q8.6 7.2 12.6 8.0L11.6 12.4L-1 12.4Z", CV.black);
    return s + bands(L, [[12.2, 3, CV.roof], [5.0, 0.75, CV.orange], [4.25, 0.75, CV.red], [0, 4.25, CV.skirt]]);
  };
}
// The doors stand on the orange stripe, as photographed.
const cvDoor = (x) => ({ x, w: 4.2, y0: 5.85, y1: 11.6, leaves: 2, glassY: 0.42, glassH: 0.42, grabs: false, fill: CV.red });
const cvWin = (xs) => ({ xs, y: 7.9, w: 3.5, h: 3.2, r: 0.3 });
// The railroad's mark, as two small strokes, orange over red.
const zpcgMark = (x, y) => path(`M${x - 1.0} ${y}Q${x} ${y + 0.75} ${x + 1.0} ${y + 0.3}L${x + 1.0} ${y + 0.02}Q${x} ${y + 0.4} ${x - 1.0} ${y}Z`, CV.orange) +
  path(`M${x - 0.8} ${y - 0.4}Q${x + 0.1} ${y + 0.25} ${x + 1.0} ${y - 0.2}L${x + 1.0} ${y - 0.45}Q${x + 0.1} ${y - 0.1} ${x - 0.8} ${y - 0.4}Z`, CV.red);
const zpcgCivityCab = (c) => unit(c, { roof: CVG.roof, sill: CVG.sill, nose: NOSE_CV, rake: [[2.0, 8.0], [5.8, 12.2]], depth: 3.0, cabLen: 10, lampY: 6.45, bare: true, surround: CV.black,
  // The cab's side window, in the black; a narrow window and two more
  // ahead of the first door; six between the doors.
  rows: [{ xs: [8.4], y: 8.5, w: 2.6, h: 2.7, r: 0.35 }, { xs: [18.2], y: 7.9, w: 2.0, h: 3.2, r: 0.3 },
    cvWin([21.4, 25.8]), cvWin(seq(36.3, 4.4, 6))],
  doors: [cvDoor(30.5), cvDoor(c.L - 12.6)], trucks: [11.5, c.L - 10.5], wheel: 34, paint: civityPaint(true),
  extra: (cc, g) => letters(cc, 3.5, 7.42, 0.42, "CAF", "#ffffff", { weight: 800 }) +
    zpcgMark(15.1, 9.7) + letters(cc, 15.1, 8.4, 0.5, "6111.101", CV.ink, { weight: 600 }) +
    hvac(15, CVG.roof, 10, 0.55) + hvac(g.L - 24, CVG.roof, 12, 0.55) + boxes(21, g.L - 20, CVG.sill, 2, 1.1) });
const zpcgCivityMid = (c) => unit(c, { roof: CVG.roof, sill: CVG.sill,
  rows: [cvWin(seq(14.4, 4.4, 11))],
  doors: [cvDoor(8.4), cvDoor(c.L - 12.6)], trucks: [10.5, c.L - 10.5], wheel: 34, paint: civityPaint(false),
  // The pantograph on the intermediate car (a reading: the photograph
  // shows it raised behind the leading car, from the front).
  pan: 14,
  extra: (cc, g) => hvac(26, CVG.roof, 12, 0.55) + hvac(g.L - 20, CVG.roof, 12, 0.55) + boxes(20, g.L - 20, CVG.sill, 3, 1.1) });

// ---------- Class 412/416: the RVR EMU ----------
// The four-car set (412 motor cars at the ends, 416 trailers between):
// light grey, a grey roof, an orange band at lamp level, red below the
// band and along the skirt, red doors. Drawn from "Local emu Podgorica
// main station.jpg" (412-045 at Podgorica, 2016) for the current livery
// and "ZCG 412-050 Podgorica.jpg" (412-050 head-on, 2010) for the front:
// two windshields, the grey chevron on the nose, the headlamp pod on the
// cab roof, the number on the front. The window/door layout is from the
// 2006 side views in the old blue livery — "X06.11 Bf Virpazar, 412 049
// Bar–Podgorica (Schluss)" for the 412 end car, "Train montenegro.jpg"
// for the 416 trailer — only the layout is taken from those, not the
// paint. The 416 trailer in the current livery has no photograph: the
// trailer is drawn in the current livery as a judgement. The grey stripe
// along the side below the windows is the chevron's arm as it reads on
// the side in the 2016 photograph. The pantograph on the second car is a
// reading (one is visible on the car behind the end car in the 2016
// photograph). The car length is a judgement: 19.6 m, the ER2 figure, as
// in georgianrailway.cars.js.
const EM412 = { grey: "#d8d9d6", roof: "#a8adb2", orange: "#f59a1b", red: "#c8322b", skirt: "#33373c", ink: "#3a3d42", lamp: "#fff4cf" };
const EM412G = { roof: 13.2, sill: 3.6 };
const NOSE_412 = [[0.9, 3.6], [0.7, 8.0], [1.2, 12.2], ["q", 1.4, 13.2, 2.8, 13.2]];
function emu412Paint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, EM412.grey], [12.35, 3, EM412.roof], [0, 3.6, EM412.skirt]]) +
      rect(-1, 5.0, L + 2, 1.1, EM412.orange) + rect(-1, 3.6, L + 2, 1.4, EM412.red);
    if (cab) {
      // The red lower front, and the chevron's arm along the side.
      s += rect(-1, 0, 7, 3.6, EM412.red) +
        path("M-1 7.5L13 6.8L13 7.6L-1 8.3Z", EM412.roof);
    }
    return s;
  };
}
const emu412Door = (x) => ({ x, w: 3.6, y0: 3.6, y1: 10.8, leaves: 2, glassY: 0.45, glassH: 0.4, grabs: true, fill: EM412.red });
const emu412Win = (xs) => ({ xs, y: 7.6, w: 2.4, h: 2.8, r: 0.3 });
const zpcg412Cab = (c) => unit(c, { roof: EM412G.roof, sill: EM412G.sill, nose: NOSE_412, rake: [[1.0, 8.2], [1.4, 12.2]], depth: 2.6, cabLen: 8, lampY: 5.6, bare: true,
  rows: [emu412Win([...seq(20, 3.8, 5), ...seq(48.5, 3.4, 4)])],
  doors: [emu412Door(11.5), emu412Door(44)], trucks: [10.0, c.L - 10.0], wheel: 33, paint: emu412Paint(true), surround: "#1d2026",
  // The headlamp pod on the cab roof, and the cab's side window.
  cab: () => rect(1.6, 13.2, 3.4, 1.1, EM412.roof, 0.4, 'rx="0.4"') + circle(2.7, 13.75, 0.45, EM412.lamp, 0.3) + circle(4.0, 13.75, 0.45, EM412.lamp, 0.3) +
    path("M4.6 8.5L7.6 8.5L7.6 11.2L4.6 11.2Z", "#1d2026", 0.4),
  extra: (cc, g) => letters(cc, 18.0, 7.0, 0.5, "412-045", EM412.ink, { weight: 600 }) +
    hvac(16, EM412G.roof, 10, 0.55) + hvac(g.L - 24, EM412G.roof, 12, 0.55) + boxes(16, g.L - 16, EM412G.sill, 3, 1.2) });
const zpcg416Mid = (c) => unit(c, { roof: EM412G.roof, sill: EM412G.sill,
  rows: [emu412Win([5.0, 8.4, ...seq(19, 3.4, 7), ...seq(48.5, 3.4, 4)])],
  doors: [emu412Door(14), emu412Door(44)], trucks: [10.0, c.L - 10.0], wheel: 33, paint: emu412Paint(false),
  // A pantograph on the second car (a reading: one is visible on the car
  // behind the end car in the 2016 photograph).
  pan: c.index === 1 ? c.L / 2 - 6 : null,
  extra: (cc, g) => hvac(16, EM412G.roof, 12, 0.55) + hvac(g.L - 24, EM412G.roof, 12, 0.55) + boxes(16, g.L - 16, EM412G.sill, 3, 1.2) });

// ---------- Tables ----------

export const TYPES = {
  zpcg461: { name: "ŽPCG 461 electric locomotive", kind: "electric" },
  zpcgCoach: { name: "ŽPCG coach", kind: "coach" },
  zpcgCivityCab: { name: "CAF Civity 6111 end car", kind: "emu" },
  zpcgCivityMid: { name: "CAF Civity 6111 intermediate car", kind: "emu" },
  zpcg412Cab: { name: "Class 412 EMU end car", kind: "emu" },
  zpcg416Mid: { name: "Class 416 EMU trailer car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers, each a judgement: the 461 19.8 m and the coach
// 24.5 m, as in srbijavoz.cars.js (whose drawings these are); the Civity
// about 23 m a car, a guess at the CAF Civity's car length; the 412/416
// 19.6 m a car, the ER2 figure.
export const MODELS = {
  zpcg461: M(zs461Draw, 64.0),
  zpcgCoach: M(gosaCoachDraw, 80.0),
  zpcgCivityCab: M(zpcgCivityCab, 76.0, true),
  zpcgCivityMid: M(zpcgCivityMid, 76.0),
  zpcg412Cab: M(zpcg412Cab, 64.3, true),
  zpcg416Mid: M(zpcg416Mid, 64.3, false, byIndex),
};

// The fleet view: the Civity sets and the 412/416 sets. Both ranges are
// judgements (three Civity sets, 6111.101–103; the 412s 412-045–050, of
// which only 045, 049 and 050 are photographed).
export const FLEETS = { zpcg: [[6111101, 6111103, "zpcgCivityCab"], [412045, 412050, "zpcg412Cab"]] };

const set = (label, ...units) => ({ label, units });
const hauled = (loco, k, label) => set(label, [loco, 1], ["zpcgCoach", k]);
const BAR_SET = hauled("zpcg461", 5,
  "Typical: a 461 electric locomotive and five coaches (a judgement: the timetable names no locomotive; the 461s haul the Belgrade–Bar train, photographed at Bar and on the line)");
const EMU412_SET = set("Typical: a four-car class 412/416 electric unit (a judgement: the timetable names no unit; the 412s are photographed on the Bar–Podgorica line at Šušanj and Virpazar)",
  ["zpcg412Cab", 1], ["zpcg416Mid", 2], ["zpcg412Cab", 1]);
const CIVITY_SET = set("Typical: a three-car CAF Civity 6111 (the Civity serves Podgorica–Nikšić; the three cars are a reading)",
  ["zpcgCivityCab", 1], ["zpcgCivityMid", 1], ["zpcgCivityCab", 1]);

// The timetable (the community ŽPCG GTFS) names no locomotive or unit, so
// a train is placed by its number, and a line's page (which has no number)
// by its two ends. B 432, Bar–Zemun, is drawn behind a 461 with five
// coaches; the 71xx Podgorica–Nikšić trains behind a Civity 6111, which
// the header says serves that line; the 61xx Bar–Bijelo Polje and
// Podgorica–Bar locals behind a 412/416 set. TYPICAL never returns null.
// NFD would decompose Cyrillic й and ї (Київ -> "киів", Кривий ->
// "кривии") and strip the combining mark, so they are parked on
// private-use code points while the Latin diacritics are stripped, then
// put back.
const fold = (s) => String(s || "").replace(/[йЙ]/g, "").replace(/[їЇ]/g, "")
  .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(//g, "й").replace(//g, "ї")
  .replace(/ł/g, "l").replace(/Ł/g, "L").toLowerCase().trim();
const ends = (t) => {
  const a = fold(t.origin), b = fold(t.destination || t.dest);
  if (a || b) return `${a} ${b}`;
  return fold(String(t.route || t.line || "").replace(/ – /g, " "));
};
export const TYPICAL = {
  zpcg: (t = {}) => {
    const num = String(t.number || "").trim();
    const e = ends(t);
    // B 432, by its number or by its two ends: the Belgrade–Bar train.
    if (/^B 432/.test(num) || (/\bbar\b/.test(e) && /земун/.test(e))) return BAR_SET;
    // 7100–7109, Podgorica–Nikšić: the Civity 6111.
    if (/^71/.test(num) || (/\bpodgorica\b/.test(e) && /niksic/.test(e))) return CIVITY_SET;
    // 6100–6105 and 6150–6161, the Bar–Bijelo Polje and Podgorica–Bar
    // locals: the 412/416 set.
    if (/^61/.test(num)) return EMU412_SET;
    // Anything not placed: the same set as B 432.
    return BAR_SET;
  },
};

// Sources: the photograph each drawing was made from (Wikimedia Commons).
// Builders are the commonly published ones, set down from memory; top
// speeds are given only where Trainsheet is confident of them.
const CM = "https://commons.wikimedia.org/wiki/File:";
const fCivity = { model: "CAF Civity (class 6111)", type: "Electric multiple unit", builder: "CAF", topSpeedMph: 100, lengthFt: 76.0,
  source: `${CM}01.10.13_Bar_6111.001_%2810101137154%29.jpg` };
const f412 = { model: "412/416", type: "Electric multiple unit", builder: "RVR", lengthFt: 64.3,
  source: `${CM}Local_emu_Podgorica_main_station.jpg` };
export const FACTS = {
  zpcg461: { model: "461", type: "Electric locomotive", builder: "Electroputere", lengthFt: 64.0,
    source: `${CM}%C5%BDS_461-157.jpg`,
    about: "The class 461, the six-axle Romanian-built electric locomotive of the mountain line between Belgrade and Bar: dark crimson all over with a dark grey skirt, oval portholes along the side, louvers under the roof and two pantographs. The one photographed, and so the one drawn, is the Serbian railroad's 461-157, with its \"ЖС\" lettering; photographs of ŽPCG's own 461s in cream and red are now in the build's photo set, but the drawing stays Serbia's 461-157, since this file also serves Serbia's B 433 and one drawing cannot be both railroads' locomotive. The portholes' spacing and the lettering's place are a reading of a three-quarter view. Drawing it on B 432 is a judgement: the timetable names no locomotive." },
  zpcgCoach: { model: "Goša coach", type: "Locomotive-hauled passenger coach", builder: "Goša", lengthFt: 80.0,
    source: `${CM}%C5%BDS_441_in_Belgrade-Glavna_railway_station.jpg`,
    about: "A coach of the kind built by Goša of Smederevska Palanka: silver-grey with the windows in a blue band, blue doors and a grey roof — as the coach behind 441-075 at Belgrade-Glavna, which is seen end-on, so the windows and length are those of the standard coach, not counted from the photograph. It is the Serbian railroad's coach as photographed; which railroad's coaches make up the Bar–Zemun train, and how many, is a judgement." },
  zpcgCivityCab: { ...fCivity,
    about: "An end car of the class 6111, CAF's three-car Civity electric unit for Montenegro: silver-white with a black cab front round a big windshield, a grey roof, an orange stripe over a red one low along the side, red doors, small dark windows and \"CAF\" on the front. The set was photographed at Bar on 1 October 2013 from the front, so the windows, the doors' places and the trucks are a reading, the 76 ft car length is a judgement, and the number it is lettered with, 6111.101, is the one the photograph's description names. A correction: the Civity does not run B 432, the Bar–Zemun train — it serves Podgorica–Nikšić, trains 7100–7109 in this timetable (and ran Bar–Podgorica train 6154 in 2013)." },
  zpcgCivityMid: { ...fCivity,
    about: "The intermediate car of a class 6111 Civity, in the same silver-white with the orange and red stripes and red doors. Its windows, its doors and the pantograph on its roof are Trainsheet's reading, and its 76 ft length a judgement; the photograph shows the set from the front at Bar. Like the end cars it runs no train in this timetable: the Civity does not work B 432, the Bar–Zemun train, but the Podgorica–Nikšić line." },
  zpcg412Cab: { ...f412,
    about: "An end car of the class 412, the RVR electric unit of the Montenegrin locals: light grey with a grey roof, a grey chevron on the nose, an orange band at lamp level, red below the band and along the skirt, red doors and the headlamp pod on the cab roof. Photographed as 412-045 at Podgorica in 2016 and 412-050 head-on in 2010; the window/door layout is from the 2006 side views in the old blue livery, so only the layout is taken from those. The 64.3 ft car length is the ER2 figure, a judgement. Drawing it on the 61xx trains is a judgement: the timetable names no unit, and the 412s are photographed on the Bar–Podgorica line at Šušanj and Virpazar. Whether the sets still run in 2026 the feed does not say." },
  zpcg416Mid: { ...f412,
    about: "A trailer car of a class 412/416 set, in the same light grey with the orange band, red skirt and red doors. No photograph shows a 416 trailer in the current livery — the side view in the build's photo set is from 2006, in the old blue livery — so the trailer is drawn in the current livery as a judgement; its window/door layout is from that 2006 side view, and the pantograph on the second car is a reading." },
};
