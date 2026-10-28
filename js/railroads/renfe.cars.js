// Renfe's cars (scripts/railroads/renfe.py), for both its agencies: the
// AVE, Avlo, Alvia, Avant and Media Distancia fleets (renfe) and Cercanías
// and Rodalies (cercanias). Neither feed names the train's units (vehicle.id
// is the train number), so every train is drawn as what usually runs on its
// service or line. Trainsheet's own side views, from published dimensions
// and photographs; the lettering and emblems are drawn here, not copied.
import { newId, bilevel } from "../carmodels.js?v=dev";
import { aveMark, renfeMark, avloMark, aveV } from "./renfelogos.js?v=dev";
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
// A coach's outline with its roof rising at one end ("L" or "R") to the
// height h of the power car coupled there, as the Talgo 350's end coaches do:
// level with it for about 14 ft, then easing down to the coach's roof.
function rampOutline(x0, x1, sill, roof, [side, h]) {
  const m = (h + roof) / 2;
  if (side === "L") return poly([[x0, sill], [x1, sill], [x1, roof - 1.2], ["q", x1, roof, x1 - 1.2, roof], [25, roof], ["q", 22, roof, 20, m], ["q", 18, h, 14, h],
    [x0 + 0.6, h], ["q", x0, h, x0, h - 0.6]]);
  const L = x0 + x1;
  return poly([[x0, sill], [x1, sill], [x1, h - 0.6], ["q", x1, h, x1 - 0.6, h], [L - 14, h], ["q", L - 18, h, L - 20, m], ["q", L - 22, roof, L - 25, roof],
    [x0 + 1.2, roof], ["q", x0, roof, x0, roof - 1.2]]);
}
function talgoCoach(c, { roof = 11.2, sill = 2.6, rows, doorX = 1.2, paint, band, door: dr = [2.4, 2.9, 6.9, 0.55], bandX = null, ramp = null, mark = null, sign: sg = null, windows = null }) {
  const { L } = c, x0 = 0.3, x1 = L - 0.3;
  // ramp: [side, height] the roof rising at that end to the power car's.
  const d = ramp ? rampOutline(x0, x1, sill, roof, ramp) : bodyOutline(x0, x1, sill, roof, { endR: 1.2 });
  let s = "";
  for (const x of [0, L]) {
    s += rect(x - 1.3, 1.7, 2.6, 2.4, "currentColor", 0, 'opacity="0.85" rx="0.3"') + circle(x, 1.45, 1.45, "currentColor") +
      circle(x, 1.45, 1.15, "none", 0, `stroke="${C.steelDark}" stroke-width="0.5"`) + circle(x, 1.45, 0.75, "none", 0, `stroke="${C.steelDark}" stroke-width="0.9"`) + circle(x, 1.45, 0.35, C.steelDark) +
      rect(x - 1.7, 3.3, 3.4, 0.5, "currentColor", 0, 'opacity="0.7"');
  }
  const avlo = isAvlo(c);
  const [bx0, bx1] = bandX || [3.2, L - 3.2];
  s += shell(d, avlo ? RF.avlo : RF.white, paint(c, L) + (band ? rect(bx0, band[0], bx1 - bx0, band[1], avlo ? "#3d0f38" : RF.band, 0, 'rx="0.4"') : "") + (windows ? windows(c, L) : ""));
  s += fairing(3.4, L - 3.4, sill, 0.8, avlo ? "#3a1030" : RF.fair);
  for (const [x, y, w, h] of rows) s += win(x, y, w, h, 0.4);
  const [dw, dy, dh, gy = 0.55] = dr;
  s += door(doorX, dy, dw, dh, { glassY: gy, glassH: 0.3, fill: avlo ? RF.orange : "rgba(0,0,0,0.08)" }) + rect(doorX + 0.15, dy - 0.2, dw - 0.3, 0.2, "currentColor", 0, 'opacity="0.7"') +
    lines([[3.0, sill + 0.2, 3.0, roof - 1.0], [L - 3.0, sill + 0.2, L - 3.0, roof - 1.0]], "rgba(0,0,0,0.22)", 0.45);
  // The air-suspension columns at the joints, inside the end walls.
  for (const x of [0.55, L - 1.35]) s += rect(x, sill + 0.4, 0.8, 5.8, "#4a4f56", 0.4, 'rx="0.3"') + line(x + 0.4, sill + 1.0, x + 0.4, sill + 5.6, "rgba(255,255,255,0.25)", 0.5);
  s += aircon(L / 2 - 5.5, roof, 11, 0.6) + line(2.0, roof - 0.65, L - 2.0, roof - 0.65, "rgba(0,0,0,0.2)", 0.5) + cover(ramp ? L / 2 + 7 : 4.0, roof, 6.0, 0.35) + aerial(ramp?.[0] === "R" ? 6 : L - 6, roof) +
    (sg ? sign(...sg) : sign(doorX + 0.2, roof - 1.6, 2.0, 0.4));
  s += mark ? mark(c, L) : avlo ? letters(c, L - 8, roof - 2.3, 0.9, "avlo", "#ffffff", { weight: 800 }) : renfeWord(c, L - 7.5, sill + 1.5, 0.75);
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
function powerCar(c, { nose, roof, sill = 3.4, glass, centers, cabLen, paint, side = [], panX, lamp, skirt, word, hiGrilles = true, marks = null }) {
  const avlo = isAvlo(c);
  return unit({ ...c, cabL: true, cabR: false }, {
    roof, sill, cornerR: 1.0, end: 0.6, noTrucks: true, nose, cabLen, badge: false, diaphragm: [3.2, roof - 1.4],
    paint: (c, g) => paint(c, g.L), rows: [],
    doors: [{ x: cabLen + 0.6, w: 2.2, y0: sill + 0.3, y1: sill + 6.6, glassY: 0.6, glassH: 0.25, grabs: false, fill: "rgba(0,0,0,0.08)" }],
    cabArt: () => path(poly(glass), C.glass) + path(poly(glass.slice(0, 3).map(([x, y], i) => [x + (i === 1 ? 0 : 0.6), y])), "rgba(255,255,255,0.1)") +
      (!word ? "" : avlo ? letters(c, word[0], word[1], 1.0, "avlo", "#ffffff", { weight: 800 }) : renfeWord(c, word[0], word[1], 1.0)),
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
      if (hiGrilles) s += grille(cabLen + 3.4, roof - 2.6, 3.0, 1.2, 0.3) + grille(g.L - 8, roof - 2.6, 3.0, 1.2, 0.3);
      s += lines([[cabLen + 3, sill + 0.3, cabLen + 3, roof - 0.9], [g.L - 9, sill + 0.3, g.L - 9, roof - 0.9]], "rgba(0,0,0,0.25)", 0.45);
      s += rect(lamp[0] + 0.9, lamp[1] + 0.6, 0.55, 0.35, "#f6f3dc", 0.4, 'rx="0.12"');
      return s + (marks ? marks(c, g.L) : "");
    },
  });
}

// --- Series 103 (Siemens Velaro E, 2005-09): 26 eight-car sets, 200 m,
// 8,800 kW spread under half the cars, 300 km/h (350 certified). End cars
// 25.68 m with a long tapered nose, middle cars 24.78 m. As photographed
// side-on at Málaga (2024) and at Barcelona-Sants and Zaragoza: one plug door
// a side on each car, with a tall oval window, at the car's end toward the
// nearer cab (behind the long lounge window on an end car); the windows in
// long dark panes; the roof and the top of the nose blue-grey; a thin grey
// line over a broad aubergine stripe low on the side, both sweeping down the
// nose to its tip; the wi-fi sign by each door; Renfe's "renfe AVE" mark at
// each car's far end and beside the door of the middle cars.
const V103 = { roof: 12.8, sill: 3.4, cornerR: 1.0, end: 0.6, trucks: { centers: 57, wb: 8.2, d: 36 }, diaphragm: [3.8, 11.8], badge: false };
const V103_CAP = "#8d9aa8", V103_SKIRT = "#cdd1d5";
// The stripe's drop toward the nose tip (0 behind x = nose).
const dropAt = (x, nose) => (nose && x < nose ? (1 - x / nose) ** 2 : 0);
// The grey line and aubergine stripe along L, sweeping down over the first
// nose ft (top/bottom edges sampled along the curve).
function aveStripes(L, nose = 0, { lo = 4.9, hi = 5.75, grey = 6.0, x0 = 0 } = {}) {
  const xs = nose ? [x0, ...Array.from({ length: 12 }, (_, i) => x0 + ((nose - x0) * (i + 1)) / 12), L] : [x0, L];
  const band = (top, bot, fill) => path(poly([...xs.map((x) => [x, top(x)]), ...[...xs].reverse().map((x) => [x, bot(x)])]), fill);
  return band((x) => grey + 0.13 - dropAt(x, nose) * 1.15, (x) => grey - dropAt(x, nose) * 1.15, "#8d949b") +
    band((x) => hi - dropAt(x, nose) * 1.0, (x) => lo - dropAt(x, nose) * 0.65, RF.purple);
}
// A run of window panes from a to b, ylo..yhi, split by thin pillars about
// every pitch ft (the Velaro's long glazing); front: a slanted front edge
// [x at the bottom, x at the top].
function panes(a, b, ylo, yhi, pitch = 6.4, front = null) {
  const n = Math.max(1, Math.round((b - a) / pitch)), w = (b - a) / n;
  let s = front ? path(poly([[front[0], ylo - 0.5], [front[1], yhi], [a, yhi], [a, ylo], [front[0] + 5.6, ylo]]), C.glass, 0, `stroke="${C.gasket}" stroke-width="0.6"`) : "";
  s += rect(a, ylo, b - a, yhi - ylo, C.glass, 0, `rx="0.35" stroke="${C.gasket}" stroke-width="0.6"`) + rect(a + 0.12, ylo + (yhi - ylo) * 0.6, b - a - 0.24, (yhi - ylo) * 0.3, C.glassLight);
  for (let i = 1; i < n; i++) s += rect(a + i * w - 0.12, ylo, 0.24, yhi - ylo, "#3d434a");
  return s;
}
// The plug door with its tall oval window.
const ovalDoor = (x, y0 = 4.1, y1 = 11.75, w = 3.2) => door(x, y0, w, y1 - y0, { glass: false, grabs: false, fill: "rgba(0,0,0,0.05)" }) +
  `<ellipse cx="${x + w / 2}" cy="${(y0 + y1) / 2 + 0.85}" rx="${(w * 0.27).toFixed(2)}" ry="1.62" fill="#c3c8cd"/>` +
  `<ellipse cx="${x + w / 2}" cy="${(y0 + y1) / 2 + 0.85}" rx="${(w * 0.22).toFixed(2)}" ry="1.45" fill="${C.glass}" stroke="${C.gasket}" stroke-width="0.5"/>`;
// The wi-fi sign: a dot and three arcs, aubergine.
const wifi = (x, y, r = 0.5, ink = "#2b2d31") => circle(x, y, r * 0.13, ink) +
  [0.42, 0.72, 1.02].map((k) => path(`M${(x - r * k * 0.75).toFixed(2)} ${(y + r * k * 0.66).toFixed(2)}A${(r * k).toFixed(2)} ${(r * k).toFixed(2)} 0 0 0 ${(x + r * k * 0.75).toFixed(2)} ${(y + r * k * 0.66).toFixed(2)}`, "none", 0, `stroke="${ink}" stroke-width="${(r * 0.16).toFixed(2)}" stroke-linecap="round"`)).join("");
