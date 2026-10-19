// FGC's cars (scripts/railroads/fgc.py): the Barcelona-Vallès units (series
// 112-115), the Llobregat-Anoia 213s and the Lleida-La Pobla GTWs. Geotren
// names each train's series ("113", or "213x2" for two coupled), which the
// parser passes on as t.series, so a live train is drawn as its own series;
// the rest is what usually runs on the line. Trainsheet's own side views,
// from published dimensions and photographs; the lettering and emblem are
// drawn here, not copied.
import { newId, bilevel } from "../carmodels.js?v=dev";
import { C, rect, path, line, lines, poly, win, truck, pantograph, slats } from "../carart.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);

// Pale silver over white, the windows in black with a thin orange line
// under them, orange doors (red on the Llobregat-Anoia's 213s); black cab
// fronts, the glass wrapping onto the side.
const FGC = { white: "#f3f4f5", silver: "#dfe2e5", band: "#1b1d20", orange: "#f39200", red: "#d7261e", roof: "#a9afb6", skirt: "#3a3e44" };

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
// FGC's emblem as carried on the cab sides: an orange square with the
// initials in white (drawn here, not the logo itself).
const fgcMark = (c, x, y, h, fill = FGC.orange) => rect(x - h / 2, y - h / 2, h, h, fill, 0, 'rx="0.12"') + letters(c, x, y - h * 0.04, h * 0.42, "FGC", "#ffffff", { weight: 800 });

function fgcPaint(L, { accent = FGC.orange, cab = false, band = [6.6, 3.4], roof = 12.0, skirt = 3.5, silver = true, mask = 5.0 } = {}) {
  let s = rect(0, 0, L, 17, FGC.white) + (silver ? rect(0, band[0] + band[1], L, 3, FGC.silver) : "") + rect(0, roof, L, 3, FGC.roof) + rect(0, roof - 0.1, L, 0.12, "#848a91") + rect(0, 0, L, skirt, FGC.skirt);
  s += rect(0, band[0], L, band[1], FGC.band) + rect(0, band[0] - 0.42, L, 0.26, accent) + rect(0, skirt + 0.5, L, 0.12, "#9aa0a7");
  if (cab) s += path(`M0 ${skirt}L2.4 ${skirt}L2.4 ${band[0] - 0.6}Q${mask - 0.6} ${band[0] - 0.4} ${mask} ${band[0]}L${mask} ${band[0] + band[1] + 0.4}Q${mask - 0.8} ${roof} 2.6 ${roof}L0 ${roof}Z`, FGC.band) +
    rect(0, skirt, 2.4, 1.0, "#2d3035");
  return s;
}
const fgcDoor = (x, fill = FGC.orange, w = 4.3) => ({ x, w, y0: 3.6, y1: 10.8, leaves: 2, glassY: 0.45, glassH: 0.42, fill });
const crewDoor = (x) => ({ x, w: 2.0, y0: 3.8, y1: 10.6, glassY: 0.55, glassH: 0.3, grabs: false, fill: "rgba(0,0,0,0.06)" });
// A flat-fronted cab seen from the side: the windshield's edge and the
// driver's side window, a destination sign over the glass.
const flatCab = (top) => () => path(poly([[0.7, 7.2], [1.1, top], [3.6, top], [3.6, 7.2]]), C.glass) + path(poly([[1.0, 7.5], [1.3, top - 0.6], [1.9, top - 0.6], [1.6, 7.5]]), "rgba(255,255,255,0.1)") + sign(1.2, top - 0.55, 2.2, 0.4);

