"""Renfe (Spain): its high-speed, long- and medium-distance trains (AVE, Avlo,
Alvia, Avant, Euromed, Intercity, regionals) and its Cercanías and Rodalies
commuter trains, from Renfe's open data (data.renfe.com, CC BY 4.0, no key).
Each service has its own GTFS-realtime positions and predicted stop times,
fetched through the relay (gtfsrt.renfe.com sends no CORS headers), which
appends the trip updates to the positions. The feeds name a train by its trip
id only; its number, line and stops come from the timetables
(data/schedules/renfe.json and cercanias.json). The parser is
js/railroads/renfe.js."""
import re

AGENCIES = {
    "renfe": {"name": "Renfe AVE, Larga y Media Distancia", "short": "Renfe", "region": "Spain", "country": "ES",
              "color": "#8a1a5e", "kind": "intercity", "tz": "Europe/Madrid",
              "credit": {"label": "Renfe", "href": "https://data.renfe.com"}, "license": "CC BY 4.0",
              "bbox": [-8.75, 36.1, 4.85, 45.77]},
    "cercanias": {"name": "Renfe Cercanías and Rodalies", "short": "Cercanías", "region": "Spain", "country": "ES",
                  "color": "#d6001c", "kind": "commuter", "tz": "Europe/Madrid",
                  "credit": {"label": "Renfe", "href": "https://data.renfe.com"}, "license": "CC BY 4.0",
                  "bbox": [-8.45, 36.45, 2.95, 43.6], "after": "renfe"},
}
# Renfe's feeds refresh every 20-30 s (served with max-age=30): polled at
# that pace, and the relay keeps each answer as long, so its upstream load is
# two requests a source every 30 s however many people are watching.
SOURCES = [
    {"id": "renfe", "agencies": ["renfe"], "format": "pb", "interval": 30, "relay": True, "needsKey": False, "scope": "view"},
    {"id": "cercanias", "agencies": ["cercanias"], "format": "pb", "interval": 30, "relay": True, "needsKey": False,
     "scope": "view", "after": "renfe"},
]
RELAY = {
    "renfe": {"url": "https://gtfsrt.renfe.com/vehicle_positions_LD.pb", "also": ["https://gtfsrt.renfe.com/trip_updates_LD.pb"],
              "ua": True, "ttl": 30},
    "cercanias": {"url": "https://gtfsrt.renfe.com/vehicle_positions.pb", "also": ["https://gtfsrt.renfe.com/trip_updates.pb"],
                  "ua": True, "ttl": 30},
}

# The long-distance timetable files every route under its product ("AVE",
# "REG.EXP."), all in the same near-white: the map shows the products by
# their brand names, in their own colors.
PRODUCTS = {"AVE": "AVE", "AVE INT": "AVE Internacional", "AVLO": "Avlo", "ALVIA": "Alvia", "AVANT": "Avant",
            "AVANT EXP": "Avant Exprés", "EUROMED": "Euromed", "Intercity": "Intercity", "MD": "Media Distancia",
            "REGIONAL": "Regional", "REG.EXP.": "Regional Exprés", "PROXIMDAD": "Proximidad", "TRENCELTA": "Celta"}
PRODUCT_COLORS = {"AVE": "#8a1a5e", "AVE Internacional": "#8a1a5e", "Avlo": "#5bb7c9", "Alvia": "#6a3d8f",
                  "Avant": "#b0457f", "Avant Exprés": "#b0457f", "Euromed": "#1f5fa8", "Intercity": "#e07a10",
                  "Media Distancia": "#e07a10", "Regional": "#cf6f00", "Regional Exprés": "#cf6f00",
                  "Proximidad": "#cf6f00", "Celta": "#1f5fa8"}

# Cercanías' routes are numbered within each city's network (its núcleo, the
# route id's first two digits), so "C1" runs in Madrid, Sevilla, Valencia and
# more: each line is named with its network.
NUCLEOS = {"10": "Madrid", "20": "Asturias", "30": "Sevilla", "31": "Cádiz", "32": "Málaga", "40": "Valencia",
           "41": "Murcia/Alicante", "45": "Cartagena", "46": "Ferrol", "47": "León", "51": "Rodalies",
           "60": "Bilbao", "61": "San Sebastián", "62": "Santander", "70": "Zaragoza", "90": "Madrid"}
# A Cercanías trip id is its service day, its train number and its line
# ("1089D27203C4a": train 27203 on the C4a), as the live feeds give it.
CERCANIAS_TRIP = re.compile(r"\d{4}[A-Z](\d+)")

GTFS = {
    # A long-distance trip id is the train's number, a variant and a date ("0019012026-10-18").
    "renfe": ("https://ssl.renfe.com/gtransit/Fichero_AV_LD/google_transit.zip",
              lambda r: r.get("route_type") == "2", lambda r: PRODUCTS.get(r["route_short_name"], r["route_short_name"]),
              {"number": lambda t: t.get("trip_short_name") or None, "colors": PRODUCT_COLORS, "tz": "Europe/Madrid"}),
    # Not the replacement buses some lines file as routes (route type 3, or "BUS").
    "cercanias": ("https://ssl.renfe.com/ftransit/Fichero_CER_FOMENTO/fomento_transit.zip",
                  lambda r: r.get("route_type") == "2" and r["route_short_name"] != "BUS",
                  lambda r: f"{r['route_short_name']} {NUCLEOS.get(r['route_id'][:2], '')}".strip(),
                  {"number": lambda t: (CERCANIAS_TRIP.match(t["trip_id"]) or [None, None])[1], "tz": "Europe/Madrid"}),
}

# Spain's track, from the route relations Renfe runs (its Cercanías and
# Rodalies networks among them), Portugal's border to the Pyrenees. A few
# metre-gauge lines (León's, Bilbao's C4) have no such relation: their
# trains show where they report.
RAIL = {"region": "es", "bbox": [-9.4, 35.8, 3.4, 43.9], "network": "renfe",
        "relations": {"operator": "renfe", "network": "renfe|cercan|rodalies"}}
