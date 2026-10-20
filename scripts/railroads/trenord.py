"""Trenord: Lombardy's regional railway (the S lines of Milan's suburban
network, the R and RE lines, Malpensa Express, and the TILO lines it runs
with SBB into Ticino), from its GTFS on Regione Lombardia's open data portal
(CC BY 4.0, no key). Trenord publishes no live positions anyone may reuse
without a key, so its trains are placed from the timetable (the "timetable"
source: no relay and no parser file)."""
import re

BBOX = [8.4, 44.8, 10.7, 46.55]
AGENCIES = {
    "trenord": {"name": "Trenord", "short": "Trenord", "region": "Lombardy", "country": "IT", "color": "#006633",
                "kind": "commuter", "tz": "Europe/Rome",
                "credit": {"label": "Regione Lombardia open data (Trenord)", "href": "https://www.dati.lombardia.it/d/3z4k-mxz9"},
                "license": "CC BY 4.0", "bbox": BBOX, "clip": True, "cars": True},
}
SOURCES = [{"id": "trenord", "agencies": ["trenord"], "format": "timetable", "interval": 60, "scope": "view"}]


def line(r):
    """Its line code, as Trenord signs it ("RE_11" is RE11). A handful of
    trains filed under no line (Seregno-Carnate, Pisogne-Edolo) are just
    "Trenord"."""
    if r["route_id"] == "TN_Unspecified_Line":
        return "Trenord"
    return r["route_short_name"].replace("_", "")


# "RE_11 - 2153" is train 2153; the trains under no line give the number
# alone. Numbers ending in a letter ("R23 - 1012A") are the buses that stand
# in for trains (Domodossola-Sesto Calende while the line is closed): left out.
number = lambda t: (re.search(r"(?:^| )(\d+)$", t.get("trip_short_name") or "") or [None, None])[1]

# Trains only: not the replacement buses (route TN_Bus, type 3).
GTFS = {
    "trenord": ("https://www.dati.lombardia.it/download/3z4k-mxz9/application%2Fzip", lambda r: r["route_type"] == "2",
                line, {"number": number}),
}

# Trenord's own routes' track (its lines, including the FerrovieNord ones).
RAIL = {"region": "it", "bbox": BBOX, "network": "trenord", "relations": {"operator": "Trenord"}}
