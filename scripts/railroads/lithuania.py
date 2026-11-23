"""Lithuania: LTG Link's trains (the national passenger operator: the
regional network, the Vilnius–Kaunas and Vilnius–Klaipėda trains, the
Vilnius–Mockava trains and the Vilnius–Rīga service), from the community GTFS published by jbb.ghsq.de
(lt-ltglink.gtfs.zip: keyless, converted from LTG Link's published
timetables by Jonah Brüchert's ltg-link-gtfs, gitlab.spline.de/spline/
transitous — LTG Link publishes no GTFS itself). No live feed is read: the
trains are placed from the timetable (a "timetable" source, no parser
file), marked estimated. The feed is downloaded fresh at each build; this
edition (833,649 B, fetched 2026-11-23) runs 2026-11-22 -> 2027-01-19
(feed_info) — a two-month window, so the Monday refresh must pick up the
next file or the build ships an expired timetable after Jan 19, 2027.

The feed is one agency (ltg-link, Europe/Vilnius), 249 routes, 514 trips,
123 stops, 4,459 stop times. Route types: 241 plain rail (2) and 8
extended long-distance rail (102: trains 31–36, 889/890, 891/892); there
are no bus routes, so every route is kept. Its route_long_name is empty
for every route, so "convert" writes each route's endpoints as its long
name ("Vilnius – Kaunas"), from the route's longest trip (24 routes have
short-workings too: 647 is Vilnius–Marcinkonys, some days only to
Varėna), and a line is those ends, hub-first, in Croatia's manner. Its
trips carry no trip_short_name and no trip_headsign, so "convert" writes
the route's short name there ("13", "42/41", "501", "841").

One route is one train number, but a route has one to five trips (137
routes have 2, 62 have 1, 50 have 3–5): the same number on different
days or stopping patterns (841 runs Vilnius 17:26 fast and 20:45 all
stops). These stay separate runs under the one number, as Ukraine's
route variants do — build_schedules.py's usual handling, nothing new.

Services: calendar.txt (91 weekly services) with calendar_dates.txt
(584 rows, all exception_type 2: removals, e.g. the Christmas days);
build_schedules.py reads both. stop_times.txt has no pickup/drop-off
columns, so every listed stop is a call, as Serbia's and Turkey's are.
The shapes (2.5 MB), feed_info, attributions, licenses and ticketing
files are left out.

Cross-border: the Vilnius–Rīga trains (889/890, 891/892) run via
Jelgava to Rīgas Centrālā stacija (Latvia, stop_timezone Europe/Riga, the
same offset as Vilnius); they are kept whole, all their stops, as
Denmark's ECE and Austria's RJ are, and the box (BBOX, below) is sized to
take Jelgava and Rīga in. Those two are the only stops outside Lithuania
in this edition: the border termini Mockava (31–36, Vilnius–Mockava, for
Poland) and Kena (for Belarus) are on the Lithuanian side; there is no
Daugavpils. The railroad "clips" to the box.

Stations: the feed has no parent stations or platforms; stop ids are the
stop names ("Vilnius", "Akmenė") except Rīga's (id "Ryga", named
"Rīgas Centrālā stacija"), all 123 with coordinates (OSM's, ODbL per the
feed's licenses.txt), no two alike. Ids are slugs by feeds.slug's
rule: Lithuanian letters are Latin, so NFKD folds them to ASCII
("Kaišiadorys" -> "kaisiadorys", "Kazlų Rūda" -> "kazlu-ruda"); no two
stops fold into one id in this edition. Two stops are the EMU depot
("Elektrinių traukinių depas-1/-2"), served by a few trains as filed.
Times are Lithuania's (Europe/Vilnius).

P2 spot check (to verify when schedules are built): train 841, Vilnius
17:26 -> Kaunas 18:38 via Lentvaris, Vievis, Kaišiadorys, Palemonas."""
import csv, io, re, unicodedata, zipfile

GTFS_URL = "https://jbb.ghsq.de/gtfs/lt-ltglink.gtfs.zip"
TZ = "Europe/Vilnius"
CREDIT = {"label": "Timetable from jbb.ghsq.de (LTG Link GTFS, community conversion of LTG Link's published timetables)",
          "href": "https://jbb.ghsq.de/"}
