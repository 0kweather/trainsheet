"""CFL – Société nationale des chemins de fer luxembourgeois: Luxembourg's
trains, from the national timetable of Luxembourg's public transport (GTFS,
data.public.lu, the Administration des transports publics, CC BY 4.0, no
key), placed from that timetable.

Railroad (the car file that draws it in brackets) and its trains as the page
shows them (t.route: the category as CFL's displays show it, "RE 3815"; the
file's route_desc holds CFL's line number, 10-90; counts are October 2026
trips):
  cfl   CFL [cfl]:
          RE   RegionalExpress: line 10 Luxembourg-Ettelbruck-Troisvierges and
               Luxembourg-Ettelbruck-Kautenbach-Wiltz, line 30 Luxembourg-
               Wasserbillig-Trier Hbf, line 60 Luxembourg-Bettembourg-Esch-
               sur-Alzette-Pétange-Rodange, line 70 Luxembourg-Leudelange-
               Pétange-Rodange-Longwy
          RB   Regionalbunn: the same lines' stopping trains, and line 10's
               Ettelbruck-Diekirch and Kautenbach-Wiltz, line 60's
               Noertzange-Rumelange, Bettembourg-Dudelange-Volmerange-les-
               Mines and Esch-sur-Alzette-Audun-le-Tiche, line 50 Luxembourg-
               Kleinbettingen
          IC   the Troisvierges-Mersch ICs of line 10 SNCB's file doesn't hold
          TER  TER Grand Est Luxembourg-Thionville-Metz (CFL's and SNCF's
               units), line 90
          TGV  SNCF's TGV INOUI Paris-Luxembourg, Luxembourg-Metz only (the
               file stops it there)
The trains over the Belgian border (Brussels-Luxembourg's and Liège-
Luxembourg's ICs, the trains to Arlon, Athus and Gouvy) are in SNCB's
timetable whole, and drawn from it (sncb.py, railroad sncb): they're left
out here.

Live data: none open to all. The national HAFAS API (cdt.hafas.de's
opendata apiserver, mobiliteit.lu's departure boards) gives a key by email
from the Administration des transports publics (opendata-api@atp.etat.lu),
per station, not per train; iRail knows only SNCB's trains in Luxembourg.
"""
import csv, datetime, io, json, re, urllib.request, zipfile
from collections import defaultdict

TZ = "Europe/Luxembourg"
CREDIT = {"label": "Administration des transports publics via data.public.lu (CC BY 4.0)",
          "href": "https://data.public.lu/en/datasets/horaires-et-arrets-des-transport-publics-gtfs/"}
BBOX = [5.73, 49.44, 6.53, 50.19]
COMMON = {"region": "Luxembourg", "country": "LU", "tz": TZ, "credit": CREDIT, "license": "CC BY 4.0", "bbox": BBOX, "clip": True}

AGENCIES = {
    "cfl": {"name": "CFL", "short": "CFL", "color": "#00a1de", "kind": "commuter", "cars": "cfl", **COMMON},
}
SOURCES = [{"id": "cfl", "agencies": list(AGENCIES), "format": "timetable", "interval": 60, "scope": "view"}]

# ---------- The timetable ----------
# The national file is published weekly under a new name each time
# ("gtfs-20261021-20261212.zip"): the newest is found through the portal's
# API (feeds.py's "make").
DATASET = "https://data.public.lu/api/1/datasets/horaires-et-arrets-des-transport-publics-gtfs/"
UA = "Trainsheet/1.0 (+https://trainsheet.com)"
CFL_AGENCY = "11"  # "Chemins de Fer Luxembourgeois" (171, CFL's buses, isn't rail)
CATEGORIES = {"RE", "RB", "IC", "TER", "TGV"}


def _get(url, timeout=120):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def latest_url():
    d = json.loads(_get(DATASET, 60))
    zips = [r for r in d["resources"] if r["url"].endswith(".zip")]
    return max(zips, key=lambda r: r.get("last_modified") or r.get("created_at") or "")["url"]


