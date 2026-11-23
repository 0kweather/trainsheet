"""India: the whole of Indian Railways, from the community GTFS at
https://github.com/Neo2308/indianrailways-gtfs (raw zip
https://github.com/Neo2308/indianrailways-gtfs/raw/refs/heads/main/gtfs/gtfs.zip,
feed 2026-08-30, version 2026-08-30-02-22-43; calendar.txt services run to
2027-08-30). Indian Railways publishes no GTFS itself — this is the best
available source, built from its published data, and the README says so.

Scale (measured from the feed, 2026-11-23): 8,550 stops, 10,594 trips,
10,594 routes — one route per train number, route_short_name IS the train
number (e.g. 00103, 12951). All routes are route_type 2. Agency: Indian
Railways (id "1"), tz Asia/Kolkata. 7,886 trips run on Mon 2026-11-23;
907 trips sit on services that already ended (expired specials — the
two-week window drops them naturally). Stop times are full runs, not
major stops only (median 18 stops/trip, max 119, min 2; 207,224 rows, no
bad times). shapes.txt covers all 10,594 trips. No missing/zero coords,
no duplicate stop ids. This is the biggest build in the program: the
converter streams row by row and never list()s a whole file.

The feed's quirks, repaired by make_india():
  - Six freight routes are dropped (2 RAPID CARGO, 4 PARCEL incl. PARCEL
    SPL / PARCEL TRAIN). "TKD PCET" and "JPP-RCS" specials are kept —
    their codes are unexplained but they are not marked freight.
  - Stop names are ALL CAPS ("NEW DELHI", "C SHIVAJI MAH T");
    build_stations.py title-cases them for display. Stations are keyed
    by stop code (no station fold): 11 stop names occur twice for two
    different stations hundreds of km apart (AGTHORI AGT/AGTR, BELA,
    DADAR DDR/DR, NAGARI, PIPRADIH, RAGHUNATHPUR, ...), so folding by
    name would merge distinct stations and misplace trains. Station ids
    are the codes (NDLS, HWH, ...), as SunRail/SEPTA already do.
  - trip_short_name is empty in the feed; the cut sets it from
    route_short_name, so trains are numbered by their train number.
  - No calendar_dates.txt in the feed (calendar.txt only); the cut
    includes it only if present. No frequencies.txt.
  - route_color is empty on every route; the cut colours routes by
    family (FAMILY_COLORS).

Lines are train families, not corridors: with one route per train number,
corridor naming would make ~5,000 lines. The family is read off
route_long_name ("NDLS-BPL VANDE BHARAT EXP" -> Vande Bharat Express);
routes with no type keyword fall back on Indian Railways' own numbering
(0xxxx special, 1/2xxxx express, 3/4/9xxxx suburban local, 5/6xxxx
passenger, 7xxxx DMU) — 1,251 routes need the fallback, mostly bare
"AAA-BBB" pairs and festival specials. Counts by line (of 10,588, cargo
excluded): Express 2,754, Local 2,614, MEMU 1,327, Passenger 1,256,
Superfast 601, Special 552, DMU 518, Suburban 347, Vande Bharat 119,
Intercity 112, DEMU 75, Humsafar 69, Shatabdi 58, Duronto 47, Garib Rath
31, Mail/Express 29, Rajdhani 28, Tejas 22, Antyodaya 15, Jan Shatabdi 6,
Tourist 6, Gatimaan 2. Suburban locals ARE in the feed (Kolkata
3xxxx, Chennai 4xxxx, Mumbai 9xxxx, MRTS) — ~2,600 local/suburban trains,
so this is not a long-distance-only build. Against Indian Railways'
~13,000 daily trains the feed's 7,886 running on a Monday is the large
majority; the gap is mostly trains the feed's compiler did not capture,
not a whole missing class.

P2 spot checks: see STATE.md (from the built files)."""
import csv, io, re, urllib.request, zipfile

