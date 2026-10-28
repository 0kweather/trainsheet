// The other long-distance trains in Germany (scripts/railroads/germany.py,
// railroad "deld"): Flixtrain, ÖBB's railjets and Nightjets, SNCF's TGVs,
// Eurostar, the Czech, Polish, Swiss and Danish trains over the border,
// the night trains to Scandinavia, European Sleeper and GoVolta.
// Trainsheet's own side views, from published dimensions and recent
// photographs (Wikimedia Commons, 2024-2026), at the shared scale
// (js/carart.js), each in its operator's current paint, lettered here (no
// logo files). Where another railroad's file already draws a train as it
// runs here (checked against the same photographs), its drawing is reused.

import { coachCar, newId } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, poly, truck, pantograph, slats } from "../carart.js?v=dev";
import { euroLoco, letters, mark, hvac, buffers } from "./czechia.cars.js?v=dev";
import { roofCover, lamp, RED_LAMP } from "./digitraffic.cars.js?v=dev";
// Other railroads' drawings of the same trains, reused where they match
// this wave's photographs (each looked up by key, so a missing one is
// simply left out).
import * as CZ from "./czechia.cars.js?v=dev";
import * as CH from "./chintl.cars.js?v=dev";
import * as SN from "./sncf.cars.js?v=dev";
import * as NL from "./ns.cars.js?v=dev";
import * as SB from "./sbb.cars.js?v=dev";
import * as SJ from "./sesj.cars.js?v=dev";
import * as SBR from "./sbbregio.cars.js?v=dev";
import * as DBR from "./dbregio.cars.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const FT = 3.2808;
const M = (m) => n(m * FT);
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
const fit = (w) => `textLength="${n(w)}" lengthAdjust="spacingAndGlyphs"`;
// A word fitted to its measured width w, centered at (x, y), h tall.
const word = (c, x, y, h, text, fill, w, opts = {}) => letters(c, x, y, h, text, fill, { ...opts, extra: fit(w) });
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const horns = (x, roof) => rect(x, roof - 0.05, 1.3, 0.35, "currentColor") + rect(x + 0.15, roof + 0.3, 0.3, 0.3, "currentColor") + rect(x + 0.75, roof + 0.3, 0.3, 0.4, "currentColor");

// A body: its outline filled with the base color, the paint (drawn freely,
// clipped to the outline) shaded a little for depth as carmodels.js's
// bodies are, and the outline in the theme's ink.
function shell(d, base, paint) {
  const id = newId();
  const ys = d.match(/-?\d+(\.\d+)?/g).map(Number).filter((_, i) => i % 2 === 1);
  const lo = Math.min(...ys), hi = Math.max(...ys);
  const stop = (o, color, v, fallback) => `<stop offset="${o}" stop-color="${color}" stop-opacity="${fallback}" style="stop-opacity:var(${v},${fallback})"/>`;
  const shade = `<linearGradient id="${id}-s" gradientUnits="userSpaceOnUse" x1="0" y1="${lo}" x2="0" y2="${hi}">` +
    stop(0, "#000", "--car-shade-low", 0.16) + '<stop offset="0.36" stop-color="#000" stop-opacity="0"/>' +
    '<stop offset="0.55" stop-color="#fff" stop-opacity="0"/>' + stop(0.8, "#fff", "--car-shade-high", 0.1) +
    '<stop offset="0.93" stop-color="#fff" stop-opacity="0"/>' + stop(1, "#000", "--car-shade-roof", 0.08) + "</linearGradient>";
  return path(d, base) + `<clipPath id="${id}"><path d="${d}"/></clipPath><defs>${shade}</defs>` +
    `<g clip-path="url(#${id})">${paint}<rect x="-5" y="${lo}" width="240" height="${n(hi - lo)}" fill="url(#${id}-s)"/></g>` + path(d, "none", 0.8);
}
// The rubber gangway between two cars, from floor to top; side -1 at the
// left end, 1 at the right.
function gangway(xFace, side, floor, top) {
  const w = 0.8, x = side < 0 ? xFace : xFace - w;
  return rect(x, floor, w, top - floor, C.rubber, 0, 'rx="0.2"') + lines([[x + 0.27, floor + 0.3, x + 0.27, top - 0.3], [x + 0.54, floor + 0.3, x + 0.54, top - 0.3]], "#3a3f45", 0.6);
}
const ends = (c, floor, top) => (c.coupledL ? gangway(0, -1, floor, top) : "") + (c.coupledR ? gangway(c.L, 1, floor, top) : "");
const mirror = (c, draw) => `<g transform="matrix(-1 0 0 1 ${c.L} 0)">${draw({ ...c, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: c.coupledL })}</g>`;
// A window: dark glass in a black gasket, the sky in its upper part.
const glass = (a, b, y0, y1, r = 0.3) => rect(a, y0, b - a, y1 - y0, "#252b32", 0, `rx="${r}" stroke="#0c0d0f" stroke-width="0.5" vector-effect="non-scaling-stroke"`) +
  rect(a + 0.15, y0 + (y1 - y0) * 0.58, b - a - 0.3, (y1 - y0) * 0.3, "#3d4752", 0, 'rx="0.15" opacity="0.85"');
// Words leaning like ÖBB's railjet and nightjet lettering.
const italic = (c, x, y, h, text, fill, opts = {}) => `<g transform="translate(${n(x)} ${n(y)}) scale(${c.mirrored ? -1 : 1} -1) skewX(-12)"><text y="${n(h * 0.36)}" font-size="${n(h)}" text-anchor="${opts.anchor || "middle"}" ` +
  `font-weight="${opts.weight || 700}" font-family="${opts.family || SANS}" fill="${opts.stroke ? "none" : fill}"${opts.stroke ? ` stroke="${fill}" stroke-width="${n(h * 0.035)}"` : ""}${opts.w ? " " + fit(opts.w) : ""}>${text}</text></g>`;

// ---------- Pictograms (white line drawings) ----------
// A bicycle, h ft tall, centered at (x, y).
const bike = (c, x, y, h, color) => {
  const r = h * 0.3, sw = n(h * 0.08);
  return mark(c, x, y, `<g fill="none" stroke="${color}" stroke-width="${sw}"><circle cx="${n(-h * 0.5)}" cy="${n(h * 0.2)}" r="${n(r)}"/><circle cx="${n(h * 0.5)}" cy="${n(h * 0.2)}" r="${n(r)}"/>` +
    `<path d="M${n(-h * 0.5)} ${n(h * 0.2)}L${n(-h * 0.15)} ${n(-h * 0.25)}L${n(h * 0.3)} ${n(-h * 0.25)}L${n(h * 0.5)} ${n(h * 0.2)}M${n(-h * 0.15)} ${n(-h * 0.25)}L${n(0)} ${n(h * 0.2)}L${n(h * 0.3)} ${n(-h * 0.25)}M${n(-h * 0.25)} ${n(-h * 0.42)}L${n(-h * 0.05)} ${n(-h * 0.42)}"/></g>`);
};
// The wheelchair sign, h ft tall, centered at (x, y).
const wheelchair = (c, x, y, h, color) => mark(c, x, y, `<g fill="none" stroke="${color}" stroke-width="${n(h * 0.08)}"><circle cx="${n(-h * 0.05)}" cy="${n(h * 0.18)}" r="${n(h * 0.28)}"/>` +
  `<path d="M${n(-h * 0.12)} ${n(-h * 0.3)}L${n(-h * 0.12)} ${n(h * 0.02)}L${n(h * 0.25)} ${n(h * 0.02)}L${n(h * 0.38)} ${n(h * 0.42)}"/></g><circle cx="${n(-h * 0.12)}" cy="${n(-h * 0.45)}" r="${n(h * 0.08)}" fill="${color}"/>`);

// ---------- A UIC coach (26.4 m) ----------
// On carmodels.js's coachCar: two trucks 19 m apart, a door at each end;
// o.paint(c, L) inside the body, o.wins [[a, b, y0, y1], ...], o.doors
// [[x, w], ...], o.doorFill, o.over(c, L) over everything.
const COACH = { roof: 13.3, sill: 3.9 };
function coach(c, o) {
  const L = c.L, { roof, sill } = COACH;
  const doors = o.doors ?? [[1.5, 2.9], [L - 4.4, 2.9]];
  return coachCar(c, {
    roof, sill, end: 0.6, endR: 1.3, base: o.base, badge: false, under: true,
    trucks: { centers: 62.3, wb: 8.2, d: 36 }, diaphragm: [4.25, 11.8], rows: [],
    doors: [],
    livery: (cc) => o.paint(cc, L) +
      (o.wins || []).map(([a, b, y0, y1]) => rect(a, y0, b - a, y1 - y0, "#1c2127", 0, `rx="0.35" stroke="${o.frame || "#5d646b"}" stroke-width="0.7" vector-effect="non-scaling-stroke"`) +
        rect(a + 0.15, y0 + (y1 - y0) * 0.55, b - a - 0.3, (y1 - y0) * 0.35, "#46515c", 0, 'rx="0.15" opacity="0.85"')).join("") +
      doors.map(([x, w]) => rect(x, sill + 0.3, w, 7.0, o.doorFill || "none", 0, 'rx="0.25" stroke="rgba(0,0,0,0.42)" stroke-width="0.6" vector-effect="non-scaling-stroke"') +
        rect(x + w * 0.38, 7.3, w * 0.36, 3.0, C.glass, 0, 'rx="0.25"')).join(""),
    extra: (cc) => hvac(L / 2 - 7, roof, 14, 0.6) + [12, 24, L - 24, L - 12].map((x) => path(`M${x - 1.1} ${roof - 0.05}Q${x} ${roof + 0.6} ${x + 1.1} ${roof - 0.05}Z`, C.steelDark, 0.4)).join("") +
      rect(L / 2 - 3.5, sill - 1.9, 7, 0.75, C.steelDark, 0.4, 'rx="0.37"') + buffers(0, -1, { sill }) + buffers(L, 1, { sill }) + (o.over ? o.over(cc, L) : ""),
  });
}

// ===================== Flixtrain =====================
// Flixtrain (Flix SE): open-access trains, one class (some seats sold as
// comfort seats), locomotive-hauled, Hamburg/Berlin-Köln-Aachen (FLX 20,
// 30), Berlin-Frankfurt-Stuttgart-Basel (FLX 10), Hamburg-Berlin-Leipzig
// (FLX 35) and the rest. The Talgo 230 sets ordered in 2025 were first
// shown at InnoTrans in September 2026 and aren't running yet; the ex-DB
// Bpmmz coaches added in August 2026 aren't drawn (no photograph yet).
// The locomotive: Flix's own Siemens Vectron AC (193 4xx, from 2023;
// photographs: 193 449 at Frankfurt (Main) Süd 2026, 193 424 near Bebra
// 2026, 193 437 at Düsseldorf Flughafen 2025, 193 432 at Stadthagen 2026):
// Flix green all over, the cab's roof light gray, the frame dark gray;
// "FLiXTRAIN" big in white across the middle of the side, between the
// cab doors, half the side's height.
const FLX = { green: "#79cf1a", deep: "#5fb10c", frame: "#3c4044", roof: "#56595c", cap: "#d9dcde", band: "#2b2f33", letter: "#f6f7f5" };
const FLX_FONT = "Avenir Next, Montserrat, Helvetica Neue, Arial, sans-serif";
const flxWord = (c, x, y, h, w) => word(c, x, y, h, "FLiXTRAIN", FLX.letter, w, { weight: 600, family: FLX_FONT });
const NOSE_VECTRON = [[1.4, 4.1], [1.4, 7.3], ["q", 1.45, 8.3, 2.1, 9.0], [3.0, 12.3], ["q", 3.3, 12.9, 4.3, 12.9]];
const flxVectron = (c) => euroLoco(c, {
  roof: 12.9, sill: 4.1, nose: NOSE_VECTRON, rake: [[2.1, 9.0], [3.0, 12.3]], centers: 32.5, door: 5.6, surround: "#1d2024",
  paint: (cc, L) => rect(-1, 0, L + 2, 20, FLX.green) + rect(-1, 12.25, L + 2, 3, FLX.roof) + rect(-1, 0, L + 2, 4.75, FLX.frame) +
    // The light gray cap over the cab, down to the windshield's top.
    path("M-1 12.0L3.2 12.0Q4.4 12.2 5.6 12.95L-1 12.95Z", FLX.cap),
  over: (cc, L) => flxWord(cc, L * 0.505, 7.9, 4.1, L * 0.48) + letters(cc, L * 0.5, 4.45, 0.4, "91 80 6193 4", "#e8eaec", { weight: 500 }),
  grilles: [],
});

// The coaches: ex-InterRegio cars rebuilt by Talbot for Flixtrain (Bmmz
// 264, Bmmdz 268; 26.4 m, a folding door at each end; photographs: the
// Lombardsbrücke in Hamburg 2025, Leipzig Hbf, Mannheim Hbf 2026). Green,
// the roof light gray; the windows in a dark band from door to door, a
// half-width window at each end of it; "FLiXTRAIN" low in white, twice on
// a plain car (a third along from each end), once on the car with the
// wheelchair places (with the sign by its door) and on the bicycle car
// (the bicycle by its door).
const flxPaint = (cc, L) => bands(L, [[0, 20, FLX.green], [11.75, 3, "#cfd3d5"], [0, 4.1, FLX.frame]]) + rect(5.0, 6.3, L - 10.0, 4.0, "#34393e", 0, 'rx="0.2"');
const flxWins = (L, xs) => [[5.9, 8.5, 6.95, 9.95], ...xs.map((x) => [x, x + 3.9, 6.95, 9.95]), [L - 8.5, L - 5.9, 6.95, 9.95]];
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => n(from + i * pitch));
const flxCoach = (c) => coach(c, { base: FLX.green, paint: flxPaint, wins: flxWins(c.L, seq(10.3, 5.79, 12)), doorFill: FLX.green,
  over: (cc, L) => flxWord(cc, 24.2, 5.3, 1.5, 11.3) + flxWord(cc, 64.6, 5.3, 1.5, 11.3) });
const flxCoachW = (c) => coach(c, { base: FLX.green, paint: flxPaint, wins: flxWins(c.L, [...seq(11.1, 6.95, 5), ...seq(45.2, 5.75, 6)].map((x) => x)), doorFill: FLX.green,
  over: (cc, L) => wheelchair(cc, 7.6, 5.4, 2.0, FLX.letter) + flxWord(cc, 24.6, 5.3, 1.5, 11.3) });
const flxCoachB = (c) => coach(c, { base: FLX.green, paint: flxPaint, wins: flxWins(c.L, seq(10.3, 5.79, 12)), doorFill: FLX.green,
  over: (cc, L) => flxWord(cc, 62.0, 5.3, 1.5, 11.3) + bike(cc, L - 10.0, 5.3, 1.5, FLX.letter) });