# CFL's stations as CFL signs them: the file names each stop "<place>,
# Gare" ("Luxembourg, Gare Centrale", "Belval (Lycée), Gare"), the way
# mobiliteit.lu names its bus stops.
NAMES = {
    "Luxembourg, Gare Centrale": "Luxembourg", "Bertrange": "Bertrange-Strassen", "Bascharage/Sanem": "Bascharage-Sanem",
    "Belval (Lycée)": "Belval-Lycée", "Belval (Université)": "Belval-Université", "Dudelange (Centre)": "Dudelange-Centre",
    "Dudelange (Usines)": "Dudelange-Usines", "Dudelange (Ville)": "Dudelange-Ville", "Dudelange, Gare-Burange": "Dudelange-Burange",
    "Mamer (Lycée)": "Mamer-Lycée", "Wecker-Gare": "Wecker", "Trier, Hauptbahnhof": "Trier Hbf", "Trier, Süd": "Trier Süd",
    "Konz, Karthaus": "Konz-Karthaus", "Hettange-Grande, Gare SNCF": "Hettange-Grande",
}
BORDER = re.compile(r"(?i)(fronti[eè]re|-Gr\.$|^Kreuz-)")
# Stations in Belgium: a train calling at one is in SNCB's timetable whole
# (the Brussels and Liège ICs, the RBs to Arlon, Athus and Gouvy), and drawn
# from it.
BELGIAN = {"Arlon", "Athus", "Gouvy", "Sterpenich", "Viville", "Messancy", "Autelbas", "Stockem"}


def name(s):
    s = re.sub(r"\s+", " ", (s or "").strip())
    s = NAMES.get(s, s)
    s = re.sub(r", Gare( SNCF)?$", "", s)
    return NAMES.get(s, s)


# CFL's lines, by the stations a train calls at: 10 Luxembourg-Ettelbruck-
# Troisvierges (with the Diekirch and Wiltz branches), 30 Luxembourg-
# Wasserbillig(-Trier), 50 Luxembourg-Kleinbettingen(-Arlon), 60
# Luxembourg-Bettembourg-Esch-sur-Alzette-Pétange (with Rumelange, Dudelange-
# Volmerange and Audun-le-Tiche), 70 Luxembourg-Leudelange-Pétange-Rodange
# (-Longwy, -Athus), 90 Luxembourg-Bettembourg-Thionville(-Metz).
LINE_STATIONS = [
    ("90", {"Thionville", "Metz-Ville", "Hettange-Grande"}),
    ("10", {"Troisvierges", "Ettelbruck", "Mersch", "Diekirch", "Wiltz", "Kautenbach", "Clervaux", "Walferdange", "Lintgen",
            "Lorentzweiler", "Heisdorf", "Dommeldange", "Schieren", "Colmar-Berg", "Cruchten", "Michelau", "Goebelsmühle",
            "Drauffelt", "Wilwerwiltz", "Merkholtz", "Paradiso", "Pfaffenthal-Kirchberg"}),
    ("30", {"Wasserbillig", "Trier Hbf", "Trier Süd", "Igel", "Mertert", "Manternach", "Wecker", "Betzdorf", "Roodt-sur-Syre",
            "Munsbach", "Oetrange", "Sandweiler-Contern", "Cents-Hamm"}),
    ("50", {"Kleinbettingen", "Capellen", "Mamer", "Mamer-Lycée", "Bertrange-Strassen"}),
    ("70", {"Hollerich", "Leudelange", "Dippach-Reckange", "Schouweiler", "Bascharage-Sanem", "Longwy"}),
]


def line_of(names):
    return next((line for line, at in LINE_STATIONS if at & set(names)), "60")


# Our palette (CFL publishes no line colours as data): by category.
COLORS = {"RE": "#00a1de", "RB": "#6cb4e4", "IC": "#0a3d7a", "TER": "#4a4a4a", "TGV": "#4a4a4a"}


