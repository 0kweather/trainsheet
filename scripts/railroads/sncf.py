"""France: SNCF Voyageurs' trains (TGV INOUI and TGV Lyria, OUIGO and OUIGO
Train Classique, Intercités and Intercités de Nuit, every region's TER),
Transdev's ZOU! trains between Marseille, Toulon and Nice, the RER and
Transilien lines of Île-de-France, and the international trains in France
that publish their own timetables (DB's ICEs, in SNCF's file; Eurostar's).

Sources (transport.data.gouv.fr, France's National Access Point; checked
October 2026; no key for any of them):
  - SNCF's national timetable, GTFS (TGV INOUI, OUIGO, Intercités, TER, Lyria,
    ICE) and NeTEx (the same trips, with each TER line's region and each
    train's brand: OUIGO Train Classique is told apart only there), ODbL plus
    the National Access Point's special conditions;
  - SNCF Transilien's GTFS (Île-de-France Mobilités' data for the RER A-E and
    Transilien H-V, RATP's share of the RER A and B included), ODbL;
  - Eurostar's GTFS and GTFS-Realtime, Licence Ouverte 2.0;
  - Transdev Rail Sud Intermétropole's ZOU! GTFS and GTFS-Realtime, Licence
    Ouverte 2.0.
ODbL asks for attribution (the credits below and README's) and that a
derived database be shared alike: the timetables built here are the
sources' trips filtered and renamed, published with the site
(data/schedules/), which keeps them open.

Live data: SNCF's GTFS-Realtime trip updates (proxy.transport.data.gouv.fr,
no key, delays and cancellations for the next hour, refreshed every 2
minutes; TGV and Intercités guaranteed, most TER in it too), Eurostar's and
ZOU!'s, compacted by the relay into one answer (below). Île-de-France's live
times come only from Île-de-France Mobilités' PRIM platform, which needs a
free key: the RER and Transilien are placed from their timetable until the
relay has one (needsKey). No train positions are published, and no
formations: SNCF publishes no train compositions openly.

Railroads (the car files that draw them in brackets) and their lines, the
category as sold (a train's line is its brand; a TER's, its region's):
  tgv         TGV INOUI [sncf]: TGV INOUI (Paris to every LGV destination,
              the provincial cross-country TGVs, Paris-Milano, Paris-
              Barcelona, Paris-Luxembourg, Strasbourg-Bruxelles), TGV Lyria
              (Paris-Genève, -Lausanne, -Basel-Zürich, Genève-Marseille/Nice)
  ouigo       OUIGO [sncf]: OUIGO (TGV: Paris's stations, Marne-la-Vallée,
              Roissy, Lille-Marseille/Montpellier, Strasbourg-Marseille),
              OUIGO Train Classique (Paris Austerlitz-Nantes, -Rennes,
              -Bordeaux; Paris Nord-Bruxelles)
  intercites  Intercités [sncf]: Intercités (Paris-Clermont, Paris-Limoges-
              Toulouse, Bordeaux-Marseille, Nantes-Bordeaux, Nantes-Lyon,
              Toulouse-Hendaye, Metz-Lyon, the Aubrac and Cévennes lines),
              Intercités de Nuit (Paris-Toulouse/Latour-de-Carol/Rodez/Albi,
              Paris-Briançon, Paris-Nice)
  ter         TER [ter]: TER Hauts-de-France, TER Normandie, TER Bretagne,
              TER Pays de la Loire, TER Centre-Val de Loire, TER Nouvelle-
              Aquitaine, TER Occitanie, TER Provence-Alpes-Côte d'Azur, TER
              Auvergne-Rhône-Alpes, TER Bourgogne-Franche-Comté, TER Grand
              Est; and by name: Train Jaune (Villefranche-Vernet-les-Bains-
              Latour-de-Carol, metre gauge), Mont-Blanc Express (Saint-
              Gervais-Vallorcine, metre gauge), Tram-train Nantes-
              Châteaubriant, ZOU! Marseille-Toulon-Nice (Transdev)
  transilien  RER and Transilien [idf]: RER A, RER B, RER C, RER D, RER E,
              Transilien H, Transilien J, Transilien K, Transilien L,
              Transilien N, Transilien P, Transilien R, Transilien U,
              Transilien V
  frintl      International trains [sncf]: ICE (DB: Paris-Frankfurt,
              -Stuttgart-München, Frankfurt-Marseille), Eurostar (London-
              Paris/Brussels/Amsterdam, Paris-Brussels-Amsterdam/Köln/
              Dortmund, the winter Alps trains)
Left out: SNCF's coaches (Car TER, Car à réservation), the Léman Express
(Switzerland's plug-in has it whole), the Vallorcine-Martigny trains of TMR
(Switzerland's too), the tram-trains that run on city tram track (Mulhouse's
T3 and Thann line, the Saarbahn), Trenitalia France's Frecciarossa (Italy's
national timetable, trenitalia.py, has them) and Renfe's AVE to Lyon and
Marseille (renfe.py has them).
"""
import csv, datetime, io, json, os, re, tempfile, urllib.parse, urllib.request, zipfile
from collections import Counter, defaultdict

UA = "Trainsheet/1.0 (+https://trainsheet.com)"
TZ = "Europe/Paris"
SNCF_GTFS = "https://eu.ftp.opendatasoft.com/sncf/plandata/Export_OpenData_SNCF_GTFS_NewTripId.zip"
SNCF_NETEX = "https://eu.ftp.opendatasoft.com/sncf/plandata/export-opendata-sncf-netex.zip"
EUROSTAR_GTFS = "https://integration-storage.dm.eurostar.com/gtfs-prod/gtfs_static_commercial_v2.zip"
ZOU_GTFS = "https://www.data.gouv.fr/api/1/datasets/r/764d6d5b-d04e-4aa7-94b7-f8b2274d2964"
TRANSILIEN_GTFS = "https://eu.ftp.opendatasoft.com/sncf/gtfs/transilien-gtfs.zip"
# make() gathers the four into one timetable, under this name.
NATIONAL = "sncf-national-timetable"

