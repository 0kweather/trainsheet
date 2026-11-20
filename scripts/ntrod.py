"""Network Rail's timetable as GTFS: the SCHEDULE feed of its open data
(NTROD, publicdatafeeds.networkrail.co.uk), its daily full extract, read by
scripts/railroads/gb.py's "make" (feeds.py). Nothing here runs on its own.

The extract (CIF_ALL_FULL_DAILY, "toc-full") is CIF turned into JSON, one
object a line, 4 GB unpacked, so it is read a line at a time and never held
whole:
  {"JsonTimetableV1": ...}  the header (its timestamp and sequence)
  {"TiplocV1": ...}         a timing point: tiploc_code, its station's CRS
                            code (crs_code, the three letters on tickets) where
                            it is one, and its name in capitals
                            (tps_description)
  {"JsonScheduleV1": ...}   one schedule of one train (below)
  {"JsonAssociationV1": ...} trains joining and dividing (not read: each part
                            is a train of its own)
  {"EOF": true}

A schedule is a train's run on the days its schedule_days_runs names (seven
characters, Monday first) between schedule_start_date and schedule_end_date,
both counted by the day it sets out. The same train (CIF_train_uid) can have
several, told apart by CIF_stp_indicator:
  P  permanent: the timetable as planned for the season
  O  overlay: the train runs as this instead on these days (engineering
     works, a different path); it can make it a bus (train_status 5) or
     another operator's train
  N  new: a short-term train with no permanent schedule
  C  cancelled on these days (a bare record: no operator, no stops, no
     applicable_timetable)
On each day the short-term records (O, N, C) win over the permanent one; were
two of them to cover the same day, the one over the fewest days wins, as
Network Rail's own systems read them. Only schedules marked
applicable_timetable "Y" run (every one but the cancellations, in practice).

Quirks:
  - train_status P or 1 (STP) is a passenger train, B or 5 a bus, S or 4 a
    ship, the rest freight and trips; passenger trains include empty runs
    (CIF_train_category EE), which call nowhere in public: a stop is a
    location with a public time (public_arrival/public_departure, "HHMM"),
    and a schedule with fewer than two is no passenger train.
  - Public time "0000" means none (CIF's blank), unless the working time
    there is around midnight too.
  - Times past midnight just start again ("2358", "0004"): they're counted on
    from the day the train set out (24:04).
  - A station is its CRS code; a big one has several tiplocs (Clapham
    Junction's platforms on each line, St Pancras' Midland, Thameslink and
    HS1 parts have codes of their own). Only one of a station's tiplocs
    carries the code, here and in CORPUS alike: London Waterloo's is
    WATRLOO, but its main-line trains call at WATRLMN, London Bridge's
    through trains at LNDNBDE and LNDNBDC, Victoria's at VICTRIC and
    VICTRIE, the Watford DC line's at HROWDC, WMBYDC and the like, none of
    them with a code. A tiploc without one takes its station's: the one
    code among the tiplocs with its STANOX (the signalling's number for the
    place), else among those whose NLC (the ticketing number) starts with
    the same four digits, codes for sidings and junctions (X..) and the
    Underground's (Z..) aside; or the plug-in's own table (same). A stop
    at a tiploc with no station still is left out; two stops in a row at
    one station are one.
  - The train's headcode (signalling_id, "1S07") is how it's known on the
    railway, but a railroad uses the same headcode again in other places
    and at other times of day (Northern's 2xxx). One railroad's trains on
    one day are keyed by headcode, and a second train with it that day as
    "1S07~2" (the page shows it as 1S07; sources.js timetableTrains).
  - CIF_bank_holiday_running ("X": not on bank holidays) isn't read: Network
    Rail cancels and overlays the bank holidays' trains with short-term
    records.
"""
import csv, datetime, gzip, io, json, sys, zipfile
from array import array
from collections import Counter, defaultdict

PASSENGER = {"P", "1"}
WEEKDAY = range(7)


def lines(path):
    """The extract's lines, as bytes, unpacked as they're read where it's
    gzipped."""
    with open(path, "rb") as f:
        gz = f.read(2) == b"\x1f\x8b"
    with (gzip.open if gz else open)(path, "rb") as f:
        yield from f


def date(s):
    return datetime.date(int(s[:4]), int(s[5:7]), int(s[8:10]))


def clock(public, working):
    """A public time ("HHMM") as minutes after midnight, None for none."""
    if not public or not public.strip():
        return None
    if public == "0000" and not (working or "").startswith(("235", "000")):
        return None
    return int(public[:2]) * 60 + int(public[2:4])


