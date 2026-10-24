"""БДЖ – Пътнически превози (BDZ Passenger Services, Bulgaria): every train
it runs, from its timetable (GTFS) on Bulgaria's National Access Point
(BGNAP, sipbg.gov.bg/bgnap, the Ministry of Transport and Communications'),
no key. The same dataset has GTFS-realtime vehicle positions and trip
updates, keyless too; the portal sends no CORS headers, so they come through
the relay, the trip updates appended to the positions (as Renfe's). The feed
names a train by its trip id ("1611-BV-20261024": train 1611, a fast train,
on the 24th), whose stops come from the timetable. The parser is
js/railroads/bdz.js.

Terms (checked 24 October 2026): BGNAP publishes no licence or terms of use
for its datasets (none on the dataset, its files or the portal, whose pages
call it an open data platform, "free access to transport information in
standardized formats"); bdz.bg has no terms of use either, only "© Всички
права запазени" for the site itself. Published under Delegated Regulation
(EU) 2017/1926, which has a NAP's data reused in a neutral, non-
discriminatory way. Credited to BDZ via BGNAP; licence left unstated.

Railroads (the car file that draws them in brackets) and their lines (the
categories as BDZ sells them, by the timetable's route short names):
  bdz  БДЖ [bdz]:
    Бърз влак (БВ, "BV"): София–Бургас, София–Варна (via Горна Оряховица or
        Карлово), София–Русе, София–Видин, София–Лом, София–Силистра,
        София–Петрич and Благоевград, София–Кюстендил, София–Свиленград,
        София–Пловдив, Варна–Русе, Варна–Пловдив, Варна–Стара Загора,
        Варна–Добрич, Варна–Враца, Перник–Свиленград, Димитровград–Подкова;
        the night trains София–Варна and София–Бургас carry sleeping and
        couchette cars
    Пътнически влак (ПВ, "PV"): the stopping trains between towns:
        Пловдив–Ямбол, Варна–Шумен, София–Карлово, София–Благоевград,
        Варна–Карнобат, Пловдив–Свиленград, Горна Оряховица–Стара Загора,
        Бургас–Сливен, Видин–Мездра, Самуил–Силистра, София–Копривщица and
        others
    Крайградски пътнически влак (КПВ, "KPV"): the suburban trains round
        София (Перник, Драгоман, Мездра, Лакатник, Костенец, Дупница,
        Радомир, Банкя, Искър), Пловдив (Асеновград, Карлово, Хисар,
        Панагюрище, Пещера, Белово, Димитровград), Варна (Добрич,
        Повеляново), Бургас–Карнобат, Лом–Брусарци, Габрово–Царева Ливада,
        Левски–Свищов, Левски–Троян, Плевен–Черквица, Кюстендил–Радомир,
        Генерал Тодоров–Кулата and Петрич, Бойчиновци–Монтана–Берковица
    Международен бърз влак (МБВ, "MBV"): the international trains'
        Bulgarian part: София–Пловдив–Капъкуле (for Istanbul), Русе–Гюргево
        север (for Bucharest), Видин–Голенци (for Calafat), Горна Оряховица–
        Димитровград, Русе–София, Цариброд–Капъкуле
    Родопска теснолинейка: the 760 mm line Септември–Велинград–Добринище
        (its passenger trains, ПВ, and its fast train, БВ, 1661/1662)
The timetable's "A" route (автобус: the buses that stand in for trains
during works, Волуяк–Драгоман and others) is left out.
"""
import csv, io, json, re, urllib.request, zipfile

PORTAL = "https://sipbg.gov.bg/bgnap/portal/api/catalog"
# The dataset's GTFS subset: its files, the latest named by date
# ("gtfs-static_Bulgarian-Railways-passengers-transport_20261023.zip"),
# each upload a new file id.
GTFS_URL = f"{PORTAL}/subsets/28055fe4-d0da-4471-a1b9-13c434e6d5d9/files?format=gtfs-static"
POSITIONS = f"{PORTAL}/subsets/cddd12ef-5ae8-46a6-9afc-faeaafbc552d/realtime-download"
TRIP_UPDATES = f"{PORTAL}/subsets/cc43fe99-141e-4eb8-bef1-cae144870a0f/realtime-download"
IDENTIFYING_UA = "Trainsheet/1.0 (+https://trainsheet.com)"
CREDIT = {"label": "BDZ via BGNAP", "href": "https://sipbg.gov.bg/bgnap/portal/en/catalog"}
BBOX = [22.3, 41.2, 28.7, 44.25]

