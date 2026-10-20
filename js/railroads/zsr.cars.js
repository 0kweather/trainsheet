// Slovakia's railroads' cars (scripts/railroads/zsr.py): ZSSK, RegioJet and
// Leo Express. The feed's vehicle ids are train numbers, so every train is
// drawn as what usually runs on its kind of train and its line, labeled as
// typical. The bodies shared with Czechia (czechia.cars.js) run on both
// sides of the border in each operator's paint; the Slovak classes are
// drawn here, as Trainsheet's own side views from published dimensions and
// photographs at the shared scale (js/carart.js).

import { TYPES as CZ_TYPES, MODELS as CZ_MODELS, FACTS as CZ_FACTS, unit, euroLoco, twinEnded, buffers, hvac, exhaust, tank, letters, zsLogo, ZS, axle } from "./czechia.cars.js?v=dev";
import { C, rect, path, line, lines, poly, truck, slats, underframe } from "../carart.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
const boxes = (a, b, top, k = 3, depth = 1.3) => underframe(a, b, top, { depth, boxes: k, tanks: false });
const plug = (x, sill, top, w = 4.4) => ({ x, w, y0: sill, y1: top, leaves: 2, glassY: 0.4, glassH: 0.45 });
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");

// The Czech types these railroads run (added under their own keys only once,
// whichever file loads first).
const SHARED = ["czVectron", "czCoach", "czElefant471", "czElefant071", "czElefant971", "czPanter640", "czPanterMid", "czLint", "czFlirtCab", "czFlirtMid",
  "czEso", "czTraxx", "czCjCoach", "czCjCab", "czPendoCab", "czPendoMid"];

// ---------- ZSSK's diesel units ----------

// Regiomover (ŽOS Vrútky, ZSSK 861.001-039 three-car and 861.101-114
// two-car, 2011-2021; sk.wikipedia "Motorová jednotka 861"): 57.59 m over the
// couplers as three sections (the two-car 861.1 about 41 m), 4.3 m tall,
// 2.85 m wide, B'2'2'B': a powered truck under each cab section's outer
// end with its power pack, Jakobs trucks at the joints; a low floor
// between them; a rounded nose under a black wraparound windshield, the
// cab's side window set in a red frame, one double door a side per
// section. Its depots are Nové Zámky, Zvolen and Humenné. ZSSK's paint
// (photographs, 861.005 "Rozália"): white, a red band low along the side
// that rises behind the cab and frames the cab window, a thin red line at
// the roof's edge, a red panel with ZSSK's ring under the windshield, gray
// skirts.
const NOSE_861 = [[1.6, 3.4], [1.1, 5.6], ["q", 1.1, 7.7, 2.5, 9.1], [5.3, 12.9], ["q", 6.3, 14.1, 8.3, 14.1]];
const paint861 = (cab) => (c, g) => {
  let s = bands(g.L, [[0, 20, ZS.white], [12.9, 3, "#b4bac1"], [12.45, 0.45, ZS.red], [3.6, 2.9, ZS.red], [0, 3.6, "#8e959c"]]);
  if (cab) s += path("M6.6 3.6L6.6 12.45L16.0 12.45L16.0 9.8Q16.0 6.5 13.4 6.5L6.6 6.5Z", ZS.red) + rect(8.0, 7.4, 6.4, 4.4, ZS.white, 0, 'rx="0.8"') +
    rect(8.6, 7.9, 5.2, 3.5, C.glass, 0, 'rx="0.5"') + rect(8.75, 9.6, 4.9, 1.0, C.glassLight, 0, 'rx="0.3"') + path("M1.2 5.8Q1.3 7.4 2.3 8.7L4.6 8.7L4.6 5.8Z", ZS.red);
  return s;
};
export const regiomoverCab = (c) => unit(c, { roof: 14.1, sill: 3.4, nose: NOSE_861, rake: [[2.5, 9.1], [5.3, 12.9]], depth: 3.0, cabLen: 16, lampY: 4.6,
  rows: [{ xs: seq(18.6, 5.2, 7), y: 7.2, w: 4.2, h: 3.7, r: 0.4 }], doors: [plug(c.L - 11.4, 3.4, 10.9)], paint: paint861(true), surround: "#16181b",
  doorFill: () => "#e2e5e8",
  extra: (cc, g) => truck(11.0, { wb: 8.2, d: 33, top: 3.4 }) + truck(g.L, { wb: 8.9, d: 30, top: 3.4 }) + boxes(16.0, 26.0, 3.4, 1, 1.3) + tank(26.6, 33.0, 3.4, 1.6) +
    boxes(34.0, 52.0, 3.0, 2, 0.5) + rect(10.0, 14.05, 9.0, 1.0, C.steelDark, 0.4, 'rx="0.3"') + slats(10.6, 14.2, 7.8, 0.65, 0.42, "rgba(0,0,0,0.3)") + exhaust(19.6, 14.1) +
    hvac(32.0, 14.1, 11.0) + zsLogo(cc, 2.9, 7.25, 0.45, "#ffffff", false) + zsLogo(cc, 40.0, 5.0, 0.55, "#ffffff") });
