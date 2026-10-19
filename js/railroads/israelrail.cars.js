// Israel Railways' cars (scripts/railroads/israelrail.py): Siemens Desiro
// HC electric units and push-pull trains of Bombardier double-deck coaches
// behind TRAXX electric or diesel locomotives. The SIRI feed's vehicle ref is
// the train number, not a unit, so every train is drawn as what usually runs
// on its line. Trainsheet's own side views, from published dimensions and
// photographs; the emblem is drawn here in simple shapes, not copied.
import { newId, bilevel } from "../carmodels.js?v=dev";
import { C, rect, path, line, lines, poly, win, door, truck, pantograph, slats } from "../carart.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);

// The double-deck coaches' red with a pale band between the decks; the
// TRAXX's silver lined in red; the diesels' silver and navy with red cabs;
// the Desiro HC's white and blue.
const IR = { white: "#f2f3f5", silver: "#cdd1d6", blue: "#24398f", navy: "#1a2a6c", sky: "#3a5fc8", red: "#d42330", deep: "#a51b26", pale: "#e3e1dc",
  roof: "#a9afb6", skirt: "#3a3e44" };

// ---------- Detail shared by the drawings ----------

const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
// Lettering h ft tall centered on (x, y), reading left to right even on a
// car drawn mirrored.
const letters = (c, x, y, h, text, fill, { weight = 700, spacing = 0, style = "" } = {}) =>
  `<text transform="translate(${x} ${y}) scale(${c.mirrored ? -1 : 1} -1)" y="${(h * 0.36).toFixed(2)}" font-size="${h}" text-anchor="middle" font-weight="${weight}"` +
  `${style ? ` font-style="${style}"` : ""} letter-spacing="${spacing}" font-family="${SANS}" fill="${fill}">${text}</text>`;
// A roof air-conditioning unit: a low housing with a grille along its side.
const aircon = (x, roof, w, h = 0.75) =>
  path(poly([[x, roof - 0.05], [x + 0.6, roof + h], [x + w - 0.6, roof + h], [x + w, roof - 0.05]]), "#a3aab2", 0.5) +
  slats(x + 1.0, roof + 0.12, w - 2.0, h - 0.32, 0.45, "rgba(0,0,0,0.3)") + line(x + 0.7, roof + h - 0.1, x + w - 0.7, roof + h - 0.1, "rgba(255,255,255,0.4)", 0.5);
