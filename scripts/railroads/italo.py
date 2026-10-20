"""Italo (Italy): Nuovo Trasporto Viaggiatori's high-speed trains (8xxx and
9xxx), from Italo's timetable as NeTEx (Italian profile, Livello 1) on
Italy's National Access Point (cciss.it, no key), converted to GTFS by
scripts/netex.py. There is no live feed open to all: the trains are placed
from that timetable (a "timetable" source, no parser file), marked
estimated."""
import re

NETEX = "https://www.cciss.it/nap/mmtis/public/api/v1/download/blob/Asset/1814124/resource"
CREDIT = {"label": "Trenitalia / Italo via Punto di Accesso Nazionale (cciss.it)",
          "href": "https://www.cciss.it/nap/mmtis/public/it/catalog/Dataset"}
BBOX = [7.6, 38.0, 13.8, 46.6]

AGENCIES = {
    "italo": {"name": "Italo", "short": "Italo", "region": "Italy", "country": "IT", "color": "#a6192e",
              "kind": "intercity", "tz": "Europe/Rome", "credit": CREDIT, "license": None, "bbox": BBOX, "clip": True, "cars": True,
              "after": "trenitaliaic"},
}
SOURCES = [{"id": "italo", "agencies": ["italo"], "format": "timetable", "interval": 60, "scope": "view"}]


def journey(j):
    """Italo's file is its journey planner's: besides each train ("8907",
    or "8192_#1" and "8192_#2" for its timetables on different dates) it
    files every connection it sells as a journey of its own, a train and an
    Italobus (10xx: "1021_8907") or two trains ("8907_9977", changing at
    Roma Termini). Only the trains are kept, numbered as the line names them."""
    numbers = [n for n in j["line"].get("code", "").split("_") if n.isdigit()]
    if len(numbers) != 1 or not re.fullmatch(r"[89]\d{3}", numbers[0]):
        return None
    return {"agency": "italo", "route": "Italo", "number": numbers[0]}


def stop_name(name):
    """"Firenze S.M.Novella (Florence)" -> "Firenze S.M.Novella"."""
    return re.sub(r"\s*\([^)]*\)$", "", name.strip())


GTFS = {"italo": (NETEX, lambda r: r["agency_id"] == "italo", lambda r: "Italo",
                  {"netex": {"journey": journey, "stop_name": stop_name},
                   "number": lambda t: t.get("trip_short_name") or None, "tz": "Europe/Rome",
                   "colors": {"Italo": "#a6192e"},
                   # Its stop at Treviso is filed as "Treviso BUS", 5 km east
                   # of the station its trains call at.
                   "names": {"Padua": "Padova", "Treviso BUS": "Treviso Centrale", "San Donà -Jesolo": "San Donà-Jesolo",
                             "Lamezia Terme C": "Lamezia Terme Centrale"},
                   "positions": {"TRX": [45.65952, 12.24614]}})}

RAIL = {"region": "it", "bbox": [6.6, 36.6, 18.6, 47.1], "network": "trenitaliareg"}
