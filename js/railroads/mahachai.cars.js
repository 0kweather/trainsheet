// The Mahachai Line's cars (scripts/railroads/thailand.py, agency
// "mahachai"): the State Railway of Thailand's NKF class diesel railcars
// (Tokyu Car), which work Wongwian Yai–Maha Chai. Trainsheet's own side
// views at the shared scale (js/carart.js), drawn from, and checked
// against, six photographs on Wikimedia Commons, named here. Nothing is
// lettered on the side ("SRT" and the car's number are on the front face).
//
// The photographs (all https://commons.wikimedia.org/wiki/File:...):
//   at Maha Chai station, 25 Mar 2023 — the line itself:
//     "SRT_NKF_1207_&_1215_at_Maha_Chai_Railway_Station.jpg" (1207's side
//     at an angle, the one the side is drawn from), "SRT_NKF_1202_at_Maha_
//     Chai_Railway_Station.jpg" and "SRT_NKF_1207_at_Maha_Chai_Railway_
//     Station.jpg" (cab fronts);
//   at Ban Phachi Junction, 3 Apr 2023 — the same class on the main line,
//     not this line: "SRT_DMU_Tokyu_NKF_(1237_A_W).jpg", "(1237_B_W)" and
//     "(1237_C_W)" (a whole train's side at an angle).
//
// What is from the photographs: a flat, upright cab front, orange around
// its dark windows and below the blue band, on a red pilot; twin lamps in
// a box on the cab roof; an unpainted stainless-steel side, fluted below
// the waist; a blue band along the waist under the windows with a pale
// line under it; the orange of the front wrapping the cab's corner; a cab
// side window, a narrow crew door, a barred window, a small window, then
// a passenger doorway and a row of small windows; a dark roof.
//
// The honest caveats:
//   THE BLUE: on the cars photographed at Maha Chai (1202, 1207, 1215) the
//     side between the windows is bare stainless steel and the blue is a
//     band along the waist. 1237 at Ban Phachi has the whole window band
//     painted blue with thin orange lines. The Maha Chai cars are the ones
//     drawn, since that is this line; a train here may be in either paint.
//   The formation is a judgement: three cars are drawn, a cab car at each
//     end and a car between. No photograph shows a whole Mahachai train
//     (the Ban Phachi train is longer), none shows a car between two
//     others squarely, and whether the middle vehicle is a cab car or a
//     trailer is not known: it is drawn without a cab, in the same paint.
//   None of the photographs is a true side elevation: the windows' count
//     and spacing past the first doorway, the second doorway's place, the
//     roof's vents, what hangs under the floor and the car length (20.8 m)
//     are Trainsheet's reading, not measurements.
//   The KiHa 183s some guides name for this line are not drawn: every
//     photograph at Maha Chai shows NKF cars.
//
//   VERIFIED after writing (23 Nov 2026): node --check passes; TYPICAL run
//     over all 33 mahachai runs through the real consist.js — 0 failures,
//     0 nulls (33 → the three-car NKF train); both cars and the consist
//     rendered and looked at beside the photographs (what that pass found
//     is in the build's STATE.md). Renders and the script: the build's
//     work/verify-c1/.

import { bilevel } from "../carmodels.js?v=dev";
import { rect, circle, path, lines, poly, truck, underframe } from "../carart.js?v=dev";

const NK = { steel: "#a9aba8", shade: "rgba(0,0,0,0.2)", roof: "#54575b", blue: "#1c80d4", pale: "#e4def0", orange: "#f18a17", red: "#de3f3c", dark: "#24272b", lamp: "#fff4cf" };
const G = { roof: 12.4, sill: 3.8 };
const NOSE = [[0.7, 3.8], [0.7, 11.5], ["q", 0.7, 12.4, 1.8, 12.4]];
const WAIST = { blue: [6.6, 0.85], pale: [6.3, 0.3] };
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => Math.round((from + i * pitch) * 10) / 10);
function paint(cab) {
  return (c, g) => {
    const L = g.L, x0 = cab ? 2.0 : -1, segs = [];
    // The flutes below the waist, and a pair of ribs above the windows.
    for (let y = 4.05; y < 6.25; y += 0.3) segs.push([x0, y, L + 1, y]);
    segs.push([x0, 11.05, L + 1, 11.05], [x0, 11.3, L + 1, 11.3]);
    let s = rect(-1, 0, L + 2, 20, NK.steel) + rect(-1, 11.6, L + 2, 3, NK.roof) + lines(segs, NK.shade, 0.5) +
      rect(-1, WAIST.blue[0], L + 2, WAIST.blue[1], NK.blue) + rect(-1, WAIST.pale[0], L + 2, WAIST.pale[1], NK.pale);
    if (cab) {
      // The front's orange wrapping the cab's corner, the blue band and its
      // pale line carried across it.
      s += rect(-1, 0, 3.0, 12.0, NK.orange) + rect(-1, WAIST.blue[0], 3.0, WAIST.blue[1], NK.blue) + rect(-1, WAIST.pale[0], 3.0, WAIST.pale[1], NK.pale) +
        // The band's slanted start on the steel, behind the corner.
        path(`M2.0 ${WAIST.pale[0]}L4.4 ${WAIST.pale[0]}L3.2 5.3L2.0 5.3Z`, NK.steel);
    }
    return s;
  };
}
const WIN = { y: 8.0, h: 2.7 };
const row = (xs, w = 3.0) => ({ xs, y: WIN.y, w, h: WIN.h, r: 0.3 });
// A passenger doorway: a recessed single door, dark in the photographs.
const way = (x) => ({ x, w: 3.6, y0: G.sill, y1: 11.0, leaves: 1, glassY: 0.5, glassH: 0.36, grabs: true, fill: "rgba(0,0,0,0.3)" });
const vents = (L, from) => seq(from, 9.5, Math.floor((L - from - 4) / 9.5) + 1).map((x) => rect(x, G.roof - 0.05, 1.6, 0.4, NK.dark, 0, 'rx="0.15"')).join("");
const under = (a, b) => underframe(a, b, G.sill, { depth: 1.5, boxes: 4, tanks: true });
const body = (c, o) => bilevel(c, { roof: G.roof, sill: G.sill, cornerR: 0.9, end: 0.6, noTrucks: true, badge: false, base: NK.steel, diaphragm: [G.sill + 0.3, 10.9], ...o });

