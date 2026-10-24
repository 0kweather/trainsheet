"""SNCB/NMBS (Belgium): every train in SNCB's national timetable (GTFS,
published daily on Belgium's National Access Point, transportdata.be, no
key), DB's ICEs Frankfurt-Brussels from Germany's long-distance timetable
(DELFI's, as GTFS by gtfs.de, CC BY 4.0, no key), placed from those
timetables; and while a viewer has a train open or tracks it, its delays,
platforms and composition car by car from iRail (api.irail.be: open, no
key, asked for one train at a time; detail source "irail" below).

Terms. SNCB's timetable: transportdata.be lists it "free of charge", its
use under SNCB's standard licence agreement (asked for through
belgiantrain.be/en/support/forms/public-data; its text isn't published), and
gives the file's address openly; the credit names SNCB. Its GTFS-Realtime
feed is given only to those who sign that licence (a personal address), so
it isn't used: the live data comes from iRail. iRail (docs.irail.be, checked
October 2026) asks only that clients name themselves in their User-Agent,
keep to 3 requests a second per address (5 more in a burst) and respect its
cache headers; its data is SNCB's, published as open data by the iRail
non-profit for any app to use. DELFI's timetable (gtfs.de's "fv_free"):
CC BY 4.0, credit "DELFI e.V., gtfs.de".

Railroads (the car file that draws them in brackets) and their trains as the
page shows them (t.route: SNCB's category as its displays show it; numbers
are SNCB's train numbers, "IC 2204"):
  sncb    SNCB [sncb]:
            IC    InterCity (every IC of the network: Oostende-Eupen,
                  Brussels-Luxembourg (to Luxembourg and Bertrange-Strassen),
                  Liège-Luxembourg through Gouvy and Troisvierges, Lille
                  Flandres-Antwerpen, Liège-Maastricht, Antwerpen-Roosendaal,
                  the HSL 2 trains Brussels-Liège(-Welkenraedt/Eupen))
            L     local trains (Lokale trein / train local), the cross-border
                  ones to Lille Flandres, Tourcoing, Aulnoye-Aymeries and
                  Maubeuge, Maastricht, Aachen, Roosendaal, and Luxembourg's
                  Arlon (line 50), Athus-Pétange-Rodange and Gouvy lines
            P     peak-hour trains (Piekuurtrein / train d'heure de pointe)
            S1-S10, S19, S20   Brussels' S trains (S Brussel / S Bruxelles)
            S32-S35            Antwerp's
            S41-S44            Liège's
            S51-S53            Ghent's
            S61-S64            Charleroi's
            EXT   extra trains (events, holidays)
            T     the tourist and seasonal trains (to the coast, the
                  Ardennes; Ottignies-Brussels on event days)
            EC    the EuroCity Brussels-Antwerpen-Rotterdam (and Breda),
                  SNCB's and NS's, over HSL 4
  beintl  international trains in Belgium [sncb], kept within reach of
          Belgium (half a degree past its box; Aachen, Lille, Rotterdam, but
          not Köln, Paris or Amsterdam):
            ICE   DB's ICE Frankfurt-Köln-Aachen-Liège-Brussels (ICE 10-19,
                  314-319) over HSL 3 (from DELFI's timetable)
            OTC   SNCF's OUIGO Train Classique Paris-Brussels (SNCB's file)
            NJ    ÖBB's Nightjet Brussels-Wien (SNCB's file)
            EN    the night trains to Berlin (SNCB's file, the days it has)
Not in any open timetable: Eurostar (the former Thalys, Paris-Brussels-
Amsterdam/Köln, and London-Brussels) and SNCF's TGV INOUI Brussels-France,
whose HSL 1 runs SNCB's file lists only on scattered days (they're left
out: a train shown on one day in thirty would mislead), and the Eurocity
Direct Brussels-Amsterdam. Left out too: buses (the file's BUS) and the
border points the file lists as stops ("Gouvy-Frontière", "Essen-Grens").
"""
import csv, datetime, io, json, math, re, time, urllib.error, urllib.parse, urllib.request, zipfile
from collections import Counter, defaultdict

TZ = "Europe/Brussels"
CREDIT = {"label": "SNCB/NMBS via transportdata.be; iRail; DELFI e.V. via gtfs.de (CC BY 4.0)",
          "href": "https://transportdata.be/en/dataset/sncb-gfts-scheduled-timetable-and-real-time-data"}
# Belgium and the Grand Duchy, whose lines SNCB's trains run on to
# Luxembourg, Troisvierges, Rodange and Bertrange-Strassen.
BBOX = [2.5, 49.45, 6.45, 51.52]
COMMON = {"region": "Belgium", "country": "BE", "tz": TZ, "credit": CREDIT, "license": None, "bbox": BBOX, "clip": True,
          "detail": "irail"}

AGENCIES = {
    "sncb": {"name": "SNCB/NMBS", "short": "SNCB", "color": "#016ab3", "kind": "intercity", "cars": "sncb", **COMMON},
    "beintl": {"name": "International trains in Belgium", "short": "International", "color": "#4a4a4a", "kind": "intercity",
               "cars": "sncb", "after": "sncb", **COMMON},
}
SOURCES = [{"id": "sncb", "agencies": list(AGENCIES), "format": "timetable", "interval": 60, "scope": "view"}]

