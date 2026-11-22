"""Great Britain (National Rail): every passenger train operator's trains,
from Network Rail's timetable (the SCHEDULE feed of its open data, NTROD,
publicdatafeeds.networkrail.co.uk: the daily full extract, CIF as JSON),
converted to GTFS by scripts/ntrod.py ("make", below). No live feed is read
yet (Network Rail's TRUST movements and TD berth steps come over STOMP, which
a page can't open; the relay would have to hold them): the trains are placed
from the timetable (a "timetable" source, no parser file), marked estimated,
as Italy's and Portugal's are.

The feed is open to anyone who registers with Network Rail (free): the
build fetches the extract with that account (NTROD_USER and NTROD_PASSWORD
in the environment), or reads a copy already on disk (NTROD_SCHEDULE: its
path, gzipped or not). With neither, GB's timetable fails and the last one
is kept, as for any railroad whose download fails.

Terms: Network Rail's data feeds licence (open, attribution: "Contains
information of Network Rail Infrastructure Limited"); NaPTAN, the stations'
places and names, is the Department for Transport's, under the Open
Government Licence v3.

Railroads are the train operators, one per ATOC code in the timetable (the
code in brackets), and their trains are drawn as one line each, but for
London Overground's six named lines and Merseyrail's two:
  avanti (VT), c2c (CC), calsleeper (CS), chiltern (CH), crosscountry (XC),
  elizabeth (XR), emr (EM), gatwickexpress (GX), grandcentral (GC),
  greateranglia (LE), greatnorthern (GN), gwr (GW), heathrowexpress (HX),
  hulltrains (HT), islandline (IL), lner (GR), lumo (LD: Lumo's East Coast
  trains), lumowest (LF: Lumo's London-Stirling trains, First Rail Stirling's,
  which took over Grand Union's open access rights), merseyrail (ME),
  northern (NT), overground (LO), scotrail (SR), southeastern (SE), southern
  (SN), swr (SW), tfw (AW), thameslink (TL), tpe (TP), wmt (LM: West
  Midlands Railway and London Northwestern Railway, one code)
Brand colours as Wikipedia's route templates have them (Template:<operator>
colour, Module:Adjacent stations/<operator>), TfL's own (its Colour Standard,
issue 11) for London Overground, its lines and the Elizabeth line, and
Merseyrail's lines as its map draws them. Most operators taken into public
ownership (2025-2026) also carry a "GBR" name now; their own brands stay,
and are used here.
Left out: Eurostar (ES; France's plug-in has it, from Eurostar's own
timetable), the London Underground's, Tyne and Wear Metro's and Sheffield
Supertram's runs over Network Rail's track (LT, TW, SJ: a part of each line
only), the heritage railways and charters (NY, LS, MV, PX, SO, TY, WR) and
the timetable's "ZZ" (empty stock and specials). Buses and ships are left
out by train status.
"""
import base64, csv, datetime, io, json, os, pathlib, shutil, tempfile, urllib.error, urllib.request

TZ = "Europe/London"
CREDIT = {"label": "Contains information of Network Rail Infrastructure Limited; NaPTAN (DfT)",
          "href": "https://publicdatafeeds.networkrail.co.uk"}
# Great Britain, from the Scillies' and Penzance's longitude to Lowestoft's,
# the Channel coast to Thurso and Wick.
BBOX = [-6.4, 49.85, 1.85, 58.7]
COMMON = {"country": "GB", "tz": TZ, "credit": CREDIT, "license": "OGL v3 (NaPTAN)", "clip": True}
LONDON = [-0.75, 51.25, 0.45, 51.75]