// A diesel's exhaust on the roof, its stack and rain cap.
const exhaust = (x, roof) => rect(x, roof - 0.05, 1.6, 0.4, "#7d848c", 0.4, 'rx="0.1"') + rect(x + 0.45, roof + 0.35, 0.7, 0.4, "currentColor") + rect(x + 0.3, roof + 0.72, 1.0, 0.12, "currentColor");
// Twin horns on the cab roof.
const horns = (x, roof) => rect(x, roof - 0.05, 1.2, 0.3, "#7d848c", 0.3, 'rx="0.1"') + rect(x + 0.1, roof + 0.25, 0.9, 0.22, "currentColor", 0, 'rx="0.1"');
// A radio aerial.
const aerial = (x, roof) => rect(x - 0.3, roof - 0.05, 0.6, 0.15, "currentColor") + line(x, roof + 0.1, x + 0.25, roof + 0.95, "currentColor", 0.6);
// A low roof cover over electrical gear.
const cover = (x, roof, w, h = 0.5) => rect(x, roof - 0.05, w, h, "#a3aab2", 0.4, 'rx="0.15"') + line(x + 0.4, roof + h - 0.15, x + w - 0.4, roof + h - 0.15, "rgba(255,255,255,0.35)", 0.5);
// Under-floor equipment hung between the trucks: [x, w, h, kind], kind "g"
// a grilled radiator or resistor case, "t" a tank, "b" a box with doors.
function gear(top, list) {
  let s = "";
  for (const [x, w, h, k] of list) {
    if (k === "t") s += rect(x, top - h, w, h, "currentColor", 0, `opacity="0.62" rx="${h / 2}"`) + line(x + 0.6, top - h * 0.35, x + w - 0.6, top - h * 0.35, C.steelDark, 0.4);
    else {
      s += rect(x, top - h, w, h, "currentColor", 0, 'opacity="0.8" rx="0.12"');
      if (k === "g") s += slats(x + 0.2, top - h + 0.15, w - 0.4, h - 0.3, 0.35, "rgba(255,255,255,0.22)");
      else if (k === "b") s += lines([[x + w / 2, top - h + 0.15, x + w / 2, top - 0.15]], C.steelDark, 0.45);
      else s += line(x + 0.25, top - 0.28, x + w - 0.25, top - 0.28, C.steelDark, 0.4);
    }
  }
  return s;
}
// Side skirts closing in the underfloor between a and b, depth deep under
// the sill, in the body's lower color; panel joints every few feet.
function fairing(a, b, sill, depth, fill) {
  const segs = [];
  for (let x = a + 6; x < b - 3; x += 6.5) segs.push([x, sill - depth + 0.15, x, sill - 0.1]);
  return path(poly([[a, sill], [b, sill], [b, sill - depth + 0.4], ["q", b, sill - depth, b - 0.4, sill - depth], [a + 0.4, sill - depth], ["q", a, sill - depth, a, sill - depth + 0.4]]), fill, 0.5) +
    lines(segs, "rgba(0,0,0,0.3)", 0.45);
}
// The front of a cab seen from the side: lamp: [x, y] the headlight with
// the tail light under it; coupler: [x, y] an automatic coupler at the face;
// skirt: the fairing under the nose (points); horn: [x, roof] on the cab
// roof; wiper: the windshield wiper [x1, y1, x2, y2].
function front({ lamp, coupler, skirt, horn, wiper } = {}) {
  let s = "";
  if (skirt) s += path(poly(skirt), "#2a2d31", 0.5);
  if (coupler) {
    const [x, y] = coupler;
    s += rect(x, y - 0.32, 2.1, 0.64, "currentColor", 0, 'opacity="0.9"') + rect(x - 0.1, y - 0.6, 0.45, 1.2, "currentColor", 0, 'rx="0.12"') + rect(x + 0.7, y - 1.05, 1.0, 0.45, "currentColor", 0, 'opacity="0.7" rx="0.1"');
  }
  if (lamp) {
    const [x, y] = lamp;
    s += rect(x, y, 0.6, 0.42, "#f6f3dc", 0.4, 'rx="0.14"') + rect(x + 0.05, y - 0.55, 0.5, 0.32, "#d0212e", 0.3, 'rx="0.1"');
  }
  if (horn) s += horns(...horn);
  if (wiper) s += line(...wiper, "#0b0d0f", 0.8);
  return s;
}
// A destination sign: dark, lit amber.
const sign = (x, y, w, h = 0.45) => rect(x, y, w, h, "#121417", 0.3, 'rx="0.08"') + rect(x + 0.15, y + 0.1, w * 0.6, h - 0.2, "#f5a623");
// A car on carmodels.js's bilevel() with the detail every car here shares:
// the eave's rain strip, a step under each high-floor door, roof units
// (spec.ac: [[x, w, h]]), under-floor equipment (spec.gear), roof gear
// (spec.onRoof(c, g)), more detail (spec.more(c, g)), and on a cab car its
// cab (spec.cabArt(c, g)) and front (spec.front).
const unit = (c, spec) => bilevel(c, {
  ...spec,
  extra: (c, g) => {
    const a = c.cabL && spec.cabLen ? g.x0 + spec.cabLen + 1.5 : g.x0 + 1.0;
    let s = spec.eave === false ? "" : line(a, (spec.eave ?? g.roof - 0.75), g.x1 - 1.0, (spec.eave ?? g.roof - 0.75), "rgba(0,0,0,0.2)", 0.5);
    for (const d of spec.doors || []) if (d.y0 > g.sill + 0.1 && d.step !== false) s += rect(d.x + 0.25, g.sill - 0.6, d.w - 0.5, 0.28, "currentColor", 0, 'opacity="0.75"');
    const top = spec.ends ? spec.ends.h : g.roof;
    for (const [x, w, h, y] of spec.ac || []) s += aircon(x, y ?? (x > g.x0 + (spec.ends?.len ?? 0) + (spec.ends?.ramp ?? 0) && x + w < g.x1 - (spec.ends?.len ?? 0) - (spec.ends?.ramp ?? 0) ? g.roof : top), w, h);
    s += gear(g.sill, spec.gear || []);
    if (spec.onRoof) s += spec.onRoof(c, g);
    return s + (spec.more ? spec.more(c, g) : "");
  },
  cab: (c, g) => (spec.cabArt ? spec.cabArt(c, g) : "") + (spec.front ? front(spec.front) : ""),
});
// A body the carmodels.js builders can't shape: the outline filled, its
// livery clipped to it and shaded like the built-in drawings (soft shadow
// low, highlight high).
function shell(d, base, liv) {
  const id = newId();
  const shade = `<linearGradient id="${id}-s" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="14">` +
    '<stop offset="0.2" stop-color="#000" stop-opacity="0.16" style="stop-opacity:var(--car-shade-low,0.16)"/><stop offset="0.45" stop-color="#000" stop-opacity="0"/>' +
    '<stop offset="0.6" stop-color="#fff" stop-opacity="0"/><stop offset="0.85" stop-color="#fff" stop-opacity="0.1" style="stop-opacity:var(--car-shade-high,0.1)"/>' +
    '<stop offset="1" stop-color="#000" stop-opacity="0.08" style="stop-opacity:var(--car-shade-roof,0.08)"/></linearGradient>';
  return path(d, base) + `<clipPath id="${id}"><path d="${d}"/></clipPath><defs>${shade}</defs>` +
    `<g clip-path="url(#${id})">${liv}<rect x="-5" y="0" width="200" height="16" fill="url(#${id}-s)"/></g>` + path(d, "none", 0.8);
}
const grille = (x, y, w, h, gap = 0.4) => rect(x, y, w, h, "rgba(20,22,25,0.5)", 0.4) + slats(x, y, w, h, gap, "rgba(255,255,255,0.18)");
// A pantograph with its insulators, the roof cable from it to the
// equipment, and the roof covers beside it; facing as pantograph().
const panGear = (x, roof, facing = -1) => pantograph(x, roof, { up: true, facing }) + rect(x - 4.2, roof - 0.05, 1.6, 0.45, "#7d848c", 0.4, 'rx="0.1"') +
  line(x + 3.0, roof + 0.3, x + 7.5, roof + 0.3, "currentColor", 0.7) + cover(x + 7.5, roof, 2.6, 0.55);