export const regiomoverMid = (c) => unit(c, { roof: 14.1, sill: 3.0,
  rows: [{ xs: seq(3.4, 5.2, 4), y: 7.2, w: 4.2, h: 3.7, r: 0.4 }, { xs: seq(30.4, 5.2, 4), y: 7.2, w: 4.2, h: 3.7, r: 0.4 }], doors: [plug(c.L / 2 - 2.2, 3.0, 10.9)],
  paint: paint861(false), doorFill: () => "#e2e5e8",
  extra: (cc, g) => truck(0, { wb: 8.9, d: 30, top: 3.0 }) + truck(g.L, { wb: 8.9, d: 30, top: 3.0 }) + boxes(6.0, 22.0, 3.0, 2, 0.5) + boxes(32.0, 48.0, 3.0, 2, 0.5) +
    hvac(4.0, 14.1, 11.0) + hvac(38.0, 14.1, 11.0) });

// The 813.1 and 913.1 (ŽOS Zvolen, 2012-2018, rebuilt from 810 railbuses and
// their trailers; cs.wikipedia "Motorová jednotka 813.1"): a motor car and
// a low-floor driving trailer (floor 580 mm) close-coupled, 28.82 m over the
// buffers, each on two single axles, 1'A' + 1'1'; new cab ends with a big
// windshield in a gray mask, a double door a side in each car. ZSSK runs
// them from Zvolen and from Poprad to Plaveč and Muszyna. Its paint
// (photographs): red, the windows in a dark gray wedge that widens toward
// the trailer, the cab face gray, a yellow buffer beam.
const NOSE_813 = [[0.95, 3.9], [0.75, 7.4], ["q", 0.8, 10.8, 1.9, 11.8], ["q", 2.5, 12.2, 3.6, 12.2]];
const paint813 = (trailer) => (c, g) => bands(g.L, [[0, 20, ZS.red], [11.2, 3, "#9aa1a9"], [0, 4.2, "#2a2d31"]]) +
  path(`M5.0 6.8L${g.L + 1} ${trailer ? 6.2 : 6.6}L${g.L + 1} 10.9L5.0 10.6Z`, "#4a4e55") + path("M-1 4.2L-1 12.3L3.0 12.3L3.0 4.2Z", "#62676e") + rect(-1, 3.9, 3.6, 0.5, "#f5c400");
const car813 = (trailer) => (c) => unit(c, { roof: 12.2, sill: 3.9, drop: trailer ? { a: 14.0, b: c.L - 11.0, y: 2.4 } : null, nose: NOSE_813, rake: [[0.8, 8.6], [1.9, 11.8]], depth: 1.4, cabLen: 3, lampY: 5.4, coupler: "buffers",
  rows: [{ xs: [4.8], y: 7.6, w: 2.6, h: 2.6, r: 0.35 }, { xs: seq(trailer ? 15.0 : 9.2, 4.6, trailer ? 6 : 4), y: 7.3, w: 3.8, h: 3.0, r: 0.35 }],
  doors: [plug(trailer ? 9.4 : c.L - 13.8, trailer ? 2.45 : 4.0, 10.7, 4.0)], paint: paint813(trailer), surround: "#2a2d31", diaphragm: [4.2, 10.6],
  extra: (cc, g) => axle(trailer ? 8.5 : 11.5, 3.9) + axle(g.L - 7.5, 3.9) + (trailer ? boxes(28, 38, 2.4, 1, 0.4) : boxes(17.0, 23.0, 3.9, 1, 1.3) + tank(23.5, 28.5, 3.9, 2.2) + exhaust(22, 12.2)) +
    hvac(trailer ? 26 : 14, 12.2, 8, 0.55) + zsLogo(cc, trailer ? 34 : 26, 5.6, 0.5, "#ffffff") });

// ---------- The Tatra Electric Railway (meter gauge, 1.5 kV DC) ----------

