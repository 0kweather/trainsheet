"""Montenegro: ŽPCG's trains (Željeznički prevoz Crne Gore), from the
community ŽPCG GTFS published by jbb.ghsq.de (me-zpcg.gtfs.zip: keyless,
converted from ŽPCG's published timetables by Jonah Brüchert — ŽPCG
publishes no GTFS itself), with the Belgrade–Bar sleeper B 432 taken
from the community Srbijavoz merged GTFS (Serbia's plug-in's feed,
vekejsn/gtfs-generators on GitLab) as before. No live feed is read: the
trains are placed from the timetable (a "timetable" source, no parser
file), marked estimated. Both files are downloaded fresh at each build
("make", below); this edition of the ŽPCG file (424,513 B, Last-Modified
2026-11-19, fetched 2026-11-23) runs 2018-12-07 -> 2026-12-12
(feed_info; every calendar service ends 2026-12-12) — only ~3 weeks
left at build time, so the Monday refresh must pick up the next file or
the build ships an expired timetable after Dec 12, 2026. The Srbijavoz
file runs 2026-09-04 -> 2026-12-13 (see serbia.py).

The ŽPCG feed is one agency (zpcg, Europe/Podgorica), 9 routes, 30
trips, 55 stops, 483 stop times. Route types are the extended GTFS rail
codes: 105 sleeper (2 routes: the Belgrade–Bar 432/433) and 106 regional
(7: Bar–Bijelo Polje, Bar–Podgorica, Podgorica–Nikšić, both ways). Its
route_short_name is empty and its route_long_name is the ends joined by
" - " ("Bar - Bijelo Polje"), so "make" rejoins them with " – " (the
form line() splits on); its trips carry the train number as
trip_short_name ("6103", "7101"). Services are calendar.txt only (30,
every one daily); stop times carry the HAFAS converter's second offsets
("09:09:14"), which build_schedules.py's minutes() drops. The feed files
every route red (d82234), the converter's default rather than ŽPCG's
colour, so "make" leaves route_color out and the lines take the
railroad's colour.

The Belgrade–Bar sleepers: the ŽPCG feed carries 432 and 433 whole
(Bar 20:10 -> Beograd Centar, Beograd Centar 19:42 -> Bar), but names
the Serbian stops in Latin ("Beograd Centar", "Prijepolje") where the
Srbijavoz feed names them in Cyrillic ("Београд центар"), so taking
them from here would give every Serbian station on the line a second
id. They are dropped; instead "make" takes B 432 (filed under ŽPCG in
the Srbijavoz feed, Bar 20:10 -> Земун 07:25+1) from the Srbijavoz file,
as Serbia's plug-in read it before, and B 433 stays with Srbija Voz
(serbia.py) — so the pair is still split across two railroads, with the
same times and the same station ids. The Montenegrin stops are named
alike (Latin, same places) in both feeds, so B 432's Bar, Podgorica,
Bijelo Polje and the rest fold into the ŽPCG feed's stations. Times in
both feeds are wall clock; Europe/Podgorica and Europe/Belgrade keep
the same offset all year, so nothing is shifted. A Srbijavoz-feed
outage fails this railroad's build too.

Stations: the feed has no parent stations or platforms; stops are the
stations, named as signed in Latin ("Bar", "Nikšić", "Bijelo Polje");
B 432's Serbian stops stay Cyrillic, with Serbia's ids (serbia.station:
"Пријепоље" -> "пријепоље"). Train numbers are trip_short_name as
filed ("6103", "B 432"). Times are Montenegro's (Europe/Podgorica).

P2 spot check: train 6103, Bijelo Polje 09:09 -> Bar 12:35 via
Podgorica; 7101, Nikšić 06:20 -> Podgorica 07:27."""
import csv, io, urllib.request, zipfile

from railroads.serbia import GTFS_URL as SERBIA_URL, station

GTFS_URL = "https://jbb.ghsq.de/gtfs/me-zpcg.gtfs.zip"
TZ = "Europe/Podgorica"
UA = "trainsheet-build"
CREDIT = {"label": "Timetable from jbb.ghsq.de (ŽPCG GTFS, community conversion of ŽPCG's published timetables); "
                   "B 432 from GitLab vekejsn/gtfs-generators (Srbijavoz merged GTFS)",
          "href": "https://jbb.ghsq.de/"}
# Montenegro, and the Belgrade–Bar corridor north to Zemun (44.84N), so
# B 432 stays whole; the railroad "clips" to it.
BBOX = [18.9, 41.9, 20.9, 44.9]
COMMON = {"region": "Montenegro", "country": "ME", "tz": TZ, "credit": CREDIT, "license": None, "bbox": BBOX,
          "clip": True}

AGENCIES = {
    "zpcg": {"name": "Željeznički prevoz Crne Gore", "short": "ŽPCG", "color": "#0057a8", "kind": "intercity",
             "cars": "zpcg", **COMMON},
}
SOURCES = [{"id": "montenegro", "agencies": list(AGENCIES), "format": "timetable", "interval": 60, "scope": "view"}]