// --- Series 112 (CAF, GEC-Alsthom and ABB, 1995-2002): 22 four-car units
// (motor-cab, motor, trailer, motor-cab), 79.52 m, 2,160 kW, 90 km/h; the
// first "Metro del Vallès" trains, now refurbished. Three pairs of sliding
// doors a side on each car.
// --- Series 113 and 114 (Alstom and CAF, 2013-14): 19 four-car 113s and
// five three-car 114s for the L7, whose tunnel to Avinguda Tibidabo takes
// only three cars. The same three doors a side, a gangway through.
// --- Series 115 (Stadler, Valencia, 2021-22): 15 four-car aluminium units,
// about 80 m, 90 km/h, able to run with the 113s and 114s.
// Drawn on one body (the 112s plain white above the windows, the 113s to
// 115s pale silver, the 115's black front reaching further back): a cab end
// in black, a crew door behind it, the windows
// in the black band between the doors; air-conditioning at both ends of
// each roof, the pantograph on the cab car, the traction gear under the
// floor; the emblem behind the cab.
const BV = { roof: 12.6, sill: 3.5, cornerR: 1.0, end: 0.6, trucks: { centers: 45, wb: 7.9, d: 33 }, diaphragm: [3.8, 11.6], badge: false };
const bvFront = { lamp: [0.75, 5.2], coupler: [0, 2.85], skirt: [[0.8, 3.5], [1.0, 1.5], [4.6, 1.5], [5.0, 3.5]], horn: [4.4, 12.6], wiper: [1.1, 7.5, 2.0, 10.2] };
const bvCab = ({ nose, ac, silver = true, mask = 5.0 }) => (c) => unit({ ...c, cabL: true, cabR: false }, { ...BV, nose,
  rows: [{ xs: [8.4, 20.2, 24.8, 38.2, 42.8, 56.0, 60.6], y: 6.8, w: 3.9, h: 3.0, r: 0.3 }],
  doors: [crewDoor(5.0), fgcDoor(13.6), fgcDoor(31.6), fgcDoor(49.4)], cabLen: 4, ac,
  paint: (c, g) => fgcPaint(g.L, { cab: true, silver, mask }) + fgcMark(c, 29.6, 5.0, 1.0) + letters(c, 42.7, 5.0, 0.55, "Generalitat de Catalunya", "#5c636b", { weight: 500 }),
  cabArt: flatCab(11.0), front: bvFront,
  gear: [[17, 7, 1.4, "g"], [24.6, 5, 1.2, "b"], [30.4, 6, 1.3, "g"], [37, 5, 1.0, "t"], [43, 4, 1.1, "b"]],
  onRoof: (c, g) => panGear(g.L - 11, 12.6) + cover(26, 12.6, 14, 0.5),
});
const bvMid = ({ ac, silver = true }) => (c) => unit({ ...c, cabL: false, cabR: false }, { ...BV,
  rows: [{ xs: [2.2, 15.6, 20.2, 33.6, 38.2, 51.6, 56.2], y: 6.8, w: 3.9, h: 3.0, r: 0.3 }], ac,
  doors: [fgcDoor(9.0), fgcDoor(27.0), fgcDoor(45.0)],
  paint: (c, g) => fgcPaint(g.L, { silver }) + fgcMark(c, 25.0, 5.0, 1.0),
  gear: [[15, 7, 1.4, "g"], [22.6, 4, 1.2, "b"], [32, 6, 1.0, "t"], [39, 6, 1.3, "g"]],
  onRoof: (c, g) => cover(24, 12.6, 16, 0.45) + aerial(42, 12.6),
});
const BLUNT = [[0.8, 3.5], [0.7, 9.8], ["q", 0.8, 11.8, 2.0, 12.4], ["q", 2.8, 12.6, 4.2, 12.6]];
const ROUND = [[1.0, 3.5], [0.6, 4.6], ["q", 0.4, 9.4, 1.6, 11.4], ["q", 2.6, 12.6, 4.8, 12.6]];
export const fgc112Cab = bvCab({ nose: BLUNT, ac: [[6, 9, 0.6], [44, 9, 0.6]], silver: false, mask: 3.4 });
export const fgc112 = bvMid({ ac: [[5, 9, 0.6], [44, 9, 0.6]], silver: false });
export const fgc113Cab = bvCab({ nose: ROUND, ac: [[8, 12, 0.7], [44, 12, 0.7]] });
export const fgc113 = bvMid({ ac: [[5, 12, 0.7], [44, 12, 0.7]] });
export const fgc115Cab = bvCab({ nose: [[1.1, 3.5], [0.6, 4.8], ["q", 0.6, 8.8, 2.0, 11.2], ["q", 3.0, 12.6, 5.6, 12.6]], ac: [[9, 14, 0.75], [42, 14, 0.75]], mask: 6.2 });
export const fgc115 = bvMid({ ac: [[5, 14, 0.75], [42, 14, 0.75]] });

