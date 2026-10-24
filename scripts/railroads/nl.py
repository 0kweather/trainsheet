"""The Netherlands: every passenger train on the Dutch network, as three
railroads: NS (its Intercity, Intercity direct and Sprinter trains), the
regional railways (Arriva, Blauwnet, RRReis, R-net) and the international
trains (NS International's ICE, Eurostar, Nightjet and EuroCity trains, and
the German and Belgian railways' trains over the border). The timetable is
OVapi's national GTFS (gtfs.ovapi.nl, no key: NS's and the other railways'
timetables as NDOV Loket publishes them, the trains' numbers as NS's
"ritnummers"); the trains are placed from it and moved by OVapi's
GTFS-Realtime trainUpdates (InfoPlus's live departures of every train, no
key: delays, cancellations, skipped stops), which the relay passes on
compacted (the feed sends no CORS headers). There are no train positions in
it: OVapi's vehiclePositions has buses, trams and metros only.

Terms (gtfs.ovapi.nl/README, checked October 2026): "You are free to use
this data", best effort, no service level, and no one may claim to
represent or impersonate the transit agencies; clients identify themselves
in their User-Agent, send If-Modified-Since / If-None-Match when polling
more often than once a minute, and accept gzip. The file's licences
(licenses.txt): CC0-1.0 for every table, but shapes.txt ODbL-1.0 (not used:
the track is OpenStreetMap's) and the ticketing tables CC-BY-NC-ND-4.0 (not
used). NDOV Loket (now GOVI, Stichting OpenGeo) publishes the source data
CC0.

Railroads (the car files that draw them in brackets) and their lines (the
product as sold, the file's route_short_name; the regional railways' with
their line numbers):
  ns       NS [ns]: Intercity, Intercity direct (the HSL-Zuid trains
           Amsterdam-Rotterdam-Breda, the ICNG's, NS International's
           domestic Intercity direct Rotterdam-Lelystad too), Sprinter
           (R-net's Gouda-Alphen a/d Rijn Sprinters, run by NS, too)
  nlregio  the regional railways [nlregio]:
           Arriva: Stoptrein RS1-RS7 and Sneltrein RE1, RE3, RE6 (Groningen
             and Friesland: Leeuwarden-Harlingen Haven, -Stavoren, -Sneek,
             Groningen-Leeuwarden, -Delfzijl, -Eemshaven, -Roodeschool,
             -Winschoten, -Leer (Ostfriesl), Veendam), Stoptrein RS11, RS12,
             RS15, RS18 and Sneltrein RE18 (Limburg: Nijmegen-Venlo-Roermond,
             Roermond-Maastricht Randwyck, Sittard-Heerlen, Kerkrade
             Centrum-Maastricht Randwyck, Maastricht-Liège-Guillemins and
             -Aachen Hbf), Nachttrein (Maastricht-Schiphol Airport, weekend
             nights)
           Blauwnet (Arriva): Sneltrein RE20, Stoptrein RS20, RS21, RS24
             (Zwolle-Emmen, -Coevorden, Almelo-Hardenberg, Zutphen-Oldenzaal)
           Blauwnet (Keolis): Intercity IC23, Sprinter RS22, RS23 (Zwolle-
             Enschede, Zwolle-Kampen)
           RRReis (Arriva): Sneltrein RE30, Stoptrein RS30-RS33 (Apeldoorn-
             Zutphen-Winterswijk, Arnhem-Doetinchem-Winterswijk, Arnhem-
             Zevenaar, Arnhem-Tiel), Stoptrein Emmen-Nieuw Amsterdam
           RRReis (Keolis): Sprinter RS34 (Amersfoort-Barneveld-Ede-
             Wageningen, the Valleilijn)
           R-net (Qbuzz): Stoptrein (Dordrecht-Gorinchem-Geldermalsen, the
             MerwedeLingelijn)
  nlintl   international trains [ns]: ICE (Amsterdam-Frankfurt (M) Hbf,
           -München Hbf, -Berlin Südkreuz), Eurostar (Amsterdam-London St.
           Pancras Int., -Paris-Nord, -Marne-la-Vallée-Chessy), Nightjet
           (Amsterdam-Zürich HB, -Wien Hbf, -München), EuroCity (Brussel-Zuid-
           Rotterdam Centraal-Amsterdam), Eurocity Direct (Brussel-Zuid-
           Lelystad Centrum via the HSL-Zuid, the ICNG), European Sleeper
           (Brussel-Zuid-Amsterdam-Berlin-Praha hl.n.), GoVolta (Amsterdam-
           Berlin), and the neighbours' regional trains over the border:
           VIAS Stoptrein RE19 (Arnhem-Emmerich-Düsseldorf Hbf), eurobahn
           Sneltrein RE13 (Venlo-Hamm (Westf.)) and Stoptrein RB61 (Hengelo-
           Bielefeld Hbf), DB Stoptrein RB64 (Enschede-Münster (Westf) Hbf),
           NMBS Stoptrein S32 (Roosendaal-Antwerpen-Puurs)
Left out: the replacement buses ("Stopbus/Snelbus ipv trein", "Toegankelijke
bus") and metros ("Metro ipv trein"), the heritage Miljoenenlijn
(ZLSM, Simpelveld) and every bus, tram, metro and ferry of the file.
Trains are kept only as far as the track reaches (REACH, below): a Eurostar
to London is drawn as far as Brussel-Zuid, an ICE to Frankfurt as far as
Köln, a Nightjet as far as Köln or Duisburg.
"""
import csv, datetime, gzip, io, json, re, urllib.request, zipfile
from collections import defaultdict

