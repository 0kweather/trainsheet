// Germany's S-Bahns (scripts/railroads/germany.py, agency "sbahn"):
// Berlin, Hamburg, München, Stuttgart, Rhein-Main, Rhein-Ruhr and Köln,
// Hannover, Nürnberg, Mitteldeutschland, Rhein-Neckar, Dresden, Rostock,
// Magdeburg and the smaller regional S-Bahns. Trainsheet's own side views,
// at the shared scale (js/carart.js), from the builders' and operators'
// published dimensions (German Wikipedia's articles on each series and
// network, read October 2026) and from photographs (Wikimedia Commons,
// 2024-2026) measured with a perspective fit against the cars' known
// lengths; lettered here, no logo files.
//
// No formations are published for these trains (DB's RIS::Transports is for
// railway companies only), so each train is drawn as what usually runs on
// its network and line in late 2026 (TYPICAL below).

import { C, rect, circle, path, line, lines, poly, truck, pantograph } from "../carart.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const FT = 3.28084;
const m = (v) => v * FT; // metres to feet
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
// DB's lettering is DB Type, a plain sans; condensed for the S-Bahn
// wordmarks.
const DBFONT = "'DB Sans', 'DB Screen Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const STROKE = 'vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"';
let ids = 0;
const newId = () => `ts-clip-sb${++ids}`;
const inch = (mm) => mm / 25.4; // a wheel's diameter for truck()

// ===================== Lettering =====================
// Text h ft tall centered at (x, y), reading left to right on a mirrored
// car too.
export function T(c, x, y, h, text, fill, { weight = 700, spacing = 0, italic = false, family = SANS, anchor = "middle", stretch = 1 } = {}) {
  return `<text transform="translate(${n(x)} ${n(y)}) scale(${n((c.mirrored ? -1 : 1) * stretch)} -1)" y="${n(h * 0.36)}" font-size="${n(h)}" text-anchor="${anchor}" ` +
    `font-weight="${weight}"${italic ? ' font-style="italic"' : ""} letter-spacing="${spacing}" font-family="${family}" fill="${fill}">${text}</text>`;
}
// A mark drawn y-down in a box centered at (x, y), h ft tall, unmirrored.
const markAt = (c, x, y, h, inner) => `<g transform="translate(${n(x)} ${n(y)}) scale(${n((c.mirrored ? -1 : 1) * h)} ${n(-h)})">${inner}</g>`;

// DB's mark: "DB" in a rounded box. fill: the box's ground (none on the
// cars' sides, where it is an outline over the paint; white on the fronts).
export const DB_RED = "#ec0016";
export function dbMark(c, x, y, h, { color = DB_RED, fill = "none" } = {}) {
  const w = h * 1.42;
  return rect(x - w / 2, y - h / 2, w, h, fill, 0, `rx="${n(h * 0.16)}" stroke="${color}" stroke-width="${n(h * 0.12)}"`) +
    T(c, x, y - h * 0.03, h * 0.66, "DB", color, { weight: 800, family: DBFONT, spacing: -0.02 * h });
}
// The S-Bahn's sign: a white S on a green disc (Berlin and Hamburg) -
// DB's other S-Bahns use the same green disc.
export const S_GREEN = "#008d4f";
export function sDisc(c, x, y, h, { bg = S_GREEN, fg = "#ffffff", ring = null } = {}) {
  return circle(x, y, h / 2, bg, 0, ring ? `stroke="${ring}" stroke-width="${n(h * 0.06)}"` : "") + T(c, x, y - h * 0.02, h * 0.78, "S", fg, { weight: 700, family: DBFONT });
}
// "(S) Bahn Berlin" and the like: the disc, then the name in DB Type,
// read left to right on either side of the car; cx: the whole mark's
// middle.
export function sWord(c, cx, y, h, words, fill, { bg = S_GREEN } = {}) {
  const k = c.mirrored ? -1 : 1, W = h * 1.55 + words.length * h * 0.43, xl = cx - k * W / 2;
  return sDisc(c, xl + k * h * 0.62, y, h * 1.25, { bg }) + T(c, xl + k * h * 1.45, y, h * 0.78, words, fill, { weight: 500, family: DBFONT, anchor: "start" });
}

// The Verband Region Stuttgart's mark (on the S-Bahn Stuttgart's noses,
// photographed on 430 239, 2026): three dark blue bars, each with a cyan
// bar below it set off to the right, every bar leaning forward, the stack
// stepping back to the left as it goes down; "Region Stuttgart" in italics
// under it, "Stuttgart" set in. x: the mark's middle, y: its top, h: the
// whole height with the words.
export function regionStuttgart(c, x, y, h) {
  const navy = "#1f2a44", cyan = "#2a9fd6", k = 0.035;
  const bar = (x0, x1, y0, fill, edge = "") => `<path d="M${x0 + k} ${y0}L${x1 + k} ${y0}L${x1} ${y0 + 0.105}L${x0} ${y0 + 0.105}Z" fill="${fill}"${edge}/>`;
  const w = ` stroke="#ffffff" stroke-width="0.008"`;
  const inner = bar(0.13, 0.48, 0, navy) + bar(0.36, 0.66, 0.125, cyan, w) + bar(0.07, 0.43, 0.25, navy) + bar(0.31, 0.63, 0.375, cyan, w) +
    bar(0.0, 0.38, 0.5, navy) + bar(0.25, 0.6, 0.625, cyan, w) +
    `<text x="-0.04" y="0.86" font-size="0.13" font-style="italic" font-weight="600" font-family="${DBFONT}" fill="${navy}">Region</text>` +
    `<text x="0.19" y="0.99" font-size="0.13" font-style="italic" font-weight="600" font-family="${DBFONT}" fill="${navy}">Stuttgart</text>`;
  return markAt(c, x, y - h / 2, h, `<g transform="translate(-0.33 -0.5)">${inner}</g>`);
}
// White pictograms on a multi-purpose area's windows (Berlin's 481):
// the wheelchair and the bicycle, h tall, centred at (x, y).
const PICTO = {
  wheelchair: '<circle cx="-0.05" cy="-0.38" r="0.08" fill="#fff"/><path d="M-0.12 -0.26L-0.06 0.05L0.2 0.05L0.28 0.3" fill="none" stroke="#fff" stroke-width="0.07" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M-0.1 -0.08L0.12 -0.08" stroke="#fff" stroke-width="0.06" stroke-linecap="round"/><path d="M-0.17 -0.1A0.25 0.25 0 1 0 0.2 0.18" fill="none" stroke="#fff" stroke-width="0.06"/>',
  bicycle: '<circle cx="-0.27" cy="0.12" r="0.19" fill="none" stroke="#fff" stroke-width="0.06"/><circle cx="0.27" cy="0.12" r="0.19" fill="none" stroke="#fff" stroke-width="0.06"/>' +
    '<path d="M-0.27 0.12L-0.1 -0.16L0.17 -0.16L0.27 0.12M-0.1 -0.16L0.0 0.12L0.17 -0.16M0.0 0.12L-0.27 0.12M-0.14 -0.26L-0.02 -0.26M0.13 -0.24L0.19 -0.3" fill="none" stroke="#fff" stroke-width="0.05" stroke-linecap="round" stroke-linejoin="round"/>',
};
const picto = (c, kind, x, y, h) => markAt(c, x, y, h, PICTO[kind]);

// ===================== Drawing a car =====================
// Shared parts, all measured in metres from the car's left coupler face
// (x) and the top of the rail (y), converted to feet here.
// A window: dark glass in a frame, the sky's reflection high in it.
function pane(x, y, w, h, r = 0.35, frame = "#1c1f24") {
  return rect(x, y, w, h, C.glass, 0, `rx="${n(r)}" stroke="${frame}" stroke-width="0.7" ${STROKE}`) +
    rect(x + 0.15, y + h * 0.6, w - 0.3, h * 0.3, C.glassLight, 0, `rx="${n(Math.min(r, 0.2))}"`);
}
// Underfloor cases between a and b (feet) hung from top.
function cases(a, b, top, k = 2, depth = 1.0, fill = "#2c2f35") {
  if (b - a < 1) return "";
  const w = (b - a) / k;
  let s = "";
  for (let i = 0; i < k; i++) s += rect(a + i * w + 0.25, top - depth, w - 0.5, depth, fill, 0, 'rx="0.1"') + line(a + i * w + 0.5, top - depth + 0.25, a + (i + 1) * w - 0.5, top - depth + 0.25, "rgba(255,255,255,0.12)", 0.5);
  return s;
}
// The automatic coupler (Scharfenberg) out from the nose to its face (x 0).
function autoCoupler(x1, y = m(0.95)) {
  return rect(0.35, y - 0.28, x1 - 0.2, 0.56, "#2a2d31") + rect(0, y - 0.62, 0.48, 1.24, "#3b3f45", 0.4, 'rx="0.14"') +
    rect(0.1, y - 0.14, 0.26, 0.28, "#1b1d20") + rect(0.55, y + 0.4, 0.8, 0.42, "#5a6068", 0.3, 'rx="0.08"');
}
const coupledCouplers = (y = m(0.95)) => rect(-0.2, y - 0.28, 1.6, 0.56, "#2a2d31") + rect(-0.25, y - 0.55, 0.5, 1.1, "#3b3f45");
// A pantograph on its base frame; dir -1: the knee toward the left.
const panGear = (x, roof, { up = true, dir = -1 } = {}) => rect(x - 3.0, roof - 0.05, 6.0, 0.35, "#5d636c", 0.4, 'rx="0.12"') + pantograph(x, roof + 0.3, { up, facing: dir });
// A roof box (converter, air conditioning) from a to b, h tall.
const roofBox = (a, b, roof, h = 0.9, fill = "#9aa1a8") => path(poly([[a, roof - 0.1], [a + 0.4, roof + h], [b - 0.4, roof + h], [b, roof - 0.1]]), fill, 0.4);
// Roof louvres along the eave: a grille band.
function grille(a, b, y0, y1, fill = "rgba(0,0,0,0.22)") {
  const segs = [];
  for (let x = a + 0.25; x < b; x += 0.5) segs.push([x, y0, x, y1]);
  return lines(segs, fill, 0.5);
}

// Every unit's end cars face outward: a car drawn with its cab on the left
// is key; turned round (closing its unit) key + "R".
function facingRight(c, draw) {
  const mm = { ...c, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: c.coupledL };
  return `<g transform="matrix(-1 0 0 1 ${n(c.L)} 0)">${draw(mm)}</g>`;
}

// The body: outline from the nose's points (bottom to roof; feet) or a
// plain end, the paint clipped to it and shaded like every other drawing,
// then what stands proud of it. o: sill, roof, nose, rear, eaveR, base,
// paint(g), over(g), under(g), top(g), ends [floor, top] of the bellows.
function body(c, o) {
  const L = c.L, { sill, roof } = o, r = o.endR ?? 0.9;
  const pts = o.nose ? o.nose.map((p) => [...p]) : [[0.25, sill], [0.25, roof - r], ["q", 0.25, roof, 0.25 + r, roof]];
  const rearPts = o.rear ? o.rear.map((p) => [...p]) : [[L - 0.25 - r, roof], ["q", L - 0.25, roof, L - 0.25, roof - r], [L - 0.25, sill]];
  const d = poly([...pts, ...rearPts]);
  const id = newId();
  const ys = d.match(/-?\d+(\.\d+)?/g).map(Number).filter((_, i) => i % 2 === 1), lo = Math.min(...ys), hi = Math.max(...ys);
  const stop = (off, color, v, fb) => `<stop offset="${off}" stop-color="${color}" stop-opacity="${fb}" style="stop-opacity:var(${v},${fb})"/>`;
  const shade = `<linearGradient id="${id}-s" gradientUnits="userSpaceOnUse" x1="0" y1="${n(lo)}" x2="0" y2="${n(hi)}">` +
    stop(0, "#000", "--car-shade-low", 0.16) + '<stop offset="0.36" stop-color="#000" stop-opacity="0"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/>' +
    stop(0.8, "#fff", "--car-shade-high", 0.1) + '<stop offset="0.93" stop-color="#fff" stop-opacity="0"/>' + stop(1, "#000", "--car-shade-roof", 0.08) + "</linearGradient>";
  const g = { L, sill, roof };
  let s = o.under ? o.under(g) : "";
  const [ef, et] = o.ends || [sill + 1.2, roof - 1.4];
  if (c.coupledR && !o.cabR) s += rect(L - 0.45, ef, 0.45, et - ef, C.rubber) + lines([[L - 0.12, ef + 0.2, L - 0.12, et - 0.2]], "#3a3f45", 0.6);
  if (c.coupledL && !o.nose) s += rect(0, ef, 0.45, et - ef, C.rubber) + lines([[0.12, ef + 0.2, 0.12, et - 0.2]], "#3a3f45", 0.6);
  s += `<path d="${d}" fill="${o.base}"/><clipPath id="${id}"><path d="${d}"/></clipPath><defs>${shade}</defs>` +
    `<g clip-path="url(#${id})">${o.paint(g)}<rect x="-5" y="${n(lo)}" width="${n(L + 10)}" height="${n(hi - lo)}" fill="url(#${id}-s)"/></g>`;
  s += o.over ? o.over(g) : "";
  s += `<path d="${d}" fill="none" stroke="currentColor" stroke-width="0.8" ${STROKE}/>`;
  return s + (o.top ? o.top(g) : "");
}

