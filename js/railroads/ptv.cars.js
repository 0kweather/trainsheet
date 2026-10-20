// Victoria's trains (scripts/railroads/ptv.py): Metro Trains Melbourne's
// electric fleets (Comeng, Siemens Nexas, X'Trapolis 100, X'Trapolis 2.0 and
// the High Capacity Metro Train) and the Sprinter railcars on its Stony
// Point line; V/Line's VLocity railcars, its N class locomotives with their
// N sets, and its Sprinters. Trainsheet's own side views, from published
// dimensions and photographs of the October 2026 fleets, in the paint the
// state's trains now wear (Public Transport Victoria's, 2022 on Metro: the
// blue and its faceted panels, yellow door frames; V/Line's purple). The
// lettering is drawn as type, not copied from the logos.
//
// Metro's feed lists every car of a train (ptv.js orders them unit by
// unit): its three-car M-T-M units (Comeng, Siemens, X'Trapolis 100) run
// coupled in pairs, cab to cab in the middle of a six-car train, so their
// driving motor cars put their cab at whichever end of their unit they
// stand. V/Line's feed names only the lead unit or locomotive.
//
// Lengths, widths, heights, floor heights, wheelbases and wheels are the
// published figures cited above each class (Wikipedia's articles on each,
// from the builders' and operators' data). Where none is published (most
// classes' truck centers, door and window positions, heights of bands),
// they are measured off broadside photographs on Wikimedia Commons (2024-26)
// against the published car lengths, and said so. Not drawn: V/Line's last
// A class (A66, in the old orange and gray, hired to heritage groups) and
// the stored P class and H sets; a train led by one is drawn as its
// line's usual train.

import { newId, bilevel } from "../carmodels.js?v=dev";
import { C, rect, path, line, lines, poly, slats, pantograph, flutes, truck } from "../carart.js?v=dev";
import { bothEnds, letters, hvac, roofCover, panGear, horns, lamp, RED_LAMP, wiper, frames } from "./digitraffic.cars.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
const r2 = (v) => Math.round(v * 100) / 100;
// n windows w wide, evenly spaced and centered between a and b.
const fit = (a, b, w, n) => {
  const gap = (b - a - n * w) / (n + 1);
  return seq(a + gap, w + gap, n);
};

// Metro's colors (Public Transport Victoria's metropolitan blue, its facets,
// the yellow of the cab fronts and door frames) and the new trains' own.
const MT = {
  blue: "#0072ce", sky: "#2f97e4", navy: "#173f97", yellow: "#f5b700", steel: "#ccd1d6", silver: "#bfc5cb",
  hcmt: "#9aa1a8", hcmtNose: "#2c3036", xt2: "#2c9ce2", xt2Deep: "#1d5fb6", white: "#eceff1", roof: "#a3aab2", skirt: "#3a3e44",
};
const MT_FACETS = ["#1b5fc4", "#2a7fe0", "#4aa3ef", "#163f9c", "#2f6fd6", "#62b6f1", "#1f4fb0"];
// V/Line's: Public Transport Victoria's regional purple and its facets, the
// yellow-orange of the cab fronts and stripes.
const VL = { purple: "#8f1a95", deep: "#6c1272", yellow: "#f6a81c", white: "#f1f2f3", steel: "#c9ced3", band: "#262b31", grey: "#b9bec4", roof: "#9ea5ad" };
const VL_FACETS = ["#8f1a95", "#a53aa6", "#6e1477", "#b765b8", "#7d2a8c", "#c48bc8", "#9a2f9c"];

// ===================== Shared detail =====================