BBOX = [-4.8, 42.3, 8.3, 51.1]
IDF_BBOX = [1.3, 47.9, 3.6, 49.5]
PAN = "https://transport.data.gouv.fr/datasets/"
COMMON = {"country": "FR", "tz": TZ, "clip": True}
SNCF_CREDIT = {"label": "SNCF Voyageurs via transport.data.gouv.fr", "href": PAN + "horaires-sncf"}

AGENCIES = {
    "tgv": {"name": "TGV INOUI", "short": "TGV INOUI", "region": "France", "color": "#9b2743", "kind": "intercity",
            "credit": SNCF_CREDIT, "license": "ODbL", "bbox": BBOX, "cars": "sncf", **COMMON},
    "ouigo": {"name": "OUIGO", "short": "OUIGO", "region": "France", "color": "#e5007d", "kind": "intercity",
              "after": "tgv", "credit": SNCF_CREDIT, "license": "ODbL", "bbox": BBOX, "cars": "sncf", **COMMON},
    "intercites": {"name": "Intercités", "short": "Intercités", "region": "France", "color": "#26358c", "kind": "intercity",
                   "after": "ouigo", "credit": SNCF_CREDIT, "license": "ODbL", "bbox": BBOX, "cars": "sncf", **COMMON},
    "frintl": {"name": "International trains in France", "short": "International", "region": "France", "color": "#4a4a4a",
               "kind": "intercity", "after": "intercites",
               "credit": {"label": "SNCF Voyageurs, Eurostar via transport.data.gouv.fr",
                          "href": PAN + "eurostar-gtfs-plan-de-transport-et-temps-reel"},
               "license": "ODbL; Licence Ouverte 2.0", "bbox": BBOX, "cars": "sncf", **COMMON},
    "ter": {"name": "TER", "short": "TER", "region": "France", "color": "#0088ce", "kind": "commuter", "after": "frintl",
            "credit": {"label": "SNCF Voyageurs, Transdev Rail Sud Intermétropole via transport.data.gouv.fr",
                       "href": PAN + "horaires-sncf"},
            "license": "ODbL; Licence Ouverte 2.0", "bbox": BBOX, **COMMON},
    "transilien": {"name": "RER and Transilien", "short": "Transilien", "region": "Île-de-France", "color": "#6e1e78",
                   "kind": "commuter", "after": "ter",
                   "credit": {"label": "SNCF / Île-de-France Mobilités via transport.data.gouv.fr",
                              "href": PAN + "horaires-des-lignes-transilien-1"},
                   "license": "ODbL", "bbox": IDF_BBOX, "cars": "idf", **COMMON},
}

# ---------- The national timetable (make()) ----------
# SNCF's GTFS files every train under a line ("Paris - Lyon TGV", "C26 Lyon
# Perrache - Saint-André Le Gaz") and tells its kind only by its stops' ids
# ("StopPoint:OCETGV INOUI-87686006": a TGV INOUI at Paris Gare de Lyon,
# "OCECar TER-...": a coach); a trip's number is its headsign. Its NeTEx
# gives each line's network (a TER region: "TER Grand-Est") and each train's
# brand (OUIGO_TC: OUIGO Train Classique).
KINDS = {"TGV INOUI": ("tgv", "TGV INOUI"), "Lyria": ("tgv", "TGV Lyria"), "OUIGO": ("ouigo", "OUIGO"),
         "INTERCITES": ("intercites", "Intercités"), "INTERCITES de nuit": ("intercites", "Intercités de Nuit"),
         "ICE": ("frintl", "ICE"), "Train TER": ("ter", None), "TramTrain": ("ter", None), "Navette": ("ter", None),
         "Train": ("ouigo", "OUIGO Train Classique")}
NETWORKS = {"TER Hauts de France": "TER Hauts-de-France", "TER Normandie": "TER Normandie", "TER Bretagne": "TER Bretagne",
            "TER Pays de la Loire": "TER Pays de la Loire", "TER Centre - Val de Loire": "TER Centre-Val de Loire",
            "TER Nouvelle Aquitaine": "TER Nouvelle-Aquitaine", "TER Occitanie": "TER Occitanie",
            "TER Provence Alpes-Côte d'Azur": "TER Provence-Alpes-Côte d'Azur",
            "TER Auvergne - Rhône-Alpes": "TER Auvergne-Rhône-Alpes",
            "TER Bourgogne - Franche-Comté": "TER Bourgogne-Franche-Comté", "TER Grand-Est": "TER Grand Est"}
# Lines shown by their own names, by SNCF's line ("route") long name.
NAMED = [(re.compile(r"^Villefranche Vernet Les Bains - Latour De Carol"), "Train Jaune"),
         (re.compile(r"^St-Gervais Les Bains - (Chamonix - )?Vallorcine"), "Mont-Blanc Express")]
TRAM_TRAINS = {"Nantes - Châteaubriant": "Tram-train Nantes – Châteaubriant"}
ZOU_LINE = "ZOU! Marseille – Toulon – Nice"
# Left out: the Léman Express (lines L1-L7, and the R53 SBB files here), TMR's
# Vallorcine-Martigny trains (agency 5429), both in Switzerland's plug-in.
LEMAN = re.compile(r"^L[1-9]$")
LEFT_OUT_AGENCIES = {"1185", "5429"}

