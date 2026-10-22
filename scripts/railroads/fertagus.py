"""Fertagus: the trains across the 25 de Abril bridge, Lisbon (Roma-Areeiro)
to Setúbal, from Fertagus's GTFS (fertagus.pt, no key; on Portugal's National
Access Point, nap-portugal.imt-ip.pt, free of charge). Fertagus publishes no
live positions, so its trains are placed from the timetable (a "timetable"
source, no parser file)."""

AGENCIES = {
    "fertagus": {"name": "Fertagus", "short": "Fertagus", "region": "Lisbon", "country": "PT", "color": "#c74f4f",
                 "kind": "commuter", "tz": "Europe/Lisbon",
                 "credit": {"label": "Fertagus via the National Access Point", "href": "https://nap-portugal.imt-ip.pt"},
                 "license": None, "bbox": [-9.2, 38.45, -8.85, 38.8], "clip": True, "cars": True},
}
SOURCES = [{"id": "fertagus", "agencies": ["fertagus"], "format": "timetable", "interval": 60, "scope": "view"}]

# One line; its routes are where the trains turn back (Setúbal, Coina,
# Fogueteiro). A trip's id is its train number.
GTFS = {
    "fertagus": ("https://www.fertagus.pt/GTFSTMLzip/Fertagus_GTFS.zip", lambda r: r["route_type"] == "2",
                 lambda r: "Fertagus", {"number": lambda t: t.get("trip_id") or None, "tz": "Europe/Lisbon",
                                        "colors": {"Fertagus": "#c74f4f"}}),
}

RAIL = {"region": "pt", "bbox": [-9.2, 38.45, -8.85, 38.8], "network": "fertagus"}