// Public Transport Victoria's faceted panels: the area from x0 to x1, y0 to
// y1 cut into triangles in the palette's shades, with fine light lines
// along some of their edges. seed makes each panel its own pattern, the
// same every time it's drawn.
function facets(x0, y0, x1, y1, palette, seed = 1, { cols = 0, rows = 3 } = {}) {
  let r = seed * 7919 + 13;
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const nc = cols || Math.max(1, Math.round((x1 - x0) / 4.5)), dx = (x1 - x0) / nc, dy = (y1 - y0) / rows;
  const P = [];
  for (let i = 0; i <= nc; i++) {
    P.push([]);
    for (let j = 0; j <= rows; j++) {
      const jx = i > 0 && i < nc ? (rnd() - 0.5) * dx * 0.9 : 0, jy = j > 0 && j < rows ? (rnd() - 0.5) * dy * 0.9 : 0;
      P[i].push([x0 + i * dx + jx, y0 + j * dy + jy]);
    }
  }
  const by = new Map(), edges = [];
  const tri = (a, b, c2) => {
    const col = palette[Math.floor(rnd() * palette.length)];
    by.set(col, (by.get(col) || "") + poly([a, b, c2]));
    if (rnd() < 0.3) edges.push([...a, ...c2]);
  };
  for (let i = 0; i < nc; i++) for (let j = 0; j < rows; j++) {
    const a = P[i][j], b = P[i + 1][j], c2 = P[i + 1][j + 1], d = P[i][j + 1];
    if (rnd() < 0.5) { tri(a, b, c2); tri(a, c2, d); } else { tri(a, b, d); tri(b, c2, d); }
  }
  return [...by].map(([col, d]) => path(d, col)).join("") + lines(edges, "rgba(255,255,255,0.35)", 0.35);
}
// Public Transport Victoria's mark, drawn as type: the letters PT and an
// arrowhead after them, h ft tall, centered at (x, y).
function ptMark(c, x, y, h, fill) {
  const k = c.mirrored ? -1 : 1;
  return `<g transform="translate(${r2(x)} ${r2(y)}) scale(${k} -1)"><text x="${r2(-h * 0.95)}" y="${r2(h * 0.36)}" font-size="${r2(h)}" font-weight="700" ` +
    `font-family="Helvetica Neue, Helvetica, Arial, sans-serif" fill="${fill}">PT</text>` +
    `<path d="M${r2(h * 0.55)} ${r2(-h * 0.42)}L${r2(h * 1.0)} ${r2(-h * 0.05)}L${r2(h * 0.55)} ${r2(h * 0.32)}" fill="none" stroke="${fill}" stroke-width="${r2(h * 0.16)}" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}
// METRO in thin capitals across the faceted panel behind a cab, the light
// showing through (drawn over the doors, as the lettering runs over them).
const metroWord = (c, x, y, h) => letters(c, x, y, h, "METRO", "rgba(255,255,255,0.4)", { weight: 300, spacing: 0.06 * h });
// V/Line's name as on its trains: a slash and the word, drawn as type.
function vlName(c, x, y, h, fill) {
  return letters(c, x + h * 0.55, y, h, "V/Line", fill, { weight: 600, italic: true });
}
// A door framed in yellow, its leaves in fill: painted under the door's
// outline (which bilevel() draws over it).
const doorPaint = (d, fill, frame = MT.yellow) => rect(d.x - 0.28, d.y0 - 0.12, d.w + 0.56, d.y1 - d.y0 + 0.3, frame, 0, 'rx="0.2"') + rect(d.x, d.y0, d.w, d.y1 - d.y0, fill);
// The anticlimber, a coupler on its drawbar and the hoses under a cab front.
function cabFoot(noseX, sill, { coupler = 2.85, skirt = "#2a2d31", reach = 3.2 } = {}) {
  let s = path(poly([[noseX - 0.2, sill + 0.05], [noseX + reach, sill + 0.05], [noseX + reach - 0.3, 1.05], [noseX + 0.6, 0.75], [noseX - 0.1, 1.6]]), skirt);
  s += line(noseX + 0.4, 1.25, noseX + reach - 0.5, 1.3, "rgba(255,255,255,0.18)", 0.6);
  s += rect(0.4, coupler - 0.28, noseX + 0.4, 0.56, "currentColor", 0, 'opacity="0.9"') + rect(0, coupler - 0.7, 0.5, 1.4, "currentColor", 0, 'rx="0.15"') +
    rect(0.6, coupler + 0.45, 0.8, 0.4, C.steelDark, 0.3);
  return s;
}
// A small aerial on the roof.
const aerial = (x, roof) => rect(x - 0.3, roof - 0.05, 0.6, 0.15, "currentColor") + line(x, roof + 0.1, x + 0.2, roof + 0.85, "currentColor", 0.6);
// A diesel's exhaust stack and its rain cap.
const exhaust = (x, roof) => rect(x, roof - 0.05, 1.4, 0.35, "#7d848c", 0.4, 'rx="0.1"') + rect(x + 0.4, roof + 0.3, 0.6, 0.45, "currentColor") + rect(x + 0.25, roof + 0.72, 0.9, 0.12, "currentColor");
// Under-floor gear hung from top: [x, w, h, kind]; kind "g" a grilled case
// (brake resistor, radiator), "t" a tank, "b" a box with doors, else a box.
function gear(top, list) {
  let s = "";
  for (const [x, w, h, k] of list) {
    if (k === "t") s += rect(x, top - h, w, h, "currentColor", 0, `opacity="0.62" rx="${r2(h / 2)}"`) + line(x + 0.6, top - h * 0.35, x + w - 0.6, top - h * 0.35, C.steelDark, 0.4);
    else {
      s += rect(x, top - h, w, h, "currentColor", 0, 'opacity="0.8" rx="0.12"');
      if (k === "g") s += slats(x + 0.2, top - h + 0.15, w - 0.4, h - 0.3, 0.35, "rgba(255,255,255,0.22)");
      else if (k === "b") s += lines([[x + w / 2, top - h + 0.15, x + w / 2, top - 0.15]], C.steelDark, 0.45);
      else s += line(x + 0.25, top - 0.28, x + w - 0.25, top - 0.28, C.steelDark, 0.4);
    }
  }
  return s;
}

// Where a car stands in its three-car unit: 0 the unit's first car, 2 its
// last, 1 between. Trains of whole units (3, 6, 9 cars) count by threes;
// anything else (a car drawn alone or in a pair) by the train's ends.
const unitPos = (c) => (c.count % 3 === 0 ? c.index % 3 : c.index === 0 ? 0 : c.index === c.count - 1 ? 2 : 1);
// A driving car of a three-car unit: drawn with its cab on the left as the
// unit's first car, mirrored as its last (the cab facing out of the unit
// either way, also in the middle of a six-car train, where two units meet
// cab to cab, coupler to coupler, with no gangway between).
const unitCab = (draw) => (c) => {
  const p = unitPos(c);
  if (p === 0) return draw({ ...c, cabL: true, cabR: false, coupledL: false });
  if (p === 2) return `<g transform="matrix(-1 0 0 1 ${c.L} 0)">${draw({ ...c, cabL: true, cabR: false, mirrored: !c.mirrored, coupledL: false, coupledR: c.coupledL })}</g>`;
  return draw({ ...c, cabL: false, cabR: false });
};

// A Metro or V/Line car on bilevel() (a single deck: the same roof height
// end to end), with the detail they share: the cant rail's rain strip,
// roof gear (spec.onRoof), under-floor gear (spec.gear), trucks with their
// brake units, and the cab's front (spec.front).
const unit = (c, spec) => bilevel(c, {
  end: 0.6, cornerR: 1.0, badge: false, ...spec,
  extra: (c, g) => {
    let s = "";
    for (const k of [-1, 1]) {
      const x = g.L / 2 + (k * spec.trucks.centers) / 2;
      s += rect(x + 1.6, 1.5, 1.0, 0.7, "#5a6068", 0, 'rx="0.15"') + line(x - spec.trucks.wb / 2 - 0.5, spec.sill - 0.5, x - 1.9, spec.sill - 0.5, "#5a6068", 0.9);
    }
    s += gear(spec.sill, spec.gear || []);
    if (spec.onRoof) s += spec.onRoof(c, g);
    return s + (spec.more ? spec.more(c, g) : "");
  },
  cab: (c, g) => (spec.cabArt ? spec.cabArt(c, g) : ""),
});
// Windows in black surrounds (the surrounds painted with the livery).
const framed = (rows) => rows.map((r) => frames(r.xs, r.y, r.w, r.h, 0.2, "#16191d")).join("");

// ===================== Metro Trains Melbourne =====================

// --- Comeng (Commonwealth Engineering, Dandenong, 1981-88): M-T-M units,
// motor cars 301M-698M (24.0 m), trailers 1001T-1199T (23.2 m), 71.2 m a
// unit, 3.05 m wide, 3,835 mm to the roof, run in pairs as six-car trains.
// Three pairs of sliding doors a side on each car, which riders pull open;
// three big windows between each pair (positions and the 16 m truck
// centers measured off photographs). Stainless steel, corrugated below the
// windows and over them; a pantograph on each motor car at its inner end.
// 100 units remained in June 2026 (Wikipedia: Comeng (train)), on the
// Craigieburn, Upfield, Frankston, Sandringham, Werribee and Williamstown
// lines, while the X'Trapolis 2.0 replaces them. Paint since the life
// extension (2017-21) and the 2022 Metro scheme: the bare steel, a blue
// band along the cant rail, a panel of blue facets behind the cab lettered
// METRO, the doors framed in yellow; the flat cab front yellow, its
// windshields in a black band, two blue chevrons under them either side of
// a third with PT on it (seen here only at its edge).
const COM = { roof: 12.58, sill: 3.55, trucks: { centers: 52.5, wb: 8.2, d: 36 }, diaphragm: [3.9, 11.6] };
const comDoor = (x) => ({ x, w: 4.3, y0: 3.75, y1: 10.75, leaves: 2, glassY: 0.5, glassH: 0.36, grabs: false, fill: "rgba(0,0,0,0.04)" });
const COM_WIN = { y: 6.7, w: 4.9, h: 3.25, r: 0.45 };
function comPaint(c, g, cab, doors, rows) {
  const L = g.L;
  let s = rect(0, 0, L, 17, MT.steel) + flutes(0, L, 3.7, 6.35, 0.26) + flutes(0, L, 10.25, 10.95, 0.26) + rect(0, 11.05, L, 2, MT.blue) + rect(0, 10.95, L, 0.1, "#0a4f96");
  if (cab) s += facets(1.4, 3.55, 16.4, 11.05, MT_FACETS, 3, { rows: 3 }) + path(poly([[0, 0], [1.5, 0], [1.5, 12.0], ["q", 1.5, 12.6, 2.4, 12.6], [0, 12.6]]), MT.yellow);
  for (const d of doors) s += doorPaint(d, MT.steel) + flutes(d.x, d.x + d.w, 3.8, 6.35, 0.26);
  return s + framed(rows);
}
function comCar(c, cab) {
  const L = c.L;
  const doors = cab ? [comDoor(11.4), comDoor(37.6), comDoor(64.2)] : [comDoor(5.8), comDoor(L / 2 - 2.15), comDoor(L - 10.1)];
  const end = { y: COM_WIN.y, w: 3.4, h: COM_WIN.h, r: COM_WIN.r };
  const rows = cab ? [{ ...end, w: 2.9, xs: [7.9] }, { ...COM_WIN, xs: [...fit(15.7, 37.6, COM_WIN.w, 3), ...fit(41.9, 64.2, COM_WIN.w, 3)] }, { ...end, xs: fit(68.5, L - 0.8, 3.4, 2) }] :
    [{ ...end, xs: [1.4] }, { ...COM_WIN, xs: [...fit(10.1, L / 2 - 2.15, COM_WIN.w, 3), ...fit(L / 2 + 2.15, L - 10.1, COM_WIN.w, 3)] }, { ...end, xs: [L - 5.0] }];
  return unit(c, { ...COM, rows, doors, cabLen: 5,
    nose: cab ? [[0.7, 3.55], [0.6, 4.6], [0.6, 11.2], ["q", 0.65, 12.4, 1.8, 12.58], [2.6, 12.58]] : null,
    paint: (c, g) => comPaint(c, g, cab, doors, rows),
    gear: cab ? [[16, 9, 1.7, "g"], [26.5, 5, 1.3, "b"], [33, 7, 1.5, "g"], [46, 5, 1.1, "t"], [52.5, 4, 1.2, "b"]] : [[16, 6, 1.3, "b"], [24, 6, 1.0, "t"], [32, 7, 1.4], [42, 5, 1.2, "b"], [50, 6, 1.0, "t"]],
    onRoof: (c, g) => cab ? hvac(26, g.roof, 12, 0.8) + pantograph(L - 12, g.roof + 0.3, { facing: -1 }) + rect(L - 15.4, g.roof - 0.05, 6.8, 0.35, "#8f969e", 0.4) + panGear(L - 12, g.roof, -1) + horns(3.2, g.roof) :
      hvac(L / 2 - 6, g.roof, 12, 0.8) + aerial(14, g.roof),
    cabArt: () => cabFoot(0.6, 3.55) + rect(0.6, 7.3, 0.35, 3.6, "#111417") + lamp(0.65, 4.7, 0.45, 0.4) + lamp(0.65, 11.6, 0.4, 0.32, RED_LAMP) +
      rect(5.5, 3.9, 1.9, 7.2, "none", 0.5, 'rx="0.2"') + rect(5.75, 7.6, 1.4, 2.5, C.glass, 0, 'rx="0.2"') + rect(3.0, 7.3, 2.0, 2.9, C.glass, 0, 'rx="0.3"'),
    more: (c) => (cab ? metroWord(c, 10.4, 5.0, 2.0) : ""),
  });
}
const comM = unitCab((c) => comCar(c, true));
const comT = (c) => comCar({ ...c, cabL: false, cabR: false }, false);

// --- Siemens Nexas (Siemens, Vienna, with final fitting at Newport,
// 2002-06): 72 M-T-M units, driving motors 701M-844M (24.07 m), trailers
// 2501T-2572T (23.77 m), 2.95 m wide, 4,141 mm high, floor 1.23 m; two
// pairs of plug doors a side on each car; SF 5000 bogies, 2.6 m wheelbase,
// 850 mm wheels; a pantograph on each motor car at its inner end, under a
// long roof fairing over the equipment (Wikipedia: Siemens Nexas; truck
// centers and window positions measured off photographs). Paint
// (2022 on, the whole fleet from 2024): bare stainless, a blue band along
// the cant rail, blue facets behind the cab around the first door and at
// the inner end, light blue doors framed in yellow; the rounded cab yellow
// with a blue band under the windshield (PT on it) and a white bumper.
const SIE = { roof: 12.6, sill: 3.75, trucks: { centers: 52.5, wb: 8.53, d: 33.5 }, diaphragm: [4.0, 11.6] };
const sieDoor = (x) => ({ x, w: 4.6, y0: 3.85, y1: 10.8, leaves: 2, glassY: 0.48, glassH: 0.38, grabs: false, fill: "rgba(0,0,0,0.03)" });
const SIE_WIN = { y: 6.75, w: 5.2, h: 3.35, r: 0.6 };
function sieCar(c, cab) {
  const L = c.L;
  // Doors at about a quarter and three quarters of the car; four windows
  // between them, two beyond.
  const doors = cab ? [sieDoor(18.7), sieDoor(54.7)] : [sieDoor(17.2), sieDoor(L - 21.8)];
  const xs = cab ? [11.6, ...fit(23.3, 54.7, SIE_WIN.w, 4), ...fit(59.3, L - 7.4, SIE_WIN.w, 2)] :
    [...fit(0.6, 17.2, SIE_WIN.w, 2), ...fit(21.8, L - 21.8, SIE_WIN.w, 4), ...fit(L - 17.2, L - 0.6, SIE_WIN.w, 2)];
  const rows = [{ ...SIE_WIN, xs }];
  return unit(c, { ...SIE, rows, doors, cabLen: 6.5,
    nose: cab ? [[1.2, 3.75], [0.7, 4.6], [0.6, 6.4], ["q", 0.6, 10.6, 1.2, 11.6], ["q", 2.0, 12.6, 4.0, 12.6]] : null,
    paint: (c, g) => {
      let s = rect(0, 0, L, 17, MT.steel) + rect(0, 11.15, L, 2, MT.sky) + rect(0, 11.05, L, 0.1, "#1a64ad");
      if (cab) s += facets(6.0, 3.75, 25.4, 11.15, MT_FACETS, 7, { rows: 3 }) + facets(L - 8.0, 3.75, L, 11.15, MT_FACETS, 8, { rows: 3, cols: 2 }) +
        path(poly([[0, 0], [7.2, 0], [7.2, 4.4], ["q", 6.0, 4.8, 3.0, 4.6], [0, 4.6]]), "#f1f2f3") + path(poly([[0, 4.6], [3.0, 4.6], ["q", 6.0, 4.8, 7.2, 4.4], [7.2, 17], [0, 17]]), MT.yellow) +
        path(poly([[0, 4.75], ["q", 2.4, 4.9, 3.6, 6.3], [3.6, 6.6], [0, 6.6]]), MT.blue);
      else s += facets(0, 3.75, 7.0, 11.15, MT_FACETS, 9, { rows: 3, cols: 2 }) + facets(L - 7.0, 3.75, L, 11.15, MT_FACETS, 10, { rows: 3, cols: 2 });
      for (const d of doors) s += doorPaint(d, "#3d98e6");
      return s + framed(rows);
    },
    gear: cab ? [[16, 8, 1.6, "g"], [25, 7, 1.4, "b"], [33, 6, 1.6, "g"], [40, 5, 1.0, "t"], [46.5, 4.5, 1.2, "b"]] : [[15, 7, 1.3, "b"], [23, 6, 1.0, "t"], [30.5, 8, 1.4, "b"], [40, 5, 1.0, "t"], [46.5, 5, 1.2]],
    onRoof: (c, g) => cab ? roofCover(7.5, g.roof, 34, 0.75, "#8f969e", 5) + hvac(44, g.roof, 10, 0.75) + pantograph(L - 12.5, g.roof + 0.3, { facing: -1 }) + panGear(L - 12.5, g.roof, -1) + horns(4.4, g.roof) :
      roofCover(4, g.roof, 12, 0.6, "#8f969e", 2) + hvac(L / 2 - 6, g.roof, 12, 0.75) + roofCover(L - 16, g.roof, 12, 0.6, "#8f969e", 2),
    cabArt: () => cabFoot(1.0, 3.75, { reach: 3.6 }) + path(poly([[0.75, 7.6], ["q", 0.7, 10.4, 1.3, 11.3], [2.8, 11.3], [2.8, 7.6]]), C.glass) + wiper(1.0, 7.8, 2.2, 10.2) +
      lamp(0.75, 5.0, 0.5, 0.42) + lamp(1.0, 12.0, 0.45, 0.3, RED_LAMP) + rect(7.4, 3.95, 1.9, 7.2, "none", 0.5, 'rx="0.2"') + rect(7.65, 7.6, 1.4, 2.6, C.glass, 0, 'rx="0.2"') +
      rect(3.8, 7.2, 2.4, 3.4, C.glass, 0, 'rx="0.3"'),
  });
}
const sieM = unitCab((c) => sieCar(c, true));
const sieT = (c) => sieCar({ ...c, cabL: false, cabR: false }, false);

// --- X'Trapolis 100 (Alstom: La Rochelle and Ballarat, 2002-04 and
// 2009-20): 212 M-T-M units, motor cars 1M-288M and 851M-986M (24.46 m),
// trailers 1301T-1444T and 1626T-1693T (22.76 m), 3,046 mm wide, 4,214 mm
// high, floor 1,185 mm; CL 353 bogies, 2.2 m wheelbase, 890 mm wheels; one
// pantograph a unit, on the trailer (Wikipedia: X'Trapolis 100). Three
// pairs of sliding doors a side on each car, four windows between them
// (positions and truck centers measured off photographs; 4,214 mm is to
// the top of the air conditioning, the body's roof drawn at 3.95 m). The
// Burnley and Clifton Hill
// groups' train, and on the Frankston, Werribee and Williamstown lines.
// Paint (Metro's, with the 2022 changes): silver sides, a blue band along
// the cant rail, blue facets behind the cab with METRO across them and at
// each car's ends, blue doors framed in yellow; the cab yellow, its big
// windshield black, a blue panel under it with PT.
const XT = { roof: 12.95, sill: 3.55, diaphragm: [3.9, 11.8] };
const xtDoor = (x) => ({ x, w: 4.3, y0: 3.7, y1: 10.8, leaves: 2, glassY: 0.46, glassH: 0.4, grabs: false, fill: "rgba(0,0,0,0.04)" });
const XT_WIN = { y: 6.85, w: 4.2, h: 3.05, r: 0.35 };
function xtCar(c, cab) {
  const L = c.L;
  const doors = cab ? [xtDoor(12.8), xtDoor(39.6), xtDoor(70.0)] : [xtDoor(4.6), xtDoor(L / 2 - 2.15), xtDoor(L - 8.9)];
  const xs = cab ? [...fit(17.1, 39.6, XT_WIN.w, 4), ...fit(43.9, 70.0, XT_WIN.w, 4)] : [...fit(8.9, L / 2 - 2.15, XT_WIN.w, 4), ...fit(L / 2 + 2.15, L - 8.9, XT_WIN.w, 4)];
  const rows = [{ ...XT_WIN, xs }];
  return unit(c, { ...XT, trucks: { centers: cab ? 54 : 49, wb: 7.22, d: 35 }, rows, doors, cabLen: 6.5,
    nose: cab ? [[1.0, 3.55], [0.75, 4.4], [0.75, 10.9], ["q", 0.8, 12.6, 2.4, 12.95], [3.6, 12.95]] : null,
    paint: (c, g) => {
      let s = rect(0, 0, L, 17, MT.silver) + rect(0, 10.85, L, 2.5, MT.blue) + rect(0, 10.75, L, 0.1, "#0a4f96");
      if (cab) s += facets(2.2, 3.55, 19.0, 11.45, MT_FACETS, 11, { rows: 3 }) + rect(0, 0, 2.3, 17, MT.yellow) + facets(L - 6.6, 3.55, L, 11.45, MT_FACETS, 12, { rows: 3, cols: 2 });
      else s += facets(0, 3.55, 10.2, 11.45, MT_FACETS, 13, { rows: 3, cols: 2 }) + facets(L - 10.2, 3.55, L, 11.45, MT_FACETS, 14, { rows: 3, cols: 2 });
      for (const d of doors) s += doorPaint(d, MT.blue);
      return s + framed(rows) + ptMark(c, cab ? 46 : L / 2 + 8, 10.25, 0.42, MT.blue);
    },
    gear: cab ? [[16, 8, 1.6, "g"], [25, 6, 1.4, "b"], [32.5, 6, 1.6, "g"], [40, 5, 1.0, "t"], [46.5, 6, 1.2, "b"]] : [[15, 7, 1.2, "b"], [23, 6, 1.0, "t"], [30.5, 7, 1.4, "b"], [39, 5, 1.0, "t"]],
    onRoof: (c, g) => cab ? hvac(L / 2 - 8, g.roof, 14, 0.85) + roofCover(L - 18, g.roof, 9, 0.5, "#8f969e", 2) + horns(4.0, g.roof) + aerial(9, g.roof) :
      pantograph(12, g.roof + 0.3) + rect(8.6, g.roof - 0.05, 6.8, 0.35, "#8f969e", 0.4) + panGear(12, g.roof, 1) + hvac(L / 2 - 2, g.roof, 14, 0.85),
    cabArt: () => cabFoot(0.85, 3.55, { reach: 3.0 }) + path(poly([[0.8, 7.0], [0.8, 11.0], ["q", 0.85, 12.1, 1.6, 12.4], [2.2, 12.4], [2.2, 7.0]]), "#111417") +
      lamp(0.8, 5.0, 0.45, 0.42) + lamp(1.0, 12.55, 0.45, 0.25, RED_LAMP) + rect(3.6, 7.0, 1.8, 3.1, C.glass, 0, 'rx="0.3"') +
      rect(5.9, 3.85, 1.9, 7.2, "none", 0.5, 'rx="0.2"') + rect(6.15, 7.6, 1.4, 2.6, C.glass, 0, 'rx="0.2"'),
    more: (c) => (cab ? metroWord(c, 12.6, 4.9, 2.3) : ""),
  });
}
const xtM = unitCab((c) => xtCar(c, true));
const xtT = (c) => xtCar({ ...c, cabL: false, cabR: false }, false);

// --- X'Trapolis 2.0 (Alstom, Ballarat, 2024 on; first in service 3 May
// 2026): six-car sets Mc-Tp-M1-M2-Tp-Mc, cars 81ss-86ss for set ss (01-50:
// 25 ordered, 25 more in April 2026), Mc 24.935 m, the others 23.62 m,
// 3.03 m wide, floor 1.17 m, a walk-through train; Dellner couplers; the
// pantographs on the two Tp (trailer, pantograph) cars (Wikipedia:
// X'Trapolis 2.0). Three wide doors a side on each car, the first behind
// the cab's ramp space (door, window and truck positions measured off
// photographs at Newport, Ballarat and South Yarra, 2025-26; the body
// drawn 3.95 m high like the X'Trapolis 100's, the 3.7 m published
// seeming not to be from the rail). Craigieburn, Upfield and Frankston lines, replacing the
// Comengs. Paint: bright blue over the roof edge and the car ends, white
// panels along the windows, blue doors framed in yellow; behind the cab a
// blue panel of darker facets; the raked nose blue, the black windshield
// mask outlined in yellow, the roof cap over it yellow.
const XT2 = { roof: 12.95, sill: 3.6, diaphragm: [3.9, 11.8] };
const xt2Door = (x) => ({ x, w: 4.6, y0: 3.75, y1: 10.8, leaves: 2, glassY: 0.44, glassH: 0.44, grabs: false, fill: "rgba(0,0,0,0.04)" });
const XT2_WIN = { y: 6.75, w: 4.4, h: 3.3, r: 0.3 };
function xt2Car(c, part) {
  const L = c.L, cab = part === "mc", pan = part === "tp";
  const doors = cab ? [xt2Door(24.4), xt2Door(48.8), xt2Door(70.4)] : [xt2Door(6.4), xt2Door(L / 2 - 2.3), xt2Door(L - 11.0)];
  const xs = cab ? [16.0, ...fit(29.0, 48.8, XT2_WIN.w, 3), ...fit(53.4, 70.4, XT2_WIN.w, 3), 76.0] :
    [1.4, ...fit(11.0, L / 2 - 2.3, XT2_WIN.w, 4), ...fit(L / 2 + 2.3, L - 11.0, XT2_WIN.w, 4), L - 5.9];
  const rows = [{ ...XT2_WIN, xs }];
  return unit(c, { ...XT2, trucks: { centers: cab ? 55 : 52, wb: 7.4, d: 33.5 }, rows, doors, cabLen: 10,
    nose: cab ? [[1.6, 3.6], [0.6, 4.6], [0.7, 7.4], ["q", 1.0, 8.6, 2.0, 9.8], [4.6, 12.4], ["q", 5.4, 12.95, 7.0, 12.95]] : null,
    paint: (c, g) => {
      let s = rect(0, 0, L, 17, MT.white) + rect(0, 10.6, L, 3, MT.xt2) + rect(0, 3.6, L, 0.45, MT.xt2);
      // The blue ends, and facets at one end of each car.
      s += rect(0, 0, 4.2, 17, MT.xt2) + rect(L - 4.2, 0, 4.2, 17, MT.xt2);
      if (cab) {
        s += rect(0, 0, 24.2, 17, MT.xt2) + facets(9.0, 3.6, 24.0, 10.6, ["#1d5fb6", "#2a7fd8", "#163f9c", "#2c9ce2", "#3f8fe0", "#1f4fb0"], 21, { rows: 3 });
        // The black mask over the windshield, wrapping round onto the
        // side; its yellow outline; the yellow roof cap.
        s += path(poly([[0, 14], [0, 6.7], ["q", 1.2, 6.8, 2.0, 7.4], [5.4, 10.4], ["q", 6.6, 11.6, 7.2, 14]]), "#15181c");
        s += path(poly([[7.2, 14], ["q", 6.6, 11.6, 5.4, 10.4], [2.0, 7.4], ["q", 1.2, 6.8, 0, 6.7], [0, 6.0], ["q", 1.5, 6.1, 2.5, 6.9], [6.0, 9.9], ["q", 7.4, 11.3, 8.0, 14]]), MT.yellow);
        s += path(poly([[3.2, 14], [3.2, 12.3], ["q", 5.6, 12.4, 9.6, 12.5], [9.6, 14]]), MT.yellow);
      } else s += facets(L - 4.2, 3.6, L, 10.6, ["#1d5fb6", "#2a7fd8", "#163f9c", "#2c9ce2"], 22 + c.index, { rows: 3, cols: 1 });
      for (const d of doors) s += doorPaint(d, MT.xt2);
      return s + framed(rows);
    },
    gear: cab ? [[18, 8, 1.6, "g"], [27, 6, 1.4, "b"], [34, 6, 1.6, "g"], [41, 5, 1.0, "t"], [47.5, 4, 1.2, "b"]] :
      part === "m" ? [[14, 8, 1.6, "g"], [23, 6, 1.4, "b"], [30, 7, 1.6, "g"], [38, 5, 1.0, "t"], [44, 5, 1.2, "b"]] : [[14, 7, 1.2, "b"], [22, 6, 1.0, "t"], [30, 8, 1.4, "b"], [39.5, 5, 1.0, "t"]],
    onRoof: (c, g) => {
      let s = hvac(cab ? 30 : L / 2 - 7, g.roof, 13, 0.85, "#b4bac1");
      if (cab) s += roofCover(13, g.roof, 12, 0.55, "#9aa1a9", 2) + horns(7.6, g.roof) + aerial(56, g.roof);
      else if (pan) {
        // The pantograph at the end toward the middle of the train.
        const x = c.index < c.count / 2 ? L - 13 : 13, dir = x > L / 2 ? -1 : 1;
        s += pantograph(x, g.roof + 0.3, { facing: -dir }) + rect(x - 3.4, g.roof - 0.05, 6.8, 0.35, "#8f969e", 0.4) + panGear(x, g.roof, -dir);
      } else s += roofCover(L - 20, g.roof, 12, 0.55, "#9aa1a9", 2);
      return s;
    },
    cabArt: () => cabFoot(1.2, 3.6, { reach: 4.4, skirt: "#22262b" }) + path(poly([[1.9, 8.4], [4.4, 11.7], ["q", 4.9, 12.2, 5.6, 12.2], [5.9, 12.2], [3.4, 8.4]]), C.glass) +
      path(poly([[2.5, 8.7], [3.8, 10.4], [4.2, 10.4], [3.0, 8.7]]), C.glassLight) + wiper(2.3, 8.6, 3.6, 10.6) +
      lamp(0.75, 5.0, 0.45, 0.42) + lamp(0.95, 6.1, 0.4, 0.3, RED_LAMP) + rect(8.6, 3.9, 2.0, 7.2, "none", 0.5, 'rx="0.2"') + rect(8.85, 7.4, 1.5, 2.6, C.glass, 0, 'rx="0.2"'),
  });
}
const xt2Mc = (c) => xt2Car(c, "mc");
const xt2Tp = (c) => xt2Car({ ...c, cabL: false, cabR: false }, "tp");
const xt2M = (c) => xt2Car({ ...c, cabL: false, cabR: false }, "m");

// --- High Capacity Metro Train (Evolution Rail: Downer, CRRC Changchun and
// Plenary; bodies from Changchun, finished at Newport, 2018-24): 70
// seven-car sets Tc-DMp-Mp1-DT-Mp2-DMp-Tc, cars 90ss, 91ss, 92ss, 93ss,
// 97ss, 98ss, 99ss; Tc 24.648 m, the others 22.18 m; 3.04 m wide, 4,186 mm
// high, level floor 1.17 m; three doors a side on every car; pantographs
// on the four powered cars, those of cars 2 and 3 toward the front, 5 and
// 6 toward the back (Wikipedia: High Capacity Metro Trains, formation
// table; truck centers and windows measured off photographs). The
// Pakenham, Cranbourne and Sunbury lines through the Metro
// Tunnel. Paint: a mid gray body, a light blue band along the cant rail,
// the windows in black; blue doors framed in yellow, blue facets around
// the doors at each car's ends and behind the cab; the aerodynamic nose
// silver gray around the windshield over a charcoal lower front with a
// yellow panel, a light blue streak down each side of the windshield.
const HC = { roof: 13.05, sill: 3.55, diaphragm: [3.9, 11.9] };
const hcDoor = (x) => ({ x, w: 4.6, y0: 3.7, y1: 10.85, leaves: 2, glassY: 0.44, glassH: 0.44, grabs: false, fill: "rgba(0,0,0,0.04)" });
const HC_WIN = { y: 6.7, w: 6.0, h: 3.5, r: 0.35 };
function hcCar(c, part) {
  const L = c.L, cab = part === "tc", motor = part === "mp";
  const doors = cab ? [hcDoor(14.6), hcDoor(41.6), hcDoor(67.6)] : [hcDoor(7.0), hcDoor(L / 2 - 2.3), hcDoor(L - 11.6)];
  const xs = cab ? [...fit(19.2, 41.6, HC_WIN.w, 2), ...fit(46.2, 67.6, HC_WIN.w, 2)] : [...fit(11.6, L / 2 - 2.3, HC_WIN.w, 2), ...fit(L / 2 + 2.3, L - 11.6, HC_WIN.w, 2)];
  const rows = [{ ...HC_WIN, xs }, { y: 6.7, w: 3.2, h: 3.5, r: 0.35, xs: cab ? [L - 4.6] : [1.6, L - 4.8] }];
  return unit(c, { ...HC, trucks: { centers: cab ? 56 : 49.5, wb: 8.2, d: 33 }, rows, doors, cabLen: 10,
    nose: cab ? [[2.6, 3.55], [0.6, 4.3], [0.4, 5.6], ["q", 0.45, 7.4, 1.5, 8.5], [5.2, 12.4], ["q", 6.0, 13.05, 8.0, 13.05]] : null,
    paint: (c, g) => {
      let s = rect(0, 0, L, 17, MT.hcmt) + rect(0, 11.2, L, 2.5, "#3c9be0") + rect(0, 11.1, L, 0.1, "#1a64ad");
      const blues = ["#173f97", "#1f64c8", "#2f8ae0", "#4aa6ee", "#1a4fb0", "#5ab3ef"];
      if (cab) {
        s += facets(9.0, 3.55, 21.0, 11.2, blues, 31, { rows: 3 });
        // The nose: silver gray around the windshield, charcoal under it
        // sweeping back low along the cab side, a light blue streak
        // behind the windshield from the roof down to the headlights.
        s += rect(0, 0, 9.0, 17, "#b5bbc1") + path(poly([[0, 0], [10.4, 0], [10.4, 4.9], ["q", 4.6, 5.2, 1.2, 8.3], [0, 8.3]]), MT.hcmtNose);
        s += path(poly([[6.4, 13.2], [7.6, 13.2], [3.1, 8.1], ["q", 2.3, 7.3, 1.0, 7.5], [1.1, 8.1], ["q", 1.9, 8.0, 2.4, 8.6]]), "#3c9be0");
        s += facets(L - 13.0, 3.55, L - 4.6, 11.2, blues, 32, { rows: 3, cols: 2 });
      } else s += facets(1.0, 3.55, 13.0, 11.2, blues, 33 + c.index, { rows: 3, cols: 2 }) + facets(L - 13.0, 3.55, L - 1.0, 11.2, blues, 40 + c.index, { rows: 3, cols: 2 });
      for (const d of doors) s += doorPaint(d, "#2b7bd6");
      return s + framed(rows);
    },
    gear: cab ? [[18, 7, 1.2, "b"], [26, 6, 1.0, "t"], [34, 8, 1.4, "b"], [44, 5, 1.0, "t"], [50, 5, 1.2]] :
      motor ? [[13, 8, 1.6, "g"], [22, 6, 1.4, "b"], [29, 7, 1.6, "g"], [37, 5, 1.0, "t"], [43, 5, 1.2, "b"]] : [[13, 7, 1.2, "b"], [21, 6, 1.0, "t"], [29, 8, 1.4, "b"], [38.5, 5, 1.0, "t"]],
    onRoof: (c, g) => {
      let s = hvac(cab ? 28 : L / 2 - 6.5, g.roof, 13, 0.8, "#b4bac1");
      if (cab) s += roofCover(12, g.roof, 10, 0.5, "#9aa1a9", 2) + horns(8.8, g.roof) + aerial(60, g.roof);
      else if (motor) {
        // Cars 2 and 3 carry theirs toward the front, 5 and 6 toward the back.
        const x = c.index < c.count / 2 ? 12.5 : L - 12.5, dir = x < L / 2 ? 1 : -1;
        s += pantograph(x, g.roof + 0.3, { facing: dir }) + rect(x - 3.4, g.roof - 0.05, 6.8, 0.35, "#8f969e", 0.4) + panGear(x, g.roof, dir) + roofCover(x < L / 2 ? L - 20 : 8, g.roof, 12, 0.5, "#9aa1a9", 2);
      } else s += roofCover(8, g.roof, 12, 0.5, "#9aa1a9", 2) + roofCover(L - 20, g.roof, 12, 0.5, "#9aa1a9", 2);
      return s;
    },
    cabArt: () => cabFoot(1.0, 3.55, { reach: 4.8, skirt: "#1f2226" }) + path(poly([[1.75, 8.75], [5.15, 12.4], ["q", 5.6, 12.8, 6.3, 12.8], [6.6, 12.8], [3.1, 8.75]]), C.glass) +
      path(poly([[2.3, 9.0], [3.6, 10.4], [4.0, 10.4], [2.8, 9.0]]), C.glassLight) + wiper(2.2, 8.95, 3.5, 10.9) +
      lamp(0.5, 5.0, 0.4, 0.5) + lamp(0.55, 4.3, 0.35, 0.25, RED_LAMP) + rect(7.3, 9.4, 1.4, 2.4, C.glass, 0.3, 'rx="0.3"'),
  });
}
const hcmtTc = (c) => hcCar(c, "tc");
const hcmtMp = (c) => hcCar({ ...c, cabL: false, cabR: false }, "mp");
const hcmtDT = (c) => hcCar({ ...c, cabL: false, cabR: false }, "dt");

// ===================== Railcars shared: the Sprinter =====================

// --- Sprinter (A Goninan & Co, Broadmeadow, 1993-95): 22 single railcars
// 7001-7022 (21 in service; 7019 scrapped), 25.9 m over couplers, 2.94 m
// wide, 3.905 m high, bogie centers 16.6 m, 920 mm wheels; two Deutz V8s
// under each car, Voith hydraulic drive; a cab at each end with a door in
// its front, a plug door a side behind each cab (Wikipedia: V/Line
// Sprinter). V/Line runs them on the Seymour line; Metro leases a pair
// for its Stony Point line. Paint (PTV, since 7012 in 2018): ribbed
// stainless, the windows in one dark band, purple facets over each cab end
// and around its door, the roof cap and the lower corners of the front
// yellow, a white panel under the windshields with V/Line on it, a yellow
// line along the sill.
const SPR = { roof: 12.81, sill: 3.9, trucks: { centers: 54.5, wb: 8.2, d: 36.2 }, diaphragm: [4.2, 11.6] };
function sprinterHalf(h) {
  const L = h.L;
  const door = { x: 8.6, w: 2.9, y0: 4.0, y1: 10.85, glassY: 0.5, glassH: 0.36, grabs: false, fill: "rgba(0,0,0,0.04)" };
  // Five windows from the door to the middle and one across it (whole in
  // both halves, so they meet exactly).
  const rows = [{ xs: [5.0], y: 7.2, w: 2.3, h: 2.6, r: 0.3 }, { xs: [...seq(12.6, 5.6, 5), L / 2 - 2.3], y: 7.15, w: 4.6, h: 2.7, r: 0.25 }];
  return unit(h, { ...SPR, rows, doors: [door], cabLen: 4.2,
    nose: [[0.8, 3.9], [0.55, 4.8], [0.55, 10.9], ["q", 0.6, 12.4, 1.8, 12.75], [2.8, 12.81]],
    paint: (c, g) => rect(0, 0, L, 17, VL.steel) + flutes(0, L, 4.4, 6.7, 0.26) + flutes(0, L, 10.2, 12.0, 0.26) + rect(0, 6.95, L, 3.1, VL.band) +
      facets(0, 3.9, 12.4, 13, VL_FACETS, 51, { rows: 3, cols: 3 }) + rect(0, 3.9, L, 0.35, VL.yellow) + path(poly([[0, 11.6], [3.6, 11.6], ["q", 3.0, 12.4, 3.4, 13.2], [0, 13.2]]), VL.yellow) +
      path(poly([[0, 3.9], [2.6, 3.9], ["q", 2.0, 5.2, 2.6, 6.2], [0, 6.2]]), VL.yellow) + rect(door.x - 0.12, door.y0 - 0.1, door.w + 0.24, door.y1 - door.y0 + 0.2, VL.white) +
      framed([rows[0]]),
    gear: [[19, 9, 1.6, "g"], [29, 6, 1.3, "b"], [L / 2 - 2, 4, 1.0, "t"]],
    onRoof: (c, g) => hvac(16, g.roof, 11, 0.7, "#b4bac1") + exhaust(32, g.roof) + horns(2.6, g.roof) + aerial(10.4, g.roof),
    cabArt: (c) => cabFoot(0.75, 3.9, { reach: 3.0 }) + path(poly([[0.6, 7.4], [0.6, 10.6], [3.0, 10.6], [3.0, 7.4]]), "#1b1e22") +
      lamp(0.6, 5.0, 0.45, 0.42) + lamp(0.62, 6.0, 0.4, 0.3, RED_LAMP) + lamp(1.4, 12.5, 0.6, 0.25) + vlName(c, 26, 5.2, 0.6, VL.purple),
  });
}
// The car is drawn as its two halves, cab and door mirrored at the far end
// (bothEnds), over a strip of the whole body under the join so no seam
// shows between them.
const sprinter = (c) => {
  const id = newId(), L = c.L;
  return `<clipPath id="${id}"><rect x="${r2(L / 2 - 1.5)}" y="-5" width="3" height="40"/></clipPath><g clip-path="url(#${id})">${sprinterHalf({ ...c, cabL: true, cabR: false })}</g>` +
    bothEnds({ ...c, cabR: false }, sprinterHalf);
};

// ===================== V/Line =====================

// --- VLocity (Bombardier, then Alstom, Dandenong, 2004-26): 141 three-car
// sets, DM(D)-TM-DM, every car 25.25 m and powered by its own Cummins QSK19
// through Voith hydraulic drive, 2.92 m wide, 160 km/h; 133 broad-gauge
// sets (VL00-VL92, VL99-VL141; VR76-79) and six standard-gauge sets for the
// Albury line (VS93-VS98); the cars numbered 11xx/21xx (DM(D), the No. 1
// end), 12xx/22xx (DM) and 13xx/23xx (TM), 15xx kiosk cars (Wikipedia:
// V/Line VLocity). A plug door a side at each end of each car; the windows
// in one dark band; a crumple zone in the raked nose (the height, about
// 3.9 m, and the truck centers measured off photographs, none being
// published). Paint (PTV, from
// VL52 and since on all): ribbed stainless with a yellow line along the
// sill, purple facets around each door and over the cab, white door
// leaves with V/Line on them; the cab's lower edge yellow, a white panel
// under the windshield with PT, the roof cap yellow with the marker lights.
const VLO = { roof: 12.85, sill: 3.95, trucks: { centers: 58, wb: 8.2, d: 33 }, diaphragm: [4.2, 11.6] };
const vloDoor = (x) => ({ x, w: 3.0, y0: 4.05, y1: 10.9, glassY: 0.5, glassH: 0.36, grabs: false, fill: "rgba(0,0,0,0.04)" });
function vloCar(c, cab) {
  const L = c.L;
  const doors = cab ? [vloDoor(10.6), vloDoor(L - 4.4)] : [vloDoor(1.4), vloDoor(L - 4.4)];
  const a = cab ? 15.6 : 6.6;
  const rows = [{ xs: fit(a, L - 6.2, 5.1, cab ? 10 : 12), y: 7.1, w: 5.1, h: 2.85, r: 0.25 }];
  return unit(c, { ...VLO, rows, doors, cabLen: 9,
    nose: cab ? [[1.8, 3.95], [0.5, 4.6], [0.45, 6.6], ["q", 0.6, 7.9, 1.6, 9.0], [4.0, 12.2], ["q", 4.8, 12.85, 6.4, 12.85]] : null,
    paint: (c, g) => {
      let s = rect(0, 0, L, 17, VL.steel) + flutes(0, L, 4.4, 6.85, 0.26) + flutes(0, L, 10.25, 12.2, 0.26) + rect(a - 1.2, 6.95, L - a - 4.4, 3.2, VL.band, 0, 'rx="0.3"') + rect(0, 3.95, L, 0.35, VL.yellow);
      for (const d of doors) {
        const x0 = Math.max(0, d.x - 1.2), x1 = Math.min(L, d.x + d.w + 1.2);
        s += facets(x0, 3.95, x1, 12.9, VL_FACETS, 60 + Math.round(d.x), { rows: 3, cols: 1 }) + rect(d.x - 0.12, d.y0 - 0.1, d.w + 0.24, d.y1 - d.y0 + 0.2, VL.white);
      }
      if (cab) s += facets(0, 3.95, 10.2, 12.9, VL_FACETS, 71, { rows: 3, cols: 3 }) +
        path(poly([[0, 3.95], [9.6, 3.95], [9.6, 4.9], ["q", 6.0, 5.3, 4.2, 6.6], ["q", 3.0, 7.4, 1.4, 7.4], [0, 7.4]]), VL.yellow) +
        path(poly([[0, 12.0], [5.0, 12.0], ["q", 5.6, 12.9, 7.4, 13.2], [0, 13.2]]), VL.yellow);
      return s;
    },
    gear: [[cab ? 18 : 14, 10, 1.7, "g"], [cab ? 29 : 25, 7, 1.5, "b"], [cab ? 37 : 33, 6, 1.1, "t"], [cab ? 44 : 40, 5, 1.3, "b"]],
    onRoof: (c, g) => hvac(cab ? 14 : 8, g.roof, 11, 0.75, "#b4bac1") + hvac(L - 21, g.roof, 11, 0.75, "#b4bac1") + exhaust(L / 2 + 2, g.roof) + (cab ? horns(5.6, g.roof) + aerial(30, g.roof) : ""),
    more: (c) => doors.map((d) => vlName(c, d.x + d.w / 2 - 0.3, 6.1, 0.42, VL.purple)).join(""),
    cabArt: (c) => cabFoot(1.0, 3.95, { reach: 4.4, skirt: "#22262b" }) + path(poly([[1.8, 8.8], [4.1, 11.7], ["q", 4.8, 12.3, 5.8, 12.3], [6.3, 12.3], [3.4, 8.8]]), C.glass) +
      path(poly([[0.5, 6.9], ["q", 0.62, 8.0, 1.5, 8.9], [1.9, 8.75], ["q", 1.1, 7.8, 1.0, 6.9]]), VL.white) + rect(6.6, 9.1, 1.3, 2.3, C.glass, 0.3, 'rx="0.25"') +
      path(poly([[2.5, 9.1], [3.7, 10.6], [4.2, 10.6], [3.1, 9.1]]), C.glassLight) + wiper(2.3, 9.0, 3.7, 11.2) +
      lamp(0.6, 5.2, 0.45, 0.42) + lamp(0.75, 6.2, 0.4, 0.3, RED_LAMP) + lamp(5.0, 12.65, 0.5, 0.28) + lamp(6.0, 12.75, 0.5, 0.28) + rect(8.2, 4.1, 1.9, 7.2, "none", 0.5, 'rx="0.2"'),
  });
}
const vloCab = unitCab((c) => vloCar(c, true));
const vloMid = (c) => vloCar({ ...c, cabL: false, cabR: false }, false);

// A locomotive's body, which bilevel() can't shape: the outline filled, its
// livery clipped to it and shaded like the other drawings.
function shell(d, base, liv, top = 14) {
  const id = newId();
  const shade = `<linearGradient id="${id}-s" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${top}">` +
    '<stop offset="0.25" stop-color="#000" stop-opacity="0.16" style="stop-opacity:var(--car-shade-low,0.16)"/><stop offset="0.45" stop-color="#000" stop-opacity="0"/>' +
    '<stop offset="0.6" stop-color="#fff" stop-opacity="0"/><stop offset="0.85" stop-color="#fff" stop-opacity="0.1" style="stop-opacity:var(--car-shade-high,0.1)"/>' +
    '<stop offset="1" stop-color="#000" stop-opacity="0.08" style="stop-opacity:var(--car-shade-roof,0.08)"/></linearGradient>';
  return path(d, base) + `<clipPath id="${id}"><path d="${d}"/></clipPath><defs>${shade}</defs>` +
    `<g clip-path="url(#${id})">${liv}<rect x="-5" y="0" width="200" height="${top + 2}" fill="url(#${id}-s)"/></g>` + path(d, "none", 0.8);
}

