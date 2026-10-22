"""Romania: every passenger railroad's trains, from the yearly timetable
Informatica Feroviară publishes for each railroad on data.gov.ro (XML, the
Mersul Trenurilor de Călători, under Romania's Open Government Licence,
OGL-ROU-1.0), converted to GTFS here ("make", below). There is no live feed
open to all (bilete.infofer.ro's map is for its own pages), so the trains are
placed from the timetable (a "timetable" source, no parser file), marked
estimated, as Italy's and Portugal's are.

data.gov.ro answers only some parts of the world (in October 2026 it refused
North America, where the weekly build runs, while Europe got through). Where
it can't be reached, the same files come as GTFS from Transitous's
conversion of them (jbb.ghsq.de, rebuilt from data.gov.ro's files regularly),
whose running days need putting right first (transitous_trains, below).

Railroads (ids) and the lines they're drawn as (the categories as the
railroads sell them):
  cfr            CFR Călători, long distance: InterCity, InterRegio, InterRegio Noapte
  cfrregio       CFR Călători, regional: Regio, Regio-Expres, Regio Metropolitan
  regiocalatori  Regio Călători: InterRegio, Regio, Regio-Expres
  interregional  InterRegional Călători: InterRegio, Regio, Regio-Expres
  transferoviar  Transferoviar Călători: InterRegio, Regio, Regio-Expres
  astratc        Astra Trans Carpatic: InterRegio, InterRegio Noapte, Regio-Expres
  softrans       Softrans: InterRegio, Regio-Expres
  ferotrafic     Ferotrafic TFI: InterCity
The international trains (to Budapest, Vienna, Chișinău, Ruse, Vidin) are in
the files as far as their first station over the border."""
import csv, datetime, io, json, pathlib, re, tempfile, urllib.request, zipfile
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict

CREDIT = {"label": "Informatica Feroviară via data.gov.ro", "href": "https://data.gov.ro/organization/sc-informatica-feroviara-sa"}
BBOX = [20.2, 43.6, 29.8, 48.3]
TZ = "Europe/Bucharest"
COMMON = {"region": "Romania", "country": "RO", "tz": TZ, "credit": CREDIT, "license": "OGL-ROU-1.0",
          "bbox": BBOX, "clip": True, "cars": True}

AGENCIES = {
    "cfr": {"name": "CFR Călători", "short": "CFR Călători", "color": "#004ba0", "kind": "intercity", **COMMON},
    "cfrregio": {"name": "CFR Călători Regio", "short": "CFR Regio", "color": "#004ba0", "kind": "commuter",
                 "after": "cfr", **COMMON},
    "regiocalatori": {"name": "Regio Călători", "short": "Regio Călători", "color": "#be1d2c", "kind": "commuter",
                      "after": "cfrregio", **COMMON},
    "interregional": {"name": "InterRegional Călători", "short": "InterRegional", "color": "#e4382e", "kind": "commuter",
                      "after": "regiocalatori", **COMMON},
    "transferoviar": {"name": "Transferoviar Călători", "short": "Transferoviar", "color": "#e3000f", "kind": "commuter",
                      "after": "interregional", **COMMON},
    "astratc": {"name": "Astra Trans Carpatic", "short": "Astra", "color": "#19b29e", "kind": "intercity",
                "after": "transferoviar", **COMMON},
    "softrans": {"name": "Softrans", "short": "Softrans", "color": "#19365d", "kind": "intercity",
                 "after": "astratc", **COMMON},
    "ferotrafic": {"name": "Ferotrafic TFI", "short": "Ferotrafic", "color": "#34487e", "kind": "intercity",
                   "after": "softrans", **COMMON},
}
SOURCES = [{"id": "romania", "agencies": list(AGENCIES), "format": "timetable", "interval": 60, "scope": "view"}]

# The files' railroads by their operator codes (the timetable's Operator, as
# Transitous's agency ids): CFR Călători's trains split between its long
# distance and its regional railroad by category.
OPERATORS = {"6100826": "cfr", "227098": "regiocalatori", "236037": "interregional", "228389": "transferoviar",
             "237330": "astratc", "236025": "softrans", "247232": "ferotrafic"}
