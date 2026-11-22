"""China Railway's timetable as GTFS, gathered from 12306's public files and
answers (the ticketing site's own, unofficial as data), by
scripts/railroads/china.py's "make" (feeds.py). Nothing here runs on its own.

What's read (all without signing in; verified November 2026):
  station_name.js   https://www.12306.cn/en/js/core/framework/station_name.js
                    every station: "@bjn|北京南|VNP|beijingnan|bjn|3@...", that
                    is its initials, Chinese name, telegraph code (the three
                    letters 12306 keys stations by), pinyin, initials, index.
                    3,413 stations, names and codes each unique.
  the train list    per departure date, two answers joined:
                    https://search.12306.cn/search/v1/train/search?keyword=G1&date=20261122
                      the trains whose number starts with the keyword, at
                      most 200: {"data": [{"station_train_code": "G1",
                      "train_no": "24000000G10L", "from_station": "北京南",
                      "to_station": "上海虹桥", "total_num": "7", "date"}]};
                      walked by prefix (G, then G1..G9, G10.. where a page
                      is full), some 365 asks a date, the same answer each
                      time;
                    https://kyfw.12306.cn/otn/queryTrainInfo/getTrainName?date=2026-11-22
                      the timetable page's own list for a date, {"data":
                      [{"station_train_code": "G1(北京南-上海虹桥)", "train_no"}]}:
                      one ask, but it comes back with a different part of
                      the day's trains from one hour to the next (8,543 and
                      14,230 rows for one date), so it only adds the few the
                      search misses (27 of 12,812 on a test date).
                    Both answer for the dates on sale (today and the next 15
                    days) and nothing after. The file train_list.js
                    (kyfw.12306.cn/otn/resources/js/query/train_list.js),
                    which once listed the trains by date, stopped at
                    2022-08-29 and isn't read.
  each train        https://kyfw.12306.cn/otn/queryTrainInfo/query?leftTicketDTO.train_no=24000000G10L&leftTicketDTO.train_date=2026-11-22&rand_code=
                    {"status": true, "data": {"data": [{"station_no": "01",
                    "station_name": "北京南", "arrive_time": "----",
                    "start_time": "06:30", "arrive_day_diff": "0",
                    "station_train_code": "G1", "train_class_name": "高速",
                    "start_station_name", "end_station_name", "running_time"},
                    ...]}}: its stops in order, by Chinese name, with the
                    arrival day counted from the departure (arrive_day_diff);
                    the first stop alone carries the class. An empty list:
                    the train doesn't run that date.

A train is its train_no ("24000000G10L"): the number 12306 sells it under
("G1", the station_train_code) can change on the way (G75 becomes G78 where
it turns onto another line), and a train_no names one timetable of a train,
a new one coming with each change, so a train_no's stops, once fetched, are
kept (the cache, below) and only new train_nos are asked for.

Times are Beijing time throughout (the whole railway runs on it, Ürümqi and
Lhasa too).

The cache (CACHE, CHINA_CACHE in the environment, else
~/workspace/china-data/cache):
  trains/<train_no>.json    the stops 12306 gave, and the date asked for
  lists/<date>.json         a date's train list, with the day it was read:
                            read again on any other day
  gtfs-<YYYYMMDD>.zip       the day's timetable, made once a day
"""
import concurrent.futures, csv, datetime, io, json, os, pathlib, random, re, threading, time, urllib.error, \
    urllib.parse, urllib.request, zipfile
from collections import Counter, defaultdict

STATION_NAMES = "https://www.12306.cn/en/js/core/framework/station_name.js"
SEARCH = "https://search.12306.cn/search/v1/train/search"
TRAIN_NAMES = "https://kyfw.12306.cn/otn/queryTrainInfo/getTrainName"
TRAIN_INFO = "https://kyfw.12306.cn/otn/queryTrainInfo/query"
# 12306 answers a browser; a script's own name gets the same answers today,
# but its servers sit behind a CDN that has turned away unknown clients
# before.
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
CACHE = pathlib.Path(os.environ.get("CHINA_CACHE") or pathlib.Path.home() / "workspace" / "china-data" / "cache")
# The train numbers' first characters, for the search's walk: every letter
# (G, C, D, Z, T, K, S, Y, and N and V, the conventional trains' numbers
# from 2026-11-25) and the digits (the all-number slow trains).
ROOTS = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ") + list("123456789")
PAGE = 200  # the search's most rows: a full page is walked one digit further
# A train_no's stops are asked for again after this many days, in case a
# timetable changed without a new train_no (the train list's count of stops
# catches most changes sooner).
MAX_AGE = 42