// --- N class (Clyde Engineering, Somerton, 1985-87; EMD JT22HC-2): 25
// six-axle diesel-electrics N451-N475, 18.87 m, 123 t, an EMD 12-645E3
// of 1,846 kW and a separate head-end power set, 130 km/h; a cab at each
// end with a short nose ahead of it, the hood between them with a walkway
// along each side (Wikipedia: V/Line N class). Fifteen are now leased to
// Southern Shorthaul Railroad; V/Line's few haul the N sets to Swan Hill.
// Paint (PTV): the hood purple in facets, the cabs and noses yellow-orange,
// the walkway's edge and the handrails yellow, the front purple with a
// yellow V and PT on it.
export function nClass(c) {
  const L = c.L, deck = 4.55, hood = 12.3, roof = 13.75, cab = 8.2;
  // Body: a flat-fronted cab at each end (the windshield leaning back a
  // little), the lower hood between them.
  const d = poly([[0.9, deck], [L - 0.9, deck], [L - 0.9, 10.3], [L - 1.35, 13.1], ["q", L - 1.45, roof, L - 2.1, roof], [L - cab + 0.4, roof], ["q", L - cab, roof, L - cab, roof - 0.4],
    [L - cab, hood], [cab, hood], [cab, roof - 0.4], ["q", cab, roof, cab - 0.4, roof], [2.1, roof], ["q", 1.45, roof, 1.35, 13.1], [0.9, 10.3]]);
  // The underframe's deep side sills; the trucks, fuel tank, reservoirs.
  let s = rect(0.9, 3.45, L - 1.8, deck - 3.4, "#2a2d31", 0.4) + line(1.1, 3.75, L - 1.1, 3.75, "rgba(255,255,255,0.12)", 0.5);
  s += truck(L / 2 - 19.2, { wb: 12.5, d: 40, kind: "loco", top: 3.5, axles: 3 }) + truck(L / 2 + 19.2, { wb: 12.5, d: 40, kind: "loco", top: 3.5, axles: 3 });
  s += path(poly([[L / 2 - 10.5, 3.5], [L / 2 + 10.5, 3.5], [L / 2 + 10.5, 2.3], ["q", L / 2 + 10.5, 1.4, L / 2 + 9.5, 1.4], [L / 2 - 9.5, 1.4], ["q", L / 2 - 10.5, 1.4, L / 2 - 10.5, 2.3]]), "#2c2f34", 0.4) +
    line(L / 2 - 9.6, 2.3, L / 2 + 9.6, 2.3, "rgba(255,255,255,0.14)", 0.6) + rect(L / 2 - 0.4, 2.5, 0.8, 0.8, C.steelDark, 0.3, 'rx="0.4"');
  // Pilots under the cab fronts.
  for (const [a, b] of [[0.7, 4.0], [L - 0.7, L - 4.0]]) s += path(poly([[a, 3.5], [b, 3.5], [b, 1.6], [a + (b > a ? 0.5 : -0.5), 0.8]]), "#2a2d31", 0.4);
  // Paint: the cabs yellow-orange, the hood purple in facets, a yellow line
  // along the walkway's edge.
  let liv = rect(0, 0, L, 15, VL.purple) + facets(cab, deck, L - cab, hood, VL_FACETS, 81, { rows: 3 }) + rect(0, 0, cab, 15, VL.yellow) + rect(L - cab, 0, cab, 15, VL.yellow) +
    rect(0, deck, L, 0.55, VL.yellow);
  s += shell(d, VL.purple, liv);
  // Each cab: the windshield's edge, a side window, the crew door, the
  // headlights low on the front and the lights and horns over the cab.
  for (const X of [(v) => v, (v) => L - v]) {
    const at = (a, w) => Math.min(X(a), X(a + w));
    s += path(poly([[X(0.95), 10.4], [X(1.35), 12.9], [X(1.75), 12.9], [X(1.35), 10.4]]), "#121417");
    s += rect(at(2.2, 2.2), 10.2, 2.2, 2.3, C.glass, 0.3, 'rx="0.25"') + rect(at(5.2, 2.0), 5.1, 2.0, 7.6, "none", 0.5, 'rx="0.15"') + rect(at(5.55, 1.3), 9.9, 1.3, 1.9, C.glass, 0, 'rx="0.15"');
    s += lamp(at(0.95, 0.4), 6.9, 0.4, 0.45) + lamp(at(0.95, 0.4), 6.1, 0.4, 0.3, RED_LAMP) + lamp(at(1.6, 0.6), roof, 0.6, 0.3) + horns(at(3.0, 1.0), roof);
    // Steps up to the walkway at each end.
    s += lines([[at(7.0, 0), 3.6, at(7.0, 0), deck], [at(7.0, 0) - 0.6, 4.05, at(7.0, 0) + 0.6, 4.05]], "#2a2d31", 0.8);
  }
  // The walkway's handrail along the hood on its stanchions; the hood's
  // access doors; the radiator's grilles at the No. 2 end with its fans on
  // the roof; the exhaust and dynamic brake over the engine.
  const posts = seq(cab + 0.6, 4.0, Math.floor((L - 2 * cab - 1.2) / 4) + 1);
  s += line(cab, 8.4, L - cab, 8.4, VL.yellow, 1.0) + lines(posts.map((x) => [x, deck + 0.5, x, 8.4]), VL.yellow, 0.8);
  s += lines(seq(cab + 3.0, 4.6, 9).map((x) => [x, deck + 1.0, x, hood - 0.6]), "rgba(0,0,0,0.25)", 0.45);
  s += rect(L - cab - 10.5, 9.3, 9.0, 2.5, "rgba(20,22,25,0.45)", 0.4) + slats(L - cab - 10.5, 9.3, 9.0, 2.5, 0.4, "rgba(255,255,255,0.2)");
  for (const x of [L - cab - 8.0, L - cab - 3.6]) s += path(`M${r2(x - 1.9)} ${hood}Q${r2(x)} ${r2(hood + 0.75)} ${r2(x + 1.9)} ${hood}Z`, C.steelDark, 0.4);
  s += exhaust(L / 2 - 1.5, hood) + rect(cab + 2.5, hood - 0.05, 7, 0.35, "#7d848c", 0.4, 'rx="0.1"') + slats(cab + 2.7, hood + 0.02, 6.6, 0.26, 0.4, "rgba(0,0,0,0.35)");
  return s + vlName(c, cab + 7.5, 10.7, 0.95, "#ffffff");
}

