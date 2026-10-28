"""Germany: every railway's passenger trains (DB Fernverkehr, DB Regio, the
S-Bahns, the private regional railways and the foreign railways' trains in
Germany). WORK IN PROGRESS: agencies and their routes first, so the car files
can be drawn; the timetable and live data follow.

Railroads (the car files that draw them in brackets) and their lines (the
category as sold and the line number, "RE 1", "RB 33", "S 1"; long-distance
trains by category, "ICE", "IC", "EC", with their train numbers):
  dbfv       DB Fernverkehr [dbfv]: ICE, IC, EC and ECE trains DB runs,
             with the ICEs run jointly with NS (Amsterdam), SBB (Basel,
             Zürich, Interlaken, Chur), ÖBB (Wien, Innsbruck) and SNCF
             (Paris) as far as they're DB's in Germany; DB's IC 2 (Twindexx)
             and KISS ICs (IC 17 Dresden-Rostock, IC 35 Köln-Norddeich, IC 55,
             IC 56 Leipzig/Hannover-Emden/Norddeich, IC 57, IC 61 Karlsruhe-
             Nürnberg/Leipzig, IC 87 Stuttgart-Singen-Zürich), ICE lines 1-91
             (DB's own line numbers, internal: the trains show as "ICE")
  deld       other long distance in Germany [deld]: FlixTrain (FLX 10, FLX 20,
             FLX 30), European Sleeper, ÖBB's Railjets, Nightjets and ECs in
             Germany, SNCF's TGVs, Eurostar (the former Thalys, Köln-Aachen),
             ČD's ECs Praha-Dresden-Berlin/Hamburg, PKP Intercity (Berlin-
             Warszawa EC, Berlin-Przemyśl/Kraków), SBB's ECEs (München-Lindau-
             Zürich, Frankfurt-Basel-Milano), DSB's ICs and ECEs to
             Flensburg and Hamburg, SJ/BTE's EuroNight Berlin-Stockholm,
             the Alpen-Sylt Nachtexpress, WESTbahn, LEO Express, the
             Autozug Sylt
  dbregio    DB Regio, north and east (Schleswig-Holstein, Hamburg,
             Niedersachsen, Bremen, Mecklenburg-Vorpommern, Brandenburg,
             Berlin, Sachsen-Anhalt, Sachsen, Thüringen) [dbregio]: DB Regio
             Nord (RE 1-RE 86, RB 37-RB 86), Nordost (RE 1-RE 18, RB 11-RB 93,
             FEX Berlin airport express), Südost (RE 1-RE 56, RB 33-RB 113,
             HBX Harz-Berlin-Express), DB RegioNetz Erzgebirgsbahn (RB 80,
             RB 81, RB 95) and Oberweißbacher Berg- und Schwarzatalbahn (RB 60,
             RB 61)
  dbregio2   DB Regio, south and west (Nordrhein-Westfalen, Hessen,
             Rheinland-Pfalz, Saarland, Baden-Württemberg, Bayern)
             [dbregio2]: DB Regio NRW (RE 2-RE 57, RB 20-RB 64), Mitte
             (Hessen: RE 5-RE 73, RB 22-RB 68), Südwest (Rheinland-Pfalz and
             Saarland: RE 1-RE 25, RB 23-RB 87, SÜWEX RE 1, RE 2, RE 4, RE 11,
             RE 14), Baden-Württemberg (RE 2-RE 200, RB 10a-RB 93, MEX 12-MEX
             90, bwegt), Bayern (RE 1-RE 50, RB 6-RB 94, incl. DB Regio
             Franken, Allgäu-Schwaben, Oberbayern), DB RegioNetz
             Südostbayernbahn (RB 32-RB 59, RE 4), Westfrankenbahn (RB 56-
             RB 88, RE 80), Kurhessenbahn (RB 4-RB 97, RE 39, RE 97)
  deprivat   private regional railways, north, east and Nordrhein-Westfalen
             [deprivat]: metronom (RE 3, RE 4, RB 31, RB 41), erixx, enno,
             EVB (RB 33, MEX), NordWestBahn (RB 58-RB 85, RE 18), Nordbahn,
             AKN (A 1-A 3), Hanseatische Eisenbahn, NEG (Niebüll-Dagebüll),
             Bentheimer Eisenbahn (RB 56), ODEG, NEB, Erfurter Bahn, Süd-
             Thüringen-Bahn, Abellio Mitteldeutschland, Mitteldeutsche
             Regiobahn (Transdev), cantus, vogtlandbahn, trilex and trilex-
             express (Die Länderbahn), City-Bahn Chemnitz, Freiberger
             Eisenbahn, Pressnitztalbahn, Rhenus Veniro, TRI, eurobahn,
             National Express (RE 1, RE 4-RE 7, RE 11, RB 48), WestfalenBahn,
             RheinRuhrBahn (Transdev), Rurtalbahn, Regiobahn (RE 47), the
             narrow-gauge railways with daily trains (Harzer
             Schmalspurbahnen, Molli, the SDG's Lößnitzgrund-, Weißeritztal-
             and Fichtelbergbahn, SOEG's Zittauer Schmalspurbahn)
  deprivat2  private regional railways, south and west (Hessen, Rheinland-
             Pfalz, Saarland, Baden-Württemberg, Bayern) [deprivat2]: HLB
             (Hessische Landesbahn), VIAS (Odenwaldbahn, Rheingau), vlexx,
             MittelrheinBahn (Trans Regio), Westerwaldbahn (Daadetalbahn),
             SWEG (incl. its Ortenau and HzL lines), Arverio Baden-
             Württemberg (MEX 13, MEX 16, RE 1, RE 8, RE 9, RE 90, RB 8...),
             Arverio Bayern (RE 9, RE 72-RE 96, RB 80-RB 92), agilis and
             agilis-Schnellzug, Bayerische Regiobahn (BRB, incl. the
             Oberland and Mangfall lines), waldbahn, oberpfalzbahn and alex
             (Die Länderbahn), Bodensee-Oberschwaben-Bahn (RB 91), WEG's
             VVS lines (Strohgäubahn, Schönbuchbahn, Wieslauftalbahn), the
             Bayerische Zugspitzbahn
  sbahn      the S-Bahns, whoever runs them [sbahn]: Berlin (S-Bahn Berlin),
             Hamburg (S-Bahn Hamburg), München, Stuttgart, Rhein-Main, Rhein-
             Ruhr and Köln, Nürnberg, Mitteldeutschland, Dresden, Rhein-
             Neckar, Rostock, Hannover (Transdev), Bremen/Niedersachsen
             (NordWestBahn's RS 1-RS 6, RS 30), Breisgau (SWEG), Regiobahn's
             S 28, RheinRuhrBahn's S 7
  deintl     the neighbouring railways' regional trains over the border
             [deld]: ČD, ÖBB, SNCF, SNCB, CFL, DSB, PKP Intercity and
             Polregio, as far as no other plug-in shows them
Left out: tram-trains (Karlsruhe's Stadtbahn, AVG and KVV; Kassel's RegioTram;
Chemnitz's Citylink lines C 11-C 15; the Saarbahn), U-Bahns, rail replacement
buses, and the heritage and park railways (steam specials, museum lines run a
few days a year).
"""

