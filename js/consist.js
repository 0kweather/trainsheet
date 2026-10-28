import { MODELS } from "./carmodels.js?v=dev";
import { PX_PER_FT, HEIGHT_FT, locoCoupler } from "./carart.js?v=dev";
import { addLogos } from "./emblems.js?v=dev";
import { AGENCIES as PLUGINS, SOURCES as PLUGIN_SOURCES } from "./railroads/index.js?v=dev";

// What a train is made of.
//   - Live, from the car numbers a railroad reports: SEPTA lists every car in
//     the train, in order; LIRR and MBTA name one car of each train (not
//     necessarily the front one). Car numbers are matched against each
//     railroad's published fleet roster (number ranges by model); a number
//     outside every range isn't drawn.
//   - Otherwise, the equipment that typically runs on the train's route,
//     always labeled as typical. Sources: the railroads' published equipment
//     assignments as summarized on each route's Wikipedia page.
// The drawings (carmodels.js) are Trainsheet's own side views, built from each
// model's published dimensions.

// [first, last, type]
const FLEETS = {
  // Trinity Railway Express: F59PHs 120-126, F40PH-2s 130-131, F59PHIs
  // 569-570; BiLevel cab cars 1002-1009, coaches 1048-1064.
  tre: [[120, 126, "f59ph"], [130, 131, "f40"], [569, 570, "f59"], [1002, 1009, "bilevelCab"], [1048, 1064, "bilevel"]],
  // Coaster: SC-44s 5001-5009; BiLevel coaches, cab cars 2301-2310 and the
  // CEM cab cars 421-423.
  coaster: [[5001, 5009, "charger"], [2201, 2208, "bilevel"], [2401, 2406, "bilevel"], [2501, 2504, "bilevel"], [42101, 42108, "bilevel"],
    [2301, 2310, "bilevelCab"], [421, 423, "bilevelCab"]],
  sprinter: [[4001, 4012, "desiro"]],
  upx: [[1001, 1012, "upxCar"], [3001, 3006, "upxMid"]],
  ontarionorthland: [[1800, 1809, "gp38"], [203, 203, "onApu"], [416, 417, "onBaggage"], [650, 661, "onCoach"], [750, 750, "onDiner"]],
  // Alaska Railroad (its roster, alaskarails.org, September 2026): HEP
  // SD70MACs 4317-4328, GP40-2s 3001-3015; baggage cars 100-103, coaches
  // 205-210, café 301, diners 401 and 451-452, Budd domes 521-523, GoldStar
  // domes 651-656, DMU 751.
  alaska: [[4317, 4328, "sd70mac"], [3001, 3015, "gp402"], [100, 103, "akBaggage"], [205, 210, "akCoach"], [301, 301, "akDiner"],
    [401, 401, "akDiner"], [451, 452, "akDiner"], [521, 523, "akDome"], [651, 656, "akGoldStar"], [751, 751, "akDmu"]],
  star: [[120, 122, "f40"], [381, 381, "f40"], [701, 733, "gallery"], [790, 795, "galleryCab"]],
  texrail: [[101, 108, "flirtCar"]],
  silverline: [[901, 908, "flirtCar"]],
  atrain: [[101, 111, "gtwCar"]],
  septa: [
    [101, 188, "silverliner4"], [276, 460, "silverliner4"],
    [701, 738, "silverliner5"], [801, 882, "silverliner5"],
    [901, 915, "acs64"],
    [2401, 2410, "pushPullCab"], [2501, 2525, "pushPullCoach"], [2550, 2559, "pushPullCoach"],
  ],
  lirr: [
    [7001, 7836, "m7"], [9001, 9202, "m9"], [9771, 9946, "m3"],
    [5001, 5023, "c3Cab"], [4001, 4134, "c3"],
    [400, 423, "de30ac"], [500, 522, "dm30ac"],
  ],
  mbta: [
    [10, 11, "mp36"], [1025, 1036, "f40c"], [1050, 1075, "f40c"],
    [1115, 1139, "gp40"], [1776, 1776, "gp40"], [2000, 2039, "hsp46"],
    [1700, 1724, "kawasakiCab"], [1800, 1870, "rotemCab"],
    [700, 781, "bilevel"], [800, 886, "bilevel"], [900, 932, "bilevel"],
    [1500, 1533, "singleCab"], [1600, 1652, "single"],
    [200, 258, "single"], [350, 389, "single"], [500, 542, "single"], [600, 653, "single"],
  ],
  // MARC (Wikipedia, "MARC Train", 2026): MP36PH-3C 10-35, GP39PH-3C 70-75,
  // SC-44 80-87, HHP-8 4910-4915 (4914 stripped for parts); MARC II coaches
  // 7700-7735 and 7791-7799, cab cars 7745-7756 (stored) and 7757-7762;
  // Kawasaki bi-levels 7800-7896, MultiLevels 8000-8094.
  marc: [
    [10, 35, "mp36"], [70, 75, "gp39"], [80, 87, "charger"], [4910, 4913, "hhp8"], [4915, 4915, "hhp8"],
    [7700, 7735, "marcII"], [7791, 7799, "marcII"], [7745, 7762, "marcIICab"],
    [7800, 7834, "bilevel"], [7845, 7858, "bilevelCab"], [7870, 7876, "bilevel"], [7890, 7896, "bilevel"],
    [8000, 8034, "multilevel"], [8045, 8059, "multilevelCab"], [8090, 8094, "multilevel"],
  ],
  // GO Transit (Wikipedia, "GO Transit rolling stock"): MP40PH-3C 600-666
  // except 647, rebuilt as the prototype MP54AC; new MP54ACs 667-682.
  // BiLevel coaches 2000-2857 and 4000-4225, 4500-4533 (Series IX); the new
  // CEM cab cars 300-380; the older cab cars still in service in 2026,
  // Series II 200-214 (rebuilt as cab cars 2022-23), VII 242-250
  // (refurbished 2025-26) and VIII 251-257. (215-241 are coaches now.)
  go: [
    [600, 646, "mp40"], [647, 647, "mp54ac"], [648, 666, "mp40"], [667, 682, "mp54ac"],
    [300, 380, "bilevelCab"], [200, 214, "goOldCab"], [242, 257, "goOldCab"],
    [2000, 2857, "bilevel"], [4000, 4225, "bilevel"], [4500, 4533, "bilevel"],
  ],
  // CT Rail (Wikipedia, "Hartford Line" and "Shore Line East"): P40DC
  // 6700-6711, GP40-3H 6694-6699; Mafersa cab cars 1701-1719 (odd) and
  // coaches 1730-1774 (even). The M8s Shore Line East ran in 2022-26 came
  // from the shared Metro-North pool.
  ctrail: [
    [6700, 6711, "p40"], [6694, 6699, "gp40h"],
    [1701, 1719, "mafersaCab"], [1730, 1774, "mafersa"],
    [9101, 9580, "m8"],
  ],
  // South Shore Line (Wikipedia, "South Shore Line"): Nippon Sharyo
  // single-level cars 1-48 and 101-110, trailers 201-210; Highliner II
  // bi-levels 301-314 and 1201-1226 (from Metra). The feed names one car.
  southshore: [
    [1, 48, "nsEmu"], [101, 110, "nsEmu"], [201, 210, "nsTrailer"],
    [301, 314, "highliner"], [1201, 1226, "highliner"],
  ],
  // SunRail (Wikipedia, "SunRail", and photos of the cars' numbers): MP32PH-Q
  // 100-110; BiLevel cab cars 2000-2012, coaches 3000-3009. The feed names
  // the locomotive and the cab car.
  sunrail: [
    [100, 110, "mp32"], [2000, 2012, "bilevelCab"], [3000, 3009, "bilevel"],
  ],
  // VRE (Wikipedia, "Virginia Railway Express"): MP36PH-3C V50-V69; Gallery
  // IV cab cars 710-730 and coaches 800-879 (the cars carry a "V" before the
  // number).
  vre: [
    [50, 69, "mp36"], [710, 730, "galleryCab"], [800, 879, "gallery"],
  ],
  // Sounder (Wikipedia, "Sounder commuter rail"; Sound Transit, June 2026):
  // F59PHI 901-911, MP40PH-3C 921-923; BiLevel cab cars with the older cab
  // 101-111 and 301-307, with the crash-energy-management cab 321-332
  // (330-332 Alstom-built, 2026); coaches 201-240 and 401-418.
  sounder: [
    [901, 911, "f59"], [921, 923, "mp40"],
    [101, 111, "bilevelCab"], [301, 307, "bilevelCab"], [321, 332, "sounderCemCab"],
    [201, 240, "bilevel"], [401, 418, "bilevel"],
  ],
  // New Mexico Rail Runner Express: MP36PH-3C 101-109; BiLevel coaches
  // 1001-1013 and cab cars 1101-1109.
  railrunner: [
    [101, 109, "mp36"], [1001, 1013, "bilevel"], [1101, 1109, "bilevelCab"],
  ],
  // ACE (Wikipedia, "Altamont Corridor Express"): F40PH-3C 3101-3106 (3101
  // and 3106 stored), SC-44 Chargers 3110-3115; BiLevel VI coaches
  // 3201-3222 and cab cars 3301-3308, BiLevel IX coaches from 3223 and cab
  // cars 3310-3314. The feed reports the locomotive's number.
  ace: [
    [3101, 3106, "f40c"], [3110, 3115, "charger"],
    [3201, 3234, "bilevel"], [3301, 3308, "bilevelCab"], [3310, 3314, "bilevelCab"],
  ],
  // exo (Wikipedia, "Exo commuter rail"): F59PHI 1320-1330, F59PH
  // 1341-1345, ALP-45DP 1350-1369, Siemens Chargers ("EC-42") 1400-1409;
  // BiLevel cab cars 2000-2003 and coaches 2020-2037; CRRC bi-level cab cars
  // 2050-2057 and coaches 2100-2135; MultiLevel cab cars 3000-3025 and
  // coaches 3026-3159 (160 cars in the 3000s, 26 of them cab cars).
  exo: [
    [1320, 1330, "f59"], [1341, 1345, "f59ph"], [1350, 1369, "alp45"], [1400, 1409, "charger"],
    [2000, 2003, "bilevelCab"], [2020, 2037, "bilevel"], [2050, 2057, "crrcBilevelCab"], [2100, 2135, "crrcBilevel"],
    [3000, 3025, "multilevelCab"], [3026, 3159, "multilevel"],
  ],
};