// --- N type carriages (Commonwealth Engineering, Granville and Dandenong,
// 1981-84): 22.86 m over couplers, 2,972 mm wide, 4,065 mm high, bogie
// centers 16,156 mm; a swing door each side at each end, now powered;
// rubber gangways between. Four three-car N sets remain (VN10, VN12, VN14,
// VN17): ACN first class, BRN economy with the snack bar, BN economy, run
// twice a day to Swan Hill (Wikipedia: V/Line N type carriage). Paint
// (PTV, from 2017): light gray, a white line over the windows, purple
// facets over each end around its doors, a yellow line along the sill.
const NC = { roof: 13.2, sill: 4.1, trucks: { centers: 53.0, wb: 8.02, d: 36 }, diaphragm: [4.4, 11.8] };
function nCar(c, kind) {
  const L = c.L;
  const doors = [{ x: 2.0, w: 2.4, y0: 4.25, y1: 11.1, glassY: 0.55, glassH: 0.3, grabs: true, fill: "rgba(0,0,0,0.05)" },
    { x: L - 4.4, w: 2.4, y0: 4.25, y1: 11.1, glassY: 0.55, glassH: 0.3, grabs: true, fill: "rgba(0,0,0,0.05)" }];
  const xs = kind === "brn" ? [...fit(7.0, 40.0, 3.9, 6), 58.6, 64.6] : kind === "acn" ? fit(7.0, L - 7.0, 4.4, 10) : fit(7.0, L - 7.0, 3.9, 12);
  const rows = [{ xs, y: 7.3, w: kind === "acn" ? 4.4 : 3.9, h: 2.9, r: 0.35 }];
  return unit({ ...c, cabL: false, cabR: false }, { ...NC, rows, doors,
    paint: (c, g) => {
      let s = rect(0, 0, L, 17, "#cbd0d5") + rect(0, 11.3, L, 2.5, "#b3b9c0") + rect(0, 10.9, L, 0.25, "#f2f3f4") + rect(0, 4.1, L, 0.4, VL.yellow) +
        facets(0, 4.5, 6.2, 13, VL_FACETS, 90 + Math.round(L), { rows: 3, cols: 2 }) + facets(L - 6.2, 4.5, L, 13, VL_FACETS, 91, { rows: 3, cols: 2 });
      if (kind === "brn") s += rect(44, 6.6, 10.5, 3.9, "rgba(0,0,0,0.06)", 0.4, 'rx="0.3"') + rect(45, 8.0, 3.6, 1.6, C.glass, 0, 'rx="0.2"') + rect(50, 8.0, 3.6, 1.6, C.glass, 0, 'rx="0.2"');
      return s;
    },
    gear: [[17, 6, 1.3, "b"], [25, 8, 1.1, "t"], [35, 5, 1.2, "b"], [42, 7, 1.0, "t"], [51, 5, 1.2]],
    onRoof: (c, g) => hvac(5.5, g.roof, 9, 0.7, "#b4bac1") + hvac(L - 14.5, g.roof, 9, 0.7, "#b4bac1"),
    more: (c) => letters(c, L / 2 + (kind === "brn" ? -8 : 0), 5.5, 0.6, kind === "acn" ? "FIRST" : "ECONOMY", "#4a4f55", { weight: 600, spacing: 0.08 }),
  });
}
const nACN = (c) => nCar(c, "acn");
const nBRN = (c) => nCar(c, "brn");
const nBN = (c) => nCar(c, "bn");

