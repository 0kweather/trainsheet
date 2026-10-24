"""Switzerland: every railway's passenger trains (SBB, BLS, SOB, Thurbo,
RegionAlps, TPF, the metre-gauge and rack railways, and the foreign
railways' trains into Switzerland), placed from the national timetable
(GTFS, opentransportdata.swiss, no key) and moved by its GTFS-Realtime trip
updates (delays, cancellations, skipped stops; a key, kept by the relay),
with each train's formation, car by car, from its Train Formation Service
(a key; asked for only for a train a viewer opens or tracks).

Terms (opentransportdata.swiss's terms of use, checked October 2026): its
data may be processed and published, in an application or service too, by
anyone; raw data must cite opentransportdata.swiss as its source, and data
published must be kept as current as the source (the timetable is rebuilt
weekly, the live data relayed each minute); keyed APIs are free within
their limits (below), and a key may be blocked if they're exceeded again and
again. Nothing in them rules out a public map or a relay that caches.

Railroads (the car files that draw them in brackets) and their lines (the
category as sold and the line number, "IC 1", "IR 15", "RE 33", "S 12"; a
category alone, "IC", "EC", for trains of no line):
  sbb            SBB long distance [sbb]: IC 1, IC 2, IC 21, IC 3, IC 5, IC 51,
                 IC 6, IC 61, IC 8, IC 81, IC; IR 13-IR 95, IR; EC (SBB's
                 Giruno and Astoro ECs: Zürich-Milano/Como/Chiasso, Basel and
                 Genève-Domodossola-Milano, Zürich-München as far as Bregenz),
                 PE (the Gotthard Panorama Express, in season)
  sbbregio       SBB regional [sbbregio]: RE, R, S and SN lines (the S-Bahns of
                 Zürich, Bern, Basel, St. Gallen, Luzern, Zug, Aargau, Vaud;
                 Léman Express L1-L6; TILO in Ticino and Lombardy: S 10, S 20,
                 S 30, S 40, S 50, S 90, RE 80), EXT (extra trains), and SBB
                 GmbH's lines in Baden-Württemberg (S 5, S 6, S 62, S 64, RB, RE)
  bls            BLS [chstd]: S 1-S 77 (Bern), RE 1-RE 9, R 11, R 12, IR 17,
                 IR 35, IR 56, IR 65, IR 66, IC 51, GoldenPass Express (its
                 Interlaken-Zweisimmen leg)
  sob            Südostbahn [chstd]: IR 13, IR 17, IR 26, IR 35, IR 46 (Treno
                 Gottardo, Traverso), Voralpen-Express, S 4-S 81
  thurbo         Thurbo [chstd]: S 1-S 82, SN, RE, IR 75
  regionalps     RegionAlps [chstd]: R, R 81, R 82, R 91
  tpf            TPF [chstd]: RE 2, RE 3, S 20, S 21, S 50, S 51, R
  chstdother     other standard gauge [chstd]: SZU (S 4, S 10 Uetliberg, SN 4),
                 OeBB (S 22), transN's Val-de-Travers line (R 21)
  rhb            Rhätische Bahn [chnarrow]: RE 1-RE 38, R 1-R 38, S, S 1, S 2,
                 IR 38, Glacier Express (its Disentis-St. Moritz leg), Bernina
                 Express
  mgb            Matterhorn Gotthard Bahn [chnarrow]: R 40-R 45, Glacier
                 Express (Zermatt-Disentis)
  zb             Zentralbahn [chnarrow]: Luzern–Interlaken Express, Luzern–
                 Engelberg Express, S 4, S 41, S 44, S 5, S 55, R 70, R 71
  mob            MOB [chnarrow]: R 30-R 34, GoldenPass Express (Montreux-
                 Zweisimmen), GoldenPass Panoramic
  chnarrowother  the other metre-gauge and rack railways [chnarrow]: RBS (RE 5,
                 S 7-S 9), asm (S 11, S 12, S 37), Aargau Verkehr (S 14, S 17),
                 Appenzeller Bahnen (S 15, S 20-S 26), transN (R 22, R 24),
                 Travys (R 12, R 22), CJ (R 36, R 37), MBC (R 56, R 57), LEB
                 (R 20), TPC (R 70-R 74), MVR (R 35, R 37), NStCM (R 55), FART
                 (RE 73, Centovalli Express), FLP (S 60), TMR (R 85), BOB (R 61,
                 R 62), BLM (R 66); and by name the Wengernalpbahn,
                 Jungfraubahn, Schynige Platte-Bahn, Gornergratbahn, Rigi
                 Bahnen, Pilatusbahn, Brienz Rothorn Bahn and Ferrovia Monte
                 Generoso
  chintl         foreign railways' trains [chintl]: ICE (DB, to Basel, Zürich,
                 Chur, Bern, Interlaken, Brig), TGV Lyria, RJX (ÖBB Railjet),
                 NJ (Nightjet), EC (ÖBB's Zürich-Graz), IC (DB's Zürich-
                 Stuttgart), TER (SNCF into Basel, Genève, La Chaux-de-Fonds
                 and Vallorbe), and DB's and ÖBB's regional trains into Basel,
                 Schaffhausen, St. Margrethen and Buchs SG (RE 3, RE 7, RE 27,
                 RB 27, R 2, R 5, S 2, S 3)
TILO's lines are shown from this timetable alone (Trenord's plug-in leaves
them out). Rack railways are in: the mixed rack-and-adhesion lines (BOB,
zb's Brünig, MGB, TPC, MVR) with their railways, the summit lines (category
CC in the file) in chnarrowother by name. Left out: funiculars, cable cars,
buses, trams (Neuchâtel's Littorail too), boats, heritage railways and
replacement buses.
"""
import csv, datetime, gzip, io, json, re, time, urllib.error, urllib.parse, urllib.request, zipfile
from collections import defaultdict

