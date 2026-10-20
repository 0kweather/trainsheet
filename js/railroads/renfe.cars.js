// Renfe's cars (scripts/railroads/renfe.py), for both its agencies: the
// AVE, Avlo, Alvia, Avant and Media Distancia fleets (renfe) and Cercanías
// and Rodalies (cercanias). Neither feed names the train's units (vehicle.id
// is the train number), so every train is drawn as what usually runs on its
// service or line. Trainsheet's own side views, from published dimensions
// and photographs; the lettering and emblems are drawn here, not copied.
import { newId, bilevel } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, poly, win, door, truck, pantograph, slats, bodyOutline } from "../carart.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);

// Renfe's white with an orange line over an aubergine stripe (long distance
// and Media Distancia; the AVEs' line gray), the windows in a dark gray
// band; Avlo's magenta with orange, turquoise and white; Cercanías white and
// red; Rodalies orange; FEVE's white, navy and yellow on the metre gauge.
const RF = { white: "#f1f2f3", roof: "#b9bec4", band: "#2a2e33", purple: "#6e2050", word: "#7b1f5f", orange: "#ef8a1c", skirt: "#3a3e44", fair: "#5d636a",
  avlo: "#9c1d8f", avloDark: "#6a1462", teal: "#57c7bb", red: "#d8102b", rod: "#ee7d1e",
  feveBlue: "#1f3a8c", feveYellow: "#f2c018", cream: "#efe9da", magenta: "#a2195f" };

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
// Renfe's name as lettered on its trains, lowercase in aubergine (white on
// Avlo's purple).
const renfeWord = (c, x, y, h, fill = RF.word) => letters(c, x, y, h, "renfe", fill, { weight: 700, spacing: -0.02 });
// Cercanías' emblem: a red disc with a white ring open at one side, and
// Rodalies': an orange square with a white R (both drawn here).
const cerMark = (x, y, r) => circle(x, y, r, RF.red) + path(`M${x + r * 0.55} ${y + r * 0.3}A${r * 0.6} ${r * 0.6} 0 1 0 ${x + r * 0.55} ${y - r * 0.3}`, "none", 0, `stroke="#ffffff" stroke-width="${(r * 0.28).toFixed(2)}" stroke-linecap="round"`);
const rodMark = (c, x, y, h) => rect(x - h / 2, y - h / 2, h, h, RF.rod, 0, 'rx="0.12"') + letters(c, x, y - h * 0.05, h * 0.8, "R", "#ffffff", { weight: 800 });

// A band of paint following a line of points (its top edge), w deep.
const ribbon = (pts, w, fill) => path(poly([...pts, ...[...pts].reverse().map(([x, y]) => [x, y - w])]), fill);
// The line over the aubergine stripe at height y; on a cab car (nose: how
// far back the nose runs) they sweep down to the bottom of the nose. The
// line is orange on Renfe's Avant, Alvia and Media Distancia trains and pale
// gray on the AVEs (Series 100, 102/112 and 103, photographed 2024-26).
const AVE_LINE = "#a4abb2";
function rfStripes(L, y, nose = 0, color = RF.purple, line = RF.orange) {
  const pts = nose ? [[0, y - 2.4], [nose * 0.5, y - 1.2], [nose, y - 0.15], [nose + 4, y], [L, y]] : [[0, y], [L, y]];
  return ribbon(pts.map(([x, v]) => [x, v + 0.95]), 0.24, line) + ribbon(pts, 0.75, color);
}
// White body, gray roof edge and skirt, the stripes; options: the window
// band (dark glass band, from x0), the stripes' height, a cab's nose length,
// the line's color (line), or lines: the refurbished Alvia's two thin
// aubergine lines instead of line and stripe.
const rfPaint = (L, { y = 5.2, nose = 0, roof = 12.0, skirt = 3.4, band = null, line = RF.orange, lines: two = false } = {}) =>
  rect(0, 0, L, 17, RF.white) + rect(0, roof, L, 3, RF.roof) + rect(0, roof - 0.1, L, 0.12, "#8b9198") + rect(0, 0, L, skirt, RF.skirt) +
  (band ? rect(band[0], band[1], L - band[0] - (band[3] ?? 0), band[2], RF.band, 0, 'rx="0.4"') : "") + (two ? twoLines(L, y, nose) : rfStripes(L, y, nose, RF.purple, line));
// The Series 130 and 730 since their 2021-26 refurbishment: two thin
// aubergine lines low along the white, sweeping down the nose on a power car.
function twoLines(L, y, nose = 0) {
  const pts = nose ? [[0, y - 2.4], [nose * 0.5, y - 1.2], [nose, y - 0.15], [nose + 4, y], [L, y]] : [[0, y], [L, y]];
  return ribbon(pts.map(([x, v]) => [x, v + 0.55]), 0.24, RF.purple) + ribbon(pts, 0.24, RF.purple);
}
// Avlo (its Series 112 and 106 alike, photographed 2024-26): magenta all
// over, a darker roof, orange doors; along the side three swooshes, orange,
// turquoise and white, rising from low at one end toward the roof at the other.
const avloPaint = (L, { roof = 12.0, skirt = 3.4 } = {}) => {
  let s = rect(0, 0, L, 17, RF.avlo) + rect(0, roof, L, 3, RF.avloDark) + rect(0, 0, L, skirt, "#4a0f44");
  const sw = (y0, y1, w, fill) => path(`M0 ${y0}C${L * 0.35} ${y0} ${L * 0.6} ${y0 + 0.4} ${L} ${y1}L${L} ${y1 + w}C${L * 0.6} ${y0 + 0.4 + w} ${L * 0.35} ${y0 + w} 0 ${y0 + w}Z`, fill);
  return s + sw(skirt + 0.7, roof - 3.2, 0.42, RF.orange) + sw(skirt + 1.35, roof - 2.2, 0.38, RF.teal) + sw(skirt + 1.95, roof - 1.4, 0.14, "#ffffff");
};
const isAvlo = (c) => c.route === "Avlo";
const isRodalies = (c) => /Rodalies/.test(c.route || "");

// --- Talgo articulated coaches (series 102/112, 106 and 130/730): short
// cars hung between single wheel pairs, one under each joint; low floors,
// a door at one end of each car, gauge-changing wheelsets on the 130s and
// the variable-gauge 106s. At each joint the wheel pair's frame and the
// tall air-suspension column the car ends hang from; skirts close in the
// floor; an air-conditioning unit on the roof; the windows in a dark band.
// Drawn with the wheel pair at each end (the neighbor draws over the same
// place).
function talgoCoach(c, { roof = 11.2, sill = 2.6, rows, doorX = 1.2, paint, band }) {
  const { L } = c, x0 = 0.3, x1 = L - 0.3;
  const d = bodyOutline(x0, x1, sill, roof, { endR: 1.2 });
  let s = "";
  for (const x of [0, L]) {
    s += rect(x - 1.3, 1.7, 2.6, 2.4, "currentColor", 0, 'opacity="0.85" rx="0.3"') + circle(x, 1.45, 1.45, "currentColor") +
      circle(x, 1.45, 1.15, "none", 0, `stroke="${C.steelDark}" stroke-width="0.5"`) + circle(x, 1.45, 0.75, "none", 0, `stroke="${C.steelDark}" stroke-width="0.9"`) + circle(x, 1.45, 0.35, C.steelDark) +
      rect(x - 1.7, 3.3, 3.4, 0.5, "currentColor", 0, 'opacity="0.7"');
  }
  const avlo = isAvlo(c);
  s += shell(d, avlo ? RF.avlo : RF.white, paint(c, L) + (band ? rect(3.2, band[0], L - 6.4, band[1], avlo ? "#3d0f38" : RF.band, 0, 'rx="0.4"') : ""));
  s += fairing(3.4, L - 3.4, sill, 0.8, avlo ? "#3a1030" : RF.fair);
  for (const [x, y, w, h] of rows) s += win(x, y, w, h, 0.4);
  s += door(doorX, 2.9, 2.4, 6.9, { glassY: 0.55, glassH: 0.3, fill: avlo ? RF.orange : "rgba(0,0,0,0.08)" }) + rect(doorX + 0.15, 2.7, 2.1, 0.2, "currentColor", 0, 'opacity="0.7"') +
    lines([[3.0, sill + 0.2, 3.0, roof - 1.0], [L - 3.0, sill + 0.2, L - 3.0, roof - 1.0]], "rgba(0,0,0,0.22)", 0.45);
  // The air-suspension columns at the joints, inside the end walls.
  for (const x of [0.55, L - 1.35]) s += rect(x, sill + 0.4, 0.8, 5.8, "#4a4f56", 0.4, 'rx="0.3"') + line(x + 0.4, sill + 1.0, x + 0.4, sill + 5.6, "rgba(255,255,255,0.25)", 0.5);
  s += aircon(L / 2 - 5.5, roof, 11, 0.6) + line(2.0, roof - 0.65, L - 2.0, roof - 0.65, "rgba(0,0,0,0.2)", 0.5) + cover(4.0, roof, 6.0, 0.35) + aerial(L - 6, roof) +
    sign(doorX + 0.2, roof - 1.6, 2.0, 0.4);
  s += avlo ? letters(c, L - 8, roof - 2.3, 0.9, "avlo", "#ffffff", { weight: 800 }) : renfeWord(c, L - 7.5, sill + 1.5, 0.75);
  return s + coupled(c, 2.9, roof - 1.0);
}
// The rubber diaphragm between coupled cars (carmodels.js's carEnds, which
// the shell-drawn cars can't reach).
function coupled(c, floor, top) {
  let s = "";
  for (const [x, on] of [[0, c.coupledL], [c.L - 1.0, c.coupledR]]) if (on) s += rect(x, floor + 0.2, 1.0, top - floor - 0.4, C.rubber, 0, 'rx="0.2"') + line(x + 0.5, floor + 0.4, x + 0.5, top - 0.4, "#3a3f45", 0.6);
  return s;
}

