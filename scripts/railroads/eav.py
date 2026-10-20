"""EAV (Ente Autonomo Volturno): the Circumvesuviana, Cumana and
Circumflegrea around Naples, the Piscinola-Aversa line and the Piedimonte
Matese line, from EAV's GTFS (its rail division, "Eav srl - Divisione
Ferrovia"; the file also has its buses), hosted on WiMob and linked from
EAV's open data page (Italian Open Data License v2.0, no key). The file
lists the Napoli-Benevento line and a few short-working routes with no
trips (October 2026), so they don't show. There are no live positions
anyone may reuse, so its trains are placed from the timetable (the
"timetable" source: no relay and no parser file)."""
import re

BBOX = [14.0, 40.6, 14.65, 41.4]
AGENCIES = {
    "eav": {"name": "EAV", "short": "EAV", "region": "Naples", "country": "IT", "color": "#0a3d91",
            "kind": "commuter", "tz": "Europe/Rome",
            "credit": {"label": "EAV open data", "href": "https://www.eavsrl.it/open-data/"},
            "license": "IODL 2.0", "bbox": BBOX, "clip": True, "cars": True, "after": "sta"},
}
SOURCES = [{"id": "eav", "agencies": ["eav"], "format": "timetable", "interval": 60, "scope": "view"}]


def line(r):
    """The route's name as EAV files it: "Napoli - Pompei Scavi - Sorrento"
    is "Napoli–Pompei Scavi–Sorrento" (some are in capitals)."""
    name = r["route_long_name"].strip()
    if name.isupper():
        name = name.title()
    return re.sub(r"\s+-\s+", "–", name)


# trip_short_name is the train number ("90449").
number = lambda t: (re.fullmatch(r"\d+", t.get("trip_short_name") or "") or [None])[0]

GTFS = {
    # The rail division's routes (all type 2), not the buses (EAVO).
    "eav": ("https://www.wimob.it/cfile/download.php?file=google-transit.zip",
            lambda r: r["agency_id"] == "NA0004" and r["route_type"] == "2", line,
            {"number": number,
             # EAV's stops at RFI's stations carry "RFI"; its own Aversa is Aversa Centro.
             "names": {"Aversa": "Aversa Centro", "Aversa RFI": "Aversa", "Afragola Alta Velocità Rfi": "Afragola",
                       "Napoli Centrale RFI": "Napoli Centrale", "Cancello RFI": "Cancello", "Caserta RFI": "Caserta",
                       "Maddaloni Inferiore RFI": "Maddaloni Inferiore", "S. Maria Capua Vetere RFI": "S. Maria Capua Vetere",
                       "san giorgio a cremano": "San Giorgio a Cremano", "Arco felice": "Arco Felice", "Vesuvio De Meis (SA)": "Vesuvio de Meis", "Portici Via Liberta'": "Portici Via Libertà",
                       "Pompei Scavi Villa dei Misteri": "Pompei Scavi-Villa dei Misteri"}}),
}

# EAV's routes' track (most of it 950 mm gauge).
RAIL = {"region": "it", "bbox": BBOX, "network": "eav",
        "query": ('relation["route"~"^(train|light_rail|subway)$"]["operator"~"EAV|Ente Autonomo Volturno|Circumvesuviana",i]({bbox})->.r;'
                  'way(r.r)["railway"~"^(rail|narrow_gauge|light_rail|subway)$"]({bbox});')}
