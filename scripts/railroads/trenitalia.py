"""Trenitalia (Italy): its Frecce (Frecciarossa, Frecciargento,
Frecciabianca), its Intercity, night and EuroCity trains, its regional
trains, and the regional trains of Emilia-Romagna (Trenitalia Tper), from
Trenitalia's national timetable as NeTEx (Italian profile, Livello 1) on
Italy's National Access Point (cciss.it, no key), converted to GTFS by
scripts/netex.py. There is no live feed open to all: the trains are placed
from that timetable (a "timetable" source, no parser file), marked
estimated."""
import re

NETEX = "https://www.cciss.it/nap/mmtis/public/api/v1/download/blob/Asset/1080596/resource"
CREDIT = {"label": "Trenitalia / Italo via Punto di Accesso Nazionale (cciss.it)",
          "href": "https://www.cciss.it/nap/mmtis/public/it/catalog/Dataset"}
BBOX = [6.6, 36.6, 18.6, 47.1]
COMMON = {"region": "Italy", "country": "IT", "tz": "Europe/Rome", "credit": CREDIT, "license": None, "bbox": BBOX}

AGENCIES = {
    "frecce": {"name": "Trenitalia Frecce", "short": "Frecce", "color": "#c8102e", "kind": "intercity", **COMMON},
    "trenitaliaic": {"name": "Trenitalia Intercity", "short": "Intercity", "color": "#1b3f8b", "kind": "intercity",
                     "after": "frecce", **COMMON},
    "trenitaliareg": {"name": "Trenitalia Regionale", "short": "Regionale", "color": "#2e7d4f", "kind": "commuter",
                      "after": "trenitaliaic", **COMMON},
    "tper": {"name": "Trenitalia Tper", "short": "Tper", "color": "#0067a5", "kind": "commuter",
             "after": "trenitaliareg", **COMMON},
}
SOURCES = [{"id": "trenitalia", "agencies": list(AGENCIES), "format": "timetable", "interval": 60, "scope": "view"}]

# The file's categories (its Line names) as the trains are sold, by railroad.
# Not its buses ("Autobus").
CATEGORIES = {
    "Frecciarossa": ("frecce", "Frecciarossa"), "Frecciargento": ("frecce", "Frecciargento"),
    "Frecciabianca": ("frecce", "Frecciabianca"),
    "Intercity": ("trenitaliaic", "Intercity"), "InterCityNotte": ("trenitaliaic", "Intercity Notte"),
    "Eurocity": ("trenitaliaic", "EuroCity"), "Euronight": ("trenitaliaic", "EuroNight"),
    "Espresso": ("trenitaliaic", "Espresso"),
    "Regionale": ("trenitaliareg", "Regionale"), "Regionale Veloce": ("trenitaliareg", "Regionale Veloce"),
    # Turin's suburban lines (SFM) and Naples' Linea 2 (the "metropolitana FS").
    "sfm": ("trenitaliareg", "SFM"), "Metropolitano": ("trenitaliareg", "Metropolitano"),
}
# The file names one operator (TRENITALIA) for every train, Trenitalia Tper's
# among them, so Tper's are told by where they run: a regional train that
# starts and ends in Emilia-Romagna (this outline of it, lon/lat, which
# leaves out Pesaro, Rovigo, Mantova, Voghera, Prato and Pistoia).
EMILIA_ROMAGNA = [(9.38, 45.10), (9.95, 45.13), (10.45, 44.98), (10.70, 44.96), (10.95, 44.90), (11.25, 44.95),
                  (11.60, 44.89), (12.00, 44.95), (12.30, 44.85), (12.40, 44.40), (12.60, 44.05), (12.75, 43.97),
                  (12.40, 43.75), (11.75, 43.95), (11.40, 44.15), (11.00, 44.10), (10.60, 44.25), (10.20, 44.35),
                  (9.80, 44.45), (9.45, 44.60), (9.20, 44.70)]


def inside(lon, lat, poly=EMILIA_ROMAGNA):
    """Ray casting: is the point within the outline?"""
    out = False
    for (x1, y1), (x2, y2) in zip(poly, poly[1:] + poly[:1]):
        if (y1 > lat) != (y2 > lat) and lon < x1 + (lat - y1) * (x2 - x1) / (y2 - y1):
            out = not out
    return out


def journey(j):
    agency, route = CATEGORIES.get(j["line"].get("name"), (None, None))
    if not agency or j["mode"] != "rail":
        return None
    if agency == "trenitaliareg":
        ends = [j["stops"][0][2], j["stops"][-1][2]]
        if all(ends) and all(inside(lon, lat) for lat, lon in ends):
            agency = "tper"
    return {"agency": agency, "route": route}


# Names in capitals ("REGGIO DI CALABRIA CENTRALE", about half the file's)
# as signs write them: "Reggio di Calabria Centrale".
SMALL = {"di", "del", "della", "dello", "dei", "degli", "delle", "da", "dal", "e", "in", "sul", "sulla", "al", "alla",
         "a", "per", "con", "su"}


def stop_name(name):
    name = re.sub(r"\s{2,}", " ", name.strip())
    if name != name.upper():
        return name
    words = re.split(r"(\s+|-|/|\.)", name.lower())
    out = []
    for i, w in enumerate(words):
        if w in ("av", "fs"):  # "Reggio Emilia AV"
            w = w.upper()
        elif w and w[0].isalpha() and (i == 0 or w not in SMALL):
            # "sant'elena" -> "Sant'Elena", "d'ampezzo" -> "d'Ampezzo"
            w = "'".join(p if p in ("d", "dell", "all", "nell") and i else p[:1].upper() + p[1:] for p in w.split("'"))
        out.append(w)
    return "".join(out)


COLORS = {"Frecciarossa": "#c8102e", "Frecciargento": "#7d8287", "Frecciabianca": "#5b6770", "Intercity": "#1b3f8b",
          "Intercity Notte": "#27306b", "EuroCity": "#1b3f8b", "EuroNight": "#27306b", "Espresso": "#27306b",
          "Regionale": "#2e7d4f", "Regionale Veloce": "#1f6e43", "SFM": "#2e7d4f", "Metropolitano": "#2e7d4f"}
# Each railroad's lines (Tper's are regional ones).
LINES = {a: {route for agency, route in CATEGORIES.values() if agency == ("trenitaliareg" if a == "tper" else a)}
         for a in AGENCIES}
# One download and conversion for all four (feeds.get_zip keeps it): each
# railroad keeps the routes the journey hook gave it.
GTFS = {agency: (NETEX, lambda r, a=agency: r["agency_id"] == a, lambda r: r["route_short_name"],
                 {"netex": {"journey": journey, "stop_name": stop_name},
                  "number": lambda t: t.get("trip_short_name") or None, "tz": "Europe/Rome",
                  "colors": {line: COLORS[line] for line in LINES[agency]}})
        for agency in AGENCIES}

# Italy's track is built apart, from Geofabrik's extracts.
RAIL = {"region": "it", "bbox": BBOX, "network": "trenitaliareg"}
