// Trentino Trasporti's Trento-Malè-Mezzana railway (scripts/railroads/
// trentino.py): metre gauge, 3 kV DC, 65 km up the Val di Non and Val di
// Sole. Its trains are the fourteen Alstom ETi 400s ("orsetti"), drawn
// here; the four older ET 15-18s are kept in reserve. Trainsheet's own
// side views from published dimensions and photographs (Wikimedia
// Commons), at the shared scale, lettered here (no logo files). Builders
// from trenord.cars.js.

import { path, rect } from "../carart.js?v=dev";
import { letters, hvac } from "./czechia.cars.js?v=dev";
import { single, bands, cover } from "./trenord.cars.js?v=dev";

// ---------- Paint ----------
// As photographed in 2024 (ETi 403): white, a raspberry band along the
// roof edge sweeping down over the cab hood, a gray stripe under the
// windshield, raspberry doors. (Some units were repainted from 2017 in the
// province's green, blue and gray; how many still wear this isn't known.)
const TT = { white: "#f2f2f2", berry: "#c2185b", gray: "#8d959d", ink: "#1d2026", skirt: "#3a3f45", roof: "#a3a9b0" };
const ttPaint = (cab) => (c, g) => {
  let s = bands(g.L, [[0, 20, TT.white], [12.2, 3, TT.berry], [11.6, 0.6, TT.berry], [0, 2.9, TT.skirt], [2.9, 0.18, TT.gray]]);
  if (cab) s += path("M-1 7.4L-1 13L10.4 13L10.4 11.6Q6.4 11.6 4.2 10.2Q2.6 9.0 1.6 7.4Z", TT.berry) + rect(-1, 6.3, 4.0, 0.5, TT.gray);
  return s;
};
const name = (c, x, y, h) => letters(c, x, y, h, "trentino trasporti", TT.berry, { weight: 700, spacing: "0.02em" });

// ---------- ETi 400 (Alstom, 2005-2006) ----------
// Two low-floor cars, 40.2 m, joined by a gangway over a shared Jakobs
// truck, a motor truck under each cab; one wide double door a side in each
// car; a big curved windshield under a rounded hood, a white fairing
// below; the pantograph on the roof. 2.65 m wide.
const ETI = { roof: 12.9, sill: 2.9 };
const NOSE_ETI = [[1.2, 2.9], [0.9, 5.0], ["q", 0.9, 6.6, 2.0, 7.6], [4.4, 11.6], ["q", 5.4, 12.9, 7.4, 12.9]];
const eti = (c) => single(c, { ...ETI, nose: NOSE_ETI, rake: [[2.0, 7.6], [4.4, 11.6]], depth: 3.0, cabLen: 8, lampY: 4.4, doors: [c.L - 26.0], doorW: 4.3, doorY: 2.1,
  win: { y: 5.9, w: 4.6, h: 4.1, pitch: 5.2 }, trucks: [8.6, "end"], wheel: 28, paint: ttPaint(true), doorFill: () => TT.berry, surround: TT.ink,
  pan: c.index === 0 ? c.L - 20 : null, diaphragm: [3.1, 11.6],
  extra: (k, g) => hvac(13, ETI.roof, 9, 0.6) + (k.index === 0 ? cover(g.L - 13, ETI.roof, 9, 0.55) : hvac(g.L - 22, ETI.roof, 10, 0.6) + cover(g.L - 11, ETI.roof, 8, 0.55)) +
    rect(16, 1.4, 12, 1.5, "currentColor", 0, 'opacity="0.75" rx="0.15"') + name(k, 30, 4.25, 0.75) +
    letters(k, 12.4, 4.25, 0.5, "ETi 400", TT.ink, { weight: 600, spacing: "0.04em" }) });

export const TYPES = { ttEti400: { name: "ETi 400 car", kind: "emu", pan: true } };
export const MODELS = { ttEti400: { draw: eti, len: 65.9, oneEnd: true, variant: (ctx) => ctx.index } };
export const FLEETS = { trentino: [[401, 414, "ttEti400"]] };
const ETI2 = { label: "ETi 400: a two-car electric unit", units: [["ttEti400", 2]] };
// Every passenger train on the line is an ETi 400, sometimes two coupled.
export const TYPICAL = { trentino: () => ETI2 };
export const FACTS = {
  ttEti400: { model: "Alstom ETi 400", type: "Electric multiple unit (metre gauge)", builder: "Alstom (Savigliano)", built: "2005–2006", fleet: "14, ETi 401–414",
    topSpeedMph: 74.6, powerHp: 1824, seats: 104, lengthFt: 131.9, source: "https://it.wikipedia.org/wiki/Elettrotreno_TT_ETi_400",
    about: "Two low-floor cars from Alstom's Minuetto family, built for the Trento–Malè–Mezzana's metre gauge and 3 kV. Nicknamed the \"orsetto\" (little bear), they work all of the line's trains, room for 240." },
};
