"""Poland: all 13 Polish passenger operators (PKP Intercity, PolRegio,
Koleje Mazowieckie, Koleje Śląskie, Koleje Dolnośląskie, Koleje
Wielkopolskie, Koleje Małopolskie, ŁKA, Arriva RP, PKP SKM Trójmiasto,
SKM Warszawa, RegioJet, Leo Express), from the unified "Polish Trains"
GTFS published by Mikołaj Kuranowski (mkuran.pl/gtfs: community, keyless,
built from PKP PLK public-sector open data, no key, no account). No live
feed is read: the trains are placed from the timetable (a "timetable"
source, no parser file), marked estimated. The feed is downloaded fresh
at each build; this edition (feed_version 2026-11-22T02:45:17+01:00,
35,807,867 B, Last-Modified Sun 22 Nov 2026 01:49:47 GMT) runs
2026-11-22 -> 2026-12-22, the 2025/2026 timetable's last month — it is
a monthly snapshot, so the Monday refresh must keep fetching the
current zip or the build ships an expired timetable after Dec 22, 2026.
Mirror: https://gtfs.kasznia.net/static/polish-trains.zip.

The feed has no calendar.txt — services are calendar_dates.txt only
(exception_type 1 additions, 5,270 rows, 688 services, max 22 dates
each) — and build_schedules.py reads that file with optional=True, so
the missing calendar is fine. Its 47 bus routes (route type 3, the
operators' rail-replacement "ZKA" buses, incl. KM's Modlin airport
shuttles) are left out, as are the 85 MB shapes (convert drops them).
28,107 rail trips run in the feed (29,771 total), less 18
rail-replacement buses filed as trips on rail routes (category
"BUS/R"), which "convert" drops.

Cross-border trains — Intercity to Berlin, München, Wien, Budapest,
Praha and Kyiv/Kharkiv, RegioJet and Leo Express to Praha, the
Białystok–Kaunas service — are kept whole, all their stops, as
Denmark's ECE and Austria's RJ are; the railroads "clip" to the box
(BBOX, below), so their extent stays Poland's. The far termini stay
outside the box as stops on trains kept whole.

Lines: the regional operators' route long names are corridor lists
("Wrocław — Legnica — Bolesławiec — Lubań"), so a line is the
corridor's two named ends, hub-first ("Wrocław – Lubań"), in
Croatia's manner; "(Przyspieszony)" and branch parts (" / ...",
"(— ...)") are stripped first, so R and RE routes on one corridor
share a line. Where the long name is a category or an agency name
(PKP Intercity's seven routes are just "EuroCity", "Express
InterCity Premium" and the like; Arriva's one route is "Arriva"),
the line is the route's short name ("EIP", "EC", "AR").

Stations: the feed has parent stations (location type 1) with
platforms named as their parent ("Gdańsk Główny" and its platforms
all read "Gdańsk Główny"), so "convert" names every stop as its
parent station, and stations fold by that name. One parent,
"Warszawa Zachodnia (Peron 9)", is the same station as "Warszawa
Zachodnia" (~300 m away, the WKD platform 9), so "clean" strips a
trailing " (Peron N)" and the two fold into one. Ids are ASCII slugs, Polish letters folded (ł→l,
ą→a, ć→c, ę→e, ń→n, ó→o, ś→s, ź/ż→z); a name in another script
than Latin keeps its letters, so the Ukrainian stations on the
Kyiv/Kharkiv trains keep their own ids instead of collapsing into
one. Two stations are both "Kolin" in the feed — Kolín in Czechia
and Kolin in West Pomerania — named apart by id. Train numbers are the
feed's own PLK designation: category + number ("EIP 1302/3",
"R1 91326/7", "R 88481"), from plk_category_code and
plk_train_number; every rail trip has both. Times are Poland's
(Europe/Warsaw)."""
import csv, io, re, unicodedata, zipfile