// --- Series 213 (MTM, Meinfesa, CAF and Adtranz, 1998-2009): 42
// three-car metre-gauge units on the Llobregat-Anoia line, a motor car
// with a cab at each end (two doors a side, a pantograph) and a trailer
// (three doors a side), 1,440 kW, 90 km/h; two coupled at most. Red where
// the Barcelona-Vallès units have orange.
const LA = { roof: 12.2, sill: 3.4, cornerR: 1.0, end: 0.6, trucks: { centers: 43, wb: 7.2, d: 30 }, diaphragm: [3.6, 11.2], badge: false };
export const fgc213Cab = (c) => unit({ ...c, cabL: true, cabR: false }, { ...LA,
  nose: [[0.8, 3.4], [0.7, 9.6], ["q", 0.8, 11.5, 1.9, 12.0], ["q", 2.7, 12.2, 4.0, 12.2]],
  rows: [{ xs: [7.6, 22.0, 26.6, 31.2, 35.8, 49.6, 54.2, 58.8], y: 6.7, w: 3.9, h: 2.9, r: 0.3 }],
  doors: [crewDoor(4.4), fgcDoor(13.8, FGC.red), fgcDoor(41.0, FGC.red)], cabLen: 4,
  ac: [[20, 14, 0.6]],
  paint: (c, g) => fgcPaint(g.L, { accent: FGC.red, cab: true, band: [6.5, 3.3], roof: 11.6, skirt: 3.4 }) + fgcMark(c, 29.0, 4.9, 0.95, FGC.red),
  cabArt: flatCab(10.8), front: { ...bvFront, skirt: [[0.8, 3.4], [1.0, 1.4], [4.4, 1.4], [4.8, 3.4]], horn: [4.2, 12.2] },
  gear: [[16, 8, 1.4, "g"], [25, 6, 1.2, "b"], [32, 6, 1.4, "g"], [39, 5, 1.0, "t"]],
  onRoof: (c, g) => panGear(g.L - 10, 12.2),
});
export const fgc213 = (c) => unit({ ...c, cabL: false, cabR: false }, { ...LA,
  rows: [{ xs: [2.2, 15.4, 20.0, 33.0, 37.6, 51.0, 55.6], y: 6.7, w: 3.9, h: 2.9, r: 0.3 }],
  doors: [fgcDoor(8.6, FGC.red), fgcDoor(26.4, FGC.red), fgcDoor(44.6, FGC.red)],
  ac: [[3, 9, 0.6], [50, 9, 0.6]],
  paint: (c, g) => fgcPaint(g.L, { accent: FGC.red, band: [6.5, 3.3], roof: 11.6, skirt: 3.4 }),
  gear: [[14, 6, 1.2, "b"], [21, 5, 1.0, "t"], [32, 6, 1.2, "b"], [39, 5, 1.0]],
  onRoof: (c, g) => aerial(30, 12.2),
});