def calls(locations):
    """A schedule's public stops: [(tiploc, arrival, departure)], minutes
    counted on past midnight."""
    out, last, day = [], -1, 0
    for loc in locations:
        arr = clock(loc.get("public_arrival"), loc.get("arrival"))
        dep = clock(loc.get("public_departure"), loc.get("departure"))
        if arr is None and dep is None:
            continue
        arr = dep if arr is None else arr
        dep = arr if dep is None else dep
        arr += day
        while arr < last:
            day += 1440
            arr += 1440
        dep += day
        while dep < arr:
            day += 1440
            dep += 1440
        out.append((loc["tiploc_code"], arr, dep))
        last = dep
    return out


def read(path, operators, lo, hi):
    """One pass over the extract: ({tiploc: (crs, name, stanox, nlc)},
    {uid: [record]}), a record being (stp, start, end, days, train or None)
    for each schedule between lo and hi, train (atoc code, headcode, stops)
    for a passenger train of one of operators; stops() unpacks the stops.

    The window holds some 300,000 passenger schedules, millions of stops: as
    tuples they took gigabytes, so each schedule's stops are packed (tiploc
    number, arrival, departure: three ints a stop, Stops below), and a
    pattern several schedules share is kept once."""
    tiplocs, uids, seen = {}, defaultdict(list), Counter()
    pool, days_of = {}, {}
    for line in lines(path):
        if line.startswith(b'{"TiplocV1"'):
            t = json.loads(line)["TiplocV1"]
            tiplocs[t["tiploc_code"]] = ((t.get("crs_code") or "").strip(), (t.get("tps_description") or "").strip(),
                                         (t.get("stanox") or "").strip(), (t.get("nalco") or "").strip())
            continue
        if not line.startswith(b'{"JsonScheduleV1"'):
            if line.startswith(b'{"JsonTimetableV1"'):
                head = json.loads(line)["JsonTimetableV1"]
                stamp = datetime.datetime.fromtimestamp(head["timestamp"], datetime.timezone.utc)
                print(f"  ntrod: extract of {stamp:%Y-%m-%d %H:%M} UTC, sequence {head['Metadata']['sequence']}")
            continue
        s = json.loads(line)["JsonScheduleV1"]
        start, end = s["schedule_start_date"], s["schedule_end_date"]
        start = days_of.get(start) or days_of.setdefault(start, date(start))
        end = days_of.get(end) or days_of.setdefault(end, date(end))
        if end < lo or start > hi:
            continue
        stp, days = sys.intern(s["CIF_stp_indicator"]), sys.intern(s["schedule_days_runs"])
        if stp != "C" and s.get("applicable_timetable") != "Y":
            seen["not applicable"] += 1
            continue
        train = None
        if stp != "C" and s.get("train_status") in PASSENGER and s.get("atoc_code") in operators:
            seg = s.get("schedule_segment") or {}
            stops = calls(seg.get("schedule_location") or [])
            if len(stops) >= 2:
                packed = Stops.pack(stops)
                train = (sys.intern(s["atoc_code"]), sys.intern((seg.get("signalling_id") or "").strip() or s["CIF_train_uid"]),
                         pool.setdefault(packed, packed))
            else:
                seen["no public stops (empty stock)"] += 1
        uids[sys.intern(s["CIF_train_uid"])].append((stp, start, end, days, train))
        seen[stp] += 1
    for uid in [u for u, recs in uids.items() if not any(r[4] for r in recs)]:
        del uids[uid]  # freight, and other railroads' trains
    print(f"  ntrod: {len(tiplocs)} tiplocs; schedules in the window: "
          + ", ".join(f"{k} {v}" for k, v in sorted(seen.items()))
          + f"; {len(pool)} stopping patterns, {sum(len(p) for p in pool) >> 20} MB packed")
    return tiplocs, uids


class Stops(bytes):
    """A schedule's stops packed: ints (tiploc number, arrival, departure)
    for each, the tiplocs numbered as first met (Stops.names)."""
    names, number = [], {}

    @classmethod
    def pack(cls, stops):
        ints = array("i")
        for tl, arr, dep in stops:
            n = cls.number.get(tl)
            if n is None:
                n = cls.number[tl] = len(cls.names)
                cls.names.append(sys.intern(tl))
            ints.extend((n, arr, dep))
        return cls(ints.tobytes())

    def __iter__(self):
        ints = array("i")
        ints.frombytes(self)
        for i in range(0, len(ints), 3):
            yield self.names[ints[i]], ints[i + 1], ints[i + 2]


