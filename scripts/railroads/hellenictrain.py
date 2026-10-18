"""Hellenic Train (Greece): the positions on railway.gov.gr, the Ministry of
Infrastructure and Transport's public train tracker, through the relay. The
site sends them as server-sent events, a new list every second (each fix
held back 10 s); the relay reads the stream until its first list of
positions (event trainPositionsUx) and passes that list on as JSON
(relay_fetch here, relay/feeds/hellenictrain.js on the Worker). A train's
scheduleId is its trip id in the timetable, which is the same site's,
turned into GTFS by Transitous's railway-gov-gr-gtfs. The parser is
js/railroads/hellenictrain.js."""
import urllib.request

AGENCIES = {
    "hellenictrain": {"name": "Hellenic Train", "short": "Hellenic Train", "region": "Greece", "country": "GR",
                      "color": "#0a6ab4", "kind": "intercity", "tz": "Europe/Athens",
                      "credit": {"label": "railway.gov.gr", "href": "https://railway.gov.gr"},
                      "license": None, "bbox": [20.7, 36.9, 26.6, 41.8]},
}
# Every 30 s, as the relay keeps it: one short connection to the stream per
# 30 s however many are watching, and the site's own map shows each fix
# 10 s late anyway.
SOURCES = [{"id": "hellenictrain", "agencies": ["hellenictrain"], "format": "json", "interval": 30, "relay": True,
            "needsKey": False, "scope": "view"}]
RELAY = {"hellenictrain": {"ua": True, "ttl": 30}}

STREAM = "https://railway.gov.gr/api/train-stream"
IDENTIFYING_UA = "Trainsheet/1.0 (+https://trainsheet.com)"


def relay_fetch(env, source_id):
    """The stream's first trainPositionsUx event's data, as relay/feeds/hellenictrain.js reads it."""
    req = urllib.request.Request(STREAM, headers={"User-Agent": IDENTIFYING_UA, "Accept": "text/event-stream"})
    with urllib.request.urlopen(req, timeout=20) as r:
        event = None
        for line in r:
            line = line.decode("utf-8").rstrip("\r\n")
            if line.startswith("event:"):
                event = line[6:].strip()
            elif line.startswith("data:") and event == "trainPositionsUx":
                return line[5:].strip().encode(), "application/json"
            elif not line:
                event = None
    raise ValueError("the stream ended before any positions")


# The trains of the site's timetable, numbered as the tracker numbers them:
# each train number is its own route (IC57, 1520, 2253...). Its route types
# tell Intercity (102) from the suburban Proastiakos (109) and the regional
# trains (2). Stop names are kept in Greek, as the tracker's next stops are.
LINES = {"102": "Intercity", "109": "Proastiakos"}
GTFS = {
    "hellenictrain": ("https://jbb.ghsq.de/gtfs/gr-railway-gov.gtfs.zip", lambda r: r["route_type"] in ("2", "102", "109"),
                      lambda r: LINES.get(r["route_type"], "Regional"),
                      {"number": lambda t: t["route_id"], "colors": {"Intercity": "#0a6ab4", "Proastiakos": "#e2001a",
                                                                     "Regional": "#5c8a2e"}}),
}

# Greece's passenger lines in OpenStreetMap, by their route=train relations.
RAIL = {"region": "gr", "bbox": [20.7, 36.9, 26.6, 41.8], "network": "hellenictrain",
        "relations": {"operator": "Hellenic Train|TrainOSE|ΤΡΑΙΝΟΣΕ", "network": "Proastiakos|Προαστιακός|Hellenic Train"}}