def make():
    """Luxembourg's national file cut to CFL's trains (feeds.py's "make"):
    the routes by category (route_short_name "RE", "RB", "IC", "TER", "TGV";
    route_desc CFL's line number), names as signed, border points and the
    trains in SNCB's timetable left out, numbers without the file's leading
    zeros ("03815" is RE 3815)."""
    zf = zipfile.ZipFile(io.BytesIO(_get(latest_url(), 300)))

    def rows(n):
        with zf.open(n) as f:
            yield from csv.DictReader(io.TextIOWrapper(f, "utf-8-sig"))

    routes = {r["route_id"]: r for r in rows("routes.txt") if r["agency_id"] == CFL_AGENCY and r["route_type"] == "2"
              and r["route_short_name"] in CATEGORIES}
    trips = {t["trip_id"]: t for t in rows("trips.txt") if t["route_id"] in routes}
    stops = {s["stop_id"]: s for s in rows("stops.txt")}
    times = defaultdict(list)
    for x in rows("stop_times.txt"):
        if x["trip_id"] in trips:
            times[x["trip_id"]].append(x)
    out_routes, out_trips, out_times, used = {}, [], [], set()
    for tid, t in trips.items():
        seq = sorted(times.get(tid, ()), key=lambda x: int(x["stop_sequence"]))
        names = [name(stops[x["stop_id"]]["stop_name"]) for x in seq]
        if any(n in BELGIAN for n in names):
            continue
        keep = [(x, n) for x, n in zip(seq, names) if not BORDER.search(n) and not (x["pickup_type"] == "1" and x["drop_off_type"] == "1")]
        if len(keep) < 2:
            continue
        cat = routes[t["route_id"]]["route_short_name"]
        line = line_of(names)
        rid = f"cfl:{cat}:{line}"
        out_routes.setdefault(rid, {"route_id": rid, "agency_id": "cfl", "route_short_name": cat, "route_long_name": "",
                                    "route_desc": line, "route_type": "2", "route_color": COLORS[cat][1:]})
        out_trips.append({"route_id": rid, "service_id": t["service_id"], "trip_id": tid, "trip_headsign": keep[-1][1],
                          "trip_short_name": str(int(t["trip_short_name"])) if t["trip_short_name"].isdigit() else t["trip_short_name"]})
        for x, n in keep:
            used.add(x["stop_id"])
            out_times.append({k: x[k] for k in ("trip_id", "arrival_time", "departure_time", "stop_id", "stop_sequence",
                                                "pickup_type", "drop_off_type")})
    services = {t["service_id"] for t in out_trips}

    def table(rows_, cols):
        buf = io.StringIO()
        w = csv.DictWriter(buf, cols, extrasaction="ignore", lineterminator="\n")
        w.writeheader()
        w.writerows(rows_)
        return buf.getvalue()

    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=1) as z:
        z.writestr("agency.txt", table([{"agency_id": "cfl", "agency_name": "CFL", "agency_url": "https://www.cfl.lu",
                                         "agency_timezone": TZ}], ["agency_id", "agency_name", "agency_url", "agency_timezone"]))
        z.writestr("routes.txt", table(sorted(out_routes.values(), key=lambda r: r["route_id"]),
                                       ["route_id", "agency_id", "route_short_name", "route_long_name", "route_desc", "route_type",
                                        "route_color"]))
        z.writestr("trips.txt", table(out_trips, ["route_id", "service_id", "trip_id", "trip_headsign", "trip_short_name"]))
        z.writestr("stops.txt", table([{"stop_id": k, "stop_name": name(stops[k]["stop_name"]), "stop_lat": stops[k]["stop_lat"].strip(),
                                        "stop_lon": stops[k]["stop_lon"].strip()} for k in sorted(used)],
                                      ["stop_id", "stop_name", "stop_lat", "stop_lon"]))
        z.writestr("stop_times.txt", table(out_times, ["trip_id", "arrival_time", "departure_time", "stop_id", "stop_sequence",
                                                       "pickup_type", "drop_off_type"]))
        z.writestr("calendar.txt", table([c for c in rows("calendar.txt") if c["service_id"] in services],
                                         ["service_id", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
                                          "start_date", "end_date"]))
        z.writestr("calendar_dates.txt", table([c for c in rows("calendar_dates.txt") if c["service_id"] in services],
                                               ["service_id", "date", "exception_type"]))
    return out.getvalue()


EXTRAS = {"make": make, "number": lambda t: t.get("trip_short_name") or None, "tz": TZ,
          "colors": {c: v for c, v in COLORS.items()}}
# Stations placed where the track is: filled in from the hop check.
POSITIONS = {}
GTFS = {"cfl": ("cfl-luxembourg-national-gtfs", lambda r: True, lambda r: r["route_short_name"],
                {**EXTRAS, "positions": POSITIONS})}

# The track: Luxembourg's lines and the ones over the borders to Trier,
# Thionville and Metz, Longwy, Audun-le-Tiche and Volmerange-les-Mines,
# routed from the timetable along OpenStreetMap's track (Geofabrik's
# extracts, build_rail.py).
RAIL = {"region": "lu", "bbox": BBOX, "network": "cfl"}