CREDIT = {"label": "opentransportdata.swiss", "href": "https://opentransportdata.swiss"}
BBOX = [5.9, 45.8, 10.5, 47.85]
TZ = "Europe/Zurich"
COMMON = {"region": "Switzerland", "country": "CH", "tz": TZ, "credit": CREDIT, "license": "opentransportdata.swiss terms of use",
          "bbox": BBOX, "clip": True}

AGENCIES = {
    "sbb": {"name": "SBB", "short": "SBB", "color": "#eb0000", "kind": "intercity", "cars": "sbb", **COMMON},
    "sbbregio": {"name": "SBB Regional", "short": "SBB Regio", "color": "#eb0000", "kind": "commuter", "cars": "sbbregio",
                 "after": "sbb", **COMMON},
    "bls": {"name": "BLS", "short": "BLS", "color": "#7ab929", "kind": "commuter", "cars": "chstd", "after": "sbbregio", **COMMON},
    "sob": {"name": "Südostbahn", "short": "SOB", "color": "#a0806a", "kind": "commuter", "cars": "chstd", "after": "bls", **COMMON},
    "thurbo": {"name": "Thurbo", "short": "Thurbo", "color": "#0064a8", "kind": "commuter", "cars": "chstd", "after": "sob", **COMMON},
    "regionalps": {"name": "RegionAlps", "short": "RegionAlps", "color": "#e2001a", "kind": "commuter", "cars": "chstd",
                   "after": "thurbo", **COMMON},
    "tpf": {"name": "TPF", "short": "TPF", "color": "#00519e", "kind": "commuter", "cars": "chstd", "after": "regionalps", **COMMON},
    "chstdother": {"name": "Other Swiss railways", "short": "CH", "color": "#5b6770", "kind": "commuter", "cars": "chstd",
                   "after": "tpf", **COMMON},
    "rhb": {"name": "Rhätische Bahn", "short": "RhB", "color": "#c4022b", "kind": "commuter", "cars": "chnarrow",
            "after": "chstdother", **COMMON},
    "mgb": {"name": "Matterhorn Gotthard Bahn", "short": "MGB", "color": "#c8102e", "kind": "commuter", "cars": "chnarrow",
            "after": "rhb", **COMMON},
    "zb": {"name": "Zentralbahn", "short": "zb", "color": "#0a3a7d", "kind": "commuter", "cars": "chnarrow", "after": "mgb", **COMMON},
    "mob": {"name": "MOB GoldenPass", "short": "MOB", "color": "#1d3c6e", "kind": "commuter", "cars": "chnarrow", "after": "zb", **COMMON},
    "chnarrowother": {"name": "Swiss metre-gauge and rack railways", "short": "CH narrow gauge", "color": "#7b4a2a",
                      "kind": "commuter", "cars": "chnarrow", "after": "mob", **COMMON},
    "chintl": {"name": "International trains in Switzerland", "short": "International", "color": "#4a4a4a",
               "kind": "intercity", "cars": "chintl", "after": "chnarrowother", **COMMON},
}

# ---------- The timetable ----------
# The national timetable as GTFS ("Timetable <year> (GTFS2020)",
# opentransportdata.swiss, no key), published Mondays and Thursdays: 290 MB
# of every bus, tram, boat, cable car and train, 3.7 GB of stop times. Its
# permalink names the timetable year, which runs from the December timetable
# change (the Sunday after the second Saturday of December) to the next.


def timetable_year(today=None):
    today = today or datetime.date.today()
    dec = datetime.date(today.year, 12, 1)
    second_sat = dec + datetime.timedelta((5 - dec.weekday()) % 7 + 7)
    return today.year + 1 if today >= second_sat + datetime.timedelta(1) else today.year


GTFS_URL = f"https://data.opentransportdata.swiss/en/dataset/timetable-{timetable_year()}-gtfs2020/permalink"
# Rail: route types 100-117 (the categories as route_desc: IC, IR, RE, S, PE
# for the panorama trains, CC for the rack railways, EXT for extra trains).
RAIL_TYPES = range(100, 118)
DAYS_AHEAD = 60  # trips running in the next two months are kept


def _rows(zf, name):
    with zf.open(name) as f:
        yield from csv.DictReader(io.TextIOWrapper(f, "utf-8-sig"))