// A generic single-deck multiple-unit car from a spec, all in metres:
//   len, sill, floor, eave, roof: the body's heights;
//   nose: the cab's profile (bottom to roof, metres from the coupler
//     face), or none for a coupled end; cabR: a cab at the right too;
//   doors: [[a, b], ...]; door(c, a, b): draws one; wins: [[a, b], ...]
//     at winLo..winHi (or [a, b, lo, hi]);
//   paint(c, g), marks(c, g): the livery under and over the openings;
//   trucks: [[x, wheelbase, wheel mm], ...];
//   top(c, g), under(c, g): roof gear, underfloor gear (feet).
function emu(c, S) {
  const L = c.L;
  const nose = S.nose ? S.nose.map((p) => (p[0] === "q" ? ["q", m(p[1]), m(p[2]), m(p[3]), m(p[4])] : [m(p[0]), m(p[1])])) : null;
  const sill = m(S.sill), roof = m(S.roof);
  const winRow = () => (S.wins || []).map(([a, b, lo = S.winLo, hi = S.winHi]) => (S.pane || pane)(m(a), m(lo), m(b - a), m(hi - lo), S.winR ?? 0.35, S.frame)).join("");
  const paint = (g) => S.paint(c, g) + winRow() + (S.doors || []).map(([a, b]) => S.door(c, m(a), m(b))).join("") + (S.marks ? S.marks(c, g) : "");
  const under = (g) => {
    let s = (S.trucks || []).map(([x, wb, d]) => truck(m(x), { wb: m(wb), d: inch(d), top: sill })).join("");
    s += S.under ? S.under(c, g) : "";
    if (S.nose) s += c.coupledL ? coupledCouplers(m(S.coupler ?? 0.95)) : autoCoupler(m(S.couplerReach ?? 0.6), m(S.coupler ?? 0.95));
    return s;
  };
  return body(c, {
    sill, roof, nose, base: S.base, endR: m(S.endR ?? 0.25), paint, under, top: S.top ? (g) => S.top(c, g) : null, over: S.over ? (g) => S.over(c, g) : null,
    rear: S.rear ? S.rear.map((p) => (p[0] === "q" ? ["q", L - m(p[1]), m(p[2]), L - m(p[3]), m(p[4])] : [L - m(p[0]), m(p[1])])).reverse() : null,
    ends: [m(S.floor) + 0.2, m(S.eave) - 0.3], cabR: !!S.rear,
  });
}
// A door's leaves: plain panels split down the middle, a tall window in
// each (glass: [lo, hi] in metres), the threshold at the floor.
function leaves(a, b, lo, hi, { fill, edge = "rgba(0,0,0,0.35)", glass = null, gw = 0.62, split = true, r = 0.12 } = {}) {
  let s = rect(a, lo, b - a, hi - lo, fill, 0, `rx="${n(r)}" stroke="${edge}" stroke-width="0.6" ${STROKE}`);
  const mid = (a + b) / 2;
  if (split) s += line(mid, lo + 0.05, mid, hi - 0.05, edge, 0.7);
  if (glass) {
    const w = split ? (b - a) / 2 : b - a, gwf = Math.min(gw, 0.9);
    for (const x0 of split ? [a, mid] : [a]) s += pane(x0 + (w - w * gwf) / 2, m(glass[0]), w * gwf, m(glass[1] - glass[0]), 0.2, "#16191d");
  }
  return s;
}

// ===================== S-Bahn Berlin =====================
// Berlin's 750 V third-rail S-Bahn: every series is built to the North-
// South tunnel's profile, 3.0-3.14 m wide, about 3.6 m tall, the floor
// 1.0 m up, two-car quarter-trains ("Viertelzüge", 36.8 m over the
// couplers, 18.4 m a car) run as half (4 cars), three-quarter (6) or full
// (8) trains (de.wikipedia "S-Bahn Berlin", "DB-Baureihe 481", "DB-
// Baureihe 483/484", "BVG-Baureihe 480").
// Paint: the traditional red and ochre. The 483/484 (2020-2023) and every
// 481 rebuilt 2019-2026 (all 500 by mid 2026) carry the revised scheme:
// NCS S 1580-R red low on the side, NCS S 2010-Y10R mustard above, the
// doors deep black, no black line under the windows and no red line over
// them (the 481's red reaching up to the windows, the 484's lower). The
// 480 alone keeps the older paint: RAL 3003-like red to the windows, a
// black line under them, ochre above, a thin red line along the eave.
const BER = { red: "#b5212b", mustard: "#e3cf8e", black: "#17181a", under: "#2b2d31", roof: "#a59f8c", red480: "#a8232c", ochre480: "#d9bf78", line480: "#1b1b1b" };
const SB_WHEEL = 820;

// --- 483/484 (Stadler/Siemens, 2020-2023) ---
// 18.4 m a car; three 1.3 m doors a side (the leaves about 1.6 m over
// their frames), the end cars' crew door behind the cab; positions from
// side views at Zeuthen (2023) and Westkreuz (2024), perspective-fitted.
// Black doors, the red to 1.25 m; the cab's black mask wraps round the
// front corner; the DB mark (outlined in red), the VBB's round sign and
// "(S) Bahn Berlin" low on the yellow behind the first door.
const B484 = { len: 18.4, sill: 0.72, floor: 1.0, eave: 3.32, roof: 3.6, winLo: 1.68, winHi: 2.62, redHi: 1.4, doorHi: 2.98, doorLo: 0.74 };
const NOSE_484 = [[0.42, 0.42], [0.42, 1.22], ["q", 0.42, 1.36, 0.52, 1.4], [0.6, 2.2], [0.78, 3.28], ["q", 0.84, 3.6, 1.2, 3.6]];
function door484(c, a, b) {
  return leaves(a, b, m(B484.doorLo), m(B484.doorHi), { fill: BER.black, edge: "#3a3d42", glass: [1.12, 2.78], gw: 0.6 }) +
    rect(a - 0.1, m(B484.doorHi), b - a + 0.2, 0.12, "rgba(0,0,0,0.25)");
}
// The VBB's sign: a red ring broken at the top and bottom, "VBB" small in
// it.
const vbbSign = (c, x, y, h) => { const r = h / 2, a = 0.35, sw = h * 0.1;
  const arc = (t0, t1) => `M${n(x + r * Math.cos(t0))} ${n(y + r * Math.sin(t0))}A${n(r)} ${n(r)} 0 0 1 ${n(x + r * Math.cos(t1))} ${n(y + r * Math.sin(t1))}`;
  return `<path d="${arc(Math.PI / 2 + a, Math.PI * 1.5 - a)}${arc(-Math.PI / 2 + a, Math.PI / 2 - a)}" fill="none" stroke="#d7232f" stroke-width="${n(sw)}"/>` +
    T(c, x, y, h * 0.3, "VBB", "#d7232f", { weight: 800, family: DBFONT }); };
function car484(c, { cab = false, mid = false } = {}) {
  const S = { ...B484, base: BER.mustard };
  // Openings (metres from the left end; cab on the left).
  const doors = cab ? [[3.0, 4.6], [8.55, 10.15], [14.0, 15.6]] : [[2.9, 4.5], [8.4, 10.0], [13.9, 15.5]];
  const wins = cab ? [[5.0, 6.32], [6.82, 8.12], [10.55, 11.85], [12.25, 13.55], [16.0, 17.35]]
    : [[0.95, 2.3], [4.9, 6.2], [6.7, 8.0], [10.4, 11.7], [12.1, 13.4], [15.9, 17.2]];
  const crew = [1.72, 2.42];
  return emu(c, {
    ...S, nose: cab ? NOSE_484 : null, doors, wins, door: door484, winR: 0.45, coupler: 0.92,
    paint: (c2, g) => {
      let s = rect(-1, 0, g.L + 2, m(B484.redHi), BER.red);
      // The black lower edge of the skirt.
      s += rect(-1, 0, g.L + 2, m(0.8), BER.under);
      if (cab) {
        // The mask round the cab's corner: black from the red up past the
        // windscreen, the crew door and its rails behind it.
        s += path(poly([[m(0.66), m(B484.redHi)], [m(1.12), m(B484.redHi)], [m(1.12), m(3.3)], [m(0.94), m(3.3)], [m(0.76), m(2.2)]]), BER.black);
        s += rect(m(crew[0]), m(1.0), m(crew[1] - crew[0]), m(1.95), "none", 0, `rx="0.2" stroke="rgba(0,0,0,0.4)" stroke-width="0.6" ${STROKE}`) +
          pane(m(crew[0] + 0.14), m(2.0), m(0.42), m(0.62), 0.25);
        s += lines([[m(crew[0] - 0.08), m(1.15), m(crew[0] - 0.08), m(2.35)], [m(crew[1] + 0.08), m(1.15), m(crew[1] + 0.08), m(2.35)]], "#c7ae62", 1.1);
        // Headlight and the front's red lower half.
        s += rect(m(0.4), m(0.42), m(0.18), m(0.8), "#26292e");
      }
      return s;
    },
    marks: (c2) => {
      if (!cab) return "";
      return dbMark(c2, m(12.85), m(1.53), m(0.17), { color: DB_RED }) + vbbSign(c2, m(7.45), m(1.53), m(0.18)) +
        sWord(c2, m(5.66), m(1.53), m(0.15), "Bahn Berlin", "#2a2a2a");
    },
    trucks: [[cab ? 3.1 : 2.6, 2.1, SB_WHEEL], [15.8, 2.1, SB_WHEEL]],
    under: (c2, g) => cases(m(5.0), m(13.8), m(B484.sill) + 0.05, 3, 1.2),
    top: (c2, g) => roofBox(m(6.0), m(12.4), m(B484.roof), 0.5, "#b9b3a0"),
  });
}

// --- 481/482 (AEG/Adtranz/Bombardier, 1996-2004; rebuilt 2019-2026) ---
// A quarter-train is a 481 (the cab) and a 482 (a covered shunting desk
// at its outer end), 18.4 m each; two quarters make the smallest train.
// The big curved windscreen ("Taucherbrille") in an ochre mask; the crew
// door behind it, a big window, then three doors with two windows between
// each; positions perspective-fitted off 481 175 (Warschauer Straße,
// November 2025). The red runs up to the windows; the doors black; the DB
// mark (white outline), "(S) Bahn Berlin" in white on the red under the
// first windows.
const B481 = { len: 18.4, sill: 0.66, floor: 1.0, eave: 3.36, roof: 3.585, winLo: 1.52, winHi: 2.85, redHi: 1.36, doorHi: 3.22, doorLo: 0.68 };
const NOSE_481 = [[0.45, 0.4], [0.45, 1.2], ["q", 0.46, 1.62, 0.66, 1.75], ["q", 0.62, 2.9, 1.05, 3.35], ["q", 1.2, 3.585, 1.6, 3.585]];
function door481(c, a, b) {
  return leaves(a, b, m(B481.doorLo), m(B481.doorHi), { fill: BER.black, edge: "#3a3d42", glass: [1.15, 3.0], gw: 0.62 });
}
function car481(c, { cab = false } = {}) {
  const doors = cab ? [[4.25, 5.88], [9.6, 11.2], [14.95, 16.5]] : [[2.4, 4.0], [7.75, 9.35], [13.0, 14.6]];
  const wins = cab ? [[2.66, 4.0], [6.12, 7.56], [7.82, 9.3], [11.45, 12.85], [13.1, 14.5], [16.75, 17.95]]
    : [[0.55, 2.05], [4.25, 5.7], [5.95, 7.4], [9.6, 11.05], [11.3, 12.75], [14.9, 16.3], [16.55, 17.85]];
  return emu(c, {
    ...B481, base: BER.mustard, nose: cab ? NOSE_481 : null, doors, wins, door: door481, winR: 0.5, coupler: 0.92,
    paint: (c2, g) => {
      let s = rect(-1, 0, g.L + 2, m(B481.redHi), BER.red) + rect(-1, 0, g.L + 2, m(0.72), BER.under);
      if (cab) {
        // The crew door, its window high; the windscreen's edge seen from
        // the side; the headlight under it.
        s += rect(m(1.32), m(0.8), m(0.74), m(2.4), "none", 0, `rx="0.25" stroke="rgba(0,0,0,0.4)" stroke-width="0.6" ${STROKE}`) +
          pane(m(1.45), m(1.85), m(0.48), m(1.15), 0.35);
        s += path(`M${n(m(0.68))} ${n(m(1.8))}Q${n(m(0.7))} ${n(m(2.85))} ${n(m(1.08))} ${n(m(3.25))}`, "none", 0, `stroke="#2a2c30" stroke-width="1.1" ${STROKE}`);
      }
      return s;
    },
    marks: (c2) => cab ? sWord(c2, m(3.5), m(0.98), m(0.24), "Bahn Berlin", "#ffffff") + vbbSign(c2, m(8.56), m(1.12), m(0.2)) +
      picto(c2, "wheelchair", m(6.84), m(1.98), m(0.95)) + picto(c2, "bicycle", m(8.56), m(1.98), m(0.95)) +
      dbMark(c2, m(12.0), m(1.2), m(0.18), { color: "#ffffff" }) : "",
    trucks: [[cab ? 3.0 : 2.5, 2.2, SB_WHEEL], [15.9, 2.2, SB_WHEEL]],
    under: (c2) => cases(m(4.6), m(14.0), m(B481.sill) + 0.05, 3, 1.1),
  });
}

// --- 480 (AEG/Siemens/WU, 1986-1994) ---
// Doubled motor cars with a cab at each end of the quarter-train, the
// only series run as a single quarter; since December 2022 only on the
// S3. 18.4 m a car; the layout as the 481's (the 481 copied it), measured
// off a side view at Warschauer Straße (November 2025). The old paint:
// red to the windows with a black line along their foot, ochre above, a
// thin red line under the roof's grilles; the doors in the body colours.
const B480 = { len: 18.4, sill: 0.7, floor: 1.1, eave: 3.3, roof: 3.6, winLo: 1.56, winHi: 3.0, redHi: 1.34, doorHi: 3.2, doorLo: 0.72 };
const NOSE_480 = [[0.45, 0.42], [0.45, 1.26], ["q", 0.48, 1.72, 0.7, 1.78], [1.0, 3.2], ["q", 1.08, 3.6, 1.5, 3.6]];
function door480(c, a, b) {
  const s = rect(a, m(B480.doorLo), b - a, m(B480.redHi - B480.doorLo), BER.red480) + rect(a, m(B480.redHi), b - a, m(B480.doorHi - B480.redHi), BER.ochre480);
  return s + leaves(a, b, m(B480.doorLo), m(B480.doorHi), { fill: "none", edge: "rgba(0,0,0,0.5)", glass: [1.25, 2.95], gw: 0.5 });
}
function car480(c) {
  const doors = [[4.45, 5.9], [9.4, 10.9], [14.65, 16.15]];
  const wins = [[2.76, 4.15], [6.25, 7.75], [7.95, 9.25], [11.3, 12.7], [12.95, 14.45], [16.55, 17.85]];
  return emu(c, {
    ...B480, base: BER.ochre480, nose: NOSE_480, doors, wins, door: door480, winR: 0.3, coupler: 0.95,
    paint: (c2, g) => rect(-1, 0, g.L + 2, m(B480.redHi), BER.red480) + rect(-1, m(B480.redHi), g.L + 2, m(0.07), BER.line480) +
      rect(-1, m(3.12), g.L + 2, m(0.05), BER.red480) + rect(-1, 0, g.L + 2, m(0.75), BER.under) +
      rect(m(1.5), m(0.82), m(0.68), m(2.35), "none", 0, `rx="0.2" stroke="rgba(0,0,0,0.45)" stroke-width="0.6" ${STROKE}`) + pane(m(1.62), m(1.9), m(0.44), m(1.0), 0.3),
    marks: (c2) => sWord(c2, m(7.0), m(1.05), m(0.17), "Bahn Berlin", "#ffffff") + dbMark(c2, m(8.6), m(1.05), m(0.16), { color: "#ffffff" }),
    top: (c2, g) => grille(m(1.6), g.L - m(0.4), m(3.3), m(3.55)),
    trucks: [[2.9, 2.2, 860], [15.9, 2.2, 860]],
    under: (c2) => cases(m(4.6), m(14.0), m(B480.sill) + 0.05, 3, 1.1),
  });
}