GTFS_URL = "https://mkuran.pl/gtfs/polish_trains.zip"
GTFS_MIRROR = "https://gtfs.kasznia.net/static/polish-trains.zip"
TZ = "Europe/Warsaw"
CREDIT = {"label": "Timetable from mkuran.pl (Polish Trains GTFS, built from PKP PLK public-sector data)",
          "href": "https://mkuran.pl/gtfs"}
# Poland, from Świnoujście and Szczecin in the west to Terespol and
# Przemyśl in the east, Zakopane in the south to Hel and the Tri-City
# in the north; the box takes in Berlin, Praha and Dresden too, so the
# cross-border trains' near stops stay inside it. The far termini —
# München, Wien, Budapest, Kyiv, Kharkiv — stay outside it as stops on
# trains kept whole.
BBOX = [13.0, 48.8, 24.6, 55.0]
COMMON = {"region": "Poland", "country": "PL", "tz": TZ, "credit": CREDIT, "license": None, "bbox": BBOX,
          "clip": True}

AGENCIES = {
    "ic": {"name": "PKP Intercity", "short": "PKP IC", "color": "#004b8d", "kind": "intercity",
           "cars": "ic", **COMMON},
    "polregio": {"name": "PolRegio", "short": "PolRegio", "color": "#e30613", "kind": "commuter",
                 "after": "ic", "cars": "polregio", **COMMON},
    "mazowieckie": {"name": "Koleje Mazowieckie", "short": "KM", "color": "#009444", "kind": "commuter",
                    "after": "polregio", "cars": "mazowieckie", **COMMON},
    "slaskie": {"name": "Koleje Śląskie", "short": "KŚ", "color": "#f39200", "kind": "commuter",
                "after": "mazowieckie", "cars": "slaskie", **COMMON},
    "dolnoslaskie": {"name": "Koleje Dolnośląskie", "short": "KD", "color": "#ffcc00", "kind": "commuter",
                     "after": "slaskie", "cars": "dolnoslaskie", **COMMON},
    "wielkopolskie": {"name": "Koleje Wielkopolskie", "short": "KW", "color": "#009fe3", "kind": "commuter",
                      "after": "dolnoslaskie", "cars": "wielkopolskie", **COMMON},
    "malopolskie": {"name": "Koleje Małopolskie", "short": "KMŁ", "color": "#e94e1b", "kind": "commuter",
                    "after": "wielkopolskie", "cars": "malopolskie", **COMMON},
    "lka": {"name": "Łódzka Kolej Aglomeracyjna", "short": "ŁKA", "color": "#662d91", "kind": "commuter",
            "after": "malopolskie", "cars": "lka", **COMMON},
    "arriva": {"name": "Arriva RP", "short": "Arriva", "color": "#00a9b5", "kind": "commuter",
               "after": "lka", "cars": "arriva", **COMMON},
    "skmt": {"name": "PKP SKM Trójmiasto", "short": "SKM", "color": "#003da5", "kind": "commuter",
             "after": "arriva", "cars": "skmt", **COMMON},
    "skm": {"name": "SKM Warszawa", "short": "SKM W-wa", "color": "#e31837", "kind": "commuter",
            "after": "skmt", "cars": "skm", **COMMON},
    "regiojet": {"name": "RegioJet", "short": "RJ", "color": "#ffdd00", "kind": "intercity",
                 "after": "skm", "cars": "regiojet", **COMMON},
    "leo": {"name": "Leo Express", "short": "LEO", "color": "#f58220", "kind": "intercity",
            "after": "regiojet", "cars": "leo", **COMMON},
}
SOURCES = [{"id": "poland", "agencies": list(AGENCIES), "format": "timetable", "interval": 60, "scope": "view"}]

# The feed's agency ids, and their rail routes alone (route type 2; the
# type-3 routes are the operators' rail-replacement buses).
OPERATORS = {"ic": "IC", "polregio": "PR", "mazowieckie": "KM", "slaskie": "KS", "dolnoslaskie": "KD",
             "wielkopolskie": "KW", "malopolskie": "KML", "lka": "LKA", "arriva": "AR", "skmt": "SKMT",
             "skm": "SKM", "regiojet": "RJ", "leo": "LEO"}