// ===================== The roster =====================

export const TYPES = {
  ptvComM: { name: "Comeng motor car", kind: "emu", pan: true },
  ptvComT: { name: "Comeng trailer", kind: "emu" },
  ptvSieM: { name: "Siemens Nexas motor car", kind: "emu", pan: true },
  ptvSieT: { name: "Siemens Nexas trailer", kind: "emu" },
  ptvXtM: { name: "X'Trapolis 100 motor car", kind: "emu" },
  ptvXtT: { name: "X'Trapolis 100 trailer", kind: "emu", pan: true },
  ptvXt2Mc: { name: "X'Trapolis 2.0 driving motor car", kind: "emu" },
  ptvXt2Tp: { name: "X'Trapolis 2.0 trailer", kind: "emu", pan: true },
  ptvXt2M: { name: "X'Trapolis 2.0 motor car", kind: "emu" },
  ptvHcmtTc: { name: "HCMT driving trailer", kind: "emu" },
  ptvHcmtMp: { name: "HCMT motor car", kind: "emu", pan: true },
  ptvHcmtDT: { name: "HCMT trailer", kind: "emu" },
  ptvSprinter: { name: "Sprinter railcar", kind: "emu" },
  ptvVlocity: { name: "VLocity driving car", kind: "emu" },
  ptvVlocityMid: { name: "VLocity middle car", kind: "emu" },
  ptvN: { name: "N class locomotive", kind: "diesel" },
  ptvACN: { name: "N set first class car (ACN)", kind: "coach", amenities: ["first"] },
  ptvBRN: { name: "N set buffet car (BRN)", kind: "coach", amenities: ["cafe"] },
  ptvBN: { name: "N set economy car (BN)", kind: "coach" },
};
// The three-car units' driving cars draw their own cabs (unitCab), so
// they're never flipped by the consist; variant tells their drawings apart.
const pos = (c) => String(unitPos(c));
const half = (c) => (c.index < c.count / 2 ? "a" : "b");
const M = (draw, len, { oneEnd = false, variant = null } = {}) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  ptvComM: M(comM, 78.74, { variant: pos }), ptvComT: M(comT, 76.12),
  ptvSieM: M(sieM, 78.97, { variant: pos }), ptvSieT: M(sieT, 77.99),
  ptvXtM: M(xtM, 80.25, { variant: pos }), ptvXtT: M(xtT, 74.67),
  ptvXt2Mc: M(xt2Mc, 81.81, { oneEnd: true }), ptvXt2Tp: M(xt2Tp, 77.49, { variant: half }), ptvXt2M: M(xt2M, 77.49),
  ptvHcmtTc: M(hcmtTc, 80.87, { oneEnd: true }), ptvHcmtMp: M(hcmtMp, 72.77, { variant: half }), ptvHcmtDT: M(hcmtDT, 72.77),
  ptvSprinter: M(sprinter, 84.97),
  ptvVlocity: M(vloCab, 82.84, { variant: pos }), ptvVlocityMid: M(vloMid, 82.84),
  ptvN: M(nClass, 61.9),
  ptvACN: M(nACN, 75.0), ptvBRN: M(nBRN, 75.0), ptvBN: M(nBN, 75.0),
};