// name: what it's called; kind: how it's drawn. Flags: pan (pantograph),
// cab (driving cab), emu (powered car with cabs at the train's ends),
// rows2 (two rows of small windows), dome, baggage, lounge (big upper
// windows), paint (body color, for locomotives not in the railroad's color).
const TYPES = {
  // Locomotives
  acs64: { name: "ACS-64 electric locomotive", kind: "electric", pan: true },
  alp46: { name: "ALP-46 electric locomotive", kind: "electric", pan: true },
  alp45: { name: "ALP-45DP dual-mode locomotive", kind: "diesel", pan: true },
  acelaPower: { name: "Avelia Liberty power car", kind: "electric", pan: true, paint: "#e6eaee" },
  genesis: { name: "P42 Genesis locomotive", kind: "diesel" },
  p40: { name: "P40DC Genesis locomotive", kind: "diesel" },
  alc42: { name: "ALC-42 Charger locomotive", kind: "diesel" },
  alc42e: { name: "ALC-42E Charger locomotive", kind: "diesel" },
  charger: { name: "Siemens Charger locomotive", kind: "diesel" },
  p32: { name: "P32AC-DM dual-mode locomotive", kind: "diesel" },
  f59: { name: "F59PHI locomotive", kind: "diesel" },
  f59ph: { name: "F59PH diesel locomotive", kind: "diesel" },
  de30ac: { name: "DE30AC diesel locomotive", kind: "diesel" },
  dm30ac: { name: "DM30AC dual-mode locomotive", kind: "diesel" },
  mp36: { name: "MP36PH diesel locomotive", kind: "diesel" },
  mp40: { name: "MP40PH-3C diesel locomotive", kind: "diesel" },
  mp54ac: { name: "MP54AC diesel locomotive", kind: "diesel" },
  f40: { name: "F40PH diesel locomotive", kind: "diesel" },
  f40c: { name: "F40PH-3C diesel locomotive", kind: "diesel" },
  f40phm: { name: "F40PHM-3 diesel locomotive", kind: "diesel" },
  gp40: { name: "GP40MC diesel locomotive", kind: "diesel" },
  gp40h: { name: "GP40-3H diesel locomotive", kind: "diesel" },
  mp32: { name: "MP32PH-Q diesel locomotive", kind: "diesel" },
  pl42: { name: "PL42AC diesel locomotive", kind: "diesel" },
  hsp46: { name: "HSP46 diesel locomotive", kind: "diesel" },
  bl36: { name: "BL36PH diesel locomotive", kind: "diesel" },
  f125: { name: "F125 diesel locomotive", kind: "diesel" },
  sd70mach: { name: "SD70MACH diesel locomotive", kind: "diesel" },
  sd70mac: { name: "SD70MAC diesel locomotive", kind: "diesel" },
  gp38: { name: "GP38-2 diesel locomotive", kind: "diesel" },
  gp402: { name: "GP40-2 diesel locomotive", kind: "diesel" },
  gp39: { name: "GP39PH-3C diesel locomotive", kind: "diesel" },
  hhp8: { name: "HHP-8 electric locomotive", kind: "electric", pan: true },
  // Electric and diesel multiple units
  silverliner4: { name: "Silverliner IV", kind: "emu", pan: true },
  silverliner5: { name: "Silverliner V", kind: "emu", pan: true },
  m7: { name: "M7", kind: "emu" },
  m7a: { name: "M7A", kind: "emu" },
  m8: { name: "M8", kind: "emu", pan: true },
  m9: { name: "M9", kind: "emu" },
  m3: { name: "M3", kind: "emu" },
  arrow3: { name: "Arrow III", kind: "emu", pan: true },
  arrow3Single: { name: "Arrow III single car", kind: "emu", pan: true },
  nsEmu: { name: "Nippon Sharyo electric car", kind: "emu", pan: true },
  highliner: { name: "Highliner", kind: "bilevel", emu: true, pan: true },
  kiss: { name: "Stadler KISS car", kind: "bilevel", emu: true, pan: true },
  kissCab: { name: "Stadler KISS cab car", kind: "bilevel", emu: true },
  rdc: { name: "Budd Rail Diesel Car", kind: "emu" },
  smartDmu: { name: "Nippon Sharyo railcar", kind: "emu" },
  upxCar: { name: "Nippon Sharyo railcar", kind: "emu" },
  upxMid: { name: "Nippon Sharyo intermediate railcar", kind: "emu" },
  gtwCar: { name: "Stadler GTW passenger section", kind: "emu" },
  gtwPower: { name: "Stadler GTW power module", kind: "module" },
  flirtCar: { name: "Stadler FLIRT passenger section", kind: "emu" },
  flirtMid: { name: "Stadler FLIRT intermediate section", kind: "emu" },
  desiro: { name: "Siemens Desiro car", kind: "emu" },
  flirtPower: { name: "Stadler FLIRT power module", kind: "module" },
  // Single-level coaches
  pushPullCab: { name: "Bombardier cab car", kind: "coach", cab: true },
  pushPullCoach: { name: "Bombardier coach", kind: "coach" },
  singleCab: { name: "Single-level cab car", kind: "coach", cab: true },
  single: { name: "Single-level coach", kind: "coach" },
  acelaCoach: { name: "Avelia Liberty coach", kind: "coach" },
  amfleet: { name: "Amfleet I coach", kind: "coach" },
  amfleet2: { name: "Amfleet II coach", kind: "coach" },
  amfleetBusiness: { name: "Amfleet I business class car", kind: "coach" },
  amfleetCafe: { name: "Amfleet I cafe car", kind: "coach" },
  metrolinerCab: { name: "Metroliner cab car", kind: "coach", cab: true },
  viewlinerBaggage: { name: "Viewliner baggage car", kind: "coach", baggage: true },
  viewlinerSleeper: { name: "Viewliner sleeping car", kind: "coach", rows2: true },
  viewlinerDiner: { name: "Viewliner dining car", kind: "coach" },
  venture: { name: "Venture coach", kind: "coach" },
  ventureCab: { name: "Venture cab car", kind: "coach", cab: true },
  shoreliner: { name: "Shoreliner coach", kind: "coach" },
  shorelinerCab: { name: "Shoreliner cab car", kind: "coach", cab: true },
  mafersa: { name: "Mafersa coach", kind: "coach" },
  mafersaCab: { name: "Mafersa cab car", kind: "coach", cab: true },
  marcII: { name: "MARC II coach", kind: "coach" },
  marcIICab: { name: "MARC II cab car", kind: "coach", cab: true },
  nsTrailer: { name: "Nippon Sharyo trailer car", kind: "coach" },
  comet5: { name: "Comet V coach", kind: "coach" },
  comet5Cab: { name: "Comet V cab car", kind: "coach", cab: true },
  coach: { name: "Coach", kind: "coach" },
  buddBaggage: { name: "Baggage car", kind: "coach", baggage: true },
  buddCoach: { name: "Stainless coach", kind: "coach" },
  buddDiner: { name: "Dining car", kind: "coach" },
  buddSleeper: { name: "Sleeping car", kind: "coach", rows2: true },
  skyline: { name: "Skyline dome car", kind: "coach", dome: true },
  parkCar: { name: "Park observation car", kind: "coach", dome: true },
  talgo: { name: "Talgo Series 8 coach", kind: "talgo" },
  talgoBusiness: { name: "Talgo Series 8 business class car", kind: "talgo" },
  talgoLounge: { name: "Talgo Series 8 lounge car", kind: "talgo" },
  talgoBistro: { name: "Talgo Series 8 bistro car", kind: "talgo" },
  talgoBag: { name: "Talgo Series 8 baggage car", kind: "talgo", baggage: true },
  talgoCab: { name: "Talgo Series 8 cab car", kind: "talgo", cab: true },
  airoBusiness: { name: "Airo business class car", kind: "coach" },
  airoCafe: { name: "Airo café car", kind: "coach" },
  airoCoach: { name: "Airo coach", kind: "coach" },
  airoCab: { name: "Airo cab car (coach and baggage)", kind: "coach", cab: true },
  renaissanceCoach: { name: "Renaissance coach", kind: "coach" },
  renaissanceSleeper: { name: "Renaissance sleeping car", kind: "coach", rows2: true },
  renaissanceDiner: { name: "Renaissance service car", kind: "coach" },
  // Bi-levels
  c3Cab: { name: "C3 bi-level cab car", kind: "bilevel", cab: true },
  c3: { name: "C3 bi-level coach", kind: "bilevel" },
  kawasakiCab: { name: "Kawasaki bi-level cab car", kind: "bilevel", cab: true },
  rotemCab: { name: "Rotem bi-level cab car", kind: "bilevel", cab: true },
  bilevel: { name: "Bi-level coach", kind: "bilevel" },
  bilevelCab: { name: "Bi-level cab car", kind: "bilevel", cab: true },
  superlinerCoach: { name: "Superliner coach", kind: "bilevel" },
  superlinerSleeper: { name: "Superliner sleeping car", kind: "bilevel" },
  superlinerDiner: { name: "Superliner dining car", kind: "bilevel" },
  superlinerLounge: { name: "Superliner Sightseer Lounge", kind: "bilevel", lounge: true },
  californiaCar: { name: "California Car", kind: "bilevel" },
  californiaCab: { name: "California Car cab car", kind: "bilevel", cab: true },
  surfliner: { name: "Surfliner car", kind: "bilevel" },
  surflinerCab: { name: "Surfliner cab car", kind: "bilevel", cab: true },
  gallery: { name: "Gallery car", kind: "bilevel" },
  galleryCab: { name: "Gallery cab car", kind: "bilevel", cab: true },
  multilevel: { name: "MultiLevel coach", kind: "bilevel" },
  multilevelCab: { name: "MultiLevel cab car", kind: "bilevel", cab: true },
  crrcBilevel: { name: "CRRC bi-level coach", kind: "bilevel" },
  crrcBilevelCab: { name: "CRRC bi-level cab car", kind: "bilevel", cab: true },
  goOldCab: { name: "Bi-level cab car (older cab)", kind: "bilevel", cab: true },
  sounderCemCab: { name: "Bi-level cab car (crash-energy-management cab)", kind: "bilevel", cab: true },
  // Alaska Railroad and Ontario Northland
  akCoach: { name: "Coach", kind: "coach" },
  akDiner: { name: "Café or dining car", kind: "coach" },
  akBaggage: { name: "Baggage car", kind: "coach", baggage: true },
  akDome: { name: "Budd dome coach", kind: "coach", dome: true },
  akGoldStar: { name: "GoldStar dome car", kind: "coach", dome: true },
  akDmu: { name: "Colorado Railcar DMU", kind: "emu" },
  akCab: { name: "Cab car (rebuilt F40PH)", kind: "diesel" },
  onCoach: { name: "Rebuilt RTC-85 coach", kind: "coach" },
  onDiner: { name: "Rebuilt RTC-85 dining car", kind: "coach" },
  onBaggage: { name: "Baggage car", kind: "coach", baggage: true },
  onApu: { name: "Power car (rebuilt F9B)", kind: "diesel" },
  chainCar: { name: "Flat car with vehicles", kind: "freight" },
  boxcar: { name: "Boxcar (freight and mail)", kind: "freight" },
  // Other
  autorack: { name: "Auto carrier", kind: "autorack" },
};

