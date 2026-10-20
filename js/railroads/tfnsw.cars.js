// Sydney Trains' and NSW TrainLink's trains (scripts/railroads/tfnsw.py):
// Sydney's double-deck electric sets (Waratah A and B, Millennium M,
// Tangara T, OSCAR H, Mariyung D) and NSW TrainLink's diesel railcars
// (Endeavour, Hunter, Xplorer) and XPT. Neither feed names a car (Sydney
// Trains masks its carriage numbers), but Sydney Trains' gives each set's
// type letter and its cars, and the trip id carries them too, so a train
// is drawn as that type at that length; else as what usually runs on its
// line. Trainsheet's own side views, from published dimensions and from
// photographs of the trains in their October 2026 paint; the operators'
// names are lettered here as type, not copied logos.
//
// Not drawn: the K sets (retired 2 October 2026), the V sets (retired in
// January 2026), the C and S sets (2021 and 2019), and the CAF Civity
// regional trains (R sets), still testing and due in service in 2028.

import { bilevel, married } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, poly, win, slats, pantograph, underframe } from "../carart.js?v=dev";
import { letters, horns, lamp } from "./digitraffic.cars.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
const r2 = (v) => Math.round(v * 100) / 100;
const mm = (v) => v / 304.8;

// Colors, from photographs of each fleet in 2025-26.
const SYD = {
  yellow: "#f3b417",    // Sydney Trains' door and front yellow
  orange: "#eb7a2b",    // the Sydney Trains orange (Waratah cab sides, B set fronts, refurbished H and T sets)
  burnt: "#e0732a",     // the Tangara's and OSCAR's newer "burnt orange"
  silver: "#c9cdd1",    // stainless and silver-gray sides
  warm: "#b3b4b2",      // the B sets' darker silver wrap
  roof: "#d7dadd",
  band: "#23272c",      // tinted window bands
  skirt: "#33373c",
  black: "#17191c",
  blue: "#1f3f99",      // the OSCAR's intercity blue
};
const TL = {
  red: "#e8452c",       // NSW TrainLink's red-orange (D set doors, railcar fronts)
  orange: "#f0702b",
  yellow: "#f6b51c",
  navy: "#1d2a4f",      // the Mariyung's front
  grey: "#a9adb1",
  sky: "#5ec4ea",       // the Xplorer's and XPT's window band
  teal: "#1fa3b6",
  blue: "#2a3f9e",      // the Xplorer's and XPT's ultramarine
  royal: "#2346b8",
};

// ===================== Shared detail =====================

// TfNSW's "Transport" mark on a car side as type: an orange arc (the
// waratah-petal arch, drawn simply) beside the word, the operator under it.
const transport = (c, x, y, h, op, fill = "#2b2f34", arc = SYD.orange) => {
  const k = c.mirrored ? -1 : 1, ax = x - k * h * 2.2;
  return path(`M${r2(ax - h * 0.55)} ${r2(y - h * 0.5)}Q${r2(ax - h * 0.5)} ${r2(y + h * 0.6)} ${r2(ax)} ${r2(y + h * 0.62)}Q${r2(ax + h * 0.5)} ${r2(y + h * 0.6)} ${r2(ax + h * 0.55)} ${r2(y - h * 0.5)}` +
      `L${r2(ax + h * 0.3)} ${r2(y - h * 0.5)}Q${r2(ax + h * 0.28)} ${r2(y + h * 0.3)} ${r2(ax)} ${r2(y + h * 0.32)}Q${r2(ax - h * 0.28)} ${r2(y + h * 0.3)} ${r2(ax - h * 0.3)} ${r2(y - h * 0.5)}Z`, arc) +
    letters(c, x + k * h * 0.6, y + h * 0.28, h * 0.62, "Transport", fill, { weight: 600 }) +
    (op ? letters(c, x + k * h * 0.6, y - h * 0.42, h * 0.5, op, fill, { weight: 500 }) : "");
};
// A roof air-conditioning unit as Sydney's double-deckers carry them, in
// the roof over each end: a low hood whose louvered grille faces show
// along the cantrail.
function acHood(x, w, roof, { h = 0.45, fill = "#b9bec4" } = {}) {
  return path(poly([[x, roof - 0.05], [x + 0.5, roof + h], [x + w - 0.5, roof + h], [x + w, roof - 0.05]]), fill, 0.4) +
    rect(x + 0.7, roof - 0.35, w - 1.4, 0.55, "#3a3f45", 0, 'rx="0.08"') + slats(x + 0.75, roof - 0.33, w - 1.5, 0.5, 0.32, "rgba(255,255,255,0.28)");
}
// A pantograph on its insulated base, the lightning arrester ahead of it,
// the roof cable running back on insulators to the car's equipment.
function panDeck(cx, roof, { facing = 1, cableTo = null } = {}) {
  let s = rect(cx - 3.2, roof - 0.05, 6.4, 0.3, "#8f969e", 0.4) + pantograph(cx, roof + 0.25, { facing });
  const ax = cx - 4.0 * facing;
  s += rect(ax - 0.2, roof, 0.4, 0.9, "#7d848c", 0.3) + lines([[ax - 0.27, roof + 0.3, ax + 0.27, roof + 0.3], [ax - 0.27, roof + 0.6, ax + 0.27, roof + 0.6]], "#4a5057", 0.6);
  if (cableTo != null) {
    const a = Math.min(cx, cableTo), b = Math.max(cx, cableTo);
    s += line(a, roof + 0.45, b, roof + 0.45, "#3a3f45", 0.8) + seq(a + 3.5, 4.5, Math.max(0, Math.floor((b - a - 3.5) / 4.5) + 1)).map((x) => rect(x - 0.12, roof, 0.24, 0.45, "#7d848c")).join("");
  }
  return s;
}
// The automatic coupler at a cab end, its draft gear and the hoses under it.
const coupler = (x, y = 2.9, reach = 1.9) => rect(x + 0.3, y - 0.3, reach, 0.6, "#2a2d31") + rect(x, y - 0.62, 0.55, 1.24, "#2a2d31", 0, 'rx="0.15"') + rect(x + 0.7, y + 0.35, 1.0, 0.32, "#5a6068") +
  path(`M${r2(x + 1.0)} ${r2(y - 0.3)}Q${r2(x + 0.8)} ${r2(y - 1.3)} ${r2(x + 1.8)} ${r2(y - 1.2)}`, "none", 0, 'stroke="#2a2d31" stroke-width="0.8" vector-effect="non-scaling-stroke" stroke-linecap="round"');
// The skirt and anticlimber under a cab, from x0 back to x1.
const skirt = (x0, x1, sill, fill = "#2b2e33") => path(poly([[x0, sill + 0.05], [x1, sill + 0.05], [x1 - 0.2, 1.3], [x1 - 0.6, 0.75], [x0 + 0.3, 0.75], [x0 - 0.2, 1.6]]), fill) +
  lines([[x0, 1.6, x1 - 0.4, 1.6]], "#5a6068", 0.6);
// A windshield wiper, parked.
const wiper = (x1, y1, x2, y2) => line(x1, y1, x2, y2, "#0b0d0f", 0.8);
// Each side door's step and the door-open light over it.
const doorTrim = (doors, sill) => doors.map((d) => rect(d.x + 0.2, sill - 0.35, d.w - 0.4, 0.3, "#3a3f45") + rect(d.x + d.w / 2 - 0.3, d.y1 + 0.2, 0.6, 0.18, "#e8a317")).join("");
// The equipment under an electric car: between the trucks a double-decker's
// lower saloon leaves only a shallow space; the boxes hang outboard of it.
const bogieGear = (cx, wb, top) => line(cx - wb / 2 - 0.5, top - 0.5, cx - 1.8, top - 0.5, "#5a6068", 1.0) + rect(cx + 1.6, 1.6, 1.0, 0.65, "#5a6068", 0, 'rx="0.15"');

// ===================== Sydney's double-deckers =====================
// Every Sydney double-deck car shares one plan (the K sets' of 1981, kept
// through the Tangara, Millennium, OSCAR, Waratah and Mariyung): a car
// about 20.3 m long, 4.4 m tall and 3.0 m wide; over each truck a short end
// saloon at platform height (the vestibule floor 1.27 m above the rail),
// then the doorway (two plug-door leaves), then between the doors the
// double-deck saloon, its lower floor dropped between the trucks and its
// upper floor under the roof. The trucks sit under the end saloons; a
// driving car's cab adds about 1.4 m ahead of the first doorway. Window
// heights, door and truck positions measured from broadside photographs
// scaled to the published lengths and heights (TfNSW's fleet pages and the
// builders' data as collected on Wikipedia's fleet articles).
//
// ctx.cabL: the car's cab is on the left (the consist mirrors the one at
// the back). part: { L, cab, motor, pan: where on the roof (x) or null }.
const DD = { roof: 14.45, sill: 3.5, cornerR: 0.9, end: 0.5, diaphragm: [4.3, 12.8], badge: false };
// Where a car's doors and saloons are, from its length.
function plan(L, cab, { dw = 4.6, front = 14.4, back = 9.4 } = {}) {
  const a = cab ? front : back, b = L - back - dw;
  return { dw, doors: [a, b], deck: [a + dw, b], ends: [[cab ? 9.2 : 0.5, a], [b + dw, L - 0.5]] };
}
// Upper and lower saloon windows across the deck, n of them, w wide.
const deckRows = (deck, { n, w, up = [9.9, 2.45], low = [3.1, 2.7], r = 0.35 }) => {
  const pitch = (deck[1] - deck[0] - 1.2 - w) / Math.max(1, n - 1), xs = seq(deck[0] + 0.6, pitch, n);
  return [{ xs, y: up[0], w, h: up[1], r }, { xs, y: low[0], w, h: low[1], r }];
};
// An end saloon's window, centered in its space.
const endRow = (span, w, y = 6.6, h = 3.1) => ({ xs: [(span[0] + span[1] - w) / 2], y, w, h, r: 0.35 });

// A driving car inside a train (two sets coupled) faces the set it leads:
// in the front half of the train its cab is at its back.
const facesBack = (c) => c.index > 0 && c.index < c.count - 1 && c.index < c.count / 2;
// Which way a driving car is drawn, for the consist's cache of drawings.
const facing = (c) => (facesBack(c) ? "back" : c.index > 0 && c.index < c.count - 1 ? "mid" : "");

