"""Sweden's passenger trains: SJ and the other long-distance operators, the
airport train, and the regional and commuter trains of every county, from
Trafikverket's open API (live) and Samtrafiken's national timetable, GTFS
Sweden 3 (Trafiklab, CC0).

Live: Trafikverket's open API (api.trafikinfo.trafikverket.se, CC0) needs a
free key (register at https://data.trafikverket.se, the Worker secret
TRAFIKVERKET_API_KEY). The relay asks it for every train's last GPS fix
(TrainPosition: by its advertised number, with speed and heading) and the
departures the trains have made in the last 20 minutes (TrainAnnouncement:
advertised and actual times, the product it runs as, "SJ Snabbtåg", its
owner and destination), joins them by train number and sends one compact
answer (relay_fetch below, and its Worker twin relay/feeds/sweden.js). Until
the key is set, every railroad's trains are placed from its timetable,
marked as estimated.

Trains are numbered by their advertised number (Trafikverket's
AdvertisedTrainIdent, "531", "1029", "8901"), which the timetable files as
each trip's short name or, where that is blank, as
samtrafiken_internal_trip_number; the two agree on every train checked
(October 2026). A train's railroad comes from its product (the parser's
PRODUCTS), else from the timetable that has its number. Its stops come from
its run in data/schedules/<railroad>.json, shifted by its delay. The parser
is js/railroads/sweden.js.

Left out: Roslagsbanan, Saltsjöbanan and Lidingöbanan (filed as trams, route
type 900, with the trams and the metro), heritage railways (Lennakatten,
Smalspåret), Inlandsbanan (a summer train, June to August, not in the
timetable in October), FlixTrain (it left Sweden; no train of its in the
timetable or Trafikverket's products) and SJ Norge's Trondheim-Storlien
trains and Vy's Oslo-Stockholm and Oslo-Göteborg trains (Entur's, already on
the map as sjnord and vy: scripts/railroads/entur.py). Upptåget is no more:
its Gävle-Uppsala trains run as Mälartåg."""
import datetime, json, re, time, unicodedata, urllib.request