def station_codes(tiplocs, same=None, fold=None):
    """{tiploc: crs} for every tiploc of a station, those without a code of
    their own given their station's (see above). same: {tiploc: crs} by
    hand, for the ones neither number ties to it. fold: {crs: crs}, a
    station's second code (a platform group's: St Pancras' HS1 platforms
    are SPX, its others STP) as its first."""
    stanox, nlc = defaultdict(set), defaultdict(set)
    for tl, (crs, _, sx, nl) in tiplocs.items():
        if crs and crs[0] not in "XZ":
            if sx:
                stanox[sx].add(crs)
            if nl:
                nlc[nl[:4]].add(crs)
    out = {}
    for tl, (crs, _, sx, nl) in tiplocs.items():
        if crs:
            out[tl] = crs
        elif same and tl in same:
            out[tl] = same[tl]
        elif len(stanox.get(sx, ())) == 1:
            out[tl] = next(iter(stanox[sx]))
        elif nl and len(nlc.get(nl[:4], ())) == 1:
            out[tl] = next(iter(nlc[nl[:4]]))
    return {tl: (fold or {}).get(crs, crs) for tl, crs in out.items()}


def resolve(uids, window):
    """Each record that runs, with its dates: {(uid, index): mask}, bit k
    of mask the window's day k. On
    each day a short-term record (O, N, C) wins over the permanent one, the
    one over the fewest days first; a cancellation, or a record for a bus or
    another railroad's train, runs no train of ours that day."""
    runs = defaultdict(int)
    for uid, recs in uids.items():
        if not any(r[4] for r in recs):
            continue
        for k, d in enumerate(window):
            wd, best, rank = d.weekday(), None, None
            for i, (stp, start, end, days, _) in enumerate(recs):
                if start <= d <= end and days[wd] == "1":
                    r = (stp != "P", -(end - start).days, stp == "C")
                    if best is None or r > rank:
                        best, rank = i, r
            if best is not None and recs[best][4]:
                runs[(uid, best)] |= 1 << k
    return runs


