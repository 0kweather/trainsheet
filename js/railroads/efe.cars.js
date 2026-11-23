// EFE Trenes de Chile's cars (scripts/railroads/chile.py, agency "efe"):
// the two Santiago suburban services in this build, which do not share
// rolling stock — Tren Nos (Alstom X'Trapolis Modular, two cars) and Tren
// Rancagua (CRRC-Sifang SFE-400, three cars). Trainsheet's own side views
// at the shared scale (js/carart.js), drawn from, and checked against,
// eight photographs on Wikimedia Commons, named here fleet by fleet. The
// lettering is drawn here (no logo files).
//
// What is from the photographs: each fleet's paint, the shape of its cab,
// the number of doors a side and what can be counted between them. None
// of the photographs is a true side elevation (all are three-quarter or
// front views), so the windows' exact spacing, the doors' exact places,
// the roof equipment, what hangs under the floor and the lengths are
// Trainsheet's reading of the type, not measurements.
//
//   Alstom X'Trapolis Modular (XM-01–XM-22), Tren Nos: XM-15 at Estación
//     Central, Feb 2017, cab end from the side ("J27 895 XM-15,
//     Führerstandsseite.jpg") and front three-quarter ("J27 862 Bf
//     Santiago Hbf, XM-15.jpg"); XM-07 on the Nos line, Apr 2017
//     ("Metrotren NOS (33998931476).jpg"); XM-01 and XM-04 head-on at
//     Estación Central, Oct 2014 ("XM-01 y XM-04 en Est Alameda.jpg").
//     A white body; a long raked nose whose black windshield sits in a
//     blue surround that runs from the roof down to the nose, two round
//     lamps in the blue under the windshield; a dark grey lower nose and
//     skirt; a white wedge behind the blue carrying the TrenCentral mark;
//     a white cab door; a blue stripe sweeping up from the skirt to a
//     blue waist stripe under the windows; long dark window panels; three
//     blue double doors a side on each car; "XM-15-C1" above the first
//     window; a dark grey roof crowded with equipment; red pantographs —
//     one folded behind the cab and one raised at the inner end of one
//     car, none on the other (XM-07 and both XM-15 photographs). The two
//     cars share a truck under the gangway (three truck groups under the
//     whole unit in the XM-07 photograph). The unit's length is painted
//     on XM-15 itself ("46,00 m"): 23 m a car.
//   CRRC-Sifang SFE-400 (SFE-401–SFE-409), Tren Rancagua: SFE404 on the
//     open line, Oct 2024 ("Serie SFE por servicio Rancagua.jpg") and at
//     Estación Central, Aug 2022 ("Tren SFE en Estación Central.jpg"); a
//     set at San Francisco de Mostazal, Oct 2025 ("20251025 ESFM.jpg");
//     SFE402 head-on at Rancagua, Feb 2024 ("Automotores Tren Estación
//     Central - Rancagua.jpg"). A different front from the X'Trapolis:
//     upright and flat, black from the lamps to the roof, with no blue
//     nose. A white body; a blue roof whose blue comes down the cab's
//     side behind the black front and curves forward to the lamps; a
//     white cab door; the windows in a black band whose front edge slants;
//     blue double doors, two a side on the leading car (two windows, a
//     door, five windows, a door, two windows — counted in the Mostazal
//     photograph); a thin blue waist stripe; a grey skirt; "efe" low on
//     the side by the first door; a red pantograph. Each car on its own
//     two trucks.
//
// The honest caveats:
//   The timetable (DTPM's GTFS) names no rolling stock, so the
//     fleet-to-line assignment is a judgement, labeled as typical; see
//     TYPICAL below. It rests on EFE's own fleet page (X'Trapolis Modular
//     on Nos–Alameda, the CRRC units on Rancagua–Alameda) and on the
//     photographs, three of which show the trains on those very services.
//   The SFE-400's intermediate car is in no photograph clearly enough to
//     count: its doors and windows follow the leading car's, a judgement.
//     Which car carries the SFE-400's pantograph is a reading (it stands
//     just behind the first gangway in the open-line photograph).
//   The SFE-400's car length (24.5 m) is a judgement; the X'Trapolis's
//     23 m is from the figure painted on the unit.
//   The blues differ with the light from photograph to photograph; one
//     royal blue is drawn for each fleet. The TrenCentral mark on the
//     X'Trapolis is drawn as its name only (the orange and blue emblem is
//     not drawn); EFE has since rebranded and current trains may carry
//     "efe" instead — the X'Trapolis photographs are 2014–2017.
//   Not drawn: the CAF UT-440/UT-440R. They left both services in March
//     2022 for Rancagua–San Fernando, which is not in this build.
//
//   VERIFIED after writing (23 Nov 2026): node --check passes; TYPICAL
//     run over all 416 efe runs through the real consist.js, t.route the
//     line's name — 0 failures, 0 nulls (361 Tren Nos runs → the two-car
//     X'Trapolis, 55 Tren Rancagua runs → the three-car SFE-400); all
//     three models rendered and looked at beside their photographs (the
//     fixes made in that pass are in the build's STATE.md). Renders and
//     the verification script live in the build's work/verify-c1/.