// Car numbers as the feed reports them (ptv.js): Metro's every car, by its
// class's ranges (TransportVic2's consist list and Wikipedia's fleet
// tables); V/Line's lead car or locomotive: VLocity cars 11xx-13xx and
// 15xx (sets VL00-VL99) and 21xx-23xx (VL100 on), Sprinters 7001-7022, N
// class 451-475.
export const FLEETS = {
  metrotrains: [
    [1, 288, "ptvXtM"], [301, 698, "ptvComM"], [701, 844, "ptvSieM"], [851, 986, "ptvXtM"],
    [1001, 1199, "ptvComT"], [1301, 1444, "ptvXtT"], [1626, 1693, "ptvXtT"], [2501, 2572, "ptvSieT"],
    [7001, 7022, "ptvSprinter"],
    [8101, 8150, "ptvXt2Mc"], [8201, 8250, "ptvXt2Tp"], [8301, 8450, "ptvXt2M"], [8501, 8550, "ptvXt2Tp"], [8601, 8650, "ptvXt2Mc"],
    [9001, 9070, "ptvHcmtTc"], [9101, 9170, "ptvHcmtMp"], [9201, 9270, "ptvHcmtMp"], [9301, 9370, "ptvHcmtDT"], [9701, 9770, "ptvHcmtMp"], [9801, 9870, "ptvHcmtMp"], [9901, 9970, "ptvHcmtTc"],
  ],
  vline: [
    [451, 475, "ptvN"], [1100, 1299, "ptvVlocity"], [1300, 1399, "ptvVlocityMid"], [1500, 1599, "ptvVlocityMid"],
    [2100, 2299, "ptvVlocity"], [2300, 2399, "ptvVlocityMid"], [7001, 7022, "ptvSprinter"],
  ],
};

