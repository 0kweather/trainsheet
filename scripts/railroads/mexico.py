"""Mexico: a PARTIAL build — no national feed exists, so four separate
sources feed one region ("mx", agencies suburbano, insurgente, fit, chepe).
Tren Maya is PARKED (no published intermediate stop times; do not
hand-enter; see RESEARCH.md) and Tequila Express is out of scope (Alex's
call). Timezones: America/Mexico_City for the CDMX services and FIT;
Chepe crosses America/Mazatlan (Sinaloa) and America/Chihuahua.

1. CDMX (suburbano + insurgente): the official CDMX open-data GTFS
(SEMOVI, agency SUB "Ferrocarriles Suburbanos" and INTERURBANO "Tren El
Insurgente"). The live datos.cdmx.gob.mx download is geo-restricted —
unreachable from this VM (connection fails outright; the Mobility
Database notes the new feed version is geo-fenced and redirects to the
old one) — so make_cdmx() fetches the Mobility Database archived copy
(mdb-1830, latest.zip; extracted 2026-03-09, 2,397,374 B) and repairs it:
  - Its calendars end 2025-12-31, so the calendar is renewed (start =
    build date, end = build date + 180 days; the Monday refresh renews it
    again) and its frequency rows are expanded into explicit trips with
    absolute times (build_schedules.py reads stop_times as absolute times
    and never expands frequencies.txt, so the raw feed would file every
    run at 00:00).
  - Its Insurgente route ends at Santa Fe; the Santa Fe–Observatorio
    section opened Feb 2, 2026 (57.7 km, 7 stations, ~50 min end to end
    per the ARTF head; 40–50 min in the press). The pattern is extended
    two stations — Vasco de Quiroga (Wikidata Q119598542: 19.384971,
    -99.236091) and Observatorio (Wikipedia "Observatorio railway
    station": 19.398594, -99.200763) — with legs Santa Fe → Vasco de
    Quiroga 3:30 and Vasco de Quiroga → Observatorio 3:45 (8.4 km at the
    feed's own pace plus a dwell), giving 43:58 end to end, inside the
    published 40–50 min. OSM has no station nodes for either yet (checked
    Nov 23, 2026), so the coordinates come from Wikidata/Wikipedia.
  - The Suburbano AIFA branch (Lechería–AIFA, opened Apr 26, 2026) is
    NOT in any feed and is left out: fsuburbanos.com/horarios publishes
    no per-station times (JS-rendered page, no usable static content),
    so modeling it would be hand-entered times. Recorded gap, not a
    silent omission.
  - The feed's SUB route is filed as route_type 1 (not 2) — the earlier
    recon filtered on type 2 and missed it entirely.
  Feed contents (archived copy): INTERURBANO 1 route, 2 frequency
  patterns (06:00–23:00 every 900 s, daily); SUB 1 route, 6 patterns
  (weekday 05:00–24:30, Sat 06:00–24:30, Sun 07:00–24:30, every 300 s).
  Expanded: 1,468 explicit trips (1,332 Suburbano + 136 Insurgente).
  Both are frequency services with no public train numbers, so they file
  unnumbered (runs keyed by direction and first departure).

2. FIT (fit): the Tren Interoceánico's own booking API,
https://api.istmotren.com/v1/ — endpoints discovered from the booking
SPA's JS bundle (chunk-BTBAUN3K.js): GET /v1/runs/catalog[?lineId=N]
(stations per line), GET /v1/runs/calendar?originId&destinationId
(bookable dates), GET
/v1/runs/itinerary?originId&destinationId&date=DD/MM/YYYY&lineId (runs
for a date). Catalog verified live Nov 23, 2026: 4 active lines — Z
(Coatzacoalcos–Salina Cruz, 10 stations), FA (Coatzacoalcos–Pakal Ná,
9), K (Salina Cruz–Tonalá, 11), Tehuanito Sur (Salina Cruz–Unión
Hidalgo, 7). BUT passenger service is SUSPENDED since the fatal
Dec 28, 2025 derailment (14 dead): /runs/calendar returns data: [] for
every line's termini and /runs/itinerary answers HTTP 500 for every date
in a 70-day sweep (Nov 23, 2026 – Jan 31, 2027), because the server finds
no schedule row for any date; press (Oct–Nov 2026) confirms ticket sales
suspended, test runs only, restart unconfirmed (Q1 2027 per El Imparcial;
safety works contracted Oct 16, 2026 – Sep 30, 2027). RESEARCH.md's "in
service in Nov 2026" was wrong — the catalog lists lines as active, but
no runs are bookable. make_fit() therefore raises while the API shows no
bookable dates, so no dead timetable ships; the Monday refresh re-probes
and FIT appears automatically when service resumes. Two gaps to close
then: the catalog carries no station coordinates (they will have to come
from OSM/Nominatim), and the itinerary response shape is unverified
(no successful response exists to parse against yet). fit is in AGENCIES
and GTFS but NOT in SOURCES while it has no trains.

3. Chepe Express (chepe): official HTML tables on
https://chepe.mx/tren/horarios/ (fetched fresh at build time): Los
Mochis 7:00 → Creel 17:40 Mon/Thu/Sat, Creel 8:00 → Los Mochis 16:40
Tue/Fri/Sun, 5 stops. Chepe Regional is NOT included: its timetable is
an image (chepe.mx/wp-content/uploads/2026/08/imagen.png), not HTML.
Chepe's published times are local station times and the line crosses
two zones (Sinaloa America/Mazatlan, Chihuahua America/Chihuahua,
1 h apart — the 10 h 40 m of printed time is 9 h 40 m elapsed). The
site's schedule files carry one tz and render each stop in its own
stop_timezone, so the converter normalizes every stop time to
America/Mazatlan wall-clock minutes (Chihuahua stations minus 60 min)
and files stop_timezone per stop; the GTFS stop_times are therefore
Mazatlan-normalized, not station-local — documented here because it
deviates from GTFS. Station coordinates: Los Mochis and Bahuichivo
from OSM railway=station nodes; Divisadero from OSM's "Posada
Barrancas" node (the Divisadero stop); Creel from Wikipedia
("Estación de Creel-Sierra Tarahumara", 27.7546, -107.6347); El Fuerte
has no OSM station node, so it is placed on the OSM track at its
closest approach to the town (26.36835, -108.58787, 6.1 km SE of the
town centre) — an approximation to refine in P3 from the OSM extract.

P2 spot checks (from the built files): Suburbano 05:00 Buenavista →
Cuautitlán 05:43:56; Insurgente 06:00 Zinacantepec → Observatorio
06:43:58; Chepe Express Mon 07:00 Los Mochis → 16:40 Creel (Mazatlan
minutes; 17:40 local)."""
import csv, datetime, io, re, unicodedata, urllib.request, zipfile