AGENCIES = {
    "bdz": {"name": "БДЖ – Пътнически превози", "short": "БДЖ", "region": "Bulgaria", "country": "BG",
            "color": "#00418a", "kind": "intercity", "tz": "Europe/Sofia", "credit": CREDIT, "license": None,
            "bbox": BBOX, "clip": True, "cars": "bdz"},
}
# The portal rebuilds both feeds as they're asked for (each answer is a new
# file, stamped with the second it was made); the positions move every
# 30 s or so. Polled every 30 s, and the relay keeps each answer as long, so
# the portal sees two requests every 30 s however many are watching.
SOURCES = [{"id": "bdz", "agencies": ["bdz"], "format": "pb", "interval": 30, "relay": True, "needsKey": False,
            "scope": "view"}]
RELAY = {"bdz": {"url": POSITIONS, "also": [TRIP_UPDATES], "ua": True, "ttl": 30}}

CATEGORIES = {"BV": "Бърз влак", "PV": "Пътнически влак", "KPV": "Крайградски пътнически влак",
              "MBV": "Международен бърз влак"}
NARROW = "Родопска теснолинейка"


# The Rhodope narrow-gauge line (760 mm, Септември–Добринище): its stops'
# codes, past the junction it shares with the standard gauge, start 164
# (Велинград 164103, Добринище 164301); a trip calling at any is on it, and
# goes to a route of its own.
NARROW_STOPS = "164"
NARROW_ROUTE = "BDZ-TL"
CATEGORIES["TL"] = NARROW

# Names as BDZ signs them: the file's border points come as "- (Крепост)",
# "- (Капитан Андреево)"; one name has a Latin o in it.
NAMES = {"- (Крепост)": "Крепост", "- (Капитан Андреево)": "Капитан Андреево", "Стоян Митoв": "Стоян Митов"}

# Stops put right, by code: (name, lat, lon), None where the file's is
# right. The file names a town's station and its halt (спирка) alike, two
# places a kilometre or more apart ("Дупница" twice): the halt takes its
# name as OpenStreetMap has it, "Дупница спирка". And some stops sit up to
# 4 km from where they are: each moved to OpenStreetMap's station or halt of
# its name, where that was 150 m or more away and the timetable's running
# times agree (checked October 2026: Вакарел's second stop, Рогозче and Леска
# stay where the file has them, which the times bear out).
STOPS = {
    "110072": ("Драгоман спирка", None, None), "110114": ("Сливница спирка", None, None),
    "110163": ("Костинброд спирка", None, None), "140129": (None, 41.97304, 25.89008),
    "140145": (None, 41.87221, 25.98439), "164087": (None, 42.16519, 24.13395),
    "186015": (None, 42.06601, 24.83927), "186023": (None, 42.10005, 24.84665),
    "230086": (None, 42.95118, 23.36797), "240184": (None, 43.32992, 26.37945),
    "240325": (None, 43.2747, 27.09985), "270017": (None, 43.13917, 23.74725),
    "270025": (None, 43.12885, 23.80001), "270066": (None, 43.16877, 23.95973),
    "273094": ("Ловеч спирка", None, None), "273128": (None, 43.09042, 24.74101),
    "273144": (None, 43.00568, 24.70056), "290312": ("Варна спирка", None, None),
    "320069": (None, 42.74219, 23.51786), "320275": ("Макоцево спирка", None, None),
    "320283": ("Мирково спирка", None, None), "320333": (None, 42.65439, 24.71581),
    "340141": (None, 42.64149, 26.14886), "340216": (None, 42.64341, 26.38396),
    "380212": ("Завет спирка", None, None), "410043": ("Меричлери спирка", None, None),
    "420240": (None, 43.65362, 25.96766), "430231": ("Дряново спирка", None, None),
    "432013": (None, 42.93837, 25.41279), "440057": (None, 41.56517, 25.39101),
    "440248": (None, 41.76763, 25.54219), "440255": (None, 41.7814, 25.59075),
    "480129": (None, 42.54085, 25.53886), "560250": ("Дупница спирка", None, None),
    "560383": ("Благоевград спирка", 41.9916, 23.08476), "560474": ("Кресна спирка", None, None),
    "560573": (None, 41.43433, 23.31307), "560581": (None, 41.41063, 23.34961),
    "610097": ("Разменна спирка", 42.74341, 23.02724), "650010": (None, 42.48795, 22.93178),
    "720144": (None, 43.23187, 23.52601), "810127": (None, 42.22068, 25.32159),
    "811018": (None, 42.18947, 24.67958), "812156": (None, 42.50816, 24.84132),
    "812180": (None, 42.49946, 24.83403), "941013": (None, 43.5566, 26.78672),
    "941021": (None, 43.57597, 26.82354), "941039": (None, 43.6081, 26.81953),
    "941138": (None, 43.76333, 26.99509), "941252": (None, 43.94235, 27.29326),
    "941260": (None, 44.0157, 27.29769),
}


