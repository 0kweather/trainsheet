// Airport Rail Link's cars (scripts/railroads/thailand.py, agency "arl"):
// the Siemens Desiro-family electric units of Bangkok's Phaya Thai–
// Suvarnabhumi Airport line, in their two liveries. Trainsheet's own side
// views at the shared scale (js/carart.js), drawn from, and checked
// against, seven photographs on Wikimedia Commons, named here. The
// lettering is drawn here (no logo files).
//
// The photographs (all https://commons.wikimedia.org/wiki/File:...):
//   blue and white (the City Line sets):
//     "ARL_Bangkok_CityLine1.JPG" — a new set at Wegberg-Wildenrath, Aug
//       2007, the side at an angle, three cars, "CITY LINE" on each;
//     "BKKARL_Siemens_Desiro_UK_Class260.2_WiteePhotography._For_wikipedia.jpg"
//       — set CITY01, Feb 2021; "Airport_Rail_Link_(7427045236).jpg" — a
//       cab at Phaya Thai, June 2010; "Станция_Пхайятай_(20260416124857).jpg"
//       — the side at a platform, Apr 2026;
//   red and white (the former Express sets):
//     "ARL_Bangkok_Express1.JPG" — a new set at Wegberg-Wildenrath, Aug
//       2007, the side at an angle, four cars, "EXPRESS" on each;
//     "Airport_Rail_Link_train_at_Phaya_Thai_Station.jpg" — a red set in
//       ordinary service, May 2022; "Bangkok_Airport_Rail_Link_
//       (31065894516).jpg" — a red-nosed set, Nov 2016, its sides wrapped
//       in advertising (the wrap is not drawn).
//
// What is from the photographs: a white body; a rounded front whose black
// windshield panel runs from the lamps to the roof; the lower nose in the
// livery's colour with round lamps; that colour sweeping up the cab's side
// behind the black to a stripe along the top of the side, and a second
// stripe low along the side; a grey wedge behind the sweep; a white cab
// door; the windows in a dark grey band; white double doors; on the end
// car one window, a door, four windows, a door and two windows (counted
// in both Wegberg photographs); "CITY LINE" / "EXPRESS" under the four
// windows; a dark grey front skirt; tall pale equipment boxes on the roof.
//
// The honest caveats:
//   The timetable (OTP's Namtang GTFS) names no rolling stock and numbers
//     no trains. It does NOT say which set runs which departure, and
//     nothing here claims to know. Both liveries are in service (the red
//     set at Phaya Thai, 2022; the blue set there, 2026), so both are
//     shown, by a display rule only: a run whose first departure falls in
//     an odd-numbered hour (05, 07 … 23) is drawn red and white, every
//     other run — and any train whose key is not known — blue and white.
//     The rule is deterministic and arbitrary; it is not a roster.
//   The formations are the Wegberg photographs' (three blue cars, four red
//     cars, as delivered in 2007); today's formations may differ.
//   None of the photographs is a true side elevation: the windows' and
//     doors' exact places, the intermediate car's layout (the end car's
//     carried through), the roof equipment, the car length (about 20.4 m)
//     and which car carries the pantograph (none is clearly seen; one is
//     drawn on the car behind the leading car) are Trainsheet's reading.
//   The red set photographed in 2022 still shows lettering on its side
//     too small to read; "EXPRESS" is drawn as in 2007. The Express
//     service itself no longer runs: these sets work ordinary trains.
//
//   VERIFIED after writing (23 Nov 2026): node --check passes; TYPICAL run
//     over all 248 arl runs through the real consist.js, t built as the
//     app builds it — 0 failures, 0 nulls; the distribution the rule gives
//     is in the build's STATE.md; both liveries' end and intermediate cars
//     and consists rendered and looked at beside the photographs. Renders
//     and the script: the build's work/verify-c1/.

import { rect, circle, path, underframe, pantograph, win } from "../carart.js?v=dev";
import { unit, letters, hvac } from "./czechia.cars.js?v=dev";

const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 3, depth = 1.2) => underframe(a, b, top, { depth, boxes: k, tanks: false });
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => Math.round((from + i * pitch) * 10) / 10);