// --- Series 331 (Stadler GTW 2/6, 2016): the Lleida-La Pobla de Segur
// line's diesel railcars, two low-floor passenger sections hung from a
// short power module, 960 kW, 120 km/h; 88 seats. Drawn on the GTW's
// geometry: white, the nose black, the black running back from it in a
// curve that rises under the windows; orange doors; the emblem behind the
// cab; air-conditioning on the roof.
export const fgc331Car = (c) => unit({ ...c, cabL: true, cabR: false }, {
  roof: 12.8, sill: 2.4, cornerR: 1.0, end: 0.6, noTrucks: true, badge: false, diaphragm: [2.6, 11.2], cabLen: 6,
  nose: [[1.0, 2.4], [1.0, 5.6], ["q", 1.1, 6.8, 1.8, 7.8], [3.6, 11.9], ["q", 4.2, 12.8, 5.6, 12.8]],
  rows: [{ xs: [11.6, 16.8, 30.2, 35.9, 41.5, 47.2, 52.8], y: 5.6, w: 4.3, h: 3.8, r: 0.45 }],
  doors: [fgcDoor(23.0, FGC.orange, 5.2)].map((d) => ({ ...d, y0: 2.1, y1: 9.6, glassY: 0.3, glassH: 0.55, step: false })),
  ac: [[13, 9, 0.7], [37, 10, 0.7]],
  paint: (c, g) => {
    const L = g.L;
    let s = rect(0, 0, L, 17, FGC.white) + rect(0, 11.8, L, 3, FGC.roof) + rect(0, 11.7, L, 0.12, "#848a91") + rect(0, 0, L, 2.6, FGC.skirt);
    s += path(`M0 2.6L0 12.8L4.2 12.8Q6.8 9.6 10.2 9.6L${L} 9.6L${L} 5.2L12.0 5.2Q8.0 5.2 6.4 3.6Q5.4 2.6 3.6 2.6Z`, FGC.band);
    return s + rect(10.6, 4.75, L - 10.6, 0.26, FGC.orange) + fgcMark(c, 8.2, 3.9, 0.9);
  },
  cabArt: () => path(poly([[1.7, 7.9], [3.4, 11.2], [4.5, 11.2], [4.5, 7.9]]), C.glass) + win(5.6, 6.0, 4.2, 3.4, 0.5) + sign(4.6, 11.5, 2.8, 0.42),
  front: { lamp: [1.05, 4.0], coupler: [0, 2.3], horn: [6.0, 12.8], wiper: [2.0, 8.1, 3.0, 10.6] },
  onRoof: (c, g) => cover(24, 12.8, 10, 0.45) + aerial(49, 12.8),
  more: () => truck(9.2, { wb: 6.9, d: 30, top: 2.4 }) + fairing(14.0, 22.4, 2.4, 0.7, "#4a4f56") + fairing(28.8, 56.0, 2.4, 0.7, "#4a4f56") +
    sign(28.6, 10.0, 2.6, 0.42) + lines([[10.2, 2.6, 10.2, 11.6]], "rgba(255,255,255,0.18)", 0.45),
});
export function fgc331Power(c) {
  // The power module: a short, tall box on its own truck, louvered sides
  // around the gangway through it, the radiators and exhausts on the roof,
  // the engine and fuel tank under the floor.
  return unit({ ...c, cabL: false, cabR: false }, {
    roof: 13.4, sill: 3.4, cornerR: 0.6, end: 0.4, noTrucks: true, badge: false, diaphragm: [3.6, 11.6], eave: false,
    paint: (c, g) => fgcPaint(g.L, { band: [6.2, 4.0], roof: 12.2, skirt: 4.0, silver: false }),
    gear: [[1.0, 2.2, 1.6, "g"], [13.2, 2.2, 1.6, "t"]],
    more: (c, g) => truck(g.L / 2, { wb: 7.2, d: 33, kind: "loco", top: 3.4 }) +
      grille(2.0, 6.2, g.L - 4.0, 4.0, 0.35) + lines([[g.L / 2, 6.2, g.L / 2, 10.2]], "rgba(255,255,255,0.3)", 0.6) +
      cover(1.5, 13.4, g.L - 3, 0.8) + slats(2.0, 13.5, g.L - 4, 0.6, 0.45, "rgba(0,0,0,0.3)") + exhaust(5.4, 14.15) + exhaust(9.4, 14.15),
  });
}

