// Adelaide Metro's trains (scripts/railroads/adelaidemetro.py). Its feed's
// vehicle label is the lead railcar's or set's number (3013, 4002), which
// js/railroads/adelaidemetro.js passes as the train's one known car: the
// number picks the class, the rest is what that class runs as. Drawn from
// each class's published dimensions; liveries simplified from the current
// red and blue scheme.

import { bilevel, married } from "../carmodels.js?v=dev";
import { C, rect, path, poly, win, pantograph, underframe, flutes, slats } from "../carart.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
const AM = { white: "#eceef0", black: "#1d2024", red: "#d2232a", blue: "#1f3f8a", roof: "#b4bac1", skirt: "#3a3f45" };

// --- Bombardier (later Alstom) 4000 class, built at Dandenong, Victoria:
// 22 sets in 2013-15 and 12 more in 2019-23 (4001-4034). Three cars,
// DM-T-DM, the driving cars 25.255 m and the trailer 24.71 m with the
// pantograph; two double doors a side on each car; a raked nose. 25 kV,
// broad gauge. Pale silver-white, a black window band, a red band under
// it that sweeps up to the windshield on the driving cars, a blue skirt.
const E4K = { roof: 13.2, sill: 3.7, cornerR: 1.0, end: 0.6, trucks: { centers: 58.0, wb: 8.5, d: 34 }, diaphragm: [4.0, 12.0], badge: false,
  nose: [[1.5, 3.7], [0.9, 4.9], ["q", 0.8, 6.7, 1.5, 7.7], [4.0, 12.1], ["q", 4.8, 13.2, 6.6, 13.2]], cabLen: 7,
  cab: () => path(poly([[1.9, 7.9], [4.2, 11.7], [5.6, 11.7], [5.6, 7.9]]), C.glass) + win(6.6, 7.8, 1.6, 2.7, 0.3) };
function paint4k(c, g, nose) {
  const L = g.L;
  let s = rect(0, 0, L, 17, AM.white) + rect(0, 12.4, L, 2, AM.roof) + rect(0, 0, L, 4.5, AM.blue) + rect(0, 5.1, L, 1.0, AM.red) +
    rect(nose ? 8.5 : 0, 7.0, L, 3.6, AM.black, 0, 'rx="0.4"');
  if (nose) s += path("M0 5.1L14 5.1L14 6.1L8.0 6.1Q5.0 6.1 3.8 9.0L2.2 13.2L0 13.2Z", AM.red) + path("M0 0L3.0 0L3.0 4.5L1.2 7.4L0 7.4Z", AM.blue) +
    path("M8.6 7.0L8.6 13.2L5.2 13.2Q3.4 10.6 2.6 8.4Q3.0 7.0 4.4 7.0Z", AM.black);
  return s;
}
const door4k = (x) => ({ x, w: 4.6, y0: 3.8, y1: 10.8, leaves: 2, glassY: 0.42, glassH: 0.42 });
const rows4k = (xs) => [{ xs, y: 7.2, w: 4.6, h: 3.2, r: 0.4 }];
const e4kCar = (c) => bilevel({ ...c, cabL: true }, { ...E4K, paint: (c, g) => paint4k(c, g, true),
  rows: rows4k([9.4, 14.6, ...seq(27.6, 5.6, 6), 67.4, 72.8]), doors: [door4k(21.4), door4k(61.6)], roofItems: [[28, 14, 0.5]] });
const e4kMid = (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...E4K, nose: null, cab: null, paint: (c, g) => paint4k(c, g, false),
  rows: rows4k([2.0, 7.6, 12.8, ...seq(25.6, 5.5, 6), 64.8, 70.2, 75.6]), doors: [door4k(19.2), door4k(58.6)],
  roofItems: [[48, 12, 0.5]], extra: (c, g) => pantograph(14, 13.2) });