GTFS_URL = "https://api-management-discovery-production.azure-api.net/api/gtfs/feed/nmbssncb/static"
DELFI_FV = "https://download.gtfs.de/germany/fv_free/latest.zip"
UA = "Trainsheet/1.0 (+https://trainsheet.com)"
DAYS_AHEAD = 60  # trips running in the next two months are kept

# ---------- Names as signed ----------
# The file names every station in French (its default language), with
# Dutch, German and English in translations.txt. A station is signed in its
# region's language: Dutch in Flanders, French in Wallonia, both in Brussels
# (French first, as the brief for this map and the Region's own signs have
# it: "Bruxelles-Midi / Brussel-Zuid"), German in the East Cantons (whose
# names are the same in French). Which language each station's region
# speaks is iRail's (its stations list, CC0, "name": "the most neutral name
# of the station"), checked against the map for Brussels' 19 communes
# (Saint-Job, Mérode and Vivier d'Oie are in Uccle, Etterbeek and Uccle).
NAMES = {
    "Alost": "Aalst", "Alost Kerrebroek": "Aalst-Kerrebroek", "Anvers-Berchem": "Antwerpen-Berchem",
    "Anvers-Central": "Antwerpen-Centraal", "Anvers-Dam": "Antwerpen-Dam", "Anvers-Est": "Antwerpen-Oost",
    "Anvers-Linkeroever": "Antwerpen-Linkeroever", "Anvers-Luchtbal": "Antwerpen-Luchtbal",
    "Anvers-Noorderdokken": "Antwerpen-Noorderdokken", "Anvers-Sud": "Antwerpen-Zuid", "Audenarde": "Oudenaarde",
    "Bourg-Léopold": "Leopoldsburg", "Bruges": "Brugge", "Bruges-Saint-Pierre": "Brugge-Sint-Pieters", "Courtrai": "Kortrijk",
    "Coxyde": "Koksijde", "Dixmude": "Diksmuide", "Essene Lombeek": "Essene-Lombeek", "Furnes": "Veurne",
    "Gammerages": "Galmaarden", "Gand-Dampoort": "Gent-Dampoort", "Gand-Saint-Pierre": "Gent-Sint-Pieters",
    "Grammont": "Geraardsbergen", "Grand-Bigard": "Groot-Bijgaarden", "Hal": "Halle", "Jurbise": "Jurbeke",
    "La Panne": "De Panne", "Lessines": "Lessen", "Lierre": "Lier", "Louvain": "Leuven", "Malines": "Mechelen",
    "Malines-Nekkerspoel": "Mechelen-Nekkerspoel", "Menin": "Menen", "Ostende": "Oostende", "Papignies": "Papegem",
    "Renaix": "Ronse", "Rhode-Saint-Genèse": "Sint-Genesius-Rode", "Roulers": "Roeselare", "Saint-Nicolas": "Sint-Niklaas",
    "Saint-Trond": "Sint-Truiden", "Tamise": "Temse", "Termonde": "Dendermonde", "Tirlemont": "Tienen",
    "Tongres": "Tongeren", "Tronchiennes": "Drongen", "Vilvorde": "Vilvoorde", "Ypres": "Ieper",
    "Noorderkempen (Brecht)": "Noorderkempen", "La Roche (brabant)": "La Roche (Brabant)",
    "SALZINNES-A.C.": "Salzinnes", "Brussels Airport-Zaventem": "Brussels Airport - Zaventem",
    # Brussels: both languages.
    **{fr: f"{fr} / {nl}" for fr, nl in {
        "Arcades": "Arcaden", "Berchem-Sainte-Agathe": "Sint-Agatha-Berchem", "Boitsfort": "Bosvoorde",
        "Boondael": "Boondaal", "Bruxelles-Central": "Brussel-Centraal", "Bruxelles-Chapelle": "Brussel-Kapellekerk",
        "Bruxelles-Congrès": "Brussel-Congres", "Bruxelles-Luxembourg": "Brussel-Luxemburg", "Bruxelles-Midi": "Brussel-Zuid",
        "Bruxelles-Nord": "Brussel-Noord", "Bruxelles-Ouest": "Brussel-West", "Bruxelles-Schuman": "Brussel-Schuman",
        "Forest-Est": "Vorst-Oost", "Forest-Midi": "Vorst-Zuid", "Germoir": "Mouterij", "Haren-Sud": "Haren-Zuid",
        "Mérode": "Merode", "Saint-Job": "Sint-Job", "Schaerbeek": "Schaarbeek", "Tour-et-Taxis": "Thurn-en-Taxis",
        "Uccle-Calevoet": "Ukkel-Kalevoet", "Uccle-Stalle": "Ukkel-Stalle", "Watermael": "Watermaal"}.items()},
    "Vivier D'Oie": "Vivier d'Oie / Diesdelle",
    # Luxembourg's stations as CFL signs them (cfl.py names them the same).
    "Luxembourg": "Luxembourg", "Bertrange Strassen": "Bertrange-Strassen", "Lamadeleine": "Lamadelaine",
    "Mamer-Lycée": "Mamer-Lycée", "Goebelsmuhle": "Goebelsmühle", "GOEBELSMUHLE": "Goebelsmühle",
    # Abroad, as their own railways sign them.
    "Aachen Hbf": "Aachen Hbf", "Aix-la-Chapelle Ouest": "Aachen West", "Almere Centre": "Almere Centrum",
    "Amsterdam Cs": "Amsterdam Centraal", "Amsterdam Sud": "Amsterdam Zuid", "Aulnoye Aymeries": "Aulnoye-Aymeries",
    "Croix Wasquehal": "Croix-Wasquehal", "Croix l'Allumette": "Croix-l'Allumette", "Eygelshoven markt": "Eygelshoven Markt",
    "Frankfurt Main": "Frankfurt (Main) Hbf", "Frankfurt Flugh": "Frankfurt (Main) Flughafen Fernbahnhof",
    "KOLN SUD": "Köln Süd", "KOLN-EHRENFELD": "Köln-Ehrenfeld", "Lelystad Centre": "Lelystad Centrum",
    "Marne La Vallée": "Marne-la-Vallée - Chessy", "Pont de Bois": "Pont-de-Bois", "Schiphol": "Schiphol Airport",
    "Wien HBF": "Wien Hbf", "Paris Nord": "Paris Nord", "Paris-Est": "Paris Est", "Limburg Sud": "Limburg Süd",
    "Siegburg": "Siegburg/Bonn", "St.Poelten Hbf": "St. Pölten Hbf", "NURNBERG": "Nürnberg Hbf",
    "PASSAU HBF": "Passau Hbf", "MONTABAUR": "Montabaur", "LYON-PERRACHE": "Lyon Perrache",
    "Lyon Part Dieu": "Lyon Part-Dieu", "Marseille Saint Ch": "Marseille Saint-Charles", "Nimes": "Nîmes",
    "Aéroport Cdg TGV": "Aéroport Charles de Gaulle 2 TGV", "LORRAINE TGV": "Lorraine TGV", "ARRAS": "Arras",
    "ANGERS-SAINT-LAUD": "Angers Saint-Laud", "Creil - Bât Voyageurs": "Creil",
    # DELFI's names for the ICE's stops.
    "Bruxelles Midi": "Bruxelles-Midi / Brussel-Zuid", "Frankfurt(Main)Hbf": "Frankfurt (Main) Hbf",
    "Frankfurt(M) Flughafen Fernbf": "Frankfurt (Main) Flughafen Fernbahnhof",
}
NAMES["Bruxelles-Nord"] = "Bruxelles-Nord / Brussel-Noord"
# Border points (no passengers): left out of every run.
BORDER = re.compile(r"(?i)(fronti[eè]re|grens|\(Gr\))")


