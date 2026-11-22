"""Turkey: TCDD Taşımacılık's passenger trains — YHT high-speed, mainline
(anahat) and regional (bölgesel) — from the community TCDD GTFS published by
yasinkaraaslan/tcdd-gtfs on GitHub (output/tcdd.zip: keyless, converted from
TCDD Taşımacılık's published timetables — TCDD publishes no GTFS itself). No
live feed is read: the trains are placed from the timetable (a "timetable"
source, no parser file), marked estimated. The feed is downloaded fresh at
each build; this edition (55,494 B, fetched 2026-11-22) runs
2026-01-01 -> 2026-12-31 — a calendar-year edition, so the refresh must pick up the 2027 file or the
build ships an expired timetable after Dec 31, 2026.

The feed is stops, agency, calendar, routes, trips and stop_times alone (no
feed_info, shapes or calendar_dates). One agency, tcdd-tasimacilik ("TCDD
Taşımacılık A.Ş.", Europe/Istanbul). 90 routes, all rail, in the extended
GTFS rail codes: 101 YHT high-speed (12 routes), 102 long-distance mainline
(30) and 106 regional (48); there are no bus routes. 233 trips; services
are calendar.txt only (DAILY plus named ones: GUNEY_ANK_KTL, VANGOLU_ANK_TTV,
EYLUL4_ANK_MLT, VAN_TAHRAN, ...). The cities' suburban networks — Marmaray,
Başkentray, İZBAN — are separate operations and NOT in the feed.

Of its 621 stops only 496 are called at, and one of those (stop 1424,
between Ortaklar and Germencik) has no stops.txt row, so 495 are placed;
the rest include non-passenger timing points ("EU102 KM 59+108 MAKAS",
"KM 98+382") and stops filed with wrong coordinates (CEYHAN at lon 5.8,
AYVALI at lat 29.98), so "convert" keeps only the stops stop_times.txt
uses and those never enter the build. Fourteen km-post halts the trains
do call at, with 1–2 minute stops (Km. 476+000, Km 21+652 Makas), are kept
as stations: the timetable lists them as stops and the feed carries no
pickup/drop-off data to say otherwise.
stop_times.txt has no pickup/drop-off columns: every listed stop is a call.

Cross-border trains are kept whole, all their stops, as Ukraine's are:
İstanbul–Sofia–București (SOFYA(SOFIA), PLOVDIV, RUSE, BUCURESTI NORD) and
Van–Tehran (TEBRİZ, TAHRAN); the railroad "clips" to the box (BBOX, below),
so its extent stays Turkey's.

Stations: the feed's stops are the stations, named in all-caps Turkish as
filed ("ANKARA GAR", "İZMİR (BASMANE)", "DİYARBAKIR"); "station" shows them
in Turkish title case ("Ankara Gar", "İzmir (Basmane)", "Diyarbakır": İ
stays İ, I becomes ı). Ids are ASCII slugs, Turkish letters folded by an
explicit table (ı/İ→i, ğ→g, ş→s, ç→c, ö→o, ü→u) — NFKD alone would drop
the dotless ı. Train numbers are the trips' short names ("22014"); the
headsign is "<number> <NAME>". Times are Turkey's (Europe/Istanbul)."""
import csv, io, re, unicodedata, zipfile

GTFS_URL = "https://github.com/yasinkaraaslan/tcdd-gtfs/raw/main/output/tcdd.zip"
TZ = "Europe/Istanbul"
CREDIT = {"label": "Timetable from yasinkaraaslan/tcdd-gtfs (community TCDD GTFS, converted from TCDD Taşımacılık's published timetables)",
          "href": "https://github.com/yasinkaraaslan/tcdd-gtfs"}
# Turkey, from Edirne and Kapıkule in the west to Van and Kapıköy in the
# east; the box takes in Bulgaria and Romania (Sofia, Plovdiv, Ruse,
# București) and north-west Iran (Tabriz, Tehran), so the cross-border
# trains' termini stay inside it, while clip keeps the railroad's extent
# Turkey's.
BBOX = [22.0, 35.0, 52.0, 45.0]
COMMON = {"region": "Turkey", "country": "TR", "tz": TZ, "credit": CREDIT, "license": None, "bbox": BBOX,
          "clip": True}

