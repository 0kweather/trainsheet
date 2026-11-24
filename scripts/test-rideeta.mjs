// Self-test for js/rideeta.js. Plain node, no dependencies:
//   node scripts/test-rideeta.mjs
// Prints PASS/FAIL per scenario and exits non-zero if any fail.

import { estimateRide } from "../js/rideeta.js";

const MIN = 60000;
const T0 = Date.UTC(2026, 10, 24, 14, 0, 0); // timetable minute 0
const t = (min) => T0 + min * MIN;

// A five-stop line. A-B, B-C and C-D are 30 km in 20 min (25 m/s) with 2 min
// dwells; D-E is 120 km in 100 min, a long padded run.
//   km:    0      30       60       90       210
//   arr:   -      20       42       64       166
//   dep:   0      22       44       66       -
const STOPS = [
  { key: "A", name: "Alder", schedArr: null, schedDep: t(0), pred: null },
  { key: "B", name: "Birch", schedArr: t(20), schedDep: t(22), pred: null },
  { key: "C", name: "Cedar", schedArr: t(42), schedDep: t(44), pred: null },
  { key: "D", name: "Dogwood", schedArr: t(64), schedDep: t(66), pred: null },
  { key: "E", name: "Elm", schedArr: t(166), schedDep: null, pred: null },
];
const ALONG = [0, 30000, 60000, 90000, 210000];
const SCHED = [t(0), t(20), t(42), t(64), t(166)]; // each stop's scheduled (arrival) time

// A fix at `km`, taken `ageMin` before `nowMin`.
const fixAt = (km, nowMin, { ageMin = 0, accM = 20, speedMps = 25 } = {}) =>
  ({ alongM: km * 1000, atMs: t(nowMin - ageMin), accM, speedMps });
const ride = (over) => estimateRide({ now: t(0), stops: STOPS, along: ALONG, destIndex: 4, fix: null, feedDelayMs: null, ...over });

let failed = 0;
function scenario(name, fn) {
  const problems = [];
  const check = (ok, what) => { if (!ok) problems.push(what); };
  try {
    fn(check);
  } catch (e) {
    problems.push(`threw: ${e?.stack || e}`);
  }
  if (problems.length) failed++;
  console.log(`${problems.length ? "FAIL" : "PASS"}  ${name}`);
  problems.forEach((p) => console.log(`        - ${p}`));
}
const mins = (ms) => (ms == null ? "null" : `${(ms / MIN).toFixed(2)} min`);
const destOf = (r) => r.stops[r.stops.length - 1];

// Every result, whatever the scenario, has to hold together.
function sane(check, r, destIndex = 4) {
  check(r && typeof r === "object", "result is an object");
  if (!r) return;
  check(Number.isFinite(r.delayMs), "delayMs is a number");
  check(Array.isArray(r.rangeMs) && r.rangeMs[0] <= r.delayMs && r.delayMs <= r.rangeMs[1], `range brackets delay (${r.rangeMs})`);
  check(r.rangeMs[1] - r.rangeMs[0] >= 2 * MIN, "range is at least a minute either side");
  check(r.confidence >= 0.05 && r.confidence <= 0.95, `confidence in [0.05, 0.95] (${r.confidence})`);
  check(["location", "blended", "feed"].includes(r.basis), `basis is a known value (${r.basis})`);
  check(r.basis !== "feed" || r.confidence <= 0.5, "feed alone caps confidence at 0.5");
  check(r.stops.length > 0 && destOf(r).index === destIndex, "stops run through the destination");
  r.stops.forEach((s, i) => {
    check(i === 0 || s.index === r.stops[i - 1].index + 1, "stops are consecutive");
    if (s.etaMs == null) return;
    check(s.loMs <= s.etaMs && s.etaMs <= s.hiMs, `stop ${s.index}: lo <= eta <= hi`);
  });
  const known = ["held", "recovery", "thin-padding", "stale-fix", "feed-agrees", "feed-differs", "early-held-to-schedule"];
  check(r.reasons.every((c) => known.includes(c)), `reasons are known codes (${r.reasons})`);
}