LONG_DISTANCE = {"IC", "IR", "IR-N"}
# The categories (CategorieTren) as sold.
LINES = {"IC": "InterCity", "IR": "InterRegio", "IR-N": "InterRegio Noapte", "R": "Regio", "R-E": "Regio-Expres",
         "R-M": "Regio Metropolitan"}
UA = {"User-Agent": "Trainsheet/1.0 (+https://trainsheet.com)"}
CKAN = "https://data.gov.ro/api/3/action/package_search?fq=organization:sc-informatica-feroviara-sa&rows=100"
TRANSITOUS = "https://jbb.ghsq.de/gtfs/ro-railway.gtfs.zip"
# Each station's place, by its code in the timetable: from OpenStreetMap,
# matched once by its UIC code (uic_ref "53" + the code) or else by name and
# checked by hand (scripts/railroads/romania_stations.json, {code: [lat, lon]}).
# A station not in it takes Transitous's place for it (OpenStreetMap's too).
STATIONS = json.loads((pathlib.Path(__file__).with_name("romania_stations.json")).read_text())
# The station platform groups of București Nord are one station.
SAME = {"17417": "10017"}


def get(url, timeout=60):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
        return r.read()


# ---------- names ----------
# The file writes ș and ț with a cedilla (ş ţ), its abbreviations of the
# kind of stop after the name ("Roşu Hm.": haltă de mișcare; h., hc., hcv.,
# P.O., P.M.) and a few names shortened. The names as the stations are
# signed: comma below, the kind dropped (kept where two stations would
# otherwise share a name: Ișalnița and Ișalnița h.), the short ones spelled out.
KIND = re.compile(r"(?:\s+|(?<=\.))(?:h|Hm|hc|hcv|Hc|PO|PM|P\.\s?O|P\.\s?M|P\.M\.Aj|Pam)\b[.,]*(?:\s*\([^)]*\))?$|\s*\((?:IIIK|Tj\.|\d+)\)$")
TAG = re.compile(r"\s*\((?:IIIK|Tj\.|\d+)\)$")
LEAD = re.compile(r"^(?:P\.\s?mac\.|P\.\s?M\.|P\.O\.?)\s+")
NAMES = {"București Nord Gr.A": "București Nord", "București Nord Gr.B": "București Nord",
         "București Sud Gr. Călători": "București Sud", "Aeroport H. Coanda T1": "Aeroport Henri Coandă",
         "Câmpulung Moldov.": "Câmpulung Moldovenesc", "General T.Moșoiu": "General Traian Moșoiu",
         "General N. Dăscălescu": "General Nicolae Dăscălescu", "General E. Grigorescu": "General Eremia Grigorescu",
         "Mareșal C-tin Prezan": "Mareșal Constantin Prezan", "Gen. Gh. Avramescu": "General Gheorghe Avramescu",
         "I. L. Caragiale": "Ion Luca Caragiale", "C.A.Rosetti": "C.A. Rosetti",
         "I. L. Caragiale Vest": "Ion Luca Caragiale Vest", "TEIȘ": "Teiș", "Depoul Buc.Triaj": "Depoul București Triaj",
         "Pașcani Gr. Triaj": "Pașcani Triaj", "Dep Petroșani": "Depou Petroșani", "Prundul Bârgaului": "Prundu Bârgăului",
         # Over the border: as their own railroads sign them.
         "Nyirabrany": "Nyírábrány", "Kotegyan": "Kötegyán", "Lokoshaza": "Lőkösháza"}


SPELLED = [(re.compile(r"\bG-ral\.?\s*"), "General "), (re.compile(r"^Buc\.\s*"), "București "),
           (re.compile(r"^Drobeta Tr\.\s*Sev(?:erin)?\b"), "Drobeta Turnu Severin")]


def clean(s):
    s = s.translate(str.maketrans("şţŞŢ", "șțȘȚ"))
    for pattern, to in SPELLED:
        s = pattern.sub(to, s)
    return re.sub(r"\s+", " ", s).strip()


def short(s):
    s = clean(s)
    s = NAMES.get(s, s)
    s = LEAD.sub("", TAG.sub("", s))
    s = KIND.sub("", s).strip()
    s = KIND.sub("", s).strip()
    return NAMES.get(s, s)