const set = (label, ...units) => ({ label, units });
const six = (m, t) => [[m, 1], [t, 1], [m, 2], [t, 1], [m, 1]];
const COMENG6 = set("Comeng six-car train, two three-car units (Siemens and X'Trapolis 2.0 trains too)", ...six("ptvComM", "ptvComT"));
const SIEMENS6 = set("Siemens Nexas six-car train, two three-car units (Comeng and X'Trapolis trains too)", ...six("ptvSieM", "ptvSieT"));
const XT6 = set("X'Trapolis 100 six-car train, two three-car units", ...six("ptvXtM", "ptvXtT"));
const XT2_6 = set("X'Trapolis 2.0 six-car train", ["ptvXt2Mc", 1], ["ptvXt2Tp", 1], ["ptvXt2M", 2], ["ptvXt2Tp", 1], ["ptvXt2Mc", 1]);
const HCMT7 = set("High Capacity Metro Train, seven cars", ["ptvHcmtTc", 1], ["ptvHcmtMp", 2], ["ptvHcmtDT", 1], ["ptvHcmtMp", 2], ["ptvHcmtTc", 1]);
const vlocity = (n, label) => set(label, ...Array.from({ length: n }, () => [["ptvVlocity", 1], ["ptvVlocityMid", 1], ["ptvVlocity", 1]]).flat());
const NSET = set("N class locomotive with an N set: first class, buffet and economy cars", ["ptvN", 1], ["ptvACN", 1], ["ptvBRN", 1], ["ptvBN", 1]);
const BY_CLASS = {
  ptvComM: COMENG6, ptvComT: COMENG6, ptvSieM: SIEMENS6, ptvSieT: SIEMENS6, ptvXtM: XT6, ptvXtT: XT6,
  ptvXt2Mc: XT2_6, ptvXt2Tp: XT2_6, ptvXt2M: XT2_6, ptvHcmtTc: HCMT7, ptvHcmtMp: HCMT7, ptvHcmtDT: HCMT7,
};
// Each Metro line's usual train (Metro's allocation as of October 2026:
// HCMTs alone on the Metro Tunnel lines; X'Trapolis 100s on the Burnley
// and Clifton Hill groups and most Frankston, Werribee and Williamstown
// trains; Comengs and Siemens on the Northern group and Sandringham, the
// new X'Trapolis 2.0s joining on Craigieburn, Upfield and Frankston).
const METRO_LINES = {
  "Pakenham line": HCMT7, "Cranbourne line": HCMT7, "Sunbury line": HCMT7,
  "Lilydale line": XT6, "Belgrave line": XT6, "Alamein line": XT6, "Glen Waverley line": XT6, "Hurstbridge line": XT6, "Mernda line": XT6,
  "Frankston line": set("X'Trapolis 100 six-car train (Comeng, Siemens and X'Trapolis 2.0 trains too)", ...six("ptvXtM", "ptvXtT")),
  "Werribee line": set("X'Trapolis 100 six-car train (Siemens and Comeng trains too)", ...six("ptvXtM", "ptvXtT")),
  "Williamstown line": set("X'Trapolis 100 six-car train (Siemens and Comeng trains too)", ...six("ptvXtM", "ptvXtT")),
  "Craigieburn line": COMENG6, "Upfield line": COMENG6, "Flemington Racecourse line": COMENG6,
  "Sandringham line": SIEMENS6,
};
export const TYPICAL = {
  metrotrains: (t, reported) => {
    if (BY_CLASS[reported]) return BY_CLASS[reported];
    if (reported === "ptvSprinter" || t.route === "Stony Point line") return set("Sprinter diesel railcars, one or two (leased from V/Line)", ["ptvSprinter", 2]);
    return METRO_LINES[t.route] || XT6;
  },
  vline: (t, reported) => {
    const r = t.route || "";
    if (reported === "ptvN") return NSET;
    if (reported === "ptvSprinter") return set("Sprinter diesel railcars, usually two", ["ptvSprinter", 2]);
    // Swan Hill's trains are N sets unless the feed says a VLocity leads.
    const vlo = reported === "ptvVlocity" || reported === "ptvVlocityMid";
    if (r === "Swan Hill line") return vlo ? vlocity(1, "VLocity three-car set (most Swan Hill trains are N sets)") : { ...NSET, label: "N class locomotive with an N set (some trains a VLocity)" };
    if (r === "Albury line") return vlocity(2, "Standard-gauge VLocity three-car sets, one or two coupled");
    if (/^(Maryborough|Echuca|Ararat) line$/.test(r)) return vlocity(1, "VLocity three-car set (sometimes two)");
    return vlocity(2, "VLocity three-car sets, usually two coupled (one or three at some times)");
  },
};