// Israel Railways' emblem as carried on the sides: two bars crossed by a
// curve, like tracks switching (drawn here in simple shapes).
const ilMark = (x, y, h, fill) => rect(x - h * 0.95, y + h * 0.08, h * 1.9, h * 0.26, fill, 0, 'rx="0.05"') + rect(x - h * 0.95, y - h * 0.34, h * 1.9, h * 0.26, fill, 0, 'rx="0.05"') +
  path(`M${x - h * 0.42} ${y + h * 0.62}Q${x - h * 0.08} ${y + h * 0.02} ${x + h * 0.42} ${y - h * 0.62}`, "none", 0, `stroke="${fill}" stroke-width="${(h * 0.24).toFixed(2)}" stroke-linecap="butt"`);
const buffers = (x, side, y = 3.4) => rect(side < 0 ? x : x - 1.1, y - 0.45, 1.1, 0.9, "currentColor", 0, 'rx="0.2"') +
  rect(side < 0 ? x : x - 0.25, y - 0.7, 0.25, 1.4, "currentColor") + rect(side < 0 ? x + 1.1 : x - 1.6, y - 1.0, 0.5, 0.35, "currentColor", 0, 'opacity="0.8"');
// A locomotive's headlights and tail light low on its nose, a top light
// over the windshield.
const noseLamps = (x, y, top) => rect(x, y, 0.6, 0.45, "#f6f3dc", 0.4, 'rx="0.14"') + rect(x, y - 0.6, 0.6, 0.38, "#d0212e", 0.3, 'rx="0.1"') + rect(x + 0.3, top, 0.55, 0.32, "#f6f3dc", 0.3, 'rx="0.1"');

