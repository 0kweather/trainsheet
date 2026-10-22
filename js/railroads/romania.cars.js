// Romania's passenger railroads' cars (scripts/railroads/romania.py): CFR
// Călători (its long-distance and its regional trains), Regio Călători,
// InterRegional Călători, Transferoviar Călători, Astra Trans Carpatic,
// Softrans and Ferotrafic TFI. The timetable names no unit, so every train
// is drawn as what usually runs in its category, on its line or between
// its ends, labeled as typical; whether a CFR train runs under the wires
// all the way picks between its electric and diesel stock (ELECTRIC,
// below). Trainsheet's own side views from published dimensions and
// photographs (Wikimedia Commons and the Romanian railway press, 2021-2026),
// at the shared scale (js/carart.js), each in the paint photographed on it
// most recently, lettered here (no logo files). Parts from czechia.cars.js,
// digitraffic.cars.js and carmodels.js.

import { C, rect, circle, path, line, lines, poly, truck, pantograph, slats, underframe } from "../carart.js?v=dev";
import { unit, letters, mark, hvac, hvLine, buffers, exhaust, tank, twinEnded } from "./czechia.cars.js?v=dev";
import { roofCover } from "./digitraffic.cars.js?v=dev";
import { bilevel, newId, coachCar } from "../carmodels.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 3, depth = 1.3) => underframe(a, b, top, { depth, boxes: k, tanks: false });
const plug = (x, y0, y1, w = 4.3, fill = null) => ({ x, w, y0, y1, leaves: 2, glassY: 0.38, glassH: 0.48, grabs: false, ...(fill ? { fill } : {}) });

// ---------- ARF's Coradia Stream (RE-IR 101) ----------
// Alstom's six-car low-floor interregional unit (Chorzów and Bautzen,
// 2023-2026; 37 for ARF, the Railway Reform Authority: 12 run by CFR
// Călători, 13 by InterRegional Călători): 121.2 m, 351 seats (55 first
// class), 160 km/h, 25 kV; articulated, the cars sharing Jakobs trucks, a
// motor truck under each cab; a long sloping nose; double doors a side.
// ARF's paint, whoever runs it (photographs, Cernavodă August 2026 and the
// press, 2024-2026; the "Red Arrow"): white; the cab burgundy back along
// the roof's edge and down in one slant to the first door; along the lower
// body a band of burgundy and gray peaks, one under each window; blue
// doors. First class (car 1): an orange line along the roof's edge and a
// small orange "1" by the windows.
const ARF = { burg: "#8f1230", burgLit: "#c0273d", burgDark: "#861529", white: "#f2f3f3", grey: "#c9cbce", greyDark: "#b2b5b9", door: "#1f74bd",
  orange: "#f2961e", roof: "#a9aeb4" };
// The lower body's band of peaks, as photographed: burgundy peaks rising
// between the windows, a gray valley over each window's foot, at an even
// pitch along the car; each face two-toned, lit on the left, the burgundy
// faces running down to the sill. v0: a valley's center (under a window).
function peaks(x0, x1, v0, pitch, top, low, sill) {
  let s = "";
  const k0 = Math.floor((x0 - v0) / pitch) - 1;
  for (let v = v0 + k0 * pitch; v < x1 + pitch; v += pitch) {
    const p = v + pitch / 2, q = v + pitch;           // the next peak and valley
    s += path(poly([[v, sill - 1], [v, low], [p, top], [p, sill - 1]]), ARF.burgLit) + path(poly([[p, sill - 1], [p, top], [q, low], [q, sill - 1]]), ARF.burgDark);
    s += path(poly([[v - pitch / 2, top], [v, top], [v, low]]), ARF.grey) + path(poly([[v, top], [p, top], [v, low]]), ARF.greyDark);
  }
  return s;
}
const CS = { roof: 13.9, sill: 3.6, low: 2.6, winY: 6.15, winH: 3.8, peak: 6.7, foot: 4.15, doorTop: 11.2 };
const NOSE_CS = [[1.6, 3.6], [0.9, 5.4], ["q", 0.7, 7.2, 1.8, 8.4], [5.6, 12.6], ["q", 6.8, 13.9, 9.2, 13.9]];
const csWin = (xs, w = 5.0) => [{ xs, y: CS.winY, w, h: CS.winH, r: 0.5 }];
// Car 1 (the first-class end): the cab's side window, two windows either
// side of the "1", the door, five windows. The middle cars: a window, a
// door, three windows (two and a blank panel on some), a door, a window.
const CS_CAB = { cabWin: 13.8, wins: [18.6, 24.8], door: 31.0, back: seq(37.6, 6.45, 5) };
const CS_MID = { wins: [3.4, 22.5, 30.4, 38.4, 55.3], doors: [14.3, 46.4] };
function csPaint(cab, first) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, ARF.white], [13.0, 3, ARF.roof]]) +
      (cab ? peaks(CS_CAB.door, L + 1, CS_CAB.back[0] + 2.5, 6.45, CS.peak, CS.foot, CS.low) : peaks(-1, L + 1, CS_MID.wins[1] + 2.5, 7.95, CS.peak, CS.foot, CS.low));
    if (first) s += rect(cab ? 17.0 : -1, 12.35, L + 2, 0.65, ARF.orange);
    // The cab's burgundy, running back along the roof edge to just behind
    // the cab and down in one slant to the door.
    if (cab) s += path(`M-1 0L-1 20L17.2 20L17.2 13.0L${CS_CAB.door + 0.2} ${CS.low}L${CS_CAB.door + 0.2} 0Z`, ARF.burg);
    return s;
  };
}
const csDoor = (x) => plug(x, CS.low, CS.doorTop, 4.8, ARF.door);
function csCab(c, first) {
  return unit(c, { roof: CS.roof, sill: CS.sill, drop: { a: 22, b: c.L - 3, y: CS.low }, nose: NOSE_CS, rake: [[1.8, 8.4], [5.6, 12.6]], depth: 3.4, cabLen: 12, lampY: 5.0,
    rows: [{ xs: [CS_CAB.cabWin], y: 7.6, w: 1.6, h: 2.6, r: 0.3 }, ...csWin(CS_CAB.wins, 4.6), ...csWin(CS_CAB.back)], doors: [csDoor(CS_CAB.door)],
    trucks: [9.5, "end"], paint: csPaint(true, first), surround: "#1b1d20",
    extra: (cc, g) => rect(12, CS.roof - 0.05, 20, 1.3, "#2a2c30", 0.4, 'rx="0.2"') + hvac(34, CS.roof, 12, 0.9) + boxes(24, g.L - 6, CS.low, 3, 0.4) +
      (first ? letters(cc, 23.9, 9.0, 1.0, "1", ARF.orange, { weight: 500 }) : "") });
}
function csMid(c) {
  const L = c.L, pan = c.index === 1 || c.index === 2;
  return unit(c, { roof: CS.roof, sill: CS.sill, drop: { a: 5.5, b: L - 5.5, y: CS.low },
    rows: csWin(CS_MID.wins), doors: CS_MID.doors.map(csDoor), trucks: ["end"], paint: csPaint(false, false),
    extra: (cc, g) => (pan ? pantograph(L - 12, CS.roof + 0.4, { up: c.index === 2, facing: -1 }) + hvLine(L - 9, L - 3, CS.roof + 0.4) : hvac(L - 18, CS.roof, 10, 0.9)) +
      hvac(8, CS.roof, 14, 0.9) + boxes(7, g.L - 7, CS.low, 3, 0.4) });
}

// ---------- Electroputere LE 5100 (060-EA; classes 40, 41, 46, 47) ----------
// Electroputere Craiova's six-axle electric (1965-1991, licensed from
// ASEA): 19.8 m over the buffers, Co'Co' on two three-axle trucks 10.3 m
// apart (4.35 m wheelbase, 1250 mm wheels), 4.5 m tall over the folded
// pantographs, 5100 kW; a cab at each end behind a flat, slightly raked
// front with two windshields, a cab door on each side, the machine room
// between with round windows high in the side; two pantographs on the
// roof. Class 41: 160 km/h; 47 and 477: modernised by Softronic.
const EA = { roof: 12.9, sill: 4.3, x0: 2.1, centers: 33.8 };
const ellipse = (cx, cy, rx, ry) => `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${C.glass}" stroke="currentColor" stroke-width="0.4" vector-effect="non-scaling-stroke"/>`;
// One half of the body, its cab on the left (drawn twice, mirrored). o:
// the nose, side windows, cab door, round windows (xs), louvres.
const NOSE_EA = [[EA.x0, EA.sill], [EA.x0, 8.3], [EA.x0 + 0.5, 12.1], ["q", EA.x0 + 0.6, EA.roof, EA.x0 + 1.6, EA.roof]];
function eaHalf(c, paint, o) {
  const L = c.L, { roof, sill, x0 } = o.dims || EA;
  return bilevel({ ...c, cabL: true, cabR: false }, {
    roof, sill, cornerR: 0.8, end: x0, noTrucks: true, nose: o.nose, badge: false, cabLen: 0, base: "#c9ccd0",
    // The paint runs the whole length, not mirrored with the body.
    paint: (cc, g) => (c.far ? `<g transform="matrix(-1 0 0 1 ${L} 0)">${paint(cc, L)}</g>` : paint(cc, L)),
    doors: [{ x: o.door, w: 2.3, y0: sill + 0.4, y1: roof - 1.3, glass: !!o.doorGlass, glassY: 0.62, glassH: 0.25, grabs: true, fill: "rgba(0,0,0,0.05)" }],
    rows: o.rows,
    extra: () => {
      let s = o.screen ? o.screen() : path(poly([[x0 + 0.1, 8.7], [x0 + 0.45, 11.6], [x0 + 0.62, 11.6], [x0 + 0.28, 8.7]]), C.glass);  // the windshield seen edge-on
      s += buffers(0, -1, { end: x0, sill, y: 3.45 });
      s += rect(x0 - 0.1, sill - 1.3, 2.6, 1.3, "currentColor", 0, 'opacity="0.85"');                         // the buffer beam and its plow
      s += path(poly([[x0 + 0.1, 3.0], [x0 + 3.8, 3.0], [x0 + 3.4, 0.7], [x0 + 0.6, 0.6]]), C.black, 0, 'opacity="0.9"');
      s += rect(x0 - 0.05, 6.0, 0.3, 0.75, "#fff6d8", 0.3, 'rx="0.12"') + rect(x0 + (o.topLamp ?? 0) - 0.05, 12.2, 0.3, 0.5, "#fff6d8", 0.3, 'rx="0.12"');  // lamps
      // The cab door's round window, the machine room's.
      if (!o.doorGlass) s += ellipse(o.door + 1.15, 10.3, 0.5, 0.75);
      for (const x of o.portholes || []) s += ellipse(x, 10.6, 0.55, 0.85);
      for (const [x, w] of o.grilles || []) s += rect(x, 7.6, w, 3.6, "rgba(20,22,25,0.45)", 0.4, 'rx="0.1"') + slats(x, 7.6, w, 3.6, 0.3, "rgba(255,255,255,0.22)");
      if (o.louvres) s += rect(o.louvres, roof - 1.0, L / 2 - o.louvres + 1, 0.75, "rgba(20,22,25,0.35)", 0.3) + slats(o.louvres, roof - 1.0, L / 2 - o.louvres + 1, 0.75, 0.32, "rgba(255,255,255,0.3)");
      return s;
    },
  });
}
const EA_BODY = { nose: NOSE_EA, door: EA.x0 + 7.0, rows: [{ xs: [EA.x0 + 1.2], y: 8.6, w: 2.4, h: 2.8, r: 0.3 }, { xs: [EA.x0 + 4.1], y: 8.6, w: 2.3, h: 2.8, r: 0.3 }], portholes: [18.4, 26.4] };
function ea(c, paint, over, o = EA_BODY) {
  const L = c.L, { roof, sill } = o.dims || EA, centers = (o.dims || EA).centers;
  // Both halves drawn, the far one mirrored (its paint mirrored back).
  const id = newId(), clip = `<clipPath id="${id}"><rect x="-5" y="-5" width="${n(L / 2 + 5.3)}" height="30"/></clipPath>`;
  let s = clip + `<g clip-path="url(#${id})">${eaHalf({ ...c, coupledL: false, coupledR: false }, paint, o)}</g>` +
    `<g transform="matrix(-1 0 0 1 ${L} 0)"><g clip-path="url(#${id})">${eaHalf({ ...c, far: true, mirrored: !c.mirrored, coupledL: false, coupledR: false }, paint, o)}</g></g>`;
  for (const k of [-1, 1]) s += truck(L / 2 + (k * centers) / 2, { wb: o.wb ?? 14.3, d: o.wheel ?? 49, kind: "loco", top: sill, axles: 3 });
  if (o.diesel) return s + o.diesel(c, L) + (over ? over(c, L) : "");
  s += underframe(L / 2 - 8, L / 2 + 8, sill, { depth: 1.6, boxes: 2, tanks: true });
  // The roof: two pantographs (the trailing one up), the main breaker and
  // the high-voltage line between them, resistor hoods.
  s += pantograph(L * 0.27, roof + 0.55, { up: false }) + pantograph(L * 0.73, roof + 0.55, { up: true, facing: -1 });
  s += rect(L * 0.27 - 3, roof - 0.05, 6, 0.6, C.steelDark, 0.4, 'rx="0.2"') + rect(L * 0.73 - 3, roof - 0.05, 6, 0.6, C.steelDark, 0.4, 'rx="0.2"');
  s += hvLine(L * 0.27 + 3.2, L / 2 - 1.5, roof + 0.55) + hvLine(L * 0.73 - 3.2, L / 2 + 1.5, roof + 0.55) + hvac(L / 2 - 5, roof, 10, 0.6);
  return s + (over ? over(c, L) : "");
}
// Class 41 in CFR Călători's red and white, the scheme most of them carry
// (cfr.stfp.net counts 170 of 256; photographs, 410 170 at Buzău 2024,
// 410 872 and 410 242 at București Nord 2024, Bacău 2026): the body
// cream-white, each cab end burgundy back to the cab door, the roof
// gray; "CFR" spaced out in dark gray capitals low in the middle of the
// side, CFR's mark small in red beside it.
const EA41 = { cream: "#e4ded1", red: "#8e1f27", roof: "#6c7076" };
const ea41Paint = (c, L) => bands(L, [[0, 20, EA41.cream], [12.4, 3, EA41.roof]]) +
  rect(-1, 0, EA.x0 + 6.9, 20, EA41.red) + rect(L - EA.x0 - 5.9, 0, EA.x0 + 6.9, 20, EA41.red);
