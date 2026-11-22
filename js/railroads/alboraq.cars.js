// Al Boraq's cars (scripts/railroads/morocco.py): ONCF's high-speed trains
// between Tangier and Casablanca, the Alstom Avelia Euroduplex (ONCF's
// RGV2N2), a double-deck TGV set: two power cars round eight articulated
// duplex trailers. One fleet, so every train is drawn as it. Trainsheet's
// own side views from published dimensions, at the shared scale
// (js/carart.js), in Al Boraq's paint, lettered here (no logo files).
// Bodies and parts from czechia.cars.js.
//
// The paint is drawn from memory of the fleet, not checked against
// photographs: the white body, the dark window bands and the red and green
// ribbons are sure; the ribbons' exact course along the side, the doors'
// color and where the name sits on each car are Trainsheet's reading.

import { rect, path, lines, slats, pantograph } from "../carart.js?v=dev";
import { unit, letters, hvac, hvLine } from "./czechia.cars.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
// k windows of width w at the given pitch, centered between a and b.
const spread = (a, b, w, pitch) => {
  const k = Math.max(0, Math.floor((b - a - w) / pitch) + 1);
  return seq(a + (b - a - ((k - 1) * pitch + w)) / 2, pitch, k);
};

// ---------- Paint ----------
// Al Boraq since 2018: pearl white all over, a gray roof and a gray skirt;
// each deck's windows in a dark band; a red ribbon and a green one, the
// colors of Morocco's flag, sweeping up from the power car's nose and
// weaving along the train between the decks; the red spreads over the nose
// under the windshield. "Al Boraq" and its Arabic, البراق, in red on the
// power cars and small by the trailers' ends; ONCF's initials by the cab.
const AB = { white: "#f3f3ef", roof: "#b9bdc2", skirt: "#8b9097", band: "#23262b", red: "#d81e2c", deep: "#b0141f", green: "#0a6b3a",
  ink: "#3a3d42", door: "#e3e5e6", grille: "#c9ccd0" };
const AB_FONT = "'Avenir Next', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const AR_FONT = "'Geeza Pro', 'Noto Naskh Arabic', 'Noto Sans Arabic', Tahoma, Arial, sans-serif";
const boraq = (c, x, y, h, fill = AB.red) => letters(c, x, y, h, "Al Boraq", fill, { weight: 700, style: "italic", spacing: "-0.01em", family: AB_FONT });
const boraqAr = (c, x, y, h, fill = AB.red) => letters(c, x, y, h, "البراق", fill, { weight: 700, family: AR_FONT });
const oncf = (c, x, y, h = 0.62) => letters(c, x, y, h, "ONCF", AB.ink, { weight: 800, spacing: "0.06em", family: AB_FONT });

// A ribbon th ft thick along a whole trailer: one slow wave about y, amp ft
// either way, level with its neighbor's at each joint so the two ribbons
// run on from car to car, crossing at the joints and mid-car.
const RIB = { y: 8.22, amp: 0.72 };
function ribbon(L, th, fill, sign) {
  const at = (x) => RIB.y + sign * RIB.amp * Math.sin((2 * Math.PI * x) / L);
  const xs = seq(-1, (L + 2) / 36, 37);
  const top = xs.map((x, i) => `${i ? "L" : "M"}${n(x)} ${n(at(x) + th / 2)}`).join("");
  const bot = xs.slice().reverse().map((x) => `L${n(x)} ${n(at(x) - th / 2)}`).join("");
  return path(top + bot + "Z", fill);
}
const ribbons = (L) => ribbon(L, 0.42, AB.green, -1) + ribbon(L, 0.55, AB.red, 1);

// A plug door, single leaf, on the lower deck beside the truck.
const plugDoor = (x, y0, y1, w = 2.9) => ({ x, w, y0, y1, leaves: 1, glassY: 0.5, glassH: 0.32, grabs: false, fill: AB.door });