// --- Bombardier TRAXX P160 AC3 (2017 on): 62 electric locomotives for
// the 25 kV lines, 6 MW, 160 km/h; they haul the double-deck sets. 18.9 m,
// a cab at each end. Silver; a red line along the lower side that turns
// up across each cab door to the roof, a dark sill; the emblem in blue
// mid-side.
// Filter grilles along the machinery room, the pantographs and main
// breaker on the roof between the cab roofs, buffers at both ends.
export function traxx(c) {
  const { L } = c, sill = 4.0, roof = 13.9, rake = 2.0;
  const d = poly([[0.8, sill], [L - 0.8, sill], [L - 0.8, 9.4], [L - rake, roof - 0.5], ["q", L - rake - 0.3, roof, L - rake - 1.2, roof],
    [rake + 1.2, roof], ["q", rake + 0.3, roof, rake, roof - 0.5], [0.8, 9.4]]);
  let s = truck(L / 2 - 16.5, { wb: 8.5, d: 49, kind: "loco", top: sill }) + truck(L / 2 + 16.5, { wb: 8.5, d: 49, kind: "loco", top: sill });
  // Transformer tank and the batteries between the trucks; pilots.
  s += rect(L / 2 - 8, 1.9, 16, sill - 1.9, "currentColor", 0, 'opacity="0.8" rx="0.4"') + lines([[L / 2 - 4, 2.1, L / 2 - 4, sill - 0.2], [L / 2 + 4, 2.1, L / 2 + 4, sill - 0.2]], C.steelDark, 0.45);
  for (const [a, b] of [[0.8, 3.2], [L - 0.8, L - 3.2]]) s += path(poly([[a, sill], [b, sill], [b, 1.6], [a + (b > a ? 0.4 : -0.4), 1.0]]), "#2a2d31", 0.4);
  let liv = rect(0, 0, L, 16, IR.silver) + rect(0, roof - 1.4, L, 2, IR.roof) + rect(0, roof - 1.5, L, 0.12, "#848a91") + rect(0, sill, L, 0.9, IR.skirt);
  // The red line: low along the side, rising back across the cab doors.
  for (const [x, k] of [[0, 1], [L, -1]]) {
    const X = (v) => x + k * v;
    liv += path(poly([[X(1.2), 5.6], [X(8.6), 12.6], [X(9.3), 12.6], [X(1.9), 5.6]]), IR.red);
    liv += path(poly([[X(1.0), 9.7], [X(rake - 0.1), roof - 0.9], [X(rake + 2.2), roof - 0.9], [X(rake + 2.2), 9.7]]), C.glass) + line(X(1.4), 9.9, X(2.6), 12.0, "#0b0d0f", 0.8);
  }
  liv += rect(1.2, 5.6, L - 2.4, 0.5, IR.red);
  s += shell(d, IR.silver, liv);
  s += win(rake + 3.0, 9.4, 1.8, 2.2, 0.2) + win(L - rake - 4.8, 9.4, 1.8, 2.2, 0.2);
  s += door(rake + 5.4, sill + 0.3, 1.9, 7.0, { glass: false }) + door(L - rake - 7.3, sill + 0.3, 1.9, 7.0, { glass: false });
  // Machinery room: filter grilles high, panel joints, the emblem.
  for (const x of [12.4, 19.4, L - 25.4, L - 18.4]) s += grille(x, 9.0, 5.6, 3.0, 0.3);
  s += lines([[11.6, sill + 1.0, 11.6, roof - 1.6], [L / 2, sill + 1.0, L / 2, roof - 1.6], [L - 11.6, sill + 1.0, L - 11.6, roof - 1.6]], "rgba(0,0,0,0.22)", 0.45);
  s += ilMark(L / 2 - 4.5, 7.8, 1.4, IR.blue);
  // Roof: the pantographs, the main breaker and the roof line between,
  // horns over each cab.
  s += pantograph(L / 2 - 9.5, roof, { up: true, facing: 1 }) + pantograph(L / 2 + 9.5, roof, { up: false });
  s += cover(L / 2 - 4.5, roof, 9, 0.55) + rect(L / 2 - 0.6, roof + 0.5, 1.2, 0.7, C.steelDark, 0.3) + line(L / 2 - 6.6, roof + 0.35, L / 2 + 6.6, roof + 0.35, "currentColor", 0.7);
  s += horns(rake + 2.0, roof) + horns(L - rake - 3.2, roof) + aerial(rake + 5.6, roof);
  s += noseLamps(0.9, 7.2, 12.6) + noseLamps(L - 1.5, 7.2, 12.6);
  return s + buffers(0.8, -1) + buffers(L - 0.8, 1);
}