def rail_cut(data, today=None):
    """The national file cut to rail: (routes, trips, stops, stop_times,
    calendar, calendar_dates), each a list of dicts (stop_times a dict
    trip id -> [(seq, uic, arr, dep, pickup, drop_off)]), stops by UIC
    number (the station: its name and place, the platforms folded in), for
    the trips that run in the next DAYS_AHEAD days."""
    today = today or datetime.date.today()
    window = [today - datetime.timedelta(1) + datetime.timedelta(d) for d in range(DAYS_AHEAD + 1)]
    zf = zipfile.ZipFile(io.BytesIO(data))
    routes = {r["route_id"]: r for r in _rows(zf, "routes.txt") if r["route_type"].isdigit() and int(r["route_type"]) in RAIL_TYPES}
    trips = {t["trip_id"]: t for t in _rows(zf, "trips.txt") if t["route_id"] in routes}
    services = {t["service_id"] for t in trips.values()}
    runs = defaultdict(set)
    calendar = [c for c in _rows(zf, "calendar.txt") if c["service_id"] in services]
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    for c in calendar:
        a, b = (datetime.datetime.strptime(c[k], "%Y%m%d").date() for k in ("start_date", "end_date"))
        for d in window:
            if a <= d <= b and c[days[d.weekday()]] == "1":
                runs[c["service_id"]].add(d)
    dates = []
    lo, hi = window[0].strftime("%Y%m%d"), window[-1].strftime("%Y%m%d")
    with zf.open("calendar_dates.txt") as f:  # 290 MB: split by hand, not csv
        head = [c.strip('"') for c in f.readline().decode("utf-8-sig").rstrip("\r\n").split(",")]
        at = [head.index(c) for c in ("service_id", "date", "exception_type")]
        for line in f:
            x = line.decode("utf-8").rstrip("\r\n").split(",")
            sid, date, kind = (x[n].strip('"') for n in at)
            if sid in services and lo <= date <= hi:
                dates.append({"service_id": sid, "date": date, "exception_type": kind})
                d = datetime.date(int(date[:4]), int(date[4:6]), int(date[6:]))
                (runs[sid].add if kind == "1" else runs[sid].discard)(d)
    trips = {k: t for k, t in trips.items() if runs.get(t["service_id"])}
    services = {t["service_id"] for t in trips.values()}
    calendar = [c for c in calendar if c["service_id"] in services]
    dates = [c for c in dates if c["service_id"] in services]
    station = {}
    for s in _rows(zf, "stops.txt"):
        station[s["stop_id"]] = s
    times = defaultdict(list)
    # 3.7 GB of stop times, read line by line: a line is split only when its
    # trip (the first column, quoted or not) is kept. No field of the file
    # holds a comma.
    keep = {k.encode() for k in trips}
    with zf.open("stop_times.txt") as f:
        head = [c.strip('"') for c in f.readline().decode("utf-8-sig").rstrip("\r\n").split(",")]
        i = {c: n for n, c in enumerate(head)}
        for line in f:
            tid = line.split(b",", 1)[0].strip(b'"')
            if tid in keep:
                x = [v.strip('"') for v in line.decode("utf-8").rstrip("\r\n").split(",")]
                s = station.get(x[i["stop_id"]])
                if s:
                    times[x[i["trip_id"]]].append((int(x[i["stop_sequence"]]), s["didok"], x[i["arrival_time"]], x[i["departure_time"]],
                                                    x[i["pickup_type"]], x[i["drop_off_type"]]))
    used = {u for seq in times.values() for _, u, *_ in seq}
    stops = {}
    for s in station.values():  # the station's own row (its parent's) names and places it
        if s["didok"] in used and (s.get("location_type") == "1" or s["didok"] not in stops):
            stops[s["didok"]] = {"stop_id": s["didok"], "stop_name": s["stop_name"], "stop_lat": s["stop_lat"], "stop_lon": s["stop_lon"]}
    return routes, trips, stops, times, calendar, dates, runs


