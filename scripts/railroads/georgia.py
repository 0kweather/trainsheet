"""Georgia: Georgian Railway's trains (plus the cross-border trains to
Yerevan and Baku filed in the same feed), from the community Georgian
Railway GTFS published by jbb.ghsq.de (ge-georgian-railway.gtfs.zip:
keyless, converted from Georgian Railway's published timetables by Jonah
Brüchert's transitous georgian-railways-gtfs — Georgian Railway publishes
no GTFS itself). No live feed is read: the trains are placed from the
timetable (a "timetable" source, no parser file), marked estimated. The
feed is downloaded fresh at each build; this edition (1,192,782 B,
fetched 2026-11-22) runs 2026-10-18 -> 2027-06-11 (feed_info) — a
near-eight-month window, so the Monday refresh must pick up the next
file or the build ships an expired timetable after Jun 11, 2027.

The feed is one agency (georgian-railway, Asia/Tbilisi), 32 routes, 285
trips, 83 stops, 3,193 stop times. Route types: 2 rail (8 routes), 102
long-distance (10: the Tbilisi–Batumi Stadlers 801–804, 853/854, 869/870,
873/874 and the Tbilisi–Baku 37/38) and 106 regional (14); there are no
bus routes, so every route is kept. Its route_long_name is empty for
every route, so "convert" writes each route's endpoints as its long
name ("Tbilisi Central Station – Batumi-Central"), from the route's
longest trip, and a line is those ends, hub-first, in Croatia's manner.
Its trips carry an empty trip_short_name, so "convert" writes the
route's short name there ("801", "37", "6413").

The feed has no calendar.txt — services are calendar_dates.txt only
(exception_type 1 additions, 3,609 rows, 285 services) — and
build_schedules.py reads that file with optional=True, so the missing
calendar is fine. stop_times.txt has no pickup/drop-off columns, so
every listed stop is a call, as Serbia's and Turkey's are. Times run
past midnight on the overnight trains (Baku arrives 30:24, Yerevan
30:35); build_schedules.py's minutes() takes those as-is. The shapes
(3.6 MB), feed_info, attributions, licenses and translations files are
left out.

Services: each route has one recurring trip (its live pattern, 49–120
dates) plus dated one-off trips, mostly 2026-10-18/19, the feed's first
two days — the one-offs duplicate the recurring pattern a couple of
minutes off. Only the recurring trips fall in the build window, so the
schedule shows one run per train number. One route has no recurring
trip at all: 6417, the 07:00 Zestafoni–Khashuri, ran only Oct 18–19 and
is absent from the live window — as filed, not as a gap in the build.

Cross-border trains are kept whole, all their stops, as Denmark's ECE
and Austria's RJ are: 37/38 Tbilisi–Baku (via Gardabani, Böyük Kəsik,
Ağstafa, Ganja, Yevlax, Biləcəri) and 371/372 Tbilisi–Yerevan (via
Sadakhlo, Ayrum, Vanadzor, Gyumri, Armavir). The railroad "clips" to
the box (BBOX, below), so its extent stays Georgia's; the far termini
Baku and Yerevan stay inside it as stops on trains kept whole.

Stations: the feed has no parent stations or platforms; stops are the
stations, named as signed — mostly transliterated Georgian ("Khashuri",
"Zestafoni"), Azerbaijani for the Baku line ("Böyük Kəsik", "Ağstafa
Stansiyası", "Biləcəri", "Bakı") and Armenian for the Yerevan line
("Gyumri", "Vanadzor"). Ids are slugs by feeds.slug's rule, with ə/ğ/ı
folded by hand (NFKD drops them): "Böyük Kəsik" -> "boyuk-kesik",
"Ağstafa Stansiyası" -> "agstafa-stansiyasi", "Biləcəri" ->
"bileceri", "Bakı" -> "baki". Two stops are the one Tbilisi station,
~40 m apart: "Tbilisi Central Station" (13930771948, used by the
Batumi expresses and the internationals) and "Tbilisi-Central"
(17526363, used by the rest) — "convert" merges them into the one
station "Tbilisi Central Station". One stop is unplaceable: "baqani
2380 km" (57715) is filed at 0.0, 0.0, has no OSM node and no
Nominatim hit, and the feed's own shape is broken at the same place
(0.0, 0.0 shape points between Moliti and Khashuri) — "convert" drops
it and its stop times. It appears only on the Oct 18–19 one-off trips
of the Zestafoni–Khashuri locals, never on a recurring trip, so nothing
in the live window loses a call. The Tbilisi–Gardabani locals call at
"Tbilisi Marshalling", "Tbilisi-Cargo" and "Rustavi-Cargo" as filed;
they are kept, as Lithuania's EMU-depot stops are. Times are Georgia's
(Asia/Tbilisi).

P2 spot check (to verify when schedules are built): train 801,
Batumi-Central 16:50 -> Tbilisi Central Station 20:50 via Kobuleti,
Ureki, Kutaisi International Airport."""
import csv, io, re, unicodedata, zipfile