UA = "trainsheet-build"
TZ_CDMX = "America/Mexico_City"
TZ_MAZ = "America/Mazatlan"
TZ_CHIH = "America/Chihuahua"
CDMX_LIVE = ("https://datos.cdmx.gob.mx/dataset/75538d96-3ade-4bc5-ae7d-d85595e4522d/resource/"
             "32ed1b6b-41cd-49b3-b7f0-b57acb0eb819/download/gtfs-2.zip")
CDMX_URL = "https://files.mobilitydatabase.org/mdb-1830/latest.zip"
FIT_API = "https://api.istmotren.com/v1"
CHEPE_URL = "https://chepe.mx/tren/horarios/"
# The CDMX region, from the Chepe's Los Mochis (-108.97) to the CDMX
# services (-99.15), Zinacantepec (19.28) to Creel (27.75).
BBOX = [-109.1, 19.15, -99.0, 27.9]
CREDIT_CDMX = {"label": "Timetable from the CDMX open-data GTFS (SEMOVI, via Mobility Database mdb-1830; "
                        "live feed geo-restricted), calendars renewed and El Insurgente extended to Observatorio",
               "href": "https://datos.cdmx.gob.mx/dataset/gtfs"}
CREDIT_FIT = {"label": "Timetable from the Tren Interoceánico booking API (api.istmotren.com); "
                       "passenger service suspended since Dec 28, 2025",
              "href": "https://www.pasajerosinteroceanico.com.mx/"}
CREDIT_CHEPE = {"label": "Timetable from chepe.mx (Ferromex official site, Chepe Express horarios)",
                "href": "https://chepe.mx/tren/horarios/"}
COMMON = {"region": "Mexico", "country": "MX", "license": None, "bbox": BBOX, "clip": True}