def beijing_today():
    """Today in Beijing, the date 12306 sells by (UTC+8, no summer time)."""
    return (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=8)).date()


class Client:
    """12306's answers, politely: at most `workers` asks at once and `rate`
    a second between them all, each tried again with a growing wait (and
    longer after a 403, 429 or 5xx)."""

    def __init__(self, workers=4, rate=4.0, attempts=6):
        self.workers, self.gap, self.attempts = workers, 1.0 / rate, attempts
        self.lock, self.next = threading.Lock(), 0.0
        self.asked = 0

    def _turn(self):
        with self.lock:
            now = time.monotonic()
            wait = max(0.0, self.next - now)
            self.next = max(now, self.next) + self.gap
        if wait:
            time.sleep(wait)

    def get(self, url, params=None, timeout=60):
        full = url + ("?" + urllib.parse.urlencode(params) if params else "")
        req = urllib.request.Request(full, headers={"User-Agent": UA, "Accept": "application/json, text/javascript, */*"})
        for attempt in range(self.attempts):
            self._turn()
            try:
                with urllib.request.urlopen(req, timeout=timeout) as r:
                    self.asked += 1
                    return r.read()
            except Exception as err:
                if attempt == self.attempts - 1:
                    raise RuntimeError(f"{full}: {err}") from err
                slow = isinstance(err, urllib.error.HTTPError) and (err.code in (403, 429) or err.code >= 500)
                time.sleep(min(120, (2 ** attempt) * (5 if slow else 1)) + random.random())

    def json(self, url, params=None, timeout=60):
        return json.loads(self.get(url, params, timeout))


# ---------- Stations ----------
def stations(client):
    """{telegraph code: (Chinese name, pinyin)} from station_name.js."""
    text = client.get(STATION_NAMES, timeout=120).decode("utf-8")
    m = re.search(r"station_names\s*=\s*'([^']*)'", text)
    if not m:
        raise RuntimeError("station_name.js: no station_names in it")
    out = {}
    for rec in m.group(1).split("@"):
        f = rec.split("|")
        if len(f) >= 4 and re.fullmatch(r"[A-Z]{3}", f[2]):
            out[f[2]] = (f[1].strip(), f[3].strip().lower())
    if len(out) < 2000:  # 3,413 in November 2026: a short file is a broken one
        raise RuntimeError(f"station_name.js: only {len(out)} stations")
    return out


# ---------- The train lists ----------
def search_walk(client, date):
    """({train_no: {numbers}}, {train_no: number of stops}) for the trains
    leaving on date, walked by prefix through the search."""
    day = date.strftime("%Y%m%d")
    found, counts = defaultdict(set), {}
    level = list(ROOTS)
    with concurrent.futures.ThreadPoolExecutor(client.workers) as ex:
        while level:
            nxt = []
            for kw, rows in zip(level, ex.map(lambda kw: client.json(SEARCH, {"keyword": kw, "date": day}).get("data") or [], level)):
                for r in rows:
                    if r.get("train_no") and r.get("station_train_code") and r.get("date", day) == day:
                        found[r["train_no"]].add(r["station_train_code"])
                        if str(r.get("total_num") or "").isdigit():
                            counts[r["train_no"]] = int(r["total_num"])
                if len(rows) >= PAGE:
                    nxt += [kw + c for c in "0123456789"]
            level = nxt
    return found, counts


def train_names(client, date):
    """{train_no: [numbers]} from the timetable page's list for date."""
    rows = client.json(TRAIN_NAMES, {"date": date.isoformat()}).get("data") or []
    found = defaultdict(set)
    for r in rows:
        code = (r.get("station_train_code") or "").split("(")[0].strip()
        if r.get("train_no") and code:
            found[r["train_no"]].add(code)
    return found


