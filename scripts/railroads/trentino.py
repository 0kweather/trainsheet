"""The Trento-Malè-Mezzana railway, run by Trentino Trasporti, from its GTFS
of its extra-urban services (CC BY 4.0, no key; the file is mostly buses).
There are no live positions anyone may reuse, and the timetable gives its
trains no numbers, so each run is shown unnumbered, placed from the
timetable (the "timetable" source: no relay and no parser file)."""

BBOX = [10.79, 46.06, 11.14, 46.4]
AGENCIES = {
    "trentino": {"name": "Ferrovia Trento–Malè–Mezzana", "short": "Trento–Malè", "region": "Trentino", "country": "IT",
                 "color": "#c2185b", "kind": "commuter", "tz": "Europe/Rome",
                 "credit": {"label": "Provincia di Trento open data (Trentino Trasporti)",
                            "href": "https://dati.trentino.it/dataset/trasporti-pubblici-del-trentino-formato-gtfs"},
                 "license": "CC BY 4.0", "bbox": BBOX, "after": "arst"},
}
SOURCES = [{"id": "trentino", "agencies": ["trentino"], "format": "timetable", "interval": 60, "scope": "view"}]

GTFS = {
    # The railway is the file's one train route (352, "R35").
    "trentino": ("https://www.trentinotrasporti.it/opendata/google_transit_extraurbano_tte.zip",
                 lambda r: r["route_type"] == "2", lambda r: "Trento–Malè–Mezzana",
                 # "Cles Ferrovia", "Croviana Ftm": the station of that town.
                 {"suffix": r"[\s.-]+(Ferrovia|Ftm)$",
                  "names": {"Male'": "Malè", "Zambana-Staz": "Zambana", "Mezzocorona Borg.": "Mezzocorona Borgata",
                            "Grumo-S.Michele A/A.": "Grumo-San Michele", "Trento Nord. Zona Commerciale": "Trento Nord Zona Commerciale",
                            "Nave S.Felice": "Nave San Felice"}}),
}

# The railway's track (metre gauge).
RAIL = {"region": "it", "bbox": BBOX, "network": "trentino",
        "query": ('relation["route"="train"]["operator"~"Trentino Trasporti",i]({bbox})->.r;'
                  'way(r.r)["railway"~"^(rail|narrow_gauge)$"]({bbox});')}
