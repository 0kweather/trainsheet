"""Serbia: Srbija Voz's trains (plus the cross-border trains filed under
MÁV in the same feed), from the community Srbijavoz merged GTFS
published by vekejsn/gtfs-generators on GitLab (srbijavoz-merged-gtfs,
srbijavoz_merged.zip: keyless, converted from Srbijavoz's published
timetables — Srbijavoz publishes no GTFS itself). No live feed is read:
the trains are placed from the timetable (a "timetable" source, no parser
file), marked estimated. The feed is downloaded fresh at each build; this
edition (1,357,918 B, fetched 2026-11-22) runs 2026-09-04 -> 2026-12-13
— only ~3 weeks left at build time, so the Monday refresh must pick up
the next file or the build ships an expired timetable after Dec 13, 2026.
The survey's URL had the wrong file name (srbijavoz_gtfs.zip, 404s); the
real file is srbijavoz_merged.zip, package srbijavoz-merged-gtfs.

The feed is 264 routes and 264 trips — one trip per route, and trip id,
route id and service id are the same hash for each — 336 stops, 3,655
stop times. Route types are the extended GTFS rail codes: 102
long-distance (84 routes: B, IC, IR) and 106 regional (180: Re, ReX);
there are no bus routes. Its route_long_name is empty for every route,
so "convert" writes each route's endpoints as its long name
("Београд центар – Суботица"), and a line is those ends, hub-first, in
Croatia's manner; its trips carry no trip_short_name, so "convert"
writes the route's short name there ("B 432", "IC 540", "Re 7300").

The feed has no calendar.txt — services are calendar_dates.txt only
(exception_type 1 additions, 25,126 rows, 264 services) — and
build_schedules.py reads that file with optional=True, so the missing
calendar is fine. stop_times.txt has no pickup/drop-off columns, so
every listed stop is a call, as Turkey's are.

Its three agency ids are a converter artifact of the HAFAS source, and
they carry a trailing "____:" ("EFZ:72____:"): Srbija Voz (251 routes),
MÁV (12: Re 7300–7314 Szeged–Subotica) and ŽPCG (1: B 432). Srbija Voz
and MÁV are each their own railroad here, in Poland's manner; ŽPCG is
Montenegro's plug-in's railroad (montenegro.py), whose "make" takes
B 432 from this same file and merges it with the community ŽPCG feed's
domestic trains — so "convert" here leaves ŽPCG's route out. Quirk: the
two directions of the Belgrade–Bar train are filed under different
agencies — B 432 under ŽPCG, B 433 under Srbija Voz — so the pair is
still split across two railroads (now across two plug-ins). Cross-border trains are kept whole, all their stops, as
Denmark's ECE and Austria's RJ are; the railroads "clip" to the box
(BBOX, below), so their extent stays Serbia's. The far termini — Bar,
Szeged — stay inside it as stops on trains kept whole.

Stations: the feed has no parent stations or platforms; stops are the
stations, named as signed — mostly Serbian Cyrillic ("Београд центар",
"Нови Сад"), Latin for the Montenegrin and Hungarian stops ("Bar",
"Podgorica", "Szeged", "Röszke"). Ids are slugs that keep Cyrillic
letters (feeds.slug's rule), which dropping them would leave empty —
the Poland fix, applied here from the start. Two stops are both
"Витковац": Vitkovac (Kraljevo), on the Kraljevo–Lapotovo line, and
Vitkovac (Aleksinac), on the Niš–Belgrade line — named apart by id, in
Poland's Kolin manner. Train numbers are the feed's route short names
as printed; the same number is one route, so one number is one run.
Times are Serbia's (Europe/Belgrade).

Note on the Soko: the IC 540–557 Soko trains run Beograd–Subotica via
Petrovaradin and do NOT call at Novi Sad station itself — Novi Sad is
served only by the Re 5420–5446 Novi Sad–Sombor/Karavukovo regionals
in this edition."""
import csv, io, re, unicodedata, zipfile

GTFS_URL = "https://gitlab.com/api/v4/projects/vekejsn%2Fgtfs-generators/packages/generic/srbijavoz-merged-gtfs/latest/srbijavoz_merged.zip"
TZ = "Europe/Belgrade"
CREDIT = {"label": "Timetable from GitLab vekejsn/gtfs-generators (Srbijavoz merged GTFS, community conversion of Srbijavoz's published timetables)",
          "href": "https://gitlab.com/vekejsn/gtfs-generators"}
# Serbia, from Bar (Montenegro) in the south-west to Szeged (Hungary) in
# the north and Zaječar in the east; the box takes in the cross-border
# termini, so the Belgrade–Bar and Szeged–Subotica trains stay whole.
BBOX = [18.9, 41.9, 22.8, 46.4]
COMMON = {"region": "Serbia", "country": "RS", "tz": TZ, "credit": CREDIT, "license": None, "bbox": BBOX,
          "clip": True}

AGENCIES = {
    "srbijavoz": {"name": "Srbija Voz", "short": "Srbija Voz", "color": "#c8102e", "kind": "intercity",
                  "cars": "srbijavoz", **COMMON},
    "mav": {"name": "MÁV", "short": "MÁV", "color": "#e30613", "kind": "commuter",
            "cars": "mav", **COMMON},
}
SOURCES = [{"id": "serbia", "agencies": list(AGENCIES), "format": "timetable", "interval": 60, "scope": "view"}]

# The feed's agency ids, trailing "____:" as filed; and its rail route
# types (extended GTFS: 102 long-distance, 106 regional).
# ŽPCG's ("EFZ:62____:", B 432) is read by montenegro.py, not here.
OPERATORS = {"srbijavoz": "EFZ:72____:", "mav": "EFZ:55____:"}
TRAIN_TYPES = {"102", "106"}


