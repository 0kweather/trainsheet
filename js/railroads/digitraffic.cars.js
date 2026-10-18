// Finland's passenger cars (VR and the commuter trains, scripts/railroads/digitraffic.py):
// Trainsheet's own side views, built like carmodels.js's from each model's
// published dimensions, in VR's white and green (the capital region's FLIRTs
// in HSL's purple). Digitraffic's train locations name no vehicles, so each
// train is drawn as what typically runs on its line.

import { newId, bilevel, cabUnit, married, flirtCar, flirtMid } from "../carmodels.js?v=dev";
import { rect, path, poly, win, pantograph, C } from "../carart.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
const VR = { white: "#eef0f1", green: "#3fa535", deep: "#2b7a28", roof: "#9aa1a9", band: "#24282d", skirt: "#2a2d31" };
const HSL_PURPLE = "#8c4799";

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

// --- SLM/ABB Sr2 (VR 3201-3246, 1995-2003; Norway's El 18 is the same
// locomotive): the Swiss Re 460 "Lok 2000", 19.0 m (El 18 18.5 m), a cab
// at each end under a steeply raked, rounded windshield, smooth sides with a
// crew door behind each cab and a row of small louvers under the roof,
// bogies about 10 m apart on 1.1 m wheels, a pantograph over each end.
// Drawn in VR's scheme: white, green from the sill to the waist, rising
// over the nose under the windshield, a gray roof. paint(c) gives the
// colors { body, low, roof } for another railroad's.
export function lok2000(c, paint = () => ({ body: VR.white, low: VR.green, roof: VR.roof })) {
  return bothEnds(c, (h) => {
    const { body, low, roof: top } = paint(h);
    const L = h.L, sill = 4.1, roof = 12.9;
    return cabUnit(h, {
      roof, sill, rearR: 1.0,
      nose: [[1.7, sill], [1.05, 5.3], ["q", 0.85, 7.3, 1.7, 8.7], [4.1, 11.7], ["q", 5.0, roof, 6.9, roof]],
      base: body, trucks: { centers: 33.0, wb: 9.2, d: 43 },
      paint: () => rect(0, 0, L, 7.0, low) + path("M0 7.0L1.6 7.0Q4.2 7.4 6.4 8.4L6.4 0L0 0Z", low) + rect(0, roof - 0.55, L, 1, top) +
        rect(0, sill, L, 0.45, VR.skirt),
      glass: [[[1.95, 8.95], [4.15, 11.35], [5.55, 11.35], [5.55, 8.95]]],
      sideWin: [[6.3, 9.0, 1.7, 1.9]],
      doors: [[8.4, 2.3, sill + 0.35, 11.4]],
      grilles: [[12.0, 10.6, 18.0, 1.15, 0.3]],
      roofItems: [[L / 2 - 8, 16, 0.5]],
      extra: () => pantograph(16.0, roof, { up: h.half === 1, facing: -1 }),
    });
  });
}

// --- Siemens Vectron, VR Sr3 (3301-3380, 2016-2026): 19.05 m, a cab at
// each end behind a near-upright nose with a wide windshield, three big
// side panels between the crew doors, bogies 9.9 m apart on 1.25 m wheels.
// VR's white, the green rising in a broad sweep behind each cab.
const sr3 = (c) => bothEnds(c, (h) => {
  const L = h.L, sill = 4.0, roof = 12.8;
  return cabUnit(h, {
    roof, sill, rearR: 1.0,
    nose: [[1.5, sill], [1.25, 6.4], [1.55, 8.6], [2.7, 11.9], ["q", 3.0, roof, 4.0, roof]],
    base: VR.white, trucks: { centers: 32.5, wb: 9.4, d: 49 },
    paint: () => path(`M0 0L0 8.4L3.0 8.4Q9.0 8.4 13.5 6.2L${L} 5.6L${L} 0Z`, VR.green) + path("M13.5 6.2Q9.0 8.4 3.0 8.4L3.0 8.75Q9.4 8.75 14.2 6.45Z", VR.deep) +
      rect(0, roof - 0.55, L, 1, VR.roof) + rect(0, sill, L, 0.45, VR.skirt),
    glass: [[[1.75, 8.9], [2.75, 11.5], [5.6, 11.5], [5.6, 8.9]]],
    sideWin: [[6.3, 9.1, 1.6, 1.8]],
    doors: [[8.2, 2.3, sill + 0.35, 11.3]],
    panels: [[12.0, 6.6, 7.6, 4.9], [20.0, 6.6, 7.6, 4.9]],
    grilles: [[12.6, 9.6, 6.4, 1.4, 0.3], [20.6, 9.6, 6.4, 1.4, 0.3]],
    roofItems: [[L / 2 - 9, 18, 0.55]],
    extra: () => pantograph(15.5, roof, { up: h.half === 1, facing: -1 }),
  });
});