TRAFIKVERKET = {"label": "Trafikverket", "href": "https://data.trafikverket.se"}
BOX = [10.9, 55.3, 24.2, 69.1]  # Sweden, with Copenhagen and Narvik
# Colors: each operator's own (its trains' livery or its website's), as on
# its trains and timetables.
AGENCIES = {
    "sj": {"name": "SJ", "short": "SJ", "color": "#2b2d42", "kind": "intercity", "region": "Sweden", "bbox": BOX},
    "snalltaget": {"name": "Snälltåget", "short": "Snälltåget", "color": "#f28c00", "kind": "intercity", "region": "Sweden",
                   "bbox": [10.5, 52.4, 18.2, 63.4]},
    "tagab": {"name": "Tågab", "short": "Tågab", "color": "#c8102e", "kind": "intercity", "region": "Sweden",
              "bbox": [11.9, 56.8, 18.2, 60.7]},
    # MTR Express (MTRX) until VR bought it in May 2024; its Stockholm-Göteborg
    # trains have run as VR's since August 2024 (VR Snabbtåg Sverige), in
    # VR's green (Finland's VR, digitraffic.py). The timetable still files
    # them as "MTR Express AB", route "MTRX"; the id stays.
    "mtrx": {"name": "VR Snabbtåg", "short": "VR", "color": "#3fa535", "kind": "intercity", "region": "Sweden",
             "bbox": [11.9, 57.6, 18.1, 59.4]},
    "arlandaexpress": {"name": "Arlanda Express", "short": "Arlanda Express", "color": "#f5c400", "kind": "intercity",
                       "region": "Stockholm", "bbox": [17.9, 59.3, 18.0, 59.66]},
    "slpendel": {"name": "SL Pendeltåg", "short": "SL", "color": "#ec619f", "kind": "commuter", "region": "Stockholm",
                 "bbox": [17.3, 58.9, 18.2, 59.9]},
    "malartag": {"name": "Mälartåg", "short": "Mälartåg", "color": "#0067b1", "kind": "commuter", "region": "Mälardalen",
                 "bbox": [14.9, 58.5, 18.1, 60.7]},
    "ostgotapendeln": {"name": "Östgötapendeln", "short": "Östgötapendeln", "color": "#e2001a", "kind": "commuter",
                       "region": "Östergötland", "bbox": [14.9, 58.0, 16.3, 58.7]},
    "tib": {"name": "Tåg i Bergslagen", "short": "TiB", "color": "#c0311a", "kind": "commuter", "region": "Bergslagen",
            "bbox": [14.5, 58.3, 17.2, 61.0]},
    "norrtag": {"name": "Norrtåg", "short": "Norrtåg", "color": "#002561", "kind": "commuter", "region": "Norrland",
                "bbox": [12.0, 62.3, 24.2, 68.5]},
    "varmlandstag": {"name": "Värmlandstrafik", "short": "Värmlandstrafik", "color": "#00843d", "kind": "commuter",
                     "region": "Värmland", "bbox": [12.2, 59.2, 14.4, 60.2]},
    "xtaget": {"name": "X-Tåget", "short": "X-Tåget", "color": "#d50032", "kind": "commuter", "region": "Gävleborg",
               "bbox": [16.0, 60.6, 17.4, 62.4]},
    "pagatag": {"name": "Pågatåg", "short": "Pågatåg", "color": "#7b2c83", "kind": "commuter", "region": "Skåne",
                "bbox": [12.6, 55.3, 14.4, 56.5]},
    "oresundstag": {"name": "Öresundståg", "short": "Öresundståg", "color": "#d72b14", "kind": "commuter",
                    "region": "Öresund", "bbox": [12.5, 55.5, 16.4, 57.8]},
    "vasttag": {"name": "Västtågen", "short": "Västtågen", "color": "#0071b9", "kind": "commuter",
                "region": "Västra Götaland", "bbox": [11.1, 57.1, 14.3, 59.0]},
    "krosatag": {"name": "Krösatåg", "short": "Krösatåg", "color": "#d6492a", "kind": "commuter", "region": "Småland",
                 "bbox": [12.8, 56.0, 16.6, 58.5]},
}
# Every railroad shares the country, zone, credit and licence; the cars
# files are js/railroads/sesj.cars.js (the long-distance trains), sesouth
# (Skåne, Öresund, Västra Götaland, Småland) and senorth (the rest).
CARS = {"sesj": ("sj", "snalltaget", "tagab", "mtrx", "arlandaexpress"),
        "sesouth": ("pagatag", "oresundstag", "vasttag", "krosatag"),
        "senorth": ("slpendel", "malartag", "ostgotapendeln", "tib", "norrtag", "varmlandstag", "xtaget")}
_prev = None
for _aid, _a in AGENCIES.items():
    _a.update(country="SE", tz="Europe/Stockholm", credit=TRAFIKVERKET, license="CC0 1.0",
              cars=next(f for f, ids in CARS.items() if _aid in ids), **({"after": _prev} if _prev else {}))
    _prev = _aid

# Trafikverket asks no fixed limit of its open API but watches each key's
# traffic. The relay asks every 30 s (two queries in one request), keeping
# the answer as long, so each Worker instance (one per busy Cloudflare
# location) sends two requests a minute however many people watch, and the
# station names once a day.
SOURCES = [{"id": "sweden", "agencies": list(AGENCIES), "format": "json", "interval": 30, "relay": True,
            "needsKey": "TRAFIKVERKET_API_KEY", "untilKey": "timetable", "scope": "view"}]
RELAY = {"sweden": {"keys": ["TRAFIKVERKET_API_KEY"], "ttl": 30}}