def names(raw):
    """{code: name} from {code: the file's name}."""
    full = {c: TAG.sub("", clean(n)) for c, n in raw.items()}
    named = {c: short(n) for c, n in raw.items()}
    count = Counter(named.values())
    # Two stations that would share a name: the one the file names bare keeps
    # it, the others keep their kind ("Ișalnița h.").
    bare = {named[c] for c in named if count[named[c]] > 1 and full[c] == named[c]}
    out = {}
    for c in raw:
        n = named[c]
        out[c] = n if count[n] == 1 or (n not in bare and c == min(k for k in named if named[k] == n)) or full[c] == n \
            else full[c]
    for c, to in SAME.items():
        if to in out:
            out[c] = out[to]
    return out


# ---------- running days ----------
def easter(year):
    """Orthodox Easter Sunday (Gregorian)."""
    a, b, c = year % 4, year % 7, year % 19
    d = (19 * c + 15) % 30
    e = (2 * a + 4 * b - d + 34) % 7
    m, day = divmod(d + e + 114, 31)
    return datetime.date(year, m, day + 1) + datetime.timedelta(13)


def holidays(year):
    """Romania's public holidays, the days the timetable's weekday trains skip."""
    e = easter(year)
    fixed = [(1, 1), (1, 2), (1, 6), (1, 7), (1, 24), (5, 1), (6, 1), (8, 15), (11, 30), (12, 1), (12, 25), (12, 26)]
    return {datetime.date(year, m, d) for m, d in fixed} | {e + datetime.timedelta(n) for n in (-2, 0, 1, 49, 50)}


def ymd(s):
    return datetime.date(int(s[:4]), int(s[4:6]), int(s[6:8]))


def calendar_days(rules):
    """The dates a train runs, from its CalendarTren rules: each a period
    (DeLa to PinaLa) and the weekdays in it (Zile, a bit for each day, the
    lowest Monday: 31 is Monday to Friday, 64 Sunday; the bits above the
    seventh don't name days). The periods leave out the public holidays a
    weekday train skips, so 287 over 14.12-24.12 and 27.12-31.12 runs Monday
    to Friday but not Christmas."""
    out = set()
    for r in rules:
        if r.get("Tip", "Da") != "Da":
            continue
        days, d, end = int(r["Zile"]), ymd(r["DeLa"]), ymd(r["PinaLa"])
        while d <= end:
            if days >> d.weekday() & 1:
                out.add(d)
            d += datetime.timedelta(1)
    return out


# ---------- data.gov.ro ----------
def current_files(today=None):
    """The timetable files in force from today for three weeks, one or two
    per railroad (two around the change in December): the organization's
    datasets on data.gov.ro, each railroad's newest XML files."""
    today = today or datetime.date.today()
    found = json.loads(get(CKAN, timeout=20))["result"]["results"]
    out = []
    for pkg in found:
        res = [r for r in pkg.get("resources", []) if (r.get("format") or "").upper() == "XML" or r.get("url", "").lower().endswith(".xml")]
        res.sort(key=lambda r: r.get("created") or "", reverse=True)
        periods = set()
        for r in res[:2]:
            data = get(r["url"], timeout=300)
            head = dict(re.findall(r'(\w+)="([^"]*)"', re.search(rb"<Mt [^>]*>", data[:4000]).group().decode()))
            lo, hi = ymd(head["MtValabilDeLa"]), ymd(head["MtValabilPinaLa"])
            if lo <= today + datetime.timedelta(21) and hi >= today and (lo, hi) not in periods:  # not a copy
                periods.add((lo, hi))
                out.append(data)
                print(f"  {pkg['name']}: {r['url'].rsplit('/', 1)[-1]} ({lo} to {hi})")
    return out