const ea41Over = (c, L) => letters(c, L / 2 + 1.5, 7.4, 1.4, "C F R", "#3b3d40", { weight: 500, spacing: "0.1em" }) + cfrMark(c, L / 2 - 6.5, 7.4, 0.9, "#c8202f");
// Class 477 (Softronic's rebuild) in CFR Călători's red (photographs,
// 477 498 at Sinaia 2023 and București Nord 2023, 477 268 at Cluj 2023):
// red, a pale gray band sweeping up from low at the cab to the roof's edge
// toward the other end, gray below the sill line; the number in white on
// the front; CFR's mark in white, small, low in the middle.
const EA47 = { red: "#d9262c", grey: "#c4c6c4", dark: "#6c7076", roof: "#8e9399" };
// The band: the whole lower side at the leading cab, narrowing as it
// rises over the round windows, arching highest three-quarters back and
// coming down again at the far end.
const ea47Paint = (c, L) => bands(L, [[0, 20, EA47.red], [12.3, 3, EA47.roof], [0, 6.4, EA47.dark]]) +
  path(`M-1 6.3L-1 8.7Q8 8.8 ${n(L * 0.2)} 9.3Q${n(L * 0.45)} 10.4 ${n(L * 0.62)} 11.3Q${n(L * 0.8)} 11.9 ${n(L * 0.9)} 11.1Q${n(L * 0.96)} 10.5 ${n(L + 1)} 9.4` +
    `L${n(L + 1)} 8.3Q${n(L * 0.95)} 9.6 ${n(L * 0.88)} 10.4Q${n(L * 0.78)} 11.1 ${n(L * 0.6)} 10.5Q${n(L * 0.42)} 9.7 ${n(L * 0.33)} 8.2Q${n(L * 0.28)} 7.0 ${n(L * 0.25)} 6.3Z`, EA47.grey);
const ea47Over = (c, L) => cfrMark(c, L * 0.72, 7.0, 1.1, "#ffffff");

// The PNRR rebuilds (2025-2026): 38 LE 5100s rebuilt at 6000 kW with
// asynchronous motors and ETCS, 19 by Softronic (481) and 19 by Reloc
// Craiova ("ELASMO", 482), each with new cabs; drawn here as the 482. The
// project's paint (photographs, 482 002 at București Nord 2025 and 482 005
// at Războieni 2026): white; along the bottom a navy band, rising in the
// middle of the side into a navy panel edged by a white line, an azure
// panel above it running from the far end to a slant behind the white cab
// section of the leading end; "CFR Călători" and its mark in white on the
// navy.
const P482 = { navy: "#1f2f86", azure: "#2b8be0", white: "#eef1f4", roof: "#d9dde1" };
const NOSE_482 = [[EA.x0 + 0.3, EA.sill], [EA.x0, 6.4], [EA.x0 + 0.1, 8.8], [EA.x0 + 1.2, 12.2], ["q", EA.x0 + 1.5, EA.roof, EA.x0 + 2.8, EA.roof]];
const ea482Paint = (c, L) => bands(L, [[0, 20, P482.white], [0, 6.15, P482.navy]]) +
  path("M15.5 6.4L21.5 12.1L56.5 12.1L61.0 6.4Z", P482.azure) +
  path("M15.6 6.15Q24 7.4 34.0 9.3L45.5 9.3Q53 7.6 59.8 6.15Z", P482.white) + path("M16.6 6.15Q24.4 7.15 34.1 8.95L45.4 8.95Q52.6 7.4 58.8 6.15Z", P482.navy) +
  rect(-1, 6.15, L + 2, 0.25, P482.white);
const ea482Over = (c, L) => letters(c, 40.0, 7.85, 0.62, "CFR Călători", "#ffffff", { weight: 700 }) + cfrMark(c, 40.0, 8.55, 0.55, "#ffffff");
const BODY_482 = { nose: NOSE_482, door: 19.0, doorGlass: true, topLamp: 1.0, louvres: 13,
  rows: [{ xs: [13.0], y: 8.7, w: 2.4, h: 2.4, r: 0.3 }],
  screen: () => path(poly([[EA.x0 + 0.25, 9.0], [EA.x0 + 1.25, 12.0], [EA.x0 + 1.8, 12.0], [EA.x0 + 0.85, 9.0]]), C.glass) };

// ---------- Electroputere 060-DA (classes 60, 62; GM-engined 63/65) ----------
// Electroputere's Sulzer-engined diesel-electric (1959-1985, from a Sulzer,
// BBC and SLM design): 17.0 m over the buffers, Co'Co', 1100 mm wheels; a
// cab at each end, the machine room between with louvred panels and small
// windows; the exhaust and cooling fans on the roof. The GM-engined
// rebuilds (63, 65; now numbered 66x and 64x) keep the body. CFR Călători's
// blue and white, which nearly all its 60s, 62s and 65s wear (cfr.stfp.net;
// photographs, 600 749 at Simeria 2024, 640 950 at Valea Vișeului 2023):
// each cab end blue back past the cab door, the machine room cream-white,
// "C F R" spaced low in the middle with CFR's mark beside it.
const DA = { roof: 12.9, sill: 4.4, x0: 2.0, centers: 29.5 };
const DA60 = { blue: "#1f3f9a", cream: "#e8e4d8", roof: "#5d6268" };
const NOSE_DA = [[DA.x0, DA.sill], [DA.x0, 8.2], [DA.x0 + 0.6, 12.0], ["q", DA.x0 + 0.7, DA.roof, DA.x0 + 1.7, DA.roof]];
const da60Paint = (c, L) => bands(L, [[0, 20, DA60.cream], [12.5, 3, DA60.roof]]) + rect(-1, 0, 9.0, 20, DA60.blue) + rect(L - 8.0, 0, 9.0, 20, DA60.blue);
const da60Over = (c, L) => letters(c, L / 2 + 1.0, 6.9, 1.3, "C F R", "#3b3d40", { weight: 500, spacing: "0.1em" }) + cfrMark(c, L / 2 - 6.0, 6.9, 0.85, DA60.blue);
const BODY_DA = { dims: DA, nose: NOSE_DA, door: DA.x0 + 3.6, doorGlass: true, wb: 12.1, wheel: 43,
  rows: [{ xs: [DA.x0 + 1.0], y: 8.6, w: 2.0, h: 2.7, r: 0.3 }, { xs: [19.6], y: 8.6, w: 1.4, h: 2.4, r: 0.2 }], grilles: [[10.6, 2.6], [13.6, 2.6]],
  diesel: (c, L) => underframe(L / 2 - 7, L / 2 + 7, DA.sill, { depth: 1.9, boxes: 1, tanks: true }) + tank(L / 2 - 6, L / 2 + 3, DA.sill, 1.7) +
    exhaust(L / 2 - 1.2, DA.roof) + [L / 2 - 8, L / 2 + 5].map((x) => rect(x, DA.roof - 0.05, 3.0, 0.45, C.steelDark, 0.4, 'rx="0.2"')).join("") };

// ---------- CFR Călători's coaches ----------
// UIC-Z coaches, 26.4 m (Astra Arad's and the rebuilt Bautzen and Görlitz
// ones): two trucks 19 m apart, a door at each end, the windows between,
// air conditioning on the roof. CFR Călători's paint (photographs at Deva
// 2021, București Nord 2023-2024): silver-gray, two fine navy lines along
// the top of the side, a cream line at the windows' foot, navy below it to
// a second cream line, silver-gray again along the bottom; the doors
// painted with the side; "2" (or "1") in white by the first window;
// CFR's mark in cream on the navy, mid-car. The first-class cars (Amee,
// Alee) carry fewer, wider-spaced compartment windows; no first-class
// numeral or band has been photographed on them, so none is drawn.
const CO = { navy: "#283a78", cream: "#e6dcb2", silver: "#bcc2c9", roof: "#8e959c" };
const COACH = { roof: 13.3, sill: 3.9 };
// The body all CFR coaches share, its paint given: o.rows, o.paint(c, L),
// o.marks(c, L), o.doorFill.
function uicCoach(c, o) {
  const L = c.L, { roof, sill } = COACH, door = 1.6;
  return coachCar(c, {
    roof, sill, end: 0.6, endR: 1.2, base: CO.silver, badge: false, under: true,
    trucks: { centers: 62.3, wb: 8.2, d: 36 }, diaphragm: [4.25, 11.8], rows: o.rows,
    doors: [{ x: door, w: 2.6, h: 7.4, glassY: 0.55, glassH: 0.3 }, { x: L - door - 2.6, w: 2.6, h: 7.4, glassY: 0.55, glassH: 0.3 }],
    livery: () => o.paint(c, L) + (o.doorFill ? [door, L - door - 2.6].map((x) => rect(x, sill + 0.15, 2.6, 7.4, o.doorFill)).join("") : ""),
    extra: (cc) => {
      let s = hvac(L / 2 - 7, roof, 14, 0.7) + [12, 24, L - 24, L - 12].map((x) => path(`M${x - 1.1} ${roof - 0.05}Q${x} ${roof + 0.7} ${x + 1.1} ${roof - 0.05}Z`, C.steelDark, 0.4)).join("");
      s += buffers(0, -1, { sill }) + buffers(L, 1, { sill });
      return s + (o.marks ? o.marks(cc, L) : "");
    },
  });
}
const cfrCoachPaint = (c, L) => bands(L, [[12.5, 3, CO.roof], [12.1, 0.2, CO.navy], [4.6, 3.6, CO.navy], [8.2, 0.22, CO.cream], [4.35, 0.25, CO.cream]]);
// Second class (Bmee, AVA 200): ten compartment windows, a small one at
// each end by the toilet.
// Tall windows, closely spaced (as photographed on IR 1645, 2023), a
// narrow one by each door.
const ROWS_B = [{ a: 8.8, b: 78.0, y: 8.5, w: 2.9, h: 3.6, pitch: 4.3, r: 0.35 }, { a: 5.0, b: 7.0, y: 8.7, w: 1.4, h: 3.2, r: 0.3, pitch: 2 }, { a: 79.6, b: 81.6, y: 8.7, w: 1.4, h: 3.2, r: 0.3, pitch: 2 }];
const ROWS_A = [{ a: 8.8, b: 78.0, y: 8.5, w: 3.6, h: 3.6, pitch: 5.6, r: 0.35 }, { a: 5.0, b: 7.0, y: 8.7, w: 1.4, h: 3.2, r: 0.3, pitch: 2 }, { a: 79.6, b: 81.6, y: 8.7, w: 1.4, h: 3.2, r: 0.3, pitch: 2 }];
const cfrMarks = (cls) => (c, L) => cfrMark(c, L * 0.3, 6.6, 1.4, CO.cream) + (cls ? letters(c, 7.9, 10.4, 1.4, cls, CO.navy, { weight: 600 }) + letters(c, L - 7.9, 10.4, 1.4, cls, CO.navy, { weight: 600 }) : "");
const coach2 = (c) => uicCoach(c, { rows: ROWS_B, paint: cfrCoachPaint, marks: cfrMarks("2"), doorFill: CO.navy });
const coach1 = (c) => uicCoach(c, { rows: ROWS_A, paint: cfrCoachPaint, marks: cfrMarks(null), doorFill: CO.navy });

// The PNRR coaches (2025-2026; Grivița, Pașcani and Remarul's rebuilds:
// second class 21-91, 28-70 and 84-70, first class 18-70 and 19-76, bar
// cars 89-70). Their paint (photographs, București Nord, February 2025):
// white; an azure band through the windows, ending in a slant short of
// each end; navy along the bottom under a white line; the doors red; the
// class numeral in navy in the white end, by the door; "CFR Călători" and
// its mark in white on the navy, mid-car. Second class: open saloons,
// twelve windows. First class (the 18-70s from Remarul) is drawn in the
// same paint with its compartment windows; its numeral isn't drawn, as no
// photograph of one has been found.
const PN = { navy: "#1f2f86", azure: "#2b8be0", white: "#eef1f4", red: "#d42330", roof: "#c9ced4" };
const pnrrPaint = (c, L) => bands(L, [[0, 20, PN.white], [12.6, 3, PN.roof], [0, 6.55, PN.navy]]) +
  path(`M5.6 6.85L12.4 12.3L${n(L - 14.0)} 12.3L${n(L - 5.6)} 6.85Z`, PN.azure) +
  path(`M-1 6.55L${n(L * 0.3)} 6.45Q${n(L / 2)} 6.3 ${n(L * 0.7)} 6.45L${n(L + 1)} 6.55L${n(L + 1)} 6.85Q${n(L / 2)} 6.62 -1 6.85Z`, PN.white);
const ROWS_PN = [{ a: 8.4, b: 78.2, y: 8.0, w: 3.7, h: 3.6, pitch: 5.75, r: 0.45 }];
const ROWS_PN1 = [{ a: 8.4, b: 78.2, y: 8.0, w: 4.4, h: 3.6, pitch: 7.4, r: 0.45 }];
const pnrrMarks = (cls) => (c, L) => letters(c, L / 2, 5.0, 0.7, "CFR Călători", "#ffffff", { weight: 700 }) + cfrMark(c, L / 2, 5.85, 0.6, "#ffffff") +
  (cls ? letters(c, 6.4, 11.2, 1.7, cls, PN.navy, { weight: 600 }) + letters(c, L - 7.4, 11.2, 1.7, cls, PN.navy, { weight: 600 }) : "");
const pnrr2 = (c) => uicCoach(c, { rows: ROWS_PN, paint: pnrrPaint, marks: pnrrMarks("2"), doorFill: PN.red });
const pnrr1 = (c) => uicCoach(c, { rows: ROWS_PN1, paint: pnrrPaint, marks: pnrrMarks(null), doorFill: PN.red });

// Couchette (Bcmee, 40-70/44-31) and sleeping cars (WLABmee 71-70, 70-91):
// no recent photograph of their sides has been found; drawn in the paint
// last photographed on them (București Nord and Budapest, 2015-2016):
// CFR blue over silver-gray, a yellow line between on the sleepers, the
// couchettes lettered "VAGON CUȘETĂ" in the gray.
const SLP = { blue: "#3a4f9e", silver: "#c3c7cc", yellow: "#f0c419" };
const couchettePaint = (c, L) => bands(L, [[12.5, 3, CO.roof], [7.6, 5.0, SLP.blue], [0, 7.6, SLP.silver]]);
const sleeperPaint = (c, L) => bands(L, [[12.5, 3, CO.roof], [7.4, 5.2, SLP.blue], [0, 7.4, SLP.silver], [7.2, 0.35, SLP.yellow]]);
const couchette = (c) => uicCoach(c, { rows: [{ a: 9.6, b: 77.0, y: 8.5, w: 4.0, h: 3.0, pitch: 6.45, r: 0.4 }], paint: couchettePaint,
  marks: (cc, L) => letters(cc, L / 2, 6.6, 0.75, "VAGON CUȘETĂ", SLP.blue, { weight: 600, spacing: "0.08em" }) });
const sleeper = (c) => uicCoach(c, { rows: [{ a: 9.6, b: 77.0, y: 8.7, w: 3.3, h: 2.8, pitch: 6.9, r: 0.4 }], paint: sleeperPaint });

