// Finland's passenger cars (VR and the commuter trains, scripts/railroads/digitraffic.py):
// Trainsheet's own side views, built like carmodels.js's from each model's
// published dimensions, in VR's current white and green (the capital
// region's FLIRTs in HSL's white and purple). Digitraffic's train locations
// name no vehicles, so each train is drawn as what typically runs on its
// line. The detail helpers here (lettering, roof gear, fronts, buffers,
// underfloor boxes, a Stadler FLIRT built to any railroad's paint) are
// shared with the Baltic and Norwegian railroads' files (entur.cars.js,
// vivi.cars.js, elron.cars.js).

import { newId, bilevel, cabUnit, married } from "../carmodels.js?v=dev";
import { rect, circle, path, line, lines, poly, slats, win, truck, pantograph, C } from "../carart.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
const r2 = (v) => Math.round(v * 100) / 100;
// VR since 2009: white, a bright green, a lighter green in its leaf graphics.
const VR = { white: "#f1f2f3", green: "#45b02c", light: "#8fd14f", deep: "#2c7f1d", roof: "#a3aab2", band: "#24282d", skirt: "#3a3f45" };
const HSL = { purple: "#8c4799", coral: "#e5484d", white: "#f3f4f5" };

// ===================== Shared detail =====================

const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
// Lettering on a car side, h ft tall and centered at (x, y), reading left to
// right on a mirrored car too.
export function letters(c, x, y, h, text, fill, { weight = 700, spacing = 0, italic = false, family = SANS, anchor = "middle", stretch = 1 } = {}) {
  return `<text transform="translate(${r2(x)} ${r2(y)}) scale(${r2((c.mirrored ? -1 : 1) * stretch)} -1)" y="${r2(h * 0.36)}" font-size="${r2(h)}" text-anchor="${anchor}" ` +
    `font-weight="${weight}"${italic ? ' font-style="italic"' : ""} letter-spacing="${spacing}" font-family="${family}" fill="${fill}">${text}</text>`;
}
// VR's mark: the two letters, bold and leaning.
export const vrMark = (c, x, y, h, fill) => letters(c, x, y, h, "VR", fill, { weight: 800, italic: true, spacing: -0.04 * h, stretch: 1.15 });

// An air-conditioning housing on the roof: a low hood with sloped ends,
// louvered sides and a light top edge.
export function hvac(x, roof, w, h = 0.75, fill = "#a7aeb6") {
  return path(`M${r2(x)} ${r2(roof - 0.05)}L${r2(x + 0.45)} ${r2(roof + h)}L${r2(x + w - 0.45)} ${r2(roof + h)}L${r2(x + w)} ${r2(roof - 0.05)}Z`, fill, 0.4) +
    slats(x + 0.9, roof + 0.1, Math.max(0.5, w * 0.35), h - 0.25, 0.4, "rgba(0,0,0,0.32)") +
    slats(x + w - 0.9 - Math.max(0.5, w * 0.35), roof + 0.1, Math.max(0.5, w * 0.35), h - 0.25, 0.4, "rgba(0,0,0,0.32)") +
    line(x + 0.5, roof + h - 0.12, x + w - 0.5, roof + h - 0.12, "rgba(255,255,255,0.4)", 0.5);
}
// A smooth roof cover over equipment (converters, resistors, breakers), its
// panels' seams marked.
export function roofCover(x, roof, w, h = 0.55, fill = "#9aa1a9", seams = 2) {
  let s = path(`M${r2(x)} ${r2(roof - 0.05)}Q${r2(x)} ${r2(roof + h)} ${r2(x + 0.6)} ${r2(roof + h)}L${r2(x + w - 0.6)} ${r2(roof + h)}Q${r2(x + w)} ${r2(roof + h)} ${r2(x + w)} ${r2(roof - 0.05)}Z`, fill, 0.4);
  const segs = [];
  for (let k = 1; k <= seams; k++) segs.push([x + (w * k) / (seams + 1), roof + 0.05, x + (w * k) / (seams + 1), roof + h - 0.05]);
  return s + lines(segs, "rgba(0,0,0,0.28)", 0.4);
}
// Behind a pantograph: the main breaker and a roof line, on insulators.
export function panGear(x, roof, dir = 1) {
  return rect(x + dir * 3.4 - (dir < 0 ? 1.4 : 0), roof - 0.05, 1.4, 0.75, C.steelDark, 0.4, 'rx="0.15"') +
    rect(x + dir * 3.7 - (dir < 0 ? 0.3 : 0), roof + 0.7, 0.3, 0.45, "#b9874a", 0.3) +
    line(x + dir * 2.8, roof + 0.95, x + dir * 6.2, roof + 0.95, "#5a6068", 0.9) +
    rect(x + dir * 6.0 - 0.15, roof - 0.05, 0.3, 1.0, "#b9874a", 0.3);
}
// A pair of horns on the roof.
export const horns = (x, roof) => rect(x, roof - 0.05, 1.0, 0.25, "currentColor") + rect(x + 0.05, roof + 0.2, 0.32, 0.3, "currentColor", 0, 'rx="0.1"') +
  rect(x + 0.55, roof + 0.2, 0.38, 0.38, "currentColor", 0, 'rx="0.1"');
// A lamp: lens in a dark surround (white headlight, red marker).
export const lamp = (x, y, w = 0.55, h = 0.38, color = "#f6f2dc") =>
  rect(x - 0.08, y - 0.08, w + 0.16, h + 0.16, "#1b1d20", 0, 'rx="0.12"') + rect(x, y, w, h, color, 0, 'rx="0.1"');
export const RED_LAMP = "#d8262f";
// A windshield wiper resting on the glass.
export const wiper = (x0, y0, x1, y1) => line(x0, y0, x1, y1, "#0d0f11", 0.9);
// The front of a multiple unit at the left end, under the nose: the
// automatic coupler on its drawbar, its electrical head, and the obstacle
// deflector under the front. noseX: the nose's foot.
export function emuFront(noseX, sill, { coupler = 2.75, deflector = "#2a2d31" } = {}) {
  let s = path(poly([[noseX - 0.25, sill + 0.05], [noseX + 3.4, sill + 0.05], [noseX + 3.0, 0.8], [noseX + 0.7, 0.55], [noseX - 0.05, 1.3]]), deflector);
  s += line(noseX + 0.45, 1.0, noseX + 2.9, 1.15, "rgba(255,255,255,0.18)", 0.6);
  s += rect(0.45, coupler - 0.3, noseX + 0.6, 0.6, "currentColor", 0, 'opacity="0.9"');
  s += rect(0, coupler - 0.72, 0.55, 1.44, "currentColor", 0, 'rx="0.15"') + rect(0.15, coupler + 0.8, 0.5, 0.35, C.steelDark, 0.3);
  return s;
}
// Side buffers on a buffer beam, xFace the buffers' face: side -1 at the
// left end, 1 at the right.
export function buffers(xFace, side, { y = 3.45, reach = 1.6 } = {}) {
  const a = side < 0 ? xFace + 0.32 : xFace - reach, b = side < 0 ? xFace : xFace - 0.32;
  return rect(a, y - 0.32, reach - 0.32, 0.64, C.steelDark, 0.4) + rect(b, y - 0.62, 0.32, 1.24, "currentColor", 0, 'rx="0.12"') +
    rect(side < 0 ? xFace + reach - 0.2 : xFace - reach - 0.25, y - 0.75, 0.45, 1.5, "#2a2d31");
}
// Underfloor equipment between x0 and x1 hung from top: n boxes, alternately
// deeper and shallower, with a hinge line and a latch each.
export function boxes(x0, x1, top, n = 3, depth = 1.3, fill = "#3a3e44") {
  let s = "";
  const w = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const a = x0 + i * w + 0.3, b = a + w - 0.6, d = depth * (i % 2 ? 0.78 : 1);
    s += rect(a, top - d, b - a, d, fill, 0.4, 'rx="0.12"') + line(a + 0.2, top - 0.2, b - 0.2, top - 0.2, "rgba(255,255,255,0.14)", 0.5) +
      rect((a + b) / 2 - 0.25, top - d + 0.25, 0.5, 0.18, C.steelDark);
  }
  return s;
}
// A window's frame: a dark rounded surround a little larger than the glass.
export const frames = (xs, y, w, h, pad = 0.18, fill = "#1d2024") => xs.map((x) => rect(x - pad, y - pad, w + 2 * pad, h + 2 * pad, fill, 0, 'rx="0.45"')).join("");
// Slanted strokes (a leaf or speed graphic): n parallelograms from (x, y0)
// leaning ahead by lean over their height.
export function strokes(x, y0, y1, n, { w = 0.45, gap = 0.75, lean = 1.4, fills = [VR.green] } = {}) {
  let s = "";
  for (let k = 0; k < n; k++) {
    const a = x + k * gap;
    s += path(poly([[a, y0], [a + w, y0], [a + w + lean, y1], [a + lean, y1]]), fills[k % fills.length]);
  }
  return s;
}

// A unit with a driving cab at each end, drawn as its left half and the same
// half mirrored onto the right: draw(c) draws the whole body with its cab on
// the left; c.half says which half is being drawn (0 left, 1 right), for
// what differs, such as which pantograph is raised.
export function bothEnds(c, draw) {
  const L = c.L, clip = () => {
    const id = newId();
    return [id, `<clipPath id="${id}"><rect x="-5" y="-5" width="${L / 2 + 5}" height="40"/></clipPath>`];
  };
  const [a, ca] = clip(), [b, cb] = clip();
  return ca + cb + `<g clip-path="url(#${a})">${draw({ ...c, cabL: true, half: 0 })}</g>` +
    `<g transform="matrix(-1 0 0 1 ${L} 0)"><g clip-path="url(#${b})">${draw({ ...c, cabL: true, half: 1, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: c.coupledL })}</g></g>`;
}