CREDIT = {"label": "OVapi (NDOV Loket, NS)", "href": "https://gtfs.ovapi.nl/"}
# The Netherlands, with Brussels, Antwerp and Liège, Aachen, Köln and
# Düsseldorf, Münster and Leer, where its trains run on to.
BBOX = [3.3, 50.6, 7.6, 53.6]
TZ = "Europe/Amsterdam"
COMMON = {"region": "Netherlands", "country": "NL", "tz": TZ, "credit": CREDIT, "license": "CC0-1.0 (OVapi / NDOV Loket)",
          "bbox": BBOX, "clip": True}

AGENCIES = {
    "ns": {"name": "NS", "short": "NS", "color": "#ffc917", "kind": "intercity", "cars": "ns", **COMMON},
    "nlregio": {"name": "Dutch regional railways", "short": "Regional", "color": "#00a0a6", "kind": "commuter", "cars": "nlregio",
                "after": "ns", **COMMON},
    "nlintl": {"name": "International trains in the Netherlands", "short": "International", "color": "#4a4a4a",
               "kind": "intercity", "cars": "ns", "after": "nlregio", **COMMON},
}

# ---------- The timetable ----------
# OVapi's national GTFS (every bus, tram, metro, ferry and train of the
# Netherlands, 240 MB, 1 GB of stop times), rebuilt most days; its trains
# are NS's IFF timetable (agency ids "IFF:<railway>", route type 2), each
# trip's train number (ritnummer) its trip_short_name, each station's code
# ("asd", "ut") its stops' zone_id ("IFF:asd") and its parent's stop_code.
GTFS_URL = "https://gtfs.ovapi.nl/nl/gtfs-nl.zip"
IDENTIFYING_UA = "Trainsheet/1.0 (+https://trainsheet.com)"
DAYS_AHEAD = 35  # trips running in the next five weeks are kept

# The file's railways (agency ids) as the map's railroads.
RAILWAYS = {"IFF:NS": "ns", "IFF:R-NET_NS": "ns",
            "IFF:ARRIVA": "nlregio", "IFF:BLAUWNET_A": "nlregio", "IFF:BLAUWNET_K": "nlregio",
            "IFF:RRREIS_A": "nlregio", "IFF:RRREIS_K": "nlregio", "IFF:R-NET_QB": "nlregio",
            "IFF:NS_INT": "nlintl", "IFF:DB": "nlintl", "IFF:EUROBAHN": "nlintl", "IFF:VIAS": "nlintl",
            "IFF:NMBS": "nlintl", "IFF:EU_SLEEPER": "nlintl", "IFF:GV": "nlintl"}
# The railways' names, for the train panel's line ("Arriva Stoptrein RS18").
OPERATOR = {"IFF:ARRIVA": "Arriva", "IFF:BLAUWNET_A": "Blauwnet", "IFF:BLAUWNET_K": "Blauwnet", "IFF:RRREIS_A": "RRReis",
            "IFF:RRREIS_K": "RRReis", "IFF:R-NET_QB": "R-net", "IFF:R-NET_NS": "R-net", "IFF:DB": "DB",
            "IFF:EUROBAHN": "eurobahn", "IFF:VIAS": "VIAS", "IFF:NMBS": "NMBS"}