// ===================== ÖBB: railjet, second generation =====================
// Siemens Viaggio Comfort "railjet 2" (ÖBB, nine-car sets since April 2024
// on München-Innsbruck-Verona/Bologna/Venezia, the RJ 80-89 and 1281-1289;
// de.wikipedia "Railjet 2. Generation"): from the locomotive car 261
// (first and business), 262 (first and business, Ampz 73 81 19-91 2xx),
// 263 (restaurant and economy, BRmpz 85-91 3xx), 264-268 (economy, 264
// with the wheelchair and bicycle places) and the driving trailer 269
// (80-91 9xx); 26.5 m cars with a low floor between the trucks, the
// windows over the trucks high, those in the middle low. Hauled by an ÖBB
// Vectron (1293) or Taurus.
// The paint (photographs: Ampz 19-91 203 and BRmpz 85-91 303 side-on at
// Salzburg 2024, the set at Kufstein 2024 and München Hbf/Ost 2025): the
// railjet's carmine over a bright vermilion stripe, dark grey below, a
// light grey fairing under the low floor; the doors framed in light grey,
// a black placard with the class numeral in each; "railjet" big in
// white-outlined italics above the low windows, the class in small red
// italics ("first", "business", "economy", "restaurant"), ÖBB in red at
// one end; the roof dark grey.
const RJ2 = { red: "#d0101f", stripe: "#f0391f", dark: "#323437", skirt: "#d3d6d8", roof: "#2e3033", frame: "#dfe2e4", text: "#e8361c", band: "#16181b" };
const RJ2C = { roof: 13.4, sill: 3.4, eave: 12.1, st: [6.1, 7.35], hi: [6.5, 9.45], lo: [4.7, 7.5], drop: [16.4, 68.8, 1.0] };
// The body: outline (a low floor from drop a to b, down to y), paint.
function rj2Body(c, { drop = RJ2C.drop, cab = false } = {}) {
  const L = c.L, R = RJ2C.roof, S = RJ2C.sill, x1 = L - 0.45, [da, db, dy] = drop;
  const low = `L${n(da - 0.9)} ${S}Q${n(da)} ${S} ${n(da + 0.4)} ${n(S - 0.8)}L${n(da + 1.2)} ${dy}L${n(db - 1.2)} ${dy}L${n(db - 0.4)} ${n(S - 0.8)}Q${n(db)} ${S} ${n(db + 0.9)} ${S}`;
  const F = 2.1;
  const d = cab ? `M${F} 3.0${low.replace(/^L[^L]*/, "")}`.replace(`M${F} 3.0`, `M${F} 3.0L${n(da - 0.9)} 3.0`) : "";
  const outline = cab
    ? `M${F} ${S}${low}L${n(x1)} ${S}L${n(x1)} ${n(R - 1.0)}Q${n(x1)} ${R} ${n(x1 - 1.0)} ${R}L${F + 9.8} ${R}Q${F + 4.6} ${R} ${F + 2.4} 11.4L${F + 0.9} 9.6Q${F + 0.2} 8.4 ${F} 7.2Z`
    : `M0.45 ${S}${low}L${n(x1)} ${S}L${n(x1)} ${n(R - 1.0)}Q${n(x1)} ${R} ${n(x1 - 1.0)} ${R}L1.45 ${R}Q0.45 ${R} 0.45 ${n(R - 1.0)}Z`;
  let paint = rect(-1, 0, L + 2, 20, RJ2.red) + rect(-1, RJ2C.eave, L + 2, 3, RJ2.roof) + rect(-1, 0, L + 2, RJ2C.st[0], RJ2.dark) +
    rect(-1, RJ2C.st[0], L + 2, RJ2C.st[1] - RJ2C.st[0], RJ2.stripe) +
    // The fairing under the low floor, its ends slanting up to the trucks.
    path(`M${n(da + 0.2)} ${n(S - 0.2)}L${n(da + 1.8)} 3.3L${n(db - 1.8)} 3.3L${n(db - 0.2)} ${n(S - 0.2)}L${n(db)} 0L${n(da)} 0Z`, RJ2.skirt);
  if (cab) {
    // The cab end: the stripe sweeps down to the front's foot, dark grey
    // within the sweep; the front below the windshield dark grey.
    paint += path(`M${F + 25} ${RJ2C.st[1]}L${F + 20.5} ${RJ2C.st[1]}C${F + 14} 7.0 ${F + 9} 5.6 ${F + 4.4} 3.6L${F + 4.0} 0L${F + 25} 0Z`, RJ2.stripe) +
      path(`M${F + 25} ${RJ2C.st[0]}L${F + 20.3} ${RJ2C.st[0]}C${F + 15.5} 5.6 ${F + 12.8} 4.6 ${F + 10.6} 3.2L${F + 10.2} 0L${F + 25} 0Z`, RJ2.dark) +
      rect(-1, 0, F + 1.0, 4.2, RJ2.dark) + rect(-1, RJ2C.eave, F + 11, 3, RJ2.red);
  }
  return shell(outline, RJ2.red, paint);
}
// A door: the light grey frame, the leaf in the body's paint (the frame
// drawn as an outline over it), the class placard; low (to the low floor)
// in the middle, high at an end.
const rj2Door = (c, x, cls, low = true) => {
  const y0 = low ? 1.15 : RJ2C.sill + 0.05, w = 6.4, t = 0.55;
  return rect(x + t, y0, w - 2 * t, 10.75 - t - y0, "#3a3c40") +
    path(`M${n(x)} ${y0}L${n(x)} 10.75L${n(x + w)} 10.75L${n(x + w)} ${y0}L${n(x + w - t)} ${y0}L${n(x + w - t)} ${10.75 - t}L${n(x + t)} ${10.75 - t}L${n(x + t)} ${y0}Z`, RJ2.frame, 0, 'stroke="rgba(0,0,0,0.25)" stroke-width="0.4" vector-effect="non-scaling-stroke"') +
    line(x + w / 2, y0 + 0.1, x + w / 2, 10.1, "rgba(0,0,0,0.35)", 0.5) +
    rect(x + w / 2 - 0.85, 7.9, 1.7, 1.8, "#141517", 0, 'rx="0.25"') + letters(c, x + w / 2, 8.8, 1.05, cls, "#ffffff", { weight: 700 });
};
// A band of windows: [a, b] the band, xs [[x0, x1], ...] the panes.
const rj2Band = ([y0, y1], a, b, panes) => rect(a, y0 - 0.15, b - a, y1 - y0 + 0.3, RJ2.band, 0, 'rx="0.3"') + panes.map(([p, q]) => glass(p, q, y0, y1)).join("");
const rj2Word = (c, x, y, text, h = 0.75) => italic(c, x, y, h, text, RJ2.text, { weight: 600 });
const rj2Running = (c, drop = RJ2C.drop) => {
  const L = c.L, b1 = L / 2 - 31.17, b2 = L / 2 + 31.17;
  return truck(b1, { wb: 8.53, d: 36.2, top: RJ2C.sill }) + truck(b2, { wb: 8.53, d: 36.2, top: RJ2C.sill }) +
    buffers(0, -1, { sill: RJ2C.sill + 0.6, beam: 2.4, y: 3.45 }) + buffers(L, 1, { sill: RJ2C.sill + 0.6, beam: 2.4, y: 3.45 }) +
    roofCover(L / 2 - 14, RJ2C.roof, 12, 0.45, "#3a3d41", 3) + roofCover(L / 2 + 3, RJ2C.roof, 9, 0.45, "#3a3d41", 2) + ends(c, 4.0, RJ2C.roof - 1.0);
};
// The cars, measured from the photographs (feet from the left end): the
// high windows in pairs over each truck, the low ones between, the door
// at the right end of the low floor; o.cls the numeral, o.words the
// class lettering [[x, text]], o.rj ["railjet" center, width].
function rj2Car(c, o) {
  const L = c.L;
  let s = rj2Body(c);
  s += rj2Band(RJ2C.hi, 6.75, 17.95, [[6.9, 12.95], [13.2, 17.8]]) + rj2Band(RJ2C.hi, 69.35, 80.3, [[69.5, 75.4], [75.6, 80.15]]);
  const lo = o.lo || [[22.8, 28.7], [28.95, 34.85], [35.2, 39.85], [41.4, 46.15], [47.6, 52.3]];
  s += rj2Band(RJ2C.lo, lo[0][0] - 0.15, lo[lo.length - 1][1] + 0.15, lo);
  s += rj2Door(c, 60.4, o.cls);
  s += obbLogo(c, 3.0, 9.1, 0.8, RJ2.stripe);
  s += italic(c, o.rj[0], 9.35, 3.0, "railjet", "#ffffff", { weight: 400, stroke: true, w: o.rj[1] });
  for (const [x, text, y = 5.35] of o.words) s += rj2Word(c, x, y, text);
  return s + rj2Running(c);
}
// The driving trailer (car 269), the cab at the left: a Vectron-like
// front, the windows in one high band behind the door, the stripe swept
// down to the front's foot.
function rj2Cab(c) {
  const L = c.L, F = 2.1, R = RJ2C.roof;
  let s = rj2Body(c, { cab: true, drop: [30.5, 68.8, 1.0] });
  // The windshield and the cab's side window in their black surround.
  s += path(`M${F + 0.25} 8.0L${F + 0.95} 9.7L${F + 2.6} 11.6Q${F + 4.6} ${R - 0.05} ${F + 9.6} ${R - 0.05}L${F + 7.0} 11.2L${F + 7.0} 8.0Z`, RJ2.band) +
    glass(F + 4.9, F + 6.6, 8.3, 10.7) + path(`M${F + 1.3} 9.8L${F + 3.4} 12.2L${F + 4.3} 12.3L${F + 2.1} 9.8Z`, "#3b444e");
  s += rj2Door(c, F + 15.4, "2", false);
  s += mark(c, F + 13.8, 10.3, `<text x="-0.1" y="0.2" font-size="0.6" text-anchor="end" font-weight="800" font-family="${SANS}" fill="#ffffff">ÖBB</text>` +
    `<text x="0" y="0.2" font-size="0.62" text-anchor="start" font-weight="700" font-style="italic" font-family="${SANS}" fill="#ffffff">railjet</text>`);
  const panes = Array.from({ length: 8 }, (_, i) => [F + 25.4 + i * 6.95, F + 31.4 + i * 6.95]);
  s += rj2Band(RJ2C.hi, F + 25.2, F + 81.2, panes);
  s += rj2Word(c, F + 30.0, 5.35, "economy") + italic(c, 60.0, 4.6, 2.2, "railjet", "#ffffff", { weight: 400, stroke: true, w: 11.0 });
  s += rect(F - 0.2, 1.6, 2.6, 2.6, "#2b2e33") + lamp(F + 0.15, 5.0, 0.4, 0.5) + lamp(F + 0.15, 4.45, 0.38, 0.3, RED_LAMP) +
    rect(F + 6.0, R - 0.05, 1.4, 0.3, "currentColor") + rect(F + 6.2, R + 0.25, 0.35, 0.35, "currentColor");
  const b1 = L / 2 - 31.17, b2 = L / 2 + 31.17;
  return s + truck(b1, { wb: 8.53, d: 36.2, top: RJ2C.sill }) + truck(b2, { wb: 8.53, d: 36.2, top: RJ2C.sill }) +
    buffers(0, -1, { sill: 4.0, beam: 2.4, y: 3.45, end: F + 0.1 }) + buffers(L, 1, { sill: RJ2C.sill + 0.6, beam: 2.4, y: 3.45 }) +
    roofCover(L / 2 - 6, R, 12, 0.45, "#3a3d41", 3) + ends({ ...c, coupledL: false }, 4.0, R - 1.0);
}
const RJ2_CARS = {
  // 261 and 262: first and business.
  First: { cls: "1", rj: [39.6, 14.0], words: [[16.9, "first"], [79.6, "business", 5.75]] },
  // 263: the restaurant, economy at one end.
  Bistro: { cls: "2", lo: [[23.25, 27.8], [29.4, 34.1]], rj: [46.6, 21.4], words: [[15.9, "economy"], [54.8, "restaurant", 5.2]] },
  // 264-268: economy.
  Economy: { cls: "2", rj: [39.6, 14.0], words: [[16.4, "economy"], [79.2, "economy", 5.75]] },
};

// ÖBB's mark: the O with its stroke rising through the top right (the
// umlaut), then BB, all bold; h the letters' height, centered at (x, y).
const obbLogo = (c, x, y, h, fill) => mark(c, x, y, `<g transform="translate(${n(-0.98 * h)} 0)"><ellipse cx="0" cy="0" rx="${n(0.4 * h)}" ry="${n(0.42 * h)}" fill="none" stroke="${fill}" stroke-width="${n(0.17 * h)}"/>` +
  `<path d="M${n(-0.02 * h)} ${n(-0.12 * h)}L${n(0.24 * h)} ${n(-0.66 * h)}L${n(0.42 * h)} ${n(-0.66 * h)}L${n(0.14 * h)} ${n(-0.08 * h)}Z" fill="${fill}"/></g>` +
  `<text x="${n(-0.5 * h)}" y="${n(0.36 * h)}" font-size="${n(h * 1.0)}" font-weight="800" font-family="${SANS}" fill="${fill}" text-anchor="start" ${fit(1.38 * h)}>BB</text>`);
// ÖBB's Siemens Vectron (1293, 2019 on; photographs: 1293 at Kufstein 2024
// with the railjet 2, 1293 051 2025): traffic red, the lower body and frame
// dark grey, the roof grey; ÖBB in big white letters toward one end.
const obbVectron = (c) => euroLoco(c, {
  roof: 12.9, sill: 4.1, nose: NOSE_VECTRON, rake: [[2.1, 9.0], [3.0, 12.3]], centers: 32.5, door: 5.6, surround: "#1d2024",
  paint: (cc, L) => rect(-1, 0, L + 2, 20, "#e2231a") + rect(-1, 12.25, L + 2, 3, "#5a5e63") + rect(-1, 0, L + 2, 5.35, "#3a3d42"),
  over: (cc, L) => obbLogo(cc, L * 0.43, 8.65, 5.9, "#f4f4f2") + letters(cc, L * 0.5, 4.75, 0.45, "1293", "#e8eaec", { weight: 600 }),
  grilles: [],
});