// One Sydney double-deck car on carmodels.js's bilevel(): spec gives the
// class (roof, sill, trucks, nose, cab drawing, paint(c, g, car), detail,
// windows(p, car) and the door fill), car gives this car's length, cab,
// motor and pantograph (x from its cab end, or from its left).
function deckCar(spec, car) {
  const draw = (c0) => {
    // A cab coupled to another set's cab has no gangway, only its coupler.
    const c = car.cab ? { ...c0, cabL: true, coupledL: false } : { ...c0, cabL: false, cabR: false };
    const L = c.L, p = plan(L, car.cab, spec.plan);
    const doors = p.doors.map((x) => ({ x, w: p.dw, y0: spec.sill + 0.15, y1: spec.doorTop ?? 10.9, leaves: 2, glassY: 0.36, glassH: 0.5, grabs: false, fill: spec.doorFill(c) }));
    const t = spec.trucks, ta = L / 2 - t.centers / 2, tb = L / 2 + t.centers / 2;
    const info = { ...car, L, plan: p, doors, c, cabLen: spec.cabLen };
    const box = (a, b) => (b - a > 2 ? underframe(a, b, spec.sill, { depth: 1.1, boxes: 1, tanks: false }) : "");
    return bilevel(c, {
      ...DD, ...spec, ...(car.cab ? {} : { nose: null, cab: null }),
      drop: { a: p.deck[0] + 0.9, b: p.deck[1] - 0.9, y: 1.35 },
      rows: spec.windows(p, info),
      doors,
      roofItems: [],
      paint: (c, g) => spec.paint(c, g, info),
      cab: car.cab ? (c, g) => spec.cab(c, g, info) : null,
      extra: (c, g) => {
        let s = bogieGear(ta, t.wb, spec.sill) + bogieGear(tb, t.wb, spec.sill) + doorTrim(doors, spec.sill);
        // Under the end saloons, outboard of the trucks: the air
        // compressor, battery and converter boxes.
        s += (car.cab ? "" : box(1.2, ta - t.wb / 2 - 0.9)) + box(tb + t.wb / 2 + 0.9, L - 1.2);
        // Roof: an air-conditioning unit over each end, and the pantograph.
        const ac = spec.acW ?? 8;
        s += acHood(car.cab ? 9.6 : 1.6, ac, spec.roof) + acHood(L - 1.6 - ac, ac, spec.roof);
        if (car.pan != null) s += panDeck(car.pan, spec.roof, { facing: car.pan < L / 2 ? 1 : -1, cableTo: car.pan < L / 2 ? car.pan + 9 : car.pan - 9 });
        return s + (spec.detail ? spec.detail(c, g, info) : "");
      },
    });
  };
  if (!car.cab) return draw;
  return (c) => (facesBack(c) && !c.mirrored
    ? `<g transform="matrix(-1 0 0 1 ${c.L} 0)">${draw({ ...c, mirrored: true, coupledL: c.coupledR, coupledR: c.coupledL })}</g>` : draw(c));
}

// A double-decker's body paint before its livery: the side color, the
// roof band, the dark sill under the end saloons and, between the trucks,
// the side carried down around the lower saloon to a dark bottom edge.
const body = (L, car, side, roof, roofY = 13.4) => {
  const [a, z] = car.plan.deck;
  return rect(0, 0, L, 18, side) + rect(0, roofY, L, 2, roof) + rect(0, 0, a - 0.4, 3.9, SYD.skirt) + rect(z + 0.4, 0, L - z - 0.4, 3.9, SYD.skirt) +
    rect(a - 0.4, 0, z - a + 0.8, 1.75, SYD.skirt) + rect(a - 0.4, 1.75, z - a + 0.8, 0.12, "rgba(0,0,0,0.25)");
};
// The rain strip along the eave, back from the cab.
const eave = (g, car, y) => lines([[car.cab ? car.cabLen : 0.5, y, g.L - 0.5, y]], "rgba(0,0,0,0.2)", 0.5);

// --- Waratah A sets (Downer EDI Rail with Changchun Railway Vehicles,
// built 2010-14, in service from July 2011; A1-A80, 78 sets) and Waratah
// Series 2 B sets (Downer with CRRC Changchun, 2017-21; B1-B41): eight-car
// sets, D-N-N-T-T-N-N-D, the driving trailers 20.732 m, the motor cars
// 20.243 m, the trailers 20.332 m over the couplers; 3.035 m wide, 4.41 m
// tall, the floor 1.27 m above the rail; 940 mm wheels, trucks of 2.3 m
// wheelbase. Sixteen 183 kW Hitachi motors, 1,500 V DC overhead; the
// pantograph on each outer motor car (cars 2 and 7) at its end next to the
// driving car. (Sydney Trains' A and B set fleet page; Wikipedia, "New
// South Wales A and B sets".) Two plug doors a side on each car, the
// front's raked windshield of three panes over a squared-off front, the
// headlights in a column at each corner.
// The A sets' paint: silver-gray sides with the windows in tinted black
// bands, a white roof, yellow doors; the front yellow, and since 2013 an
// orange wrap on the cab sides back to the cab door; "Transport Sydney
// Trains" in dark type by the first door. The B sets: a darker silver wrap,
// the front and cab sides orange, the roof over the cab dark gray.
const WAR = { roof: mm(4410), sill: 3.55, trucks: { centers: 51.6, wb: mm(2300) * 1, d: 37 }, acW: 8.5,
  nose: [[1.0, 3.55], [0.55, 4.0], [0.55, 7.0], ["q", 0.6, 7.8, 1.2, 8.2], [2.3, 12.6], ["q", 2.8, 14.1, 4.4, mm(4410)]], cabLen: 7,
  doorFill: () => SYD.yellow,
  windows: (p, car) => [...deckRows(p.deck, { n: 5, w: 6.5 }), car.cab ? null : endRow(p.ends[0], 5.2), endRow(p.ends[1], 5.2)].filter(Boolean),
  cab: (c, g, car) => path(poly([[1.25, 8.4], [2.3, 12.4], ["q", 2.55, 13.1, 3.3, 13.1], [4.4, 13.1], [4.4, 8.4]]), C.glass) +
    path(poly([[1.8, 10.4], [2.35, 12.5], [4.3, 12.5], [4.3, 10.4]]), C.glassLight) + rect(2.9, 13.3, 1.5, 0.45, "#14171a", 0, 'rx="0.1"') + rect(3.0, 13.4, 1.1, 0.25, "#f5a623") +
    wiper(1.5, 8.7, 2.3, 10.6) + line(1.25, 8.4, 4.4, 8.4, "#0b0d0f", 0.6) +
    // The headlight column at the front corner (three lamps), a marker light
    // over it, the lower lamp in the bumper.
    rect(0.6, 5.9, 0.7, 1.9, "#e6e9ec", 0.35, 'rx="0.3"') + circle(0.95, 7.35, 0.2, "#fff6d0") + circle(0.95, 6.85, 0.2, "#fff6d0") + circle(0.95, 6.35, 0.2, "#fff6d0") +
    rect(0.55, 4.1, 1.6, 1.0, "#c5c9cd", 0.4, 'rx="0.12"') + circle(1.1, 4.6, 0.24, "#fff6d0") +
    coupler(0, 2.9, 1.7) + skirt(1.0, 6.8, 3.55) +
    // Cab side: the driver's droplight window and the cab door with its own.
    win(4.9, 8.2, 1.7, 3.1, 0.3) + rect(7.4, 4.0, 2.3, 7.5, "none", 0.5, 'rx="0.2"') + win(7.75, 8.3, 1.6, 2.6, 0.25) + line(10.0, 5.6, 10.0, 9.0, "currentColor", 0.6),
  paint: (c, g, car) => {
    const L = g.L, b = car.series2;
    let s = body(L, car, b ? SYD.warm : SYD.silver, SYD.roof);
    // The tinted bands the saloon windows sit in.
    const [a, z] = car.plan.deck;
    s += rect(a - 0.1, 9.65, z - a + 0.2, 2.95, SYD.band) + rect(a - 0.1, 2.85, z - a + 0.2, 3.2, SYD.band);
    if (car.cab) {
      // The cab side wrapped orange back past the cab door; the A sets'
      // front yellow, the B sets' orange under a dark gray roof cap; the
      // silver bumper.
      s += rect(0, 0, 10.6, 18, SYD.orange);
      s += b ? path(poly([[0, 13.0], [10.6, 13.0], [10.6, 18], [0, 18]]), "#3b3f45")
        : path(poly([[0, 0], [4.4, 0], [4.4, 13.4], ["q", 4.4, 14.1, 4.9, 14.6], [0, 14.6]]), SYD.yellow);
      s += rect(0, 3.55, 4.6, 0.85, "#c5c9cd") + rect(0.4, 4.4, 4.2, 0.12, "#8a9096");
    }
    return s;
  },
  // "Transport Sydney Trains" on the band between the decks, just past
  // the first door (from the cab).
  detail: (c, g, car) => transport(c, car.plan.deck[0] + 4.2, 7.9, 0.85, "Sydney Trains") + eave(g, car, 13.05),
};
const warLen = { d: mm(20732), n: mm(20243), t: mm(20332) };
// The pantograph on the motor car next to each driving car, at that end:
// cars 2 and 7 of the eight.
const warPan = (c) => (c.index === 1 ? 7.5 : c.index === c.count - 2 ? c.L - 7.5 : null);
const waratah = (series2, kind) => (c) => deckCar(WAR, { cab: kind === "d", motor: kind === "n", series2, pan: kind === "n" ? warPan(c) : null })(c);