// --- Alstom/EMD JT42BW (48) and the Vossloh Euro 3200 and 4000 diesels:
// the diesel fleet hauling double-deck and single-deck sets off the wires;
// drawn on one body, the JT42BW's: a red cab at the front, a full-width
// engine room behind it in silver between navy bands, the emblem in navy,
// the cooling fans and exhaust on the roof, the fuel tank between the trucks.
export function jt42(c) {
  const { L } = c, sill = 4.0, roof = 13.6, rake = 1.8;
  const d = poly([[0.8, sill], [L - 0.9, sill], [L - 0.9, roof - 1.0], ["q", L - 0.9, roof, L - 1.9, roof],
    [rake + 1.2, roof], ["q", rake + 0.3, roof, rake, roof - 0.5], [0.8, 9.4]]);
  let s = truck(L / 2 - 19, { wb: 8.5, d: 40, kind: "loco", top: sill }) + truck(L / 2 + 19, { wb: 8.5, d: 40, kind: "loco", top: sill });
  s += path(poly([[L / 2 - 11, sill], [L / 2 + 11, sill], [L / 2 + 11, 2.4], ["q", L / 2 + 11, 1.6, L / 2 + 10, 1.6], [L / 2 - 10, 1.6], ["q", L / 2 - 11, 1.6, L / 2 - 11, 2.4]]), "currentColor", 0, 'opacity="0.82"');
  s += line(L / 2 - 10, 2.4, L / 2 + 10, 2.4, "rgba(255,255,255,0.14)", 0.6) + rect(L / 2 - 0.4, 2.6, 0.8, 0.8, C.steelDark, 0.3, 'rx="0.4"');
  s += path(poly([[0.8, sill], [3.2, sill], [3.2, 1.6], [1.2, 1.0]]), "#2a2d31", 0.4);
  let liv = rect(0, 0, L, 16, IR.silver) + rect(0, roof - 1.3, L, 2, IR.roof) + rect(0, roof - 1.4, L, 0.12, "#848a91");
  liv += rect(0, sill, L, 2.4, IR.navy) + rect(0, 10.5, L, 1.6, IR.navy);
  liv += path(poly([[0, 0], [9.6, 0], [9.6, roof + 1], [0, roof + 1]]), IR.red) + rect(9.6, 0, 0.3, roof + 1, IR.deep);
  liv += path(poly([[1.0, 9.7], [rake - 0.1, roof - 0.9], [rake + 2.2, roof - 0.9], [rake + 2.2, 9.7]]), C.glass) + line(1.4, 9.9, 2.6, 12.0, "#0b0d0f", 0.8);
  s += shell(d, IR.silver, liv);
  s += win(rake + 3.0, 9.4, 2.0, 2.2, 0.2) + door(rake + 5.4, sill + 0.3, 1.9, 7.0, { glass: true, glassY: 0.7, glassH: 0.2 }) + door(L - 4.0, sill + 0.3, 1.9, 6.4, { glass: false });
  // Engine-room doors, the radiator intakes at the rear, the emblem.
  s += lines([[18, 6.6, 18, 10.3], [26, 6.6, 26, 10.3], [34, 6.6, 34, 10.3], [42, 6.6, 42, 10.3]], "rgba(0,0,0,0.3)", 0.45);
  s += grille(11.4, 10.7, 6.0, 1.2, 0.3) + grille(L - 16, 6.8, 9.5, 3.4) + grille(20, 10.7, 10, 1.2, 0.3);
  s += ilMark(36, 8.4, 1.3, IR.navy);
  for (const x of [L - 13, L - 7.5]) s += path(`M${x - 2.2} ${roof}Q${x} ${roof + 0.8} ${x + 2.2} ${roof}Z`, C.steelDark, 0.4) + rect(x - 1.4, roof + 0.35, 2.8, 0.15, "currentColor", 0, 'opacity="0.6"');
  s += exhaust(L / 2 - 2, roof) + cover(14, roof, 9, 0.5) + horns(rake + 2.4, roof) + aerial(rake + 6.4, roof);
  s += noseLamps(0.9, 7.2, 12.4) + rect(L - 1.5, 7.2, 0.6, 0.45, "#d0212e", 0.3, 'rx="0.1"');
  return s + buffers(0.8, -1) + buffers(L - 0.9, 1);
}

// --- Bombardier double-deck coaches (TWINDEXX Vario, 2001-21): 443 cars in
// many batches, a driving trailer at one end of each set, 160 km/h. The
// lower deck dropped between the trucks, double doors at its ends; red with
// a pale band between the decks, pale doors, the emblem in white. Air-
// conditioning on the end roofs, the brake and battery boxes under the
// end floors.
const DDK = { roof: 15.1, sill: 3.9, cornerR: 1.0, end: 0.6, trucks: { centers: 63, wb: 8.5, d: 36 }, diaphragm: [4.0, 12.6], badge: false,
  ends: { h: 13.9, len: 12.5, ramp: 3 } };
const ddPaint = (c, L, x0 = 0) => rect(0, 0, L, 17, IR.red) + rect(0, 13.4, L, 3, IR.roof) + rect(0, 13.3, L, 0.12, "#848a91") + rect(0, 0, L, 3.9, IR.skirt) +
  rect(0, 8.75, L, 0.85, IR.pale) + rect(x0, 9.9, L - x0, 2.6, "#5b1218", 0, 'rx="0.4"') + rect(0, 2.2, L, 0.2, IR.pale);
