// SRT Red Lines' cars (scripts/railroads/thailand.py, agency "srtred"):
// the Hitachi AT100 electric units of Bangkok's Dark Red Line (Krung Thep
// Aphiwat–Rangsit) and Light Red Line (Krung Thep Aphiwat–Taling Chan).
// Trainsheet's own side views at the shared scale (js/carart.js), drawn
// from, and checked against, seven photographs on Wikimedia Commons, named
// here. Nothing is lettered on the side (the SRT emblem is on the front
// face only, and is not drawn).
//
// The photographs (all https://commons.wikimedia.org/wiki/File:...):
//   "SRTRedline_HitachiClass1000.jpg" and "SRTRedline_1000series_
//     WiteePhotography._(Clopped).jpg" — a 1000 series set on test at
//     Rangsit, June 2021, the long side seen at an angle;
//   "SRTRedline_2000series_WiteePhotography._For_wikipedia.jpg" — a 2000
//     series set at Bang Bamru, May 2021, front three-quarter from above;
//   "SRT_Dark_Red_Line_at_Rangsit_station.jpg" — two cabs close up, Nov 2021;
//   "SRT_Light_Red_Line_at_Taling_Chan_Railway_Station.jpg" — a cab close
//     up, Feb 2023;
//   "Thailand_Railways_Bangkok_Red_Line_1000,_Thung_Song_Hong_(20240629a)_
//     (54222438681).jpg" — a set on the viaduct, June 2024, the side at an
//     angle, two pantographs raised;
//   "SRT_Red_Line_EMU.jpg" — a set near Lak Hok from above, Aug 2021.
//
// What is from the photographs: a silver-white body; a black front from
// the lamps to the roof (the windshield and its surround); a red lower
// nose over a pale bumper; the red sweeping up the cab's side behind the
// black to a red stripe along the roof's edge; a red band along the side
// that covers the lower part of the windows' height and a little below
// them, crossing the doors; a narrow cab door; three double doors a side,
// each leaf with a tall narrow window; one wide window between each pair
// of doors and a narrow one at a car's inner end; pale roof equipment;
// grey single-arm pantographs; grey equipment under the floor.
//
// The honest caveats:
//   None of the photographs is a true side elevation, so the windows' and
//     doors' exact places and widths, the roof equipment, what hangs under
//     the floor and the car length (20 m, the figure usually published)
//     are Trainsheet's reading, not measurements.
//   The 1000 and 2000 series cannot be told apart in these photographs
//     except by their length, so both are drawn alike: six cars for the
//     1000 series, four for the 2000 series (the photographs' own captions
//     give those formations; the Thung Song Hong photograph, captioned
//     "1000", shows four cars).
//   Which cars carry the pantographs is a reading of the Thung Song Hong
//     photograph (one on each car next to an end car); the intermediate
//     cars' doors and windows follow the end car's.
//   The timetable (OTP's Namtang GTFS) names no rolling stock and numbers
//     no trains, so the series-to-line assignment is a judgement, labeled
//     as typical: see TYPICAL below.
//
//   VERIFIED after writing (23 Nov 2026): node --check passes; TYPICAL run
//     over all 259 srtred runs through the real consist.js, t.route the
//     line's name — 0 failures, 0 nulls (169 Dark Red Line runs → the
//     six-car 1000 series, 90 Light Red Line runs → the four-car 2000
//     series); the end and intermediate cars and both consists rendered
//     and looked at beside the photographs (what that pass found is in the
//     build's STATE.md). Renders and the script: the build's work/verify-c1/.

import { rect, circle, path, underframe, pantograph } from "../carart.js?v=dev";
import { unit, hvac } from "./czechia.cars.js?v=dev";

const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 3, depth = 1.2) => underframe(a, b, top, { depth, boxes: k, tanks: false });
const greyPan = (x, roof) => pantograph(x, roof, { up: true, facing: -1 }).replaceAll("currentColor", "#5b6168");