for (const [key, type] of Object.entries(TYPES)) type.key = key;

// ---------- Plug-in railroads' cars ----------
// A railroad added as a plug-in keeps its cars in its own file,
// js/railroads/<id>.cars.js, named by "cars" in its AGENCIES entry
// (scripts/railroads/<id>.py): true for the plug-in's own id, or another
// plug-in's id to share its file. It is loaded the first time one of that
// railroad's trains or its fleet is drawn (consistOf gives null until then,
// and onCars' callback redraws), and may export:
//   TYPES:   { key: { name, kind, ...flags } }, as TYPES above;
//   MODELS:  { key: { draw(ctx), len, oneEnd, variant } }, as carmodels.js's
//            MODELS (len in feet over the couplers, or a function of the
//            agency; draw from carmodels.js's builders and carart.js);
//   FLEETS:  { agency: [[first, last, key], ...] }, as FLEETS above;
//   TYPICAL: { agency: (t, reported) => ({ label, units: [[key, count], ...] }) or null },
//            as typicalFor's cases (built-in keys work too);
//   FACTS:   { "key", "key@agency", "key@agency/route": fact sheet }, as
//            data/models.json's entries (model, type, builder, built, fleet,
//            topSpeedMph, powerHp, seats, lengthFt, about, source); a car of
//            the built-in "coach" type, or of none known, looks up "coach@agency";
//   LOGOS:   more logos, as in emblems.js.
// Built-in keys and railroads stay as they are: an entry naming one is skipped.
const TYPICAL = {}, FACTS = {};
const carsLoads = new Map(); // file -> promise of true once its cars are in
const carsDone = new Set();
let carsListener = null;
const carsFile = (agency) => {
  const own = PLUGINS[agency]?.cars;
  if (!own) return null;
  return typeof own === "string" ? own : PLUGIN_SOURCES.find((s) => s.agencies.includes(agency))?.module || agency;
};
// fn(agency) runs when a railroad's cars have loaded.
export const onCars = (fn) => (carsListener = fn);
// Loads a plug-in railroad's cars (a promise), or null for one with none.
export function loadCars(agency) {
  const file = carsFile(agency);
  if (!file) return null;
  if (!carsLoads.has(file)) {
    carsLoads.set(file, import(`./railroads/${file}.cars.js?v=dev`).then((m) => {
      addCars(m);
      carsDone.add(file);
      carsListener?.(agency);
      return true;
    }).catch((err) => { console.warn("cars", file, err); return false; }));
  }
  return carsLoads.get(file);
}
function addCars(m) {
  for (const [key, type] of Object.entries(m.TYPES || {})) if (!TYPES[key]) TYPES[key] = { ...type, key };
  for (const [key, model] of Object.entries(m.MODELS || {})) if (!MODELS[key]) MODELS[key] = model;
  for (const [agency, ranges] of Object.entries(m.FLEETS || {})) if (PLUGINS[agency] && !FLEETS[agency]) FLEETS[agency] = ranges;
  for (const [agency, fn] of Object.entries(m.TYPICAL || {})) if (PLUGINS[agency] && !TYPICAL[agency]) TYPICAL[agency] = fn;
  for (const [agency, fn] of Object.entries(m.FORMATION || {})) if (PLUGINS[agency] && !FORMATION[agency]) FORMATION[agency] = fn;
  for (const [id, facts] of Object.entries(m.FACTS || {})) FACTS[id] ??= facts;
  addLogos(m.LOGOS);
}
// A plug-in model's fact sheet (app.js looks here after data/models.json).
export const pluginFacts = (id) => FACTS[id] || null;

const LOCOMOTIVE = new Set(["diesel", "electric"]);
// A railroad whose feed gives each car's model and class as well as its
// number (Switzerland's Train Formation Service: "WRB6(502)", an ADLER's
// "Ath150", often with no number at all): its car file's FORMATION[agency]
// names each car's drawing, (car, i, cars) => TYPES key, car being
// { number, cls, model, order, unit, side } (unit and side where the feed
// gives them: iRail's SNCB compositions, which unit of the train a vehicle
// belongs to, 1 first, and its orientation, "LEFT" or "RIGHT").
const FORMATION = {};
function formationKey(t, i) {
  const f = FORMATION[t.agency];
  if (!f || !t.cars?.models) return null;
  const cars = t.cars.numbers.map((number, j) => ({ number: number || null, cls: t.cars.classes?.[j] ?? null, model: t.cars.models[j] ?? null, order: t.cars.orders?.[j] ?? null,
    unit: t.cars.units?.[j] ?? null, side: t.cars.sides?.[j] ?? null }));
  const key = f(cars[i], i, cars);
  return key && TYPES[key] ? key : null;
}

// Light, nearly colorless paint (stainless, silver, white) dims in dark mode
// by --car-neutral-dim, as it would under softer light; every livery color
// is left exactly as painted.
function themable(svg) {
  return svg.replace(/(fill|stroke)="#([0-9a-f]{3}|[0-9a-f]{6})"/gi, (m, prop, hex) => {
    const h = hex.length === 3 ? [...hex].map((x) => x + x).join("") : hex;
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    const max = Math.max(r, g, b);
    if (max < 0.55 || max - Math.min(r, g, b) > 0.12) return m;
    return `${m} style="${prop}:color-mix(in srgb, #${h}, #000 var(--car-neutral-dim, 0%))"`;
  });
}
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function typeOf(agency, number) {
  const n = Number(number);
  if (!Number.isInteger(n)) return null;
  const hit = (FLEETS[agency] || []).find(([a, b]) => n >= a && n <= b);
  // A type with no drawing yet (TYPES lacks it) isn't matched.
  return hit && TYPES[hit[2]] ? hit[2] : null;
}