// --- Millennium M sets (EDi Rail, Cardiff, 2002-05; M1-M35): four cars,
// D-N-N-D, the driving trailers 20.532 m, the motor cars 20.243 m, 3.03 m
// wide and 4.381 m tall; Alstom ONIX traction, eight 226 kW motors; the
// pantograph on each driving trailer, over the cab end (Wikipedia, "New
// South Wales M set"; Sydney Trains). A steeply raked nose under a single
// curved windshield. Bare stainless sides, the windows in tinted bands,
// yellow doors; the front silver with a black mask around the windshield
// edged in yellow, the yellow sweeping down the nose's sides.
const MIL = { roof: mm(4381), sill: 3.55, trucks: { centers: 51.4, wb: 7.55, d: 37 }, acW: 7.5,
  nose: [[1.2, 3.55], [0.5, 4.0], [0.5, 6.4], ["q", 0.6, 7.2, 1.3, 7.8], [3.4, 12.5], ["q", 4.2, mm(4381), 6.0, mm(4381)]], cabLen: 8,
  doorFill: () => SYD.yellow,
  windows: (p, car) => [...deckRows(p.deck, { n: 5, w: 5.8, up: [9.95, 2.35], low: [3.1, 2.6] }), endRow(p.ends[0], car.cab ? 1.6 : 2.0, 6.4, 3.6), endRow(p.ends[1], 2.0, 6.4, 3.6)],
  cab: (c) => path(poly([[0.9, 6.9], [5.4, 6.85], ["q", 7.5, 7.1, 7.65, 8.8], [7.65, 12.2], [3.25, 12.2], [1.3, 7.8]]), SYD.black) +
    path(poly([[2.0, 8.6], [3.5, 11.8], [7.3, 11.8], [7.3, 9.0], ["q", 6.6, 8.6, 5.0, 8.6]]), C.glass) + path(poly([[2.7, 10.3], [3.5, 11.8], [7.3, 11.8], [7.3, 10.3]]), C.glassLight) +
    rect(4.4, 12.2, 2.2, 0.45, "#14171a", 0, 'rx="0.1"') + rect(4.6, 12.3, 1.5, 0.25, "#f5a623") + wiper(2.4, 9.3, 3.3, 11.2) +
    rect(0.55, 4.5, 1.2, 0.8, "#c3c8cd", 0.35, 'rx="0.3"') + circle(1.0, 4.9, 0.25, "#fff6d0") +
    coupler(0, 2.9, 1.8) + skirt(1.2, 7.2, 3.55) + win(7.5, 7.6, 1.2, 3.2, 0.3) + rect(7.3, 4.0, 1.8, 7.4, "none", 0.5, 'rx="0.2"'),
  paint: (c, g, car) => {
    const L = g.L;
    let s = body(L, car, SYD.silver, SYD.roof, 13.3);
    const [a, z] = car.plan.deck;
    s += rect(a - 0.1, 9.75, z - a + 0.2, 2.75, SYD.band) + rect(a - 0.1, 2.9, z - a + 0.2, 3.0, SYD.band);
    // The yellow band edging the front's black mask, sweeping down the nose.
    // The front: the yellow cap over the roof's leading edge and the
    // yellow border down the side of the black mask to the nose.
    if (car.cab) s += path(poly([[2.6, 12.2], [8.3, 12.2], [8.3, 15], [2.6, 15]]), SYD.yellow) +
      path("M8.3 12.4L8.3 8.6Q8.1 6.5 5.6 6.1L0.4 6.2L0.4 6.9L5.4 6.85Q7.5 7.1 7.65 8.8L7.65 12.4Z", SYD.yellow);
    return s;
  },
  detail: (c, g, car) => transport(c, car.plan.deck[0] + 4.0, 7.9, 0.85, "Sydney Trains") + eave(g, car, 13.0),
};
const millennium = (kind) => (c) => deckCar(MIL, { cab: kind === "d", motor: kind === "n", pan: kind === "d" ? c.L - 17 : null })(c);

// --- Tangara T sets (A Goninan & Co, Broadmeadow, 1987-95; 109 sets in
// service as fixed pairs of four-car units, eight cars): D-N-N-D, the
// driving trailers 20.32 m, the motor cars 20.22 m, 3.0 m wide and 4.413 m
// tall, 940 mm wheels on Nippon Sharyo bolsterless trucks; Mitsubishi GTO
// chopper control, eight 170 kW motors; a pantograph on each driving
// trailer over the cab end (Wikipedia, "New South Wales T set"). A flat,
// upright front of two rows of panes; ribbed stainless sides, a louvered
// panel under the cab side window. The doors and front yellow, or on the
// sets through the Tangara Life Extension since September 2025 a burnt
// orange.
const TAN = { roof: mm(4413), sill: 3.55, trucks: { centers: 51.0, wb: 7.55, d: 37 }, acW: 7.5,
  nose: [[0.7, 3.55], [0.45, 3.9], [0.45, 12.9], ["q", 0.5, 14.0, 1.6, 14.3], ["q", 2.2, mm(4413), 3.0, mm(4413)]], cabLen: 7,
  doorFill: (c) => (c.newPaint ? SYD.burnt : SYD.yellow),
  windows: (p, car) => [...deckRows(p.deck, { n: 6, w: 5.4, up: [9.85, 2.7], low: [3.0, 2.9], r: 0.25 }), endRow(p.ends[0], car.cab ? 1.8 : 3.4, 6.5, 3.4), endRow(p.ends[1], 3.4, 6.5, 3.4)],
  cab: (c, g, car) => {
    const face = car.newPaint ? SYD.burnt : SYD.yellow;
    return rect(0.45, 7.2, 0.35, 5.6, C.glass) + rect(0.45, 3.9, 0.35, 3.1, face) + rect(0.42, 3.55, 0.45, 1.6, SYD.black) +
      circle(0.65, 4.45, 0.2, "#fff6d0") + rect(0.5, 13.0, 0.3, 0.8, "#1d1f22") + coupler(0, 2.9, 1.6) + skirt(0.7, 6.0, 3.55) +
      // Cab side: the tall side window over its louvered panel, the cab door.
      win(1.9, 7.7, 1.6, 3.9, 0.3) + rect(1.95, 4.2, 1.5, 3.2, "#3a3f45", 0.3) + slats(2.0, 4.3, 1.4, 3.0, 0.3, "rgba(255,255,255,0.3)") +
      rect(4.1, 4.0, 2.1, 7.6, "none", 0.5, 'rx="0.2"') + win(4.4, 8.0, 1.5, 2.6, 0.25);
  },
  paint: (c, g, car) => {
    const L = g.L;
    let s = body(L, car, SYD.silver, SYD.roof, 13.5);
    // Ribbed sides: the stainless fluting between the windows and doors.
    const fl = [];
    for (let y = 4.0; y < 13.2; y += 0.42) fl.push([0.6, y, L - 0.6, y]);
    s += lines(fl, "rgba(0,0,0,0.09)", 0.5);
    if (car.cab) s += path(poly([[0, 0], [1.25, 0], [1.25, 13.6], ["q", 1.25, 14.2, 2.0, 14.3], [3.2, 14.3], [3.2, 18], [0, 18]]), car.newPaint ? SYD.burnt : SYD.yellow);
    return s;
  },
  detail: (c, g, car) => (car.cab ? transport(c, 11.6, 11.1, 0.7, "") : "") + eave(g, car, 13.2) +
    lines([[car.cab ? 7.2 : 1.0, 3.75, car.plan.deck[0] - 0.3, 3.75], [car.plan.deck[1] + 0.3, 3.75, g.L - 1.0, 3.75], [car.plan.deck[0] + 0.5, 2.2, car.plan.deck[1] - 0.5, 2.2]], SYD.yellow, 0.9),
};
const tangara = (kind) => (c) => deckCar(TAN, { cab: kind === "d", motor: kind === "n", pan: kind === "d" ? c.L - 8.4 : null, newPaint: false })(c);

// --- OSCAR H sets (UGL Rail, Broadmeadow, 2006-12; H1-H55): four cars,
// OD-ON-ONL-OD, the driving trailers 20.34 m, the motor cars 20.435 m (the
// ONL with a toilet), 3.034 m wide and 4.403 m tall; Mitsubishi IGBT
// traction, eight 200 kW motors; a pantograph on each motor car at its
// outer end (Wikipedia, "New South Wales H set"). The cab is a fibreglass
// shell over a steel cage reaching back to the crew door; a gently raked
// windshield in a wide mask. Built for the intercity lines: stainless
// sides, yellow doors, the front yellow with a blue mask under the
// windshield and a blue roof cap. The sets moved to Sydney's suburban
// lines since late 2025 are repainted: the front orange under a black
// mask and roof cap, orange doors.
const OSC = { roof: mm(4403), sill: 3.55, trucks: { centers: 51.0, wb: 7.55, d: 37 }, acW: 8.0,
  nose: [[1.0, 3.55], [0.5, 3.9], [0.5, 7.3], ["q", 0.55, 8.3, 1.1, 8.9], [2.2, 12.6], ["q", 2.8, 14.1, 4.6, mm(4403)]], cabLen: 8,
  doorFill: (c) => (c.agency === "sydneytrains" ? SYD.orange : SYD.yellow),
  windows: (p, car) => [...deckRows(p.deck, { n: 5, w: 5.9, up: [9.9, 2.45], low: [3.1, 2.75] }), endRow(p.ends[0], car.cab ? 2.0 : 4.6, 6.5, 3.3), endRow(p.ends[1], 4.6, 6.5, 3.3)],
  cab: (c, g, car) => {
    const sub = c.agency === "sydneytrains";
    return path(poly([[1.3, 9.0], [2.3, 12.4], [6.1, 12.4], [6.1, 9.0]]), C.glass) + path(poly([[1.8, 10.6], [2.3, 12.4], [6.1, 12.4], [6.1, 10.6]]), C.glassLight) +
      wiper(1.6, 9.2, 2.3, 11.2) + rect(3.6, 12.75, 2.4, 0.45, "#14171a", 0, 'rx="0.1"') + rect(3.8, 12.85, 1.6, 0.25, "#f5a623") +
      rect(0.5, 4.0, 0.9, 1.3, sub ? SYD.black : "#2b2e33", 0, 'rx="0.15"') + circle(0.85, 4.65, 0.24, "#fff6d0") + circle(1.6, 13.6, 0.22, "#fff6d0") +
      coupler(0, 2.9, 1.8) + skirt(1.0, 6.6, 3.55) + win(6.6, 7.8, 1.3, 3.4, 0.3) + rect(8.6, 4.0, 2.1, 7.6, "none", 0.5, 'rx="0.2"') + win(8.9, 8.2, 1.4, 2.5, 0.25);
  },
  paint: (c, g, car) => {
    const L = g.L, sub = c.agency === "sydneytrains";
    let s = body(L, car, SYD.silver, SYD.roof, 13.3);
    const [a, z] = car.plan.deck;
    s += rect(a - 0.1, 9.7, z - a + 0.2, 2.85, SYD.band) + rect(a - 0.1, 2.9, z - a + 0.2, 3.15, SYD.band);
    if (car.cab) {
      // The fibreglass front back to the crew door: its color, the mask
      // under the windshield, the roof cap.
      s += rect(0, 0, 8.3, 18, sub ? SYD.orange : SYD.yellow) +
        path(poly([[0, 7.0], [1.0, 7.0], ["q", 2.6, 7.2, 3.0, 8.6], [3.0, 12.4], [0, 12.4]]), sub ? SYD.black : SYD.blue) +
        (sub ? path(poly([[0, 13.0], [8.3, 13.0], [8.3, 18], [0, 18]]), SYD.black) : path(poly([[0, 12.9], [2.4, 12.9], ["q", 3.4, 13.6, 3.6, 18], [0, 18]]), SYD.blue));
    }
    return s;
  },
  // The name on the panel between the crew door and the first passenger
  // door; a yellow line low along the side (the intercity paint).
  detail: (c, g, car) => (car.cab ? transport(c, 12.6, 10.6, 0.7, c.agency === "sydneytrains" ? "Sydney Trains" : "NSW TrainLink") : "") +
    eave(g, car, 13.0) + (c.agency === "sydneytrains" ? "" : lines([[car.cab ? 8.4 : 1.0, 3.75, car.plan.deck[0] - 0.3, 3.75], [car.plan.deck[1] + 0.3, 3.75, g.L - 1.0, 3.75],
      [car.plan.deck[0] + 0.5, 2.2, car.plan.deck[1] - 0.5, 2.2]], SYD.yellow, 0.9)),
};
const oscarPan = (c) => (c.index === 1 ? 7.5 : c.index === c.count - 2 ? c.L - 7.5 : null);
const oscar = (kind) => (c) => deckCar(OSC, { cab: kind === "d", motor: kind === "n", pan: kind === "n" ? oscarPan(c) : null })(c);

