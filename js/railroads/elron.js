// Elron's running trains from the live map on its site (scripts/railroads/elron.py),
// with stops from its timetable (data/schedules/elron.json), which numbers no
// trains: each is matched to the run it is on by its run's first and last
// times, else by its line, position and delay.

import { train, valid, delayText, loadSchedule, localMinutes, runStops } from "../sources.js?v=dev";

const TZ = "Europe/Tallinn";
const iso = (sec) => new Date(sec * 1000).toISOString();
// A position the map hasn't moved for this long is a train that has stopped
// reporting (or a unit parked after its run).
const STALE_SECONDS = 600;

// Lines as the plug-in names them ("Valga - Tartu" is "Tartu–Valga"): the
// same rule as elron.py's line().
const HUBS = ["Tallinn", "Tartu"];
const ENDS = { Piusa: "Koidula", Riia: "Rīga", "Tartu / Valga": "Tartu" };
function lineOf(text) {
  const name = String(text || "").replace(/\s*\(.*?\)/g, "").trim();
  const cut = name.indexOf("-");
  if (cut < 0) return null;
  let a = name.slice(0, cut).trim(), b = name.slice(cut + 1).trim();
  a = ENDS[a] || a;
  b = ENDS[b] || b;
  if ((HUBS.includes(b) && !HUBS.includes(a)) || b === "Tallinn") [a, b] = [b, a];
  return `${a}–${b}`;
}

const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
const km = (a, b) => Math.hypot((b[1] - a[1]) * Math.cos((a[0] * Math.PI) / 180), b[0] - a[0]) * 111.2;

// "2026-10-18 07:41:05", Tallinn's clock, as epoch seconds.
function localTime(text) {
  const guess = Date.parse(String(text || "").replace(" ", "T") + "Z") / 1000;
  if (!Number.isFinite(guess)) return null;
  const off = ((localMinutes(guess, TZ) * 60 - (guess % 86400) + 86400 * 1.5) % 86400) - 43200;
  return Math.round(guess - off);
}

// Every run of the timetable going around `now`: today's, and yesterday's
// still running past midnight ({ day, line, pat }, as runNow gives one).
function runsAround(tt, now, slack) {
  const midnight = Math.round(now - localMinutes(now, tt.tz) * 60);
  const start = Date.parse(`${tt.start}T00:00:00Z`) / 1000;
  const out = [];
  for (const day of [midnight, midnight - 86400]) {
    const idx = Math.round((day - start) / 86400);
    const bit = idx >= 0 && idx < 14 ? idx : 7 + ((((idx - 7) % 7) + 7) % 7);
    for (const pats of Object.values(tt.trips)) {
      for (const [mask, line, pat] of pats) {
        if ((mask >> bit) & 1 && now >= day + pat[0][2] * 60 - slack && now <= day + pat[pat.length - 1][1] * 60 + slack) {
          out.push({ day, line, pat });
        }
      }
    }
  }
  return out;
}

// Where a run's timetable puts it at `sec`, between the stops either side.
function placeAt(tt, run, sec) {
  const at = (i, k) => run.day + run.pat[i][k] * 60;
  const pos = (i) => tt.stops[run.pat[i][0]].slice(1, 3);
  if (sec <= at(0, 2)) return pos(0);
  for (let i = 0; i < run.pat.length - 1; i++) {
    if (sec <= at(i, 2)) return pos(i);
    if (sec < at(i + 1, 1)) {
      const f = (sec - at(i, 2)) / Math.max(60, at(i + 1, 1) - at(i, 2));
      const a = pos(i), b = pos(i + 1);
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    }
  }
  return pos(run.pat.length - 1);
}

// "05:02" as minutes past midnight.
const clock = (text) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(text || ""));
  return m ? +m[1] * 60 + +m[2] : null;
};

// The run a train is on. The map gives the times its run leaves its first
// stop and reaches its last, and the timetable files a train that changes
// number on the way as one trip (the map's 140, "Tallinn - Tapa (Tartu)",
// 05:02-06:18, is the first part of the timetable's 05:02 to Tartu): the
// stretch of a run that leaves a stop then and reaches a later one then (the
// nearest, if two do). Else, of its line's runs (any line's, when none of
// its own fits), the one whose timetable, less the train's delay, puts it
// nearest where it is and which has the stop it last passed, within 8 km.
function matchRun(tt, runs, { line, start, end, at, sec, delay, last }) {
  const near = (list, limit) => {
    let best = null, bestKm = limit;
    for (const run of list) {
      const d = km(at, placeAt(tt, run, sec - delay * 60));
      if (d < bestKm) [best, bestKm] = [run, d];
    }
    return best;
  };
  if (start != null && end != null) {
    const timed = [];
    for (const r of runs) {
      const i = r.pat.findIndex((s) => s[2] % 1440 === start);
      if (i < 0) continue;
      // The map's end is a few minutes off the timetable's at times (its
      // 06:18 at Tapa, the timetable's 06:22): the stop nearest it, within 10.
      let j = -1;
      r.pat.forEach((s, k) => {
        const off = Math.abs(s[1] % 1440 - end);
        if (k > i && off <= 10 && (j < 0 || off < Math.abs(r.pat[j][1] % 1440 - end))) j = k;
      });
      if (j > i) timed.push({ ...r, pat: r.pat.slice(i, j + 1) });
    }
    if (timed.length) return near(timed, Infinity);
  }
  const passed = last ? runs.filter((r) => r.pat.some(([id]) => norm(tt.stops[id][0]) === last)) : runs;
  return near(passed.filter((r) => !line || r.line === line), 8) || near(passed, 8);
}

