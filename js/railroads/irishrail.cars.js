// Irish Rail's cars (scripts/railroads/irishrail.py): its InterCity and
// commuter railcars, the DART's electric units, and the locomotive-hauled
// Dublin–Cork and Enterprise sets. The realtime API names no units, so every
// train is drawn as what usually runs on its line. Trainsheet's own side
// views, from published dimensions and photographs; the lettering is drawn
// here, not copied.
import { newId, married, bilevel } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, poly, win, door, truck, pantograph, slats, underframe } from "../carart.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);

// InterCity silver and green with yellow ends; the commuter railcars' lime
// over navy; DART's dark green and lime; the Enterprise's silver and charcoal.
const IE = { silver: "#d6dade", roof: "#9ea5ad", green: "#0b6b3e", dark: "#0d4f30", lime: "#a6c83a", yellow: "#f2c21b", skirt: "#3a3e44", band: "#22272c" };
const COM = { lime: "#a3c63a", navy: "#1f2b5e", white: "#f3f4f4" };
const DART = { green: "#1f4d2c", lime: "#93b83a", yellow: "#d9d321", front: "#c9d42a", red: "#b3262d" };
const ENT = { silver: "#cdd1d6", charcoal: "#3b3f46", plum: "#6b2149" };

// ---------- Detail shared by the drawings ----------

const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
// Lettering h ft tall centered on (x, y), reading left to right even on a
// car drawn mirrored.
const letters = (c, x, y, h, text, fill, { weight = 700, spacing = 0, style = "" } = {}) =>
  `<text transform="translate(${x} ${y}) scale(${c.mirrored ? -1 : 1} -1)" y="${(h * 0.36).toFixed(2)}" font-size="${h}" text-anchor="middle" font-weight="${weight}"` +
  `${style ? ` font-style="${style}"` : ""} letter-spacing="${spacing}" font-family="${SANS}" fill="${fill}">${text}</text>`;
// Irish Rail's name as lettered on its trains: the wordmark beside a small
// mark of three bars (drawn here as a simple sign, not the logo itself).
const ieName = (c, x, y, h, fill) => letters(c, x + h * 0.7, y, h, "Iarnród Éireann", fill, { weight: 600 }) +
  rect(x - h * 4.9, y - h * 0.42, h * 0.95, h * 0.84, fill, 0, 'rx="0.08"');
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
// The front of a cab seen from the side: lamp: [x, y] the headlight with
// the tail light under it; coupler: [x, y] an automatic coupler at the face;
// skirt: the fairing under the nose (points); horn: x on the cab roof [x, roof];
// wiper: the windshield wiper [x1, y1, x2, y2].
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
// A car on carmodels.js's bilevel() with the detail every car here shares:
// the eave's rain strip, a step under each high-floor door, roof units
// (spec.ac: [[x, w, h]]), under-floor equipment (spec.gear), roof gear
// (spec.onRoof(c, g)), and on a cab car its front (spec.front).
const unit = (c, spec) => bilevel(c, {
  ...spec,
  extra: (c, g) => {
    const a = c.cabL && spec.cabLen ? g.x0 + spec.cabLen + 1.5 : g.x0 + 1.0;
    let s = line(a, g.roof - 0.75, g.x1 - 1.0, g.roof - 0.75, "rgba(0,0,0,0.2)", 0.5);
    for (const d of spec.doors || []) if (d.y0 > g.sill + 0.1 && d.step !== false) s += rect(d.x + 0.25, g.sill - 0.6, d.w - 0.5, 0.28, "currentColor", 0, 'opacity="0.75"');
    for (const [x, w, h] of spec.ac || []) s += aircon(x, g.roof, w, h);
    s += gear(g.sill, spec.gear || []);
    if (spec.onRoof) s += spec.onRoof(c, g);
    return s + (spec.more ? spec.more(c, g) : "");
  },
  cab: (c, g) => (spec.cabArt ? spec.cabArt(c, g) : "") + (spec.front ? front(spec.front) : ""),
});

// A locomotive's body, which the carmodels.js builders can't shape (a cab at
// each end): the outline filled, its livery clipped to it and shaded like the
// built-in drawings (soft shadow low, highlight high).
function shell(d, base, liv) {
  const id = newId();
  const shade = `<linearGradient id="${id}-s" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="14">` +
    '<stop offset="0.2" stop-color="#000" stop-opacity="0.16" style="stop-opacity:var(--car-shade-low,0.16)"/><stop offset="0.45" stop-color="#000" stop-opacity="0"/>' +
    '<stop offset="0.6" stop-color="#fff" stop-opacity="0"/><stop offset="0.85" stop-color="#fff" stop-opacity="0.1" style="stop-opacity:var(--car-shade-high,0.1)"/>' +
    '<stop offset="1" stop-color="#000" stop-opacity="0.08" style="stop-opacity:var(--car-shade-roof,0.08)"/></linearGradient>';
  return path(d, base) + `<clipPath id="${id}"><path d="${d}"/></clipPath><defs>${shade}</defs>` +
    `<g clip-path="url(#${id})">${liv}<rect x="-5" y="0" width="200" height="16" fill="url(#${id}-s)"/></g>` + path(d, "none", 0.8);
}
// Side buffers at a body end (x: the buffer face), as on Irish locomotives
// and coaches, with the screw coupling's hook between them.
const buffers = (x, side, y = 3.4) => rect(side < 0 ? x : x - 1.1, y - 0.45, 1.1, 0.9, "currentColor", 0, 'rx="0.2"') +
  rect(side < 0 ? x : x - 0.25, y - 0.7, 0.25, 1.4, "currentColor") + rect(side < 0 ? x + 1.1 : x - 1.6, y - 1.0, 0.5, 0.35, "currentColor", 0, 'opacity="0.8"');
const grille = (x, y, w, h, gap = 0.4) => rect(x, y, w, h, "rgba(20,22,25,0.5)", 0.4) + slats(x, y, w, h, gap, "rgba(255,255,255,0.18)");