API = "https://api.trafikinfo.trafikverket.se/v2/data.json"
# Every train that has reported a position in the last ten minutes and has
# an advertised number (a passenger train; freight trains have only an
# operational one): its GPS fix (WGS84 "POINT (lon lat)"), heading (degrees),
# speed (km/h) and the fix's time.
POSITIONS = ('<QUERY objecttype="TrainPosition" namespace="järnväg.trafikinfo" schemaversion="1.1">'
             '<FILTER><AND><GT name="TimeStamp" value="$dateadd(-0.00:10:00)"/>'
             '<EXISTS name="Train.AdvertisedTrainNumber" value="true"/></AND></FILTER>'
             + "".join(f"<INCLUDE>{f}</INCLUDE>" for f in ("Train.AdvertisedTrainNumber", "Position.WGS84", "Bearing",
                                                           "Speed", "TimeStamp")) + "</QUERY>")
# The advertised departures made in the last 20 minutes: each train's delay
# at its last stop, and what it runs as (the product, "SJ Snabbtåg"; its
# owner, "SJ"; its operator, "SJ") and to where (station signatures, "G").
# Rows of places a train only passes carry none of that, so only advertised
# departures are asked for: one or two per train.
DEPARTURES = ('<QUERY objecttype="TrainAnnouncement" schemaversion="1.9" orderby="TimeAtLocation">'
              '<FILTER><AND><EQ name="Advertised" value="true"/><EQ name="ActivityType" value="Avgang"/>'
              '<GT name="TimeAtLocation" value="$dateadd(-0.00:20:00)"/></AND></FILTER>'
              + "".join(f"<INCLUDE>{f}</INCLUDE>" for f in ("AdvertisedTrainIdent", "LocationSignature", "AdvertisedTimeAtLocation",
                                                            "TimeAtLocation", "ProductInformation", "InformationOwner",
                                                            "Operator", "ToLocation", "Canceled")) + "</QUERY>")
# The stations' names by signature ("Cst": "Stockholm C"), asked once a day.
STATIONS = ('<QUERY objecttype="TrainStation" namespace="rail.infrastructure" schemaversion="1.4">'
            '<FILTER><EQ name="Advertised" value="true"/></FILTER>'
            "<INCLUDE>LocationSignature</INCLUDE><INCLUDE>AdvertisedLocationName</INCLUDE></QUERY>")
STATION_HOURS = 24
IDENTIFYING_UA = "Trainsheet/1.0 (+https://trainsheet.com)"


def request(key, *queries):
    """The REQUEST document for queries, the key escaped as XML."""
    key = key.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;")
    return f'<REQUEST><LOGIN authenticationkey="{key}"/>{"".join(queries)}</REQUEST>'.encode()


def post(body):
    req = urllib.request.Request(API, data=body, headers={"Content-Type": "text/xml; charset=utf-8", "User-Agent": IDENTIFYING_UA})
    with urllib.request.urlopen(req, timeout=20) as r:
        results = json.loads(r.read())["RESPONSE"]["RESULT"]
    error = next((r["ERROR"] for r in results if r.get("ERROR")), None)
    if error:
        raise RuntimeError(f"Trafikverket: {error.get('MESSAGE', error)}")
    return results


def seconds(iso):
    """Unix seconds of an ISO time with its offset ("2026-10-19T10:20:00.000+02:00")."""
    return int(datetime.datetime.fromisoformat(re.sub(r"\.\d+", "", iso)).timestamp()) if iso else None


def point(wkt):
    """[lat, lon] of "POINT (18.05 59.33)" (longitude first)."""
    m = re.match(r"POINT \(([-\d.]+) ([-\d.]+)\)", wkt or "")
    return [round(float(m[2]), 5), round(float(m[1]), 5)] if m else None


def first(items, field):
    return next((x.get(field) for x in items or [] if x.get(field)), None)