export const TYPES = {
  fgc112Cab: { name: "Series 112 motor-cab car", kind: "emu", pan: true },
  fgc112: { name: "Series 112 car", kind: "emu" },
  fgc113Cab: { name: "Series 113/114 cab car", kind: "emu", pan: true },
  fgc113: { name: "Series 113/114 car", kind: "emu" },
  fgc115Cab: { name: "Series 115 cab car", kind: "emu", pan: true },
  fgc115: { name: "Series 115 car", kind: "emu" },
  fgc213Cab: { name: "Series 213 motor car", kind: "emu", pan: true },
  fgc213: { name: "Series 213 trailer", kind: "emu" },
  fgc331Car: { name: "Stadler GTW passenger section", kind: "emu" },
  fgc331Power: { name: "Stadler GTW power module", kind: "module" },
};
// oneEnd: single-cab equipment, drawn cab-left and mirrored at the back of a train.
const M = (draw, len, oneEnd = false) => ({ draw, len, oneEnd, variant: null });
export const MODELS = {
  fgc112Cab: M(fgc112Cab, 66.9, true), fgc112: M(fgc112, 63.5),
  fgc113Cab: M(fgc113Cab, 66.9, true), fgc113: M(fgc113, 63.5),
  fgc115Cab: M(fgc115Cab, 67.3, true), fgc115: M(fgc115, 63.9),
  fgc213Cab: M(fgc213Cab, 65.0, true), fgc213: M(fgc213, 63.0),
  fgc331Car: M(fgc331Car, 58.85, true), fgc331Power: M(fgc331Power, 16.4),
};
// Unit numbers as FGC writes them (112.01 is unit 11201 here): 112.01-22,
// 113.01-19, 114.01-05, 115.01-15, 213.01-42, 331.01-02.
export const FLEETS = {
  fgc: [[11201, 11222, "fgc112Cab"], [11301, 11319, "fgc113Cab"], [11401, 11405, "fgc113Cab"], [11501, 11515, "fgc115Cab"],
    [21301, 21342, "fgc213Cab"], [33101, 33102, "fgc331Car"]],
};

const set = (label, ...units) => ({ label, units });
const four = (s, name) => set(`Series ${name} four-car unit`, [`fgc${s}Cab`, 1], [`fgc${s}`, 2], [`fgc${s}Cab`, 1]);
const SERIES = {
  112: four(112, "112"), 113: four(113, "113"), 115: four(115, "115"),
  114: set("Series 114 three-car unit", ["fgc113Cab", 1], ["fgc113", 1], ["fgc113Cab", 1]),
  213: set("Series 213 three-car unit", ["fgc213Cab", 1], ["fgc213", 1], ["fgc213Cab", 1]),
};
const LLOBREGAT = /^(L8|S3|S4|S8|S9|R5\d?|R6\d?)$/;
export const TYPICAL = {
  fgc: (t, reported) => {
    // Geotren's series, "213x2" for two units coupled.
    const m = /^(\d{3})(?:x(\d))?$/.exec(t.series || "");
    if (m && SERIES[m[1]]) {
      const one = SERIES[m[1]], n = Number(m[2] || 1);
      return n > 1 ? { label: `${one.label}s, ${n} coupled (as Geotren reports)`, units: Array.from({ length: n }, () => one.units).flat() }
        : { label: `${one.label} (as Geotren reports)`, units: one.units };
    }
    if (reported === "fgc331Car" || /^RL\d/.test(t.route || "")) return set("Stadler GTW diesel railcar", ["fgc331Car", 1], ["fgc331Power", 1], ["fgc331Car", 1]);
    if (reported === "fgc213Cab" || LLOBREGAT.test(t.route || "")) return set("Series 213 three-car unit, sometimes two coupled", ...SERIES[213].units);
    if (reported === "fgc112Cab") return SERIES[112];
    if (reported === "fgc115Cab") return SERIES[115];
    if (t.route === "L7") return set("Series 114 three-car unit (the L7 takes three cars)", ...SERIES[114].units);
    return set("Series 112, 113 or 115 four-car unit", ...SERIES[113].units);
  },
};

