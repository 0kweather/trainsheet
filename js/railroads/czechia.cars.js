// Czechia's railroads' cars (scripts/railroads/czechia.py): České dráhy,
// RegioJet, Leo Express, Arriva and GW Train Regio. The feed names no car or
// unit (a train's vehicle id is a hash), so every train is drawn as what
// usually runs on its line or kind of train, labeled as typical. The
// drawings are Trainsheet's own side views from published dimensions and
// photographs, at the shared scale (js/carart.js), each in its operator's
// current paint, lettered here (no logo files). Slovakia's (zsr.cars.js)
// and Greece's (hellenictrain.cars.js) railroads reuse the bodies and
// details here (twinEnded, euroLoco, euroCoach, unit and the parts below);
// the paint goes by the car's railroad (c.agency), theirs included.

import { newId, bilevel, coachCar } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, poly, truck, pantograph, slats, underframe } from "../carart.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
const STROKE = 'vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"';

// ---------- Paint ----------
// The operators' colors, from photographs of their trains.
// ČD: the 2020s regional blue over a navy skirt, white cab ends and a
// yellow line; long-distance cars light gray with a sky-blue window band
// under navy and a yellow line; the 109E silver with blue. RegioJet: yellow,
// black below; its Ústí-region Elfs lime green. Leo Express: graphite with
// copper (its LINTs white and black with orange). Arriva: light aqua.
// GW Train: orange and green. ZSSK: red (Vectrons) and white with a red
// window band. Hellenic Train: white with blue, red at the cab ends.
export const CD = { blue: "#2a6ed3", navy: "#13306e", sky: "#4e96df", yellow: "#f8c400", white: "#f2f4f6", gray: "#e2e6ea", silver: "#cfd4d9", red: "#d52b2f", shark: "#1d5fbf" };
export const RJ = { yellow: "#fbc400", black: "#1c1d1f", gray: "#8e9399", lime: "#8cc63f", green: "#2d6e38" };
export const LEO = { graphite: "#2a2b2f", roof: "#3b3d42", copper: "#d4782b", white: "#eceef0", orange: "#f08a24" };
export const ARRIVA = { aqua: "#45b5e5", deep: "#1f6f99", white: "#f4f6f7", skirt: "#2b3a48" };
export const GW = { orange: "#f07d1d", green: "#1f8443", dark: "#165f31" };
export const ZS = { red: "#d7212b", dark: "#1d1e20", white: "#f3f4f5", gray: "#9aa1a9" };
export const HT = { blue: "#0a5aa8", red: "#d71920", violet: "#3b2c85", lilac: "#9184d3", sky: "#56aee2", yellow: "#f5c400", cream: "#f1efe9", white: "#f2f3f4" };
// The railroads whose trains cross into Czechia and Slovakia (drawn under
// "Other railroads' trains" below): ÖBB's traffic red, its railjets' deeper
// red over slate gray, the Nightjets' night blue with a red line; MÁV's
// blue and turquoise; Raaberbahn's (GySEV's) yellow and green; PKP
// Intercity's navy over light gray; Die Länderbahn's alex blue and silver.
export const OBB = { red: "#e1251b", rj: "#a8202a", slate: "#3a3c40", nj: "#28327a", njLine: "#e5392f" };
export const MAV = { blue: "#1d5fc4", deep: "#163f8c", sky: "#22b3c9", white: "#f1f3f5" };
export const GYSEV = { yellow: "#f4c20d", green: "#3a9a35", dark: "#1f5e2a" };
export const PKP = { navy: "#1f2e78", gray: "#d9dde1", orange: "#e8501e", red: "#d7161e" };
export const DLB = { blue: "#1f6fb6", silver: "#e6e9ec", yellow: "#f2ab00", gray: "#9aa3ab" };

// The plain fallback (kept for other files' use): a body color, a roof band,
// a lower band with a line on top, a dark skirt.
export const SCHEME = {
  czcd: { base: CD.white, roof: "#a9b0b8", band: CD.blue, line: CD.yellow, skirt: CD.navy, screen: "#1d2026" },
  zssk: { base: ZS.white, roof: "#a9b0b8", band: null, line: ZS.red, skirt: ZS.dark, screen: "#1d2026" },
  czregiojet: { base: RJ.yellow, roof: RJ.gray, band: null, line: RJ.black, skirt: RJ.black, screen: RJ.black },
  czleo: { base: LEO.graphite, roof: LEO.roof, band: null, line: LEO.copper, skirt: "#17181a", screen: "#111214" },
  czarriva: { base: ARRIVA.aqua, roof: "#c9ced4", band: null, line: ARRIVA.white, skirt: ARRIVA.skirt, screen: "#1d2026" },
  czgwtrain: { base: GW.orange, roof: "#a9b0b8", band: null, line: GW.green, skirt: "#2a2d31", screen: "#1d2026" },
  hellenictrain: { base: HT.white, roof: "#a9b0b8", band: null, line: HT.blue, skirt: "#1d1e20", screen: "#1d2026" },
};
SCHEME.regiojetsk = SCHEME.czregiojet;
SCHEME.leoexpresssk = SCHEME.czleo;
export const scheme = (c) => SCHEME[c.agency] || SCHEME.czcd;
const isRJ = (c) => c.agency === "czregiojet" || c.agency === "regiojetsk";
const isLeo = (c) => c.agency === "czleo" || c.agency === "leoexpresssk";

export function side(c, L, { eave, low, skirt, lineH = 0.32 }) {
  const s = scheme(c);
  let p = rect(0, 0, L, 20, s.base) + rect(0, eave, L, 8, s.roof);
  if (s.band) p += rect(0, 0, L, low, s.band);
  if (s.line) p += rect(0, low, L, lineH, s.line);
  return p + rect(0, 0, L, skirt, s.skirt);
}
// Bands across the whole side: [[y, h, fill], ...].
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");

// ---------- Lettering ----------
// Lettering and marks are drawn y-down in a box centered at (x, y), so they
// read left to right on a car drawn mirrored (c.mirrored) too. Drawn outside
// a twinEnded body's mirrored halves.
export const mark = (c, x, y, inner) => `<g transform="translate(${n(x)} ${n(y)}) scale(${c.mirrored ? -1 : 1} -1)">${inner}</g>`;
const txt = (x, y, h, text, fill, { weight = 700, family = SANS, spacing = 0, style = "", anchor = "middle", extra = "" } = {}) =>
  `<text x="${n(x)}" y="${n(y + h * 0.36)}" font-size="${n(h)}" text-anchor="${anchor}" font-weight="${weight}" letter-spacing="${spacing}" font-family="${family}" fill="${fill}"${style ? ` font-style="${style}"` : ""}${extra ? " " + extra : ""}>${text}</text>`;
export const letters = (c, x, y, h, text, fill, opts) => mark(c, x, y, txt(0, 0, h, text, fill, opts));
// ČD's mark, "ČD" in a rounded frame, h tall; with "České dráhy" beside it.
const cdFrame = (h, color) => `<rect x="${n(-0.82 * h)}" y="${n(-0.5 * h)}" width="${n(1.64 * h)}" height="${n(h)}" rx="${n(0.5 * h)}" fill="none" stroke="${color}" stroke-width="${n(0.12 * h)}"/>` +
  txt(0, -0.02 * h, 0.68 * h, "ČD", color, { weight: 800, spacing: "-0.03em" });
export const cdLogo = (c, x, y, h, color, name = true) => mark(c, x, y, cdFrame(h, color) +
  (name ? txt(1.05 * h, -0.08 * h, 0.5 * h, "České dráhy", color, { weight: 500, anchor: "start" }) : ""));
// ZSSK's ring (the "Národný dopravca" mark): a white ring open at the right.
const zsRing = (r, color) => `<path d="M${n(r * 0.7)} ${n(-r * 0.72)}A${n(r)} ${n(r)} 0 1 0 ${n(r * 0.7)} ${n(r * 0.72)}" fill="none" stroke="${color}" stroke-width="${n(r * 0.24)}"/>` +
  `<path d="M${n(-r * 0.35)} ${n(-r * 0.3)}L${n(r * 0.35)} ${n(-r * 0.3)}L${n(-r * 0.35)} ${n(r * 0.3)}L${n(r * 0.35)} ${n(r * 0.3)}" fill="none" stroke="${color}" stroke-width="${n(r * 0.16)}"/>`;
export const zsLogo = (c, x, y, r, color, name = true) => mark(c, x, y, zsRing(r, color) +
  (name ? txt(r * 1.35, 0, r * 0.42, "NÁRODNÝ DOPRAVCA", color, { weight: 600, anchor: "start", spacing: "0.02em" }) : ""));
// Leo Express: "leo" over "express", lowercase, a copper slash beside them.
export const leoLogo = (c, x, y, h, color, slash = LEO.copper) => mark(c, x, y,
  `<path d="M${n(-0.95 * h)} ${n(0.62 * h)}L${n(-0.72 * h)} ${n(0.62 * h)}L${n(-0.38 * h)} ${n(-0.62 * h)}L${n(-0.61 * h)} ${n(-0.62 * h)}Z" fill="${slash}"/>` +
  txt(-0.25 * h, -0.3 * h, 0.55 * h, "leo", color, { weight: 700, anchor: "start" }) + txt(-0.25 * h, 0.32 * h, 0.55 * h, "express", color, { weight: 500, anchor: "start" }));
// Hellenic Train: its name in capitals, a small red and blue swash ahead of it.
export const htLogo = (c, x, y, h, color = HT.blue) => mark(c, x, y,
  `<path d="M${n(-4.6 * h)} ${n(0.45 * h)}Q${n(-4.0 * h)} ${n(-0.7 * h)} ${n(-3.3 * h)} ${n(-0.45 * h)}Q${n(-3.9 * h)} ${n(-0.35 * h)} ${n(-4.3 * h)} ${n(0.45 * h)}Z" fill="${HT.red}"/>` +
  `<path d="M${n(-4.1 * h)} ${n(0.45 * h)}Q${n(-3.6 * h)} ${n(-0.3 * h)} ${n(-3.05 * h)} ${n(-0.1 * h)}Q${n(-3.55 * h)} ${n(0.0 * h)} ${n(-3.8 * h)} ${n(0.45 * h)}Z" fill="${color}"/>` +
  txt(0, 0, h, "HELLENIC TRAIN", color, { weight: 700, spacing: "0.04em" }));

// ---------- Parts ----------

// A lamp lens seen side-on at the front corner.
const lamp = (x, y, w = 0.45, h = 0.45, color = "#fff4cf") => rect(x, y, w, h, color, 0.35, 'rx="0.15"');
// Where the nose's front is at height y (the nose's points, bottom up).
function noseX(nose, y) {
  const pts = nose.map((p) => (p[0] === "q" ? [p[3], p[4]] : p));
  for (let i = 0; i + 1 < pts.length; i++) {
    const [[x0, y0], [x1, y1]] = [pts[i], pts[i + 1]];
    if (y >= y0 && y <= y1) return x0 + ((x1 - x0) * (y - y0)) / (y1 - y0 || 1);
  }
  return pts[0][0];
}
// UIC side buffers, the headstock behind them and the screw coupling hung
// on its hook, at one end: the buffer faces at xFace; side -1 the left end,
// 1 the right; end: where the body begins.
export function buffers(xFace, side, { y = 3.45, end = 0.6, beam = 2.5, sill = 4.1 } = {}) {
  const at = (v) => xFace - side * v;
  const span = (a, b) => [Math.min(at(a), at(b)), Math.abs(b - a)];
  const [hx, hw] = span(end - 0.05, end + 0.7), [bx, bw] = span(0.32, end), [fx] = span(0, 0.32);
  let s = rect(hx, beam, hw, sill - beam, "currentColor", 0, 'opacity="0.88"');
  s += rect(bx, y - 0.27, bw, 0.54, "currentColor", 0, 'opacity="0.78"') + rect(fx, y - 0.62, 0.32, 1.24, C.steelDark, 0.4, 'rx="0.12"');
  s += path(`M${n(at(end + 0.3))} ${n(y - 0.55)}Q${n(at(end * 0.5))} ${n(y - 1.25)} ${n(at(0.15))} ${n(y - 0.95)}`, "none", 0, `stroke="#2a2d31" stroke-width="0.9" ${STROKE}`);
  return s;
}
// A Scharfenberg coupler under a multiple unit's nose; head at x0.
const scharf = (x0, reach, y = 2.85) => rect(x0 + 0.2, y - 0.28, reach, 0.56, "currentColor", 0, 'opacity="0.9"') + rect(x0, y - 0.55, 0.42, 1.1, C.steelDark, 0.4, 'rx="0.14"') +
  rect(x0 + 0.1, y - 0.12, 0.25, 0.24, "#2a2d31");
// Roof air-conditioning (or brake-resistor) housing with its grille.
export const hvac = (x, roof, w, h = 0.75) => rect(x, roof - 0.05, w, h, C.steelDark, 0.4, 'rx="0.32"') + slats(x + 0.6, roof + 0.12, w - 1.2, h - 0.3, 0.5, "rgba(0,0,0,0.24)");
// The high-voltage line along the roof from a pantograph to the main
// breaker, on insulators.
export const hvLine = (a, b, roof) => lines([[a, roof + 0.75, b, roof + 0.75]], "currentColor", 0.9) +
  [a, (a + b) / 2, b].map((x) => rect(x - 0.18, roof, 0.36, 0.7, C.steelDark, 0.35)).join("") + rect(b - 0.9, roof - 0.05, 1.8, 0.9, C.steelDark, 0.4, 'rx="0.15"');
// A diesel's exhaust stack and silencer on the roof.
export const exhaust = (x, roof) => rect(x, roof - 0.05, 2.4, 0.55, C.steelDark, 0.4, 'rx="0.25"') + rect(x + 0.6, roof + 0.45, 0.55, 0.55, "currentColor") + rect(x + 1.35, roof + 0.45, 0.55, 0.4, "currentColor");
// A fuel tank slung under the floor.
export const tank = (a, b, top, bot = 1.3) => path(poly([[a, top], [b, top], [b, bot + 0.5], ["q", b, bot, b - 0.5, bot], [a + 0.5, bot], ["q", a, bot, a, bot + 0.5]]), "currentColor", 0, 'opacity="0.82"') +
  line(a + 0.4, bot + 0.55, b - 0.4, bot + 0.55, "rgba(255,255,255,0.14)", 0.6) + rect((a + b) / 2 - 0.4, top - 0.9, 0.8, 0.5, C.steelDark, 0, 'rx="0.1"');
// Horns (and a beacon) on the cab roof.
const horns = (x, roof) => rect(x, roof - 0.05, 1.3, 0.35, "currentColor") + rect(x + 0.15, roof + 0.3, 0.3, 0.3, "currentColor") + rect(x + 0.75, roof + 0.3, 0.3, 0.4, "currentColor");
// Grab handles beside a cab door.
const grab = (x, y0, y1) => line(x, y0, x, y1, "currentColor", 0.6);

// A raked windshield seen from the side, set in the cab's dark surround:
// from p (where the nose's rake begins) to q (where it meets the roof); a
// wiper and the destination display behind the glass.
export const screen = (c, [px, py], [qx, qy], depth = 2.6, surround = scheme(c).screen) =>
  path(poly([[px + 0.15, py - 0.35], [qx + 0.2, qy + 0.25], [qx + depth + 0.6, qy + 0.25], [px + depth + 0.6, py - 0.35]]), surround) +
  path(poly([[px + 0.45, py], [qx + 0.25, qy - 0.15], [qx + 0.9, qy - 0.15], [px + 1.3, py]]), C.glass) +
  path(poly([[px + 1.6, py], [qx + 1.15, qy - 0.15], [qx + depth, qy - 0.15], [px + depth, py]]), C.glass) +
  rect(qx + 1.25, qy - 0.7, Math.max(0.6, depth - 1.45), 0.32, "#f39a26", 0, 'opacity="0.9"') +
  line(px + 0.75, py + 0.25, px + 0.75 + (qx - px) * 0.35, py + (qy - py) * 0.35, "#0d0f12", 0.7);

// A cab end's front: lamps low on the nose and over the windshield, a red
// tail lamp, the coupler under the nose (unless coupled to another unit),
// horns on the roof. o: the body's nose, rake, sill; coupler: "scharf"
// (multiple units) or "buffers" (locomotives).
function front(c, o, { coupler = "scharf", lampY = o.sill + 1.75 } = {}) {
  const { nose, rake, sill } = o;
  const xl = noseX(nose, lampY);
  let s = lamp(xl - 0.12, lampY - 0.22, 0.55, 0.5) + rect(noseX(nose, lampY - 0.75) - 0.06, lampY - 0.95, 0.4, 0.32, "#d8262c", 0.3, 'rx="0.1"');
  s += lamp(rake[1][0] - 0.05, rake[1][1] + 0.12, 0.5, 0.36);
  if (coupler === "buffers") s += buffers(0, -1, { end: noseX(nose, sill) + 0.3, sill });
  else if (!c.coupledL) s += scharf(0.05, noseX(nose, 2.85) + 0.6);
  return s + horns(rake[1][0] + 1.2, nose[nose.length - 1][nose[nose.length - 1][0] === "q" ? 4 : 1]);
}

// ---------- Bodies ----------

// A body with a cab at each end: drawn once with its cab on the left, then
// that left half again mirrored for the right. half(c) draws the whole body.
export function twinEnded(c, half) {
  const id = newId(), L = c.L;
  const h = half({ ...c, cabL: true, cabR: false, coupledL: false, coupledR: false });
  return `<clipPath id="${id}"><rect x="-5" y="-5" width="${L / 2 + 5.3}" height="30"/></clipPath>` +
    `<g clip-path="url(#${id})">${h}</g><g transform="matrix(-1 0 0 1 ${L} 0)"><g clip-path="url(#${id})">${h}</g></g>`;
}

// A four-axle European locomotive with a cab at each end. o: roof, sill,
// nose (points, bottom up), rake ([p, q] of the windshield), centers (truck
// centers apart), wheel (in), pans (electric), grilles ([x, w, y0, y1] from
// the middle), paint(c, L) for each half's side (drawn mirrored, so
// symmetric), over(c, L) for what is drawn once over the whole side
// (lettering, the logo), under(c, L) for what hangs between the trucks.
export function euroLoco(c, o) {
  const L = c.L, { roof, sill } = o;
  const half = (h) => bilevel(h, {
    roof, sill, cornerR: 1.0, end: 0.6, noTrucks: true, nose: o.nose, badge: false, cabLen: 0,
    paint: () => (o.paint ? o.paint(c, L) : side(c, L, { eave: roof - 1.1, low: sill + 2.2, skirt: sill + 0.55 })),
    doors: [{ x: o.door ?? 6.2, w: 1.9, y0: sill + 0.5, y1: roof - 1.7, glassY: 0.62, glassH: 0.25, grabs: false }],
    rows: [{ xs: [o.rake[1][0] + 0.6], y: o.rake[0][1] - 0.4, w: 1.6, h: 2.2, r: 0.3 }],
    cab: () => screen(c, o.rake[0], o.rake[1], 2.0, o.surround),
    // The cab door's grab handles and step, a plow under the nose, the lamps,
    // buffers and coupling.
    extra: () => grab((o.door ?? 6.2) - 0.3, sill + 1.2, roof - 3.0) + grab((o.door ?? 6.2) + 2.2, sill + 1.2, roof - 3.0) +
      rect((o.door ?? 6.2) - 0.1, sill - 0.6, 2.1, 0.25, "currentColor") +
      path(poly([[noseX(o.nose, sill) + 0.7, 2.5], [5.6, 2.5], [5.0, 0.6], [noseX(o.nose, sill) + 1.5, 0.55], [noseX(o.nose, sill) + 0.8, 1.5]]), C.black, 0, 'opacity="0.92"') +
      front(c, o, { coupler: "buffers", lampY: sill + 1.3 }),
  });
  let s = twinEnded(c, half);
  // Side grilles either side of the middle; equipment on the roof.
  for (const [dx, w, y0 = sill + 3.1, y1 = roof - 2.1] of o.grilles || [[-14.5, 9.5], [5.0, 9.5]]) {
    const x = L / 2 + dx;
    s += rect(x, y0, w, y1 - y0, o.grilleFill ?? "rgba(20,22,25,0.5)", 0.4) + slats(x, y0, w, y1 - y0, 0.32, "rgba(255,255,255,0.18)");
  }
  const c2 = o.centers / 2;
  for (const k of [-1, 1]) s += truck(L / 2 + k * c2, { wb: o.wb ?? 8.5, d: o.wheel ?? 49, kind: "loco", top: sill });
  // Between the trucks: the transformer (a diesel's fuel tank), battery and
  // air reservoirs.
  s += o.under ? o.under(c, L) : underframe(L / 2 - c2 + 6.2, L / 2 + c2 - 6.2, sill, { depth: 1.8, boxes: 2, tanks: true });
  if (o.pans !== false) {
    s += pantograph(L * 0.29, roof + 0.5, { up: false }) + pantograph(L * 0.71, roof + 0.5, { up: true, facing: -1 });
    s += rect(L / 2 - 8, roof - 0.05, 16, 0.55, C.steelDark, 0.4, 'rx="0.2"') + hvLine(L * 0.29 + 3.2, L / 2 - 1.0, roof + 0.5) + hvLine(L * 0.71 - 3.2, L / 2 + 1.0, roof + 0.5);
  } else if (o.roof2) s += o.roof2(c, L);
  if (o.over) s += o.over(c, L);
  return s;
}

// A UIC-Z passenger coach, 26.4 m: two trucks 19 m apart, a single plug door
// at each end, ten big windows between. o: rows, cab (a driving trailer's
// end). The paint goes by the railroad (coachPaint); the roof carries the
// air-conditioning unit and vents, the ends buffers and screw couplings.
export function euroCoach(c, o = {}) {
  const L = c.L, roof = 13.3, sill = 3.9;
  const p = coachPaint(c);
  const rows = o.rows ?? [{ a: 6.0, b: L - 6.0, y: 7.3, w: 4.6, h: 3.0, pitch: 6.45, r: 0.45 }];
  // A driving trailer's door is behind its cab.
  const dx = c.cabL && o.cab ? 9.0 : 2.0;
  return coachCar(c, {
    roof, sill, end: 0.6, endR: 1.2, base: p.base, badge: false, under: true,
    trucks: { centers: o.centers ?? 62.3, wb: 8.2, d: 36 }, diaphragm: [4.25, 11.8], rows,
    doors: [{ x: dx, w: 2.6, h: 7.0, glassY: 0.55, glassH: 0.3 }, { x: L - 4.6, w: 2.6, h: 7.0, glassY: 0.55, glassH: 0.3 }],
    livery: (cc) => p.side(cc, L) + [dx, L - 4.6].map((x) => rect(x, sill + 0.15, 2.6, 7.0, p.door)).join("") + (cc.cabL && o.cab && p.cabEnd ? p.cabEnd(cc, L) : ""),
    extra: (cc) => {
      let s = hvac(L / 2 - 7, roof, 14, 0.7) + [12, 24, L - 24, L - 12].map((x) => path(`M${x - 1.1} ${roof - 0.05}Q${x} ${roof + 0.7} ${x + 1.1} ${roof - 0.05}Z`, C.steelDark, 0.4)).join("");
      s += rect(L / 2 - 3.5, sill - 1.9, 7, 0.75, C.steelDark, 0.4, 'rx="0.37"');                       // water tank
      const cab = cc.cabL && o.cab;
      s += buffers(0, -1, { sill, end: cab ? 0.9 : 0.6 }) + buffers(L, 1, { sill });
      if (cab) s += lamp(0.55, 5.6, 0.5, 0.5) + rect(0.6, 5.0, 0.4, 0.32, "#d8262c", 0.3, 'rx="0.1"') + horns(3.6, roof);
      return s + (p.over ? p.over(cc, L, rows) : "");
    },
    ...(o.cab ? { cab: o.cab, cabLen: 8, cabR: 3.2 } : {}),
  });
}