// ---------- Typical equipment by route ----------
// { label, units: [[type, count], ...] }

const set = (label, ...units) => ({ label, units });

// Each route's usual train, from its Wikipedia page's equipment section
// (read October 2026) and Amtrak's and the states' 2025-26 news. Long-
// distance trains: two locomotives, which rarely match (a new ALC-42 Charger
// usually leads an older P42 Genesis); the cars from the locomotives back.
const LD_PAIR = [["alc42", 1], ["genesis", 1]];
const SUPERLINER_LD = set("ALC-42 and Genesis locomotives with Superliner cars",
  ...LD_PAIR, ["viewlinerBaggage", 1], ["superlinerSleeper", 3], ["superlinerDiner", 1], ["superlinerLounge", 1], ["superlinerCoach", 3]);
// Empire Service, Adirondack, Maple Leaf: a P32AC-DM (a P42 takes over at
// Albany) with an Amfleet club car (business class and café) and coaches.
const EMPIRE = set("P32AC-DM locomotive with Amfleet coaches and a club car", ["p32", 1], ["amfleetBusiness", 1], ["amfleet", 4]);
const NEC_DIESEL = (cars) => set("Genesis or ALC-42 locomotive with Amfleet coaches, business class and café", ["genesis", 1], ...cars);
// Midwest Venture sets run with a Charger at each end.
const MIDWEST = set("Charger locomotives with Venture coaches", ["charger", 1], ["venture", 5], ["charger", 1]);
// Hiawatha: WisDOT's Venture coaches and cab cars arrive September to
// November 2026 (five coaches and a cab car a set); until then Amfleet
// coaches and a cab unit.
const HIAWATHA = set("Charger locomotive with Venture coaches and a cab car (the new cars coming into service fall 2026)", ["charger", 1], ["venture", 5], ["ventureCab", 1]);
// Missouri and Illinois trains mix Venture and Amfleet coaches behind one
// Charger, with an Amfleet business class and café car.
const RIVER = set("Charger locomotive with Amfleet coaches and a business class and café car (some trains Venture coaches)",
  ["charger", 1], ["amfleetBusiness", 1], ["amfleet", 4]);
const PRAIRIE = set("Charger locomotive with Venture coaches and an Amfleet business class and café car",
  ["charger", 1], ["venture", 3], ["amfleetBusiness", 1]);
// CN keeps single-level cars off its line south of Chicago: seven Superliner
// coaches, one of them with a café.
const ILLINI = set("Charger locomotive with Superliner coaches", ["charger", 1], ["superlinerCoach", 7]);
// Amtrak Cascades: the Airo trainsets run trains 503, 508, 516 and 519
// (Amtrak, September 2026); the rest have one of Oregon's two Talgo Series 8
// sets (some an interim set of Amfleet coaches) behind a WSDOT SC-44.
const CASCADES_AIRO = new Set(["503", "508", "516", "519"]);
const AIRO_SET = set("ALC-42E or SC-44 Charger with a six-car Airo trainset",
  ["alc42e", 1], ["airoBusiness", 1], ["airoCafe", 1], ["airoCoach", 3], ["airoCab", 1]);
const TALGO_SET = set("SC-44 Charger with a Talgo Series 8 trainset, 13 cars (some trains Amfleet coaches)",
  ["charger", 1], ["talgoBag", 1], ["talgoBusiness", 2], ["talgoLounge", 1], ["talgoBistro", 1], ["talgo", 7], ["talgoCab", 1]);

const AMTRAK = {
  "Acela": set("Avelia Liberty trainset (some trips still use the original Acela Express)", ["acelaPower", 1], ["acelaCoach", 9], ["acelaPower", 1]),
  "Northeast Regional": set("ACS-64 locomotive with an Amfleet business class car, cafe and coaches (diesel south of Washington)", ["acs64", 1], ["amfleetBusiness", 1], ["amfleetCafe", 1], ["amfleet", 6]),
  "Keystone": set("ACS-64 locomotive with Amfleet coaches and a Metroliner cab car", ["acs64", 1], ["amfleet", 4], ["metrolinerCab", 1]),
  "Empire Service": EMPIRE, "Adirondack": EMPIRE, "Maple Leaf": EMPIRE,
  "Ethan Allen Express": set("P32AC-DM locomotives at each end with Amfleet coaches and a club car", ["p32", 1], ["amfleetBusiness", 1], ["amfleet", 4], ["p32", 1]),
  // The Springfield shuttles: a P42 pushing or pulling one coach and a
  // Metroliner cab car.
  "Amtrak Hartford Line": set("Genesis locomotive with an Amfleet coach and a Metroliner cab car", ["genesis", 1], ["amfleet", 1], ["metrolinerCab", 1]),
  "Valley Flyer": set("Genesis locomotive with an Amfleet coach and a Metroliner cab car", ["genesis", 1], ["amfleet", 1], ["metrolinerCab", 1]),
  "Vermonter": NEC_DIESEL([["amfleetBusiness", 1], ["amfleet", 4]]),
  "Carolinian": NEC_DIESEL([["viewlinerBaggage", 1], ["amfleetBusiness", 1], ["amfleetCafe", 1], ["amfleet", 4]]),
  "Pennsylvanian": NEC_DIESEL([["viewlinerBaggage", 1], ["amfleetBusiness", 1], ["amfleetCafe", 1], ["amfleet", 4]]),
  "Downeaster": set("Genesis locomotives with Amfleet coaches and a business class and café car (some trains a cab unit at the south end)",
    ["genesis", 1], ["amfleetBusiness", 1], ["amfleet", 4], ["genesis", 1]),
  "Palmetto": set("ALC-42 locomotive with a baggage car, an Amfleet club car and coaches", ["alc42", 1], ["viewlinerBaggage", 1], ["amfleetBusiness", 1], ["amfleet2", 4]),
  // New Orleans-Mobile since August 2025: an ALC-42 at each end, two
  // Amfleet II coaches and a business class and café car.
  "Mardi Gras Service": set("ALC-42 locomotives at each end with Amfleet coaches and a business class and café car",
    ["alc42", 1], ["amfleetBusiness", 1], ["amfleet2", 2], ["alc42", 1]),
  // Piedmont (NCDOT): an F59PH or F59PHI at each end of the state's rebuilt
  // coaches.
  "Piedmont": set("NCDOT F59PH or F59PHI locomotives at each end with NCDOT coaches", ["f59ph", 1], ["coach", 4], ["f59", 1]),
  "Crescent": set("ALC-42 and Genesis locomotives with Viewliner and Amfleet cars",
    ...LD_PAIR, ["viewlinerBaggage", 1], ["viewlinerSleeper", 2], ["viewlinerDiner", 1], ["amfleetCafe", 1], ["amfleet2", 3]),
  "Silver Meteor": set("ALC-42 and Genesis locomotives with Viewliner and Amfleet cars",
    ...LD_PAIR, ["viewlinerBaggage", 1], ["viewlinerSleeper", 2], ["viewlinerDiner", 1], ["amfleetCafe", 1], ["amfleet2", 4]),
  "Floridian": set("ALC-42 and Genesis locomotives with Viewliner and Amfleet cars",
    ...LD_PAIR, ["viewlinerBaggage", 1], ["viewlinerSleeper", 3], ["viewlinerDiner", 1], ["amfleetCafe", 1], ["amfleet2", 4]),
  "Lake Shore Limited": set("Genesis locomotives with Viewliner and Amfleet cars",
    ["genesis", 2], ["viewlinerBaggage", 1], ["viewlinerSleeper", 3], ["viewlinerDiner", 1], ["amfleetBusiness", 1], ["amfleet2", 3]),
  "Cardinal": set("ALC-42 locomotive with Viewliner and Amfleet cars",
    ["alc42", 1], ["viewlinerBaggage", 1], ["viewlinerSleeper", 1], ["amfleetCafe", 1], ["amfleet2", 3]),
  "California Zephyr": SUPERLINER_LD, "Southwest Chief": SUPERLINER_LD, "Empire Builder": SUPERLINER_LD,
  "Coast Starlight": SUPERLINER_LD, "Sunset Limited": SUPERLINER_LD, "City of New Orleans": SUPERLINER_LD,
  "Texas Eagle": set("ALC-42 locomotive with Superliner cars",
    ["alc42", 1], ["superlinerSleeper", 2], ["superlinerDiner", 1], ["superlinerLounge", 1], ["superlinerCoach", 2]),
  "Auto Train": set("Charger locomotives with Superliner cars and auto carriers (some 20 behind them)",
    ["alc42", 2], ["superlinerSleeper", 3], ["superlinerDiner", 1], ["superlinerLounge", 1], ["superlinerCoach", 2], ["autorack", 3]),
  "Heartland Flyer": set("Genesis locomotives at each end with Superliner coaches", ["genesis", 1], ["superlinerCoach", 3], ["genesis", 1]),
  "Winter Park Express": set("Genesis locomotive with Superliner coaches and a Sightseer Lounge", ["genesis", 1], ["superlinerCoach", 4], ["superlinerLounge", 1]),
  // Superliners since March 2025, when the Horizon cars were pulled; a
  // fourth coach from October 2026.
  "Borealis": set("Charger locomotive with Superliner coaches", ["charger", 1], ["superlinerCoach", 4]),
  "Saluki": ILLINI, "Illini": ILLINI,
  "Wolverine": MIDWEST, "Blue Water": MIDWEST, "Lincoln Service": MIDWEST, "Hiawatha": HIAWATHA,
  "Pere Marquette": set("Charger locomotive with Venture coaches and an Amfleet business class and café car", ["charger", 1], ["venture", 4], ["amfleetBusiness", 1]),
  "Lincoln River Runner": RIVER, "Missouri River Runner": RIVER,
  "Carl Sandburg": PRAIRIE, "Illinois Zephyr": PRAIRIE,
  "Capitol Corridor": set("Charger or F59PHI locomotive with California Cars", ["charger", 1], ["californiaCar", 3], ["californiaCab", 1]),
  // Gold Runner (the San Joaquins until 2025): Caltrans' Venture sets, six
  // coaches between two Chargers until their cab cars enter service.
  "San Joaquins": set("Charger locomotives with Caltrans Venture coaches (some trains still California Cars)", ["charger", 1], ["venture", 6], ["charger", 1]),
  "Pacific Surfliner": set("Charger or F59PHI locomotive with Surfliner bi-levels", ["charger", 1], ["surfliner", 5], ["surflinerCab", 1]),
  "Amtrak Cascades": TALGO_SET,
};

