// KRL Commuter Line's cars (scripts/railroads/indonesia.py, agency
// "kci"): the Jabodetabek commuter trains — the ex-Japanese EMUs, the two
// new EMUs, and the diesel Lokal Merak. Trainsheet's own side views at the
// shared scale (js/carart.js), each drawn from, and checked against, a
// photograph on Wikimedia Commons, named here fleet by fleet. The lettering
// is drawn here (no logo files); the KAI Commuter mark is on the trains'
// front faces and is not drawn on the side.
//
// What is from the photographs: each fleet's paint, the shape of its cab,
// and what can be counted on the side that faces the camera. None of the
// photographs is a true side view (all are front three-quarter views), so
// the windows' spacing, the doors' places, the roof equipment, what hangs
// under the floor and every length are Trainsheet's reading of the type,
// not measurements. The lengths the drawings are scaled to are the figures
// usually published for each class: the EMU cars 20 m, the CC201 14 m, the
// K3 coach 20 m.
//
//   JR 205 series, the main fleet (45 sets, 8/10/12 cars): the Manggarai
//     photograph ("KRL Commuterline on the Bogor Line with JR 205 series
//     at Manggarai.jpg",
//     https://commons.wikimedia.org/wiki/File:KRL_Commuterline_on_the_Bogor_Line_with_JR_205_series_at_Manggarai.jpg)
//     shows the current KAI Commuter livery — a stainless body, a red
//     stripe under the windows with a thin yellow stripe under it, a red
//     band across the front face with the KAI Commuter mark in white, a
//     white lower front and a red plow. The Depok photograph ("205-142 KA
//     1209 Depok-Jakarta.jpg",
//     https://commons.wikimedia.org/wiki/File:205-142_KA_1209_Depok-Jakarta.jpg)
//     is the same set in an older livery with a pink women's-car wrap; it
//     is used only for the side profile (four doors a side, stainless
//     body), not the paint. Drawn as ten cars.
//   Tokyo Metro 6000 series (23 sets in operation; retirement announced
//     but KAI Commuter confirmed 31 Oct 2026 it is still operating): the
//     Manggarai photograph of 6007 ("TM 6007F CL Bogor (MRI).jpg",
//     https://commons.wikimedia.org/wiki/File:TM_6007F_CL_Bogor_%28MRI%29.jpg)
//     shows the current livery — stainless, a red stripe under the windows
//     with a thin yellow stripe under it, a red band across the front face
//     with the KAI Commuter mark, a grey lower front and a red plow, the
//     number above the single wide windshield. The Gambir photograph of
//     6015 ("KRL Jabotabek 6115 Gambir 20111126.JPG",
//     https://commons.wikimedia.org/wiki/File:KRL_Jabotabek_6115_Gambir_20111126.JPG)
//     shows the same fleet in the old red/yellow livery with the mesh
//     screen over the windshield; it is not the livery drawn. Drawn as
//     eight cars.
//   Tokyo Metro 05 series (set 05-102F in the latest livery): the Jakarta
//     Kota photograph ("KAIC 05TM 05-102F 2022-07-23.jpg",
//     https://commons.wikimedia.org/wiki/File:KAIC_05TM_05-102F_2022-07-23.jpg)
//     shows a white body, a red stripe under the windows with a thin dark
//     line under it, a red band across the front face, a grey lower front
//     and a red plow, a big raked two-pane windshield, blue equipment
//     boxes under the floor. The Ancol photograph ("Tokyo Metro 05 Series
//     di Stasiun Ancol.jpg",
//     https://commons.wikimedia.org/wiki/File:Tokyo_Metro_05_Series_di_Stasiun_Ancol.jpg),
//     captioned as a 05, shows a set in the old red/yellow livery with
//     mesh-covered windshields — the same front as the 6000/7000 sets in
//     this set, not the white/red 05-102F — so the 05 is drawn from the
//     Jakarta Kota photograph only and the Ancol photograph is not used
//     for it. Drawn as eight cars.
//   SFC120-V / CLI-125, the new CRRC Qingdao Sifang EMU: the Jakarta Kota
//     photograph ("CLI-125.1012 memasuki Stasiun Jakarta Kota 11022025.jpg",
//     https://commons.wikimedia.org/wiki/File:CLI-125.1012_memasuki_Stasiun_Jakarta_Kota_11022025.jpg)
//     and the joint photograph below show a black glossy front with a big
//     windshield and red LED light bars, a silver lower front and a red
//     plow, a grey body with a dark window band and a big red diagonal
//     swoosh down the side. Drawn as twelve cars.
//   iE305 / CLI-225, the new PT INKA EMU: the Manggarai photograph
//     ("Perdana dinas KRL INKA seri iE305 Trainset 2 lintas Bogor.jpg",
//     https://commons.wikimedia.org/wiki/File:Perdana_dinas_KRL_INKA_seri_iE305_Trainset_2_lintas_Bogor.jpg)
//     and the joint photograph below show a silver-grey body with a red
//     frame round the windshield, a black band under it, a red halftone
//     dotted panel with round headlamps, grey lower front with vents and
//     a red plow, and a red diagonal swoosh and red doors down the side.
//     Drawn as twelve cars.
//   The joint photograph ("KRL INKA seri EA207 (CLI-225) & KRL CRRC seri
//     SFC120-V (CLI-125) in Jakarta Kota station.jpg",
//     https://commons.wikimedia.org/wiki/File:KRL_INKA_seri_EA207_%28CLI-225%29_%26_KRL_CRRC_seri_SFC120-V_%28CLI-125%29_in_Jakarta_Kota_station.jpg)
//     is the cross-check for both new EMUs: the CLI-125's black front with
//     its red LED bars and the CLI-225's red dotted panel and red-framed
//     windshield side by side, and the CLI-225's red doors.
//   Lokal Merak, the diesel: a CC201/CC203-class locomotive of the GE
//     U18C/U20C family and grey K3 economy coaches with an orange stripe.
//     Both photographs ("KA 430 Lokal Merak (Gapeka 2021).jpg",
//     https://commons.wikimedia.org/wiki/File:KA_430_Lokal_Merak_%28Gapeka_2021%29.jpg,
//     and "Kereta api penumpang Lokal Merak.jpg",
//     https://commons.wikimedia.org/wiki/File:Kereta_api_penumpang_Lokal_Merak.jpg)
//     are front three-quarter views: a white cab with a green roof edge,
//     the KAI mark on the front face, a red lower front, round headlamps
//     on the cab roof and a row of small lights on the front beam, the
//     long hood behind the cab with an orange-red panel on its side. The
//     exact loco subclass (CC201 vs CC203) is not distinguishable from
//     these angles, so it is drawn as one diesel-hauled set: the
//     locomotive and four coaches. Merak Line only.
//   RETIRED ~10 Nov 2026 ("Arigato KRL") — drawn as extra models, but
//     NOT assigned in TYPICAL (no train in this timetable runs after
//     their retirement):
//   Tokyu 8500: the Jakarta Kota photograph ("TKK8518 JAKK.jpg",
//     https://commons.wikimedia.org/wiki/File:TKK8518_JAKK.jpg) shows
//     set 8518/8618 leaving for Bogor: stainless, a red stripe under the
//     windows, a red band across the front face with the KAI Commuter
//     mark, a white lower front and a red plow, three panes across the
//     front, four doors a side. Drawn as eight cars.
//   JR 203: the Maja photograph ("203 series BOO109 KRL Commuter Line
//     Maja.jpg",
//     https://commons.wikimedia.org/wiki/File:203_series_BOO109_KRL_Commuter_Line_Maja.jpg)
//     is a portrait front-end night shot only — red upper front, a yellow
//     band with the Commuter mark, a red lower front, mesh-covered
//     windshields, "TANAH ABANG" on the destination display — so the
//     livery and colours are from the photograph and the side (four doors,
//     the red and yellow stripes carried along it) is a reading. Drawn as
//     eight cars.
//   Tokyo Metro 7000: the Jakarta Kota photograph of 7122 ("7000TM22.jpg",
//     https://commons.wikimedia.org/wiki/File:7000TM22.jpg) shows the new
//     livery — a grey body, a red band across the front face with the KAI
//     Commuter mark, a grey lower front and a red plow, the number above
//     the big windshield with a small destination window over it. The
//     Duri photograph ("KRL Tokyo Metro 6107 and 7122 in Duri Station.jpg",
//     https://commons.wikimedia.org/wiki/File:KRL_Tokyo_Metro_6107_and_7122_in_Duri_Station.jpg)
//     shows 7122 in the old red/yellow livery next to 6107 (a 6000
//     series); it is not the livery drawn. Drawn as eight cars.
//
// Not drawn: the EA202/i9000, EA203, Tokyo Metro 8000 and Tokyu 2020 —
// no photographs, and (per the photo manifest) they never ran Jabodetabek
// KRL or are out of scope.
//
// The timetable names no rolling stock, so every fleet-to-train assignment
// is a judgement, labeled as typical; see TYPICAL below.

