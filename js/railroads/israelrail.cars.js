// Israel Railways' cars (scripts/railroads/israelrail.py), as the fleet runs
// in October 2026: Siemens Desiro HC electric units; push-pull trains of
// Bombardier double-deck coaches behind TRAXX electrics on the wired lines
// and JT42BW or Vossloh Euro diesels off them; and the Siemens Viaggio Light
// single-deck sets, still in diesel push-pull service on the northern lines
// until the Desiro HS units ordered in 2024 replace them. (The IC3 railcars
// left timetabled service in November 2023 and were sold to Romania, so
// they're not drawn.) The SIRI feed's vehicle ref is the train number, not
// a unit, so every train is drawn as what usually runs on its line, which
// depends first on whether the line is wired yet (TYPICAL below).
// Trainsheet's own side views, from published dimensions and photographs;
// the emblem is drawn here in simple shapes, not copied.
import { newId, bilevel } from "../carmodels.js?v=dev";
import { C, rect, path, line, lines, poly, win, door, truck, pantograph, slats } from "../carart.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);

// The double-deck coaches' red with a pale band between the decks and pale
// gray along the sill; the TRAXX's silver lined in red; the JT42BW's silver
// and navy with red cabs; the Vossloh Euros' silver with sky-blue and red
// cabs; the Desiro HC's white and royal blue; the Viaggio Light's blue with
// a white wave. Colors matched by eye to photographs (Wikimedia Commons,
// 2018-2025).
const IR = { white: "#f2f3f5", silver: "#cdd1d6", blue: "#24398f", navy: "#1a2a6c", sky: "#3a5fc8", red: "#d42330", deep: "#a51b26", pale: "#e3e1dc",
  roof: "#a9afb6", skirt: "#3a3e44", royal: "#2a45b0", gray: "#c4c7cb", door: "#cfd2d5", azure: "#4aa3df", vl: "#2348b4", vlDeep: "#1a3690" };

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
// Israel Railways' emblem as carried on the sides: two horizontal bars,
// like two tracks, each with a curved track turning out of it, the upper
// one curving up to the left and the lower one down to the right, the same
// shape turned half round (drawn here in simple shapes). rot: 90 stands it
// on end, as on the TRAXX's side.
const ilMark = (x, y, h, fill, rot = 0) => {
  const r = (v) => Math.round(v * 100) / 100, sw = r(h * 0.26);
  const arc = (k) => path(`M${r(x - k * h * 0.34)} ${r(y + k * h * 0.98)}Q${r(x - k * h * 0.32)} ${r(y + k * h * 0.22)} ${r(x + k * h * 0.3)} ${r(y + k * h * 0.22)}`, "none", 0,
    `stroke="${fill}" stroke-width="${sw}" stroke-linecap="butt"`);
  const s = rect(x - h * 0.95, y + h * 0.09, h * 0.5, h * 0.26, fill) + rect(x + h * 0.12, y + h * 0.09, h * 0.83, h * 0.26, fill) + arc(1) +
    rect(x - h * 0.95, y - h * 0.35, h * 0.83, h * 0.26, fill) + rect(x + h * 0.45, y - h * 0.35, h * 0.5, h * 0.26, fill) + arc(-1);
  return rot ? `<g transform="rotate(${rot} ${r(x)} ${r(y)})">${s}</g>` : s;
};
const buffers = (x, side, y = 3.4) => rect(side < 0 ? x : x - 1.1, y - 0.45, 1.1, 0.9, "currentColor", 0, 'rx="0.2"') +
  rect(side < 0 ? x : x - 0.25, y - 0.7, 0.25, 1.4, "currentColor") + rect(side < 0 ? x + 1.1 : x - 1.6, y - 1.0, 0.5, 0.35, "currentColor", 0, 'opacity="0.8"');
// A locomotive's headlights and tail light low on its nose, a top light
// over the windshield.
const noseLamps = (x, y, top) => rect(x, y, 0.6, 0.45, "#f6f3dc", 0.4, 'rx="0.14"') + rect(x, y - 0.6, 0.6, 0.38, "#d0212e", 0.3, 'rx="0.1"') + rect(x + 0.3, top, 0.55, 0.32, "#f6f3dc", 0.3, 'rx="0.1"');

