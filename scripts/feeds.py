"""The railroads' timetable feeds, and what every build script reads them
with: the GTFS table (a railroad's feed, the routes that are its trains, the
line names the map uses, how its stops fold into stations), the download,
the CSV reader and the clock. Imported by scripts/build_*.py (which used to
carry their own copies, or read the top of build_stations.py); nothing here
runs on its own.
"""
import csv, gzip, io, json, pathlib, re, ssl, sys, time, unicodedata, urllib.parse, urllib.request, zipfile

import netex
from railroads import load

DATA = pathlib.Path(__file__).resolve().parent.parent / "data"
# Amtrak's and VIA's own timetables (Amtrak's also carries Shore Line East
# and other commuter trains).
AMTRAK_GTFS = "https://content.amtrak.com/content/gtfs/GTFS.zip"
VIA_GTFS = "https://www.viarail.ca/sites/all/files/gtfs/viarail.zip"
MDB = "https://files.mobilitydatabase.org/{}/latest.zip"

# agency: (GTFS url, route filter(route row) -> bool, line name(route row) -> str)
rail = lambda r: r.get("route_type") == "2"
long_name = lambda r: (r.get("route_long_name") or r.get("route_short_name") or "").strip()
EXO_GTFS = "https://exo.quebec/uploads/ressources-telechargeables/a-propos/donnees-ouvertes/trains/google_transit.zip"
exo_line = lambda r: re.sub(r"^\d+\s*-\s*", "", long_name(r)).replace("/", "-")


def slug(name):
    """A name as an id: "Gare Vaudreuil/Hudson" -> "gare-vaudreuil-hudson",
    accents dropped. A name in another script than Latin keeps its letters
    ("תל אביב - מרכז" -> "תל-אביב-מרכז"), which dropping them would leave empty."""
    name = unicodedata.normalize("NFKD", name.lower())
    if all(c.isascii() or unicodedata.name(c, "").startswith("LATIN") for c in name if c.isalnum()):
        return re.sub(r"[^a-z0-9]+", "-", name.encode("ascii", "ignore").decode()).strip("-")
    return re.sub(r"-+", "-", "".join(c if c.isalnum() or unicodedata.combining(c) else "-"
                                      for c in unicodedata.normalize("NFC", name))).strip("-")


# NCTD's stop names: "Oceanside Transit Center Platform 3" -> "Oceanside Transit Center".
NCTD_WORDS = {"Rd": "Road", "Dr": "Drive", "Blvd": "Boulevard", "St": "Street", "Hwy": "Highway"}
nctd_name = lambda name: re.sub(r"\b(Rd|Dr|Blvd|St|Hwy)$", lambda m: NCTD_WORDS[m.group(1)],
                               re.sub(r"\s+(Platform\s+\d+|Station)$", "", name.strip()).replace("San Diego - ", "San Diego ").replace("Civic Center - Vista", "Vista Civic Center"))
# The Alaska Railroad's trains by route: one line for both directions.
ALASKA_LINES = {"DenaliNB": "Denali Star", "DenaliSB": "Denali Star", "AuroraNB": "Aurora Winter Train", "AuroraSB": "Aurora Winter Train",
                "CoastalNB": "Coastal Classic", "CoastalSB": "Coastal Classic", "Glacier": "Glacier Discovery", "Hurricane": "Hurricane Turn"}