import { coachCar } from "../carmodels.js?v=dev";
import { C, rect, circle, path, truck, underframe, lines, slats, poly, win } from "../carart.js?v=dev";
import { unit, hvac, buffers, exhaust, tank } from "./czechia.cars.js?v=dev";

const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 2, depth = 1.0) => underframe(a, b, top, { depth, boxes: k, tanks: false });
// Window x positions filling the gaps between doors from lo to hi, at
// pitch, skipping any that would hit a door.
const gapWins = (doors, doorW, lo, hi, pitch = 3.4) => {
  const xs = [];
  for (let x = lo; x + 2.6 <= hi; x += pitch) {
    if (doors.some((d) => x + 2.6 > d - 0.7 && x < d + doorW + 0.7)) continue;
    xs.push(Math.round(x * 10) / 10);
  }
  return xs;
};
const winRow = (xs) => ({ xs, y: 7.6, w: 2.6, h: 2.8, r: 0.3 });
const emuDoor = (x, fill, w = 3.2) => ({ x, w, y0: 3.6, y1: 10.8, leaves: 2, glassY: 0.45, glassH: 0.4, grabs: true, fill });
// Three doors a side (6000, 05, 7000, CLI-125, CLI-225); four a side
// (205, 203, 8500). Cab cars put the first door behind the cab.
const D3 = [8, 31, 54], D3CAB = [13, 33, 53];
const D4 = [7, 23, 39, 55], D4CAB = [12, 27, 42, 56];
const G = { roof: 13.0, sill: 3.6 };

// ---------- JR 205 series ----------
// Stainless, a red stripe under the windows and a thin yellow stripe
// under it; the current KAI Commuter livery (Manggarai photograph). The
// cab's front face carries the red band and a red plow; the side shows
// only the band's wrap round the nose.
const J205 = { steel: "#d8dade", red: "#d21f26", yellow: "#f2c21a", roof: "#b9bec4", skirt: "#3a3d42" };
const NOSE_205 = [[0.9, 3.6], [0.7, 8.0], [1.2, 12.2], ["q", 1.4, 13.0, 2.8, 13.0]];
function j205Paint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, J205.steel], [12.3, 3, J205.roof], [0, 3.6, J205.skirt]]) +
      rect(-1, 5.9, L + 2, 1.0, J205.red) + rect(-1, 5.0, L + 2, 0.35, J205.yellow);
    if (cab) s += rect(-1, 4.6, 9.5, 1.9, J205.red) + rect(-1, 0, 9.5, 3.6, J205.red);
    return s;
  };
}
const j205Cab = (c) => unit(c, { roof: G.roof, sill: G.sill, nose: NOSE_205, rake: [[1.0, 8.2], [1.4, 12.2]], depth: 2.6, cabLen: 10, lampY: 5.35, bare: true,
  rows: [winRow(gapWins(D4CAB, 3.0, 13, 60.5))], doors: D4CAB.map((x) => emuDoor(x, J205.steel, 3.0)),
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: j205Paint(true), surround: "#1d2026",
  cab: () => win(6.8, 8.8, 2.4, 2.4, 0.25),
  extra: (cc, g) => hvac(14, G.roof, 12, 0.5) + boxes(16, g.L - 16, G.sill, 3, 1.2) });