AGENCIES = {
    "avanti": {"name": "Avanti West Coast", "short": "Avanti", "region": "Great Britain", "color": "#004354", "cars": "avanti",
               "kind": "intercity", "bbox": BBOX, **COMMON},
    "lner": {"name": "LNER", "short": "LNER", "region": "Great Britain", "color": "#ce0e2d", "kind": "intercity", "cars": "lner",
             "after": "avanti", "bbox": BBOX, **COMMON},
    "crosscountry": {"name": "CrossCountry", "short": "CrossCountry", "region": "Great Britain", "color": "#660f21", "cars": "crosscountry",
                     "kind": "intercity", "after": "lner", "bbox": BBOX, **COMMON},
    "gwr": {"name": "Great Western Railway", "short": "GWR", "region": "Great Britain", "color": "#0a493e", "cars": "gwr",
            "kind": "intercity", "after": "crosscountry", "bbox": BBOX, **COMMON},
    "emr": {"name": "East Midlands Railway", "short": "EMR", "region": "Great Britain", "color": "#703e69", "cars": "emr",
            "kind": "intercity", "after": "gwr", "bbox": BBOX, **COMMON},
    "tpe": {"name": "TransPennine Express", "short": "TPE", "region": "North of England, Scotland", "color": "#09a4ec",
            "kind": "intercity", "after": "emr", "cars": "tpe", "bbox": BBOX, **COMMON},
    "calsleeper": {"name": "Caledonian Sleeper", "short": "Sleeper", "region": "Great Britain", "color": "#1d2e35",
                   "kind": "intercity", "after": "tpe", "cars": "calsleeper", "bbox": BBOX, **COMMON},
    "grandcentral": {"name": "Grand Central", "short": "Grand Central", "region": "Great Britain", "color": "#1d1d1b",
                     "kind": "intercity", "after": "calsleeper", "cars": "grandcentral", "bbox": BBOX, **COMMON},
    "hulltrains": {"name": "Hull Trains", "short": "Hull Trains", "region": "Great Britain", "color": "#de005c",
                   "kind": "intercity", "after": "grandcentral", "cars": "hulltrains", "bbox": BBOX, **COMMON},
    # Lumo's two railways (two operators, two codes, one brand), told apart
    # by their main lines.
    "lumo": {"name": "Lumo", "short": "Lumo", "region": "East Coast", "color": "#2b6ef5", "kind": "intercity",
             "after": "hulltrains", "cars": "lumo", "bbox": BBOX, **COMMON},
    "lumowest": {"name": "Lumo", "short": "Lumo", "region": "West Coast", "color": "#2b6ef5", "kind": "intercity",
                 "after": "lumo", "cars": "lumowest", "bbox": BBOX, **COMMON},
    "scotrail": {"name": "ScotRail", "short": "ScotRail", "region": "Scotland", "color": "#1e467d", "kind": "commuter",
                 "after": "lumowest", "cars": "scotrail", "bbox": BBOX, **COMMON},
    "northern": {"name": "Northern", "short": "Northern", "region": "North of England", "color": "#0f0d78",
                 "kind": "commuter", "after": "scotrail", "cars": "northern", "bbox": BBOX, **COMMON},
    "tfw": {"name": "Transport for Wales", "short": "TfW", "region": "Wales", "color": "#e60000", "kind": "commuter", "cars": "tfw",
            "after": "northern", "bbox": BBOX, **COMMON},
    "merseyrail": {"name": "Merseyrail", "short": "Merseyrail", "region": "Merseyside", "color": "#fff200",
                   "kind": "commuter", "cars": "merseyrail", "after": "tfw", "bbox": [-3.25, 53.15, -2.75, 53.7], **COMMON},
    "wmt": {"name": "West Midlands Railway, London Northwestern Railway", "short": "WMR, LNR", "region": "West Midlands",
            "color": "#ff8300", "kind": "commuter", "cars": "wmt", "after": "merseyrail", "bbox": BBOX, **COMMON},
    "greateranglia": {"name": "Greater Anglia", "short": "Greater Anglia", "region": "East of England",
                      "color": "#d70428", "kind": "commuter", "cars": "greateranglia", "after": "wmt", "bbox": BBOX, **COMMON},
    "c2c": {"name": "c2c", "short": "c2c", "region": "London, Essex", "color": "#b7007c", "kind": "commuter", "cars": "c2c",
            "after": "greateranglia", "bbox": BBOX, **COMMON},
    "chiltern": {"name": "Chiltern Railways", "short": "Chiltern", "region": "London, Midlands", "color": "#00bfff",
                 "kind": "commuter", "cars": "chiltern", "after": "c2c", "bbox": BBOX, **COMMON},
    "thameslink": {"name": "Thameslink", "short": "Thameslink", "region": "London, South East", "color": "#ff5aa4",
                   "kind": "commuter", "cars": "thameslink", "after": "chiltern", "bbox": BBOX, **COMMON},
    "greatnorthern": {"name": "Great Northern", "short": "Great Northern", "region": "London, East of England",
                      "color": "#0099ff", "kind": "commuter", "cars": "greatnorthern", "after": "thameslink", "bbox": BBOX, **COMMON},
    "southern": {"name": "Southern", "short": "Southern", "region": "London, South East", "color": "#8cc63e",
                 "kind": "commuter", "cars": "southern", "after": "greatnorthern", "bbox": BBOX, **COMMON},
    "gatwickexpress": {"name": "Gatwick Express", "short": "Gatwick Express", "region": "London", "color": "#eb1e2d",
                       "kind": "commuter", "cars": "gatwickexpress", "after": "southern", "bbox": BBOX, **COMMON},
    "southeastern": {"name": "Southeastern", "short": "Southeastern", "region": "London, South East", "color": "#389cff",
                     "kind": "commuter", "cars": "southeastern", "after": "gatwickexpress", "bbox": BBOX, **COMMON},
    "swr": {"name": "South Western Railway", "short": "SWR", "region": "London, South West", "color": "#24398c",
            "kind": "commuter", "cars": "swr", "after": "southeastern", "bbox": BBOX, **COMMON},
    "islandline": {"name": "Island Line", "short": "Island Line", "region": "Isle of Wight", "color": "#0092cb",
                   "kind": "commuter", "cars": "islandline", "after": "swr", "bbox": [-1.25, 50.6, -1.1, 50.75], **COMMON},
    "overground": {"name": "London Overground", "short": "Overground", "region": "London", "color": "#fa7b05",
                   "kind": "commuter", "cars": "overground", "after": "islandline", "bbox": LONDON, **COMMON},
    "elizabeth": {"name": "Elizabeth line", "short": "Elizabeth line", "region": "London", "color": "#60399e",
                  "kind": "commuter", "cars": "elizabeth", "after": "overground", "bbox": LONDON, **COMMON},
    "heathrowexpress": {"name": "Heathrow Express", "short": "Heathrow Express", "region": "London", "color": "#532e63",
                        "kind": "commuter", "cars": "heathrowexpress", "after": "elizabeth", "bbox": LONDON, **COMMON},
}
SOURCES = [{"id": "gb", "agencies": list(AGENCIES), "format": "timetable", "interval": 60, "scope": "view"}]

