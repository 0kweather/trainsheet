// ŽPCG's cars (scripts/railroads/serbia.py, agency "zpcg"): Željeznički
// prevoz Crne Gore, the Montenegrin passenger railroad, which has exactly
// one train in this feed — B 432, the night train from Bar by Podgorica
// and Bijelo Polje to Zemun. Trainsheet's own side views at the shared
// scale (js/carart.js), each drawn from one photograph on Wikimedia
// Commons, named here fleet by fleet. The lettering is drawn here (no logo
// files); the railroad's mark on the Civity is set as two small strokes,
// not its real drawn form.
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
//     "ЖС" lettering and number. No photograph of one of ŽPCG's own 461s
//     was to hand, so their paint and lettering are not shown.
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
//
// The honest caveats:
//   The Civity is drawn but wired to NO train. It does not run the
//     Belgrade–Bar train: it serves Podgorica–Nikšić (and ran Bar–Podgorica
//     train 6154 in 2013, when it was photographed at Bar), and neither is
//     in this feed. It appears only in the fleet view, through FLEETS.
//   The FLEETS range (6111.101–103, three sets) is a judgement.
//   The lengths are judgements: the Civity is drawn at 76 ft a car (a
//     guess at the CAF Civity's car length, not a published figure checked
//     for this file); the 461 at 64 ft and the coach at 80 ft, as in
//     srbijavoz.cars.js.
//   The timetable names no locomotive, so B 432's set is a judgement,
//     labeled as typical; see TYPICAL below.
//   VERIFIED after writing (22 Nov 2026): node --check passes; the
//     Civity cab and mid cars rendered and looked at beside the Bar
//     photograph (roof checked grey, not black); TYPICAL run over the one
//     zpcg run, 0 failures; the Civity appears in the fleet view via FLEETS.

import { rect, path, underframe } from "../carart.js?v=dev";
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

// ---------- Tables ----------

export const TYPES = {
  zpcg461: { name: "ŽPCG 461 electric locomotive", kind: "electric" },
  zpcgCoach: { name: "ŽPCG coach", kind: "coach" },
  zpcgCivityCab: { name: "CAF Civity 6111 end car", kind: "emu" },
  zpcgCivityMid: { name: "CAF Civity 6111 intermediate car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
// Feet over the couplers, each a judgement: the 461 19.8 m and the coach
// 24.5 m, as in srbijavoz.cars.js (whose drawings these are); the Civity
// about 23 m a car, a guess at the CAF Civity's car length.
export const MODELS = {
  zpcg461: M(zs461Draw, 64.0),
  zpcgCoach: M(gosaCoachDraw, 80.0),
  zpcgCivityCab: M(zpcgCivityCab, 76.0, true),
  zpcgCivityMid: M(zpcgCivityMid, 76.0),
};

// The fleet view: the Civity sets, which run no train in this feed, so
// this is their only appearance. The range is a judgement (three sets,
// 6111.101–103).
export const FLEETS = { zpcg: [[6111101, 6111103, "zpcgCivityCab"]] };

const set = (label, ...units) => ({ label, units });
const hauled = (loco, k, label) => set(label, [loco, 1], ["zpcgCoach", k]);
const BAR_SET = hauled("zpcg461", 5,
  "Typical: a 461 electric locomotive and five coaches (a judgement: the timetable names no locomotive; the 461s haul the Belgrade–Bar train, photographed at Bar and on the line)");

// The timetable (the community Srbijavoz GTFS) names no locomotive, and
// the railroad has one train in it: B 432, Bar–Zemun (its line is named
// "Bar – Земун"). It is drawn behind a 461 with five coaches, and so is
// anything else that should turn up under this railroad: the Civity is
// NOT wired here, since it does not run the Belgrade–Bar train (see the
// header). TYPICAL never returns null.
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
    // Anything not placed: the same set (the railroad's only train here).
    return BAR_SET;
  },
};

// Sources: the photograph each drawing was made from (Wikimedia Commons).
// Builders are the commonly published ones, set down from memory; top
// speeds are given only where Trainsheet is confident of them.
const CM = "https://commons.wikimedia.org/wiki/File:";
const fCivity = { model: "CAF Civity (class 6111)", type: "Electric multiple unit", builder: "CAF", topSpeedMph: 100, lengthFt: 76.0,
  source: `${CM}01.10.13_Bar_6111.001_%2810101137154%29.jpg` };
export const FACTS = {
  zpcg461: { model: "461", type: "Electric locomotive", builder: "Electroputere", lengthFt: 64.0,
    source: `${CM}%C5%BDS_461-157.jpg`,
    about: "The class 461, the six-axle Romanian-built electric locomotive of the mountain line between Belgrade and Bar: dark crimson all over with a dark grey skirt, oval portholes along the side, louvers under the roof and two pantographs. The one photographed, and so the one drawn, is the Serbian railroad's 461-157, with its \"ЖС\" lettering; Trainsheet had no photograph of one of ŽPCG's own 461s, so their paint is not shown. The portholes' spacing and the lettering's place are a reading of a three-quarter view. Drawing it on B 432 is a judgement: the timetable names no locomotive." },
  zpcgCoach: { model: "Goša coach", type: "Locomotive-hauled passenger coach", builder: "Goša", lengthFt: 80.0,
    source: `${CM}%C5%BDS_441_in_Belgrade-Glavna_railway_station.jpg`,
    about: "A coach of the kind built by Goša of Smederevska Palanka: silver-grey with the windows in a blue band, blue doors and a grey roof — as the coach behind 441-075 at Belgrade-Glavna, which is seen end-on, so the windows and length are those of the standard coach, not counted from the photograph. It is the Serbian railroad's coach as photographed; which railroad's coaches make up the Bar–Zemun train, and how many, is a judgement." },
  zpcgCivityCab: { ...fCivity,
    about: "An end car of the class 6111, CAF's three-car Civity electric unit for Montenegro: silver-white with a black cab front round a big windshield, a grey roof, an orange stripe over a red one low along the side, red doors, small dark windows and \"CAF\" on the front. The set was photographed at Bar on 1 October 2013 from the front, so the windows, the doors' places and the trucks are a reading, the 76 ft car length is a judgement, and the number it is lettered with, 6111.101, is the one the photograph's description names. A correction: the Civity does not run B 432, the Bar–Zemun train — it serves Podgorica–Nikšić (and ran Bar–Podgorica train 6154 in 2013), which is not in this timetable, so it is shown in the fleet view only." },
  zpcgCivityMid: { ...fCivity,
    about: "The intermediate car of a class 6111 Civity, in the same silver-white with the orange and red stripes and red doors. Its windows, its doors and the pantograph on its roof are Trainsheet's reading, and its 76 ft length a judgement; the photograph shows the set from the front at Bar. Like the end cars it runs no train in this timetable: the Civity does not work B 432, the Bar–Zemun train, but the Podgorica–Nikšić line." },
};