AGENCIES = {
    "tcdd": {"name": "TCDD Taşımacılık", "short": "TCDD", "color": "#1f3864", "kind": "intercity",
             "cars": "tcdd", **COMMON},
}
SOURCES = [{"id": "turkey", "agencies": list(AGENCIES), "format": "timetable", "interval": 60, "scope": "view"}]

# The feed's rail route types (extended GTFS: 101 high-speed YHT, 102
# long-distance mainline, 106 regional); every route in the feed is one.
TRAIN_TYPES = {"101", "102", "106"}


def keep(agency):
    return lambda r: r["route_type"] in TRAIN_TYPES


# ---------- Names ----------
# Names the Turkish title rule gets wrong, shown as signed instead: the
# cross-border stops are Bulgarian/Romanian, not Turkish (the I -> ı rule
# would make "Bucureşti" of them), and Adnan Menderes airport station is
# filed as one word. Plain Latin title case, as filed, without diacritics.
FIXED = {"BUCURESTI NORD": "Bucuresti Nord", "DIMITROVGRAD": "Dimitrovgrad",
         "GIURGIU NORD": "Giurgiu Nord", "GORNA ORYAHOVITSA": "Gorna Oryahovitsa",
         "PAZARDJIK": "Pazardjik", "PLOVDIV": "Plovdiv",
         "SOFYA(SOFIA)": "Sofya(Sofia)", "SOFIA": "Sofia", "SVILENGRAD": "Svilengrad",
         "VELIKO TARNOVO": "Veliko Tarnovo", "VIDELE": "Videle",
         "ADNANMENDERES HAVAALANI": "Adnan Menderes Havaalanı"}


def title(name):
    """Turkish-aware title case of an all-caps name: "DİYARBAKIR" ->
    "Diyarbakır", "İZMİR (BASMANE)" -> "İzmir (Basmane)". str.lower() would
    make I an i (not ı) and İ an i plus a combining dot, so both go first.
    YHT and MYO stay capitalised as acronyms ("Kırıkkale YHT")."""
    name = name.strip()
    if name in FIXED:
        return FIXED[name]
    low = name.replace("İ", "i").replace("I", "ı").lower()
    up = lambda c: {"i": "İ", "ı": "I"}.get(c, c.upper())
    out = re.sub(r"(^|[\s(\-/.])(\w)", lambda m: m.group(1) + up(m.group(2)), low)
    return re.sub(r"\b(Yht|Myo)\b", lambda m: m.group(1).upper(), out)


HUB = "ANKARA GAR"
# A route long name's service tail: "ANKARA GAR - KURTALAN (ANAHAT)". One
# route files it nested — "İZMİR (BASMANE (ANAHAT))" — so the suffix is
# cut wherever it sits, and a space left before ")" is tidied.
KIND = re.compile(r"\s*\((?:ANAHAT|BÖLGESEL|YHT)\)")


def line(r):
    """The corridor's two ends, hub-first ("Ankara Gar – Kurtalan"), else
    alphabetical ("İstanbul – Sivas"), so both directions share one line;
    the route's short name, else the agency's, where the long name has no
    two ends."""
    name = re.sub(r"\s+\)", ")", KIND.sub("", (r.get("route_long_name") or "").strip())).strip()
    parts = [p.strip() for p in name.split(" - ")]
    if len(parts) < 2:  # "SİVAS-ANKARA GAR", no spaces round the hyphen
        parts = [p.strip() for p in name.split("-")]
    if len(parts) >= 2 and all(parts) and parts[0] != parts[-1]:
        ends = [parts[0], parts[-1]]
        if HUB in ends:
            ends.sort(key=lambda e: e != HUB)
        else:
            ends.sort(key=lambda e: station(e)[0])
        return " – ".join(title(e) for e in ends)
    return (r.get("route_short_name") or "").strip() or AGENCIES["tcdd"]["name"]


# The train's number as the feed prints it ("22014").
number = lambda t: (t.get("trip_short_name") or "").strip() or None


# ---------- Stations ----------
FOLD = str.maketrans({"ı": "i", "İ": "i", "ğ": "g", "Ğ": "g", "ş": "s", "Ş": "s", "ç": "c", "Ç": "c",
                      "ö": "o", "Ö": "o", "ü": "u", "Ü": "u"})