import { C, rect, circle, path, truck, underframe, win, pantograph } from "../carart.js?v=dev";
import { unit, letters, hvac } from "./czechia.cars.js?v=dev";

const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 2, depth = 1.0) => underframe(a, b, top, { depth, boxes: k, tanks: false });
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => Math.round((from + i * pitch) * 10) / 10);
// Both fleets' pantographs are red in every photograph.
const PAN_RED = "#d3262c";
const redPan = (x, roof, up = true) => pantograph(x, roof, { up, facing: -1 }).replaceAll("currentColor", PAN_RED);

// ---------- Alstom X'Trapolis Modular (Tren Nos) ----------
// Two cars, a cab at each outer end and a shared truck under the gangway.
// White; the black windshield in a blue surround from the roof to the
// nose; a dark grey lower nose and skirt; a blue stripe sweeping up from
// the skirt into the blue waist stripe; three blue double doors a side.
const XM = { white: "#eeede6", blue: "#1b45b4", grey: "#4b5057", roof: "#5d6268", ink: "#2c3036", lamp: "#fff4cf" };
const XMG = { roof: 13.0, sill: 3.6 };
const NOSE_XM = [[1.8, 3.6], [0.8, 4.6], ["q", 0.3, 6.1, 2.2, 7.2], [9.8, 12.1], ["q", 11.2, 13.0, 13.6, 13.0]];
const XM_DOORS = [27.0, 45.0, 63.0];
function xmPaint(c, g) {
  const L = g.L;
  let s = bands(L, [[0, 20, XM.white], [12.25, 3, XM.roof], [0, 4.3, XM.grey]]) +
    // The waist stripe, from the cab door back.
    rect(15.6, 5.6, L, 0.9, XM.blue) +
    // The stripe sweeping up from the skirt to the waist stripe.
    path("M12.6 4.3L14.4 4.3L16.6 6.5L14.8 6.5Z", XM.blue) +
    // The dark grey of the lower nose, rising in a straight line from the
    // foot of that stripe to the nose's tip.
    path("M-1 0L-1 6.3L1.0 6.3L13.0 4.3L13.0 0Z", XM.grey) +
    // The dark glazing panels the windows sit in, between the doors.
    [[20.4, 6.4], [31.6, 13.0], [49.6, 13.0], [67.6, 5.6]].map(([x, w]) => rect(x, 7.0, w, 3.7, "#16181c", 0, 'rx="0.3"')).join("") +
    // The blue surround: from the roof behind the windshield down to the
    // nose, over the grey.
    path("M-1 13.5L16.2 13.5L16.2 12.9L8.2 6.05L-1 6.05Z", XM.blue);
  return s;
}
const xmDoor = (x) => ({ x, w: 4.2, y0: XMG.sill, y1: 11.0, leaves: 2, glassY: 0.42, glassH: 0.42, grabs: false, fill: XM.blue });
const xmCab = (c) => unit(c, { roof: XMG.roof, sill: XMG.sill, nose: NOSE_XM, rake: [[2.2, 7.2], [9.8, 12.1]], depth: 3.5, cabLen: 20, lampY: 6.45, bare: true,
  // Long dark window panels: one behind the cab door, two between each
  // pair of doors, one at the inner end.
  rows: [{ xs: [20.8, 32.0, 38.4, 50.0, 56.4], y: 7.2, w: 5.8, h: 3.3, r: 0.3 }, { xs: [68.2], y: 7.2, w: 4.6, h: 3.3, r: 0.3 }],
  doors: XM_DOORS.map(xmDoor),
  // Its own truck behind the cab; the truck under the gangway is shared.
  trucks: [22.0, "end"], wheel: 33, paint: xmPaint, surround: "#14171b",
  cab: () =>
    // The two round lamps in the blue under the windshield.
    circle(6.0, 6.6, 0.42, XM.lamp, 0.3) + circle(8.3, 7.5, 0.42, XM.lamp, 0.3) +
    // The white cab door with its narrow window and grab rails.
    rect(16.8, 4.0, 2.3, 7.4, XM.white, 0.45, 'rx="0.3"') + win(17.4, 7.7, 1.1, 2.7, 0.15) +
    rect(16.35, 5.0, 0.14, 3.4, "#9aa0a6") + rect(19.4, 5.0, 0.14, 5.6, "#9aa0a6"),
  extra: (cc, g) => letters(cc, 23.6, 11.3, 0.5, "XM-15", XM.ink, { weight: 600 }) +
    letters(cc, 12.6, 6.9, 0.55, "TrenCentral", XM.blue, { weight: 700 }) +
    // The roof: equipment along both cars; on one car (the first) a
    // pantograph folded behind the cab and one raised at the inner end.
    hvac(26, XMG.roof, 11, 1.1) + hvac(40, XMG.roof, 13, 1.1) +
    (c.index === 0 ? redPan(19.5, XMG.roof, false) + redPan(g.L - 12, XMG.roof) : hvac(56, XMG.roof, 12, 1.1)) +
    boxes(30, g.L - 12, XMG.sill, 3, 1.2) });

