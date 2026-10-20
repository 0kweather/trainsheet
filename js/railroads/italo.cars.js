// Italo's cars (scripts/railroads/italo.py): Nuovo Trasporto Viaggiatori's
// high-speed trains, the Alstom AGV 575 and the Pendolino EVO (ETR 675).
// The timetable names no unit, so a train is drawn as the model that
// usually runs it, labeled as typical. Trainsheet's own side views from
// published dimensions and photographs, at the shared scale (js/carart.js),
// in Italo's red, lettered here (no logo files). Bodies and parts from
// czechia.cars.js.

import { C, rect, path, line, lines, poly, truck, slats, underframe } from "../carart.js?v=dev";
import { unit, letters, mark, hvac, hvLine } from "./czechia.cars.js?v=dev";
import { pantograph } from "../carart.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 3, depth = 1.3) => underframe(a, b, top, { depth, boxes: k, tanks: false });
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";

// ---------- Paint ----------
// Italo since 2012: amaranth red all over, a gold band low along the side
// (since January 2026 rising from the lower nose toward the windows and
// broken at the doors), a charcoal skirt, the roof gray; the windows in a
// dark band on the EVO. The name in white lowercase after a dot.
const IT = { red: "#8a1c2b", deep: "#6a1422", wine: "#a32638", skirt: "#2b2c30", roof: "#9da3aa", band: "#1d1e22", silver: "#c9cdd2", gold: "#c9a24a", white: "#f6f4f2" };

// Italo's name, lowercase and heavy, h ft tall, reading left to right on a
// mirrored car too.
const italoName = (c, x, y, h, fill = IT.white) => letters(c, x, y, h, ".italo", fill, { weight: 800, spacing: "-0.02em", family: SANS });
// The gold band along the bottom of the red, under a fine gold line.
const pinline = (L, y) => rect(-1, y, L + 2, 0.42, IT.gold) + rect(-1, y + 0.62, L + 2, 0.08, IT.gold);

// A plug door, single leaf, flush with the side.
const plugDoor = (x, sill, top, w = 2.6, fill = IT.deep) => ({ x, w, y0: sill, y1: top, leaves: 1, glassY: 0.55, glassH: 0.3, grabs: false, fill });

// ---------- Classes ----------
// Trainsheet's own class marking, as on Italy's other railroads' cars: a
// gold band the length of a first-class car (Club Executive, Prima) just
// over its windows, under the roofline; on each door the class numeral, big
// (1, or a smaller 2 for Smart), and the class's name lettered beside it.
// c.cls: "club", "prima" or "smart"; car 1 of an EVO is Club and Prima.
const CLASS_GOLD = "#c9a227";
const premium = (c) => c.cls === "club" || c.cls === "prima";
const classBand = (c, L, y) => (premium(c) ? rect(-1, y, L + 2, 0.55, CLASS_GOLD) : "");
const CLASSES = { club: ["1", "CLUB EXECUTIVE"], prima: ["1", "PRIMA"], smart: ["2", "SMART"] };
// The numeral on the door (x, w), centered at numY; the name at nameY
// beside it, on the door's side `side` (1 toward the car's right end in its
// own drawing, -1 its left), reading left to right on a mirrored car too.
function classMark(c, cls, x, w, { numY, nameY, side }) {
  const [num, name] = CLASSES[cls] || [];
  if (!num) return "";
  const anchor = (side > 0) !== !!c.mirrored ? "start" : "end";
  return letters(c, x + w / 2, numY, num === "1" ? 3.0 : 2.2, num, IT.white, { weight: 800 }) +
    letters(c, side > 0 ? x + w + 0.6 : x - 0.6, nameY, 1.65, name, IT.white, { weight: 700, anchor, spacing: "0.02em" });
}