def to_gtfs(path, operators, places, more_places=None, line_of=None, today=None, days_ahead=35, tz="Europe/London",
            urls=None, same=None, fold=None):
    """The extract at path as a GTFS zip's bytes: the passenger trains of
    operators ({atoc code: railroad id}) that run from yesterday to
    days_ahead days on, at the stations of places ({crs: [name, lat, lon]}).
    more_places({crs: [tiplocs]}) -> {crs: [name, lat, lon]}: places for the
    stations places lacks. line_of(railroad, [crs]) -> line name (else the
    railroad's id). urls: {railroad: (name, url)} for agency.txt. same:
    {tiploc: crs} and fold {crs: crs} for station_codes."""
    today = today or datetime.date.today()
    lo, hi = today - datetime.timedelta(1), today + datetime.timedelta(days_ahead)
    window = [lo + datetime.timedelta(d) for d in range((hi - lo).days + 1)]
    tiplocs, uids = read(path, operators, lo, hi)
    code = station_codes(tiplocs, same, fold)
    places = dict(places)
    wanted = defaultdict(set)
    for recs in uids.values():
        for *_, train in recs:
            for tiploc, *_ in (train[2] if train else ()):
                crs = code.get(tiploc)
                if crs and crs not in places:
                    wanted[crs].add(tiploc)
    if wanted and more_places:
        of = defaultdict(list)  # each station's tiplocs, its own first
        for tl, crs in sorted(code.items(), key=lambda x: (tiplocs[x[0]][0] != x[1], x[0])):
            if crs in wanted:
                of[crs].append(tl)
        found = more_places(dict(of))
        places.update(found)
        print(f"  ntrod: {len(wanted)} stations not in the station list, {len(found)} placed from NaPTAN")
    runs = resolve(uids, window)
    print(f"  ntrod: {len(runs)} schedules run in the window ({lo} to {hi})")

    # Each trip kept small (there are a few hundred thousand): its stops
    # packed as (station number, arrival, departure), its dates as the
    # number of its calendar.
    crs_names, crs_number = [], {}
    services, service_of = [], {}  # [mask of the window's days], {mask: index}
    dropped, trips, used, routes = Counter(), [], set(), {}
    for (uid, i), dates in sorted(runs.items()):
        stp, start, _, _, (atoc, headcode, stops) = uids[uid][i]
        railroad = operators[atoc]
        seq = []
        for tiploc, arr, dep in stops:
            crs = code.get(tiploc)
            if not crs or crs not in places:
                dropped[f"{tiploc} ({tiplocs.get(tiploc, ('', '?'))[1]})" + ("" if crs else ", no station")] += 1
                continue
            if seq and seq[-1][0] == crs:  # a station's two tiplocs, one after the other
                seq[-1] = (crs, seq[-1][1], dep)
                continue
            seq.append((crs, arr, dep))
        if len(seq) < 2:
            continue
        line = line_of(railroad, [c for c, *_ in seq]) if line_of else railroad
        route = routes.setdefault((railroad, line), f"{railroad}-{len(routes) + 1}")
        if dates not in service_of:
            service_of[dates] = len(services)
            services.append(dates)
        ints = array("i")
        for crs, arr, dep in seq:
            if crs not in crs_number:
                crs_number[crs] = len(crs_names)
                crs_names.append(crs)
            ints.extend((crs_number[crs], arr, dep))
        trips.append((railroad, headcode, seq[0][2], uid, start, stp, route, service_of[dates], ints))
        used.update(c for c, *_ in seq)
    for k, n in dropped.most_common(15):
        print(f"  ntrod: stop left out: {k} ({n} trains)")
    if len(dropped) > 15:
        print(f"  ntrod: and {len(dropped) - 15} other stops left out")

    # Keys: headcode, then "~2", "~3" for the railroad's other trains with
    # it on a day one already runs; the earlier train takes the plain one.
    taken = defaultdict(int)  # (railroad, key) -> mask of dates
    trips.sort(key=lambda t: t[:5])
    keys = []
    for railroad, headcode, *_, service, _ in trips:
        n, dates = 1, services[service]
        while True:
            key = headcode if n == 1 else f"{headcode}~{n}"
            if not taken[(railroad, key)] & dates:
                break
            n += 1
        taken[(railroad, key)] |= dates
        keys.append(key)
    del taken

    hms = lambda m: "%02d:%02d:00" % divmod(m, 60)
    ids, trip_ids = Counter(), []
    for railroad, headcode, _, uid, start, stp, *_ in trips:
        tid = f"{uid}-{stp}{start:%Y%m%d}"
        ids[tid] += 1
        trip_ids.append(tid + ("" if ids[tid] == 1 else f"-{ids[tid]}"))

    def stop_rows():
        for tid, t in zip(trip_ids, trips):
            ints = t[8]
            for k in range(0, len(ints), 3):
                yield tid, hms(ints[k + 1]), hms(ints[k + 2]), crs_names[ints[k]], k // 3 + 1

    # Written into the zip a table at a time, as they're made.
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        def table(name, header, rows):
            with z.open(name, "w") as raw, io.TextIOWrapper(raw, "utf-8", newline="") as f:
                w = csv.writer(f, lineterminator="\n")
                w.writerow(header)
                w.writerows(rows)

        table("agency.txt", ["agency_id", "agency_name", "agency_url", "agency_timezone", "agency_lang"],
              ([r, *(urls or {}).get(r, (r, "https://www.nationalrail.co.uk")), tz, "en"] for r in sorted(set(operators.values()))))
        table("routes.txt", ["route_id", "agency_id", "route_short_name", "route_long_name", "route_type"],
              ([rid, railroad, line, "", 2] for (railroad, line), rid in sorted(routes.items(), key=lambda x: x[1])))
        table("calendar_dates.txt", ["service_id", "date", "exception_type"],
              ([f"s{i + 1}", d.strftime("%Y%m%d"), 1] for i, mask in enumerate(services)
               for k, d in enumerate(window) if mask >> k & 1))
        table("trips.txt", ["route_id", "service_id", "trip_id", "trip_short_name", "trip_headsign"],
              ([t[6], f"s{t[7] + 1}", tid, key, places[crs_names[t[8][-3]]][0]] for tid, key, t in zip(trip_ids, keys, trips)))
        table("stop_times.txt", ["trip_id", "arrival_time", "departure_time", "stop_id", "stop_sequence"], stop_rows())
        table("stops.txt", ["stop_id", "stop_code", "stop_name", "stop_lat", "stop_lon"],
              ([crs, crs, *places[crs]] for crs in sorted(used)))
    print(f"  ntrod: {len(trips)} trips, {len(used)} stations, {len(routes)} lines, {len(services)} calendars")
    return buf.getvalue()
