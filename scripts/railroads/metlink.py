"""Wellington's trains: Metlink's Kāpiti, Hutt Valley, Melling,
Johnsonville and Wairarapa lines (run by Transdev Wellington for Greater
Wellington Regional Council), from Metlink's open data. Its GTFS-realtime
positions, with its trip updates appended, come through the relay, which
holds the free key the feeds need (METLINK_API_KEY, sent in an x-api-key
header; register at https://opendata.metlink.org.nz). Until it is set the
feeds are off and the trains are placed from the timetable, marked as
estimated. Both feeds cover Metlink's buses, ferries and the Cable Car too:
the relay keeps only the trains' entities (routes 2 to 6).

Trains are numbered by Metlink's train numbers, the third part of each trip
id ("KPL__0__6470__RAIL__..." is train 6470), in the realtime feeds as in
the timetable. KiwiRail's Capital Connection (Palmerston North-Wellington)
is in neither Metlink's timetable nor its feeds, so it isn't here. The
parser is js/railroads/metlink.js."""

CREDIT = {"label": "Metlink", "href": "https://opendata.metlink.org.nz"}
# Metlink's own dark teal (metlink.org.nz); its lines keep their own colors.
AGENCIES = {
    "metlink": {"name": "Metlink", "short": "Metlink", "region": "Wellington", "country": "NZ", "color": "#00364a",
                "kind": "commuter", "tz": "Pacific/Auckland", "credit": CREDIT, "license": "CC BY 4.0",
                "bbox": [174.75, -41.3, 175.7, -40.85], "cars": True},
}
# Metlink's keys are limited to 10 requests a second (20 in a burst), with
# no daily quota; the feeds refresh every 5 to 30 s. A poll every 20 s, with
# the relay keeping each answer 20 s, asks the two feeds at most six times a
# minute from each Worker instance, whatever the number of viewers.
SOURCES = [{"id": "metlink", "agencies": ["metlink"], "format": "pb", "interval": 20, "relay": True,
            "needsKey": "METLINK_API_KEY", "untilKey": "timetable", "scope": "view"}]
API = "https://api.opendata.metlink.org.nz/v1/gtfs-rt"
RELAY = {"metlink": {"url": f"{API}/vehiclepositions", "also": [f"{API}/tripupdates"],
                     "headers": {"x-api-key": "{METLINK_API_KEY}", "Accept": "application/x-protobuf"},
                     "keys": ["METLINK_API_KEY"], "routes": ["2", "3", "4", "5", "6"], "ttl": 20}}

# "Kāpiti Line (Waikanae - Wellington)" -> "Kāpiti Line"
line = lambda r: r["route_long_name"].split(" (")[0].strip()
# "KPL__0__6470__RAIL__Rail_SaSu_+_Hol_20261011" -> 6470 (also trips.txt's
# etm_id). Unique on each day of the October 2026 timetable but one: the
# Johnsonville Line's 9323 is both an up and a down train at weekends.
number = lambda t: t["trip_id"].split("__")[2] if t["trip_id"].count("__") >= 2 else t["trip_id"]
# Metlink's whole timetable: the trains are route type 2 (agency RAIL,
# routes 2 to 6). Platforms fold into their parent stations ("WELL1" into
# "WELL", "Wellington Station", named "Wellington").
GTFS = {
    "metlink": ("https://static.opendata.metlink.org.nz/v1/gtfs/full.zip", lambda r: r.get("route_type") == "2", line,
                {"suffix": r"\s+Station$", "number": number}),
}
# Wellington's suburban lines and the Wairarapa Line over the Remutaka
# tunnel to Masterton, as OpenStreetMap's route relations of Metlink's trains.
RAIL = {"region": "nz", "bbox": [174.7, -41.35, 175.75, -40.8], "network": "metlink",
        "relations": {"operator": "Transdev|Metlink|KiwiRail", "network": "Metlink"}}