GTFS = {
    "lirr": ("https://rrgtfsfeeds.s3.amazonaws.com/gtfslirr.zip", lambda r: True, long_name),
    "mnr": ("https://rrgtfsfeeds.s3.amazonaws.com/gtfsmnr.zip", lambda r: True, long_name),
    "mbta": ("https://cdn.mbta.com/MBTA_GTFS.zip", rail, lambda r: long_name(r).replace("/", " / ")),
    "septa": (MDB.format("mdb-503"), lambda r: True,
              lambda r: long_name(r) if long_name(r).endswith("Line") else long_name(r) + " Line"),
    "njt": (MDB.format("mdb-509"), rail, long_name),  # the feed also has its light rail lines
    "metra": (MDB.format("mdb-2854"), lambda r: True, long_name),
    "rtd": (MDB.format("mdb-178"),
            lambda r: r["route_id"] in ("A", "113B", "113G", "117N"),
            lambda r: (r.get("route_short_name") or r["route_id"][-1]) + " Line"),
    "frontrunner": (MDB.format("mdb-170"), rail, lambda r: "FrontRunner"),
    # Moved to their plug-ins (scripts/railroads/), keeping their place in the
    # data files' order.
    "capmetro": None, "trirail": None,
    "caltrain": ("https://data.trilliumtransit.com/gtfs/caltrain-ca-us/caltrain-ca-us.zip", rail, lambda r: "Caltrain"),
    "smart": ("https://data.trilliumtransit.com/gtfs/smart-ca-us/smart-ca-us.zip", rail, lambda r: "SMART"),
    "metrolink": (MDB.format("mdb-96"), lambda r: True, long_name),
    "go": ("https://assets.metrolinx.com/raw/upload/Documents/Metrolinx/Open%20Data/GO-GTFS.zip", rail,
           lambda r: long_name(r) + " line"),
    # "PENN - WASHINGTON" -> "Penn Line"
    "marc": ("https://feeds.mta.maryland.gov/gtfs/marc", rail,
             lambda r: long_name(r).split(" - ")[0].title() + " Line", lambda s: marc_station(s)),
    "vre": ("https://gtfs.vre.org/containercdngtfsupload/google_transit.zip", rail, long_name),
    # Sound Transit's rail feed also has Link light rail.
    "sounder": ("https://www.soundtransit.org/GTFS-rail/40_gtfs.zip", lambda r: r["route_id"].startswith("SNDR_"),
                lambda r: r.get("route_short_name") or long_name(r)),
    "southshore": ("https://www.mysouthshoreline.com/google/google_transit.zip", rail, long_name),
    "sunrail": ("https://corporate.sunrail.com/gtfs/google_transit.zip", rail, lambda r: "SunRail"),
    "railrunner": ("https://mjcaction.com/MJC_GTFS_Public/nmrailrunner_google_transit.zip", lambda r: r["route_id"] == "rr",
                   lambda r: "Rail Runner"),
    # ACE's own copy sits behind a bot check; the Mobility Database keeps 511's.
    "ace": (MDB.format("mdb-2684"), rail, lambda r: "ACE"),
    # exo lists each platform as its own stop, with no parent station: they
    # fold into one station per name. "11 - Vaudreuil/Hudson" -> "Vaudreuil-Hudson".
    "exo": (EXO_GTFS, rail, lambda r: exo_line(r), lambda s: (slug(s), s.strip())),
    # NCTD: COASTER (commuter rail, two route ids) and SPRINTER (diesel railcars, filed as light rail).
    # Each station is listed once per direction ("... Platform 3"), with no parent: folded by name.
    # Its server negotiates only the plain-RSA cipher suites: RSA_ONLY_HOSTS, below.
    "coaster": ("https://lfportal.nctd.org/staticGTFS/google_transit.zip", lambda r: r["route_long_name"] == "COASTER", lambda r: "Coaster",
                lambda s: (slug(nctd_name(s)), nctd_name(s))),
    "sprinter": ("https://lfportal.nctd.org/staticGTFS/google_transit.zip", lambda r: r["route_long_name"] == "SPRINTER", lambda r: "Sprinter",
                 lambda s: (slug(nctd_name(s)), nctd_name(s))),
    "atrain": ("https://gtfs.remix.com/dcta_denton_tx_us.zip", lambda r: r["route_long_name"] == "A-train", lambda r: "A-train"),
    # DART's feed has the Trinity Railway Express (run with Trinity Metro) and the Silver Line.
    "tre": ("https://www.dart.org/transitdata/latest/google_transit.zip", lambda r: r["route_short_name"] == "TRE", lambda r: "Trinity Railway Express"),
    "silverline": ("https://www.dart.org/transitdata/latest/google_transit.zip", lambda r: r["route_short_name"] == "SILVER", lambda r: "Silver Line"),
    "texrail": ("https://gtfsdata.ridetm.org/gtfs/fwtatransitdata.zip", lambda r: r["route_short_name"] == "TEXRail", lambda r: "TEXRail"),
    "star": ("https://www.wegotransit.com/googleexport/google_transit.zip", lambda r: r["route_id"] == "90", lambda r: "WeGo Star"),
    "upx": ("https://assets.metrolinx.com/raw/upload/Documents/Metrolinx/Open%20Data/UP-GTFS.zip", lambda r: True, lambda r: "UP Express"),
    # Ontario Northland files every route as a bus; its train is the Polar Bear Express (Cochrane-Moosonee).
    # The feed already has the Northlander's proposed trips, but it is not carrying passengers yet
    # (October 2026): add r["route_long_name"].startswith("Northlander") back when it is.
    "ontarionorthland": ("https://ontarionorthland.tmix.se/gtfs/gtfs.zip", lambda r: "Moosonee" in r["route_long_name"],
                         lambda r: "Polar Bear Express"),
    # The Alaska Railroad's page links its current timetable file (named by date).
    "alaska": ("https://www.alaskarailroad.com/gtfs", lambda r: True, lambda r: ALASKA_LINES.get(r["route_id"], r.get("route_long_name", ""))),
}