TRAIN_TYPES = {"2"}


def keep(agency):
    return lambda r: r["agency_id"] == OPERATORS[agency] and r["route_type"] in TRAIN_TYPES


# The corridor's hub, first where it is an end (else alphabetical).
HUBS = {"mazowieckie": "Warszawa", "skm": "Warszawa", "lka": "Łódź", "dolnoslaskie": "Wrocław",
        "malopolskie": "Kraków", "slaskie": "Katowice", "wielkopolskie": "Poznań", "skmt": "Gdynia"}
# A long name's tail that is a service kind, not a place ("Koleje
# Dolnośląskie - Sprinter", "PolRegio - Przyspieszony").
TAIL = re.compile(r"\s+-\s+(Przyspieszony|Sprinter|Pospieszny)$")
# A branch after a slash ("Karpacz — Jelenia Góra — Görlitz /
# Świeradów-Zdrój") and any parenthetical ("(— Wejherowo — Lębork)").
BRANCH = re.compile(r"\s*/\s*.*$")
PAREN = re.compile(r"\s*\([^)]*\)")


def line(r):
    """The corridor's first and last ends, hub-first ("Wrocław – Lubań"),
    else alphabetical, so both directions share one line; the route's
    short name where the long name is a category or an agency name
    ("EIP", "AR", "KŚ")."""
    name = (r.get("route_long_name") or "").strip()
    name = TAIL.sub("", name)
    name = BRANCH.sub("", name)
    name = PAREN.sub("", name).strip()
    parts = [p.strip() for p in re.split(r"\s+(?:—|→|-)\s+", name)]
    agency = next(a for a, o in OPERATORS.items() if o == r["agency_id"])
    if len(parts) < 2 or not all(parts) or parts[0] == parts[-1]:
        return (r.get("route_short_name") or "").strip() or AGENCIES[agency]["name"]
    ends = [parts[0], parts[-1]]
    hub = HUBS.get(agency)
    if hub in ends:
        ends.sort(key=lambda e: e != hub)
    else:
        ends.sort()
    return " – ".join(ends)


def number(t):
    """The train's number as PLK prints it ("EIP 1302/3", "R1 91326/7",
    "R 88481"); the feed's trip_short_name first token where the PLK
    columns are empty (the excluded bus trips)."""
    cat = (t.get("plk_category_code") or "").strip()
    num = (t.get("plk_train_number") or "").strip()
    if cat and num:
        return f"{cat} {num}"
    return (t.get("trip_short_name") or "").strip().split(" ")[0] or None


# ---------- Stations ----------
LETTERS = str.maketrans({"ł": "l", "Ł": "L"})
# "Warszawa Zachodnia (Peron 9)" is Warszawa Zachodnia's WKD platform.
PERON = re.compile(r"\s*\([Pp]eron \d+\)\s*$")


def clean(name):
    """The parent station's name, less a trailing platform note:
    "Warszawa Zachodnia (Peron 9)" -> "Warszawa Zachodnia". German
    parentheticals ("Frankfurt (Oder)", "Müncheberg (Mark)") stay."""
    return PERON.sub("", name.strip())


def station(name):
    """(station id, name): "Warszawa Centralna" -> ("warszawa-centralna",
    "Warszawa Centralna"); "Łódź Fabryczna" -> ("lodz-fabryczna", ...).
    A name in another script than Latin keeps its letters (feeds.slug's
    rule: "Київ-Пасажирськи" -> "київ-пасажирськи"), which dropping
    them would leave empty."""
    name = clean(name)
    low = name.lower()
    if all(c.isascii() or unicodedata.name(c, "").startswith("LATIN") for c in low if c.isalnum()):
        plain = unicodedata.normalize("NFKD", low.translate(LETTERS)).encode("ascii", "ignore").decode()
        return re.sub(r"[^a-z0-9]+", "-", plain).strip("-"), name
    return re.sub(r"-+", "-", "".join(c if c.isalnum() or unicodedata.combining(c) else "-"
                                      for c in unicodedata.normalize("NFC", low))).strip("-"), name