// ---------- AGV 575 ----------
// Alstom's AGV (Automotrice à Grande Vitesse): eleven articulated cars on
// twelve trucks, 200 m; the traction spread along the train under the
// floor, not in power cars. The end cars are about 22 m with a long, low nose;
// the intermediates 17.3 m, sharing a Jakobs truck at each joint. 3.45 m
// tall over the rail; 920 mm wheels; one plug door a side near one end of
// each car; small square windows.
const AGV = { roof: 11.45, sill: 3.3 };
const NOSE_AGV = [[0.9, 2.5], [0.55, 3.6], ["q", 0.6, 5.2, 2.6, 6.6], [10.4, 9.9], ["q", 15.0, 11.45, 19.5, 11.45]];
function agvPaint(cab) {
  return (c, g) => {
    let s = bands(g.L, [[0, 20, IT.red], [10.55, 3, IT.roof], [10.35, 0.2, IT.deep], [0, 3.3, IT.skirt]]) + pinline(g.L, 3.55) + classBand(c, g.L, 9.35);
    // The nose: the red darkens toward the tip; a black mask round the
    // windshield sweeps back along the cab.
    // The 2026 gold band sweeping up from the lower nose toward the windows.
    if (cab) s += path("M-1 3.55L-1 4.6Q6.0 4.8 11.0 5.6Q15.0 6.0 19.0 5.9L19.0 4.95Q14.0 5.0 10.0 4.4Q5.0 3.6 -1 3.55Z", IT.gold) +
      path("M-1 2.5L-1 6.9Q4 7.4 8.2 8.25L13.4 9.4L22.0 9.4L22.0 9.75L13.3 9.75Q8.0 8.7 3.6 7.9Q1.2 7.6 -1 7.6Z", IT.deep) +
      path("M6.6 8.0Q9.8 8.6 13.6 9.6L20.8 9.6Q21.6 10.4 21.0 11.0L15.2 11.0Q10.6 10.1 6.6 8.0Z", IT.band);
    return s;
  };
}
// The windows: AGV's are small and square, one per seat bay.
const agvRows = (a, b) => [{ xs: seq(a, 3.55, Math.floor((b - a) / 3.55) + 1), y: 6.15, w: 2.75, h: 2.65, r: 0.35 }];
// Roof: a low fairing along the whole car, the pantograph on its well, the
// converters' covers; the transformer and traction gear under the floor
// between the trucks, behind a skirt.
const agvRoof = (L, a, b) => rect(a, AGV.roof - 0.05, b - a, 0.32, "#b9bec4", 0.4, 'rx="0.16"');
const agvSkirt = (a, b) => rect(a, 1.55, b - a, 1.8, IT.skirt, 0.4, 'rx="0.2"') + lines(seq(a + 2.5, 3.0, Math.max(0, Math.floor((b - a - 3) / 3.0))).map((x) => [x, 1.75, x, 3.15]), "rgba(255,255,255,0.12)", 0.4);
function agvCab(c) {
  const L = c.L;
  return unit(c, { roof: AGV.roof, sill: AGV.sill, nose: NOSE_AGV, rake: [[8.6, 8.9], [14.8, 11.0]], depth: 3.4, cabLen: 19, lampY: 4.0, low: 3.6,
    rows: agvRows(24.4, L - 9.5), doors: [plugDoor(L - 6.2, 3.3, 9.6)], trucks: [7.5, "end"], wheel: 36, diaphragm: [3.6, 10.4],
    paint: agvPaint(true), surround: IT.band,
    extra: (cc, g) => agvRoof(g.L, 19.5, g.L - 0.8) + hvac(26, AGV.roof + 0.25, 12, 0.55) + agvSkirt(11.6, g.L - 5.6) + boxes(13, g.L - 7, 3.3, 3, 1.4) +
      // A slanted cab side window and the cab door's outline.
      path(poly([[16.2, 7.4], [19.6, 7.4], [19.6, 9.4], [17.0, 9.4]]), "#1d2026", 0.4) + rect(20.3, 3.6, 2.2, 6.1, "rgba(0,0,0,0.08)", 0.5) +
      italoName(cc, 40, 4.9, 1.0) + letters(cc, 25, 4.75, 0.42, "AGV 575", IT.white, { weight: 600, spacing: "0.06em" }) +
      classMark(cc, cc.cls, g.L - 6.2, 2.6, { numY: 5.3, nameY: 5.15, side: -1 }) });
}
function agvMid(c) {
  const L = c.L, k = c.index;
  // The pantographs ride on cars 3 and 9.
  const pan = k === 2 || k === 8;
  return unit(c, { roof: AGV.roof, sill: AGV.sill,
    rows: agvRows(5.0, L - 8.0), doors: [plugDoor(L - 5.6, 3.3, 9.6)], trucks: ["start", "end"], wheel: 36, diaphragm: [3.6, 10.4],
    paint: agvPaint(false),
    extra: (cc, g) => agvRoof(g.L, 0.6, g.L - 0.6) + (pan ? pantograph(g.L * 0.42, AGV.roof + 0.25, { up: true, facing: -1 }) + hvLine(g.L * 0.42 + 3.0, g.L * 0.42 + 9.5, AGV.roof + 0.25)
      : hvac(8, AGV.roof + 0.25, 11, 0.55) + hvac(g.L - 21, AGV.roof + 0.25, 9, 0.55)) +
      agvSkirt(5.4, g.L - 5.4) + boxes(6, g.L - 6, 3.3, 3, 1.4) +
      (k === 5 ? italoName(cc, 16, 4.9, 1.0) : "") + classMark(cc, cc.cls, g.L - 5.6, 2.6, { numY: 5.3, nameY: 5.15, side: -1 }) });
}

