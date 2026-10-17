"""Tri-Rail (South Florida): its GTFS-realtime positions, through the relay
(the feed sends no CORS headers). Trains are numbered by their vehicle
label ("P625" is train 625); the parser is js/railroads/trirail.js."""

AGENCIES = {
    "trirail": {"name": "Tri-Rail", "short": "Tri-Rail", "region": "South Florida", "country": "US", "color": "#2ba84a",
                "kind": "commuter", "tz": "America/New_York", "credit": {"label": "Tri-Rail", "href": "https://www.tri-rail.com"},
                "license": None, "bbox": [-80.26, 25.78, -80.06, 26.76], "after": "capmetro"},
}
SOURCES = [{"id": "trirail", "agencies": ["trirail"], "format": "pb", "interval": 30, "relay": True, "needsKey": False,
            "scope": "always", "after": "capmetro"}]
RELAY = {"trirail": {"url": "https://gtfsr.tri-rail.com/download.aspx?file=position_updates.pb"}}

# The Mobility Database's copy of Tri-Rail's timetable ran out in August 2025;
# Tri-Rail's own (https://gtfs.tri-rail.com/gtfs.zip) is said to be current,
# not switched to yet. Rail routes only: not the airport shuttle's stops. No
# timetable file until there's a current one.
GTFS = {
    "trirail": ("https://files.mobilitydatabase.org/mdb-333/latest.zip", lambda r: r.get("route_type") == "2", lambda r: "Tri-Rail",
                {"schedule": False}),
}
