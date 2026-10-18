"""Slovakia's passenger trains (ŽSR's network): ZSSK, RegioJet and Leo
Express. Positions and delays from the community GTFS-realtime feed that
Transitous uses (jbb.ghsq.de, rebuilt every minute), through the relay (it
sends no CORS headers), with its trip updates appended. A train is placed at
the last station that reported it, so it moves station by station. Stops,
lines and train numbers come from ŽSR's own timetable on the national open
data catalogue; the parser is js/railroads/zsr.js.

ŽSR's own train map (mapa.zsr.sk) is not used: its terms forbid automated
downloading and passing its data on."""

AGENCIES = {
    "zssk": {"name": "Železničná spoločnosť Slovensko", "short": "ZSSK", "region": "Slovakia", "country": "SK", "color": "#ff671f",
             "kind": "intercity", "tz": "Europe/Bratislava",
             "credit": {"label": "ŽSR (timetable), jbb.ghsq.de (live)", "href": "https://data.slovensko.sk/datasety/ebeeedf1-aca2-451a-bdc0-35d536714888"},
             "license": "CC BY 1.0 (timetable)", "bbox": [16.83, 47.73, 22.57, 49.62], "cars": True},
    "regiojetsk": {"name": "RegioJet (Slovakia)", "short": "RegioJet", "region": "Slovakia", "country": "SK", "color": "#fbc400",
                   "kind": "intercity", "tz": "Europe/Bratislava",
                   "credit": {"label": "ŽSR (timetable), jbb.ghsq.de (live)", "href": "https://data.slovensko.sk/datasety/ebeeedf1-aca2-451a-bdc0-35d536714888"},
                   "license": "CC BY 1.0 (timetable)", "bbox": [17.10, 48.14, 21.27, 49.45], "after": "zssk", "cars": True},
    "leoexpresssk": {"name": "Leo Express (Slovakia)", "short": "Leo Express", "region": "Slovakia", "country": "SK", "color": "#c8a04a",
                     "kind": "intercity", "tz": "Europe/Bratislava",
                     "credit": {"label": "ŽSR (timetable), jbb.ghsq.de (live)", "href": "https://data.slovensko.sk/datasety/ebeeedf1-aca2-451a-bdc0-35d536714888"},
                     "license": "CC BY 1.0 (timetable)", "bbox": [17.10, 47.75, 21.25, 49.45], "after": "regiojetsk", "cars": True},
}
# The feed is rebuilt once a minute, and a train's position changes only when
# the next station reports it, so a poll a minute; the relay's 60 s cache
# keeps the server at 120 requests an hour (positions and trip updates)
# however many people watch. Only Slovakia's view polls it.
SOURCES = [{"id": "zsr", "agencies": ["zssk", "regiojetsk", "leoexpresssk"], "format": "pb", "interval": 60, "relay": True,
            "needsKey": False, "scope": "view"}]
RELAY = {"zsr": {"url": "https://jbb.ghsq.de/gtfs/zsr/VehiclePositions", "also": ["https://jbb.ghsq.de/gtfs/zsr/TripUpdates"],
                 "ua": True, "ttl": 60}}

# ŽSR's timetable (CC BY 1.0) has every passenger train in Slovakia, each its
# own route ("R 680" "ZEMPLÍN"); the map's lines are the train categories.
# The catalogue gives each edition its own download id, so this one (5
# October 2026, running to 12 December) wants the next edition's id when it
# comes: the dataset is data.slovensko.sk/datasety/ebeeedf1-aca2-451a-bdc0-35d536714888.
TIMETABLE = "https://data.slovensko.sk/download?id=fb3a9724-623b-4ddf-a6b5-a19b4a346281"
CATEGORIES = {
    "Os": "Osobný vlak", "Zr": "Zrýchlený vlak", "REX": "Regionálny expres", "RRR": "Regionálny rýchlik", "R": "Rýchlik",
    "Ex": "Expres", "IC": "InterCity", "EC": "EuroCity", "SC": "SuperCity", "EN": "EuroNight", "rj": "railjet",
    "rjx": "railjet xpress", "RJ": "RegioJet", "LE": "Leo Express",
}
# agency.txt: 0 ZSSK, 1 RegioJet, 2 Leo Express (from Prague), 3 Leo Express
# Slovensko (Bratislava-Komárno). Leo Express's EuroCity is its own.
OPERATORS = {"zssk": {"0"}, "regiojetsk": {"1"}, "leoexpresssk": {"2", "3"}}


def line(r):
    kind = (r.get("route_short_name") or "").split(" ")[0]
    if r.get("agency_id") == "2" and kind in ("EC", "LE"):
        return "Leo Express"
    return CATEGORIES.get(kind, kind)


# Train numbers are the trips' short names ("680"). The new Valaliky terminál
# stop is filed at 0, 0; it is placed as OpenStreetMap has it. Every route is
# filed in ZSSK's orange; RegioJet's and Leo Express's own trains take their
# operators' colors.
SHARED = {"number": lambda t: t.get("trip_short_name") or None, "positions": {"5615321": [48.63309, 21.29419]}}
COLORS = {"regiojetsk": {"RegioJet": "#fbc400"}, "leoexpresssk": {"Leo Express": "#c8a04a"}}
GTFS = {a: (TIMETABLE, lambda r, ids=ids: r.get("agency_id") in ids, line, {**SHARED, **({"colors": COLORS[a]} if a in COLORS else {})})
        for a, ids in OPERATORS.items()}

# Slovakia's main and branch lines.
RAIL = {"region": "sk", "bbox": [16.80, 47.70, 22.60, 49.65], "network": "zssk"}