# Stations the feed names alike, named apart by their parent station's
# id: Kolín in Czechia (on the Praha corridor) and Kolin in West
# Pomerania both slug to "kolin".
BY_ID = {"128006": "Kolín (Czechia)"}


# ---------- The timetable, cut ----------
def _read(zf, name):
    with zf.open(name) as f:
        return list(csv.reader(io.TextIOWrapper(f, "utf-8-sig")))


def _write(rows):
    out = io.StringIO()
    csv.writer(out, lineterminator="\n").writerows(rows)
    return out.getvalue().encode()


def convert(data):
    """mkuran.pl's file as a GTFS of the thirteen railroads' trains alone
    (feeds.py's "convert", run once a build): the rail routes, their
    trips (less the rail-replacement buses filed on them), stop times (less the three stations a train only passes),
    the stops those call at — each named as its parent station, so
    stations fold by name — and their services' calendars; the bus
    routes, shapes (85 MB), transfers, attributions and feed_info left
    out. The feed has no calendar.txt (calendar_dates.txt only).
    stop_times.txt is streamed, its trip id compared before a line is
    parsed."""
    zf = zipfile.ZipFile(io.BytesIO(data))
    agencies = set(OPERATORS.values())
    routes = _read(zf, "routes.txt")
    rc = routes[0]
    kept_routes = [routes[0]] + [r for r in routes[1:] if r[rc.index("agency_id")] in agencies
                                 and r[rc.index("route_type")] in TRAIN_TYPES]
    route_ids = {r[rc.index("route_id")] for r in kept_routes[1:]}
    trips = _read(zf, "trips.txt")
    tc = trips[0]
    kept_trips = [trips[0]] + [t for t in trips[1:] if t[tc.index("route_id")] in route_ids
                               and not (t[tc.index("plk_category_code")] or "").startswith("BUS")]
    # The feed files a few rail-replacement buses as trips on rail routes
    # (plk_category_code "BUS/R", e.g. Ostrowiec–Skarżysko, Rzeszów–Jasło):
    # they are buses, so they are left out with the bus routes.
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
            # A station the train passes (no pickup, no drop-off) isn't a stop.
            if row[ti] in trip_ids and not (row[pi] == "1" and row[di] == "1"):
                times.append(raw)
                used.add(row[si])
    stops = _read(zf, "stops.txt")
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
        # Each stop named as its station (the parent's name, apart where
        # two stations share one: Kolín in Czechia), the parent left out
        # of the file.
        s[ni] = BY_ID.get(home[idi], home[ni])
        s[pari] = ""
        if li is not None:
            s[li] = ""
        kept_stops.append(s)
        # Two stations of one name, far apart, would fold into one: say so.
        sid = station(s[ni])[0]
        lat, lon = float(s[sc.index("stop_lat")]), float(s[sc.index("stop_lon")])
        if sid in seen and (abs(seen[sid][0] - lat) > 0.05 or abs(seen[sid][1] - lon) > 0.05):
            print(f"  poland: WARNING two stations named {s[ni]!r} fold into one ({sid}); split them by id")
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
    print(f"  poland: cut to {len(route_ids)} routes, {len(trip_ids)} trips, {len(kept_stops) - 1} stops")
    return out.getvalue()


GTFS = {a: (GTFS_URL, keep(a), line, station,
            {"convert": convert, "number": number, "tz": TZ})
        for a in AGENCIES}

# Poland's track (P3, not built yet): OpenStreetMap's mainline track in
# the box, routed from the timetables.
RAIL = {"region": "pl", "bbox": BBOX, "network": "pkp"}
