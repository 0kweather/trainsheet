"""Austria: ÖBB Personenverkehr's trains (Railjet, Nightjet, EC/IC, REX, CJX,
R, the S-Bahns) and the Montafonerbahn (Bludenz–Schruns), from ÖBB's own
timetable (GTFS, "Soll-Fahrplan GTFS", data.oebb.at: official, published by
ÖBB-Infrastruktur for the trains on its network, no key). No live feed is read: the trains are
placed from the timetable (a "timetable" source, no parser file), marked
estimated. The feed is downloaded fresh at each build; this edition
(GTFS_Fahrplan_2026.zip, 173 MB) runs 2025-12-14 → 2026-12-12, the
2025/2026 timetable. Its successor, GTFS_Fahrplan_2027.zip, is expected in
December 2026 with the timetable change: the Monday refresh must switch
GTFS_URL to it once it is posted (check the ÖBB open-data page), or the
build ships an expired timetable after December 12, 2026. The older
GTFS_OP_<year>_obb.zip files are dead (2026's 404s, 2025's has expired) and
the Mobilitätsverbünde's API needs an account; neither is used.

The zip keeps every file under a GTFS_Fahrplan_2026/ folder ("convert",
below, finds it). Its agencies, as the railroads here: obb (agency 01,
"OEBB Personenverkehr AG Kundenservice": 256 rail routes) and
montafonerbahn (10, Montafonerbahn AG: 2). Left out: ÖBB's 14 bus routes
(route type 3, its rail-replacement "SV" buses), and the City Airport
Train (agency 08, 1 route, 72 trips): its only service (TA+b7) has every
date from 2026-09-07 removed in calendar_dates (97 consecutive removal
exceptions), so the feed carries no CAT trains after 2026-09-06 and none
in the build window — CAT is left out rather than shipped as an empty
railroad, and should be re-checked (and re-added) when the 2027 edition
posts. WESTbahn and the private regional lines are not in the feed.

Cross-border trains — Railjets and ECs to München, Zürich, Venezia, Praha,
Budapest and Bratislava, the Nightjets and EuroNights to Bruxelles, Hamburg,
Berlin, Roma, Warszawa, Kyiv and București, ECs to Zagreb and Split — are
kept whole, all their stops, as Denmark's ECE and RJ are; the railroads
"clip" to the box (BBOX, below), so their extent stays Austria's. The
feed's fare points at the borders ("TP Summerau(Gr)", "Spielfeld
Tarifpunkt Grenze (Bahn)") are pass-through rows (no pickup, no drop-off)
and are left out with every other station a train only passes.

Lines: ÖBB's route long names are timetable-book corridors, not a train's
run — "Wien - Salzburg - Kufstein - Innsbruck - Bludenz - Bregenz - Lindau"
labels most of the west's routes, Salzburg S-Bahns among them — so a line
is the corridor's two named ends, hub-first ("Wien – Lindau"), in Croatia's
manner; where the long name is empty ("A-1"), cut short ("Wien - ... -
Tarvis (I) - ...") or garbled ("?????? - ??????") it is the route's short
name. The Montafonerbahn's routes carry the same borrowed
corridor label, so theirs is its own run (Bludenz – Schruns).

Stations: the feed has parent stations (location type 1) with platforms
named apart from them ("Graz Hbf 4" in "Graz Hauptbahnhof") and a few
stations filed as bare platforms with no parent ("Feldkirch Bahnhof",
"Stuttgart Hauptbahnhof 9"), so "convert" names every stop as its parent
station, and stations fold by that name: less the trailing " Bahnhof",
" Bahnhst" (Bahnhaltestelle), " Bhf.", " Bf.", " S-Bahn" and a platform
number, and the neighbours' words for station ("Győr pályaudvar": "Győr";
"Bolzano, Stazione di Bolzano": "Bolzano") — "Hauptbahnhof", "Westbahnhof"
and the like stay, as signed. Two different stations are both "Neumarkt
Bahnhof" in the feed (Styria's and the Wallersee's), named apart by id.
Ids are ASCII slugs, umlauts folded (ä→a, ö→o, ü→u) and ß→ss. Train
numbers are the feed's trip_short_name as printed ("RJ 658", "S 4711");
every rail trip has one (the 475 trips without a number are the excluded
bus trips). Times are Austria's (Europe/Vienna)."""
import csv, io, re, unicodedata, zipfile

GTFS_URL = "https://static.web.oebb.at/open-data/soll-fahrplan-gtfs/GTFS_Fahrplan_2026.zip"
TZ = "Europe/Vienna"
CREDIT = {"label": "Timetable from ÖBB (Soll-Fahrplan GTFS, data.oebb.at)",
          "href": "https://data.oebb.at/de/datensaetze~soll-fahrplan-gtfs~"}