const cabCar = (c) => body({ ...c, cabL: true, cabR: false }, { nose: NOSE, cabLen: 1.2, paint: paint(true),
  // The cab's side window; a barred window and a small one behind the crew
  // door; past the doorway a narrow window, five windows and a narrow one;
  // two windows behind the second doorway.
  rows: [row([2.5], 2.5), row([9.6], 4.4), row([15.4, 24.0, 49.0], 1.7), row(seq(27.0, 4.3, 5)), row([57.7, 62.0])],
  doors: [{ x: 5.8, w: 2.3, y0: G.sill, y1: 11.0, leaves: 1, glassY: 0.5, glassH: 0.36, grabs: true, fill: "rgba(0,0,0,0.1)" }, way(18.6), way(52.2)],
  extra: (cc, g) => truck(10.5, { wb: 7.2, d: 33, top: G.sill }) + truck(g.L - 10.5, { wb: 7.2, d: 33, top: G.sill }) + under(18, g.L - 18) + vents(g.L, 8) +
    // The bars across the window behind the crew door.
    lines(seq(10.1, 0.5, 5).map((x) => [x, WIN.y + 0.1, x, WIN.y + WIN.h - 0.1]), "#c9cbc8", 0.7),
  cab: () =>
    // The red pilot under the front.
    path(poly([[0.5, 3.9], [3.6, 3.9], [3.1, 1.2], [0.5, 1.2]]), NK.red, 0.4) +
    // The twin lamps' box on the cab roof, and the horns behind it.
    rect(0.6, 11.9, 1.3, 1.1, "#c9c4b4", 0.4, 'rx="0.15"') + circle(0.75, 12.45, 0.3, NK.lamp, 0.25) +
    rect(2.3, 12.35, 1.2, 0.3, NK.dark) + rect(2.5, 12.6, 0.3, 0.3, NK.dark) + rect(3.0, 12.6, 0.3, 0.35, NK.dark) +
    // The red marker lamp at the front's corner, on the orange.
    rect(0.45, 5.2, 0.4, 0.55, "#b3262a", 0.3, 'rx="0.12"') });
const midCar = (c) => body({ ...c, cabL: false, cabR: false }, { paint: paint(false),
  // A judgement: a doorway at each end and a row of windows between.
  rows: [row(seq(9.8, 4.3, 11)), row([c.L - 9.9], 1.7)], doors: [way(4.2), way(c.L - 7.8)],
  extra: (cc, g) => truck(10.5, { wb: 7.2, d: 33, top: G.sill }) + truck(g.L - 10.5, { wb: 7.2, d: 33, top: G.sill }) + under(18, g.L - 18) + vents(g.L, 6) });

// ---------- Tables ----------

export const TYPES = {
  mahachaiNkfCab: { name: "NKF diesel railcar (cab car)", kind: "emu" },
  mahachaiNkfMid: { name: "NKF diesel railcar (middle car)", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
// Feet over the couplers: 20.8 m a car, a judgement.
export const MODELS = {
  mahachaiNkfCab: M(cabCar, 68.2, true),
  mahachaiNkfMid: M(midCar, 68.2, false),
};

const NKF_SET = { label: "Typical: a three-car train of SRT NKF diesel railcars (a judgement: the timetable names no stock; the NKF cars are the ones photographed at Maha Chai, and the three-car length is a reading)",
  units: [["mahachaiNkfCab", 1], ["mahachaiNkfMid", 1], ["mahachaiNkfCab", 1]] };
// The timetable (OTP's Namtang GTFS) names no rolling stock; every train
// on the line (4302–4347) is drawn as the NKF train. TYPICAL never returns
// null.
export const TYPICAL = { mahachai: () => NKF_SET };

const CM = "https://commons.wikimedia.org/wiki/File:";
const fNkf = { model: "SRT NKF class", type: "Diesel multiple unit", builder: "Tokyu Car", built: "1985", lengthFt: 68.2,
  source: `${CM}SRT_NKF_1207_%26_1215_at_Maha_Chai_Railway_Station.jpg` };
export const FACTS = {
  mahachaiNkfCab: { ...fNkf,
    about: "A cab car of the State Railway of Thailand's NKF class diesel railcars, the trains of the Mahachai Line: a flat orange front on a red pilot with twin lamps on the cab roof, and an unpainted stainless-steel side, fluted below the waist, with a blue band under the windows. Drawn from NKF 1207, photographed at Maha Chai station in March 2023. Others of the class (1237, at Ban Phachi Junction) have the whole window band painted blue; a train here may be in either paint. Drawing a three-car NKF train on every run is a judgement: the timetable names no stock." },
  mahachaiNkfMid: { ...fNkf,
    about: "The middle car of a three-car NKF train on the Mahachai Line, in the same stainless steel with the blue waist band. A judgement throughout: no photograph shows a middle car squarely, and whether it is a cab car coupled inside the train or a trailer is not known; it is drawn without a cab, a doorway at each end." },
};