// ===================== DSB =====================
// (Each of the next two sections in its own scope; its types are merged
// into TYPES and MODELS below.)
const DSB = (() => {
// DSB's trains in Germany (for deld.cars.js): the EB (Siemens Vectron),
// the Talgo 230 "DSB EC" sets on the ECE Hamburg-Padborg-København, and
// the IC3 (MF) diesel sets on the IC Flensburg-Padborg-Fredericia/Aarhus.
// Trainsheet's own side views at the shared scale, from published
// dimensions and photographs on Wikimedia Commons (2026), lettered here.


const DK = { red: "#d5121e", grey: "#5d6267", roof: "#6b7075", frame: "#3a3d41", band: "#16181b", door: "#d6d9dc", white: "#f6f6f4" };

// DSB's mark: "DSB" in a hexagon with rounded corners, flat top and
// bottom, pointed at the sides; h ft tall. On the red body in white
// outline; on a dark ground (or the IC3's black front) filled red.
function dsbLogo(c, x, y, h, { fill = "none", stroke = DK.white, text = DK.white } = {}) {
  const w = h * 1.22, a = w * 0.27, k = h * 0.09;
  const d = `M${n(-a)} ${n(-h / 2)}L${n(a)} ${n(-h / 2)}Q${n(a + k)} ${n(-h / 2)} ${n(a + 2 * k)} ${n(-h / 2 + k * 1.6)}L${n(w / 2 - k * 0.6)} ${n(-k)}Q${n(w / 2)} 0 ${n(w / 2 - k * 0.6)} ${n(k)}` +
    `L${n(a + 2 * k)} ${n(h / 2 - k * 1.6)}Q${n(a + k)} ${n(h / 2)} ${n(a)} ${n(h / 2)}L${n(-a)} ${n(h / 2)}Q${n(-a - k)} ${n(h / 2)} ${n(-a - 2 * k)} ${n(h / 2 - k * 1.6)}` +
    `L${n(-w / 2 + k * 0.6)} ${n(k)}Q${n(-w / 2)} 0 ${n(-w / 2 + k * 0.6)} ${n(-k)}L${n(-a - 2 * k)} ${n(-h / 2 + k * 1.6)}Q${n(-a - k)} ${n(-h / 2)} ${n(-a)} ${n(-h / 2)}Z`;
  return mark(c, x, y, `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${n(h * 0.07)}"/>` +
    `<text y="${n(h * 0.15)}" font-size="${n(h * 0.42)}" text-anchor="middle" font-weight="700" font-family="${SANS}" fill="${text}">DSB</text>`);
}

// ===================== DSB EB (Siemens Vectron) =====================
// Siemens Vectron AC/MS, DSB class EB 3201-3242 (2020 on; photographs: EB
// 3214 at Padborg 2026, EB 3219 and 3234 at Hedehusene 2026, EB 3227 at
// Østre Anlæg 2026): DSB red, the cab's hood dark grey down to the
// windshield's foot and back to the cab door, the roof grey, the frame dark
// grey; the white-outlined DSB mark on each cab door and on the nose, "EB
// 32xx" small in white low in the middle.
const ebVectron = (c) => euroLoco(c, {
  roof: 12.9, sill: 4.1, nose: NOSE_VECTRON, rake: [[2.1, 9.0], [3.0, 12.3]], centers: 32.5, door: 5.6, surround: "#1d2024",
  paint: (cc, L) => rect(-1, 0, L + 2, 20, DK.red) + rect(-1, 11.3, L + 2, 3, DK.grey) + rect(-1, 0, L + 2, 5.25, DK.frame) +
    path("M-1 8.8L4.1 8.8Q4.9 8.8 5.05 9.5L5.35 11.35L-1 11.35Z", DK.grey),
  over: (cc, L) => dsbLogo(cc, 6.55, 7.6, 1.2) + dsbLogo(cc, L - 6.55, 7.6, 1.2),
  grilles: [],
});

// ===================== DSB EC (Talgo 230) =====================
// Talgo 230 for DSB ("DSB EC", sets 0401-0416, in service on the ECE
// Hamburg-København since November 2025, all its trains since May 2026;
// de.wikipedia "Talgo 230", ing.dk 2026: 209 m, 15 cars, 492 seats):
// articulated single-deck cars, about 13.1 m long, on Talgo's single
// axles at each joint, the floor 760 mm up; an end car (Bpd 01xx) at each
// end, its outer part over an ordinary bogie and with a raised floor, its
// door at the step down and the bicycle and pram places beyond; second
// class (Bp 03xx, Bpt 02xx) and first class (Apt 06xx) between. In 2026
// they run with an EB at each end (the control cars come later).
// The paint (photographs: Bpd 0102 at Hamburg Hbf 2026, set 0406 at
// København H 2026, 0403 at Hedehusene and 0407 at Østre Anlæg 2026,
// Odense 2026): DSB red, the roof grey, the windows in one black band
// (higher over the end car's raised part), light grey doors with a dark
// window and the destination display; DSB's mark by each door, red with
// white lettering on the black band or white-outlined on the red; the
// pram and bicycle pictograms in white over the bicycle area; first class
// "First class  1. Klasse  DSB 1'" repeated in small white letters along
// the top of the band.
const TG = { roof: 12.4, eave: 11.3, sill: 2.0, low: [4.4, 7.15], high: [6.1, 11.0], highSill: 3.6, wheel: 34.6 };
// The joints: a Talgo axle (one wheel each side, its half under each car)
// and the running gear's dark housing.
const joint = (x) => {
  const r = TG.wheel / 24;
  return circle(x, r, r, "currentColor") + circle(x, r, r * 0.8, "none", 0, `stroke="${C.steelDark}" stroke-width="0.5" vector-effect="non-scaling-stroke"`) + circle(x, r, r * 0.25, C.steelDark) +
    rect(x - 1.3, 2.2, 2.6, 1.1, "currentColor", 0, 'opacity="0.85"');
};
// A door: light grey, a dark window, the display at its top.
const tgDoor = (x, y0, w = 2.9) => rect(x, y0, w, 9.6 - y0, DK.door, 0, 'rx="0.2" stroke="rgba(0,0,0,0.35)" stroke-width="0.5" vector-effect="non-scaling-stroke"') +
  rect(x + 0.55, 4.9, w - 1.1, 3.0, "#24282d", 0, 'rx="0.2"') + rect(x + 0.55, 8.25, w - 1.1, 0.95, "#1b1d20", 0, 'rx="0.12"') + rect(x + 0.75, 8.5, w - 1.5, 0.3, "#e8eef4", 0, 'opacity="0.7"');
const band = ([y0, y1], a, b) => rect(a, y0, b - a, y1 - y0, DK.band, 0, 'rx="0.3"');
const panes = ([y0, y1], xs, w) => xs.map((x) => glass(x, x + w, y0 + 0.25, y1 - 0.25, 0.45)).join("");
// The body outline from x0 to x1: its foot at TG.sill, rising at each
// joint end over the Talgo axle; o.high: the raised end part [x0, x1].
function tgOutline(L, { highTo = 0 } = {}) {
  const R = TG.roof, S = TG.sill, x0 = 0.4, x1 = L - 0.4;
  const foot = highTo
    ? `M${x0} ${TG.highSill}L${n(highTo - 1.2)} ${TG.highSill}Q${n(highTo - 0.3)} ${TG.highSill} ${n(highTo)} ${n(S + 0.6)}Q${n(highTo + 0.2)} ${S} ${n(highTo + 0.9)} ${S}`
    : `M${x0} 3.3L${x0 + 1.9} 3.3Q${x0 + 2.5} 3.3 ${x0 + 2.6} ${S + 0.6}Q${x0 + 2.7} ${S} ${x0 + 3.3} ${S}`;
  return foot + `L${n(x1 - 3.3)} ${S}Q${n(x1 - 2.7)} ${S} ${n(x1 - 2.6)} ${S + 0.6}Q${n(x1 - 2.5)} 3.3 ${n(x1 - 1.9)} 3.3L${n(x1)} 3.3` +
    `L${n(x1)} ${n(R - 1.2)}Q${n(x1)} ${R} ${n(x1 - 1.3)} ${R}L${x0 + 1.3} ${R}Q${x0} ${R} ${x0} ${n(R - 1.2)}Z`;
}
const tgPaint = (L) => rect(-1, 0, L + 2, 20, DK.red) + rect(-1, TG.eave, L + 2, 3, DK.roof) + rect(-1, 0, L + 2, 2.75, "#4a4e53");
// The first-class lettering along the band's top, from a to b.
function firstWords(c, a, b) {
  const unit = ["First class", "1. Klasse", "DSB 1′"], w = [3.55, 2.95, 2.3], gap = 1.0;
  let s = "", x = a;
  for (let i = 0; x < b - 2.5; i++) {
    const k = i % 3;
    if (x + w[k] > b) break;
    s += letters(c, x + w[k] / 2, TG.low[1] + 0.48, 0.62, unit[k], DK.white, { weight: 600 });
    x += w[k] + gap;
  }
  return s;
}
// An intermediate car, the joint at each end; o.cls "1" or "2".
function tgCar(c, o) {
  const L = c.L;
  const d = tgOutline(L);
  let p = tgPaint(L);
  const first = o.cls === "1";
  p += band(TG.low, 6.0, L - 0.2);
  p += first ? panes(TG.low, [6.6, 13.8, 21.0, 28.2, 35.4], 5.2) : panes(TG.low, [6.5, 12.5, 18.5, 24.5, 30.5, 36.5], 4.4);
  p += tgDoor(2.6, 2.35);
  if (first) p += firstWords(c, 6.4, L - 0.8);
  let s = joint(0) + joint(L) + shell(d, DK.red, p);
  s += dsbLogo(c, 1.55, 5.8, 1.2);
  s += roofCover(1.2, TG.roof, 8.0, 0.55, "#7b8086", 3);
  return s + ends(c, 3.0, TG.roof - 1.0);
}
// The end car, its outer end (and the locomotive) at the left.
function tgEnd(c) {
  const L = c.L, hi = 21.0;
  const d = tgOutline(L, { highTo: hi });
  let p = tgPaint(L) + rect(-1, 0, hi + 0.5, TG.highSill + 0.45, "#4a4e53");
  p += band(TG.high, 1.6, hi + 0.2) + panes(TG.high, [2.2, 7.5, 12.8], 4.7) + glass(17.9, 18.9, TG.high[0] + 0.25, TG.high[1] - 0.25, 0.4);
  p += band(TG.low, 24.8, L - 0.2) + panes(TG.low, [25.6, 32.6, 39.6, 46.6, 53.6], 5.0);
  p += tgDoor(hi + 0.6, 2.35);
  // The pram and the bicycle over the first windows.
  p += mark(c, 27.4, 8.35, `<g fill="none" stroke="${DK.white}" stroke-width="0.12"><path d="M-0.75 -0.5L0.55 -0.5Q0.55 0.25 -0.1 0.25L-0.75 0.25ZM-0.75 -0.5L-0.75 -0.75L-0.95 -0.75M0.55 -0.5Q0.55 -1.05 0 -1.05L0 -0.5"/>` +
    `<circle cx="-0.55" cy="0.62" r="0.22"/><circle cx="0.3" cy="0.62" r="0.22"/></g>`) + bike(c, 30.9, 8.25, 1.55, DK.white);
  let s = joint(L) + shell(d, DK.red, p);
  s += dsbLogo(c, 20.0, 7.0, 1.25, { fill: DK.red, stroke: DK.red });
  s += truck(11.2, { wb: 8.2, d: 36, top: TG.highSill }) + buffers(0, -1, { sill: TG.highSill + 0.4, beam: 2.6, y: 3.45, end: 0.4 });
  s += roofCover(19.0, TG.roof, 10.0, 0.6, "#7b8086", 4);
  return s + ends({ ...c, coupledL: false }, 3.0, TG.roof - 1.0);
}

// ===================== DSB IC3 (MF) =====================
// ABB Scandia IC3 (DSB class MF: MFA + FF + MFB, 1989-1993; de.wikipedia
// "DSB MF": 20.54 + 17.74 + 20.54 m, 58.82 m over the couplers, 3.85 m
// tall, the floor 1.30 m up, the cars on four trucks, two of them shared):
// the IC between Flensburg, Padborg and Fredericia/Aarhus, often two or
// three sets coupled, their rubber fronts pressed together. The paint
// (photographs: IC3 5085 at Ringsted, 5018 at Herning, 5040 at Hedehusene,
// 5085 at Østerport, 2026): the unpainted aluminium sides ribbed along
// their length, a dark navy band through the windows, the roof dark grey;
// the black rubber front all round the cab end with DSB's mark in red on
// it; a fine yellow line over first class's windows by the cab; grey plug
// doors behind the cab and at the inner end, a red stripe beside the inner
// one.
const IC = { roof: 12.6, sill: 3.6, band: [6.4, 9.55], al: "#c3c7cb", navy: "#1f2a44", rubber: "#1b1c1e", wheel: 36 };
function icBody(c, { cab, L }) {
  const R = IC.roof, S = IC.sill, x0 = cab ? 1.5 : 0.4, x1 = L - 0.4;
  const d = `M${x0} ${S}L${n(x1)} ${S}L${n(x1)} ${n(R - 1.1)}Q${n(x1)} ${R} ${n(x1 - 1.2)} ${R}L${n(x0 + 1.2)} ${R}Q${x0} ${R} ${x0} ${n(R - 1.1)}Z`;
  let p = rect(-1, 0, L + 2, 20, IC.al) + rect(-1, 11.4, L + 2, 3, "#5b6065");
  // The ribs, below the band and above it.
  const segs = [];
  for (let y = S + 0.4; y < IC.band[0] - 0.1; y += 0.32) segs.push([-1, y, L + 1, y]);
  for (let y = IC.band[1] + 0.3; y < 11.3; y += 0.32) segs.push([-1, y, L + 1, y]);
  p += lines(segs, "rgba(0,0,0,0.12)", 0.4) + rect(-1, IC.band[0], L + 2, IC.band[1] - IC.band[0], IC.navy) + rect(-1, S, L + 2, 0.45, "#7d8287");
  return { d, p };
}
const icDoor = (x) => rect(x, IC.sill + 0.25, 2.8, 7.9, "#b6bbc0", 0, 'rx="0.6" stroke="rgba(0,0,0,0.4)" stroke-width="0.5" vector-effect="non-scaling-stroke"') +
  rect(x + 0.55, 7.0, 1.7, 3.3, "#262b31", 0, 'rx="0.7"');
const icWins = (xs, w) => xs.map((x) => glass(x, x + w, IC.band[0] + 0.15, IC.band[1] - 0.1, 0.55)).join("");
// An end car (MFA with first class, MFB), the cab at the left: the rubber
// front, the door behind it; the inner door at the right end.
function icEnd(c, first) {
  const L = c.L, { d, p: base } = icBody(c, { cab: true, L });
  let p = base + icWins([7.4, 12.6, 17.8, 23.0, 28.2, 33.4, 38.6, 43.8, 49.0, 54.2], 4.5);
  p += icDoor(2.6) + icDoor(L - 4.2) + rect(L - 4.9, IC.band[0], 0.55, IC.band[1] - IC.band[0], "#d0202c");
  if (first) p += rect(7.6, IC.band[1] + 0.32, 25.0, 0.12, "#e3b632");
  let s = shell(d, IC.al, p);
  // The rubber front: a thick black frame round the cab end, from the
  // coupler to over the roof.
  s += path(`M0 2.5L3.1 2.5L3.1 ${IC.roof + 0.2}Q3.1 ${IC.roof + 0.7} 2.3 ${IC.roof + 0.7}L1.1 ${IC.roof + 0.7}Q0 ${IC.roof + 0.7} 0 ${IC.roof - 0.6}Z`, IC.rubber, 0.5);
  s += line(2.3, 2.8, 2.3, IC.roof - 0.1, "#34373b", 0.6) + dsbLogo(c, 1.3, 5.6, 0.95, { fill: DK.red, stroke: DK.red }) + lamp(0.1, 4.6, 0.4, 0.45) + lamp(0.1, 4.05, 0.38, 0.3, RED_LAMP);
  s += dsbLogo(c, L - 6.0, 5.0, 0.7, { fill: DK.red, stroke: DK.red });
  s += truck(10.0, { wb: 8.2, d: IC.wheel, top: IC.sill }) + truck(L, { wb: 8.2, d: IC.wheel, top: IC.sill });
  s += roofCover(14, IC.roof, 9, 0.5, "#6f747a", 3);
  return s + ends({ ...c, coupledL: false }, 4.0, IC.roof - 1.0);
}
function icMid(c) {
  const L = c.L, { d, p: base } = icBody(c, { cab: false, L });
  const p = base + icWins([2.9, 8.1, 13.3, 18.5, 23.7, 28.9, 34.1, 39.3, 44.5, 49.7], 4.5);
  let s = shell(d, IC.al, p) + truck(0, { wb: 8.2, d: IC.wheel, top: IC.sill }) + truck(L, { wb: 8.2, d: IC.wheel, top: IC.sill });
  s += roofCover(L / 2 - 6, IC.roof, 12, 0.5, "#6f747a", 3);
  return s + ends(c, 4.0, IC.roof - 1.0);
}



// DSB's types and models
const Mo = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const turned = (m) => ({ ...m, oneEnd: false, draw: (c) => mirror(c, m.draw) });
const TYPES = {
  dkEb: { name: "DSB EB (Siemens Vectron) electric locomotive", kind: "electric", pan: true },
  dkEcEnd: { name: "DSB EC (Talgo 230) end car with bicycle places (Bpd)", kind: "coach", amenities: ["bikes"] },
  dkEcFirst: { name: "DSB EC (Talgo 230) first-class car (Apt)", kind: "coach", amenities: ["first"] },
  dkEcSecond: { name: "DSB EC (Talgo 230) second-class car (Bp)", kind: "coach" },
  dkMfa: { name: "DSB IC3 end car with first class (MFA)", kind: "emu", amenities: ["first"] },
  dkFf: { name: "DSB IC3 middle car (FF)", kind: "emu" },
  dkMfb: { name: "DSB IC3 end car (MFB)", kind: "emu" },
};
const MODELS = {
  dkEb: Mo(ebVectron, M(18.98)),
  dkEcEnd: Mo(tgEnd, M(19.0)),
  dkEcFirst: Mo((c) => tgCar(c, { cls: "1" }), M(13.14)),
  dkEcSecond: Mo((c) => tgCar(c, { cls: "2" }), M(13.14)),
  dkMfa: Mo((c) => icEnd(c, true), M(20.54), true),
  dkFf: Mo(icMid, M(17.74)),
  dkMfb: Mo((c) => icEnd(c, false), M(20.54), true),
};
for (const k of ["dkEcEnd", "dkEcFirst", "dkEcSecond", "dkMfa", "dkMfb"]) { TYPES[`${k}R`] = { ...TYPES[k] }; MODELS[`${k}R`] = turned(MODELS[k]); }

// DSB's typical trains
const set = (label, ...units) => ({ label, units });
// The order of the cars as photographed on set 0406 at København H (2026):
// the end cars, first class next to one of them, second class between.
const EC = set("ECE (DSB): a Talgo 230 set, fifteen cars, between two EB locomotives (Vectron); first class in the three cars at one end, the bicycle places in both end cars",
  ["dkEb", 1], ["dkEcEnd", 1], ["dkEcSecond", 10], ["dkEcFirstR", 3], ["dkEcEndR", 1], ["dkEb", 1]);
const IC3 = set("IC (DSB): an IC3 diesel set, three cars, first class in the end car (MFA); often two or three sets coupled",
  ["dkMfa", 1], ["dkFf", 1], ["dkMfb", 1]);
const IC3x2 = set("IC (DSB): two IC3 diesel sets coupled, their rubber fronts together",
  ["dkMfa", 1], ["dkFf", 1], ["dkMfbR", 1], ["dkMfb", 1], ["dkFf", 1], ["dkMfa", 1]);
const SETS = { EC, IC3, IC3x2 };

// Fact sheets
const TGF = { model: "Talgo 230 (DSB EC)", builder: "Talgo", built: "2023–2027", fleet: "16 sets", topSpeedMph: 124, source: "https://de.wikipedia.org/wiki/Talgo_230" };
const ICF = { model: "ABB Scandia IC3 (DSB MF)", builder: "ABB Scandia", built: "1989–1993", topSpeedMph: 112, source: "https://de.wikipedia.org/wiki/DSB_MF" };
const FACTS = {
  dkEb: { model: "Siemens Vectron AC/MS (DSB EB)", type: "Electric locomotive", builder: "Siemens Mobility", built: "2020 on", fleet: "42", topSpeedMph: 124, lengthFt: 62.3,
    source: "https://da.wikipedia.org/wiki/DSB_EB", about: "DSB's electric locomotive. Two of them, one at each end, haul the Talgo sets on the ECE between Hamburg and København." },
  dkEcEnd: { ...TGF, type: "Passenger car", lengthFt: 62.3, about: "The end car: an ordinary bogie under its raised outer part, the bicycle and pram places beyond the door. DSB's Talgos run the ECE Hamburg–Padborg–København." },
  dkEcFirst: { ...TGF, type: "Passenger car", lengthFt: 43.1, about: "A first-class car (DSB 1'), on Talgo's single axles shared with its neighbours." },
  dkEcSecond: { ...TGF, type: "Passenger car", lengthFt: 43.1, about: "A second-class car of the articulated Talgo set, its floor 760 mm above the rail." },
  dkMfa: { ...ICF, type: "Diesel multiple unit", lengthFt: 67.4, about: "The IC3's end car with first class. IC3s run the IC between Flensburg, Padborg and Fredericia." },
  dkFf: { ...ICF, type: "Diesel multiple unit", lengthFt: 58.2, about: "The IC3's middle car, on trucks shared with the end cars." },
  dkMfb: { ...ICF, type: "Diesel multiple unit", lengthFt: 67.4, about: "The IC3's second-class end car; sets couple through their rubber fronts." },
};
  return { TYPES, MODELS, FACTS, SETS };
})();

