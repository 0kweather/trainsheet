"""Chile: a PARTIAL build — Santiago suburban only, EFE Tren Nos +
Tren Rancagua, from the official DTPM GTFS (Red Metropolitana de
Movilidad, https://www.dtpm.cl/descargas/gtfs/GTFS_20260704.zip,
V166.20260704, feed window 2026-07-04 -> 2026-12-31). Merval
(Valparaiso) and Biotren (Concepcion) are out of scope: no keyless
feed exists for either. Calendar ends Dec 31, 2026 — the Monday
refresh must pick up the next file.

SURVEY CORRECTION: the EFE rail routes are NOT route_type 2 — the
feed has zero route_type 2 routes. Rail content is agency MT "EFE
Trenes de Chile", coded route_type 0: MTN "Tren Nos - Estacion
Central" (blue #151CF3) and MTR "Tren Rancagua - Estacion Central"
(amber #F3B015). Filter on agency MT / route_ids MTN+MTR. Do NOT
include Metro de Santiago (route_type 1, 7 routes — a metro, out of
scope) or the 418 bus routes (type 3).

The feed's quirks, repaired by make_chile():
  - Each station is two stops, one per platform ("Estacion Central
    (Anden1)" / "(Anden2)"), with no parent station: folded by name
    (the " (AndenN)" suffix is stripped), so 28 stop ids become 18
    stations — 10 on the Nos line, 8 more south to Rancagua.
  - Tren Nos runs on frequencies.txt: 38 pattern trips (24 weekday,
    10 Saturday, 4 Sunday), every stop time an offset from 00:00,
    expanded into 430 explicit runs. build_schedules.py never expands
    frequencies, so the raw feed would file every Nos run at 00:00.
  - Tren Rancagua is 89 explicit trips with absolute times, in 5 stop
    patterns: the full Central–Rancagua run (10 stops), a short run to
    Paine, a San Bernardo-origin run, and the returns, which run
    express San Bernardo -> Estacion Central (skipping the Nos-line
    stops between them).
  - No public train numbers (trip_short_name is empty everywhere), so
    runs file unnumbered, keyed by direction and first departure.
  - Head-sign "Alameda" is the old name for Estacion Central.

P2 spot checks (from the built files): Tren Nos 06:00 Estacion
Central -> Nos 06:21:56; Tren Rancagua 15:00 Estacion Central ->
Rancagua 16:10 (and the 06:23 San Bernardo-origin run, departing
06:24, -> Rancagua 07:20)."""
import csv, datetime, io, urllib.request, zipfile

UA = "trainsheet-build"
TZ = "America/Santiago"
DTPM_URL = "https://www.dtpm.cl/descargas/gtfs/GTFS_20260704.zip"
# The built region, Estacion Central (-33.45, -70.68) to Rancagua
# (-34.17, -70.75).
BBOX = [-70.85, -34.25, -70.6, -33.4]
CREDIT = {"label": "Timetable from the DTPM official Santiago GTFS (Red Metropolitana de Movilidad, "
                   "feed V166.20260704, 2026-07-04 to 2026-12-31); Tren Nos frequencies expanded",
          "href": "https://www.dtpm.cl/descargas/gtfs/"}
COMMON = {"region": "Chile", "country": "CL", "license": None, "bbox": BBOX, "clip": True}

AGENCIES = {
    "efe": {"name": "EFE Trenes de Chile", "short": "EFE", "color": "#151cf3", "kind": "commuter",
            "cars": "efe", "tz": TZ, "credit": CREDIT, **COMMON},
}
SOURCES = [{"id": "chile", "agencies": ["efe"], "format": "timetable", "interval": 60, "scope": "view"}]


def _get(url, timeout=180):
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