# Stations as signed (by UIC number, seven digits): Paris's halls, the foreign
# stations SNCF files in French or in capitals, Eurostar's in its own style.
NAMES = {
    "8739100": "Paris Montparnasse", "8768600": "Paris Gare de Lyon", "8727100": "Paris Gare du Nord",
    "8734213": "Nœux-les-Mines", "8777517": "La Bastide-Saint-Laurent-les-Bains",
    # Switzerland
    "8501008": "Genève", "8501026": "Genève-Aéroport", "8504221": "Neuchâtel", "8503000": "Zürich HB",
    "8501566": "Le Châtelard VS",
    # Belgium
    "8814001": "Bruxelles-Midi / Brussel-Zuid", "8896008": "Kortrijk", "8871852": "Marchienne-Zone",
    "8871837": "Landelies", "8871829": "Hourpes", "8871811": "Thuin", "8871712": "Lobbes",
    "8871688": "Fontaine-Valmont", "8871670": "Labuissière", "8871662": "Solre-sur-Sambre",
    "8871647": "Erquelinnes-Village", "8871605": "Erquelinnes", "8885068": "Froyennes", "8841004": "Liège-Guillemins",
    # Luxembourg
    "8200930": "Pétange",
    # Germany
    "8011068": "Frankfurt (Main) Hbf", "8020347": "München Hbf", "8025391": "Saarbrücken Hbf", "8025181": "Trier Hbf",
    "8014413": "Müllheim (Baden)", "8019103": "Wörth (Rhein)", "8064613": "Maximiliansau Im Rüsten",
    "8005365": "Kassel-Wilhelmshöhe", "8065971": "Berlin Südkreuz", "8065969": "Berlin Hbf",
    # Italy
    "8304501": "Ventimiglia", "8301645": "Milano Porta Garibaldi", "8300035": "Torino Porta Susa",
    "8300204": "Oulx-Cesana-Claviere-Sestriere", "8300219": "Torino Porta Nuova",
    # Spain
    "7171801": "Barcelona Sants", "7179300": "Girona", "7104307": "Figueres Vilafant",
    # Eurostar's
    "7015400": "London St Pancras International", "8400058": "Amsterdam Centraal", "8400530": "Rotterdam Centraal",
}


# Names SNCF shortens, by name as filed.
BY_NAME = {"Fontpédrouse St-Thomas les B.": "Fontpédrouse - Saint-Thomas-les-Bains",
           "Moûtiers-Salins-Brides-les-B.": "Moûtiers - Salins - Brides-les-Bains",
           "Paris Bercy Bourg. Pays d'Auv.": "Paris Bercy Bourgogne - Pays d'Auvergne",
           "Luxembourg secteur Hollerich": "Hollerich", "Dippach secteur Reckange": "Dippach-Reckange",
           "Bascharage secteur Sanem": "Bascharage-Sanem"}


def uic7(code):
    """A station's UIC number, seven digits: SNCF's eight carry a check digit
    ("OCE87686006" -> "8768600"), Eurostar's and ZOU!'s give seven or eight."""
    digits = re.sub(r"\D", "", code or "")
    return digits[:7] if len(digits) >= 7 else None


def tidy(name):
    """SNCF's and Eurostar's names put right: a hall dropped ("Paris
    Montparnasse Hall 1 - 2"), capitals in title case."""
    name = re.sub(r"\s+Hall\s+\d.*$", "", re.sub(r"\s+", " ", name or "").strip())
    name = BY_NAME.get(name, name)
    if name == name.upper() and any(c.isalpha() for c in name):
        name = re.sub(r"[A-Za-zÀ-ÿ]+", lambda m: m[0].capitalize(), name.lower())
        name = re.sub(r"-(Sur|Sous|Les|La|Le|En|De|Du)-", lambda m: "-" + m[1].lower() + "-", name)
    return name


def _get(url, timeout=300):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def _rows(zf, name):
    if name not in zf.namelist():
        return
    with zf.open(name) as f:
        yield from csv.DictReader(io.TextIOWrapper(f, "utf-8-sig"))


def netex_facts(data):
    """From SNCF's NeTEx (the zip's bytes): {line id: network name} and the
    numbers of the trains branded OUIGO Train Classique. The 650 MB file is
    read as a stream, by pattern."""
    networks, classique = {}, set()
    net = re.compile(r'<Network id="[^"]*"[^>]*>.*?</Network>', re.S)
    journey = re.compile(r'<ServiceJourney id="[^"]*::SN(\d+)FERRE_[^"]*"[^>]*>.{0,600}?<BrandingRef ref="([^"]+)"', re.S)
    zf = zipfile.ZipFile(io.BytesIO(data))
    name = next(n for n in zf.namelist() if n.endswith(".xml"))
    with zf.open(name) as f:
        rest = ""
        while True:
            chunk = f.read(16 << 20)
            if not chunk:
                break
            text = rest + chunk.decode("utf-8", "ignore")
            for m in net.finditer(text):
                block = m[0]
                title = re.search(r"<Name>(.*?)</Name>", block)
                for line in re.findall(r'<LineRef ref="([^"]+)"', block):
                    networks[line] = title[1] if title else ""
            for m in journey.finditer(text):
                if m[2] == "OUIGO_TC":
                    classique.add(m[1])
            rest = text[-65536:]
    return networks, classique


def _ter_line(route, networks):
    long = route.get("route_long_name") or ""
    for pattern, line in NAMED:
        if pattern.search(long):
            return line
    return NETWORKS.get(networks.get(route["route_id"]))