// A power car (series 102/112, 106, 130): a cab and nose at the left, a
// machinery room behind it with grilles, two motor trucks, a pantograph
// over the transformer's roof hood, skirts between the trucks.
function powerCar(c, { nose, roof, sill = 3.4, glass, centers, cabLen, paint, side = [], panX, lamp, skirt, word }) {
  const avlo = isAvlo(c);
  return unit({ ...c, cabL: true, cabR: false }, {
    roof, sill, cornerR: 1.0, end: 0.6, noTrucks: true, nose, cabLen, badge: false, diaphragm: [3.2, roof - 1.4],
    paint: (c, g) => paint(c, g.L), rows: [],
    doors: [{ x: cabLen + 0.6, w: 2.2, y0: sill + 0.3, y1: sill + 6.6, glassY: 0.6, glassH: 0.25, grabs: false, fill: "rgba(0,0,0,0.08)" }],
    cabArt: () => path(poly(glass), C.glass) + path(poly(glass.slice(0, 3).map(([x, y], i) => [x + (i === 1 ? 0 : 0.6), y])), "rgba(255,255,255,0.1)") +
      (avlo ? letters(c, word[0], word[1], 1.0, "avlo", "#ffffff", { weight: 800 }) : renfeWord(c, word[0], word[1], 1.0)),
    front: { lamp, skirt, horn: [cabLen - 1.5, roof] },
    more: (c, g) => {
      let s = truck(g.L / 2 - centers / 2, { wb: 9.2, d: 40, kind: "loco", top: sill }) + truck(g.L / 2 + centers / 2, { wb: 9.2, d: 40, kind: "loco", top: sill });
      s += fairing(g.L / 2 - centers / 2 + 6.2, g.L / 2 + centers / 2 - 6.2, sill, 1.5, avlo ? "#3a1030" : RF.fair);
      for (const [x, w] of side) s += grille(x, sill + 3.6, w, 3.2);
      const px = panX ?? g.L - 14;
      s += panGear(px, roof) + cover(cabLen + 3, roof, px - cabLen - 9, 0.7) + slats(cabLen + 4, roof + 0.1, px - cabLen - 11, 0.45, 0.6, "rgba(0,0,0,0.3)") + aerial(cabLen + 1.5, roof);
      // The traction converter's cooling fans on the hood, small intakes
      // high on the side, the machinery room's panel joints.
      for (const x of [cabLen + 8, cabLen + 14]) s += path(`M${x - 2} ${roof + 0.65}Q${x} ${roof + 1.35} ${x + 2} ${roof + 0.65}Z`, C.steelDark, 0.4) + line(x - 1.2, roof + 0.95, x + 1.2, roof + 0.95, "currentColor", 0.5);
      s += grille(cabLen + 3.4, roof - 2.6, 3.0, 1.2, 0.3) + grille(g.L - 8, roof - 2.6, 3.0, 1.2, 0.3);
      s += lines([[cabLen + 3, sill + 0.3, cabLen + 3, roof - 0.9], [g.L - 9, sill + 0.3, g.L - 9, roof - 0.9]], "rgba(0,0,0,0.25)", 0.45);
      s += rect(lamp[0] + 0.9, lamp[1] + 0.6, 0.55, 0.35, "#f6f3dc", 0.4, 'rx="0.12"');
      return s;
    },
  });
}

// --- Series 103 (Siemens Velaro E, 2005-09): 26 eight-car sets, 200 m,
// 8,800 kW spread under half the cars, 300 km/h (350 certified). End cars
// 25.68 m with a long tapered nose, middle cars 24.78 m; a single plug door
// at the ends of each car, small windows in a dark band; skirts closing in
// the underfloor; pantographs on the transformer cars, second from each
// end. Renfe white with
// the orange and aubergine stripes sweeping down the nose.
const V103 = { roof: 12.8, sill: 3.4, cornerR: 1.0, end: 0.6, trucks: { centers: 57, wb: 8.2, d: 36 }, diaphragm: [3.8, 11.8], badge: false };
const v103Door = (x) => ({ x, w: 2.6, y0: 3.6, y1: 10.6, glassY: 0.55, glassH: 0.3, grabs: false, fill: "rgba(0,0,0,0.08)" });
export const rf103Cab = (c) => unit({ ...c, cabL: true, cabR: false }, { ...V103,
  nose: [[1.4, 3.4], [0.6, 4.1], ["q", 0.3, 5.2, 1.3, 6.0], [10.5, 10.9], ["q", 13.5, 12.8, 19.0, 12.8]],
  rows: [{ xs: seq(26.4, 3.95, 13), y: 7.6, w: 2.7, h: 2.3, r: 0.5 }],
  doors: [v103Door(21.6), v103Door(c.L - 4.0)], cabLen: 18,
  paint: (c, g) => rfPaint(g.L, { y: 5.3, nose: 18, roof: 11.9, band: [25.8, 7.35, 2.8, 4.6], line: AVE_LINE }) + renfeWord(c, 12.5, 7.6, 1.2),
  cabArt: () => path(poly([[6.4, 8.4], [9.6, 10.5], [13.0, 11.6], [14.4, 10.0], [10.4, 8.6]]), C.glass) + win(16.0, 8.4, 2.2, 1.8, 0.4) +
    path("M1.6 4.5Q2.6 3.9 4.4 4.3", "none", 0, 'stroke="rgba(0,0,0,0.35)" stroke-width="0.5"'),
  front: { lamp: [2.6, 5.8], skirt: [[1.4, 3.4], [2.0, 1.3], [7.2, 1.3], [7.6, 3.4]], horn: [17.0, 12.8], wiper: [7.4, 8.6, 9.6, 10.2] },
  ac: [[20, 9, 0.6], [c.L - 16, 10, 0.6]],
  more: (c, g) => fairing(19.4, g.L / 2 + 22.2, g.sill, 1.4, RF.fair) + aerial(36, g.roof),
});
// The two transformer cars, second from each end, carry the pantographs.
const v103Pan = (c) => c.index === 1 || c.index === c.count - 2;
export const rf103 = (c) => unit({ ...c, cabL: false, cabR: false }, { ...V103,
  rows: [{ xs: seq(6.0, 3.95, 18), y: 7.6, w: 2.7, h: 2.3, r: 0.5 }],
  doors: [v103Door(1.4), v103Door(c.L - 4.0)],
  paint: (c, g) => rfPaint(g.L, { y: 5.3, roof: 11.9, band: [5.4, 7.35, 2.8, 5.0], line: AVE_LINE }),
  ac: [[5, 10, 0.6], [c.L - 16, 10, 0.6]],
  more: (c, g) => fairing(g.L / 2 - 22.2, g.L / 2 + 22.2, g.sill, 1.4, RF.fair) +
    (v103Pan(c) ? panGear(c.L - 24, 12.8) + cover(24, 12.8, 22, 0.6) : cover(26, 12.8, 30, 0.45)),
});

// --- Series 102 and 112 (Talgo 350, power cars by Adtranz/Bombardier,
// 2005-10): 16 and 30 sets, a power car at each end of twelve Talgo
// coaches, 200 m, 8,000 kW, 330 km/h; the power cars' long flattened
// noses earned them the nickname "Pato" (duck). Avlo's 112s are purple.
const PATO = [[0.6, 2.9], [0.2, 3.6], ["q", 0.4, 4.4, 2.6, 4.7], [9.0, 6.0], ["q", 12.8, 7.2, 15.2, 9.8], ["q", 17.4, 12.9, 21.6, 12.9]];
export const rf112Power = (c) => powerCar(c, { nose: PATO, roof: 12.9, sill: 3.3, cabLen: 20, centers: 34,
  glass: [[11.8, 7.9], [14.2, 9.4], [16.4, 12.0], [19.6, 12.0], [19.6, 9.2], [15.0, 8.0]],
  lamp: [3.4, 4.0], skirt: [[0.6, 2.9], [1.2, 1.2], [9.4, 1.2], [9.8, 3.3]], word: [52.5, 8.6],
  side: [[25, 9], [37, 9]], paint: (c, L) => (isAvlo(c) ? avloPaint(L) : rfPaint(L, { y: 4.8, nose: 14, line: AVE_LINE })) });
export const rf112Coach = (c) => talgoCoach(c, { roof: 11.2, rows: seq(5.4, 5.9, 6).map((x) => [x, 6.0, 4.0, 2.7]), band: [5.75, 3.2],
  paint: (c, L) => (isAvlo(c) ? avloPaint(L, { roof: 10.4, skirt: 2.6 }) : rfPaint(L, { y: 4.3, roof: 10.4, skirt: 2.6, line: AVE_LINE })) });

