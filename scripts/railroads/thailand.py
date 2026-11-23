"""Thailand: a PARTIAL build — Bangkok only, the SRT Red Lines (Dark Red
Krung Thep Aphiwat-Rangsit, Light Red Krung Thep Aphiwat-Taling Chan),
the Airport Rail Link (Phaya Thai-Suvarnabhumi), both run by SRTET, and
the SRT Mahachai line (Wongwian Yai-Maha Chai), from the official OTP
Namtang GTFS (Office of Transport and Traffic Policy and Planning,
https://namtang-api.otp.go.th/download/namtang-gtfs.zip, feed_version
20261122, feed_info window 2026-01-01 -> 2026-12-31; calendar.txt runs
every service to 2026-12-31). The calendar ends Dec 31, 2026 — the
weekly refresh must pick up the next file.

Filter: agency SRTET "S.R.T. Electrified Train Company Limited",
route_ids 5 (ARL, route_type 2, #E32020), 2026 (Dark Red Line,
route_type 0, #e10506) and 2027 (Light Red Line, route_type 0, #fd5353).
Like Chile's EFE, the Red Lines are mis-coded route_type 0 (tram), so the
filter is by route id, not by type. Excluded: the BTS (BTSC, route_type 0:
Sukhumvit, Silom, Gold) and the MRT (BEM Blue/Purple, MRTA Yellow/Pink,
route_type 1) — metro / people-mover, out of scope as in Chile — and all
bus and boat routes. Also excluded, by the coordinator's scope: the rest of
agency SRT "State Railway of Thailand", 188 route_type 2 routes / 195
trips of national intercity trains — the P1b/P2b investigation (STATE.md)
proved them unusable in this feed (stubs truncated at the planner's
coverage boundary, or complete stop lists with 1-minute-per-stop
placeholder times). Only the Mahachai line is built from SRT: routes
213-246, trains 4302-4347, 34 trips a day, all daily (svc 3), 18 stations,
a complete real suburban service — EXCEPT trip 228 (train 4346, 19:00
Maha Chai -> Wongwian Yai), which is itself a 1-minute-per-stop
placeholder run and is dropped. Train numbers come from route_short_name,
written into the cut's trip_short_name.

One make for the shared URL: feeds.py keys MAKE by download URL, and all
three agencies share the Namtang URL, so make_thailand() cuts the union
(SRTET's three routes + the Mahachai routes) and every agency's GTFS entry
names it. make_mahachai() is the same cut restricted to the Mahachai
routes, as a standalone converter (used by make_thailand() and by tests).

The feed's quirks, repaired by make_thailand():
  - Names are "Thai;English" ("ARL พญาไท;ARL Phaya Thai"): the English
    half is kept, its "ARL "/"SRT " prefix and trailing "(Dark Red Line)"
    / "[Light Red Line]" tag (with mismatched brackets on some) cut;
    "Krung Thep Aphiwat Central Terminal Station" is filed as "Krung Thep
    Aphiwat". One stop per station (no platforms, no parents), 21 in all
    for SRTET (10 Dark Red, 3 more Light Red, 8 ARL) and 18 for Mahachai.
  - Every SRTET run is a frequencies.txt pattern (8 pattern trips: ARL
    weekday and weekend/holiday each way, Red Lines daily each way), stop
    times offsets from 00:00, expanded into explicit runs here
    (build_schedules.py never expands frequencies): a run leaves its
    first stop at the window's start_time and every headway_secs after,
    end_time exclusive. The Mahachai trips carry absolute times and no
    frequencies, so they pass through unchanged.
  - No public train numbers for SRTET: runs file unnumbered. Mahachai
    trains are numbered (route_short_name).

P2 spot checks: see STATE.md (from the built files)."""
import csv, io, re, urllib.request, zipfile

UA = "trainsheet-build"
TZ = "Asia/Bangkok"
NAMTANG_URL = "https://namtang-api.otp.go.th/download/namtang-gtfs.zip"
# The built region: Maha Chai (13.55, 100.28) in the southwest to Rangsit
# (13.99, 100.60) and Suvarnabhumi (13.69, 100.75). The Mahachai line's
# four southwestern stations sit outside the old Bangkok-only box.
BBOX = [100.25, 13.53, 100.85, 14.1]
CREDIT = {"label": "Timetable from the OTP Namtang official GTFS (Office of Transport and Traffic Policy "
                   "and Planning, feed 20261122, to 2026-12-31); frequencies expanded",
          "href": "https://namtang.otp.go.th/"}