// --- Mariyung D sets (Hyundai Rotem, Changwon, 2019-24; in service on
// the Central Coast and Newcastle Line from 3 December 2024, the Blue
// Mountains Line from 13 October 2025 and the South Coast Line from 14
// April 2026): 70 four-car sets (D1-D70, DD-DN-DND-DDA) and 55 six-car
// sets (D101-D155, DD-DNL-DT-DN-DND-DDA), run as 4, 6, 8 or 10 cars. The
// driving cars 20.435 m, the others 20.34 m, 3.034 m wide and 4.402 m tall
// (Wikipedia, "New South Wales D set"; Transport for NSW's New Intercity
// Fleet pages). A pantograph at the inner end of each driving car (from
// photographs). The doors are wider than the older sets', set in a red
// frame. Silver; the windows in one black band across the upper and lower
// saloons; the front dark navy with a red-orange panel under the
// windshield, a white line along its top edge, a silver bumper; the cab
// side black, carrying the Mariyung name and its Darkinjung artwork (drawn
// here as a pattern of dots, not the artwork itself).
const MAR = { roof: mm(4402), sill: 3.6, trucks: { centers: 51.4, wb: 8.2, d: 37 }, acW: 8.5,
  plan: { dw: 5.2, front: 15.6, back: 9.0 },
  nose: [[1.6, 3.6], [0.4, 3.9], [0.4, 6.0], ["q", 0.45, 6.9, 1.0, 7.3], [1.6, 8.0], [2.6, 12.8], ["q", 3.2, 14.2, 5.0, mm(4402)]], cabLen: 9,
  doorFill: () => TL.red,
  doorTop: 11.1,
  windows: (p, car) => [...deckRows(p.deck, { n: 5, w: 5.9, up: [9.95, 2.5], low: [3.15, 2.85] }), endRow(p.ends[0], car.cab ? 1.4 : 4.0, 6.6, 3.2), endRow(p.ends[1], 4.0, 6.6, 3.2)],
  cab: (c) => path(poly([[1.7, 8.4], [2.7, 12.6], [6.4, 12.6], [6.4, 8.4]]), C.glass) + path(poly([[2.2, 10.6], [2.7, 12.6], [6.4, 12.6], [6.4, 10.6]]), C.glassLight) +
    wiper(2.0, 8.6, 2.6, 10.6) + rect(3.6, 13.0, 2.8, 0.5, "#14171a", 0, 'rx="0.1"') + rect(3.8, 13.1, 2.0, 0.28, "#f04b35") +
    rect(2.6, 14.05, 1.4, 0.35, "#1d2026", 0, 'rx="0.12"') + circle(3.3, 14.2, 0.14, "#fff6d0") +
    rect(0.42, 4.0, 1.4, 1.7, "#b9bdc2", 0.4, 'rx="0.35"') + circle(0.9, 4.5, 0.2, "#fff6d0") + circle(0.9, 5.15, 0.18, "#e23b2e") +
    coupler(0, 2.9, 1.6) + skirt(1.4, 7.4, 3.6, "#2b2e33") + win(7.1, 8.0, 1.3, 3.6, 0.3) + rect(9.5, 4.1, 2.0, 7.4, "none", 0.5, 'rx="0.2"'),
  paint: (c, g, car) => {
    const L = g.L;
    let s = body(L, car, "#c6cacf", "#d4d7db", 13.5);
    const [a, z] = car.plan.deck;
    // One black band from the upper windows down to the lower, stepping
    // down beside each door; a silver strip between the decks.
    s += rect(a - 0.6, 9.7, z - a + 1.2, 3.0, "#1e2125") + rect(a - 0.6, 2.95, z - a + 1.2, 3.3, "#1e2125") + rect(a + 2.0, 6.7, z - a - 4.0, 2.6, "#c6cacf");
    for (const d of car.doors) s += rect(d.x - 0.45, d.y0 - 0.1, d.w + 0.9, d.y1 - d.y0 + 0.55, TL.red, 0, 'rx="0.25"');
    if (car.cab) {
      s += path(poly([[0, 7.6], [1.5, 7.6], ["q", 4.6, 7.4, 7.0, 8.4], [7.0, 18], [0, 18]]), TL.navy) +
        path(poly([[0, 5.6], [1.2, 5.6], ["q", 3.4, 5.7, 4.0, 7.9], [1.2, 7.7], [0, 7.7]]), TL.red) + line(0.5, 7.75, 3.8, 7.95, "#ffffff", 0.9) +
        rect(0, 3.6, 2.0, 2.0, "#c3c7cb") +
        // The cab side behind the windshield, black to the first door.
        path(poly([[7.0, 6.6], ["q", 9.0, 7.0, 9.6, 8.6], [14.9, 8.6], [14.9, 13.4], [7.0, 13.4]]), "#1b1d21");
    }
    return s;
  },
  detail: (c, g, car) => {
    let s = eave(g, car, 13.2);
    if (car.cab) {
      // The artwork's dot rings and tracks, and the Mariyung name over them.
      for (const [x, y, r] of [[11.0, 10.6, 0.9], [13.0, 11.6, 0.6], [12.4, 9.4, 0.5]]) {
        s += circle(x, y, r, "none", 0, 'stroke="#f2f2f2" stroke-width="0.7" stroke-dasharray="0.6 1.2" vector-effect="non-scaling-stroke"') + circle(x, y, r * 0.35, "#f2f2f2");
      }
      s += letters(c, 11.9, 12.85, 0.55, "MARIYUNG", "#f2f2f2", { weight: 700, spacing: 0.05 }) + transport(c, (car.plan.deck[0] + car.plan.deck[1]) / 2, 8.0, 0.9, "NSW TrainLink");
    } else s += transport(c, (car.plan.deck[0] + car.plan.deck[1]) / 2, 8.0, 0.9, "NSW TrainLink");
    return s;
  },
};
const mariyung = (kind) => (c) => deckCar(MAR, { cab: kind === "d", motor: kind === "n", pan: kind === "d" ? c.L - 8.6 : null })(c);

// ===================== NSW TrainLink's diesel trains =====================

// Diesel roof gear: an exhaust stack with its rain cap; the radiator's
// roof grille; horns over the cab.
const exhaust = (x, roof) => rect(x, roof - 0.05, 1.5, 0.4, "#7d848c", 0.4, 'rx="0.1"') + rect(x + 0.4, roof + 0.35, 0.7, 0.45, "#2a2d31") + rect(x + 0.25, roof + 0.78, 1.0, 0.12, "#2a2d31");
const roofGrille = (x, w, roof, h = 0.5) => path(poly([[x, roof - 0.05], [x + 0.4, roof + h], [x + w - 0.4, roof + h], [x + w, roof - 0.05]]), "#5d646c", 0.4) + slats(x + 0.5, roof + 0.05, w - 1.0, h - 0.12, 0.3, "rgba(255,255,255,0.22)");
// Under-floor equipment: [x, w, h, kind], kind "e" the engine and its
// transmission, "g" a grilled radiator or cooler, "t" a fuel tank, "b" a
// box with doors.
function gear(top, list) {
  let s = "";
  for (const [x, w, h, k] of list) {
    if (k === "t") s += rect(x, top - h, w, h, "currentColor", 0, `opacity="0.62" rx="${r2(h / 2)}"`) + line(x + 0.6, top - h * 0.35, x + w - 0.6, top - h * 0.35, C.steelDark, 0.4);
    else if (k === "e") s += rect(x, top - h, w, h, "currentColor", 0, 'opacity="0.85" rx="0.15"') + lines([[x + w * 0.62, top - h + 0.15, x + w * 0.62, top - 0.15]], C.steelDark, 0.5) +
      circle(x + w * 0.3, top - h / 2, h * 0.28, "none", 0, `stroke="${C.steelDark}" stroke-width="0.6" vector-effect="non-scaling-stroke"`);
    else {
      s += rect(x, top - h, w, h, "currentColor", 0, 'opacity="0.78" rx="0.12"');
      if (k === "g") s += slats(x + 0.2, top - h + 0.15, w - 0.4, h - 0.3, 0.35, "rgba(255,255,255,0.22)");
      else if (k === "b") s += lines([[x + w / 2, top - h + 0.15, x + w / 2, top - 0.15]], C.steelDark, 0.45);
    }
  }
  return s;
}
// Corrugated stainless sides (Budd-style fluting) between y0 and y1.
const ribs = (x0, x1, y0, y1, gap = 0.3) => {
  const segs = [];
  for (let y = y0; y <= y1; y += gap) segs.push([x0, y, x1, y]);
  return lines(segs, "rgba(0,0,0,0.13)", 0.5);
};
// A single plug door with its window, its leaf edged dark.
const plug = (x, w = 2.9, y0 = 3.9, y1 = 10.9, fill = TL.yellow) => ({ x, w, y0, y1, leaves: 1, glassY: 0.48, glassH: 0.36, grabs: false, fill });

// A diesel railcar (one car) on bilevel(): spec gives the body (roof,
// sill, trucks, nose, cabLen), car its windows, doors, gear, roof and paint.
const railcar = (spec, car) => (c0) => {
  const c = car.cab ? { ...c0, cabL: true } : { ...c0, cabL: false, cabR: false };
  return bilevel(c, {
    ...spec, ...(car.cab ? {} : { nose: null, cab: null }), badge: false, roofItems: [],
    rows: car.rows, doors: car.doors,
    paint: (c, g) => spec.paint(c, g, car),
    cab: car.cab ? (c, g) => spec.cab(c, g, car) : null,
    extra: (c, g) => {
      let s = gear(spec.sill, car.gear || []) + doorTrim(car.doors, spec.sill);
      if (car.onRoof) s += car.onRoof(c, g);
      return s + (spec.detail ? spec.detail(c, g, car) : "");
    },
  });
};

