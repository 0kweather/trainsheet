// FGC's cars (scripts/railroads/fgc.py): the Barcelona-Vallès units (series
// 112-115), the Llobregat-Anoia 213s and the Lleida-La Pobla GTWs. Geotren
// names each train's series ("113", or "213x2" for two coupled), which the
// parser passes on as t.series, so a live train is drawn as its own series;
// the rest is what usually runs on the line. Trainsheet's own side views,
// from published dimensions and photographs; liveries simplified.
import { bilevel } from "../carmodels.js?v=dev";
import { C, rect, path, poly, win, truck, pantograph, slats, underframe } from "../carart.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);

// White, the windows in a black band from end to end with a thin orange
// line under it, orange doors (red on the Llobregat-Anoia's 213s); black
// cab fronts edged in white.
const FGC = { white: "#f3f4f5", band: "#1b1d20", orange: "#f39200", red: "#d7261e", roof: "#a9afb6", skirt: "#3a3e44" };
function fgcPaint(L, { accent = FGC.orange, cab = false, band = [6.6, 3.4], roof = 12.0, skirt = 3.5 } = {}) {
  let s = rect(0, 0, L, 17, FGC.white) + rect(0, roof, L, 3, FGC.roof) + rect(0, 0, L, skirt, FGC.skirt);
  s += rect(0, band[0], L, band[1], FGC.band) + rect(0, band[0] - 0.42, L, 0.26, accent);
  if (cab) s += rect(0, skirt, 2.2, roof - skirt, FGC.band) + rect(2.2, skirt, 0.25, roof - skirt, FGC.white) + rect(0, skirt, 2.2, 1.2, accent);
  return s;
}
const fgcDoor = (x, fill = FGC.orange, w = 4.3) => ({ x, w, y0: 3.6, y1: 10.8, leaves: 2, glassY: 0.45, glassH: 0.42, fill });
const crewDoor = (x) => ({ x, w: 2.0, y0: 3.8, y1: 10.6, glassY: 0.55, glassH: 0.3, grabs: false, fill: "#eceef0" });
// A flat-fronted cab seen from the side: the windshield's edge and the
// driver's side window.
const flatCab = (top) => () => path(poly([[0.7, 7.2], [1.1, top], [3.6, top], [3.6, 7.2]]), C.glass);

// --- Series 112 (CAF, GEC-Alsthom and ABB, 1995-2002): 22 four-car units
// (motor-cab, motor, trailer, motor-cab), 79.52 m, 2,160 kW, 90 km/h; the
// first "Metro del Vallès" trains, now refurbished. Three pairs of sliding
// doors a side on each car.
// --- Series 113 and 114 (Alstom and CAF, 2013-14): 19 four-car 113s and
// five three-car 114s for the L7, whose tunnel to Avinguda Tibidabo takes
// only three cars. The same three doors a side, a gangway through.
// --- Series 115 (Stadler, Valencia, 2021-22): 15 four-car aluminium units,
// about 80 m, 90 km/h, able to run with the 113s and 114s.
// Drawn on one body: a flat cab end, a crew door behind it, the windows in
// the black band between the doors.
const BV = { roof: 12.6, sill: 3.5, cornerR: 1.0, end: 0.6, trucks: { centers: 45, wb: 7.9, d: 33 }, diaphragm: [3.8, 11.6], badge: false };
const bvCab = ({ nose, roofItems }) => (c) => bilevel({ ...c, cabL: true, cabR: false }, { ...BV, nose,
  rows: [{ xs: [8.4, 20.2, 24.8, 38.2, 42.8, 56.0, 60.6], y: 6.8, w: 3.9, h: 3.0, r: 0.3 }],
  doors: [crewDoor(5.0), fgcDoor(13.6), fgcDoor(31.6), fgcDoor(49.4)], cabLen: 4, roofItems,
  paint: (c, g) => fgcPaint(g.L, { cab: true }), cab: flatCab(11.0),
  extra: (c, g) => underframe(16, 50, 3.5, { depth: 1.2, boxes: 3 }) + pantograph(g.L - 11, 12.6, { up: true, facing: -1 }),
});
const bvMid = ({ roofItems, pan = false }) => (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...BV,
  rows: [{ xs: [2.2, 15.6, 20.2, 33.6, 38.2, 51.6, 56.2], y: 6.8, w: 3.9, h: 3.0, r: 0.3 }], roofItems,
  doors: [fgcDoor(9.0), fgcDoor(27.0), fgcDoor(45.0)],
  paint: (c, g) => fgcPaint(g.L),
  extra: () => underframe(14, 48, 3.5, { depth: 1.2, boxes: 3 }) + (pan ? pantograph(10, 12.6, { up: true }) : ""),
});
const BLUNT = [[0.8, 3.5], [0.7, 9.8], ["q", 0.8, 11.8, 2.0, 12.4], ["q", 2.8, 12.6, 4.2, 12.6]];
const ROUND = [[1.0, 3.5], [0.6, 4.6], ["q", 0.4, 9.4, 1.6, 11.4], ["q", 2.6, 12.6, 4.8, 12.6]];
export const fgc112Cab = bvCab({ nose: BLUNT, roofItems: [[6, 9, 0.5], [44, 9, 0.5]] });
export const fgc112 = bvMid({ roofItems: [[6, 9, 0.5], [44, 9, 0.5]] });
export const fgc113Cab = bvCab({ nose: ROUND, roofItems: [[8, 12, 0.6], [44, 12, 0.6]] });
export const fgc113 = bvMid({ roofItems: [[6, 12, 0.6], [44, 12, 0.6]] });
export const fgc115Cab = bvCab({ nose: [[1.1, 3.5], [0.6, 4.8], ["q", 0.6, 8.8, 2.0, 11.2], ["q", 3.0, 12.6, 5.6, 12.6]], roofItems: [[9, 14, 0.7], [42, 14, 0.7]] });
export const fgc115 = bvMid({ roofItems: [[6, 14, 0.7], [42, 14, 0.7]] });