# Austria, from Lindau, Bregenz and Buchs SG (9.48) on Lake Constance and the
# Rhine to Hegyeshalom (17.15) and Bratislava in the east, Jesenice (46.44)
# and the Tarvisio and Brenner lines in the south to Šatov, České Velenice
# and Gmünd (48.78) in the north, with the immediate border stations
# (Freilassing, Passau, Kufstein's Bavarian side, Sopron, Břeclav, Spielfeld)
# inside it. The box takes in southern Bavaria (München) and South Tyrol
# (Bolzano) too; the far termini — Zürich, Venezia, Praha, Budapest, Hamburg
# and beyond — stay outside it as stops on trains kept whole.
BBOX = [9.45, 46.35, 17.25, 49.05]
COMMON = {"region": "Austria", "country": "AT", "tz": TZ, "credit": CREDIT, "license": None, "bbox": BBOX,
          "clip": True}

AGENCIES = {
    "obb": {"name": "ÖBB", "short": "ÖBB", "color": "#e2001a", "kind": "intercity", "cars": "obb", **COMMON},
    "montafonerbahn": {"name": "Montafonerbahn", "short": "MBS", "color": "#b5121b", "kind": "commuter",
                       "after": "obb", "cars": "montafonerbahn", **COMMON},
}
SOURCES = [{"id": "austria", "agencies": list(AGENCIES), "format": "timetable", "interval": 60, "scope": "view"}]

# The feed's agency ids, and their rail routes alone (route type 2; ÖBB's
# type-3 routes are its rail-replacement buses).
OPERATORS = {"obb": "01", "montafonerbahn": "10"}
TRAIN_TYPES = {"2"}


def keep(agency):
    return lambda r: r["agency_id"] == OPERATORS[agency] and r["route_type"] in TRAIN_TYPES


HUB = "Wien"
# The corridors' ends as signed ("Breclav": Břeclav), and the
# Montafonerbahn's own run in place of the corridor label it borrows.
ENDS = {"Breclav": "Břeclav"}
OWN_LINES = {"10": "Bludenz – Schruns"}


def _end(e):
    """A corridor end, less the feed's country tags: "Tarvis (I)", "München
    (DE)", "IT- Brenner"."""
    e = re.sub(r"\s*\((DE|I|IT|CH|CZ|SK|HU|SI)\)$", "", e.strip())
    e = re.sub(r"^[A-Z]{2}-\s*", "", e).strip()
    return ENDS.get(e, e)


def line(r):
    """The corridor's first and last ends, hub-first ("Wien – Lindau"), else
    alphabetical, so both directions share one line; the route's short
    name, else the railroad's, where the long name is empty, cut short
    ("...") or garbled ("??????")."""
    if r["agency_id"] in OWN_LINES:
        return OWN_LINES[r["agency_id"]]
    name = (r.get("route_long_name") or "").strip()
    parts = [p.strip() for p in name.split(" - ")]
    if len(parts) >= 2 and all(parts) and "..." not in name and "?" not in name:
        ends = [_end(parts[0]), _end(parts[-1])]
        if all(ends) and ends[0] != ends[1]:
            if HUB in ends:
                ends.sort(key=lambda e: e != HUB)
            else:
                ends.sort()
            return " – ".join(ends)
    agency = next(a for a, o in OPERATORS.items() if o == r["agency_id"])
    return (r.get("route_short_name") or "").strip() or AGENCIES[agency]["name"]


# The train's number as ÖBB prints it ("RJ 658", "S 4711").
number = lambda t: (t.get("trip_short_name") or "").strip() or None


# ---------- Stations ----------
LETTERS = str.maketrans({"ß": "ss", "ł": "l", "đ": "d"})
# Words for "station" after a name: Austria's and the neighbours'.
SUFFIX = re.compile(r"(\s+|/)(Bahnhof|Bahnhst|Bhf\.|Bf\.|Haltestelle|S-Bahn|Autoreisezug|stazione|pályaudvar|"
                    r"stacja kolejowa|(?<!hlavná )stanica|železniška posta(ja)?|željeznički kolodvor|"
                    r"železniční stanice)(?=\s*(\(|$))", re.I)


def clean(name):
    """"Graz Hauptbahnhof" stays; "Feldkirch Bahnhof" -> "Feldkirch";
    "Kuchl S-Bahn" -> "Kuchl"; "St.Martin-Sittich Bahnhst (Bundesstraße)" ->
    "St.Martin-Sittich (Bundesstraße)"; "Stuttgart Hauptbahnhof 9" ->
    "Stuttgart Hauptbahnhof"; "Roma, Stazione di Roma Tiburtina" -> "Roma
    Tiburtina"; "Ljubljana železniška postaja" -> "Ljubljana"."""
    name = re.sub(r"^[^,]+,\s*Stazione di\s+", "", name.strip())
    name = SUFFIX.sub("", name)
    name = re.sub(r"\s+\d+$", "", name)  # a platform: only Stuttgart's, filed with no parent
    name = re.sub(r",$", "", name).strip()
    return NAMES.get(name, name)


# Names put right: Děčín's háček, lost in the feed; Jesenice without its
# country tag.
NAMES = {"Děčín hlavní nádrazí": "Děčín hlavní nádraží", "Jesenice (SI)": "Jesenice"}
# Stations the feed names alike, named apart by their parent station's id.
BY_ID = {"Pat:46:7474": "Neumarkt in der Steiermark", "Pat:45:50273": "Neumarkt am Wallersee"}