NOT_TRAINS = re.compile(r"ipv trein|Toegankelijke bus", re.I)


def railroad(route):
    """The map's railroad for a route of the file, or None to leave it out."""
    if route["route_type"] != "2" or NOT_TRAINS.search(route["route_short_name"]):
        return None
    ours = RAILWAYS.get(route["agency_id"])
    # NS International's domestic Intercity direct (Rotterdam-Lelystad) is
    # an NS train like the others.
    if ours == "nlintl" and route["route_short_name"] == "Intercity direct":
        return "ns"
    return ours


def line_name(route):
    """The product as sold, with the railway's name for the regional and
    neighbours' trains: "Intercity", "Sprinter", "ICE", "Arriva Stoptrein
    RS18", "VIAS Stoptrein RE19"."""
    name = re.sub(r"\s+", " ", route["route_short_name"].strip())
    who = OPERATOR.get(route["agency_id"])
    if who and route["agency_id"] != "IFF:R-NET_NS":
        return f"{who} {name}"
    if route["agency_id"] == "IFF:R-NET_NS":
        return "R-net Sprinter"
    return name


# Each product's colour on the map (our own palette): NS's Intercity and
# Sprinter in NS's yellow and blue, the Intercity direct darker, the
# regional trains by railway, the international trains by brand.
LINE_COLORS = {"Intercity": "ffc917", "Intercity direct": "e6a500", "Sprinter": "003082", "R-net Sprinter": "c8102e",
               "ICE": "6e7b85", "Eurostar": "1d2b55", "Nightjet": "0c2340", "EuroCity": "8a1538", "Eurocity Direct": "8a1538",
               "European Sleeper": "2b3a67", "GoVolta": "d1006f"}
OPERATOR_COLORS = {"Arriva": "00a0a6", "Blauwnet": "2a6ebb", "RRReis": "6d2077", "R-net": "c8102e", "DB": "ec0016",
                   "eurobahn": "5a2d82", "VIAS": "0069b4", "NMBS": "0063a6"}


def color(name):
    return LINE_COLORS.get(name) or OPERATOR_COLORS.get(name.split(" ")[0], "")


# Station names as their signs write them, where the file's differ. The
# file has NS's names ("Den Haag HS", "Alphen a/d Rijn", "'s-Hertogenbosch",
# "Feanwâlden", as NS's signs and boards show them), the Belgian stations in
# Dutch as NS and the Flemish signs write them ("Brussel-Zuid", "Antwerpen-
# Centraal", "Liège-Guillemins"), and the German ones as NS writes them,
# put right here where DB's signs differ.
NAMES = {"Leer(Ostfriesl)": "Leer (Ostfriesl)", "Bunde(Ostfriesl)": "Bunde (Ostfriesl)", "Gronau (Westf.)": "Gronau (Westf)",
         "Hamm (Westf.)": "Hamm (Westf) Hbf", "Münster (W) Zentrum Nord": "Münster Zentrum Nord", "Preussen": "Preußen",
         "Heide (B)": "Heide"}


def station_name(name):
    name = re.sub(r"\s+", " ", name.strip())
    return NAMES.get(name, name)


# Stops past the box are kept as far as the track goes (Belgium, Nordrhein-
# Westfalen and western Niedersachsen: osm_tiles.py's extracts), each train
# its longest run of stops within that calls in the Netherlands: not France
# (a Eurostar to London ends at Brussel-Zuid, not Lille Europe) nor
# Rheinland-Pfalz (a Nightjet ends at Bonn, not Koblenz).
REACH = [2.5, 50.45, 8.2, 53.9]
FRANCE = [2.5, 50.45, 4.0, 50.8]  # Lille's corner of REACH
NL = [3.3, 50.74, 7.23, 53.6]  # the Netherlands itself, near enough: its stations are all inside


def _rows(zf, name):
    with zf.open(name) as f:
        yield from csv.DictReader(io.TextIOWrapper(f, "utf-8-sig"))