// --- Series 106 (Talgo Avril, 2021-24): 30 sets, half of them variable
// gauge, two power cars and twelve wide, low Talgo coaches, 201.8 m, 8,800
// kW, 300 km/h in service; 20 AVE and 10 Avlo (Wikipedia, Serie 106 de
// Renfe). The AVE sets (photographed at A Coruña and Zamora, 2024-26): pearl
// white, a black mask from the nose over the windshield and back along the
// cab, a thin aubergine line along the bottom; on each power car "renfe AVE"
// big on the side, the V aubergine, and a tall aubergine V at its inner
// end; the coaches' windows in a dark band. The Avlo sets in Avlo's magenta.
const AVRIL = [[0.6, 3.0], [0.3, 3.8], ["q", 0.6, 4.8, 3.0, 5.4], [12.0, 9.2], ["q", 15.5, 12.5, 21.0, 12.6]];
const avrilPaint = (c, L, { roof = 12.0, skirt = 3.3, mask = false } = {}) => isAvlo(c) ? avloPaint(L, { roof, skirt }) :
  rect(0, 0, L, 17, "#eeece7") + rect(0, roof, L, 3, RF.roof) + rect(0, roof - 0.1, L, 0.12, "#8b9198") + rect(0, 0, L, skirt, RF.skirt) + rect(0, skirt, L, 0.3, RF.purple) +
  (mask ? path("M2.4 6.0Q8.0 6.9 12.0 8.3Q16.0 9.7 20.6 10.3L21.5 13.2L2 13.2Z", "#16181b") : "");
// "AVE" as lettered on the AVEs: A and E in gray, the V in aubergine (the
// letters stay in reading order on a car drawn mirrored).
const aveWord = (c, x, y, h) => {
  const k = c.mirrored ? -1 : 1, g = "#8d949b";
  return letters(c, x - k * h * 0.72, y, h, "A", g, { weight: 400 }) + letters(c, x, y, h, "V", RF.purple, { weight: 400 }) + letters(c, x + k * h * 0.68, y, h, "E", g, { weight: 400 });
};
export const rf106Power = (c) => powerCar(c, { nose: AVRIL, roof: 12.6, sill: 3.3, cabLen: 18, centers: 40,
  glass: [[7.8, 7.0], [12.6, 10.1], [16.0, 11.6], [17.0, 10.2], [11.8, 7.3]],
  lamp: [3.6, 4.6], skirt: [[0.6, 3.0], [1.2, 1.2], [8.8, 1.2], [9.2, 3.3]], word: [isAvlo(c) ? 30 : 38, isAvlo(c) ? 9.2 : 10.6],
  side: [[44, 10], [58, 6]], paint: (c, L) => avrilPaint(c, L, { mask: true }) +
    (isAvlo(c) ? "" : aveWord(c, 38, 7.4, 2.6) + path(`M${L - 9.4} 10.9L${L - 8.5} 10.9L${L - 7.4} 6.6L${L - 6.4} 10.9L${L - 6.0} 10.9L${L - 7.2} 5.6L${L - 7.7} 5.6Z`, RF.purple)) });
export const rf106Coach = (c) => talgoCoach(c, { roof: 11.8, sill: 2.4, rows: seq(6.2, 6.9, 5).map((x) => [x, 6.0, 5.2, 3.2]), band: isAvlo(c) ? null : [5.75, 3.7],
  paint: (c, L) => avrilPaint(c, L, { roof: 11.0, skirt: 2.4 }) });

// --- Series 100 (GEC-Alsthom and CAF, 1992): 22 sets on the TGV
// Atlantique pattern, two power cars and eight articulated trailers on
// shared trucks, 200 m, 8,800 kW, 300 km/h; the first AVEs, still
// Madrid–Seville. Power cars 22.13 m, trailers 18.7 m.
export const rf100Power = (c) => powerCar(c, {
  nose: [[0.8, 3.3], [0.4, 4.0], ["q", 0.6, 5.0, 2.4, 5.6], [8.6, 8.8], ["q", 10.6, 11.4, 13.2, 12.4], ["q", 14.4, 12.9, 17.0, 12.9]],
  roof: 12.9, sill: 3.3, cabLen: 15, centers: 46, glass: [[8.8, 9.0], [11.0, 11.0], [13.6, 12.1], [14.2, 10.2], [11.0, 9.0]],
  lamp: [2.8, 4.4], skirt: [[0.8, 3.3], [1.4, 1.2], [8.0, 1.2], [8.4, 3.3]], word: [6.4, 5.4],
  side: [[20, 12], [36, 12], [52, 8]], paint: (c, L) => rfPaint(L, { y: 5.0, nose: 12, line: AVE_LINE }) });
export const rf100 = (c) => unit({ ...c, cabL: false, cabR: false }, {
  roof: 11.4, sill: 3.4, cornerR: 1.0, end: 0.3, noTrucks: true, diaphragm: [3.7, 10.6], badge: false,
  rows: [{ xs: seq(5.4, 4.7, 11), y: 6.9, w: 3.2, h: 2.4, r: 0.5 }],
  doors: [{ x: 1.0, w: 2.5, y0: 3.6, y1: 10.0, glassY: 0.55, glassH: 0.3, grabs: false, fill: "rgba(0,0,0,0.08)" }],
  paint: (c, g) => rfPaint(g.L, { y: 5.0, roof: 10.6, band: [4.9, 6.7, 2.8, 4.6], line: AVE_LINE }) + renfeWord(c, g.L - 9, 4.0, 0.7),
  ac: [[6, 10, 0.55], [c.L - 17, 10, 0.55]],
  onRoof: (c, g) => cover(20, g.roof, 14, 0.4) + aerial(38, g.roof),
  more: (c, g) => truck(0, { wb: 9.8, d: 36, top: 3.4 }) + truck(g.L, { wb: 9.8, d: 36, top: 3.4 }) + fairing(7.2, g.L - 7.2, g.sill, 1.3, RF.fair) +
    sign(4.0, 9.0, 1.6, 0.4) + lines([[g.L - 4.2, 3.6, g.L - 4.2, 10.4]], "rgba(0,0,0,0.22)", 0.45),
});

// --- Series 130 (Talgo 250, power cars by Bombardier, 2007-10) and 730
// (15 of them made hybrid, with diesel generator cars): 45 sets, two power
// cars and eleven Talgo coaches, 184 m, 4,800 kW, 250 km/h, changing gauge
// on the move. Alvia, Euromed and Intercity services.
// The refurbished power cars' pearl-gray mask around the windshield, from
// the nose up over the cab roof.
const alviaMask = () => path("M4.6 8.0Q9.0 8.5 15.2 9.6L15.2 14L3.6 14Z", "#a9b0b7") + path("M4.6 8.0Q9.0 8.5 15.2 9.6", "none", 0, 'stroke="#7d848c" stroke-width="0.5"');
export const rf130Power = (c) => powerCar(c, {
  nose: [[0.8, 3.3], [0.4, 4.2], ["q", 0.6, 5.4, 2.4, 6.2], [6.4, 9.2], ["q", 8.6, 11.8, 11.0, 12.7], ["q", 12.4, 13.1, 14.6, 13.1]],
  roof: 13.1, sill: 3.3, cabLen: 12, centers: 38, glass: [[6.8, 9.6], [8.6, 11.6], [11.4, 12.4], [11.8, 10.0], [8.6, 9.4]],
  lamp: [2.4, 4.6], skirt: [[0.8, 3.3], [1.4, 1.2], [7.2, 1.2], [7.6, 3.3]], word: [5.6, 6.0],
  side: [[17, 10], [30, 10], [43, 8]], paint: (c, L) => rfPaint(L, { y: 4.6, nose: 10, lines: true }) + alviaMask() });
export const rf130Coach = (c) => talgoCoach(c, { roof: 11.0, rows: seq(5.4, 5.9, 6).map((x) => [x, 5.9, 4.0, 2.6]), band: [5.65, 3.1],
  paint: (c, L) => rfPaint(L, { y: 3.9, roof: 10.2, skirt: 2.6, lines: true }) });

// --- Series 120 and 121 (CAF with Alstom, 2006-09): four-car electric
// units, 106.23 m, end cars 27.35 m and middle cars 25.78 m, 4,000 kW, 250
// km/h, changing gauge on the move; 120s on Alvia services, 121s on Avant.
// A tapered nose, a single plug door at each end of each car; the windows
// in a dark band; equipment covers along the roof, skirts under the floor.
const S120 = { roof: 13.2, sill: 3.6, cornerR: 1.0, end: 0.6, trucks: { centers: 62, wb: 8.5, d: 34 }, diaphragm: [3.9, 12.0], badge: false };
const s120Door = (x) => ({ x, w: 2.6, y0: 3.8, y1: 10.9, glassY: 0.55, glassH: 0.3, grabs: false, fill: "rgba(0,0,0,0.08)" });
export const rf120Cab = (c) => unit({ ...c, cabL: true, cabR: false }, { ...S120,
  nose: [[1.2, 3.6], [0.6, 4.4], ["q", 0.5, 5.8, 1.8, 6.8], [8.2, 11.2], ["q", 10.6, 13.2, 15.0, 13.2]],
  rows: [{ xs: seq(22.0, 5.1, 12), y: 7.2, w: 3.9, h: 2.6, r: 0.4 }],
  doors: [s120Door(17.4), s120Door(c.L - 4.0)], cabLen: 15,
  paint: (c, g) => rfPaint(g.L, { y: 5.4, nose: 14, roof: 12.3, skirt: 3.6, band: [21.4, 6.95, 3.1, 4.6] }) + renfeWord(c, 8.2, 6.9, 1.1),
  cabArt: () => path(poly([[5.0, 8.6], [8.6, 11.3], [11.2, 12.4], [12.2, 10.8], [8.6, 8.8]]), C.glass) + win(13.4, 8.6, 2.0, 2.2, 0.4),
  front: { lamp: [2.2, 5.6], skirt: [[1.2, 3.6], [1.8, 1.4], [8.2, 1.4], [8.6, 3.6]], horn: [15.0, 13.2], wiper: [6.0, 8.8, 7.8, 10.4] },
  ac: [[18, 10, 0.6]], gear: [[24, 8, 1.4, "g"], [33, 6, 1.2, "b"], [40, 7, 1.0, "t"]],
  onRoof: (c, g) => panGear(c.L - 14, g.roof) + cover(30, g.roof, 20, 0.55),
});
export const rf120 = (c) => unit({ ...c, cabL: false, cabR: false }, { ...S120,
  rows: [{ xs: seq(6.4, 5.1, 14), y: 7.2, w: 3.9, h: 2.6, r: 0.4 }],
  doors: [s120Door(1.4), s120Door(c.L - 4.0)],
  paint: (c, g) => rfPaint(g.L, { y: 5.4, roof: 12.3, skirt: 3.6, band: [5.8, 6.95, 3.1, 5.0] }),
  ac: [[6, 10, 0.6], [c.L - 16, 10, 0.6]], gear: [[22, 9, 1.5, "g"], [32, 7, 1.3, "b"], [40, 8, 1.0, "t"], [49, 7, 1.2]],
  onRoof: (c, g) => cover(20, g.roof, 40, 0.45),
});