# The file's railways (its agency ids) as the map's railroads. SBB's own
# trains (agency 11, every international train is filed under it too) split
# by category below; the other railways by operator.
OPERATORS = {
    "L7____": "sbbregio", "351": "sbbregio",  # SBB GmbH: SBB's trains in Baden-Württemberg (Basel, Schaffhausen, Seehas)
    "33": "bls", "82": "sob", "65": "thurbo", "74": "regionalps", "53": "tpf",
    "78": "chstdother", "68": "chstdother", "73": "chstdother",  # SZU, OeBB, transN (Val-de-Travers)
    "72": "rhb", "48": "mgb", "93": "mgb", "86": "zb", "64": "mob",
    # Metre gauge and rack: RBS, Aare Seeland mobil (snb, rvo, bti), Aargau
    # Verkehr (WSB, BDWM), Appenzeller Bahnen, transN (cmn), Travys
    # (Yverdon-Ste-Croix), CJ, MBC, LEB, TPC, MVR (cev, mtgn), NStCM, FART,
    # FLP, TMR, BOB (and its Schynige Platte line), WAB, JB, BLM, GGB, the
    # Rigi, the Pilatus, the Brienz Rothorn and Monte Generoso railways.
    **{a: "chnarrowother" for a in ("88", "81", "56", "38", "96", "31", "22", "44", "97", "43", "29", "55", "23", "42", "131",
                                    "66", "49", "47", "61", "35", "140", "157", "124", "32", "121", "137", "136", "104", "129")},
    # Foreign railways: DB Regio Baden-Württemberg, ÖBB (NeTS), DB (NeTS);
    # only their trains that call in Switzerland.
    **{a: "chintl" for a in ("800693", "06____", "817000", "807000", "81____", "80_VHB", "87_LEX")},
}
# Left out: heritage and museum railways (Dampfbahn Bern, Blonay-Chamby,
# ANAT's tram, DVZO, the Furka steam railway, Swiss Rail Traffic's
# specials), "Diverse INFO" (a Glacier Express listed again), a timetable
# entry for posters only (agency 3000), the NStCM's replacement buses (7258),
# Emosson's little park train (VerticAlp) and Neuchâtel's Littorail (a tram).
LEFT_OUT = {"9014", "371", "3271", "908", "160", "525", "9999", "3000", "7258", "803"}
# SBB's categories: its long-distance trains, and the foreign railways'
# trains filed under it (ICE, TGV Lyria, Nightjet, Railjet, SNCF's TER).
SBB_LONG = {"IC", "IR", "EC", "PE"}
FOREIGN = {"ICE", "TGV", "NJ", "EN", "RJX", "TER"}
# ÖBB's own ECs (Zürich-Graz, "Transalpin"); SBB runs the others (Giruno
# and Astoro to Milano and on, Astoro to München). The Zürich-Stuttgart
# ICs (route 91-19-Y, numbers 180-189, 280-289) are DB's trains.
OBB_EC = {"163", "164"}
DB_IC_ROUTES = {"91-19-Y"}


def railroad(route, trip, swiss):
    """The map's railroad for a trip of the file, or None to leave it out.
    swiss: whether it calls in Switzerland."""
    a, cat, short = route["agency_id"], route["route_desc"], route["route_short_name"]
    if a in LEFT_OUT or "EV" in (cat, short) or route["route_id"].startswith("91-15-K"):  # replacement buses, Littorail
        return None
    if a == "11":
        if cat in FOREIGN or (cat == "EC" and trip["trip_short_name"] in OBB_EC) \
                or any(route["route_id"].startswith(p + "-") for p in DB_IC_ROUTES):
            return "chintl"
        # Trenord's own S 11 (Chiasso-Milano), filed here too: Italy's.
        if short == "S11":
            return None
        return "sbb" if cat in SBB_LONG else "sbbregio"
    ours = OPERATORS.get(a)
    if ours == "chintl" and not swiss:
        return None
    if a == "L7____" and not swiss and cat not in ("S", "RB", "RE"):
        return None
    return ours


# Line names: the category as sold and the line number ("IC 1", "IR 15",
# "S 12", "RE 6a"); the panorama trains and the rack railways by name.
BRANDS = {"GEX": "Glacier Express", "BEX": "Bernina Express", "GPX": "GoldenPass Express", "LIX": "Luzern–Interlaken Express",
          "IRLIX": "Luzern–Interlaken Express", "IRLEX": "Luzern–Engelberg Express", "VAE": "Voralpen-Express"}
RACK = {"104": "Brienz Rothorn Bahn", "121": "Gornergratbahn", "124": "Jungfraubahn", "129": "Ferrovia Monte Generoso",
        "136": "Pilatusbahn", "137": "Rigi Bahnen", "140": "Schynige Platte-Bahn", "157": "Wengernalpbahn"}
PANORAMA = {("64", "30"): "GoldenPass Panoramic", ("49", "72"): "Centovalli Express"}


def line_name(route):
    a, cat, short = route["agency_id"], route["route_desc"], route["route_short_name"]
    if a in RACK:
        return RACK[a]
    if short in BRANDS:
        return BRANDS[short]
    if (a, short) in PANORAMA:
        return PANORAMA[(a, short)]
    rest = short[len(cat):] if short.startswith(cat) else short
    if cat == "EXT" and rest.startswith("EXT"):
        rest = rest[3:]
    if cat == "TGV":
        return "TGV Lyria"
    if re.fullmatch(r"L\d+", rest):  # the Léman Express, "L1"-"L6", as it's signed
        return rest
    return f"{cat} {rest}".strip() if rest and rest != cat else cat


# The file gives its lines no colours, and the operators publish none as
# data: each line takes its category's (our own palette, not official
# colours): the long-distance trains SBB's red, RegioExpress plum, regional
# trains navy, S-Bahn blue, the night S-Bahn indigo, the panorama trains
# gold, the rack railways brown, extra trains grey.
CATEGORY_COLORS = {**{c: "eb0000" for c in ("IC", "IR", "EC", "ICE", "TGV", "RJX", "NJ", "EN")}, "RE": "7a1d5b", "R": "2d327d",
                   "RB": "2d327d", "TER": "2d327d", "S": "0079c7", "SN": "3a3a8c", "PE": "b07c1c", "CC": "6b4a2b", "EXT": "767676"}


