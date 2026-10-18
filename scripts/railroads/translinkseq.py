"""Queensland Rail's City network (Brisbane and South East Queensland):
Translink's GTFS-realtime positions of its trains, with their trip updates
appended, through the relay (the feeds send no CORS headers). Both are
Translink's rail-only feeds, so nothing needs filtering out. Trains are
numbered by their run ("1E25", the vehicle label and the end of the trip
id). The trip updates' stops are platforms the timetable file doesn't list,
so a train's stops come from its run in data/schedules/translinkseq.json,
shifted by its delay; the parser is js/railroads/translinkseq.js."""

AGENCIES = {
    "translinkseq": {"name": "Queensland Rail City network", "short": "Queensland Rail", "region": "Brisbane", "country": "AU",
                     "color": "#d53e45", "kind": "commuter", "tz": "Australia/Brisbane",
                     "credit": {"label": "Translink", "href": "https://translink.com.au/about-translink/open-data"},
                     "license": "CC BY 4.0", "bbox": [152.55, -28.15, 153.45, -26.15], "cars": True},
}
# Translink refreshes the feeds about every 30 s (its servers cache them for
# 10 s). The Worker's 15 s edge cache keeps it to two upstream requests per
# 15 s however many people watch, about 480 an hour.
SOURCES = [{"id": "translinkseq", "agencies": ["translinkseq"], "format": "pb", "interval": 30, "relay": True, "needsKey": False,
            "scope": "view"}]
RELAY = {"translinkseq": {"url": "https://gtfsrt.api.translink.com.au/api/realtime/SEQ/VehiclePositions/Rail",
                          "also": ["https://gtfsrt.api.translink.com.au/api/realtime/SEQ/TripUpdates/Rail"],
                          "ua": True, "ttl": 15}}

# A line is named by its outer ends ("Beenleigh - Ferny Grove" both ways), or
# by the one end of a train from or to the city ("Cleveland line"); the Gold
# and Sunshine Coasts' lines by their coasts, as Translink names them.
COASTS = {"Varsity Lakes": "Gold Coast", "Nambour": "Sunshine Coast", "Gympie North": "Sunshine Coast"}


def line(r):
    ends = sorted({COASTS.get(e, e) for e in r["route_long_name"].split(" - ")} - {"Brisbane City"})
    return " - ".join(ends) if len(ends) > 1 else f"{ends[0]} line" if ends else "Brisbane City"


# Translink's whole timetable (buses, ferries and the Gold Coast's trams too):
# the trains are its route_type 2. Platforms fold into their parent stations
# ("Beenleigh station" -> "Beenleigh").
GTFS = {
    "translinkseq": ("https://gtfsrt.api.translink.com.au/GTFS/SEQ_GTFS.zip", lambda r: r.get("route_type") == "2", line,
                     {"suffix": r"\s+station$", "number": lambda t: t["trip_id"].rsplit("-", 1)[-1]}),  # "...-44454-1E25": run 1E25
}
# Queensland Rail's suburban and interurban lines in OpenStreetMap.
RAIL = {"region": "au", "bbox": [152.55, -28.15, 153.45, -26.15], "network": "translinkseq",
        "relations": {"operator": r"^Queensland Rail$", "network": r"Translink|Citytrain|Queensland Rail City"}}
