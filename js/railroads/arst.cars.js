// ARST's trains (scripts/railroads/arst.py): Sardinia's 950 mm gauge
// diesel lines, Monserrato-Isili, Macomer-Nuoro, Sassari-Alghero and
// Sassari-Sorso (the Trenino Verde's tourist lines besides). The timetable
// names no unit, so a train is drawn as what usually runs on its line,
// labeled as typical. Trainsheet's own side views from published
// dimensions and photographs (Wikimedia Commons), at the shared scale,
// lettered here (no logo files). Parts from czechia.cars.js and
// trenord.cars.js.

import { rect, path, poly, truck } from "../carart.js?v=dev";
import { unit, twinEnded, letters, hvac, exhaust, tank } from "./czechia.cars.js?v=dev";
import { seq, spread, bands, boxes, plug, cover, step } from "./trenord.cars.js?v=dev";

// ---------- Paint ----------
// The Stadlers: white, a red band along the bottom of the body, red doors,
// ARST's name. The ADe 90s (Breda, 1995): teal green over a cream lower
// side with a yellow line between.
const AR = { white: "#f4f4f4", red: "#d7262b", teal: "#3fa39a", cream: "#ede6c8", yellow: "#f2c230", ink: "#1d2026", skirt: "#3a3f45", roof: "#a3a9b0", gray: "#8d959d" };
const arstName = (c, x, y, h, fill = AR.red) => letters(c, x, y, h, "arst", fill, { weight: 800, spacing: "-0.01em" });
const plate = (c, x, y, text, fill = AR.ink) => letters(c, x, y, 0.45, text, fill, { weight: 600, spacing: "0.04em" });

// ---------- Stadler ADeS ----------
// Two cars, 35.83 m, a cab at each end of the set; a motor truck under each
// cab (a Cummins diesel and generator over it, under the roof fairings)
// and trailer trucks at the inner ends; a low floor between; two single
// sliding doors a side in each car. A flat front under a raked windshield.
// 2.5 m wide, about 3.6 m tall.
const ADES = { roof: 11.9, sill: 3.3 };
const NOSE_ADES = [[1.1, 3.3], [1.0, 5.8], ["q", 1.0, 6.9, 1.8, 7.6], [3.4, 11.0], ["q", 3.9, 11.9, 5.4, 11.9]];
const adesPaint = (c, g) => bands(g.L, [[0, 20, AR.white], [11.0, 3, AR.roof], [0, 2.3, AR.skirt], [2.3, 1.15, AR.red], [3.6, 0.15, AR.red]]) +
  path("M-1 2.3L-1 7.2Q1.4 7.2 2.3 6.2L3.4 3.45L4.6 2.3Z", AR.red) + rect(-1, 9.9, 7.0, 0.35, AR.red);
function ades(c) {
  const L = c.L, doors = [13.4, L - 15.0], dw = 2.6;
  const spans = doors.map((x) => [x, x + dw]);
  return unit(c, { roof: ADES.roof, sill: ADES.sill, drop: { a: 12.4, b: L - 9.5, y: 1.9 }, nose: NOSE_ADES, rake: [[1.8, 7.6], [3.4, 11.0]], depth: 2.4, cabLen: 6, lampY: 4.4,
    rows: [{ xs: spread(8.6, L - 2.0, 4.2, 5.0, spans), y: 5.7, w: 4.2, h: 3.5, r: 0.4 }, { xs: [7.2], y: 6.2, w: 1.4, h: 2.8, r: 0.3 }],
    doors: doors.map((x) => ({ ...plug(x, 2.0, 9.7, dw), leaves: 1, fill: AR.red })), diaphragm: [2.2, 10.6], paint: adesPaint, surround: AR.ink,
    extra: (cc, g) => truck(7.2, { wb: 6.6, d: 30, kind: "loco", top: ADES.sill }) + truck(g.L - 5.0, { wb: 6.2, d: 26, top: ADES.sill }) +
      doors.map((x) => step(x, dw, 2.0)).join("") +
      // The power pack's fairing and exhaust over the motor truck, the
      // cooling unit, air-conditioning further back.
      cover(6.5, ADES.roof, 9.5, 0.8, "#9aa1a9") + exhaust(11.6, ADES.roof + 0.75) + hvac(19, ADES.roof, 9, 0.6) + hvac(g.L - 18, ADES.roof, 9, 0.6) +
      tank(16.6, 22.6, 1.9, 1.0) + boxes(23.4, g.L - 11, 1.9, 2, 0.5) +
      arstName(cc, 32, 4.45, 0.9, "#ffffff") + plate(cc, g.L - 5.5, 10.2, cc.newer ? "Stadler" : "ADeS", AR.gray) });
}