// --- Series 104 (Alstom and CAF, 2004) and 114 (Alstom, 2008-10): the
// Avant's four-car "Pendolino" units (they don't tilt), 107 m, 4,000 kW,
// 250 km/h; 20 and 13 sets. A rounded nose under a deep windshield.
const P104 = { roof: 12.9, sill: 3.6, cornerR: 1.0, end: 0.6, trucks: { centers: 60, wb: 8.9, d: 34 }, diaphragm: [3.9, 11.8], badge: false };
export const rf104Cab = (c) => unit({ ...c, cabL: true, cabR: false }, { ...P104,
  nose: [[1.0, 3.6], [0.5, 4.6], ["q", 0.4, 6.4, 1.6, 7.6], [5.6, 11.4], ["q", 7.6, 12.9, 11.0, 12.9]],
  rows: [{ xs: seq(17.6, 5.3, 12), y: 7.1, w: 4.2, h: 2.6, r: 0.5 }],
  doors: [s120Door(12.8), s120Door(c.L - 4.0)], cabLen: 11,
  paint: (c, g) => rfPaint(g.L, { y: 5.4, nose: 10, roof: 12.0, skirt: 3.6, band: [17.0, 6.85, 3.1, 4.6] }) + renfeWord(c, 6.6, 6.0, 1.0),
  cabArt: () => path(poly([[2.2, 8.0], [5.4, 11.0], [8.4, 12.2], [9.2, 9.6], [5.6, 8.2]]), C.glass),
  front: { lamp: [1.4, 5.4], skirt: [[1.0, 3.6], [1.6, 1.4], [7.6, 1.4], [8.0, 3.6]], horn: [11.0, 12.9], wiper: [3.4, 8.4, 5.4, 10.2] },
  ac: [[14, 10, 0.6]], gear: [[20, 8, 1.4, "g"], [29, 7, 1.2, "b"], [37, 7, 1.0, "t"], [45, 6, 1.2]],
  onRoof: (c, g) => panGear(c.L - 12, g.roof) + cover(28, g.roof, 22, 0.5),
});
export const rf104 = (c) => unit({ ...c, cabL: false, cabR: false }, { ...P104,
  rows: [{ xs: seq(6.0, 5.3, 14), y: 7.1, w: 4.2, h: 2.6, r: 0.5 }],
  doors: [s120Door(1.4), s120Door(c.L - 4.0)],
  paint: (c, g) => rfPaint(g.L, { y: 5.4, roof: 12.0, skirt: 3.6, band: [5.4, 6.85, 3.1, 5.0] }),
  ac: [[6, 10, 0.6], [c.L - 16, 10, 0.6]], gear: [[22, 9, 1.5, "g"], [32, 7, 1.3, "b"], [40, 8, 1.0, "t"], [49, 7, 1.2]],
  onRoof: (c, g) => cover(20, g.roof, 40, 0.45),
});

// --- Series 449 (CAF, 2008-11; Media Distancia electric) and 599 (CAF,
// 2008-10; diesel): one family's bulbous nose and big windshield in a dark
// mask, the name on the white below it. 449: 57 five-car units on shared
// trucks, 98 m, 2,400 kW, 160 km/h. 599: 50 three-car units, 76 m, four
// MTU engines, 160 km/h. A double plug door a side near each end of each
// car; individual windows joined by a dark band.
const CAFMD = { roof: 13.4, sill: 3.6, cornerR: 1.0, end: 0.6, diaphragm: [3.9, 12.2], badge: false };
const CAF_NOSE = [[1.4, 3.6], [0.7, 4.4], ["q", 0.4, 5.9, 1.4, 7.4], [4.6, 11.4], ["q", 6.2, 13.4, 9.6, 13.4]];
const mdDoor = (x) => ({ x, w: 3.6, y0: 3.8, y1: 10.9, leaves: 2, glassY: 0.5, glassH: 0.35, grabs: false, fill: "rgba(0,0,0,0.08)" });
const cafCab = (c) => path("M1.2 7.2Q3.6 9.8 5.0 12.2Q6.4 13.0 9.6 13.0L9.6 7.4Q5.0 6.8 1.2 7.2Z", "#1b1d21") +
  path(poly([[1.6, 7.6], [4.6, 11.2], [7.6, 12.6], [8.4, 9.4], [5.0, 7.8]]), C.glass) + renfeWord(c, 4.8, 5.4, 0.9) + sign(5.6, 12.1, 2.6);
const cafFront = { lamp: [1.0, 5.6], skirt: [[1.4, 3.6], [2.0, 1.4], [7.4, 1.4], [7.8, 3.6]], horn: [10.0, 13.4], wiper: [2.8, 8.0, 4.6, 10.4] };
const jakobs = (x) => truck(x, { wb: 8.5, d: 33, top: 3.6 });
export const rf449Cab = (c) => unit({ ...c, cabL: true, cabR: false }, { ...CAFMD, noTrucks: true,
  nose: CAF_NOSE, rows: [{ xs: [...seq(22.6, 5.6, 6), 57.0], y: 7.2, w: 4.6, h: 2.8, r: 0.4 }],
  doors: [mdDoor(16.6), mdDoor(c.L - 6.6)], cabLen: 10,
  paint: (c, g) => rfPaint(g.L, { y: 5.2, nose: 10, roof: 12.4, skirt: 3.6, band: [22.0, 7.5, 2.2, 7.4] }), cabArt: cafCab, front: cafFront,
  ac: [[20, 10, 0.7]], gear: [[22, 7, 1.4, "g"], [30, 6, 1.2, "b"], [37.6, 6, 1.0, "t"], [45, 6, 1.3]],
  onRoof: (c, g) => panGear(g.L - 16, 13.4) + cover(32, 13.4, 10, 0.5),
  more: (c, g) => truck(13.0, { wb: 8.5, d: 36, top: 3.6 }) + jakobs(g.L),
});
export const rf449 = (c) => unit({ ...c, cabL: false, cabR: false }, { ...CAFMD, noTrucks: true,
  rows: [{ xs: seq(7.6, 5.6, 9), y: 7.2, w: 4.6, h: 2.8, r: 0.4 }],
  doors: [mdDoor(2.0)], paint: (c, g) => rfPaint(g.L, { y: 5.2, roof: 12.4, skirt: 3.6, band: [7.0, 7.5, 2.2, 3.0] }),
  ac: [[14, 10, 0.7], [40, 10, 0.7]], gear: [[12, 8, 1.4, "g"], [21, 7, 1.2, "b"], [30, 6, 1.0, "t"], [38, 7, 1.3], [47, 5, 1.1, "b"]],
  onRoof: (c, g) => cover(26, 13.4, 12, 0.45) + aerial(52, 13.4),
  more: (c, g) => jakobs(0) + jakobs(g.L) + sign(2.4, 11.2, 2.8) + lines([[6.4, 3.8, 6.4, 12.0]], "rgba(0,0,0,0.2)", 0.45),
});
export const rf599Cab = (c) => unit({ ...c, cabL: true, cabR: false }, { ...CAFMD,
  trucks: { centers: 57, wb: 8.5, d: 34 }, nose: CAF_NOSE, rows: [{ xs: seq(21.0, 5.6, 10), y: 7.2, w: 4.6, h: 2.8, r: 0.4 }],
  doors: [mdDoor(15.6), mdDoor(c.L - 5.6)], cabLen: 10,
  paint: (c, g) => rfPaint(g.L, { y: 5.2, nose: 10, roof: 12.4, skirt: 3.6, band: [20.4, 7.5, 2.2, 8.6] }), cabArt: cafCab, front: cafFront,
  ac: [[18, 10, 0.7]],
  // Two MTU power packs under each end car, their radiators on the roof.
  gear: [[22, 11, 1.8, "g"], [34, 5, 1.2, "b"], [40, 9, 1.0, "t"], [50, 7, 1.6, "g"]],
  onRoof: (c, g) => cover(c.L - 28, 13.4, 14, 0.7) + slats(c.L - 27.4, 13.5, 12.8, 0.45, 0.5, "rgba(0,0,0,0.35)") + exhaust(c.L - 31, 13.4) + exhaust(36, 13.4) + aerial(30, 13.4),
});
export const rf599 = (c) => unit({ ...c, cabL: false, cabR: false }, { ...CAFMD,
  trucks: { centers: 55, wb: 8.5, d: 34 }, rows: [{ xs: seq(7.6, 5.6, 11), y: 7.2, w: 4.6, h: 2.8, r: 0.4 }],
  doors: [mdDoor(2.0), mdDoor(c.L - 5.6)], paint: (c, g) => rfPaint(g.L, { y: 5.2, roof: 12.4, skirt: 3.6, band: [7.0, 7.5, 2.2, 6.4] }),
  ac: [[7, 10, 0.7], [c.L - 17, 10, 0.7]], gear: [[20, 7, 1.3, "b"], [28, 9, 1.0, "t"], [38.5, 6, 1.2], [45.5, 7, 1.3, "b"]],
  onRoof: (c, g) => cover(24, 13.4, 30, 0.45),
});