// A built-in Stadler FLIRT section (carmodels.js, drawn in Metrolink's Arrow
// white, blue and green) in another railroad's colors: body for the white,
// top for the blue over the roof and down the nose, line for the green along
// the sill.
export const flirtIn = (svg, { body, top, line }) =>
  svg.replace(/#(f4f5f6|2a62d4|3fb54a)\b/g, (m, h) => ({ f4f5f6: body, "2a62d4": top, "3fb54a": line })[h]);

// --- Stadler FLIRT, as the Nordic and Baltic railroads run it: the cab
// section (21.5 m to the joint, a motor bogie under the cab's raised floor,
// the nose's crash structure ahead of it), the intermediate sections (15.7
// m) on Jakobs bogies shared at every joint, and the Norwegian bimodal
// units' short generator car. Each section: a double plug door a side;
// the cab's crew door and two small windows over the motor bogie; the
// windshield in a black mask, the coupler under a deflector, headlights low
// on the nose and one over the windshield. On the roof: an air-conditioning
// unit per section, a converter cover, the pantograph with its breaker.
// k: the railroad's paint, { body, roof, skirt, door, mask, paint(c, g,
// part) (clipped to the body), over(c, g, part) (lettering and the like on
// top), diesel (roof radiators and exhausts in place of a pantograph) }.
const FL = { roof: 14.06, sill: 3.0, cornerR: 1.0, end: 0.6, noTrucks: true, diaphragm: [3.2, 12.2], badge: false };
const FL_NOSE = [[1.0, 3.0], [1.0, 5.8], ["q", 1.1, 7.0, 2.0, 8.0], [5.6, 12.9], ["q", 6.4, 14.06, 8.2, 14.06]];
const flJakobs = (x) => truck(x, { wb: 8.86, d: 30, top: 3.0 });
const FL_CAB_WINS = [{ xs: [12.4, 16.2], y: 6.6, w: 3.0, h: 3.6, r: 0.4 }, { xs: seq(29.6, 5.25, 7), y: 6.6, w: 4.6, h: 3.6, r: 0.4 }];
const FL_MID_WINS = [{ xs: seq(2.6, 5.25, 3), y: 6.6, w: 4.6, h: 3.6, r: 0.4 }, { xs: seq(24.7, 5.25, 5), y: 6.6, w: 4.6, h: 3.6, r: 0.4 }];
export function flirt(c, part, k) {
  const L = c.L, roof = FL.roof;
  if (part === "power") return flirtGenerator(c, k);
  const cab = part === "cab";
  const dx = cab ? 24.0 : 18.5, rows = cab ? FL_CAB_WINS : FL_MID_WINS;
  return bilevel({ ...c, cabL: cab, cabR: false }, { ...FL, base: k.body,
    nose: cab ? FL_NOSE : null, cabLen: cab ? 9 : 0, rows,
    doors: [...(cab ? [{ x: 9.0, w: 2.3, y0: 4.0, y1: 11.2, glassY: 0.55, glassH: 0.32, grabs: false }] : []),
      { x: dx, w: 4.27, y0: 3.0, y1: 10.4, leaves: 2, glassY: 0.4, glassH: 0.45, grabs: false }],
    paint: (c, g) => {
      let s = rect(0, 0, L, 17, k.body) + rect(0, 12.95, L, 3, k.roof) + line(0, 12.95, L, 12.95, "rgba(0,0,0,0.18)", 0.5) + rect(0, 0, L, 3.55, k.skirt);
      if (k.door) s += rect(dx - 0.15, 2.9, 4.57, 7.65, k.door) + (cab ? rect(8.85, 3.9, 2.6, 7.45, k.door) : "");
      if (k.paint) s += k.paint(c, g, part);
      s += rows.map((r) => frames(r.xs, r.y, r.w, r.h)).join("");
      if (cab) s += path(poly([[1.25, 7.5], ["q", 3.4, 10.6, 5.2, 13.15], [9.2, 13.15], [9.2, 7.75], ["q", 5.0, 7.3, 1.25, 7.5]]), k.mask ?? "#1d2024");
      return s;
    },
    extra: (c, g) => {
      let s = cab ? truck(L - 51.8, { wb: 8.2, d: 36, top: 3.0 }) + flJakobs(L) : flJakobs(0) + flJakobs(L);
      // Underfloor: the converter and brake boxes under the raised end,
      // shallow tanks under the low floor.
      s += cab ? boxes(10.8, 15.4, 3.0, 1, 0.45) + boxes(25.5, 44.0, 3.0, 2, 0.55) : boxes(6.0, 13.5, 3.0, 2, 0.55) + boxes(30.0, 44.5, 3.0, 2, 0.5);
      // Roof: air conditioning, a converter cover, and the pantograph (or,
      // on a diesel unit, radiators and exhausts) on the intermediate section.
      if (cab) s += hvac(20.5, roof, 10.5) + roofCover(43.0, roof, 9.5) + rect(10.6, roof - 0.05, 3.2, 0.4, C.steelDark, 0.4, 'rx="0.15"') + rect(12.0, roof + 0.35, 0.2, 0.7, "currentColor");
      else s += hvac(3.5, roof, 10.0) + roofCover(31.0, roof, 9.0);
      if (!cab && k.diesel) s += roofCover(15.2, roof, 14.0, 0.85, "#8d949c", 3) + slats(16.0, roof + 0.15, 12.4, 0.6, 0.4, "rgba(0,0,0,0.35)") + rect(21.5, roof + 0.8, 0.5, 0.75, "currentColor") + rect(23.5, roof + 0.8, 0.5, 0.75, "currentColor");
      else if (!cab && c.pan) s += pantograph(L / 2, roof) + panGear(L / 2 - 1.0, roof, -1);
      if (k.over) s += k.over(c, g, part);
      return s;
    },
    cab: () => emuFront(1.0, 3.0) +
      path(poly([[1.9, 8.1], [5.3, 12.5], [6.0, 12.5], [3.0, 8.1]]), C.glass) + path(poly([[2.3, 8.4], [3.6, 10.1], [4.0, 10.1], [2.9, 8.4]]), C.glassLight) +
      path(poly([[5.3, 8.5], [6.6, 11.8], [8.5, 11.8], [8.5, 8.5]]), C.glass) + wiper(2.4, 8.3, 3.9, 10.6) +
      lamp(1.05, 5.75, 0.5, 0.42) + lamp(1.12, 5.05, 0.38, 0.3, RED_LAMP) + lamp(6.3, 13.35, 0.7, 0.28) + rect(6.6, 12.62, 1.7, 0.3, "#f4a321", 0, 'rx="0.08"'),
  });
}
// The bimodal FLIRT's generator car: a short, tall box on Jakobs bogies, a
// corridor through it between louvered engine rooms, radiators and
// exhausts on the roof.
function flirtGenerator(c, k) {
  const { L } = c, roof = 14.06, sill = 3.4;
  const d = poly([[0.4, sill], [L - 0.4, sill], [L - 0.4, roof - 0.6], ["q", L - 0.4, roof, L - 1.0, roof], [1.0, roof], ["q", 0.4, roof, 0.4, roof - 0.6]]);
  const id = newId();
  let s = flJakobs(0) + flJakobs(L) + boxes(3.0, L - 3.0, sill, 2, 0.9);
  let liv = rect(0, 0, L, 17, k.body) + rect(0, 12.95, L, 3, k.roof) + rect(0, 0, L, 3.95, k.skirt) + (k.paint ? k.paint(c, { L }, "power") : "");
  s += path(d, k.body) + `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${liv}</g>`;
  for (const x of [1.6, L / 2 + 0.6]) s += rect(x, 5.4, L / 2 - 2.2, 5.6, "rgba(20,22,25,0.55)", 0.4, 'rx="0.15"') + slats(x + 0.2, 5.6, L / 2 - 2.6, 5.2, 0.35, "rgba(255,255,255,0.2)");
  s += roofCover(1.4, roof, L - 2.8, 0.8, "#8d949c", 4) + slats(2.2, roof + 0.12, L - 4.4, 0.55, 0.4, "rgba(0,0,0,0.35)");
  s += rect(L / 2 - 1.6, roof + 0.75, 0.55, 0.9, "currentColor") + rect(L / 2 + 1.0, roof + 0.75, 0.55, 0.9, "currentColor");
  // Fuel tank and filler, the corridor's end doors, the exhaust silencers.
  s += rect(4.0, 1.5, L - 8.0, 1.0, "#2a2d31", 0.4, 'rx="0.45"') + rect(L / 2 - 0.4, 2.0, 0.8, 0.4, C.steelDark) +
    lines([[L / 2, 5.0, L / 2, 11.6], [1.2, 11.6, L - 1.2, 11.6]], "rgba(0,0,0,0.25)", 0.5) + lamp(L / 2 - 0.3, 11.9, 0.6, 0.3, "#f4a321") +
    roofCover(3.0, roof + 0.75, 4.0, 0.35, "#6f767e") + roofCover(L - 7.0, roof + 0.75, 4.0, 0.35, "#6f767e");
  if (k.over) s += k.over(c, { L }, "power");
  return s + path(d, "none", 0.8);
}

// ===================== VR locomotives =====================

// --- SLM/ABB Sr2 (VR 3201-3246, 1995-2003; Norway's El 18 is the same
// locomotive): the Swiss Re 460 "Lok 2000", 19.0 m (El 18 18.5 m), a cab
// at each end under a steeply raked, rounded windshield, smooth sides with
// a crew door behind each cab, two big louvered panels high on each side
// and the machine room's access panels below them; bogies about 10 m apart
// on 1.1 m wheels, a pantograph over each end with the main breaker and
// roof line between, the transformer slung between the bogies; side
// buffers and a screw coupler at each end. VR's scheme: white, the green
// from the sill to the waist rising over the nose under the windshield, a
// gray roof, VR on the side. paint(c) gives another railroad's: { body,
// low, roof } colors, or with livery(h, L) drawing its own side and
// mark(h, L) its lettering.
export function lok2000(c, paint = () => ({ body: VR.white, low: VR.green, roof: VR.roof, mark: (h) => vrMark(h, 22.5, 6.0, 2.0, VR.white) })) {
  return bothEnds(c, (h) => {
    const p = paint(h);
    const { body, low, roof: top } = p;
    const L = h.L, sill = 4.1, roof = 12.9;
    return cabUnit(h, {
      roof, sill, rearR: 1.0,
      nose: [[1.7, sill], [1.05, 5.3], ["q", 0.85, 7.3, 1.7, 8.7], [4.1, 11.7], ["q", 5.0, roof, 6.9, roof]],
      base: body, trucks: { centers: 33.0, wb: 9.2, d: 43 },
      tank: [17.5, L - 17.5, 1.7],
      paint: () => (p.livery ? p.livery(h, L) : rect(0, 0, L, 7.0, low) + path("M0 7.0L1.6 7.0Q4.2 7.4 6.4 8.4L6.4 0L0 0Z", low)) +
        rect(0, roof - 0.55, L, 1, top) + line(0, roof - 0.55, L, roof - 0.55, "rgba(0,0,0,0.2)", 0.5) + rect(0, sill, L, 0.45, VR.skirt) +
        // The windshield's black surround, and the lettering.
        path(poly([[1.75, 8.7], [4.05, 11.6], [5.85, 11.6], [5.85, 8.65]]), "#1d2024") + (p.mark ? p.mark(h, L) : ""),
      glass: [[[1.95, 8.95], [4.15, 11.35], [5.55, 11.35], [5.55, 8.95]]],
      sideWin: [[6.3, 9.0, 1.7, 1.9]],
      doors: [[8.4, 2.3, sill + 0.35, 11.4]],
      grilles: [[12.0, 10.3, 7.6, 1.5, 0.3], [21.6, 10.3, 7.6, 1.5, 0.3]],
      roofItems: [[L / 2 - 8, 16, 0.5]],
      extra: () => pantograph(16.0, roof, { up: h.half === 1, facing: -1 }) + panGear(16.0, roof, 1) + horns(7.4, roof) +
        lamp(1.15, 5.25, 0.42, 0.5) + lamp(1.0, 4.55, 0.32, 0.32, RED_LAMP) + lamp(5.6, 12.45, 0.5, 0.25) + wiper(2.4, 9.1, 3.8, 10.9) +
        buffers(0, -1) + rect(12.0, 1.75, 2.6, 1.0, "#3a3e44", 0.4, 'rx="0.1"') +
        lines([[11.4, 9.9, 30.6, 9.9], [11.4, 9.9, 11.4, 5.2], [20.8, 9.9, 20.8, 5.2]], "rgba(0,0,0,0.16)", 0.5) + rect(7.0, sill + 0.55, 0.9, 0.5, "#e8eaec", 0.3),
    });
  });
}

// --- Siemens Vectron, VR Sr3 (3301-3380, 2016-2026): 19.05 m, a cab at
// each end behind a near-upright nose with a wide windshield, three big
// side panels between the crew doors with louvers along their tops,
// bogies 9.9 m apart on 1.25 m wheels, two pantographs. VR's scheme: light
// gray over the bright green, which fills the lower two thirds of the side
// and the nose; two broad white slashes lean across the green, and VR in
// white, big, toward the No. 2 end; a gray roof.
const sr3 = (c) => bothEnds(c, (h) => {
  const L = h.L, sill = 4.0, roof = 12.8;
  return cabUnit(h, {
    roof, sill, rearR: 1.0,
    nose: [[1.5, sill], [1.25, 6.4], [1.55, 8.6], [2.7, 11.9], ["q", 3.0, roof, 4.0, roof]],
    base: "#dfe3e6", trucks: { centers: 32.5, wb: 9.4, d: 49 },
    tank: [18.0, L - 18.0, 1.8],
    paint: () => {
      let s = rect(0, 0, L, 9.0, VR.green) + path("M0 9.0L0 6.4L2.2 6.4Q3.6 8.6 6.0 9.0Z", VR.green) +
        rect(0, roof - 0.55, L, 1, VR.roof) + rect(0, sill, L, 0.4, VR.skirt) + line(0, 9.0, L, 9.0, VR.deep, 0.5);
      // The cab front's black band and the slashes: the white ones and VR
      // at the No. 2 end (the half drawn mirrored), a pale one by each cab.
      s += path(poly([[1.6, 8.6], [2.6, 11.7], [6.0, 11.7], [6.0, 8.6]]), "#1d2024");
      s += path(poly([[11.0, sill], [11.9, sill], [14.2, 9.0], [13.3, 9.0]]), "#e8ebed");
      if (h.half === 1) s += path(poly([[19.0, sill], [22.5, sill], [27.0, 11.4], [23.5, 11.4]]), "#ffffff") + path(poly([[24.0, sill], [25.4, sill], [29.9, 11.4], [28.5, 11.4]]), "#ffffff") +
        vrMark(h, 14.8, 6.6, 3.6, "#ffffff");
      else s += vrMark(h, 4.0, 5.5, 1.2, "#ffffff");
      return s;
    },
    glass: [[[1.75, 8.9], [2.75, 11.5], [5.6, 11.5], [5.6, 8.9]]],
    sideWin: [[6.3, 9.1, 1.6, 1.8]],
    doors: [[8.2, 2.3, sill + 0.35, 11.3]],
    panels: [[14.6, 5.2, 5.0, 6.3], [20.0, 5.2, 7.6, 6.3]],
    grilles: [[12.6, 10.1, 6.4, 1.1, 0.3], [20.6, 10.1, 6.4, 1.1, 0.3]],
    roofItems: [[L / 2 - 9, 18, 0.55]],
    extra: () => pantograph(15.5, roof, { up: h.half === 1, facing: -1 }) + panGear(15.5, roof, 1) + horns(5.6, roof) +
      lamp(1.35, 6.9, 0.45, 0.42) + lamp(1.28, 6.1, 0.32, 0.3, RED_LAMP) + lamp(3.0, 12.15, 0.5, 0.28) + wiper(2.2, 9.0, 3.0, 11.1) +
      buffers(0, -1, { y: 3.45 }) + rect(11.5, 1.9, 2.4, 1.0, "#3a3e44", 0.4, 'rx="0.1"'),
  });
});

// --- NEVZ/Strömberg Sr1 (VR 3001-3112, 1973-1995; 73 still in service in
// 2025, being replaced by the Sr3; en.wikipedia "VR Class Sr1"): 18.96 m,
// Bo'Bo' on 1.25 m wheels, bogies about 9.6 m apart; a flat, upright cab
// at each end with two windshield panes, a crew door behind each cab with
// a round porthole beside it, the machine room's windows high in the
// middle of the side, ribbed panels; two pantographs and the roof
// resistors between. VR's current scheme (photographs, 3043 at Kouvola):
// white, a gray skirt, a green band low along the side that steps up
// toward the middle and frames the machine room's first windows, VR big in
// green on the other half.
const sr1 = (c) => bothEnds(c, (h) => {
  const L = h.L, sill = 4.2, roof = 13.4;
  return cabUnit(h, {
    roof, sill, rearR: 1.0,
    nose: [[0.9, sill], [0.8, 10.6], ["q", 0.85, 12.9, 2.0, roof - 0.2], ["q", 2.6, roof, 3.6, roof]],
    base: VR.white, trucks: { centers: 31.5, wb: 10.5, d: 49 },
    tank: [18.0, L - 18.0, 2.0],
    paint: () => {
      let s = rect(0, 0, L, 5.6, "#626a72") + rect(0, 5.6, L, 1.2, VR.green) + rect(0, roof - 0.6, L, 1, VR.roof) + line(0, 6.8, L, 6.8, VR.deep, 0.4);
      // The step: the green rising under the first machine-room windows
      // (on the No. 2 end's half), and VR on the No. 1 end's.
      if (h.half === 0) s += path(`M10.5 5.6L19.0 6.8L${L / 2 + 1} 6.8L${L / 2 + 1} 7.9L22.4 7.9L22.4 11.2L17.6 11.2L14.6 6.8Z`, VR.green);
      else s += vrMark(h, 21.5, 8.6, 3.0, VR.green);
      return s + path(poly([[0.9, 9.0], [0.86, 11.6], [5.4, 11.6], [5.4, 9.0]]), "#1d2024");
    },
    glass: [[[1.0, 9.2], [0.95, 11.35], [5.1, 11.35], [5.1, 9.2]]],
    sideWin: [[5.8, 9.2, 2.4, 2.2]],
    doors: [[8.8, 2.3, sill + 0.35, 11.6]],
    grilles: [[17.0, 9.0, L / 2 - 17.0, 2.3, 2.6]],
    panels: [[11.6, 5.6, 2.4, 3.0]],
    roofItems: [[L / 2 - 6, 12, 0.7]],
    extra: () => circle(13.2, 10.3, 0.9, C.glass, 0, `stroke="${C.gasket}" stroke-width="0.6"`) + pantograph(17.5, roof, { up: h.half === 1, facing: -1 }) + panGear(17.5, roof, 1) +
      horns(3.4, roof) + lamp(1.0, 6.3, 0.5, 0.5) + lamp(1.0, 5.55, 0.36, 0.32, RED_LAMP) + lamp(2.6, 12.6, 0.6, 0.3) + wiper(1.5, 9.4, 1.5, 11.0) + buffers(0, -1) +
      // The ribbed panels below the machine room's windows.
      lines([7.4, 7.9, 8.4].map((y) => [24.0, y, L / 2, y]), "rgba(0,0,0,0.14)", 0.5),
  });
});

// ===================== VR multiple units =====================

// --- Fiat/Alstom Sm3 Pendolino (VR, 18 six-car units 1995-2006, 14 in
// service): 158.9 m, each car about 26.5 m, a low tilting body; the end
// cars' long, pointed noses with the windshield far back over a hinged
// nose cover; one plug door a side near the end of each car, small windows
// close together in a dark band. VR's colors: white, a green stripe under
// the window band, the green swept up the nose under the windshield and a
// leaf of green strokes by each door; a gray skirt over the running gear.
// Air conditioning on every car, the pantographs on the second and fifth.
const SM3 = { roof: 12.3, sill: 3.5, cornerR: 0.9, end: 0.6, trucks: { centers: 62.3, wb: 8.9, d: 35 }, diaphragm: [3.8, 11.2] };
const sm3Paint = (nose) => (c, g) => {
  const L = g.L;
  let s = rect(0, 0, L, 17, VR.white) + rect(0, 11.5, L, 2, "#b6bcc3") + line(0, 11.5, L, 11.5, "rgba(0,0,0,0.15)", 0.5) +
    rect(0, 6.1, L, 3.55, VR.band) + rect(0, 4.7, L, 0.85, VR.green) + rect(0, 0, L, 4.1, "#646b73") + rect(0, 4.1, L, 0.12, "#2f3338");
  // The leaf by the door: green strokes leaning ahead, across the band.
  s += strokes(L - 3.35, 4.25, 10.9, 3, { w: 0.32, gap: 0.62, lean: 0.9, fills: [VR.green, VR.light, VR.green] });
  if (nose) {
    // The nose: white over the band, the green swept up under the windshield.
    s += rect(0, 6.1, 11.6, 3.55, VR.white) + path("M0 4.1L0 9.0L3.6 9.0Q8.2 7.9 12.6 5.55L12.6 4.7L0 4.7Z", VR.green) +
      path("M3.6 9.0Q8.2 7.9 12.6 5.55L12.6 5.85Q8.4 8.25 3.8 9.3Z", VR.deep) + rect(11.6, 6.1, 0.25, 3.55, VR.band) +
      line(1.5, 4.4, 5.0, 4.1, "rgba(0,0,0,0.25)", 0.5) + vrMark(c, 6.6, 5.3, 1.05, "#ffffff");
  }
  return s;
};
const sm3Door = (x) => ({ x, w: 2.9, y0: 3.7, y1: 10.6, glassY: 0.55, glassH: 0.3, grabs: false });
const sm3Under = (L, sill) => boxes(L / 2 - 22, L / 2 + 22, sill, 4, 0.95) + path(`M${L / 2 - 26.5} ${sill}L${L / 2 + 26.5} ${sill}L${L / 2 + 26.0} ${sill - 0.5}L${L / 2 - 26.0} ${sill - 0.5}Z`, "#4a5057");
const sm3Cab = (c) => bilevel({ ...c, cabL: true }, { ...SM3,
  nose: [[2.6, 3.5], [1.0, 4.5], ["q", 0.35, 5.6, 1.7, 6.9], [8.0, 11.2], ["q", 9.8, 12.3, 12.6, 12.3]],
  rows: [{ xs: seq(14.6, 3.85, 17), y: 6.55, w: 2.75, h: 2.65, r: 0.35 }], doors: [sm3Door(c.L - 6.8)], cabLen: 12, badge: false,
  paint: sm3Paint(true),
  extra: (c, g) => sm3Under(g.L, g.roof - 8.8) + hvac(30, g.roof, 13) + roofCover(56, g.roof, 9, 0.45) + horns(13.4, g.roof - 0.02),
  cab: () => path(poly([[3.0, 7.4], [8.0, 10.95], [10.6, 10.95], [10.6, 8.8], [6.0, 7.4]]), C.glass) +
    path(poly([[3.4, 7.65], [6.2, 9.6], [6.9, 9.6], [4.3, 7.65]]), C.glassLight) + wiper(4.3, 7.9, 6.6, 9.9) +
    lamp(1.1, 4.65, 0.75, 0.4) + lamp(1.95, 5.3, 0.5, 0.3, RED_LAMP) + line(2.4, 3.6, 3.2, 6.8, "rgba(0,0,0,0.35)", 0.5) +
    path(poly([[2.4, 3.5], [6.0, 3.5], [5.6, 1.0], [3.0, 0.9]]), "#2a2d31"),
});
const sm3Mid = (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...SM3,
  rows: [{ xs: seq(5.8, 3.85, 19), y: 6.55, w: 2.75, h: 2.65, r: 0.35 }], doors: [sm3Door(c.L - 6.8)], badge: false,
  paint: sm3Paint(false),
  extra: (c, g) => sm3Under(g.L, g.roof - 8.8) + hvac(40, g.roof, 13) +
    (c.pan ? pantograph(14.0, g.roof) + panGear(14.0, g.roof, 1) + roofCover(22.5, g.roof, 8, 0.5) : roofCover(18, g.roof, 9, 0.45)) +
    letters(c, 44.0, 10.25, 0.55, "VR", VR.green, { weight: 800, italic: true }),
});

