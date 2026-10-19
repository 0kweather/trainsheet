"""Build data/rail.geojson: US and Canadian passenger rail lines, tagged by the networks
(railroads) that run passenger trains on them.

Source: USDOT/BTS National Transportation Atlas Database, North American Rail
Network Lines. Each segment lists its owners and trackage-rights holders as
railroad codes (AMTK, MNCW, NJT, ...) and a passenger-service flag
(PASSNGR = A Amtrak, C commuter, B both). Commuter trains often run on
freight-owned track (Metra on Union Pacific lines, say) where the commuter
railroad isn't listed; those take the railroad of the nearest commuter
station. Brightline's Florida East Coast track isn't flagged as passenger in
NTAD, so it's added separately.

Output features: properties { n: number of networks, a, b, c: network ids }.
Run after scripts/build_stations.py (it uses data/stations.json):

    python3 scripts/build_rail.py

Track outside North America comes from OpenStreetMap, one file per region
(data/rail/<region>.geojson, listed in data/rail/index.json), for each
railroad plug-in (scripts/railroads/<id>.py) that declares RAIL: its
route=train relations by operator or network, or an Overpass query for its
ways (main and branch lines in its box by default). The same chaining,
healing and parallel-track passes then run on it. A plain run builds North
America and every region; one railroad's region alone, with the other
railroads' track in it as last fetched (data/rail/src/<id>.json):

    python3 scripts/build_rail.py --only digitraffic

Each region's railroads' timetables then route their trains between stops
over that track (and OpenStreetMap's other mainline track where it's
missing), which adds the missing stretches and tags shared track with every
railroad on it. To rebuild the regions from the track on file and the route
tiles already fetched, with no downloads:

    python3 scripts/build_rail.py --offline

The public Overpass servers are often too busy for the route tiles;
scripts/osm_tiles.py writes them all from Geofabrik's country extracts first.
"""
import hashlib, json, math, os, pathlib, re, socket, ssl, subprocess, sys, time, urllib.error, urllib.parse, urllib.request
from collections import defaultdict

URL = ("https://services.arcgis.com/xOi1kZaI0eWDREZv/arcgis/rest/services/"
       "NTAD_North_American_Rail_Network_Lines/FeatureServer/0/query")
ROOT = pathlib.Path(__file__).resolve().parent.parent
CODE_FIELDS = ["RROWNER1", "RROWNER2", "RROWNER3"] + [f"TRKRGHTS{i}" for i in range(1, 10)]

# Railroad code -> network id (ids match js/networks.js).
CODES = {
    "AMTK": "amtrak", "NJT": "njt", "MBTA": "mbta", "SCAX": "metrolink", "MNCW": "mnr", "LI": "lirr",
    "UTF": "frontrunner", "SEPA": "septa", "MARC": "marc", "NIRC": "metra", "VREX": "vre",
    "SLE": "ctrail", "NICD": "southshore", "JPBX": "caltrain", "SDRX": "sounder", "ACEX": "ace",
    "SFRC": "trirail", "TRCX": "trirail", "CFCR": "sunrail", "NCTD": "coaster", "SMRT": "smart",
    "DRTD": "rtd", "RTDC": "rtd", "CMRX": "capmetro", "TRE": "tre", "DART": "tre",
    "NMRX": "railrunner", "WES": "wes", "TEXR": "texrail", "NRTX": "star",
    # Canada
    "GO": "go", "AMT": "exo", "EXO": "exo", "WCE": "wce", "WCXR": "wce",
}
ORDER = ["amtrak", "via", "brightline"]  # intercity first, then commuter networks alphabetically
COMMUTER_STATIONS = {"mbta", "lirr", "mnr", "njt", "septa", "metra", "rtd", "frontrunner",
                     "capmetro", "trirail", "caltrain", "smart", "metrolink", "ctrail",
                     "marc", "vre", "sounder", "southshore", "sunrail", "railrunner",
                     "coaster", "sprinter", "atrain", "tre", "silverline", "texrail", "star", "upx"}
# CTrail's Hartford Line trains run on Amtrak's New Haven-Springfield line,
# which NTAD files as Amtrak's alone: (south, west, north, east).
HARTFORD_LINE = (41.30, -72.95, 42.105, -72.585)
NEAREST_KM = 4


def query(where, fields):
    out, offset = [], 0
    while True:
        params = {"where": where, "outFields": ",".join(fields), "maxAllowableOffset": "0.0003",
                  "geometryPrecision": "4", "resultOffset": offset, "resultRecordCount": 2000,
                  "orderByFields": "OBJECTID", "f": "geojson"}
        for attempt in range(5):
            try:
                with urllib.request.urlopen(f"{URL}?{urllib.parse.urlencode(params)}", timeout=180) as r:
                    page = json.load(r)["features"]
                break
            except Exception as err:
                if attempt == 4:
                    raise
                print(f"  NTAD retry {attempt + 1} ({err})")
                time.sleep(15 * (attempt + 1))
        out += [f for f in page if f.get("geometry")]
        offset += len(page)
        print(f"  {offset} segments")
        if len(page) < 2000:
            return out


def parts(geom):
    return [geom["coordinates"]] if geom["type"] == "LineString" else geom["coordinates"]


# Commuter stations, bucketed on a ~0.1° grid for the nearest-station fallback.
stations = json.loads((ROOT / "data" / "stations.json").read_text())
grid = defaultdict(list)
for agency, rows in stations.items():
    if agency in COMMUTER_STATIONS:
        for _id, _name, lat, lon, *_ in rows:
            grid[(int(lat * 10), int(lon * 10))].append((lat, lon, agency))


def nearest_commuter(pt):
    lon, lat = pt
    best, best_km = None, NEAREST_KM
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            for slat, slon, agency in grid.get((int(lat * 10) + dx, int(lon * 10) + dy), []):
                km = math.hypot((slat - lat) * 111, (slon - lon) * 111 * math.cos(math.radians(lat)))
                if km < best_km:
                    best, best_km = agency, km
    return best


def networks(props, pt):
    p = props.get("PASSNGR")
    if p == "V":  # VIA Rail Canada
        return ("via",)
    if p == "D":  # Alaska Railroad
        return ("alaska",)
    nets = {CODES[c] for c in (props.get(f) for f in CODE_FIELDS) if c in CODES}
    commuter = {n for n in nets if n != "amtrak"} if p in ("B", "C") else set()
    if p in ("B", "C") and not commuter:
        commuter = {nearest_commuter(pt) or "commuter"}
    out = (["amtrak"] if p in ("A", "B") else []) + sorted(commuter)
    s, w, n, e = HARTFORD_LINE
    if out == ["amtrak"] and s < pt[1] < n and w < pt[0] < e:
        out.append("ctrail")
    return tuple(sorted(out, key=lambda n: (ORDER.index(n) if n in ORDER else len(ORDER), n)))[:3]