// --- Fiat/Alstom Sm3 Pendolino (VR, 18 six-car units 1995-2006, 14 in
// service): 158.9 m, each car about 26.5 m, a low tilting body (about 3.7 m
// to the roof, narrowing toward it); the end cars' long, pointed noses with
// the windshield far back; one plug door a side near the end of each car,
// small windows close together in a dark band. VR's colors: white, a green
// skirt sweeping up the nose under the windshield; the pantographs on the
// second and fifth cars.
const SM3 = { roof: 12.3, sill: 3.5, cornerR: 0.9, end: 0.6, trucks: { centers: 62.3, wb: 8.9, d: 35 }, diaphragm: [3.8, 11.2] };
const sm3Paint = (nose) => (c, g) => {
  const L = g.L;
  let s = rect(0, 0, L, 17, VR.white) + rect(0, 11.5, L, 2, VR.roof) + rect(0, 6.1, L, 3.55, VR.band) + rect(0, 0, L, 4.6, VR.green);
  // The nose: white over the band, the green swept up under the windshield.
  if (nose) s += rect(0, 6.1, 11.0, 3.55, VR.white) + path("M0 4.6L0 9.4L4.4 9.4Q8.0 8.4 11.0 6.1L11.0 4.6Z", VR.green);
  return s;
};
const sm3Door = (x) => ({ x, w: 2.9, y0: 3.7, y1: 10.6, glassY: 0.55, glassH: 0.3, grabs: false });
const sm3Cab = (c) => bilevel({ ...c, cabL: true }, { ...SM3,
  nose: [[2.6, 3.5], [1.0, 4.5], ["q", 0.35, 5.6, 1.7, 6.9], [8.0, 11.2], ["q", 9.8, 12.3, 12.6, 12.3]],
  rows: [{ xs: seq(14.6, 3.85, 17), y: 6.55, w: 2.75, h: 2.65, r: 0.35 }], doors: [sm3Door(c.L - 6.8)], cabLen: 12, badge: false,
  paint: sm3Paint(true),
  cab: () => path(poly([[3.0, 7.4], [8.0, 10.95], [10.6, 10.95], [10.6, 8.8], [6.0, 7.4]]), C.glass) +
    path(poly([[3.4, 7.65], [6.2, 9.6], [6.9, 9.6], [4.3, 7.65]]), C.glassLight),
});
const sm3Mid = (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...SM3,
  rows: [{ xs: seq(5.8, 3.85, 19), y: 6.55, w: 2.75, h: 2.65, r: 0.35 }], doors: [sm3Door(c.L - 6.8)], badge: false,
  paint: sm3Paint(false), roofItems: [[20, 14, 0.45]],
  extra: (c, g) => (c.pan ? pantograph(14.0, g.roof) : ""),
});

// --- Transtech double-deck InterCity cars (VR, since 1998): 26.4 m over
// the buffers, 5.2 m tall; a deep low floor between the bogies, the end
// sections over them at a middle level with the doors, one plug door a side
// at each end. Coaches carry eleven windows upstairs and ten downstairs;
// the sleeping cars (CEmt) a smaller window to each compartment on both
// decks. The driving trailers lead push-pull trains with a sloping cab in
// the upper end. VR's white with a green band low on the side and a gray
// roof.
const DD = { roof: 16.9, sill: 4.0, cornerR: 1.1, end: 0.6, trucks: { centers: 63.0, wb: 8.2, d: 33 }, diaphragm: [4.3, 11.6] };
const ddPaint = (c, g) => rect(0, 0, g.L, 18, VR.white) + rect(0, 15.6, g.L, 2, "#c3c8ce") + rect(0, 0, g.L, 4.75, VR.green) + rect(0, 4.75, g.L, 0.2, VR.deep);
const ddDoor = (x) => ({ x, w: 3.0, y0: 4.15, y1: 11.3, glassY: 0.55, glassH: 0.3 });
const ddRows = (up, low) => [{ xs: up, y: 11.9, w: 4.0, h: 2.55, r: 0.4 }, { xs: low, y: 5.0, w: 4.0, h: 2.55, r: 0.4 }];
const ddEnds = (L) => [{ xs: [6.4, L - 10.0], y: 8.0, w: 3.6, h: 2.4, r: 0.4 }];
const ddCoach = (c) => bilevel(c, { ...DD, drop: { a: 15.5, b: c.L - 15.5, y: 1.6 }, paint: ddPaint, badge: false,
  rows: [...ddRows(seq(17.6, 4.85, 11), seq(20.0, 4.85, 10)), ...ddEnds(c.L)], doors: [ddDoor(1.6), ddDoor(c.L - 4.6)] });