def keep(agency):
    return lambda r: r["agency_id"] == OPERATORS[agency] and r["route_type"] in TRAIN_TYPES


HUB = "Београд центар"


def line(r):
    """The route's ends, hub-first ("Београд центар – Суботица"), else
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
    return (r.get("route_short_name") or "").strip() or AGENCIES["srbijavoz"]["name"]


# The train's number as the feed prints it ("B 432", "IC 540", "Re 7300").
number = lambda t: (t.get("trip_short_name") or "").strip() or None


# ---------- Stations ----------
# NFKD drops đ (it has no decomposition), so it is folded by hand, as
# Poland folds ł.
LETTERS = str.maketrans({"đ": "d", "Đ": "D"})


def station(name):
    """(station id, name): "Београд центар" -> ("београд-центар",
    "Београд центар"); "Szeged" -> ("szeged", "Szeged"). A name in
    another script than Latin keeps its letters (feeds.slug's rule),
    which dropping them would leave empty."""
    name = name.strip()
    low = name.lower()
    if all(c.isascii() or unicodedata.name(c, "").startswith("LATIN") for c in low if c.isalnum()):
        plain = unicodedata.normalize("NFKD", low.translate(LETTERS)).encode("ascii", "ignore").decode()
        return re.sub(r"[^a-z0-9]+", "-", plain).strip("-"), name
    return re.sub(r"-+", "-", "".join(c if c.isalnum() or unicodedata.combining(c) else "-"
                                      for c in unicodedata.normalize("NFC", low))).strip("-"), name


# Stations the feed names alike, named apart by stop id, in Poland's
# Kolin manner: Vitkovac (Kraljevo), on the Kraljevo–Lapotovo line, and
# Vitkovac (Aleksinac), on the Niš–Belgrade line (43.58611°N 21.56056°E).
BY_ID = {"7200431": "Витковац (Краљево)", "7200690": "Витковац (Алексинац)"}


# ---------- The timetable, cut ----------
def _read(zf, name):
    with zf.open(name) as f:
        return list(csv.reader(io.TextIOWrapper(f, "utf-8-sig")))


def _write(rows):
    out = io.StringIO()
    csv.writer(out, lineterminator="\n").writerows(rows)
    return out.getvalue().encode()


def convert(data):
    """vekejsn/gtfs-generators' file as a GTFS of Serbia's trains alone
    (feeds.py's "convert", run once a build): Srbija Voz's and MÁV's rail
    routes (all of them: the feed carries no buses; ŽPCG's B 432 is
    montenegro.py's), their trips and stop times, the
    stops those call at, and their services' calendar_dates (the feed
    has no calendar.txt). The shapes (and feed_info, attributions) are
    left out. Each route's long name is its endpoints, each trip's short
    name its train number (the feed files neither); the two Vitkovacs
    are named apart by stop id. stop_times.txt is streamed, its trip id
    compared before a line is parsed; it has no pickup/drop-off columns,
    so every row is a call."""
    zf = zipfile.ZipFile(io.BytesIO(data))
    routes = _read(zf, "routes.txt")
    rc = routes[0]
    kept_routes = [routes[0]] + [r for r in routes[1:] if r[rc.index("route_type")] in TRAIN_TYPES
                                 and r[rc.index("agency_id")] in OPERATORS.values()]
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
    # Each route's long name is its endpoints, from its trip's first and
    # last stops; each trip's short name is its route's number (the feed
    # files neither). One trip per route in this feed.
    for r in kept_routes[1:]:
        trip = next(t for t in kept_trips[1:] if t[tc.index("route_id")] == r[rc.index("route_id")])
        seq = sorted(by_trip.get(trip[tc.index("trip_id")], []), key=lambda x: int(x[sq]))
        if seq:
            first = BY_ID.get(seq[0][si], by_id[seq[0][si]][sc.index("stop_name")])
            last = BY_ID.get(seq[-1][si], by_id[seq[-1][si]][sc.index("stop_name")])
            r[rc.index("route_long_name")] = f"{first} – {last}"
    kept_trips[0] = tc + ["trip_short_name"]
    for t in kept_trips[1:]:
        t.append(by_route[t[tc.index("route_id")]][rc.index("route_short_name")])
    kept_stops, seen = [sc], {}
    for s in stops[1:]:
        if s[sc.index("stop_id")] not in used:
            continue
        s = list(s)
        s[sc.index("stop_name")] = BY_ID.get(s[sc.index("stop_id")], s[sc.index("stop_name")])
        kept_stops.append(s)
        # Two stations of one name, far apart, would fold into one: say so.
        sid = station(s[sc.index("stop_name")])[0]
        lat, lon = float(s[sc.index("stop_lat")]), float(s[sc.index("stop_lon")])
        if sid in seen and (abs(seen[sid][0] - lat) > 0.05 or abs(seen[sid][1] - lon) > 0.05):
            print(f"  serbia: WARNING two stations named {s[sc.index('stop_name')]!r} fold into one ({sid}); split them by id")
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
    print(f"  serbia: cut to {len(route_ids)} routes, {len(trip_ids)} trips, {len(kept_stops) - 1} stops")
    return out.getvalue()


GTFS = {a: (GTFS_URL, keep(a), line, station,
            {"convert": convert, "number": number, "tz": TZ})
        for a in AGENCIES}

# Serbia's track (P3): OpenStreetMap's mainline track in the box, routed
# from the timetables.
RAIL = {"region": "rs", "bbox": BBOX, "network": "srbijavoz"}
