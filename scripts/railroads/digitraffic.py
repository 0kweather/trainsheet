"""Finland's passenger trains: VR's long-distance trains and the commuter
trains (HSL's lines around Helsinki, VR's around Tampere and Kouvola), from
Fintraffic's open rail data (Digitraffic, CC BY 4.0, no key). Positions come
from its train locations (each train's last GPS fix, by train number, with
its time and speed) and delays from its GTFS-realtime trip updates, both
through the relay: Digitraffic answers HTTP 406 to a request that doesn't
offer gzip and asks every client to name itself, and the relay joins the two
into one answer (relay_fetch, and relay/feeds/digitraffic.js in the Worker).
The trains' stops come from the timetable (data/schedules/vr.json and
hsl.json) by train number; a number with no run there (freight, shunting,
empty stock moves) isn't a passenger train. The parser is
js/railroads/digitraffic.js."""
import base64, gzip, re, urllib.request

CREDIT = {"label": "Fintraffic / digitraffic.fi", "href": "https://www.digitraffic.fi/en/railway-traffic/"}
AGENCIES = {
    "vr": {"name": "VR", "short": "VR", "region": "Finland", "country": "FI", "color": "#3fa535", "kind": "intercity",
           "tz": "Europe/Helsinki", "credit": CREDIT, "license": "CC BY 4.0", "bbox": [21.3, 59.8, 30.2, 68.0]},
    "hsl": {"name": "Commuter trains (HSL and VR)", "short": "Commuter", "region": "Southern Finland", "country": "FI",
            "color": "#8c4799", "kind": "commuter", "tz": "Europe/Helsinki", "credit": CREDIT, "license": "CC BY 4.0",
            "bbox": [22.9, 59.8, 27.0, 61.6], "after": "vr"},
}
SOURCES = [{"id": "digitraffic", "agencies": ["vr", "hsl"], "format": "json", "interval": 20, "relay": True,
            "needsKey": False, "scope": "view"}]
# Digitraffic allows 60 requests a minute from one address (more for a named
# client) and refreshes its locations every second and its trip updates every
# 10 s; one relay copy every 15 s is 8 requests a minute however many watch.
RELAY = {"digitraffic": {"ua": True, "ttl": 15}}

API = "https://rata.digitraffic.fi/api/v1"
LOCATIONS = API + "/train-locations/latest/"
UPDATES = API + "/trains/gtfs-rt-updates"
HEADERS = {"Accept-Encoding": "gzip", "Digitraffic-User": "Trainsheet/1.0"}
IDENTIFYING_UA = "Trainsheet/1.0 (+https://trainsheet.com)"


def relay_fetch(env, source_id):
    """{"locations": train-locations/latest as sent, "updates": the GTFS-rt
    trip updates in base64}: the same bytes as relay/feeds/digitraffic.js."""
    def get(url):
        req = urllib.request.Request(url, headers={"User-Agent": IDENTIFYING_UA, **HEADERS})
        with urllib.request.urlopen(req, timeout=20) as r:
            body = r.read()
            return gzip.decompress(body) if r.headers.get("Content-Encoding") == "gzip" else body
    locations = get(LOCATIONS)
    try:
        updates = base64.b64encode(get(UPDATES))
    except Exception:  # positions without delays rather than nothing
        updates = b""
    return b'{"locations":' + locations + b',"updates":"' + updates + b'"}', "application/json"


# Trip short names end in the train number: "IC 22", "PYO 265", "K (HL 9391)".
number = lambda t: (re.search(r"(\d+)\)?$", t.get("trip_short_name") or "") or [None, None])[1]
# Long-distance routes by kind of train ("IC 22" is an InterCity).
KINDS = {"IC": "InterCity", "S": "Pendolino", "PYO": "Night train", "HDM": "Regional", "H": "Regional"}
GTFS_URL = API + "/trains/gtfs-passenger-stops.zip"
EXTRAS = {"headers": HEADERS, "number": number}
GTFS = {
    "vr": (GTFS_URL, lambda r: r["route_type"] != "109", lambda r: KINDS.get(r["route_short_name"].split()[0], "VR"), EXTRAS),
    # Commuter routes are filed by their line's letter ("K").
    "hsl": (GTFS_URL, lambda r: r["route_type"] == "109", lambda r: r["route_short_name"].split()[0], EXTRAS),
}

# Finland's main and branch lines inside its border (the box takes in some
# of Russia's and Sweden's too). OSM's route relations miss half the lines
# the trains run: Karelia, Savonia, Vaasa, Kemijärvi.
RAIL = {"region": "fi", "bbox": [20.5, 59.7, 31.6, 68.5], "network": "vr",
        "query": 'area["ISO3166-1"="FI"]["admin_level"="2"]->.fi;'
                 'way["railway"="rail"]["usage"~"^(main|branch)$"][!"service"](area.fi)({bbox});'}