// Each railroad's coach paint: base, side(c, L) inside the body, door
// color, cabEnd (a driving trailer's), over (lettering).
function coachPaint(c) {
  // ComfortJet (Siemens Viaggio Comfort, ČD, 20 nine-car push-pull sets,
  // 2023-2026; photographs at Děčín, Berlin and Brno): ČD blue from the roof
  // edge to just under the windows, which sit in a continuous dark band,
  // a navy line, pale gray below, navy doors; "České dráhy" and its mark on
  // the gray.
  if (c.livery === "comfortjet") return { base: "#e4e7ea", door: "#1d4f9e",
    side: (cc, L) => bands(L, [[12.25, 3, "#9aa2ab"], [6.55, 5.7, "#2763c4"], [6.55, 0.25, CD.navy], [0, 4.35, "#c7ccd2"], [4.35, 0.12, "#8d949c"]]) +
      rect(5.4, 7.05, L - 10.8, 3.3, "#1b1e23", 0, 'rx="0.4"'),
    cabEnd: (cc, L) => path("M0 4.35L3.2 4.35Q5.0 6.6 5.6 13.3L0 13.3Z", "#2763c4"),
    over: (cc, L) => cdLogo(cc, L * 0.62, 5.5, 0.95, "#2763c4") };
  // Other railroads' cars on the international trains (FOREIGN_PAINT below).
  if (FOREIGN_PAINT[c.livery]) return FOREIGN_PAINT[c.livery](c);
  switch (c.agency) {
    case "czregiojet": case "regiojetsk":
      return { base: RJ.yellow, door: RJ.yellow,
        side: (cc, L) => bands(L, [[12.25, 3, RJ.gray], [12.05, 0.2, RJ.black], [0, 4.35, RJ.black]]),
        over: (cc, L) => letters(cc, L / 2, 5.55, 1.15, "RegioJet", RJ.black, { weight: 700 }) + letters(cc, 6.7, 8.8, 1.4, "2", RJ.black, { weight: 600 }) + letters(cc, L - 6.7, 8.8, 1.4, "2", RJ.black, { weight: 600 }) };
    case "czleo": case "leoexpresssk":
      return { base: LEO.graphite, door: "#232427",
        side: (cc, L) => bands(L, [[12.25, 3, LEO.roof], [6.85, 0.2, LEO.copper], [0, 4.35, "#17181a"]]),
        over: (cc, L) => leoLogo(cc, L / 2, 5.5, 1.5, "#ffffff") };
    case "zssk":
      return { base: ZS.white, door: ZS.red,
        side: (cc, L) => bands(L, [[12.25, 3, ZS.gray], [6.75, 3.95, ZS.red], [0, 4.35, "#2a2d31"], [6.45, 0.15, ZS.red]]),
        over: (cc, L) => zsLogo(cc, L / 2 - 8, 5.5, 0.62, ZS.red) + letters(cc, 6.7, 11.35, 0.85, "ZSSK", ZS.red, { weight: 800 }) };
    case "hellenictrain":
      return { base: HT.white, door: HT.blue,
        side: (cc, L) => bands(L, [[12.25, 3, "#aab1b9"], [4.35, 1.75, HT.blue], [6.1, 0.22, HT.sky], [11.45, 0.22, HT.blue], [0, 4.35, "#1d1e20"]]),
        over: (cc, L) => htLogo(cc, L / 2 + 2, 5.25, 0.75, "#ffffff") };
    default: // ČD
      return { base: CD.gray, door: CD.navy,
        side: (cc, L) => bands(L, [[12.25, 3, "#98a0a9"], [10.9, 1.35, CD.navy], [10.68, 0.22, CD.yellow], [6.75, 3.93, CD.sky], [6.5, 0.25, CD.navy], [0, 4.35, "#2a2d31"]]),
        cabEnd: (cc, L) => path("M0 4.35L3.2 4.35Q5.0 6.6 5.6 13.3L0 13.3Z", CD.navy) + path("M3.2 4.35L3.75 4.35Q5.5 6.6 6.1 13.3L5.6 13.3Q5.0 6.6 3.2 4.35Z", CD.yellow),
        over: (cc, L) => cdLogo(cc, L * 0.3, 5.45, 1.05, CD.navy) + letters(cc, 6.7, 8.75, 1.4, cc.firstClass ? "1" : "2", "#ffffff", { weight: 600 }) +
          letters(cc, L - 6.7, 8.75, 1.4, cc.firstClass ? "1" : "2", "#ffffff", { weight: 600 }) };
  }
}

// One section of a multiple unit (low or high floor). o: roof, sill, nose
// (on a cab section), rake, rows, doors, doorFill(c), trucks ([x...] own
// trucks; "end"/"start" for a Jakobs truck shared at that end), wheel, pan
// (x of a pantograph), paint(c, g) for the side, cab(c, g) for more at the
// cab, extra(c, g) for the rest (roof equipment, underfloor, lettering).
export function unit(c, o) {
  const { roof, sill } = o;
  const cabbed = !!o.nose;
  const fill = o.doorFill ? o.doorFill(c) : null;
  return bilevel(cabbed ? { ...c, cabL: true } : { ...c, cabL: false, cabR: false }, {
    roof, sill, cornerR: 1.0, end: 0.6, noTrucks: true, badge: false, nose: o.nose || null,
    drop: o.drop || null, diaphragm: o.diaphragm ?? [sill + 0.2, roof - 1.6], cabLen: cabbed ? o.cabLen ?? 7 : 0,
    rows: o.rows, doors: (o.doors || []).map((d) => (fill && !d.fill ? { ...d, fill } : d)), roofItems: o.roofItems || [],
    paint: (cc, g) => (o.paint ? o.paint(cc, g) : side(c, g.L, { eave: roof - 1.2, low: o.low ?? sill + 1.6, skirt: sill + 0.2 })),
    cab: cabbed ? (cc, g) => screen(c, o.rake[0], o.rake[1], o.depth ?? 2.6, o.surround) + (o.cab ? o.cab(cc, g) : "") : null,
    extra: (cc, g) => (o.trucks || []).map((x) => (x === "end" ? truck(g.L, { wb: 8.5, d: 30, top: sill }) : x === "start" ? truck(0, { wb: 8.5, d: 30, top: sill })
      : truck(x, { wb: 8.5, d: o.wheel ?? 33, top: sill }))).join("") +
      (o.pan != null ? pantograph(o.pan, roof, { up: true, facing: -1 }) + hvLine(o.pan + 3.0, o.pan + 9.0, roof) : "") +
      (cabbed ? front(cc, o, { lampY: o.lampY ?? sill + 1.75, coupler: o.coupler }) : "") + (o.extra ? o.extra(cc, g) : ""),
  });
}
const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
const plug = (x, sill, top, w = 4.4) => ({ x, w, y0: sill, y1: top, leaves: 2, glassY: 0.4, glassH: 0.45 });
// Equipment boxes under a floor, from a to b.
const boxes = (a, b, top, k = 3, depth = 1.3) => underframe(a, b, top, { depth, boxes: k, tanks: false });

// ---------- Locomotives ----------

// Škoda 109E (ČD 380): 18.0 m, Bo'Bo', 1,250 mm wheels; a rounded nose with
// a deep raked windshield. ČD's paint: silver, the machine room between the
// cabs striped in grays like louvers, blue along the bottom and over the
// roof; ČD's mark in red behind the No. 1 cab.
const NOSE_109E = [[1.2, 4.1], [1.0, 6.6], ["q", 1.1, 8.0, 2.2, 9.1], [4.0, 12.3], ["q", 4.6, 12.9, 5.8, 12.9]];
function paint109(c, L) {
  let s = rect(0, 0, L, 20, CD.silver);
  for (let y = 5.85, k = 0; y < 11.3; y += 0.5, k++) s += rect(9.4, y, L - 18.8, 0.25, k % 2 ? "#aeb5bd" : "#bac1c8");
  s += bands(L, [[11.55, 3, CD.blue], [11.35, 0.2, "#e9ecef"], [0, 5.55, CD.blue], [5.55, 0.18, "#e9ecef"], [0, sill109 + 0.35, "#1c2a4a"]]);
  // The blue roof comes down over the cab to the top of the windshield;
  // under the windshield the nose is blue too.
  s += path("M0 11.55L0 13L9.0 13L9.0 11.55Q5.6 11.6 4.4 12.5Z", CD.blue) + path("M0 5.55L0 8.3Q1.6 8.4 2.6 7.2Q3.8 5.6 6.2 5.55Z", CD.blue);
  return s;
}
const sill109 = 4.1;
const over109 = (c, L) => mark(c, 14.2, 9.6, `<rect x="-0.85" y="-0.8" width="1.7" height="1.6" rx="0.2" fill="${CD.red}"/>` + txt(0, -0.02, 0.85, "ČD", "#ffffff", { weight: 800 })) +
  letters(c, L - 15, 4.8, 0.62, "380", "#ffffff", { weight: 600 });
export const loco109E = (c) => euroLoco(c, { roof: 12.9, sill: 4.1, nose: NOSE_109E, rake: [[2.2, 9.1], [4.0, 12.3]], centers: 30, door: 7.0,
  paint: paint109, over: over109, grilles: [[-10.5, 6.0, 7.6, 10.6], [4.5, 6.0, 7.6, 10.6]], grilleFill: "rgba(20,22,25,0.18)" });

// Siemens Vectron: 18.98 m over buffers, Bo'Bo'; a flat, nearly upright
// front under a short raked windshield; louvers high along the middle of
// the side. RegioJet: yellow, black along the bottom and round the cab
// glass, its name in black mid-side. ZSSK (383): red, black below, the
// white ring and "Národný dopravca" behind the No. 1 cab and a panel of
// folk pattern at the other end. Leo Express: graphite, a copper slash
// behind each cab, its name mid-side.
const NOSE_VECTRON = [[1.4, 4.1], [1.4, 7.3], ["q", 1.45, 8.3, 2.1, 9.0], [3.0, 12.3], ["q", 3.3, 12.9, 4.3, 12.9]];
function vectronPaint(c, L) {
  // MÁV's leased multi-system Vectrons (193, photographs at Miskolc-Tiszai
  // and Budapest-Déli, 2024-25): bright blue, black along the bottom, a
  // pale blue-gray panel through the middle of the side carrying MÁV big,
  // three light blue bars across the nose under the windshield.
  if (c.livery === "mav") return bands(L, [[0, 20, MAV.blue], [11.8, 3, "#3c4652"], [0, 5.0, "#1c1d20"], [5.0, 0.16, "#7fb2ea"]]) +
    path(`M14.2 6.2L${L - 14.2} 6.2L${L - 17.2} 11.0L17.2 11.0Z`, "#b9c7d6") +
    [6.0, 6.7, 7.4].map((y) => path(`M0 ${y}L2.0 ${y}L2.2 ${y + 0.35}L0 ${y + 0.35}Z`, "#8cc3f2") + path(`M${L} ${y}L${L - 2.0} ${y}L${L - 2.2} ${y + 0.35}L${L} ${y + 0.35}Z`, "#8cc3f2")).join("");
  // ČD's (its own 383s and 384s and the leased 193s, photographs at Praha
  // hl.n.): ČD blue, navy over the top and the cab's upper half, a white
  // band along the upper side whose ends slant down behind the cabs, the
  // underframe black.
  if (c.agency === "czcd") return bands(L, [[0, 20, CD.blue], [10.9, 3, CD.navy], [0, 4.9, "#1c1d20"]]) +
    path(`M9.5 4.9L12.0 4.9L14.6 8.9L${L - 14.6} 8.9L${L - 12.0} 4.9L${L - 9.5} 4.9L${L - 13.2} 10.9L13.2 10.9Z`, "#f2f4f6") +
    path("M0 10.9L0 8.2L2.4 8.6L4.6 10.9Z", CD.navy) + path(`M${L} 10.9L${L} 8.2L${L - 2.4} 8.6L${L - 4.6} 10.9Z`, CD.navy);
  if (c.agency === "zssk") return bands(L, [[0, 20, ZS.red], [11.8, 3, "#3a3d42"], [0, 5.4, ZS.dark], [5.4, 0.18, "#f4f5f6"]]) +
    path("M0 5.4L0 9.2Q1.4 9.4 2.6 9.4L4.6 5.4Z", ZS.dark);
  if (isLeo(c)) return bands(L, [[0, 20, LEO.graphite], [11.8, 3, LEO.roof], [0, 4.9, "#17181a"]]) +
    path(poly([[10.6, 4.9], [11.8, 4.9], [14.6, 11.8], [13.4, 11.8]]), LEO.copper) + path("M1.9 9.2L3.0 12.5L3.5 12.5L2.4 9.2Z", LEO.copper);
  return bands(L, [[0, 20, RJ.yellow], [11.8, 3, RJ.gray], [0, 5.3, RJ.black], [5.3, 0.16, "#f4f4f2"]]) + path("M0 5.3L0 9.0L2.2 9.0L3.4 5.3Z", RJ.black);
}
function vectronOver(c, L) {
  if (c.livery === "mav") return letters(c, L / 2, 8.6, 2.6, "MÁV", MAV.blue, { weight: 800, spacing: "0.02em" }) + letters(c, L / 2 + 9, 4.4, 0.55, "193", "#ffffff", { weight: 600 });
  if (c.agency === "zssk") {
    let s = zsLogo(c, 15.2, 8.3, 2.0, "#ffffff");
    // The folk-pattern panel: white, a lattice of red diamonds.
    const x = L - 16.0;
    s += rect(x, 6.2, 5.0, 4.6, "#f4f5f6", 0, 'rx="0.2"');
    const segs = [];
    for (let k = 0; k < 5; k++) segs.push([x + k, 6.2, x + k + 1, 10.8], [x + k + 1, 6.2, x + k, 10.8]);
    return s + lines(segs, ZS.red, 1.0) + letters(c, L / 2 + 2, 4.75, 0.55, "383", "#ffffff", { weight: 600 });
  }
  if (isLeo(c)) return leoLogo(c, L / 2, 8.9, 1.9, "#ffffff");
  if (c.agency === "czcd") return cdLogo(c, L / 2 - 6, 9.9, 1.0, CD.navy) + letters(c, L / 2 + 6, 4.4, 0.55, "383", "#ffffff", { weight: 600 });
  return letters(c, L / 2, 8.95, 1.55, "RegioJet", RJ.black, { weight: 800 }) + letters(c, L / 2, 4.7, 0.55, "193", "#f4f4f2", { weight: 600 });
}
export const vectron = (c) => euroLoco(c, { roof: 12.9, sill: 4.1, nose: NOSE_VECTRON, rake: [[2.1, 9.0], [3.0, 12.3]], centers: 32.5, door: 5.6,
  paint: vectronPaint, over: vectronOver, surround: c.livery === "mav" ? "#16181b" : c.agency === "zssk" ? ZS.dark : isLeo(c) ? "#111214" : c.agency === "czcd" ? CD.navy : RJ.black,
  grilles: [[-19.0, 10.0, 9.4, 11.3], [9.0, 10.0, 9.4, 11.3], [-4.0, 8.0, 9.4, 11.3]], grilleFill: "rgba(20,22,25,0.22)" });

// Bombardier (Alstom) TRAXX 3 MS, RegioJet 388.201-231 (2020-2023, the
// mainstay of its long-distance trains and R8; the TRAXX MS2e 386.201-204
// alike, cs.wikipedia "RegioJet" fleet table 6/2026): 18.9 m over the
// buffers, Bo'Bo', bogies 10.44 m apart on 1,250 mm wheels, about 4.28 m
// tall; a flat, upright front under a shallow raked windshield, smooth
// sides with a crew door behind each cab, the machine room's few grilles
// high near the middle, four pantographs' worth of roof gear for its
// four systems. RegioJet's paint (photographs, 388.223 at Ostrava): yellow,
// a silver band along the top of the side that sweeps down behind each
// cab door and wraps the cab's shoulders, the windshield in black, the
// underframe dark gray; "REGIOJET POOL" big along the side, red with
// RegioJet's two red bars ahead of it, POOL in blue.
const NOSE_TRAXX = [[1.2, 4.1], [1.0, 7.7], ["q", 1.05, 8.6, 1.7, 9.1], [2.5, 12.2], ["q", 2.8, 12.9, 3.9, 12.9]];
function traxxPaint(c, L) {
  const silver = "#b7bcc2";
  let s = bands(L, [[0, 20, RJ.yellow], [11.75, 3, silver], [0, 5.0, "#3a3d42"]]);
  // The silver sweep behind each cab, and the cab's black windshield band.
  for (const [a, k] of [[0, 1], [L, -1]]) {
    s += path(`M${a} 11.75L${a} 9.6L${a + k * 2.2} 9.6L${a + k * 6.6} 11.75Z`, silver) +
      path(`M${a + k * 8.6} 11.75L${a + k * 9.4} 11.75L${a + k * 8.6} 5.0L${a + k * 7.8} 5.0Z`, silver);
  }
  return s;
}
const traxxOver = (c, L) => mark(c, L / 2 - 0.8, 7.6, `<path d="M-12.7 -1.5L-12.1 -1.5L-12.1 1.5L-12.7 1.5ZM-11.8 -1.5L-11.2 -1.5L-11.2 1.5L-11.8 1.5Z" fill="${CD.red}"/>` +
  txt(-10.6, 0, 2.2, "REGIOJET", CD.red, { weight: 800, anchor: "start", spacing: "-0.02em" }) + txt(1.4, 0.35, 1.1, "POOL", "#1d3f9e", { weight: 700, anchor: "start" })) +
  letters(c, L / 2, 4.5, 0.5, c.cls || "388", "#f4f4f2", { weight: 600 });
export const traxx = (c) => euroLoco(c, { roof: 12.9, sill: 4.1, nose: NOSE_TRAXX, rake: [[1.7, 9.1], [2.5, 12.2]], centers: 34.25, door: 5.4, wheel: 49,
  paint: traxxPaint, over: traxxOver, surround: "#141518", grilles: [[-6.0, 5.0, 10.0, 11.4], [1.0, 5.0, 10.0, 11.4]], grilleFill: "rgba(20,22,25,0.18)" });

// Škoda 69E "Eso" (ČSD E 499.3, 1980-1990, 181 built: ČD 363.001-181,
// many rebuilt for 140 km/h as 362; ZSSK's 363s and their rebuilds; the DC
// 163/162 are the same body): 16.8 m over the buffers, about 4.2 m to the
// roof, Bo'Bo' on 1,250 mm wheels, bogies about 8.6 m apart, 87 t
// (en.wikipedia "ČD Class 363"). A flat front with two big windshield panes
// leaning back a little, the headlights in a box between them and lamp
// pairs low; a crew door behind each cab, the machine room's long run of
// dark windows high on the side, ribbed panels below; two pantographs. ČD
// still runs them on R and some Ex trains (Prague-České Budějovice, -Plzeň,
// -Břeclav, Ústí-Cheb, Brno-Olomouc). ČD's paint: blue, a cream band across
// the middle, the roof pale gray; ZSSK's: white over a red lower half.
const NOSE_ESO = [[0.95, 4.1], [0.8, 8.5], [1.25, 12.0], ["q", 1.35, 12.9, 2.4, 12.9]];
const esoPaint = (c, L) => c.agency === "zssk"
  ? bands(L, [[0, 20, ZS.white], [11.9, 3, "#c9ced4"], [0, 7.6, ZS.red], [7.6, 0.2, "#f4f5f6"], [0, 4.6, "#2a2d31"]])
  : bands(L, [[0, 20, "#2f5fb8"], [11.9, 3, "#d6d9dc"], [6.7, 1.95, "#ece3c4"], [0, 4.6, "#1f3f80"]]) +
    lines([4.9, 5.4, 5.9, 6.3].map((y) => [8.5, y, L - 8.5, y]), "rgba(0,0,0,0.18)", 0.5);
const esoOver = (c, L) => (c.agency === "zssk" ? zsLogo(c, L / 2, 6.1, 0.6, "#ffffff", false) : cdLogo(c, 3.6, 7.7, 0.9, "#16181b", false)) +
  letters(c, 3.6, 5.6, 0.45, c.agency === "zssk" ? "363" : "362", "#ffffff", { weight: 700 });
export const eso = (c) => euroLoco(c, { roof: 12.9, sill: 4.1, nose: NOSE_ESO, rake: [[0.85, 8.6], [1.25, 12.0]], centers: 28.2, door: 4.6, wheel: 49,
  paint: esoPaint, over: esoOver, surround: "#1d2026", grilles: [[-(c.L / 2 - 7.6), c.L - 15.2, 8.9, 11.5]], grilleFill: "rgba(20,22,25,0.72)" });

// ---------- Coaches ----------

// ČD's railjets: Siemens Viaggio coaches, longer windows; the driving
// trailer's rounded cab end, navy edged in yellow, at the back of the train.
const RJ_ROWS = (L) => [{ a: 6.0, b: L - 6.0, y: 7.2, w: 5.2, h: 3.1, pitch: 6.45, r: 0.5 }];
export const rjCoach = (c) => euroCoach({ ...c, agency: "czcd", firstClass: c.index === 1 }, { rows: RJ_ROWS(c.L) });
export const cjCoach = (c) => euroCoach({ ...c, agency: "czcd", livery: "comfortjet" }, { rows: RJ_ROWS(c.L) });
export const cjCab = (c) => euroCoach({ ...c, agency: "czcd", livery: "comfortjet" }, { rows: RJ_ROWS(c.L),
  cab: () => path(poly([[1.0, 8.6], [2.6, 11.6], [5.4, 11.6], [5.4, 8.6]]), C.glass) + path(poly([[0.75, 8.3], [0.75, 11.9], [2.4, 12.2], ["q", 1.0, 11.6, 0.75, 8.3]]), "#111214") +
    rect(3.2, 11.1, 1.9, 0.3, "#f39a26", 0, 'opacity="0.9"') + line(1.6, 8.8, 2.3, 10.4, "#0d0f12", 0.7) });
export const rjCab = (c) => euroCoach({ ...c, agency: "czcd" }, { rows: RJ_ROWS(c.L),
  cab: () => path(poly([[1.0, 8.6], [2.6, 11.6], [5.4, 11.6], [5.4, 8.6]]), C.glass) + path(poly([[0.75, 8.3], [0.75, 11.9], [2.4, 12.2], ["q", 1.0, 11.6, 0.75, 8.3]]), "#111214") +
    rect(3.2, 11.1, 1.9, 0.3, "#f39a26", 0, 'opacity="0.9"') + line(1.6, 8.8, 2.3, 10.4, "#0d0f12", 0.7) });

// ---------- Multiple units ----------

// Pendolino (ČD 680): seven cars, 185.3 m; a long tapered nose; a narrow
// body for tilting; small windows in a dark band. Silver, a turquoise band
// low on the side over navy, yellow round the lamps at the nose; ČD's mark
// in teal.
const NOSE_680 = [[1.0, 3.6], [0.8, 5.4], ["q", 0.9, 7.0, 2.6, 8.3], [8.8, 11.9], ["q", 10.4, 12.7, 12.8, 12.7]];
const pendoPaint = (cab) => (c, g) => bands(g.L, [[0, 20, CD.silver], [11.7, 3, "#e3e6e9"], [6.95, 3.05, "#2e4152"], [4.55, 1.05, "#2fb0d6"], [3.9, 0.65, "#1c3a6a"], [0, 3.9, "#2a2d31"]]) +
  (cab ? path("M0 5.0L7.6 5.0Q9.8 5.0 11.6 4.55L13.2 4.55L13.2 5.6L11.6 5.6Q9.8 6.15 7.6 6.15L0 6.15Z", CD.yellow) + path("M0 6.95L0 12.7L4 12.7L13.6 6.95Z", CD.silver) : "");
const pendoRoof = (L, a) => rect(a, 12.65, L - a - 2, 0.35, "#c3c8ce", 0.4, 'rx="0.17"') + hvac(L / 2 - 6, 12.7, 12, 0.6);
export const pendolinoCab = (c) => unit(c, { roof: 12.7, sill: 3.6, nose: NOSE_680, rake: [[2.6, 8.3], [8.8, 11.9]], depth: 3.4, cabLen: 14, lampY: 5.3,
  rows: [{ xs: seq(17.0, 5.6, 12), y: 7.25, w: 4.2, h: 2.4, r: 0.35 }], doors: [plug(14.2, 3.6, 10.6, 2.4), plug(c.L - 4.2, 3.6, 10.6, 2.4)],
  trucks: [12.0, c.L - 10.0], wheel: 36, paint: pendoPaint(true), doorFill: () => "#d6dade",
  extra: (cc, g) => pendoRoof(g.L, 14) + boxes(18, g.L - 16, 3.6, 3, 1.2) + cdLogo(cc, 32, 6.2, 0.95, "#1f8fa8") + letters(cc, 70, 6.25, 0.7, "SuperCity", "#1c3a6a", { weight: 700, style: "italic" }) });
export const pendolinoMid = (c) => unit(c, { roof: 12.7, sill: 3.6,
  rows: [{ xs: seq(6.8, 5.6, 13), y: 7.25, w: 4.2, h: 2.4, r: 0.35 }], doors: [plug(1.6, 3.6, 10.6, 2.4), plug(c.L - 4.0, 3.6, 10.6, 2.4)],
  trucks: [10.0, c.L - 10.0], wheel: 36, paint: pendoPaint(false), doorFill: () => "#d6dade", pan: c.pan ? c.L / 2 - 6 : null,
  extra: (cc, g) => pendoRoof(g.L, 2) + boxes(16, g.L - 16, 3.6, 3, 1.2) + (cc.index === 3 ? letters(cc, g.L / 2, 6.25, 0.6, "bistro", "#1c3a6a", { weight: 600 }) : "") });