import csv, datetime, io, json, math, os, pathlib, re, tempfile, time, unicodedata, urllib.request, zipfile
from collections import Counter, defaultdict

TZ = "Europe/Berlin"
CREDIT = {"label": "DELFI e.V. via gtfs.de (CC BY 4.0)", "href": "https://gtfs.de/en/feeds/"}
BBOX = [5.85, 47.27, 15.05, 55.06]
COMMON = {"region": "Germany", "country": "DE", "tz": TZ, "credit": CREDIT, "license": "CC BY 4.0", "bbox": BBOX, "clip": True}

AGENCIES = {
    "dbfv": {"name": "DB Fernverkehr", "short": "DB", "color": "#ec0016", "kind": "intercity", "cars": "dbfv", **COMMON},
    "deld": {"name": "Other long-distance trains in Germany", "short": "Long distance", "color": "#4a4a4a", "kind": "intercity",
             "cars": "deld", "after": "dbfv", **COMMON},
    "dbregio": {"name": "DB Regio (north and east)", "short": "DB Regio", "color": "#ec0016", "kind": "commuter", "cars": "dbregio",
                "after": "deld", **COMMON},
    "dbregio2": {"name": "DB Regio (south and west)", "short": "DB Regio", "color": "#ec0016", "kind": "commuter", "cars": "dbregio2",
                 "after": "dbregio", **COMMON},
    "deprivat": {"name": "Regional railways (north and east)", "short": "Regional", "color": "#00747a", "kind": "commuter",
                 "cars": "deprivat", "after": "dbregio2", **COMMON},
    "deprivat2": {"name": "Regional railways (south and west)", "short": "Regional", "color": "#2b6cb0", "kind": "commuter",
                  "cars": "deprivat2", "after": "deprivat", **COMMON},
    "sbahn": {"name": "S-Bahn", "short": "S-Bahn", "color": "#408335", "kind": "commuter", "cars": "sbahn", "after": "deprivat2", **COMMON},
    "deintl": {"name": "Neighbouring railways' trains in Germany", "short": "International", "color": "#5b6770", "kind": "commuter",
               "cars": "deld", "after": "sbahn", **COMMON},
}

# ---------- The timetable ----------
# gtfs.de's free feeds of DELFI's national timetable (CC BY 4.0, no key,
# rebuilt daily, about a month ahead): long distance ("fv": ICE, IC, EC, ECE,
# EN, RJ) and regional rail ("rv": RE, RB, S-Bahn, the private railways,
# the neighbours' trains over the border), every train already split by the
# railway that runs each part ("ICE 78": NS to Arnhem, then DB). Neither
# carries train numbers, so each trip takes its number from DELFI's own
# GTFS of the same timetable (opendata-oepnv.de, CC BY 4.0: its public
# sharing link for the dataset; 515 MB, weekly), whose trips are found by
# the stations and minutes they call at. Without it the trains run
# unnumbered.
UA = "Trainsheet/1.0 (+https://trainsheet.com)"
GTFSDE = {"fv": "https://download.gtfs.de/germany/fv_free/latest.zip",
          "rv": "https://download.gtfs.de/germany/rv_free/latest.zip"}
DELFI_GTFS = ("https://www.opendata-oepnv.de/ht/de/datensaetze/sharing?tx_vrrkit_view%5Bsharing%5D="
              "eyJkYXRhc2V0IjoiZGV1dHNjaGxhbmR3ZWl0ZS1zb2xsZmFocnBsYW5kYXRlbi1ndGZzIn0")
TIMETABLE = "germany:gtfs.de+delfi"  # the url every railroad's GTFS entry names (it's gathered: "make")
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent


def _get(url, timeout=600, attempts=3):
    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read()
        except Exception as err:
            if attempt == attempts - 1:
                raise
            print(f"  germany: {url[:60]}: retry {attempt + 1} ({err})", flush=True)
            time.sleep(15)


def _rows(zf, name):
    if name not in zf.namelist():
        return
    with zf.open(name) as f:
        yield from csv.DictReader(io.TextIOWrapper(f, "utf-8-sig"))


def _min(t):
    h, m, *_ = t.split(":")
    return int(h) * 60 + int(m)


# ---------- Stations ----------
# gtfs.de groups its stops under the local networks' stations ("Aachen, Hbf",
# "Altenstadt Bahnhof", which holds both Altenstadt (Hess) and Altenstadt
# (Iller)); the stops themselves carry DB's own names ("Aachen Hbf",
# "Ahlen(Westf)"). A station here is a DB name: a stop's own where it is one,
# else its group's (the DB name most used there). DB's names, written as on
# the station signs: a space before a bracket ("Ahlen (Westf)", "Frankfurt
# (Main) Hbf"), and the S-Bahn halves of the big stations ("Hamburg-
# Altona(S)") as the station. Border points ("Aachen Süd(Gr)") aren't stops.
NOT_DB = re.compile(r",|\bGl\.|\bRi\.|\(FlixTrain\)|Bahnhof|\bBhf\b|\(Bus\)|\(Zug\)|Hauptbahnhof|Bushaltestelle|Central Station|"
                    r"Autoverladung|\bHP\b|/ZOB|Busbf|\bZOB\b|Parkeisenbahn")