// --- 22000 Class ICR (Hyundai Rotem with Tokyu bogies, 2007-12; 41 more
// middle cars 2022-23): 63 sets of 3 to 6 cars, end cars 23.2 m, middle
// cars 22.4 m, one MTU engine under each car. A single plug door at each
// end of each car side (behind the cab on a driving car); the windows set
// in one dark band. Silver; a dark green panel sweeping back from the
// windshield past the first door, a yellow front; a thin green line along
// the lower side, curling up at its ends; air-conditioning at both ends of
// the roof, the exhaust between; the engine raft, fuel tank and batteries
// under the floor.
const ICR = { roof: 12.6, sill: 3.5, cornerR: 1.1, end: 0.6, trucks: { centers: 52, wb: 8.2, d: 33 }, diaphragm: [3.9, 11.6], badge: false };
function icrPaint(c, g, cab) {
  const L = g.L, a = cab ? 13.0 : 6.0;
  let s = rect(0, 0, L, 17, IE.silver) + rect(0, 11.7, L, 2, IE.roof) + rect(0, 11.62, L, 0.12, "#7e858d") + rect(0, 0, L, 3.5, IE.skirt);
  s += rect(a, 6.85, L - a - 6.0, 2.95, IE.band, 0, 'rx="0.5"');
  // The green line low on the side, curling up at its ends.
  s += path(`M${a + 2} 5.6Q${a + 6} 4.9 ${a + 12} 5.15L${L - 12} 5.15Q${L - 9} 5.15 ${L - 7.5} 6.2L${L - 7.9} 6.25Q${L - 9.5} 5.45 ${L - 12} 5.45L${a + 12} 5.45Q${a + 6} 5.25 ${a + 2.3} 5.8Z`, IE.dark);
  if (cab) {
    s += path("M2.2 8.9Q4.8 7.6 6.4 6.0Q7.4 4.6 7.7 3.5L12.6 3.5Q13.6 7.8 12.9 11.7L5.6 12.7Z", IE.dark);
    s += path("M12.6 3.5Q13.6 7.8 12.9 11.7L13.3 11.7Q14.0 7.8 13.0 3.5Z", IE.lime);
    s += path("M0 0L0 8.4Q3.0 8.2 4.6 7.3Q5.8 6.0 5.9 3.5L5.9 0Z", IE.yellow);
  } else s += rect(0.6, 3.5, 4.0, 13.5, IE.dark) + rect(L - 4.6, 3.5, 4.0, 13.5, IE.dark);
  return s + ieName(c, cab ? 40 : L / 2, 4.35, 0.62, IE.dark);
}
const icrDoor = (x) => ({ x, w: 2.7, y0: 3.7, y1: 10.9, glassY: 0.55, glassH: 0.3, grabs: false, fill: "rgba(0,0,0,0.12)" });
const icrGear = (a) => [[a, 9.5, 1.6, "g"], [a + 10.3, 5.5, 1.3, "b"], [a + 16.6, 7.5, 1.1, "t"], [a + 25, 4.6, 1.2], [a + 30.4, 3.2, 0.9, "b"]];
export const icrCab = (c) => unit({ ...c, cabL: true, cabR: false }, { ...ICR,
  nose: [[1.0, 3.5], [1.0, 6.0], ["q", 1.1, 7.3, 1.9, 8.3], [4.8, 11.9], ["q", 5.6, 12.6, 7.2, 12.6]],
  rows: [{ xs: seq(13.6, 5.55, 10), y: 7.1, w: 4.5, h: 2.45, r: 0.3 }],
  doors: [icrDoor(8.9), icrDoor(c.L - 4.4)], cabLen: 7,
  ac: [[15.5, 9.5, 0.7], [c.L - 17.5, 9.5, 0.7]], gear: icrGear(20),
  onRoof: (c, g) => exhaust(33, g.roof) + aerial(28, g.roof),
  paint: (c, g) => icrPaint(c, g, true),
  cabArt: () => path(poly([[2.0, 8.3], [4.7, 11.6], [6.4, 11.6], [6.4, 8.3]]), C.glass) + path(poly([[2.6, 8.5], [4.1, 10.4], [4.6, 10.4], [3.3, 8.5]]), "rgba(255,255,255,0.12)") +
    rect(4.3, 10.75, 1.9, 0.5, "#121417", 0.3, 'rx="0.08"') + rect(4.45, 10.87, 1.2, 0.26, "#f5a623"),
  front: { lamp: [1.05, 5.4], coupler: [0, 2.85], skirt: [[1.0, 3.5], [1.4, 1.5], [6.0, 1.5], [6.4, 3.5]], horn: [8.0, 12.6], wiper: [2.9, 8.6, 4.4, 10.9] },
});
export const icrMid = (c) => unit({ ...c, cabL: false, cabR: false }, { ...ICR,
  rows: [{ xs: seq(6.6, 5.55, 11), y: 7.1, w: 4.5, h: 2.45, r: 0.3 }],
  doors: [icrDoor(1.6), icrDoor(c.L - 4.3)],
  ac: [[7.5, 9.5, 0.7], [c.L - 17.0, 9.5, 0.7]], gear: icrGear(19),
  onRoof: (c, g) => exhaust(32, g.roof),
  paint: (c, g) => icrPaint(c, g, false),
});