# The timetable's operators (atoc_code) and the railroad each is.
OPERATORS = {"VT": "avanti", "GR": "lner", "XC": "crosscountry", "GW": "gwr", "EM": "emr", "TP": "tpe",
             "CS": "calsleeper", "GC": "grandcentral", "HT": "hulltrains", "LD": "lumo", "LF": "lumowest",
             "SR": "scotrail", "NT": "northern", "AW": "tfw", "ME": "merseyrail", "LM": "wmt", "LE": "greateranglia",
             "CC": "c2c", "CH": "chiltern", "TL": "thameslink", "GN": "greatnorthern", "SN": "southern",
             "GX": "gatwickexpress", "SE": "southeastern", "SW": "swr", "IL": "islandline", "LO": "overground",
             "XR": "elizabeth", "HX": "heathrowexpress"}
URLS = {"avanti": "https://www.avantiwestcoast.co.uk", "lner": "https://www.lner.co.uk",
        "crosscountry": "https://www.crosscountrytrains.co.uk", "gwr": "https://www.gwr.com", "emr": "https://www.eastmidlandsrailway.co.uk",
        "tpe": "https://www.tpexpress.co.uk", "calsleeper": "https://www.sleeper.scot", "grandcentral": "https://www.grandcentralrail.com",
        "hulltrains": "https://www.hulltrains.co.uk", "lumo": "https://www.lumo.co.uk", "lumowest": "https://www.lumo.co.uk",
        "scotrail": "https://www.scotrail.co.uk", "northern": "https://www.northernrailway.co.uk", "tfw": "https://tfw.wales",
        "merseyrail": "https://www.merseyrail.org", "wmt": "https://www.westmidlandsrailway.co.uk",
        "greateranglia": "https://www.greateranglia.co.uk", "c2c": "https://www.c2c-online.co.uk",
        "chiltern": "https://www.chilternrailways.co.uk", "thameslink": "https://www.thameslinkrailway.com",
        "greatnorthern": "https://www.greatnorthernrail.com", "southern": "https://www.southernrailway.com",
        "gatwickexpress": "https://www.gatwickexpress.com", "southeastern": "https://www.southeasternrailway.co.uk",
        "swr": "https://www.southwesternrailway.com", "islandline": "https://www.southwesternrailway.com/island-line",
        "overground": "https://tfl.gov.uk/overground", "elizabeth": "https://tfl.gov.uk/elizabeth-line",
        "heathrowexpress": "https://www.heathrowexpress.com"}