GTFS_URL = "https://jbb.ghsq.de/gtfs/ge-georgian-railway.gtfs.zip"
TZ = "Asia/Tbilisi"
CREDIT = {"label": "Timetable from jbb.ghsq.de (Georgian Railway GTFS, community conversion of Georgian Railway's published timetables)",
          "href": "https://jbb.ghsq.de/"}
# Georgia, from Poti and Batumi on the Black Sea coast to Gardabani in the
# east and Sadakhlo in the south; the box takes in the cross-border
# termini Baku and Yerevan, so the Tbilisi–Baku and Tbilisi–Yerevan
# trains stay whole.
BBOX = [41.5, 40.0, 50.0, 42.7]
COMMON = {"region": "Georgia", "country": "GE", "tz": TZ, "credit": CREDIT, "license": "ODbL (stops)", "bbox": BBOX,
          "clip": True}

AGENCIES = {
    "georgianrailway": {"name": "Georgian Railway", "short": "Georgian Railway", "color": "#d22630", "kind": "intercity",
                        "cars": "georgianrailway", **COMMON},
}
SOURCES = [{"id": "georgia", "agencies": list(AGENCIES), "format": "timetable", "interval": 60, "scope": "view"}]

# The feed's rail route types (2 rail, 102 long-distance, 106 regional);
# every route in the feed is one of these.
TRAIN_TYPES = {"2", "102", "106"}


def keep(agency):
    return lambda r: r["route_type"] in TRAIN_TYPES


HUB = "Tbilisi Central Station"


def line(r):
    """The route's ends, hub-first ("Tbilisi Central Station –
    Batumi-Central"), else alphabetical, so both directions share one
    line; the route's short name where the long name is empty or a loop."""
    name = (r.get("route_long_name") or "").strip()
    parts = [p.strip() for p in name.split(" – ")]
    if len(parts) >= 2 and all(parts) and parts[0] != parts[-1]:
        ends = [parts[0], parts[-1]]
        if HUB in ends:
            ends.sort(key=lambda e: e != HUB)
        else:
            ends.sort()
        return " – ".join(ends)
    return (r.get("route_short_name") or "").strip() or AGENCIES["georgianrailway"]["name"]


# The train's number as the feed prints it ("801", "37", "6413").
number = lambda t: (t.get("trip_short_name") or "").strip() or None


# ---------- Stations ----------
# NFKD drops ə, ğ and ı (they have no decomposition), so they are folded
# by hand, as Poland folds ł and Serbia folds đ.
LETTERS = str.maketrans({"ə": "e", "Ə": "E", "ğ": "g", "Ğ": "G", "ı": "i", "İ": "I",
                         "ş": "s", "Ş": "S", "ç": "c", "Ç": "C"})


def station(name):
    """(station id, name): "Khashuri" -> ("khashuri", "Khashuri");
    "Böyük Kəsik" -> ("boyuk-kesik", "Böyük Kəsik"); "Bakı" -> ("baki",
    "Bakı"). A name in another script than Latin keeps its letters
    (feeds.slug's rule)."""
    name = name.strip()
    low = name.lower()
    if all(c.isascii() or unicodedata.name(c, "").startswith("LATIN") for c in low if c.isalnum()):
        plain = unicodedata.normalize("NFKD", low.translate(LETTERS)).encode("ascii", "ignore").decode()
        return re.sub(r"[^a-z0-9]+", "-", plain).strip("-"), name
    return re.sub(r"-+", "-", "".join(c if c.isalnum() or unicodedata.combining(c) else "-"
                                      for c in unicodedata.normalize("NFC", low))).strip("-"), name


# The two Tbilisi Central stop ids, one station ~40 m apart; and the
# unplaceable halt (filed at 0.0, 0.0, no OSM node, no Nominatim hit).
TBILISI_MERGE = {"13930771948": "17526363"}
BAQANI = "57715"


# ---------- The timetable, cut ----------
def _read(zf, name):
    with zf.open(name) as f:
        return list(csv.reader(io.TextIOWrapper(f, "utf-8-sig")))


def _write(rows):
    out = io.StringIO()
    csv.writer(out, lineterminator="\n").writerows(rows)
    return out.getvalue().encode()