// ===================== S-Bahn Hamburg =====================
// DB's S-Bahn Hamburg runs three-car units on 1200 V third rail, the
// dual-system ones also under the 15 kV wires to Stade. Paint (both
// series, photographed at Elbbrücken August 2026 and Dresden June 2026):
// traffic red, a light grey band low along the side and another at the
// eave, the doors grey; "(S) Bahn Hamburg" in white under the windows
// behind the cab, the DB mark outlined
// in white low on the red.
const HH = { red: "#e2001a", grey: "#c9ccce", greyDark: "#9ea3a7", under: "#34373b", roof: "#b9bdc0" };
// --- 490 (Bombardier, now Alstom, Hennigsdorf, 2013-2020 and 2025-2026) ---
// 66.0 m: end cars about 23.0 m, the middle car 20.0 m; three doors a
// side in every car, a crew door behind the long sloped nose; positions
// fitted on 490 151's side (Dresden, June 2026) by its even door pitch.
// The nose: a silver "H" framing the black windscreen, its legs running
// down the front's corners. The dual-system units (31 of the first 82,
// all 64 of 2025-2026) carry their pantograph on the middle car.
const H490 = { sill: 0.62, floor: 1.02, eave: 3.3, roof: 3.76, winLo: 1.54, winHi: 2.8, greyHi: 1.04, bandLo: 3.06, bandHi: 3.27, doorLo: 0.64, doorHi: 3.15 };
const NOSE_490 = [[0.55, 0.36], [0.5, 1.05], ["q", 0.5, 1.3, 0.75, 1.42], [1.55, 2.65], ["q", 2.15, 3.55, 2.9, 3.7], ["q", 3.15, 3.76, 3.5, 3.76]];
function door490(c, a, b) {
  return leaves(a, b, m(H490.doorLo), m(H490.doorHi), { fill: HH.grey, edge: "#7f858a", glass: [1.5, 2.95], gw: 0.48 });
}
function car490(c, { cab = false, pan = null } = {}) {
  const doors = cab ? [[8.46, 10.0], [13.6, 15.12], [18.7, 20.25]] : [[3.25, 4.8], [8.4, 9.95], [13.55, 15.1]];
  const wins = cab ? [[5.2, 6.44, H490.winLo, 2.9], [6.8, 8.0], [10.3, 11.45], [12.0, 13.2], [15.5, 16.7], [17.2, 18.4], [20.95, 22.1]]
    : [[0.85, 2.15], [5.2, 6.4], [6.85, 8.05], [10.35, 11.55], [12.0, 13.2], [15.55, 16.75], [17.85, 19.15]];
  return emu(c, {
    ...H490, base: HH.red, nose: cab ? NOSE_490 : null, doors, wins, door: door490, winR: 0.4, coupler: 0.92, couplerReach: 0.7,
    paint: (c2, g) => {
      let s = rect(-1, 0, g.L + 2, m(H490.greyHi), HH.grey) + rect(-1, 0, g.L + 2, m(0.66), HH.under) + rect(-1, m(H490.bandLo), g.L + 2, m(H490.bandHi - H490.bandLo), HH.grey);
      if (cab) {
        // The H's leg down the front corner, its foot the silver lower
        // front; the crew door with its window.
        s += path(poly([[m(0.3), m(0.66)], [m(1.5), m(0.66)], [m(1.5), m(1.3)], [m(2.05), m(2.6)], [m(2.65), m(3.4)], [m(3.3), m(3.82)], [m(2.3), m(3.9)], [m(1.25), m(2.6)], [m(0.5), m(1.45)]]), HH.grey);
        s += rect(m(3.38), m(0.95), m(0.58), m(2.2), "none", 0, `rx="0.25" stroke="rgba(0,0,0,0.4)" stroke-width="0.6" ${STROKE}`) + pane(m(3.47), m(2.0), m(0.4), m(0.95), 0.35);
      }
      return s;
    },
    marks: (c2) => cab ? sWord(c2, m(5.85), m(1.25), m(0.17), "Bahn Hamburg", "#ffffff") +
      dbMark(c2, m(12.15), m(1.32), m(0.2), { color: "#ffffff" }) : "",
    trucks: cab ? [[3.9, 2.2, 850], [20.6, 2.2, 850]] : [[2.4, 2.2, 850], [17.6, 2.2, 850]],
    under: (c2, g) => cases(m(cab ? 6.0 : 4.3), m(cab ? 18.8 : 15.7), m(H490.sill) + 0.05, 3, 1.1),
    top: (c2, g) => (pan ? panGear(g.L / 2 - m(2.5), m(H490.roof), { up: pan === "up" }) + roofBox(g.L / 2 + m(0.5), g.L / 2 + m(5.5), m(H490.roof), 0.6, "#aeb3b7")
      : roofBox(m(cab ? 9.0 : 5.0), m(cab ? 15.0 : 11.0), m(H490.roof), 0.6, "#aeb3b7")),
  });
}
// --- 474 (Adtranz/LHB, 1996-2001; rebuilt as "474plus" 2015-2023) ---
// 65.56 m: the two motor end cars about 23.4 m (trucks 16.19 m apart),
// the trailer between them 18.76 m (13.28 m); 1.035 m floor, 3.72 m
// tall. Two doors a side a car, the crew door behind the flat front;
// positions estimated off 474 615 (Elbbrücken, August 2026). The 474.3
// (42 units) are dual-system, a pantograph on the middle car.
const H474 = { sill: 0.62, floor: 1.04, eave: 3.32, roof: 3.72, winLo: 1.55, winHi: 2.72, greyHi: 1.02, bandLo: 3.02, bandHi: 3.3, doorLo: 0.64, doorHi: 3.05 };
const NOSE_474 = [[0.5, 0.38], [0.48, 1.08], [0.62, 1.2], [0.72, 2.6], ["q", 0.85, 3.55, 1.25, 3.66], ["q", 1.5, 3.72, 1.9, 3.72]];
function door474(c, a, b) {
  return leaves(a, b, m(H474.doorLo), m(H474.doorHi), { fill: HH.grey, edge: "#7f858a", glass: [1.45, 2.85], gw: 0.45 });
}
function car474(c, { cab = false, pan = null } = {}) {
  const doors = cab ? [[5.45, 7.05], [13.65, 15.25]] : [[4.35, 5.95], [12.8, 14.4]];
  const wins = cab ? [[2.95, 4.85], [7.6, 9.2], [9.55, 11.15], [11.5, 13.1], [15.8, 17.4], [17.75, 19.35], [19.7, 21.3], [21.65, 22.75]]
    : [[0.75, 2.35], [2.6, 3.85], [6.5, 7.95], [8.3, 9.75], [10.1, 11.55], [14.9, 16.2], [16.45, 18.0]];
  return emu(c, {
    ...H474, base: HH.red, nose: cab ? NOSE_474 : null, doors, wins, door: door474, winR: 0.3, coupler: 0.95,
    paint: (c2, g) => {
      let s = rect(-1, 0, g.L + 2, m(H474.greyHi), HH.grey) + rect(-1, 0, g.L + 2, m(0.66), HH.under) + rect(-1, m(H474.bandLo), g.L + 2, m(H474.bandHi - H474.bandLo), HH.grey);
      if (cab) {
        s += path(poly([[m(0.62), m(1.2)], [m(0.78), m(1.2)], [m(0.9), m(2.65)], [m(1.05), m(3.4)], [m(0.86), m(3.4)], [m(0.72), m(2.6)]]), "#1f2328");
        s += rect(m(1.55), m(0.95), m(0.9), m(2.1), "none", 0, `rx="0.2" stroke="rgba(0,0,0,0.4)" stroke-width="0.6" ${STROKE}`) + pane(m(1.68), m(1.62), m(0.62), m(1.1), 0.3);
      }
      return s;
    },
    marks: (c2) => cab ? sWord(c2, m(3.9), m(1.3), m(0.17), "Bahn Hamburg", "#ffffff") +
      dbMark(c2, m(10.35), m(1.35), m(0.2), { color: "#ffffff" }) : "",
    trucks: cab ? [[3.4, 2.3, 850], [19.6, 2.3, 850]] : [[2.74, 1.8, 760], [16.02, 1.8, 760]],
    under: (c2, g) => cases(m(cab ? 5.5 : 4.3), m(cab ? 17.4 : 14.4), m(H474.sill) + 0.05, 3, 1.0),
    top: (c2, g) => (pan ? panGear(g.L / 2, m(H474.roof), { up: pan === "up" }) : "") + (cab ? roofBox(m(6.0), m(12.0), m(H474.roof), 0.5, "#aeb3b7") : ""),
  });
}

// ===================== DB's S-Bahn family: 423, 430, 422 =====================
// Four-car articulated units (Bombardier/Alstom with Siemens): three
// Jakobs trucks under the joints, a motor truck under each cab; three
// 1.3 m doors a side in every car, a crew door behind the rounded nose,
// the floor about 1.03 m up (de.wikipedia "DB-Baureihe 423", "...430",
// "...422"). Trucks 15.14 m apart in the end cars; the middle cars 14.894 m
// (423, 430) or 15.46 m (422) between the joints; over the couplers 67.4 m
// (423), 68.3 m (430, its nose longer for the crash standard) and 69.43 m
// (422). Positions measured on 430 239 side-on (Stuttgart Hbf, August
// 2026), the 423's shorter nose on 423 075 (Pasing, 2023).
// DB's S-Bahn paint as the units carry it in 2026: traffic red; a light
// grey band low along the side and a thin one level with the window tops
// (yellow over the first class, with a white "1", where there is one:
// Stuttgart, Rhein-Main, Köln's S 11 units); the doors light grey; a dark
// grey skirt and roof covers. The networks' own marks: "(S) Bahn Stuttgart"
// / "München" / "Rhein-Main" / "Köln" under the first window, "Wir
// fahren für die Region" on Stuttgart's noses, the WLAN sign on Rhein-
// Main's; the DB mark is on the front.
const DBS = { red: "#dc1a22", grey: "#cdd1d4", skirt: "#43474c", roof: "#5b6067", yellow: "#f7c600", under: "#2f3236" };
const K42 = { sill: 0.48, floor: 1.03, eave: 3.9, roof: 4.05, winLo: 1.69, winHi: 2.97, greyLo: 0.48, greyHi: 0.89, stripeLo: 3.31, stripeHi: 3.47, doorLo: 0.5, doorHi: 3.3 };
// Nose profiles, bottom to roof (metres from the coupler face).
const NOSE_430 = [[0.42, 0.2], [0.36, 0.55], ["q", 0.36, 1.4, 0.5, 2.0], ["q", 0.75, 3.85, 2.6, 4.05]];
const NOSE_423 = [[0.42, 0.22], [0.32, 0.55], ["q", 0.3, 1.4, 0.4, 2.0], ["q", 0.58, 3.8, 2.15, 4.03]];
function door42(c, a, b) {
  return leaves(a, b, m(K42.doorLo), m(K42.doorHi), { fill: c.vrr ? "#63b32e" : DBS.grey, edge: "#7e848a", glass: [1.55, 3.0], gw: 0.52 });
}
// The DB mark on the nose's side is on its front; WLAN's arcs (Rhein-
// Main's units carry them on the nose).
const wifi = (c, x, y, h, color = "#ffffff") => {
  let s = circle(x, y, h * 0.09, color);
  for (const k of [0.38, 0.68, 0.98]) s += path(`M${n(x - h * k * 0.7)} ${n(y + h * k * 0.7)}A${n(h * k)} ${n(h * k)} 0 0 1 ${n(x + h * k * 0.7)} ${n(y + h * k * 0.7)}`, "none", 0, `stroke="${color}" stroke-width="${n(h * 0.13)}"`);
  return s;
};
// o.series: "423" | "430" | "422"; o.pos: "cab" | "mid"; o.net: "m"
// München, "s" Stuttgart, "f" Rhein-Main, "k" Köln, "r" Rhein-Ruhr;
// o.first: a first-class section behind the cab; o.pan: the
// pantograph (on the second car).
function et42(c, o) {
  const cab = o.pos === "cab", d = o.series === "423" ? -0.45 : 0; // the 423's nose is 0.45 m shorter
  const L = c.L / FT;
  const doors = cab ? [[6.55, 8.3], [11.95, 13.7], [16.35, 18.1]].map(([a, b]) => [a + d, b + d]) : [[1.75, 3.5], [L / 2 - 0.875, L / 2 + 0.875], [L - 3.5, L - 1.75]];
  const wins = cab ? [[4.6, 6.2], [8.65, 9.95], [10.35, 11.65], [14.05, 15.2], [15.35, 16.05]].map(([a, b]) => [a + d, b + d])
    : [[0.35, 1.45], [3.85, 5.0], [5.25, 6.4], [L - 6.4, L - 5.25], [L - 5.0, L - 3.85], [L - 1.45, L - 0.35]];
  const net = o.net;
  if (net === "v") c = { ...c, vrr: true };
  return emu(c, {
    ...K42, base: net === "v" ? "#d6d9db" : DBS.red, nose: cab ? (o.series === "430" ? NOSE_430 : NOSE_423) : null, doors, wins, door: door42, winR: 0.42, coupler: 0.9, couplerReach: 0.5,
    paint: (c2, g) => {
      let s = "";
      if (o.net === "v") {
        // VRR's neutral paint: pale grey, the cab green back to the crew
        // door's rear edge, green doors, the yellow first-class stripe.
        s += rect(-1, 0, g.L + 2, m(K42.greyLo), DBS.skirt) + rect(-1, m(K42.stripeHi + 0.08), g.L + 2, 20, VRR.green);
        if (cab) s += rect(-1, m(K42.greyLo), m(3.95 + d) + 1, 20, VRR.green);
        if (cab && o.first) s += rect(m(3.95 + d), m(K42.stripeLo), m(3.0), m(K42.stripeHi - K42.stripeLo), DBS.yellow);
      } else {
        s += rect(-1, 0, g.L + 2, m(K42.greyHi), DBS.grey) + rect(-1, 0, g.L + 2, m(K42.greyLo), DBS.skirt);
        s += rect(-1, m(K42.stripeLo), g.L + 2, m(K42.stripeHi - K42.stripeLo), DBS.grey);
        if (cab && o.first) s += rect(m(3.95 + d), m(K42.stripeLo), m(2.6), m(K42.stripeHi - K42.stripeLo), DBS.yellow);
      }
      // Roof covers above the eave.
      s += rect(cab ? m(2.8 + d) : -1, m(K42.eave), g.L + 2, 10, DBS.roof);
      if (cab) {
        // The seam of the cab module, the crew door and its window.
        s += line(m(2.77 + d), m(0.6), m(2.77 + d), m(3.9), "rgba(0,0,0,0.35)", 0.6);
        s += rect(m(2.98 + d), m(1.07), m(0.8), m(2.24), "none", 0, `rx="0.3" stroke="rgba(0,0,0,0.4)" stroke-width="0.6" ${STROKE}`) + pane(m(3.1 + d), m(2.2), m(0.56), m(0.85), 0.5);
        s += lines([[m(2.86 + d), m(1.1), m(2.86 + d), m(2.9)], [m(3.9 + d), m(1.1), m(3.9 + d), m(2.9)]], "#9aa0a6", 1.0);
        // The lamp cluster at the nose's corner.
        s += rect(m(0.5), m(1.62), m(0.32), m(0.5), "#2a2d31", 0, 'rx="0.2"');
      }
      return s;
    },
    marks: (c2) => {
      if (!cab) return "";
      let s = "";
      const city = { m: "Bahn München", s: "Bahn Stuttgart", f: "Bahn Rhein-Main", k: "Bahn Köln", r: "Bahn Rhein-Ruhr" }[net];
      if (city) s += sWord(c2, m(5.4 + d), m(1.25), m(0.23), city, "#ffffff");
      if (o.first) s += T(c2, m(4.25 + d), m(2.62), m(0.3), "1", net === "v" ? "#1d1f22" : "#ffffff", { weight: 700, family: DBFONT });
      if (net === "s") s += T(c2, m(1.6), m(1.58), m(0.16), "Wir fahren für die Region", "#ffffff", { weight: 600, family: DBFONT });
      if (net === "s") s += regionStuttgart(c2, m(1.95), m(1.44), m(0.7));
      if (net === "f") s += wifi(c2, m(1.55), m(2.4), m(0.45));
      return s;
    },
    trucks: cab ? [[(o.series === "423" ? 3.67 : 4.12), 2.2, 850]] : [],
    under: (c2, g) => {
      // Jakobs trucks under the joints (each car draws its half).
      let s = truck(g.L, { wb: m(2.7), d: inch(780), top: m(K42.sill) }) + (cab ? "" : truck(0, { wb: m(2.7), d: inch(780), top: m(K42.sill) }));
      return s + cases(cab ? m(6.0 + d) : m(2.2), g.L - m(2.2), m(K42.sill) + 0.05, cab ? 3 : 2, 0.9);
    },
    top: (c2, g) => (o.pan ? panGear(g.L / 2, m(K42.roof) + 0.6, { up: true }) : "") + (cab ? roofBox(m(4.0 + d), m(9.0 + d), m(K42.roof), 0.6, DBS.roof) : roofBox(m(1.5), m(5.0), m(K42.roof), 0.5, DBS.roof)),
  });
}