const VIA_BUDD = set("F40PH locomotive with Budd stainless cars", ["f40", 1], ["buddBaggage", 1], ["buddCoach", 1], ["skyline", 1], ["buddSleeper", 1]);
const VIA = {
  "Corridor": set("Siemens Venture trainset (some trains use LRC or HEP cars)", ["charger", 1], ["venture", 4], ["ventureCab", 1]),
  "Canadian": set("F40PH locomotives with Budd stainless cars",
    ["f40", 2], ["buddBaggage", 1], ["buddCoach", 2], ["skyline", 1], ["buddDiner", 1], ["buddSleeper", 3], ["parkCar", 1]),
  "Ocean": set("F40PH locomotive with Renaissance cars", ["f40", 1], ["renaissanceCoach", 2], ["renaissanceDiner", 1], ["renaissanceSleeper", 3]),
  "Hudson Bay": VIA_BUDD, "Skeena": VIA_BUDD,
  "Abitibi": set("F40PH locomotive with Budd stainless cars", ["f40", 1], ["buddBaggage", 1], ["buddCoach", 2]),
  "Saguenay": set("F40PH locomotive with Budd stainless cars", ["f40", 1], ["buddBaggage", 1], ["buddCoach", 2]),
  "Lake Superior": set("Budd Rail Diesel Car", ["rdc", 1]),
};

// The same routes under the other names they come by. Amtraker (Amtrak's
// live positions): "Carolinian / Piedmont" for the Alexandria–Raleigh
// extras, "Silver Service / Palmetto" for the Miami–Jacksonville ones. The
// timetables (Amtrak's GTFS): "Hiawatha Service", "Keystone Service",
// "Amtrak Mardi Gras Service", "Lincoln Service Missouri River Runner".
// VIA's timetable names its trains by their end points; Amtraker by name,
// and "London-Toronto" for a Corridor train.
const ROUTE_NAMES = {
  amtrak: {
    "Hiawatha Service": "Hiawatha", "Keystone Service": "Keystone", "Amtrak Mardi Gras Service": "Mardi Gras Service",
    "Lincoln Service Missouri River Runner": "Lincoln River Runner", "Carolinian / Piedmont": "Carolinian", "Silver Service / Palmetto": "Palmetto",
    "Gold Runner": "San Joaquins", "Hartford Line": "Amtrak Hartford Line",
  },
  via: {
    "Vancouver - Toronto": "Canadian", "Montréal - Halifax": "Ocean", "Jasper - Prince Rupert": "Skeena",
    "Winnipeg - Churchill": "Hudson Bay", "The Pas - Churchill": "Hudson Bay", "Montréal - Senneterre": "Abitibi",
    "Montréal - Jonquière": "Saguenay", "Sudbury - White River": "Lake Superior", "Toronto - New York": "Maple Leaf",
  },
};
// The route a train's equipment goes by: its name as the tables below have
// it. Every VIA train not named there is a Corridor train.
function routeOf(t) {
  const r = t.route || "";
  const named = ROUTE_NAMES[t.agency]?.[r] || r;
  if (t.agency === "via" && !VIA[named] && named !== "Maple Leaf") return "Corridor";
  return named || t.route;
}

// A type if it has a drawing, else a stand-in that does.
const drawable = (key, instead) => (TYPES[key] && MODELS[key] ? key : instead);

