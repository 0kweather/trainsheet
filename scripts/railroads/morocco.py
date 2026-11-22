"""Morocco (ONCF): Al Boraq, the high-speed trains (Casablanca-Rabat-
Kenitra-Tangier), Al Atlas, the long-distance trains (night trains among
them), and TNR, the shuttles (Casablanca-Kenitra, Settat and El Jadida, and
Al Bidaoui, Casa Port to Mohammed V airport), from a community GTFS of
ONCF's timetable (orhazal/oncf-gtfs-unofficial on GitHub: built from the
timetables ONCF publishes on oncf-voyages.ma, its stations placed from
OpenStreetMap; ODbL). ONCF publishes no timetable data or live feed of its
own, so the timetable is unofficial, and the trains are placed from it (a
"timetable" source, no parser file), marked estimated, as China's, Italy's
and Portugal's are. The feed is downloaded fresh at each build.

The feed's other agency, Supratours (ONCF's coaches), is left out, as are
any of ONCF's routes that aren't trains (route types: 101 Al Boraq, 102
Al Atlas, 109 TNR). Stations are the feed's parent stations; times are
Morocco's (Africa/Casablanca)."""

GTFS_URL = "https://github.com/orhazal/oncf-gtfs-unofficial/raw/refs/heads/master/oncf-gtfs.zip"
TZ = "Africa/Casablanca"
CREDIT = {"label": "Timetable from oncf-gtfs (unofficial, from ONCF's published timetables); stations from OpenStreetMap contributors",
          "href": "https://github.com/orhazal/oncf-gtfs-unofficial"}
# Morocco's railway, from Safi and Marrakech to Oujda, Tangier and Nador
# (every station the feed's trains call at; its coach stops reach further
# south, but no train does).
BBOX = [-9.6, 31.2, -1.6, 36.0]
COMMON = {"region": "Morocco", "country": "MA", "tz": TZ, "credit": CREDIT, "license": "ODbL", "bbox": BBOX,
          "clip": True}

AGENCIES = {
    "alboraq": {"name": "Al Boraq", "short": "Al Boraq", "color": "#e82030", "kind": "intercity", "cars": "alboraq",
                **COMMON},
    "alatlas": {"name": "Al Atlas", "short": "Al Atlas", "color": "#f87820", "kind": "intercity", "after": "alboraq",
                "cars": "alatlas", **COMMON},
    "tnr": {"name": "TNR", "short": "TNR", "color": "#4a20aa", "kind": "commuter", "after": "alatlas", "cars": "tnr",
            **COMMON},
}
SOURCES = [{"id": "morocco", "agencies": list(AGENCIES), "format": "timetable", "interval": 60, "scope": "view"}]

ONCF = "0093"  # agency.txt's ONCF (the other is Supratours, its coaches)
ROUTE_TYPES = {"alboraq": "101", "alatlas": "102", "tnr": "109"}


def keep(agency):
    return lambda r: r["agency_id"] == ONCF and r["route_type"] == ROUTE_TYPES[agency]


def line(r):
    """Al Boraq and Al Atlas are each one line; TNR's are its routes
    ("Casablanca - Kénitra"), and Al Bidaoui, the airport shuttle."""
    if r["route_type"] == "109" and r["route_short_name"] == "TNR":
        return r["route_long_name"].strip()
    return r["route_short_name"].strip()


# trip_short_name is the train's number as ONCF prints it ("1061", "A12",
# "V60004"; the night trains' "TM", "OT").
number = lambda t: (t.get("trip_short_name") or "").strip() or None

# The feed's names as ONCF writes them, but for an abbreviation and
# capitals lost after hyphens.
NAMES = {"Aeroport Med V": "Aéroport Mohammed V", "Ain-taoujdate": "Aïn Taoujdate", "Beni-oukil": "Beni Oukil",
         "Sebaa-aioun": "Sebaa Aioun", "Facultes": "Facultés"}
TNR_LINES = ["Casablanca - Kénitra", "Casablanca - Settat", "Casablanca - El Jadida", "Al Bidaoui"]
LINES = {"alboraq": ["Al Boraq"], "alatlas": ["Al Atlas"], "tnr": TNR_LINES}

GTFS = {a: (GTFS_URL, keep(a), line,
            {"number": number, "tz": TZ, "names": NAMES, "colors": {l: AGENCIES[a]["color"] for l in LINES[a]}})
        for a in AGENCIES}

# Morocco's track, built offline from Geofabrik's extract (scripts/osm_tiles.py
# africa/morocco, then build_rail.py --offline --only morocco), the
# timetables routed over OpenStreetMap's mainline track.
RAIL = {"region": "ma", "bbox": BBOX, "network": "alatlas"}