def compact(positions, departures, names):
    """The relay's answer: {"at": unix seconds, "trains": [...]}, one entry a
    train with a position, by its advertised number "n": "pos" [lat, lon],
    "heading", "speed" (km/h), "ts" (the fix's unix seconds); and from its
    latest departure, where it has one: "product", "owner", "operator",
    "to" (station name), "last" (the station), "lastTs", "delay" (minutes,
    actual less advertised; negative when early). Shared with
    relay/feeds/sweden.js: the same input gives the same JSON."""
    latest = {}
    for d in departures:
        n = d.get("AdvertisedTrainIdent")
        if n and d.get("TimeAtLocation") and not d.get("Canceled"):
            if n not in latest or d["TimeAtLocation"] >= latest[n]["TimeAtLocation"]:
                latest[n] = d
    trains = []
    for p in positions:
        n = (p.get("Train") or {}).get("AdvertisedTrainNumber")
        pos = point((p.get("Position") or {}).get("WGS84"))
        if not n or not pos:
            continue
        t = {"n": n, "pos": pos, "heading": p.get("Bearing"), "speed": p.get("Speed"), "ts": seconds(p.get("TimeStamp"))}
        d = latest.get(n)
        if d:
            # The destination: the last of its "to" stations, by their order.
            to = max(d.get("ToLocation") or [{}], key=lambda x: x.get("Order") or 0).get("LocationName")
            actual, planned = seconds(d.get("TimeAtLocation")), seconds(d.get("AdvertisedTimeAtLocation"))
            t.update(product=first(d.get("ProductInformation"), "Description"), owner=d.get("InformationOwner"),
                     operator=d.get("Operator"), to=names.get(to, to), last=names.get(d.get("LocationSignature"), d.get("LocationSignature")),
                     lastTs=actual, delay=round((actual - planned) / 60) if actual and planned else None)
        trains.append({k: v for k, v in t.items() if v is not None})
    trains.sort(key=lambda t: t["n"])
    return {"at": int(time.time()), "trains": trains}


_names = {"at": 0, "names": {}}


def relay_fetch(env, source_id):
    """The compact answer (compact(), above): the same bytes as
    relay/feeds/sweden.js. The station names are kept a day; if they can't
    be had, the signatures stand in."""
    key = env["TRAFIKVERKET_API_KEY"]
    if time.time() - _names["at"] > STATION_HOURS * 3600:
        try:
            rows = post(request(key, STATIONS))[0].get("TrainStation", [])
            _names.update(at=time.time(), names={r["LocationSignature"]: r["AdvertisedLocationName"] for r in rows
                                                 if r.get("LocationSignature") and r.get("AdvertisedLocationName")})
        except Exception:
            pass
    results = post(request(key, POSITIONS, DEPARTURES))
    out = compact(results[0].get("TrainPosition", []), results[1].get("TrainAnnouncement", []), _names["names"])
    return json.dumps(out, ensure_ascii=False, separators=(",", ":")).encode(), "application/json"


# ---------- The timetable ----------
# GTFS Sweden 3, Samtrafiken's national timetable (every operator's buses,
# boats and trains, 815 MB; CC0), as the Mobility Database keeps it
# (mdb-2939; Samtrafiken's own link needs a Trafiklab key). Each railroad is
# an operator in it, by the code its agency ids end in (agency
# "500000000000000186" and route ids "9011186..." are Pågatåg's 186): four of
# them are Krösatåg (164 Syd, 189 Kalmar's, 190 Öst, 192 Nord). Its other
# rail operators are Entur's trains, heritage railways and Värmlandstrafik's
# own copy of its trains (017: the same runs as 170's).
GTFS_URL = "https://files.mobilitydatabase.org/mdb-2939/latest.zip"
OPERATORS = {"100": "sj", "128": "snalltaget", "137": "tagab", "159": "mtrx", "109": "arlandaexpress",
             "185": "slpendel", "174": "malartag", "188": "ostgotapendeln", "181": "tib", "134": "norrtag",
             "170": "varmlandstag", "171": "xtaget", "186": "pagatag", "110": "oresundstag", "187": "vasttag",
             "164": "krosatag", "189": "krosatag", "190": "krosatag", "192": "krosatag"}
