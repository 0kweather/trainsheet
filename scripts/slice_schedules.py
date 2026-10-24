"""Cut each railroad's timetable into the hours of its day, for placing the
trains going now (js/sources.js loadRuns), so a view of Europe fetches the
runs on the road rather than two weeks of every one.

    python3 scripts/slice_schedules.py

Reads data/schedules/<railroad>.json, for each railroad placed from its
timetable (a source of format "timetable", or one waiting on a key with
untilKey "timetable", in the registry) or looked up there by a WIDE_MODULES
plug-in, and writes, into data/schedules/now/
(not committed: the deploy workflow runs this before stamping):

  <railroad>/<hour>.json   every train number with a run going in that hour
                           of the railroad's day (its own time zone), or due
                           within NEAR minutes of it, today's or yesterday's
                           past midnight, on any day of the two weeks
  <railroad>/<hour>w.json  in place of those, the same within WIDE minutes,
                           for the plug-ins that keep a late train on its
                           run (WIDE_MODULES)
  index.json               {railroad: {tz, near or wide}}: the zone the
                           hours are counted in, and the slack in seconds
                           (around a run's first departure and last
                           arrival) its files hold every run for

A number in an hour's file has all its runs, as the full file has them, so
runNow() picks the same run from it. Each file is the full one's shape made
smaller: its stops a list ([id, name, lat, lon], in order of first use), and
its trips a list of [number, runs] in the full file's order, each run's stops
flattened to [stop's place in that list, arrival, minutes stopped, ...].
"""
import json, pathlib, re, shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCHEDULES = ROOT / "data" / "schedules"
OUT = SCHEDULES / "now"

# Minutes, each a minute more than the slack it serves (the hour is read from
# the clock to the second, runNow's day to the rounded second).
NEAR = 2 + 1     # timetableTrains() without live data: 120 s
WIDE = 180 + 1   # timetableTrains() with live delays (3 hours), czechia.js (90 minutes)
# Plug-ins whose railroads get the wide set too.
WIDE_MODULES = {"switzerland", "czechia", "bdz"}


def railroads():
    """The railroads to slice, and those of them to slice wide too, from the
    registry's sources. (The few built into js/sources.js that place trains
    from their timetables, Rail Runner's and the like, are small: loadRuns
    reads their full files.)"""
    sliced, wide = set(), set()
    for line in (ROOT / "js" / "railroads" / "index.js").read_text().splitlines():
        m = re.match(r'\s*(\{.*"format": .*\}),?$', line)
        if not m:
            continue
        src = json.loads(m.group(1))
        if src.get("module") in WIDE_MODULES:
            wide.update(src["agencies"])
        if src.get("module") in WIDE_MODULES or src["format"] == "timetable" or src.get("untilKey") == "timetable":
            sliced.update(src["agencies"])
    return sliced, wide


def pack(tt, numbers):
    """The full file's shape, smaller, with only these numbers' runs."""
    ids, place = [], {}
    trips = []
    for n in numbers:
        runs = []
        for mask, line, pat in tt["trips"][n]:
            flat = []
            for sid, arr, dep in pat:
                if sid not in place:
                    place[sid] = len(ids)
                    ids.append(sid)
                flat += [place[sid], arr, dep - arr]
            runs.append([mask, line, flat])
        trips.append([n, runs])
    out = {k: v for k, v in tt.items() if k not in ("trips", "stops", "ahead")}
    out["stops"] = [[sid, *tt["stops"][sid]] for sid in ids]
    out["trips"] = trips
    return json.dumps(out, separators=(",", ":"), ensure_ascii=False)


def going(spans, a, b, slack):
    """Does a run of these (first departure, last arrival) spans count in
    minutes [a, b) of the day, today's or yesterday's (24 hours on)?"""
    return any(lo - slack <= hi_w and hi + slack >= lo_w
               for lo, hi in spans for lo_w, hi_w in ((a, b), (a + 1440, b + 1440)))


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    sliced, wide = railroads()
    index, total = {}, 0
    for path in sorted(SCHEDULES.glob("*.json")):
        tt = json.loads(path.read_text())
        rid = path.stem
        if rid not in sliced or not isinstance(tt.get("trips"), dict) or not tt.get("tz"):
            continue
        spans = {n: [(pat[0][2], pat[-1][1]) for _, _, pat in runs if pat] for n, runs in tt["trips"].items()}
        sets = [("w", WIDE)] if rid in wide else [("", NEAR)]
        (OUT / rid).mkdir()
        for suffix, slack in sets:
            for hour in range(24):
                a = hour * 60
                numbers = [n for n in tt["trips"] if going(spans[n], a, a + 60, slack)]
                text = pack(tt, numbers)
                (OUT / rid / f"{hour}{suffix}.json").write_text(text)
                total += len(text)
        index[rid] = {"tz": tt["tz"], **({"wide": (WIDE - 1) * 60} if rid in wide else {"near": (NEAR - 1) * 60})}
    (OUT / "index.json").write_text(json.dumps(index, separators=(",", ":"), sort_keys=True))
    print(f"{len(index)} timetables sliced, {total / 2**20:.1f} MB")


if __name__ == "__main__":
    main()
