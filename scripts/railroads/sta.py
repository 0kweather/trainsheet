"""South Tyrol's trains that Trenitalia doesn't run: SAD's (the Vinschgerbahn
Merano-Malles, the Pustertalbahn to San Candido and Lienz, Merano-Bolzano,
and its trains over the Brenner to Innsbruck), ÖBB's REX trains into Italy
(Brennero and San Candido) and the Rittner Bahn (Soprabolzano-Collalbo),
from STA's GTFS of the whole province's timetable on the Open Data Hub
(CC0, no key). There are no live positions anyone may reuse, so the trains
are placed from the timetable (the "timetable" source: no relay and no
parser file).

STA's file has every train in the province but names no operator; each
route id says whose it is ("3-250-S-26a-1": line 250, operator S): S is
SAD, O is ÖBB's REX; T and V are Trenitalia's regional trains, F its
Frecce, E the Brenner EuroCitys and R the Railjets (run with Trenitalia),
I Italo and N Trenord, which those railroads' own plug-ins have. The
Rittner Bahn (line 160) is filed with no operator letter."""
import re

BBOX = [10.38, 46.06, 12.78, 47.28]
AGENCIES = {
    "sta": {"name": "Südtirol / Alto Adige trains", "short": "Südtirol", "region": "South Tyrol", "country": "IT",
            "color": "#00843d", "kind": "commuter", "tz": "Europe/Rome",
            "credit": {"label": "STA Südtiroler Transportstrukturen (Open Data Hub)",
                       "href": "https://gtfs.api.opendatahub.com/v1/dataset/sta-time-tables"},
            "license": "CC0", "bbox": BBOX, "clip": True, "cars": True, "after": "trenord"},
}
SOURCES = [{"id": "sta", "agencies": ["sta"], "format": "timetable", "interval": 60, "scope": "view"}]

# STA's line numbers, by the railway each runs on, as STA names them.
LINES = {"100": "Brennerbahn", "102": "Brennerbahn", "124": "Brennerbahn", "160": "Rittner Bahn",
         "200": "Meran–Bozen", "250": "Vinschgerbahn", "400": "Pustertalbahn"}


def keep(r):
    """Trains (type 2) run by SAD (S) or ÖBB (O), and the Rittner Bahn."""
    parts = r["route_id"].split("-")
    return r["route_type"] == "2" and len(parts) > 2 and (parts[2] in ("S", "O") or parts[1] == "160")


line = lambda r: LINES.get(r["route_id"].split("-")[1], r["route_short_name"])
# trip_short_name is the train number ("7100").
number = lambda t: (re.fullmatch(r"\d+", t.get("trip_short_name") or "") or [None])[0]

GTFS = {
    "sta": ("https://gtfs.api.opendatahub.com/v1/dataset/sta-time-tables/raw", keep, line,
            {"number": number,
             # The Austrian stations are filed as "Innsbruck, Stazione di Innsbruck Centrale".
             "names": {"Innsbruck, Stazione di Innsbruck Centrale": "Innsbruck Hbf",
                       "Gries am Brenner, Stazione di Gries a. Br.": "Gries am Brenner",
                       "Mittewald a.d.D.": "Mittewald an der Drau",
                       "Perca-P. de Corones": "Perca-Plan de Corones"}}),
}

# SAD's, ÖBB's and the Rittner Bahn's routes' track (the Rittner Bahn is metre gauge).
RAIL = {"region": "it", "bbox": BBOX, "network": "sta",
        "query": ('relation["route"~"^(train|tram|light_rail)$"]["operator"~"SAD|ÖBB|STA|Rittner|Renon",i]({bbox})->.r;'
                  'way(r.r)["railway"~"^(rail|narrow_gauge|tram)$"]({bbox});')}
