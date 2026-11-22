"""Croatia: HŽ Putnički prijevoz (HŽPP), the whole national network, from
HŽPP's own GTFS (hzpp.hr/GTFS_files.zip: official, published by HŽ Putnički
prijevoz, no key, regenerated daily). It is a rail-only feed bar five
rail-replacement bus routes (route type 3, Bubnjarci–Duga Resa/Karlovac and
Rijeka–Lupoglav), which the build leaves out ("convert", below). No live
feed is read: the trains are placed from the timetable (a "timetable"
source, no parser file), marked estimated. The feed is downloaded fresh at
each build; its calendar runs 2025-12-08 → 2026-12-13 (the 2025/2026
timetable, in force 14 Dec 2025 – 12 Dec 2026).

The feed is domestic only: every stop lies inside Croatia (lon 13.84–
19.15, lat 43.05–46.51). Its international trains are not in it — a
Zagreb–Budapest or Zagreb–Ljubljana train appears only as far as the
border station, if at all — so there is no cross-border clipping decision
to make; the network simply ends at the border. The five-digit numbers
(210xx, 944xx, 900xx) are ordinary domestic trains, not international
ones: 21002/21101 run Šapjane–Rijeka, 944xx Karlovac–Bubnjarci.

The feed's routes are grouped by terminus, not by corridor: route
"Vukovar - Split" (i-tr102) holds every train ending at Split — Kaštel
Stari, Perković and Zagreb departures among them — so a route's long name
is a nominal label, and a few long-distance trains carry another
corridor's name (IC 521 Zagreb–Split sits on the "Vukovar - Split"
route). Lines are therefore the route's two named ends, hub-first
("Zagreb Glavni kolodvor – Split"), in the Israel Rail / Elron manner;
the trains themselves — numbers, times, stops — are all the feed's own.

Stations: the feed has no parent stations and no two stops share a name,
so each stop is its own station, named as the feed names it ("Zagreb
Glavni kolodvor", "Split Predgrađe"); ids are ASCII slugs with Croatian
letters folded (č/ć→c, đ→d, š→s, ž→z). Train numbers are the feed's
trip_short_name, as printed ("520", "1820", "21002"). Times are
Croatia's (Europe/Zagreb)."""
import csv, io, re, unicodedata, zipfile

GTFS_URL = "https://www.hzpp.hr/GTFS_files.zip"
TZ = "Europe/Zagreb"
CREDIT = {"label": "Timetable from HŽ Putnički prijevoz (GTFS, hzpp.hr)", "href": "https://www.hzpp.hr/en/timetable"}
# Croatia, from Pula and Rijeka on the Adriatic to Osijek and Vukovar in
# the east, Varaždin and Čakovec in the north; every stop the feed's
# trains call at lies inside it.
BBOX = [13.5, 42.4, 19.5, 46.6]
COMMON = {"region": "Croatia", "country": "HR", "tz": TZ, "credit": CREDIT, "license": None, "bbox": BBOX,
          "clip": True}

AGENCIES = {
    "hzpp": {"name": "HŽ Putnički prijevoz", "short": "HŽPP", "color": "#d8232a", "kind": "intercity",
             "cars": "hzpp", **COMMON},
}
SOURCES = [{"id": "croatia", "agencies": list(AGENCIES), "format": "timetable", "interval": 60, "scope": "view"}]

# The feed's one agency, and its rail routes alone (route type 2; the five
# type-3 routes are its rail-replacement buses).
OPERATOR = "HŽ"
TRAIN_TYPES = {"2"}


def keep(agency):
    return lambda r: r["agency_id"] == OPERATOR and r["route_type"] in TRAIN_TYPES


HUB = "Zagreb Glavni kolodvor"


def line(r):
    """The route's two named ends, hub-first ("Zagreb Glavni kolodvor –
    Split"), else alphabetical, so both directions of a corridor share one
    line; the feed's own label when it will not split into two ends."""
    name = (r.get("route_long_name") or "").strip()
    ends = [e.strip() for e in name.split(" - ")]
    if len(ends) != 2 or not all(ends):
        return AGENCIES["hzpp"]["name"]
    if HUB in ends:
        ends.sort(key=lambda e: e != HUB)
    else:
        ends.sort()
    return " – ".join(ends)