def rail_cut(data, today=None):
    """The national file cut to the railroads' trains: (routes {id: (row,
    railroad)}, trips {id: row}, stations {code: row}, times {trip id:
    [(seq, code, arr, dep, pickup, drop_off)]}, dates [{service_id, date,
    exception_type}], runs {service id: set of dates})."""
    today = today or datetime.date.today()
    lo, hi = (today - datetime.timedelta(1)).strftime("%Y%m%d"), (today + datetime.timedelta(DAYS_AHEAD)).strftime("%Y%m%d")
    zf = zipfile.ZipFile(io.BytesIO(data))
    routes = {}
    for r in _rows(zf, "routes.txt"):
        ours = railroad(r)
        if ours:
            routes[r["route_id"]] = (r, ours)
    trips = {t["trip_id"]: t for t in _rows(zf, "trips.txt") if t["route_id"] in routes}
    services = {t["service_id"] for t in trips.values()}
    runs, dates = defaultdict(set), []
    for c in _rows(zf, "calendar_dates.txt"):  # the file has no calendar.txt
        if c["service_id"] in services and lo <= c["date"] <= hi:
            if c["exception_type"] == "1":
                runs[c["service_id"]].add(c["date"])
            dates.append(c)
    trips = {k: t for k, t in trips.items() if runs.get(t["service_id"])}
    # Stops: each platform's zone_id is its station's code ("IFF:asd"); the
    # station's own row (a stoparea, location_type 1) names and places it.
    platform, areas = {}, {}
    for s in _rows(zf, "stops.txt"):
        if s["location_type"] == "1":
            areas[s["stop_id"]] = s
        elif s["zone_id"].startswith("IFF:"):
            platform[s["stop_id"]] = (s["zone_id"][4:], s["parent_station"], s)
    times = defaultdict(list)
    keep = {k.encode() for k in trips}
    with zf.open("stop_times.txt") as f:  # 1 GB, read line by line: no field holds a comma
        head = f.readline().decode("utf-8-sig").rstrip("\r\n").split(",")
        i = {c: n for n, c in enumerate(head)}
        for line in f:
            tid = line.split(b",", 1)[0]
            if tid in keep:
                x = line.decode("utf-8").rstrip("\r\n").split(",")
                p = platform.get(x[i["stop_id"]])
                if p:
                    times[x[i["trip_id"]]].append((int(x[i["stop_sequence"]]), p[0], x[i["arrival_time"]], x[i["departure_time"]],
                                                    x[i["pickup_type"]], x[i["drop_off_type"]]))
    stations = {}
    for code, parent, s in platform.values():
        a = areas.get(parent)
        if code not in stations or (a and stations[code].get("_area") is None):
            row = a or s
            stations[code] = {"stop_id": code, "stop_name": station_name(row["stop_name"]), "stop_lat": row["stop_lat"],
                              "stop_lon": row["stop_lon"], "_area": a and a["stop_id"]}
    return routes, trips, stations, times, dates, runs


def _inside(box, s):
    return s and box[0] <= float(s["stop_lon"]) <= box[2] and box[1] <= float(s["stop_lat"]) <= box[3]


def reach(seq, stations):
    """A trip's longest run of stops within REACH that calls in the
    Netherlands."""
    best, run = [], []
    for x in seq + [None]:
        if x and _inside(REACH, stations.get(x[1])) and not _inside(FRANCE, stations.get(x[1])):
            run.append(x)
            continue
        if any(_inside(NL, stations.get(y[1])) for y in run) and len(run) > len(best):
            best = run
        run = []
    return best


