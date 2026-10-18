// Czechia's trains (scripts/railroads/czechia.py): the Oběhy project's
// GTFS-realtime positions for the whole SŽ network, each train given its
// railroad, line and stops by its number in that railroad's timetable
// (data/schedules/<railroad>.json), and its delay by the feed's stop times.

import { train, valid, delayText, loadSchedule, runNow, runStops } from "../sources.js?v=dev";
import { decodeFeed } from "../gtfsrt.js?v=dev";

const RAILROADS = ["czcd", "czregiojet", "czleo", "czarriva", "czgwtrain"];
const STALE = 15 * 60; // seconds without a fix: no longer running
const SLACK = 90 * 60; // around a run's timetable: a late train still finds its run
const OVER = 10 * 60; // after its (late) last arrival, a run is over
const NEAR = 90; // seconds: a feed time this close to a timetable one is that stop's

const iso = (sec) => (sec ? new Date(sec * 1000).toISOString() : null);
const km2 = (a, lat, lon) => (a[1] - lat) ** 2 + ((a[2] - lon) * Math.cos((lat * Math.PI) / 180)) ** 2;

// The feed's stop times name a stop only by its place among all the points
// a train passes, which the timetable doesn't keep; so its delay is the
// offset most of its times share with the run's timetable ones (seconds),
// with each time put to the stop it matches.
function matchTimes(run, events) {
  const at = run.pat.map(([, arr, dep]) => [run.day + arr * 60, run.day + dep * 60]);
  const pairs = [];
  events.forEach((e, k) => at.forEach(([a, d]) => {
    if (e.arr) pairs.push([e.arr - a, k]);
    if (e.dep) pairs.push([e.dep - d, k]);
  }));
  const cands = pairs.filter(([c]) => c > -600 && c < 6 * 3600).sort((x, y) => x[0] - y[0]);
  // The window of 2 * NEAR seconds holding the most different times.
  let best = null;
  for (let i = 0, j = 0; i < cands.length; i++) {
    while (cands[j][0] < cands[i][0] - 2 * NEAR) j++;
    const n = new Set(cands.slice(j, i + 1).map(([, k]) => k)).size;
    const mid = (cands[j][0] + cands[i][0]) / 2;
    if (!best || n > best.n || (n === best.n && Math.abs(mid) < Math.abs(best.offset))) best = { n, offset: mid };
  }
  if (!best) return null;
  const live = {}, delays = [];
  for (const e of events) {
    const t = e.arr || e.dep;
    let hit = null;
    at.forEach(([a, d], j) => {
      const c = e.arr ? e.arr - a : e.dep - d;
      if (Math.abs(c - best.offset) <= 2 * NEAR && (!hit || Math.abs(c - best.offset) < Math.abs(hit.c - best.offset))) hit = { j, c };
    });
    if (!hit) continue;
    if (e.arr) live[run.pat[hit.j][0]] = e.arr;
    delays.push([t, hit.c]);
  }
  return { offset: best.offset, live, delays: delays.sort((x, y) => x[0] - y[0]) };
}

// A run's stops as the train panel lists them: at the first stop, and the
// one it's standing at, the departure; elsewhere the arrival.
function stopsOf(agency, tt, run, stops, now) {
  const next = stops.findIndex((s) => Math.max(s.arrival.time, s.departure.time) >= now - 30);
  return stops.map((s, i) => {
    const here = i === next && s.arrival.time <= now, leaves = i === 0 || here;
    const schArr = run.day + run.pat[i][1] * 60, schDep = run.day + run.pat[i][2] * 60;
    return {
      key: `${agency}:${s.stopId}`,
      name: tt.stops[s.stopId][0],
      tz: tt.tz,
      time: iso(leaves ? s.departure.time : s.arrival.time),
      arr: iso(s.arrival.time), dep: iso(s.departure.time),
      scheduled: iso(leaves ? schDep : schArr), schArr: iso(schArr), schDep: iso(schDep),
      status: next < 0 || i < next ? "past" : i === next ? "next" : "future",
      here,
    };
  });
}

export const parse = {
  czechia: async (buf) => {
    const feed = decodeFeed(buf);
    const now = Math.round(Date.now() / 1000);
    const tts = await Promise.all(RAILROADS.map((a) => loadSchedule(a).catch(() => null)));
    // Each train's stop times, by its vehicle (a run is one trip per operator, or per bus section).
    const times = new Map();
    for (const u of feed.tripUpdates) {
      const id = u.vehicle?.id || u.entityVehicle?.vehicle?.id;
      if (!id) continue;
      if (!times.has(id)) times.set(id, []);
      for (const s of u.stops) {
        if (s.skipped || !(s.arrival?.time || s.departure?.time)) continue;
        times.get(id).push({ arr: s.arrival?.time || null, dep: s.departure?.time || null });
      }
    }
    const out = [], seen = new Set();
    for (const v of feed.vehicles) {
      const p = v.position, number = v.vehicle?.label?.trim();
      if (!p || !valid(p.lat, p.lon) || !/^\d+$/.test(number || "")) continue;
      if (v.timestamp && now - v.timestamp > STALE) continue;
      // The railroad running this number now, nearest the train where two do;
      // none (empty stock, other operators, a bus): not shown.
      let pick = null;
      RAILROADS.forEach((agency, i) => {
        const tt = tts[i], run = tt && runNow(tt, number, now, SLACK);
        if (!run) return;
        const d = Math.min(...run.pat.map(([sid]) => km2(tt.stops[sid], p.lat, p.lon)));
        if (!pick || d < pick.d) pick = { agency, tt, run, d };
      });
      if (!pick || seen.has(`${pick.agency}:${number}`)) continue;
      const { agency, tt, run } = pick;
      seen.add(`${agency}:${number}`);
      const m = matchTimes(run, times.get(v.vehicle.id) || []);
      // Late by the last stop it has passed, else the first it will reach.
      const passed = m?.delays.filter(([t]) => t <= now) || [];
      const delay = m ? (passed.length ? passed[passed.length - 1][1] : m.delays[0]?.[1] ?? m.offset) : null;
      const raw = runStops(run, Math.max(0, delay || 0), m?.live || {});
      const stops = stopsOf(agency, tt, run, raw, now);
      // Still reporting well after its last stop: the run is over (a bus may carry on).
      const last = raw[raw.length - 1];
      if (stops.every((s) => s.status === "past") && last.arrival.time < now - OVER) continue;
      const next = stops.find((s) => s.status === "next");
      const delayMin = delay != null ? Math.round(delay / 60) : null;
      out.push(train({
        id: `${agency}:${number}`, agency, number, route: run.line,
        lat: p.lat, lon: p.lon, bearing: p.bearing || null,
        origin: stops[0].name, destination: stops[stops.length - 1].name,
        nextStop: next?.name || null,
        delayMin, statusText: next?.here ? `At ${next.name}` : delayMin != null ? delayText(delayMin) : null,
        stops,
        updated: (v.timestamp || now) * 1000,
        fixAt: v.timestamp ? v.timestamp * 1000 : null,
      }));
    }
    return out;
  },
};