def color(route):
    return CATEGORY_COLORS.get(route["route_desc"], "")


# Foreign stations as their own railways sign them: the file adds the
# country ("Domodossola (I)", "Luino (I)").
def station_name(name):
    return re.sub(r"\s+\((I|D|F|A|FL)\)$", "", name.strip())


# A train running on abroad (DB's regional trains from Basel to Offenburg
# and Karlsruhe, a TGV from Paris) is kept as far as the track build_rail.py
# routes (half a degree past the box): its longest run of stops within it
# that calls in Switzerland.
REACH = [BBOX[0] - 0.5, BBOX[1] - 0.5, BBOX[2] + 0.5, BBOX[3] + 0.5]


def reach(seq, stops):
    def inside(u):
        s = stops.get(u)
        return s and REACH[0] <= float(s["stop_lon"]) <= REACH[2] and REACH[1] <= float(s["stop_lat"]) <= REACH[3]
    best, run = [], []
    for x in seq + [None]:
        if x and inside(x[1]):
            run.append(x)
            continue
        if any(y[1].startswith("85") for y in run) and len(run) > len(best):
            best = run
        run = []
    return best


def convert(data):
    """The national file as a GTFS of the map's railroads (feeds.py's
    "convert"): rail only, the trips of the next DAYS_AHEAD days, each
    route split by railroad (route ids "<railroad>:<the file's id>", agency
    ids the railroads'), its line name in route_short_name, and stops as
    stations by their UIC numbers (platforms folded in)."""
    routes, trips, stops, times, calendar, dates, runs = rail_cut(data)
    out_routes, out_trips = {}, []
    for tid, t in trips.items():
        seq = times[tid] = reach(sorted(times.get(tid, ())), stops)
        if len(seq) < 2:
            continue
        r = routes[t["route_id"]]
        ours = railroad(r, t, any(u.startswith("85") for _, u, *_ in seq))
        if not ours:
            continue
        rid = f"{ours}:{r['route_id']}"
        out_routes.setdefault(rid, {"route_id": rid, "agency_id": ours, "route_short_name": line_name(r), "route_long_name": "",
                                    "route_desc": r["route_desc"], "route_type": r["route_type"], "route_color": color(r)})
        out_trips.append({**{k: t.get(k, "") for k in ("service_id", "trip_id", "trip_headsign", "trip_short_name", "direction_id")},
                          "route_id": rid, "_start": seq[0][3]})
    # A number is a train's on its day, but not the file's own key: a train
    # through two railways' timetables, or one that changes its line on the
    # way, is two trips of one number, and small railways reuse each other's
    # numbers (MBC's 422 and asm's 422 on the same day). Each trip of a
    # railroad's number takes the first slot (the number, "422", then
    # "422~1", "422~2") that no trip of that number running on one of its
    # days holds, in order of first departure; the page shows the number
    # before the "~".
    slots = defaultdict(list)  # (railroad, number) -> [set of dates held] by slot
    for t in sorted(out_trips, key=lambda t: (t["_start"], t["trip_id"])):
        held, mine = slots[(t["route_id"].split(":")[0], t["trip_short_name"])], runs[t["service_id"]]
        k = next((i for i, dates in enumerate(held) if not dates & mine), len(held))
        if k == len(held):
            held.append(set())
        held[k] |= mine
        t["trip_short_name"] += f"~{k}" if k else ""
    kept = {t["trip_id"] for t in out_trips}
    services = {t["service_id"] for t in out_trips}
    used = {u for tid in kept for _, u, *_ in times[tid]}

    def table(rows, cols):
        buf = io.StringIO()
        w = csv.DictWriter(buf, cols, extrasaction="ignore", lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
        return buf.getvalue()

    st = io.StringIO()
    st.write("trip_id,arrival_time,departure_time,stop_id,stop_sequence,pickup_type,drop_off_type\n")
    for tid in sorted(kept):
        for seq, u, arr, dep, pick, drop in times[tid]:
            st.write(f"{tid},{arr},{dep},{u},{seq},{pick},{drop}\n")
    agency = [{"agency_id": a, "agency_name": AGENCIES[a]["name"], "agency_url": "https://opentransportdata.swiss", "agency_timezone": TZ}
              for a in AGENCIES]
    stop_rows = [{**s, "stop_name": station_name(s["stop_name"])} for k, s in sorted(stops.items()) if k in used]
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=1) as z:
        z.writestr("agency.txt", table(agency, ["agency_id", "agency_name", "agency_url", "agency_timezone"]))
        z.writestr("routes.txt", table(sorted(out_routes.values(), key=lambda r: r["route_id"]),
                                       ["route_id", "agency_id", "route_short_name", "route_long_name", "route_desc", "route_type",
                                        "route_color"]))
        z.writestr("trips.txt", table(out_trips, ["route_id", "service_id", "trip_id", "trip_headsign", "trip_short_name", "direction_id"]))
        z.writestr("stops.txt", table(stop_rows, ["stop_id", "stop_name", "stop_lat", "stop_lon"]))
        z.writestr("stop_times.txt", st.getvalue())
        z.writestr("calendar.txt", table([c for c in calendar if c["service_id"] in services],
                                         ["service_id", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
                                          "start_date", "end_date"]))
        z.writestr("calendar_dates.txt", table([c for c in dates if c["service_id"] in services], ["service_id", "date", "exception_type"]))
    return out.getvalue()


