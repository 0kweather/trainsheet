"""Thailand: a PARTIAL build — Bangkok only, the SRT Red Lines (Dark Red
Krung Thep Aphiwat-Rangsit, Light Red Krung Thep Aphiwat-Taling Chan)
and the Airport Rail Link (Phaya Thai-Suvarnabhumi), both run by SRTET,
from the official OTP Namtang GTFS (Office of Transport and Traffic
Policy and Planning, https://namtang-api.otp.go.th/download/namtang-gtfs.zip,
feed_version 20261122, feed_info window 2026-01-01 -> 2026-12-31;
calendar.txt runs every service to 2026-12-31). The calendar ends Dec 31,
2026 — the weekly refresh must pick up the next file.

Filter: agency SRTET "S.R.T. Electrified Train Company Limited",
route_ids 5 (ARL, route_type 2, #E32020), 2026 (Dark Red Line,
route_type 0, #e10506) and 2027 (Light Red Line, route_type 0, #fd5353).
Like Chile's EFE, the Red Lines are mis-coded route_type 0 (tram), so the
filter is by route id, not by type. Excluded: the BTS (BTSC, route_type 0:
Sukhumvit, Silom, Gold) and the MRT (BEM Blue/Purple, MRTA Yellow/Pink,
route_type 1) — metro / people-mover, out of scope as in Chile — and all
bus and boat routes. Also excluded, by the coordinator's scope: agency SRT
"State Railway of Thailand", 188 route_type 2 routes / 195 trips of
national intercity trains, which the survey believed had no source (this
feed carries them, with absolute times — a survey correction left for
the coordinator to decide on; not built here).

The feed's quirks, repaired by make_thailand():
  - Names are "Thai;English" ("ARL พญาไท;ARL Phaya Thai"): the English
    half is kept, its "ARL "/"SRT " prefix and trailing "(Dark Red Line)"
    / "[Light Red Line]" tag (with mismatched brackets on some) cut;
    "Krung Thep Aphiwat Central Terminal Station" is filed as "Krung Thep
    Aphiwat". One stop per station (no platforms, no parents), 21 in all:
    10 Dark Red (Krung Thep Aphiwat to Rangsit), 3 more on the Light Red
    (Bang Son, Bang Bamru, Taling Chan), 8 ARL.
  - Every run is a frequencies.txt pattern (8 pattern trips: ARL weekday
    and weekend/holiday each way, Red Lines daily each way), stop times
    offsets from 00:00, expanded into explicit runs here
    (build_schedules.py never expands frequencies): a run leaves its
    first stop at the window's start_time and every headway_secs after,
    end_time exclusive.
  - No public train numbers: runs file unnumbered.

P2 spot checks: see STATE.md (from the built files)."""
import csv, io, re, urllib.request, zipfile

UA = "trainsheet-build"
TZ = "Asia/Bangkok"
NAMTANG_URL = "https://namtang-api.otp.go.th/download/namtang-gtfs.zip"
# The built region, Taling Chan (13.79, 100.44) and Rangsit (13.99,
# 100.60) to Suvarnabhumi (13.69, 100.75).
BBOX = [100.35, 13.6, 100.85, 14.1]
CREDIT = {"label": "Timetable from the OTP Namtang official GTFS (Office of Transport and Traffic Policy "
                   "and Planning, feed 20261122, to 2026-12-31); frequencies expanded",
          "href": "https://namtang.otp.go.th/"}
COMMON = {"region": "Thailand", "country": "TH", "license": None, "bbox": BBOX, "clip": True}

AGENCIES = {
    "srtred": {"name": "SRT Red Lines", "short": "Red Line", "color": "#e10506", "kind": "commuter",
               "cars": "srtred", "tz": TZ, "credit": CREDIT, **COMMON},
    "arl": {"name": "Airport Rail Link", "short": "ARL", "color": "#e32020", "kind": "commuter",
            "cars": "arl", "tz": TZ, "credit": CREDIT, **COMMON},
}
SOURCES = [{"id": "thailand", "agencies": list(AGENCIES), "format": "timetable", "interval": 60, "scope": "view"}]

AGENCY_ID = "SRTET"
ROUTES = {"5": "arl", "2026": "srtred", "2027": "srtred"}


def _get(url, timeout=300):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def _hms(secs):
    h, m, s = secs // 3600, (secs // 60) % 60, secs % 60
    return f"{h:02d}:{m:02d}:{s:02d}"


def _secs(hms):
    h, m, s = (int(x) for x in hms.split(":"))
    return h * 3600 + m * 60 + s


def _rows(zf, name):
    with zf.open(name) as f:
        yield from csv.DictReader(io.TextIOWrapper(f, "utf-8-sig"))


def _table(rows, cols):
    buf = io.StringIO()
    w = csv.DictWriter(buf, cols, extrasaction="ignore", lineterminator="\n")
    w.writeheader()
    w.writerows(rows)
    return buf.getvalue()


_TAG = re.compile(r"\s*[\[(][^\[\]()]*[\])]\s*$")


def english(name):
    """The English half of a "Thai;English" name."""
    return name.rsplit(";", 1)[-1].strip()


def stop_name(name):
    """"SRT Thung Song Hong [Dark Red Line)" -> "Thung Song Hong"."""
    name = _TAG.sub("", english(name))
    name = re.sub(r"^(ARL|SRT)\s+", "", name)
    return re.sub(r"\s+Central Terminal Station$", "", name).strip()


