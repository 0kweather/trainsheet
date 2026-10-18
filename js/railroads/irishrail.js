// Irish Rail's running trains from its realtime API (scripts/railroads/irishrail.py),
// with stops, lines and headings from its timetable (data/schedules/irishrail.json).

import { train, valid, delayText, loadSchedule, runNow, runStops } from "../sources.js?v=dev";

const TZ = "Europe/Dublin";
const iso = (sec) => new Date(sec * 1000).toISOString();

// The message's own names are shorter than the timetable's ("Cork" for "Cork
// (Kent)", "Bray" for "Bray (Daly)", "Connolly" for "Dublin Connolly").
const norm = (s) => String(s || "").toLowerCase().replace(/\(.*?\)|\bstation\b|\bstn\b|^dublin\b/g, "").replace(/[^a-z]/g, "");
// The first of `list` from index `from` named `text`: the exact name if
// there is one ("Limerick", not "Limerick Junction"), else the first that
// begins with it.
function find(list, text, nameOf, from = 0) {
  const want = norm(text);
  if (!want) return -1;
  const i = list.findIndex((s, k) => k >= from && norm(nameOf(s)) === want);
  if (i >= 0) return i;
  return list.findIndex((s, k) => {
    const n = norm(nameOf(s));
    return k >= from && !!n && (n.startsWith(want) || want.startsWith(n));
  });
}

function bearing(a, b) {
  const r = Math.PI / 180, dl = (b[1] - a[1]) * r;
  const y = Math.sin(dl) * Math.cos(b[0] * r);
  const x = Math.cos(a[0] * r) * Math.sin(b[0] * r) - Math.sin(a[0] * r) * Math.cos(b[0] * r) * Math.cos(dl);
  return ((Math.atan2(y, x) / r) + 360) % 360;
}
const km = (a, b) => Math.hypot((b[1] - a[1]) * Math.cos((a[0] * Math.PI) / 180), b[0] - a[0]) * 111.2;

// "E120\n15:24 - Malahide to Greystones (-1 mins late)\nArrived Bray next stop
// Greystones": the API writes its line breaks as a backslash and an n.
function message(text) {
  const lines = String(text || "").split(/\\n|\n/).map((s) => s.trim());
  const run = /^(\d{1,2}:\d{2})\s*-\s*(.+?)\s+to\s+(.+?)\s*\((-?\d+) mins? late\)/.exec(lines[1] || "");
  const at = /^(Arrived|Departed)\s+(.+?)\s+next stop\s+(.+)$/i.exec(lines[2] || "");
  return {
    origin: run?.[2] || null, destination: run?.[3] || null, delay: run ? +run[4] : null,
    arrived: at && /^arrived/i.test(at[1]) ? at[2] : null, last: at?.[2] || null, next: at?.[3] || null,
  };
}

export const parse = {
  irishrail: async (text) => {
    const doc = new DOMParser().parseFromString(text, "application/xml");
    const tt = await loadSchedule("irishrail").catch(() => null);
    const now = Date.now() / 1000, out = [];
    const field = (el, name) => el.getElementsByTagName(name)[0]?.textContent.trim() || "";
    for (const el of doc.getElementsByTagName("objTrainPositions")) {
      // N: not yet left its origin (listed ten minutes ahead), T: terminated.
      if (field(el, "TrainStatus") !== "R") continue;
      const code = field(el, "TrainCode"), lat = +field(el, "TrainLatitude"), lon = +field(el, "TrainLongitude");
      if (!code || !valid(lat, lon)) continue;
      const m = message(field(el, "PublicMessage"));
      const delay = m.delay ?? 0;
      const run = tt ? runNow(tt, code, now, Math.max(3600, delay * 60 + 1800)) : null;
      const name = (s) => tt.stops[s.stopId]?.[0] || s.stopId;
      const list = run ? runStops(run, delay * 60) : [];
      // The stop the message says is next, after the one it last passed.
      const lastIdx = find(list, m.last, name);
      let next = find(list, m.next, name, lastIdx + 1);
      if (next < 0 && list.length) next = list.findIndex((s) => s.arrival.time >= now - 30);
      // Standing at a station: that one is next until it leaves.
      const here = m.arrived ? lastIdx : -1;
      if (here >= 0) next = here;
      // No heading in the feed: toward the next stop (or past it, when the
      // signals already place the train there); with no run, toward the
      // station the message names.
      const ahead = list.length ? list.slice(Math.max(next, 0)).map((s) => tt.stops[s.stopId])
        : tt ? [Object.values(tt.stops)[find(Object.values(tt.stops), m.next, (p) => p[0])]] : [];
      const toward = ahead.find((p) => p && km([lat, lon], [p[1], p[2]]) > 0.3);
      const head = toward ? bearing([lat, lon], [toward[1], toward[2]]) : null;
      out.push(train({
        id: `irishrail:${code}`, agency: "irishrail", number: code,
        route: run?.line || tt?.trips[code]?.[0]?.[1] || (/^E/.test(code) ? "DART" : null),
        lat, lon, bearing: head,
        origin: list.length ? name(list[0]) : m.origin, destination: list.length ? name(list[list.length - 1]) : m.destination,
        nextStop: next >= 0 ? name(list[next]) : m.next,
        delayMin: m.delay, statusText: delayText(m.delay),
        stops: list.length ? list.map((s, i) => ({
          key: `irishrail:${s.stopId}`, name: name(s), tz: TZ,
          time: iso(i < next ? s.departure.time : s.arrival.time),
          arr: iso(s.arrival.time), dep: iso(s.departure.time),
          status: next < 0 || i < next ? "past" : i === next ? "next" : "future",
          track: null, scheduled: iso(s.scheduled), here: i === here,
        })) : null,
        updated: now * 1000,
      }));
    }
    return out;
  },
};