// ===================== WESTbahn, European Sleeper, the night trains to Scandinavia and RDC's =====================
const MISC = (() => {
// WESTbahn's KISS (München/Stuttgart-Salzburg-Wien), European Sleeper's
// leased cars, the SJ EuroNight's cars and RDC's class 101 (Berlin/
// Hamburg-Stockholm) and RDC's Alpen-Sylt Nachtexpress. Keys "dx...".
const m = (v) => v * 3.2808;

// ===================== WESTbahn: Stadler KISS (4010, 4110) =====================
// Stadler KISS double-deck units, six cars (WESTbahn 4010.0xx, 2017-2019,
// and 4110; 150 m; the end cars 26.25 m, the middle cars 24.85 m, 4.6 m
// tall; each car on its own two trucks, the low lower deck between them,
// double doors at its ends). WESTbahn runs Wien-Salzburg-München (the 96x)
// with them. The paint (photographs: 4010 023 near Innsbruck 2025 and at
// Timelkam 2026, 4010 008 at Melk 2026, a unit at Traunstein 2024): white,
// the foot light sky blue, a lime-green band over it along the lower deck,
// broad slanted sky-blue sweeps rising across both decks; the cab front
// light blue below the black windshield. The doors light blue framed by
// the class's colour: yellow at First (first class), lime at Comfort,
// orange at Standard; the class named over the door in its colour ("First"
// black on a slanted yellow band), the numeral on a black plate in the
// door; the bicycle pictogram on the bicycle car's door.
const WB = { white: "#f3f5f4", foot: "#8fd3ee", sky: "#3fb0e5", lime: "#c4da2b", yellow: "#f3c21b", orange: "#f08a1c", teal: "#1497b5", door: "#a6dcf0", roof: "#c9ced2", black: "#1b1d20" };
const KS = { roof: m(4.6), sill: m(1.25), low: m(0.42), upY: m(3.05), upH: m(0.8), loY: m(1.2), loH: m(0.85), doorW: m(1.3) };
// Panes from a to b, w wide, p apart.
const panes = (a, b, w, p) => { const k = Math.max(1, Math.floor((b - a - w) / p) + 1), x0 = a + (b - a - (w + (k - 1) * p)) / 2; return Array.from({ length: k }, (_, i) => x0 + i * p); };
const wbWord = (c, x, y, h, text, fill, w) => letters(c, x, y, h, text, fill, { weight: 600, family: SANS, extra: `textLength="${n(w)}" lengthAdjust="spacingAndGlyphs"` });
// kind: "first" (end car, First and Comfort), "std" (middle, Standard),
// "bike" (end car, Standard, the bicycle places).
function wbCar(c, kind) {
  const L = c.L, cab = kind !== "std", R = KS.roof, S = KS.sill, F = cab ? m(0.2) : 0.5;
  const t1 = cab ? m(3.7) : m(2.6), t2 = L - m(2.6);
  const d1 = cab ? m(6.6) : m(4.6), d2 = L - m(4.6) - KS.doorW;
  const da = d1 - m(0.3), db = d2 + KS.doorW + m(0.3);
  // The outline: the low floor between the doors; the cab's rounded nose.
  const low = `L${n(db)} ${n(S)}L${n(db)} ${n(KS.low + 0.6)}Q${n(db)} ${n(KS.low)} ${n(db - 0.6)} ${n(KS.low)}L${n(da + 0.6)} ${n(KS.low)}Q${n(da)} ${n(KS.low)} ${n(da)} ${n(KS.low + 0.6)}L${n(da)} ${n(S)}`;
  const top = `L${n(L - 0.5)} ${n(S)}L${n(L - 0.5)} ${n(R - 1.2)}Q${n(L - 0.5)} ${n(R)} ${n(L - 1.7)} ${n(R)}`;
  const d = cab
    ? `M${n(m(0.7))} ${n(S)}L${n(da)} ${n(S)}L${n(da)} ${n(KS.low + 0.6)}Q${n(da)} ${n(KS.low)} ${n(da + 0.6)} ${n(KS.low)}L${n(db - 0.6)} ${n(KS.low)}Q${n(db)} ${n(KS.low)} ${n(db)} ${n(KS.low + 0.6)}L${n(db)} ${n(S)}` +
      top + `L${n(m(2.7))} ${n(R)}Q${n(m(1.8))} ${n(R - 0.15)} ${n(m(1.4))} ${n(m(3.95))}L${n(m(0.3))} ${n(m(2.3))}Q${n(m(0.08))} ${n(m(1.9))} ${n(m(0.12))} ${n(m(1.3))}L${n(m(0.3))} ${n(S - 0.6)}Z`
    : `M${n(F)} ${n(S)}L${n(da)} ${n(S)}L${n(da)} ${n(KS.low + 0.6)}Q${n(da)} ${n(KS.low)} ${n(da + 0.6)} ${n(KS.low)}L${n(db - 0.6)} ${n(KS.low)}Q${n(db)} ${n(KS.low)} ${n(db)} ${n(KS.low + 0.6)}L${n(db)} ${n(S)}` +
      top + `L${n(F + 1.2)} ${n(R)}Q${n(F)} ${n(R)} ${n(F)} ${n(R - 1.2)}Z`;
  // The paint.
  let p = rect(-1, 0, L + 2, 20, WB.white) + rect(-1, R - m(0.35), L + 2, 3, WB.roof) + rect(-1, 0, L + 2, m(1.05), WB.foot);
  // The lime band along the lower deck and the slanted sweeps.
  const sweep = (x, w, k, fill, y0 = 0, y1 = R) => path(poly([[x, y0], [x + w, y0], [x + w + k, y1], [x + k, y1]]), fill);
  if (kind === "first") {
    p += path(poly([[m(15.0), m(1.05)], [L + 1, m(1.05)], [L + 1, m(2.2)], [m(16.2), m(2.2)]]), WB.lime) + rect(m(8.2), m(1.05), m(7), m(0.35), WB.lime) + sweep(m(13.5), m(3.2), m(5.0), WB.sky) + sweep(m(21.0), m(2.0), -m(3.0), WB.lime, 0, m(1.6)) +
      path(poly([[m(3.0), m(2.95)], [m(13.0), m(2.95)], [m(17.5), R], [m(4.5), R]]), "#bde6f5") +
      // First's yellow band slanting up over its door.
      path(poly([[d1 + KS.doorW - m(0.2), m(2.62)], [d1 + KS.doorW + m(2.6), m(2.62)], [d1 + KS.doorW + m(3.3), m(3.2)], [d1 + KS.doorW + m(0.5), m(3.2)]]), WB.yellow);
  } else if (kind === "bike") {
    p += path(poly([[m(14.0), m(1.05)], [L + 1, m(1.05)], [L + 1, m(2.2)], [m(15.2), m(2.2)]]), WB.lime) + sweep(m(9.5), m(3.5), m(4.0), WB.sky) + sweep(m(19.0), m(2.2), -m(2.6), WB.lime, 0, m(1.6)) +
      path(poly([[m(2.5), m(2.95)], [m(10.0), m(2.95)], [m(14.0), R], [m(3.6), R]]), "#bde6f5");
  } else {
    p += path(poly([[m(9.0), m(1.05)], [m(20.5), m(1.05)], [m(19.5), m(2.2)], [m(10.0), m(2.2)]]), WB.lime) + rect(-1, m(1.05), L + 2, m(0.3), WB.lime) + sweep(m(14.0), m(2.6), m(3.6), WB.sky) + sweep(m(5.5), m(1.8), -m(2.2), WB.lime, 0, m(1.6));
  }
  if (cab) {
    // The cab: light blue below the black windshield and its surround.
    p += path(`M-1 0L${n(m(2.0))} 0L${n(m(2.0))} ${n(m(1.95))}Q${n(m(1.4))} ${n(m(2.15))} ${n(m(1.1))} ${n(m(2.3))}L-1 ${n(m(2.3))}Z`, WB.foot) +
      path(poly([[m(0.25), m(2.3)], [m(1.35), m(3.95)], ["q", m(1.8), R - 0.05, m(2.75), R - 0.05], [m(3.4), R - 0.05], [m(3.4), m(2.35)], [m(1.3), m(2.25)]]), WB.black);
  }
  let s = shell(d, WB.white, p);
  // Windows: the upper deck's in one black-framed row each, the lower's.
  const up0 = cab ? d1 + m(0.2) : m(3.6), up1 = L - m(3.6);
  for (const x of panes(up0, up1, m(1.15), m(1.55))) s += glass(x, x + m(1.15), KS.upY, KS.upY + KS.upH, 0.45);
  for (const x of panes(d1 + KS.doorW + m(0.5), d2 - m(0.45), m(1.2), m(1.6))) s += glass(x, x + m(1.2), KS.loY, KS.loY + KS.loH, 0.45);
  for (const x of cab ? [L - m(2.9)] : [m(1.25), L - m(2.0)]) s += glass(x, x + m(0.7), m(2.3), m(2.95), 0.35);
  if (cab) s += glass(m(3.55), m(3.95), m(1.9), m(3.6), 0.3) + glass(m(4.6), m(5.0), m(2.6), m(3.1), 0.3) + glass(m(5.6), m(6.0), m(2.6), m(3.1), 0.3) + path(poly([[m(0.45), m(2.4)], [m(1.4), m(3.85)], [m(2.0), m(3.85)], [m(1.9), m(2.4)]]), "#2c333b");
  // The doors, framed in the class's colour, the numeral's plate.
  // A door: light blue leaves in a broad frame of the class's colour, a
  // tall window in each leaf; on the left leaf the black plate with the
  // class's numeral, big; the bicycle sign on the right leaf of the
  // bicycle car's door.
  const doorOf = (x, frame, num, ink, pict) => {
    const y0 = KS.low + 0.1, y1 = y0 + m(2.2), t = m(0.1), w = KS.doorW;
    return rect(x, y0, w, y1 - y0, WB.door) + rect(x, y0, t, y1 - y0, frame) + rect(x + w - t, y0, t, y1 - y0, frame) + rect(x, y1 - t, w, t, frame) +
      line(x + w / 2, y0 + 0.1, x + w / 2, y1 - t, "rgba(0,0,0,0.35)", 0.5) +
      glass(x + w * 0.5 + m(0.12), x + w - t - m(0.1), m(1.2), m(2.3), 0.4) + glass(x + t + m(0.1), x + w * 0.5 - m(0.12), m(2.0), m(2.3), 0.3) +
      rect(x + w * 0.25 - m(0.14), m(1.15), m(0.28), m(0.75), WB.black, 0, 'rx="0.25"') + letters(c, x + w * 0.25, m(1.53), m(0.5), num, ink, { weight: 700 }) +
      (pict ? bike(c, x + w * 0.74, m(0.9), m(0.3), "#2a2d31") : "");
  };
  // WESTbahn's logo: its mark (a green and a blue leaf) and "westbahn" in
  // gray lower case; ".at" after it on the cars' sides.
  const wbLogo = (x, y, h) => mark(c, x, y, `<path d="M${n(-1.9 * h)} ${n(0.35 * h)}L${n(-1.45 * h)} ${n(-0.45 * h)}L${n(-1.05 * h)} ${n(-0.45 * h)}L${n(-1.5 * h)} ${n(0.35 * h)}Z" fill="#9cc93b"/>` +
    `<path d="M${n(-1.55 * h)} ${n(0.45 * h)}L${n(-1.1 * h)} ${n(-0.3 * h)}L${n(-0.7 * h)} ${n(-0.3 * h)}L${n(-1.15 * h)} ${n(0.45 * h)}Z" fill="#2a8fd0"/>` +
    `<text x="${n(-0.5 * h)}" y="${n(0.35 * h)}" font-size="${n(h)}" font-weight="500" font-family="${SANS}" fill="#58646e" text-anchor="start">westbahn.at</text>`);
  if (kind === "first") {
    s += doorOf(d1, WB.yellow, "1", WB.yellow) + doorOf(d2, WB.lime, "2", "#ffffff");
    s += letters(c, d1 + KS.doorW + m(1.55), m(2.92), m(0.32), "First", WB.black, { weight: 700, style: "italic" });
    s += wbWord(c, d2 - m(0.9), m(2.8), m(0.22), "Comfort", WB.teal, m(1.3)) + wbLogo(d2 - m(1.1), m(2.5), m(0.14));
  } else if (kind === "bike") {
    s += doorOf(d1, WB.orange, "2", WB.orange, true) + doorOf(d2, WB.orange, "2", WB.orange);
    s += wbLogo(d1 + KS.doorW + m(1.0), m(2.5), m(0.16));
    s += wbWord(c, d2 - m(0.9), m(2.8), m(0.22), "Standard", WB.orange, m(1.35)) + wbLogo(d2 - m(1.1), m(2.5), m(0.14));
  } else {
    s += doorOf(d1, WB.orange, "2", WB.orange) + doorOf(d2, WB.orange, "2", WB.orange);
    s += wbWord(c, d1 + KS.doorW + m(0.9), m(2.8), m(0.22), "Standard", WB.orange, m(1.35)) + wbWord(c, d2 - m(0.9), m(2.8), m(0.22), "Standard", WB.orange, m(1.35)) +
      wbLogo(d1 + KS.doorW + m(0.95), m(2.5), m(0.14)) + wbLogo(d2 - m(1.1), m(2.5), m(0.14));
  }
  // Running gear, roof, the cab's lamps and coupler.
  s += truck(t1, { wb: m(2.5), d: 36.2, top: S }) + truck(t2, { wb: m(2.5), d: 36.2, top: S }) + rect(da + 1.5, KS.low - 0.5, db - da - 3, 0.5, "currentColor", 0, 'opacity="0.7"');
  s += hvac(L / 2 - 6, R - 0.05, 12, 0.5);
  if (cab) s += pantograph(m(12.5), R - 0.05, { up: true, facing: -1 }) + rect(m(0.15), m(1.4), 0.6, 0.45, "#fff6d8", 0.3, 'rx="0.15"') + rect(0.05, 2.4, m(0.8), 0.6, "currentColor", 0, 'opacity="0.85"');
  return s + ends({ ...c, coupledL: cab ? false : c.coupledL }, S + 0.3, R - 1.6);
}

// ===================== RDC's night-train cars =====================
// RDC Deutschland's sleeping cars (WLAB 33s, A-BTEX 61 81 71-71 4xx,
// photographs at Denderleeuw 2026 and Paris Nord 2026) and couchettes
// (Bvcmz 248, D-RAG/D-BTEX 61 80 50-71, Paris Nord and Berlin Hbf 2026),
// leased to European Sleeper (with Train Charter) and running the
// Alpen-Sylt Nachtexpress and the SJ EuroNight: bright blue all over, the
// roof gray; the sleeping car's windows in pairs, "Schlafwagen / sleeper"
// with the bed sign at the door end, "RDC Zugkraft, die verbindet." mid-
// car; the couchette's windows framed light, "Liegewagen / couchette",
// the same RDC line and "train charter" small (on European Sleeper's).
const RDC = { blue: "#1559d8", deep: "#1b4fb3", roof: "#8c9196", text: "#f4f5f6" };
const rdcLine = (c, x, h = 0.62, y = 6.4) => letters(c, x, y, h * 1.35, "RDC", RDC.text, { weight: 700, anchor: "end" }) + letters(c, x + 0.4, y - 0.05, h, "Zugkraft, die verbindet.", RDC.text, { weight: 500, anchor: "start" });
const bed = (c, x, y, h, color) => mark(c, x, y, `<path d="M${n(-h)} ${n(h * 0.35)}L${n(-h)} ${n(-h * 0.5)}M${n(-h)} 0L${n(h)} 0L${n(h)} ${n(h * 0.35)}M${n(-h * 0.7)} ${n(-h * 0.3)}L${n(h * 0.6)} ${n(-h * 0.3)}" fill="none" stroke="${color}" stroke-width="${n(h * 0.22)}"/>`);
const rdcPaint = (cc, L) => rect(-1, 0, L + 2, 20, RDC.blue) + rect(-1, 12.4, L + 2, 3, RDC.roof);
// RDC's sleeping car (WLAB 33s; A-BTEX 61 81 71-71 4xx at Denderleeuw
// 2026): set high in the side, a broad window and a narrower one at the
// lettered end, then the compartments' windows in pairs, each framed in
// black with its drop-light over a bar; "Schlafwagen" with the bed sign
// and "sleeper" under it at that end, "RDC Zugkraft, die verbindet."
// twice along the side. (European Sleeper's carry no "train charter".)
function rdcSleeper(c, o = {}) {
  const L = c.L, pairs = [24.0, 33.6, 43.2, 52.8, 62.4, 72.0];
  const wins = [[7.8, 11.9, 7.7, 11.4], [14.6, 17.6, 7.9, 11.2], ...pairs.flatMap((x) => [[x, x + 2.3, 8.0, 11.2], [x + 2.9, x + 5.2, 8.0, 11.2]])];
  return coach(c, { base: RDC.blue, paint: rdcPaint, frame: "#15171a", doorFill: RDC.blue, doors: [[1.5, 2.9], [L - 4.4, 2.9]], wins,
    over: (cc, L) => lines(wins.map(([a, b, y0, y1]) => [a, y0 + (y1 - y0) * 0.55, b, y0 + (y1 - y0) * 0.55]), "#15171a", 0.9) +
      bed(cc, 8.3, 6.75, 0.55, RDC.text) + letters(cc, 9.2, 6.75, 1.0, "Schlafwagen", RDC.text, { weight: 600, anchor: "start" }) +
      letters(cc, 9.8, 5.75, 0.62, "sleeper", RDC.text, { weight: 500, anchor: "start" }) + rdcLine(cc, 47.0) + rdcLine(cc, 69.0) +
      (o.sj ? sjMark(cc, L - 7.0, 6.2, 1.0) : "") });
}
function rdcCouchette(c, o = {}) {
  const L = c.L, xs = Array.from({ length: 10 }, (_, i) => 8.4 + i * 6.75);
  const label = o.sj ? (cc) => letters(cc, L / 2 + 6, 5.4, 1.3, "Liggvagn - Liegewagen", "#efe7c8", { weight: 500 })
    : (cc) => bed(cc, L - 22.6, 5.9, 0.5, RDC.text) + letters(cc, L - 21.6, 5.9, 0.9, "Liegewagen", RDC.text, { weight: 600, anchor: "start" }) + letters(cc, L - 21.0, 4.9, 0.55, "couchette", RDC.text, { weight: 500, anchor: "start" }) +
      rdcLine(cc, 26.0, 0.55) + (o.tc ? letters(cc, 14.0, 6.6, 0.85, "train charter", RDC.text, { weight: 900, family: "Arial Rounded MT Bold, Nunito, Helvetica Neue, Arial, sans-serif" }) : "");
  return coach(c, { base: RDC.blue, paint: rdcPaint, frame: "#d9d4c4", doorFill: RDC.blue, wins: xs.map((x) => [x, x + 4.6, 7.2, 10.9]),
    over: (cc, L) => label(cc) + (o.sj ? sjMark(cc, L - 3.0, 6.4, 0.8) : "") });
}
// SJ's mark: "SJ" over its winged wheel, simplified to the letters and two
// arcs, in white on green (the SJ EuroNight's cars, Berlin Hbf 2026).
const sjMark = (c, x, y, h, color = RDC.text) => letters(c, x, y + h * 0.45, h, "SJ", color, { weight: 800 }) +
  mark(c, x, y - h * 0.45, `<path d="M${n(-h * 0.6)} 0Q0 ${n(h * 0.45)} ${n(h * 0.6)} 0M${n(-h * 0.45)} ${n(h * 0.3)}Q0 ${n(h * 0.65)} ${n(h * 0.45)} ${n(h * 0.3)}" fill="none" stroke="${color}" stroke-width="${n(h * 0.12)}"/>`);
// The SJ EuroNight's seat car (RDC Bimdz, D-RAG 51 80 22-91 2xx; Berlin
// Hbf 2026): RDC blue, a green panel slanting across its middle with SJ's
// mark, big compartment windows.
const sjSeat = (c) => coach(c, { base: RDC.blue, frame: "#2a2d31", doorFill: RDC.blue,
  paint: (cc, L) => rdcPaint(cc, L) + path(poly([[30.0, 0], [52.0, 0], [58.0, 12.4], [36.0, 12.4]]), "#37c449"),
  wins: Array.from({ length: 11 }, (_, i) => [7.0 + i * 6.6, 11.4 + i * 6.6, 7.4, 10.9]),
  over: (cc, L) => sjMark(cc, 40.5, 6.0, 1.6) });
// GfF's Bimdz (ex-DB InterRegio, Gesellschaft für Fahrzeugtechnik; in the
// European Sleeper Berlin-Paris at Wustermark 2026): blue over a sky-blue
// stripe over light gray, a white line under the silver roof, the "2" at
// the door end, GfF's red mark low.
const gffSeat = (c) => coach(c, { base: "#2f6fc6", frame: "#d5d8da", doorFill: "#2f6fc6",
  paint: (cc, L) => rect(-1, 0, L + 2, 20, "#2f6fc6") + rect(-1, 0, L + 2, 6.0, "#d9dcde") + rect(-1, 6.0, L + 2, 0.8, "#55aee8") + rect(-1, 11.9, L + 2, 0.5, "#eef0f1") + rect(-1, 12.4, L + 2, 3, "#b9bec2"),
  wins: Array.from({ length: 11 }, (_, i) => [7.2 + i * 6.55, 11.4 + i * 6.55, 7.3, 10.8]),
  over: (cc, L) => letters(cc, 5.4, 9.6, 1.3, "2", "#ffffff", { weight: 700 }) + letters(cc, 13.0, 5.0, 0.8, "GfF", "#d7262e", { weight: 800, style: "italic" }) });

// ===================== RDC's class 101 =====================
// DB's class 101 (Adtranz, 1996-1999; 19.1 m, Bo'Bo', 1,250 mm wheels),
// sold to RDC from 2023; on the SJ EuroNight between Hamburg/Berlin and
// the Danish border and on the Alpen-Sylt Nachtexpress (101 027 at Berlin
// Hbf 2026, 101 099 and a red one at Hamburg 2024): RDC blue (some red),
// "RDC" big in white along the side, the slogan small beside it; a white
// band across the front (not seen from the side).
const NOSE_101 = [[1.3, 4.1], [1.0, 7.3], ["q", 1.0, 8.6, 1.9, 9.2], [3.1, 12.2], ["q", 3.5, 12.9, 4.6, 12.9]];
const rdc101 = (c, red = false) => euroLoco(c, {
  roof: 12.9, sill: 4.1, nose: NOSE_101, rake: [[1.9, 9.2], [3.1, 12.2]], centers: 32.5, door: 6.0, wheel: 49, surround: "#1d2024",
  paint: (cc, L) => rect(-1, 0, L + 2, 20, red ? "#e2203a" : RDC.blue) + rect(-1, 12.2, L + 2, 3, "#5a5e63") + rect(-1, 0, L + 2, 4.9, "#2b2e33"),
  over: (cc, L) => letters(cc, L / 2 + 6.0, 9.2, 3.0, "RDC", RDC.text, { weight: 700 }) + letters(cc, L / 2 + 6.0, 6.5, 0.5, "Zugkraft, die verbindet.", RDC.text, { weight: 500 }),
  grilles: [[-9.5, 7.5, 8.2, 11.4]], grilleFill: "rgba(20,22,25,0.3)",
});

// ===================== Autozug Sylt =====================
// RDC Autozug Sylt's Siemens Vectron DE (247 908 "Debbie", 247 909 "Anne",
// 2018; 19.98 m, diesel-electric, Bo'Bo'; photographs: 247 908 at
// Westerland 2025, 247 909 near Klanxbüll 2023 and 2024): blue, the cab's
// roof and shoulders silver, the frame dark gray; "AUTOZUG Sylt" in white
// toward one end (the O round a car), the Vectron's mesh grilles in a big
// "A" in the middle, "Vectron simply efficient" under it.
const AZ = { blue: "#1f6fdc", silver: "#cfd3d7", frame: "#4a4e53", roof: "#3a3d41", white: "#f6f8fa" };
const azVectron = (c) => euroLoco(c, {
  roof: 12.9, sill: 4.1, nose: NOSE_VECTRON, rake: [[2.1, 9.0], [3.0, 12.3]], centers: 32.5, door: 7.6, surround: "#1d2024", pans: false,
  paint: (cc, L) => rect(-1, 0, L + 2, 20, AZ.blue) + rect(-1, 12.0, L + 2, 3, AZ.roof) + rect(-1, 0, L + 2, 6.3, AZ.frame) +
    // The silver over the cab: down the front to the windshield's foot,
    // back along the shoulder and up to the roof just ahead of the door.
    path("M-1 8.3L1.9 8.3Q3.6 10.3 5.2 11.0Q6.2 11.4 6.7 12.0L6.7 13.4L-1 13.4Z", AZ.silver) + path("M-1 6.3L1.6 6.3L1.6 8.3L-1 8.3Z", AZ.white),
  roof2: (cc, L) => rect(L / 2 - 16, 12.85, 30, 0.55, C.steelDark, 0.4, 'rx="0.2"') + rect(L / 2 + 6, 13.35, 2.0, 0.6, "currentColor") + rect(L / 2 - 2, 13.35, 4.0, 0.4, "currentColor"),
  over: (cc, L) => {
    const g = "rgba(20,22,25,0.6)", x0 = L * 0.37, x1 = L * 0.56, xm = (x0 + x1) / 2, y0 = 6.2, y1 = 11.6;
    const mesh = (pts) => path(poly(pts), g, 0.4) ;
    // The grilles round the big "A": left of its left leg, inside it above
    // and below the bar, right of its right leg; the A itself in the blue.
    const W = x1 - x0, la = x0 + 0.15 * W, rb = x1 - 0.05 * W, yb = y0 + 0.42 * (y1 - y0), at = (xa, xb, y) => xa + (xb - xa) * (y - y0) / (y1 - y0);
    // Left of the left leg; inside the A above its bar and below it (split
    // by a post); right of the right leg. The legs and bar stay blue.
    let s = mesh([[x0, y0 + 0.4], [x0, y1], [xm - 0.6, y1], [la - 0.4, y0 + 0.4]]) +
      mesh([[at(la, xm, yb + 0.35) + 0.45, yb + 0.35], [at(rb, xm, yb + 0.35) - 0.45, yb + 0.35], [xm, y1 - 1.0]]) +
      mesh([[la + 0.45, y0], [xm - 0.15, y0], [xm - 0.15, yb - 0.3], [at(la, xm, yb - 0.3) + 0.45, yb - 0.3]]) +
      mesh([[xm + 0.15, y0], [rb - 0.45, y0], [at(rb, xm, yb - 0.3) - 0.45, yb - 0.3], [xm + 0.15, yb - 0.3]]) +
      mesh([[xm + 0.6, y1], [x1, y1], [x1, y0 + 0.4], [rb + 0.4, y0 + 0.4]]);
    s += rect(L - 15.2, 6.5, 1.6, 5.0, g, 0.4) + rect(L - 13.4, 6.5, 1.6, 5.0, g, 0.4);
    s += letters(cc, L - 21.6, 9.9, 2.3, "AUTOZUG", AZ.white, { weight: 800, extra: 'textLength="9.4" lengthAdjust="spacingAndGlyphs"' }) +
      letters(cc, L - 18.4, 7.6, 1.9, "Sylt", AZ.white, { weight: 400, style: "italic", family: "Brush Script MT, Segoe Script, cursive" });
    s += letters(cc, x1 + 3.0, 7.75, 1.25, "Vectron", AZ.white, { weight: 400, family: "Georgia, Times New Roman, serif" }) + letters(cc, x1 + 3.0, 6.85, 0.45, "simply efficient", AZ.white, { weight: 400, style: "italic" });
    return s;
  },
  grilles: [],
});
// The car carriers (single deck, taken here as 17 m (not confirmed); photographs near Klanxbüll
// 2023 and 2024): a yellow underframe with its posts, the deck's blue
// side walls with a black rail on top, yellow ladders at the ends.
function azWagon(c) {
  const L = c.L, posts = (a, b, k) => Array.from({ length: k }, (_, i) => a + i * (b - a) / (k - 1));
  // The underframe: a yellow sole bar with its posts.
  let s = rect(0.6, 3.2, L - 1.2, 1.4, "#e1c01c") + lines(posts(1.2, L - 1.2, 12).map((x) => [x, 3.2, x, 4.6]), "#9c8a22", 0.7) + rect(0.6, 2.8, L - 1.2, 0.45, "#2a2d31");
  // The side wall in its panels, the black rail over it.
  s += rect(0.8, 4.6, L - 1.6, 3.0, "#3a679c", 0.4) + lines(posts(0.8, L - 0.8, 8).map((x) => [x, 4.65, x, 7.55]), "rgba(0,0,0,0.3)", 0.5) + line(0.8, 5.0, L - 0.8, 5.0, "rgba(255,255,255,0.25)", 0.5);
  s += line(0.8, 8.8, L - 0.8, 8.8, "#1e2124", 1.0) + lines(posts(1.0, L - 1.0, 16).map((x) => [x, 7.6, x, 8.8]), "#1e2124", 0.8);
  for (const x of [1.0, L - 1.7]) s += rect(x, 2.4, 0.7, 6.0, "none", 0, 'stroke="#e1c01c" stroke-width="1.0" vector-effect="non-scaling-stroke"') + lines([3.4, 4.4, 5.4, 6.4, 7.4].map((y) => [x, y, x + 0.7, y]), "#e1c01c", 0.8);
  s += truck(L / 2 - 19.0, { wb: 6.0, d: 33, top: 2.8 }) + truck(L / 2 + 19.0, { wb: 6.0, d: 33, top: 2.8 });
  s += rect(-0.2, 2.9, 1.0, 0.6, "currentColor") + rect(L - 0.8, 2.9, 1.0, 0.6, "currentColor");
  return s;
}

// ===================== Types, models, sets =====================
const Mo = (draw, len, oneEnd = false) => ({ draw, len: n(len), oneEnd, variant: null });
const TYPES = {
  dxWbCab1: { name: "WESTbahn KISS end car, First and Comfort", kind: "bilevel", emu: true, cab: true, pan: true, amenities: ["first"] },
  dxWbMid: { name: "WESTbahn KISS car, Standard", kind: "bilevel", emu: true },
  dxWbCab2: { name: "WESTbahn KISS end car, Standard, bicycles", kind: "bilevel", emu: true, cab: true, pan: true, amenities: ["bikes"] },
  dxRdcSleeper: { name: "RDC sleeping car (WLAB 33s)", kind: "coach", amenities: ["sleepers"] },
  dxRdcCouchette: { name: "RDC couchette car (Bvcmz 248)", kind: "coach", amenities: ["sleepers"] },
  dxEsCouchette: { name: "European Sleeper couchette car (RDC Bvcmz 248, Train Charter)", kind: "coach", amenities: ["sleepers"] },
  dxGffSeat: { name: "GfF second-class car (Bimdz, ex-InterRegio)", kind: "coach" },
  dxSjSeat: { name: "SJ EuroNight seat car (RDC Bimdz)", kind: "coach" },
  dxSjCouchette: { name: "SJ EuroNight couchette car (RDC)", kind: "coach", amenities: ["sleepers"] },
  dxSjSleeper: { name: "SJ EuroNight sleeping car (RDC WLAB)", kind: "coach", amenities: ["sleepers"] },
  dxRdc101: { name: "RDC class 101 electric locomotive", kind: "electric", pan: true },
  dxRdc101Red: { name: "RDC class 101 electric locomotive (red)", kind: "electric", pan: true },
  dxAzVectron: { name: "Siemens Vectron DE (247 9), Autozug Sylt", kind: "diesel" },
  dxAzWagon: { name: "Autozug Sylt car carrier", kind: "freight" },
};
const MODELS = {
  dxWbCab1: Mo((c) => wbCar(c, "first"), m(26.25), true),
  dxWbMid: Mo((c) => wbCar(c, "std"), m(24.85)),
  dxWbCab2: Mo((c) => wbCar(c, "bike"), m(26.25), true),
  dxRdcSleeper: Mo((c) => rdcSleeper(c), m(26.4)),
  dxRdcCouchette: Mo((c) => rdcCouchette(c), m(26.4)),
  dxEsCouchette: Mo((c) => rdcCouchette(c, { tc: true }), m(26.4)),
  dxGffSeat: Mo(gffSeat, m(26.4)),
  dxSjSeat: Mo(sjSeat, m(26.4)),
  dxSjCouchette: Mo((c) => rdcCouchette(c, { sj: true }), m(26.4)),
  dxSjSleeper: Mo((c) => rdcSleeper(c, { sj: true }), m(26.4)),
  dxRdc101: Mo((c) => rdc101(c), m(19.1)),
  dxRdc101Red: Mo((c) => rdc101(c, true), m(19.1)),
  dxAzVectron: Mo(azVectron, m(19.98)),
  dxAzWagon: Mo(azWagon, m(17.0)),
};
// European Sleeper's locomotive and its branded seat car, as ns.cars.js
// draws them (checked against 188 121 at Berlin Hbf 2026 and Bomdz TRI
// 84-90 217 2026).
for (const k of ["nlTraxxTc", "nlEsSeat"]) if (NL.TYPES?.[k] && NL.MODELS?.[k]) { TYPES[k] = { ...NL.TYPES[k] }; MODELS[k] = NL.MODELS[k]; }
const set = (label, ...units) => ({ label, units });
const SETS = {
  WESTBAHN: set("WESTbahn: a Stadler KISS, six double-deck cars, First and Comfort at one end, the bicycles at the other (often two units)", ["dxWbCab1", 1], ["dxWbMid", 4], ["dxWbCab2", 1]),
  ESLEEPER: set("European Sleeper: a Railpool TRAXX (Train Charter) with seat cars, couchettes and sleeping cars leased from RDC, GfF and TRI", ["nlTraxxTc", 1], ["nlEsSeat", 1], ["dxGffSeat", 1], ["dxEsCouchette", 4], ["dxRdcSleeper", 3]),
  SJEN: set("SJ EuroNight: RDC's class 101 in Germany with RDC's couchettes, seat cars and sleeping cars in SJ's colours", ["dxRdc101", 1], ["dxSjCouchette", 3], ["dxSjSeat", 2], ["dxSjSleeper", 2]),
  AUTOZUG: set("Autozug Sylt (RDC): a Vectron DE and single-deck car carriers", ["dxAzVectron", 1], ["dxAzWagon", 8]),
  ASN: set("Alpen-Sylt Nachtexpress (RDC): a class 101 with RDC's sleeping cars, couchettes and seat cars", ["dxRdc101", 1], ["dxRdcSleeper", 3], ["dxRdcCouchette", 4], ["dxGffSeat", 1]),
};
const WP = "https://de.wikipedia.org/wiki/";
const FACTS = {
  dxWbCab1: { model: "Stadler KISS (WESTbahn 4010/4110)", type: "Double-deck electric multiple unit", builder: "Stadler Rail", built: "2011–2019", topSpeedMph: 124, lengthFt: 86.1, source: `${WP}Westbahn_(Unternehmen)`, about: "WESTbahn's open-access trains Wien–Salzburg and on to München; First upstairs at this end, Comfort below." },
  dxWbMid: { model: "Stadler KISS (WESTbahn 4010/4110)", type: "Double-deck electric multiple unit", builder: "Stadler Rail", lengthFt: 81.5, source: `${WP}Westbahn_(Unternehmen)`, about: "A Standard-class double-deck car." },
  dxWbCab2: { model: "Stadler KISS (WESTbahn 4010/4110)", type: "Double-deck electric multiple unit", builder: "Stadler Rail", lengthFt: 86.1, source: `${WP}Westbahn_(Unternehmen)`, about: "The end car with the bicycle places." },
  dxRdcSleeper: { model: "Sleeping car (WLAB 33s)", type: "Night train coach", source: `${WP}RDC_Deutschland`, about: "RDC Deutschland's sleeping car, leased to European Sleeper and run in RDC's own night trains." },
  dxRdcCouchette: { model: "Couchette car (Bvcmz 248, ex-DB)", type: "Night train coach", source: `${WP}RDC_Deutschland`, about: "RDC Deutschland's couchette car." },
  dxEsCouchette: { model: "Couchette car (Bvcmz 248, ex-DB)", type: "Night train coach", source: "https://en.wikipedia.org/wiki/European_Sleeper", about: "RDC's couchette car leased through Train Charter to European Sleeper." },
  dxGffSeat: { model: "Bimdz (ex-DB InterRegio)", type: "Passenger coach", source: "https://en.wikipedia.org/wiki/European_Sleeper", about: "A leased second-class car of Gesellschaft für Fahrzeugtechnik in the night trains." },
  dxSjSeat: { model: "Bimdz (RDC)", type: "Passenger coach", source: "https://en.wikipedia.org/wiki/SJ_EuroNight", about: "The SJ EuroNight's seat car, leased from RDC, in SJ's green." },
  dxSjCouchette: { model: "Couchette car (RDC)", type: "Night train coach", source: "https://en.wikipedia.org/wiki/SJ_EuroNight", about: "The SJ EuroNight Berlin/Hamburg–Stockholm's couchettes, \"Liggvagn – Liegewagen\"." },
  dxSjSleeper: { model: "Sleeping car (RDC)", type: "Night train coach", source: "https://en.wikipedia.org/wiki/SJ_EuroNight", about: "A sleeping car of the SJ EuroNight." },
  dxRdc101: { model: "Adtranz class 101", type: "Electric locomotive", builder: "Adtranz", built: "1996–1999", topSpeedMph: 137, powerHp: 8600, lengthFt: 62.7, source: `${WP}DB-Baureihe_101`, about: "Former DB InterCity locomotives bought by RDC; they haul the SJ EuroNight in Germany and RDC's night trains." },
  dxRdc101Red: { model: "Adtranz class 101", type: "Electric locomotive", builder: "Adtranz", built: "1996–1999", topSpeedMph: 137, lengthFt: 62.7, source: `${WP}DB-Baureihe_101`, about: "One of RDC's class 101s in red." },
  dxAzVectron: { model: "Siemens Vectron DE (247 9)", type: "Diesel-electric locomotive", builder: "Siemens Mobility", built: "2018", fleet: "2 (247 908, 247 909)", topSpeedMph: 99, lengthFt: 65.5, source: `${WP}Autozug_Sylt`, about: "RDC's Autozug Sylt carries cars across the Hindenburgdamm between Niebüll and Westerland." },
  dxAzWagon: { model: "Car carrier", type: "Car-carrying wagon", source: `${WP}Autozug_Sylt`, about: "Cars drive on at Niebüll or Westerland and ride across the dam to the island." },
};
  return { TYPES, MODELS, FACTS, SETS };
})();