// Typical equipment for a train, or null. reported: the type of a car the
// feed named, which picks between a railroad's electric and diesel fleets.
function typicalFor(t, reported) {
  const dest = t.destination || "";
  switch (t.agency) {
    case "amtrak":
      if (t.route === "Amtrak Cascades" && CASCADES_AIRO.has(String(t.number))) return AIRO_SET;
      return AMTRAK[t.route] || set("Locomotive with coaches", ["genesis", 1], ["amfleet", 5]);
    // The Maple Leaf, on VIA's timetable too, is Amtrak's train in Amtrak's colors.
    case "via": return t.route === "Maple Leaf" ? { ...AMTRAK["Maple Leaf"], agency: "amtrak" } : VIA[t.route] || VIA.Corridor;
    // Ten coaches on the Orlando trains since December 2025 (eight Smart,
    // two Premium), a Charger at each end.
    case "brightline": return set("Charger locomotives with 10 Brightline coaches", ["charger", 1], ["venture", 10], ["charger", 1]);
    case "lirr": {
      const diesel = reported ? !["m7", "m9", "m3"].includes(reported)
        : /Montauk|Greenport|Oyster Bay/.test(t.route || "") || /Port Jefferson|Oyster Bay|Montauk|Greenport|Speonk/.test(dest);
      return diesel
        ? set("DE30AC or DM30AC locomotive with C3 bi-levels", ["de30ac", 1], ["c3", 4], ["c3Cab", 1])
        : set("M7 or M9 electric cars, usually 6 to 12", [reported === "m9" ? "m9" : "m7", 8]);
    }
    case "mnr":
      // The new SC-42DM Chargers run the Hudson Line to Poughkeepsie; the
      // Danbury and upper Harlem trains still have P32AC-DMs.
      if (/Poughkeepsie/.test(dest) && !/Danbury|Waterbury|Harlem/.test(t.route || "")) {
        return set("SC-42DM Charger locomotive with Shoreliner coaches", ["charger", 1], ["shoreliner", 4], ["shorelinerCab", 1]);
      }
      if (t.route === "Danbury" || t.route === "Waterbury" || /Wassaic/.test(dest)) {
        return set("P32AC-DM locomotive with Shoreliner coaches", ["p32", 1], ["shoreliner", 4], ["shorelinerCab", 1]);
      }
      return /New Haven|New Canaan/.test(t.route || "")
        ? set("M8 electric cars, usually 6 to 10", ["m8", 8])
        : set("M7A electric cars, usually 6 to 10", ["m7a", 8]);
    case "mbta": {
      const single = reported === "single" || reported === "singleCab";
      // The locomotive the feed named, when it named one.
      const loco = ["hsp46", "f40c", "gp40", "mp36"].includes(reported) ? reported : "hsp46";
      return single
        ? set("Diesel locomotive with single-level coaches", [loco, 1], ["single", 5], ["singleCab", 1])
        : set("Diesel locomotive with bi-level coaches", [loco, 1], ["bilevel", 5], [reported === "kawasakiCab" ? "kawasakiCab" : "rotemCab", 1]);
    }
    case "marc": {
      // Penn Line: mostly SC-44 Chargers (some HHP-8 electrics), its rush-hour
      // trains mostly Kawasaki bi-levels, MultiLevels at other times. Camden
      // and Brunswick: MP36s (Chargers too on the Brunswick, now and then a
      // GP39) with MultiLevels, some trains with the single-level MARC II
      // cars. The reported locomotive or car picks.
      const route = t.route || "";
      const locos = { mp36: "MP36PH", charger: "SC-44 Charger", hhp8: "HHP-8", gp39: "GP39PH-3C" };
      const loco = locos[reported] ? reported : /Penn/i.test(route) ? "charger" : "mp36";
      const name = locos[loco];
      if (reported === "marcII" || reported === "marcIICab") {
        return set(`${name} locomotive with single-level MARC II coaches and a cab car`, [loco === "hhp8" ? "mp36" : loco, 1], ["marcII", 3], ["marcIICab", 1]);
      }
      const kawasaki = ["bilevel", "bilevelCab"].includes(reported) || (/Penn/i.test(route) && !["multilevel", "multilevelCab"].includes(reported));
      if (kawasaki) return set(`${name} locomotive with Kawasaki bi-levels (MultiLevels on some trains)`, [loco, 1], ["bilevel", 5], ["bilevelCab", 1]);
      return /Camden/i.test(route)
        ? set(`${name} locomotive with MultiLevel coaches (or Kawasaki bi-levels, or MARC II single-level cars)`, [loco, 1], ["multilevel", 3], ["multilevelCab", 1])
        : set(`${name} locomotive with MultiLevel coaches${/Brunswick/i.test(route) ? " (some trains MARC II single-level cars)" : ""}`, [loco, 1], ["multilevel", 4], ["multilevelCab", 1]);
    }
    case "septa": return set("Silverliner IV or V cars, usually 2 to 6", ["silverliner4", 4]);
    // NJ Transit by line (Wikipedia, "NJ Transit Rail Operations", 2026;
    // photographs 2025-26). Electric lines: an ALP-46 with MultiLevels, some
    // trains Arrow III cars; the Princeton shuttle one or two single Arrow
    // IIIs. Diesel lines: an ALP-45DP (some trains a PL42AC) with Comet V
    // cars or MultiLevels. North Jersey Coast trains beyond Long Branch, and
    // Montclair-Boonton trains beyond Montclair State, change to diesel.
    case "njt": {
      const r = t.route || "";
      if (/Princeton/.test(r)) return set("Arrow III single cars, one or two", ["arrow3Single", 2]);
      const loco = reported === "pl42" ? "pl42" : "alp45", name = loco === "pl42" ? "PL42AC" : "ALP-45DP";
      if (/Pascack|Port Jervis|Main\/Bergen/.test(r) || reported === "comet5" || reported === "comet5Cab") {
        return set(`${name} locomotive with Comet V coaches and a cab car (some trains MultiLevels)`, [loco, 1], ["comet5", 4], ["comet5Cab", 1]);
      }
      // The North Jersey Coast's Long Branch–Bay Head shuttles (trains 43xx
      // and 47xx), beyond the wires: an ALP-45DP or ALP-45A with Comet cars
      // (Shark River drawbridge, July 2024; Bay Head, May 2025).
      if (/Coast/.test(r) && /^4[37]\d\d$/.test(String(t.number || ""))) {
        return { ...set(`${name} locomotive with Comet V coaches and a cab car (the diesel shuttle beyond Long Branch)`, [loco, 1], ["comet5", 4], ["comet5Cab", 1]), wires: false };
      }
      if (/Raritan|Atlantic City/.test(r) || /Bay Head/.test(dest) || (/Montclair/.test(r) && /Hackettstown|Mount Olive|Lake Hopatcong|Netcong|Dover/.test(dest))) {
        return set(`${name} locomotive with MultiLevel coaches and a cab car`, [loco, 1], ["multilevel", 4], ["multilevelCab", 1]);
      }
      if (/Gladstone/.test(r)) return set("Arrow III electric cars (some trains an ALP-46 with MultiLevels)", ["arrow3", 4]);
      return set("ALP-46 electric locomotive with MultiLevel coaches and a cab car (some trains Arrow III cars)", ["alp46", 1], ["multilevel", 5], ["multilevelCab", 1]);
    }
    // Metra's diesel lines, each with the locomotives it mostly runs
    // (Metra's roster on Wikipedia and The Diesel Shop, October 2026;
    // photographs 2024-26): the SD70MACHs on the Milwaukee lines and the
    // North Central Service, whose fleet is pooled with Milwaukee West's
    // (Railway Age, 2025); the MP36PH-3Cs, moved off the Milwaukee lines,
    // on the Rock Island (Joliet, Blue Island, September 2026) and the
    // Heritage Corridor (April 2025); the F40PHM-3s on the BNSF with
    // F40PH-3s; F40PH-3s on the Union Pacific lines and the SouthWest
    // Service (Manhattan, Palos Park, September 2026).
    case "metra": {
      const r = t.route || "";
      if (r === "Metra Electric") return set("Highliner electric cars", ["highliner", 4]);
      const [loco, label] = /Milwaukee|North Central/.test(r) ? ["sd70mach", "SD70MACH locomotive (some trains an MP36PH-3C)"]
        : /Rock Island|Heritage/.test(r) ? ["mp36", "MP36PH-3C locomotive (some trains an F40PH-3)"]
        : /Burlington|BNSF/.test(r) ? ["f40phm", "F40PHM-3 or F40PH-3 locomotive"]
        : ["f40", "F40PH-3 locomotive"];
      return set(`${label} with gallery bi-levels and a cab car`, [loco, 1], ["gallery", 5], ["galleryCab", 1]);
    }
    case "rtd": return set("Silverliner V electric cars, usually 2 to 4", ["silverliner5", 4]);
    case "frontrunner": return set("MP36PH locomotive with Bombardier bi-levels", ["mp36", 1], ["bilevel", 3], ["bilevelCab", 1]);
    case "capmetro": return set("Stadler GTW diesel railcar", ["gtwCar", 1], ["gtwPower", 1], ["gtwCar", 1]);
    case "trirail": return set("Diesel locomotive with bi-level coaches", ["bl36", 1], ["bilevel", 3], ["bilevelCab", 1]);
    // Caltrain: the KISS electric trainsets between San Francisco and
    // Tamien; the South County Connector between San Jose and Gilroy
    // beyond the wires (trains 8xx, four each way on weekdays) is diesel:
    // an MP36PH-3C at the Gilroy end with Caltrain's Bombardier BiLevels
    // (Wikipedia, "Caltrain", 2026; photographs at Diridon, 2025).
    case "caltrain": return /^8\d\d$/.test(String(t.number || "")) || /Gilroy/.test(dest)
      ? set("MP36PH-3C diesel locomotive with Bombardier bi-levels and a cab car", ["mp36", 1], ["bilevel", 4], ["bilevelCab", 1])
      : set("Stadler KISS electric trainset", ["kissCab", 1], ["kiss", 5], ["kissCab", 1]);
    case "smart": return set("Nippon Sharyo diesel railcars", ["smartDmu", 2]);
    // Arrow (San Bernardino–Redlands, trains 38xx): Stadler FLIRT railcars.
    case "metrolink": return /^38\d\d$/.test(t.number || "") || /Redlands/.test(dest)
      ? set("Stadler FLIRT railcar", ["flirtCar", 1], ["flirtPower", 1], ["flirtCar", 1])
      : set("F125 locomotive with bi-level coaches", ["f125", 1], ["bilevel", 4], ["bilevelCab", 1]);
    // Most GO trains run 12 cars (11 coaches and a cab car) behind an
    // MP40PH-3C or MP54AC; the reported locomotive picks which.
    case "go": return set("MP54AC or MP40PH-3C locomotive with BiLevel coaches and a cab car, usually 12 cars",
      [reported === "mp40" ? "mp40" : "mp54ac", 1], ["bilevel", 11], [reported === "goOldCab" ? "goOldCab" : "bilevelCab", 1]);
    // CT Rail: both lines run push-pull sets, a P40DC (some trains a
    // GP40-3H) with Mafersa coaches and a cab car; Shore Line East went back
    // to them in 2026 after four years of M8 electric cars.
    case "ctrail": {
      if (reported === "m8") return set("M8 electric cars, usually 4", ["m8", 4]);
      const gp = reported === "gp40h";
      return set(`${gp ? "GP40-3H" : "P40DC"} locomotive with Mafersa coaches and a cab car`,
        [gp ? "gp40h" : "p40", 1], ["mafersa", 3], ["mafersaCab", 1]);
    }
    // South Shore Line: mostly Nippon Sharyo single-level cars, two to eight;
    // some Lakeshore Corridor trains are Highliner bi-levels. The Monon
    // Corridor's Hammond–Dyer shuttles are pairs of single-level cars.
    case "southshore": {
      if (reported === "highliner") return set("Highliner II bi-level electric cars, usually 2 to 8", ["highliner", 4]);
      if (/Monon/i.test(t.route || "")) return set("Nippon Sharyo single-level electric cars, usually 2", ["nsEmu", 2]);
      return reported === "nsTrailer"
        ? set("Nippon Sharyo single-level electric cars and a trailer, usually 2 to 8", ["nsEmu", 2], ["nsTrailer", 1], ["nsEmu", 3])
        : set("Nippon Sharyo single-level electric cars, usually 2 to 8", ["nsEmu", 6]);
    }
    // SunRail: an MP32PH-Q with a BiLevel coach and a cab car (the fleet has
    // ten coaches and thirteen cab cars for its eleven locomotives).
    case "sunrail": return set("MP32PH-Q locomotive with a BiLevel coach and a cab car (some trains two coaches)", ["mp32", 1], ["bilevel", 1], ["bilevelCab", 1]);
    // VRE: an MP36PH-3C with Gallery IV coaches and a cab car at the
    // Washington end, usually 6 to 8 cars on both lines.
    case "vre": return set("MP36PH-3C locomotive with gallery bi-levels and a cab car, usually 6 to 8 cars",
      ["mp36", 1], ["gallery", 6], ["galleryCab", 1]);
    // Sounder: an F59PHI or MP40PH-3C (the reported locomotive picks which)
    // with BiLevel coaches and a cab car: 5 or 7 cars on the S Line, 2 or 3
    // on the N Line (Sound Transit's 2025 Transit Development Plan). Two
    // cab cars in three have the older cab.
    case "sounder": {
      const loco = reported === "mp40" ? "mp40" : "f59", name = loco === "mp40" ? "MP40PH-3C" : "F59PHI";
      const cab = reported === "sounderCemCab" ? "sounderCemCab" : "bilevelCab";
      return /^N/.test(t.route || "")
        ? set(`${name} locomotive with BiLevel coaches and a cab car, usually 2 or 3 cars`, [loco, 1], ["bilevel", 1], [cab, 1])
        : set(`${name} locomotive with BiLevel coaches and a cab car, usually 5 or 7 cars`, [loco, 1], ["bilevel", 6], [cab, 1]);
    }
    // Rail Runner: an MP36PH-3C with BiLevel coaches and a cab car, usually
    // 4 cars.
    case "railrunner": return set("MP36PH-3C locomotive with BiLevel coaches and a cab car, usually 4 cars",
      ["mp36", 1], ["bilevel", 3], ["bilevelCab", 1]);
    // ACE: an SC-44 Charger (or an F40PH-3C, when the feed names one) with
    // BiLevel coaches and a cab car, usually 4 to 8 cars.
    case "ace": {
      const f40 = reported === "f40c";
      return set(`${f40 ? "F40PH-3C" : "SC-44 Charger"} locomotive with BiLevel coaches and a cab car, usually 4 to 8 cars`,
        [f40 ? "f40c" : "charger", 1], ["bilevel", 5], ["bilevelCab", 1]);
    }
    // exo: push-pull trains, the locomotive at the outbound end. The
    // ALP-45DPs run on diesel on the Vaudreuil-Hudson, Saint-Jérôme and
    // Mont-Saint-Hilaire lines (with F59PHIs and, since late 2025, Chargers);
    // F59PHIs on Candiac, F59PHs on Mascouche. Saint-Jérôme has the BiLevels
    // (and CRRC bi-levels), the others MultiLevels. The reported locomotive
    // or car picks.
    case "exo": {
      const route = t.route || "";
      const locos = { alp45: "ALP-45DP", f59: "F59PHI", f59ph: "F59PH", charger: "Charger" };
      const usual = /Mascouche/.test(route) ? "f59ph" : /Candiac/.test(route) ? "f59" : "alp45";
      const loco = drawable(locos[reported] ? reported : usual, /Mascouche/.test(route) ? "f59" : "charger");
      const name = locos[loco];
      if (reported === "crrcBilevel" || reported === "crrcBilevelCab") {
        return set(`${name} locomotive with CRRC bi-level coaches and a cab car`, [loco, 1], ["crrcBilevel", 5], [drawable("crrcBilevelCab", "bilevelCab"), 1]);
      }
      const bl = reported === "bilevel" || reported === "bilevelCab" || (/J[ée]r[ôo]me/.test(route) && !["multilevel", "multilevelCab"].includes(reported));
      if (bl) return set(`${name} locomotive with BiLevel coaches and a cab car (some trains CRRC bi-levels)`, [loco, 1], ["bilevel", 5], ["bilevelCab", 1]);
      const n = /Vaudreuil|Hilaire/.test(route) ? 6 : 4;
      return set(`${name} locomotive with MultiLevel coaches and a cab car`, [loco, 1], ["multilevel", n], ["multilevelCab", 1]);
    }
    // TEXRail (Fort Worth–DFW Airport) and DART's Silver Line (DFW
    // Airport–Shiloh Road): four-section Stadler FLIRT railcars with the
    // power pack in the middle; at busy times two coupled.
    case "texrail": case "silverline":
      return set("Stadler FLIRT railcar (four sections and a power pack)", ["flirtCar", 1], ["flirtMid", 1], ["flirtPower", 1], ["flirtMid", 1], ["flirtCar", 1]);
    // A-train (Denton–Carrollton): one Stadler GTW 2/6, now and then two.
    case "atrain": return set("Stadler GTW diesel railcar", ["gtwCar", 1], ["gtwPower", 1], ["gtwCar", 1]);
    // Trinity Railway Express: push-pull, an F59PH (or one of its F40PH-2s or
    // F59PHIs) with BiLevel coaches and a cab car, usually 3 or 4 cars.
    case "tre": return set("F59PH locomotive with BiLevel coaches and a cab car, usually 3 or 4 cars", ["f59ph", 1], ["bilevel", 2], ["bilevelCab", 1]);
    // Coaster: an SC-44 Charger, usually at the Oceanside end, with BiLevel
    // coaches and a cab car, usually 5 or 6 cars.
    case "coaster": return set("SC-44 Charger locomotive with BiLevel coaches and a cab car, usually 5 or 6 cars", ["charger", 1], ["bilevel", 4], ["bilevelCab", 1]);
    // Sprinter (Oceanside–Escondido): a two-car Siemens Desiro, at busy
    // times two coupled.
    case "sprinter": return set("Siemens Desiro two-car diesel railcar (sometimes two coupled)", ["desiro", 1], ["desiro", 1]);
    // UP Express: Nippon Sharyo railcars, three-car trains (a cab car at
    // each end), some still two.
    case "upx": return set("Nippon Sharyo diesel railcars, usually 3 (some trains 2)", ["upxCar", 1], ["upxMid", 1], ["upxCar", 1]);
    // WeGo Star (Nashville–Lebanon): an F40 at the Lebanon end with Budd
    // gallery cars and a cab car, usually 3 cars behind it.
    case "star": return set("F40PH locomotive with gallery bi-levels and a cab car", ["f40", 1], ["gallery", 2], ["galleryCab", 1]);
    // Polar Bear Express (Cochrane–Moosonee): a mixed train, usually two
    // GP38-2s with the chain cars carrying vehicles and a boxcar for freight
    // and mail behind them, then the power car (APU 203), the baggage car,
    // coaches and the dining car; about 14 cars (railpictures.net,
    // 2008-2021).
    case "ontarionorthland": return set("GP38-2 locomotives with vehicle flat cars and a boxcar, the power car, a baggage car, rebuilt coaches and a dining car",
      ["gp38", 2], ["chainCar", 2], ["boxcar", 1], ["onApu", 1], ["onBaggage", 1], ["onCoach", 3], ["onDiner", 1]);
    // Alaska Railroad (its schedules and roster; seat61; Wikipedia, 2026).
    // Hurricane Turn: a GP40-2, a baggage car, two coaches and a cab car
    // rebuilt from an F40PH at the far end. Aurora Winter Train (September to
    // May): an SD70MAC with a baggage car, a dining car and coaches. Denali
    // Star (May to September): two SD70MACs, a baggage car, the GoldStar
    // domes, then a café, a dome and coaches; Coastal Classic the same,
    // shorter. Glacier Discovery: DMU 751 leading coaches and a baggage car,
    // a GP38-2 at the rear. A reported car or locomotive only one train
    // has picks that train.
    case "alaska": {
      const r = t.route || "";
      if (/Hurricane/.test(r) || reported === "gp402") return set("GP40-2 locomotive with a baggage car, two coaches and a cab car rebuilt from an F40PH",
        ["gp402", 1], ["akBaggage", 1], ["akCoach", 2], ["akCab", 1]);
      if (/Denali/.test(r) || reported === "akGoldStar" || reported === "akDome") return set("SD70MAC locomotives with a baggage car, GoldStar domes, a café car, a dome and coaches (private Wilderness Express domes behind some trains)",
        ["sd70mac", 2], ["akBaggage", 1], ["akGoldStar", 2], ["akDiner", 1], ["akDome", 1], ["akCoach", 3]);
      if (/Coastal/.test(r)) return set("SD70MAC locomotives with a baggage car, a GoldStar dome, a café car and coaches",
        ["sd70mac", 2], ["akBaggage", 1], ["akGoldStar", 1], ["akDiner", 1], ["akCoach", 3]);
      if (/Glacier/.test(r) || reported === "akDmu") return set("DMU 751 leading coaches and a baggage car, a GP38-2 locomotive at the rear",
        ["akDmu", 1], ["akCoach", 2], ["akBaggage", 1], ["gp38", 1]);
      return set("SD70MAC locomotive with a baggage car, a dining car and coaches", ["sd70mac", 1], ["akBaggage", 1], ["akDiner", 1], ["akCoach", 3]);
    }
    default: return TYPICAL[t.agency]?.(t, reported) || null;
  }
}

