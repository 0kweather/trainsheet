"""Each European region's track abroad: where its trains run on past its
border, beyond the half degree its own file reaches (build_rail.py's
ROUTE_ABROAD), so a country picked on the map's Europe overview shows its
lines running on into its neighbors (Germany's ICEs to Brussels, Paris,
Vienna and Copenhagen).

    python3 scripts/build_abroad.py            all of Europe's regions
    python3 scripts/build_abroad.py de fr      just these

For each region, every pair of stops its trains call at one after the other
(its railroads' timetables, data/schedules/<railroad>.json) with a stop off
its own track is routed as build_rail.py routes its hops: over the other
regions' drawn track (data/rail/<region>.geojson) and OpenStreetMap's, from
the route tiles already fetched (scripts/.osm-cache; with OSM_ROUTE_FETCH=1,
the missing ones are fetched). What a route runs on outside the region's own
track is written to data/rail/abroad/<region>.geojson, each line with its
railroads (n, a, b, c as the region files have them) and "in": the country
it lies in (none where no railroad is on the map), so the page can leave out
what that country's own track draws once it's loaded.
"""
import json, math, os, pathlib, re, sys
from collections import defaultdict

sys.argv = [sys.argv[0], "--offline", *sys.argv[1:]]  # build_rail: no Overpass unless OSM_ROUTE_FETCH=1
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import build_rail as br  # noqa: E402

ROOT = br.ROOT
RAIL = ROOT / "data" / "rail"
OUT = RAIL / "abroad"
EUROPE = (-25, 34, 45, 72)  # [west, south, east, north]: a region whose box's middle is here
OFF_M = 2000                # a stop farther than this from the region's own track is off it
SIMPLIFY = br.REGION_TOLERANCE