// ===================== PKP Intercity: the Berlin-Warszawa-Express =====================
// PKP Intercity's Siemens EU44 "Husarz" (ES64U4, 2008-2010, 10 built; 19.58
// m, Bo'Bo'; the Taurus III body; photographs: EU44-006 at Berlin Hbf
// 2025, EU44-005 at Warszawa Zachodnia 2026): silver, the cab's roof and
// the frame round the windshield blue down to the buffer beam, a thin
// orange line along the top of the side, a white line low over the dark
// grey frame; mid-side PKP Intercity's IC mark big, its red-orange "IC"
// between blue serrated wings. (Leased Vectrons haul some trains; the
// EU44 is drawn.)
const PKPC = { silver: "#c3c8cd", blue: "#2d47b8", orange: "#e8501e", red: "#e0301e", frame: "#4a4e53", white: "#eef0f2", band: "#1d2126", grey: "#d3d7da" };
// ===================== PKP Intercity's EU44 "Husarz" =====================
// Siemens ES64U4 (PKP Intercity EU44-001-010, 2008-2010; the Taurus III
// body as czechia.cars.js draws ÖBB's 1216: 19.58 m, Bo'Bo', the rounded
// nose under a deep raked windshield; photographs: EU44-006 "5 370 006"
// at Berlin Hbf 2025, side-on and from the front). The paint: silver, the
// cab ends blue, wrapping round the front and back along the side to the
// cab door, full height above the frame; a thin red line under the roof's
// edge, a white line low over the dark gray frame. Mid-side PKP
// Intercity's mark: the tall red-orange "IC" between blue wings whose outer
// edges break into saw teeth, "PKP INTERCITY" small in blue beside the IC.
const PKP = { silver: "#c5cacf", blue: "#2c4fbf", red: "#e2462a", frame: "#4a4e53", white: "#eef0f2", roof: "#8e959c" };
const NOSE_TAURUS = [[1.7, 4.1], [1.1, 6.3], ["q", 0.95, 8.5, 2.3, 9.3], [3.9, 12.15], ["q", 4.6, 13.0, 6.4, 13.0]];
const pkpWing = (x0, x1, y0, y1, side, teeth = 8) => {
  const h = (y1 - y0) / teeth, edge = side < 0 ? x0 : x1, back = side < 0 ? x1 : x0, d = (side < 0 ? 0.42 : -0.42) * (x1 - x0);
  let p = `M${n(back)} ${n(y0)}L${n(edge)} ${n(y0)}`;
  for (let i = 0; i < teeth; i++) p += `L${n(edge + d)} ${n(y0 + (i + 0.5) * h)}L${n(edge)} ${n(y0 + (i + 1) * h)}`;
  return path(p + `L${n(back)} ${n(y1)}Z`, PKP.blue, 0, 'opacity="0.9"');
};
const eu44 = (c) => euroLoco(c, { roof: 13.0, sill: 4.1, nose: NOSE_TAURUS, rake: [[2.3, 9.3], [3.9, 12.15]], centers: 32.5, wheel: 45, surround: "#141518", door: 7.2,
  paint: (cc, L) => rect(-1, 0, L + 2, 20, PKP.silver) + rect(-1, 12.25, L + 2, 2, PKP.roof) + rect(-1, 11.45, L + 2, 0.8, PKP.red) +
    // The blue cab end, back to just behind the cab door.
    path("M-1 5.7L6.6 5.7Q7.0 5.7 7.0 6.1L7.0 12.6Q7.0 13.0 6.6 13.0L-1 13.0Z", PKP.blue) +
    rect(-1, 0, L + 2, 5.4, PKP.frame) + rect(-1, 5.4, L + 2, 0.3, PKP.white),
  over: (cc, L) => {
    const x = L / 2 - 1.5;
    // The wings; the tall red "I", the blue "C" beside its top, the name
    // under the C.
    return pkpWing(x - 5.6, x - 0.9, 6.0, 11.4, -1) + pkpWing(x + 4.4, x + 9.6, 6.0, 11.4, 1) +
      rect(x - 0.45, 6.5, 0.9, 4.6, PKP.red) + rect(x - 0.75, 10.55, 1.5, 0.55, PKP.red) +
      path(`M${n(x + 2.2)} 10.95L${n(x + 0.95)} 10.95L${n(x + 0.95)} 9.0L${n(x + 2.2)} 9.0`, "none", 0, `stroke="${PKP.blue}" stroke-width="0.4"`) +
      letters(cc, x + 2.2, 6.75, 0.5, "PKP INTERCITY", PKP.blue, { weight: 600, style: "italic", extra: 'textLength="3.2" lengthAdjust="spacingAndGlyphs"' });
  },
  grilles: [[-14.5, 3.0, 11.0, 12.0], [11.5, 3.0, 11.0, 12.0]], grilleFill: "rgba(20,22,25,0.3)" });