// { cars: [{ number, type }], complete, typical, summary, note } or null.
// A number from each of a railroad's fleet ranges, one per car type: for
// showing every type it runs, not only its lines' typical trains.
export function fleetSamples(agency) {
  const out = new Map();
  for (const [first, , key] of FLEETS[agency] || []) if (!out.has(key)) out.set(key, String(first));
  return [...out].map(([key, number]) => ({ key, number }));
}

export function consistOf(t) {
  // A plug-in railroad's cars come in their own file.
  const file = carsFile(t.agency);
  if (file && !carsDone.has(file)) { loadCars(t.agency); return null; }
  // A feed may name each car's model (t.cars.types, TYPES keys); else its
  // number says what it is.
  const reported = (t.cars?.numbers || []).map((number, i) => ({ number: number || null, key: formationKey(t, i) || typeOf(t.agency, number) || (TYPES[t.cars.types?.[i]] ? t.cars.types[i] : null) }));
  const known = reported.filter((c) => c.key);
  // Every car, straight from the feed.
  if (t.cars?.complete && known.length) {
    const cars = reported.map(({ number, key }) => ({ number, type: TYPES[key] || null }));
    const models = [...new Set(known.map((c) => TYPES[c.key].name))];
    const coaches = cars.filter((c) => !LOCOMOTIVE.has(c.type?.kind)).length;
    const summary = [`${coaches} car${coaches === 1 ? "" : "s"}`, models.length <= 2 ? models.join(" + ") : null].filter(Boolean).join(" · ");
    return { cars, complete: true, typical: false, summary, agency: t.agency, route: t.route };
  }
  // What usually runs on this route (under the name the tables know it by).
  const route = routeOf(t);
  const typical = typicalFor(route === t.route ? t : { ...t, route }, known[0]?.key);
  if (!typical) return null;
  const cars = typical.units.flatMap(([key, count]) => Array.from({ length: count }, () => ({ number: null, type: TYPES[key] })));
  const one = known[0];
  return {
    // A set may be another railroad's equipment (the Maple Leaf on VIA's
    // timetable is Amtrak's train), drawn in that railroad's colors.
    // wires: false for a train on diesel all the way (its dual-mode
    // locomotive's pantograph drawn down).
    cars, complete: true, typical: true, summary: typical.label, agency: typical.agency || t.agency, route, ...(typical.wires === false ? { wires: false } : {}),
    reported: one ? { number: one.number, name: TYPES[one.key].name } : null,
  };
}

