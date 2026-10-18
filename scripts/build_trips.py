"""Build data/trips.json: stop and trip lookups for railroads whose realtime
feeds (through the relay) carry only IDs: Caltrain, SMART, Metrolink, RTD,
CapMetro and Metra.

Trips are [number, headsign] (plus {stop_sequence: stop_id} where the realtime
feed gives only sequences). Their realtime feeds (through the relay) carry only stop and trip IDs, so the
map needs each railroad's static GTFS to name stops, match them to the
stations on the map, and give trains a number and destination. Run
occasionally (timetables change a few times a year):

    python3 scripts/build_trips.py
    python3 scripts/build_trips.py vre sounder   # just these, into the existing file
    python3 scripts/build_trips.py --only capmetro   # a plug-in's railroads (scripts/railroads/)

A feed that fails keeps that railroad's lookups from the last build. A
railroad outside the US and Canada goes to data/regions/<region>/trips.json
instead (feeds.REGION), which its parser reads with js/regiondata.js's
tripsOf().
"""
import re
from feeds import EXTRAS, GTFS, chosen, get_zip, read_split, rows as csv_rows, write_split

# The station IDs the map uses (data/stations.json), per railroad: some use
# parent stations, others platforms.
STATIONS = {a: {r[0] for r in rows} for a, rows in read_split("stations.json").items()}

# Each railroad's timetable (build_stations.py's, but Metra's own file), and
# the routes to keep for agencies whose feed also covers buses.
url_of = lambda agency: GTFS[agency][0]
FEEDS = {
    "caltrain": (url_of("caltrain"), None),
    "smart": (url_of("smart"), None),
    "metrolink": (url_of("metrolink"), None),
    "rtd": (url_of("rtd"), {"A", "113B", "113G", "117N"}),
    "capmetro": (url_of("capmetro"), {"550"}),
    "metra": ("https://schedules.metrarail.com/gtfs/schedule.zip", None),
    "marc": (url_of("marc"), None),
    "frontrunner": (url_of("frontrunner"), {"41065"}),  # UTA's feed also covers TRAX and buses
    "vre": (url_of("vre"), None),
    "sounder": (url_of("sounder"), {"SNDR_EV", "SNDR_TL"}),  # not Link
    "ace": (url_of("ace"), None),  # 511's copy of ACE's timetable
}
# The plug-ins' railroads whose live feeds give only ids: "trips", the
# routes to keep (True: all).
for _agency, _extras in EXTRAS.items():
    if _extras.get("trips") and _agency not in FEEDS:
        FEEDS[_agency] = (url_of(_agency), None if _extras["trips"] is True else set(_extras["trips"]))
# Some feeds (Metra) put a space after every comma.
rows = lambda zf, name: csv_rows(zf, name, spaces=True)


def headsign(h):
    # "550 Downtown Station SB" -> "Downtown Station"
    return re.sub(r"\s+(NB|SB|EB|WB)$", "", re.sub(r"^\d+\s+", "", h.strip()))


def build(agency, url, routes):
    fold = GTFS[agency][3] if len(GTFS.get(agency, ())) > 3 else None
    zf = get_zip(url, timeout=120, attempts=1, page_link=False)
    # MARC's headsigns are bare city names in capitals ("BALTIMORE"),
    # FrontRunner's read "To Ogden"; their trains' last stops name their
    # destinations better.
    trips = {r["trip_id"]: [r.get("trip_short_name") or "", "" if agency in ("marc", "frontrunner") else headsign(r.get("trip_headsign") or "")]
             for r in rows(zf, "trips.txt") if routes is None or r["route_id"] in routes}
    # Only the stops those trips use (a whole bus network's stops would be huge).
    used = None
    if routes is not None:
        used = set()
        for r in rows(zf, "stop_times.txt"):
            if r["trip_id"] in trips:
                used.add(r["stop_id"])
                # UTA's trip updates name stops only by their place in the trip,
                # so FrontRunner trips carry their stops by sequence.
                if agency in SEQUENCED:
                    if len(trips[r["trip_id"]]) < 3:
                        trips[r["trip_id"]].append({})
                    trips[r["trip_id"]][2][r["stop_sequence"]] = r["stop_id"]
    raw = {r["stop_id"]: r for r in rows(zf, "stops.txt") if r.get("stop_lat")}
    # Each stop (platforms included) points at its station: the parent station
    # where there is one, which is the ID the map's station list uses.
    stops = {}
    for sid, r in raw.items():
        if used is not None and sid not in used:
            continue
        parent = r.get("parent_station") or sid
        known = STATIONS.get(agency, set())
        station = parent if parent in known or sid not in known else sid
        # FrontRunner's timetable includes crew relief points; only stations count.
        if agency in SEQUENCED and station not in known:
            continue
        p = raw.get(parent, r)
        name = p["stop_name"].strip()
        if fold:  # stops fold into one station by name (MARC's per direction)
            station, name = fold(name)
        if agency == "sounder":  # "Kent Sounder Station" -> "Kent"
            name = re.sub(r"(\s+Sounder)?(\s+Station)?$", "", name)
        if agency == "ace":  # "Tracy Station" -> "Tracy", as in data/stations.json
            name = {"San Jose Station Diridon": "San Jose Diridon", "Stockton - Robert J Cabral Station": "Stockton"}.get(name, re.sub(r"\s+Station$", "", name))
        stops[sid] = [name, round(float(p["stop_lat"]), 5), round(float(p["stop_lon"]), 5), station]
        # Some realtime feeds use stop codes instead of IDs.
        if r.get("stop_code") and r["stop_code"] not in stops:
            stops[r["stop_code"]] = stops[sid]
    return {"stops": stops, "trips": trips}


SEQUENCED = {"frontrunner"}
only = chosen()
previous = read_split("trips.json")  # with the regions' (feeds.REGION)
out = dict(previous) if only else {}
for k, (u, routes) in FEEDS.items():
    if only and k not in only:
        continue
    try:
        out[k] = build(k, u, routes)
    except Exception as err:  # keep going, with the last build's lookups for this one
        if k in previous:
            out[k] = previous[k]
        print(f"{k}: FAILED {err}; {len(previous.get(k, {}).get('trips', {}))} trips kept from the last build")
path = write_split("trips.json", out)
print(f"wrote {path} ({path.stat().st_size // 1024} KB)")
for k, v in out.items():
    print(f"  {k}: {len(v['stops'])} stops, {len(v['trips'])} trips")