// Facts come in km/h and kW; the page converts them back for display.
const kmh = (v) => Math.round((v / 1.609344) * 10) / 10, kw = (v) => Math.round(v / 0.7457), ft = (m) => Math.round((m / 0.3048) * 10) / 10;
const WP = "https://en.wikipedia.org/wiki/";
const COM_FACTS = { model: "Comeng", type: "Electric multiple unit", builder: "Commonwealth Engineering (Dandenong)", built: "1981–1988",
  fleet: "100 three-car units in service (June 2026), of 187 built", topSpeedMph: kmh(115), powerHp: kw(992), lengthFt: ft(71.2),
  about: "Melbourne's oldest trains, stainless steel M-T-M units run in pairs, with doors riders pull open. Refurbished by Alstom and EDi in the early 2000s and life-extended in 2017–21, they are being retired as the X'Trapolis 2.0 arrives.", source: `${WP}Comeng_(train)` };
const SIE_FACTS = { model: "Siemens Nexas", type: "Electric multiple unit", builder: "Siemens Transportation Systems (Vienna), fitted out at Newport", built: "2002–2006",
  fleet: "72 three-car units (701M–844M, 2501T–2572T)", topSpeedMph: kmh(115), powerHp: kw(2000), seats: 216, lengthFt: ft(71.91),
  about: "Siemens Modular Metro trains with two pairs of wide plug doors a side and a pantograph on each motor car. They run on the Sandringham, Werribee, Williamstown, Craigieburn, Upfield and Frankston lines.", source: `${WP}Siemens_Nexas` };
const XT_FACTS = { model: "X'Trapolis 100", type: "Electric multiple unit", builder: "Alstom (La Rochelle; Ballarat)", built: "2002–2004, 2009–2020",
  fleet: "212 three-car units (1M–288M, 851M–986M)", topSpeedMph: kmh(130), powerHp: kw(1440), seats: 216, lengthFt: ft(71.68),
  about: "Metro's largest fleet: three-car units with one pantograph, on the trailer, usually run as six-car trains on the Burnley and Clifton Hill group lines and the Frankston, Werribee and Williamstown lines.", source: `${WP}X%27Trapolis_100` };
const XT2_FACTS = { model: "X'Trapolis 2.0", type: "Electric multiple unit", builder: "Alstom (Ballarat)", built: "2024–", fleet: "50 six-car sets ordered (25 in 2021, 25 more in 2026)",
  topSpeedMph: kmh(130), seats: 443, lengthFt: ft(144.35),
  about: "Six-car walk-through trains built in Ballarat to replace the Comengs on the Craigieburn, Upfield and Frankston lines. The first entered passenger service on 3 May 2026.", source: `${WP}X%27Trapolis_2.0` };
const HCMT_FACTS = { model: "High Capacity Metro Train", type: "Electric multiple unit", builder: "Evolution Rail (Downer, CRRC Changchun, Plenary), finished at Newport", built: "2018–2024",
  fleet: "70 seven-car sets", topSpeedMph: kmh(130), seats: 502, lengthFt: ft(160.196),
  about: "The only trains through the Metro Tunnel: seven-car sets for about 1,380 riders, on the Pakenham, Cranbourne and Sunbury lines since the tunnel opened.", source: `${WP}High_Capacity_Metro_Trains` };
const SPR_FACTS = { model: "Sprinter", type: "Diesel multiple unit", builder: "A Goninan & Co (Broadmeadow)", built: "1993–1995", fleet: "21 railcars (7001–7022)",
  topSpeedMph: kmh(130), powerHp: kw(470), lengthFt: ft(25.9),
  about: "Single railcars with a cab and a gangway door at each end, run alone or several coupled. V/Line runs them on the Seymour line; a pair is leased to Metro for the Stony Point line.", source: `${WP}V/Line_Sprinter` };
const VLO_FACTS = { model: "VLocity", type: "Diesel multiple unit", builder: "Bombardier, later Alstom (Dandenong)", built: "2004–2026",
  fleet: "141 three-car sets (6 standard gauge, for Albury)", topSpeedMph: kmh(160), powerHp: kw(559), lengthFt: ft(75.75),
  about: "V/Line's railcars, each car with its own Cummins engine; three-car sets run alone or two or three coupled on every V/Line line, the last of the 141 entering service in 2026.", source: `${WP}V/Line_VLocity` };
const N_FACTS = { model: "N class (EMD JT22HC-2)", type: "Diesel-electric locomotive", builder: "Clyde Engineering (Somerton)", built: "1985–1987", fleet: "25 built (N451–N475), many now leased to freight",
  topSpeedMph: kmh(130), powerHp: kw(1846), lengthFt: ft(18.87),
  about: "V/Line's passenger locomotives, with a cab at each end and its own generator for the train's power. Since the VLocity took over elsewhere they haul the last N sets on the Swan Hill line.", source: `${WP}V/Line_N_class` };
const NSET_FACTS = { model: "N type carriage", type: "Passenger coach", builder: "Commonwealth Engineering", built: "1981–1984", fleet: "12 cars in 4 three-car sets",
  topSpeedMph: kmh(130), lengthFt: ft(22.86),
  about: "Locomotive-hauled carriages for V/Line's long-distance trains: first class (ACN), economy with the snack bar (BRN), and economy (BN). Four sets remain, on the Swan Hill line.", source: `${WP}V/Line_N_type_carriage` };
const each = (keys, sheet) => Object.fromEntries(keys.map((k) => [k, sheet]));
export const FACTS = {
  ...each(["ptvComM", "ptvComT"], COM_FACTS),
  ...each(["ptvSieM", "ptvSieT"], SIE_FACTS),
  ...each(["ptvXtM", "ptvXtT"], XT_FACTS),
  ...each(["ptvXt2Mc", "ptvXt2Tp", "ptvXt2M"], XT2_FACTS),
  ...each(["ptvHcmtTc", "ptvHcmtMp", "ptvHcmtDT"], HCMT_FACTS),
  ptvSprinter: SPR_FACTS,
  ...each(["ptvVlocity", "ptvVlocityMid"], VLO_FACTS),
  ptvN: N_FACTS,
  ...each(["ptvACN", "ptvBRN", "ptvBN"], NSET_FACTS),
};