// ---------- Drawings ----------
// Each type is drawn by its model in carmodels.js, from real dimensions at a
// shared scale (carart.js). Lengths are over the couplers, in feet.

const art = (key) => MODELS[key] || MODELS.coach;

// Markup for the consist strip: one drawing per car, with its number under it
// when the railroad reported one. uid: the strip's own id, which every id in
// it starts with; made up here unless the caller has one to keep.
let renderSeq = 0;
// The drawings' own ids (clip paths, gradients, masks; carmodels.js) are
// numbered as they're drawn, so the same train drawn twice gives two
// different strings. Renumbered under the strip's id, in order, the same
// consist always gives the same markup, which lets a page redrawn keep its
// drawing, and two strips on one page never share an id.
function stableIds(html, uid) {
  const ids = new Map();
  return html.replace(/ts-(clip|tri|njt|metra|disco)-\d+/g, (m, kind) => {
    if (!ids.has(m)) ids.set(m, `${uid}-${kind}${ids.size}`);
    return ids.get(m);
  });
}
// How each car of a consist is drawn: its type and model, its length, and
// the drawing context (which way it faces, its cabs, its neighbors).
function carsOf(c, color) {
  const n = c.cars.length;
  // Married pairs: a car whose neighbor carries the next or previous number is
  // half of a pair (0: the front half, 1: its mate, drawn facing backward); a
  // numbered car with no mate beside it is a single, with a cab at each end.
  // Without numbers, cars pair up in order.
  const nums = c.cars.map((x) => Number(x.number));
  const mate = (i, j) => j >= 0 && j < n && Number.isInteger(nums[i]) && Math.abs(nums[i] - nums[j]) === 1 && c.cars[j].type?.key === c.cars[i].type?.key;
  const pairOf = (i) => (!Number.isInteger(nums[i]) || !c.cars[i].number ? i % 2 : mate(i, i + 1) && !(mate(i, i - 1) && pairOf(i - 1) === 0) ? 0 : mate(i, i - 1) ? 1 : 2);
  return c.cars.map(({ number, type }, i) => {
    const t = type || TYPES.coach;
    const model = art(t.key);
    const L = typeof model.len === "function" ? model.len(c.agency) : model.len;
    const multipleUnit = t.kind === "emu" || t.emu;
    const lead = i === 0, last = i === n - 1 && c.complete;
    // Driving cabs face outward, at the front and back of the train.
    const cabL = (multipleUnit || t.cab) && lead;
    const cabR = (multipleUnit || t.cab) && last && (multipleUnit || !lead);
    // Single-cab equipment at the back faces backward: drawn facing forward,
    // then mirrored.
    const flip = model.oneEnd && i > 0 && i === n - 1;
    const ctx = {
      L, color, agency: c.agency, lead, cabL: flip ? false : cabL, cabR: flip ? false : cabR, mirrored: flip,
      // Multiple units share a pantograph between each pair of cars.
      pan: multipleUnit && t.pan && i % 2 === 0,
      pair: pairOf(i), index: i, count: n, route: c.route, ...(c.wires === false ? { wires: false } : {}),
      coupledL: flip ? i < n - 1 : i > 0,
      coupledR: flip ? i > 0 : i < n - 1,
    };
    if (flip) ctx.cabL = true;
    return { t, model, L, ctx, flip, number };
  });
}

// One car's drawing (without its id or reuse), as SVG content in feet.
function drawCar({ t, model, L, ctx, flip }, { couplers = true } = {}) {
  let drawing = themable(model.draw(ctx));
  // Locomotives draw no gangway: where one is coupled to the next unit,
  // draw its coupler out to the face so the two visibly connect.
  if (couplers && LOCOMOTIVE.has(t.kind)) {
    if (ctx.coupledL) drawing += locoCoupler(0, -1);
    if (ctx.coupledR) drawing += locoCoupler(L, 1);
  }
  return flip ? `<g transform="matrix(-1 0 0 1 ${L} 0)">${drawing}</g>` : drawing;
}

export function consistHtml(c, color, uid = `tsc${++renderSeq}`) {
  // Identical cars are drawn once and reused: identical by what they draw,
  // since a car's drawing can depend on its place in the train (the Talgo
  // 350's coaches rise to the power car only beside it, a class numeral
  // changes partway along), not only on its model and ends.
  const drawn = new Map();
  return stableIds(carsOf(c, color).map((car, i) => {
    const { t, model, L, ctx, flip, number } = car;
    const art = drawCar(car);
    // Each drawing makes its own clip ids, so compare with them numbered
    // within the drawing.
    const local = new Map(), sig = art.replace(/ts-(clip|tri|njt|metra|disco)-\d+/g, (m) => {
      if (!local.has(m)) local.set(m, `#${local.size}`);
      return local.get(m);
    });
    let drawing;
    if (drawn.has(sig)) {
      drawing = `<use href="#${drawn.get(sig)}"/>`;
    } else {
      const id = `${uid}-${drawn.size}`;
      drawn.set(sig, id);
      drawing = `<g id="${id}">${art}</g>`;
    }
    const label = esc([t.name, number].filter(Boolean).join(" "));
    // The number under the car, where it fits: not under a power module
    // (a GTW's or FLIRT's short box between the cars), nor under any car
    // narrower than its number (a 12-digit European vehicle number is
    // about 7 px a digit), which would run into its neighbours'.
    const caption = number && t.kind !== "module" && L * PX_PER_FT >= String(number).length * 7 + 6 ? number : null;
    // Tapping a car shows what it is (app.js).
    return `<figure class="car" data-car="${i}" role="button" tabindex="0" title="${label}">
      <svg viewBox="0 0 ${L} ${HEIGHT_FT}" width="${Math.round(L * PX_PER_FT)}" height="${HEIGHT_FT * PX_PER_FT}" role="img" aria-label="${label}"><g transform="matrix(1 0 0 -1 0 ${HEIGHT_FT})">${drawing}</g></svg>
      ${caption ? `<figcaption>${esc(caption)}</figcaption>` : ""}
    </figure>`;
  }).join(""), uid);
}

// A single car of a consist, drawn on its own (no couplers to its
// neighbors), `width` px wide; uid as for consistHtml.
export function carSvg(c, i, color, width, uid = `tsp${++renderSeq}`) {
  const car = carsOf(c, color)[i];
  if (!car) return "";
  const { L, t } = car;
  return `<svg class="car-portrait" viewBox="0 0 ${L} ${HEIGHT_FT}" width="${width}" height="${Math.round((width * HEIGHT_FT) / L)}" role="img" aria-label="${esc(t.name)}"><g transform="matrix(1 0 0 -1 0 ${HEIGHT_FT})">${stableIds(drawCar(car, { couplers: false }), uid)}</g></svg>`;
}

// Where to look up car i's fact sheet (data/models.json), most specific
// first: model@railroad/route, model@railroad, model. The generic "coach"
// is an Amfleet I except on the Piedmont and on a railroad with its own
// cars file, whose FACTS may give "coach@<agency>".
export function modelIds(c, i) {
  const key = c.cars[i]?.type?.key || "coach";
  const k = key === "coach" && !carsFile(c.agency) && !(c.agency === "amtrak" && c.route === "Piedmont") ? "amfleet" : key;
  return [`${k}@${c.agency}/${c.route || ""}`, `${k}@${c.agency}`, k];
}