// Stadler GTW 2/6 for the Tatras (ZSSK 425.95, built under licence by ŽOS
// Vrútky with Stadler and Adtranz, 2000-2002; cs.wikipedia "Tatranské
// elektrické železnice"): two low-floor cab sections hung on a short power
// module in the middle that carries the motors and the only powered
// truck, a trailing truck under each cab section's outer end; about 32 m
// over the couplers (13.8 m a cab section, a 4.2 m module) and 3.6 m tall
// on the meter gauge (estimates from Stadler's GTW 2/6 family; ZSSK
// publishes none). Paint (photographs, 425.962 near Poprad): pale gray, a
// red band through the windows, darker gray below, the cab's lower face red.
// The Stadler hybrids (495.95, 5 units from 2021, ordered October 2018 for
// both the TEŽ and the Štrba-Štrbské Pleso rack line): three sections on
// the same plan, longer, red with a white roof and upper side, a white
// line low on the side, black skirts.
const NOSE_GTW = [[1.2, 2.2], [0.9, 4.6], ["q", 0.9, 6.4, 1.9, 7.4], [3.4, 10.4], ["q", 4.0, 11.8, 5.6, 11.8]];
const gtwPaint = (k) => (cab) => (c, g) => k === 495
  ? bands(g.L, [[0, 20, "#d42027"], [9.6, 3, "#f2f3f4"], [3.15, 0.18, "#f2f3f4"], [0, 2.7, "#1d1e20"]]) + (cab ? path("M-1 9.6L5.2 9.6L3.0 6.4L-1 6.4Z", "#f2f3f4") : "")
  : bands(g.L, [[0, 20, "#d8dbde"], [9.7, 3, "#c0c5ca"], [5.4, 4.1, "#d42027"], [0, 4.3, "#7d838a"], [4.3, 0.15, "#f2f3f4"]]) + (cab ? path("M-1 2.2L-1 6.6L3.6 6.6L3.6 2.2Z", "#d42027") : "");
const gtwCab = (k) => (c) => unit(c, { roof: 11.8, sill: 2.2, nose: NOSE_GTW, rake: [[1.9, 7.4], [3.4, 10.4]], depth: 2.4, cabLen: 5, lampY: 3.6,
  rows: [{ xs: [5.6], y: 6.0, w: 2.2, h: 3.2, r: 0.35 }, { xs: seq(9.4, 4.4, k === 495 ? 6 : 5), y: 5.8, w: 3.6, h: 3.4, r: 0.35 }],
  doors: [plug(c.L - 6.4, 2.2, 9.6, 3.6)], paint: gtwPaint(k)(true), surround: "#16181b", diaphragm: [2.4, 9.6], doorFill: () => (k === 495 ? "#e9ebed" : "#d8dbde"),
  extra: (cc, g) => truck(6.0, { wb: 5.9, d: 27, top: 2.2 }) + boxes(14.0, 28.0, 2.2, 2, 0.4) + hvac(12.0, 11.8, 8, 0.6) + zsLogo(cc, 20.0, 3.4, 0.4, "#ffffff", false) +
    letters(cc, 30.0, 3.45, 0.5, k === 495 ? "495.95" : "425.95", "#ffffff", { weight: 600 }) });
// The power module: louvered walls round the corridor, a powered truck
// under it, the pantograph and resistors on its roof.
const gtwPower = (k) => (c) => unit(c, { roof: 12.3, sill: 2.8, rows: [], doors: [], paint: gtwPaint(k)(false), diaphragm: [2.4, 9.6],
  extra: (cc, g) => truck(g.L / 2, { wb: 6.6, d: 30, top: 2.8, kind: "loco" }) + rect(0.9, 5.2, g.L - 1.8, 5.0, "rgba(20,22,25,0.55)", 0.4, 'rx="0.2"') +
    slats(1.1, 5.4, g.L - 2.2, 4.6, 0.32, "rgba(255,255,255,0.2)") + rect(0.8, 12.25, g.L - 1.6, 0.6, C.steelDark, 0.4, 'rx="0.2"') });

// ---------- Locomotives ----------

// ZSSK 757 "Kikimora" (ŽOS Zvolen, 2010-2015, 25 rebuilt from the 750
// "Brejlovec"; cs.wikipedia "Lokomotiva 757"): 16.54 m over the buffers,
// Bo'Bo' with an engine and alternator, about 4.4 m tall; a short nose
// under a cab with two windshield panes and a headlight on the roof's
// edge, louvers high along the machine room and on the roof. It hauls
// Zvolen's express trains to Košice, Banská Bystrica, Vrútky and Žilina,
// Prievidza's to Leopoldov and Humenné's REX trains. Paint (photographs,
// 757.005 at Žilina): red above a white band low on the side, light gray
// below and on the buffer beam, the roof dark gray; the ring on the cab.
const NOSE_757 = [[1.2, 4.1], [1.1, 8.2], [1.5, 8.6], [1.5, 12.6], ["q", 1.6, 13.4, 2.6, 13.4]];
export const loco757 = (c) => euroLoco(c, { roof: 13.4, sill: 4.1, nose: NOSE_757, rake: [[1.5, 9.4], [1.55, 12.4]], centers: 28.5, door: 5.0, wheel: 39, pans: false,
  surround: "#16181b",
  paint: (cc, L) => bands(L, [[0, 20, ZS.red], [12.5, 3, "#5d6269"], [0, 7.4, "#e9ebed"], [0, 4.7, "#b5bbc1"], [7.4, 0.2, "#c7ccd2"]]),
  grilles: [[-(c.L / 2 - 8.6), 9.0, 9.0, 11.6], [-1.6, 9.0, 9.0, 11.6]], grilleFill: "rgba(20,22,25,0.35)",
  under: (cc, L) => tank(L / 2 - 6.0, L / 2 + 6.0, 4.1, 1.5),
  roof2: (cc, L) => rect(8.0, 13.35, L - 16.0, 0.5, "#4a4e55", 0.4, 'rx="0.2"') + slats(9.0, 13.45, L - 18.0, 0.35, 0.4, "rgba(0,0,0,0.35)") + exhaust(L / 2 - 1.2, 13.8) +
    rect(1.4, 13.0, 1.0, 0.8, "#2a2d31", 0.3, 'rx="0.3"'),
  over: (cc, L) => zsLogo(cc, L / 2, 10.2, 0.55, "#ffffff", false) + letters(cc, L / 2, 5.6, 0.45, "757", "#2a2d31", { weight: 700 }) });

