"""North Macedonia: MŽ Transport's trains (Македонски Железници Транспорт),
from the community GTFS published by deryclem on GitHub
(gtfs-north-macedonia.zip: keyless, converted from MŽ Transport's published
timetables — MŽ publishes no GTFS itself). No live feed is read: the trains
are placed from the timetable (a "timetable" source, no parser file),
marked estimated. The feed is downloaded fresh at each build; this edition
(234,163 B, fetched 2026-11-23) runs 2026-09-01 -> 2027-12-11 (feed_info,
version 20261017) — a fifteen-month window, so the Monday refresh has room.

The feed is one agency (MZT, Europe/Skopje), 5 routes, 34 trips, 103
stops, 467 stop times. Route types are all 2 (rail); there are no buses,
so every route is kept. Its route_long_name is the ends joined by " – "
("Скопје – Куманово"), and the feed's translations.txt gives the same
names in English for every stop and route (and the agency), so the plug-in
reads it in English (Israel's precedent): stations are "Skopje", "Veles",
"Bitola" and the lines "Skopje – Bitola". Its trips carry the train
number as trip_short_name ("641", "2020", "3081"). Services are
calendar.txt only (daily + weekdays_no_sunday); there is no
calendar_dates.txt. stop_times carry pickup/drop-off 0 throughout, so
every listed stop is a call; no times run past midnight.

The 103 stops include whole lines with no passenger service in this
timetable (Skopje–Kičevo via Tetovo and Gostivar, Veles–Štip–Kočani,
Skopje–Tabanovce to the Serbian border): only the 54 stops the 34 trips
call at become stations. The five routes: R1 Skopje–Kumanovo (4 trips),
R2 Skopje–Veles (4), R3 Skopje–Gevgelija (4), R4 Skopje–Bitola, one
pair of trips running through to Žabeni (6), R5 Skopje–Zelenikovo, the
city train (16). Each route's colour is filed per route and kept.

Rolling stock (from the photos, not the feed — it names none): the
electrified lines run the CRRC 411 EMUs and the RVR 412 EMUs and
441/461 electrics with coaches; Veles–Bitola is diesel, 661s with the
red/yellow coaches. The 712 DMUs ran the Kičevo and Kočani branches,
which have no service in this timetable.

Stations: the feed has no parent stations or platforms; stops are the
stations, named as signed in Latin through translations.txt ("Skopje",
"Veles"); no two used stops fold into one id in this edition. Times are
North Macedonia's (Europe/Skopje).

P2 spot check: train 641, Skopje 07:06 -> Bitola 10:31 arr (on to Žabeni
10:44) via Veles 07:57 arr and Prilep 09:42 arr; train 611, Skopje 06:20 ->
Gevgelija 08:59 via Veles 07:22."""
import re, unicodedata

GTFS_URL = "https://github.com/deryclem/gtfs-north-macedonia/raw/main/gtfs-north-macedonia.zip"
TZ = "Europe/Skopje"
CREDIT = {"label": "Timetable from GitHub deryclem/gtfs-north-macedonia (community GTFS, converted from MŽ Transport's published timetables; MŽ publishes no GTFS itself)",
          "href": "https://github.com/deryclem/gtfs-north-macedonia"}
# North Macedonia, from Tabanovce on the Serbian border to Gevgelija on
# the Greek border, Kičevo in the west to Kočani in the east; the box is
# sized to the stops the trips call at (Gevgelija 40.95N, Kumanovo 42.13N).
BBOX = [20.9, 40.8, 23.0, 42.3]
COMMON = {"region": "North Macedonia", "country": "MK", "tz": TZ, "credit": CREDIT, "license": None, "bbox": BBOX,
          "clip": True}

AGENCIES = {
    "mzt": {"name": "Македонски Железници Транспорт", "short": "MŽ Transport", "color": "#c62828", "kind": "intercity",
            "cars": "mzt", **COMMON},
}
SOURCES = [{"id": "northmacedonia", "agencies": list(AGENCIES), "format": "timetable", "interval": 60, "scope": "view"}]

# The feed's only route type is 2 (rail); every route is kept.
TRAIN_TYPES = {"2"}


def keep(agency):
    return lambda r: r["route_type"] in TRAIN_TYPES


HUB = "Skopje"


def line(r):
    """The route's ends, hub-first ("Skopje – Bitola"), else alphabetical,
    so both directions share one line."""
    name = (r.get("route_long_name") or "").strip()
    parts = [p.strip() for p in name.split(" – ")]
    if len(parts) >= 2 and all(parts) and parts[0] != parts[-1]:
        ends = [parts[0], parts[-1]]
        if HUB in ends:
            ends.sort(key=lambda e: e != HUB)
        else:
            ends.sort()
        return " – ".join(ends)
    return (r.get("route_short_name") or "").strip() or AGENCIES["mzt"]["name"]


# The train's number as the feed prints it ("641", "2020", "3081").
number = lambda t: (t.get("trip_short_name") or "").strip() or None


def station(name):
    """(station id, name): "Skopje" -> ("skopje", "Skopje"); "Lisiče" ->
    ("lisice", "Lisiče"). The feed's translations.txt gives the names in
    Latin; a name in another script than Latin would keep its letters
    (feeds.slug's rule)."""
    name = name.strip()
    low = name.lower()
    if all(c.isascii() or unicodedata.name(c, "").startswith("LATIN") for c in low if c.isalnum()):
        plain = unicodedata.normalize("NFKD", low).encode("ascii", "ignore").decode()
        return re.sub(r"[^a-z0-9]+", "-", plain).strip("-"), name
    return re.sub(r"-+", "-", "".join(c if c.isalnum() or unicodedata.combining(c) else "-"
                                      for c in unicodedata.normalize("NFC", low))).strip("-"), name


GTFS = {a: (GTFS_URL, keep(a), line, station,
            {"translations": "en", "number": number, "tz": TZ})
        for a in AGENCIES}

# North Macedonia's track (P3): OpenStreetMap's mainline track in the box,
# routed from the timetables.
RAIL = {"region": "mk", "bbox": BBOX, "network": "mzt"}
