"""CapMetro Rail (Austin): CapMetro's GTFS-realtime positions and predicted
stop times, through the relay. The feeds cover every bus too, so the relay
passes on only the Red Line's (route 550) entities; the parser is
js/railroads/capmetro.js."""

AGENCIES = {
    "capmetro": {"name": "CapMetro Rail", "short": "CapMetro", "region": "Austin", "country": "US", "color": "#e0218a",
                 "kind": "commuter", "tz": "America/Chicago", "credit": {"label": "CapMetro", "href": "https://data.texas.gov"},
                 "license": None, "bbox": [-97.86, 30.26, -97.70, 30.59], "after": "railrunner"},
}
SOURCES = [{"id": "capmetro", "agencies": ["capmetro"], "format": "pb", "interval": 30, "relay": True, "needsKey": False,
            "scope": "always", "after": "uta"}]
RELAY = {"capmetro": {"url": "https://data.texas.gov/download/eiei-9rpf/application%2Foctet-stream",
                      "also": ["https://data.texas.gov/download/rmk2-acnw/application%2Foctet-stream"],
                      "routes": ["550"]}}