AGENCIES = {
    "suburbano": {"name": "Tren Suburbano", "short": "Suburbano", "color": "#ff0000", "kind": "commuter",
                  "cars": "suburbano", "tz": TZ_CDMX, "credit": CREDIT_CDMX, **COMMON},
    "insurgente": {"name": "El Insurgente", "short": "Insurgente", "color": "#83332e", "kind": "commuter",
                   "cars": "insurgente", "tz": TZ_CDMX, "credit": CREDIT_CDMX, **COMMON},
    "fit": {"name": "Tren Interoceánico", "short": "Interoceánico", "color": "#0b3d91", "kind": "intercity",
            "cars": "fit", "tz": TZ_CDMX, "credit": CREDIT_FIT, **COMMON},
    "chepe": {"name": "Chepe Express", "short": "Chepe", "color": "#e87722", "kind": "intercity",
              "cars": "chepe", "tz": TZ_MAZ, "credit": CREDIT_CHEPE, **COMMON},
}
# fit is out until its API shows bookable dates (see the docstring).
SOURCES = [{"id": "mexico", "agencies": ["suburbano", "insurgente", "chepe"],
            "format": "timetable", "interval": 60, "scope": "view"}]


def slug(name):
    """A name as an id ("Toluca Centro" -> "toluca-centro", "Lechería" ->
    "lecheria"), accents dropped."""
    low = unicodedata.normalize("NFKD", name.strip().lower())
    if all(c.isascii() or unicodedata.name(c, "").startswith("LATIN") for c in low if c.isalnum()):
        return re.sub(r"[^a-z0-9]+", "-", low.encode("ascii", "ignore").decode()).strip("-")
    return re.sub(r"-+", "-", "".join(c if c.isalnum() or unicodedata.combining(c) else "-"
                                      for c in unicodedata.normalize("NFC", low))).strip("-")


def station(name):
    """(station id, name) for a stop's name as filed."""
    return slug(name), name.strip()


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


# ---------- CDMX: the archived GTFS, repaired ----------
# The two stations the archived feed predates (see the docstring): (stop
# id, name, lat, lon) and the legs from Santa Fe, in seconds.
INS_EXTENSION = [("B_100001-VASCO", "Vasco de Quiroga", 19.384971, -99.236091, 210),
                 ("B_100001-OBS", "Observatorio", 19.398594, -99.200763, 225)]
CDMX_AGENCIES = {"SUB": "suburbano", "INTERURBANO": "insurgente"}