// ---- The six required scenarios ----

scenario("(a) mid-segment, exactly on schedule: delay ~0, basis location", (check) => {
  // 15 km is halfway along A-B: due there at minute 10.
  const r = ride({ now: t(10), fix: fixAt(15, 10) });
  sane(check, r);
  check(Math.abs(r.delayMs) <= MIN, `delay within a minute of zero (${mins(r.delayMs)})`);
  check(r.basis === "location", `basis location (${r.basis})`);
  check(r.heldAtStop === null, "not held");
  check(r.stops[0].index === 1, `next stop is B (${r.stops[0].index})`);
  check(r.stops.length === 4, "B through E listed");
  check(Math.abs(destOf(r).etaMs - t(166)) <= MIN, `destination on time (${mins(destOf(r).delayMs)})`);
});

scenario("(b) stopped at a station 6 min after departure: held, limited recovery", (check) => {
  // At B (30 km), standing, at minute 28: B was due out at 22. Destination D.
  // Ahead: B-C padding 1.6 min, C dwell slack 1.25 min, C-D padding 1.6 min.
  const r = ride({ now: t(28), destIndex: 3, fix: fixAt(30, 28, { speedMps: 0 }) });
  sane(check, r, 3);
  check(r.heldAtStop === 1, `heldAtStop is B (${r.heldAtStop})`);
  check(r.reasons.includes("held"), "reason held");
  check(r.delayMs >= 6 * MIN, `delay at least 6 min (${mins(r.delayMs)})`);
  const d = destOf(r).delayMs;
  check(d < 6 * MIN && d > 0, `destination delay between 0 and 6 min (${mins(d)})`);
  check(Math.abs(d - 1.55 * MIN) < 1000, `destination delay is 6 - 4.45 = 1.55 min (${mins(d)})`);
  check(r.reasons.includes("recovery"), "reason recovery");
  check(r.stops[0].index === 1, "the station it's held at is still listed");
});

scenario("(c) 10 min late with a long padded run ahead: recovers some, not all", (check) => {
  // 114 km is a fifth of the way along D-E: due there at minute 86, there at 96.
  const r = ride({ now: t(96), fix: fixAt(114, 96, { speedMps: 20 }) });
  sane(check, r);
  check(Math.abs(r.delayMs - 10 * MIN) <= 1000, `10 min late now (${mins(r.delayMs)})`);
  const d = destOf(r).delayMs;
  check(d < 10 * MIN && d > 0, `destination delay under 10 min, over 0 (${mins(d)})`);
  check(Math.abs(d - 3.6 * MIN) < 1000, `destination delay is 10 - 8% of the 80 min left = 3.6 min (${mins(d)})`);
  check(r.reasons.includes("recovery"), "reason recovery");
  check(!r.reasons.includes("thin-padding"), "padding is not thin");
});

scenario("(d) 5 min early: nothing projected ahead of the timetable", (check) => {
  // 45 km is halfway along B-C: due there at minute 32, there at 27.
  const r = ride({ now: t(27), fix: fixAt(45, 27) });
  sane(check, r);
  check(Math.abs(r.delayMs + 5 * MIN) <= 1000, `5 min early now (${mins(r.delayMs)})`);
  check(r.stops.length === 3, "C through E listed");
  for (const s of r.stops) {
    check(s.etaMs >= SCHED[s.index], `stop ${s.index} not before its scheduled time (${mins(s.delayMs)})`);
    check(s.loMs >= SCHED[s.index], `stop ${s.index}: even the early end of the range isn't before it`);
  }
  check(r.reasons.includes("early-held-to-schedule"), "reason early-held-to-schedule");
  check(!r.reasons.includes("recovery"), "nothing to recover");
});