// Double-deck coaches (Görlitz-built, rebuilt at Remar Pașcani: 26-16 B,
// 36-16 AB): 26.8 m, trucks 19.5 m apart; a mid-level end over each truck
// with a wide door at its inner end, the two decks between. Their paint
// (photographs at Făurei 2021 and Bacău, May 2026): blue; the upper deck's
// windows in a pale gray band to the roof, the lower deck's in another;
// on the AB, with first class on the lower deck, a yellow line over the
// lower band and the yellow "1" by the door (a white "2" for the upper
// deck); CFR's mark in white by the door.
const DD = { blue: "#2c43a6", pale: "#d9d8d2", yellow: "#f2c21b", roof: "#9aa0a7" };
function ddCoach(c, ab) {
  const L = c.L, roof = 15.1, sill = 4.1, low = 1.7;
  const doors = [{ x: 12.0, w: 3.9, y0: low + 0.1, y1: 11.2, leaves: 2, glassY: 0.3, glassH: 0.55, grabs: false, fill: DD.pale },
    { x: L - 15.9, w: 3.9, y0: low + 0.1, y1: 11.2, leaves: 2, glassY: 0.3, glassH: 0.55, grabs: false, fill: DD.pale }];
  const lower = seq(17.6, 6.0, 9), upper = seq(17.4, 6.0, 9);
  return bilevel(c, {
    roof, sill, cornerR: 1.6, end: 0.6, noTrucks: true, drop: { a: 16.2, b: L - 16.2, y: low }, badge: false, base: DD.blue,
    rows: [{ xs: lower, y: 4.4, w: 4.0, h: 2.9, r: 0.55 }, { xs: upper, y: 11.0, w: 4.2, h: 2.2, r: 0.6 }, { xs: [6.2, L - 7.6], y: 5.0, w: 1.4, h: 1.7, r: 0.2 }],
    doors, diaphragm: [sill + 0.2, 13.4],
    // Blue; the upper deck's windows in a pale band running up into the
    // roof, the lower deck's in another; on the ends a pale panel high on
    // the side, a small window under it.
    paint: () => bands(L, [[0, 20, DD.blue], [13.9, 6, DD.pale]]) + rect(16.0, 10.6, L - 32.0, 4, DD.pale) + rect(16.0, 3.9, L - 32.0, 3.7, DD.pale) +
      rect(1.6, 8.0, 9.8, 4.2, DD.pale) + rect(L - 11.4, 8.0, 9.8, 4.2, DD.pale) +
      (ab ? rect(16.0, 7.9, L - 32.0, 0.42, DD.yellow) : ""),
    extra: (cc) => truck(8.6, { wb: 8.2, d: 36, top: sill }) + truck(L - 8.6, { wb: 8.2, d: 36, top: sill }) + underframe(19, L - 19, low, { depth: 0.5, boxes: 3, tanks: false }) +
      buffers(0, -1, { sill }) + buffers(L, 1, { sill }) +
      (ab ? letters(cc, 17.6, 9.3, 1.3, "1", DD.yellow, { weight: 600 }) + letters(cc, 19.8, 9.3, 1.3, "2", "#f2f0ea", { weight: 600 }) : letters(cc, 17.8, 9.3, 1.3, "2", "#f2f0ea", { weight: 600 })) +
      cfrMark(cc, 25.5, 9.5, 0.9, "#f2f0ea") + letters(cc, L - 17.8, 9.3, 1.3, "2", "#f2f0ea", { weight: 600 }),
  });
}

// ---------- PESA's regional units for ARF (RE-R, PESA 655-5) ----------
// Three cars, 77.2 m (77.16 m lettered on the side), 25 kV, 160 km/h,
// Bo'Bo' + 2'2' + 2'2': each car on its own two trucks, the first one
// powered. Each car's floor is low between its trucks and raised over them,
// so its windows sit at two heights: high over the trucks, low in the
// middle by the doors. Second class only, 238 seats. ARF's paint for these
// (photographs at Ciulnița, Fetești and Bucharest, January-August 2026):
// silver; the cab blue from the front, the blue running back along the
// roof's edge and tapering away; the windows in dark frames; a navy panel
// beside each group of windows (over the low ones, under the high ones),
// some carrying a Romanian folk motif of eight-pointed stars in white;
// blue doors, the motif in white strips low on each leaf; "2" by the
// door; ARF's mark behind the cab.
const RER = { silver: "#c3c6ca", blue: "#2b55a8", navy: "#25386f", frame: "#2a2d33", door: "#2d4a8c", roof: "#9aa0a7" };
const NOSE_RER = [[1.8, 3.4], [0.9, 5.2], ["q", 0.7, 7.4, 1.4, 8.6], [3.6, 12.8], ["q", 4.6, 14.0, 6.8, 14.0]];
// The folk motif: a panel of small eight-pointed stars in rows, white on
// navy, w by h ft, centered at (x, y).
function motif(x, y, w, h, size = 0.5) {
  const cols = Math.max(1, Math.round(w / size)), rows = Math.max(1, Math.round(h / size)), sx = w / cols, sy = h / rows;
  let d = "";
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const cx = x - w / 2 + sx * (i + 0.5), cy = y - h / 2 + sy * (j + 0.5), r = Math.min(sx, sy) * 0.46, q = r * 0.4;
    d += `M${n(cx)} ${n(cy - r)}L${n(cx + q)} ${n(cy - q)}L${n(cx + r)} ${n(cy)}L${n(cx + q)} ${n(cy + q)}L${n(cx)} ${n(cy + r)}L${n(cx - q)} ${n(cy + q)}L${n(cx - r)} ${n(cy)}L${n(cx - q)} ${n(cy - q)}Z`;
  }
  return path(d, "#ffffff", 0, 'opacity="0.92"');
}
// ARF's mark: a blue stroke and a red chevron over "ARF" in navy capitals.
const arfMark = (c, x, y, h) => mark(c, x, y,
  `<path d="M${n(-0.35 * h)} ${n(-0.55 * h)}L${n(0.15 * h)} ${n(-0.88 * h)}L${n(0.12 * h)} ${n(-0.82 * h)}Z" fill="#2b55c8"/>` +
  `<path d="M${n(-0.45 * h)} ${n(-0.45 * h)}L${n(0.5 * h)} ${n(-0.92 * h)}L${n(0.32 * h)} ${n(-0.45 * h)}L${n(0.26 * h)} ${n(-0.5 * h)}L${n(0.38 * h)} ${n(-0.78 * h)}Z" fill="#d6283a"/>` +
  `<text x="0" y="${n(0.42 * h)}" font-size="${n(0.95 * h)}" text-anchor="middle" font-weight="400" letter-spacing="${n(-0.04 * h)}" font-family="'Avenir Next', 'Helvetica Neue', Helvetica, Arial, sans-serif" fill="#2e3170">ARF</text>`);
const RR = { roof: 14.0, sill: 4.0, low: 2.6, hiY: 8.1, hiH: 4.15, loY: 4.7, loH: 4.6, doorTop: 12.8 };
const rerDoor = (x) => plug(x, RR.low, RR.doorTop, 4.4, RER.door);
const hiRow = (xs, w = 3.8) => ({ xs, y: RR.hiY, w, h: RR.hiH, r: 0.4 });
const loRow = (xs, w = 4.0) => ({ xs, y: RR.loY, w, h: RR.loH, r: 0.4 });
// A group of windows in its dark frame.
const frameRow = (r) => rect(r.xs[0] - 0.35, r.y - 0.35, r.xs[r.xs.length - 1] + r.w - r.xs[0] + 0.7, r.h + 0.7, RER.frame, 0, 'rx="0.45"');
// The navy panel beside a group: over a low one, under a high one; with the
// stars on it or not.
const navyOver = (r, stars) => { const x0 = r.xs[0] - 0.4, x1 = r.xs[r.xs.length - 1] + r.w + 0.4, y = r.y + r.h + 0.4;
  return rect(x0, y, x1 - x0, 2.4, RER.navy) + (stars ? motif(x0 + stars, y + 1.2, 6.0, 1.7) : ""); };
const navyUnder = (r, stars) => { const x0 = r.xs[0] - 0.4, x1 = r.xs[r.xs.length - 1] + r.w + 0.4, y = r.y - 2.45;
  return rect(x0, y, x1 - x0, 2.1, RER.navy) + (stars ? motif((x0 + x1) / 2, y + 1.05, 5.0, 1.5) : ""); };
const doorStars = (x) => [0.75, 3.65].map((dx) => motif(x + dx, RR.low + 2.0, 0.5, 2.6) + motif(x + dx, RR.low + 5.6, 0.5, 1.6)).join("");
// Car 1 (powered) and car 3 (trailer): the cab, a narrow window and two
// high ones over the leading truck, "2", the door, five low windows, three
// high ones over the trailing truck.
const RER_CAB = { hi: hiRow([13.0], 1.4), hi2: hiRow([16.0, 20.2]), door: 27.0, lo: loRow(seq(33.4, 5.9, 5)), back: hiRow(seq(64.6, 5.4, 3)) };
const RER_MID = { front: hiRow(seq(3.6, 5.4, 3)), door1: 21.4, lo: loRow(seq(28.2, 5.9, 4)), door2: 54.6, back: hiRow(seq(61.6, 5.4, 3)) };
function rerPaint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, RER.silver], [13.4, 3, RER.roof]]);
    const groups = cab ? [RER_CAB.hi2, RER_CAB.lo, RER_CAB.back] : [RER_MID.front, RER_MID.lo, RER_MID.back];
    s += groups.map(frameRow).join("");
    s += cab ? navyOver(RER_CAB.lo, 5.0) + navyUnder(RER_CAB.back, true) : navyUnder(RER_MID.front, true) + navyOver(RER_MID.lo, 0) + navyUnder(RER_MID.back, false);
    // The cab's blue: the front and the cab's side, then back along the
    // roof's edge, tapering away over the first windows.
    if (cab) s += path("M-1 0L-1 20L12.0 20L12.0 14.0Q30 13.6 46 13.2L46 13.0Q26 12.4 12.0 11.6L11.0 9.8Q10.4 4.0 9.0 2.0L9.0 0Z", RER.blue);
    return s;
  };
}
function rerCab(c) {
  const L = c.L, power = c.index === 0;
  return unit(c, { roof: RR.roof, sill: RR.sill, drop: { a: 26, b: 60, y: RR.low }, nose: NOSE_RER, rake: [[1.4, 8.6], [3.6, 12.8]], depth: 3.0, cabLen: 10, lampY: 5.0,
    rows: [RER_CAB.hi, RER_CAB.hi2, RER_CAB.lo, RER_CAB.back], doors: [{ x: 9.2, w: 2.3, y0: RR.sill + 0.2, y1: 12.6, glassY: 0.5, glassH: 0.38, grabs: true, fill: "rgba(0,0,0,0.06)" }, rerDoor(RER_CAB.door)],
    trucks: [9.5, L - 10.5], paint: rerPaint(true), surround: "#16181b",
    extra: (cc, g) => doorStars(RER_CAB.door) + arfMark(cc, 12.6, 6.4, 1.5) + letters(cc, 25.2, 10.6, 1.2, "2", "#ffffff", { weight: 600 }) +
      hvac(14, RR.roof, 10, 0.7) + (power ? pantograph(L - 22, RR.roof + 0.4, { up: true, facing: -1 }) + hvLine(L - 19, L - 13, RR.roof + 0.4) + rect(30, RR.roof - 0.05, 16, 0.9, C.steelDark, 0.4, 'rx="0.2"')
        : hvac(L - 26, RR.roof, 10, 0.7)) + boxes(28, 58, RR.low, 3, 0.45) });
}
function rerMid(c) {
  return unit(c, { roof: RR.roof, sill: RR.sill, drop: { a: 20.4, b: 60.6, y: RR.low },
    rows: [RER_MID.front, RER_MID.lo, RER_MID.back], doors: [rerDoor(RER_MID.door1), rerDoor(RER_MID.door2)], trucks: [9.5, c.L - 9.5], paint: rerPaint(false),
    extra: (cc, g) => doorStars(RER_MID.door1) + doorStars(RER_MID.door2) + letters(cc, 27.0, 10.6, 1.2, "2", "#ffffff", { weight: 600 }) +
      hvac(6, RR.roof, 10, 0.7) + hvac(g.L - 16, RR.roof, 10, 0.7) + boxes(23, 58, RR.low, 3, 0.45) });
}

// ---------- The private railroads' second-hand units ----------

// Ex-DB class 628/928 (Duewag and LHB, 1986-1996): a motor car (628) and a
// cab trailer (928) of about 23 m each, two trucks apiece, the power pack
// under the motor car; a wedge cab under a big windshield; a folding door
// near each end. InterRegional Călători and Regio Călători run them in DB's
// traffic red as delivered (photographs, 628 607 at Oradea 2022, 928 650 at
// Războieni August 2026): red, a pale gray band low on the side over mid
// gray, the windshield in a dark gray surround, the doors pale gray;
// InterRegional's "IRC" in a red frame on the cab front only.
const DB628 = { red: "#e0161f", pale: "#d9d7cc", grey: "#7f8589", roof: "#b9bec3", door: "#c9cdd0", mask: "#4d5257" };
const NOSE_628 = [[1.0, 3.9], [0.9, 6.6], ["q", 1.0, 7.6, 1.9, 8.4], [3.4, 12.4], ["q", 3.9, 13.2, 5.2, 13.2]];
const db628Paint = (c, g) => bands(g.L, [[0, 20, DB628.red], [12.3, 3, DB628.roof], [0, 5.9, DB628.pale], [0, 5.05, DB628.grey]]) +
  path("M-1 6.4L1.4 6.4L3.6 12.6L-1 12.6Z", DB628.mask);
const vt628 = (c, motor) => unit(c, { roof: 13.2, sill: 3.9, nose: NOSE_628, rake: [[1.9, 8.4], [3.4, 12.4]], depth: 2.2, cabLen: 6, lampY: 5.5, coupler: "buffers",
  rows: [{ xs: [10.4], y: 6.6, w: 1.8, h: 4.3, r: 0.3 }, { xs: seq(14.2, 4.0, 13), y: 6.6, w: 3.0, h: 4.3, r: 0.35 }],
  doors: [{ x: 6.6, w: 3.0, y0: 3.4, y1: 11.2, leaves: 2, glassY: 0.5, glassH: 0.35, fill: DB628.door }, { x: c.L - 5.2, w: 3.0, y0: 3.4, y1: 11.2, leaves: 2, glassY: 0.5, glassH: 0.35, fill: DB628.door }],
  trucks: [9.0, c.L - 9.0], diaphragm: [4.2, 11.8], paint: db628Paint, surround: DB628.mask,
  extra: (cc, g) => hvac(16, 13.2, 10) + (motor ? exhaust(32, 13.2) + tank(28, 36, 3.9, 1.5) : boxes(28, 36, 3.9, 1, 0.9)) + boxes(15, 27, 3.9, 2, 1.3) + boxes(37, g.L - 15, 3.9, 2, 1.2) });