BORDER = re.compile(r"\((Gr|fr)\)$")
# Names DB shortens (its timetables allow 30 letters) or spells without
# accents abroad, as the stations sign them.
NAMES = {
    "Frankfurt(M) Flughafen Fernbf": "Frankfurt (Main) Flughafen Fernbahnhof",
    "Frankfurt(M) Flughafen Regionalbf": "Frankfurt (Main) Flughafen Regionalbahnhof",
    "Frankfurt(Main)Hbf": "Frankfurt (Main) Hbf", "Frankfurt(Main)Süd": "Frankfurt (Main) Süd", "Frankfurt(Main)West": "Frankfurt (Main) West",
    "Frankfurt(Main)Ost": "Frankfurt (Main) Ost", "Frankfurt(Oder)": "Frankfurt (Oder)",
    "Berlin Gesundbrunnen": "Berlin Gesundbrunnen", "Hamburg-Altona(S)": "Hamburg-Altona", "Hamburg-Harburg(S)": "Hamburg-Harburg",
    "Hamburg Hbf(S)": "Hamburg Hbf", "Bad Münster a Stein": "Bad Münster am Stein",
    "Koebenhavn H": "København H", "Koebenhavns Lufthavn st": "Københavns Lufthavn", "Padborg st": "Padborg", "Tinglev st": "Tinglev",
    "Fredericia st": "Fredericia", "Kolding st": "Kolding", "Tønder st": "Tønder", "Toender st": "Tønder",
    "Decin hl.n.": "Děčín hl.n.", "Decin-Prostredni Zleb": "Děčín-Prostřední Žleb", "Usti nad Labem hl.n.": "Ústí nad Labem hl.n.",
    "Praha hl.n.": "Praha hl.n.", "Cheb": "Cheb", "As": "Aš", "As(CZ)": "Aš", "Plzen hl.n.": "Plzeň hl.n.", "Domazlice": "Domažlice",
    "Ceska Kubice": "Česká Kubice", "Zelezna Ruda-Alzbetin": "Železná Ruda-Alžbětín", "Rumburk": "Rumburk",
    "Dolni Poustevna": "Dolní Poustevna", "Varnsdorf": "Varnsdorf", "Hradek nad Nisou": "Hrádek nad Nisou", "Liberec": "Liberec",
    "Chomutov": "Chomutov", "Vejprty": "Vejprty", "Karlovy Vary dolni n.": "Karlovy Vary dolní n.", "Johanngeorgenstadt": "Johanngeorgenstadt",
    "Potucky": "Potůčky", "Kraslice": "Kraslice", "Sokolov": "Sokolov", "Klatovy": "Klatovy",
    "Szczecin Glowny": "Szczecin Główny", "Rzepin": "Rzepin", "Kostrzyn": "Kostrzyn", "Slubice": "Słubice", "Zgorzelec": "Zgorzelec",
    "Wegliniec": "Węgliniec", "Zielona Gora Glowna": "Zielona Góra Główna", "Gubin": "Gubin", "Tuplice": "Tuplice", "Zary": "Żary",
    "Lubsko": "Lubsko", "Forst(Lausitz)": "Forst (Lausitz)",
    "Strasbourg": "Strasbourg", "Wissembourg": "Wissembourg", "Lauterbourg": "Lauterbourg", "Forbach(F)": "Forbach",
    "Mulhouse Ville": "Mulhouse", "Metz Ville": "Metz", "Sarreguemines": "Sarreguemines",
    "Salzburg Hbf": "Salzburg Hbf", "Kufstein": "Kufstein", "Wörgl Hbf": "Wörgl Hbf", "Linz/Donau Hbf": "Linz Hbf",
    "Bregenz": "Bregenz", "Lindau-Insel": "Lindau-Insel", "Lindau-Reutin": "Lindau-Reutin",
    "Basel SBB": "Basel SBB", "Basel Bad Bf": "Basel Bad Bf", "Schaffhausen": "Schaffhausen", "Zürich HB": "Zürich HB",
    "Bruxelles Midi": "Bruxelles-Midi", "Roedekro st": "Rødekro", "Usti nad Labem-Strekov": "Ústí nad Labem-Střekov",
    "Dolni Zleb": "Dolní Žleb", "Dolní Zleb": "Dolní Žleb", "Mikulasovice dolni nadrazi": "Mikulášovice dolní nádraží",
    # The Harz narrow gauge's own stops, filed as town and stop.
    "Schierke Brocken": "Brocken", "Wernigerode Wernigerode": "Wernigerode", "Wernigerode Drei Annen Hohne": "Drei Annen Hohne", "Liège-Guillemins": "Liège-Guillemins", "Welkenraedt": "Welkenraedt",
}


# DB's short forms in its names ("Plauen(Vogtl) ob Bf", "St Wendel").
SHORT = [(re.compile(r"\bob Bf$"), "oberer Bahnhof"), (re.compile(r"\bunt Bf$"), "unterer Bahnhof"),
         (re.compile(r"\bSt (?=[A-ZÄÖÜ])"), "St. "), (re.compile(r"^Iserl\. "), "Iserlohn-"),
         (re.compile(r"\bGleis \d+$|\s*\(SEV\)$"), "")]


def db_name(name):
    """A DB stop name as the station signs it: "Ahlen(Westf)" -> "Ahlen
    (Westf)", "Frankfurt(Main)Hbf" -> "Frankfurt (Main) Hbf"."""
    name = re.sub(r"\s+", " ", name.strip())
    if name in NAMES:
        return NAMES[name]
    name = re.sub(r"\s*\(S\)$", "", name)
    for pat, to in SHORT:
        name = pat.sub(to, name).strip()
    name = re.sub(r"(?<=\S)\(", " (", name)
    name = re.sub(r"\)(?=\S)", ") ", name)
    return NAMES.get(name, name)


def plain_name(name):
    """A local network's station name, when no DB name is to be had:
    "Aalen, Hauptbahnhof" -> "Aalen Hbf", "Achern Bahnhof" -> "Achern"."""
    name = re.sub(r"\s*\((Zug|Bus|S)\)$", "", name.strip())
    name = re.sub(r",?\s*(Bahnhof|Bf|Bhf)(\s*/.*)?$", "", name)
    name = re.sub(r",?\s*Hauptbahnhof$", " Hbf", name)
    name = re.sub(r"^Bahnhof\s+", "", name)
    return re.sub(r",\s*", " ", name).strip() or name


def _slug(name):
    s = unicodedata.normalize("NFKD", name.lower()).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


# DB's station numbers (EVA, "8000105" Frankfurt (Main) Hbf) and the state or
# country of each station, by its name here: germany_stations.json, made by
# hand from DELFI's stops (their ids name the state: "de:06412:..." is
# Hessen) and Wikidata's IBNR numbers (CC0), and kept in the repository so a
# station's id never depends on a download. {name: [eva or "", region]}:
# region "DE-SH".."DE-TH" for a German state, else the country ("AT", "CH",
# ...).
STATIONS = json.loads((HERE / "germany_stations.json").read_text()) if (HERE / "germany_stations.json").exists() else {}
NORTH_EAST = {"DE-" + s for s in ("SH", "HH", "NI", "HB", "MV", "BB", "BE", "ST", "SN", "TH")}
SOUTH_WEST = {"DE-" + s for s in ("NW", "HE", "RP", "SL", "BW", "BY")}


def read_gtfsde(kind, data):
    """One gtfs.de feed, its ids prefixed with its kind ("fv", "rv")."""
    zf = zipfile.ZipFile(io.BytesIO(data))
    p = kind[0]
    agencies = {p + a["agency_id"]: a["agency_name"].strip() for a in _rows(zf, "agency.txt")}
    routes = {p + r["route_id"]: {"agency": p + r["agency_id"], "line": r["route_short_name"].strip(), "kind": kind}
              for r in _rows(zf, "routes.txt")}
    trips = {p + t["trip_id"]: {"route": p + t["route_id"], "service": p + t["service_id"], "id": t["trip_id"]} for t in _rows(zf, "trips.txt")}
    stops = {p + s["stop_id"]: s for s in _rows(zf, "stops.txt")}
    for s in stops.values():
        if s.get("parent_station"):
            s["parent_station"] = p + s["parent_station"]
    times = defaultdict(list)
    with zf.open("stop_times.txt") as f:
        r = csv.reader(io.TextIOWrapper(f, "utf-8-sig"))
        head = next(r)
        i = {c: n for n, c in enumerate(head)}
        a, d, s, q = i["arrival_time"], i["departure_time"], i["stop_id"], i["stop_sequence"]
        pu, do = i.get("pickup_type"), i.get("drop_off_type")
        for x in r:
            times[p + x[0]].append((int(x[q]), p + x[s], x[a] or x[d], x[d] or x[a],
                                    x[pu] if pu is not None else "", x[do] if do is not None else ""))
    calendar = [{**c, "service_id": p + c["service_id"]} for c in _rows(zf, "calendar.txt")]
    dates = [{**c, "service_id": p + c["service_id"]} for c in _rows(zf, "calendar_dates.txt")]
    return agencies, routes, trips, stops, times, calendar, dates