def train_list(client, date, today):
    """A date's trains, ({train_no: [numbers]}, {train_no: number of
    stops}), read once a day (the cache's lists/). The search must answer;
    the page's list only adds to it."""
    path = CACHE / "lists" / f"{date}.json"
    if path.exists():
        kept = json.loads(path.read_text())
        if kept.get("read") == today.isoformat() and "stops" in kept:
            return kept["trains"], kept["stops"]
    found, counts = search_walk(client, date)
    if len(found) < 3000:  # some 11,000-13,000 a day: fewer is a search that failed
        raise RuntimeError(f"12306 search: only {len(found)} trains on {date}")
    try:
        extra = train_names(client, date)
    except Exception as err:  # the search has nearly all of them
        print(f"  cr12306: getTrainName {date} not read ({err})")
        extra = {}
    added = 0
    for no, codes in extra.items():
        if no not in found:
            added += 1
        found[no] |= codes
    trains = {no: sorted(codes) for no, codes in sorted(found.items())}
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({"date": date.isoformat(), "read": today.isoformat(), "trains": trains, "stops": counts},
                               ensure_ascii=False))
    print(f"  cr12306: {date}: {len(trains)} trains ({added} only in getTrainName)")
    return trains, counts


# ---------- Each train ----------
def train_stops(client, train_no, dates):
    """The train's stops as 12306 gives them, asked for on the first of
    dates it answers for: (date, [stop dicts]) or None."""
    for d in dates:
        ans = client.json(TRAIN_INFO, {"leftTicketDTO.train_no": train_no, "leftTicketDTO.train_date": d,
                                        "rand_code": ""})
        rows = ((ans.get("data") or {}).get("data")) or []
        if rows:
            return d, rows
    return None


def cache_file(no):
    """The cache's file for a train_no. A train sold under two numbers
    ("6200Y328/500") has a "/" in its train_no, which would make a path in
    a folder that isn't there and crash the fetch, so anything but letters,
    digits, "-" and "_" becomes "_". The train_no itself stays the key
    everywhere else; only the filename is sanitised."""
    return CACHE / "trains" / (re.sub(r"[^A-Za-z0-9_-]", "_", no) + ".json")


def fetch_trains(client, wanted, deadline, counts=None, today=None):
    """Fetch the stops of every train_no in wanted ({train_no: [dates]})
    the cache lacks, then of those it holds that look changed (the train
    list's number of stops isn't the cached one's) or are older than
    MAX_AGE days, until the deadline (time.monotonic()); returns {train_no:
    rows} for all of wanted that the cache has (a stale copy until its
    fresh one comes)."""
    folder = CACHE / "trains"
    folder.mkdir(parents=True, exist_ok=True)
    today = today or datetime.date.today()
    have, missing, changed, old = {}, [], [], []
    for no in wanted:
        p = cache_file(no)
        if not p.exists():
            missing.append(no)
            continue
        kept = json.loads(p.read_text())
        have[no] = kept["stops"]
        n = (counts or {}).get(no)
        if n and n != len(kept["stops"]):
            changed.append(no)
        elif (today - datetime.date.fromisoformat(kept.get("fetched") or "2000-01-01")).days > MAX_AGE:
            old.append((kept.get("fetched") or "", no))
    old = [no for _, no in sorted(old)]  # the oldest first
    print(f"  cr12306: {len(have)} trains' stops cached ({len(changed)} changed, {len(old)} older than {MAX_AGE} days), "
          f"{len(missing)} to fetch")
    missing += changed + old
    failed, late = Counter(), 0

    def one(no):
        if time.monotonic() > deadline:
            return no, "late"
        try:
            got = train_stops(client, no, wanted[no][:3])
        except Exception as err:
            return no, f"error {err}"
        if not got:
            return no, "no stops"
        p = cache_file(no)
        tmp = p.with_suffix(".tmp")
        try:
            tmp.write_text(json.dumps({"train_no": no, "date": got[0], "fetched": today.isoformat(),
                                       "stops": got[1]}, ensure_ascii=False))
            tmp.replace(p)
        except Exception as err:
            return no, f"error {err}"
        return no, got[1]

    t0, done = time.monotonic(), 0
    with concurrent.futures.ThreadPoolExecutor(client.workers) as ex:
        for no, res in ex.map(one, missing):
            if isinstance(res, list):
                have[no] = res
                done += 1
                if done % 500 == 0:
                    rate = done / (time.monotonic() - t0)
                    print(f"  cr12306: {done}/{len(missing)} fetched ({rate:.1f}/s)", flush=True)
            elif res == "late":
                late += 1
            else:
                failed[res.split(" ")[0]] += 1
                if failed[res.split(" ")[0]] <= 3:
                    print(f"  cr12306: {no}: {res}")
    if failed or late:
        print(f"  cr12306: not fetched: {dict(failed)}, {late} left for the next build (out of time)")
    return have