def xml_trains(data):
    """The trains in one timetable file, as make() takes them."""
    root = ET.fromstring(data)
    for t in root.iter("Tren"):
        number, op = t.get("Numar", ""), t.get("Operator", "")
        trasa = t.find("Trase/Trasa")
        if trasa is None or number.lower().startswith("auto"):  # a coach in the train's place
            continue
        els = trasa.findall("ElementTrasa")
        if not els:
            continue
        # Each element runs from one station to the next: its stop kind and
        # standing time are at the one it leaves (TipOprire C: a stop for
        # passengers; A too, a long one; N passing, T a stop for the
        # railroad's own needs). Times in seconds after midnight.
        stops, names = [], {}
        for i, e in enumerate(els):
            if i == 0 or e.get("TipOprire") in ("C", "A"):
                arr = int(els[i - 1].get("OraS")) if i else int(e.get("OraP"))
                stops.append((e.get("CodStaOrigine"), arr, int(e.get("OraP"))))
                names[e.get("CodStaOrigine")] = e.get("DenStaOrigine")
        last = els[-1]
        if last.get("CodStaDest") != stops[-1][0]:
            stops.append((last.get("CodStaDest"), int(last.get("OraS")), int(last.get("OraS"))))
            names[last.get("CodStaDest")] = last.get("DenStaDestinatie")
        rules = [c.attrib for c in t.iter("CalendarTren")]
        yield {"number": number, "operator": op, "category": t.get("CategorieTren", ""), "stops": stops,
               "names": names, "days": calendar_days(rules)}


# ---------- Transitous ----------
def transitous_trains():
    """The same timetable as Transitous's GTFS of it. Its running days read
    the timetable's weekday bits from Saturday (Monday to Friday trains run
    Saturday to Wednesday there), so a train that runs only some weekdays has
    its days rebuilt: the weekdays moved back to the ones the timetable
    names, the periods between its dates kept (a holiday it skipped skipped
    again). Trains running every weekday are as filed. Should Transitous
    read the bits from Monday one day (most such trains then run Monday to
    Friday, not Saturday to Wednesday), nothing is moved."""
    zf = zipfile.ZipFile(io.BytesIO(get(TRANSITOUS, timeout=300)))
    rd = lambda n: csv.DictReader(io.TextIOWrapper(zf.open(n), "utf-8-sig"))
    routes = {r["route_id"]: r for r in rd("routes.txt")}
    stops = {s["stop_id"]: s for s in rd("stops.txt")}
    days = defaultdict(set)
    for c in rd("calendar_dates.txt"):
        (days[c["service_id"]].add if c["exception_type"] == "1" else days[c["service_id"]].discard)(ymd(c["date"]))
    times = defaultdict(list)
    for st in rd("stop_times.txt"):
        times[st["trip_id"]].append(st)
    feed = next(rd("feed_info.txt"))
    start, end = ymd(feed["feed_start_date"]), ymd(feed["feed_end_date"])
    weekdays = Counter(frozenset(d.weekday() for d in ds) for ds in days.values())
    shifted = weekdays[frozenset({5, 6, 0, 1, 2})] > weekdays[frozenset({0, 1, 2, 3, 4})]
    print(f"  Transitous's timetable, {start} to {end}; weekdays {'from Saturday: rebuilt' if shifted else 'as filed'}")
    hol = set().union(*(holidays(y) for y in range(start.year, end.year + 1)))
    sec = lambda s: (lambda h, m, x: int(h) * 3600 + int(m) * 60 + int(x))(*s.split(":"))
    for t in rd("trips.txt"):
        r = routes[t["route_id"]]
        number = r["route_short_name"].split(" ", 1)[-1]
        if r["route_type"] == "3" or number.lower().startswith("auto"):
            continue
        st = sorted(times[t["trip_id"]], key=lambda x: int(x["stop_sequence"]))
        yield {"number": number, "operator": r["agency_id"], "category": r["route_short_name"].split(" ", 1)[0],
               "stops": [(x["stop_id"], sec(x["arrival_time"]), sec(x["departure_time"])) for x in st],
               "names": {x["stop_id"]: stops[x["stop_id"]]["stop_name"] for x in st},
               "where": {x["stop_id"]: [float(stops[x["stop_id"]]["stop_lat"]), float(stops[x["stop_id"]]["stop_lon"])] for x in st},
               "days": rebuilt(days[t["service_id"]], start, end, hol) if shifted else days[t["service_id"]]}


