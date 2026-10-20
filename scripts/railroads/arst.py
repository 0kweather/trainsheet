"""ARST's trains in Sardinia: its four metre-gauge lines (Monserrato-Isili,
Macomer-Nuoro, Sassari-Alghero, Sassari-Sorso), from ARST's GTFS (the file
also has its buses and the Cagliari and Sassari trams), linked from the
region's transport open data portal, sardegnamobilita.it (CC BY 4.0 for all
its datasets, no key). There are no live positions anyone may reuse, and
ARST gives its trains no public numbers, so each run is shown unnumbered,
placed from the timetable (the "timetable" source: no relay and no parser
file)."""
import re

BBOX = [8.3, 39.5, 9.35, 40.82]
AGENCIES = {
    "arst": {"name": "ARST trains", "short": "ARST", "region": "Sardinia", "country": "IT", "color": "#38761d",
             "kind": "commuter", "tz": "Europe/Rome",
             "credit": {"label": "ARST (Sardegna Mobilità open data)", "href": "https://www.sardegnamobilita.it/open-data/quadri-orari-arst"},
             "license": "CC BY 4.0", "bbox": BBOX, "after": "eav"},
}
SOURCES = [{"id": "arst", "agencies": ["arst"], "format": "timetable", "interval": 60, "scope": "view"}]

# "Linea MONSERRATO-ISILI" -> "Monserrato–Isili".
line = lambda r: re.sub(r"^Linea\s+", "", r["route_short_name"]).title().replace("-", "–")

GTFS = {
    # Trains are type 2; the trams (MetroCagliari, MetroSassari) are 0.
    "arst": ("https://www.arstspa.info/arst-cagliari-it.zip", lambda r: r["route_type"] == "2", line,
             # Names are filed in capitals (title-cased on reading).
             {"names": {"Molafa`": "Molafà", "Senorbi'": "Senorbì", "S. M. Di Pisa": "Santa Maria di Pisa",
                        "Sassari S.M.B.": "Sassari Santa Maria di Betlem"}}),
}

# ARST's lines (metre gauge).
RAIL = {"region": "it", "bbox": BBOX, "network": "arst",
        "query": ('relation["route"="train"]["operator"~"ARST",i]({bbox})->.r;'
                  'way(r.r)["railway"~"^(rail|narrow_gauge)$"]({bbox});')}