def north_america():
    print("passenger lines (US and Canada)")
    segments = []
    # Main lines, plus the few passenger links NTAD files as major industrial
    # leads (NET = 'I': Hell Gate Bridge, some station approaches) and long
    # passing sidings (which the parallel-track pass below hides). Yard tracks and
    # minor leads are left out: they're what make big terminals look like a
    # tangle. PASSNGR: A Amtrak, B Amtrak and commuter, C commuter, D Alaska
    # Railroad, V VIA Rail (Canada).
    for f in query("NET IN ('M', 'I', 'S') AND COUNTRY IN ('US', 'CA') AND PASSNGR IN ('A','B','C','D','V')", ["PASSNGR"] + CODE_FIELDS):
        for line in parts(f["geometry"]):
            if len(line) >= 2:
                segments.append((networks(f["properties"], line[len(line) // 2]), line))

    print("Brightline (Florida East Coast main line, Miami to Cocoa)")
    for f in query("RROWNER1 = 'FEC' AND NET = 'M'", ["RROWNER1"]):
        for line in parts(f["geometry"]):
            if len(line) >= 2 and line[0][1] < 28.45:
                segments.append((("brightline",), line))
    return segments


# ---------- Gap filling from OpenStreetMap ----------
# NTAD lags new construction (Brightline to Orlando, LIRR into Grand Central
# Madison, Tri-Rail to Miami Central, Metrolink's Arrow, SMART to Windsor,
# Amtrak to Roanoke...) and has holes (Metro-North's Waterbury Branch). For
# each railroad, fetch its OpenStreetMap train routes and add any stretch the
# network doesn't already cover, joined to the existing track so trains can be
# routed across it. Then the railroad's own track that no mapped route uses
# yet (the LIRR's Grand Central Branch): only runs that close a gap between
# existing track, or reach one of its stations, so freight-only branches it
# happens to own stay off the map.

OSM_OPERATORS = {
    "amtrak": "^Amtrak$",
    "brightline": "Brightline", "lirr": "Long Island Rail Road|LIRR", "mnr": "Metro-North",
    "mbta": "MBTA|Massachusetts Bay|CapeFLYER|Keolis", "njt": "NJ Transit|New Jersey Transit",
    "septa": "SEPTA", "metra": "Metra", "metrolink": "Metrolink|Southern California Regional|SBCTA|Arrow",
    "rtd": "Regional Transportation District|RTD|Denver Transit", "frontrunner": "Utah Transit|UTA",
    "capmetro": "Capital Metro|CapMetro", "trirail": "Tri-Rail|South Florida Regional",
    "caltrain": "Caltrain", "smart": "SMART|Sonoma.Marin", "via": "VIA Rail|Via Rail",
    "go": "GO Transit|Metrolinx", "exo": "^exo$|Réseau de transport métropolitain",
    "coaster": "COASTER|North County Transit", "sprinter": "SPRINTER|North County Transit",
    "atrain": "DCTA|Denton County", "tre": "Trinity Railway Express", "silverline": "Silver Line|Dallas Area Rapid Transit|DART",
    "texrail": "TEXRail|Trinity Metro", "star": "WeGo|Music City Star|Regional Transportation Authority",
    "upx": "UP Express|Union Pearson", "ontarionorthland": "Ontario Northland",
}
# (name, network to tag, Overpass relation filter, bbox south,west,north,east)
TARGETED_FILLS = [
    # Amtrak's approach into New Orleans Union Passenger Terminal.
    ("new-orleans", "amtrak", '["operator"="Amtrak"]', "29.88,-90.2,30.03,-89.95"),
    # The CapeFLYER (run by the Cape Cod Regional Transit Authority) to Hyannis.
    ("capeflyer", "mbta", '["ref"~"CapeFlyer",i]', "41.6,-71.0,41.95,-70.2"),
    # Tri-Rail's Downtown Miami Link: the short curve off its own line onto
    # the track to MiamiCentral. A junction curve runs close beside both lines
    # it joins, so count track as drawn only when it's right on top, and keep
    # short runs.
    ("miami-link", "trirail", '["network"="Tri-Rail"]["to"~"MiamiCentral|Metrorail"]', "25.82,-80.28,25.87,-80.18",
     {"min_run": 80, "covered_m": 15}),
    # The spur Amtrak trains back into Tampa Union Station on.
    ("tampa", "amtrak", '["operator"="Amtrak"]', "27.93,-82.47,27.98,-82.42", {"min_run": 80, "covered_m": 15}),
]
COVERED_M = 50      # OSM track within this distance of existing track is already drawn
STATION_M = 500     # an operator-track run that ends this close to a station reaches it
MIN_RUN_M = 400     # ignore shorter uncovered bits (station tracks, crossovers)
STEP_M = 100        # densify OSM ways so gaps between far-apart nodes are noticed


OSM_CACHE = ROOT / "scripts" / ".osm-cache"
# The railroads' own-track queries are heavy and the public servers often
# time out on them; OSM_TRACK_ATTEMPTS=0 uses only what's already cached.
TRACK_ATTEMPTS = int(os.environ.get("OSM_TRACK_ATTEMPTS", "2"))
MIRRORS = ("https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter",
           "https://maps.mail.ru/osm/tools/overpass/api/interpreter")
# Hosts whose TLS handshake urllib can't make here (macOS's own python3 is
# built on LibreSSL 2.8.3, which overpass-api.de refuses): curl makes it.
CURL_HOSTS = set()
# A box a server gives up on is split in four, and each quarter again, down
# to 1/64 of it. A 502 or 504 that comes quicker than GAVE_UP_S is a busy
# server turning the query away, not one that ran out of time.
TILE_DEPTH = 3
GAVE_UP_S = 60


class TooBig(Exception):
    """The server gave up on the query: a gateway timeout, or its own time or memory limit."""


class Busy(Exception):
    """The server turned the query away: it can't spare the memory and time it asks for now."""


def gateway(code, since, body):
    if b"too busy" in body:
        return Busy(f"HTTP {code}, too busy")
    if time.time() - since >= GAVE_UP_S:
        return TooBig(f"HTTP {code} after {time.time() - since:.0f} s")
    return RuntimeError(f"HTTP {code}")


def post(url, query):
    """One Overpass answer, as JSON: through urllib, or curl for a host whose
    handshake urllib fails."""
    data = urllib.parse.urlencode({"data": query}).encode()
    host = urllib.parse.urlsplit(url).hostname
    since = time.time()
    if host not in CURL_HOSTS:
        try:
            req = urllib.request.Request(url, data=data, headers={"User-Agent": "trainsheet-build"})
            with urllib.request.urlopen(req, timeout=300) as r:
                return json.load(r)
        except urllib.error.HTTPError as err:
            if err.code in (502, 504):
                raise gateway(err.code, since, err.read()) from err
            raise
        except urllib.error.URLError as err:
            if isinstance(err.reason, (socket.timeout, TimeoutError)):
                raise TooBig("timed out") from err
            if not isinstance(err.reason, (ssl.SSLError, ConnectionResetError)):
                raise
            print(f"  {host}: no TLS handshake from here ({err.reason}), using curl")
        except (ssl.SSLError, ConnectionResetError) as err:
            print(f"  {host}: no TLS handshake from here ({err}), using curl")
        except (socket.timeout, TimeoutError) as err:
            raise TooBig("timed out") from err
        CURL_HOSTS.add(host)
    run = subprocess.run(["curl", "-sS", "--max-time", "300", "-A", "trainsheet-build", "--data-binary", "@-",
                          "-w", "\n%{http_code}", url], input=data, capture_output=True)
    if run.returncode == 28:
        raise TooBig("timed out")
    if run.returncode:
        raise RuntimeError(f"curl exit {run.returncode}: {run.stderr.decode(errors='replace').strip()[:120]}")
    body, _, code = run.stdout.rpartition(b"\n")
    if code in (b"502", b"504"):
        raise gateway(code.decode(), since, body)
    if code != b"200":
        raise RuntimeError(f"HTTP {code.decode()}")
    return json.loads(body)


def lighter(query):
    """The query asking for a quarter of the memory and half the time it did
    (at least 64 MiB and 3 minutes), which a busy server finds a slot for
    sooner; one that then needs more fails as too big, and is split."""
    query = re.sub(r"\[maxsize:(\d+)\]", lambda m: f"[maxsize:{max(1 << 26, int(m[1]) // 4)}]", query, count=1)
    return re.sub(r"\[timeout:(\d+)\]", lambda m: f"[timeout:{max(180, int(m[1]) // 2)}]", query, count=1)


def fetch(query, box, attempts, depth=0):
    """The query's elements, trying each mirror in turn; when one gives up
    on it and the query names a box (box: "south,west,north,east" as written
    in it), the box's quarters instead, merged. None if every try failed."""
    for attempt in range(attempts):
        url = MIRRORS[attempt % len(MIRRORS)]
        try:
            answer = post(url, query)
            # A query that times out or runs out of memory still answers 200,
            # with a remark and whatever it got so far: don't cache that.
            remark = answer.get("remark", "")
            if "error" in remark:
                raise (TooBig if "timed out" in remark or "out of memory" in remark else RuntimeError)(remark[:120])
            return answer["elements"]
        except TooBig as err:
            if box and depth < TILE_DEPTH:
                print(f"  overpass: {urllib.parse.urlsplit(url).hostname} gave up ({err}), splitting {box} in four")
                return tiles(query, box, attempts, depth)
            print(f"  overpass retry {attempt + 1} ({err})")
        except Busy as err:
            query = lighter(query)
            print(f"  overpass retry {attempt + 1} ({err}), asking for less")
        except Exception as err:
            print(f"  overpass retry {attempt + 1} ({err})")
        time.sleep(min(90, 15 * (attempt + 1)))
    return None


def tiles(query, box, attempts, depth):
    """The query run on each quarter of its box, the answers merged as one
    answer for the whole box comes: each element once, nodes, then ways, then
    relations, each by id."""
    s, w, n, e = (float(v) for v in box.split(","))
    ms, mw = (s + n) / 2, (w + e) / 2
    found = {}
    for quarter in ((s, w, ms, mw), (s, mw, ms, e), (ms, w, n, mw), (ms, mw, n, e)):
        sub = ",".join(repr(round(v, 7)) for v in quarter)
        part = fetch(lighter(query.replace(box, sub)), sub, attempts, depth + 1)
        if part is None:
            return None
        for el in part:
            found.setdefault((el["type"], el["id"]), el)
        time.sleep(2)
    rank = {"node": 0, "way": 1, "relation": 2}
    return [found[k] for k in sorted(found, key=lambda k: (rank.get(k[0], 3), k[1]))]




def overpass(query, name, attempts=9, box=None):
    """Run an Overpass query, caching the answer so reruns don't hammer the
    (often busy) public servers. Delete scripts/.osm-cache to refresh. box:
    the query's box as written in it, "south,west,north,east", which may then
    be fetched in pieces (see fetch)."""
    cached = OSM_CACHE / f"{name}.json"
    if cached.exists():
        return json.loads(cached.read_text())
    elements = fetch(query, box, attempts)
    if elements is not None:
        OSM_CACHE.mkdir(exist_ok=True)
        cached.write_text(json.dumps(elements))
    return elements


def meters(a, b):
    return math.hypot((b[0] - a[0]) * 111320 * math.cos(math.radians(a[1])), (b[1] - a[1]) * 110540)


class Coverage:
    """Grid index over segment pieces: nearest point on existing track."""
    CELL = 0.01

    def __init__(self, segs):
        self.segs = segs
        self.grid = {}
        for k in range(len(segs)):
            self.add(k)

    def add(self, k):
        c = self.segs[k][1]
        for i in range(len(c) - 1):
            a, b = c[i], c[i + 1]
            for gx in range(int(min(a[0], b[0]) // self.CELL), int(max(a[0], b[0]) // self.CELL) + 1):
                for gy in range(int(min(a[1], b[1]) // self.CELL), int(max(a[1], b[1]) // self.CELL) + 1):
                    self.grid.setdefault((gx, gy), []).append((k, i))

    def nearest(self, p, max_m, exclude=None, keep=None):
        best = None
        gx, gy = int(p[0] // self.CELL), int(p[1] // self.CELL)
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for k, i in self.grid.get((gx + dx, gy + dy), ()):
                    if k == exclude or (isinstance(exclude, set) and k in exclude) or (keep and not keep(k)):
                        continue
                    c = self.segs[k][1]
                    a, b = c[i], c[i + 1]
                    kx = math.cos(math.radians(p[1]))
                    ax, ay = (b[0] - a[0]) * kx, b[1] - a[1]
                    px, py = (p[0] - a[0]) * kx, p[1] - a[1]
                    L = ax * ax + ay * ay
                    t = max(0.0, min(1.0, (px * ax + py * ay) / L)) if L else 0.0
                    q = (round(a[0] + (b[0] - a[0]) * t, 5), round(a[1] + (b[1] - a[1]) * t, 5))
                    d = meters(p, q)
                    if d <= max_m and (best is None or d < best[0]):
                        best = (d, k, i, t, q)
        return best


def densify(pts, step=STEP_M):
    out = [pts[0]]
    for a, b in zip(pts, pts[1:]):
        n = int(meters(a, b) // step)
        out += [(a[0] + (b[0] - a[0]) * j / (n + 1), a[1] + (b[1] - a[1]) * j / (n + 1)) for j in range(1, n + 1)]
        out.append(b)
    return out


def split_segments(segs, cuts):
    """Insert nodes into existing segments where new track joins them."""
    by_seg = defaultdict(list)
    for k, i, t, q in cuts:
        by_seg[k].append((i, t, q))
    for k, cs in by_seg.items():
        nets, c = segs[k]
        pieces, cur, last_i = [], [c[0]], 0
        cs.sort()
        for i, t, q in cs:
            cur += c[last_i + 1:i + 1]
            last_i = i
            if tuple(cur[-1]) == q:
                continue
            cur.append(list(q))
            pieces.append(cur)
            cur = [list(q)]
        cur += c[last_i + 1:]
        pieces.append(cur)
        segs[k] = (nets, pieces[0])
        segs.extend((nets, p) for p in pieces[1:] if len(p) >= 2)


def chains(elements):
    """OSM ways joined end to end into longer lines (through nodes where
    exactly two ways meet), so a run isn't judged one short way at a time."""
    ways = [[(round(g["lon"], 5), round(g["lat"], 5)) for g in w.get("geometry", [])] for w in elements]
    ways = [w for w in ways if len(w) >= 2]
    ends = defaultdict(list)
    for i, w in enumerate(ways):
        ends[w[0]].append(i)
        ends[w[-1]].append(i)
    used = [False] * len(ways)

    def extend(chain):
        while True:
            nxt = [j for j in ends[chain[-1]] if not used[j]]
            if len(ends[chain[-1]]) != 2 or not nxt:
                return chain
            used[nxt[0]] = True
            w = ways[nxt[0]]
            chain += (w if w[0] == chain[-1] else w[::-1])[1:]

    out = []
    for i, w in enumerate(ways):
        if not used[i]:
            used[i] = True
            out.append(extend(extend(list(w))[::-1]))
    return out


def near_station(p, pts):
    return any(meters(p, q) <= STATION_M for q in pts)


def add_uncovered(segs, net, elements, min_run=MIN_RUN_M, covered_m=COVERED_M):
    """Add the stretches of these OSM ways that existing track doesn't cover."""
    cov = Coverage(segs)
    cuts, added_m = [], 0
    for line in chains(elements):
        line = densify(line)
        near = [cov.nearest(p, covered_m) for p in line]
        i = 0
        while i < len(line):
            if near[i]:
                i += 1
                continue
            j = i
            while j < len(line) and not near[j]:
                j += 1
            run = line[max(0, i - 1):min(len(line), j + 1)]
            length = sum(meters(a, b) for a, b in zip(run, run[1:]))
            hits = [near[idx] if 0 <= idx < len(line) else None for idx in (i - 1, j)]
            if length >= min_run:
                run = [list(p) for p in run]
                # Join each end to the track it touches.
                for end, hit in zip((0, -1), hits):
                    if hit:
                        _d, k, si, t, q = hit
                        run[end] = list(q)
                        cuts.append((k, si, t, q))
                segs.append(((net,), run))
                cov.add(len(segs) - 1)  # so parallel tracks aren't added twice
                added_m += length
                # Later ways may now be covered by this run.
                near = [n or cov.nearest(p, covered_m) for n, p in zip(near, line)]
            i = j
    split_segments(segs, cuts)
    return added_m


def add_connecting(segs, net, elements, stations_at):
    """Add a railroad's own uncovered track where it links up: each connected
    stretch of uncovered OSM track (through junctions and crossovers) goes in
    if it joins existing track in two places at least 1 km apart, or joins it
    once and reaches one of the railroad's stations."""
    cov = Coverage(segs)
    runs = []  # (points, [hit at start, hit at end])
    for way in elements:
        line = densify([(round(g["lon"], 5), round(g["lat"], 5)) for g in way.get("geometry", [])])
        if len(line) < 2:
            continue
        near = [cov.nearest(p, COVERED_M) for p in line]
        i = 0
        while i < len(line):
            if near[i]:
                i += 1
                continue
            j = i
            while j < len(line) and not near[j]:
                j += 1
            hits = [near[idx] if 0 <= idx < len(line) else None for idx in (i - 1, j)]
            runs.append((line[max(0, i - 1):min(len(line), j + 1)], hits))
            i = j
    # Runs that share an end node are connected.
    parent = list(range(len(runs)))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    by_end = defaultdict(list)
    for r, (pts, hits) in enumerate(runs):
        for end, hit in zip((pts[0], pts[-1]), hits):
            if not hit:
                by_end[end].append(r)
    for rs in by_end.values():
        for r in rs[1:]:
            parent[find(r)] = find(rs[0])
    groups = defaultdict(list)
    for r in range(len(runs)):
        groups[find(r)].append(r)
    cuts, added_m = [], 0
    for rs in groups.values():
        joins = [h[4] for r in rs for h in runs[r][1] if h]
        loose = [pt for r in rs for pt, h in zip((runs[r][0][0], runs[r][0][-1]), runs[r][1]) if not h]
        length = sum(meters(a, b) for r in rs for a, b in zip(runs[r][0], runs[r][0][1:]))
        spread = max((meters(a, b) for a in joins for b in joins), default=0)
        if length < MIN_RUN_M or not joins:
            continue
        if spread < 1000 and not any(near_station(p, stations_at) for p in loose):
            continue
        for r in rs:
            pts, hits = runs[r]
            run = [list(p) for p in pts]
            for end, hit in zip((0, -1), hits):
                if hit:
                    _d, k, si, t, q = hit
                    run[end] = list(q)
                    cuts.append((k, si, t, q))
            segs.append(((net,), run))
        added_m += length
    split_segments(segs, cuts)
    return added_m


def fill_gaps(segs):
    for net, operators in OSM_OPERATORS.items():
        pts = [(lon, lat) for _id, _n, lat, lon, *_ in stations.get(net, [])]
        if net in ("go", "exo"):
            pts = [(-79.4, 43.65), (-73.57, 45.5)]  # no stations of ours; search around Toronto/Montreal
        if not pts:
            continue
        lons, lats = [p[0] for p in pts], [p[1] for p in pts]
        bbox = f"{min(lats) - 0.5},{min(lons) - 0.5},{max(lats) + 0.5},{max(lons) + 0.5}"
        elements = overpass(f"""[out:json][timeout:240];
(relation["route"="train"]["operator"~"{operators}",i]({bbox});
 relation["route"="train"]["network"~"{operators}",i]({bbox}););
way(r)["railway"="rail"];
out geom;""", f"routes-{net}", box=bbox)
        if elements is None:
            print(f"  {net}: skipped, OpenStreetMap unavailable (rerun later to fill its gaps)")
            continue
        print(f"  {net}: +{add_uncovered(segs, net, elements) / 1000:.1f} km from OpenStreetMap routes")
        time.sleep(2)
        # The railroad's own main-line track outside any mapped route.
        exact = operators.strip("^$") if operators.startswith("^") and "|" not in operators else None
        match = f'["operator"="{exact}"]' if exact else f'["operator"~"{operators}",i]'
        elements = overpass(f"""[out:json][timeout:600][maxsize:1073741824];
way["railway"="rail"]{match}[!"service"]({bbox});
out geom;""", f"track-{net}", attempts=TRACK_ATTEMPTS, box=bbox)
        if elements is None:
            print(f"  {net}: own track skipped, OpenStreetMap unavailable")
            continue
        added = add_connecting(segs, net, elements, [(p[0], p[1]) for p in pts])
        print(f"  {net}: +{added / 1000:.1f} km of its own track from OpenStreetMap")
        time.sleep(2)

    # Targeted fills: specific places the broad search misses, limited to track
    # inside the area (the routes themselves run much farther).
    for name, net, routes, bbox, *opts in TARGETED_FILLS:
        elements = overpass(f"""[out:json][timeout:240];
relation["route"="train"]{routes}({bbox});
way(r)["railway"="rail"]({bbox});
out geom;""", f"targeted-{name}", box=bbox)
        if elements is None:
            print(f"  {name}: skipped, OpenStreetMap unavailable")
            continue
        print(f"  {name}: +{add_uncovered(segs, net, elements, **(opts[0] if opts else {})) / 1000:.1f} km from OpenStreetMap")
        time.sleep(2)


# ---------- Railroads' own route shapes ----------
# Some lines aren't flagged as passenger track in NTAD (TEXRail, the Silver
# Line, the SPRINTER, the Polar Bear Express's line to Moosonee, UP
# Express's spur), and a reporting mark can stand for more than one railroad (DART's
# track carries the TRE, the A-train and the Silver Line). Each railroad's
# timetable has the shapes its trains follow: track that runs along a shape
# is that railroad's, and NTAD track along a shape that isn't drawn yet is
# added. Shapes are a point every 100-200 m (Ontario Northland's about every
# kilometer), so "along" allows for the chords they cut across curves.
SHAPE_ROUTES = {
    # network: (GTFS url, keep route(route row), meters from the shape that still count as along it)
    "coaster": ("https://lfportal.nctd.org/staticGTFS/google_transit.zip", lambda r: r["route_long_name"] == "COASTER", 80),
    "sprinter": ("https://lfportal.nctd.org/staticGTFS/google_transit.zip", lambda r: r["route_long_name"] == "SPRINTER", 80),
    "atrain": ("https://gtfs.remix.com/dcta_denton_tx_us.zip", lambda r: r["route_long_name"] == "A-train", 80),
    "tre": ("https://www.dart.org/transitdata/latest/google_transit.zip", lambda r: r["route_short_name"] == "TRE", 80),
    "silverline": ("https://www.dart.org/transitdata/latest/google_transit.zip", lambda r: r["route_short_name"] == "SILVER", 80),
    "texrail": ("https://gtfsdata.ridetm.org/gtfs/fwtatransitdata.zip", lambda r: r["route_short_name"] == "TEXRail", 80),
    "star": ("https://www.wegotransit.com/googleexport/google_transit.zip", lambda r: r["route_id"] == "90", 80),
    "upx": ("https://assets.metrolinx.com/raw/upload/Documents/Metrolinx/Open%20Data/UP-GTFS.zip", lambda r: True, 80),
    # Ontario Northland files every route as a bus; its train is the Polar Bear Express (Cochrane-Moosonee).
    # The feed already has the Northlander's proposed trips, but it is not carrying passengers yet
    # (October 2026): add r["route_long_name"].startswith("Northlander") back when it is.
    "ontarionorthland": ("https://ontarionorthland.tmix.se/gtfs/gtfs.zip",
                         lambda r: "Moosonee" in r["route_long_name"], 250),
}


def route_shapes(url, keep):
    import csv, io, zipfile
    req = urllib.request.Request(url, headers={"User-Agent": "trainsheet-build"})
    zf = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(req, timeout=240).read()))
    rows = lambda n: ({k.strip(): (v or "").strip() for k, v in r.items() if k} for r in csv.DictReader(io.TextIOWrapper(zf.open(n), "utf-8-sig")))
    routes = {r["route_id"] for r in rows("routes.txt") if keep(r)}
    ids = {t["shape_id"] for t in rows("trips.txt") if t["route_id"] in routes and t.get("shape_id")}
    pts = defaultdict(list)
    for r in rows("shapes.txt"):
        if r["shape_id"] in ids:
            pts[r["shape_id"]].append((int(r["shape_pt_sequence"]), float(r["shape_pt_lon"]), float(r["shape_pt_lat"])))
    return [[(x, y) for _, x, y in sorted(v)] for v in pts.values()]


def query_box(bbox):
    """Every main-line, siding and lead segment of NTAD in (west, south, east, north)."""
    out, offset = [], 0
    while True:
        params = {"where": "NET IN ('M', 'I', 'S')", "geometry": ",".join(map(str, bbox)), "geometryType": "esriGeometryEnvelope",
                  "inSR": "4326", "spatialRel": "esriSpatialRelIntersects", "outFields": "PASSNGR", "maxAllowableOffset": "0.0003",
                  "geometryPrecision": "4", "resultOffset": offset, "resultRecordCount": 2000, "orderByFields": "OBJECTID", "f": "geojson"}
        with urllib.request.urlopen(f"{URL}?{urllib.parse.urlencode(params)}", timeout=180) as r:
            page = json.load(r)["features"]
        out += [f for f in page if f.get("geometry")]
        offset += len(page)
        if len(page) < 2000:
            return out


def apply_shapes(segs):
    for net, (url, keep, tol) in SHAPE_ROUTES.items():
        try:
            shapes = route_shapes(url, keep)
        except Exception as err:
            print(f"  {net}: shapes unavailable ({err})")
            continue
        if not shapes:
            continue
        guide = Coverage([((net,), densify(sh, 50)) for sh in shapes])
        along = lambda line: sum(1 for q in line if guide.nearest(q, tol)) / len(line)
        # Track already drawn: this railroad's too where it runs along the shape.
        retagged = 0
        for k, (nets, line) in enumerate(segs):
            pts = densify(line, 100)
            f = along(pts)
            if f >= 0.7 and net not in nets:
                keep_nets = [n for n in nets if n != "commuter"][:2]  # up to three, this one included
                nets = tuple(keep_nets + [net])
                retagged += 1
            segs[k] = (tuple(sorted(nets, key=lambda n: (ORDER.index(n) if n in ORDER else len(ORDER), n))), line)
        # NTAD track along the shape that isn't drawn yet.
        drawn = Coverage(segs)
        xs = [x for sh in shapes for x, _ in sh]
        ys = [y for sh in shapes for _, y in sh]
        added = 0
        for f in query_box((min(xs) - 0.02, min(ys) - 0.02, max(xs) + 0.02, max(ys) + 0.02)):
            for line in parts(f["geometry"]):
                if len(line) < 2:
                    continue
                pts = densify(line, 100)
                if along(pts) >= 0.8 and sum(1 for q in pts if drawn.nearest(q, 20)) / len(pts) < 0.5:
                    segs.append(((net,), line))
                    added += 1
        print(f"  {net}: {retagged} segments retagged, {added} added along its route shapes")


# ---------- Heal near-miss dead ends ----------
# Track pieces whose end stops a few meters short of another line (common
# where OSM station tracks meet NTAD, and in places within NTAD) would leave
# the routing graph disconnected. Join each dead end to the nearest other
# line within HEAL_M.
HEAL_M = 60
HEAL_SAME_M = 250  # when the nearby line is the same railroad (VIA's Thompson branch)


def heal_dead_ends(segs):
    key = lambda pt: (round(pt[0], 4), round(pt[1], 4))  # same node rounding as the merge step
    degree = defaultdict(int)
    for _n, c in segs:
        degree[key(c[0])] += 1
        degree[key(c[-1])] += 1
    cov = Coverage(segs)
    cuts, healed = [], 0
    for k in range(len(segs)):
        nets, c = segs[k]
        for end in (0, -1):
            if degree[key(c[end])] != 1:
                continue
            hit = cov.nearest(tuple(c[end]), HEAL_M, exclude=k)
            if not hit:
                # A bit farther is fine when it's the same railroad's track
                # (the nearest such, even if another railroad's is closer).
                hit = cov.nearest(tuple(c[end]), HEAL_SAME_M, exclude=k, keep=lambda j: bool(set(segs[j][0]) & set(nets)))
            if hit and hit[0] > 0.5:
                _d, k2, i, t, q = hit
                c[end] = list(q)
                degree[key(q)] += 2
                cuts.append((k2, i, t, q))
                healed += 1
    split_segments(segs, cuts)
    print(f"joined {healed} dead ends to nearby track")


# ---------- Bridge small breaks ----------
# Pieces of one line can still stop short of each other by a few hundred
# meters (OSM ways that don't quite meet along a new corridor). Join two dead
# ends of the same railroad up to BRIDGE_M apart when they face each other:
# each points toward the other along its own line, so unrelated stubs that
# merely sit near each other are left alone.
BRIDGE_M = 1000
FACING_DEG = 35


def bridge_breaks(segs):
    key = lambda pt: (round(pt[0], 4), round(pt[1], 4))
    degree = defaultdict(int)
    for _n, c in segs:
        degree[key(c[0])] += 1
        degree[key(c[-1])] += 1

    def heading(a, b):
        return math.degrees(math.atan2((b[1] - a[1]) * 110540, (b[0] - a[0]) * 111320 * math.cos(math.radians(a[1]))))

    def turn(a, b):
        return abs((a - b + 180) % 360 - 180)

    ends = []  # (point, outward heading, nets)
    for nets, c in segs:
        if len(c) < 2:
            continue
        for tip, back in ((c[0], c[1]), (c[-1], c[-2])):
            if degree[key(tip)] == 1:
                ends.append((tuple(tip), heading(back, tip), set(nets)))
    grid = defaultdict(list)
    for i, (p, _h, _n) in enumerate(ends):
        grid[(int(p[0] * 50), int(p[1] * 50))].append(i)
    used, bridges = set(), []
    for i, (p, h, nets) in enumerate(ends):
        if i in used:
            continue
        best = None
        gx, gy = int(p[0] * 50), int(p[1] * 50)
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for j in grid.get((gx + dx, gy + dy), ()):
                    q, hq, nq = ends[j]
                    if j == i or j in used or not (nets & nq):
                        continue
                    d = meters(p, q)
                    if not 0 < d <= BRIDGE_M:
                        continue
                    toward = heading(p, q)
                    if turn(toward, h) <= FACING_DEG and turn(toward + 180, hq) <= FACING_DEG and (best is None or d < best[0]):
                        best = (d, j)
        if best:
            j = best[1]
            used.update((i, j))
            bridges.append(((tuple(sorted(nets & ends[j][2])),), [list(p), list(ends[j][0])]))
    for (nets,), line in bridges:
        segs.append((order(nets), line))
    print(f"bridged {len(bridges)} small breaks")


def order(nets):
    return tuple(sorted(set(nets), key=lambda n: (ORDER.index(n) if n in ORDER else len(ORDER), n)))[:3]


# ---------- Collapse parallel tracks ----------
# NTAD (and OSM) sometimes map a corridor's two main tracks as separate lines a
# few dozen meters apart (Providence, many stations), which draws the route
# twice. Walking from the longest track down, any stretch that runs mostly
# alongside track already drawn is marked hidden: it isn't drawn and trains
# don't snap to it, but it stays in the data so the routing graph keeps every
# connection. Its railroads are folded into the drawn line's colors.
PARALLEL_M = 120
MIN_PARALLEL_LEN_M = 150


def collapse_parallel(segs):
    """Returns the set of segment indexes to hide; folds their networks into
    the drawn segments they run alongside."""
    lengths = [sum(meters(a, b) for a, b in zip(c, c[1:])) for _n, c in segs]
    drawn = []          # (nets, line) of drawn segments, in Coverage order
    drawn_idx = []      # their indexes in segs
    cum_cache = {}
    cov = Coverage(drawn)
    hidden = set()

    def along(k, i, t):
        if k not in cum_cache:
            c = drawn[k][1]
            cum = [0.0]
            for p, q in zip(c, c[1:]):
                cum.append(cum[-1] + meters(p, q))
            cum_cache[k] = cum
        cum = cum_cache[k]
        return cum[i] + (cum[i + 1] - cum[i]) * t

    for idx in sorted(range(len(segs)), key=lambda i: -lengths[i]):
        nets, line = segs[idx]
        if lengths[idx] >= MIN_PARALLEL_LEN_M:
            pts = densify([tuple(p) for p in line], step=25)
            hits = [cov.nearest(p, PARALLEL_M) for p in pts]
            if all(hits):
                # A true duplicate runs alongside one drawn line for (nearly)
                # its whole length. A link between the ends of two different
                # lines is also "near" track everywhere, but hiding it would
                # leave a hole.
                owners = defaultdict(list)
                for h in hits:
                    owners[h[1]].append(along(h[1], h[2], h[3]))
                k, spots = max(owners.items(), key=lambda kv: len(kv[1]))
                if len(spots) >= 0.95 * len(hits) and max(spots) - min(spots) >= 0.7 * lengths[idx]:
                    drawn[k] = (order(drawn[k][0] + tuple(nets)), drawn[k][1])
                    segs[drawn_idx[k]] = drawn[k]
                    hidden.add(idx)
                    continue
        drawn.append((nets, line))
        drawn_idx.append(idx)
        cov.add(len(drawn) - 1)
    print(f"hid {len(hidden)} parallel stretches")
    return hidden


def key(pt):
    return (round(pt[0], 4), round(pt[1], 4))


# A hidden stretch still carries trains through the routing graph, but trains
# snap onto the drawn line beside it. Where the two don't share a junction
# (Metra Electric beside the Amtrak line into Chicago), the drawn line would
# lead nowhere, so tie each end of a hidden stretch to the drawn track
# alongside with a short routing-only link, even where the end also meets
# its own railroad's drawn track (that track doesn't reach the line beside).
def tie_hidden_ends(segs, hidden):
    drawn_idx = [k for k in range(len(segs)) if k not in hidden]
    touching = defaultdict(set)  # node -> drawn pieces (Coverage indexes) ending there
    for j, k in enumerate(drawn_idx):
        c = segs[k][1]
        touching[key(c[0])].add(j)
        touching[key(c[-1])].add(j)
    cov = Coverage([segs[k] for k in drawn_idx])
    cuts, links, done = [], [], set()
    for k in sorted(hidden):
        nets, c = segs[k]
        for end in (c[0], c[-1]):
            if key(end) in done:
                continue
            hit = cov.nearest(tuple(end), PARALLEL_M, exclude=touching.get(key(end), set()))
            # Only the line it runs alongside (which took on its railroads when
            # it was hidden), not some other line crossing nearby.
            if not hit or hit[0] < 1.0 or not set(segs[drawn_idx[hit[1]]][0]) & set(nets):
                continue
            _d, j, i, t, q = hit
            done.add(key(end))
            cuts.append((drawn_idx[j], i, t, q))
            if key(q) != key(end):
                links.append((nets, [list(end), list(q)]))
    split_segments(segs, cuts)
    for link in links:
        segs.append(link)
        hidden.add(len(segs) - 1)
    print(f"tied {len(done)} ends of hidden stretches to the drawn track")


# Two drawn lines of a railroad can share a corridor for miles and then split
# (the Cardinal's and the Lynchburg trains' routes, Orange to Charlottesville),
# each drawn whole, meeting only where the corridor starts. A train at the
# split sits on one of them and would have to go back to that start to reach
# the other. Add a junction wherever two such lines stop running together.
SHARED_M = 40      # lines this close are running together
SPLIT_STEP_M = 250
SHARED_RUN = 3     # for at least this many steps (not just crossing)


def join_splits(segs, hidden):
    drawn_idx = [k for k in range(len(segs)) if k not in hidden]
    cov = Coverage([segs[k] for k in drawn_idx])
    ends = defaultdict(set)
    for j, k in enumerate(drawn_idx):
        c = segs[k][1]
        ends[key(c[0])].add(j)
        ends[key(c[-1])].add(j)
    cuts, links, made = [], [], []
    for j, k in enumerate(drawn_idx):
        nets, c = segs[k]
        same = lambda x: x != j and bool(set(segs[drawn_idx[x]][0]) & set(nets))
        # Samples along the line, with where each lies on it.
        samples = []
        for i, (a, b) in enumerate(zip(c, c[1:])):
            n = max(1, int(meters(a, b) // SPLIT_STEP_M))
            for m in range(n):
                t = m / n
                samples.append(((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t), i, t))
        prev, run = None, 0
        for p, i, t in samples:
            hit = cov.nearest(p, SHARED_M, keep=same)
            other = hit[1] if hit else None
            if prev and prev[3] is not None and prev[3] != other and run >= SHARED_RUN:
                # Leaving the line we were running beside: join them here,
                # unless they already meet nearby.
                pp, pi, pt, pj, ph = prev
                near_existing = any(pj in ends[e] and j in ends[e] and meters(pp, e) < 2000 for e in ends)
                if not near_existing and all(meters(pp, m) > 2000 for m in made):
                    _d, _j, si, st, q = ph
                    here = (round(pp[0], 5), round(pp[1], 5))
                    cuts.append((k, pi, pt, here))
                    cuts.append((drawn_idx[pj], si, st, q))
                    if key(here) != key(q):
                        links.append((order(tuple(nets)), [list(here), list(q)]))
                    made.append(pp)
            run = run + 1 if prev and other is not None and other == prev[3] else (1 if other is not None else 0)
            prev = (p, i, t, other, hit)
    split_segments(segs, cuts)
    for link in links:
        segs.append(link)
        hidden.add(len(segs) - 1)
    print(f"joined {len(made)} places where lines sharing a corridor split")


# Where two of a railroad's lines both pass one of its stations, its trains
# change between them there (Charlottesville: the Lynchburg line and the
# Cardinal's cross at the station, meeting otherwise only 50 km away). Join
# them at the station unless they already meet nearby.
AT_STATION_M = 150


def join_at_stations(segs, hidden):
    drawn_idx = [k for k in range(len(segs)) if k not in hidden]
    cov = Coverage([segs[k] for k in drawn_idx])
    ends = defaultdict(set)
    for j, k in enumerate(drawn_idx):
        c = segs[k][1]
        ends[key(c[0])].add(j)
        ends[key(c[-1])].add(j)
    cuts, links, joined = [], [], 0
    for agency, rows in stations.items():
        for _id, _name, lat, lon, *_ in rows:
            p = (lon, lat)
            hits, seen = [], set()
            while len(hits) < 4:
                hit = cov.nearest(p, AT_STATION_M, exclude=seen, keep=lambda j: agency in segs[drawn_idx[j]][0])
                if not hit:
                    break
                seen.add(hit[1])
                hits.append(hit)
            for x in range(len(hits)):
                for y in range(x + 1, len(hits)):
                    hx, hy = hits[x], hits[y]
                    jx, jy = hx[1], hy[1]
                    if any(jx in ends[e] and jy in ends[e] and meters(p, e) < 1000 for e in ends if abs(e[1] - lat) < 0.02):
                        continue
                    cuts.append((drawn_idx[jx], hx[2], hx[3], hx[4]))
                    cuts.append((drawn_idx[jy], hy[2], hy[3], hy[4]))
                    if key(hx[4]) != key(hy[4]):
                        links.append(((agency,), [list(hx[4]), list(hy[4])]))
                    joined += 1
    split_segments(segs, cuts)
    for link in links:
        segs.append(link)
        hidden.add(len(segs) - 1)
    print(f"joined {joined} pairs of lines at stations they both pass")


# Chain segments that meet end to end (at nodes where exactly two segments
# with the same networks meet) into long lines, so the map's simplification
# at low zoom doesn't break the network into dashes.


def merge(lines, degree):
    # Only chain through a node where exactly two pieces of track meet across
    # the whole network; anywhere more meet is a junction (say, where a
    # Metro-North-only branch leaves the shared main line), and the line must
    # break there so the routing graph connects the two.
    ends = defaultdict(list)
    for i, p in enumerate(lines):
        ends[key(p[0])].append(i)
        ends[key(p[-1])].append(i)
    used = [False] * len(lines)

    def extend(chain):
        while True:
            tail = key(chain[-1])
            nxt = [j for j in ends[tail] if not used[j]]
            if degree[tail] != 2 or len(ends[tail]) != 2 or not nxt:
                return chain
            j = nxt[0]
            used[j] = True
            p = lines[j]
            chain += (p if key(p[0]) == tail else p[::-1])[1:]

    out = []
    for i, p in enumerate(lines):
        if not used[i]:
            used[i] = True
            out.append(extend(extend(list(p))[::-1]))
    return out


def oriented(chain):
    # Draw every line west->east (or south->north if it runs mostly north-south)
    # so side-by-side colors keep the same order where chains meet.
    dx, dy = chain[-1][0] - chain[0][0], chain[-1][1] - chain[0][1]
    flip = dx < 0 if abs(dx) >= abs(dy) * 0.75 else dy < 0
    return chain[::-1] if flip else chain


def finish(segments):
    """Heal, bridge, collapse and join the track, then chain it into features."""
    heal_dead_ends(segments)
    bridge_breaks(segments)
    hidden = collapse_parallel(segments)
    tie_hidden_ends(segments, hidden)
    join_splits(segments, hidden)
    join_at_stations(segments, hidden)

    by_nets = defaultdict(list)
    for i, (nets, line) in enumerate(segments):
        by_nets[(nets, i in hidden)].append(line)

    degree = defaultdict(int)
    for _nets, line in segments:
        degree[key(line[0])] += 1
        degree[key(line[-1])] += 1

    features = []
    for (nets, is_hidden), lines in by_nets.items():
        for chain in merge(lines, degree):
            props = {"n": len(nets)}
            if is_hidden:
                props["h"] = 1  # routing only, not drawn
            props.update({k: v for k, v in zip("abc", nets)})
            features.append({"type": "Feature", "properties": props,
                             "geometry": {"type": "LineString", "coordinates": oriented(chain)}})

    counts = defaultdict(int)
    for nets, _ in segments:
        for n in nets:
            counts[n] += 1
    print("segments per network:", dict(sorted(counts.items(), key=lambda x: -x[1])))
    return features


# ---------- Track outside North America ----------
# A railroad plug-in's RAIL (scripts/railroads/<id>.py):
#   {"region": "fi", "bbox": [west, south, east, north], "network": "<agency id>",
#    "relations": {"operator": "<regex>", "network": "<regex>"}  (route=train relations matching any)
#    or "query": "<Overpass QL selecting ways; {bbox} is the box as south,west,north,east>"}
# With neither, the box's main and branch lines (no sidings, yards or spurs).
# Ways are cut where they meet (OSM joins track at shared nodes, often in the
# middle of a way), chained, thinned the way NTAD serves its lines (0.0003°,
# four decimals) and tagged with the network. Each railroad's pieces are kept
# in data/rail/src/<id>.json, and a region is built from all of its
# railroads' pieces by the passes above, as North America is: so rebuilding
# one railroad gives the region exactly what a full build would, and a
# railroad whose track can't be fetched keeps what it had.
REGIONS = ROOT / "data" / "rail"
REGION_TOLERANCE = 0.0003
DEFAULT_WAYS = 'way["railway"="rail"]["usage"~"^(main|branch)$"][!"service"]({bbox});'


def plugins():
    sys.path.insert(0, str(ROOT / "scripts"))
    from railroads import load
    return [m for m in load() if getattr(m, "RAIL", None)]


def plugin_id(mod):
    return mod.__name__.rsplit(".", 1)[-1]


def rail_box(rail):
    w, s, e, n = rail["bbox"]
    return f"{s},{w},{n},{e}"


def rail_query(rail):
    box = rail_box(rail)
    if rail.get("relations"):
        body = ("(" + "".join(f'relation["route"="train"]["{tag}"~"{value}",i]({box});'
                              for tag, value in sorted(rail["relations"].items()))
                + f');\nway(r)["railway"="rail"]({box});')
    else:
        body = "(" + rail.get("query", DEFAULT_WAYS).replace("{bbox}", box) + ");\nway._;"
    return f"[out:json][timeout:600][maxsize:1073741824];\n{body}\nout geom;"


def cut_at_junctions(elements):
    """Each way split at the nodes it shares with other ways, as one-way
    elements that chains() joins back up through plain two-way nodes."""
    ways = [[(round(g["lon"], 5), round(g["lat"], 5)) for g in w.get("geometry", [])]
            for w in elements if w.get("type") == "way"]
    uses = defaultdict(int)
    for w in ways:
        for p in set(w):
            uses[p] += 1
    out = []
    for w in ways:
        piece = w[:1]
        for p in w[1:]:
            piece.append(p)
            if uses[p] > 1:
                out.append(piece)
                piece = [p]
        out.append(piece)
    return [{"geometry": [{"lon": x, "lat": y} for x, y in piece]} for piece in out if len(piece) >= 2]


def simplify(line, tol=REGION_TOLERANCE):
    """Douglas-Peucker in degrees, as NTAD serves its lines; ends kept."""
    keep = {0, len(line) - 1}
    stack = [(0, len(line) - 1)]
    while stack:
        i, j = stack.pop()
        (ax, ay), (bx, by) = line[i], line[j]
        L = math.hypot(bx - ax, by - ay)
        best, far = tol, None
        for k in range(i + 1, j):
            px, py = line[k]
            d = abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / L if L else math.hypot(px - ax, py - ay)
            if d > best:
                best, far = d, k
        if far is not None:
            keep.add(far)
            stack += [(i, far), (far, j)]
    return [line[k] for k in sorted(keep)]


def osm_track(mod):
    """A plug-in's pieces of track from OpenStreetMap, or None if it's unavailable."""
    q = rail_query(mod.RAIL)
    elements = overpass(q, f"rail-{plugin_id(mod)}-{hashlib.sha1(q.encode()).hexdigest()[:8]}", box=rail_box(mod.RAIL))
    if elements is None:
        return None
    lines = []
    for line in chains(cut_at_junctions(elements)):
        pts = []
        for x, y in line:
            p = [round(x, 4), round(y, 4)]
            if not pts or p != pts[-1]:
                pts.append(p)
        if len(pts) >= 2:
            lines.append(simplify(pts))
    return lines


def plugin_track(mod, fetch):
    """The plug-in's segments: fetched (and kept in its file) when asked,
    else (or when OpenStreetMap is unavailable) the ones in its file."""
    rid, net = plugin_id(mod), mod.RAIL["network"]
    path = REGIONS / "src" / f"{rid}.json"
    lines = osm_track(mod) if fetch else None
    if lines is not None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("[\n" + ",\n".join(json.dumps(c, separators=(",", ":")) for c in lines) + "\n]\n")
        print(f"  {rid}: {len(lines)} pieces of track from OpenStreetMap")
    elif path.exists():
        lines = json.loads(path.read_text())
        print(f"  {rid}: {len(lines)} pieces of track on file" + (" (OpenStreetMap unavailable)" if fetch else ""))
    else:
        print(f"  {rid}: skipped, " + ("OpenStreetMap unavailable and " if fetch else "") + "no track on file")
        return []
    return [((net,), c) for c in lines]


def write_region(region, features):
    path = REGIONS / f"{region}.geojson"
    path.write_text(json.dumps({"type": "FeatureCollection", "features": features}, separators=(",", ":")))
    # The track's extent, rounded outward: the page loads the file once the map shows part of it.
    xs = [x for f in features for x, _ in f["geometry"]["coordinates"]]
    ys = [y for f in features for _, y in f["geometry"]["coordinates"]]
    bbox = [math.floor(min(xs) * 100) / 100, math.floor(min(ys) * 100) / 100,
            math.ceil(max(xs) * 100) / 100, math.ceil(max(ys) * 100) / 100]
    index_path = REGIONS / "index.json"
    index = [r for r in (json.loads(index_path.read_text()) if index_path.exists() else []) if r["region"] != region]
    index.append({"region": region, "bbox": bbox, "file": f"data/rail/{region}.geojson", "bytes": path.stat().st_size})
    index_path.write_text("[\n" + ",\n".join(json.dumps(r) for r in sorted(index, key=lambda r: r["region"])) + "\n]\n")
    print(f"wrote {path} ({path.stat().st_size // 1024} KB, {len(features)} lines)")


# ---------- Track abroad, from the railroads' timetables ----------
# A plug-in's own query misses track: route relations aren't mapped for every
# line (a third of Spain's stations), stretches of a line often lack a usage
# tag (so "main or branch" leaves it in pieces), metre-gauge lines are
# railway=narrow_gauge, and trains run on into countries with no plug-in.
# So each pair of stops its trains call at one after the other is routed along
# OpenStreetMap's mainline track (any usage but industrial, military, tourist
# or test, no sidings or yards), fetched in one-degree tiles along the pairs;
# a route's stretches not drawn yet are added, and every piece of track takes
# the railroads whose routes run along it (as North America's track takes the
# railroads whose route shapes it follows), intercity ones first, at most three.
ROUTE_TILE = 1.0          # degrees, the tiles candidate track is fetched in
ROUTE_SNAP_M = 1500       # a stop this close to track is on it
ROUTE_DETOUR = 2.5        # a route may be this many times the straight distance (plus 5 km)
ROUTE_MAX_KM = 400        # longer hops between stops aren't routed
ROUTE_ALONG_M = 60        # track this close to a railroad's routes is on them
ROUTE_WAYS = ('way["railway"~"^(rail|narrow_gauge)$"][!"service"]'
              '["usage"!~"^(industrial|military|tourism|test)$"]({bbox});')


ROUTE_ABROAD = 0.5         # degrees past a plug-in's box that its hops are still routed


def timetable_pairs(mods):
    """{agency: {(stop, stop)}}: the consecutive stops of every trip in the
    railroads' timetables (data/schedules/<agency>.json), as (lon, lat): the
    hops with a stop in or near the plug-in's box, so a train running on
    abroad gets its track over the border but not all the way to Kiel."""
    out = {}
    for m in mods:
        w, s_, e, n = m.RAIL["bbox"]
        near = lambda p: w - ROUTE_ABROAD <= p[0] <= e + ROUTE_ABROAD and s_ - ROUTE_ABROAD <= p[1] <= n + ROUTE_ABROAD
        for agency in m.AGENCIES:
            path = ROOT / "data" / "schedules" / f"{agency}.json"
            if not path.exists():
                continue
            tt = json.loads(path.read_text())
            at = {k: (round(v[2], 5), round(v[1], 5)) for k, v in tt["stops"].items()}
            pairs = set()
            for runs in tt["trips"].values():
                for run in runs:
                    seq = [at[s[0]] for s in run[2] if s[0] in at]
                    for a, b in zip(seq, seq[1:]):
                        if a != b and meters(a, b) <= ROUTE_MAX_KM * 1000 and (near(a) or near(b)):
                            pairs.add((a, b) if a < b else (b, a))
            out[agency] = pairs
    return out


def route_tiles(pairs):
    """The tiles a straight line between each pair of stops passes through,
    with the next tile over where it runs within a quarter tile of the edge."""
    tiles = set()
    for a, b in pairs:
        n = max(1, int(meters(a, b) / 10000))
        for i in range(n + 1):
            x, y = a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n
            tx, ty = math.floor(x / ROUTE_TILE), math.floor(y / ROUTE_TILE)
            fx, fy = x / ROUTE_TILE - tx, y / ROUTE_TILE - ty
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    if (dx == -1 and fx > 0.25) or (dx == 1 and fx < 0.75) or (dy == -1 and fy > 0.25) or (dy == 1 and fy < 0.75):
                        continue
                    tiles.add((tx + dx, ty + dy))
    return sorted(tiles)


# OSM_ROUTE_FETCH=0: use only the tiles already fetched (scripts/.osm-cache),
# routing the other hops over the railroads' own track alone.
# --offline does the same for the plug-ins' own track (data/rail/src) and
# builds the regions only, without North America.
OFFLINE = "--offline" in sys.argv
# (OSM_ROUTE_FETCH=1 with --offline fetches the route tiles still missing.)
ROUTE_FETCH = os.environ.get("OSM_ROUTE_FETCH", "0" if OFFLINE else "1") != "0"


def candidate_track(tiles):
    """OpenStreetMap's mainline track in those tiles, as lists of (lon, lat), or None
    if a tile can't be fetched."""
    ways = {}
    skipped = 0
    for tx, ty in tiles:
        w, s = tx * ROUTE_TILE, ty * ROUTE_TILE
        box = f"{s},{w},{s + ROUTE_TILE},{w + ROUTE_TILE}"
        q = f"[out:json][timeout:600][maxsize:1073741824];\n({ROUTE_WAYS.replace('{bbox}', box)});\nout geom;"
        if not ROUTE_FETCH and not (OSM_CACHE / f"route-tile-{tx}-{ty}.json").exists():
            skipped += 1
            continue
        elements = overpass(q, f"route-tile-{tx}-{ty}", box=box)
        if elements is None:
            print(f"  tile {tx},{ty}: OpenStreetMap unavailable")
            return None
        for e in elements:
            if e.get("type") == "way" and e.get("geometry"):
                # Four decimals, as the plug-ins' own track is kept, so the two join up.
                ways[e["id"]] = [(round(g["lon"], 4), round(g["lat"], 4)) for g in e["geometry"]]
    if skipped:
        print(f"  {skipped} of {len(tiles)} tiles not fetched yet (OSM_ROUTE_FETCH=0)")
    return list(ways.values())


class RailGraph:
    """Track as a graph of OSM nodes, for routing between stops."""
    CELL = 0.01

    def __init__(self, ways):
        self.adj = defaultdict(list)
        for w in ways:
            for a, b in zip(w, w[1:]):
                if a != b:
                    d = meters(a, b)
                    self.adj[a].append((b, d))
                    self.adj[b].append((a, d))
        self.grid = defaultdict(list)
        for n in self.adj:
            self.grid[(int(n[0] // self.CELL), int(n[1] // self.CELL))].append(n)

    def snap(self, p):
        best, bd = None, ROUTE_SNAP_M
        gx, gy = int(p[0] // self.CELL), int(p[1] // self.CELL)
        r = int(ROUTE_SNAP_M / 700) + 1
        for dx in range(-r, r + 1):
            for dy in range(-r, r + 1):
                for n in self.grid.get((gx + dx, gy + dy), ()):
                    d = meters(p, n)
                    if d < bd:
                        best, bd = n, d
        return best

    def route(self, a, b):
        """The nodes from the track nearest a to the track nearest b (A*), or None."""
        import heapq
        s, t = self.snap(a), self.snap(b)
        if not s or not t:
            return None
        limit = ROUTE_DETOUR * meters(a, b) + 5000
        best = {s: 0.0}
        prev = {}
        heap = [(meters(s, t), 0.0, s)]
        while heap:
            _f, g, n = heapq.heappop(heap)
            if n == t:
                path = [n]
                while n in prev:
                    n = prev[n]
                    path.append(n)
                return path[::-1]
            if g > best.get(n, math.inf):
                continue
            for m, d in self.adj[n]:
                ng = g + d
                if ng < best.get(m, math.inf) and ng + meters(m, t) <= limit:
                    best[m] = ng
                    prev[m] = n
                    heapq.heappush(heap, (ng + meters(m, t), ng, m))
        return None


def route_timetables(segments, mods):
    """Adds the stretches of the railroads' routes between stops not drawn yet,
    and tags each piece of track with the railroads whose routes run along it."""
    pairs = timetable_pairs(mods)
    every = set().union(*pairs.values()) if pairs else set()
    if not every:
        return
    # Over the railroads' own track first; OpenStreetMap's other track is
    # fetched only along the hops that can't be routed on it.
    own = [tuple(map(tuple, c)) for _n, c in segments]
    graph = RailGraph(own)
    routed, paths = {pair: graph.route(*pair) for pair in sorted(every)}, defaultdict(list)
    missing = [p for p in sorted(every) if not routed[p]]
    tiles = route_tiles(missing)
    print(f"  {len(every) - len(missing)} of {len(every)} hops routed on the railroads' own track; "
          f"the other {len(missing)} over {len(tiles)} tiles of OpenStreetMap track")
    ways = candidate_track(tiles) if missing else []
    if ways is None:
        print("  those skipped, OpenStreetMap unavailable (the railroads' own track stays)")
        ways = []
    if ways:
        graph = RailGraph(own + ways)
        for pair in missing:
            routed[pair] = graph.route(*pair)
    for agency, ps in pairs.items():
        got = [routed[p] for p in ps if routed[p] and len(routed[p]) > 1]
        paths[agency] = got
        print(f"  {agency}: {len(got)} of {len(ps)} hops routed")
    kind = {a: m.AGENCIES[a].get("kind") for m in mods for a in m.AGENCIES}
    rank = lambda n: (0 if kind.get(n) == "intercity" else 1, n)
    # Stretches nobody has drawn: each railroad's, as it first needs them.
    for agency in sorted(paths, key=rank):
        elements = [{"geometry": [{"lon": x, "lat": y} for x, y in p]} for p in paths[agency]]
        before = len(segments)
        added = add_uncovered(segments, agency, elements)
        for k in range(before, len(segments)):
            nets, line = segments[k]
            pts = []
            for x, y in line:
                q = [round(x, 4), round(y, 4)]
                if not pts or q != pts[-1]:
                    pts.append(q)
            segments[k] = (nets, simplify(pts) if len(pts) >= 2 else pts)
        print(f"  {agency}: +{added / 1000:.0f} km along its routes")
    segments[:] = [(n, c) for n, c in segments if len(c) >= 2]
    # Every piece of track: the railroads whose routes run along it.
    guides = {a: Coverage([((a,), densify(p, 50)) for p in ps]) for a, ps in paths.items() if ps}
    retagged = 0
    for k, (nets, line) in enumerate(segments):
        pts = densify(line, 100)
        users = [a for a, g in guides.items() if sum(1 for q in pts if g.nearest(q, ROUTE_ALONG_M)) >= 0.7 * len(pts)]
        if users:
            new = tuple(sorted(users, key=rank)[:3])
            if new != nets:
                retagged += 1
            segments[k] = (new, line)
    shared = sum(1 for n, _ in segments if len(n) > 1)
    print(f"  {retagged} pieces retagged, {shared} shared by more than one railroad")


def build_regions(only=None):
    """Each region's track from its railroads' plug-ins; with only, just that
    railroad's region, the others in it taken from their files."""
    mods = plugins()
    regions = sorted({m.RAIL["region"] for m in mods if not only or plugin_id(m) == only})
    if only and not regions:
        sys.exit(f"no railroad plug-in {only} with RAIL in scripts/railroads/")
    for region in regions:
        print(f"track in region {region}")
        segments = []
        here = [m for m in mods if m.RAIL["region"] == region]
        for m in here:
            segments += plugin_track(m, fetch=not OFFLINE and (not only or plugin_id(m) == only))
        if segments:
            route_timetables(segments, here)
            write_region(region, finish(segments))


only = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None
if not only and not OFFLINE:
    segments = north_america()
    print("railroads' route shapes")
    apply_shapes(segments)
    print("filling gaps from OpenStreetMap")
    fill_gaps(segments)
    features = finish(segments)
    path = ROOT / "data" / "rail.geojson"
    path.write_text(json.dumps({"type": "FeatureCollection", "features": features}, separators=(",", ":")))
    print(f"wrote {path} ({path.stat().st_size // 1024} KB, {len(features)} lines from {len(segments)} segments)")
build_regions(only)