// --- 29000 Class (CAF, 2002-05): 29 four-car railcars, 81.5 m long, an
// MAN engine under each car, 121 km/h. Two pairs of sliding doors a side on
// every car, at about the third points. The commuter livery: lime green
// over a white band lettered with the company's name, navy below; pale gray
// doors; a yellow front with the windshield in a navy surround.
const CAF29 = { roof: 12.6, sill: 3.6, cornerR: 1.0, end: 0.6, trucks: { centers: 46, wb: 8.2, d: 33 }, diaphragm: [3.9, 11.6], badge: false };
const c29Paint = (c, g, cab) => {
  const L = g.L;
  let s = rect(0, 0, L, 17, COM.lime) + rect(0, 11.8, L, 2, "#9aa2a9") + rect(0, 11.7, L, 0.12, "#6f777f") + rect(0, 0, L, 3.6, IE.skirt);
  s += rect(0, 3.6, L, 1.55, COM.navy) + rect(0, 5.15, L, 1.0, COM.white) + rect(0, 6.15, L, 0.12, COM.navy);
  if (cab) s += path("M0 3.6L0 12.0Q3.4 12.0 5.4 11.3L5.4 6.3Q3.4 6.0 2.8 3.6Z", COM.navy) + path("M0 3.6L0 7.6Q2.0 7.5 2.6 6.4L2.4 3.6Z", IE.yellow);
  return s + ieName(c, L / 2 + 3, 5.65, 0.6, COM.navy);
};
const c29Door = (x) => ({ x, w: 4.3, y0: 3.7, y1: 10.9, leaves: 2, glassY: 0.45, glassH: 0.42, fill: "#e6e9eb" });
const c29Gear = (a) => [[a, 7.5, 1.6, "g"], [a + 8.2, 4.2, 1.2, "b"], [a + 13.2, 5.6, 1.0, "t"]];
export const c29Cab = (c) => unit({ ...c, cabL: true, cabR: false }, { ...CAF29,
  nose: [[0.9, 3.6], [0.9, 9.4], ["q", 1.0, 11.4, 2.0, 12.2], ["q", 2.8, 12.6, 4.4, 12.6]],
  rows: [{ xs: [7.6, ...seq(23.6, 5.3, 4), 50.3, 55.6, 61.2], y: 7.1, w: 4.3, h: 2.5, r: 0.3 }],
  doors: [c29Door(17.6), c29Door(44.5)], cabLen: 5,
  ac: [[8.5, 8, 0.6], [49, 9, 0.6]], gear: c29Gear(23.6),
  onRoof: (c, g) => exhaust(30, g.roof) + aerial(26, g.roof),
  paint: (c, g) => c29Paint(c, g, true),
  cabArt: () => path(poly([[1.0, 8.2], [1.7, 11.4], [4.2, 11.4], [4.2, 8.2]]), C.glass) + rect(2.0, 10.75, 2.0, 0.45, "#121417", 0.3) + rect(2.15, 10.85, 1.2, 0.25, "#f5a623"),
  front: { lamp: [0.95, 5.2], coupler: [0, 2.9], skirt: [[0.9, 3.6], [1.1, 1.6], [5.6, 1.6], [6.0, 3.6]], horn: [5.0, 12.6], wiper: [1.3, 8.6, 2.2, 10.9] },
});
export const c29Mid = (c) => unit({ ...c, cabL: false, cabR: false }, { ...CAF29,
  rows: [{ xs: [2.0, 7.4, ...seq(22.6, 5.3, 4), 49.6, 54.9, 60.3], y: 7.1, w: 4.3, h: 2.5, r: 0.3 }],
  doors: [c29Door(16.8), c29Door(43.8)],
  ac: [[5, 8, 0.6], [46, 9, 0.6]], gear: c29Gear(23),
  onRoof: (c, g) => exhaust(30, g.roof),
  paint: (c, g) => c29Paint(c, g, false),
});

// --- 2600 Class (Tokyu Car, 1993; Cork's suburban trains) and 2800 Class
// (Tokyu Car, 2000; Limerick and the west): two-car railcars, a Cummins
// engine and hydraulic drive under each car. A single sliding door a side
// near each end of each car; between them big windows. Silver over a gray
// skirt, a dark green panel and door behind the yellow cab front edged in
// lime, the windows in a dark band, the name low on the side.
const tokyu = (big) => married((c) => unit(c, {
  roof: 12.6, sill: 3.7, cornerR: 1.0, end: 0.6, trucks: { centers: 47, wb: 8.2, d: 33 }, diaphragm: [3.9, 11.6], badge: false,
  nose: [[0.9, 3.7], [0.9, 9.6], ["q", 1.0, 11.6, 2.1, 12.3], ["q", 2.9, 12.6, 4.4, 12.6]],
  rows: [{ xs: big ? seq(13.4, 7.4, 6) : seq(13.2, 5.9, 8), y: 7.1, w: big ? 6.2 : 4.6, h: 2.6, r: 0.35 }],
  doors: [{ x: 7.6, w: 3.0, y0: 3.8, y1: 10.9, glassY: 0.5, glassH: 0.36, fill: "rgba(0,0,0,0.1)" }, { x: c.L - 5.6, w: 3.0, y0: 3.8, y1: 10.9, glassY: 0.5, glassH: 0.36 }],
  ac: [[14, 9, 0.6], [42, 10, 0.6]], cabLen: 5,
  gear: [[20, 7, 1.6, "g"], [27.8, 5, 1.2, "b"], [33.6, 6, 1.0, "t"], [40.4, 3.6, 0.9]],
  onRoof: (c, g) => exhaust(34, g.roof),
  paint: (c, g) => {
    const L = g.L;
    return rect(0, 0, L, 17, IE.silver) + rect(0, 11.7, L, 2, IE.roof) + rect(0, 11.62, L, 0.12, "#7e858d") + rect(0, 0, L, 3.7, IE.skirt) +
      rect(12.4, 6.85, L - 19, 3.1, IE.band, 0, 'rx="0.4"') + path("M3.4 3.7L11.4 3.7L11.4 17L3.4 17Z", IE.dark) + rect(11.4, 3.7, 0.35, 13.3, IE.lime) +
      path("M0 0L0 7.8Q2.4 7.8 3.4 7.0L3.4 0Z", IE.yellow) + rect(12.4, 5.25, L - 19, 0.3, IE.dark) + ieName(c, L / 2 + 2, 4.5, 0.55, IE.dark);
  },
  cabArt: () => path(poly([[1.0, 8.1], [1.8, 11.4], [3.3, 11.4], [3.3, 8.1]]), C.glass) + win(4.6, 7.4, 2.0, 2.4, 0.3) + rect(1.9, 10.8, 1.4, 0.42, "#121417", 0.3) + rect(2.0, 10.9, 0.9, 0.22, "#f5a623"),
  front: { lamp: [0.95, 5.3], coupler: [0, 2.9], skirt: [[0.9, 3.7], [1.1, 1.6], [5.2, 1.6], [5.6, 3.7]], horn: [5.4, 12.6], wiper: [1.3, 8.4, 2.1, 10.9] },
}));
export const ie2600 = tokyu(false);
export const ie2800 = tokyu(true);

