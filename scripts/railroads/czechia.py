"""Czechia: the passenger trains on Správa železnic's network, as five
railroads (České dráhy, RegioJet, Leo Express, Arriva and GW Train Regio).
Positions and stop times come from the Oběhy project's GTFS-realtime feed
for the whole network (cz-czptt-gtfs-rt.pb: SŽ's train map, PID's and DÚK's
positions), through the relay (the feed sends no CORS headers), and the
timetable from its GTFS of the national CZPTT timetable. One feed has every
operator's trains: the parser (js/railroads/czechia.js) tells them apart by
train number in each railroad's timetable (data/schedules/<railroad>.json),
which also leaves out what isn't a passenger train of theirs (empty stock,
rail replacement buses, other operators)."""

import re

GTFS_URL = "https://motis.obehy.cz/get-feeds/cz-czptt-gtfs.zip"
CREDIT = {"label": "Oběhy (SŽ, CIS JŘ)", "href": "https://motis.obehy.cz/get-feeds/"}
BBOX = [12.09, 48.55, 18.86, 51.06]
COMMON = {"region": "Czechia", "country": "CZ", "tz": "Europe/Prague", "credit": CREDIT, "license": None, "bbox": BBOX}

AGENCIES = {
    "czcd": {"name": "České dráhy", "short": "ČD", "color": "#1c64b4", "kind": "intercity", **COMMON},
    "czregiojet": {"name": "RegioJet", "short": "RegioJet", "color": "#e5b800", "kind": "intercity", "after": "czcd", **COMMON},
    "czleo": {"name": "Leo Express", "short": "Leo Express", "color": "#b8862b", "kind": "intercity", "after": "czregiojet", **COMMON},
    "czarriva": {"name": "Arriva vlaky", "short": "Arriva", "color": "#00a3a6", "kind": "commuter", "after": "czleo", **COMMON},
    "czgwtrain": {"name": "GW Train Regio", "short": "GW Train", "color": "#3c8d3f", "kind": "commuter", "after": "czarriva", **COMMON},
}
SOURCES = [{"id": "czechia", "agencies": list(AGENCIES), "format": "pb", "interval": 30, "relay": True, "needsKey": False,
            "scope": "view"}]
# The feed is rebuilt every 10 s and sent with no-store; a 30 s edge cache
# asks Oběhy at most 120 times an hour, however many viewers there are.
RELAY = {"czechia": {"url": "https://motis.obehy.cz/get-feeds/cz-czptt-gtfs-rt.pb", "ua": True, "ttl": 30}}

# Each railroad's CZPTT carrier codes (agency.txt's "czptt:agency:<code>"):
# RegioJet files its Ústí trains and some long-distance ones under other
# companies, Leo Express its Zlín-region trains under Leo Express Tenders.
CARRIERS = {"czcd": {"1154"}, "czregiojet": {"3246", "3752", "3949", "3990"}, "czleo": {"3616", "3725"},
            "czarriva": {"3189"}, "czgwtrain": {"3288"}}
# Trains only (GTFS's extended rail types): not the rail replacement buses
# (714, "NAD"), nor empty stock moves ("Sv").
RAIL_TYPES = {"100", "101", "102", "103", "105", "106", "107", "109"}
# Trains with no line of their own are named by their kind, as timetables print it.
KINDS = {"Os": "Osobní", "Sp": "Spěšný", "R": "Rychlík", "Ex": "Expres", "IC": "InterCity", "EC": "EuroCity",
         "SC": "SuperCity", "rj": "railjet", "RJ": "RegioJet", "LE": "Leo Express", "EN": "EuroNight", "NJ": "Nightjet"}


def keep(agency):
    return lambda r: (r["agency_id"].rsplit(":", 1)[-1] in CARRIERS[agency] and r["route_type"] in RAIL_TYPES
                      and not r["route_short_name"].startswith("Sv "))


def line(r):
    """"S4" (a line route), else the train's kind: "Os 5542" -> "Osobní"."""
    name = re.sub(r"\s*\(NAD\)$", "", r["route_short_name"])
    if ":line:" in r["route_id"]:
        return name
    kind = name.split(" ")[0]
    return KINDS.get(kind, kind)


# "Os 5542" is train 5542, as the live feed labels it.
number = lambda t: re.sub(r"^\D+", "", t.get("trip_short_name") or "") or None

GTFS = {a: (GTFS_URL, keep(a), line, {"number": number}) for a in AGENCIES}

# Main and branch lines inside Czechia (not the neighbours' inside the box).
RAIL = {"region": "cz", "bbox": BBOX, "network": "czcd",
        "query": 'area["ISO3166-1"="CZ"]["admin_level"="2"]->.cz;'
                 'way["railway"="rail"]["usage"~"^(main|branch)$"][!"service"](area.cz)({bbox});'}
