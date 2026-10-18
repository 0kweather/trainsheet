"""Adelaide Metro trains (South Australia): Adelaide Metro's GTFS-realtime
positions and predicted stop times, through the relay (the feeds send no CORS
headers). The feeds cover every bus and tram too, so the relay passes on only
the train routes' entities. Adelaide's trains carry no public numbers (a
vehicle's label is its lead railcar's), so runs go unnumbered, as in the
timetable; the parser is js/railroads/adelaidemetro.js."""

AGENCIES = {
    "adelaidemetro": {"name": "Adelaide Metro", "short": "Adelaide Metro", "region": "Adelaide", "country": "AU",
                      "color": "#c23b33", "kind": "commuter", "tz": "Australia/Adelaide",
                      "credit": {"label": "Adelaide Metro – Department for Infrastructure and Transport, South Australia",
                                 "href": "https://www.adelaidemetro.com.au/developer-info"},
                      "license": "CC BY 3.0 AU", "bbox": [138.48, -35.20, 138.75, -34.59], "cars": True},
}

# Every train route in routes.txt (agency 2, route_type 2): Salisbury and
# Gawler short-workings, Noarlunga and Osborne ones, and the Port Dock branch.
ROUTES = ["BEL", "FLNDRS", "GAW", "GAWC", "GRNG", "NOAR", "OSBORN", "OUTHA", "PTDOCK", "SALIS", "SEAFRD"]

# The feed is rebuilt about every 15 s; one shared relay answer for 20 s
# keeps the upstream to at most 180 fetches of each feed an hour, however
# many viewers there are, while a 30 s poll still sees every change.
SOURCES = [{"id": "adelaidemetro", "agencies": ["adelaidemetro"], "format": "pb", "interval": 30, "relay": True,
            "needsKey": False, "scope": "view"}]
RELAY = {"adelaidemetro": {"url": "https://gtfs.adelaidemetro.com.au/v1/realtime/vehicle_positions",
                           "also": ["https://gtfs.adelaidemetro.com.au/v1/realtime/trip_updates"],
                           "routes": ROUTES, "ua": True, "ttl": 20}}

# Each route is a pattern of one of seven lines ("Gawler Central to City",
# "Salisbury to City"): the map names the line.
LINES = {"BEL": "Belair Line", "FLNDRS": "Flinders Line", "GAW": "Gawler Line", "GAWC": "Gawler Line",
         "SALIS": "Gawler Line", "GRNG": "Grange Line", "NOAR": "Seaford Line", "SEAFRD": "Seaford Line",
         "OSBORN": "Outer Harbor Line", "OUTHA": "Outer Harbor Line", "PTDOCK": "Port Dock Line"}

GTFS = {
    "adelaidemetro": ("https://gtfs.adelaidemetro.com.au/v1/static/latest/google_transit.zip",
                      lambda r: r.get("agency_id") == "2" and r.get("route_type") == "2",
                      lambda r: LINES.get(r["route_id"]) or r["route_long_name"].removesuffix(" to City"),
                      # "Belair Railway Station" -> "Belair"
                      {"suffix": r"\s+Railway Station$", "trips": ROUTES}),
}

# Adelaide's suburban lines, broad gauge, mapped in OSM as route=train
# relations of the Adelaide Metro network.
RAIL = {"region": "au", "bbox": [138.45, -35.22, 138.78, -34.57], "network": "adelaidemetro",
        "relations": {"network": "Adelaide Metro", "operator": "Adelaide Metro|Keolis Downer"}}