// --- DART 8100 Class (Linke-Hofmann-Busch with GEC, 1983-84): two-car
// sets, a power car (8101-8140) with its pantograph and a driving trailer
// (8301-8340), 20.49 m each, 100 km/h; up to four sets coupled. Two pairs
// of sliding doors a side; the windows between and beyond them. DART's dark
// green with the windows in a lime band over a yellow line, the DART name
// in white low on the side; the cab front lime under the windshield, a red
// sill, the windshield in dark green.
const dartPaint = (c, g, front) => {
  const L = g.L;
  let s = rect(0, 0, L, 17, DART.green) + rect(0, 11.9, L, 2, "#8d969e") + rect(0, 11.8, L, 0.12, "#5f676e") + rect(0, 0, L, 3.7, IE.skirt);
  s += rect(0, 6.75, L, 4.35, DART.lime) + rect(0, 6.45, L, 0.22, DART.yellow);
  if (front) s += path(`M0 3.7L${front} 3.7L${front} 6.4Q${front} 7.6 ${front - 0.8} 7.9L0 7.9Z`, DART.front) + rect(0, 3.7, front + 0.2, 0.55, DART.red) + rect(0, 7.9, front - 0.6, 3.6, DART.green);
  return s + letters(c, L / 2 + 13, 4.95, 0.95, "DART", "#ffffff", { weight: 800, spacing: 0.08 });
};
const dartDoor = (x) => ({ x, w: 4.2, y0: 3.8, y1: 10.9, leaves: 2, glassY: 0.45, glassH: 0.42, fill: "rgba(0,0,0,0.12)" });
// Resistor and contactor cases under a power car; a trailer's compressor,
// battery and converter.
const dartGear = (power) => power ? [[18, 7, 1.5, "g"], [25.6, 4.6, 1.3, "b"], [31, 6, 1.4, "g"], [37.6, 4.4, 1.0, "t"]] : [[18, 6, 1.2, "b"], [25, 5, 1.1], [31, 6, 1.0, "t"], [38, 4, 1.1, "b"]];
// A pantograph with its insulators and the roof cable from it to the
// equipment, its well walled by a roof cover.
const panGear = (x, roof, facing = -1) => pantograph(x, roof, { up: true, facing }) + rect(x - 4.2, roof - 0.05, 1.6, 0.45, "#7d848c", 0.4, 'rx="0.1"') +
  line(x + 3.0, roof + 0.3, x + 7.5, roof + 0.3, "currentColor", 0.7) + rect(x + 7.5, roof - 0.05, 2.4, 0.55, "#a3aab2", 0.4, 'rx="0.12"');
export const dart8100 = married((c) => unit(c, {
  roof: 12.6, sill: 3.7, cornerR: 0.9, end: 0.6, trucks: { centers: 45, wb: 8.2, d: 33 }, diaphragm: [3.9, 11.6], badge: false,
  rows: [{ xs: [6.0, ...seq(21.4, 5.1, 4), 47.0, 52.1, 57.6], y: 7.15, w: 4.2, h: 2.65, r: 0.3 }],
  doors: [dartDoor(14.6), dartDoor(41.0)], cabLen: 4,
  gear: dartGear(c.pan),
  onRoof: (c, g) => (c.pan ? panGear(9.5, g.roof) : rect(6, g.roof - 0.05, 8, 0.45, "#a3aab2", 0.4, 'rx="0.12"')) + rect(44, g.roof - 0.05, 9, 0.45, "#a3aab2", 0.4, 'rx="0.12"') + aerial(36, g.roof),
  paint: (c, g) => dartPaint(c, g, c.cabL ? 2.4 : 0),
  cabArt: (c, { x0 }) => win(x0 + 1.0, 7.3, 2.6, 3.1, 0.25) + rect(x0 + 0.05, 11.2, 0.45, 0.5, "#121417") + rect(x0 + 0.1, 11.3, 0.35, 0.3, "#f5a623"),
  front: { lamp: [0.65, 5.0], coupler: [0, 2.9], skirt: [[0.6, 3.7], [0.8, 1.7], [4.6, 1.7], [5.0, 3.7]], horn: [3.0, 12.6] },
}));

// --- DART 8500, 8510 and 8520 Classes (Tokyu Car, 2000-04): 17 four-car
// sets, driving trailers (86xx, 20.56 m) at the ends and two power cars
// (85xx, 20.76 m) between, 100 km/h in service. Two pairs of sliding doors
// a side, wide windows; a pantograph and air-conditioning on each power car.
// The same green and lime as the 8100s, the front a big flat windshield
// over the lime and the DART name.
const dart85 = (cab) => (c) => unit(cab ? { ...c, cabL: true, cabR: false } : { ...c, cabL: false, cabR: false }, {
  roof: 12.6, sill: 3.7, cornerR: 0.9, end: 0.6, trucks: { centers: 45, wb: 8.2, d: 33 }, diaphragm: [3.9, 11.6], badge: false,
  rows: [{ xs: cab ? [6.4, 22.0, 28.1, 34.2, 48.7, 54.8, 61.0] : [1.8, 7.9, 22.6, 28.7, 34.8, 49.4, 55.5, 61.6], y: 7.05, w: 5.0, h: 2.8, r: 0.3 }],
  doors: cab ? [dartDoor(15.0), dartDoor(41.6)] : [dartDoor(15.6), dartDoor(42.2)], cabLen: cab ? 5 : 0,
  ac: cab ? [[7, 9, 0.6], [44, 10, 0.6]] : [[22, 12, 0.6], [46, 10, 0.6]], gear: dartGear(!cab),
  onRoof: (c, g) => (cab ? aerial(30, g.roof) : panGear(8.5, g.roof)),
  paint: (c, g) => dartPaint(c, g, cab ? 2.8 : 0),
  cabArt: (c, { x0 }) => path(poly([[x0 + 0.4, 7.9], [x0 + 0.9, 11.3], [x0 + 4.0, 11.3], [x0 + 4.0, 7.9]]), C.glass) + rect(x0 + 1.4, 11.4, 2.4, 0.42, "#121417", 0.3) + rect(x0 + 1.6, 11.5, 1.4, 0.22, "#f5a623"),
  front: cab ? { lamp: [0.65, 5.0], coupler: [0, 2.9], skirt: [[0.6, 3.7], [0.8, 1.7], [4.6, 1.7], [5.0, 3.7]], horn: [3.4, 12.6], wiper: [1.4, 8.2, 2.4, 10.8] } : null,
});
export const dart85Cab = dart85(true);
export const dart85Mid = dart85(false);