// ===================== 424, 425 (Bombardier/Siemens, 1998-2008) =====================
// The low-floor sisters of the 423 (0.8 m floor, toilets), 67.5 m over
// the couplers: end cars 18.245 m to the joint (trucks 15.37 m apart),
// middle cars 15.505 m; two doors a side a car, the crew door behind the
// blunter nose (de.wikipedia "DB-Baureihe 424", "...425 (1999)").
// Positions fitted on 424 002's side (Köln, September 2025) and checked
// on 425 002 (Magdeburg, March 2026).
// Paints: DB's S-Bahn red (as the 423, the first-class stripe yellow;
// Rhein-Main's S 7, Rhein-Neckar's lines S 1-S 4, S 33, S 44, Magdeburg's
// S 1, Munich's 424s on the S 7); Köln's own design on its 24 rebuilt 424s
// (2024-2026: pale grey, a black band low, the cab end red to a raked edge
// behind the first door, "(S) Bahn Köln" and go.Rheinland's mark); and
// Transdev's S-Bahn Hannover paint on its 13 425s (white, blue below and
// over the roof's edge and round the cab, red doors, "SBH S-Bahn
// Hannover" and the S in a green ring).
const K25 = { sill: 0.45, floor: 0.8, eave: 3.45, roof: 3.7, winLo: 1.4, winHi: 2.5, greyLo: 0.45, greyHi: 0.82, stripeLo: 2.88, stripeHi: 2.98, doorLo: 0.47, doorHi: 2.76 };
const NOSE_425 = [[0.42, 0.25], [0.32, 0.5], ["q", 0.28, 1.2, 0.36, 1.9], ["q", 0.48, 3.2, 1.0, 3.55], ["q", 1.35, 3.7, 1.9, 3.7]];
const SBH = { white: "#f1f1ee", blue: "#1d3d97", red: "#d3202a", green: "#2f8f3e" };
const KOE = { grey: "#cfd2d4", band: "#2c2f33", red: "#e2231a", door: "#eef0f1" };
function et425(c, o) {
  const cab = o.pos === "cab", L = c.L / FT, liv = o.liv || "db";
  const doors = cab ? [[6.85, 8.45], [13.0, 14.6]] : [[3.4, 5.0], [10.5, 12.1]];
  const wins = cab ? (o.bigS ? [[4.15, 5.25], [5.5, 6.55], [8.8, 10.2], [11.1, 12.5], [15.05, 16.25], [16.45, 17.65]]
    : [[4.15, 5.25], [5.5, 6.55], [8.75, 9.85], [10.05, 11.15], [11.35, 12.6], [15.05, 16.25], [16.45, 17.65]])
    : [[0.3, 1.4], [1.6, 2.7], [5.3, 6.4], [6.6, 7.7], [7.9, 9.0], [9.2, 10.2], [12.7, 13.85], [14.0, 15.15]];
  const doorFill = liv === "sbh" ? SBH.red : liv === "koeln" ? KOE.door : DBS.grey;
  const door = (c2, a, b) => leaves(a, b, m(K25.doorLo), m(K25.doorHi), { fill: doorFill, edge: liv === "koeln" ? "#3a3d42" : "#7e848a", glass: [1.25, 2.55], gw: 0.5 });
  const base = liv === "sbh" ? SBH.white : liv === "koeln" ? KOE.grey : DBS.red;
  return emu(c, {
    ...K25, base, nose: cab ? NOSE_425 : null, doors, wins, door, winR: 0.35, coupler: 0.85, couplerReach: 0.45,
    paint: (c2, g) => {
      let s = "";
      if (liv === "db") {
        s += rect(-1, 0, g.L + 2, m(K25.greyHi), DBS.grey) + rect(-1, 0, g.L + 2, m(K25.greyLo), DBS.skirt) + rect(-1, m(K25.stripeLo), g.L + 2, m(K25.stripeHi - K25.stripeLo), DBS.grey);
        if (cab && o.first) s += rect(m(3.9), m(K25.stripeLo), m(3.0), m(K25.stripeHi - K25.stripeLo), DBS.yellow);
      } else if (liv === "koeln") {
        s += rect(-1, 0, g.L + 2, m(0.6), KOE.band);
        if (cab) s += path(poly([[-1, m(0.6)], [m(9.25), m(0.6)], [m(10.2), m(4)], [-1, m(4)]]), KOE.red);
      } else {
        s += rect(-1, 0, g.L + 2, m(1.0), SBH.blue) + rect(-1, m(3.3), g.L + 2, 10, SBH.blue);
        if (cab) s += path(poly([[-1, 0], [m(1.6), 0], [m(1.6), m(1.9)], [m(2.4), m(3.3)], [-1, m(3.3)]]), SBH.blue);
        if (cab && o.first) s += rect(m(3.9), m(2.9), m(3.0), m(0.1), DBS.yellow);
      }
      s += rect(-1, m(K25.eave), g.L + 2, 10, liv === "sbh" ? SBH.blue : "#6b7076");
      if (cab) {
        s += rect(m(2.75), m(0.6), m(0.65), m(2.15), "none", 0, `rx="0.3" stroke="rgba(0,0,0,0.4)" stroke-width="0.6" ${STROKE}`) + pane(m(2.85), m(1.7), m(0.45), m(0.85), 0.45);
        s += rect(m(0.36), m(1.3), m(0.3), m(0.38), "#2a2d31", 0, 'rx="0.3"');
      }
      return s;
    },
    marks: (c2) => {
      if (!cab) return liv === "db" && o.bigS ? sDisc(c2, m(10.65), m(2.05), m(0.62)) : "";
      let s = "";
      const city = { m: "Bahn München", f: "Bahn Rhein-Main", rn: "Bahn RheinNeckar", md: "Bahn Mittelelbe", k: "Bahn Köln" }[o.net];
      if (liv === "sbh") {
        s += T(c2, m(5.0), m(1.42), m(0.24), "SBH", SBH.blue, { weight: 800, family: DBFONT, anchor: "middle" }) + T(c2, m(5.0), m(1.2), m(0.08), "S-Bahn Hannover", SBH.blue, { weight: 500, family: DBFONT });
        s += circle(m(3.78), m(1.95), m(0.22), "#ffffff", 0, `stroke="${SBH.green}" stroke-width="${n(m(0.035))}"`) + T(c2, m(3.78), m(1.94), m(0.3), "S", SBH.green, { weight: 700, family: DBFONT });
      } else if (city) s += sWord(c2, m(5.35), m(1.1), m(0.2), city, "#ffffff");
      if (liv === "db" && o.bigS) s += sDisc(c2, m(10.65), m(2.05), m(0.62));
      if (o.first && liv !== "koeln") s += T(c2, m(6.7), m(2.3), m(0.26), "1", liv === "sbh" ? SBH.blue : "#ffffff", { weight: 700, family: DBFONT });
      return s;
    },
    trucks: cab ? [[2.875, 2.2, 850]] : [],
    under: (c2, g) => truck(g.L, { wb: m(2.7), d: inch(780), top: m(K25.sill) }) + (cab ? "" : truck(0, { wb: m(2.7), d: inch(780), top: m(K25.sill) })) +
      cases(cab ? m(4.8) : m(2.2), g.L - m(2.2), m(K25.sill) + 0.05, cab ? 3 : 2, 0.8),
    top: (c2, g) => (o.pan ? panGear(g.L / 2, m(K25.roof) + 0.6, { up: true }) : "") + roofBox(cab ? m(4.0) : m(1.5), cab ? m(10.0) : m(6.0), m(K25.roof), 0.75, "#878c92"),
  });
}

// ===================== 420 (1969-1997) =====================
// The classic S-Bahn unit: three cars (67.4 m), each car on its own two
// trucks, four double doors a side a car; since the 2014-2020 rebuild
// Munich's 36 are in DB's S-Bahn red with light grey doors and band (the
// S 20, the Dachau-Altomünster extras, odd S 4 and S 5 runs).
const K20 = { sill: 0.62, floor: 1.0, eave: 3.4, roof: 3.75, winLo: 1.52, winHi: 2.55, greyLo: 0.62, greyHi: 0.95, doorLo: 0.64, doorHi: 2.85 };
const NOSE_420 = [[0.42, 0.42], [0.42, 1.25], ["q", 0.42, 1.55, 0.62, 1.7], [0.82, 2.85], ["q", 0.9, 3.55, 1.4, 3.7], ["q", 1.6, 3.75, 2.0, 3.75]];
function et420(c, { cab = false, pan = false } = {}) {
  const L = c.L / FT;
  const doors = cab ? [[3.05, 4.4], [7.95, 9.3], [12.8, 14.15], [17.65, 19.0]] : [[1.0, 2.35], [6.4, 7.75], [11.8, 13.15], [17.2, 18.55]];
  const wins = cab ? [[1.9, 2.75], [4.7, 5.7], [5.95, 7.6], [9.6, 11.0], [11.2, 12.5], [14.45, 15.8], [16.0, 17.35], [19.3, 20.6]]
    : [[2.65, 4.0], [4.2, 6.1], [8.05, 9.45], [9.65, 11.5], [13.45, 14.85], [15.05, 16.9]];
  return emu(c, {
    ...K20, base: DBS.red, nose: cab ? NOSE_420 : null, doors, wins, door: (c2, a, b) => leaves(a, b, m(K20.doorLo), m(K20.doorHi), { fill: DBS.grey, edge: "#7e848a", glass: [1.4, 2.6], gw: 0.55 }),
    winR: 0.3, coupler: 1.0,
    paint: (c2, g) => rect(-1, 0, g.L + 2, m(K20.greyHi), DBS.grey) + rect(-1, 0, g.L + 2, m(0.66), DBS.skirt) + rect(-1, m(K20.eave), g.L + 2, 10, "#6b7076") +
      (cab ? rect(m(1.55), m(0.8), m(0.0), 0, "none") : ""),
    marks: (c2) => cab ? sWord(c2, m(6.8), m(1.2), m(0.2), "Bahn München", "#ffffff") : "",
    trucks: [[cab ? 3.4 : 2.5, 2.5, 1000], [L - 2.6, 2.5, 1000]],
    under: (c2, g) => cases(m(5.5), g.L - m(5.0), m(K20.sill) + 0.05, 3, 0.9),
    top: (c2, g) => (pan ? panGear(g.L / 2, m(K20.roof), { up: true }) : roofBox(m(6), m(16), m(K20.roof), 0.4, "#7d8288")),
  });
}