# The plug-ins' railroads (scripts/railroads/<id>.py, GTFS: the same entries
# as above) join the table, after the railroads above; an entry may end with
# a dict of extras, kept apart in EXTRAS so the table's entries stay the
# shape every build script unpacks:
#   "tz":           the feed's time zone, where agency.txt lacks or misstates it
#   "translations": a language ("en"): stop, route and headsign names from the
#                   feed's translations.txt (Israel's, in Hebrew, has English)
#   "fold":         {"strip": regex}: stops with no parent station fold into
#                   one per name, less the regex ("Platform 2"), as exo's do
#   "suffix", "names", "positions": a regex cut from station names, names
#                   put right ({as filed: as signed}) and stations placed
#                   right ({stop id: [lat, lon]}), as build_stations.py's
#                   NAME_SUFFIX, NAME_FIX and POSITION_FIX
#   "weekend":      the days (0 Monday) that aren't weekdays, where not
#                   Saturday and Sunday ([4, 5] in Israel)
#   "schedule":     False: no data/schedules/ file; "number": a trip row's
#                   train number (else the runs go unnumbered)
#   "trips":        route ids (or True: all) for data/trips.json, for live
#                   feeds that give only stop and trip ids
#   "firsts":       False: none in data/firsts.json
#   "colors":       {line: "#rrggbb"} for data/linecolors.json
#   "headers":      sent with the feed's download ({"Accept-Encoding":
#                   "gzip"}, which Finland's Digitraffic requires; a gzipped
#                   answer is unpacked)
#   "rename":       a function putting the feed's stop names and headsigns
#                   right (CP's, filed without their accents: "Porto
#                   Campanha" is Porto Campanhã), applied as rows() reads them
#   "convert":      a function turning the download's bytes into a GTFS zip's
#                   (a timetable published in a format of its own), run once a
#                   build however many railroads share the url
#   "make":         a function returning a GTFS zip's bytes, for a railroad
#                   with no timetable file to download: it gathers the
#                   timetable itself (the url is then only its name)
#   "netex":        the download is NeTEx (Italy's National Access Point's),
#                   not GTFS: True, or scripts/netex.py's hooks ({"journey",
#                   "stop_name"}); get_zip converts it to GTFS
# PLUGINS: each plug-in's railroads, for a build script's --only.
EXTRAS, PLUGINS = {}, {}
for _mod in load():
    _id = _mod.__name__.rsplit(".", 1)[1]
    for _agency, (_url, _keep, _line, *_more) in getattr(_mod, "GTFS", {}).items():
        _extras = _more.pop() if _more and isinstance(_more[-1], dict) else {}
        if not _more and "fold" in _extras:
            _more = [lambda name, cut=re.compile(_extras["fold"]["strip"]): (slug(cut.sub("", name).strip()), cut.sub("", name).strip())]
        GTFS[_agency], EXTRAS[_agency] = (_url, _keep, _line, *_more), _extras
    PLUGINS[_id] = sorted({*getattr(_mod, "GTFS", {}), *getattr(_mod, "AGENCIES", {})})