// CityElefant (ČD 471, ZSSK 671): three double-deck cars of 26.4 m, the
// power car (471) and cab trailer (971) at the ends; a low floor between
// the trucks, two double doors a side, windows on both decks and on the
// intermediate level over each truck. ČD: silver, the lower deck blue
// under red, a white line between; at the cab the bands sweep up toward
// the windshield, the name on the blue; the cab in dark gray round the
// glass, yellow under the nose. ZSSK (671): white, the lower deck and the
// cab red.
const ELE = { roof: 15.2, sill: 3.7, drop: (L) => ({ a: 14.6, b: L - 14.6, y: 1.6 }) };
const NOSE_471 = [[1.3, 3.7], [1.2, 6.8], ["q", 1.3, 8.2, 2.2, 9.4], [4.6, 14.0], ["q", 5.4, 15.2, 7.2, 15.2]];
function elePaint(cab) {
  return (c, g) => {
    const L = g.L;
    if (c.agency === "zssk") {
      let s = bands(L, [[0, 20, ZS.white], [14.25, 3, ZS.gray], [4.35, 3.15, ZS.red], [7.5, 0.18, ZS.red], [0, 2.4, "#2a2d31"]]) + rect(17.0, 10.55, L - 34.0, 3.0, "#141619", 0, 'rx="0.4"');
      if (cab) s += path("M0 7.5L0 15.4L9.6 15.4L9.6 10.3Q9.4 8.9 7.6 8.4Z", ZS.red) + rect(0, 3.7, 4.0, 0.8, "#f5c400");
      return s;
    }
    if (!cab) return bands(L, [[0, 20, "#d5d9dd"], [14.25, 3, "#e9ecef"], [2.4, 3.55, "#2b4fa0"], [5.95, 0.24, "#f4f6f8"], [6.19, 2.2, CD.red], [0, 2.4, "#3a3f45"]]) +
      rect(17.0, 10.55, L - 34.0, 3.0, "#141619", 0, 'rx="0.4"');
    // At the cab the red and the blue under it sweep up toward the
    // windshield, the white line between them, a pale blue streak over the red.
    const top = `L18 8.39C12 8.39 8.5 10.5 6.4 13.6`, mid = `C7.0 7.6 11.0 5.95 18 5.95L${L + 1} 5.95`;
    let s = bands(L, [[0, 20, "#d5d9dd"], [14.25, 3, "#e9ecef"], [0, 2.4, "#3a3f45"]]) + rect(17.0, 10.55, L - 34.0, 3.0, "#141619", 0, 'rx="0.4"');
    s += path(`M${L + 1} 8.39${top}L4.4 10.2${mid}Z`, CD.red) + path(`M${L + 1} 5.95L18 5.95C11.0 5.95 7.0 7.6 4.4 10.2L1.6 6.2L2.6 2.4L${L + 1} 2.4Z`, "#2b4fa0");
    s += path(`M4.4 10.2${mid}`, "none", 0, 'stroke="#f4f6f8" stroke-width="0.26"') + path("M6.9 13.9C9.0 11.0 12.0 9.05 19.5 8.9", "none", 0, 'stroke="#9cc4ea" stroke-width="0.45"');
    s += path("M0 6.4L0 14.6L5.4 14.6L5.4 9.0Q4.0 7.0 2.4 6.4Z", "#4a4f57") + rect(0, 3.7, 4.2, 0.75, CD.yellow);
    return s;
  };
}
const eleRows = (L, a = 6.2) => [{ xs: seq(17.6, 5.4, Math.floor((L - 35.2) / 5.4) + 1), y: 10.75, w: 4.4, h: 2.6, r: 0.4 },
  { xs: seq(22.6, 5.5, Math.floor((L - 45.2) / 5.5) + 1), y: 4.6, w: 4.4, h: 2.6, r: 0.4 }, { xs: [a, L - a - 4.2], y: 7.4, w: 4.2, h: 2.8, r: 0.4 }];
const eleDoors = (L) => [plug(16.2, 1.7, 9.2, 4.8), plug(L - 21.0, 1.7, 9.2, 4.8)];
const eleTrucks = (L) => [8.0, L - 8.0];
// The double-deck roof: air-conditioning over each deck's ends.
const eleRoof = (L) => hvac(17, 15.2, 10) + hvac(L - 27, 15.2, 10);
const eleName = (c, x) => (c.agency === "zssk" ? letters(c, x, 3.35, 0.8, "ZSSK", ZS.red, { weight: 800 })
  : mark(c, x, 3.4, txt(-0.35, 0, 0.95, "city", "#ffffff", { weight: 500, anchor: "end" }) + txt(-0.3, 0, 1.15, "Elefant", "#ffffff", { weight: 700, anchor: "start" })));
const eleLogo = (c, x) => (c.agency === "zssk" ? zsLogo(c, x, 9.0, 0.6, ZS.red, false) : cdLogo(c, x, 9.0, 0.9, CD.navy, false));
const elefantCab = (c, pan) => unit(c, { roof: ELE.roof, sill: ELE.sill, drop: ELE.drop(c.L), nose: NOSE_471, rake: [[2.2, 9.4], [4.6, 14.0]], cabLen: 8,
  rows: eleRows(c.L, 9.4), doors: eleDoors(c.L), trucks: eleTrucks(c.L), wheel: 36, paint: elePaint(true), diaphragm: [3.9, 13.6], lampY: 5.6,
  surround: "#1d2024", doorFill: (cc) => (cc.agency === "zssk" ? ZS.red : null),
  pan: pan ? 22.0 : null,
  extra: (cc, g) => eleRoof(g.L) + (pan ? rect(32, 15.15, 8, 0.6, C.steelDark, 0.4, 'rx="0.2"') : "") + boxes(2.5, 4.4, 3.7, 1, 0.8) + boxes(g.L - 4.4, g.L - 2.5, 3.7, 1, 0.8) +
    eleName(cc, 43) + eleLogo(cc, g.L - 26) });
export const elefant471 = (c) => elefantCab(c, true);
export const elefant971 = (c) => elefantCab(c, false);
export const elefant071 = (c) => unit(c, { roof: ELE.roof, sill: ELE.sill, drop: ELE.drop(c.L), rows: eleRows(c.L), doors: eleDoors(c.L),
  trucks: eleTrucks(c.L), wheel: 36, paint: elePaint(false), diaphragm: [3.9, 13.6], doorFill: (cc) => (cc.agency === "zssk" ? ZS.red : null),
  extra: (cc, g) => eleRoof(g.L) + eleName(cc, 43) + eleLogo(cc, 11.5) });

// RegioPanter (Škoda 7Ev: ČD 640 and 650, Arriva's 650s, ZSSK 661): cars of
// 26.45 m on their own trucks, low floor at the doors; a blunt nose under a
// big windshield; two double doors a side; air-conditioning and the
// traction equipment on the roof. ČD: white cab ends and roof, the side
// blue from just behind the cab under a yellow line, a navy skirt, yellow
// under the nose; ČD's mark and the name in white below the windows.
// Arriva: aqua, white at the cab and two white lines low. ZSSK (661):
// white, a red window band, the cab and doors red.
const NOSE_PANTER = [[1.2, 3.0], [1.0, 5.8], ["q", 1.1, 7.2, 2.0, 8.3], [4.2, 12.9], ["q", 4.9, 13.9, 6.6, 13.9]];
// ČD's regional blue on a section: blue from low to top behind a white cab
// (cab: the x where the blue begins), a yellow line on top, a navy skirt.
function cdBlue(L, { cab = null, low, top, skirt, sill, roofY }) {
  let s = bands(L, [[0, 20, CD.white], [roofY, 3, "#c9ced4"]]);
  s += cab == null ? rect(-1, low, L + 2, top - low, CD.blue) + rect(-1, top, L + 2, 0.22, CD.yellow)
    : path(`M${cab + 1.4} ${low}L${L + 1} ${low}L${L + 1} ${top}L${cab - 0.5} ${top}Q${cab - 0.4} ${(low + top) / 2} ${cab + 1.4} ${low}Z`, CD.blue) + rect(cab - 0.5, top, L - cab + 1.5, 0.22, CD.yellow);
  s += rect(-1, 0, L + 2, skirt, CD.navy) + rect(-1, skirt, L + 2, 0.2, "#dfe5ec");
  if (cab != null) s += rect(-1, sill - 0.1, 5.2, 0.7, CD.yellow);
  return s;
}
function panterPaint(cab) {
  return (c, g) => {
    const L = g.L;
    // Moravia (Škoda, the South Moravian Region's 530 four-car and 550 two-
    // car units of the RegioPanter family, 2022-23, run by ČD on Brno's S2,
    // S3 and S51; cs.wikipedia "Moravia (elektrická jednotka)", photographs):
    // raspberry red, the windows in a black band, a white band under them
    // that rises toward the car ends, red doors, a dark skirt.
    if (c.livery === "jmk") return bands(L, [[0, 20, "#c42a4c"], [12.9, 3, "#c9ced4"], [0, 3.95, "#2a2d31"]]) +
      path(`M-1 4.3L${L + 1} 4.3L${L + 1} 6.3Q${L / 2} 5.6 -1 6.6Z`, "#f4f5f6") + rect(-1, 6.25, L + 2, 4.35, "#16181b") +
      (cab ? path("M0 3.95L0 14L7.6 14L7.6 4.6Q6.0 3.95 4.0 3.95Z", "#c42a4c") : "");
    if (c.agency === "zssk") return bands(L, [[0, 20, ZS.white], [12.9, 3, ZS.gray], [5.9, 4.8, ZS.red], [0, 3.9, "#2a2d31"], [3.9, 0.15, ZS.red]]) +
      (cab ? path("M0 5.9L0 14L8.4 14L8.4 6.4Q8.0 5.9 7.0 5.9Z", ZS.red) : "");
    if (c.agency === "czarriva") return bands(L, [[0, 20, ARRIVA.aqua], [12.9, 3, "#c9ced4"], [0, 3.9, ARRIVA.skirt], [4.2, 0.22, ARRIVA.white], [4.65, 0.22, ARRIVA.white]]) +
      (cab ? path("M0 3.9L0 14L6.2 14Q8.6 9 6.4 3.9Z", ARRIVA.white) : "");
    return cdBlue(L, { cab: cab ? 8.0 : null, low: 4.35, top: 11.25, skirt: 4.1, sill: 3.0, roofY: 12.9 });
  };
}
const panterFill = (c) => (c.agency === "zssk" ? ZS.red : c.livery === "jmk" ? "#c42a4c" : null);
const panterName = (c, x) => (c.livery === "jmk" ? letters(c, x, 5.1, 0.75, "Jihomoravský kraj", "#16181b", { weight: 600 })
  : c.agency === "czcd" || !c.agency ? cdLogo(c, x, 5.35, 1.1, "#ffffff") : c.agency === "czarriva" ? letters(c, x, 5.6, 1.3, "arriva", "#ffffff", { weight: 700 })
  : zsLogo(c, x, 11.6, 0.55, ZS.red, false) + letters(c, x + 1.0, 11.65, 0.7, "ZSSK", ZS.red, { anchor: "start", weight: 800 }));
const panterRoof = (L, items) => items.map(([x, w]) => hvac(x, 13.9, w)).join("");
export const panterCab = (c) => unit(c, { roof: 13.9, sill: 3.0, nose: NOSE_PANTER, rake: [[2.0, 8.3], [4.2, 12.9]], cabLen: 8,
  rows: [{ xs: seq(19.0, 6.4, 5), y: 6.4, w: 5.6, h: 3.8, r: 0.45 }, { xs: [9.6, c.L - 7.4], y: 6.4, w: 3.6, h: 3.8, r: 0.45 }],
  doors: [plug(13.8, 3.0, 10.5), plug(c.L - 13.2, 3.0, 10.5)], trucks: [9.5, c.L - 8.0], paint: panterPaint(true), doorFill: panterFill,
  surround: c.agency === "zssk" ? "#1d1e20" : undefined,
  pan: c.index === 0 && c.count === 2 ? 44 : null,
  extra: (cc, g) => panterRoof(g.L, [[18, 13], [g.L - 26, 10]]) + boxes(25, g.L - 18, 3.0, 2, 0.6) + panterName(cc, 30) +
    (cc.livery === "jmk" ? letters(cc, 58, 5.1, 0.85, "Moravia", "#16181b", { weight: 700 })
      : cc.agency === "czcd" || !cc.agency ? letters(cc, 58, 5.35, 0.85, "RegioPanter", "#ffffff", { weight: 600 }) : "") });
export const panterMid = (c) => unit(c, { roof: 13.9, sill: 3.0,
  rows: [{ xs: seq(17.6, 6.4, 7), y: 6.4, w: 5.6, h: 3.8, r: 0.45 }, { xs: [3.0, c.L - 6.6], y: 6.4, w: 3.6, h: 3.8, r: 0.45 }],
  doors: [plug(9.4, 3.0, 10.5), plug(c.L - 13.8, 3.0, 10.5)], trucks: [8.0, c.L - 8.0], paint: panterPaint(false), doorFill: panterFill, pan: c.L / 2 - 8,
  extra: (cc, g) => panterRoof(g.L, [[3.5, 10], [g.L - 14, 10]]) + boxes(18, g.L - 18, 3.0, 2, 0.6) + panterName(cc, 40) });
// InterPanter (Škoda 7Ev for long distance, ČD 660.0 three-car and 660.1
// five-car, 2015-16, 4 and 10 units; Brno-Olomouc R13 and other R lines,
// railwaygazette.com 2015, ceskedrahy.cz): the RegioPanter's cars in the
// same paint, seated for long trips: a single door a side in each car,
// toward its inner end, a window row from the cab to the door, the name in
// white.
export const interCab = (c) => unit(c, { roof: 13.9, sill: 3.0, nose: NOSE_PANTER, rake: [[2.0, 8.3], [4.2, 12.9]], cabLen: 8,
  rows: [{ xs: seq(12.6, 6.4, 8), y: 6.4, w: 5.6, h: 3.8, r: 0.45 }, { xs: [9.0, c.L - 7.4], y: 6.4, w: 3.0, h: 3.8, r: 0.45 }],
  doors: [plug(c.L - 13.2, 3.0, 10.5)], trucks: [9.5, c.L - 8.0], paint: panterPaint(true),
  extra: (cc, g) => panterRoof(g.L, [[18, 13], [g.L - 26, 10]]) + boxes(25, g.L - 18, 3.0, 2, 0.6) + panterName(cc, 30) +
    letters(cc, 58, 5.35, 0.85, "InterPanter", "#ffffff", { weight: 600 }) });
export const interMid = (c) => unit(c, { roof: 13.9, sill: 3.0,
  rows: [{ xs: seq(3.4, 6.4, 10), y: 6.4, w: 5.6, h: 3.8, r: 0.45 }, { xs: [c.L - 6.6], y: 6.4, w: 3.6, h: 3.8, r: 0.45 }],
  doors: [plug(c.L - 13.8, 3.0, 10.5)], trucks: [8.0, c.L - 8.0], paint: panterPaint(false), pan: c.index % 2 ? c.L / 2 - 8 : null,
  extra: (cc, g) => panterRoof(g.L, [[3.5, 10], [g.L - 14, 10]]) + boxes(18, g.L - 18, 3.0, 2, 0.6) + panterName(cc, 40) });

// RegioShark (Pesa Link, ČD 844): two cars, 43.73 m, a diesel under each;
// a rounded nose; one double door a side in each car, near the coupling.
// Blue over the windows and roof edge, a pale gray band under them with the
// name in blue, navy below; the lower nose white up to the windshield.
const NOSE_LINK = [[1.3, 2.9], [1.1, 5.5], ["q", 1.2, 7.3, 2.4, 8.6], [4.6, 12.3], ["q", 5.3, 13.3, 7.0, 13.3]];
const sharkPaint = (c, g) => bands(g.L, [[0, 20, CD.shark], [12.35, 3, "#b9c0c8"], [3.75, 2.05, "#e7eaed"], [0, 3.75, CD.navy]]) +
  path("M0 0L0 8.9Q3.4 8.9 6.0 7.2Q8.2 5.8 11.5 5.8L11.5 0Z", "#e7eaed") + rect(-1, 2.9, 4.6, 0.6, CD.yellow);
export const linkCar = (c) => unit(c, { roof: 13.3, sill: 2.9, nose: NOSE_LINK, rake: [[2.4, 8.6], [4.6, 12.3]], cabLen: 8, lampY: 5.0,
  rows: [{ xs: seq(10.0, 6.1, 6), y: 6.2, w: 5.0, h: 3.6, r: 0.45 }, { xs: [c.L - 6.4], y: 6.2, w: 3.4, h: 3.6, r: 0.45 }],
  doors: [plug(c.L - 13.6, 2.9, 10.2)], trucks: [10.0, c.L - 9.0], paint: sharkPaint,
  extra: (cc, g) => hvac(14, 13.3, 12) + exhaust(34, 13.3) + rect(38, 13.25, 6, 0.6, C.steelDark, 0.4, 'rx="0.25"') +
    boxes(16, 30, 2.9, 2, 1.1) + tank(31, 38, 2.9, 1.4) + boxes(39, g.L - 15, 2.9, 1, 1.0) +
    mark(cc, 27, 4.78, txt(0, 0, 1.15, "RegioShark", CD.shark, { weight: 700 })) + cdLogo(cc, 47, 11.1, 0.85, "#ffffff", false) });

// RegioFox (Pesa Link II, ČD 847.001-106, 2022-2026, the commonest new
// diesel on ČD's branch and regional lines): two cab sections on a shared
// Jakobs truck, 44.465 m over the couplers (22.23 m a section), 4.28 m
// tall, floor 600 mm above the rail between the trucks; a powered truck
// under each cab (2.4 m wheelbase, 780 mm wheels) 17.04 m from the Jakobs
// truck (2.9 m), an MTU power pack and fuel tank under each section, the
// cooling and air-conditioning modules on the roof; a rounded nose under a
// big wraparound windshield; one double plug door a side in each section,
// toward the joint, the toilet's small window beyond it (cs.wikipedia,
// "Motorová jednotka 847"; photographs). ČD's paint (the Najbrt studio's):
// white below the windows, ČD blue through the window band, the roof and
// the cab's upper half navy, a navy line along the skirt, "RegioFox" in
// blue behind the cab. PID's (Prague and Central Bohemia, cs: "červeno-
// šedý"): pale gray, a black window band, red around the door and on the
// nose's corner, "pid" in red.
const NOSE_FOX = [[1.5, 2.4], [1.15, 5.2], ["q", 1.2, 7.4, 2.7, 8.9], [5.2, 12.8], ["q", 6.1, 14.04, 8.0, 14.04]];
const FOXD = { roof: 14.04, sill: 2.4, door: 40.0 };
function foxPaint(c, g) {
  const L = g.L, pid = c.livery === "pid";
  if (pid) {
    return bands(L, [[0, 20, "#e6e8ea"], [12.7, 3, "#c9cdd2"], [0, 2.75, "#3a3d42"]]) +
      rect(FOXD.door - 6.2, 2.75, 17.0, 10.0, CD.red) + rect(9.6, 6.25, L - 9.6, 3.95, "#16181b") +
      path("M0 2.75L0 6.2L3.2 6.2Q2.5 4.4 3.0 2.75Z", CD.red);
  }
  return bands(L, [[0, 20, CD.white], [12.6, 3, CD.navy], [6.0, 6.6, CD.blue], [0, 2.75, CD.navy]]) +
    // The cab: navy over the windshield and down its sides to the waist,
    // white below, the blue beginning behind the cab door.
    path("M0 7.6Q4.4 7.4 6.6 6.0L9.8 6.0L9.8 14.2L0 14.2Z", CD.navy) + rect(9.8, 6.0, 0.3, 6.6, CD.white);
}
const foxDoor = (x) => plug(x, 2.45, 10.6, 4.4);
const foxRows = [{ xs: [10.5], y: 7.0, w: 2.4, h: 3.0, r: 0.4 }, { xs: seq(13.6, 5.8, 4), y: 6.5, w: 4.8, h: 3.6, r: 0.45 },
  { xs: [36.8], y: 6.5, w: 2.0, h: 3.6, r: 0.4 }, { xs: [46.8, 56.8, 62.6], y: 6.5, w: 4.8, h: 3.6, r: 0.45 }, { xs: [52.9], y: 8.5, w: 1.6, h: 1.6, r: 0.3 }];
export const fox = (c) => unit(c, { roof: FOXD.roof, sill: FOXD.sill, nose: NOSE_FOX, rake: [[2.7, 8.9], [5.2, 12.8]], depth: 2.9, cabLen: 9, lampY: 4.7,
  rows: foxRows, doors: [foxDoor(FOXD.door)], diaphragm: [2.6, 12.6], paint: foxPaint,
  surround: c.livery === "pid" ? "#16181b" : CD.navy,
  // Its own trucks (the motor truck under the cab, the Jakobs truck shared at
  // the joint); the power pack and fuel tank between them and the door, the
  // battery and air boxes under the low floor; on the roof the engine's
  // cooling module and exhaust behind the cab, air-conditioning over the
  // saloon, the brake resistor toward the joint.
  extra: (cc, g) => truck(17.1, { wb: 7.9, d: 30.7, top: FOXD.sill }) + truck(g.L, { wb: 9.5, d: 30.7, top: FOXD.sill }) +
    boxes(22.0, 31.0, FOXD.sill, 1, 1.3) + tank(31.4, 37.6, FOXD.sill, 0.9) + boxes(45.5, 62.0, FOXD.sill - 0.3, 3, 0.5) +
    rect(12.5, FOXD.roof - 0.05, 13.0, 1.15, C.steelDark, 0.4, 'rx="0.3"') + slats(13.2, FOXD.roof + 0.2, 11.6, 0.75, 0.42, "rgba(0,0,0,0.3)") + exhaust(25.0, FOXD.roof) +
    hvac(36.0, FOXD.roof, 11.0, 0.8) + rect(52.0, FOXD.roof - 0.05, 9.0, 0.55, C.steelDark, 0.4, 'rx="0.2"') +
    (cc.livery === "pid"
      ? letters(cc, 23.0, 4.4, 1.6, "pid", CD.red, { weight: 700 }) + letters(cc, 42.2, 11.4, 0.5, "Pražská integrovaná doprava", "#3a3d42", { weight: 600 })
      : mark(cc, 22.0, 4.55, txt(0, 0, 1.2, "Regio", CD.blue, { weight: 500, anchor: "end" }) + txt(0, 0, 1.2, "Fox", CD.blue, { weight: 800, anchor: "start" })) +
        cdLogo(cc, 64.0, 4.6, 0.85, CD.navy, false)) });

// The Studénka railcars (Moravskoslezská vagónka): the 842 (37, 1988-94,
// 842.001-037) and the 843 (31, 1995-97, 843.001-031) with its 943
// driving trailers (2006-07). Each 25.2 m over the buffers, about 4.24 m
// tall, floor 1.3 m up; bogies 17 m apart on 840 mm wheels; a flat cab end
// at both ends of the railcars, three windshield panes under the headlight
// box, buffers and a screw coupling; a two-leaf folding door a side behind
// each cab (the 843's at the No. 1 end opens into its luggage room, with a
// wheelchair lift), wide windows between; the engine and transmission
// under the floor, its radiators and exhaust in a long roof housing at one
// end (cs.wikipedia, "Motorový vůz 842", "Motorový vůz 843"; photographs).
// ČD's paint: sky blue down to the waist, a navy line there, white below
// and a navy skirt; yellow along the buffer beam; ČD's mark under the
// windshield and on the side.
const NOSE_STUD = [[0.75, 4.1], [0.62, 12.2], ["q", 0.7, 13.9, 2.6, 13.9]];
const studPaint = (c, g) => bands(g.L, [[0, 20, "#eef0f2"], [7.2, 8, "#3f8bdc"], [13.1, 3, "#4e5560"], [6.75, 0.45, CD.navy], [0, 4.55, CD.navy]]) +
  rect(-1, 4.1, 3.2, 0.5, CD.yellow);
const studDoor = (x) => ({ x, w: 4.1, y0: 4.25, y1: 11.3, leaves: 2, glassY: 0.42, glassH: 0.42 });
const studRows = (wins) => [{ xs: [2.7], y: 8.0, w: 2.3, h: 2.9, r: 0.35 }, { xs: wins, y: 7.6, w: 3.9, h: 3.1, r: 0.35 }];
function studCar(c, { engine, full = false }) {
  return unit(c, { roof: 13.9, sill: 4.1, nose: NOSE_STUD, rake: [[0.68, 8.4], [0.66, 12.3]], depth: 0.5, cabLen: 2, lampY: 5.3, coupler: "buffers",
    rows: studRows(full ? seq(15.6, 5.25, 10) : seq(15.6, 5.25, 5)), doors: full ? [studDoor(9.4), studDoor(c.L - 13.5)] : [studDoor(9.4)],
    paint: studPaint, surround: "#1d2026", diaphragm: [4.3, 12.4],
    extra: (cc, g) => {
      let s = truck(13.4, { wb: 8.5, d: 33, top: 4.1 }) + buffers(g.L, 1, { sill: 4.1 }) + lines([[0.3, 13.2, g.L - 0.3, 13.2]], "rgba(0,0,0,0.25)", 0.5);
      if (engine) {
        // The engine and gearbox between the trucks, the fuel tank beside
        // them; the radiator housing and exhaust on the roof over them.
        s += boxes(18.5, 30.0, 4.1, 2, 1.5) + tank(30.5, 36.5, 4.1, 2.2) + rect(4.0, 13.85, 17.0, 0.95, C.steelDark, 0.4, 'rx="0.35"') +
          slats(5.0, 14.0, 15.0, 0.65, 0.42, "rgba(0,0,0,0.3)") + exhaust(21.5, 13.9);
      } else s += boxes(20.0, 34.0, 4.1, 2, 1.0) + hvac(6.0, 13.9, 9.0, 0.55);
      return s + letters(cc, 30.0, 6.0, 0.62, cc.cls || "", CD.navy, { weight: 700 });
    } });
}
// Railcars: one half drawn, mirrored for the other end; the second truck and
// the logo over both.
const studTwin = (c, engine) => twinEnded(c, (h) => studCar(h, { engine })) + cdLogo(c, c.L / 2, 5.6, 0.85, CD.navy, false);
export const car842 = (c) => studTwin(c, true);
export const car843 = (c) => studTwin(c, true);
// The 943 driving trailer: the same body with one cab, no engine.
export const car943 = (c) => studCar(c, { engine: false, full: true }) + truck(c.L - 13.4, { wb: 8.5, d: 33, top: 4.1 }) + boxes(48.0, 62.0, 4.1, 2, 0.9) +
  cdLogo(c, c.L / 2, 5.6, 0.85, CD.navy, false);