// --- Alstom New Pendolino, Sm6 "Pendolino Plus" (4 seven-car units built
// 2009-2011 at Savigliano for the Helsinki-St Petersburg Allegro, back in
// VR's domestic service since November 2025 on Helsinki-Turku and
// Helsinki-Oulu; en.wikipedia "VR Class Sm6"): 184.8 m, end cars 27.2 m and
// middle cars 25.0 m, 4.27 m tall; a long nose rising to a windshield set
// in a gray mask, a plug door a side at each end of the middle cars and
// behind each cab, small windows close together; pantographs on the second
// and sixth cars. VR's paint for it (photographs, Helsinki, 3 November
// 2025): the nose and the front half of each end car bright green, VR big in
// white on the green; the rest white, swept with green speed lines that
// thin out toward the middle of the train; the windows in a dark band, a
// gray roof and a dark skirt.
const SM6 = { roof: 14.0, sill: 3.6, cornerR: 1.0, end: 0.6, trucks: { centers: 61.0, wb: 8.9, d: 35 }, diaphragm: [3.9, 12.6], badge: false };
const sm6Lines = (x0, x1, y0, y1, n = 9) => {
  const segs = [];
  for (let k = 0; k < n; k++) {
    const y = y0 + ((y1 - y0) * k) / (n - 1);
    segs.push([x0 + (k % 3) * 1.4, y, x1 - (k % 2) * 2.2, y]);
  }
  return lines(segs, VR.green, 2.2);
};
const sm6Paint = (cab) => (c, g) => {
  const L = g.L;
  let s = rect(0, 0, L, 17, VR.white) + rect(0, 13.0, L, 2, "#b6bcc3") + line(0, 13.0, L, 13.0, "rgba(0,0,0,0.15)", 0.5) +
    rect(0, 7.3, L, 3.0, "#2a2e33") + rect(0, 0, L, 3.9, "#3a3f45");
  if (cab) {
    s += path("M0 3.9L0 13.0L30.0 13.0L33.0 3.9Z", VR.green) + sm6Lines(31.0, 52.0, 4.6, 12.4) + path(poly([[2.2, 8.4], [7.4, 12.6], [12.6, 12.6], [12.6, 8.2], [6.0, 8.0]]), "#5d646c");
  } else s += sm6Lines(-1, 18.0, 4.6, 12.4, 7) + sm6Lines(L - 18.0, L + 1, 4.6, 12.4, 7);
  return s;
};
const sm6Door = (x) => ({ x, w: 2.9, y0: 3.8, y1: 11.2, glassY: 0.55, glassH: 0.3, grabs: false, fill: "rgba(0,0,0,0.08)" });
const sm6Cab = (c) => bilevel({ ...c, cabL: true }, { ...SM6,
  nose: [[3.0, 3.6], [1.0, 4.6], ["q", 0.3, 5.9, 1.4, 7.4], [7.6, 12.6], ["q", 9.6, 14.0, 12.8, 14.0]], cabLen: 13,
  rows: [{ xs: seq(30.0, 4.6, 12), y: 7.6, w: 3.0, h: 2.4, r: 0.35 }], doors: [sm6Door(23.0), sm6Door(c.L - 5.0)], paint: sm6Paint(true),
  extra: (c, g) => boxes(g.L / 2 - 22, g.L / 2 + 22, 3.6, 4, 0.95) + hvac(34, g.roof, 13) + roofCover(60, g.roof, 9, 0.45) + horns(13.6, g.roof - 0.02) +
    vrMark(c, 26.0, 6.0, 2.4, "#ffffff") + vrMark(c, 3.6, 5.2, 0.9, "#ffffff"),
  cab: () => path(poly([[2.8, 8.6], [7.6, 12.3], [11.8, 12.3], [11.8, 8.9], [6.2, 8.6]]), C.glass) + path(poly([[3.4, 8.85], [5.8, 10.6], [6.6, 10.6], [4.4, 8.85]]), C.glassLight) +
    wiper(4.2, 8.9, 6.4, 10.8) + lamp(1.05, 5.0, 0.8, 0.45) + lamp(1.9, 5.7, 0.5, 0.3, RED_LAMP) + emuFront(3.0, 3.6, { coupler: 2.9 }) +
    path(poly([[19.4, 7.4], [21.6, 7.4], [22.0, 10.8], [19.0, 11.4]]), C.glass),
});
const sm6Mid = (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...SM6,
  rows: [{ xs: seq(6.4, 4.6, 15), y: 7.6, w: 3.0, h: 2.4, r: 0.35 }], doors: [sm6Door(1.6), sm6Door(c.L - 4.5)], paint: sm6Paint(false),
  extra: (c, g) => boxes(g.L / 2 - 22, g.L / 2 + 22, 3.6, 4, 0.95) + hvac(46, g.roof, 13) +
    (c.pan ? pantograph(16.0, g.roof) + panGear(16.0, g.roof, 1) : roofCover(18, g.roof, 9, 0.45)) + vrMark(c, g.L / 2, 11.4, 0.8, VR.green),
});

