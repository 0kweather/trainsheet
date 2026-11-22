"""Denmark: DSB's long-distance and regional trains (IC, ICL, RE, and the
EuroCity Express and Railjet to Hamburg, Berlin and Prague), the S-tog
(Copenhagen's S-trains, lines A, B, Bx, C, E, F, H), Lokaltog's lines on
Zealand and Lolland-Falster, Nordjyske
Jernbaner (Skagen and Hirtshals-Aalborg-Hobro/Skørping), Midtjyske
Jernbaner (Holstebro-Skjern and Lemvig) and GoCollective (the former Arriva
Denmark: Jutland's regional lines and the Tønder-Niebüll trains), from
Rejseplanen's national timetable (GTFS, rejseplanen.info/labs: official,
published by Rejseplanen A/S for every Danish operator, no key). It is an
all-mode feed (buses, ferries, the Metro and the light rails too): the
build keeps the six operators' train routes alone ("convert", below). No
live feed is read: the trains are placed from the timetable (a "timetable"
source, no parser file), marked estimated. The feed is downloaded fresh at
each build.

The feed's agencies, as the railroads here: dsb (agency 203, route type 2:
IC, ICL, RE, ECE, RJ), stog (318, route type 109), lokaltog (316),
nordjyske (206, routes 75 and 76), midtjyske (281, routes 92 and 93),
gocollective (471, routes 030, 031 and RX). Agency 471 is named "DSB Vores
Tog" in the feed, a quirk of Rejseplanen's: its trains are run by
GoCollective (ex-Arriva Denmark; its Lint 41s carry GoCollective's name, as
at Struer), and are named so here.
Left out: Skånetrafiken's Øresundståg (agency 401, routes 802-806) and
Snälltåget (451, route 083), which Sweden's plug-in already has (as
oresundstag and snalltaget), the Copenhagen Metro (319), the light rails
(456, 481), DSB's and the others' buses (rail replacement and "Togbus"),
and every bus and ferry route.

Cross-border trains: DSB's ECE and RJ (to Hamburg, Berlin, Dresden and
Prague) and GoCollective's Tønder-Niebüll trains are kept whole, all their
stops, as SNCB's and CFL's trains over their borders are; the railroads
"clip" to Denmark's box (BBOX, below), so their extent on the map stays
Denmark's and doesn't stretch to Prague.

Stations: the feed has no parent stations, one stop per station, folded by name as exo's are; the names as
Rejseplanen files them, less the trailing " St." and any disambiguation in
brackets ("Grønnehave St. (Helsingør)": "Grønnehave"), Danish letters
kept. Train numbers are the feed's trip_short_name, unpadded ("000100":
100). Times are Denmark's (Europe/Copenhagen)."""
import csv, io, re, unicodedata, zipfile

GTFS_URL = "https://www.rejseplanen.info/labs/GTFS.zip"
TZ = "Europe/Copenhagen"
CREDIT = {"label": "Timetable from Rejseplanen (GTFS, rejseplanen.info/labs)", "href": "https://www.rejseplanen.info/labs/"}
# Denmark, from Esbjerg and the west coast to Copenhagen and Helsingør,
# Lolland-Falster and the border to Skagen (Bornholm has no trains). The
# south edge is 54.55, not 54.8: Lolland-Falster's stations (Nykøbing F
# 54.77, Maribo, Rødby) lie below 54.8, and a clipped railroad's extent
# would leave them out; Flensburg and Niebüll, just over the border, fall
# inside it.
BBOX = [8.0, 54.55, 12.8, 57.8]
COMMON = {"region": "Denmark", "country": "DK", "tz": TZ, "credit": CREDIT, "license": None, "bbox": BBOX, "clip": True}

AGENCIES = {
    "dsb": {"name": "DSB", "short": "DSB", "color": "#b41730", "kind": "intercity", "cars": "dsb", **COMMON},
    "stog": {"name": "S-tog", "short": "S-tog", "color": "#e2001a", "kind": "commuter", "after": "dsb", "cars": "stog",
             **COMMON},
    "lokaltog": {"name": "Lokaltog", "short": "Lokaltog", "color": "#fdc300", "kind": "commuter", "after": "stog",
                 "cars": "lokaltog", **COMMON},
    "nordjyske": {"name": "Nordjyske Jernbaner", "short": "Nordjyske", "color": "#0060a9", "kind": "commuter",
                  "after": "lokaltog", "cars": "nordjyske", **COMMON},
    "midtjyske": {"name": "Midtjyske Jernbaner", "short": "Midtjyske", "color": "#3a7d44", "kind": "commuter",
                  "after": "nordjyske", "cars": "midtjyske", **COMMON},
    "gocollective": {"name": "GoCollective", "short": "GoCollective", "color": "#00a3a6", "kind": "commuter",
                     "after": "midtjyske", "cars": "gocollective", **COMMON},
}
SOURCES = [{"id": "denmark", "agencies": list(AGENCIES), "format": "timetable", "interval": 60, "scope": "view"}]