def make_thailand(data=None):
    """The Namtang GTFS, fresh at build time, cut to SRTET's three rail
    routes, names in English, frequencies expanded into explicit trips
    (see the docstring). data: the feed zip's bytes, for a test (else
    downloaded). The big files (shapes, fares) are never read; the rest
    are streamed and filtered row by row."""
    if data is None:
        data = _get(NAMTANG_URL)
    zf = zipfile.ZipFile(io.BytesIO(data))
    agencies = [a for a in _rows(zf, "agency.txt") if a["agency_id"] == AGENCY_ID]
    for a in agencies:
        a["agency_name"] = english(a["agency_name"])
    routes = [r for r in _rows(zf, "routes.txt") if r["agency_id"] == AGENCY_ID and r["route_id"] in ROUTES]
    for r in routes:
        r["route_long_name"] = english(r["route_long_name"])
        r["route_color"] = r["route_color"].lower()
    trips = [t for t in _rows(zf, "trips.txt") if t["route_id"] in ROUTES]
    trip_ids = {t["trip_id"] for t in trips}
    for t in trips:
        t["trip_headsign"] = stop_name(t["trip_headsign"])
    freq = {}
    for f in _rows(zf, "frequencies.txt"):
        if f["trip_id"] in trip_ids:
            freq.setdefault(f["trip_id"], []).append(f)
    times = {}
    for st in _rows(zf, "stop_times.txt"):
        if st["trip_id"] in trip_ids:
            times.setdefault(st["trip_id"], []).append(st)
    for seq in times.values():
        seq.sort(key=lambda x: int(x["stop_sequence"]))
    used_stops = {x["stop_id"] for seq in times.values() for x in seq}
    stops = [{**s, "stop_name": stop_name(s["stop_name"])} for s in _rows(zf, "stops.txt") if s["stop_id"] in used_stops]
    services = {t["service_id"] for t in trips}
    cal = [c for c in _rows(zf, "calendar.txt") if c["service_id"] in services]
    cal_dates = [c for c in _rows(zf, "calendar_dates.txt") if c["service_id"] in services]

    # Frequencies into explicit trips: each pattern's times are offsets
    # from its run's first departure.
    out_trips, out_times = [], []
    for t in trips:
        pattern = times[t["trip_id"]]
        if t["trip_id"] not in freq:
            out_trips.append(t)
            out_times.extend(pattern)
            continue
        base = _secs(pattern[0]["departure_time"])
        for f in freq[t["trip_id"]]:
            start_s, end_s, head = _secs(f["start_time"]), _secs(f["end_time"]), int(f["headway_secs"])
            dep = start_s
            while dep < end_s:
                tid = f"{t['trip_id']}@{_hms(dep)[:5].replace(':', '')}"
                out_trips.append({**t, "trip_id": tid})
                for x in pattern:
                    out_times.append({"trip_id": tid,
                                      "arrival_time": _hms(dep - base + _secs(x["arrival_time"])),
                                      "departure_time": _hms(dep - base + _secs(x["departure_time"])),
                                      "stop_id": x["stop_id"], "stop_sequence": x["stop_sequence"]})
                dep += head
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("agency.txt", _table(agencies, ["agency_id", "agency_name", "agency_url", "agency_timezone"]))
        z.writestr("routes.txt", _table(routes, ["route_id", "agency_id", "route_short_name", "route_long_name",
                                                 "route_type", "route_color"]))
        z.writestr("trips.txt", _table(out_trips, ["route_id", "service_id", "trip_id", "trip_headsign",
                                                   "direction_id"]))
        z.writestr("stops.txt", _table(stops, ["stop_id", "stop_name", "stop_lat", "stop_lon"]))
        z.writestr("stop_times.txt", _table(out_times, ["trip_id", "arrival_time", "departure_time", "stop_id",
                                                        "stop_sequence"]))
        z.writestr("calendar.txt", _table(cal, ["service_id", "monday", "tuesday", "wednesday", "thursday",
                                                "friday", "saturday", "sunday", "start_date", "end_date"]))
        z.writestr("calendar_dates.txt", _table(cal_dates, ["service_id", "date", "exception_type"]))
    end = max((c["end_date"] for c in cal), default="?")
    print(f"  thailand: {len(routes)} routes, {len(out_trips)} trips ({len(trips)} patterns), "
          f"{len(stops)} stops, calendar to {end}")
    return out.getvalue()


def station(name):
    """(station id, name) for a stop's name as made (one stop per station):
    "Krung Thep Aphiwat" -> ("krung-thep-aphiwat", "Krung Thep Aphiwat")."""
    return re.sub(r"[^a-z0-9]+", "-", name.strip().lower()).strip("-"), name.strip()


GTFS = {
    agency: (NAMTANG_URL, lambda r, a=agency: ROUTES.get(r["route_id"]) == a and r["agency_id"] == AGENCY_ID,
             lambda r: r["route_long_name"].strip(), station,
             {"make": make_thailand, "tz": TZ})
    for agency in AGENCIES
}

# Thailand's track (P3) is not built yet: add RAIL = {"region": "th",
# "bbox": BBOX, ...} then. The region is "th" from the agencies' country.