// Regionova (ČD 814): two-axle railbus cars of 14.22 m rebuilt from class
// 810 railbuses; an upright new cab, a folding door behind it. ČD's
// regional yellow and green: green below a wave that rises to the cab, the
// name in white on the green.
export function axle(x, sill) {
  return rect(x - 2.6, 1.6, 5.2, 0.32, "currentColor", 0, 'opacity="0.8"') + circle(x, 1.25, 1.25, "currentColor") + circle(x, 1.25, 1.02, "none", 0, `stroke="${C.steelDark}" stroke-width="0.5" ${STROKE}`) +
    circle(x, 1.25, 0.33, C.steelDark) + rect(x - 0.55, 0.85, 1.1, 0.8, C.steelDark, 0, 'rx="0.14"') + rect(x - 1.2, 1.95, 2.4, sill - 1.95, "currentColor", 0, 'opacity="0.8"') +
    // The leaf spring over the axle box, hung from brackets at each end.
    path(`M${n(x - 2.4)} 2.35Q${n(x)} 1.55 ${n(x + 2.4)} 2.35L${n(x + 2.4)} 2.6Q${n(x)} 1.85 ${n(x - 2.4)} 2.6Z`, C.steelDark) +
    rect(x - 2.7, 2.3, 0.35, sill - 2.3, "currentColor") + rect(x + 2.35, 2.3, 0.35, sill - 2.3, "currentColor");
}
// The 810 railbus itself (Vagónka Studénka, 1975-1982, 810.001-679; about
// 40 still in ČD's regular service in 2026, on Central Bohemian, Olomouc-
// region, Karlovy Vary and seasonal branch lines, cs.wikipedia "Motorový
// vůz 810", fdrive.cz 2026) and its Btax trailer (ex-010): 13.97 m over the
// buffers, two axles 6.6 m apart under a body like the Regionova's; a flat
// cab at each end with two big windshield panes, the headlight in a pod on
// the roof's edge and lamp pairs at the waist; a one-leaf folding door at
// each end of the side, six wide windows between. Most still wear the
// railbuses' red with a cream band under the windows (others ČD's blue).
const NOSE_810 = [[0.75, 3.9], [0.6, 10.4], ["q", 0.65, 11.6, 2.2, 11.6]];
const paint810 = (c, g) => bands(g.L, [[0, 20, "#b3202c"], [5.55, 1.95, "#ecdcb0"], [10.95, 3, "#c9c4b8"], [0, 3.95, "#8c1a24"]]);
const rows810 = (xs) => [{ xs, y: 7.65, w: 4.3, h: 2.75, r: 0.35 }];
const door810 = (x) => ({ x, w: 2.5, y0: 3.95, y1: 10.2, leaves: 1, glassY: 0.5, glassH: 0.38 });
const half810 = (h) => unit(h, { roof: 11.6, sill: 3.9, nose: NOSE_810, rake: [[0.66, 7.5], [0.62, 10.5]], depth: 0.45, cabLen: 0.5, lampY: 6.2, coupler: "buffers",
  rows: rows810([7.0, 12.5, 18.0]), doors: [door810(3.5)], paint: paint810, diaphragm: [4.2, 10.4], surround: "#1d2026",
  // The engine, gearbox and fuel tank under the floor between the axles,
  // the radiator grille and exhaust on the roof.
  extra: (cc, g) => axle(12.1, 3.9) + boxes(15.0, 22.9, 3.9, 1, 1.4) + rect(5.0, 11.55, 9.0, 0.55, C.steelDark, 0.4, 'rx="0.25"') +
    rect(0.45, 11.0, 1.0, 0.75, "#2a2d31", 0.35, 'rx="0.3"') + lamp(0.5, 11.15, 0.55, 0.45) });
export const railbus810 = (c) => twinEnded(c, half810) + exhaust(c.L / 2 - 1.2, 11.6) + cdLogo(c, c.L / 2, 6.5, 0.75, "#8c1a24", false);
// The trailer: the same body without cabs or engine, gangways at the ends.
export const trailer010 = (c) => unit(c, { roof: 11.6, sill: 3.9, rows: rows810(seq(6.6, 5.45, 6)), doors: [door810(2.8), door810(c.L - 5.3)], paint: paint810,
  diaphragm: [4.2, 10.4], extra: (cc, g) => axle(12.1, 3.9) + axle(g.L - 12.1, 3.9) + boxes(16.0, g.L - 16.0, 3.9, 2, 0.8) + buffers(0, -1, { sill: 3.9 }) + buffers(g.L, 1, { sill: 3.9 }) });

const NOSE_814 =[[0.9, 3.9], [0.8, 6.8], ["q", 0.9, 7.9, 1.6, 8.6], [2.4, 10.9], ["q", 2.8, 11.6, 3.8, 11.6]];
const novaPaint = (c, g) => bands(g.L, [[0, 20, "#f6c400"], [10.75, 3, "#a9b0b8"], [0, 4.2, "#2a2d31"]]) +
  path(`M-1 4.2L-1 8.0C4.6 8.0 8.4 5.8 14.6 5.8L${g.L + 1} 5.8L${g.L + 1} 4.2Z`, "#2f8f3a") + path(`M-1 8.0C4.6 8.0 8.4 5.8 14.6 5.8L${g.L + 1} 5.8L${g.L + 1} 6.0L14.6 6.0C8.4 6.0 4.6 8.2 -1 8.2Z`, "#ffffff");
export const regionova = (c) => unit(c, { roof: 11.6, sill: 3.9, nose: NOSE_814, rake: [[1.6, 8.6], [2.4, 10.9]], depth: 2.0, cabLen: 5, lampY: 5.4,
  rows: [{ xs: seq(10.6, 4.6, 7), y: 6.9, w: 3.8, h: 2.6, r: 0.35 }], doors: [{ x: 5.4, w: 3.2, y0: 3.4, y1: 10.2, leaves: 2, glassY: 0.5, glassH: 0.35 }],
  paint: novaPaint, diaphragm: [4.2, 10.4], coupler: "buffers",
  // Buffers and screw couplings at both ends (the cars run as 810s did);
  // the door's folding step; the engine, fuel tank and battery box between
  // the axles; air-conditioning, exhaust and a rain gutter over the side.
  // The second car of a pair is the 914 driving trailer, with no engine
  // (corrected 2026-10: both cars used to be drawn as 814 motor cars).
  extra: (cc, g) => axle(12.5, 3.9) + axle(g.L - 12.5, 3.9) + hvac(18, 11.6, 9, 0.55) + (cc.trailer ? "" : exhaust(29, 11.6)) + buffers(g.L, 1, { sill: 3.9 }) +
    rect(5.2, 2.9, 3.6, 0.3, "currentColor") + rect(5.6, 2.3, 2.8, 0.25, "currentColor", 0, 'opacity="0.8"') + line(4.4, 11.15, g.L - 0.8, 11.15, "rgba(0,0,0,0.25)", 0.6) +
    boxes(16.4, 20.6, 3.9, 1, 1.1) + (cc.trailer ? boxes(21.0, 26.0, 3.9, 1, 0.8) : tank(21.0, 26.0, 3.9, 2.2)) + boxes(26.4, g.L - 16.4, 3.9, 1, 1.0) + rect(g.L - 9.2, 2.7, 2.6, 1.2, "currentColor", 0, 'opacity="0.75" rx="0.1"') +
    letters(cc, 26, 4.95, 0.95, "Regionova", "#ffffff", { weight: 700, style: "italic" }) + cdLogo(cc, g.L - 8, 10.25, 0.65, CD.navy, false) });

// Regio-Shuttle RS1 (ČD 840 and 841, GW Train 841.2): one car of 25.5 m with
// a cab at each end, a low floor between the motor trucks, two double doors
// a side beside it; the engines under the floor at the ends. ČD: blue over
// a pale gray band and navy skirt, white at the lower nose. GW Train:
// orange, the cab ends green back past the first window, GWTRAIN big in
// white low on the side, green doors.
const NOSE_RS1 = [[1.1, 3.6], [1.0, 6.0], ["q", 1.1, 7.6, 2.2, 8.6], [4.0, 12.2], ["q", 4.7, 13.1, 6.4, 13.1]];
const rs1Paint = (c, g) => (c.agency === "czgwtrain"
  ? bands(g.L, [[0, 20, GW.orange], [12.1, 3, "#8e959d"], [6.1, 4.1, "#1d1f22"], [0, 2.5, "#2a2d31"]]) + path("M-1 0L15.2 0L13.2 14L-1 14Z", GW.green) + path("M15.2 0L15.8 0L13.8 14L13.2 14Z", GW.dark)
  : bands(g.L, [[0, 20, CD.shark], [12.1, 3, "#b9c0c8"], [3.9, 1.7, "#e7eaed"], [0, 3.9, CD.navy]]) + path("M0 0L0 8.4Q3.0 8.4 5.0 6.8Q6.6 5.6 9.0 5.6L9.0 0Z", "#e7eaed") + rect(-1, 3.6, 4.4, 0.55, CD.yellow));
export const rs1 = (c) => twinEnded(c, (h) => unit(h, { roof: 13.1, sill: 3.6, drop: { a: 16.8, b: c.L - 16.8, y: 2.0 }, nose: NOSE_RS1, rake: [[2.2, 8.6], [4.0, 12.2]],
  rows: [{ xs: [9.4, 23.6, 29.4, 35.2, c.L / 2 - 2.3], y: 6.3, w: 4.6, h: 3.7, r: 0.45 }], doors: [plug(17.6, 2.1, 10.3), plug(c.L - 22.0, 2.1, 10.3)],
  trucks: [8.4, c.L - 8.4], low: 4.6, paint: rs1Paint, lampY: 5.2, doorFill: (cc) => (cc.agency === "czgwtrain" ? GW.green : null),
  extra: (cc, g) => hvac(10, 13.1, 9) + exhaust(20.5, 13.1) + boxes(13.0, 16.3, 3.6, 1, 1.2) })) +
  (c.agency === "czgwtrain" ? letters(c, c.L / 2, 4.15, 1.65, "GWTRAIN", "#ffffff", { weight: 800, style: "italic", spacing: "-0.02em" }) : cdLogo(c, c.L / 2, 11.15, 0.9, "#ffffff"));

// Duewag RegioSprinter (GW Train Regio's 654s, 16 bought from Rurtalbahn,
// on its South Bohemian lines since December 2017 and Karlovy Vary-
// Mariánské Lázně; de.wikipedia "Duewag RegioSprinter", cs.wikipedia "GW
// Train Regio"): three modules, 24.8 m over the couplers, 3.45 m tall; a
// cab module at each end over a single powered axle with its MAN engine
// under the high floor, the short middle module low-floored over a two-
// axle truck (A'2'A'); a raked windshield, a big window in the cab door, a
// double door a side in each end module by the joint, big windows. In GW
// Train's orange, the cab ends green.
const NOSE_RSP = [[1.0, 2.6], [0.8, 5.4], ["q", 0.9, 6.8, 1.8, 7.6], [3.4, 10.6], ["q", 3.9, 11.3, 5.2, 11.3]];
const halfRsp = (h) => unit(h, { roof: 11.3, sill: 2.6, nose: NOSE_RSP, rake: [[1.8, 7.6], [3.4, 10.6]], depth: 2.2, cabLen: 4, lampY: 4.2,
  rows: [{ xs: [5.0], y: 6.2, w: 4.0, h: 3.6, r: 0.5 }, { xs: [12.0], y: 5.8, w: 7.0, h: 4.0, r: 0.4 }, { xs: [25.6], y: 5.8, w: 6.4, h: 4.0, r: 0.4 },
    { xs: [37.2], y: 5.8, w: 7.0, h: 4.0, r: 0.4 }],
  doors: [{ x: 20.2, w: 4.2, y0: 2.0, y1: 9.9, leaves: 2, glassY: 0.3, glassH: 0.55 }], diaphragm: [2.4, 10.4],
  paint: (cc, g) => bands(g.L, [[0, 20, GW.orange], [10.4, 3, "#8e959d"], [0, 3.1, "#3a3d42"], [3.1, 0.25, GW.green]]) + path("M-1 3.1L10.0 3.1L11.2 11.3L-1 11.3Z", GW.green),
  doorFill: () => GW.green, surround: "#1d2026",
  // The joints between the modules (a rubber seal and a dark band), the
  // powered axle and engine under the cab module, the middle module's truck.
  extra: (cc, g) => rect(32.7, 2.6, 0.6, 8.7, "#2a2d31") + slats(10.1, 6.4, 0.9, 3.0, 0.3, "rgba(0,0,0,0.5)") +
    truck(7.8, { wb: 0.01, d: 30, top: 2.6 }) + boxes(11.0, 19.5, 2.6, 1, 1.0) + truck(g.L / 2, { wb: 5.9, d: 26, top: 2.0 }) + hvac(13, 11.3, 8, 0.6) + exhaust(4.5, 11.3) });
export const regioSprinter = (c) => twinEnded(c, halfRsp) + letters(c, 28.8, 3.9, 0.95, "GWTRAIN", "#ffffff", { weight: 800, style: "italic" });

// DB class 628 (Arriva 845, GW Train's 628s): two cars of 22.9 m, a diesel
// under the motor car; a wedge cab; single folding doors near each end.
// Arriva: aqua, two white lines low, "arriva" in white. GW Train: green
// over orange, GWTRAIN in white on the orange.
const NOSE_628 = [[1.0, 3.9], [0.9, 6.6], ["q", 1.0, 7.6, 1.9, 8.4], [3.4, 12.4], ["q", 3.9, 13.2, 5.2, 13.2]];
const vt628Paint = (c, g) => (c.agency === "czgwtrain"
  ? bands(g.L, [[0, 20, GW.green], [12.0, 3, "#8e959d"], [0, 6.75, GW.orange], [6.75, 0.2, "#ffffff"], [0, 4.4, "#2a2d31"]])
  : bands(g.L, [[0, 20, ARRIVA.aqua], [12.0, 3, "#c9ced4"], [0, 4.5, ARRIVA.skirt], [4.85, 0.22, ARRIVA.white], [5.3, 0.22, ARRIVA.white]]) + path("M-1 4.5L-1 13.2L1.6 13.2L1.6 4.5Z", ARRIVA.white));
export const vt628 = (c) => unit(c, { roof: 13.2, sill: 3.9, nose: NOSE_628, rake: [[1.9, 8.4], [3.4, 12.4]], depth: 2.2, cabLen: 6, low: 6.0, lampY: 5.5,
  rows: [{ xs: seq(13.4, 5.0, 11), y: 7.3, w: 4.2, h: 2.9, r: 0.35 }], doors: [{ x: 8.4, w: 3.2, y0: 3.4, y1: 11.0, leaves: 2, glassY: 0.5, glassH: 0.35 },
    { x: c.L - 5.4, w: 3.2, y0: 3.4, y1: 11.0, leaves: 2, glassY: 0.5, glassH: 0.35 }], trucks: [9.0, c.L - 9.0], diaphragm: [4.2, 11.8],
  paint: vt628Paint, doorFill: (cc) => (cc.agency === "czgwtrain" ? GW.green : null),
  extra: (cc, g) => hvac(16, 13.2, 10) + (cc.index === 0 ? exhaust(30, 13.2) + tank(28, 36, 3.9, 1.5) : boxes(28, 36, 3.9, 1, 0.9)) + boxes(15, 27, 3.9, 2, 1.3) + boxes(37, g.L - 15, 3.9, 2, 1.2) +
    (cc.agency === "czgwtrain" ? letters(cc, 38, 5.55, 1.35, "GWTRAIN", "#ffffff", { weight: 800, style: "italic" }) : letters(cc, 38, 6.1, 1.25, "arriva", "#ffffff", { weight: 700 })) });

// Alstom Coradia LINT 41 (Leo Express's, CZ and SK): two sections, 41.89 m,
// on a shared Jakobs truck; a raked nose; one double door a side in each;
// the power pack under each section's high floor. White, the windows in a
// black band, the cab black round the glass, orange under the nose and on
// the doors; Leo Express's name beside the door.
const NOSE_LINT = [[1.0, 2.8], [1.0, 5.6], ["q", 1.1, 7.0, 2.0, 8.0], [4.6, 12.4], ["q", 5.4, 13.4, 7.2, 13.4]];
const lintPaint = (c, g) => bands(g.L, [[0, 20, LEO.white], [12.3, 3, "#a9b0b8"], [6.1, 4.3, "#1d1e20"], [0, 3.3, "#2a2d31"]]) +
  path("M-1 5.8L6.4 5.8Q9.0 5.8 9.0 8.0L9.0 13.4L-1 13.4Z", "#1d1e20") + rect(-1, 2.8, 5.0, 0.75, LEO.orange) + rect(-1, 3.3, g.L + 2, 0.18, LEO.orange);
export const lintCar = (c) => unit(c, { roof: 13.4, sill: 2.8, nose: NOSE_LINT, rake: [[2.0, 8.0], [4.6, 12.4]], cabLen: 8, lampY: 4.6,
  rows: [{ xs: [9.6], y: 6.4, w: 3.0, h: 3.8, r: 0.45 }, { xs: seq(20.6, 5.6, 8), y: 6.4, w: 4.8, h: 3.8, r: 0.45 }],
  doors: [plug(14.2, 2.8, 10.4)], trucks: [10.5, "end"], paint: lintPaint, doorFill: () => LEO.orange, surround: "#111214",
  extra: (cc, g) => hvac(22, 13.4, 12) + hvac(44, 13.4, 8) + exhaust(37, 13.4) + boxes(25, 40, 2.8, 2, 1.0) + tank(41, 48, 2.8, 1.2) + leoLogo(cc, 23, 4.65, 1.25, "#1d1e20") });

// Pesa Elf.eu (RegioJet 654): two cars of about 21.8 m, a pantograph on the
// first; a rounded nose; two double doors a side in each car. In the Ústí
// region's lime green over dark green, yellow round the windshield, a dark
// roof; RegioJet's name in white.
const NOSE_ELF = [[1.4, 3.4], [1.0, 6.0], ["q", 1.1, 7.8, 2.6, 9.2], [5.0, 12.9], ["q", 5.8, 13.8, 7.6, 13.8]];
// The three-car Elf.eu (RegioJet 655, 7 units, 2025, Prague's S49 and S61;
// cs.wikipedia "RegioJet" fleet table) in PID's red and gray: pale gray, a
// black window band, red over and under the band beside the inner door,
// the nose's edge red; RegioJet's name behind the cab.
const elfPid = (c, g, cab) => bands(g.L, [[0, 20, "#e6e8ea"], [12.9, 3, "#c9cdd2"], [0, 4.0, "#3a3d42"]]) +
  rect(cab ? 40.5 : 22.0, 4.0, 12.0, 9.0, CD.red) + rect(cab ? 10.5 : -1, 6.35, g.L + 2, 4.1, "#16181b") +
  (cab ? path("M0 4.0L0 9.0Q1.0 9.4 1.6 9.0L1.6 4.0Z", CD.red) + path("M0 9.6Q2.4 10.4 4.6 13.9L5.4 13.9Q3.2 10.0 0.6 9.1Z", CD.red) : "");
const elfPaint = (c, g) => c.livery === "pid" ? elfPid(c, g, true) : bands(g.L, [[0, 20, RJ.lime], [12.9, 3, "#4a5056"], [0, 4.7, RJ.green], [4.7, 0.2, "#ffffff"]]) +
  path("M0 8.2L0 14L9.2 14L9.2 12.0Q6.8 12.0 5.0 9.6Q3.4 8.2 0 8.2Z", RJ.yellow) + rect(-1, 3.4, 4.8, 0.7, RJ.yellow);
export const elfCar = (c) => unit(c, { roof: 13.8, sill: 3.4, nose: NOSE_ELF, rake: [[2.6, 9.2], [5.0, 12.9]], cabLen: 8, lampY: 5.4,
  rows: [{ xs: seq(15.6, 6.0, 3), y: 6.6, w: 5.0, h: 3.7, r: 0.45 }, { xs: seq(40.4, 6.0, 4), y: 6.6, w: 5.0, h: 3.7, r: 0.45 }],
  doors: [plug(9.8, 3.4, 10.6), plug(34.4, 3.4, 10.6)], trucks: [9.0, c.L - 8.0], pan: c.index === 0 && c.livery !== "pid" ? 50 : null, paint: elfPaint, doorFill: (cc) => (cc.livery === "pid" ? "#d9dcdf" : "#7ab534"),
  extra: (cc, g) => hvac(15, 13.8, 12) + (cc.index === 0 ? rect(37, 13.75, 6, 0.6, C.steelDark, 0.4, 'rx="0.2"') : hvac(44, 13.8, 10)) + boxes(18, 33, 3.4, 2, 0.7) +
    (cc.livery === "pid" ? letters(cc, 20, 5.6, 0.95, "‖ REGIOJET", "#16181b", { weight: 700 }) + letters(cc, 46.5, 5.2, 1.4, "pid", "#ffffff", { weight: 700 })
      : letters(cc, 26, 5.65, 0.95, "RegioJet", "#ffffff", { weight: 700 }) + letters(cc, g.L - 18, 5.65, 0.6, "DOPRAVA ÚSTECKÉHO KRAJE", "#ffffff", { weight: 600, spacing: "0.03em" })) });
// Its middle car: two double doors a side, the pantograph between them.
export const elfMid = (c) => unit({ ...c, livery: "pid" }, { roof: 13.8, sill: 3.4,
  rows: [{ xs: [3.0], y: 6.6, w: 3.0, h: 3.7, r: 0.45 }, { xs: seq(13.4, 6.0, 6), y: 6.6, w: 5.0, h: 3.7, r: 0.45 }, { xs: [c.L - 6.0], y: 6.6, w: 3.0, h: 3.7, r: 0.45 }],
  doors: [plug(7.6, 3.4, 10.6), plug(c.L - 12.0, 3.4, 10.6)], trucks: [8.0, c.L - 8.0], pan: c.L / 2 - 4, paint: (cc, g) => elfPid(cc, g, false), doorFill: () => "#d9dcdf",
  extra: (cc, g) => hvac(4, 13.8, 10) + boxes(16, g.L - 16, 3.4, 2, 0.7) });

// CRRC Sirius (ZEMU03, RegioJet 665.001-003, built 2019-2021 for Leo
// Express, leased by RegioJet for R23 Kolín-Ústí nad Labem since December
// 2024; en.wikipedia "CRRC ZEMU03", cs.wikipedia "RegioJet"): three cars,
// about 82 m, each on its own two trucks, about 4.2 m tall; a long, low
// nose sloping up to a deep windshield, a large oval side window in the cab
// door; one double door a side in each car, near its inner end. Its paint
// (photographs at Ústí nad Labem): slate gray, a yellow line along the
// sill that turns up behind the cab and arches over the cab's oval window,
// the deflector orange; RegioJet's name in white over the windows.
const NOSE_SIRIUS = [[3.0, 3.6], [1.2, 4.3], ["q", 0.35, 5.6, 1.4, 7.2], [7.2, 12.2], ["q", 8.8, 13.6, 11.6, 13.6]];
const SIR = { slate: "#666d74", roof: "#8a9197", yellow: "#f6b800" };
const siriusPaint = (cab) => (c, g) => bands(g.L, [[0, 20, SIR.slate], [12.4, 3, SIR.roof], [4.35, 0.55, SIR.yellow], [0, 3.95, "#3b3f44"]]) +
  (cab ? path("M13.2 4.35L13.2 12.0L13.9 12.0L13.9 4.35Z", SIR.yellow) + path("M13.0 12.0Q11.0 12.4 9.0 11.0Q8.0 9.6 8.4 7.4L9.0 7.4Q8.8 9.4 9.6 10.6Q11.2 11.7 13.0 11.4Z", SIR.yellow) +
    path("M9.2 7.6Q9.0 9.6 10.0 10.6Q11.4 11.4 12.8 11.0L12.8 7.6Q11.0 7.0 9.2 7.6Z", C.glass) : "");
const siriusRows = (xs) => [{ xs, y: 6.9, w: 4.0, h: 3.4, r: 0.4 }];
export const siriusCab = (c) => unit(c, { roof: 13.6, sill: 3.6, nose: NOSE_SIRIUS, rake: [[1.4, 7.2], [7.2, 12.2]], depth: 3.6, cabLen: 14, lampY: 5.0,
  rows: siriusRows(seq(16.0, 5.3, 10)), doors: [plug(c.L - 11.6, 3.6, 10.8, 4.2)], trucks: [11.5, c.L - 8.0], paint: siriusPaint(true),
  doorFill: () => SIR.yellow, surround: "#202326",
  extra: (cc, g) => path(poly([[3.0, 3.6], [7.0, 3.6], [6.4, 1.0], [3.4, 0.8], [2.6, 2.4]]), "#d9622b") + hvac(18, 13.6, 13) + rect(45, 13.55, 14, 0.55, C.steelDark, 0.4, 'rx="0.25"') +
    boxes(18, g.L - 16, 3.6, 4, 1.1) + mark(cc, 40, 11.3, `<path d="M-6.1 -0.65L-5.85 -0.65L-5.85 0.65L-6.1 0.65ZM-5.65 -0.65L-5.4 -0.65L-5.4 0.65L-5.65 0.65Z" fill="#ffffff"/>` +
      txt(-5.1, 0, 1.25, "REGIOJET", "#ffffff", { weight: 700, anchor: "start" })) });
export const siriusMid = (c) => unit(c, { roof: 13.6, sill: 3.6,
  rows: siriusRows(seq(4.0, 5.3, 13)), doors: [plug(c.L - 11.0, 3.6, 10.8, 4.2)], trucks: [8.0, c.L - 8.0], paint: siriusPaint(false), doorFill: () => SIR.yellow,
  pan: c.L / 2 - 6, extra: (cc, g) => hvac(4, 13.6, 10) + boxes(16, g.L - 16, 3.6, 3, 1.1) });

// Stadler FLIRT (Leo Express 480): sections of the built-in FLIRT's
// dimensions (js/carmodels.js), cab sections 21.5 m to the joint, the
// intermediates 15.7 m, on Jakobs trucks; a motor truck under each cab.
// Graphite all over, copper round the windshield and in a slash behind the
// cab, the name in white; a pantograph on the middle section.
const NOSE_FLIRT = [[1.0, 3.0], [1.0, 5.8], ["q", 1.1, 7.0, 2.0, 8.0], [5.6, 12.9], ["q", 6.4, 14.06, 8.2, 14.06]];
const leoFlirtPaint = (cab) => (c, g) => bands(g.L, [[0, 20, LEO.graphite], [13.2, 3, LEO.roof], [0, 3.6, "#17181a"], [3.6, 0.14, LEO.copper]]) +
  (cab ? path(poly([[19.6, 3.6], [20.9, 3.6], [23.6, 13.2], [22.3, 13.2]]), LEO.copper) + path("M1.4 7.6Q3.6 10.6 5.2 13.2L9.6 13.2L9.6 13.6L4.9 13.6Q3.2 11.0 1.0 7.9Z", LEO.copper) : "");