# Lithuania, from Klaipėda and Kretingalė on the coast to Turmantas and
# Visaginas in the east, Marcinkonys in the south to Mažeikiai in the north;
# the box runs north to Rīga (Jelgava, Rīgas Centrālā stacija), so the
# Vilnius–Rīga trains stay whole.
BBOX = [20.9, 53.85, 26.9, 57.05]
COMMON = {"region": "Lithuania", "country": "LT", "tz": TZ, "credit": CREDIT, "license": "ODbL (stops)", "bbox": BBOX,
          "clip": True}

AGENCIES = {
    "ltglink": {"name": "LTG Link", "short": "LTG Link", "color": "#f8423a", "kind": "intercity",
                "cars": "ltglink", **COMMON},
}
SOURCES = [{"id": "lithuania", "agencies": list(AGENCIES), "format": "timetable", "interval": 60, "scope": "view"}]

# The feed's rail route types (2 rail, 102 extended long-distance); every
# route in the feed is one of these.
TRAIN_TYPES = {"2", "102"}


def keep(agency):
    return lambda r: r["route_type"] in TRAIN_TYPES


HUB = "Vilnius"


def line(r):
    """The route's ends, hub-first ("Vilnius – Klaipėda"), else
    alphabetical, so both directions share one line; the route's short
    name where the long name is empty or a loop."""
    name = (r.get("route_long_name") or "").strip()
    parts = [p.strip() for p in name.split(" – ")]
    if len(parts) >= 2 and all(parts) and parts[0] != parts[-1]:
        ends = [parts[0], parts[-1]]
        if HUB in ends:
            ends.sort(key=lambda e: e != HUB)
        else:
            ends.sort()
        return " – ".join(ends)
    return (r.get("route_short_name") or "").strip() or AGENCIES["ltglink"]["name"]


# The train's number as the feed prints it ("13", "42/41", "501", "841").
number = lambda t: (t.get("trip_short_name") or "").strip() or None


# ---------- Stations ----------
LETTERS = str.maketrans({"ł": "l", "Ł": "L"})


def station(name):
    """(station id, name): "Kaišiadorys" -> ("kaisiadorys", "Kaišiadorys");
    "Kazlų Rūda" -> ("kazlu-ruda", "Kazlų Rūda"). Lithuanian letters are
    Latin and fold to ASCII; a name in another script than Latin would keep
    its letters (feeds.slug's rule)."""
    name = name.strip()
    low = name.lower()
    if all(c.isascii() or unicodedata.name(c, "").startswith("LATIN") for c in low if c.isalnum()):
        plain = unicodedata.normalize("NFKD", low.translate(LETTERS)).encode("ascii", "ignore").decode()
        return re.sub(r"[^a-z0-9]+", "-", plain).strip("-"), name
    return re.sub(r"-+", "-", "".join(c if c.isalnum() or unicodedata.combining(c) else "-"
                                      for c in unicodedata.normalize("NFC", low))).strip("-"), name


# ---------- The timetable, cut ----------
def _read(zf, name):
    with zf.open(name) as f:
        return list(csv.reader(io.TextIOWrapper(f, "utf-8-sig")))


def _write(rows):
    out = io.StringIO()
    csv.writer(out, lineterminator="\n").writerows(rows)
    return out.getvalue().encode()