// --- 201 Class (General Motors JT42HCW, London, Ontario, 1994-95): 34
// six-axle locomotives, 3,200 hp, 160 km/h, 20.96 m; a cab at each end.
// Now they haul the Dublin–Cork Mark 4 sets and the Enterprise. InterCity
// livery: silver over green, a lime line between, yellow ends, the name in
// white on the green; the Enterprise's: silver over charcoal, plum around
// the cab windows, "Enterprise" on the side. Radiator intakes and the
// cooling fans at one end, the exhaust amidships, the fuel tank between the
// trucks, buffers and a screw coupling at both ends.
export function loco201(c) {
  const { L } = c, sill = 4.0, roof = 13.0, ent = c.route === "Enterprise";
  const d = poly([[0.8, sill], [L - 0.8, sill], [L - 0.8, 9.2], [L - 1.6, 12.4], ["q", L - 1.9, roof, L - 2.8, roof],
    [2.8, roof], ["q", 1.9, roof, 1.6, 12.4], [0.8, 9.2]]);
  let s = truck(L / 2 - 21.5, { wb: 12.6, d: 40, kind: "loco", top: sill, axles: 3 }) + truck(L / 2 + 21.5, { wb: 12.6, d: 40, kind: "loco", top: sill, axles: 3 });
  // Fuel tank, its filler and gauge; air reservoirs and the battery box ahead of it.
  s += path(poly([[24, sill], [L - 24, sill], [L - 24, 2.4], ["q", L - 24, 1.5, L - 25, 1.5], [25, 1.5], ["q", 24, 1.5, 24, 2.4]]), "currentColor", 0, 'opacity="0.82"');
  s += line(25, 2.4, L - 25, 2.4, "rgba(255,255,255,0.14)", 0.6) + rect(L / 2 - 0.4, 2.6, 0.8, 0.8, C.steelDark, 0.3, 'rx="0.4"') + rect(30, 2.7, 1.2, 0.9, C.steelDark, 0.3);
  s += rect(14.6, sill - 1.2, 3.2, 0.75, C.steelDark, 0.4, 'rx="0.37"') + rect(L - 17.8, sill - 1.2, 3.2, 0.75, C.steelDark, 0.4, 'rx="0.37"');
  // Pilots under the buffer beams.
  for (const [a, b] of [[0.8, 3.4], [L - 0.8, L - 3.4]]) s += path(poly([[a, sill], [b, sill], [b, 1.6], [a + (b > a ? 0.4 : -0.4), 1.0]]), "#2a2d31", 0.4);
  let liv = rect(0, 0, L, 15, ent ? ENT.silver : IE.silver) + rect(0, 12.3, L, 2, IE.roof) + rect(0, 12.2, L, 0.12, "#7e858d");
  if (ent) liv += rect(0, 0, L, 6.8, ENT.charcoal) + rect(0, 6.8, L, 0.3, ENT.plum);
  else liv += rect(0, 0, L, 7.0, IE.green) + rect(0, 7.0, L, 0.35, IE.lime);
  for (const [x, k] of [[0, 1], [L, -1]]) {
    const X = (v) => x + k * v;
    liv += path(poly([[X(0), 0], [X(2.7), 0], [X(2.7), 8.9], ["q", X(2.6), 9.4, X(2.1), 9.4], [X(0), 9.4]]), IE.yellow);
    if (ent) liv += path(poly([[X(0.9), 9.2], [X(4.6), 9.2], [X(4.6), 12.6], [X(1.5), 12.6]]), ENT.plum);
    liv += path(poly([[X(1.05), 9.5], [X(1.75), 12.2], [X(3.6), 12.2], [X(3.6), 9.5]]), C.glass);
    liv += line(X(1.6), 9.7, X(2.6), 11.6, "#0b0d0f", 0.8);
  }
  s += shell(d, ent ? ENT.silver : IE.silver, liv);
  // Cab side windows and doors; the engine room's doors and handrail.
  s += win(4.4, 9.3, 2.0, 2.2, 0.2) + win(L - 6.4, 9.3, 2.0, 2.2, 0.2);
  s += door(7.0, 4.3, 2.0, 7.4, { glass: false }) + door(L - 9.0, 4.3, 2.0, 7.4, { glass: false });
  s += lines([[11.2, 4.4, 11.2, 7.6], [24.5, 4.4, 24.5, 7.6], [34, 4.4, 34, 7.6], [43.5, 4.4, 43.5, 7.6]], "rgba(0,0,0,0.3)", 0.45) + line(10, 7.9, L - 10, 7.9, "rgba(0,0,0,0.25)", 0.5);
  // Air intakes along the upper side, the radiator's big grilles at No. 2 end.
  s += grille(12, 8.2, 12, 3.4) + grille(26, 9.4, 8, 2.2, 0.3) + grille(L - 26, 8.2, 14, 3.4);
  // Roof: cooling fans over the radiator, the dynamic brake hatch, the
  // exhaust, horns over each cab.
  for (const x of [L - 23.5, L - 17.5]) s += path(`M${x - 2.2} ${roof}Q${x} ${roof + 0.8} ${x + 2.2} ${roof}Z`, C.steelDark, 0.4) + rect(x - 1.4, roof + 0.35, 2.8, 0.15, "currentColor", 0, 'opacity="0.6"');
  s += rect(14, roof - 0.05, 8, 0.4, "#9aa1a9", 0.4, 'rx="0.1"') + slats(14.4, roof, 7.2, 0.3, 0.45, "rgba(0,0,0,0.35)");
  s += exhaust(L / 2 - 4, roof) + horns(4.0, roof) + horns(L - 5.2, roof) + aerial(L / 2 + 5, roof);
  // Headlights and tail lights low on each nose.
  for (const x of [0.85, L - 1.45]) s += rect(x, 7.4, 0.6, 0.45, "#f6f3dc", 0.4, 'rx="0.14"') + rect(x, 6.6, 0.6, 0.4, "#d0212e", 0.3, 'rx="0.1"');
  s += letters(c, L / 2, 5.4, 1.15, ent ? "Enterprise" : "Iarnród Éireann", "#ffffff", { weight: ent ? 600 : 600, style: ent ? "italic" : "" });
  return s + buffers(0.8, -1) + buffers(L - 0.8, 1);
}