const flirtDoor = (x) => ({ x, w: 4.27, y0: 3.0, y1: 10.4, leaves: 2, glassY: 0.4, glassH: 0.45, fill: "#202124" });
export const leoFlirtCab = (c) => unit(c, { roof: 14.06, sill: 3.0, nose: NOSE_FLIRT, rake: [[2.0, 8.0], [5.6, 12.9]], depth: 3.1, cabLen: 9, lampY: 4.9,
  rows: [{ xs: [12.4, 16.2], y: 6.6, w: 3.0, h: 3.6, r: 0.4 }, { xs: seq(29.6, 5.25, 7), y: 6.6, w: 4.6, h: 3.6, r: 0.4 }],
  doors: [{ x: 9.0, w: 2.3, y0: 4.0, y1: 11.2, glassY: 0.55, glassH: 0.32, grabs: false }, flirtDoor(24.0)], diaphragm: [3.2, 12.2],
  paint: leoFlirtPaint(true), surround: "#111214",
  extra: (cc, g) => truck(g.L - 51.8, { wb: 8.2, d: 36, top: 3.0 }) + truck(g.L, { wb: 8.86, d: 30, top: 3.0 }) + hvac(21, 14.06, 10) + hvac(44, 14.06, 8) +
    boxes(29, 40, 3.0, 2, 0.6) + leoLogo(cc, 22.6, 5.0, 2.1, "#ffffff") });
export const leoFlirtMid = (c) => unit(c, { roof: 14.06, sill: 3.0,
  rows: [{ xs: seq(2.6, 5.25, 3), y: 6.6, w: 4.6, h: 3.6, r: 0.4 }, { xs: seq(24.7, 5.25, 5), y: 6.6, w: 4.6, h: 3.6, r: 0.4 }],
  doors: [flirtDoor(18.5)], diaphragm: [3.2, 12.2], paint: leoFlirtPaint(false), pan: c.index === 2 ? c.L / 2 - 4 : null,
  extra: (cc, g) => truck(0, { wb: 8.86, d: 30, top: 3.0 }) + truck(g.L, { wb: 8.86, d: 30, top: 3.0 }) + (cc.index === 2 ? "" : hvac(4, 14.06, 9) + hvac(30, 14.06, 9)) +
    boxes(26, 44, 3.0, 2, 0.6) + (cc.index === 1 ? leoLogo(cc, 11.5, 5.3, 1.1, "#ffffff") : "") });
// ---------- Other railroads' trains ----------
// The trains of ÖBB, MÁV, Raaberbahn (GySEV), PKP Intercity and Die
// Länderbahn that run through Czechia and Slovakia, and the night trains'
// sleeping cars and couchettes, ČD's and ZSSK's among them. Each key is
// drawn in its own railroad's paint whichever railroad's train it is in.

// The coach paints (coachPaint uses these by c.livery).
const kindWord = (c, words) => words[c.kind] || words.coach;
const FOREIGN_PAINT = {
  // ÖBB railjet (Siemens Viaggio, 2008-2013, 60 sets; photographs at Wien
  // Meidling, Villach and the Semmering): a deep carmine red above the
  // windows, which sit in a black band, slate gray below, a red line low
  // along the gray; the driving trailer's rounded cab red down to the
  // coupler; railjet lettered in gray low on the side.
  railjet: (c) => ({ base: OBB.rj, door: OBB.slate,
    side: (cc, L) => bands(L, [[12.25, 3, "#8f979f"], [0, 6.75, OBB.slate], [4.65, 0.24, OBB.rj], [0, 4.35, "#25272a"]]) +
      rect(-1, 6.95, L + 2, 3.6, "#16181b"),
    cabEnd: (cc, L) => path("M0 4.35L3.2 4.35Q5.0 6.6 5.6 13.3L0 13.3Z", OBB.rj) + path("M3.2 4.35Q5.0 6.6 5.6 13.3L6.4 13.3Q5.6 7.0 4.6 4.35Z", OBB.rj),
    over: (cc, L) => letters(cc, L * 0.55, 5.55, 1.05, "railjet", "#6f7378", { weight: 700, style: "italic" }) +
      letters(cc, 6.7, 8.75, 1.4, cc.firstClass ? "1" : "2", "#ffffff", { weight: 600 }) + letters(cc, L - 6.7, 8.75, 1.4, cc.firstClass ? "1" : "2", "#ffffff", { weight: 600 }) }),
  // ÖBB Nightjet (2016 on; photographs of WLABmz 72-90 and the couchettes
  // at Bruxelles-Midi and Innsbruck, 2020-2025): night blue all over, a red
  // line under the windows, the roof gray; ÖBB in red and nightjet in white
  // italic low on the side, the car's kind (schlafwagen, liegewagen) ahead.
  nightjet: (c) => ({ base: OBB.nj, door: "#3a4490",
    side: (cc, L) => bands(L, [[12.25, 3, "#9aa1a9"], [6.75, 0.3, OBB.njLine], [0, 4.35, "#1b1f3d"]]),
    over: (cc, L) => mark(cc, L / 2, 5.35, txt(-0.4, 0, 0.95, "ÖBB", OBB.njLine, { weight: 800, anchor: "end" }) + txt(0.1, 0, 1.05, "nightjet", "#ffffff", { weight: 700, style: "italic", anchor: "start" })) +
      letters(cc, L * 0.22, 5.4, 0.7, kindWord(cc, { sleeper: "schlafwagen", couchette: "liegewagen", coach: "sitzwagen" }), "#ffffff", { weight: 500, style: "italic" }) +
      (cc.kind === "sleeper" ? "" : letters(cc, 6.7, 8.75, 1.4, "2", "#ffffff", { weight: 600 })) }),
  // ČD's night cars (sleeping cars and couchettes refurbished 2019-2024,
  // photograph of a Bcmz at Budapest-Nyugati): navy from the roof down
  // through the windows, a white line under the roof edge, a sky-blue band
  // under the windows, pale gray below; ČD's mark and the car's kind in
  // Czech and English on the gray.
  cdnight: (c) => ({ base: "#dfe3e7", door: CD.navy,
    side: (cc, L) => bands(L, [[7.0, 6, CD.navy], [12.25, 3, "#98a0a9"], [11.85, 0.22, "#f2f4f6"], [6.0, 1.0, "#3d8fd9"], [0, 4.35, "#2a2d31"]]),
    over: (cc, L) => cdLogo(cc, L * 0.22, 5.15, 0.95, CD.navy, false) +
      letters(cc, L * 0.5, 5.1, 0.72, kindWord(cc, { sleeper: "Lůžkový vůz | Sleeping car", couchette: "Lehátkový vůz | Couchette car", coach: "" }), CD.navy, { weight: 600 }) }),
  // MÁV-START's InterCity and night cars (the 2020s paint, photographs of
  // Bmz 21-91 at Budapest-Nyugati and Wien Hbf): white below, MÁV blue from
  // just under the windows to the roof, a turquoise band where they meet,
  // turquoise doors; MÁV-START's yellow wheel mark and name on the white.
  mav: (c) => ({ base: MAV.white, door: MAV.sky,
    side: (cc, L) => bands(L, [[6.7, 6, MAV.blue], [12.25, 3, "#98a0a9"], [6.25, 0.45, MAV.sky], [0, 4.35, "#2a2d31"]]) +
      path(`M${L * 0.55} 6.7L${L * 0.75} 6.7L${L * 0.7} 10.8L${L * 0.6} 10.8Z`, "#2f77d6", 0, 'opacity="0.55"'),
    over: (cc, L) => mark(cc, L * 0.3, 5.2, `<circle cx="-1.3" cy="0" r="0.5" fill="none" stroke="#f2b600" stroke-width="0.22"/>` +
      txt(-0.6, 0, 0.8, "MÁV-START", MAV.deep, { weight: 800, anchor: "start" })) +
      (cc.kind === "sleeper" ? "" : letters(cc, 6.7, 8.75, 1.4, cc.firstClass ? "1" : "2", "#ffffff", { weight: 600 })) }),
  // PKP Intercity (photographs of its WLAB sleepers at Praha hl.n. and
  // Bautzen): navy over the windows and up to the roof, light gray below,
  // an orange line low; IC and PKP INTERCITY on the gray.
  pkp: (c) => ({ base: PKP.gray, door: "#c9ced3",
    side: (cc, L) => bands(L, [[6.95, 6, PKP.navy], [12.25, 3, "#98a0a9"], [5.25, 0.3, PKP.orange], [0, 4.35, "#2a2d31"]]),
    over: (cc, L) => mark(cc, L * 0.62, 6.1, txt(-0.3, 0, 0.95, "IC", PKP.red, { weight: 800, style: "italic", anchor: "end" }) + txt(0.1, 0, 0.55, "PKP INTERCITY", PKP.navy, { weight: 700, anchor: "start" })) +
      letters(cc, L * 0.4, 11.5, 0.5, kindWord(cc, { sleeper: "WAGON SYPIALNY", couchette: "KUSZETKA", coach: "" }), "#ffffff", { weight: 600 }) }),
  // Die Länderbahn's alex coaches (photographs at München Hbf): a slate
  // roof edge, silver-gray sides, a yellow band under the windows, alex in
  // blue on the lower side.
  alex: (c) => ({ base: "#dcdfe2", door: "#5d6670",
    side: (cc, L) => bands(L, [[12.25, 3, "#5d6670"], [10.75, 1.5, DLB.gray], [6.3, 0.5, DLB.yellow], [0, 4.35, "#2a2d31"]]),
    over: (cc, L) => letters(cc, L * 0.55, 5.3, 1.3, "alex", DLB.blue, { weight: 800, style: "italic" }) +
      letters(cc, 6.7, 8.75, 1.4, cc.firstClass ? "1" : "2", DLB.blue, { weight: 600 }) }),
};

// The cars, on euroCoach's body (26.4 m, unless noted): o.rows its window
// row, o.centers its trucks apart.
const coachIn = (livery, kind, o = {}) => (c) => euroCoach({ ...c, agency: o.agency || c.agency, livery, kind, firstClass: o.first ?? false },
  { rows: o.rows ? o.rows(c.L) : undefined, centers: o.centers });
// Sleeping cars: a small window to each of the twelve compartments
// (Siemens's WLABmz of 2003-2005, ÖBB 72-90 and ČD 72-70, 26.4 m; photograph
// of 72-90 010 at Bruxelles-Midi); the older Görlitz-built WLABmee and PKP's
// WLAB, 24.5 m on trucks 17.2 m apart, ten bigger ones.
const SLEEPER_ROWS = (L) => [{ a: 6.4, b: L - 7.6, y: 7.5, w: 3.2, h: 3.0, pitch: 5.95, r: 0.35 }];
const GORLITZ_ROWS = (L) => [{ a: 5.8, b: L - 5.8, y: 7.6, w: 3.8, h: 2.9, pitch: 6.5, r: 0.35 }];
// Couchettes: eleven compartments, each with a wide window (Bcmz 59-90 and
// 59-70, 26.4 m).
const COUCHETTE_ROWS = (L) => [{ a: 6.2, b: L - 6.2, y: 7.3, w: 4.4, h: 3.0, pitch: 6.6, r: 0.4 }];
export const njSleeper = coachIn("nightjet", "sleeper", { rows: SLEEPER_ROWS });
export const njCouchette = coachIn("nightjet", "couchette", { rows: COUCHETTE_ROWS });
export const njCoach = coachIn("nightjet", "coach");
// ČD's WLABmz (826) and Bcmz (834) in its night paint; ZSSK's Görlitz
// WLABmee and its Bcmh couchettes in its white and red (photograph of
// WLABmee 71-90 005 at Poprad-Tatry); MÁV's sleeping car, couchette and
// seated cars; PKP Intercity's WLAB sleepers and seated cars (24.5 m).
export const cdSleeper = coachIn("cdnight", "sleeper", { rows: SLEEPER_ROWS, agency: "czcd" });
export const cdCouchette = coachIn("cdnight", "couchette", { rows: COUCHETTE_ROWS, agency: "czcd" });
export const skSleeper = coachIn(null, "sleeper", { rows: GORLITZ_ROWS, centers: 56.4, agency: "zssk" });
export const skCouchette = coachIn(null, "couchette", { rows: COUCHETTE_ROWS, agency: "zssk" });
export const huSleeper = coachIn("mav", "sleeper", { rows: SLEEPER_ROWS });
export const huCouchette = coachIn("mav", "couchette", { rows: COUCHETTE_ROWS });
export const huCoach = (c) => coachIn("mav", "coach", { first: c.index === 1 })(c);
export const plSleeper = coachIn("pkp", "sleeper", { rows: GORLITZ_ROWS, centers: 56.4 });
export const plCoach = coachIn("pkp", "coach", { centers: 56.4, rows: (L) => [{ a: 5.6, b: L - 5.6, y: 7.3, w: 4.4, h: 3.0, pitch: 6.3, r: 0.45 }] });
export const alexCoach = (c) => coachIn("alex", "coach", { first: c.index % 2 === 1 })(c);
// A ČD coach and ČD's or ZSSK's Vectron in a train of another railroad.
export const cdCoach = (c) => euroCoach({ ...c, agency: "czcd" });

// Siemens Taurus (ES64U2, ÖBB 1116, 1999-2006; the three-system ES64U4,
// 1216, for Italy, Slovenia and the Czech and Slovak lines, 2006-2008):
// 19.28 m over the buffers (the 1216 19.58 m), Bo'Bo', trucks 9.9 m apart
// on 1,150 mm wheels; the rounded nose under a deep windshield raked well
// back, the crew door behind it, smooth sides with the louvers high near
// the middle (de.wikipedia "Siemens ES64U2", "ÖBB 1216"). The railjet
// 1116s: the carmine red with a slate band low that swells toward the
// middle, railjet big in a lighter red; the others traffic red with a dark
// gray underframe and ÖBB in white.
const NOSE_TAURUS = [[1.7, 4.1], [1.1, 6.3], ["q", 0.95, 8.5, 2.3, 9.3], [3.9, 12.15], ["q", 4.6, 13.0, 6.4, 13.0]];
function taurusPaint(c, L) {
  if (c.livery === "railjet") return bands(L, [[0, 20, OBB.rj], [12.0, 3, "#55595f"], [0, 5.2, OBB.slate]]) +
    path(`M9.0 5.2Q${L * 0.3} 5.4 ${L / 2} 8.6L${L / 2} 5.2Z`, OBB.slate) + path("M0 5.2L0 7.6L2.0 7.6L3.4 5.2Z", "#1d1e20");
  return bands(L, [[0, 20, OBB.red], [12.0, 3, "#6d737a"], [0, 5.0, "#3a3d42"], [5.0, 0.14, "#f2f3f4"]]) + path("M0 5.0L0 7.4L2.0 7.4L3.3 5.0Z", "#3a3d42");
}
const taurusOver = (c, L) => (c.livery === "railjet"
  ? letters(c, L / 2 + 1, 8.3, 2.6, "railjet", "#c9414a", { weight: 800, style: "italic", spacing: "-0.02em" }) +
    mark(c, 14.5, 6.0, txt(-0.2, 0, 0.6, "ÖBB", "#ffffff", { weight: 800, anchor: "end" }) + txt(0.1, 0, 0.6, "railjet", "#ffffff", { weight: 600, anchor: "start" })) +
    letters(c, L - 14, 11.4, 0.5, "1116", "#ffffff", { weight: 600 })
  : letters(c, L / 2, 8.6, 2.4, "ÖBB", "#ffffff", { weight: 800 }) + letters(c, L - 14, 11.4, 0.5, c.cls || "1216", "#ffffff", { weight: 600 }));
export const taurus = (c) => euroLoco(c, { roof: 13.0, sill: 4.1, nose: NOSE_TAURUS, rake: [[2.3, 9.3], [3.9, 12.15]], centers: 32.5, door: 7.2, wheel: 45,
  paint: taurusPaint, over: taurusOver, surround: "#141518", grilles: [[-13.5, 6.5, 9.8, 11.5], [7.0, 6.5, 9.8, 11.5]], grilleFill: "rgba(20,22,25,0.24)" });

// The railjet's coaches (26.5 m) and its driving trailer (80-90.7, 26.8 m):
// ČD's bodies (rjCoach, rjCab) in ÖBB's railjet paint. The set: the
// driving trailer with business and first class, a first-class car, the
// restaurant car, four second-class cars.
const RJ_CAB = () => path(poly([[1.0, 8.6], [2.6, 11.6], [5.4, 11.6], [5.4, 8.6]]), C.glass) + path(poly([[0.75, 8.3], [0.75, 11.9], [2.4, 12.2], ["q", 1.0, 11.6, 0.75, 8.3]]), "#111214") +
  rect(3.2, 11.1, 1.9, 0.3, "#f39a26", 0, 'opacity="0.9"') + line(1.6, 8.8, 2.3, 10.4, "#0d0f12", 0.7);
export const obbRjCoach = (c) => euroCoach({ ...c, livery: "railjet", firstClass: c.index === 1 || c.index === 2 }, { rows: RJ_ROWS(c.L) });
export const obbRjCab = (c) => euroCoach({ ...c, livery: "railjet", firstClass: true }, { rows: RJ_ROWS(c.L), cab: RJ_CAB });

// Siemens Desiro ML (ÖBB 4744 and 4746 "cityjet", 2015 on; Raaberbahn's
// 4744.3 and 4746.3 "Ventus", 2016 and 2021): three cars, 75.15 m over the
// couplers, 4.26 m tall, the floor 600 mm up, each car on its own two
// trucks (Bo'Bo'+2'2'+Bo'Bo', the end cars motored, a pantograph on each),
// trucks 16.24 m apart, 850 mm driving wheels; two double doors a side in
// each car (the 4746; de.wikipedia "GySEV-Baureihe 4744/4746"); the
// rounded nose under a tall windshield. cityjet: white, a red-orange
// band below the windows, which sit in black, a dark gray skirt; the nose
// white with the red below the lamps. Ventus: yellow over green, the
// windows in black, yellow at the nose.
const NOSE_DML = [[1.3, 3.2], [1.0, 5.6], ["q", 1.0, 7.4, 2.3, 8.6], [4.6, 12.9], ["q", 5.6, 13.97, 7.6, 13.97]];
const dmlPaint = (cab) => (c, g) => {
  const L = g.L, ventus = c.livery === "ventus";
  return bands(L, [[0, 20, ventus ? GYSEV.yellow : "#f2f3f4"], [13.0, 3, "#b9bfc6"], [3.6, 2.75, ventus ? GYSEV.green : "#e8402a"], [6.35, 0.16, ventus ? GYSEV.yellow : "#f2f3f4"],
    [0, 3.6, "#2a2d31"]]) + rect(cab ? 9.6 : -1, 6.55, L + 1 - (cab ? 9.6 : 0), 3.75, "#16181b");
};
const dmlName = (c, x) => (c.livery === "ventus" ? letters(c, x, 11.3, 0.9, "ventus", GYSEV.dark, { weight: 800, style: "italic" })
  : letters(c, x, 11.3, 0.95, "cityjet", "#8a9097", { weight: 700, style: "italic" }) + letters(c, x + 16, 11.3, 0.8, "ÖBB", "#e8402a", { weight: 800 }));
const dmlDoor = (x) => ({ x, w: 4.3, y0: 3.3, y1: 10.5, leaves: 2, glassY: 0.4, glassH: 0.45 });
const dmlFill = (c) => (c.livery === "ventus" ? GYSEV.green : "#d8dcdf");
export const dmlCab = (c) => unit(c, { roof: 13.97, sill: 3.2, nose: NOSE_DML, rake: [[2.3, 8.6], [4.6, 12.9]], depth: 3.0, cabLen: 9, lampY: 5.0,
  rows: [{ xs: [10.4], y: 6.75, w: 2.8, h: 3.35, r: 0.4 }, { xs: seq(24.6, 5.5, 7), y: 6.75, w: 4.7, h: 3.35, r: 0.4 }, { xs: [c.L - 13.6, c.L - 8.1], y: 6.75, w: 4.7, h: 3.35, r: 0.4 }],
  doors: [dmlDoor(18.4), dmlDoor(c.L - 21.0)], trucks: [11.5, c.L - 11.5], wheel: 33, paint: dmlPaint(true), doorFill: dmlFill, surround: "#141518",
  pan: 30, extra: (cc, g) => hvac(g.L - 30, 13.97, 10) + boxes(17, 34, 3.2, 2, 1.1) + boxes(40, g.L - 18, 3.2, 2, 0.9) + dmlName(cc, 44) });
export const dmlMid = (c) => unit(c, { roof: 13.97, sill: 3.2,
  rows: [{ xs: [3.2], y: 6.75, w: 4.7, h: 3.35, r: 0.4 }, { xs: seq(23.0, 5.5, 6), y: 6.75, w: 4.7, h: 3.35, r: 0.4 }, { xs: [c.L - 8.0], y: 6.75, w: 4.7, h: 3.35, r: 0.4 }],
  doors: [dmlDoor(16.4), dmlDoor(c.L - 20.4)], trucks: [12.7, c.L - 12.7], wheel: 30, paint: dmlPaint(false), doorFill: dmlFill,
  extra: (cc, g) => hvac(4, 13.97, 9) + hvac(g.L - 13, 13.97, 9) + boxes(22, g.L - 22, 3.2, 3, 1.0) + dmlName(cc, 30) });

// GySEV (Raaberbahn) 247 503-509: ÖBB 5047 Jenbacher railcars (1987-1995)
// bought in 2011; 25.42 m over the buffers, 2'B' (the engine and its
// hydraulic drive under one end, the powered truck at that end), 840 mm
// wheels, 120 km/h (de.wikipedia "ÖBB 5047"); a flat front leaning back a
// little over buffers, a door behind each cab, ten windows between. Still
// running Bratislava–Rajka–Hegyeshalom (iwk.hu's composition listing, a
// photograph of 247 503 at Bratislava-Petržalka). GySEV's paint: yellow,
// a green window band with a thin green line under it, the front yellow
// round a dark gray windshield frame, a dark skirt.
const NOSE_247 = [[0.9, 3.9], [0.8, 8.3], [1.15, 11.6], ["q", 1.3, 12.6, 2.4, 12.6]];
const g247Paint = (c, g) => bands(g.L, [[0, 20, GYSEV.yellow], [11.5, 3, "#a9b0b8"], [6.85, 3.55, GYSEV.green], [6.2, 0.3, GYSEV.green], [0, 3.9, "#2a2d31"]]) +
  path("M-1 7.9L-1 11.3L3.6 11.3L3.6 7.9Z", "#3a3d42");
export const gy247 = (c) => twinEnded(c, (h) => unit(h, { roof: 12.6, sill: 3.9, nose: NOSE_247, rake: [[0.85, 8.4], [1.15, 11.4]], depth: 2.2, cabLen: 4, lampY: 5.4,
  rows: [{ xs: seq(10.6, 6.25, 10), y: 7.1, w: 4.3, h: 3.05, r: 0.35 }], doors: [{ x: 5.0, w: 2.9, y0: 3.4, y1: 10.6, leaves: 2, glassY: 0.5, glassH: 0.35, fill: GYSEV.green }],
  trucks: [12.7], wheel: 33, paint: g247Paint, coupler: "buffers", diaphragm: [4.2, 11.0], surround: "#2a2d31",
  extra: (cc, g) => hvac(14, 12.6, 9, 0.55) + rect(4.9, 2.9, 3.1, 0.3, "currentColor") })) +
  // The one engine: its exhaust on the roof, the engine, gearbox and fuel
  // tank under the floor at the powered end.
  exhaust(c.L - 30, 12.6) + boxes(c.L - 36, c.L - 22, 3.9, 1, 1.6) + tank(22, 34, 3.9, 2.0) + boxes(36, c.L - 38, 3.9, 2, 1.0) +
  mark(c, c.L / 2, 5.3, `<circle cx="-2.6" cy="0" r="0.7" fill="none" stroke="${GYSEV.dark}" stroke-width="0.25"/>` + txt(-1.6, 0, 0.75, "GYSEV", GYSEV.dark, { weight: 800, anchor: "start" })) +
  letters(c, c.L / 2 + 14, 5.3, 0.5, "247", "#2a2d31", { weight: 600 });

// Siemens ER20 "Herkules" (Die Länderbahn's 223 0xx, 2003-2004): 19.28 m,
// Bo'Bo' diesel-electric, trucks 10.0 m apart on 1,100 mm wheels; a cab at
// each end under a steeply raked windshield, the engine room's louvers and
// doors between, the radiator and exhaust on the roof, the fuel tank
// between the trucks. It hauls the Prague–Munich trains between Regensburg
// and Plzeň (zelpage.cz's 2024 compositions for EC 363). Paint
// (photograph of 223 062): silver-white above, blue below a yellow line,
// the cab's roof and windshield frame blue.
const NOSE_ER20 = [[1.3, 4.1], [1.2, 7.6], ["q", 1.3, 8.8, 2.2, 9.5], [3.4, 12.2], ["q", 3.9, 13.0, 5.2, 13.0]];
const er20Paint = (c, L) => bands(L, [[0, 20, DLB.silver], [12.0, 3, "#5aa2d8"], [0, 7.4, DLB.blue], [7.4, 0.32, DLB.yellow], [0, 4.6, "#22272c"]]) +
  path("M0 12.0L0 9.4L2.4 9.4L4.6 12.0Z", DLB.blue);