def convert(data):
    """jbb.ghsq.de's file as a GTFS of LTG Link's trains alone (feeds.py's
    "convert", run once a build): the rail routes (all of them: the feed
    carries no buses), their trips and stop times, the stops those call at,
    and their services' calendar and calendar_dates (removals). The shapes
    (and feed_info, attributions, licenses, ticketing files) are left out.
    Each route's long name is its endpoints, from its longest trip; each
    trip's short name its train number (the feed files neither).
    stop_times.txt is streamed, its trip id compared before a line is
    parsed; it has no pickup/drop-off columns, so every row is a call."""
    zf = zipfile.ZipFile(io.BytesIO(data))
    routes = _read(zf, "routes.txt")
    rc = routes[0]
    kept_routes = [routes[0]] + [r for r in routes[1:] if r[rc.index("route_type")] in TRAIN_TYPES]
    route_ids = {r[rc.index("route_id")] for r in kept_routes[1:]}
    by_route = {r[rc.index("route_id")]: r for r in kept_routes[1:]}
    trips = _read(zf, "trips.txt")
    tc = trips[0]
    kept_trips = [trips[0]] + [t for t in trips[1:] if t[tc.index("route_id")] in route_ids]
    trip_ids = {t[tc.index("trip_id")] for t in kept_trips[1:]}
    services = {t[tc.index("service_id")] for t in kept_trips[1:]}
    stops = _read(zf, "stops.txt")
    sc = stops[0]
    by_id = {s[sc.index("stop_id")]: s for s in stops[1:]}
    times, used = [], set()
    by_trip = {}
    with zf.open("stop_times.txt") as f:
        head = f.readline()
        cols = next(csv.reader([head.decode("utf-8-sig")]))
        ti, si = cols.index("trip_id"), cols.index("stop_id")
        sq = cols.index("stop_sequence")
        times.append(head)
        for raw in f:
            text = raw.decode("utf-8")
            if text.split(",", ti + 1)[ti].strip().strip('"') not in trip_ids:
                continue
            row = next(csv.reader([text]))
            if row[ti] in trip_ids:
                times.append(raw)
                used.add(row[si])
                by_trip.setdefault(row[ti], []).append(row)
    # Each route's long name is its endpoints, from its longest trip's first
    # and last stops (a route's other trips may be short-workings); each
    # trip's short name is its route's number (the feed files neither).
    trips_of = {}
    for t in kept_trips[1:]:
        trips_of.setdefault(t[tc.index("route_id")], []).append(t[tc.index("trip_id")])
    for r in kept_routes[1:]:
        seqs = [by_trip.get(t, []) for t in trips_of.get(r[rc.index("route_id")], [])]
        seq = sorted(max(seqs, key=len, default=[]), key=lambda x: int(x[sq]))
        if seq:
            first = by_id[seq[0][si]][sc.index("stop_name")]
            last = by_id[seq[-1][si]][sc.index("stop_name")]
            r[rc.index("route_long_name")] = f"{first} – {last}"
    kept_trips[0] = tc + ["trip_short_name"]
    for t in kept_trips[1:]:
        t.append(by_route[t[tc.index("route_id")]][rc.index("route_short_name")])
    kept_stops, seen = [sc], {}
    for s in stops[1:]:
        if s[sc.index("stop_id")] not in used:
            continue
        kept_stops.append(s)
        # Two stations of one name, far apart, would fold into one: say so.
        sid = station(s[sc.index("stop_name")])[0]
        lat, lon = float(s[sc.index("stop_lat")]), float(s[sc.index("stop_lon")])
        if sid in seen and (abs(seen[sid][0] - lat) > 0.05 or abs(seen[sid][1] - lon) > 0.05):
            print(f"  lithuania: WARNING two stations named {s[sc.index('stop_name')]!r} fold into one ({sid}); split them by id")
        seen.setdefault(sid, (lat, lon))
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("agency.txt", zf.read("agency.txt"))
        z.writestr("routes.txt", _write(kept_routes))
        z.writestr("trips.txt", _write(kept_trips))
        z.writestr("stops.txt", _write(kept_stops))
        z.writestr("stop_times.txt", b"".join(times))
        for name, key in (("calendar.txt", "service_id"), ("calendar_dates.txt", "service_id")):
            if name in zf.namelist():
                rows = _read(zf, name)
                z.writestr(name, _write([rows[0]] + [r for r in rows[1:] if r[rows[0].index(key)] in services]))
    print(f"  lithuania: cut to {len(route_ids)} routes, {len(trip_ids)} trips, {len(kept_stops) - 1} stops")
    return out.getvalue()


GTFS = {a: (GTFS_URL, keep(a), line, station,
            {"convert": convert, "number": number, "tz": TZ})
        for a in AGENCIES}

# Lithuania's track (P3): OpenStreetMap's mainline track in the box, routed
# from the timetables.
RAIL = {"region": "lt", "bbox": BBOX, "network": "ltglink"}