# The feed's agency ids, and each one's train route types (S-tog's is 109,
# the rest 2: their buses are 3 and 715, kept out).
OPERATORS = {"dsb": "203", "stog": "318", "lokaltog": "316", "nordjyske": "206", "midtjyske": "281", "gocollective": "471"}
TRAIN_TYPES = {"2", "109"}


def keep(agency):
    return lambda r: r["agency_id"] == OPERATORS[agency] and r["route_type"] in TRAIN_TYPES


# Every railroad's lines are its routes' short names: DSB's products (IC,
# ICL, RE, ECE, RJ), the S-tog's letters, Lokaltog's line numbers ("110R",
# "910"), Nordjyske's and Midtjyske's (75, 76; 92, 93), GoCollective's (030,
# 031, RX).
line = lambda r: r["route_short_name"].strip()

# "000100" -> "100".
number = lambda t: (t.get("trip_short_name") or "").strip().lstrip("0") or None


# ---------- Stations ----------
LETTERS = str.maketrans({"æ": "ae", "ø": "o", "å": "aa"})


def clean(name):
    """"Grønnehave St. (Helsingør)" -> "Grønnehave"; "Mårum (Græsted-Gilleleje)
    St." -> "Mårum"; "Nykøbing Sj. St." -> "Nykøbing Sj."."""
    name = re.sub(r"\s*\([^)]*\)", "", name).strip()
    return re.sub(r"\s+St\.$", "", name).strip()


def station(name):
    """(station id, name): "København H" -> ("kobenhavn-h", "København H")."""
    name = clean(name)
    plain = unicodedata.normalize("NFKD", name.lower().translate(LETTERS)).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", plain).strip("-"), name


# Names put right: Děčín's háčeks, lost in the feed.
NAMES = {"Decín hl.n.": "Děčín hl.n."}


# ---------- The timetable, cut ----------
def _read(zf, name):
    with zf.open(name) as f:
        return list(csv.reader(io.TextIOWrapper(f, "utf-8-sig")))


def _write(rows):
    out = io.StringIO()
    csv.writer(out, lineterminator="\n").writerows(rows)
    return out.getvalue().encode()


def convert(data):
    """Rejseplanen's all-mode file as a GTFS of the six railroads' trains
    alone (feeds.py's "convert", run once a build): their routes, trips,
    stop times (less the stations a train only passes), the stops those
    call at (so a station is placed from its train stop, never a bus stop
    of the same name) and their services' calendars; shapes, transfers and frequencies left out. stop_times.txt (230 MB) is
    streamed, its trip id compared before a line is parsed."""
    zf = zipfile.ZipFile(io.BytesIO(data))
    agencies = set(OPERATORS.values())
    routes = _read(zf, "routes.txt")
    rc = routes[0]
    kept_routes = [routes[0]] + [r for r in routes[1:] if r[rc.index("agency_id")] in agencies
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
        pi, di = cols.index("pickup_type"), cols.index("drop_off_type")
        times.append(head)
        for raw in f:
            text = raw.decode("utf-8")
            if text.split(",", ti + 1)[ti].strip().strip('"') not in trip_ids:
                continue
            row = next(csv.reader([text]))
            # A station the train passes (no pickup, no drop-off: Rejseplanen
            # lists every IC's run through Funen's halts so) isn't a stop.
            if row[ti] in trip_ids and not (row[pi] == "1" and row[di] == "1"):
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
    print(f"  denmark: cut to {len(route_ids)} routes, {len(trip_ids)} trips, {len(kept_stops) - 1} stops")
    return out.getvalue()


# S-tog's lines in their own colours (as DSB's S-tog map draws them); every
# other railroad's lines in its colour.
STOG_COLORS = {"A": "#00a4e4", "B": "#4db848", "Bx": "#8dc63f", "C": "#f7941d", "E": "#7e67ae", "F": "#ffc20e",
               "H": "#e2001a"}
LINES = {"dsb": ["IC", "ICL", "RE", "ECE", "RJ"],
         "lokaltog": ["110R", "210R", "410", "510R", "710R", "910", "920R", "930R", "940R", "950R", "960R"],
         "nordjyske": ["75", "76"], "midtjyske": ["92", "93"], "gocollective": ["030", "031", "RX"]}


def colors(agency):
    if agency == "stog":
        return dict(STOG_COLORS)
    return {l: AGENCIES[agency]["color"] for l in LINES[agency]}


GTFS = {a: (GTFS_URL, keep(a), line, station,
            {"convert": convert, "number": number, "tz": TZ, "names": NAMES, "colors": colors(a)})
        for a in AGENCIES}

# Denmark's track (P3, not built yet): OpenStreetMap's mainline track in the
# box, routed from the timetables.
RAIL = {"region": "dk", "bbox": BBOX, "network": "dsb"}