scenario("(e) fix 20 min old + feed 7 min late: feed alone", (check) => {
  const r = ride({ now: t(40), fix: fixAt(15, 40, { ageMin: 20 }), feedDelayMs: 7 * MIN });
  sane(check, r);
  check(r.basis === "feed", `basis feed (${r.basis})`);
  check(Math.abs(r.delayMs - 7 * MIN) <= 1000, `delay is the feed's 7 min (${mins(r.delayMs)})`);
  check(r.reasons.includes("stale-fix"), "reason stale-fix");
  check(r.heldAtStop === null, "not held");
  // 7 min late at minute 40 puts the timetable at minute 33: between B and C.
  check(r.stops[0].index === 2, `next stop is C (${r.stops[0].index})`);
});

scenario("(f) no fix and no feed delay: null", (check) => {
  check(ride({ now: t(40) }) === null, "null with neither");
  check(ride({ now: t(40), fix: fixAt(15, 40, { ageMin: 20 }) }) === null, "null with only a stale fix");
  check(ride({ now: t(40), fix: { alongM: null, atMs: t(40), accM: 10, speedMps: null } }) === null, "null with only an unusable fix");
});

// ---- Further checks on the assumptions ----

scenario("blending: the feed's share grows as the fix ages", (check) => {
  // Position says 10 late (114 km, due 86, fix at 96), the feed says 2.
  const at = (ageMin) => ride({ now: t(96 + ageMin), fix: fixAt(114, 96 + ageMin, { ageMin }), feedDelayMs: 2 * MIN });
  const fresh = at(1), mid = at(7), old = at(13);
  [fresh, mid, old].forEach((r) => sane(check, r));
  check(fresh.basis === "location" && Math.abs(fresh.delayMs - 10 * MIN) <= 1000, `fresh: location, 10 min (${fresh.basis}, ${mins(fresh.delayMs)})`);
  check(mid.basis === "blended" && Math.abs(mid.delayMs - 6 * MIN) <= 1000, `7 min old: blended half and half, 6 min (${mid.basis}, ${mins(mid.delayMs)})`);
  check(old.basis === "feed" && Math.abs(old.delayMs - 2 * MIN) <= 1000, `13 min old: feed, 2 min (${old.basis}, ${mins(old.delayMs)})`);
  check(fresh.reasons.includes("feed-differs") && mid.reasons.includes("feed-differs"), "reason feed-differs while both count");
  check(old.reasons.includes("stale-fix") && !old.reasons.includes("feed-differs"), "stale: stale-fix only");
  check(fresh.confidence > mid.confidence, `confidence falls with age (${fresh.confidence} > ${mid.confidence})`);
  check(mid.rangeMs[0] <= 2 * MIN || mid.rangeMs[1] >= 10 * MIN, "a half-and-half blend's range reaches a source");
  const agree = ride({ now: t(96), fix: fixAt(114, 96), feedDelayMs: 9 * MIN });
  check(agree.reasons.includes("feed-agrees") && !agree.reasons.includes("feed-differs"), "within 2 min: feed-agrees");
  check(agree.confidence > ride({ now: t(96), fix: fixAt(114, 96) }).confidence, "an agreeing feed raises confidence");
  const between = ride({ now: t(96), fix: fixAt(114, 96), feedDelayMs: 6.5 * MIN });
  check(!between.reasons.includes("feed-agrees") && !between.reasons.includes("feed-differs"), "3.5 min apart: neither");
});

scenario("no feed: an ageing fix still stands alone as location", (check) => {
  const r = ride({ now: t(101), fix: fixAt(114, 101, { ageMin: 5 }) });
  sane(check, r);
  check(r.basis === "location" && Math.abs(r.delayMs - 10 * MIN) <= 1000, `location, 10 min (${r.basis}, ${mins(r.delayMs)})`);
  const fresh = ride({ now: t(96), fix: fixAt(114, 96) });
  check(r.confidence < fresh.confidence, "less sure than a fresh one");
  check(r.rangeMs[1] - r.rangeMs[0] > fresh.rangeMs[1] - fresh.rangeMs[0], "and with a wider range");
});