// --- Mark 4 (CAF, 2004-06): the Dublin–Cork sets, eight cars behind a 201
// Class, 23.66 m coaches and a 23.81 m generator and control car at the
// Dublin end, 160 km/h. A single plug door at each end of each coach side,
// square windows between. Silver over green, a lime line between at the
// windows' foot; the name in white on the green. The control car's raked
// nose yellow, the green sweeping up behind the cab to the roof edged in
// lime; its side a luggage van with a big door and the generator's
// grilles.
const MK4 = { roof: 12.9, sill: 3.8, cornerR: 1.1, end: 0.6, trucks: { centers: 56, wb: 8.5, d: 36 }, diaphragm: [4.0, 11.8], badge: false };
const mk4Paint = (c, g) => {
  const L = g.L;
  return rect(0, 0, L, 17, IE.silver) + rect(0, 3.8, L, 2.85, IE.green) + rect(0, 6.65, L, 0.28, IE.lime) + rect(0, 12.0, L, 2, IE.roof) + rect(0, 11.9, L, 0.12, "#7e858d") + rect(0, 0, L, 3.8, IE.skirt);
};
const mk4Door = (x) => ({ x, w: 2.7, y0: 4.0, y1: 10.9, glassY: 0.55, glassH: 0.3, grabs: false, fill: "rgba(0,0,0,0.1)" });
const mk4Gear = [[20, 6, 1.3, "b"], [27, 7, 1.0, "t"], [35, 5, 1.2], [41.4, 6, 1.0, "t"], [48.4, 5, 1.3, "b"]];
export const mk4 = (c) => unit({ ...c, cabL: false, cabR: false }, { ...MK4,
  rows: [{ xs: seq(7.0, 5.4, 12), y: 7.0, w: 4.2, h: 2.75, r: 0.35 }],
  doors: [mk4Door(1.6), mk4Door(c.L - 4.3)],
  paint: (c, g) => mk4Paint(c, g) + ieName(c, g.L / 2, 5.2, 0.7, "#ffffff"),
  ac: [[6, 10, 0.7], [c.L - 16, 10, 0.7]], gear: mk4Gear,
});
export const mk4Dvt = (c) => unit({ ...c, cabL: true, cabR: false }, { ...MK4,
  nose: [[1.2, 3.8], [1.0, 6.2], ["q", 1.1, 7.4, 2.0, 8.4], [6.4, 12.2], ["q", 7.4, 12.9, 9.4, 12.9]],
  rows: [{ xs: [52.6, 58.0, 63.4, 68.8], y: 7.0, w: 4.2, h: 2.75, r: 0.35 }],
  doors: [mk4Door(11.6), { x: 30.0, w: 6.0, y0: 4.0, y1: 10.9, leaves: 2, glass: false, glassY: 0.6, glassH: 0.2, grabs: false, fill: "rgba(0,0,0,0.1)" }, mk4Door(c.L - 4.3)],
  cabLen: 9,
  paint: (c, g) => mk4Paint(c, g) + path(poly([[8.6, 3.8], [g.L, 3.8], [g.L, 6.65], [24, 6.65], ["q", 16, 6.8, 14.4, 12.9], [10.6, 12.9], ["q", 11.4, 7.4, 8.6, 3.8]]), IE.green) +
    path(poly([[14.4, 12.9], ["q", 16, 6.8, 24, 6.65], [g.L, 6.65], [g.L, 6.93], [24, 6.93], ["q", 16.4, 7.1, 14.9, 12.9]]), IE.lime) +
    path("M0 0L0 17L8.0 17Q10.4 12.6 10.0 8.4Q9.4 5.4 8.4 3.8L8.4 0Z", IE.yellow) + ieName(c, 43, 5.2, 0.7, "#ffffff"),
  cabArt: () => path(poly([[2.1, 8.4], [6.2, 11.8], [8.6, 11.8], [8.6, 8.4]]), C.glass) + path(poly([[3.0, 8.6], [5.0, 10.3], [5.6, 10.3], [3.8, 8.6]]), "rgba(255,255,255,0.12)"),
  front: { lamp: [1.15, 5.7], coupler: [0, 3.0], skirt: [[1.2, 3.8], [1.5, 1.5], [7.0, 1.5], [7.4, 3.8]], horn: [10.4, 12.9], wiper: [3.4, 8.6, 5.4, 11.0] },
  ac: [[c.L - 16, 10, 0.7]], gear: [[18, 9, 1.8, "g"], [28, 5, 1.4, "b"], [34, 7, 1.1, "t"], [42, 6, 1.4, "b"]],
  onRoof: (c, g) => exhaust(24, g.roof) + aerial(20, g.roof) + rect(15.0, g.roof - 0.05, 7, 0.5, "#9aa1a9", 0.4, 'rx="0.12"'),
  more: () => grille(15.6, 7.0, 11.5, 3.0) + grille(38.0, 7.0, 12.0, 3.0),
});

// --- The Enterprise's De Dietrich coaches (1996-97, shared with NI
// Railways): seven-car sets with a driving trailer at the Dublin end, 145
// km/h. A plug door at each end of each side, long rows of windows. As
// refurbished: silver over charcoal, a plum line between, "Enterprise" in
// white on the charcoal; the driving trailer's flat front yellow, the
// windshield in a charcoal surround.
const DD = { roof: 12.8, sill: 3.8, cornerR: 1.0, end: 0.6, trucks: { centers: 55, wb: 8.5, d: 36 }, diaphragm: [4.0, 11.8], badge: false };
const ddPaint = (c, g, a = 0) => {
  const L = g.L;
  return rect(0, 0, L, 17, ENT.silver) + rect(0, 3.8, L, 2.5, ENT.charcoal) + rect(0, 6.3, L, 0.3, ENT.plum) + rect(a, 6.95, L - a, 2.9, IE.band, 0, 'rx="0.3"') +
    rect(0, 11.9, L, 2, IE.roof) + rect(0, 11.8, L, 0.12, "#7e858d") + rect(0, 0, L, 3.8, IE.skirt) + letters(c, L / 2, 5.05, 1.0, "Enterprise", "#ffffff", { weight: 600, style: "italic" });
};
const ddGear = [[20, 6, 1.3, "b"], [27, 6.5, 1.0, "t"], [34.5, 5, 1.2], [40.5, 6, 1.0, "t"], [47.5, 5, 1.3, "b"]];
const ddDoor = (x) => ({ ...mk4Door(x), fill: "rgba(0,0,0,0.08)" });
export const ddCoach = (c) => unit({ ...c, cabL: false, cabR: false }, { ...DD,
  rows: [{ xs: seq(6.6, 5.2, 12), y: 7.1, w: 4.4, h: 2.55, r: 0.3 }],
  doors: [ddDoor(1.6), ddDoor(c.L - 4.3)], paint: ddPaint,
  ac: [[6, 10, 0.7], [c.L - 16, 10, 0.7]], gear: ddGear,
});
export const ddCab = (c) => unit({ ...c, cabL: true, cabR: false }, { ...DD,
  nose: [[0.9, 3.8], [0.9, 10.2], ["q", 1.0, 12.2, 2.4, 12.6], ["q", 3.0, 12.8, 4.4, 12.8]],
  rows: [{ xs: seq(11.6, 5.2, 11), y: 7.1, w: 4.4, h: 2.55, r: 0.3 }],
  doors: [ddDoor(6.6), ddDoor(c.L - 4.3)], cabLen: 5,
  paint: (c, g) => ddPaint(c, g, 9.6) + path("M0 7.6L4.8 7.6L4.8 12.2Q3.0 12.8 0 12.8Z", ENT.charcoal) + rect(0, 0, 2.6, 8.4, IE.yellow),
  cabArt: () => path(poly([[1.0, 8.6], [1.6, 11.6], [4.4, 11.6], [4.4, 8.6]]), C.glass) + rect(1.8, 10.95, 2.4, 0.45, "#121417", 0.3) + rect(2.0, 11.05, 1.4, 0.25, "#f5a623"),
  front: { lamp: [0.95, 5.6], coupler: [0, 3.0], horn: [5.0, 12.8], wiper: [1.4, 8.8, 2.3, 11.0] },
  ac: [[c.L - 16, 10, 0.7]], gear: ddGear,
  more: () => buffers(0.9, -1),
});