operator = lambda r: OPERATORS.get((r.get("agency_id") or "")[-3:])
rail = lambda r: r.get("route_type") == "2" or 100 <= int(r.get("route_type") or 0) <= 117


def keep(agency):
    """A railroad's routes. SJ files each replacement bus as a route of its
    own named by the train it stands in for ("165", its runs 60165): not
    trains."""
    return lambda r: rail(r) and operator(r) == agency and not (agency == "sj" and r.get("route_long_name", "").isdigit())


# A train's number: its advertised one (see above).
number = lambda t: t.get("trip_short_name") or t.get("samtrafiken_internal_trip_number") or None
# Buses filed as a railroad's trains, by their numbers: SJ's replacement
# buses (60165, 70010, 80621: a five-digit number from 6 to 8),
# Snälltåget's connecting buses to the ski resorts and Växjö (3900, 13908,
# 43900; 90306, 93940) and Värmlandstrafik's (58926, 68910). For the cut of
# the national file (feeds.py, extras "cut"), which keeps the trips this
# says are trains.
BUSES = {"sj": r"[678]\d{4}", "snalltaget": r"\d?39\d\d|9\d{4}", "varmlandstag": r"[56]\d{4}"}


def train(t, r):
    pattern = BUSES.get(operator(r))
    return not (pattern and re.fullmatch(pattern, number(t) or ""))


# Line names, as riders know them. The timetable files every train as a
# route of its own (named by its number, or by the brand), so a line is the
# brand: SJ's by its kind of train (route type: 101 high-speed, 103
# inter-regional, 105 sleeper, 100 and 106 regional), as Trafikverket's
# products name them; SL's commuter trains by their line numbers
# ("Pendeltåg 40"); Krösatåg by its four networks; Värmlandstrafik by its two
# lines.
SJ_LINES = {"101": "SJ Snabbtåg", "103": "SJ InterCity", "105": "SJ Nattåg", "100": "SJ Regional", "106": "SJ Regional"}
BRANDS = {"tagab": "Tågab", "mtrx": "VR Snabbtåg", "arlandaexpress": "Arlanda Express", "malartag": "Mälartåg",
          "ostgotapendeln": "Östgötapendeln", "tib": "Tåg i Bergslagen", "norrtag": "Norrtåg", "xtaget": "X-Tåget",
          "pagatag": "Pågatåg", "oresundstag": "Öresundståg", "vasttag": "Västtågen"}
KROSA = {"164": "Krösatåg Syd", "189": "Krösatåg Kalmar", "190": "Krösatåg Öst", "192": "Krösatåg Nord"}


def line(r):
    a, code = operator(r), (r.get("agency_id") or "")[-3:]
    if a == "sj":
        return SJ_LINES.get(r["route_type"], "SJ Regional")
    if a == "snalltaget":
        return "Snälltåget nattåg" if r["route_type"] == "105" else "Snälltåget"
    if a == "slpendel":
        return f"Pendeltåg {r['route_short_name']}"
    if a == "krosatag":
        return KROSA[code]
    if a == "varmlandstag":  # "Charlottenberg-Karlstad-Örebro", "Torsby-Karlstad"
        return r["route_long_name"].replace("-", "–")
    return BRANDS[a]


# Stations: the timetable merges several registries, so one station can be
# two or three stops ("Kalmar central", "Kalmar Centralstation"; "Falun TÅG",
# "Falun central", "Falun resecentrum"), its platforms under each. Stops fold
# into one station a name, the name as riders see it on the signs and
# Trafikverket's boards: the words for station, travel centre and bus
# terminal dropped, what's in brackets too, and a central station "C"
# ("Stockholm C"). Station ids are the names without the "C" (so "Falun C"
# and "Falun" are one), with the Swedish letters spelled plainly.
CUT_WORDS = re.compile(r"\s+(station|stasjon|järnvägsstation(en)?|jvstn|jvg|bstn|nya|resecentrum|resec|reseC|"
                       r"tåg|tät|busstation|bussterminal|hållplats|lennakatten|e10)$", re.I)