def name(s):
    """A stop's or a headsign's name as signed: the country the file adds
    ("Lille Flandres (FR)") cut, then NAMES."""
    s = re.sub(r"\s+", " ", (s or "").strip())
    s = re.sub(r"\s+\((FR|NL|DE|LU|AT|GB|CH|IT)\)$", "", s)
    return NAMES.get(s, s)


# ---------- Categories ----------
# The file's categories (route_short_name) as SNCB shows them; "TRN" is the
# file's catch-all for a run whose category it didn't carry (most of them
# the day's variant of a numbered IC, L or S train): such a run takes the
# category its number has on the same route on other days, else on any,
# else its number's range's.
SNCB_CATEGORIES = {"IC", "L", "P", "EXT", "T", "EC"}  # and S<n>
INTL_CATEGORIES = {"OTC", "NJ", "EN", "ICE"}
LEFT_OUT = {"BUS", "EUR", "TGV"}  # see the module's docstring


def by_range(n):
    n = int(n)
    if n < 20 or 314 <= n <= 319:
        return "ICE"
    if 9100 <= n <= 9199 or 9300 <= n <= 9499:
        return "EUR"
    if 9500 <= n <= 9599:
        return "EC"  # Eurocity Direct Brussels-Amsterdam
    if 9800 <= n <= 9899:
        return "TGV"
    if n in (448, 449, 468, 469):
        return "NJ"
    if n in (452, 453, 474, 475):
        return "EN"
    return "L"


def agency_of(cat):
    if cat in INTL_CATEGORIES:
        return "beintl"
    if cat in SNCB_CATEGORIES or re.fullmatch(r"S\d+", cat):
        return "sncb"
    return None


# Our palette (SNCB publishes no line colours as data): the long-distance
# trains SNCB's blue, local and peak trains lighter blues, the S trains
# SNCB's S-train green, extras and tourist trains grey, the international
# ones dark.
CATEGORY_COLORS = {"IC": "#016ab3", "EC": "#016ab3", "L": "#5a8fc8", "P": "#3f6fa6", "EXT": "#767676", "T": "#8a6d3b",
                   "ICE": "#4a4a4a", "OTC": "#4a4a4a", "NJ": "#4a4a4a", "EN": "#4a4a4a"}
S_COLOR = "#00a072"


def color_of(cat):
    return CATEGORY_COLORS.get(cat, S_COLOR if cat.startswith("S") else "#016ab3")


# ---------- The timetable, cut and converted ----------
REACH = [BBOX[0] - 0.5, BBOX[1] - 0.5, BBOX[2] + 0.5, BBOX[3] + 0.5]
HOME = re.compile(r"^88\d{5}$")  # Belgian stations' UIC numbers; Luxembourg's are named "(LU)"


def _rows(zf, name):
    with zf.open(name) as f:
        yield from csv.DictReader(io.TextIOWrapper(f, "utf-8-sig"))


