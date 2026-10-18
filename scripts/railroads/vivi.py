"""Vivi (Pasažieru vilciens, Latvia's passenger trains): positions and
predicted stop times from the Pieturas app's combined GTFS-realtime feed for
the Baltic states (gsvalbe.id.lv, free to reuse with credit to it), through
the relay (no CORS headers). The feed covers every bus, tram and trolleybus
in Latvia, Estonia and Lithuania, so the relay passes on only Vivi's vehicles
(ids "pv-vivi_811") and their trips' updates. Its trip and stop ids are Vivi's own
timetable's with "pv-" in front, and a trip's id is the train's number; the
parser is js/railroads/vivi.js."""

AGENCIES = {
    "vivi": {"name": "Vivi", "short": "Vivi", "region": "Latvia", "country": "LV", "color": "#8bc34a",
             "kind": "commuter", "tz": "Europe/Riga",
             "credit": {"label": "Vivi timetable, Pieturas live data", "href": "https://gsvalbe.id.lv/pieturas/avoti.html"},
             "license": None, "bbox": [20.95, 55.80, 28.20, 57.80]},
}
SOURCES = [{"id": "vivi", "agencies": ["vivi"], "format": "pb", "interval": 30, "relay": True, "needsKey": False,
            "scope": "view"}]
# The whole Baltic feed is a few hundred KB from one volunteer's server, which
# rebuilds it every few seconds; a minute's edge cache keeps the relay to 60
# fetches an hour however many watch.
RELAY = {"vivi": {"url": "https://gsvalbe.id.lv/pieturas/dati/gtfs-rt.pb", "vehicles": "^pv-", "ua": True, "ttl": 60}}

# Lines by the far end of the route (every route runs to or from Rīga), named
# as Vivi names them.
LINES = {
    "Tukums I": "Tukums", "Tukums II": "Tukums", "Sloka": "Tukums", "Ķemeri": "Tukums", "Dubulti": "Tukums",
    "Jelgava": "Jelgava", "Liepāja": "Liepāja",
    "Skulte": "Skulte", "Saulkrasti": "Skulte", "Carnikava": "Skulte",
    "Valga": "Valga", "Valmiera": "Valga", "Cēsis": "Valga", "Sigulda": "Valga",
    "Aizkraukle": "Aizkraukle", "Lielvārde": "Aizkraukle", "Ogre": "Aizkraukle",
    "Daugavpils": "Daugavpils", "Krāslava": "Daugavpils", "Indra": "Daugavpils",
    "Zilupe": "Zilupe", "Ludza": "Zilupe",
    "Gulbene": "Gulbene", "Madona": "Gulbene",
}


def line(r):
    a, _, b = r["route_long_name"].partition(" - ")
    end = b if a == "Rīga" else a
    return f"Rīga–{LINES.get(end, end)}"


# Every route is a train's (route_type 2); trip ids are train numbers.
GTFS = {
    "vivi": ("https://vivi.lv/uploads/GTFS.zip", lambda r: r.get("route_type") == "2", line,
             {"number": lambda t: t["trip_id"], "trips": True,
              "colors": {"Rīga–Tukums": "#38b6fc", "Rīga–Jelgava": "#ea5e42", "Rīga–Liepāja": "#ea5e42",
                         "Rīga–Skulte": "#f8db22", "Rīga–Valga": "#8bc34a", "Rīga–Aizkraukle": "#b388ff",
                         "Rīga–Daugavpils": "#b388ff", "Rīga–Zilupe": "#b388ff", "Rīga–Gulbene": "#b388ff"}}),
}
# Few of OSM's Vivi route relations name an operator, and Liepāja's and
# Gulbene's lines have none: the train routes in Latvia, and the lines
# (route=railway) Vivi runs on.
RAIL = {"region": "lv", "bbox": [20.95, 55.80, 28.20, 57.80], "network": "vivi",
        "query": 'area["ISO3166-1"="LV"][admin_level=2]->.lv;'
                 ' relation["route"="train"](area.lv)->.t; way(r.t)["railway"="rail"]({bbox});'
                 ' relation(id:1203911,1636399,18000332,18000488,18000679,18001011,18001440,18001441)->.l;'
                 ' way(r.l)["railway"="rail"]({bbox});'}