def name(s):
    s = re.sub(r"\s+", " ", s).strip()
    return NAMES.get(s, s)


def latest_gtfs(listing):
    """The dataset's newest GTFS file (its listing's is_latest one), its stops
    put right (STOPS), the narrow-gauge line's trips a route of their own
    (NARROW_ROUTE), without shapes.txt (13 MB the map doesn't read)."""
    files = json.loads(listing)
    f = next((f for f in files if f.get("is_latest")), None) or max(files, key=lambda f: f["created_at"])
    req = urllib.request.Request(f"{PORTAL}/files/{f['id']}/download", headers={"User-Agent": IDENTIFYING_UA})
    with urllib.request.urlopen(req, timeout=180) as r:
        src = zipfile.ZipFile(io.BytesIO(r.read()))
    table = lambda n: list(csv.DictReader(io.TextIOWrapper(src.open(n), "utf-8-sig")))
    narrow = {r["trip_id"] for r in table("stop_times.txt") if r["stop_id"].startswith(NARROW_STOPS)}
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as zf:
        for n in src.namelist():
            if n not in ("routes.txt", "trips.txt", "stops.txt"):
                if n != "shapes.txt":
                    zf.writestr(n, src.read(n))
                continue
            rows = table(n)
            if n == "routes.txt":
                rows.append({**rows[0], "route_id": NARROW_ROUTE, "route_short_name": "TL", "route_long_name": NARROW})
            for r in rows:
                if n == "trips.txt" and r["trip_id"] in narrow:
                    r["route_id"] = NARROW_ROUTE
                elif n == "stops.txt" and r["stop_id"] in STOPS:
                    fix, lat, lon = STOPS[r["stop_id"]]
                    r["stop_name"] = fix or r["stop_name"]
                    if lat is not None:
                        r["stop_lat"], r["stop_lon"] = str(lat), str(lon)
            text = io.StringIO()
            w = csv.DictWriter(text, fieldnames=list(rows[0]), lineterminator="\n")
            w.writeheader()
            w.writerows(rows)
            zf.writestr(n, text.getvalue())
    return out.getvalue()


def line(r):
    return CATEGORIES.get(r["route_short_name"], r["route_short_name"])


COLORS = {"Бърз влак": "#00418a", "Пътнически влак": "#3c8d2f", "Крайградски пътнически влак": "#2f8fce",
          "Международен бърз влак": "#c8102e", NARROW: "#8a5a2b"}
GTFS = {
    "bdz": (GTFS_URL, lambda r: r.get("route_short_name") in CATEGORIES, line,
            {"convert": latest_gtfs, "headers": {"User-Agent": IDENTIFYING_UA}, "tz": "Europe/Sofia",
             "number": lambda t: t.get("trip_short_name") or None, "rename": name, "colors": COLORS}),
}

# Bulgaria's track, routed over OpenStreetMap's along the timetable's hops,
# into Serbia (Цариброд), Romania (Гюргево север, Голенци) and Turkey
# (Капъкуле), where its international trains end.
RAIL = {"region": "bg", "bbox": BBOX, "network": "bdz"}