EXTRAS = {"convert": convert, "number": lambda t: t.get("trip_short_name") or None, "tz": TZ}
# Stations placed where a railroad's own track reaches them ({railroad:
# {UIC number: [lat, lon]}}): OpenStreetMap's MOB track at Zweisimmen meets
# the station's only through yard tracks and crossovers, which the track
# leaves out, so its trains stop at the south end of the station.
POSITIONS = {"mob": {"8507290": [46.5507, 7.3755]}}
GTFS = {a: (GTFS_URL, lambda r, a=a: r["agency_id"] == a, lambda r: r["route_short_name"],
            {**EXTRAS, "positions": POSITIONS.get(a, {})}) for a in AGENCIES}

# The track: Switzerland's standard- and metre-gauge lines (OpenStreetMap),
# the rack railways and the lines over the borders to Domodossola, Milano,
# Como, Varese, Luino, Tirano, Feldkirch, Bregenz, Konstanz, Singen,
# Schaffhausen's German lines, Basel Bad Bf and Freiburg, Mulhouse, Frasne,
# Morteau, Bellegarde and Annemasse routed from the timetables along OSM's
# track (build_rail.py).
RAIL = {"region": "ch", "bbox": BBOX, "network": "sbb",
        "query": 'area["ISO3166-1"="CH"]["admin_level"="2"]->.ch;'
                 'way["railway"~"^(rail|narrow_gauge)$"]["usage"~"^(main|branch)$"][!"service"](area.ch)({bbox});'}


# ---------- Live: GTFS-Realtime trip updates ----------
# opentransportdata.swiss's GTFS-RT (api.opentransportdata.swiss/la/gtfs-rt,
# a free key: the Worker secret CH_GTFSRT_KEY, sent as "Authorization:
# Bearer <key>"): every operator's trip updates for the next three hours,
# delays to 0.1 min, cancellations and skipped stops, for the static
# timetable version it names (published Mondays and Thursdays; the feed
# follows at 15:00). No vehicle positions. Its limits: 2 requests a minute
# per key (cookbook, sliding window; the limits page says 5), refreshed
# every 30 s. The relay asks once a minute (ttl 60), so two copies of it
# stay within the limit, and passes on a compact JSON of the rail trips only
# (compact(), below, and its Worker twin relay/feeds/switzerland.js):
#   {"at": feed time (unix s), "v": static version ("20261021"),
#    "trips": [[start date "20261023", start time "12:41", cancelled 0/1,
#               [[uic, arrival delay s, departure delay s, skipped 0/1], ...]], ...]}
# Its trip ids and routes change with each static version, so the page
# (js/railroads/switzerland.js) finds a trip's train in its timetable by its
# service day, first departure and the stations its updates name (UIC
# numbers, from the stop ids: "ch:1:sloid:3000:10:18" is Zürich HB, 8503000).
# A stop's update is listed only where it differs from the one before.
# Until the relay has the key, the trains are placed from the timetable.
SOURCES = [{"id": "switzerland", "agencies": list(AGENCIES), "format": "json", "interval": 60, "relay": True,
            "needsKey": "CH_GTFSRT_KEY", "untilKey": "timetable", "scope": "view"}]
RELAY = {"switzerland": {"keys": ["CH_GTFSRT_KEY"], "ttl": 60}}
GTFS_RT = "https://api.opentransportdata.swiss/la/gtfs-rt"
IDENTIFYING_UA = "Trainsheet/1.0 (+https://trainsheet.com)"


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


def station_of(stop_id):
    """A GTFS-RT stop id's station, as the timetable's: its UIC number.
    "ch:1:sloid:3000:10:18" -> "8503000"; a foreign stop's id is its number."""
    m = re.match(r"ch:1:sloid:(\d+)", stop_id or "")
    if m:
        return "85" + m[1].zfill(5)
    m = re.match(r"(\d{7})", stop_id or "")
    return m[1] if m else None