def station(name):
    """(station id, name): "Wien Hauptbahnhof" -> ("wien-hauptbahnhof",
    "Wien Hauptbahnhof"); "Spielfeld-Straß" -> ("spielfeld-strass", ...)."""
    name = clean(name)
    plain = unicodedata.normalize("NFKD", name.lower().translate(LETTERS)).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", plain).strip("-"), name


# ---------- The timetable, cut ----------
def _read(zf, name):
    with zf.open(name) as f:
        return list(csv.reader(io.TextIOWrapper(f, "utf-8-sig")))


def _write(rows):
    out = io.StringIO()
    csv.writer(out, lineterminator="\n").writerows(rows)
    return out.getvalue().encode()


def convert(data):
    """ÖBB's file as a GTFS of the three railroads' trains alone (feeds.py's
    "convert", run once a build): the rail routes, their trips, stop times
    (less the stations a train only passes, the border fare points among
    them), the stops those call at — each named as its parent station, so
    stations fold by name — and their services' calendars; the bus routes,
    shapes (666 MB), pathways, levels, transfers and frequencies left out.
    The files sit under a folder ("GTFS_Fahrplan_2026/"), found from
    routes.txt; stop_times.txt is streamed, its trip id compared before a
    line is parsed."""
    zf = zipfile.ZipFile(io.BytesIO(data))
    prefix = next(n[:-len("routes.txt")] for n in zf.namelist() if n.rsplit("/", 1)[-1] == "routes.txt")
    agencies = set(OPERATORS.values())
    routes = _read(zf, prefix + "routes.txt")
    rc = routes[0]
    kept_routes = [routes[0]] + [r for r in routes[1:] if r[rc.index("agency_id")] in agencies
                                 and r[rc.index("route_type")] in TRAIN_TYPES]
    route_ids = {r[rc.index("route_id")] for r in kept_routes[1:]}
    trips = _read(zf, prefix + "trips.txt")
    tc = trips[0]
    kept_trips = [trips[0]] + [t for t in trips[1:] if t[tc.index("route_id")] in route_ids]
    trip_ids = {t[tc.index("trip_id")] for t in kept_trips[1:]}
    services = {t[tc.index("service_id")] for t in kept_trips[1:]}
    times, used = [], set()
    with zf.open(prefix + "stop_times.txt") as f:
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
            # A station the train passes (no pickup, no drop-off: the border
            # fare points, "TP Gmünd Lainsitzbrücke Schiene") isn't a stop.
            if row[ti] in trip_ids and not (row[pi] == "1" and row[di] == "1"):
                times.append(raw)
                used.add(row[si])
    stops = _read(zf, prefix + "stops.txt")
    sc = stops[0]
    idi, ni, pari = sc.index("stop_id"), sc.index("stop_name"), sc.index("parent_station")
    li = sc.index("location_type") if "location_type" in sc else None
    by_id = {s[idi]: s for s in stops[1:]}
    kept_stops, seen = [sc], {}
    for s in stops[1:]:
        if s[idi] not in used:
            continue
        parent = by_id.get(s[pari])
        home = parent or s
        s = list(s)
        # Each stop named as its station (the parent's name: "Graz Hbf 4" is
        # Graz Hauptbahnhof), the parent left out of the file.
        s[ni] = BY_ID.get(home[idi], home[ni])
        s[pari] = ""
        if li is not None:
            s[li] = ""
        kept_stops.append(s)
        # Two stations of one name, far apart, would fold into one: say so.
        sid = station(s[ni])[0]
        lat, lon = float(s[sc.index("stop_lat")]), float(s[sc.index("stop_lon")])
        if sid in seen and (abs(seen[sid][0] - lat) > 0.05 or abs(seen[sid][1] - lon) > 0.05):
            print(f"  austria: WARNING two stations named {s[ni]!r} fold into one ({sid}); add them to BY_ID")
        seen.setdefault(sid, (lat, lon))
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("agency.txt", zf.read(prefix + "agency.txt"))
        z.writestr("routes.txt", _write(kept_routes))
        z.writestr("trips.txt", _write(kept_trips))
        z.writestr("stops.txt", _write(kept_stops))
        z.writestr("stop_times.txt", b"".join(times))
        for name in ("calendar.txt", "calendar_dates.txt"):
            if prefix + name in zf.namelist():
                rows = _read(zf, prefix + name)
                z.writestr(name, _write([rows[0]] + [r for r in rows[1:] if r[rows[0].index("service_id")] in services]))
    print(f"  austria: cut to {len(route_ids)} routes, {len(trip_ids)} trips, {len(kept_stops) - 1} stops")
    return out.getvalue()


GTFS = {a: (GTFS_URL, keep(a), line, station,
            {"convert": convert, "number": number, "tz": TZ})
        for a in AGENCIES}

# Austria's track (P3, not built yet): OpenStreetMap's mainline track in the
# box, routed from the timetables.
RAIL = {"region": "at", "bbox": BBOX, "network": "obb"}