const RL = { body: "#e6e7e5", red: "#d8222b", black: "#17191c", roof: "#c5c9cc", door: "#e1e3e2", lamp: "#fff4cf" };
const G = { roof: 13.0, sill: 3.6 };
// A fairly upright front: a bumper, a short vertical lower nose, then the
// windshield raked back to the roof.
const NOSE = [[1.5, 3.6], [0.7, 4.4], [0.6, 6.6], ["q", 0.65, 7.4, 1.3, 8.0], [3.7, 12.2], ["q", 4.2, 13.0, 6.2, 13.0]];
const BAND = [6.85, 2.75];   // the red band: its foot and its height
const WIN = { y: 7.45, h: 3.5 };
function paint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, RL.body], [12.25, 3, RL.roof], [11.7, 0.55, RL.red]]) + rect(cab ? 6.7 : -1, BAND[0], L + 2, BAND[1], RL.red);
    if (cab) {
      // Body colour over the stripe and band ahead of the red sweep.
      s += path("M-1 3L-1 13.5L10.3 13.5L6.7 7.0L6.7 3Z", RL.body) +
        // The red lower nose, sweeping up the cab's side to the roof stripe.
        path("M-1 4.95L5.2 4.95Q8.0 5.6 9.2 7.6L12.2 12.25L12.2 13.5L8.7 13.5L8.7 12.5L5.7 7.75L-1 7.75Z", RL.red) +
        // The black of the front, from the lamps to the roof.
        path("M-1 13.5L8.7 13.5L8.7 12.5L5.7 7.75L-1 7.75Z", RL.black) +
        // The white wedge between the sweep and the band, above the band.
        path(`M10.0 ${BAND[0] + BAND[1]}L11.6 ${BAND[0] + BAND[1]}L12.9 11.7L11.8 11.7Z`, RL.body);
    }
    return s;
  };
}
const dbl = (x) => ({ x, w: 5.0, y0: G.sill, y1: 11.3, leaves: 2, glassY: 0.44, glassH: 0.46, grabs: false, fill: "rgba(255,255,255,0.14)" });
const wide = (xs) => ({ xs, y: WIN.y, w: 9.0, h: WIN.h, r: 0.3 });
const slim = (xs) => ({ xs, y: WIN.y, w: 2.4, h: WIN.h, r: 0.25 });
const roofKit = (L) => hvac(L * 0.2, G.roof, 13, 0.8) + hvac(L * 0.6, G.roof, 13, 0.8);

const cabCar = (c) => unit(c, { roof: G.roof, sill: G.sill, nose: NOSE, rake: [[1.3, 8.0], [3.7, 12.2]], depth: 2.6, cabLen: 13, lampY: 6.3, bare: true,
  // Behind the cab door: a door, a wide window, a door, a wide window, a
  // door, a narrow window.
  rows: [wide([22.3, 43.3]), slim([62.6])], doors: [dbl(15.5), dbl(36.5), dbl(57.0)],
  trucks: [11.0, c.L - 9.5], wheel: 34, paint: paint(true), surround: RL.black,
  cab: () =>
    // The lamp cluster in black at the corner, on the red.
    rect(0.75, 5.5, 1.0, 1.7, RL.black, 0, 'rx="0.2"') + circle(1.25, 6.75, 0.3, RL.lamp) + circle(1.25, 6.0, 0.28, "#d8dde2") +
    // The narrow cab door, in the body colour, with its window.
    rect(12.3, 4.0, 2.1, 7.4, RL.door, 0.45, 'rx="0.25"') + rect(12.85, 7.6, 1.0, 3.2, "#262c33", 0, 'rx="0.15"') +
    // The dark coupler pocket in the bumper.
    rect(0.8, 3.6, 1.3, 1.2, "#3a3f45", 0, 'rx="0.2"'),
  extra: (cc, g) => roofKit(g.L) + boxes(20, g.L - 16, G.sill, 4) });
const midCar = (c) => unit(c, { roof: G.roof, sill: G.sill,
  // A judgement: the end car's layout carried through (see the header).
  rows: [slim([2.6, c.L - 5.0]), wide([16.5, 38.3])], doors: [dbl(8.6), dbl(30.3), dbl(52.0)],
  trucks: [9.5, c.L - 9.5], wheel: 34, paint: paint(false),
  // A pantograph on each car next to an end car (a reading).
  extra: (cc, g) => (c.index === 1 || c.index === c.count - 2 ? greyPan(c.index === 1 ? 12 : g.L - 12, G.roof) + hvac(g.L * 0.42, G.roof, 13, 0.8) : roofKit(g.L)) +
    boxes(16, g.L - 16, G.sill, 4) });