scenario("uncertainty: wider further ahead, wider and less sure with a poor fix", (check) => {
  const good = ride({ now: t(10), fix: fixAt(15, 10) });
  const poor = ride({ now: t(10), fix: fixAt(15, 10, { accM: 2500 }) });
  sane(check, good); sane(check, poor);
  const width = (s) => s.hiMs - s.etaMs;
  check(Math.abs(good.confidence - 0.9) < 0.01, `fresh, accurate fix: ~0.9 (${good.confidence})`);
  check(width(destOf(good)) > width(good.stops[0]), "the destination's range is wider than the next stop's");
  check(Math.abs(width(good.stops[0]) - MIN) < 5000, `next stop 10 min out: the one-minute minimum (${mins(width(good.stops[0]))})`);
  check(poor.confidence < good.confidence, `poor accuracy costs confidence (${poor.confidence})`);
  check(poor.rangeMs[1] - poor.rangeMs[0] > good.rangeMs[1] - good.rangeMs[0], "and widens the range");
});

scenario("held: needs a known low speed, and a departure that has passed", (check) => {
  const unknown = ride({ now: t(28), fix: fixAt(30, 28, { speedMps: null }) });
  check(unknown.heldAtStop === null && !unknown.reasons.includes("held"), "speed unknown: not held");
  check(Math.abs(unknown.delayMs - 6 * MIN) <= 1000, `but the position still says 6 late (${mins(unknown.delayMs)})`);
  const dwell = ride({ now: t(21), fix: fixAt(30, 21, { speedMps: 0 }) });
  check(dwell.heldAtStop === null && dwell.delayMs === 0, `standing during the booked dwell: on time (${mins(dwell.delayMs)})`);
  const offPoint = ride({ now: t(21), fix: fixAt(29.9, 21, { speedMps: 0 }) });
  check(offPoint.delayMs === 0, `100 m short of the stop point during the dwell: still on time (${mins(offPoint.delayMs)})`);
  // A slightly old fix: held is measured to now, not to the fix.
  const lag = ride({ now: t(28), fix: fixAt(30, 28, { ageMin: 1.5, speedMps: 0.2 }) });
  check(lag.heldAtStop === 1 && Math.abs(lag.delayMs - 6 * MIN) <= 1000, `held runs to now (${mins(lag.delayMs)})`);
  const end = ride({ now: t(170), fix: fixAt(210, 170, { speedMps: 0 }) });
  check(end && end.heldAtStop === null, "standing at the end of the line is arrived, not held");
});

scenario("recovery: thin padding is called out; a late train is never made early", (check) => {
  // 8 min late halfway along C-D with D the destination: 0.8 min of padding left.
  const thin = ride({ now: t(62), destIndex: 3, fix: fixAt(75, 62) });
  sane(check, thin, 3);
  check(thin.reasons.includes("thin-padding"), "reason thin-padding");
  check(Math.abs(destOf(thin).delayMs - 7.2 * MIN) < 1000, `8 - 0.8 = 7.2 min at D (${mins(destOf(thin).delayMs)})`);
  // 2 min late at the same spot, going to E: 8.8 min of padding ahead, but only 2 to win back.
  const small = ride({ now: t(56), fix: fixAt(75, 56) });
  sane(check, small);
  check(small.reasons.includes("recovery"), "reason recovery");
  small.stops.forEach((s) => check(s.delayMs >= 0 && s.etaMs >= SCHED[s.index], `stop ${s.index} not early (${mins(s.delayMs)})`));
  check(destOf(small).delayMs === 0, "back on time by E, no further");
  check(!small.reasons.includes("early-held-to-schedule"), "which is recovery, not being held to schedule");
});