// Cercanías: white, a red band low on the side over a gray line, the cab's
// front red around the windshield, the emblem by the cab. Rodalies
// (Catalonia): white, an orange front and orange doors, a thin red line
// under the windows, its R by the cab.
const cerPaint = (c, L, { cab = false, roof = 12.3, skirt = 3.6, y = 4.6 } = {}) => {
  let s = rect(0, 0, L, 17, RF.white) + rect(0, roof, L, 3, RF.roof) + rect(0, roof - 0.1, L, 0.12, "#8b9198") + rect(0, 0, L, skirt, RF.skirt);
  if (isRodalies(c)) return s + rect(0, y + 2.2, L, 0.22, RF.red) + (cab ? path(`M0 ${skirt}L3.4 ${skirt}L3.4 ${roof - 0.6}Q3.4 ${roof} 2.6 ${roof}L0 ${roof}Z`, RF.rod) : "");
  return s + rect(0, y, L, 0.9, RF.red) + rect(0, y + 1.05, L, 0.18, "#8a9097") + (cab ? path(`M0 ${skirt}L2.8 ${skirt}L2.8 ${roof - 0.6}Q2.8 ${roof} 2.0 ${roof}L0 ${roof}Z`, RF.red) : "");
};
const cerEmblem = (c, x, y, h) => (isRodalies(c) ? rodMark(c, x, y, h) : cerMark(x, y, h / 2));
const cerDoor = (c, x, w = 4.3) => ({ x, w, y0: 3.7, y1: 10.9, leaves: 2, glassY: 0.45, glassH: 0.42, ...(isRodalies(c) ? { fill: RF.rod } : { fill: "#e4e6e8" }) });

// --- Civia (series 462-465; CAF, Alstom and Siemens, 2003-10): 248
// low-floor units of two to five cars, the 465 five-car set 98 m, 2,200
// kW, 120 km/h. Two double sliding doors a side on each car, big windows
// in a dark band; the cab front a red surround on white; air-conditioning
// along the roof, the traction gear in skirts under the floor.
const CIVIA = { roof: 12.6, sill: 3.3, cornerR: 1.0, end: 0.6, trucks: { centers: 44, wb: 8.2, d: 30 }, diaphragm: [3.6, 11.6], badge: false };
const civiaBand = (L, a, b) => rect(a, 6.55, L - a - b, 3.5, RF.band, 0, 'rx="0.4"');
export const rfCiviaCab = (c) => unit({ ...c, cabL: true, cabR: false }, { ...CIVIA,
  nose: [[1.0, 3.3], [0.7, 4.4], ["q", 0.6, 9.6, 1.6, 11.4], ["q", 2.4, 12.6, 4.4, 12.6]],
  rows: [{ xs: [9.8, 28.6, 34.0, 52.6, 58.0, 63.4], y: 6.8, w: 4.6, h: 3.0, r: 0.4 }],
  doors: [cerDoor(c, 20.0), cerDoor(c, 43.6)], cabLen: 6,
  paint: (c, g) => cerPaint(c, g.L, { cab: true, roof: 11.6, skirt: 3.3, y: 4.2 }) + civiaBand(g.L, 9.4, 2.4) + cerEmblem(c, 7.8, 8.3, 1.3),
  cabArt: () => path(poly([[0.8, 7.2], [1.3, 11.0], [5.4, 11.0], [5.4, 7.2]]), C.glass) + sign(1.6, 11.05, 3.2),
  front: { lamp: [0.75, 5.2], coupler: [0, 2.8], skirt: [[1.0, 3.3], [1.2, 1.5], [5.0, 1.5], [5.4, 3.3]], horn: [5.4, 12.6], wiper: [1.2, 7.6, 2.2, 10.4] },
  ac: [[14, 9, 0.6], [44, 9, 0.6]], gear: [[17, 2.6, 0.8, "b"], [26, 7, 1.0, "g"], [34, 6, 0.9, "b"]],
  onRoof: (c, g) => panGear(c.L - 12, 12.6),
  more: (c, g) => fairing(16, 46, g.sill, 1.1, "#4a4f56"),
});
export const rfCivia = (c) => unit({ ...c, cabL: false, cabR: false }, { ...CIVIA,
  rows: [{ xs: [2.4, 20.4, 25.8, 31.2, 49.8, 55.2], y: 6.8, w: 4.6, h: 3.0, r: 0.4 }],
  doors: [cerDoor(c, 11.6), cerDoor(c, 40.8)],
  paint: (c, g) => cerPaint(c, g.L, { roof: 11.6, skirt: 3.3, y: 4.2 }) + civiaBand(g.L, 2.0, 2.0) + cerEmblem(c, 38.0, 6.0, 1.0),
  ac: [[6, 9, 0.6], [36, 9, 0.6]], gear: [[17, 7, 1.0, "g"], [25, 6, 0.9, "b"], [32, 6, 0.8, "t"]],
  onRoof: (c, g) => cover(18, 12.6, 14, 0.45) + aerial(48, 12.6),
  more: (c, g) => fairing(14, 44, g.sill, 1.1, "#4a4f56") + sign(12.0, 11.0, 3.4),
});

// --- Series 446 (1989-93) and 447 (1992-2001; CAF, Alstom, Siemens, ABB):
// three-car units, a motor car with a cab at each end and a trailer
// between, 76 m, 2,400 kW; 170 and 183 built. Three pairs of sliding
// doors a side on every car; the roof's resistors and air-conditioning.
const S447 = { roof: 13.2, sill: 3.7, cornerR: 1.0, end: 0.6, trucks: { centers: 56, wb: 8.5, d: 34 }, diaphragm: [3.9, 12.0], badge: false };
export const rf447Cab = (c) => unit({ ...c, cabL: true, cabR: false }, { ...S447,
  nose: [[0.9, 3.7], [0.7, 9.8], ["q", 0.8, 12.0, 2.0, 12.8], ["q", 2.8, 13.2, 4.2, 13.2]],
  rows: [{ xs: [6.2, 21.2, 26.2, 45.0, 50.0, 69.2, 74.2], y: 7.3, w: 4.0, h: 2.7, r: 0.3 }],
  doors: [cerDoor(c, 11.8, 4.2), cerDoor(c, 35.6, 4.2), cerDoor(c, 59.4, 4.2)], cabLen: 4,
  paint: (c, g) => cerPaint(c, g.L, { cab: true }) + cerEmblem(c, 32.0, 8.6, 1.4),
  cabArt: () => path(poly([[0.8, 7.8], [1.2, 11.6], [4.0, 11.6], [4.0, 7.8]]), C.glass) + sign(1.4, 11.75, 2.4),
  front: { lamp: [0.75, 5.6], coupler: [0, 2.9], skirt: [[0.9, 3.7], [1.1, 1.6], [5.0, 1.6], [5.4, 3.7]], horn: [4.4, 13.2], wiper: [1.2, 8.2, 2.2, 10.9] },
  ac: [[16, 10, 0.7]], gear: [[17, 8, 1.6, "g"], [26, 7, 1.3, "b"], [41, 8, 1.6, "g"], [50, 5, 1.0, "t"]],
  onRoof: (c, g) => panGear(c.L - 12, 13.2) + cover(30, 13.2, 16, 0.6) + slats(30.5, 13.3, 15, 0.35, 0.6, "rgba(0,0,0,0.35)"),
});
export const rf447 = (c) => unit({ ...c, cabL: false, cabR: false }, { ...S447,
  rows: [{ xs: [2.4, 17.4, 22.4, 41.2, 46.2, 65.2, 70.2], y: 7.3, w: 4.0, h: 2.7, r: 0.3 }],
  doors: [cerDoor(c, 8.0, 4.2), cerDoor(c, 31.8, 4.2), cerDoor(c, 55.6, 4.2)],
  paint: (c, g) => cerPaint(c, g.L) + cerEmblem(c, 28.0, 8.6, 1.4),
  ac: [[14, 10, 0.7], [56, 10, 0.7]], gear: [[18, 7, 1.2, "b"], [26, 6, 1.0, "t"], [37, 7, 1.3, "b"], [46, 6, 1.0]],
  onRoof: (c, g) => aerial(40, 13.2),
});

// --- Series 450 and 451 (GEC-Alsthom and CAF, 1993-95): double-deck
// units, 24 six-car 450s (two motor cars with cabs and four trailers,
// 159.4 m) and 12 three-car 451s, 2,960 kW, 140 km/h, on Madrid's and
// Barcelona's busiest lines. Two pairs of plug doors a side on every car,
// the low deck dropped between the trucks. Cercanías paints the upper
// deck red over the white, the windows in a dark band.
const S450 = { roof: 14.6, sill: 3.9, cornerR: 1.0, end: 0.6, trucks: { centers: 61, wb: 8.5, d: 36 }, diaphragm: [4.0, 12.6], badge: false,
  ends: { h: 13.6, len: 12, ramp: 3 } };