def make_cdmx(data=None):
    """The CDMX GTFS as a repaired GTFS zip (see the docstring): SUB +
    INTERURBANO only, calendars renewed from today, frequencies expanded
    into explicit trips, Insurgente extended to Observatorio. data: the
    archived zip's bytes, for a test (else downloaded, live first)."""
    if data is None:
        try:
            data = _get(CDMX_LIVE, timeout=30)
            print("  mexico/cdmx: live datos.cdmx.gob.mx download worked")
        except Exception as err:
            print(f"  mexico/cdmx: live download failed ({err}); using the Mobility Database archived copy")
            data = _get(CDMX_URL)
    zf = zipfile.ZipFile(io.BytesIO(data))
    today = datetime.date.today()
    start, end = today, today + datetime.timedelta(days=180)
    agencies = [a for a in _rows(zf, "agency.txt") if a["agency_id"] in CDMX_AGENCIES]
    routes = [r for r in _rows(zf, "routes.txt") if r["agency_id"] in CDMX_AGENCIES]
    for r in routes:
        if r["agency_id"] == "INTERURBANO":
            r["route_long_name"] = "Zinacantepec - Observatorio"
    trips = [t for t in _rows(zf, "trips.txt") if t["route_id"] in {r["route_id"] for r in routes}]
    freq = {}
    for f in _rows(zf, "frequencies.txt"):
        freq.setdefault(f["trip_id"], []).append(f)
    stops = {s["stop_id"]: s for s in _rows(zf, "stops.txt")}
    times = {}
    for st in _rows(zf, "stop_times.txt"):
        times.setdefault(st["trip_id"], []).append(st)
    for seq in times.values():
        seq.sort(key=lambda x: int(x["stop_sequence"]))
    cal = {c["service_id"]: c for c in _rows(zf, "calendar.txt")}
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    new_cal = [{**c, "start_date": start.strftime("%Y%m%d"), "end_date": end.strftime("%Y%m%d")}
               for c in cal.values() if c["service_id"] in {t["service_id"] for t in trips}]

    # The Insurgente patterns, extended two stations (both directions).
    ins_routes = {r["route_id"] for r in routes if r["agency_id"] == "INTERURBANO"}
    ext = {sid: (name, lat, lon) for sid, name, lat, lon, _ in INS_EXTENSION}
    for sid, (name, lat, lon) in ext.items():
        stops[sid] = {"stop_id": sid, "stop_name": name, "stop_lat": str(lat), "stop_lon": str(lon)}
    legs = [leg for *_, leg in INS_EXTENSION]
    total_ext = sum(legs)
    for t in trips:
        if t["route_id"] not in ins_routes:
            continue
        seq = times[t["trip_id"]]
        last = _secs(seq[-1]["arrival_time"])
        direction = seq[0]["stop_id"] == "B_100001-ZINAC"  # Zinacantepec-first: extend at the end
        if direction:
            for i, (sid, *_rest) in enumerate(INS_EXTENSION):
                off = last + sum(legs[:i + 1])
                seq.append({"trip_id": t["trip_id"], "arrival_time": _hms(off), "departure_time": _hms(off),
                            "stop_id": sid, "stop_sequence": str(len(seq) + 1)})
            t["trip_headsign"] = "Observatorio"
        else:
            # Return: Observatorio first, then Vasco, then the feed's stops
            # in their original order, every offset shifted by the 7:15
            # extension (end to end 43:58 either way).
            new = [{"trip_id": t["trip_id"], "arrival_time": _hms(0), "departure_time": _hms(0),
                    "stop_id": INS_EXTENSION[-1][0], "stop_sequence": "1"},
                   {"trip_id": t["trip_id"], "arrival_time": _hms(legs[-1]), "departure_time": _hms(legs[-1]),
                    "stop_id": INS_EXTENSION[0][0], "stop_sequence": "2"}]
            for x in seq:
                off = total_ext + _secs(x["arrival_time"])
                new.append({"trip_id": t["trip_id"], "arrival_time": _hms(off), "departure_time": _hms(off),
                            "stop_id": x["stop_id"], "stop_sequence": str(len(new) + 1)})
            times[t["trip_id"]] = new
            t["trip_headsign"] = "Zinacantepec"

    # Frequencies into explicit trips.
    out_trips, out_times = [], []
    for t in trips:
        pattern = times[t["trip_id"]]
        for f in freq.get(t["trip_id"], []):
            start_s, end_s, head = _secs(f["start_time"]), _secs(f["end_time"]), int(f["headway_secs"])
            dep = start_s
            while dep < end_s:
                tid = f"{t['trip_id']}@{_hms(dep)[:5].replace(':', '')}"
                out_trips.append({**t, "trip_id": tid, "direction_id": "1" if t.get("direction_id", "").startswith("1") else "0"})
                for x in pattern:
                    off = _secs(x["arrival_time"])
                    out_times.append({"trip_id": tid, "arrival_time": _hms(dep + off),
                                      "departure_time": _hms(dep + off), "stop_id": x["stop_id"],
                                      "stop_sequence": x["stop_sequence"]})
                dep += head
    used_stops = {x["stop_id"] for x in out_times}
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("agency.txt", _table(agencies, ["agency_id", "agency_name", "agency_url", "agency_timezone"]))
        z.writestr("routes.txt", _table(routes, ["route_id", "agency_id", "route_short_name", "route_long_name",
                                                 "route_type", "route_color"]))
        z.writestr("trips.txt", _table(out_trips, ["route_id", "service_id", "trip_id", "trip_headsign", "direction_id"]))
        z.writestr("stops.txt", _table([s for sid, s in stops.items() if sid in used_stops],
                                       ["stop_id", "stop_name", "stop_lat", "stop_lon"]))
        z.writestr("stop_times.txt", _table(out_times, ["trip_id", "arrival_time", "departure_time", "stop_id",
                                                        "stop_sequence"]))
        z.writestr("calendar.txt", _table(new_cal, ["service_id"] + days + ["start_date", "end_date"]))
    print(f"  mexico/cdmx: {len(routes)} routes, {len(out_trips)} trips, {len(used_stops)} stops, "
          f"calendar {start} -> {end}")
    return out.getvalue()


# ---------- FIT: the booking API (suspended — see the docstring) ----------
def _api(path, params=None):
    url = FIT_API + path
    if params:
        url += "?" + "&".join(f"{k}={v}" for k, v in params.items())
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        import json
        return json.load(r)