const ddSleeper = (c) => bilevel(c, { ...DD, drop: { a: 15.5, b: c.L - 15.5, y: 1.6 }, paint: ddPaint, badge: false,
  rows: [{ xs: seq(18.4, 6.4, 8), y: 12.2, w: 3.1, h: 2.2, r: 0.35 }, { xs: seq(18.4, 6.4, 8), y: 5.3, w: 3.1, h: 2.2, r: 0.35 }, ...ddEnds(c.L)],
  doors: [ddDoor(1.6), ddDoor(c.L - 4.6)] });
const ddCab = (c) => bilevel({ ...c, cabL: true }, { ...DD, drop: { a: 17.5, b: c.L - 15.5, y: 1.6 }, badge: false,
  nose: [[1.3, 4.0], [1.05, 7.4], ["q", 1.05, 9.6, 2.1, 11.0], [3.9, 15.2], ["q", 4.6, 16.9, 6.6, 16.9]],
  paint: (c, g) => ddPaint(c, g) + path("M0 3.9L0 11.0L2.3 11.0Q5.6 10.4 8.2 8.0L8.2 3.9Z", VR.green),
  rows: [...ddRows(seq(19.4, 4.85, 10), seq(21.6, 4.85, 9)), { xs: [c.L - 10.0], y: 8.0, w: 3.6, h: 2.4, r: 0.4 }],
  doors: [ddDoor(10.6), ddDoor(c.L - 4.6)], cabLen: 9,
  cab: () => path(poly([[2.5, 11.6], [4.1, 15.5], [7.6, 15.5], [7.6, 11.6]]), C.glass) + win(7.9, 8.2, 2.0, 2.2, 0.3),
});

// --- CAF Sm4 (VR, 30 two-car units, 1998-2005): two motor cars of 26.45 m,
// each with a pantograph, a rounded cab nose at the outer ends; two double
// doors a side on each car, toward its ends. VR's white, green below the
// windows and over the nose, a dark window band.
const SM4 = { roof: 12.8, sill: 3.8, cornerR: 1.0, end: 0.6, trucks: { centers: 61.0, wb: 8.9, d: 33 }, diaphragm: [4.0, 11.6], badge: false,
  nose: [[1.2, 3.8], [0.9, 5.6], ["q", 0.9, 7.4, 1.9, 8.6], [4.4, 11.8], ["q", 5.4, 12.8, 7.2, 12.8]], cabLen: 7,
  cab: () => path(poly([[2.1, 8.9], [4.5, 11.6], [6.4, 11.6], [6.4, 8.9]]), C.glass) + win(6.9, 7.4, 1.7, 2.6, 0.3) };
const sm4 = married((c) => bilevel(c, { ...SM4,
  paint: (c, g) => rect(0, 0, g.L, 17, VR.white) + rect(0, 12.0, g.L, 2, VR.roof) + rect(0, 6.9, g.L, 3.25, VR.band) + rect(0, 0, g.L, 5.6, VR.green) +
    path("M0 5.6L0 8.9L2.4 8.9Q4.6 7.4 6.2 6.9L6.2 5.6Z", VR.green),
  rows: [{ xs: [9.8], y: 7.1, w: 2.6, h: 2.85, r: 0.35 }, { xs: seq(22.5, 5.05, 8), y: 7.1, w: 4.1, h: 2.85, r: 0.35 }, { xs: [c.L - 9.3], y: 7.1, w: 4.1, h: 2.85, r: 0.35 }],
  doors: [{ x: 14.0, w: 4.6, y0: 3.9, y1: 10.9, leaves: 2, glassY: 0.4, glassH: 0.45 }, { x: c.L - 16.4, w: 4.6, y0: 3.9, y1: 10.9, leaves: 2, glassY: 0.4, glassH: 0.45 }],
  roofItems: [[24, 10, 0.4]],
  extra: (c, g) => (c.pan ? pantograph(g.L - 20, g.roof, { facing: -1 }) : ""),
}));