// --- Transtech double-deck InterCity cars (VR, since 1998): 26.4 m over
// the buffers, 5.2 m tall; a deep low floor between the bogies, the end
// sections over them at a middle level with the doors, one plug door a side
// at each end. Coaches carry eleven windows upstairs and ten downstairs;
// the sleeping cars (CEmt) a smaller window to each compartment on both
// decks. The driving trailers lead push-pull trains with a sloping cab in
// the upper end. VR's white over a green band along the bottom, a leaf of
// green strokes and VR over each end section, green doors, a gray roof
// with the air conditioning at the ends; side buffers.
const DD = { roof: 16.9, sill: 4.0, cornerR: 1.1, end: 0.6, trucks: { centers: 63.0, wb: 8.2, d: 33 }, diaphragm: [4.3, 11.6], badge: false };
const ddEndArt = (c, x, dir) => strokes(dir > 0 ? x : x - 3.3, 11.3, 15.2, 3, dir > 0 ? { w: 0.5, gap: 0.85, lean: 1.6, fills: [VR.green, VR.light, VR.green] }
  : { w: 0.5, gap: 0.85, lean: -1.6, fills: [VR.green, VR.light, VR.green] }) + vrMark(c, x + dir * 6.4, 13.1, 1.7, VR.green);
const ddPaint = (c, g) => {
  const L = g.L;
  let s = rect(0, 0, L, 18, VR.white) + rect(0, 15.6, L, 2, "#c3c8ce") + line(0, 15.6, L, 15.6, "rgba(0,0,0,0.15)", 0.5) +
    rect(0, 0, L, 4.75, VR.green) + rect(0, 4.75, L, 0.2, VR.deep) + rect(0, 0, L, 2.4, VR.deep);
  // The decks' window bands and the doors' green.
  s += rect(17.0, 11.6, L - 34.0, 3.15, "#d9dde1", 0, 'rx="0.4"') + rect(19.4, 4.7, L - 38.8, 3.15, "#d9dde1", 0, 'rx="0.4"');
  for (const x of [1.45, L - 4.75]) s += rect(x, 4.0, 3.3, 7.45, VR.green);
  return s;
};
const ddDoor = (x) => ({ x, w: 3.0, y0: 4.15, y1: 11.3, glassY: 0.55, glassH: 0.3 });
const ddRows = (up, low) => [{ xs: up, y: 11.9, w: 4.0, h: 2.55, r: 0.4 }, { xs: low, y: 5.0, w: 4.0, h: 2.55, r: 0.4 }];
const ddEnds = (L) => [{ xs: [6.4, L - 10.0], y: 8.0, w: 3.6, h: 2.4, r: 0.4 }];
const ddExtra = (c, g, cab = false) => {
  const L = g.L;
  let s = hvac(cab ? 9.0 : 3.0, g.roof, 9.5) + hvac(L - 12.5, g.roof, 9.5) + ddEndArt(c, L - 6.0, -1) + (cab ? "" : ddEndArt(c, 6.2, 1));
  s += boxes(L / 2 - 20, L / 2 + 20, 1.65, 3, 0.4) + buffers(L, 1, { y: 3.5 }) + (cab ? "" : buffers(0, -1, { y: 3.5 }));
  // The destination display over the B-end door.
  return s + rect(L - 4.9, 11.75, 3.6, 0.8, "#1d2024", 0, 'rx="0.12"') + rect(L - 4.7, 11.9, 2.2, 0.5, "#f4a321", 0, 'rx="0.06"');
};
const ddCoach = (c) => bilevel(c, { ...DD, drop: { a: 15.5, b: c.L - 15.5, y: 1.6 }, paint: ddPaint,
  rows: [...ddRows(seq(17.6, 4.85, 11), seq(20.0, 4.85, 10)), ...ddEnds(c.L)], doors: [ddDoor(1.6), ddDoor(c.L - 4.6)],
  extra: (c, g) => ddExtra(c, g) });