// ---------- Power car ----------
// 22.15 m over the couplers, Bo'Bo' on 3.0 m trucks 14.0 m apart, 920 mm
// wheels, about 4.1 m tall: the Duplex family's long sloped nose with a
// deep windshield, a cab door behind it, louvers high along the machine
// room, and no passenger windows. Two pantographs, one for 25 kV (the new
// line, Tangier to Kenitra) and one for 3 kV dc (the old line on to
// Casablanca); a train runs with the rear power car's pantograph up.
const PWR = { roof: 13.5, sill: 3.4 };
const NOSE_PWR = [[1.0, 2.4], [0.6, 3.8], ["q", 0.7, 5.6, 3.0, 6.9], [11.5, 11.3], ["q", 15.5, 13.5, 21.0, 13.5]];
function powerPaint(c, g) {
  const L = g.L;
  return bands(L, [[0, 20, AB.white], [13.0, 3, AB.roof], [0, 3.4, AB.skirt]]) +
    // The green ribbon rises from the skirt behind the nose; the red covers
    // the nose under the windshield and narrows to its ribbon over it.
    path(`M10.5 3.4Q22 3.6 36 6.0Q52 8.6 ${n(L + 1)} 8.43L${n(L + 1)} 8.01Q52 8.0 37 5.3Q26 3.5 18 3.4Z`, AB.green) +
    path(`M-1 2.4L-1 7.3Q5 7.9 10 8.6Q24 10.4 40 9.0Q56 7.9 ${n(L + 1)} 8.5L${n(L + 1)} 7.95Q56 7.3 40 8.3Q25 9.5 15 7.2Q10.5 5.6 10.5 3.4L10.5 2.4Z`, AB.red) +
    path("M-1 2.4L-1 4.6Q4 4.5 7.6 3.4L7.6 2.4Z", AB.deep);
}
function powerCar(c) {
  const L = c.L, up = c.index > 0;
  return unit(c, { roof: PWR.roof, sill: PWR.sill, nose: NOSE_PWR, rake: [[6.4, 8.75], [10.9, 11.05]], depth: 3.0, cabLen: 19, lampY: 4.3, low: 3.6,
    rows: [], doors: [], trucks: [15.2, L - 11.6], wheel: 36, diaphragm: [3.8, 12.2], paint: powerPaint, surround: AB.band,
    extra: (cc, g) =>
      // The cab's side window and door; the machine room's louvers.
      path("M14.6 9.3L18.2 9.3L18.2 11.3L16.4 11.3Z", "#1d2026", 0.4) + rect(19.6, 3.7, 2.3, 8.2, "rgba(0,0,0,0.07)", 0.5) +
      [[27.5, 12.5], [43.5, 12.5], [59.0, 9.5]].map(([x, w]) => rect(x, 10.9, w, 1.7, AB.grille, 0.4, 'rx="0.2"') + slats(x + 0.3, 10.95, w - 0.6, 1.6, 0.45, "rgba(0,0,0,0.3)")).join("") +
      lines([[25.2, 3.6, 25.2, 12.9], [42.0, 3.6, 42.0, 12.9], [57.6, 3.6, 57.6, 12.9]], "rgba(0,0,0,0.12)", 0.4) +
      // Roof: the 3 kV pantograph forward, the 25 kV one aft with its line
      // to the breaker; a blower cover between.
      pantograph(30, PWR.roof, { up: false, facing: -1 }) + hvac(38, PWR.roof, 9, 0.5) +
      pantograph(g.L - 19, PWR.roof, { up, facing: -1 }) + hvLine(g.L - 15.5, g.L - 7, PWR.roof) +
      // The name, and its Arabic, under the ribbons; ONCF by the cab door.
      boraq(cc, 50.5, 5.3, 1.9) + boraqAr(cc, 63.5, 5.4, 1.9) + oncf(cc, 26.2, 6.4) +
      letters(cc, g.L - 5.2, 4.2, 0.36, "RGV2N2", AB.ink, { weight: 600, spacing: "0.06em" }) });
}

