"""Fill build_rail.py's route tiles from Geofabrik's country extracts instead of
the public Overpass servers, which are often too busy to answer a tile.

Each extract is downloaded, cut down with osmium to its railway=rail and
railway=narrow_gauge ways (then deleted), and the ways kept are the ones
build_rail.py's ROUTE_WAYS selects: no service tag, usage not industrial,
military or test. They're written as the one-degree tiles
build_rail.py routes over (scripts/.osm-cache/route-tile-<x>-<y>.json, in
Overpass's answer format), every way in each tile it touches, so a tile at a
border holds both countries' track. Needs osmium (brew install osmium-tool).

    python3 scripts/osm_tiles.py
    python3 scripts/build_rail.py --offline

The cut-down extracts stay in scripts/.osm-extracts, so a rerun downloads
only what's missing; delete it to refresh.
"""
import json, math, pathlib, re, shutil, subprocess, sys
from collections import defaultdict

ROOT = pathlib.Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts" / ".osm-cache"
WORK = ROOT / "scripts" / ".osm-extracts"
GEOFABRIK = "https://download.geofabrik.de"
TILE = 1.0  # degrees, as build_rail.py's ROUTE_TILE
# The regions' countries, and the parts of their neighbors their trains run into.
EXTRACTS = [
    "europe/spain", "europe/portugal",
    "europe/czech-republic", "europe/slovakia", "europe/austria", "europe/hungary",
    "europe/poland/slaskie", "europe/poland/malopolskie", "europe/poland/dolnoslaskie",
    "europe/poland/opolskie", "europe/poland/podkarpackie",
    "europe/germany/sachsen", "europe/germany/bayern/oberpfalz",
    "europe/germany/bayern/niederbayern", "europe/germany/bayern/oberfranken",
    "europe/finland", "europe/norway", "europe/sweden",
    "europe/estonia", "europe/latvia", "europe/lithuania",
    "europe/greece", "europe/ireland-and-northern-ireland",
    "europe/romania", "europe/moldova", "europe/bulgaria",
    "europe/italy", "europe/switzerland", "europe/slovenia",
    "europe/france/provence-alpes-cote-d-azur", "europe/france/rhone-alpes", "europe/germany/baden-wuerttemberg",
    "asia/malaysia-singapore-brunei", "asia/thailand", "asia/israel-and-palestine",
    "australia-oceania/australia", "australia-oceania/new-zealand",
]
# Tourist lines stay: build_rail.py routes only the hops a timetable runs, so
# a line OSM tags as tourist (Sardinia's Mandas–Isili) is drawn only where a
# scheduled train uses it.
SKIP_USAGE = re.compile(r"^(industrial|military|test)$")


def osmium(*args):
    subprocess.run([shutil.which("osmium") or "/opt/homebrew/bin/osmium", *args], check=True)


def rail_of(extract):
    """The extract's track as GeoJSON lines (one way each), fetched and cut down if need be."""
    name = extract.replace("/", "-")
    lines = WORK / f"{name}.geojsonseq"
    if lines.exists():
        return lines
    WORK.mkdir(parents=True, exist_ok=True)
    pbf, rail = WORK / f"{name}.osm.pbf", WORK / f"{name}-rail.osm.pbf"
    print(f"{extract}: downloading", flush=True)
    subprocess.run(["curl", "-fsSL", "--retry", "5", "-A", "Trainsheet/1.0 (+https://trainsheet.com)",
                    "-o", str(pbf), f"{GEOFABRIK}/{extract}-latest.osm.pbf"], check=True)
    osmium("tags-filter", str(pbf), "w/railway=rail,narrow_gauge", "-o", str(rail), "--overwrite")
    pbf.unlink()
    osmium("export", str(rail), "-f", "geojsonseq", "--geometry-types=linestring", "-a", "id",
           "-o", str(lines), "--overwrite")
    rail.unlink()
    return lines


def main():
    tiles = defaultdict(dict)  # (x, y) -> way id -> element
    for extract in EXTRACTS:
        kept = 0
        for row in open(rail_of(extract)):
            f = json.loads(row.lstrip("\x1e"))
            p = f["properties"]
            if p.get("railway") not in ("rail", "narrow_gauge") or "service" in p or SKIP_USAGE.match(p.get("usage", "")):
                continue
            coords = f["geometry"]["coordinates"]
            wid = int(str(p["@id"]).lstrip("w"))
            way = {"type": "way", "id": wid, "geometry": [{"lat": y, "lon": x} for x, y in coords]}
            for t in {(math.floor(x / TILE), math.floor(y / TILE)) for x, y in coords}:
                tiles[t][wid] = way
            kept += 1
        print(f"{extract}: {kept} ways of track", flush=True)
    CACHE.mkdir(exist_ok=True)
    for (x, y), ways in sorted(tiles.items()):
        (CACHE / f"route-tile-{x}-{y}.json").write_text(json.dumps(list(ways.values())))
    print(f"wrote {len(tiles)} route tiles to {CACHE}")


if __name__ == "__main__":
    main()