const ddSleeper = (c) => bilevel(c, { ...DD, drop: { a: 15.5, b: c.L - 15.5, y: 1.6 }, paint: ddPaint,
  rows: [{ xs: seq(18.4, 6.4, 8), y: 12.2, w: 3.1, h: 2.2, r: 0.35 }, { xs: seq(18.4, 6.4, 8), y: 5.3, w: 3.1, h: 2.2, r: 0.35 }, ...ddEnds(c.L)],
  doors: [ddDoor(1.6), ddDoor(c.L - 4.6)],
  extra: (c, g) => ddExtra(c, g) + lines(seq(17.9, 6.4, 9).map((x) => [x, 5.0, x, 15.0]), "rgba(0,0,0,0.1)", 0.5) });
const ddCab = (c) => bilevel({ ...c, cabL: true }, { ...DD, drop: { a: 17.5, b: c.L - 15.5, y: 1.6 },
  nose: [[1.3, 4.0], [1.05, 7.4], ["q", 1.05, 9.6, 2.1, 11.0], [3.9, 15.2], ["q", 4.6, 16.9, 6.6, 16.9]],
  paint: (c, g) => ddPaint(c, g) + path("M0 3.9L0 11.0L2.3 11.0Q5.6 10.4 8.2 8.0L8.2 3.9Z", VR.green) +
    path(poly([[2.2, 11.3], [3.95, 15.75], [8.2, 15.75], [8.2, 11.3]]), "#1d2024") + vrMark(c, 3.9, 6.6, 1.2, "#ffffff"),
  rows: [...ddRows(seq(19.4, 4.85, 10), seq(21.6, 4.85, 9)), { xs: [c.L - 10.0], y: 8.0, w: 3.6, h: 2.4, r: 0.4 }],
  doors: [ddDoor(10.6), ddDoor(c.L - 4.6)], cabLen: 9,
  extra: (c, g) => ddExtra(c, g, true),
  cab: () => path(poly([[2.5, 11.6], [4.1, 15.5], [7.6, 15.5], [7.6, 11.6]]), C.glass) + path(poly([[2.9, 11.9], [3.7, 13.8], [4.4, 13.8], [3.6, 11.9]]), C.glassLight) +
    win(7.9, 8.2, 2.0, 2.2, 0.3) + wiper(3.0, 11.9, 4.0, 14.6) + lamp(1.1, 7.6, 0.45, 0.5) + lamp(1.15, 6.8, 0.35, 0.32, RED_LAMP) +
    lamp(5.4, 16.3, 0.6, 0.25) + buffers(0, -1, { y: 3.5 }) + path(poly([[1.2, 4.0], [4.6, 4.0], [4.2, 1.2], [1.8, 1.0]]), "#2a2d31"),
});

// --- CAF Sm4 (VR, 30 two-car units, 1998-2005): two motor cars of 26.45 m,
// each with a pantograph, a rounded cab nose at the outer ends; two double
// doors a side on each car, toward its ends. VR's scheme: white, the
// windshield in a black mask over a green nose with VR in white, a green
// band below the windows, green doors with a leaf of lighter strokes
// beside them; a gray roof, air conditioning at the ends, the pantograph
// and its breaker toward the inner end.
const SM4 = { roof: 12.8, sill: 3.8, cornerR: 1.0, end: 0.6, trucks: { centers: 61.0, wb: 8.9, d: 33 }, diaphragm: [4.0, 11.6], badge: false,
  nose: [[1.2, 3.8], [0.9, 5.6], ["q", 0.9, 7.4, 1.9, 8.6], [4.4, 11.8], ["q", 5.4, 12.8, 7.2, 12.8]], cabLen: 7,
  cab: () => path(poly([[2.1, 8.9], [4.5, 11.6], [6.4, 11.6], [6.4, 8.9]]), C.glass) + path(poly([[2.5, 9.15], [3.6, 10.4], [4.2, 10.4], [3.2, 9.15]]), C.glassLight) +
    win(6.9, 7.4, 1.7, 2.6, 0.3) + wiper(2.6, 9.0, 3.9, 10.9) + lamp(1.0, 6.0, 0.45, 0.45) + lamp(0.98, 5.25, 0.35, 0.3, RED_LAMP) + lamp(5.4, 12.25, 0.55, 0.25) +
    emuFront(1.2, 3.8, { coupler: 3.0 }) };
const sm4Doors = (L) => [14.0, L - 16.4];
const sm4 = married((c) => bilevel(c, { ...SM4,
  paint: (c, g) => {
    const L = g.L;
    let s = rect(0, 0, L, 17, VR.white) + rect(0, 12.0, L, 2, VR.roof) + line(0, 12.0, L, 12.0, "rgba(0,0,0,0.15)", 0.5) +
      rect(0, 5.0, L, 1.25, VR.green) + rect(0, 0, L, 4.25, VR.skirt);
    for (const x of sm4Doors(L)) s += rect(x - 0.15, 3.8, 4.9, 7.25, VR.green) + strokes(x + 5.0, 6.4, 10.6, 2, { w: 0.35, gap: 0.7, lean: 1.0, fills: [VR.light, VR.green] });
    s += path(poly([[1.65, 8.5], [4.35, 11.85], [6.65, 11.85], [6.65, 8.5]]), "#1d2024") + path("M0 4.25L0 8.4L2.0 8.4Q4.0 7.0 7.0 6.25L7.0 5.0Z", VR.green) +
      vrMark(c, 3.4, 6.4, 1.15, "#ffffff");
    return s;
  },
  rows: [{ xs: [9.8], y: 7.1, w: 2.6, h: 2.85, r: 0.35 }, { xs: seq(22.5, 5.05, 8), y: 7.1, w: 4.1, h: 2.85, r: 0.35 }, { xs: [c.L - 9.3], y: 7.1, w: 4.1, h: 2.85, r: 0.35 }],
  doors: sm4Doors(c.L).map((x) => ({ x, w: 4.6, y0: 3.9, y1: 10.9, leaves: 2, glassY: 0.4, glassH: 0.45 })),
  extra: (c, g) => hvac(9.0, g.roof, 9.0) + roofCover(32, g.roof, 12, 0.5) + boxes(20, g.L - 20, g.sill, 4, 1.1) +
    (c.pan ? pantograph(g.L - 20, g.roof, { facing: -1 }) + panGear(g.L - 20, g.roof, -1) : rect(g.L - 22.8, g.roof - 0.05, 5.6, 0.35, C.steelDark, 0.4)),
}));

