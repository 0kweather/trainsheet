"""Indonesia: KCI's KRL Commuter Line (Kereta Commuter Indonesia),
Jabodetabek only, from the community KRL GTFS published by open-krl on
GitHub (open-krl/pipeline, release v0.1.0, krl_gtfs_v1.zip: keyless —
KAI and KCI publish no GTFS themselves). No live feed is read: the trains
are placed from the timetable (a "timetable" source, no parser file),
marked estimated. The feed is downloaded fresh at each build from the
"latest" release URL (which redirects releases/latest -> v0.1.0 ->
release-assets; urllib follows); this edition (123,526 B, fetched
2026-11-23) runs 2026-09-17 -> 2026-12-31 (calendar.txt) — about five
weeks left at build time, so the Monday refresh must pick up the next
release or the build ships an expired timetable after Dec 31, 2026.

The feed is one agency (KCI, Asia/Jakarta), 6 routes, 1,139 trips, 94
stops (every one called at), 18,416 stop times. Route types are all 2
(rail), so every route is kept. route_long_name is "Commuter Line
Bogor" and the like; line() files it as "Bogor Line", one line per route
in both directions: Bogor (372 trips), Cikarang (361), Rangkasbitung
(206), Tangerang (122), Tanjung Priok (64) and Merak (14 — the diesel
Lokal Merak, Rangkasbitung–Merak, in the same agency and route type, so
it is kept). Each route's colour is filed per route and kept (Merak and
Rangkasbitung share 16812B). The trip_id is the train number as filed
("1000", "1602D", "2203A"; some carry a letter suffix); there is no
trip_short_name; trip_headsign is the destination in capitals.

Services are weekdays only: SVC_WD_REG (1,123 trips) and SVC_WD_FAK
(16), Mon–Fri, 2026-09-17 -> 2026-12-31; calendar_dates.txt removes
SVC_WD_FAK on 2026-12-25. 184 stop times run past midnight ("24:05:00"),
kept as such. The feed files no weekend service.

Scope: KRL Commuter Line in Jabodetabek only (Jakarta, Bogor, Depok,
Tangerang, Bekasi, out to Rangkasbitung and Merak). Despite the survey's
note, this release has no Yogyakarta–Solo stops, so that line is not
covered; KAI's intercity trains have no keyless feed and are out of scope.

Rolling stock (from the photos in world-build/countries/id/photos/, not
the feed — it names none): mostly ex-Japanese EMUs — JR 205, Tokyo Metro
6000 and 05, with the Tokyu 8500, JR 203 and Tokyo Metro 7000 retired in
November 2026 — plus the new SFC120-V (CLI-125) and iE305 (CLI-225);
the Lokal Merak runs CC201/CC203 diesels with K3 coaches.

Stations: the feed has no parent stations or platforms; stops are the
stations, filed in capitals ("JAKARTA KOTA", "DUREN KALIBATA",
"UNIV. PANCASILA"); build_stations.py title-cases them. All 94 ids are
distinct. Times are Jakarta's (Asia/Jakarta, WIB).

P2 spot check: (filled in from the built file below)."""
import re, unicodedata

GTFS_URL = "https://github.com/open-krl/pipeline/releases/latest/download/krl_gtfs_v1.zip"
TZ = "Asia/Jakarta"
CREDIT = {"label": "Timetable from GitHub open-krl/pipeline (community KRL Commuter Line GTFS; "
                   "KAI and KCI publish no GTFS themselves)",
          "href": "https://github.com/open-krl/pipeline"}
# Jabodetabek, from Merak (105.997E) in the west to Cikarang (107.145E)
# in the east, Bogor (6.594S) north to Tanjung Priok and Ancol (5.930S);
# the box is sized to the stops with a small margin.
BBOX = [105.95, -6.65, 107.2, -5.88]
COMMON = {"region": "Jabodetabek", "country": "ID", "tz": TZ, "credit": CREDIT, "license": None, "bbox": BBOX,
          "clip": True}

AGENCIES = {
    "kci": {"name": "Kereta Commuter Indonesia", "short": "KCI", "color": "#e30a16", "kind": "commuter",
            "cars": "kci", **COMMON},
}
SOURCES = [{"id": "indonesia", "agencies": list(AGENCIES), "format": "timetable", "interval": 60, "scope": "view"}]

# The feed's only route type is 2 (rail); every route is kept.
TRAIN_TYPES = {"2"}


def keep(agency):
    return lambda r: r["route_type"] in TRAIN_TYPES


def line(r):
    """"Commuter Line Bogor" -> "Bogor Line"; one name per route, so both
    directions share it."""
    name = (r.get("route_long_name") or "").strip()
    name = re.sub(r"^commuter\s+line\s+", "", name, flags=re.I).strip()
    if name:
        return f"{name} Line"
    return (r.get("route_short_name") or "").strip() or AGENCIES["kci"]["name"]


# The train's number: the trip id as filed ("1000", "1602D").
number = lambda t: (t.get("trip_short_name") or t.get("trip_id") or "").strip() or None


def station(name):
    """(station id, name): "JAKARTA KOTA" -> ("jakarta-kota", "JAKARTA
    KOTA"); "UNIV. PANCASILA" -> ("univ-pancasila", ...). feeds.slug's
    rule: NFKD, accents dropped, hyphenated. build_stations.py title-cases
    the all-caps names."""
    name = name.strip()
    low = name.lower()
    if all(c.isascii() or unicodedata.name(c, "").startswith("LATIN") for c in low if c.isalnum()):
        plain = unicodedata.normalize("NFKD", low).encode("ascii", "ignore").decode()
        return re.sub(r"[^a-z0-9]+", "-", plain).strip("-"), name
    return re.sub(r"-+", "-", "".join(c if c.isalnum() or unicodedata.combining(c) else "-"
                                      for c in unicodedata.normalize("NFC", low))).strip("-"), name


GTFS = {a: (GTFS_URL, keep(a), line, station,
            {"number": number, "tz": TZ})
        for a in AGENCIES}

# Jabodetabek's track (P3): OpenStreetMap's rail in the box, routed from
# the timetables.
RAIL = {"region": "id", "bbox": BBOX, "network": "kci"}