# ---------- Times ----------
def clock(s):
    m = re.fullmatch(r"(\d{1,2}):(\d{2})", (s or "").strip())
    return int(m.group(1)) * 60 + int(m.group(2)) if m else None


def calls(rows):
    """[(Chinese name, arrival, departure, number)]: minutes from midnight
    of the departure day, counted on past it."""
    rows = sorted(rows, key=lambda r: int(r.get("station_no") or 0))
    out, last = [], -1
    for i, r in enumerate(rows):
        a, s = clock(r.get("arrive_time")), clock(r.get("start_time"))
        if i == 0 or a is None:  # the first stop's arrival is "----"
            a = s
        if s is None or i == len(rows) - 1:  # the last stop's departure is its arrival
            s = a
        if a is None:
            continue
        arr = a + 1440 * (int(r.get("arrive_day_diff") or 0) if i else 0)
        while arr < last:  # a day the answer didn't count
            arr += 1440
        dep = arr + (s - a) % 1440  # a stop over midnight leaves the next day
        out.append((r["station_name"].strip(), arr, dep, (r.get("station_train_code") or "").strip()))
        last = dep
    return out


# ---------- The window ----------
def window_dates(today, listed, days_before=1, days_ahead=35):
    """{date: the listed date whose trains it runs}: the listed dates as
    themselves, the others (yesterday, the days past the sale) as the
    listed date on the same weekday, the nearest one."""
    out = {}
    for k in range(-days_before, days_ahead + 1):
        d = today + datetime.timedelta(k)
        same = [x for x in listed if x.weekday() == d.weekday()] or listed
        out[d] = d if d in listed else min(same, key=lambda x: (abs((x - d).days), x))
    return out