// ---------- Tables ----------

export const TYPES = {
  srtred1000Cab: { name: "Hitachi AT100 1000 series end car", kind: "emu" },
  srtred1000Mid: { name: "Hitachi AT100 1000 series intermediate car", kind: "emu" },
  srtred2000Cab: { name: "Hitachi AT100 2000 series end car", kind: "emu" },
  srtred2000Mid: { name: "Hitachi AT100 2000 series intermediate car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers: 20 m a car, the figure usually published; the end
// car a little longer for its nose (a judgement).
export const MODELS = {
  srtred1000Cab: M(cabCar, 67.0, true),
  srtred1000Mid: M(midCar, 65.6, false, byIndex),
  srtred2000Cab: M(cabCar, 67.0, true),
  srtred2000Mid: M(midCar, 65.6, false, byIndex),
};

const set = (label, ...units) => ({ label, units });
const SET_1000 = set("Typical: a six-car Hitachi AT100 1000 series unit (a judgement: the timetable names no stock; the six-car sets are the Dark Red Line's)",
  ["srtred1000Cab", 1], ["srtred1000Mid", 4], ["srtred1000Cab", 1]);
const SET_2000 = set("Typical: a four-car Hitachi AT100 2000 series unit (a judgement: the timetable names no stock; the four-car sets are the Light Red Line's)",
  ["srtred2000Cab", 1], ["srtred2000Mid", 2], ["srtred2000Cab", 1]);

// The timetable (OTP's Namtang GTFS) names no rolling stock and its trains
// have no numbers: a run's key is only its direction and first departure,
// and the same key can hold a Dark Red run and a Light Red run ("0-1500"
// does). So a train is placed by its LINE alone, never by its key: "Light
// Red Line" is the four-car 2000 series; "Dark Red Line" (and anything not
// placed, the Dark Red Line being 169 of the 259 runs) the six-car 1000
// series. TYPICAL never returns null.
export const TYPICAL = {
  srtred: (t = {}) => (/light\s*red/i.test(String(t.route || t.line || "")) ? SET_2000 : SET_1000),
};

const CM = "https://commons.wikimedia.org/wiki/File:";
const f1000 = { model: "Hitachi AT100 (SRT 1000 series)", type: "Electric multiple unit", builder: "Hitachi", built: "2019–2020", fleet: "Six-car sets", lengthFt: 65.6,
  source: `${CM}SRTRedline_HitachiClass1000.jpg` };
const f2000 = { model: "Hitachi AT100 (SRT 2000 series)", type: "Electric multiple unit", builder: "Hitachi", built: "2019–2020", fleet: "Four-car sets", lengthFt: 65.6,
  source: `${CM}SRTRedline_2000series_WiteePhotography._For_wikipedia.jpg` };
const END = "silver-white, its front black from the lamps to the roof over a red lower nose, the red sweeping up the cab's side to a red stripe along the roof's edge, and a red band along the side across the lower part of the windows and the three double doors.";
const MID = "in the same silver-white with the red band across the windows and doors and the red stripe along the roof's edge. No photograph is a true side view, so its doors and windows follow the end car's, a judgement; that the cars next to the end cars carry the pantographs is a reading of a photograph at Thung Song Hong.";
export const FACTS = {
  srtred1000Cab: { ...f1000, about: `An end car of a Hitachi AT100 1000 series, the six-car electric unit of the Dark Red Line: ${END} Drawn from photographs of a set on test at Rangsit in 2021 and in service since. Drawing it on every Dark Red Line train is a judgement: the timetable names no stock.` },
  srtred1000Mid: { ...f1000, about: `An intermediate car of a Hitachi AT100 1000 series, ${MID}` },
  srtred2000Cab: { ...f2000, about: `An end car of a Hitachi AT100 2000 series, the four-car electric unit of the Light Red Line: ${END} The photographs do not tell it from the 1000 series except by the set's length, so the two are drawn alike. Drawing it on every Light Red Line train is a judgement: the timetable names no stock.` },
  srtred2000Mid: { ...f2000, about: `An intermediate car of a Hitachi AT100 2000 series, ${MID}` },
};