// --- Valmet Sm2 (VR, 1975-81, 50 built, about 34 left): a motor car with a
// pantograph and an unpowered driving trailer (Eioc), each 26.6 m, flat
// cab ends with two windshield panes; two double doors a side. White with
// a green band below the windows (refurbished cars).
const sm2 = married((c) => bilevel(c, {
  roof: 12.5, sill: 3.9, cornerR: 1.0, end: 0.6, trucks: { centers: 61.5, wb: 8.5, d: 36 }, diaphragm: [4.1, 11.4], badge: false,
  nose: [[0.8, 3.9], [0.7, 8.4], ["q", 0.75, 11.8, 1.4, 12.2], ["q", 1.8, 12.5, 2.8, 12.5]], cabLen: 5,
  paint: (c, g) => rect(0, 0, g.L, 17, VR.white) + rect(0, 11.6, g.L, 2, VR.roof) + rect(0, 4.3, g.L, 2.3, VR.green) + rect(0, 0, g.L, 4.3, VR.skirt),
  rows: [{ xs: [6.2], y: 7.3, w: 2.2, h: 2.6, r: 0.3 }, { xs: seq(21.0, 5.2, 9), y: 7.3, w: 4.3, h: 2.6, r: 0.3 }, { xs: [c.L - 8.6], y: 7.3, w: 4.3, h: 2.6, r: 0.3 }],
  doors: [{ x: 13.4, w: 4.8, y0: 4.0, y1: 10.9, leaves: 2, glassY: 0.4, glassH: 0.45 }, { x: c.L - 17.0, w: 4.8, y0: 4.0, y1: 10.9, leaves: 2, glassY: 0.4, glassH: 0.45 }],
  cab: () => win(1.0, 8.2, 1.5, 2.5, 0.3) + win(2.9, 7.6, 1.6, 2.6, 0.3),
  extra: (c, g) => (c.pan ? pantograph(g.L - 18, g.roof, { facing: -1 }) : ""),
}));

// --- ČKD Dm12 (VR 4401-4416, 2004-06): a 25.2 m diesel railcar with a cab
// at each end, two MAN engines under the floor; a double door a side behind
// each cab. White with a green skirt rising over the noses.
const dm12 = (c) => bothEnds(c, (h) => bilevel(h, {
  roof: 12.6, sill: 3.9, cornerR: 1.0, end: 0.6, trucks: { centers: 55.0, wb: 7.9, d: 33 }, diaphragm: [4.1, 11.4], badge: false,
  nose: [[1.2, 3.9], [1.0, 6.0], ["q", 1.0, 8.0, 2.0, 9.0], [3.5, 11.8], ["q", 4.1, 12.6, 5.6, 12.6]], cabLen: 6,
  paint: (c, g) => rect(0, 0, g.L, 17, VR.white) + rect(0, 11.8, g.L, 2, VR.roof) + rect(0, 0, g.L, 5.0, VR.green) +
    path("M0 5.0L0 8.6L2.2 8.6Q4.0 6.4 6.0 5.0Z", VR.green),
  rows: [{ xs: seq(14.6, 5.2, 6), y: 7.0, w: 4.2, h: 3.0, r: 0.35 }],
  doors: [{ x: 8.0, w: 4.4, y0: 3.9, y1: 10.9, leaves: 2, glassY: 0.4, glassH: 0.45 }],
  roofItems: [[16, 9, 0.45], [36, 4, 0.7]],
  cab: () => path(poly([[2.1, 9.2], [3.6, 11.5], [5.4, 11.5], [5.4, 9.2]]), C.glass),
}));

// --- Stadler FLIRT, Sm5 (81 four-car units, 2008-17, owned by the capital
// region's Pääkaupunkiseudun Junakalusto): 75.2 m, two cab sections and
// two intermediate ones on shared bogies, as carmodels.js draws the FLIRT;
// in HSL's purple, a pantograph on the third section.
const SM5 = { body: "#f2f3f4", top: HSL_PURPLE, line: HSL_PURPLE };
const sm5Cab = (c) => flirtIn(flirtCar(c), SM5);
const sm5Mid = (c) => flirtIn(flirtMid(c), SM5) + (c.pan ? pantograph(c.L / 2, 14.06) : "");

export const TYPES = {
  vrSr2: { name: "Sr2 electric locomotive", kind: "electric", pan: true },
  vrSr3: { name: "Sr3 (Siemens Vectron) electric locomotive", kind: "electric", pan: true },
  vrSm3Cab: { name: "Sm3 Pendolino end car", kind: "emu" },
  vrSm3Mid: { name: "Sm3 Pendolino car", kind: "emu", pan: true },
  vrEd: { name: "Double-deck InterCity coach", kind: "bilevel" },
  vrEdCab: { name: "Double-deck driving trailer", kind: "bilevel", cab: true },
  vrSleeper: { name: "Double-deck sleeping car", kind: "bilevel", amenities: ["sleepers"] },
  vrSm4: { name: "Sm4 electric car", kind: "emu", pan: true },
  vrSm2: { name: "Sm2 electric car", kind: "emu", pan: true },
  vrDm12: { name: "Dm12 diesel railcar", kind: "emu" },
  hslSm5Cab: { name: "Sm5 (Stadler FLIRT) cab section", kind: "emu", pan: true },
  hslSm5Mid: { name: "Sm5 (Stadler FLIRT) intermediate section", kind: "emu", pan: true },
};