// --- Endeavour railcars (ABB Transportation, Dandenong, 1994-96): 14
// two-car sets in service, a TE car (2801-2815) and an LE car with the
// toilet (2851-2865), each 25.25 m long, 2.92 m wide and 4.11 m tall, the
// floor 1.27 m above the rail; a Cummins KTA-19R of 383 kW under each car,
// driving one truck through a Voith hydraulic transmission. Two single
// plug doors a side on each car, one behind the cab and one at the inner
// end, ten windows between (Wikipedia, "New South Wales Endeavour
// railcar"; NSW TrainLink). Run singly or two sets coupled on the Southern
// Highlands, Hunter and Bathurst lines and the Kiama-Bomaderry shuttle.
// Ribbed stainless sides, yellow doors; the cab front and its sides back
// to the first door royal blue over a yellow band and a black skirt
// (photographs at Goulburn, 2024; set 2801-2851 wears NSW TrainLink's red
// and yellow, not drawn).
const XPL = { roof: mm(4110), sill: 3.7, cornerR: 0.9, end: 0.5, trucks: { centers: 58.6, wb: 8.5, d: 33 }, diaphragm: [4.2, 11.8],
  nose: [[1.0, 3.7], [0.6, 4.0], [0.6, 9.4], ["q", 0.7, 11.4, 1.7, 12.6], ["q", 2.4, 13.48, 4.4, 13.48]], cabLen: 5,
  cab: (c, g, car) => path(poly([[0.66, 8.5], [0.66, 10.6], ["q", 0.8, 11.5, 1.4, 11.9], [3.6, 11.9], [3.6, 8.5]]), C.glass) +
    path(poly([[0.7, 10.2], [0.7, 10.6], ["q", 0.85, 11.4, 1.4, 11.75], [3.4, 11.75], [3.4, 10.2]]), C.glassLight) + wiper(1.0, 8.7, 1.6, 10.6) +
    rect(1.0, 12.25, 2.2, 0.55, "#14171a", 0, 'rx="0.1"') + lamp(0.62, 6.9, 0.5, 0.5) + lamp(0.62, 6.15, 0.5, 0.4, "#e23b2e") +
    coupler(0, 3.0, 1.6) + skirt(0.9, 5.6, 3.7, "#1e2125") + win(4.1, 8.0, 1.6, 2.8, 0.3) + horns(2.6, 13.48),
  paint: (c, g, car) => {
    const L = g.L;
    let s = rect(0, 0, L, 18, SYD.silver) + ribs(0, L, 4.0, 11.4) + rect(0, 12.2, L, 2, "#b7bcc1") + rect(0, 0, L, 3.95, "#2a2d31");
    if (car.paintBand) s += car.paintBand(L);
    if (car.cab) s += car.cabPaint(L);
    return s;
  },
  detail: (c, g, car) => lines([[car.cab ? 5 : 0.5, 11.9, g.L - 0.5, 11.9]], "rgba(0,0,0,0.2)", 0.5) + (car.mark ? car.mark(c, g) : ""),
};
const railLen = mm(25250);
const xRows = (xs, y = 7.2, w = 3.9, h = 2.8) => [{ xs, y, w, h, r: 0.35 }];
// The Endeavour's cab: blue over a yellow band, the blue carried back to the
// first door; under it the black skirt.
const endeavourCab = (L) => path(poly([[0, 3.7], [12.6, 3.7], [12.6, 18], [0, 18]]), TL.royal) + path(poly([[0, 5.4], [2.2, 5.4], ["q", 2.9, 6.2, 2.2, 7.1], [0, 7.1]]), TL.yellow) + rect(0, 0, 12.6, 4.4, "#1e2125");
const endeavourCar = married(railcar(XPL, {
  cab: true, cabPaint: endeavourCab,
  rows: xRows(seq(13.6, 6.1, 10), 7.2, 4.3, 2.8), doors: [plug(8.6), plug(railLen - 4.0)],
  gear: [[17, 12.5, 2.0, "e"], [30.5, 6, 1.6, "g"], [37.5, 8, 1.3, "t"], [47, 5, 1.3, "b"], [53, 5, 1.1, "b"]],
  onRoof: (c, g) => roofGrille(19, 9, g.roof) + exhaust(30, g.roof) + roofGrille(50, 12, g.roof, 0.45),
  mark: (c) => transport(c, 44, 5.4, 0.8, "NSW TrainLink", "#2b2f34", TL.red),
}));

// --- Xplorer (ABB Transportation, Dandenong, 1993-94; two converted from
// Endeavours in 2001): 23 cars, the Endeavour's body and power, 25.25 m
// long, 4.11 m tall: EA driving cars with first class and the buffet
// (2501-2508), EB economy middle cars (2511-2517), EC economy driving cars
// (2521-2528), run as EA-EC, EA-EB-EC or EA-EB-EB-EC (Wikipedia, "New
// South Wales Xplorer"). A door behind each cab and one at each car's
// inner end; a louvered panel at the buffet. NSW TrainLink's regional
// paint (CountryLink's of 2008): ribbed stainless, the windows in a sky
// blue band; the cab and its sides ultramarine, the windshield framed in
// yellow, three light blue stripes slanting back from the cab door; yellow
// doors.
const xplorerCab = (L) => path(poly([[0, 3.7], [10.6, 3.7], [10.6, 6.0], [14.2, 12.4], [14.2, 18], [0, 18]]), TL.blue) +
  path(poly([[10.6, 6.6], [14.2, 12.4], [14.2, 11.6], [11.3, 6.6]]), "#7fd3f2") + path(poly([[11.3, 5.2], [14.6, 10.6], [14.6, 9.8], [12.0, 5.2]]), "#5ec4ea") +
  path(poly([[12.0, 3.8], [15.0, 8.6], [15.0, 7.9], [12.7, 3.8]]), "#9fdcf5") +
  path(poly([[0, 7.9], [0.9, 7.9], [0.9, 12.6], [0, 12.6]]), TL.yellow) + rect(0, 0, 12, 4.3, "#1e2125");
const skyBand = (L) => rect(0, 6.95, L, 3.3, TL.sky) + rect(0, 10.25, L, 0.15, "#3a9cc4");
const xplorer = (kind) => railcar(XPL, kind === "b" ? {
  cab: false, paintBand: skyBand,
  rows: xRows(seq(6.6, 5.6, 13), 7.2, 3.9, 2.75), doors: [plug(2.0), plug(railLen - 4.9)],
  gear: [[17, 12.5, 2.0, "e"], [30.5, 6, 1.6, "g"], [37.5, 8, 1.3, "t"], [47, 5, 1.3, "b"]],
  onRoof: (c, g) => roofGrille(19, 9, g.roof) + exhaust(30, g.roof) + roofGrille(48, 12, g.roof, 0.45),
  mark: (c) => transport(c, 40, 5.3, 0.8, "NSW TrainLink", "#2b2f34", TL.red),
} : {
  cab: true, paintBand: skyBand, cabPaint: xplorerCab,
  rows: xRows([15.6, 21.2, 26.8, 32.4, ...(kind === "a" ? [] : [38.0, 43.6]), 49.2, 54.8, 60.4, 66.0, 71.6], 7.2, 3.9, 2.75), doors: [plug(8.0, 2.9, 3.9, 10.9, TL.blue), plug(railLen - 4.0)],
  gear: [[17, 12.5, 2.0, "e"], [30.5, 6, 1.6, "g"], [37.5, 8, 1.3, "t"], [47, 5, 1.3, "b"]],
  onRoof: (c, g) => roofGrille(19, 9, g.roof) + exhaust(30, g.roof) + roofGrille(50, 12, g.roof, 0.45) + rect(5.6, g.roof - 0.05, 0.5, 0.6, "#3a3f45"),
  // The EA's buffet: a louvered panel where the windows stop.
  mark: (c) => (kind === "a" ? rect(38.4, 7.1, 9.4, 3.0, "#3b7fb0", 0.4) + slats(38.6, 7.2, 9.0, 2.8, 0.32, "rgba(255,255,255,0.35)") : "") +
    transport(c, 44, 5.3, 0.8, "NSW TrainLink", "#2b2f34", TL.red),
});

// --- Hunter railcars (United Goninan, Broadmeadow, 2006-07): seven two-car
// sets, HM (2701-2707) and HMT (2751-2757) cars, 25.25 m long, 2.93 m
// wide, 4.24 m tall, the floor 1.27 m above the rail; a 559 kW Cummins
// QSK19-R under each car (Wikipedia, "New South Wales Hunter railcar").
// Stainless steel with a fibreglass cab. A plug door behind the cab and a
// double door at the inner end. NSW TrainLink's paint since 2017: the
// sides silver gray, the windows in a red-orange band, the cab yellow
// around a red-orange face, red-orange back over the cab door to a
// slanting edge, then a gray panel with the name; yellow doors.
const HUN = { ...XPL, roof: mm(4240), sill: 3.7, trucks: { centers: 58.6, wb: 8.5, d: 33 },
  nose: [[1.1, 3.7], [0.5, 4.1], [0.5, 9.0], ["q", 0.6, 11.6, 1.7, 13.0], ["q", 2.5, mm(4240), 4.6, mm(4240)]], cabLen: 5,
  cab: (c) => path(poly([[0.56, 8.6], [0.56, 10.9], ["q", 0.7, 11.9, 1.4, 12.3], [3.8, 12.3], [3.8, 8.6]]), C.glass) +
    path(poly([[0.6, 10.4], [0.6, 10.9], ["q", 0.75, 11.8, 1.4, 12.15], [3.6, 12.15], [3.6, 10.4]]), C.glassLight) + wiper(0.9, 8.8, 1.5, 10.8) +
    rect(1.3, 13.0, 1.4, 0.5, "#14171a", 0, 'rx="0.12"') + slats(1.35, 13.05, 1.3, 0.4, 0.2, "rgba(255,255,255,0.4)") +
    lamp(0.56, 6.9, 0.55, 0.55) + lamp(0.56, 6.1, 0.55, 0.4, "#e23b2e") + coupler(0, 3.0, 1.6) + skirt(1.0, 5.8, 3.7, "#1e2125") + win(4.6, 7.9, 1.7, 3.0, 0.3),
  paint: (c, g, car) => {
    const L = g.L;
    let s = rect(0, 0, L, 18, "#bfc3c7") + rect(0, 12.6, L, 2, "#8f969d") + rect(0, 0, L, 3.95, "#2a2d31");
    s += rect(22.6, 6.85, L - 22.6, 3.45, TL.red) + rect(22.6, 6.75, L - 22.6, 0.1, "#9a2b1d");
    if (car.cab) s += path(poly([[0, 3.7], [11.4, 3.7], [11.4, 6.0], [13.4, 13.3], [13.4, 18], [0, 18]]), TL.red) +
      path(poly([[0, 3.7], [1.6, 3.7], [1.6, 8.2], [0.9, 8.2], [0.9, 12.6], ["q", 1.8, 13.4, 3.6, 13.6], [4.8, 13.6], [4.8, 18], [0, 18]]), TL.yellow) +
      path(poly([[11.4, 3.7], [17.6, 3.7], [17.6, 13.3], [13.4, 13.3], [11.4, 6.0]]), "#d5d8db") + rect(0, 0, 4.8, 4.4, "#1e2125");
    return s;
  },
};
const hunterCar = married(railcar(HUN, {
  cab: true,
  rows: xRows([23.6, 29.0, 34.4, 39.8, 50.6, 56.0, 61.4, 66.8, 72.2], 7.15, 4.2, 2.85),
  doors: [plug(8.3, 2.6, 3.9, 11.0, TL.red), { ...plug(17.9, 4.6), leaves: 2 }, plug(railLen - 4.0)],
  gear: [[17, 13, 2.1, "e"], [31, 6, 1.7, "g"], [38, 8, 1.3, "t"], [48, 5, 1.3, "b"]],
  onRoof: (c, g) => roofGrille(18, 10, g.roof) + exhaust(30.5, g.roof) + roofGrille(48, 12, g.roof, 0.5),
  mark: (c) => rect(45.6, 7.1, 3.6, 2.9, "#5a6068", 0.4) + slats(45.7, 7.2, 3.4, 2.7, 0.3, "rgba(255,255,255,0.3)") + transport(c, 15.4, 9.2, 0.8, "NSW TrainLink", "#c8102e", TL.red),
}));