const dd450 = (c, g, cab) => cerPaint(c, g.L, { cab, roof: 13.2, skirt: 3.9, y: 4.4 }) +
  (isRodalies(c) ? "" : rect(cab ? 3 : 0, 9.3, g.L, 4.0, RF.red)) + rect(cab ? 6 : 0, 10.0, g.L - (cab ? 6 : 0), 2.2, RF.band, 0, 'rx="0.4"') +
  cerEmblem(c, cab ? 14.0 : g.L - 13.5, 6.2, 1.4);
const dd450Gear = [[20, 6, 0.4, "b"], [28, 8, 0.35], [56, 6, 0.4, "b"]];
export const rf450Cab = (c) => unit({ ...c, cabL: true, cabR: false }, { ...S450, drop: { a: 17.5, b: c.L - 17.5, y: 1.6 },
  nose: [[0.9, 3.9], [0.7, 10.0], ["q", 0.8, 12.6, 2.2, 13.3], ["q", 3.0, 13.6, 4.4, 13.6]],
  rows: [{ xs: seq(27.2, 5.4, 6), y: 10.1, w: 4.2, h: 2.0, r: 0.3 }, { xs: seq(27.2, 5.4, 6), y: 5.0, w: 4.2, h: 2.2, r: 0.3 }, { xs: [9.4, 75.4], y: 7.6, w: 4.0, h: 2.4, r: 0.3 }],
  doors: [cerDoor(c, 19.8, 4.4), { ...cerDoor(c, c.L - 21.8, 4.4) }].map((d) => ({ ...d, y0: 1.7, y1: 9.6 })), cabLen: 5,
  paint: (c, g) => dd450(c, g, true),
  cabArt: () => path(poly([[0.8, 8.6], [1.2, 12.4], [4.4, 12.4], [4.4, 8.6]]), C.glass) + sign(1.6, 12.5, 2.4),
  front: { lamp: [0.75, 6.0], coupler: [0, 3.0], skirt: [[0.9, 3.9], [1.1, 1.7], [5.0, 1.7], [5.4, 3.9]], horn: [5.0, 13.6], wiper: [1.2, 9.0, 2.2, 11.8] },
  ac: [[6, 8, 0.6, 13.6], [36, 12, 0.6]], gear: [[3.4, 3, 1.0, "b"], [c.L - 15, 4, 1.2, "g"]],
  onRoof: (c, g) => panGear(c.L - 8, 13.6) + cover(c.L - 30, 14.6, 12, 0.4),
});
export const rf450 = (c) => unit({ ...c, cabL: false, cabR: false }, { ...S450, drop: { a: 17.5, b: c.L - 17.5, y: 1.6 },
  rows: [{ xs: seq(27.2, 5.4, 6), y: 10.1, w: 4.2, h: 2.0, r: 0.3 }, { xs: seq(27.2, 5.4, 6), y: 5.0, w: 4.2, h: 2.2, r: 0.3 }, { xs: [5.6, 77.4], y: 7.6, w: 4.0, h: 2.4, r: 0.3 }],
  doors: [cerDoor(c, 19.8, 4.4), cerDoor(c, c.L - 24.2, 4.4)].map((d) => ({ ...d, y0: 1.7, y1: 9.6 })),
  paint: (c, g) => dd450(c, g, false),
  ac: [[3, 8, 0.6, 13.6], [36, 14, 0.6], [c.L - 11, 8, 0.6, 13.6]], gear: [[3.4, 3, 1.0, "b"], [c.L - 6.4, 3, 1.0, "b"]],
});

// --- The metre-gauge network Renfe took over from FEVE in 2013
// (Cercanías in Asturias, Cantabria, Bilbao, León, Ferrol and Cartagena):
// electric units of series 433-438 and diesel 526-529, mostly two or three
// short cars. Drawn as one generic three-car unit in Cercanías colors.
const MET = { roof: 11.8, sill: 3.2, cornerR: 0.9, end: 0.5, trucks: { centers: 40, wb: 7.0, d: 28 }, diaphragm: [3.4, 10.8], badge: false };
export const rfMetCab = (c) => unit({ ...c, cabL: true, cabR: false }, { ...MET,
  nose: [[0.9, 3.2], [0.7, 8.8], ["q", 0.8, 10.8, 2.0, 11.5], ["q", 2.6, 11.8, 3.8, 11.8]],
  rows: [{ xs: [5.6, 19.4, 24.0, 28.6, 43.4, 48.0], y: 6.6, w: 3.6, h: 2.5, r: 0.3 }],
  doors: [cerDoor(c, 10.8, 3.6), cerDoor(c, 34.4, 3.6)].map((d) => ({ ...d, y0: 3.3, y1: 9.9 })), cabLen: 4,
  paint: (c, g) => cerPaint(c, g.L, { cab: true, roof: 11.0, skirt: 3.2, y: 4.0 }) + cerEmblem(c, 31.6, 7.85, 1.2),
  cabArt: () => path(poly([[0.8, 7.0], [1.2, 10.4], [3.6, 10.4], [3.6, 7.0]]), C.glass) + sign(1.3, 10.5, 2.2, 0.4),
  front: { lamp: [0.75, 5.0], coupler: [0, 2.6], skirt: [[0.9, 3.2], [1.1, 1.4], [4.4, 1.4], [4.8, 3.2]], horn: [4.0, 11.8], wiper: [1.2, 7.4, 2.0, 9.9] },
  ac: [[14, 8, 0.55], [38, 8, 0.55]], gear: [[14, 6, 1.2, "g"], [21, 5, 1.0, "b"], [27, 5, 0.9, "t"], [33, 4, 1.0]],
  onRoof: (c, g) => aerial(28, 11.8),
});
export const rfMet = (c) => unit({ ...c, cabL: false, cabR: false }, { ...MET,
  rows: [{ xs: [2.0, 15.8, 20.4, 25.0, 39.8, 44.4], y: 6.6, w: 3.6, h: 2.5, r: 0.3 }],
  doors: [cerDoor(c, 7.4, 3.6), cerDoor(c, 30.8, 3.6)].map((d) => ({ ...d, y0: 3.3, y1: 9.9 })),
  paint: (c, g) => cerPaint(c, g.L, { roof: 11.0, skirt: 3.2, y: 4.0 }),
  ac: [[3, 6, 0.55], [36, 8, 0.55]], gear: [[13, 6, 1.2, "g"], [20, 5, 1.0, "b"], [26, 6, 0.9, "t"], [33, 4, 1.0]],
  onRoof: (c, g) => panGear(c.L / 2, 11.8, 1),
});

export const TYPES = {
  rf103Cab: { name: "Series 103 end car", kind: "emu", amenities: ["first", "cafe"] },
  rf103: { name: "Series 103 car", kind: "emu", amenities: ["first", "cafe"] },
  rf112Power: { name: "Series 102/112 power car", kind: "electric", pan: true },
  rf112Coach: { name: "Series 102/112 Talgo coach", kind: "talgo", amenities: ["first", "cafe"] },
  rf106Power: { name: "Series 106 Avril power car", kind: "electric", pan: true },
  rf106Coach: { name: "Series 106 Avril coach", kind: "talgo", amenities: ["first", "cafe"] },
  rf100Power: { name: "Series 100 power car", kind: "electric", pan: true },
  rf100: { name: "Series 100 trailer", kind: "coach", amenities: ["first", "cafe"] },
  rf130Power: { name: "Series 130 power car", kind: "electric", pan: true },
  rf130Coach: { name: "Series 130 Talgo coach", kind: "talgo", amenities: ["first", "cafe"] },
  rf120Cab: { name: "Series 120/121 end car", kind: "emu", pan: true },
  rf120: { name: "Series 120/121 car", kind: "emu" },
  rf104Cab: { name: "Series 104/114 end car", kind: "emu", pan: true },
  rf104: { name: "Series 104/114 car", kind: "emu" },
  rf449Cab: { name: "Series 449 end car", kind: "emu", pan: true },
  rf449: { name: "Series 449 car", kind: "emu" },
  rf599Cab: { name: "Series 599 end car", kind: "emu" },
  rf599: { name: "Series 599 car", kind: "emu" },
  rfCiviaCab: { name: "Civia end car", kind: "emu", pan: true },
  rfCivia: { name: "Civia car", kind: "emu" },
  rf447Cab: { name: "Series 447 motor car", kind: "emu", pan: true },
  rf447: { name: "Series 447 trailer", kind: "emu" },
  rf450Cab: { name: "Series 450 double-deck motor car", kind: "bilevel", emu: true, pan: true },
  rf450: { name: "Series 450 double-deck trailer", kind: "bilevel", emu: true },
  rfMetCab: { name: "Metre-gauge unit end car", kind: "emu" },
  rfMet: { name: "Metre-gauge unit car", kind: "emu", pan: true },
};
// oneEnd: single-cab equipment, drawn cab-left and mirrored at the back of
// a train. variant: Avlo's purple and Rodalies' orange are the same cars
// painted differently.
const paintVariant = (c) => (isAvlo(c) ? "avlo" : isRodalies(c) ? "rod" : "");
const M = (draw, len, oneEnd = false) => ({ draw, len, oneEnd, variant: paintVariant });
export const MODELS = {
  rf103Cab: M(rf103Cab, 84.2, true), rf103: { ...M(rf103, 81.3), variant: (c) => paintVariant(c) + (v103Pan(c) ? "p" : "") },
  rf112Power: M(rf112Power, 65.6, true), rf112Coach: M(rf112Coach, 43.1),
  rf106Power: M(rf106Power, 75, true), rf106Coach: M(rf106Coach, 42.65),
  rf100Power: M(rf100Power, 72.6, true), rf100: M(rf100, 61.35),
  rf130Power: M(rf130Power, 68.1, true), rf130Coach: M(rf130Coach, 43.1),
  rf120Cab: M(rf120Cab, 89.7, true), rf120: M(rf120, 84.6),
  rf104Cab: M(rf104Cab, 89.0, true), rf104: M(rf104, 86.6),
  rf449Cab: M(rf449Cab, 69.5, true), rf449: M(rf449, 61.8),
  rf599Cab: M(rf599Cab, 85.0, true), rf599: M(rf599, 79.1),
  rfCiviaCab: M(rfCiviaCab, 70.5, true), rfCivia: M(rfCivia, 60.4),
  rf447Cab: M(rf447Cab, 85.0, true), rf447: M(rf447, 79.3),
  rf450Cab: M(rf450Cab, 87.2, true), rf450: M(rf450, 87.2),
  rfMetCab: M(rfMetCab, 58.0, true), rfMet: M(rfMet, 54.0),
};

