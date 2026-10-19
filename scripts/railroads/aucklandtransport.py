"""Auckland's trains: AT Metro's suburban lines and Te Huia (Hamilton to
Auckland), from Auckland Transport's open data. AT's GTFS-realtime (vehicle
positions and trip updates in one feed) comes through the relay, which
holds the free key it needs (AT_API_KEY, sent in an
Ocp-Apim-Subscription-Key header; register at https://dev-portal.at.govt.nz
and subscribe to the Realtime API). Until it is set the feed is off and both
railroads' trains are placed from their timetables, marked as estimated.

The feed covers AT's buses and ferries too: the relay keeps only the trains
(relay_fetch below, and its Worker twin relay/feeds/aucklandtransport.js).
It reports every three-car unit of a train as a vehicle of its own (ids
59xxx, labels "AMP        123"), the trip on one of them only; the others
are kept too, so the parser can tell a six-car train from a three-car one.
AT's trip updates name one stop only (the next) beside the trip's delay, so
a train's stops come from its run in data/schedules/<railroad>.json,
shifted by that delay.

AT publishes no train numbers to riders. Its trip ids carry the train
descriptor its timetable and feed share ("258-880001-24480-2-W022490-d3db1efa":
train W022, its unit's run 490), and that names each train; a trip
renumbered on the way (the South-City Line's loop through the City Rail
Link, "A004B007140") keeps its first. The parser is
js/railroads/aucklandtransport.js."""
import re
import urllib.request

CREDIT = {"label": "Auckland Transport", "href": "https://at.govt.nz/about-us/at-data-sources"}
# Colors: AT's own blue (its design system's primary, at.govt.nz); Te Huia's
# carriages are grey (the route's color in AT's file is black, which the map
# can't show on a dark background).
AGENCIES = {
    "atmetro": {"name": "AT Metro", "short": "AT Metro", "region": "Auckland", "country": "NZ", "color": "#2d7caf",
                "kind": "commuter", "tz": "Pacific/Auckland", "credit": CREDIT, "license": "CC BY 4.0",
                "bbox": [174.55, -37.25, 175.0, -36.8], "cars": True},
    "tehuia": {"name": "Te Huia", "short": "Te Huia", "region": "Hamilton–Auckland", "country": "NZ", "color": "#5b6770",
               "kind": "intercity", "tz": "Pacific/Auckland", "credit": CREDIT, "license": "CC BY 4.0",
               "bbox": [174.75, -37.8, 175.3, -36.8], "cars": True, "after": "atmetro"},
}
# A key allows 35,000 requests a week (and 600 a minute). The relay asks for
# the combined feed (positions and trip updates in one answer, one request)
# at most once a minute from each Worker instance, whatever the number of
# viewers: 10,080 a week for an instance busy around the clock, so three at
# once (Auckland's and a couple abroad) stay within the limit, the trains
# running some 20 hours a day and the feed fetched only while someone has
# them on screen. AT refreshes it every 30 s; a position is never more than
# 90 s old.
SOURCES = [{"id": "aucklandtransport", "agencies": ["atmetro", "tehuia"], "format": "pb", "interval": 30, "relay": True,
            "needsKey": "AT_API_KEY", "untilKey": "timetable", "scope": "view"}]
RELAY = {"aucklandtransport": {"keys": ["AT_API_KEY"], "ttl": 60}}

FEED = "https://api.at.govt.nz/realtime/legacy"
# The trains' routes, by AT's route ids ("E-W-201", "HUIA-404"): the lines
# since the City Rail Link opened, and their names before it, should a trip
# still carry one.
TRAIN_ROUTE = re.compile(r"^(E-W|O-W|S-C|HUIA|WEST|EAST|STH|ONE|PUK)-")
# A train's units, by their vehicle ids (59xxx) or labels ("AMP        123",
# the AM class): kept with no trip as well, for coupled units.
TRAIN_ID = re.compile(r"^59\d{3}$")
TRAIN_LABEL = re.compile(r"^AM")


def _varint(b, i):
    v = shift = 0
    while True:
        x = b[i]
        i += 1
        v |= (x & 0x7F) << shift
        shift += 7
        if not x & 0x80:
            return v, i


def _fields(b, start, end):
    """Each field of b[start:end] as (field, wire, value start, value end,
    field end)."""
    i = start
    while i < end:
        s = i
        key, i = _varint(b, i)
        f, w = key >> 3, key & 7
        if w == 0:
            vs = i
            _, i = _varint(b, i)
            ve = i
        elif w == 1:
            vs, i = i, i + 8
            ve = i
        elif w == 5:
            vs, i = i, i + 4
            ve = i
        elif w == 2:
            n, vs = _varint(b, i)
            i = ve = vs + n
        else:
            return
        yield f, w, vs, ve, s, i