def make_chile(data=None):
    """The DTPM GTFS, fresh at build time, cut to agency MT only, with
    Tren Nos' frequencies expanded into explicit trips (see the
    docstring). data: the feed zip's bytes, for a test (else
    downloaded)."""
    if data is None:
        data = _get(DTPM_URL)
    zf = zipfile.ZipFile(io.BytesIO(data))
    agencies = [a for a in _rows(zf, "agency.txt") if a["agency_id"] == "MT"]
    routes = [r for r in _rows(zf, "routes.txt") if r["agency_id"] == "MT"]
    route_ids = {r["route_id"] for r in routes}
    trips = [t for t in _rows(zf, "trips.txt") if t["route_id"] in route_ids]
    freq = {}
    for f in _rows(zf, "frequencies.txt"):
        freq.setdefault(f["trip_id"], []).append(f)
    stops = {s["stop_id"]: s for s in _rows(zf, "stops.txt")}
    times = {}
    for st in _rows(zf, "stop_times.txt"):
        times.setdefault(st["trip_id"], []).append(st)
    for seq in times.values():
        seq.sort(key=lambda x: int(x["stop_sequence"]))
    services = {t["service_id"] for t in trips}
    cal = [c for c in _rows(zf, "calendar.txt") if c["service_id"] in services]
    cal_dates = [c for c in _rows(zf, "calendar_dates.txt") if c["service_id"] in services]

    # Frequencies into explicit trips (Tren Nos only; Rancagua's trips
    # already carry absolute times and have no frequency rows).
    out_trips, out_times = [], []
    for t in trips:
        pattern = times[t["trip_id"]]
        if t["trip_id"] not in freq:
            out_trips.append(t)
            out_times.extend(pattern)
            continue
        for f in freq[t["trip_id"]]:
            start_s, end_s, head = _secs(f["start_time"]), _secs(f["end_time"]), int(f["headway_secs"])
            dep = start_s
            while dep < end_s:
                tid = f"{t['trip_id']}@{_hms(dep)[:5].replace(':', '')}"
                out_trips.append({**t, "trip_id": tid})
                for x in pattern:
                    off = dep + _secs(x["arrival_time"])
                    out_times.append({"trip_id": tid, "arrival_time": _hms(off),
                                      "departure_time": _hms(off), "stop_id": x["stop_id"],
                                      "stop_sequence": x["stop_sequence"]})
                dep += head
    used_stops = {x["stop_id"] for x in out_times}
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("agency.txt", _table(agencies, ["agency_id", "agency_name", "agency_url", "agency_timezone"]))
        z.writestr("routes.txt", _table(routes, ["route_id", "agency_id", "route_short_name", "route_long_name",
                                                 "route_type", "route_color", "route_text_color"]))
        z.writestr("trips.txt", _table(out_trips, ["route_id", "service_id", "trip_id", "trip_headsign",
                                                   "direction_id"]))
        z.writestr("stops.txt", _table([s for sid, s in stops.items() if sid in used_stops],
                                       ["stop_id", "stop_name", "stop_lat", "stop_lon"]))
        z.writestr("stop_times.txt", _table(out_times, ["trip_id", "arrival_time", "departure_time", "stop_id",
                                                        "stop_sequence"]))
        z.writestr("calendar.txt", _table(cal, ["service_id", "monday", "tuesday", "wednesday", "thursday",
                                                "friday", "saturday", "sunday", "start_date", "end_date"]))
        z.writestr("calendar_dates.txt", _table(cal_dates, ["service_id", "date", "exception_type"]))
    print(f"  chile: {len(routes)} routes, {len(out_trips)} trips ({len(trips)} patterns), "
          f"{len(used_stops)} stops, calendar to 2026-12-31")
    return out.getvalue()


GTFS = {
    "efe": (DTPM_URL, lambda r: r["agency_id"] == "MT",
            lambda r: r["route_long_name"].strip(),
            {"make": make_chile, "tz": TZ, "fold": {"strip": r" \(Anden\d\)$"}}),
}

# Chile's track (P3): the box covers the built agencies.
RAIL = {"region": "cl", "bbox": BBOX, "network": "efe"}