CENTRAL = re.compile(r"\s+(centralstation|central|c/resecentrum|C)$", re.I)
# A quarter of a town is capitalized, as on the signs ("Abisko östra":
# "Abisko Östra"). Then names in the genitive before the dropped word
# ("Hallsbergs resecentrum"), those filed without their town ("Södra
# station" is Örebro's, "Västra Station" Östersund's) and a few more are
# put right. The fold is by name alone: no two stations of one railroad
# share a name (checked on the October 2026 timetable).
QUARTER = re.compile(r"\s(norra|södra|västra|östra|syd)$")
NAMES = {"Hallsbergs": "Hallsberg", "Ljusdals": "Ljusdal", "Sölvesborgs": "Sölvesborg", "Sundsvalls Västra": "Sundsvall Västra",
         "Linghems": "Linghem", "Mantorps": "Mantorp", "Boxholms": "Boxholm", "Björketorps": "Björketorp",
         "Falerums": "Falerum", "Kolmårdens": "Kolmården", "Nykvarns": "Nykvarn", "Stenungsunds": "Stenungsund",
         "Hudiksvalls": "Hudiksvall", "Åtvidabergs": "Åtvidaberg", "Stockholms Södra": "Stockholm Södra",
         "Ängelsbergs": "Ängelsberg", "Ställdalens": "Ställdalen", "Marielunds": "Marielund", "Nyköpings": "Nyköping",
         "Varbergs": "Varberg", "Södra": "Örebro Södra", "Västra": "Östersund Västra", "Solna station Norra": "Solna",
         "Abisko Turist": "Abisko turiststation", "Kiruna malmbangård": "Kiruna", "Stockaryd Järnvägsparken": "Stockaryd",
         "Köbenhavn Syd": "København Syd", "Höje Taastrup": "Høje Taastrup", "Lilleström": "Lillestrøm",
         "Kitzbuehel": "Kitzbühel"}
LETTERS = str.maketrans({"å": "a", "ä": "a", "ö": "o", "ø": "o", "æ": "ae"})


def station(name):
    """(station id, name) of a stop: "Hallsbergs resecentrum" -> ("hallsberg",
    "Hallsberg"); "Kalmar central" -> ("kalmar", "Kalmar C")."""
    name = re.sub(r"\s*\([^)]*\)", "", name).strip()
    central = False
    while True:
        cut = CUT_WORDS.sub("", name)
        if CENTRAL.search(cut):
            cut, central = CENTRAL.sub("", cut), True
        if cut == name:
            break
        name = cut
    name = QUARTER.sub(lambda m: " " + m[1].capitalize(), name)
    name = NAMES.get(name, name)
    base = name[:-2] if name.endswith(" C") else name
    plain = unicodedata.normalize("NFKD", base.lower().translate(LETTERS)).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", plain).strip("-"), base + " C" if central or name.endswith(" C") else name


EXTRAS = {"number": number, "cut": train, "tz": "Europe/Stockholm"}
GTFS = {a: (GTFS_URL, keep(a), line, station, EXTRAS) for a in AGENCIES}

# The track: Sweden's main and branch lines (OpenStreetMap), with the lines
# into Copenhagen, Oslo and Narvik routed from the timetables along OSM's
# track (build_rail.py).
RAIL = {"region": "se", "bbox": BOX, "network": "sj",
        "query": 'area["ISO3166-1"="SE"]["admin_level"="2"]->.se;'
                 'way["railway"="rail"]["usage"~"^(main|branch)$"][!"service"](area.se)({bbox});'}
