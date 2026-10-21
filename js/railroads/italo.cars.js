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
// Italo since 2012, from photographs (Wikimedia Commons, 2025-2026): amaranth
// red all over, the roof too; a charcoal skirt; a fine gold line along the
// side under the windows, an Italian flag on it by each door and ".italo"
// small in gold where it breaks mid-car; the AGV's windows set in a gray
// band, the EVO's in a black one. On the cab end ".italo" big
// in gold; over the windows each car's class (ambiente) in gold, "Club",
// "Prima Business" or "Smart", in Italo's tall, narrow lettering; on the
// AGV, beside each door, the car's number in gold in the window band with
// its class small under it.
const IT = { red: "#8a1c2b", deep: "#6a1422", wine: "#a32638", skirt: "#2b2c30", roof: "#7c1827", band: "#1d1e22", silver: "#c9cdd2", gold: "#c9a24a",
  letter: "#c8ad6a", panes: "#8d8e94", white: "#f6f4f2" };
// Italo's lettering: narrow, upright, mixed case.
const ITALO_FONT = "'Avenir Next Condensed', 'Roboto Condensed', 'Arial Narrow', 'Helvetica Neue', sans-serif";

// Italo's name, lowercase and heavy, h ft tall, reading left to right on a
// mirrored car too.
const italoName = (c, x, y, h, fill = IT.letter) => letters(c, x, y, h, ".italo", fill, { weight: 500, spacing: "-0.01em", family: ITALO_FONT });
// The fine gold line along the side.
const pinline = (L, y) => rect(-1, y, L + 2, 0.16, IT.gold);
// Its Italian flag, by a door, and ".italo" small where the line breaks.
const flag = (x, y) => rect(x, y - 0.2, 0.22, 0.56, "#2e8b4a") + rect(x + 0.22, y - 0.2, 0.22, 0.56, "#f4f4f2") + rect(x + 0.44, y - 0.2, 0.22, 0.56, "#d0303a");
const lineName = (c, x, y) => rect(x - 1.7, y - 0.05, 3.4, 0.3, IT.red) + italoName(c, x, y + 0.12, 0.85);

// A plug door, single leaf, flush with the side.
const plugDoor = (x, sill, top, w = 2.6, fill = IT.deep) => ({ x, w, y0: sill, y1: top, leaves: 1, glassY: 0.55, glassH: 0.3, grabs: false, fill });

// ---------- Classes ----------
// Over the windows each car carries its class's name in gold, as Italo
// letters it: "Club" (Club Executive), "Prima Business" (Prima, "Business"
// small) or "Smart". c.cls: "club", "prima" or "smart"; car 1 of an EVO
// holds Club and Prima.
const AMBIENTE = { club: "Club", prima: "Prima<tspan font-size=\"0.55em\" dx=\"0.25em\">Business</tspan>", smart: "Smart" };
const ambiente = (c, cls, x, y, h = 1.55) => (AMBIENTE[cls] ? letters(c, x, y, h, AMBIENTE[cls], IT.letter, { weight: 600, family: ITALO_FONT }) : "");
// The AGV's door-side plate in the window band: the car's number in gold,
// its class small under it (x: the slot's left edge).
const SMALL = { club: "Club", prima: "Prima", smart: "Smart" };
const carPlate = (c, x, k, cls) => letters(c, x + 0.45, 7.55, 1.9, String(k), IT.letter, { weight: 500, family: ITALO_FONT }) +
  letters(c, x + 0.45, 6.15, 0.36, SMALL[cls] || "", IT.letter, { weight: 500, family: ITALO_FONT });
// The door's window framed in gold.
const doorFrame = (x, w, y0, h) => rect(x + w * 0.22 - 0.08, y0 + h * 0.55 - 0.08, w * 0.56 + 0.16, h * 0.3 + 0.16, "none", 0, `stroke="${IT.gold}" stroke-width="0.9" vector-effect="non-scaling-stroke"`);