def stations_of(stops, used):
    """{stop id: station key} and {station key: [name, lat, lon]} for the stops
    trains use: see above. A station key is its name (with a number after it
    for a second place of one name, 3 km or more from the first)."""
    kids = defaultdict(Counter)  # group -> Counter of DB names used there
    for sid, n in used.items():
        s = stops[sid]
        if not NOT_DB.search(s["stop_name"]):
            kids[s.get("parent_station") or sid][s["stop_name"].strip()] += n
    named, places, unnamed = {}, defaultdict(list), []
    for sid in used:
        s = stops[sid]
        group = s.get("parent_station") or sid
        raw = s["stop_name"].strip()
        if BORDER.search(raw):
            continue
        if NOT_DB.search(raw):
            raw = kids[group].most_common(1)[0][0] if kids[group] else None
            name = db_name(raw) if raw else None
        else:
            name = db_name(raw)
        g = stops.get(group) or s
        lat, lon = float(s["stop_lat"] or g["stop_lat"]), float(s["stop_lon"] or g["stop_lon"])
        if name:
            named[sid] = name
            places[name].append((lat, lon, used[sid]))
        else:
            unnamed.append((sid, lat, lon, plain_name(g["stop_name"])))
    # A stop with no DB name in its group (FlixTrain's own, "Hamburg Central
    # Station (FlixTrain)"): the DB station within 400 m, else its own name.
    grid = defaultdict(list)
    for name, pts in places.items():
        for lat, lon, _ in pts:
            grid[(round(lat * 100), round(lon * 100))].append((lat, lon, name))
    for sid, lat, lon, plain in unnamed:
        y, x = round(lat * 100), round(lon * 100)
        near = [(_km(lat, lon, a, b), n) for dy in (-1, 0, 1) for dx in (-1, 0, 1) for a, b, n in grid.get((y + dy, x + dx), ())]
        d, name = min(near, default=(9, None))
        name = name if d < 0.4 else re.sub(r"\s*\(FlixTrain\)$", "", plain)
        named[sid] = name
        places[name].append((lat, lon, used[sid]))
    # One name, two places (Altenstadt (Hess) and (Iller) under one group
    # once a DB name is missing): each place apart takes its own key.
    out_stop, out_station = {}, {}
    clusters = {}
    for name, pts in places.items():
        groups = []
        for lat, lon, n in sorted(pts, key=lambda p: -p[2]):
            for g in groups:
                if _km(lat, lon, g[0], g[1]) < 3:
                    g[2].append((lat, lon, n))
                    break
            else:
                groups.append((lat, lon, [(lat, lon, n)]))
        clusters[name] = groups
        for k, (lat0, lon0, members) in enumerate(groups):
            key = name if k == 0 else f"{name} #{k + 1}"
            w = sum(m[2] for m in members)
            out_station[key] = [name, round(sum(m[0] * m[2] for m in members) / w, 6), round(sum(m[1] * m[2] for m in members) / w, 6)]
    for sid, name in named.items():
        s = stops[sid]
        g = stops.get(s.get("parent_station")) or s
        lat, lon = float(s["stop_lat"] or g["stop_lat"]), float(s["stop_lon"] or g["stop_lon"])
        groups = clusters[name]
        k = min(range(len(groups)), key=lambda k: _km(lat, lon, groups[k][0], groups[k][1]))
        out_stop[sid] = name if k == 0 else f"{name} #{k + 1}"
    return out_stop, out_station


def _km(lat1, lon1, lat2, lon2):
    x = math.radians(lon2 - lon1) * math.cos(math.radians((lat1 + lat2) / 2))
    return 6371 * math.hypot(x, math.radians(lat2 - lat1))


# ---------- Which railroad ----------
# By the railway gtfs.de files each part of a train under, and its line.
# Leaving out: tram-trains and trams (AVG's and KVV's Stadtbahn, Kassel's
# RegioTram, Chemnitz's Citylink lines, the VBK), car shuttles (Sylt),
# heritage, museum and park railways, and the replacement buses some files
# list as trains.
LEFT_OUT = re.compile(r"Albtal-Verkehrs|^KVV$|Karlsruher Verkehrsverbund|Tram VBK|^KVG|MittelSachsen|Chemnitzer Modell|Saarbahn|Dampf|Museum|Parkeisenbahn|"
                      r"Nebenbahn Gaildorf|Kandertalbahn|Kasbachtalbahn|Brohltalbahn|Ulmer Eisenbahnfreunde|Öchsle|Wanderbahn|"
                      r"Rhön-Zügle|Mainschleifenbahn|Ilztalbahn|Chiemsee|Waldeisenbahn Muskau|Kuckucksb|Kleinbahn des Kreises|"
                      r"Selfkantbahn|Mansfelder Bergwerksbahn|Dessau|Cargo Logistik|BayernBahn|AUTOZUG|Sonstige Eisenbahnen|"
                      r"Bus SEV|Regionalbuslinien|Gesellschaft zur Förderung|^csscss$|Traditionsverein|Montafoner|Schwäbische Alb-Bahn|"
                      r"Regionale ö\. Bahn|Nichtbundeseigene", re.I)
# The private railways: south and west (deprivat2), else north and east
# (deprivat; Nordrhein-Westfalen's too, to share them out evenly).
PRIVATE_SOUTH = re.compile(r"Hessische Landesbahn|^VIAS|vlexx|MittelrheinBahn|Trans Regio|Daadetalbahn|Westerwald|Südwestdeutsche|SWEG|"
                           r"Arverio|Go-Ahead|agilis|Bayerische Regiobahn|Bayerische Regionalbahn|Bayerische Oberlandbahn|waldbahn|oberpfalzbahn|^alex|"
                           r"Bodensee-Oberschwaben|Verkehrsverbund Stuttgart|NE-Zug|WEG|Bayerische Zugspitzbahn|Nebenbahn Vaihingen|"
                           r"Hohenzollerische|HzL|Rhenus Veniro", re.I)