// ---------- CRRC-Sifang SFE-400 (Tren Rancagua) ----------
// Three cars, a cab car at each end and an intermediate car, each on its
// own two trucks. An upright, flat front, black from the lamps to the
// roof; white with a blue roof, the blue coming down the cab's side and
// curving forward to the lamps; the windows in a black band with a
// slanted front edge; blue double doors; a thin blue waist stripe.
const SFE = { white: "#f2f3f4", blue: "#1f57c2", black: "#16181c", skirt: "#868d95", ink: "#3a3d42", lamp: "#fff4cf" };
const SFEG = { roof: 13.0, sill: 3.6 };
const NOSE_SFE = [[1.3, 3.6], [0.7, 4.6], [0.7, 6.6], ["q", 0.75, 7.3, 1.2, 7.9], [3.5, 12.2], ["q", 4.0, 13.0, 5.8, 13.0]];
const BAND = [6.85, 3.85]; // the black window band: its foot and its height
function sfePaint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, SFE.white], [11.55, 3, SFE.blue], [0, 4.2, SFE.skirt]]) +
      rect(cab ? 12.6 : -1, 5.65, L + 2, 0.42, SFE.blue);
    if (cab) {
      // The window band's front edge slants, its foot the further forward.
      s += path(`M13.2 ${BAND[0]}L14.6 ${BAND[0] + BAND[1]}L${L - 3.4} ${BAND[0] + BAND[1]}L${L - 3.4} ${BAND[0]}Z`, SFE.black);
      // The blue down the cab's side, curving forward to the lamps, and
      // the black of the front itself from the lamps to the roof.
      s += path("M-1 13.5L9.6 13.5L9.6 9.4Q9.2 6.1 1.2 5.35L-1 5.35Z", SFE.blue) +
        path("M-1 13.5L7.0 13.5L7.0 12.75L5.2 12.75L2.5 7.9L2.2 5.35L-1 5.35Z", SFE.black);
    } else s += rect(3.4, BAND[0], L - 6.8, BAND[1], SFE.black, 0, 'rx="0.3"');
    return s;
  };
}
const sfeDoor = (x) => ({ x, w: 4.4, y0: SFEG.sill, y1: 11.45, leaves: 2, glassY: 0.44, glassH: 0.4, grabs: false, fill: SFE.blue });
const sfeWin = (xs) => ({ xs, y: 7.25, w: 4.6, h: 3.05, r: 0.35 });
const sfeCab = (c) => unit(c, { roof: SFEG.roof, sill: SFEG.sill, nose: NOSE_SFE, rake: [[1.2, 7.9], [3.5, 12.2]], depth: 2.3, cabLen: 13, lampY: 5.95, bare: true,
  // Two windows, a door, five windows, a door, two windows.
  rows: [sfeWin([15.6, 20.9, ...seq(31.6, 5.6, 5), 65.0, 70.5])], doors: [sfeDoor(26.0), sfeDoor(59.6)],
  trucks: [10.5, c.L - 9.5], wheel: 33, paint: sfePaint(true), surround: SFE.black,
  // The white cab door with its narrow window.
  cab: () => rect(9.9, 4.0, 2.3, 7.5, SFE.white, 0.45, 'rx="0.3"') + win(10.5, 7.6, 1.1, 2.9, 0.15),
  extra: (cc, g) => letters(cc, 20.5, 11.1, 0.4, "SFE404", SFE.ink, { weight: 600 }) +
    letters(cc, 22.6, 4.9, 0.7, "efe", SFE.blue, { weight: 800 }) +
    hvac(34, SFEG.roof, 14, 0.45) + boxes(20, g.L - 18, SFEG.sill, 3, 1.2) });
const sfeMid = (c) => unit(c, { roof: SFEG.roof, sill: SFEG.sill,
  // A judgement: the leading car's layout carried through (see the header).
  rows: [sfeWin([5.0, 10.5, ...seq(21.4, 5.45, 7), 65.0, 70.5])], doors: [sfeDoor(16.0), sfeDoor(59.6)],
  trucks: [9.5, c.L - 9.5], wheel: 33, paint: sfePaint(false),
  extra: (cc, g) => redPan(13, SFEG.roof) + hvac(34, SFEG.roof, 14, 0.45) + boxes(18, g.L - 18, SFEG.sill, 3, 1.2) });