// Bombardier Talent (ex-DB class 644, 1999-2000; Transferoviar Călători):
// three articulated sections, 52 m, on Jakobs trucks, a motor truck under
// each cab; diesel-electric, the generator sets on the end sections' roofs;
// a long raked nose; a double plug door a side in each section. Its paint
// at Transferoviar (photograph, 644 563 at Fieni, March 2026): DB's red,
// the windows in a black band running from the windshield, white along
// the bottom and on the doors, a light gray roof; "1" by the first door of
// the first-class end, "2" by the others; Transferoviar Călători's
// emblem and name in white behind the cab.
const TAL = { red: "#e3201f", black: "#1b1d20", white: "#eef0f2", roof: "#c4c8cc" };
const NOSE_TAL = [[2.0, 3.6], [0.9, 4.8], ["q", 0.5, 6.0, 1.4, 7.2], [6.4, 11.6], ["q", 7.6, 12.9, 9.8, 12.9]];
const talPaint = (cab) => (c, g) => bands(g.L, [[0, 20, TAL.red], [12.3, 3, TAL.roof], [6.6, 4.0, TAL.black], [0, 4.4, TAL.white]]) +
  (cab ? path("M2.2 7.0Q4.0 8.4 6.0 10.4L6.4 10.6L12 10.6L12 6.6L2.6 6.6Z", TAL.black) : "");
const talDoor = (x) => plug(x, 2.6, 11.0, 4.2, TAL.white);
const talMark = (c, x) => mark(c, x, 5.3, `<circle cx="-2.6" cy="0" r="0.45" fill="#ffffff"/>` +
  `<text x="-1.9" y="-0.05" font-size="0.6" font-weight="700" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" fill="#ffffff">TRANSFEROVIAR</text>` +
  `<text x="-1.9" y="0.62" font-size="0.6" font-weight="700" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" fill="#ffffff">CĂLĂTORI</text>`);
function talentCab(c, first) {
  const L = c.L;
  return unit(c, { roof: 12.9, sill: 3.6, drop: { a: 22, b: L - 3, y: 2.6 }, nose: NOSE_TAL, rake: [[1.4, 7.2], [6.4, 11.6]], depth: 3.4, cabLen: 11, lampY: 4.6,
    rows: [{ xs: [13.2], y: 7.0, w: 2.6, h: 3.3, r: 0.35 }, { xs: seq(17.0, 4.9, 3), y: 7.0, w: 4.2, h: 3.3, r: 0.35 }, { xs: seq(L - 18.0, 4.9, 3), y: 7.0, w: 4.2, h: 3.3, r: 0.35 }],
    doors: [talDoor(L - 23.0)], trucks: [10.5, "end"], paint: talPaint(true), surround: TAL.black,
    extra: (cc, g) => roofCover(14, 12.9, 14, 1.2, "#b0b5ba", 3) + exhaust(22, 13.9) + hvac(L - 16, 12.9, 9, 0.6) + boxes(24, L - 6, 2.6, 2, 0.4) + talMark(cc, 23.5) +
      letters(cc, L - 24.4, 9.6, 0.9, first ? "1" : "2", "#ffffff", { weight: 600 }) });
}
const talentMid = (c) => unit(c, { roof: 12.9, sill: 3.6, drop: { a: 5, b: c.L - 5, y: 2.6 },
  rows: [{ xs: seq(3.2, 4.9, 4), y: 7.0, w: 4.2, h: 3.3, r: 0.35 }, { xs: seq(c.L - 20.8, 4.9, 4), y: 7.0, w: 4.2, h: 3.3, r: 0.35 }],
  doors: [talDoor(c.L / 2 - 2.1)], trucks: ["end"], paint: talPaint(false),
  extra: (cc, g) => hvac(4, 12.9, 9, 0.6) + boxes(6, g.L - 6, 2.6, 2, 0.4) + letters(cc, g.L / 2 - 3.0, 9.6, 0.9, "2", "#ffffff", { weight: 600 }) });

// Bombardier Talent (ex-Regiobahn class 643, Transferoviar Călători): two
// sections, 34.6 m, on a shared Jakobs truck, a motor truck under each
// cab; one double plug door a side in each section. Its paint (photograph,
// 643 229 at Slănic, August 2025): white; red over the roof's edge and
// down the nose; the windows in a dark gray band from the windshield; "2"
// and the no-smoking sign in white on dark panels by the doors;
// "TRANSFEROVIAR CĂLĂTORI" in white on a red plate over the windows by the
// articulation; the company's mark and name in red low on the nose.
const T643 = { red: "#e0262b", white: "#eef0f1", band: "#2c2f33", roof: "#d4d7da" };
const tal643Paint = (c, g) => bands(g.L, [[0, 20, T643.white], [10.9, 5, T643.red], [6.9, 4.0, T643.band]]) +
  path("M-1 6.4L-1 11.3L6.0 11.3L2.4 7.0Q2.0 6.6 2.6 6.4Z", T643.red) + path("M2.2 6.9L6.0 10.9L9.0 10.9L9.0 6.9Z", T643.band);
const tfcMark = (c, x, y, h, fill) => mark(c, x, y, `<path d="M${n(-1.2 * h)} ${n(-0.45 * h)}L${n(-0.2 * h)} ${n(-0.45 * h)}L${n(-0.35 * h)} ${n(-0.2 * h)}L${n(-0.75 * h)} ${n(-0.2 * h)}L${n(-0.95 * h)} ${n(0.45 * h)}L${n(-1.25 * h)} ${n(0.45 * h)}Z" fill="${fill}"/>` +
  `<text x="0" y="${n(-0.02 * h)}" font-size="${n(0.42 * h)}" font-weight="600" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" fill="${fill}">TRANSFEROVIAR</text>` +
  `<rect x="0" y="${n(0.12 * h)}" width="${n(3.2 * h)}" height="${n(0.3 * h)}" fill="${fill}"/>`);
const tal643 = (c) => unit(c, { roof: 12.6, sill: 3.6, drop: { a: 18, b: c.L - 3, y: 2.6 }, nose: NOSE_TAL, rake: [[1.4, 7.2], [6.4, 11.6]], depth: 3.0, cabLen: 9, lampY: 4.6,
  rows: [{ xs: seq(10.4, 5.2, 4), y: 7.2, w: 4.4, h: 3.4, r: 0.3 }, { xs: seq(36.6, 5.2, 4), y: 7.2, w: 4.4, h: 3.4, r: 0.3 }],
  doors: [plug(31.2, 2.6, 10.8, 4.2, T643.white)], trucks: [10.0, "end"], paint: tal643Paint, surround: T643.band,
  extra: (cc, g) => rect(18, 12.55, 12, 0.9, "#e6e8ea", 0.4, 'rx="0.2"') + rect(c.L - 18, 12.55, 7, 0.5, C.steelDark, 0.4, 'rx="0.2"') + boxes(19, g.L - 6, 2.6, 2, 0.4) +
    letters(cc, 15.6, 10.0, 1.2, "2", "#ffffff", { weight: 700 }) + (cc.mirrored ? "" : letters(cc, 40.6, 9.6, 1.2, "2", "#ffffff", { weight: 700 }) +
    rect(36.0, 10.25, 20.6, 1.25, T643.red) + rect(36.2, 10.35, 20.2, 1.05, "none", 0, 'stroke="#ffffff" stroke-width="0.6" vector-effect="non-scaling-stroke"') +
    letters(cc, 46.3, 10.87, 0.95, "TRANSFEROVIAR CĂLĂTORI", "#ffffff", { weight: 600, style: "italic" })) +
    tfcMark(cc, 4.6, 5.3, 0.9, T643.red) });

// Alstom Coradia LINT 41 (Transferoviar Călători's ex-Abellio and ex-Keolis
// units, 2023-2025; București-Brașov, Cluj-Bonțida): two sections, 41.8 m,
// on a shared Jakobs truck; a raked nose; one double door a side in each;
// 16 first-class seats. Its paint (photograph at Brașov, 2025): silver; the
// windows in a black band from the windshield, a thin red line over it; a
// red panel at the window band's front end behind the cab; red doors;
// "TRANSFEROVIAR CĂLĂTORI" in a red box and the company's mark low behind
// the cab.
const LINT = { silver: "#c3c7cc", black: "#1b1d20", red: "#d6262c", roof: "#b2b7bd" };
const NOSE_LINT41 = [[1.0, 2.8], [1.0, 5.6], ["q", 1.1, 7.0, 2.0, 8.0], [4.6, 12.4], ["q", 5.4, 13.4, 7.2, 13.4]];
const lintPaint = (c, g) => bands(g.L, [[0, 20, LINT.silver], [12.6, 3, LINT.roof], [6.1, 4.4, LINT.black], [10.6, 0.22, LINT.red], [0, 2.9, "#4a4f55"]]) +
  path("M-1 5.8L6.4 5.8Q9.0 5.8 9.0 8.0L9.0 12.6L-1 12.6Z", LINT.black) + path("M11.6 6.1L13.0 6.1L14.2 10.5L12.8 10.5Z", LINT.red);
const lint41 = (c) => unit(c, { roof: 13.4, sill: 2.8, nose: NOSE_LINT41, rake: [[2.0, 8.0], [4.6, 12.4]], cabLen: 8, lampY: 4.6,
  rows: [{ xs: [9.6], y: 6.4, w: 2.4, h: 3.8, r: 0.45 }, { xs: seq(20.6, 5.6, 8), y: 6.4, w: 4.8, h: 3.8, r: 0.45 }],
  doors: [plug(14.4, 2.8, 10.4, 4.2, LINT.red)], trucks: [10.5, "end"], paint: lintPaint, surround: "#111214",
  extra: (cc, g) => hvac(22, 13.4, 12) + hvac(44, 13.4, 8) + exhaust(37, 13.4) + boxes(25, 40, 2.8, 2, 1.0) + tank(41, 48, 2.8, 1.2) +
    tfcMark(cc, 9.4, 4.8, 1.0, LINT.red) });

// Ex-NS DH2 "Wadloper" (Duewag, 1981-1983; Transferoviar Călători's 78 32xx,
// on the Prahova branches to Slănic and Măneciu and round Târgoviște): two
// cars, about 41 m, each on two trucks with a cab at its outer end; a
// double door behind each cab and the windows between. Transferoviar's
// paint (photographs, Slănic and Pietroșița, 2024-2025): red, white panels
// round the doors and the last windows by the inner end, gray along the
// bottom; the company's mark white on the cab front.
const WAD = { red: "#e2242a", white: "#eef0f1", grey: "#8a9096", roof: "#d7dadd" };
const NOSE_WAD = [[0.8, 3.7], [0.6, 8.4], ["q", 0.6, 12.2, 1.8, 12.6], ["q", 2.4, 12.7, 3.2, 12.7]];
// Its blocks along the side, alternately white and red, full height.
const WAD_WHITE = (L) => [[7.0, 16.6], [26.2, 40.0], [49.4, L + 1]];
const wadPaint = (c, g) => bands(g.L, [[0, 20, WAD.red], [12.0, 3, WAD.roof], [0, 4.4, WAD.grey]]) + WAD_WHITE(g.L).map(([a, b]) => rect(a, 4.4, b - a, 7.4, WAD.white)).join("");
const wadloper = (c) => unit(c, { roof: 12.7, sill: 3.7, nose: NOSE_WAD, rake: [[0.6, 8.0], [0.7, 11.8]], depth: 0.6, cabLen: 5, lampY: 5.0, coupler: "buffers",
  rows: [{ xs: [3.4], y: 7.0, w: 1.8, h: 4.0, r: 0.4 }, { xs: [13.0, 17.6, 21.8, 27.2, 31.6, 36.0, 41.0, 45.2, 51.6, 56.0], y: 6.6, w: 2.8, h: 4.4, r: 0.4 }],
  doors: [plug(7.8, 3.9, 11.2, 4.2, WAD.white), plug(c.L - 7.6, 3.9, 11.2, 4.2, WAD.white)], trucks: [8.5, c.L - 8.5], paint: wadPaint, surround: "#26292d", diaphragm: [4.2, 11.4],
  extra: (cc, g) => hvac(16, 12.7, 10, 0.8) + exhaust(30, 12.7) + boxes(14, g.L - 14, 3.7, 3, 1.1) + letters(cc, 20.6, 10.0, 0.9, "2", "#ffffff", { weight: 700 }) });

// Ex-DB class 614 (MAN and Uerdingen, 1971-1975; Transferoviar's 76 14xx
// and the ADH11 rebuilds): three cars of about 26 m, the end cars powered;
// folding doors a third of the way back and at the inner end. Its paint
// (photographs, 614 029 on the Oltenița line 2024, 761 422 at București
// Nord 2024): red, broad white panels through the windows between the
// doors, gray along the bottom; the mark white on the cab front.
const NOSE_614 = [[1.0, 3.9], [0.8, 7.6], [1.6, 12.4], ["q", 1.9, 13.0, 3.0, 13.0]];
const vt614Paint = (cab) => (c, g) => bands(g.L, [[0, 20, WAD.red], [12.3, 3, WAD.roof], [0, 4.6, WAD.grey]]) +
  (cab ? rect(12.0, 5.0, 18.6, 7.0, WAD.white) + rect(35.6, 5.0, g.L - 41.0, 7.0, WAD.white) + path("M-1 11.6L4.0 11.6Q5.0 12.4 5.4 14L-1 14Z", WAD.roof) : rect(6.0, 5.0, g.L - 12.0, 7.0, WAD.white));
const vt614 = (c, cab) => unit(c, { roof: 13.0, sill: 3.9, nose: cab ? NOSE_614 : null, rake: [[1.0, 8.2], [1.6, 12.2]], depth: 1.4, cabLen: 7, lampY: 5.4, coupler: "buffers",
  rows: cab ? [{ xs: [8.2], y: 7.6, w: 1.8, h: 3.4, r: 0.3 }, { xs: seq(13.2, 4.3, 4), y: 6.8, w: 3.2, h: 4.2, r: 0.35 }, { xs: seq(36.2, 4.3, 9), y: 6.8, w: 3.2, h: 4.2, r: 0.35 }]
    : [{ xs: seq(6.6, 4.3, 17), y: 6.8, w: 3.2, h: 4.2, r: 0.35 }],
  doors: cab ? [plug(31.0, 3.9, 11.2, 4.0, WAD.red), plug(c.L - 5.0, 3.9, 11.2, 3.0, WAD.red)] : [plug(1.6, 3.9, 11.2, 3.0, WAD.red), plug(c.L - 4.6, 3.9, 11.2, 3.0, WAD.red)],
  trucks: [9.0, c.L - 9.0], paint: vt614Paint(cab), surround: "#2a2d31", diaphragm: [4.3, 11.6],
  extra: (cc, g) => hvac(16, 13.0, 10, 0.7) + (cab ? exhaust(30, 13.0) + tank(26, 34, 3.9, 1.6) : "") + boxes(14, g.L - 14, 3.9, 3, 1.0) +
    (cab ? letters(cc, 11.4, 10.4, 1.0, "2", "#ffffff", { weight: 700 }) : "") });