def _child(b, start, end, field):
    return next(((vs, ve) for f, w, vs, ve, _, _ in _fields(b, start, end) if f == field and w == 2), None)


def _text(b, span, field):
    x = span and _child(b, span[0], span[1], field)
    return b[x[0]:x[1]].decode("utf-8", "replace") if x else ""


def keep_trains(b):
    """The feed with only its trains' entities (and its header): a vehicle or
    trip update on a train route, a train unit with no trip, and the trip
    update of any train unit's trip. Entities are copied byte for byte."""
    parts, ents, trips = [], [], set()
    for f, w, vs, ve, s, e in _fields(b, 0, len(b)):
        if f != 2 or w != 2:
            parts.append(b[s:e])
            continue
        tu, vp = _child(b, vs, ve, 3), _child(b, vs, ve, 4)
        trip = (vp and _child(b, vp[0], vp[1], 1)) or (tu and _child(b, tu[0], tu[1], 1))
        desc = vp and _child(b, vp[0], vp[1], 8)
        unit = bool(desc) and bool(TRAIN_ID.match(_text(b, desc, 1)) or TRAIN_LABEL.match(_text(b, desc, 2)))
        if unit and _text(b, trip, 1):
            trips.add(_text(b, trip, 1))
        ents.append((s, e, tu, unit or bool(TRAIN_ROUTE.match(_text(b, trip, 5))), _text(b, trip, 1)))
    # In the feed's order, after the header.
    parts += [b[s:e] for s, e, tu, train, trip_id in ents if train or (tu and trip_id in trips)]
    return b"".join(parts)


def relay_fetch(env, source_id):
    """AT's combined feed, its trains alone: the same bytes as
    relay/feeds/aucklandtransport.js."""
    req = urllib.request.Request(FEED, headers={"Ocp-Apim-Subscription-Key": env["AT_API_KEY"],
                                                "Accept": "application/x-protobuf", "User-Agent": "Trainsheet relay"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return keep_trains(r.read()), "application/x-protobuf"


# The lines AT has run since the City Rail Link opened (route ids E-W, O-W
# and S-C, as AT abbreviates them), named as on its network map; Te Huia
# (Waikato Regional Council's, route HUIA) by its own name.
LINES = {"E-W": "East-West Line", "O-W": "Onehunga-West Line", "S-C": "South-City Line", "HUIA": "Te Huia"}
line = lambda r: LINES.get(r["route_short_name"].strip(), r["route_long_name"].strip())
# A trip id's fifth part is its train descriptor(s) and the run of the unit
# working it: "W022490" is train W022 on run 490, "A004B007140" train A004
# renumbered B007 on the way (the run's trains: a letter and three digits, or
# a digit, a letter and two, as in "1W86552"). Te Huia's is its trip's
# number with "99" after it ("199": 1, "1299": 12). Unique on each day:
# checked on the October 2026 timetable, 28 days.
DESCRIPTORS = re.compile(r"^((?:\d[A-Z]\d{2}|[A-Z]\d{3})+)\d+$")


def number(t):
    part = t["trip_id"].split("-")[4] if t["trip_id"].count("-") >= 5 else t["trip_id"]
    m = DESCRIPTORS.match(part)
    if m:
        return re.match(r"\d?[A-Z]\d{2,3}", m.group(1)).group(0)
    return part[:-2] if part.endswith("99") and len(part) > 2 else part


# AT's whole timetable (buses and ferries too): the trains are route type 2,
# AT Metro's (agency AM) and Te Huia's (WRC). Each station is filed with its
# platforms as stops of their own ("Waitemata Train Station 4"); their ids
# change with every timetable ("133-08da14b5"), so the platforms fold by
# name into one station each ("Waitemata", signed Waitematā).
FOLD = {"strip": r"\s+Train Station(\s+\d+)?$"}
NAMES = {"Waitemata": "Waitematā"}
GTFS = {
    "atmetro": ("https://gtfs.at.govt.nz/gtfs.zip", lambda r: r.get("route_type") == "2" and r.get("agency_id") == "AM", line,
                {"fold": FOLD, "names": NAMES, "number": number}),
    "tehuia": ("https://gtfs.at.govt.nz/gtfs.zip", lambda r: r.get("route_type") == "2" and r.get("agency_id") == "WRC", line,
               {"fold": FOLD, "names": NAMES, "number": number, "colors": {"Te Huia": "#5b6770"}}),
}
# Auckland's suburban lines and the North Island Main Trunk to Hamilton, as
# OpenStreetMap's route relations of AT Metro's and Te Huia's trains.
RAIL = {"region": "nz", "bbox": [174.5, -37.85, 175.35, -36.75], "network": "atmetro",
        "relations": {"operator": "Auckland One Rail|Transdev Auckland|KiwiRail|Te Huia", "network": "AT Metro|Auckland Transport|Te Huia"}}