// Facts come in km/h and kW; the page converts them back for display.
const kmh = (v) => Math.round((v / 1.609344) * 10) / 10, kw = (v) => Math.round(v / 0.7457);
const CA = "https://ca.wikipedia.org/wiki/";
export const FACTS = {
  fgc112Cab: { model: "FGC Series 112", type: "Electric multiple unit", builder: "CAF, GEC-Alsthom and ABB", built: "1995–2002", fleet: "22 four-car units",
    topSpeedMph: kmh(90), powerHp: kw(2160), seats: 232, lengthFt: 66.9,
    about: "The units that began the Metro del Vallès's frequent service, now being refurbished to run another fifteen years. Seats are for the whole four-car unit.", source: `${CA}Sèrie_112_de_FGC` },
  fgc112: { model: "FGC Series 112 middle car", type: "Electric multiple unit", builder: "CAF, GEC-Alsthom and ABB", built: "1995–2002", fleet: "22 four-car units",
    topSpeedMph: kmh(90), lengthFt: 63.5, about: "A middle car of a Series 112 unit, a motor car or the trailer.", source: `${CA}Sèrie_112_de_FGC` },
  fgc113Cab: { model: "FGC Series 113 and 114", type: "Electric multiple unit", builder: "Alstom and CAF", built: "2013–2014", fleet: "19 four-car 113s, 5 three-car 114s",
    topSpeedMph: kmh(90),
    about: "The third generation of Barcelona-Vallès units, with a gangway through the train. The three-car 114s run the L7, whose tunnel stations take only three cars.", source: `${CA}Sèrie_113_de_FGC` },
  fgc113: { model: "FGC Series 113 and 114 middle car", type: "Electric multiple unit", builder: "Alstom and CAF", built: "2013–2014", fleet: "19 four-car 113s, 5 three-car 114s",
    topSpeedMph: kmh(90), about: "A middle car of a 113 or 114; a 113's center trailer can be taken out to make three cars.", source: `${CA}Sèrie_113_de_FGC` },
  fgc115Cab: { model: "FGC Series 115", type: "Electric multiple unit", builder: "Stadler (Valencia)", built: "2021–2022", fleet: "15 four-car units",
    topSpeedMph: kmh(90),
    about: "Aluminium-bodied units bought for more frequent S1 and S2 trains after the lines reached central Terrassa and Sabadell. They can run coupled to the 113s and 114s.", source: `${CA}Sèrie_115_de_FGC` },
  fgc115: { model: "FGC Series 115 middle car", type: "Electric multiple unit", builder: "Stadler (Valencia)", built: "2021–2022", fleet: "15 four-car units",
    topSpeedMph: kmh(90), about: "A middle car of a Series 115; the unit is two mirror-image halves.", source: `${CA}Sèrie_115_de_FGC` },
  fgc213Cab: { model: "FGC Series 213", type: "Electric multiple unit (metre gauge)", builder: "MTM, Meinfesa, CAF and Adtranz", built: "1998–2009", fleet: "42 three-car units",
    topSpeedMph: kmh(90), powerHp: kw(1440), seats: 48,
    about: "Since 2009 the only passenger trains on the Llobregat-Anoia line, to Manresa, Igualada and the Baix Llobregat; a metre-gauge version of the Series 112. Two units can run coupled.", source: `${CA}Sèrie_213_de_FGC` },
  fgc213: { model: "FGC Series 213 trailer", type: "Electric multiple unit (metre gauge)", builder: "MTM, Meinfesa, CAF and Adtranz", built: "1998–2009", fleet: "42 three-car units",
    topSpeedMph: kmh(90), seats: 36, about: "The middle car of a 213, with three doors a side, one of them step-free.", source: `${CA}Sèrie_213_de_FGC` },
  fgc331Car: { model: "Stadler GTW 2/6 (Series 331)", type: "Diesel multiple unit", builder: "Stadler Rail", built: "2016", fleet: "2",
    topSpeedMph: kmh(120), powerHp: kw(960), seats: 88,
    about: "The Lleida–La Pobla de Segur line's railcars, in service since July 2016: two low-floor passenger sections either side of a short power module.", source: `${CA}Sèrie_331_de_FGC` },
  fgc331Power: { model: "Stadler GTW power module", type: "Power module", builder: "Stadler Rail", built: "2016", fleet: "2",
    topSpeedMph: kmh(120), powerHp: kw(960), about: "The GTW's engine room, which the passengers walk through between its two sections.", source: `${CA}Sèrie_331_de_FGC` },
};