def in_europe(bbox):
    lon, lat = (bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2
    return EUROPE[0] <= lon <= EUROPE[2] and EUROPE[1] <= lat <= EUROPE[3]


def lines(region):
    gj = json.loads((RAIL / f"{region}.geojson").read_text())
    return [[tuple(p) for p in f["geometry"]["coordinates"]] for f in gj["features"] if not f["properties"].get("h")]


class Near:
    """Is a point within OFF_M of these lines' points? (Their points are
    dense enough: the region files keep a point every few hundred metres at
    most along straight track.)"""
    CELL = 0.05

    def __init__(self, ls):
        self.grid = defaultdict(list)
        for l in ls:
            for a, b in zip(l, l[1:]):
                # Points along each piece, so long straight ones count too.
                n = max(1, int(br.meters(a, b) / 500))
                for i in range(n + 1):
                    p = (a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n)
                    self.grid[(int(p[0] // self.CELL), int(p[1] // self.CELL))].append(p)

    def __call__(self, p):
        gx, gy = int(p[0] // self.CELL), int(p[1] // self.CELL)
        return any(br.meters(p, q) <= OFF_M for dx in (-1, 0, 1) for dy in (-1, 0, 1) for q in self.grid.get((gx + dx, gy + dy), ()))


def pairs_of(agencies):
    """{(stop, stop): {railroad}}: consecutive stops of every run, as (lon, lat)."""
    out = defaultdict(set)
    for agency in agencies:
        path = ROOT / "data" / "schedules" / f"{agency}.json"
        if not path.exists():
            continue
        tt = json.loads(path.read_text())
        at = {k: (round(v[2], 5), round(v[1], 5)) for k, v in tt["stops"].items()}
        later = [r for runs in tt.get("ahead", {}).get("trips", {}).values() for _, r in runs if isinstance(r, list)]
        for run in [r for runs in tt["trips"].values() for r in runs] + [[0, *r] for r in later]:
            seq = [at[s[0]] for s in run[2] if s[0] in at]
            for a, b in zip(seq, seq[1:]):
                if a != b and br.meters(a, b) <= br.ROUTE_MAX_KM * 1000:
                    out[(a, b) if a < b else (b, a)].add(agency)
    return out


def country_grid():
    """The country under a point, from data/overview.json's grid (built first
    if it isn't there)."""
    import build_overview
    path = build_overview.OUT
    if not path.exists():
        build_overview.main()
    e = json.loads(path.read_text())
    w, s, step, cols, rows, runs = e["grid"]
    cells = "".join(ch * int(n) for n, ch in re.findall(r"(\d+)(\D)", runs))

    def at(p):
        x, y = int((p[0] - w) // step), int((p[1] - s) // step)
        if not (0 <= x < cols and 0 <= y < rows) or cells[y * cols + x] == ".":
            return None
        return e["order"][build_overview.LETTERS.index(cells[y * cols + x])]
    return at


def build(region, agencies, others, where):
    own = lines(region)
    near_own = Near(own)
    pairs = {p: a for p, a in pairs_of(agencies).items() if not (near_own(p[0]) and near_own(p[1]))}
    if not pairs:
        print(f"{region}: no trains past its own track")
        return None
    # The graph: this region's track, the others' near the hops, and OSM's.
    xs = [x for p in pairs for x, _ in p]
    ys = [y for p in pairs for _, y in p]
    box = (min(xs) - 1, min(ys) - 1, max(xs) + 1, max(ys) + 1)
    ways = [tuple((round(x, 4), round(y, 4)) for x, y in l) for l in own]
    own_nodes = {n for w in ways for n in w}
    for r, bbox in others.items():
        if r != region and not (bbox[0] > box[2] or bbox[2] < box[0] or bbox[1] > box[3] or bbox[3] < box[1]):
            ways += [tuple((round(x, 4), round(y, 4)) for x, y in l) for l in lines(r)]
    osm = br.candidate_track(br.route_tiles(list(pairs))) or []
    ways += [tuple(w) for w in osm]
    graph = br.RailGraph(ways)
    edges = defaultdict(set)  # (node, node) sorted -> railroads
    missed = []
    for (a, b), rr in sorted(pairs.items()):
        path = graph.route(a, b)
        if not path:
            missed.append((a, b))
            continue
        for m, n in zip(path, path[1:]):
            if m in own_nodes and n in own_nodes:
                continue
            edges[(m, n) if m < n else (n, m)] |= rr
    # Chains of edges with the same railroads and region, walked end to end.
    adj = defaultdict(list)
    for (m, n), rr in edges.items():
        key = (br.order(rr), where(((m[0] + n[0]) / 2, (m[1] + n[1]) / 2)))
        adj[m].append((n, key))
        adj[n].append((m, key))
    used, features = set(), []
    def walk(start, nxt, key):
        line = [start, nxt]
        used.add(frozenset((start, nxt)))
        while True:
            here = line[-1]
            ahead = [(o, k) for o, k in adj[here] if k == key and frozenset((here, o)) not in used]
            if len(ahead) != 1 or sum(1 for _, k in adj[here] if k == key) != 2:
                return line
            used.add(frozenset((here, ahead[0][0])))
            line.append(ahead[0][0])
    # Start from ends and junctions first, then whatever loops are left.
    starts = sorted(adj, key=lambda n: sum(1 for _ in adj[n]) == 2)
    for s in starts:
        for o, key in adj[s]:
            if frozenset((s, o)) in used:
                continue
            line = walk(s, o, key)
            nets, inside = key
            props = {"n": len(nets), **dict(zip("abc", nets))}
            if inside and inside != region.upper():  # its own country's: drawn with it, never left out
                props["in"] = inside
            coords = br.simplify([list(p) for p in line], SIMPLIFY)
            features.append({"type": "Feature", "properties": props, "geometry": {"type": "LineString", "coordinates": coords}})
    km = sum(br.meters(m, n) for m, n in edges) / 1000
    print(f"{region}: {len(pairs)} hops past its track, {len(missed)} not routable, {len(features)} lines, {km:.0f} km")
    for a, b in missed[:8]:
        print(f"    not routed: {a} - {b} ({', '.join(sorted(pairs[(a, b)]))})")
    return features


def main(only):
    mods = br.plugins()
    index = json.loads((RAIL / "index.json").read_text())
    regions = {r["region"]: r["bbox"] for r in index if in_europe(r["bbox"])}
    agencies = defaultdict(list)
    for m in mods:
        if m.RAIL["region"] in regions:
            agencies[m.RAIL["region"]] += list(m.AGENCIES)
    where = country_grid()
    OUT.mkdir(exist_ok=True)
    for region in sorted(regions):
        if only and region not in only:
            continue
        features = build(region, agencies[region], regions, where)
        path = OUT / f"{region}.geojson"
        if features:
            path.write_text(json.dumps({"type": "FeatureCollection", "features": features}, separators=(",", ":")))
            print(f"  wrote {path.relative_to(ROOT)} ({path.stat().st_size // 1024} KB)")
        elif path.exists():
            path.unlink()
    # The regions that have some, so the page asks only for those.
    have = sorted(p.stem for p in OUT.glob("*.geojson"))
    (OUT / "index.json").write_text(json.dumps(have) + "\n")


if __name__ == "__main__":
    main(set(sys.argv[2:]))
