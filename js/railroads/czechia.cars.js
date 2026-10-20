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
    trucks: { centers: 62.3, wb: 8.2, d: 36 }, diaphragm: [4.25, 11.8], rows,
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
  paint: vectronPaint, over: vectronOver, surround: c.agency === "zssk" ? ZS.dark : isLeo(c) ? "#111214" : c.agency === "czcd" ? CD.navy : RJ.black,
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
const FOX = { roof: 14.04, sill: 2.4, door: 40.0 };
function foxPaint(c, g) {
  const L = g.L, pid = c.livery === "pid";
  if (pid) {
    return bands(L, [[0, 20, "#e6e8ea"], [12.7, 3, "#c9cdd2"], [0, 2.75, "#3a3d42"]]) +
      rect(FOX.door - 6.2, 2.75, 17.0, 10.0, CD.red) + rect(9.6, 6.25, L - 9.6, 3.95, "#16181b") +
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
export const fox = (c) => unit(c, { roof: FOX.roof, sill: FOX.sill, nose: NOSE_FOX, rake: [[2.7, 8.9], [5.2, 12.8]], depth: 2.9, cabLen: 9, lampY: 4.7,
  rows: foxRows, doors: [foxDoor(FOX.door)], diaphragm: [2.6, 12.6], paint: foxPaint,
  surround: c.livery === "pid" ? "#16181b" : CD.navy,
  // Its own trucks (the motor truck under the cab, the Jakobs truck shared at
  // the joint); the power pack and fuel tank between them and the door, the
  // battery and air boxes under the low floor; on the roof the engine's
  // cooling module and exhaust behind the cab, air-conditioning over the
  // saloon, the brake resistor toward the joint.
  extra: (cc, g) => truck(17.1, { wb: 7.9, d: 30.7, top: FOX.sill }) + truck(g.L, { wb: 9.5, d: 30.7, top: FOX.sill }) +
    boxes(22.0, 31.0, FOX.sill, 1, 1.3) + tank(31.4, 37.6, FOX.sill, 0.9) + boxes(45.5, 62.0, FOX.sill - 0.3, 3, 0.5) +
    rect(12.5, FOX.roof - 0.05, 13.0, 1.15, C.steelDark, 0.4, 'rx="0.3"') + slats(13.2, FOX.roof + 0.2, 11.6, 0.75, 0.42, "rgba(0,0,0,0.3)") + exhaust(25.0, FOX.roof) +
    hvac(36.0, FOX.roof, 11.0, 0.8) + rect(52.0, FOX.roof - 0.05, 9.0, 0.55, C.steelDark, 0.4, 'rx="0.2"') +
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
function axle(x, sill) {
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
  extra: (cc, g) => axle(12.5, 3.9) + axle(g.L - 12.5, 3.9) + hvac(18, 11.6, 9, 0.55) + exhaust(29, 11.6) + buffers(g.L, 1, { sill: 3.9 }) +
    rect(5.2, 2.9, 3.6, 0.3, "currentColor") + rect(5.6, 2.3, 2.8, 0.25, "currentColor", 0, 'opacity="0.8"') + line(4.4, 11.15, g.L - 0.8, 11.15, "rgba(0,0,0,0.25)", 0.6) +
    boxes(16.4, 20.6, 3.9, 1, 1.1) + tank(21.0, 26.0, 3.9, 2.2) + boxes(26.4, g.L - 16.4, 3.9, 1, 1.0) + rect(g.L - 9.2, 2.7, 2.6, 1.2, "currentColor", 0, 'opacity="0.75" rx="0.1"') +
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
const SIRIUS = { slate: "#666d74", roof: "#8a9197", yellow: "#f6b800" };
const siriusPaint = (cab) => (c, g) => bands(g.L, [[0, 20, SIRIUS.slate], [12.4, 3, SIRIUS.roof], [4.35, 0.55, SIRIUS.yellow], [0, 3.95, "#3b3f44"]]) +
  (cab ? path("M13.2 4.35L13.2 12.0L13.9 12.0L13.9 4.35Z", SIRIUS.yellow) + path("M13.0 12.0Q11.0 12.4 9.0 11.0Q8.0 9.6 8.4 7.4L9.0 7.4Q8.8 9.4 9.6 10.6Q11.2 11.7 13.0 11.4Z", SIRIUS.yellow) +
    path("M9.2 7.6Q9.0 9.6 10.0 10.6Q11.4 11.4 12.8 11.0L12.8 7.6Q11.0 7.0 9.2 7.6Z", C.glass) : "");
const siriusRows = (xs) => [{ xs, y: 6.9, w: 4.0, h: 3.4, r: 0.4 }];
export const siriusCab = (c) => unit(c, { roof: 13.6, sill: 3.6, nose: NOSE_SIRIUS, rake: [[1.4, 7.2], [7.2, 12.2]], depth: 3.6, cabLen: 14, lampY: 5.0,
  rows: siriusRows(seq(16.0, 5.3, 10)), doors: [plug(c.L - 11.6, 3.6, 10.8, 4.2)], trucks: [11.5, c.L - 8.0], paint: siriusPaint(true),
  doorFill: () => SIRIUS.yellow, surround: "#202326",
  extra: (cc, g) => path(poly([[3.0, 3.6], [7.0, 3.6], [6.4, 1.0], [3.4, 0.8], [2.6, 2.4]]), "#d9622b") + hvac(18, 13.6, 13) + rect(45, 13.55, 14, 0.55, C.steelDark, 0.4, 'rx="0.25"') +
    boxes(18, g.L - 16, 3.6, 4, 1.1) + mark(cc, 40, 11.3, `<path d="M-6.1 -0.65L-5.85 -0.65L-5.85 0.65L-6.1 0.65ZM-5.65 -0.65L-5.4 -0.65L-5.4 0.65L-5.65 0.65Z" fill="#ffffff"/>` +
      txt(-5.1, 0, 1.25, "REGIOJET", "#ffffff", { weight: 700, anchor: "start" })) });
export const siriusMid = (c) => unit(c, { roof: 13.6, sill: 3.6,
  rows: siriusRows(seq(4.0, 5.3, 13)), doors: [plug(c.L - 11.0, 3.6, 10.8, 4.2)], trucks: [8.0, c.L - 8.0], paint: siriusPaint(false), doorFill: () => SIRIUS.yellow,
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
  czRegionova: M(regionova, 46.65, true),
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
const RAILJET = set("railjet: a ČD 109E locomotive and seven railjet coaches, the driving trailer at the back", ["cz380", 1], ["czRjCoach", 6], ["czRjCab", 1]);
const PENDOLINO = set("Pendolino: a seven-car tilting electric train", ["czPendoCab", 1], ["czPendoMid", 5], ["czPendoCab", 1]);
const CD_LOCO = (n) => set("A 109E electric locomotive and coaches", ["cz380", 1], ["czCoach", n]);
const ELEFANT = set("CityElefant: a three-car double-deck electric unit", ["czElefant471", 1], ["czElefant071", 1], ["czElefant971", 1]);
const PANTER3 = set("RegioPanter: a three-car electric unit", ["czPanter640", 1], ["czPanterMid", 1], ["czPanter640", 1]);
const PANTER2 = (who) => set(`RegioPanter: a two-car electric unit${who}`, ["czPanter650", 2]);
const SHARK = set("RegioShark: a two-car diesel unit", ["czLink", 2]);
const REGIONOVA = set("Regionova: a two-car railbus", ["czRegionova", 2]);
const RS1 = set("Regio-Shuttle RS1: a single diesel railcar", ["czRs1", 1]);
const VT628 = set("Class 628: a two-car diesel unit", ["cz628", 2]);
const LINT = set("Coradia LINT 41: a two-section diesel unit", ["czLint", 2]);
const FLIRT = set("Stadler FLIRT: a five-section electric unit", ["czFlirtCab", 1], ["czFlirtMid", 3], ["czFlirtCab", 1]);
const RJ_TRAIN = set("A Vectron locomotive and RegioJet's yellow coaches", ["czVectron", 1], ["czCoach", 6]);
const ELF = set("Pesa Elf: a two-car electric unit", ["czElf", 2]);
// The formation a reported car's model runs in (for the fleet pages).
const BY_MODEL = { cz380: CD_LOCO(6), czPendoCab: PENDOLINO, czElefant471: ELEFANT, czPanter640: PANTER3, czPanter650: PANTER2(""), czLink: SHARK,
  czRegionova: REGIONOVA, czRs1: RS1, cz628: VT628, czLint: LINT, czFlirtCab: FLIRT, czElf: ELF, czVectron: RJ_TRAIN };

// What usually runs, by line or kind of train. ČD: SuperCity trains are
// Pendolinos, railjets its 109Es with railjet coaches, the other long-distance
// trains (EuroCity, InterCity, Ex and R lines, night trains) 109E or other
// locomotives with coaches; Prague's and Brno's main S lines (S1-S9)
// CityElefants, the other electric suburban lines RegioPanters, and the
// branch lines (unnamed Os and Sp trains, lines numbered from 20) diesel
// RegioSharks and Regionovas. Lines vary with the day's workings; the
// labels say "usually".
export const TYPICAL = {
  czcd: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    const r = t.route || "", n = lineNo(r);
    if (r === "SuperCity") return PENDOLINO;
    if (r === "railjet") return RAILJET;
    if (/^(EuroCity|InterCity|Expres|EuroNight|Nightjet|Rychlík)$/.test(r) || /^(Ex|R)\d/.test(r)) return CD_LOCO(r === "Rychlík" || /^R\d/.test(r) ? 5 : 7);
    if (/^S\d/.test(r) && n <= 9) return ELEFANT;
    if (/^[A-Z]+\d/.test(r) && n < 20) return /^S\d/.test(r) ? PANTER3 : PANTER2("");
    if (r === "Osobní" || r === "Spěšný") return REGIONOVA;
    return SHARK;
  },
  // RegioJet: its long-distance trains are locomotive-hauled yellow coaches,
  // as are R8 and R23; its Ústí-region and other regional lines Pesa Elfs.
  czregiojet: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    const r = t.route || "";
    if (r === "RegioJet") return RJ_TRAIN;
    if (/^R\d/.test(r)) return set("A locomotive and RegioJet's yellow coaches", ["czVectron", 1], ["czCoach", 5]);
    return ELF;
  },
  // Leo Express: its own FLIRTs on Prague-Ostrava; leased LINT 41s on its
  // regional trains in the Pardubice and Zlín regions.
  czleo: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    const r = t.route || "";
    if (r === "Leo Express") return FLIRT;
    if (r === "EuroCity" || r === "Expres") return set("A leased Vectron locomotive and coaches", ["czVectron", 1], ["czCoach", 5]);
    return LINT;
  },
  // Arriva: RegioPanters on the Plzeň-region electric lines (P), class 845
  // (ex-DB 628) diesels on its express and other lines.
  czarriva: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    return /^P\d/.test(t.route || "") ? PANTER2(" (Arriva's ex-ČD 650s)") : VT628;
  },
  // GW Train Regio: modernised RS1s (841.2) on its Pošumaví P lines, 628s on
  // the express and Ústí-region lines; railbuses and RS1s elsewhere.
  czgwtrain: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    const r = t.route || "";
    if (/^(R|U|T|D)\d/.test(r)) return VT628;
    return RS1;
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
};
