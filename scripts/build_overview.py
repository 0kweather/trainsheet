"""The summary the map's zoomed-out overview draws from (js/overview.js): a
pin per country, so a view of the world, a continent or a country shows
each country's railroads without loading any of their track, stations or
timetables, and a country page (app.js) can show its trains through the day.

    python3 scripts/build_overview.py

Reads the railroads (js/sources.js's built-in ones and the registry's,
js/railroads/index.js), their stations (data/stations.json for the US and
Canada's, data/regions/<region>/stations.json for the others') and their
timetables (data/schedules/<railroad>.json), and writes data/overview.json
(not committed: the deploy workflow runs this, as it slices the
timetables):

  countries {country: {pin: [lon, lat], bbox: [west, south, east, north],
            rr: [railroad, ...]}}: where its pin points (the middle of the
            cells its stations hold), the box a pick frames (the clusters
            of cells it holds with a real share of its stations: not
            Alaska's), and its railroads with a
            timetable, busiest first
  rr        {railroad: {tz, w: [[trains, ...] x 24] x 7}}: the trains running
            in each hour of each weekday (Monday first) where the railroad
            is, from the second of its timetable's two weeks
  order     [country, ...]: the countries the grid's letters stand for
  grid      [west, south, step, columns, rows, cells]: the country under
            each step-degree cell, filled from the stations out to about a
            degree, so the map knows which country it's centered on; cells
            run west to east, south to north, as runs of "<count><letter>"
            ("." none)
"""
import datetime, json, math, pathlib, re, statistics

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "overview.json"
WORLD = (-180, -60, 180, 75)  # [west, south, east, north]: the grid's extent
STEP = 0.25                   # degrees, the grid's cells
FILL = 4                      # cells a station's country spreads to where no station is
GAP = 6                       # cells apart a country's cells still count as one cluster (its pick's frame)
MASS = 0.03                   # the share of its stations a cluster needs to be framed
LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"


def railroads():
    """{railroad: country} for every railroad, built in and plugged in."""
    out = dict(re.findall(r'^\s{2}(\w+):\s*\{[^\n]*?country: "(\w+)"', (ROOT / "js" / "sources.js").read_text(), re.M))
    text = (ROOT / "js" / "railroads" / "index.js").read_text()
    body = text.split("export const AGENCIES = {")[1].split("\n};")[0]
    for m in re.finditer(r"^\s*(\w+): (\{.*\}),?$", body, re.M):
        a = json.loads(m.group(2))
        if a.get("country"):
            out[m.group(1)] = a["country"]
    regions = json.loads(re.sub(r",\s*\]$", "]", re.search(r"export const DATA_REGIONS = (\[.*?\n\]);", text, re.S).group(1)))
    return out, [r["region"] for r in regions]


def hourly(tt):
    """[[trains, ...] x 24] x 7, Monday first: the runs going at any time in
    each hour of each weekday of the timetable's second week, counting
    yesterday's still running past midnight."""
    start = datetime.date.fromisoformat(tt["start"])
    spans = [[] for _ in range(14)]  # bit -> [(first departure, last arrival)]
    for runs in tt["trips"].values():
        for mask, _, pat in runs:
            if not pat:
                continue
            lo = pat[0][2] if pat[0][2] is not None else pat[0][1]
            hi = pat[-1][1] if pat[-1][1] is not None else pat[-1][2]
            if lo is None or hi is None:
                continue
            for bit in range(14):
                if (mask >> bit) & 1:
                    spans[bit].append((lo, hi))
    week = [None] * 7
    for bit in range(7, 14):
        day = [0] * 24
        for h in range(24):
            a, b = h * 60, h * 60 + 60
            day[h] = sum(1 for lo, hi in spans[bit] if lo < b and hi >= a) + \
                sum(1 for lo, hi in spans[bit - 1] if lo - 1440 < b and hi - 1440 >= a)
        week[(start + datetime.timedelta(days=bit)).weekday()] = day
    return week


def stations():
    """{railroad: [(lon, lat), ...]} from every stations file."""
    out = {}
    files = [ROOT / "data" / "stations.json"] + sorted((ROOT / "data" / "regions").glob("*/stations.json"))
    for path in files:
        # {railroad: [[id, name, lat, lon, ...], ...]}
        for rid, rows in json.loads(path.read_text()).items():
            out.setdefault(rid, []).extend((r[3], r[2]) for r in rows)
    return out


