// Sweden's passenger trains from Trafikverket (scripts/railroads/sweden.py):
// the relay's compact answer, each train's last GPS fix by its advertised
// number with its last departure (product, owner, destination, delay), and
// its stops from its run in the timetable (data/schedules/<railroad>.json),
// shifted by that delay.

import { train, valid, iso, delayText, loadSchedule, runNow } from "../sources.js?v=dev";

// The plug-in's railroads, in the order a number is looked up in their timetables.
const IDS = ["sj", "snalltaget", "tagab", "mtrx", "arlandaexpress", "slpendel", "malartag", "ostgotapendeln", "tib",
  "norrtag", "varmlandstag", "xtaget", "pagatag", "oresundstag", "vasttag", "krosatag"];
// A train's railroad by the product it runs as (Trafikverket's
// ProductInformation, "SJ Snabbtåg", "Öresundståg"), the first that
// matches; null is a train shown by another plug-in (Vy's Oslo trains,
// Entur's). Upptåget's trains run as Mälartåg now.
const PRODUCTS = [
  [/öresundståg/i, "oresundstag"], [/pågatåg/i, "pagatag"], [/västtåg/i, "vasttag"], [/krösatåg/i, "krosatag"],
  [/mälartåg|upptåget/i, "malartag"], [/östgötapendeln/i, "ostgotapendeln"], [/tåg i bergslagen/i, "tib"],
  [/norrtåg/i, "norrtag"], [/värmlandstrafik|värmlandståg/i, "varmlandstag"], [/x-tåget/i, "xtaget"],
  [/arlanda\s*express/i, "arlandaexpress"], [/^mtr|^vr\b|grodan/i, "mtrx"], [/snälltåget/i, "snalltaget"], [/tågab/i, "tagab"],
  [/^sj\b|snabbtåg|intercity|nattåg|euronight/i, "sj"], [/^vy\b/i, null],
];
// Else by the train's owner (InformationOwner, the authority or company
// that advertises it): SL's and Västtrafik's commuter trains run as
// "Pendeltåg", Skånetrafiken's as Pågatåg unless the product says Öresundståg.
const OWNERS = [
  [/^sl$/i, "slpendel"], [/^sj/i, "sj"], [/skånetrafiken/i, "pagatag"], [/västtrafik/i, "vasttag"],
  [/mälardalstrafik|^ul$/i, "malartag"], [/östgötatrafiken/i, "ostgotapendeln"], [/bergslagen/i, "tib"],
  [/norrtåg/i, "norrtag"], [/värmlandstrafik/i, "varmlandstag"], [/x-trafik/i, "xtaget"], [/krösatåg|jlt|kronoberg|klt|blekinge/i, "krosatag"],
  [/arlanda/i, "arlandaexpress"], [/mtr|vr snabbtåg/i, "mtrx"], [/snälltåget/i, "snalltaget"], [/tågab/i, "tagab"], [/^vy/i, null],
];
const matchOf = (list, text) => (text ? list.find(([re]) => re.test(text)) : undefined);
// Lines for a train its railroad's timetable doesn't have (an extra run):
// SJ's by its product, as the timetable names them; the others by brand.
const sjLine = (p) => (/snabb/i.test(p) ? "SJ Snabbtåg" : /intercity/i.test(p) ? "SJ InterCity" : /natt|euronight/i.test(p) ? "SJ Nattåg" : "SJ Regional");
const LINES = {
  snalltaget: "Snälltåget", tagab: "Tågab", mtrx: "VR Snabbtåg", arlandaexpress: "Arlanda Express", slpendel: "Pendeltåg",
  malartag: "Mälartåg", ostgotapendeln: "Östgötapendeln", tib: "Tåg i Bergslagen", norrtag: "Norrtåg",
  varmlandstag: "Värmlandstrafik", xtaget: "X-Tåget", pagatag: "Pågatåg", oresundstag: "Öresundståg",
  vasttag: "Västtågen", krosatag: "Krösatåg",
};
const lineOf = (agency, product) => (agency === "sj" ? sjLine(product || "") : LINES[agency]);

// A fix older than this is a train standing switched off, or gone.
const STALE = 10 * 60;
// Minutes before its first departure and after its last arrival a train
// still counts as running its trip; outside them it's parked or shunting.
const SLACK = 15 * 60;
const TZ = "Europe/Stockholm";
// Station names as Trafikverket and the timetable write them, compared
// plainly ("Stockholm C", "Hallsberg"): a train's last departure finds its
// stop in the run.
const plain = (s) => String(s || "").toLowerCase().replace(/\s+(c|central|centralstation)$/, "").trim();