// ---------- Duplex trailers ----------
// Eight articulated double-deck trailers, 4.32 m tall and 2.9 m wide,
// sharing a truck at each joint: the six intermediates 18.7 m, the two end
// trailers 21.845 m with a truck of their own under the end next to the
// power car. The floor drops between the trucks to a lower deck about
// 0.3 m over the rail; the upper deck runs the car's length and the
// gangways join the cars upstairs. One plug door a side, on the lower deck
// beside a truck. The bar car (car 4) has its bar upstairs and equipment,
// not seats, below: no windows down there, and a service door only.
// o.cls "1" or "2"; o.bar; o.endCar (the outer end is the left one in the
// train's front half and the right one behind).
const DUP = { roof: 14.2, sill: 3.3, low: 1.3 };
function duplex(c, o = {}) {
  const L = c.L, k = c.index, front = k <= 4;
  const outL = !!o.endCar && front, outR = !!o.endCar && !front;
  const a = outL ? 18.5 : 8.5, b = outR ? L - 18.5 : L - 8.5;
  // The door is at the end away from the bar car.
  const doorX = front ? a + 0.7 : b - 3.6;
  const lowA = front ? a + 4.6 : a + 1.3, lowB = front ? b - 1.3 : b - 4.6;
  const upA = outL ? 8.0 : 4.6, upB = outR ? L - 8.0 : L - 4.6;
  const rows = o.bar
    ? [{ xs: spread(upA, L * 0.36, 5.2, 6.3), y: 9.95, w: 5.2, h: 2.25, r: 0.5 }, { xs: spread(L * 0.62, upB, 5.2, 6.3), y: 9.95, w: 5.2, h: 2.25, r: 0.5 }]
    : [{ xs: spread(upA, upB, 5.2, 6.3), y: 9.95, w: 5.2, h: 2.25, r: 0.5 }, { xs: spread(lowA, lowB, 5.2, 6.3), y: 4.35, w: 5.2, h: 2.25, r: 0.5 }];
  const endX = front ? 4.4 : L - 4.4, farX = front ? L - 4.3 : 4.3;
  return unit(c, { roof: DUP.roof, sill: DUP.sill, drop: { a, b, y: DUP.low }, rows, wheel: 36, diaphragm: [8.6, 13.0],
    doors: o.bar ? [] : [plugDoor(doorX, 1.9, 8.3)],
    trucks: [outL ? 9.5 : "start", outR ? L - 9.5 : "end"],
    paint: (cc, g) => bands(g.L, [[0, 20, AB.white], [13.75, 3, AB.roof], [9.65, 2.85, AB.band], [0, 2.1, AB.skirt]]) +
      (o.bar ? "" : rect(a + 0.6, 4.05, b - a - 1.2, 2.85, AB.band, 0, 'rx="0.45"')) + ribbons(g.L),
    extra: (cc, g) => rect(1.2, DUP.roof - 0.05, g.L - 2.4, 0.3, "#b0b5ba", 0.4, 'rx="0.15"') + hvac(g.L / 2 - 6, DUP.roof + 0.2, 12, 0.5) +
      (o.bar
        // The bar: its name between its two rows of windows upstairs, the
        // service door and the equipment room's louvers below.
        ? letters(cc, g.L / 2, 11.05, 1.25, "Bar", AB.white, { weight: 700, style: "italic", family: AB_FONT }) +
          rect(a + 1.0, 2.0, 2.6, 5.0, "rgba(0,0,0,0.07)", 0.5) + rect(g.L / 2 - 7, 4.5, 14, 1.6, AB.grille, 0.4, 'rx="0.2"') + slats(g.L / 2 - 6.7, 4.55, 13.4, 1.5, 0.45, "rgba(0,0,0,0.3)") +
          boraq(cc, g.L / 2 + 16, 5.3, 1.1)
        // By the door, over the truck: the class, big, and the car's number;
        // the name small at the far end, or with its Arabic on an end
        // trailer's long outer end.
        : letters(cc, endX + (o.endCar ? (front ? 9.6 : -9.6) : 0), 5.6, 1.7, o.cls, AB.ink, { weight: 700, family: AB_FONT }) +
          letters(cc, endX + (o.endCar ? (front ? 9.6 : -9.6) : 0), 4.25, 0.4, `Voiture ${k}`, AB.ink, { weight: 600, family: AB_FONT }) +
          (o.endCar ? boraq(cc, front ? 5.6 : g.L - 5.6, 6.2, 1.15) + boraqAr(cc, front ? 5.6 : g.L - 5.6, 4.6, 1.15) : "") +
          boraq(cc, farX, 5.6, 0.72)) });
}