scenario("physical floor: no arrival sooner than the distance allows", (check) => {
  // Only 10 km out of D at the minute it's due into E, 110 km on. The feed
  // insists it's on time and the fix is old enough to be half-believed, so
  // the blend alone would have it in E 35 min late; 110 km at 38 m/s takes 48.
  const r = ride({ now: t(166), fix: fixAt(100, 166, { ageMin: 7 }), feedDelayMs: 0 });
  sane(check, r);
  const floor = t(166) + (110000 / 38) * 1000;
  check(r.basis === "blended", `blended (${r.basis})`);
  check(Math.abs(destOf(r).etaMs - floor) < 1000, `E at now + 110 km at 38 m/s, no sooner (${mins(destOf(r).etaMs - t(166))} from now)`);
  check(destOf(r).loMs >= floor - 1000, "nor is the early end of its range");
  // A train standing at a stop is there now, not at some earlier moment.
  const here = ride({ now: t(28), fix: fixAt(30, 28, { speedMps: 0 }) });
  check(here.stops[0].index === 1 && here.stops[0].etaMs >= t(28), "the stop it's standing at isn't given a time in the past");
});

scenario("past the destination, or nothing to go on: null", (check) => {
  check(ride({ now: t(50), destIndex: 1, fix: fixAt(45, 50) }) === null, "between B and C, going to B");
  check(ride({ now: t(50), destIndex: 1, fix: fixAt(45, 50), feedDelayMs: MIN }) === null, "the same with a feed delay");
  check(ride({ now: t(80), destIndex: 1, fix: fixAt(45, 80, { ageMin: 30 }), feedDelayMs: MIN }) === null, "the same with a stale fix");
  check(ride({ now: t(200), feedDelayMs: MIN }) === null, "feed only, every stop behind");
  check(ride({ destIndex: 5, now: t(10), fix: fixAt(15, 10) }) === null, "destIndex off the end");
  check(ride({ destIndex: -1, now: t(10), fix: fixAt(15, 10) }) === null, "destIndex negative");
  check(ride({ destIndex: 1.5, now: t(10), fix: fixAt(15, 10) }) === null, "destIndex not an integer");
  check(ride({ now: NaN, fix: fixAt(15, 10) }) === null, "no clock");
  check(ride({ stops: [], along: [], destIndex: 0, now: t(10), fix: fixAt(15, 10) }) === null, "no stops");
  check(estimateRide(null) === null && estimateRide(undefined) === null && estimateRide({}) === null, "no input");
});

scenario("fix exactly at a stop; arriving at the destination", (check) => {
  const early = ride({ now: t(18), fix: fixAt(30, 18, { speedMps: 0 }) });
  sane(check, early);
  check(early.delayMs === -2 * MIN && early.stops[0].index === 1, `at B 2 min before its arrival: 2 early (${mins(early.delayMs)})`);
  check(early.stops.every((s) => s.etaMs >= SCHED[s.index]), "and nothing ahead of the timetable");
  const late = ride({ now: t(25), fix: fixAt(30, 25, { speedMps: null }) });
  check(late.delayMs === 3 * MIN, `at B 3 min after its departure: 3 late (${mins(late.delayMs)})`);
  const arrived = ride({ now: t(47), destIndex: 2, fix: fixAt(60, 47, { speedMps: 0 }) });
  sane(check, arrived, 2);
  check(arrived.stops.length === 1 && arrived.stops[0].index === 2, "at the destination: one stop listed");
  const leaving = ride({ now: t(47), destIndex: 2, fix: fixAt(60.1, 47, { speedMps: 8 }) });
  check(leaving === null, "pulling out of the destination: past it");
});