def gather(sncf, netex, eurostar, zou):
    """The four downloads (bytes; netex, eurostar and zou may be None) as one
    GTFS zip: agencies tgv, ouigo, intercites, ter and frintl, one route per
    line, stations by UIC number, trip_short_name the train's number."""
    networks, classique = netex_facts(netex) if netex else ({}, set())
    if not netex:
        print("  sncf: no NeTEx: TER regions unknown, OUIGO Train Classique told by its numbers")
    stations = {}  # uic -> [name, lat, lon]
    routes, trips, times, calendar = {}, [], [], []
    services = set()

    def station(code, name, lat, lon):
        u = uic7(code)
        if u and u not in stations:
            stations[u] = [NAMES.get(u, tidy(name)), lat, lon]
        return u

    # SNCF
    zf = zipfile.ZipFile(io.BytesIO(sncf))
    sroutes = {r["route_id"]: r for r in _rows(zf, "routes.txt")}
    stops = {r["stop_id"]: r for r in _rows(zf, "stops.txt")}
    seq = defaultdict(list)
    for r in _rows(zf, "stop_times.txt"):
        seq[r["trip_id"]].append(r)
    ter_trips, unknown = {}, []
    for t in _rows(zf, "trips.txt"):
        rows = sorted(seq.pop(t["trip_id"], []), key=lambda r: int(r["stop_sequence"]))
        route = sroutes.get(t["route_id"])
        if len(rows) < 2 or not route or route["agency_id"] in LEFT_OUT_AGENCIES:
            continue
        kind = rows[0]["stop_id"].split(":", 1)[1].rsplit("-", 1)[0][3:]
        if kind not in KINDS:
            continue  # coaches
        number = (t.get("trip_headsign") or "").strip()
        agency, line = KINDS[kind]
        if kind == "OUIGO" and (number in classique or (not netex and number[:1] in "456")):
            line = "OUIGO Train Classique"
        elif kind == "Train" and netex and number not in classique:
            continue
        elif kind == "Navette" and route["route_short_name"] != "A01":
            agency, line = "intercites", "Intercités"
        elif agency == "ter":
            if LEMAN.match(route["route_short_name"]):
                continue
            if kind == "TramTrain":
                line = TRAM_TRAINS.get(route["route_long_name"])
                if not line:
                    continue  # on city tram track
            else:
                line = _ter_line(route, networks)
        stop_ids = []
        for r in rows:
            parent = stops.get(stops.get(r["stop_id"], {}).get("parent_station", ""), {})
            s = stops.get(r["stop_id"], {})
            u = station(parent.get("stop_id") or r["stop_id"], parent.get("stop_name") or s.get("stop_name"),
                        float(parent.get("stop_lat") or s["stop_lat"]), float(parent.get("stop_lon") or s["stop_lon"]))
            stop_ids.append(u)
        trip = {"agency": agency, "line": line, "service": "s" + t["service_id"], "trip": "s" + t["trip_id"],
                "number": number, "stops": stop_ids, "rows": rows}
        if agency == "ter" and not line:
            unknown.append(trip)
        trips.append(trip)
        services.add(trip["service"])
    # A TER line with no region in the NeTEx: the region whose TER trains
    # call most at its stations.
    region_at = defaultdict(Counter)
    for trip in trips:
        if trip["agency"] == "ter" and trip["line"] and trip["line"].startswith("TER "):
            for u in trip["stops"]:
                region_at[u][trip["line"]] += 1
    for trip in unknown:
        votes = Counter()
        for u in trip["stops"]:
            votes.update(region_at[u])
        trip["line"] = votes.most_common(1)[0][0] if votes else "TER"
    for r in _rows(zf, "calendar_dates.txt"):
        if "s" + r["service_id"] in services:
            calendar.append(("s" + r["service_id"], r["date"], r["exception_type"]))

    # Eurostar: its stations by their UIC numbers (stop_code), SNCF's names
    # and places where SNCF has the station.
    if eurostar:
        ze = zipfile.ZipFile(io.BytesIO(eurostar))
        estops = {r["stop_id"]: r for r in _rows(ze, "stops.txt")}
        eseq = defaultdict(list)
        for r in _rows(ze, "stop_times.txt"):
            eseq[r["trip_id"]].append(r)
        eserv = set()
        for t in _rows(ze, "trips.txt"):
            rows = sorted(eseq.pop(t["trip_id"], []), key=lambda r: int(r["stop_sequence"]))
            if len(rows) < 2:
                continue
            ids = []
            for r in rows:
                s = estops[r["stop_id"]]
                p = estops.get(s.get("parent_station") or "", s)
                ids.append(station(p.get("stop_code") or s.get("stop_code"), p["stop_name"], float(p["stop_lat"]), float(p["stop_lon"])))
            if None in ids:
                continue
            trips.append({"agency": "frintl", "line": "Eurostar", "service": "e" + t["service_id"], "trip": "e" + t["trip_id"],
                          "number": (t.get("trip_short_name") or "").strip(), "stops": ids, "rows": rows})
            eserv.add("e" + t["service_id"])
        for r in _rows(ze, "calendar_dates.txt"):
            if "e" + r["service_id"] in eserv:
                calendar.append(("e" + r["service_id"], r["date"], r["exception_type"]))

    # ZOU! (Transdev): stops are UIC numbers already.
    if zou:
        zz = zipfile.ZipFile(io.BytesIO(zou))
        zstops = {r["stop_id"]: r for r in _rows(zz, "stops.txt")}
        zseq = defaultdict(list)
        for r in _rows(zz, "stop_times.txt"):
            zseq[r["trip_id"]].append(r)
        zserv = set()
        for t in _rows(zz, "trips.txt"):
            rows = sorted(zseq.pop(t["trip_id"], []), key=lambda r: int(r["stop_sequence"]))
            if len(rows) < 2:
                continue
            ids = [station(r["stop_id"], zstops[r["stop_id"]]["stop_name"], float(zstops[r["stop_id"]]["stop_lat"]),
                           float(zstops[r["stop_id"]]["stop_lon"])) for r in rows]
            trips.append({"agency": "ter", "line": ZOU_LINE, "service": "z" + t["service_id"], "trip": "z" + t["trip_id"],
                          "number": (t.get("trip_short_name") or "").strip(), "stops": ids, "rows": rows})
            zserv.add("z" + t["service_id"])
        cal = list(_rows(zz, "calendar_dates.txt"))
        for r in cal:
            if "z" + r["service_id"] in zserv:
                calendar.append(("z" + r["service_id"], r["date"], r["exception_type"]))

    # Out, as GTFS.
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        def table(name, cols, rows):
            buf = io.StringIO()
            w = csv.writer(buf, lineterminator="\n")
            w.writerow(cols)
            w.writerows(rows)
            z.writestr(name, buf.getvalue())
        table("agency.txt", ["agency_id", "agency_name", "agency_url", "agency_timezone"],
              [[a, AGENCIES[a]["name"], "https://www.sncf-connect.com", TZ] for a in ("tgv", "ouigo", "intercites", "frintl", "ter")])
        lines = sorted({(t["agency"], t["line"]) for t in trips})
        rid = {k: f"{k[0]}:{k[1]}" for k in lines}
        table("routes.txt", ["route_id", "agency_id", "route_short_name", "route_long_name", "route_type"],
              [[rid[k], k[0], k[1], k[1], 2] for k in lines])
        used = {u for t in trips for u in t["stops"]}
        table("stops.txt", ["stop_id", "stop_name", "stop_lat", "stop_lon"],
              [[u, *stations[u]] for u in sorted(used)])
        table("trips.txt", ["route_id", "service_id", "trip_id", "trip_short_name"],
              [[rid[(t["agency"], t["line"])], t["service"], t["trip"], t["number"]] for t in trips])
        rows = []
        for t in trips:
            for i, (u, r) in enumerate(zip(t["stops"], t["rows"])):
                rows.append([t["trip"], r["arrival_time"] or r["departure_time"], r["departure_time"] or r["arrival_time"], u, i,
                             r.get("pickup_type") or 0, r.get("drop_off_type") or 0])
        table("stop_times.txt", ["trip_id", "arrival_time", "departure_time", "stop_id", "stop_sequence", "pickup_type",
                                 "drop_off_type"], rows)
        table("calendar_dates.txt", ["service_id", "date", "exception_type"], sorted(set(calendar)))
    counts = Counter(t["agency"] for t in trips)
    print("  sncf: " + ", ".join(f"{a} {n} trips" for a, n in sorted(counts.items())))
    return out.getvalue()