const AR = { white: "#f1f1ee", grey: "#6d7379", wedge: "#7d8389", skirt: "#565c63", black: "#15171a", roof: "#cfd2d3", lamp: "#fff4cf", ink: "#1c1f2b" };
const LIV = {
  city: { col: "#2337a6", word: "CITY LINE", ink: "#1b2350", opts: { weight: 700, spacing: "0.04em" } },
  express: { col: "#d9232b", word: "EXPRESS", ink: "#1d1e20", opts: { weight: 700, style: "italic" } },
};
const G = { roof: 13.0, sill: 3.7 };
// A rounded front: bulging forward at the lamps, the windshield raked back.
const NOSE = [[1.7, 3.7], [1.0, 4.5], ["q", 0.3, 6.3, 1.2, 8.3], [3.4, 11.9], ["q", 4.2, 13.0, 6.4, 13.0]];
const STRIPE = { top: [11.45, 0.6], low: [4.95, 0.7] };
function paint(liv, cab) {
  const col = LIV[liv].col;
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, AR.white], [12.3, 3, AR.roof]]) +
      rect(cab ? 13.4 : -1, STRIPE.top[0], L + 2, STRIPE.top[1], col) + rect(cab ? 9.6 : -1, STRIPE.low[0], L + 2, STRIPE.low[1], col) +
      // The dark grey band the windows sit in.
      rect(cab ? 16.4 : 1.6, 6.9, L - (cab ? 18.0 : 3.2), 4.1, AR.grey, 0, 'rx="0.3"');
    if (cab) {
      // The low stripe's slanted front end.
      s += path(`M8.6 ${STRIPE.low[0]}L9.7 ${STRIPE.low[0]}L9.7 ${STRIPE.low[0] + STRIPE.low[1]}L9.2 ${STRIPE.low[0] + STRIPE.low[1]}Z`, col) +
        // The dark grey skirt under the nose.
        path("M-1 0L-1 4.35L6.6 4.35L7.4 3.7L7.4 0Z", AR.skirt) +
        // The lower nose in the livery's colour, sweeping up the cab's side
        // to the stripe along the top of the side.
        path(`M-1 4.35L5.6 4.35Q8.4 4.9 9.9 7.9L11.9 ${STRIPE.top[0]}L13.6 ${STRIPE.top[0]}L13.6 ${STRIPE.top[0] + STRIPE.top[1]}L10.5 ${STRIPE.top[0] + STRIPE.top[1]}L7.9 8.6Q7.2 7.6 5.6 7.5L-1 7.5Z`, col) +
        // The black windshield panel, from the lamps' top to the roof.
        path("M-1 13.5L6.9 13.5L6.9 12.6L3.5 8.0L-1 8.0Z", AR.black) +
        // The grey wedge behind the sweep.
        path("M10.3 6.3L13.1 6.3L13.1 11.0L12.5 11.0Z", AR.wedge);
    }
    return s;
  };
}
const dbl = (x) => ({ x, w: 4.6, y0: G.sill, y1: 11.3, leaves: 2, glassY: 0.44, glassH: 0.44, grabs: false, fill: AR.white });
const wins = (xs, w = 4.6) => ({ xs, y: 7.3, w, h: 3.3, r: 0.35 });
const bigBox = (x, w) => hvac(x, G.roof, w, 1.5).replaceAll("#a9b0b8", "#d9dcdd");

const cabCar = (liv) => (c) => unit(c, { roof: G.roof, sill: G.sill, nose: NOSE, rake: [[1.2, 8.3], [3.4, 11.9]], depth: 2.5, cabLen: 16, lampY: 6.2, bare: true,
  // One window, a door, four windows, a door, two windows.
  rows: [wins([17.3, ...seq(29.6, 5.35, 4)]), wins([57.8, 61.9], 3.4)], doors: [dbl(23.3), dbl(51.6)],
  trucks: [10.5, c.L - 9.5], wheel: 33, paint: paint(liv, true), surround: AR.black,
  cab: () =>
    // The round lamps on the coloured nose.
    circle(1.7, 6.5, 0.48, AR.lamp, 0.3) + circle(2.9, 5.95, 0.32, "#2c3338", 0.25) + circle(2.9, 6.85, 0.3, "#2c3338", 0.25) +
    // The white cab door with its window.
    rect(13.7, 4.1, 2.2, 7.3, AR.white, 0.45, 'rx="0.3"') + win(14.25, 7.5, 1.1, 3.0, 0.15),
  extra: (cc, g) => letters(cc, 40.3, 6.15, 1.05, LIV[liv].word, LIV[liv].ink, LIV[liv].opts) +
    bigBox(22, 22) + boxes(20, g.L - 16, G.sill, 3) });
const midCar = (liv) => (c) => unit(c, { roof: G.roof, sill: G.sill,
  // A judgement: two windows, a door, five windows, a door, two windows.
  rows: [wins([2.6, 6.9], 3.4), wins(seq(18.2, 5.6, 5)), wins([c.L - 10.3, c.L - 6.0], 3.4)], doors: [dbl(11.7), dbl(c.L - 16.3)],
  trucks: [9.5, c.L - 9.5], wheel: 33, paint: paint(liv, false),
  extra: (cc, g) => letters(cc, g.L / 2, 6.15, 1.05, LIV[liv].word, LIV[liv].ink, LIV[liv].opts) +
    // The pantograph: on the car behind the leading car (a reading).
    (c.index === 1 ? pantograph(9, G.roof, { up: true, facing: -1 }).replaceAll("currentColor", "#5b6168") + bigBox(24, 22) : bigBox(g.L / 2 - 14, 28)) +
    boxes(16, g.L - 16, G.sill, 3) });