const ddDoor = (x) => ({ x, w: 4.3, y0: 1.7, y1: 9.1, leaves: 2, glassY: 0.45, glassH: 0.4, fill: IR.pale });
const ddRows = (a) => [{ xs: seq(a, 5.2, 7), y: 10.15, w: 4.2, h: 2.1, r: 0.3 }, { xs: seq(a, 5.2, 7), y: 4.6, w: 4.2, h: 2.2, r: 0.3 }];
const ddGear = (L) => [[3.4, 3.2, 1.2, "b"], [L - 6.6, 3.2, 1.2, "b"]];
export const ddCoach = (c) => unit({ ...c, cabL: false, cabR: false }, { ...DDK, drop: { a: 18.0, b: c.L - 18.0, y: 1.6 },
  rows: [...ddRows(26.4), { xs: [4.2, 9.6, c.L - 14.0, c.L - 8.6], y: 7.95, w: 4.0, h: 2.4, r: 0.3 }],
  doors: [ddDoor(20.2), ddDoor(c.L - 24.5)], paint: (c, g) => ddPaint(c, g.L),
  ac: [[3, 9, 0.6, 13.9], [c.L - 12, 9, 0.6, 13.9]], gear: ddGear(c.L),
  more: (c, g) => ilMark(g.L / 2 + 6.0, 7.6, 0.9, "#ffffff") + cover(30, 15.1, 28, 0.35),
});
export const ddCab = (c) => unit({ ...c, cabL: true, cabR: false }, { ...DDK, drop: { a: 22.0, b: c.L - 18.0, y: 1.6 },
  nose: [[1.1, 3.9], [0.7, 5.4], ["q", 0.6, 7.6, 1.4, 9.0], [3.8, 12.9], ["q", 4.6, 13.9, 6.6, 13.9]],
  rows: [...ddRows(30.0), { xs: [11.0, c.L - 14.0, c.L - 8.6], y: 7.95, w: 4.0, h: 2.4, r: 0.3 }],
  doors: [ddDoor(24.2), ddDoor(c.L - 24.5)], cabLen: 9, paint: (c, g) => ddPaint(c, g.L, 16) + path("M0 8.6L0 14L8.4 14L8.4 8.6Q4 8.2 0 8.6Z", "#1b1d21"),
  cabArt: () => path(poly([[1.5, 9.1], [4.0, 12.6], [7.6, 12.6], [7.6, 9.1]]), C.glass) + sign(4.4, 12.0, 2.8, 0.4),
  front: { lamp: [0.95, 6.0], coupler: [0, 3.2], skirt: [[1.1, 3.9], [1.5, 1.7], [6.6, 1.7], [7.0, 3.9]], horn: [7.4, 13.9], wiper: [2.2, 9.4, 3.6, 11.8] },
  ac: [[c.L - 12, 9, 0.6, 13.9]], gear: [[10, 4, 1.4, "b"], [c.L - 6.6, 3.2, 1.2, "b"]],
  more: (c, g) => ilMark(g.L / 2 + 8.0, 7.6, 0.9, "#ffffff") + cover(34, 15.1, 24, 0.35),
});