# ---------- Lines ----------
# The timetable names no lines. London Overground's six (named in November
# 2024) and Merseyrail's two are told apart by the stations their trains
# call at (CRS codes); every other railroad's trains are one line, its name.
OVERGROUND = [  # in order: the first line any of whose stations the train calls at
    ("Lioness", {"EUS", "WFJ", "SOK", "HDL"}),                  # Euston, Watford Junction, South Kenton, Harlesden
    ("Weaver", {"LST", "ENF", "CHN", "CHI", "HAC"}),            # Liverpool Street, Enfield Town, Cheshunt, Chingford, Hackney Downs
    ("Liberty", {"RMF", "EMP", "UPM"}),                         # Romford, Emerson Park, Upminster
    ("Suffragette", {"UHL", "WMW", "LEM", "BKG", "BGV"}),       # Upper Holloway, Walthamstow Queen's Road, Leyton Midland Road, Barking (Riverside)
    # Not Highbury & Islington, where Mildmay's trains call too.
    ("Windrush", {"WCY", "CYP", "NWX", "SQE", "SDC", "DLJ"}),   # West Croydon, Crystal Palace, New Cross, Surrey Quays, Shoreditch High Street, Dalston Junction
    # Willesden Junction's high level (WJH; its low level, WJL, is Lioness'),
    # and the West London Line's stations, for the Clapham Junction shuttles.
    ("Mildmay", {"SRA", "RMD", "WJH", "CMD", "KNR", "DLK", "SPB", "KPA", "IMW"}),  # Stratford, Richmond, Willesden Junction, Camden Road, Kensal Rise, Dalston Kingsland, Shepherd's Bush, Kensington (Olympia), Imperial Wharf
]
WIRRAL = {"BKQ", "WKI", "NBN", "CTR", "ELP", "HOO"}  # Hamilton Square, West Kirby, New Brighton, Chester, Ellesmere Port, Hooton
LINE_COLORS = {"Lioness": "#faa61a", "Mildmay": "#0077ad", "Windrush": "#ed1b00", "Weaver": "#823a62",
               "Suffragette": "#5bbd72", "Liberty": "#5d6061", "Wirral line": "#00a94f", "Northern line": "#0266b2"}


def line_of(railroad, stations):
    """A train's line, by its railroad and the stations it calls at."""
    at = set(stations)
    if railroad == "overground":
        return next((line for line, codes in OVERGROUND if at & codes), "London Overground")
    if railroad == "merseyrail":
        return "Wirral line" if at & WIRRAL else "Northern line"
    return AGENCIES[railroad]["name"]


