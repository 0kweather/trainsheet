// Slovakia's railroads' cars (scripts/railroads/zsr.py): ZSSK, RegioJet and
// Leo Express. The feed's vehicle ids are train numbers, so every train is
// drawn as what usually runs on its kind of train, labeled as typical. The
// bodies are Czechia's (czechia.cars.js), shared where the same models run
// on both sides of the border, in each operator's paint.

import { TYPES as CZ_TYPES, MODELS as CZ_MODELS, FACTS as CZ_FACTS } from "./czechia.cars.js?v=dev";

// The Czech types these railroads run (added under their own keys only once,
// whichever file loads first).
const SHARED = ["czVectron", "czCoach", "czElefant471", "czElefant071", "czElefant971", "czPanter640", "czPanterMid", "czLint", "czFlirtCab", "czFlirtMid"];
export const TYPES = Object.fromEntries(SHARED.map((k) => [k, CZ_TYPES[k]]));
export const MODELS = Object.fromEntries(SHARED.map((k) => [k, CZ_MODELS[k]]));

// ZSSK's leased Vectrons (383 101-115), its CityElefants (671) and its
// three-car Panters (661); Leo Express Slovensko's FLIRTs are the Czech
// company's (480 001-005), its LINT 41s leased German 648s.
export const FLEETS = {
  zssk: [[383101, 383115, "czVectron"], [671001, 671019, "czElefant471"], [661001, 661013, "czPanter640"]],
  leoexpresssk: [[480001, 480005, "czFlirtCab"]],
};

const set = (label, ...units) => ({ label, units });
const ZSSK_LOCO = (n) => set("A Vectron (383) locomotive and ZSSK coaches", ["czVectron", 1], ["czCoach", n]);
const ELEFANT = set("Elefant (671): a three-car double-deck electric unit", ["czElefant471", 1], ["czElefant071", 1], ["czElefant971", 1]);
const PANTER = set("Panter (661): a three-car electric unit", ["czPanter640", 1], ["czPanterMid", 1], ["czPanter640", 1]);
const RJ = set("A locomotive and RegioJet's yellow coaches", ["czVectron", 1], ["czCoach", 6]);
const FLIRT = set("Stadler FLIRT: a five-section electric unit", ["czFlirtCab", 1], ["czFlirtMid", 3], ["czFlirtCab", 1]);
const LINT = set("Coradia LINT 41: a two-section diesel unit", ["czLint", 2]);

// ZSSK: its express trains (Rýchlik, Expres, IC, EC, SuperCity, night
// trains, railjets on its side of the border) are locomotive-hauled, by the
// 383 Vectrons on the Bratislava-Košice main line among others; its
// regional trains (Os, REX, Zr) are units, CityElefants and Panters on the
// electrified lines, class 861 diesels (not drawn) elsewhere.
export const TYPICAL = {
  zssk: (t, reported) => {
    if (reported === "czVectron") return ZSSK_LOCO(6);
    if (reported === "czElefant471") return ELEFANT;
    if (reported === "czPanter640") return PANTER;
    const r = t.route || "";
    if (/^(Osobný vlak|Regionálny expres|Zrýchlený vlak)$/.test(r)) return ELEFANT;
    return ZSSK_LOCO(r === "Regionálny rýchlik" ? 4 : 7);
  },
  regiojetsk: () => RJ,
  // Leo Express Slovensko: LINT 41s on Bratislava-Komárno; the FLIRTs on the
  // Leo Express trains from Prague to Košice.
  leoexpresssk: (t, reported) => (reported === "czFlirtCab" || t.route === "Leo Express" ? FLIRT : LINT),
};

const WP = "https://en.wikipedia.org/wiki/";
const sk = (page) => `https://sk.wikipedia.org/wiki/${page}`;
// The shared models' own sheets, then these railroads'.
export const FACTS = {
  ...CZ_FACTS,
  "czElefant471@zssk": { model: "Elefant (class 671)", type: "Double-deck electric multiple unit", builder: "Škoda Vagonka", fleet: "19 three-car units", topSpeedMph: 99.4,
    powerHp: 2682, source: `${WP}ČD_Class_471`,
    about: "ZSSK's version of the CityElefant, a three-car double-deck unit for 160 km/h, on regional trains around Bratislava, Žilina and Košice." },
  "czPanter640@zssk": { model: "Panter (class 661)", type: "Electric multiple unit", builder: "Škoda Transportation and ŽOS Trnava", built: "2020–2021", fleet: "13 three-car units",
    topSpeedMph: 99.4, seats: 247, source: `${WP}Škoda_7Ev`,
    about: "ZSSK's three-car Panters, delivered for the Žilina area alongside four-car class 660s." },
  "czElefant071@zssk": { model: "Elefant (class 671)", type: "Double-deck trailer", builder: "Škoda Vagonka", source: `${WP}ČD_Class_471`,
    about: "The middle car of a ZSSK Elefant, unpowered, both decks reached from the low floor between the trucks." },
  "czElefant971@zssk": { model: "Elefant (class 671)", type: "Double-deck cab trailer", builder: "Škoda Vagonka", source: `${WP}ČD_Class_471`,
    about: "The Elefant's cab trailer, at the opposite end from the power car." },
  "czPanterMid@zssk": { model: "Panter (class 661)", type: "Electric multiple unit", builder: "Škoda Transportation and ŽOS Trnava", topSpeedMph: 99.4, source: `${WP}Škoda_7Ev`,
    about: "The intermediate car of a three-car ZSSK Panter, carrying the pantograph." },
  "czVectron@zssk": { model: "Siemens Vectron (class 383)", type: "Electric locomotive", builder: "Siemens Mobility", built: "Since 2017", fleet: "15, leased",
    topSpeedMph: 99.4, powerHp: 8583, lengthFt: 62.3, source: `${WP}Siemens_Vectron`,
    about: "ZSSK leased ten multi-system Vectrons in 2017 for Bratislava–Košice and later Vienna–Bratislava trains; five more arrived in December 2024. They run on both Slovakia's 3 kV DC and 25 kV AC lines." },
  "czVectron@regiojetsk": { model: "Locomotive", type: "Electric locomotive", builder: "Siemens and others", fleet: "Leased, in RegioJet yellow", source: `${WP}RegioJet`,
    about: "RegioJet's trains between Prague and Košice are hauled by leased multi-system locomotives in its yellow, drawn here as a Vectron." },
  "czCoach@zssk": { model: "Long-distance coach", type: "Passenger coach", builder: "Various", lengthFt: 86.6, source: sk("Železničná_spoločnosť_Slovensko"),
    about: "ZSSK's express coaches are mostly air-conditioned, with power outlets and vacuum toilets, and increasingly Wi-Fi. They are drawn here in a simplified white and blue." },
  "czCoach@regiojetsk": { model: "RegioJet coach", type: "Passenger coach", builder: "Various", lengthFt: 86.6, source: `${WP}RegioJet`,
    about: "RegioJet's yellow coaches, with Low Cost, Standard, Relax and Business classes and drinks and snacks served at the seat." },
  "czLint@leoexpresssk": { model: "Alstom Coradia LINT 41 (class 648)", type: "Diesel multiple unit", builder: "Alstom", fleet: "21 leased from Alpha Trains",
    topSpeedMph: 87, lengthFt: 137.4, seats: 115, source: "https://cs.wikipedia.org/wiki/Leo_Express",
    about: "Leo Express Slovensko took over the regional trains between Bratislava and Komárno in December 2023 with leased German LINT 41s." },
};
