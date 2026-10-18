"""FGC (Ferrocarrils de la Generalitat de Catalunya): Geotren, FGC's own
positions of its Barcelona-Vallès and Llobregat-Anoia trains, from its open
data portal (CC BY 4.0, no key), through the relay. Geotren gives each train's
line, destination and coming stops by station code, and whether it's on time,
but no train numbers and no time of fix, so the relay sends the dataset's
last-processed time with it (relay_fetch, and relay/feeds/fgc.js as the
Worker's twin). The parser is js/railroads/fgc.js."""
import json, urllib.request

AGENCIES = {
    "fgc": {"name": "Ferrocarrils de la Generalitat de Catalunya", "short": "FGC", "region": "Catalonia", "country": "ES",
            "color": "#f26722", "kind": "commuter", "tz": "Europe/Madrid",
            "credit": {"label": "FGC Open Data", "href": "https://dadesobertes.fgc.cat"},
            "license": "CC BY 4.0", "bbox": [0.6, 41.3, 2.2, 42.26]},
}
# Geotren's dataset is processed every two minutes or so: a poll a minute, and
# a minute's caching at the relay, which then asks the portal twice a minute
# at most (2,880 of the 5,000 calls a day it allows an address) however many
# are watching.
SOURCES = [{"id": "fgc", "agencies": ["fgc"], "format": "json", "interval": 60, "relay": True, "needsKey": False,
            "scope": "view"}]
RELAY = {"fgc": {"ua": True, "ttl": 60}}

PORTAL = "https://dadesobertes.fgc.cat/api/explore/v2.1/catalog/datasets"
TRAINS = (PORTAL + "/posicionament-dels-trens/exports/json?select="
          "id,lin,geo_point_2d,dir,origen,desti,properes_parades,estacionat_a,en_hora,tipus_unitat,ut")
PROCESSED = PORTAL + "?where=dataset_id%3D%22posicionament-dels-trens%22&select=data_processed"
UA = "Trainsheet/1.0 (+https://trainsheet.com)"


def relay_fetch(env, source_id):
    """Geotren's trains, wrapped with the time the portal last processed
    them: {"processed": "<ISO time>", "trains": [...]}, the trains' bytes as
    the portal sent them."""
    def get(url):
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=20) as r:
            return r.read()
    trains = get(TRAINS)
    processed = (json.loads(get(PROCESSED)).get("results") or [{}])[0].get("data_processed")
    return b'{"processed": ' + json.dumps(processed).encode() + b', "trains": ' + trains + b"}", "application/json"


# Trains only: L6, L7, L8 and L12 are filed as metro (1), the rest as rail (2);
# the rack railways and funiculars (7) and the replacement buses (3) are out.
GTFS = {
    "fgc": ("https://www.fgc.cat/google/google_transit.zip", lambda r: r["route_type"] in ("1", "2"),
            lambda r: r["route_short_name"]),
}

# FGC's own track: its train and metro routes' ways, both gauges.
RAIL = {"region": "es", "bbox": [0.6, 41.3, 2.2, 42.26], "network": "fgc",
        "query": ('relation["route"~"^(train|subway)$"]["operator"~"Ferrocarrils de la Generalitat|FGC",i]({bbox})->.r;'
                  'way(r.r)["railway"~"^(rail|subway|narrow_gauge)$"]({bbox});')}