const set = (label, ...units) => ({ label, units });
const sets = {
  s103: set("Series 103 (Siemens Velaro) trainset, 8 cars", ["rf103Cab", 1], ["rf103", 6], ["rf103Cab", 1]),
  s112: set("Series 112 or 102 (Talgo 350) trainset: two power cars and twelve coaches", ["rf112Power", 1], ["rf112Coach", 12], ["rf112Power", 1]),
  avlo: set("Avlo Series 112 (Talgo 350) trainset, some Avlo trains Series 106", ["rf112Power", 1], ["rf112Coach", 12], ["rf112Power", 1]),
  s106: set("Series 106 (Talgo Avril) trainset: two power cars and twelve coaches", ["rf106Power", 1], ["rf106Coach", 12], ["rf106Power", 1]),
  s100: set("Series 100 trainset: two power cars and eight trailers (some trains Series 102 or 112)", ["rf100Power", 1], ["rf100", 8], ["rf100Power", 1]),
  s130: set("Series 130 (Talgo 250) trainset: two power cars and eleven coaches (Series 730 hybrids on some routes)", ["rf130Power", 1], ["rf130Coach", 11], ["rf130Power", 1]),
  s120: set("Series 120 (CAF) four-car unit, sometimes two coupled", ["rf120Cab", 1], ["rf120", 2], ["rf120Cab", 1]),
  s121: set("Series 121 (CAF) four-car unit, sometimes two coupled", ["rf120Cab", 1], ["rf120", 2], ["rf120Cab", 1]),
  s104: set("Series 104 or 114 four-car unit", ["rf104Cab", 1], ["rf104", 2], ["rf104Cab", 1]),
  s449: set("Series 449 five-car electric unit (older 440 and 470 units on some lines)", ["rf449Cab", 1], ["rf449", 3], ["rf449Cab", 1]),
  s599: set("Series 599 three-car diesel unit", ["rf599Cab", 1], ["rf599", 1], ["rf599Cab", 1]),
  civia: set("Civia electric unit, usually 5 cars (some trains Series 446 or 447)", ["rfCiviaCab", 1], ["rfCivia", 3], ["rfCiviaCab", 1]),
  s447: set("Series 447 or 446 three-car unit, often two coupled (some trains Civia)", ["rf447Cab", 1], ["rf447", 1], ["rf447Cab", 1]),
  s450: set("Series 450 six-car double-deck unit (Series 451 three-car sets on some trains)", ["rf450Cab", 1], ["rf450", 4], ["rf450Cab", 1]),
  met: set("Metre-gauge unit (series 433-438 electric or 526-529 diesel, drawn as one)", ["rfMetCab", 1], ["rfMet", 1], ["rfMetCab", 1]),
};
// Where a long-distance train runs, from its first and last stations.
const ends = (t) => `${t.origin || ""} ${t.destination || ""}`;
// Media Distancia lines that aren't electrified, run with diesel 599s.
const DIESEL = /Badajoz|C[áa]ceres|M[ée]rida|Zafra|Plasencia|Huelva|Almer[íi]a|Granada|Guadix|Soria|Teruel|Cuenca|Zamora|Sanabria|Ferrol|Lugo|Monforte|Talavera|Algeciras|Ronda|Linares|Ja[ée]n|Cartagena|[ÁA]guilas|Alcoi|Alcoy|Utiel|Huesca|Canfranc|Valen[çc]a|Porto|Vigo|Pontevedra/;
export const TYPICAL = {
  renfe: (t) => {
    const e = ends(t);
    switch (t.route) {
      case "AVE":
        if (/Barcelona|Figueres|Girona|M[áa]laga/.test(e)) return sets.s103;
        if (/Coru|Vigo|Santiago|Ourense|Gij[óo]n|Oviedo|Pontevedra/.test(e)) return sets.s106;
        if (/Sevilla/.test(e) && /Madrid/.test(e)) return sets.s100;
        return sets.s112;
      case "AVE Internacional": return sets.s106;
      case "Avlo": return sets.avlo;
      case "Alvia": return /Pamplona|Logro|Hendaya|Ir[úu]n|Salamanca|Huelva/.test(e) ? sets.s120 : sets.s130;
      case "Euromed": case "Intercity": return sets.s130;
      case "Avant": case "Avant Exprés": return /Lleida|Ourense|Coru|Santiago|Vigo|Pontevedra|Calatayud|Zaragoza/.test(e) ? sets.s121 : sets.s104;
      default: return DIESEL.test(e) ? sets.s599 : sets.s449;
    }
  },
  cercanias: (t) => {
    const [line, ...rest] = (t.route || "").split(" "), core = rest.join(" ");
    const n = Number((line.match(/\d+/) || [0])[0]);
    if (line === "T1") return null;                                     // Cádiz's tram-train isn't Renfe's
    if (core === "Rodalies") return /^R2/.test(line) ? sets.s450 : sets.s447;
    if (/Le[óo]n|Ferrol|Cartagena/.test(core) || (core === "Asturias" && n >= 4) || (core === "Bilbao" && n >= 4) || (core === "Santander" && n >= 2)) return sets.met;
    if (/Valencia|Bilbao|San Sebasti|Murcia|Santander/.test(core)) return sets.s447;
    return sets.civia;
  },
};