export const TYPES = {
  ie201: { name: "201 Class locomotive", kind: "diesel" },
  ieIcrCab: { name: "22000 Class ICR driving car", kind: "emu" },
  ieIcr: { name: "22000 Class ICR middle car", kind: "emu" },
  ie29kCab: { name: "29000 Class driving car", kind: "emu" },
  ie29k: { name: "29000 Class middle car", kind: "emu" },
  ie2600: { name: "2600 Class railcar", kind: "emu" },
  ie2800: { name: "2800 Class railcar", kind: "emu" },
  ie8100: { name: "DART 8100 Class car", kind: "emu", pan: true },
  ie8500Cab: { name: "DART 8500 Class driving trailer", kind: "emu" },
  ie8500: { name: "DART 8500 Class power car", kind: "emu", pan: true },
  ieMk4: { name: "Mark 4 coach", kind: "coach", amenities: ["first", "cafe"] },
  ieMk4Cab: { name: "Mark 4 generator and control car", kind: "coach", cab: true },
  ieDd: { name: "De Dietrich coach", kind: "coach", amenities: ["first", "cafe"] },
  ieDdCab: { name: "De Dietrich driving trailer", kind: "coach", cab: true },
};
// oneEnd: single-cab equipment, drawn cab-left and mirrored at the back of a train.
const M = (draw, len, oneEnd = false) => ({ draw, len, oneEnd, variant: null });
export const MODELS = {
  // The Enterprise's 201s wear its colors.
  ie201: { ...M(loco201, 68.75, true), variant: (c) => (c.route === "Enterprise" ? "ent" : "") },
  ieIcrCab: M(icrCab, 76.1, true),
  ieIcr: M(icrMid, 73.5),
  ie29kCab: M(c29Cab, 67.5, true),
  ie29k: M(c29Mid, 66.2),
  ie2600: M(ie2600, 67),
  ie2800: M(ie2800, 68),
  ie8100: M(dart8100, 67.2),
  ie8500Cab: M(dart85Cab, 67.4, true),
  ie8500: M(dart85Mid, 68.1),
  ieMk4: M(mk4, 77.6),
  ieMk4Cab: M(mk4Dvt, 78.1, true),
  ieDd: M(ddCoach, 75.5),
  ieDdCab: M(ddCab, 75.5, true),
};
// Fleet numbers: 201 Class 201-234; ICR driving cars 221xx-223xx and middle
// cars 224xx-228xx; 29000 sets 29001-29029; 2600 and 2800 cars; the DART's
// 8100s (power cars 8101-8140, trailers 8301-8340) and 8500s (power cars
// 8501-8540, driving trailers 8601-8640).
export const FLEETS = {
  irishrail: [[201, 234, "ie201"], [2601, 2617, "ie2600"], [2801, 2820, "ie2800"], [8101, 8140, "ie8100"], [8301, 8340, "ie8100"],
    [8501, 8540, "ie8500"], [8601, 8640, "ie8500Cab"], [22101, 22399, "ieIcrCab"], [22401, 22899, "ieIcr"], [29001, 29029, "ie29kCab"]],
};

const set = (label, ...units) => ({ label, units });
const ICR3 = set("22000 Class InterCity railcar, usually 3 to 6 cars", ["ieIcrCab", 1], ["ieIcr", 2], ["ieIcrCab", 1]);
export const TYPICAL = {
  irishrail: (t, reported) => {
    const r = t.route || "";
    if (reported === "ie8500" || reported === "ie8500Cab") return set("DART 8500 Class electric set, 4 or 8 cars", ["ie8500Cab", 1], ["ie8500", 2], ["ie8500Cab", 1]);
    if (r === "DART" || reported === "ie8100") return set("DART electric sets, usually 4 to 8 cars (8100 Class shown; also 8500, 8510 and 8520 Class sets)", ["ie8100", 4]);
    // The Mark 4s' control car is at the Dublin end, the locomotive at Cork's.
    if (reported === "ie201" || r === "Dublin–Cork") {
      const units = [["ie201", 1], ["ieMk4", 7], ["ieMk4Cab", 1]];
      return set("201 Class locomotive with Mark 4 coaches and a control car (some trains 22000 Class railcars)",
        ...(/Dublin/.test(t.destination || "") ? units.reverse() : units));
    }
    if (r === "Enterprise") return set("201 Class locomotive with De Dietrich coaches and a driving trailer (generator van not drawn)", ["ie201", 1], ["ieDd", 6], ["ieDdCab", 1]);
    if (reported === "ie29kCab" || /Northern Commuter|Western Commuter|Rosslare/.test(r)) return set("29000 Class commuter railcar, 4 or 8 cars (some trains 22000 Class)", ["ie29kCab", 1], ["ie29k", 2], ["ie29kCab", 1]);
    if (reported === "ie2600" || r === "Cork Commuter") return set("2600 Class railcars, usually 2 or 4 cars (some trains 22000 Class)", ["ie2600", 2]);
    if (reported === "ie2800" || /^Limerick–/.test(r)) return set("2800 Class railcars, usually 2 or 4 cars (some trains 22000 Class)", ["ie2800", 2]);
    return ICR3;
  },
};