def convert(data):
    """jbb.ghsq.de's file as a GTFS of Georgian Railway's trains alone
    (feeds.py's "convert", run once a build): the rail routes (all of
    them: the feed carries no buses), their trips and stop times, the
    stops those call at, and their services' calendar_dates (the feed
    has no calendar.txt). The shapes (and feed_info, attributions,
    translations) are left out. Each route's long name is its endpoints,
    from its longest trip; each trip's short name is its train number
    (the feed files neither). The two Tbilisi Central stops are merged
    into the one station; the unplaceable "baqani 2380 km" halt (0.0,
    0.0, on the Oct 18–19 one-offs only) is dropped with its stop times.
    stop_times.txt is streamed, its trip id compared before a line is
    parsed; it has no pickup/drop-off columns, so every row is a call."""
    zf = zipfile.ZipFile(io.BytesIO(data))
    routes = _read(zf, "routes.txt")
    rc = routes[0]
    kept_routes = [routes[0]] + [r for r in routes[1:] if r[rc.index("route_type")] in TRAIN_TYPES]
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
                if row[si] == BAQANI:
                    continue  # unplaceable halt (0.0, 0.0), one-offs only
                merged = TBILISI_MERGE.get(row[si])
                if merged:
                    row[si] = merged
                    times.append(_retime(text, si, merged))
                else:
                    times.append(raw)
                used.add(row[si])
                by_trip.setdefault(row[ti], []).append(row)
    # Each route's long name is its endpoints, from its longest trip's first
    # and last stops (a route's other trips may be short-workings or dated
    # one-offs); each trip's short name is its route's number (the feed
    # files the column empty).
    trips_of = {}
    for t in kept_trips[1:]:
        trips_of.setdefault(t[tc.index("route_id")], []).append(t[tc.index("trip_id")])
    for r in kept_routes[1:]:
        seqs = [by_trip.get(t, []) for t in trips_of.get(r[rc.index("route_id")], [])]
        seq = sorted(max(seqs, key=len, default=[]), key=lambda x: int(x[sq]))
        if seq:
            first = by_id[seq[0][si]][sc.index("stop_name")]
            last = by_id[seq[-1][si]][sc.index("stop_name")]
            if first == "Tbilisi-Central":
                first = "Tbilisi Central Station"
            if last == "Tbilisi-Central":
                last = "Tbilisi Central Station"
            r[rc.index("route_long_name")] = f"{first} – {last}"
    kept_trips[0] = tc
    tsn = tc.index("trip_short_name")  # the feed files the column, empty
    for t in kept_trips[1:]:
        t[tsn] = by_route[t[tc.index("route_id")]][rc.index("route_short_name")]
    kept_stops, seen = [sc], {}
    for s in stops[1:]:
        sid = s[sc.index("stop_id")]
        if sid == BAQANI or sid in TBILISI_MERGE:
            continue
        if sid not in used:
            continue
        s = list(s)
        if s[sc.index("stop_name")] == "Tbilisi-Central":
            s[sc.index("stop_name")] = "Tbilisi Central Station"
        kept_stops.append(s)
        # Two stations of one name, far apart, would fold into one: say so.
        sid_out = station(s[sc.index("stop_name")])[0]
        lat, lon = float(s[sc.index("stop_lat")]), float(s[sc.index("stop_lon")])
        if sid_out in seen and (abs(seen[sid_out][0] - lat) > 0.05 or abs(seen[sid_out][1] - lon) > 0.05):
            print(f"  georgia: WARNING two stations named {s[sc.index('stop_name')]!r} fold into one ({sid_out}); split them by id")
        seen.setdefault(sid_out, (lat, lon))
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
    print(f"  georgia: cut to {len(route_ids)} routes, {len(trip_ids)} trips, {len(kept_stops) - 1} stops")
    return out.getvalue()


def _retime(text, si, new_sid):
    """stop_times.txt's raw line with its stop id replaced (the Tbilisi
    merge): the id is the only field rewritten, so a split-and-join on
    the parsed row keeps the line's quoting."""
    row = next(csv.reader([text]))
    row[si] = new_sid
    out = io.StringIO()
    csv.writer(out, lineterminator="\n").writerow(row)
    return out.getvalue().encode()


GTFS = {a: (GTFS_URL, keep(a), line, station,
            {"convert": convert, "number": number, "tz": TZ})
        for a in AGENCIES}

# Georgia's track (P3): OpenStreetMap's mainline track in the box, routed
# from the timetables.
RAIL = {"region": "ge", "bbox": BBOX, "network": "georgianrailway"}