// The Berlin-Warszawa-Express's coaches (UIC-Z, 26.4 m; photographs at
// Berlin Hbf 2025 and Frankfurt (Oder) 2026): light grey, the windows in a
// dark band, a thin blue line low along the side with the IC mark on it,
// blue doors; a yellow line over first class's windows, red over the
// restaurant car's (WARS).
const pkpCoach = (kind) => (c) => coach(c, { base: PKPC.grey, doorFill: PKPC.blue,
  paint: (cc, L) => bands(L, [[0, 20, PKPC.grey], [11.75, 3, "#9aa1a8"], [0, 4.1, "#3a3d42"], [5.45, 0.35, PKPC.blue]]) +
    rect(5.0, 6.75, L - 10.0, 4.35, PKPC.band, 0, 'rx="0.3"') + (kind === "first" ? rect(5.0, 11.1, L - 10.0, 0.35, "#f2c200") : kind === "wars" ? rect(5.0, 11.1, L - 10.0, 0.35, "#d7161e") : ""),
  wins: kind === "wars" ? [[6.0, 20.0, 7.0, 10.8], [22.0, 54.0, 7.0, 10.8], [56.0, L(c) - 6.0, 7.0, 10.8]].map(([a, b, y0, y1]) => [a, b, y0, y1])
    : seq(6.0, kind === "first" ? 7.0 : 6.45, kind === "first" ? 11 : 12).map((x) => [x, x + (kind === "first" ? 5.6 : 5.1), 7.0, 10.8]).filter(([, b]) => b < L(c) - 5.6),
  over: (cc, L) => rect(L * 0.38 - 2.6, 5.15, 5.2, 0.95, PKPC.grey) + letters(cc, L * 0.38, 5.62, 0.95, "IC", PKPC.red, { weight: 800, style: "italic" }) +
    letters(cc, 4.0, 9.0, 1.2, kind === "first" ? "1" : kind === "wars" ? "" : "2", "#ffffff", { weight: 600 }) });
const L = (c) => c.L;