# ---------- Stations ----------
# Each station (CRS code) as NaPTAN has it (the Department for Transport's
# list of every stop in Britain; a station is "9100" and a tiploc of it,
# with its name and place): gb_stations.json, {crs: [name, lat, lon]},
# matched once from the timetable's tiplocs (python3 scripts/railroads/gb.py
# --stations <extract>). A station new to the timetable since is looked up
# in NaPTAN as the build runs (naptan_places).
NAPTAN = "https://naptan.api.dft.gov.uk/v1/access-nodes?atcoAreaCodes=910&dataFormat=csv"
STATIONS_FILE = pathlib.Path(__file__).with_name("gb_stations.json")
STATIONS = json.loads(STATIONS_FILE.read_text()) if STATIONS_FILE.exists() else {}
# Tiplocs neither STANOX nor NLC ties to their station (ntrod.station_codes):
# Richmond's North London Line platforms.
SAME = {"RICHNLL": "RMD"}
# A station's second codes, for a group of its platforms, as its first: one
# station, as its signs and NaPTAN name it (each pair's places are metres
# apart). The Elizabeth line's own platforms at Abbey Wood, Farringdon,
# Liverpool Street, Paddington and Whitechapel are the stations its trains
# share with the others' (its tunnels' stations elsewhere are its own).
FOLD = {"SPX": "STP", "RDZ": "RDG", "ALE": "LPY", "HII": "HHY", "XHZ": "HHY", "XIC": "CNN", "XMR": "MRF",
        "XUP": "UPM", "XCB": "ABA", "WPH": "WOP", "ABX": "ABW", "FDX": "ZFD", "LSX": "LST", "PDX": "PAD", "WHX": "ZLW"}
# NaPTAN's names end "Rail Station" ("London Kings Cross Rail Station"; two
# Cornish halts "Halt (Rail Station)").
SUFFIXES = (" (Rail Station)", " Rail Station", " Railway Station", " Station")


def osgb(e, n):
    """(lat, lon) on WGS84 of a place on the National Grid (OSGB36 easting
    and northing, metres), to a few metres: the Ordnance Survey's inverse
    Transverse Mercator on the Airy 1830 ellipsoid, then its Helmert shift
    (A guide to coordinate systems in Great Britain, annexes C and 6).
    NaPTAN gives some new stations (the Elizabeth line's) only so."""
    from math import atan2, cos, degrees, radians, sin, sqrt, tan
    a, b, f0, lat0, lon0, n0, e0 = 6377563.396, 6356256.909, 0.9996012717, radians(49), radians(-2), -100000, 400000
    e2, k = 1 - b * b / (a * a), (a - b) / (a + b)
    lat, m = lat0, 0.0
    while abs(n - n0 - m) >= 0.00001:
        lat += (n - n0 - m) / (a * f0)
        d, s_ = lat - lat0, lat + lat0
        m = b * f0 * ((1 + k + 1.25 * k ** 2 + 1.25 * k ** 3) * d - (3 * k + 3 * k ** 2 + 21 / 8 * k ** 3) * sin(d) * cos(s_)
                      + (15 / 8 * k ** 2 + 15 / 8 * k ** 3) * sin(2 * d) * cos(2 * s_) - 35 / 24 * k ** 3 * sin(3 * d) * cos(3 * s_))
    nu = a * f0 / sqrt(1 - e2 * sin(lat) ** 2)
    rho = a * f0 * (1 - e2) / (1 - e2 * sin(lat) ** 2) ** 1.5
    eta2, t, sec, de = nu / rho - 1, tan(lat), 1 / cos(lat), e - e0
    lat, lon = (lat - t / (2 * rho * nu) * de ** 2 + t / (24 * rho * nu ** 3) * (5 + 3 * t * t + eta2 - 9 * t * t * eta2) * de ** 4
                - t / (720 * rho * nu ** 5) * (61 + 90 * t * t + 45 * t ** 4) * de ** 6,
                lon0 + sec / nu * de - sec / (6 * nu ** 3) * (nu / rho + 2 * t * t) * de ** 3
                + sec / (120 * nu ** 5) * (5 + 28 * t * t + 24 * t ** 4) * de ** 5
                - sec / (5040 * nu ** 7) * (61 + 662 * t * t + 1320 * t ** 4 + 720 * t ** 6) * de ** 7)
    nu = a / sqrt(1 - e2 * sin(lat) ** 2)  # to cartesian, OSGB36 to WGS84, and back
    x, y, z = nu * cos(lat) * cos(lon), nu * cos(lat) * sin(lon), (1 - e2) * nu * sin(lat)
    tx, ty, tz, sc = 446.448, -125.157, 542.060, -20.4894e-6
    rx, ry, rz = (radians(v / 3600) for v in (0.1502, 0.2470, 0.8421))
    x, y, z = (tx + (1 + sc) * x - rz * y + ry * z, ty + rz * x + (1 + sc) * y - rx * z, tz - ry * x + rx * y + (1 + sc) * z)
    a, b = 6378137.0, 6356752.3142
    e2, p = 1 - b * b / (a * a), sqrt(x * x + y * y)
    lat = atan2(z, p * (1 - e2))
    for _ in range(10):
        lat = atan2(z + e2 * a / sqrt(1 - e2 * sin(lat) ** 2) * sin(lat), p)
    return degrees(lat), degrees(atan2(y, x))