def make():
    """The national timetable as GTFS: SNCF's (with its NeTEx's regions and
    brands), Eurostar's and ZOU!'s, gathered (see gather()). Kept a day in
    the temp folder, so the build's scripts (stations, timetables, colors,
    first trains) download it once."""
    keep = pathlib_tmp()
    if os.path.exists(keep):
        with open(keep, "rb") as f:
            return f.read()
    optional = {}
    for name, url in (("netex", SNCF_NETEX), ("eurostar", EUROSTAR_GTFS), ("zou", ZOU_GTFS)):
        try:
            optional[name] = _get(url)
        except Exception as err:  # one source down leaves the others
            print(f"  sncf: {url}: {err}")
            optional[name] = None
    data = gather(_get(SNCF_GTFS), **optional)
    with open(keep, "wb") as f:
        f.write(data)
    return data


def pathlib_tmp():
    return os.path.join(tempfile.gettempdir(), f"trainsheet-sncf-{datetime.date.today():%Y%m%d}.zip")


# ---------- Île-de-France: the RER and Transilien ----------
# SNCF Transilien's GTFS (Île-de-France Mobilités' data): the RER (agency
# IDFM:71, A-E, RATP's trains on the A and B too) and Transilien (IDFM:1046,
# H-V), each trip numbered (trip_short_name); its TER rows (IDFM:93) are in
# the national file, its replacement buses are route type 3.
IDF_AGENCIES = {"IDFM:71": "RER", "IDFM:1046": "Transilien"}
# Stations as SNCF signs Paris's termini (and as the national file names
# them), and a few names put right.
IDF_NAMES = {"Gare du Nord": "Paris Gare du Nord", "Gare de Lyon": "Paris Gare de Lyon", "Gare de l'Est": "Paris Est",
             "Gare Saint-Lazare": "Paris Saint-Lazare", "Gare Montparnasse": "Paris Montparnasse",
             "Gare d'Austerlitz": "Paris Austerlitz", "Gif-Sur-Yvette": "Gif-sur-Yvette",
             "Aéroport CDG (Terminal 2) - TGV": "Aéroport Charles de Gaulle 2 TGV",
             "Aéroport CDG 1 (Terminal 3)": "Aéroport Charles de Gaulle 1", "Bécon les Bruyères": "Bécon-les-Bruyères",
             "Nanterre-La-Folie": "Nanterre La Folie"}


def idf_name(name):
    name = re.sub(r"\s+", " ", name or "").strip()
    return IDF_NAMES.get(name, name)


# ---------- Every railroad's timetable ----------
COLORS = {"TGV INOUI": "#9b2743", "TGV Lyria": "#a6192e", "OUIGO": "#e5007d", "OUIGO Train Classique": "#0096d6",
          "Intercités": "#26358c", "Intercités de Nuit": "#1b2459", "ICE": "#ec0016", "Eurostar": "#1d2a5e",
          "TER Hauts-de-France": "#0f6eb4", "TER Normandie": "#d5203c", "TER Bretagne": "#00477f",
          "TER Pays de la Loire": "#009fe3", "TER Centre-Val de Loire": "#7b2c84", "TER Nouvelle-Aquitaine": "#3e844c",
          "TER Occitanie": "#e30613", "TER Provence-Alpes-Côte d'Azur": "#c2006a", "TER Auvergne-Rhône-Alpes": "#bf005f",
          "TER Bourgogne-Franche-Comté": "#8a1538", "TER Grand Est": "#0f5b95", "TER": "#0088ce",
          "Train Jaune": "#f2b200", "Mont-Blanc Express": "#c4022b", "Tram-train Nantes – Châteaubriant": "#009fe3",
          ZOU_LINE: "#c2006a",
          # Île-de-France Mobilités' line colors (its GTFS's).
          "RER A": "#eb2132", "RER B": "#5091cb", "RER C": "#ffcc30", "RER D": "#008b5b", "RER E": "#b94e9a",
          "Transilien H": "#84653d", "Transilien J": "#cec73d", "Transilien K": "#9b9842", "Transilien L": "#c4a4cc",
          "Transilien N": "#00b297", "Transilien P": "#f58f53", "Transilien R": "#f49fb3", "Transilien U": "#b6134c",
          "Transilien V": "#9f9825"}
LINES = {"tgv": ["TGV INOUI", "TGV Lyria"], "ouigo": ["OUIGO", "OUIGO Train Classique"],
         "intercites": ["Intercités", "Intercités de Nuit"], "frintl": ["ICE", "Eurostar"],
         "ter": [*NETWORKS.values(), "TER", "Train Jaune", "Mont-Blanc Express", "Tram-train Nantes – Châteaubriant", ZOU_LINE],
         "transilien": [f"RER {x}" for x in "ABCDE"] + [f"Transilien {x}" for x in "HJKLNPRUV"]}