// ---------- Tables ----------

// Front to back (car 1 behind the leading power car): first class in cars
// 1 and 2, second in car 3, the bar in car 4, second in cars 5 to 8; 533
// seats. First class carries Trainsheet's gold band; the bar its cafe mark.
export const TYPES = {
  abPower: { name: "Euroduplex power car", kind: "emu", pan: true },
  abEndFirst: { name: "Euroduplex first class end trailer", kind: "bilevel", amenities: ["first"] },
  abFirst: { name: "Euroduplex first class trailer", kind: "bilevel", amenities: ["first"] },
  abSecond: { name: "Euroduplex second class trailer", kind: "bilevel" },
  abBar: { name: "Euroduplex bar car", kind: "bilevel", amenities: ["cafe"] },
  abEndSecond: { name: "Euroduplex second class end trailer", kind: "bilevel" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers (or the joint's center): 22.15 m, 21.845 m and
// 18.7 m; the ten together 200.19 m.
export const MODELS = {
  abPower: M(powerCar, 72.67, true, byIndex),
  abEndFirst: M((c) => duplex(c, { cls: "1", endCar: true }), 71.67, false, byIndex),
  abFirst: M((c) => duplex(c, { cls: "1" }), 61.35, false, byIndex),
  abSecond: M((c) => duplex(c, { cls: "2" }), 61.35, false, byIndex),
  abBar: M((c) => duplex(c, { bar: true }), 61.35, false, byIndex),
  abEndSecond: M((c) => duplex(c, { cls: "2", endCar: true }), 71.67, false, byIndex),
};

const set = (label, ...units) => ({ label, units });
const EURODUPLEX = set("Avelia Euroduplex: two power cars and eight double-deck trailers; first class in cars 1-2, the bar in car 4, second class in the rest",
  ["abPower", 1], ["abEndFirst", 1], ["abFirst", 1], ["abSecond", 1], ["abBar", 1], ["abSecond", 3], ["abEndSecond", 1], ["abPower", 1]);

// Every Al Boraq train is a Euroduplex set; ONCF has no other high-speed
// stock, and its timetable names no unit.
export const TYPICAL = {
  alboraq: () => EURODUPLEX,
};

const ALBORAQ = "https://en.wikipedia.org/wiki/Al_Boraq";
const EURODUPLEX_CARS = "https://fr.wikipedia.org/wiki/Euroduplex";
const tgv = { model: "Alstom Avelia Euroduplex (ONCF RGV2N2)", type: "Double-deck high-speed trainset", builder: "Alstom (Belfort and La Rochelle)", built: "2013–2016",
  fleet: "12 ten-car sets", topSpeedMph: 199, powerHp: 12445, seats: 533 };
export const FACTS = {
  abPower: { ...tgv, lengthFt: 656.8, source: ALBORAQ,
    about: "One of the two power cars of an Al Boraq set, Africa's first high-speed train, in service since November 2018. They draw 25 kV on the new line from Tangier to Kenitra, running at up to 320 km/h, and 3 kV dc on the older line on to Rabat and Casablanca." },
  abEndFirst: { ...tgv, source: EURODUPLEX_CARS,
    about: "Car 1, first class on both decks, seated 2+1. The end trailers are longer than the rest and ride on a truck of their own next to the power car." },
  abFirst: { ...tgv, source: EURODUPLEX_CARS,
    about: "Car 2, first class on both decks, seated 2+1. The trailers share a truck at each joint, and the way through the train is along the upper deck." },
  abSecond: { ...tgv, source: EURODUPLEX_CARS,
    about: "Second class on both decks, seated 2+2; the door opens onto the lower deck, with stairs up beside it. Five of a set's eight trailers are second class." },
  abBar: { ...tgv, source: ALBORAQ,
    about: "Car 4, the bar, on the upper deck in the middle of the train, between first and second class; the deck below holds equipment, not seats." },
  abEndSecond: { ...tgv, source: EURODUPLEX_CARS,
    about: "Car 8, second class, at the back of the train next to the rear power car." },
};
