"""Irish Rail (Iarnród Éireann): InterCity, DART and Commuter trains from its
own realtime API's running trains (getCurrentTrainsXML: each train's code,
the position its signalling last placed it at, and a message with its
origin, minutes late and next stop), through the relay (the API sends no
CORS headers). Stops and lines come from the National Transport Authority's
timetable for Irish Rail; the parser is js/railroads/irishrail.js."""

AGENCIES = {
    "irishrail": {"name": "Irish Rail", "short": "Irish Rail", "region": "Ireland", "country": "IE", "color": "#00845a",
                  "kind": "intercity", "tz": "Europe/Dublin",
                  "credit": {"label": "Iarnród Éireann, NTA", "href": "https://api.irishrail.ie/realtime/"},
                  "license": "CC BY 4.0 (timetable)", "bbox": [-10.0, 51.8, -5.9, 54.7], "cars": True},
}
# The API's positions are its signalling's (a train jumps from one signal or
# station to the next) and move about once a minute, so a poll every 30 s, and
# the relay's 30 s cache keeps the API at 120 requests an hour however many
# people watch. Only Ireland's view polls it.
SOURCES = [{"id": "irishrail", "agencies": ["irishrail"], "format": "xml", "interval": 30, "relay": True, "needsKey": False,
            "scope": "view"}]
RELAY = {"irishrail": {"url": "https://api.irishrail.ie/realtime/realtime.asmx/getCurrentTrainsXML", "ua": True, "ttl": 30}}

# The timetable files each pair of directions as its own route with a bare
# name ("rail", "Dublin - Cork"); the map shows the lines as Irish Rail
# names them.
LINES = {
    "BRAY-HOWTH": "DART",
    "DUB-BFT": "Enterprise",
    "DUB-CORK": "Dublin–Cork",
    "DUB-DRO/DUN": "Northern Commuter",
    "DUB-EUROPORT": "Dublin–Rosslare",
    "DUB-GALWAY": "Dublin–Galway",
    "DUB-LIMERICK": "Dublin–Limerick",
    "DUB-MAYNOOTH": "Western Commuter",
    "DUB-NEN-LIM": "Limerick–Ballybrophy",
    "DUB-PORTLAOIS": "South Western Commuter",
    "DUB-SLIGO": "Dublin–Sligo",
    "DUB-TRALEE": "Mallow–Tralee",
    "DUB-WATERFORD": "Dublin–Waterford",
    "DUB-WESTPORT": "Dublin–Westport",
    "GALWAY-LIM": "Limerick–Galway",
    "LIM-BALLYBROP": "Limerick–Ballybrophy",
    "LIMERICK-WAT": "Limerick–Waterford",
    "MAL-COBH": "Cork Commuter",
}

# Trains are numbered by their code ("A214", "E120"), the API's TrainCode.
# agency.txt gives Europe/London. Station names as the stations are signed.
GTFS = {
    "irishrail": ("https://www.transportforireland.ie/transitData/Data/GTFS_Irish_Rail.zip", lambda r: r.get("route_type") == "2",
                  lambda r: LINES.get(r["route_id"].rsplit("-", 1)[0], r.get("route_long_name", "")),
                  {"tz": "Europe/Dublin", "number": lambda t: t.get("trip_short_name") or None,
                   "names": {"Connolly": "Dublin Connolly", "Enfield Stn": "Enfield", "Gormanston Stn": "Gormanston",
                             "Laytown Station": "Laytown", "Templemore Station": "Templemore", "Tralee Casement Station": "Tralee Casement",
                             "Leixlip(Confey)": "Leixlip (Confey)", "Leixlip(Louisa Bridge)": "Leixlip (Louisa Bridge)"},
                   "colors": {"DART": "#7ab51d"}}),
}

# The island's track along Irish Rail's and the Enterprise's mapped routes.
RAIL = {"region": "ie", "bbox": [-10.4, 51.5, -5.4, 55.3], "network": "irishrail",
        "relations": {"operator": "Iarnr[oó]d [EÉ]ireann|Irish Rail", "network": "Iarnr[oó]d [EÉ]ireann|Irish Rail|DART|Enterprise"}}