// --- XPT (Comeng, Granville, 1981-93; ABB, Dandenong, power cars XP2015-
// XP2018 and the XL and XAM cars): British Rail's HST redesigned for NSW.
// Power cars XP2000-XP2017 and XP2019, 17.3 m long, 2.89 m wide and 4.22
// m tall, a Paxman VP185 of 1,492 kW since 2000 (Wikipedia, "New South
// Wales XPT"; railtram.com.au). Carriages 24.2 m long, 2.918 m wide and
// 4.04 m tall, ribbed stainless with hinged doors at each end: XF economy
// (2200-2224), XFH economy with a luggage room (2104-2113), XL first
// (2228-2237), XBR first with the buffet (2150-2158), XAM sleeping cars
// (2175-2183); a power car at each end and four to seven carriages.
// The paint, CountryLink's of the 1990s kept by NSW TrainLink: the power
// car ultramarine, a white and teal wave sweeping up its side from the
// back, the front's upper half yellow around the windshield, the nose's
// lower half black; the carriages' windows in a teal band. (Two power
// cars and six carriages have worn the 1982 State Rail red, black and
// silver since April 2026, for the Grafton XPT; not drawn.)
const XPT = { roof: mm(4220), sill: 4.0, cornerR: 0.8, end: 0.5, trucks: { centers: 32.6, wb: 8.5, d: 40, kind: "loco" }, diaphragm: [4.4, 11.6], badge: false,
  nose: [[1.4, 4.0], [0.45, 5.4], ["q", 0.35, 7.0, 1.1, 7.9], [2.1, 9.0], [4.0, 11.6], ["q", 5.0, 13.2, 7.0, 13.7], ["q", 8.0, mm(4220), 9.6, mm(4220)]], cabLen: 10 };
const xptPower = (c0) => {
  const c = { ...c0, cabL: true };
  return bilevel(c, {
    ...XPT, roofItems: [], rows: [], doors: [plug(11.4, 2.2, 4.3, 11.4, "rgba(0,0,0,0.08)")],
    paint: (c, g) => {
      const L = g.L;
      let s = rect(0, 0, L, 18, TL.blue) + rect(0, 0, L, 4.3, "#1e2125") + rect(0, 13.35, L, 2, "#283041");
      // The white wave from a point at the cab door's foot, widening back
      // to the rear end; the teal stripe in its upper half.
      s += path(`M13.8 4.35Q19 8.6 25 9.9Q32 10.5 ${L} 10.6L${L} 6.1Q36 6.0 30 5.6Q21 5.0 13.8 4.35Z`, "#f3f4f5") +
        path(`M18.5 5.6Q24 8.4 30 9.2Q36 9.9 ${L} 10.2L${L} 8.8Q38 8.7 32 8.2Q25 7.4 18.5 5.6Z`, "#4bb3e0");
      // The front: black below the headlights, yellow from under the
      // windshield over the cab roof, back past the windshield's corner.
      s += path(poly([[0, 0], [7.8, 0], [7.8, 4.3], ["q", 3.0, 4.5, 0.4, 5.7], [0, 5.7]]), "#1e2125") +
        path(poly([[0.9, 7.7], ["q", 4.0, 8.0, 6.0, 9.6], [7.4, 11.4], ["q", 8.0, 12.4, 8.0, 13.4], [8.4, 18], [0, 18], [0, 7.7]]), TL.yellow);
      return s;
    },
    // The nose's lower half, a black fairing over the coupler down to the
    // plow; the windshield framed in a pale gasket; the headlights under it.
    cab: () => path(poly([[0.45, 5.4], [7.8, 5.0], [7.8, 1.3], [3.4, 1.1], [1.0, 1.4], ["q", 0.3, 2.2, 0.3, 3.4], ["q", 0.32, 4.6, 0.45, 5.4]]), "#1e2125") + path("M0.3 3.4Q0.32 4.6 0.45 5.4", "none", 0.6) +
      lines([[1.2, 2.0, 7.6, 2.0]], "#3d4248", 0.6) + path("M1.0 1.4Q0.3 2.2 0.3 3.4", "none", 0.6) +
      path(poly([[1.9, 8.75], [3.9, 11.35], ["q", 4.3, 11.9, 5.2, 11.9], [7.0, 11.9], [7.0, 10.6], ["q", 5.0, 9.1, 1.9, 8.75]]), "#e9ecef") +
      path(poly([[2.2, 8.95], [4.0, 11.25], ["q", 4.35, 11.7, 5.2, 11.7], [6.8, 11.7], [6.8, 10.7], ["q", 4.9, 9.3, 2.2, 8.95]]), C.glass) +
      path(poly([[3.1, 10.0], [4.0, 11.2], [6.6, 11.2], [6.6, 10.6], ["q", 5.6, 10.0, 3.1, 10.0]]), C.glassLight) + wiper(2.6, 9.1, 3.8, 10.8) +
      lamp(0.42, 6.55, 0.6, 0.45) + lamp(0.42, 5.95, 0.6, 0.35, "#e23b2e") +
      // Cab side window; the vents in the yellow cap; the horns on the roof.
      win(8.6, 9.0, 2.4, 2.4, 0.35) + rect(5.0, 12.65, 2.4, 0.55, "#2a2d31", 0, 'rx="0.15"') + slats(5.1, 12.7, 2.2, 0.45, 0.4, "rgba(255,255,255,0.35)") +
      horns(8.4, mm(4220)),
    extra: (c, g) => {
      const L = g.L;
      // Side grilles: the radiator's big louvers at the back, the air
      // intakes ahead of them.
      let s = rect(L - 12.6, 7.2, 5.0, 4.6, "#2a4fa8", 0.4) + slats(L - 12.5, 7.3, 4.8, 4.4, 0.3, "rgba(0,0,0,0.35)") +
        rect(L - 12.6, 4.7, 5.0, 2.0, "#2a4fa8", 0.4) + slats(L - 12.5, 4.8, 4.8, 1.8, 0.3, "rgba(0,0,0,0.35)");
      // Roof: the radiator fan and its grilled housing at the back, the
      // exhaust ahead of it.
      // The engine room's roof: a long grilled hatch over the engine and
      // the cooler group, the exhaust through it.
      s += path(poly([[16, g.roof - 0.05], [16.8, g.roof + 0.55], [L - 2.4, g.roof + 0.55], [L - 1.2, g.roof - 0.05]]), "#2f3644", 0.4) + slats(17, g.roof + 0.04, L - 19.6, 0.45, 0.45, "rgba(255,255,255,0.16)") +
        exhaust(L - 30, g.roof + 0.5);
      // Under the frame: the fuel tank between the trucks, the battery box.
      s += gear(XPT.sill, [[20.6, 14, 1.7, "t"], [36.0, 3.0, 1.0, "b"]]);
      return s;
    },
  });
};
const xptCar = (kind) => (c0) => {
  const c = { ...c0, cabL: false, cabR: false };
  const L = c.L;
  const doors = [plug(1.4, 2.4, 4.4, 11.0, "rgba(0,0,0,0.06)"), plug(L - 3.8, 2.4, 4.4, 11.0, "rgba(0,0,0,0.06)")];
  // Window bays: the XAM's compartments have one window each (narrower),
  // the XBR's buffet a gap, the XFH's luggage room its own door.
  const bays = kind === "xam" ? seq(6.4, 7.0, 10).map((x) => [x, 3.4]) : kind === "xfh" ? seq(23.4, 5.45, 10).map((x) => [x, 4.9])
    : kind === "xbr" ? [...seq(6.0, 5.45, 6).map((x) => [x, 4.9]), ...seq(62.0, 5.45, 3).map((x) => [x, 4.9])] : seq(6.0, 5.45, 13).map((x) => [x, 4.9]);
  return bilevel(c, {
    roof: mm(4040), sill: 3.9, cornerR: 0.8, end: 0.5, trucks: { centers: 56.0, wb: 8.5, d: 36 }, diaphragm: [4.3, 11.6], badge: false, roofItems: [],
    rows: bays.map(([x, w]) => ({ xs: [x], y: 7.2, w, h: 2.6, r: 0.3 })),
    doors: kind === "xfh" ? [...doors, { x: 13.0, w: 4.6, y0: 4.4, y1: 10.9, leaves: 2, glass: false, glassY: 0.6, glassH: 0.2, grabs: false, fill: "rgba(0,0,0,0.06)" }] : doors,
    paint: (c, g) => rect(0, 0, L, 18, SYD.silver) + ribs(0, L, 4.2, 6.6) + ribs(0, L, 10.5, 12.3) + rect(0, 12.5, L, 2, "#5d646c") + rect(0, 0, L, 4.25, "#2a2d31") +
      rect(0, 6.85, L, 3.3, "#6ec3e6") + rect(0, 6.75, L, 0.1, "#2f86b0") + rect(0, 10.15, L, 0.1, "#2f86b0"),
    extra: (c, g) => {
      let s = gear(3.9, [[20, 6, 1.3, "b"], [27, 7, 1.0, "t"], [36, 5, 1.2, "b"], [43, 6, 1.0, "t"], [51, 5, 1.3, "b"]]) + doorTrim(doors, 3.9);
      s += rect(4, g.roof - 0.05, 10, 0.5, "#a3aab2", 0.4, 'rx="0.12"') + rect(L - 14, g.roof - 0.05, 10, 0.5, "#a3aab2", 0.4, 'rx="0.12"');
      if (kind === "xbr") s += rect(39.4, 7.1, 20.0, 2.8, "#24282d", 0.3) + rect(48.6, 7.3, 2.0, 2.4, C.glass, 0.3);
      return s + transport(c, L / 2, 5.4, 0.8, "NSW TrainLink", "#2b2f34", TL.red);
    },
  });
};