# The train's number as HŽPP prints it ("520", "1820", "21002").
number = lambda t: (t.get("trip_short_name") or "").strip() or None


# ---------- Stations ----------
LETTERS = str.maketrans({"č": "c", "ć": "c", "đ": "d", "š": "s", "ž": "z"})


def station(name):
    """(station id, name): "Zagreb Glavni kolodvor" ->
    ("zagreb-glavni-kolodvor", "Zagreb Glavni kolodvor")."""
    name = name.strip()
    plain = unicodedata.normalize("NFKD", name.lower().translate(LETTERS)).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", plain).strip("-"), name


# ---------- The timetable, cut ----------
def _read(zf, name):
    with zf.open(name) as f:
        return list(csv.reader(io.TextIOWrapper(f, "utf-8-sig")))


def _write(rows):
    out = io.StringIO()
    csv.writer(out, lineterminator="\n").writerows(rows)
    return out.getvalue().encode()


def convert(data):
    """HŽPP's file as a GTFS of its trains alone (feeds.py's "convert", run
    once a build): the rail routes, their trips, stop times (the feed lists
    no pass-through rows) and the stops those call at, and their services'
    calendars; the five bus routes and their trips left out."""
    zf = zipfile.ZipFile(io.BytesIO(data))
    routes = _read(zf, "routes.txt")
    rc = routes[0]
    kept_routes = [routes[0]] + [r for r in routes[1:] if r[rc.index("agency_id")] == OPERATOR
                                 and r[rc.index("route_type")] in TRAIN_TYPES]
    route_ids = {r[rc.index("route_id")] for r in kept_routes[1:]}
    trips = _read(zf, "trips.txt")
    tc = trips[0]
    kept_trips = [trips[0]] + [t for t in trips[1:] if t[tc.index("route_id")] in route_ids]
    trip_ids = {t[tc.index("trip_id")] for t in kept_trips[1:]}
    services = {t[tc.index("service_id")] for t in kept_trips[1:]}
    times, used = [], set()
    with zf.open("stop_times.txt") as f:
        head = f.readline()
        cols = next(csv.reader([head.decode("utf-8-sig")]))
        ti, si = cols.index("trip_id"), cols.index("stop_id")
        times.append(head)
        for raw in f:
            text = raw.decode("utf-8")
            if text.split(",", ti + 1)[ti].strip().strip('"') not in trip_ids:
                continue
            row = next(csv.reader([text]))
            if row[ti] in trip_ids:
                times.append(raw)
                used.add(row[si])
    stops = _read(zf, "stops.txt")
    sc = stops[0]
    kept_stops = [stops[0]] + [s for s in stops[1:] if s[sc.index("stop_id")] in used]
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("agency.txt", zf.read("agency.txt"))
        z.writestr("routes.txt", _write(kept_routes))
        z.writestr("trips.txt", _write(kept_trips))
        z.writestr("stops.txt", _write(kept_stops))
        z.writestr("stop_times.txt", b"".join(times))
        for name in ("calendar.txt", "calendar_dates.txt"):
            if name in zf.namelist():
                rows = _read(zf, name)
                z.writestr(name, _write([rows[0]] + [r for r in rows[1:] if r[rows[0].index("service_id")] in services]))
    print(f"  croatia: cut to {len(route_ids)} routes, {len(trip_ids)} trips, {len(kept_stops) - 1} stops")
    return out.getvalue()


GTFS = {a: (GTFS_URL, keep(a), line, station,
            {"convert": convert, "number": number, "tz": TZ})
        for a in AGENCIES}

# Croatia's track (P3, not built yet): OpenStreetMap's mainline track in the
# box, routed from the timetables.
RAIL = {"region": "hr", "bbox": BBOX, "network": "hzpp"}