const M = (draw, len, oneEnd = false) => ({ draw, len, oneEnd, variant: null });
export const MODELS = {
  vrSr2: M((c) => lok2000(c), 62.4),
  vrSr3: M(sr3, 62.5),
  vrSm3Cab: M(sm3Cab, 86.9, true),
  vrSm3Mid: M(sm3Mid, 86.9),
  vrEd: M(ddCoach, 86.6),
  vrEdCab: M(ddCab, 86.6, true),
  vrSleeper: M(ddSleeper, 86.6),
  vrSm4: M(sm4, 86.8),
  vrSm2: M(sm2, 87.3),
  vrDm12: M(dm12, 82.7),
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
  vr: [[3201, 3246, "vrSr2"], [3301, 3380, "vrSr3"], [7101, 7118, "vrSm3Cab"], [7201, 7218, "vrSm3Mid"], [7301, 7318, "vrSm3Mid"],
    [7401, 7418, "vrSm3Mid"], [7501, 7518, "vrSm3Mid"], [7601, 7618, "vrSm3Cab"], [4401, 4416, "vrDm12"], ...SM4_SM2,
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
const IC_SET = (loco) => set(`${loco === "vrSr2" ? "Sr2" : "Sr3"} locomotive with double-deck InterCity coaches`, [loco, 1], ["vrEd", 6]);
const IC_PUSH = set("Sr3 locomotive with double-deck coaches and a driving trailer", ["vrSr3", 1], ["vrEd", 4], ["vrEdCab", 1]);
const NIGHT = set("Sr2 locomotive with double-deck sleeping cars and coaches", ["vrSr2", 1], ["vrSleeper", 4], ["vrEd", 2]);
const SM4_SET = set("Two two-car Sm4 units", ["vrSm4", 4]);
const SM2_SET = set("Two-car Sm2 units, often two together", ["vrSm2", 4]);
const SM5_SET = set("Four-section Sm5 FLIRT", ["hslSm5Cab", 1], ["hslSm5Mid", 2], ["hslSm5Cab", 1]);
const DM12_SET = set("Dm12 diesel railcar", ["vrDm12", 1]);
const DM12_ENDS = /Nurmes|Savonlinna|Parikkala|Keuruu|Haapamäki|Seinäjoki|Jyväskylä/;
const BY_TYPE = { vrSr2: IC_SET("vrSr2"), vrSr3: IC_SET("vrSr3"), vrSm3Cab: SM3_SET, vrSm3Mid: SM3_SET, vrEd: IC_SET("vrSr3"), vrEdCab: IC_PUSH,
  vrSleeper: NIGHT, vrSm4: SM4_SET, vrSm2: SM2_SET, vrDm12: DM12_SET, hslSm5Cab: SM5_SET, hslSm5Mid: SM5_SET };
export const TYPICAL = {
  vr: (t, reported) => {
    if (BY_TYPE[reported]) return BY_TYPE[reported];
    switch (t.route) {
      case "Pendolino": return SM3_SET;
      case "InterCity": return IC_SET("vrSr3");
      case "Night train": return NIGHT;
      case "Regional": return DM12_ENDS.test(`${t.origin || ""} ${t.destination || ""}`) && !/Helsinki|Tampere/.test(`${t.origin || ""} ${t.destination || ""}`) ? DM12_SET : SM4_SET;
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
  hslSm5Cab: { model: "Stadler FLIRT (Sm5)", type: "Electric multiple unit", builder: "Stadler Rail", built: "2008–2017",
    fleet: "81 four-car units", topSpeedMph: 99.4, powerHp: 2682, lengthFt: 246.7,
    about: "The capital region's commuter trains, owned by Pääkaupunkiseudun Junakalusto, leased to HSL and run by VR. They serve every HSL line, including the Ring Rail Line to the airport, and wear HSL's purple.",
    source: WIKI + "VR_Class_Sm5" },
};
// A unit's other cars share its sheet, named for the part they are.
const part = (facts, name) => ({ ...facts, model: `${facts.model}, ${name}` });
FACTS.vrSm3Mid = part(FACTS.vrSm3Cab, "middle car");
FACTS.hslSm5Mid = part(FACTS.hslSm5Cab, "intermediate section");