def main():
    country_of, _ = railroads()
    by_station = stations()
    order = sorted({c for c in country_of.values()})
    out = {"countries": {}, "rr": {}, "order": order}
    w0, s0 = WORLD[0], WORLD[1]
    cols, rows = round((WORLD[2] - w0) / STEP), round((WORLD[3] - s0) / STEP)
    counts = {}  # cell -> {country index: stations}
    for rid, pts in by_station.items():
        c = country_of.get(rid)
        if c is None:
            continue
        i = order.index(c)
        for lon, lat in pts:
            x, y = int((lon - w0) // STEP), int((lat - s0) // STEP)
            if 0 <= x < cols and 0 <= y < rows:
                counts.setdefault((x, y), {}).setdefault(i, 0)
                counts[(x, y)][i] += 1
    grid = {k: max(by, key=by.get) for k, by in counts.items()}
    for i, c in enumerate(order):
        rr = []
        for rid in sorted(r for r, cc in country_of.items() if cc == c):
            path = ROOT / "data" / "schedules" / f"{rid}.json"
            if not path.exists():
                continue
            tt = json.loads(path.read_text())
            if not isinstance(tt.get("trips"), dict) or not tt.get("start"):
                continue
            out["rr"][rid] = {"tz": tt.get("tz") or "America/New_York", "w": hourly(tt)}
            rr.append(rid)
        rr.sort(key=lambda r: -sum(map(sum, out["rr"][r]["w"])))
        own = [k for k, v in grid.items() if v == i]
        own_set = set(own)
        if not own:
            continue
        # The middle of the cells its stations hold, so a railroad's stations
        # abroad (NS's in Germany, Amtrak's in Canada) don't pull it over.
        pin = [round(w0 + (statistics.median(x for x, _ in own) + 0.5) * STEP, 3),
               round(s0 + (statistics.median(y for _, y in own) + 0.5) * STEP, 3)]
        # The cells it holds (where its stations outnumber any other
        # country's: Paris is France's, however many Italian trains stop
        # there), in clusters (cells within GAP of each other); the clusters
        # with at least MASS of its stations: Alaska and Snälltåget's Berlin
        # stop left out, Adelaide in Australia's.
        cluster, seen = {}, set()
        for start in own:
            if start in seen:
                continue
            stack, members = [start], []
            seen.add(start)
            while stack:
                x, y = stack.pop()
                members.append((x, y))
                for dx in range(-GAP, GAP + 1):
                    for dy in range(-GAP, GAP + 1):
                        k = (x + dx, y + dy)
                        if k in own_set and k not in seen:
                            seen.add(k)
                            stack.append(k)
            for m in members:
                cluster[m] = start
        mass = {}
        for k in own:
            mass[cluster[k]] = mass.get(cluster[k], 0) + counts[k][i]
        total = sum(mass.values())
        near = [(w0 + (x + 0.5) * STEP, s0 + (y + 0.5) * STEP) for x, y in own if mass[cluster[(x, y)]] >= MASS * total]
        out["countries"][c] = {
            "pin": pin,
            "bbox": [round(min(x for x, _ in near), 2), round(min(y for _, y in near), 2),
                     round(max(x for x, _ in near), 2), round(max(y for _, y in near), 2)],
            "rr": rr,
        }
    # Out from the stations, a ring of cells at a time.
    for _ in range(FILL):
        add = {}
        for (x, y), i in grid.items():
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                k = (x + dx, y + dy)
                if k not in grid and 0 <= k[0] < cols and 0 <= k[1] < rows:
                    add.setdefault(k, i)
        grid.update(add)
    runs, last, n = [], None, 0
    for y in range(rows):
        for x in range(cols):
            ch = LETTERS[grid[(x, y)]] if (x, y) in grid else "."
            if ch == last:
                n += 1
            else:
                if last is not None:
                    runs.append(f"{n}{last}")
                last, n = ch, 1
    runs.append(f"{n}{last}")
    out["grid"] = [w0, s0, STEP, cols, rows, "".join(runs)]
    OUT.write_text(json.dumps(out, separators=(",", ":"), ensure_ascii=False))
    print(f"wrote {OUT.relative_to(ROOT)}: {len(out['countries'])} countries, {len(out['rr'])} railroads, {OUT.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