async function timetables(agencies) {
  const got = await Promise.all(agencies.map((a) => loadSchedule(a).catch(() => null)));
  return Object.fromEntries(agencies.map((a, i) => [a, got[i]]));
}

export const parse = {
  sweden: async (body) => {
    const now = Date.now() / 1000;
    const trains = (body?.trains || []).filter((t) => t.n && valid(t.pos?.[0], t.pos?.[1]) && !(t.ts && now - t.ts > STALE));
    // Each train's railroad by product or owner; the ones neither names are
    // looked up by number in every timetable.
    const named = trains.map((t) => {
      const m = matchOf(PRODUCTS, t.product) || matchOf(OWNERS, t.owner);
      return m ? m[1] : undefined;
    });
    const wanted = named.some((a) => a === undefined) ? IDS : [...new Set(named.filter(Boolean))];
    const tts = await timetables(wanted);
    const out = [], seen = new Set();
    trains.forEach((t, i) => {
      if (named[i] === null) return; // another plug-in's
      const late = Math.max(0, t.delay || 0) * 60;
      let agency = named[i], run = null;
      for (const a of agency ? [agency] : IDS) {
        const r = tts[a] && runNow(tts[a], t.n, now - late, SLACK);
        if (r) {
          [agency, run] = [a, r];
          break;
        }
      }
      // No railroad (freight, an empty move) or seen already (a train reported twice).
      if (!agency || seen.has(`${agency}:${t.n}`)) return;
      seen.add(`${agency}:${t.n}`);
      const fields = {
        id: `${agency}:${t.n}`, agency, number: t.n, product: t.product || run?.line || lineOf(agency, t.product),
        lat: t.pos[0], lon: t.pos[1], bearing: Number.isFinite(t.heading) ? t.heading : null,
        speedMph: Number.isFinite(t.speed) ? t.speed / 1.609344 : null,
        updated: Math.min((t.ts || body.at || now) * 1000, Date.now()),
        route: run?.line || lineOf(agency, t.product),
      };
      if (run) {
        const r = runFields(agency, tts[agency], run, t, now);
        if (r) out.push(train({ ...fields, ...r }));
        return;
      }
      // A run its timetable doesn't have: where it's going and how late, as sent.
      out.push(train({
        ...fields, destination: t.to || null,
        delayMin: t.delay != null ? Math.max(0, t.delay) : null,
        statusText: t.delay != null ? delayText(Math.max(0, t.delay)) : null,
      }));
    });
    return out;
  },
};

// A run's stops, origin, destination, next stop and delay. Its last
// departure's delay holds for the stops after it (an early train waits at
// its stops, so none runs ahead); the stops up to that departure are behind
// it. Null for a run whose last stop it reached over five minutes ago (the
// unit is running as another train, or parked).
function runFields(agency, tt, run, t, now) {
  const tz = tt.tz || TZ;
  const delay = Math.max(0, t.delay || 0) * 60;
  const list = run.pat.map(([id, arr, dep]) => {
    const a = run.day + arr * 60 + delay;
    return { id, a, l: Math.max(a, run.day + dep * 60 + delay), scheduled: run.day + dep * 60 };
  });
  const name = (s) => tt.stops[s.id]?.[0] || s.id;
  // Its last departure, by name, past any stop of the same name it passed
  // earlier (a run through a station twice).
  const lastAt = t.last ? list.findIndex((s) => plain(name(s)) === plain(t.last) && Math.abs(s.l - (t.lastTs || s.l)) < 3 * 3600) : -1;
  let next = list.findIndex((s, i) => i > lastAt && (i === list.length - 1 ? s.a : s.l) >= now - 30);
  // Later than the delay it last left with: still bound for the stop after that.
  if (next < 0 && lastAt >= 0 && lastAt + 1 < list.length) next = lastAt + 1;
  if (next < 0 && now - list[list.length - 1].a > 300) return null;
  const at = list[next];
  const fields = {
    origin: name(list[0]), destination: name(list[list.length - 1]), nextStop: at ? name(at) : null,
    delayMin: t.delay != null ? delay / 60 : null, statusText: t.delay != null ? delayText(delay / 60) : null,
    stops: list.map((s, i) => ({
      key: `${agency}:${s.id}`, name: name(s), tz,
      time: iso((i === list.length - 1 ? s.a : s.l) * 1000), arr: iso(s.a * 1000), dep: iso(s.l * 1000),
      status: next < 0 || i < next ? "past" : i === next ? "next" : "future",
      track: null, scheduled: iso(s.scheduled * 1000), here: i === next && s.a <= now,
    })),
  };
  if (at && at.a <= now) fields.statusText = `At ${fields.nextStop}`;
  return fields;
}