const er20Roof = (c, L) => exhaust(L / 2 - 2, 13.0) + [L / 2 + 7, L / 2 + 13].map((x) => path(`M${x - 2.4} 12.95Q${x} 13.75 ${x + 2.4} 12.95Z`, C.steelDark, 0.4)).join("") +
  rect(L / 2 - 12, 12.95, 7, 0.45, C.steelDark, 0.4, 'rx="0.2"') + slats(L / 2 - 11.5, 13.0, 6, 0.35, 0.45, "rgba(0,0,0,0.25)");
export const er20 = (c) => euroLoco(c, { roof: 13.0, sill: 4.1, nose: NOSE_ER20, rake: [[2.2, 9.5], [3.4, 12.2]], centers: 32.8, door: 5.8, pans: false, wheel: 43,
  grilles: [[-15.5, 8.0, 7.9, 11.2], [-5.0, 10.0, 7.9, 11.2], [7.5, 8.0, 7.9, 11.2]], grilleFill: "rgba(20,22,25,0.3)", paint: er20Paint, surround: DLB.blue,
  under: (cc, L) => tank(L / 2 - 9, L / 2 + 9, 4.1, 1.35), roof2: er20Roof,
  over: (cc, L) => letters(cc, L / 2, 5.6, 1.4, "alex", "#ffffff", { weight: 800, style: "italic" }) + letters(cc, L - 13, 10.4, 0.5, "223", DLB.blue, { weight: 600 }) });

// The built-in FLIRT's colors swapped (kept for other files' use).
export const repaint = (svg, map) => svg.replace(/#[0-9a-f]{6}\b/gi, (m) => map[m.toLowerCase()] || m);

// ---------- Tables ----------

export const TYPES = {
  cz380: { name: "Škoda 109E electric locomotive", kind: "electric", pan: true },
  czVectron: { name: "Siemens Vectron electric locomotive", kind: "electric", pan: true },
  czCoach: { name: "Coach", kind: "coach" },
  czRjCoach: { name: "railjet coach", kind: "coach", amenities: ["first", "business", "dining"] },
  czRjCab: { name: "railjet driving trailer", kind: "coach", cab: true },
  czPendoCab: { name: "Pendolino end car", kind: "emu", amenities: ["first", "cafe"] },
  czPendoMid: { name: "Pendolino intermediate car", kind: "emu", pan: true },
  czElefant471: { name: "CityElefant power car", kind: "bilevel", emu: true },
  czElefant071: { name: "CityElefant intermediate car", kind: "bilevel", emu: true },
  czElefant971: { name: "CityElefant cab trailer", kind: "bilevel", emu: true },
  czPanter640: { name: "RegioPanter end car", kind: "emu" },
  czPanter650: { name: "RegioPanter car", kind: "emu" },
  czPanterMid: { name: "RegioPanter intermediate car", kind: "emu" },
  czLink: { name: "RegioShark car", kind: "emu" },
  czRegionova: { name: "Regionova railbus", kind: "emu" },
  czRs1: { name: "Regio-Shuttle RS1 railcar", kind: "emu" },
  cz628: { name: "Class 628 diesel car", kind: "emu" },
  czLint: { name: "Coradia LINT 41 section", kind: "emu" },
  czElf: { name: "Pesa Elf car", kind: "emu" },
  czFlirtCab: { name: "Stadler FLIRT end section", kind: "emu", amenities: ["first", "cafe"] },
  czFlirtMid: { name: "Stadler FLIRT intermediate section", kind: "emu" },
  czFox: { name: "RegioFox (847) section", kind: "emu" },
  czFoxPid: { name: "RegioFox (847) section, PID paint", kind: "emu" },
  cz842: { name: "Class 842 diesel railcar", kind: "emu" },
  cz843: { name: "Class 843 diesel railcar", kind: "emu" },
  cz943: { name: "Class 943 driving trailer", kind: "emu", cab: true },
  cz810: { name: "Class 810 railbus", kind: "emu" },
  cz010: { name: "Railbus trailer (Btax)", kind: "emu" },
  cz660Cab: { name: "InterPanter end car", kind: "emu" },
  cz660Mid: { name: "InterPanter intermediate car", kind: "emu", pan: true },
  czCjCoach: { name: "ComfortJet coach", kind: "coach", amenities: ["first", "cafe"] },
  czCjCab: { name: "ComfortJet driving trailer", kind: "coach", cab: true },
  czMoraviaCab: { name: "Moravia (530/550) end car", kind: "emu" },
  czMoraviaMid: { name: "Moravia (530) intermediate car", kind: "emu", pan: true },
  czTraxx: { name: "TRAXX electric locomotive", kind: "electric", pan: true },
  czElfPid: { name: "Pesa Elf (655) end car", kind: "emu" },
  czElfMid: { name: "Pesa Elf (655) middle car", kind: "emu", pan: true },
  czSiriusCab: { name: "CRRC Sirius (665) end car", kind: "emu" },
  czSiriusMid: { name: "CRRC Sirius (665) middle car", kind: "emu", pan: true },
  czRegioSprinter: { name: "RegioSprinter railcar", kind: "emu" },
  czEso: { name: "Class 362/363 electric locomotive", kind: "electric", pan: true },
  cz816: { name: "Class 816 railcar (single Regionova)", kind: "emu" },
  // Other railroads' cars on the international trains.
  atTaurus: { name: "ÖBB Taurus (1116) electric locomotive, railjet paint", kind: "electric", pan: true },
  at1216: { name: "ÖBB Taurus (1216) electric locomotive", kind: "electric", pan: true },
  atRjCoach: { name: "ÖBB railjet coach", kind: "coach", amenities: ["first", "business", "dining"] },
  atRjCab: { name: "ÖBB railjet driving trailer", kind: "coach", cab: true, amenities: ["first", "business"] },
  atNjSleeper: { name: "ÖBB Nightjet sleeping car", kind: "coach", amenities: ["sleepers"] },
  atNjCouchette: { name: "ÖBB Nightjet couchette car", kind: "coach", amenities: ["sleepers"] },
  atNjCoach: { name: "ÖBB Nightjet seated coach", kind: "coach" },
  atDesiroCab: { name: "ÖBB cityjet (Desiro ML) end car", kind: "emu", pan: true },
  atDesiroMid: { name: "ÖBB cityjet (Desiro ML) middle car", kind: "emu" },
  gyDesiroCab: { name: "Raaberbahn Ventus (Desiro ML) end car", kind: "emu", pan: true },
  gyDesiroMid: { name: "Raaberbahn Ventus (Desiro ML) middle car", kind: "emu" },
  gy247: { name: "GySEV class 247 diesel railcar", kind: "emu" },
  huVectron: { name: "MÁV Vectron electric locomotive", kind: "electric", pan: true },
  huCoach: { name: "MÁV-START coach", kind: "coach" },
  huSleeper: { name: "MÁV sleeping car", kind: "coach", amenities: ["sleepers"] },
  huCouchette: { name: "MÁV couchette car", kind: "coach", amenities: ["sleepers"] },
  plSleeper: { name: "PKP Intercity sleeping car", kind: "coach", amenities: ["sleepers"] },
  plCoach: { name: "PKP Intercity coach", kind: "coach" },
  cdSleeper: { name: "ČD sleeping car", kind: "coach", amenities: ["sleepers"] },
  cdCouchette: { name: "ČD couchette car", kind: "coach", amenities: ["sleepers"] },
  cdCoach: { name: "ČD coach", kind: "coach" },
  cdVectron: { name: "ČD Vectron electric locomotive", kind: "electric", pan: true },
  skSleeper: { name: "ZSSK sleeping car", kind: "coach", amenities: ["sleepers"] },
  skCouchette: { name: "ZSSK couchette car", kind: "coach", amenities: ["sleepers"] },
  skVectron: { name: "ZSSK Vectron (383) electric locomotive", kind: "electric", pan: true },
  deEr20: { name: "Die Länderbahn ER20 (223) diesel locomotive", kind: "diesel" },
  deAlexCoach: { name: "alex coach (Die Länderbahn)", kind: "coach" },
};

const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
// Drawings that differ by the car's place in the train (consist.js draws
// identical cars once).
const byIndex = (ctx) => ctx.index;
export const MODELS = {
  cz380: M(loco109E, 59.06),
  czVectron: M(vectron, 62.27),
  czCoach: M((c) => euroCoach(c), 86.6),
  czRjCoach: M(rjCoach, 86.9, false, byIndex),
  czRjCab: M(rjCab, 86.9, true),
  czPendoCab: M(pendolinoCab, 91.5, true),
  czPendoMid: M(pendolinoMid, 85.0, false, byIndex),
  czElefant471: M(elefant471, 86.6, true),
  czElefant071: M(elefant071, 86.6),
  czElefant971: M(elefant971, 86.6, true),
  czPanter640: M(panterCab, 86.8, true),
  czPanter650: M(panterCab, 86.8, true),
  czPanterMid: M(panterMid, 86.8),
  czLink: M(linkCar, 71.7, true),
  czRegionova: M((c) => regionova({ ...c, trailer: c.index % 2 === 1 }), 46.65, true, byIndex),
  czRs1: M(rs1, 83.7),
  cz628: M(vt628, 75.1, true),
  czLint: M(lintCar, 68.7, true),
  czElf: M(elfCar, 71.5, true),
  czFlirtCab: M(leoFlirtCab, 70.5, true),
  czFlirtMid: M(leoFlirtMid, 51.5, false, byIndex),
  czFox: M(fox, 72.95, true),
  czFoxPid: M((c) => fox({ ...c, livery: "pid" }), 72.95, true),
  cz842: M(car842, 82.68),
  cz843: M(car843, 82.68),
  cz943: M(car943, 82.68, true),
  cz810: M(railbus810, 45.83),
  cz010: M(trailer010, 45.83),
  cz660Cab: M(interCab, 86.8, true),
  cz660Mid: M(interMid, 86.8, false, byIndex),
  czCjCoach: M(cjCoach, 86.9),
  czCjCab: M(cjCab, 86.9, true),
  czMoraviaCab: M((c) => panterCab({ ...c, livery: "jmk" }), 86.8, true),
  czMoraviaMid: M((c) => panterMid({ ...c, livery: "jmk" }), 86.8),
  czTraxx: M(traxx, 62.0),
  czElfPid: M((c) => elfCar({ ...c, livery: "pid" }), 71.5, true),
  czElfMid: M(elfMid, 64.0),
  czSiriusCab: M(siriusCab, 91.9, true),
  czSiriusMid: M(siriusMid, 85.3),
  czRegioSprinter: M(regioSprinter, 81.36),
  czEso: M(eso, 55.1),
  cz816: M((c) => twinEnded(c, regionova), 46.65),
  atTaurus: M((c) => taurus({ ...c, livery: "railjet" }), 63.25),
  at1216: M(taurus, 64.24),
  atRjCoach: M(obbRjCoach, 86.9, false, byIndex),
  atRjCab: M(obbRjCab, 87.9, true),
  atNjSleeper: M(njSleeper, 86.6),
  atNjCouchette: M(njCouchette, 86.6),
  atNjCoach: M(njCoach, 86.6),
  atDesiroCab: M(dmlCab, 84.0, true),
  atDesiroMid: M(dmlMid, 78.7),
  gyDesiroCab: M((c) => dmlCab({ ...c, livery: "ventus" }), 84.0, true),
  gyDesiroMid: M((c) => dmlMid({ ...c, livery: "ventus" }), 78.7),
  gy247: M(gy247, 83.4),
  huVectron: M((c) => vectron({ ...c, livery: "mav" }), 62.27),
  huCoach: M(huCoach, 86.6, false, byIndex),
  huSleeper: M(huSleeper, 86.6),
  huCouchette: M(huCouchette, 86.6),
  plSleeper: M(plSleeper, 80.4),
  plCoach: M(plCoach, 80.4),
  cdSleeper: M(cdSleeper, 86.6),
  cdCouchette: M(cdCouchette, 86.6),
  cdCoach: M(cdCoach, 86.6),
  cdVectron: M((c) => vectron({ ...c, agency: "czcd" }), 62.27),
  skSleeper: M(skSleeper, 80.4),
  skCouchette: M(skCouchette, 86.6),
  skVectron: M((c) => vectron({ ...c, agency: "zssk" }), 62.27),
  deEr20: M(er20, 63.24),
  deAlexCoach: M(alexCoach, 86.6, false, byIndex),
};

// [first, last, type], by UIC number (class and serial run together).
export const FLEETS = {
  czcd: [[380001, 380020, "cz380"], [681001, 681007, "czPendoCab"], [471001, 471083, "czElefant471"], [640001, 640008, "czPanter640"],
    [640101, 640112, "czPanter640"], [640201, 640260, "czPanter640"], [650001, 650008, "czPanter650"], [650201, 650246, "czPanter650"],
    [844001, 844031, "czLink"], [814001, 814210, "czRegionova"], [840001, 840016, "czRs1"], [841001, 841017, "czRs1"]],
  czregiojet: [[654001, 654007, "czElf"]],
  czleo: [[480001, 480005, "czFlirtCab"]],
  czarriva: [[845101, 845104, "cz628"]],
};

// A train's line or kind: "S4", "R19", "Ex3", or "Osobní", "railjet"...
const lineNo = (route) => Number((/^[A-Z]+(\d+)/.exec(route || "") || [])[1]);
const set = (label, ...units) => ({ label, units });

// ---------- Where a train runs ----------
// Every Czech station the five railroads' timetables stop at, by its CIS
// number (the stop ids' last part): the region (kraj) it lies in, and
// whether it is on electrified track. Built for October 2026 from the
// timetables' stop positions and OpenStreetMap (a station within 120 m of a
// railway tagged electrified=contact_line counts as electrified; the region
// is that of the nearest of a set of seed towns per kraj). Packed as each
// station's number less the one before (two base-36 digits, or "~" and
// four), then its region letter, upper case when electrified: A Prague,
// S Central Bohemia, P Plzeň, K Karlovy Vary, U Ústí, L Liberec, H Hradec
// Králové, E Pardubice, J Vysočina, C South Bohemia, B South Moravia,
// M Olomouc, T Moravia-Silesia, Z Zlín. A train is electric when every one
// of its Czech stops is electrified, and in the region most of them are.
const CZ_STATIONS = "~0pgtz07M02T01B07M02t01B07M03B07M03M07m02t01M07m02t01M07m02t01M07m02t01B07M02t01B07M02T01B07m02T01B07t02T01B07t03b07M03z07M03z07t03z0ab07M03z0az0ab0ab0ab07t02T02z06m02T02z06m02T0aT0aT0at08m02t01B07m03B07M03B07m02t01B07t02t01B09t0at0at01B09t0at01B09t01B09t01z07z02t01z07m02T01B07m02T01z02B05m02T03B05m02T03E04T01m02T01z02B05M02T01b02E05M02T01b07z02T01b07z03b07z02t01b07z02t01b07z02t01z07m03z07m03j07m03j07m02t01j07m02t01m07m03m07m03z07m03b07z02T01b09T01b07m02t0aT01J07t0cT01J0aJ0hm02t0at01b07Z03b07Z03b07Z03z07m03z07m03z07m03z07m03z0az0ab07Z03b07Z03b07Z03b07Z03B07Z03z07m03z07m0am03B07m03z07m02t08m02t01B0ab09t08M02m08M03B07M03B07M02t01B07M02T01M07M03M0az0aB0aZ09t08M02t08m02t08m0am03B07m0am0am02T01M07m02T01M07m02T01b07m02T01b07m02t01M07m02t01M07M02t01j01j04t04t01j09t0aT01J09T01J09t01J0aJ07m02t08m0at02t08t0at03b07M03b07M03j07m04M06m0dm01M0jB07M0aM02T08m02T08m02T01m07m01T01T01m07m03m07m02T0aT0aT0aT0aT0at01j07m03m07m03m09t01m0am07M02t01m07M02T08M02T01z07M02Z01B07M01M01Z01B07m03B02M05m02t01J07m02t01J07m02t01z08T02z03T06t01z0az0bz06M04z06M03B07M02t01B07M02t01b09t01b09T08m0am0dB0aB0aB0az0az07m03z07z0kz02T08m02t01B07m02T01B07m0am02t06b02m02T01b07m02T01b07m02t01b07m02t01b07m02t08m05e05M05e05m02T03e05M02T03e05M02T01B07M03B07M05e05M03B01B06M02t01b07Z03b09t01j07M02t08M02t08M02t0aT0im0xj0ab07M0aM03B07M03Z0ab0ab07Z0aZ03j07z03Z07z03Z07Z03Z07z03b07t03b07t03M07m03b0ab0ab07z03b07m03M07m03M07m0az0az0az0aM0aM0am03z07t03z07t03j07t03j07t03j07m03b07t03b0ab07Z03j07z03j07z03b0az0hZ03z07M03J07M03z07m03z07m0aM0dz0az07m03Z07m03z0kB0aB0aB0az02J0aJ1mM07M0dm0cJ0aJ0aJ08m02J08m0am0am0aB0aB0aB0ab0ab0ab0ab0aB0aB0ab0aB0kj0aj0aB0bM09J07M03b07M03B0aB0aB0aB14J0aJ0az0az0kb0ab0aB0aB0aZ0aZ0aj0aB0aB01B09j0ab0aB0aj0aj0aB0aB0aB09B01B1gJ08j0aB0aB0ab09B0bB0aB0ab0aB0aB0aB0kb0ab0aZ0aZ2iz0az0az0kz0az0az0kb0ab0ab0aj0aj0aj0aj0aj0aj0aj0kb0ab0ab0az0az0az0kb0bJ09B0aJ0aB0kM0aB0aB0aB0az0az0aB0ab0kz0uJ0aj0aJ0aj0az0az0aB0ab0ab0ab0ab0az0az0az0az0kz0az0kzgez64B0jT~0bjwA05S03S02A02S02h01S03S04S02S04S02A08S02A02S02S04S02A02S02E06S03S01H06A03S01H06A03S01H06S04H06S03U01H04S02S03U01H04S02S03U01H04S02s03U01H04S02s03U01H04S02S03U01H06S04H06S03U01H06S04H06S03U01e06S03U01h04S02S04e01A03S02S04e04S02A03U01e04S02A03U01e04S02A04e06A04e0ae09U01e09U01e09U01e04S06e04S06E09U01e09U01E09U01E0aE0aE0aE09U01E04s05U01E04S06E04S06E04S06E04s06E04S02s04m04S02s04m04S02s04m03S01S02s03U01m03S03s04m03S03s04m03E03s03U01m03E02m01s03U01m03E03s0as03U07s0as03U07s04m0am0gs04h03E03s07E03s07E03s07E01E02s04h03E03a07E03s07E03a01u06E03s07E04u06E04u03h03E04u02U07u04h06u04h06s03U01h06s0eh09U01h09U01h09U01h06s04h03E03s04h03E03s04h03e03s04h03E03s05h05s04h03E07h03E07h0ah0kh03E07h03E03s04h03E03s04h03E03s04h03E03s07M0aM03s07M0aM03s07E01S02s03u01h04S02s03U05S02s04h04S02s04h04S02a04H04S02s01s03H01s05s04E04s02s04E03S06U01E03S04s03h01h02S01S01h02s02U01e03J04s02U01e03J04s02U01e03J04s03e03J04s02U01e03J06u01e03j06u01e03j07e03j06u01e03J0aJ06u03l01J06u03l01j02s02s02u03l01j04s02u03l01j04s05l01J04S05l01J04S05l01j04S05l05S05l05S03l06S06l01E03S02U03l02E03S06l01E03S05s02E08s02e03S05s05S05s05S0aS0aS0aS08S0as02s01U09A05s05S05s05A0aA05s05A05s05A0aA0aA03U02s03S02s05s05s05s01u04s05s05s03U02s03S02s05U01l02S02s06l04s06l03S01s06l04s03u03l04s03u03l01E03s06l04s03u03l01e03s03u03l01e03a04a02l01e03s06l01e03a07e0ae03s01s01s05e03s07e03s03U04e03s03U04e03a03U07a03U03l07U03l04a03U03l04a06l03A01A0aa03U0aU07A03U01H02l01e03A03U03l01e03A03U03l01e03s06l01e03s06l01e03s03U03l01e03s03U03l01e03s03U03l04s02e04l01j03a07j03a03U03l01j03a03U03l01j03a03U04j03a06l01j03a03U03l04A03u03l0al01l01l02A06l04A06l04A06l01e03S06l01e03S06l01e03S07e03S07e03S07e03S06l01e03S06l01e03s06l01e03s06l01e03s06l01e03S03u03l01e03S03u03l01e03S03u03l01e03S03U03l04s03U04e03s03u04e03s03u04e03s03u03l04s03u07s03u04e03S03u03l01e03S07e03C07e03C06l01e03C06l01e03C06l01e03C06l01e03C04l03e03s04l02l01e03s07e03s04l03e03s04l06s04l06s04l06s04l03e03s04l06s04h0ah0ah01h09h0ah03s03S04h03s06u01h03s06u04s06u04s06u05s05u05s05u05s05u0au0au01h03e07h06a03u01h03e03a03u01h03e03a03u01h03e03a04h03e0ae03a04h03e03a04h06s04h06a03U01h03e03s03U01h03e03s03U01h06s03U01h06s03U01h06s03U01h06s04h06s04h06s03U07a07e0ae03a07e03s07e03s03U05e02s03U07s03U07s03U07s03U01h06s03U01h06s03U01h06s03U01h03j03s03U04j06U04j06U04j0aj06U01h03j0gU01h0ah09U01h06s03U02h05s03U07s03U07s03U02s05s03S02s05s03U02s05s05s05s05s05s05s0fs03U02s05s03U02s05s05s05s03U02s05s05s05s03U02s05s05s05s05s05s05s05s05s05s05s05s03U02s05s05s05s05s05s03U02s05s03U02s05s05s05s03U02s05s05s04j06s04s04u02s04s04u06j04u02s04j06s04j0aj06h0ah08u02h08u01h01s08u01h01s05s03l01h09u01h0ah0ah06s04h06s04h01s05s0as0as04h06s05s05s04s06s03u01s06s03u01h06s04h06s04h06s03u01h06s03u01h06s03u01h06s03u01h06s04h06s0as03u0au07s03u07s03u03l07u03l07u03l04s03u03l04s03u01l06s03u01l06s03u01l06s03u01l06s04h09u01h09u01h09u01h09u01h09u01h09u01h09u01h09u01h09u01h09u01h09u01h09u01h09u01h09u01H09l01h09l01h09l0al0kl0al0al0al0al0al01H09s01E03E05s02H0al08s02l08s02l0ah0al0ah0ah01h09h0ah09u01h09U01h06A03u01h07A02u07A01a02u01h09u01h09l07a03l01h06A0aa03l01h06A03l01h09l01l09l01l0al09l01l0al06A04l09l01l06A03l01l0al09l01h06a03l01h09u01h06A04h06A0eh06A05A05a0aA03A01h07A03h0ah0ah06A03u01h0ah06a04h06A04h06a04h06A04h0ah06a04h06A0eh0ah0ah0ah0ah0ah0ah0ah0ah0ah2sEb4S63U2pa1pa33A~0b79k09s01k07s03k07s03k07s03k07c03k07c03k07c02S08c02S08c02S01k07s02S0aS08C02S0aS07s03S07s09S02s03S07c03S07c03P07c03P07c03P07c03P07c03P07c03p07c03p07c03p07c03P07c03P07C04s0as06C04s06C04s06C04k06C03k07C03k07C03k07C03k07C03k07C03k07C03k07C03k07C03k07C03k07C03k07C03K07C03k07C03k07C03k07C03k07C03k07C03k07C03p0ap07C03p07C03p07C03p07C01C02p07C03p0ap07C03k01p06C03c07C01C02c07C03c07C02c01p07c0ac0ac0ac04C06c0ac0ac0ac0ac0ac0ac03P07c03p07c03p07c03p07c03p07c03p07c03p07c03p07c03p07c03p07c03p07c03p07c03C07c03C07c03C07c03P01P06c03P07c03P07c03P07c03P07c03P07c03P07c03P0aP0aP0bP09K05K05K0aK0ak0kK0ak0ak0ak0ap0ap07C03p07C03p07C03p07C03p07C03p07C03k07C03p07C03k07C03k07j03k07j03k07j03k07j01p02k07j03k07j03k07j03k07c03k07c03k07c03k07c03k07c03k01k06c0ac0ac0aC0aC0dk0kK0aP0ap0ap0ap0ap0ap0ap0ap0ak0ak0ak0ak0ak06C05k09k0ak0ak06k04k0ak0ap0ap0ap0ap07c03p08p02p08p02P01P06c01p02p08c02p08c02p07c03p07c03p07c03p07c03p0ap07C03p07C03p07C03p07C03p07C03P07C0aC0aC03P07c03P07c03P07c03p07c03P07c03P07c03P07c0ac03P05j02c03P05j05P05j04s01P05j05P05j05P05j03s02P05j05P05j05K05j05K05j05K05j05K07c03K07c03K08c02K01k01k05c03p01p06c03p07c03p07c03p07c03p07c03p07c03p07c03p07c03p07c03p07c03p07c03s07c03s07c0ac04s06c0ac04s06c04s06C04s06C04u06C0aC0aC0aC0aC0aC03P07C03P07C0aC03P07C03P0aP07C03P07C03P07C03P07C03P07C03P07C03P07C03P07C03P07C03p07C03p07C03p07C03p07C03p07C03p07c03p07c03p07c03p07c03p07c03p07c03p07c03p07c03p07c03p07c03p07c03p07c03p07c03p07c03p07c03p07c03p07C01c02p07C03p07C03p07C03p07C0aC03p1lC14J04U04J06K04J05K05J05K05J01j04K05J05K05J02c03K07c03K07c03K07c03K07c03K07c03K07c03K07c03K07c03K07c03K07c0ac0ac0ac0ac0ac02s08c02s08c02s01P07c02s08c02s08c02s08c01c01s08c02s08c02s08C02s0as08C02s08C02s08C02s08C02s0as0as28s0lp0ap0ap0ap0ap0ap0ap0ap0ap0ap0ap0ap0ap0aP1eK27k01k14p0ap0ap0kp0ap0ap0ap0ap0ap0ak0ak0ak0ak0ak0ak0ak0ak09s01p09s0as0as0as0as0as0as0as0as0as0as0as0as0as0as01p09s0as0as01P09s01p0ap0ap0ap0ap0ap0ap07c03p0ap0ap";
let stationMap = null;
function stations() {
  if (stationMap) return stationMap;
  stationMap = new Map();
  for (let i = 0, code = 0; i < CZ_STATIONS.length; i++) {
    if (CZ_STATIONS[i] === "~") { code += parseInt(CZ_STATIONS.slice(i + 1, i + 5), 36); i += 4; }
    else { code += parseInt(CZ_STATIONS.slice(i, i + 2), 36); i += 1; }
    stationMap.set(code, CZ_STATIONS[++i]);
  }
  return stationMap;
}
// { region, electric } from a train's stops (null without them). The line
// letter stands in for the region when a train has no stops (L Liberec,
// M Olomouc, P Plzeň, U Ústí, V Hradec Králové).
function whereRuns(t) {
  const m = stations(), tally = new Map();
  let electric = true, any = false;
  for (const s of t.stops || []) {
    const hit = /:CZ:(\d+)$/.exec(s.key || "");
    const v = hit && m.get(Number(hit[1]));
    if (!v) continue;
    any = true;
    if (v === v.toLowerCase()) electric = false;
    tally.set(v.toUpperCase(), (tally.get(v.toUpperCase()) || 0) + 1);
  }
  const byLine = { L: "L", M: "M", P: "P", U: "U", V: "H" }[(t.route || "")[0]] || null;
  if (!any) return { region: byLine, electric: null };
  return { region: [...tally].sort((a, b) => b[1] - a[1])[0][0], electric };
}

// ---------- Formations ----------
const PENDOLINO = set("Pendolino: a seven-car tilting electric train", ["czPendoCab", 1], ["czPendoMid", 5], ["czPendoCab", 1]);
const RAILJET = set("railjet: usually a ČD Vectron (some still a 109E) and seven railjet coaches, the driving trailer at the back", ["czVectron", 1], ["czRjCoach", 6], ["czRjCab", 1]);
const COMFORTJET = set("ComfortJet: a ČD Vectron and nine Siemens cars, the driving trailer at the back (some trains a railjet)", ["czVectron", 1], ["czCjCoach", 8], ["czCjCab", 1]);
const VECTRON_CD = (n) => set("Usually a ČD Vectron locomotive and long-distance coaches", ["czVectron", 1], ["czCoach", n]);
const ESO_CD = (n) => set("Usually a class 362 or 363 locomotive (some days a Vectron) and ČD coaches", ["czEso", 1], ["czCoach", n]);
const NIGHT = set("A locomotive with sleeping, couchette and seated cars (the night train's own railroads' cars)", ["czVectron", 1], ["czCoach", 6]);
const ELEFANT = set("CityElefant: a three-car double-deck electric unit (two coupled at busy times)", ["czElefant471", 1], ["czElefant071", 1], ["czElefant971", 1]);
const PANTER3 = set("RegioPanter: usually a three-car electric unit", ["czPanter640", 1], ["czPanterMid", 1], ["czPanter640", 1]);
const PANTER2 = (who) => set(`RegioPanter: usually a two-car electric unit${who}`, ["czPanter650", 2]);
const INTER3 = set("InterPanter: a three-car electric unit", ["cz660Cab", 1], ["cz660Mid", 1], ["cz660Cab", 1]);
const INTER5 = set("Usually an InterPanter (five cars; some trains a locomotive with coaches)", ["cz660Cab", 1], ["cz660Mid", 3], ["cz660Cab", 1]);
const MORAVIA = set("Moravia: usually a four-car electric unit (some trains two cars)", ["czMoraviaCab", 1], ["czMoraviaMid", 2], ["czMoraviaCab", 1]);
const SHARK = set("RegioShark (844): a two-car diesel unit", ["czLink", 2]);
const FOX = set("RegioFox (847): a two-section diesel unit, often two coupled", ["czFox", 2]);
const FOX_PID = set("RegioFox (847) in PID's colors: a two-section diesel unit", ["czFoxPid", 2]);
const REGIONOVA = set("Regionova (814): usually a two-car railbus", ["czRegionova", 2]);
const RS1 = set("Regio-Shuttle RS1: a single diesel railcar", ["czRs1", 1]);
const SPIDER = set("RegioSpider: a single Regio-Shuttle RS1 diesel railcar", ["czRs1", 1]);
const CAR843 = set("A class 843 diesel railcar, often with a trailer", ["cz843", 1], ["cz943", 1]);
const CAR842 = set("A class 842 diesel railcar", ["cz842", 1]);
const RAILBUS = set("A class 810 railbus and its trailer", ["cz810", 1], ["cz010", 1]);
const VT628 = set("Class 845 (ex-DB 628): usually a two-car diesel unit", ["cz628", 2]);
const LINT = set("Coradia LINT 41: a two-section diesel unit", ["czLint", 2]);
const FLIRT = set("Stadler FLIRT: a five-section electric unit", ["czFlirtCab", 1], ["czFlirtMid", 3], ["czFlirtCab", 1]);
const RJ_TRAIN = set("A TRAXX locomotive and RegioJet's yellow coaches", ["czTraxx", 1], ["czCoach", 7]);
const RJ_R8 = set("A TRAXX locomotive and RegioJet's yellow coaches", ["czTraxx", 1], ["czCoach", 5]);
const ELF = set("Pesa Elf (654): a two-car electric unit", ["czElf", 2]);
const ELF3 = set("Pesa Elf (655): a three-car electric unit in PID's colors", ["czElfPid", 1], ["czElfMid", 1], ["czElfPid", 1]);
const SIRIUS = set("CRRC Sirius (665): a three-car electric unit (one train a locomotive with coaches)", ["czSiriusCab", 1], ["czSiriusMid", 1], ["czSiriusCab", 1]);
const SPRINTER = set("Usually a RegioSprinter railcar (some trains a class 628 or a railbus)", ["czRegioSprinter", 1]);
// The night trains (zelpage.cz's compositions for the 2024 timetable, the
// latest it lists, and ČD's 2026 timetable news). Nightjet 456/457 Graz-
// Wien-Praha-Berlin: ÖBB's own cars behind a three-system Taurus (1216)
// all the way, MÁV's sleeping car and couchette from Budapest added at
// Břeclav. EuroNight Slovakia (442/443) Praha-Košice-Humenné: a ZSSK
// Vectron with ZSSK's and ČD's sleeping cars and couchettes, ČD's seats
// and car carriers (not drawn). Chopin and, from December 2025, Carpatia
// (406/407, 416), Břeclav-Bohumín-Poland: a ČD locomotive (a 362 in the
// listing) with PKP Intercity's sleeping and seated cars and ČD's sleeping
// car and couchette from Prague. Metropol (476/477) Budapest-Břeclav: a
// ČD 109E with MÁV's cars for Berlin, PKP's for Warsaw and ČD's for Prague.
export const NIGHT_SETS = {
  nightjet: set("Nightjet (ÖBB): a Taurus (1216) with ÖBB's sleeping cars, couchettes and seats, and MÁV's sleeping car and couchette from Budapest",
    ["at1216", 1], ["atNjSleeper", 2], ["atNjCouchette", 2], ["atNjCoach", 2], ["huSleeper", 1], ["huCouchette", 1]),
  slovakia: set("EuroNight Slovakia: a ZSSK Vectron with ZSSK's and ČD's sleeping cars and couchettes and a ČD coach (and car carriers to Košice)",
    ["skVectron", 1], ["skSleeper", 1], ["skCouchette", 1], ["cdSleeper", 2], ["cdCouchette", 1], ["cdCoach", 1]),
  chopin: set("EuroNight Chopin or Carpatia: usually a ČD locomotive with PKP Intercity's sleeping and seated cars and ČD's sleeping car and couchette",
    ["czEso", 1], ["plCoach", 2], ["plSleeper", 2], ["cdSleeper", 1], ["cdCouchette", 1]),
  metropol: set("EuroNight Metropol: a ČD 109E with MÁV's sleeping car, couchette and seats for Berlin, PKP's cars for Warsaw and ČD's couchette for Prague",
    ["cz380", 1], ["plCoach", 1], ["plSleeper", 1], ["huSleeper", 1], ["huCouchette", 1], ["huCoach", 1], ["cdCouchette", 1]),
};
// The Prague-Munich trains (Ex6 and EuroCity via Domažlice; zelpage.cz's
// 2024 composition of EC 363 "Bavorský expres"): a ČD 362 between Prague
// and Plzeň; from Plzeň over the unwired line through Domažlice to
// Regensburg Die Länderbahn's ER20 diesel (223); two ČD coaches and two of
// Die Länderbahn's alex coaches throughout. Leo Express takes the line
// over on 13 December 2026. A train west of Plzeň is drawn with its diesel.
const PLZEN_WEST = /Holýšov|Staňkov|Domažlice|Furth|Chotěšov|Stod|Nýřany|Pňovany/;
function westOfPlzen(t) {
  const stops = t.stops || [];
  const next = stops.find((s) => s.status === "next");
  if (!next) return false;
  const i = stops.indexOf(next), plzen = stops.findIndex((s) => /^Plzeň hl/.test(s.name || ""));
  if (plzen < 0) return PLZEN_WEST.test(next.name || "");
  // Heading west: past Plzeň; heading east: not yet there.
  const west = stops.slice(plzen + 1).some((s) => PLZEN_WEST.test(s.name || ""));
  return west ? i > plzen : i <= plzen;
}
const munich = (t) => set("Prague–Munich: a ČD 362 to Plzeň, Die Länderbahn's diesel (223) beyond, with two ČD coaches and two alex coaches",
  [westOfPlzen(t) ? "deEr20" : "czEso", 1], ["czCoach", 2], ["deAlexCoach", 2]);
// Other railroads' trains through Slovakia (zsr.cars.js): ÖBB's railjet
// xpress, its cityjets and Raaberbahn's Ventus units from Petržalka, GySEV's
// railcars to Hegyeshalom, MÁV's trains from Budapest to Košice and the
// Budapest-Warsaw Báthory.
export const FOREIGN_SETS = {
  railjet: set("railjet (ÖBB): a Taurus (1116) and seven railjet cars, the driving trailer at the back", ["atTaurus", 1], ["atRjCoach", 6], ["atRjCab", 1]),
  cityjet: set("Desiro ML: a three-car ÖBB cityjet (some trains Raaberbahn's Ventus)", ["atDesiroCab", 1], ["atDesiroMid", 1], ["atDesiroCab", 1]),
  ventus: set("Desiro ML: a three-car Raaberbahn Ventus (some trains an ÖBB cityjet)", ["gyDesiroCab", 1], ["gyDesiroMid", 1], ["gyDesiroCab", 1]),
  gysev: set("GySEV's class 247: a single diesel railcar (ex-ÖBB 5047)", ["gy247", 1]),
  kosice: set("A MÁV Vectron (through to Košice since October 2026) with MÁV and ZSSK coaches", ["huVectron", 1], ["huCoach", 3], ["czCoach", 2]),
  bathory: set("Báthory: a ČD Vectron with MÁV's coaches (ČD coaches added at Bohumín for Warsaw)", ["cdVectron", 1], ["huCoach", 4], ["cdCoach", 2]),
};
// The formation a reported car's model runs in (for the fleet pages).
const BY_MODEL = { cz380: VECTRON_CD(7), czPendoCab: PENDOLINO, czElefant471: ELEFANT, czPanter640: PANTER3, czPanter650: PANTER2(""), czLink: SHARK,
  czRegionova: REGIONOVA, czRs1: RS1, cz628: VT628, czLint: LINT, czFlirtCab: FLIRT, czElf: ELF, czVectron: VECTRON_CD(7), czFox: FOX, czFoxPid: FOX_PID,
  cz842: CAR842, cz843: CAR843, cz943: CAR843, cz810: RAILBUS, cz010: RAILBUS, cz660Cab: INTER3, czCjCoach: COMFORTJET, czCjCab: COMFORTJET,
  czMoraviaCab: MORAVIA, czTraxx: RJ_TRAIN, czElfPid: ELF3, czSiriusCab: SIRIUS, czRegioSprinter: SPRINTER, czEso: ESO_CD(6) };

// ČD's regional trains, by region and whether the line is under wires
// (ČD's and the regions' published deployments for the 2025/26 timetable,
// as cs.wikipedia's class articles list them, and the regions' news):
// Prague's busy S lines (S1, S2, S7, S9, S22) and Ostrava's S1 and S2
// CityElefants; Brno's S2, S3, S22 and S51 the region's Moravia units;
// the other electric lines RegioPanters, three-car (640) in Central
// Bohemia, Olomouc, Zlín, Pardubice and Moravia-Silesia, two-car (650) in
// South Bohemia, Plzeň, Vysočina, Karlovy Vary and Ústí. Off the wires:
// RegioFoxes (847) in PID's colors on Prague's S3, S5, S6, S8, S50, S65,
// S75, R24, R43 and R45, RegioSpiders (ex-German RS1s) on the Benešov
// branches and from Kralupy to Louny and Velvary, Regionovas (814) on
// most other Central Bohemian, South Bohemian, Ústí and Moravian-Silesian
// branches; RegioFoxes in Hradec Králové, Pardubice and Vysočina; RegioSharks
// (844) around Plzeň, Karlovy Vary and in Zlín; 842s and 843s around Brno
// and Olomouc; the RS1s ČD bought for Liberec there; 810 railbuses on the
// few branches still theirs (Pečky-Kouřim, Prostějov-Senice-Červenka,
// Hanušovice-Staré Město, Loket-Nová Role, Karlovy Vary-Merklín, Bzenec-
// Moravský Písek). Workings vary from day to day; the labels say so.
function cdRegional(t, r, where) {
  const { region, electric } = where;
  const ends = `${t.origin || ""} ${t.destination || ""}`;
  if (electric !== false) {
    if (region === "A" || region === "S") return /^(S1|S2|S7|S9|S22|R42|R44|R49)$/.test(r) ? ELEFANT : r === "S12" ? REGIONOVA : PANTER3;
    if (region === "T") return /^(S1|S2)$/.test(r) ? ELEFANT : PANTER3;
    if (region === "B") return /^(S2|S3|S22|S51)$/.test(r) ? MORAVIA : PANTER3;
    if (/[MZEH]/.test(region || "")) return PANTER3;
    if (region === "U" && r === "U1") return PANTER3;
    if (electric) return PANTER2("");
  }
  // Off the wires (or not known).
  switch (region) {
    case "A": case "S":
      if (/^(S3|S5|S6|S8|S50|S65|S75|R24|R43|R45|T4|S54)$/.test(r)) return FOX_PID;
      if (/^(S98|S99|S44|S40|U40)$/.test(r)) return SPIDER;
      if (/^(S11|S57)$/.test(r)) return RAILBUS;
      return REGIONOVA;
    case "B": case "J": if (/^(R11|R54)$/.test(r)) return CAR843;
      if (region === "J") return FOX;
      return /^(S6|S42)$/.test(r) ? CAR843 : /^S61$/.test(r) ? RAILBUS : /^S81$/.test(r) ? REGIONOVA : CAR842;
    case "C": return /^(S9|S14|S66)$/.test(r) ? FOX : REGIONOVA;
    case "T": return /^(S5|S6)$/.test(r) && /Ostrava|Frýdek|Frýdlant|Ostravice/.test(ends) ? CAR842 : r === "R27" ? CAR843 : REGIONOVA;
    case "M":
      if (/^(M41|M42|M62|M14)$/.test(r)) return RAILBUS;
      if (/^(M44|M61|M65|S43)$/.test(r)) return REGIONOVA;
      if (/^(S4|Sp4)$/.test(r)) return SHARK;
      return CAR843;
    case "Z": return /^(S6|S43)$/.test(r) ? REGIONOVA : /^S5$/.test(r) ? CAR843 : SHARK;
    case "E": return /Heřmanův Městec|Holice|Moravany|Chrudim/.test(ends) ? REGIONOVA : FOX;
    case "H": return /^(V31|V34|V40|V42|V43|V50|V51|L5|S21)$/.test(r) ? REGIONOVA : FOX;
    case "P":
      if (/^(P3|P4)$/.test(r)) return SHARK;
      if (/^(P13|P14|P22)$/.test(r)) return CAR842;
      if (/^(P24|R16|Spěšný)$/.test(r)) return FOX;
      return REGIONOVA;
    case "K": return /Loket|Nová Role|Merklín|Horní Slavkov/.test(ends) ? RAILBUS : /Chomutov|Potůčky/.test(ends) ? REGIONOVA : SHARK;
    case "L": return /^(L9|L18|L5)$/.test(r) ? REGIONOVA : RS1;
    case "U": return r === "U40" ? SPIDER : REGIONOVA;
    default: return REGIONOVA;
  }
}

export const TYPICAL = {
  czcd: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    const r = t.route || "", where = whereRuns(t), ends = `${t.origin || ""} ${t.destination || ""}`;
    // Long distance: Pendolinos on the SuperCity; ComfortJets on the
    // Berlin and Hamburg trains (Ex5 and the EuroCitys via Děčín), to
    // Vienna, Bratislava and Budapest (Ex3) and on the Rožmberk (Ex7);
    // railjets Prague-Ostrava and to Vienna and Graz; the other Ex and R
    // trains a locomotive with coaches: Vectrons on the Ex lines, 362s and
    // 363s (and Vectrons) on the R lines; InterPanters on R13 Brno-Olomouc
    // and R10 Prague-Hradec Králové.
    if (r === "SuperCity") return PENDOLINO;
    if (r === "railjet") return RAILJET;
    if (r === "Ex5" || r === "Ex3" || r === "Ex7" || (/^(EuroCity|InterCity)$/.test(r) && /Schandau|Děčín|Kúty|Břeclav/.test(ends))) return COMFORTJET;
    if (r === "Nightjet") return NIGHT_SETS.nightjet;
    if (r === "EuroNight") return /Michle|Čadca|Košice|Humenné/.test(ends) ? NIGHT_SETS.slovakia : /Bohumín|Chałupki|Břeclav/.test(ends) ? NIGHT_SETS.chopin : NIGHT;
    if (r === "R13") return INTER3;
    if (r === "R10" && where.electric !== false) return INTER5;
    if (/^(R41|R61|RE20|R33)$/.test(r)) return where.electric === false ? cdRegional(t, r, where) : /^(R33|RE20)$/.test(r) ? PANTER2("") : PANTER3;
    if (/^(R42|R43|R44|R45|R49|R24|R27|R54)$/.test(r)) return cdRegional(t, r, where);
    if ((r === "Ex6" || r === "EuroCity") && /Domažlice|Furth/.test(ends)) return munich(t);
    if (/^(EuroCity|InterCity|Expres)$/.test(r) || /^Ex\d/.test(r)) return where.electric === false ? cdRegional(t, r, where) : VECTRON_CD(7);
    if (r === "R17" || r === "R18") return ESO_CD(5);
    if (r === "Rychlík" || /^R\d/.test(r)) return where.electric === false ? cdRegional(t, r, where) : ESO_CD(5);
    return cdRegional(t, r, where);
  },
  // RegioJet (cs.wikipedia's fleet table, 6/2026): its long-distance trains
  // and R8 TRAXX locomotives with its yellow coaches; R23 the leased CRRC
  // Sirius units; Prague's S49 and S61 three-car Elfs in PID's colors; its
  // Ústí-region lines (U1, U3, U5, U7, U13, U16) two-car Elfs.
  czregiojet: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    const r = t.route || "";
    if (r === "RegioJet") return RJ_TRAIN;
    if (r === "R23") return SIRIUS;
    if (/^R\d/.test(r)) return RJ_R8;
    if (/^S\d/.test(r)) return ELF3;
    return ELF;
  },
  // Leo Express: its own FLIRTs on Prague-Ostrava; leased LINT 41s (and a
  // LINT 27) on its regional trains in the Pardubice region (ERA's 2024
  // service report).
  czleo: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    const r = t.route || "";
    if (r === "Leo Express") return FLIRT;
    if (r === "EuroCity" || r === "Expres") return set("A leased Vectron locomotive and coaches", ["czVectron", 1], ["czCoach", 5]);
    return LINT;
  },
  // Arriva vlaky (cs.wikipedia "Arriva vlaky"): RegioPanters (ex-ČD 650s) on
  // P1J Plzeň-Horažďovice předměstí; its class 845s (ex-DB 628) on R14,
  // R21, R22, R24, R26 and the Liberec-region lines; Leo Express's LINTs,
  // subcontracted, on its Zlín-region lines; 845s on its South Moravian
  // lines.
  czarriva: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    const r = t.route || "", { region } = whereRuns(t);
    if (r === "P1J") return PANTER2(" (Arriva's ex-ČD 650s)");
    if (region === "Z" || /^(S2|S5|S6|S22|S23|S53|Sp5)$/.test(r)) return set("Coradia LINT 41: a two-section diesel unit, run for Arriva by Leo Express", ["czLint", 2]);
    return VT628;
  },
  // GW Train Regio (cs.wikipedia "GW Train Regio"): modernised RS1s (841.2)
  // on P11 and P23; class 628s on R25, U52 and T8; RegioSprinters on its
  // South Bohemian lines (S4, S7, S8) and Karlovy Vary-Mariánské Lázně;
  // a railbus and its trailer or a leased RS1 on Sokolov-Kraslice; a
  // Regionova on D66 to Lubawka, a single Regionova-type car (816) on S17.
  czgwtrain: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    const r = t.route || "", ends = `${t.origin || ""} ${t.destination || ""}`;
    if (/^(R25|U52|T8)$/.test(r)) return VT628;
    if (/^(P11|P23)$/.test(r)) return set("Regio-Shuttle RS1 (841.2): a single diesel railcar", ["czRs1", 1]);
    if (r === "D66") return set("Regionova (814): a two-car railbus", ["czRegionova", 2]);
    if (r === "S17") return set("A single Regionova-type railcar with a cab at each end (816)", ["cz816", 1]);
    if (/Kraslice|Klingenthal/.test(ends)) return set("A class 810 railbus and trailer (some trains a leased RS1)", ["cz810", 1], ["cz010", 1]);
    return SPRINTER;
  },
};

