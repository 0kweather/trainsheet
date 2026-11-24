// Ride ETA: how late is the train I'm sitting on, really?
//
// A rider on a train can share their phone's GPS with the page (on the device
// only; nothing here sends it anywhere). The page projects that fix onto the
// train's route, and this module turns "I am this far along the line at this
// moment" into a lateness estimate, then carries it forward to the rider's
// destination. It is the sibling of delays.js: that one reads the railroad's
// own GPS and only ever claims what a fix proves; this one has a better fix
// (the rider's own, seconds old) and so goes further, making stated
// assumptions about how trains lose and win back time:
//
//   1. Position. The timetable says where the train should be at every
//      moment: standing at a stop between its arrival and departure, and
//      moving evenly along the line between stops. Find the moment it should
//      have been where the rider is; the gap to the fix's time is the delay.
//   2. Held. Standing at a platform after the posted departure, the train is
//      at least that late, and getting later by the second.
//   3. Recovery. A late train wins time back only out of what the timetable
//      has spare: dwell beyond the minimum, and a small share of each run
//      that is padding. It is never projected to get ahead of the timetable,
//      and an early train is held to it: trains don't leave stations early.
//   4. Physics. Nothing arrives sooner than the distance left allows at the
//      fastest this route ever runs.
//   5. Trust. A fresh fix beats the feed outright. As it ages the feed takes
//      over, and past a point the fix says nothing about now.
//   6. Honesty. Every figure comes with a range that widens with the fix's
//      age, its accuracy, and how far ahead the stop is.
//
// No imports, no DOM, no clock: the caller passes `now`. Missing data gives
// null, never an exception.

const MIN = 60000;

const AT_STOP_M = 150;            // within this of a stop's point, the train is "at" it (or within the fix's own accuracy, if worse)
const DEFAULT_ACC_M = 100;        // a fix that doesn't state its accuracy is assumed to be middling
const STANDING_MPS = 1;           // slower than this is standing; GPS speed jitters a little at rest
const MIN_DWELL_MS = 45000;       // doors open, people off and on, doors closed: a stop can't be cut shorter
const RUN_SLACK = 0.08;           // share of a scheduled run that is padding a late train can win back
const THIN_SLACK_MS = 2 * MIN;    // less than this to win back ahead...
const THIN_LATE_MS = 5 * MIN;     // ...while this late: it won't make the time up
const FLOOR_MPS = 38;             // ~137 km/h: any passenger train can be assumed capable of this
const OVER_PACE = 1.25;           // and of this much above the fastest run on its own timetable
const FRESH_MS = 2 * MIN;         // a fix this recent is taken at full weight
const STALE_MS = 12 * MIN;        // by this age it has faded to nothing: the train could be anywhere
const AGREE_MS = 2 * MIN;         // feed and position within this: they agree
const DIFFER_MS = 5 * MIN;        // further apart than this: they tell different stories
const AGE_SPREAD = 0.5;           // unseen time: a train drifts by well under half of it in the normal run of things
const AHEAD_SPREAD = 0.1;         // and by about a tenth of the running time still to come
const FEED_SPREAD_MS = 2 * MIN;   // feeds post to the minute and lag by a minute or two
const MIN_SPREAD_MS = MIN;        // never claim to know a train's time to better than a minute
const NOMINAL_MPS = 20;           // pace assumed when the timetable can't give one (accuracy -> time only)
const CONF_BEST = 0.9;            // a fresh, accurate fix: about as sure as this gets
const CONF_PER_MIN = 0.1;         // lost per minute of timing doubt the fix carries (its age and accuracy)
const CONF_FEED = 0.5;            // the feed alone: no better than what the page already shows
const CONF_AGREE = 0.05;          // two independent sources saying the same thing
const CONF_DIFFER = 0.15;         // a blend of two sources that disagree is a compromise, not a measurement
const CONF_MIN = 0.05, CONF_MAX = 0.95;

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// The timetable as three plain arrays: arrival, departure, metres along.
// A stop with one time uses it for both (it calls, but the dwell isn't
// given); a departure before the arrival is bad data and read as no dwell.
// A stop with neither stays null and is carried along without a time.
function timetable(stops, along) {
  const arr = [], dep = [], pos = [];
  stops.forEach((s, i) => {
    const a = num(s?.schedArr), d = num(s?.schedDep);
    arr[i] = a ?? d;
    dep[i] = a != null && d != null ? Math.max(a, d) : (d ?? a);
    pos[i] = num(along?.[i]);
  });
  return { arr, dep, pos, n: stops.length };
}