def compact(feed):
    """The relay's answer from the GTFS-RT protobuf (bytes): see above."""
    at, version, trips = 0, "", []
    for f, w, v in _fields(feed):
        if f == 1 and w == 2:  # header: timestamp 3, feed_version 4
            for hf, hw, hv in _fields(feed, *v):
                if hf == 3 and hw == 0:
                    at = hv
                elif hf == 4 and hw == 2:
                    version = feed[hv[0]:hv[1]].decode()
        if f != 2 or w != 2:
            continue
        tu = next((x for ef, ew, x in _fields(feed, *v) if ef == 3 and ew == 2), None)  # trip_update
        if not tu:
            continue
        desc, updates = {}, []
        for uf, uw, uv in _fields(feed, *tu):
            if uf == 1 and uw == 2:  # trip: trip_id 1, start_time 2, start_date 3, relationship 4, route_id 5
                for df, dw, dv in _fields(feed, *uv):
                    desc[df] = feed[dv[0]:dv[1]].decode() if dw == 2 else dv
            elif uf == 2 and uw == 2:  # stop_time_update: seq 1, arrival 2, departure 3, stop_id 4, relationship 5
                u = {}
                for sf, sw, sv in _fields(feed, *uv):
                    if sf in (2, 3) and sw == 2:
                        u[sf] = next((_int32(x) for ef, ew, x in _fields(feed, *sv) if ef == 1 and ew == 0), None)
                    elif sf == 4 and sw == 2:
                        u[4] = feed[sv[0]:sv[1]].decode()
                    elif sf in (1, 5) and sw == 0:
                        u[sf] = sv
                updates.append(u)
        # Rail only: the file's rail routes are "91-..." (with its trams)
        # and "93-..." (with its cable cars): the page finds no train for
        # the rest. Added trips (relationship 1) aren't in the timetable.
        route, trip = desc.get(5, ""), desc.get(1, "")
        if not (route[:3] in ("91-", "93-") or trip[:8] in (".ojp-91-", ".ojp-93-")) or desc.get(4) == 1:
            continue
        if not desc.get(3) or not desc.get(2):
            continue
        stops, last = [], None
        for u in sorted(updates, key=lambda u: u.get(1, 0)):
            uic = station_of(u.get(4))
            if not uic:
                continue
            arr, dep = u.get(2), u.get(3)
            arr, dep = arr if arr is not None else dep, dep if dep is not None else arr
            row = [int(uic), arr or 0, dep or 0, 1 if u.get(5) == 1 else 0]
            if last is None or row[1:] != last[1:]:
                stops.append(row)
            last = row
        cancelled = 1 if desc.get(4) == 3 else 0
        if stops or cancelled:
            trips.append([desc[3], desc[2][:5], cancelled, stops])
    trips.sort()
    return {"at": at, "v": version, "trips": trips}


def _get(url, key, timeout=30):
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {key}", "User-Agent": IDENTIFYING_UA,
                                               "Accept-Encoding": "gzip"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        data = r.read()
        return gzip.decompress(data) if data[:2] == b"\x1f\x8b" else data


# ---------- One train's formation (a detail source) ----------
# opentransportdata.swiss's Train Formation Service (v2, the Worker secret
# CH_FORMATION_KEY, "Authorization: Bearer <key>"): a train's vehicles,
# asked for one train at a time, only while a viewer has it open or tracks
# it (the relay's detail sources: per visitor and per minute limits), each
# answer kept 5 minutes. Its limits: 50 requests a minute and 20,000 a day
# per key; the relay holds itself to 30 a minute. It covers only the
# railways that give SBB their formations and agreed to publish them, by
# EVU code: SBBP (SBB, its regional trains too), BLSP, SOB, THURBO, TPF,
# RhB, ZB, OeBB, TRN (transN), MBC (and VDBB, a heritage railway, left out).
# Days: today to three days ahead (formations_full: today's are CUS's real
# time ones). A railroad names its EVU's detail source; the other
# railways' trains ask nothing.
#   GET https://api.opentransportdata.swiss/formation/v2/formations_full
#       ?evu=SBBP&operationDate=2026-10-23&trainNumber=2806
# The answer, as every detail source's (js/sources.js applyDetail), with
# "formation": true (no delay or stop times: those come from the live feed):
#   {"found": true, "formation": true, "number": "2806", "date": "2026-10-23",
#    "evu": "SBBP",
#    "cars": {"numbers": ["948505010017", ...],   # each vehicle's EVN: 12 digits,
#                                                  # no spaces; a vehicle of an
#                                                  # articulated train ("child",
#                                                  # pseudo EVN 0000...) gives its
#                                                  # parent's EVN
#             "classes": ["1", "2", "12", "WR", "LK", "K", "WL"],  # per vehicle, from
#                                                  # its seats (1st, 2nd, both), a
#                                                  # restaurant, beds; LK a vehicle
#                                                  # with none (locomotive), K other
#             "models": ["RABe501", ...],          # FOS type names (typeCodeName)
#             "orders": [11, 12, ...],             # the car numbers riders see (0: none)
#             "complete": true},
#    "stops": [{"name": "Olten", "uic": 8500218, "arr": unix s | null, "dep": unix s | null,
#               "platform": "9", "sectors": "ABCD"}, ...]}
# Vehicles in the order the API numbers them (position 1 first; to be
# checked live against the train's direction), of its first formation
# (trains that split or join have one per part). Not found (no real-time
# data, or a railway it doesn't cover): {"found": false}.
FORMATION = "https://api.opentransportdata.swiss/formation/v2/formations_full"
EVUS = {"chfosbb": "SBBP", "chfobls": "BLSP", "chfosob": "SOB", "chfothurbo": "THURBO", "chfotpf": "TPF",
        "chforhb": "RhB", "chfozb": "ZB", "chfoother": None}