NUMBER = lambda t: (t.get("trip_short_name") or "").strip() or None
# Stations placed where their railroad's track reaches them ({railroad:
# {station id: [lat, lon]}}), from the in-page hop check.
POSITIONS = {}
GTFS = {a: (NATIONAL, lambda r, a=a: r["agency_id"] == a, lambda r: r["route_short_name"],
            {"make": make, "number": NUMBER, "tz": TZ, "colors": {l: COLORS[l] for l in LINES[a]},
             "positions": POSITIONS.get(a, {})})
        for a in ("tgv", "ouigo", "intercites", "frintl", "ter")}
GTFS["transilien"] = (TRANSILIEN_GTFS,
                      lambda r: r.get("route_type") == "2" and r.get("agency_id") in IDF_AGENCIES,
                      lambda r: f"{IDF_AGENCIES[r['agency_id']]} {r['route_short_name']}",
                      {"number": NUMBER, "tz": TZ, "rename": idf_name, "colors": {l: COLORS[l] for l in LINES["transilien"]},
                       "positions": POSITIONS.get("transilien", {})})

# The track: OpenStreetMap's, routed from the timetables over Geofabrik's
# extracts of France's regions and of the neighbours its trains run into
# (scripts/osm_tiles.py): the LGVs, the classic lines, the metre-gauge Train
# Jaune and Mont-Blanc lines, and over the borders to London, Bruxelles,
# Luxembourg, Saarbrücken, Frankfurt, Karlsruhe, Basel, Genève, Torino,
# Ventimiglia and Barcelona.
# The TGVs, OUIGOs, ICEs and Eurostars are routed on the LGVs where they run
# (build_rail.py's FAST_TRACK), not on a classic line a few km shorter.
# By hand ("track"): the Ligne des Alpes' horseshoe south of Vif, round over
# its viaduct (OpenStreetMap ways 996723573-807787442), which routing the
# Vif-Monestier-de-Clermont hop cuts across by starting from the track that
# passes 300 m south of the station.
VIF_LOOP = [[5.68541, 45.04758], [5.68325, 45.04843], [5.68208, 45.04868], [5.6811, 45.04871], [5.68016, 45.04863],
            [5.67803, 45.04811], [5.67707, 45.04802], [5.67597, 45.04816], [5.67432, 45.04869], [5.67328, 45.04886],
            [5.6724, 45.04886], [5.67171, 45.04877], [5.67056, 45.04842], [5.66968, 45.04791], [5.66927, 45.04757],
            [5.66881, 45.04702], [5.66857, 45.04655], [5.66768, 45.04393], [5.66732, 45.04314], [5.66519, 45.04061],
            [5.66497, 45.04016], [5.66488, 45.03975], [5.66494, 45.0391], [5.66519, 45.03851], [5.6655, 45.0381],
            [5.66626, 45.03751], [5.66714, 45.03714], [5.668, 45.03697], [5.66898, 45.03696], [5.6698, 45.03708],
            [5.67094, 45.03756], [5.67421, 45.04011], [5.67762, 45.04218], [5.6783, 45.0428], [5.67952, 45.04438],
            [5.68047, 45.04502], [5.68148, 45.04535], [5.68279, 45.04545], [5.68385, 45.0453], [5.68513, 45.04496]]
RAIL = {"region": "fr", "bbox": BBOX, "network": "ter", "highspeed": ["tgv", "ouigo", "frintl"], "track": [VIF_LOOP]}


# ---------- Live: delays and cancellations ----------
# Three GTFS-Realtime trip-update feeds, no key, fetched by the relay (their
# servers send CORS headers, but the three are 1.1 MB of protobuf a minute)
# and passed on as one compact JSON:
#   SNCF's (proxy.transport.data.gouv.fr, refreshed every 2 minutes: the
#     trains of the next hour, trip ids "OCESN<number>F..."; delays with
#     their times; stops "StopPoint:OCE<kind>-<UIC with check digit>"),
#   Eurostar's (refreshed every 30 s; trip ids "<number>-<MMDD>"; stops by
#     platform, "paris_nord_12"; mostly platforms and cancellations),
#   ZOU!'s (Transdev; trip ids "<number>@<date>"; stops by UIC; times only).
#   {"at": newest feed time (unix s),
#    "trips": {number: [[start date "20261024", cancelled 0/1, absolute 0/1,
#                        [[uic, arrival, departure, skipped 0/1], ...]], ...]}}
# arrival and departure are delays in seconds, or with absolute 1 the
# predicted times (unix s); a delay is listed only where it changes. Trips
# added to the timetable (relationship ADDED) are left out: they aren't in
# it. The page (js/railroads/sncf.js) finds a run's trip by its number and
# day, and moves it by the stations named.
# The relay asks once a minute (ttl 60): three requests a minute upstream
# however many people watch. Île-de-France's live times are another source,
# "idfm" (below), keyed.
SNCF_RT = "https://proxy.transport.data.gouv.fr/resource/sncf-gtfs-rt-trip-updates"
EUROSTAR_RT = "https://integration-storage.dm.eurostar.com/gtfs-prod/gtfs_rt_v2.bin"
ZOU_RT = ("https://qommutef8e7.blob.core.windows.net/out-gtfs-rt-trip-update/gtfs-rt-trip-updates.pb?sp=r"
          "&st=2025-06-23T14%3A10%3A00Z&se=2125-06-24T21%3A59%3A00Z&spr=https&sv=2024-11-04&sr=b"
          "&sig=tSjVPNeqolsiRwU%2FxmeF6mlzgxVHfieggx%2FWYnwqSoM%3D")
