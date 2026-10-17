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