// --- Valmet Sm2 (VR, 1975-81, 50 built, about 34 left): a motor car with a
// pantograph and an unpowered driving trailer (Eioc), each 26.6 m, flat
// cab ends with two windshield panes, the headlights under them; two
// double doors a side. Refurbished: white, a green band below the windows
// over a dark skirt, green doors, VR beside the front door; the motor
// car's resistor box and pantograph on the roof.
const sm2Doors = (L) => [13.4, L - 17.0];
const sm2 = married((c) => bilevel(c, {
  roof: 12.5, sill: 3.9, cornerR: 1.0, end: 0.6, trucks: { centers: 61.5, wb: 8.5, d: 36 }, diaphragm: [4.1, 11.4], badge: false,
  nose: [[0.8, 3.9], [0.7, 8.4], ["q", 0.75, 11.8, 1.4, 12.2], ["q", 1.8, 12.5, 2.8, 12.5]], cabLen: 5,
  paint: (c, g) => {
    const L = g.L;
    let s = rect(0, 0, L, 17, VR.white) + rect(0, 11.6, L, 2, VR.roof) + rect(0, 4.3, L, 2.3, VR.green) + rect(0, 6.6, L, 0.15, VR.deep) + rect(0, 0, L, 4.3, VR.skirt);
    for (const x of sm2Doors(L)) s += rect(x - 0.15, 3.9, 5.1, 7.15, VR.green);
    return s + rect(0, 7.8, 0.9, 3.4, "#1d2024") + vrMark(c, 21.6, 5.45, 1.4, "#ffffff");
  },
  rows: [{ xs: [6.2], y: 7.3, w: 2.2, h: 2.6, r: 0.3 }, { xs: seq(21.0, 5.2, 9), y: 7.3, w: 4.3, h: 2.6, r: 0.3 }, { xs: [c.L - 8.6], y: 7.3, w: 4.3, h: 2.6, r: 0.3 }],
  doors: sm2Doors(c.L).map((x) => ({ x, w: 4.8, y0: 4.0, y1: 10.9, leaves: 2, glassY: 0.4, glassH: 0.45 })),
  cab: () => win(1.0, 8.2, 1.5, 2.5, 0.3) + win(2.9, 7.6, 1.6, 2.6, 0.3) + lamp(0.75, 5.4, 0.35, 0.5) + lamp(0.75, 4.75, 0.3, 0.3, RED_LAMP) +
    lamp(1.2, 11.9, 0.6, 0.25) + horns(2.2, 12.45) + emuFront(0.8, 3.9, { coupler: 3.0 }),
  extra: (c, g) => boxes(18, g.L - 18, g.sill, 4, 1.25) + hvac(g.L - 16, g.roof, 8.0) +
    (c.pan ? pantograph(g.L - 18, g.roof, { facing: -1 }) + roofCover(22, g.roof, 30, 0.7, "#8d949c", 5) + slats(23, g.roof + 0.1, 28, 0.5, 0.45, "rgba(0,0,0,0.3)") : roofCover(24, g.roof, 10, 0.4)),
}));

// --- ČKD Dm12 (VR 4401-4416, 2004-06): a 25.2 m diesel railcar with a cab
// at each end, two MAN engines under the floor, their exhausts and
// radiators on the roof; a double door a side behind each cab. White, a
// green skirt rising over the noses, green doors, a dark window band, VR
// on the side.
const dm12 = (c) => bothEnds(c, (h) => bilevel(h, {
  roof: 12.6, sill: 3.9, cornerR: 1.0, end: 0.6, trucks: { centers: 55.0, wb: 7.9, d: 33 }, diaphragm: [4.1, 11.4], badge: false,
  nose: [[1.2, 3.9], [1.0, 6.0], ["q", 1.0, 8.0, 2.0, 9.0], [3.5, 11.8], ["q", 4.1, 12.6, 5.6, 12.6]], cabLen: 6,
  paint: (c, g) => rect(0, 0, g.L, 17, VR.white) + rect(0, 11.8, g.L, 2, VR.roof) + rect(0, 0, g.L, 5.0, VR.green) + rect(0, 5.0, g.L, 0.15, VR.deep) +
    rect(0, 0, g.L, 3.0, VR.skirt) + path("M0 5.0L0 8.6L2.2 8.6Q4.0 6.4 6.0 5.0Z", VR.green) + rect(13.8, 6.7, g.L, 3.6, "#2a2e33", 0, 'rx="0.3"') +
    rect(7.85, 3.9, 4.7, 7.15, VR.green) + path(poly([[1.85, 8.95], [3.4, 11.8], [5.7, 11.8], [5.7, 8.95]]), "#1d2024") +
    (h.half === 0 ? vrMark(c, 32.0, 5.9, 1.3, "#ffffff") : ""),
  rows: [{ xs: seq(14.6, 5.2, 6), y: 7.0, w: 4.2, h: 3.0, r: 0.35 }],
  doors: [{ x: 8.0, w: 4.4, y0: 3.9, y1: 10.9, leaves: 2, glassY: 0.4, glassH: 0.45 }],
  extra: (c, g) => roofCover(15, g.roof, 9, 0.6, "#8d949c") + slats(15.8, g.roof + 0.1, 7.4, 0.4, 0.4, "rgba(0,0,0,0.35)") + rect(25.6, g.roof, 0.5, 1.0, "currentColor") +
    hvac(33.5, g.roof, 8.0) + boxes(16, 40, 3.0, 2, 1.0) + rect(19.0, 1.4, 6.5, 0.55, "#2a2d31", 0.4, 'rx="0.25"'),
  cab: () => path(poly([[2.1, 9.2], [3.6, 11.5], [5.4, 11.5], [5.4, 9.2]]), C.glass) + wiper(2.6, 9.3, 3.5, 11.0) +
    lamp(1.05, 6.3, 0.45, 0.45) + lamp(1.0, 5.55, 0.35, 0.3, RED_LAMP) + lamp(4.0, 12.15, 0.55, 0.25) + horns(5.8, 12.6) + emuFront(1.2, 3.9, { coupler: 3.0 }),
}));

// --- Stadler Dr19 (Stadler Valencia, 2022-2026, 60 ordered, 2831-2890; in
// service since May 2023): a Bo'Bo' diesel-electric hood unit, 18.0 m over
// the buffers, 4.9 m to the top of the cab's roof gear, 88 t, two
// Caterpillar C32 engines of 950 kW, 120 km/h (fi.wikipedia "Dr19"). Built
// mainly for freight, it hauls the night train between Tornio and Kolari,
// where the line has no wires (a photograph of PYO 276 at Tornio-Itäinen,
// July 2026). From photographs at Vuosaari, Tampere and Kolari: a long hood
// of hinged doors over one truck, the cab standing tall behind it, a short
// hood beyond with the radiator's X-braced screen at its end; a deep gray
// frame on the trucks, walkways round the hoods behind silver railings,
// steps at the four corners and a yellow and black chevroned buffer beam.
// VR's paint: the bright green all over the hoods and cab, VR big in white
// on the cab side over the number, the frame and trucks dark gray.
const DR19 = { deck: 5.7, frame: 3.1, hood: 12.6, cab: 14.4, green: "#3dbb3a" };
const dr19 = (c) => {
  const L = c.L, { deck, frame, hood, cab, green } = DR19;
  const cabA = 32.0, cabB = 40.4;
  let s = "";
  // Trucks and the frame with its walkways and buffer beams.
  for (const x of [13.6, L - 13.6]) s += truck(x, { wb: 8.5, d: 39, kind: "loco", top: frame });
  s += rect(0.9, frame, L - 1.8, deck - frame, "#59606a", 0.5, 'rx="0.15"') + line(1.2, deck - 0.15, L - 1.2, deck - 0.15, "rgba(255,255,255,0.25)", 0.5);
  s += boxes(20.5, 37.5, frame, 3, 1.2, "#4a5057") + rect(22, frame - 1.6, 12, 1.2, "#3a3f45", 0.4, 'rx="0.4"');   // fuel tank and battery boxes
  for (const [x, k] of [[0, 1], [L, -1]]) {
    // The buffer beam in chevrons, buffers and the screw coupling.
    const bx = k > 0 ? x + 0.9 : x - 2.3;
    s += rect(bx, frame - 0.4, 1.4, 2.0, "#2a2d31") + [0, 1, 2].map((j) => path(poly([[bx + 0.1, frame - 0.3 + j * 0.65], [bx + 0.6, frame - 0.3 + j * 0.65], [bx + 1.3, frame + 0.3 + j * 0.65], [bx + 0.8, frame + 0.3 + j * 0.65]]), "#f2c200")).join("");
    s += buffers(x, -k, { y: 3.5, reach: 1.2 });
    // Steps down from the deck at the corner.
    s += lines([[x + k * 2.6, deck, x + k * 2.6, 1.6], [x + k * 4.4, deck, x + k * 4.4, 1.6]], "#9aa1a9", 0.8) + lines([2.2, 3.3, 4.4].map((y) => [x + k * 2.6, y, x + k * 4.4, y]), "#9aa1a9", 0.8);
  }
  // Long hood: hinged doors in pairs, their handles; louvers near the cab.
  s += path(`M3.6 ${deck}L3.6 ${hood - 0.4}Q3.6 ${hood} 4.1 ${hood}L${cabA} ${hood}L${cabA} ${deck}Z`, green, 0.5);
  const doorsAt = seq(4.4, 3.45, 8);
  s += lines(doorsAt.map((x) => [x, deck + 0.4, x, hood - 0.5]), "rgba(0,0,0,0.28)", 0.5) + doorsAt.map((x) => rect(x + 2.6, deck + 3.0, 0.18, 0.7, "#2a2d31")).join("");
  s += slats(cabA - 6.0, deck + 1.0, 5.2, hood - deck - 2.0, 0.4, "rgba(0,0,0,0.3)");
  s += rect(3.6, hood - 0.25, cabA - 3.6, 0.25, "#8d949c") + lamp(4.2, deck + 1.2, 0.45, 0.45);
  // The cab: tall, its side windows and door, the windshield ahead and
  // behind (seen edge-on as dark frames), a gray roof with the air
  // conditioning and horns.
  s += rect(cabA, deck, cabB - cabA, cab - deck, green, 0.5) + rect(cabA - 0.3, cab, cabB - cabA + 0.6, 0.35, "#8d949c", 0.4);
  s += rect(cabA + 0.5, cab - 3.3, 2.6, 2.4, C.glass, 0, `stroke="${C.gasket}" stroke-width="0.6"`) + rect(cabA + 4.2, cab - 3.3, 3.3, 2.4, C.glass, 0, `stroke="${C.gasket}" stroke-width="0.6"`);
  s += rect(cabA - 0.2, cab - 3.4, 0.3, 2.6, "#1d2024") + rect(cabB - 0.1, cab - 3.4, 0.3, 2.6, "#1d2024");
  s += rect(cabA + 3.8, cab - 2.6, 0.5, 1.0, "#c9ced3", 0.3);                                                    // mirror
  s += hvac(cabA + 1.0, cab + 0.35, 4.6, 0.8, "#9aa1a9") + horns(cabB - 2.4, cab + 0.35) + rect(cabA + 6.0, cab + 0.35, 0.3, 0.9, "currentColor");
  s += vrMark(c, cabA + 4.4, deck + 3.6, 2.1, "#ffffff");
  // Short hood: the radiator's X-braced screen at the end, a headlight.
  s += path(`M${cabB} ${deck}L${cabB} ${hood - 0.6}L${L - 4.1} ${hood - 0.6}Q${L - 3.6} ${hood - 0.6} ${L - 3.6} ${hood - 1.1}L${L - 3.6} ${deck}Z`, green, 0.5);
  s += lines(seq(cabB + 1.4, 1.25, 5).map((x) => [x, deck + 0.8, x, hood - 1.3]), "rgba(0,0,0,0.3)", 0.5);
  const gx = L - 10.2;
  s += rect(gx, deck + 0.7, 6.0, hood - deck - 2.0, "#2b6b28", 0.4) + lines([[gx, deck + 0.7, gx + 6.0, hood - 1.3], [gx + 6.0, deck + 0.7, gx, hood - 1.3]], "#7fd36f", 0.7);
  s += lamp(L - 4.6, deck + 1.2, 0.45, 0.45);
  // Railings along the walkways.
  const rail = (a, b) => lines([[a, deck + 3.1, b, deck + 3.1], [a, deck + 1.6, b, deck + 1.6], ...seq(a, (b - a) / Math.max(1, Math.round((b - a) / 3.4)), Math.round((b - a) / 3.4) + 1).map((x) => [x, deck, x, deck + 3.1])], "#b9bfc6", 0.7);
  s += rail(1.4, 3.4) + rail(L - 3.4, L - 1.4) + rail(8.0, cabA - 0.6);
  return s;
};