LIVE_FEEDS = [SNCF_RT, EUROSTAR_RT, ZOU_RT]
# Eurostar's stations by their ids (a platform's id is its station's and a
# number: "paris_nord_12"), as UIC numbers.
EUROSTAR_UIC = {
    "aachen_hbf": "8015345", "aime_la_plagne_batiment_voyageurs": "8774176", "albertville": "8774164",
    "amsterdam_centraal": "8400058", "antwerpen_centraal": "8821006", "bourg_st_maurice": "8774179",
    "bruxelles_midi": "8814001", "chambery_challes_les_eaux": "8774100", "dortmund_hbf": "8010053",
    "duisburg_hbf": "8010316", "dusseldorf_hbf": "8008094", "essen_hbf": "8010184", "koln_hbf": "8015458",
    "landry": "8774177", "liege_guillemins": "8841004", "lille_europe": "8722326", "marne_la_vallee_chessy": "8711184",
    "moutiers_salins_brides_les_bai": "8774172", "paris_nord": "8727100", "roissy_airport_cdg_2": "8727149",
    "rotterdam_centraal": "8400530", "schiphol_airport": "8400561", "st_pancras_international": "7015400"}


def _varint(b, i):
    v = shift = 0
    while True:
        x = b[i]
        i += 1
        v |= (x & 0x7F) << shift
        shift += 7
        if not x & 0x80:
            return v, i


def _fields(b, start=0, end=None):
    """A protobuf message's fields: (number, wire type, value): an int
    (varint) or the bytes' (start, end)."""
    i, end = start, len(b) if end is None else end
    while i < end:
        key, i = _varint(b, i)
        f, w = key >> 3, key & 7
        if w == 0:
            v, i = _varint(b, i)
        elif w == 1:
            v, i = (i, i + 8), i + 8
        elif w == 5:
            v, i = (i, i + 4), i + 4
        elif w == 2:
            n, i = _varint(b, i)
            v, i = (i, i + n), i + n
        else:
            return
        yield f, w, v


def _signed(v):
    v &= 0xFFFFFFFFFFFFFFFF
    return v - (1 << 64) if v & (1 << 63) else v


def station_of(stop_id):
    """A feed's stop id as a station's UIC number (an int): SNCF's
    "StopPoint:OCETGV INOUI-87686006" and ZOU!'s "87751008" -> 8768600,
    Eurostar's "paris_nord_12" -> 8727100."""
    stop_id = stop_id or ""
    m = re.search(r"(\d{7})\d?$", stop_id)
    if m:
        return int(m[1])
    uic = EUROSTAR_UIC.get(re.sub(r"_\d+$", "", stop_id)) or EUROSTAR_UIC.get(stop_id)
    return int(uic) if uic else None


def train_number(trip_id):
    """A trip id's train number: "OCESN5772F1187_F:..." -> "5772",
    "9006-1024" -> "9006", "17489@2026-10-26" -> "17489"."""
    m = re.match(r"(?:OCESN)?0*(\d+)", trip_id or "")
    return m[1] if m else None


def compact(feeds, out=None):
    """The relay's answer (see above) from the feeds' protobuf (a list of
    bytes); out: an answer to add to."""
    out = out or {"at": 0, "trips": {}}
    for feed in feeds:
        for f, w, v in _fields(feed):
            if f == 1 and w == 2:  # header: timestamp 3
                for hf, hw, hv in _fields(feed, *v):
                    if hf == 3 and hw == 0:
                        out["at"] = max(out["at"], hv)
            if f != 2 or w != 2:
                continue
            tu = next((x for ef, ew, x in _fields(feed, *v) if ef == 3 and ew == 2), None)  # trip_update
            if not tu:
                continue
            desc, updates = {}, []
            for uf, uw, uv in _fields(feed, *tu):
                if uf == 1 and uw == 2:  # trip: trip_id 1, start_time 2, start_date 3, relationship 4
                    for df, dw, dv in _fields(feed, *uv):
                        desc[df] = feed[dv[0]:dv[1]].decode() if dw == 2 else dv
                elif uf == 2 and uw == 2:  # stop_time_update: seq 1, arrival 2, departure 3, stop_id 4, relationship 5
                    u = {}
                    for sf, sw, sv in _fields(feed, *uv):
                        if sf in (2, 3) and sw == 2:  # StopTimeEvent: delay 1, time 2
                            ev = {ef: _signed(x) for ef, ew, x in _fields(feed, *sv) if ew == 0}
                            u[sf] = ev
                        elif sf == 4 and sw == 2:
                            u[4] = feed[sv[0]:sv[1]].decode()
                        elif sf in (1, 5) and sw == 0:
                            u[sf] = sv
                    updates.append(u)
            number, date = train_number(desc.get(1)), desc.get(3)
            if not number or not date or desc.get(4) == 1:
                continue
            cancelled = 1 if desc.get(4) == 3 else 0
            # Delays where the feed gives them (SNCF's, Eurostar's), else times.
            timed = [u for u in updates if u.get(5) != 2 and (u.get(2) or u.get(3))]
            absolute = 1 if timed and not any(1 in (u.get(2) or {}) or 1 in (u.get(3) or {}) for u in timed) else 0
            stops, last = [], None
            for u in sorted(updates, key=lambda u: u.get(1, 0)):
                uic = station_of(u.get(4))
                if not uic or u.get(5) == 2:  # NO_DATA
                    continue
                key = 2 if absolute else 1
                arr, dep = (u.get(2) or {}).get(key), (u.get(3) or {}).get(key)
                arr, dep = arr if arr is not None else dep, dep if dep is not None else arr
                if arr is None and u.get(5) != 1:
                    continue
                row = [uic, arr or 0, dep or 0, 1 if u.get(5) == 1 else 0]
                if absolute or last is None or row[1:] != last[1:]:
                    stops.append(row)
                last = row
            if stops or cancelled:
                out["trips"].setdefault(number, []).append([date, cancelled, absolute, stops])
    return _tidy(out)


def _tidy(out):
    """Only the trips of the days around the feeds' time (yesterday's
    night trains, today's, tomorrow's first), each number's in order."""
    at = out["at"] or int(datetime.datetime.now(datetime.timezone.utc).timestamp())
    days = {datetime.datetime.fromtimestamp(at + d * 86400, datetime.timezone.utc).strftime("%Y%m%d") for d in (-1, 0, 1)}
    trips = {}
    for number, runs in out["trips"].items():
        runs = sorted(r for r in runs if r[0] in days or not r[0])
        if runs:
            trips[number] = runs
    # By number, as a JavaScript object orders its integer keys.
    return {"at": out["at"], "trips": dict(sorted(trips.items(), key=lambda kv: int(kv[0])))}


