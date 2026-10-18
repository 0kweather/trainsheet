"""Norway's passenger trains: Vy, Go-Ahead Norge, Flytoget and SJ Nord, from
Entur, the national journey planner's open data (NLOD; no key, but each
client names itself in an ET-Client-Name header or is throttled). Vy's,
Go-Ahead's and Flytoget's GTFS-realtime positions, with their trip updates,
come through the relay, one feed per operator (Entur's datasource), which
sends the header and keeps only the trip updates of the trains reporting a
position (the full feeds carry two weeks of trips, 300 KB). Their trip
updates give delays only, so stops and times come from the timetable
(data/schedules/<railroad>.json), as Finland's do. SJ Nord sends no
positions: its trains are placed from the timetable, shifted by Bane NOR's
trip updates where they have them, which so far is never (below). The
parser is js/railroads/entur.js."""
import re, unicodedata

ENTUR = {"label": "Entur", "href": "https://developer.entur.org"}
AGENCIES = {
    "vy": {"name": "Vy", "short": "Vy", "region": "Norway", "country": "NO", "color": "#00866e", "kind": "commuter",
           "tz": "Europe/Oslo", "credit": ENTUR, "license": "NLOD", "bbox": [5.2, 57.6, 13.6, 61.2]},
    "goaheadnorge": {"name": "Go-Ahead Norge", "short": "Go-Ahead", "region": "Norway", "country": "NO", "color": "#d6001c",
                     "kind": "commuter", "tz": "Europe/Oslo", "credit": ENTUR, "license": "NLOD", "bbox": [5.6, 58.1, 10.8, 59.95],
                     "after": "vy"},
    "flytoget": {"name": "Flytoget", "short": "Flytoget", "region": "Oslo", "country": "NO", "color": "#6d6e71", "kind": "commuter",
                 "tz": "Europe/Oslo", "credit": ENTUR, "license": "NLOD", "bbox": [10.15, 59.7, 11.15, 60.25], "after": "goaheadnorge"},
    "sjnord": {"name": "SJ Nord", "short": "SJ Nord", "region": "Norway", "country": "NO", "color": "#2b2d42", "kind": "commuter",
               "tz": "Europe/Oslo", "credit": ENTUR, "license": "NLOD", "bbox": [7.6, 59.9, 14.5, 67.3], "after": "flytoget"},
}
# Entur refreshes the feeds every 15 seconds; a poll every 30 and the relay
# keeping each answer as long serves all of a Worker instance's viewers with
# four upstream requests a minute per operator (positions, then trip
# updates, twice), and one every ten minutes for SJ Nord's: about 12 a
# minute for each instance (one per busy Cloudflare location).
SOURCES = [{"id": "vy", "agencies": ["vy"], "format": "pb", "interval": 30, "relay": True, "needsKey": False},
           {"id": "goaheadnorge", "agencies": ["goaheadnorge"], "format": "pb", "interval": 30, "relay": True, "needsKey": False,
            "after": "vy"},
           {"id": "flytoget", "agencies": ["flytoget"], "format": "pb", "interval": 30, "relay": True, "needsKey": False,
            "after": "goaheadnorge"},
           {"id": "sjnord", "agencies": ["sjnord"], "format": "pb", "interval": 60, "relay": True, "needsKey": False,
            "after": "flytoget"}]
RT = "https://api.entur.io/realtime/v1/gtfs-rt/{}?datasource={}"
CLIENT = {"ET-Client-Name": "trainsheet-livemap"}
RELAY = {sid: {"url": RT.format("vehicle-positions", ds), "also": [RT.format("trip-updates", ds)], "headers": CLIENT,
               "ua": True, "ttl": 30, "vehicles": "."}
         for sid, ds in (("vy", "VYG"), ("goaheadnorge", "GOA"), ("flytoget", "FLT"))}