// --- Bombardier TRAXX P160 AC3 (2017 on, 3001 up): 62 electric locomotives
// for the 25 kV lines, 6 MW, 160 km/h; they haul the double-deck sets.
// 18.9 m over buffers, 4.28 m tall, bogies 10.44 m apart, 1,250 mm wheels;
// a cab at each end (Bombardier's TRAXX data). Livery from photographs of
// 3001, 3002 and 3007 (Jerusalem Yitzhak Navon, Wikimedia Commons): silver;
// a red line low along each side that turns up the front corner of each
// cab to the roof; a red band along the top of the machinery room, broken
// by small grilles; the side of the machinery room in tall vertical ribs,
// the emblem standing on end in blue in the middle; a dark gray sill.
// The pantographs and main breaker on the roof between the cab roofs,
// buffers at both ends.
// (Corrected tonight: the red used to cross the cab doors diagonally and the
// side had four dark filter grilles; the photographs show neither.)
export function traxx(c) {
  const { L } = c, sill = 4.0, roof = 13.9, rake = 2.0;
  const d = poly([[0.8, sill], [L - 0.8, sill], [L - 0.8, 9.4], [L - rake, roof - 0.5], ["q", L - rake - 0.3, roof, L - rake - 1.2, roof],
    [rake + 1.2, roof], ["q", rake + 0.3, roof, rake, roof - 0.5], [0.8, 9.4]]);
  let s = truck(L / 2 - 17.1, { wb: 8.5, d: 49, kind: "loco", top: sill }) + truck(L / 2 + 17.1, { wb: 8.5, d: 49, kind: "loco", top: sill });
  // Transformer tank and the batteries between the trucks; pilots.
  s += rect(L / 2 - 8, 1.9, 16, sill - 1.9, "currentColor", 0, 'opacity="0.8" rx="0.4"') + lines([[L / 2 - 4, 2.1, L / 2 - 4, sill - 0.2], [L / 2 + 4, 2.1, L / 2 + 4, sill - 0.2]], C.steelDark, 0.45);
  for (const [a, b] of [[0.8, 3.2], [L - 0.8, L - 3.2]]) s += path(poly([[a, sill], [b, sill], [b, 1.6], [a + (b > a ? 0.4 : -0.4), 1.0]]), "#2a2d31", 0.4);
  let liv = rect(0, 0, L, 16, IR.silver) + rect(0, roof - 1.0, L, 2, IR.roof) + rect(0, roof - 1.1, L, 0.12, "#848a91") + rect(0, sill, L, 0.9, IR.skirt);
  // The machinery room's ribbed side between the cab doors.
  const ma = rake + 8.0, mb = L - rake - 8.0;
  liv += rect(ma, sill + 1.7, mb - ma, roof - 3.2 - sill - 1.7, "#dfe2e6") + slats(ma + 0.2, sill + 1.8, mb - ma - 0.4, roof - 3.4 - sill - 1.7, 0.55, "rgba(60,66,74,0.35)");
  // The red: a band along the top of the machinery room with its grilles,
  // and the low line that turns up each cab's front corner.
  liv += rect(ma - 0.4, roof - 3.2, mb - ma + 0.8, 0.95, IR.red) + seq(ma + 0.6, 1.3, Math.floor((mb - ma - 1) / 1.3)).map((x) => rect(x, roof - 2.95, 0.7, 0.45, "#8b9097")).join("");
  for (const [x, k] of [[0, 1], [L, -1]]) {
    const X = (v) => x + k * v;
    liv += path(poly([[X(0.8), 5.0], [X(0.8), 9.4], [X(rake - 0.05), roof - 0.55], [X(rake + 0.75), roof - 0.55], [X(1.55), 9.4], [X(1.55), 5.55], [X(3.0), 5.55], [X(3.0), 5.0]]), IR.red);
    liv += path(poly([[X(1.0), 9.7], [X(rake - 0.1), roof - 0.9], [X(rake + 2.2), roof - 0.9], [X(rake + 2.2), 9.7]]), C.glass) + line(X(1.4), 9.9, X(2.6), 12.0, "#0b0d0f", 0.8);
  }
  liv += rect(1.2, 5.0, L - 2.4, 0.55, IR.red);
  s += shell(d, IR.silver, liv);
  s += win(rake + 3.0, 9.4, 1.8, 2.2, 0.2) + win(L - rake - 4.8, 9.4, 1.8, 2.2, 0.2);
  s += door(rake + 5.4, sill + 0.3, 1.9, 7.0, { glass: false }) + door(L - rake - 7.3, sill + 0.3, 1.9, 7.0, { glass: false });
  // Machinery room: panel joints between the rib panels, the emblem on end.
  s += lines([[ma, sill + 1.7, ma, roof - 3.2], [L / 2, sill + 1.7, L / 2, roof - 3.2], [mb, sill + 1.7, mb, roof - 3.2]], "rgba(0,0,0,0.25)", 0.45);
  s += rect(L / 2 - 4.6, 6.0, 1.9, 3.8, "#dfe2e6") + ilMark(L / 2 - 3.65, 7.9, 1.25, IR.royal, 90);
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

// --- Vossloh Euro 3200 (1301-1324, 2012-13) and Euro 4000 (1401-1414,
// 2011): Vossloh España's Euro diesel-electrics (the Euro 3200 is the
// Euro 3000 AC, Bo'Bo', 21.0 m over buffers, 1,117 mm wheels, 2,454 kW,
// 160 km/h, bought for push-pull work with the double-deck and Viaggio
// Light coaches; the Euro 4000 Co'Co', 23.02 m, 1,067 mm wheels, 3,178 kW,
// bought for passenger trains first and freight later; en.wikipedia "Stadler
// Euro"); 4.26 m tall. A cab at each end, its windshield raked back; the
// machinery room's sides in horizontal louvres, two filter grilles high up
// behind one cab, the radiator grille by the other. Livery from photographs
// of 1414 at Tel Aviv with a double-deck set and of a Euro with a Viaggio
// Light set at Bat Galim (Wikimedia Commons): sky blue over each cab, red
// below it, the red carried along the lower edge of the side; the
// louvred silver side with the emblem in blue; a sky-blue line along the
// top of the side; gray roof, dark frame.
function euro(c, { co = false } = {}) {
  const { L } = c, sill = 4.2, roof = 14.0;
  const nose = (k) => (k > 0 ? [[0.7, sill], [0.6, 8.6], ["q", 0.6, 9.4, 1.0, 9.9], [2.0, 12.9], ["q", 2.4, roof, 3.6, roof]]
    : [[L - 3.6, roof], ["q", L - 2.4, roof, L - 2.0, 12.9], [L - 1.0, 9.9], ["q", L - 0.6, 9.4, L - 0.6, 8.6], [L - 0.7, sill]]);
  const d = poly([...nose(1), ...nose(-1)]);
  const tc = co ? 23.0 : 18.0, wb = co ? 13.4 : 9.2, wd = co ? 42 : 44;
  let s = [-1, 1].map((k) => truck(L / 2 + k * tc, { wb, d: wd, kind: "loco", top: sill, axles: co ? 3 : 2 })).join("");
  // Fuel tank and air reservoirs between the trucks; pilots under the cabs.
  const ta = L / 2 - tc + wb / 2 + 2.6, tb = L / 2 + tc - wb / 2 - 2.6;
  s += path(poly([[ta, sill], [tb, sill], [tb, 2.3], ["q", tb, 1.6, tb - 0.7, 1.6], [ta + 0.7, 1.6], ["q", ta, 1.6, ta, 2.3]]), "currentColor", 0, 'opacity="0.82"') +
    line(ta + 0.6, 2.4, tb - 0.6, 2.4, "rgba(255,255,255,0.14)", 0.6);
  for (const [a, b] of [[0.7, 3.4], [L - 0.7, L - 3.4]]) s += path(poly([[a, sill], [b, sill], [b, 1.5], [a + (b > a ? 0.4 : -0.4), 0.9]]), "#2a2d31", 0.4);
  let liv = rect(0, 0, L, 16, IR.silver) + rect(0, roof - 1.3, L, 2, IR.roof) + rect(0, roof - 1.4, L, 0.12, "#848a91") + rect(0, sill, L, 0.7, "#2d3035");
  liv += rect(0, 12.15, L, 0.4, IR.azure) + rect(0, sill + 0.7, L, 0.65, IR.red);
  // Louvred machinery-room sides between the cabs.
  const ma = 9.6, mb = L - 9.6;
  const lv = []; for (let y = 5.9; y < 11.6; y += 0.42) lv.push([ma + 0.3, y, mb - (co ? 5.6 : 0.3), y]);
  liv += rect(ma, 5.6, mb - ma, 6.3, "#d6d9dd") + lines(lv, "rgba(70,76,84,0.35)", 0.45);
  // Each cab: sky blue above, red below a line rising back from the nose.
  for (const [x, k] of [[0, 1], [L, -1]]) {
    const X = (v) => x + k * v;
    liv += path(poly([[X(0), 0], [X(8.9), 0], [X(8.9), 9.6], ["q", X(5.0), 9.0, X(0), 7.8]]), IR.red) +
      path(poly([[X(0), 7.8], ["q", X(5.0), 9.0, X(8.9), 9.6], [X(8.9), 16], [X(0), 16]]), IR.azure) + line(X(8.95), sill + 0.7, X(8.95), roof - 1.4, "rgba(0,0,0,0.3)", 0.5);
    liv += path(poly([[X(0.9), 10.1], [X(2.0), 12.9], [X(3.4), 12.9], [X(3.4), 10.1]]), C.glass) + line(X(1.3), 10.3, X(2.2), 12.5, "#0b0d0f", 0.8);
  }
  s += shell(d, IR.silver, liv);
  for (const [x, k] of [[0, 1], [L, -1]]) {
    const X = (v) => x + k * v;
    s += win(Math.min(X(4.2), X(5.9)), 9.6, 1.7, 2.1, 0.2) + door(Math.min(X(6.5), X(8.4)), sill + 0.75, 1.9, 7.2, { glass: true, glassY: 0.72, glassH: 0.18 });
    s += noseLamps(Math.min(X(0.75), X(1.35)), 6.4, 12.9);
  }
  // Filter grilles high behind the front cab, the radiator by the rear one,
  // the emblem mid-side; the roof hatches, fans and exhaust.
  s += grille(10.6, 10.0, 4.8, 1.8, 0.3) + grille(16.2, 10.0, 4.8, 1.8, 0.3) + (co ? grille(mb - 5.2, 5.9, 4.6, 5.2, 0.32) : grille(mb - 6.6, 10.0, 4.8, 1.8, 0.3));
  s += ilMark(L / 2 + 1.0, 8.4, 1.4, IR.royal);
  s += cover(11, roof, L - 22, 0.35) + lines([[18, roof, 18, roof + 0.35], [L / 2, roof, L / 2, roof + 0.35], [L - 18, roof, L - 18, roof + 0.35]], "rgba(0,0,0,0.3)", 0.4);
  s += exhaust(L / 2 + 3, roof + 0.3) + [L / 2 - 6, L / 2 - 2.4].map((x) => path(`M${x - 1.5} ${roof + 0.3}Q${x} ${roof + 0.9} ${x + 1.5} ${roof + 0.3}Z`, C.steelDark, 0.4)).join("");
  s += horns(3.4, roof) + horns(L - 4.6, roof) + aerial(5.8, roof);
  return s + buffers(0.7, -1) + buffers(L - 0.7, 1);
}
export const euro3200 = (c) => euro(c);
export const euro4000 = (c) => euro(c, { co: true });

// --- Bombardier double-deck coaches (Görlitz, 2001-21): Israel's
// push-pull fleet, about 580 coaches in service in 2024 (Railway Gazette):
// the first generation (TC-101 coaches 425-490, 521-538, 2201-2394 and
// PC-103 driving trailers with a diesel generator, 401-424 and 501-507,
// 2001-06), then batches of 78 (2011), 72 (2014, the first able to run
// under the wires), 93 TWINDEXX Vario (2018), 48 electric-only (2019) and 74
// (2020). The batches look alike from outside and are drawn as one.
// 26.8 m over buffers, 4.6 m tall, the lower deck dropped between the
// trucks with a pair of doors at each end of it; 160 km/h. Livery from
// photographs at Tel Aviv, Haifa and Bat Galim (Wikimedia Commons,
// 2010-2025): red; a pale gray band between the decks; pale gray along the
// sill up to the lower windows; pale gray doors; a gray roof; the windows
// set one by one in the red; the emblem in white by a door.
// (Corrected tonight: the coaches had a dark band behind the upper windows
// and a dark skirt, which the photographs don't show, and seven windows a
// deck where they have eight.)
const DDK = { roof: 15.1, sill: 3.9, cornerR: 1.0, end: 0.6, trucks: { centers: 63, wb: 8.5, d: 36 }, diaphragm: [4.0, 12.6], badge: false,
  ends: { h: 13.9, len: 12.5, ramp: 3 } };
const ddPaint = (c, L) => rect(0, 0, L, 17, IR.red) + rect(0, 13.35, L, 3, IR.roof) + rect(0, 13.3, L, 0.12, "#848a91") +
  rect(0, 8.75, L, 0.85, IR.gray) + rect(0, 0, L, 4.25, IR.gray) + rect(0, 4.25, L, 0.08, "rgba(0,0,0,0.18)") + rect(0, 0, L, 1.75, "#9da2a8");
const ddDoor = (x) => ({ x, w: 4.3, y0: 1.7, y1: 9.1, leaves: 2, glassY: 0.45, glassH: 0.4, fill: IR.door });
const ddRows = (a, n = 8) => [{ xs: seq(a, 4.7, n), y: 10.15, w: 3.8, h: 2.15, r: 0.35 }, { xs: seq(a, 4.7, n), y: 4.65, w: 3.8, h: 2.2, r: 0.3 }];
const ddGear = (L) => [[3.4, 3.2, 1.2, "b"], [L - 6.6, 3.2, 1.2, "b"]];
export const ddCoach = (c) => unit({ ...c, cabL: false, cabR: false }, { ...DDK, drop: { a: 18.0, b: c.L - 18.0, y: 1.6 },
  rows: [...ddRows(25.6), { xs: [4.2, 9.6, c.L - 14.0, c.L - 8.6], y: 7.95, w: 4.0, h: 2.4, r: 0.3 }],
  doors: [ddDoor(20.2), ddDoor(c.L - 24.5)], paint: (c, g) => ddPaint(c, g.L),
  ac: [[3, 9, 0.6, 13.9], [c.L - 12, 9, 0.6, 13.9]], gear: ddGear(c.L),
  more: (c, g) => ilMark(g.L - 19.6, 6.4, 0.75, "#ffffff") + cover(30, 15.1, 28, 0.35),
});
// The driving trailer (photographs of 413 at Haifa and 2007 at Bat Galim):
// a rounded cab end, its windshield and headlights set in a gray panel
// wrapping round from the front; behind the cab the diesel generator room
// that powers the train's lights and air (two tall louvres in the side, no
// door at that end); buffers and a screw coupling under the cab.
export const ddCab = (c) => unit({ ...c, cabL: true, cabR: false }, { ...DDK, drop: { a: 22.0, b: c.L - 18.0, y: 1.6 },
  nose: [[1.0, 3.9], [0.55, 5.2], ["q", 0.4, 9.6, 1.0, 11.4], ["q", 1.9, 13.9, 4.6, 13.9]],
  rows: [{ xs: seq(21.2, 4.7, 9), y: 10.15, w: 3.8, h: 2.15, r: 0.35 }, { xs: seq(26.0, 4.7, 8), y: 4.65, w: 3.8, h: 2.2, r: 0.3 },
    { xs: [c.L - 14.0, c.L - 8.6], y: 7.95, w: 4.0, h: 2.4, r: 0.3 }],
  doors: [ddDoor(c.L - 24.5)], cabLen: 9,
  paint: (c, g) => ddPaint(c, g.L) + path("M0 7.3L3.6 7.3Q4.6 7.3 4.6 8.3L4.6 14.5L0 14.5Z", "#8c9197") + rect(0, 7.3, 0.9, 1.4, "#8c9197"),
  cabArt: () => path("M0.72 9.4Q0.78 11.2 1.45 12.3Q2.25 13.15 3.7 13.15L3.7 9.4Z", C.glass) + path("M0.85 11.3Q1.1 12.1 1.7 12.6L3.5 12.6L3.5 11.3Z", C.glassLight) +
    sign(1.6, 12.7, 1.9, 0.32) + rect(0.6, 7.75, 0.55, 0.42, "#f6f3dc", 0.3, 'rx="0.12"') + rect(0.62, 7.25, 0.45, 0.32, "#d0212e", 0.3, 'rx="0.1"') +
    rect(5.3, 4.3, 1.8, 7.6, "rgba(0,0,0,0.06)", 0.5, 'rx="0.2"') + win(5.55, 9.6, 1.3, 1.9, 0.2) + line(4.95, 6.0, 4.95, 9.4, "currentColor", 0.6) +
    grille(9.8, 4.6, 2.9, 5.6, 0.3) + grille(13.6, 4.6, 2.9, 5.6, 0.3) + buffers(0.5, -1, 3.3) + line(1.4, 9.6, 2.4, 11.8, "#0b0d0f", 0.8),
  front: { coupler: [0, 3.0], skirt: [[1.0, 3.9], [1.3, 1.8], [6.2, 1.8], [6.6, 3.9]], horn: [6.0, 13.9] },
  ac: [[c.L - 12, 9, 0.6, 13.9]], gear: [[8.5, 9, 1.5, "g"], [c.L - 6.6, 3.2, 1.2, "b"]],
  more: (c, g) => ilMark(g.L - 19.6, 6.4, 0.75, "#ffffff") + cover(34, 15.1, 24, 0.35) + aerial(7.5, 13.9),
});

// --- Siemens Desiro HC (2020 on): electric units with a single-deck motor
// car at each end and unpowered double-deck cars between, for Israel's
// 25 kV lines; ordered 2017 (330 cars), the first 24 units six four-car and
// eighteen six-car, then 36 more six-car units delivered from 2024; 81 more
// six-car units ordered in 2024 for delivery by 2029 (Railway Gazette, de
// .wikipedia). End cars 26.226 m and middle cars 25.2 m over couplers,
// 4.64 m tall, 2.82 m wide; floors 800 mm (end cars) and 730 mm (middle
// cars) above the rail; 4,800 kW in Israel's version, 160 km/h (de
// .wikipedia "Siemens Desiro HC"). The end car as tall as the double-deck
// cars, its machinery on the roof and under the floor, a pantograph over
// its inner end; two pairs of plug doors a side on every car, the middle
// cars' at the ends of the low floor beside the trucks; four big windows on
// each deck between them and one window at mid-height over each truck.
// Door and window positions measured from drone photographs of a six-car
// unit at the Rosh HaAyin junction (2021) and close-ups at Jerusalem
// Yitzhak Navon and Tel Aviv HaShalom (2024-25, Wikimedia Commons).
// Livery: white; royal blue up to the windows on the end cars and up past
// the lower deck's sills on the middle cars, a white line run low through
// it; a thin blue line along the side under the upper deck's windows; on
// the end car a blue sweep rising from the blue past the driver's window to
// the roof, the windshield framed in blue; red doors; the emblem in blue on
// the white or in white on the blue.
// (Corrected tonight: the end car was drawn 1.2 ft too low with eight small
// windows and its doors in the wrong places, the middle car with seven
// windows a deck where it has four, and the blue as a low band.)
const HC = { sill: 2.9, cornerR: 1.0, end: 0.6, trucks: { centers: 60.7, wb: 8.5, d: 36 }, diaphragm: [3.3, 12.8], badge: false, roof: 15.2, eave: 14.3 };
const hcDoor = (x, w = 4.6, y0 = 3.0, y1 = 10.0) => ({ x, w, y0, y1, leaves: 2, glassY: 0.3, glassH: 0.55, fill: IR.red });
const hcBase = (L, top = 5.6) => rect(0, 0, L, 17, IR.white) + rect(0, 14.35, L, 3, IR.gray) + rect(0, 14.3, L, 0.1, "#9aa0a7") +
  rect(0, 0, L, top, IR.royal) + rect(0, 3.15, L, 0.38, IR.white) + rect(0, 9.75, L, 0.24, IR.royal);
export const hcCab = (c) => unit({ ...c, cabL: true, cabR: false }, { ...HC,
  nose: [[1.1, 2.9], [0.6, 4.2], ["q", 0.4, 7.4, 1.6, 9.4], [5.4, 13.9], ["q", 6.6, 15.2, 9.6, 15.2]],
  rows: [{ xs: [12.8], y: 6.0, w: 6.0, h: 3.35, r: 0.45 }, { xs: [30.6, 53.4], y: 6.0, w: 3.2, h: 3.35, r: 0.45 }, { xs: [35.6, 44.4, 67.8, 76.4], y: 6.0, w: 7.4, h: 3.35, r: 0.45 }],
  doors: [hcDoor(23.4), hcDoor(60.6)], cabLen: 10,
  paint: (c, g) => hcBase(g.L) + path("M0 5.6L0 9.6Q0.9 9.4 1.5 9.2L5.6 13.95Q6.6 15.1 9.4 15.2L10.6 15.2Q7.4 15.0 6.5 13.6L2.6 8.6Q1.8 6.4 0.4 5.6Z", IR.royal) +
    path("M8.6 5.6Q9.6 11.6 12.6 15.4L16.8 15.4Q13.4 10.8 14.8 5.6Z", IR.royal),
  cabArt: () => path(poly([[1.7, 9.6], [5.4, 13.6], [9.0, 13.6], [9.0, 12.9], [6.0, 12.9], [2.9, 9.6]]), C.glass) + path(poly([[2.3, 10.0], [4.6, 12.5], [5.6, 12.5], [3.4, 10.0]]), C.glassLight) +
    win(10.6, 8.6, 1.7, 2.8, 0.3) + rect(0.65, 5.75, 1.0, 0.7, "#f6f3dc", 0.4, 'rx="0.2"') + rect(0.7, 5.05, 0.6, 0.38, "#d0212e", 0.3, 'rx="0.1"'),
  front: { coupler: [0, 2.8], skirt: [[1.1, 2.9], [1.4, 1.5], [6.4, 1.5], [6.8, 2.9]], horn: [9.6, 15.2], wiper: [2.6, 10.0, 3.8, 11.9] },
  gear: [[17.5, 4.4, 1.4, "b"], [30.0, 10, 1.7, "g"], [41.0, 8, 1.6, "b"], [50.0, 6, 1.1, "t"]],
  onRoof: (c, g) => cover(12, 15.2, 14, 0.75) + slats(13, 15.25, 12, 0.5, 0.45, "rgba(0,0,0,0.3)") + cover(28, 15.2, 26, 0.55) + panGear(g.L - 16, 15.2) + aerial(57, 15.2),
  more: (c, g) => ilMark(19.6, 4.35, 0.85, "#ffffff"),
});
export const hcMid = (c) => unit({ ...c, cabL: false, cabR: false }, { ...HC, sill: 3.2, trucks: { centers: 64.0, wb: 8.5, d: 36 }, drop: { a: 17.6, b: c.L - 17.6, y: 1.1 },
  rows: [{ xs: seq(28.25, 6.8, 4), y: 3.35, w: 5.8, h: 2.75, r: 0.45 }, { xs: seq(28.25, 6.8, 4), y: 10.4, w: 5.8, h: 2.5, r: 0.5 },
    { xs: [2.4, c.L - 8.8], y: 6.2, w: 6.4, h: 2.8, r: 0.45 }, { xs: [10.6, c.L - 14.6], y: 6.2, w: 3.6, h: 2.8, r: 0.45 }],
  doors: [hcDoor(19.6, 5.9, 2.4, 9.4), hcDoor(c.L - 25.5, 5.9, 2.4, 9.4)].map((d) => ({ ...d, step: false })),
  paint: (c, g) => hcBase(g.L, 5.0) + rect(0, 0, g.L, 2.4, IR.royal),
  ac: [[3, 10, 0.8, 15.2], [c.L - 13, 10, 0.8, 15.2]], gear: [[18.5, 4, 0.6, "b"], [c.L - 22.5, 4, 0.6, "b"], [3.6, 3.0, 1.0, "b"], [c.L - 6.6, 3.0, 1.0, "b"]],
  more: (c, g) => ilMark(g.L - 21.6, 7.6, 0.85, IR.royal) + cover(28, 15.2, 26, 0.35),
});

// --- Siemens Viaggio Light (2008-11): single-deck push-pull coaches for
// diesel haulage, 26.1 m bodies and 26.4 m over buffers, 4.35 m tall, 2.8 m
// wide; floor 1,030 mm, SF 300 trucks (2.5 m wheelbase, 920 mm wheels);
// doors 1.2 m wide and 1.9 m tall, one near each end a side; 160 km/h
// (en.wikipedia "Siemens Viaggio Light"). 87 cars in 2008-09 and 31 more in
// 2011: coaches 901-953 and, with wheelchair lifts and toilets, 825-849;
// driving cars 801-814, each with a diesel generator for the train's power.
// Due to go as the Desiro HS units ordered in 2024 arrive (Railway
// Gazette); in 2025-26 still photographed on the Acre-Karmiel line, at
// Beit She'an and at Bat Galim behind a Vossloh Euro. Livery, picked by a
// public vote in 2008: blue; a white wave along the side under the windows,
// sweeping up to the roof at one end of each coach; on the driving car
// a white swoosh rising from under the headlights; gray roof with the big
// air-conditioning housings at both ends.
const VL = { roof: 14.3, sill: 3.4, cornerR: 0.9, end: 0.6, trucks: { centers: 62.3, wb: 8.2, d: 36 }, diaphragm: [3.7, 12.4], badge: false, eave: 13.5 };
const vlDoor = (x) => ({ x, w: 3.9, y0: 3.6, y1: 9.9, leaves: 1, glassY: 0.55, glassH: 0.32, fill: "rgba(0,0,0,0.08)" });
const vlPaint = (L) => rect(0, 0, L, 17, IR.vl) + rect(0, 13.5, L, 3, "#8f969d") + rect(0, 13.45, L, 0.1, "#6f767e") + rect(0, 0, L, 4.1, IR.vlDeep) +
  path(`M0.6 13.4Q1.4 6.2 9.6 5.5L${L} 5.5L${L} 6.3L10.4 6.3Q3.0 7.0 2.6 13.4Z`, "#f4f5f7");
export const vlCoach = (c) => unit({ ...c, cabL: false, cabR: false }, { ...VL,
  rows: [{ xs: seq(10.6, 6.15, 11), y: 6.7, w: 4.6, h: 3.1, r: 0.4 }],
  doors: [vlDoor(4.0), vlDoor(c.L - 7.9)], paint: (c, g) => vlPaint(g.L),
  ac: [[3.0, 11, 0.9], [c.L - 14.0, 11, 0.9]],
  gear: [[17.5, 6, 1.2, "b"], [25.0, 5, 1.0, "t"], [52.0, 7, 1.3, "b"], [61.0, 5, 1.0, "b"]],
  more: (c, g) => ilMark(g.L / 2 + 1.0, 11.2, 0.7, "#ffffff") + buffers(0.6, -1, 3.0) + buffers(g.L - 0.6, 1, 3.0),
});
// The driving car: a rounded nose, the windshield's corners wrapped back,
// the cab door behind it, the generator's grille low on the side.
export const vlCab = (c) => unit({ ...c, cabL: true, cabR: false }, { ...VL,
  nose: [[1.2, 3.4], [0.7, 4.8], ["q", 0.5, 9.0, 1.4, 10.6], [3.0, 13.2], ["q", 3.8, 14.3, 5.8, 14.3]], cabLen: 8,
  rows: [{ xs: [17.8, ...seq(23.95, 6.15, 8)], y: 6.7, w: 4.6, h: 3.1, r: 0.4 }],
  doors: [vlDoor(11.4), vlDoor(c.L - 7.9)],
  paint: (c, g) => rect(0, 0, g.L, 17, IR.vl) + rect(0, 13.5, g.L, 3, "#8f969d") + rect(0, 13.45, g.L, 0.1, "#6f767e") + rect(0, 0, g.L, 4.1, IR.vlDeep) +
    path(`M0 4.4Q5.0 4.6 9.0 5.5L${g.L} 5.5L${g.L} 6.3L9.2 6.3Q4.6 5.4 0 5.4Z`, "#f4f5f7") + rect(0, 5.8, 1.2, 0.9, "#f4f5f7"),
  cabArt: () => path(poly([[1.45, 10.7], [3.0, 13.0], [6.4, 13.0], [6.4, 10.7]]), C.glass) + path(poly([[1.8, 11.0], [2.9, 12.6], [3.6, 12.6], [2.5, 11.0]]), C.glassLight) +
    win(7.4, 9.4, 1.5, 2.6, 0.3) + rect(7.2, 3.7, 2.0, 6.2, "rgba(0,0,0,0.06)", 0.5, 'rx="0.2"') + sign(3.3, 13.2, 2.4, 0.4) +
    rect(0.6, 6.0, 0.7, 0.55, "#f6f3dc", 0.4, 'rx="0.2"') + rect(0.65, 5.3, 0.55, 0.4, "#d0212e", 0.3, 'rx="0.1"') + line(1.8, 10.9, 2.8, 12.6, "#0b0d0f", 0.8),
  front: { coupler: [0, 3.0], skirt: [[1.2, 3.4], [1.5, 1.6], [6.0, 1.6], [6.4, 3.4]], horn: [6.0, 14.3] },
  ac: [[17.0, 11, 0.9], [c.L - 14.0, 11, 0.9]],
  gear: [[17.5, 11, 1.6, "g"], [30.0, 6, 1.2, "b"], [52.0, 7, 1.3, "b"], [61.0, 5, 1.0, "t"]],
  more: (c, g) => ilMark(33.0, 11.2, 0.7, "#ffffff") + exhaust(26, 14.3) + buffers(0.4, -1, 3.0) + buffers(g.L - 0.6, 1, 3.0),
});

export const TYPES = {
  ilTraxx: { name: "TRAXX P160 AC3 electric locomotive", kind: "electric", pan: true },
  ilJt42: { name: "JT42BW diesel locomotive", kind: "diesel" },
  ilEuro3200: { name: "Vossloh Euro 3200 diesel locomotive", kind: "diesel" },
  ilEuro4000: { name: "Vossloh Euro 4000 diesel locomotive", kind: "diesel" },
  ilDd: { name: "Bombardier double-deck coach", kind: "bilevel" },
  ilDdCab: { name: "Bombardier double-deck driving trailer", kind: "bilevel", cab: true },
  ilHcCab: { name: "Desiro HC motor car", kind: "emu", pan: true },
  ilHc: { name: "Desiro HC double-deck car", kind: "bilevel", emu: true },
  ilVl: { name: "Siemens Viaggio Light coach", kind: "coach" },
  ilVlCab: { name: "Siemens Viaggio Light driving car", kind: "coach", cab: true },
};
// oneEnd: single-cab equipment, drawn cab-left and mirrored at the back of a train.
const M = (draw, len, oneEnd = false) => ({ draw, len, oneEnd, variant: null });
export const MODELS = {
  ilTraxx: M(traxx, 62.0), ilJt42: M(jt42, 66.0, true),
  ilEuro3200: M(euro3200, 68.9), ilEuro4000: M(euro4000, 75.5),
  ilDd: M(ddCoach, 87.9), ilDdCab: M(ddCab, 89.0, true),
  ilHcCab: M(hcCab, 86.0, true), ilHc: M(hcMid, 82.7),
  ilVl: M(vlCoach, 86.6), ilVlCab: M(vlCab, 86.6, true),
};
// Locomotive and car numbers, for the fleet roster (the feed names trains,
// not vehicles): en.wikipedia "Israel Railways" rolling stock tables, the
// TRAXX numbers from photographs (3001, 3002, 3007).
export const FLEETS = {
  israelrail: [[3001, 3062, "ilTraxx"], [731, 778, "ilJt42"], [1301, 1324, "ilEuro3200"], [1401, 1414, "ilEuro4000"],
    [401, 424, "ilDdCab"], [501, 507, "ilDdCab"], [425, 490, "ilDd"], [521, 538, "ilDd"], [2201, 2394, "ilDd"],
    [801, 814, "ilVlCab"], [825, 849, "ilVl"], [901, 953, "ilVl"]],
};

const set = (label, ...units) => ({ label, units });
// What runs where depends first on the wires. Electrified by October 2026
// (he.wikipedia "Electrification of Israel Railways", revision of 26
// September 2026): the coast line from Zikhron Ya'akov to Ashkelon, the
// Jerusalem and Modi'in lines, Lod-Rehovot, the Sharon line through Rosh
// HaAyin North, and Ashkelon-Ofakim-Be'er Sheva (electric trains since 27
// March 2026). Not yet: north of Zikhron Ya'akov to Haifa, Nahariya and
// Karmiel, the Jezreel Valley line, the eastern railway from Hadera, the
// line through Kiryat Gat to Be'er Sheva, Dimona and Beit Shemesh. A train
// calling anywhere off the wires runs behind a diesel. The stops come from
// the train's run when the page has it, else its line's name.
const OFF_WIRE = /^(Haifa|Nahariya|Karmiel|Atlit|Beit She'an|Dimona|Beit Shemesh|Akko|Ahihud|Kiryat (Motzkin|Haim|Gat|Malakhi)|Hutzot HaMifratz|HaMifrats|Bat Galim|Carmel Beach|Kfar (Yehoshua|Barukh)|Afula|Lehavim|Mazkeret Batya|Ramla|Hadera East|Shomron|Tira)/;
// The Jezreel Valley and Karmiel lines: photographed with Viaggio Light
// sets, the only lines where those are seen in 2024-26.
const VIAGGIO = /Karmiel – Haifa|Beit She'an|Haifa – Atlit/;
// The busiest electric lines, the Jerusalem and Modi'in lines and the
// Sharon line through Herzliya and Rosh HaAyin, are the Desiro HCs'.
const DESIRO = /^(Herzliya – (Jerusalem|Ben Gurion Airport|Rishon LeZion|Yavne|Tel Aviv|Ashdod|Ashkelon)|Modi'in – Jerusalem|Tel Aviv – (Modi'in|Jerusalem|Yavne)|Netanya – (Rehovot|Tel Aviv)|Lod – Rishonim)$/;
const DD_SET = (loco, n) => [[loco, 1], ["ilDd", n], ["ilDdCab", 1]];
export const TYPICAL = {
  israelrail: (t) => {
    const route = t.route || "", ends = route.split(" – ");
    const names = (t.stops || []).map((s) => s.name).filter(Boolean);
    const diesel = names.length ? names.some((n) => OFF_WIRE.test(n)) : ends.some((e) => OFF_WIRE.test(e)) || /^(Tel Aviv – Be'er Sheva|Hadera – Rosh HaAyin)$/.test(route);
    if (diesel) {
      if (VIAGGIO.test(route)) return set("Vossloh Euro 3200 diesel with Siemens Viaggio Light single-deck coaches, 7 cars shown (sets run 6 to 9; double-deck sets run here too)",
        ["ilEuro3200", 1], ["ilVl", 5], ["ilVlCab", 1]);
      if (/Dimona|Hadera – Rosh HaAyin/.test(route)) return set("JT42BW diesel with Bombardier double-deck coaches, a short set (4 cars shown)", ...DD_SET("ilJt42", 2));
      return set("JT42BW diesel with Bombardier double-deck coaches and a driving trailer, 6 cars shown (sets run 4 to 9; some trains a Vossloh Euro diesel)", ...DD_SET("ilJt42", 4));
    }
    if (DESIRO.test(route)) return set("Siemens Desiro HC six-car unit (some four-car, or two coupled; some trains a TRAXX with double-deck coaches)", ["ilHcCab", 1], ["ilHc", 4], ["ilHcCab", 1]);
    return set("TRAXX electric with Bombardier double-deck coaches and a driving trailer, 6 cars shown (sets run 4 to 9; some trains a Desiro HC)", ...DD_SET("ilTraxx", 4));
  },
};

// Facts come in km/h and kW; the page converts them back for display.
const kmh = (v) => Math.round((v / 1.609344) * 10) / 10, kw = (v) => Math.round(v / 0.7457);
const WP = "https://en.wikipedia.org/wiki/";
export const FACTS = {
  ilTraxx: { model: "Bombardier TRAXX P160 AC3", type: "Electric locomotive", builder: "Bombardier (now Alstom)", built: "2017 on",
    fleet: "62 (3001 up)", topSpeedMph: kmh(160), powerHp: kw(6000), lengthFt: 62.0,
    about: "Israel Railways' first electric locomotives, bought for the 25 kV network that has been spreading out from the Tel Aviv–Jerusalem line since 2018. They haul push-pull sets of double-deck coaches.", source: `${WP}Bombardier_TRAXX` },
  ilJt42: { model: "Alstom/EMD JT42BW", type: "Diesel-electric locomotive", builder: "Alstom, with EMD", fleet: "48 (731–778)",
    topSpeedMph: kmh(140),
    about: "The most numerous of Israel Railways' diesel locomotives, hauling double-deck sets on the lines not yet wired: north of Zikhron Ya'akov to Haifa, Nahariya and Karmiel, through Kiryat Gat to Be'er Sheva, and to Dimona and Beit Shemesh.", source: `${WP}Israel_Railways` },
  ilEuro3200: { model: "Vossloh Euro 3200 (Euro 3000 AC)", type: "Diesel-electric locomotive", builder: "Vossloh España (now Stadler), Valencia", built: "2012–2013",
    fleet: "24 (1301–1324)", topSpeedMph: kmh(160), powerHp: kw(2454), lengthFt: 68.9,
    about: "Four-axle diesels bought for push-pull trains, working with both the double-deck coaches and the Siemens Viaggio Light sets on the lines not yet wired.", source: `${WP}Stadler_Euro` },
  ilEuro4000: { model: "Vossloh Euro 4000", type: "Diesel-electric locomotive", builder: "Vossloh España (now Stadler), Valencia", built: "2011",
    fleet: "14 (1401–1414)", topSpeedMph: kmh(160), powerHp: kw(3178), lengthFt: 75.5,
    about: "Six-axle diesels bought to haul passenger trains first and freight later; they still turn up at the head of double-deck sets.", source: `${WP}Stadler_Euro` },
  ilDd: { model: "Bombardier double-deck coach", type: "Double-deck coach", builder: "Bombardier (now Alstom), Görlitz", built: "2001–2021",
    fleet: "About 580 in service (2024)", topSpeedMph: kmh(160), lengthFt: 87.9,
    about: "The backbone of Israel Railways' fleet: push-pull double-deck coaches bought batch after batch over twenty years, the 2014 batch the first able to run under the wires and the 2019 batch for electric haulage only. 96 more were ordered from Alstom in 2024 for eight-car sets.", source: `${WP}Bombardier_Double-deck_Coach` },
  ilDdCab: { model: "Bombardier double-deck driving trailer", type: "Double-deck driving trailer", builder: "Bombardier (now Alstom), Görlitz", built: "2001–2021",
    fleet: "First generation 401–424 and 501–507, and later batches", topSpeedMph: kmh(160), lengthFt: 89.0,
    about: "The cab car at the far end of a double-deck set from its locomotive, with a diesel generator behind the cab that powers the train's lights and air conditioning.", source: `${WP}Bombardier_Double-deck_Coach` },
  ilHcCab: { model: "Siemens Desiro HC", type: "Electric multiple unit", builder: "Siemens Mobility", built: "2020 on", fleet: "About 60 units (most six cars); 81 more on order",
    topSpeedMph: kmh(160), powerHp: kw(4800), lengthFt: 86.0,
    about: "Electric units with a single-deck motor car at each end and double-deck cars between, ordered in 2017 with a depot in Ashkelon; the first arrived in November 2020. A six-car unit is about 157 m long.", source: `${WP}Siemens_Desiro_HC` },
  ilHc: { model: "Siemens Desiro HC double-deck car", type: "Electric multiple unit", builder: "Siemens Mobility", built: "2020 on", fleet: "About 60 units (most six cars)",
    topSpeedMph: kmh(160), lengthFt: 82.7, about: "A double-deck middle car of the Desiro HC, unpowered, between its single-deck motor cars; its doors open at platform height onto the lower deck.", source: `${WP}Siemens_Desiro_HC` },
  ilVl: { model: "Siemens Viaggio Light", type: "Coach", builder: "Siemens Mobility, Vienna", built: "2008–2011", fleet: "Coaches 901–953 and 825–849",
    topSpeedMph: kmh(160), seats: 82, lengthFt: 86.6,
    about: "Single-deck push-pull coaches in a blue livery chosen by a public vote, hauled by JT42BW and Vossloh Euro diesels. They are to be retired as the Desiro HS units ordered in 2024 arrive.", source: `${WP}Siemens_Viaggio_Light` },
  ilVlCab: { model: "Siemens Viaggio Light driving car", type: "Driving car", builder: "Siemens Mobility, Vienna", built: "2008–2011", fleet: "801–814",
    topSpeedMph: kmh(160), seats: 27, lengthFt: 86.6,
    about: "The cab car of a Viaggio Light set, with a diesel generator that powers the train's lights and air conditioning.", source: `${WP}Siemens_Viaggio_Light` },
};