def convert(data):
    """The national file as a GTFS of the map's three railroads (feeds.py's
    "convert"): trains only, the trips of the next DAYS_AHEAD days, routes
    by railroad and line name (route ids "<railroad>:<line>"), stops as
    stations by their codes, numbers as trip_short_name."""
    routes, trips, stations, times, dates, runs = rail_cut(data)
    out_routes, out_trips = {}, []
    for tid, t in trips.items():
        seq = times[tid] = reach(sorted(times.get(tid, ())), stations)
        if len(seq) < 2 or not t["trip_short_name"].isdigit():
            continue
        r, ours = routes[t["route_id"]]
        name = line_name(r)
        rid = f"{ours}:{name}"
        out_routes.setdefault(rid, {"route_id": rid, "agency_id": ours, "route_short_name": name, "route_long_name": "",
                                    "route_type": "2", "route_color": color(name)})
        out_trips.append({"route_id": rid, "service_id": t["service_id"], "trip_id": tid, "trip_headsign": t["trip_headsign"],
                          "trip_short_name": t["trip_short_name"], "direction_id": t["direction_id"], "_start": seq[0][3]})
    # A number is one train's on its day, but a train that splits or joins
    # (or runs on past midnight under another service) is two trips of one
    # number on one day: each trip of a railroad's number takes the first
    # slot ("4974", then "4974~1") no trip of that number on one of its days
    # holds, in order of first departure; the page shows the number before
    # the "~".
    slots = defaultdict(list)
    for t in sorted(out_trips, key=lambda t: (t["_start"], t["trip_id"])):
        held, mine = slots[(t["route_id"].split(":")[0], t["trip_short_name"])], runs[t["service_id"]]
        k = next((i for i, d in enumerate(held) if not d & mine), len(held))
        if k == len(held):
            held.append(set())
        held[k] |= mine
        t["trip_short_name"] += f"~{k}" if k else ""
    kept = {t["trip_id"] for t in out_trips}
    services = {t["service_id"] for t in out_trips}
    used = {c for tid in kept for _, c, *_ in times[tid]}

    def table(rows, cols):
        buf = io.StringIO()
        w = csv.DictWriter(buf, cols, extrasaction="ignore", lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
        return buf.getvalue()

    st = io.StringIO()
    st.write("trip_id,arrival_time,departure_time,stop_id,stop_sequence,pickup_type,drop_off_type\n")
    for tid in sorted(kept):
        for seq, c, arr, dep, pick, drop in times[tid]:
            st.write(f"{tid},{arr},{dep},{c},{seq},{pick},{drop}\n")
    agency = [{"agency_id": a, "agency_name": AGENCIES[a]["name"], "agency_url": "https://gtfs.ovapi.nl/", "agency_timezone": TZ}
              for a in AGENCIES]
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=1) as z:
        z.writestr("agency.txt", table(agency, ["agency_id", "agency_name", "agency_url", "agency_timezone"]))
        z.writestr("routes.txt", table(sorted(out_routes.values(), key=lambda r: r["route_id"]),
                                       ["route_id", "agency_id", "route_short_name", "route_long_name", "route_type", "route_color"]))
        z.writestr("trips.txt", table(out_trips, ["route_id", "service_id", "trip_id", "trip_headsign", "trip_short_name", "direction_id"]))
        z.writestr("stops.txt", table([s for c, s in sorted(stations.items()) if c in used], ["stop_id", "stop_name", "stop_lat", "stop_lon"]))
        z.writestr("stop_times.txt", st.getvalue())
        z.writestr("calendar_dates.txt", table([c for c in dates if c["service_id"] in services], ["service_id", "date", "exception_type"]))
    return out.getvalue()


EXTRAS = {"convert": convert, "number": lambda t: t.get("trip_short_name") or None, "tz": TZ,
          "headers": {"User-Agent": IDENTIFYING_UA, "Accept-Encoding": "gzip"}}  # as OVapi's usage policy asks
# Stations placed where the track reaches them ({railroad: {code: [lat,
# lon]}}): Roodeschool moved onto the Eemshaven line when it opened (2018),
# 250 m west of the old station the file still places it at.
POSITIONS = {"nlregio": {"rd": [53.4198, 6.7572]}}
GTFS = {a: (GTFS_URL, lambda r, a=a: r["agency_id"] == a, lambda r: r["route_short_name"],
            {**EXTRAS, "positions": POSITIONS.get(a, {})}) for a in AGENCIES}

# The track: the Netherlands' lines (OpenStreetMap, Geofabrik's extract) and
# the lines over the borders its trains run on, to Brussel-Zuid and
# Antwerpen, Liège-Guillemins, Aachen, Köln, Düsseldorf, Münster, Bad
# Bentheim and Leer, routed from the timetable along OSM's track
# (build_rail.py; scripts/osm_tiles.py's Netherlands, Belgium, Nordrhein-
# Westfalen and Niedersachsen extracts).
RAIL = {"region": "nl", "bbox": BBOX, "network": "ns"}