export const TYPES = {
  ...Object.fromEntries(SHARED.map((k) => [k, CZ_TYPES[k]])),
  sk861Cab: { name: "Regiomover (861) end section", kind: "emu" },
  sk861Mid: { name: "Regiomover (861) middle section", kind: "emu" },
  sk813: { name: "Class 813 diesel railcar", kind: "emu" },
  sk913: { name: "Class 913 driving trailer", kind: "emu", cab: true },
  sk425Cab: { name: "Tatra railway unit (425.95), cab section", kind: "emu" },
  sk425Power: { name: "Tatra railway unit (425.95), power module", kind: "module", pan: true },
  sk495Cab: { name: "Stadler 495.95, cab section", kind: "emu" },
  sk495Power: { name: "Stadler 495.95, power module", kind: "module", pan: true },
  sk757: { name: "Class 757 diesel locomotive", kind: "diesel" },
};
const M = (draw, len, oneEnd = false) => ({ draw, len, oneEnd, variant: null });
export const MODELS = {
  ...Object.fromEntries(SHARED.map((k) => [k, CZ_MODELS[k]])),
  sk861Cab: M(regiomoverCab, 67.6, true),
  sk861Mid: M(regiomoverMid, 54.0),
  sk813: M(car813(false), 47.3, true),
  sk913: M(car813(true), 47.3, true),
  sk425Cab: M(gtwCab(425), 45.3, true),
  sk425Power: M(gtwPower(425), 13.8),
  sk495Cab: M(gtwCab(495), 52.0, true),
  sk495Power: M(gtwPower(495), 14.5),
  sk757: M(loco757, 54.3),
};

// ZSSK's leased Vectrons (383 101-115), its CityElefants (671), its Panters
// (661), Regiomovers (861), 813s and 757s; Leo Express Slovensko's FLIRTs are
// the Czech company's (480 001-005).
export const FLEETS = {
  zssk: [[383101, 383115, "czVectron"], [671001, 671019, "czElefant471"], [661001, 661030, "czPanter640"], [861001, 861039, "sk861Cab"],
    [861101, 861114, "sk861Cab"], [813101, 813113, "sk813"], [757001, 757025, "sk757"]],
  leoexpresssk: [[480001, 480005, "czFlirtCab"]],
};