// --- Comeng and Clyde Engineering 3000 class (3001-3030) and 3100 class
// (3101-3140), built 1987-96: 25.77 m diesel railcars in stainless steel,
// the 3000s single cars with a cab at each end, the 3100s married pairs
// with a cab at the outer end only. Two double doors a side, a flat front
// with two big windshield panes. Converted to hybrid drive; 50 cars remain
// (3009-3030, 3113-3140) on the Belair, Grange, Outer Harbor and Port Dock
// lines. Fluted stainless, a red band under the windows over a thinner
// blue one; the cab corners painted red.
const DIESEL = { roof: 13.0, sill: 3.8, cornerR: 1.1, end: 0.6, trucks: { centers: 60.0, wb: 8.5, d: 34 }, diaphragm: [4.0, 11.9], badge: false, cabLen: 4.5,
  doors: [{ x: 21.0, w: 4.6, y0: 3.9, y1: 10.7, leaves: 2, glassY: 0.45, glassH: 0.4 }, { x: 58.9, w: 4.6, y0: 3.9, y1: 10.7, leaves: 2, glassY: 0.45, glassH: 0.4 }],
  rows: [{ xs: [6.0, 12.2, ...seq(28.0, 5.8, 5), 66.8, 73.0], y: 7.3, w: 4.4, h: 2.9, r: 0.35 }],
  roofItems: [[30, 9, 0.6], [46, 9, 0.6]],
  paint: (c, g) => {
    const L = g.L;
    return rect(0, 0, L, 17, "#d5d9de") + flutes(0, L, 4.0, 6.0, 0.27) + flutes(0, L, 10.7, 12.0, 0.27) + rect(0, 12.0, L, 2, C.steelShade) +
      rect(0, 6.1, L, 0.9, AM.red) + rect(0, 5.6, L, 0.35, AM.blue);
  },
  // The cab: its corner in red, the windshield's edge and the cab side window.
  cab: (c, { x0 }) => rect(x0, 3.8, 1.1, 9.0, AM.red) + rect(x0, 7.5, 0.5, 3.4, C.glass) + win(x0 + 1.6, 7.3, 2.4, 3.1, 0.3),
  extra: (c, g) => underframe(22, 62, 3.8, { depth: 1.7, boxes: 3 }) + slats(40, 13.0, 4, 0.6, 0.35, "rgba(0,0,0,0.35)"),
};
const adl3000 = (c) => bilevel({ ...c, cabL: true, cabR: true }, DIESEL);
const adl3100 = married((c) => bilevel(c, DIESEL));

export const TYPES = {
  adl4000Car: { name: "4000 class driving car", kind: "emu" },
  adl4000Mid: { name: "4000 class trailer", kind: "emu" },
  adl3000: { name: "3000 class railcar", kind: "emu" },
  adl3100: { name: "3100 class railcar", kind: "emu" },
};
const M = (draw, len, oneEnd = false) => ({ draw, len, oneEnd, variant: null });
export const MODELS = {
  adl4000Car: M(e4kCar, 82.86, true), adl4000Mid: M(e4kMid, 81.07),
  adl3000: M(adl3000, 84.55), adl3100: M(adl3100, 84.55),
};
export const FLEETS = {
  adelaidemetro: [[4001, 4034, "adl4000Car"], [3001, 3030, "adl3000"], [3101, 3140, "adl3100"]],
};
const set4k = [["adl4000Car", 1], ["adl4000Mid", 1], ["adl4000Car", 1]];
export const TYPICAL = {
  // The electrified lines (Seaford, Flinders, Gawler) have the 4000 class,
  // one set or two; the others the diesel railcars, two to four cars.
  adelaidemetro: (t, reported) => {
    const electric = reported ? reported === "adl4000Car" : /Seaford|Flinders|Gawler/.test(t.route || "");
    if (electric) return { label: "4000 class three-car electric set (at busy times two coupled)", units: set4k };
    if (reported === "adl3000") return { label: "3000 class railcars, coupled to make two to four cars", units: [["adl3000", 2]] };
    return { label: "3100 class railcar pairs (some trains 3000 class single cars)", units: [["adl3100", 2]] };
  },
};

const WIKI = "https://en.wikipedia.org/wiki/";
const E4K_FACTS = { model: "4000 class", type: "Electric multiple unit", builder: "Bombardier Transportation, later Alstom (Dandenong)", built: "2013–2015, 2019–2023",
  fleet: "34 three-car sets (4001–4034)", topSpeedMph: 68.4, powerHp: 2146, seats: 240, lengthFt: 246.8,
  about: "Adelaide's electric trains, built in Victoria in two batches: 22 sets for the Seaford and Flinders lines, then 12 more when the Gawler line was electrified in 2022. Each set is three cars, and two can run coupled.",
  source: `${WIKI}Adelaide_Metro_4000_class` };
const DIESEL_FACTS = (k) => ({ model: k === "adl3000" ? "3000 class" : "3100 class", type: "Diesel railcar (hybrid)", builder: "Comeng and Clyde Engineering", built: "1987–1996",
  fleet: k === "adl3000" ? "30 built (3001–3030), 22 in service" : "40 built (3101–3140), 28 in service", topSpeedMph: 56,
  powerHp: k === "adl3000" ? 1046 : 2092, lengthFt: 84.5,
  about: k === "adl3000"
    ? "Stainless-steel diesel railcars with a cab at each end, so one car can run alone; most trains couple two to four. Converted to hybrid drive, they run the lines not yet electrified until their planned retirement around 2030."
    : "The married-pair version of Adelaide's stainless diesel railcars, each car with a cab at its outer end. Converted to hybrid drive, they run the Belair, Grange, Outer Harbor and Port Dock lines.",
  source: `${WIKI}3000_class_railcar` });
export const FACTS = {
  adl4000Car: E4K_FACTS, adl4000Mid: E4K_FACTS,
  adl3000: DIESEL_FACTS("adl3000"), adl3100: DIESEL_FACTS("adl3100"),
};