// Facts come in km/h and kW; the page converts them back for display.
const kmh = (v) => Math.round((v / 1.609344) * 10) / 10, kw = (v) => Math.round(v / 0.7457);
const WP = "https://en.wikipedia.org/wiki/", ES = "https://es.wikipedia.org/wiki/";
export const FACTS = {
  rf103Cab: { model: "Siemens Velaro E (Series 103)", type: "High-speed electric multiple unit", builder: "Siemens", built: "2005–2009", fleet: "26 eight-car sets",
    topSpeedMph: kmh(300), powerHp: kw(8800), seats: 404, lengthFt: 84.2,
    about: "Renfe's AVE on Madrid–Barcelona and Madrid–Málaga, the second Velaro after Germany's ICE 3. Seats are for the whole set; one reached 403.7 km/h in a 2006 test, then a record for an unmodified train.", source: `${WP}Renfe_Class_103` },
  rf103: { model: "Series 103 middle car", type: "High-speed electric multiple unit", builder: "Siemens", built: "2005–2009", fleet: "26 eight-car sets",
    topSpeedMph: kmh(300), powerHp: kw(8800), lengthFt: 81.3,
    about: "A middle car of the Velaro E. Its traction motors are spread under half the train's cars rather than in power cars.", source: `${WP}Renfe_Class_103` },
  rf112Power: { model: "Talgo 350 (Series 102 and 112)", type: "High-speed power car", builder: "Talgo, with Adtranz/Bombardier", built: "2005–2010",
    fleet: "16 Series 102 and 30 Series 112 sets", topSpeedMph: kmh(330), powerHp: kw(8000), lengthFt: 65.6,
    about: "Each Talgo 350 has a power car at both ends of twelve articulated coaches; the long, flattened nose gave it the nickname \"Pato\" (duck). Avlo's low-cost trains are 112s in purple.", source: `${WP}Renfe_Class_102` },
  rf112Coach: { model: "Talgo 350 coach (Series 102 and 112)", type: "Articulated coach", builder: "Talgo", built: "2005–2010",
    fleet: "12 per set", topSpeedMph: kmh(330), seats: 353, lengthFt: 43.1,
    about: "Talgo's short coaches ride on single wheel pairs at the joints, not trucks. Seats are for the whole set (316 on a 102, 353 on a 112).", source: `${WP}Renfe_Class_102` },
  rf106Power: { model: "Talgo Avril (Series 106)", type: "High-speed power car", builder: "Talgo", built: "2016–2024", fleet: "30 sets, 15 of them variable gauge",
    topSpeedMph: kmh(300), powerHp: kw(8800), lengthFt: 75,
    about: "Talgo's newest high-speed train, in AVE service since May 2024 to Asturias and Galicia, its variable-gauge sets running on into the Iberian-gauge network.", source: `${WP}Talgo_AVRIL` },
  rf106Coach: { model: "Talgo Avril coach (Series 106)", type: "Articulated coach", builder: "Talgo", built: "2016–2024", fleet: "12 per set",
    topSpeedMph: kmh(300), seats: 507, lengthFt: 42.65,
    about: "The Avril's coaches are wide and low, with the floor at platform height. Seats are for the whole set: 507, or 581 in the Avlo layout.", source: `${WP}Talgo_AVRIL` },
  rf100Power: { model: "Series 100 power car", type: "High-speed power car", builder: "GEC-Alsthom and CAF", built: "1992", fleet: "22 sets",
    topSpeedMph: kmh(300), powerHp: kw(8800), lengthFt: 72.6,
    about: "The first AVE, built on the TGV Atlantique design for the 1992 Madrid–Seville line it still mostly serves. Refurbished in 2007–12.", source: `${WP}Renfe_Class_100` },
  rf100: { model: "Series 100 trailer", type: "Articulated coach", builder: "GEC-Alsthom and CAF", built: "1992", fleet: "8 per set",
    topSpeedMph: kmh(300), seats: 332, lengthFt: 61.35,
    about: "The eight trailers between the power cars share trucks at their joints, as on a TGV. Seats are for the whole set.", source: `${WP}Renfe_Class_100` },
  rf130Power: { model: "Talgo 250 (Series 130 and 730)", type: "Dual-gauge power car", builder: "Talgo and Bombardier", built: "2007–2010",
    fleet: "45 sets; 15 rebuilt as hybrid Series 730", topSpeedMph: kmh(250), powerHp: kw(4800), lengthFt: 68.1,
    about: "Alvia's gauge-changing trains, which switch between the standard-gauge high-speed lines and the Iberian-gauge network without stopping; also Euromed and Intercity services. The 730s add diesel generator cars for unelectrified lines.", source: `${WP}Renfe_Class_130` },
  rf130Coach: { model: "Talgo 250 coach (Series 130)", type: "Articulated coach", builder: "Talgo", built: "2007–2010", fleet: "11 per set",
    topSpeedMph: kmh(250), seats: 299, lengthFt: 43.1,
    about: "Talgo Series 7 coaches with gauge-changing wheel pairs. Seats are for the whole set, 63 of them first class.", source: `${WP}Renfe_Class_130` },
  rf120Cab: { model: "CAF Series 120 and 121", type: "Dual-gauge electric multiple unit", builder: "CAF, with Alstom", built: "2006–2009",
    fleet: "57 Series 120, 29 Series 121", topSpeedMph: kmh(250), powerHp: kw(4000), seats: 238, lengthFt: 89.7,
    about: "Four-car gauge-changing units: the 120s run Alvia services such as Madrid–Pamplona and Barcelona–Bilbao, the 121s Avant services in Catalonia and Galicia. Seats are for a Series 120 set.", source: `${WP}Renfe_Class_120` },
  rf120: { model: "Series 120 and 121 middle car", type: "Dual-gauge electric multiple unit", builder: "CAF, with Alstom", built: "2006–2009",
    fleet: "57 Series 120, 29 Series 121", topSpeedMph: kmh(250), powerHp: kw(4000), lengthFt: 84.6,
    about: "A middle car of the CAF dual-gauge unit, which changes gauge on the move at about 30 km/h.", source: `${WP}Renfe_Class_120` },
  rf104Cab: { model: "Series 104 and 114", type: "High-speed electric multiple unit", builder: "Alstom (104 with CAF)", built: "2004, 2008–2010",
    fleet: "20 Series 104, 13 Series 114", topSpeedMph: kmh(250), powerHp: kw(4000), lengthFt: 89.0,
    about: "The Avant's four-car units, from Alstom's Pendolino family without the tilt: the 104s Madrid–Toledo and Ciudad Real, the 114s Madrid–Segovia–Valladolid.", source: `${WP}Renfe_Class_104` },
  rf104: { model: "Series 104 and 114 middle car", type: "High-speed electric multiple unit", builder: "Alstom (104 with CAF)", built: "2004, 2008–2010",
    fleet: "20 Series 104, 13 Series 114", topSpeedMph: kmh(250), lengthFt: 86.6,
    about: "A middle car of the Avant's four-car units.", source: `${WP}Renfe_Class_104` },
  rf449Cab: { model: "CAF Series 449", type: "Electric multiple unit", builder: "CAF, Mitsubishi traction", built: "2008–2011", fleet: "57 five-car units",
    topSpeedMph: kmh(160), powerHp: kw(2400), seats: 263, lengthFt: 69.5,
    about: "Renfe's Media Distancia electric unit, five cars on shared trucks, up to three coupled. Seats are for the whole unit.", source: `${ES}Serie_449_de_Renfe` },
  rf449: { model: "Series 449 middle car", type: "Electric multiple unit", builder: "CAF, Mitsubishi traction", built: "2008–2011", fleet: "57 five-car units",
    topSpeedMph: kmh(160), powerHp: kw(2400), lengthFt: 61.8,
    about: "A middle car of the 449, sharing a truck with each neighbor.", source: `${ES}Serie_449_de_Renfe` },
  rf599Cab: { model: "CAF Series 599", type: "Diesel multiple unit", builder: "CAF", built: "2008–2010", fleet: "50 three-car units",
    topSpeedMph: kmh(160), powerHp: kw(1400), seats: 185, lengthFt: 85,
    about: "The diesel sister of the 449, on Media Distancia lines without wires: Extremadura, Madrid–Soria, Granada–Almería, Galicia and more. Seats are for the whole unit.", source: `${ES}Serie_599_de_Renfe` },
  rf599: { model: "Series 599 middle car", type: "Diesel multiple unit", builder: "CAF", built: "2008–2010", fleet: "50 three-car units",
    topSpeedMph: kmh(160), lengthFt: 79.1,
    about: "The 599's middle trailer; the two end cars carry its four diesel engines.", source: `${ES}Serie_599_de_Renfe` },
  rfCiviaCab: { model: "Civia (Series 462–465)", type: "Electric multiple unit", builder: "CAF, Alstom and Siemens", built: "2003–2010",
    fleet: "248 units of 2 to 5 cars", topSpeedMph: kmh(120), powerHp: kw(2200), seats: 277, lengthFt: 70.5,
    about: "The low-floor Cercanías train built from interchangeable cars, from the two-car 462 to the five-car 465; most Cercanías networks run them. Seats are for a five-car 465.", source: `${ES}Civia` },
  rfCivia: { model: "Civia middle car", type: "Electric multiple unit", builder: "CAF, Alstom and Siemens", built: "2003–2010",
    fleet: "248 units of 2 to 5 cars", topSpeedMph: kmh(120), lengthFt: 60.4,
    about: "A middle car of a Civia; the low-floor section is in one of them, with space for bicycles and wheelchairs.", source: `${ES}Civia` },
  rf447Cab: { model: "Series 447 (and 446)", type: "Electric multiple unit", builder: "CAF, Alstom, Siemens, ABB and Adtranz", built: "1992–2001 (446: 1989–1993)",
    fleet: "183 Series 447, 170 Series 446 built", topSpeedMph: kmh(120), powerHp: kw(2400), seats: 234, lengthFt: 85,
    about: "Three-car commuter units, a motor car with a cab at each end: the 447s across Rodalies, Valencia, Bilbao and other networks, the slower 446s in Madrid and Bilbao. Seats are for the whole unit.", source: `${ES}Serie_447_de_Renfe` },
  rf447: { model: "Series 447 trailer", type: "Electric multiple unit", builder: "CAF, Alstom, Siemens, ABB and Adtranz", built: "1992–2001",
    fleet: "183 Series 447 built", topSpeedMph: kmh(120), lengthFt: 79.3,
    about: "The unpowered middle car of a 446 or 447, three pairs of doors a side like the motor cars.", source: `${ES}Serie_447_de_Renfe` },
  rf450Cab: { model: "Series 450 and 451", type: "Double-deck electric multiple unit", builder: "GEC-Alsthom and CAF", built: "1993–1995",
    fleet: "24 six-car 450s, 12 three-car 451s", topSpeedMph: kmh(140), powerHp: kw(2960), seats: 1008, lengthFt: 87.2,
    about: "Spain's double-deck commuter units, first run as push-pull trains behind locomotives and later given motor cars. Madrid and Barcelona; the 451s only on Rodalies' R2. Seats are for a six-car 450.", source: `${ES}Serie_450_de_Renfe` },
  rf450: { model: "Series 450 double-deck trailer", type: "Double-deck electric multiple unit", builder: "GEC-Alsthom and CAF", built: "1993–1995",
    fleet: "24 six-car 450s, 12 three-car 451s", topSpeedMph: kmh(140), lengthFt: 87.2,
    about: "A double-deck trailer of the 450, its lower deck dropped between the trucks.", source: `${ES}Serie_450_de_Renfe` },
  rfMetCab: { model: "Metre-gauge Cercanías unit", type: "Electric or diesel multiple unit", builder: "Several (mostly CAF)",
    fleet: "Series 433–438 electric, 526–529 diesel",
    about: "The former FEVE narrow-gauge lines Renfe has run since 2013 use a mix of short electric and diesel units; Trainsheet draws them as one. Exact models vary by line.", source: `${WP}Renfe_Operadora` },
  rfMet: { model: "Metre-gauge Cercanías unit, middle car", type: "Electric or diesel multiple unit", builder: "Several (mostly CAF)",
    fleet: "Series 433–438 electric, 526–529 diesel",
    about: "A middle car of a metre-gauge unit, drawn generically.", source: `${WP}Renfe_Operadora` },
};