// ===================== Exports =====================

export const TYPES = {
  nswWaratahD: { name: "Waratah (A set) driving trailer", kind: "emu" },
  nswWaratahN: { name: "Waratah (A set) motor car", kind: "emu" },
  nswWaratahT: { name: "Waratah (A set) trailer", kind: "emu" },
  nswWaratah2D: { name: "Waratah Series 2 (B set) driving trailer", kind: "emu" },
  nswWaratah2N: { name: "Waratah Series 2 (B set) motor car", kind: "emu" },
  nswWaratah2T: { name: "Waratah Series 2 (B set) trailer", kind: "emu" },
  nswMilD: { name: "Millennium (M set) driving trailer", kind: "emu" },
  nswMilN: { name: "Millennium (M set) motor car", kind: "emu" },
  nswTanD: { name: "Tangara (T set) driving trailer", kind: "emu" },
  nswTanN: { name: "Tangara (T set) motor car", kind: "emu" },
  nswOscarD: { name: "OSCAR (H set) driving trailer", kind: "emu", amenities: ["toilet"] },
  nswOscarN: { name: "OSCAR (H set) motor car", kind: "emu" },
  nswMarD: { name: "Mariyung (D set) driving car", kind: "emu" },
  nswMarN: { name: "Mariyung (D set) car", kind: "emu", amenities: ["toilet"] },
  nswEndeavour: { name: "Endeavour railcar", kind: "emu", amenities: ["toilet"] },
  nswHunter: { name: "Hunter railcar", kind: "emu", amenities: ["toilet"] },
  nswXplorerA: { name: "Xplorer first class and buffet car (EA)", kind: "emu", amenities: ["first", "cafe", "toilet"] },
  nswXplorerB: { name: "Xplorer economy car (EB)", kind: "emu", amenities: ["toilet"] },
  nswXplorerC: { name: "Xplorer economy driving car (EC)", kind: "emu", amenities: ["toilet"] },
  nswXptPower: { name: "XPT power car", kind: "diesel" },
  nswXf: { name: "XPT economy car (XF)", kind: "coach", amenities: ["toilet"] },
  nswXfh: { name: "XPT economy and luggage car (XFH)", kind: "coach", amenities: ["toilet"] },
  nswXl: { name: "XPT first class car (XL)", kind: "coach", amenities: ["first", "toilet"] },
  nswXbr: { name: "XPT first class and buffet car (XBR)", kind: "coach", amenities: ["first", "cafe"] },
  nswXam: { name: "XPT sleeping car (XAM)", kind: "coach", amenities: ["sleeper"] },
};
// oneEnd: drawn cab-left and mirrored at the back of a train. variant: what
// makes one car's drawing differ from another of its model (its place in
// the train, its railroad's paint), for consist.js's cache.
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const pos = (c) => `${c.index}/${c.count}`;
export const MODELS = {
  nswWaratahD: M(waratah(false, "d"), warLen.d, true, facing), nswWaratahN: M(waratah(false, "n"), warLen.n, false, pos), nswWaratahT: M(waratah(false, "t"), warLen.t),
  nswWaratah2D: M(waratah(true, "d"), warLen.d, true, facing), nswWaratah2N: M(waratah(true, "n"), warLen.n, false, pos), nswWaratah2T: M(waratah(true, "t"), warLen.t),
  nswMilD: M(millennium("d"), mm(20532), true, facing), nswMilN: M(millennium("n"), mm(20243)),
  nswTanD: M(tangara("d"), mm(20320), true, facing), nswTanN: M(tangara("n"), mm(20220)),
  nswOscarD: M(oscar("d"), mm(20340), true, (c) => `${c.agency} ${facing(c)}`), nswOscarN: M(oscar("n"), mm(20435), false, (c) => `${c.agency} ${pos(c)}`),
  nswMarD: M(mariyung("d"), mm(20435), true, facing), nswMarN: M(mariyung("n"), mm(20340)),
  nswEndeavour: M(endeavourCar, railLen), nswHunter: M(hunterCar, railLen),
  nswXplorerA: M(xplorer("a"), railLen, true), nswXplorerB: M(xplorer("b"), railLen), nswXplorerC: M(xplorer("c"), railLen, true),
  nswXptPower: M(xptPower, 56.92, true),
  nswXf: M(xptCar("xf"), 79.4), nswXfh: M(xptCar("xfh"), 79.4), nswXl: M(xptCar("xl"), 79.4), nswXbr: M(xptCar("xbr"), 79.4), nswXam: M(xptCar("xam"), 79.4),
};

// Car numbers, where a feed may report them (NSW Trains' feed names an XPT
// by its power car, "XP2009") and for the railroad's fleet roster: the
// published number series of each class (Wikipedia's fleet articles;
// railtram.com.au for the XPT). The Mariyung's car numbers aren't
// published, so its cars are drawn from the set type alone.
const OSCAR_CARS = [[6901, 6999, "nswOscarD"], [6843, 6854, "nswOscarD"], [5901, 5999, "nswOscarN"], [5821, 5826, "nswOscarN"], [5871, 5876, "nswOscarN"]];
export const FLEETS = {
  sydneytrains: [[6301, 6480, "nswWaratahD"], [5301, 5680, "nswWaratahN"], [6501, 6680, "nswWaratahT"],
    [1101, 1141, "nswWaratah2D"], [1201, 1241, "nswWaratah2D"], [1601, 1941, "nswWaratah2N"], [1301, 1441, "nswWaratah2T"],
    [1001, 1073, "nswMilD"], [1501, 1573, "nswMilN"], [6101, 6289, "nswTanD"], [6801, 6841, "nswTanD"], [5101, 5285, "nswTanN"], [5801, 5820, "nswTanN"],
    ...OSCAR_CARS],
  nswtrainlink: [[2000, 2019, "nswXptPower"], [2104, 2113, "nswXfh"], [2150, 2158, "nswXbr"], [2175, 2183, "nswXam"], [2200, 2224, "nswXf"], [2228, 2237, "nswXl"],
    [2501, 2508, "nswXplorerA"], [2511, 2517, "nswXplorerB"], [2521, 2528, "nswXplorerC"], [2701, 2707, "nswHunter"], [2751, 2757, "nswHunter"],
    [2801, 2815, "nswEndeavour"], [2851, 2865, "nswEndeavour"], ...OSCAR_CARS],
};

// ---------- Typical trains ----------
// Sydney Trains' feed sends each train's set type (its letter, t.fleet) and
// its cars (t.carCount), as the trip id does; with neither (a train placed
// from the timetable), the line says what usually runs.
const set = (label, ...units) => ({ label, units });
const four = (d, n) => [[d, 1], [n, 2], [d, 1]];
// A set type's train of n cars: four-car sets coupled in pairs, the
// Mariyung's six-car sets (DD-DNL-DT-DN-DND-DDA) leading a four in ten.
function sydneySets(f, n, run = "") {
  const k = (x) => (x === 4 ? "4 cars" : `${x} cars`);
  switch (f) {
    case "B": return set("Waratah Series 2 (B set), 8 cars", ["nswWaratah2D", 1], ["nswWaratah2N", 2], ["nswWaratah2T", 2], ["nswWaratah2N", 2], ["nswWaratah2D", 1]);
    case "A": return set("Waratah (A set), 8 cars", ["nswWaratahD", 1], ["nswWaratahN", 2], ["nswWaratahT", 2], ["nswWaratahN", 2], ["nswWaratahD", 1]);
    case "M": return n === 4 ? set("Millennium (M set), 4 cars", ...four("nswMilD", "nswMilN")) : set("Millennium (M set), two sets, 8 cars", ...four("nswMilD", "nswMilN"), ...four("nswMilD", "nswMilN"));
    case "T": return n === 4 ? set("Tangara (T set), 4 cars", ...four("nswTanD", "nswTanN")) : set("Tangara (T set), 8 cars", ...four("nswTanD", "nswTanN"), ...four("nswTanD", "nswTanN"));
    case "H": return n === 4 ? set("OSCAR (H set), 4 cars", ...four("nswOscarD", "nswOscarN")) : set("OSCAR (H set), two sets, 8 cars", ...four("nswOscarD", "nswOscarN"), ...four("nswOscarD", "nswOscarN"));
    // The V sets left in January 2026; trips still filed for them run as
    // Mariyungs.
    case "D": case "V": {
      const six = [["nswMarD", 1], ["nswMarN", 4], ["nswMarD", 1]], quad = four("nswMarD", "nswMarN");
      const units = n === 4 ? quad : n === 6 ? six : n === 8 ? [...quad, ...quad] : n === 10 ? [...six, ...quad] : n === 12 ? [...six, ...six] : null;
      return units ? set(`Mariyung (D set), ${k(n)}`, ...units) : set("Mariyung (D set), 4 to 10 cars", ...quad);
    }
    case "N": return n >= 4 ? set("Endeavour railcars, two sets, 4 cars", ["nswEndeavour", 4]) : set("Endeavour railcar, 2 cars", ["nswEndeavour", 2]);
    case "J": return n >= 4 ? set("Hunter railcars, two sets, 4 cars", ["nswHunter", 4]) : set("Hunter railcar, 2 cars", ["nswHunter", 2]);
    case "P": {
      // EA first and buffet, EB economy, EC economy: EA-EC, EA-EB-EC, or
      // two trains run as one (the Armidale and Moree Xplorer, divided at
      // Werris Creek).
      const unit = (m) => (m === 2 ? [["nswXplorerA", 1], ["nswXplorerC", 1]] : m === 4 ? [["nswXplorerA", 1], ["nswXplorerB", 2], ["nswXplorerC", 1]] : [["nswXplorerA", 1], ["nswXplorerB", 1], ["nswXplorerC", 1]]);
      const m = n || 3, units = m <= 4 ? unit(m) : [...unit(m - 3 >= 2 ? 3 : 2), ...unit(m - (m - 3 >= 2 ? 3 : 2))];
      return set(n ? `Xplorer, ${k(m)}` : "Xplorer, usually 2 to 4 cars", ...units);
    }
    case "X": {
      // The trip id counts every vehicle (the Brisbane XPT, seven: two power
      // cars and five carriages).
      // The overnight trains (Brisbane, NT31/32, and Melbourne's night
      // train, ST23/24) carry sleeping cars in place of an economy car.
      const m = Math.max(3, Math.min(7, (n || 7) - 2)), night = /^(NT3[12]|ST2[34])$/.test(run);
      const sleepers = night ? Math.max(1, m - 4) : m >= 6 ? m - 5 : 0, economy = Math.max(1, m - 2 - sleepers - (m >= 4 ? 1 : 0));
      const cars = [["nswXfh", 1], ["nswXf", economy - 1], ["nswXbr", 1], ["nswXl", m >= 4 ? 1 : 0], ["nswXam", sleepers]].filter(([, x]) => x > 0);
      return set(`XPT, two power cars and ${m} carriages${sleepers ? " (sleeping cars at the back)" : ""}`, ["nswXptPower", 1], ...cars, ["nswXptPower", 1]);
    }
    default: return null;
  }
}
// The set type: the plug-in's letter (t.fleet; a railroad page's roster
// train carries fleet: true instead, which isn't one), else what a reported
// car number says.
const setType = (t, reported) => (typeof t.setType === "string" ? t.setType : typeof t.fleet === "string" ? t.fleet : REPORTED[reported] || null);
const REPORTED = { nswXptPower: "X", nswXf: "X", nswXfh: "X", nswXl: "X", nswXbr: "X", nswXam: "X", nswXplorerA: "P", nswXplorerB: "P", nswXplorerC: "P",
  nswEndeavour: "N", nswHunter: "J" };