export const rf103Cab = (c) => unit({ ...c, cabL: true, cabR: false }, { ...V103,
  nose: [[1.4, 3.4], [0.5, 4.1], ["q", 0.2, 5.4, 1.4, 6.3], [10.0, 11.0], ["q", 13.6, 12.8, 20.0, 12.8]],
  rows: [], doors: [], cabLen: 18,
  paint: (c, g) => rect(0, 0, g.L, 17, RF.white) + rect(0, 0, g.L, 3.4, V103_SKIRT) +
    path("M0 5.4Q2 6.8 4.2 7.9Q6.5 8.9 10.6 9.9Q16 10.6 20 10.85Q23 11.2 24.4 11.85L" + g.L + " 11.85L" + g.L + " 16L0 16Z", V103_CAP) + rect(0, 11.8, g.L, 0.1, "#8b9198") +
    aveStripes(g.L, 22) + panes(11.4, 23.0, 7.15, 9.8, 7.2, [7.8, 11.4]) + panes(32.8, g.L - 7.4, 7.15, 9.8, 7.2) +
    aveMark(c, g.L - 4.0, 8.2, 0.85) + wifi(29.2, 10.6),
  cabArt: () => path(poly([[5.6, 8.7], [8.2, 10.4], [10.6, 11.5], [11.4, 11.2], [10.4, 9.95], [7.2, 9.0]]), C.glass, 0, `stroke="${C.gasket}" stroke-width="0.6"`) +
    path("M1.6 4.5Q2.6 3.9 4.4 4.3", "none", 0, 'stroke="rgba(0,0,0,0.35)" stroke-width="0.5"'),
  front: { lamp: [1.9, 5.7], horn: [17.0, 12.8], wiper: [7.4, 9.4, 9.4, 10.8] },
  ac: [[20, 9, 0.6], [c.L - 16, 10, 0.6]],
  more: (c, g) => path(poly([[1.4, 3.4], [2.0, 1.3], [7.2, 1.3], [7.6, 3.4]]), V103_SKIRT, 0.5) + fairing(19.4, g.L / 2 + 22.2, g.sill, 1.4, V103_SKIRT) + aerial(36, g.roof) + ovalDoor(24.6),
});
// The two transformer cars, second from each end, carry the pantographs;
// the back half of the train is the front half turned round (doors toward
// the nearer cab).
const v103Pan = (c) => c.index === 1 || c.index === c.count - 2;
const v103Back = (c) => c.count > 2 && c.index >= c.count / 2;
export const rf103 = (c) => {
  const L = c.L, back = v103Back(c), X = (x, w = 0) => (back ? L - x - w : x);
  return unit({ ...c, cabL: false, cabR: false }, { ...V103,
    rows: [], doors: [],
    paint: (c, g) => rect(0, 0, L, 17, RF.white) + rect(0, 0, L, 3.4, V103_SKIRT) + rect(0, 11.85, L, 3, V103_CAP) + rect(0, 11.8, L, 0.1, "#8b9198") +
      aveStripes(L) + panes(back ? 7.4 : 11.6, L - (back ? 11.6 : 7.4), 7.15, 9.8, 7.2) +
      aveMark(c, X(8.9), 8.2, 0.8) + aveMark(c, X(L - 4.0), 8.2, 0.85) + wifi(X(6.0), 10.6),
    ac: [[5, 10, 0.6], [L - 16, 10, 0.6]],
    more: (c, g) => fairing(L / 2 - 22.2, L / 2 + 22.2, g.sill, 1.4, V103_SKIRT) + ovalDoor(X(1.3, 3.2)) +
      (v103Pan(c) ? panGear(L - 24, 12.8) + cover(24, 12.8, 22, 0.6) : cover(26, 12.8, 30, 0.45)),
  });
};

// --- Series 102 and 112 (Talgo 350, power cars by Adtranz/Bombardier,
// 2005-10): 16 and 30 sets, a power car at each end of twelve Talgo
// coaches, 200 m, 8,000 kW, 330 km/h; the power cars' long flattened
// noses earned them the nickname "Pato" (duck). Avlo's 112s are purple.
// The power car (20 m) from a line scan of a 102 at Madrid (dllu, 2018, the
// shape) and photographs of 2024 (the paint): a long low beak rising to a
// small windshield high under the roof; the cab door behind it; one grille
// high near the inner end; trucks at about 28% and 82% of the length, the
// body's skirt panels between them. AVE's paint: white, the cab's top and the
// roof blue-grey back to the cab door, a thin dark grey line over the
// aubergine stripe low along the side, Renfe's "renfe AVE" big mid-side and
// the big grey-and-aubergine V at the inner end. Avlo's: the same body in
// Avlo's magenta under the blue-grey top, a turquoise, an orange and a white
// band falling back from the cab door to the floor, "renfe avlo" mid-side.
// The coaches (13.14 m) from the same scan: a door at one end, a dark band
// with five windows (four in Business), the wi-fi sign over the door, a
// small "renfe AVE" at the far end over the band; the coaches next to the
// power cars rise at that end to the power car's roof.
const PATO_CAP = "#93a4b8";
// The grey line over the aubergine stripe, at the coaches' height all along
// the train, sweeping down the power car's beak toward its tip.
const patoStripes = (L, nose = 0) => {
  const xs = nose ? [-1, ...Array.from({ length: 12 }, (_, i) => ((i + 1) * nose) / 12), L + 1] : [-1, L + 1];
  const band = (top, bot, fill) => path(poly([...xs.map((x) => [x, top - dropAt(Math.max(x, 0), nose) * 0.9]), ...[...xs].reverse().map((x) => [x, bot - dropAt(Math.max(x, 0), nose) * 0.75])]), fill);
  return band(4.33, 4.15, "#4a4f55") + band(3.95, 3.25, RF.purple);
};
const patoBody = (L) => poly([[0.4, 2.7], ["q", 0.1, 3.2, 0.2, 3.9], ["q", 0.6, 4.4, 1.6, 4.5], [4.9, 5.4], ["q", 8.6, 6.4, 10.4, 7.4], ["q", 13.0, 9.2, 15.6, 10.8],
  ["q", 18.0, 12.2, 21.0, 12.6], ["q", 22.4, 12.9, 24.0, 12.9], [L - 1.0, 12.9], ["q", L - 0.3, 12.9, L - 0.3, 12.2], [L - 0.3, 2.9], [13.2, 2.9], [12.6, 1.8], [3.0, 1.8], ["q", 1.0, 2.0, 0.4, 2.7]]);
export const rf112Power = (c) => {
  const L = c.L, avlo = isAvlo(c), body = avlo ? RF.avlo : RF.white, ink = avlo ? "#3d1035" : "#5a5f66";
  // The paint, clipped to the body.
  let liv = rect(-1, 0, L + 2, 15, body) +
    path("M-1 4.2L9.8 5.65Q16 7.6 22.6 10.4Q24.4 11.4 24.8 12.2L" + (L + 1) + " 12.25L" + (L + 1) + " 15L-1 15Z", PATO_CAP) + rect(-1, 12.2, L + 2, 0.1, "#7f8c9a");
  if (avlo) {
    // The three bands, falling back from the cab door to the floor.
    const band = (a, b, c2, d2, fill) => path(`M${a} ${b}L${a + c2} ${b}L${d2[0] + d2[1]} 2.9L${d2[0]} 2.9Z`, fill);
    liv += band(12.5, 9.2, 1.5, [29.5, 2.0], RF.teal) + band(15.0, 10.5, 0.45, [33.0, 0.6], "#ffffff") + band(16.5, 12.0, 1.5, [41.0, 2.0], RF.orange);
  } else liv += patoStripes(L, 26);
  // The beak's dark spoiler under the white.
  liv += path("M-1 1.5L13.4 1.5L13.4 2.5Q8 2.6 3 2.75Q1.2 2.9 -1 3.4Z", "#33373c");
  let s = shell(patoBody(L), body, liv);
  // Trucks; the skirt panels between them; the beak's underside.
  s += truck(18.5, { wb: 8.9, d: 41, kind: "loco", top: 2.9 }) + truck(54.0, { wb: 8.9, d: 41, kind: "loco", top: 2.9 }) +
    rect(23.6, 1.9, 25.3, 1.0, avlo ? "#7c1468" : "#dfe2e5", 0.4) + lines([[30, 1.95, 30, 2.85], [37, 1.95, 37, 2.85], [43, 1.95, 43, 2.85]], "rgba(0,0,0,0.25)", 0.4);
  // Windshield, headlight, the cab door, the hatch, the grille.
  s += path(poly([[10.7, 8.7], [13.5, 10.3], [16.2, 10.95], [17.2, 9.95], [12.3, 8.6]]), C.glass, 0, `stroke="${C.gasket}" stroke-width="0.7"`) +
    path(poly([[2.4, 4.75], [6.8, 5.2], [6.5, 5.6], [3.0, 5.25]]), "#2a2f36", 0.4) + rect(5.6, 5.1, 0.7, 0.3, "#f6f3dc", 0, 'rx="0.1"') +
    door(24.9, 3.2, 3.2, 7.2, { glass: false, grabs: true, fill: "rgba(0,0,0,0.05)" }) + circle(26.3, 6.4, 0.22, ink) + circle(26.3, 5.1, 0.22, ink) +
    rect(19.1, 5.2, 1.8, 2.5, "none", 0, `rx="0.35" stroke="rgba(0,0,0,0.18)" stroke-width="0.25"`) + path(poly([[11.0, 4.6], [12.4, 4.95], [12.4, 4.25]]), "#16181b") +
    grille(47.1, 7.2, 5.2, 2.5, 0.3);
  // The marks.
  s += avlo ? avloMark(c, 40.5, 8.0, 2.5) : aveMark(c, 38.0, 7.7, 2.6) + aveV(c, L - 3.6, 8.15, 6.0);
  // Roof: the pantograph near the inner end, its gear, covers, horns.
  s += panGear(L - 10, 12.9) + cover(28, 12.9, 18, 0.5) + slats(28.6, 13.0, 16.8, 0.32, 0.6, "rgba(0,0,0,0.3)") + horns(21.6, 12.75) + aerial(26, 12.9);
  return s + coupled({ ...c, coupledL: false }, 2.9, 11.9);
};
export const rf112Coach = (c) => talgoCoach(c, { roof: 11.2, sill: 1.6, doorX: 2.8, door: [3.6, 1.85, 8.1, 0.37], rows: [], band: isAvlo(c) ? null : [4.75, 3.0], bandX: [6.4, 41.2],
  ramp: c.index === 1 ? ["L", 12.9] : c.index === c.count - 2 ? ["R", 12.9] : null, sign: [1.15, 6.7, 1.4, 0.55],
  windows: (c, L) => seq(9.8, 6.1, 5).map((x) => win(x, 4.95, 4.85, 2.6, 0.45)).join(""),
  mark: (c, L) => (isAvlo(c) ? "" : aveMark(c, 39.2, 8.85, 0.55) + wifi(1.9, 9.6)),
  paint: (c, L) => (isAvlo(c) ? avloPaint(L, { roof: 10.5, skirt: 1.6 }) : rect(0, 0, L, 17, RF.white) + rect(0, 10.6, L, 4, "#c9ced3") + rect(0, 0, L, 1.6, RF.skirt) +
    patoStripes(L)) + (c.index === 1 || c.index === c.count - 2 ? rect(0, 10.9, L, 4, PATO_CAP) : "") });