// Facts come in km/h and kW; the page converts them back for display.
const kmh = (v) => Math.round((v / 1.609344) * 10) / 10, kw = (v) => Math.round(v / 0.7457);
const WP = "https://en.wikipedia.org/wiki/";
export const FACTS = {
  ie201: { model: "GM EMD JT42HCW (201 Class)", type: "Diesel-electric locomotive", builder: "General Motors Diesel, London, Ontario", built: "1994–1995",
    fleet: "34 built (2 owned by NI Railways)", topSpeedMph: kmh(160), powerHp: 3200, lengthFt: 68.75,
    about: "Irish Rail's mainline locomotive, with a cab at each end. In passenger service it now hauls only the Dublin–Cork Mark 4 sets and, with NI Railways, the Dublin–Belfast Enterprise.", source: `${WP}IÉ_201_Class` },
  ieIcrCab: { model: "22000 Class ICR", type: "Diesel multiple unit", builder: "Hyundai Rotem (bogies by Tokyu Car)", built: "2007–2012, middle cars 2022–2023",
    fleet: "63 sets, 3 to 6 cars", topSpeedMph: kmh(160), powerHp: 483, seats: 66, lengthFt: 76.1,
    about: "The InterCity Railcar runs most of Ireland's InterCity lines and many outer commuter trains. Each car has its own MTU engine; 41 extra middle cars arrived in 2022–23 to lengthen sets.", source: `${WP}IÉ_22000_Class` },
  ieIcr: { model: "22000 Class ICR middle car", type: "Diesel multiple unit", builder: "Hyundai Rotem (bogies by Tokyu Car)", built: "2007–2012, 2022–2023",
    fleet: "63 sets, 3 to 6 cars", topSpeedMph: kmh(160), powerHp: 483, seats: 72, lengthFt: 73.5,
    about: "A middle car of the InterCity Railcar, with its own engine under the floor and a door at each end of each side.", source: `${WP}IÉ_22000_Class` },
  ie29kCab: { model: "29000 Class", type: "Diesel multiple unit", builder: "CAF", built: "2002–2005", fleet: "29 four-car sets",
    topSpeedMph: kmh(121), powerHp: 400, seats: 185, lengthFt: 67.5,
    about: "Dublin's suburban railcar, used on the Northern and Western Commuter lines and Dublin–Rosslare. Seats are for the whole four-car set; the dark blue Commuter livery gave way to green in the 2010s.", source: `${WP}IÉ_29000_Class` },
  ie29k: { model: "29000 Class middle car", type: "Diesel multiple unit", builder: "CAF", built: "2002–2005", fleet: "29 four-car sets", topSpeedMph: kmh(121), powerHp: 400, lengthFt: 66.2,
    about: "A middle car of the CAF commuter railcar, with two pairs of sliding doors a side and its own engine.", source: `${WP}IÉ_29000_Class` },
  ie2600: { model: "2600 Class", type: "Diesel multiple unit", builder: "Tokyu Car", built: "1993", fleet: "8 two-car sets in service",
    topSpeedMph: kmh(120), seats: 130,
    about: "Cork's suburban railcars, on the lines to Cobh, Midleton and Mallow. They first ran on Dublin's Arrow service to Kildare in 1994.", source: `${WP}IÉ_2600_Class` },
  ie2800: { model: "2800 Class", type: "Diesel multiple unit", builder: "Tokyu Car", built: "2000", fleet: "10 two-car sets",
    topSpeedMph: kmh(120), powerHp: kw(260), seats: 85,
    about: "Railcars based at Limerick since the ICRs replaced them in Dublin: Limerick–Ennis–Galway, Nenagh, Ballybrophy and the Ballina branch.", source: `${WP}IÉ_2800_Class` },
  ie8100: { model: "DART 8100 Class", type: "Electric multiple unit", builder: "Linke-Hofmann-Busch, with GEC", built: "1983–1984",
    fleet: "38 two-car sets", topSpeedMph: kmh(100), seats: 64, lengthFt: 67.2,
    about: "The DART's original cars, a power car and a driving trailer in each set, refurbished in 2007–08. The Alstom X'Trapolis trains ordered for DART+ are to replace them from 2027.", source: `${WP}CIÉ_8100_Class` },
  ie8500Cab: { model: "DART 8500 Class driving trailer", type: "Electric multiple unit", builder: "Tokyu Car", built: "2000–2004 (8500, 8510, 8520 Classes)",
    fleet: "17 four-car sets", topSpeedMph: kmh(100), seats: 40, lengthFt: 67.4,
    about: "The newer DART sets, two power cars between two driving trailers; the 8520s were the first fully air-conditioned DART cars. Seats are a quarter of the set's 160.", source: `${WP}IÉ_8500_Class` },
  ie8500: { model: "DART 8500 Class power car", type: "Electric multiple unit", builder: "Tokyu Car", built: "2000–2004", fleet: "17 four-car sets",
    topSpeedMph: kmh(100), powerHp: kw(560), seats: 40, lengthFt: 68.1,
    about: "One of the two powered middle cars of a DART 8500, 8510 or 8520 set, each with its pantograph and four 140 kW motors.", source: `${WP}IÉ_8500_Class` },
  ieMk4: { model: "Mark 4 coach", type: "Passenger coach", builder: "CAF", built: "2004–2006", fleet: "67 cars in 8 sets",
    topSpeedMph: kmh(160), lengthFt: 77.6,
    about: "The Dublin–Cork push-pull sets: first class, a catering car and standard coaches behind a 201 Class, about 422 seats a train. Built for 200 km/h, they run at 160.", source: `${WP}Mark_4_(Iarnród_Éireann)` },
  ieMk4Cab: { model: "Mark 4 generator and control car", type: "Driving van trailer", builder: "CAF", built: "2004–2006", fleet: "8, one per set",
    topSpeedMph: kmh(160), lengthFt: 78.1,
    about: "The driving car at the Dublin end of a Mark 4 set, with the generator that powers the train's lights and heating, and luggage space.", source: `${WP}Mark_4_(Iarnród_Éireann)` },
  ieDd: { model: "De Dietrich Enterprise coach", type: "Passenger coach", builder: "De Dietrich Ferroviaire", built: "1996–1997",
    fleet: "28 cars, shared with NI Railways", topSpeedMph: kmh(145),
    about: "The Dublin–Belfast Enterprise's coaches, run jointly by Irish Rail and NI Railways and refurbished in 2007–09. Stadler electro-diesel FLIRTs are to replace them from about 2029.", source: `${WP}Enterprise_(train_service)` },
  ieDdCab: { model: "De Dietrich Enterprise driving trailer", type: "Driving trailer", builder: "De Dietrich Ferroviaire", built: "1996–1997",
    fleet: "28 Enterprise cars in all", topSpeedMph: kmh(145),
    about: "The cab car at the far end of an Enterprise set from its 201 Class locomotive.", source: `${WP}Enterprise_(train_service)` },
};
