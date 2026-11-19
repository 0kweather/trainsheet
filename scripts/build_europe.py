"""The summary the map's Europe overview draws from (js/europe.js), so a view
of the whole continent shows each country's pin without loading any of its
track, stations or timetables.

    python3 scripts/build_europe.py

Reads the registry (js/railroads/index.js), each region's stations
(data/regions/<region>/stations.json) and each railroad's timetable
(data/schedules/<railroad>.json), and writes data/europe.json (not
committed: the deploy workflow runs this, as it slices the timetables):

  regions   {region: {pin: [lon, lat], rr: [railroad, ...]}}: where its pin
            points (the middle of the cells its stations hold) and its railroads, busiest
            first
  rr        {railroad: {tz, w: [[trains, ...] x 24] x 7}}: the trains running
            in each hour of each weekday (Monday first) where the railroad
            is, from the second of its timetable's two weeks
  grid      [west, south, step, columns, rows, cells]: the region under each
            step-degree cell (its place in the regions' order, as a letter;
            "." none), filled from the stations out to about a degree, so
            the map knows which country it's centered on
"""
import datetime, json, pathlib, re, statistics

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "europe.json"
EUROPE = (-25, 34, 45, 72)   # [west, south, east, north]: a region whose box's middle is here
STEP = 0.25                  # degrees, the grid's cells
FILL = 4                     # cells a station's region spreads to where no station is


def registry():
    text = (ROOT / "js" / "railroads" / "index.js").read_text()
    body = text.split("export const AGENCIES = {")[1].split("\n};")[0]
    agencies = {m.group(1): json.loads(m.group(2)) for m in re.finditer(r"^\s*(\w+): (\{.*\}),?$", body, re.M)}
    regions = json.loads(re.sub(r",\s*\]$", "]", re.search(r"export const DATA_REGIONS = (\[.*?\n\]);", text, re.S).group(1)))
    return agencies, regions


def in_europe(bbox):
    lon, lat = (bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2
    return EUROPE[0] <= lon <= EUROPE[2] and EUROPE[1] <= lat <= EUROPE[3]


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
            for bit in range(14):
                if (mask >> bit) & 1:
                    spans[bit].append((pat[0][2], pat[-1][1]))
    week = [None] * 7
    for bit in range(7, 14):
        day = [0] * 24
        for h in range(24):
            a, b = h * 60, h * 60 + 60
            day[h] = sum(1 for lo, hi in spans[bit] if lo < b and hi >= a) + \
                sum(1 for lo, hi in spans[bit - 1] if lo - 1440 < b and hi - 1440 >= a)
        week[(start + datetime.timedelta(days=bit)).weekday()] = day
    return week


def main():
    agencies, regions = registry()
    regions = [r for r in regions if in_europe(r["bbox"])]
    out = {"regions": {}, "rr": {}}
    cells = {}
    w0, s0 = EUROPE[0], EUROPE[1]
    cols, rows = round((EUROPE[2] - w0) / STEP), round((EUROPE[3] - s0) / STEP)
    for i, r in enumerate(regions):
        stations = json.loads((ROOT / "data" / "regions" / r["region"] / "stations.json").read_text())
        # {railroad: [[id, name, lat, lon, ...], ...]}
        pts = [(s[3], s[2]) for rows in stations.values() for s in rows]
        if not pts:
            continue
        rr = []
        for a in r["agencies"]:
            path = ROOT / "data" / "schedules" / f"{a}.json"
            if not path.exists():
                continue
            tt = json.loads(path.read_text())
            if not isinstance(tt.get("trips"), dict) or not tt.get("tz"):
                continue
            out["rr"][a] = {"tz": tt["tz"], "w": hourly(tt)}
            rr.append(a)
        rr.sort(key=lambda a: -sum(map(sum, out["rr"][a]["w"])))
        out["regions"][r["region"]] = {
            "pin": [round(statistics.median(p[0] for p in pts), 3), round(statistics.median(p[1] for p in pts), 3)],
            "rr": rr,
        }
        counts = {}
        for lon, lat in pts:
            x, y = int((lon - w0) // STEP), int((lat - s0) // STEP)
            if 0 <= x < cols and 0 <= y < rows:
                counts.setdefault((x, y), {}).setdefault(i, 0)
                counts[(x, y)][i] += 1
        for k, by in counts.items():
            n = max(by.values())
            if n > cells.get(k, (None, 0))[1]:
                cells[k] = (i, n)
    # Each pin at the middle of the cells its region's stations hold, so
    # one railroad's stations abroad (NS's in Germany) don't pull it over.
    grid = {k: v[0] for k, v in cells.items()}
    for i, r in enumerate(regions):
        own = [k for k, v in grid.items() if v == i]
        if own and r["region"] in out["regions"]:
            out["regions"][r["region"]]["pin"] = [round(w0 + (statistics.median(x for x, _ in own) + 0.5) * STEP, 3),
                                                  round(s0 + (statistics.median(y for _, y in own) + 0.5) * STEP, 3)]
    # Out from the stations, a ring of cells at a time.
    for _ in range(FILL):
        add = {}
        for (x, y), i in grid.items():
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                k = (x + dx, y + dy)
                if k not in grid and 0 <= k[0] < cols and 0 <= k[1] < rows:
                    add.setdefault(k, i)
        grid.update(add)
    names = [r["region"] for r in regions]
    letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    out["order"] = names
    out["grid"] = [w0, s0, STEP, cols, rows,
                   "".join(letters[grid[(x, y)]] if (x, y) in grid else "." for y in range(rows) for x in range(cols))]
    OUT.write_text(json.dumps(out, separators=(",", ":"), ensure_ascii=False))
    print(f"wrote {OUT.relative_to(ROOT)}: {len(out['regions'])} regions, {len(out['rr'])} railroads, {OUT.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
