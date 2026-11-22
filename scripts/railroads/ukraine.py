"""Ukraine: Ukrzaliznytsia's long-distance, Intercity+ and night trains (plus
the international trains to Wien, Budapest, Bratislava, Košice, Przemyśl,
Chełm and Warszawa), from the community GTFS published by jbb.ghsq.de
(ua-ukrzaliznytsya.gtfs.zip: keyless, built from Ukrzaliznytsia's public
timetable/booking data — UZ publishes no GTFS itself). No live feed is read:
the trains are placed from the timetable (a "timetable" source, no parser
file), marked estimated. The feed is downloaded fresh at each build; this
edition (5,758,058 B, Last-Modified Mon 09 Nov 2026 23:00:09 GMT) runs
2026-09-04 -> 2027-12-11. Wartime timetable churn is handled by the
fresh-fetch converter.

The feed is the long-distance network only: 115 train patterns (one trip per
route), 167 stops, 1,192 stop times. Its suburban (elektrichka) network is
NOT in the feed — only three cross-border regional services (П 642
Nyíregyháza–Mukachevo, П 647/649 Chop–Záhony) — so the build covers UZ's
long-distance trains, not the commuter network; the README says so.
Route types are the extended GTFS rail codes: 102 long-distance (112 routes)
and 106 regional (3). There are no bus routes in the feed.

Its four agency ids are a converter artifact (the HAFAS source labels
cross-border trains with the neighbour's operator: PKP Intercity, MÁV,
ZSSK); every train here is a UZ service, so all routes are one railroad,
"uz". Cross-border trains are kept whole, all their stops, as Denmark's ECE
and Austria's RJ are; the railroad "clips" to the box (BBOX, below), so its
extent stays Ukraine's. The far termini — Wien, Budapest, Warszawa — stay
outside it as stops on trains kept whole.

The feed has no calendar.txt — services are calendar_dates.txt only
(exception_type 1 additions, 11,844 rows, 115 services) — and
build_schedules.py reads that file with optional=True, so the missing
calendar is fine. Its route_long_name is empty for every route, so
"convert" writes each route's endpoints as its long name
("Київ-Пасажирський – Львів-Головний"), and a line is those ends,
hub-first ("Київ-Пасажирський – ..."), in Croatia's manner; its trips carry
no trip_short_name, so "convert" writes the route's short name there.

Stations: the feed has no parent stations or platforms; stops are the
stations, named as signed (Cyrillic for Ukraine's, Latin for the
neighbours'). Ids are slugs that keep Cyrillic letters (feeds.slug's rule:
"Київ-Пасажирський" -> "київ-пасажирський"), which dropping them would
leave empty — the Poland fix, applied here from the start. Train numbers are
the feed's route short names as printed ("146", "Ш 89", "П 642", "40749");
the same number is several route variants (three "146"s, two "13"s), which
stay separate runs under the one number. Times are Ukraine's (Europe/Kyiv)."""
import csv, io, re, unicodedata, zipfile

GTFS_URL = "https://jbb.ghsq.de/gtfs/ua-ukrzaliznytsya.gtfs.zip"
TZ = "Europe/Kyiv"
CREDIT = {"label": "Timetable from jbb.ghsq.de (Ukrzaliznytsia GTFS, community conversion of Ukrzaliznytsia's public timetable data)",
          "href": "https://jbb.ghsq.de/gtfs/ua-ukrzaliznytsya.gtfs.zip"}
# Ukraine, from Chop and Uzhhorod in the west to Kharkiv in the east, Odesa
# in the south to Chernihiv in the north; the box takes in Košice,
# Nyíregyháza, Przemyśl and Chełm too, so the cross-border trains' near
# stops stay inside it. The far termini — Wien, Budapest, Warszawa — stay
# outside it as stops on trains kept whole.
BBOX = [21.0, 44.3, 40.3, 52.5]
COMMON = {"region": "Ukraine", "country": "UA", "tz": TZ, "credit": CREDIT, "license": None, "bbox": BBOX,
          "clip": True}