const j205Mid = (c) => unit(c, { roof: G.roof, sill: G.sill,
  rows: [winRow(gapWins(D4, 3.0, 5.5, 60.5))], doors: D4.map((x) => emuDoor(x, J205.steel, 3.0)),
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: j205Paint(false),
  pan: c.index === 1 ? c.L / 2 - 6 : null,
  extra: (cc, g) => hvac(10, G.roof, 12, 0.5) + hvac(g.L - 24, G.roof, 12, 0.5) + boxes(16, g.L - 16, G.sill, 3, 1.2) });

// ---------- Tokyo Metro 6000 series ----------
// Stainless, a red stripe under the windows with a thin yellow stripe
// under it; the current livery (6007 at Manggarai). The cab's tall narrow
// side window and the number above the single wide windshield are from
// that photograph.
const T6 = { steel: "#d5d7da", red: "#d21f26", yellow: "#f2c21a", roof: "#a9aeb3", skirt: "#3a3d42" };
const NOSE_T6 = [[0.9, 3.6], [0.7, 8.0], [1.2, 12.2], ["q", 1.4, 13.0, 2.8, 13.0]];
function tm6000Paint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, T6.steel], [12.3, 3, T6.roof], [0, 3.6, T6.skirt]]) +
      rect(-1, 5.9, L + 2, 1.0, T6.red) + rect(-1, 5.0, L + 2, 0.3, T6.yellow);
    if (cab) s += rect(-1, 4.6, 9.5, 1.9, T6.red) + rect(-1, 0, 9.5, 3.6, T6.red);
    return s;
  };
}
const tm6000Cab = (c) => unit(c, { roof: G.roof, sill: G.sill, nose: NOSE_T6, rake: [[1.0, 8.2], [1.4, 12.2]], depth: 2.6, cabLen: 10, lampY: 5.35, bare: true,
  rows: [winRow(gapWins(D3CAB, 3.2, 13, 60.5))], doors: D3CAB.map((x) => emuDoor(x, T6.steel)),
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: tm6000Paint(true), surround: "#1d2026",
  cab: () => win(7.0, 8.4, 2.2, 3.2, 0.3),
  extra: (cc, g) => hvac(14, G.roof, 12, 0.5) + boxes(16, g.L - 16, G.sill, 3, 1.2) });
const tm6000Mid = (c) => unit(c, { roof: G.roof, sill: G.sill,
  rows: [winRow(gapWins(D3, 3.2, 5.5, 60.5))], doors: D3.map((x) => emuDoor(x, T6.steel)),
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: tm6000Paint(false),
  pan: c.index === 1 ? c.L / 2 - 6 : null,
  extra: (cc, g) => hvac(10, G.roof, 12, 0.5) + hvac(g.L - 24, G.roof, 12, 0.5) + boxes(16, g.L - 16, G.sill, 3, 1.2) });

// ---------- Tokyo Metro 05 series ----------
// White, a red stripe under the windows with a thin dark line under it;
// the latest KAI Commuter livery (05-102F at Jakarta Kota). The raked
// windshield, the grey lower front and the blue boxes under the floor are
// from that photograph.
const T5 = { white: "#eef0f1", red: "#d21f26", dark: "#2a2d31", roof: "#c9ced3", skirt: "#3a3d42", blue: "#3f6d9e" };
const NOSE_T5 = [[1.0, 3.6], [0.6, 5.6], ["q", 0.5, 7.4, 2.0, 8.0], [8.4, 12.2], ["q", 9.6, 13.0, 11.8, 13.0]];
function tm05Paint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, T5.white], [12.3, 3, T5.roof], [0, 3.6, T5.skirt]]) +
      rect(-1, 5.9, L + 2, 1.0, T5.red) + rect(-1, 5.0, L + 2, 0.25, T5.dark);
    if (cab) s += rect(-1, 4.6, 11, 1.9, T5.red) + rect(-1, 0, 11, 3.6, T5.red);
    return s;
  };
}
const tm05Cab = (c) => unit(c, { roof: G.roof, sill: G.sill, nose: NOSE_T5, rake: [[2.0, 8.0], [8.4, 12.2]], depth: 3.2, cabLen: 14, lampY: 5.35, bare: true,
  rows: [winRow(gapWins([17, 34, 53], 3.2, 17, 60.5))], doors: [17, 34, 53].map((x) => emuDoor(x, T5.white)),
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: tm05Paint(true), surround: "#1d2026",
  cab: () => win(11.8, 8.8, 1.8, 2.6, 0.25),
  extra: (cc, g) => hvac(18, G.roof, 12, 0.6) + boxes(16, g.L - 16, G.sill, 3, 1.2) });
const tm05Mid = (c) => unit(c, { roof: G.roof, sill: G.sill,
  rows: [winRow(gapWins(D3, 3.2, 5.5, 60.5))], doors: D3.map((x) => emuDoor(x, T5.white)),
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: tm05Paint(false),
  pan: c.index === 1 ? c.L / 2 - 6 : null,
  extra: (cc, g) => hvac(10, G.roof, 12, 0.6) + hvac(g.L - 24, G.roof, 12, 0.6) +
    rect(18, 2.4, 9, 1.1, T5.blue, 0, 'rx="0.2"') + rect(g.L - 27, 2.4, 9, 1.1, T5.blue, 0, 'rx="0.2"') });

// ---------- SFC120-V / CLI-125 (CRRC Qingdao Sifang) ----------
// Grey with a dark window band and a big red diagonal swoosh down the
// side, sweeping from the upper front to the lower rear; a black glossy
// front with red LED light bars, a silver lower front and a red plow. The
// swoosh's exact curve is a reading.
const C125 = { grey: "#b9bec4", dark: "#3a3f45", red: "#e8442e", white: "#eef0f1", roof: "#8f959b", skirt: "#2a2d31" };
const NOSE_125 = [[1.6, 3.6], [0.7, 4.7], ["q", 0.4, 6.3, 2.6, 7.7], [10.2, 12.0], ["q", 11.8, 12.8, 14.8, 12.8]];
const swoosh125 = (L) => path("M12 12.8L19 12.8L40 3.6L33 3.6Z", C125.red) +
  path("M19 12.8L21.5 12.8L42.5 3.6L40 3.6Z", C125.white);