// ---------- Types, models ----------
const Mo = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const TYPES = {
  deFlxVectron: { name: "Siemens Vectron (193), Flixtrain", kind: "electric", pan: true },
  deFlxCoach: { name: "Flixtrain coach (Bmmz, ex-InterRegio)", kind: "coach" },
  deFlxCoachW: { name: "Flixtrain coach with wheelchair places (Bmmdz)", kind: "coach" },
  deFlxCoachB: { name: "Flixtrain coach with bicycle places", kind: "coach", amenities: ["bikes"] },
  atVectron: { name: "ÖBB Vectron (1293) electric locomotive", kind: "electric", pan: true },
  atRj2First: { name: "railjet 2 first and business class car (Ampz)", kind: "coach", amenities: ["first", "business"] },
  atRj2Bistro: { name: "railjet 2 restaurant car (BRmpz)", kind: "coach", amenities: ["dining"] },
  atRj2Economy: { name: "railjet 2 economy car (Bmpz)", kind: "coach" },
  atRj2Cab: { name: "railjet 2 driving trailer (economy)", kind: "coach", cab: true },
  plEu44: { name: "PKP Intercity EU44 (Husarz) electric locomotive", kind: "electric", pan: true },
  plBweFirst: { name: "PKP Intercity first-class coach (Berlin-Warszawa-Express)", kind: "coach", amenities: ["first"] },
  plBweWars: { name: "PKP Intercity restaurant car (WARS)", kind: "coach", amenities: ["dining"] },
  plBweSecond: { name: "PKP Intercity second-class coach (Berlin-Warszawa-Express)", kind: "coach" },
};
export const MODELS = {
  deFlxVectron: Mo(flxVectron, M(18.98)),
  deFlxCoach: Mo(flxCoach, M(26.4)),
  deFlxCoachW: Mo(flxCoachW, M(26.4)),
  deFlxCoachB: Mo(flxCoachB, M(26.4)),
  atVectron: Mo(obbVectron, M(18.98)),
  atRj2First: Mo((c) => rj2Car(c, RJ2_CARS.First), M(26.5)),
  atRj2Bistro: Mo((c) => rj2Car(c, RJ2_CARS.Bistro), M(26.5)),
  atRj2Economy: Mo((c) => rj2Car(c, RJ2_CARS.Economy), M(26.5)),
  atRj2Cab: Mo(rj2Cab, M(26.9), true),
  plEu44: Mo(eu44, M(19.58)),
  plBweFirst: Mo(pkpCoach("first"), M(26.4)),
  plBweWars: Mo(pkpCoach("wars"), M(26.4)),
  plBweSecond: Mo(pkpCoach("second"), M(26.4)),
};

// Borrowed: [our key, file, its key, name override, draw wrapper].
// czechia.cars.js's railjet coaches take their kind from their place in
// the train (index 1-4 economy, 5 the restaurant car, 6 first), so each
// kind is fixed here; its Vectron, coaches and units take their paint
// from the railroad, so ČD's is given.
const BORROW = [
  // ÖBB: the railjet (first generation) and its Taurus, the 1216 that
  // hauls the Nightjets and ECs, the Nightjets' cars.
  ["atRjTaurus", CZ, "atTaurus"], ["atRjEconomy", CZ, "atRjCoach", "ÖBB railjet economy car (Bmpz)", (m) => (c) => m.draw({ ...c, index: 1 })],
  ["atRjBistro", CZ, "atRjCoach", "ÖBB railjet first class and restaurant (ARbmpz)", (m) => (c) => m.draw({ ...c, index: 5 })],
  ["atRjFirst", CZ, "atRjCoach", "ÖBB railjet first-class car (Ampz)", (m) => (c) => m.draw({ ...c, index: 6 })],
  ["atRjCab", CZ, "atRjCab"], ["at1216", CZ, "at1216", "ÖBB Taurus electric locomotive"],
  ["atNjSleeper", CZ, "atNjSleeper"], ["atNjCouchette", CZ, "atNjCouchette"], ["atNjCoach", CZ, "atNjCoach"],
  ["huSleeper", CZ, "huSleeper"], ["huCouchette", CZ, "huCouchette"],
  ["atNjnSeatCab", CH, "atNjnSeatCab"], ["atNjnMulti", CH, "atNjnMulti"], ["atNjnCouchette", CH, "atNjnCouchette"], ["atNjnSleeper", CH, "atNjnSleeper"],
  ["atBmpz", CH, "atBmpz"], ["at4748Cab", CH, "at4748Cab"], ["at4748Mid", CH, "at4748Mid"],
  ["atDesiroCab", CZ, "atDesiroCab"], ["atDesiroMid", CZ, "atDesiroMid"],
  // ČD: the ComfortJet and its Vectron, the coaches and night cars.
  ["cdVectron", CZ, "cdVectron"], ["czCjCoach", CZ, "czCjCoach"], ["czCjCab", CZ, "czCjCab"],
  ["cdCoach", CZ, "cdCoach"], ["cdSleeper", CZ, "cdSleeper"], ["cdCouchette", CZ, "cdCouchette"],
  ["czCoach", CZ, "czCoach", null, (m) => (c) => m.draw({ ...c, agency: "czcd" })],
  ["plCoach", CZ, "plCoach"], ["plSleeper", CZ, "plSleeper"],
  // SNCF: the TGV INOUI Euroduplex; Eurostar's red sets.
  ...["snInouiPower", "snInouiEnd1", "snInouiFirst", "snInouiBar", "snInouiSecondR", "snInouiEnd2", "snPbkaPower", "snPbkaTrailer"].map((k) => [k, SN, k]),
  // NS International's Vectron (the Nightjets from Amsterdam).
  ["nlVectronNs", NL, "nlVectronNs"],
  // SBB: the Astoro (München-Zürich) and Giruno (Frankfurt-Milano).
  ...["chsbbAsAt1", "chsbbAsA7", "chsbbAsWRA6", "chsbbAsB5", "chsbbAsB4", "chsbbAsB3", "chsbbAsBt2", "chsbbAsBt2R",
    "chsbbGiBt1", "chsbbGiB11", "chsbbGiB10", "chsbbGiB9", "chsbbGiB8", "chsbbGiB7", "chsbbGiWR6", "chsbbGiA5", "chsbbGiA4", "chsbbGiA3", "chsbbGiAt2", "chsbbGiAt2R"].map((k) => [k, SB, k]),
  // DB's ICE 4 as chintl.cars.js draws it (ÖBB's ICE Innsbruck-Lindau-
  // Bregenz).
  ...["deIce4End1", "deIce4First", "deIce4FirstP", "deIce4Bistro", "deIce4Service", "deIce4Second", "deIce4SecondP", "deIce4Pan", "deIce4End2"].map((k) => [k, CH, k]),
  // SBB's FLIRTs on the S-Bahn Basel (S 5, S 6 to Lörrach and Zell) and
  // the Seehas (S 6 Engen-Konstanz) and Klettgau lines.
  ...["sbbr521Bt", "sbbr521B", "sbbr521ABtR", "sbbr523Bt", "sbbr523B", "sbbr523ABtR"].map((k) => [k, SBR, k]),
  // Snälltåget's Vectron and coaches (Stockholm-Malmö-Berlin).
  ["se193", SJ, "se193"], ["seSnBmpz", SJ, "seSnBmpz"], ["seSnWRbmz", SJ, "seSnWRbmz"], ["seSnBvcmz", SJ, "seSnBvcmz"],
];
const BORROWED_FACTS = {};
for (const [key, mod, src, name, wrap] of BORROW) {
  const ty = mod?.TYPES?.[src], mo = mod?.MODELS?.[src];
  if (!ty || !mo) continue;
  TYPES[key] = { ...ty, ...(name ? { name } : {}) };
  MODELS[key] = wrap ? { ...mo, draw: wrap(mo), variant: null } : mo;
  if (mod.FACTS?.[src]) BORROWED_FACTS[key] = mod.FACTS[src];
}
for (const part of [DSB, MISC]) { Object.assign(TYPES, part.TYPES); Object.assign(MODELS, part.MODELS); Object.assign(BORROWED_FACTS, part.FACTS); }
// ===================== Over the Czech border =====================
// What runs on the neighbours' trips into Germany that the timetable gives
// to ČD (the data agent's "deintl" Os and RE trips, 2026):
// - U28 Děčín-Bad Schandau-Sebnitz-Dolní Poustevna/Rumburk (the
//   Nationalparkbahn; its Os trips Schöna/Bad Schandau-Dolní Žleb and
//   Bad Schandau-Sebnitz-Dolní Poustevna): DB Regio's Desiro Classic (642;
//   642 514 on the U28 at Šluknov 2024), as dbregio.cars.js draws it.
// - RE 20 Dresden-Bad Schandau-Děčín-Ústí-Litoměřice (5274-5279, 28016,
//   28017): ČD's two-car RegioPanter (650), as czechia.cars.js has it.
// - Os Johanngeorgenstadt-Potůčky-Karlovy Vary: ČD's Regionova (814), as
//   czechia.cars.js gives Potůčky's line.
// - Os Furth im Wald-Česká Kubice-Domažlice: ČD's Regionova (czechia.cars.js's
//   Plzeň-region default; not confirmed by a photograph).
// - RE 352-363 Furth im Wald-Domažlice(-Plzeň-Praha), the Prague-Munich
//   trains: Die Länderbahn's 223 (ER20) with two ČD and two alex coaches
//   (czechia.cars.js's set west of Plzeň; Leo Express takes the line over
//   on 13 December 2026).
// - Plzeň-Klatovy-Železná Ruda-Bayerisch Eisenstein: Sp/RR trains RegioFox
//   (847), Os trains Regionova, as czechia.cars.js has the Plzeň region.
const cset = (label, ...units) => ({ label, units });
const CZS = (key) => CZ.TYPES?.[key] && CZ.MODELS?.[key];
for (const k of ["czPanter650", "czRegionova", "czFox", "deEr20", "czCoach", "deAlexCoach"]) if (CZS(k)) { TYPES[k] = { ...CZ.TYPES[k] }; MODELS[k] = CZ.MODELS[k]; }
if (DBR.TYPES?.deR642 && DBR.MODELS?.deR642) { TYPES.deR642 = { ...DBR.TYPES.deR642 }; MODELS.deR642 = DBR.MODELS.deR642; }
// czechia's coach takes its paint from the railroad (ČD's when none).
if (MODELS.czCoach) MODELS.czCoach = { ...MODELS.czCoach, draw: (c) => CZ.MODELS.czCoach.draw({ ...c, agency: "czcd" }) };
if (MODELS.czPanter650) MODELS.czPanter650 = { ...MODELS.czPanter650, draw: (c) => CZ.MODELS.czPanter650.draw({ ...c, agency: "czcd" }) };
if (MODELS.czRegionova) MODELS.czRegionova = { ...MODELS.czRegionova, draw: (c) => CZ.MODELS.czRegionova.draw({ ...c, agency: "czcd" }) };
if (MODELS.czFox) MODELS.czFox = { ...MODELS.czFox, draw: (c) => CZ.MODELS.czFox.draw({ ...c, agency: "czcd" }) };
const CZX = {
  U28: cset("U28 (Nationalparkbahn): DB Regio's Desiro Classic (642), two sections", ["deR642", 1], ["deR642R", 1]),
  RE20: cset("RE 20 (ČD): a two-car RegioPanter (650)", ["czPanter650", 2]),
  REGIONOVA: cset("ČD Regionova (814): usually a two-car railbus", ["czRegionova", 2]),
  FOX: cset("ČD RegioFox (847): a two-section diesel unit", ["czFox", 2]),
  MUNICH: cset("Prague–Munich (ČD and Die Länderbahn): a Länderbahn 223 diesel with two ČD coaches and two alex coaches", ["deEr20", 1], ["czCoach", 2], ["deAlexCoach", 2]),
};
if (DBR.MODELS?.deR642R) { TYPES.deR642R = { ...DBR.TYPES.deR642R }; MODELS.deR642R = DBR.MODELS.deR642R; }
else CZX.U28 = cset(CZX.U28.label, ["deR642", 2]);
const RE20_NUMS = new Set([5274, 5275, 5276, 5277, 5278, 5279, 28016, 28017]);
// The set for a ČD-attributed trip into Germany (null if it isn't one).
function czx(t) {
  const r = String(t.route || ""), k = Number(String(t.number || "").match(/\d+/)?.[0] || 0);
  const ends = `${t.origin || ""} | ${t.destination || ""}`, all = ends + " " + (t.stops || []).map((x) => x.name || "").join(" ");
  if (/^RE/.test(r) && k >= 352 && k <= 363 || /Furth/.test(ends) && /Domažlice/.test(ends) && /^RE/.test(r)) return CZX.MUNICH;
  if (RE20_NUMS.has(k) || /^RE ?20$/.test(r)) return CZX.RE20;
  if (/Sebnitz|Dolní Poustevna|Rumburk|Dolní Žleb|Schöna|Bad Schandau|Děčín/.test(all)) return CZX.U28;
  if (/Johanngeorgenstadt|Potůčky|Karlovy Vary|Nejdek/.test(all)) return CZX.REGIONOVA;
  if (/Furth im Wald|Česká Kubice/.test(all)) return CZX.REGIONOVA;
  if (/Bayerisch Eisenstein|Železná Ruda|Klatovy/.test(all)) return /^(Sp|RR|R)\b/.test(r) ? CZX.FOX : CZX.REGIONOVA;
  return null;
}

const has = (k) => !!(TYPES[k] && MODELS[k]);
const allThere = (st) => (st && st.units.every(([k]) => has(k)) ? st : null);

// ---------- Typical trains ----------
// No formations are published for these trains in Germany, so each is
// drawn as its line or train number usually runs (2026 timetable), labeled
// typical.
const set = (label, ...units) => ({ label, units });
const flip = (st) => st && { ...st, units: [...st.units].reverse().map(([k, c]) => [/R$/.test(k) || !has(`${k}R`) ? k : `${k}R`, c]) };
const FLIX = set("Flixtrain: a Flix Vectron and ex-InterRegio coaches, one class (a train often runs with a locomotive at each end)",
  ["deFlxVectron", 1], ["deFlxCoachB", 1], ["deFlxCoach", 5], ["deFlxCoachW", 1]);
// ÖBB's railjet, first generation: the Taurus, economy next to it (car 21
// with the bicycles), the restaurant, first class and the driving trailer
// with business class.
const RJ1 = set("railjet (ÖBB): a Taurus and seven cars, economy next to it, the restaurant, first class and business class in the driving trailer at the other end",
  ["atRjTaurus", 1], ["atRjEconomy", 4], ["atRjBistro", 1], ["atRjFirst", 1], ["atRjCab", 1]);
// railjet 2 (München-Innsbruck-Italy): the Vectron, 261-262 first and
// business, 263 the restaurant, 264-268 economy, 269 the driving trailer.
const RJ2SET = set("railjet 2 (ÖBB): a Vectron and nine cars, first and business class next to it, the restaurant, economy, the driving trailer at the other end",
  ["atVectron", 1], ["atRj2First", 2], ["atRj2Bistro", 1], ["atRj2Economy", 5], ["atRj2Cab", 1]);
// ÖBB's EuroCity (München-Salzburg-Klagenfurt/Ljubljana/Zagreb, and EC
// 80/81 to Venezia): a Taurus and ÖBB's coaches.
const EC_OBB = set("EuroCity (ÖBB): a Taurus and ÖBB coaches (with the partner railways' cars on some trains)", ["at1216", 1], ["atBmpz", 7]);
// The Nightjets: the new generation (sleeping cars, couchettes with Mini
// Cabins, the multi-function car, the seat car with its cab) on Hamburg-
// Wien/Innsbruck, Amsterdam-Wien/Innsbruck, Hamburg-Basel/Zürich and
// München-Roma; the classic cars on the others.
const NJ_NEW = set("Nightjet, new generation (ÖBB): a Taurus and seven cars: sleeping cars, couchettes with Mini Cabins, the multi-function car and the seat car with its cab",
  ["at1216", 1], ["atNjnSleeper", 2], ["atNjnCouchette", 3], ["atNjnMulti", 1], ["atNjnSeatCab", 1]);
const NJ_OLD = set("Nightjet (ÖBB): a Taurus with sleeping cars, couchettes and a seat car (often with other railways' cars)",
  ["at1216", 1], ["atNjSleeper", 2], ["atNjCouchette", 3], ["atNjCoach", 1]);
const NJ_NL = set("Nightjet (ÖBB) Amsterdam-Basel-Zürich: NS International's Vectron with sleeping cars, couchettes and a seat car",
  ["nlVectronNs", 1], ["atNjSleeper", 2], ["atNjCouchette", 3], ["atNjCoach", 1]);
const NJ_PRAHA = set("Nightjet (ÖBB) Berlin-Praha-Wien/Graz: a Taurus with ÖBB's sleeping cars, couchettes and seats, and MÁV's sleeping car and couchette from Budapest",
  ["at1216", 1], ["atNjSleeper", 2], ["atNjCouchette", 2], ["atNjCoach", 2], ["huSleeper", 1], ["huCouchette", 1]);