AGENCIES = {
    "uz": {"name": "Ukrzaliznytsia", "short": "UZ", "color": "#0057b7", "kind": "intercity",
           "cars": "uz", **COMMON},
}
SOURCES = [{"id": "ukraine", "agencies": list(AGENCIES), "format": "timetable", "interval": 60, "scope": "view"}]

# The feed's rail route types (extended GTFS: 102 long-distance, 106
# regional); every route in the feed is one of these, and every train is a
# UZ service whatever agency id the converter filed it under.
TRAIN_TYPES = {"102", "106"}


def keep(agency):
    return lambda r: r["route_type"] in TRAIN_TYPES


HUB = "Київ-Пасажирський"


def line(r):
    """The route's ends, hub-first ("Київ-Пасажирський – Львів-Головний"),
    else alphabetical, so both directions share one line; the route's short
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
    return (r.get("route_short_name") or "").strip() or AGENCIES["uz"]["name"]


# The train's number as the feed prints it ("146", "Ш 89", "П 642", "40749").
number = lambda t: (t.get("trip_short_name") or "").strip() or None


# ---------- Stations ----------
LETTERS = str.maketrans({"ł": "l", "Ł": "L"})


def station(name):
    """(station id, name): "Київ-Пасажирський" -> ("київ-пасажирський",
    "Київ-Пасажирський"); "Wien Westbahnhof" -> ("wien-westbahnhof", ...).
    A name in another script than Latin keeps its letters (feeds.slug's
    rule), which dropping them would leave empty."""
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
    """jbb.ghsq.de's file as a GTFS of Ukrzaliznytsia's trains alone
    (feeds.py's "convert", run once a build): the rail routes (all of them:
    the feed carries no buses), their trips, stop times (less the stations a
    train only passes), the stops those call at, and their services'
    calendars; the shapes (19 MB) and attributions left out. The feed has no
    calendar.txt (calendar_dates.txt only). Each route's long name is its
    endpoints, each trip's short name its train number (the feed files
    neither); stop_times.txt is streamed, its trip id compared before a line
    is parsed."""
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
        pi, di = cols.index("pickup_type"), cols.index("drop_off_type")
        sq = cols.index("stop_sequence")
        times.append(head)
        for raw in f:
            text = raw.decode("utf-8")
            if text.split(",", ti + 1)[ti].strip().strip('"') not in trip_ids:
                continue
            row = next(csv.reader([text]))
            # A station the train passes (no pickup, no drop-off) isn't a stop.
            if row[ti] in trip_ids and not (row[pi] == "1" and row[di] == "1"):
                times.append(raw)
                used.add(row[si])
                by_trip.setdefault(row[ti], []).append(row)
    # Each route's long name is its endpoints, from its trip's first and last
    # stops; each trip's short name is its route's number (the feed files
    # neither). One trip per route in this feed.
    for r in kept_routes[1:]:
        trip = next(t for t in kept_trips[1:] if t[tc.index("route_id")] == r[rc.index("route_id")])
        seq = sorted(by_trip.get(trip[tc.index("trip_id")], []), key=lambda x: int(x[sq]))
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
            print(f"  ukraine: WARNING two stations named {s[sc.index('stop_name')]!r} fold into one ({sid}); split them by id")
        seen.setdefault(sid, (lat, lon))
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("agency.txt", zf.read("agency.txt"))
        z.writestr("routes.txt", _write(kept_routes))
        z.writestr("trips.txt", _write(kept_trips))
        z.writestr("stops.txt", _write(kept_stops))
        z.writestr("stop_times.txt", b"".join(times))
        if "calendar_dates.txt" in zf.namelist():
            rows = _read(zf, "calendar_dates.txt")
            z.writestr("calendar_dates.txt",
                       _write([rows[0]] + [r for r in rows[1:] if r[rows[0].index("service_id")] in services]))
    print(f"  ukraine: cut to {len(route_ids)} routes, {len(trip_ids)} trips, {len(kept_stops) - 1} stops")
    return out.getvalue()


GTFS = {a: (GTFS_URL, keep(a), line, station,
            {"convert": convert, "number": number, "tz": TZ})
        for a in AGENCIES}

# Ukraine's track (P3): OpenStreetMap's mainline track in the box, routed
# from the timetables.
RAIL = {"region": "ua", "bbox": BBOX, "network": "uz"}
