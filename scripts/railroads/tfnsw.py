"""Sydney Trains and NSW TrainLink (New South Wales, Australia), from
Transport for NSW's open data (opendata.transport.nsw.gov.au, CC BY 4.0).
The live feeds need a free key from the Open Data Hub (the Worker secret
TFNSW_API_KEY, sent as "Authorization: apikey <key>"): Sydney Trains'
GTFS-realtime v2 positions and trip updates, which cover Sydney Trains and
NSW TrainLink's electric intercity trains, and NSW Trains' v1 feeds, which
cover NSW TrainLink's diesel trains (the Hunter, Southern Highlands and
regional XPT and Xplorer services, and the shuttles beyond Lithgow and
Kiama). The relay fetches all four and sends them back to back as one feed
(relay_fetch below, and its Worker twin relay/feeds/tfnsw.js), NSW Trains'
first: the diesel trains also appear in Sydney Trains' feed, and TfNSW's
technical document (Real Time Train Technical Document v3.5, Appendix A)
asks for NSW Trains' copy, so the parser keeps the first of a run it sees.
Until the key is set, the page places the trains from their timetables
(data/schedules/sydneytrains.json and nswtrainlink.json).

Trains are numbered by their run, the trip id's first part ("159B" in
"159B.1697.101.32.A.8.68334035"), as in TfNSW's working timetables; the
trip id also says the set type ("A", a Waratah) and its cars (8). The
parser is js/railroads/tfnsw.js."""
import urllib.request

CREDIT = {"label": "Transport for NSW", "href": "https://opendata.transport.nsw.gov.au"}
# Which railroad runs a line is TfNSW's own filing: its timetable gives the T
# lines to Sydney Trains (agency x0001) and the intercity lines (Blue
# Mountains, Central Coast and Newcastle, South Coast, Hunter, Southern
# Highlands) and the regional trains to NSW Trains, which trades as NSW
# TrainLink (agencies X0000, X000 and 711). Colors: TfNSW's own for each, the
# Trains mode's orange (its T6's route color) and the regional trains' darker
# orange (their route color).
AGENCIES = {
    "sydneytrains": {"name": "Sydney Trains", "short": "Sydney Trains", "region": "Sydney", "country": "AU",
                     "color": "#f6891f", "kind": "commuter", "tz": "Australia/Sydney", "credit": CREDIT,
                     "license": "CC BY 4.0", "bbox": [150.6, -34.2, 151.3, -33.55], "cars": True},
    "nswtrainlink": {"name": "NSW TrainLink", "short": "NSW TrainLink", "region": "New South Wales", "country": "AU",
                     "color": "#e56e0f", "kind": "intercity", "tz": "Australia/Sydney", "credit": CREDIT,
                     "license": "CC BY 4.0", "bbox": [141.4, -37.85, 153.1, -27.45], "after": "sydneytrains", "cars": True},
}
# The Open Data Hub's default plan allows 60,000 requests a day and 5 a
# second per key. Each refresh is four requests; one every 20 s is 17,280 a
# day, leaving room for a few Worker instances keeping their own copies.
SOURCES = [{"id": "tfnsw", "agencies": ["sydneytrains", "nswtrainlink"], "format": "pb", "interval": 20, "relay": True,
            "needsKey": "TFNSW_API_KEY", "untilKey": "timetable", "scope": "view"}]
RELAY = {"tfnsw": {"keys": ["TFNSW_API_KEY"], "ttl": 20}}

API = "https://api.transport.nsw.gov.au"
# NSW Trains' first (see above), each railroad's positions before its trip updates.
FEEDS = [API + "/v1/gtfs/vehiclepos/nswtrains", API + "/v1/gtfs/realtime/nswtrains",
         API + "/v2/gtfs/vehiclepos/sydneytrains", API + "/v2/gtfs/realtime/sydneytrains"]


def relay_fetch(env, source_id):
    """The four feeds back to back, as one GTFS-realtime feed (concatenated
    protobuf messages read as one, with every entity): the same bytes as
    relay/feeds/tfnsw.js. A feed that fails is left out; with no positions
    at all, the error stands."""
    out, positions, error = [], 0, None
    for i, url in enumerate(FEEDS):
        req = urllib.request.Request(url, headers={"Authorization": f"apikey {env['TFNSW_API_KEY']}",
                                                   "Accept": "application/x-google-protobuf"})
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                out.append(r.read())
            positions += i % 2 == 0
        except Exception as err:
            error = error or err
    if not positions:
        raise error
    return b"".join(out), "application/x-protobuf"


# The regional trains' routes are filed by their service ("31", Sydney to
# Brisbane, its runs NT31): named by NSW TrainLink's four regional lines,
# by the number's first digit.
REGIONAL = {"3": "North Coast Line", "2": "North Western Line", "4": "Western Line", "6": "Southern Line"}


def line(r):
    if r["route_type"] == "106":
        return REGIONAL.get(r["route_short_name"][:1], "NSW TrainLink")
    return r["route_long_name"].strip()


# The run, from a trip id: "159B.1697.101.32.A.8.68334035" is 159B, as the
# live feeds name it too.
number = lambda t: t["trip_id"].split(".")[0]
# TfNSW's whole timetable for Greater Sydney and NSW, every mode (about 300 MB
# zipped, refreshed daily; the Mobility Database keeps a copy,
# https://files.mobilitydatabase.org/mdb-2449/latest.zip). Trains are route
# type 2 (Sydney Trains and the intercity lines) and 106 (the regional
# trains; NSW TrainLink's coaches are 204 and 205). Platforms fold into their
# stations ("Central Station, Platform 16" into "Central Station", named
# "Central").
GTFS_URL = ("https://opendata.transport.nsw.gov.au/data/dataset/d1f68d4f-b778-44df-9823-cf2fa922e47f/resource/"
            "67974f14-01bf-47b7-bfa5-c7f2f8a950ca/download/full_greater_sydney_gtfs_static_0.zip")
EXTRAS = {"suffix": r"\s+Station$", "number": number, "tz": "Australia/Sydney"}
GTFS = {
    "sydneytrains": (GTFS_URL, lambda r: r.get("route_type") == "2" and r.get("agency_id") == "x0001", line, EXTRAS),
    "nswtrainlink": (GTFS_URL, lambda r: r.get("route_type") in ("2", "106") and r.get("agency_id") in ("X0000", "X000", "711"),
                     line, EXTRAS),
}

# The lines the two railroads run in OpenStreetMap's route relations, from
# Brisbane to Melbourne and west to Broken Hill. Everything else their
# timetables run over is routed along OSM's track (build_rail.py).
RAIL = {"region": "nsw", "bbox": [140.9, -38.0, 153.7, -27.3], "network": "sydneytrains",
        "relations": {"operator": r"^(Sydney Trains|NSW TrainLink|NSW Trains|Intercity Train)$",
                      "network": r"^(Sydney Trains|NSW TrainLink)$"}}