def _lines(zf, name, keep_col, keep):
    """The file's rows whose keep_col is in keep, as dicts, splitting only
    the lines kept (stop_times.txt is 280 MB, calendar_dates.txt 310 MB).
    The column is read from its end of the line when it's the last (the
    file's trip_id and service_id are), so a quoted field before it may
    hold a comma."""
    with zf.open(name) as f:
        head = next(csv.reader([f.readline().decode("utf-8-sig").rstrip("\r\n")]))
        i, last = head.index(keep_col), head.index(keep_col) == len(head) - 1
        for line in f:
            text = line.decode("utf-8")
            value = text.rstrip("\r\n").rsplit(",", 1)[-1] if last else text.split(",", i + 1)[i]
            if value.strip('"') in keep:
                yield dict(zip(head, next(csv.reader([text.rstrip("\r\n")]))))


def _station(stop, stops):
    """The station a stop belongs to: its parent's id, as its UIC number
    ("gs:nmbssncb:S8814001" -> "8814001") or the file's own name for one
    abroad ("nmbssncb:s-lilleflandresfr" -> "s-lilleflandresfr")."""
    sid = stop.get("parent_station") or stop["stop_id"]
    return re.sub(r"^g?s?:?nmbssncb:S?", "", sid)


def _reach(seq, at):
    """The longest run of a trip's stops within reach that calls in Belgium
    or Luxembourg (a train on to Paris or Amsterdam is drawn to the box's
    reach, as Switzerland's are)."""
    def inside(s):
        p = at.get(s)
        return p and REACH[0] <= p[1] <= REACH[2] and REACH[1] <= p[0] <= REACH[3]
    best, run = [], []
    for x in seq + [None]:
        if x and inside(x[1]):
            run.append(x)
            continue
        if any(HOME.match(y[1]) or y[1].endswith("lu") for y in run) and len(run) > len(best):
            best = run
        run = []
    return best


def _window(today):
    return [today - datetime.timedelta(1) + datetime.timedelta(d) for d in range(DAYS_AHEAD + 1)]


def _runs(zf, services, window):
    """{service id: dates it runs in the window}, and the calendar rows kept."""
    lo, hi = window[0].strftime("%Y%m%d"), window[-1].strftime("%Y%m%d")
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    runs, cal, dates = defaultdict(set), [], []
    for c in _rows(zf, "calendar.txt"):
        if c["service_id"] not in services or c["end_date"] < lo or c["start_date"] > hi:
            continue
        cal.append(c)
        a, b = (datetime.datetime.strptime(c[k], "%Y%m%d").date() for k in ("start_date", "end_date"))
        for d in window:
            if a <= d <= b and c[days[d.weekday()]] == "1":
                runs[c["service_id"]].add(d)
    for c in _lines(zf, "calendar_dates.txt", "service_id", services):
        if lo <= c["date"] <= hi:
            dates.append(c)
            d = datetime.datetime.strptime(c["date"], "%Y%m%d").date()
            (runs[c["service_id"]].add if c["exception_type"] == "1" else runs[c["service_id"]].discard)(d)
    return runs, cal, dates


def _sec(t):
    h, m, s = (int(x) for x in t.split(":"))
    return h * 3600 + m * 60 + s


