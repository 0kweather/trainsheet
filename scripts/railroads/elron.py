"""Elron (AS Eesti Liinirongid, Estonia's passenger trains): positions from
the live map on Elron's own site (elron.ee/map_data.json: each running
train's number, line, times its run starts and ends, position, heading,
speed, last stop passed and minutes late), through the relay (the site sends
no CORS headers). Stops come from the ministry's CC0 timetable for Elron,
which numbers no trains, so the parser finds each train's run by those
times (else by its line, position and delay); the parser is
js/railroads/elron.js."""

import re

AGENCIES = {
    "elron": {"name": "Elron", "short": "Elron", "region": "Estonia", "country": "EE", "color": "#ff711d",
              "kind": "commuter", "tz": "Europe/Tallinn",
              "credit": {"label": "Elron, Regionaal- ja Põllumajandusministeerium", "href": "https://elron.ee"},
              "license": "CC0 (timetable)", "bbox": [24.0, 56.9, 28.3, 59.5], "cars": True},
}
# The site's own map asks every 2 s while it is open; the positions move every
# few seconds. A poll every 30 s while Estonia is in view, and the relay's 15 s
# cache keeps the site at 240 requests an hour at most however many watch (its
# answer says it keeps for two weeks, which the relay ignores).
SOURCES = [{"id": "elron", "agencies": ["elron"], "format": "json", "interval": 30, "relay": True, "needsKey": False,
            "scope": "view"}]
RELAY = {"elron": {"url": "https://elron.ee/map_data.json", "ua": True, "ttl": 15}}

# Each line as Elron names it ("Tallinn - Tartu"), from the end that isn't
# Tallinn's or Tartu's; express runs and their variants are the same line.
# The live map names the lines the same way, and the parser puts both right
# with the same rule.
HUBS = ("Tallinn", "Tartu")
ENDS = {"Piusa": "Koidula", "Riia": "Rīga", "Tartu / Valga": "Tartu"}


def line(r):
    a, _, b = re.sub(r"\s*\(.*?\)", "", r["route_long_name"]).strip().partition("-")
    a, b = ENDS.get(a.strip(), a.strip()), ENDS.get(b.strip(), b.strip())
    if b in HUBS and a not in HUBS or b == "Tallinn":
        a, b = b, a
    return f"{a}–{b}"


# The file lists every bus stop in Estonia too, and a folded station takes the
# first stop of its name, which for these is a bus stop of the same name
# (Raasiku's in Tartu county): placed at their platforms instead.
POSITIONS = {
    "arukula": [59.37204, 25.07894], "jarve": [59.40091, 24.7249], "janeda": [59.2549, 25.70751],
    "kabala": [59.34492, 26.675], "kadrina": [59.33809, 26.14554], "karevere": [58.72527, 25.51811],
    "karkna": [58.45791, 26.65912], "karu": [58.83415, 25.14393], "kiltsi": [59.08781, 26.17663],
    "kirsi": [58.35744, 26.71532], "koidula": [57.83695, 27.57528], "laagri": [59.35466, 24.62771],
    "lagedi": [59.39953, 24.932], "laokula": [59.3332, 24.13449], "liiva": [59.38775, 24.72325],
    "lohu": [59.11538, 24.78715], "magiste": [58.01098, 26.23121], "manniku": [59.33879, 24.70159],
    "narva": [59.36882, 28.19806], "nomme": [59.38619, 24.68697], "orava": [57.91982, 27.47344],
    "oru": [59.37464, 27.57544], "parila": [59.3569, 25.26672], "pedja": [58.82688, 26.34548],
    "peedu": [58.23721, 26.44865], "piusa": [57.84001, 27.46753], "raasiku": [59.36566, 25.17432],
    "rahumae": [59.38876, 24.70346], "rebase": [58.23846, 26.80947], "reola": [58.27162, 26.77137],
    "riisipere": [59.11955, 24.31218], "ruusa": [58.04243, 27.27344], "sangaste": [57.8641, 26.18907],
    "surgavere": [58.48777, 25.53707], "tallinn-vaike": [59.413, 24.74609], "turba": [59.0762, 24.24053],
    "valdeku": [59.37558, 24.72041], "vastse-kuuste": [58.17363, 26.93228], "veriora": [58.00606, 27.3536],
}

# Every route is a train's (route_type 2). Each station is two stops, one per
# direction, with no parent: folded by name. The through train to Rīga stops
# at five Latvian stations, named as Vivi signs them.
GTFS = {
    "elron": ("https://eu-gtfs.remix.com/elron.zip", lambda r: r.get("route_type") == "2", line,
              {"fold": {"strip": r"\s+$"}, "positions": POSITIONS,
               "names": {"Riia raudteejaam": "Rīga", "Cesis": "Cēsis"}}),
}

# OSM's train routes that Elron runs, in Estonia (the track on to Rīga is
# Latvia's, which Vivi's region draws).
RAIL = {"region": "ee", "bbox": [21.7, 57.5, 28.3, 59.7], "network": "elron",
        "relations": {"operator": "Elron|Eesti Liinirongid", "network": "Elron"}}