// Alsthom Z2 (CFL class 2000, 1990-1991; sold to Romania 2025-2026): a motor
// car with a cab and a cab trailer, 2 × 26.4 m, each on two trucks; a
// slightly raked flat front; a single plug door a side at each end of each
// car; first class (24 seats) behind the motor car's cab. Two paints in
// 2026 (photographs at București, February and May 2026):
//  - Ferotrafic TFI (InterCity Suceava-București): white, a navy window
//    band over a sky-blue line low on the side, the doors sky blue with
//    "TFI" lettered down them; the cab front red, the red sweeping back
//    over the cab door and down in a slant, a white stripe edging it;
//    "1" by the first-class windows.
//  - Regio Călători (Regio-Expres Brașov-București): red all over, a pale
//    gray band low on the side, the windshield in a dark surround.
const Z2 = { red: "#df2328", white: "#eef0f2", navy: "#1f2c63", sky: "#2a8fd3", grey: "#d2d4d4", roof: "#b5bac0" };
const NOSE_Z2 = [[1.2, 4.1], [0.9, 8.0], [1.5, 12.2], ["q", 1.8, 13.2, 3.2, 13.2]];
const Z2_WINS = (first) => first ? [16.6, ...seq(24.0, 3.85, 14)] : seq(13.2, 3.85, 16);
const z2Paint = (motor) => (c, g) => {
  const L = g.L;
  if (c.agency !== "ferotrafic") return bands(L, [[0, 20, Z2.red], [11.9, 3, Z2.grey], [4.5, 1.2, Z2.grey], [0, 4.5, "#3d4146"]]);
  // Ferotrafic: the navy band behind white-framed windows, the sky-blue
  // line under it; the red cab ending in a slant, a white stripe behind.
  let s = bands(L, [[0, 20, Z2.white], [12.6, 3, Z2.roof], [6.9, 4.5, Z2.navy], [5.6, 1.3, Z2.sky], [0, 4.5, "#3d4146"]]);
  s += path("M-1 0L-1 20L9.0 20L9.0 13.2L12.2 4.5L12.2 0Z", Z2.red) + path("M9.0 13.2L12.2 4.5L13.3 4.5L10.1 13.2Z", Z2.white);
  for (const x of Z2_WINS(motor)) s += rect(x - 0.18, 7.0, 2.86, 4.25, Z2.white, 0, 'rx="0.45"');
  if (motor) s += rect(13.4, 7.0, 1.9, 4.25, Z2.white, 0, 'rx="0.45"');
  return s;
};
const z2Door = (c, x) => plug(x, 4.1, 11.6, 2.6, c.agency === "ferotrafic" ? Z2.sky : Z2.grey);
function z2(c, motor) {
  const L = c.L, fe = c.agency === "ferotrafic";
  return unit(c, { roof: 13.2, sill: 4.1, nose: NOSE_Z2, rake: [[0.9, 8.4], [1.5, 12.2]], depth: 2.2, cabLen: 6, lampY: 5.4, coupler: "buffers",
    rows: [{ xs: [4.0], y: 8.4, w: 1.4, h: 2.6, r: 0.3 }, ...(motor ? [{ xs: [13.6], y: 7.2, w: 1.5, h: 3.85, r: 0.4 }] : []), { xs: Z2_WINS(motor), y: 7.2, w: 2.5, h: 3.85, r: 0.4 }],
    doors: [{ x: 6.8, w: 2.0, y0: 4.6, y1: 11.8, glass: false, grabs: true, fill: fe ? Z2.navy : "rgba(0,0,0,0.06)" }, z2Door(c, motor ? 20.4 : 9.6), z2Door(c, L - 3.6)],
    trucks: [9.5, L - 9.5], paint: z2Paint(motor), surround: "#1d2024", diaphragm: [4.5, 11.8],
    extra: (cc, g) => (motor ? pantograph(L * 0.55, 13.6, { up: true, facing: -1 }) + hvLine(L * 0.55 + 3, L * 0.55 + 9, 13.6) + rect(L * 0.55 - 3, 13.15, 6, 0.5, C.steelDark, 0.4, 'rx="0.2"') : hvac(L * 0.5, 13.2, 10, 0.7)) +
      hvac(18, 13.2, 9, 0.7) + boxes(16, L - 16, 4.1, 3, 1.3) +
      (fe ? letters(cc, motor ? 21.7 : 10.9, 7.0, 0.75, "TFI", "#ffffff", { weight: 800 }) + letters(cc, L - 2.3, 7.0, 0.75, "TFI", "#ffffff", { weight: 800 }) +
        (motor ? rect(15.5, 8.6, 0.8, 1.2, "#ffffff", 0, 'rx="0.1"') + letters(cc, 15.9, 9.2, 0.9, "1", Z2.navy, { weight: 700 }) : "") : "") });
}

// SNCF X 72500 (GEC-Alsthom, 1997-2002; Regio Călători 5001 and others,
// 2023-2024): a high-floor TER diesel unit, two cars of 26.3 m on their
// own trucks; a long nose under a deep raked windshield; a single door a
// side behind the cab. Regio Călători keeps SNCF's TER paint (photograph,
// 5001 at București Nord, March 2024): silver, the nose and cab blue, the
// blue running back in a slant past the cab door; its mark in blue low
// behind the door.
const X72 = { silver: "#b8bec6", blue: "#2b47c4", dark: "#545b64", roof: "#9aa1a9" };
const NOSE_X72 = [[1.6, 3.4], [0.7, 4.6], ["q", 0.6, 6.4, 1.8, 7.6], [6.4, 11.8], ["q", 7.6, 13.4, 10.0, 13.4]];
const x72Paint = (c, g) => bands(g.L, [[0, 20, X72.silver], [12.6, 3, X72.roof], [0, 4.3, X72.dark]]) +
  path("M-1 0L-1 20L10.8 20L10.8 13.2L13.8 4.3L13.8 0Z", X72.blue);
const x72500 = (c) => unit(c, { roof: 13.4, sill: 3.9, nose: NOSE_X72, rake: [[1.8, 7.6], [6.4, 11.8]], depth: 3.0, cabLen: 10, lampY: 4.8,
  rows: [{ xs: seq(19.2, 4.75, 3), y: 6.9, w: 4.5, h: 4.4, r: 0.3 }, { xs: seq(34.4, 4.75, 8), y: 6.9, w: 4.5, h: 4.4, r: 0.3 }],
  doors: [plug(14.4, 3.9, 11.3, 2.6, X72.silver), plug(c.L - 4.0, 3.9, 11.3, 2.6, X72.silver)], trucks: [12.0, c.L - 9.0], paint: x72Paint, surround: "#1d2024",
  extra: (cc, g) => rect(18, 13.35, 16, 0.6, C.steelDark, 0.4, 'rx="0.25"') + slats(19, 13.45, 14, 0.4, 0.4, "rgba(0,0,0,0.3)") + hvac(g.L - 30, 13.4, 12, 0.6) +
    boxes(20, g.L - 14, 3.9, 3, 1.3) + regioMark(cc, 22.0, 5.3, 1.3, X72.blue) });

// SNCF X 4500 "Caravelle" with its XR 8500 trailer (1960s; Regio Călători's
// 57/97 xxxx, on the Brașov, Iași and Alba branches): two cars of about
// 21.2 m, the motor car and a cab trailer, each a cab at its outer end; a
// door at each end of each car; ribbed lower sides. Their paint as
// Regio Călători runs them (photographs, Râșnov and Brețcu 2022-2023): red,
// a cream band through the windows, red over them; its mark on the front.
const CAR = { red: "#b8202d", cream: "#ecdfc0", roof: "#9a9fa5" };
const NOSE_CAR = [[0.8, 3.9], [0.6, 8.6], ["q", 0.6, 12.2, 1.6, 12.4], ["q", 2.2, 12.6, 3.2, 12.6]];
const caravellePaint = (c, g) => bands(g.L, [[0, 20, CAR.red], [12.0, 3, CAR.roof], [7.4, 3.6, CAR.cream]]) +
  lines(seq(4.3, 0.42, 7).map((y) => [-1, y, g.L + 1, y]), "rgba(0,0,0,0.18)", 0.5);
const caravelle = (c, motor) => unit(c, { roof: 12.6, sill: 3.9, nose: NOSE_CAR, rake: [[0.6, 8.2], [0.7, 11.6]], depth: 0.5, cabLen: 4, lampY: 5.2, coupler: "buffers",
  rows: [{ xs: [3.2], y: 8.0, w: 1.6, h: 2.6, r: 0.3 }, { xs: seq(10.4, 5.25, 10), y: 8.0, w: 3.9, h: 2.6, r: 0.4 }],
  doors: [plug(5.2, 3.9, 11.2, 2.6, CAR.red), plug(c.L - 4.4, 3.9, 11.2, 2.6, CAR.red)], trucks: [8.0, c.L - 8.0], paint: caravellePaint, surround: "#26292d", diaphragm: [4.2, 11.2],
  extra: (cc, g) => (motor ? rect(g.L - 18, 12.55, 6, 0.8, CAR.red, 0.4, 'rx="0.2"') + exhaust(g.L - 16.8, 13.3) + tank(30, 40, 3.9, 1.8) : "") + boxes(16, g.L - 16, 3.9, 2, 1.0) });
// LHB VT 2E (built 1987 for the Taunusbahn, "VS2E" on the cab side; Regio
// Călători since 2023, on the lines out of Timișoara): two sections on a
// shared Jakobs truck, 32.62 m (lettered on the side); a flat cab front;
// a double door behind each cab and one by the joint. It still wears its
// German colours (photograph, 609 021 on the Timișoara lines, August
// 2026): ribbed stainless lower sides, a pale gray window band, the cab
// end yellow back past its door, a red stripe slanting down across the
// yellow behind it, red doors; Regio Călători's name in red on the front.
const VT2E = { yellow: "#f5d20f", red: "#d12a2f", steel: "#8a9097", pale: "#d9dcdf", roof: "#a9afb6" };
const NOSE_VT2E = [[0.7, 3.4], [0.6, 11.4], ["q", 0.7, 12.7, 2.4, 12.7]];
const vt2ePaint = (c, g) => bands(g.L, [[0, 20, VT2E.pale], [11.5, 3, "#6f757c"], [3.4, 3.9, VT2E.steel]]) +
  lines(seq(3.7, 0.3, 12).map((y) => [-1, y, g.L + 1, y]), "rgba(0,0,0,0.22)", 0.4) +
  rect(-1, 3.4, 15.2, 9.4, VT2E.yellow) + path("M14.2 11.5L17.4 11.5L20.6 7.3L17.4 7.3Z", VT2E.red) + path("M14.2 7.3L14.2 11.5L15.0 11.5L18.2 7.3Z", VT2E.yellow) + rect(-1, 3.4, 4.0, 3.9, VT2E.steel);
const vt2e = (c) => unit(c, { roof: 12.7, sill: 3.4, nose: NOSE_VT2E, rake: [[0.6, 7.6], [0.65, 11.4]], depth: 0.4, cabLen: 3, lampY: 5.0, coupler: "buffers",
  rows: [{ xs: [3.0], y: 7.4, w: 1.6, h: 3.4, r: 0.3 }, { xs: seq(20.2, 3.6, 3), y: 7.6, w: 3.0, h: 3.0, r: 0.3 }, { xs: seq(36.2, 3.6, 3), y: 7.6, w: 3.0, h: 3.0, r: 0.3 }],
  doors: [plug(6.4, 3.4, 11.0, 4.0, VT2E.red), plug(31.0, 3.4, 11.0, 4.0, VT2E.red)], trucks: [8.5, "end"], paint: vt2ePaint, surround: "#26292d", diaphragm: [4.0, 11.0],
  extra: (cc, g) => hvac(20, 12.7, 8, 0.6) + exhaust(16, 12.7) + boxes(14, g.L - 6, 3.4, 2, 1.2) + slats(4.8, 7.4, 1.2, 3.2, 0.2, "rgba(0,0,0,0.35)") +
    rect(11.0, 7.6, 2.6, 3.0, "none", 0.5, 'rx="0.3"') });

// Regio Călători's mark: its name in two lines beside a round emblem.
const regioMark = (c, x, y, h, fill) => mark(c, x, y, `<circle cx="${n(1.5 * h)}" cy="0" r="${n(0.48 * h)}" fill="none" stroke="${fill}" stroke-width="${n(0.12 * h)}"/>` +
  `<text x="${n(0.9 * h)}" y="${n(-0.06 * h)}" text-anchor="end" font-size="${n(0.42 * h)}" font-weight="700" font-style="italic" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" fill="${fill}">REGIO</text>` +
  `<text x="${n(0.9 * h)}" y="${n(0.42 * h)}" text-anchor="end" font-size="${n(0.42 * h)}" font-weight="700" font-style="italic" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" fill="${fill}">CALATORI</text>`);

// Softronic Hyperion (Softrans's RES 001-003, built in Craiova 2014-2018;
// Craiova-București-Brașov, Constanța in summer): four cars on their own
// trucks, 160 km/h, 25 kV; a long, low pointed nose under a raked
// windshield; one double door a side in each car. Its paint (photograph,
// RES 001 at Constanța, September 2021; none found since): red all over, a
// pale gray roof, the windows dark; "SOFTRANS" in white over the windows
// behind the door.
const HYP = { red: "#c8302f", roof: "#c9cdd1", skirt: "#5c3330" };
const NOSE_HYP = [[3.6, 3.4], [1.2, 4.2], ["q", 0.2, 5.6, 1.4, 6.8], [8.2, 11.4], ["q", 10.2, 13.2, 13.4, 13.2]];
const hypPaint = (c, g) => bands(g.L, [[0, 20, HYP.red], [12.6, 3, HYP.roof]]);
const softransName = (c, x) => letters(c, x, 11.6, 1.7, "SOFTRANS", "#ffffff", { weight: 700, style: "italic", spacing: "0.02em" });
const hypCab = (c) => unit(c, { roof: 13.2, sill: 3.8, nose: NOSE_HYP, rake: [[1.4, 6.8], [8.2, 11.4]], depth: 3.2, cabLen: 12, lampY: 4.6,
  rows: [{ xs: seq(24.6, 5.0, 4), y: 7.4, w: 3.6, h: 3.6, r: 0.4 }, { xs: seq(c.L - 13.6, 4.4, 3), y: 6.4, w: 3.0, h: 3.2, r: 0.4 }],
  doors: [plug(c.L - 21.0, 3.8, 11.2, 4.2, HYP.red)], trucks: [12.5, c.L - 8.5], paint: hypPaint, surround: "#1d1f22",
  extra: (cc, g) => pantograph(30, 13.6, { up: cc.index === 0, facing: -1 }) + hvLine(33, 39, 13.6) + hvac(42, 13.2, 10, 0.6) + boxes(20, g.L - 14, 3.8, 3, 1.3) +
    rect(16.0, 9.0, 2.2, 1.2, C.glass, 0, 'rx="0.3"') + softransName(cc, g.L - 11.0) });
const hypMid = (c) => unit(c, { roof: 13.2, sill: 3.8,
  rows: [{ xs: seq(4.0, 5.0, 4), y: 7.4, w: 3.6, h: 3.6, r: 0.4 }, { xs: seq(c.L - 17.6, 4.4, 3), y: 6.4, w: 3.0, h: 3.2, r: 0.4 }],
  doors: [plug(c.L - 25.0, 3.8, 11.2, 4.2, HYP.red)], trucks: [8.5, c.L - 8.5], paint: hypPaint,
  extra: (cc, g) => hvac(6, 13.2, 10, 0.6) + hvac(g.L - 16, 13.2, 10, 0.6) + boxes(16, g.L - 16, 3.8, 3, 1.1) + softransName(cc, g.L - 15.0) });