// --- Series 106 (Talgo Avril, 2021-24): 30 sets, half of them variable
// gauge, two power cars and twelve wide, low Talgo coaches, 201.8 m, 8,800
// kW, 300 km/h in service; 20 AVE and 10 Avlo (Wikipedia, Serie 106 de
// Renfe). The AVE sets (photographed at A Coruña 2025 and Zamora 2024):
// pearl white, a black mask from the nose over the windshield and back along
// the cab, a thin aubergine line along the bottom; on each power car Renfe's
// "renfe AVE" big mid-side and small on the nose behind the headlight, two
// tall slatted grilles, and the big grey-and-aubergine V at its inner end;
// the coaches' windows in a dark band. The Avlo sets (Valencia and Madrid,
// 2024): Avlo's magenta under the same black mask, an orange, a white and a
// turquoise band rising from the floor mid-car to the cab door, "renfe avlo"
// mid-side and "avlo" on the nose; the coaches' doors orange.
const AVRIL = [[0.6, 3.0], [0.3, 3.8], ["q", 0.6, 4.8, 3.0, 5.4], [12.0, 9.2], ["q", 15.5, 12.5, 21.0, 12.6]];
const AVRIL_MASK = "M2.4 6.0Q8.0 6.9 12.0 8.3Q16.0 9.7 20.6 10.3L21.5 13.2L2 13.2Z";
const avrilPaint = (c, L, { roof = 12.0, skirt = 3.3, mask = false } = {}) => isAvlo(c) ? avloPaint(L, { roof, skirt }) :
  rect(0, 0, L, 17, "#eeece7") + rect(0, roof, L, 3, RF.roof) + rect(0, roof - 0.1, L, 0.12, "#8b9198") + rect(0, 0, L, skirt, RF.skirt) + rect(0, skirt, L, 0.3, RF.purple) +
  (mask ? path(AVRIL_MASK, "#16181b") : "");
// Avlo's Avril power car: magenta, the three bands rising toward the cab
// door, the black mask over them.
const avrilAvloPower = (L) => {
  const band = (top, w, bot, wb, fill) => path(`M${top} 12.4L${top + w} 12.4L${bot + wb} 3.3L${bot} 3.3Z`, fill);
  return rect(0, 0, L, 17, RF.avlo) + rect(0, 12.0, L, 3, RF.avloDark) + rect(0, 0, L, 3.3, "#4a0f44") +
    band(13.0, 2.0, 29.0, 2.0, RF.teal) + band(16.4, 0.7, 33.5, 0.7, "#ffffff") + band(19.0, 2.4, 40.0, 2.6, RF.orange) + path(AVRIL_MASK, "#16181b");
};
export const rf106Power = (c) => powerCar(c, { nose: AVRIL, roof: 12.6, sill: 3.3, cabLen: 18, centers: 40,
  glass: [[7.8, 7.0], [12.6, 10.1], [16.0, 11.6], [17.0, 10.2], [11.8, 7.3]],
  lamp: [3.6, 4.6], skirt: [[0.6, 3.0], [1.2, 1.2], [8.8, 1.2], [9.2, 3.3]], word: null, hiGrilles: false, side: [],
  paint: (c, L) => (isAvlo(c) ? avrilAvloPower(L) : avrilPaint(c, L, { mask: true })),
  marks: (c, L) => grille(26.6, 7.2, 2.0, 3.4, 0.3) + grille(51.6, 7.2, 1.5, 3.4, 0.3) +
    (isAvlo(c) ? avloMark(c, 39.0, 8.4, 2.4) + avloMark(c, 12.6, 6.5, 0.6, { renfe: null }) :
      aveMark(c, 39.0, 8.0, 2.3) + aveMark(c, 12.4, 6.6, 0.7) + aveV(c, L - 4.6, 8.7, 5.6)) });
export const rf106Coach = (c) => talgoCoach(c, { roof: 11.8, sill: 2.4, rows: seq(6.2, 6.9, 5).map((x) => [x, 6.0, 5.2, 3.2]), band: isAvlo(c) ? null : [5.75, 3.7],
  paint: (c, L) => avrilPaint(c, L, { roof: 11.0, skirt: 2.4 }), mark: () => "" });

// --- Series 100 (GEC-Alsthom and CAF, 1992): 22 sets on the TGV
// Atlantique pattern, two power cars and eight articulated trailers on
// shared trucks, 200 m, 8,800 kW, 300 km/h; the first AVEs, still
// Madrid–Seville. Power cars 22.13 m, trailers 18.7 m. As photographed at
// Hornachuelos (2025): white, a thin dark grey line over the aubergine stripe
// low along the train, sweeping down the nose; the power car's side plain
// but for the louvres high on its rear half and Renfe's small "renfe AVE" on
// the nose behind the headlight; the trailers' windows separate (no dark
// band), a door at the end toward the nearer power car with the small
// "renfe AVE" over it; the first trailer carries the big grey-and-aubergine
// V at its end against the power car.
export const rf100Power = (c) => powerCar(c, {
  nose: [[0.8, 3.3], [0.4, 4.0], ["q", 0.6, 5.0, 2.4, 5.6], [8.6, 8.8], ["q", 10.6, 11.4, 13.2, 12.4], ["q", 14.4, 12.9, 17.0, 12.9]],
  roof: 12.9, sill: 3.3, cabLen: 15, centers: 46, glass: [[8.8, 9.0], [11.0, 11.0], [13.6, 12.1], [14.2, 10.2], [11.0, 9.0]],
  lamp: [2.8, 4.4], skirt: [[0.8, 3.3], [1.4, 1.2], [8.0, 1.2], [8.4, 3.3]], word: null, hiGrilles: false, side: [],
  paint: (c, L) => rfPaint(L, { y: 4.8, nose: 12, line: AVE_LINE }) + path(`M14.6 9.6L${L + 1} 9.6L${L + 1} 15L13.2 15Z`, RF.roof) + rect(14.6, 9.55, L - 14, 0.1, "#8b9198"),
  marks: (c, L) => grille(33, 10.0, 19, 1.7, 0.45) + aveMark(c, 10.4, 6.6, 0.65) });
// The trailers' door is at the end toward the nearer power car (left in
// the front half of the train, right in the back half).
const r100Back = (c) => c.count > 2 && c.index >= c.count / 2;
export const rf100 = (c) => {
  const L = c.L, back = r100Back(c), first = c.index === 1 || c.index === c.count - 2, X = (x, w = 0) => (back ? L - x - w : x);
  const dx = first ? 6.6 : 1.0;
  return unit({ ...c, cabL: false, cabR: false }, {
    roof: 11.4, sill: 3.4, cornerR: 1.0, end: 0.3, noTrucks: true, diaphragm: [3.7, 10.6], badge: false,
    rows: [{ xs: seq(back ? 6.0 : 14.6, 5.8, 7).map((x) => x), y: 6.9, w: 3.4, h: 2.4, r: 0.4 }],
    doors: [{ x: X(dx, 2.5), w: 2.5, y0: 3.6, y1: 10.0, glassY: 0.55, glassH: 0.3, grabs: false, fill: "rgba(0,0,0,0.08)" }],
    paint: (c, g) => rfPaint(L, { y: 4.8, roof: 10.6, line: AVE_LINE }) + aveMark(c, X(dx + 4.6), 9.4, 0.45) + (first ? aveV(c, X(3.4), 8.0, 4.4) + wifi(X(10.6), 9.4) : ""),
    ac: [[6, 10, 0.55], [L - 17, 10, 0.55]],
    onRoof: (c, g) => cover(20, g.roof, 14, 0.4) + aerial(38, g.roof),
    more: (c, g) => truck(0, { wb: 9.8, d: 36, top: 3.4 }) + truck(L, { wb: 9.8, d: 36, top: 3.4 }) + fairing(7.2, L - 7.2, g.sill, 1.3, RF.fair) +
      sign(X(dx + 0.4, 1.6), 9.0, 1.6, 0.4),
  });
};

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

