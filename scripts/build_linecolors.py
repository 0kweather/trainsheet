"""Build data/linecolors.json: the color each railroad gives its lines in its
timetable (GTFS route_color), under the line names the map uses, for the
small line marks beside line names.

Output: {railroad: {line name: "#rrggbb"}}. Lines whose railroad gives them
no color of their own (none, or the same one for every line) are left out.

    python3 scripts/build_linecolors.py
    python3 scripts/build_linecolors.py --only trirail   # a plug-in's railroads (scripts/railroads/), into the existing file

A feed that fails keeps that railroad's colors from the last build.
"""
import collections, json, pathlib
from feeds import EXTRAS, GTFS, chosen, get_zip, rows as csv_rows

ROOT = pathlib.Path(__file__).resolve().parent
get = lambda url: get_zip(url, timeout=240)
rows = lambda zf, name: csv_rows(zf, name, optional=True, spaces=True)


only = chosen()
path = ROOT.parent / "data" / "linecolors.json"
previous = json.loads(path.read_text()) if path.exists() else {}
out = {}
for agency, (url, keep, line_name, *_) in GTFS.items():
    if only and agency not in only:
        continue
    try:
        zf = get(url)
    except Exception as err:
        if agency in previous:
            out[agency] = previous[agency]
        print(f"{agency}: FAILED ({err}){'; kept from the last build' if agency in previous else ''}")
        continue
    colors = collections.defaultdict(collections.Counter)
    for r in rows(zf, "routes.txt"):
        if not keep(r):
            continue
        c = (r.get("route_color") or "").strip().lstrip("#").lower()
        name = line_name(r)
        if name and len(c) == 6 and c not in ("ffffff", "000000"):
            colors[name][c] += 1
    lines = {name: f"#{cs.most_common(1)[0][0]}" for name, cs in colors.items()}
    # One color for every line is the railroad's own, not the lines'.
    if len(lines) > 1 and len(set(lines.values())) == 1:
        lines = {}
    # Lines split from their routes by trip (build_stations.py's TRIP_LINE):
    # Metrolink's Arrow in its blue.
    if agency == "metrolink":
        lines["Metrolink Arrow"] = "#2a62d4"
    lines.update(EXTRAS.get(agency, {}).get("colors", {}))
    if lines:
        out[agency] = lines
    print(f"{agency}: {len(lines)} lines with colors")

# Railroads not asked for stay as they were; one asked for that now has no
# colors of its own leaves.
old = {a: v for a, v in previous.items() if a not in only} if only else {}
old.update(out)
path.write_text(json.dumps(old, separators=(",", ":"), ensure_ascii=False, sort_keys=True))
print(f"wrote {path}")