def naptan_name(s):
    for suffix in SUFFIXES:
        if s.endswith(suffix):
            return s[: -len(suffix)].strip()
    return s.strip()


def naptan_places(wanted):
    """{crs: [name, lat, lon]} from NaPTAN, for {crs: [tiplocs, its own
    first]}: the first tiploc NaPTAN has a station for, an active one before
    one marked inactive."""
    req = urllib.request.Request(NAPTAN, headers={"User-Agent": "Trainsheet/1.0 (+https://trainsheet.com)"})
    with urllib.request.urlopen(req, timeout=120) as r:
        rows = list(csv.DictReader(io.TextIOWrapper(r, "utf-8-sig")))
    by_tiploc = {}
    for row in rows:
        if row["StopType"] == "RLY" and row["ATCOCode"].startswith("9100") and (row.get("Latitude") or row.get("Easting")):
            tl = row["ATCOCode"][4:]
            if tl not in by_tiploc or (by_tiploc[tl]["Status"] != "active" and row["Status"] == "active"):
                by_tiploc[tl] = row
    out = {}
    for crs, tiplocs in wanted.items():
        found = [by_tiploc[t] for t in tiplocs if t in by_tiploc]
        row = next((r for r in found if r["Status"] == "active"), found[0] if found else None)
        if row:
            lat, lon = (float(row["Latitude"]), float(row["Longitude"])) if row.get("Latitude") \
                else osgb(float(row["Easting"]), float(row["Northing"]))
            out[crs] = [naptan_name(row["CommonName"]), round(lat, 5), round(lon, 5)]
    return out


def more_places(wanted):
    try:
        return naptan_places(wanted)
    except Exception as err:  # those stations' stops are left out this time
        print(f"  gb: NaPTAN not read ({err})")
        return {}


# ---------- The timetable ----------
FEED = "https://publicdatafeeds.networkrail.co.uk/ntrod/CifFileAuthenticate?type=CIF_ALL_FULL_DAILY&day=toc-full"
DAYS_AHEAD = 35  # trips running in the next five weeks are kept


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def download(to):
    """The day's full extract, gzipped, to the path to, streamed. Network
    Rail answers the signed-in request with a redirect to a signed link
    (Amazon S3), which is fetched without the sign-in (S3 refuses a request
    carrying both)."""
    auth = base64.b64encode(f"{os.environ['NTROD_USER']}:{os.environ['NTROD_PASSWORD']}".encode()).decode()
    req = urllib.request.Request(FEED, headers={"Authorization": f"Basic {auth}", "User-Agent": "trainsheet-build"})
    try:
        r = urllib.request.build_opener(_NoRedirect).open(req, timeout=120)
    except urllib.error.HTTPError as err:
        if err.code not in (301, 302, 303, 307, 308):
            raise
        r = urllib.request.urlopen(urllib.request.Request(err.headers["Location"], headers={"User-Agent": "trainsheet-build"}),
                                   timeout=600)
    with r, open(to, "wb") as f:
        shutil.copyfileobj(r, f, 1 << 20)


