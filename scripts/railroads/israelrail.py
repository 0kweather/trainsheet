"""Israel Railways: its trains' positions from the Israeli SIRI feed as the
Public Knowledge Workshop's (Hasadna's) Open Bus Stride API keeps it, about
two minutes behind, through the relay (relay_fetch below, and its Worker
twin relay/feeds/israelrail.js, which ask for the last few minute snapshots
and pass on Israel Railways' rows alone). Trains are numbered as the
timetable numbers them (the Ministry of Transport's all-modes GTFS, where
Israel Railways is agency 2, each train number its own route); the parser is
js/railroads/israelrail.js."""
import json, urllib.request

AGENCIES = {
    "israelrail": {"name": "Israel Railways", "short": "Israel Rail", "region": "Israel", "country": "IL", "color": "#1d4f91",
                   "kind": "intercity", "tz": "Asia/Jerusalem",
                   "credit": {"label": "Ministry of Transport, Hasadna Open Bus", "href": "https://open-bus-stride-api.hasadna.org.il/docs"},
                   "license": None, "bbox": [34.57, 31.06, 35.49, 33.01]},
}
# Stride loads one snapshot of the SIRI feed a minute, so polling more often
# finds nothing new, and every viewer shares the relay's minute-old copy:
# two requests a minute to Stride whoever is looking.
SOURCES = [{"id": "israelrail", "agencies": ["israelrail"], "format": "json", "interval": 60, "relay": True, "needsKey": False,
            "scope": "view"}]
RELAY = {"israelrail": {"ua": True, "ttl": 60}}

STRIDE = "https://open-bus-stride-api.hasadna.org.il"
IDENTIFYING_UA = "Trainsheet/1.0 (+https://trainsheet.com)"
SNAPSHOTS = 5  # minutes of history, to tell a frozen GPS position from a train standing still


