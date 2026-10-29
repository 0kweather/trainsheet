// Germany (scripts/railroads/germany.py): one train's delay and platform at
// its next station from DB's Timetables API (DB API Marketplace, free plan:
// 60 requests a minute; secrets DB_CLIENT_ID and DB_API_KEY), asked for only
// while a viewer has the train open or tracks it; the same bytes as the
// module's relay_fetch.
//
// The trains are unnumbered (gtfs.de's timetable has no numbers), so the
// page asks by the train's next station, its timetabled departure there and
// its line (detail source "by": "stop"; query { at: EVA number, time:
// "yyMMddHHmm" in Germany's time, line: "RE 1" }). The station's planned
// timetable for that hour (/plan/{eva}/{yyMMdd}/{HH}, kept 6 hours) gives
// the train calling then on that line, its stop id and its category and
// number ("ICE", "1229"); the station's known changes (/fchg/{eva}, kept 90
// seconds and shared by every train asked for there) give its forecast
// time, platform and cancellation. A station whose S-Bahn or low level has
// a board of its own (Berlin's S-Bahn, "Frankfurt (Main) Hbf (tief)") is
// asked there too when its own board has no such train (germany_parts.js).
// Upstream requests are held to 50 a
// minute per copy of the relay, under the API's 60; past that a station's
// last copy is used, or nothing.

import { PARTS } from "./germany_parts.js";

const API = "https://apis.deutschebahn.com/db-api-marketplace/apis/timetables/v1";
const PLAN_MS = 6 * 3600 * 1000, CHANGES_MS = 90 * 1000, PER_MINUTE = 50;
const plans = new Map(), changes = new Map(); // key -> { at, text }
let asked = []; // times this copy went upstream, in the last minute

// ---------- The XML, read by hand (no DOMParser in a Worker) ----------
const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([a-zA-Z]+)="([^"]*)"/g)].map((m) => [m[1], unescapeXml(m[2])]));
const unescapeXml = (s) => s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

// The stops of a timetable answer: [{ id, tl: {c, n}, ar: {...}, dp: {...} }].
export function stopsOf(xml) {
  const out = [];
  for (const m of String(xml || "").matchAll(/<s\b([^>]*?)(?:\/>|>([\s\S]*?)<\/s>)/g)) {
    const s = { ...attrs(m[1]), tl: null, ar: null, dp: null };
    for (const e of (m[2] || "").matchAll(/<(tl|ar|dp)\b([^>]*?)\/?>/g)) s[e[1]] = attrs(e[2]);
    out.push(s);
  }
  return out;
}
export const stationOf = (xml) => attrs((String(xml || "").match(/<timetable\b([^>]*)>/) || ["", ""])[1]).station || null;

// "2610281430" in Germany's time, as epoch seconds.
export function epoch(t) {
  if (!/^\d{10}$/.test(String(t || ""))) return null;
  const [y, mo, d, h, mi] = [0, 2, 4, 6, 8].map((i) => +t.slice(i, i + 2));
  const guess = Date.UTC(2000 + y, mo - 1, d, h, mi);
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", hourCycle: "h23", year: "numeric",
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(guess)).map((p) => [p.type, p.value]));
  const local = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return Math.round((guess - (local - guess)) / 1000);
}

const lineKey = (s) => String(s || "").replace(/\s+/g, "").toUpperCase();

// The planned stop of the train asked for: calling at `time` (its departure,
// or its arrival where it ends there) on `line` ("RE 1": category RE, line
// 1; "ICE": the category alone). Of several, the one whose category and line
// both match; one of the category only if it's the only one at that minute.
export function planned(stops, time, line) {
  const want = lineKey(line);
  const at = stops.filter((s) => s.dp?.pt === time || s.ar?.pt === time);
  const full = (s) => lineKey((s.tl?.c || "") + (s.dp?.l || s.ar?.l || ""));
  const exact = at.filter((s) => full(s) === want || (s.tl?.n && lineKey(s.tl.c + s.tl.n) === want));
  if (exact.length) return exact[0];
  const cat = at.filter((s) => {
    const c = lineKey(s.tl?.c);
    return c && (want === c || (want.startsWith(c) && /^\d/.test(want.slice(c.length))));
  });
  return cat.length === 1 ? cat[0] : null;
}

// The page's detail shape (js/sources.js applyDetail) for the train's stop
// at the station: its timetabled times, the forecast delay (minutes, from
// the change's time, departure before arrival), its platform (changed or
// planned) and whether it calls there; shownNumber: the number DB runs it
// under, for a train the timetable leaves unnumbered.
export function detail(planXml, changesXml, query) {
  const s = planned(stopsOf(planXml), query.time, query.line);
  if (!s) return { found: false };
  const ch = stopsOf(changesXml).find((c) => c.id === s.id) || {};
  const ar = { ...(s.ar || {}), ...(ch.ar || {}) }, dp = { ...(s.dp || {}), ...(ch.dp || {}) };
  const ev = s.dp ? dp : ar;
  const late = ev.ct && ev.pt ? Math.round((epoch(ev.ct) - epoch(ev.pt)) / 60) : null;
  const cancelled = (!s.ar || ar.cs === "c") && (!s.dp || dp.cs === "c");
  return {
    found: true, number: s.tl?.n || null, shownNumber: s.tl?.n || null, category: s.tl?.c || null, date: query.date,
    delay: cancelled ? null : late, cancelled: false, departed: false, arrived: false, last: null,
    stops: [{ name: stationOf(planXml), arr: s.ar ? epoch(s.ar.pt) : null, dep: s.dp ? epoch(s.dp.pt) : null,
              actualArr: null, actualDep: null, platform: ev.cp || ev.pp || null, cancelled }],
  };
}

// ---------- Upstream, within the limit ----------
async function cached(store, key, maxAge, url, env, now) {
  const hit = store.get(key);
  if (hit && now - hit.at < maxAge) return hit.text;
  asked = asked.filter((t) => now - t < 60 * 1000);
  if (asked.length >= PER_MINUTE) return hit ? hit.text : null;
  asked.push(now);
  const res = await fetch(url, { headers: { "DB-Client-Id": env.DB_CLIENT_ID, "DB-Api-Key": env.DB_API_KEY, Accept: "application/xml" } });
  if (res.status === 404) return ""; // no timetable for that hour or station
  if (!res.ok) {
    if (hit) return hit.text;
    throw new Error(`HTTP ${res.status}`);
  }
  const text = await res.text();
  if (store.size > 3000) store.clear();
  store.set(key, { at: now, text });
  return text;
}

export async function answer(env, query, now = Date.now()) {
  const { at, time } = query;
  if (!/^\d{7}$/.test(at || "") || !/^\d{10}$/.test(time || "")) return { found: false };
  let out = { found: false };
  for (const eva of [at, ...(PARTS[at] ? [PARTS[at]] : [])]) { // the station's board, then its S-Bahn part's
    const plan = await cached(plans, `${eva}|${time.slice(0, 8)}`, PLAN_MS, `${API}/plan/${eva}/${time.slice(0, 6)}/${time.slice(6, 8)}`, env, now);
    if (!plan) continue;
    const fchg = await cached(changes, eva, CHANGES_MS, `${API}/fchg/${eva}`, env, now);
    out = detail(plan, fchg || "", query);
    if (out.found) break;
  }
  return out;
}

// query: { train, date, from, at, time, line }, checked by the relay.
export async function fetchFeed(env, name, ctx, query) {
  const out = await answer(env, query);
  return new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json" } });
}

export const _reset = () => { plans.clear(); changes.clear(); asked = []; };