// ---------- Where a train runs ----------
// Every Slovak station the timetables stop at, by its number less 5600000:
// its region and whether it is on electrified track (OpenStreetMap's
// contact_line ways within 120 m, the Tatra Electric Railway included),
// packed as czechia.cars.js packs Czech stations (two base-36 digits of
// difference, then the region, upper case when electrified): B Bratislava,
// T Trnava, N Nitra, R Trenčín, Z Žilina, D Banská Bystrica, P Prešov,
// K Košice. Built October 2026.
const SK_STATIONS = "~0a1fZ02Z03T05Z02z03T05Z02z03T05Z02z03T05Z02r03T05Z02z03T07z03T05Z02r03B05Z02r03B05Z02r03B07d0ad08Z02d03B05Z05B05Z02d08Z02d03B05Z05B05Z02D0ad07P06B04P06B04P03D07P03D07p06T04P06B07D03T04P06T0aT07r03T04P0aP06T04P06T04K06T04K06T04K0aK03D07K0dD03T04K03d03N04K03D03N04K06N04K03D03N0aN04K03D03N04K03D03N04K03D03N04P03d07P06N04P03d03N04P03d0ad03N04p03d03N04P03d07P03d07P03d07K03d07K03d07K03d0ad03B04K03d03B04K03d03B04K03d03B0aB0aB07d03T04K06T0aT04K06T04K03d03T04K03d07K03d03T04K0aK0aK06R04K03d07K03d07K03d07K03d07K03d07K03d07K03d03R04K03d03R0aR04K06R04K06R04K03d03R04K06r04K06R04K06R07d1oZ11P0aP03N0aN07P03D07P03N07P03D07P03D07P03D07P03D07P03D07P03D07P06T04P03D03T04P03D03T04P03D03T04P03D07P06T04P06T04P0aP0ap03d07p03d03T05p02d07p03d03R04p06T04p03d03T04p03d03T04p03d03T04p03d07p03d07p03d03T04p0ap03d03T04p03d03T04p06t04p03d07p03d03t04p03d03r04p03d03r04P03d03r04p06r07d03r07d03r07d03r0ar07d03r0ar0ar07d0kd0ad03B07d0ap0ap07p0ak0ak06B04k06B04k0ak03d07k03d03B02b02k03d03b07d0db0ab0at02t08b0at0at0at0at0at0at0at0at0at0at0kt0an05p02d03n07d03n04k03d03n04k03d03n04k06n04k06n04k0ak0ak03d0ad03N07d0hk0ak03d07p03d07p03d03N07d07p06T0ok06T0aT07d0ad0ad07k0dd0ad03r07d03r0ar04k06r0ar07d03r04k03d03r04k03d03r07d03r04K03d03r07d03r04K03d03r04K03d03N04K03d03N07d03N04K03d0ad03n04K06n04K03d03n07d03n04K03d03n04K03d03n07d01d02n07d03n04K01K02d03n04K06n0an0an14n08n02n0an0an0kn0ar0ar0ar0ar0kr0ar0ar0ar06n04r0ar0ar0ar0ar0kN0aN0aN0aN0aN0aN0aN0aN0aN0aN0eP06N04P06N04P06N04P06N04P06N04P0aP0ap0kp0ap06N04p06N04p06N0ep0ap0ap0ap0ap0ap06t04p06t04p06n04p06n04p06n0an04p0ap0kp0ap0aP0uP0aP0ap0ap0ap0ap0ap0ap06n04p0ap0ap06n04p06n04p06n04p06n04p06n04p06n04p06n04p06n04p06n04p06n04p06n04p0ap06n04p06n0an0an04p06n04p06n04p06n04p06n04p06n04P0gn04P06n04P06n04P06n04P06n04P0aP06n04P0aP06r0eP0ap0gr04p0uP0aP0kp0kp0ap0ap0ap0ap0aK0aK0aK1eK14P6eP1jR0aR0aR0aR0aR0aR3wr0ar0kr0ar0ar14r0kr0ar0ar0ar0ar0aZ0aZ0aZ0kZ0aZ0az0az0az0az0az0aZ0aZ0az0az0az0az0az0aR0aR0aR0aR0az0az0az0az0az0az0az0aR0az0az0az0aZ0kZ0aZ0aZ0az0az0az0az0aZ0az0uZ0aZ0az0az0aZ0aZ0kZ0kZ0az05z05z1eR0aR3cZ0aZ0az0aZ0aZ0aZ0aZ0az0kz0aZ0aZ0aZ0aZ0aZ0aZ0az0az0az0aZ0aZ0aZ0aZ0az0az0az0az0aZ0aZ0kZ69K73Z1ez";
let stationMap = null;
function stations() {
  if (stationMap) return stationMap;
  stationMap = new Map();
  for (let i = 0, code = 0; i < SK_STATIONS.length; i++) {
    if (SK_STATIONS[i] === "~") { code += parseInt(SK_STATIONS.slice(i + 1, i + 5), 36); i += 4; }
    else { code += parseInt(SK_STATIONS.slice(i, i + 2), 36); i += 1; }
    stationMap.set(code, SK_STATIONS[++i]);
  }
  return stationMap;
}
function whereRuns(t) {
  const m = stations(), tally = new Map();
  let electric = true, any = false;
  for (const s of t.stops || []) {
    const hit = /:56(\d{5})$/.exec(s.key || "");
    const v = hit && m.get(Number(hit[1]));
    if (!v) continue;
    any = true;
    if (v === v.toLowerCase()) electric = false;
    tally.set(v.toUpperCase(), (tally.get(v.toUpperCase()) || 0) + 1);
  }
  if (!any) return { region: null, electric: null };
  return { region: [...tally].sort((a, b) => b[1] - a[1])[0][0], electric };
}