function cli125Paint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, C125.grey], [12.3, 3, C125.roof], [0, 3.6, C125.skirt]]) +
      rect(-1, 6.8, L + 2, 3.6, C125.dark) + swoosh125(L);
    if (cab) s += rect(-1, 3.6, 12, 9.4, "#14171b") + rect(-1, 0, 12, 3.6, C125.red);
    return s;
  };
}
const cli125Cab = (c) => unit(c, { roof: 12.8, sill: G.sill, nose: NOSE_125, rake: [[2.6, 7.7], [10.2, 12.0]], depth: 3.6, cabLen: 19, lampY: 5.35, bare: true,
  rows: [winRow(gapWins([21, 34, 53], 3.2, 21, 60.5))], doors: [21, 34, 53].map((x) => emuDoor(x, "#a7adb3")),
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: cli125Paint(true), surround: "#14171b",
  // The red LED light bars on the black front, below the windshield, and
  // the cab's side window behind it.
  cab: () => rect(1.0, 5.6, 7.5, 0.35, "#ff453a") + rect(1.0, 6.4, 7.5, 0.25, "#ff453a") + win(14.5, 8.8, 2.4, 2.4, 0.25),
  extra: (cc, g) => hvac(22, 12.8, 12, 0.5) + boxes(20, g.L - 20, G.sill, 3, 1.2) });
const cli125Mid = (c) => unit(c, { roof: 12.8, sill: G.sill,
  rows: [winRow(gapWins(D3, 3.2, 5.5, 60.5))], doors: D3.map((x) => emuDoor(x, "#a7adb3")),
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: cli125Paint(false),
  pan: c.index === 1 ? c.L / 2 - 6 : null,
  extra: (cc, g) => hvac(10, 12.8, 12, 0.5) + hvac(g.L - 24, 12.8, 12, 0.5) + boxes(16, g.L - 16, G.sill, 3, 1.2) });

// ---------- iE305 / CLI-225 (PT INKA) ----------
// Silver-grey with a red diagonal swoosh down the side, rising toward
// the rear, and red doors; a red frame round the windshield, a black band
// under it, a red halftone dotted panel with round headlamps, a grey
// lower front and a red plow. The swoosh's exact curve is a reading.
const C225 = { silver: "#d3d6d9", red: "#d21f26", white: "#eef0f1", roof: "#b9bec4", skirt: "#2a2d31" };
const NOSE_225 = [[1.2, 3.6], [0.8, 5.0], ["q", 0.7, 7.0, 2.4, 8.2], [8.0, 12.2], ["q", 9.2, 13.0, 11.5, 13.0]];
const swoosh225 = (L) => path("M8 3.6L15 3.6L34 12.8L27 12.8Z", C225.red) +
  path("M15 3.6L17.5 3.6L36.5 12.8L34 12.8Z", C225.white);
function cli225Paint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, C225.silver], [12.3, 3, C225.roof], [0, 3.6, C225.skirt]]) + swoosh225(L);
    if (cab) {
      // The red frame's top edge round the windshield, the red dotted
      // panel below it, and the red plow.
      s += rect(-1, 12.2, 11, 0.8, C225.red) + rect(-1, 4.4, 11, 1.8, C225.red) + rect(-1, 0, 11, 3.6, C225.red);
      for (let x = 0.6; x < 10.5; x += 1.2) for (const y of [4.85, 5.75]) s += circle(x, y, 0.16, "#8f1414");
    }
    return s;
  };
}
const cli225Cab = (c) => unit(c, { roof: G.roof, sill: G.sill, nose: NOSE_225, rake: [[2.4, 8.2], [8.0, 12.2]], depth: 3.2, cabLen: 13, lampY: 5.35, bare: true,
  rows: [winRow(gapWins([15, 34, 53], 3.2, 15, 60.5))], doors: [15, 34, 53].map((x) => emuDoor(x, C225.red)),
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: cli225Paint(true), surround: "#1d2026",
  // The round headlamps on the dotted panel, and the cab's side window.
  cab: () => circle(3.2, 5.3, 0.55, "#fff4cf", 0.3) + circle(7.8, 5.3, 0.55, "#fff4cf", 0.3) + win(10.5, 8.8, 2.2, 2.4, 0.25),
  extra: (cc, g) => hvac(18, G.roof, 12, 0.5) + boxes(16, g.L - 16, G.sill, 3, 1.2) });
const cli225Mid = (c) => unit(c, { roof: G.roof, sill: G.sill,
  rows: [winRow(gapWins(D3, 3.2, 5.5, 60.5))], doors: D3.map((x) => emuDoor(x, C225.red)),
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: cli225Paint(false),
  pan: c.index === 1 ? c.L / 2 - 6 : null,
  extra: (cc, g) => hvac(10, G.roof, 12, 0.5) + hvac(g.L - 24, G.roof, 12, 0.5) + boxes(16, g.L - 16, G.sill, 3, 1.2) });

// ---------- Tokyu 8500 (RETIRED ~10 Nov 2026) ----------
// Stainless with a red stripe under the windows; a red band across the
// front face, a white lower front and a red plow (8518 at Jakarta Kota).
const T85 = { steel: "#d5d7da", red: "#d21f26", roof: "#a9aeb3", skirt: "#3a3d42" };
const NOSE_T85 = [[0.9, 3.6], [0.7, 8.0], [1.2, 12.2], ["q", 1.4, 13.0, 2.8, 13.0]];
function tokyu8500Paint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, T85.steel], [12.3, 3, T85.roof], [0, 3.6, T85.skirt]]) +
      rect(-1, 5.9, L + 2, 1.0, T85.red);
    if (cab) s += rect(-1, 4.6, 9.5, 1.9, T85.red) + rect(-1, 0, 9.5, 3.6, T85.red);
    return s;
  };
}
const tokyu8500Cab = (c) => unit(c, { roof: G.roof, sill: G.sill, nose: NOSE_T85, rake: [[1.0, 8.2], [1.4, 12.2]], depth: 2.6, cabLen: 10, lampY: 5.35, bare: true,
  rows: [winRow(gapWins(D4CAB, 3.0, 13, 60.5))], doors: D4CAB.map((x) => emuDoor(x, T85.steel, 3.0)),
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: tokyu8500Paint(true), surround: "#1d2026",
  cab: () => win(6.8, 8.8, 2.4, 2.4, 0.25),
  extra: (cc, g) => hvac(14, G.roof, 12, 0.5) + boxes(16, g.L - 16, G.sill, 3, 1.2) });