def to_gtfs(category_of, places, display_name, today=None, list_days=8, days_ahead=35, budget_minutes=25,
            min_share=0.9, agencies=None, client=None):
    """The timetable as a GTFS zip's bytes.

    category_of(number, class name) -> (railroad, line) or None (left out);
    places {telegraph code: [lat, lon]}; display_name(code, Chinese name,
    pinyin, all stations) -> the Latin name; agencies {railroad: (name,
    url)}. The trains of the next list_days days are read date by date (the
    days on sale, at most 16); the window, yesterday to days_ahead on, runs
    each other day as the read day of the same weekday. A build taking
    longer than budget_minutes stops asking for trains; it fails, keeping
    the last timetable, when fewer than min_share of the trains are known
    (the cache keeps what it got, so the next build carries on)."""
    today = today or beijing_today()
    client = client or Client()
    deadline = time.monotonic() + budget_minutes * 60
    names = stations(client)
    by_name = {zh: code for code, (zh, _) in names.items()}
    print(f"  cr12306: station_name.js: {len(names)} stations, {sum(1 for c in names if c in places)} placed")

    listed, counts = {}, {}
    for k in range(list_days):
        d = today + datetime.timedelta(k)
        trains, n = train_list(client, d, today)
        counts.update(n)
        if trains:
            listed[d] = trains
        if time.monotonic() > deadline:
            raise RuntimeError(f"12306: out of time reading the train lists ({len(listed)} dates)")
    window = window_dates(today, sorted(listed), 1, days_ahead)

    # Each train_no: the numbers it's sold under, and the dates it runs.
    numbers, runs = defaultdict(set), defaultdict(set)
    for d, src in window.items():
        for no, codes in listed[src].items():
            runs[no].add(d)
            numbers[no].update(codes)
    first_listed = {no: sorted(str(d) for d, t in listed.items() if no in t) for no in runs}
    stops = fetch_trains(client, first_listed, deadline, counts, today)
    share = len(stops) / max(1, len(runs))
    print(f"  cr12306: {len(stops)} of {len(runs)} trains known ({share:.1%}); {client.asked} asks this build")
    if share < min_share:
        raise RuntimeError(f"12306: only {share:.0%} of the trains' stops known; the cache carries on next build")

    # The trips, the stations they call at and the stops left out.
    trips, used, dropped, kinds, classes = [], set(), Counter(), Counter(), Counter()
    services, service_of, routes = [], {}, {}
    order = sorted(window)
    for no in sorted(stops):
        seq_raw = calls(stops[no])
        cls = (stops[no][0].get("train_class_name") or "").strip()
        codes = []
        for *_, code in seq_raw:
            if code and code not in codes:
                codes.append(code)
        codes = codes or sorted(numbers[no])
        number = "/".join(codes)
        cat = category_of(codes[0], cls)
        classes[(codes[0][0] if codes[0][0].isalpha() else "#", cls)] += 1
        if not cat:
            kinds["left out (category)"] += 1
            continue
        seq = []
        for zh, arr, dep, _ in seq_raw:
            code = by_name.get(zh)
            if not code or code not in places:
                dropped[f"{zh} ({code or 'not in station_name.js'})"] += 1
                continue
            if seq and seq[-1][0] == code:
                seq[-1] = (code, seq[-1][1], dep)
                continue
            seq.append((code, arr, dep))
        if len(seq) < 2:
            kinds["fewer than two placed stops"] += 1
            continue
        mask = sum(1 << i for i, d in enumerate(order) if d in runs[no])
        if not mask:
            continue
        if mask not in service_of:
            service_of[mask] = len(services)
            services.append(mask)
        railroad, line = cat
        route = routes.setdefault((railroad, line), f"{railroad}-{len(routes) + 1}")
        trips.append((no, number, route, service_of[mask], seq))
        used.update(c for c, *_ in seq)
        kinds[railroad] += 1
    print("  cr12306: trains by number and class: " + ", ".join(f"{k[0]} {k[1] or '?'} {v}" for k, v in sorted(classes.items())))
    print("  cr12306: trips: " + ", ".join(f"{k} {v}" for k, v in sorted(kinds.items())))
    for k, n in dropped.most_common(12):
        print(f"  cr12306: stop left out: {k} ({n} trains)")
    if len(dropped) > 12:
        print(f"  cr12306: and {len(dropped) - 12} other stations left out ({sum(dropped.values())} stops)")

    hms = lambda m: "%02d:%02d:00" % divmod(m, 60)
    disp = {c: display_name(c, names[c][0], names[c][1], names) for c in used}
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        def table(name, header, rows):
            with z.open(name, "w") as raw, io.TextIOWrapper(raw, "utf-8", newline="") as f:
                w = csv.writer(f, lineterminator="\n")
                w.writerow(header)
                w.writerows(rows)

        table("agency.txt", ["agency_id", "agency_name", "agency_url", "agency_timezone", "agency_lang"],
              ([r, *(agencies or {}).get(r, (r, "https://www.12306.cn")), "Asia/Shanghai", "zh"]
               for r in sorted({r for r, _ in routes})))
        table("routes.txt", ["route_id", "agency_id", "route_short_name", "route_long_name", "route_type"],
              ([rid, railroad, line, "", 2] for (railroad, line), rid in sorted(routes.items(), key=lambda x: x[1])))
        table("calendar_dates.txt", ["service_id", "date", "exception_type"],
              ([f"s{i + 1}", d.strftime("%Y%m%d"), 1] for i, mask in enumerate(services)
               for k, d in enumerate(order) if mask >> k & 1))
        table("trips.txt", ["route_id", "service_id", "trip_id", "trip_short_name", "trip_headsign"],
              ([route, f"s{svc + 1}", no, number, disp[seq[-1][0]]] for no, number, route, svc, seq in trips))
        table("stop_times.txt", ["trip_id", "arrival_time", "departure_time", "stop_id", "stop_sequence"],
              ([no, hms(arr), hms(dep), code, i + 1] for no, _, _, _, seq in trips for i, (code, arr, dep) in enumerate(seq)))
        # The Chinese name as the station's description (china.py shows it
        # under the Latin one, and search finds it).
        table("stops.txt", ["stop_id", "stop_code", "stop_name", "stop_desc", "stop_lat", "stop_lon"],
              ([c, c, disp[c], names[c][0], *places[c]] for c in sorted(used)))
    print(f"  cr12306: {len(trips)} trips, {len(used)} stations, {len(routes)} lines, {len(services)} calendars, "
          f"window {order[0]} to {order[-1]}, trains read for {', '.join(str(d) for d in sorted(listed))}")
    return buf.getvalue()
