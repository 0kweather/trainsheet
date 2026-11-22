"""China Railway: its high-speed (G and C), EMU (D), conventional (Z, T, K
and all-number) and suburban (S) trains, from 12306's timetable, converted
to GTFS by scripts/cr12306.py ("make", below). 12306 is China Railway's
ticketing site: the files read are the ones its own pages load, public but
not published as data, so the timetable is unofficial. No live feed is read
(none is open): the trains are placed from the timetable (a "timetable"
source, no parser file), marked estimated, as Italy's, Portugal's and Great
Britain's are.

The stations are placed from OpenStreetMap: china_stations.json, beside
this file, holds each matched station's place by its telegraph code
([lat, lon, how it was matched]); 3,351 of 12306's 3,413 stations are
placed. Times are
Beijing time throughout China, Xinjiang and Tibet included."""
import datetime, json, pathlib, tempfile

TZ = "Asia/Shanghai"
CREDIT = {"label": "Timetable from 12306 (China Railway), unofficial; stations from OpenStreetMap contributors",
          "href": "https://www.12306.cn"}
# China, from Kashgar's longitude to Heilongjiang's east, Hainan to Mohe.
BBOX = [73.0, 18.0, 135.5, 54.5]
# No "cars": no illustrations of its trains yet.
COMMON = {"country": "CN", "tz": TZ, "credit": CREDIT, "license": None, "clip": True}

AGENCIES = {
    "crhsr": {"name": "China Railway High-speed", "short": "CR High-speed", "region": "China", "color": "#c60019",
              "kind": "intercity", "bbox": BBOX, "cars": "crhsr", **COMMON},
    "cremu": {"name": "China Railway EMU", "short": "CR EMU", "region": "China", "color": "#0057a8",
              "kind": "intercity", "after": "crhsr", "bbox": BBOX, "cars": "cremu", **COMMON},
    "cr": {"name": "China Railway", "short": "China Railway", "region": "China", "color": "#006747",
           "kind": "intercity", "after": "cremu", "bbox": BBOX, "cars": "cr", **COMMON},
    "crsuburban": {"name": "China Railway Suburban", "short": "CR Suburban", "region": "China", "color": "#f07d02",
                   "kind": "commuter", "after": "cr", "bbox": BBOX, "cars": "crsuburban", **COMMON},
}
SOURCES = [{"id": "china", "agencies": list(AGENCIES), "format": "timetable", "interval": 60, "scope": "view"}]

# The stations' places by telegraph code, from OpenStreetMap (the file's
# values are [lat, lon, how it was matched]).
STATIONS_FILE = pathlib.Path(__file__).with_name("china_stations.json")
PLACES = ({code: [v[0], v[1]] for code, v in json.loads(STATIONS_FILE.read_text()).items()}
          if STATIONS_FILE.exists() else {})

# A train's railroad and line by its number's letter.
CATEGORIES = {"G": ("crhsr", "High-speed"), "C": ("crhsr", "High-speed"), "D": ("cremu", "EMU"),
              "S": ("crsuburban", "Suburban"), "Z": ("cr", "Direct Express"), "T": ("cr", "Express"),
              "K": ("cr", "Fast")}
CONVENTIONAL = ("cr", "Conventional")
LINES = {a: {line for r, line in [*CATEGORIES.values(), CONVENTIONAL] if r == a} for a in AGENCIES}


def category_of(number, cls):
    """(railroad, line) of a train number ("G1"); None for none. The class
    name isn't needed: the letter tells."""
    if not number:
        return None
    return CATEGORIES.get(number[0].upper(), CONVENTIONAL)


def display_name(code, zh, pinyin, all_stations):
    """A station's Latin name. cr12306 carries the Chinese name as the
    stop's description, so it isn't needed here."""
    # 12306's pinyin comes unspaced ("beijingnan"); spacing it ("Beijing
    # Nan") is a later refinement.
    return (pinyin or code).capitalize()


def make():
    """China's timetable as GTFS (feeds.py's "make"), made once a day and
    kept in the system's temporary folder: the weekly build runs each of
    its railroads in a process of its own."""
    import cr12306
    today = datetime.date.today()
    kept = pathlib.Path(tempfile.gettempdir()) / f"trainsheet-cn-{today:%Y%m%d}.zip"
    if kept.exists():
        return kept.read_bytes()
    made = cr12306.to_gtfs(category_of, PLACES, display_name,
                           agencies={a: (AGENCIES[a]["name"], "https://www.12306.cn") for a in AGENCIES})
    kept.write_bytes(made)
    return made


EXTRAS = {"make": make, "number": lambda t: t.get("trip_short_name") or None, "tz": TZ}
# One timetable for all the railroads (feeds.get_zip makes it once a
# build); the url only names it.
GTFS = {a: ("https://www.12306.cn#cn", lambda r, a=a: r["agency_id"] == a, lambda r: r["route_short_name"],
            {**EXTRAS, "colors": {line: AGENCIES[a]["color"] for line in LINES[a]}})
        for a in AGENCIES}

RAIL = {"region": "cn", "bbox": BBOX, "network": "cr"}