function bearing(a, b) {
  const r = Math.PI / 180, dl = (b[1] - a[1]) * r;
  const y = Math.sin(dl) * Math.cos(b[0] * r);
  const x = Math.cos(a[0] * r) * Math.sin(b[0] * r) - Math.sin(a[0] * r) * Math.cos(b[0] * r) * Math.cos(dl);
  return ((Math.atan2(y, x) / r) + 360) % 360;
}

export const parse = {
  // {"status": 1, "data": [{reis, liin, reisi_algus_aeg, reisi_lopp_aeg,
  // latitude, longitude, rongi_suund, kiirus, asukoha_uuendus, viimane_peatus,
  // erinevus_plaanist, reisi_staatus}, ...]}, every value a string; with no
  // train running, "data" is {"text": "Pole andmeid"} ("no data").
  elron: async (body) => {
    const list = Array.isArray(body?.data) ? body.data : [];
    if (!list.length) return [];
    const tt = await loadSchedule("elron").catch(() => null);
    const now = Date.now() / 1000, out = [];
    const runs = tt ? runsAround(tt, now, 3 * 3600) : [];
    for (const v of list) {
      const number = String(v.reis ?? "").trim(), lat = +v.latitude, lon = +v.longitude;
      // No number, no position, a line that isn't a train's (a replacement
      // bus) or a cancelled run ("tühistatud"; a run as timetabled is
      // "plaaniline"): not a train in service.
      if (!number || !valid(lat, lon) || /buss|bus\b/i.test(v.liin || "") || /tühist|tuhist/i.test(v.reisi_staatus || "")) continue;
      const updated = localTime(v.asukoha_uuendus) ?? now;
      if (now - updated > STALE_SECONDS) continue;
      const delay = Number.isFinite(+v.erinevus_plaanist) && v.erinevus_plaanist !== "" && v.erinevus_plaanist != null ? +v.erinevus_plaanist : null;
      const line = lineOf(v.liin);
      const last = norm(v.viimane_peatus);
      const run = tt ? matchRun(tt, runs, { line, start: clock(v.reisi_algus_aeg), end: clock(v.reisi_lopp_aeg),
                                            at: [lat, lon], sec: updated, delay: delay ?? 0, last }) : null;
      const name = (s) => tt.stops[s.stopId]?.[0] || s.stopId;
      const stops = run ? runStops(run, (delay ?? 0) * 60) : [];
      // The stop after the one it last passed; else the first still ahead by
      // the clock.
      const lastIdx = last ? stops.findIndex((s) => norm(name(s)) === last) : -1;
      let next = lastIdx >= 0 ? lastIdx + 1 : stops.findIndex((s) => s.arrival.time >= now - 30);
      if (next >= stops.length) next = -1;
      // Standing at the station it last reached: that one, until it leaves.
      const lastPos = lastIdx >= 0 ? tt.stops[stops[lastIdx].stopId] : null;
      const here = lastPos && +v.kiirus === 0 && km([lat, lon], [lastPos[1], lastPos[2]]) < 0.4 && lastIdx < stops.length - 1 ? lastIdx : -1;
      if (here >= 0) next = here;
      // The map's own heading; toward the next stop where it gives none.
      let head = v.rongi_suund !== "" && v.rongi_suund != null && Number.isFinite(parseInt(v.rongi_suund, 10)) ? parseInt(v.rongi_suund, 10) % 360 : null;
      if (head == null && next >= 0) {
        const p = tt.stops[stops[next].stopId];
        if (km([lat, lon], [p[1], p[2]]) > 0.3) head = bearing([lat, lon], [p[1], p[2]]);
      }
      const kmh = +v.kiirus;
      out.push(train({
        id: `elron:${number}`, agency: "elron", number,
        route: run?.line || line, lat, lon, bearing: head,
        speedMph: Number.isFinite(kmh) && v.kiirus !== "" ? kmh * 0.621371 : null,
        origin: stops.length ? name(stops[0]) : null,
        destination: stops.length ? name(stops[stops.length - 1]) : null,
        nextStop: next >= 0 ? name(stops[next]) : null,
        delayMin: delay, statusText: delayText(delay),
        stops: stops.length ? stops.map((s, i) => ({
          key: `elron:${s.stopId}`, name: name(s), tz: TZ,
          time: iso(i < next || next < 0 ? s.departure.time : s.arrival.time),
          arr: iso(s.arrival.time), dep: iso(s.departure.time),
          status: next < 0 || i < next ? "past" : i === next ? "next" : "future",
          track: null, scheduled: iso(s.scheduled), here: i === here,
        })) : null,
        updated: updated * 1000,
      }));
    }
    return out;
  },
};