const tokyu8500Mid = (c) => unit(c, { roof: G.roof, sill: G.sill,
  rows: [winRow(gapWins(D4, 3.0, 5.5, 60.5))], doors: D4.map((x) => emuDoor(x, T85.steel, 3.0)),
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: tokyu8500Paint(false),
  pan: c.index === 1 ? c.L / 2 - 6 : null,
  extra: (cc, g) => hvac(10, G.roof, 12, 0.5) + hvac(g.L - 24, G.roof, 12, 0.5) + boxes(16, g.L - 16, G.sill, 3, 1.2) });

// ---------- JR 203 (RETIRED ~10 Nov 2026) ----------
// Red and yellow: a red stripe under the windows with a yellow stripe
// under it, a red upper front, a yellow band with the Commuter mark and a
// red lower front, mesh-covered windshields (Maja, front-end night shot
// only — the side is a reading).
const J203 = { white: "#e8e9ea", red: "#c8102e", yellow: "#f2c21a", roof: "#a9aeb3", skirt: "#3a3d42" };
const NOSE_203 = [[0.9, 3.6], [0.7, 8.0], [1.2, 12.2], ["q", 1.4, 13.0, 2.8, 13.0]];
function jr203Paint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, J203.white], [12.3, 3, J203.roof], [0, 3.6, J203.skirt]]) +
      rect(-1, 5.9, L + 2, 1.0, J203.red) + rect(-1, 5.0, L + 2, 0.35, J203.yellow);
    if (cab) s += rect(-1, 6.6, 9.5, 6.4, J203.red) + rect(-1, 4.6, 9.5, 2.0, J203.yellow) + rect(-1, 0, 9.5, 3.6, J203.red);
    return s;
  };
}
const jr203Cab = (c) => unit(c, { roof: G.roof, sill: G.sill, nose: NOSE_203, rake: [[1.0, 8.2], [1.4, 12.2]], depth: 2.6, cabLen: 10, lampY: 5.35, bare: true,
  rows: [winRow(gapWins(D4CAB, 3.0, 13, 60.5))], doors: D4CAB.map((x) => emuDoor(x, J203.white, 3.0)),
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: jr203Paint(true), surround: "#1d2026",
  // The mesh over the windshields, drawn as a cross-hatch over the screen,
  // and the cab's side window.
  cab: () => {
    const segs = [];
    for (let x = 1.2; x < 5.0; x += 0.55) segs.push([x, 8.3, x + 0.8, 12.3], [x + 0.8, 8.3, x, 12.3]);
    return win(6.8, 8.8, 2.4, 2.4, 0.25) + lines(segs, "rgba(0,0,0,0.35)", 0.35);
  },
  extra: (cc, g) => hvac(14, G.roof, 12, 0.5) + boxes(16, g.L - 16, G.sill, 3, 1.2) });
const jr203Mid = (c) => unit(c, { roof: G.roof, sill: G.sill,
  rows: [winRow(gapWins(D4, 3.0, 5.5, 60.5))], doors: D4.map((x) => emuDoor(x, J203.white, 3.0)),
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: jr203Paint(false),
  pan: c.index === 1 ? c.L / 2 - 6 : null,
  extra: (cc, g) => hvac(10, G.roof, 12, 0.5) + hvac(g.L - 24, G.roof, 12, 0.5) + boxes(16, g.L - 16, G.sill, 3, 1.2) });

// ---------- Tokyo Metro 7000 (RETIRED ~10 Nov 2026) ----------
// Grey with a red stripe under the windows; a red band across the front
// face, a grey lower front and a red plow (7122 at Jakarta Kota, new
// livery). The small destination window over the windshield is from that
// photograph.
const T7 = { grey: "#c9ccd0", red: "#d21f26", roof: "#a9aeb3", skirt: "#3a3d42" };
const NOSE_T7 = [[0.9, 3.6], [0.7, 8.0], [1.2, 12.2], ["q", 1.4, 13.0, 2.8, 13.0]];
function tm7000Paint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, T7.grey], [12.3, 3, T7.roof], [0, 3.6, T7.skirt]]) +
      rect(-1, 5.9, L + 2, 1.0, T7.red);
    if (cab) s += rect(-1, 4.6, 9.5, 1.9, T7.red) + rect(-1, 0, 9.5, 3.6, T7.red);
    return s;
  };
}
const tm7000Cab = (c) => unit(c, { roof: G.roof, sill: G.sill, nose: NOSE_T7, rake: [[1.0, 8.2], [1.4, 12.2]], depth: 2.6, cabLen: 10, lampY: 5.35, bare: true,
  rows: [winRow(gapWins(D3CAB, 3.2, 13, 60.5))], doors: D3CAB.map((x) => emuDoor(x, T7.grey)),
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: tm7000Paint(true), surround: "#1d2026",
  cab: () => rect(2.2, 12.35, 3.2, 0.55, C.glass, 0.4, 'rx="0.2"') + win(7.0, 8.4, 2.0, 3.2, 0.3),
  extra: (cc, g) => hvac(14, G.roof, 12, 0.5) + boxes(16, g.L - 16, G.sill, 3, 1.2) });
const tm7000Mid = (c) => unit(c, { roof: G.roof, sill: G.sill,
  rows: [winRow(gapWins(D3, 3.2, 5.5, 60.5))], doors: D3.map((x) => emuDoor(x, T7.grey)),
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: tm7000Paint(false),
  pan: c.index === 1 ? c.L / 2 - 6 : null,
  extra: (cc, g) => hvac(10, G.roof, 12, 0.5) + hvac(g.L - 24, G.roof, 12, 0.5) + boxes(16, g.L - 16, G.sill, 3, 1.2) });