def make_fit():
    """FIT's runs from its booking API. Raises while passenger service is
    suspended (no bookable dates), so no dead timetable ships; the Monday
    refresh re-probes and the railroad appears when service resumes."""
    catalog = _api("/runs/catalog")
    lines = [ln for ln in catalog["data"]["lines"] if ln.get("active")]
    runs = []
    for ln in lines:
        line_id = ln["id"]
        cat = _api("/runs/catalog", {"lineId": line_id})
        stations = cat["data"]["stations"]
        if not stations:
            continue
        cal = _api("/runs/calendar", {"originId": stations[0]["id"], "destinationId": stations[-1]["id"]})
        dates = cal.get("data") or []
        if not dates:
            continue
        for date in dates:
            itin = _api("/runs/itinerary", {"originId": stations[0]["id"], "destinationId": stations[-1]["id"],
                                            "date": date, "lineId": line_id})
            runs.extend(itin.get("data") or [])
    if not runs:
        raise RuntimeError("FIT passenger service suspended: its booking API lists 4 active lines but "
                           "/runs/calendar is empty for every line and /runs/itinerary 500s on every date "
                           "(no schedules loaded since the Dec 28, 2025 derailment); nothing to build")
    raise RuntimeError(f"FIT API returned {len(runs)} runs but their shape is unverified — "
                       "the itinerary response has never been seen with data; inspect one before building")


# ---------- Chepe Express: the official HTML tables ----------
# (station, lat, lon, zone): coordinates from OSM/Wikipedia (see the
# docstring); El Fuerte is the track's closest approach to the town.
CHEPE_STOPS = [("Los Mochis", 25.7611676, -108.9672524, TZ_MAZ),
               ("El Fuerte", 26.36835, -108.58787, TZ_MAZ),
               ("Bahuichivo", 27.4119417, -108.0680084, TZ_CHIH),
               ("Divisadero", 27.5141712, -107.8400295, TZ_CHIH),
               ("Creel", 27.7546, -107.6347, TZ_CHIH)]
CHEPE_DAYS = {"lunes": 0, "martes": 1, "miércoles": 2, "jueves": 3, "viernes": 4, "sábado": 5, "domingo": 6}
# Chihuahua is one hour ahead of Mazatlan (UTC-6 vs UTC-7, no DST either
# side since 2022): a Chihuahua local time is that many minutes earlier
# in Mazatlan wall-clock minutes.
CHEPE_SHIFT = {TZ_MAZ: 0, TZ_CHIH: -60}


def _chepe_tables(html):
    """[(days, [(station, "HH:MM"), ...]), ...] from chepe.mx's horarios
    page: each table's legs (from, dep, to, arr) in order, with the
    weekday line that precedes it."""
    from html.parser import HTMLParser

    class Tables(HTMLParser):
        def __init__(self):
            super().__init__(convert_charrefs=True)
            self.tables, self.cur, self.row, self.cell = [], None, None, None
            self.days, self.pending = [], None

        def handle_starttag(self, tag, attrs):
            if tag == "table":
                self.cur = []
            elif tag == "tr" and self.cur is not None:
                self.row = []
            elif tag in ("td", "th") and self.row is not None:
                self.cell = ""

        def handle_endtag(self, tag):
            if tag == "table" and self.cur is not None:
                self.tables.append((self.pending, self.cur))
                self.cur, self.pending = None, None
            elif tag == "tr" and self.row is not None:
                self.cur.append(self.row)
                self.row = None
            elif tag in ("td", "th") and self.cell is not None:
                self.row.append(self.cell.strip())
                self.cell = None

        def handle_data(self, d):
            if self.cell is not None:
                self.cell += d
            elif re.search(r"(lunes|martes|miércoles|jueves|viernes|sábado|domingo)", d, re.I):
                self.pending = d.strip()

    p = Tables()
    p.feed(html)
    out = []
    for days_text, table in p.tables:
        if not days_text or len(table) < 2:
            continue
        legs = [(r[0], r[1], r[2], r[3]) for r in table[1:] if len(r) == 4]
        if not legs:
            continue
        stops, seen = [], set()
        for frm, dep, to, arr in legs:
            for name, t in ((frm, dep), (to, arr)):
                if name not in seen:
                    stops.append((name, t))
                    seen.add(name)
        days = {CHEPE_DAYS[w.lower()] for w in re.findall(r"[A-Za-záéíóú]+", days_text)
                if w.lower() in CHEPE_DAYS}
        out.append((days, stops))
    return out