// ---------- AGV 575 ----------
// Alstom's AGV (Automotrice à Grande Vitesse): eleven articulated cars on
// twelve trucks, 200 m; the traction spread along the train under the
// floor, not in power cars. The end cars are about 22 m with a long, low nose;
// the intermediates 17.3 m, sharing a Jakobs truck at each joint. 3.45 m
// tall over the rail; 920 mm wheels; one plug door a side near one end of
// each car; big windows, five or six a car.
const AGV = { roof: 11.45, sill: 3.3 };
const NOSE_AGV = [[0.9, 2.5], [0.55, 3.6], ["q", 0.6, 5.2, 2.6, 6.6], [10.4, 9.9], ["q", 15.0, 11.45, 19.5, 11.45]];
function agvPaint(cab) {
  return (c, g) => {
    let s = bands(g.L, [[0, 20, IT.red], [11.0, 3, IT.roof], [0, 3.3, IT.skirt]]) + pinline(g.L, 4.55);
    // The nose: the red darkens toward the tip; a black mask round the
    // windshield sweeps back along the cab.
    if (cab) s += path("M-1 2.5L-1 6.9Q4 7.4 8.2 8.25L13.4 9.4L22.0 9.4L22.0 9.75L13.3 9.75Q8.0 8.7 3.6 7.9Q1.2 7.6 -1 7.6Z", IT.deep) +
      path("M6.6 8.0Q9.8 8.6 13.6 9.6L20.8 9.6Q21.6 10.4 21.0 11.0L15.2 11.0Q10.6 10.1 6.6 8.0Z", IT.band);
    return s;
  };
}
// The windows: big panes with well-rounded corners, five on an end car and
// six on an intermediate one (as photographed), spread evenly between a
// and b in their gray band.
function agvRows(a, b, w = 5.0, pitch = 7.2) {
  const k = Math.floor((b - a - w) / pitch) + 1, x0 = a + (b - a - ((k - 1) * pitch + w)) / 2;
  return [{ xs: seq(x0, pitch, k), y: 5.6, w, h: 2.9, r: 0.65 }];
}
// The gray band the windows are set in.
const panes = (x0, x1) => rect(x0, 5.35, x1 - x0, 3.35, IT.panes, 0, 'rx="0.5"');
// Roof: a low fairing along the whole car, the pantograph on its well, the
// converters' covers; the transformer and traction gear under the floor
// between the trucks, behind a skirt.
const agvRoof = (L, a, b) => rect(a, AGV.roof - 0.05, b - a, 0.32, "#b9bec4", 0.4, 'rx="0.16"');
const agvSkirt = (a, b) => rect(a, 1.55, b - a, 1.8, IT.skirt, 0.4, 'rx="0.2"') + lines(seq(a + 2.5, 3.0, Math.max(0, Math.floor((b - a - 3) / 3.0))).map((x) => [x, 1.75, x, 3.15]), "rgba(255,255,255,0.12)", 0.4);
function agvCab(c) {
  const L = c.L;
  return unit(c, { roof: AGV.roof, sill: AGV.sill, nose: NOSE_AGV, rake: [[8.6, 8.9], [14.8, 11.0]], depth: 3.4, cabLen: 19, lampY: 4.0, low: 3.6,
    rows: agvRows(24.4, L - 9.2), doors: [plugDoor(L - 6.2, 3.3, 9.6)], trucks: [7.5, "end"], wheel: 36, diaphragm: [3.6, 10.4],
    paint: (cc, g) => agvPaint(true)(cc, g) + panes(23.6, g.L - 6.6) + flag(g.L - 8.2, 4.63) + lineName(cc, 40, 4.63), surround: IT.band,
    extra: (cc, g) => agvRoof(g.L, 19.5, g.L - 0.8) + hvac(26, AGV.roof + 0.25, 12, 0.55) + agvSkirt(11.6, g.L - 5.6) + boxes(13, g.L - 7, 3.3, 3, 1.4) +
      // A slanted cab side window and the cab door's outline.
      path(poly([[16.2, 7.4], [19.6, 7.4], [19.6, 9.4], [17.0, 9.4]]), "#1d2026", 0.4) + rect(20.3, 3.6, 2.2, 6.1, "rgba(0,0,0,0.08)", 0.5) +
      // The cab's ".italo", big in gold, behind the windshield.
      italoName(cc, 14.0, 6.6, 2.6) + letters(cc, 25, 4.0, 0.36, "AGV 575", IT.white, { weight: 600, spacing: "0.06em" }) +
      carPlate(cc, g.L - 7.75, cc.index + 1, cc.cls) + doorFrame(g.L - 6.2, 2.6, 3.3, 6.3) + ambiente(cc, cc.cls, 40, 10.45, 2.0) });
}
function agvMid(c) {
  const L = c.L, k = c.index;
  // The pantographs ride on cars 3 and 9.
  const pan = k === 2 || k === 8;
  return unit(c, { roof: AGV.roof, sill: AGV.sill,
    rows: agvRows(5.0, L - 8.8), doors: [plugDoor(L - 5.6, 3.3, 9.6)], trucks: ["start", "end"], wheel: 36, diaphragm: [3.6, 10.4],
    paint: (cc, g) => agvPaint(false)(cc, g) + panes(4.3, g.L - 6.0) + flag(g.L - 7.6, 4.63) + lineName(cc, g.L * 0.45, 4.63),
    extra: (cc, g) => agvRoof(g.L, 0.6, g.L - 0.6) + (pan ? pantograph(g.L * 0.42, AGV.roof + 0.25, { up: true, facing: -1 }) + hvLine(g.L * 0.42 + 3.0, g.L * 0.42 + 9.5, AGV.roof + 0.25)
      : hvac(8, AGV.roof + 0.25, 11, 0.55) + hvac(g.L - 21, AGV.roof + 0.25, 9, 0.55)) +
      agvSkirt(5.4, g.L - 5.4) + boxes(6, g.L - 6, 3.3, 3, 1.4) +
      carPlate(cc, g.L - 7.15, k + 1, cc.cls) + doorFrame(g.L - 5.6, 2.6, 3.3, 6.3) + ambiente(cc, cc.cls, g.L * 0.5, 10.45, 2.0) });
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
    let s = bands(g.L, [[0, 20, IT.red], [12.6, 3, IT.roof], [6.55, 3.65, IT.band], [0, 3.75, IT.skirt]]) + pinline(g.L, 5.55);
    if (cab) s += path("M2.4 7.6Q7.0 9.0 10.4 10.4L13.0 11.6L20.0 11.6L20.0 10.2L22.0 10.2L22.0 6.55L13.2 6.55Q8.8 6.6 5.4 6.2Z", IT.band) +
      path("M-1 3.2L-1 5.3Q3.6 5.6 8.6 5.9L14.0 5.9L14.0 6.25L8.4 6.25Q3.6 6.0 -1 5.8Z", IT.deep);
    return s;
  };
}
// The EVO's windows nearly fill the black band's height, closely spaced.
const evoRows = (a, b) => [{ xs: seq(a, 5.4, Math.floor((b - a - 4.2) / 5.4) + 1), y: 6.8, w: 4.2, h: 3.1, r: 0.55 }];
const evoRoof = (L, a, b) => rect(a, EVO.roof - 0.05, b - a, 0.38, "#b9bec4", 0.4, 'rx="0.19"');
function evoCab(c) {
  const L = c.L;
  return unit(c, { roof: EVO.roof, sill: EVO.sill, nose: NOSE_EVO, rake: [[9.0, 10.6], [14.0, 12.6]], depth: 3.2, cabLen: 20, lampY: 4.6, low: 4.0,
    rows: evoRows(27.0, L - 7.0), doors: [plugDoor(22.4, 3.75, 10.9, 2.7, IT.band), plugDoor(L - 4.6, 3.75, 10.9, 2.7, IT.band)], trucks: [12.0, L - 9.0], wheel: 36,
    diaphragm: [4.0, 11.6], paint: evoPaint(true), surround: IT.band,
    extra: (cc, g) => evoRoof(g.L, 15.6, g.L - 1.2) + hvac(29, EVO.roof + 0.3, 13, 0.6) + hvac(g.L - 24, EVO.roof + 0.3, 9, 0.6) +
      boxes(17, g.L - 15, 3.75, 3, 1.3) + flag(25.6, 5.63) + flag(g.L - 6.0, 5.63) + lineName(cc, 55, 5.63) +
      // The cab's ".italo", big in gold, under the window band.
      italoName(cc, 16.0, 5.15, 2.6) +
      ambiente(cc, cc.cls, 45, 12.05, 1.9) + (cc.cls === "club" ? ambiente(cc, "prima", g.L - 24, 12.05, 1.9) : "") });
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
      boxes(16, g.L - 16, 3.75, 3, 1.3) + flag(4.9, 5.63) + flag(g.L - 5.8, 5.63) + lineName(cc, g.L / 2, 5.63) + ambiente(cc, cc.cls, g.L / 2, 12.05, 1.9) });
}

// ---------- Tables ----------

// Italo's classes, front to back (car 1 at the front): Club Executive (19
// seats, eight of them in two private four-seat lounges), Prima (its first
// class, 2+1) and Smart (2+2). AGV: Club in car 1, Prima in cars 2-5 (4
// and 5 were Comfort, since merged into Prima), Smart in cars 6-11. EVO:
// Club and the first Prima seats in car 1, Prima through car 3, Smart in
// cars 4-7. Each car's class is lettered over its windows (above), and
// first class carries Trainsheet's gold band. Each class is its own type,
// placed in the formation, with its own fact sheet.
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