// --- Stadler FLIRT, Sm5 (81 four-car units, 2008-17, owned by the capital
// region's Pääkaupunkiseudun Junakalusto): 75.2 m, two cab sections and
// two intermediate ones on shared bogies. HSL's scheme: white, a purple
// line along the top of the side that drops down the nose; behind the cab
// a big purple disc over the crew door, HSL in white on it; the nose's
// lower face in coral; a dark skirt; the pantograph on the third section.
const SM5 = { body: HSL.white, roof: "#a9afb6", skirt: "#3a3f45", door: null, mask: "#1d2024",
  paint: (c, g, part) => {
    const L = g.L;
    let s = rect(0, 12.1, L, 0.42, HSL.purple) + rect(0, 3.55, L, 0.18, "#8d949c");
    if (part === "cab") {
      s += path("M0 3.0L0 7.2L1.2 7.2Q2.6 6.6 3.4 5.0L3.4 3.0Z", HSL.coral) +
        path("M1.3 7.6Q4.6 9.2 6.4 12.1L9.6 12.1L9.6 12.52L6.1 12.52Q4.3 9.6 1.1 8.0Z", HSL.purple);
      s += `<ellipse cx="10.2" cy="7.9" rx="4.6" ry="4.4" fill="${HSL.purple}"/>` + letters(c, 10.6, 5.6, 0.95, "HSL", "#ffffff", { weight: 800 });
      s += letters(c, 26.5, 4.55, 0.5, "VR", "#8d949c", { weight: 800, italic: true });
    }
    return s;
  },
};
const sm5Cab = (c) => flirt(c, "cab", SM5);
const sm5Mid = (c) => flirt(c, "mid", SM5);

export const TYPES = {
  vrSr2: { name: "Sr2 electric locomotive", kind: "electric", pan: true },
  vrSr3: { name: "Sr3 (Siemens Vectron) electric locomotive", kind: "electric", pan: true },
  vrSr1: { name: "Sr1 electric locomotive", kind: "electric", pan: true },
  vrSm6Cab: { name: "Sm6 Pendolino Plus end car", kind: "emu" },
  vrSm6Mid: { name: "Sm6 Pendolino Plus car", kind: "emu", pan: true },
  vrSm3Cab: { name: "Sm3 Pendolino end car", kind: "emu" },
  vrSm3Mid: { name: "Sm3 Pendolino car", kind: "emu", pan: true },
  vrEd: { name: "Double-deck InterCity coach", kind: "bilevel" },
  vrEdCab: { name: "Double-deck driving trailer", kind: "bilevel", cab: true },
  vrSleeper: { name: "Double-deck sleeping car", kind: "bilevel", amenities: ["sleepers"] },
  vrSm4: { name: "Sm4 electric car", kind: "emu", pan: true },
  vrSm2: { name: "Sm2 electric car", kind: "emu", pan: true },
  vrDm12: { name: "Dm12 diesel railcar", kind: "emu" },
  vrDr19: { name: "Dr19 diesel locomotive", kind: "diesel" },
  hslSm5Cab: { name: "Sm5 (Stadler FLIRT) cab section", kind: "emu", pan: true },
  hslSm5Mid: { name: "Sm5 (Stadler FLIRT) intermediate section", kind: "emu", pan: true },
};

const M = (draw, len, oneEnd = false) => ({ draw, len, oneEnd, variant: null });
export const MODELS = {
  vrSr2: M((c) => lok2000(c), 62.4),
  vrSr3: M(sr3, 62.5),
  vrSr1: M(sr1, 62.2),
  vrSm6Cab: M(sm6Cab, 89.2, true),
  vrSm6Mid: M(sm6Mid, 82.0),
  vrSm3Cab: M(sm3Cab, 86.9, true),
  vrSm3Mid: M(sm3Mid, 86.9),
  vrEd: M(ddCoach, 86.6),
  vrEdCab: M(ddCab, 86.6, true),
  vrSleeper: M(ddSleeper, 86.6),
  vrSm4: M(sm4, 86.8),
  vrSm2: M(sm2, 87.3),
  vrDm12: M(dm12, 82.7),
  vrDr19: M(dr19, 59.06),
  hslSm5Cab: M(sm5Cab, 70.5, true),
  hslSm5Mid: M(sm5Mid, 51.5),
};

// [first, last, type]: locomotive and unit numbers (a Pendolino's cars are
// numbered 71nn-76nn by unit, an Sm4's 63nn and 64nn, an Sm2's motor cars
// 6051-6100 and trailers 6251-6300; the Sm5s are units 1-81). The coaches'
// numbers aren't listed: 0 stands for the driving trailer, which no line's
// typical train shows, so the railroad's page lists it (no feed reports a
// car 0).
const SM4_SM2 = [[6301, 6330, "vrSm4"], [6401, 6430, "vrSm4"], [6051, 6100, "vrSm2"], [6251, 6300, "vrSm2"]];
export const FLEETS = {
  vr: [[3001, 3112, "vrSr1"], [3201, 3246, "vrSr2"], [3301, 3380, "vrSr3"], [7101, 7118, "vrSm3Cab"], [7201, 7218, "vrSm3Mid"], [7301, 7318, "vrSm3Mid"],
    [7401, 7418, "vrSm3Mid"], [7501, 7518, "vrSm3Mid"], [7601, 7618, "vrSm3Cab"], [4401, 4416, "vrDm12"], [2831, 2890, "vrDr19"], ...SM4_SM2,
    [0, 0, "vrEdCab"]],
  hsl: [[1, 81, "hslSm5Cab"], ...SM4_SM2],
};

// What runs where (VR's and HSL's published service patterns, as Wikipedia
// summarizes them): Pendolinos on the S trains; an Sr3 or Sr2 with double-
// deck coaches on the InterCitys, the night trains an Sr2 with double-deck
// sleeping cars; the regional trains on the branch lines without wires
// (Joensuu-Nurmes, Parikkala-Savonlinna, Tampere-Keuruu-Jyväskylä,
// Jyväskylä-Seinäjoki) Dm12 railcars, and Sm4s elsewhere. Around Helsinki
// the FLIRTs run HSL's lines; Sm4s the longer R, Z, D, H and T trains, two
// units together; Sm2s the G, M and O trains.
const set = (label, ...units) => ({ label, units });
const SM3_SET = set("Six-car Sm3 Pendolino", ["vrSm3Cab", 1], ["vrSm3Mid", 4], ["vrSm3Cab", 1]);
// The four Sm6s (Pendolino Plus) share the Helsinki-Turku and Helsinki-Oulu
// workings with the Sm3s since November 2025; the timetable doesn't say
// which train gets which, so those trains say both.
const SM3_OR_SM6 = set("Usually a six-car Sm3 Pendolino (some trains a seven-car Sm6 Pendolino Plus)", ["vrSm3Cab", 1], ["vrSm3Mid", 4], ["vrSm3Cab", 1]);
const SM6_SET = set("Seven-car Sm6 Pendolino Plus", ["vrSm6Cab", 1], ["vrSm6Mid", 5], ["vrSm6Cab", 1]);
const IC_SET = (loco) => set(`${{ vrSr1: "Sr1", vrSr2: "Sr2", vrSr3: "Sr3" }[loco]} locomotive with double-deck InterCity coaches${loco === "vrSr3" ? " (some trains an Sr1 or Sr2)" : ""}`, [loco, 1], ["vrEd", 6]);
const IC_PUSH = set("Sr3 locomotive with double-deck coaches and a driving trailer", ["vrSr3", 1], ["vrEd", 4], ["vrEdCab", 1]);
const NIGHT = set("Sr2 or Sr1 locomotive with double-deck sleeping cars and coaches (north of Tornio to Kolari a Dr19 diesel)", ["vrSr2", 1], ["vrSleeper", 4], ["vrEd", 2]);
// The Kolari night train between Tornio-Itäinen and Kolari, where the line
// has no wires: a Dr19 at its head (fi.wikipedia "Dr19": PYO 276 arriving
// at Tornio-Itäinen behind one, July 2026). A train with its stops is drawn
// with the Dr19 while it runs north of Tornio.
const KOLARI_LINE = /^(Ylitornio|Pello|Kolari)$/;
const NIGHT_SOUTH = set("Sr2 or Sr1 locomotive with double-deck sleeping cars and coaches", ["vrSr2", 1], ["vrSleeper", 4], ["vrEd", 2]);
const NIGHT_DR19 = set("Dr19 diesel locomotive (Tornio–Kolari, where the line has no wires) with double-deck sleeping cars and coaches", ["vrDr19", 1], ["vrSleeper", 4], ["vrEd", 2]);
function northOfTornio(t) {
  const stops = t.stops || [], i = stops.findIndex((s) => s.status === "next");
  if (i < 0) return false;
  const tornio = stops.findIndex((s) => s.name === "Tornio-Itäinen");
  if (tornio < 0) return false;
  // Northbound: past Tornio; southbound: Tornio still ahead or the next stop.
  return KOLARI_LINE.test(stops[stops.length - 1].name || "") ? i > tornio : i <= tornio;
}
const SM4_SET = set("Two two-car Sm4 units", ["vrSm4", 4]);
const SM2_SET = set("Two-car Sm2 units, often two together", ["vrSm2", 4]);
const SM5_SET = set("Four-section Sm5 FLIRT", ["hslSm5Cab", 1], ["hslSm5Mid", 2], ["hslSm5Cab", 1]);
const DM12_SET = set("Dm12 diesel railcar", ["vrDm12", 1]);
// Joensuu-Pieksämäki is a railcar's run too (VR's own page for train 729
// says "Railcar"), and so is Iisalmi-Ylivieska, among the railbus lines in
// Traficom's 2024 report on them, though both are under wires.
const DM12_ENDS = /Nurmes|Savonlinna|Parikkala|Keuruu|Haapamäki|Seinäjoki|Jyväskylä|Pieksämäki|Iisalmi|Ylivieska/;
const BY_TYPE = { vrSr1: IC_SET("vrSr1"), vrSm6Cab: SM6_SET, vrSm6Mid: SM6_SET, vrSr2: IC_SET("vrSr2"), vrSr3: IC_SET("vrSr3"), vrSm3Cab: SM3_SET, vrSm3Mid: SM3_SET, vrEd: IC_SET("vrSr3"), vrEdCab: IC_PUSH,
  vrSleeper: NIGHT, vrSm4: SM4_SET, vrSm2: SM2_SET, vrDm12: DM12_SET, hslSm5Cab: SM5_SET, hslSm5Mid: SM5_SET };