PRIVATE_NORTH = re.compile(r"metronom|erixx|enno|EVB|ELBE-WESER|NordWestBahn|Nordbahn|AKN|Hanseatische|Norddeutsche Eisenbahn|"
                           r"Bentheimer|Ostdeutsche Eisenbahn|ODEG|NEB|Niederbarnimer|Erfurter Bahn|Süd-Thüringen-Bahn|Abellio|"
                           r"Mitteldeutsche Regiobahn|cantus|vogtlandbahn|trilex|City-Bahn Chemnitz|Freiberger|Pressnitztalbahn|TRI Train|"
                           r"eurobahn|National Express|WestfalenBahn|RheinRuhrBahn|Rurtalbahn|REGIOBAHN|Harzer Schmalspur|Molli|Bäderbahn|"
                           r"SDG|Sächsisch-Oberlausitzer|DB-Nahverkehr|Länderbahn|Nahreisezug|Usedomer|Rügensche|Borkumer|Wangerooge|"
                           r"Inselbahn|Sylt|Verkehrsverbund Oberelbe", re.I)
DB_REGIO = re.compile(r"DB Regio|DB RegioNetz|SÜWEX|Gesamtnetz der deutschen Bahn", re.I)
DB_REGIO_NORTH = re.compile(r"Nord\b|Nordost|Südost\b|Erzgebirgsbahn|Oberweisbacher", re.I)
FOREIGN_LONG = {"EC", "ECE", "EN", "NJ", "RJ", "RJX", "TGV", "THA", "ICE", "IC", "EST", "ES", "FLX", "DRF", "ECM", "TGD", "OTC", "D", "EX"}
# DB Fernverkehr's own lines that other railways' trains run (deld): the
# ECs and ECEs with ČD's, ÖBB's, PKP's and SBB's sets, the EuroCity-Express
# of SBB (München-Lindau-Zürich, Frankfurt-Basel-Milano) and DSB's ECEs
# Hamburg-Padborg-København (ECE 75, numbers 392-397: DSB's Talgo 230 sets
# since May 2026).
DB_LINES_FOREIGN = {"EC 62", "EC 85", "EC 90", "EC 95", "EC 96", "EC 97", "ECE 20", "ECE 75", "ECE 85", "ECE 88",
                    "27", "27N", "62", "89", "90", "12N"}
LEFT_OUT_LINES = {("DB Fernverkehr AG", "10"), ("DB Fernverkehr AG", "ECM")}  # the Sylt car shuttle; Chiasso-Milano


def category(line):
    """("RE", "1") from "RE1", ("ICE", "10") from "ICE 10", ("S", "41") from "S41"."""
    m = re.match(r"^([A-Za-zÄÖÜäöü]+)\s*(\S.*)?$", line.strip())
    return (m[1], (m[2] or "").strip()) if m else ("", line.strip())


def line_name(kind, line, agency_name):
    """The line as the trains are sold: "RE 1", "S 41", "MEX 12", "FLX 10";
    long-distance trains by category alone ("ICE", "IC", "EC")."""
    if not re.search(r"\d", line) and len(line) > 4:  # a railway's name ("Weißeritztalbahn")
        return line
    cat, num = category(line)
    if kind == "fv" or cat in ("ICE", "IC", "EC", "ECE", "EN", "NJ", "RJ", "RJX"):
        return cat or line
    if cat == "THA":
        return "Eurostar"
    if cat == "DRF" or cat == "DRB":
        return {"European Sleeper": "European Sleeper", "WESTbahn": "WESTbahn", "LEO Express": "LEO Express",
                "Nachtzug": "Alpen-Sylt Nachtexpress", "BahnTouristikExpress": "EN"}.get(agency_name, cat)
    if not cat and num.isdigit() and agency_name.startswith("DB Fernverkehr"):
        return "EC"
    if not cat and num.isdigit() and agency_name == "ÖBB":  # ÖBB's lines into Bavaria and Lindau: its S-Bahns' (Vorarlberg's S 1, Salzburg's S 2, S 3, Tirol's S 6) and Upper Austria's R lines
        return f"S {num}" if len(num) == 1 else f"R {num}"
    if cat == "CD":  # ZVON's numbers for ČD's lines (the timetable's tables): its stopping trains
        return "Os"
    if cat in ("HSB", "MBB", "HBX", "SAB", "WIP", "TER", "TGD", "R", "REX", "Os", "Sp", "RR", "U", "P", "PE"):
        return {"HSB": "Harzer Schmalspurbahnen", "MBB": "Molli", "TGD": "TGV"}.get(cat, f"{cat} {num}".strip())
    return f"{cat} {num}".strip() if cat else line


def railroad(agency_name, line, kind, region):
    """The map's railroad for one part of a train, or None to leave it out.
    region: the state ("DE-NW") most of its German stations are in."""
    if LEFT_OUT.search(agency_name) or (agency_name, line) in LEFT_OUT_LINES or line.startswith("SEV"):
        return None
    cat, num = category(line)
    if agency_name in ("DB Fernverkehr AG", "DB Fernverkehr (Codesharing)"):
        if line in DB_LINES_FOREIGN or cat in ("EN", "NJ") or line.endswith("N"):
            return "deld"
        return "dbfv"
    if kind == "fv":
        return "deld"
    s_line = cat in ("S", "RS") and (num[:1].isdigit() or not num)
    if re.match(r"S[- ]Bahn|DB Regio AG S-Bahn", agency_name):
        return "sbahn" if cat in ("S", "") or s_line else "dbregio2" if "Stuttgart" in agency_name or "München" in agency_name or \
            "Rhein-Main" in agency_name else "dbregio"
    if DB_REGIO.search(agency_name):
        if s_line and cat == "S":
            return "sbahn"
        if region in NORTH_EAST:
            return "dbregio"
        if region in SOUTH_WEST:
            return "dbregio2"
        return "dbregio" if DB_REGIO_NORTH.search(agency_name) else "dbregio2"
    if re.search(r"Flix|European Sleeper|EUROSTAR|^WESTbahn$|LEO Express|^Nachtzug|BahnTouristik", agency_name, re.I) or re.fullmatch(r"\d+N", line):
        return "deld"
    if s_line and re.search(r"NordWestBahn|REGIOBAHN|RheinRuhrBahn|Südwestdeutsche|SWEG|Länderbahn|Nahreisezug|Bayerische Region",
                            agency_name, re.I):
        return "sbahn"
    if PRIVATE_SOUTH.search(agency_name):
        return "deprivat2"
    if PRIVATE_NORTH.search(agency_name):
        return "deprivat"
    # The neighbours' railways (ÖBB, SBB, Thurbo, ČD, SNCF, SNCB, CFL, DSB,
    # PKP, NS, Trenitalia, MÁV, ZSSK, HŽPP).
    if cat in FOREIGN_LONG:
        return "deld"
    return "deintl"


# ---------- Train numbers, from DELFI's GTFS ----------
RAIL_TYPES = {"2"} | {str(n) for n in range(100, 118)}