for _agency in [a for a, f in GTFS.items() if f is None]:  # a plug-in taken out
    del GTFS[_agency]
TRANSLATE = {GTFS[a][0]: x["translations"] for a, x in EXTRAS.items() if x.get("translations")}
HEADERS = {GTFS[a][0]: x["headers"] for a, x in EXTRAS.items() if x.get("headers")}
NETEX = {GTFS[a][0]: x["netex"] for a, x in EXTRAS.items() if x.get("netex")}
RENAME = {GTFS[a][0]: x["rename"] for a, x in EXTRAS.items() if x.get("rename")}
CONVERT = {GTFS[a][0]: x["convert"] for a, x in EXTRAS.items() if x.get("convert")}
MAKE = {GTFS[a][0]: x["make"] for a, x in EXTRAS.items() if x.get("make")}
MADE = {}  # url -> GTFS zip bytes, from CONVERT or MAKE, once a build
# Each NeTEx download converted once a run, though several railroads share it
# (Trenitalia's four): {url: GTFS zip bytes}.
NETEX_GTFS = {}

# A railroad outside the US and Canada (by its AGENCIES country) keeps its
# rows of the station and timetable files out of the ones every viewer loads
# at startup: they go to data/regions/<region>/ (stations.json,
# departures.json, firsts.json, linecolors.json, trips.json, each shaped as
# data/'s own), which the page loads the first time the map shows the
# region, a search runs or a link needs it (js/regiondata.js). The region is
# the plug-in's RAIL region, else the railroad's country, lowercase.
# REGION: {railroad: region}, for read_split and write_split.
HOME = {"US", "CA"}
REGIONS = DATA / "regions"
REGION = {}
for _mod in load():
    _agencies = getattr(_mod, "AGENCIES", {})
    _abroad = [a["country"] for a in _agencies.values() if a.get("country") not in HOME]
    _rail = (getattr(_mod, "RAIL", None) or {}).get("region")
    for _agency in sorted({*getattr(_mod, "GTFS", {}), *_agencies}) if _abroad else ():
        _country = _agencies[_agency].get("country") if _agency in _agencies else _abroad[0]
        if _country not in HOME:
            REGION[_agency] = (_rail or _country).lower()


def read_split(name):
    """data/<name> with every region's rows of it (data/regions/*/<name>) put
    back, as one dict: the file as it was before regions had their own."""
    path = DATA / name
    out = json.loads(path.read_text()) if path.exists() else {}
    for part in sorted(REGIONS.glob(f"*/{name}")):
        out.update({k: v for k, v in json.loads(part.read_text()).items() if k not in out})
    return out


def write_split(name, data, common=(), **dump):
    """Writes a read_split dict, rebuilt, back: the railroads in REGION to
    their regions' files, the rest to data/<name>, each in data's order.
    common: keys every file carries (firsts.json's "start"). A region with no
    rows left loses its file. dump: json.dumps' options beyond compact
    separators and unescaped letters. Returns data/<name>'s path."""
    head = {k: data[k] for k in common if k in data}
    parts = {"": {}}
    for k, v in data.items():
        if k in common:
            parts[""][k] = v
        else:
            parts.setdefault(REGION.get(k, ""), dict(head))[k] = v
    dump = {"separators": (",", ":"), "ensure_ascii": False, **dump}
    path = DATA / name
    path.write_text(json.dumps(parts.pop(""), **dump))
    for old in REGIONS.glob(f"*/{name}"):
        if old.parent.name not in parts:
            old.unlink()
    for region, part in sorted(parts.items()):
        (REGIONS / region).mkdir(parents=True, exist_ok=True)
        (REGIONS / region / name).write_text(json.dumps(part, **dump))
        print(f"wrote {(REGIONS / region / name).relative_to(DATA.parent)} ({len(part) - len(head)} railroads)")
    return path