// --- Siemens Desiro HC (2020 on): 60 electric units, 330 cars, 160 km/h:
// single-deck motor cars with the cabs at the ends, double-deck cars
// between, for the electrified lines (Jerusalem, the airport, Herzliya to
// Rehovot and Modi'in). White over navy, a blue sweep rising from the nose
// past the cab to the roof, red plug doors; the transformer and converters
// under the motor car's floor, its pantograph over the inner end.
const HC = { sill: 3.9, cornerR: 1.0, end: 0.6, trucks: { centers: 60, wb: 8.5, d: 36 }, diaphragm: [4.0, 12.4], badge: false };
const hcDoor = (x) => ({ x, w: 4.4, y0: 4.0, y1: 11.3, leaves: 2, glassY: 0.45, glassH: 0.4, fill: IR.red });
export const hcCab = (c) => unit({ ...c, cabL: true, cabR: false }, { ...HC, roof: 14.0,
  nose: [[1.2, 3.9], [0.7, 5.2], ["q", 0.5, 7.6, 1.4, 9.2], [4.6, 13.0], ["q", 5.6, 14.0, 7.8, 14.0]],
  rows: [{ xs: [...seq(20.0, 5.4, 6), 56.6, 62.0], y: 8.0, w: 4.4, h: 2.8, r: 0.35 }],
  doors: [hcDoor(13.6), hcDoor(c.L - 16.0)], cabLen: 9,
  paint: (c, g) => rect(0, 0, g.L, 17, IR.white) + rect(0, 12.8, g.L, 3, IR.roof) + rect(0, 12.7, g.L, 0.12, "#848a91") + rect(0, 0, g.L, 3.9, IR.skirt) +
    rect(0, 3.9, g.L, 2.6, IR.navy) + path("M0 3.9L0 9.4Q3 9.0 6.0 8.4Q9.6 7.6 12.0 9.6Q14.4 12.0 16.8 14.0L19.6 14.0Q16.4 11.0 14.0 8.4Q11.6 6.3 8.0 6.5L0 6.6Z", IR.sky) +
    path("M0 9.0L0 12.6Q3.0 12.2 5.4 9.6L5.4 8.6Q3 8.8 0 9.0Z", "#1b1d21") + rect(0, 6.5, g.L, 0.22, IR.sky),
  cabArt: () => path(poly([[1.6, 9.3], [4.6, 12.6], [8.4, 12.6], [8.4, 9.3]]), C.glass) + sign(5.0, 12.8, 2.8, 0.42),
  front: { lamp: [1.0, 6.0], coupler: [0, 3.2], skirt: [[1.2, 3.9], [1.6, 1.7], [6.6, 1.7], [7.0, 3.9]], horn: [8.4, 14.0], wiper: [2.4, 9.6, 3.8, 11.9] },
  ac: [[21, 12, 0.7]], gear: [[22, 10, 1.6, "g"], [33, 8, 1.4, "b"], [42, 6, 1.0, "t"], [49, 8, 1.4, "g"]],
  onRoof: (c, g) => panGear(g.L - 18, 14.0) + cover(36, 14.0, 12, 0.5),
  more: (c, g) => ilMark(38, 5.2, 1.0, "#ffffff"),
});
export const hcMid = (c) => unit({ ...c, cabL: false, cabR: false }, { ...DDK, drop: { a: 17.0, b: c.L - 17.0, y: 1.6 },
  rows: [...ddRows(25.4), { xs: [4.2, 9.6, c.L - 14.0, c.L - 8.6], y: 7.95, w: 4.0, h: 2.4, r: 0.3 }],
  doors: [ddDoor(19.4), ddDoor(c.L - 23.6)].map((d) => ({ ...d, fill: IR.red })),
  paint: (c, g) => rect(0, 0, g.L, 17, IR.white) + rect(0, 13.4, g.L, 3, IR.roof) + rect(0, 13.3, g.L, 0.12, "#848a91") + rect(0, 0, g.L, 3.9, IR.skirt) +
    rect(0, 0, g.L, 4.3, IR.navy) + rect(0, 4.3, g.L, 0.22, IR.sky) + rect(0, 7.2, 17, 0.2, IR.sky) + rect(g.L - 17, 7.2, 17, 0.2, IR.sky) + rect(0, 9.9, g.L, 2.6, "#272c33", 0, 'rx="0.4"'),
  ac: [[3, 9, 0.6, 13.9], [c.L - 12, 9, 0.6, 13.9]], gear: ddGear(c.L),
  more: (c, g) => ilMark(g.L / 2 + 6.0, 8.6, 0.9, IR.blue) + cover(30, 15.1, 26, 0.35),
});

export const TYPES = {
  ilTraxx: { name: "TRAXX P160 AC3 electric locomotive", kind: "electric", pan: true },
  ilJt42: { name: "JT42BW diesel locomotive", kind: "diesel" },
  ilDd: { name: "Bombardier double-deck coach", kind: "bilevel" },
  ilDdCab: { name: "Bombardier double-deck driving trailer", kind: "bilevel", cab: true },
  ilHcCab: { name: "Desiro HC motor car", kind: "emu", pan: true },
  ilHc: { name: "Desiro HC double-deck car", kind: "bilevel", emu: true },
};
// oneEnd: single-cab equipment, drawn cab-left and mirrored at the back of a train.
const M = (draw, len, oneEnd = false) => ({ draw, len, oneEnd, variant: null });
export const MODELS = {
  ilTraxx: M(traxx, 62.0), ilJt42: M(jt42, 66.0, true),
  ilDd: M(ddCoach, 87.9), ilDdCab: M(ddCab, 89.0, true),
  ilHcCab: M(hcCab, 86.6, true), ilHc: M(hcMid, 84.0),
};