const WP = "https://en.wikipedia.org/wiki/";
const cs = (page) => `https://cs.wikipedia.org/wiki/${page}`;
export const FACTS = {
  cz380: { model: "Škoda 109E (class 380)", type: "Electric locomotive", builder: "Škoda Transportation", built: "2008–2011", fleet: "20, 380 001–020",
    topSpeedMph: 124, powerHp: 8583, lengthFt: 59.1, source: `${WP}ČD_Class_380`,
    about: "ČD's three-system electric locomotive, Škoda's 109E, built for 200 km/h on Czech, Slovak, Austrian and German lines. It hauls ČD's railjets between Prague, Vienna and Graz and many of its EuroCity and InterCity trains." },
  "czVectron@czregiojet": { model: "Siemens Vectron", type: "Electric locomotive", builder: "Siemens Mobility", built: "Since 2010", fleet: "Leased, in RegioJet yellow",
    topSpeedMph: 124, powerHp: 8583, lengthFt: 62.3, source: `${WP}Siemens_Vectron`,
    about: "RegioJet hauls its long-distance trains with leased locomotives painted in its yellow, Siemens Vectrons among them. A multi-system Vectron runs on both the Czech 3 kV DC and 25 kV AC lines." },
  "czVectron@czleo": { model: "Siemens Vectron", type: "Electric locomotive", builder: "Siemens Mobility", built: "Since 2010", fleet: "Leased from Railpool",
    topSpeedMph: 124, powerHp: 8583, lengthFt: 62.3, source: cs("Leo_Express"),
    about: "Leo Express leases Vectrons for its locomotive-hauled international trains, such as the Przemyśl–Frankfurt service." },
  "czCoach@czcd": { model: "Long-distance coach", type: "Passenger coach", builder: "Various", fleet: "Hundreds", lengthFt: 86.6, source: cs("České_dráhy"),
    about: "ČD's InterCity, EuroCity and Rychlík trains are made up of standard 26.4 m coaches, many rebuilt with air conditioning, power outlets and Wi-Fi. They are drawn here in ČD's long-distance paint: light gray, a sky-blue window band under navy and a yellow line." },
  "czCoach@czregiojet": { model: "RegioJet coach", type: "Passenger coach", builder: "Various (rebuilt ex-ÖBB and new coaches)", lengthFt: 86.6, source: cs("RegioJet"),
    about: "RegioJet's yellow coaches offer Low Cost, Standard, Relax and Business classes, with stewards serving drinks and snacks at the seat." },
  "czCoach@czleo": { model: "Coach", type: "Passenger coach", builder: "Various (former Deutsche Bahn)", lengthFt: 86.6, source: cs("Leo_Express"),
    about: "Leo Express began running locomotive-hauled trains of former Deutsche Bahn coaches in 2026, as the base for its Prague–Munich plans." },
  czRjCoach: { model: "ČD railjet coach (Siemens Viaggio)", type: "Passenger coach", builder: "Siemens Mobility", built: "2013–2014", fleet: "7 seven-car sets",
    topSpeedMph: 143, lengthFt: 86.9, source: `${WP}Railjet`,
    about: "ČD's railjets are the same Siemens trains as ÖBB's, painted dark blue, with economy, first and business class and a restaurant. They run Prague–Brno–Vienna–Graz behind a ČD 109E, a driving trailer at the other end." },
  czRjCab: { model: "ČD railjet driving trailer", type: "Driving trailer", builder: "Siemens Mobility", built: "2013–2014", fleet: "7", topSpeedMph: 143, lengthFt: 86.9,
    source: `${WP}Railjet`, about: "The railjet's driving trailer has a cab at its far end, so the train runs push-pull and needs no locomotive at the back." },
  czPendoCab: { model: "Pendolino (class 680)", type: "Tilting electric multiple unit", builder: "Alstom (Fiat Ferroviaria)", built: "2004", fleet: "7 seven-car sets",
    topSpeedMph: 124, powerHp: 5257, lengthFt: 608, source: `${WP}ČD_Class_680`,
    about: "ČD's SuperCity Pendolinos tilt into curves to run faster on the old main lines, mainly Prague–Ostrava. Designed for 230 km/h, they run at up to 200 km/h." },
  czPendoMid: { model: "Pendolino (class 680)", type: "Tilting electric multiple unit", builder: "Alstom (Fiat Ferroviaria)", built: "2004", fleet: "7 seven-car sets",
    topSpeedMph: 124, powerHp: 5257, source: `${WP}ČD_Class_680`,
    about: "Each Pendolino has seven cars: two driving motor cars, motor cars, trailers and a buffet car." },
  czElefant471: { model: "CityElefant (class 471)", type: "Double-deck electric multiple unit", builder: "Škoda Vagonka", built: "1997–2013", fleet: "83 three-car units",
    topSpeedMph: 87, powerHp: 2682, seats: 310, source: `${WP}ČD_Class_471`,
    about: "Prague's and Brno's suburban workhorse: a power car with first class, an intermediate car and a cab trailer, all double-deck. Two or three units couple in rush hour." },
  czElefant071: { model: "CityElefant (class 071)", type: "Double-deck trailer", builder: "Škoda Vagonka", built: "1997–2013", seats: 310, source: `${WP}ČD_Class_471`,
    about: "The middle car of a CityElefant, unpowered, with the low floor between the trucks that both decks are reached from." },
  czElefant971: { model: "CityElefant (class 971)", type: "Double-deck cab trailer", builder: "Škoda Vagonka", built: "1997–2013", source: `${WP}ČD_Class_471`,
    about: "The CityElefant's cab trailer, at the opposite end from the power car." },
  czPanter640: { model: "RegioPanter (class 640)", type: "Electric multiple unit", builder: "Škoda Transportation", built: "2012–2024", fleet: "80 three-car units",
    topSpeedMph: 99.4, seats: 241, source: `${WP}Škoda_7Ev`,
    about: "Škoda's low-floor regional electric unit, the backbone of ČD's newer regional fleet across most regions. Three-car 640s seat about 240." },
  czPanter650: { model: "RegioPanter (class 650)", type: "Electric multiple unit", builder: "Škoda Transportation", built: "2012–2024", fleet: "54 two-car units",
    topSpeedMph: 99.4, seats: 147, lengthFt: 173.6, source: `${WP}Škoda_7Ev`,
    about: "The two-car RegioPanter, for lighter regional lines; two or three couple at busy times." },
  "czPanter650@czarriva": { model: "RegioPanter (class 650)", type: "Electric multiple unit", builder: "Škoda Transportation", built: "2018", fleet: "9 two-car units",
    topSpeedMph: 99.4, seats: 147, lengthFt: 173.6, source: cs("Arriva_vlaky"),
    about: "Arriva took over nine two-car RegioPanters in December 2023 for its Plzeň-region trains to Horažďovice předměstí." },
  czPanterMid: { model: "RegioPanter", type: "Electric multiple unit", builder: "Škoda Transportation", built: "Since 2012", topSpeedMph: 99.4, source: `${WP}Škoda_7Ev`,
    about: "The intermediate car of a three-car RegioPanter, carrying the pantograph." },
  czLink: { model: "RegioShark (Pesa Link, class 844)", type: "Diesel multiple unit", builder: "Pesa Bydgoszcz", built: "Since 2012", fleet: "31 two-car units",
    topSpeedMph: 74.6, powerHp: 1046, lengthFt: 143.5, source: `${WP}ČD_Class_844`,
    about: "A low-floor two-car diesel unit from Poland, with an engine under each car, on ČD's busier non-electrified regional lines." },
  czRegionova: { model: "Regionova (class 814)", type: "Diesel railbus", builder: "Pars nova (rebuilt from class 810)", built: "1973–1984, rebuilt 2005–2012",
    fleet: "210", topSpeedMph: 50, powerHp: 325, lengthFt: 46.7, source: `${WP}ČD_Class_814`,
    about: "The ubiquitous branch-line railbus: an 810 motor car and a trailer, rebuilt by Pars nova with new cabs and a low-floor section. It runs on two axles per car." },
  czRs1: { model: "Stadler Regio-Shuttle RS1 (classes 840 and 841)", type: "Diesel railcar", builder: "Adtranz and Stadler", built: "1996–2013", fleet: "67 with ČD",
    topSpeedMph: 74.6, powerHp: 689, lengthFt: 83.7, source: `${WP}Stadler_Regio-Shuttle_RS1`,
    about: "A single low-floor railcar with a cab at each end. ČD bought new ones for Liberec and Vysočina and later many second-hand from Germany." },
  "czRs1@czgwtrain": { model: "Stadler Regio-Shuttle RS1 (class 841.2)", type: "Diesel railcar", builder: "Adtranz and Stadler, modernised", fleet: "Pošumaví contract",
    topSpeedMph: 74.6, powerHp: 689, lengthFt: 83.7, source: cs("GW_Train_Regio"),
    about: "GW Train Regio runs modernised RS1s on its Pošumaví lines P11 Strakonice–Klatovy and P23 Klatovy–Domažlice, under a contract to 2033." },
  "cz628@czarriva": { model: "Class 845 (ex-DB 628)", type: "Diesel multiple unit", builder: "Duewag and others; rebuilt by Pars nova", built: "1986–1996",
    fleet: "845 101–104 and more", topSpeedMph: 74.6, powerHp: 650, lengthFt: 150, source: `${WP}DB_Class_628`,
    about: "Former Deutsche Bahn two-car diesels, rebuilt for Arriva's express lines such as R14 Liberec–Pardubice and Ústí nad Labem." },
  "cz628@czgwtrain": { model: "Class 628", type: "Diesel multiple unit", builder: "Duewag and others", built: "1986–1996", topSpeedMph: 74.6, powerHp: 650, lengthFt: 150,
    source: `${WP}DB_Class_628`, about: "Bought from Germany and modernised, GW Train's 628s run its Plzeň–Most express (R25) and its Ústí-region lines U52 and T8." },
  czLint: { model: "Alstom Coradia LINT 41 (class 846)", type: "Diesel multiple unit", builder: "Alstom", fleet: "11 leased from Alstom", topSpeedMph: 87, lengthFt: 137.4,
    seats: 115, source: cs("Leo_Express"),
    about: "Two articulated sections on a shared truck. Leo Express runs leased LINT 41s on regional trains in the Pardubice and Zlín regions." },
  czElf: { model: "Pesa Elf.eu (class 654)", type: "Electric multiple unit", builder: "Pesa Bydgoszcz", built: "2022–2023", fleet: "7 two-car units, plus 7 three-car 655s",
    source: `${WP}Pesa_Elf`, about: "RegioJet's low-floor electric units for its Ústí-region lines, in service since December 2022; three-car class 655s joined in 2025." },
  czFlirtCab: { model: "Stadler FLIRT (class 480)", type: "Electric multiple unit", builder: "Stadler Rail", built: "2012", fleet: "5 five-car units, 480 001–005",
    topSpeedMph: 99.4, source: `${WP}Leo_Express`,
    about: "Leo Express's dark FLIRTs, trimmed in copper and fitted for long distance with Economy, Business and Premium classes, run its Prague–Ostrava trains." },
  czFlirtMid: { model: "Stadler FLIRT (class 480)", type: "Electric multiple unit", builder: "Stadler Rail", built: "2012", fleet: "5 five-car units", topSpeedMph: 99.4,
    source: `${WP}Leo_Express`, about: "An intermediate section of a Leo Express FLIRT; sections share trucks at each joint." },
  czFox: { model: "RegioFox (Pesa Link II, class 847)", type: "Diesel multiple unit", builder: "Pesa Bydgoszcz", built: "2022–2026", fleet: "106 ordered, 847.001–106",
    topSpeedMph: 74.6, powerHp: 1006, seats: 115, lengthFt: 145.9, source: cs("Motorová_jednotka_847"),
    about: "ČD's commonest new diesel: two articulated sections with an MTU engine under each, replacing railbuses and older railcars across Central Bohemia, Hradec Králové, Pardubice, Vysočina, South Bohemia and Plzeň." },
  "czFoxPid@czcd": { model: "RegioFox (class 847) in PID's colors", type: "Diesel multiple unit", builder: "Pesa Bydgoszcz", built: "2023–2026", fleet: "38 planned for Central Bohemia by the end of 2026",
    topSpeedMph: 74.6, seats: 115, lengthFt: 145.9, source: "https://pid.cz/do-strednich-cech-prijizdeji-dalsi-regiofoxy-nove-vlaky-budou-vozit-cestujici-do-melnika-a-mlade-boleslavi/",
    about: "The Central Bohemian RegioFoxes, paid for by the region and painted in Prague Integrated Transport's red and gray, run R43 to Mladá Boleslav, S3 to Mělník and the lines around Beroun, Rakovník and Kladno." },
  cz842: { model: "Class 842", type: "Diesel railcar", builder: "Moravskoslezská vagónka, Studénka", built: "1988–1994", fleet: "37, 842.001–037", topSpeedMph: 62.1, seats: 64,
    lengthFt: 82.7, source: cs("Motorový_vůz_842"), about: "A single railcar with a cab at each end, on regional lines around Brno, Ostrava and Plzeň." },
  cz843: { model: "Class 843", type: "Diesel railcar", builder: "Moravskoslezská vagónka, Studénka", built: "1995–1997", fleet: "31, 843.001–031", topSpeedMph: 68.4, powerHp: 805,
    lengthFt: 82.7, source: cs("Motorový_vůz_843"), about: "The 842's successor with a luggage room and two engines, often running with a 943 driving trailer: R27 Olomouc–Krnov–Ostrava, R54 Brno–Třebíč and Brno's S6 and S42." },
  cz943: { model: "Class 943", type: "Driving trailer", builder: "Moravskoslezská vagónka, Studénka", built: "2006–2007", lengthFt: 82.7, source: cs("Motorový_vůz_843"),
    about: "The 843's driving trailer, the same body without engines." },
  cz810: { model: "Class 810", type: "Diesel railbus", builder: "Vagónka Studénka", built: "1975–1982", fleet: "About 40 still in ČD's regular service in 2026", topSpeedMph: 49.7,
    powerHp: 208, seats: 55, lengthFt: 45.8, source: cs("Motorový_vůz_810"),
    about: "The two-axle railbus that once ran almost every Czech branch line, now down to a few: Pečky–Kouřim, Prostějov–Senice–Červenka, Hanušovice–Staré Město, Loket–Nová Role and seasonal lines." },
  cz010: { model: "Btax trailer (ex-010)", type: "Railbus trailer", builder: "Vagónka Studénka", built: "1970s–1980s", lengthFt: 45.8, source: cs("Motorový_vůz_810"),
    about: "The railbus's unpowered trailer, with its own diesel heating." },
  cz660Cab: { model: "InterPanter (classes 660.0 and 660.1)", type: "Electric multiple unit", builder: "Škoda Transportation", built: "2015–2016", fleet: "4 three-car and 10 five-car units",
    topSpeedMph: 99.4, source: "https://ceskedrahy.cz/en/interpanter-line-r13", about: "The RegioPanter's long-distance version, on R13 Brno–Olomouc and other R lines." },
  czCjCoach: { model: "ComfortJet", type: "Push-pull trainset", builder: "Siemens Mobility and Škoda Group", built: "2023–2026", fleet: "20 nine-car sets",
    topSpeedMph: 142.9, seats: 555, source: "https://www.cd.cz/nase-vlaky/comfortjet/vlak/-40084/",
    about: "ČD's newest long-distance trains, pushed and pulled by a Vectron: Prague–Berlin–Hamburg–Copenhagen and Prague–Vienna–Bratislava–Budapest, and some domestic expresses." },
  czMoraviaCab: { model: "Moravia (classes 530 and 550)", type: "Electric multiple unit", builder: "Škoda Transportation", built: "2022–2023", fleet: "31 four-car and 6 two-car units",
    seats: 333, source: cs("Moravia_(elektrická_jednotka)"), about: "The South Moravian Region's own RegioPanter-family units, run by ČD on Brno's S2, S3 and S51." },
  czTraxx: { model: "Bombardier TRAXX 3 MS (388.2)", type: "Electric locomotive", builder: "Bombardier (Alstom)", built: "2020–2023", fleet: "31 (and 4 TRAXX MS2e, 386.2)",
    topSpeedMph: 99.4, powerHp: 8583, lengthFt: 62.0, source: cs("RegioJet"), about: "RegioJet's own multi-system locomotives, hauling its yellow trains from Prague to Ostrava, Košice, Bratislava and Vienna, and R8." },
  czElfPid: { model: "Pesa Elf.eu (class 655)", type: "Electric multiple unit", builder: "Pesa Bydgoszcz", built: "2024–2025", fleet: "7 three-car units", seats: 231,
    topSpeedMph: 99.4, source: cs("RegioJet"), about: "RegioJet's three-car Elfs in PID's colors for Prague's S49 and S61, in service since April 2025." },
  czSiriusCab: { model: "CRRC Sirius (ZEMU03, class 665)", type: "Electric multiple unit", builder: "CRRC Zhuzhou", built: "2019–2021", fleet: "3, leased",
    source: `${WP}CRRC_ZEMU03`, about: "Built for Leo Express and leased to RegioJet, which runs them on R23 Kolín–Ústí nad Labem since December 2024." },
  czRegioSprinter: { model: "Duewag RegioSprinter", type: "Diesel railcar", builder: "Duewag", built: "1995–1996", fleet: "16, from Rurtalbahn", lengthFt: 81.4,
    source: "https://de.wikipedia.org/wiki/Duewag_RegioSprinter", about: "Three-module low-floor railcars GW Train Regio bought from Germany for its South Bohemian lines and Karlovy Vary–Mariánské Lázně." },
  czEso: { model: "Škoda 69E (classes 362 and 363)", type: "Electric locomotive", builder: "Škoda Plzeň", built: "1980–1990", fleet: "181 built", topSpeedMph: 74.6,
    powerHp: 4083, lengthFt: 55.1, source: `${WP}ČD_Class_363`,
    about: "The dual-system \"Eso\" that still hauls many of ČD's R trains (Prague–České Budějovice, –Plzeň, –Brno, Ústí–Cheb); the 362s are 363s rebuilt for 140 km/h." },
  cz816: { model: "Class 816", type: "Diesel railcar", builder: "Rebuilt from an 810", lengthFt: 46.7, source: cs("GW_Train_Regio"),
    about: "A single Regionova-type railcar with a cab at each end; GW Train Regio runs one on Milotice nad Opavou–Vrbno pod Pradědem." },
};
const unitPart = (facts, name) => ({ ...facts, model: `${facts.model}, ${name}` });
FACTS.czFoxPid = FACTS["czFoxPid@czcd"];
FACTS.cz660Mid = unitPart(FACTS.cz660Cab, "intermediate car");
FACTS.czCjCab = unitPart(FACTS.czCjCoach, "driving trailer");
FACTS.czMoraviaMid = unitPart(FACTS.czMoraviaCab, "intermediate car");
FACTS.czElfMid = unitPart(FACTS.czElfPid, "middle car");
FACTS.czSiriusMid = unitPart(FACTS.czSiriusCab, "middle car");