def chosen(argv=None):
    """The railroads a build script was asked for: `--only <id>` (a plug-in's
    id, for all its railroads, or one railroad's), or railroads named plainly
    as before. Empty: every railroad."""
    args, out = list(sys.argv[1:] if argv is None else argv), []
    while args:
        arg = args.pop(0)
        if arg == "--only":
            arg = args.pop(0)
        elif arg.startswith("--only="):
            arg = arg[len("--only="):]
        out += [a for a in PLUGINS.get(arg, [arg]) if a not in out]
    return out


# NCTD's server (IIS, Coaster's and Sprinter's timetable) negotiates only
# the cipher suites without forward secrecy (plain RSA key exchange), which
# Python's default context has left out since 3.10, so with nothing in
# common it reset every handshake of the Python the weekly runs install
# (eight tries over two runs) while answering curl, Ubuntu's own Python
# (built to use OpenSSL's list) and the older Python on a Mac at once; the
# Mobility Database's copy of the feed, a year stale, surely meets the same
# reset. Downloads from that host alone offer OpenSSL's own cipher list, as
# curl does, with the certificate checked as before. Only that host: a wider
# list changes the TLS fingerprint, and SunRail's Cloudflare front answered
# the first run that offered it to every feed with 403. Found with a
# throwaway probe workflow, October 2026.
RSA_ONLY_HOSTS = {"lfportal.nctd.org"}
TLS_RSA = ssl.create_default_context()
TLS_RSA.set_ciphers("DEFAULT")


def get_raw(url, timeout=180, attempts=1):
    """The bytes at url, trying again on a dropped download (a connection
    reset, a timeout) as many times as attempts allows."""
    req = urllib.request.Request(url, headers={"User-Agent": "trainsheet-build", **HEADERS.get(url, {})})
    context = TLS_RSA if urllib.parse.urlsplit(url).hostname in RSA_ONLY_HOSTS else None
    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(req, timeout=timeout, context=context) as r:
                data = r.read()
                # Asked for gzip (Digitraffic's answers nothing else): unpacked.
                return gzip.decompress(data) if url in HEADERS and data[:2] == b"\x1f\x8b" else data
        except Exception as err:
            if attempt == attempts - 1:
                raise
            print(f"  {url}: retry {attempt + 1} ({err})")
            time.sleep(10)


# Metrolink files its Arrow trains (San Bernardino-Redlands, 3800-3899) under
# the San Bernardino Line.
TRIP_LINE = {"metrolink": lambda t, line: "Metrolink Arrow" if re.fullmatch(r"38\d\d", t.get("trip_short_name") or "") else line}

# MARC lists each station once per direction ("NEW CARROLLTON MARC nb" and
# "... sb"), with no parent station. Both fold into one station, named in
# plain words, whose id is that name as a slug ("new-carrollton").
MARC_NAMES = {"Penn Station": "Baltimore Penn Station", "Union Station": "Washington Union Station",
              "Camden Station": "Baltimore Camden Station", "Bwi Rail Station": "BWI Airport", "St Denis": "St. Denis",
              "Brunswick Md": "Brunswick", "Harpers Ferry W Va": "Harpers Ferry", "Duffields W Va": "Duffields",
              "Martinsburg W Va": "Martinsburg", "Point Of Rocks": "Point of Rocks"}


def marc_station(name):
    """(station id, name) for one of MARC's per-direction stops."""
    base = re.sub(r"\s+MARC(\s+(nb|sb|eb|wb|Washington))?$", "", name.strip(), flags=re.I).title()
    base = MARC_NAMES.get(base, base)
    return re.sub(r"[^a-z0-9]+", "-", base.lower()).strip("-"), base


# A timetable that comes inside another zip: Transport Victoria publishes
# one zip of every mode's own ("1/google_transit.zip" V/Line's, "2/..."
# Metro's). The url names the file inside after a "#", as Transitland's feed
# records do ("...gtfs.zip#2/google_transit.zip"); the "#" part is never
# sent. The last download (Victoria's is 270 MB, Sweden's 815 MB) is kept
# for the next railroad that reads the same file, as plug-ins with several
# railroads in one timetable do, until another url comes.
OUTER = {}