UA = "trainsheet-build"
TZ = "Asia/Kolkata"
GTFS_URL = "https://github.com/Neo2308/indianrailways-gtfs/raw/refs/heads/main/gtfs/gtfs.zip"
# The built region: Kanyakumari (8.1N) to Kashmir (37.1N), Gujarat (68.1E)
# to Arunachal (97.4E).
BBOX = [67.5, 6.5, 98.0, 37.5]
CREDIT = {"label": "Timetable from a community Indian Railways GTFS (Neo2308/indianrailways-gtfs, "
                   "feed 2026-08-30, calendars to 2027-08-30); Indian Railways publishes no GTFS itself",
          "href": "https://github.com/Neo2308/indianrailways-gtfs"}
COMMON = {"region": "India", "country": "IN", "license": None, "bbox": BBOX, "clip": True}

AGENCIES = {
    "indianrailways": {"name": "Indian Railways", "short": "IR", "color": "#1565c0", "kind": "intercity",
                       "cars": "indianrailways", "tz": TZ, "credit": CREDIT, **COMMON},
}
SOURCES = [{"id": "india", "agencies": ["indianrailways"], "format": "timetable", "interval": 60, "scope": "view"}]

# The train's family, from its route long name, in order (Jan Shatabdi
# before Shatabdi, MEMU before EMU, DEMU before DMU). "SF" (Superfast) is
# checked between the named families and the generic ones, so "RMM
# HUMSAFAR SF" stays Humsafar and "CNB LTT SF HSPL" is Superfast, not
# Special (HSPL/DSPL are station codes — "SPL" is matched word-boundary
# only, after the loop).
FAMILIES_EARLY = [("VANDE BHARAT", "Vande Bharat Express"), ("RAJDHANI", "Rajdhani Express"),
                  ("JAN SHATABDI", "Jan Shatabdi Express"), ("SHATABDI", "Shatabdi Express"),
                  ("DURONTO", "Duronto Express"), ("GARIB RATH", "Garib Rath Express"),
                  ("GATIMAAN", "Gatimaan Express"), ("TEJAS", "Tejas Express"),
                  ("HUMSAFAR", "Humsafar Express"), ("ANTYODAYA", "Antyodaya Express"),
                  ("INTERCITY", "Intercity Express"), ("MEMU", "MEMU"), ("DEMU", "DEMU"), ("DMU", "DMU"),
                  ("SUBURBAN", "Suburban"), ("MRTS", "Suburban"), ("LOCAL", "Local"), ("EMU", "Suburban"),
                  ("PASSENGER", "Passenger"), ("SUPERFAST", "Superfast Express"),
                  ("MAIL", "Mail/Express")]
FAMILIES_LATE = [("EXPRESS", "Express"), ("SPECIAL", "Special"),
                 ("TOURIST", "Tourist"), ("PALACE", "Tourist"), ("BHARAT GAURAV", "Tourist"),
                 ("CARGO", "Cargo"), ("PARCEL", "Cargo")]
FAMILY_COLORS = {"Vande Bharat Express": "1565c0", "Rajdhani Express": "b71c1c",
                 "Jan Shatabdi Express": "0097a7", "Shatabdi Express": "0277bd",
                 "Duronto Express": "6a1b9a", "Garib Rath Express": "2e7d32",
                 "Gatimaan Express": "ef6c00", "Tejas Express": "f9a825",
                 "Humsafar Express": "00838f", "Antyodaya Express": "795548",
                 "Intercity Express": "3949ab", "MEMU": "00897b", "DEMU": "7cb342", "DMU": "558b2f",
                 "Suburban": "7e57c2", "Local": "f57c00", "Passenger": "757575",
                 "Superfast Express": "d32f2f", "Mail/Express": "8e24aa", "Express": "546e7a",
                 "Special": "a1887f", "Tourist": "d4a017"}
# Indian Railways' own numbering, for routes whose long name carries no
# family keyword: 0xxxx specials, 1/2xxxx long-distance, 3/4/9xxxx
# suburban, 5/6xxxx passenger, 7xxxx diesel railcars.
FALLBACK = {"0": "Special", "1": "Express", "2": "Express", "3": "Local", "4": "Local",
            "5": "Passenger", "6": "Passenger", "7": "DMU", "9": "Local"}