const set = (label, ...units) => ({ label, units });
const ZSSK_LOCO = (n) => set("A Vectron (383) locomotive and ZSSK coaches", ["czVectron", 1], ["czCoach", n]);
const ZSSK_ESO = (n) => set("Usually a class 363 or 361 locomotive (some days a 350) and ZSSK coaches", ["czEso", 1], ["czCoach", n]);
const ZSSK_757 = (n) => set("A class 757 diesel locomotive and ZSSK coaches", ["sk757", 1], ["czCoach", n]);
const ELEFANT = set("Elefant (671): a three-car double-deck electric unit (some trains a locomotive with coaches)", ["czElefant471", 1], ["czElefant071", 1], ["czElefant971", 1]);
const PANTER = set("Panter (661): a three-car electric unit", ["czPanter640", 1], ["czPanterMid", 1], ["czPanter640", 1]);
const REGIOMOVER = set("Regiomover (861): usually a three-section diesel unit", ["sk861Cab", 1], ["sk861Mid", 1], ["sk861Cab", 1]);
const REGIOMOVER2 = set("Regiomover (861.1): a two-section diesel unit", ["sk861Cab", 2]);
const K813 = set("A class 813 railcar and its 913 trailer", ["sk813", 1], ["sk913", 1]);
const TEZ = set("Tatra Electric Railway: usually a 425.95 unit (some trains a newer Stadler 495.95)", ["sk425Cab", 1], ["sk425Power", 1], ["sk425Cab", 1]);
const RACK = set("Rack railway: a Stadler 495.95 unit", ["sk495Cab", 1], ["sk495Power", 1], ["sk495Cab", 1]);
const COMFORTJET = set("ComfortJet (ČD): a Vectron and nine Siemens cars, the driving trailer at the back (some trains a railjet)", ["czVectron", 1], ["czCjCoach", 8], ["czCjCab", 1]);
const RJ = set("A TRAXX locomotive and RegioJet's yellow coaches", ["czTraxx", 1], ["czCoach", 7]);
const FLIRT = set("Stadler FLIRT: a five-section electric unit", ["czFlirtCab", 1], ["czFlirtMid", 3], ["czFlirtCab", 1]);
const LINT = set("Coradia LINT 41: a two-section diesel unit", ["czLint", 2]);
const BY_MODEL = { czVectron: ZSSK_LOCO(6), czElefant471: ELEFANT, czPanter640: PANTER, sk861Cab: REGIOMOVER, sk861Mid: REGIOMOVER, sk813: K813, sk913: K813,
  sk425Cab: TEZ, sk425Power: TEZ, sk495Cab: RACK, sk495Power: RACK, sk757: ZSSK_757(4), czEso: ZSSK_ESO(6) };

// ZSSK. Expres trains Bratislava-Košice: its Vectrons. Other expresses and
// Rýchlik trains: 363s and their 361 rebuilds (and 350s) under the wires,
// 757s off them (Zvolen-Košice, Banská Bystrica, Prievidza). Through
// trains from abroad: ČD's ComfortJets and railjets to Prague (railjet),
// ČD's Vectrons and coaches on the EuroCitys to Prague. Regional trains:
// the Tatra Electric Railway's 425.95s and the rack line's 495.95s;
// Elefants around Bratislava and Trnava; Panters around Žilina, Trenčín,
// Košice and Prešov and on the other electric lines; Regiomovers (861)
// from Nové Zámky, Zvolen and Humenné on most lines without wires, the
// 813s from Poprad to Plaveč and Muszyna. (sk and cs.wikipedia class
// articles; ZSSK's depots as they list them.)
const TEZ_STOPS = /Štrbské Pleso|Starý Smokovec|Tatranská Lomnica|Tatranská Polianka|Vyšné Hágy|Nový Smokovec/;
export const TYPICAL = {
  zssk: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    const r = t.route || "", where = whereRuns(t), ends = `${t.origin || ""} ${t.destination || ""}`;
    const names = (t.stops || []).map((s) => s.name).join(" ") || ends;
    if (/Štrba$|Štrba /.test(ends + " ") && /Štrbské Pleso/.test(ends)) return RACK;
    if (TEZ_STOPS.test(ends) && !/Studený Potok/.test(names)) return TEZ;
    if (r === "railjet") return COMFORTJET;
    // Other railroads' own trains through Slovakia (ÖBB's railjet xpress
    // and its REX trains from Petržalka to Vienna, MÁV's InterCitys and
    // EuroCitys from Budapest) aren't drawn yet: no consist rather than
    // the wrong one.
    if (r === "railjet xpress" || (r === "Regionálny rýchlik" && /Petržalka|Wien|Hegyeshalom/.test(ends) && !/hl\.st\./.test(ends))) return null;
    if (/^(EuroCity|InterCity|EuroNight)$/.test(r) && /Budapest/.test(ends) && !/Praha|Humenné/.test(ends)) return null;
    if (r === "Regionálny expres" && /Deutschkreutz/.test(ends)) return null;
    if ((r === "Regionálny rýchlik" || r === "Regionálny expres") && /Wien/.test(ends)) return set("Usually a Vectron (383) locomotive and ZSSK coaches", ["czVectron", 1], ["czCoach", 4]);
    if (r === "Regionálny rýchlik") return set("Usually a Vectron (383) locomotive and ZSSK coaches", ["czVectron", 1], ["czCoach", 4]);
    if (r === "Expres") return ZSSK_LOCO(7);
    if (/^(EuroCity|SuperCity)$/.test(r) && /Praha/.test(ends)) return r === "SuperCity" ? set("Pendolino (ČD): a seven-car tilting electric train", ["czPendoCab", 1], ["czPendoMid", 5], ["czPendoCab", 1])
      : set("Usually a ČD Vectron and ČD and ZSSK coaches", ["czVectron", 1], ["czCoach", 7]);
    if (/^(EuroCity|InterCity|EuroNight|Rýchlik|Zrýchlený vlak|Regionálny rýchlik)$/.test(r) && r !== "Zrýchlený vlak") {
      if (where.electric === false) return ZSSK_757(r === "Rýchlik" ? 5 : 4);
      return ZSSK_ESO(r === "EuroNight" ? 7 : r === "Regionálny rýchlik" ? 4 : 6);
    }
    // Regional trains.
    const { region, electric } = where;
    if (electric !== false) {
      if (region === "B" || region === "T") return ELEFANT;
      return PANTER;
    }
    if (/Plaveč|Muszyna|Stará Ľubovňa/.test(ends) && /Poprad/.test(ends)) return K813;
    if (r === "Regionálny expres") return region === "K" || region === "P" ? set("A class 757 diesel locomotive and ZSSK coaches (some trains a Regiomover)", ["sk757", 1], ["czCoach", 4]) : REGIOMOVER;
    return /Medzilaborce|Stakčín|Bardejov|Tisovec|Poltár|Šahy|Zlaté Moravce|Banská Štiavnica/.test(ends) ? REGIOMOVER2 : REGIOMOVER;
  },
  regiojetsk: () => RJ,
  // Leo Express Slovensko: LINT 41s on Bratislava-Komárno; the FLIRTs on the
  // Leo Express trains from Prague to Košice.
  leoexpresssk: (t, reported) => (reported === "czFlirtCab" || t.route === "Leo Express" ? FLIRT : LINT),
};