# The ŽPCG feed's own Belgrade–Bar sleepers, dropped for the Srbijavoz
# feed's B 432 and Srbija Voz's B 433 (above); and the Srbijavoz feed's
# ŽPCG agency id and rail route types.
DROP = {"432", "433"}
SERBIA_ZPCG = "EFZ:62____:"
SERBIA_TYPES = {"102", "106"}
TRAIN_TYPES = {"105", "106", "102"}


def keep(agency):
    return lambda r: r["route_type"] in TRAIN_TYPES


HUB = "Podgorica"


def line(r):
    """The route's ends, hub-first ("Podgorica – Nikšić"), else
    alphabetical ("Bar – Bijelo Polje", "Bar – Земун"), so both directions
    share one line."""
    name = (r.get("route_long_name") or "").strip()
    parts = [p.strip() for p in name.split(" – ")]
    if len(parts) >= 2 and all(parts) and parts[0] != parts[-1]:
        ends = [parts[0], parts[-1]]
        if HUB in ends:
            ends.sort(key=lambda e: e != HUB)
        else:
            ends.sort()
        return " – ".join(ends)
    return (r.get("route_short_name") or "").strip() or AGENCIES["zpcg"]["name"]


# The train's number as the feed prints it ("6103", "B 432").
number = lambda t: (t.get("trip_short_name") or "").strip() or None


# ---------- The timetable, merged ----------
def _get(url, timeout=180):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def _rows(zf, name):
    with zf.open(name) as f:
        yield from csv.DictReader(io.TextIOWrapper(f, "utf-8-sig"))


def _table(rows, cols):
    buf = io.StringIO()
    w = csv.DictWriter(buf, cols, extrasaction="ignore", lineterminator="\n")
    w.writeheader()
    w.writerows(rows)
    return buf.getvalue()


def _times(zf, trip_ids):
    """stop_times.txt's rows of these trips, streamed, the trip id
    compared before a line is parsed."""
    out = {}
    with zf.open("stop_times.txt") as f:
        cols = next(csv.reader([f.readline().decode("utf-8-sig")]))
        ti = cols.index("trip_id")
        for raw in f:
            text = raw.decode("utf-8")
            if text.split(",", ti + 1)[ti].strip().strip('"') not in trip_ids:
                continue
            row = dict(zip(cols, next(csv.reader([text]))))
            if row["trip_id"] in trip_ids:
                out.setdefault(row["trip_id"], []).append(row)
    return {t: sorted(x, key=lambda r: int(r["stop_sequence"])) for t, x in out.items()}