// The ex-DSB IC2 (MP/FP: two IC3-family sections on a shared truck; Astra
// Trans Carpatic, București-Brașov, Titu and Arad): about 40 m; a raked
// nose; a single door a side by each end. Astra's paint (photograph, MP
// 5718 at Brașov, March 2022; none found since): green; a broad yellow
// band from the roof's edge down to just over the windows, the windows in
// a dark band edged in green, yellow below them, a dark skirt; a yellow
// arc under the windshield, the nose's foot yellow; Astra's red chevron
// mark on the yellow by the door.
const AST = { green: "#14845a", yellow: "#e9a92a", band: "#1f2a2a", skirt: "#2b3133" };
const NOSE_IC2 = [[2.8, 3.4], [1.0, 4.6], ["q", 0.4, 6.4, 1.6, 8.2], [5.2, 11.6], ["q", 6.8, 13.0, 9.6, 13.0]];
const ic2Paint = (c, g) => bands(g.L, [[0, 20, AST.green], [10.9, 1.6, AST.yellow], [6.6, 3.9, AST.band], [6.2, 0.4, AST.green], [10.5, 0.4, AST.green], [3.4, 2.8, AST.yellow], [0, 3.4, AST.skirt]]) +
  path("M-1 6.0L-1 11.6L7.0 11.6L7.0 6.0Z", AST.green) + path("M0.4 6.6Q2.0 7.4 3.4 8.4L3.6 7.6Q2.2 6.8 0.6 6.2Z", AST.yellow);
const astraMark = (c, x, y, h) => mark(c, x, y, `<path d="M${n(-0.6 * h)} ${n(-0.5 * h)}L${n(0.6 * h)} ${n(-0.5 * h)}L${n(0.6 * h)} ${n(0.1 * h)}L0 ${n(0.6 * h)}L${n(-0.6 * h)} ${n(0.1 * h)}Z" fill="#c6283a"/>` +
  `<path d="M${n(-0.1 * h)} ${n(-0.4 * h)}L${n(0.1 * h)} ${n(-0.4 * h)}L${n(0.05 * h)} ${n(0.5 * h)}L${n(-0.05 * h)} ${n(0.5 * h)}Z" fill="#ffffff"/>`);
const ic2 = (c) => unit(c, { roof: 13.0, sill: 3.4, nose: NOSE_IC2, rake: [[1.6, 8.2], [5.2, 11.6]], depth: 3.4, cabLen: 10, lampY: 4.4,
  rows: [{ xs: [13.2], y: 6.9, w: 9.0, h: 3.3, r: 0.4 }, { xs: [23.0], y: 6.9, w: 12.4, h: 3.3, r: 0.4 }, { xs: [36.2], y: 6.9, w: 12.4, h: 3.3, r: 0.4 }, { xs: [49.4], y: 6.9, w: 10.0, h: 3.3, r: 0.4 }],
  doors: [{ x: 9.6, w: 2.6, y0: 3.6, y1: 11.0, glassY: 0.55, glassH: 0.3, grabs: false, fill: AST.green }], trucks: [9.0, "end"], paint: ic2Paint, surround: "#16191a",
  extra: (cc, g) => boxes(16, g.L - 6, 3.4, 3, 1.1) + astraMark(cc, 19.0, 4.8, 1.6) });

// ---------- Siemens Desiro Classic (class 96) ----------
// CFR's two-car diesel units (Siemens, 2003-2006; 96-2001 to 96-2120 and
// so on; the "Săgeata Albastră" of the 2000s): 41.7 m over the couplers as
// two articulated cars on a shared Jakobs truck, a motor truck under each
// cab; a rounded nose under a big raked windshield, one double plug door a
// side in each car, tall windows. CFR Călători's paint (photographs, 2023
// and 2024): white, the cab's front and the windshield's wrap charcoal, the
// windows set in a silver-gray band, a navy line at floor height over a
// dark skirt, the doors' lower panels red; a short yellow stripe over the
// first-class windows of car 1 with a "1" beside them ("2" in the other
// car); CFR's mark, blue, low on the side.
const DES = { white: "#eceef0", band: "#aeb6bf", navy: "#1d2c7a", red: "#c8202f", cab: "#3b4047", skirt: "#2b2e33", yellow: "#f2c714" };
const NOSE_DES = [[1.2, 2.6], [0.9, 4.4], ["q", 0.8, 6.4, 1.6, 7.6], [4.6, 12.4], ["q", 5.6, 13.8, 7.6, 13.8]];
// CFR's mark, navy: "CFR" in condensed capitals inside a locomotive's
// outline seen side-on (a raked front, roof and frame lines, two wheels),
// speed lines trailing off its back; h ft tall.
const cfrMark = (c, x, y, h, color = DES.navy) => mark(c, x, y,
  `<path d="M${n(1.15 * h)} ${n(-0.48 * h)}L${n(-0.5 * h)} ${n(-0.48 * h)}Q${n(-0.72 * h)} ${n(-0.1 * h)} ${n(-0.78 * h)} ${n(0.36 * h)}L${n(0.62 * h)} ${n(0.36 * h)}" fill="none" stroke="${color}" stroke-width="${n(0.09 * h)}"/>` +
  [[-0.24, 1.0], [0.0, 0.95], [0.24, 0.85]].map(([yy, x2]) => `<path d="M${n(0.62 * h)} ${n(yy * h)}L${n(x2 * h)} ${n(yy * h)}" stroke="${color}" stroke-width="${n(0.06 * h)}"/>`).join("") +
  `<circle cx="${n(-0.25 * h)}" cy="${n(0.45 * h)}" r="${n(0.07 * h)}" fill="${color}"/><circle cx="${n(0.3 * h)}" cy="${n(0.45 * h)}" r="${n(0.07 * h)}" fill="${color}"/>` +
  `<text x="${n(0.02 * h)}" y="${n(0.21 * h)}" font-size="${n(0.62 * h)}" text-anchor="middle" font-weight="700" font-family="'Arial Narrow', 'Roboto Condensed', Helvetica, Arial, sans-serif" fill="${color}">CFR</text>`);
function desPaint(first) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, DES.white], [13.1, 3, "#8e959d"], [7.3, 5.15, DES.band], [3.25, 0.6, DES.navy], [0, 2.45, DES.skirt]]);
    // The charcoal cab: the front and the windshield's wrap, back to the
    // slant behind the cab's side window.
    s += path("M-1 0L-1 20L10.4 20L10.4 13.0Q8.6 9.6 5.2 4.0L4.6 2.85L-1 2.85Z", DES.cab);
    if (first) s += rect(13.8, 12.25, 9.2, 0.55, DES.yellow);
    return s;
  };
}
const desDoor = (x) => ({ x, w: 4.3, y0: 2.6, y1: 11.0, leaves: 2, glassY: 0.42, glassH: 0.5, grabs: false, fill: "#c9cfd6" });
function desiro(c, first) {
  const L = c.L;
  return unit(c, { roof: 13.8, sill: 3.4, drop: { a: 18, b: L - 2, y: 2.6 }, nose: NOSE_DES, rake: [[1.6, 7.6], [4.6, 12.4]], depth: 3.6, cabLen: 9, lampY: 4.6,
    rows: [{ xs: [7.0], y: 7.6, w: 1.8, h: 3.4, r: 0.3 }, { xs: [10.6], y: 7.6, w: 2.0, h: 4.4, r: 0.3 }, { xs: seq(14.0, 5.0, 3), y: 7.6, w: 4.2, h: 4.4, r: 0.35 },
      { xs: [29.0], y: 7.6, w: 2.6, h: 4.4, r: 0.3 }, { xs: seq(42.0, 5.0, 4), y: 7.6, w: 4.2, h: 4.4, r: 0.35 }, { xs: [62.2], y: 7.6, w: 2.4, h: 4.4, r: 0.3 }],
    doors: [desDoor(35.6)], trucks: [10.8, "end"], paint: desPaint(first), surround: "#16181b",
    extra: (cc, g) => rect(35.6, 2.6, 4.3, 1.55, DES.red) + exhaust(24, 13.8) + hvac(14, 13.8, 8, 0.6) + hvac(45, 13.8, 10, 0.6) +
      tank(20, 30, 3.4, 1.6) + boxes(42, 60, 2.6, 2, 0.4) + cfrMark(cc, 32.0, 5.6, 1.3) +
      letters(cc, 18.6, 10.7, 1.4, first ? "1" : "2", "#4a5059", { weight: 500 }) + letters(cc, 46.6, 10.7, 1.4, "2", "#4a5059", { weight: 500 }) });
}