def rebuilt(dates, start, end, hol):
    """A train's dates from Transitous's (see transitous_trains)."""
    ds = sorted(dates)
    filed = {d.weekday() for d in ds}
    if not ds or len(filed) == 7:
        return set(ds)
    runs = {(w + 2) % 7 for w in filed}  # bit b: Saturday + b there, Monday + b here
    span = set()

    def fill(a, b):
        span.update(a + datetime.timedelta(i) for i in range((b - a).days + 1))
    if (ds[0] - start).days < 7:
        fill(start, ds[0])
    if (end - ds[-1]).days < 7:
        fill(ds[-1], end)
    for a, b in zip(ds, ds[1:]):
        inside = [a + datetime.timedelta(i) for i in range(1, (b - a).days)]
        # A week apart or less, or apart only by holidays: one period.
        if (b - a).days <= 7 or all(d in hol for d in inside if d.weekday() in filed):
            fill(a, b)
    span.update(ds)
    skips = any(h not in dates for h in hol if ds[0] <= h <= ds[-1] and h.weekday() in filed)
    return {d for d in span if d.weekday() in runs and not (skips and d in hol)}


# ---------- GTFS ----------
def make():
    """Romania's timetable as GTFS: data.gov.ro's files where it answers,
    else Transitous's. Kept for the day in the system's temporary folder,
    since the weekly build runs each railroad apart (eight of them here)."""
    kept = pathlib.Path(tempfile.gettempdir()) / f"trainsheet-romania-{datetime.date.today():%Y%m%d}.zip"
    if kept.exists():
        return kept.read_bytes()
    try:
        files = current_files()
        if not files:
            raise RuntimeError("no timetable in force on data.gov.ro")
        trains = [t for data in files for t in xml_trains(data)]
        print(f"  {len(trains)} trains from data.gov.ro")
        new = {code for t in trains for code, *_ in t["stops"]} - set(STATIONS)
        if new:  # stations not in romania_stations.json yet: Transitous's places for them, if it has them
            try:
                zf = zipfile.ZipFile(io.BytesIO(get(TRANSITOUS, timeout=300)))
                where = {s["stop_id"]: [float(s["stop_lat"]), float(s["stop_lon"])]
                         for s in csv.DictReader(io.TextIOWrapper(zf.open("stops.txt"), "utf-8-sig")) if s["stop_id"] in new}
                trains[0]["where"] = where
                print(f"  {len(new)} stations new to romania_stations.json, {len(where)} placed from Transitous's")
            except Exception as err:
                print(f"  {len(new)} stations new to romania_stations.json, left out ({err})")
    except Exception as err:
        print(f"  data.gov.ro: {err}; Transitous's GTFS instead")
        trains = list(transitous_trains())
        print(f"  {len(trains)} trains from Transitous")
    made = to_gtfs(trains)
    kept.write_bytes(made)
    return made