# SJ Nord's trip updates come through Bane NOR (datasource BNR), with other
# operators' trains crossing its lines: only SJ Nord's routes go on, by their
# timetable ids or the line codes Bane NOR's SIRI feed names them by. On
# 18 October 2026 Entur's GTFS-realtime carried no SJ Nord trip at all
# (datasource BNR and SJN gave an empty feed, the whole country's 5 MB no
# "SJN:" trip; only its 50 MB SIRI ET has them), so its trains show as
# "Scheduled", with no delay. The feed still drives their placing, and is
# kept for the day Bane NOR's fills; the relay asks for it every ten minutes.
SJN_LINES = {"21": "F6", "22": "R65", "25": "R60", "26": "R70", "71": "F7", "72": "R71", "79": "R75"}
RELAY["sjnord"] = {"url": RT.format("trip-updates", "BNR"), "headers": CLIENT, "ua": True, "ttl": 600,
                   "routes": sorted(f"SJN:Line:{x}" for pair in SJN_LINES.items() for x in pair)}

# Each operator's own timetable (Entur's codespace files: rail routes only,
# 0.6-60 MB, rather than the whole country's 500 MB). Rail replacement buses
# are filed under the train routes, with trip ids "BUS-1004_..." or
# "B42-A2_...", and stop at bus stops of their own: unnumbered, so they stay
# out of the timetables. Each station's bus stops ("Lillehammer
# skysstasjon", "Asker stasjon Lensmannslia") fold into it by name, as an
# id with the Norwegian letters spelled out ("Bodø" -> "bodo", where
# feeds.slug would drop them: "bod"). A bus stop with no station of its name
# ("Bondi skole", about 40 of them) still lists as a station, since
# build_stations.py keeps routes, not trips.
GTFS_URL = "https://storage.googleapis.com/marduk-production/outbound/gtfs/rb_{}-aggregated-gtfs.zip"
train = lambda r: 100 <= int(r.get("route_type") or 0) <= 117
line = lambda r: r.get("route_short_name") or r.get("route_long_name") or ""
SUFFIX = re.compile(r"\s+(stasjon|station|skysstasjon|bussterminal|busstasjon|terminal)(\s.*)?$")
LETTERS = str.maketrans({"ø": "o", "æ": "ae", "å": "a"})


def station(name):
    """(station id, name) of a stop: "Bodø stasjon" -> ("bodo", "Bodø")."""
    name = SUFFIX.sub("", name.strip())
    name = re.sub(r"^(\w+ S) .+$", r"\1", name)  # "Oslo S Trelastgata", its buses' stop: Oslo S
    plain = unicodedata.normalize("NFKD", name.lower().translate(LETTERS)).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", plain).strip("-"), name


# "VYG:ServiceJourney:139_443138-R" is train 139; "103-383_..." (Oslo-Göteborg)
# is 103 in Norway, 383 in Sweden. Flytoget's are "1-2614-3703-20261017": 3703.
number = lambda t: (re.match(r"[A-Z]+:ServiceJourney:(\d+)[-_]", t["trip_id"]) or [None, None])[1]
flytoget_number = lambda t: (re.match(r"FLT:ServiceJourney:\d+-\d+-(\d+)-\d{8}(_T\d+)?$", t["trip_id"]) or [None, None])[1]
GTFS = {
    "vy": (GTFS_URL.format("vyg"), train, line, station, {"number": number}),
    "goaheadnorge": (GTFS_URL.format("goa"), train, line, station, {"number": number}),
    "flytoget": (GTFS_URL.format("flt"), train, line, station, {"number": flytoget_number}),
    "sjnord": (GTFS_URL.format("sjn"), train, line, station, {"number": number}),
}

# The track: the four operators' route=train relations in OpenStreetMap
# (Vy's Halden-Göteborg runs into Sweden; Vy Tåg's Swedish lines are left
# out), and Norway's main and branch lines, for the lines no relation
# covers (Arendalsbanen, Meråkerbanen).
RAIL = {"region": "no", "bbox": [4.8, 57.6, 15.6, 67.4], "network": "vy",
        "query": 'relation["route"="train"]["operator"~"^(Vy( Tog| Gjøvikbanen)?|NSB|Go-Ahead Norge|Flytoget|SJ Nord|SJ Norge)$",i]'
                 '({bbox})->.ops; way(r.ops)["railway"="rail"]({bbox}); area["ISO3166-1"="NO"]["admin_level"="2"]->.no; '
                 'way(area.no)["railway"="rail"]["usage"~"^(main|branch)$"][!"service"]({bbox});'}