// ---------- Tables ----------

export const TYPES = {
  arlCityCab: { name: "Desiro end car, blue and white", kind: "emu" },
  arlCityMid: { name: "Desiro intermediate car, blue and white", kind: "emu" },
  arlExpressCab: { name: "Desiro end car, red and white", kind: "emu" },
  arlExpressMid: { name: "Desiro intermediate car, red and white", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers: about 20.4 m a car (the Desiro UK's), a judgement.
export const MODELS = {
  arlCityCab: M(cabCar("city"), 67.0, true),
  arlCityMid: M(midCar("city"), 65.6, false, byIndex),
  arlExpressCab: M(cabCar("express"), 67.0, true),
  arlExpressMid: M(midCar("express"), 65.6, false, byIndex),
};

const set = (label, ...units) => ({ label, units });
const NOTE = "the timetable names no stock and does not say which set runs which train: the livery shown follows a display rule (red and white for first departures in odd-numbered hours, blue and white otherwise), not a roster";
const CITY_SET = set(`Typical: a three-car Siemens Desiro unit in the blue and white City Line livery (a judgement: ${NOTE})`,
  ["arlCityCab", 1], ["arlCityMid", 1], ["arlCityCab", 1]);
const EXPRESS_SET = set(`Typical: a four-car Siemens Desiro unit in the red and white former Express livery (a judgement: ${NOTE})`,
  ["arlExpressCab", 1], ["arlExpressMid", 2], ["arlExpressCab", 1]);

// The timetable names no rolling stock, numbers no trains and does not say
// which set runs which departure. Both liveries run, so both are shown, by
// a display rule and nothing more: the run's key (its direction and first
// departure, "0-1506", carried in t.id as "arl:0-1506") gives the hour of
// its first departure; an odd hour is drawn red and white, an even hour —
// and any train whose key cannot be read — blue and white. TYPICAL never
// returns null.
const hourOf = (t) => {
  const m = /(?:^|:)\d-(\d{2})\d{2}(?:\D|$)/.exec(String(t.id ?? t.key ?? ""));
  return m ? Number(m[1]) : null;
};
export const TYPICAL = {
  arl: (t = {}) => {
    const h = hourOf(t);
    return h != null && h % 2 === 1 ? EXPRESS_SET : CITY_SET;
  },
};

const CM = "https://commons.wikimedia.org/wiki/File:";
const base = { model: "Siemens Desiro (UK Class 360/2 family)", type: "Electric multiple unit", builder: "Siemens", built: "2007", topSpeedMph: 99, lengthFt: 66.9 };
const fCity = { ...base, fleet: "The blue and white sets, built for the City Line", source: `${CM}ARL_Bangkok_CityLine1.JPG` };
const fExp = { ...base, fleet: "The red and white sets, built for the former Express service", source: `${CM}ARL_Bangkok_Express1.JPG` };
const RULE = "The timetable does not say which set runs which train: the livery shown on a train follows a fixed display rule (the hour of its first departure), not a roster.";
export const FACTS = {
  arlCityCab: { ...fCity, about: `An end car of a Siemens Desiro unit of the Airport Rail Link in the blue and white City Line livery: white, a rounded front with a black windshield panel over a blue lower nose, the blue sweeping up the cab's side to a stripe along the top of the side, a second blue stripe low on the side, the windows in a dark grey band and white double doors. One window, a door, four windows, a door and two windows are counted from a photograph of a new set at Wegberg-Wildenrath in 2007. ${RULE}` },
  arlCityMid: { ...fCity, about: `An intermediate car of a blue and white Airport Rail Link Desiro unit, with the same two blue stripes and grey window band. No photograph shows it squarely, so its doors and windows follow the end car's, a judgement; so is the pantograph's place. ${RULE}` },
  arlExpressCab: { ...fExp, about: `An end car of a Siemens Desiro unit of the Airport Rail Link in the red and white livery of the former Express service: the same body as the blue sets with the nose, the sweep and the two stripes in red, and EXPRESS on the side as delivered in 2007. The Express service no longer runs; a red set was photographed in ordinary service at Phaya Thai in 2022. ${RULE}` },
  arlExpressMid: { ...fExp, about: `An intermediate car of a red and white Airport Rail Link Desiro unit, with the same two red stripes and grey window band. No photograph shows it squarely, so its doors and windows follow the end car's, a judgement; so is the pantograph's place. ${RULE}` },
};