// ===================== Low-floor articulated units =====================
// Talent 2 (Bombardier, DB class 442/1442), Coradia Continental (Alstom,
// 1440, the 2012 crash-standard head), FLIRT 3 XL (Stadler, 3427/3428/
// 3429) and Mireo (Siemens, 463): Jakobs trucks under the joints, a motor
// truck under each cab, floors 0.7-0.8 m up. Car lengths from the
// builders' unit lengths (de.wikipedia "Bombardier Talent 2": 56.2 m three
// cars, 72.3 m four, 88.4 m five; "Alstom Coradia Continental": 56.9 m,
// 73.3 m; "Stadler Flirt": the 3 XL 67.6 m three cars, 106.2 m five;
// "Siemens Mireo": 69.86 m three cars); openings from side views of each
// (Nürnberg 2022, Hirschhaid 2016; Wuppertal, Nürnberg; Bonn-Oberkassel
// 2019, Hannover 2026; Rhein-Neckar 2022), estimated where a photo is
// foreshortened.
const LF = {
  talent2: { sill: 0.32, floor: 0.7, eave: 3.8, roof: 3.9, winLo: 1.93, winHi: 3.12, doorLo: 0.35, doorHi: 2.85, wheel: 820, jwb: 2.5,
    nose: [[0.5, 0.35], [0.36, 0.7], ["q", 0.3, 1.5, 0.55, 2.0], ["q", 1.6, 3.6, 3.3, 3.9]], crew: [3.4, 4.05], motor: 3.0,
    end: { doors: [[12.4, 13.9]], wins: [[4.95, 6.7], [7.5, 9.25], [10.05, 11.8], [14.6, 16.35], [16.9, 18.65]] },
    mid: { doors: [[7.3, 8.8]], wins: [[0.75, 2.5], [3.05, 4.8], [5.35, 6.75], [9.35, 10.75], [11.3, 13.05], [13.6, 15.35]] } },
  coradia: { sill: 0.42, floor: 0.73, eave: 3.55, roof: 3.95, winLo: 1.6, winHi: 2.75, doorLo: 0.45, doorHi: 2.75, wheel: 850, jwb: 2.6,
    nose: [[0.48, 0.3], [0.36, 0.7], ["q", 0.32, 1.6, 0.6, 2.2], ["q", 1.2, 3.75, 2.8, 3.95]], crew: [3.0, 3.6], motor: 2.9,
    end: { doors: [[6.0, 7.5], [14.3, 15.8]], wins: [[4.2, 5.4], [8.2, 9.4], [9.6, 10.8], [11.0, 12.2], [12.4, 13.6], [16.5, 17.7], [17.9, 19.1]] },
    mid: { doors: [[2.5, 4.0], [12.4, 13.9]], wins: [[0.6, 1.8], [4.7, 5.9], [6.1, 7.3], [7.5, 8.7], [8.9, 10.1], [10.3, 11.5], [14.6, 15.8]] } },
  coradiaOld: { sill: 0.42, floor: 0.73, eave: 3.55, roof: 3.95, winLo: 1.6, winHi: 2.75, doorLo: 0.45, doorHi: 2.75, wheel: 850, jwb: 2.6,
    nose: [[0.45, 0.3], [0.34, 0.7], ["q", 0.3, 1.7, 0.55, 2.3], ["q", 0.95, 3.7, 2.4, 3.95]], crew: [2.6, 3.2], motor: 2.6,
    end: { doors: [[5.6, 7.1], [13.5, 15.0]], wins: [[3.8, 5.0], [7.8, 9.0], [9.2, 10.4], [10.6, 11.8], [12.0, 13.2], [15.7, 16.9], [17.2, 18.5]] },
    mid: { doors: [[2.5, 4.0], [12.4, 13.9]], wins: [[0.6, 1.8], [4.7, 5.9], [6.1, 7.3], [7.5, 8.7], [8.9, 10.1], [10.3, 11.5], [14.6, 15.8]] } },
  flirt: { sill: 0.42, floor: 0.8, eave: 3.7, roof: 4.1, winLo: 1.57, winHi: 2.62, doorLo: 0.45, doorHi: 2.85, wheel: 860, jwb: 2.7,
    nose: [[0.45, 0.35], [0.38, 1.2], ["q", 0.4, 2.0, 0.7, 2.5], ["q", 1.0, 3.8, 2.3, 4.1]], crew: [2.9, 3.6], motor: 3.0,
    end: { doors: [[9.0, 10.6], [17.3, 18.9]], wins: [[4.6, 5.65], [5.95, 7.0], [7.3, 8.35], [11.4, 12.45], [12.75, 13.8], [14.1, 15.15], [15.45, 16.5], [19.7, 20.75], [21.05, 22.1], [22.4, 23.45]] },
    mid: { doors: [[4.2, 5.8], [13.5, 15.1]], wins: [[0.7, 1.75], [2.05, 3.1], [6.6, 7.65], [7.95, 9.0], [9.3, 10.35], [10.65, 11.7], [11.95, 13.0], [15.9, 16.95], [17.25, 18.3]] } },
  mireo: { sill: 0.42, floor: 0.71, eave: 3.6, roof: 3.95, winLo: 1.55, winHi: 2.65, doorLo: 0.45, doorHi: 2.8, wheel: 850, jwb: 2.5,
    nose: [[0.5, 0.3], [0.3, 0.75], ["q", 0.28, 1.8, 0.65, 2.4], ["q", 1.6, 3.75, 3.0, 3.95]], crew: [3.3, 4.0], motor: 3.1,
    end: { doors: [[9.8, 11.4], [18.6, 20.2]], wins: [[4.9, 6.1], [6.4, 7.6], [7.9, 9.1], [12.1, 13.3], [13.6, 14.8], [15.1, 16.3], [16.6, 17.8], [21.0, 22.2], [22.5, 23.6]] },
    mid: { doors: [[3.0, 4.6], [16.6, 18.2]], wins: [[0.6, 1.8], [5.4, 6.6], [6.9, 8.1], [8.4, 9.6], [11.6, 12.8], [13.1, 14.3], [14.6, 15.8], [19.0, 20.2]] } },
};
LF.mireoB = { ...LF.mireo, end: { doors: [[14.7, 16.2], [19.8, 21.3]], wins: [[5.6, 7.3], [7.7, 9.4], [9.8, 11.5], [11.9, 13.6], [17.0, 18.7], [21.9, 22.9]] } };
// The paints: { base, doors, paint(c, g, cab, S), marks(c, cab, S) }.
const VRR = { green: "#63b32e", grey: "#d6d9db", skirt: "#3a3e43" };
const MDSB = { silver: "#bec2c5", band: "#34383d", green: "#79b829", red: "#d71920" };
const RN = { white: "#f2f3f3", grey: "#4b4f54", yellow: "#f4d01c" };
const lowerBand = (g, lo, hi, fill) => rect(-1, m(lo), g.L + 2, m(hi - lo), fill);
// The S-Bahn's sign blown up across a car side (S-Bahn Rhein-Neckar's
// Mireo): the S and the two arcs of its ring, h tall, behind the windows.
function bigS(c, x, y, h) {
  const r = h / 2, a = 0.42, sw = h * 0.09;
  const arc = (t0, t1) => `M${n(x + r * Math.cos(t0))} ${n(y + r * Math.sin(t0))}A${n(r)} ${n(r)} 0 0 1 ${n(x + r * Math.cos(t1))} ${n(y + r * Math.sin(t1))}`;
  return `<path d="${arc(Math.PI / 2 + a, Math.PI * 1.5 - a)}${arc(-Math.PI / 2 + a, Math.PI / 2 - a)}" fill="none" stroke="${RN.grey}" stroke-width="${n(sw)}"/>` +
    T(c, x, y - h * 0.02, h * 0.92, "S", RN.grey, { weight: 800, family: DBFONT });
}
const LIV = {
  // DB red: the light grey band low, the grey stripe over the windows.
  dbRed: { base: DBS.red, door: DBS.red, paint: (c, g, cab, S) => lowerBand(g, 0, S.floor + 0.2, DBS.grey) + lowerBand(g, 0, S.sill + 0.12, DBS.skirt) +
      lowerBand(g, S.winHi + 0.3, S.winHi + 0.38, DBS.grey) + rect(-1, m(S.eave), g.L + 2, 10, "#6b7076") },
  // DB's Talent 2: red, the windows in an anthracite band that sweeps up
  // the nose, a light grey strip low along the low-floor part.
  t2Red: { base: DBS.red, door: "#c3c8cc", paint: (c, g, cab, S) => talentBand(g, cab, S, "#353a40") + rect(cab ? m(5.4) : -1, m(S.sill), g.L + 2, m(0.5), "#e6e8e9") + talentWell(cab) + rect(-1, m(S.eave), g.L + 2, 10, "#6b7076") },
  t2Md: { base: MDSB.silver, door: MDSB.green, paint: (c, g, cab, S) => talentBand(g, cab, S, MDSB.band) + talentWell(cab) + rect(-1, m(S.eave), g.L + 2, 10, "#8e9398") },
  t2Md2: { base: MDSB.silver, door: MDSB.red, paint: (c, g, cab, S) => talentBand(g, cab, S, MDSB.band) + talentWell(cab) + rect(-1, m(S.eave), g.L + 2, 10, "#8e9398") },
  // VRR's neutral paint: pale grey, the cab ends, roof edge and doors green.
  vrr: { base: VRR.grey, door: VRR.green, paint: (c, g, cab, S) => lowerBand(g, 0, S.sill + 0.15, VRR.skirt) + rect(-1, m(S.eave), g.L + 2, 10, "#b9bdc0") +
      (cab ? rect(-1, m(S.sill + 0.15), m(S.crew[0] - 0.12) + 1, 20, VRR.green) : "") },
  // Transdev: white, blue below and over the roof's edge and round the
  // cab, red doors (S-Bahn Hannover, NordWestBahn).
  sbh: { base: SBH.white, door: SBH.red, paint: (c, g, cab, S) => lowerBand(g, 0, S.floor + 0.2, SBH.blue) + rect(-1, m(S.eave - 0.2), g.L + 2, 10, SBH.blue) +
      (cab ? path(poly([[-1, 0], [m(2.0), 0], [m(2.0), m(1.6)], [m(2.6), m(S.eave)], [-1, m(S.eave)]]), SBH.blue) : "") },
  nwb: { base: SBH.white, door: SBH.red, paint: (c, g, cab, S) => lowerBand(g, 0, S.floor + 0.15, SBH.blue) + rect(-1, m(S.eave), g.L + 2, 10, SBH.blue) +
      (cab ? path(poly([[-1, m(S.eave - 0.3)], [m(1.6), m(S.eave - 0.3)], [m(2.4), m(S.eave + 0.4)], [-1, m(S.eave + 0.4)]]), SBH.blue) : "") },
  // S-Bahn Rhein-Neckar's Mireo: white, the doors yellow in dark grey
  // panels, a big grey S in its ring over the cab cars' first windows.
  rn: { base: RN.white, door: RN.yellow, paint: (c, g, cab, S) => lowerBand(g, 0, S.sill + 0.1, "#3c4045") + rect(-1, m(S.eave), g.L + 2, 10, "#d9dcde") +
      S.doors.map(([a, b]) => rect(m(a - 0.3), m(S.sill), m(b - a + 0.6), m(S.eave - S.sill), RN.grey)).join("") + (cab ? bigS(c, m(7.0), m(2.05), m(3.1)) : "") },
};
// bwegt, Baden-Württemberg's own paint (DB's Breisgau Coradias, SWEG's
// Talent 3s and Mireo Plus Bs; Freiburg 2025, Offenburg 2024): white, the
// windows in a black band, the cab's top yellow, sweeping back into a
// yellow line along the eave; yellow doors; the skirt grey.
const BW = { white: "#eef0f1", black: "#24272b", yellow: "#ffd400", skirt: "#6a6f74" };
LIV.bwegt = { base: BW.white, door: BW.yellow, paint: (c, g, cab, S) => {
  let s = lowerBand(g, 0, S.sill + 0.25, BW.skirt) + rect(cab ? m(S.crew[1] + 0.2) : -1, m(S.winLo - 0.08), g.L + 2, m(S.winHi - S.winLo + 0.16), BW.black);
  s += rect(-1, m(S.eave - 0.32), g.L + 2, m(0.32), BW.yellow) + rect(-1, m(S.eave), g.L + 2, 10, "#9ea3a8");
  if (cab) s += path(`M-1 ${n(m(1.7))}L${n(m(1.0))} ${n(m(1.7))}C${n(m(1.6))} ${n(m(2.8))} ${n(m(3.0))} ${n(m(S.eave - 0.22))} ${n(m(6.5))} ${n(m(S.eave - 0.22))}` +
    `L${n(m(6.5))} ${n(m(S.roof + 1))}L-1 ${n(m(S.roof + 1))}Z`, BW.yellow) + rect(-1, 0, m(1.9), m(1.7), BW.white);
  return s;
} };
// The bwegt wordmark under the windows behind the cab: "bw" black, "egt"
// yellow, the "egt" dropped a little below the line.
const bwegtWord = (c, x, y, h) => `<text transform="translate(${n(x)} ${n(y)}) scale(${c.mirrored ? -1 : 1} -1)" y="${n(h * 0.36)}" font-size="${n(h)}" text-anchor="middle" ` +
  `font-weight="600" font-family="${DBFONT}" letter-spacing="-0.03em"><tspan fill="${BW.black}">bw</tspan><tspan fill="#e8b800" dy="${n(h * 0.18)}">egt</tspan></text>`;

// The Talent 2's window band: from the crew door back, rising over the
// nose to its roof.
function talentBand(g, cab, S, fill) {
  const lo = S.winLo - 0.05, hi = S.winHi + 0.12;
  let s = rect(cab ? m(2.6) : -1, m(lo), g.L + 2, m(hi - lo), fill);
  // Over the cab the band's foot curves up the nose and its top runs on
  // over the nose's crown (the dark windscreen surround).
  if (cab) s += path(`M${n(m(2.7))} ${n(m(lo))}C${n(m(1.7))} ${n(m(lo))} ${n(m(1.0))} ${n(m(2.4))} ${n(m(0.55))} ${n(m(3.1))}L${n(m(0.3))} ${n(m(4.2))}` +
    `L${n(m(2.0))} ${n(m(4.2))}C${n(m(2.4))} ${n(m(3.6))} ${n(m(2.6))} ${n(m(hi))} ${n(m(3.2))} ${n(m(hi))}Z`, fill);
  return s;
}
// Over the Talent 2's motor truck the body stands higher: the dark well.
const talentWell = (cab) => (cab ? rect(m(1.2), 0, m(4.0), m(0.85), "#2b2e32") : "");
// kind: LF key; liv: LIV key; pos: "cab" | "mid"; o.net: the network's
// wordmark; o.pan: a pantograph on this car.
function lowfloor(c, kind, liv, o = {}) {
  const S = LF[kind], P = LIV[liv], cab = o.pos === "cab", lay = cab ? S.end : S.mid;
  const doorFill = P.door;
  const door = (c2, a, b) => leaves(a, b, m(S.doorLo), m(S.doorHi), { fill: doorFill, edge: "rgba(0,0,0,0.45)", glass: [1.15, 2.6], gw: 0.5 });
  const SS = { ...S, doors: lay.doors };
  return emu(c, {
    ...S, base: P.base, nose: cab ? S.nose : null, doors: lay.doors, wins: lay.wins, door, winR: 0.35, coupler: 0.9, couplerReach: 0.5,
    paint: (c2, g) => {
      let s = P.paint(c2, g, cab, SS);
      // The Mireo Plus B's dark grey side from its first door to the joint.
      if (kind === "mireoB") s += rect(m(lay.doors[0][0] - 0.35), m(S.sill + 0.25), g.L, m(S.eave - 0.32 - S.sill - 0.25), "#4b5056");
      if (cab) s += rect(m(S.crew[0]), m(S.floor + 0.25), m(S.crew[1] - S.crew[0]), m(S.doorHi - S.floor - 0.2), "none", 0, `rx="0.3" stroke="rgba(0,0,0,0.4)" stroke-width="0.6" ${STROKE}`) +
        pane(m(S.crew[0] + 0.1), m(1.9), m(S.crew[1] - S.crew[0] - 0.2), m(0.8), 0.4);
      return s;
    },
    marks: (c2) => {
      let s = "";
      if (!cab) return liv === "rn" ? "" : "";
      const nets = { nue: "Bahn Nürnberg", ros: "Bahn Rostock", md: "Bahn Mitteldeutschland", rn: "Bahn Rhein-Neckar", rr: "Bahn Rhein-Ruhr", br: "Breisgau-S-Bahn" };
      const word = nets[o.net];
      const wx = kind.startsWith("coradia") ? (lay.wins[0][0] + lay.wins[0][1]) / 2 + 0.3 : (lay.wins[1] ? (lay.wins[0][0] + lay.wins[1][1]) / 2 : 5.5);
      if (liv === "rn") {
        s += sWord(c2, m(4.6), m(1.0), m(0.13), "Bahn Rhein-Neckar", "#3c4045");
      } else if (liv === "sbh" || liv === "nwb") {
        if (liv === "sbh") s += T(c2, m(wx), m(1.25), m(0.24), "SBH", SBH.blue, { weight: 800, family: DBFONT }) + T(c2, m(wx), m(1.05), m(0.08), "S-Bahn Hannover", SBH.blue, { weight: 500, family: DBFONT }) +
          circle(m(S.crew[1] + 0.45), m(2.0), m(0.22), "#ffffff", 0, `stroke="${SBH.green}" stroke-width="${n(m(0.035))}"`) + T(c2, m(S.crew[1] + 0.45), m(1.99), m(0.3), "S", SBH.green, { weight: 700, family: DBFONT });
        else s += T(c2, m(wx), m(1.25), m(0.2), "NordWestBahn", SBH.blue, { weight: 700, family: DBFONT });
      } else if (liv === "bwegt") s += bwegtWord(c2, m(kind === "mireoB" ? 9.3 : wx), m(1.15), m(0.5));
      else if (word && liv !== "vrr") s += sWord(c2, m(wx), m(liv.startsWith("t2") ? 1.55 : 1.2), m(0.2), word, "#ffffff");
      return s;
    },
    trucks: cab ? [[S.motor, 2.4, S.wheel]] : [],
    under: (c2, g) => truck(g.L, { wb: m(S.jwb), d: inch(S.wheel), top: m(S.sill) }) + (cab ? "" : truck(0, { wb: m(S.jwb), d: inch(S.wheel), top: m(S.sill) })) +
      cases(cab ? m(5.0) : m(2.4), g.L - m(2.4), m(S.sill) + 0.05, cab ? 3 : 2, 0.5),
    top: (c2, g) => (o.pan ? panGear(g.L / 2, m(S.roof) + 0.5, { up: true }) : "") + roofBox(cab ? m(4.5) : m(2.0), cab ? m(11.0) : m(7.0), m(S.roof), 0.55, "#7d8288"),
  });
}