def delfi_numbers(data):
    """DELFI's rail trips as (events, trips): events {(lat cell, lon cell,
    minute): {trip}} at every stop's arrival and departure (cells of 1/200
    degree, a station's own place), trips {trip: (number, agency name,
    line)}. Read line by line: 3.5 GB of stop times, of which only the rail
    trips' are split."""
    zf = zipfile.ZipFile(io.BytesIO(data))
    agencies = {a["agency_id"]: a["agency_name"] for a in _rows(zf, "agency.txt")}
    routes = {r["route_id"]: r for r in _rows(zf, "routes.txt") if r["route_type"] in RAIL_TYPES}
    trips = {}
    for t in _rows(zf, "trips.txt"):
        r = routes.get(t["route_id"])
        if r:
            trips[t["trip_id"]] = ((t.get("trip_short_name") or "").strip().lstrip("0"), agencies.get(r["agency_id"], ""),
                                   r["route_short_name"].strip())
    places = {}
    stops = {s["stop_id"]: s for s in _rows(zf, "stops.txt")}
    for sid, s in stops.items():
        p = stops.get(s.get("parent_station")) or s
        try:
            places[sid] = (round(float(p["stop_lat"]) * 200), round(float(p["stop_lon"]) * 200))
        except ValueError:
            pass
    events = defaultdict(set)
    keep = {k.encode() for k in trips}
    with zf.open("stop_times.txt") as f:
        head = f.readline().decode("utf-8-sig").strip().replace('"', "").split(",")
        i = {c: n for n, c in enumerate(head)}
        for line in f:
            tid = line.split(b",", 1)[0].strip(b'"')
            if tid in keep:
                x = [v.strip('"') for v in line.decode("utf-8").rstrip("\r\n").split(",")]
                p = places.get(x[i["stop_id"]])
                if p:
                    for t in {x[i["arrival_time"]], x[i["departure_time"]]} - {""}:
                        events[(*p, _min(t))].add(x[0])
    return events, trips


def number_of(seq, places, agency_name, line, events, dtrips):
    """A trip's number: that of DELFI's trip calling at most of its stations
    at its minutes (all of them, or most), ties going to the one of its
    railway and line."""
    votes = Counter()
    for st, arr, dep, *_ in seq:
        y, x = places[st]
        hit = set()
        for t in {arr, dep}:
            m = _min(t)
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    hit |= events.get((y + dy, x + dx, m), set())
        votes.update(hit)
    if not votes:
        return None
    best = max(votes.values())
    if best < max(2, 0.6 * len(seq)):
        return None
    tied = [dtrips[k] for k, v in votes.items() if v == best and dtrips[k][0]]
    if not tied:
        return None
    cat, num = category(line)
    norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
    tied.sort(key=lambda d: (norm(d[1]) != norm(agency_name), norm(d[2]) not in (norm(line), norm(num)), d[0]))
    return tied[0][0]


# ---------- Clipping and the neighbours' trains ----------
# A train is kept in Germany and as far as 30 km beyond its border, at each
# end (Salzburg, Kufstein, Děčín, Szczecin, Rzepin, Padborg, Strasbourg), and
# all the way between; never the parts of it another plug-in's railroads
# already show (their timetables, data/schedules/<railroad>.json: NS's ICEs
# as far as Köln/Bonn, SNCB's to Aachen, the Swiss railways' to Freiburg,
# Singen and Lindau, France's TGVs and ICEs through to München and Berlin,
# CFL's to Trier, ČD's and Snälltåget's...), found by their stations and
# minutes: what's left of it is drawn here, and a train they show all of
# isn't.
REACH_KM = 30
GERMAN = NORTH_EAST | SOUTH_WEST | {"DE"}
OURS = set(AGENCIES)


def neighbour_events(root=ROOT):
    """The other plug-ins' trains near Germany, as {(lat cell, lon cell,
    minute): {(railroad, run index)}} (cells of 1/100 degree)."""
    events, n = defaultdict(set), 0
    for path in sorted((root / "data" / "schedules").glob("*.json")):
        a = path.stem
        if a in OURS:
            continue
        try:
            tt = json.loads(path.read_text())
        except (OSError, ValueError):
            continue
        st = tt.get("stops") or {}
        near = {k for k, v in st.items() if isinstance(v, list) and len(v) >= 3 and 46.8 <= v[1] <= 55.6 and 5.0 <= v[2] <= 15.9}
        if not near:
            continue
        for runs in (tt.get("trips") or {}).values():
            for run in runs:
                pat = run[2] if len(run) > 2 else []
                if not any(s[0] in near for s in pat):
                    continue
                n += 1
                for sid, arr, dep in (s[:3] for s in pat):
                    if sid in near:
                        c = (round(st[sid][1] * 100), round(st[sid][2] * 100))
                        for m in {arr, dep}:
                            events[(*c, m)].add(n)
    return events


def clip(seq, region_of, abroad, pos):
    """The stops of a run kept for the map (see above), or [] if none.
    abroad(station): how far it is from Germany (from its nearest German
    station), in km; past the first station abroad, the way from it adds up
    (and no stop more than 60 km from the last: Aarau isn't kept for being
    near Waldshut when the train comes from Freiburg)."""
    home = [i for i, s in enumerate(seq) if region_of(s[0]) in GERMAN]
    if not home:
        return []

    def reach(i, step):
        out = i
        way = None
        while 0 <= out + step < len(seq):
            k = seq[out + step][0]
            hop = _km(*pos(seq[out][0]), *pos(k))
            way = abroad(k) if way is None else way + hop
            if way > REACH_KM or hop > 2 * REACH_KM:
                break
            out += step
        return out
    return seq[reach(home[0], -1):reach(home[-1], 1) + 1]


def unshown(seq, pos, theirs):
    """The part of a run no other plug-in's train shows: a train of theirs
    is one calling at two of its stations in a row (within a kilometre) at
    the same minutes. The stretch they share is cut, leaving its ends; of
    what's left on either side, the longer."""
    def hits(i):
        st, arr, dep = seq[i][:3]
        y, x = (round(c * 100) for c in pos(st))
        out = set()
        for t in {arr, dep}:
            m = _min(t)
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    out |= theirs.get((y + dy, x + dx, m), set())
        return out
    h = [hits(i) for i in range(len(seq))]
    shared = [i for i in range(len(seq)) if (i + 1 < len(seq) and h[i] & h[i + 1]) or (i > 0 and h[i] & h[i - 1])]
    if not shared:
        return seq
    a, b = shared[0], shared[-1]
    before, after = seq[:a + 1], seq[b:]
    keep = before if len(before) >= len(after) else after
    return keep if len(keep) >= 2 else []


# ---------- The map's timetable ----------
CATEGORY_COLORS = {**{c: "ec0016" for c in ("ICE", "IC", "EC", "ECE", "EN", "NJ", "RJ", "RJX", "TGV")}, "RE": "a8102e",
                   "IRE": "a8102e", "MEX": "a8102e", "FEX": "a8102e", "RB": "1455c0", "S": "408335", "RS": "408335",
                   "FLX": "73d700", "Eurostar": "8a1538", "European Sleeper": "1d3c6e"}