def _fetch(url, headers=None, timeout=30):
    req = urllib.request.Request(url, headers={"User-Agent": UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


# ---------- Live: Île-de-France (PRIM, keyed) ----------
# Île-de-France Mobilités' PRIM platform (prim.iledefrance-mobilites.fr)
# publishes the RER's and Transilien's predicted times as SIRI Lite
# (estimated-timetable, one line a request: LineRef=STIF:Line::C01742: for
# the RER A), with a free key sent as the header "apikey" (the Worker secret
# IDFM_PRIM_KEY). The relay asks for the 14 lines every two minutes (ttl
# 120: 14 requests, about 10,000 a day; PRIM's quota for the key is to be
# checked when it is issued) and compacts them like SNCF's feed, but with
# each stop named by its timetabled time, which the page matches to the
# run's (the feed's stop ids are platforms, the timetable's stations):
#   {"at": unix s, "trips": {number: [["", cancelled 0/1, 2,
#                                      [[aimed unix s, arrival delay s, departure delay s, skipped 0/1], ...]]]}}
PRIM_ET = "https://prim.iledefrance-mobilites.fr/marketplace/estimated-timetable"
IDF_LINES = {"RER A": "C01742", "RER B": "C01743", "RER C": "C01727", "RER D": "C01728", "RER E": "C01729",
             "Transilien H": "C01737", "Transilien J": "C01739", "Transilien K": "C01738", "Transilien L": "C01740",
             "Transilien N": "C01736", "Transilien P": "C01730", "Transilien R": "C01731", "Transilien U": "C01741",
             "Transilien V": "C02711"}


def _iso(t):
    return int(datetime.datetime.fromisoformat(t.replace("Z", "+00:00")).timestamp()) if t else None


def _value(x):
    return x.get("value") if isinstance(x, dict) else x


def compact_siri(answers, out=None):
    """The idfm answer from PRIM's SIRI Lite estimated-timetable answers
    (parsed JSON, one a line)."""
    out = out or {"at": 0, "trips": {}}
    for ans in answers:
        delivery = ((ans or {}).get("Siri") or {}).get("ServiceDelivery") or {}
        out["at"] = max(out["at"], _iso(delivery.get("ResponseTimestamp")) or 0)
        for et in delivery.get("EstimatedTimetableDelivery") or []:
            for frame in et.get("EstimatedJourneyVersionFrame") or []:
                for j in frame.get("EstimatedVehicleJourney") or []:
                    numbers = [_value(n) for n in ((j.get("TrainNumbers") or {}).get("TrainNumberRef") or [])]
                    number = next((n for n in numbers if n and str(n).isdigit()), None)
                    if not number:
                        m = re.search(r"(\d{5,6})", str(_value(j.get("DatedVehicleJourneyRef")) or ""))
                        number = m[1] if m else None
                    if not number:
                        continue
                    stops, last, cancelled = [], None, 1 if j.get("Cancellation") else 0
                    for c in (j.get("EstimatedCalls") or {}).get("EstimatedCall") or []:
                        aimed_a, aimed_d = _iso(c.get("AimedArrivalTime")), _iso(c.get("AimedDepartureTime"))
                        exp_a, exp_d = _iso(c.get("ExpectedArrivalTime")), _iso(c.get("ExpectedDepartureTime"))
                        aimed = aimed_d or aimed_a
                        if not aimed:
                            continue
                        arr = exp_a - aimed_a if exp_a and aimed_a else None
                        dep = exp_d - aimed_d if exp_d and aimed_d else None
                        arr, dep = arr if arr is not None else dep, dep if dep is not None else arr
                        skipped = 1 if "cancelled" in (str(c.get("ArrivalStatus")), str(c.get("DepartureStatus"))) else 0
                        row = [aimed, arr or 0, dep or 0, skipped]
                        if last is None or row[1:] != last[1:]:
                            stops.append(row)
                        last = row
                    if stops or cancelled:
                        out["trips"].setdefault(str(number), []).append(["", cancelled, 2, stops])
    return _tidy(out)


SOURCES = [
    # The relay must serve this feed (relay/feeds/sncf.js) before the page
    # goes out: without it France's trains aren't shown.
    {"id": "sncf", "agencies": ["tgv", "ouigo", "intercites", "frintl", "ter"], "format": "json", "interval": 60,
     "relay": True, "needsKey": False, "scope": "view"},
    # Until the relay has a PRIM key, Île-de-France's trains are placed from
    # their timetable.
    {"id": "idfm", "agencies": ["transilien"], "format": "json", "interval": 60, "relay": True,
     "needsKey": "IDFM_PRIM_KEY", "untilKey": "timetable", "scope": "view", "after": "sncf"},
]
RELAY = {"sncf": {"ttl": 60}, "idfm": {"keys": ["IDFM_PRIM_KEY"], "ttl": 120}}


def relay_fetch(env, source_id, query=None):
    """The relay's answer: the same bytes as relay/feeds/sncf.js."""
    if source_id == "sncf":
        feeds = []
        for url in LIVE_FEEDS:
            try:
                feeds.append(_fetch(url))
            except Exception as err:  # one feed down leaves the others
                print(f"sncf: {url}: {err}")
        out = compact(feeds)
    else:
        answers = []
        for code in IDF_LINES.values():
            q = urllib.parse.urlencode({"LineRef": f"STIF:Line::{code}:"})
            try:
                answers.append(json.loads(_fetch(f"{PRIM_ET}?{q}", {"apikey": env["IDFM_PRIM_KEY"], "Accept": "application/json"})))
            except Exception as err:  # a line that fails leaves the others
                print(f"idfm: {code}: {err}")
        out = compact_siri(answers)
    return json.dumps(out, separators=(",", ":")).encode(), "application/json"
