"""Victoria's trains: Metro Trains Melbourne's suburban lines and V/Line's
regional ones, from Transport Victoria's open data. Their GTFS-realtime
positions, with their trip updates appended, come through the relay, which
holds the free key the feeds need (VIC_OPENDATA_KEY, sent in a KeyId
header; register at https://opendata.transport.vic.gov.au). Until it is set
the feeds are off and both railroads' trains are placed from their
timetables, marked as estimated.

Trains are numbered by their run (Metro's and V/Line's train description
numbers, "2302", "C123", "8605"): the end of each trip id, in the realtime
feeds as in the timetable. The trip updates' stops and route ids don't
always match the timetable's (V/Line's have named its platforms "G1545-P2"
and its routes "1-TRN-mjp-5"), so a train's stops come from its run in
data/schedules/<railroad>.json, shifted by its delay, as Queensland's do.
Metro's vehicle id lists the train's cars ("107M-108M-1354T-1424T-247M-248M",
sorted as text), V/Line's its lead unit or locomotive ("V1142", "N452").
The parser is js/railroads/ptv.js."""

CREDIT = {"label": "Transport Victoria", "href": "https://opendata.transport.vic.gov.au"}
AGENCIES = {
    "metrotrains": {"name": "Metro Trains Melbourne", "short": "Metro", "region": "Melbourne", "country": "AU",
                    "color": "#0072ce", "kind": "commuter", "tz": "Australia/Melbourne", "credit": CREDIT,
                    "license": "CC BY 4.0", "bbox": [144.55, -38.45, 145.5, -37.45], "cars": True},
    "vline": {"name": "V/Line", "short": "V/Line", "region": "Victoria", "country": "AU", "color": "#8f1a95",
              "kind": "intercity", "tz": "Australia/Melbourne", "credit": CREDIT, "license": "CC BY 4.0",
              "bbox": [142.4, -38.4, 147.65, -35.3], "cars": True, "after": "metrotrains"},
}
# Each feed allows 20 to 27 requests a minute per key (by its size) and is
# cached upstream for 30 s. A poll every 30 s, with the relay keeping each
# answer 20 s, asks each of the four (Metro's and V/Line's positions and
# trip updates) at most three times a minute from each Worker instance
# (about one per busy Cloudflare location), whatever the number of viewers:
# up to six locations at once (Melbourne, Sydney and a few abroad) stay
# within the limit, and an answer is never more than 50 s old. Only the
# trip updates of the trains reporting a position go on (Metro's whole file
# is about 80 KB): "^" keeps every vehicle, an empty id too.
SOURCES = [{"id": "metrotrains", "agencies": ["metrotrains"], "format": "pb", "interval": 30, "relay": True,
            "needsKey": "VIC_OPENDATA_KEY", "untilKey": "timetable", "scope": "view"},
           {"id": "vline", "agencies": ["vline"], "format": "pb", "interval": 30, "relay": True,
            "needsKey": "VIC_OPENDATA_KEY", "untilKey": "timetable", "scope": "view", "after": "metrotrains"}]
RT = "https://api.opendata.transport.vic.gov.au/opendata/public-transport/gtfs/realtime/v1/{}/{}"
RELAY = {sid: {"url": RT.format(mode, "vehicle-positions"), "also": [RT.format(mode, "trip-updates")],
               "headers": {"KeyId": "{VIC_OPENDATA_KEY}"}, "keys": ["VIC_OPENDATA_KEY"], "ua": True, "ttl": 20,
               "vehicles": "^"}
         for sid, mode in (("metrotrains", "metro"), ("vline", "vline"))}

# Transport Victoria's timetable is one zip of each mode's own: 1 is V/Line's
# trains, 2 Metro's (with its rail replacement buses, route ids ending
# "-R:", left out), 10 the Overland (Journey Beyond's, not shown). The
# Mobility Database keeps a copy (mdb-3340) should the portal's link change.
GTFS_ZIP = ("https://opendata.transport.vic.gov.au/dataset/3f4e292e-7f8a-4ffe-831f-1953be0fe448/"
            "resource/fb152201-859f-4882-9206-b768060b50ad/download/gtfs.zip")
# Metro names its lines by their outer ends ("Frankston line"); V/Line has a
# timetable for each of its routes, named by the far end ("Warrnambool
# line": "Warrnambool - Melbourne via Colac & Geelong"; "Ballarat/Wendouree"
# and "Echuca/Moama" by their first).
metro_line = lambda r: f"{r['route_short_name']} line"
vline_line = lambda r: r["route_long_name"].split(" - ")[0].split("/")[0].strip() + " line"
# "02-FKN--1-T2-2302" -> run 2302 (unique on each day: checked on the
# October 2026 timetable, 42,000 Metro and 11,000 V/Line trips).
number = lambda t: t["trip_id"].rsplit("-", 1)[-1]
# Platforms fold into their parent stations ("Flinders Street Railway
# Station", one of them "St Albans Railway Station (St Albans)") -> "Flinders Street".
SUFFIX = r"\s+(Railway\s+)?Station(\s+\(.*\))?$"
GTFS = {
    "metrotrains": (GTFS_ZIP + "#2/google_transit.zip", lambda r: not r["route_id"].endswith("-R:"), metro_line,
                    {"suffix": SUFFIX, "number": number}),
    "vline": (GTFS_ZIP + "#1/google_transit.zip", lambda r: True, vline_line, {"suffix": SUFFIX, "number": number}),
}
# Victoria's broad-gauge suburban and regional lines, and the standard-gauge
# line to Albury, as OpenStreetMap's route relations of Metro's and V/Line's
# trains.
RAIL = {"region": "vic", "bbox": [142.3, -38.6, 147.75, -35.25], "network": "metrotrains",
        "relations": {"operator": "Metro Trains|V/Line", "network": "PTV|Metro Trains|V/Line"}}