def to_gtfs(trains):
    raw, where, skipped = {}, {}, Counter()
    for t in trains:
        raw.update(t["names"])
        where.update(t.get("where", {}))
    named = names(raw)
    out = {k: io.StringIO() for k in ("agency", "routes", "trips", "stops", "stop_times", "calendar_dates")}
    w = {k: csv.writer(v, lineterminator="\n") for k, v in out.items()}
    w["agency"].writerow(["agency_id", "agency_name", "agency_url", "agency_timezone", "agency_lang"])
    urls = {"cfr": "https://www.cfrcalatori.ro", "cfrregio": "https://www.cfrcalatori.ro",
            "regiocalatori": "https://www.regiocalatori.ro", "interregional": "https://interregional.ro",
            "transferoviar": "https://www.transferoviarcalatori.ro", "astratc": "https://www.astratranscarpatic.ro",
            "softrans": "https://www.softrans.ro", "ferotrafic": "https://www.ferotrafic.ro"}
    for a, info in AGENCIES.items():
        w["agency"].writerow([a, info["name"], urls[a], TZ, "ro"])
    w["routes"].writerow(["route_id", "agency_id", "route_short_name", "route_long_name", "route_type"])
    w["trips"].writerow(["route_id", "service_id", "trip_id", "trip_short_name", "trip_headsign"])
    w["stop_times"].writerow(["trip_id", "arrival_time", "departure_time", "stop_id", "stop_sequence"])
    w["calendar_dates"].writerow(["service_id", "date", "exception_type"])
    routes, services, used, ids = set(), {}, set(), Counter()
    hms = lambda s: "%02d:%02d:%02d" % (s // 3600, s % 3600 // 60, s % 60)
    for t in trains:
        agency = OPERATORS.get(t["operator"])
        cat = t["category"]
        if agency == "cfr" and cat not in LONG_DISTANCE:
            agency = "cfrregio"
        if not agency or cat not in LINES or not t["days"]:
            skipped[f"operator {t['operator']}" if not agency else f"category {cat}" if cat not in LINES else "no days"] += 1
            continue
        stops = []
        for code, arr, dep in t["stops"]:
            code = SAME.get(code, code)
            if raw.get(code, "").endswith(" Fr."):  # a border crossing ("Curtici Fr."), no stop
                continue
            if code not in STATIONS and code not in where:
                skipped[f"stop {code} {raw.get(code)} has no place"] += 1
                continue
            if stops and stops[-1][0] == code:
                stops[-1] = (code, stops[-1][1], dep)
                continue
            stops.append((code, arr, dep))
        if len(stops) < 2:
            continue
        # Past midnight: the times keep counting (24:10 is ten past midnight).
        day, last, timed = 0, -1, []
        for code, arr, dep in stops:
            arr += day
            if arr < last:
                day += 86400
                arr += 86400
            dep += day
            if dep < arr:
                day += 86400
                dep += 86400
            timed.append((code, arr, dep))
            last = dep
        line = LINES[cat]
        route = f"{agency}-{cat}"
        if route not in routes:
            routes.add(route)
            w["routes"].writerow([route, agency, line, "", 2])
        key = tuple(sorted(t["days"]))
        if key not in services:
            services[key] = f"s{len(services) + 1}"
            for d in key:
                w["calendar_dates"].writerow([services[key], d.strftime("%Y%m%d"), 1])
        ids[t["number"]] += 1
        trip = t["number"] if ids[t["number"]] == 1 else f"{t['number']}-{ids[t['number']]}"
        w["trips"].writerow([route, services[key], trip, t["number"], named[timed[-1][0]]])
        for i, (code, arr, dep) in enumerate(timed):
            w["stop_times"].writerow([trip, hms(arr), hms(dep), code, i + 1])
            used.add(code)
    w["stops"].writerow(["stop_id", "stop_name", "stop_lat", "stop_lon"])
    for code in sorted(used):
        lat, lon = STATIONS.get(code) or where[code]
        w["stops"].writerow([code, named[code], lat, lon])
    for k, v in sorted(skipped.items()):
        print(f"  left out: {k} ({v})")
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        for k, v in out.items():
            z.writestr(f"{k}.txt", v.getvalue())
    return buf.getvalue()


RAILROAD_LINES = {"cfr": {"InterCity", "InterRegio", "InterRegio Noapte"},
                  "cfrregio": {"Regio", "Regio-Expres", "Regio Metropolitan"},
                  "regiocalatori": {"InterRegio", "Regio", "Regio-Expres"},
                  "interregional": {"InterRegio", "Regio", "Regio-Expres"},
                  "transferoviar": {"InterRegio", "Regio", "Regio-Expres"},
                  "astratc": {"InterRegio", "InterRegio Noapte", "Regio-Expres"},
                  "softrans": {"InterRegio", "Regio-Expres"},
                  "ferotrafic": {"InterCity"}}
# One timetable for all eight railroads (feeds.get_zip makes it once a build);
# the url only names it.
GTFS = {agency: ("https://data.gov.ro/organization/sc-informatica-feroviara-sa#romania",
                 lambda r, a=agency: r["agency_id"] == a, lambda r: r["route_short_name"],
                 {"make": make, "number": lambda t: t.get("trip_short_name") or None, "tz": TZ,
                  "colors": {line: AGENCIES[agency]["color"] for line in RAILROAD_LINES[agency]}})
        for agency in AGENCIES}

RAIL = {"region": "ro", "bbox": BBOX, "network": "cfrregio"}