// Cercanías (photographs of Civias, 446s and 453s, 2024-26): white, a red
// line over an aubergine one low on the side, the cab's front red around the
// windshield, the emblem by the cab. (Drawn before with a broad red band
// over a gray line, the paint of the 2000s, corrected.) Rodalies
// (Catalonia): white, an orange front and orange doors, a thin red line
// under the windows, its R by the cab.
const cerPaint = (c, L, { cab = false, roof = 12.3, skirt = 3.6, y = 4.6 } = {}) => {
  let s = rect(0, 0, L, 17, RF.white) + rect(0, roof, L, 3, RF.roof) + rect(0, roof - 0.1, L, 0.12, "#8b9198") + rect(0, 0, L, skirt, RF.skirt);
  if (isRodalies(c)) return s + rect(0, y + 2.2, L, 0.22, RF.red) + (cab ? path(`M0 ${skirt}L3.4 ${skirt}L3.4 ${roof - 0.6}Q3.4 ${roof} 2.6 ${roof}L0 ${roof}Z`, RF.rod) : "");
  return s + rect(0, y + 0.6, L, 0.4, RF.red) + rect(0, y, L, 0.45, RF.purple) + (cab ? path(`M0 ${skirt}L2.8 ${skirt}L2.8 ${roof - 0.6}Q2.8 ${roof} 2.0 ${roof}L0 ${roof}Z`, RF.red) : "");
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
// The two series share the body and differ inside and in their traction
// (the 446 good for 100 km/h, the 447 for 120), so one drawing serves both
// under their own names (photographs of 446s on Madrid's C-7 and of 447s,
// 2024-26).
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
// (Cercanías in Asturias, Cantabria, Bilbao, León, Ferrol and Cartagena).
// Its electric units and its diesel railcars are drawn class by class.
// Common: 1,000 mm gauge, 1.5 kV overhead, small cars about 2.5 m wide and
// 3.6 m tall on trucks with 760 mm wheels.
const MET = { roof: 11.8, sill: 3.2, cornerR: 0.9, end: 0.5, trucks: { centers: 40, wb: 7.0, d: 28 }, diaphragm: [3.4, 10.8], badge: false };
const metDoor = (c, x, w = 3.6) => ({ ...cerDoor(c, x, w), y0: 3.3, y1: 9.9 });
const metFront = { lamp: [0.75, 5.0], coupler: [0, 2.6], skirt: [[0.9, 3.2], [1.1, 1.4], [4.4, 1.4], [4.8, 3.2]], horn: [4.0, 11.8], wiper: [1.2, 7.4, 2.0, 9.9] };

// Series 436 (FEVE 3600; Siemens and Sunsundegui, 2000-03 and 2006-07; 21
// units; Spanish Wikipedia, "Serie 3600 de FEVE"): two motor cars, each with
// a cab, two double doors a side on each car, 420 kW, 100 km/h; Asturias
// C-4 to C-7, Bilbao C-4 and C-5, Cantabria C-2. Car length isn't published:
// about 18 m, from photographs. A raked front under a big windshield. The
// Cercanías paint (photograph of 3627 at Oviedo, 2025): white, the cab end
// red round the windshield down to a white lower front, a red band low on
// the side, the windows in a dark band.
const M436 = { ...MET, roof: 12.0, trucks: { centers: 39, wb: 7.0, d: 30 } };
export const rf436 = (c) => unit({ ...c, cabL: true, cabR: false }, { ...M436,
  nose: [[0.9, 3.2], [0.7, 5.6], ["q", 0.8, 6.6, 1.6, 7.6], [3.4, 11.0], ["q", 4.0, 12.0, 5.6, 12.0]],
  rows: [{ xs: [8.6, 19.0, 24.0, 29.0, 34.0, 47.0, 52.0], y: 6.6, w: 4.2, h: 2.6, r: 0.3 }],
  doors: [metDoor(c, 13.4, 4.0), metDoor(c, 41.0, 4.0)], cabLen: 6,
  paint: (c, g) => cerPaint(c, g.L, { roof: 11.2, skirt: 3.2, y: 4.0 }) + rect(8.2, 6.4, g.L - 9.0, 3.0, RF.band, 0, 'rx="0.4"') +
    path("M0 5.2L4.6 5.2Q6.4 7.0 6.6 9.6L6.8 12.4L0 12.4Z", RF.red) + renfeWord(c, 3.0, 4.2, 0.6, "#ffffff") + cerEmblem(c, 39.2, 7.9, 1.1),
  cabArt: () => path(poly([[1.7, 7.7], [3.3, 10.9], [5.3, 11.3], [5.6, 8.0]]), C.glass) + sign(3.4, 11.2, 2.0, 0.38),
  front: { ...metFront, lamp: [0.8, 5.4], horn: [6.2, 12.0], wiper: [2.2, 7.9, 3.2, 10.3] },
  ac: [[16, 9, 0.55]], gear: [[14, 6, 1.2, "g"], [21, 5, 1.0, "b"], [27, 6, 0.9, "t"], [34, 5, 1.0]],
  onRoof: (c, g) => panGear(g.L - 11, 12.0) + aerial(30, 12.0),
});

// Series 438 (FEVE 3800; CAF, 1992; 16 units): three cars, a motor car with
// the pantograph, a trailer and a cab trailer (FEVE 6800), 880 kW, up to
// four units coupled (funet's FEVE archive); Santander's metre-gauge lines
// to Liérganes and Cabezón de la Sal. About 16 m a car (48 m a unit; car
// length not published). A flat front, its big windshield and the
// destination sign in one black surround; two double doors a side, the
// windows deep and dark. FEVE's paint, kept by Renfe (photograph of 3811 at
// Santander, Commons): cream, a yellow line over an aubergine stripe low on
// the side and across the front, "renfe feve" on the front.
const M438 = { ...MET, roof: 11.6, trucks: { centers: 34, wb: 6.6, d: 30 } };
const fevePaint = (L, cab) => rect(0, 0, L, 17, RF.cream) + rect(0, 11.0, L, 3, "#cfc8b6") + rect(0, 10.9, L, 0.12, "#a39c8b") + rect(0, 0, L, 3.2, RF.skirt) +
  rect(0, 3.6, L, 0.55, RF.magenta) + rect(0, 4.4, L, 0.35, RF.feveYellow) + rect(cab ? 6.0 : 0.8, 6.2, L - (cab ? 6.6 : 1.6), 3.4, RF.band, 0, 'rx="0.3"') +
  (cab ? path("M0 6.0L5.4 6.0L5.4 11.1L0 11.1Z", "#16181b") : "");
export const rf438Cab = (c) => unit({ ...c, cabL: true, cabR: false }, { ...M438,
  nose: [[0.7, 3.2], [0.6, 10.2], ["q", 0.7, 11.4, 1.8, 11.6], [3.4, 11.6]],
  rows: [{ xs: [6.6, 10.6, 25.6, 30.0, 34.4, 45.4], y: 6.4, w: 3.8, h: 3.0, r: 0.2 }],
  doors: [metDoor(c, 20.6, 3.6), metDoor(c, 39.6, 3.6)].map((d) => ({ ...d, fill: "rgba(0,0,0,0.06)" })), cabLen: 5.5,
  paint: (c, g) => fevePaint(g.L, true) + renfeWord(c, 3.0, 5.4, 0.55) + letters(c, 3.3, 4.9, 0.32, "feve", RF.magenta, { weight: 500 }),
  cabArt: () => path(poly([[0.7, 6.3], [0.75, 10.8], [5.2, 10.8], [5.2, 6.3]]), C.glass) + sign(1.4, 10.0, 2.6, 0.4) + rect(5.5, 3.6, 0.1, 7.4, "rgba(0,0,0,0.3)"),
  front: { ...metFront, horn: [3.6, 11.6], wiper: [1.4, 6.6, 2.6, 9.6] },
  ac: [[12, 8, 0.6]], gear: [[13, 6, 1.2, "g"], [20, 5, 1.0, "b"], [26, 5, 0.9, "t"], [32, 4, 1.0]],
  onRoof: (c, g) => panGear(g.L - 12, 11.6) + aerial(26, 11.6),
});
export const rf438 = (c) => unit({ ...c, cabL: false, cabR: false }, { ...M438,
  rows: [{ xs: [1.6, 5.8, 20.4, 24.8, 29.2, 44.4, 48.6], y: 6.4, w: 3.8, h: 3.0, r: 0.2 }],
  doors: [metDoor(c, 15.2, 3.6), metDoor(c, 38.2, 3.6)].map((d) => ({ ...d, fill: "rgba(0,0,0,0.06)" })),
  paint: (c, g) => fevePaint(g.L, false), ac: [[8, 8, 0.6], [32, 8, 0.6]], gear: [[12, 6, 1.0, "b"], [20, 5, 0.9, "t"], [28, 6, 1.0, "b"]],
});
// Series 435 (FEVE 3500; CAF, 1990s; Spanish Wikipedia: 15.24 m a car):
// Asturias' three-car units, the same CAF family and layout as the 438 on
// shorter cars, still in FEVE's white with a burgundy band low on the side
// and a thin burgundy line over it (photograph of 3527 at Perlora, Commons).
const m435Paint = (L, cab) => rect(0, 0, L, 17, RF.white) + rect(0, 11.0, L, 3, RF.roof) + rect(0, 0, L, 3.2, RF.skirt) + rect(0, 3.6, L, 1.1, "#8b1e3a") + rect(0, 5.0, L, 0.2, "#8b1e3a") +
  rect(cab ? 6.0 : 0.8, 6.2, L - (cab ? 6.6 : 1.6), 3.4, RF.band, 0, 'rx="0.3"') + (cab ? path("M0 6.0L5.4 6.0L5.4 11.1L0 11.1Z", "#16181b") : "");
export const rf435Cab = (c) => unit({ ...c, cabL: true, cabR: false }, { ...M438, trucks: { centers: 32, wb: 6.6, d: 30 },
  nose: [[0.7, 3.2], [0.6, 10.2], ["q", 0.7, 11.4, 1.8, 11.6], [3.4, 11.6]],
  rows: [{ xs: [6.6, 10.6, 24.4, 28.6, 41.8], y: 6.4, w: 3.8, h: 3.0, r: 0.2 }],
  doors: [metDoor(c, 19.4, 3.6), metDoor(c, 36.2, 3.6)].map((d) => ({ ...d, fill: "rgba(0,0,0,0.06)" })), cabLen: 5.5,
  paint: (c, g) => m435Paint(g.L, true) + letters(c, 30.5, 4.15, 0.6, "feve", "#ffffff", { weight: 600 }),
  cabArt: () => path(poly([[0.7, 6.3], [0.75, 10.8], [5.2, 10.8], [5.2, 6.3]]), C.glass) + sign(1.4, 10.0, 2.6, 0.4),
  front: { ...metFront, horn: [3.6, 11.6], wiper: [1.4, 6.6, 2.6, 9.6] },
  ac: [[12, 8, 0.6]], gear: [[12, 6, 1.2, "g"], [19, 5, 1.0, "b"], [25, 5, 0.9, "t"]],
  onRoof: (c, g) => panGear(g.L - 11, 11.6),
});
export const rf435 = (c) => unit({ ...c, cabL: false, cabR: false }, { ...M438, trucks: { centers: 32, wb: 6.6, d: 30 },
  rows: [{ xs: [1.6, 5.8, 19.8, 24.0, 40.6, 44.8], y: 6.4, w: 3.8, h: 3.0, r: 0.2 }],
  doors: [metDoor(c, 14.4, 3.6), metDoor(c, 33.6, 3.6)].map((d) => ({ ...d, fill: "rgba(0,0,0,0.06)" })),
  paint: (c, g) => m435Paint(g.L, false), ac: [[8, 8, 0.6], [30, 8, 0.6]], gear: [[12, 6, 1.0, "b"], [20, 5, 0.9, "t"]],
});

// Series 529 (FEVE 2900; Sunsundegui with Siemens, 2000s): single diesel
// railcars with a cab at each end, 17.7 m; León-Guardo and the shuttles of
// Ferrol and Cartagena (Wikipedia, Renfe's rolling stock tables). A raked
// front; a crew door behind each cab, a double door off-center on each
// side; big windows. FEVE's paint, kept by Renfe (photograph of 2911,
// Commons): white, navy low on the side and across the front over a yellow
// line, the windows set in navy, a broad yellow curve rising beside the
// door, "renfe feve" lettered on the front.
const M529 = { ...MET, roof: 11.9, sill: 3.4, trucks: { centers: 37, wb: 6.6, d: 30 } };
// A car with a shaped cab at each end: drawn with its cab at the left, the
// last cut ft at the right replaced by the same drawing turned round.
const twoCabs = (draw, cut) => (c) => {
  const id = newId(), L = c.L;
  const a = draw({ ...c, coupledR: false }), b = draw({ ...c, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: false });
  return `<clipPath id="${id}"><rect x="-3" y="-3" width="${L - cut + 3}" height="30"/></clipPath><clipPath id="${id}b"><rect x="-3" y="-3" width="${cut + 3}" height="30"/></clipPath>` +
    `<g clip-path="url(#${id})">${a}</g><g transform="matrix(-1 0 0 1 ${L} 0)"><g clip-path="url(#${id}b)">${b}</g></g>`;
};
const rf529One = (c) => unit({ ...c, cabL: true, cabR: false }, { ...M529,
  nose: [[0.9, 3.4], [0.7, 5.6], ["q", 0.7, 6.8, 1.4, 7.8], [2.8, 11.0], ["q", 3.4, 11.9, 4.8, 11.9]],
  rows: [{ xs: [9.4, 14.6, 19.8, 37.6, 42.8], y: 6.6, w: 4.6, h: 3.1, r: 0.25 }],
  doors: [{ x: 6.0, w: 2.2, y0: 3.5, y1: 10.2, glassY: 0.55, glassH: 0.32, grabs: false, fill: "rgba(0,0,0,0.05)" }, { ...metDoor(c, 26.8, 4.4), y0: 3.5, y1: 10.2, fill: RF.feveBlue },
    { x: c.L - 8.2, w: 2.2, y0: 3.5, y1: 10.2, glassY: 0.55, glassH: 0.32, grabs: false, fill: "rgba(0,0,0,0.05)" }], cabLen: 5,
  paint: (c, g) => {
    const L = g.L;
    return rect(0, 0, L, 17, RF.white) + rect(0, 11.2, L, 3, RF.roof) + rect(0, 0, L, 3.4, RF.skirt) + rect(0, 3.4, L, 0.45, RF.feveYellow) + rect(0, 3.85, L, 1.6, RF.feveBlue) +
      rect(8.8, 6.3, 16.4, 3.7, RF.feveBlue, 0, 'rx="0.3"') + rect(37.0, 6.3, 11.4, 3.7, RF.feveBlue, 0, 'rx="0.3"') +
      path("M32.4 3.9Q33.6 8.2 35.6 10.6L36.8 10.6Q35.2 7.8 34.6 3.9Z", RF.feveYellow) + path("M31.4 3.9Q32.8 8.6 34.6 10.6L35.6 10.6Q33.6 8.2 32.4 3.9Z", "#ffffff");
  },
  cabArt: (c) => path(poly([[1.5, 7.9], [2.7, 10.7], [4.6, 11.1], [4.8, 7.9]]), C.glass) + renfeWord(c, 2.7, 6.3, 0.45) + letters(c, 3.0, 5.85, 0.3, "feve", RF.feveBlue, { weight: 500 }) +
    sign(2.9, 11.15, 1.8, 0.36),
  front: { ...metFront, lamp: [0.8, 5.8], coupler: [0, 2.8], skirt: [[0.9, 3.4], [1.1, 1.5], [4.4, 1.5], [4.8, 3.4]], horn: [5.4, 11.9], wiper: [1.9, 8.1, 2.8, 10.5] },
  ac: [[16, 10, 0.6]], gear: [[13, 8, 1.6, "g"], [22, 6, 1.0, "t"], [30, 5, 1.2, "b"]],
  onRoof: (c, g) => exhaust(29, 11.9) + aerial(34, 11.9),
});
export const rf529 = twoCabs(rf529One, 10);

// --- Series 730's generator cars (Talgo, 2012-13): the 15 Series 130 sets
// rebuilt as hybrids for Alvia services off the wires (Madrid-Badajoz,
// Madrid-Almería, the Galicia runs before the high-speed line) carry a diesel
// generator car behind each power car, two MTU engines in a Talgo-length
// body (Wikipedia, "Renfe Class 730"). No passenger windows: a door at one
// end, the generator room's grilles, the radiators' raised housing on the
// roof. The refurbished Alvia paint (photograph at Madrid-Chamartín,
// Commons): white, the two thin aubergine lines low on the side.
export const rf730Gen = (c) => {
  let s = talgoCoach(c, { roof: 11.0, rows: [[c.L - 9.6, 6.6, 2.2, 1.6]], paint: (c, L) => rfPaint(L, { y: 3.9, roof: 10.2, skirt: 2.6, lines: true }) });
  for (const x of [6.2, 14.0, 21.8]) s += grille(x, 5.0, 6.2, 4.4, 0.35);
  return s + rect(8, 11.0, 22, 0.9, "#a3aab2", 0.4, 'rx="0.3"') + slats(8.6, 11.1, 20.8, 0.7, 0.45, "rgba(0,0,0,0.35)") + exhaust(31, 11.0) + exhaust(33.4, 11.0);
};

// --- The locomotive-hauled Talgo Intercitys (Barcelona-Valencia-Alicante-
// Cartagena and Albacete-Cartagena, being withdrawn as Series 106s and the
// hybrids take over; geotren, October 2026): Talgo Pendular coaches (Series
// 6 and 7), 13.14 m, the same articulated design as the 130's, behind a
// Series 252 electric locomotive north of Alicante or a Series 334 diesel
// south of it. Their paint (photograph of a 334's Talgo near Cáceres,
// Commons): white, the windows in small groups in a dark band, a broad
// aubergine stripe low on the side with a thin one under it.
const talgoLines = (L, y) => rect(0, y, L, 0.55, RF.purple) + rect(0, y - 0.45, L, 0.2, RF.purple);
export const rfTalgo = (c) => talgoCoach(c, { roof: 11.0, rows: seq(5.4, 5.9, 6).map((x) => [x, 5.9, 4.0, 2.6]), band: [5.65, 3.1],
  paint: (c, L) => rect(0, 0, L, 17, RF.white) + rect(0, 10.2, L, 3, RF.roof) + rect(0, 0, L, 2.6, RF.skirt) + talgoLines(L, 4.2) });

// A locomotive with a cab at each end (Series 252, 334): the body, its
// livery clipped to it, two trucks, buffers and screw couplings, grilles,
// roof gear; k: { roof, sill, centers, wb, wheel, nose (rake in ft), paint,
// grilles, onRoof, word }.
function rfLoco(c, k) {
  const { L } = c, { roof, sill } = k, n = k.nose;
  const d = poly([[0.7, sill], [L - 0.7, sill], [L - 0.7, 8.6], ["q", L - 0.8, 9.6, L - 1.4, 10.2], [L - 0.9 - n, roof - 0.6], ["q", L - 1.4 - n, roof, L - 2.4 - n, roof],
    [2.4 + n, roof], ["q", 1.4 + n, roof, 0.9 + n, roof - 0.6], [1.4, 10.2], ["q", 0.8, 9.6, 0.7, 8.6]]);
  let s = "";
  for (const x of [L / 2 - k.centers / 2, L / 2 + k.centers / 2]) s += truck(x, { wb: k.wb, d: k.wheel, kind: "loco", top: sill });
  s += fairing(L / 2 - k.centers / 2 + k.wb / 2 + 2.2, L / 2 + k.centers / 2 - k.wb / 2 - 2.2, sill, 1.4, RF.fair) + rect(L / 2 - 3, sill - 2.6, 6, 1.2, "currentColor", 0, 'opacity="0.7" rx="0.5"');
  s += shell(d, RF.white, k.paint(c, L));
  // Windshields at both ends, cab side windows and doors, lamps.
  for (const [x, f] of [[0, 1], [L, -1]]) {
    const X = (v) => x + f * v;
    s += path(poly([[X(1.1), 10.3], [X(0.95 + n * 0.9), roof - 0.75], [X(2.6 + n), roof - 0.75], [X(2.6 + n), 10.3]]), C.glass) +
      win(Math.min(X(3.4 + n), X(5.2 + n)), 9.6, 1.8, 2.0, 0.25) + door(Math.min(X(6.0 + n), X(8.0 + n)), sill + 0.5, 2.0, 7.0, { glassY: 0.62, glassH: 0.26, grabs: true, fill: "rgba(0,0,0,0.06)" }) +
      rect(Math.min(X(0.75), X(1.35)), 6.2, 0.6, 0.45, "#f6f3dc", 0.4, 'rx="0.14"') + rect(Math.min(X(0.75), X(1.35)), 5.6, 0.6, 0.35, "#d0212e", 0.3, 'rx="0.1"');
  }
  for (const [x, y, w, h] of k.grilles) s += grille(x, y, w, h, 0.35);
  s += k.onRoof(c, L) + horns(4.0 + n, roof) + horns(L - 5.2 - n, roof);
  s += buffersAt(0.7, -1, sill) + buffersAt(L - 0.7, 1, sill);
  return s + (k.word ? renfeWord(c, ...k.word) : "");
}
// Side buffers and the screw coupling's hook at a body end.
const buffersAt = (x, side, sill) => rect(side < 0 ? x - 0.9 : x, sill - 0.9, 0.9, 0.75, "currentColor", 0, 'rx="0.2"') + rect(side < 0 ? x - 1.0 : x + 0.75, sill - 1.05, 0.25, 1.05, "currentColor") +
  rect(side < 0 ? x - 0.1 : x - 0.4, sill - 1.6, 0.5, 0.5, "currentColor", 0, 'opacity="0.85"');

// Series 334 (Vossloh, Valencia, 2006; 28; Spanish Wikipedia): the Euro
// 3000 diesel-electric, Bo'Bo', 2,400 kW, 200 km/h, built for the Talgo
// Altaria to Murcia; about 21 m over buffers like its Israeli sister the
// Euro 3000AC (en.wikipedia, "Stadler Euro"), 1,067 mm wheels. A cab at each
// end under a raked windshield; the machinery room's louvres high on the
// side, the radiator grille at one end; the exhaust and fans on the roof.
// Paint (photograph near Cáceres, Commons): white, gray low on the body, a
// broad aubergine stripe with a thin one under it, "renfe" on the side.
export const rf334 = (c) => rfLoco(c, { roof: 13.9, sill: 4.1, centers: 34.5, wb: 8.9, wheel: 42, nose: 1.4,
  paint: (c, L) => rect(0, 0, L, 16, RF.white) + rect(0, 0, L, 5.6, "#c7ccd1") + rect(0, 12.9, L, 2, RF.roof) + talgoLines(L, 6.2),
  grilles: [[11, 10.6, 13, 1.8], [27, 10.6, 9, 1.8], [45.5, 6.6, 7.5, 5.6]], word: [32, 8.2, 1.3],
  onRoof: (c, L) => rect(14, 13.85, 34, 0.5, "#a3aab2", 0.4, 'rx="0.2"') + exhaust(30, 14.3) + [50, 55].map((x) => path(`M${x - 2} 13.85Q${x} 14.6 ${x + 2} 13.85Z`, C.steelDark, 0.4)).join("") });
// Series 252 (Krauss-Maffei and Siemens with CAF and Macosa, 1991-96; 75;
// the 3 kV DC and 25 kV AC dual-system cousin of DB's class 120; Wikipedia,
// "Renfe Class 252"): Bo'Bo', 5,600 kW, 220 km/h, 20.38 m, 1,250 mm wheels.
// Hauls the last Talgo Intercitys north of Alicante. Paint (photograph at
// Barcelona-França, Commons): white, the roof and upper edge pale gray, two
// aubergine stripes low, "renfe" huge in aubergine over a gray swirl on the
// side.
export const rf252 = (c) => rfLoco(c, { roof: 13.6, sill: 4.2, centers: 32.8, wb: 9.2, wheel: 49, nose: 1.0,
  paint: (c, L) => rect(0, 0, L, 16, "#efede6") + rect(0, 11.6, L, 3, "#c9cdd1") + rect(0, 0, L, 4.6, "#9aa0a7") + talgoLines(L, 5.4) +
    path(`M${L * 0.32} 6.4Q${L * 0.38} 9.6 ${L * 0.45} 6.6Q${L * 0.5} 9.0 ${L * 0.55} 6.4`, "none", 0, 'stroke="#9aa0a7" stroke-width="0.6"'),
  grilles: [[10.4, 10.4, 6, 1.6], [L252 - 16.4, 10.4, 6, 1.6]], word: [L252 * 0.45, 9.0, 2.4],
  onRoof: (c, L) => pantograph(L - 17, 13.6, { up: true, facing: -1 }) + pantograph(17, 13.6, { up: false }) + cover(22, 13.6, L - 44, 0.5) });
const L252 = 66.9;

// --- Series 594 (CAF under licence from ABB's Danish IC3 design, 1997; 23
// units; Spanish Wikipedia): two cars, each with a cab, 47.35 m a unit,
// 1,200 kW, 160 km/h; the IC3's rubber-faced front without its gangway.
// Zaragoza-Canfranc since 2021 and other Aragon and Castile lines. Media
// Distancia's paint (photograph, Commons): white, an orange line over an
// aubergine stripe low on the side, the windows in a dark band; a single
// plug door at each end of each car.
export const rf594Cab = (c) => unit({ ...c, cabL: true, cabR: false }, { ...CAFMD, roof: 12.8, trucks: { centers: 52, wb: 8.2, d: 33 },
  nose: [[0.8, 3.6], [0.6, 9.6], ["q", 0.7, 11.8, 2.0, 12.5], ["q", 2.8, 12.8, 4.6, 12.8]],
  rows: [{ xs: seq(13.0, 5.4, 10), y: 7.2, w: 4.2, h: 2.6, r: 0.4 }],
  doors: [s120Door(8.2), s120Door(c.L - 4.0)], cabLen: 5,
  paint: (c, g) => rfPaint(g.L, { y: 5.0, roof: 12.0, skirt: 3.6, band: [12.4, 7.0, 3.1, 4.6] }) + rect(0.4, 3.6, 1.0, 1.8, "#2a2d31", 0, 'rx="0.3"') + renfeWord(c, 3.4, 6.0, 0.6),
  cabArt: () => path(poly([[0.7, 8.0], [0.9, 11.4], [4.0, 11.6], [4.0, 8.0]]), C.glass) + sign(1.2, 11.7, 2.4, 0.4),
  front: { lamp: [0.65, 6.2], coupler: [0, 2.9], skirt: [[0.8, 3.6], [1.0, 1.5], [4.6, 1.5], [5.0, 3.6]], horn: [5.0, 12.8], wiper: [1.2, 8.3, 2.0, 10.8] },
  ac: [[16, 10, 0.6]], gear: [[20, 10, 1.8, "g"], [32, 6, 1.0, "t"], [40, 5, 1.2, "b"]],
  onRoof: (c, g) => exhaust(34, 12.8) + aerial(28, 12.8),
});
// --- Series 598 (CAF, 2004; 21 units; Spanish Wikipedia): three cars, M-R-M,
// 75.93 m, 2.94 m wide, 4.17 m tall, 1,352 kW from four MAN engines, 160
// km/h; Seville's C-3, Media Distancia and Intercity in Andalusia and
// Extremadura. A long pointed nose; two single plug doors a side on each
// car. Paint (photograph at Ronda, Commons): white, an orange line along
// the windows' foot over an aubergine line, the windows in a dark band.
export const rf598Cab = (c) => unit({ ...c, cabL: true, cabR: false }, { ...CAFMD, roof: 13.7, trucks: { centers: 56, wb: 8.5, d: 33 },
  nose: [[1.6, 3.6], [0.8, 4.6], ["q", 0.6, 6.2, 2.0, 7.6], [7.0, 11.8], ["q", 9.0, 13.7, 12.6, 13.7]],
  rows: [{ xs: seq(21.0, 5.6, 9), y: 7.2, w: 4.6, h: 2.8, r: 0.4 }],
  doors: [s120Door(15.6), s120Door(c.L - 4.4)], cabLen: 13,
  paint: (c, g) => rfPaint(g.L, { y: 5.0, nose: 12, roof: 12.6, skirt: 3.6, band: [20.4, 7.0, 3.2, 5.0] }) + renfeWord(c, 6.4, 6.0, 0.9),
  cabArt: () => path(poly([[3.4, 8.2], [6.6, 11.4], [9.8, 12.8], [10.6, 10.0], [6.6, 8.4]]), C.glass),
  front: { lamp: [1.6, 5.4], skirt: [[1.6, 3.6], [2.2, 1.4], [8.6, 1.4], [9.0, 3.6]], horn: [13.0, 13.7], wiper: [4.6, 8.6, 6.6, 10.6] },
  ac: [[16, 10, 0.6]], gear: [[22, 10, 1.8, "g"], [34, 6, 1.0, "t"], [42, 7, 1.6, "g"]],
  onRoof: (c, g) => exhaust(36, 13.7) + exhaust(38.2, 13.7) + aerial(30, 13.7),
});
export const rf598 = (c) => unit({ ...c, cabL: false, cabR: false }, { ...CAFMD, roof: 13.7, trucks: { centers: 55, wb: 8.5, d: 33 },
  rows: [{ xs: seq(7.4, 5.6, 12), y: 7.2, w: 4.6, h: 2.8, r: 0.4 }],
  doors: [s120Door(1.6), s120Door(c.L - 4.4)], paint: (c, g) => rfPaint(g.L, { y: 5.0, roof: 12.6, skirt: 3.6, band: [6.8, 7.0, 3.2, 5.0] }),
  ac: [[7, 10, 0.6], [c.L - 17, 10, 0.6]], gear: [[22, 8, 1.2, "b"], [32, 7, 1.0, "t"], [42, 7, 1.2, "b"]],
});

// --- Series 453 (Stadler, 2025-26; 79 ordered; Railway Gazette and
// Renfe): Madrid's new Cercanías trains, single-deck FLIRT motor cars with a
// cab at each end of the train and KISS double-deck trailers between them,
// 3.05 m wide, 4.297 m tall over the double decks; the four-car T100
// (Mc-R-R-Mc) 97.72 m: 22.36 m end cars, 26.5 m trailers. In passenger
// service on the C-7 since August 2026, a few on the C-1. The paint
// (photographs of 453-001 and -003, 2026): white, the whole front red and
// the red sweeping back along the cab side in a point, the big Cercanías
// mark beside it; red doors; a red line over an aubergine one low on the
// side.
export const rf453Cab = (c) => unit({ ...c, cabL: true, cabR: false }, { roof: 13.4, sill: 3.4, cornerR: 1.0, end: 0.6, trucks: { centers: 50, wb: 8.9, d: 33 }, diaphragm: [3.6, 12.4], badge: false,
  nose: [[1.6, 3.4], [0.8, 4.4], ["q", 0.5, 6.4, 1.6, 7.8], [5.0, 11.8], ["q", 6.6, 13.4, 9.6, 13.4]],
  rows: [{ xs: [14.2, 32.0, 37.0, 42.0, 57.0, 62.4, 67.2], y: 7.0, w: 4.4, h: 3.2, r: 0.4 }],
  doors: [cerDoor(c, 25.4, 4.6), cerDoor(c, 49.8, 4.6)].map((d) => ({ ...d, y0: 3.5, fill: RF.red })), cabLen: 10,
  paint: (c, g) => cerPaint(c, g.L, { roof: 12.6, skirt: 3.4, y: 4.4 }) + path("M0 2.6L14 2.6L22 12.6L22 14L0 14Z", RF.red) + path("M12.8 2.6L15.6 2.6L23.4 12.6L21.2 12.6Z", RF.white) +
    circle(18.6, 8.2, 1.7, "#ffffff") + cerMark(18.6, 8.2, 1.5) + renfeWord(c, 19.0, 5.2, 0.8),
  cabArt: () => path(poly([[2.6, 8.0], [5.2, 11.6], [8.0, 12.8], [9.0, 9.4], [5.4, 8.0]]), C.glass) + sign(5.4, 12.0, 3.0, 0.42),
  front: { lamp: [1.4, 5.4], coupler: [0, 2.8], skirt: [[1.6, 3.4], [2.0, 1.4], [7.4, 1.4], [7.8, 3.4]], horn: [10.4, 13.4], wiper: [3.4, 8.3, 5.0, 10.6] },
  ac: [[30, 12, 0.7]], gear: [[24, 7, 1.4, "g"], [33, 6, 1.2, "b"], [41, 6, 1.0, "t"]],
  onRoof: (c, g) => panGear(g.L - 14, 13.4) + aerial(26, 13.4),
});
export const rf453 = (c) => unit({ ...c, cabL: false, cabR: false }, { roof: 14.1, sill: 3.9, cornerR: 1.0, end: 0.6, trucks: { centers: 64, wb: 8.9, d: 33 },
  diaphragm: [4.0, 12.6], badge: false, ends: { h: 13.4, len: 12, ramp: 3 }, drop: { a: 18.6, b: c.L - 18.6, y: 1.5 },
  rows: [{ xs: seq(28.6, 5.6, 6), y: 9.9, w: 4.6, h: 2.6, r: 0.4 }, { xs: seq(28.6, 5.6, 6), y: 4.4, w: 4.6, h: 2.8, r: 0.4 }, { xs: [6.4, c.L - 10.8], y: 7.4, w: 4.4, h: 2.8, r: 0.4 }],
  doors: [cerDoor(c, 21.2, 4.6), cerDoor(c, c.L - 25.8, 4.6)].map((d) => ({ ...d, y0: 1.7, y1: 9.4, fill: RF.red })),
  paint: (c, g) => cerPaint(c, g.L, { roof: 13.4, skirt: 3.9, y: 4.0 }) + cerMark(g.L / 2, 13.1, 0.5),
  ac: [[3, 8, 0.6, 13.4], [c.L - 11, 8, 0.6, 13.4]], gear: [[3.4, 3, 1.0, "b"], [c.L - 6.4, 3, 1.0, "b"]],
});

// --- Series 470 (CAF, Macosa and ATEINSA, 1980s; 47 still running in
// 2026) and 440R (the 440s rebuilt for regional and Intercity work, 7 left;
// Railvolution's fleet survey, 2024): three-car electric units of the 440
// family, a motor car with the pantograph, a trailer and a cab trailer, 75 m,
// 3 kV DC, 140 km/h (160 for the 440R). Two single plug doors a side on each
// car near its ends, windows between in a dark band. The 470s on León-Gijón
// over the Pajares pass, Valladolid-Santander and the Valencia and Córdoba
// regionals; the 440Rs on Bilbao-Miranda and Vitoria-San Sebastián. The 470's
// flat front, its windshield and the two marker windows in a black mask; the
// 440R's front rebuilt with a sloping windshield. Media Distancia's paint
// (photograph of a 470 at Pajares, Commons): white, the orange line over the
// aubergine stripe under the windows.
const S470 = { roof: 12.9, sill: 3.7, cornerR: 1.0, end: 0.6, trucks: { centers: 55, wb: 8.5, d: 34 }, diaphragm: [3.9, 11.9], badge: false };
const rf470Of = (rebuilt) => (c) => unit({ ...c, cabL: true, cabR: false }, { ...S470,
  nose: rebuilt ? [[0.9, 3.7], [0.7, 7.4], ["q", 0.9, 8.6, 1.8, 9.6], [3.0, 11.8], ["q", 3.6, 12.9, 5.2, 12.9]]
    : [[0.8, 3.7], [0.6, 10.6], ["q", 0.7, 12.2, 1.8, 12.7], ["q", 2.6, 12.9, 4.0, 12.9]],
  rows: [{ xs: seq(10.6, 5.2, 11), y: 7.3, w: 4.2, h: 2.6, r: 0.35 }],
  doors: [s120Door(6.2), s120Door(c.L - 4.4)], cabLen: 5,
  paint: (c, g) => rfPaint(g.L, { y: 5.4, roof: 12.1, skirt: 3.7, band: [10.0, 7.1, 3.0, 5.0] }) +
    (rebuilt ? path("M0.8 7.6Q1.6 9.2 3.0 11.8L4.6 12.4L4.6 7.6Z", "#16181b") : path("M0.6 7.4L0.6 11.9L4.6 11.9L4.6 7.4Z", "#16181b")) + renfeWord(c, 2.6, 6.2, 0.6),
  cabArt: () => (rebuilt ? path(poly([[1.4, 8.0], [2.8, 11.2], [4.4, 11.8], [4.4, 8.0]]), C.glass) : path(poly([[0.7, 8.2], [0.75, 11.0], [4.2, 11.0], [4.2, 8.2]]), C.glass)) +
    sign(1.4, 11.3, 2.4, 0.4),
  front: { lamp: [0.7, 5.6], coupler: [0, 2.9], skirt: [[0.8, 3.7], [1.0, 1.6], [4.8, 1.6], [5.2, 3.7]], horn: [5.0, 12.9], wiper: [1.2, 8.2, 2.0, 10.6] },
  ac: [[20, 10, 0.6]], gear: [[18, 8, 1.6, "g"], [27, 7, 1.3, "b"], [41, 8, 1.6, "g"], [50, 5, 1.0, "t"]],
  onRoof: (c, g) => panGear(g.L - 13, 12.9) + cover(32, 12.9, 14, 0.5) + slats(32.5, 13.0, 13, 0.3, 0.5, "rgba(0,0,0,0.35)"),
});
export const rf470Cab = rf470Of(false), rf440RCab = rf470Of(true);
export const rf470 = (c) => unit({ ...c, cabL: false, cabR: false }, { ...S470,
  rows: [{ xs: seq(6.4, 5.2, 13), y: 7.3, w: 4.2, h: 2.6, r: 0.35 }],
  doors: [s120Door(1.6), s120Door(c.L - 4.4)], paint: (c, g) => rfPaint(g.L, { y: 5.4, roof: 12.1, skirt: 3.7, band: [5.8, 7.1, 3.0, 5.0] }),
  ac: [[7, 10, 0.6], [c.L - 17, 10, 0.6]], gear: [[20, 7, 1.2, "b"], [30, 6, 1.0, "t"], [40, 7, 1.2, "b"]],
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
  rf446Cab: { name: "Series 446 motor car", kind: "emu", pan: true },
  rf446: { name: "Series 446 trailer", kind: "emu" },
  rf436: { name: "Series 436 (FEVE 3600) car", kind: "emu", pan: true },
  rf438Cab: { name: "Series 438 (FEVE 3800) cab car", kind: "emu", pan: true },
  rf438: { name: "Series 438 (FEVE 3800) trailer", kind: "emu" },
  rf435Cab: { name: "Series 435 (FEVE 3500) cab car", kind: "emu", pan: true },
  rf435: { name: "Series 435 (FEVE 3500) trailer", kind: "emu" },
  rf529: { name: "Series 529 (FEVE 2900) railcar", kind: "emu" },
  rf730Gen: { name: "Series 730 generator car", kind: "talgo" },
  rfTalgo: { name: "Talgo Pendular coach", kind: "talgo" },
  rf334: { name: "Series 334 diesel locomotive", kind: "diesel" },
  rf252: { name: "Series 252 electric locomotive", kind: "electric", pan: true },
  rf594Cab: { name: "Series 594 (TRD) car", kind: "emu" },
  rf598Cab: { name: "Series 598 end car", kind: "emu" },
  rf598: { name: "Series 598 middle car", kind: "emu" },
  rf453Cab: { name: "Series 453 (Stadler) motor car", kind: "emu", pan: true },
  rf453: { name: "Series 453 double-deck trailer", kind: "bilevel", emu: true },
  rf470Cab: { name: "Series 470 end car", kind: "emu", pan: true },
  rf470: { name: "Series 470 trailer", kind: "emu" },
  rf440RCab: { name: "Series 440R end car", kind: "emu", pan: true },
};
// oneEnd: single-cab equipment, drawn cab-left and mirrored at the back of
// a train. variant: Avlo's purple and Rodalies' orange are the same cars
// painted differently.
const paintVariant = (c) => (isAvlo(c) ? "avlo" : isRodalies(c) ? "rod" : "");
const M = (draw, len, oneEnd = false) => ({ draw, len, oneEnd, variant: paintVariant });
export const MODELS = {
  rf103Cab: M(rf103Cab, 84.2, true), rf103: { ...M(rf103, 81.3), variant: (c) => paintVariant(c) + (v103Pan(c) ? "p" : "") + (v103Back(c) ? "b" : "") },
  rf112Power: M(rf112Power, 65.6, true), rf112Coach: M(rf112Coach, 43.1),
  rf106Power: M(rf106Power, 75, true), rf106Coach: M(rf106Coach, 42.65),
  rf100Power: M(rf100Power, 72.6, true), rf100: { ...M(rf100, 61.35), variant: (c) => (r100Back(c) ? "b" : "") + (c.index === 1 || c.index === c.count - 2 ? "1" : "") },
  rf130Power: M(rf130Power, 68.1, true), rf130Coach: M(rf130Coach, 43.1),
  rf120Cab: M(rf120Cab, 89.7, true), rf120: M(rf120, 84.6),
  rf104Cab: M(rf104Cab, 89.0, true), rf104: M(rf104, 86.6),
  rf449Cab: M(rf449Cab, 69.5, true), rf449: M(rf449, 61.8),
  rf599Cab: M(rf599Cab, 85.0, true), rf599: M(rf599, 79.1),
  rfCiviaCab: M(rfCiviaCab, 70.5, true), rfCivia: M(rfCivia, 60.4),
  rf447Cab: M(rf447Cab, 85.0, true), rf447: M(rf447, 79.3),
  rf450Cab: M(rf450Cab, 87.2, true), rf450: M(rf450, 87.2),
  rf446Cab: M(rf447Cab, 85.0, true), rf446: M(rf447, 79.3),
  rf436: M(rf436, 59.0, true),
  rf438Cab: M(rf438Cab, 52.5, true), rf438: M(rf438, 52.5),
  rf435Cab: M(rf435Cab, 50.0, true), rf435: M(rf435, 50.0),
  rf529: M(rf529, 58.1),
  rf730Gen: M(rf730Gen, 43.1, true), rfTalgo: M(rfTalgo, 43.1),
  rf334: M(rf334, 68.9, true), rf252: M(rf252, 66.9, true),
  rf594Cab: M(rf594Cab, 77.7, true),
  rf598Cab: M(rf598Cab, 84.0, true), rf598: M(rf598, 81.1),
  rf453Cab: M(rf453Cab, 73.4, true), rf453: M(rf453, 86.9),
  rf470Cab: M(rf470Cab, 82.0, true), rf470: M(rf470, 82.0), rf440RCab: M(rf440RCab, 82.0, true),
};

const set = (label, ...units) => ({ label, units });
const sets = {
  s103: set("Series 103 (Siemens Velaro) trainset, 8 cars", ["rf103Cab", 1], ["rf103", 6], ["rf103Cab", 1]),
  s112: set("Series 112 or 102 (Talgo 350) trainset: two power cars and twelve coaches", ["rf112Power", 1], ["rf112Coach", 12], ["rf112Power", 1]),
  avlo: set("Avlo Series 112 (Talgo 350) trainset", ["rf112Power", 1], ["rf112Coach", 12], ["rf112Power", 1]),
  avlo106: set("Avlo Series 106 (Talgo Avril) trainset", ["rf106Power", 1], ["rf106Coach", 12], ["rf106Power", 1]),
  s106: set("Series 106 (Talgo Avril) trainset: two power cars and twelve coaches", ["rf106Power", 1], ["rf106Coach", 12], ["rf106Power", 1]),
  s100: set("Series 100 trainset: two power cars and eight trailers (some trains Series 102 or 112)", ["rf100Power", 1], ["rf100", 8], ["rf100Power", 1]),
  s130: set("Series 130 (Talgo 250) trainset: two power cars and eleven coaches", ["rf130Power", 1], ["rf130Coach", 11], ["rf130Power", 1]),
  s730: set("Series 730 hybrid (Talgo 250): power car and generator car at each end, nine coaches", ["rf130Power", 1], ["rf730Gen", 1], ["rf130Coach", 9], ["rf730Gen", 1], ["rf130Power", 1]),
  s120a: set("Series 120 (CAF) four-car unit, sometimes two coupled", ["rf120Cab", 1], ["rf120", 2], ["rf120Cab", 1]),
  talgo334: set("Series 334 diesel locomotive with Talgo coaches (being replaced)", ["rf334", 1], ["rfTalgo", 10]),
  talgo252: set("Series 252 electric locomotive with Talgo coaches (being replaced)", ["rf252", 1], ["rfTalgo", 10]),
  s594: set("Series 594 (TRD) two-car diesel unit", ["rf594Cab", 2]),
  s598: set("Series 598 three-car diesel unit", ["rf598Cab", 1], ["rf598", 1], ["rf598Cab", 1]),
  s120: set("Series 120 (CAF) four-car unit, sometimes two coupled", ["rf120Cab", 1], ["rf120", 2], ["rf120Cab", 1]),
  s121: set("Series 121 (CAF) four-car unit, sometimes two coupled", ["rf120Cab", 1], ["rf120", 2], ["rf120Cab", 1]),
  s104: set("Series 104 or 114 four-car unit", ["rf104Cab", 1], ["rf104", 2], ["rf104Cab", 1]),
  s449: set("Series 449 five-car electric unit", ["rf449Cab", 1], ["rf449", 3], ["rf449Cab", 1]),
  s470: set("Series 470 three-car electric unit", ["rf470Cab", 1], ["rf470", 1], ["rf470Cab", 1]),
  s440R: set("Series 440R three-car electric unit", ["rf440RCab", 1], ["rf470", 1], ["rf440RCab", 1]),
  s599: set("Series 599 three-car diesel unit", ["rf599Cab", 1], ["rf599", 1], ["rf599Cab", 1]),
  civia: set("Civia electric unit, usually 5 cars (some trains Series 446 or 447)", ["rfCiviaCab", 1], ["rfCivia", 3], ["rfCiviaCab", 1]),
  s447: set("Series 447 three-car unit, often two coupled (some trains Civia)", ["rf447Cab", 1], ["rf447", 1], ["rf447Cab", 1]),
  s446: set("Series 446 three-car unit, often two coupled (some trains Civia)", ["rf446Cab", 1], ["rf446", 1], ["rf446Cab", 1]),
  civia453: set("Civia electric unit, usually 5 cars (since August 2026 some trains are new Stadler Series 453s)", ["rfCiviaCab", 1], ["rfCivia", 3], ["rfCiviaCab", 1]),
  s450: set("Series 450 six-car double-deck unit (Series 451 three-car sets on some trains)", ["rf450Cab", 1], ["rf450", 4], ["rf450Cab", 1]),
  s436: set("Series 436 (FEVE 3600) two-car unit", ["rf436", 2]),
  s436a: set("Series 436 (FEVE 3600) two-car unit (some trains Series 435 three-car units)", ["rf436", 2]),
  s438: set("Series 438 (FEVE 3800) three-car unit (some trains Series 436)", ["rf438Cab", 1], ["rf438", 1], ["rf438Cab", 1]),
  s529: set("Series 529 (FEVE 2900) single diesel railcar", ["rf529", 1]),
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
      // Avlo's Series 112s run to Andalusia; its 106s everywhere else
      // (Madrid-Barcelona, the Levante, Galicia and Asturias).
      case "Avlo": return /Sevilla|M[áa]laga|C[óo]rdoba|Granada/.test(e) ? sets.avlo : sets.avlo106;
      // Railvolution's survey of Renfe's fleet (April 2024): the hybrid 730s
      // to Badajoz and Almería, 120s to Pamplona, Logroño, Irún and Hendaye,
      // 121s to Huelva and Salamanca; 130s elsewhere.
      case "Alvia":
        if (/Badajoz|Almer[íi]a|M[ée]rida|C[áa]ceres/.test(e)) return sets.s730;
        if (/Salamanca|Huelva/.test(e)) return sets.s121;
        return /Pamplona|Logro|Hendaya|Ir[úu]n/.test(e) ? sets.s120a : sets.s130;
      case "Euromed": return sets.s130;
      case "Intercity":
        // The last locomotive-hauled Talgos: a 334 to Cartagena, a 252 on
        // the electrified Barcelona-Valencia-Alicante leg.
        if (/Cartagena|Albacete/.test(e)) return sets.talgo334;
        if (/Barcelona/.test(e) && /Val[eè]ncia|Alicante|Alacant/.test(e)) return sets.talgo252;
        if (/Badajoz|Almer[íi]a|C[áa]ceres/.test(e)) return sets.s730;
        if (/Bilbao|San Sebasti|Donostia/.test(e) && /Miranda|Vitoria/.test(e)) return sets.s440R;
        return sets.s130;
      case "Avant": case "Avant Exprés": return /Lleida|Ourense|Coru|Santiago|Vigo|Pontevedra|Calatayud|Zaragoza/.test(e) ? sets.s121 : sets.s104;
      default:
        if (/Canfranc|Jaca|Huesca/.test(e) && /Zaragoza|Canfranc|Jaca/.test(e)) return sets.s594;
        if (/Sevilla|Huelva|C[áa]diz|C[áa]ceres|Ronda/.test(e) && DIESEL.test(e)) return set("Series 598 three-car diesel unit (some trains Series 599)", ...sets.s598.units);
        if (DIESEL.test(e)) return sets.s599;
        // The older 470s where Railvolution's survey and Wikipedia place them.
        if ((/Le[óo]n/.test(e) && /Gij[óo]n|Oviedo/.test(e)) || (/Santander/.test(e) && /Valladolid|Palencia|Reinosa/.test(e)) || /Rabanales|Villarrubia/.test(e)) return sets.s470;
        return sets.s449;
    }
  },
  cercanias: (t) => {
    const [line, ...rest] = (t.route || "").split(" "), core = rest.join(" ");
    const n = Number((line.match(/\d+/) || [0])[0]);
    if (line === "T1") return null;                                     // Cádiz's tram-train isn't Renfe's
    if (core === "Rodalies") return /^R2/.test(line) ? sets.s450 : sets.s447;
    // The metre-gauge lines, by the classes Spanish Wikipedia lists on them.
    if (/Le[óo]n|Ferrol|Cartagena/.test(core)) return sets.s529;
    if (core === "Santander" && n >= 2) return sets.s438;
    if (core === "Asturias" && n >= 4) return sets.s436a;
    if (core === "Bilbao" && n >= 4) return sets.s436;
    if (/Bilbao/.test(core)) return sets.s446;
    if (/Valencia|San Sebasti|Murcia|Santander/.test(core)) return sets.s447;
    if (/Sevilla/.test(core) && line === "C3") return sets.s598;
    if (/Madrid/.test(core) && (line === "C7" || line === "C1")) return sets.civia453;
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
  rf446Cab: { model: "Series 446", type: "Electric multiple unit", builder: "CAF, Macosa, ATEINSA and Siemens", built: "1989–1993", fleet: "170 built",
    topSpeedMph: kmh(100), powerHp: kw(1200), lengthFt: 85,
    about: "The first of Renfe's three-car commuter units, still on Madrid's and Bilbao's Cercanías. The 447 that followed is the same body with faster traction.", source: `${ES}Serie_446_de_Renfe` },
  rf446: { model: "Series 446 trailer", type: "Electric multiple unit", builder: "CAF, Macosa, ATEINSA and Siemens", built: "1989–1993", fleet: "170 built",
    topSpeedMph: kmh(100), lengthFt: 79.3, about: "The unpowered middle car of a 446.", source: `${ES}Serie_446_de_Renfe` },
  rf436: { model: "Series 436 (FEVE 3600)", type: "Electric multiple unit (metre gauge)", builder: "Siemens and Sunsundegui", built: "2000–2003, 2006–2007", fleet: "21 two-car units",
    topSpeedMph: kmh(100), powerHp: kw(420),
    about: "Two motor cars with a cab each, the newest electric trains on the former FEVE lines: Asturias' C-4 to C-7, Bilbao's C-4 and C-5 and Cantabria's C-2.", source: `${ES}Serie_3600_de_FEVE` },
  rf438Cab: { model: "Series 438 (FEVE 3800)", type: "Electric multiple unit (metre gauge)", builder: "CAF", built: "1992", fleet: "16 three-car units",
    powerHp: kw(880), about: "Three-car units, a motor car, a trailer and a cab trailer, on Santander's metre-gauge lines to Liérganes and Cabezón de la Sal; up to four can run coupled.", source: "https://ftp.funet.fi/pub/pics/railways/Spain/feve/index.html" },
  rf438: { model: "Series 438 (FEVE 3800) trailer", type: "Electric multiple unit (metre gauge)", builder: "CAF", built: "1992", fleet: "16 three-car units",
    about: "The middle car of a 438.", source: "https://ftp.funet.fi/pub/pics/railways/Spain/feve/index.html" },
  rf435Cab: { model: "Series 435 (FEVE 3500)", type: "Electric multiple unit (metre gauge)", builder: "CAF", lengthFt: 50,
    about: "Asturias' three-car metre-gauge units, still in FEVE's white and burgundy.", source: `${WP}Renfe_class_435` },
  rf435: { model: "Series 435 (FEVE 3500) trailer", type: "Electric multiple unit (metre gauge)", builder: "CAF", lengthFt: 50,
    about: "The middle car of a 435.", source: `${WP}Renfe_class_435` },
  rf529: { model: "Series 529 (FEVE 2900)", type: "Diesel railcar (metre gauge)", builder: "Sunsundegui with Siemens", lengthFt: 58.1,
    about: "Single diesel railcars with a cab at each end, on the metre-gauge lines around León, Ferrol and Cartagena.", source: `${WP}Renfe_Operadora` },
  rf730Gen: { model: "Series 730 generator car", type: "Generator car", builder: "Talgo", built: "2012–2013 (rebuilt from Series 130)", fleet: "2 per set, 15 sets",
    about: "The diesel generator car behind each power car of a Series 730, which lets the Alvia run on beyond the wires to Badajoz and Almería.", source: `${WP}Renfe_Class_730` },
  rfTalgo: { model: "Talgo Pendular coach", type: "Articulated tilting coach", builder: "Talgo", built: "1980s–1990s",
    about: "The tilting Talgo coaches of Renfe's last locomotive-hauled Intercitys, on Barcelona–Valencia–Alicante–Cartagena and Albacete–Cartagena, being withdrawn.", source: `${WP}Talgo` },
  rf334: { model: "Vossloh Euro 3000 (Series 334)", type: "Diesel-electric locomotive", builder: "Vossloh (Valencia)", built: "2006", fleet: "28",
    topSpeedMph: kmh(200), powerHp: 3256, about: "Built to haul the Talgo Altaria to Murcia; today on the last Talgo Intercitys south of Alicante.", source: `${ES}Serie_334_de_Renfe` },
  rf252: { model: "Series 252", type: "Electric locomotive", builder: "Krauss-Maffei and Siemens, with CAF and Macosa", built: "1991–1996", fleet: "75",
    topSpeedMph: kmh(220), powerHp: kw(5600), lengthFt: 66.9, about: "Dual-voltage Bo'Bo' locomotives derived from DB's class 120, once on the first AVE and the Talgo services; now on the last Talgo Intercitys.", source: `${WP}Renfe_Class_252` },
  rf594Cab: { model: "Series 594 (TRD)", type: "Diesel multiple unit", builder: "CAF (ABB IC3 licence)", built: "1997", fleet: "23 two-car units",
    topSpeedMph: kmh(160), powerHp: kw(1200), lengthFt: 77.7, about: "Two-car diesel units after Denmark's IC3, since 2021 on Zaragoza–Canfranc; due for retirement by 2030.", source: `${ES}Serie_594_de_Renfe` },
  rf598Cab: { model: "Series 598", type: "Diesel multiple unit", builder: "CAF", built: "2004", fleet: "21 three-car units",
    topSpeedMph: kmh(160), powerHp: kw(1352), lengthFt: 84, about: "Three-car diesel units, now on Seville's Cercanías C-3 and Media Distancia and Intercity trains in Andalusia and Extremadura.", source: `${ES}Serie_598_de_Renfe` },
  rf598: { model: "Series 598 middle car", type: "Diesel multiple unit", builder: "CAF", built: "2004", fleet: "21 three-car units",
    topSpeedMph: kmh(160), lengthFt: 81.1, about: "The trailer of a 598, between its two motor cars.", source: `${ES}Serie_598_de_Renfe` },
  rf470Cab: { model: "Series 470", type: "Electric multiple unit", builder: "CAF, Macosa and ATEINSA", built: "1980s", fleet: "47 in service",
    topSpeedMph: kmh(140), lengthFt: 82, about: "Three-car regional units of the 440 family, still on León–Gijón over the Pajares pass, Valladolid–Santander and regional lines around Valencia and Córdoba.", source: `${WP}Renfe_Operadora` },
  rf470: { model: "Series 440R/470 trailer", type: "Electric multiple unit", builder: "CAF, Macosa and ATEINSA", built: "1980s",
    lengthFt: 82, about: "The middle car of a 470 or 440R.", source: `${WP}Renfe_Operadora` },
  rf440RCab: { model: "Series 440R", type: "Electric multiple unit", builder: "CAF, Macosa and ATEINSA (rebuilt)", built: "1970s–80s, rebuilt 1990s", fleet: "7 in service",
    topSpeedMph: kmh(160), lengthFt: 82, about: "Series 440 units rebuilt with a new front and interior for regional and Intercity work; the last run Bilbao–Miranda de Ebro and Vitoria–San Sebastián.", source: `${WP}Renfe_Operadora` },
  rf453Cab: { model: "Stadler Series 453", type: "Electric multiple unit", builder: "Stadler", built: "2025–2026", fleet: "79 ordered",
    lengthFt: 73.4, about: "Madrid's new Cercanías trains: single-deck FLIRT motor cars at the ends and KISS double-deck trailers between them. In passenger service on the C-7 since August 2026.", source: `${WP}Renfe_Operadora` },
  rf453: { model: "Stadler Series 453 trailer", type: "Double-deck electric multiple unit", builder: "Stadler", built: "2025–2026", fleet: "79 ordered",
    lengthFt: 86.9, about: "A double-deck KISS trailer of a 453.", source: `${WP}Renfe_Operadora` },
};