const WP = "https://en.wikipedia.org/wiki/";
const sk = (page) => `https://sk.wikipedia.org/wiki/${page}`;
const cs = (page) => `https://cs.wikipedia.org/wiki/${page}`;
// The shared models' own sheets, then these railroads'.
export const FACTS = {
  ...CZ_FACTS,
  "czElefant471@zssk": { model: "Elefant (class 671)", type: "Double-deck electric multiple unit", builder: "Škoda Vagonka", fleet: "19 three-car units", topSpeedMph: 99.4,
    powerHp: 2682, source: `${WP}ČD_Class_471`,
    about: "ZSSK's version of the CityElefant, a three-car double-deck unit for 160 km/h, on regional trains from Bratislava to Kúty, Trnava and Nové Zámky." },
  "czPanter640@zssk": { model: "Panter (class 661)", type: "Electric multiple unit", builder: "Škoda Transportation and ŽOS Trnava", built: "2020–2023", fleet: "30 units",
    topSpeedMph: 99.4, seats: 247, source: `${WP}Škoda_7Ev`,
    about: "ZSSK's Panters: 25 delivered for the Žilina area in 2020–2021 and five more for eastern Slovakia, ordered in December 2022." },
  "czElefant071@zssk": { model: "Elefant (class 671)", type: "Double-deck trailer", builder: "Škoda Vagonka", source: `${WP}ČD_Class_471`,
    about: "The middle car of a ZSSK Elefant, unpowered, both decks reached from the low floor between the trucks." },
  "czElefant971@zssk": { model: "Elefant (class 671)", type: "Double-deck cab trailer", builder: "Škoda Vagonka", source: `${WP}ČD_Class_471`,
    about: "The Elefant's cab trailer, at the opposite end from the power car." },
  "czPanterMid@zssk": { model: "Panter (class 661)", type: "Electric multiple unit", builder: "Škoda Transportation and ŽOS Trnava", topSpeedMph: 99.4, source: `${WP}Škoda_7Ev`,
    about: "The intermediate car of a three-car ZSSK Panter, carrying the pantograph." },
  "czVectron@zssk": { model: "Siemens Vectron (class 383)", type: "Electric locomotive", builder: "Siemens Mobility", built: "Since 2017", fleet: "15, leased",
    topSpeedMph: 99.4, powerHp: 8583, lengthFt: 62.3, source: `${WP}Siemens_Vectron`,
    about: "ZSSK leased ten multi-system Vectrons in 2017 for Bratislava–Košice and later Vienna–Bratislava trains; five more arrived in December 2024. They run on both Slovakia's 3 kV DC and 25 kV AC lines." },
  "czEso@zssk": { model: "Škoda 69E (classes 363 and 361)", type: "Electric locomotive", builder: "Škoda Plzeň; 361s rebuilt by ŽOS Vrútky", built: "1980–1990",
    topSpeedMph: 74.6, lengthFt: 55.1, source: `${WP}ČD_Class_363`,
    about: "ZSSK's dual-system locomotives for its express and Rýchlik trains, on both the 3 kV DC north and the 25 kV AC south of Slovakia; the 361s are 363s rebuilt for 160 km/h." },
  "czVectron@regiojetsk": { model: "Locomotive", type: "Electric locomotive", builder: "Siemens and others", fleet: "Leased, in RegioJet yellow", source: `${WP}RegioJet`,
    about: "RegioJet's trains between Prague and Košice are hauled by multi-system locomotives in its yellow." },
  "czCoach@zssk": { model: "Long-distance coach", type: "Passenger coach", builder: "Various", lengthFt: 86.6, source: sk("Železničná_spoločnosť_Slovensko"),
    about: "ZSSK's express coaches are mostly air-conditioned, with power outlets and vacuum toilets, and increasingly Wi-Fi. They are drawn here in its white with a red window band." },
  "czCoach@regiojetsk": { model: "RegioJet coach", type: "Passenger coach", builder: "Various", lengthFt: 86.6, source: `${WP}RegioJet`,
    about: "RegioJet's yellow coaches, with Low Cost, Standard, Relax and Business classes and drinks and snacks served at the seat." },
  "czLint@leoexpresssk": { model: "Alstom Coradia LINT 41 (class 648)", type: "Diesel multiple unit", builder: "Alstom", fleet: "21 leased from Alpha Trains",
    topSpeedMph: 87, lengthFt: 137.4, seats: 115, source: "https://cs.wikipedia.org/wiki/Leo_Express",
    about: "Leo Express Slovensko took over the regional trains between Bratislava and Komárno in December 2023 with leased German LINT 41s." },
  sk861Cab: { model: "Regiomover (class 861)", type: "Diesel multiple unit", builder: "ŽOS Vrútky", built: "2011–2021", fleet: "39 three-section (861.0), 14 two-section (861.1)",
    lengthFt: 188.9, source: sk("Motorová_jednotka_861"),
    about: "ZSSK's own diesel units, built in Vrútky, running most of its regional trains off the wires from Nové Zámky, Zvolen and Humenné: to Prievidza, Komárno, Leopoldov, Lučenec, Fiľakovo, Medzilaborce, Stakčín and Bardejov." },
  sk813: { model: "Class 813.1 and 913.1", type: "Diesel railcar with trailer", builder: "Vagónka Studénka; rebuilt by ŽOS Zvolen", built: "1975–1982, rebuilt 2012–2018",
    fleet: "13", topSpeedMph: 55.9, powerHp: 416, lengthFt: 94.6, source: cs("Motorová_jednotka_813.1"),
    about: "Old 810 railbuses and their trailers rebuilt as two-car units with new cabs and a low-floor trailer; ZSSK runs them from Zvolen and from Poprad to Plaveč and Muszyna." },
  sk425Cab: { model: "Class 425.95 (Stadler GTW)", type: "Meter-gauge electric multiple unit", builder: "ŽOS Vrútky with Stadler and Adtranz", built: "2000–2002",
    source: cs("Tatranské_elektrické_železnice"),
    about: "The Tatra Electric Railway's units, two low-floor cab sections hung on a power module, between Poprad, Starý Smokovec, Štrbské Pleso and Tatranská Lomnica." },
  sk495Cab: { model: "Stadler class 495.95", type: "Meter-gauge rack and adhesion electric multiple unit", builder: "Stadler Rail", built: "2021–2022", fleet: "5",
    source: cs("Tatranské_elektrické_železnice"),
    about: "Hybrid units ordered in 2018 that run both the Tatra Electric Railway and the rack line from Štrba up to Štrbské Pleso." },
  sk757: { model: "Class 757 \"Kikimora\"", type: "Diesel-electric locomotive", builder: "ČKD; rebuilt by ŽOS Zvolen", built: "Rebuilt 2010–2015", fleet: "25",
    lengthFt: 54.3, source: cs("Lokomotiva_757"),
    about: "Rebuilt 750s that haul ZSSK's express trains on the lines without wires from Zvolen to Košice, Banská Bystrica, Vrútky and Žilina, and REX trains around Humenné." },
};
const part = (facts, name) => ({ ...facts, model: `${facts.model}, ${name}` });
FACTS.sk861Mid = part(FACTS.sk861Cab, "middle section");
FACTS.sk913 = part(FACTS.sk813, "913 driving trailer");
FACTS.sk425Power = part(FACTS.sk425Cab, "power module");
FACTS.sk495Power = part(FACTS.sk495Cab, "power module");
