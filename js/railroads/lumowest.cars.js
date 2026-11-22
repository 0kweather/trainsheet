// Lumo's West Coast cars (scripts/railroads/gb.py, "lumowest"): First Rail
// Stirling's open-access trains between London Euston and Stirling, all of
// them worked by one fleet, Bombardier's Class 222 diesels in six-car sets.
// The timetable names no unit, and there is only the one model to draw.
// Trainsheet's own side views from published dimensions, at the shared
// scale (js/carart.js), in Lumo's blue, lettered here (no logo files). The
// Great Britain toolkit from avanti.cars.js; the Voyager-family body (the
// 222 is the Voyager's non-tilting sister) is redrawn here in Lumo's paint,
// since crosscountry.cars.js does not export it.

import { rect, path, lines, poly } from "../carart.js?v=dev";
import { seq, bands, ft, spread, leaf, fairing, unit, letters, hvac, exhaust } from "./avanti.cars.js?v=dev";

// ---------- Paint ----------
// Lumo's blue as on its East Coast Class 803s (lumo.cars.js), drawn from
// memory and not checked against photographs of the 222s: one bright blue
// all over, the nose and the doors too, with no yellow panel; the windows
// in a near-black band, the windshield in a black mask; a darker blue roof
// and a charcoal skirt; "lumo" in white, lower case and round, large behind
// the cab and smaller under the windows of every car.
const LU = { blue: "#2b6ef5", deep: "#1f56cf", roof: "#1b47a8", band: "#16181d", skirt: "#262a31", door: "#3f7dfa", white: "#f6f7f9" };
const LU_FONT = "'Arial Rounded MT Bold', 'Varela Round', 'Helvetica Neue', Helvetica, Arial, sans-serif";

// Lumo's name, h ft tall, centered on x.
const lumoName = (c, x, y, h, fill = LU.white) => letters(c, x, y, h, "lumo", fill, { weight: 700, spacing: "0.01em", family: LU_FONT });

// ---------- Class 222 ----------
// Bombardier's 125 mph diesel-electric train, built at Bruges in 2003-2005
// for Midland Mainline (the Meridian) and Hull Trains (the Pioneer), and
// East Midlands Railway's until the Class 810 replaced it; Lumo's are
// re-formed as six-car sets, 222 601-605. Steel cars on two trucks each
// (Bombardier B5005, inside-framed, 780 mm wheels), a Cummins QSK19-R of
// 559 kW under every one. Driving cars 23.85 m with a raked, rounded nose;
// intermediate cars 22.82 m; the six-car set 138.98 m; 2.73 m wide; one
// single-leaf plug door a side at each end of a car, the driving car's
// forward one behind the cab. 360 seats to a six-car set. (Wikipedia,
// "British Rail Class 222", infobox; the height, 3.75 m, is the Class 221's,
// the 222's infobox giving none; the body as drawn for the Voyagers in
// crosscountry.cars.js and grandcentral.cars.js.)
const MER = { roof: 12.3, sill: 3.7, cab: ft(23.85), mid: ft(22.82) };
const NOSE_MER = [[0.9, 3.0], [0.6, 4.7], ["q", 0.7, 6.2, 2.4, 7.3], [8.0, 11.2], ["q", 9.4, 12.3, 12.2, 12.3]];
// The side: blue, the roof, the skirt; on a cab end the blue runs down over
// the nose, a shade deeper low on the fairing.
const merPaint = (cab) => (c, g) => bands(g.L, [[0, 20, LU.blue], [MER.roof - 0.65, 3, LU.roof], [0, MER.sill, LU.skirt]]) +
  (cab ? path(`M-1 3.0L-1 13L18 13L18 ${MER.sill}Z`, LU.blue) + path("M-1 3.0L-1 4.5L10.5 4.5L12.5 3.7L12.5 3.0Z", LU.deep) : "");
// The windows: long panes close together, ten or so a car, in a gloss-black band.
const merRows = (a, b) => [{ xs: spread(a, b, 4.5, 5.6), y: 6.95, w: 4.5, h: 2.75, r: 0.4 }];
const merGlass = (a, b) => rect(a, 6.7, b - a, 3.25, LU.band, 0, 'rx="0.4"');
const merDoor = (x) => leaf(x, MER.sill, 10.6, 2.8, LU.door);
// Roof: a low fairing, the air conditioning, the engine's exhaust at one end.
const merRoof = (g, a) => fairing(a, g.L - 1.0, MER.roof, "#2f58b4") + hvac(g.L / 2 - 4, MER.roof + 0.27, 13, 0.55) + exhaust(g.L - 9, MER.roof + 0.27);
// A diesel engine's raft under the floor, with its radiator's louvers.
const raft = (a, b) => rect(a, 1.5, b - a, 2.25, "#3a3c3e", 0, 'rx="0.3"') +
  lines(seq(a + 1.2, 1.1, Math.floor((b - a - 2) / 1.1)).map((x) => [x, 1.8, x, 3.4]), "rgba(255,255,255,0.16)", 0.4);