export const TYPICAL = {
  vr: (t, reported) => {
    if (BY_TYPE[reported]) return BY_TYPE[reported];
    switch (t.route) {
      case "Pendolino": return /Turku|Oulu/.test(`${t.origin || ""} ${t.destination || ""}`) ? SM3_OR_SM6 : SM3_SET;
      case "InterCity": return IC_SET("vrSr3");
      case "Night train": return northOfTornio(t) ? NIGHT_DR19 : /Kolari/.test(`${t.origin || ""} ${t.destination || ""}`) ? NIGHT : NIGHT_SOUTH;
      case "Regional": return DM12_ENDS.test(`${t.origin || ""} ${t.destination || ""}`) && !/Helsinki/.test(`${t.origin || ""} ${t.destination || ""}`) ? DM12_SET : SM4_SET;
      default: return IC_SET("vrSr2");
    }
  },
  hsl: (t, reported) => {
    if (BY_TYPE[reported]) return BY_TYPE[reported];
    if (/^[RZDHT]$/.test(t.route || "")) return SM4_SET;
    if (/^[GMO]$/.test(t.route || "")) return SM2_SET;
    return SM5_SET;
  },
};


// Fact sheets, in data/models.json's units (mph, hp, ft), converted from the
// published km/h, kW and m closely enough to show as published in metric.
const WIKI = "https://en.wikipedia.org/wiki/";
export const FACTS = {
  vrSr2: { model: "SLM/ABB Sr2", type: "Electric locomotive", builder: "SLM and ABB (Adtranz), assembled by Transtech", built: "1995–2003",
    fleet: "46, 3201–3246", topSpeedMph: 130.5, powerHp: 8046, lengthFt: 62.4,
    about: "A Finnish broad-gauge version of the Swiss Re 460. It hauls InterCity and night trains and some freight; the fleet has been repainted from the old red and white into VR's green and white since 2010.",
    source: WIKI + "VR_Class_Sr2" },
  vrSr3: { model: "Siemens Vectron (Sr3)", type: "Electric locomotive", builder: "Siemens Mobility", built: "2016–2026", fleet: "80, 3301–3380",
    topSpeedMph: 124.3, powerHp: 8582, lengthFt: 62.5,
    about: "VR's newest electric locomotive, first in service in 2017. It hauls double-deck InterCity trains as well as freight, bought to replace the older Sr1s.",
    source: WIKI + "VR_Class_Sr3" },
  vrSr1: { model: "NEVZ/Strömberg Sr1", type: "Electric locomotive", builder: "Novocherkassk (NEVZ), electrics by Strömberg", built: "1973–1995",
    fleet: "112 built, 3001–3112; 73 in service in 2025", topSpeedMph: 87, powerHp: 4290, lengthFt: 62.2,
    about: "VR's first electric locomotive, Soviet-built with Finnish electrical equipment. It still hauls InterCity, night and freight trains while the Sr3 replaces it.",
    source: WIKI + "VR_Class_Sr1" },
  vrSm6Cab: { model: "Alstom Pendolino Sm6 (Pendolino Plus)", type: "Tilting electric multiple unit", builder: "Alstom, Savigliano", built: "2009–2011",
    fleet: "4 seven-car units", topSpeedMph: 136.7, lengthFt: 606.3,
    about: "Built for the Helsinki–St Petersburg Allegro, idle after the service stopped in 2022, and back in VR's domestic service as Pendolino Plus since November 2025 on Helsinki–Turku and Helsinki–Oulu.",
    source: WIKI + "VR_Class_Sm6" },
  vrSm3Cab: { model: "Pendolino (Sm3)", type: "Tilting electric multiple unit", builder: "Fiat Ferroviaria (Alstom)", built: "1992–2006",
    fleet: "18 six-car units, 14 in service", topSpeedMph: 136.7, powerHp: 5364, seats: 309, lengthFt: 521.3,
    about: "VR's tilting train, an Italian Pendolino built for Finland's broad gauge and winters. It runs the S trains from Helsinki to Turku, Tampere, Oulu, Kuopio and Joensuu, and reaches 220 km/h between Kerava and Lahti.",
    source: WIKI + "VR_Class_Sm3" },
  vrEd: { model: "Double-deck InterCity coach", type: "Bi-level coach", builder: "Talgo-Transtech, Otanmäki", built: "Since 1998",
    topSpeedMph: 124.3, seats: 113, lengthFt: 86.6,
    about: "VR's long-distance trains are mostly made up of these double-deck cars, built in Finland and insulated for −35 °C. Among them are restaurant cars and cars with a children's play area.",
    source: "https://www.railvolution.net/news/makuuvaunut-and-other-vr-news-2" },
  vrEdCab: { model: "Double-deck driving trailer", type: "Bi-level cab car", builder: "Transtech", topSpeedMph: 124.3, seats: 100, lengthFt: 86.6,
    about: "A double-deck coach with a driving cab, so an InterCity can run push-pull without running the locomotive around at the end of the line.",
    source: "https://railwaygazette.com/passenger/vr-orders-more-double-deckers/35806.article" },
  vrSleeper: { model: "Double-deck sleeping car", type: "Bi-level sleeping car", builder: "Transtech", built: "Since 2005", topSpeedMph: 124.3, lengthFt: 86.6,
    about: "The night trains between Helsinki or Turku and Lapland carry double-deck sleeping cars with cabins on both decks, some with their own shower and toilet.",
    source: "https://www.railvolution.net/news/makuuvaunut-and-other-vr-news-2" },
  vrSm4: { model: "CAF Sm4", type: "Electric multiple unit", builder: "CAF", built: "1998–2005", fleet: "30 two-car units, 6301+6401–6330+6430",
    topSpeedMph: 99.4, powerHp: 1609, seats: 192, lengthFt: 173.6,
    about: "Two-car commuter and regional units on a design by Fiat Ferroviaria, both cars powered, each with its own pantograph. They run the longer commuter trains from Helsinki to Riihimäki and Lahti and regional trains around Tampere and Kouvola.",
    source: WIKI + "VR_Class_Sm4" },
  vrSm2: { model: "Valmet Sm2", type: "Electric multiple unit", builder: "Valmet (electrics by Strömberg)", built: "1975–1981",
    fleet: "50 built, about 34 in service", topSpeedMph: 74.6, powerHp: 831, lengthFt: 174.7,
    about: "A motor car and an unpowered driving trailer, refurbished twice. They still run the G, M and O trains and extra R and Z trains at rush hour; Stadler's new Sm7 units are to replace them.",
    source: WIKI + "VR_Class_Sm2" },
  vrDm12: { model: "ČKD Dm12", type: "Diesel railcar", builder: "ČKD Vagonka", built: "2004–2006", fleet: "16, 4401–4416",
    topSpeedMph: 74.6, powerHp: 807, lengthFt: 82.7,
    about: "A single-car diesel railcar with a cab at each end, built in the Czech Republic for VR's lines without overhead wires, such as Joensuu–Nurmes and Parikkala–Savonlinna.",
    source: WIKI + "VR_Class_Dm12" },
  vrDr19: { model: "Stadler Dr19", type: "Diesel-electric locomotive", builder: "Stadler Rail Valencia", built: "2022–2026", fleet: "60 ordered, 2831–2890",
    topSpeedMph: 74.6, powerHp: 2548, lengthFt: 59.1,
    about: "VR's new diesel, two Caterpillar engines in one hood unit, bought mainly for freight to replace the Dr14 and Dr16. It also hauls the night train between Tornio and Kolari, where the line has no wires.",
    source: "https://fi.wikipedia.org/wiki/Dr19" },
  hslSm5Cab: { model: "Stadler FLIRT (Sm5)", type: "Electric multiple unit", builder: "Stadler Rail", built: "2008–2017",
    fleet: "81 four-car units", topSpeedMph: 99.4, powerHp: 2682, lengthFt: 246.7,
    about: "The capital region's commuter trains, owned by Pääkaupunkiseudun Junakalusto, leased to HSL and run by VR. They serve every HSL line, including the Ring Rail Line to the airport, and wear HSL's purple.",
    source: WIKI + "VR_Class_Sm5" },
};
// A unit's other cars share its sheet, named for the part they are.
const part = (facts, name) => ({ ...facts, model: `${facts.model}, ${name}` });
FACTS.vrSm3Mid = part(FACTS.vrSm3Cab, "middle car");
FACTS.vrSm6Mid = part(FACTS.vrSm6Cab, "middle car");
FACTS.hslSm5Mid = part(FACTS.hslSm5Cab, "intermediate section");