// ---------- Pendolino EVO (ETR 675) ----------
// Alstom's non-tilting Pendolino for Italo, built at Savigliano: seven cars
// on their own two trucks each, 187.3 m; end cars of 28.2 m with a long
// tapered nose, the intermediates 25.9 m. 4.1 m tall; one plug door a side
// near each end of the cars. The windows in a black band; red above and
// below it, a charcoal skirt; the nose's red runs into a black mask round
// the windshield.
const EVO = { roof: 13.0, sill: 3.75 };
const NOSE_EVO = [[1.0, 3.2], [0.7, 4.9], ["q", 0.8, 6.6, 3.0, 7.9], [10.4, 11.6], ["q", 12.6, 13.0, 15.6, 13.0]];
function evoPaint(cab) {
  return (c, g) => {
    let s = bands(g.L, [[0, 20, IT.red], [11.95, 3, IT.roof], [11.75, 0.2, IT.deep], [6.55, 3.65, IT.band], [0, 3.75, IT.skirt]]) + pinline(g.L, 4.0) + classBand(c, g.L, 10.75);
    if (cab) s += path("M2.4 7.6Q7.0 9.0 10.4 10.4L13.0 11.6L20.0 11.6L20.0 10.2L22.0 10.2L22.0 6.55L13.2 6.55Q8.8 6.6 5.4 6.2Z", IT.band) +
      path("M-1 3.2L-1 5.3Q3.6 5.6 8.6 5.9L14.0 5.9L14.0 6.25L8.4 6.25Q3.6 6.0 -1 5.8Z", IT.wine);
    return s;
  };
}
const evoRows = (a, b) => [{ xs: seq(a, 5.1, Math.floor((b - a - 4.3) / 5.1) + 1), y: 7.0, w: 4.3, h: 2.75, r: 0.4 }];
const evoRoof = (L, a, b) => rect(a, EVO.roof - 0.05, b - a, 0.38, "#b9bec4", 0.4, 'rx="0.19"');
function evoCab(c) {
  const L = c.L;
  return unit(c, { roof: EVO.roof, sill: EVO.sill, nose: NOSE_EVO, rake: [[9.0, 10.6], [14.0, 12.6]], depth: 3.2, cabLen: 20, lampY: 4.6, low: 4.0,
    rows: evoRows(27.0, L - 7.0), doors: [plugDoor(22.4, 3.75, 10.9, 2.7, IT.band), plugDoor(L - 4.6, 3.75, 10.9, 2.7, IT.band)], trucks: [12.0, L - 9.0], wheel: 36,
    diaphragm: [4.0, 11.6], paint: evoPaint(true), surround: IT.band,
    extra: (cc, g) => evoRoof(g.L, 15.6, g.L - 1.2) + hvac(29, EVO.roof + 0.3, 13, 0.6) + hvac(g.L - 24, EVO.roof + 0.3, 9, 0.6) +
      boxes(17, g.L - 15, 3.75, 3, 1.3) + rect(15.5, 4.0, 18, 0.5, IT.wine) +
      italoName(cc, 52, 5.25, 1.35) + letters(cc, 66, 5.15, 0.85, "EVO", IT.silver, { weight: 300, spacing: "0.3em" }) +
      classMark(cc, cc.cls, 22.4, 2.7, { numY: 5.6, nameY: 5.6, side: 1 }) + classMark(cc, cc.cls === "club" ? "prima" : cc.cls, g.L - 4.6, 2.7, { numY: 5.6, nameY: 5.6, side: -1 }) });
}
function evoMid(c) {
  const L = c.L, k = c.index;
  // Pantographs on cars 2 and 6 (25 kV and 3 kV).
  const pan = k === 1 || k === 5;
  return unit(c, { roof: EVO.roof, sill: EVO.sill,
    rows: evoRows(7.6, L - 7.6), doors: [plugDoor(1.7, 3.75, 10.9, 2.7, IT.band), plugDoor(L - 4.4, 3.75, 10.9, 2.7, IT.band)], trucks: [9.5, L - 9.5], wheel: 36,
    diaphragm: [4.0, 11.6], paint: evoPaint(false),
    extra: (cc, g) => evoRoof(g.L, 1.2, g.L - 1.2) +
      (pan ? pantograph(g.L * 0.38, EVO.roof + 0.33, { up: k === 1, facing: -1 }) + hvLine(g.L * 0.38 + 3.0, g.L * 0.38 + 10.0, EVO.roof + 0.33) + hvac(g.L - 22, EVO.roof + 0.3, 10, 0.6)
        : hvac(10, EVO.roof + 0.3, 12, 0.6) + hvac(g.L - 22, EVO.roof + 0.3, 10, 0.6)) +
      boxes(16, g.L - 16, 3.75, 3, 1.3) +
      classMark(cc, cc.cls, 1.7, 2.7, { numY: 5.6, nameY: 5.6, side: 1 }) + classMark(cc, cc.cls, g.L - 4.4, 2.7, { numY: 5.6, nameY: 5.6, side: -1 }) });
}