// ---------- Lokal Merak: CC201/CC203 diesel + K3 coaches ----------
// A hood unit, drawn with plain primitives (the BDZ class 55 / MŽ 661
// pattern): the cab near the front, the long hood behind it, two
// three-axle trucks. White with a green roof edge, an orange-red panel
// on the long hood's side, a red plow under the nose.
const CC = { white: "#eef0f1", green: "#2e6b4f", red: "#c8202c", orange: "#d95f2b", frame: "#3a3d42" };
function cc201(c) {
  const L = c.L, deck = 4.4, hood = 11.0, cabTop = 13.2, cab0 = 9.0, cab1 = 17.0;
  let s = buffers(0, -1, { end: 1.4, sill: deck, y: 3.45 }) + buffers(L, 1, { end: 1.4, sill: deck, y: 3.45 });
  // The frame and its walkway, red at the nose.
  s += rect(1.3, deck - 0.9, L - 2.6, 0.9, CC.frame, 0.5) + rect(1.3, deck - 0.9, 8.0, 0.9, CC.red, 0.5);
  // The short nose ahead of the cab, the cab, the long hood behind it.
  s += path(poly([[2.2, deck], [2.2, hood - 0.6], ["q", 2.2, hood, 2.8, hood], [cab0, hood], [cab0, deck]]), CC.white, 0.5);
  s += path(poly([[cab0, deck], [cab0, cabTop - 0.7], ["q", cab0, cabTop, cab0 + 0.8, cabTop], [cab1 - 0.8, cabTop], ["q", cab1, cabTop, cab1, cabTop - 0.7], [cab1, deck]]), CC.white, 0.5);
  s += path(poly([[cab1, deck], [cab1, hood - 0.4], [L - 2.8, hood - 0.4], ["q", L - 2.2, hood - 0.4, L - 2.2, hood - 1.0], [L - 2.2, deck]]), CC.white, 0.5);
  // The green roof edges, and the red plow under the nose.
  s += rect(2.2, hood - 0.5, cab0 - 2.2, 0.5, CC.green) + rect(cab0, cabTop - 0.5, cab1 - cab0, 0.5, CC.green) +
    rect(cab1, hood - 0.5, L - 2.2 - cab1, 0.5, CC.green) +
    rect(2.2, 0.8, 6.8, deck - 1.7, CC.red, 0.5);
  // The orange-red panel on the long hood's side, the hood doors and the
  // radiator at the long hood's far end.
  s += rect(cab1 + 4, 6.8, 12, 3.2, CC.orange, 0.4) +
    slats(cab1 + 4.3, 7.0, 11.4, 2.8, 0.5, "rgba(255,255,255,0.25)");
  for (const x of seq(35.0, 3.2, 2)) s += rect(x, 5.2, 2.8, 3.6, "none", 0.45);
  s += rect(L - 6.0, 5.0, 3.6, 5.3, "rgba(20,22,25,0.35)", 0.4) + slats(L - 6.0, 5.0, 3.6, 5.3, 0.3, "rgba(255,255,255,0.2)");
  // The cab windows and door, handrails along the walkway, the exhaust
  // stack on the long hood.
  s += rect(cab0 + 0.7, 9.6, 2.5, 2.6, C.glass, 0.5, 'rx="0.25"') + rect(cab1 - 3.2, 9.6, 2.5, 2.6, C.glass, 0.5, 'rx="0.25"') +
    rect(cab0 + 3.6, 5.0, 0.4, 6.8, "none", 0.5);
  s += lines([[2.4, deck + 2.2, cab0 - 0.6, deck + 2.2], [cab1 + 0.6, deck + 2.2, L - 2.4, deck + 2.2]], CC.green, 0.35);
  s += exhaust(cab1 + 6.0, hood) + rect(cab1 + 12.0, hood - 0.05, 4.4, 0.45, "#1a2b23", 0.4, 'rx="0.2"');
  // The headlamp on the nose and the two lamps on the cab roof's front
  // edge (as in the Merak photographs).
  s += circle(2.6, 6.6, 0.45, "#fff4cf", 0.3) +
    circle(cab0 + 0.4, cabTop - 0.35, 0.32, "#fff4cf", 0.3) + circle(cab0 + 1.7, cabTop - 0.35, 0.32, "#fff4cf", 0.3);
  s += tank(L / 2 - 4.5, L / 2 + 3.0, deck - 0.9, 1.5);
  for (const x of [10.0, L - 10.0]) s += truck(x, { wb: 8.5, d: 40, kind: "loco", top: deck - 0.9, axles: 3 });
  return s;
}

// The K3 economy coach: grey with an orange stripe below the windows,
// many small windows, a door at each end.
const K3 = { grey: "#c9ccd0", orange: "#e07b24", roof: "#8f959b", skirt: "#2a2d31" };
function k3Coach(c) {
  const L = c.L;
  return coachCar(c, { roof: 13.3, sill: 3.9, end: 0.6, endR: 1.2, base: K3.grey, badge: false, under: true,
    trucks: { centers: 46, wb: 8.2, d: 36 }, diaphragm: [4.25, 11.8],
    rows: [{ a: 6.0, b: L - 6.0, y: 7.4, w: 2.0, h: 2.6, pitch: 3.0, r: 0.3 }],
    doors: [2.0, L - 4.6].map((x) => ({ x, w: 2.6, h: 7.0, glassY: 0.5, glassH: 0.38 })),
    livery: () => bands(L, [[12.4, 3, K3.roof], [6.2, 1.0, K3.orange], [0, 4.25, K3.skirt]]),
    extra: () => buffers(0, -1, { sill: 3.9 }) + buffers(L, 1, { sill: 3.9 }) });
}

// ---------- Tables ----------

