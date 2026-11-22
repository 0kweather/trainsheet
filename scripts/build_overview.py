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
OUTLIER = 2.5                 # a stop this many times its country's usual distance from its middle counts for half
WEAK = 0.5                    # a cell whose stations count for less than this goes to whoever usually runs there
SPREAD_MIN = 0.3              # degrees: the usual distance of a country whose trains run in one city
LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"


def far(a, b):
    """Degrees between two [lon, lat] points, a degree of longitude shrunk by its latitude."""
    k = math.cos(math.radians((a[1] + b[1]) / 2))
    return math.hypot((a[0] - b[0]) * k, a[1] - b[1])


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
    """[[trains, ...] x 24] x 7, Monday first: how many runs are going at a
    moment in each hour of each weekday of the timetable's second week (the
    minutes its runs spend in the hour, over sixty), counting yesterday's
    still running past midnight. Not every run that touches the hour: a pin
    says "running", as a country's page does of the trains on its map, and
    counting each run going at any time in the hour said half as many again
    (Italy: 1,626 on its pin, 1,053 on its page)."""
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
            minutes = sum(max(0, min(hi, b) - max(lo, a)) for lo, hi in spans[bit]) + \
                sum(max(0, min(hi - 1440, b) - max(lo - 1440, a)) for lo, hi in spans[bit - 1])
            # A railroad with a train out for part of the hour still has one.
            day[h] = round(minutes / 60) or (1 if minutes else 0)
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
    # A stop far out from where its country's railroads mostly run (PKP
    # Intercity's in Kyiv and Kharkiv, ÖBB's in Kyiv, DSB's in Prague)
    # counts for less, and less the farther out: where another country's
    # railroads stop too, the cell is theirs, however sparse their own list
    # of stations; and of two countries with a stop each, the one it's
    # nearer the middle of.
    pts_of = {}  # country index -> [(lon, lat), ...]
    for rid, pts in by_station.items():
        if country_of.get(rid) is not None:
            pts_of.setdefault(order.index(country_of[rid]), []).extend(pts)
    usual = {}   # country index -> (middle, usual distance from it)
    for i, pts in pts_of.items():
        mid = (statistics.median(p[0] for p in pts), statistics.median(p[1] for p in pts))
        usual[i] = (mid, max(statistics.median(far(p, mid) for p in pts), SPREAD_MIN))
    counts = {}  # cell -> {country index: stations, the far-off ones counting less}
    tally = {}   # cell -> {country index: stations}
    for i, pts in pts_of.items():
        mid, spread = usual[i]
        for lon, lat in pts:
            x, y = int((lon - w0) // STEP), int((lat - s0) // STEP)
            if 0 <= x < cols and 0 <= y < rows:
                z = far((lon, lat), mid) / spread
                counts.setdefault((x, y), {}).setdefault(i, 0)
                counts[(x, y)][i] += 1 / (1 + (z / OUTLIER) ** 4)
                tally.setdefault((x, y), {}).setdefault(i, 0)
                tally[(x, y)][i] += 1
    # A cell is the country whose stations there count most. A cell only
    # far-off stops hold (PKP Intercity's Vinnytsia) goes to a country with
    # stations of its own close by, where its railroads usually run
    # (Ukraine); else it's theirs.
    held = {k: max(by, key=by.get) for k, by in counts.items() if max(by.values()) >= WEAK}

    def holder(k, by):
        best = max(by, key=by.get)
        if k in held:
            return best
        at = (w0 + (k[0] + 0.5) * STEP, s0 + (k[1] + 0.5) * STEP)
        home = {i for i, (mid, spread) in usual.items() if far(at, mid) <= OUTLIER * spread}
        close = [(abs(dx) + abs(dy), held[(k[0] + dx, k[1] + dy)])
                 for dx in range(-FILL, FILL + 1) for dy in range(-FILL, FILL + 1)
                 if abs(dx) + abs(dy) <= FILL and held.get((k[0] + dx, k[1] + dy)) in home]
        return min(close)[1] if close else best

    grid = {k: holder(k, by) for k, by in counts.items()}
    # Out from the stations, a ring of cells at a time.
    for _ in range(FILL):
        add = {}
        for (x, y), i in grid.items():
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                k = (x + dx, y + dy)
                if k not in grid and 0 <= k[0] < cols and 0 <= k[1] < rows:
                    add.setdefault(k, i)
        grid.update(add)
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
        own = [k for k in counts if grid[k] == i]  # the cells its stations hold
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
            mass[cluster[k]] = mass.get(cluster[k], 0) + tally[k].get(i, 0)
        total = sum(mass.values())
        near = [(w0 + (x + 0.5) * STEP, s0 + (y + 0.5) * STEP) for x, y in own if mass[cluster[(x, y)]] >= MASS * total]
        out["countries"][c] = {
            "pin": pin,
            "bbox": [round(min(x for x, _ in near), 2), round(min(y for _, y in near), 2),
                     round(max(x for x, _ in near), 2), round(max(y for _, y in near), 2)],
            "rr": rr,
        }
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