// ===================== Tables =====================
const M = (draw, len) => ({ draw, len, oneEnd: false, variant: (c) => `${c.index}/${c.count}` });
export const TYPES = {}, MODELS = {};
function add(key, name, draw, len, extra = {}) {
  TYPES[key] = { name, kind: "emu", ...extra };
  MODELS[key] = M(draw, len);
}
// An end car: key leads its unit (cab on the left), key + "R" closes it.
function addCab(key, name, draw, len, extra = {}) {
  add(key, name, draw, len, extra);
  add(`${key}R`, name, (c) => facingRight(c, draw), len, extra);
}
const addPair = addCab;

addCab("sbB484", "S-Bahn Berlin 483/484 end car", (c) => car484(c, { cab: true }), m(18.4));
addPair("sbB484M", "S-Bahn Berlin 484 middle car", (c) => car484(c, {}), m(18.4));
addCab("sbB481", "S-Bahn Berlin 481 (cab car)", (c) => car481(c, { cab: true }), m(18.4));
addPair("sbB482", "S-Bahn Berlin 482 (car without a cab)", (c) => car481(c, {}), m(18.4));
addCab("sbB480", "S-Bahn Berlin 480", car480, m(18.4));

addCab("sbH490", "S-Bahn Hamburg 490 end car", (c) => car490(c, { cab: true }), m(23.0));
add("sbH490M", "S-Bahn Hamburg 490 middle car", (c) => car490(c, {}), m(20.0));
add("sbH490P", "S-Bahn Hamburg 490 middle car (dual-system, pantograph)", (c) => car490(c, { pan: "up" }), m(20.0));
addCab("sbH474", "S-Bahn Hamburg 474 end car", (c) => car474(c, { cab: true }), m(23.4));
add("sbH474M", "S-Bahn Hamburg 474 middle car", (c) => car474(c, {}), m(18.76));
add("sbH474P", "S-Bahn Hamburg 474.3 middle car (dual-system, pantograph)", (c) => car474(c, { pan: "up" }), m(18.76));

// DB's S-Bahn family: the four cars E (cab), M (pantograph), M, E.
for (const [ser, endLen, midLen] of [["423", 18.81, 14.894], ["430", 19.26, 14.894], ["422", 19.25, 15.46]]) {
  for (const [net, nm, first] of [["m", "S-Bahn München", false], ["s", "S-Bahn Stuttgart", true], ["f", "S-Bahn Rhein-Main", true], ["k", "S-Bahn Köln", true], ["k2", "S-Bahn Köln", false], ["v", "S-Bahn Rhein-Ruhr, VRR paint", true]]) {
    const k = `sb${ser}${net}`, n2 = net.replace("2", "");
    addCab(k, `${ser} end car (${nm})`, (c) => et42(c, { series: ser, pos: "cab", net: n2, first }), m(endLen));
    add(`${k}P`, `${ser} middle car (${nm}), pantograph`, (c) => et42(c, { series: ser, pos: "mid", net: n2, pan: true }), m(midLen));
    add(`${k}M`, `${ser} middle car (${nm})`, (c) => et42(c, { series: ser, pos: "mid", net: n2 }), m(midLen));
  }
}

// 424 / 425: E (cab), M (pantograph), M, E.
for (const [k, nm, o] of [["sb425f", "425 (S-Bahn Rhein-Main)", { net: "f", first: true }], ["sb425rn", "425 (S-Bahn RheinNeckar)", { net: "rn", first: true }],
  ["sb425md", "425 (S-Bahn Mittelelbe, Magdeburg)", { net: "md", first: true, bigS: true }], ["sb424m", "424 (S-Bahn München)", { net: "m" }],
  ["sb424k", "424 (S-Bahn Köln, rebuilt)", { net: "k", liv: "koeln" }], ["sb425h", "425 (S-Bahn Hannover, Transdev)", { liv: "sbh", first: true }]]) {
  addCab(k, `${nm} end car`, (c) => et425(c, { ...o, pos: "cab" }), m(18.245));
  add(`${k}P`, `${nm} middle car, pantograph`, (c) => et425(c, { ...o, pos: "mid", pan: true }), m(15.505));
  add(`${k}M`, `${nm} middle car`, (c) => et425(c, { ...o, pos: "mid" }), m(15.505));
}
// 420: E, M (pantograph), E - each car 22.4/22.6 m.
addCab("sb420m", "420 end car (S-Bahn München)", (c) => et420(c, { cab: true }), m(22.4));
add("sb420mP", "420 middle car (S-Bahn München), pantograph", (c) => et420(c, { pan: true }), m(22.6));

// The low-floor units: E, (M...), E; the pantograph on a middle car (on
// the Coradia and FLIRT over the joint's neighbour, simplified here).
for (const [k, kind, liv, net, endLen, midLen, nm] of [
  ["sbT2n", "talent2", "t2Red", "nue", 20.05, 16.1, "Talent 2 (442), S-Bahn Nürnberg"], ["sbT2r", "talent2", "t2Red", "ros", 20.05, 16.1, "Talent 2 (442), S-Bahn Rostock"],
  ["sbT2md", "talent2", "t2Md", "md", 20.05, 16.1, "Talent 2 (442), S-Bahn Mitteldeutschland"], ["sbT2md2", "talent2", "t2Md2", "md", 20.05, 16.1, "Talent 2 (442), S-Bahn Mitteldeutschland (network II)"],
  ["sbCcn", "coradia", "dbRed", "nue", 20.25, 16.4, "Coradia Continental (1440), S-Bahn Nürnberg"], ["sbCcr", "coradia", "dbRed", "rr", 20.25, 16.4, "Coradia Continental (1440), S-Bahn Rhein-Ruhr"],
  ["sbCcb", "coradia", "dbRed", "br", 20.25, 16.4, "Coradia Continental (1440), Breisgau-S-Bahn"],
  ["sbCcw", "coradiaOld", "nwb", "", 19.05, 16.4, "Coradia Continental (440), NordWestBahn"],
  ["sbFv", "flirt", "vrr", "rr", 24.15, 19.3, "FLIRT 3 XL, S-Bahn Rhein-Ruhr (VRR)"], ["sbFh", "flirt", "sbh", "", 24.15, 19.3, "FLIRT 3 XL, S-Bahn Hannover"],
  ["sbFw", "flirt", "nwb", "", 24.15, 19.3, "FLIRT 3 XL, NordWestBahn"],
  ["sbMr", "mireo", "rn", "rn", 24.32, 21.22, "Mireo (463), S-Bahn Rhein-Neckar"],
  ["sbCcbw", "coradia", "bwegt", "", 20.25, 16.4, "Coradia Continental (1440, bwegt), Breisgau-S-Bahn"],
  ["sbT3", "talent2", "bwegt", "", 20.05, 16.1, "Talent 3 (SWEG, bwegt), Breisgau-S-Bahn"],
  ["sbMpb", "mireoB", "bwegt", "", 23.3, 21.22, "Mireo Plus B (SWEG, bwegt)"]]) {
  addCab(k, `${nm} end car`, (c) => lowfloor(c, kind, liv, { pos: "cab", net, pan: kind === "mireoB" }), m(endLen));
  add(`${k}P`, `${nm} middle car, pantograph`, (c) => lowfloor(c, kind, liv, { pos: "mid", net, pan: true }), m(midLen));
  add(`${k}M`, `${nm} middle car`, (c) => lowfloor(c, kind, liv, { pos: "mid", net }), m(midLen));
}