// ---------- Tables ----------

// Italo's classes, front to back (car 1 at the front): Club Executive (19
// seats, eight of them in two private four-seat lounges), Prima (its first
// class, 2+1) and Smart (2+2). AGV: Club in car 1, Prima in cars 2-5 (4
// and 5 were Comfort, since merged into Prima), Smart in cars 6-11. EVO:
// Club and the first Prima seats in car 1, Prima through car 3, Smart in
// cars 4-7. Italo letters no class on the outside (the classes' names are
// on the end walls inside); the drawings carry Trainsheet's class marking
// (above), so each class shows. Each is its own type, placed in the
// formation, with its own fact sheet.
export const TYPES = {
  itAgvClub: { name: "AGV 575 Club Executive car", kind: "emu", amenities: ["business"] },
  itAgvPrima: { name: "AGV 575 Prima car", kind: "emu", pan: true, amenities: ["first"] },
  itAgvMid: { name: "AGV 575 Smart car", kind: "emu", pan: true },
  itAgvCab: { name: "AGV 575 Smart end car", kind: "emu" },
  itEvoClub: { name: "Pendolino EVO Club Executive and Prima car", kind: "emu", amenities: ["business", "first"] },
  itEvoPrima: { name: "Pendolino EVO Prima car", kind: "emu", pan: true, amenities: ["first"] },
  itEvoMid: { name: "Pendolino EVO Smart car", kind: "emu", pan: true },
  itEvoCab: { name: "Pendolino EVO Smart end car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
export const MODELS = {
  itAgvClub: M((c) => agvCab({ ...c, cls: "club" }), 72.5, true),
  itAgvPrima: M((c) => agvMid({ ...c, cls: "prima" }), 56.8, false, byIndex),
  itAgvMid: M((c) => agvMid({ ...c, cls: "smart" }), 56.8, false, byIndex),
  itAgvCab: M((c) => agvCab({ ...c, cls: "smart" }), 72.5, true),
  itEvoClub: M((c) => evoCab({ ...c, cls: "club" }), 92.5, true),
  itEvoPrima: M((c) => evoMid({ ...c, cls: "prima" }), 85.0, false, byIndex),
  itEvoMid: M((c) => evoMid({ ...c, cls: "smart" }), 85.0, false, byIndex),
  itEvoCab: M((c) => evoCab({ ...c, cls: "smart" }), 92.5, true),
};

// Units by number (class and serial run together): AGV 575 001-025, ETR
// 675 001-026. Italo's feed names no unit; these are for the fleet pages.
export const FLEETS = {
  italo: [[575001, 575025, "itAgvClub"], [675001, 675026, "itEvoClub"]],
};

const set = (label, ...units) => ({ label, units });
const AGV575 = set("AGV 575: eleven articulated cars; Club Executive in car 1, Prima in cars 2-5, Smart behind",
  ["itAgvClub", 1], ["itAgvPrima", 4], ["itAgvMid", 5], ["itAgvCab", 1]);
const EVO675 = set("Pendolino EVO (ETR 675): seven cars; Club Executive and Prima in car 1, Prima in cars 2-3, Smart behind",
  ["itEvoClub", 1], ["itEvoPrima", 2], ["itEvoMid", 3], ["itEvoCab", 1]);
const BY_MODEL = { itAgvClub: AGV575, itAgvPrima: AGV575, itAgvMid: AGV575, itAgvCab: AGV575, itEvoClub: EVO675, itEvoPrima: EVO675, itEvoMid: EVO675, itEvoCab: EVO675 };

// By the reported unit; else by train number. Italo publishes no unit
// rosters: its 25 AGVs (300 km/h) and 26 EVOs (250 km/h) both run the
// Turin/Milan-Rome-Naples trunk, and the EVOs most of the trains off it
// (Venice, Bolzano, Bari, Reggio Calabria). As a rough guide, trains
// numbered 99xx are drawn as AGVs and the rest (8xxx and others) as EVOs;
// the label says "usually" and either may appear.
export const TYPICAL = {
  italo: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    const k = Number(String(t.number || "").replace(/\D/g, ""));
    return k >= 9900 && k <= 9999 ? AGV575 : EVO675;
  },
};

const ITALO = "https://www.italotreno.com/it/il-treno/ambienti-di-viaggio";
const AGV_CARS = "https://ledicoferroviaire.mediarail.be/agv-en/";
const EVO_CARS = "https://www.ferrovie.it/portale/articoli/6704";
const agv = { model: "Alstom AGV 575 (ETR 575)", type: "High-speed electric multiple unit", builder: "Alstom (La Rochelle and Savigliano)", built: "2010–2012",
  fleet: "25 eleven-car units", topSpeedMph: 186, powerHp: 10192, seats: 460 };
const evo = { model: "Alstom Pendolino EVO (ETR 675)", type: "High-speed electric multiple unit", builder: "Alstom (Savigliano)", built: "Since 2015",
  fleet: "26 seven-car units", topSpeedMph: 155, powerHp: 7376, seats: 472 };
export const FACTS = {
  itAgvClub: { ...agv, lengthFt: 656, source: AGV_CARS,
    about: "Car 1 of Italo's AGV is Club Executive: 19 wide leather seats, eight of them in two private four-seat lounges (salotti) at the back of the car. Italo's first trains, in service since April 2012; built for 360 km/h, they run at up to 300." },
  itAgvPrima: { ...agv, source: AGV_CARS,
    about: "Cars 2 to 5 are Prima, Italo's first class, seated 2+1 (cars 4 and 5 were Comfort until it was merged into Prima), with vending machines in car 3. Roughly: Club 19 seats, Prima about 150, Smart about 290." },
  itAgvMid: { ...agv, source: AGV_CARS,
    about: "Cars 6 to 10 are Smart, Italo's standard class, seated 2+2, with vending in car 7. The AGV's cars share a truck at each joint." },
  itAgvCab: { ...agv, source: AGV_CARS,
    about: "Car 11, Smart, at the back of the train; it once held the Smart Cinema area, since removed." },
  itEvoClub: { ...evo, lengthFt: 614.5, source: EVO_CARS,
    about: "Car 1 of the EVO holds Club Executive (19 seats: eight in two private lounges and eleven in an open saloon, 2+1, with a self-service counter) and the first Prima seats. A non-tilting Pendolino, in service since December 2017 at up to 250 km/h." },
  itEvoPrima: { ...evo, source: EVO_CARS,
    about: "Prima, Italo's first class, runs from car 1 to car 3 (130 seats at launch, 2+1), with vending in car 3." },
  itEvoMid: { ...evo, source: EVO_CARS,
    about: "Smart, the standard class, fills cars 4 to 7 (331 seats at launch, 2+2), with vending in car 6." },
  itEvoCab: { ...evo, source: ITALO,
    about: "Car 7, Smart, at the back of the train. Italo's classes today are Club Executive, Prima and Smart." },
};