def relay_fetch(env, source_id):
    """The last SNAPSHOTS loaded snapshots' Israel Railways rows, cut to the
    fields the parser reads: {"trains": [[snapshot, number, route id, time,
    lat, lon, bearing, km/h], ...]}. Stride's time-range queries over its
    positions are slow (a minute, then an error) while its snapshot ids are
    indexed, hence the two steps."""
    def get(path):
        req = urllib.request.Request(STRIDE + path, headers={"User-Agent": IDENTIFYING_UA, "Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.load(r)
    snaps = [s["id"] for s in get(f"/siri_snapshots/list?limit={SNAPSHOTS + 2}&order_by=id%20desc")
             if s.get("etl_status") == "loaded"][:SNAPSHOTS]
    rows = get(f"/siri_vehicle_locations/list?siri_snapshot_ids={','.join(map(str, snaps))}"
               "&siri_routes__operator_ref=2&limit=5000") if snaps else []
    trains = [[r["siri_snapshot_id"], r["siri_ride__vehicle_ref"], r["siri_route__line_ref"], r["recorded_at_time"],
               r["lat"], r["lon"], r["bearing"], r["velocity"]] for r in rows]
    return json.dumps({"trains": trains}, separators=(",", ":")).encode(), "application/json"


# A route's ends ("נהריה-נהריה", a station then its town), as the line it
# runs on is named: the two ends' towns, north first. An end not listed
# leaves the line as Israel Railways.
TOWNS = {
    "נהריה": "Nahariya", "כרמיאל": "Karmiel", "מרכזית המפרץ/קו החוף": "Haifa", "מרכזית המפרץ": "Haifa", "חיפה מרכז": "Haifa",
    "חוף הכרמל": "Haifa", "עתלית": "Atlit", "בית שאן": "Beit She'an", "בנימינה": "Binyamina", "חדרה מזרח": "Hadera",
    "נתניה": "Netanya", "הרצליה": "Herzliya", "ראש העין צפון": "Rosh HaAyin", "בני ברק": "Bnei Brak",
    "תל אביב ההגנה": "Tel Aviv", "תל אביב מרכז": "Tel Aviv", "רשל''צ משה דיין": "Rishon LeZion", "נתב''ג": "Ben Gurion Airport",
    "מודיעין מרכז": "Modi'in", "לוד": "Lod", "ראשונים": "Rishonim", "רחובות": "Rehovot", "יבנה מערב": "Yavne",
    "ירושלים/יצחק נבון": "Jerusalem", "בית שמש": "Beit Shemesh", "אשדוד עד הלום": "Ashdod", "אשקלון": "Ashkelon",
    "נתיבות": "Netivot", "אופקים": "Ofakim", "באר שבע מרכז": "Be'er Sheva", "באר שבע צפון": "Be'er Sheva", "דימונה": "Dimona",
}
ORDER = list(dict.fromkeys(TOWNS.values()))


def line(route):
    ends = [TOWNS.get(end.rsplit("-", 1)[0].strip()) for end in route.get("route_long_name", "").split("<->")]
    if len(ends) != 2 or None in ends or ends[0] == ends[1]:
        return "Israel Railways"
    return " – ".join(sorted(ends, key=ORDER.index))


# The ministry's English names are transliterations ("Hertsliya"); these are
# as Israel Railways signs them. Two stations have none (filed in Hebrew).
NAMES = {
    "Hertsliya": "Herzliya", "Tel Aviv Center": "Tel Aviv Savidor Center", "Tel Aviv Haganah": "Tel Aviv HaHagana",
    "Hashalom": "Tel Aviv HaShalom", "נתב''ג": "Ben Gurion Airport", "רשל''צ משה דיין": "Rishon LeZion Moshe Dayan",
    "Rishonim": "Rishon LeZion HaRishonim", "HaMifrats Central Station/Kav HaHof": "HaMifrats Central",
    "HaMifrats Central Station": "HaMifrats Central (Valley Line)", "Mode'ein Center": "Modi'in Center",
    "Mode'on Outskirts": "Pa'atei Modi'in", "Be'er Sheba - Center": "Be'er Sheva Center",
    "Yerushalayim/Yits'hak Navon": "Jerusalem Yitzhak Navon", "Kiriyat Arieh": "Petah Tikva Kiryat Arye",
    "Segula": "Petah Tikva Segula", "Kiriyat Haim": "Kiryat Haim", "Kiriyat Gat": "Kiryat Gat",
    "Casarea Pardes Hana": "Caesarea–Pardes Hanna", "Bet Yehosha": "Beit Yehoshua", "Bet Shemesh": "Beit Shemesh",
    "Houtzot HaMifratz": "Hutzot HaMifratz", "Yavneh Ma'arav West": "Yavne West", "Yavneh Mizrach East": "Yavne East",
    "Kfar Habad": "Kfar Chabad", "Be'er Yaacov": "Be'er Ya'akov", "Lod Gane Aviv": "Lod Ganei Aviv",
    "Kiryat Mal'akhi": "Kiryat Malakhi", "Bat Yam Eli Cohen- Yoseftal": "Bat Yam Yoseftal",
    "Ashdod Ad Halom – Metropolin": "Ashdod Ad Halom", "Acre": "Akko", "Lehavim Rahat": "Lehavim–Rahat",
}

# Israel Railways is agency 2 of the ministry's file (every bus, light rail
# and cable car of the country too, 180 MB). Its trips' headsigns are their
# train numbers, as the live feed gives them. The week runs Sunday to
# Thursday; no trains run from Friday afternoon to Saturday night.
GTFS = {
    "israelrail": ("https://gtfs.mot.gov.il/gtfsfiles/israel-public-transportation.zip", lambda r: r.get("agency_id") == "2", line,
                   {"translations": "en", "names": NAMES, "weekend": [4, 5], "number": lambda t: t.get("trip_headsign") or None}),
}

# Israel Railways' route=train relations in OSM, in a box that leaves out
# the neighbours' lines, and the Eastern Railway's (Hadera East-Rosh HaAyin,
# opened 2026), whose relation names no operator yet.
_OURS = '["route"="train"]["{}"~"israel railways|רכבת ישראל",i]({{bbox}});'
RAIL = {"region": "il", "bbox": [34.2, 30.8, 35.6, 33.1], "network": "israelrail",
        "query": "(" + "".join("relation" + _OURS.format(tag) for tag in ("network", "operator"))
                 + 'relation["route"="train"]["name:en"="Eastern Railway"]({bbox});)->.r;way(r.r)["railway"="rail"]({bbox});'}