// Scheduled pace (m/ms) from stop i to the next, when both are placed and
// timed and the timetable gives the run a real duration.
function segPace(tt, i) {
  const { arr, dep, pos } = tt;
  if (pos[i] == null || pos[i + 1] == null || dep[i] == null || arr[i + 1] == null) return null;
  const run = arr[i + 1] - dep[i], dist = pos[i + 1] - pos[i];
  return run > 0 && dist > 0 ? dist / run : null;
}

// Assumption 4's ceiling (m/ms): the fastest run on this route's own
// timetable with headroom on top, and never less than an ordinary train
// manages. Deliberately generous: it's a floor on arrival times, so it should
// only ever rule out the impossible.
function maxSpeed(tt) {
  let best = 0;
  for (let i = 0; i < tt.n - 1; i++) best = Math.max(best, segPace(tt, i) ?? 0);
  return Math.max(FLOOR_MPS / 1000, best * OVER_PACE);
}

// Assumption 1: where the timetable has the train, turned around. Given the
// rider's distance along the route, returns
//   T      the scheduled moment the train should have been there,
//   next   the first stop it hasn't yet left,
//   at     true if it is at that stop rather than on the way to it,
//   pace   scheduled pace here (m/ms), to turn metres of doubt into time,
//   offM   extra metres of doubt when T is only a nearby stop's time,
// or null when the fix can't be placed against the timetable at all.
function locate(tt, fix, accM, speed) {
  const { arr, dep, pos, n } = tt;
  const x = fix.alongM, at = fix.atMs;
  // Only stops that are both placed and timed can anchor anything.
  const anchors = [];
  for (let i = 0; i < n; i++) if (pos[i] != null && arr[i] != null) anchors.push(i);
  if (!anchors.length) return null;
  const first = anchors[0], last = anchors[anchors.length - 1];
  // For the pace when no single run gives one: the whole route's average.
  const span = arr[last] - dep[first];
  const routePace = span > 0 && pos[last] > pos[first] ? (pos[last] - pos[first]) / span : NOMINAL_MPS / 1000;

  // At a stop. Station points aren't always where trains stand and platforms
  // are long, so near counts as at: without this a train waiting out a long
  // booked dwell a few metres short of the point would read as later with
  // every second, when it is exactly on time. While it's at the stop the
  // timetable has it there from arrival to departure, so any moment in that
  // window is on time, before it is early (against the arrival) and after it
  // is late (against the departure). The one exception is a train just past
  // the point and moving: that one has left.
  // (At the end of the line arrival and departure are the same moment, so a
  // train still sitting there reads later and later. That's right if it's
  // waiting outside for a platform and wrong once everyone's off; the two
  // can't be told apart from one fix, and by then the rider has arrived.)
  let near = -1, nearM = Infinity;
  for (const i of anchors) {
    const d = Math.abs(x - pos[i]);
    if (d < nearM) { near = i; nearM = d; }
  }
  const moving = speed != null && speed >= STANDING_MPS;
  if (nearM <= Math.max(AT_STOP_M, accM) && !(moving && x > pos[near])) {
    const pace = segPace(tt, near) ?? (near > 0 ? segPace(tt, near - 1) : null) ?? routePace;
    return { T: clamp(at, arr[near], dep[near]), next: near, at: true, pace, offM: 0 };
  }

  // Between two placed stops.
  for (let a = 0; a < anchors.length - 1; a++) {
    const p = anchors[a], q = anchors[a + 1];
    if (!(pos[p] <= x && x < pos[q])) continue;
    if (q === p + 1) {
      // Neighbours: the train's scheduled position moves evenly from one's
      // departure to the other's arrival. A run the timetable gives no time
      // to (zero or negative) can't be divided up; the departure stands for
      // all of it.
      const run = Math.max(0, arr[q] - dep[p]);
      const f = (x - pos[p]) / (pos[q] - pos[p]);
      return { T: dep[p] + f * run, next: q, at: false, pace: segPace(tt, p) ?? routePace, offM: 0 };
    }
    // Stops in between that couldn't be placed on the route: the booked
    // dwells in that gap are at unknown points, so rather than guess, compare
    // against the nearer placed stop's own time and nothing else. This is
    // deliberately simple and can be minutes out in the middle of a long gap;
    // the distance to that stop goes into the range (offM) so the answer
    // admits it. The stops in the gap count as behind if that nearer stop is
    // the one ahead, except the rider's destination, which is never written
    // off on a guess (`after` tells the caller where the guessing starts).
    const back = x - pos[p] <= pos[q] - x;
    return back
      ? { T: dep[p], next: p + 1, at: false, pace: routePace, offM: x - pos[p] }
      : { T: arr[q], next: q, at: false, pace: routePace, offM: pos[q] - x, after: p };
  }

  if (x < pos[first]) {
    // Short of the first stop: run the first leg's pace backwards from it.
    const pace = first === 0 ? segPace(tt, 0) : null;
    if (pace) return { T: arr[0] - (pos[0] - x) / pace, next: 0, at: false, pace, offM: 0 };
    // No first leg to take a pace from (or the stops before this one aren't
    // placed): the same simple comparison against the nearest placed stop.
    return { T: arr[first], next: first, at: false, pace: routePace, offM: pos[first] - x, after: -1 };
  }
  if (x >= pos[last]) {
    // Beyond the last placed stop: it has left that one, and that's all the
    // route can say. If that was the destination or later, `next` lands past
    // it and the caller gives up.
    return { T: dep[last], next: last + 1, at: false, pace: routePace, offM: x - pos[last] };
  }
  return null; // distances that don't increase along the route: nothing to trust
}