def make_chepe(data=None):
    """Chepe Express as a GTFS zip from chepe.mx's horarios tables (see
    the docstring for the timezone normalization). data: the page's HTML,
    for a test (else fetched fresh)."""
    html = data.decode("utf-8", "ignore") if data is not None else _get(CHEPE_URL).decode("utf-8", "ignore")
    tables = _chepe_tables(html)
    if len(tables) != 2:
        raise RuntimeError(f"chepe.mx horarios: expected 2 timetable tables, found {len(tables)}")
    zones = {name: zone for name, _, _, zone in CHEPE_STOPS}
    today = datetime.date.today()
    end = today + datetime.timedelta(days=180)
    stops = [{"stop_id": f"CHEPE-{slug(name)}", "stop_name": name, "stop_lat": str(lat), "stop_lon": str(lon),
              "stop_timezone": zone} for name, lat, lon, zone in CHEPE_STOPS]
    trips, times, cal = [], [], []
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    for i, (wdays, legs) in enumerate(tables):
        svc = f"CHEPE-{i}"
        cal.append({"service_id": svc, **{d: "1" if n in wdays else "0" for n, d in enumerate(days)},
                    "start_date": today.strftime("%Y%m%d"), "end_date": end.strftime("%Y%m%d")})
        direction = "0" if i == 0 else "1"
        trips.append({"route_id": "EXP", "service_id": svc, "trip_id": f"EXP-{direction}",
                      "trip_headsign": legs[-1][0], "trip_short_name": "Chepe Express", "direction_id": direction})
        for seq, (name, t) in enumerate(legs, start=1):
            h, m = (int(x) for x in t.split(":"))
            mins = h * 60 + m + CHEPE_SHIFT[zones[name]]
            times.append({"trip_id": f"EXP-{direction}", "arrival_time": _hms(mins * 60),
                          "departure_time": _hms(mins * 60), "stop_id": f"CHEPE-{slug(name)}",
                          "stop_sequence": str(seq)})
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("agency.txt", _table([{"agency_id": "chepe", "agency_name": "Chepe Express",
                                          "agency_url": "https://chepe.mx",
                                          "agency_timezone": TZ_MAZ}],
                                        ["agency_id", "agency_name", "agency_url", "agency_timezone"]))
        z.writestr("routes.txt", _table([{"route_id": "EXP", "agency_id": "chepe", "route_short_name": "",
                                          "route_long_name": "Chepe Express", "route_type": "2",
                                          "route_color": "E87722"}],
                                        ["route_id", "agency_id", "route_short_name", "route_long_name",
                                         "route_type", "route_color"]))
        z.writestr("trips.txt", _table(trips, ["route_id", "service_id", "trip_id", "trip_headsign",
                                               "trip_short_name", "direction_id"]))
        z.writestr("stops.txt", _table(stops, ["stop_id", "stop_name", "stop_lat", "stop_lon", "stop_timezone"]))
        z.writestr("stop_times.txt", _table(times, ["trip_id", "arrival_time", "departure_time", "stop_id",
                                                    "stop_sequence"]))
        z.writestr("calendar.txt", _table(cal, ["service_id"] + days + ["start_date", "end_date"]))
    print(f"  mexico/chepe: {len(trips)} trips, {len(stops)} stops, calendar {today} -> {end}")
    return out.getvalue()


def _cdmx_keep(agency_id):
    return lambda r: r["agency_id"] == agency_id


def _cdmx_line(agency_id):
    return {"SUB": lambda r: "Tren Suburbano", "INTERURBANO": lambda r: "El Insurgente"}[agency_id]


GTFS = {
    "suburbano": (CDMX_URL, _cdmx_keep("SUB"), _cdmx_line("SUB"), station,
                  {"make": make_cdmx, "tz": TZ_CDMX}),
    "insurgente": (CDMX_URL, _cdmx_keep("INTERURBANO"), _cdmx_line("INTERURBANO"), station,
                   {"make": make_cdmx, "tz": TZ_CDMX}),
    "fit": (FIT_API + "/runs/catalog", lambda r: r["route_type"] == "2",
            lambda r: (r.get("route_long_name") or "").strip(), station,
            {"make": make_fit, "number": lambda t: (t.get("trip_short_name") or "").strip() or None,
             "tz": TZ_CDMX}),
    "chepe": (CHEPE_URL, lambda r: r["route_type"] == "2", lambda r: "Chepe Express", station,
              {"make": make_chepe, "number": lambda t: (t.get("trip_short_name") or "").strip() or None,
               "tz": TZ_MAZ}),
}

# Mexico's track (P3): the box covers the built agencies; FIT's Isthmus
# lines (to -93.7, 16.2) need the box widened when it resumes. One
# network tag for the region's pieces — P3 to check whether the hop
# router needs per-agency tags.
RAIL = {"region": "mx", "bbox": [-109.2, 19.2, -99.0, 27.9], "network": "chepe"}