def station(name):
    """(station id, name): "DİYARBAKIR" -> ("diyarbakir", "Diyarbakır");
    "İZMİR (BASMANE)" -> ("izmir-basmane", "İzmir (Basmane)"). Turkish
    letters fold by FOLD first; NFKD then takes any other accent off
    (the Romanian and Bulgarian stops' Latin names)."""
    name = name.strip()
    plain = unicodedata.normalize("NFKD", name.translate(FOLD).lower()).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", plain).strip("-"), title(name)


# ---------- The timetable, cut ----------
def _read(zf, name):
    with zf.open(name) as f:
        return list(csv.reader(io.TextIOWrapper(f, "utf-8-sig")))


def _write(rows):
    out = io.StringIO()
    csv.writer(out, lineterminator="\n").writerows(rows)
    return out.getvalue().encode()


def convert(data):
    """yasinkaraaslan/tcdd-gtfs's file as a GTFS of TCDD's trains alone
    (feeds.py's "convert", run once a build): the rail routes (all of them:
    the feed carries no buses), their trips and stop times, the stops those
    call at — so the uncalled timing points and the misplaced stops stay
    out — and the services' calendars (calendar.txt, and calendar_dates.txt
    if a later edition has one). The one called stop with no stops.txt row
    (1424) has its calls dropped. The feed has no shapes. stop_times.txt is
    streamed, its trip id compared before a line is parsed; it has no
    pickup/drop-off columns, so every row is a call."""
    zf = zipfile.ZipFile(io.BytesIO(data))
    routes = _read(zf, "routes.txt")
    rc = routes[0]
    kept_routes = [routes[0]] + [r for r in routes[1:] if r[rc.index("route_type")] in TRAIN_TYPES]
    route_ids = {r[rc.index("route_id")] for r in kept_routes[1:]}
    trips = _read(zf, "trips.txt")
    tc = trips[0]
    kept_trips = [trips[0]] + [t for t in trips[1:] if t[tc.index("route_id")] in route_ids]
    trip_ids = {t[tc.index("trip_id")] for t in kept_trips[1:]}
    services = {t[tc.index("service_id")] for t in kept_trips[1:]}
    stops = _read(zf, "stops.txt")
    sc = stops[0]
    # One stop_time's stop (1424, between Ortaklar and Germencik on the
    # İzmir–Denizli line) has no stops.txt row, so it cannot be placed:
    # its rows are dropped, with a warning, rather than carried as a
    # stop with no position.
    stop_ids = {s[sc.index("stop_id")] for s in stops[1:]}
    times, used, dropped = [], set(), set()
    with zf.open("stop_times.txt") as f:
        head = f.readline()
        cols = next(csv.reader([head.decode("utf-8-sig")]))
        ti, si = cols.index("trip_id"), cols.index("stop_id")
        times.append(head)
        for raw in f:
            text = raw.decode("utf-8")
            if text.split(",", ti + 1)[ti].strip().strip('"') not in trip_ids:
                continue
            row = next(csv.reader([text]))
            if row[ti] in trip_ids:
                if row[si] not in stop_ids:
                    if row[si] not in dropped:
                        print(f"  turkey: WARNING stop {row[si]} in stop_times.txt has no stops.txt row; its calls are dropped")
                    dropped.add(row[si])
                    continue
                times.append(raw)
                used.add(row[si])
    kept_stops, seen = [sc], {}
    for s in stops[1:]:
        if s[sc.index("stop_id")] not in used:
            continue
        kept_stops.append(s)
        # Two stations of one name, far apart, would fold into one: say so.
        sid = station(s[sc.index("stop_name")])[0]
        lat, lon = float(s[sc.index("stop_lat")]), float(s[sc.index("stop_lon")])
        if sid in seen and (abs(seen[sid][0] - lat) > 0.05 or abs(seen[sid][1] - lon) > 0.05):
            print(f"  turkey: WARNING two stations named {s[sc.index('stop_name')]!r} fold into one ({sid}); split them by id")
        seen.setdefault(sid, (lat, lon))
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
    print(f"  turkey: cut to {len(route_ids)} routes, {len(trip_ids)} trips, {len(kept_stops) - 1} stops")
    return out.getvalue()


GTFS = {a: (GTFS_URL, keep(a), line, station,
            {"convert": convert, "number": number, "tz": TZ})
        for a in AGENCIES}

# Turkey's track (P3): OpenStreetMap's mainline track in the box, routed
# from the timetables.
RAIL = {"region": "tr", "bbox": BBOX, "network": "tcdd"}