// With no fix to place the train, the feed's delay places it: a stop is
// still ahead if the feed predicts it in the future, or its timetable time
// plus the delay hasn't come yet.
function nextByFeed(tt, stops, now, delay) {
  for (let i = 0; i < tt.n; i++) {
    const pred = num(stops[i]?.pred);
    if (pred != null && pred > now) return i;
    if (tt.dep[i] != null && tt.dep[i] + delay > now) return i;
  }
  return tt.n;
}

export function estimateRide(input) {
  const now = num(input?.now);
  const stops = input?.stops;
  if (now == null || !Array.isArray(stops) || !stops.length) return null;
  const dest = input.destIndex;
  if (!Number.isInteger(dest) || dest < 0 || dest >= stops.length) return null;
  const tt = timetable(stops, Array.isArray(input.along) ? input.along : []);
  const { arr, dep, pos } = tt;
  const feed = num(input.feedDelayMs);

  // The fix, if there's one to use. One taken "after now" is clock skew, not
  // foresight: it counts as brand new.
  const raw = input.fix;
  const fix = raw && num(raw.alongM) != null && num(raw.atMs) != null ? raw : null;
  const accM = fix ? (num(fix.accM) != null && fix.accM >= 0 ? fix.accM : DEFAULT_ACC_M) : null;
  const speed = fix && num(fix.speedMps) != null && fix.speedMps >= 0 ? fix.speedMps : null;
  const age = fix ? Math.max(0, now - fix.atMs) : null;
  const loc = fix ? locate(tt, fix, accM, speed) : null;
  if (loc) {
    // A destination that couldn't be placed, somewhere in the gap the rider
    // is in: there's no telling it's behind them, so it stays ahead.
    const unplaced = pos[dest] == null || fix.alongM <= pos[dest];
    if (loc.after != null && loc.after < dest && dest < loc.next && unplaced) loc.next = dest;
    // Past the destination. Trains don't back up, so this holds however old
    // the fix is.
    if (loc.next > dest) return null;
  }

  const reasons = new Set();
  let delay, basis, T, next, atStop = false, held = null;
  let posDelay = null, weight = 0, fixSpread = 0;

  if (loc && age < STALE_MS) {
    posDelay = fix.atMs - loc.T;

    // Assumption 2: held. Standing at a platform after the posted departure,
    // it has not left, so it is at least as late as the clock is past that
    // departure, as of now and not just as of the fix. Whichever of this and
    // the position's answer is later is the truth. Not at the end of the
    // line: a train standing there has arrived, not been held.
    const s = loc.next;
    if (loc.at && speed != null && speed < STANDING_MPS && s < tt.n - 1 && now > dep[s]) {
      posDelay = Math.max(posDelay, now - dep[s]);
      held = s;
      reasons.add("held");
    }

    // Assumption 5: how far to trust it. Full weight while fresh, fading
    // evenly to nothing; the feed gets the rest. With no feed there is
    // nothing to share the weight with, so the position stands alone (and
    // its age shows in the range and the confidence instead).
    weight = feed == null ? 1 : clamp((STALE_MS - age) / (STALE_MS - FRESH_MS), 0, 1);
    delay = feed == null ? posDelay : weight * posDelay + (1 - weight) * feed;
    basis = weight === 1 ? "location" : "blended";
    if (feed != null) {
      const gap = Math.abs(feed - posDelay);
      if (gap <= AGREE_MS) reasons.add("feed-agrees");
      else if (gap > DIFFER_MS) reasons.add("feed-differs");
    }
    ({ T, next } = loc);
    atStop = loc.at;
    // Assumption 6, the fix's share: time unseen since it was taken, and its
    // accuracy as time at the pace the train is booked to run here (50 m is
    // two seconds at speed, most of a minute crawling through a junction).
    fixSpread = AGE_SPREAD * age + (accM + loc.offM) / loc.pace;
  } else if (feed != null) {
    // No fix, one that can't be placed, or one too old to say anything about
    // now: the feed's delay alone, projected with the same assumptions.
    delay = feed;
    basis = "feed";
    if (fix && age >= STALE_MS) reasons.add("stale-fix");
    T = now - delay; // where the timetable would have a train this late
    next = nextByFeed(tt, stops, now, delay);
    if (next > dest) return null;
  } else {
    return null;
  }

  // Half-width of the range before any looking ahead. Each source brings its
  // own doubt in proportion to its weight; and when the two disagree, the
  // range reaches at least as far as the one trusted more.
  const feedShare = basis === "feed" ? 1 : 1 - weight;
  const spread = (1 - feedShare) * fixSpread + feedShare * FEED_SPREAD_MS
    + (basis === "blended" ? Math.min(weight, 1 - weight) * Math.abs(feed - posDelay) : 0);

  // Assumptions 3 and 4: carry the delay forward a stop at a time.
  const placed = basis !== "feed"; // is there a position to measure distances from
  const vmax = maxSpeed(tt);
  let d = delay;
  let prevDep = null;
  for (let k = next - 1; k >= 0 && prevDep == null; k--) prevDep = dep[k];
  let firstRun = true, runAhead = 0, slackAhead = 0, recovered = false, earlyHeld = false;
  const out = [];
  for (let k = next; k <= dest; k++) {
    if (arr[k] == null) {
      // No timetable for this stop: it's on the list, with nothing to say.
      out.push({ index: k, etaMs: null, loMs: null, hiMs: null, delayMs: null });
      continue;
    }
    // The run into this stop. Of the one the train is on, only the part
    // still ahead of it counts. A run with no scheduled time has no padding
    // to give.
    if (prevDep != null) {
      let run = arr[k] - prevDep;
      if (run > 0) {
        if (firstRun) run *= clamp((arr[k] - T) / run, 0, 1);
        runAhead += run;
        const slack = RUN_SLACK * run;
        slackAhead += slack;
        // Recovery never exceeds the delay: a late train gets back to time
        // at best, never ahead of it.
        const won = d > 0 ? Math.min(d, slack) : 0;
        if (won > 0) { d -= won; recovered = true; }
      }
    }
    firstRun = false;
    // An early train is held to the timetable: it waits for time at the next
    // platform if not before it, so nothing ahead is promised early.
    if (d < 0) { d = 0; earlyHeld = true; }
    let eta = arr[k] + d;
    // It can't arrive sooner than the distance left allows. For the stop the
    // train is standing at that distance is nothing, and this just says "here
    // now". A stop that couldn't be placed has no distance to check, but one
    // still ahead can't have been reached before now. (With only the feed to
    // go on there is no position, and the feed's own account stands.)
    const floor = placed ? now + (pos[k] != null ? Math.max(0, pos[k] - fix.alongM) / vmax : 0) : null;
    if (floor != null && eta < floor) { eta = floor; d = eta - arr[k]; }
    // The range: the sources' doubt, plus a tenth of the running time still
    // to come, and never tighter than a minute. Its early side stops where
    // the model does: at the timetable and at the physical floor.
    const half = Math.max(MIN_SPREAD_MS, spread + AHEAD_SPREAD * runAhead);
    const lo = Math.min(eta, Math.max(eta - half, arr[k], floor ?? -Infinity));
    out.push({ index: k, etaMs: Math.round(eta), loMs: Math.round(lo), hiMs: Math.round(eta + half), delayMs: Math.round(eta - arr[k]) });

    // Leaving this stop. For the one the train is standing at, the delay is
    // already a departure delay ("here now" above was about arriving, and
    // mustn't push the departure back by the whole dwell).
    if (atStop && k === next) d = Math.max(delay, 0);
    // Dwell above the minimum can be cut to win time back; of a dwell
    // already under way, only what's left of it.
    if (k < dest) {
      const slack = Math.max(0, Math.min(dep[k] - arr[k] - MIN_DWELL_MS, dep[k] - T));
      slackAhead += slack;
      const won = d > 0 ? Math.min(d, slack) : 0;
      if (won > 0) { d -= won; recovered = true; }
    }
    prevDep = dep[k];
  }
  if (recovered) reasons.add("recovery");
  if (delay > THIN_LATE_MS && slackAhead < THIN_SLACK_MS) reasons.add("thin-padding");
  if (earlyHeld) reasons.add("early-held-to-schedule");

  // Confidence: the feed alone is worth what the page already shows; a fix
  // starts near the top and loses a little for every minute of timing doubt
  // it carries. A feed that independently agrees adds a touch; blending in
  // one that disagrees means at least one of them is wrong.
  let confidence = CONF_FEED;
  if (basis !== "feed") {
    confidence = CONF_BEST - (CONF_PER_MIN * fixSpread) / MIN;
    if (basis === "blended") confidence = weight * confidence + (1 - weight) * CONF_FEED;
    if (reasons.has("feed-agrees")) confidence += CONF_AGREE;
    if (basis === "blended" && reasons.has("feed-differs")) confidence -= CONF_DIFFER;
  }

  const half = Math.max(MIN_SPREAD_MS, spread);
  const ORDER = ["held", "recovery", "thin-padding", "stale-fix", "feed-agrees", "feed-differs", "early-held-to-schedule"];
  return {
    delayMs: Math.round(delay),
    rangeMs: [Math.round(delay - half), Math.round(delay + half)],
    confidence: clamp(confidence, CONF_MIN, CONF_MAX),
    basis,
    heldAtStop: held,
    stops: out,
    reasons: ORDER.filter((r) => reasons.has(r)),
  };
}