scenario("destIndex 0 and a single stop", (check) => {
  const before = ride({ now: t(-3), destIndex: 0, fix: fixAt(-2, -3, { speedMps: 10 }) });
  sane(check, before, 0);
  check(before.stops.length === 1 && before.stops[0].index === 0, "before the first stop: it is the next one");
  // 2 km short at the first leg's 25 m/s is 80 s: due there at -1:20, there at -3:00.
  check(Math.abs(before.delayMs + 100000) < 1000, `first leg's pace run backwards (${mins(before.delayMs)})`);
  const one = { stops: [STOPS[1]], along: [30000], destIndex: 0, feedDelayMs: null };
  const at = estimateRide({ ...one, now: t(25), fix: fixAt(30, 25, { speedMps: 0 }) });
  sane(check, at, 0);
  check(at.stops.length === 1 && at.heldAtStop === null, "a single stop, standing at it: listed, not held (it is the end of the line)");
  const short = estimateRide({ ...one, now: t(15), fix: fixAt(20, 15) });
  sane(check, short, 0);
  check(short.stops.length === 1, "a single stop, short of it: listed");
  check(estimateRide({ ...one, now: t(30), fix: fixAt(40, 30) }) === null, "a single stop, beyond it: null");
  check(estimateRide({ ...one, now: t(15), fix: null, feedDelayMs: 2 * MIN }).basis === "feed", "a single stop, feed only");
});

scenario("stops that couldn't be placed: compare against the nearest that could", (check) => {
  // B and C have no distance. The rider is at 20 km: A (0 km) is nearer than D (90 km).
  const along = [0, null, null, 90000, 210000];
  const r = ride({ along, now: t(18), fix: fixAt(20, 18) });
  sane(check, r);
  check(r.delayMs === 18 * MIN, `time since A's departure, nothing else (${mins(r.delayMs)})`);
  check(r.stops[0].index === 1, "everything after A is still ahead");
  check(r.rangeMs[1] - r.rangeMs[0] > 10 * MIN, `and the range admits how rough that is (${mins(r.rangeMs[1] - r.rangeMs[0])} wide)`);
  // At 70 km, D is nearer: compared against D's arrival (minute 64).
  const near = ride({ along, now: t(60), fix: fixAt(70, 60) });
  sane(check, near);
  check(near.delayMs === -4 * MIN && near.stops[0].index === 3, `against D's arrival; D is next (${mins(near.delayMs)}, ${near.stops[0].index})`);
  // Going to C, which is one of the unplaced stops: not written off.
  const toC = ride({ along, destIndex: 2, now: t(60), fix: fixAt(70, 60) });
  check(toC !== null && destOf(toC).index === 2, "an unplaced destination in the gap is kept ahead");
  check(toC !== null && destOf(toC).etaMs >= t(60), "and not given a time in the past");
  // Nothing placed at all: only the feed can speak.
  const none = [null, null, null, null, null];
  check(ride({ along: none, now: t(18), fix: fixAt(20, 18) }) === null, "no placed stops, no feed: null");
  check(ride({ along: none, now: t(18), fix: fixAt(20, 18), feedDelayMs: MIN }).basis === "feed", "no placed stops, feed: feed");
  check(ride({ along: undefined, now: t(18), fix: fixAt(20, 18), feedDelayMs: MIN }).basis === "feed", "no along array at all");
});

scenario("stops with no times; runs with no scheduled time", (check) => {
  const blank = STOPS.map((s, i) => (i === 2 ? { key: "C", name: "Cedar", schedArr: null, schedDep: null, pred: null } : s));
  const r = estimateRide({ now: t(30), stops: blank, along: ALONG, destIndex: 4, fix: fixAt(15, 30), feedDelayMs: null });
  sane(check, r);
  check(r.stops.length === 4 && r.stops[1].index === 2 && r.stops[1].etaMs === null, "the untimed stop is listed without a time");
  check(Number.isFinite(destOf(r).etaMs) && destOf(r).delayMs < 20 * MIN, `and the projection carries on past it (${mins(destOf(r).delayMs)})`);
  const allBlank = STOPS.map((s) => ({ key: s.key, name: s.name, schedArr: null, schedDep: null, pred: null }));
  check(estimateRide({ now: t(30), stops: allBlank, along: ALONG, destIndex: 4, fix: fixAt(15, 30), feedDelayMs: null }) === null, "no times anywhere, no feed: null");
  check(estimateRide({ now: t(30), stops: allBlank, along: ALONG, destIndex: 4, fix: fixAt(15, 30), feedDelayMs: MIN }) === null, "no times anywhere, feed: still nothing to project");
  check(estimateRide({ now: t(30), stops: [null, undefined, {}, 7, "x"], along: ALONG, destIndex: 4, fix: fixAt(15, 30), feedDelayMs: MIN }) === null, "junk stops");
  // C due in before B is due out: a negative run, and one of zero.
  for (const arrC of [t(21), t(22)]) {
    const odd = STOPS.map((s, i) => (i === 2 ? { ...s, schedArr: arrC } : s));
    const o = estimateRide({ now: t(30), stops: odd, along: ALONG, destIndex: 4, fix: fixAt(45, 30), feedDelayMs: null });
    sane(check, o);
    check(o.delayMs === 8 * MIN, `no time to divide up: measured from B's departure (${mins(o.delayMs)})`);
    check(o.stops.every((s) => s.etaMs == null || Number.isFinite(s.etaMs)), "finite times throughout");
  }
});