// --- Series 213 (MTM, Meinfesa, CAF and Adtranz, 1998-2009): 42
// three-car metre-gauge units on the Llobregat-Anoia line, a motor car
// with a cab at each end (two doors a side, a pantograph) and a trailer
// (three doors a side), 1,440 kW, 90 km/h; two coupled at most. Red where
// the Barcelona-Vallès units have orange.
const LA = { roof: 12.2, sill: 3.4, cornerR: 1.0, end: 0.6, trucks: { centers: 43, wb: 7.2, d: 30 }, diaphragm: [3.6, 11.2], badge: false };
export const fgc213Cab = (c) => bilevel({ ...c, cabL: true, cabR: false }, { ...LA,
  nose: [[0.8, 3.4], [0.7, 9.6], ["q", 0.8, 11.5, 1.9, 12.0], ["q", 2.7, 12.2, 4.0, 12.2]],
  rows: [{ xs: [7.6, 22.0, 26.6, 31.2, 35.8, 49.6, 54.2, 58.8], y: 6.7, w: 3.9, h: 2.9, r: 0.3 }],
  doors: [crewDoor(4.4), fgcDoor(13.8, FGC.red), fgcDoor(41.0, FGC.red)], cabLen: 4,
  roofItems: [[20, 14, 0.6]],
  paint: (c, g) => fgcPaint(g.L, { accent: FGC.red, cab: true, band: [6.5, 3.3], roof: 11.6, skirt: 3.4 }), cab: flatCab(10.8),
  extra: (c, g) => underframe(16, 46, 3.4, { depth: 1.2, boxes: 3 }) + pantograph(g.L - 10, 12.2, { up: true, facing: -1 }),
});
export const fgc213 = (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...LA,
  rows: [{ xs: [2.2, 15.4, 20.0, 33.0, 37.6, 51.0, 55.6], y: 6.7, w: 3.9, h: 2.9, r: 0.3 }],
  doors: [fgcDoor(8.6, FGC.red), fgcDoor(26.4, FGC.red), fgcDoor(44.6, FGC.red)],
  paint: (c, g) => fgcPaint(g.L, { accent: FGC.red, band: [6.5, 3.3], roof: 11.6, skirt: 3.4 }),
  extra: () => underframe(14, 46, 3.4, { depth: 1.1, boxes: 2 }),
});

// --- Series 331 (Stadler GTW 2/6, 2016): the Lleida-La Pobla de Segur
// line's diesel railcars, two low-floor passenger sections hung from a
// short power module, 960 kW, 120 km/h; 88 seats. Drawn on the GTW's
// geometry, in FGC's colors.
export const fgc331Car = (c) => bilevel({ ...c, cabL: true, cabR: false }, {
  roof: 12.8, sill: 2.4, cornerR: 1.0, end: 0.6, noTrucks: true, badge: false, diaphragm: [2.6, 11.2], cabLen: 6,
  nose: [[1.0, 2.4], [1.0, 5.6], ["q", 1.1, 6.8, 1.8, 7.8], [3.6, 11.9], ["q", 4.2, 12.8, 5.6, 12.8]],
  rows: [{ xs: [11.6, 16.8, 30.2, 35.9, 41.5, 47.2, 52.8], y: 5.6, w: 4.3, h: 3.8, r: 0.45 }],
  doors: [fgcDoor(23.0, FGC.orange, 5.2)].map((d) => ({ ...d, y0: 2.1, y1: 9.6, glassY: 0.3, glassH: 0.55 })),
  roofItems: [[20, 8, 0.6], [38, 6, 0.6]],
  paint: (c, g) => fgcPaint(g.L, { band: [5.4, 4.2], roof: 11.8, skirt: 2.6 }) + rect(0, 2.6, 2.4, 9.2, FGC.band),
  cab: () => path(poly([[1.7, 7.9], [3.4, 11.2], [4.5, 11.2], [4.5, 7.9]]), C.glass) + win(5.6, 6.0, 4.2, 3.4, 0.5),
  extra: () => truck(9.2, { wb: 6.9, d: 30, top: 2.4 }),
});
export function fgc331Power(c) {
  // The power module: a short, tall box on its own truck, louvered sides
  // around the gangway through it, radiators on the roof.
  return bilevel({ ...c, cabL: false, cabR: false }, {
    roof: 13.4, sill: 3.4, cornerR: 0.6, end: 0.4, noTrucks: true, badge: false, diaphragm: [3.6, 11.6],
    paint: (c, g) => fgcPaint(g.L, { band: [6.2, 4.0], roof: 12.2, skirt: 4.0 }),
    extra: (c, g) => truck(g.L / 2, { wb: 7.2, d: 33, kind: "loco", top: 3.4 }) +
      rect(2.0, 6.2, g.L - 4.0, 4.0, "rgba(20,22,25,0.55)", 0.4) + slats(2.0, 6.2, g.L - 4.0, 4.0, 0.35, "rgba(255,255,255,0.18)") +
      rect(1.5, 13.35, g.L - 3, 0.8, C.steelDark, 0.4, 'rx="0.2"'),
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