def make(me=None, rs=None):
    """ŽPCG's timetable as one GTFS zip (feeds.py's "make"): the ŽPCG
    feed's rail routes less its 432/433, their trips, stop times, stops
    and calendar, plus the Srbijavoz feed's B 432 (its route, trip, stop
    times, stops and calendar_dates). Route long names are the ends
    joined by " – "; B 432's trip short name is its route's ("B 432").
    The two feeds' ids are checked apart; any id they share is prefixed
    "rs:" on the Srbijavoz side. me/rs: the files' bytes, for a test
    (else downloaded)."""
    zm = zipfile.ZipFile(io.BytesIO(me if me is not None else _get(GTFS_URL)))
    zs = zipfile.ZipFile(io.BytesIO(rs if rs is not None else _get(SERBIA_URL, 300)))

    # The ŽPCG feed, less 432/433.
    m_routes = {r["route_id"]: r for r in _rows(zm, "routes.txt") if r["route_type"] in TRAIN_TYPES}
    m_trips = [t for t in _rows(zm, "trips.txt")
               if t["route_id"] in m_routes and (t.get("trip_short_name") or "").strip() not in DROP]
    m_routes = {k: r for k, r in m_routes.items() if any(t["route_id"] == k for t in m_trips)}
    for r in m_routes.values():
        r["agency_id"] = "zpcg"
        r["route_long_name"] = " – ".join(p.strip() for p in r["route_long_name"].split(" - "))
    m_times = _times(zm, {t["trip_id"] for t in m_trips})
    m_services = {t["service_id"] for t in m_trips}

    # The Srbijavoz feed's B 432.
    s_routes = {r["route_id"]: r for r in _rows(zs, "routes.txt")
                if r["agency_id"] == SERBIA_ZPCG and r["route_type"] in SERBIA_TYPES}
    s_trips = [t for t in _rows(zs, "trips.txt") if t["route_id"] in s_routes]
    s_times = _times(zs, {t["trip_id"] for t in s_trips})
    s_services = {t["service_id"] for t in s_trips}
    s_stop_ids = {x["stop_id"] for seq in s_times.values() for x in seq}
    s_stops = {s["stop_id"]: s for s in _rows(zs, "stops.txt") if s["stop_id"] in s_stop_ids}
    for r in s_routes.values():
        seq = max((s_times.get(t["trip_id"], []) for t in s_trips if t["route_id"] == r["route_id"]), key=len, default=[])
        r["agency_id"] = "zpcg"
        if seq:
            r["route_long_name"] = f"{s_stops[seq[0]['stop_id']]['stop_name']} – {s_stops[seq[-1]['stop_id']]['stop_name']}"
    for t in s_trips:
        t["trip_short_name"] = s_routes[t["route_id"]]["route_short_name"]

    m_stop_ids = {x["stop_id"] for seq in m_times.values() for x in seq}
    m_stops = {s["stop_id"]: s for s in _rows(zm, "stops.txt") if s["stop_id"] in m_stop_ids}

    # Ids apart: any the two feeds share is prefixed on the Srbijavoz side.
    clash = {"route": set(m_routes) & set(s_routes),
             "trip": {t["trip_id"] for t in m_trips} & {t["trip_id"] for t in s_trips},
             "service": m_services & s_services,
             "stop": set(m_stops) & set(s_stops)}
    fix = lambda kind, x: f"rs:{x}" if x in clash[kind] else x
    if any(clash.values()):
        print(f"  montenegro: shared ids, prefixed rs: on the Srbijavoz side: {clash}")
        for r in s_routes.values():
            r["route_id"] = fix("route", r["route_id"])
        for t in s_trips:
            t["route_id"], t["trip_id"], t["service_id"] = (fix("route", t["route_id"]), fix("trip", t["trip_id"]),
                                                            fix("service", t["service_id"]))
        s_times = {fix("trip", k): [{**x, "trip_id": fix("trip", k), "stop_id": fix("stop", x["stop_id"])} for x in v]
                   for k, v in s_times.items()}
        s_stops = {fix("stop", k): {**s, "stop_id": fix("stop", k)} for k, s in s_stops.items()}
    s_cal = [{**c, "service_id": fix("service", c["service_id"])}
             for c in _rows(zs, "calendar_dates.txt") if c["service_id"] in s_services]

    # A station named alike in both feeds, far apart, would fold into
    # one: say so.
    seen = {}
    for s in [*m_stops.values(), *s_stops.values()]:
        sid = station(s["stop_name"])[0]
        lat, lon = float(s["stop_lat"]), float(s["stop_lon"])
        if sid in seen and (abs(seen[sid][0] - lat) > 0.05 or abs(seen[sid][1] - lon) > 0.05):
            print(f"  montenegro: WARNING two stations named {s['stop_name']!r} fold into one ({sid}); split them by id")
        seen.setdefault(sid, (lat, lon))

    times = [x for seq in [*m_times.values(), *s_times.values()] for x in seq]
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("agency.txt", zm.read("agency.txt"))
        z.writestr("routes.txt", _table([*m_routes.values(), *s_routes.values()],
                                        ["route_id", "agency_id", "route_short_name", "route_long_name", "route_type"]))
        z.writestr("trips.txt", _table([*m_trips, *s_trips],
                                       ["route_id", "service_id", "trip_id", "trip_headsign", "trip_short_name"]))
        z.writestr("stops.txt", _table([*m_stops.values(), *s_stops.values()], ["stop_id", "stop_name", "stop_lat", "stop_lon"]))
        z.writestr("stop_times.txt", _table(times, ["trip_id", "arrival_time", "departure_time", "stop_id", "stop_sequence",
                                                    "pickup_type", "drop_off_type"]))
        z.writestr("calendar.txt", _table([c for c in _rows(zm, "calendar.txt") if c["service_id"] in m_services],
                                          ["service_id", "monday", "tuesday", "wednesday", "thursday", "friday",
                                           "saturday", "sunday", "start_date", "end_date"]))
        z.writestr("calendar_dates.txt", _table(s_cal, ["service_id", "date", "exception_type"]))
    print(f"  montenegro: {len(m_routes)} ŽPCG routes / {len(m_trips)} trips + {len(s_routes)} Srbijavoz-feed route(s) / "
          f"{len(s_trips)} trip(s) ({', '.join(t['trip_short_name'] for t in s_trips)}); "
          f"{len(m_stops) + len(s_stops)} stops, {len(times)} stop times")
    return out.getvalue()


GTFS = {a: (GTFS_URL, keep(a), line, station,
            {"make": make, "number": number, "tz": TZ})
        for a in AGENCIES}

# Montenegro's track: region "me", Montenegro's own lines alone (Bar –
# Bijelo Polje to the Serbian border at the Gostun tunnel, Podgorica –
# Nikšić). B 432's Serbian track is drawn in rs.geojson already, for Srbija
# Voz's B 433, so the geometry box is Montenegro's, not the agency's
# corridor box above (which stays the map-view extent).
RAIL = {"region": "me", "bbox": [18.4, 41.85, 20.1, 43.17], "network": "zpcg"}