export const TYPICAL = {
  sydneytrains: (t, reported) => {
    const s = sydneySets(setType(t, reported), t.carCount, t.number || "");
    if (s) return s;
    const r = t.route || "";
    // By line: Waratahs run most of every line; the Millenniums the T6
    // shuttle and many T2, T3, T5 and T8 trains; the Tangaras most of T4.
    if (/^T6 /.test(r)) return set("Usually a Millennium (M set), 4 cars", ...four("nswMilD", "nswMilN"));
    if (/^T7 /.test(r)) return set("Usually a Millennium (M set), 4 cars (Waratahs on event days)", ...four("nswMilD", "nswMilN"));
    if (/^T4 /.test(r)) return set("Usually a Tangara (T set), 8 cars (some Waratahs)", ...four("nswTanD", "nswTanN"), ...four("nswTanD", "nswTanN"));
    return set("Usually a Waratah (A or B set), 8 cars (some Millennium, Tangara or OSCAR sets)",
      ["nswWaratahD", 1], ["nswWaratahN", 2], ["nswWaratahT", 2], ["nswWaratahN", 2], ["nswWaratahD", 1]);
  },
  nswtrainlink: (t, reported) => {
    const s = sydneySets(setType(t, reported), t.carCount, t.number || "");
    if (s) return s;
    const r = t.route || "", n = t.number || "";
    // The diesel shuttles beyond the wires run under their own letters.
    if (/^(WN|KN|SN)\d/.test(n) || r === "Southern Highlands Line") return set("Usually an Endeavour railcar, 2 or 4 cars", ["nswEndeavour", 2]);
    if (r === "Hunter Line" || /^V\d{3}$/.test(n)) return set("Usually a Hunter railcar, 2 cars (some Endeavours)", ["nswHunter", 2]);
    if (/^(NT|ST|WP2)\d/.test(n) || r === "North Coast Line") return sydneySets("X", 7, n);
    if (/^(NP|SP|WP4)\d/.test(n) || r === "North Western Line") return sydneySets("P", 0);
    if (r === "Western Line" || r === "Southern Line") return sydneySets("X", 7, n);
    if (r === "South Coast Line") return set("Usually a Mariyung (D set) or OSCAR (H set), 4 to 8 cars", ...four("nswMarD", "nswMarN"), ...four("nswMarD", "nswMarN"));
    return set("Usually a Mariyung (D set), 8 or 10 cars (some OSCAR sets)", ["nswMarD", 1], ["nswMarN", 4], ["nswMarD", 1], ...four("nswMarD", "nswMarN"));
  },
};

// ---------- Fact sheets ----------
// Facts come in km/h and kW, converted to the sheets' mph and hp.
const kmh = (v) => Math.round((v / 1.609344) * 10) / 10, kw = (v) => Math.round(v / 0.7457);
const ft = (v) => Math.round(mm(v) * 10) / 10;
const WP = "https://en.wikipedia.org/wiki/";
const WARATAH = { model: "Waratah (A set)", type: "Double-deck electric multiple unit", builder: "Downer EDI Rail with Changchun Railway Vehicles", built: "2010–2014",
  fleet: "78 eight-car sets (A1, A3–A78, A80)", topSpeedMph: kmh(130), powerHp: kw(2928), seats: 894, lengthFt: ft(163100),
  about: "Sydney's most numerous train, the first air-conditioned fleet to replace the last unairconditioned S sets. Eight cars, four of them motored, with a pantograph on the second and seventh cars.",
  source: `${WP}New_South_Wales_A_and_B_sets` };
const WARATAH2 = { ...WARATAH, model: "Waratah Series 2 (B set)", builder: "Downer Rail with CRRC Changchun", built: "2017–2021", fleet: "41 eight-car sets (B1–B41)",
  about: "The Waratah's second series, ordered for the Sydney Trains timetable of 2017 and to retire the C sets: the same eight-car trains with more wheelchair spaces and grab handles, in orange and dark gray." };
const MILLENNIUM = { model: "Millennium (M set)", type: "Double-deck electric multiple unit", builder: "EDi Rail, Cardiff", built: "2002–2005",
  fleet: "35 four-car sets (M1–M35)", topSpeedMph: kmh(130), powerHp: kw(1808), seats: 452, lengthFt: ft(81550),
  about: "Sydney's first trains with AC traction motors and electronic destination displays, built on the Tangara's plan. Four cars, run singly or two together, a pantograph on each driving car.",
  source: `${WP}New_South_Wales_M_set` };
const TANGARA = { model: "Tangara (T set)", type: "Double-deck electric multiple unit", builder: "A Goninan & Co, Broadmeadow", built: "1987–1995",
  fleet: "About 109 four-car sets, run in pairs", topSpeedMph: kmh(115), powerHp: kw(1360), lengthFt: ft(81080),
  about: "The workhorse of the Eastern Suburbs and Illawarra and Northern lines: four-car sets permanently paired into eights, the driving cars carrying the pantographs. A life extension from 2025 brings new screens, CCTV and burnt orange fronts and doors.",
  source: `${WP}New_South_Wales_T_set` };
const OSCAR = { model: "OSCAR (H set)", type: "Double-deck electric multiple unit", builder: "UGL Rail, Broadmeadow", built: "2006–2012",
  fleet: "55 four-car sets (H1–H55)", topSpeedMph: kmh(130), powerHp: kw(1600), seats: 432, lengthFt: ft(81550),
  about: "The Outer Suburban Car, built for the intercity lines with toilets and reversible seats. As the Mariyungs arrive, the H sets move to Sydney's suburban lines, repainted orange and black.",
  source: `${WP}New_South_Wales_H_set` };
const MARIYUNG = { model: "Mariyung (D set)", type: "Double-deck electric multiple unit", builder: "Hyundai Rotem, Changwon", built: "2019–2024",
  fleet: "610 cars: 70 four-car and 55 six-car sets", topSpeedMph: kmh(130), lengthFt: ft(81550),
  about: "The New Intercity Fleet, named Mariyung (emu) in the Darkinjung language: wider than the V sets it replaced, with 2+2 seats, USB charging and accessible toilets. In service on the Central Coast and Newcastle Line since December 2024, the Blue Mountains since October 2025 and the South Coast since April 2026.",
  source: `${WP}New_South_Wales_D_set` };
const each = (keys, sheet) => Object.fromEntries(keys.map((k) => [k, sheet]));
export const FACTS = {
  ...each(["nswWaratahD", "nswWaratahN", "nswWaratahT"], WARATAH),
  ...each(["nswWaratah2D", "nswWaratah2N", "nswWaratah2T"], WARATAH2),
  ...each(["nswMilD", "nswMilN"], MILLENNIUM),
  ...each(["nswTanD", "nswTanN"], TANGARA),
  ...each(["nswOscarD", "nswOscarN"], OSCAR),
  ...each(["nswMarD", "nswMarN"], MARIYUNG),
  nswEndeavour: { model: "Endeavour railcar", type: "Diesel multiple unit", builder: "ABB Transportation, Dandenong", built: "1994–1996",
    fleet: "14 two-car sets (TE 2801–2815, LE 2851–2865)", topSpeedMph: kmh(145), powerHp: kw(383), seats: 177, lengthFt: ft(25250),
    about: "Two-car railcars for the lines beyond the wires: the Southern Highlands, Lithgow to Bathurst, Kiama to Bomaderry and some Hunter trains. Each car has its own Cummins engine.",
    source: `${WP}New_South_Wales_Endeavour_railcar` },
  nswHunter: { model: "Hunter railcar", type: "Diesel multiple unit", builder: "United Goninan, Broadmeadow", built: "2005–2007",
    fleet: "7 two-car sets (HM 2701–2707, HMT 2751–2757)", topSpeedMph: kmh(145), powerHp: kw(559), seats: 146, lengthFt: ft(25250),
    about: "Built for the Hunter Line from Newcastle to Maitland, Dungog and Scone, replacing the 620/720 class railcars. A Cummins engine under each car.",
    source: `${WP}New_South_Wales_Hunter_railcar` },
  ...each(["nswXplorerA", "nswXplorerB", "nswXplorerC"], { model: "Xplorer", type: "Diesel multiple unit", builder: "ABB Transportation, Dandenong", built: "1993–1994",
    fleet: "23 cars: 8 EA, 7 EB, 8 EC", topSpeedMph: kmh(145), powerHp: kw(383), lengthFt: ft(25250),
    about: "NSW TrainLink's regional railcars, on the Endeavour's body with first class and a buffet in the EA car: Sydney to Canberra, Griffith, Broken Hill, Armidale and Moree. The new CAF regional fleet is due to replace them in 2028.",
    source: `${WP}New_South_Wales_Xplorer` }),
  nswXptPower: { model: "XPT power car", type: "Diesel-electric power car", builder: "Comeng, Granville; ABB, Dandenong", built: "1981–1993",
    fleet: "19 (XP2000–XP2017, XP2019)", topSpeedMph: kmh(160), powerHp: kw(1492), lengthFt: 56.9,
    about: "The Express Passenger Train, British Rail's HST adapted for Australia, with a power car at each end. XPTs run Sydney to Brisbane, Casino, Grafton, Dubbo and Melbourne, day and overnight.",
    source: `${WP}New_South_Wales_XPT` },
  ...each(["nswXf", "nswXfh", "nswXl", "nswXbr", "nswXam"], { model: "XPT carriage", type: "Passenger coach", builder: "Comeng, Granville; ABB, Dandenong", built: "1981–1993",
    fleet: "58: 25 XF, 9 XFH, 8 XL, 8 XBR, 8 XAM", topSpeedMph: kmh(160), lengthFt: 79.4,
    about: "The XPT's stainless steel carriages: economy and first class saloons, a buffet car and sleeping cars for the overnight Brisbane and Melbourne trains.",
    source: "https://railtram.com.au/xpt" }),
};