COMMON = {"region": "Thailand", "country": "TH", "license": None, "bbox": BBOX, "clip": True}

AGENCIES = {
    "srtred": {"name": "SRT Red Lines", "short": "Red Line", "color": "#e10506", "kind": "commuter",
               "cars": "srtred", "tz": TZ, "credit": CREDIT, **COMMON},
    "arl": {"name": "Airport Rail Link", "short": "ARL", "color": "#e32020", "kind": "commuter",
            "cars": "arl", "tz": TZ, "credit": CREDIT, **COMMON},
    "mahachai": {"name": "Mahachai Line", "short": "Mahachai", "color": "#b22222", "kind": "commuter",
                 "cars": "mahachai", "tz": TZ, "credit": CREDIT, **COMMON},
}
SOURCES = [{"id": "thailand", "agencies": list(AGENCIES), "format": "timetable", "interval": 60, "scope": "view"}]

AGENCY_ID = "SRTET"
ROUTES = {"5": "arl", "2026": "srtred", "2027": "srtred"}
# The Mahachai line (SRT): one route per train, route_short_name is the
# train number (4302-4347). Trip 228 (train 4346, 19:00 Maha Chai ->
# Wongwian Yai) is a 1-minute-per-stop placeholder run: dropped.
MAHACHAI_ROUTES = {str(i) for i in range(213, 247)}
MAHACHAI_EXCLUDE_TRIPS = {"228"}


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


def _write_gtfs(agencies, routes, trips, times, stops, cal, cal_dates):
    """The cut rows as a GTFS zip's bytes. trips carry trip_short_name
    (the Mahachai trains' numbers; empty for the unnumbered SRTET runs)."""
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


def _cut(zf, agency_ids, route_ids, exclude_trips=frozenset(), numbered=False):
    """One agency's cut of the raw feed: its agency rows, routes, trips
    (with trip_short_name set from route_short_name when numbered), their
    stop times and stops, and the services they use. The big files
    (shapes, fares) are never read; the rest are streamed and filtered
    row by row."""
    agencies = [a for a in _rows(zf, "agency.txt") if a["agency_id"] in agency_ids]
    for a in agencies:
        a["agency_name"] = english(a["agency_name"])
    routes = [r for r in _rows(zf, "routes.txt") if r["agency_id"] in agency_ids and r["route_id"] in route_ids]
    for r in routes:
        r["route_long_name"] = english(r["route_long_name"])
        r["route_color"] = r["route_color"].lower()
    by_route = {r["route_id"]: r for r in routes}
    trips = [t for t in _rows(zf, "trips.txt") if t["route_id"] in route_ids and t["trip_id"] not in exclude_trips]
    trip_ids = {t["trip_id"] for t in trips}
    for t in trips:
        t["trip_headsign"] = stop_name(t["trip_headsign"])
        t["trip_short_name"] = by_route[t["route_id"]].get("route_short_name", "") if numbered else ""
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
    return agencies, routes, trips, [x for seq in times.values() for x in seq], stops, cal, cal_dates


def _merge(cuts):
    """Several _cut() results as one: agencies/routes/trips/stops/calendars
    concatenated (stop times flattened), each row kept once by its id.
    A cut's stop times may be a {trip_id: [rows]} dict or a flat list
    (the SRTET cut's frequency-expanded rows)."""
    agencies, routes, trips, times, stops, cal, cal_dates = [], [], [], [], [], [], []
    seen = {k: set() for k in ("agency", "route", "trip", "stop", "service", "times", "caldate")}
    for a, r, t, tm, s, c, cd in cuts:
        for x in a:
            if x["agency_id"] not in seen["agency"]:
                seen["agency"].add(x["agency_id"])
                agencies.append(x)
        for x in r:
            if x["route_id"] not in seen["route"]:
                seen["route"].add(x["route_id"])
                routes.append(x)
        for x in t:
            if x["trip_id"] not in seen["trip"]:
                seen["trip"].add(x["trip_id"])
                trips.append(x)
        if isinstance(tm, dict):
            for tid, seq in tm.items():
                if tid not in seen["times"]:
                    seen["times"].add(tid)
                    times.extend(seq)
        else:
            times.extend(tm)
        for x in s:
            if x["stop_id"] not in seen["stop"]:
                seen["stop"].add(x["stop_id"])
                stops.append(x)
        for x in c:
            if x["service_id"] not in seen["service"]:
                seen["service"].add(x["service_id"])
                cal.append(x)
        for x in cd:
            key = (x["service_id"], x["date"], x["exception_type"])
            if key not in seen["caldate"]:
                seen["caldate"].add(key)
                cal_dates.append(x)
    return agencies, routes, trips, times, stops, cal, cal_dates