def delfi_ice(at_name, today=None):
    """DB's ICEs Frankfurt-Brussels from DELFI's long-distance timetable, as
    (trips, stop_times, calendar, calendar_dates, stops) rows for the
    converted file. Its trips carry no numbers: each takes the one SNCB's
    file gives the ICE calling at Bruxelles-Midi within three minutes of it
    the same way (IC_TIMES, below). Stations are SNCB's where one is within
    500 m (at_name: {station id: (lat, lon, name)})."""
    req = urllib.request.Request(DELFI_FV, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as r:
        zf = zipfile.ZipFile(io.BytesIO(r.read()))
    routes = {r["route_id"] for r in _rows(zf, "routes.txt") if r["route_short_name"] == "ICE 79"}
    trips = {t["trip_id"]: t for t in _rows(zf, "trips.txt") if t["route_id"] in routes}
    stops = {s["stop_id"]: s for s in _rows(zf, "stops.txt")}
    times = defaultdict(list)
    for x in _rows(zf, "stop_times.txt"):
        if x["trip_id"] in trips:
            times[x["trip_id"]].append(x)

    def ours(stop):
        s = stops.get(stop.get("parent_station")) or stop
        lat, lon = float(s["stop_lat"]), float(s["stop_lon"])
        near = min(at_name.items(), key=lambda kv: (kv[1][0] - lat) ** 2 + ((kv[1][1] - lon) * 0.64) ** 2)
        if ((near[1][0] - lat) ** 2 + ((near[1][1] - lon) * 0.64) ** 2) ** 0.5 * 111_000 < 500:
            return near[0], None
        return f"de-{s['stop_id']}", {"stop_id": f"de-{s['stop_id']}", "stop_name": name(s["stop_name"]),
                                     "stop_lat": s["stop_lat"], "stop_lon": s["stop_lon"]}

    out_trips, out_times, new_stops, used_services = [], [], {}, set()
    unmatched = 0
    for tid, rows in times.items():
        rows.sort(key=lambda x: int(x["stop_sequence"]))
        rows = [x for x in rows if not BORDER.search(stops[x["stop_id"]]["stop_name"])]
        bxl = [x for x in rows if "Bruxelles Midi" in (stops.get(stops[x["stop_id"]].get("parent_station")) or stops[x["stop_id"]])["stop_name"]]
        if not bxl:
            continue
        to_bxl = bxl[0] is rows[-1]
        t = _sec(bxl[0]["arrival_time"] if to_bxl else bxl[0]["departure_time"])
        number = next((n for n, (way, s) in ICE_TIMES.items() if way == to_bxl and abs(s - t) <= 180), None)
        if not number:
            unmatched += 1
            continue
        out_trips.append({"route_id": "beintl:ICE", "service_id": f"de-{trips[tid]['service_id']}", "trip_id": f"de-{tid}",
                          "trip_headsign": name(stops[rows[-1]["stop_id"]]["stop_name"]), "trip_short_name": number})
        used_services.add(trips[tid]["service_id"])
        for x in rows:
            sid, new = ours(stops[x["stop_id"]])
            if new:
                new_stops[sid] = new
            out_times.append({"trip_id": f"de-{tid}", "arrival_time": x["arrival_time"], "departure_time": x["departure_time"],
                              "stop_id": sid, "stop_sequence": x["stop_sequence"], "pickup_type": "0", "drop_off_type": "0"})
    cal = [{**c, "service_id": f"de-{c['service_id']}"} for c in _rows(zf, "calendar.txt") if c["service_id"] in used_services]
    dates = [{**c, "service_id": f"de-{c['service_id']}"} for c in _rows(zf, "calendar_dates.txt") if c["service_id"] in used_services]
    if unmatched:
        print(f"  sncb: {unmatched} of DELFI's ICE runs matched no ICE number, left out")
    return out_trips, out_times, cal, dates, list(new_stops.values())


# The ICEs' numbers by their time at Bruxelles-Midi (SNCB's file, October
# 2026): even numbers arrive from Frankfurt, odd ones leave for it.
# {number: (arrives in Brussels, seconds after midnight)}
ICE_TIMES = {n: (int(n) % 2 == 0, _sec(t)) for n, t in {
    "10": "21:36:00", "11": "06:23:00", "12": "19:36:00", "13": "08:24:00", "14": "17:37:00", "15": "10:24:00",
    "16": "13:35:00", "17": "14:25:00", "18": "09:38:00", "19": "18:25:00", "314": "15:36:00", "315": "12:25:00",
    "316": "11:35:00", "317": "16:22:00", "318": "23:36:00", "319": "20:24:00"}.items()}


def convert(data, today=None):
    """SNCB's file as a GTFS of the map's railroads (feeds.py's "convert"):
    trains only, the trips of the next DAYS_AHEAD days, each route split by
    railroad and category (route ids "<railroad>:<category>", the category
    in route_short_name), stops as stations (platforms folded in, border
    points and stations a train only passes left out), names as signed;
    and DB's ICEs from DELFI's timetable."""
    today = today or datetime.date.today()
    window = _window(today)
    zf = zipfile.ZipFile(io.BytesIO(data))
    routes = {r["route_id"]: r for r in _rows(zf, "routes.txt") if r["route_type"] == "2"}
    trips = {t["trip_id"]: t for t in _rows(zf, "trips.txt") if t["route_id"] in routes}
    runs, cal, dates = _runs(zf, {t["service_id"] for t in trips.values()}, window)
    # A TRN run's category, from its number's other runs (on any day).
    seen, by_number = defaultdict(Counter), defaultdict(Counter)
    for t in trips.values():
        r = routes[t["route_id"]]
        if r["route_short_name"] != "TRN":
            seen[(t["trip_short_name"], r["route_long_name"])][r["route_short_name"]] += 1
            by_number[t["trip_short_name"]][r["route_short_name"]] += 1
    trips = {k: t for k, t in trips.items() if runs.get(t["service_id"])}

    def category(t):
        r = routes[t["route_id"]]
        cat = r["route_short_name"]
        if cat == "TRN":
            n = t["trip_short_name"]
            got = seen.get((n, r["route_long_name"])) or by_number.get(n)
            cat = got.most_common(1)[0][0] if got else by_range(n)
            if cat in ("IC", "L", "P", "EC") and by_range(n) in INTL_CATEGORIES | {"EUR", "TGV"}:
                cat = by_range(n)
        return cat

    stops = {s["stop_id"]: s for s in _rows(zf, "stops.txt")}
    station = {k: _station(s, stops) for k, s in stops.items()}
    at = {}
    for k, s in stops.items():
        if not s.get("parent_station"):
            at[station[k]] = (float(s["stop_lat"]), float(s["stop_lon"]), name(s["stop_name"]))
    for k, s in stops.items():
        at.setdefault(station[k], (float(s["stop_lat"]), float(s["stop_lon"]), name(s["stop_name"])))
    times = defaultdict(list)
    for x in _lines(zf, "stop_times.txt", "trip_id", trips):
        if x["pickup_type"] == "1" and x["drop_off_type"] == "1":
            continue  # passed, not called at
        st = station[x["stop_id"]]
        if BORDER.search(at[st][2]):
            continue
        times[x["trip_id"]].append((int(x["stop_sequence"]), st, x["arrival_time"], x["departure_time"],
                                    x["pickup_type"], x["drop_off_type"]))
    out_routes, out_trips, out_times = {}, [], []
    for tid, t in trips.items():
        cat = category(t)
        agency = agency_of(cat)
        if not agency or cat in LEFT_OUT:
            continue
        seq = _reach(sorted(times.get(tid, ())), at)
        if len(seq) < 2:
            continue
        rid = f"{agency}:{cat}"
        out_routes.setdefault(rid, {"route_id": rid, "agency_id": agency, "route_short_name": cat, "route_long_name": "",
                                    "route_type": "2", "route_color": color_of(cat)[1:]})
        out_trips.append({"route_id": rid, "service_id": t["service_id"], "trip_id": tid,
                          "trip_headsign": name(at[seq[-1][1]][2]), "trip_short_name": t["trip_short_name"]})
        for s, st, arr, dep, pick, drop in seq:
            out_times.append({"trip_id": tid, "arrival_time": arr, "departure_time": dep, "stop_id": st, "stop_sequence": s,
                              "pickup_type": pick, "drop_off_type": drop})
    services = {t["service_id"] for t in out_trips}
    cal = [c for c in cal if c["service_id"] in services]
    dates = [c for c in dates if c["service_id"] in services]
    extra_stops = []
    try:
        ice_trips, ice_times, ice_cal, ice_dates, extra_stops = delfi_ice({k: v for k, v in at.items()})
        # Within reach, as SNCB's own trains: Aachen to Brussels.
        for x in extra_stops:
            at.setdefault(x["stop_id"], (float(x["stop_lat"]), float(x["stop_lon"]), x["stop_name"]))
        seqs = defaultdict(list)
        for x in ice_times:
            seqs[x["trip_id"]].append((int(x["stop_sequence"]), x["stop_id"], x))
        kept = {tid: _reach(sorted(seq, key=lambda y: y[0]), at) for tid, seq in seqs.items()}
        kept = {tid: seq for tid, seq in kept.items() if len(seq) >= 2}
        ice_trips = [{**t, "trip_headsign": at[kept[t["trip_id"]][-1][1]][2]} for t in ice_trips if t["trip_id"] in kept]
        ice_times = [y[2] for seq in kept.values() for y in seq]
        if ice_trips:
            out_routes["beintl:ICE"] = {"route_id": "beintl:ICE", "agency_id": "beintl", "route_short_name": "ICE",
                                        "route_long_name": "", "route_type": "2", "route_color": color_of("ICE")[1:]}
            out_trips += ice_trips
            out_times += ice_times
            cal += ice_cal
            dates += ice_dates
    except (urllib.error.URLError, OSError, KeyError, zipfile.BadZipFile) as err:
        print(f"  sncb: DELFI's ICE timetable not read ({err}); the ICEs are left out this time")
    used = {x["stop_id"] for x in out_times}
    stop_rows = [{"stop_id": k, "stop_name": v[2], "stop_lat": f"{v[0]:.6f}", "stop_lon": f"{v[1]:.6f}"}
                 for k, v in sorted(at.items()) if k in used]
    stop_rows += [s for s in extra_stops if s["stop_id"] in used]

    def table(rows, cols):
        buf = io.StringIO()
        w = csv.DictWriter(buf, cols, extrasaction="ignore", lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
        return buf.getvalue()

    agency = [{"agency_id": a, "agency_name": AGENCIES[a]["name"], "agency_url": "https://www.belgiantrain.be", "agency_timezone": TZ}
              for a in AGENCIES]
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=1) as z:
        z.writestr("agency.txt", table(agency, ["agency_id", "agency_name", "agency_url", "agency_timezone"]))
        z.writestr("routes.txt", table(sorted(out_routes.values(), key=lambda r: r["route_id"]),
                                       ["route_id", "agency_id", "route_short_name", "route_long_name", "route_type", "route_color"]))
        z.writestr("trips.txt", table(out_trips, ["route_id", "service_id", "trip_id", "trip_headsign", "trip_short_name"]))
        z.writestr("stops.txt", table(stop_rows, ["stop_id", "stop_name", "stop_lat", "stop_lon"]))
        z.writestr("stop_times.txt", table(out_times, ["trip_id", "arrival_time", "departure_time", "stop_id", "stop_sequence",
                                                       "pickup_type", "drop_off_type"]))
        cols = ["service_id", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "start_date", "end_date"]
        z.writestr("calendar.txt", table(cal, cols))
        z.writestr("calendar_dates.txt", table(dates, ["service_id", "date", "exception_type"]))
    return out.getvalue()


EXTRAS = {"convert": convert, "number": lambda t: t.get("trip_short_name") or None, "tz": TZ,
          "colors": {c: color_of(c) for c in ["IC", "EC", "L", "P", "EXT", "T", "ICE", "OTC", "NJ", "EN"]
                     + [f"S{n}" for n in (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 19, 20, 32, 33, 34, 35, 41, 42, 43, 44, 51, 52, 53, 61, 62, 63, 64)]}}
# Stations placed where the track is ({railroad: {station id: [lat, lon]}}),
# where the file's place is off by more than 80 m (the in-page hop check):
# Luxembourg's stations where CFL's timetable has them (SNCB's file places
# them roughly, 760 m off at Capellen), Lille's and its
# neighbours' on their line, and the stations whose place in SNCB's file is
# the building or the square, 90-140 m from the platforms (Simonis's are
# underground beneath the boulevard, Brussels Airport's beneath the terminal).
_SNCB_AT = {
    "s-capellenlu": [49.6385, 5.98238], "s-clervauxlu": [50.06158, 6.02463], "s-troisviergeslu": [50.11933, 5.99101],
    "s-merschlu": [49.75184, 6.1103], "s-kleinbettingenlu": [49.64396, 5.91714], "s-ettelbrucklu": [49.84797, 6.10773],
    "s-kautenbachlu": [49.94862, 6.02209], "s-luxembourglu": [49.59997, 6.13424],
    "s-hellemmesfr": [50.62212, 3.11103], "s-ascqfr": [50.62147, 3.16718], "s-lilleflandresfr": [50.636, 3.071],
    "8812013": [50.8629, 4.33055], "8819406": [50.89638, 4.48399], "8821147": [51.18219, 4.44809],
    "8841327": [50.66091, 5.42932], "8844420": [50.4893, 5.865],
}
POSITIONS = {"sncb": _SNCB_AT, "beintl": _SNCB_AT}
GTFS = {a: (GTFS_URL, lambda r, a=a: r["agency_id"] == a, lambda r: r["route_short_name"],
            {**EXTRAS, "positions": POSITIONS.get(a, {})}) for a in AGENCIES}

# The track: Belgium's and Luxembourg's lines and the ones over the borders
# to Lille, Maubeuge, Roosendaal, Rotterdam, Maastricht, Aachen and
# Luxembourg's, routed from the timetables along OpenStreetMap's track
# (Geofabrik's extracts, build_rail.py).
RAIL = {"region": "be", "bbox": BBOX, "network": "sncb"}


# ---------- One train, on request: iRail (a detail source) ----------
# iRail (api.irail.be, docs.irail.be): SNCB's live data for one train, asked
# for only while a viewer has it open or tracks it (the relay's detail
# sources: per visitor and per minute limits), each answer kept a minute.
# Two requests a train: its run, and (on its day) its composition.
#   GET https://api.irail.be/v1/vehicle/?id=BE.NMBS.<number>&date=<ddmmyy>&format=json&lang=en
#     stops.stop[]: stationinfo.standardname (the local name; Brussels'
#     "Brussel-Zuid/Bruxelles-Midi"), scheduledArrivalTime,
#     scheduledDepartureTime (unix s), arrivalDelay, departureDelay (s),
#     arrived, left ("1" once it has), canceled, arrivalCanceled,
#     departureCanceled, platforminfo.name ("?" unknown)
#   GET https://api.irail.be/v1/composition/?id=<number>&format=json
#     composition.segments.segment[]: origin, destination, composition.units.unit[]
#     (the train's vehicles in order, the first at the front as it leaves
#     the segment's origin, to be checked against photographs):
#       materialType {parent_type, sub_type, orientation LEFT|RIGHT},
#       materialSubTypeName ("AM80M_c"), materialNumber (the unit's or
#       locomotive's number, "387", "1845"), tractionPosition (which unit of
#       the train, 1 first), seatsFirstClass, seatsSecondClass, lengthInMeter
#   Its limits: 3 requests a second per address, 5 more in a burst; HTTP 429
#   past them; a User-Agent naming the app. This relay copy goes upstream at
#   most IRAIL_PER_MINUTE times a minute.
# The answer, as every detail source's (js/sources.js applyDetail), with the
# composition as "cars" (shaped as Switzerland's formation, plus each
# vehicle's unit and its orientation):
#   {"found": true, "number": "2204", "date": "2026-10-24", "name": "IC 2204",
#    "origin", "destination", "delay": minutes, "cancelled", "departed", "arrived",
#    "last": {"station", "at"} | null,
#    "stops": [{"name", "arr", "dep", "actualArr", "actualDep", "platform", "cancelled"}],
#    "cars": {"numbers": ["387", "387", "387", "341", ...],   # materialNumber
#             "models": ["AM80M_c", "AM80M_b", "AM80M_a", ...],  # materialSubTypeName
#             "classes": ["12", "2", "2", ...],  # from its seats: 1, 2, 12 (both),
#                                                # LK (a locomotive: no seats), K
#             "orders": [0, ...],                # SNCB numbers no cars for riders
#             "units": [1, 1, 1, 2, 2, 2],       # tractionPosition
#             "sides": ["LEFT", "LEFT", "RIGHT", ...],  # orientation
#             "complete": true}}                 # false: the train splits on the way
#                                                # (the first part's given)
# Not found (no such train that day): {"found": false}.
# The models seen (24 October 2026; the car before the "_" is SNCB's
# class, after it the vehicle's place or kind within its unit or set):
#   AM80M_a/_b/_c (Break, three cars: a, b, c the first-class end),
#   AM96M_ and AM96P_a/_b/_c, AM08M_ and AM08P_a/_b/_c (Desiro ML; materialNumber
#   the unit, "8078"; a CFL-run or planned unit may give no number), AR41_a/_b
#   (the diesel railcars, a the first-class end), M7_BUH/_ABUH/_BDH (driving
#   car)/_BMX (driving car with a multi-purpose area)/_BXH (driving car),
#   M6_BU/_BYU/_AU/_AYU/_BDYU/_BXAA/_BXCT (double-deck; BX.. the driving
#   cars), I10_BUH, HLE18 and HLE19 (locomotives, no sub type: class "LK"),
#   and "Unknown AM/MR" (NS's ICNG on the EuroCity, no seats given).
# A unit's cars share its "units" number and number; "sides" tells which way
# each vehicle faces (a Break's a and c cars face apart: "LEFT", "RIGHT").
# Samples: scratchpad w2/belux/irail-formation-samples.json.
IRAIL ="https://api.irail.be/v1"
IRAIL_UA = "Trainsheet/1.0 (+https://trainsheet.com; relay)"
IRAIL_PER_MINUTE = 60
DETAILS = {"irail": {"ttl": 60}}


def _int(v):
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


def irail_name(standard):
    """iRail's local name as this map writes it: Brussels' "Brussel-Zuid/
    Bruxelles-Midi" French first, "Bruxelles-Midi / Brussel-Zuid"."""
    s = (standard or "").strip()
    if s == "Lëtzebuerg":  # iRail's name for Luxembourg; CFL's signs say Luxembourg
        return "Luxembourg"
    if "/" in s and " / " not in s:
        nl, fr = s.split("/", 1)
        return f"{fr.strip()} / {nl.strip()}"
    return s


def _klass(u):
    first, second = _int(u.get("seatsFirstClass")) or 0, _int(u.get("seatsSecondClass")) or 0
    if first and second:
        return "12"
    if first or second:
        return "1" if first else "2"
    return "LK" if re.match(r"HL", (u.get("materialType") or {}).get("parent_type") or "") else "K"


def irail_cars(comp):
    """The detail's cars from an iRail composition answer, or None."""
    segs = (((comp or {}).get("composition") or {}).get("segments") or {}).get("segment") or []
    if not segs:
        return None
    units = (((segs[0].get("composition") or {}).get("units")) or {}).get("unit") or []
    if not units:
        return None
    return {"numbers": [str(u.get("materialNumber") or "") for u in units],
            "models": [u.get("materialSubTypeName") or "_".join(x for x in ((u.get("materialType") or {}).get("parent_type"),
                                                                              (u.get("materialType") or {}).get("sub_type")) if x)
                       for u in units],
            "classes": [_klass(u) for u in units], "orders": [0] * len(units),
            "units": [_int(u.get("tractionPosition")) or 0 for u in units],
            "sides": [(u.get("materialType") or {}).get("orientation") or "" for u in units],
            "complete": len(segs) == 1}


def irail_detail(vehicle, comp, number, date):
    """The detail answer from iRail's vehicle answer (and its composition's,
    or None)."""
    raw = ((vehicle or {}).get("stops") or {}).get("stop") or []
    if not raw:
        return {"found": False}
    stops, last, n = [], None, len(raw)
    for i, s in enumerate(raw):
        info = s.get("stationinfo") or {}
        nm = irail_name(info.get("standardname") or s.get("station"))
        sa, sd = _int(s.get("scheduledArrivalTime")), _int(s.get("scheduledDepartureTime"))
        da, dd = _int(s.get("arrivalDelay")) or 0, _int(s.get("departureDelay")) or 0
        arr = sa if i > 0 else None
        dep = sd if i < n - 1 else None
        arrived, left = s.get("arrived") == "1", s.get("left") == "1"
        act_arr = arr + da if arr is not None and arrived else None
        act_dep = dep + dd if dep is not None and left else None
        plat = ((s.get("platforminfo") or {}).get("name") or s.get("platform") or "").strip()
        cancelled = s.get("canceled") == "1" or (s.get("arrivalCanceled") == "1" and s.get("departureCanceled") == "1")
        stops.append({"name": nm, "arr": arr, "dep": dep, "actualArr": act_arr, "actualDep": act_dep,
                      "platform": None if plat in ("", "?") else plat, "cancelled": cancelled})
        if act_dep is not None or act_arr is not None:
            last = (i, nm, act_dep if act_dep is not None else act_arr, dd if act_dep is not None else da)
    first, end = raw[0], raw[-1]
    if last:
        delay = last[3]
    else:
        delay = _int(first.get("departureDelay")) or 0
    info = (vehicle or {}).get("vehicleinfo") or {}
    out = {"found": True, "number": str(number), "date": date, "name": info.get("shortname") or None,
           "origin": stops[0]["name"], "destination": stops[-1]["name"],
           "delay": math.floor(delay / 60 + 0.5), "cancelled": all(s["cancelled"] for s in stops),
           "departed": first.get("left") == "1", "arrived": end.get("arrived") == "1",
           "last": {"station": last[1], "at": last[2]} if last else None, "stops": stops}
    cars = irail_cars(comp)
    if cars:
        out["cars"] = cars
    return out


def _irail_get(path, params):
    url = f"{IRAIL}/{path}/?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": IRAIL_UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as err:
        if err.code in (400, 404):  # no such train that day, or no composition for it
            return None
        raise


_asked = []  # the times this copy went upstream to iRail, in the last minute


def relay_fetch(env, source_id, query):
    """One train's detail, as JSON: the same bytes as relay/feeds/sncb.js.
    query: {"train", "date", "from"}, checked and normalised by the relay."""
    number, date = query["train"], query["date"]
    now = time.time()
    _asked[:] = [t for t in _asked if now - t < 60]
    out = {"found": False}
    if len(_asked) < IRAIL_PER_MINUTE:
        _asked.append(now)
        y, m, d = date.split("-")
        vehicle = _irail_get("vehicle", {"id": f"BE.NMBS.{number}", "date": f"{d}{m}{y[2:]}", "format": "json", "lang": "en"})
        comp = None
        # The composition is today's (iRail takes no date): asked for only
        # for a train of today in Belgium.
        today = datetime.datetime.now(datetime.timezone.utc).astimezone(_brussels()).date().isoformat()
        if vehicle and date == today and len(_asked) < IRAIL_PER_MINUTE:
            _asked.append(now)
            comp = _irail_get("composition", {"id": number, "format": "json"})
        out = irail_detail(vehicle, comp, number, date) if vehicle else {"found": False}
    return json.dumps(out, ensure_ascii=False, separators=(",", ":")).encode("utf-8"), "application/json"


def _brussels():
    try:
        from zoneinfo import ZoneInfo
        return ZoneInfo(TZ)
    except Exception:  # no time zone database: Brussels' winter offset
        return datetime.timezone(datetime.timedelta(hours=1))