# ---------- Live: OVapi's GTFS-Realtime trainUpdates ----------
# gtfs.ovapi.nl/nl/trainUpdates.pb (no key; rebuilt every minute or so from
# NS's InfoPlus DVS: every train's departures, whichever railway runs it, a
# day ahead): a trip update per train, its trip id the timetable's (stable
# between OVapi's daily files, not across our weekly one), its number in
# OVapi's TripDescriptor extension (1003: realtime_trip_id "IFF:SPR:4974",
# trip_short_name "4974"), each stop's delay in seconds (and its time), its
# station's code in the StopTimeUpdate extension (1003.4: "ut") and its
# platform (1003.2 planned, 1003.3 changed). 1.5 MB a minute, 470 KB
# gzipped, with no CORS headers: the relay asks once a minute (ttl 60, as
# OVapi's usage policy allows without conditional requests), names itself in
# its User-Agent, accepts gzip, and passes on a compact JSON of the trains
# (compact(), below, and its Worker twin relay/feeds/nl.js):
#   {"at": feed time (unix s),
#    "trips": [[service date "20261024", train number "4974", cancelled 0/1,
#               [[station code, arrival delay s, departure delay s, skipped 0/1], ...]], ...]}
# a stop listed only where it differs from the one before (a train on time
# throughout is one row) or is skipped (a skipped stop with no times carries
# the delay before it), added trains (not in the timetable) left out. The
# page (js/railroads/nl.js) finds each train of its timetable by its number
# and service day. No positions: vehiclePositions.pb has no trains.
SOURCES = [{"id": "nl", "agencies": list(AGENCIES), "format": "json", "interval": 60, "relay": True, "needsKey": False,
            "scope": "view"}]
RELAY = {"nl": {"ttl": 60}}
TRAIN_UPDATES = "https://gtfs.ovapi.nl/nl/trainUpdates.pb"


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
    """A protobuf message's fields: (number, wire type, value) where value
    is an int (varint) or the bytes' (start, end)."""
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


def _int32(v):
    v &= 0xFFFFFFFF
    return v - (1 << 32) if v & 0x80000000 else v


def compact(feed):
    """The relay's answer from the trainUpdates protobuf (bytes): see above."""
    at, trips = 0, []
    text = lambda v: feed[v[0]:v[1]].decode()
    for f, w, v in _fields(feed):
        if f == 1 and w == 2:  # header: timestamp 3
            at = next((hv for hf, hw, hv in _fields(feed, *v) if hf == 3 and hw == 0), at)
        if f != 2 or w != 2:
            continue
        tu = next((x for ef, ew, x in _fields(feed, *v) if ef == 3 and ew == 2), None)  # trip_update
        if not tu:
            continue
        desc, number, updates = {}, None, []
        for uf, uw, uv in _fields(feed, *tu):
            if uf == 1 and uw == 2:  # trip: start_date 3, relationship 4; OVapi's 1003: trip_short_name 2
                for df, dw, dv in _fields(feed, *uv):
                    if df == 1003 and dw == 2:
                        number = next((text(xv) for xf, xw, xv in _fields(feed, *dv) if xf == 2 and xw == 2), number)
                    else:
                        desc[df] = text(dv) if dw == 2 else dv
            elif uf == 2 and uw == 2:  # stop_time_update: seq 1, arrival 2, departure 3, relationship 5; 1003: station 4
                u = {}
                for sf, sw, sv in _fields(feed, *uv):
                    if sf in (2, 3) and sw == 2:
                        u[sf] = next((_int32(x) for ef, ew, x in _fields(feed, *sv) if ef == 1 and ew == 0), None)
                    elif sf == 5 and sw == 0:
                        u[5] = sv
                    elif sf == 1003 and sw == 2:
                        u[4] = next((text(xv) for xf, xw, xv in _fields(feed, *sv) if xf == 4 and xw == 2), None)
                updates.append(u)
        if desc.get(4) == 1 or not desc.get(3) or not (number or "").isdigit():  # an added train, or none to find
            continue
        stops, last = [], None
        for u in updates:  # in the train's order, as the feed lists them
            skipped = 1 if u.get(5) == 1 else 0
            arr, dep = u.get(2), u.get(3)
            if not u.get(4) or (arr is None and dep is None and not skipped):  # a station passed, no times
                continue
            arr, dep = arr if arr is not None else dep, dep if dep is not None else arr
            if arr is None:  # skipped, with no times: the delay it carries on with
                arr = dep = last[2] if last else 0
            row = [u[4], arr or 0, dep or 0, skipped]
            # Every skipped stop is listed (the page marks only the stop a row names).
            if last is None or skipped or row[1:] != last[1:]:
                stops.append(row)
            last = row
        cancelled = 1 if desc.get(4) == 3 else 0
        if stops or cancelled:
            trips.append([desc[3], number, cancelled, stops])
    trips.sort()
    return {"at": at, "trips": trips}