export const TYPES = {
  kci205Cab: { name: "JR 205 series end car", kind: "emu" },
  kci205Mid: { name: "JR 205 series intermediate car", kind: "emu" },
  kci6000Cab: { name: "Tokyo Metro 6000 series end car", kind: "emu" },
  kci6000Mid: { name: "Tokyo Metro 6000 series intermediate car", kind: "emu" },
  kci05Cab: { name: "Tokyo Metro 05 series end car", kind: "emu" },
  kci05Mid: { name: "Tokyo Metro 05 series intermediate car", kind: "emu" },
  kci125Cab: { name: "SFC120-V (CLI-125) end car", kind: "emu" },
  kci125Mid: { name: "SFC120-V (CLI-125) intermediate car", kind: "emu" },
  kci225Cab: { name: "iE305 (CLI-225) end car", kind: "emu" },
  kci225Mid: { name: "iE305 (CLI-225) intermediate car", kind: "emu" },
  kci8500Cab: { name: "Tokyu 8500 series end car", kind: "emu" },
  kci8500Mid: { name: "Tokyu 8500 series intermediate car", kind: "emu" },
  kci203Cab: { name: "JR 203 series end car", kind: "emu" },
  kci203Mid: { name: "JR 203 series intermediate car", kind: "emu" },
  kci7000Cab: { name: "Tokyo Metro 7000 series end car", kind: "emu" },
  kci7000Mid: { name: "Tokyo Metro 7000 series intermediate car", kind: "emu" },
  kciCc201: { name: "CC201/CC203 diesel locomotive", kind: "diesel" },
  kciK3: { name: "K3 economy coach", kind: "coach" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers: the EMU cars 20 m; the CC201 14 m; the K3
// coach 20 m.
export const MODELS = {
  kci205Cab: M(j205Cab, 65.6, true),
  kci205Mid: M(j205Mid, 65.6, false, byIndex),
  kci6000Cab: M(tm6000Cab, 65.6, true),
  kci6000Mid: M(tm6000Mid, 65.6, false, byIndex),
  kci05Cab: M(tm05Cab, 65.6, true),
  kci05Mid: M(tm05Mid, 65.6, false, byIndex),
  kci125Cab: M(cli125Cab, 65.6, true),
  kci125Mid: M(cli125Mid, 65.6, false, byIndex),
  kci225Cab: M(cli225Cab, 65.6, true),
  kci225Mid: M(cli225Mid, 65.6, false, byIndex),
  kci8500Cab: M(tokyu8500Cab, 65.6, true),
  kci8500Mid: M(tokyu8500Mid, 65.6, false, byIndex),
  kci203Cab: M(jr203Cab, 65.6, true),
  kci203Mid: M(jr203Mid, 65.6, false, byIndex),
  kci7000Cab: M(tm7000Cab, 65.6, true),
  kci7000Mid: M(tm7000Mid, 65.6, false, byIndex),
  kciCc201: M(cc201, 46.0),
  kciK3: M(k3Coach, 65.6),
};

const set = (label, ...units) => ({ label, units });
const JR205_SET = set("Typical: a ten-car JR 205 series set (a judgement: the timetable names no stock; the 205 is the main fleet)",
  ["kci205Cab", 1], ["kci205Mid", 8], ["kci205Cab", 1]);
const TM6000_SET = set("Typical: an eight-car Tokyo Metro 6000 series set (a judgement: the timetable names no stock)",
  ["kci6000Cab", 1], ["kci6000Mid", 6], ["kci6000Cab", 1]);
const TM05_SET = set("Typical: an eight-car Tokyo Metro 05 series set (a judgement: the timetable names no stock; set 05-102F was photographed on a Tanjung Priok Line service)",
  ["kci05Cab", 1], ["kci05Mid", 6], ["kci05Cab", 1]);
const CLI125_SET = set("Typical: a twelve-car SFC120-V (CLI-125) set (a judgement: the timetable names no stock)",
  ["kci125Cab", 1], ["kci125Mid", 10], ["kci125Cab", 1]);
const CLI225_SET = set("Typical: a twelve-car iE305 (CLI-225) set (a judgement: the timetable names no stock)",
  ["kci225Cab", 1], ["kci225Mid", 10], ["kci225Cab", 1]);
const MERAK_SET = { ...set("Typical: a CC201/CC203 diesel locomotive with four K3 economy coaches (the Lokal Merak, photographed Rangkasbitung–Merak; the exact loco subclass is not distinguishable from the photographs)",
  ["kciCc201", 1], ["kciK3", 4]), wires: false };

// The timetable (the open-krl community KRL GTFS) names no rolling stock,
// so a train is placed by its line and its number. The rules:
//   Merak Line (numbers 311–324): the diesel Lokal Merak — the only
//     diesel line in the feed, photographed Rangkasbitung–Merak.
//   Tanjung Priok Line: the Tokyo Metro 05 — set 05-102F was photographed
//     on a Tanjung Priok Line service at Jakarta Kota.
//   Every other line: the fleet is a deterministic hash of the train
//     number (n % 20): 0–11 the JR 205 (the main fleet, 60%), 12–15 the
//     Tokyo Metro 6000 (20%), 16–17 the Tokyo Metro 05 (10%), 18 the
//     CLI-125 and 19 the CLI-225 (the new EMUs, 5% each), so the mix
//     looks real and the same train always draws the same fleet.
//   The retired Tokyu 8500, JR 203 and Tokyo Metro 7000 are drawn but
//     never assigned: no train in this timetable runs after their
//     ~10 Nov 2026 retirement.
//   Anything unmatched: the JR 205.
const lineOf = (t) => `${t.line || ""} ${t.route || ""}`.toLowerCase();
const numOf = (t) => { const m = String(t.number || "").match(/\d+/); return m ? parseInt(m[0], 10) : 0; };
export const TYPICAL = {
  kci: (t = {}) => {
    const l = lineOf(t), n = numOf(t);
    if (/merak/.test(l) || (n >= 311 && n <= 324)) return MERAK_SET;
    if (/tanjung priok/.test(l)) return TM05_SET;
    const h = n % 20;
    if (h < 12) return JR205_SET;
    if (h < 16) return TM6000_SET;
    if (h < 18) return TM05_SET;
    if (h === 18) return CLI125_SET;
    return CLI225_SET;
  },
};

// Sources: the photograph each drawing was checked against (Wikimedia
// Commons). Builders are the commonly published ones, set down from
// memory; figures Trainsheet could not stand behind are left out.
const CM = "https://commons.wikimedia.org/wiki/File:";
const f205 = { model: "JR 205 series", type: "Electric multiple unit", builder: "Nippon Sharyo / Tokyu Car / Kawasaki Heavy Industries",
  source: `${CM}KRL_Commuterline_on_the_Bogor_Line_with_JR_205_series_at_Manggarai.jpg` };
const f6000 = { model: "Tokyo Metro 6000 series", type: "Electric multiple unit", builder: "Nippon Sharyo",
  source: `${CM}TM_6007F_CL_Bogor_%28MRI%29.jpg` };
const f05 = { model: "Tokyo Metro 05 series", type: "Electric multiple unit", builder: "Nippon Sharyo",
  source: `${CM}KAIC_05TM_05-102F_2022-07-23.jpg` };
const f125 = { model: "SFC120-V (CLI-125)", type: "Electric multiple unit", builder: "CRRC Qingdao Sifang",
  source: `${CM}CLI-125.1012_memasuki_Stasiun_Jakarta_Kota_11022025.jpg` };
const f225 = { model: "iE305 (CLI-225)", type: "Electric multiple unit", builder: "PT INKA",
  source: `${CM}Perdana_dinas_KRL_INKA_seri_iE305_Trainset_2_lintas_Bogor.jpg` };
const f8500 = { model: "Tokyu 8500 series", type: "Electric multiple unit", builder: "Tokyu Car Corporation",
  source: `${CM}TKK8518_JAKK.jpg` };
const f203 = { model: "JR 203 series", type: "Electric multiple unit", builder: "Japanese National Railways",
  source: `${CM}203_series_BOO109_KRL_Commuter_Line_Maja.jpg` };
const f7000 = { model: "Tokyo Metro 7000 series", type: "Electric multiple unit", builder: "Nippon Sharyo",
  source: `${CM}7000TM22.jpg` };
const fCc201 = { model: "CC201/CC203", type: "Diesel-electric locomotive", builder: "GE Transportation (U18C/U20C family)",
  source: `${CM}KA_430_Lokal_Merak_%28Gapeka_2021%29.jpg` };
const fK3 = { model: "K3 economy coach", type: "Locomotive-hauled passenger coach", builder: "PT INKA",
  source: `${CM}KA_430_Lokal_Merak_%28Gapeka_2021%29.jpg` };
export const FACTS = {
  kci205Cab: { ...f205,
    about: "An end car of a JR 205 series set, the main fleet of the KRL Commuter Line: stainless with a red stripe under the windows and a thin yellow stripe under it, a red band across the front face and a red plow, in the current KAI Commuter livery. The set photographed arriving at Manggarai for Jakarta Kota runs 12 cars; the ten drawn are a judgement." },
  kci205Mid: { ...f205,
    about: "An intermediate car of a JR 205 series set, stainless with the red and yellow stripes. The Depok photograph shows the same set in an older livery with a pink women's-car wrap; the paint drawn is the current livery from Manggarai." },
  kci6000Cab: { ...f6000,
    about: "An end car of a Tokyo Metro 6000 series set: stainless with a red stripe under the windows and a thin yellow stripe under it, a red band across the front face, a grey lower front and a red plow. The set photographed at Manggarai is 6007, on a Bogor Line service; the Gambir photograph shows 6015 in the older red/yellow livery." },
  kci6000Mid: { ...f6000,
    about: "An intermediate car of a Tokyo Metro 6000 series set, stainless with the red and yellow stripes. The pantograph on the second car is a reading." },
  kci05Cab: { ...f05,
    about: "An end car of a Tokyo Metro 05 series set: white with a red stripe under the windows and a thin dark line under it, a red band across the front face, a grey lower front and a red plow, a big raked windshield. The set photographed at Jakarta Kota is 05-102F, on a Tanjung Priok Line service." },
  kci05Mid: { ...f05,
    about: "An intermediate car of a Tokyo Metro 05 series set, white with the red stripe and dark line, blue equipment boxes under the floor. The pantograph on the second car is a reading." },
  kci125Cab: { ...f125,
    about: "An end car of an SFC120-V (CLI-125), the new CRRC Qingdao Sifang EMU: a black glossy front with red LED light bars, a silver lower front and a red plow, a grey body with a dark window band and a red diagonal swoosh. The set photographed entering Jakarta Kota is CLI-125.1012; the swoosh's exact curve is a reading." },
  kci125Mid: { ...f125,
    about: "An intermediate car of an SFC120-V (CLI-125), grey with the dark window band and the red diagonal swoosh. The pantograph on the second car is a reading." },
  kci225Cab: { ...f225,
    about: "An end car of an iE305 (CLI-225), the new PT INKA EMU: a red frame round the windshield, a black band under it, a red halftone dotted panel with round headlamps, a grey lower front and a red plow. The set photographed at Manggarai on its first day of service is the second trainset; the swoosh's exact curve is a reading." },
  kci225Mid: { ...f225,
    about: "An intermediate car of an iE305 (CLI-225), silver-grey with the red diagonal swoosh and red doors. The pantograph on the second car is a reading." },
  kci8500Cab: { ...f8500,
    about: "An end car of a Tokyu 8500 series set: stainless with a red stripe under the windows, a red band across the front face, a white lower front and a red plow. The set photographed leaving Jakarta Kota for Bogor is 8518/8618. Retired ~10 Nov 2026; no train in this timetable is drawn as one." },
  kci8500Mid: { ...f8500,
    about: "An intermediate car of a Tokyu 8500 series set, stainless with the red stripe. Retired ~10 Nov 2026; drawn as an extra model only." },
  kci203Cab: { ...f203,
    about: "An end car of a JR 203 series set: red and yellow, a red upper front, a yellow band with the Commuter mark, a red lower front, mesh-covered windshields. The only photograph is a front-end night shot at Maja, so the side is a reading. Retired ~10 Nov 2026; no train in this timetable is drawn as one." },
  kci203Mid: { ...f203,
    about: "An intermediate car of a JR 203 series set, drawn in the same red/yellow livery as the cab car. Retired ~10 Nov 2026; drawn as an extra model only." },
  kci7000Cab: { ...f7000,
    about: "An end car of a Tokyo Metro 7000 series set: grey with a red stripe under the windows, a red band across the front face, a grey lower front and a red plow, a small destination window over the big windshield. The set photographed at Jakarta Kota is 7122. Retired ~10 Nov 2026; no train in this timetable is drawn as one." },
  kci7000Mid: { ...f7000,
    about: "An intermediate car of a Tokyo Metro 7000 series set, grey with the red stripe. Retired ~10 Nov 2026; drawn as an extra model only." },
  kciCc201: { ...fCc201,
    about: "A CC201/CC203-class diesel locomotive of the GE U18C/U20C family, the Lokal Merak's power: a white hood unit with a green roof edge, an orange-red panel on the long hood's side, a red plow, round headlamps on the cab roof. The exact subclass is not distinguishable from the photographs, so it is drawn as one locomotive." },
  kciK3: { ...fK3,
    about: "A K3 economy coach of the Lokal Merak: grey with an orange stripe below the windows, many small windows, a door at each end. The coaches are seen behind the locomotive in both Merak photographs." },
};