// ---------- Tables ----------
// Each car a type, first class its own type in its real place (the
// Coradia's car 1, the Desiro's first car, the AB double-deck, the IR
// trains' first-class coach next to the locomotive, the Talent 644's and
// the Z2's first-class ends).
export const TYPES = {
  roLint: { name: "Coradia LINT 41 section", kind: "emu", amenities: ["first"] },
  roVt2e: { name: "VT 2E (\"609\") section", kind: "emu" },
  roHypCab: { name: "Hyperion end car", kind: "emu", pan: true },
  roHypMid: { name: "Hyperion middle car", kind: "emu" },
  roIc2: { name: "IC2 (ex-DSB MP/FP) section", kind: "emu" },
  roTal643: { name: "Talent (643) section", kind: "emu" },
  roWadloper: { name: "DH2 \"Wadloper\" diesel car", kind: "emu" },
  ro614Cab: { name: "Class 614 end car", kind: "emu" },
  ro614Mid: { name: "Class 614 middle car", kind: "emu" },
  roZ2Motor: { name: "Z2 (CFL 2000) motor car", kind: "emu", pan: true },
  roZ2Trailer: { name: "Z2 (CFL 2000) cab trailer", kind: "emu" },
  roZ2Motor1: { name: "Z2 (CFL 2000) motor car with first class", kind: "emu", pan: true, amenities: ["first"] },
  roX72500: { name: "X 72500 diesel car", kind: "emu" },
  roCaravelle: { name: "X 4500 \"Caravelle\" motor car", kind: "emu" },
  roCaravelleR: { name: "Caravelle cab trailer", kind: "emu" },
  ro628: { name: "Class 628 diesel motor car", kind: "emu" },
  ro928: { name: "Class 928 driving trailer", kind: "emu" },
  roTalent1: { name: "Talent (644) end section with first class", kind: "emu", amenities: ["first"] },
  roTalentMid: { name: "Talent (644) middle section", kind: "emu" },
  roTalent2: { name: "Talent (644) end section", kind: "emu" },
  ro60: { name: "Class 60/62/65 diesel locomotive (060-DA)", kind: "diesel" },
  roCoach2: { name: "CFR Călători second-class coach", kind: "coach" },
  roCoach1: { name: "CFR Călători first-class coach", kind: "coach", amenities: ["first"] },
  roPnrr2: { name: "CFR Călători modernised coach (PNRR), second class", kind: "coach" },
  roPnrr1: { name: "CFR Călători modernised coach (PNRR), first class", kind: "coach", amenities: ["first"] },
  roCouchette: { name: "Couchette car", kind: "coach", amenities: ["sleeper"] },
  roSleeper: { name: "Sleeping car", kind: "coach", amenities: ["sleeper"] },
  roDD2: { name: "Double-deck coach", kind: "coach" },
  roDD1: { name: "Double-deck coach with first class", kind: "coach", amenities: ["first"] },
  ro482: { name: "Class 481/482 electric locomotive (PNRR rebuild)", kind: "electric", pan: true },
  ro41: { name: "Class 41 electric locomotive", kind: "electric", pan: true },
  ro477: { name: "Class 477 electric locomotive", kind: "electric", pan: true },
  roRerCab: { name: "PESA RE-R end car", kind: "emu", pan: true },
  roRerMid: { name: "PESA RE-R middle car", kind: "emu" },
  roDesiro1: { name: "Desiro (class 96) car with first class", kind: "emu", amenities: ["first"] },
  roDesiro2: { name: "Desiro (class 96) car", kind: "emu" },
  roCsFirst: { name: "Coradia Stream (RE-IR) end car with first class", kind: "emu", amenities: ["first"] },
  roCsMid: { name: "Coradia Stream (RE-IR) middle car", kind: "emu", pan: true },
  roCsCab: { name: "Coradia Stream (RE-IR) end car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
export const MODELS = {
  roLint: M(lint41, 68.7, true),
  roVt2e: M(vt2e, 53.5, true),
  roHypCab: M(hypCab, 86.3, true),
  roHypMid: M(hypMid, 80.4),
  roIc2: M(ic2, 66.0, true),
  roTal643: M(tal643, 56.8, true),
  roWadloper: M(wadloper, 68.2, true),
  ro614Cab: M((c) => vt614(c, true), 87.3, true),
  ro614Mid: M((c) => vt614(c, false), 86.6),
  roZ2Motor: M((c) => z2(c, true), 82.7, true),
  roZ2Motor1: M((c) => z2(c, true), 82.7, true),
  roZ2Trailer: M((c) => z2(c, false), 82.7, true),
  roX72500: M(x72500, 86.3, true),
  roCaravelle: M((c) => caravelle(c, true), 69.7, true),
  roCaravelleR: M((c) => caravelle(c, false), 69.7, true),
  ro628: M((c) => vt628(c, true), 75.6, true),
  ro928: M((c) => vt628(c, false), 75.6, true),
  roTalent1: M((c) => talentCab(c, true), 62.3, true),
  roTalentMid: M(talentMid, 45.9),
  roTalent2: M((c) => talentCab(c, false), 62.3, true),
  ro60: M((c) => ea(c, da60Paint, da60Over, BODY_DA), 55.8),
  roCoach2: M(coach2, 86.6),
  roCoach1: M(coach1, 86.6),
  roPnrr2: M(pnrr2, 86.6),
  roPnrr1: M(pnrr1, 86.6),
  roCouchette: M(couchette, 86.6),
  roSleeper: M(sleeper, 86.6),
  roDD2: M((c) => ddCoach(c, false), 87.9),
  roDD1: M((c) => ddCoach(c, true), 87.9),
  ro482: M((c) => ea(c, ea482Paint, ea482Over, BODY_482), 65.0),
  ro41: M((c) => ea(c, ea41Paint, ea41Over), 65.0),
  ro477: M((c) => ea(c, ea47Paint, ea47Over), 65.0),
  roRerCab: M(rerCab, 86.3, true, byIndex),
  roRerMid: M(rerMid, 80.7),
  roDesiro1: M((c) => desiro(c, true), 68.4, true),
  roDesiro2: M((c) => desiro(c, false), 68.4, true),
  roCsFirst: M((c) => csCab(c, true), 70.5, true),
  roCsMid: M(csMid, 63.9, false, byIndex),
  roCsCab: M((c) => csCab(c, false), 70.5, true),
};
// Units by number, for the fleet pages (the timetable names none): the UIC
// numbers' series and serials run together (410 242 is 410242).
export const FLEETS = {
  cfr: [[410001, 410999, "ro41"], [477001, 477999, "ro477"], [481001, 481019, "ro482"], [482001, 482019, "ro482"], [600001, 629999, "ro60"],
    [640001, 669999, "ro60"], [101002, 101013, "roCsFirst"]],
  cfrregio: [[962001, 962199, "roDesiro1"], [6555001, 6555062, "roRerCab"], [400001, 400999, "ro41"]],
  regiocalatori: [[201, 299, "roZ2Motor"], [5001, 5099, "roX72500"], [570001, 571999, "roCaravelle"], [628001, 628999, "ro628"], [5609001, 5609099, "roVt2e"]],
  interregional: [[628001, 628999, "ro628"], [928001, 928999, "ro928"], [101014, 101026, "roCsFirst"]],
  transferoviar: [[6555001, 6555062, "roRerCab"], [643001, 643999, "roTal643"], [644001, 644999, "roTalent1"], [783201, 783299, "roWadloper"], [614001, 614999, "ro614Cab"], [648201, 648299, "roLint"]],
  astratc: [[5701, 5799, "roIc2"]],
  softrans: [[141001, 141003, "roHypCab"]],
  ferotrafic: [[101, 125, "roZ2Motor1"]],
};

// ---------- Where a train runs ----------
// Whether a train runs under the wires all the way: every station the
// Romanian timetables stop at that lies within 150 m of track OpenStreetMap
// marks electrified (contact line), by its code in the timetable, sorted,
// each as its difference from the one before in two base-36 digits ("~"
// and four for a longer step). Built October 2026.
const ELECTRIC = "3f~077efg1q020r120c0e0t0o0o020c0o150e0o0e0r0e0o0o0e0h0o0c0c020o0o0h0o020c0o0t0c020c0c0q0c0r020c0c0c0c020c0c0c050o0c020c0c0c0c0l0e0o0c0e0c0c050o0c021t0q100e0r020c0o0e0c0c0c050o0o0e0o0c050c0c0q0q0c0r020o0c0e0o0t0o020o0c0h0c0o02100t~01r4qk0obk0o0h0o0e0oeo24xa6x7r0c0e10020o050c~02900q0c0c0e0t0c0o0q0h0c0o1e0t0c0e0o0o0h0q0o0c0e0r021c020c0o170o0o0h0q0c0c1h0q1v0orw120e0l0c0o390c0c0e0h0o0o0e0o0h10020c0o0c0t020o0c0c0e0f0e0c0o0c0e0t0c0c270o0e0c0c0c0h0c0e0c0c0c020o0t0c0c0e0c0o0n0c0c0c0qdd0c0c0c050c0chg0q0r0e0o0e0o0h0o~01clnb~01m602100c0e0c0c050o27220e0f0e100c020c0c050c0c0c0c021t0q0c0c0q1t270o0q0c050c0o0e100n0c0o0q0o050o0e0o0q0r0q0c0o0e0f0q120t100c020c150q100e130q1e0h0c0o020o0c0c0t0q0c0c0e0r020o0o0e0x~02dz~01aw0h~02h50c0e0o0t100q0c0e0f0e100e0o0h0o0c0q0t0c1e0c0c020f0c0c020o0c0c0e0h0o0c0c0q0c050c0c0o0e0o0c050q100c0e0f0e0c0c0c0e0c0c0l0c020o0o020c0f0c0q1e~01c60e0och0c020c0c0cer0l020c0c0c0c020o0h0c~02qh9m1q~01hx1q1710020c0c0t0o0e0c0o1j1e0r0e120o0h101j1e12150c0o0215220h0o0e0o0o0l020o0o12050o0e0c12150o0c0e0c0f120c170c0o0e0o0o0h0e0o1h120q6x0cpp0c0e0h1c120l0q0c0o020c0c0t0q0o0t0o0c020c0c0q0r0e0o0e0c0c0f020c0crw0q0o0h0e0o0c0e0o0f020o0q10050o0e0o0o0t0q0o0c020r0e0o0c0e0o090c0e0c1v0o0c0c0e0c1h0e0c0c0cmz0c0c020c0cqi0e2j~02dq0qf3172n5s0q250c021015020o0c0e0o0f020c0c0o0e0cwm0e0o0h0q0o0c0e~05hz0c02dd0o0e0o0c0h0o1e0t1q0e0c154w1ccpad6f0o0c0c020c0r0e0c0q0c0o0h0o~05xu120o050c0o0e0c0c0c020r0e0o0e0o0f0e0o0e10050c0c0c1v120c0o020t0o1e1h0c020c0c0c171q3g12ut0c0o05390o";
let wired = null;
function electrified() {
  if (wired) return wired;
  wired = new Set();
  for (let i = 0, code = 0; i < ELECTRIC.length;) {
    if (ELECTRIC[i] === "~") { code += parseInt(ELECTRIC.slice(i + 1, i + 5), 36); i += 5; }
    else { code += parseInt(ELECTRIC.slice(i, i + 2), 36); i += 2; }
    wired.add(code);
  }
  return wired;
}
// true: every stop under the wires; false: some not; null: no stops known.
function runsElectric(t) {
  const ids = (t._progress?.stops || []).map((s) => Number(s.stopId)).filter(Number.isFinite);
  if (!ids.length) return null;
  const w = electrified();
  return ids.every((id) => w.has(id));
}

const set = (label, ...units) => ({ label, units });
// CFR Călători's long-distance trains.
//  - InterCity (since 2026 all in modernised stock): a PNRR-rebuilt 481 or
//    482 and the PNRR coaches.
//  - The InterRegio trains its twelve Coradia Streams work, numbered
//    16011-16099 (14 București-Constanța, 6 București-Craiova, 2
//    București-Deva via Târgu Jiu, 2 București-Arad via Craiova, IR
//    16021/16023 București-Brașov-Timișoara; CFR Călători's press
//    releases, November 2024 to March 2026).
//  - Other InterRegio trains: a locomotive and coaches: under the wires
//    usually a class 41 (some trains a 477 or a 481/482), off them a
//    GM-engined 060-DA (class 64x/66x, ex 63/65); first class in one car.
//  - InterRegio Noapte: the same with a couchette and a sleeping car.
const IC_SET = set("InterCity: a rebuilt 481 or 482 locomotive (drawn: 482) and modernised coaches", ["ro482", 1], ["roPnrr1", 1], ["roPnrr2", 3]);
const CORADIA = set("Coradia Stream (RE-IR): six articulated cars, first class at one end", ["roCsFirst", 1], ["roCsMid", 4], ["roCsCab", 1]);
const IR_E = set("Usually a class 41 locomotive (some trains a 477 or a 481/482) and CFR Călători coaches", ["ro41", 1], ["roCoach1", 1], ["roCoach2", 4]);
const IR_D = set("A 060-DA diesel locomotive (class 64x/66x) and CFR Călători coaches", ["ro60", 1], ["roCoach1", 1], ["roCoach2", 4]);
const IRN_E = set("Usually a class 41 locomotive, coaches, a couchette and a sleeping car", ["ro41", 1], ["roCoach1", 1], ["roCoach2", 2], ["roCouchette", 1], ["roSleeper", 1]);
const IRN_D = set("A 060-DA diesel locomotive, coaches, a couchette and a sleeping car", ["ro60", 1], ["roCoach1", 1], ["roCoach2", 2], ["roCouchette", 1], ["roSleeper", 1]);
const IR_477 = set("A class 477 locomotive and CFR Călători coaches", ["ro477", 1], ["roCoach1", 1], ["roCoach2", 4]);
// CFR Călători's regional trains.
//  - The PESA RE-Rs (in service from 6-10 August 2026): R 3021, 3024,
//    3025, 3031, 3032 and RE 3000 București-Brașov; R 8001, 8005, 8006,
//    8010, 8031, 8034 București/Obor-Constanța and Fetești (CFR Călători,
//    August 2026).
//  - Off the wires (and on the airport and Progresu lines, Regio
//    Metropolitan): the Desiros.
//  - Under the wires: a class 40 or 41 with double-deck coaches.
const PESA_TRAINS = new Set([3000, 3021, 3024, 3025, 3031, 3032, 8001, 8005, 8006, 8010, 8011, 8031, 8034]);
const RE_R = set("PESA RE-R: a three-car electric unit", ["roRerCab", 1], ["roRerMid", 1], ["roRerCab", 1]);
const DESIRO = set("Desiro (class 96): a two-car diesel unit", ["roDesiro1", 1], ["roDesiro2", 1]);
const REGIO_E = set("Usually a class 40 or 41 locomotive and double-deck coaches", ["ro41", 1], ["roDD1", 1], ["roDD2", 1]);
const REGIO_DA = set("A 060-DA diesel locomotive and coaches", ["ro60", 1], ["roCoach2", 2]);
const BY_MODEL = { ro41: IR_E, ro477: IR_477, ro482: IC_SET, ro60: IR_D, roCsFirst: CORADIA, roCsMid: CORADIA, roCsCab: CORADIA,
  roDesiro1: DESIRO, roDesiro2: DESIRO, roRerCab: RE_R, roRerMid: RE_R };

// The private railroads (their sites and the Commons photographs, 2022-2026,
// and the trade press for the new ARF units; where a line's stock is not
// confirmed, the label says "usually"):
//  - Regio Călători: Z2s on the Regio-Expres trains Brașov-București (from
//    2026) and its InterRegio; X 72500s on its other Regio-Expres trains;
//    class 628s round Iași and to Dorohoi; Caravelles on the other branch
//    lines (Brașov, Alba, Iași, the Banat).
//  - InterRegional Călători: Coradia Streams on InterRegio București-Brașov
//    (spring 2026) and București-Cluj (July 2026); class 628/928s on the
//    rest.
//  - Transferoviar Călători: PESA RE-Rs București-Roșiori (from 18 August
//    2026); Talent 643s to the airport and to Slănic; Wadlopers to Măneciu;
//    class 614s Titan-Oltenița; Talent 644s round Târgoviște and on its
//    other lines.
//  - Astra Trans Carpatic: its IC2s; Softrans: its Hyperions; Ferotrafic
//    TFI: Z2s (the Suceava-București InterCity, from May 2026).
const Z2_RC = set("Z2 (ex-CFL 2000): a two-car electric unit", ["roZ2Motor", 1], ["roZ2Trailer", 1]);
const Z2_FE = set("Z2 (ex-CFL 2000): a two-car electric unit, first class behind the cab", ["roZ2Motor1", 1], ["roZ2Trailer", 1]);
const X72_SET = set("Usually an X 72500: a two-car diesel unit", ["roX72500", 2]);
const CARAVELLE = set("Usually a Caravelle (X 4500) and its trailer", ["roCaravelle", 1], ["roCaravelleR", 1]);
const VT2E_SET = set("VT 2E: a two-section diesel unit, in its German colours", ["roVt2e", 2]);
const Z2_RC_SET = set("Usually a Z2 (ex-CFL 2000; some trains a BB 25500 with RIO coaches)", ["roZ2Motor", 1], ["roZ2Trailer", 1]);
const VT628 = set("Class 628/928: a two-car diesel unit", ["ro628", 1], ["ro928", 1]);
const TAL643 = set("Talent (643): a two-section diesel unit", ["roTal643", 2]);
const TAL644 = set("Usually a Talent (644): a three-section diesel unit, first class at one end", ["roTalent1", 1], ["roTalentMid", 1], ["roTalent2", 1]);
const LINT41 = set("Coradia LINT 41: a two-section diesel unit", ["roLint", 2]);
const WADLOPER = set("DH2 \"Wadloper\": a two-car diesel unit", ["roWadloper", 2]);
const VT614 = set("Class 614: a three-car diesel unit", ["ro614Cab", 1], ["ro614Mid", 1], ["ro614Cab", 1]);
const HYPERION = set("Hyperion: a four-car electric unit", ["roHypCab", 1], ["roHypMid", 2], ["roHypCab", 1]);
const IC2 = set("IC2 (ex-DSB): a two-section diesel unit", ["roIc2", 2]);
const BY_MODEL2 = { roZ2Motor: Z2_RC, roZ2Trailer: Z2_RC, roZ2Motor1: Z2_FE, roX72500: X72_SET, roCaravelle: CARAVELLE, roCaravelleR: CARAVELLE, ro628: VT628, ro928: VT628,
  roTal643: TAL643, roTalent1: TAL644, roTalentMid: TAL644, roTalent2: TAL644, roWadloper: WADLOPER, ro614Cab: VT614, ro614Mid: VT614, roHypCab: HYPERION, roHypMid: HYPERION, roIc2: IC2, roVt2e: VT2E_SET, roLint: LINT41 };
const ends = (t) => `${t.origin || ""} | ${t.destination || ""}`;

export const TYPICAL = {
  cfr: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    const r = t.route || "", k = Number(t.number), electric = runsElectric(t) !== false;
    if (r === "InterCity") return IC_SET;
    if (k >= 16000 && k < 16100) return CORADIA;
    if (r === "InterRegio Noapte") return electric ? IRN_E : IRN_D;
    return electric ? IR_E : IR_D;
  },
  cfrregio: (t, reported) => {
    if (BY_MODEL[reported]) return reported === "ro41" ? REGIO_E : reported === "ro60" ? REGIO_DA : BY_MODEL[reported];
    if (PESA_TRAINS.has(Number(t.number))) return RE_R;
    if (t.route === "Regio Metropolitan") return DESIRO;
    return runsElectric(t) === true ? REGIO_E : DESIRO;
  },
  regiocalatori: (t, reported) => {
    if (BY_MODEL2[reported]) return BY_MODEL2[reported];
    const e = ends(t);
    if (t.route === "InterRegio" || (t.route === "Regio-Expres" && /Brașov/.test(e) && /București/.test(e))) return Z2_RC_SET;
    if (t.route === "Regio-Expres") return X72_SET;
    if (/Dorohoi/.test(e)) return VT628;
    if (/Timișoara/.test(e) && t.route === "Regio") return VT2E_SET;
    return CARAVELLE;
  },
  interregional: (t, reported) => {
    if (BY_MODEL2[reported]) return BY_MODEL2[reported];
    if (BY_MODEL[reported] === CORADIA) return CORADIA;
    const e = ends(t);
    if (t.route === "InterRegio" && /București/.test(e) && /Brașov|Cluj/.test(e)) return CORADIA;
    return VT628;
  },
  transferoviar: (t, reported) => {
    if (BY_MODEL2[reported]) return BY_MODEL2[reported];
    if (reported === "roRerCab" || reported === "roRerMid") return RE_R;
    const e = ends(t);
    if (/Roșiori/.test(e) && /București/.test(e)) return RE_R;
    if (/Aeroport|Slănic/.test(e)) return TAL643;
    if (/Măneciu/.test(e)) return WADLOPER;
    if (/Oltenița/.test(e)) return VT614;
    if (/Brașov|Bonțida|Constanța|Mangalia/.test(e)) return set("Usually a Coradia LINT 41: a two-section diesel unit", ["roLint", 2]);
    return TAL644;
  },
  // Astra's overnight București-Arad train is locomotive-hauled in its own
  // coaches, of which no photograph since 2017 shows the side: not drawn.
  astratc: (t, reported) => (BY_MODEL2[reported] ? BY_MODEL2[reported] : t.route === "InterRegio Noapte" ? null : IC2),
  softrans: () => HYPERION,
  ferotrafic: () => Z2_FE,
};
const WP = "https://en.wikipedia.org/wiki/";
const RO_WP = "https://ro.wikipedia.org/wiki/";
const PNRR = "https://www.cfrcalatori.ro/wp-content/uploads/2026/07/Descriere_proiect_finantat_prin_PNRR_iulie_2026.pdf";
const ea5100 = { model: "Electroputere LE 5100 (060-EA)", type: "Electric locomotive", builder: "Electroputere Craiova", built: "1965–1991", powerHp: 6839, lengthFt: 65.0 };
export const FACTS = {
  ro41: { ...ea5100, model: "Electroputere LE 5100 (class 41, 060-EA1)", topSpeedMph: 99.4, source: `${WP}Electroputere_LE5100`,
    about: "Romania's standard electric locomotive, built in Craiova under an ASEA licence: six axles, 5100 kW. CFR Călători's class 41s (160 km/h) still haul most of its InterRegio and many of its Regio trains under the wires, most of them in its red-ended white." },
  ro477: { ...ea5100, model: "Softronic class 477 (rebuilt LE 5100)", builder: "Electroputere Craiova; rebuilt by Softronic", built: "1965–1991, rebuilt since 2007",
    topSpeedMph: 99.4, source: "https://cfr.stfp.net/?la=E&class=47&op=C&ppr=3",
    about: "Class 40 and 41 locomotives modernised by Softronic Craiova since 2007, about thirty of them with CFR Călători, in its red with the pale gray sweep." },
  ro482: { ...ea5100, model: "Class 481 and 482 (PNRR rebuilds of the LE 5100)", builder: "Rebuilt by Softronic (481) and Reloc Craiova (482, \"ELASMO\")", built: "Rebuilt 2025–2026",
    fleet: "38 (19 + 19)", topSpeedMph: 99.4, powerHp: 8046, source: PNRR,
    about: "Thirty-eight LE 5100s rebuilt under Romania's recovery plan (PNRR) with new cabs, asynchronous motors and 6000 kW; the 481s also have ETCS. In service from April 2025, first on București–Constanța; the InterCity trains run with them and the rebuilt coaches." },
  ro60: { model: "Electroputere 060-DA (classes 60, 62, 64x, 66x)", type: "Diesel-electric locomotive", builder: "Electroputere Craiova", built: "1959–1985",
    powerHp: 2100, lengthFt: 55.8, source: `${WP}Rolling_stock_of_the_Romanian_Railways`,
    about: "The Sulzer-engined six-axle diesel built in Craiova under licence; CFR Călători's GM-engined rebuilds (63 and 65, now numbered 66x and 64x) haul its InterRegio trains off the wires, the 60s and 62s its locomotive-hauled Regio trains there." },
  roCoach2: { model: "Second-class coach (Bmee, AVA 200 and others)", type: "Passenger coach", builder: "Astra Arad, Bautzen and Görlitz (rebuilt at Grivița and others)", lengthFt: 86.6,
    source: `${RO_WP}Material_rulant_al_CFR_Călători`,
    about: "CFR Călători's InterRegio coaches: compartment and open second-class cars of 26.4 m, most air-conditioned, in its navy and silver-gray." },
  roCoach1: { model: "First-class coach (Amee, Alee, Astra 10-90)", type: "Passenger coach", builder: "Astra Arad, Bautzen and Görlitz (rebuilt at Grivița)", lengthFt: 86.6,
    source: `${RO_WP}Material_rulant_al_CFR_Călători`,
    about: "First class on CFR Călători's InterRegio trains, usually one car a train, in compartments of six seats or open saloons." },
  roPnrr2: { model: "PNRR second-class coach (21-91, 28-70, 84-70)", type: "Passenger coach", builder: "Rebuilt by Grivița and Pașcani", built: "2025–2026", lengthFt: 86.6,
    topSpeedMph: 124, source: PNRR,
    about: "Second-class coaches rebuilt under Romania's recovery plan, open saloons with air conditioning and power sockets; the 84-70s carry wheelchair, bicycle and ski space. Since 2026 the InterCity trains run entirely with these." },
  roPnrr1: { model: "PNRR first-class coach (18-70, 19-76)", type: "Passenger coach", builder: "Rebuilt by Remarul Cluj and Grivița", built: "2025–2026", lengthFt: 86.6,
    topSpeedMph: 124, source: PNRR,
    about: "Forty first-class coaches rebuilt under the recovery plan, thirty of them at Remarul in Cluj. Drawn in the project's paint as photographed on its second-class cars." },
  roCouchette: { model: "Couchette car (Bcmee)", type: "Couchette car", builder: "Grivița (conversions)", lengthFt: 86.6, source: `${RO_WP}Material_rulant_al_CFR_Călători`,
    about: "Six-berth couchettes on the InterRegio Noapte trains; fourteen more were converted under the recovery plan. Drawn in the paint last photographed on them (2015)." },
  roSleeper: { model: "Sleeping car (WLABmee 71-70, 71-31, 70-91)", type: "Sleeping car", builder: "Görlitz, Astra Arad (AVA); rebuilt at Grivița", lengthFt: 86.6,
    source: `${RO_WP}Material_rulant_al_CFR_Călători`,
    about: "Sleeping cars of one to three berths a compartment on the night trains, among them nine Astra AVA sleepers. Drawn in the paint last photographed on them (2016)." },
  roDD2: { model: "Double-deck coach (26-16)", type: "Double-deck coach", builder: "Waggonbau Görlitz; rebuilt at Remar Pașcani", lengthFt: 87.9,
    source: `${RO_WP}Material_rulant_al_CFR_Călători`,
    about: "Görlitz double-deck coaches, rebuilt in Pașcani, that make up most of CFR Călători's locomotive-hauled Regio trains under the wires." },
  roDD1: { model: "Double-deck coach with first class (36-16)", type: "Double-deck coach", builder: "Waggonbau Görlitz; rebuilt at Remar Pașcani", lengthFt: 87.9,
    source: `${RO_WP}Material_rulant_al_CFR_Călători`,
    about: "The AB double-deck: first class on the lower deck, marked by the yellow line and the yellow \"1\", second class upstairs." },
  roDesiro1: { model: "Siemens Desiro Classic (class 96)", type: "Diesel multiple unit", builder: "Siemens (assembled partly at Arad)", built: "2003–2007", fleet: "120 two-car units",
    topSpeedMph: 74.6, powerHp: 738, lengthFt: 136.8, source: `${WP}Siemens_Desiro`,
    about: "CFR Călători's two-car diesel units, once sold as \"Săgeata Albastră\", working most of its Regio trains off the wires and the Bucharest airport trains." },
  roRerCab: { model: "PESA RE-R (655-5)", type: "Electric multiple unit", builder: "PESA Bydgoszcz", built: "2025–2026", fleet: "62 ordered by ARF", topSpeedMph: 99.4, powerHp: 2146,
    seats: 238, lengthFt: 253.3, source: "https://www.railvolution.net/news/first-pesa-built-class-655-5-emu-delivered-to-romania",
    about: "Three-car regional units bought by Romania's Railway Reform Authority (ARF); CFR Călători's first five entered service on 6 August 2026 between București, Brașov and Constanța, Transferoviar's from București to Roșiori." },
  roCsFirst: { model: "Alstom Coradia Stream (RE-IR)", type: "Electric multiple unit", builder: "Alstom (Chorzów and Bautzen)", built: "2023–2026", fleet: "37 ordered by ARF, 12 with CFR Călători",
    topSpeedMph: 99.4, seats: 351, lengthFt: 397.6, source: "https://www.cfrcalatori.ro/comunicate/inca-doua-trenuri-sunt-operate-cu-o-noua-rama-electrica-moderna-alstom-re-coradia-stream/",
    about: "Six-car low-floor interregional units, the first new trains Romania had bought in twenty years, in service from November 2024; first class at one end (an orange line along the roof's edge and the \"1\")." },
};
Object.assign(FACTS, {
  ro628: { model: "Class 628.4 / 928.4", type: "Diesel multiple unit", builder: "Duewag and LHB", built: "1992–1996", fleet: "About 40 with InterRegional, a few with Regio Călători",
    topSpeedMph: 74.6, powerHp: 650, lengthFt: 151.2, source: "https://en.wikipedia.org/wiki/DB_Class_628",
    about: "Second-hand German two-car diesel units, still in DB's red; InterRegional Călători's regional trains round Cluj, Bistrița, Oradea, Satu Mare and Sibiu, and Regio Călători's to Dorohoi." },
  roTalent1: { model: "Bombardier Talent (class 644)", type: "Diesel-electric multiple unit", builder: "Bombardier (Talbot, Aachen)", built: "1999–2000", topSpeedMph: 74.6,
    lengthFt: 170.6, source: "https://en.wikipedia.org/wiki/Bombardier_Talent",
    about: "Three-section ex-DB Talents that Transferoviar Călători runs round Târgoviște and on its other diesel lines, in DB red with its own name; first class in one end section." },
  roTal643: { model: "Bombardier Talent (class 643)", type: "Diesel multiple unit", builder: "Bombardier (Talbot, Aachen)", fleet: "12 with Transferoviar", topSpeedMph: 74.6, lengthFt: 113.5,
    source: "https://en.wikipedia.org/wiki/Bombardier_Talent",
    about: "Two-section Talents from Germany's Regiobahn, on Transferoviar's trains to Bucharest airport and the Prahova branches; second class only." },
  roWadloper: { model: "Duewag DH2 \"Wadloper\"", type: "Diesel multiple unit", builder: "Duewag", built: "1981–1983", fleet: "13 two-car units", topSpeedMph: 74.6, lengthFt: 136.4,
    source: "https://en.wikipedia.org/wiki/NS_DH1_and_DH2",
    about: "Ex-Dutch two-car railcars that Transferoviar runs on the Prahova branch lines to Măneciu and Slănic." },
  ro614Cab: { model: "Class 614 (and the ADH11 rebuilds)", type: "Diesel multiple unit", builder: "MAN and Uerdingen", built: "1971–1975", topSpeedMph: 74.6, lengthFt: 261.2,
    source: "https://de.wikipedia.org/wiki/DB-Baureihe_614",
    about: "Three-car ex-DB units, on Transferoviar's Titan Sud-Oltenița line and round Buzău; three rebuilt at Remarul as the ADH11." },
  roZ2Motor1: { model: "Alsthom Z2 (CFL class 2000)", type: "Electric multiple unit", builder: "Alsthom and De Dietrich", built: "1990–1991", fleet: "20 sold to Romania",
    topSpeedMph: 99.4, seats: 160, lengthFt: 165.4, source: "https://railcolornews.com/2026/03/13/private-romanian-operator-ferotrafic-tfi-to-launch-suceava-bucharest-service-with-ex-cfl-emus/",
    about: "Luxembourg's former two-car units, 24 first-class seats behind the motor car's cab. Ferotrafic TFI runs them on its Suceava-București InterCity from May 2026, Regio Călători on Brașov-București." },
  roX72500: { model: "Alstom X 72500", type: "Diesel multiple unit", builder: "GEC-Alsthom", built: "1997–2002", topSpeedMph: 74.6, lengthFt: 172.6,
    source: "https://en.wikipedia.org/wiki/SNCF_Class_X_72500",
    about: "French regional diesel units bought second-hand by Regio Călători, on its Regio-Expres trains; still in SNCF's TER paint with Regio Călători's name." },
  roCaravelle: { model: "SNCF X 4500 \"Caravelle\" and XR trailer", type: "Diesel railcar and trailer", builder: "ANF and others", built: "1960s", topSpeedMph: 74.6, lengthFt: 139.4,
    source: "https://en.wikipedia.org/wiki/Regio_C%C4%83l%C4%83tori",
    about: "1960s French railcars, Regio Călători's mainstay on branch lines round Brașov, Alba Iulia, Iași, Arad and Timișoara." },
  roVt2e: { model: "LHB VT 2E", type: "Diesel multiple unit", builder: "Linke-Hofmann-Busch", built: "1987", topSpeedMph: 74.6, lengthFt: 107.0,
    source: "https://de.wikipedia.org/wiki/LHB_VT_2E",
    about: "Ex-Taunusbahn railcars that arrived in 2023 and run Regio Călători's lines out of Timișoara, still in their German colours." },
  roHypCab: { model: "Softronic Hyperion", type: "Electric multiple unit", builder: "Softronic Craiova", built: "2014–2019", fleet: "3 four-car units", topSpeedMph: 99.4, seats: 188,
    source: "https://www.railwaygazette.com/traction-and-rolling-stock/softronic-launches-open-access-service-with-hyperion-emu/39822.article",
    about: "Built in Craiova by Softrans's parent, the only type Softrans runs: Craiova-București-Brașov all year, București-Constanța in summer. Their sides often carry advertising wraps." },
  roLint: { model: "Alstom Coradia LINT 41", type: "Diesel multiple unit", builder: "Alstom (Salzgitter)", fleet: "12 with Transferoviar (3 ex-Abellio, 9 ex-Keolis)",
    topSpeedMph: 74.6, seats: 130, lengthFt: 137.4, source: "https://en.wikipedia.org/wiki/Alstom_Coradia_LINT",
    about: "Two-section diesel units, 16 first-class seats among their 130, on Transferoviar's București-Brașov trains and between Cluj and Bonțida." },
  roIc2: { model: "AnsaldoBreda IC2 (ex-DSB MP/FP)", type: "Diesel multiple unit", builder: "AnsaldoBreda", built: "2000s", lengthFt: 132.0,
    source: "https://www.railwaygazette.com/traction-and-rolling-stock/ansaldobreda-ic2-trainsets-find-new-home/45440.article",
    about: "Two-section units Denmark never put into service, bought by Astra Trans Carpatic for its InterRegio trains București-Brașov, Titu and the summer coast." },
});
const part = (facts, name) => ({ ...facts, model: `${facts.model}, ${name}` });
FACTS.ro928 = part(FACTS.ro628, "928 driving trailer");
FACTS.roTalentMid = part(FACTS.roTalent1, "middle section");
FACTS.roTalent2 = part(FACTS.roTalent1, "second-class end section");
FACTS.ro614Mid = part(FACTS.ro614Cab, "middle car");
FACTS.roZ2Motor = { ...FACTS.roZ2Motor1, about: "Regio Călători's Z2s run its Regio-Expres trains between Brașov and București (photographed February 2026)." };
FACTS.roZ2Trailer = part(FACTS.roZ2Motor1, "cab trailer");
FACTS.roCaravelleR = part(FACTS.roCaravelle, "cab trailer");
FACTS.roHypMid = part(FACTS.roHypCab, "middle car");
FACTS.roDesiro2 = part(FACTS.roDesiro1, "second car");
FACTS.roRerMid = part(FACTS.roRerCab, "middle car");
FACTS.roCsMid = part(FACTS.roCsFirst, "middle car");
FACTS.roCsCab = part(FACTS.roCsFirst, "second-class end car");