// ČD: the ComfortJet (Praha-Dresden-Berlin-Hamburg-København, rj 17x and
// 38x, since May 2026), its Vectron at the Praha end.
const CJ = set("ComfortJet (ČD): a ČD Vectron and nine Siemens cars, the driving trailer at the other end", ["cdVectron", 1], ["czCjCoach", 8], ["czCjCab", 1]);
// SBB: the Astoro on the ECE München-Lindau-Zürich, first class at one
// end, the bistro next to it; the Giruno on ECE Frankfurt-Basel-Milano.
const ASTORO = set("ECE (SBB): an Astoro (RABe 503), seven cars, first class and the bistro at one end (some trains two units)",
  ["chsbbAsAt1", 1], ["chsbbAsA7", 1], ["chsbbAsWRA6", 1], ["chsbbAsB5", 1], ["chsbbAsB4", 1], ["chsbbAsB3", 1], ["chsbbAsBt2R", 1]);
const GIRUNO = set("ECE (SBB): a Giruno (RABe 501), eleven cars, first class at one end, the restaurant car in the middle",
  ["chsbbGiAt2", 1], ["chsbbGiA3", 1], ["chsbbGiA4", 1], ["chsbbGiA5", 1], ["chsbbGiWR6", 1], ["chsbbGiB7", 1], ["chsbbGiB8", 1], ["chsbbGiB9", 1], ["chsbbGiB10", 1], ["chsbbGiB11", 1], ["chsbbGiBt1", 1]);
// SNCF: the TGV INOUI Euroduplex (the 47xx and 48xx sets cleared for
// Germany); Eurostar's red sets (ex-Thalys) to Köln, Düsseldorf, Essen
// and Dortmund.
const TGV = set("TGV INOUI (SNCF): a double-deck Euroduplex set, first class in cars 1-3, the bar in car 4 (some trains two sets coupled)",
  ["snInouiPower", 1], ["snInouiEnd1", 1], ["snInouiFirst", 2], ["snInouiBar", 1], ["snInouiSecondR", 3], ["snInouiEnd2", 1], ["snInouiPower", 1]);
const EUROSTAR = set("Eurostar (the red ex-Thalys sets, PBKA): two power cars and eight trailers (some trains two sets coupled)",
  ["snPbkaPower", 1], ["snPbkaTrailer", 8], ["snPbkaPower", 1]);
const SNALL = set("Snälltåget: a Vectron with coaches, a dining car and couchette cars", ["se193", 1], ["seSnBmpz", 2], ["seSnWRbmz", 1], ["seSnBvcmz", 4]);
// The 1216 with ÖBB's coaches on the München-Simbach-Wien ECs (the
// Passau line closed in 2026): a diesel locomotive hauls them between
// München and Wels, its class not confirmed, so it isn't drawn.
const EC_SIMBACH = set("EuroCity (ÖBB) München-Simbach-Wien: ÖBB coaches (a diesel locomotive hauls them between München and Wels; not shown)", ["atBmpz", 7]);
const ICE4 = set("ICE 4 (DB), twelve cars: first class and the restaurant at one end, the bicycles in the end car at the other",
  ["deIce4End1", 1], ["deIce4First", 1], ["deIce4FirstP", 1], ["deIce4Bistro", 1], ["deIce4Service", 1], ["deIce4Second", 1], ["deIce4SecondP", 2], ["deIce4Pan", 1], ["deIce4SecondP", 2], ["deIce4End2", 1]);
// The Berlin-Warszawa-Express and PKP Intercity's other trains to Berlin
// (Gdynia, Przemyśl, Kraków): an EU44 (or a leased Vectron), first class
// next to it, the WARS restaurant car, second class.
const BWE = set("Berlin-Warszawa-Express (PKP Intercity): an EU44 (some trains a leased Vectron) with first class next to it, the WARS restaurant car and second class",
  ["plEu44", 1], ["plBweFirst", 1], ["plBweWars", 1], ["plBweSecond", 5]);
const PKP_LEIPZIG = set("EuroCity Leipzig-Wrocław-Kraków (DB and PKP Intercity): PKP Intercity coaches, drawn behind an EU44 (the locomotive varies)",
  ["plEu44", 1], ["plBweFirst", 1], ["plBweSecond", 4]);
const METROPOL = set("EuroNight Metropol (Berlin-Praha-Budapest): ČD's coaches, couchettes and sleeping cars and MÁV's, behind a ČD Vectron",
  ["cdVectron", 1], ["cdCoach", 2], ["cdCouchette", 2], ["cdSleeper", 1], ["huSleeper", 1]);
const CITYJET_V = set("S-Bahn Vorarlberg (ÖBB): a cityjet (Desiro ML, 4748), four cars (often two units)", ["at4748Cab", 1], ["at4748Mid", 2], ["at4748Cab", 1]);
const CITYJET = set("ÖBB cityjet (Desiro ML), usually three cars (some trains two units)", ["atDesiroCab", 1], ["atDesiroMid", 1], ["atDesiroCab", 1]);
const BASEL = set("S-Bahn Basel (SBB): a FLIRT (RABe 521), four cars (often two units)", ["sbbr521Bt", 1], ["sbbr521B", 2], ["sbbr521ABtR", 1]);
const SEEHAS = set("SBB's FLIRT (RABe 521 2xx, the Seehas), four cars", ["sbbr523Bt", 1], ["sbbr523B", 2], ["sbbr523ABtR", 1]);
const SETS = { FLIX, RJ1, RJ2SET, EC_OBB, EC_SIMBACH, NJ_NEW, NJ_OLD, NJ_NL, NJ_PRAHA, METROPOL, CJ, ASTORO, GIRUNO, ICE4, TGV, EUROSTAR, SNALL, BWE, PKP_LEIPZIG,
  DSB_EC: DSB.SETS.EC, DSB_IC3: DSB.SETS.IC3, DSB_IC3x2: DSB.SETS.IC3x2, WESTBAHN: MISC.SETS.WESTBAHN, ESLEEPER: MISC.SETS.ESLEEPER, SJEN: MISC.SETS.SJEN, ASN: MISC.SETS.ASN,
  AUTOZUG: MISC.SETS.AUTOZUG, CITYJET_V, CITYJET, BASEL, SEEHAS, ...Object.fromEntries(Object.entries(CZX).map(([k, v]) => [`CZX_${k}`, v])) };
export const SAMPLE_SETS = Object.fromEntries(Object.entries(SETS).map(([k, v]) => [k, allThere(v)]).filter(([, v]) => v));

const num = (t) => Number(String(t.number || "").match(/\d+/)?.[0] || 0);
const endsOf = (t) => `${t.origin || ""} | ${t.destination || ""}`;
const via = (t, re) => re.test(endsOf(t)) || (t.stops || []).some((x) => re.test(x.name || ""));
const inList = (k, list) => list.some((x) => (Array.isArray(x) ? k >= x[0] && k <= x[1] : k === x));
// Train numbers (2026 timetable, DELFI's): the railjet 2's München-Italy
// trains; the railjets München-Salzburg-Wien/Budapest; ČD's ComfortJets
// (Hamburg/Kiel/Berlin-Praha-Brno-Budapest, Praha-København); the
// Nightjets by generation (the new ones on Hamburg/Amsterdam-Wien/
// Innsbruck, Hamburg-Basel-Zürich, München-Roma/Venezia); SBB's Astoros
// (München-Lindau-Zürich) and Girunos (Frankfurt-Basel-Milano and the
// Basel-Hamburg ECEs since December 2025); DSB's Talgos (ECE 392-397
// Hamburg-Padborg-København since May 2026); PKP Intercity's trains.
const RJ2_NUMS = [[80, 89], [286, 289], 1183, 1281];
const RJ1_NUMS = [[60, 69], [260, 269]];
const CJ_NUMS = [[170, 179], [244, 251], [382, 389]];
const NJ_NEW_NUMS = [420, 421, 40420, 40421, 490, 491, 492, 493, 40490, 40491, 470, 471, 40470, 40471, 60470, 60471, 294, 295, 40294, 40295, 236, 237, 50237];
const NJ_NL_NUMS = [402, 403, 40402, 40403];
const NJ_PRAHA_NUMS = [456, 457, 40456, 40457];
const METROPOL_NUMS = [476, 477, 40476, 40477];
const SBB_ASTORO = [[94, 99], [190, 199], 290];
const SBB_GIRUNO = [150, 151, 158, 159, [4, 9], 75];
const DSB_NUMS = [[392, 397]];
const PKP_BERLIN = [[40, 59], 230, 231, [246, 249], 430, 431];
const PKP_LEIPZIG_NUMS = [[132, 135]];
// A car shown alone (a fleet page's sample): the set it runs in.
const setOf = (key) => Object.values(SAMPLE_SETS).find((x) => x.units.some(([k]) => k.replace(/R$/, "") === key.replace(/R$/, ""))) || null;
function deld(t, reported) {
  const r = String(t.route || ""), k = num(t);
  if (!r && reported) return setOf(reported);
  if (/^FLX|Flix/i.test(r)) return FLIX;
  if (/Eurostar|^EST|^THA/i.test(r)) return allThere(EUROSTAR);
  if (/^TGV/.test(r) || (k >= 9550 && k <= 9599)) return allThere(TGV);
  if (/Snäll/i.test(r)) return allThere(SNALL);
  if (/WESTbahn/i.test(r)) return allThere(MISC.SETS.WESTBAHN);
  if (/European Sleeper/i.test(r)) return allThere(MISC.SETS.ESLEEPER);
  if (/Alpen-Sylt/i.test(r)) return allThere(MISC.SETS.ASN);
  if (/Autozug|Sylt Shuttle/i.test(r) || k >= 28900 && k <= 28999 && via(t, /Westerland|Niebüll/)) return allThere(MISC.SETS.AUTOZUG);
  if (r === "EN" && (k === 344 || k === 345 || via(t, /Stockholm|Malmö/))) return allThere(MISC.SETS.SJEN);
  if (/^(NJ|EN)\b|^\d+N$/.test(r) || /Nightjet/i.test(r)) {
    if (inList(k, METROPOL_NUMS)) return allThere(METROPOL);
    if (inList(k, NJ_NEW_NUMS)) return allThere(NJ_NEW);
    if (inList(k, NJ_NL_NUMS)) return allThere(NJ_NL);
    if (inList(k, NJ_PRAHA_NUMS)) return allThere(NJ_PRAHA);
    return allThere(NJ_OLD);
  }
  if (/^IC\b/.test(r) && via(t, /Flensburg|Padborg|Tinglev|Fredericia|Aarhus/)) return allThere(DSB.SETS.IC3);
  if (/^ICE\b/.test(r)) return allThere(ICE4);
  if (/^(RJ|rj)/.test(r) || /railjet/i.test(r)) {
    if (inList(k, CJ_NUMS)) return allThere(CJ);
    if (inList(k, RJ2_NUMS)) return RJ2SET;
    return allThere(RJ1);
  }
  if (/^EC/.test(r)) {
    if (inList(k, DSB_NUMS) || via(t, /København|Kopenhagen|Koebenhavn/) && !inList(k, CJ_NUMS)) return allThere(DSB.SETS.EC);
    if (inList(k, SBB_GIRUNO)) return allThere(GIRUNO);
    if (inList(k, SBB_ASTORO) || via(t, /Zürich|Lindau/) && via(t, /München/)) return allThere(ASTORO);
    if (inList(k, CJ_NUMS)) return allThere(CJ);
    if (inList(k, PKP_LEIPZIG_NUMS) || via(t, /Hoyerswerda|Wrocław|Horka/) && via(t, /Leipzig/)) return PKP_LEIPZIG;
    if (inList(k, PKP_BERLIN) || via(t, /Rzepin|Warszawa|Frankfurt \(Oder\)/)) return BWE;
    if (inList(k, RJ1_NUMS)) return allThere(RJ1);
    if (inList(k, RJ2_NUMS) && k !== 80 && k !== 81) return RJ2SET;
    if (k >= 1210 && k <= 1219 || via(t, /Simbach|Mühldorf/)) return allThere(EC_SIMBACH);
    if (via(t, /Salzburg|Klagenfurt|Villach|Ljubljana|Zagreb|Venezia|Verona|Innsbruck|Kufstein/)) return allThere(EC_OBB);
    if (via(t, /Dresden|Děčín|Bad Schandau|Praha/)) return allThere(CJ);
  }
  return reported ? setOf(reported) : null;
}
// The neighbours' regional trains over the border: ÖBB's cityjets (the
// S-Bahns of Vorarlberg to Lindau, Salzburg to Freilassing, Tirol to
// Mittenwald, and Upper Austria's lines to Passau and Simbach), SBB's
// FLIRTs (Basel's S 5 and S 6 to Lörrach and Zell, the Seehas Engen-
// Konstanz, the Klettgau). ČD's trains over the border (to Bad Schandau,
// Sebnitz, Johanngeorgenstadt, Furth im Wald, Bayerisch Eisenstein) by
// czx() above.
function deintl(t, reported) {
  const r = String(t.route || "");
  if (!r && reported) return setOf(reported);
  const cz = czx(t);
  if (cz) return allThere(cz);
  if (via(t, /Lindau|Bregenz|Götzis|Altach|Dornbirn|Feldkirch|Bludenz/)) return allThere(CITYJET_V);
  if (via(t, /Lörrach|Weil am Rhein|Steinen|Schopfheim|Zell/)) return allThere(BASEL);
  if (via(t, /Konstanz|Engen|Singen|Erzingen|Trasadingen|Schaffhausen/)) return allThere(SEEHAS);
  if (via(t, /Freilassing|Salzburg|Kuchl|Passau|Andorf|Simbach|Braunau|Neuratting|Mittenwald|Scharnitz|Allerheiligenhöfe|Gurten|Neumarkt am Wallersee/)) return allThere(CITYJET);
  return reported ? setOf(reported) : null;
}
export const TYPICAL = { deld, deintl };
// ---------- Fleets ----------
// [first, last, type] over the 12-digit European Vehicle Number as a
// number, from the vehicles' lettering in the photographs: Flix's Vectrons
// "91 80 6193 4xx", ÖBB's 1293 "91 81 1293 0xx", the railjet 2's cars
// "73 81 19-91 1xx/2xx" (261, 262), "85-91 3xx" (263), "28-91 4xx" (264),
// "22-91 5xx-8xx" (265-268), "80-91 9xx" (269); PKP Intercity's EU44
// "91 51 5370 0xx".
const evn = (prefix8) => [Number(`${prefix8}0000`), Number(`${prefix8}9999`)];
export const FLEETS = {
  deld: [
    [...evn("91806193").map((v, i) => (i ? 918061934999 : 918061934000)), "deFlxVectron"], [...evn("91811293"), "atVectron"],
    [738119911000, 738119912999, "atRj2First"], [738185913000, 738185913999, "atRj2Bistro"], [738128914000, 738128914999, "atRj2Economy"],
    [738122915000, 738122918999, "atRj2Economy"], [738180919000, 738180919999, "atRj2Cab"], [...evn("91515370"), "plEu44"],
  ],
};
const DEWP = "https://de.wikipedia.org/wiki/";
const FLXF = { source: `${DEWP}Flixtrain` };
export const FACTS = {
  ...BORROWED_FACTS,
  deFlxVectron: { model: "Siemens Vectron AC (193)", type: "Electric locomotive", builder: "Siemens Mobility", built: "2023 on", topSpeedMph: 124, powerHp: 8600, lengthFt: 62.3, ...FLXF,
    about: "Flixtrain's own locomotives, in Flix green. Flixtrain runs open-access trains across Germany: Hamburg and Berlin to Köln and Aachen, Berlin to Frankfurt, Stuttgart and Basel, Hamburg to Leipzig." },
  deFlxCoach: { model: "Bmmz 264 (ex-DB InterRegio, rebuilt by Talbot)", type: "Passenger coach", built: "1960s–1980s, rebuilt 2018–2020", lengthFt: 86.6, ...FLXF,
    about: "About 135 former InterRegio coaches rebuilt as open cars with 100 seats; Flixtrain has one class." },
  deFlxCoachW: { model: "Bmmdz 268 (ex-DB InterRegio, rebuilt)", type: "Passenger coach", lengthFt: 86.6, ...FLXF, about: "The coach with the wheelchair places and the accessible toilet." },
  deFlxCoachB: { model: "Bmmz (ex-DB InterRegio, rebuilt)", type: "Passenger coach", lengthFt: 86.6, ...FLXF, about: "The coach with the bicycle places." },
};

// Shared parts, for the other drawings of this wave.
export const PARTS = { shell, glass, italic, word, bands, coach, mirror, ends, gangway, bike, wheelchair, NOSE_VECTRON, obbLogo, seq, fit, n, M, SANS };