// ---------- Tables ----------

export const TYPES = {
  efeXtrapolis: { name: "X'Trapolis Modular car", kind: "emu" },
  efeSfe400Cab: { name: "SFE-400 end car", kind: "emu" },
  efeSfe400Mid: { name: "SFE-400 intermediate car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers: the X'Trapolis 23 m a car (the unit's 46,00 m is
// painted on XM-15); the SFE-400 24.5 m a car, a judgement.
export const MODELS = {
  efeXtrapolis: M(xmCab, 75.5, true, byIndex),
  efeSfe400Cab: M(sfeCab, 80.4, true),
  efeSfe400Mid: M(sfeMid, 80.4, false, byIndex),
};

const set = (label, ...units) => ({ label, units });
const XM_SET = set("Typical: a two-car Alstom X'Trapolis Modular unit (a judgement: the timetable names no stock; EFE lists this fleet, XM-01 to XM-22, on the Nos service, and it is photographed on it)",
  ["efeXtrapolis", 2]);
const SFE_SET = set("Typical: a three-car CRRC-Sifang SFE-400 unit (a judgement: the timetable names no stock; EFE lists this fleet, SFE-401 to SFE-409, on the Rancagua service, and it is photographed on it)",
  ["efeSfe400Cab", 1], ["efeSfe400Mid", 1], ["efeSfe400Cab", 1]);

// The timetable (DTPM's GTFS) names no rolling stock and its trains have no
// numbers: a run's key is only its direction and first departure, and the
// same key can hold a Nos run and a Rancagua run ("0-1500" does). So a
// train is placed by its LINE alone, never by its key: "Tren Rancagua -
// Estación Central" is the SFE-400, "Tren Nos - Estación Central" (and
// anything not placed, Nos being 361 of the 416 runs) the X'Trapolis.
// TYPICAL never returns null.
export const TYPICAL = {
  efe: (t = {}) => (/rancagua/i.test(String(t.route || t.line || "")) ? SFE_SET : XM_SET),
};

// Sources: a photograph each drawing was checked against (Wikimedia
// Commons). Builders and fleet sizes are EFE's own published ones.
const CM = "https://commons.wikimedia.org/wiki/File:";
const fXM = { model: "Alstom X'Trapolis Modular", type: "Electric multiple unit", builder: "Alstom", built: "2013–2022", fleet: "22 two-car sets (XM-01 to XM-22)", lengthFt: 75.5,
  source: `${CM}J27_895_XM-15,_F%C3%BChrerstandsseite.jpg` };
const fSFE = { model: "CRRC-Sifang SFE-400", type: "Electric multiple unit", builder: "CRRC Sifang", built: "2021–2024", fleet: "9 three-car sets (SFE-401 to SFE-409)", topSpeedMph: 87, lengthFt: 80.4,
  source: `${CM}Serie_SFE_por_servicio_Rancagua.jpg` };
export const FACTS = {
  efeXtrapolis: { ...fXM,
    about: "A car of an Alstom X'Trapolis Modular, the two-car electric unit of Tren Nos: white, the black windshield of its long raked nose set in a blue surround that runs from the roof down to the nose, a dark grey lower nose and skirt, a blue waist stripe and three blue double doors a side. The two cars share a truck under the gangway; one of them carries both red pantographs. The unit drawn is XM-15, photographed at Estación Central in 2017 in TrenCentral lettering; its 46 m length is painted on its side. Drawing it on every Nos train is a judgement: the timetable names no stock." },
  efeSfe400Cab: { ...fSFE,
    about: "An end car of a CRRC-Sifang SFE-400, the three-car electric unit of Tren Rancagua: an upright black front, a white body under a blue roof whose blue comes down the cab's side and curves forward to the lamps, the windows in a black band, blue double doors and a thin blue waist stripe. The unit drawn is SFE404, photographed at Estación Central in 2022 and on the open line in 2024; the leading car's two windows, door, five windows, door and two windows are counted from a photograph at San Francisco de Mostazal. Drawing it on every Rancagua train is a judgement: the timetable names no stock; the 24.5 m car length is a judgement too." },
  efeSfe400Mid: { ...fSFE,
    about: "The intermediate car of a CRRC-Sifang SFE-400, in the same white with the blue roof, black window band, blue doors and thin blue waist stripe. No photograph shows it clearly enough to count, so its doors and windows follow the end car's, a judgement; that it carries the red pantograph is a reading of the open-line photograph, where the pantograph stands just behind the first gangway." },
};