# The other railways' EVUs by the station a train sets out from (a name
# key, as the relay's detail query gives it): OeBB's Oensingen-Balsthal,
# transN's Val-de-Travers and Montagnes neuchâteloises lines, the MBC's
# Morges-Bière-Cossonay lines.
OTHER_EVUS = {"oensingen": "OeBB", "balsthal": "OeBB",
              "neuchatel": "TRN", "buttes": "TRN", "fleurier": "TRN", "travers": "TRN", "lachauxdefonds": "TRN",
              "lespontsdemartel": "TRN", "lelocle": "TRN", "lesbrenets": "TRN",
              "morges": "MBC", "biere": "MBC", "apples": "MBC", "lisle": "MBC", "lislemontlapierre": "MBC"}
for _aid, _det in {"sbb": "chfosbb", "sbbregio": "chfosbb", "bls": "chfobls", "sob": "chfosob", "thurbo": "chfothurbo",
                   "tpf": "chfotpf", "rhb": "chforhb", "zb": "chfozb", "chstdother": "chfoother", "chnarrowother": "chfoother"}.items():
    AGENCIES[_aid]["detail"] = _det
DETAILS = {d: {"ttl": 300, "keys": ["CH_FORMATION_KEY"]} for d in EVUS}


def _iso(t):
    return int(datetime.datetime.fromisoformat(t.replace("Z", "+00:00")).timestamp()) if t else None


def _evn(v):
    """A vehicle's EVN, 12 digits: its own, or for a part of an articulated
    train (its own a pseudo one, "00007515005-7"), its parent's, the set's."""
    ident = v.get("vehicleIdentifier") or {}
    own = re.sub(r"\D", "", ident.get("evn") or "")
    parent = re.sub(r"\D", "", ident.get("parentEvn") or "")
    return parent if len(parent) == 12 else own or None


def _klass(v):
    p = v.get("vehicleProperties") or {}
    first, second = p.get("number1class") or 0, p.get("number2class") or 0
    if first and second:
        return "12"
    if first or second:
        return "1" if first else "2"
    if p.get("numberRestaurantSpace"):
        return "WR"
    if p.get("numberBeds"):
        return "WL"
    name = ((v.get("vehicleIdentifier") or {}).get("typeCodeName") or "")
    return "LK" if re.match(r"(Re|Ae|Ee|Em|Am|Aem|Bm|Ge|HGe|Tm|Hcm|Br|Bh|Eem|Ge)\s*\d", name) else "K"


def formation(answer, number, date, evu):
    """The detail answer from a formations_full answer (a dict)."""
    forms = answer.get("formations") or []
    vehicles = sorted((forms[0].get("formationVehicles") or []) if forms else [], key=lambda v: v.get("position") or 0)
    if not vehicles:
        return {"found": False}
    cars = {"numbers": [_evn(v) or "" for v in vehicles], "classes": [_klass(v) for v in vehicles],
            "models": [(v.get("vehicleIdentifier") or {}).get("typeCodeName") or "" for v in vehicles],
            "orders": [v.get("number") or 0 for v in vehicles], "complete": True}
    stops = []
    for f in answer.get("formationsAtScheduledStops") or []:
        st = f.get("scheduledStop") or {}
        pt, tm = st.get("stopPoint") or {}, st.get("stopTime") or {}
        if st.get("stopType") in ("D", "+D", "-H"):  # passed, or an operational stop
            continue
        short = (f.get("formationShort") or {}).get("formationShortString") or ""
        sectors = "".join(sorted(set(re.findall(r"@([A-Z])", short))))
        track = st.get("track")
        stops.append({"name": pt.get("name"), "uic": pt.get("uic"), "arr": _iso(tm.get("arrivalTime")), "dep": _iso(tm.get("departureTime")),
                      "platform": None if track in (None, "", "N/A") else str(track), "sectors": sectors or None})
    return {"found": True, "formation": True, "number": str(number), "date": date, "evu": evu, "cars": cars, "stops": stops}


_asked = []  # the times this copy went upstream for a formation, in the last minute
FORMATIONS_PER_MINUTE = 30


def relay_fetch(env, source_id, query=None):
    """The live feed's compact answer, or one train's formation (query:
    {"train", "date", "from"}): the same bytes as relay/feeds/switzerland.js."""
    if source_id == "switzerland":
        out = compact(_get(GTFS_RT, env["CH_GTFSRT_KEY"]))
        return json.dumps(out, separators=(",", ":")).encode(), "application/json"
    evu = EVUS[source_id] or OTHER_EVUS.get((query or {}).get("from", ""))
    now = time.time()
    _asked[:] = [t for t in _asked if now - t < 60]
    out = {"found": False}
    if evu and len(_asked) < FORMATIONS_PER_MINUTE:
        _asked.append(now)
        q = urllib.parse.urlencode({"evu": evu, "operationDate": query["date"], "trainNumber": query["train"]})
        try:
            out = formation(json.loads(_get(f"{FORMATION}?{q}", env["CH_FORMATION_KEY"])), query["train"], query["date"], evu)
        except urllib.error.HTTPError as err:
            if err.code not in (400, 404):  # 404: no formation for it; 400: no such train for this railway that day
                raise
    return json.dumps(out, ensure_ascii=False, separators=(",", ":")).encode(), "application/json"
