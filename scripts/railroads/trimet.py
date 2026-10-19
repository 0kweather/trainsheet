"""WES Commuter Rail (Beaverton-Wilsonville, Portland): TriMet's
GTFS-realtime positions and predicted stop times, through the relay. Both
feeds cover TriMet's whole network (buses, MAX, the streetcar), so the relay
passes on only route 203's entities, WES's. They need TriMet's free AppID
(the Worker secret TRIMET_APP_ID, from
https://developer.trimet.org/appid/registration/); until it is set the
trains are placed from the timetable. TriMet publishes no train numbers
(its timetable lists times only), so WES's runs go unnumbered; the parser is
js/railroads/trimet.js."""

AGENCIES = {
    "wes": {"name": "WES Commuter Rail", "short": "WES", "region": "Portland", "country": "US", "color": "#1f5fc8",
            "kind": "commuter", "tz": "America/Los_Angeles", "credit": {"label": "TriMet", "href": "https://developer.trimet.org"},
            "license": None, "bbox": [-122.83, 45.29, -122.74, 45.51], "after": "sounder", "cars": True},
}
# TriMet states no request limit; its vehicle positions refresh about every
# 30 s. A 30 s ttl keeps the relay to four upstream requests a minute (two
# feeds) however many people watch, and the trains run only on weekday
# mornings and evenings.
SOURCES = [{"id": "trimet", "agencies": ["wes"], "format": "pb", "interval": 30, "relay": True, "needsKey": "TRIMET_APP_ID",
            "untilKey": "timetable", "scope": "view", "after": "sounder"}]
# The vehicle feed takes the Vehicle Location Service's parameters, so it is
# asked for route 203 alone; the trip updates take none, so the relay keeps
# route 203's entities of both.
RELAY = {"trimet": {"url": "https://developer.trimet.org/ws/V1/VehiclePositions?appID={TRIMET_APP_ID}&routes=203",
                    "also": ["https://developer.trimet.org/ws/V1/TripUpdate?appID={TRIMET_APP_ID}"],
                    "keys": ["TRIMET_APP_ID"], "routes": ["203"], "ua": True, "ttl": 30}}

# TriMet's whole timetable: WES is route 203. Each station is filed as
# "<name> WES Station" (Tigard's twice, one stop per direction under a
# parent): folded into one per name, "Beaverton TC", "Tigard TC", as TriMet
# signs them. "trips": stop and trip lookups for the live feeds, which give
# only ids.
GTFS = {
    "wes": ("https://developer.trimet.org/schedule/gtfs.zip", lambda r: r["route_id"] == "203", lambda r: "WES",
            {"fold": {"strip": r"\s+WES Station$"}, "trips": ["203"], "colors": {"WES": "#1f5fc8"}}),
}