scenario("feed only: projected with the same assumptions", (check) => {
  // 6 min late by the feed at minute 28: the timetable is at minute 22, leaving B.
  const r = ride({ now: t(28), destIndex: 3, feedDelayMs: 6 * MIN });
  sane(check, r, 3);
  check(r.basis === "feed" && r.confidence === 0.5 && r.heldAtStop === null, `feed, 0.5, not held (${r.basis}, ${r.confidence})`);
  check(r.reasons.includes("recovery") && !r.reasons.includes("stale-fix"), "recovers; no fix to be stale");
  check(Math.abs(destOf(r).delayMs - 1.55 * MIN) < 1000, `the same 1.55 min at D as the rider held at B (${mins(destOf(r).delayMs)})`);
  // A prediction in the future keeps a stop ahead even when the delay alone would pass it.
  const preds = STOPS.map((s, i) => (i === 1 ? { ...s, pred: t(40) } : s));
  const p = estimateRide({ now: t(30), stops: preds, along: ALONG, destIndex: 4, fix: null, feedDelayMs: 0 });
  check(p.stops[0].index === 1, `a stop the feed still predicts ahead is listed (${p.stops[0].index})`);
  const early = ride({ now: t(27), feedDelayMs: -5 * MIN });
  check(early.stops.every((s) => s.etaMs >= SCHED[s.index]) && early.reasons.includes("early-held-to-schedule"), "an early feed is held to schedule too");
});

scenario("odd fixes don't throw", (check) => {
  const odd = [
    { alongM: 15000, atMs: t(10) },
    { alongM: 15000, atMs: t(10), accM: -5, speedMps: -1 },
    { alongM: 15000, atMs: t(10), accM: NaN, speedMps: NaN },
    { alongM: 15000, atMs: t(15), accM: 20, speedMps: 25 }, // five minutes in the future
    { alongM: -1e9, atMs: t(10), accM: 20, speedMps: 25 },
    { alongM: 15000, atMs: t(10), accM: 1e7, speedMps: 0 },
    { alongM: "15000", atMs: t(10) },
    { alongM: Infinity, atMs: t(10) },
    "fix", 7, [],
  ];
  for (const fix of odd) {
    for (const feedDelayMs of [null, 3 * MIN, NaN]) {
      const r = ride({ now: t(10), fix, feedDelayMs });
      if (r !== null) sane(check, r);
    }
  }
  const backwards = ride({ along: [0, 60000, 30000, 90000, 210000], now: t(50), fix: fixAt(75, 50) });
  if (backwards !== null) sane(check, backwards);
  const input = { now: t(96), stops: STOPS, along: ALONG, destIndex: 4, fix: fixAt(114, 96), feedDelayMs: 2 * MIN };
  const before = JSON.stringify(input);
  estimateRide(input);
  check(JSON.stringify(input) === before, "the input is left as it was");
});

console.log(failed ? `\n${failed} scenario(s) FAILED` : "\nAll scenarios passed");
process.exit(failed ? 1 : 0);