def _services(calendar, dates, window):
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    runs = defaultdict(set)
    for c in calendar:
        a, b = (datetime.datetime.strptime(c[k], "%Y%m%d").date() for k in ("start_date", "end_date"))
        for d in window:
            if a <= d <= b and c[days[d.weekday()]] == "1":
                runs[c["service_id"]].add(d)
    for c in dates:
        d = datetime.datetime.strptime(c["date"], "%Y%m%d").date()
        (runs[c["service_id"]].add if c["exception_type"] == "1" else runs[c["service_id"]].discard)(d)
    return runs


def build(feeds, delfi=None, root=ROOT, today=None, log=print):
    """The map's GTFS (zip bytes) from gtfs.de's feeds ({kind: bytes}) and
    DELFI's GTFS (bytes, or None)."""
    today = today or datetime.date.today()
    window = [today - datetime.timedelta(1) + datetime.timedelta(d) for d in range(40)]
    agencies, routes, trips, stops, times, calendar, dates = {}, {}, {}, {}, {}, [], []
    for kind, data in feeds.items():
        a, r, t, s, tm, c, d = read_gtfsde(kind, data)
        agencies.update(a), routes.update(r), trips.update(t), stops.update(s), times.update(tm)
        calendar += c
        dates += d
    runs = _services(calendar, dates, window)
    # Each trip's stops: no passing points (no one gets on or off), no border points.
    seqs = {}
    for tid, t in trips.items():
        if not runs.get(t["service"]):
            continue
        seq = [x for x in sorted(times.get(tid, ())) if not (x[4] == "1" and x[5] == "1")
               and not BORDER.search(stops[x[1]]["stop_name"].strip())]
        if len(seq) >= 2:
            seqs[tid] = seq
    used = Counter(x[1] for seq in seqs.values() for x in seq)
    stop_station, stations = stations_of(stops, used)
    # Each station's region (state or country): germany_stations.json's, else
    # the nearest station's that has one.
    known = [(v[1], v[2], STATIONS[k][1]) for k, v in stations.items() if STATIONS.get(k, ["", ""])[1]]
    grid = defaultdict(list)
    for lat, lon, reg in known:
        grid[(round(lat * 10), round(lon * 10))].append((lat, lon, reg))
    region = {}
    for k, (name, lat, lon) in stations.items():
        reg = STATIONS.get(k, ["", ""])[1]
        if not reg:  # a station new since the table was made: its neighbour's within 3 km, else none (not German)
            y, x = round(lat * 10), round(lon * 10)
            near = [(_km(lat, lon, a, b), r) for dy in (-1, 0, 1) for dx in (-1, 0, 1) for a, b, r in grid.get((y + dy, x + dx), ())]
            d, reg = min(near, default=(9, ""))
            reg = reg if d < 3 else ""
        region[k] = reg
    # Berlin's S-Bahn stations, filed under VBB's names ("S Beusselstr.",
    # "S+U Frankfurter Allee"), as DB names them: "Berlin Beusselstraße",
    # "Berlin Frankfurter Allee"; "Teltow Stadt" outside the city.
    for k, v in stations.items():
        m = re.match(r"^(S\+U|S|U) (.+)$", v[0])
        if m:
            name = re.sub(r"str\.", "straße", re.sub(r"Str\.", "Straße", m[2]))
            v[0] = name if region[k] != "DE-BE" or name.startswith("Berlin") else "Berlin " + name
    pos = lambda k: (stations[k][1], stations[k][2])
    # Runs as stations (a stop listed twice in a row is one: its first arrival, its last departure).
    out_trips = []
    for tid, seq in seqs.items():
        t = trips[tid]
        r = routes[t["route"]]
        an = agencies[r["agency"]]
        st = []
        for _, sid, arr, dep, pick, drop in seq:
            k = stop_station.get(sid)
            if not k:
                continue
            if st and st[-1][0] == k:
                st[-1] = (k, st[-1][1], dep, st[-1][3], drop)
            else:
                st.append((k, arr, dep, pick, drop))
        if len(st) < 2:
            continue
        regs = Counter(region[k] for k, *_ in st if region[k] in GERMAN)
        ours = railroad(an, r["line"], r["kind"], (regs.most_common(1) or [("", 0)])[0][0])
        if not ours:
            continue
        out_trips.append({"tid": tid, "agency": ours, "agency_name": an, "line": r["line"], "kind": r["kind"],
                          "service": t["service"], "seq": st})
    log(f"  germany: {len(out_trips)} trips of {len(trips)} kept by railway")
    # Numbers, from DELFI's timetable.
    if delfi:
        events, dtrips = delfi
        places = {k: (round(v[1] * 200), round(v[2] * 200)) for k, v in stations.items()}
        found = 0
        for t in out_trips:
            t["number"] = number_of(t["seq"], places, t["agency_name"], t["line"], events, dtrips)
            found += bool(t["number"])
        log(f"  germany: {found} of {len(out_trips)} trips numbered from DELFI's timetable")
    # Kept within reach of Germany: how far each station abroad is from its nearest German one.
    home = defaultdict(list)
    for k, (name, lat, lon) in stations.items():
        if region[k] in GERMAN:
            home[(round(lat * 2), round(lon * 2))].append((lat, lon))
    far = {}
    for k, (name, lat, lon) in stations.items():
        if region[k] in GERMAN:
            far[k] = 0
            continue
        y, x = round(lat * 2), round(lon * 2)
        far[k] = min((_km(lat, lon, a, b) for dy in (-1, 0, 1) for dx in (-1, 0, 1) for a, b in home.get((y + dy, x + dx), ())), default=999)
    kept = []
    for t in out_trips:
        t["seq"] = clip(t["seq"], region.get, far.get, pos)
        if len(t["seq"]) >= 2:
            kept.append(t)
    log(f"  germany: {len(kept)} trips call in Germany")
    # A trip the timetable lists twice (DB's long-distance trains again as
    # regional ones, "Codesharing"; a train in two railways' files): the one
    # whose every stop and minute, on every day it runs, another trip has
    # is left out (the long-distance file's, then the longer, kept).
    rank = lambda t: (t["kind"] != "fv", "Codesharing" in t["agency_name"], -len(t["seq"]), t["tid"])
    kept.sort(key=rank)
    ev = defaultdict(list)
    dropped = 0
    out = []
    for t in kept:
        mine = [(k, _min(a), _min(d)) for k, a, d, *_ in t["seq"]]
        days = runs[t["service"]]
        cands = None
        for k, a, d in mine:
            c = {id(o) for o in ev.get((k, a, d), ())}
            cands = c if cands is None else cands & c
            if not cands:
                break
        if cands and any(days <= runs[o["service"]] for o in ev[(mine[0])] if id(o) in cands):
            dropped += 1
            continue
        for e in mine:
            ev[e].append(t)
        out.append(t)
    log(f"  germany: {dropped} trips listed twice left out")
    # What the neighbours' plug-ins show.
    theirs = neighbour_events(root)
    final, cut, gone = [], 0, 0
    for t in out:
        seq = unshown(t["seq"], pos, theirs)
        if not seq:
            gone += 1
            continue
        cut += len(seq) < len(t["seq"])
        t["seq"] = seq
        if any(region[k] in GERMAN for k, *_ in seq):
            final.append(t)
        else:
            gone += 1
    log(f"  germany: {gone} trips other plug-ins show whole left out, {cut} cut where they show them")
    return write_gtfs(final, stations, runs, calendar, dates, log)