def relay_fetch(env, source_id, query=None):
    """The relay's answer: the same bytes as relay/feeds/nl.js."""
    req = urllib.request.Request(TRAIN_UPDATES, headers={"User-Agent": IDENTIFYING_UA, "Accept-Encoding": "gzip"})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = r.read()
    data = gzip.decompress(data) if data[:2] == b"\x1f\x8b" else data
    return json.dumps(compact(data), separators=(",", ":")).encode(), "application/json"


# ---------- Formations: open, keyless, but not wired yet ----------
# OVapi's feeds carry no rolling stock. NDOV Loket (GOVI, Stichting OpenGeo)
# publishes NS's InfoPlus CC0 and keyless, but only as best-effort ZeroMQ
# streams (tcp://pubsub.besteffort.ndovloket.nl:7664, ZMTP 3, SUB; each
# message an envelope and a gzipped XML; fair use: one connection per
# consumer per stream), which the relay can't read without a long-lived
# connection (a Durable Object holding a cloudflare:sockets connection):
#   /RIG/InfoPlusDVSInterface4  every train's departure from every station,
#     with its units in order (MaterieelDeelDVS: MaterieelSoort,
#     MaterieelAanduiding, MaterieelNummer "000000-09564-0" for NS's units,
#     none for the others', MaterieelDeelVolgordeVertrek 1 = first in the
#     direction it leaves), for NS, NS International, Arriva, Blauwnet,
#     RRReis, R-net and VIAS alike;
#   /RIG/NStreinpositiesInterface5  NS's units' GPS positions (TreinNummer,
#     MaterieelDeelNummer, Materieelvolgnummer, lat/lon, speed, heading),
#     every 10 s, NS's own units only (about 215 trains early on a Saturday).
# NS's own APIs (apiportal.ns.nl: virtual train with each unit's type and
# number, train positions) need a free key (Ocp-Apim-Subscription-Key).
# If the lead wires one of these, a train's cars reach the page as every
# detail source's do (t.cars), ONE ENTRY PER UNIT (materieeldeel), in order:
#   numbers  the unit's number, "9564", "2448" ("" for the regional railways')
#   models   "<MaterieelSoort> <MaterieelAanduiding>", as InfoPlus writes them
#   orders   1, 2, ... (MaterieelDeelVolgordeVertrek)
#   classes  "" each (InfoPlus gives none)
# The models seen in two minutes of DVS (24 October 2026), by railway:
#   NS: "VIRM 4", "VIRM 6", "ICM 3", "ICM 4", "ICNG 5", "DDZ 4", "DDZ 6",
#       "SLT 4", "SLT 6", "SLT 6S", "SNG 3", "SNG 3T", "SNG 4", "SNG 4T",
#       "FLIRT FFF 3", "FLIRT FFF 4"; R-net (NS): "FLIRT TAG 2";
#       NS International: "ICNG 8B" (with "ICE", "Eurostar" and the like
#       expected for the others, not seen yet)
#   Arriva: "FLIRT ARL 2/6", "FLIRT ARL 2/8", "GTW-D-ARG 2/6", "GTW-D-ARG
#       2/8", "GTW-D-ARL 2/8", "GTW-E-ARL 2/6", "WI WI" (Stadler WINK)
#   Blauwnet: "GTW-E-ARV 2/6", "GTW-E-ARV 2/8" (Arriva), "FLIRT KZE 3"
#       (Keolis); RRReis: "GTW-D-ARR 2/6", "GTW-D-ARR 2/8" (Arriva), "FLIRT
#       CO 3" (Keolis); R-net (Qbuzz): "GTW-E-QB 2/6"; VIAS: "FLIRT AB 5"
# NS's unit numbers by type, as seen: VIRM 4 94xx-95xx, VIRM 6 86xx-87xx,
# ICM 3 40xx, ICM 4 42xx, ICNG 5 31xx, ICNG 8B 33xx, DDZ 4 75xx, DDZ 6 76xx,
# SLT 4 24xx, SLT 6 26xx, SNG 3 23xx and 30xx, SNG 4 27xx, FLIRT FFF 3 22xx,
# FLIRT FFF 4 25xx, FLIRT TAG 2 201x.