def line(r):
    """The train's family line: "NDLS-BPL VANDE BHARAT EXP" -> "Vande
    Bharat Express"; "RU-NZM" (no keyword) -> "Express" by its number."""
    name = (r.get("route_long_name") or "").upper()
    if re.search(r"\bSUB\b", name):
        return "Suburban"
    for keyword, family in FAMILIES_EARLY:
        if keyword in name:
            return family
    if re.search(r"\bSF\b", name):
        return "Superfast Express"
    for keyword, family in FAMILIES_LATE:
        if keyword in name:
            return family
    if re.search(r"\bSPL\b", name):
        return "Special"
    if re.search(r"\bSP\b", name):
        return "Special"
    return FALLBACK.get((r.get("route_short_name") or "")[:1], "Express")


def number(t):
    """The train's number, as the cut files it (route_short_name)."""
    return (t.get("trip_short_name") or "").strip() or None


def _get(url, timeout=300):
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


def _is_freight(r):
    name = (r.get("route_long_name") or "").upper()
    return "CARGO" in name or "PARCEL" in name


def make_india(data=None):
    """The Neo2308 GTFS, fresh at build time, cut to its rail routes
    (all route_type 2) less the six freight routes, with train numbers
    filed as trip_short_name and routes coloured by family. data: the
    feed zip's bytes, for a test (else downloaded). The big files are
    streamed row by row; shapes.txt is never read."""
    if data is None:
        data = _get(GTFS_URL)
    zf = zipfile.ZipFile(io.BytesIO(data))
    agencies = [a for a in _rows(zf, "agency.txt")]
    routes = []
    for r in _rows(zf, "routes.txt"):
        if r["route_type"] != "2" or _is_freight(r):
            continue
        r["route_color"] = FAMILY_COLORS.get(line(r), "")
        routes.append(r)
    route_ids = {r["route_id"] for r in routes}
    by_route = {r["route_id"]: r for r in routes}
    trips = []
    for t in _rows(zf, "trips.txt"):
        if t["route_id"] in route_ids:
            t["trip_short_name"] = by_route[t["route_id"]].get("route_short_name", "")
            trips.append(t)
    trip_ids = {t["trip_id"] for t in trips}
    times = []
    for st in _rows(zf, "stop_times.txt"):
        if st["trip_id"] in trip_ids:
            times.append(st)
    used_stops = {x["stop_id"] for x in times}
    stops = [s for s in _rows(zf, "stops.txt") if s["stop_id"] in used_stops]
    services = {t["service_id"] for t in trips}
    cal = [c for c in _rows(zf, "calendar.txt") if c["service_id"] in services]
    cal_dates = [c for c in _rows(zf, "calendar_dates.txt") if c["service_id"] in services] \
        if "calendar_dates.txt" in zf.namelist() else []
    end = max((c["end_date"] for c in cal), default="?")
    print(f"  india: {len(routes)} routes, {len(trips)} trips, {len(stops)} stops, "
          f"{len(times)} stop times, calendar to {end}")
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("agency.txt", _table(agencies, ["agency_id", "agency_name", "agency_url", "agency_timezone"]))
        z.writestr("routes.txt", _table(routes, ["route_id", "agency_id", "route_short_name", "route_long_name",
                                                 "route_type", "route_color"]))
        z.writestr("trips.txt", _table(trips, ["route_id", "service_id", "trip_id", "trip_headsign",
                                               "trip_short_name", "direction_id"]))
        z.writestr("stops.txt", _table(stops, ["stop_id", "stop_name", "stop_lat", "stop_lon"]))
        z.writestr("stop_times.txt", _table(times, ["trip_id", "arrival_time", "departure_time", "stop_id",
                                                    "stop_sequence"]))
        z.writestr("calendar.txt", _table(cal, ["service_id", "monday", "tuesday", "wednesday", "thursday",
                                                "friday", "saturday", "sunday", "start_date", "end_date"]))
        z.writestr("calendar_dates.txt", _table(cal_dates, ["service_id", "date", "exception_type"]))
    return out.getvalue()


GTFS = {
    # Stations are keyed by stop code (no station fold — see the docstring:
    # 11 names belong to two different stations). Trains are numbered by
    # the cut's trip_short_name (route_short_name).
    "indianrailways": (GTFS_URL, lambda r: r["route_type"] == "2" and not _is_freight(r), line,
                       {"make": make_india, "number": number, "tz": TZ}),
}

# India's track (P3): the whole country box; "indianrailways" is the base
# network.
RAIL = {"region": "in", "bbox": BBOX, "network": "indianrailways"}