const set = (label, ...units) => ({ label, units });
// Line ends on the electrified core: Tel Aviv and its suburbs, the airport,
// Modi'in and Jerusalem.
const WIRED = /^(Herzliya|Jerusalem|Modi'in|Tel Aviv|Ben Gurion Airport|Netanya|Rehovot|Rishon LeZion|Bnei Brak|Yavne)$/;
const NEAR = /^(Ashdod|Lod|Rosh HaAyin|Hadera|Binyamina|Ashkelon)$/;
export const TYPICAL = {
  israelrail: (t) => {
    const ends = (t.route || "").split(" – ");
    if (ends.length === 2 && ends.every((e) => WIRED.test(e))) {
      return set("Siemens Desiro HC electric unit, 4 cars shown (some trains a TRAXX locomotive with double-deck coaches)", ["ilHcCab", 1], ["ilHc", 2], ["ilHcCab", 1]);
    }
    // Out from the core along lines wired since: electric push-pull sets.
    if (ends.length === 2 && ends.every((e) => WIRED.test(e) || NEAR.test(e))) {
      return set("TRAXX electric locomotive with Bombardier double-deck coaches and a driving trailer (diesel on some trains)", ["ilTraxx", 1], ["ilDd", 5], ["ilDdCab", 1]);
    }
    return set("Diesel locomotive with Bombardier double-deck coaches and a driving trailer (a TRAXX electric where the line is wired)", ["ilJt42", 1], ["ilDd", 5], ["ilDdCab", 1]);
  },
};

// Facts come in km/h and kW; the page converts them back for display.
const kmh = (v) => Math.round((v / 1.609344) * 10) / 10, kw = (v) => Math.round(v / 0.7457);
const WP = "https://en.wikipedia.org/wiki/";
export const FACTS = {
  ilTraxx: { model: "Bombardier TRAXX P160 AC3", type: "Electric locomotive", builder: "Bombardier (now Alstom)", built: "2017 on",
    fleet: "62", topSpeedMph: kmh(160), powerHp: kw(6000), lengthFt: 62.0,
    about: "Israel Railways' first electric locomotives, bought for the 25 kV network that has been spreading out from the Tel Aviv–Jerusalem line since 2018. They haul push-pull sets of double-deck coaches.", source: `${WP}Bombardier_TRAXX` },
  ilJt42: { model: "Alstom/EMD JT42BW", type: "Diesel-electric locomotive", builder: "Alstom, with EMD", fleet: "48 (also 24 Euro 3200s and 14 Euro 4000s)",
    topSpeedMph: kmh(140),
    about: "The most numerous of Israel Railways' diesel locomotives, hauling the double-deck and Siemens single-deck push-pull sets on lines not yet electrified. Vossloh Euro 3200s and 4000s do the same work.", source: `${WP}Israel_Railways` },
  ilDd: { model: "Bombardier double-deck coach", type: "Double-deck coach", builder: "Bombardier (now Alstom), Görlitz", built: "2001–2021",
    fleet: "443 ordered from 2010 to 2019, and earlier batches", topSpeedMph: kmh(160),
    about: "The backbone of Israel Railways' fleet: push-pull double-deck coaches bought batch after batch over twenty years, the newer ones for electric haulage only.", source: `${WP}Bombardier_Double-deck_Coach` },
  ilDdCab: { model: "Bombardier double-deck driving trailer", type: "Double-deck driving trailer", builder: "Bombardier (now Alstom), Görlitz", built: "2001–2021",
    topSpeedMph: kmh(160), about: "The cab car at the far end of a double-deck set from its locomotive.", source: `${WP}Bombardier_Double-deck_Coach` },
  ilHcCab: { model: "Siemens Desiro HC", type: "Electric multiple unit", builder: "Siemens Mobility", built: "2020 on", fleet: "60 units, 330 cars",
    topSpeedMph: kmh(160),
    about: "Electric units with a single-deck motor car at each end and double-deck cars between, ordered in 2017 with a depot in Ashkelon; the first arrived in November 2020.", source: `${WP}Siemens_Desiro_HC` },
  ilHc: { model: "Siemens Desiro HC double-deck car", type: "Electric multiple unit", builder: "Siemens Mobility", built: "2020 on", fleet: "60 units, 330 cars",
    topSpeedMph: kmh(160), about: "A double-deck middle car of the Desiro HC, between its single-deck motor cars.", source: `${WP}Siemens_Desiro_HC` },
};