// ===================== Typical trains =====================
// No formations are published, so each train is drawn as what usually runs
// on its network and line in late 2026 (German Wikipedia's network and
// series articles, read October 2026: "S-Bahn Berlin", "DB-Baureihe
// 483/484", "S-Bahn Hamburg", "DB-Baureihe 490", "S-Bahn München", "S-Bahn
// Stuttgart", "DB-Baureihe 423", "S-Bahn Rhein-Ruhr", "S-Bahn Köln", "S-Bahn
// Hannover", "S-Bahn Nürnberg", "S-Bahn Mitteldeutschland", "S-Bahn
// Dresden", "S-Bahn Rhein-Neckar", "S-Bahn Rostock", "S-Bahn Magdeburg",
// "Regio-S-Bahn Bremen/Niedersachsen", "Breisgau-S-Bahn", "Ortenau-S-Bahn",
// "Regio-S-Bahn Donau-Iller"). Line names repeat from network to network
// (there are S 1s in a dozen cities), so the network is told by the
// train's end stations.
const rep = (units, k) => Array.from({ length: k }, () => units).flat();
const plainName = (v) => String(v || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss").toLowerCase();
const NET_WORDS = {
  ber: ["berlin", "potsdam", "flughafen ber", "erkner", "strausberg", "konigs wusterhausen", "oranienburg", "bernau", "blankenfelde", "teltow", "hennigsdorf",
    "spandau", "ahrensfelde", "wartenberg", "spindlersfeld", "birkenwerder", "wannsee", "frohnau", "zehlendorf", "potsdamer platz", "nordbahnhof", "gesundbrunnen",
    "sudkreuz", "westend", "beusselstr", "treptower park", "hermannstr", "grunau", "schoneweide", "westkreuz", "mahlsdorf", "hoppegarten", "ostbahnhof", "warschauer",
    "lichtenberg", "pankow", "s buch", "lichtenrade", "charlottenburg", "friedrichshagen", "karlshorst", "olympiastadion", "tempelhof", "schonholz", "hohen neuendorf",
    "mahlow", "priesterweg", "wildau", "s blankenburg", "schonhauser", "frankfurter allee", "landsberger allee", "waidmannslust", "altglienicke", "wedding", "grunewald",
    "tiergarten", "friedrichstr", "pichelsberg", "botanischer garten", "marienfelde", "lichterfelde", "anhalter bahnhof", "wollankstr", "ostkreuz", "baumschulenweg"],
  ham: ["hamburg", "wedel", "pinneberg", "aumuhle", "stade", "buxtehude", "poppenbuttel", "bergedorf", "neugraben", "elbgaustr", "blankenese", "neu wulmstorf"],
  han: ["hannover", "hildesheim", "celle", "nienburg", "minden", "haste", "weetzen", "paderborn", "hameln", "bennemuhlen", "seelze", "barsinghausen", "springe",
    "lehrte", "wennigsen", "bad pyrmont", "wunstorf", "bissendorf", "mellendorf", "stadthagen", "rubenberge"],
  muc: ["munchen", "freising", "markt schwaben", "petershausen", "dachau", "altomunster", "erding", "holzkirchen", "mammendorf", "deisenhofen", "maisach",
    "geltendorf", "buchenau", "zorneding", "aying", "kreuzstrasse", "hohenkirchen", "germering", "ebersberg", "grafing", "tutzing", "gauting", "wolfratshausen",
    "hollriegelskreuth", "herrsching", "wessling", "harthaus", "erdweg"],
  nue: ["nurnberg", "erlangen", "hersbruck", "furth", "bamberg", "lauf(", "lauf (", "hartmannshof", "forchheim", "roth", "altdorf", "neumarkt", "ansbach", "allersberg", "neustadt(aisch", "neustadt (aisch"],
  str: ["stuttgart", "herrenberg", "plochingen", "kirchheim(teck", "kirchheim (teck", "filderstadt", "schorndorf", "backnang", "marbach", "bietigheim", "ludwigsburg",
    "weil der stadt", "leonberg", "boblingen", "renningen", "kornwestheim", "grunbach", "waiblingen", "ditzingen", "korntal", "wendlingen"],
  ffm: ["frankfurt", "wiesbaden", "rodermark", "offenbach", "dietzenbach", "niedernhausen", "hofheim", "bad soden", "kronberg", "friedrichsdorf", "bad homburg",
    "friedberg(hess", "friedberg (hess", "langen(hess", "langen (hess", "darmstadt", "bad vilbel", "gross karben", "riedstadt", "hanau", "kelsterbach"],
  rn: ["mannheim", "ludwigshafen", "heidelberg", "kaiserslautern", "homburg(saar", "homburg (saar", "osterburken", "mosbach", "germersheim", "karlsruhe", "bruchsal",
    "bensheim", "mainz", "bodenheim", "waghausel", "sinsheim", "eppingen", "aglasterhausen", "meckesheim", "neckargemund", "biblis", "schwetzingen", "hockenheim",
    "neu-edingen", "gross-rohrheim", "worms", "graben-neudorf", "neustadt(weinstr", "neustadt (weinstr", "schifferstadt", "bad rappenau", "ladenburg", "philippsburg",
    "hochspeyer", "waibstadt"],
  nrw: ["dortmund", "duisburg", "solingen", "dusseldorf", "essen", "bochum", "mulheim", "koln", "bergisch gladbach", "neuss", "dormagen", "norf", "hennef", "horrem",
    "au(sieg", "au (sieg", "blankenberg(sieg", "blankenberg (sieg", "porz", "duren", "troisdorf", "sindorf", "recklinghausen", "castrop", "herne", "gelsenkirchen",
    "hattingen", "oberhausen", "unna", "hagen", "witten", "monchengladbach", "wuppertal", "haltern", "bottrop", "velbert", "bonn", "euskirchen", "munstereifel",
    "rheinbach", "kettwig", "kaarst", "mettmann", "gerresheim", "remscheid", "aachen", "welkenraedt"],
  md: ["leipzig", "halle", "dessau", "bitterfeld", "delitzsch", "wittenberg hbf", "lutherstadt", "geithain", "borna", "markkleeberg", "eilenburg", "wurzen", "torgau",
    "falkenberg", "taucha", "oschatz", "gossnitz", "altenburg", "zwickau", "weissenfels", "naumburg", "grosskorbetha", "markranstadt", "schkeuditz", "querfurt",
    "braunsbedra", "merseburg", "mucheln", "kyhna"],
  dd: ["dresden", "meissen", "bad schandau", "schona", "pirna", "kurort rathen", "heidenau", "tharandt", "freiberg(sachs", "freiberg (sachs", "kamenz"],
  mdb: ["magdeburg", "wittenberge", "schonebeck", "stendal", "zielitz"],
  ros: ["rostock", "warnemunde", "gustrow"],
  bre: ["bremen", "bremerhaven", "verden", "twistringen", "oldenburg", "hude", "wilhelmshaven", "bad zwischenahn", "nordenham", "brake", "rotenburg", "delmenhorst",
    "osterholz", "bookholzberg", "stubben"],
  fr: ["freiburg", "breisach", "seebrugg", "titisee", "kirchzarten", "gottenheim", "neustadt(schwarzw", "neustadt (schwarzw", "villingen", "donaueschingen", "endingen",
    "elzach", "bleibach", "denzlingen", "waldkirch", "bad krozingen", "munstertal", "staufen", "riegel", "sasbach", "himmelreich"],
  ort: ["offenburg", "schiltach", "freudenstadt", "hausach", "hornberg", "oberharmersbach", "unterharmersbach", "zell(harmersbach", "biberach(baden", "biberach (baden",
    "bad griesbach", "oberkirch", "achern", "ottenhofen", "kehl", "strasbourg", "gengenbach"],
  ulm: ["ulm", "blaubeuren", "munderkingen", "herrlingen", "ehingen", "sigmaringen", "aalen", "oberkochen", "heidenheim", "giengen", "langenau", "niederstotzingen",
    "unterelchingen", "memmingen", "weissenhorn", "illertissen", "senden", "biberach(riss", "biberach (riss", "aulendorf"],
  bgl: ["berchtesgaden", "freilassing", "bad reichenhall", "bischofswiesen"],
  stk: ["radolfzell", "stockach"],
  aus: ["ehrwald", "pfronten", "reutte"],
};
// The network a train's end stations name, the most specific first (a
// Bonn train is NRW's, a Karlsruhe one Rhein-Neckar's).
const NET_ORDER = ["ber", "ham", "han", "muc", "nue", "str", "ffm", "dd", "mdb", "md", "ros", "bre", "fr", "ort", "bgl", "stk", "aus", "ulm", "nrw", "rn"];
function networkOf(t) {
  const ends = [t.origin, t.destination].map(plainName);
  for (const net of NET_ORDER) if (NET_WORDS[net].some((w) => ends.some((e) => e.includes(w)))) return net;
  return null;
}
// Where two series share a line and no feed says which runs a train, the
// train number picks, in proportion to each series' share of the line
// (October 2026): a stable choice, so a train keeps its drawing.
const share = (t) => { const d = Number(String(t.number || "").replace(/\D/g, "").slice(-9)) || 0; return ((Math.imul(d ^ (d >>> 7), 2654435761) >>> 0) >>> 8) % 100; };
const has = (t, ...names) => names.some((x) => [t.origin, t.destination].some((e) => plainName(e).includes(plainName(x))));
// Units, cab first, closing cab last.
const u42 = (k, mids = ["P", "M"]) => [[k, 1], ...mids.map((x) => [`${k}${x}`, 1]), [`${k}R`, 1]];
const u3 = (k) => [[k, 1], [`${k}P`, 1], [`${k}R`, 1]];
const u4 = (k) => [[k, 1], [`${k}P`, 1], [`${k}M`, 1], [`${k}R`, 1]];
const u5 = (k) => [[k, 1], [`${k}M`, 1], [`${k}P`, 1], [`${k}M`, 1], [`${k}R`, 1]];
const U_B481 = [["sbB481", 1], ["sbB482", 1], ["sbB482R", 1], ["sbB481R", 1]];
const U_B484 = [["sbB484", 1], ["sbB484M", 1], ["sbB484MR", 1], ["sbB484R", 1]];
const U_B483 = [["sbB484", 1], ["sbB484R", 1]];
const U_B480 = [["sbB480", 1], ["sbB480R", 1]];
const U_H474 = [["sbH474", 1], ["sbH474M", 1], ["sbH474R", 1]], U_H474P = [["sbH474", 1], ["sbH474P", 1], ["sbH474R", 1]];
const U_H490 = [["sbH490", 1], ["sbH490M", 1], ["sbH490R", 1]], U_H490P = [["sbH490", 1], ["sbH490P", 1], ["sbH490R", 1]];
const S = (label, units) => ({ label, units });
function setFor(t) {
  const net = networkOf(t);
  const line = String(t.route || "").replace(/\s+/g, "").toUpperCase();
  const h = share(t);
  switch (net) {
    case "ber":
      // The 483/484 hold the Ring (S 41, S 42: two 484s always) and its
      // feeders S 46, S 47 and S 8; the 480s the S 3 with 481s; the 481
      // everything else.
      if (line === "S41" || line === "S42") return S("S-Bahn Berlin 484: two four-car units (eight cars)", rep(U_B484, 2));
      if (line === "S46") return S("S-Bahn Berlin 484: two four-car units (eight cars)", rep(U_B484, 2));
      if (line === "S47" || line === "S8") return S("S-Bahn Berlin 483/484: a four-car 484 and a two-car 483 (six cars)", [...U_B484, ...U_B483]);
      if (line === "S3" && h < 55) return S("S-Bahn Berlin 480: four two-car quarter-trains (eight cars; the S 3 shares them with 481s)", rep(U_B480, 4));
      if (line === "S25" || line === "S85" || line === "S26") return S("S-Bahn Berlin 481/482: three quarter-trains (six cars)", [...U_B481, ["sbB481", 1], ["sbB482R", 1]]);
      if (line === "S15") return S("S-Bahn Berlin 481/482: two quarter-trains (four cars)", U_B481);
      return S("S-Bahn Berlin 481/482: four quarter-trains (eight cars)", rep(U_B481, 2));
    case "ham":
      if (line === "S3") return S("S-Bahn Hamburg 490: three three-car units (nine cars; two off-peak)", rep(U_H490, 3));
      if (line === "S5") return h < 15 ? S("S-Bahn Hamburg 490 dual-system units: two coupled", rep(U_H490P, 2))
        : S("S-Bahn Hamburg 474.3 dual-system units: two coupled (pantographs up beyond Neugraben)", rep(U_H474P, 2));
      if (line === "S2" && h < 35) return S("S-Bahn Hamburg 490: two three-car units", rep(U_H490, 2));
      return S("S-Bahn Hamburg 474: two three-car units", rep(U_H474, 2));
    case "muc":
      if (line === "S20" || (line === "S2" && has(t, "Altomünster") && has(t, "Dachau"))) return S("420: one three-car unit (Munich's rebuilt 420s on the S 20 and the Altomünster extras)", [["sb420m", 1], ["sb420mP", 1], ["sb420mR", 1]]);
      if (line === "S7") return S("424: two four-car units (the 424s from Hannover, on the S 7 since December 2025)", rep(u42("sb424m"), 2));
      return S("423: two four-car units (one late evenings and Sundays, three at the peaks)", rep(u42("sb423m"), 2));
    case "nue":
      if (["S3", "S4", "S5"].includes(line)) return S("Coradia Continental (1440): one four-car unit, two at the peaks", u4("sbCcn"));
      return S("Talent 2 (442): one four-car unit, two at the peaks", u4("sbT2n"));
    case "str":
      if (line === "S62") return S("430: one four-car unit", u42("sb430s"));
      if (["S1", "S3", "S6", "S60"].includes(line) && h < (line === "S6" || line === "S60" ? 70 : 45)) return S("423: two four-car units (three at the peaks)", rep(u42("sb423s"), 2));
      return S("430: two four-car units (three at the peaks)", rep(u42("sb430s"), 2));
    case "ffm":
      if (["S1", "S4", "S8", "S9"].includes(line)) return S("430: two four-car units", rep(u42("sb430f"), 2));
      if (line === "S7") return S("425: one four-car unit, two at the peaks", u42("sb425f"));
      return S("423: two four-car units", rep(u42("sb423f"), 2));
    case "nrw": {
      if (line === "S1") return S("422 in VRR's paint: two four-car units", rep(u42("sb422v"), 2));
      if (line === "S4") return S("422 in VRR's paint: one four-car unit", u42("sb422v"));
      if (line === "S6") return S("422: two four-car units", rep(u42("sb422k2"), 2));
      if (line === "S68") return S("423: one four-car unit", u42("sb423k2"));
      if (line === "S2") return S("FLIRT 3 XL (VRR): one three-car unit", u3("sbFv"));
      if (line === "S3" || line === "S9") return S("FLIRT 3 XL (VRR): one five-car unit", u5("sbFv"));
      if (line === "S5") return S("Coradia Continental (1440): one three-car unit", u3("sbCcr"));
      if (line === "S8") return S("Coradia Continental (1440): two three-car units", rep(u3("sbCcr"), 2));
      if (line === "S11") return S("423 (with first class): two four-car units", rep(u42("sb423k"), 2));
      if (line === "S12" || line === "S19") return h < 50 ? S("424 (rebuilt, S-Bahn Köln's paint): two four-car units", rep(u42("sb424k"), 2))
        : S("423: two four-car units", rep(u42("sb423k2"), 2));
      if (line === "S23") return TYPES.sbL54 ? S("Coradia LINT 54 (622): one two-car unit (the S 23 also runs LINT 81s)", [["sbL54", 1], ["sbL54R", 1]]) : null;
      // S 7 (RheinRuhrBahn's LINT 41s) and S 28 (Regiobahn's Integrals):
      // no 2024-2026 side photograph to draw them from yet.
      return null;
    }
    case "han":
      if (line === "S3" && h < 50) return S("425 (Transdev's S-Bahn Hannover paint): one four-car unit", u42("sb425h"));
      return S("FLIRT 3 XL (Transdev S-Bahn Hannover): one three-car unit, two on the busier runs", u3("sbFh"));
    case "md":
      if (line === "S11") return TYPES.sb642 ? S("Desiro Classic (642): one two-section unit", [["sb642", 1], ["sb642R", 1]]) : null;
      // Network II (Halle: S 2 to Dessau/Wittenberg, S 8, S 9): the red-door
      // Talent 2s; network I (Leipzig's S 1-S 6) the green-door ones.
      if (["S8", "S9"].includes(line) || (line === "S2" && has(t, "Dessau", "Wittenberg", "Bitterfeld", "Delitzsch"))) return S("Talent 2 (442, network II, red doors): one three-car unit", u3("sbT2md2"));
      return S("Talent 2 (442): one four-car unit", u4("sbT2md"));
    case "dd":
      if (line === "S8") return TYPES.sb642 ? S("Desiro Classic (642): one two-section unit", [["sb642", 1], ["sb642R", 1]]) : null;
      return TYPES.sbDD146 ? S("DB 146 with four double-deck coaches and a cab car (S-Bahn Dresden)", [["sbDD146", 1], ["sbDD", 4], ["sbDDcabR", 1]]) : null;
    case "mdb": return S("425 (S-Bahn Mittelelbe): one four-car unit", u42("sb425md"));
    case "ros": return S("Talent 2 (442): one three-car unit", u3("sbT2r"));
    case "rn":
      if (["S1", "S2", "S3", "S4", "S33", "S39", "S44", "S51"].includes(line)) return S("425 (S-Bahn RheinNeckar): one four-car unit, two on the S 1 to S 3 at the peaks", u42("sb425rn"));
      return S("Mireo (463): one three-car unit, two on the S 5 and S 6 at the peaks", u3("sbMr"));
    case "bre":
      if (line === "RS3" || line === "RS30") return S("FLIRT 3 XL (NordWestBahn): one four-car unit", u4("sbFw"));
      if (line === "RS1" || line === "RS2") return S("Coradia Continental (440, NordWestBahn): one five-car unit", u5("sbCcw"));
      return S("Coradia Continental (440, NordWestBahn): one three-car unit", u3("sbCcw"));
    case "fr":
      if (["S2", "S3", "S5"].includes(line)) return S("Talent 3 (SWEG, bwegt): one three-car unit", u3("sbT3"));
      return S("Coradia Continental (1440, bwegt): one three-car unit, two on the S 1", u3("sbCcbw"));
    case "ort":
      if (line === "RS4") return null; // Regio-Shuttles and SNCF's Régiolis: not drawn here
      return S("Mireo Plus B (SWEG, bwegt): one two-car battery unit", [["sbMpb", 1], ["sbMpbR", 1]]);
    case "ulm":
      return null; // SWEG's Ulm lines: no recent photograph of their units
    // Berchtesgaden (BRB's FLIRTs), Radolfzell-Stockach (Regio-Shuttle) and
    // the Außerfernbahn: no 2024-2026 photograph to draw them from.
    case "bgl": case "stk": case "aus": return null;
    default: return null;
  }
}
// A car's set (a fleet sample, or a train whose cars were reported).
const BY_KEY = {};
export const TYPICAL = {
  sbahn: (t, reported) => {
    const set = setFor(t);
    if (set) return { ...set };
    const own = reported ? BY_KEY[reported] || BY_KEY[reported.replace(/R$/, "")] : null;
    return own ? { ...own } : null;
  },
};

// ===================== DB Regio's drawings, borrowed =====================
// S-Bahn Dresden's 146 and double-deck push-pull sets, the 642 Desiros
// (Dresden's S 8, Halle's S 11) and the LINT 54 (Bonn's S 23, which runs
// LINT 54s and 81s) are drawn in js/railroads/dbregio.cars.js; borrowed
// here if it loads (guarded: without it these trains go undrawn).
let DR = null;
try { DR = await import("./dbregio.cars.js?v=dev"); } catch (e) { DR = null; }
function borrow(key, from, name, extra = {}) {
  const mod = DR?.MODELS?.[from];
  if (!mod) return;
  TYPES[key] = { ...(DR.TYPES[from] || {}), name, ...extra };
  MODELS[key] = { draw: mod.draw, len: mod.len, oneEnd: false, variant: (c) => `${c.index}/${c.count}` };
}
borrow("sbDD146", "deR146", "DB 146 locomotive (S-Bahn Dresden)", { kind: "electric" });
borrow("sbDD", "deRDd", "Double-deck coach (S-Bahn Dresden)", { kind: "bilevel" });
borrow("sbDD1", "deRDd1", "Double-deck coach, first and second class (S-Bahn Dresden)", { kind: "bilevel" });
borrow("sbDDcabR", "deRDdCab4R", "Double-deck driving trailer (S-Bahn Dresden)", { kind: "bilevel", cab: true });
borrow("sb642", "deR642", "Desiro Classic (642) section");
borrow("sb642R", "deR642R", "Desiro Classic (642) section");
borrow("sbL54", "deR622", "LINT 54 (622) car");
borrow("sbL54R", "deR622R", "LINT 54 (622) car");

// ===================== Sample sets =====================
// One train of each kind (the fleet pages draw a car's whole set; the
// sets also fill BY_KEY above).
const SAMPLE_TRIPS = [
  ["S 41", "Berlin Südkreuz", "Berlin Westend"], ["S 8", "Birkenwerder", "Berlin-Grünau"], ["S 3", "Erkner", "Berlin-Spandau", 2], ["S 1", "Oranienburg", "Berlin-Wannsee"],
  ["S 3", "Pinneberg", "Hamburg-Neugraben"], ["S 1", "Wedel(Holst)", "Hamburg-Poppenbüttel"], ["S 5", "Stade", "Hamburg Elbgaustraße", 50],
  ["S 8", "Herrsching", "München Flughafen Terminal"], ["S 20", "Höllriegelskreuth", "München-Pasing"], ["S 7", "Wolfratshausen", "München Hbf"],
  ["S 2", "Filderstadt", "Schorndorf"], ["S 1", "Herrenberg", "Plochingen", 1], ["S 8", "Wiesbaden Hbf", "Offenbach(Main)Ost"], ["S 3", "Bad Soden(Taunus)", "Frankfurt(Main)Süd"],
  ["S 7", "Frankfurt(Main)Hbf", "Riedstadt-Goddelau"], ["S 1", "Dortmund Hbf", "Düsseldorf Hbf"], ["S 6", "Essen Hbf", "Köln-Nippes"], ["S 9", "Haltern am See", "Wuppertal Hbf"],
  ["S 2", "Dortmund Hbf", "Essen Hbf"], ["S 8", "Mönchengladbach Hbf", "Hagen Hbf"], ["S 11", "Bergisch Gladbach", "Düsseldorf Flughafen Terminal"],
  ["S 12", "Au(Sieg)", "Horrem", 1], ["S 23", "Bonn Hbf", "Euskirchen"], ["S 5", "Hannover Flughafen", "Paderborn Hbf"], ["S 3", "Hannover Hbf", "Hildesheim Hbf", 1],
  ["S 1", "Bamberg", "Hartmannshof"], ["S 4", "Ansbach", "Nürnberg Hbf"], ["S 1", "Leipzig Miltitzer Allee", "Leipzig-Stötteritz"], ["S 8", "Halle(Saale)Hbf", "Bitterfeld"],
  ["S 11", "Halle(Saale)Hbf", "Querfurt"], ["S 1", "Meißen Triebischtal", "Bad Schandau"], ["S 1", "Wittenberge", "Schönebeck-Bad Salzelmen"], ["S 1", "Rostock Hbf", "Warnemünde"],
  ["S 1", "Homburg(Saar)Hbf", "Osterburken"], ["S 6", "Mainz Hbf", "Mannheim Hbf"], ["RS 1", "Bremen-Farge", "Verden(Aller)"], ["RS 3", "Bremen Hbf", "Oldenburg(Oldb)Hbf"],
  ["RS 6", "Rotenburg(Wümme)", "Verden(Aller)"], ["S 1", "Breisach", "Freiburg, Hauptbahnhof"], ["S 2", "Elzach", "Freiburg, Hauptbahnhof"], ["RS 1", "Offenburg", "Freudenstadt Hbf"],
];
export const SAMPLE_SETS = [];
for (const [route, origin, destination, number = 0] of SAMPLE_TRIPS) {
  const set = setFor({ route, origin, destination, number: String(number) });
  if (!set || SAMPLE_SETS.some((x) => x.label === set.label && JSON.stringify(x.units) === JSON.stringify(set.units))) continue;
  SAMPLE_SETS.push(set);
  for (const [k] of set.units) { const b = k.replace(/R$/, ""); BY_KEY[k] ??= set; BY_KEY[b] ??= set; }
}

// ===================== Car numbers =====================
// The units' numbers where a series runs on one network only (a fleet
// sample draws its whole set). The timetable carries no car numbers.
export const FLEETS = {
  sbahn: [
    [480001, 480599, "sbB480"], [481001, 481999, "sbB481"], [483001, 483099, "sbB484"], [484001, 484999, "sbB484"],
    [474001, 474999, "sbH474"], [490001, 490999, "sbH490"], [463001, 463999, "sbMr"], [563001, 563999, "sbMpb"],
    [3427001, 3427999, "sbFh"], [3429001, 3429999, "sbFv"],
  ],
};

// ===================== Fact sheets =====================
const DEWP = (p) => `https://de.wikipedia.org/wiki/${p}`;
const kmh = (v) => Math.round(v / 1.609);
const F = {
  sbB484: { model: "DB class 483/484", type: "Electric multiple unit (750 V third rail)", builder: "Stadler Pankow and Siemens Mobility", built: "2020–2023",
    fleet: "21 two-car 483s and 85 four-car 484s", topSpeedMph: kmh(100), lengthFt: m(73.6), source: DEWP("DB-Baureihe_483/484"),
    about: "The Berlin S-Bahn's newest trains, air-conditioned and open end to end: the Ring (S 41, S 42, always two 484s) and the S 46, S 47 and S 8. The revised red and mustard paint with black doors." },
  sbB481: { model: "DB class 481/482", type: "Electric multiple unit (750 V third rail)", builder: "AEG, Adtranz and Bombardier (Hennigsdorf), DWA/Bombardier (Halle)", built: "1996–2004, rebuilt 2019–2026",
    fleet: "500 quarter-trains (two cars: a 481 with the cab, a 482 with a covered shunting desk)", topSpeedMph: kmh(100), lengthFt: m(36.8), source: DEWP("DB-Baureihe_481"),
    about: "The backbone of the Berlin S-Bahn: every line but the Ring group. All 500 quarter-trains rebuilt by mid 2026 in the red and mustard paint of the 483/484, the doors black." },
  sbB480: { model: "DB class 480", type: "Electric multiple unit (750 V third rail)", builder: "AEG, Siemens, Waggon Union", built: "1986–1994",
    fleet: "85 two-car quarter-trains, a cab at each end", topSpeedMph: kmh(100), lengthFt: m(36.8), source: DEWP("BVG-Baureihe_480"),
    about: "Ordered by West Berlin's BVG; since December 2022 only on the S 3, with 481s. The last Berlin series in the older red and ochre with the black line under the windows." },
  sbH490: { model: "DB class 490", type: "Electric multiple unit (1200 V third rail; dual-system units also 15 kV)", builder: "Bombardier Transportation (now Alstom), Hennigsdorf", built: "2013–2020, 2025–2026",
    fleet: "82 delivered (31 dual-system), 64 more dual-system units 2025–2026", topSpeedMph: kmh(100), lengthFt: m(66.0), source: DEWP("DB-Baureihe_490"),
    about: "Hamburg's newest S-Bahn units, three cars open end to end: nearly every S 3, some S 2 and S 5. The dual-system units carry a pantograph for the wires to Stade (and from 2027 Bad Oldesloe and Kaltenkirchen)." },
  sbH474: { model: "DB class 474", type: "Electric multiple unit (1200 V third rail; 474.3 also 15 kV)", builder: "Adtranz and LHB (now Alstom)", built: "1996–2001, 2006",
    fleet: "70 third-rail and 42 dual-system (474.3) three-car units", topSpeedMph: kmh(100), lengthFt: m(65.56), source: DEWP("DB-Baureihe_474"),
    about: "Hamburg's S 1, S 2, S 7 and, the dual-system 474.3, the S 5 to Stade; rebuilt as the \"474plus\" with open gangways." },
  sb423: { model: "DB class 423", type: "Electric multiple unit", builder: "Bombardier, Alstom (LHB) and Siemens", built: "1998–2007", fleet: "462 four-car units",
    topSpeedMph: kmh(140), lengthFt: m(67.4), source: DEWP("DB-Baureihe_423"),
    about: "DB's standard S-Bahn unit: München (all lines), Rhein-Main (S 2, S 3, S 5, S 6), Stuttgart (S 1, S 3, S 6, S 60) and Köln (S 11, S 12, S 19). Three doors a side a car, the floor 1.0 m up; run as one, two or three units." },
  sb430: { model: "DB class 430", type: "Electric multiple unit", builder: "Bombardier (now Alstom) and Alstom", built: "2012–2024", fleet: "253 four-car units (155 at Stuttgart incl. the 58 of 2023–2024, 91 at Rhein-Main)",
    topSpeedMph: kmh(140), lengthFt: m(68.3), source: DEWP("DB-Baureihe_430"),
    about: "The 423's successor with a longer crash-standard nose: Stuttgart's S 1-S 6 and S 62, Rhein-Main's S 1, S 4, S 8 and S 9. Stuttgart's units are being repainted light grey with black doors from 2025; most still carry the red." },
  sb422: { model: "DB class 422", type: "Electric multiple unit", builder: "Bombardier, Alstom", built: "2008–2010", fleet: "84 four-car units", topSpeedMph: kmh(140), lengthFt: m(69.43),
    source: DEWP("DB-Baureihe_422"), about: "The S-Bahn Rhein-Ruhr's 423 variant: the S 1 and S 4 in the VRR's neutral grey and green (48 units the VRR owns), the S 6 and S 68 in DB red." },
  sb425: { model: "DB class 424/425", type: "Electric multiple unit", builder: "Bombardier, Siemens", built: "1998–2008", fleet: "40 class 424 and 248 class 425",
    topSpeedMph: kmh(160), lengthFt: m(67.5), source: DEWP("DB-Baureihe_425_(1999)"),
    about: "The 423's low-floor sister (0.8 m floor, two doors a side, toilets): S-Bahn RheinNeckar's S 1-S 4, Magdeburg's S 1, Rhein-Main's S 7, Hannover's S 3 (Transdev), and the ex-Hannover 424s in München (S 7) and Köln (S 12, S 19, rebuilt in Köln's own paint)." },
  sb420m: { model: "DB class 420", type: "Electric multiple unit", builder: "MAN, Siemens, AEG, BBC, LHB, Orenstein & Koppel, Uerdingen", built: "1969–1997, rebuilt 2014–2020",
    fleet: "36 three-car units at München", topSpeedMph: kmh(120), lengthFt: m(67.4), source: DEWP("S-Bahn_München"),
    about: "The classic West German S-Bahn unit, back in Munich since 2014: the S 20, the Dachau–Altomünster extras and odd S 4 and S 5 runs." },
  sbT2: { model: "Bombardier Talent 2 (DB class 442)", type: "Articulated electric multiple unit", builder: "Bombardier Transportation, Hennigsdorf", built: "2008–2016",
    topSpeedMph: kmh(160), source: DEWP("Bombardier_Talent_2"),
    about: "S-Bahn Nürnberg (S 1, S 2, S 6), Rostock (all lines) and Mitteldeutschland (silver with green doors on Leipzig's network I, red doors on Halle's network II)." },
  sbCc: { model: "Alstom Coradia Continental (DB class 1440, NWB 440)", type: "Articulated electric multiple unit", builder: "Alstom, Salzgitter", built: "2008–2021",
    topSpeedMph: kmh(160), source: DEWP("Alstom_Coradia_Continental"),
    about: "S-Bahn Nürnberg (S 3-S 5), Rhein-Ruhr (S 5, S 8), the Breisgau-S-Bahn (bwegt paint) and, with the older head, NordWestBahn's Regio-S-Bahn Bremen/Niedersachsen in Transdev's white, blue and red." },
  sbF: { model: "Stadler FLIRT 3 XL", type: "Articulated electric multiple unit", builder: "Stadler Pankow", built: "2019–2022", topSpeedMph: kmh(160), source: DEWP("Stadler_Flirt"),
    about: "The VRR's units for the S 2, S 3 and S 9 (three or five cars, its neutral grey and green), Transdev's 64 for the S-Bahn Hannover, and NordWestBahn's for the RS 3 and RS 30." },
  sbMr: { model: "Siemens Mireo (DB class 463)", type: "Articulated electric multiple unit", builder: "Siemens Mobility, Krefeld", built: "2019–2021", fleet: "57 three-car units",
    topSpeedMph: kmh(160), lengthFt: m(69.86), source: DEWP("S-Bahn_Rhein-Neckar"), about: "S-Bahn RheinNeckar's second stage (S 5-S 9 and their branches): light grey, the doors yellow in dark grey panels, the big S over the cab cars." },
  sbMpb: { model: "Siemens Mireo Plus B (SWEG class 563)", type: "Battery-electric multiple unit", builder: "Siemens Mobility", built: "2023–2024", fleet: "27 two-car units",
    topSpeedMph: kmh(140), source: DEWP("Ortenau-S-Bahn"), about: "The Regio S-Bahn Ortenau's units (from April 2024), running off the wires on battery to Freudenstadt, Bad Griesbach, Ottenhöfen and Oberharmersbach." },
  sbT3: { model: "Bombardier Talent 3 (SWEG class 8442)", type: "Articulated electric multiple unit", builder: "Bombardier (now Alstom)", built: "2019–2021", topSpeedMph: kmh(160),
    source: DEWP("Breisgau-S-Bahn"), about: "SWEG's units for the Freiburger Y: the S 2 (Elztalbahn), S 3 (Münstertal) and S 5 (Kaiserstuhl), in bwegt's paint." },
};
export const FACTS = {};
const famOf = (k) => k.startsWith("sbB484") ? "sbB484" : k.startsWith("sbB48") ? (k.startsWith("sbB480") ? "sbB480" : "sbB481") : k.startsWith("sbH490") ? "sbH490" : k.startsWith("sbH474") ? "sbH474"
  : k.startsWith("sb423") ? "sb423" : k.startsWith("sb430") ? "sb430" : k.startsWith("sb422") ? "sb422" : /^sb42[45]/.test(k) ? "sb425" : k.startsWith("sb420") ? "sb420m"
  : k.startsWith("sbT2") ? "sbT2" : k.startsWith("sbCc") ? "sbCc" : k.startsWith("sbF") ? "sbF" : k.startsWith("sbMpb") ? "sbMpb" : k.startsWith("sbMr") ? "sbMr" : k.startsWith("sbT3") ? "sbT3" : null;
for (const k of Object.keys(TYPES)) { const f = famOf(k); if (f && F[f]) FACTS[k] = { ...F[f], model: F[f].model, type: F[f].type }; }
// The borrowed drawings keep DB Regio's fact sheets.
for (const [k, from] of [["sbDD146", "deR146"], ["sbDD", "deRDd"], ["sbDD1", "deRDd1"], ["sbDDcabR", "deRDdCab4"], ["sb642", "deR642"], ["sb642R", "deR642"], ["sbL54", "deR622"], ["sbL54R", "deR622"]])
  if (TYPES[k] && DR?.FACTS?.[from]) FACTS[k] = DR.FACTS[from];