// Other railroads' cars on the international trains.
const de = (page) => `https://de.wikipedia.org/wiki/${page}`;
const ZELPAGE = "https://www.zelpage.cz/razeni/24/vlaky/cd-456";
Object.assign(FACTS, {
  atTaurus: { model: "Siemens Taurus (ÖBB 1116)", type: "Electric locomotive", builder: "Siemens and Krauss-Maffei", built: "1999–2006", fleet: "382 with the 1016s",
    topSpeedMph: 143, powerHp: 8579, lengthFt: 63.25, source: de("Siemens_ES64U2"),
    about: "ÖBB's standard electric locomotive for 15 kV and 25 kV AC; the ones painted for the railjet haul its push-pull sets, here the railjet xpress between Bratislava, Vienna, Innsbruck and Switzerland." },
  at1216: { model: "Siemens Taurus III (ÖBB 1216)", type: "Electric locomotive", builder: "Siemens", built: "2006–2008", fleet: "50",
    topSpeedMph: 143, powerHp: 8579, lengthFt: 64.24, source: de("ÖBB_1216"),
    about: "The three- and four-system Taurus, for the Czech, Slovak, Slovenian and Italian lines; it hauls the Nightjet between Graz, Vienna, Prague and Berlin all the way." },
  atRjCoach: { model: "railjet coach (Siemens Viaggio)", type: "Passenger coach", builder: "Siemens Mobility", built: "2008–2013", fleet: "60 seven-car sets with ÖBB",
    topSpeedMph: 143, lengthFt: 86.9, source: `${WP}Railjet`,
    about: "ÖBB's railjet: business, first and economy class, a restaurant car and a driving trailer, pushed or pulled by a Taurus at up to 230 km/h." },
  atRjCab: { model: "railjet driving trailer (80-90.7)", type: "Driving trailer", builder: "Siemens Mobility", built: "2008–2013", topSpeedMph: 143, lengthFt: 87.9,
    source: `${WP}Railjet`, about: "The railjet's cab car, with business class behind the cab and first class beyond." },
  atNjSleeper: { model: "Nightjet sleeping car (WLABmz)", type: "Sleeping car", builder: "Siemens SGP", built: "2003–2005, refurbished for the Nightjet", lengthFt: 86.6,
    source: ZELPAGE, about: "Twelve compartments of one to three beds, some with their own shower and toilet; on the Nightjet between Graz, Vienna, Prague and Berlin." },
  atNjCouchette: { model: "Nightjet couchette car (Bcmz)", type: "Couchette car", builder: "Various, rebuilt", lengthFt: 86.6, source: ZELPAGE,
    about: "Compartments of four or six berths, made up at night as couchettes; breakfast is included." },
  atNjCoach: { model: "Nightjet seated coach (Bmz)", type: "Passenger coach", builder: "Various", lengthFt: 86.6, source: ZELPAGE,
    about: "Ordinary second-class compartments for the Nightjet's seated passengers." },
  atDesiroCab: { model: "Siemens Desiro ML (ÖBB cityjet 4744/4746)", type: "Electric multiple unit", builder: "Siemens Mobility", built: "Since 2015",
    fleet: "Over 200 units", topSpeedMph: 99.4, lengthFt: 246.6, source: de("ÖBB_4744"),
    about: "ÖBB's three-car regional train for the Vienna area, the cityjet; its REX trains run from Vienna to Bratislava-Petržalka through Kittsee." },
  gyDesiroCab: { model: "Siemens Desiro ML (Raaberbahn 4744.3/4746.3, Ventus)", type: "Electric multiple unit", builder: "Siemens Mobility", built: "2016 and 2021",
    fleet: "13 units", topSpeedMph: 99.4, seats: 244, lengthFt: 246.6, source: de("GySEV-Baureihe_4744/4746"),
    about: "Raaberbahn's (GySEV's) Desiro MLs, the same as ÖBB's cityjets bar details; they run its REX 6 from Bratislava-Petržalka through Vienna to Eisenstadt and Deutschkreutz." },
  gy247: { model: "GySEV class 247 (ex-ÖBB 5047)", type: "Diesel railcar", builder: "Jenbacher Werke", built: "1987–1995; to GySEV in 2011", fleet: "7, 247 503–509",
    topSpeedMph: 74.6, powerHp: 570, seats: 62, lengthFt: 83.4, source: de("ÖBB_5047"),
    about: "Austrian railcars GySEV bought and refurbished; they run between Bratislava, Rajka and Hegyeshalom." },
  huVectron: { model: "Siemens Vectron MS (MÁV 193)", type: "Electric locomotive", builder: "Siemens Mobility", built: "Since 2017", fleet: "About 24 multi-system, leased",
    topSpeedMph: 99.4, powerHp: 8583, lengthFt: 62.3, source: "https://iho.hu/hirek/oktobertol-kassara-is-atjarnak-a-mav-os-vectronok-260929",
    about: "MÁV's leased Vectrons; from October 2026 its multi-system ones haul the trains from Budapest to Košice across the border, onto Slovakia's 3 kV DC, without a change at Hidasnémeti." },
  huCoach: { model: "MÁV-START coach", type: "Passenger coach", builder: "Various, refurbished", lengthFt: 86.6, source: "https://hu.wikipedia.org/wiki/Hern%C3%A1d_nemzetk%C3%B6zi_InterCity",
    about: "MÁV-START's InterCity coaches on its trains to Košice and the Báthory to Warsaw, in its blue and white." },
  huSleeper: { model: "MÁV sleeping car (WLABmz)", type: "Sleeping car", builder: "Various", lengthFt: 86.6, source: ZELPAGE,
    about: "MÁV's through sleeping car from Budapest, coupled to the Nightjet at Břeclav for Prague and Berlin." },
  huCouchette: { model: "MÁV couchette car (Bcmz)", type: "Couchette car", builder: "Various", lengthFt: 86.6, source: ZELPAGE,
    about: "MÁV's couchettes from Budapest, coupled to the Nightjet at Břeclav." },
  plSleeper: { model: "PKP Intercity sleeping car (WLAB)", type: "Sleeping car", builder: "Waggonbau Görlitz and Bautzen, modernised", lengthFt: 80.4,
    source: "https://www.zelpage.cz/razeni/24/vlaky/cd-406", about: "PKP Intercity's sleeping cars on the night trains from Vienna, Munich, Budapest and Prague to Warsaw and Kraków." },
  plCoach: { model: "PKP Intercity coach", type: "Passenger coach", builder: "Various", lengthFt: 80.4, source: "https://www.zelpage.cz/razeni/24/vlaky/cd-406",
    about: "PKP Intercity's seated cars on its night trains through Czechia." },
  cdSleeper: { model: "ČD sleeping car (WLABmz)", type: "Sleeping car", builder: "Siemens SGP", built: "2003", lengthFt: 86.6, source: "https://www.zelpage.cz/razeni/24/vlaky/cd-443",
    about: "ČD's sleeping cars on its night trains to Slovakia and Poland, with compartments of one to three beds." },
  cdCouchette: { model: "ČD couchette car (Bcmz)", type: "Couchette car", builder: "Various, refurbished", lengthFt: 86.6, source: "https://www.zelpage.cz/razeni/24/vlaky/cd-443",
    about: "ČD's couchettes, four or six berths a compartment, on its night trains to Slovakia and Poland." },
  skSleeper: { model: "ZSSK sleeping car (WLABmee)", type: "Sleeping car", builder: "Waggonbau Görlitz", lengthFt: 80.4, source: "https://www.zelpage.cz/razeni/24/vlaky/cd-443",
    about: "ZSSK's sleeping cars on the EuroNight between Prague, Košice and Humenné." },
  skCouchette: { model: "ZSSK couchette car (Bcmh)", type: "Couchette car", builder: "Various", lengthFt: 86.6, source: "https://www.zelpage.cz/razeni/24/vlaky/cd-443",
    about: "ZSSK's couchettes on the EuroNight between Prague and Košice." },
  skVectron: { model: "Siemens Vectron (ZSSK 383)", type: "Electric locomotive", builder: "Siemens Mobility", built: "Since 2017", fleet: "15, leased", topSpeedMph: 99.4,
    powerHp: 8583, lengthFt: 62.3, source: "https://www.zelpage.cz/razeni/24/vlaky/cd-443",
    about: "ZSSK's leased Vectrons haul the EuroNight between Prague and Košice across both countries' systems." },
  deEr20: { model: "Siemens ER20 Herkules (Die Länderbahn 223)", type: "Diesel-electric locomotive", builder: "Siemens", built: "2003–2004", topSpeedMph: 87,
    powerHp: 2700, lengthFt: 63.24, source: de("Siemens_ER20"),
    about: "Die Länderbahn's diesels haul the Prague–Munich trains over the unwired lines between Plzeň, Domažlice, Schwandorf and Regensburg." },
  deAlexCoach: { model: "alex coach (Die Länderbahn)", type: "Passenger coach", builder: "Various, refurbished", lengthFt: 86.6, source: "https://www.zelpage.cz/razeni/24/vlaky/cd-363",
    about: "Die Länderbahn's alex coaches, first and second class with a bistro, run through from Munich to Prague with ČD's." },
});
FACTS.cdVectron = FACTS["czVectron@czcd"] || { model: "Siemens Vectron (ČD 383 and leased 193)", type: "Electric locomotive", builder: "Siemens Mobility", topSpeedMph: 124,
  powerHp: 8583, lengthFt: 62.3, source: `${WP}Siemens_Vectron`, about: "ČD's Vectrons haul its EuroCity trains, the Báthory between Budapest and Warsaw among them." };
FACTS.cdCoach = FACTS["czCoach@czcd"];
FACTS.atDesiroMid = unitPart(FACTS.atDesiroCab, "middle car");
FACTS.gyDesiroMid = unitPart(FACTS.gyDesiroCab, "middle car");