def station_id(key):
    eva = STATIONS.get(key, [""])[0]
    return eva or "de-" + _slug(key)


def write_gtfs(trips, stations, runs, calendar, dates, log=print):
    # Numbers: a train's own, the page showing what's before any "~". Each
    # trip of a railroad's number takes the first slot ("2045", then
    # "2045~1") no trip of that number running on one of its days holds; a
    # trip with no number is "~1", "~2"... (shown with none).
    slots = defaultdict(list)
    for t in sorted(trips, key=lambda t: (t["seq"][0][2], t["tid"])):
        n = t.get("number") or ""
        held, mine = slots[(t["agency"], n)], runs[t["service"]]
        k = next((i for i, d in enumerate(held) if not d & mine), len(held))
        if k == len(held):
            held.append(set())
        held[k] |= mine
        t["short"] = n + (f"~{k}" if k or not n else "") if n else f"~{k + 1}"
    used = {k for t in trips for k, *_ in t["seq"]}
    ids = {k: station_id(k) for k in used}
    clash = Counter(ids.values())
    for k in used:  # one number, two stations (a number of DB's kept for one): the second by its name
        if clash[ids[k]] > 1 and STATIONS.get(k, [""])[0] and not k.startswith(stations[k][0]):
            ids[k] = "de-" + _slug(k)
    routes = {}
    for t in trips:
        name = line_name(t["kind"], t["line"], t["agency_name"])
        rid = f"{t['agency']}:{name}"
        cat = category(name)[0] if name not in CATEGORY_COLORS else name
        routes.setdefault(rid, {"route_id": rid, "agency_id": t["agency"], "route_short_name": name, "route_long_name": "",
                                "route_type": "2", "route_color": CATEGORY_COLORS.get(name, CATEGORY_COLORS.get(cat, ""))})
        t["route_id"] = rid
    services = {t["service"] for t in trips}

    def table(rows, cols):
        buf = io.StringIO()
        w = csv.DictWriter(buf, cols, extrasaction="ignore", lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
        return buf.getvalue()

    st = io.StringIO()
    st.write("trip_id,arrival_time,departure_time,stop_id,stop_sequence,pickup_type,drop_off_type\n")
    for t in sorted(trips, key=lambda t: t["tid"]):
        for i, (k, arr, dep, pick, drop) in enumerate(t["seq"]):
            st.write(f"{t['tid']},{arr},{dep},{ids[k]},{i},{pick if pick in ('1', '2', '3') else ''},{drop if drop in ('1', '2', '3') else ''}\n")
    agency = [{"agency_id": a, "agency_name": AGENCIES[a]["name"], "agency_url": "https://gtfs.de", "agency_timezone": TZ} for a in AGENCIES]
    stop_rows = [{"stop_id": ids[k], "stop_name": stations[k][0], "stop_lat": stations[k][1], "stop_lon": stations[k][2]}
                 for k in sorted(used, key=lambda k: ids[k])]
    trip_rows = [{"route_id": t["route_id"], "service_id": t["service"], "trip_id": t["tid"], "trip_short_name": t["short"],
                  "trip_headsign": ""} for t in sorted(trips, key=lambda t: t["tid"])]
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=1) as z:
        z.writestr("agency.txt", table(agency, ["agency_id", "agency_name", "agency_url", "agency_timezone"]))
        z.writestr("routes.txt", table(sorted(routes.values(), key=lambda r: r["route_id"]),
                                       ["route_id", "agency_id", "route_short_name", "route_long_name", "route_type", "route_color"]))
        z.writestr("trips.txt", table(trip_rows, ["route_id", "service_id", "trip_id", "trip_headsign", "trip_short_name"]))
        z.writestr("stops.txt", table(stop_rows, ["stop_id", "stop_name", "stop_lat", "stop_lon"]))
        z.writestr("stop_times.txt", st.getvalue())
        z.writestr("calendar.txt", table([c for c in calendar if c["service_id"] in services],
                                         ["service_id", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
                                          "start_date", "end_date"]))
        z.writestr("calendar_dates.txt", table([c for c in dates if c["service_id"] in services], ["service_id", "date", "exception_type"]))
    log(f"  germany: {len(trips)} trips, {len(used)} stations, {len(routes)} lines")
    return out.getvalue()


def make():
    """The map's timetable (feeds.py's "make"), made once a day: the weekly
    builds run one railroad at a time, each in its own process, and all
    eight take the copy the first one made (in the system's temporary
    folder)."""
    cache = pathlib.Path(tempfile.gettempdir()) / f"trainsheet-germany-{datetime.date.today():%Y%m%d}.zip"
    if cache.exists():
        return cache.read_bytes()
    feeds = {k: _get(u) for k, u in GTFSDE.items()}
    try:
        delfi = delfi_numbers(_get(DELFI_GTFS, timeout=1800))
    except Exception as err:  # numbers are a nicety: the trains run without them
        print(f"  germany: DELFI's timetable not read ({err}); the trains go unnumbered this time")
        delfi = None
    data = build(feeds, delfi)
    cache.write_bytes(data)
    return data


EXTRAS = {"make": make, "number": lambda t: t.get("trip_short_name") or None, "tz": TZ}
GTFS = {a: (TIMETABLE, lambda r, a=a: r["agency_id"] == a, lambda r: r["route_short_name"], EXTRAS) for a in AGENCIES}

# Until the live data below is in: every train placed from the timetable.
SOURCES = [{"id": "germany", "agencies": list(AGENCIES), "format": "timetable", "interval": 60, "scope": "view"}]

# The track: OpenStreetMap's (Geofabrik's extracts of each state, and of the
# neighbours as far as the trains run: osm_tiles.py), routed from the
# timetable by build_rail.py; DB's ICEs and the other long-distance trains
# preferring the high-speed lines (highspeed=yes: Köln-Rhein/Main, Hannover-
# Würzburg, Mannheim-Stuttgart, Nürnberg-Ingolstadt, Erfurt-Leipzig/Halle,
# Ebensfeld-Erfurt, Wendlingen-Ulm, Hamburg-Berlin's upgraded line) to the
# classic ones beside them.
RAIL = {"region": "de", "bbox": BBOX, "network": "dbregio", "highspeed": ["dbfv", "deld"]}