def nested(url, timeout):
    """The bytes of the file a url names, or of the file inside it a
    "zip#member" url names."""
    outer, _, member = url.partition("#")
    if outer not in OUTER:
        OUTER.clear()
        OUTER[outer] = get_raw(outer, timeout)
    return zipfile.ZipFile(io.BytesIO(OUTER[outer])).read(member) if member else OUTER[outer]


def get_zip(url, timeout=180, attempts=4, page_link=True, cut=True):
    """A railroad's timetable as a ZipFile, trying again on a dropped download
    (Amtrak's 18 MB sometimes drops). page_link: follow a page that links the
    current file (the Alaska Railroad's, named by date). A "#" in the url
    names a zip inside the one downloaded (nested(), above). A url whose
    railroads ask for a cut gives the cut copy (cut_zip(), below)."""
    if cut and any(x.get("cut") and GTFS.get(a, (None,))[0] == url for a, x in EXTRAS.items()):
        if url not in CUTS:
            CUTS.clear()
            CUTS[url] = cut_zip(url, get_zip(url, timeout, attempts, page_link, cut=False))
            OUTER.clear()  # the cut copy is all that's read again
        return CUTS[url]
    for attempt in range(attempts):
        try:
            if url in CONVERT or url in MAKE:  # a timetable of its own form, or gathered, as GTFS
                if url not in MADE:
                    MADE[url] = MAKE[url]() if url in MAKE else CONVERT[url](get_raw(url, timeout))
                zf = zipfile.ZipFile(io.BytesIO(MADE[url]))
                if url in RENAME:
                    zf.rename = RENAME[url]
                return zf
            if url in NETEX:  # a NeTEx timetable, as GTFS (scripts/netex.py)
                if url not in NETEX_GTFS:
                    NETEX_GTFS[url] = netex.to_gtfs(get_raw(url, timeout), NETEX[url])
                return zipfile.ZipFile(io.BytesIO(NETEX_GTFS[url]))
            data = nested(url, timeout)
            if page_link and data[:2] != b"PK":
                href = re.search(rb'href="([^"]+\.zip)"', data, re.I).group(1).decode()
                zf = get_zip(urllib.parse.urljoin(url, href), timeout, attempts, page_link)
            else:
                zf = zipfile.ZipFile(io.BytesIO(data))
            if url in TRANSLATE:  # rows() reads its names in that language
                zf.names_in = translations(zf, TRANSLATE[url])
            if url in RENAME:
                zf.rename = RENAME[url]
            return zf
        except Exception as err:
            OUTER.clear()  # a download that broke isn't kept
            if attempt == attempts - 1:
                raise
            print(f"  {url}: retry {attempt + 1} ({err})")
            time.sleep(10)


# A whole country's timetable that several railroads read: Sweden's (GTFS
# Sweden 3, 815 MB of every bus, boat and train, 3 GB of it shapes) took
# minutes to read again for each of its sixteen railroads, in each build
# script. A railroad whose extras hold "cut" (a test of a trip row and its
# route row, or True for every trip) reads a copy cut to the trips of the
# routes it keeps that pass the test: one copy for all such railroads on the
# url, made the first time one of them asks (one download, seconds of
# cutting) and kept until another cut url is asked for. Nothing reads
# shapes.txt, so it stays out.
CUTS = {}
CUT_BY = {"routes.txt": "route_id", "trips.txt": "trip_id", "stop_times.txt": "trip_id", "frequencies.txt": "trip_id",
          "attributions.txt": "trip_id"}