def make():
    """Great Britain's timetable as GTFS (feeds.py's "make"), made once a
    day and kept in the system's temporary folder: the weekly build runs
    each of its railroads in a process of its own."""
    import ntrod
    today = datetime.date.today()
    kept = pathlib.Path(tempfile.gettempdir()) / f"trainsheet-gb-{today:%Y%m%d}.zip"
    if kept.exists():
        return kept.read_bytes()
    path = os.environ.get("NTROD_SCHEDULE")
    fetched = None
    if not path:
        if not (os.environ.get("NTROD_USER") and os.environ.get("NTROD_PASSWORD")):
            raise RuntimeError("no timetable: set NTROD_SCHEDULE (a copy of the extract) or NTROD_USER and NTROD_PASSWORD")
        fetched = pathlib.Path(tempfile.gettempdir()) / f"trainsheet-gb-{today:%Y%m%d}.json.gz"
        print("  gb: downloading Network Rail's full extract")
        download(fetched)
        path = fetched
    try:
        made = ntrod.to_gtfs(path, OPERATORS, STATIONS, more_places=more_places, line_of=line_of, today=today,
                             days_ahead=DAYS_AHEAD, tz=TZ, urls={a: (AGENCIES[a]["name"], URLS[a]) for a in AGENCIES},
                             same=SAME, fold=FOLD)
    finally:
        if fetched:
            fetched.unlink(missing_ok=True)
    kept.write_bytes(made)
    return made


def stations_file(path):
    """gb_stations.json, from NaPTAN, for every station the extract at path
    has a passenger train of OPERATORS call at."""
    import ntrod
    today = datetime.date.today()
    tiplocs, uids = ntrod.read(path, OPERATORS, today - datetime.timedelta(1), today + datetime.timedelta(DAYS_AHEAD))
    code = ntrod.station_codes(tiplocs, SAME, FOLD)
    called = {code[tl] for recs in uids.values() for *_, t in recs if t for tl, *_ in t[2] if tl in code}
    wanted = {}  # each station's tiplocs, its own first
    for tl, crs in sorted(code.items(), key=lambda x: (tiplocs[x[0]][0] != x[1], x[0])):
        if crs in called:
            wanted.setdefault(crs, []).append(tl)
    places = naptan_places(wanted)
    missing = sorted(set(wanted) - set(places))
    print(f"{len(places)} stations placed, {len(missing)} not in NaPTAN: {missing}")
    STATIONS_FILE.write_text(json.dumps(dict(sorted(places.items())), ensure_ascii=False, separators=(",", ":")) + "\n")


EXTRAS = {"make": make, "number": lambda t: t.get("trip_short_name") or None, "tz": TZ}
# One timetable for all the railroads (feeds.get_zip makes it once a
# build); the url only names it.
GTFS = {a: ("https://publicdatafeeds.networkrail.co.uk#gb", lambda r, a=a: r["agency_id"] == a,
            lambda r: r["route_short_name"],
            {**EXTRAS, "colors": {line: LINE_COLORS.get(line, AGENCIES[a]["color"])
                                  for line in ([l for l, _ in OVERGROUND] if a == "overground"
                                               else ["Wirral line", "Northern line"] if a == "merseyrail"
                                               else [AGENCIES[a]["name"]])}})
        for a in AGENCIES}

# Great Britain's track, built offline (scripts/osm_tiles.py
# europe/great-britain, then build_rail.py --offline --only gb): no track
# of its own on file, the timetables routed over OpenStreetMap's mainline
# track from Geofabrik's extract, as Italy's is built. An online run would
# ask Overpass for every main and branch line in BBOX (build_rail's
# default query), likely more than the public servers will answer.
RAIL ={"region": "gb", "bbox": BBOX, "network": "northern"}


if __name__ == "__main__":
    import sys
    sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
    if sys.argv[1:2] == ["--stations"] and len(sys.argv) == 3:
        stations_file(sys.argv[2])
    else:
        sys.exit("python3 scripts/railroads/gb.py --stations <the extract>")