function merCab(c) {
  const L = c.L;
  return unit(c, { roof: MER.roof, sill: MER.sill, nose: NOSE_MER, rake: [[3.0, 7.7], [7.4, 10.9]], depth: 3.2, cabLen: 14, lampY: 4.9, low: 4.0,
    rows: merRows(22.4, L - 6.4), doors: [merDoor(17.8), merDoor(L - 4.6)], trucks: [11.6, L - 9.6], wheel: 31, diaphragm: [4.0, 11.0],
    paint: (cc, g) => merPaint(true)(cc, g) + merGlass(21.6, g.L - 5.6) +
      // The black mask round the windshield, down to the lamps.
      path("M2.2 7.0Q5.2 9.2 8.0 11.0L9.6 11.0L9.6 7.3L6.4 6.6Q4.0 6.6 2.2 7.0Z", LU.band), surround: LU.band,
    extra: (cc, g) => merRoof(g, 12.2) + raft(19, g.L - 17) +
      // The cab's side window and door; the name in white under the windows.
      path(poly([[9.8, 7.7], [12.8, 7.7], [12.8, 9.9], [11.2, 9.9]]), "#1d2026", 0.4) + rect(14.2, 3.9, 2.0, 6.6, "rgba(255,255,255,0.09)", 0.5) +
      lumoName(cc, 44, 4.5, 1.8) + letters(cc, g.L - 12, 11.0, 0.36, "222", LU.white, { weight: 600, spacing: "0.06em" }) });
}
function merMid(c) {
  const L = c.L;
  return unit(c, { roof: MER.roof, sill: MER.sill,
    rows: merRows(6.4, L - 6.4), doors: [merDoor(1.8), merDoor(L - 4.6)], trucks: [9.6, L - 9.6], wheel: 31, diaphragm: [4.0, 11.0],
    paint: (cc, g) => merPaint(false)(cc, g) + merGlass(5.6, g.L - 5.6),
    extra: (cc, g) => merRoof(g, 1.0) + raft(17, g.L - 17) + lumoName(cc, g.L / 2, 4.6, 1.45) });
}

// ---------- Tables ----------

// Lumo has one class, Standard (2+2), through the whole train; the two
// driving cars differ from the middle ones, not from each other. Diesel
// units are kind "emu" without a pantograph, as in the other Great Britain
// files.
export const TYPES = {
  lw222Cab: { name: "Class 222 end car", kind: "emu" },
  lw222Mid: { name: "Class 222 car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  lw222Cab: M(merCab, MER.cab, true),
  lw222Mid: M(merMid, MER.mid),
};

// Units by number: 222 601-605, the six-car sets. The timetable names no
// unit; these are for the fleet pages.
export const FLEETS = {
  lumowest: [[222601, 222605, "lw222Cab"]],
};

const set = (label, ...units) => ({ label, units });
const S222 = set("Class 222: six cars, diesel, Standard class throughout",
  ["lw222Cab", 1], ["lw222Mid", 4], ["lw222Cab", 1]);

// Every Lumo service on the West Coast is a Class 222.
export const TYPICAL = {
  lumowest: () => S222,
};

const W222 = "https://en.wikipedia.org/wiki/British_Rail_Class_222";
const c222 = { model: "Bombardier Class 222", type: "Diesel-electric multiple unit", builder: "Bombardier Transportation (Bruges)", built: "2003–2005",
  fleet: "5 six-car units", topSpeedMph: 125, seats: 360, source: W222 };
export const FACTS = {
  lw222Cab: { ...c222, lengthFt: 456,
    about: "The Class 222's driving car. Lumo's West Coast fleet is five of these six-car diesel trains, running between London Euston and Stirling under the open-access rights first granted to Grand Union. Built as Meridians for the Midland Main Line, they came to Lumo from East Midlands Railway when its Class 810s arrived. One class, Standard, with 360 seats to a train." },
  lw222Mid: { ...c222,
    about: "Standard class, seated 2+2. Every car has its own Cummins diesel engine under the floor, driving a generator that feeds the motors on its trucks; the 222 is the Voyager's sister, built without tilt and with a roomier interior." },
};