def cut_zip(url, zf):
    """zf with only the trips its "cut" railroads keep, as a new ZipFile."""
    takers = [(GTFS[a][1], x["cut"]) for a, x in EXTRAS.items() if x.get("cut") and GTFS.get(a, (None,))[0] == url]
    routes = {r["route_id"]: r for r in rows(zf, "routes.txt") if any(keep(r) for keep, _ in takers)}
    trips = {t["trip_id"] for t in rows(zf, "trips.txt") if t["route_id"] in routes
             and any(keep(routes[t["route_id"]]) and (test is True or test(t, routes[t["route_id"]])) for keep, test in takers)}
    kept = {"route_id": set(routes), "trip_id": trips}
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_STORED) as z:
        for name in zf.namelist():
            if name == "shapes.txt":
                continue
            z.writestr(name, cut_rows(zf, name, CUT_BY[name], kept[CUT_BY[name]]) if name in CUT_BY else zf.read(name))
    cut = zipfile.ZipFile(out)
    if hasattr(zf, "names_in"):
        cut.names_in = zf.names_in
    if hasattr(zf, "rename"):
        cut.rename = zf.rename
    print(f"  {url}: cut to {len(routes)} routes, {len(trips)} trips")
    return cut


def cut_rows(zf, name, column, keep):
    """The file's lines whose column is in keep (or blank: attributions.txt's
    rows for a route or agency), read as bytes; a line with quotes is parsed."""
    with zf.open(name) as f:
        head = f.readline()
        cols = next(csv.reader([head.decode("utf-8-sig")]))
        i = [c.strip() for c in cols].index(column)
        out = [head]
        for line in f:
            text = line.decode("utf-8")
            value = next(csv.reader([text]))[i] if '"' in text else text.split(",", i + 1)[i]
            if value.strip() in keep or (not value.strip() and name == "attributions.txt"):
                out.append(line)
    return b"".join(out)


def rows(zf, name, optional=False, spaces=False, strip=True):
    """The rows of one file in a timetable, as dicts. optional: a file the feed
    may not have (calendar.txt) reads as nothing rather than failing. spaces:
    the feed puts a space after every comma (Metra). strip: pad or no, keys
    and values come trimmed (the one reader that keeps them raw says so), and
    names come in the language a plug-in asked for (EXTRAS' "translations")
    where the feed has them."""
    if optional and name not in zf.namelist():
        return
    with zf.open(name) as f:
        reader = csv.DictReader(io.TextIOWrapper(f, "utf-8-sig"), skipinitialspace=spaces)
        if not strip:
            yield from reader
            return
        names_in, rename = getattr(zf, "names_in", None), getattr(zf, "rename", None)
        named = NAMED.get(name, ()) if names_in or rename else ()
        for r in reader:
            r = {k.strip(): (v or "").strip() for k, v in r.items() if k}
            for table, field, key in named:
                if r.get(field) and names_in:
                    r[field] = names_in.get((table, field, r.get(key))) or names_in.get((table, field, "=" + r[field])) or r[field]
                if r.get(field) and rename and table != "routes":
                    r[field] = rename(r[field])
            yield r


# The names a feed's translations.txt can give in another language, by file:
# (table, field, the record's id column).
NAMED = {"stops.txt": [("stops", "stop_name", "stop_id")],
         "routes.txt": [("routes", "route_long_name", "route_id"), ("routes", "route_short_name", "route_id")],
         "trips.txt": [("trips", "trip_headsign", "trip_id")]}


def translations(zf, lang):
    """A feed's names in lang from its translations.txt, as {(table, field,
    record id): name} and {(table, field, "=" + name as filed): name}. The
    older form of the file (Google's: trans_id, lang, translation, the form
    Israel's Ministry of Transport has published) gives each name as filed
    with no table, so it counts for every table's."""
    out = {}
    for t in rows(zf, "translations.txt", optional=True):
        if (t.get("language") or t.get("lang") or "").lower() != lang.lower() or not t.get("translation"):
            continue
        if "table_name" in t:
            if t.get("record_id"):
                out[(t["table_name"], t["field_name"], t["record_id"])] = t["translation"]
            elif t.get("field_value"):
                out[(t["table_name"], t["field_name"], "=" + t["field_value"])] = t["translation"]
        else:
            for table, field, _ in (x for named in NAMED.values() for x in named):
                out[(table, field, "=" + t["trans_id"])] = t["translation"]
    return out


def minutes(hms):
    """"25:05:00" -> 1505: a timetable's clock as minutes after midnight."""
    h, m, *_ = (int(x) for x in hms.split(":"))
    return h * 60 + m