// ---------- ADe 90 series (Breda, 1995) ----------
// A single railcar with a cab at each end, two trucks, the engine under
// the floor; a door behind each cab, wide windows between.
const ADE = { roof: 11.6, sill: 3.6 };
const NOSE_ADE = [[1.0, 3.6], [0.9, 6.8], ["q", 0.95, 7.6, 1.5, 8.1], [2.3, 10.8], ["q", 2.6, 11.6, 3.8, 11.6]];
const adePaint = (c, g) => bands(g.L, [[0, 20, AR.teal], [10.75, 3, AR.roof], [0, 6.2, AR.cream], [6.0, 0.25, AR.yellow], [0, 3.6, AR.skirt]]);
const ade90 = (c) => twinEnded(c, (h) => unit(h, { roof: ADE.roof, sill: ADE.sill, nose: NOSE_ADE, rake: [[1.5, 8.1], [2.3, 10.8]], depth: 2.0, cabLen: 5, lampY: 4.8,
  rows: [{ xs: spread(10.6, c.L / 2 + 0.2, 4.0, 4.7), y: 6.7, w: 4.0, h: 3.0, r: 0.35 }],
  doors: [{ ...plug(6.0, 3.2, 10.0, 3.0), leaves: 2, fill: AR.teal }], diaphragm: [3.8, 10.4], paint: adePaint, surround: AR.ink, coupler: "buffers",
  extra: (cc, g) => truck(9.6, { wb: 6.6, d: 30, top: ADE.sill }) + step(6.0, 3.0, 3.2) + hvac(12, ADE.roof, 6, 0.5) + exhaust(20, ADE.roof) +
    tank(15.0, 21.0, ADE.sill, 2.0) + boxes(21.6, g.L / 2, ADE.sill, 1, 1.1) })) +
  letters(c, c.L / 2, 4.8, 0.85, "ARST", AR.teal, { weight: 800, spacing: "0.06em" }) + plate(c, c.L / 2, 9.95, "ADe 90", "#ffffff");

// ---------- Tables ----------

export const TYPES = {
  arstAdes: { name: "Stadler ADeS car", kind: "emu" },
  arstStadler: { name: "Stadler diesel car (2023)", kind: "emu" },
  arstAde90: { name: "ADe 90 railcar", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  arstAdes: M(ades, 58.8, true),
  arstStadler: M((c) => ades({ ...c, newer: true }), 58.8, true),
  arstAde90: M(ade90, 66.0),
};

// The ADeS sets 001-009 (001-004 and 008-009 at Sassari, 005-007 on
// Macomer-Nuoro).
export const FLEETS = { arst: [[1, 9, "arstAdes"]] };

const set = (label, ...units) => ({ label, units });
const ADES2 = set("Stadler ADeS: a two-car diesel unit", ["arstAdes", 2]);
const NEW2 = set("Stadler: a two-car diesel unit (drawn as an ADeS)", ["arstStadler", 2]);
const ADE90 = set("ADe 90: a single diesel railcar", ["arstAde90", 1]);
// The ADeS run Sassari-Alghero, Sassari-Sorso and Macomer-Nuoro; the
// Stadlers presented in 2023 Monserrato-Isili; the Trenino Verde's tourist
// lines older railcars such as the ADe 90s.
export const TYPICAL = {
  arst: (t, reported) => {
    if (reported === "arstAdes") return ADES2;
    const r = `${t.route || ""}`;
    if (/Isili|Monserrato|Mandas/i.test(r)) return NEW2;
    if (/Alghero|Sorso|Nuoro|Macomer|Sassari/i.test(r)) return ADES2;
    return r ? ADE90 : null;
  },
};

const IT = "https://it.wikipedia.org/wiki/";
export const FACTS = {
  arstAdes: { model: "Stadler ADeS", type: "Diesel-electric multiple unit (950 mm gauge)", builder: "Stadler Rail", built: "2014–2017", fleet: "9, ADeS 001–009",
    topSpeedMph: 74.6, powerHp: 1059, seats: 100, lengthFt: 117.6, source: `${IT}Automotrice_ARST_AdeS`,
    about: "Low-floor two-car sets with a diesel under each cab, on Sassari–Alghero, Sassari–Sorso and Macomer–Nuoro. 100 seats and 10 folding." },
  arstStadler: { model: "Stadler diesel unit (2023)", type: "Diesel-electric multiple unit (950 mm gauge)", builder: "Stadler Rail", built: "Since 2023", fleet: "15 ordered in 2019",
    topSpeedMph: 62, seats: 89, source: "https://www.unionesarda.it/en/sardinia/seven-new-stadler-trains-on-the-cagliari-isili-line-elqp8qo6",
    about: "Seven of these two-car units were presented in July 2023 for Monserrato–Isili. Their class and paint weren't checked; they're drawn here as the ADeS." },
  arstAde90: { model: "Breda ADe 90 series", type: "Diesel railcar (950 mm gauge)", builder: "Breda and ABB", built: "1995", fleet: "7 (2019)", powerHp: 493,
    source: `${IT}Azienda_Regionale_Sarda_Trasporti`,
    about: "Single railcars with a cab at each end, in teal green and cream; with the older Fiat railcars they work the Trenino Verde's tourist lines." },
};