def make_mahachai(data=None):
    """The Mahachai line only (SRT routes 213-246, trains 4302-4347),
    trip 228 excluded (placeholder times), fetched fresh at build time
    from the same Namtang GTFS. data: the feed zip's bytes, for a test
    (else downloaded)."""
    if data is None:
        data = _get(NAMTANG_URL)
    zf = zipfile.ZipFile(io.BytesIO(data))
    agencies, routes, trips, times, stops, cal, cal_dates = _cut(zf, {"SRT"}, MAHACHAI_ROUTES, MAHACHAI_EXCLUDE_TRIPS,
                                                              numbered=True)
    end = max((c["end_date"] for c in cal), default="?")
    print(f"  mahachai: {len(routes)} routes, {len(trips)} trips, {len(stops)} stops, calendar to {end}")
    return _write_gtfs(agencies, routes, trips, times, stops, cal, cal_dates)


def make_thailand(data=None):
    """The Namtang GTFS, fresh at build time, cut to SRTET's three rail
    routes plus the SRT Mahachai line (see the docstring): one zip serving
    all three agencies, because feeds.py keys MAKE by URL. data: the feed
    zip's bytes, for a test (else downloaded)."""
    if data is None:
        data = _get(NAMTANG_URL)
    zf = zipfile.ZipFile(io.BytesIO(data))
    srtet = _cut(zf, {AGENCY_ID}, set(ROUTES))
    # The SRTET cut's frequencies.txt patterns are expanded into explicit
    # trips below (build_schedules.py never expands frequencies): a run
    # leaves its first stop at the window's start_time and every
    # headway_secs after, end_time exclusive.
    agencies, routes, trips, times, stops, cal, cal_dates = _merge([srtet])
    freq = {}
    for f in _rows(zf, "frequencies.txt"):
        if f["trip_id"] in {t["trip_id"] for t in trips}:
            freq.setdefault(f["trip_id"], []).append(f)
    times_by_trip = {}
    for x in times:
        times_by_trip.setdefault(x["trip_id"], []).append(x)
    out_trips, out_times = [], []
    for t in trips:
        pattern = times_by_trip[t["trip_id"]]
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
    maha = _cut(zf, {"SRT"}, MAHACHAI_ROUTES, MAHACHAI_EXCLUDE_TRIPS, numbered=True)
    agencies, routes, trips, times, stops, cal, cal_dates = _merge([
        (agencies, routes, out_trips, out_times, stops, cal, cal_dates), maha])
    end = max((c["end_date"] for c in cal), default="?")
    print(f"  thailand: {len(routes)} routes, {len(trips)} trips ({len(srtet[2])} SRTET patterns), "
          f"{len(stops)} stops, calendar to {end}")
    return _write_gtfs(agencies, routes, trips, times, stops, cal, cal_dates)


def station(name):
    """(station id, name) for a stop's name as made (one stop per station):
    "Krung Thep Aphiwat" -> ("krung-thep-aphiwat", "Krung Thep Aphiwat")."""
    return re.sub(r"[^a-z0-9]+", "-", name.strip().lower()).strip("-"), name.strip()


GTFS = {
    "srtred": (NAMTANG_URL, lambda r: r["agency_id"] == AGENCY_ID and ROUTES.get(r["route_id"]) == "srtred",
               lambda r: r["route_long_name"].strip(), station, {"make": make_thailand, "tz": TZ}),
    "arl": (NAMTANG_URL, lambda r: r["agency_id"] == AGENCY_ID and ROUTES.get(r["route_id"]) == "arl",
            lambda r: r["route_long_name"].strip(), station, {"make": make_thailand, "tz": TZ}),
    # The Mahachai line is one line whatever the direction: the route
    # long names are the two directions ("Maha Chai - Wongwian Yai" /
    # "Wongwian Yai - Maha Chai"). Trains are numbered from the cut's
    # trip_short_name (route_short_name, 4302-4347).
    "mahachai": (NAMTANG_URL, lambda r: r["agency_id"] == "SRT" and r["route_id"] in MAHACHAI_ROUTES,
                 lambda r: "Mahachai Line", station,
                 {"make": make_thailand, "number": lambda t: t.get("trip_short_name") or None, "tz": TZ}),
}

# Thailand's track (P3) is not built yet: add RAIL = {"region": "th",
# "bbox": BBOX, ...} then. The region is "th" from the agencies' country.
